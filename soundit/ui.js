/* --------------------------------------------------------------------------
 * 📄 原始檔案: ui.js 
 * -------------------------------------------------------------------------- */
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
			var lbt = root.getElementsByClassName ('pk_lbtrk')[0];	/* [標籤列] 標籤列顯示時，波形高度要扣掉它 */
			if (lbt) used += lbt.offsetHeight;
			if (this.BarBtm && this.BarBtm.on) used += this.BarBtm.height;
			var res = Math.max (112, h - used);
			/* [新增] 自動貼合：上面是用「各區塊高度相加」估算，標籤列（層數會變）、換行的工具列等只要有一處沒算準，
			 * 頁面底部就會多出空白或捲軸。這裡改用實際版面量測：看最後一個在文件流內的區塊底邊，離「可用高度」的底部還差多少
			 * （正＝還有空白、負＝超出），直接把差額加到目前的波形高度上。已經貼合時差額為 0，高度不變，所以不會來回抖動。
			 * 桌機與手機版型（pk_mob）都適用；兩者的底部都以 #app 自己的上緣＋可用高度計算，不受頁面捲動位置影響。 */
			{
				var av = root.getElementsByClassName ('pk_av')[0], kids = root.children, k, last = null, pos, vh, sl;
				if (av && av.offsetHeight > 0 && av.offsetParent) {
					for (k = kids.length - 1; k >= 0; --k) {
						if (!kids[k].offsetHeight) continue ;
						pos = w.getComputedStyle (kids[k]).position;
						if (pos === 'absolute' || pos === 'fixed') continue ;
						last = kids[k]; break ;
					}
					vh = app.isMobile ? h : (d.documentElement.clientHeight || h);	/* 手機沿用 visualViewport 高度；桌機不含橫向捲軸 */
					if (last) {
						sl = (root.getBoundingClientRect ().top + vh) - last.getBoundingClientRect ().bottom;
						if (isFinite (sl) && Math.abs (sl) < 2000) res = Math.max (112, av.offsetHeight + sl);
					}
				}
			}
			return res;
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
