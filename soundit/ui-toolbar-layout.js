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
 *   .lay() .setLay(0|1|2|3)          [新增] 排列方式：0＝自動（寬度夠就單排）、1＝固定上下兩排、2＝固定單排、
 *                                     3＝精簡（預設）：整條工具列半高（每條 24px）、單排，放不下才折成兩行
 *   .edit(true|false) .isEditing() .reset()
 *   .openDialog() .closeDialog() .get()
 *   .dockAll() .exportFile() .importFile()
 *   .onChange(fn)
 * [新增] 電平表（-Inf … 0 那條）也是一個面板：id = meter。
 *   .isVis('meter') / .toggle('meter')   顯示／隱藏
 *   .meterDock() .setMeterDock('foot'|'bar')   放在底部（全寬）或工具列（窄版，預設）　[修改] 預設改為 'bar'，且「選取工具列」「電平表」預設隱藏
 *   .attachMeter(el, footer)             由 ui-mainview.js 建好電平表後呼叫（工具列比它早建好，所以要事後接上）
 *   在「調整排列」裡可以抓電平表：拖到工具列區＝窄版放工具列；拖到底部＝放回底部；拖到中間＝浮動
 * 設定存在 localStorage 'pk_tbl'（含版本號；不認得的項目會被丟掉，新增的內建按鈕會自動補進去）
 * ========================================================================== */
(function ( w, d, PKAE ) {
	'use strict';

	var KEY = 'pk_tbl';
	var V = 1;
	var BUILTIN = ['time', 'transport', 'actions', 'selection'];	/* [新增] 原本就在工具列裡的四個面板（attach 時一定要找得到） */
	var PANELS = BUILTIN.concat ( ['meter'] );	/* [修改] 多了 meter：電平表，由 ui-mainview.js 事後接上（attachMeter） */
	var BARS = ['transport', 'actions'];

	/* 按鈕 id → 原本按鈕上的 class（用 class 辨識，所以不用改原本的檔案） */
	var BTN = {
		stop: 'pk_stop', play: 'pk_play', loop: 'pk_loop', practice: 'pk_practice',	/* [修改 5-2] 多了 practice（練習速度） */
		back: 'pk_back_jump', fwd: 'pk_front_jump', start: 'icon-previous2', end: 'icon-next2', rec: 'icon-rec',
		copy: 'icon-files-empty', paste: 'icon-file-text2', cut: 'icon-scissors', silence: 'icon-silence'
	};
	var DEF = {
		transport: ['stop', 'play', 'loop', 'practice', 'back', 'fwd', 'start', 'end', 'rec'],	/* [修改 5-2] loop 後面加 practice */
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
		{ id: 'practice', cat: 'play', face: '\u7DF4', ev: ['RequestPracticeUI'] },	/* [新增 5-2] 練習速度（即時變速） */
		{ id: 'rec', cat: 'play', icon: 'icon-rec', ev: ['RequestActionRecordToggle'] },
		{ id: 'to_start', cat: 'play', icon: 'icon-previous2', ev: ['RequestSeekTo', 0] },
		{ id: 'to_end', cat: 'play', icon: 'icon-next2', ev: ['RequestSeekTo', 1] },

		{ id: 'undo', cat: 'edit', face: '\u21B6', ev: ['StateRequestUndo'] },
		{ id: 'redo', cat: 'edit', face: '\u21B7', ev: ['StateRequestRedo'] },
		{ id: 'ab', cat: 'edit', face: 'A/B', ev: ['RequestABToggle'] },
		{ id: 'copy', cat: 'edit', icon: 'icon-files-empty', ev: ['RequestActionCopy'] },
		{ id: 'paste', cat: 'edit', icon: 'icon-file-text2', ev: ['RequestActionPaste'] },
		{ id: 'cut', cat: 'edit', icon: 'icon-scissors', ev: ['RequestActionCut', 1] },
		{ id: 'silence', cat: 'edit', icon: 'icon-silence', ev: ['RequestFXUI_Silence'] },
		{ id: 'sel_all', cat: 'edit', face: '\u5168', ev: ['RequestSelect'] },
		{ id: 'sel_none', cat: 'edit', face: '\u2715', ev: ['RequestRegionClear'] },
		{ id: 'sel_vis', cat: 'edit', face: '[ ]', ev: ['RequestRegionSet'] },
		{ id: 'deselect', cat: 'edit', face: '\u2205', ev: ['RequestDeselect'] },
		{ id: 'zero_cross', cat: 'edit', face: '0\u00D7', ev: ['RequestSnapSelDrag'] },
		{ id: 'range_new', cat: 'edit', face: '\u2691+', run: function ( app ) { var m = app.mrk; m && m.addRangeFromSelection && m.addRangeFromSelection (); } },	/* [新增] 以選取範圍建立區間標記（右鍵選單預設項目，也能放進工具列） */

		{ id: 'gain', cat: 'fx', face: 'dB', ev: ['RequestFXUI_Gain'] },
		{ id: 'fade_in', cat: 'fx', face: '\u25E2', ev: ['RequestActionFX_FadeIn'] },
		{ id: 'fade_out', cat: 'fx', face: '\u25E3', ev: ['RequestActionFX_FadeOut'] },
		{ id: 'normalize', cat: 'fx', face: 'N', ev: ['RequestActionFXUI_Normalize'] },
		{ id: 'noise', cat: 'fx', face: 'NR', ev: ['RequestActionFX_NoiseRNN'] },
		{ id: 'reverse', cat: 'fx', face: '\u21C4', ev: ['RequestActionFX_Reverse'] },
		{ id: 'invert', cat: 'fx', face: '\u00B1', ev: ['RequestActionFX_Invert'] },
		{ id: 'rem_sil', cat: 'fx', face: 'RS', ev: ['RequestActionFX_RemSil'] },
		{ id: 'high_pass', cat: 'fx', face: 'HP', ev: ['RequestActionFX_HighPass'] },
		{ id: 'dc_offset', cat: 'fx', face: 'DC', ev: ['RequestActionFX_DCOffset'] },
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
		{ id: 'speed_rate', cat: 'fx', face: 'RAT', ev: ['RequestActionFXUI_TimePitch'] },

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
		{ id: 'meter', cat: 'view', face: 'LV', run: function ( app ) {
			var T = app._deps.tbl;
			T && T.toggle ('meter');
		} },
		{ id: 'tempo', cat: 'view', face: '\u266A', ev: ['RequestActionTempo'] },
		{ id: 'id3', cat: 'view', face: 'ID3', ev: ['RequestActionID3'] },
		{ id: 'phonetic', cat: 'view', face: 'PH', ev: ['RequestActionPhoneticView'] }
	];
	var CAT = {};
	CATALOG.forEach ( function ( c ) { CAT[ c.id ] = c; });
	var MAXBARS = 6, MAXITEMS = 24;
	/* [新增] 右鍵選單：項目從上面的按鈕目錄挑；預設內容與原本寫死的 9 項相同 */
	var MAXCTX = 16;
	var DEFCTX = ['sel_vis', 'zoom_reset', 'gain', 'seamless', 'copy', 'paste', 'cut', 'silence', 'range_new'];
	var CTXKEY = { sel_vis: 'context.select_visible', zoom_reset: 'context.reset_zoom', gain: 'context.set_volume', seamless: 'context.seamless_loop',
		copy: 'context.copy', paste: 'context.paste', cut: 'context.cut', silence: 'context.insert_silence' };	/* 這幾項沿用原本右鍵選單的字 */
	var CTXSEL = { seamless: 1, copy: 1, cut: 1, range_new: 1 };	/* 沒有選取範圍時反灰（和原本一樣；paste 則看剪貼簿） */

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
			hide: { selection: 1, meter: 1 },	/* [修改] 預設隱藏「選取工具列」與「電平表」（原本是 {}，全部顯示） */
			bars: { transport: DEF.transport.slice (), actions: DEF.actions.slice () },
			tm: { t: 1, h: 1 },
			x: { t: 0, h: 0 },	/* [新增] 桌面版精簡時間：往右多顯示「總長度」「滑鼠位置時間」（預設都不顯示） */
			selx: 0,	/* [新增] 桌面版選取區塊：顯示橫向文字（起點／終點／長度） */
			selc: 0,
			mdock: 'bar',	/* [修改] 電平表放哪：'foot'＝底部（全寬）、'bar'＝工具列（窄版，現為預設；原本預設 'foot'）；浮動另外記在 float.meter */
			lay: 3,	/* [修改] 排列方式：0＝自動、1＝固定上下兩排、2＝固定單排、3＝精簡（半高單排，放不下才折兩行；新的預設值） */
			custom: [],
			ctx: DEFCTX.slice (),	/* [新增] 右鍵選單項目（按鈕 id 陣列） */
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
		/* [修改] 預設 hide 不再是空物件：已存過設定時，先清空再依存檔還原，否則使用者手動「顯示」過的面板重新整理後會又被預設隱藏 */
		if (o.hide && typeof o.hide === 'object') { s.hide = {}; ids.forEach ( function ( id ) { if (o.hide[ id ]) s.hide[ id ] = 1; }); }

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
		if (o.x && typeof o.x === 'object') { s.x.t = o.x.t === 1 ? 1 : 0; s.x.h = o.x.h === 1 ? 1 : 0; }
		s.selx = o.selx ? 1 : 0;
		s.mdock = o.mdock === undefined ? s.mdock : (o.mdock === 'bar' ? 'bar' : 'foot');	/* [修改] 舊設定沒有 mdock 欄位 → 用新預設（工具列窄版）；明確存過 'foot' 的維持底部 */
		s.lay = (o.lay === 1 || o.lay === 2 || o.lay === 3) ? o.lay : (o.lay === undefined ? s.lay : 0);	/* [修改] 舊設定沒有 lay 欄位 → 用新預設（精簡）；明確存過 0 的維持自動 */
		/* [新增] 右鍵選單：只收目錄裡有的按鈕 id；沒存過就用預設 */
		if (Array.isArray (o.ctx)) s.ctx = o.ctx.filter ( function ( k ) { return CAT[ k ]; }).slice ( 0, MAXCTX );
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
	var groups = [];	/* [新增] 上下疊兩排的容器池：groups[0] 就是原本的 .pk_btngroup，不夠用時才建新的（class 相同，沿用同一套 CSS） */
	var els = {}, btns = {};
	var mhome = null;	/* [新增] 電平表在「底部」時的容器（.pk_ftr） */
	var lastRow = null, relayoutRaf = 0;	/* [新增] 上一次是否採單排；重新排版的排程旗標 */
	var editing = false, pill = null, drag = null, rz = 0, dlg = null, dlgSel = null, dlgQ = '', dlgTab = 'bars';	/* [修改] 多了 dlgTab：對話框目前的頁籤（bars＝工具列、ctx＝右鍵選單） */
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

	/* [修改] 可疊列：播放列、編輯列、自訂列（種類 'b'），以及「精簡」狀態的時間、選取面板（種類 'c'）。
	 * 配對規則：相鄰兩條疊成上下兩排；種類相同的優先配對（預設的「播放列＋編輯列」不會被精簡面板搶走），
	 * 沒配到的才跨種類配對（播放列也能和精簡的時間／選取疊在一起）。 */
	/* [新增] 精簡模式（lay=3）：桌面版才有；時間、選取區塊自動用精簡外觀，不必另外去勾選 */
	function cmp () { return !isMob (); }	/* [修改] 桌面版固定精簡，沒有大按鈕的排列 */

	function isCompact ( id ) {
		if (isMob () || S.hide[ id ]) return false;
		if (cmp ()) return id === 'time' || id === 'selection';	/* 手機版沒有精簡樣式；隱藏的面板不參與配對，避免另一條落單 */
		if (id === 'time') return S.tm.t === 0 && S.tm.h === 0;
		if (id === 'selection') return !!S.selc;
		return false;
	}
	function stackKind ( id ) {
		if (id === 'transport' || id === 'actions' || !!(els[ id ] && els[ id ].__custom)) return 'b';
		return isCompact ( id ) ? 'c' : '';
	}
	function stackable ( id ) { return !!stackKind ( id ); }
	/* [新增] 落單（沒有另一條可以配對）的自訂列要不要也縮成一半高、放進容器：true＝一律半高；false＝落單時維持整高 */
	var SOLO_CUSTOM_HALF = true;


	function panelIds () { return PANELS.concat ( S.custom.map ( function ( c ) { return c.id; }) ); }
	function isMob () { return !!(UI && UI.el && UI.el.classList.contains ('pk_mob')); }
	function isFloat ( id ) { return !!(S.float[ id ] && !isMob ()); }

	/* [新增] 電平表現在是不是在工具列容器裡（浮動、或設定為放在工具列）；否則在底部 */
	function meterInTb () { return !!els.meter && (isFloat ( 'meter' ) || S.mdock === 'bar'); }

	/* [新增] 把電平表搬到正確的容器（工具列或底部），並切換窄版外觀 .pk_meter_c */
	function syncMeter () {
		var m = els.meter;
		if (!m || !tb) return ;
		var inTb = meterInTb (), want = inTb ? tb : mhome;
		if (want && m.parentNode !== want) want.appendChild ( m );
		m.classList.toggle ('pk_meter_c', inTb);
	}

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

	/* [新增] 工具列內容是不是比可視區還寬（寬版：.pk_tb 會被 min-width:max-content 撐寬；窄版：.pk_tbc 會出現橫向捲動） */
	function overflowed () {
		var box = tb && tb.parentNode;
		if (!box || !box.clientWidth) return false;
		return tb.offsetWidth > box.clientWidth + 1;
	}

	/* [新增] 視窗大小、容器寬度、多軌開關改變時，自動模式要重新判斷單排／上下疊（rAF 合併，同一幀只算一次） */
	function relayout () {
		if (relayoutRaf || !tb || (S.lay | 0) !== 0 || editing) return ;
		relayoutRaf = w.requestAnimationFrame ( function () {
			relayoutRaf = 0;
			if (tb && (S.lay | 0) === 0 && !editing) render ();
		});
	}

	function render () {
		if (!tb) return ;

		syncMeter ();	/* [新增] 電平表先搬到對的容器，後面才排得進去 */

		/* 1. 按鈕列：已登記的按鈕依設定排序，沒登記的（別的模組塞進來的）放最後 */
		BARS.forEach ( function ( b ) {
			var bar = els[ b ], nodes = [], extra = [], i;
			S.bars[ b ].forEach ( function ( id ) { if (btns[ id ]) nodes.push ( btns[ id ] ); });
			for (i = 0; i < bar.children.length; ++i) if (!bar.children[ i ].__tbid) extra.push ( bar.children[ i ] );
			place ( bar, nodes.concat ( extra ) );
			bar.classList.toggle ('pk_tbl_empty', !nodes.length && !extra.length);
		});

		/* 2. 面板：播放列、編輯列、自訂列、精簡的時間／選取（統稱「可疊列」）依順序「相鄰兩兩配對」，各放進一個 .pk_btngroup 上下疊成兩排，
		 *    每條的按鈕高度就跟播放列一樣是工具列的一半。
		 *    [修改] 原本只有「播放列＋編輯列」這一對會疊，自訂列一律單獨整高。 */
		/* [修改] 原本這一段直接執行；現在包成 layoutOnce ( row )：row 為 true 時不配對、不疊容器，全部排成同一排（高度一排）。
		 * 想知道「單排放不放得下」就得先排排看，所以要能重複執行，才包成函式。 */
		function layoutOnce ( row ) {
		var seq = [], o = S.order.filter ( function ( id ) { return els[ id ] && !isFloat ( id ) && (id !== 'meter' || meterInTb ()); }), i, gi = 0;	/* [修改] 電平表放在底部時不參與工具列排版 */
		function nextGroup () {
			if (!groups[ gi ]) { var g = d.createElement ('div'); g.className = group.className; groups.push ( g ); }
			groups[ gi ].classList.remove ('pk_tbl_v', 'pk_tbl_x');	/* [修改] 容器是重複使用的，先清掉上一輪的「垂直疊放」「混搭」標記（多清一個 pk_tbl_x） */
			return groups[ gi++ ];
		}

		/* [新增] 先決定誰跟誰配對（pairs[ i ] = 1 代表 o[ i ] 和 o[ i + 1 ] 疊成一組）。分兩輪：
		 *   第 1 輪：相鄰且種類相同的先配（和以前完全一樣，所以原本的排列結果不會變，
		 *            例如「時間（精簡）、播放列、編輯列、選取（精簡）」仍是 播放列＋編輯列 一組，時間、選取各自落單）。
		 *   第 2 輪：第 1 輪沒配到的「可疊列」，如果和下一個也沒配到的可疊列相鄰，就跨種類配成一組——
		 *            這樣播放列／編輯列／自訂列也能和精簡的時間、選取上下疊在一起，不再只能和編輯列配對。 */
		var pairs = [], used = [];
		for (i = 0; !row && i < o.length - 1; ++i) {	/* [修改] 單排時不配對 */
			if (stackable ( o[ i ] ) && stackable ( o[ i + 1 ] ) && stackKind ( o[ i ] ) === stackKind ( o[ i + 1 ] )) {
				pairs[ i ] = 1; used[ i ] = used[ i + 1 ] = 1; ++i;
			}
		}
		for (i = 0; !row && i < o.length - 1; ++i) {	/* [修改] 單排時不配對 */
			if (!used[ i ] && !used[ i + 1 ] && stackable ( o[ i ] ) && stackable ( o[ i + 1 ] )) {
				pairs[ i ] = 1; used[ i ] = used[ i + 1 ] = 1; ++i;
			}
		}

		for (i = 0; i < o.length; ++i) {
			var a = o[ i ], n = o[ i + 1 ];
			if (pairs[ i ]) {	/* [修改] 原本是現場判斷「種類相同」，改成用上面算好的配對表 */
				var g2 = nextGroup (), ka = stackKind ( a ), kn = stackKind ( n );
				place ( g2, [ els[ a ], els[ n ] ] );
				g2.classList.toggle ('pk_tbl_v', ka === 'c' || kn === 'c');	/* [修改] 只要其中一條是精簡的時間／選取，就一定要上下疊（不受視窗寬度影響） */
				g2.classList.toggle ('pk_tbl_x', ka !== kn);	/* [新增] 混搭（播放／編輯／自訂列 ＋ 精簡面板）：CSS 用這個標記把兩條調成一樣高 */
				seq.push ( g2 );
				++i;
			} else if (!row && SOLO_CUSTOM_HALF && els[ a ].__custom) {	/* [新增] 落單的自訂列也放進容器，按鈕高度才會和成對時一致 */
				var g1 = nextGroup ();
				place ( g1, [ els[ a ] ] );
				seq.push ( g1 );
			} else seq.push ( els[ a ] );
		}
		S.order.forEach ( function ( id ) { if (els[ id ] && isFloat ( id )) seq.push ( els[ id ] ); });	/* 浮動的面板仍留在工具列容器裡，只是脫離排版 */
		var known = groups.slice (), extra2 = [];
		Object.keys ( els ).forEach ( function ( k ) { known.push ( els[ k ] ); });
		for (i = 0; i < tb.children.length; ++i) if (known.indexOf ( tb.children[ i ] ) < 0) extra2.push ( tb.children[ i ] );	/* 例如多軌的節拍列 */
		place ( tb, seq.concat ( extra2 ) );
		groups.forEach ( function ( g ) { if (seq.indexOf ( g ) < 0 && g.parentNode) g.parentNode.removeChild ( g ); });	/* [修改] 沒用到的容器都移掉（原本只處理 group 一個） */
		}

		/* [新增] 決定單排或上下疊：
		 *   固定單排（lay=2）／固定上下兩排（lay=1）直接照設定；
		 *   自動（lay=0）先試排單排，量一下工具列有沒有比可視寬度還寬——放得下就單排，放不下才改回上下疊。
		 *   手機版沒有精簡樣式，一律維持原本的上下疊。調整排列模式中不重新判斷，避免拖曳時版面跳來跳去。 */
		var mode = isMob () ? 1 : 3, row;	/* [修改] 桌面版一律精簡（lay 設定不再生效） */
		tb.classList.toggle ('pk_tbl_cmp', mode === 3);	/* [新增] 精簡模式：樣式全在 main.css 的 .pk_tbl_cmp */
		if (mode === 3) {
			/* [新增] 精簡：全部排同一排（不配對、不疊容器），換行交給 CSS 的 flex-wrap；放不下才會折成兩行 */
			tb.classList.remove ('pk_tbl_1row');
			layoutOnce ( true );
			lastRow = null;
		}
		else if (mode === 0 && editing && lastRow !== null) row = lastRow;
		else if (mode === 0) {
			tb.classList.add ('pk_tbl_1row');
			layoutOnce ( true );
			row = !overflowed ();
		}
		else row = mode === 2;
		if (mode !== 3) {
		tb.classList.toggle ('pk_tbl_1row', row);
		if (!(mode === 0 && !editing && row)) layoutOnce ( row );	/* 自動且單排放得下 → 剛剛已經排好了，不用再排一次 */
		lastRow = row;
		}

		/* 3. 顯示／隱藏 */
		panelIds ().forEach ( function ( id ) { els[ id ] && els[ id ].classList.toggle ('pk_tbl_off', !!S.hide[ id ]); });
		panelIds ().forEach ( posFloat );
	}

	function apply () {
		if (!tb) return ;
		syncCustom ();
		render ();
		els.time.classList.toggle ('pk_tm_nt', S.tm.t === 0 || cmp ());	/* [修改] 精簡模式強制用精簡外觀（不改動使用者原本的設定值） */
		els.time.classList.toggle ('pk_tm_nh', S.tm.h === 0 || cmp ());
		els.selection.classList.toggle ('pk_sel_c', !!S.selc || cmp ());
		els.time.classList.remove ('pk_tm_xt');	/* [修改] 桌面版不再在時間後面顯示總長度（改放右下角，見 ui-mainview.js 的 .pk_tot）；S.x.t 設定值保留但不生效 */
		els.time.classList.toggle ('pk_tm_xh', cmp () && !!S.x.h);	/* [新增] 往右加寬，多顯示滑鼠位置時間 */
		els.selection.classList.toggle ('pk_sel_x', cmp () && !!S.selx);	/* [新增] 選取區塊橫向文字 */
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

	/* [修改] 原 isStacked()（只比對播放列／編輯列）改成逐個面板判斷：
	 * 這個面板在某個疊兩排的容器裡，而且容器裡另一條也顯示、位置明顯在上方或下方 → 用「上下」決定前後 */
	function isInStack ( el ) {
		var p = el.parentNode;
		if (!p || groups.indexOf ( p ) < 0) return false;
		var top = el.getBoundingClientRect ().top;
		for (var i = 0; i < p.children.length; ++i) {
			var s = p.children[ i ];
			if (s !== el && shown ( s ) && Math.abs ( s.getBoundingClientRect ().top - top ) > 10) return true;
		}
		return false;
	}

	/* 指標位置在這個面板「之後」嗎？ */
	function isBefore ( id, x, y ) {
		var r = els[ id ].getBoundingClientRect ();
		if (cmp ()) {	/* [新增] 精簡模式可能折成兩行：先比上下，同一行才比左右 */
			if (y > r.bottom) return true;
			if (y < r.top) return false;
		}
		if (x > r.right) return true;
		if (x < r.left) return false;
		if (isInStack ( els[ id ] )) return y > r.top + r.height / 2;	/* [修改] 原本只限 transport／actions，現在自訂列也適用 */
		return x > r.left + r.width / 2;
	}

	function dragPanel ( x, y ) {
		var id = drag.id, rest = S.order.filter ( function ( p ) { return p !== id; });
		var at = rest.length, i;
		for (i = 0; i < rest.length; ++i) {
			if (S.hide[ rest[ i ] ] || !shown ( els[ rest[ i ] ] )) continue;
			if (rest[ i ] === 'meter' && !meterInTb ()) continue;	/* [新增] 在底部的電平表不是工具列的一員 */
			if (!isBefore ( rest[ i ], x, y )) { at = i; break; }
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
		/* [新增] 電平表有三個去處：指標在底部那一區＝放回底部；在工具列區＝放工具列（窄版）；中間＝浮動（手機版沒有浮動） */
		if (id === 'meter' && mhome) {
			var fr = mhome.getBoundingClientRect ();
			var in_foot = y >= fr.top - 6;
			var in_bar = isMob () ? !in_foot : (y <= r.bottom + 14);
			if (in_foot || in_bar) {
				var nd = in_foot ? 'foot' : 'bar';
				if (S.float[ id ] || S.mdock !== nd) { delete S.float[ id ]; S.mdock = nd; render (); }
				if (in_bar) dragPanel ( x, y );
				return ;
			}
		}
		else if (isMob () || y <= r.bottom + 14) {	/* [修改] 前面多了電平表的分支，這裡改成 else if */
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

	/* ---------- 電平表 ----------
	 * 電平表由 ui-mainview.js 建立（預設放在底部 footer），建好後呼叫 attachMeter 交給這裡管：
	 * 顯示／隱藏、搬到工具列（窄版）、浮動、在「調整排列」裡拖曳。 */

	/* 電平表在底部時，工具列的 pointerdown 收不到事件，所以另外在電平表自己身上聽；
	 * 拖曳過程中電平表可能被搬進工具列（DOM 換父層會中斷 pointer capture），所以 move／up 掛在 document 上，並沿用同一套 onMove／onUp */
	function onMeterDown ( e ) {
		var m = els.meter;
		if (!editing || !m || m.parentNode === tb || (e.button !== undefined && e.button !== 0)) return ;	/* 在工具列裡時由 onDown 處理 */
		e.preventDefault ();
		var r = m.getBoundingClientRect ();
		drag = { x: e.clientX, y: e.clientY, btn: null, cb: null, el: m, id: 'meter', moved: false, pid: e.pointerId, ox: e.clientX - r.left, oy: e.clientY - r.top };
		function up ( ev ) {
			if (!drag || ev.pointerId !== drag.pid) return ;
			d.removeEventListener ('pointermove', onMove, false);
			d.removeEventListener ('pointerup', up, false);
			d.removeEventListener ('pointercancel', up, false);
			onUp ( ev );
		}
		d.addEventListener ('pointermove', onMove, false);
		d.addEventListener ('pointerup', up, false);
		d.addEventListener ('pointercancel', up, false);
	}

	function attachMeter ( el, home ) {
		if (els.meter || !el) return ;
		els.meter = el;
		mhome = home || el.parentNode;
		el.setAttribute ('data-tbp', 'meter');
		el.__builtin = 1;
		el.addEventListener ('pointerdown', onMeterDown, false);
		/* 調整排列時，不要讓點電平表去清除削波燈 */
		el.addEventListener ('click', function ( ev ) { if (editing) { ev.stopImmediatePropagation (); ev.preventDefault (); } }, true);
		if (tb) apply ();
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
		groups = [ group ];	/* [新增] 容器池的第一個就是原本的 .pk_btngroup */

		BUILTIN.forEach ( function ( id ) { els[ id ].setAttribute ('data-tbp', id); });	/* [修改] PANELS → BUILTIN（meter 還沒建好，之後由 attachMeter 接上） */
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
		w.addEventListener ('resize', function () { placePill (); panelIds ().forEach ( posFloat ); relayout (); }, false);	/* [修改] 多呼叫 relayout () */
		/* [新增] 容器寬度變化（側欄開關等）、app 的 class 變化（多軌 pk_mt_on／手機版 pk_mob）也要重新判斷 */
		try {
			if (w.ResizeObserver && tb.parentNode) new w.ResizeObserver ( relayout ).observe ( tb.parentNode );
			/* [新增] 精簡模式放不下會折行，工具列高度跟著變 → 通知主畫面重算波形區高度（只在高度真的變了才通知） */
			if (w.ResizeObserver) { var lastH = tb.offsetHeight; new w.ResizeObserver ( function () { var h = tb.offsetHeight; if (h !== lastH) { lastH = h; queueResize (); } }).observe ( tb ); }
			if (w.MutationObserver) new w.MutationObserver ( relayout ).observe ( UI.el, { attributes: true, attributeFilter: ['class'] });
		} catch (e) {}

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

	/* [新增] 右鍵選單用的名稱：預設那幾項沿用 context.*，其餘用按鈕名稱 */
	function ctxName ( c ) { return CTXKEY[ c.id ] ? lt ( CTXKEY[ c.id ] ) : cname ( c ); }

	/* [新增] 只存檔、通知，不重排工具列（右鍵選單的變更不影響工具列版面） */
	function changedCtx () { save (); notify (); }

	/* [新增] 「右鍵選單」頁籤：左邊挑按鈕加入、右邊調整順序／移除，改完立刻生效 */
	function renderCtxTab ( box ) {
		box.appendChild ( el ('p', 'pk_tbl_hint', lt ('tbl.ctx_hint')) );
		var cols = el ('div', 'pk_tbl_cols');

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
				var nm = ctxName ( c );
				if (term && (nm + ' ' + c.id + ' ' + (c.face || '')).toLowerCase ().indexOf ( term ) < 0) return ;
				if (c.cat !== lastCat) { lastCat = c.cat; list.appendChild ( el ('div', 'pk_tbl_cat', lt ( 'tbl.cat.' + c.cat )) ); }
				var b = el ('button', 'pk_tbl_it');
				b.type = 'button';
				b.appendChild ( face ( c ) );
				b.appendChild ( el ('span', '', nm) );
				b.disabled = S.ctx.length >= MAXCTX;
				b.onclick = function () { S.ctx.push ( c.id ); changedCtx (); renderDlg (); };
				list.appendChild ( b );
			});
		}
		q.oninput = function () { dlgQ = q.value; fill (); };
		fill ();
		left.appendChild ( list );
		cols.appendChild ( left );

		var right = el ('div', 'pk_tbl_col');
		right.appendChild ( el ('div', 'pk_tbl_ct', lt ('tbl.ctx_current')) );
		var cl = el ('div', 'pk_tbl_list');
		if (!S.ctx.length) cl.appendChild ( el ('p', 'pk_tbl_hint', lt ('tbl.ctx_empty')) );
		S.ctx.forEach ( function ( k, idx ) {
			var c = CAT[ k ], r = el ('div', 'pk_tbl_cr');
			r.appendChild ( face ( c ) );
			r.appendChild ( el ('span', '', ctxName ( c )) );
			function mk ( txt, lab, dis, fn ) {
				var b = el ('button', 'pk_tbl_mini', txt);
				b.type = 'button'; b.disabled = dis;
				b.setAttribute ('aria-label', lab + ' ' + ctxName ( c ));
				b.onclick = fn;
				r.appendChild ( b );
			}
			mk ('\u2191', lt ('tbl.up'), idx === 0, function () { S.ctx.splice ( idx - 1, 0, S.ctx.splice ( idx, 1 )[0] ); changedCtx (); renderDlg (); });
			mk ('\u2193', lt ('tbl.down'), idx === S.ctx.length - 1, function () { S.ctx.splice ( idx + 1, 0, S.ctx.splice ( idx, 1 )[0] ); changedCtx (); renderDlg (); });
			mk ('\u2715', lt ('tbl.remove'), false, function () { S.ctx.splice ( idx, 1 ); changedCtx (); renderDlg (); });
			cl.appendChild ( r );
		});
		right.appendChild ( cl );
		var rs = el ('button', 'pk_tbl_b', lt ('tbl.ctx_reset'));
		rs.type = 'button';
		rs.style.marginTop = '8px';
		rs.onclick = function () { S.ctx = DEFCTX.slice (); changedCtx (); renderDlg (); };
		right.appendChild ( rs );
		cols.appendChild ( right );
		box.appendChild ( cols );
	}

	function renderDlg () {
		if (!dlg) return ;
		var box = dlg.firstChild, hadQ = d.activeElement && d.activeElement.className === 'pk_tbl_q';
		while (box.firstChild) box.removeChild ( box.firstChild );
		var cur = customOf ( dlgSel ), i;

		box.appendChild ( el ('h3', '', lt ('tbl.title')) );

		/* [新增] 頁籤：工具列／右鍵選單 */
		var tabs = el ('div', 'pk_tbl_tabs');
		tabs.setAttribute ('role', 'tablist');
		[ ['bars', 'tbl.tab.bars'], ['ctx', 'tbl.tab.ctx'] ].forEach ( function ( t ) {
			var b = el ('button', 'pk_tbl_tab', lt ( t[1] ));
			b.type = 'button';
			b.setAttribute ('role', 'tab');
			b.setAttribute ('aria-selected', dlgTab === t[0] ? 'true' : 'false');
			b.onclick = function () { if (dlgTab === t[0]) return ; dlgTab = t[0]; renderDlg (); };
			tabs.appendChild ( b );
		});
		box.appendChild ( tabs );

		if (dlgTab === 'ctx') {
			renderCtxTab ( box );
		} else {	/* [新增] 以下是原本「工具列」頁籤的內容，程式沒動，只是包進 else */

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

		}	/* [新增] else 結束 */

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
		/* [修改] 桌面版（精簡）用 S.x／S.selx：勾選＝往右多顯示；手機版沿用原本的 S.tm／S.selc */
		tmShow: function ( k ) { return isMob () ? S.tm[ k ] !== 0 : !!S.x[ k ]; },
		tmToggle: function ( k ) {
			if (k !== 't' && k !== 'h') return ;
			if (isMob ()) S.tm[ k ] = S.tm[ k ] === 0 ? 1 : 0; else S.x[ k ] = S.x[ k ] ? 0 : 1;
			changed ();
		},
		tmCompact: function () { if (isMob ()) { S.tm.t = 0; S.tm.h = 0; } else { S.x.t = 0; S.x.h = 0; } changed (); },
		selCompact: function () { return isMob () ? !!S.selc : !!S.selx; },
		selToggle: function () { if (isMob ()) S.selc = S.selc ? 0 : 1; else S.selx = S.selx ? 0 : 1; changed (); },
		lay: function () { return S.lay | 0; },	/* [新增] */
		setLay: function ( v ) { S.lay = (v === 1 || v === 2 || v === 3) ? v : 0; lastRow = null; changed (); },	/* [新增] */
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
		/* [新增] 電平表 */
		attachMeter: attachMeter,
		meterDock: function () { return S.mdock; },
		setMeterDock: function ( v ) { S.mdock = v === 'bar' ? 'bar' : 'foot'; delete S.float.meter; changed (); },
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
		/* [新增] 右鍵選單：回傳目前要顯示的項目（空的時候用預設） */
		ctxList: function () {
			var ids = S.ctx.length ? S.ctx : DEFCTX;
			return ids.map ( function ( id ) {
				var c = CAT[ id ];
				return { id: id, label: ctxName ( c ), needSel: !!CTXSEL[ id ], needClip: id === 'paste' };
			});
		},
		ctxRun: function ( id ) {
			var c = CAT[ id ];
			if (!c) return ;
			if (c.run) c.run ( PKAE );
			else if (c.ev) (UI || PKAE).fireEvent.apply ( UI || PKAE, c.ev );
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
