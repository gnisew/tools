(function ( w, d, PKAE ) {
	'use strict';

var h = PKAE._deps.uiHelpers;
var activeMultitrackFor = h.activeMultitrackFor;
var activeCursorTimeFor = h.activeCursorTimeFor;
var activeDurationFor = h.activeDurationFor;
var activeRegionFor = h.activeRegionFor;
var activeZoomFor = h.activeZoomFor;
var activeSeekRampFor = h.activeSeekRampFor;
var activeSeekWarmupFor = h.activeSeekWarmupFor;
var activeReadyFor = h.activeReadyFor;
var seekMarkerEdgeFor = h.seekMarkerEdgeFor;
var seekRegionMarkerEdgeFor = h.seekRegionMarkerEdgeFor;

	function _makeUIBarBottom ( UI, app ) {
		var q = this;

		var bar_bottom_el = d.createElement ('div');
		bar_bottom_el.className = 'pk_dck';
		UI.el.appendChild( bar_bottom_el );

		q.el = bar_bottom_el;
		q.on = false;
		q.height = 130;

		q.SetHeight = function ( height ) {
			q.height = height;
			if (q.on) bar_bottom_el.style.height = height + 'px';
		};

		q.Show = function () {
			q.on = true;
			bar_bottom_el.style.display = 'block';
			bar_bottom_el.style.height = q.height + 'px';
			app.fireEvent ('RequestResize');
		};
		q.Hide = function () {
			q.on = false;
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

		
		var footer = d.createElement ( 'div' );
		footer.className = 'pk_ftr pk_noselect';
		UI.el.appendChild( footer );

		// make panner buttons
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

		btn_panner_left.innerHTML = '<strong>L</strong> ON';
		btn_panner_right.innerHTML = '<strong>R</strong> ON';

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
					btn_panner_left.innerHTML = '<strong>L</strong> ON';
				}
				else
				{
					btn_panner_left.classList.add ('pk_inact');
					btn_panner_left.innerHTML = '<strong>L</strong> OFF';
				}
			} else {
				if (val)
				{
					btn_panner_right.classList.remove ('pk_inact');
					btn_panner_right.innerHTML = '<strong>R</strong> ON';
				}
				else
				{
					btn_panner_right.classList.add ('pk_inact');
					btn_panner_right.innerHTML = '<strong>R</strong> OFF';
				}
			}
		});

		// zoom btns
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
		// end of zoom btns
		
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
		
		// add zoom event, and add seek event....
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
				// wavepoint.style.left = ((perc * 100).toFixed(2)/1) + '%';
				wavepoint.style.left = ((perc * 10000)>>0)/100 + '%';
			}

			// get zoom value and left...
			if ((100/e) > 99)
			{
				wavedrag_width = 100;
				wavedrag_style.width = '100%';
				wavedrag_style.left =  '0%';
				//wavedrag_style.transform = 'translate(0,0)';
				wavedrag.classList.add ('pk_inact');
			}
			else
			{
				wavedrag_width = (100/e);
				wavedrag_style.width = wavedrag_width + '%';
				wavedrag_style.left =  o + '%';
				//wavedrag_style.transform = 'translate(' +  (e * o) + '%,0)';
				wavedrag.classList.remove ('pk_inact');
			}
		});
		UI.listenFor ('DidCursorCenter', function( val, zoom ) {

			requestAnimationFrame(function () {
				wavedrag_style.left = (val * 100) + '%';
				//wavedrag_style.transform = 'translate(' + (val * zoom * 100) + '%,0)';
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
			str += '<span class="pk_mark1 '+(i%2?'pk_odd':'')+'">' + -(i*2) + '</span>';
		}
		markers.innerHTML = str;
		
		volume_parent.appendChild( this.volumeGauge );
		volume_parent.appendChild( this.volumeGauge2 );
		volume_parent.appendChild( markers );
		
		volume_parent.onclick = function() {
			q.volumeGaugePeaker.className = 'pk_peaker';
			q.volumeGaugePeaker2.className = 'pk_peaker';
		};

		footer.appendChild( volume_parent );

		// change temp message, it's pretty ugly #### TODO
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

			var iw = window.innerWidth;
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
		// var first = false;
		d.body.addEventListener ('touchstart', function( e ) {
			ex = e.touches[0].pageX;
			ey = e.touches[0].pageY;

			// first = true;
			allow = false;
		});

		d.body.addEventListener ('touchend', function( e ) {
			ex = -1;
			ey = -1;

			// first = false;
			allow = false;
		});

		d.body.addEventListener ('touchmove', function( e ) {
			if (isControlTouch ( e.target )) return ;
			if (allow) return ;

			var ny = e.touches[0].pageY;
			var nx = e.touches[0].pageX;
			var direction = ey - ny;
			var direction2 = ex - nx;

			// if (first) {
			//	first = false;
			// }

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
