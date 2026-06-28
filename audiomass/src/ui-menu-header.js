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
				else
				{
					btn_container.className = 'pk_menu_el';
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
			UI.KeyHandler.addCallback (_name + 4, function () {
				if (!target_option) { var els = target_el.parentNode.getElementsByClassName ('pk_opt'); if (els[0]) { target_option = els[0]; target_option.classList.add ('pk_act'); } }
				else { var ind = target_option.getAttribute ('data-index')/1; target_option.classList.remove ('pk_act'); target_option = target_el.parentNode.getElementsByClassName ('pk_opt'); target_option = ind - 1 < 0 ? target_option[target_option.length - 1] : target_option[ind - 1]; target_option.classList.add ('pk_act'); }
			}, [38]);
			UI.KeyHandler.addCallback (_name + 5, function () {
				if (!target_option) { var els = target_el.parentNode.getElementsByClassName ('pk_opt'); if (els[0]) { target_option = els[0]; target_option.classList.add ('pk_act'); } }
				else { var ind = target_option.getAttribute ('data-index')/1; target_option.classList.remove ('pk_act'); target_option = target_el.parentNode.getElementsByClassName ('pk_opt'); target_option = target_option.length <= ind + 1 ? target_option[0] : target_option[ind + 1]; target_option.classList.add ('pk_act'); }
			}, [40]);
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
