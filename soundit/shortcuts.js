/* Soundit 快捷鍵：總覽（按 ? 彈出）與自訂
 *
 * 運作方式：
 *   - 在 document 的「捕捉階段」攔截 keydown，先比對這裡登錄的動作；比對到就執行並攔下事件，
 *     舊的 keys.js / engine.js 內的同功能按鍵不會再重複觸發。
 *   - 每個動作的「預設按鍵」永遠由這裡接管：使用者把動作改到別的按鍵後，原本的預設鍵會被攔下、什麼都不做，
 *     不會再偷偷觸發舊行為。
 *   - 沒有登錄的按鍵（Esc、Enter、方向鍵上下、` 開選單、選單內操作）維持原樣，由 keys.js 處理。
 *   - 輸入框、彈出視窗（InteractionHandler.on）、選單開啟時一律不攔截。
 *
 * 按鍵格式：修飾鍵 + 實體按鍵，例如 'Mod+Shift+Z'、'Shift+Space'、'['、'Shift+/'。
 *   Mod = Windows / Linux 的 Ctrl、Mac 的 Command。字母與數字以實體鍵位（e.code）判斷，與輸入法無關。
 *
 * 儲存：localStorage 'pk_keys'，只存「和預設不同」的動作。
 */
(function ( w, d, PKAE ) {
	'use strict';

	var STORAGE_KEY = 'pk_keys';
	var MAC = /mac|iphone|ipad|ipod/.test ((navigator.platform || '').toLowerCase ());
	var t = function ( key, vars ) { return PKLocale.t ( key, vars ); };

	/* 新增：語言檔尚未有該 key 時，用內建中／英文備援 */
	function tf ( key, zh, en, vars ) {
		var s = t ( key, vars );
		if (s && s !== key) return s;
		var lang = '';
		try { lang = PKLocale.getLang (); } catch (e) {}
		s = lang === 'en' ? en : zh;
		for (var k in (vars || {})) s = s.replace ('{' + k + '}', vars[k]);
		return s;
	}

	function H () { return PKAE._deps.uiHelpers; }
	function ev ( name, a, b ) { PKAE.fireEvent ( name, a, b ); }
	function click ( sel ) { var el = d.querySelector ( sel ); el && el.click (); }

	/* ------------------------------------------------------------------
	 * 動作表：id、群組、預設按鍵、執行內容、ready（需要已載入音訊或多軌）
	 * ------------------------------------------------------------------ */
	var ACTIONS = [
		{ id: 'play_stop',   group: 'transport', keys: ['Space'],         run: function () { ev ('RequestTransportToggle', 'stop'); } },
		{ id: 'play_pause',  group: 'transport', keys: ['Shift+Space'],   run: function () { ev ('RequestTransportToggle', 'pause'); } },
		{ id: 'record',      group: 'transport', keys: ['R'],             run: function () { click ('.pk_btn.icon-rec'); } },
		{ id: 'loop',        group: 'transport', keys: ['L'],             run: function () { ev ('RequestSetLoop'); } },

		{ id: 'undo',        group: 'edit', keys: ['Mod+Z', 'Shift+Z'],                 run: function () { ev ('StateRequestUndo'); } },
		{ id: 'redo',        group: 'edit', keys: ['Mod+Y', 'Mod+Shift+Z', 'Shift+Y'],  run: function () { ev ('StateRequestRedo'); } },
		{ id: 'cut',         group: 'edit', keys: ['Mod+X', 'Shift+X'],                 run: function () { ev ('RequestActionCut', 1); } },
		{ id: 'copy',        group: 'edit', keys: ['Mod+C', 'Shift+C'],                 run: function () { ev ('RequestActionCopy'); } },
		{ id: 'paste',       group: 'edit', keys: ['Mod+V', 'Shift+V'],                 run: function () { ev ('RequestActionPaste'); } },
		{ id: 'delete',      group: 'edit', keys: ['Backspace', 'Delete'],              run: function () { ev ('RequestActionCut'); } },
		{ id: 'crossfade',   group: 'edit', keys: ['X'],                                run: function () { ev ('RequestActionCrossfade'); } },
		{ id: 'select_all',  group: 'edit', keys: ['Mod+A', 'Shift+A'],                 run: function () { ev ('RequestSelect'); } },
		{ id: 'deselect',    group: 'edit', keys: ['Q'],                                run: function () { ev ('RequestDeselect'); } },
		{ id: 'silence',     group: 'edit', keys: ['Shift+N'],                          run: function () { ev ('RequestFXUI_Silence'); } },

		{ id: 'marker_add',      group: 'select', keys: ['M'],           run: function () { ev ('MrkrAdd'); } },
		{ id: 'marker_prev',     group: 'select', keys: ['['],          run: function () { ev ('MrkrPrv', 0); } },
		{ id: 'marker_next',     group: 'select', keys: [']'],          run: function () { ev ('MrkrNxt', 0); } },
		{ id: 'marker_prev_sel', group: 'select', keys: ['Shift+['],    run: function () { ev ('MrkrPrv', 1); } },
		{ id: 'marker_next_sel', group: 'select', keys: ['Shift+]'],    run: function () { ev ('MrkrNxt', 1); } },
		/* [新增] 標記清單、改名、刪除 */
		{ id: 'marker_list',     group: 'select', keys: ['Shift+M'],    run: function () { var P = PKAE._deps.mrkpanel; P && P.toggle (); } },
		{ id: 'marker_rename',   group: 'select', keys: ['F2'],         run: function () { PKAE.mrk && PKAE.mrk.renameUi (); } },
		{ id: 'marker_delete',   group: 'select', keys: ['Shift+Delete'], run: function () { var m = PKAE.mrk; if (m && m.active ()) m.remove (m.active ()); } },
		/* [階段 3 收尾] 區間標記：以選取建立、區間轉選取（id 不用 marker_ 開頭，避免按住不放時重複建立） */
		{ id: 'range_add',       group: 'select', keys: ['Shift+R'],    ready: 1, run: function () { PKAE.mrk && PKAE.mrk.addRangeFromSelection (); } },
		{ id: 'range_select',    group: 'select', keys: ['Shift+E'],    ready: 1, run: function () { PKAE.mrk && PKAE.mrk.selectActive (); } },
		/* [階段 4] 標記分割／合併（id 不用 marker_ 開頭，按住不放時不會重複執行） */
		{ id: 'split_marker',      group: 'select', keys: ['K'],       ready: 1, run: function () { PKAE.mrk && PKAE.mrk.split (); } },
		{ id: 'merge_marker_next', group: 'select', keys: ['J'],       ready: 1, run: function () { PKAE.mrk && PKAE.mrk.mergeNext (); } },
		{ id: 'merge_marker_prev', group: 'select', keys: ['Shift+J'], ready: 1, run: function () { PKAE.mrk && PKAE.mrk.mergePrev (); } },
		/* [階段 4] 微調目前標記邊界：Alt+方向鍵 10ms，加 Shift 100ms（id 以 marker_ 開頭，按住不放會連續微調） */
		{ id: 'marker_nudge_start_back', group: 'select', keys: ['Alt+ArrowLeft',  'Alt+Shift+ArrowLeft'],  ready: 1, run: function ( e ) { PKAE.mrk && PKAE.mrk.nudge ('start', e && e.shiftKey ? -0.1 : -0.01); } },
		{ id: 'marker_nudge_start_fwd',  group: 'select', keys: ['Alt+ArrowRight', 'Alt+Shift+ArrowRight'], ready: 1, run: function ( e ) { PKAE.mrk && PKAE.mrk.nudge ('start',  e && e.shiftKey ? 0.1 : 0.01); } },
		{ id: 'marker_nudge_end_fwd',    group: 'select', keys: ['Alt+ArrowUp',    'Alt+Shift+ArrowUp'],    ready: 1, run: function ( e ) { PKAE.mrk && PKAE.mrk.nudge ('end',  e && e.shiftKey ? 0.1 : 0.01); } },
		{ id: 'marker_nudge_end_back',   group: 'select', keys: ['Alt+ArrowDown',  'Alt+Shift+ArrowDown'],  ready: 1, run: function ( e ) { PKAE.mrk && PKAE.mrk.nudge ('end', e && e.shiftKey ? -0.1 : -0.01); } },
		{ id: 'jump_play_toggle',  group: 'select', keys: [],          run: function () {
			var m = PKAE.mrk; if (!m) return ;
			m.jumpPlay (!m.jumpPlay ());
			w.OneUp && w.OneUp ( m.jumpPlay () ? tf ('sc.msg_jumpplay_on', '跳到標記後自動播放：開', 'Play after jumping to a marker: On') : tf ('sc.msg_jumpplay_off', '跳到標記後自動播放：關', 'Play after jumping to a marker: Off'), 1200 );
		} },
		/* [階段 5] 逐標記播放：切換模式（關／每段停止／接下一段）、從目前標記開始逐段播放 */
		{ id: 'play_mode_cycle',  group: 'select', keys: [],          run: function () { PKAE.mrk && PKAE.mrk.cyclePlayMode (); } },
		{ id: 'loop_count_cycle', group: 'select', keys: [],          run: function () { PKAE.mrk && PKAE.mrk.cycleLoopCount (); } },
		{ id: 'check_missing',    group: 'select', keys: [],          ready: 1, run: function () { PKAE.mrk && PKAE.mrk.checkMissing (); } },
		{ id: 'shift_markers',    group: 'select', keys: [],          ready: 1, run: function () { PKAE.mrk && PKAE.mrk.shiftFrom (); } },
		{ id: 'shift_markers_by', group: 'select', keys: [],          ready: 1, run: function () { PKAE.mrk && PKAE.mrk.shiftUi (); } },
		{ id: 'play_sections',    group: 'select', keys: [],          ready: 1, run: function () { PKAE.mrk && PKAE.mrk.playSections (); } },
		{ id: 'sel_start',       group: 'select', keys: ['I'],          ready: 1, run: function () { setSelection ('in'); } },
		{ id: 'sel_end',         group: 'select', keys: ['O'],          ready: 1, run: function () { setSelection ('out'); } },
		{ id: 'edge_prev',       group: 'select', keys: ['Shift+ArrowLeft'],  ready: 1, run: function () { H ().seekRegionMarkerEdgeFor ( PKAE, -1 ); } },
		{ id: 'edge_next',       group: 'select', keys: ['Shift+ArrowRight'], ready: 1, run: function () { H ().seekRegionMarkerEdgeFor ( PKAE, 1 ); } },

		{ id: 'zoom_reset',  group: 'view', keys: ['0'],     run: function () { ev ('RequestZoomUI', 0); } },
		{ id: 'zoom_in',     group: 'view', keys: ['='],     run: function () { ev ('RequestZoomUI', 'h', -1); } },
		{ id: 'zoom_out',    group: 'view', keys: ['-'],     run: function () { ev ('RequestZoomUI', 'h', 1); } },
		{ id: 'center',      group: 'view', keys: ['Tab'],   ready: 1, run: function () { ev ('RequestViewCenterToCursor'); } },
		{ id: 'mt_switch',   group: 'view', keys: ['E'],     run: function () { ev ('RequestMultitrackSwitch'); } },

		{ id: 'save',        group: 'file', keys: ['Mod+S', 'Shift+S'], run: function () { click ('.pk_opt[data-id="dl"]'); } },
		{ id: 'help',        group: 'file', keys: ['Shift+/'],          run: function () { openHelp (); } }
	];

	var GROUPS = ['transport', 'edit', 'select', 'view', 'file'];
	var by_id = {};
	ACTIONS.forEach (function ( a ) { by_id[ a.id ] = a; });

	/* I / O：把選取範圍的起點或終點設在游標位置 */
	function setSelection ( which ) {
		var h = H ();
		var dur = h.activeDurationFor ( PKAE );
		if (!(dur > 0)) return ;
		var cur = h.activeCursorTimeFor ( PKAE );
		var r = h.activeRegionFor ( PKAE );
		if (which === 'in') ev ('RequestRegionSet', cur, r && r.end > cur + 0.005 ? r.end : dur);
		else ev ('RequestRegionSet', r && r.start < cur - 0.005 ? r.start : 0, cur);
	}

	/* ------------------------------------------------------------------
	 * 按鍵 ⇄ 字串
	 * ------------------------------------------------------------------ */
	var CODE_NAMES = {
		Space: 'Space', Tab: 'Tab', Enter: 'Enter', Escape: 'Escape', Backspace: 'Backspace', Delete: 'Delete',
		ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown',
		Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown', Insert: 'Insert',
		BracketLeft: '[', BracketRight: ']', Minus: '-', Equal: '=', Slash: '/', Backslash: '\\',
		Backquote: '`', Comma: ',', Period: '.', Semicolon: ';', Quote: '\''
	};
	var KEYCODE_NAMES = { 32: 'Space', 9: 'Tab', 13: 'Enter', 27: 'Escape', 8: 'Backspace', 46: 'Delete',
		37: 'ArrowLeft', 39: 'ArrowRight', 38: 'ArrowUp', 40: 'ArrowDown', 219: '[', 221: ']', 189: '-', 187: '=', 191: '/' };
	var MODIFIER_KEYS = { Shift: 1, Control: 1, Alt: 1, Meta: 1, AltGraph: 1, CapsLock: 1 };

	function baseOf ( e ) {
		var c = e.code || '', m;
		if ((m = /^Key([A-Z])$/.exec ( c ))) return m[1];
		if ((m = /^Digit(\d)$/.exec ( c ))) return m[1];
		if ((m = /^Numpad(\d)$/.exec ( c ))) return m[1];
		if (/^F\d{1,2}$/.test ( c )) return c;
		if (CODE_NAMES[ c ]) return CODE_NAMES[ c ];
		if (KEYCODE_NAMES[ e.keyCode ]) return KEYCODE_NAMES[ e.keyCode ];
		if (e.key && e.key.length === 1) return e.key.toUpperCase ();
		return e.key || '';
	}

	function comboOf ( e ) {
		if (MODIFIER_KEYS[ e.key ]) return '';
		var base = baseOf ( e );
		if (!base) return '';
		var mod = MAC ? e.metaKey : e.ctrlKey;
		var other_ctrl = MAC ? e.ctrlKey : e.metaKey;
		var parts = [];
		if (mod) parts.push ('Mod');
		if (other_ctrl) parts.push (MAC ? 'Ctrl' : 'Meta');
		if (e.altKey) parts.push ('Alt');
		if (e.shiftKey) parts.push ('Shift');
		parts.push ( base );
		return parts.join ('+');
	}

	var NICE = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Backspace: 'Backspace', Escape: 'Esc' };

	function display ( combo ) {
		if (combo === 'Shift+/') return '?';
		var parts = combo.split ('+');
		/* 「+」本身作為按鍵時（Shift+=）split 會多出空字串，這裡的按鍵名稱不含 +，所以不處理 */
		var out = parts.map ( function ( p ) {
			if (p === 'Mod') return MAC ? '⌘' : 'Ctrl';
			if (p === 'Shift') return MAC ? '⇧' : 'Shift';
			if (p === 'Alt') return MAC ? '⌥' : 'Alt';
			if (p === 'Ctrl') return '⌃';
			return NICE[ p ] || p;
		});
		return MAC ? out.join ('') : out.join ('+');
	}

	/* 保留按鍵：由選單、對話框或瀏覽器使用，不開放指定 */
	var RESERVED = { 'Escape': 1, 'Enter': 1, 'ArrowUp': 1, 'ArrowDown': 1, '`': 1, 'F5': 1, 'F12': 1, 'Mod+R': 1, 'Mod+W': 1, 'Mod+T': 1, 'Mod+N': 1 };

	/* ------------------------------------------------------------------
	 * 綁定資料
	 * ------------------------------------------------------------------ */
	var custom = {};          /* id → [combo, ...]，只放和預設不同的 */
	var map = {};             /* combo → action id（目前生效） */
	var default_set = {};     /* 所有預設 combo（用來攔截被改走的舊預設鍵） */
	var listeners = [];

	ACTIONS.forEach (function ( a ) { a.keys.forEach (function ( k ) { default_set[ k ] = 1; }); });

	try {
		var saved = JSON.parse ( w.localStorage.getItem ( STORAGE_KEY ) || '{}' );
		for (var sid in saved) {
			if (by_id[ sid ] && Array.isArray ( saved[ sid ] ))
				custom[ sid ] = saved[ sid ].filter ( function ( k ) { return typeof k === 'string' && !RESERVED[ k ]; });
		}
	} catch (e) {}

	function bindingsOf ( id ) { return custom[ id ] || by_id[ id ].keys; }

	function rebuild () {
		map = {};
		ACTIONS.forEach (function ( a ) {
			bindingsOf ( a.id ).forEach (function ( k ) { if (!map[ k ]) map[ k ] = a.id; });
		});
	}
	rebuild ();

	function save () {
		try {
			if (Object.keys ( custom ).length) w.localStorage.setItem ( STORAGE_KEY, JSON.stringify ( custom ) );
			else w.localStorage.removeItem ( STORAGE_KEY );
		} catch (e) {}
		rebuild ();
		refreshHints ();
		listeners.forEach (function ( fn ) { try { fn (); } catch (e) {} });
	}

	function sameList ( a, b ) { return a.length === b.length && a.every ( function ( v, i ) { return v === b[ i ]; }); }

	function setBindings ( id, list ) {
		if (sameList ( list, by_id[ id ].keys )) delete custom[ id ];
		else custom[ id ] = list;
	}

	/* 指定按鍵給某個動作；回傳被搶走按鍵的動作 id（沒有衝突則為 null）。 */
	function assign ( id, combo, index ) {
		var taken = map[ combo ] && map[ combo ] !== id ? map[ combo ] : null;
		if (taken) setBindings ( taken, bindingsOf ( taken ).filter ( function ( k ) { return k !== combo; }) );

		var list = bindingsOf ( id ).slice ();
		var old = index !== undefined ? list[ index ] : undefined;
		if (old !== combo) {
			list = list.filter ( function ( k ) { return k !== combo; });
			var at = old === undefined ? -1 : list.indexOf ( old );
			if (at >= 0) list[ at ] = combo; else list.push ( combo );
			setBindings ( id, list );
			save ();
		}
		return taken;
	}

	function removeBinding ( id, combo ) {
		setBindings ( id, bindingsOf ( id ).filter ( function ( k ) { return k !== combo; }) );
		save ();
	}
	function resetAction ( id ) { delete custom[ id ]; save (); }
	function resetAll () { custom = {}; save (); }

	/* 新增：匯出 / 匯入自訂按鍵 */
	function exportKeys () {
		var data = JSON.stringify ({ app: 'soundit-keys', version: 1, keys: custom }, null, 2);
		var a = d.createElement ('a');
		var url = w.URL.createObjectURL ( new Blob ([ data ], { type: 'application/json' }) );
		a.href = url;
		a.download = 'soundit-shortcuts.json';
		d.body.appendChild ( a );
		a.click ();
		d.body.removeChild ( a );
		setTimeout ( function () { w.URL.revokeObjectURL ( url ); }, 1000 );
	}

	/* 回傳匯入的動作數；格式錯誤時丟出例外 */
	function importKeys ( text ) {
		var obj = JSON.parse ( text );
		var src = obj && obj.app === 'soundit-keys' && obj.keys && typeof obj.keys === 'object' ? obj.keys : null;
		if (!src) throw new Error ('format');

		var next = {}, n = 0;
		for (var id in src) {
			if (!by_id[ id ] || !Array.isArray ( src[ id ] )) continue;
			var seen = {};
			var list = src[ id ].filter ( function ( k ) {
				if (typeof k !== 'string' || RESERVED[ k ] || seen[ k ]) return false;
				return (seen[ k ] = 1);
			});
			if (!sameList ( list, by_id[ id ].keys )) next[ id ] = list;
			++n;
		}
		custom = next;

		/* 去除重複：匯入過的動作優先，其餘動作的預設鍵若被搶走就移除 */
		var owner = {};
		var order = ACTIONS.filter ( function ( a ) { return custom[ a.id ]; })
			.concat ( ACTIONS.filter ( function ( a ) { return !custom[ a.id ]; }) );
		order.forEach ( function ( a ) {
			var cur = bindingsOf ( a.id );
			var kept = cur.filter ( function ( k ) { return !owner[ k ] && (owner[ k ] = 1); });
			if (kept.length !== cur.length) setBindings ( a.id, kept );
		});
		save ();
		return n;
	}

	/* ------------------------------------------------------------------
	 * 選單提示：<span class="pk_shrtct" data-sc="動作id">，改按鍵後即時更新
	 * ------------------------------------------------------------------ */
	function hintText ( id ) {
		var list = bindingsOf ( id );
		return list.length ? display ( list[0] ) : '';
	}
	function hint ( id ) {
		var txt = hintText ( id );
		return txt ? '<span class="pk_shrtct" data-sc="' + id + '">' + txt + '</span>' : '';
	}
	function refreshHints () {
		var els = d.querySelectorAll ('.pk_shrtct[data-sc]');
		for (var i = 0; i < els.length; ++i) els[i].textContent = hintText ( els[i].getAttribute ('data-sc') );
	}

	/* ------------------------------------------------------------------
	 * 攔截 keydown
	 * ------------------------------------------------------------------ */
	function editTarget ( e ) {
		var el = e.target;
		return !!(el && (/INPUT|TEXTAREA|SELECT/.test ( el.tagName ) || el.isContentEditable));
	}

	function swallow ( e ) {
		e.preventDefault ();
		e.stopImmediatePropagation ();
	}

	d.addEventListener ('keydown', function ( e ) {
		if (e.isComposing) return ;

		if (overlay) { overlayKey ( e ); return ; }

		var combo = comboOf ( e );
		if (!combo) return ;

		var id = map[ combo ];
		if (!id && !default_set[ combo ]) return ;

		var ui = PKAE.ui;
		if (!ui || ui.InteractionHandler.on || editTarget ( e )) return ;
		if (ui.TopHeader && ui.TopHeader.getOpenElement && ui.TopHeader.getOpenElement ()) return ;

		/* 預設鍵已被改走：攔下，避免舊行為偷偷觸發 */
		if (!id) { swallow ( e ); return ; }

		var a = by_id[ id ];
		if (a.ready && !H ().activeReadyFor ( PKAE )) return ;

		swallow ( e );
		if (e.repeat && !/^(zoom_|marker_|edge_)/.test ( id )) return ;
		a.run ( e );
	}, true);

	/* ------------------------------------------------------------------
	 * 總覽 / 自訂視窗
	 * ------------------------------------------------------------------ */
	var overlay = null, capture = null, note_el = null;

	function openHelp () {
		if (overlay) return ;
		var ui = PKAE.ui;
		if (!ui || !ui.InteractionHandler.checkAndSet ('shortcuts')) return ;

		overlay = d.createElement ('div');
		overlay.className = 'pk_sc_ov';
		overlay.onmousedown = function ( e ) { if (e.target === overlay) closeHelp (); };
		d.body.appendChild ( overlay );
		render ();
	}

	function closeHelp () {
		if (!overlay) return ;
		capture = null;
		note_el = null;
		overlay.parentNode && overlay.parentNode.removeChild ( overlay );
		overlay = null;
		PKAE.ui.InteractionHandler.on = false;
		PKAE.ui.InteractionHandler.by = null;
	}

	function esc ( s ) { return String ( s ).replace (/[&<>"]/g, function ( c ) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ c ]; }); }

	/* [修改] 新增的標記動作語言檔沒有名稱，用內建中／英文備援 */
	var ACT_FALLBACK = {
		marker_list:   ['開啟／關閉標記清單', 'Toggle Marker List'],
		marker_rename: ['重新命名目前標記', 'Rename Current Marker'],
		marker_delete: ['刪除目前標記', 'Delete Current Marker'],
		range_add:     ['以選取範圍建立區間標記', 'Create Range Marker from Selection'],
		range_select:  ['區間轉選取（目前標記）', 'Select Current Marker Range'],
		split_marker:      ['在游標處分割標記', 'Split Marker at Cursor'],
		merge_marker_next: ['與後一個標記合併', 'Merge with Next Marker'],
		merge_marker_prev: ['與前一個標記合併', 'Merge with Previous Marker'],
		jump_play_toggle:  ['切換「跳到標記後自動播放」', 'Toggle Play After Jumping to Marker'],
		play_mode_cycle:   ['切換逐標記播放模式（關／每段停止／接下一段）', 'Cycle Play-by-Marker Mode (Off / Stop / Continue)'],
		loop_count_cycle:  ['切換循環次數（無限／2／3／5／10）', 'Cycle Loop Count (Unlimited / 2 / 3 / 5 / 10)'],
		check_missing:     ['漏標檢查（找出有聲音但沒有標記的區段）', 'Check Missing Markers (speech not covered by any marker)'],
		shift_markers:     ['以游標平移目前標記及其後', 'Shift Active Marker and Later Ones to Cursor'],
		shift_markers_by:  ['平移目前標記及其後（輸入秒數）', 'Shift Active Marker and Later Ones by…'],
		play_sections:     ['從目前標記開始逐段播放', 'Play Sections From Current Marker'],
		marker_nudge_start_back: ['標記起點往前微調（Shift＝較大步）', 'Nudge Marker Start Earlier (Shift = larger step)'],
		marker_nudge_start_fwd:  ['標記起點往後微調（Shift＝較大步）', 'Nudge Marker Start Later (Shift = larger step)'],
		marker_nudge_end_fwd:    ['區間結束往後微調（Shift＝較大步）', 'Nudge Range End Later (Shift = larger step)'],
		marker_nudge_end_back:   ['區間結束往前微調（Shift＝較大步）', 'Nudge Range End Earlier (Shift = larger step)']
	};
	function actionLabel ( id ) {
		var f = ACT_FALLBACK[ id ];
		return f ? tf ('sc.act.' + id, f[0], f[1]) : t ('sc.act.' + id);
	}

	function render () {
		if (!overlay) return ;
		var html = '<div class="pk_sc_box">' +
			'<div class="pk_sc_hd"><b>' + esc ( t ('sc.title') ) + '</b>' +
			'<span class="pk_sc_sp"></span>' +
			'<a class="pk_sc_btn" data-do="export">' + esc ( tf ('sc.export', '匯出', 'Export') ) + '</a>' +
			'<a class="pk_sc_btn" data-do="import">' + esc ( tf ('sc.import', '匯入', 'Import') ) + '</a>' +
			'<a class="pk_sc_btn" data-do="reset_all">' + esc ( t ('sc.reset_all') ) + '</a>' +
			'<a class="pk_sc_x" data-do="close">&#10005;</a></div>' +
			'<div class="pk_sc_note">' + esc ( t ('sc.hint') ) + '</div>' +
			'<div class="pk_sc_body">';

		GROUPS.forEach ( function ( g ) {
			html += '<section><h4>' + esc ( t ('sc.group.' + g) ) + '</h4>';
			ACTIONS.filter ( function ( a ) { return a.group === g; }).forEach ( function ( a ) {
				var list = bindingsOf ( a.id );
				var changed = !!custom[ a.id ];
				html += '<div class="pk_sc_row' + (changed ? ' pk_sc_chg' : '') + '"><span class="pk_sc_nm">' + esc ( actionLabel ( a.id ) ) + '</span><span class="pk_sc_ks">';
				list.forEach ( function ( k, i ) {
					var cap = capture && capture.id === a.id && capture.index === i;
					html += '<kbd class="' + (cap ? 'pk_sc_cap' : '') + '" data-do="edit" data-id="' + a.id + '" data-i="' + i + '" title="' + esc ( t ('sc.click_edit') ) + '">' +
						(cap ? esc ( t ('sc.press') ) : esc ( display ( k ) )) +
						'<u data-do="del" data-id="' + a.id + '" data-k="' + esc ( k ) + '">&#10005;</u></kbd>';
				});
				if (capture && capture.id === a.id && capture.index === list.length)
					html += '<kbd class="pk_sc_cap">' + esc ( t ('sc.press') ) + '</kbd>';
				else
					html += '<kbd class="pk_sc_add" data-do="add" data-id="' + a.id + '" title="' + esc ( t ('sc.add') ) + '">+</kbd>';
				if (!list.length) html += '<i class="pk_sc_none">' + esc ( t ('sc.none') ) + '</i>';
				html += '</span>' + (changed ? '<a class="pk_sc_rs" data-do="reset" data-id="' + a.id + '" title="' + esc ( t ('sc.reset') ) + '">&#8635;</a>' : '<span class="pk_sc_rs"></span>') + '</div>';
			});
			html += '</section>';
		});

		html += '<section><h4>' + esc ( t ('sc.group.fixed') ) + '</h4>' +
			fixedRow ( 'sc.fixed.channel', '↑ / ↓' ) +
			fixedRow ( 'sc.fixed.menu', '`' ) +
			fixedRow ( 'sc.fixed.esc', 'Esc' ) +
			fixedRow ( 'sc.fixed.enter', 'Enter' ) +
			'</section></div><div class="pk_sc_ft"><span class="pk_sc_msg"></span></div></div>';

		overlay.innerHTML = html;
		note_el = overlay.getElementsByClassName ('pk_sc_msg')[0];
		overlay.onclick = onClick;
	}

	function fixedRow ( key, keys ) {
		return '<div class="pk_sc_row"><span class="pk_sc_nm">' + esc ( t ( key ) ) + '</span><span class="pk_sc_ks"><kbd class="pk_sc_fix">' + esc ( keys ) + '</kbd></span><span class="pk_sc_rs"></span></div>';
	}

	function say ( msg, bad ) {
		if (!note_el) return ;
		note_el.textContent = msg || '';
		note_el.className = 'pk_sc_msg' + (bad ? ' pk_sc_bad' : '');
	}

	function onClick ( e ) {
		var el = e.target;
		while (el && el !== overlay && !(el.getAttribute && el.getAttribute ('data-do'))) el = el.parentNode;
		if (!el || el === overlay) { if (capture) { capture = null; render (); } return ; }

		var what = el.getAttribute ('data-do');
		var id = el.getAttribute ('data-id');

		if (what === 'close') return closeHelp ();
		if (what === 'export') { exportKeys (); say ( tf ('sc.msg_exported', '已匯出 soundit-shortcuts.json', 'Exported soundit-shortcuts.json') ); return ; }
		if (what === 'import') {
			var inp = d.createElement ('input');
			inp.type = 'file';
			inp.accept = '.json,application/json';
			inp.onchange = function () {
				var f = inp.files && inp.files[0];
				if (!f) return ;
				var r = new FileReader ();
				r.onload = function () {
					try {
						capture = null;
						var n = importKeys ( String ( r.result ) );
						render ();
						say ( tf ('sc.msg_imported', '已匯入 {n} 個動作的按鍵', 'Imported keys for {n} actions', { n: n }) );
					} catch (err) {
						say ( tf ('sc.msg_import_bad', '檔案格式不正確，未做任何變更', 'Invalid file, nothing changed'), true );
					}
				};
				r.readAsText ( f );
			};
			inp.click ();
			return ;
		}
		if (what === 'reset_all') { capture = null; resetAll (); render (); say ( t ('sc.msg_reset_all') ); return ; }
		if (what === 'reset') { capture = null; resetAction ( id ); render (); return ; }
		if (what === 'del') {
			e.stopPropagation ();
			capture = null;
			removeBinding ( id, el.getAttribute ('data-k') );
			render ();
			return ;
		}
		if (what === 'edit') { capture = { id: id, index: +el.getAttribute ('data-i') }; render (); say ( t ('sc.msg_capture') ); return ; }
		if (what === 'add') { capture = { id: id, index: bindingsOf ( id ).length }; render (); say ( t ('sc.msg_capture') ); return ; }
	}

	function overlayKey ( e ) {
		/* 視窗開著時，所有按鍵都由這裡處理，不讓編輯器本身反應 */
		if (e.key === 'Escape') {
			swallow ( e );
			if (capture) { capture = null; render (); say (''); }
			else closeHelp ();
			return ;
		}
		if (!capture) {
			var c0 = comboOf ( e );
			if (c0 && map[ c0 ] === 'help') { swallow ( e ); closeHelp (); }
			return ;
		}

		swallow ( e );
		var combo = comboOf ( e );
		if (!combo) return ;                                   /* 只按了修飾鍵，繼續等 */

		if (RESERVED[ combo ]) { say ( t ('sc.msg_reserved', { key: display ( combo ) }), true ); return ; }

		var cur = capture;
		capture = null;
		var taken = assign ( cur.id, combo, cur.index );
		render ();
		if (taken) say ( t ('sc.msg_moved', { key: display ( combo ), from: actionLabel ( taken ), to: actionLabel ( cur.id ) }) );
		else say ( t ('sc.msg_set', { key: display ( combo ), action: actionLabel ( cur.id ) }) );
	}

	/* ------------------------------------------------------------------ */
	PKAE._deps.shortcuts = {
		open: openHelp,
		close: closeHelp,
		hint: hint,
		label: hintText,
		display: display,
		getBindings: function ( id ) { return bindingsOf ( id ).slice (); },
		onChange: function ( fn ) { listeners.push ( fn ); },
		resetAll: resetAll
	};

})( window, document, PKAudioEditor );
