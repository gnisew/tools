/* Soundit 頻譜圖（Spectrogram）
 *
 * 在主波形上疊一層頻譜圖畫布，時間軸與縮放、捲動完全同步：
 *   - 只計算「畫面上看得到的範圍」，每個像素欄位算一次 FFT
 *   - 已算過的欄位會快取，左右捲動時不用重算
 *   - 計算分段執行（每段約 12ms），不會卡住介面
 *   - 滑鼠移到波形上會顯示該點的頻率、音量（dBFS）與時間
 *
 * 模式：off 關閉 / solo 僅頻譜圖 / blend 疊加於波形（screen 混色）
 * 事件：RequestSpectrogramMode / Scale / FFT → DidSpectrogramState
 */
(function ( w, d, PKAE ) {
	'use strict';

	var DB_FLOOR = -90;            /* 低於此音量一律顯示為黑色 */
	var MAX_CACHE_COLS = 24000;    /* 快取欄位上限 */
	var SLICE_MS = 12;             /* 每段計算的時間上限 */
	var PREF_KEY = 'pk_spectro';

	/* ------------------------------------------------------------------
	 * 偏好設定（選單建立時模組尚未實例化，所以放在 _deps 供選單讀取）
	 * ------------------------------------------------------------------ */
	var MODES = ['off', 'solo', 'blend'];
	var SCALES = ['log', 'linear'];
	var FFTS = [1024, 2048, 4096];
	var prefs = { mode: 'off', scale: 'log', fft: 2048 };

	try {
		var saved = JSON.parse ( w.localStorage.getItem ( PREF_KEY ) || '{}' );
		if (MODES.indexOf ( saved.mode ) >= 0) prefs.mode = saved.mode;
		if (SCALES.indexOf ( saved.scale ) >= 0) prefs.scale = saved.scale;
		if (FFTS.indexOf ( saved.fft ) >= 0) prefs.fft = saved.fft;
	} catch (e) {}

	PKAE._deps.spectroPrefs = {
		get: function () { return prefs; },
		set: function ( key, val ) {
			var ok = (key === 'mode' && MODES.indexOf ( val ) >= 0) ||
				(key === 'scale' && SCALES.indexOf ( val ) >= 0) ||
				(key === 'fft' && FFTS.indexOf ( val ) >= 0);
			if (!ok) return false;
			prefs[ key ] = val;
			try { w.localStorage.setItem ( PREF_KEY, JSON.stringify ( prefs ) ); } catch (e) {}
			return true;
		}
	};

	/* ------------------------------------------------------------------
	 * 核心（純函式，不碰 DOM）
	 * ------------------------------------------------------------------ */

	/* 基數 2 FFT（就地運算）。回傳 { n, fft, window, re, im } */
	var fft_cache = {};
	function getFFT ( n ) {
		if (fft_cache[ n ]) return fft_cache[ n ];

		var levels = Math.round ( Math.log ( n ) / Math.LN2 );
		var rev = new Uint32Array ( n );
		for (var i = 0; i < n; ++i) {
			var r = 0, x = i;
			for (var b = 0; b < levels; ++b) { r = (r << 1) | (x & 1); x >>= 1; }
			rev[ i ] = r;
		}

		var half_n = n >> 1;
		var cos_t = new Float64Array ( half_n );
		var sin_t = new Float64Array ( half_n );
		for (var k = 0; k < half_n; ++k) {
			cos_t[ k ] = Math.cos ( 2 * Math.PI * k / n );
			sin_t[ k ] = Math.sin ( 2 * Math.PI * k / n );
		}

		var win = new Float64Array ( n );
		for (var m = 0; m < n; ++m) win[ m ] = 0.5 - 0.5 * Math.cos ( 2 * Math.PI * m / n );   /* Hann */

		function fft ( re, im ) {
			for (var i = 0; i < n; ++i) {
				var j = rev[ i ];
				if (j > i) {
					var tr = re[ i ]; re[ i ] = re[ j ]; re[ j ] = tr;
					var ti = im[ i ]; im[ i ] = im[ j ]; im[ j ] = ti;
				}
			}
			for (var size = 2; size <= n; size <<= 1) {
				var half = size >> 1, step = n / size;
				for (var s = 0; s < n; s += size) {
					for (var a = s, kk = 0; a < s + half; ++a, kk += step) {
						var l = a + half;
						var xr = re[ l ] * cos_t[ kk ] + im[ l ] * sin_t[ kk ];
						var xi = -re[ l ] * sin_t[ kk ] + im[ l ] * cos_t[ kk ];
						re[ l ] = re[ a ] - xr; im[ l ] = im[ a ] - xi;
						re[ a ] += xr; im[ a ] += xi;
					}
				}
			}
		}

		return (fft_cache[ n ] = {
			n: n, fft: fft, window: win,
			re: new Float64Array ( n ), im: new Float64Array ( n ),
			power: new Float64Array ( half_n + 1 ),
			db: new Float32Array ( half_n + 1 )
		});
	}

	/* 頻率軸範圍 */
	function freqRange ( sr, scale ) {
		var fmax = sr / 2;
		var fmin = scale === 'log' ? 20 : 0;
		if (scale === 'log' && fmax < fmin * 4) fmin = fmax / 100;
		return { fmin: fmin, fmax: fmax };
	}

	/* frac：0 = 最下方、1 = 最上方 */
	function freqAtFrac ( frac, sr, scale ) {
		var r = freqRange ( sr, scale );
		return scale === 'log' ? r.fmin * Math.pow ( r.fmax / r.fmin, frac ) : r.fmax * frac;
	}

	function fracAtFreq ( f, sr, scale ) {
		var r = freqRange ( sr, scale );
		if (scale === 'log') return Math.log ( Math.max ( f, r.fmin ) / r.fmin ) / Math.log ( r.fmax / r.fmin );
		return f / r.fmax;
	}

	/* 每一列像素（0 = 最上方）對應的 FFT bin 範圍 */
	function buildRows ( H, n, sr, scale ) {
		var lo = new Float32Array ( H ), hi = new Float32Array ( H );
		for (var r = 0; r < H; ++r) {
			var f_up = freqAtFrac ( 1 - r / H, sr, scale );
			var f_dn = freqAtFrac ( 1 - (r + 1) / H, sr, scale );
			lo[ r ] = f_dn * n / sr;
			hi[ r ] = f_up * n / sr;
		}
		return { lo: lo, hi: hi };
	}

	function rowDb ( db, lo, hi, last ) {
		if (hi - lo <= 1) {
			var c = (lo + hi) / 2;
			var i = Math.min ( last, c | 0 );
			var fr = c - i;
			var a = db[ i ], b = db[ Math.min ( i + 1, last ) ];
			return a + (b - a) * fr;
		}
		var from = Math.max ( 0, Math.ceil ( lo ) );
		var to = Math.min ( last, Math.floor ( hi ) );
		var m = -Infinity;
		for (var k = from; k <= to; ++k) if (db[ k ] > m) m = db[ k ];
		return m === -Infinity ? db[ Math.min ( last, Math.max ( 0, Math.round ( lo ) ) ) ] : m;
	}

	/* 算一個欄位：channels 為 Float32Array 陣列（各聲道平均成單聲道）。
	 * 結果寫入 out（Uint8Array(H)，0 ~ 255 對應 DB_FLOOR ~ 0 dBFS）。 */
	function computeColumn ( channels, n, centerSample, hopSamples, rows, H, out ) {
		var F = getFFT ( n );
		var re = F.re, im = F.im, win = F.window, power = F.power, db = F.db;
		var bins = (n >> 1) + 1, last = bins - 1;
		var nch = channels.length;
		var len = channels[ 0 ].length;
		var frames = Math.min ( 4, Math.max ( 1, Math.ceil ( hopSamples / n ) ) );

		power.fill ( 0 );
		for (var f = 0; f < frames; ++f) {
			var center = centerSample + ((f + 0.5) / frames - 0.5) * hopSamples;
			var start = Math.round ( center ) - (n >> 1);

			for (var i = 0; i < n; ++i) {
				var p = start + i;
				if (p < 0 || p >= len) { re[ i ] = 0; im[ i ] = 0; continue; }
				var s = channels[ 0 ][ p ];
				for (var c = 1; c < nch; ++c) s += channels[ c ][ p ];
				re[ i ] = (s / nch) * win[ i ];
				im[ i ] = 0;
			}

			F.fft ( re, im );
			for (var k = 0; k < bins; ++k) power[ k ] += re[ k ] * re[ k ] + im[ k ] * im[ k ];
		}

		/* Hann 窗相干增益 0.5：振幅 A 的正弦 → |X| = A·n/4，故 dBFS = 10·log10(16·p / n²) */
		var scale = 16 / (frames * n * n);
		for (var b = 0; b < bins; ++b) db[ b ] = 10 * Math.log10 ( power[ b ] * scale + 1e-12 );

		for (var r = 0; r < H; ++r) {
			var v = (rowDb ( db, rows.lo[ r ], rows.hi[ r ], last ) - DB_FLOOR) / -DB_FLOOR * 255;
			out[ r ] = v < 0 ? 0 : v > 255 ? 255 : Math.round ( v );
		}
	}

	/* 色盤（magma 風格：黑 → 紫 → 橘 → 淡黃） */
	var LUT = (function () {
		var stops = [
			[0.00, 0, 0, 4], [0.13, 28, 16, 68], [0.25, 79, 18, 123], [0.38, 129, 37, 129],
			[0.50, 181, 54, 122], [0.63, 229, 80, 100], [0.75, 251, 135, 97],
			[0.88, 254, 194, 135], [1.00, 252, 253, 191]
		];
		var lut = new Uint8Array ( 256 * 3 );
		for (var i = 0; i < 256; ++i) {
			var v = i / 255, s = 1;
			while (s < stops.length - 1 && stops[ s ][ 0 ] < v) ++s;
			var a = stops[ s - 1 ], b = stops[ s ];
			var u = (v - a[ 0 ]) / (b[ 0 ] - a[ 0 ]);
			for (var c = 0; c < 3; ++c) lut[ i * 3 + c ] = Math.round ( a[ c + 1 ] + (b[ c + 1 ] - a[ c + 1 ]) * u );
		}
		return lut;
	})();

	PKAE._deps.spectroCore = {
		getFFT: getFFT, buildRows: buildRows, computeColumn: computeColumn,
		freqAtFrac: freqAtFrac, fracAtFreq: fracAtFreq, LUT: LUT, DB_FLOOR: DB_FLOOR
	};

	/* ------------------------------------------------------------------
	 * 模組本體
	 * ------------------------------------------------------------------ */
	var PKSPECTRO = function ( app ) {
		var q = this;

		var overlay = null, ctx = null, info_el = null, img = null;
		var cache = null;           /* { key, gen, rows, cols: Map } */
		var gen = 0;                /* 音訊內容變動時加一，使快取失效 */
		var job = 0, timer = 0;
		var view = null;            /* 最近一次畫面參數，給滑鼠讀值用 */

		function wave () { return app.engine && app.engine.wavesurfer; }

		/* 簡易指紋：長度、取樣率、聲道數 + 在雜湊位置取樣 64 點（絕對值和 + 帶權重的有號和），
		 * 用來偵測「沒有發出事件的就地修改」。取樣位置刻意不規則，避免剛好與週期訊號對齊而互相抵消。 */
		function fingerprint ( buffer ) {
			var s = buffer.length + '/' + buffer.sampleRate + '/' + buffer.numberOfChannels;
			try {
				var ch = buffer.getChannelData ( 0 ), len = ch.length, abs_sum = 0, signed_sum = 0;
				for (var k = 0; k < 64; ++k) {
					var v = ch[ Math.floor ( (k * 2654435761) % len ) ];
					abs_sum += Math.abs ( v );
					signed_sum += v * (k + 1);
				}
				s += '/' + abs_sum.toFixed ( 7 ) + '/' + signed_sum.toFixed ( 7 );
			} catch (e) {}
			return s;
		}

		function ensureOverlay ( ws ) {
			var wrapper = ws.drawer && ws.drawer.wrapper;
			if (!wrapper) return false;

			if (!overlay) {
				overlay = d.createElement ('canvas');
				overlay.className = 'pk_spectro';
				overlay.style.cssText = 'position:absolute;left:0;top:0;z-index:2;pointer-events:none;display:none;';
				ctx = overlay.getContext ('2d', { alpha: false });

				info_el = d.createElement ('div');
				info_el.className = 'pk_spectro_info';
				info_el.style.cssText = 'position:absolute;right:6px;top:6px;z-index:4;pointer-events:none;display:none;' +
					'padding:2px 7px;border-radius:3px;background:rgba(0,0,0,0.72);color:#fff;' +
					'font:11px/1.5 sans-serif;white-space:nowrap;';

				wrapper.addEventListener ('mousemove', onMove);
				wrapper.addEventListener ('mouseleave', function () { info_el.style.display = 'none'; });
			}

			/* 疊在波形畫布之上、選取範圍與游標之下 */
			var canv = ws.drawer.canvases;
			var lastWave = canv && canv.length ? canv[ canv.length - 1 ].wave : null;
			if (overlay.parentNode !== wrapper) {
				wrapper.appendChild ( overlay );
				wrapper.appendChild ( info_el );
			}
			if (lastWave && overlay.previousSibling !== lastWave)
				wrapper.insertBefore ( overlay, lastWave.nextSibling );

			return true;
		}

		function hide () {
			if (overlay) overlay.style.display = 'none';
			if (info_el) info_el.style.display = 'none';
			++job;
		}

		function schedule ( delay ) {
			w.clearTimeout ( timer );
			timer = w.setTimeout ( run, delay === undefined ? 40 : delay );
		}

		function run () {
			var ws = wave ();
			if (prefs.mode === 'off') { hide (); return ; }

			var buffer = ws && ws.backend && ws.backend.buffer;
			if (!buffer || !buffer.length || !ws.drawer || !ensureOverlay ( ws )) { hide (); return ; }

			var pr = ws.drawer.params.pixelRatio || 1;
			var W = Math.round ( ws.drawer.getWidth () );
			var H = Math.round ( ws.drawer.height );
			if (!(W > 0) || !(H > 0)) { hide (); return ; }

			var sr = buffer.sampleRate;
			var n = prefs.fft;
			var vis = ws.VisibleDuration || ws.getDuration () || buffer.duration;
			var left = ws.LeftProgress || 0;
			var px_per_sec = W / vis;
			var c0 = Math.round ( left * px_per_sec );
			var hop = sr / px_per_sec;                    /* 每個欄位涵蓋的取樣數 */

			var key = [ fingerprint ( buffer ), px_per_sec.toFixed ( 4 ), H, prefs.scale, n ].join ('|');
			if (!cache || cache.key !== key || cache.gen !== gen)
				cache = { key: key, gen: gen, rows: buildRows ( H, n, sr, prefs.scale ), cols: new Map () };

			if (overlay.width !== W || overlay.height !== H) {
				overlay.width = W;
				overlay.height = H;
				img = null;
			}
			overlay.style.width = (W / pr) + 'px';
			overlay.style.height = (H / pr) + 'px';
			overlay.style.display = 'block';
			overlay.style.mixBlendMode = prefs.mode === 'blend' ? 'screen' : '';

			var channels = [];
			for (var c = 0; c < buffer.numberOfChannels; ++c) channels.push ( buffer.getChannelData ( c ) );

			view = { c0: c0, W: W, H: H, sr: sr, left: left, vis: vis, scale: prefs.scale, cache: cache };

			var my_job = ++job;
			var x = 0;

			function step () {
				if (my_job !== job) return ;
				var t0 = w.performance ? w.performance.now () : Date.now ();
				var did = false;

				for (; x < W; ++x) {
					var col_id = c0 + x;
					if (!cache.cols.has ( col_id )) {
						var col = new Uint8Array ( H );
						computeColumn ( channels, n, (col_id + 0.5) / px_per_sec * sr, hop, cache.rows, H, col );
						cache.cols.set ( col_id, col );
						did = true;
						if ((w.performance ? w.performance.now () : Date.now ()) - t0 > SLICE_MS) { ++x; break; }
					}
				}

				paint ();
				if (x < W) { w.setTimeout ( step, 0 ); return ; }

				/* 快取過大時丟掉最舊的 */
				if (cache.cols.size > MAX_CACHE_COLS) {
					var drop = cache.cols.size - MAX_CACHE_COLS;
					var it = cache.cols.keys ();
					for (var i = 0; i < drop; ++i) cache.cols.delete ( it.next ().value );
				}
			}

			step ();
		}

		function paint () {
			var v = view;
			if (!v || !ctx) return ;
			var W = v.W, H = v.H;

			if (!img || img.width !== W || img.height !== H) img = ctx.createImageData ( W, H );
			var data = img.data;

			for (var x = 0; x < W; ++x) {
				var col = v.cache.cols.get ( v.c0 + x );
				for (var y = 0; y < H; ++y) {
					var idx = (y * W + x) * 4;
					var lv = col ? col[ y ] * 3 : 0;
					data[ idx ] = LUT[ lv ];
					data[ idx + 1 ] = LUT[ lv + 1 ];
					data[ idx + 2 ] = LUT[ lv + 2 ];
					data[ idx + 3 ] = 255;
				}
			}
			ctx.putImageData ( img, 0, 0 );
			drawAxis ( v );
		}

		/* 頻率刻度與數字 */
		function drawAxis ( v ) {
			var list = v.scale === 'log' ?
				[ 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000 ] :
				[ 2000, 4000, 6000, 8000, 10000, 12000, 14000, 16000, 18000, 20000, 22000 ];
			var fmax = v.sr / 2;

			ctx.font = '10px sans-serif';
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'left';
			ctx.lineWidth = 3;

			for (var i = 0; i < list.length; ++i) {
				var f = list[ i ];
				if (f >= fmax * 0.985) continue;
				var y = Math.round ( (1 - fracAtFreq ( f, v.sr, v.scale )) * v.H );
				if (y < 7 || y > v.H - 7) continue;

				ctx.fillStyle = 'rgba(255,255,255,0.14)';
				ctx.fillRect ( 0, y, v.W, 1 );
				ctx.fillStyle = 'rgba(255,255,255,0.45)';
				ctx.fillRect ( 0, y, 6, 1 );

				var label = f >= 1000 ? (f / 1000) + 'k' : String ( f );
				ctx.strokeStyle = 'rgba(0,0,0,0.65)';
				ctx.strokeText ( label, 8, y );
				ctx.fillStyle = 'rgba(255,255,255,0.85)';
				ctx.fillText ( label, 8, y );
			}
		}

		/* 滑鼠讀值：頻率 / 音量 / 時間 */
		function onMove ( e ) {
			if (prefs.mode === 'off' || !view || !overlay || overlay.style.display === 'none') return ;

			var rect = overlay.getBoundingClientRect ();
			if (!rect.width || !rect.height) return ;
			var px = (e.clientX - rect.left) * view.W / rect.width;
			var py = (e.clientY - rect.top) * view.H / rect.height;
			if (px < 0 || py < 0 || px >= view.W || py >= view.H) { info_el.style.display = 'none'; return ; }

			var f = freqAtFrac ( 1 - py / view.H, view.sr, view.scale );
			var col = view.cache.cols.get ( view.c0 + (px | 0) );
			var db = col ? DB_FLOOR + col[ py | 0 ] / 255 * -DB_FLOOR : null;
			var time = view.left + px / view.W * view.vis;

			info_el.textContent = (f >= 1000 ? (f / 1000).toFixed ( 2 ) + ' kHz' : Math.round ( f ) + ' Hz') + '  |  ' +
				(db === null ? '--' : db.toFixed ( 0 ) + ' dB') + '  |  ' + time.toFixed ( 3 ) + ' s';
			info_el.style.display = 'block';
		}

		/* ---- 設定 ---- */
		function setPref ( key, val ) {
			if (!PKAE._deps.spectroPrefs.set ( key, val )) return ;
			app.fireEvent ('DidSpectrogramState', prefs);
			if (key === 'mode' && val === 'off') hide ();
			else schedule ( 0 );
		}

		this.setMode = function ( m ) { setPref ('mode', m); };
		this.setScale = function ( s ) { setPref ('scale', s); };
		this.setFFT = function ( n ) { setPref ('fft', n / 1); };
		this.getState = function () { return prefs; };

		app.listenFor ('RequestSpectrogramMode', function ( m ) { q.setMode ( m ); });
		app.listenFor ('RequestSpectrogramScale', function ( s ) { q.setScale ( s ); });
		app.listenFor ('RequestSpectrogramFFT', function ( n ) { q.setFFT ( n ); });

		/* 音訊內容改變 → 快取失效 */
		[ 'StatePush', 'StateDidPop', 'StateClearAll', 'DidLoadFile', 'DidUnloadFile', 'DidUpdateLen' ].forEach (function ( name ) {
			app.listenFor ( name, function () {
				++gen;
				if (prefs.mode !== 'off') schedule ( 60 );
			});
		});

		/* 縮放、捲動、視窗大小改變、波形重畫 → 跟著重畫 */
		var ws = wave ();
		if (ws && ws.on) {
			ws.on ('redraw', function () {
				if (prefs.mode !== 'off') schedule ( 30 );
			});
		}

		if (prefs.mode !== 'off') schedule ( 200 );
	};

	PKAE._deps.spectro = PKSPECTRO;

})( window, document, PKAudioEditor );


