(function ( w, d, PKAE ) {
	'use strict';

	function _bindToolbarTips ( UI, container ) {
		if (!container || !UI || !UI.el || UI.el.classList.contains ('pk_mob')) return ;
		var tip = d.createElement ('div');
		var active = null;
		var raf = 0;
		tip.className = 'pk_ttip';
		UI.el.appendChild ( tip );
		function tipButton ( node ) { while (node && node !== container) { if (node.classList && node.classList.contains ('pk_btn')) return node; node = node.parentNode; } return null; }
		function hide () { active = null; tip.classList.remove ('pk_act'); if (raf) { w.cancelAnimationFrame ( raf ); raf = 0; } }
		function place () {
			raf = 0; if (!active) return ;
			var span = active.getElementsByTagName ('span')[0];
			var txt = span && span.textContent;
			if (!txt || active.classList.contains ('pk_inact')) return hide ();
			var r = active.getBoundingClientRect ();
			tip.textContent = txt; tip.classList.add ('pk_act');
			var tw = tip.offsetWidth;
			var x = Math.max (4, Math.min (w.innerWidth - tw - 4, r.left + (r.width - tw) / 2));
			tip.style.left = (x >> 0) + 'px';
			tip.style.top = ((r.bottom + 6) >> 0) + 'px';
		}
		function show ( e ) { var btn = tipButton ( e.target ); if (!btn || btn === active) return ; active = btn; if (!raf) raf = w.requestAnimationFrame ( place ); }
		container.addEventListener ('mouseover', show, false);
		container.addEventListener ('focusin', show, false);
		container.addEventListener ('mouseout', function ( e ) { if (!active || tipButton ( e.relatedTarget ) === active) return ; hide (); }, false);
		container.addEventListener ('focusout', hide, false);
		container.addEventListener ('scroll', hide, false);
		w.addEventListener ('resize', hide, false);
	}

	function _makeUIToolbar (UI) {
		var t = PKLocale.t;
		var app = PKAudioEditor;
		var container = d.createElement ( 'div' );
		container.className = 'pk_tbc';
		var toolbar = d.createElement ( 'div' );
		toolbar.className = 'pk_tb pk_noselect';
		var btn_groups = d.createElement( 'div' );
		btn_groups.className = 'pk_btngroup';

		// Transport (play/stop/pause/loop/seek/record)
		var transport = PKAE._deps._toolbarTransport ( UI, app, toolbar );

		// Copy/Paste/Cut/Silence + Clear Selection
		var actResult = PKAE._deps._toolbarActions ( UI, app );
		var actions = actResult.actions;
		var btn_clear_selection = actResult.btn_clear_selection;

		// Keyboard shortcuts
		UI.KeyHandler.addCallback ('KeyTab', function ( key ) {
			if (UI.InteractionHandler.on || !PKAE._deps.uiHelpers.activeReadyFor ( app )) return ;
			UI.fireEvent ('RequestViewCenterToCursor');
		}, [9]);

		function mtSelectChannelKey ( diff, ev ) {
			var mt = PKAE._deps.uiHelpers.activeMultitrackFor ( app );
			var target = ev && ev.target;
			if (!mt || UI.InteractionHandler.on ||
				(UI.TopHeader.getOpenElement && UI.TopHeader.getOpenElement ()) ||
				(target && /INPUT|TEXTAREA|SELECT/.test (target.tagName))) return ;
			ev && ev.preventDefault (); ev && ev.stopPropagation ();
			UI.fireEvent ('RequestChannelSelect', diff);
		}
		UI.KeyHandler.addCallback ('KeyMtChannelUp', function ( key, c, ev ) { mtSelectChannelKey ( -1, ev ); }, [38]);
		UI.KeyHandler.addCallback ('KeyMtChannelDown', function ( key, c, ev ) { mtSelectChannelKey ( 1, ev ); }, [40]);
		UI.KeyHandler.addCallback ('KeyShiftArrowBack', function ( key, c, ev ) {
			var mt = PKAE._deps.uiHelpers.activeMultitrackFor ( app );
			if (UI.InteractionHandler.on || (ev && (ev.ctrlKey || ev.metaKey)) || (!PKAudioEditor.engine.is_ready && !mt)) return ;
			ev && ev.preventDefault ();
			PKAE._deps.uiHelpers.seekRegionMarkerEdgeFor (PKAudioEditor, -1);
		}, [16, 37]);
		UI.KeyHandler.addCallback ('KeyShiftArrowFront', function ( key, c, ev ) {
			var mt = PKAE._deps.uiHelpers.activeMultitrackFor ( app );
			if (UI.InteractionHandler.on || (ev && (ev.ctrlKey || ev.metaKey)) || (!PKAudioEditor.engine.is_ready && !mt)) return ;
			ev && ev.preventDefault ();
			PKAE._deps.uiHelpers.seekRegionMarkerEdgeFor (PKAudioEditor, 1);
		}, [16, 39]);
		UI.KeyHandler.addCallback ('killctx', function ( e ) {
			var event = new Event ('killCTX', {bubbles: true});
			document.body.dispatchEvent (event);
		}, [27]);

		// Timing section (time display, volume, context menu)
		var timingResult = (function () {
			var timing = d.createElement( 'div' );
			timing.className = 'pk_timecontainer';
			var timingspan = d.createElement( 'span' );
			var is_chrome = !!window.chrome;

			if (!is_chrome) {
				timingspan.textContent = '00:00:000';
				timingspan.className = 'pk_timing';
				timing.appendChild( timingspan );
			}

			var pk_timingcnv = d.createElement( 'canvas' );
			pk_timingcnv.className = 'pk_timingcnv';
			pk_timingcnv.width = 150; pk_timingcnv.height = 40;
			var pk_timingnum = '00:00:000';
			var pk_timingctx = pk_timingcnv.getContext('2d', {alpha:false});
			var timing_caches = {};

			if (is_chrome) {
				timing.appendChild( pk_timingcnv );
				pk_timingctx.fillStyle = "#000";
				pk_timingctx.fillRect(0, 0, 150, 40);
				for (var ii = 0; ii < 11; ++ii) {
					var curr_cache = d.createElement('canvas');
					curr_cache.width = 18; curr_cache.height = 26;
					var curr_ctx = curr_cache.getContext('2d', {alpha:false});
					curr_ctx.font = "29px Helvetica, Arial, sans-serif";
					curr_ctx.textAlign = "center";
					curr_ctx.fillStyle = "#000"; curr_ctx.fillRect(0, 0, 18, 26);
					curr_ctx.fillStyle = "#fff"; curr_ctx.textBaseline = 'middle';
					if (ii === 10) { curr_ctx.fillText (':', 8, 14); timing_caches[':'] = curr_cache; }
					else { curr_ctx.fillText (ii + '', 9, 14); timing_caches[ii+''] = curr_cache; }
				}
				(function (pk_timingctx, timing_caches){
					var ttm = '00:00:000';
					for (var jk = 0; jk < ttm.length; ++jk) pk_timingctx.drawImage (timing_caches[ttm[jk]], jk * 16, 10);
				})(pk_timingctx, timing_caches);
			}

			var total_duration = d.createElement( 'span' );
			total_duration.textContent = '00:00:000';
			total_duration.className = 'pk_total_dur';
			timing.appendChild( total_duration );
			var hover_duration = d.createElement( 'span' );
			hover_duration.textContent = '00:00:000';
			hover_duration.className = 'pk_hover_dur';
			timing.appendChild( hover_duration );

			function formatTime( time ) {
				var time_s = time >> 0;
				var miliseconds = time - time_s;
				if (time_s < 10) { if (time === 0) return '00:00:000'; time_s = '00:0' + time_s; }
				else if (time_s < 60) time_s = '00:' + time_s;
				else { var m = (time_s / 60) >> 0; var s = (time_s % 60); time_s = ((m<10)?'0':'') + m + ':' + (s < 10 ? '0'+s : s); }
				if (miliseconds < 0.1) return time_s + ':0' + (miliseconds < 0.01 ? '0' : '') + ((miliseconds*1000)>>0);
				return time_s + ':' + ((miliseconds*1000)>>0);
			}
			UI.formatTime = formatTime;

			function drawT ( time ) {
				var ttm = formatTime (time);
				if (!is_chrome) { timingspan.textContent = ttm; return ; }
				var exit = false;
				for (var jk = 0; jk < ttm.length; ++jk) {
					if (!exit) { if (ttm[jk] === pk_timingnum[jk]) continue; exit = true; }
					pk_timingctx.drawImage (timing_caches[ttm[jk]], jk * 16, 10);
				}
				pk_timingnum = ttm;
			}

			function formatTimelineTime ( time, format ) {
				var time_s = time >> 0;
				var miliseconds = time - time_s;
				if (time_s < 10) time_s = '00:0' + time_s;
				else if (time_s < 60) time_s = '00:' + time_s;
				else { var m = (time_s / 60) >> 0; var s = (time_s % 60); time_s = ((m<10)?'0':'') + m + ':' + (s < 10 ? '0'+s : s); }
				if (format === 1) return time_s + ':' + (miliseconds+'').substr(2, 2);
				return time_s;
			}
			UI.formatTimelineTime = formatTimelineTime;

			function timelineRuler ( total, width, left_offset, visible_width ) {
				var data = {step: 0, ticks: [], halves: []};
				if (!total || !width) return data;
				var pixel_distance = width / total;
				if (pixel_distance < 60) pixel_distance = 60;
				else if (pixel_distance > 160) pixel_distance /= ((pixel_distance / 160) >> 0) + 1;
				data.step = pixel_distance;
				left_offset = left_offset || 0; visible_width = visible_width || width;
				var step_time = pixel_distance / width * total;
				var format = step_time < 1.0 ? 1 : (step_time < 60 ? 2 : 3);
				var x = Math.max (0, (((left_offset - 2) / pixel_distance) >> 0) * pixel_distance);
				var end = left_offset + visible_width + 2;
				for (; x <= end && x < width - 2; x += pixel_distance) {
					if (x >= left_offset - 2) data.ticks.push ({ x: x, time: x / width * total, label: formatTimelineTime ( x / width * total, format ) });
				}
				x = Math.max (pixel_distance / 2, ((((left_offset - 2 - pixel_distance / 2) / pixel_distance) >> 0) * pixel_distance) + pixel_distance / 2);
				for (; x <= end && x < width - 2; x += pixel_distance) if (x >= left_offset - 2) data.halves.push ( x );
				return data;
			}
			UI.timelineRuler = timelineRuler;

			function drawTimelineRuler ( ctx, total, width, left_offset, visible_width ) {
				var data = timelineRuler ( total, width, left_offset, visible_width );
				ctx.fillStyle = '#111'; ctx.fillRect (0, 0, visible_width, 24);
				ctx.fillStyle = '#aaa'; ctx.strokeStyle = '#aaa'; ctx.textAlign = 'center';
				for (var i = 0; i < data.ticks.length; ++i) ctx.fillText ( data.ticks[i].label, data.ticks[i].x - left_offset, 12 );
				ctx.beginPath ();
				for (i = 0; i < data.ticks.length; ++i) { var x = data.ticks[i].x - left_offset; ctx.moveTo (x, 16); ctx.lineTo (x, 24); }
				for (i = 0; i < data.halves.length; ++i) { x = data.halves[i] - left_offset; ctx.moveTo (x, 19); ctx.lineTo (x, 24); }
				ctx.stroke ();
				return data;
			}
			UI.drawTimelineRuler = drawTimelineRuler;

			// Time input box
			var tb = null, tc = 0, td = 0;
			function closeTB () { if (!tb) return ; d.removeEventListener ('mousedown', tb._off); tb.parentNode && tb.parentNode.removeChild (tb); tb = null; }
			function openTB ( e ) {
				e && e.stopPropagation (); e && e.preventDefault ();
				var dur = PKAE._deps.uiHelpers.activeDurationFor ( app ) || td || 0;
				closeTB ();
				var t = Math.max (0, Math.min (dur, tc || PKAE._deps.uiHelpers.activeCursorTimeFor ( app ) || 0));
				var s = t >> 0; var ms = ((t - s) * 1000 + 0.5) >> 0;
				if (ms > 999) { ms = 0; ++s; }
				var m = (s / 60) >> 0; s %= 60;
				var b = tb = d.createElement ('div');
				b.className = 'pk_pgeq_freq'; b.style.padding = '3px 16px'; b.style.paddingRight = '6px';
				b.innerHTML = '<input class="pk_mtbeat_bpm" style=width:46px> <b>:</b> <input class="pk_mtbeat_bpm" style=width:46px> <b>:</b> <input class="pk_mtbeat_bpm" style=width:46px> <button class="pk_modal_a_bottom pk_modal_a_accpt" style="float:none;display:inline-block;vertical-align:middle">Go</button>';
				d.body.appendChild ( b );
				var i = b.getElementsByTagName ('input'); var g = b.lastChild;
				var a = [i[0], i[1], i[2], g];
				i[0].value = m; i[1].value = s; i[2].value = ms;
				var r = timing.getBoundingClientRect ();
				b.style.left = (r.left|0) + 'px'; b.style.top = ((r.top + 3)|0) + 'px';
				function go () {
					var durr = PKAE._deps.uiHelpers.activeDurationFor ( app ) || td || 0;
					if (!(durr > 0)) return closeTB ();
					var v = Math.max (0, Math.min (durr, ((i[0].value|0) * 60) + (i[1].value|0) + ((i[2].value|0) / 1000)));
					tc = v; drawT (v); UI.fireEvent ('RequestSeekTo', v / durr); closeTB ();
				}
				b._off = function ( ev ) { if (!b.contains (ev.target) && !timing.contains (ev.target)) closeTB (); };
				tnav ( b, a, go, closeTB );
				g.onclick = go; d.addEventListener ('mousedown', b._off);
				i[0].focus (); i[0].select ();
			}
			timing.onmousedown = openTB;

			// Context menu
			setTimeout(function () {
				UI.listenFor ('DidZoom', function (v, f) {
					if (f) hover_duration.textContent = formatTime (
						PKAudioEditor.engine.wavesurfer.drawer.handleEvent(f) *
						PKAudioEditor.engine.wavesurfer.VisibleDuration +
						PKAudioEditor.engine.wavesurfer.LeftProgress );
				});
				var old_refresh = 0;
				var avv = d.getElementsByClassName('pk_av')[0];
				if (!avv) return ;
				avv.addEventListener ('mousemove', function ( e ) {
					var new_refresh = e.timeStamp;
					if (new_refresh - old_refresh < 58) return ;
					old_refresh = new_refresh;
					hover_duration.textContent = formatTime (
						PKAudioEditor.engine.wavesurfer.drawer.handleEvent( e ) *
						PKAudioEditor.engine.wavesurfer.VisibleDuration +
						PKAudioEditor.engine.wavesurfer.LeftProgress );
				}, false);

				var main_context = PKAudioEditor._deps.ContextMenu ( avv );
				main_context.addOption (t('context.select_visible'), function(){ UI.fireEvent ('RequestRegionSet'); }, false );
				main_context.addOption (t('context.reset_zoom'), function(){ UI.fireEvent ('RequestZoomUI', 0); }, false );
				UI.listenFor ('DidHoverTime', function ( time ) { hover_duration.textContent = formatTime ( time ); });
				main_context.addOption (t('context.set_volume'), function(){ UI.fireEvent ('RequestFXUI_Gain'); }, false );
				main_context.addOption (t('context.seamless_loop'), function(){ UI.fireEvent ('RequestActionFXUI_SeamlessLoop'); }, false );
				main_context.addOption (t('context.copy'), function(){ UI.fireEvent( 'RequestActionCopy'); }, false );
				main_context.addOption (t('context.paste'), function(){ UI.fireEvent( 'RequestActionPaste'); }, false );
				main_context.addOption (t('context.cut'), function(){ UI.fireEvent( 'RequestActionCut', 1); }, false );
				main_context.addOption (t('context.insert_silence'), function(){ UI.fireEvent ('RequestFXUI_Silence'); }, false );

				var copable = false;
				UI.listenFor ('DidSetClipboard', function ( val ) { copable = !!val; });
				main_context.onOpen = function ( menu, div ) {
					var divs = div.childNodes;
					if (!copable) divs[5].className += ' pk_inact';
					UI.fireEvent ('RequestPause');
					var region = PKAudioEditor.engine.wavesurfer.regions.list[0];
					if (region) return ;
					divs[3].className += ' pk_inact'; divs[4].className += ' pk_inact'; divs[6].className += ' pk_inact';
				};
			}, 1000);

			UI.listenFor ('DidUpdateLen', function( val ) { td = val || 0; total_duration.textContent = formatTime (val); });

			// Volume gauge
			var volume1 = 0, volume2 = 0;
			var volumeGauge = d.createElement( 'div' ); var volumeGauge2 = d.createElement( 'div' );
			var volumeGaugeInner = d.createElement( 'div' ); var volumeGaugeInner2 = d.createElement( 'div' );
			var volumeGaugePeaker = d.createElement( 'div' ); var volumeGaugePeaker2 = d.createElement( 'div' );
			var volume_parent = d.createElement('div');
			volumeGauge.className = 'pk_volpar'; volumeGauge2.className = 'pk_volpar';
			volumeGaugeInner.className = 'pk_vol'; volumeGaugeInner2.className = 'pk_vol';
			volumeGaugePeaker.className = 'pk_peaker'; volumeGaugePeaker2.className = 'pk_peaker';
			volumeGauge.appendChild ( volumeGaugeInner ); volumeGauge.appendChild( volumeGaugePeaker );
			volumeGauge2.appendChild ( volumeGaugeInner2 ); volumeGauge2.appendChild( volumeGaugePeaker2 );
			var markers = d.createElement('div'); markers.className = 'pk_markers pk_noselect';
			var str = '<span class="pk_mark1">-Inf</span>';
			for (var ii = 35; ii >= 0; --ii) str += '<span class="pk_mark1 '+(ii%2?'pk_odd':'')+'">' + -(ii*2) + '</span>';
			markers.innerHTML = str;
			volume_parent.appendChild( volumeGauge ); volume_parent.appendChild( volumeGauge2 ); volume_parent.appendChild( markers );
			volume_parent.onclick = function() { volumeGaugePeaker.className = 'pk_peaker'; volumeGaugePeaker2.className = 'pk_peaker'; };

			UI.footer = { volumeGaugePeaker: volumeGaugePeaker, volumeGaugePeaker2: volumeGaugePeaker2, volumeGaugeInner: volumeGaugeInner, volumeGaugeInner2: volumeGaugeInner2 };

			return { timing: timing, volume_parent: volume_parent };
		})();

		function tnav ( b, a, go, cl ) {
			b.onkeydown = function (ev) {
				var k = ev.keyCode, j; ev.stopPropagation ();
				if (k === 13) go ();
				else if (k === 27) cl ();
				else if (k > 36 && k < 41 && (j = a.indexOf (ev.target)) > -1) {
					if ((k === 37 || k === 39) && ev.target.tagName === 'INPUT' &&
						(ev.target.selectionStart !== ev.target.selectionEnd ||
						(k === 37 && ev.target.selectionStart > 0) ||
						(k === 39 && ev.target.selectionEnd < ev.target.value.length))) return ;
					j = (j + (k < 39 ? -1 : 1) + a.length) % a.length;
					a[j].focus (); a[j].tagName === 'INPUT' && a[j].select (); ev.preventDefault ();
				}
			};
		}

		// Selection
		var selection = PKAE._deps._toolbarSelection ( UI, app, btn_clear_selection );

		// Assembly
		toolbar.appendChild ( timingResult.timing );
		toolbar.appendChild ( btn_groups );
		btn_groups.appendChild ( transport );
		btn_groups.appendChild ( actions );
		toolbar.appendChild ( selection );
		container.appendChild ( toolbar );
		UI.el.appendChild ( container );
		_bindToolbarTips ( UI, container );

		var _appEl = d.getElementById('app');
		_appEl.addEventListener('dragover', function ( e ) {
			var mt = PKAudioEditor && PKAudioEditor.multitrack;
			if (mt && mt.IsOn && mt.IsOn ()) e.preventDefault ();
		}, true);
		_appEl.addEventListener('drop', function ( e ) {
			e.preventDefault();
			var mt = PKAudioEditor && PKAudioEditor.multitrack;
			if (mt && mt.IsOn && mt.IsOn ()) {
				var files = e.dataTransfer && e.dataTransfer.files;
				if (files && files.length > 0) {
					var f = files[0];
					if (f.type.indexOf('audio') >= 0 || /\.(mp3|wav|flac|ogg|aac|m4a|wma|amss)$/i.test(f.name))
						PKAudioEditor.fireEvent('RequestLoadLocalFile', f);
				}
			}
		}, true);
	};

	PKAE._deps._makeUIToolbar = _makeUIToolbar;
	PKAE._deps._bindToolbarTips = _bindToolbarTips;

})( window, document, PKAudioEditor );
