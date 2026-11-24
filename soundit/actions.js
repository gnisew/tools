(function( PKAE ) {
	'use strict';

	function AudioUtils ( master, wavesurfer ) {

		var audio_destination = wavesurfer.backend.analyser;
		var audio_ctx   = wavesurfer.backend.ac;
		var preview_meter_raf = 0;
		var fadeGain = master.fadeGain;

		/* [階段 3] 編輯連動：改動緩衝區「之前」通知標記模組位移（見 markers.js 的 editShift）。
		 * mrk_quiet > 0 表示外層（Replace）已經整批處理，內層的 Trim／Insert 不要重複位移。 */
		var mrk_quiet = 0;
		function mrkShift ( kind, at, len, len2 ) {
			if (mrk_quiet) return ;
			try { master.mrk && master.mrk.editShift && master.mrk.editShift ( kind, at, len, len2 ); } catch (e) {}
		}

		function loadDecoded ( new_buffer ) {
			wavesurfer.loadDecodedBuffer ( new_buffer );
			master.fireEvent ('DidUpdateLen', wavesurfer.getDuration ());
		};

		function OverwriteBufferWithSegment (_offset, _duration, withBuffer ) {

			/* [階段 3] 取代 = 先移除再插入；長度有變時（例如變速）整批位移一次，範圍內的標記依比例伸縮 */
			var sr = wavesurfer.backend.buffer.sampleRate;
			mrkShift ('replace', (((_offset/1) * sr) >> 0) / sr, (((_duration/1) * sr) >> 0) / sr, withBuffer.length / sr);
			var ret;
			mrk_quiet++;
			try {
				TrimBuffer( _offset, _duration, true );
				ret = InsertSegmentToBuffer ( _offset, withBuffer );
			}
			finally { mrk_quiet--; }

			setTimeout (function() {
				wavesurfer.drawBuffer();
			},40);

			return (ret);
		}

		function OverwriteBuffer ( withBuffer ) {
			loadDecoded ( withBuffer );
			setTimeout (function() {
				wavesurfer.drawBuffer();
			},40);
		}

		function MakeSilenceBuffer ( _duration ) {
			var originalBuffer = wavesurfer.backend.buffer;
			var emptySegment = wavesurfer.backend.ac.createBuffer(
				originalBuffer.numberOfChannels,
				_duration * originalBuffer.sampleRate,
				originalBuffer.sampleRate
			);

			return (emptySegment);
		}

		function CopyBufferSegment( _offset, _duration ) {
			var originalBuffer = wavesurfer.backend.buffer;

			var new_len    = ((_duration/1) * originalBuffer.sampleRate) >> 0;
			var new_offset = ((_offset/1)   * originalBuffer.sampleRate) >> 0;

			var emptySegment = wavesurfer.backend.ac.createBuffer (
				wavesurfer.SelectedChannelsLen,
				new_len,
				originalBuffer.sampleRate
			);

			for (var i = 0, u = 0; i < wavesurfer.ActiveChannels.length; ++i) {
				if (wavesurfer.ActiveChannels[ i ] === 0) continue;

				emptySegment.getChannelData ( u ).set (
					originalBuffer.getChannelData ( i ).slice ( new_offset, new_len + new_offset )
				);

				++u;
			}
			return (emptySegment);
		};

		function AnalyzeLoudness( _offset, _duration ) {
			if (!PKAE._deps.lufs) return (null);
			return PKAE._deps.lufs.analyze (CopyBufferSegment (_offset, _duration));
		};

		function TrimBuffer( _offset, _duration, force ) {
			var originalBuffer = wavesurfer.backend.buffer;

			var new_len    = ((_duration/1) * originalBuffer.sampleRate) >> 0;
			var new_offset = ((_offset/1)   * originalBuffer.sampleRate) >> 0;

			var emptySegment = wavesurfer.backend.ac.createBuffer (
				!force ? wavesurfer.SelectedChannelsLen : originalBuffer.numberOfChannels,
				new_len,
				originalBuffer.sampleRate
			);

			var uberSegment = null;

			if (!force && wavesurfer.SelectedChannelsLen < originalBuffer.numberOfChannels)
			{
				uberSegment = wavesurfer.backend.ac.createBuffer (
					originalBuffer.numberOfChannels,
					originalBuffer.length,
					originalBuffer.sampleRate
				);

				for (var i = 0; i < originalBuffer.numberOfChannels; ++i) {
					var chan_data = originalBuffer.getChannelData ( i );
					var uber_chan_data = uberSegment.getChannelData ( i );

					if (wavesurfer.ActiveChannels[ i ] === 0)
					{
						uber_chan_data.set (
							chan_data
						);
					}
					else
					{
						var segment_chan_data = emptySegment.getChannelData (0);

						segment_chan_data.set (
							chan_data.slice ( new_offset, new_offset + new_len )
						);

						uber_chan_data.set (
							chan_data.slice ( 0, new_offset )
						);

						uber_chan_data.set (
							chan_data.slice ( new_offset + new_len ), new_offset + new_len
						);
					}
				}
			}
			else
			{
				uberSegment = wavesurfer.backend.ac.createBuffer(
					originalBuffer.numberOfChannels,
					originalBuffer.length - new_len,
					originalBuffer.sampleRate
				);

				for (var i = 0; i < originalBuffer.numberOfChannels; ++i) {
					var chan_data = originalBuffer.getChannelData(i);
					var segment_chan_data = emptySegment.getChannelData(i);
					var uber_chan_data = uberSegment.getChannelData(i);

					segment_chan_data.set (
						chan_data.slice ( new_offset, new_offset + new_len )
					);

					uber_chan_data.set (
						chan_data.slice ( 0, new_offset )
					);

					uber_chan_data.set (
						chan_data.slice ( new_offset + new_len ), new_offset
					);
				}
			}

			/* [階段 3] 只有長度真的變短才位移（只改選取聲道時長度不變） */
			if (uberSegment.length !== originalBuffer.length)
				mrkShift ('remove', new_offset / originalBuffer.sampleRate, new_len / originalBuffer.sampleRate);

			loadDecoded ( uberSegment, originalBuffer );

			return (emptySegment);
		};

		function InsertSegmentToBuffer( _offset, buffer ) {
			var originalBuffer = wavesurfer.backend.buffer;
			var uberSegment = wavesurfer.backend.ac.createBuffer(
				originalBuffer.numberOfChannels,
				originalBuffer.length + buffer.length,
				originalBuffer.sampleRate
			);

			_offset = ((_offset / 1) * originalBuffer.sampleRate) >> 0;

			for (var i = 0; i < originalBuffer.numberOfChannels; ++i) {

				var chan_data = originalBuffer.getChannelData( i );
				var uberChanData = uberSegment.getChannelData( i );
				var segment_chan_data = null;

				if (buffer.numberOfChannels === 1)
					segment_chan_data = buffer.getChannelData( 0 );
				else
					segment_chan_data = buffer.getChannelData( i );

				if (wavesurfer.SelectedChannelsLen === 1)
				{

					if (wavesurfer.ActiveChannels[ i ] === 0)
					{

						uberChanData.set (
							chan_data
						);

						continue;
					}
				}

				if (_offset > 0)
				{
					uberChanData.set (
						chan_data.slice ( 0, _offset )
					);
				}

				uberChanData.set (
					segment_chan_data, _offset
				);

				if (_offset < (originalBuffer.length + buffer.length) )
				{
					uberChanData.set (
						chan_data.slice( _offset ), _offset + segment_chan_data.length
					);
				}
			}

			mrkShift ('insert', _offset / originalBuffer.sampleRate, buffer.length / originalBuffer.sampleRate);	/* [階段 3] */
			loadDecoded ( uberSegment, originalBuffer );

			return [
				(_offset / originalBuffer.sampleRate),
				(_offset / originalBuffer.sampleRate) + (buffer.length / originalBuffer.sampleRate)
			];
		};

		/* [修改] ReplaceFloatArrays：
		 *  1. 總長度改成「各段長度實際加總」。原本用「第一段長度 × 段數」，錄音最後一段比較短時，
		 *     會多蓋掉後面一小段原本的內容（最多約一個緩衝區，約 85 毫秒）。
		 *  2. 支援立體聲：arrays.right 是右聲道的片段（與 arrays 逐段等長）時，
		 *     文件第 2 聲道（索引 1）寫入 arrays.right，其餘聲道寫入 arrays（左）。
		 *     沒有 .right（單聲道錄音）時行為與原本相同：同一份資料寫進每個聲道。 */
		function ReplaceFloatArrays ( _offset, arrays ) {
			var originalBuffer = wavesurfer.backend.buffer;
			var arr_len = arrays.length;

			var new_len = 0;
			for (var k = 0; k < arr_len; ++k) new_len += arrays[ k ].length;

			/* [新增] 右聲道必須與左聲道逐段等長才採用，否則忽略（退回雙單聲道） */
			var rights = arrays.right;
			if (rights && rights.length === arr_len) {
				for (var r = 0; r < arr_len; ++r) {
					if (rights[ r ].length !== arrays[ r ].length) { rights = null; break; }
				}
			}
			else rights = null;

			var buff_len = originalBuffer.length;

			_offset = ((_offset / 1) * originalBuffer.sampleRate) >> 0;

			if (buff_len < (_offset + new_len)) {
				buff_len = (_offset + new_len);
			}

			var uberSegment = wavesurfer.backend.ac.createBuffer (
				originalBuffer.numberOfChannels,
				buff_len,
				originalBuffer.sampleRate
			);

			for (var i = 0; i < originalBuffer.numberOfChannels; i++) {
				var chan_data = originalBuffer.getChannelData( i );
				var uberChanData = uberSegment.getChannelData( i );
				var src = (i === 1 && rights) ? rights : arrays;   /* [新增] 第 2 聲道用右聲道資料 */

				if (_offset > 0)
				{
					uberChanData.set (
						chan_data.slice ( 0, _offset )
					);
				}

				var pos = _offset;   /* [修改] 逐段累加位置，不再用「段序 × 第一段長度」 */
				for (var j = 0; j < arr_len; ++j)
				{
					uberChanData.set (
						src[ j ], pos
					);
					pos += src[ j ].length;
				}

				if (_offset < (originalBuffer.length + new_len) )
				{
					uberChanData.set (
						chan_data.slice( _offset + new_len ), _offset + new_len
					);
				}
			}

			loadDecoded ( uberSegment, originalBuffer );

			return [
				(_offset / originalBuffer.sampleRate),
				(_offset / originalBuffer.sampleRate) + (new_len / originalBuffer.sampleRate)
			];
		};

		function InsertFloatArrays( _offset, arrays ) {
			var originalBuffer = wavesurfer.backend.buffer;
			var arr_len = arrays.length;
			var arr_samples = arrays[0].length;

			var new_len = (arr_samples * arr_len);

			_offset = ((_offset / 1) * originalBuffer.sampleRate) >> 0;

			var uberSegment = wavesurfer.backend.ac.createBuffer(
				originalBuffer.numberOfChannels,
				originalBuffer.length + new_len,
				originalBuffer.sampleRate
			);

			for (var i = 0; i < originalBuffer.numberOfChannels; i++) {
				var chan_data = originalBuffer.getChannelData( i );
				var uberChanData = uberSegment.getChannelData( i );

				if (_offset > 0)
				{
					uberChanData.set (
						chan_data.slice ( 0, _offset )
					);
				}

				for (var j = 0; j < arr_len; ++j)
				{
					uberChanData.set (
						arrays[ j ], _offset + (j * arr_samples)
					);
				}

				if (_offset < (originalBuffer.length + new_len) )
				{
					uberChanData.set (
						chan_data.slice( _offset ), _offset + new_len
					);
				}
			}

			mrkShift ('insert', _offset / originalBuffer.sampleRate, new_len / originalBuffer.sampleRate);	/* [階段 3] */
			loadDecoded ( uberSegment, originalBuffer );

			return [
				(_offset / originalBuffer.sampleRate),
				(_offset / originalBuffer.sampleRate) + (new_len / originalBuffer.sampleRate)
			];
		};

		function getAudioContext() {
			if (!window.WaveSurferAudioContext) {
				window.WaveSurferAudioContext = new (window.AudioContext ||
					window.webkitAudioContext)();
			}
			return window.WaveSurferAudioContext;
		}
		function getOfflineAudioContext (channels, sampleRate, duration) {
			return new (window.OfflineAudioContext ||
					window.webkitOfflineAudioContext)(channels, duration, sampleRate);
		};

		function initPreview (val) {
			this.previewVal = val;
		};

		function stopPreviewMeter () {
			if (preview_meter_raf) {
				cancelAnimationFrame ( preview_meter_raf );
				preview_meter_raf = 0;
			}
		}

		function stopPreview (_fx) {
			if (!this.previewing) return ;

			var source = this.PreviewSource;

			if (_fx) try { _fx.destroy && _fx.destroy (); } catch (e) {}
			try { this.PreviewTog && this.PreviewTog (false, source); } catch (e) {}

			if (this.PreviewFilter)
			{
				if (this.PreviewFilter.length > 0)
				{
					for (var ii = 0; ii < this.PreviewFilter.length; ++ii)
						try { this.PreviewFilter[ ii ].disconnect (); } catch (e) {}
				}
				else
					try { this.PreviewFilter.disconnect (); } catch (e) {}
			}

			stopPreviewMeter ();
			try { wavesurfer.backend.scriptNode.connect (audio_ctx.destination); } catch (e) {}

			try { source && source.stop(); } catch (e) {}
			try { source && source.disconnect (); } catch (e) {}

			this.PreviewDestination = this.PreviewSource = this.PreviewFilter = this.PreviewUpdate = this.PreviewTog = null;
			this.previewing = 0;
		}
		function togglePreview () {
			if (!this.previewing) {

				this.previewVal = !this.previewVal;
				return (this.previewVal);
			}

			if (this.previewing === 2)
			{

				if (this.PreviewTog) {
					this.PreviewTog (false, this.PreviewSource);
				}

				this.PreviewSource.disconnect ();
				this.PreviewSource.connect (this.PreviewDestination);
				this.previewing = 1;
				this.previewVal = false;

				return (false);
			}
			else
			{
				this.PreviewSource.disconnect ();

				if (this.PreviewFilter)
				{
					if (this.PreviewFilter.length > 0)
					{
						!this.PreviewFilter[ 0 ]._pk_own && !this.PreviewFilter[ 0 ].buffer && this.PreviewSource.connect (this.PreviewFilter[ 0 ]);

					}
					else
					{
						!this.PreviewFilter.buffer && this.PreviewSource.connect (this.PreviewFilter);
						this.PreviewFilter.disconnect ();
						this.PreviewFilter.connect (this.PreviewDestination);
					}
				}

				if (this.PreviewTog) {
					this.PreviewTog (true, this.PreviewSource);
				}

				this.previewing = 2;
				this.previewVal = true;

				return (true);
			}
		}

		function previewEffect ( _offset, _duration, _fx, _seek ) {
			if (this.previewing) stopPreview.call (this, _fx);

			var orig_buffer = wavesurfer.backend.buffer;

			if (!_offset && !_duration)
			{
				_offset = 0;
				_duration = (orig_buffer.length / orig_buffer.sampleRate) >> 0;
			}

			var fx_buffer = CopyBufferSegment (_offset, _duration);
			var audio_ctx = wavesurfer.backend.ac || getAudioContext ();
			var source = audio_ctx.createBufferSource ();
			var seek = _seek / 1 || 0;
			seek = Math.max (0, Math.min (seek, fx_buffer.duration - 1 / fx_buffer.sampleRate));
			source.buffer = fx_buffer;
			source.loop = true;
			source._pkSeek = seek;

			this.PreviewFilter = this.PreviewTog = null;
			if (!_fx)
				source.connect (audio_destination);
			else
			{
				this.PreviewTog    = _fx.preview;
				this.PreviewUpdate = _fx.update;
				this.PreviewFilter = _fx.filter ( audio_ctx, audio_destination, source, _duration/1, true, seek );
			}

			stopPreviewMeter ();
			wavesurfer.backend.scriptNode.disconnect ();

			var skipp = 1;
			var prev_fft = 0;
			var dataArray = null;

			var meterTick = function ( ts ) {
				if (!preview_meter_raf) return ;
				preview_meter_raf = requestAnimationFrame ( meterTick );

				var loudness = [0, 0];
				var temp = 0;

				--skipp;

				if (skipp === 0)
				{
					if (audio_destination.getFloatTimeDomainData)
					{
						if (prev_fft !== audio_destination.fftSize)
						{
		                	dataArray = new Float32Array(audio_destination.fftSize);
		                	prev_fft = audio_destination.fftSize;
		                }
		                audio_destination.getFloatTimeDomainData (dataArray);

		                for (var j = 0; j < audio_destination.fftSize; j += 1) {
		                    var x = dataArray[j];
		                    if (Math.abs(x) >= temp) {
		                        temp = Math.abs(x);
		                    }
		                }

		                loudness[0] = 20 * Math.log10(temp) + 0.001;
					}
					else
					{
						if (prev_fft !== audio_destination.fftSize)
						{
		                	dataArray = new Uint8Array(audio_destination.fftSize);
		                	prev_fft = audio_destination.fftSize;
		                }
		                audio_destination.getByteTimeDomainData (dataArray);

		                var total_float = 0;

						for (var j = 0; j < audio_destination.fftSize; j += 1) {
						    var float = ( dataArray[j] / 0x80 ) - 1;
						    total_float += ( float * float );
						}
						var rms = Math.sqrt (total_float / audio_destination.fftSize);
						loudness[0] = 20 * ( Math.log(rms) / Math.log(10) );
					}

	                if (loudness[0] < -100) loudness[0] = -100;
	                loudness[1] = loudness[0];

					audio_destination.getByteFrequencyData( wavesurfer.backend.FreqArr );

					master.fireEvent ('DidAudioProcess',[-1, loudness, ts], wavesurfer.backend.FreqArr);

					skipp = 1;
				}
			};
			preview_meter_raf = requestAnimationFrame ( meterTick );

			source._pkStart = audio_ctx.currentTime;
			source.start (0, seek);

			this.PreviewSource = source;
			this.PreviewDestination = audio_destination;
			this.previewing = 2;

			if (!this.previewVal)
			{
				togglePreview.call (this);
			}

			return (source);
		}

		function previewBuffer ( buffer, _seek ) {
			if (this.previewing) stopPreview.call (this);

			var audio_ctx = wavesurfer.backend.ac || getAudioContext ();
			var source = audio_ctx.createBufferSource ();
			var seek = _seek / 1 || 0;
			seek = Math.max (0, Math.min (seek, buffer.duration - 1 / buffer.sampleRate));
			source.buffer = buffer;
			source.loop = true;
			source.connect (audio_destination);
			source.start (0, seek);

			this.PreviewFilter = this.PreviewTog = this.PreviewUpdate = null;
			this.PreviewSource = source;
			this.PreviewDestination = audio_destination;
			this.previewing = 2;

			return (source);
		}

		function findZero ( data, i, dir, max, slope ) {
			var any = -1;
			for (var n = 0; n < max; ++n, i += dir) {
				if (i < 1 || i >= data.length - 1) break;
				if ((data[i - 1] <= 0 && data[i] >= 0) || (data[i - 1] >= 0 && data[i] <= 0)) {
					if (any < 0) any = i;
					if (!slope || (data[i + 1] - data[i - 1]) * slope > 0) return (i);
				}
			}
			return (any);
		}

		function seamlessBuffer ( buffer, val ) {
			val = val || {};
			var data = buffer.getChannelData (0);
			var start = 0, end = buffer.length;

			if (val.trim) {
				var pad = (buffer.sampleRate / 1000) >> 0;
				while (start < end - 8 && Math.abs (data[start]) < 0.0007) ++start;
				while (end > start + 8 && Math.abs (data[end - 1]) < 0.0007) --end;
				if (end > start + 8) {
					start = Math.max (0, start - pad);
					end = Math.min (buffer.length, end + pad);
				}
				else {
					start = 0;
					end = buffer.length;
				}
			}

			var max = Math.min ((buffer.sampleRate / 100) >> 0, (end - start) >> 3);

			if (val.snap && max > 2) {
				var z1 = findZero (data, start + 1, 1, max, 0);
				var slope = z1 > 0 ? data[z1 + 1] - data[z1 - 1] : 0;
				var z2 = findZero (data, end - 2, -1, max, slope);
				if (z1 > 0 && z2 > z1 + 8) {
					start = z1;
					end = z2 + 1;
				}
			}

			var len = end - start;
			var fade = Math.min (((val.fade || 0) * buffer.sampleRate / 1000) >> 0, len >> 2);
			var out = audio_ctx.createBuffer (buffer.numberOfChannels, len - fade, buffer.sampleRate);

			for (var ch = 0; ch < buffer.numberOfChannels; ++ch) {
				var src = buffer.getChannelData (ch);
				var dst = out.getChannelData (ch);
				var i = 0;

				for (; i < fade; ++i) {
					var p = i / (fade - 1 || 1);
					dst[i] = src[start + i] * Math.sin (p * 1.570796) +
						src[end - fade + i] * Math.cos (p * 1.570796);
				}
				for (; i < dst.length; ++i)
					dst[i] = src[start + i];
			}

			var repeat = Math.max (1, Math.min (64, (val.repeat || 1) >> 0));
			if (repeat < 2) return (out);

			var ret = audio_ctx.createBuffer (out.numberOfChannels, out.length * repeat, out.sampleRate);
			for (var ch = 0; ch < out.numberOfChannels; ++ch) {
				var src = out.getChannelData (ch);
				var dst = ret.getChannelData (ch);
				for (var n = 0; n < repeat; ++n)
					dst.set (src, n * src.length);
			}

			return (ret);
		}

		function seamlessLoop ( _offset, _duration, val ) {
			return seamlessBuffer (CopyBufferSegment (_offset, _duration), val);
		}

		function applyEffect( _offset, _duration, _fx ) {
			var orig_buffer = wavesurfer.backend.buffer;

			if (!_offset && !_duration)
			{
				_offset = 0;
				_duration = (orig_buffer.length / orig_buffer.sampleRate) >> 0;
			}

			if (_offset <0) _offset = 0;
			if (wavesurfer.getDuration () < _duration)
				_duration  = wavesurfer.getDuration ();

			var fx_buffer = CopyBufferSegment ( _offset, _duration );
			var new_offset = ((_offset/1)   * orig_buffer.sampleRate) >> 0;

			var audio_ctx = getOfflineAudioContext (
					wavesurfer.SelectedChannelsLen,
					orig_buffer.sampleRate,
					fx_buffer.length
			);

			var source = audio_ctx.createBufferSource ();
			source.buffer = fx_buffer;

			var filter = null;
			if (_fx) {
				filter = _fx.filter ( audio_ctx, audio_ctx.destination, source, _duration/1 );
				filter.destroy && filter.destroy ();
			}

			source.start ();

			var offline_callback = function( rendered_buffer ) {
				var uber_buffer = wavesurfer.backend.ac.createBuffer(
					orig_buffer.numberOfChannels,
					orig_buffer.length,
					orig_buffer.sampleRate
				);

				for (var i = 0; i < orig_buffer.numberOfChannels; ++i)
				{
					var uber_chan_data = uber_buffer.getChannelData (i);
					var chan_data = orig_buffer.getChannelData (i);

					if (wavesurfer.ActiveChannels[ i ] === 0)
					{
						uber_chan_data.set (
							chan_data
						);
						continue;
					}

					var fx_chan_data = null;
					if (rendered_buffer.numberOfChannels === 1)
						fx_chan_data = rendered_buffer.getChannelData( 0 );
					else
						fx_chan_data = rendered_buffer.getChannelData( i );

					uber_chan_data.set (
						chan_data
					);

					uber_chan_data.set (
						fx_chan_data, new_offset, fx_chan_data.length - new_offset
					);
				}

				loadDecoded ( uber_buffer );

				if (filter.length > 0) {
					for (var i = 0; i < filter.length; ++i) filter[i].disconnect ();
				} else filter && filter.disconnect && filter.disconnect ();

				rendered_buffer = fx_buffer = filter = null;
				source.disconnect ();

			};

			var offline_renderer = audio_ctx.startRendering();
			if (offline_renderer)
				offline_renderer.then( offline_callback ).catch(function(err) {
					console.error('Rendering failed: ' + err);
				});
			else
				audio_ctx.oncomplete = function ( e ) {
					offline_callback ( e.renderedBuffer );
				};
		};

		var worker = null;
		function DownloadFileCancel () {
			if (worker) {
				worker.terminate ();
				worker = null;
			}
		}

		function DownloadFile( with_name, format, kbps, selection, stereo, bit_depth, dither, callback, source_buffer, target_rate, blob_sink, tag, loud ) {
			var originalBuffer = source_buffer ||
				(wavesurfer && wavesurfer.backend && wavesurfer.backend.buffer);
			if (!originalBuffer) {
				return false;
			}

			/* [新增] opus / aac 走瀏覽器 WebCodecs（主執行緒），不使用 Worker；
			 * 用一個只有 terminate 的替身物件，讓取消流程沿用 DownloadFileCancel */
			var web_fmt = (format === 'opus' || format === 'aac');
			var web_cancel = false;

			if (web_fmt) {
				if (!PKAE._deps.webEnc || !PKAE._deps.webEnc.hasEncoder ()) {
					master.fireEvent ('ShowError', PKLocale.t ('export.codec_unsupported', {fmt: format}));
					callback && callback ('done');
					return false;
				}
				worker = { terminate: function () { web_cancel = true; } };
			}
			else if (format === 'mp3') {
				worker = new Worker('lame.js');
			}
			else if (format === 'flac') {
				worker = new Worker('flac.js');
			}
			else {
				worker = new Worker('wav.js');
			}

			var sample_rate = originalBuffer.sampleRate;

			/* [新增] 匯出取樣率：opus 固定 48000；mp3 / aac 上限 48000；0 或未指定＝維持原檔 */
			var out_rate = sample_rate;
			if (format === 'opus') out_rate = 48000;
			else if (target_rate / 1) out_rate = target_rate / 1;
			if ((format === 'mp3' || format === 'aac') && out_rate > 48000) out_rate = 48000;

			var channels = originalBuffer.numberOfChannels;

			var data_left = originalBuffer.getChannelData ( 0 );
			var data_right = null;
			var mono_right = null;
			if (channels === 2)
				data_right = originalBuffer.getChannelData ( 1 );

			if (!source_buffer && !stereo && channels === 2)
			{
				if (!wavesurfer.ActiveChannels[0] && wavesurfer.ActiveChannels[1])
				{
					data_left  = originalBuffer.getChannelData ( 1 );
					data_right = null;
					channels   = 1;
				}
			}

			if (stereo && !data_right)
			{
				data_right = data_left;
				channels   = 2;
			}
			else if (!stereo && data_right)
			{
				if (source_buffer || !wavesurfer.ActiveChannels ||
					(wavesurfer.ActiveChannels[0] && wavesurfer.ActiveChannels[1]))
				{
					mono_right = data_right;
				}
				data_right = null;
				channels   = 1;
			}

			var len = data_left.length, i = 0;
			var offset = 0;

			if (selection)
			{
				offset = (selection[0] * sample_rate) >> 0;
				len = ((selection[1] * sample_rate) >> 0) - offset;
			}

			var wav_bits = format === 'wav' ? ((bit_depth / 1) || 16) : (web_fmt ? 32 : 16);
			if (wav_bits !== 16 && wav_bits !== 24 && wav_bits !== 32) wav_bits = 16;
			var wav_dither = format === 'wav' && wav_bits === 16 && !!dither;
			var ArrType = wav_bits === 32 ? Float32Array : wav_bits === 24 ? Int32Array : Int16Array;

			var dataArrLeft = new ArrType(len);
			var dataArrRight = data_right ? new ArrType(len) : null;
			var encode_base = 10;
			var last_progress = -1;

			function convert16 ( n ) {
				 var v = n < 0 ? n * 32768 : n * 32767;
				 return Math.max(-32768, Math.min(32767, v));
			}
			function convert16dith ( n ) {
				 var v = (n < 0 ? n * 32768 : n * 32767) + (Math.random () - Math.random ());
				 return Math.max(-32768, Math.min(32767, Math.round (v)));
			}
			function convert24 ( n ) {
				 var v = n < 0 ? n * 8388608 : n * 8388607;
				 return Math.max(-8388608, Math.min(8388607, Math.round (v)));
			}
			var convert = wav_bits === 32 ? null :
			              wav_bits === 24 ? convert24 :
			              wav_dither ? convert16dith :
			              convert16;
			function progress ( val ) {
				val = Math.max (0, Math.min (99, val >> 0));
				if (val === last_progress) return ;
				last_progress = val;
				callback && callback ( val );
			}

			worker.onmessage = function( ev ) {
				if (ev.data.percentage)
				{
					progress ( encode_base + (ev.data.percentage * (100 - encode_base) / 100) );
					return ;
				}
				forceDownload( ev.data );

				worker.terminate ();
				worker = null;
			}

			function fillChunk () {
				if (!worker) return ;
				var end = Math.min (len, i + 262144);
				if (convert) {
					if (data_right) {
						while(i < end) {
							dataArrLeft[i] = convert(data_left[offset + i]);
							dataArrRight[i] = convert(data_right[offset + i]);
							++i;
						}
					}
					else if (mono_right) {
						while(i < end) {
							dataArrLeft[i] = convert(
								(data_left[offset + i] + mono_right[offset + i]) * 0.5
							);
							++i;
						}
					}
					else {
						while(i < end) {
							dataArrLeft[i] = convert(data_left[offset + i]);
							++i;
						}
					}
				}
				else {
					if (data_right) {
						while(i < end) {
							dataArrLeft[i] = data_left[offset + i];
							dataArrRight[i] = data_right[offset + i];
							++i;
						}
					}
					else if (mono_right) {
						while(i < end) {
							dataArrLeft[i] = (data_left[offset + i] + mono_right[offset + i]) * 0.5;
							++i;
						}
					}
					else {
						while(i < end) {
							dataArrLeft[i] = data_left[offset + i];
							++i;
						}
					}
				}

				progress ((i / len) * encode_base);
				if (i < len) {
					setTimeout (fillChunk, 0);
					return ;
				}

				if (web_fmt) {
					PKAE._deps.webEnc.encode ({
						format: format,
						sampleRate: sample_rate,
						channels: channels,
						kbps: !kbps ? 128 : kbps,
						left: dataArrLeft,
						right: dataArrRight,
						samples: len,
						tags: tag,
						onprogress: function ( v ) { progress ( encode_base + (v * (100 - encode_base) / 100) ); },
						isCancelled: function () { return web_cancel; }
					}).then (function ( blob ) {
						if (web_cancel || !blob) return ;
						worker = null;
						forceDownload ( blob );
					}).catch (function ( err ) {
						if (web_cancel) return ;
						worker = null;
						master.fireEvent ('ShowError', PKLocale.t ('export.encode_failed') + ' ' + (err && err.message ? err.message : ''));
						callback && callback ('done');
					});
					return ;
				}

				worker.postMessage ({
					sample_rate: sample_rate,
					kbps:!kbps ? 128 : kbps,
					flac_compression: kbps,
					channels: channels,
					bit_depth: wav_bits,
					samples: len
				});
				worker.postMessage ( dataArrLeft.buffer, [dataArrLeft.buffer] );
				if (data_right)
					worker.postMessage ( dataArrRight.buffer, [dataArrRight.buffer] );
				else
					worker.postMessage (null);
			}

			/* [新增] 匯出前響度正規化：以實際輸出的內容量測 LUFS，套用增益（受真峰值上限限制） */
			function applyLoud () {
				var LU = PKAE._deps.lufs;
				if (!loud || !loud.target || !LU || !len) return ;
				try {
					var A = data_left.subarray (offset, offset + len);
					var B = data_right ? data_right.subarray (offset, offset + len) : null;
					if (mono_right) {
						var R = mono_right.subarray (offset, offset + len);
						var M = new Float32Array (len);
						for (var m = 0; m < len; ++m) M[m] = (A[m] + R[m]) * 0.5;
						A = M;
						mono_right = null;
					}
					var list = B ? [A, B] : [A];
					var rep = LU.analyze ({
						sampleRate: sample_rate, length: len, numberOfChannels: list.length,
						getChannelData: function ( c ) { return list[ c ]; }
					});
					if (!isFinite (rep.lufs)) { data_left = A; if (B) data_right = B; offset = 0; return ; }
					var g = LU.gainForTarget ( rep, loud.target, loud.ceiling ).gain;
					var outL = new Float32Array (len);
					for (var a = 0; a < len; ++a) outL[a] = A[a] * g;
					data_left = outL;
					if (B) {
						var outR = new Float32Array (len);
						for (var b = 0; b < len; ++b) outR[b] = B[b] * g;
						data_right = outR;
					}
					offset = 0;
				}
				catch (err) { console.error ('loudness normalize skipped:', err); }
			}

			function begin () {
				if (!worker) return ;
				applyLoud ();
				fillChunk ();
			}

			/* [新增] 取樣率轉換：用 OfflineAudioContext 逐聲道重新取樣後，再進入原本的轉檔流程 */
			function resampleChannel ( arr ) {
				var Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
				var new_len = Math.max (1, Math.round (len * out_rate / sample_rate));
				var ctx = new Ctx (1, new_len, out_rate);
				var buf = ctx.createBuffer (1, len, sample_rate);
				buf.copyToChannel (arr.subarray (offset, offset + len), 0, 0);
				var src = ctx.createBufferSource ();
				src.buffer = buf;
				src.connect (ctx.destination);
				src.start (0);
				return ctx.startRendering ().then (function ( rendered ) {
					return rendered.getChannelData (0).slice (0);
				});
			}

			function resampleAll () {
				var jobs = [ resampleChannel ( data_left ) ];
				if (data_right) jobs.push ( resampleChannel ( data_right ) );
				if (mono_right) jobs.push ( resampleChannel ( mono_right ) );

				return Promise.all ( jobs ).then (function ( r ) {
					var k = 1;
					data_left = r[0];
					if (data_right) data_right = r[ k++ ];
					if (mono_right) mono_right = r[ k++ ];

					offset = 0;
					len = data_left.length;
					sample_rate = out_rate;
					dataArrLeft = new ArrType (len);
					dataArrRight = data_right ? new ArrType (len) : null;
				});
			}

			if (out_rate !== sample_rate) {
				progress (1);
				resampleAll ().then (begin).catch (function ( err ) {
					worker && worker.terminate ();
					worker = null;
					master.fireEvent ('ShowError', PKLocale.t ('export.encode_failed') + ' ' + (err && err.message ? err.message : ''));
					callback && callback ('done');
				});
			}
			else
				begin ();

			return ;

			/* [新增] mp3 輸出前寫入 ID3v2（opus 的標籤已在編碼時寫入）；失敗則保留原檔 */
			function forceDownload ( blob ) {
				if (tag && format === 'mp3' && window.ID3v2 && blob.arrayBuffer) {
					blob.arrayBuffer ().then(function ( ab ) {
						return new Blob ([ window.ID3v2.WriteTags ( ab, tag ) ], { type: 'audio/mpeg' });
					}).catch(function () { return blob; }).then ( deliver );
					return ;
				}
				/* [新增] flac 輸出前寫入 Vorbis comment 區塊；失敗則保留原檔 */
				if (tag && format === 'flac' && blob.arrayBuffer) {
					blob.arrayBuffer ().then(function ( ab ) {
						return new Blob ([ flacWriteTags ( ab, tag ) ], { type: 'audio/flac' });
					}).catch(function () { return blob; }).then ( deliver );
					return ;
				}
				deliver ( blob );
			}

			/* [新增] 把 VORBIS_COMMENT 區塊插進 FLAC 的 metadata 串（STREAMINFO 之後）。
			 * 區塊標頭為大端序；Vorbis comment 內容的長度欄位為小端序。 */
			function flacWriteTags ( ab, tg ) {
				var src = new Uint8Array ( ab );
				if (src.length < 42 || src[0] !== 0x66 || src[1] !== 0x4c || src[2] !== 0x61 || src[3] !== 0x43) return ab;

				var te = new TextEncoder ();
				var vendor = te.encode ('Soundit');
				var map = { title: 'TITLE', artist: 'ARTIST', album: 'ALBUM', track: 'TRACKNUMBER' };
				var items = [];
				for (var k in map) if (tg[ k ]) items.push ( te.encode ( map[ k ] + '=' + tg[ k ] ) );
				if (!items.length) return ab;

				var body_len = 4 + vendor.length + 4, i;
				for (i = 0; i < items.length; ++i) body_len += 4 + items[ i ].length;
				if (body_len > 0xFFFFFF) return ab;
				var body = new Uint8Array ( body_len );
				var bv = new DataView ( body.buffer );
				bv.setUint32 (0, vendor.length, true);
				body.set (vendor, 4);
				var p = 4 + vendor.length;
				bv.setUint32 (p, items.length, true); p += 4;
				for (i = 0; i < items.length; ++i) {
					bv.setUint32 (p, items[ i ].length, true);
					body.set (items[ i ], p + 4);
					p += 4 + items[ i ].length;
				}

				/* 讀出原本所有 metadata 區塊，丟掉舊的 VORBIS_COMMENT */
				var blocks = [], pos = 4, last = false;
				while (!last) {
					if (pos + 4 > src.length) return ab;
					var hdr = src[ pos ];
					var blen = (src[ pos + 1 ] << 16) | (src[ pos + 2 ] << 8) | src[ pos + 3 ];
					if (pos + 4 + blen > src.length) return ab;
					last = (hdr & 0x80) !== 0;
					blocks.push ({ type: hdr & 0x7f, data: src.subarray ( pos + 4, pos + 4 + blen ) });
					pos += 4 + blen;
				}
				if (!blocks.length || blocks[0].type !== 0) return ab;

				var list = [ blocks[0], { type: 4, data: body } ];
				for (i = 1; i < blocks.length; ++i) if (blocks[ i ].type !== 4) list.push ( blocks[ i ] );

				var total = 4 + (src.length - pos);
				for (i = 0; i < list.length; ++i) total += 4 + list[ i ].data.length;
				var out = new Uint8Array ( total );
				out.set (src.subarray (0, 4), 0);
				var o = 4;
				for (i = 0; i < list.length; ++i) {
					var n = list[ i ].data.length;
					out[ o++ ] = list[ i ].type | (i === list.length - 1 ? 0x80 : 0);
					out[ o++ ] = (n >> 16) & 255; out[ o++ ] = (n >> 8) & 255; out[ o++ ] = n & 255;
					out.set (list[ i ].data, o);
					o += n;
				}
				out.set (src.subarray ( pos ), o);
				return out.buffer;
			}

			function deliver ( blob ) {
				/* [新增] 分割匯出時不直接下載，交給呼叫端收集後打包成 zip */
				if (blob_sink) {
					blob_sink ( blob );
					callback && callback ('done');
					return ;
				}

				var url = (window.URL || window.webkitURL).createObjectURL(blob);

				var a = document.createElement( 'a' );
				a.href = url;
				a.download = with_name ? with_name : 'output.mp3';
				a.style.display = 'none';
				document.body.appendChild( a );
				a.click();

				setTimeout ( function () {
					(window.URL || window.webkitURL).revokeObjectURL ( url );
					a.parentNode && a.parentNode.removeChild ( a );
				}, 100 );

				callback && callback ('done');
			}
		}

		function updatePreview ( val ) {
			if (!this.previewing) return ;
			this.PreviewUpdate && this.PreviewUpdate ( this.PreviewFilter, audio_ctx, val, this.PreviewSource );
		}

		function fadeCurve ( rev ) {
			var c = new Float32Array (32);
			var i = 32, p;
			while (i--) {
				p = i / 31;
				c[i] = fadeGain (rev ? 1 - p : p);
			}
			return c;
		}

		function gainFilter ( audio_ctx, destination, source, gain ) {
			var node = audio_ctx.createGain ();
			node.gain.value = isFinite (gain) ? gain : 1;
			source.connect (node);
			node.connect (destination);
			return node;
		}

		function setGainValue ( node, audio_ctx, gain ) {
			if (!node || !node.gain) return ;
			gain = isFinite (gain) ? gain : 1;
			node.gain.cancelScheduledValues (audio_ctx.currentTime);
			node.gain.setTargetAtTime (gain, audio_ctx.currentTime, 0.01);
		}

		function channelGainFilter ( audio_ctx, destination, source, gains ) {
			if (!gains || gains.length < 2)
				return gainFilter (audio_ctx, destination, source, gains ? gains[0] : 1);

			var splitter = audio_ctx.createChannelSplitter (gains.length);
			var merger = audio_ctx.createChannelMerger (gains.length);
			var nodes = [splitter];

			source.connect (splitter);
			for (var i = 0; i < gains.length; ++i) {
				var gain = audio_ctx.createGain ();
				gain.gain.value = isFinite (gains[i]) ? gains[i] : 1;
				splitter.connect (gain, i);
				gain.connect (merger, 0, i);
				nodes.push (gain);
			}

			merger.connect (destination);
			nodes.push (merger);
			return nodes;
		}

		function setChannelGains ( filter, audio_ctx, gains ) {
			if (!filter || !gains) return ;
			if (!filter.length) return setGainValue (filter, audio_ctx, gains[0]);

			for (var i = 0; i < gains.length; ++i)
				setGainValue (filter[i + 1], audio_ctx, gains[i]);
		}

		function applyBufferGains ( buffer, gains ) {
			for (var i = 0; i < buffer.numberOfChannels; ++i) {
				var chan_data = buffer.getChannelData (i);
				var gain = gains[i] || 1;
				for (var k = 0, len = chan_data.length; k < len; ++k) {
					chan_data[k] *= gain;
				}
			}
		}

		function peakNormalizeStats ( buffer ) {
			var max_peak = 0;
			var peaks = [];

			for (var i = 0; i < buffer.numberOfChannels; ++i) {
				var chan_data = buffer.getChannelData (i);
				var peak = 0;

				for (var k = 1, len = chan_data.length; k < len; k = k + 10) {
					var curr = Math.abs (chan_data[k]);
					if (peak < curr) peak = curr;
				}

				peaks[i] = peak;
				if (max_peak < peak) max_peak = peak;
			}

			return {
				buffer: buffer,
				peaks: peaks,
				maxPeak: max_peak
			};
		}

		function peakNormalizeGains ( stats, val ) {
			var max_val = val[1] || 1.0;
			var gains = [];
			var peak = 0;

			for (var i = 0; i < stats.peaks.length; ++i) {
				peak = val[0] ? stats.maxPeak : stats.peaks[i];
				gains[i] = peak > 0 ? max_val / peak : 1;
			}

			return gains;
		}

		function rmsNormalizeStats ( buffer ) {
			var globalSum = 0;
			var globalPeak = 0;
			var globalLen = 0;
			var chans = [];

			for (var i = 0; i < buffer.numberOfChannels; ++i) {
				var chan_data = buffer.getChannelData (i);
				var sum = 0;
				var peak = 0;

				for (var k = 0, len = chan_data.length; k < len; ++k) {
					var curr = Math.abs (chan_data[k]);
					sum += chan_data[k] * chan_data[k];
					if (peak < curr) peak = curr;
				}

				chans[i] = {
					rms: Math.sqrt (sum / Math.max (1, chan_data.length)),
					peak: peak
				};
				globalSum += sum;
				if (globalPeak < peak) globalPeak = peak;
				globalLen += chan_data.length;
			}

			return {
				buffer: buffer,
				chans: chans,
				rms: Math.sqrt (globalSum / Math.max (1, globalLen)),
				peak: globalPeak
			};
		}

		function rmsNormalizeGains ( stats, val ) {
			var target = Math.pow (10, (val[1] / 1) / 20);
			var peakCeil = 0.99;
			var gains = [];
			var chan, diff;

			for (var i = 0; i < stats.chans.length; ++i) {
				chan = val[0] ? {rms:stats.rms, peak:stats.peak} : stats.chans[i];
				diff = chan.rms > 0 ? target / chan.rms : 1;
				if (chan.peak > 0 && diff * chan.peak > peakCeil) diff = peakCeil / chan.peak;
				gains[i] = diff;
			}

			return gains;
		}

		function lufsNormalizeGain ( source, val ) {
			var gain = val && val.gain;
			if (!(gain > 0) && PKAE._deps.lufs) {
				var report = PKAE._deps.lufs.analyze (source.buffer);
				gain = PKAE._deps.lufs.gainForTarget (report, val.target, val.ceiling).gain;
			}
			return gain > 0 ? gain : 1;
		}

			function clampRate ( val ) {
				val = val / 1;
				if (isNaN (val)) val = 1;
				return Math.max (0.05, Math.min (4, val));
			}

			function ratePoints ( val, duration ) {
				if (!val || val.type !== 'profile' || !val.points || !val.points.length) return null;

				var points = [];
				var src = val.points;
				for (var i = 0; i < src.length; ++i) {
					var x = src[i].x;
					if (x === undefined && duration > 0) x = src[i].time / duration;
					x = x / 1;
					if (isNaN (x)) x = i / Math.max (1, src.length - 1);
					points.push ({x:Math.max (0, Math.min (1, x)), val:clampRate (src[i].val)});
				}

				points.sort (function (a, b) { return a.x > b.x ? 1 : -1; });
				if (points[0].x > 0) points.unshift ({x:0, val:points[0].val});
				if (points[points.length - 1].x < 1) points.push ({x:1, val:points[points.length - 1].val});
				return points;
			}

			function rateDuration ( val, duration ) {
				var points = ratePoints (val, duration);
				var total = 0;
				if (!points) return duration / clampRate (val);

				for (var i = 1; i < points.length; ++i)
					total += (points[i].x - points[i - 1].x) * ((points[i].val + points[i - 1].val) / 2);

				return duration / (total > 0.001 ? total : 1);
			}

			function rateAt ( points, x ) {
				for (var i = 1; i < points.length; ++i) {
					if (x <= points[i].x) {
						var a = points[i - 1], b = points[i];
						var p = (x - a.x) / (b.x - a.x || 1);
						return a.val + (b.val - a.val) * p;
					}
				}
				return points[points.length - 1].val;
			}

			function setRate ( param, audio_ctx, val, duration, seek ) {
				var now = audio_ctx ? audio_ctx.currentTime : 0;
				var points = ratePoints (val, duration);
				param.cancelScheduledValues && param.cancelScheduledValues (now);

				if (!points) {
					val = clampRate (val);
					param.setValueAtTime (val, now);
					return ;
				}

				var x = Math.max (0, Math.min (1, (seek || 0) / duration));
				duration = rateDuration (val, duration);
				param.setValueAtTime (rateAt (points, x), now);
				for (var i = 1; i < points.length; ++i)
					if (points[i].x > x) param.linearRampToValueAtTime (points[i].val, now + (points[i].x - x) * duration);
			}

		var FXBank = {
			Gain : function( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {
						var gain = audio_ctx.createGain ();

						for (var k = 0; k < val.length; ++k)
						{
							var curr = val[k];
							if (curr.length)
							{
								for (var i = 0; i < curr.length; ++i) {
									gain.gain.linearRampToValueAtTime (curr[i].val, audio_ctx.currentTime + curr[i].time);
								}
							}
							else
							{
								gain.gain.setValueAtTime ( curr.val, audio_ctx.currentTime );
							}
						}

						gain.connect (destination);
						source.connect (gain);

						return (gain);
					},
					update : function ( gain, audio_ctx, val ) {
						for (var k = 0; k < val.length; ++k)
						{
							var curr = val[k];
							if (curr.length)
							{
								for (var i = 0; i < curr.length; ++i) {
									gain.gain.linearRampToValueAtTime (curr[i].val, audio_ctx.currentTime + curr[i].time);
								}
							}
							else
							{
								gain.gain.setValueAtTime ( curr.val, audio_ctx.currentTime );
							}
						}

					}
						};
					},

			FadeIn : function( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {
						var gain = audio_ctx.createGain ();
						gain.gain.setValueAtTime (0, audio_ctx.currentTime);
						gain.gain.setValueCurveAtTime (fadeCurve (), audio_ctx.currentTime, duration || 0.001);
						gain.connect (destination);
						source.connect (gain);

						return (gain);
					}
						};
					},

			FadeOut : function( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {
						var gain = audio_ctx.createGain ();
						gain.gain.setValueAtTime (1, audio_ctx.currentTime);
						gain.gain.setValueCurveAtTime (fadeCurve (1), audio_ctx.currentTime, duration || 0.001);
						gain.connect (destination);
						source.connect (gain);

						return (gain);
					}
				};
			},

			Compressor : (function () {
				var P = ['threshold','knee','ratio','attack','release'];
				function ap (n, ac, v) {
					for (var i = 0; i < 5; ++i) {
						var k = P[i], x = v[k]; if (!x) continue;
						if (x.length) {
							for (var j = 0; j < x.length; ++j) {
								var c = x[j];
								n[k].linearRampToValueAtTime (c.val, ac.currentTime + c.time);
							}
						} else n[k].setValueAtTime (x.val, ac.currentTime);
					}
				}
				function mkv (v) { return v && v.val !== undefined ? v.val : 0; }
				function l (d) { return Math.pow (10, d / 20); }
				return function ( val ) {
					return {
						filter : function ( ac, dst, src ) {
							var c = ac.createDynamicsCompressor (), g = ac.createGain ();
							ap (c, ac, val);
							g.gain.value = l (mkv (val.makeup));
							src.connect (c); c.connect (g); g.connect (dst);
							return [c, g];
						},
						update : function ( ch, ac, v ) {
							ap (ch[0], ac, v);
							ch[1].gain.value = l (mkv (v.makeup));
						}
					};
				};
			})(),

			Reverse : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {

						for (var i = 0; i < source.buffer.numberOfChannels; ++i) {
							Array.prototype.reverse.call( source.buffer.getChannelData (i) );
						}

						source.connect (destination);
						return (source);
					},
					update : function () {}
				};
			},

			Invert : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {

						for (var i = 0; i < source.buffer.numberOfChannels; ++i) {
							var channel = source.buffer.getChannelData (i);

							for (var j = 0; j < channel.length; ++j)
								channel[j] *= -1;
						}

						source.connect (destination);
						return (source);
					},
					update : function () {}
				};
			},

			/* [新增] 移除直流偏移（DC Offset）：每個聲道各自減去選取範圍內的平均值。
			 * 錄音設備或類比電路常帶來微小的直流成分，會讓波形中線偏移、浪費動態餘裕，
			 * 也會讓剪接處產生爆音。做完後 fx.removed[] 會留下各聲道被減掉的值（振幅 -1 ~ 1）。 */
			DCOffset : function ( val ) {
				var fx = {
					removed : [],
					filter : function ( audio_ctx, destination, source, duration ) {
						fx.removed = [];

						for (var i = 0; i < source.buffer.numberOfChannels; ++i) {
							var channel = source.buffer.getChannelData (i);
							var n = channel.length;
							var sum = 0;
							var j = 0;

							for (j = 0; j < n; ++j) sum += channel[j];

							var mean = n ? sum / n : 0;
							fx.removed.push (mean);
							if (!mean) continue;

							for (j = 0; j < n; ++j) channel[j] -= mean;
						}

						source.connect (destination);
						return (source);
					},
					update : function () {}
				};
				return fx;
			},

			/* [新增] 切除低頻隆隆聲：4 階（24 dB/oct）巴特沃斯高通濾波，預設 80 Hz。
			 * 用來去掉冷氣、風聲、麥克風架震動與呼吸噴麥的低頻，對人聲幾乎沒有影響。
			 * 注意 WebAudio 的 highpass 其 Q 單位是 dB，所以把巴特沃斯的線性 Q 換成 dB。 */
			HighPass : function ( val ) {
				var freq = (val && val.freq) || 80;
				return {
					filter : function ( audio_ctx, destination, source, duration ) {
						var qs = [0.5412, 1.3065];
						var prev = source;
						var chain = [];

						for (var i = 0; i < qs.length; ++i) {
							var n = audio_ctx.createBiquadFilter ();
							n.type = 'highpass';
							n.frequency.value = Math.min (freq, audio_ctx.sampleRate * 0.45);
							n.Q.value = 20 * Math.log (qs[i]) / Math.LN10;
							prev.connect (n);
							prev = n;
							chain.push (n);
						}

						prev.connect (destination);
						return (chain);
					},
					update : function () {}
				};
			},

			Flip : function ( val, val2 ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {

						if (val === 'flip')
						{
							var chan0 = source.buffer.getChannelData (0);
							var chan1 = source.buffer.getChannelData (1);
							var tmp   = 0;

							for (var j = 0; j < chan0.length; ++j)
							{
								tmp = chan0[j];
								chan0[j] = chan1[j];
								chan1[j] = tmp;
							}
						}

						source.connect (destination);
						return (source);
					},
					update : function () {}
				};
			},

			Normalize : function ( val ) {
				var stats = null;
				function gains ( buffer, v ) {
					if (!stats || stats.buffer !== buffer)
						stats = peakNormalizeStats (buffer);
					return peakNormalizeGains (stats, v);
				}
				return {
					filter : function ( audio_ctx, destination, source, duration, preview ) {
						var vals = gains (source.buffer, val);
						if (preview) return channelGainFilter (audio_ctx, destination, source, vals);

						applyBufferGains (source.buffer, vals);
						source.connect (destination);
						return (source);
					},
					update : function ( filter, audio_ctx, val, source ) {
						setChannelGains (filter, audio_ctx, gains (source.buffer, val));
					}
				};
			},

			NormalizeRMS : function ( val ) {
				var stats = null;
				function gains ( buffer, v ) {
					if (!stats || stats.buffer !== buffer)
						stats = rmsNormalizeStats (buffer);
					return rmsNormalizeGains (stats, v);
				}
				return {
					filter : function ( audio_ctx, destination, source, duration, preview ) {
						var vals = gains (source.buffer, val);
						if (preview) return channelGainFilter (audio_ctx, destination, source, vals);

						applyBufferGains (source.buffer, vals);
						source.connect (destination);
						return (source);
					},
					update : function ( filter, audio_ctx, val, source ) {
						setChannelGains (filter, audio_ctx, gains (source.buffer, val));
					}
				};
			},

			NormalizeLUFS : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration, preview ) {
						var gain = lufsNormalizeGain (source, val);

						if (preview)
							return gainFilter (audio_ctx, destination, source, gain);

						for (var i = 0; i < source.buffer.numberOfChannels; ++i) {
							var chan_data = source.buffer.getChannelData (i);
							for (var k = 0, len = chan_data.length; k < len; ++k) {
								chan_data[k] *= gain;
							}
						}

						source.connect (destination);
						return (source);
					},
					update : function ( filter, audio_ctx, val, source ) {
						setChannelGains (filter, audio_ctx, [lufsNormalizeGain (source, val)]);
					}
				};
			},

			HardLimit : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {
						var max_val = val[1] || 1.0;
						var ratio = val[2] || 0.0;
						var look_ahead = val[3] || 15;
						var equally = false;
						var max_peak = 0;

						var buffer = audio_ctx.createBuffer(
							source.buffer.numberOfChannels,
							source.buffer.length,
							source.buffer.sampleRate
						);

						look_ahead = (look_ahead * buffer.sampleRate/1000) >> 0;

						for (var i = 0; i < buffer.numberOfChannels; ++i) {
							var chan_data = buffer.getChannelData (i);
							chan_data.set ( source.buffer.getChannelData (i) );

							for (var b = 0, len = chan_data.length; b < len; ++b)
							{
								for (var k = 0; k < look_ahead; k = k + 10) {
									var curr = Math.abs ( chan_data [ b + k ] );
									if (max_peak < curr)
										max_peak = curr;
								}

								var diff = (max_val / max_peak);

								if (!equally) {
									for (var k = 0; k < look_ahead; ++k) {
										var orig_val = chan_data[ b + k ];
										var new_val = orig_val * diff;

										var peak_diff = max_val - Math.abs (new_val);
										peak_diff *= orig_val < 0 ? -ratio : ratio;

										chan_data[ b + k ] = (new_val + peak_diff);
									}
									b += look_ahead;
									max_peak = 0;
								}
							}

						}

						var temp_source = audio_ctx.createBufferSource ();
						temp_source.buffer = buffer;
						temp_source.loop = true;
						temp_source.start ();

						temp_source.connect (destination);
						return (temp_source);
					},
					update : function ( filtered_source, audio_ctx, val, source, destination ) {

						try { filtered_source.stop && filtered_source.stop (); } catch (e) {}
						filtered_source.disconnect ();
						filtered_source.buffer = null;
						filtered_source = null;

						var ff = this.FXBank.HardLimit( val );
						this.PreviewFilter = ff.filter ( audio_ctx, destination || audio_destination, source, 0 );
					}
				};
			},

			ParametricEQ : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {

						var bands = [];
						var len = val.length;

						var makeEQ = function ( band ) {
							var eq = audio_ctx.createBiquadFilter ();

							if (band.length)
							{
								for (var i = 0; i < band.length; ++i)
								{
									eq.gain.linearRampToValueAtTime (band[i].val, audio_ctx.currentTime + band[i].time);
								}

								band = band[0];
							}
							else eq.gain.value = band.val;

							eq.type = band.type;
							eq.Q.value = band.q || 1.0;
							eq.frequency.value = band.freq;

							return (eq);
						};

						if (!val[0])
						{
							val[0] = {
								type:'peaking',
								val:0,
								q:1,
								freq:500
							};
						}

						var eq = makeEQ ( val[0] );
						bands.push ( eq );
						source.connect (eq);

						if (val.length === 1)
						{
							eq.connect (destination);
							return (bands);
						}

						for (var i = 1; i < len - 1; ++i)
						{
							eq = makeEQ ( val [ i ] );
							bands [ i - 1 ].connect ( eq );
							bands.push ( eq );
						}
						eq = makeEQ ( val[ len - 1 ] );
						bands [ bands.length - 1 ].connect ( eq );
						bands.push ( eq );
						eq.connect (destination);

						return (bands);
					},
					update : function ( bands, audio_ctx, val, source ) {

						if (bands.length !== val.length)
						{
							var makeEQ = function ( band ) {
								var eq = audio_ctx.createBiquadFilter ();
								return (eq);
							};

							if (bands.length < val.length)
							{
								var l = val.length - bands.length;
								while (l-- > 0)
								{
									var eq = makeEQ ();
									var connect_to = bands[0];
									bands.unshift (eq);
									eq.connect (connect_to);
								}

								source.disconnect ();
								source.connect (bands[0]);
							}
							else
							{
								if (val.length > 0)
								{
										var l = bands.length - val.length;
										source.disconnect ();

										for (var i = 0; i < l; ++i)
										{
											var eq = bands.shift();
											eq.disconnect ();
										}

										source.connect (bands[0]);
								}
								else
								{
										val[0] = {
											type:'peaking',
											val:0,
											q:1,
											freq:500
										};
								}
							}
						}

						var len = val.length;
						for (var i = 0; i < len; ++i)
						{
							var eq = bands [ i ];
							eq.type = val[ i ].type;
							eq.gain.value = val[ i ].val;
							eq.Q.value = val[ i ].q || 1.0;
							eq.frequency.value = val[ i ].freq;
						}

					}
				};
			},

			Rate : function ( val ) {
				var prev_val = val;
				var temp_source = [];
				var on = true;
				var ctx = null;
				var chain = null;
				var api = null;
				var off = 0;
				var stamp = 0;
				var tm = 0;

				function clr () {
					clearTimeout (tm);
					for (var i = 0; i < temp_source.length; ++i) {
						try { temp_source[i].stop (); } catch (e) {}
						try { temp_source[i].disconnect (); } catch (e) {}
					}
					temp_source = [];
				}
				function arm ( audio_ctx, source, delay ) {
					clearTimeout (tm);
					tm = setTimeout (function () {
						on && api.update (chain, audio_ctx, 1 / prev_val, source);
					}, Math.max (120, (delay - 0.08) * 1000));
				}
				function cur ( audio_ctx, source ) {
					var now = audio_ctx.currentTime;
					var dur = source.buffer.duration || 1;
					if (stamp) off = (off + (now - stamp) / (prev_val || 1)) % dur;
					stamp = now;
					return (off);
				}

				api = {
					filter : function ( audio_ctx, destination, source, duration ) {
						var fx_buffer = source.buffer;

						var stretch_ratio = val;
						let grainDuration = 0.05;
						const analysisHop = 0.025;
						const desiredOverlap = 0.5;
						const synthesisHop = analysisHop * stretch_ratio;

						if (stretch_ratio > 1) {
							grainDuration = synthesisHop / (1 - desiredOverlap);
						}

							var offlineCtx = audio_ctx;
							const now = audio_ctx.currentTime;
							off = source._pkSeek || 0;
							stamp = now;

						var applyHannWindowFast = function (gainNode, outputTime, grainDuration) {

							const numSteps = 50;

							for (let i = 0; i <= numSteps; i++) {
								const t = (i / numSteps) * grainDuration;
								const windowValue = 0.5 * (1 - Math.cos((2 * Math.PI * t) / grainDuration));
								gainNode.gain.linearRampToValueAtTime(windowValue, outputTime + t);
							}
						};

							var grainIndex = 0;
							var filter_chain = [];
							ctx = audio_ctx;
							chain = filter_chain;

							for (let t = off, end = off + fx_buffer.duration; t < end; t += analysisHop) {
									let offset = t % fx_buffer.duration;
									const outputTime = grainIndex * synthesisHop;
									if (offset + grainDuration > fx_buffer.duration) offset = 0;

								const grainSource = offlineCtx.createBufferSource();
								grainSource.buffer = fx_buffer;

								const grainGain = offlineCtx.createGain();
								grainSource.connect(grainGain);
								grainGain.connect(destination || offlineCtx.destination);

								applyHannWindowFast (grainGain, now + outputTime, grainDuration);

								grainSource.start(now + outputTime, offset, grainDuration);
								filter_chain.push (grainGain);
								temp_source[grainIndex] = grainSource;

									++grainIndex;
							}

								if (filter_chain[0]) filter_chain[0]._pk_own = 1;
								arm (audio_ctx, source, grainIndex * synthesisHop);
								return (filter_chain);
							},

						destroy : function () {
							clr ();
						},

						preview : function ( state, source ) {
							on = !!state;
							if (!on) return clr ();
							if (ctx && source.buffer) {
								off = ((source._pkSeek || 0) + ctx.currentTime - (source._pkStart || ctx.currentTime)) % (source.buffer.duration || 1);
								stamp = ctx.currentTime;
							}
							api.update (chain, ctx || source.context, 1 / prev_val, source);
						},

						update : function ( filter_chain, audio_ctx, val, source ) {
							clr ();
							if (!on || !filter_chain) { prev_val = 1 / val; return ; }
							var t = cur (audio_ctx, source);
							prev_val = 1 / val;
							var fx_buffer = source.buffer;

						let grainDuration = 0.05;
						const analysisHop = 0.025;
						const desiredOverlap = 0.5;
						const synthesisHop = analysisHop * prev_val;

						if (prev_val > 1) {
							grainDuration = synthesisHop / (1 - desiredOverlap);
						}

						const now = audio_ctx.currentTime;

						var applyHannWindowFast = function (gainNode, outputTime, grainDuration) {

							const numSteps = 50;

							for (let i = 0; i <= numSteps; i++) {
								const t = (i / numSteps) * grainDuration;
								const windowValue = 0.5 * (1 - Math.cos((2 * Math.PI * t) / grainDuration));
								gainNode.gain.linearRampToValueAtTime(windowValue, outputTime + t);
							}
						};

							var l = filter_chain.length;
							for (var i = 0; i < l; ++i) {
									if (t + grainDuration > fx_buffer.duration) t = 0;
									const offset = t;
									const outputTime = i * synthesisHop;

									const grainGain = filter_chain[i];
									let grainSource = audio_ctx.createBufferSource();
								grainGain.gain.setValueAtTime(grainGain.gain.value, now);
								grainGain.gain.cancelScheduledValues(now);

								grainSource.buffer = fx_buffer;
								grainSource.connect(grainGain);
								temp_source[i] = grainSource;

								applyHannWindowFast (grainGain, outputTime + now, grainDuration);

									grainSource.start(now + outputTime, offset, grainDuration);
									t += analysisHop;
							}
							arm (audio_ctx, source, l * synthesisHop);

						}
					};
					return (api);
				},

				Speed : function ( val ) {
				var ctx = null;
				var curr_val = val;
				var on = true;

				return {
					duration: function ( duration ) {
						return rateDuration (curr_val, duration);
					},

					filter : function ( audio_ctx, destination, source, duration, preview, seek ) {
						ctx = audio_ctx;

						var inputNode = audio_ctx.createGain();

						setRate (source.playbackRate, audio_ctx, curr_val, duration, seek || source._pkSeek);
						source.connect (inputNode);

						inputNode.connect (destination);

						var filter_chain = [ inputNode ];

						return (filter_chain);
					},

					preview: function (state, source) {
						on = !!state;
						setRate (
							source.playbackRate,
							ctx || source.context || audio_ctx,
							state ? curr_val : 1.0,
							source.buffer ? source.buffer.duration : 1,
							source._pkSeek
						);
					},

					update : function ( filter_chain, audio_ctx, val, source ) {
						curr_val = val;
						setRate (
							source.playbackRate,
							audio_ctx,
							on ? curr_val : 1.0,
							source.buffer ? source.buffer.duration : 1,
							source._pkSeek
						);
					}
				};
			},

			Delay : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {

						var inputNode = audio_ctx.createGain();
						var outputNode = audio_ctx.createGain();
						var dryGainNode = audio_ctx.createGain();
						var wetGainNode = audio_ctx.createGain();
						var feedbackGainNode = audio_ctx.createGain();
						var delayNode = audio_ctx.createDelay();

						source.connect (inputNode);

						inputNode.connect (dryGainNode);

						dryGainNode.connect (outputNode);

						delayNode.connect (feedbackGainNode);
						feedbackGainNode.connect (delayNode);

						inputNode.connect (delayNode);

						delayNode.connect (wetGainNode);

						wetGainNode.connect (outputNode);
						outputNode.connect (destination);

						var filter_chain = [ inputNode, outputNode, dryGainNode,
							wetGainNode, feedbackGainNode, delayNode ];

						if (!val.delay.length)
							delayNode.delayTime.value = val.delay.val;
						else {
							for (var i = 0; i < val.delay.length; ++i) {
								delayNode.delayTime.linearRampToValueAtTime (val.delay[i].val, val.delay[i].time + audio_ctx.currentTime );
							}
						}

						if (!val.feedback.length)
							feedbackGainNode.gain.value = val.feedback.val;
						else {
							for (var i = 0; i < val.feedback.length; ++i) {
								feedbackGainNode.gain.linearRampToValueAtTime (val.feedback[i].val, val.feedback[i].time + audio_ctx.currentTime );
							}
						}

						if (!val.mix.length) {
							dryGainNode.gain.value = 1 - ((val.mix.val - 0.5) * 2);
							wetGainNode.gain.value = 1 - ((0.5 - val.mix.val) * 2);
						}
						else {
							for (var i = 0; i < val.mix.length; ++i) {
								dryGainNode.gain.linearRampToValueAtTime (1 - ((val.mix[i].val - 0.5) * 2), val.mix[i].time + audio_ctx.currentTime );
								wetGainNode.gain.linearRampToValueAtTime (1 - ((0.5 - val.mix[i].val) * 2), val.mix[i].time + audio_ctx.currentTime );
							}
						}

						return (filter_chain);
					},

					update : function ( filter_chain, audio_ctx, val ) {

						var dryGainNode = filter_chain[2];
						var wetGainNode = filter_chain[3];
						var feedbackGainNode = filter_chain[4];
						var delayNode = filter_chain[5];

						if (!val.delay.length)
							delayNode.delayTime.value = val.delay.val;
						else {
							for (var i = 0; i < val.delay.length; ++i) {
								delayNode.delayTime.linearRampToValueAtTime (val.delay[i].val, val.delay[i].time + audio_ctx.currentTime );
							}
						}

						if (!val.feedback.length)
							feedbackGainNode.gain.value = val.feedback.val;
						else {
							for (var i = 0; i < val.feedback.length; ++i) {
								feedbackGainNode.gain.linearRampToValueAtTime (val.feedback[i].val, val.feedback[i].time + audio_ctx.currentTime );
							}
						}

						if (!val.mix.length) {
							dryGainNode.gain.value = 1 - ((val.mix.val - 0.5) * 2);
							wetGainNode.gain.value = 1 - ((0.5 - val.mix.val) * 2);
						}
						else {
							for (var i = 0; i < val.mix.length; ++i) {
								dryGainNode.gain.linearRampToValueAtTime (1 - ((val.mix[i].val - 0.5) * 2), val.mix[i].time + audio_ctx.currentTime );
								wetGainNode.gain.linearRampToValueAtTime (1 - ((0.5 - val.mix[i].val) * 2), val.mix[i].time + audio_ctx.currentTime );
							}
						}

					}
				};
			},

			Distortion : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {

						var wave_shaper = audio_ctx.createWaveShaper ();

						var compute_dist = function ( val ) {
							var gain = parseInt ( (val / 1) * 100, 10);
							var n_samples = 44100;
							var curve = new Float32Array (n_samples);
							var deg = Math.PI / 180;
							var x;

							for (var i = 0; i < n_samples; ++i ) {
								x = i * 2 / n_samples - 1;
								curve[i] = (3 + gain) * x * 20 * deg / (Math.PI + gain * Math.abs(x));
							}

							return (curve);
						};

						for (var k = 0; k < val.length; ++k)
						{
							var curr = val[k];
							if (curr.length)
							{
								for (var i = 0; i < curr.length; ++i) {
									wave_shaper.curve.linearRampToValueAtTime (compute_dist(curr[i].val), audio_ctx.currentTime + curr[i].time);
								}
							}
							else
							{
								wave_shaper.curve = compute_dist (curr.val);
							}
						}

						source.connect (wave_shaper);
						wave_shaper.connect (destination);

						return (wave_shaper);
					},

					update : function ( filter, audio_ctx, val ) {

						var compute_dist = function ( val ) {
							var gain = parseInt ( (val / 1) * 100, 10);
							var n_samples = 44100;
							var curve = new Float32Array (n_samples);
							var deg = Math.PI / 180;
							var x;

							for (var i = 0; i < n_samples; ++i ) {
								x = i * 2 / n_samples - 1;
								curve[i] = (3 + gain) * x * 20 * deg / (Math.PI + gain * Math.abs(x));
							}

							return (curve);
						};

						for (var k = 0; k < val.length; ++k)
						{
							var curr = val[k];
							if (curr.length)
							{
								for (var i = 0; i < curr.length; ++i) {
									filter.curve.linearRampToValueAtTime (compute_dist(curr[i].val), audio_ctx.currentTime + curr[i].time);
								}
							}
							else
							{
								filter.curve = compute_dist (curr.val);
							}
						}

					}
				};
			},

			HumNotch : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {
						var freq = val.freq;
						var harmonics = val.harmonics || 4;
						var q_val = val.q || 30;
						var prev = source;
						var last = null;
						var chain = [];
						for (var h = 1; h <= harmonics; ++h) {
							var f = freq * h;
							if (f >= audio_ctx.sampleRate * 0.5) break;
							var n = audio_ctx.createBiquadFilter ();
							n.type = 'notch';
							n.frequency.value = f;
							n.Q.value = q_val;
							prev.connect (n);
							prev = n;
							last = n;
							chain.push (n);
						}
						if (last) last.connect (destination);
						else source.connect (destination);
						return (chain);
					}
				};
			},

			Reverb : function ( val ) {
				return {
					filter : function ( audio_ctx, destination, source, duration ) {

						var inputNode = audio_ctx.createGain();
						var reverbNode = audio_ctx.createConvolver();
						var outputNode = audio_ctx.createGain();
						var wetGainNode = audio_ctx.createGain();
						var dryGainNode = audio_ctx.createGain();

						source.connect (inputNode);

						inputNode.connect (reverbNode);
						reverbNode.connect (wetGainNode);
						inputNode.connect (dryGainNode);
						dryGainNode.connect (outputNode);
						wetGainNode.connect (outputNode);
						outputNode.connect (destination);

						var filter_chain = [ inputNode, outputNode, reverbNode, dryGainNode, wetGainNode ];

						dryGainNode.gain.value = 1 - ((val.mix - 0.5) * 2);
						wetGainNode.gain.value = 1 - ((0.5 - val.mix) * 2);

						var length = audio_ctx.sampleRate * val.time;
						var impulse = audio_ctx.createBuffer (2, length, audio_ctx.sampleRate);
						var impulseL = impulse.getChannelData(0);
						var impulseR = impulse.getChannelData(1);
						var n, i;

						for (i = 0; i < length; i++) {
							n = val.reverse ? length - i : i;
							impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, val.decay);
							impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, val.decay);
						}
						reverbNode.buffer = impulse;

						return (filter_chain);
					},

					update : function ( filter_chain, audio_ctx, val ) {

						audio_ctx   = wavesurfer.backend.ac;

						var reverbNode = filter_chain[2];
						var dryGainNode = filter_chain[3];
						var wetGainNode = filter_chain[4];

						dryGainNode.gain.value = 1 - ((val.mix - 0.5) * 2);
						wetGainNode.gain.value = 1 - ((0.5 - val.mix) * 2);

						var length = audio_ctx.sampleRate * val.time;
						var impulse = audio_ctx.createBuffer (2, length, audio_ctx.sampleRate);
						var impulseL = impulse.getChannelData(0);
						var impulseR = impulse.getChannelData(1);
						var n, i;

						for (i = 0; i < length; i++) {
							n = val.reverse ? length - i : i;
							impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, val.decay);
							impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, val.decay);
						}
						reverbNode.buffer = impulse;
					}
				};
			}
		};

		this.FXPreviewUpdate = updatePreview;
		this.FXPreviewStop = stopPreview;
		this.FXPreviewToggle = togglePreview;
		this.FXPreviewInit = initPreview;
		this.FXPreviewBuffer = previewBuffer;
		this.FXPreview = previewEffect;
		this.FX = applyEffect;
		this.FXBank = FXBank;
		this.SeamlessLoop = seamlessLoop;
		this.Loudness = AnalyzeLoudness;

		this.Trim = TrimBuffer;
		this.Copy = CopyBufferSegment;
		this.Insert = InsertSegmentToBuffer;
		this.InsertFloatArrays = InsertFloatArrays;
		this.ReplaceFloatArrays = ReplaceFloatArrays;
		this.Replace = OverwriteBufferWithSegment;
		this.FullReplace = OverwriteBuffer;
		this.MakeSilence = MakeSilenceBuffer;
		this.DownloadFile = DownloadFile;
		this.DownloadFileCancel = DownloadFileCancel;

	};

	PKAE._deps.audioutils = AudioUtils;
})( PKAudioEditor );


