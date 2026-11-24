(function ( w, d, PKAE ) {
	'use strict';

var h = PKAE._deps.uiHelpers;
var activeMultitrackFor = h.activeMultitrackFor;

	function _makeUIBarBottom ( UI, app ) {
		var q = this;

		/* 新增：使用者拖曳調整的高度偏移（px，可正可負），各種停靠內容共用，存在 localStorage 'pk_dockx' */
		var DOCK_MIN = 60;
		var base = 130;
		var extra = 0;
		try { extra = parseInt ( w.localStorage.getItem ('pk_dockx'), 10 ) || 0; } catch (e) {}
		function effective () { return Math.max ( DOCK_MIN, base + extra ); }

		/* 新增：拖曳把手。外層高度為 0，不佔版面；實際可點區域往上下各延伸 */
		var grip_wrap = d.createElement ('div');
		grip_wrap.style.cssText = 'position:relative;height:0;z-index:20;display:none';
		var grip = d.createElement ('div');
		var coarse = w.matchMedia && w.matchMedia ('(pointer:coarse)').matches;
		grip.style.cssText = 'position:absolute;left:0;right:0;top:' + (coarse ? -9 : -4) + 'px;height:' + (coarse ? 18 : 8) +
			'px;cursor:ns-resize;touch-action:none;background:linear-gradient(transparent 40%,var(--bd) 40%,var(--bd) 60%,transparent 60%)';
		grip.title = PKLocale.t ('ui.dock_resize') !== 'ui.dock_resize' ? PKLocale.t ('ui.dock_resize') : '拖曳調整高度，雙擊還原 / Drag to resize, double-click to reset';
		grip.onmouseenter = function () { grip.style.background = 'linear-gradient(transparent 35%,var(--ac) 35%,var(--ac) 65%,transparent 65%)'; };
		grip.onmouseleave = function () { if (!grip._drag) grip.style.background = ''; };
		grip_wrap.appendChild ( grip );
		UI.el.appendChild ( grip_wrap );

		var bar_bottom_el = d.createElement ('div');
		bar_bottom_el.className = 'pk_dck';
		UI.el.appendChild( bar_bottom_el );

		q.el = bar_bottom_el;
		q.on = false;
		q.height = effective ();

		function apply ( fire ) {
			q.height = effective ();
			if (q.on) bar_bottom_el.style.height = q.height + 'px';
			if (fire) app.fireEvent ('RequestResize');
		}

		grip.onpointerdown = function ( e ) {
			if (!q.on || (e.button !== undefined && e.button !== 0)) return ;
			e.preventDefault ();
			e.stopPropagation ();
			grip._drag = true;
			try { grip.setPointerCapture ( e.pointerId ); } catch (er) {}

			var y0 = e.clientY, h0 = q.height;
			var max = h0 + Math.max ( 0, UI.MainHeight () - 112 );  /* 波形至少保留 112px */
			var raf = 0, want = h0;

			function flush () { raf = 0; extra = want - base; apply ( true ); }
			grip.onpointermove = function ( ev ) {
				want = Math.max ( DOCK_MIN, Math.min ( max, h0 + (y0 - ev.clientY) ) );
				if (!raf) raf = w.requestAnimationFrame ( flush );
			};
			grip.onpointerup = grip.onpointercancel = function () {
				grip._drag = false;
				grip.onpointermove = grip.onpointerup = grip.onpointercancel = null;
				grip.style.background = '';
				try { w.localStorage.setItem ('pk_dockx', String ( extra )); } catch (er) {}
			};
		};

		grip.ondblclick = function () {
			extra = 0;
			try { w.localStorage.removeItem ('pk_dockx'); } catch (er) {}
			apply ( true );
		};

		q.SetHeight = function ( height ) {
			base = height;
			apply ( false );
		};

		q.Show = function () {
			q.on = true;
			grip_wrap.style.display = 'block';
			bar_bottom_el.style.display = 'block';
			bar_bottom_el.style.height = q.height + 'px';
			app.fireEvent ('RequestResize');
		};
		q.Hide = function () {
			q.on = false;
			grip_wrap.style.display = 'none';
			bar_bottom_el.style.display = 'none';
			bar_bottom_el.style.height = '0';
			app.fireEvent ('RequestResize');
		};
	};

	function _makeUIMainView ( UI, app ) {
		var q = this;
		var t = PKLocale.t;

		var audio_container = d.createElement ('div');
		audio_container.className = 'pk_av_cont';
		UI.el.appendChild( audio_container );

		var main_audio_view = d.createElement ( 'div' );
		main_audio_view.className = 'pk_av pk_noselect';
		main_audio_view.id = 'pk_av_' + app.id;
		audio_container.appendChild( main_audio_view );

		/* 新增：雙指縮放波形。兩指距離變大 30% 放大一級、縮小 23% 縮小一級，之後重新計算基準 */
		(function () {
			var base = 0;
			function dist ( e ) {
				var a = e.touches[0], b = e.touches[1];
				var dx = a.clientX - b.clientX, dy = a.clientY - b.clientY;
				return Math.sqrt ( dx * dx + dy * dy );
			}
			main_audio_view.addEventListener ('touchstart', function ( e ) {
				base = e.touches.length === 2 ? dist ( e ) : 0;
			}, { passive: true });
			main_audio_view.addEventListener ('touchmove', function ( e ) {
				if (e.touches.length !== 2 || !base) return ;
				e.preventDefault ();
				var r = dist ( e ) / base;
				if (r > 1.3) { app.fireEvent ('RequestZoomUI', 'h', -1); base = dist ( e ); }
				else if (r < 0.77) { app.fireEvent ('RequestZoomUI', 'h', 1); base = dist ( e ); }
			}, { passive: false });
			main_audio_view.addEventListener ('touchend', function ( e ) {
				if (e.touches.length < 2) base = 0;
			}, { passive: true });
		})();

		var footer = d.createElement ( 'div' );
		footer.className = 'pk_ftr pk_noselect';
		UI.el.appendChild( footer );

		var btn_panner_cnt = d.createElement ('div');
		btn_panner_cnt.className = 'pk_panner pk_noselect';

		var panner_col_left = d.createElement ('div');
		panner_col_left.className = 'pk_pan_left';
		var panner_col_right = d.createElement ('div');
		panner_col_right.className = 'pk_pan_right';

		var btn_panner_left = d.createElement ('button');
		var btn_panner_right = d.createElement ('button');
		btn_panner_left.setAttribute ('tabIndex', -1);
		btn_panner_right.setAttribute ('tabIndex', -1);
		btn_panner_left.className = 'pk_pan_btn';
		btn_panner_right.className = 'pk_pan_btn';

		btn_panner_left.innerHTML = '<strong>L</strong> ' + t('ui.on');
		btn_panner_right.innerHTML = '<strong>R</strong> ' + t('ui.on');

		panner_col_left.appendChild ( btn_panner_left );
		panner_col_right.appendChild ( btn_panner_right );
		btn_panner_cnt.appendChild ( panner_col_left );
		btn_panner_cnt.appendChild ( panner_col_right );
		audio_container.appendChild ( btn_panner_cnt );

		btn_panner_left.onclick = function () {
			app.fireEvent ('RequestChanToggle', 0);
			this.blur();
		};
		btn_panner_right.onclick = function () {
			app.fireEvent ('RequestChanToggle', 1);
			this.blur();
		};
		app.listenFor ('DidChanToggle', function ( chan, val ) {
			if ( chan === 0) {
				if (val)
				{
					btn_panner_left.classList.remove ('pk_inact');
					btn_panner_left.innerHTML = '<strong>L</strong> ' + t('ui.on');
				}
				else
				{
					btn_panner_left.classList.add ('pk_inact');
					btn_panner_left.innerHTML = '<strong>L</strong> ' + t('ui.off');
				}
			} else {
				if (val)
				{
					btn_panner_right.classList.remove ('pk_inact');
					btn_panner_right.innerHTML = '<strong>R</strong> ' + t('ui.on');
				}
				else
				{
					btn_panner_right.classList.add ('pk_inact');
					btn_panner_right.innerHTML = '<strong>R</strong> ' + t('ui.off');
				}
			}
		});

		var btn_zoom_cnt = d.createElement ('div');
		btn_zoom_cnt.className = 'pk_zoombtn';

		var btn_zoom_in_h = d.createElement ('button');
		btn_zoom_in_h.className = 'pk_btn pk_zoom_in_h';
		btn_zoom_in_h.innerHTML = '+<span>' + t('toolbar.zoom_in_h') + '</span>';
		btn_zoom_in_h.setAttribute ('tabIndex', -1);
		btn_zoom_in_h.onclick = function () {
			app.fireEvent ('RequestZoomUI', 'h', -1);
			this.blur();
		};

		var btn_zoom_out_h = d.createElement ('button');
		btn_zoom_out_h.className = 'pk_btn pk_zoom_out_h pk_inact';
		btn_zoom_out_h.innerHTML = '&ndash;<span>' + t('toolbar.zoom_out_h') + '</span>';
		btn_zoom_out_h.setAttribute ('tabIndex', -1);
		btn_zoom_out_h.onclick = function () {
			app.fireEvent ('RequestZoomUI', 'h', 1);
			this.blur();
		};

		var btn_zoom_reset = d.createElement ('button');
		btn_zoom_reset.className = 'pk_btn pk_zoom_reset pk_inact';
		btn_zoom_reset.innerHTML = '[R] <span>' + t('toolbar.zoom_reset') + '</span>';
		btn_zoom_reset.setAttribute ('tabIndex', -1);
		btn_zoom_reset.onclick = function () {
			app.fireEvent ('RequestZoomUI', 0);
			this.blur();
		};
		UI.KeyHandler.addCallback ('Key0', function ( key ) {
			if (UI.InteractionHandler.on) return ;
			app.fireEvent ('RequestZoomUI', 0);
		}, [48]);

		UI.KeyHandler.addCallback ('KeyZO', function ( key ) {
			if (UI.InteractionHandler.on) return ;
			app.fireEvent ('RequestZoomUI', 'h', 1);
		}, [189]);
		UI.KeyHandler.addCallback ('KeyZI', function ( key ) {
			if (UI.InteractionHandler.on) return ;
			app.fireEvent ('RequestZoomUI', 'h', -1);
		}, [187]);

		var btn_zoom_in_v = d.createElement ('button');
		btn_zoom_in_v.className = 'pk_btn pk_zoom_in_v';
		btn_zoom_in_v.innerHTML = '&#x2195; +<span>' + t('toolbar.zoom_in_v') + '</span>';
		btn_zoom_in_v.setAttribute ('tabIndex', -1);
		btn_zoom_in_v.onclick = function () {
			app.fireEvent ('RequestZoomUI', 'v', -1);
			this.blur();
		};

		var btn_zoom_out_v = d.createElement ('button');
		btn_zoom_out_v.className = 'pk_btn pk_zoom_out_v';
		btn_zoom_out_v.innerHTML = '&#x2195; &ndash;<span>' + t('toolbar.zoom_out_v') + '</span>';
		btn_zoom_out_v.setAttribute ('tabIndex', -1);
		btn_zoom_out_v.onclick = function () {
			app.fireEvent ('RequestZoomUI', 'v', 1);
			this.blur();
		};

		btn_zoom_cnt.appendChild ( btn_zoom_in_h );
		btn_zoom_cnt.appendChild ( btn_zoom_out_h );
		btn_zoom_cnt.appendChild ( btn_zoom_reset );
		btn_zoom_cnt.appendChild ( btn_zoom_in_v );
		btn_zoom_cnt.appendChild ( btn_zoom_out_v );

		footer.appendChild ( btn_zoom_cnt );

		var wavezoom = d.createElement ( 'div' );
		wavezoom.className = 'pk_wavescroll';

		var wavepoint_visible = false;
		var wavepoint = d.createElement ( 'div' );
		wavepoint.className = 'pk_wavepoint';

		var wavedrag = d.createElement ( 'div' );
		var wavedrag_style = wavedrag.style;
		wavedrag.className = 'pk_wavedrag pk_inact';

		var wavedrag_left = d.createElement ( 'div' );
		wavedrag_left.className = 'pk_wavedrag_l';
		var wavedrag_right = d.createElement ( 'div' );
		wavedrag_right.className = 'pk_wavedrag_r';

		wavezoom.appendChild ( wavepoint );
		wavedrag.appendChild ( wavedrag_left );
		wavedrag.appendChild ( wavedrag_right );
		wavezoom.appendChild ( wavedrag );

		/* [新增] 總長度：放在右下角（縮放桿的右端），不再佔用左上角時間後面的位置。
		 * 要放在縮放桿「之前」（float:right 的元素要比它先出現），縮放桿會自己縮短讓出位置。 */
		var tot = d.createElement ('div');
		tot.className = 'pk_tot pk_noselect';
		var tot_v = d.createElement ('span');
		tot_v.className = 'pk_tot_v';
		function fmtLen ( v ) { return UI.formatTime ? UI.formatTime ( v || 0 ) : '00:00:000'; }
		tot_v.textContent = fmtLen ( 0 );
		tot.appendChild ( tot_v );
		var tot_tip = t ('ui.total_length');
		tot.title = tot_tip !== 'ui.total_length' ? tot_tip : 'Total length';
		footer.appendChild ( tot );
		UI.listenFor ('DidUpdateLen', function ( val ) { tot_v.textContent = fmtLen ( val ); });

		footer.appendChild ( wavezoom );

		var temp = 0;
		var wavedrag_width = 100;
		wavezoom.onclick = function( e ) {
			if (window.performance.now() - temp < 20)
			{
				return ;
			}

			var rect = e.target.getBoundingClientRect();
			var x = e.clientX - rect.left;
			UI.fireEvent ('RequestPan', x, 2);
		};

		UI.listenFor ('DidZoom', function ( v ) {
			var e = v[0];
			var o = v[1];

			if (e === 1) {
				btn_zoom_out_h.classList.add ('pk_inact');
				btn_zoom_reset.classList.add ('pk_inact');
			} else {
				btn_zoom_out_h.classList.remove ('pk_inact');
				btn_zoom_reset.classList.remove ('pk_inact');
			}

			if (v[2] != 1) {
				btn_zoom_reset.classList.remove ('pk_inact');
			}

			if (e === 1) {
				if (wavepoint_visible)
				{
					wavepoint.style.display = 'none';
					wavepoint_visible = false;
				}
			} else {
				if (!wavepoint_visible)
				{
					wavepoint.style.display = 'block';
					wavepoint_visible = true;
				}

				var perc = (v[3] !== undefined) ?
					v[3] :
					app.engine.wavesurfer.getCurrentTime() / app.engine.wavesurfer.getDuration ();

				wavepoint.style.left = ((perc * 10000)>>0)/100 + '%';
			}

			if ((100/e) > 99)
			{
				wavedrag_width = 100;
				wavedrag_style.width = '100%';
				wavedrag_style.left =  '0%';

				wavedrag.classList.add ('pk_inact');
			}
			else
			{
				wavedrag_width = (100/e);
				wavedrag_style.width = wavedrag_width + '%';
				wavedrag_style.left =  o + '%';

				wavedrag.classList.remove ('pk_inact');
			}
		});
		UI.listenFor ('DidCursorCenter', function( val, zoom ) {

			requestAnimationFrame(function () {
				wavedrag_style.left = (val * 100) + '%';

			});
		});

		var drag_mode = 0;
		var startingX = 0;
		var waveScrollMouseMove = function( e ) {
			e.stopPropagation(); e.preventDefault();

			var clx = e.clientX;

			if (e.touches) {
				if (e.touches.length > 1) return ;

				clx = e.touches[0].clientX;
			}

			if (drag_mode === 2)
			{
				var rect = wavezoom.getBoundingClientRect ();
				UI.fireEvent ('RequestPan', Math.max (0, Math.min (wavezoom.clientWidth, clx - rect.left)), 2);
				return ;
			}

			var diff = -startingX + clx;
			if (drag_mode === 0)
				UI.fireEvent ('RequestPan', diff, 1);
			else if (drag_mode === -1)
			{
				UI.fireEvent ('RequestZoom', diff, -1);
			}
			else if (drag_mode === 1)
			{
				UI.fireEvent ('RequestZoom', diff, 1);
			}

			startingX = clx;
		},
		waveScrollMouseUp = function ( e ) {
			if (e.touches && e.touches.length > 1) return ;

			PKAudioEditor.engine.wavesurfer.Interacting &= ~(1 << 1);
			e.stopPropagation();e.preventDefault();
			drag_mode = 0;
			temp = window.performance.now();

			wavedrag.classList.remove ('pk_drag');

			document.removeEventListener('mousemove', waveScrollMouseMove);
			document.removeEventListener('mouseup', waveScrollMouseUp);

			document.removeEventListener('touchmove', waveScrollMouseMove, {passive:false});
			document.removeEventListener('touchend', waveScrollMouseUp);
		};

		var mdown = function ( e ) {
			var mt_on = activeMultitrackFor ( app );
			if (!PKAudioEditor.engine.is_ready && !mt_on) return ;
			if (e.target === wavezoom && !mt_on) return ;

			if (e.target === wavedrag) {
				drag_mode = 0;
			} else if ( e.target === wavedrag_left) {
				drag_mode = -1;
			} else if ( e.target === wavedrag_right) {
				drag_mode = 1;
			}
			else if (mt_on) {
				drag_mode = 2;
			}
			else return ;

			e.stopPropagation(); e.preventDefault();
			wavedrag.className += ' pk_drag';

			startingX = e.clientX;
			if (drag_mode === 2) waveScrollMouseMove ( e );
			PKAudioEditor.engine.wavesurfer.Interacting |= (1 << 1);

			if (e.is_touch)
			{
				document.addEventListener ('touchmove', waveScrollMouseMove, {passive:false});
				document.addEventListener ('touchend', waveScrollMouseUp, false);
			}
			else
			{
				document.addEventListener ('mousemove', waveScrollMouseMove, false);
				document.addEventListener ('mouseup', waveScrollMouseUp, false);
			}
		};

		wavezoom.addEventListener ('mousedown', mdown, false);

		if ('ontouchstart' in window) {
			wavedrag.addEventListener ('touchstart', function ( e ) {
				e.preventDefault ();
				e.stopPropagation ();

				if (e.touches.length > 1) {
					return ;
				}

				var ev = {
					is_touch : true,
					target : wavedrag,
					clientX: e.touches[0].clientX,
					stopPropagation: function(){},
					preventDefault: function(){}
				};
				mdown ( ev );
			}, false);
		}

		this.volumeGauge = d.createElement( 'div' );
		this.volumeGauge2 = d.createElement( 'div' );

		this.volumeGaugeInner = d.createElement( 'div' );
		this.volumeGaugeInner2 = d.createElement( 'div' );
		this.volumeGaugePeaker = d.createElement( 'div' );
		this.volumeGaugePeaker2 = d.createElement( 'div' );

		var volume_parent = d.createElement('div');

		this.volumeGauge.className = 'pk_volpar';
		this.volumeGauge2.className = 'pk_volpar';
		this.volumeGaugeInner.className = 'pk_vol';
		this.volumeGaugeInner2.className = 'pk_vol';
		this.volumeGaugePeaker.className = 'pk_peaker';
		this.volumeGaugePeaker2.className = 'pk_peaker';

		this.volumeGauge.appendChild ( this.volumeGaugeInner );
		this.volumeGauge.appendChild( this.volumeGaugePeaker );

		this.volumeGauge2.appendChild ( this.volumeGaugeInner2 );
		this.volumeGauge2.appendChild( this.volumeGaugePeaker2 );

		var markers = d.createElement('div');
		markers.className = 'pk_markers pk_noselect';

		var str = '<span class="pk_mark1">-Inf</span>';
		for (var i = 35; i >= 0; --i)
		{
			/* [修改] 每 10 dB 多加 pk_m5：電平表縮成窄版時只保留這些刻度文字 */
			str += '<span class="pk_mark1 '+(i%2?'pk_odd':'')+(i%5?'':' pk_m5')+'">' + -(i*2) + '</span>';
		}
		markers.innerHTML = str;

		volume_parent.appendChild( this.volumeGauge );
		volume_parent.appendChild( this.volumeGauge2 );
		volume_parent.appendChild( markers );

		/* [新增] 給電平表一個 class（CSS 與 ui-toolbar-layout.js 都靠它辨識），並加上點擊說明 */
		volume_parent.className = 'pk_meter';
		var clip_tip = t ('meter.clip_reset');
		volume_parent.title = clip_tip !== 'meter.clip_reset' ? clip_tip : 'Click to clear the clip light';

		/* [新增] 電平表驅動：原本沒有任何程式把播放中的音量寫進這兩條，所以永遠停在 -Inf。
		 * 資料來源：DidAudioProcess 事件的第 2 個參數 ＝ [左聲道 dB, 右聲道 dB]（單軌、多軌、效果預覽都會送）。
		 * 刻度：和上面的文字一致，-72 dB 在最左邊、0 dB 在最右邊（扣掉右側 12px 的削波燈區）。
		 * 動態：上升馬上到位、下降用 36 dB/秒慢慢落（暫停後自己歸零）；≥ -0.1 dB 點亮右端削波燈，點一下電平表清除。 */
		(function () {
			var DB_RANGE = 72, FALL = 0.036;	/* FALL：每毫秒下降幾 dB */
			var inner = [ q.volumeGaugeInner, q.volumeGaugeInner2 ];
			var peaker = [ q.volumeGaugePeaker, q.volumeGaugePeaker2 ];
			var lvl = [ -100, -100 ];	/* 目前顯示的 dB */
			var hit = [ -100, -100 ];	/* 兩幀之間收到的最大值 */
			var shown = [ -1, -1 ];	/* 上一次寫進畫面的比例（相同就不重寫） */
			var clip = [ 0, 0 ];
			var last_ref = null, raf = 0, last_ts = 0;

			function isVisible () {
				var TB = PKAE._deps.tbl;
				return !TB || !TB.isVis || TB.isVis ('meter');
			}
			function db2f ( db ) {
				var f = (db + DB_RANGE) / DB_RANGE;
				return f < 0 ? 0 : (f > 1 ? 1 : f);
			}
			function paint () {
				for (var i = 0; i < 2; ++i) {
					var f = Math.round ( db2f ( lvl[i] ) * 1000 ) / 1000;
					if (f !== shown[i]) {
						shown[i] = f;
						inner[i].style.transform = 'translate3d(calc((100% - 12px) * ' + f + '),0,0)';
					}
					var on = clip[i] ? 1 : 0;
					if (peaker[i]._on !== on) {
						peaker[i]._on = on;
						peaker[i].className = on ? 'pk_peaker pk_act' : 'pk_peaker';
					}
				}
			}
			function tick ( ts ) {
				raf = 0;
				var dt = last_ts ? Math.min ( 100, ts - last_ts ) : 16;
				last_ts = ts;
				var busy = false;
				for (var i = 0; i < 2; ++i) {
					var fall = lvl[i] - dt * FALL;
					lvl[i] = hit[i] >= fall ? hit[i] : Math.max ( -100, fall );
					hit[i] = -100;
					if (lvl[i] > -99.9) busy = true;
				}
				paint ();
				if (busy) raf = w.requestAnimationFrame ( tick );
				else last_ts = 0;
			}
			function wake () { if (!raf) raf = w.requestAnimationFrame ( tick ); }
			function num ( v ) { return (typeof v === 'number' && v === v) ? Math.max ( -100, Math.min ( 12, v ) ) : -100; }

			/* 事件參數：[時間, loudness, stamp]。loudness 每次取樣都是新陣列；
			 * 暫停中拖曳／點波形（seek）事件帶的是上一次留下的舊陣列，用「同一個陣列就略過」擋掉，才不會暫停時又亮起來 */
			UI.listenFor ('DidAudioProcess', function ( val ) {
				if (!val || val.length === undefined) return ;
				var ld = val[1];
				if (!ld || ld === last_ref) return ;
				last_ref = ld;
				if (!isVisible ()) return ;
				var l = num ( ld[0] ), r = ld.length > 1 ? num ( ld[1] ) : l;
				/* 單聲道檔案：引擎把右聲道留在 0，這裡直接複製左聲道（多軌一律是真的左右聲道） */
				if (!activeMultitrackFor ( app ) && UI.el.classList.contains ('pk_mono')) r = l;
				if (l > hit[0]) hit[0] = l;
				if (r > hit[1]) hit[1] = r;
				if (l >= -0.1) clip[0] = 1;
				if (r >= -0.1) clip[1] = 1;
				wake ();
			});

			volume_parent.addEventListener ('click', function () {
				clip[0] = clip[1] = 0;
				paint ();
			});
		})();

		footer.appendChild( volume_parent );
		q.meterEl = volume_parent;

		/* [新增] 把電平表交給工具列排版模組：可顯示／隱藏、可在「調整排列」拖到工具列（窄版）或浮動，
		 * 預設仍放在底部（footer）。排版模組沒載入時不影響，電平表照舊放在底部。 */
		(function () {
			var TB = PKAE._deps.tbl;
			if (TB && TB.attachMeter) TB.attachMeter ( volume_parent, footer );
		})();

		var ttmp = d.createElement('div');
		ttmp.className = 'pk_tmpMsg pk_ed_empty';
		ttmp.innerHTML = t('empty.drag_drop') +
		'<a style="white-space:nowrap;border:1px solid;border-radius:23px;padding:5px 18px;font-size:0.94em;margin-left:5px" '+
		'onclick="PKAudioEditor.engine.LoadSample()">' + t('empty.sample_link') + '</a>';
		main_audio_view.appendChild( ttmp );

		var ttmp2 = d.createElement('div');
		ttmp2.className = 'pk_tmpMsg2';
		ttmp2.innerHTML = '<span>' + t('loading.please_wait') + '</span><div class="pk_mload"><div></div></div>' +
			'<div class="pk_prc"><span>0%</span>' +
			'<button tabIndex="-1" class="pk_btn" '+
			'onclick="PKAudioEditor.fireEvent(\'RequestCancelModal\');">' + t('loading.cancel') + '</button></div>';

		d.body.appendChild( ttmp2 );
		UI.loaderEl = ttmp2;

		UI.listenFor ('WillDownloadFile', function() {
			UI.loaderEl.classList.add ('pk_act');
			UI.loaderEl.getElementsByTagName('span')[1].style.display = 'none';
		});
		UI.listenFor ('DidDownloadFile', function() {
			UI.loaderEl.classList.remove ('pk_act');
		});
		UI.listenFor ('DidProgressModal', function ( val ) {
			UI.loaderEl.getElementsByTagName('span')[1].style.display = 'block';
			UI.loaderEl.getElementsByTagName('span')[1].textContent = val + '%';
		});
	}

	function _makeMobileScroll (UI) {

		var isControlTouch = function ( target ) {
			while (target && target !== d.body) {
				if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA|LABEL)$/i.test (target.tagName || '')) return true;
				if (target.classList && (
					target.classList.contains ('pk_btn') ||
					target.classList.contains ('pk_mt') ||
					target.classList.contains ('pk_mt_topbtn') ||
					target.classList.contains ('pk_modal_a_bottom')
				)) return true;
				target = target.parentNode;
			}
			return false;
		};

		var getFactor = function () {
			var screen_h = window.screen.height;
			var screen_w = window.screen.width;

			var ih = window.innerHeight;

			var bars_visible = false;
			var ratio = 0;

			if (window.orientation === 0) {
				ratio = ih / screen_h;
			}
			else if (window.orientation === 90 || window.orientation === -90) {
				ratio = ih / screen_w;
			}
			if (ratio < 0.8) bars_visible = true;

			return (bars_visible);
		};

		var ex = -1;
		var ey = -1;

		var allow = false;

		d.body.addEventListener ('touchstart', function( e ) {
			ex = e.touches[0].pageX;
			ey = e.touches[0].pageY;

			allow = false;
		});

		d.body.addEventListener ('touchend', function( e ) {
			ex = -1;
			ey = -1;

			allow = false;
		});

		d.body.addEventListener ('touchmove', function( e ) {
			if (isControlTouch ( e.target )) return ;
			if (allow) return ;

			var ny = e.touches[0].pageY;
			var nx = e.touches[0].pageX;
			var direction = ey - ny;
			var direction2 = ex - nx;

			if ( direction === 0 || (Math.abs (direction) < 3 && Math.abs (direction2) > 3 ) || (Math.abs (direction) < 6 && Math.abs (direction2) > 10 ) ) {
				ey = ny;
				ex = nx;
				allow = true;

				return ;
			}

			ey = ny;
			ex = nx;

			var xx = document.getElementsByClassName ('pk_modal_back');

			if (xx[0])
			{
				xx = xx[0];
				if ( xx.scrollHeight > window.innerHeight )
				{
					var scrolled = xx.scrollTop;

					if (direction > 0)
					{
						var modal_h = document.getElementsByClassName ('pk_modal')[0].clientHeight;

						if ((modal_h - scrolled) < (window.innerHeight - 80))
						{
							e.preventDefault ();
						}
					}
					else
					{
						if (scrolled <= 0)
						{
							e.preventDefault ();
						}
					}

					allow = true;
					return ;
				}
				else
				{
					e.preventDefault ();

					allow = true;
					return ;
				}
			}

			if (!getFactor ()) {
				e.preventDefault ();
				allow = true;
			}

		}, {passive:false});
	};

PKAE._deps._makeUIMainView = _makeUIMainView;
	PKAE._deps._makeUIBarBottom = _makeUIBarBottom;
	PKAE._deps._makeMobileScroll = _makeMobileScroll;

})( window, document, PKAudioEditor );
