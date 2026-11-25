/* Soundit 音高輪廓顯示（階段 4-2）
 *
 * 把 F0 追蹤（timepitch-f0.js）的結果畫成一條線，疊在波形／頻譜圖上，時間軸與縮放、捲動同步。
 *   - 頻譜圖開啟時：頻率軸與頻譜圖相同（輪廓會貼著基頻與各諧波）
 *   - 頻譜圖關閉時：自備對數頻率軸，畫音名格線（C4、A4…），輪廓可直接讀出音高
 *   - 滑鼠移到輪廓附近：顯示 頻率 / 音名 / 與標準音差幾音分
 *   - 分析在背景分段進行（每段約 12 ms），不卡畫面；結果依音訊內容快取，編輯後自動重新分析
 *
 * 載入方式：index.html 在 PKAudioEditor.init 之後呼叫 PKPitchContourUI.attach ( editor )
 * 事件：RequestPitchContour（true / false / 省略 = 切換）→ DidPitchContourState { on }
 * 對外：PKPitchContourUI.get () → { on }（選單用）；PKPitchContourUI.track () → 目前的 F0 軌跡與起點
 *      ( { track, offset } ，後續小階段的輪廓編輯、PSOLA 會重用 )
 *
 * 超過 15 分鐘的檔案：只分析目前選取範圍（沒有選取就提示）。
 *
 * [階段 4-3 新增] 給輪廓編輯（ui-pitch-contour-edit.js）用的介面：
 *   PKPitchContourUI.setEditor ( ed )   掛上編輯模型；之後顯示 ed.edited，被改過時原始輪廓以灰線疊在下面
 *   PKPitchContourUI.view ()            最近一次畫面參數 { W,H,left,vis,pxs,pr,off,axis }；axis.y(hz) / axis.hz(y)
 *   PKPitchContourUI.redraw ()          立即重畫
 *   PKPitchContourUI.overlay ()         疊圖 canvas（編輯模式時可收滑鼠）
 *   PKPitchContourUI.addHook ( fn )     每次重畫完呼叫 fn ( ctx, view )，編輯工具列用來畫範圍選取
 *   PKPitchContourUI.setInteractive ( bool )  編輯模式開關：true 時疊圖吃滑鼠事件，波形不會被拖選
 *   事件 DidPitchContourTrack { track, offset }：每次（重新）分析完成時觸發
 */
(function ( w, d ) {
	'use strict';

	var PREF_KEY = 'pk_pitchcontour';
	var MAX_WHOLE_SEC = 900;
	var NOTE = [ 'C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B' ];

	var prefs = { on: false };
	try { prefs.on = JSON.parse ( w.localStorage.getItem ( PREF_KEY ) || '{}' ).on === true; } catch (e) {}

	var last = { track: null, offset: 0 };

	function tf ( key, zh, en ) {
		var s = w.PKLocale ? w.PKLocale.t ( key ) : key;
		if (s && s !== key) return s;
		var lang = '';
		try { lang = w.PKLocale.getLang (); } catch (e) {}
		return lang === 'en' ? en : zh;
	}

	/* [新增 4-3] 目前顯示的軌跡：有編輯模型就用編輯後的，否則用偵測結果 */
	function shown () { return last.ed ? last.ed.edited : last.track; }
	var hooks = [], interactive = false;

	function noteName ( hz ) {
		var m = 69 + 12 * Math.log ( hz / 440 ) / Math.LN2, r = Math.round ( m );
		var cents = Math.round ( ( m - r ) * 100 );
		return NOTE[ ( ( r % 12 ) + 12 ) % 12 ] + ( Math.floor ( r / 12 ) - 1 ) + ( cents ? ( cents > 0 ? ' +' : ' ' ) + cents + 'ct' : '' );
	}

	function attach ( app ) {
		if (!app || app._pcAttached) return ;
		app._pcAttached = true;

		var overlay = null, ctx = null, info = null, hover = null;
		var gen = 0, key = '', job = 0, timer = 0, bound = false;
		var view = null;                                    /* 最近一次畫面參數，給滑鼠讀值用 */
		var ownRange = null;

		function wave () { return app.engine && app.engine.wavesurfer; }
		function isMulti () { var m = app.multitrack; return !!( m && m.IsOn && m.IsOn () ); }
		function deps () { return app._deps || {}; }

		function ensureOverlay ( ws ) {
			var wrapper = ws.drawer && ws.drawer.wrapper;
			if (!wrapper) return false;
			if (!overlay) {
				overlay = d.createElement ('canvas');
				overlay.className = 'pk_pitchcontour';
				overlay.style.cssText = 'position:absolute;left:0;top:0;z-index:3;pointer-events:none;display:none;';
				ctx = overlay.getContext ('2d');

				info = d.createElement ('div');
				info.className = 'pk_pitchcontour_info';
				info.style.cssText = 'position:absolute;left:6px;top:6px;z-index:4;pointer-events:none;display:none;' +
					'padding:2px 7px;border-radius:3px;background:rgba(0,0,0,0.72);color:#5af2ff;font:11px/1.5 sans-serif;white-space:nowrap;';

				wrapper.addEventListener ('mousemove', onMove);
				wrapper.addEventListener ('mouseleave', function () { hoverHide (); });
			}
			if (overlay.parentNode !== wrapper) { wrapper.appendChild ( overlay ); wrapper.appendChild ( info ); }
			return true;
		}

		function hoverHide () { if (hover) { hover.style.display = 'none'; } }

		function hide () {
			if (overlay) overlay.style.display = 'none';
			if (info) info.style.display = 'none';
			hoverHide ();
			view = null;
		}

		function status ( txt ) {
			if (!info) return ;
			if (txt) { info.textContent = txt; info.style.display = 'block'; }
			else info.style.display = 'none';
		}

		function schedule ( delay ) {
			w.clearTimeout ( timer );
			timer = w.setTimeout ( run, delay === undefined ? 40 : delay );
		}

		/* ---------- 分析 ---------- */
		function analyze ( ws, buffer ) {
			var F = w.PKF0;
			if (!F) return ;
			var sr = buffer.sampleRate, from = 0, to = buffer.length;
			if (buffer.duration > MAX_WHOLE_SEC) {
				var rg = ws.regions && ws.regions.list && ws.regions.list[0];
				if (!rg) { if (key !== 'toolong') { key = 'toolong'; app.fireEvent && w.OneUp && w.OneUp ( tf ('pc.too_long', '檔案超過 15 分鐘，請先選取要分析的範圍', 'File is over 15 min — select a range to analyze'), 2200 ); } return ; }
				from = Math.max ( 0, Math.floor ( rg.start * sr ) );
				to = Math.min ( buffer.length, Math.ceil ( rg.end * sr ) );
			}
			var k = [ buffer.length, sr, buffer.numberOfChannels, from, to, gen ].join ('/');
			if (k === key) return ;
			key = k;

			var my = ++job;
			var pseudo = {
				numberOfChannels: buffer.numberOfChannels, sampleRate: sr,
				getChannelData: function ( c ) { return buffer.getChannelData ( c ).subarray ( from, to ); }
			};
			status ( tf ('pc.analyzing', '音高分析中…', 'Analyzing pitch…') );
			F.trackBuffer ( pseudo, { onprogress: function ( p ) {
				if (my === job) status ( tf ('pc.analyzing', '音高分析中…', 'Analyzing pitch…') + ' ' + Math.round ( p * 100 ) + '%' );
			}}).then ( function ( tr ) {
				if (my !== job) return ;
				last = { track: tr, offset: from / sr, ed: null };      /* [修改] 多了 ed 欄位；音訊內容變動時 last 整個重設，編輯也隨之清除 */
				ownRange = null;
				app.fireEvent ('DidPitchContourTrack', { track: tr, offset: last.offset });   /* [新增] */
				status ( '' );
				if (!F.stats ( tr ).count) {
					status ( tf ('pc.none', '找不到明確的音高', 'No clear pitch found') );
					w.setTimeout ( function () { if (my === job) status ( '' ); }, 2200 );
				}
				schedule ( 0 );
			}).catch ( function () { if (my === job) status ( '' ); });
		}

		/* ---------- 繪製 ---------- */
		function run () {
			var ws = wave ();
			if (!prefs.on || isMulti ()) { hide (); return ; }
			var buffer = ws && ws.backend && ws.backend.buffer;
			if (!buffer || !buffer.length || !ws.drawer || !ensureOverlay ( ws )) { hide (); return ; }
			if (!w.PKF0) { hide (); return ; }

			analyze ( ws, buffer );
			if (!last.track || key === 'toolong') { if (overlay) overlay.style.display = 'none'; return ; }
			draw ( ws, buffer );
		}

		/* 頻率 → y（0 = 最上方）。頻譜圖開啟時沿用它的軸，否則用自己的對數軸 */
		function makeAxis ( H, sr, tr ) {
			var D = deps (), sp = D.spectroPrefs && D.spectroPrefs.get (), core = D.spectroCore;
			if (sp && sp.mode !== 'off' && core) {
				return { own: false,
					y: function ( f ) { return ( 1 - core.fracAtFreq ( f, sr, sp.scale ) ) * H; },
					hz: function ( y ) { return core.freqAtFrac ( 1 - y / H, sr, sp.scale ); } };   /* [新增] hz：y → 頻率 */
			}
			if (!ownRange) {
				var st = w.PKF0.stats ( tr ), lo = Math.max ( tr.fmin, ( st.p10 || 100 ) / 1.7 ), hi = Math.min ( tr.fmax * 1.25, ( st.p90 || 300 ) * 1.7 );
				if (hi < lo * 3) { var mid = Math.sqrt ( lo * hi ); lo = mid / 1.8; hi = mid * 1.8; }
				ownRange = { lo: lo, hi: hi };
			}
			var lg = Math.log ( ownRange.hi / ownRange.lo );
			return { own: true, lo: ownRange.lo, hi: ownRange.hi,
				y: function ( f ) { return ( 1 - Math.log ( f / ownRange.lo ) / lg ) * H; },
				hz: function ( y ) { return ownRange.lo * Math.exp ( ( 1 - y / H ) * lg ); } };       /* [新增] hz：y → 頻率 */
		}

		function drawGrid ( axis, W, H, pr ) {
			ctx.fillStyle = 'rgba(0,0,0,0.38)';
			ctx.fillRect ( 0, 0, W, H );
			var mLo = 69 + 12 * Math.log ( axis.lo / 440 ) / Math.LN2, mHi = 69 + 12 * Math.log ( axis.hi / 440 ) / Math.LN2;
			var pxPer = H / ( mHi - mLo ) / pr;
			ctx.font = 10 * pr + 'px sans-serif';
			ctx.textBaseline = 'middle';
			ctx.lineWidth = 1;
			for (var m = Math.ceil ( mLo ); m <= mHi; ++m) {
				var pc = ( ( m % 12 ) + 12 ) % 12, isC = pc === 0, isA = m === 69;
				if (pxPer < 5 && !isC) continue;
				var y = Math.round ( axis.y ( 440 * Math.pow ( 2, ( m - 69 ) / 12 ) ) ) + 0.5;
				ctx.fillStyle = isC || isA ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.10)';
				ctx.fillRect ( 0, y, W, 1 );
				if (isC || isA || pxPer >= 14) {
					var lb = NOTE[pc] + ( Math.floor ( m / 12 ) - 1 );
					ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3;
					ctx.strokeText ( lb, W - 30 * pr, y ); ctx.lineWidth = 1;
					ctx.fillStyle = 'rgba(255,255,255,0.8)';
					ctx.fillText ( lb, W - 30 * pr, y );
				}
			}
		}

		function draw ( ws, buffer ) {
			var tr = shown (), off = last.offset;                    /* [修改] last.track → shown () */
			var base = last.ed && last.ed.dirty () ? last.track : null;   /* [新增] 被改過 → 原始輪廓當底圖 */
			var pr = ws.drawer.params.pixelRatio || 1;
			var W = Math.round ( ws.drawer.getWidth () ), H = Math.round ( ws.drawer.height );
			if (!( W > 0 ) || !( H > 0 )) { hide (); return ; }
			if (overlay.width !== W || overlay.height !== H) { overlay.width = W; overlay.height = H; }
			overlay.style.width = ( W / pr ) + 'px';
			overlay.style.height = ( H / pr ) + 'px';
			overlay.style.display = 'block';

			var vis = ws.VisibleDuration || ws.getDuration () || buffer.duration;
			var left = ws.LeftProgress || 0, pxs = W / vis;
			var axis = makeAxis ( H, buffer.sampleRate, tr );
			view = { W: W, H: H, left: left, vis: vis, pxs: pxs, axis: axis, pr: pr, off: off };   /* [修改] 多 pr、off */

			ctx.clearRect ( 0, 0, W, H );
			if (axis.own) drawGrid ( axis, W, H, pr );

			/* [修改] 原本直接在 draw 裡建立 segs，現在包成 build ( t )，原始與編輯後各建一次 */
			function build ( tr ) {
				/* 取得每個 x（裝置像素）的 log2 F0；零 = 無聲。畫面幀數比像素多時取該像素內有聲幀的平均 */
				var fpp = tr.rate / pxs;                         /* 每像素幀數 */
				var segs = [], cur = null, x, i;

				function push ( px, lf ) {
					if (lf === null) { cur = null; return ; }
					var y = axis.y ( Math.pow ( 2, lf ) );
					if (!cur) { cur = []; segs.push ( cur ); }
					cur.push ( px, y );
				}

				if (fpp < 1) {
					var i0 = Math.max ( 0, Math.floor ( ( left - off ) * tr.rate ) - 1 ), i1 = Math.min ( tr.n - 1, Math.ceil ( ( left + vis - off ) * tr.rate ) + 1 );
					for (i = i0; i <= i1; ++i) {
						var px = ( off + i / tr.rate - left ) * pxs;
						push ( px, tr.f0[i] > 0 ? Math.log ( tr.f0[i] ) / Math.LN2 : null );
					}
				}
				else {
					for (x = 0; x < W; ++x) {
						var a = Math.max ( 0, Math.floor ( ( left + x / pxs - off ) * tr.rate ) );
						var b = Math.min ( tr.n - 1, Math.ceil ( ( left + ( x + 1 ) / pxs - off ) * tr.rate ) );
						var sum = 0, cnt = 0;
						for (i = a; i <= b; ++i) if (tr.f0[i] > 0) { sum += Math.log ( tr.f0[i] ) / Math.LN2; ++cnt; }
						push ( x, cnt * 2 >= Math.max ( 1, b - a + 1 ) ? sum / cnt : null );
					}
				}
				return segs;
			}

			function stroke ( segs, style, lw ) {                     /* [修改] 多一個 segs 參數 */
				ctx.strokeStyle = style; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
				for (var s = 0; s < segs.length; ++s) {
					var p = segs[s];
					ctx.beginPath ();
					if (p.length === 2) { ctx.moveTo ( p[0] - 0.5, p[1] ); ctx.lineTo ( p[0] + 0.5, p[1] ); }
					else { ctx.moveTo ( p[0], p[1] ); for (var k = 2; k < p.length; k += 2) ctx.lineTo ( p[k], p[k + 1] ); }
					ctx.stroke ();
				}
			}
			if (base) stroke ( build ( base ), 'rgba(190,190,190,0.55)', 1.5 * pr );   /* [新增] 原始輪廓（灰） */
			var segs = build ( tr );
			stroke ( segs, 'rgba(0,0,0,0.65)', 4 * pr );
			stroke ( segs, base ? '#ffd24a' : '#5af2ff', 2 * pr );                     /* [修改] 編輯過用黃線，沒改過維持青色 */
			for (var hk = 0; hk < hooks.length; ++hk) { try { hooks[hk] ( ctx, view ); } catch (e) {} }   /* [新增] */
		}

		/* ---------- 滑鼠讀值 ---------- */
		function onMove ( e ) {
			if (!prefs.on || !view || !last.track || !overlay || overlay.style.display === 'none') return ;
			if (interactive && e.buttons) return ;                    /* [新增] 編輯中（按著滑鼠）不顯示讀值 */
			var rect = overlay.getBoundingClientRect ();
			if (!rect.width) return ;
			var px = ( e.clientX - rect.left ) * view.W / rect.width;
			var t = view.left + px / view.pxs, tr = shown ();         /* [修改] last.track → shown () */
			var c = Math.round ( ( t - last.offset ) * tr.rate ), best = 0, i;
			for (i = -3; i <= 3; ++i) { var j = c + i; if (j >= 0 && j < tr.n && tr.f0[j] > 0 && ( !best || Math.abs ( i ) < Math.abs ( best - c ) )) best = j; }
			if (!best && !( c >= 0 && c < tr.n && tr.f0[c] > 0 )) { status ( '' ); return ; }
			var f = tr.f0[ best || c ];
			status ( '♪ ' + noteName ( f ) + '  |  ' + f.toFixed ( 1 ) + ' Hz' );
		}

		/* ---------- 開關與事件 ---------- */
		function setOn ( on ) {
			on = !!on;
			if (on === prefs.on) { app.fireEvent ('DidPitchContourState', { on: prefs.on }); return ; }
			prefs.on = on;
			try { w.localStorage.setItem ( PREF_KEY, JSON.stringify ( prefs ) ); } catch (e) {}
			app.fireEvent ('DidPitchContourState', { on: on });
			if (!on) { ++job; hide (); setInteractive ( false ); } else schedule ( 0 );   /* [修改] 關閉輪廓時也離開編輯模式 */
		}
		app.listenFor ('RequestPitchContour', function ( v ) { setOn ( v === undefined ? !prefs.on : v ); });

		[ 'StatePush', 'StateDidPop', 'StateClearAll', 'DidLoadFile', 'DidUnloadFile', 'DidUpdateLen' ].forEach ( function ( name ) {
			app.listenFor ( name, function () {
				++gen; key = ''; last = { track: null, offset: 0 }; ownRange = null;
				if (name === 'DidUnloadFile' || name === 'DidLoadFile') bindWave ();
				if (prefs.on) schedule ( 80 ); else ++job;
			});
		});

		/* 頻譜圖設定改變 → 軸改變，重畫 */
		app.listenFor ('DidSpectrogramState', function () { if (prefs.on) schedule ( 80 ); });

		function bindWave () {
			var ws = wave ();
			if (bound || !ws || !ws.on) return ;
			bound = true;
			ws.on ('redraw', function () { if (prefs.on) schedule ( 30 ); });
		}
		bindWave ();
		if (prefs.on) schedule ( 300 );

		/* [新增 4-3] 編輯用介面 */
		function setInteractive ( v ) {
			interactive = !!v;
			if (overlay) overlay.style.pointerEvents = interactive ? 'auto' : 'none';
			if (overlay) overlay.style.cursor = interactive ? 'crosshair' : '';
		}
		api.setInteractive = setInteractive;
		api.setEditor = function ( ed ) { last.ed = ed || null; if (prefs.on) schedule ( 0 ); };
		api.redraw = function () { if (prefs.on) schedule ( 0 ); };
		api.view = function () { return view; };
		api.overlay = function () { return overlay; };
		api.addHook = function ( fn ) { hooks.push ( fn ); };
	}

	var api = w.PKPitchContourUI = {
		attach: attach,
		get: function () { return prefs; },
		track: function () { return last; },
		/* [新增 4-3] 編輯介面的預設空實作（attach 之後會被換成真的） */
		setInteractive: function () {}, setEditor: function () {}, redraw: function () {},
		view: function () { return null; }, overlay: function () { return null; }, addHook: function () {}
	};
})( window, document );


