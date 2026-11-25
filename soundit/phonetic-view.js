/* Soundit 語音頻譜分析視窗（頻譜圖＋音高線）
 *
 * 對選取範圍（沒選取就整段，上限 20 秒）畫出語音學常用的頻譜圖，並疊上音高線：
 *   - 寬頻／窄頻：短視窗（約 6 ms）看共振峰與聲門脈衝；長視窗（約 30 ms）看諧波
 *   - 頻率範圍 0–5000 Hz／0–2500 Hz
 *   - 音高線：沿用 timepitch-f0.js（PKF0.trackBuffer），右側自帶對數 Hz 軸，不與頻譜共用刻度
 *   - 點圖上任一處從該處播放；播放倍速（不變調）；Ctrl＋滾輪（或雙指）縮放；放大後可左右拖曳
 *   - 白底灰階，和一般語音學論文／詞典的頻譜圖相同
 *
 * 載入方式：index.html 在 PKAudioEditor.init 之後呼叫 PKPhoneticView.attach ( editor )
 * 事件：RequestActionPhoneticView
 * 不修改任何現有模組；運算都在視窗內完成，關閉視窗即釋放。
 */
(function ( w, d ) {
	'use strict';

	var MAX_SEC = 20;                       /* 分析範圍上限（秒） */
	var BAND_SEC = { wide: 0.006, narrow: 0.030 };
	var FMAX_FULL = 5000;                   /* 算到 5 kHz；2.5 kHz 檢視只是裁切 */
	var DB_RANGE = 50;                      /* 低於最大值 50 dB 以下一律白色 */
	var RATES = [ 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2 ];
	var HOP_MIN = 0.001, MAX_COLS = 6000;
	var NAME = 'phonetic';

	function tf ( key, zh, en ) {
		var s = w.PKLocale ? w.PKLocale.t ( key ) : key;
		if (s && s !== key) return s;
		var lang = '';
		try { lang = w.PKLocale.getLang (); } catch (e) {}
		return lang === 'en' ? en : zh;
	}

	/* ------------------------------------------------------------------
	 * 核心（純函式，不碰 DOM）
	 * ------------------------------------------------------------------ */
	var fft_cache = {};
	function getFFT ( n ) {
		if (fft_cache[ n ]) return fft_cache[ n ];
		var bits = Math.round ( Math.log ( n ) / Math.LN2 ), rev = new Uint32Array ( n ), i, b;
		for (i = 0; i < n; ++i) {
			var r = 0, x = i;
			for (b = 0; b < bits; ++b) { r = ( r << 1 ) | ( x & 1 ); x >>= 1; }
			rev[ i ] = r;
		}
		var cs = new Float64Array ( n >> 1 ), sn = new Float64Array ( n >> 1 );
		for (i = 0; i < ( n >> 1 ); ++i) { cs[ i ] = Math.cos ( 2 * Math.PI * i / n ); sn[ i ] = Math.sin ( 2 * Math.PI * i / n ); }
		return ( fft_cache[ n ] = function ( re, im ) {
			var i2, j, t;
			for (i2 = 0; i2 < n; ++i2) {
				j = rev[ i2 ];
				if (j > i2) { t = re[ i2 ]; re[ i2 ] = re[ j ]; re[ j ] = t; t = im[ i2 ]; im[ i2 ] = im[ j ]; im[ j ] = t; }
			}
			for (var size = 2; size <= n; size <<= 1) {
				var half = size >> 1, step = n / size;
				for (var st = 0; st < n; st += size) {
					for (var m = 0, tw = 0; m < half; ++m, tw += step) {
						var wr = cs[ tw ], wi = -sn[ tw ];
						var a = st + m, c = a + half;
						var xr = re[ c ] * wr - im[ c ] * wi, xi = re[ c ] * wi + im[ c ] * wr;
						re[ c ] = re[ a ] - xr; im[ c ] = im[ a ] - xi;
						re[ a ] += xr; im[ a ] += xi;
					}
				}
			}
		});
	}

	/* 以分段（每段約 12 ms）計算頻譜圖。回傳 { cancel, promise }
	 * 結果：{ cols, nb, df, hop(秒), db: Float32Array(cols*nb)（第 c 欄第 k 個頻帶 = db[c*nb+k]）, max } */
	function computeSpec ( mono, sr, mode, onprog ) {
		var cancelled = false;
		var promise = new Promise ( function ( resolve, reject ) {
			var wl = Math.max ( 16, Math.round ( BAND_SEC[ mode ] * sr ) );
			var nfft = 1; while (nfft < wl * 2 || nfft < sr / 25) nfft <<= 1;
			var df = sr / nfft;
			var nb = Math.max ( 2, Math.min ( nfft >> 1, Math.floor ( FMAX_FULL / df ) + 1 ) );
			var hopSec = Math.max ( HOP_MIN, mono.length / sr / MAX_COLS );
			var hop = Math.max ( 1, Math.round ( hopSec * sr ) );
			var cols = Math.max ( 1, Math.floor ( mono.length / hop ) );
			var data = new Float32Array ( cols * nb );

			/* 預強調（一階差分，6 dB/oct），讓高頻較容易看見 */
			var pre = new Float32Array ( mono.length );
			for (var i = 1; i < mono.length; ++i) pre[ i ] = mono[ i ] - 0.97 * mono[ i - 1 ];
			pre[ 0 ] = mono[ 0 ];

			var win = new Float64Array ( wl );
			for (var k = 0; k < wl; ++k) win[ k ] = 0.5 - 0.5 * Math.cos ( 2 * Math.PI * ( k + 0.5 ) / wl );

			var fft = getFFT ( nfft );
			var re = new Float64Array ( nfft ), im = new Float64Array ( nfft );
			var max = -1e9, c = 0;

			function step () {
				if (cancelled) return reject ( new Error ( 'cancelled' ) );
				var t0 = Date.now ();
				while (c < cols && Date.now () - t0 < 12) {
					var start = c * hop + ( hop >> 1 ) - ( wl >> 1 );
					re.fill ( 0 ); im.fill ( 0 );
					for (var j = 0; j < wl; ++j) {
						var idx = start + j;
						if (idx >= 0 && idx < pre.length) re[ j ] = pre[ idx ] * win[ j ];
					}
					fft ( re, im );
					var o = c * nb;
					for (var b = 0; b < nb; ++b) {
						var v = 10 * Math.log ( re[ b ] * re[ b ] + im[ b ] * im[ b ] + 1e-12 ) / Math.LN10;
						data[ o + b ] = v;
						if (v > max) max = v;
					}
					++c;
				}
				onprog && onprog ( c / cols );
				if (c < cols) setTimeout ( step, 0 );
				else resolve ({ cols: cols, nb: nb, df: df, hop: hop / sr, db: data, max: max });
			}
			step ();
		});
		return { promise: promise, cancel: function () { cancelled = true; } };
	}

	/* 把 dB 矩陣變成灰階圖（上方 = 高頻）。白 = 靜音、黑 = 最強 */
	function toImage ( spec ) {
		var cols = spec.cols, nb = spec.nb, db = spec.db;
		var img = new ImageData ( cols, nb );
		var px = img.data, floor = spec.max - DB_RANGE;
		for (var c = 0; c < cols; ++c) {
			for (var k = 0; k < nb; ++k) {
				var v = ( db[ c * nb + k ] - floor ) / DB_RANGE;
				v = v < 0 ? 0 : v > 1 ? 1 : v;
				var g = 255 - Math.round ( 245 * Math.pow ( v, 1.25 ) );
				var p = ( ( nb - 1 - k ) * cols + c ) * 4;
				px[ p ] = g; px[ p + 1 ] = g; px[ p + 2 ] = g + ( g < 250 ? 6 : 0 ); px[ p + 3 ] = 255;
			}
		}
		return img;
	}

	/* 選取範圍 → 單聲道 Float32Array */
	function monoOf ( buf, from, len ) {
		var out = new Float32Array ( len ), nch = buf.numberOfChannels, i, ch;
		for (ch = 0; ch < nch; ++ch) {
			var src = buf.getChannelData ( ch );
			for (i = 0; i < len; ++i) out[ i ] += src[ from + i ] / nch;
		}
		return out;
	}

	function wavBlob ( mono, sr ) {
		var n = mono.length, ab = new ArrayBuffer ( 44 + n * 2 ), v = new DataView ( ab ), i;
		function str ( o, s ) { for (var k = 0; k < s.length; ++k) v.setUint8 ( o + k, s.charCodeAt ( k ) ); }
		str ( 0, 'RIFF' ); v.setUint32 ( 4, 36 + n * 2, true ); str ( 8, 'WAVE' ); str ( 12, 'fmt ' );
		v.setUint32 ( 16, 16, true ); v.setUint16 ( 20, 1, true ); v.setUint16 ( 22, 1, true );
		v.setUint32 ( 24, sr, true ); v.setUint32 ( 28, sr * 2, true ); v.setUint16 ( 32, 2, true ); v.setUint16 ( 34, 16, true );
		str ( 36, 'data' ); v.setUint32 ( 40, n * 2, true );
		for (i = 0; i < n; ++i) {
			var s = mono[ i ]; s = s < -1 ? -1 : s > 1 ? 1 : s;
			v.setInt16 ( 44 + i * 2, s < 0 ? s * 32768 : s * 32767, true );
		}
		return new Blob ( [ ab ], { type: 'audio/wav' } );
	}

	/* 音高軸：對數刻度，範圍取有聲幀的 2%～98% 再各放寬一點 */
	function pitchAxis ( track ) {
		var vals = [];
		for (var i = 0; i < track.n; ++i) if (track.f0[ i ] > 0) vals.push ( track.f0[ i ] );
		if (vals.length < 2) return null;
		vals.sort ( function ( a, b ) { return a - b; } );
		var lo = vals[ Math.floor ( vals.length * 0.02 ) ], hi = vals[ Math.min ( vals.length - 1, Math.ceil ( vals.length * 0.98 ) ) ];
		if (hi / lo < 1.25) { var m = Math.sqrt ( hi * lo ); lo = m / 1.14; hi = m * 1.14; }
		return { lo: lo / 1.1, hi: hi * 1.1 };
	}
	var NICE_HZ = [ 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 220, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000 ];

	function niceTimeStep ( span, px ) {
		var steps = [ 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10 ];
		for (var i = 0; i < steps.length; ++i) if (steps[ i ] / span * px >= 70) return steps[ i ];
		return 10;
	}

	/* ------------------------------------------------------------------
	 * 視窗
	 * ------------------------------------------------------------------ */
	var CSS =
		'.pk_ph_back{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:env(safe-area-inset-top,0) 0 env(safe-area-inset-bottom,0)}' +
		'.pk_ph{background:#fff;color:#222;border-radius:12px;width:min(1120px,96vw);max-height:96vh;overflow:auto;padding:14px 18px 12px;box-sizing:border-box;font:14px/1.4 system-ui,"Noto Sans TC",sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.45)}' +
		'.pk_ph_hd{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}' +
		'.pk_ph_ttl{font-size:17px;font-weight:600}.pk_ph_dur{color:#666;font-size:13px;margin-right:6px}' +
		'.pk_ph_x{width:34px;height:34px;border-radius:50%;border:1px solid #ccc;background:#fff;color:#444;font-size:18px;line-height:1;cursor:pointer}' +
		'.pk_ph_bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:8px}' +
		'.pk_ph button.pk_ph_b{height:34px;padding:0 14px;border:1px solid #cfcfcf;border-radius:17px;background:#fff;color:#222;font:inherit;cursor:pointer;white-space:nowrap}' +
		'.pk_ph button.pk_ph_b:hover{background:#f3f3f3}' +
		'.pk_ph button.pk_ph_b.on{background:#e6f0fd;border-color:#b6d1f7;color:#1a62c9}' +
		'.pk_ph button.pk_ph_b.pc.on{background:#fde8e6;border-color:#f3b9b3;color:#c5221f}' +
		'.pk_ph button.pk_ph_b.sq{padding:0;width:34px}' +
		'.pk_ph_rate{min-width:30px;text-align:center;font-weight:600}' +
		'.pk_ph_cv{width:100%;height:min(52vh,400px);min-height:220px;display:block;border:0;touch-action:none;cursor:crosshair;background:#fff}' +
		'.pk_ph_ft{color:#777;font-size:12.5px;margin-top:6px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}' +
		'.pk_ph_rd{color:#1a1a1a;font-variant-numeric:tabular-nums;min-height:18px}' +
		'.pk_ph_st{color:#1a62c9}';

	function attach ( app ) {
		if (!app || app._phAttached) return ;
		app._phAttached = true;

		var style = d.createElement ( 'style' );
		style.textContent = CSS;
		d.head.appendChild ( style );

		var open = null;

		function wave () { return app.engine && app.engine.wavesurfer; }
		function isMulti () { var m = app.multitrack; return !!( m && m.IsOn && m.IsOn () ); }
		function say ( msg ) { w.OneUp && w.OneUp ( msg, 1800 ); }

		app.listenFor ( 'RequestActionPhoneticView', function () {
			if (open) return ;
			var ws = wave ();
			if (isMulti ()) return say ( tf ( 'ph.single_only', '語音頻譜分析目前僅支援單軌編輯', 'Phonetic view supports single-track editing only' ) );
			if (!ws || !ws.backend || !ws.backend.buffer) return say ( tf ( 'uifx.load_first', '請先載入音訊', 'Load audio first' ) );

			var buf = ws.backend.buffer, sr = buf.sampleRate;
			var region = ws.regions && ws.regions.list && ws.regions.list[ 0 ];
			var selStart = region ? region.start : 0;
			var selDur = region ? region.end - region.start : buf.duration;
			if (!( selDur > 0.02 )) return say ( tf ( 'tp.too_short', '選取範圍太短', 'Selection too short' ) );
			if (selDur > MAX_SEC) return say ( tf ( 'ph.too_long', '請先選取 20 秒以內的範圍', 'Select a range of 20 seconds or less first' ) );
			if (app.ui && app.ui.InteractionHandler && !app.ui.InteractionHandler.checkAndSet ( NAME )) return ;

			try { app.fireEvent ( 'RequestPause' ); } catch (e) {}

			var from = Math.max ( 0, Math.round ( selStart * sr ) );
			var len = Math.min ( buf.length - from, Math.round ( selDur * sr ) );
			var mono = monoOf ( buf, from, len );
			var dur = len / sr;
			open = makeDialog ( app, buf, mono, sr, dur, selStart, function () { open = null; } );
		});
	}

	function makeDialog ( app, srcBuf, mono, sr, dur, selStart, onclose ) {
		var S = { band: 'wide', fmax: 5000, pitch: true, rate: 3 };     /* rate = RATES 的索引 */
		var specs = {};            /* mode → { spec, canvas } */
		var curJob = null, track = null, paxis = null, status = '';
		var view = { t0: 0, t1: dur };
		var playhead = -1, hoverX = -1, hoverY = -1, raf = 0, closed = false, jobMode = '';

		/* ---------- DOM ---------- */
		var back = d.createElement ( 'div' );
		back.className = 'pk_ph_back';
		function fmt ( s ) { var m = ( s / 60 ) >> 0; return ( m ? m + ':' : '' ) + ( m && s - m * 60 < 10 ? '0' : '' ) + ( s - m * 60 ).toFixed ( 2 ); }
		back.innerHTML =
			'<div class="pk_ph" role="dialog" aria-modal="true">' +
				'<div class="pk_ph_hd"><div class="pk_ph_ttl">' + tf ( 'ph.title', '語音頻譜分析', 'Phonetic view' ) + ' <span style="font-weight:400;color:#777;font-size:13px">' + fmt ( selStart ) + ' – ' + fmt ( selStart + dur ) + '</span></div>' +
					'<div><span class="pk_ph_dur">' + dur.toFixed ( 2 ) + ' ' + tf ( 'ph.sec', '秒', 's' ) + '</span><button class="pk_ph_x" data-k="close" aria-label="Close">&#10005;</button></div></div>' +
				'<div class="pk_ph_bar">' +
					'<button class="pk_ph_b" data-k="play">&#9654; ' + tf ( 'ph.play', '播放', 'Play' ) + '</button>' +
					'<button class="pk_ph_b sq" data-k="slower" aria-label="Slower">&minus;</button><span class="pk_ph_rate" data-k="rate">1&times;</span><button class="pk_ph_b sq" data-k="faster" aria-label="Faster">+</button>' +
					'<button class="pk_ph_b" data-k="f5000">0&ndash;5000 Hz</button><button class="pk_ph_b" data-k="f2500">0&ndash;2500 Hz</button>' +
					'<button class="pk_ph_b" data-k="wide">' + tf ( 'ph.wide', '寬頻', 'Wideband' ) + '</button><button class="pk_ph_b" data-k="narrow">' + tf ( 'ph.narrow', '窄頻', 'Narrowband' ) + '</button>' +
					'<button class="pk_ph_b pc" data-k="pitch">' + tf ( 'ph.pitch', '音高線', 'Pitch' ) + '</button>' +
					'<span class="pk_ph_st" data-k="status"></span>' +
				'</div>' +
				'<canvas class="pk_ph_cv" data-k="cv"></canvas>' +
				'<div class="pk_ph_ft"><span>' + tf ( 'ph.help', '橫軸：時間（秒）　縱軸：頻率（Hz）　點圖上任一處從該處播放；放大後可左右拖曳（電腦版也可 Ctrl＋滾輪縮放）', 'X: time (s)  Y: frequency (Hz)  Click to play from there; drag to pan when zoomed (Ctrl+wheel or pinch to zoom)' ) + '</span><span class="pk_ph_rd" data-k="readout"></span></div>' +
			'</div>';
		d.body.appendChild ( back );

		var el = {};
		[].forEach.call ( back.querySelectorAll ( '[data-k]' ), function ( n ) { el[ n.getAttribute ( 'data-k' ) ] = n; } );
		var cv = el.cv, ctx = cv.getContext ( '2d' );

		/* ---------- 播放（用 <audio>，倍速時音高不變） ---------- */
		var url = URL.createObjectURL ( wavBlob ( mono, sr ) );
		var au = new Audio ( url );
		au.preload = 'auto';
		au.preservesPitch = true; au.webkitPreservesPitch = true; au.mozPreservesPitch = true;
		function playing () { return !au.paused && !au.ended; }
		function setPlayLabel () { el.play.innerHTML = playing () ? '&#10074;&#10074; ' + tf ( 'ph.pause', '暫停', 'Pause' ) : '&#9654; ' + tf ( 'ph.play', '播放', 'Play' ); }
		function tick () {
			raf = 0;
			if (closed) return ;
			playhead = au.currentTime;
			draw ();
			if (playing ()) raf = w.requestAnimationFrame ( tick );
		}
		function playFrom ( t ) {
			try { au.currentTime = Math.max ( 0, Math.min ( dur - 0.001, t ) ); } catch (e) {}
			au.playbackRate = RATES[ S.rate ];
			var p = au.play ();
			p && p.catch && p.catch ( function () {} );
		}
		au.addEventListener ( 'play', function () { setPlayLabel (); raf || ( raf = w.requestAnimationFrame ( tick ) ); } );
		au.addEventListener ( 'pause', function () { setPlayLabel (); playhead = au.currentTime; draw (); } );
		au.addEventListener ( 'ended', function () { setPlayLabel (); draw (); } );

		/* ---------- 分析 ---------- */
		function startSpec ( mode ) {
			if (specs[ mode ] || ( curJob && jobMode === mode )) return ;
			if (curJob) curJob.cancel ();
			jobMode = mode;
			var label = tf ( 'ph.analysing', '分析中', 'Analysing' );
			el.status.textContent = label + ' 0%';
			curJob = computeSpec ( mono, sr, mode, function ( p ) { if (!closed && jobMode === mode) el.status.textContent = label + ' ' + Math.round ( p * 100 ) + '%'; } );
			var job = curJob;
			job.promise.then ( function ( spec ) {
				if (closed) return ;
				var c = d.createElement ( 'canvas' );
				c.width = spec.cols; c.height = spec.nb;
				c.getContext ( '2d' ).putImageData ( toImage ( spec ), 0, 0 );
				specs[ mode ] = { spec: spec, canvas: c };
				curJob = null; jobMode = '';
				el.status.textContent = '';
				draw ();
			}, function () {} );
		}

		function startPitch () {
			var F0 = w.PKF0;
			if (!F0 || !F0.trackBuffer) { status = tf ( 'ph.no_f0', '找不到音高追蹤模組', 'Pitch tracker not loaded' ); return ; }
			var ab = null;
			try { ab = new w.AudioBuffer ({ numberOfChannels: 1, length: mono.length, sampleRate: sr }); } catch (e) {}
			if (!ab) {
				try { ab = w.PKAudioEditor.engine.wavesurfer.backend.ac.createBuffer ( 1, mono.length, sr ); } catch (e2) {}
			}
			if (!ab) return ;
			ab.copyToChannel ( mono, 0 );
			F0.trackBuffer ( ab ).then ( function ( tr ) {
				if (closed) return ;
				track = tr; paxis = pitchAxis ( tr );
				draw ();
			}, function () {} );
		}

		/* ---------- 繪製 ---------- */
		var M = { l: 54, t: 10, b: 30 };
		function plot () {
			var W = cv.clientWidth, H = cv.clientHeight;
			return { W: W, H: H, l: M.l, t: M.t, r: W - ( S.pitch && paxis ? 62 : 14 ), b: H - M.b };
		}
		function sizeCanvas () {
			var r = Math.min ( w.devicePixelRatio || 1, 2 );
			var pw = Math.round ( cv.clientWidth * r ), ph = Math.round ( cv.clientHeight * r );
			if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
			ctx.setTransform ( r, 0, 0, r, 0, 0 );
		}
		function xOf ( t, P ) { return P.l + ( t - view.t0 ) / ( view.t1 - view.t0 ) * ( P.r - P.l ); }
		function tOf ( x, P ) { return view.t0 + ( x - P.l ) / ( P.r - P.l ) * ( view.t1 - view.t0 ); }
		function yPitch ( hz, P ) { return P.b - Math.log ( hz / paxis.lo ) / Math.log ( paxis.hi / paxis.lo ) * ( P.b - P.t ); }

		function draw () {
			if (closed) return ;
			sizeCanvas ();
			var P = plot ();
			ctx.fillStyle = '#fff';
			ctx.fillRect ( 0, 0, P.W, P.H );
			ctx.font = '12px system-ui,sans-serif';

			var item = specs[ S.band ];
			ctx.save ();
			ctx.beginPath (); ctx.rect ( P.l, P.t, P.r - P.l, P.b - P.t ); ctx.clip ();
			if (item) {
				var sp = item.spec;
				var nbView = Math.max ( 2, Math.min ( sp.nb, Math.round ( S.fmax / sp.df ) ) );
				var sx = view.t0 / sp.hop, sw = ( view.t1 - view.t0 ) / sp.hop;
				ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
				/* 來源超出範圍的部分（時間軸邊緣）以白底留白 */
				var cx0 = Math.max ( 0, sx ), cx1 = Math.min ( sp.cols, sx + sw );
				if (cx1 > cx0) {
					var dx0 = P.l + ( cx0 - sx ) / sw * ( P.r - P.l ), dx1 = P.l + ( cx1 - sx ) / sw * ( P.r - P.l );
					ctx.drawImage ( item.canvas, cx0, sp.nb - nbView, cx1 - cx0, nbView, dx0, P.t, dx1 - dx0, P.b - P.t );
				}
			}

			/* 頻率格線（虛線） */
			ctx.restore ();
			ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.setLineDash ( [ 3, 3 ] );
			ctx.fillStyle = '#555'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
			var fstep = S.fmax > 3000 ? 1000 : 500;
			for (var f = 0; f <= S.fmax + 1; f += fstep) {
				var y = Math.round ( P.b - f / S.fmax * ( P.b - P.t ) ) + 0.5;
				if (f > 0 && f < S.fmax) { ctx.beginPath (); ctx.moveTo ( P.l, y ); ctx.lineTo ( P.r, y ); ctx.stroke (); }
				var lab = f >= 1000 ? ( f / 1000 ) + 'k' : String ( f );
				if (f === S.fmax) lab += ' Hz';
				ctx.fillText ( lab, P.l - 6, Math.max ( P.t + 6, Math.min ( P.b, y ) ) );
			}
			ctx.setLineDash ( [] );

			/* 外框 */
			ctx.strokeStyle = '#bbb';
			ctx.strokeRect ( P.l + 0.5, P.t + 0.5, P.r - P.l, P.b - P.t );

			/* 時間軸 */
			var span = view.t1 - view.t0, ts = niceTimeStep ( span, P.r - P.l );
			var dec = ts >= 1 ? 0 : ts >= 0.1 ? 1 : ts >= 0.01 ? 2 : 3;
			ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = '#555';
			for (var t = Math.ceil ( view.t0 / ts ) * ts; t <= view.t1 + 1e-9; t += ts) {
				var x = Math.round ( xOf ( t, P ) ) + 0.5;
				ctx.strokeStyle = '#bbb';
				ctx.beginPath (); ctx.moveTo ( x, P.b ); ctx.lineTo ( x, P.b + 4 ); ctx.stroke ();
				ctx.fillText ( t.toFixed ( dec ), x, P.b + 7 );
			}

			/* 音高線 */
			if (S.pitch && track && paxis) {
				ctx.save ();
				ctx.beginPath (); ctx.rect ( P.l, P.t, P.r - P.l, P.b - P.t ); ctx.clip ();
				ctx.strokeStyle = '#d93025'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
				var pen = false, i0 = Math.max ( 0, Math.floor ( view.t0 * track.rate ) - 1 ), i1 = Math.min ( track.n - 1, Math.ceil ( view.t1 * track.rate ) + 1 );
				ctx.beginPath ();
				for (var i = i0; i <= i1; ++i) {
					var hz = track.f0[ i ];
					if (!( hz > 0 )) { pen = false; continue; }
					var px = xOf ( i / track.rate, P ), py = yPitch ( hz, P );
					if (pen) ctx.lineTo ( px, py ); else { ctx.moveTo ( px, py ); pen = true; }
				}
				ctx.stroke ();
				ctx.restore ();

				/* 右側音高軸（對數） */
				ctx.fillStyle = '#c5221f'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
				var ticks = [], last = 1e9;
				for (var n = NICE_HZ.length - 1; n >= 0; --n) {
					var hv = NICE_HZ[ n ];
					if (hv < paxis.lo * 1.03 || hv > paxis.hi / 1.03) continue;
					var ty = yPitch ( hv, P );
					if (Math.abs ( ty - last ) < 34) continue;
					ticks.push ( [ hv, ty ] ); last = ty;
				}
				for (var q = 0; q < ticks.length; ++q) {
					ctx.fillText ( ticks[ q ][ 0 ] + ( q === 0 ? ' Hz' : '' ), P.r + 8, ticks[ q ][ 1 ] );
				}
			}

			/* 播放位置 */
			if (playhead >= view.t0 && playhead <= view.t1 && ( playing () || playhead > 0 )) {
				var hx = Math.round ( xOf ( playhead, P ) ) + 0.5;
				ctx.strokeStyle = '#1a73e8'; ctx.lineWidth = 1.5;
				ctx.beginPath (); ctx.moveTo ( hx, P.t ); ctx.lineTo ( hx, P.b ); ctx.stroke ();
			}

			/* 游標處的讀值 */
			if (hoverX >= P.l && hoverX <= P.r && hoverY >= P.t && hoverY <= P.b) {
				var ht = tOf ( hoverX, P ), hf = ( P.b - hoverY ) / ( P.b - P.t ) * S.fmax;
				var txt = ht.toFixed ( 3 ) + ' s   ' + Math.round ( hf ) + ' Hz';
				if (track && S.pitch) {
					var j = Math.round ( ht * track.rate );
					if (j >= 0 && j < track.n && track.f0[ j ] > 0) txt += '   F0 ' + track.f0[ j ].toFixed ( 1 ) + ' Hz';
				}
				el.readout.textContent = txt;
			} else el.readout.textContent = '';
		}

		/* ---------- 工具列 ---------- */
		function sync () {
			el.f5000.classList.toggle ( 'on', S.fmax === 5000 );
			el.f2500.classList.toggle ( 'on', S.fmax === 2500 );
			el.wide.classList.toggle ( 'on', S.band === 'wide' );
			el.narrow.classList.toggle ( 'on', S.band === 'narrow' );
			el.pitch.classList.toggle ( 'on', S.pitch );
			el.rate.textContent = RATES[ S.rate ] + '\u00d7';
			el.slower.disabled = S.rate === 0; el.faster.disabled = S.rate === RATES.length - 1;
			setPlayLabel ();
		}
		function setBand ( b ) { S.band = b; startSpec ( b ); sync (); draw (); }
		function setRate ( i ) { S.rate = Math.max ( 0, Math.min ( RATES.length - 1, i ) ); au.playbackRate = RATES[ S.rate ]; sync (); }
		function close () {
			if (closed) return ;
			closed = true;
			if (curJob) curJob.cancel ();
			try { au.pause (); } catch (e) {}
			au.removeAttribute ( 'src' ); URL.revokeObjectURL ( url );
			raf && w.cancelAnimationFrame ( raf );
			w.removeEventListener ( 'keydown', onKey, true );
			w.removeEventListener ( 'resize', draw );
			back.parentNode && back.parentNode.removeChild ( back );
			try { app.ui.InteractionHandler.forceUnset ( NAME ); } catch (e) {}
			onclose && onclose ();
		}

		el.close.onclick = close;
		back.addEventListener ( 'mousedown', function ( e ) { if (e.target === back) close (); } );
		el.play.onclick = function () {
			if (playing ()) au.pause ();
			else playFrom ( au.ended || playhead < 0 || playhead >= dur - 0.01 ? view.t0 : au.currentTime );
		};
		el.slower.onclick = function () { setRate ( S.rate - 1 ); };
		el.faster.onclick = function () { setRate ( S.rate + 1 ); };
		el.f5000.onclick = function () { S.fmax = 5000; sync (); draw (); };
		el.f2500.onclick = function () { S.fmax = 2500; sync (); draw (); };
		el.wide.onclick = function () { setBand ( 'wide' ); };
		el.narrow.onclick = function () { setBand ( 'narrow' ); };
		el.pitch.onclick = function () { S.pitch = !S.pitch; sync (); draw (); };

		/* 視窗開著時，鍵盤不要漏給編輯器（避免誤按刪除等快捷鍵）；空白鍵＝播放／暫停，Esc＝關閉 */
		function onKey ( e ) {
			if (e.key === 'Escape') { e.preventDefault (); close (); }
			else if (e.key === ' ' || e.keyCode === 32) { e.preventDefault (); if (!e.repeat) el.play.onclick (); }
			e.stopPropagation ();
		}
		w.addEventListener ( 'keydown', onKey, true );
		w.addEventListener ( 'resize', draw );

		/* ---------- 滑鼠／觸控：點擊播放、拖曳平移、Ctrl＋滾輪／雙指縮放 ---------- */
		var ptrs = {}, down = null, pinch0 = null;
		function clampView () {
			var span = Math.max ( Math.min ( 0.1, dur ), Math.min ( dur, view.t1 - view.t0 ) );
			if (view.t0 < 0) view.t0 = 0;
			view.t1 = view.t0 + span;
			if (view.t1 > dur) { view.t1 = dur; view.t0 = Math.max ( 0, dur - span ); }
		}
		function zoomAt ( t, newSpan ) {
			var span = view.t1 - view.t0, f = ( t - view.t0 ) / span;
			newSpan = Math.max ( Math.min ( 0.1, dur ), Math.min ( dur, newSpan ) );
			view.t0 = t - f * newSpan; view.t1 = view.t0 + newSpan;
			clampView (); draw ();
		}
		function pos ( e ) { var r = cv.getBoundingClientRect (); return { x: e.clientX - r.left, y: e.clientY - r.top }; }

		cv.addEventListener ( 'pointerdown', function ( e ) {
			cv.setPointerCapture && cv.setPointerCapture ( e.pointerId );
			var p = pos ( e ); ptrs[ e.pointerId ] = p;
			var ids = Object.keys ( ptrs );
			if (ids.length === 2) {
				var a = ptrs[ ids[ 0 ] ], b = ptrs[ ids[ 1 ] ];
				pinch0 = { dist: Math.abs ( a.x - b.x ) || 1, span: view.t1 - view.t0 };
				down = null;
			} else down = { x: p.x, t0: view.t0, moved: false };
		});
		cv.addEventListener ( 'pointermove', function ( e ) {
			var p = pos ( e );
			if (ptrs[ e.pointerId ]) ptrs[ e.pointerId ] = p;
			var P = plot (), ids = Object.keys ( ptrs );
			if (pinch0 && ids.length === 2) {
				var a = ptrs[ ids[ 0 ] ], b = ptrs[ ids[ 1 ] ];
				zoomAt ( tOf ( ( a.x + b.x ) / 2, P ), pinch0.span * pinch0.dist / ( Math.abs ( a.x - b.x ) || 1 ) );
				return ;
			}
			if (down) {
				if (Math.abs ( p.x - down.x ) > 4) down.moved = true;
				if (down.moved && view.t1 - view.t0 < dur - 1e-6) {
					var span = view.t1 - view.t0;
					view.t0 = down.t0 - ( p.x - down.x ) / ( P.r - P.l ) * span; view.t1 = view.t0 + span;
					clampView (); draw ();
					return ;
				}
			}
			hoverX = p.x; hoverY = p.y; draw ();
		});
		function up ( e ) {
			var p = pos ( e ), P = plot ();
			if (down && !down.moved && ptrs[ e.pointerId ] && p.x >= P.l && p.x <= P.r) playFrom ( tOf ( p.x, P ) );
			delete ptrs[ e.pointerId ];
			if (Object.keys ( ptrs ).length < 2) pinch0 = null;
			down = null;
		}
		cv.addEventListener ( 'pointerup', up );
		cv.addEventListener ( 'pointercancel', function ( e ) { delete ptrs[ e.pointerId ]; pinch0 = null; down = null; } );
		cv.addEventListener ( 'pointerleave', function () { hoverX = hoverY = -1; draw (); } );
		cv.addEventListener ( 'wheel', function ( e ) {
			var P = plot (), p = pos ( e );
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault ();
				zoomAt ( tOf ( p.x, P ), ( view.t1 - view.t0 ) * ( e.deltaY > 0 ? 1.25 : 0.8 ) );
			} else if (view.t1 - view.t0 < dur - 1e-6 && ( e.deltaX || e.shiftKey )) {
				e.preventDefault ();
				var span = view.t1 - view.t0, dx = ( e.deltaX || e.deltaY ) / ( P.r - P.l ) * span;
				view.t0 += dx; view.t1 = view.t0 + span; clampView (); draw ();
			}
		}, { passive: false } );

		sync ();
		startSpec ( 'wide' );
		startPitch ();
		w.requestAnimationFrame ( draw );
		return { close: close };
	}

	w.PKPhoneticView = { attach: attach, _core: { computeSpec: computeSpec, toImage: toImage, pitchAxis: pitchAxis } };

})( window, document );


