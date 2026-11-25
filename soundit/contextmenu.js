(function ( win, doc, PKAE ) {
	'use strict';

	var activeMenu = [],
		namespace = win,
		contextStorage = {},
		_id = 0,
		lp_open_at = 0;     /* 新增：最近一次「長按」開啟選單的時間 */

	var closeEvent = [ 'mousedown', 'touchup' ];

	var closeContext = function ( e, force ) {
			if (activeMenu.length === 0) return ;

			/* 新增：長按放開時，部分瀏覽器會補送 mousedown，不能因此把剛開的選單關掉 */
			if (!force && e && lp_open_at && Date.now () - lp_open_at < 450) return ;

			var el = e && (e.target || e.srcElement);
			var cls = el && el.className;

			/* [新增] 點在選單本身（例如拖曳捲軸）不關閉 */
			if (!force && el && el.classList && el.classList.contains ('pk_contextMenu')) return ;

			if (!el || (cls + '').indexOf('_action') === -1 || force)
			{
				var l = activeMenu.length;
				while (l--) terminate (activeMenu[ l ]);
				activeMenu = [];
			}
		},

		terminate = function( e ) {
			if (!e || !e.currentMenu) return false;

			var children = e.currentMenu.getElementsByTagName('*'),
			len = children.length;

			while( len-- )
				children[ len ].parentNode.removeChild( children[ len ] );

			e.currentMenu.removeEventListener( closeEvent[0], stopPropagation );
			doc.body.removeChild( e.currentMenu );
			e.currentMenu = null;
			return false;
		},

		stopPropagation	=	function(e){ e.stopPropagation(); },
		openContext = function( e, x, y ) {

			closeContext(null);
			activeMenu.push( e );

			var div = doc.createElement('div'),
			a,
			marginOffset = 4,
			opts = e.options,
			leftOffset = x - marginOffset,
			topOffset = y - marginOffset,
			width = 0, height = 0;

			div.className = "pk_contextMenu " + e.menuClass;
			div.id = e.token;

			for( var i = 0, len = opts.length; i < len; ++i ) {
				if( opts[ i ].group )
				{
					/* [新增] 可收合的分組：點標題展開／收起（手機也好按），不用另外開子選單 */
					var grp = opts[ i ], head = doc.createElement('a'), box = doc.createElement('div'), car = doc.createElement('span');
					head.className = 'pk_ctx_action pk_ctx_grp';
					head.setAttribute ('role', 'button');
					car.className = 'pk_ctx_car';
					head.appendChild ( doc.createTextNode ( grp.name ) );
					head.appendChild ( car );
					box.className = 'pk_ctx_sub';
					grp.group.forEach ( function ( it ) {
						var s = doc.createElement('a');
						s.className = 'pk_ctx_action';
						s.innerHTML = it.name;
						s.addEventListener ( 'click', it.callback, false );
						box.appendChild ( s );
					});
					head._box = box; head._car = car;
					head.addEventListener ( 'click', function ( ev ) {
						ev.preventDefault ();
						var on = this._box.style.display === 'none';
						this._box.style.display = on ? '' : 'none';
						this._car.textContent = on ? '\u25BE' : '\u25B8';
						this.setAttribute ('aria-expanded', on ? 'true' : 'false');
						place ();
					}, false );
					box.style.display = grp.open ? '' : 'none';
					car.textContent = grp.open ? '\u25BE' : '\u25B8';
					head.setAttribute ('aria-expanded', grp.open ? 'true' : 'false');
					div.appendChild ( head );
					div.appendChild ( box );
				}
				else if( opts[ i ].isHTML )
				{
					a = doc.createElement('div');
					a.innerHTML = opts[ i ].isHTML;
					div.appendChild( a );
				}
				else {
					a = doc.createElement('a');
					a.className = 'pk_ctx_action';
					a.cnt = 1;
					a.innerHTML = opts[ i ].name;
					a.callback = opts[ i ].callback;

					a.addEventListener( 'click', a.callback, false );

					div.appendChild( a );
				}
			}

			e.currentMenu = div;
			div.addEventListener( closeEvent[0], stopPropagation, false );

			doc.body.appendChild( div );

			/* [修改] 定位抽成 place()（展開／收合分組後要重算）；選單比視窗高時限制高度並出現捲軸，不再被切掉 */
			function place () {
				div.style.cssText = "top:0;left:0;";
				width = div.offsetWidth;
				height = div.offsetHeight;

				var maxH = win.innerHeight - 8;
				var lf = leftOffset, tp = topOffset;
				if (win.innerWidth < lf + width) lf -= width;
				if (win.innerHeight < tp + height) tp -= height;
				/* 新增：夾在可視範圍內，避免選單被切掉（手機在邊緣長按時常見） */
				var h = Math.min ( height, maxH );
				lf = Math.max ( 4, Math.min ( lf, win.innerWidth - width - 4 ) );
				tp = Math.max ( 4, Math.min ( tp, win.innerHeight - h - 4 ) );
				div.style.cssText = "top:" + tp + "px;left:" + lf + "px;" + ( height > maxH ? "max-height:" + maxH + "px;overflow-y:auto;overscroll-behavior:contain;" : "" );
			}
			place ();

			if (e.onOpen) {
				e.onOpen ( e, div );
			}

      	return false;
	},
	openMenu = function( e )
	{
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		else {
			e = {pageX:0, pageY:0};
		}

		var instance = getInstance ( this );
		var pageX = e.pageX || e.clientX + doc.documentElement.scrollLeft;
		var pageY = e.pageY || e.clientY + doc.documentElement.scrollTop;

		if (!instance) return false;

		instance.curr_target = e.target || e.srcElement;

		openContext ( instance, pageX, pageY );
	},
	getInstance = function( elem ) {
		return contextStorage[ elem.getAttribute( 'data-token' ) ];
	};

	var contextMenu = namespace.contextMenu = function( elem, options ) {
		if (!(this instanceof contextMenu)) return new contextMenu( elem, options );
		if (!options) options = {};

		this.elem = elem;
		this.options = [];
		this.menuClass = options.className || 'pk_open';
		this.curr_target = null;

		if (elem) elem.addEventListener( 'pk_ctxmn', openMenu, false );

		this.token = ++_id;
		if (elem) elem.setAttribute( 'data-token', this.token );

		contextStorage[ this.token ] = this;
	};

	contextMenu.prototype.open = function( e ) {
		openMenu.call( this.elem, e );
	};
	contextMenu.prototype.close = function( e ) {
		closeContext();
	};
	contextMenu.prototype.openWithToken = function( token, x, y ) {
		openContext( contextStorage[ token ], x||0, y||0 );
	};

	contextMenu.prototype.destroy = function() {

		this.elem.removeEventListener( 'pk_ctxmn', openMenu );

		closeContext();
		contextStorage[ this.token ] = null;

		return false;
	},

	contextMenu.prototype.addOption = function( name, callback, isHTML ) {
		var q = this;
		this.options.push({ "name" : name, "callback" : function( e ) {

			callback && callback( q, q._open );
			closeContext( q, true );
		},
		"isHTML"	: isHTML
	});
	};

	/* [新增] 分組：name＝標題；items＝[ { name, callback } ]；open＝預設是否展開 */
	contextMenu.prototype.addGroup = function( name, items, open ) {
		var q = this;
		this.options.push({ "name": name, "open": !!open, "group": ( items || [] ).map ( function ( it ) {
			return { "name": it.name, "callback": function () {
				it.callback && it.callback( q, q._open );
				closeContext( q, true );
			}};
		})});
	};

	doc.addEventListener( closeEvent[0], closeContext, true );
	/* 新增：觸控時，點選單以外的地方也要關閉（'touchup' 並非真正的事件） */
	doc.addEventListener( 'touchstart', closeContext, true );

	/* ------------------------------------------------------------------
	 * 新增：觸控長按 → 開啟右鍵選單
	 * 按住 550ms 且手指移動不超過 10px，就對被按的元素送出 'pk_ctxmn'，
	 * 效果等同桌機右鍵。只對已登錄選單的元素（含其子元素）有效。
	 * ------------------------------------------------------------------ */
	var LP_MS = 550, LP_MOVE = 10;
	var lp_timer = 0, lp_x = 0, lp_y = 0, lp_target = null;

	function lpCancel () {
		if (lp_timer) { clearTimeout ( lp_timer ); lp_timer = 0; }
		lp_target = null;
	}

	function lpHasMenu ( el ) {
		while (el && el !== doc) {
			var tok = el.getAttribute && el.getAttribute ('data-token');
			if (tok && contextStorage[ tok ]) return true;
			el = el.parentNode;
		}
		return false;
	}

	doc.addEventListener( 'touchstart', function ( e ) {
		lpCancel ();
		if (!e.touches || e.touches.length !== 1) return ;

		var tg = e.target;
		if (tg.closest && tg.closest ('.pk_contextMenu')) return ;
		if (!lpHasMenu ( tg )) return ;

		lp_x = e.touches[0].clientX;
		lp_y = e.touches[0].clientY;
		lp_target = tg;

		lp_timer = setTimeout ( function () {
			lp_timer = 0;
			var target = lp_target;
			lp_target = null;
			if (!target || activeMenu.length) return ;   /* 瀏覽器自己的 contextmenu 已先開了就不重複 */

			var ev;
			try { ev = new CustomEvent ('pk_ctxmn', { bubbles: true, cancelable: true }); }
			catch (er) { ev = doc.createEvent ('Event'); ev.initEvent ('pk_ctxmn', true, true); }
			ev.clientX = lp_x;
			ev.clientY = lp_y;
			ev.pageX = lp_x + (win.pageXOffset || 0);
			ev.pageY = lp_y + (win.pageYOffset || 0);

			lp_open_at = Date.now ();
			try { navigator.vibrate && navigator.vibrate ( 15 ); } catch (er) {}
			target.dispatchEvent ( ev );
		}, LP_MS );
	}, true );

	doc.addEventListener( 'touchmove', function ( e ) {
		if (!lp_timer || !e.touches || !e.touches[0]) return ;
		if (Math.abs ( e.touches[0].clientX - lp_x ) > LP_MOVE || Math.abs ( e.touches[0].clientY - lp_y ) > LP_MOVE) lpCancel ();
	}, true );
	doc.addEventListener( 'touchend', lpCancel, true );
	doc.addEventListener( 'touchcancel', lpCancel, true );
	doc.addEventListener( 'killCTX', closeContext, false );

	PKAE._deps.ContextMenu = contextMenu;

})( window, document, PKAudioEditor );

