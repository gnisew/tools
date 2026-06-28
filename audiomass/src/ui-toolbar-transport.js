(function ( w, d, PKAE ) {
	'use strict';

	function _toolbarTransport ( UI, app, toolbar ) {
		var t = PKLocale.t;
		var transport = d.createElement( 'div' );
		transport.className = 'pk_transport';

		var btn_stop = d.createElement ('button');
		btn_stop.setAttribute ('tabIndex', -1);
		btn_stop.innerHTML = '<span>' + t('toolbar.stop') + '</span>';
		btn_stop.className = 'pk_btn pk_stop icon-stop2';
		btn_stop.onclick = function() { UI.fireEvent('RequestStop'); this.blur(); };
		transport.appendChild ( btn_stop );

		var btn_play = d.createElement ('button');
		btn_play.setAttribute ('tabIndex', -1);
		btn_play.className = 'pk_btn pk_play icon-play3';
		btn_play.innerHTML = '<span>' + t('toolbar.play') + '</span>';
		transport.appendChild ( btn_play );
		btn_play.onclick = function() { UI.fireEvent('RequestPlay'); this.blur(); };
		UI.listenFor ('DidStopPlay', function(){ btn_play.classList.remove ('pk_act'); });
		UI.listenFor ('DidPlay', function(){ btn_play.classList.add ('pk_act'); });

		var btn_pause = d.createElement ('button');
		btn_pause.setAttribute('tabIndex', -1);
		btn_pause.className = 'pk_btn pk_pause icon-pause2';
		btn_pause.innerHTML = '<span>' + t('toolbar.pause') + '</span>';
		transport.appendChild ( btn_pause );
		btn_pause.onclick = function() { UI.fireEvent('RequestPause'); this.blur(); };

		var btn_loop = d.createElement ('button');
		btn_loop.setAttribute('tabIndex', -1);
		btn_loop.className = 'pk_btn pk_loop icon-loop';
		btn_loop.innerHTML = '<span>' + t('toolbar.loop') + '</span>';
		transport.appendChild ( btn_loop );
		btn_loop.onclick = function() { UI.fireEvent('RequestSetLoop'); this.blur(); };
		UI.listenFor('DidSetLoop', function( val ) { val ? btn_loop.classList.add('pk_act') : btn_loop.classList.remove('pk_act'); });

		var btn_back_jump = d.createElement ('button');
		btn_back_jump.setAttribute('tabIndex', -1);
		btn_back_jump.className = 'pk_btn pk_back_jump icon-backward2';
		btn_back_jump.innerHTML = '<span>' + t('toolbar.seek_back') + '</span>';
		transport.appendChild ( btn_back_jump );

		var btn_back_focus = false, btn_back_hold = false, btn_back_tm = null;
		btn_back_jump.onclick = function() {
			if (!btn_back_focus) {
				if (btn_back_tm) { clearTimeout(btn_back_tm); btn_back_tm = null; }
				var big_step = PKAE._deps.uiHelpers.activeDurationFor ( app ) / 20;
				var zoom = PKAE._deps.uiHelpers.activeZoomFor ( app );
				big_step /= ((zoom/2)+0.5);
				if (big_step > 1) big_step = big_step << 0;
				UI.fireEvent ('RequestSkipBack', big_step);
			}
			this.blur(); btn_back_focus = false; btn_back_hold = false;
		};
		btn_back_jump.onmousedown = function () { btn_back_hold = true; this.focus (); if (!btn_back_tm) this.onfocus (); };
		btn_back_jump.onmouseup = function () { btn_back_hold = false; };
		btn_back_jump.onmouseleave = function () {
			btn_back_hold = false;
			if (btn_back_tm) { clearTimeout(btn_back_tm); btn_back_tm = null; }
			this.blur();
		};
		btn_back_jump.onfocus = function() {
			var btn = this; btn_back_focus = false;
			if (btn_back_tm) clearTimeout ( btn_back_tm );
			var step = function ( num, count ) {
				if (btn_back_hold || document.activeElement === btn) {
					btn_back_focus = true;
					UI.fireEvent ('RequestSkipBack', num);
					if (count >= PKAE._deps.uiHelpers.activeSeekWarmupFor ( app ))
						num += num * PKAE._deps.uiHelpers.activeSeekRampFor ( app );
					btn_back_tm = setTimeout(function() { step (num, ++count); },40);
				}
			};
			btn_back_tm = setTimeout(function(){
				var small = PKAE._deps.uiHelpers.activeDurationFor ( app ) / 2000;
				var zoom = PKAE._deps.uiHelpers.activeZoomFor ( app );
				small /= zoom;
				if (small < 0.01) small = 0.01;
				step (small, 0);
			},220);
		};

		var btn_front_jump = d.createElement ('button');
		btn_front_jump.setAttribute('tabIndex', -1);
		btn_front_jump.className = 'pk_btn pk_front_jump icon-forward3';
		btn_front_jump.innerHTML = '<span>' + t('toolbar.seek_fwd') + '</span>';
		transport.appendChild ( btn_front_jump );

		var btn_frnt_focus = false, btn_frnt_hold = false, btn_frnt_tm = null;
		btn_front_jump.onclick = function() {
			if (!btn_frnt_focus) {
				if (btn_frnt_tm) { clearTimeout(btn_frnt_tm); btn_frnt_tm = null; }
				var big_step = PKAE._deps.uiHelpers.activeDurationFor ( app ) / 20;
				var zoom = PKAE._deps.uiHelpers.activeZoomFor ( app );
				big_step /= ((zoom/2)+0.5);
				if (big_step > 1) big_step = big_step << 0;
				UI.fireEvent ('RequestSkipFront', big_step);
			}
			this.blur(); btn_frnt_focus = false; btn_frnt_hold = false;
		};
		btn_front_jump.onmousedown = function () { btn_frnt_hold = true; this.focus (); if (!btn_frnt_tm) this.onfocus (); };
		btn_front_jump.onmouseup = function () { btn_frnt_hold = false; };
		btn_front_jump.onmouseleave = function () {
			btn_frnt_hold = false;
			if (btn_frnt_tm) { clearTimeout(btn_frnt_tm); btn_frnt_tm = null; }
			this.blur();
		};
		btn_front_jump.onfocus = function() {
			var btn = this; btn_frnt_focus = false;
			if (btn_frnt_tm) clearTimeout ( btn_frnt_tm );
			var step = function ( num, count ) {
				if (btn_frnt_hold || document.activeElement === btn) {
					btn_frnt_focus = true;
					UI.fireEvent ('RequestSkipFront', num);
					if (count >= PKAE._deps.uiHelpers.activeSeekWarmupFor ( app ))
						num += num * PKAE._deps.uiHelpers.activeSeekRampFor ( app );
					btn_frnt_tm = setTimeout(function() { step (num, ++count); },40);
				}
			};
			btn_frnt_tm = setTimeout(function(){
				var small = PKAE._deps.uiHelpers.activeDurationFor ( app ) / 2000;
				var zoom = PKAE._deps.uiHelpers.activeZoomFor ( app );
				small /= zoom;
				if (small < 0.01) small = 0.01;
				step (small, 0);
			},220);
		};

		var btn_back_total = d.createElement ('button');
		btn_back_total.setAttribute('tabIndex', -1);
		btn_back_total.className = 'pk_btn icon-previous2';
		btn_back_total.innerHTML = '<span>' + t('toolbar.seek_start') + '</span>';
		transport.appendChild ( btn_back_total );
		btn_back_total.onclick = function() {
			var mt = PKAE._deps.uiHelpers.activeMultitrackFor ( app );
			var ws = app.engine && app.engine.wavesurfer;
			var r = mt && mt.GetRegion ? mt.GetRegion () : (ws && ws.regions ? ws.regions.list[0] : null);
			var total = PKAE._deps.uiHelpers.activeDurationFor ( app );
			if (r && total > 0) {
				var pos = mt ? (mt.GetMarker ? mt.GetMarker () : mt.GetCursor ()) : ws.ActiveMarker;
				if (pos > (mt ? r.end : r.end / total) + 0.004) UI.fireEvent ('RequestSeekTo', (r.end / total) - 0.0001);
				else UI.fireEvent ('RequestSeekTo', r.start / total);
			} else UI.fireEvent ('RequestSeekTo', 0);
			this.blur();
		};

		var btn_front_total = d.createElement ('button');
		btn_front_total.setAttribute('tabIndex', -1);
		btn_front_total.className = 'pk_btn icon-next2';
		btn_front_total.innerHTML = '<span>' + t('toolbar.seek_end') + '</span>';
		transport.appendChild ( btn_front_total );
		btn_front_total.onclick = function() {
			var mt = PKAE._deps.uiHelpers.activeMultitrackFor ( app );
			var ws = app.engine && app.engine.wavesurfer;
			var r = mt && mt.GetRegion ? mt.GetRegion () : (ws && ws.regions ? ws.regions.list[0] : null);
			var total = PKAE._deps.uiHelpers.activeDurationFor ( app );
			if (r && total > 0) {
				var pos = mt ? (mt.GetMarker ? mt.GetMarker () : mt.GetCursor ()) : ws.ActiveMarker;
				if (pos < (mt ? r.start : r.start / total) - 0.004) UI.fireEvent ('RequestSeekTo', r.start / total);
				else UI.fireEvent ('RequestSeekTo', r.end / total);
			} else UI.fireEvent ('RequestSeekTo', 1);
			this.blur();
		};

		var btn_rec = d.createElement ('button');
		btn_rec.setAttribute('tabIndex', -1);
		btn_rec.className = 'pk_btn icon-rec';
		btn_rec.innerHTML = '<span>' + t('toolbar.record') + '</span>';
		btn_rec.onclick = function() {
			if (this.getAttribute('disabled') === 'disabled') { this.blur (); return ; }
			UI.fireEvent('RequestActionRecordToggle'); this.blur();
		};
		UI.listenFor ('ErrorRec', function() { btn_rec.style.opacity = 0.6; btn_rec.setAttribute("disabled", "disabled"); });
		transport.appendChild ( btn_rec );
		UI.KeyHandler.addCallback ('KeyRecR', function( k ) { if (UI.InteractionHandler.on) return ; btn_rec.click (); }, [82]);
		UI.listenFor ('DidActionRecordStart', function () { btn_rec.classList.add ('pk_act'); });
		UI.listenFor ('DidActionRecordStop', function () { btn_rec.classList.remove ('pk_act'); });

		return transport;
	}

	PKAE._deps._toolbarTransport = _toolbarTransport;

})( window, document, PKAudioEditor );
