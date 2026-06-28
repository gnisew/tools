(function ( w, d, PKAE ) {
	'use strict';

	var t = PKLocale.t;

	var PKUI = function( app ) {
		var q = this;

		this.el = app.el;

		this.el.className += ' pk_app' + (app.isMobile ? ' pk_mob' : '');
		
		this.fireEvent = app.fireEvent;
		this.listenFor = app.listenFor;

		this.InteractionHandler = {
			on  : false,
			by  : null,
			arr : [],

			check: function ( _name ) {
				if (this.on && this.by !== _name) {
					return (false);
				}
				return (true);
			},

			checkAndSet: function ( _name ) {
				if (!this.check (_name))
					return (false);

				this.on = true;
				this.by = _name;

				return (true);
			},

			forceSet: function ( _name ) {
				if (this.on)
				{
					this.arr.push ({
						on: this.on,
						by: this.by
					});
				}

				this.on = true;
				this.by = _name;
			},

			forceUnset: function ( _name ) {
				if (this.check (_name))
				{
					var prev = this.arr.pop ();
					if (prev)
					{
						this.on = prev.on;
						this.by = prev.by;
					}
					else
					{
						this.on = false;
						this.by = null;
					}
				}
			}
		};

		if (app.isMobile)
		{
			d.body.className = 'pk_stndln';
			var fxd = d.createElement ('div');
			fxd.className = 'pk_fxd';
			fxd.appendChild (this.el);

			d.body.appendChild (fxd);

			PKAE._deps._makeMobileScroll (this);
		}

		this.KeyHandler = new app._deps.keyhandler ( this );
		this.TopHeader  = new PKAE._deps._makeUITopHeader ( PKAE._deps._topbarConfig ( app, this ), this );
		this.Toolbar    = new PKAE._deps._makeUIToolbar ( this );
		this.footer     = new PKAE._deps._makeUIMainView ( this, app );
		this.BarBtm     = new PKAE._deps._makeUIBarBottom (this, app);
		this.MainHeight = function () {
			var h = app.isMobile && w.visualViewport ? w.visualViewport.height : w.innerHeight;
			var used = 0;
			var root = this.el;
			var hdr = root.getElementsByClassName ('pk_hdr')[0];
			var tbc = root.getElementsByClassName ('pk_tbc')[0];
			var ftr = root.getElementsByClassName ('pk_ftr')[0];
			if (hdr) used += hdr.offsetHeight;
			if (tbc) used += tbc.offsetHeight;
			if (ftr) used += ftr.offsetHeight;
			if (this.BarBtm && this.BarBtm.on) used += this.BarBtm.height;
			return Math.max (112, h - used);
		};
		if (app.isMobile && w.visualViewport) {
			var resize_raf = 0;
			w.visualViewport.addEventListener ('resize', function () {
				if (resize_raf) return ;
				resize_raf = w.requestAnimationFrame (function () {
					resize_raf = 0;
					app.fireEvent ('RequestResize');
				});
			});
		}

		this.Dock      = function ( id, arg1, arg2 ) {
			app.fireEvent (id, arg1, arg2);
		};
		this.GetActiveCursor = function () {
			return PKAE._deps.uiHelpers.activeCursorTimeFor ( app );
		};

		app.listenFor ('ShowError', function( message ) {
			new PKSimpleModal ({
				title : t('error.title'),
				clss:'pk_modal_anim',
				ondestroy : function( q ) {
					app.ui.InteractionHandler.on = false;
					app.ui.KeyHandler.removeCallback ('modalTempErr');
				},
				buttons:[],
				body:'<p>' + message + '</p>',
				setup:function( q ) {
					app.fireEvent ('RequestPause');
					app.fireEvent( 'RequestRegionClear');

					app.ui.InteractionHandler.checkAndSet ('modal');
					app.ui.KeyHandler.addCallback ('modalTempErr', function ( e ) {
						q.Destroy ();
					}, [27]);
				}
			}).Show ();
		});

		app.listenFor ('RequestKeyDown', function ( key ) {
			q.KeyHandler.keyDown ( key, null );
			q.KeyHandler.keyUp ( key );
		});
	};

	PKAE._deps.ui = PKUI;
	
})( window, document, PKAudioEditor );
