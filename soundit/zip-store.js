
/* Soundit：極簡 ZIP 打包（不壓縮，音訊檔本身已壓縮過）
 *   PKAudioEditor._deps.zip.build ( [{name:'a.mp3', blob:Blob 或 Promise<Blob>}, ...] ) -> Promise<Blob>
 * 檔名以 UTF-8 儲存（旗標 bit 11），中文檔名可正常解壓。
 * 限制：未支援 Zip64（單檔或總量需小於 4GB）。
 */
(function ( w, PKAE ) {
	'use strict';

	var table = null;
	function crc32 ( bytes ) {
		if (!table) {
			table = new Uint32Array (256);
			for (var i = 0; i < 256; ++i) {
				var c = i;
				for (var k = 0; k < 8; ++k) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
				table[ i ] = c >>> 0;
			}
		}
		var crc = 0xFFFFFFFF;
		for (var n = 0; n < bytes.length; ++n)
			crc = table[ (crc ^ bytes[ n ]) & 0xFF ] ^ (crc >>> 8);
		return (crc ^ 0xFFFFFFFF) >>> 0;
	}

	function dosTime ( d ) {
		return {
			time: (d.getHours () << 11) | (d.getMinutes () << 5) | (d.getSeconds () >> 1),
			date: ((d.getFullYear () - 1980) << 9) | ((d.getMonth () + 1) << 5) | d.getDate ()
		};
	}

	function build ( files ) {
		var enc = new TextEncoder ();
		var stamp = dosTime ( new Date () );
		var parts = [];
		var central = [];
		var offset = 0;

		function next ( i ) {
			if (i >= files.length) return Promise.resolve ();

			return Promise.resolve ( files[ i ].blob ).then (function ( b ) {
				return b.arrayBuffer ();
			}).then (function ( buf ) {
				var data = new Uint8Array ( buf );
				var name = enc.encode ( files[ i ].name );
				var crc = crc32 ( data );

				var lh = new Uint8Array (30 + name.length);
				var lv = new DataView (lh.buffer);
				lv.setUint32 (0, 0x04034B50, true);
				lv.setUint16 (4, 20, true);
				lv.setUint16 (6, 0x0800, true);
				lv.setUint16 (8, 0, true);
				lv.setUint16 (10, stamp.time, true);
				lv.setUint16 (12, stamp.date, true);
				lv.setUint32 (14, crc, true);
				lv.setUint32 (18, data.length, true);
				lv.setUint32 (22, data.length, true);
				lv.setUint16 (26, name.length, true);
				lv.setUint16 (28, 0, true);
				lh.set ( name, 30 );

				var ch = new Uint8Array (46 + name.length);
				var cv = new DataView (ch.buffer);
				cv.setUint32 (0, 0x02014B50, true);
				cv.setUint16 (4, 20, true);
				cv.setUint16 (6, 20, true);
				cv.setUint16 (8, 0x0800, true);
				cv.setUint16 (10, 0, true);
				cv.setUint16 (12, stamp.time, true);
				cv.setUint16 (14, stamp.date, true);
				cv.setUint32 (16, crc, true);
				cv.setUint32 (20, data.length, true);
				cv.setUint32 (24, data.length, true);
				cv.setUint16 (28, name.length, true);
				cv.setUint32 (42, offset, true);
				ch.set ( name, 46 );

				parts.push ( lh, data );
				central.push ( ch );
				offset += lh.length + data.length;

				return next ( i + 1 );
			});
		}

		return next (0).then (function () {
			var cd_size = 0;
			for (var i = 0; i < central.length; ++i) cd_size += central[ i ].length;

			var end = new Uint8Array (22);
			var ev = new DataView (end.buffer);
			ev.setUint32 (0, 0x06054B50, true);
			ev.setUint16 (8, files.length, true);
			ev.setUint16 (10, files.length, true);
			ev.setUint32 (12, cd_size, true);
			ev.setUint32 (16, offset, true);

			return new Blob ( parts.concat ( central, [end] ), { type: 'application/zip' } );
		});
	}

	PKAE._deps.zip = { build: build, _crc32: crc32 };

})( window, PKAudioEditor );
