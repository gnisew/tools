/* ==========================================================================
 * marker-panel.js  —  標記清單（浮動視窗）
 *
 *   PKAudioEditor._deps.mrkpanel = { open, close, toggle, isOpen }
 *
 * 功能：
 *   - 列出目前（單軌或多軌）所有標記：勾選、序號、顏色、名稱、時間、段長
 *   - 點一下列 → 跳到該標記；點色點 → 變更顏色
 *   - 雙擊名稱／時間 → 直接編輯（時間格式 1:23.500）
 *   - 工具列：在游標處／選取起點／選取終點加入；刪除勾選／範圍內／全部
 *   - 「新增後立即命名」：按 M 或加入標記後直接跳出改名視窗
 *   - 鍵盤：F2 改名、Delete 刪除（勾選的，沒勾選則刪目前這個）、↑↓ 切換標記
 *   - 可拖曳標題列移動、拉右下角調整大小；位置與大小會記住
 *
 * 依賴 markers.js 的管理 API（PKAudioEditor.mrk.*）。
 * ========================================================================== */
(function ( w, d, PKAE ) {
	'use strict';

	var KEY = 'pk_mrkpanel';
	var S = {
		zh: {
			title: '標記清單', mt: '多軌', g_add: '新增', g_del: '刪除', g_edit: '編輯', g_list: '整理', more: '更多工具', c_type: '類型（點一下切換）',
			tip_cur: '在播放游標處加入標記（快捷鍵 M）', tip_in: '在選取範圍的起點加入標記', tip_out: '在選取範圍的終點加入標記', tip_mkr: '以選取範圍建立一個區間標記',
			tip_tosel: '把目前標記的區間設為選取範圍', tip_spl: '在游標處把目前標記分成兩段', tip_mrg: '把勾選的標記合併成一個（要勾選 2 個以上）', tip_miss: '找出有聲音但沒被任何標記涵蓋的地方',
			tip_del: '刪除勾選的標記（也可按 Delete）', tip_rng: '刪除選取範圍內的標記', tip_all: '刪除全部標記（會先確認，可復原）', tip_ren: '用範本一次重新命名標記（例如 段01、段02…）', tip_imp: '從 Audacity、CSV、CUE、YouTube 章節匯入', tip_exp: '匯出成 Audacity、CSV、CUE、YouTube 章節',
			cur: '＋游標處', 'in': '＋選取起點', out: '＋選取終點',
			del: '刪除勾選', rng: '刪除範圍內', all: '全部刪除',
			c_name: '名稱', c_time: '時間', c_len: '段長', c_end: '結束',
			mkr: '＋區間(選取)', tosel: '區間→選取', end_tip: '雙擊設定結束時間（留空＝點標記）', need_mk: '請先選一個標記',
			empty: '還沒有標記。按 M 在游標處加入，或在刻度尺上雙擊。',
			askname: '新增後立即命名', labels: '關閉標籤列時，在聲波上顯示標記名稱', track: '顯示標籤列（聲波上方）', opts: '設定',
			hint: '雙擊名稱、時間或備註可直接編輯 · F2 改名 · Delete 刪除',
			none_checked: '請先勾選要刪除的標記',
			need_sel: '請先在波形上選取一段範圍',
			no_audio: '沒有可加入標記的音訊',
			confirm_all: '確定刪除全部 {n} 個標記？（可用復原還原）', del_all_title: '刪除全部標記', del_all_ok: '全部刪除', cancel: '取消',
			close: '關閉', color: '變更顏色', all_ck: '全選',
			/* [階段 2] */
			c_note: '備註', ren: '批次命名', rcl: '套用循環色', tip_rcl: '把全部標記依「新增標記的顏色循環」重新配色（從第一個標記開始，可用復原還原）', rcl_done: '已重新配色 {n} 個標記', rcl_none: '顏色已經是目前的循環色', imp: '匯入…', exp: '匯出…',
			snap: '拖曳時吸附（按住 Shift 暫停）',
			ren_title: '批次重新命名', ren_label: '名稱範本', ren_ok: '套用',
			ren_hint: '{n} 序號 · {nn} 兩位序號 · {name} 原名稱 · {time} 時間',
			ren_sel: '套用到勾選的 {n} 個標記', ren_all: '套用到全部 {n} 個標記', ren_prev: '預覽：',
			ren_done: '已重新命名 {n} 個標記', ren_none: '沒有可命名的標記',
			exp_title: '匯出標記', exp_fmt: '格式', exp_ok: '匯出',
			exp_sel: '將匯出勾選的 {n} 個標記', exp_all: '將匯出全部 {n} 個標記', exp_none: '沒有可匯出的標記',
			f_aud: 'Audacity 標籤檔 (.txt)', f_csv: 'CSV 試算表 (.csv)', f_cue: 'CUE 檔 (.cue)', f_yt: 'YouTube 章節文字 (.txt)',
			imp_title: '匯入標記', imp_ask: '目前已有 {n} 個標記，要如何處理匯入的 {k} 個標記？', imp_add: '加入', imp_rep: '取代全部',
			imp_bad: '讀不到任何標記，請確認格式（Audacity 標籤、CSV、CUE、YouTube 章節）',
			imp_done: '已匯入 {n} 個標記', imp_skip: '，略過 {s} 個（超出音訊長度或重複）',
			type_tip: '類型：{t}（點一下切換：一般→章節→循環）', t_normal: '一般', t_chapter: '章節', t_loop: '循環',
				only_ch: '只匯出「章節」類型的標記（{n} 個）', follow: '剪下／貼上時標記跟著位移（單軌）',
				ripple: '多軌：刪除片段時，後面的片段與標記一起往前移（波紋）', repl_c: '單軌取代長度不同時，範圍內的標記收攏到起點', flt_all: '全部類型', flt_normal: '一般', flt_chapter: '章節', flt_loop: '循環', flt_range: '區間', flt_tip: '依類型篩選清單', empty_flt: '沒有符合篩選的標記', yt_intro: '開頭', zc: '吸附到零交越點（單軌）', sil: '吸附到靜音邊界（單軌）', spl: '分割(游標)', miss: '漏標檢查', shf: '平移後續(游標)', shf_tip: '把目前標記及其後所有標記平移，讓目前標記的起點對齊游標（右鍵選單可輸入秒數）', mrg: '合併勾選', jp: '跳到標記後自動播放（[ ] 鍵）', pm: '逐標記播放', lc: '循環／逐段重複次數（0＝無限）', ncol: '新增標記的顏色循環', ncol_u: ' 色循環', ncol_1: '1 色（桃紅）', ncol_tip: '自動分割或新增標記時，顏色輪流使用幾種。只影響之後新增的標記；只用 1 色時建議桃紅（和波形青綠互補、不撞播放線的橘色）', pm_off: '關', pm_stop: '每段播完停止', pm_next: '播完接下一段', pm_pre: '句首提前（秒）', pm_max: '每段最多播（秒，0＝不限）', need2: '請先勾選至少 2 個標記', lock: '鎖定／解除鎖定（防止誤拖）',
			/* 停靠 */
			dk_l: '停靠到左側（也可把標題列拖到畫面左邊緣）', dk_f: '浮動視窗（拖離側邊即可取消停靠）', dk_r: '停靠到右側（也可把標題列拖到畫面右邊緣）', dk_sp: '拖曳調整寬度，雙擊還原',
			cols: '顯示欄位', prec: '時間精確度', p0: '秒（0:00）', p1: '0.1 秒（0:00.0）', p2: '0.01 秒（0:00.00）', p3: '毫秒（0:00.000）', full_tip: '完整時間：'
		},
		en: {
			title: 'Markers', mt: 'Multitrack', g_add: 'Add', g_del: 'Delete', g_edit: 'Edit', g_list: 'Organize', more: 'More tools', c_type: 'Type (click to cycle)',
			tip_cur: 'Add a marker at the playback cursor (shortcut M)', tip_in: 'Add a marker at the selection start', tip_out: 'Add a marker at the selection end', tip_mkr: 'Create a range marker from the selection',
			tip_tosel: 'Select the current marker\'s range', tip_spl: 'Split the current marker in two at the cursor', tip_mrg: 'Merge the checked markers into one (check 2 or more)', tip_miss: 'Find sound that no marker covers',
			tip_del: 'Delete the checked markers (or press Delete)', tip_rng: 'Delete markers inside the selection', tip_all: 'Delete all markers (asks first, can be undone)', tip_ren: 'Rename markers with a template (e.g. Seg01, Seg02…)', tip_imp: 'Import from Audacity, CSV, CUE or YouTube chapters', tip_exp: 'Export as Audacity, CSV, CUE or YouTube chapters',
			cur: '+ Cursor', 'in': '+ Sel start', out: '+ Sel end',
			del: 'Delete checked', rng: 'Delete in range', all: 'Delete all',
			c_name: 'Name', c_time: 'Time', c_len: 'Length', c_end: 'End',
			mkr: '+ Range (sel)', tosel: 'Range → Sel', end_tip: 'Double-click to set the end time (empty = point marker)', need_mk: 'Select a marker first',
			empty: 'No markers yet. Press M to add one at the cursor, or double-click the ruler.',
			askname: 'Ask for a name when adding', labels: 'When the label track is off, show marker names on the waveform', track: 'Show label track (above the waveform)', opts: 'Options',
			hint: 'Double-click a name, time or note to edit · F2 rename · Delete remove',
			none_checked: 'Check the markers you want to delete first',
			need_sel: 'Select a range on the waveform first',
			no_audio: 'No audio to add markers to',
			confirm_all: 'Delete all {n} markers? (You can undo this)', del_all_title: 'Delete All Markers', del_all_ok: 'Delete All', cancel: 'Cancel',
			close: 'Close', color: 'Change color', all_ck: 'Select all',
			/* [stage 2] */
			c_note: 'Note', ren: 'Batch rename', rcl: 'Apply color cycle', tip_rcl: 'Recolor all markers using the current "New-marker color cycle" (from the first marker; undoable)', rcl_done: 'Recolored {n} markers', rcl_none: 'Colors already match the current cycle', imp: 'Import…', exp: 'Export…',
			snap: 'Snap while dragging (hold Shift to bypass)',
			ren_title: 'Batch Rename Markers', ren_label: 'Name template', ren_ok: 'Apply',
			ren_hint: '{n} number · {nn} 2-digit number · {name} old name · {time} time',
			ren_sel: 'Applies to the {n} checked markers', ren_all: 'Applies to all {n} markers', ren_prev: 'Preview: ',
			ren_done: 'Renamed {n} markers', ren_none: 'No markers to rename',
			exp_title: 'Export Markers', exp_fmt: 'Format', exp_ok: 'Export',
			exp_sel: 'Exports the {n} checked markers', exp_all: 'Exports all {n} markers', exp_none: 'No markers to export',
			f_aud: 'Audacity labels (.txt)', f_csv: 'CSV spreadsheet (.csv)', f_cue: 'CUE sheet (.cue)', f_yt: 'YouTube chapters (text)',
			imp_title: 'Import Markers', imp_ask: 'There are already {n} markers. What should be done with the {k} imported markers?', imp_add: 'Add', imp_rep: 'Replace all',
			imp_bad: 'No markers found. Check the format (Audacity labels, CSV, CUE, YouTube chapters)',
			imp_done: 'Imported {n} markers', imp_skip: ', skipped {s} (beyond audio length or duplicates)',
			type_tip: 'Type: {t} (click to cycle: Normal → Chapter → Loop)', t_normal: 'Normal', t_chapter: 'Chapter', t_loop: 'Loop',
				only_ch: 'Export only Chapter-type markers ({n})', follow: 'Markers follow cut / paste edits (single track)',
				ripple: 'Multitrack: deleting a clip moves later clips and markers earlier (ripple)', repl_c: 'Single track: when a replace changes length, collapse markers in the range to its start', flt_all: 'All types', flt_normal: 'Normal', flt_chapter: 'Chapter', flt_loop: 'Loop', flt_range: 'Range', flt_tip: 'Filter the list by type', empty_flt: 'No markers match the filter', yt_intro: 'Intro', zc: 'Snap to zero crossings (single track)', sil: 'Snap to silence edges (single track)', spl: 'Split (cursor)', miss: 'Check Missing', shf: 'Shift Later (cursor)', shf_tip: 'Shift the active marker and all later ones so the active marker starts at the cursor (right-click menu lets you enter seconds)', mrg: 'Merge checked', jp: 'Play automatically after jumping to a marker ([ ] keys)', pm: 'Play by marker', lc: 'Loop / per-section repeat count (0 = unlimited)', ncol: 'New-marker color cycle', ncol_u: '-color cycle', ncol_1: '1 color (magenta)', ncol_tip: 'How many colors new markers (and auto-split) rotate through. Only affects markers added afterwards. With 1 color, magenta is recommended: it is complementary to the teal waveform and does not clash with the orange play line.', pm_off: 'Off', pm_stop: 'Stop after each section', pm_next: 'Continue to next section', pm_pre: 'Lead-in before start (s)', pm_max: 'Max seconds per section (0 = no limit)', need2: 'Check at least 2 markers first', lock: 'Lock / unlock (prevents accidental drags)',
			/* dock */
			dk_l: 'Dock to the left (or drag the title bar to the left edge)', dk_f: 'Floating window (drag it away from the side to undock)', dk_r: 'Dock to the right (or drag the title bar to the right edge)', dk_sp: 'Drag to resize, double-click to reset',
			cols: 'Columns', prec: 'Time precision', p0: 'Seconds (0:00)', p1: '0.1 s (0:00.0)', p2: '0.01 s (0:00.00)', p3: 'Milliseconds (0:00.000)', full_tip: 'Exact time: '
		}
	};

	function T ( key, vars ) {
		var l = '';
		try { l = PKLocale.getLang () || ''; } catch (e) {}
		var s = (S[ /^(zh|kasu|hak)/i.test (l) ? 'zh' : 'en' ][ key ]) || S.en[ key ] || key;
		if (vars) s = s.replace (/\{(\w+)\}/g, function ( m, n ) { return vars[n] === undefined ? m : vars[n]; });
		return s;
	}

	function esc ( s ) {
		return String (s).replace (/[&<>"]/g, function ( c ) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; });
	}

	var CSS =
		'.pk_mp{position:fixed;z-index:12;top:90px;right:16px;width:410px;height:360px;min-width:290px;min-height:200px;max-width:96vw;max-height:92vh;' +
		'resize:both;overflow:hidden;display:flex;flex-direction:column;background:var(--bg-2);color:var(--fg-0);' +
		'border:1px solid var(--bd-h);border-radius:var(--r-lg);box-shadow:0 10px 30px rgba(0,0,0,.5);font:12px/1.4 var(--ff);outline:0}' +
		'.pk_mp_h{display:flex;align-items:center;padding:7px 10px;background:var(--bg-3);cursor:move;touch-action:none;user-select:none;-webkit-user-select:none}' +
		'.pk_mp_h b{flex:1;font-weight:600;letter-spacing:.3px}' +
		'.pk_mp_h em{font-style:normal;color:var(--fg-2);margin-left:8px;font-size:11px}' +
		'.pk_mp_x{cursor:pointer;padding:0 6px;font-size:16px;line-height:18px;color:var(--fg-1)}.pk_mp_x:hover{color:var(--fg-0)}' +
		'.pk_mp_tb{display:flex;flex-direction:column;gap:5px;padding:6px 8px;border-bottom:1px solid var(--bd)}' +
		'.pk_mp_g{display:flex;flex-wrap:wrap;align-items:center;gap:4px}' +
		'.pk_mp_gl{flex:0 0 34px;color:var(--fg-2);font-size:11px}' +
		'.pk_mp_mb{margin-left:auto;font:inherit;color:var(--fg-1);background:transparent;border:0;padding:3px 4px;cursor:pointer}.pk_mp_mb:hover{color:var(--fg-0)}' +
		'.pk_mp_more{display:none;flex-direction:column;gap:5px}.pk_mp_tb.pk_more .pk_mp_more{display:flex}' +
		'.pk_mp_tb a.off{opacity:.45}' +
		'.pk_mp_tb a{cursor:pointer;padding:3px 8px;border:1px solid var(--bd);border-radius:var(--r-md);background:var(--bg-1);color:var(--fg-0);white-space:nowrap;user-select:none}' +
		'.pk_mp_tb a:hover{border-color:var(--bd-h)}.pk_mp_tb a.dg{color:var(--rec)}' +
		'.pk_mp_tb select{padding:2px 4px;border:1px solid var(--bd);border-radius:var(--r-md);background:var(--bg-1);color:var(--fg-0);font:inherit}' +
		'.pk_mp_l{flex:1;overflow:auto;min-height:0}' +
		'.pk_mp_l table{width:100%;border-collapse:collapse}' +
		'.pk_mp_l th{position:sticky;top:0;background:var(--bg-2);text-align:left;font-weight:500;color:var(--fg-2);padding:4px 6px;border-bottom:1px solid var(--bd);z-index:1}' +
		'.pk_mp_l td{padding:3px 6px;border-bottom:1px solid var(--bd-s);white-space:nowrap}' +
		'.pk_mp_l tr.r{cursor:pointer}.pk_mp_l tr.r:hover{background:var(--bg-3)}' +
		'.pk_mp_l tr.act{background:var(--ac-soft)}' +
		'.pk_mp_l td.c{width:22px}.pk_mp_l td.n{width:26px;color:var(--fg-2);text-align:right}.pk_mp_l td.k{width:22px}' +
		'.pk_mp_l td.nm{max-width:130px;overflow:hidden;text-overflow:ellipsis;width:100%}' +
		'.pk_mp_l td.nt{max-width:150px;min-width:60px;overflow:hidden;text-overflow:ellipsis;color:var(--fg-1)}' +
		'.pk_mp_l td.tm,.pk_mp_l td.ln,.pk_mp_l td.en{font-family:var(--ff-mono);font-size:11px}.pk_mp_l td.ln{color:var(--fg-2)}' +
		'.pk_mp_l input[type=checkbox]{margin:0;vertical-align:middle;accent-color:var(--ac)}' +
		'.pk_mp_dot{display:inline-block;width:12px;height:12px;border-radius:50%;vertical-align:middle;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(0,0,0,.4)}' +
		'.pk_mp_l input.ed{width:100%;box-sizing:border-box;min-width:0;background:var(--bg-0);color:var(--fg-0);border:1px solid var(--ac);border-radius:2px;padding:1px 4px;font:inherit}' +
		'.pk_mp_e{padding:18px 12px;color:var(--fg-2);text-align:center;white-space:normal}' +
		'.pk_mp_f{padding:6px 10px;border-top:1px solid var(--bd);display:flex;flex-direction:column;gap:3px;color:var(--fg-1)}' +
		'.pk_mp_f label{display:flex;align-items:center;gap:6px;cursor:pointer}.pk_mp_f input{margin:0;accent-color:var(--ac)}' +
		'.pk_mp_f small{color:var(--fg-2);font-size:10px}' +
		'.pk_mp_oh{display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
		'.pk_mp_ob{font:inherit;color:var(--fg-1);background:var(--bg-2);border:1px solid var(--bd);border-radius:4px;padding:2px 10px;cursor:pointer}.pk_mp_ob:hover{border-color:var(--ac);color:var(--fg-0)}' +
		'.pk_mp_o{display:none;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:3px 14px;margin-top:6px;max-height:34vh;overflow:auto}' +
		'.pk_mp_f.pk_open .pk_mp_o{display:grid}' +
		'.pk_mp_cg{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:3px 12px}' +
		'.pk_mp_l.hd_tm .tm,.pk_mp_l.hd_en .en,.pk_mp_l.hd_ln .ln,.pk_mp_l.hd_nt .nt{display:none}' +
		'.pk_mp_dks{display:flex;gap:2px;margin-left:8px}' +
		'.pk_mp_dk{cursor:pointer;padding:3px 4px;line-height:0;color:var(--fg-2);border-radius:3px}.pk_mp_dk:hover{color:var(--fg-0);background:var(--bg-2)}.pk_mp_dk.on{color:var(--ac)}' +
		/* 停靠：貼在工具列下方、畫面左／右側；其餘區塊用 margin 讓出空間（見 body.pk_mpd_*） */
		'.pk_mp.pk_dk{box-sizing:border-box;bottom:0;height:auto;min-height:0;max-width:none;max-height:none;resize:none;border-radius:0;box-shadow:none}' +
		'.pk_mp.pk_dkl{left:0;right:auto;border-width:0 1px 0 0}.pk_mp.pk_dkr{right:0;left:auto;border-width:0 0 0 1px}' +
		'.pk_mp_sp{display:none;position:absolute;top:0;bottom:0;width:6px;z-index:3;cursor:ew-resize;touch-action:none}' +
		'.pk_mp_sp:hover,.pk_mp_sp.on{background:var(--ac);opacity:.55}' +
		'.pk_dkr .pk_mp_sp{display:block;left:0}.pk_dkl .pk_mp_sp{display:block;right:0}' +
		'body.pk_mpd_l #app>:not(.pk_hdr):not(.pk_tbc):not(.pk_ttip){margin-left:var(--pk_mpw)}' +
		'body.pk_mpd_r #app>:not(.pk_hdr):not(.pk_tbc):not(.pk_ttip){margin-right:var(--pk_mpw)}' +
		'body.pk_mpd_l #app>.pk_dck,body.pk_mpd_r #app>.pk_dck{width:auto}' +
		'.pk_mp_drop{position:fixed;z-index:11;display:none;pointer-events:none;box-sizing:border-box;background:var(--ac-soft);border:2px dashed var(--ac)}' +
		'@media (max-width:600px){.pk_mp{left:2vw;right:2vw;width:auto;top:70px}}';

	var el = null, body = null, titleEl = null, boxEl = null, headCk = null;
	var FLT_KEY = 'pk_mrkpanel_flt', FLTS = ['all', 'normal', 'chapter', 'loop', 'range'];
	var flt = (function () { try { var v = w.localStorage.getItem (FLT_KEY); return FLTS.indexOf (v) > -1 ? v : 'all'; } catch (e) { return 'all'; } })();
	function match ( x ) {
		return flt === 'all' || (flt === 'range' ? x.end > x.time : flt === 'normal' ? !x.type : x.type === flt);
	}
	var checked = {}, sig = '', lastAct = null, editing = false, timer = 0, raf = 0, open_ = false;

	function M () { return PKAE.mrk; }

	function loadPos () {
		try { return JSON.parse (w.localStorage.getItem (KEY) || 'null'); } catch (e) { return null; }
	}

	/* ======================================================================
	 * 停靠（dock）：'f' 浮動、'l' 左側、'r' 右側
	 *   - 停靠時面板貼在工具列下方、畫面邊緣；波形、頁尾等區塊用 margin 讓出同樣寬度，
	 *     再送一次 RequestResize 讓波形重新計算寬度。
	 *   - 把標題列拖到畫面左／右邊緣放開＝停靠；停靠後把標題列拖離邊緣＝變回浮動視窗。
	 *   - 視窗太窄（<= 760px，手機）不停靠，維持浮動；變寬後自動恢復。
	 * ====================================================================== */
	var DK_KEY = 'pk_mp_dock', DW_KEY = 'pk_mp_dw', DW_DEF = 420, EDGE = 72;
	var mode = (function () { try { var v = w.localStorage.getItem (DK_KEY); return v === 'l' || v === 'r' ? v : 'f'; } catch (e) { return 'f'; } })();
	var dw = (function () { try { var v = parseInt (w.localStorage.getItem (DW_KEY), 10); return v > 0 ? v : DW_DEF; } catch (e) { return DW_DEF; } })();
	var fl = null, applied = 'f', dropEl = null, lastTop = -1, lastW = -1;

	function canDock () { return w.innerWidth > 760; }
	function curMode () { return canDock () ? mode : 'f'; }
	function dockW () { return Math.max (240, Math.min (dw, w.innerWidth - 480, 760)); }
	function topPx () {
		var t = d.querySelector ('#app .pk_tbc'), r = t && t.getBoundingClientRect ();
		return r ? Math.max (0, Math.round (r.bottom)) : 0;
	}
	function fireResize () { PKAE.fireEvent ('RequestResize'); }
	function floatRect () { var r = el.getBoundingClientRect (); return {x: r.left, y: r.top, w: r.width, h: r.height}; }

	function savePos () {
		if (!el || applied !== 'f' || !open_) return ;
		var r = el.getBoundingClientRect ();
		try { w.localStorage.setItem (KEY, JSON.stringify ({x: r.left, y: r.top, w: r.width, h: r.height})); } catch (e) {}
	}

	function clamp () {
		var r = el.getBoundingClientRect (), x = r.left, y = r.top;
		x = Math.max (0, Math.min (w.innerWidth - 60, x));
		y = Math.max (0, Math.min (w.innerHeight - 40, y));
		el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.right = 'auto';
	}

	/* 停靠時：位置（貼著工具列下緣）、寬度，以及其他區塊要讓出的寬度 */
	function layoutDock ( force ) {
		if (!el || applied === 'f') return ;
		var t = topPx (), wd = dockW ();
		if (!force && t === lastTop && wd === lastW) return ;
		lastTop = t; lastW = wd;
		el.style.top = t + 'px';
		el.style.width = wd + 'px';
		d.documentElement.style.setProperty ('--pk_mpw', wd + 'px');
	}

	/* 依目前模式套用外觀；open_ 為 false 時不佔版面 */
	function applyMode () {
		if (!el) return ;
		var m = open_ ? curMode () : 'f', b = d.body, prev = applied;
		b.classList.toggle ('pk_mpd_l', m === 'l');
		b.classList.toggle ('pk_mpd_r', m === 'r');
		el.classList.toggle ('pk_dk', m !== 'f');
		el.classList.toggle ('pk_dkl', m === 'l');
		el.classList.toggle ('pk_dkr', m === 'r');
		applied = m;
		lastTop = lastW = -1;
		if (m === 'f') {
			el.style.height = el.style.width = el.style.left = el.style.top = '';
			el.style.right = '';
			if (fl) {
				el.style.width = Math.max (290, fl.w || 410) + 'px';
				el.style.height = Math.max (200, fl.h || 360) + 'px';
				el.style.left = fl.x + 'px'; el.style.top = fl.y + 'px'; el.style.right = 'auto';
			}
			if (open_) clamp ();
			d.documentElement.style.removeProperty ('--pk_mpw');
		}
		else {
			el.style.left = el.style.right = el.style.height = '';
			layoutDock (true);
		}
		var bs = el.querySelectorAll ('.pk_mp_dk'), i;
		for (i = 0; i < bs.length; ++i) bs[i].classList.toggle ('on', bs[i].getAttribute ('data-d') === m);
		if (prev !== m) fireResize ();
	}

	function setMode ( m ) {
		if (m !== 'f' && m !== 'l' && m !== 'r') return ;
		if (el && applied === 'f' && m !== 'f' && open_) { fl = floatRect (); savePos (); }
		mode = m;
		try { w.localStorage.setItem (DK_KEY, m); } catch (e) {}
		if (el && open_) applyMode ();
	}

	function showDrop ( z ) {
		if (!dropEl) { dropEl = d.createElement ('div'); dropEl.className = 'pk_mp_drop'; d.body.appendChild (dropEl); }
		if (!z) { dropEl.style.display = 'none'; return ; }
		var wd = dockW (), t = topPx ();
		dropEl.style.cssText = 'display:block;top:' + t + 'px;bottom:0;width:' + wd + 'px;' + (z === 'l' ? 'left:0' : 'right:0');
	}

	/* 欄位顯示與時間精確度（預設：只顯示「時間」「結束」，時間只到秒） */
	var COL_KEY = 'pk_mp_cols', PREC_KEY = 'pk_mp_prec', COLS = ['tm', 'en', 'ln', 'nt'];
	var cols = (function () {
		var o = {tm: 1, en: 1, ln: 0, nt: 0};
		try { var v = JSON.parse (w.localStorage.getItem (COL_KEY) || 'null'); if (v) COLS.forEach (function ( k ) { if (k in v) o[k] = v[k] ? 1 : 0; }); } catch (e) {}
		return o;
	})();
	var prec = (function () { try { var v = parseInt (w.localStorage.getItem (PREC_KEY), 10); return v >= 0 && v <= 3 ? v : 0; } catch (e) { return 0; } })();

	/* 清單顯示用的時間（依 prec 截到第幾位，不四捨五入進位）；編輯時仍用 markers 的完整毫秒格式 */
	function dfmt ( s ) {
		s = isFinite (s) && s > 0 ? s : 0;
		var ms = Math.round (s * 1000), h = (ms / 3600000) >> 0, m, sec, f = '';
		ms -= h * 3600000;
		m = (ms / 60000) >> 0; ms -= m * 60000;
		sec = (ms / 1000) >> 0; ms -= sec * 1000;
		if (prec) f = '.' + ('00' + ms).slice (-3).slice (0, prec);
		return (h ? h + ':' + p2 (m) : m) + ':' + p2 (sec) + f;
	}
	function applyCols () {
		if (!boxEl) return ;
		COLS.forEach ( function ( k ) { boxEl.classList.toggle ('hd_' + k, !cols[k]); });
	}

	function btn ( a, cls ) {
		return '<a data-a="' + a + '"' + (cls ? ' class="' + cls + '"' : '') + ' title="' + esc (T ('tip_' + a)) + '">' + esc (T (a)) + '</a>';
	}

	var DK_SVG = {
		l: '<rect x="1" y="1" width="5" height="10" fill="currentColor"/>',
		r: '<rect x="10" y="1" width="5" height="10" fill="currentColor"/>',
		f: '<rect x="4.5" y="3.5" width="7" height="5" fill="none" stroke="currentColor"/>'
	};
	function dkBtn ( k ) {
		return '<a class="pk_mp_dk" data-d="' + k + '" title="' + esc (T ('dk_' + k)) + '"><svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true"><rect x=".5" y=".5" width="15" height="11" rx="1.5" fill="none" stroke="currentColor"/>' + DK_SVG[k] + '</svg></a>';
	}

	function build () {
		if (!d.getElementById ('pk_mp_css')) {
			var st = d.createElement ('style');
			st.id = 'pk_mp_css';
			st.textContent = CSS;
			d.head.appendChild (st);
		}
		el = d.createElement ('div');
		el.className = 'pk_mp';
		el.tabIndex = -1;
		el.innerHTML =
			'<div class="pk_mp_h"><b></b><span class="pk_mp_dks">' + dkBtn ('l') + dkBtn ('f') + dkBtn ('r') + '</span><a class="pk_mp_x" title="' + esc (T ('close')) + '">&times;</a></div>' +
			'<div class="pk_mp_tb">' +
				'<div class="pk_mp_g"><span class="pk_mp_gl">' + esc (T ('g_add')) + '</span>' + btn ('cur') + btn ('in') + btn ('out') + btn ('mkr') + '</div>' +
				'<div class="pk_mp_g"><span class="pk_mp_gl">' + esc (T ('g_del')) + '</span>' + btn ('del', 'dg') + btn ('rng', 'dg') + btn ('all', 'dg') + '<button type="button" class="pk_mp_mb" aria-expanded="false">' + esc (T ('more')) + ' \u25B8</button></div>' +
				'<div class="pk_mp_more">' +
					'<div class="pk_mp_g"><span class="pk_mp_gl">' + esc (T ('g_edit')) + '</span>' + btn ('spl') + btn ('mrg') + '<a data-a="shf" title="' + esc (T ('shf_tip')) + '">' + esc (T ('shf')) + '</a>' + btn ('tosel') + btn ('miss') + '</div>' +
					'<div class="pk_mp_g"><span class="pk_mp_gl">' + esc (T ('g_list')) + '</span>' + btn ('ren') + btn ('rcl') + btn ('imp') + btn ('exp') +
						'<select class="flt" title="' + esc (T ('flt_tip')) + '">' + FLTS.map ( function ( k ) { return '<option value="' + k + '"' + (k === flt ? ' selected' : '') + '>' + esc (T ('flt_' + k)) + '</option>'; }).join ('') + '</select></div>' +
				'</div>' +
			'</div>' +
			'<div class="pk_mp_l"><table><thead><tr><th class="c"><input type="checkbox" class="hck" title="' + esc (T ('all_ck')) + '"></th><th>#</th><th></th><th>' + esc (T ('c_name')) + '</th><th class="tm">' + esc (T ('c_time')) + '</th><th class="en">' + esc (T ('c_end')) + '</th><th class="ln">' + esc (T ('c_len')) + '</th><th class="nt">' + esc (T ('c_note')) + '</th><th title="' + esc (T ('c_type')) + '">\u25C7</th><th title="' + esc (T ('lock')) + '">\uD83D\uDD12</th></tr></thead><tbody></tbody></table><div class="pk_mp_e" style="display:none">' + esc (T ('empty')) + '</div></div>' +
			'<div class="pk_mp_f"><div class="pk_mp_oh"><button type="button" class="pk_mp_ob" aria-expanded="false">\u2699 ' + esc (T ('opts')) + ' \u25B8</button><small>' + esc (T ('hint')) + '</small></div><div class="pk_mp_o"><div class="pk_mp_cg"><span>' + esc (T ('cols')) + '</span><label><input type="checkbox" class="cc" data-c="tm">' + esc (T ('c_time')) + '</label><label><input type="checkbox" class="cc" data-c="en">' + esc (T ('c_end')) + '</label><label><input type="checkbox" class="cc" data-c="ln">' + esc (T ('c_len')) + '</label><label><input type="checkbox" class="cc" data-c="nt">' + esc (T ('c_note')) + '</label></div><label>' + esc (T ('prec')) + ' <select class="prc"><option value="0">' + esc (T ('p0')) + '</option><option value="1">' + esc (T ('p1')) + '</option><option value="2">' + esc (T ('p2')) + '</option><option value="3">' + esc (T ('p3')) + '</option></select></label><label><input type="checkbox" class="jpl">' + esc (T ('jp')) + '</label><label>' + esc (T ('pm')) + ' <select class="pmm"><option value="off">' + esc (T ('pm_off')) + '</option><option value="stop">' + esc (T ('pm_stop')) + '</option><option value="next">' + esc (T ('pm_next')) + '</option></select></label><label>' + esc (T ('pm_pre')) + ' <input type="number" class="pmp" min="0" max="5" step="0.1" style="width:64px"></label><label>' + esc (T ('pm_max')) + ' <input type="number" class="pmx" min="0" max="600" step="1" style="width:64px"></label><label>' + esc (T ('lc')) + ' <input type="number" class="lpc" min="0" max="99" step="1" style="width:64px"></label><label title="' + esc (T ('ncol_tip')) + '">' + esc (T ('ncol')) + ' <select class="ncs">' + [1, 2, 3, 4, 5, 6].map ( function ( n ) { return '<option value="' + n + '">' + (n === 1 ? esc (T ('ncol_1')) : n + esc (T ('ncol_u'))) + '</option>'; }).join ('') + '</select></label><label><input type="checkbox" class="trk">' + esc (T ('track')) + '</label><label><input type="checkbox" class="lbs">' + esc (T ('labels')) + '</label><label><input type="checkbox" class="ask">' + esc (T ('askname')) + '</label><label><input type="checkbox" class="flw">' + esc (T ('follow')) + '</label><label><input type="checkbox" class="snp">' + esc (T ('snap')) + '</label><label><input type="checkbox" class="zcs">' + esc (T ('zc')) + '</label><label><input type="checkbox" class="sls">' + esc (T ('sil')) + '</label><label><input type="checkbox" class="rpl">' + esc (T ('ripple')) + '</label><label><input type="checkbox" class="rcl">' + esc (T ('repl_c')) + '</label></div></div>';
		d.body.appendChild (el);

		titleEl = el.querySelector ('.pk_mp_h b');
		body = el.querySelector ('tbody');
		boxEl = el.querySelector ('.pk_mp_l');
		headCk = el.querySelector ('.hck');

		var sp = d.createElement ('div');
		sp.className = 'pk_mp_sp';
		sp.title = T ('dk_sp');
		el.appendChild (sp);

		fl = loadPos ();

		bindDrag ();
		bindSplitter ( sp );
		bindEvents ();
	}

	function bindDrag () {
		var hd = el.querySelector ('.pk_mp_h');

		hd.addEventListener ('pointerdown', function ( e ) {
			if ((e.button !== undefined && e.button !== 0) || (e.target.closest && e.target.closest ('.pk_mp_x,.pk_mp_dk'))) return ;
			e.preventDefault ();
			var sx = e.clientX, sy = e.clientY, r0 = el.getBoundingClientRect (), started = applied === 'f', dx = sx - r0.left, dy = sy - r0.top, zone = null;
			try { hd.setPointerCapture (e.pointerId); } catch (er) {}

			/* 停靠中的面板：滑鼠移動超過幾個像素才「拖出來」，單純點一下標題列不會取消停靠 */
			function begin () {
				var g = fl || {w: 410, h: 360}, fw = Math.max (290, g.w || 410), fh = Math.max (200, Math.min (g.h || 360, w.innerHeight - 40));
				dx = Math.max (24, Math.min (fw - 70, (sx - r0.left) / Math.max (1, r0.width) * fw));
				dy = 14;
				fl = {x: sx - dx, y: sy - dy, w: fw, h: fh};
				setMode ('f');
				started = true;
			}
			function move ( ev ) {
				if (!started) {
					if (Math.abs (ev.clientX - sx) + Math.abs (ev.clientY - sy) < 6) return ;
					begin ();
				}
				el.style.left = Math.max (0, Math.min (w.innerWidth - 60, ev.clientX - dx)) + 'px';
				el.style.top = Math.max (0, Math.min (w.innerHeight - 40, ev.clientY - dy)) + 'px';
				el.style.right = 'auto';
				zone = canDock () ? (ev.clientX < EDGE ? 'l' : ev.clientX > w.innerWidth - EDGE ? 'r' : null) : null;
				showDrop (zone);
			}
			function up () {
				hd.removeEventListener ('pointermove', move);
				hd.removeEventListener ('pointerup', up);
				hd.removeEventListener ('pointercancel', up);
				try { hd.releasePointerCapture (e.pointerId); } catch (er) {}
				showDrop (null);
				if (started && zone) setMode (zone);
				else savePos ();
			}
			hd.addEventListener ('pointermove', move);
			hd.addEventListener ('pointerup', up);
			hd.addEventListener ('pointercancel', up);
		});

		hd.querySelector ('.pk_mp_dks').addEventListener ('click', function ( e ) {
			var a = e.target.closest && e.target.closest ('.pk_mp_dk');
			if (a) setMode (a.getAttribute ('data-d'));
		});

		el.addEventListener ('pointerup', function () { savePos (); });	/* 拉右下角調整大小後也記住（只記浮動狀態） */
	}

	/* 停靠時，面板靠內側邊緣的細條：拖曳調整寬度，雙擊還原 */
	function bindSplitter ( sp ) {
		sp.addEventListener ('pointerdown', function ( e ) {
			if (e.button !== undefined && e.button !== 0) return ;
			e.preventDefault ();
			e.stopPropagation ();
			sp.classList.add ('on');
			try { sp.setPointerCapture (e.pointerId); } catch (er) {}
			var raf = 0;
			function move ( ev ) {
				dw = Math.round (applied === 'r' ? w.innerWidth - ev.clientX : ev.clientX);
				dw = Math.max (240, Math.min (dw, w.innerWidth - 480, 760));
				layoutDock ();
				if (!raf) raf = w.requestAnimationFrame (function () { raf = 0; fireResize (); });
			}
			function up () {
				sp.removeEventListener ('pointermove', move);
				sp.removeEventListener ('pointerup', up);
				sp.removeEventListener ('pointercancel', up);
				sp.classList.remove ('on');
				try { sp.releasePointerCapture (e.pointerId); } catch (er) {}
				try { w.localStorage.setItem (DW_KEY, String (dw)); } catch (er) {}
				fireResize ();
			}
			sp.addEventListener ('pointermove', move);
			sp.addEventListener ('pointerup', up);
			sp.addEventListener ('pointercancel', up);
		});
		sp.addEventListener ('dblclick', function () {
			dw = DW_DEF;
			try { w.localStorage.removeItem (DW_KEY); } catch (er) {}
			layoutDock ();
			fireResize ();
		});
	}

	function ids () {
		return M ().list ().map (function ( m ) { return m.id; });
	}

	function visIds () {
		return M ().list ().filter (match).map (function ( m ) { return m.id; });
	}

	function checkedIds () {
		return ids ().filter ( function ( id ) { return checked[ id ]; });
	}

	function noAudio () { OneUp (T ('no_audio'), 1300); }

	function doAction ( a ) {
		var m = M (), r = m.region ? m.region () : null, n, list;
		if (a === 'cur') { if (!m.addCursor ()) noAudio (); }
		else if (a === 'in' || a === 'out') {
			if (!r) { OneUp (T ('need_sel'), 1300); return ; }
			if (!m.addAt (a === 'in' ? r.start : r.end)) noAudio ();
		}
		else if (a === 'del') {
			list = checkedIds ();
			if (!list.length) { OneUp (T ('none_checked'), 1300); return ; }
			checked = {};
			m.removeMany (list);
		}
		else if (a === 'rng') {
			if (!r) { OneUp (T ('need_sel'), 1300); return ; }
			m.removeRange (r.start, r.end);
		}
		else if (a === 'all') {
			n = m.list ().length;
			if (!n) return ;
			confirmUi (T ('del_all_title'), T ('confirm_all', {n: n}), T ('del_all_ok'), function () { checked = {}; m.clear (); });
		}
		else if (a === 'mkr') { if (!m.addRangeFromSelection ()) { OneUp (r ? T ('no_audio') : T ('need_sel'), 1300); } }
		else if (a === 'tosel') { if (m.active ()) m.selectRange (m.active ()); else OneUp (T ('need_mk'), 1300); }
		else if (a === 'spl') { if (m.split () === false && !m.duration ()) noAudio (); }
		else if (a === 'mrg') {
			list = checkedIds ();
			if (list.length < 2) { OneUp (T ('need2'), 1300); return ; }
			if (m.merge (list)) checked = {};
		}
		else if (a === 'miss') m.checkMissing ();
		else if (a === 'shf') { if (m.shiftFrom () === false && !m.duration ()) noAudio (); }
		else if (a === 'ren') batchRename ();
		else if (a === 'rcl') { var rn = m.recolorAll (); OneUp (rn ? T ('rcl_done', {n: rn}) : T ('rcl_none'), 1500); }
		else if (a === 'imp') importUi ();
		else if (a === 'exp') exportUi ();
	}

	/* ======================================================================
	 * [階段 2] 匯入／匯出：Audacity 標籤、CSV、CUE、YouTube 章節
	 * 轉換函式都是純函式（list ↔ 文字），方便單獨測試。
	 * list 項目：{time(秒), name, note?, color?}
	 * ====================================================================== */
	function p2 ( n ) { n = String (n); return n.length < 2 ? '0' + n : n; }
	function secStr ( s ) { return (Math.round (Math.max (0, s) * 1000000) / 1000000).toFixed (6); }
	function hms ( s, ms ) {		/* 秒 → m:ss 或 h:mm:ss（YouTube 章節用，無小數） */
		s = Math.floor (Math.max (0, s) + 1e-9);
		var h = (s / 3600) >> 0, m = ((s % 3600) / 60) >> 0, c = s % 60;
		return h ? h + ':' + p2 (m) + ':' + p2 (c) : m + ':' + p2 (c);
	}
	function csvq ( s ) {
		s = String (s === undefined || s === null ? '' : s);
		return /[",\r\n]/.test (s) ? '"' + s.replace (/"/g, '""') + '"' : s;
	}
	function cueFrames ( s ) {		/* 秒 → mm:ss:ff（75 格／秒） */
		var f = Math.round (Math.max (0, s) * 75), m = (f / 4500) >> 0;
		f -= m * 4500;
		return p2 (m) + ':' + p2 ((f / 75) >> 0) + ':' + p2 (f % 75);
	}
	function cueq ( s ) { return String (s || '').replace (/"/g, "'").replace (/[\r\n]+/g, ' '); }

	var FMT = {
		aud: {ext: 'txt', mime: 'text/plain'},
		csv: {ext: 'csv', mime: 'text/csv'},
		cue: {ext: 'cue', mime: 'text/plain'},
		yt:  {ext: 'txt', mime: 'text/plain'}
	};

	function toText ( fmt, list, o ) {
		o = o || {};
		var out = [], i, x, len, dur = o.duration || 0, nx;
		if (fmt === 'aud') {
			for (i = 0; i < list.length; ++i)
				out.push (secStr (list[i].time) + '\t' + secStr (list[i].end > list[i].time ? list[i].end : list[i].time) + '\t' + String (list[i].name).replace (/[\r\n\t]+/g, ' '));
			return out.join ('\n') + (out.length ? '\n' : '');
		}
		if (fmt === 'csv') {
			out.push ('#,Name,Time,Seconds,Length,Color,Note,Type,End');
			for (i = 0; i < list.length; ++i) {
				x = list[i];
				nx = i + 1 < list.length ? list[i + 1].time : dur;
				len = x.end > x.time ? x.end - x.time : nx > x.time ? nx - x.time : 0;
				out.push ([i + 1, csvq (x.name), o.fmt ? o.fmt (x.time) : secStr (x.time), secStr (x.time),
					len ? secStr (len) : '', x.color || '', csvq (x.note || ''), x.type || '', x.end > x.time ? secStr (x.end) : ''].join (','));
			}
			return '﻿' + out.join ('\r\n') + '\r\n';
		}
		if (fmt === 'cue') {
			out.push ('REM GENERATED BY SOUNDIT');
			out.push ('TITLE "' + cueq (o.title || 'Soundit') + '"');
			out.push ('FILE "' + cueq (o.file || 'audio.wav') + '" WAVE');
			for (i = 0; i < list.length; ++i) {
				out.push ('  TRACK ' + p2 (i + 1) + ' AUDIO');
				out.push ('    TITLE "' + cueq (list[i].name) + '"');
				if (list[i].note) out.push ('    REM COMMENT "' + cueq (list[i].note) + '"');
				out.push ('    INDEX 01 ' + cueFrames (list[i].time));
			}
			return out.join ('\r\n') + '\r\n';
		}
		if (fmt === 'yt') {
			/* YouTube 規定第一個章節必須是 0:00，所以第一個標記不在開頭時自動補一行 */
			if (list.length && list[0].time >= 1) out.push ('0:00 ' + (o.intro || 'Intro'));
			for (i = 0; i < list.length; ++i)
				out.push ((i === 0 && list[0].time < 1 ? '0:00' : hms (list[i].time)) + ' ' + String (list[i].name).replace (/[\r\n]+/g, ' '));
			return out.join ('\n') + (out.length ? '\n' : '');
		}
		return '';
	}

	function toSec ( s, parse ) {
		s = String (s === undefined || s === null ? '' : s).trim ();
		if (/^\d+([.,]\d+)?$/.test (s)) return parseFloat (s.replace (',', '.'));
		return parse ? parse (s) : null;
	}

	function parseAudacity ( txt ) {
		var lines = txt.split (/\r?\n/), out = [], i, p, a;
		for (i = 0; i < lines.length; ++i) {
			if (!lines[i] || lines[i].charAt (0) === '\\') continue;	/* Audacity 把頻率範圍放在以 \ 開頭的行 */
			p = lines[i].split ('\t');
			a = parseFloat (p[0]);
			if (p.length < 2 || !isFinite (a) || !/^\s*\d/.test (p[0])) continue;
			var b = parseFloat (p[1]);
			out.push ({time: a, end: isFinite (b) && b > a + 0.0005 ? b : 0, name: (p.length > 2 ? p.slice (2).join (' ') : '').trim ()});
		}
		return out;
	}

	function csvRows ( txt ) {
		var rows = [], row = [], cell = '', q = false, i, c, first = txt.split (/\r?\n/)[0] || '';
		var delim = (first.match (/\t/g) || []).length > (first.match (/,/g) || []).length ? '\t'
			: (first.match (/;/g) || []).length > (first.match (/,/g) || []).length ? ';' : ',';
		for (i = 0; i < txt.length; ++i) {
			c = txt.charAt (i);
			if (q) {
				if (c === '"') { if (txt.charAt (i + 1) === '"') { cell += '"'; ++i; } else q = false; }
				else cell += c;
			}
			else if (c === '"') q = true;
			else if (c === delim) { row.push (cell); cell = ''; }
			else if (c === '\n' || c === '\r') {
				if (c === '\r' && txt.charAt (i + 1) === '\n') ++i;
				row.push (cell); cell = '';
				if (row.length > 1 || row[0] !== '') rows.push (row);
				row = [];
			}
			else cell += c;
		}
		row.push (cell);
		if (row.length > 1 || row[0] !== '') rows.push (row);
		return rows;
	}

	function parseCSV ( txt, parse ) {
		var rows = csvRows (txt), out = [], ix = {}, i, r, h, k, t, hasHead = false;
		if (!rows.length) return out;
		h = rows[0].map (function ( s ) { return String (s).trim ().toLowerCase (); });
		for (k = 0; k < h.length; ++k) {
			if (/^(name|label|title|marker|名稱|標記|標籤)$/.test (h[k])) ix.name = k;
			else if (/^(seconds|sec|秒|秒數)$/.test (h[k])) ix.sec = k;
			else if (/^(time|start|position|時間|起點|位置)$/.test (h[k])) ix.time = k;
			else if (/^(note|notes|comment|comments|description|備註|說明)$/.test (h[k])) ix.note = k;
			else if (/^(color|colour|顏色)$/.test (h[k])) ix.color = k;
			else if (/^(type|kind|類型)$/.test (h[k])) ix.type = k;
			else if (/^(end|end time|stop|結束)$/.test (h[k])) ix.end = k;
		}
		hasHead = ix.name !== undefined || ix.sec !== undefined || ix.time !== undefined;
		if (!hasHead) { ix = {time: 0, name: 1, note: 2}; }
		for (i = hasHead ? 1 : 0; i < rows.length; ++i) {
			r = rows[i];
			t = ix.sec !== undefined && toSec (r[ix.sec], null) !== null ? toSec (r[ix.sec], null) : toSec (r[ix.time], parse);
			if (t === null || !isFinite (t)) continue;
			out.push ({time: t, name: ix.name !== undefined ? (r[ix.name] || '').trim () : '',
				note: ix.note !== undefined ? (r[ix.note] || '').trim () : '',
				color: ix.color !== undefined ? (r[ix.color] || '').trim () : '',
				type: ix.type !== undefined ? (r[ix.type] || '').trim ().toLowerCase () : '',
				end: ix.end !== undefined && toSec (r[ix.end], parse) !== null ? toSec (r[ix.end], parse) : 0});
		}
		return out;
	}

	function parseCue ( txt ) {
		var lines = txt.split (/\r?\n/), out = [], cur = null, i, l, m;
		for (i = 0; i < lines.length; ++i) {
			l = lines[i].trim ();
			if (/^TRACK\s+\d+/i.test (l)) { cur = {time: null, name: '', note: ''}; out.push (cur); }
			else if (!cur) continue;
			else if ((m = l.match (/^TITLE\s+(?:"(.*)"|(\S.*))$/i))) cur.name = m[1] !== undefined ? m[1] : m[2];
			else if ((m = l.match (/^REM\s+COMMENT\s+(?:"(.*)"|(\S.*))$/i))) cur.note = m[1] !== undefined ? m[1] : m[2];
			else if ((m = l.match (/^INDEX\s+(\d+)\s+(\d+):(\d+):(\d+)/i)) && +m[1] === 1)
				cur.time = (+m[2]) * 60 + (+m[3]) + (+m[4]) / 75;
		}
		return out.filter (function ( x ) { return x.time !== null; });
	}

	function parseYouTube ( txt ) {
		var lines = txt.split (/\r?\n/), out = [], i, m, p, t;
		for (i = 0; i < lines.length; ++i) {
			m = lines[i].match (/^\s*[\[(]?((?:\d{1,2}:)?\d{1,3}:\d{2}(?:[.,]\d+)?)[\])]?\s*[-–—:|.)]*\s*(.*)$/);
			if (!m) continue;
			p = m[1].replace (',', '.').split (':');
			t = 0;
			for (var k = 0; k < p.length; ++k) t = t * 60 + parseFloat (p[k]);
			out.push ({time: t, name: m[2].trim ()});
		}
		return out;
	}

	/* 依副檔名與內容判斷格式；回傳解析結果 {fmt, items} */
	function parseText ( fileName, txt, parse ) {
		var ext = (String (fileName || '').match (/\.([^.\/\\]+)$/) || 0)[1] || '', fmt, first, items;
		txt = String (txt || '').replace (/^﻿/, '');
		ext = ext.toLowerCase ();
		first = (txt.match (/^\s*(\S[^\r\n]*)/) || 0)[1] || '';
		if (ext === 'cue' || /^\s*(TRACK|FILE|TITLE|PERFORMER|REM)\s/im.test (txt) && /^\s*INDEX\s+01\s/im.test (txt)) fmt = 'cue';
		else if (ext === 'csv') fmt = 'csv';
		else if (/^[\d.]+\t[\d.]+(\t|$)/.test (first)) fmt = 'aud';
		else if (/^[\[(]?(\d{1,2}:)?\d{1,3}:\d{2}/.test (first)) fmt = 'yt';
		else if (/[,;\t]/.test (first)) fmt = 'csv';
		else fmt = 'yt';
		items = fmt === 'cue' ? parseCue (txt) : fmt === 'csv' ? parseCSV (txt, parse) : fmt === 'aud' ? parseAudacity (txt) : parseYouTube (txt);
		return {fmt: fmt, items: items};
	}

	function download ( name, text, mime ) {
		var b = new Blob ([text], {type: mime + ';charset=utf-8'}), a = d.createElement ('a'), url = w.URL.createObjectURL (b);
		a.href = url; a.download = name; a.style.display = 'none';
		d.body.appendChild (a);
		a.click ();
		setTimeout (function () { d.body.removeChild (a); w.URL.revokeObjectURL (url); }, 1500);
	}

	function baseName () {
		var e = PKAE.engine, n = e && e.file_name ? String (e.file_name) : '';
		return n.replace (/[\\\/:*?"<>|]/g, '_') || 'markers';
	}

	/* 彈出視窗共用：鍵盤焦點交給視窗（避免打字時觸發全域快捷鍵），Esc 關閉、Enter 按第一個按鈕 */
	/* 自訂確認視窗（取代瀏覽器內建的 confirm）：Enter＝確定、Esc／取消＝放棄 */
	function confirmUi ( title, msg, okTitle, onOk ) {
		var mid = 'mrk_cf';
		new PKSimpleModal ({
			title: title,
			clss: 'pk_fnt10',
			ondestroy: function () { mOff (mid); },
			buttons: [
				{title: okTitle, clss: 'pk_modal_a_accpt', callback: function ( q ) { q.Destroy (); onOk (); }},
				{title: T ('cancel'), callback: function ( q ) { q.Destroy (); }}
			],
			body: '<div style="padding:2px 0">' + esc (msg) + '</div>',
			setup: function ( q ) { mKeys (q, mid); }
		}).Show ();
	}
	function mKeys ( m, mid ) {
		var ui = PKAE.ui;
		if (!ui) return ;
		ui.InteractionHandler.forceSet (mid);
		ui.KeyHandler.addCallback (mid + 'esc', function () { if (ui.InteractionHandler.check (mid)) m.Destroy (); }, [27]);
		ui.KeyHandler.addCallback (mid + 'en', function () { if (ui.InteractionHandler.check (mid) && m.els.bottom[0]) m.els.bottom[0].click (); }, [13]);
	}
	function mOff ( mid ) {
		var ui = PKAE.ui;
		if (!ui) return ;
		ui.InteractionHandler.forceUnset (mid);
		ui.KeyHandler.removeCallback (mid + 'esc');
		ui.KeyHandler.removeCallback (mid + 'en');
	}

	function exportUi () {
		var m = M (), all = m.list (), sel = all.filter ( function ( x ) { return checked[ x.id ]; }), use = sel.length ? sel : all;
		if (!all.length) { OneUp (T ('exp_none'), 1300); return ; }
		var nch = use.filter ( function ( x ) { return x.type === 'chapter'; }).length;
		var mid = 'mrk_xp', opts = '', k, names = {aud: 'f_aud', csv: 'f_csv', cue: 'f_cue', yt: 'f_yt'};
		var last = 'aud';
		try { last = w.localStorage.getItem ('pk_mrk_xfmt') || 'aud'; } catch (e) {}
		for (k in names) opts += '<option value="' + k + '"' + (k === last ? ' selected' : '') + '>' + esc (T (names[k])) + '</option>';
		new PKSimpleModal ({
			title: T ('exp_title'),
			clss: 'pk_fnt10',
			ondestroy: function () { mOff (mid); },
			buttons: [{title: T ('exp_ok'), clss: 'pk_modal_a_accpt', callback: function ( q ) {
				var f = q.el_body.getElementsByTagName ('select')[0].value, ck = q.el_body.querySelector ('.chp'), out = ck && ck.checked ? use.filter ( function ( x ) { return x.type === 'chapter'; }) : use;
				try { w.localStorage.setItem ('pk_mrk_xfmt', f); } catch (e) {}
				download (baseName () + '_markers.' + FMT[f].ext,
					toText (f, out, {duration: m.duration (), fmt: m.fmt, file: baseName () + '.wav', title: baseName (), intro: T ('yt_intro')}),
					FMT[f].mime);
				q.Destroy ();
			}}],
			body: '<label>' + esc (T ('exp_fmt')) + '</label> <select class="pk_txt" style="width:100%;box-sizing:border-box">' + opts + '</select>' +
				'<div style="margin-top:8px;opacity:.7;font-size:11px">' + esc (T (sel.length ? 'exp_sel' : 'exp_all', {n: use.length})) + '</div>' +
				(nch ? '<label style="display:block;margin-top:6px;font-size:11px"><input type="checkbox" class="chp" checked> ' + esc (T ('only_ch', {n: nch})) + '</label>' : ''),
			setup: function ( q ) { mKeys (q, mid); }
		}).Show ();
	}

	var fileIn = null;
	function importUi () {
		var m = M ();
		if (!(m.duration () > 0)) { noAudio (); return ; }
		if (!fileIn) {
			fileIn = d.createElement ('input');
			fileIn.type = 'file';
			fileIn.accept = '.txt,.csv,.cue,text/plain,text/csv';
			fileIn.style.display = 'none';
			d.body.appendChild (fileIn);
			fileIn.addEventListener ('change', function () {
				var f = fileIn.files && fileIn.files[0];
				fileIn.value = '';
				if (!f) return ;
				var rd = new FileReader ();
				rd.onload = function () { doImport (f.name, String (rd.result || '')); };
				rd.readAsText (f, 'utf-8');
			});
		}
		fileIn.click ();
	}

	function doImport ( name, txt ) {
		var m = M (), r = parseText (name, txt, m.parse), n = m.list ().length, mid = 'mrk_im';
		function run ( replace ) {
			var res = m.importMany (r.items, replace);
			if (!res.added && !res.skipped) { noAudio (); return ; }
			if (!res.added) { OneUp (T ('imp_bad'), 1800); return ; }
			checked = {};
			OneUp (T ('imp_done', {n: res.added}) + (res.skipped ? T ('imp_skip', {s: res.skipped}) : ''), 1800);
		}
		if (!r.items.length) { OneUp (T ('imp_bad'), 2200); return ; }
		if (!n) { run (false); return ; }
		new PKSimpleModal ({
			title: T ('imp_title'),
			clss: 'pk_fnt10',
			ondestroy: function () { mOff (mid); },
			buttons: [
				{title: T ('imp_add'), clss: 'pk_modal_a_accpt', callback: function ( q ) { q.Destroy (); run (false); }},
				{title: T ('imp_rep'), callback: function ( q ) { q.Destroy (); run (true); }}
			],
			body: '<div>' + esc (T ('imp_ask', {n: n, k: r.items.length})) + '</div>',
			setup: function ( q ) { mKeys (q, mid); }
		}).Show ();
	}

	/* ======================================================================
	 * [階段 2] 批次重新命名（套用到勾選的標記；沒勾選就套用到全部）
	 * 例如把自動分割產生的「標記 1、標記 2…」一次改成「Track 01」「Track 02」…
	 * ====================================================================== */
	function applyTpl ( tpl, x, i, m ) {
		return String (tpl).replace (/\{(n|nn|nnn|name|time)\}/g, function ( s, k ) {
			var n = String (i + 1);
			if (k === 'n') return n;
			if (k === 'nn') return n.length < 2 ? '0' + n : n;
			if (k === 'nnn') { while (n.length < 3) n = '0' + n; return n; }
			if (k === 'name') return x.name;
			return m ? m.fmt (x.time) : '';
		});
	}

	function batchRename () {
		var m = M (), all = m.list (), sel = all.filter ( function ( x ) { return checked[ x.id ]; }), use = sel.length ? sel : all, mid = 'mrk_rn';
		if (!use.length) { OneUp (T ('ren_none'), 1300); return ; }
		var tpl = 'Track {nn}';
		try { tpl = w.localStorage.getItem ('pk_mrk_rentpl') || tpl; } catch (e) {}
		new PKSimpleModal ({
			title: T ('ren_title'),
			clss: 'pk_fnt10',
			ondestroy: function () { mOff (mid); },
			buttons: [{title: T ('ren_ok'), clss: 'pk_modal_a_accpt', callback: function ( q ) {
				var v = q.el_body.getElementsByTagName ('input')[0].value, map = {}, i, n;
				if (!v.trim ()) return ;
				try { w.localStorage.setItem ('pk_mrk_rentpl', v); } catch (e) {}
				for (i = 0; i < use.length; ++i) map[ use[i].id ] = applyTpl (v, use[i], i, m);
				n = m.renameMany (map);
				q.Destroy ();
				OneUp (T ('ren_done', {n: n}), 1300);
			}}],
			body: '<label>' + esc (T ('ren_label')) + '</label>' +
				'<input style="width:100%;box-sizing:border-box;min-width:0" maxlength="64" class="pk_txt" type="text">' +
				'<div style="margin-top:6px;font-size:11px;opacity:.7">' + esc (T ('ren_hint')) + '</div>' +
				'<div style="margin-top:6px;font-size:11px;opacity:.7">' + esc (T (sel.length ? 'ren_sel' : 'ren_all', {n: use.length})) + '</div>' +
				'<div class="rn_pv" style="margin-top:6px;font-size:11px;white-space:pre-wrap"></div>',
			setup: function ( q ) {
				mKeys (q, mid);
				setTimeout (function () {
					if (!q.el) return ;
					var inp = q.el.getElementsByTagName ('input')[0], pv = q.el.querySelector ('.rn_pv');
					function show () {
						var i, s = [];
						for (i = 0; i < Math.min (3, use.length); ++i) s.push (applyTpl (inp.value, use[i], i, m).substr (0, 32));
						pv.textContent = T ('ren_prev') + s.join (' · ') + (use.length > 3 ? ' …' : '');
					}
					inp.value = tpl;
					inp.addEventListener ('input', show);
					show ();
					inp.focus ();
					inp.select ();
				}, 20);
			}
		}).Show ();
	}

	function editCell ( td, id, kind ) {
		var m = M (), cur = m.list ().filter ( function ( x ) { return x.id === id; })[0], inp, done = false;
		if (!cur || editing) return ;
		editing = true;
		inp = d.createElement ('input');
		inp.type = 'text'; inp.className = 'ed';
		inp.value = kind === 'nm' ? cur.name : kind === 'nt' ? (cur.note || '') : kind === 'en' ? (cur.end ? m.fmt (cur.end) : '') : m.fmt (cur.time);
		if (kind === 'nm') inp.maxLength = 32;
		if (kind === 'nt') inp.maxLength = 500;
		td.textContent = '';
		td.appendChild (inp);
		inp.focus ();
		inp.select ();
		function finish ( ok ) {
			if (done) return ;
			done = true;
			editing = false;
			if (ok) {
				if (kind === 'nm') m.rename (id, inp.value);
				else if (kind === 'nt') m.setNote (id, inp.value);
				else if (kind === 'en') {
					var ev = /^\s*$/.test (inp.value) ? null : m.parse (inp.value);
					if (ev === null && !/^\s*$/.test (inp.value)) OneUp (m.T ('time_bad'), 1300);
					else if (ev !== null && !(ev > cur.time + 0.001)) OneUp (m.T ('end_bad'), 1300);
					else m.setEnd (id, ev);
				}
				else {
					var v = m.parse (inp.value);
					if (v === null) OneUp (m.T ('time_bad'), 1300);
					else m.setTime (id, v);
				}
			}
			sig = '';
			refresh ();
		}
		inp.addEventListener ('keydown', function ( e ) {
			e.stopPropagation ();
			if (e.key === 'Enter') finish (true);
			else if (e.key === 'Escape') finish (false);
		});
		inp.addEventListener ('blur', function () { finish (true); });
		inp.addEventListener ('click', function ( e ) { e.stopPropagation (); });
		inp.addEventListener ('dblclick', function ( e ) { e.stopPropagation (); });
	}

	function bindEvents () {
		el.querySelector ('.pk_mp_x').addEventListener ('click', close);

		el.querySelector ('.pk_mp_tb').addEventListener ('click', function ( e ) {
			var a = e.target.getAttribute && e.target.getAttribute ('data-a');
			if (a) doAction (a);
		});

		headCk.addEventListener ('change', function () {
			var all = visIds (), i;
			checked = {};
			if (headCk.checked) for (i = 0; i < all.length; ++i) checked[ all[i] ] = 1;
			sig = '';
			refresh ();
		});

		el.querySelector ('.flt').addEventListener ('change', function () {
			flt = this.value;
			try { w.localStorage.setItem (FLT_KEY, flt); } catch (e) {}
			sig = '';
			refresh ();
		});

		var tbx = el.querySelector ('.pk_mp_tb'), mb = el.querySelector ('.pk_mp_mb'), mbt = mb.textContent.replace (/\s*\u25B8$|\s*\u25BE$/, '');
		function setMore ( v, keep ) {
			tbx.classList.toggle ('pk_more', v);
			mb.setAttribute ('aria-expanded', v ? 'true' : 'false');
			mb.textContent = mbt + (v ? ' \u25BE' : ' \u25B8');
			if (!keep) try { w.localStorage.setItem ('pk_mp_more', v ? '1' : '0'); } catch (e) {}
		}
		var mv = false; try { mv = w.localStorage.getItem ('pk_mp_more') === '1'; } catch (e) {}
		setMore (mv, true);
		mb.addEventListener ('click', function () { setMore (!tbx.classList.contains ('pk_more')); });

		var ob = el.querySelector ('.pk_mp_ob'), of = el.querySelector ('.pk_mp_f'), obt = ob.textContent.replace (/\s*\u25B8$|\s*\u25BE$/, '');
		function setOpts ( v, keep ) {
			of.classList.toggle ('pk_open', v);
			ob.setAttribute ('aria-expanded', v ? 'true' : 'false');
			ob.textContent = obt + (v ? ' \u25BE' : ' \u25B8');
			if (!keep) try { w.localStorage.setItem ('pk_mp_opt', v ? '1' : '0'); } catch (e) {}
		}
		var ov = false; try { ov = w.localStorage.getItem ('pk_mp_opt') === '1'; } catch (e) {}
		setOpts (ov, true);
		ob.addEventListener ('click', function () { setOpts (!of.classList.contains ('pk_open')); });
		var trk = el.querySelector ('.trk');
		trk.checked = !!M ().track ();
		trk.addEventListener ('change', function () { M ().track (trk.checked); });
		var lbs = el.querySelector ('.lbs');
		lbs.checked = !!M ().labels ();
		lbs.addEventListener ('change', function () { M ().labels (lbs.checked); });
		var ask = el.querySelector ('.ask');
		ask.checked = !!M ().askName ();
		ask.addEventListener ('change', function () { M ().askName (ask.checked); });
		var flw = el.querySelector ('.flw');
		flw.checked = !!M ().follow ();
		flw.addEventListener ('change', function () { M ().follow (flw.checked); });
		var snp = el.querySelector ('.snp');
		snp.checked = !!M ().snap ();
		snp.addEventListener ('change', function () { M ().snap (snp.checked); });
		var zcs = el.querySelector ('.zcs');
		zcs.checked = !!M ().zeroCross ();
		zcs.addEventListener ('change', function () { M ().zeroCross (zcs.checked); });
		var rpl = el.querySelector ('.rpl');
		rpl.checked = !!M ().ripple ();
		rpl.addEventListener ('change', function () { M ().ripple (rpl.checked); });
		var rcl = el.querySelector ('.rcl');
		rcl.checked = !!M ().replaceCollapse ();
		rcl.addEventListener ('change', function () { M ().replaceCollapse (rcl.checked); });
		applyCols ();
		Array.prototype.forEach.call (el.querySelectorAll ('.cc'), function ( c ) {
			c.checked = !!cols[ c.getAttribute ('data-c') ];
			c.addEventListener ('change', function () {
				cols[ c.getAttribute ('data-c') ] = c.checked ? 1 : 0;
				try { w.localStorage.setItem (COL_KEY, JSON.stringify (cols)); } catch (e) {}
				applyCols ();
			});
		});
		var prc = el.querySelector ('.prc');
		prc.value = String (prec);
		prc.addEventListener ('change', function () {
			prec = parseInt (prc.value, 10) || 0;
			try { w.localStorage.setItem (PREC_KEY, String (prec)); } catch (e) {}
			sig = '';
			refresh ();
		});
		var jpl = el.querySelector ('.jpl');
		jpl.checked = !!M ().jumpPlay ();
		jpl.addEventListener ('change', function () { M ().jumpPlay (jpl.checked); });
		var pmm = el.querySelector ('.pmm'), pmp = el.querySelector ('.pmp'), pmx = el.querySelector ('.pmx');
		pmm.value = M ().playMode ();
		pmm.addEventListener ('change', function () { M ().playMode (pmm.value); });
		pmp.value = M ().preroll ();
		pmp.addEventListener ('change', function () { M ().preroll (pmp.value); pmp.value = M ().preroll (); });
		pmx.value = M ().maxSec ();
		pmx.addEventListener ('change', function () { M ().maxSec (pmx.value); pmx.value = M ().maxSec (); });
		var ncs = el.querySelector ('.ncs');
		ncs.value = M ().colorCycle ();
		ncs.addEventListener ('change', function () { M ().colorCycle (ncs.value); ncs.value = M ().colorCycle (); });
		var lpc = el.querySelector ('.lpc');
		lpc.value = M ().loopCount ();
		lpc.addEventListener ('change', function () { M ().loopCount (lpc.value); lpc.value = M ().loopCount (); });
		var sls = el.querySelector ('.sls');
		sls.checked = !!M ().silenceSnap ();
		sls.addEventListener ('change', function () { M ().silenceSnap (sls.checked); });

		body.addEventListener ('change', function ( e ) {
			var tr = e.target.closest ('tr');
			if (!tr || e.target.type !== 'checkbox') return ;
			var id = tr.getAttribute ('data-id');
			if (e.target.checked) checked[ id ] = 1; else delete checked[ id ];
			var n = checkedIds ().length, tot = visIds ().length;
			headCk.checked = n > 0 && n === tot;
			headCk.indeterminate = n > 0 && n < tot;
			syncBtns ();
		});

		body.addEventListener ('click', function ( e ) {
			var tr = e.target.closest ('tr');
			if (!tr || editing) return ;
			var id = tr.getAttribute ('data-id');
			if (e.target.type === 'checkbox') return ;
			if (e.target.classList.contains ('pk_mp_dot')) { M ().colorUi (id); return ; }
			if (e.target.classList.contains ('ty')) { M ().cycleType (id); return ; }
			if (e.target.classList.contains ('lk')) { var cur = M ().list ().filter ( function ( x ) { return x.id === id; })[0]; cur && M ().setLocked (id, !cur.locked); return ; }
			M ().select (id);
		});

		body.addEventListener ('dblclick', function ( e ) {
			var td = e.target.closest ('td'), tr = e.target.closest ('tr');
			if (!td || !tr) return ;
			if (td.classList.contains ('nm')) editCell (td, tr.getAttribute ('data-id'), 'nm');
			else if (td.classList.contains ('tm')) editCell (td, tr.getAttribute ('data-id'), 'tm');
			else if (td.classList.contains ('en')) editCell (td, tr.getAttribute ('data-id'), 'en');
			else if (td.classList.contains ('nt')) editCell (td, tr.getAttribute ('data-id'), 'nt');
		});

		/* 面板上按下去就把焦點移到面板，這樣 F2 / Delete / ↑↓ 才有作用 */
		el.addEventListener ('mousedown', function ( e ) {
			if (!/INPUT|SELECT|TEXTAREA/.test (e.target.tagName)) el.focus ({preventScroll: true});
		});
	}

	/* 快捷鍵：用 window 的捕捉階段先攔下，避免「Delete」被全域快捷鍵當成刪除音訊 */
	function onKey ( e ) {
		if (!open_ || !el || editing) return ;
		var a = d.activeElement;
		if (!a || !el.contains (a) || /INPUT|SELECT|TEXTAREA/.test (a.tagName)) return ;
		var m = M (), k = e.key, act = m.active (), list, i, id;
		if (e.ctrlKey || e.metaKey || e.altKey) return ;

		if (k === 'F2') { if (act) m.renameUi (act); }
		else if (k === 'Delete' || k === 'Backspace') {
			list = checkedIds ();
			if (list.length) { checked = {}; m.removeMany (list); }
			else if (act) m.remove (act);
		}
		else if (k === 'ArrowUp' || k === 'ArrowDown') {
			list = visIds ();
			if (!list.length) return ;
			i = list.indexOf (act);
			i = k === 'ArrowUp' ? Math.max (0, (i < 0 ? 0 : i) - 1) : Math.min (list.length - 1, i + 1);
			m.select (list[i]);
		}
		else return ;
		e.preventDefault ();
		e.stopPropagation ();
		e.stopImmediatePropagation && e.stopImmediatePropagation ();
	}

	function setOff ( a, off ) { var b = el.querySelector ('[data-a="' + a + '"]'); if (b) b.classList.toggle ('off', !!off); }
	function syncBtns () {
		var m = M (), n = checkedIds ().length, r = m.region ? m.region () : null;
		setOff ('del', n < 1); setOff ('mrg', n < 2);
		setOff ('in', !r); setOff ('out', !r); setOff ('mkr', !r); setOff ('rng', !r);
		setOff ('tosel', !m.active ());
	}

	function refresh () {
		if (!open_ || !el || editing) return ;
		var m = M ();
		if (!m) return ;
		syncBtns ();
		var list = m.list (), act = m.active (), durr = m.duration (), ctx = m.ctx ();
		var next = ctx + '|' + flt + '|' + prec + '|' + act + '|' + durr.toFixed (3) + '|' + list.map ( function ( x ) {
			return x.id + ',' + x.time.toFixed (4) + ',' + x.name + ',' + x.color + ',' + (x.locked ? 'L' : '') + (x.type || '') + (x.end ? ',' + x.end.toFixed (4) : '') + (checked[x.id] ? 1 : 0) + ',' + (x.note || '');
		}).join (';');
		if (next === sig) return ;
		sig = next;

		var i, h = '', len, tot = 0, ck, shown = 0;
		for (i = 0; i < list.length; ++i) {
			if (!match ( list[i] )) { delete checked[ list[i].id ]; continue; }	/* 看不到的列不能被勾選，避免「刪除勾選」刪到隱藏的標記 */
			++shown;
			len = list[i].end ? list[i].end - list[i].time : (i + 1 < list.length ? list[i + 1].time : durr) - list[i].time;
			ck = !!checked[ list[i].id ];
			h += '<tr class="r' + (list[i].id === act ? ' act' : '') + '" data-id="' + esc (list[i].id) + '">' +
				'<td class="c"><input type="checkbox"' + (ck ? ' checked' : '') + '></td>' +
				'<td class="n">' + (i + 1) + '</td>' +
				'<td class="k"><i class="pk_mp_dot" title="' + esc (T ('color')) + '" style="background:' + esc (list[i].color) + '"></i></td>' +
				'<td class="nm" title="' + esc (list[i].name) + '">' + esc (list[i].name) + '</td>' +
				'<td class="tm" title="' + esc (T ('full_tip') + m.fmt (list[i].time)) + '">' + dfmt (list[i].time) + '</td>' +
				'<td class="en" title="' + esc (T ('end_tip')) + '">' + (list[i].end ? dfmt (list[i].end) : '') + '</td>' +
				'<td class="ln">' + (len > 0 ? dfmt (len) : '') + '</td>' +
				'<td class="nt" title="' + esc (list[i].note || '') + '">' + esc (list[i].note || '') + '</td>' +
				'<td class="ty" title="' + esc (T ('type_tip', {t: T ('t_' + (list[i].type || 'normal'))})) + '" style="cursor:pointer;text-align:center;opacity:' + (list[i].type ? 1 : .3) + '">' + (list[i].type === 'chapter' ? '§' : list[i].type === 'loop' ? '↻' : '◇') + '</td>' +
					'<td class="lk" title="' + esc (T ('lock')) + '" style="cursor:pointer;opacity:' + (list[i].locked ? 1 : .3) + '">' + (list[i].locked ? '\uD83D\uDD12' : '\uD83D\uDD13') + '</td></tr>';
			if (ck) ++tot;
		}
		/* 清掉已不存在的勾選 */
		for (ck in checked) if (!list.some ( function ( x ) { return x.id === ck; })) delete checked[ ck ];

		body.innerHTML = h;
		var emp = boxEl.querySelector ('.pk_mp_e');
		emp.style.display = shown ? 'none' : 'block';
		emp.textContent = list.length ? T ('empty_flt') : T ('empty');
		headCk.checked = shown > 0 && tot === shown;
		headCk.indeterminate = tot > 0 && tot < shown;
		titleEl.textContent = T ('title') + ' (' + (shown === list.length ? list.length : shown + '/' + list.length) + ')';
		var tag = el.querySelector ('.pk_mp_h em');
		if (ctx === 'mt') {
			if (!tag) { tag = d.createElement ('em'); titleEl.parentNode.insertBefore (tag, titleEl.nextSibling); }
			tag.textContent = T ('mt');
		}
		else if (tag) tag.parentNode.removeChild (tag);

		if (act !== lastAct) {
			lastAct = act;
			var row = body.querySelector ('tr.act');
			row && row.scrollIntoView && row.scrollIntoView ({block: 'nearest'});
		}
	}

	function soon () {
		if (raf) return ;
		raf = w.requestAnimationFrame ( function () { raf = 0; refresh (); });
	}

	function open () {
		if (open_ || !M ()) return ;
		if (!el) build ();
		el.style.display = 'flex';
		open_ = true;
		applyMode ();	/* 停靠時會送 RequestResize，波形依新寬度重畫 */
		sig = '';
		refresh ();
		timer = w.setInterval ( function () { refresh (); layoutDock (); }, 400 );
		PKAE.fireEvent ('DidToggleMarkerPanel', true);
	}

	function close () {
		if (!open_) return ;
		savePos ();
		open_ = false;
		editing = false;
		el.style.display = 'none';
		w.clearInterval (timer);
		showDrop (null);
		applyMode ();
		PKAE.fireEvent ('DidToggleMarkerPanel', false);
	}

	function toggle () { open_ ? close () : open (); }

	w.addEventListener ('keydown', onKey, true);
	PKAE.listenFor ('DidMarkersChange', soon);
	PKAE.listenFor ('DidUpdateMultitrack', soon);
	PKAE.listenFor ('DidLoadFile', soon);
	PKAE.listenFor ('DidUnloadFile', soon);
	w.addEventListener ('resize', function () {
		if (!el || !open_) return ;
		if ((applied === 'f') === (curMode () === 'f')) { applied === 'f' ? clamp () : layoutDock (); }
		else applyMode ();	/* 視窗縮到太窄時改回浮動，變寬後恢復停靠 */
	});
	PKAE.listenFor ('RequestResize', function () { open_ && layoutDock (); });

	PKAE._deps.mrkpanel = {
		open: open, close: close, toggle: toggle, isOpen: function () { return open_; },
		/* 停靠：dock('l'|'r'|'f')；side() 回傳目前模式 */
		dock: setMode, side: function () { return mode; },
		/* 目前在清單勾選的標記 id（給分割匯出使用；面板沒開過就是空的） */
		checked: function () { return el ? checkedIds () : []; },
		/* 格式轉換（純函式）：toText(fmt, list, opts) / parseText(fileName, text, parseFn) */
		io: { toText: toText, parseText: parseText, applyTpl: applyTpl }
	};

})( window, document, PKAudioEditor );
