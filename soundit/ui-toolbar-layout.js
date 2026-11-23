/* ==========================================================================
 * ui-toolbar-layout.js  —  工具列自訂（P1 + P2）
 *
 * P1  面板顯示／隱藏、時間顯示精簡（總長度、滑鼠位置時間可分別關閉）、選取區塊精簡、設定記憶
 * P2  「調整排列」模式：面板（時間／播放列／編輯列／選取）可拖曳換位置，
 *     播放列與編輯列裡的按鈕可拖曳換順序，也可以拖到另一列
 * P3  自訂工具列：從按鈕目錄挑按鈕組成自己的工具列（最多 6 條、每條 24 顆），
 *     在對話框裡新增／改名／刪除／調整按鈕順序；自訂列也能在「調整排列」裡拖曳位置，
 *     列內的按鈕也能拖曳換順序
 *
 * 文字：全部走 lang-*.js（對話框／調整排列用 tbl.*，按鈕名稱 tbl.btn.<id>，選單用 view.tb_*）。
 * 載入位置：放在 ui-toolbar.js 之後、ui.js 之前。
 * 不需要改動 ui-toolbar*.js：本檔會包住 _makeUIToolbar，工具列建好之後才接手。
 * 按鈕事件、快捷鍵、啟用／停用狀態都綁在原本的元素上，這裡只移動元素，不重建。
 *
 * P4  浮動面板：在「調整排列」裡把面板往下拖出工具列區，就變成浮在畫面上，可吸附視窗邊緣；
 *     拖回工具列區或雙擊即可歸位。設定可匯出／匯入 JSON（桌面版才有浮動，手機版固定在工具列內）
 *
 * 對外 API：PKAudioEditor._deps.tbl
 *   .isVis(id) .toggle(id)            id = time | transport | actions | selection
 *   .tmShow('t'|'h') .tmToggle(k) .tmCompact()     t = 總長度，h = 滑鼠位置時間
 *   .selCompact() .selToggle()
 *   .edit(true|false) .isEditing() .reset()
 *   .openDialog() .closeDialog() .get()
 *   .dockAll() .exportFile() .importFile()
 *   .onChange(fn)
 * 設定存在 localStorage 'pk_tbl'（含版本號；不認得的項目會被丟掉，新增的內建按鈕會自動補進去）
 * ========================================================================== */
(function ( w, d, PKAE ) {
	'use strict';

	var KEY = 'pk_tbl';
	var V = 1;
	var PANELS = ['time', 'transport', 'actions', 'selection'];
	var BARS = ['transport', 'actions'];

	/* 按鈕 id → 原本按鈕上的 class（用 class 辨識，所以不用改原本的檔案） */
	var BTN = {
		stop: 'pk_stop', play: 'pk_play', pause: 'pk_pause', loop: 'pk_loop',
		back: 'pk_back_jump', fwd: 'pk_front_jump', start: 'icon-previous2', end: 'icon-next2', rec: 'icon-rec',
		copy: 'icon-files-empty', paste: 'icon-file-text2', cut: 'icon-scissors', silence: 'icon-silence'
	};
	var DEF = {
		transport: ['stop', 'play', 'pause', 'loop', 'back', 'fwd', 'start', 'end', 'rec'],
		actions: ['copy', 'paste', 'cut', 'silence']
	};


	/* ---------- 按鈕目錄（自訂工具列用） ----------
	 * icon：沿用現有圖示 class；face：沒有圖示的用文字／符號
	 * 名稱：寫在 lang-*.js 的 tbl.btn.<id>（新增按鈕時記得補 en 與 zh-TW）
	 * ev：要送的事件（[事件名, 參數…]）；run：需要額外處理的用函式 */
	var CATALOG = [
		{ id: 'play', cat: 'play', icon: 'icon-play3', ev: ['RequestPlay'] },
		{ id: 'stop', cat: 'play', icon: 'icon-stop2', ev: ['RequestStop'] },
		{ id: 'pause', cat: 'play', icon: 'icon-pause2', ev: ['RequestPause'] },
		{ id: 'loop', cat: 'play', icon: 'icon-loop', ev: ['RequestSetLoop'] },
		{ id: 'rec', cat: 'play', icon: 'icon-rec', ev: ['RequestActionRecordToggle'] },
		{ id: 'to_start', cat: 'play', icon: 'icon-previous2', ev: ['RequestSeekTo', 0] },
		{ id: 'to_end', cat: 'play', icon: 'icon-next2', ev: ['RequestSeekTo', 1] },

		{ id: 'undo', cat: 'edit', face: '\u21B6', ev: ['StateRequestUndo'] },
		{ id: 'redo', cat: 'edit', face: '\u21B7', ev: ['StateRequestRedo'] },
		{ id: 'copy', cat: 'edit', icon: 'icon-files-empty', ev: ['RequestActionCopy'] },
		{ id: 'paste', cat: 'edit', icon: 'icon-file-text2', ev: ['RequestActionPaste'] },
		{ id: 'cut', cat: 'edit', icon: 'icon-scissors', ev: ['RequestActionCut', 1] },
		{ id: 'silence', cat: 'edit', icon: 'icon-silence', ev: ['RequestFXUI_Silence'] },
		{ id: 'sel_all', cat: 'edit', face: '\u5168', ev: ['RequestSelect'] },
		{ id: 'sel_none', cat: 'edit', face: '\u2715', ev: ['RequestRegionClear'] },
		{ id: 'sel_vis', cat: 'edit', face: '[ ]', ev: ['RequestRegionSet'] },
		{ id: 'deselect', cat: 'edit', face: '\u2205', ev: ['RequestDeselect'] },
		{ id: 'zero_cross', cat: 'edit', face: '0\u00D7', ev: ['RequestSnapSelDrag'] },

		{ id: 'gain', cat: 'fx', face: 'dB', ev: ['RequestFXUI_Gain'] },
		{ id: 'fade_in', cat: 'fx', face: '\u25E2', ev: ['RequestActionFX_FadeIn'] },
		{ id: 'fade_out', cat: 'fx', face: '\u25E3', ev: ['RequestActionFX_FadeOut'] },
		{ id: 'normalize', cat: 'fx', face: 'N', ev: ['RequestActionFXUI_Normalize'] },
		{ id: 'noise', cat: 'fx', face: 'NR', ev: ['RequestActionFX_NoiseRNN'] },
		{ id: 'reverse', cat: 'fx', face: '\u21C4', ev: ['RequestActionFX_Reverse'] },
		{ id: 'invert', cat: 'fx', face: '\u00B1', ev: ['RequestActionFX_Invert'] },
		{ id: 'rem_sil', cat: 'fx', face: 'RS', ev: ['RequestActionFX_RemSil'] },
		{ id: 'seamless', cat: 'fx', face: '\u221E', ev: ['RequestActionFXUI_SeamlessLoop'] },
		{ id: 'para_eq', cat: 'fx', face: 'PEQ', ev: ['RequestActionFXUI_ParaGraphicEQ'] },
		{ id: 'graph_eq', cat: 'fx', face: 'GEQ', ev: ['RequestActionFXUI_GraphicEQ', 10] },
		{ id: 'graph_eq_20', cat: 'fx', face: 'G20', ev: ['RequestActionFXUI_GraphicEQ', 20] },
		{ id: 'compressor', cat: 'fx', face: 'CMP', ev: ['RequestActionFXUI_Compressor'] },
		{ id: 'hard_limiter', cat: 'fx', face: 'LIM', ev: ['RequestActionFXUI_HardLimiter'] },
		{ id: 'delay', cat: 'fx', face: 'DLY', ev: ['RequestActionFXUI_Delay'] },
		{ id: 'distortion', cat: 'fx', face: 'DST', ev: ['RequestActionFXUI_Distortion'] },
		{ id: 'reverb', cat: 'fx', face: 'REV', ev: ['RequestActionFXUI_Reverb'] },
		{ id: 'repair', cat: 'fx', face: 'FIX', ev: ['RequestActionFXUI_Repair'] },
		{ id: 'speed_pitch', cat: 'fx', face: 'SPD', ev: ['RequestActionFXUI_Speed'] },
		{ id: 'speed_rate', cat: 'fx', face: 'RAT', ev: ['RequestActionFXUI_Rate'] },

		{ id: 'zoom_in', cat: 'view', face: '\uFF0B', ev: ['RequestZoomUI', 'h', -1] },
		{ id: 'zoom_out', cat: 'view', face: '\uFF0D', ev: ['RequestZoomUI', 'h', 1] },
		{ id: 'zoom_reset', cat: 'view', face: '1:1', ev: ['RequestZoomUI', 0] },
		{ id: 'center', cat: 'view', face: '\u2299', ev: ['RequestViewCenterToCursor'] },
		{ id: 'follow', cat: 'view', face: 'FOL', ev: ['RequestViewFollowCursorToggle'] },
		{ id: 'peak_sep', cat: 'view', face: '|||', ev: ['RequestViewPeakSeparatorToggle'] },
		{ id: 'timeline', cat: 'view', face: 'TL', ev: ['RequestViewTimelineToggle'] },
		{ id: 'freq', cat: 'view', face: 'EQ', ev: ['RequestShowFreqAn', 'eq', [1]] },
		{ id: 'spec', cat: 'view', face: 'SP', ev: ['RequestShowFreqAn', 'sp', [1]] },
		{ id: 'mixer', cat: 'view', face: 'MX', run: function ( app ) {
			var mt = app.multitrack;
			if (mt && mt.IsOn && !mt.IsOn ()) mt.Toggle ( true );
			app.fireEvent ('RequestMixerToggle');
		} },
		{ id: 'mt_switch', cat: 'view', face: 'MT', ev: ['RequestMultitrackSwitch'] },
		{ id: 'markers', cat: 'view', face: '\u2691', run: function ( app ) {
			var P = app._deps.mrkpanel;
			P && P.toggle ();
		} },
		{ id: 'tempo', cat: 'view', face: '\u266A', ev: ['RequestActionTempo'] },
		{ id: 'id3', cat: 'view', face: 'ID3', ev: ['RequestActionID3'] }
	];
	var CAT = {};
	CATALOG.forEach ( function ( c ) { CAT[ c.id ] = c; });
	var MAXBARS = 6, MAXITEMS = 24;

	function cname ( c ) { return lt ( 'tbl.btn.' + c.id ); }

	/* 文字全部走 lang-*.js（key 前綴 tbl.）；缺字時 PKLocale 會依序回退 zh-TW → en，最後才回傳 key 本身 */
	function lt ( key, vars ) {
		try { return PKLocale.t ( key, vars ); } catch (e) { return key; }
	}

	/* ---------- 設定 ---------- */

	function defaults () {
		return {
			v: V,
			order: PANELS.slice (),
			hide: {},
			bars: { transport: DEF.transport.slice (), actions: DEF.actions.slice () },
			tm: { t: 1, h: 1 },
			selc: 0,
			custom: [],
			float: {}
		};
	}

	function clean ( o ) {
		var s = defaults (), i, seen;
		if (!o || typeof o !== 'object') return s;

		/* 自訂工具列：id 必須是 c1、c2…，按鈕必須在目錄裡 */
		var cids = [];
		if (Array.isArray (o.custom)) o.custom.slice ( 0, MAXBARS ).forEach ( function ( c ) {
			if (!c || typeof c.id !== 'string' || !/^c\d+$/.test ( c.id ) || cids.indexOf ( c.id ) > -1) return ;
			var items = (Array.isArray ( c.items ) ? c.items : []).filter ( function ( k ) { return CAT[ k ]; }).slice ( 0, MAXITEMS );
			s.custom.push ({ id: c.id, name: String ( c.name || '' ).replace ( /^\s+|\s+$/g, '' ).slice ( 0, 24 ) || lt ('tbl.default_name'), items: items });
			cids.push ( c.id );
		});
		var ids = PANELS.concat ( cids );

		if (Array.isArray (o.order)) {
			var ord = []; seen = {};
			o.order.forEach ( function ( id ) { if (ids.indexOf ( id ) > -1 && !seen[ id ]) { seen[ id ] = 1; ord.push ( id ); } });
			ids.forEach ( function ( id ) { if (!seen[ id ]) ord.push ( id ); });
			s.order = ord;
		} else s.order = ids.slice ();
		if (o.hide && typeof o.hide === 'object') ids.forEach ( function ( id ) { if (o.hide[ id ]) s.hide[ id ] = 1; });

		if (o.bars && typeof o.bars === 'object') {
			var nb = { transport: [], actions: [] }; seen = {};
			BARS.forEach ( function ( b ) {
				(Array.isArray ( o.bars[ b ] ) ? o.bars[ b ] : []).forEach ( function ( id ) {
					if (BTN[ id ] && !seen[ id ]) { seen[ id ] = 1; nb[ b ].push ( id ); }
				});
			});
			/* 新版新增、舊設定沒有的按鈕：補回預設的那一列 */
			BARS.forEach ( function ( b ) {
				DEF[ b ].forEach ( function ( id ) { if (!seen[ id ]) { seen[ id ] = 1; nb[ b ].push ( id ); } });
			});
			s.bars = nb;
		}
		if (o.tm && typeof o.tm === 'object') { s.tm.t = o.tm.t === 0 ? 0 : 1; s.tm.h = o.tm.h === 0 ? 0 : 1; }
		s.selc = o.selc ? 1 : 0;
		/* 浮動位置：以視窗可移動範圍的比例（0~1）記錄，視窗縮放時才不會跑到畫面外 */
		if (o.float && typeof o.float === 'object') ids.forEach ( function ( id ) {
			var f = o.float[ id ];
			if (f && isFinite ( f.x ) && isFinite ( f.y )) s.float[ id ] = { x: Math.max ( 0, Math.min ( 1, +f.x ) ), y: Math.max ( 0, Math.min ( 1, +f.y ) ) };
		});
		return s;
	}

	function load () {
		try { return clean ( JSON.parse ( w.localStorage.getItem ( KEY ) || 'null' ) ); } catch (e) { return clean (); }
	}

	var S = load ();
	function save () { try { w.localStorage.setItem ( KEY, JSON.stringify ( S ) ); } catch (e) {} }

	/* ---------- 狀態 ---------- */

	var UI = null, tb = null, group = null;
	var els = {}, btns = {};
	var editing = false, pill = null, drag = null, rz = 0, dlg = null, dlgSel = null, dlgQ = '';
	var cfm = null, cfmGuard = 0;	/* 確認視窗：目前開著的那一個；關閉當下的保護旗標（避免同一次 Esc 連帶關掉後面的對話框） */
	var ACT = { play: 0, loop: 0, rec: 0 };
	var listeners = [];

	function notify () { listeners.forEach ( function ( fn ) { try { fn (); } catch (e) {} }); }

	function queueResize () {
		if (rz || !UI) return ;
		rz = w.requestAnimationFrame ( function () { rz = 0; UI.fireEvent ('RequestResize'); });
	}

	function changed () { save (); apply (); notify (); queueResize (); }

	/* 讓 parent 的子元素依 nodes 的順序排好（只在順序不同時才動 DOM） */
	function place ( parent, nodes ) {
		for (var i = 0; i < nodes.length; ++i) {
			if (parent.children[ i ] !== nodes[ i ]) parent.insertBefore ( nodes[ i ], parent.children[ i ] || null );
		}
	}

	function shown ( el ) { return !!(el && el.offsetWidth > 0); }


	function panelIds () { return PANELS.concat ( S.custom.map ( function ( c ) { return c.id; }) ); }
	function isMob () { return !!(UI && UI.el && UI.el.classList.contains ('pk_mob')); }
	function isFloat ( id ) { return !!(S.float[ id ] && !isMob ()); }

	/* 把浮動面板放到記錄的位置（桌面版才有；不是浮動的就清掉位置） */
	function posFloat ( id ) {
		var el = els[ id ];
		if (!el) return ;
		if (!isFloat ( id )) { el.classList.remove ('pk_tbl_float'); el.style.left = el.style.top = ''; return ; }
		el.classList.add ('pk_tbl_float');
		var f = S.float[ id ];
		el.style.left = Math.round ( f.x * Math.max ( 0, w.innerWidth - el.offsetWidth ) ) + 'px';
		el.style.top = Math.round ( f.y * Math.max ( 0, w.innerHeight - el.offsetHeight ) ) + 'px';
	}

	function customOf ( id ) {
		for (var i = 0; i < S.custom.length; ++i) if (S.custom[ i ].id === id) return S.custom[ i ];
		return null;
	}

	function runCat ( c ) {
		if (c.run) c.run ( PKAE );
		else if (c.ev) UI.fireEvent.apply ( UI, c.ev );
	}

	function makeBtn ( k, cid, idx ) {
		var c = CAT[ k ], b = d.createElement ('button');
		b.setAttribute ('tabIndex', -1);
		b.className = 'pk_btn ' + (c.icon || 'pk_tbl_txt') + (ACT[ k ] ? ' pk_act' : '');
		if (!c.icon) b.setAttribute ('data-face', c.face);
		b.setAttribute ('data-cb', k);
		b.__cbar = cid; b.__cidx = idx;
		b.innerHTML = '<span></span>';
		b.firstChild.textContent = cname ( c );
		b.onclick = function () { runCat ( c ); this.blur (); };
		return b;
	}

	/* 讓畫面上的自訂列和設定一致：建立、更新、移除 */
	function syncCustom () {
		var live = {};
		S.custom.forEach ( function ( c ) {
			live[ c.id ] = 1;
			var el = els[ c.id ];
			if (!el) {
				el = els[ c.id ] = d.createElement ('div');
				el.className = 'pk_ctns pk_tbl_custom';
				el.setAttribute ('data-tbp', c.id);
				el.__custom = 1;
			}
			var sig = c.name + '|' + c.items.join ();
			if (el.__sig !== sig) {
				el.__sig = sig;
				el.setAttribute ('aria-label', c.name);
				while (el.firstChild) el.removeChild ( el.firstChild );
				c.items.forEach ( function ( k, i ) { el.appendChild ( makeBtn ( k, c.id, i ) ); });
			}
			el.classList.toggle ('pk_tbl_empty', !c.items.length);
		});
		Object.keys ( els ).forEach ( function ( id ) {
			if (els[ id ].__custom && !live[ id ]) {
				els[ id ].parentNode && els[ id ].parentNode.removeChild ( els[ id ] );
				delete els[ id ];
			}
		});
	}

	function setAct ( k, v ) {
		ACT[ k ] = v ? 1 : 0;
		if (!tb) return ;
		var n = tb.querySelectorAll ('[data-cb="' + k + '"]');
		for (var i = 0; i < n.length; ++i) n[ i ].classList.toggle ('pk_act', !!v);
	}

	/* ---------- 套用到畫面 ---------- */

	function render () {
		if (!tb) return ;

		/* 1. 按鈕列：已登記的按鈕依設定排序，沒登記的（別的模組塞進來的）放最後 */
		BARS.forEach ( function ( b ) {
			var bar = els[ b ], nodes = [], extra = [], i;
			S.bars[ b ].forEach ( function ( id ) { if (btns[ id ]) nodes.push ( btns[ id ] ); });
			for (i = 0; i < bar.children.length; ++i) if (!bar.children[ i ].__tbid) extra.push ( bar.children[ i ] );
			place ( bar, nodes.concat ( extra ) );
			bar.classList.toggle ('pk_tbl_empty', !nodes.length && !extra.length);
		});

		/* 2. 面板：播放列與編輯列相鄰時，維持原本放在 .pk_btngroup 裡（保留原本窄螢幕的上下兩排） */
		var seq = [], o = S.order.filter ( function ( id ) { return els[ id ] && !isFloat ( id ); }), i;
		for (i = 0; i < o.length; ++i) {
			var a = o[ i ], n = o[ i + 1 ];
			if ((a === 'transport' && n === 'actions') || (a === 'actions' && n === 'transport')) {
				place ( group, [ els[ a ], els[ n ] ] );
				seq.push ( group );
				++i;
			} else seq.push ( els[ a ] );
		}
		S.order.forEach ( function ( id ) { if (els[ id ] && isFloat ( id )) seq.push ( els[ id ] ); });	/* 浮動的面板仍留在工具列容器裡，只是脫離排版 */
		var known = [ group ], extra2 = [];
		Object.keys ( els ).forEach ( function ( k ) { known.push ( els[ k ] ); });
		for (i = 0; i < tb.children.length; ++i) if (known.indexOf ( tb.children[ i ] ) < 0) extra2.push ( tb.children[ i ] );	/* 例如多軌的節拍列 */
		place ( tb, seq.concat ( extra2 ) );
		if (seq.indexOf ( group ) < 0 && group.parentNode) group.parentNode.removeChild ( group );

		/* 3. 顯示／隱藏 */
		panelIds ().forEach ( function ( id ) { els[ id ] && els[ id ].classList.toggle ('pk_tbl_off', !!S.hide[ id ]); });
		panelIds ().forEach ( posFloat );
	}

	function apply () {
		if (!tb) return ;
		syncCustom ();
		render ();
		els.time.classList.toggle ('pk_tm_nt', S.tm.t === 0);
		els.time.classList.toggle ('pk_tm_nh', S.tm.h === 0);
		els.selection.classList.toggle ('pk_sel_c', !!S.selc);
	}

	/* ---------- 調整排列模式 ---------- */

	function placePill () {
		if (!pill || !tb) return ;
		var r = (tb.parentNode || tb).getBoundingClientRect ();
		pill.style.top = ((r.bottom + 6) >> 0) + 'px';
	}

	function enterEdit () {
		if (!tb || editing) return ;
		editing = true;
		tb.classList.add ('pk_tbl_edit');
		d.body.classList.add ('pk_tbl_editing');

		pill = d.createElement ('div');
		pill.className = 'pk_tbl_pill';
		pill.innerHTML = '<span></span><button type="button" data-a="reset"></button><button type="button" data-a="done"></button>';
		pill.children[0].textContent = lt ('tbl.edit_hint');
		pill.children[1].textContent = lt ('tbl.reset');
		pill.children[2].textContent = lt ('tbl.done');
		pill.onclick = function ( e ) {
			var a = e.target.getAttribute && e.target.getAttribute ('data-a');
			if (a === 'done') exitEdit ();
			else if (a === 'reset') T.reset ();
		};
		UI.el.appendChild ( pill );
		placePill ();
		render ();
		notify ();
		queueResize ();
	}

	function exitEdit () {
		if (!editing) return ;
		editing = false; drag = null;
		tb.classList.remove ('pk_tbl_edit');
		d.body.classList.remove ('pk_tbl_editing');
		pill && pill.parentNode && pill.parentNode.removeChild ( pill );
		pill = null;
		render ();
		notify ();
		queueResize ();
	}

	function isStacked () {
		if (!shown ( els.transport ) || !shown ( els.actions )) return false;
		return Math.abs ( els.transport.getBoundingClientRect ().top - els.actions.getBoundingClientRect ().top ) > 10;
	}

	/* 指標位置在這個面板「之後」嗎？ */
	function isBefore ( id, x, y, stacked ) {
		var r = els[ id ].getBoundingClientRect ();
		if (x > r.right) return true;
		if (x < r.left) return false;
		if (stacked && (id === 'transport' || id === 'actions')) return y > r.top + r.height / 2;
		return x > r.left + r.width / 2;
	}

	function dragPanel ( x, y ) {
		var id = drag.id, rest = S.order.filter ( function ( p ) { return p !== id; });
		var stacked = isStacked (), at = rest.length, i;
		for (i = 0; i < rest.length; ++i) {
			if (S.hide[ rest[ i ] ] || !shown ( els[ rest[ i ] ] )) continue;
			if (!isBefore ( rest[ i ], x, y, stacked )) { at = i; break; }
		}
		var next = rest.slice ();
		next.splice ( at, 0, id );
		if (next.join () !== S.order.join ()) { S.order = next; render (); }
	}

	function dragButton ( x, y ) {
		var tgt = null, best = 1e9;
		BARS.forEach ( function ( b ) {
			var el = els[ b ];
			if (!shown ( el )) return ;
			var r = el.getBoundingClientRect ();
			if (x < r.left - 8 || x > r.right + 8) return ;
			var dy = y < r.top ? r.top - y : (y > r.bottom ? y - r.bottom : 0);
			if (dy < best && dy <= 14) { best = dy; tgt = b; }
		});
		if (!tgt) return ;

		var id = drag.id, nb = { transport: [], actions: [] };
		BARS.forEach ( function ( b ) { nb[ b ] = S.bars[ b ].filter ( function ( k ) { return k !== id; }); });
		var list = nb[ tgt ], at = list.length, i;
		for (i = 0; i < list.length; ++i) {
			var el = btns[ list[ i ] ];
			if (!el) continue;
			var r = el.getBoundingClientRect ();
			if (x < r.left + r.width / 2) { at = i; break; }
		}
		list.splice ( at, 0, id );
		if (JSON.stringify ( nb ) !== JSON.stringify ( S.bars )) { S.bars = nb; render (); }
	}



	/* 面板拖曳：在工具列區內換位置；往下拖出工具列區就變成浮動，拖回來就歸位 */
	function movePanel ( x, y ) {
		var id = drag.id, el = els[ id ];
		var r = (tb.parentNode || tb).getBoundingClientRect ();
		if (isMob () || y <= r.bottom + 14) {
			if (S.float[ id ]) { delete S.float[ id ]; render (); }
			dragPanel ( x, y );
			return ;
		}
		var W = w.innerWidth, H = w.innerHeight;
		if (!S.float[ id ]) { S.float[ id ] = { x: 0, y: 0 }; render (); }
		var ew = el.offsetWidth, eh = el.offsetHeight, left = x - drag.ox, top = y - drag.oy, T = 10;
		/* 吸附：視窗左右下邊緣，以及工具列正下方 */
		if (left < T) left = 0;
		if (left + ew > W - T) left = W - ew;
		if (top + eh > H - T) top = H - eh;
		if (Math.abs ( top - (r.bottom + 4) ) < T) top = r.bottom + 4;
		left = Math.max ( 0, Math.min ( W - ew, left ) );
		top = Math.max ( 0, Math.min ( H - eh, top ) );
		S.float[ id ] = {
			x: W > ew ? Math.round ( left / (W - ew) * 10000 ) / 10000 : 0,
			y: H > eh ? Math.round ( top / (H - eh) * 10000 ) / 10000 : 0
		};
		posFloat ( id );
	}

	/* 自訂列裡的按鈕：只能在自己這一列內換順序 */
	function dragCustom ( x ) {
		var c = customOf ( drag.bar ), bar = els[ drag.bar ];
		if (!c || !bar) return ;
		var items = c.items.slice (), it = items.splice ( drag.idx, 1 )[0], at = items.length, i;
		for (i = 0; i < items.length; ++i) {
			var b = bar.children[ i < drag.idx ? i : i + 1 ];
			if (!b) continue;
			var r = b.getBoundingClientRect ();
			if (x < r.left + r.width / 2) { at = i; break; }
		}
		if (at === drag.idx) return ;
		items.splice ( at, 0, it );
		c.items = items;
		drag.idx = at;
		syncCustom ();
		drag.el = els[ drag.bar ].children[ at ];
		drag.el.classList.add ('pk_tbl_drag');
	}

	function onDown ( e ) {
		if (!editing || (e.button !== undefined && e.button !== 0)) return ;
		var t = e.target, btn = null, pan = null, cb = null;
		while (t && t !== tb) {
			if (!btn && t.__tbid) btn = t;
			if (!cb && t.__cbar) cb = t;
			if (t.getAttribute && t.getAttribute ('data-tbp')) { pan = t; break; }
			t = t.parentNode;
		}
		if (!btn && !pan && !cb) return ;
		e.preventDefault ();
		drag = { x: e.clientX, y: e.clientY, btn: btn, cb: cb, el: cb || btn || pan, id: btn ? btn.__tbid : (pan ? pan.getAttribute ('data-tbp') : ''), moved: false, pid: e.pointerId };
		if (cb) { drag.bar = cb.__cbar; drag.idx = cb.__cidx; }
		if (pan && !btn && !cb) { var pr = pan.getBoundingClientRect (); drag.ox = e.clientX - pr.left; drag.oy = e.clientY - pr.top; }
		try { tb.setPointerCapture ( e.pointerId ); } catch (er) {}
	}

	function onMove ( e ) {
		if (!drag || e.pointerId !== drag.pid) return ;
		if (!drag.moved) {
			if (Math.abs ( e.clientX - drag.x ) + Math.abs ( e.clientY - drag.y ) < 5) return ;
			drag.moved = true;
			drag.el.classList.add ('pk_tbl_drag');
		}
		e.preventDefault ();
		if (drag.cb) dragCustom ( e.clientX );
		else if (drag.btn) dragButton ( e.clientX, e.clientY );
		else movePanel ( e.clientX, e.clientY );
	}

	function onUp ( e ) {
		if (!drag || e.pointerId !== drag.pid) return ;
		var moved = drag.moved;
		drag.el.classList.remove ('pk_tbl_drag');
		try { tb.releasePointerCapture ( drag.pid ); } catch (er) {}
		drag = null;
		if (moved) changed ();
	}

	/* 編輯模式下，工具列上的點擊／按下一律擋掉，避免真的觸發播放、停止、剪下等動作 */
	function block ( e ) {
		if (!editing) return ;
		if (e.type === 'dblclick') {
			var t = e.target, id;
			while (t && t !== tb) {
				id = t.getAttribute && t.getAttribute ('data-tbp');
				if (id) { if (S.float[ id ]) { delete S.float[ id ]; changed (); } break; }
				t = t.parentNode;
			}
		}
		e.stopPropagation ();
		if (e.cancelable) e.preventDefault ();
	}

	/* ---------- 接上工具列 ---------- */

	function attach ( ui ) {
		UI = ui;
		tb = UI.el.getElementsByClassName ('pk_tb')[0];
		if (!tb) return ;
		els.time = tb.getElementsByClassName ('pk_timecontainer')[0];
		els.transport = tb.getElementsByClassName ('pk_transport')[0];
		els.actions = tb.getElementsByClassName ('pk_ctns')[0];
		els.selection = tb.getElementsByClassName ('pk_selection')[0];
		group = tb.getElementsByClassName ('pk_btngroup')[0];
		if (!els.time || !els.transport || !els.actions || !els.selection || !group) { tb = null; return ; }

		PANELS.forEach ( function ( id ) { els[ id ].setAttribute ('data-tbp', id); });
		els.time.__builtin = els.transport.__builtin = els.actions.__builtin = els.selection.__builtin = 1;
		BARS.forEach ( function ( b ) {
			for (var i = 0; i < els[ b ].children.length; ++i) {
				var c = els[ b ].children[ i ];
				for (var id in BTN) if (BTN.hasOwnProperty ( id ) && c.classList.contains ( BTN[ id ] )) { c.__tbid = id; btns[ id ] = c; break; }
			}
		});

		tb.classList.add ('pk_tbl');
		['click', 'dblclick', 'mousedown', 'mouseup', 'contextmenu'].forEach ( function ( ev ) { tb.addEventListener ( ev, block, true ); });
		tb.addEventListener ('pointerdown', onDown, false);
		tb.addEventListener ('pointermove', onMove, false);
		tb.addEventListener ('pointerup', onUp, false);
		tb.addEventListener ('pointercancel', onUp, false);
		w.addEventListener ('resize', function () { placePill (); panelIds ().forEach ( posFloat ); }, false);

		try { UI.KeyHandler.addCallback ('KeyTbEdit', function () { if (cfm || cfmGuard) return ; if (dlg) closeDlg (); else if (editing) exitEdit (); }, [27]); } catch (e) {}

		/* 自訂列裡的播放／循環／錄音按鈕跟著狀態亮起 */
		UI.listenFor ('DidPlay', function () { setAct ('play', 1); });
		UI.listenFor ('DidStopPlay', function () { setAct ('play', 0); });
		UI.listenFor ('DidSetLoop', function ( v ) { setAct ('loop', v); });
		UI.listenFor ('DidActionRecordStart', function () { setAct ('rec', 1); });
		UI.listenFor ('DidActionRecordStop', function () { setAct ('rec', 0); });

		apply ();
		notify ();
	}


	/* ---------- 自訂工具列對話框 ---------- */

	function el ( tag, cls, txt ) {
		var n = d.createElement ( tag );
		if (cls) n.className = cls;
		if (txt !== undefined) n.textContent = txt;
		return n;
	}

	function face ( c ) {
		var i = el ('i', 'pk_tbl_face ' + (c.icon || ''));
		if (!c.icon) i.textContent = c.face;
		return i;
	}

	/* ---------- 確認視窗 ----------
	 * 取代瀏覽器原生的 confirm()：用 App 自己的 PKSimpleModal（和「讀取網址」同一套外觀）。
	 * - 圖層 60，會蓋過自訂工具列對話框（z-index 40）
	 * - Esc 取消、Enter 確認（長按不重複觸發）；關閉當下的 Esc 不會連帶關掉後面的對話框
	 * - 訊息用 textContent，工具列名稱是使用者輸入的，不能當 HTML
	 * - 找不到 PKSimpleModal 時退回原生 confirm() */
	function confirmDlg ( title, msg, okLabel, onOk ) {
		if (cfm) return ;
		if (!w.PKSimpleModal) { if (w.confirm ( msg )) onOk (); return ; }

		var ih = UI.InteractionHandler, kh = UI.KeyHandler, closed = 0;

		function done () {
			if (closed) return ;
			closed = 1;
			try { kh.removeCallback ('KeyTbCfmEsc'); kh.removeCallback ('KeyTbCfmEnter'); } catch (e) {}
			ih.forceUnset ('tblcfm');
			cfm = null;
			cfmGuard = 1;
			setTimeout ( function () { cfmGuard = 0; }, 0 );
		}

		cfm = new w.PKSimpleModal ({
			title: title,
			clss: 'pk_tbl_cfm',
			buttons: [{ title: okLabel, clss: 'pk_modal_a_accpt', callback: function ( q ) { q.Destroy (); onOk (); } }],
			ondestroy: done,
			setup: function ( q ) {
				q.el_body.textContent = msg;
				ih.forceSet ('tblcfm');
				kh.addCallback ('KeyTbCfmEsc', function () { q.Destroy (); }, [27]);
				kh.addCallback ('KeyTbCfmEnter', function ( k, map, e ) {
					if (e && e.repeat) return ;
					q.els && q.els.bottom[0] && q.els.bottom[0].click ();
				}, [13]);
			}
		});
		cfm.el_back.style.zIndex = 60;
		cfm.Show ();
	}

	function closeDlg () {
		if (!dlg) return ;
		dlg.parentNode && dlg.parentNode.removeChild ( dlg );
		dlg = null;
		var ih = UI.InteractionHandler;
		if (ih.by === 'tbl') { ih.on = false; ih.by = null; }
	}

	function nextId () {
		var n = 0;
		S.custom.forEach ( function ( c ) { n = Math.max ( n, parseInt ( c.id.slice ( 1 ), 10 ) || 0 ); });
		return 'c' + (n + 1);
	}

	function renderDlg () {
		if (!dlg) return ;
		var box = dlg.firstChild, hadQ = d.activeElement && d.activeElement.className === 'pk_tbl_q';
		while (box.firstChild) box.removeChild ( box.firstChild );
		var cur = customOf ( dlgSel ), i;

		box.appendChild ( el ('h3', '', lt ('tbl.title')) );

		/* 工具列選單 + 新增／刪除 */
		var row = el ('div', 'pk_tbl_row');
		var sel = el ('select', 'pk_tbl_sel');
		sel.setAttribute ('aria-label', lt ('tbl.select'));
		S.custom.forEach ( function ( c ) {
			var o = el ('option', '', c.name);
			o.value = c.id;
			if (c.id === dlgSel) o.selected = true;
			sel.appendChild ( o );
		});
		sel.onchange = function () { dlgSel = sel.value; renderDlg (); };
		if (S.custom.length) row.appendChild ( sel );
		var add = el ('button', 'pk_tbl_b', lt ('tbl.new'));
		add.type = 'button';
		add.disabled = S.custom.length >= MAXBARS;
		add.onclick = function () {
			var id = nextId ();
			S.custom.push ({ id: id, name: lt ('tbl.default_name') + ' ' + id.slice ( 1 ), items: [] });
			S.order.push ( id );
			dlgSel = id;
			changed (); renderDlg ();
		};
		row.appendChild ( add );
		if (cur) {
			var del = el ('button', 'pk_tbl_b', lt ('tbl.delete'));
			del.type = 'button';
			del.onclick = function () {
				confirmDlg ( lt ('tbl.delete_title'), lt ('tbl.confirm_delete', { name: cur.name }), lt ('tbl.delete'), function () {
					S.custom = S.custom.filter ( function ( c ) { return c.id !== cur.id; });
					S.order = S.order.filter ( function ( id ) { return id !== cur.id; });
					delete S.hide[ cur.id ];
					dlgSel = S.custom.length ? S.custom[0].id : null;
					changed (); renderDlg ();
				});
			};
			row.appendChild ( del );
		}
		box.appendChild ( row );

		if (!cur) {
			box.appendChild ( el ('p', 'pk_tbl_hint', lt ('tbl.none_hint')) );
		} else {
			/* 名稱、顯示 */
			var r2 = el ('div', 'pk_tbl_row');
			var lb = el ('label', '', lt ('tbl.name') + ' ');
			var inp = el ('input');
			inp.type = 'text'; inp.maxLength = 24; inp.value = cur.name;
			inp.onkeydown = function ( ev ) { ev.stopPropagation (); if (ev.keyCode === 13) inp.blur (); if (ev.keyCode === 27) closeDlg (); };
			inp.onchange = function () {
				cur.name = inp.value.replace ( /^\s+|\s+$/g, '' ).slice ( 0, 24 ) || cur.name;
				changed (); renderDlg ();
			};
			lb.appendChild ( inp );
			r2.appendChild ( lb );
			var lv = el ('label', '');
			var cb = el ('input');
			cb.type = 'checkbox'; cb.checked = !S.hide[ cur.id ];
			cb.onchange = function () { if (cb.checked) delete S.hide[ cur.id ]; else S.hide[ cur.id ] = 1; changed (); };
			lv.appendChild ( cb );
			lv.appendChild ( d.createTextNode ( ' ' + lt ('tbl.show') ) );
			r2.appendChild ( lv );
			box.appendChild ( r2 );

			var cols = el ('div', 'pk_tbl_cols');

			/* 左：按鈕目錄 */
			var left = el ('div', 'pk_tbl_col');
			left.appendChild ( el ('div', 'pk_tbl_ct', lt ('tbl.catalog')) );
			var q = el ('input', 'pk_tbl_q');
			q.type = 'text'; q.placeholder = lt ('tbl.search'); q.value = dlgQ;
			q.onkeydown = function ( ev ) { ev.stopPropagation (); if (ev.keyCode === 27) closeDlg (); };
			left.appendChild ( q );
			var list = el ('div', 'pk_tbl_list');
			function fill () {
				while (list.firstChild) list.removeChild ( list.firstChild );
				var term = dlgQ.toLowerCase (), lastCat = '';
				CATALOG.forEach ( function ( c ) {
					var nm = cname ( c );
					if (term && (nm + ' ' + c.id + ' ' + (c.face || '')).toLowerCase ().indexOf ( term ) < 0) return ;
					if (c.cat !== lastCat) { lastCat = c.cat; list.appendChild ( el ('div', 'pk_tbl_cat', lt ( 'tbl.cat.' + c.cat )) ); }
					var b = el ('button', 'pk_tbl_it');
					b.type = 'button';
					b.appendChild ( face ( c ) );
					b.appendChild ( el ('span', '', nm) );
					b.disabled = cur.items.length >= MAXITEMS;
					b.onclick = function () { cur.items.push ( c.id ); changed (); renderDlg (); };
					list.appendChild ( b );
				});
			}
			q.oninput = function () { dlgQ = q.value; fill (); };
			fill ();
			left.appendChild ( list );
			cols.appendChild ( left );

			/* 右：這條工具列目前的按鈕 */
			var right = el ('div', 'pk_tbl_col');
			right.appendChild ( el ('div', 'pk_tbl_ct', lt ('tbl.current')) );
			var cl = el ('div', 'pk_tbl_list');
			if (!cur.items.length) cl.appendChild ( el ('p', 'pk_tbl_hint', lt ('tbl.pick_hint')) );
			cur.items.forEach ( function ( k, idx ) {
				var c = CAT[ k ], r = el ('div', 'pk_tbl_cr');
				r.appendChild ( face ( c ) );
				r.appendChild ( el ('span', '', cname ( c )) );
				function mk ( txt, lab, dis, fn ) {
					var b = el ('button', 'pk_tbl_mini', txt);
					b.type = 'button'; b.disabled = dis;
					b.setAttribute ('aria-label', lab + ' ' + cname ( c ));
					b.onclick = fn;
					r.appendChild ( b );
				}
				mk ('\u2191', lt ('tbl.up'), idx === 0, function () { cur.items.splice ( idx - 1, 0, cur.items.splice ( idx, 1 )[0] ); changed (); renderDlg (); });
				mk ('\u2193', lt ('tbl.down'), idx === cur.items.length - 1, function () { cur.items.splice ( idx + 1, 0, cur.items.splice ( idx, 1 )[0] ); changed (); renderDlg (); });
				mk ('\u2715', lt ('tbl.remove'), false, function () { cur.items.splice ( idx, 1 ); changed (); renderDlg (); });
				cl.appendChild ( r );
			});
			right.appendChild ( cl );
			cols.appendChild ( right );
			box.appendChild ( cols );
			if (hadQ) q.focus ();
		}

		var ft = el ('div', 'pk_tbl_ft');
		var ok = el ('button', 'pk_tbl_b pk_tbl_ok', lt ('tbl.done'));
		ok.type = 'button';
		ok.onclick = closeDlg;
		ft.appendChild ( ok );
		box.appendChild ( ft );
	}

	function openDlg () {
		if (!tb || dlg) return ;
		if (editing) exitEdit ();
		if (!UI.InteractionHandler.checkAndSet ('tbl')) return ;
		dlgSel = S.custom.length ? S.custom[0].id : null;
		dlgQ = '';
		dlg = el ('div', 'pk_tbl_dlg');
		dlg.onmousedown = function ( e ) { if (e.target === dlg) closeDlg (); };
		var box = el ('div', 'pk_tbl_box');
		box.setAttribute ('role', 'dialog');
		box.setAttribute ('aria-modal', 'true');
		dlg.appendChild ( box );
		d.body.appendChild ( dlg );
		renderDlg ();
		var f = dlg.querySelector ('button, select');
		f && f.focus ();
	}

	/* ---------- 對外 ---------- */

	var T = {
		isVis: function ( id ) { return !S.hide[ id ]; },
		toggle: function ( id ) {
			if (panelIds ().indexOf ( id ) < 0) return ;
			if (S.hide[ id ]) delete S.hide[ id ]; else S.hide[ id ] = 1;
			changed ();
		},
		tmShow: function ( k ) { return S.tm[ k ] !== 0; },
		tmToggle: function ( k ) { if (k !== 't' && k !== 'h') return ; S.tm[ k ] = S.tm[ k ] === 0 ? 1 : 0; changed (); },
		tmCompact: function () { S.tm.t = 0; S.tm.h = 0; changed (); },
		selCompact: function () { return !!S.selc; },
		selToggle: function () { S.selc = S.selc ? 0 : 1; changed (); },
		edit: function ( on ) { if (on === false) exitEdit (); else enterEdit (); },
		isEditing: function () { return editing; },
		reset: function () {
			function go () {
				if (dlg) closeDlg ();
				S = defaults ();
				changed ();
			}
			if (S.custom.length) confirmDlg ( lt ('view.tb_reset'), lt ('tbl.confirm_reset'), lt ('tbl.reset'), go );
			else go ();
		},
		dockAll: function () { S.float = {}; changed (); },
		exportFile: function () {
			try {
				var a = d.createElement ('a');
				a.href = w.URL.createObjectURL ( new w.Blob ( [ JSON.stringify ( S, null, 1 ) ], { type: 'application/json' }) );
				a.download = 'soundit-toolbar.json';
				d.body.appendChild ( a );
				a.click ();
				setTimeout ( function () { w.URL.revokeObjectURL ( a.href ); a.parentNode && a.parentNode.removeChild ( a ); }, 500 );
			} catch (e) {}
		},
		importFile: function () {
			var inp = d.createElement ('input');
			inp.type = 'file';
			inp.accept = '.json,application/json';
			inp.onchange = function () {
				var f = inp.files && inp.files[0];
				if (!f) return ;
				var bad = function () { UI.fireEvent ('ShowError', lt ('tbl.bad_file')); };
				if (f.size > 200000) return bad ();
				var fr = new w.FileReader ();
				fr.onload = function () {
					try {
						var o = JSON.parse ( fr.result );
						if (!o || typeof o !== 'object' || !Array.isArray ( o.order )) return bad ();
						if (dlg) closeDlg ();
						S = clean ( o );
						changed ();
					} catch (e) { bad (); }
				};
				fr.onerror = bad;
				fr.readAsText ( f );
			};
			inp.click ();
		},
		openDialog: openDlg,
		closeDialog: closeDlg,
		get: function () { return JSON.parse ( JSON.stringify ( S ) ); },
		onChange: function ( fn ) { listeners.push ( fn ); }
	};

	PKAE._deps.tbl = T;

	/* 包住 _makeUIToolbar：原本的工具列建好之後，再接手排版 */
	var orig = PKAE._deps._makeUIToolbar;
	if (orig) {
		PKAE._deps._makeUIToolbar = function ( ui ) {
			orig.call ( this, ui );
			try { attach ( ui ); } catch (e) { if (w.console) console.error ( e ); }
		};
	}

})( window, document, PKAudioEditor );
