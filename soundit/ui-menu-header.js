(function ( w, d, PKAE ) {
	'use strict';

	var h = PKAE._deps.uiHelpers;

	function _makeUITopHeader ( menu_tree, UI ) {
		var header = d.createElement ( 'div' );
		header.className = 'pk_hdr pk_noselect';

		var _name = 'TopHeader',
			_default_class = 'pk_btn pk_noselect';

		var target_index = -1;
		var target_el = null;
		var target_el_old = null;
		var target_option = null;
		var top_els = [];
		var q = this;

		/* [新增] 子選單的展開方式：電腦版往右浮出、行動版（UI.el 有 pk_mob）就地展開。
		 * 兩種都用 .pk_open 表示「展開中」，差別只在 CSS 與下面的定位／滑過處理 */
		function isMob () { return !!(UI && UI.el && UI.el.classList.contains ('pk_mob')); }

		function subOf ( box ) {
			for (var i = 0; i < box.children.length; ++i) if (box.children[i].classList.contains ('pk_menu')) return box.children[i];
			return null;
		}

		/* 收合一個子選單（連同它底下展開中的子選單） */
		function closeSub ( box ) {
			box.classList.remove ( 'pk_open' );
			if (box.children[0] && box.children[0].setAttribute) box.children[0].setAttribute ( 'aria-expanded', 'false' );
			var opened = box.getElementsByClassName ( 'pk_open' );
			while (opened.length) opened[0].classList.remove ( 'pk_open' );
		}

		/* 電腦版：浮出層用 position:fixed（父選單有 overflow，會把往右伸出的內容裁掉），
		 * 預設貼在項目右側；右邊放不下就翻到左側；底部放不下就往上推 */
		function placeSub ( box ) {
			var list = subOf ( box );
			if (!list) return ;
			var r = box.getBoundingClientRect (), W = w.innerWidth, H = w.innerHeight;
			var lw = list.offsetWidth, lh = list.offsetHeight;
			var left = r.right - 2;
			if (left + lw > W - 4) left = Math.max ( 4, r.left - lw + 2 );
			var top = r.top - 7;
			if (top + lh > H - 4) top = Math.max ( 4, H - lh - 4 );
			list.style.left = left + 'px';
			list.style.top = top + 'px';
		}

		/* 電腦版：展開這一個，同層其他已展開的收起來 */
		function openSub ( box ) {
			var par = box.parentNode;
			for (var i = 0; i < par.children.length; ++i) {
				var s = par.children[i];
				if (s !== box && s.classList.contains ( 'pk_open' )) closeSub ( s );
			}
			if (!box.classList.contains ( 'pk_open' )) {
				box.classList.add ( 'pk_open' );
				box.children[0].setAttribute ( 'aria-expanded', 'true' );
			}
			placeSub ( box );
		}

		/* 電腦版：滑鼠移到某個項目。有子選單就展開；沒有就把同層展開的收起來。
		 * 已有子選單展開時延遲 140ms 才切換，斜著移向浮出層途中經過別的項目不會被關掉 */
		function hoverItem ( box ) {
			if (isMob ()) return ;
			var par = box.parentNode;
			clearTimeout ( par.__ht );
			if (box.classList.contains ( 'pk_open' )) return ;
			var anyOpen = false, i;
			for (i = 0; i < par.children.length; ++i) if (par.children[i].classList.contains ( 'pk_open' )) anyOpen = true;
			function go () {
				if (box.classList.contains ( 'pk_has_sub' )) openSub ( box );
				else for (var j = 0; j < par.children.length; ++j) if (par.children[j].classList.contains ( 'pk_open' )) closeSub ( par.children[j] );
			}
			if (anyOpen) par.__ht = setTimeout ( go, 140 ); else go ();
		}

		function build_menus ( parent_el, tree_obj, level ) {
			for (var i = 0; i < tree_obj.length; ++i)
			{
				var btn_container = d.createElement ( 'div' );
				var curr_obj = tree_obj[i];

				if (level === 0)
				{
					btn_container.className = _default_class;
					var btn = d.createElement ( 'button' );
					btn.innerHTML = curr_obj.name;
					btn_container.appendChild ( btn );
				}
				else if (curr_obj.name === '---')
				{
					/* [新增] 分隔線：畫成一條線，不是可點的按鈕 */
					btn_container.className = 'pk_menu_sep';
					btn_container.setAttribute ( 'role', 'separator' );
					parent_el.appendChild ( btn_container );
					continue;
				}
				else
				{
					btn_container.className = 'pk_menu_el' + (curr_obj.children ? ' pk_has_sub' : '');
					var btn = d.createElement ( 'button' );
					btn.className = 'pk_opt ' + (curr_obj.clss ? curr_obj.clss : '');
					btn.setAttribute ( 'tab-index', '-1' );
					btn.setAttribute ( 'data-index', i );
					btn.innerHTML = curr_obj.name;
					btn_container.appendChild ( btn );

					if (curr_obj.action)
					{
						(function ( btn, action ) {
							btn.onclick = function ( obj ) {
								if (this.classList.contains('pk_inact')) return ;
								q.closeMenu ();
								action ( obj );
							};
						})( btn, curr_obj.action );
					}
					/* [修改] 子選單：行動版就地展開／收合（手風琴）；電腦版往右浮出（點擊或 Enter 是「展開」，不會收合，
					 * 因為滑過時已經先開了，再點一下就收會很奇怪） */
					if (curr_obj.children && !curr_obj.action)
					{
						(function ( box, btn ) {
							btn.setAttribute ( 'aria-haspopup', 'true' );
							btn.onclick = function () {
								if (isMob ()) {
									var on = box.classList.toggle ( 'pk_open' );
									btn.setAttribute ( 'aria-expanded', on ? 'true' : 'false' );
								}
								else openSub ( box );
							};
						})( btn_container, btn );
					}
					/* [新增] 電腦版：滑過任何一個項目都要處理（沒有子選單的項目也要，才能把旁邊展開的收起來） */
					btn_container.addEventListener ( 'mouseenter', (function ( box ) { return function () { hoverItem ( box ); }; })( btn_container ), false );
					if (curr_obj.setup)
					{
						curr_obj.setup ( btn );
					}
				}
				parent_el.appendChild ( btn_container );

				if (level === 0)
					top_els[i] = btn_container.childNodes[0];

				if (curr_obj.children)
				{
					var list = d.createElement('div');
					list.className = 'pk_menu';
					build_menus ( list, curr_obj.children, level + 1 );
					btn_container.appendChild ( list );
				}
			}
		};
		build_menus ( header, menu_tree, 0 );

		this.getOpenElement = function () { return target_el; };
		this.closeMenu = function() {
			if (!target_el) return ;
			/* [新增] 關閉時把展開的子選單收回，下次打開是乾淨的 */
			var opened = target_el.parentNode.getElementsByClassName ('pk_open');
			while (opened.length) opened[0].classList.remove ('pk_open');
			target_el.parentNode.className = _default_class;
			target_el = target_el_old = null;
			if (target_option) { target_option.classList.remove ('pk_act'); target_option = null; }
			UI.InteractionHandler.on = false;
			d.removeEventListener ( 'mouseup', mouseup );
			UI.KeyHandler.removeCallback (_name + 1);
			UI.KeyHandler.removeCallback (_name + 2);
			UI.KeyHandler.removeCallback (_name + 3);
			UI.KeyHandler.removeCallback (_name + 4);
			UI.KeyHandler.removeCallback (_name + 5);
			UI.KeyHandler.removeCallback (_name + 6);
		};

		/* [新增] 目前展開的選單中，看得到且可用的選項（收合的子選單、停用項不算）
		 * [修改] 原本用 offsetParent !== null 判斷「看得到」，position:fixed 的浮出層永遠是 null，
		 *        鍵盤上下鍵會跳過子選單；改用 getClientRects().length（display:none 才會是 0） */
		function visibleOptions () {
			var all = target_el.parentNode.getElementsByClassName ('pk_opt'), list = [];
			for (var i = 0; i < all.length; ++i)
				if (all[i].getClientRects ().length && !all[i].classList.contains ('pk_inact')) list.push ( all[i] );
			return list;
		}
		function stepOption ( dir ) {
			if (!target_el) return ;
			var list = visibleOptions ();
			if (!list.length) return ;
			var at = target_option ? list.indexOf ( target_option ) : -1;
			if (target_option) target_option.classList.remove ('pk_act');
			at = at === -1 ? (dir > 0 ? 0 : list.length - 1) : (at + dir + list.length) % list.length;
			target_option = list[ at ];
			target_option.classList.add ('pk_act');
			if (target_option.scrollIntoView) target_option.scrollIntoView ({ block: 'nearest' });
		}

		this.openMenu = function ( index, is_mouse ) {
			if (target_el) target_el.parentNode.className = _default_class;
			if (index === -1) index = target_index === -1 ? 0 : target_index;
			var curr_target = top_els[ index ];
			target_el = curr_target;
			var parent = curr_target.parentNode;
			var left = parent.getBoundingClientRect ().left;
			var max = window.innerWidth;
			if ( max - left < 200 ) {
				var offset = (264 - (max - left)) >> 0;
				if (offset > 1) parent.getElementsByClassName ('pk_menu')[0].style.left = (-offset / 2) + 'px';
			}
			parent.className += ' pk_vis';
			setTimeout(function() { if (target_el === curr_target) parent.className += ' pk_act'; },0);
			target_index = index;
			UI.InteractionHandler.checkAndSet (_name);
			if (!is_mouse) d.addEventListener ( 'mouseup', mouseup, false );
			UI.KeyHandler.addCallback (_name + 1, function () { if (target_index === 0) target_index = top_els.length; q.closeMenu (); q.openMenu ( target_index - 1 ); }, [37]);
			UI.KeyHandler.addCallback (_name + 2, function () { if (target_index === top_els.length - 1) target_index = -1; q.closeMenu (); q.openMenu ( target_index + 1 ); }, [39]);
			UI.KeyHandler.addCallback (_name + 3, function () { q.closeMenu (); }, [27]);
			UI.KeyHandler.addCallback (_name + 4, function () { stepOption ( -1 ); }, [38]);
			UI.KeyHandler.addCallback (_name + 5, function () { stepOption ( 1 ); }, [40]);
			UI.KeyHandler.addCallback (_name + 6, function () { if (target_option) target_option.click(); else q.closeMenu (); }, [13]);
			return (true);
		};

		UI.listenFor ('DidReadyFire', function () { q.closeMenu (); });

		function _checkForAct( x ) {
			if (target_el == x || !x) return (false);
			var par = x.parentNode;
			while (par && target_el) { if (target_el.parentNode == par) return (false); par = par.parentNode; }
			var l = top_els.length;
			while(l-- > 0) { if (top_els[l] === x) return q.openMenu (l, true); }
			return (false);
		}

		var mousemove = function ( e ) {
			if (!UI.InteractionHandler.check (_name)) return (false);
			if (target_el || (UI.InteractionHandler.on && UI.InteractionHandler.by === _name) ) {
				var x = e.target || e.srcElement;
				if (x.className.indexOf('pk_opt') >= 0) { if (target_option) target_option.classList.remove ('pk_act'); target_option = x; target_option.classList.add ('pk_act'); }
				else { if (target_option) target_option.classList.remove ('pk_act'); target_option = null; }
				return _checkForAct ( x );
			}
			return (false);
		};
		var mouseup = function( e ) {
			var x = e.target || e.srcElement;
			if (target_el) {
				var par = x; var found = false;
				while (par && target_el) { if (target_el.parentNode == par) { found = true; break; } par = par.parentNode; }
				if (!found || target_el_old === x) q.closeMenu();
			} else { UI.InteractionHandler.on = false; d.removeEventListener ( 'mouseup', mouseup ); }
			target_el_old = null;
		};

		header.addEventListener ( 'mousemove', mousemove, false );
		header.addEventListener ( 'mousedown', function( e ) {
			if (!UI.InteractionHandler.checkAndSet (_name)) return (false);
			d.removeEventListener ( 'mouseup', mouseup );
			if (target_el) {
				if (!_checkForAct ( e.target || e.srcElement )) target_el_old = target_el;
				else target_el_old = null;
				d.addEventListener ( 'mouseup', mouseup, false );
			} else {
				target_el_old = null;
				d.addEventListener ( 'mouseup', mouseup, false );
				_checkForAct ( e.target || e.srcElement );
			}
		}, false);

		UI.el.appendChild ( header );
	};

	PKAE._deps._makeUITopHeader = _makeUITopHeader;

})( window, document, PKAudioEditor );


