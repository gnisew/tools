/* Soundit 匯出：Ogg/Opus 與 AAC（ADTS）編碼
 * 使用瀏覽器內建 WebCodecs 的 AudioEncoder，不需額外 wasm。
 *   PKAudioEditor._deps.webEnc.isSupported ( 'opus' | 'aac' ) -> Promise<boolean>
 *   PKAudioEditor._deps.webEnc.encode ( opts )                -> Promise<Blob>
 * opts: {
 *   format:'opus'|'aac', sampleRate, channels(1|2), kbps,
 *   left:Float32Array, right:Float32Array|null, samples,
 *   tags:{title,artist,album,track}（選填，僅 Opus 使用）, onprogress(0~100), isCancelled()
 * }
 * Opus 一律 48000Hz；AAC 輸出為 .aac（ADTS 裸流，多數播放器可直接播放）。
 */
(function ( w, PKAE ) {
	'use strict';

	var FORMATS = {
		opus: { codec: 'opus', mime: 'audio/ogg', extra: { opus: { application: 'audio', frameDuration: 20000 } } },
		aac:  { codec: 'mp4a.40.2', mime: 'audio/aac', extra: { aac: { format: 'adts' } } }
	};

	var AAC_RATES = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];

	function hasEncoder () {
		return typeof w.AudioEncoder === 'function' && typeof w.AudioData === 'function';
	}

	function buildConfig ( fmt, sample_rate, channels, kbps, with_extra ) {
		var def = FORMATS[ fmt ];
		var cfg = {
			codec: def.codec,
			sampleRate: sample_rate,
			numberOfChannels: channels,
			bitrate: Math.max (6, kbps / 1 || 128) * 1000
		};
		if (with_extra) {
			for (var k in def.extra) cfg[ k ] = def.extra[ k ];
		}
		return cfg;
	}

	/* 先帶額外參數（ADTS、application）測試，不支援再退回基本設定 */
	function findConfig ( fmt, sample_rate, channels, kbps ) {
		if (!hasEncoder () || !FORMATS[ fmt ]) return Promise.resolve (null);

		var full = buildConfig ( fmt, sample_rate, channels, kbps, true );
		var plain = buildConfig ( fmt, sample_rate, channels, kbps, false );

		return w.AudioEncoder.isConfigSupported ( full ).then (function ( res ) {
			if (res && res.supported) return full;
			return w.AudioEncoder.isConfigSupported ( plain ).then (function ( res2 ) {
				return res2 && res2.supported ? plain : null;
			});
		}).catch (function () { return null; });
	}

	function isSupported ( fmt ) {
		var rate = fmt === 'opus' ? 48000 : 44100;
		return findConfig ( fmt, rate, 2, 128 ).then (function ( cfg ) { return !!cfg; });
	}

	/* ---------- Ogg 封裝 ---------- */

	var crc_table = null;
	function crc32Ogg ( bytes ) {
		if (!crc_table) {
			crc_table = new Uint32Array (256);
			for (var i = 0; i < 256; ++i) {
				var r = i << 24;
				for (var j = 0; j < 8; ++j)
					r = (r & 0x80000000) ? ((r << 1) ^ 0x04C11DB7) : (r << 1);
				crc_table[ i ] = r >>> 0;
			}
		}
		var crc = 0;
		for (var n = 0; n < bytes.length; ++n)
			crc = ((crc << 8) ^ crc_table[ ((crc >>> 24) & 0xFF) ^ bytes[ n ] ]) >>> 0;
		return crc >>> 0;
	}

	function oggPage ( header_type, granule, serial, seq, packets ) {
		var lacing = [];
		var data_len = 0;
		var i, p, n;

		for (i = 0; i < packets.length; ++i) {
			n = packets[ i ].length;
			while (n >= 255) { lacing.push (255); n -= 255; }
			lacing.push (n);
			data_len += packets[ i ].length;
		}

		var page = new Uint8Array (27 + lacing.length + data_len);
		var dv = new DataView (page.buffer);

		page[0] = 0x4F; page[1] = 0x67; page[2] = 0x67; page[3] = 0x53; /* OggS */
		page[4] = 0;
		page[5] = header_type;
		dv.setUint32 (6, granule % 4294967296, true);
		dv.setUint32 (10, Math.floor (granule / 4294967296), true);
		dv.setUint32 (14, serial, true);
		dv.setUint32 (18, seq, true);
		dv.setUint32 (22, 0, true);
		page[26] = lacing.length;
		page.set (lacing, 27);

		var off = 27 + lacing.length;
		for (p = 0; p < packets.length; ++p) {
			page.set (packets[ p ], off);
			off += packets[ p ].length;
		}

		dv.setUint32 (22, crc32Ogg ( page ), true);
		return page;
	}

	function strBytes ( s ) {
		var a = new Uint8Array (s.length);
		for (var i = 0; i < s.length; ++i) a[ i ] = s.charCodeAt (i) & 0xFF;
		return a;
	}

	function OggOpusMuxer ( channels, input_rate, pre_skip, tag ) {
		var serial = (Math.random () * 4294967295) >>> 0;
		var seq = 0;
		var pages = [];
		var pending = [];
		var pending_samples = 0;
		var granule = 0;
		var last_page_granule = 0;
		var total = 0;

		/* 注意：Ogg 規定標頭頁與音訊頁要分開 */
		var head = new Uint8Array (19);
		var hv = new DataView (head.buffer);
		head.set (strBytes ('OpusHead'), 0);
		head[8] = 1;
		head[9] = channels;
		hv.setUint16 (10, pre_skip, true);
		hv.setUint32 (12, input_rate, true);
		hv.setUint16 (16, 0, true);
		head[18] = 0;
		pages.push (oggPage ( 0x02, 0, serial, seq++, [head] ));

		/* OpusTags：廠商字串 + Vorbis comment（UTF-8，KEY=值） */
		var te = new TextEncoder ();
		var vendor = te.encode ('Soundit');
		var comments = [];
		if (tag) {
			var map = { title: 'TITLE', artist: 'ARTIST', album: 'ALBUM', track: 'TRACKNUMBER' };
			for (var key in map)
				if (tag[ key ]) comments.push ( te.encode ( map[ key ] + '=' + tag[ key ] ) );
		}
		var tag_len = 8 + 4 + vendor.length + 4;
		for (var c = 0; c < comments.length; ++c) tag_len += 4 + comments[ c ].length;

		var tags = new Uint8Array (tag_len);
		var tv = new DataView (tags.buffer);
		tags.set (strBytes ('OpusTags'), 0);
		tv.setUint32 (8, vendor.length, true);
		tags.set (vendor, 12);
		var to = 12 + vendor.length;
		tv.setUint32 (to, comments.length, true);
		to += 4;
		for (var c2 = 0; c2 < comments.length; ++c2) {
			tv.setUint32 (to, comments[ c2 ].length, true);
			tags.set (comments[ c2 ], to + 4);
			to += 4 + comments[ c2 ].length;
		}
		pages.push (oggPage ( 0x00, 0, serial, seq++, [tags] ));

		function flush ( is_last, final_granule ) {
			if (!pending.length) return ;
			var g = is_last ? Math.max (last_page_granule, final_granule) : granule;
			pages.push (oggPage ( is_last ? 0x04 : 0x00, g, serial, seq++, pending ));
			last_page_granule = g;
			pending = [];
			pending_samples = 0;
		}

		this.addPacket = function ( bytes, samples ) {
			pending.push (bytes);
			granule += samples;
			pending_samples += samples;
			total += samples;
			/* 約 1 秒一頁（或單頁 segment 數將滿時）換頁 */
			if (pending.length >= 50 || pending_samples >= 48000) flush ( false );
		};

		this.finish = function ( input_samples ) {
			flush ( true, pre_skip + input_samples );
			return new Blob ( pages, { type: 'audio/ogg' } );
		};

		this.totalSamples = function () { return total; };
	}

	/* ---------- ADTS 封裝（編碼器若已輸出 ADTS 則直接用） ---------- */

	function adtsHeader ( frame_len, object_type, freq_index, channels ) {
		var h = new Uint8Array (7);
		var len = frame_len + 7;
		h[0] = 0xFF;
		h[1] = 0xF1; /* MPEG-4, layer 0, 無 CRC */
		h[2] = (((object_type - 1) & 3) << 6) | ((freq_index & 15) << 2) | ((channels >> 2) & 1);
		h[3] = ((channels & 3) << 6) | ((len >> 11) & 3);
		h[4] = (len >> 3) & 0xFF;
		h[5] = ((len & 7) << 5) | 0x1F;
		h[6] = 0xFC;
		return h;
	}

	function isAdts ( bytes ) {
		return bytes.length > 7 && bytes[0] === 0xFF && (bytes[1] & 0xF0) === 0xF0;
	}

	/* ---------- 主要編碼流程 ---------- */

	function sleep ( ms ) {
		return new Promise (function ( res ) { setTimeout ( res, ms ); });
	}

	function encode ( opts ) {
		var fmt = opts.format;
		var rate = opts.sampleRate;
		var ch = opts.channels === 2 && opts.right ? 2 : 1;
		var total = opts.samples;
		var cancelled = opts.isCancelled || function () { return false; };

		return findConfig ( fmt, rate, ch, opts.kbps ).then (function ( cfg ) {
			if (!cfg) throw new Error ('unsupported');

			var encoder_error = null;
			var muxer = null;
			var pre_skip = 312;
			var aac_chunks = [];
			var aac_info = null; /* 裸 AAC 時才需要 */
			var first_aac = true;
			var aac_raw = false;

			function onChunk ( chunk, meta ) {
				var bytes = new Uint8Array (chunk.byteLength);
				chunk.copyTo ( bytes );

				if (fmt === 'opus') {
					if (!muxer) {
						var desc = meta && meta.decoderConfig && meta.decoderConfig.description;
						if (desc) {
							var d = new Uint8Array (desc.buffer ? desc.buffer : desc, desc.byteOffset || 0, desc.byteLength);
							if (d.length >= 12 && d[0] === 0x4F && d[1] === 0x70) /* "Op" */
								pre_skip = d[10] | (d[11] << 8);
						}
						muxer = new OggOpusMuxer ( ch, 48000, pre_skip, opts.tags );
					}
					var samples = chunk.duration ? Math.round (chunk.duration * 48000 / 1000000) : 960;
					muxer.addPacket ( bytes, samples );
					return ;
				}

				/* AAC */
				if (first_aac) {
					first_aac = false;
					aac_raw = !isAdts ( bytes );
					if (aac_raw) {
						var obj = 2, fi = AAC_RATES.indexOf ( rate );
						var dsc = meta && meta.decoderConfig && meta.decoderConfig.description;
						if (dsc) {
							var a = new Uint8Array (dsc.buffer ? dsc.buffer : dsc, dsc.byteOffset || 0, dsc.byteLength);
							if (a.length >= 2) {
								obj = a[0] >> 3;
								fi = ((a[0] & 7) << 1) | (a[1] >> 7);
							}
						}
						aac_info = { obj: obj || 2, fi: fi < 0 ? 4 : fi };
					}
				}
				if (aac_raw) aac_chunks.push ( adtsHeader ( bytes.length, aac_info.obj, aac_info.fi, ch ) );
				aac_chunks.push ( bytes );
			}

			var encoder = new w.AudioEncoder ({
				output: onChunk,
				error: function ( e ) { encoder_error = e; }
			});
			encoder.configure ( cfg );

			var BLOCK = 48000;
			var pos = 0;

			function step () {
				if (encoder_error) throw encoder_error;
				if (cancelled ()) {
					try { encoder.close (); } catch (e) {}
					return Promise.resolve (null);
				}
				if (pos >= total) return Promise.resolve (true);

				if (encoder.encodeQueueSize > 8) {
					return sleep (10).then ( step );
				}

				var n = Math.min (BLOCK, total - pos);
				var planar = new Float32Array (n * ch);
				planar.set ( opts.left.subarray (pos, pos + n), 0 );
				if (ch === 2) planar.set ( opts.right.subarray (pos, pos + n), n );

				var ad = new w.AudioData ({
					format: 'f32-planar',
					sampleRate: rate,
					numberOfFrames: n,
					numberOfChannels: ch,
					timestamp: Math.round (pos / rate * 1000000),
					data: planar
				});
				encoder.encode ( ad );
				ad.close ();
				pos += n;

				opts.onprogress && opts.onprogress ( pos / total * 90 );
				return sleep (0).then ( step );
			}

			return step ().then (function ( ok ) {
				if (!ok) return null;
				return encoder.flush ().then (function () {
					if (encoder_error) throw encoder_error;
					try { encoder.close (); } catch (e) {}
					opts.onprogress && opts.onprogress ( 98 );

					if (fmt === 'opus') {
						if (!muxer) throw new Error ('no data');
						return muxer.finish ( total );
					}
					if (!aac_chunks.length) throw new Error ('no data');
					return new Blob ( aac_chunks, { type: 'audio/aac' } );
				});
			});
		});
	}

	PKAE._deps.webEnc = {
		hasEncoder: hasEncoder,
		isSupported: isSupported,
		encode: encode,
		/* 僅供測試 */
		_OggOpusMuxer: OggOpusMuxer,
		_crc32Ogg: crc32Ogg,
		_adtsHeader: adtsHeader
	};

})( window, PKAudioEditor );


