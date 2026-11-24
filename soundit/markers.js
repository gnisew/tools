/* --------------------------------------------------------------------------
 * 📄 原始檔案: markers.js 
 * -------------------------------------------------------------------------- */
(function ( w, d, PKAE ) {
	'use strict';

	function PKMrk ( app ) {
		var q = this, max = 32, raf = 0;	/* [修改] 名稱上限 11 → 32 字 */
		var maxNote = 500;	/* [新增] 備註長度上限 */
		var t = PKLocale.t;
		/* [新增] 標記功能用的內建中／英文字串（不必改 lang-*.js） */
		var SS = {
			zh: {set_time:'設定時間…', set_color:'變更顏色…', sel_next:'選取此段（區間或到下一個標記）', set_in:'設為選取起點', set_out:'設為選取終點', copy_time:'複製時間',
				time_title:'設定標記時間', time_label:'時間（時:分:秒.毫秒，例如 1:23.500）', time_bad:'時間格式不正確',
				color_title:'標記顏色', custom:'自訂', desc_color:'變更標記顏色', desc_recolor:'套用循環色', desc_del_many:'刪除多個標記', desc_range:'刪除範圍內標記',
				set_note:'編輯備註…', note_title:'標記備註', note_label:'備註（最多 {n} 字）', desc_note:'編輯標記備註',
				desc_rename_many:'批次重新命名標記', desc_import:'匯入標記', lock:'鎖定標記', unlock:'解除鎖定', desc_lock:'鎖定／解除鎖定標記',
					/* [階段 3] */
					type_normal:'一般', type_chapter:'章節', type_loop:'循環', cycle_type:'切換類型（一般→章節→循環）', desc_type:'變更標記類型', play_loop:'循環播放此段',
					/* [階段 3 區間] */
					set_end:'設定結束時間…', end_title:'設定區間結束時間', end_label:'結束時間（時:分:秒.毫秒；留空＝改回點標記）', end_bad:'結束時間必須晚於起點',
					range_from_sel:'以目前選取範圍設為區間', to_point:'轉為點標記', to_range:'轉為區間（到下一個標記）', desc_range_edit:'調整標記區間', no_next:'後面沒有可當作結束點的位置',
					/* [階段 3 收尾] */
					range_new:'以選取範圍建立區間標記', no_sel:'請先在波形上選取一段範圍', no_marker:'沒有可選取的標記',
					/* [階段 4] 分割／合併／跳轉後播放 */
					split_here:'在游標處分割', split_at:'在此分割', merge_next:'與後一個標記合併', merge_prev:'與前一個標記合併', desc_split:'分割標記', desc_merge:'合併標記',
					split_none:'游標不在任何標記的範圍內', split_edge:'游標太靠近標記邊界，無法分割', merge_need:'請先勾選至少 2 個標記', merge_gap:'只能合併相鄰的標記（清單中必須連續）',
					merge_lock:'鎖定的標記不能合併或分割', merge_no_next:'後面沒有標記可合併', merge_no_prev:'前面沒有標記可合併',
					desc_nudge:'微調標記邊界', nudge_no_end:'點標記沒有結束邊界（可先轉為區間）', nudge_no_marker:'請先選取一個標記',
					/* [階段 5] 逐標記播放 */
					pm_off:'逐標記播放：關', pm_stop:'逐標記播放：每段播完停止（停在句首）', pm_next:'逐標記播放：播完接下一段（略過標記之間的空白）', pm_done:'已播完最後一個標記', pm_st_only:'逐標記播放目前只支援單軌',
					/* [階段 5] 循環次數 */
					lc_inf:'循環次數：無限', lc_n:'循環次數：{n} 次', lc_done:'循環播放完成（{n} 次）',
					/* [階段 5] 漏標檢查 */
					mc_title:'漏標檢查', mc_run:'分析中…（偵測門檻沿用「自動分割 → 有聲句段」的設定）', mc_none:'沒有發現漏標：偵測到 {n} 段有聲區間，都已被標記涵蓋', mc_found:'有 {n} 段有聲區間沒有被任何標記涵蓋（點標記的段落到下一個標記為止；短於 0.3 秒的忽略）', mc_go:'跳到', mc_try:'試聽', mc_add:'加入', mc_added:'已加入', mc_add_all:'全部加入為區間標記', mc_name:'漏標', mc_noaudio:'沒有可分析的音訊', mc_na:'找不到自動分割模組', mc_busy:'正在分析中，請稍候',
					/* [階段 5] 平移後續標記 */
					sh_cur:'以游標平移此標記及其後', sh_by:'平移此標記及其後（輸入秒數）…', sh_title:'平移後續標記', sh_label:'位移秒數（正數往後、負數往前，例如 -0.35）', sh_bad:'請輸入數字', sh_zero:'游標就在標記起點，沒有需要平移的距離', sh_lock:'要平移的標記裡有鎖定的標記，請先解除鎖定', sh_clamp:'（已限制在音訊範圍內）', sh_done:'已平移 {n} 個標記 {s} 秒', desc_shift:'平移後續標記', play_from:'從此標記開始逐段播放',
					/* [標籤列 設定] */
					trk_name:'標記', trk_menu:'標記列設定', trk_show:'顯示標記列', trk_fold:'摺疊標記列（名稱改顯示在聲波上）', trk_unfold:'展開標記列',
					trk_lanes_auto:'層數：自動（最多 {n} 層）', trk_lanes_n:'層數：{n}', trk_ask:'新增標記時詢問名稱', trk_snap:'拖曳時吸附', trk_panel:'標記清單…', trk_grip:'拖曳調整層數（雙擊＝自動）'},
			en: {set_time:'Set Time…', set_color:'Change Color…', sel_next:'Select Section (range or to next marker)', set_in:'Set as Selection Start', set_out:'Set as Selection End', copy_time:'Copy Time',
				time_title:'Set Marker Time', time_label:'Time (h:mm:ss.mmm, e.g. 1:23.500)', time_bad:'Invalid time format',
				color_title:'Marker Color', custom:'Custom', desc_color:'Change Marker Color', desc_recolor:'Apply Color Cycle', desc_del_many:'Delete Markers', desc_range:'Delete Markers in Range',
				set_note:'Edit Note…', note_title:'Marker Note', note_label:'Note (up to {n} characters)', desc_note:'Edit Marker Note',
				desc_rename_many:'Rename Markers', desc_import:'Import Markers', lock:'Lock Marker', unlock:'Unlock Marker', desc_lock:'Lock/Unlock Marker',
					/* [stage 3] */
					type_normal:'Normal', type_chapter:'Chapter', type_loop:'Loop', cycle_type:'Cycle Type (Normal → Chapter → Loop)', desc_type:'Change Marker Type', play_loop:'Loop This Section',
					/* [stage 3 range] */
					set_end:'Set End Time…', end_title:'Set Range End Time', end_label:'End time (h:mm:ss.mmm; empty = back to point marker)', end_bad:'End must be later than the start',
					range_from_sel:'Set Range from Selection', to_point:'Convert to Point Marker', to_range:'Convert to Range (to next marker)', desc_range_edit:'Edit Marker Range', no_next:'No position after this marker to use as the end',
					/* [stage 3 wrap-up] */
					range_new:'Create Range Marker from Selection', no_sel:'Select a range on the waveform first', no_marker:'No marker to select',
					/* [stage 4] split / merge / play after jump */
					split_here:'Split at Cursor', split_at:'Split Here', merge_next:'Merge with Next Marker', merge_prev:'Merge with Previous Marker', desc_split:'Split Marker', desc_merge:'Merge Markers',
					split_none:'The cursor is not inside any marker', split_edge:'Cursor is too close to the marker edge to split', merge_need:'Check at least 2 markers first', merge_gap:'Only adjacent markers can be merged (they must be consecutive in the list)',
					merge_lock:'Locked markers cannot be merged or split', merge_no_next:'No marker after this one to merge with', merge_no_prev:'No marker before this one to merge with',
					desc_nudge:'Nudge Marker Edge', nudge_no_end:'A point marker has no end edge (convert it to a range first)', nudge_no_marker:'Select a marker first',
					/* [stage 5] play by marker */
					pm_off:'Play by marker: Off', pm_stop:'Play by marker: stop after each section (back to its start)', pm_next:'Play by marker: continue to next section (skips gaps between markers)', pm_done:'Reached the last marker', pm_st_only:'Play by marker supports single track only',
					/* [stage 5] loop count */
					lc_inf:'Loop count: unlimited', lc_n:'Loop count: {n}', lc_done:'Loop finished ({n} times)',
					/* [stage 5] missing-marker check */
					mc_title:'Check Missing Markers', mc_run:'Analyzing… (uses the threshold settings of Auto Split → Speech segments)', mc_none:'Nothing missed: all {n} detected speech segments are covered by markers', mc_found:'{n} speech segment(s) are not covered by any marker (a point marker covers up to the next marker; pieces under 0.3 s are ignored)', mc_go:'Go', mc_try:'Listen', mc_add:'Add', mc_added:'Added', mc_add_all:'Add All as Range Markers', mc_name:'Missed', mc_noaudio:'No audio to analyze', mc_na:'Auto split module not found', mc_busy:'Analysis in progress, please wait',
					/* [stage 5] shift following markers */
					sh_cur:'Shift This Marker and Later Ones to Cursor', sh_by:'Shift This Marker and Later Ones by…', sh_title:'Shift Following Markers', sh_label:'Offset in seconds (positive = later, negative = earlier, e.g. -0.35)', sh_bad:'Enter a number', sh_zero:'The cursor is at the marker start; nothing to shift', sh_lock:'A locked marker is in the range to shift; unlock it first', sh_clamp:' (limited to the audio range)', sh_done:'Shifted {n} marker(s) by {s} s', desc_shift:'Shift Following Markers', play_from:'Play Sections From Here',
					/* [label track settings] */
					trk_name:'Markers', trk_menu:'Marker Track Settings', trk_show:'Show Marker Track', trk_fold:'Collapse Track (names shown on waveform)', trk_unfold:'Expand Track',
					trk_lanes_auto:'Rows: Auto (up to {n})', trk_lanes_n:'Rows: {n}', trk_ask:'Ask for a Name When Adding', trk_snap:'Snap While Dragging', trk_panel:'Marker List…', trk_grip:'Drag to change rows (double-click = auto)'}
		};
		function T ( key, vars ) {
			var l = '';
			try { l = PKLocale.getLang () || ''; } catch (e) {}
			var s = (SS[ /^(zh|kasu|hak)/i.test (l) ? 'zh' : 'en' ][ key ]) || SS.en[ key ] || key;
			if (vars) s = s.replace (/\{(\w+)\}/g, function ( m, n ) { return vars[n] === undefined ? m : vars[n]; });
			return s;
		}
		var cols = ['#9dff6a', '#5af2ff', '#f557d2', '#ffd15c', '#ff8c35', '#b9c6ff'];
		/* 新增標記時的自動配色：可設定循環幾色（1~6，預設 6＝原本的順序）。
		 * 數字是 cols 的索引：2＝桃紅、0＝萊姆綠、5＝藍紫、4＝橘、3＝黃、1＝青。
		 * 只用 1 色時用桃紅：和波形的青綠色是互補色，深淺兩種底色上都最醒目，
		 * 又不和播放線（橘）、游標虛線（黃）、錄音（紅）撞色。青色最後才出現，因為和波形顏色太像。
		 * 色數少時依「彼此最好分辨」的順序加入：桃紅 → 萊姆綠 → 藍紫 → 橘 → 黃。 */
		var cyc_sets = {1:[2], 2:[2, 0], 3:[2, 0, 5], 4:[2, 0, 5, 4], 5:[2, 0, 5, 4, 3], 6:[0, 1, 2, 3, 4, 5]};
		function cycN () {
			try { var v = parseInt (window.localStorage.getItem ('pk_mrk_ncol'), 10); return v >= 1 && v <= 6 ? v : 6; }
			catch (e) { return 6; }
		}
		function cycColor ( u ) {
			var s = cyc_sets[cycN ()], L = s.length;
			return cols[ s[ (((u - 2) % L) + L) % L ] ];
		}
		var ed = mk (), mt = mk ();

		function mk () { return {l:[], u:1, a:null, v:null, off:null, s:1}; }
		function mtOn () { var m = app.multitrack; return !!(m && m.IsOn && m.IsOn ()); }
		function cx ( n ) { return n === 'mt' ? mt : n === 'ed' ? ed : mtOn () ? mt : ed; }
		function nm ( s ) { s = (s || '').replace (/[\r\n\t]/g, ' ').trim (); return s ? s.substr (0, max) : ''; }
		/* [新增] 備註：單行、最長 maxNote 字；空字串代表沒有備註 */
		function nt ( s ) { s = String (s === undefined || s === null ? '' : s).replace (/[\r\n\t]+/g, ' ').trim (); return s.substr (0, maxNote); }
		function color ( s ) { return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test (s || '') ? s : 0; }
		function redraw () { if (!raf) raf = w.requestAnimationFrame (function () { raf = 0; q.draw (); }); }
		function emit ( c, id ) {
			if (id) c.a = id;
			redraw ();
			app.fireEvent ('DidMarkersChange');	/* [新增] 通知標記清單面板更新 */
		}
		function dur ( c ) {
			if (c === mt) {
				var m = app.multitrack;
				return m && m.GetDuration ? m.GetDuration () || 0 : 0;
			}
			var ws = app.engine && app.engine.wavesurfer;
			return ws && ws.getDuration ? ws.getDuration () || 0 : 0;
		}
		function can ( c ) {
			var m = app.multitrack;
			return c === mt ? !!(m && m.HasClips && m.HasClips ()) : dur (c) > 0;
		}
		function at ( c, t ) {
			var durr = dur ( c );
			t = isFinite (t) ? +t : 0;
			return t < 0 ? 0 : durr > 0 && t > durr ? durr : t;
		}
		function now ( c ) {
			if (c === mt) {
				var m = app.multitrack;
				return m && m.GetCursor ? m.GetCursor () || 0 : 0;
			}
			var ws = app.engine && app.engine.wavesurfer;
			return ws && ws.getDuration ? (ws.ActiveMarker || 0) * (ws.getDuration () || 0) : 0;
		}
		function seek ( c, t ) {
			var durr = dur ( c );
			app.fireEvent ('RequestSeekTo', durr > 0 ? at (c, t) / durr : 0);
			reveal ( c, durr > 0 ? at (c, t) : 0 );
		}
		/* 跳到標記時，若標記不在目前可見範圍，就把波形視窗捲到標記（置中）。
		 * 已在畫面內就不動，避免連續點相鄰標記時畫面一直跳。 */
		function reveal ( c, t ) {
			try {
				var lo, hi;
				if (c === mt) {
					var m = app.multitrack, v = m && m.GetVisible && m.GetVisible ();
					if (v) { lo = v[0]; hi = v[1]; }
				}
				else {
					var ws = app.engine && app.engine.wavesurfer, d0 = ws && ws.getDuration && ws.getDuration ();
					if (!ws || !(d0 > 0) || !(ws.ZoomFactor > 1)) return ;	/* 沒放大＝整段都看得到 */
					lo = ws.LeftProgress || 0;
					hi = lo + (ws.VisibleDuration || d0 / ws.ZoomFactor);
				}
				if (lo !== undefined && t >= lo && t <= hi) return ;
				app.fireEvent ('RequestViewCenterToCursor');
			} catch (e) {}
		}
		function playing ( c ) {
			var m = app.multitrack, ws = app.engine && app.engine.wavesurfer;
			return c === mt ? !!(m && m.IsPlaying && m.IsPlaying ()) : !!(ws && ws.isPlaying && ws.isPlaying ());
		}
		function sort ( c ) {
			c.l.sort (function ( a, b ) { return a.time === b.time ? (a.id > b.id ? 1 : -1) : a.time - b.time; });
		}
		function ix ( c, id ) {
			for (var i = 0; i < c.l.length; ++i)
				if (c.l[i].id === id) return i;
			return -1;
		}
		function ser ( c ) {
			for (var a = [], i = 0, m; i < c.l.length; ++i) {
				m = c.l[i];
				a[i] = {id:m.id, time:m.time, name:m.name, color:m.color, loop:!!m.loop};
				if (m.note) a[i].note = m.note;
				if (m.end > m.time) a[i].end = m.end;	/* [階段 3] 選填：區間標記的結束時間；沒有就是點標記 */
				if (m.type) a[i].type = m.type;	/* [階段 3] 選填：'chapter' | 'loop'；沒寫就是一般標記 */
				if (m.locked) a[i].locked = true;	/* [新增] 選填：鎖定後不能拖曳 */	/* [新增] 選填欄位：沒有備註就不寫，舊草稿／工作階段格式不變 */
			}
			return a;
		}
		function hist ( c, prev, desc ) {
			app.fireEvent ('StateRequestPush', {type:'mrk', ctx:c === mt ? 'mt' : 'ed', desc:desc, markers:prev});
		}
		/* [階段 3] 標記類型：'' 一般、'chapter' 章節、'loop' 循環（loop 欄位與 type==='loop' 同步，舊資料的 loop:true 視為循環） */
		var types = ['', 'chapter', 'loop'];
		function ty ( o ) { return o && o.type === 'chapter' ? 'chapter' : o && (o.type === 'loop' || (!o.type && o.loop)) ? 'loop' : ''; }
		/* raw=true：還原復原快照用，不依目前音訊長度截斷時間（切換緩衝區的順序不固定） */
		function make ( c, o, raw ) {
			o = o || {};
			var a = raw ? Math.max (0, isFinite (o.time) ? +o.time : 0) : at (c, o.time), id, n;
			id = o.id || ('m' + c.u++);
			n = ((id || '').match (/^m(\d+)$/) || 0)[1] / 1;
			if (n >= c.u) c.u = n + 1;
			var r = {
				id:id,
				time:a,
				name:nm (o.name) || nm (PKLocale.t('ui.marker') + ' ' + id.substr (1)),
				color:color (o.color) || cycColor (c.u),
				loop:ty (o) === 'loop'
			};
						if (o.end !== undefined && o.end !== null && isFinite (o.end)) {
				var en = raw ? +o.end : at (c, o.end);
				if (en > a + 0.001) r.end = en;
			}
			if (ty (o)) r.type = ty (o);
			if (nt (o.note)) r.note = nt (o.note);
			if (o.locked) r.locked = true;
			return r;
		}
		function load ( c, a, h, raw ) {
			var old = ser ( c ), keep = c.a;
			c.l = [];
			c.u = 1;
			for (var i = 0; a && i < a.length; ++i) c.l[i] = make (c, a[i], raw);
			if (h !== false) hist (c, old, t('mrk.desc.load'));
			sort ( c );
			c.a = raw && ix (c, keep) >= 0 ? keep : c.l[0] ? c.l[0].id : null;
			emit ( c );
		}
		function clear ( c, h ) {
			if (!c.l.length) return false;
			if (h !== false) hist (c, ser (c), t('mrk.desc.clear'));
			c.l = [];
			c.u = 1;
			c.a = null;
			emit ( c );
			return true;
		}
		function add ( c, o, h ) {
			if (!can (c)) return false;
			var old = ser ( c ), m = make (c, o);
			if (h !== false) hist (c, old, t('mrk.desc.add'));
			c.l[c.l.length] = m;
			sort ( c );
			emit (c, m.id);
			return m;
		}
		function rem ( c, id, h ) {
			var i = ix (c, id);
			if (i < 0) return false;
			if (h !== false) hist (c, ser (c), t('mrk.desc.delete'));
			c.l.splice (i, 1);
			c.a = c.l[0] ? c.l[0].id : null;
			emit ( c );
			return true;
		}
		function ren ( c, id, name, h ) {
			var i = ix (c, id);
			if (i < 0) return false;
			name = nm ( name );
			if (!name || c.l[i].name === name) return false;
			if (h !== false) hist (c, ser (c), t('mrk.desc.rename'));
			c.l[i].name = name;
			emit (c, id);
			return true;
		}
		function jump ( c, dir, sel ) {
			if (!c.l.length) return ;
			for (var t = now (c), m = null, i = dir < 0 ? c.l.length - 1 : 0; dir < 0 ? i >= 0 : i < c.l.length; i += dir)
				if (dir < 0 ? c.l[i].time < t - 0.001 : c.l[i].time > t + 0.001) { m = c.l[i]; break; }
			if (!m) m = dir < 0 ? c.l[c.l.length - 1] : c.l[0];
			if (sel) app.fireEvent ('RequestRegionSet', Math.min (t, m.time), Math.max (t, m.time));
			else {
				emit (c, m.id);
				/* [階段 5] 逐標記播放模式開著：句首提前，並直接把這段當作「正在播的段落」 */
				if (c === ed && pmMode () !== 'off') { pmTrack (c, ix (c, m.id)); seek (c, jumpPlayOn () ? Math.max (0, m.time - pmPre ()) : m.time); }
				else seek (c, m.time);
				/* [階段 4] 跳到標記後自動播放（已在播放就維持播放） */
				if (jumpPlayOn () && !playing (c)) app.fireEvent ('RequestPlay');
			}
		}
		function drop ( o ) {
			var c = cx (), m;
			o = o || {};
			/* [修改] 若開啟「新增後立即命名」，加完直接跳出改名視窗 */
			m = o.time !== undefined ? add (c, o) : add (c, {time:now (c), name:o.name, color:o.color});
			if (m && !o.name && askName ()) renameUi (c, m.id);
			return m;
		}
		function renameUi ( c, id ) {
			var i = ix (c, id), mid = 'mrk_ren';
			if (i < 0) return ;
			new PKSimpleModal ({
				title:PKLocale.t('mrk.desc.rename'),
				clss:'pk_fnt10',
				ondestroy:function () {
					app.ui.InteractionHandler.forceUnset (mid);
					app.ui.KeyHandler.removeCallback (mid + 'esc');
					app.ui.KeyHandler.removeCallback (mid + 'en');
				},
				buttons:[{title:PKLocale.t('save_local.btn'), clss:'pk_modal_a_accpt', callback:function ( m ) {
					var v = nm (m.el_body.getElementsByTagName ('input')[0].value);
					if (v) { ren (c, id, v); m.Destroy (); }
					else OneUp (t('marker.name_too_short'), 1200);
				}}],
				body:'<label for="k_mrkr">' + PKLocale.t('ui.marker_name') + '</label><input style="width:100%;box-sizing:border-box;min-width:0" maxlength="' + max + '" class="pk_txt" type="text" id="k_mrkr" />',
				setup:function ( m ) {
					app.ui.InteractionHandler.forceSet (mid);
					app.ui.KeyHandler.addCallback (mid + 'esc', function () { if (app.ui.InteractionHandler.check (mid)) m.Destroy (); }, [27]);
					app.ui.KeyHandler.addCallback (mid + 'en', function () { if (app.ui.InteractionHandler.check (mid)) m.els.bottom[0].click (); }, [13]);
					setTimeout (function () {
						if (!m.el) return ;
						var inp = m.el.getElementsByTagName ('input')[0];
						inp.value = c.l[i].name;
						inp.focus ();
						inp.selectionStart = inp.selectionEnd = inp.value.length;
					}, 20);
				}
			}).Show ();
		}
		/* ==================================================================
		 * [新增] 標記管理 API（給標記清單面板、右鍵選單與快捷鍵使用）
		 * 所有會改動標記的操作都會寫入復原歷史。
		 * ================================================================== */
		function region () {
			var h = PKAE._deps.uiHelpers;
			return h && h.activeRegionFor ? h.activeRegionFor ( app ) : null;
		}
		function pad ( n, l ) { n = String (n); while (n.length < l) n = '0' + n; return n; }
		/* 秒 → 時:分:秒.毫秒（不滿 1 小時就省略時） */
		function fmt ( s ) {
			s = isFinite (s) && s > 0 ? s : 0;
			var ms = Math.round (s * 1000), h = (ms / 3600000) >> 0, m, sec;
			ms -= h * 3600000;
			m = (ms / 60000) >> 0; ms -= m * 60000;
			sec = (ms / 1000) >> 0; ms -= sec * 1000;
			return (h ? h + ':' + pad (m, 2) : m) + ':' + pad (sec, 2) + '.' + pad (ms, 3);
		}
		/* 時間文字 → 秒；接受 1:02:03.5、2:03.5、123.4；格式錯誤回傳 null */
		function parse ( str ) {
			str = String (str || '').replace (/[\s：]/g, function ( x ) { return x === '：' ? ':' : ''; });
			if (!/^\d+(\.\d+)?$|^(\d+:)?\d+:\d+(\.\d+)?$/.test (str)) return null;
			var p = str.split (':'), v = 0, i;
			for (i = 0; i < p.length; ++i) v = v * 60 + parseFloat (p[i]);
			return isFinite (v) ? v : null;
		}
		/* [標籤列 階段 1] 標記名稱常駐顯示（預設開啟；localStorage: pk_mrk_labels） */
		function labelsOn () { try { return w.localStorage.getItem ('pk_mrk_labels') !== '0'; } catch (e) { return true; } }
		/* [標籤列 階段 2] 標籤列開關（預設開啟；localStorage: pk_mrk_track）。沒有任何標記時不佔空間 */
		function trackOn () { try { return w.localStorage.getItem ('pk_mrk_track') !== '0'; } catch (e) { return true; } }
		/* [標籤列 設定] 層數：0＝自動（依重疊數增減，最多 TAUTO 層）；1~6＝固定層數（localStorage: pk_mrk_lanes） */
		var TAUTO = 4, TMAXL = 6;
		function trkLanes () { try { var v = parseInt (w.localStorage.getItem ('pk_mrk_lanes'), 10); return v >= 1 && v <= TMAXL ? v : 0; } catch (e) { return 0; } }
		/* [標籤列 設定] 摺疊：標籤列縮成一條細帶，名稱改顯示在聲波上（localStorage: pk_mrk_fold） */
		function trkFold () { try { return w.localStorage.getItem ('pk_mrk_fold') === '1'; } catch (e) { return false; } }
		function askName () { try { return w.localStorage.getItem ('pk_mrk_askname') === '1'; } catch (e) { return false; } }
		/* 區間標記整段移動：長度不變，超出音訊結尾時把起點往前推 */
		function slide ( c, m, len, t ) {
			var durr = dur ( c );
			if (len && durr > 0 && t + len > durr) t = Math.max (0, durr - len);
			m.time = t;
			if (len) m.end = t + len;
		}
		function setTime ( c, id, time ) {
			var i = ix (c, id), m, len;
			if (i < 0) return false;
			m = c.l[i]; len = m.end ? m.end - m.time : 0;
			time = at (c, time);
			if (len && dur (c) > 0 && time + len > dur (c)) time = Math.max (0, dur (c) - len);
			if (Math.abs (m.time - time) < 0.0001) return false;
			hist (c, ser (c), t('mrk.desc.move'));
			slide (c, m, len, time);
			sort ( c );
			emit (c, id);
			return true;
		}
		function setColor ( c, id, col ) {
			var i = ix (c, id);
			col = color ( col );
			if (i < 0 || !col || c.l[i].color === col) return false;
			hist (c, ser (c), T ('desc_color'));
			c.l[i].color = col;
			emit (c, id);
			return true;
		}
		/* 依目前的循環色數，從第一個標記開始重新配色（依時間順序）。回傳實際變色的個數 */
		function recolorAll ( c ) {
			var s = cyc_sets[cycN ()], L = s.length, i, n = 0, want = [];
			for (i = 0; i < c.l.length; ++i) {
				want[i] = cols[ s[ i % L ] ];
				if (c.l[i].color !== want[i]) ++n;
			}
			if (!n) return 0;
			hist (c, ser (c), T ('desc_recolor'));
			for (i = 0; i < c.l.length; ++i) c.l[i].color = want[i];
			emit ( c );
			return n;
		}
		function removeMany ( c, ids ) {
			var set = {}, keep = [], i, n = 0;
			for (i = 0; i < ids.length; ++i) set[ ids[i] ] = 1;
			for (i = 0; i < c.l.length; ++i) { if (set[ c.l[i].id ]) ++n; else keep.push (c.l[i]); }
			if (!n) return 0;
			hist (c, ser (c), n === 1 ? t('mrk.desc.delete') : T ('desc_del_many'));
			c.l = keep;
			if (ix (c, c.a) < 0) c.a = c.l[0] ? c.l[0].id : null;
			emit ( c );
			return n;
		}
		function removeRange ( c, lo, hi ) {
			for (var ids = [], i = 0; i < c.l.length; ++i)
				if (c.l[i].time >= lo - 0.0005 && c.l[i].time <= hi + 0.0005) ids.push (c.l[i].id);
			return removeMany (c, ids);
		}
		/* ==================================================================
		 * [新增 階段 2] 備註、批次改名、批次匯入、拖曳吸附
		 * ================================================================== */
		function setNote ( c, id, note ) {
			var i = ix (c, id);
			if (i < 0) return false;
			note = nt ( note );
			if ((c.l[i].note || '') === note) return false;
			hist (c, ser (c), T ('desc_note'));
			if (note) c.l[i].note = note; else delete c.l[i].note;
			emit (c, id);
			return true;
		}
		/* map：{ 標記id: 新名稱 }；整批只留一筆復原紀錄 */
		function renameMany ( c, map ) {
			var i, n = 0, nn;
			for (i = 0; i < c.l.length; ++i) {
				nn = map[ c.l[i].id ] === undefined ? '' : nm ( map[ c.l[i].id ] );
				if (nn && nn !== c.l[i].name) ++n;
			}
			if (!n) return 0;
			hist (c, ser (c), T ('desc_rename_many'));
			for (i = 0; i < c.l.length; ++i) {
				nn = map[ c.l[i].id ] === undefined ? '' : nm ( map[ c.l[i].id ] );
				if (nn) c.l[i].name = nn;
			}
			emit ( c );
			return n;
		}
		/* items：[{time, name, color?, note?}]；replace=true 先清空。超出音訊長度與重複（同時間＋同名稱）的會略過 */
		function importMany ( c, items, replace ) {
			var res = {added:0, skipped:0}, durr = dur ( c ), i, j, o, dup, keep = replace ? [] : c.l, made = [], m;
			if (!can (c) || !items || !items.length) return res;
			for (i = 0; i < items.length; ++i) {
				o = items[i];
				if (!o || !isFinite (o.time) || o.time < 0 || (durr > 0 && o.time > durr + 0.05)) { ++res.skipped; continue; }
				dup = false;
				for (j = 0; j < keep.length && !dup; ++j)
					dup = Math.abs (keep[j].time - o.time) < 0.001 && nm (o.name) && keep[j].name === nm (o.name);
				for (j = 0; j < made.length && !dup; ++j)
					dup = Math.abs (made[j].time - o.time) < 0.001 && nm (o.name) && made[j].name === nm (o.name);
				if (dup) { ++res.skipped; continue; }
				if (replace && !made.length) c.u = 1;	/* 取代模式：編號從頭開始 */
				m = make (c, {time:o.time, name:o.name, color:o.color, note:o.note, type:o.type, end:o.end});
				made.push (m);
			}
			if (!made.length) return res;
			hist (c, ser (c), T ('desc_import'));
			c.l = (replace ? [] : c.l).concat (made);
			sort ( c );
			if (replace || ix (c, c.a) < 0) c.a = c.l[0] ? c.l[0].id : null;
			res.added = made.length;
			emit ( c );
			return res;
		}
		/* 吸附：預設開啟，可在清單面板關掉；拖曳時按住 Shift 可暫時不吸附 */
		function snapOn () { try { return w.localStorage.getItem ('pk_mrk_snap') !== '0'; } catch (e) { return true; } }
		function snapTime ( c, id, tm, mtr, shift ) {
			if (shift || !snapOn ()) return tm;
			var px = mtr.x (1) - mtr.x (0), lim, best = tm, bd, i, r, cand = [];
			if (!(px > 0)) return tm;
			lim = 8 / px;	/* 8 像素內吸附 */
			for (i = 0; i < c.l.length; ++i) if (c.l[i].id !== id) cand.push (c.l[i].time);
			cand.push (now (c), 0);
			r = c === cx () ? region () : null;
			if (r) { cand.push (r.start); cand.push (r.end); }
			bd = lim;
			for (i = 0; i < cand.length; ++i)
				if (Math.abs (cand[i] - tm) < bd) { bd = Math.abs (cand[i] - tm); best = cand[i]; }
			if (best === tm) {	/* 沒吸到標記／游標／選取邊界時，才找靜音邊界，再微調到零交越點 */
				if (silOn ()) best = silenceEdge (c, best, lim);
				if (zcOn ()) best = zeroCross (c, best, lim);
			}
			return best;
		}
		function setLocked ( c, id, v ) {
			var i = ix (c, id);
			if (i < 0 || !!c.l[i].locked === !!v) return false;
			hist (c, ser (c), T ('desc_lock'));
			if (v) c.l[i].locked = true; else delete c.l[i].locked;
			emit (c, id);
			return true;
		}
				/* ==================================================================
		 * [階段 3] 區間標記：選填 end（秒）。有 end 就是區間，沒有就是點標記。
		 * ================================================================== */
		/* end 為 null／太接近起點 → 改回點標記。起點與結束一起改只留一筆復原紀錄 */
		function setRange ( c, id, start, end ) {
			var i = ix (c, id), m, hasEnd;
			if (i < 0) return false;
			m = c.l[i];
			start = at (c, start === undefined || start === null ? m.time : start);
			end = end === undefined ? (m.end || null) : end;
			end = end === null || !isFinite (end) ? null : at (c, end);
			hasEnd = end !== null && end > start + 0.001;
			if (Math.abs (m.time - start) < 0.0001 && (hasEnd ? Math.abs ((m.end || -1) - end) < 0.0001 : !m.end)) return false;
			hist (c, ser (c), T ('desc_range_edit'));
			m.time = start;
			if (hasEnd) m.end = end; else delete m.end;
			sort ( c );
			emit (c, id);
			return true;
		}
		function toRange ( c, id ) {
			var i = ix (c, id), nx;
			if (i < 0 || c.l[i].end) return false;
			nx = c.l[i + 1] ? c.l[i + 1].time : dur (c);
			if (!(nx > c.l[i].time + 0.001)) { OneUp (T ('no_next'), 1400); return false; }
			return setRange (c, id, c.l[i].time, nx);
		}
		function rangeFromSel ( c, id ) {
			var r = region ();
			if (!r || !(r.end > r.start)) return false;
			return setRange (c, id, r.start, r.end);
		}
		/* 目前選取範圍 → 新的區間標記 */
		function addRangeSel ( c ) {
			var r = region (), m;
			if (!can (c)) return false;
			if (!r || !(r.end > r.start)) { OneUp (T ('no_sel'), 1400); return false; }
			m = add (c, {time:r.start, end:r.end});
			if (m && askName ()) renameUi (c, m.id);
			return m;
		}
		function endUi ( c, id ) {
			var i = ix (c, id), mid = 'mrk_en';
			if (i < 0) return ;
			new PKSimpleModal ({
				title:T ('end_title'),
				clss:'pk_fnt10',
				ondestroy:function () { modalOff ( mid ); },
				buttons:[{title:PKLocale.t('save_local.btn'), clss:'pk_modal_a_accpt', callback:function ( m ) {
					var raw = m.el_body.getElementsByTagName ('input')[0].value, v = /^\s*$/.test (raw) ? null : parse (raw);
					if (raw && v === null && !/^\s*$/.test (raw)) { OneUp (T ('time_bad'), 1400); return ; }
					if (v !== null && !(v > c.l[i].time + 0.001)) { OneUp (T ('end_bad'), 1400); return ; }
					setRange (c, id, c.l[i].time, v);
					m.Destroy ();
				}}],
				body:'<label for="k_mrke">' + T ('end_label') + '</label><input style="width:100%;box-sizing:border-box;min-width:0" class="pk_txt" type="text" id="k_mrke" />',
				setup:function ( m ) {
					modalKeys ( m, mid );
					setTimeout (function () {
						if (!m.el) return ;
						var inp = m.el.getElementsByTagName ('input')[0];
						inp.value = c.l[i].end ? fmt (c.l[i].end) : '';
						inp.focus ();
						inp.select ();
					}, 20);
				}
			}).Show ();
		}
		/* ==================================================================
		 * [階段 3] 標記類型：一般／章節／循環
		 * ================================================================== */
		function setType ( c, id, type ) {
			var i = ix (c, id);
			type = ty ({type:type});
			if (i < 0 || (c.l[i].type || '') === type) return false;
			hist (c, ser (c), T ('desc_type'));
			c.l[i].type = type;
			c.l[i].loop = type === 'loop';
			if (!type) delete c.l[i].type;
			emit (c, id);
			return true;
		}
		function cycleType ( c, id ) {
			var i = ix (c, id);
			if (i < 0) return false;
			return setType (c, id, types[ (types.indexOf (c.l[i].type || '') + 1) % types.length ]);
		}
		/* 循環播放「這個標記到下一個標記」：選取該段、開啟循環、從頭播放 */
		function playLoop ( c, id ) {
			var i = ix (c, id), r;
			if (i < 0) return ;
			selectBetween (c, id);
			r = region ();
			if (!r || !r.loop) app.fireEvent ('RequestSetLoop');
			seek (c, c.l[i].time);
			if (!playing (c)) app.fireEvent ('RequestPlay');
		}
		/* ==================================================================
		 * [階段 3] 編輯連動：單軌剪下／刪除／插入／貼上／取代之後，標記跟著音訊位移
		 *   - 由 actions.js 在改動緩衝區「之前」呼叫（此時音訊長度還沒變，所以不能用 at() 截斷）
		 *   - 不另外寫復原紀錄：StateRequestPush 時已把標記快照附在該筆復原狀態上（見檔尾事件）
		 *   - 鎖定的標記也會跟著位移（鎖定只防止誤拖，不是釘在時間軸上）
		 *   kind  'remove'  移除 [at, at+len)：範圍內的標記收攏到 at，之後的往前移 len
		 *         'insert'  在 at 插入 len：嚴格在 at 之後的往後移 len（剛好在 at 的留在原地）
		 *         'replace' 把 [at, at+len) 換成長度 len2：之後的位移 len2-len，範圍內的依比例伸縮
		 * ================================================================== */
		/* [階段 2 項目 11] 取代長度不同時：預設範圍內標記依比例伸縮；開啟後改為收攏到起點（貼上覆蓋這種情況比較合理） */
		function replCollapse () { try { return w.localStorage.getItem ('pk_mrk_repl') === '1'; } catch (e) { return false; } }
		/* [階段 2 項目 10] 多軌波紋刪除：預設關閉 */
		function rippleOn () { try { return w.localStorage.getItem ('pk_mrk_ripple') === '1'; } catch (e) { return false; } }
		function followOn () { try { return w.localStorage.getItem ('pk_mrk_follow') !== '0'; } catch (e) { return true; } }
		function editShift ( kind, at, len, len2, which ) {
			var c = which === 'mt' ? mt : ed, i, m, tm, en, n = 0, eps = 1e-6, dl;
			/* 單軌看「標記跟著編輯移動」；多軌（波紋刪除）由呼叫端先確認波紋選項 */
			if ((c === ed && !followOn ()) || !c.l.length) return 0;
			at = +at; len = +len; len2 = +len2;
			if (!isFinite (at) || !isFinite (len) || at < 0) return 0;
			if (kind === 'remove' || kind === 'insert') { if (!(len > 0)) return 0; }
			else if (kind === 'replace') {
				if (!isFinite (len2) || len < 0 || len2 < 0 || Math.abs (len2 - len) < eps) return 0;
				dl = len2 - len;
			}
			else return 0;
			/* 起點與（區間的）結束點用同一套規則；剪掉整個區間時結束點收攏到起點，區間就退化成點標記 */
			function mp ( x ) {
				if (kind === 'remove') return x >= at + len - eps ? x - len : x > at ? at : x;
				if (kind === 'insert') return x > at + eps ? x + len : x;
				return x >= at + len - eps ? x + dl : x > at ? (len > 0 && !replCollapse () ? at + (x - at) * len2 / len : at) : x;
			}
			for (i = 0; i < c.l.length; ++i) {
				m = c.l[i]; tm = Math.max (0, mp (m.time));
				en = m.end ? Math.max (0, mp (m.end)) : 0;
				if (Math.abs (tm - m.time) > 1e-9 || (m.end && Math.abs (en - m.end) > 1e-9)) {
					m.time = tm;
					if (m.end) { if (en > tm + 0.001) m.end = en; else delete m.end; }
					++n;
				}
			}
			if (n) { sort ( c ); emit ( c ); }
			return n;
		}
		/* 音訊長度變短之後（剪下、復原、載入…），超出結尾的單軌標記拉回結尾，避免跑到波形外面。
		 * 延後到本次編輯結束才處理：「取代」會先移除再插入，中間那一刻緩衝區是比較短的，不能在那時截斷。 */
		var clampT = 0;
		function clampSoon () {
			if (clampT) return ;
			clampT = w.setTimeout (function () { clampT = 0; clampEd (); }, 0);
		}
		function clampEd () {
			var durr = dur ( ed ), i, n = 0;
			if (!(durr > 0)) return ;
			for (i = 0; i < ed.l.length; ++i)
				{
					if (ed.l[i].time > durr) { ed.l[i].time = durr; ++n; }
					if (ed.l[i].end > durr) { if (durr > ed.l[i].time + 0.001) ed.l[i].end = durr; else delete ed.l[i].end; ++n; }
				}
			if (n) { sort ( ed ); emit ( ed ); }
		}
		/* 零交越吸附（只用在單軌）：在 tm 附近找最近的由負轉正位置，避免切點爆音 */
		function zcOn () { try { return w.localStorage.getItem ('pk_mrk_zc') === '1'; } catch (e) { return false; } }
		/* 靜音邊界吸附（只用在單軌）：以 5ms 為單位算音量，找最近的「有聲↔靜音」轉折點（門檻約 -50dB） */
		function silOn () { try { return w.localStorage.getItem ('pk_mrk_sil') === '1'; } catch (e) { return false; } }
		function silenceEdge ( c, tm, lim ) {
			if (c !== ed) return tm;
			var ws = app.engine && app.engine.wavesurfer, buf = ws && ws.backend && ws.backend.buffer, data, sr, win, n, r, k, s0, s1, ch, nc, i, j, v, acc;
			if (!buf || !buf.getChannelData) return tm;
			sr = buf.sampleRate; win = Math.max (16, Math.round (sr * 0.005)); nc = Math.min (2, buf.numberOfChannels || 1);
			n = Math.floor (buf.length / win);
			r = Math.min (Math.round (Math.min (lim, 0.3) * sr / win), 60);	/* 最多找 300ms */
			i = Math.floor (tm * sr / win);
			if (i < 1 || i >= n) return tm;
			function quiet ( idx ) {
				if (idx < 0 || idx >= n) return null;
				acc = 0;
				for (ch = 0; ch < nc; ++ch) {
					data = buf.getChannelData (ch);
					for (j = idx * win; j < (idx + 1) * win; ++j) { v = data[j]; acc += v * v; }
				}
				return Math.sqrt (acc / (win * nc)) < 0.003;
			}
			for (k = 0; k <= r; ++k) {
				s0 = quiet (i + k); s1 = quiet (i + k - 1);
				if (s0 !== null && s1 !== null && s0 !== s1) return (i + k) * win / sr;
				if (k) {
					s0 = quiet (i - k); s1 = quiet (i - k - 1);
					if (s0 !== null && s1 !== null && s0 !== s1) return (i - k) * win / sr;
				}
			}
			return tm;
		}
		function zeroCross ( c, tm, lim ) {
			if (c !== ed) return tm;
			var ws = app.engine && app.engine.wavesurfer, buf = ws && ws.backend && ws.backend.buffer, data, sr, i0, r, k, a;
			if (!buf || !buf.getChannelData) return tm;
			data = buf.getChannelData (0); sr = buf.sampleRate;
			i0 = Math.round (tm * sr);
			r = Math.min (Math.round (lim * sr), 4410);	/* 最多 100ms，避免跳太遠 */
			if (i0 < 1 || i0 >= data.length) return tm;
			for (k = 0; k <= r; ++k) {
				a = i0 + k;
				if (a > 0 && a < data.length && data[a - 1] <= 0 && data[a] > 0) return a / sr;
				a = i0 - k;
				if (a > 0 && a < data.length && data[a - 1] <= 0 && data[a] > 0) return a / sr;
			}
			return tm;
		}
		/* ==================================================================
		 * [階段 4] 分割、合併、跳到標記後自動播放
		 *   分割：游標落在「區間標記」內 → 切成前後兩個區間（後段繼承顏色與類型）；
		 *         游標落在「點標記」的段落內（該點到下一個標記之間）→ 在游標處新增一個點標記。
		 *   合併：相鄰標記合成第一個（保留名稱、顏色、類型；備註串接）。
		 *         全是點標記 → 其餘點標記被移除（第一個點的段落自然延伸到下一個標記）；
		 *         含區間標記 → 變成一個區間，從第一個的起點到最後一個的結束。
		 *   鎖定的標記不能分割或合併。每次動作只留一筆復原紀錄。
		 * ================================================================== */

		/* ==================================================================
		 * [階段 5] 逐標記播放模式（單軌）
		 *   模式  off 關閉 | stop 每段播完停止，游標回到句首 | next 播完自動接下一個標記
		 *   句首提前 pk_mrk_pre：從標記起點前幾秒開始播（0～5 秒，預設 0）
		 *   每段最多 pk_mrk_max：每段最長播幾秒，超過就視為播完（0＝不限）
		 *   「段落」＝ secEnd()：區間標記用 end，點標記到下一個標記，最後一個點標記到音訊結尾。
		 *   有選取範圍（含循環）時不介入，由選取範圍自己決定播放範圍。
		 *   靠 DidAudioProcess 逐幀檢查時間，約有一個畫面更新（十幾毫秒）的誤差。
		 * ================================================================== */
		function lsGet ( k, def ) { try { var v = w.localStorage.getItem (k); return v === null ? def : v; } catch (e) { return def; } }
		function lsSet ( k, v ) { try { w.localStorage.setItem (k, String (v)); } catch (e) {} }
		function pmMode () { var v = lsGet ('pk_mrk_pm', 'off'); return v === 'stop' || v === 'next' ? v : 'off'; }
		function pmPre () { var v = parseFloat (lsGet ('pk_mrk_pre', '0')); return isFinite (v) && v > 0 ? Math.min (v, 5) : 0; }
		function pmMax () { var v = parseFloat (lsGet ('pk_mrk_max', '0')); return isFinite (v) && v > 0 ? Math.min (v, 600) : 0; }
		var pm = {id:null, end:0, skip:0, rep:0};
		function pmNow () { return w.performance && w.performance.now ? w.performance.now () : Date.now (); }
		/* t 落在哪個段落（含）；沒有（標記之間的空白、第一個標記之前）回傳 -1 */
		function pmSecAt ( c, t ) {
			for (var i = c.l.length - 1; i >= 0; --i)
				if (c.l[i].time <= t + 0.001 && t < secEnd (c, i) - 0.001) return i;
			return -1;
		}
		/* t 之後第一個標記的索引；沒有回傳 -1 */
		function pmNext ( c, t ) {
			for (var i = 0; i < c.l.length; ++i) if (c.l[i].time > t + 0.001) return i;
			return -1;
		}
		/* 記下「正在播第 i 段」，base＝計算每段上限的起算時間 */
		function pmTrack ( c, i, base ) {
			if (i < 0 || !c.l[i]) { pm.id = null; return ; }
			var st = c.l[i].time, en = secEnd (c, i), mx = pmMax ();
			pm.id = c.l[i].id;
			pm.rep = 0;
			pm.end = mx > 0 ? Math.min (en, Math.max (st, base || st) + mx) : en;
			pm.skip = pmNow () + 150;	/* 自己剛跳轉完，先忽略幾幀還沒更新的時間 */
		}
		function pmGo ( c, i ) {
			pmTrack (c, i);
			emit (c, c.l[i].id);
			seek (c, Math.max (0, c.l[i].time - pmPre ()));
		}
		function pmHalt ( c, i ) {
			pm.id = null;
			pm.skip = pmNow () + 300;
			app.fireEvent ('RequestPause');
			if (i >= 0 && c.l[i]) { emit (c, c.l[i].id); seek (c, Math.max (0, c.l[i].time - pmPre ())); }
		}
		function pmTick ( ev ) {
			var c = ed, ws, t, i, a, j;
			if (pmMode () === 'off' || !c.l.length || mtOn ()) return ;
			ws = app.engine && app.engine.wavesurfer;
			if (!ws || !ws.isPlaying || !ws.isPlaying () || pmNow () < pm.skip) return ;
			if (region ()) return ;
			t = ev && ev[0] >= 0 ? ev[0] : ws.getCurrentTime ();
			if (!(t >= 0)) return ;
			i = pm.id ? ix (c, pm.id) : -1;
			/* 使用者自己點到別的地方：重新判斷 */
			if (i >= 0 && (t < c.l[i].time - pmPre () - 0.3 || t > secEnd (c, i) + 0.3)) i = -1;
			if (i < 0) {
				pm.id = null;
				a = c.a ? ix (c, c.a) : -1;
				/* 剛跳到標記（含句首提前）後按播放：以目前標記為準，不要誤判成前一段 */
				i = a >= 0 && t >= c.l[a].time - pmPre () - 0.05 && t < secEnd (c, a) - 0.001 ? a : pmSecAt (c, t);
				if (i >= 0) {
					pmTrack (c, i, t);
					pm.skip = 0;
					if (c.a !== c.l[i].id) emit (c, c.l[i].id);
				}
				else {
					j = pmNext (c, t);
					if (j >= 0) pmGo (c, j);
					else { OneUp (T ('pm_done'), 1200); pmHalt (c, -1); }
					return ;
				}
			}
			if (t >= pm.end - 0.02) {
				/* [循環次數] 逐段模式：每段先重複播到指定次數（0 視為 1 次），再停止或接下一段 */
				if (pm.rep + 1 < (lcMax () || 1)) {
					pm.rep++;
					pm.end = pmMax () > 0 ? Math.min (secEnd (c, i), c.l[i].time + pmMax ()) : secEnd (c, i);
					pm.skip = pmNow () + 150;
					seek (c, Math.max (0, c.l[i].time - pmPre ()));
					return ;
				}
				if (pmMode () === 'next') {
					j = i + 1;
					if (j < c.l.length) { pmGo (c, j); return ; }
					OneUp (T ('pm_done'), 1200);
				}
				pmHalt (c, i);
			}
		}
		q.playMode = function ( v ) {
			if (v === undefined) return pmMode ();
			lsSet ('pk_mrk_pm', v === 'stop' || v === 'next' ? v : 'off');
			pm.id = null;
		};
		q.preroll = function ( v ) {
			if (v === undefined) return pmPre ();
			v = parseFloat (v);
			lsSet ('pk_mrk_pre', isFinite (v) && v > 0 ? Math.min (v, 5) : 0);
		};
		q.maxSec = function ( v ) {
			if (v === undefined) return pmMax ();
			v = parseFloat (v);
			lsSet ('pk_mrk_max', isFinite (v) && v > 0 ? Math.min (v, 600) : 0);
		};
		/* 關 → 停止 → 接下一段 → 關 */
		q.cyclePlayMode = function () {
			var n = pmMode () === 'off' ? 'stop' : pmMode () === 'stop' ? 'next' : 'off';
			q.playMode (n);
			OneUp (T ('pm_' + n), 1600);
			return n;
		};
		/* 從指定（預設目前）標記開始逐段播放；模式是關的就先切到「接下一段」 */
		q.playSections = function ( id ) {
			var c = cx (), i;
			if (c === mt) { OneUp (T ('pm_st_only'), 1500); return false; }
			if (!c.l.length) { OneUp (T ('no_marker'), 1200); return false; }
			if (pmMode () === 'off') { q.playMode ('next'); OneUp (T ('pm_next'), 1600); }
			i = ix (c, id || c.a);
			if (i < 0) { i = pmSecAt (c, now (c)); if (i < 0) i = pmNext (c, now (c)); if (i < 0) i = 0; }
			pmGo (c, i);
			if (!playing (c)) app.fireEvent ('RequestPlay');
			return true;
		};

		/* ==================================================================
		 * [階段 5] 循環次數 pk_mrk_rep（0＝無限，最多 99）
		 *   - 單軌「循環播放」（選取範圍或標記區間）：播滿指定次數後暫停，游標回到範圍起點
		 *   - 逐標記播放模式：每一段重複播指定次數，再停止或接下一段（0 視為 1 次）
		 *   循環次數靠播放時間「從範圍尾端跳回範圍前端」來數；中途點選或拖曳游標會重新計數。
		 * ================================================================== */
		function lcMax () { var v = parseInt (lsGet ('pk_mrk_rep', '0'), 10); return isFinite (v) && v > 0 ? Math.min (v, 99) : 0; }
		var lc = {prev:-1, n:0};
		function lcTick ( ev ) {
			var ws = app.engine && app.engine.wavesurfer, reg, t, len, mx = lcMax ();
			reg = ws && ws.regions && ws.regions.list ? ws.regions.list[0] : null;
			if (!reg || !reg.loop || !ws.isPlaying || !ws.isPlaying () || mtOn ()) { lc.prev = -1; return ; }
			t = ev && ev[0] >= 0 ? ev[0] : ws.getCurrentTime ();
			len = reg.end - reg.start;
			if (mx > 0 && lc.prev >= 0 && len > 0.2 && lc.prev - t > len * 0.6) {
				if (++lc.n >= mx) {
					lc.prev = -1;
					lc.n = 0;
					app.fireEvent ('RequestPause');
					seek (ed, reg.start);
					OneUp (T ('lc_done', {n:mx}), 1400);
					return ;
				}
			}
			lc.prev = t;
		}
		q.loopCount = function ( v ) {
			if (v === undefined) return lcMax ();
			v = parseInt (v, 10);
			lsSet ('pk_mrk_rep', isFinite (v) && v > 0 ? Math.min (v, 99) : 0);
			lc.n = 0; lc.prev = -1; pm.rep = 0;
		};
		/* 自動配色的循環色數（1~6）；只影響之後新增的標記 */
		q.recolorAll = function () { return recolorAll (cx ()); };
		q.colorCycle = function ( v ) {
			if (v === undefined) return cycN ();
			v = parseInt (v, 10);
			lsSet ('pk_mrk_ncol', isFinite (v) ? Math.max (1, Math.min (6, v)) : 6);
		};
		/* 無限 → 2 → 3 → 5 → 10 → 無限 */
		q.cycleLoopCount = function () {
			var seq = [0, 2, 3, 5, 10], k = seq.indexOf (lcMax ()), n = seq[(k + 1) % seq.length];
			q.loopCount (n);
			OneUp (n ? T ('lc_n', {n:n}) : T ('lc_inf'), 1400);
			return n;
		};

		/* ==================================================================
		 * [階段 5] 漏標檢查
		 *   用「自動分割 → 有聲句段」的偵測（沿用該對話框存的門檻設定）找出有聲音的區間，
		 *   扣掉已被標記涵蓋的部分（區間標記＝起點到結束；點標記＝到下一個標記；最後一個點標記到結尾），
		 *   剩下的列成清單：可跳到、試聽（選取該段並播放）、單筆加入或全部加入（一次復原）。
		 *   單軌與多軌（整體混音）都能用；單軌時清單開著會在聲波上預覽這些區間。
		 * ================================================================== */
		var mcBusy = false;
		function mcCover ( c ) {
			var a = [], out = [], i, e;
			for (i = 0; i < c.l.length; ++i) {
				e = secEnd (c, i);
				if (e > c.l[i].time) a.push ([c.l[i].time, e]);
			}
			a.sort (function ( x, y ) { return x[0] - y[0]; });
			for (i = 0; i < a.length; ++i) {
				if (out.length && a[i][0] <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max (out[out.length - 1][1], a[i][1]);
				else out.push ([a[i][0], a[i][1]]);
			}
			return out;
		}
		function mcGaps ( c, segs, minLen ) {
			var cov = mcCover (c), out = [], k, j, cur, e;
			for (k = 0; k < segs.length; ++k) {
				cur = segs[k][0]; e = segs[k][1];
				for (j = 0; j < cov.length; ++j) {
					if (cov[j][1] <= cur) continue;
					if (cov[j][0] >= e) break;
					if (cov[j][0] - cur >= minLen) out.push ([cur, cov[j][0]]);
					cur = Math.max (cur, cov[j][1]);
				}
				if (e - cur >= minLen) out.push ([cur, e]);
			}
			return out;
		}
		function mcUi ( c, gaps, total ) {
			var mid = 'mrk_mc', done = [], html = '', k, pv = c === ed;
			function pvSend () {
				if (!pv) return ;
				var left = [];
				for (var n = 0; n < gaps.length; ++n) if (!done[n]) left.push ([gaps[n][0], gaps[n][1], T ('mc_name') + ' ' + (n + 1)]);
				q.preview (left);
			}
			for (k = 0; k < gaps.length; ++k)
				html += '<div data-i="' + k + '" style="display:flex;gap:8px;align-items:center;padding:3px 0;border-bottom:1px solid var(--bd)">' +
					'<span style="min-width:22px;opacity:.6">' + (k + 1) + '</span>' +
					'<span style="flex:1">' + fmt (gaps[k][0]) + ' – ' + fmt (gaps[k][1]) + ' <small style="opacity:.6">(' + (gaps[k][1] - gaps[k][0]).toFixed (2) + 's)</small></span>' +
					'<a data-a="go" style="cursor:pointer;text-decoration:underline">' + T ('mc_go') + '</a>' +
					'<a data-a="try" style="cursor:pointer;text-decoration:underline">' + T ('mc_try') + '</a>' +
					'<a data-a="add" style="cursor:pointer;text-decoration:underline">' + T ('mc_add') + '</a></div>';
			new PKSimpleModal ({
				title:T ('mc_title'),
				clss:'pk_fnt10',
				ondestroy:function () { modalOff ( mid ); if (pv) q.clearPreview (); },
				buttons:[{title:T ('mc_add_all'), clss:'pk_modal_a_accpt', callback:function ( m ) {
					var items = [], n;
					for (n = 0; n < gaps.length; ++n) if (!done[n]) items.push ({time:gaps[n][0], end:gaps[n][1], name:T ('mc_name') + ' ' + pad (n + 1, 2)});
					if (items.length) importMany (c, items, false);
					m.Destroy ();
				}}],
				body:'<div style="margin-bottom:6px">' + T ('mc_found', {n:gaps.length}) + '</div><div class="mc_list" style="max-height:50vh;overflow:auto">' + html + '</div>',
				setup:function ( m ) {
					app.ui.InteractionHandler.forceSet (mid);
					app.ui.KeyHandler.addCallback (mid + 'esc', function () { if (app.ui.InteractionHandler.check (mid)) m.Destroy (); }, [27]);
					pvSend ();
					m.el_body.addEventListener ('click', function ( e ) {
						var a = e.target.closest ? e.target.closest ('a[data-a]') : null, row = a && a.parentNode, n, act;
						if (!a || !row) return ;
						n = +row.getAttribute ('data-i'); act = a.getAttribute ('data-a');
						if (act === 'go') seek (c, gaps[n][0]);
						else if (act === 'try') {
							app.fireEvent ('RequestRegionSet', gaps[n][0], gaps[n][1]);
							seek (c, gaps[n][0]);
							if (!playing (c)) app.fireEvent ('RequestPlay');
						}
						else if (act === 'add' && !done[n]) {
							if (add (c, {time:gaps[n][0], end:gaps[n][1], name:T ('mc_name') + ' ' + pad (n + 1, 2)})) {
								done[n] = 1;
								a.parentNode.removeChild (a);
								row.style.opacity = '.45';
								row.getElementsByTagName ('span')[1].appendChild (d.createTextNode (' ' + T ('mc_added')));
								pvSend ();
							}
						}
					});
				}
			}).Show ();
		}
		function checkMissing () {
			var c = cx (), as = PKAE._deps.autosplit;
			if (mcBusy) { OneUp (T ('mc_busy'), 1200); return false; }
			if (!can (c)) { OneUp (T ('mc_noaudio'), 1400); return false; }
			if (!as || !as.detectSegments) { OneUp (T ('mc_na'), 1600); return false; }
			mcBusy = true;
			OneUp (T ('mc_run'), 2200);
			as.detectSegments (app, 'speech', false, function () {}, function ( segs, found ) {
				var gaps;
				mcBusy = false;
				if (!found) { OneUp (T ('mc_noaudio'), 1400); return ; }
				gaps = mcGaps (c, segs, 0.3);
				if (!gaps.length) { OneUp (T ('mc_none', {n:segs.length}), 2600); return ; }
				mcUi (c, gaps, segs.length);
			});
			return true;
		}
		q.checkMissing = checkMissing;

		/* ==================================================================
		 * [階段 5] 平移後續標記
		 *   以指定標記（預設目前標記）為起點，把它與時間排序在它之後的所有標記一起平移（區間連同結束點）。
		 *   delta 省略＝以游標為基準：讓該標記的起點移到游標位置。鎖定的標記在範圍內就整批擋下。
		 *   平移量會被限制在 0 與音訊結尾之間；整批只留一筆復原紀錄。
		 * ================================================================== */
		function shiftFrom ( c, id, delta ) {
			var i = ix (c, id || c.a), k, hi = 0, lo, durr, clamp = false, s, v;
			if (i < 0) { OneUp (T ('nudge_no_marker'), 1200); return false; }
			if (delta === undefined || delta === null) delta = now (c) - c.l[i].time;
			if (!isFinite (delta)) return false;
			for (k = i; k < c.l.length; ++k) {
				if (c.l[k].locked) { OneUp (T ('sh_lock'), 1800); return false; }
				hi = Math.max (hi, c.l[k].end || c.l[k].time);
			}
			durr = dur (c);
			lo = -c.l[i].time;
			for (k = i + 1; k < c.l.length; ++k) lo = Math.max (lo, -c.l[k].time);
			if (delta < lo) { delta = lo; clamp = true; }
			if (durr > 0 && hi + delta > durr) { delta = Math.max (lo, durr - hi); clamp = true; }
			delta = Math.round (delta * 1000) / 1000;
			if (Math.abs (delta) < 0.0005) { OneUp (T ('sh_zero'), 1600); return false; }
			hist (c, ser (c), T ('desc_shift'));
			for (k = i; k < c.l.length; ++k) {
				v = c.l[k];
				v.time = Math.max (0, Math.round ((v.time + delta) * 1000) / 1000);
				if (v.end) v.end = Math.round ((v.end + delta) * 1000) / 1000;
			}
			sort ( c );
			emit (c, c.l[i] ? c.a : null);
			s = (delta > 0 ? '+' : '') + delta.toFixed (3);
			OneUp (T ('sh_done', {n:c.l.length - i, s:s}) + (clamp ? T ('sh_clamp') : ''), 2000);
			return true;
		}
		function shiftUi ( c, id ) {
			var i = ix (c, id || c.a), mid = 'mrk_sh';
			if (i < 0) { OneUp (T ('nudge_no_marker'), 1200); return false; }
			new PKSimpleModal ({
				title:T ('sh_title'),
				clss:'pk_fnt10',
				ondestroy:function () { modalOff ( mid ); },
				buttons:[{title:PKLocale.t('save_local.btn'), clss:'pk_modal_a_accpt', callback:function ( m ) {
					var v = parseFloat (String (m.el_body.getElementsByTagName ('input')[0].value).replace (/[\s，]/g, function ( x ) { return x === '，' ? '.' : ''; }));
					if (!isFinite (v)) { OneUp (T ('sh_bad'), 1200); return ; }
					m.Destroy ();
					shiftFrom (c, id, v);
				}}],
				body:'<label for="k_mrksh">' + T ('sh_label') + '</label><input style="width:100%;box-sizing:border-box;min-width:0" class="pk_txt" type="text" inputmode="decimal" id="k_mrksh" />',
				setup:function ( m ) {
					modalKeys ( m, mid );
					setTimeout (function () {
						if (!m.el) return ;
						var inp = m.el.getElementsByTagName ('input')[0];
						inp.value = '0';
						inp.focus ();
						inp.select ();
					}, 20);
				}
			}).Show ();
			return true;
		}
		q.shiftFrom = function ( id, delta ) { return shiftFrom (cx (), id, delta); };
		q.shiftUi = function ( id ) { return shiftUi (cx (), id); };
		function jumpPlayOn () { try { return w.localStorage.getItem ('pk_mrk_jumpplay') === '1'; } catch (e) { return false; } }
		/* 第 i 個標記的段落結束：區間用 end，點標記用下一個標記的時間，最後一個點標記到音訊結尾 */
		function secEnd ( c, i ) {
			var m = c.l[i], nx = c.l[i + 1];
			return m.end ? m.end : nx ? nx.time : dur (c);
		}
		/* 分割出的新標記名稱：「名稱 (2)」「名稱 (3)」…，挑清單裡還沒用過的最小序號 */
		function splitName ( c, name ) {
			var base = String (name || '').replace (/\s*\(\d+\)$/, ''), used = {}, i, k;
			for (i = 0; i < c.l.length; ++i) used[ c.l[i].name ] = 1;
			for (k = 2; k < 1000 && used[ nm (base + ' (' + k + ')') ]; ++k) ;
			return base + ' (' + k + ')';
		}
		function splitAt ( c, tm, id ) {
			var edge = 0.02, i = -1, k, m, o, tz, nx;
			if (!can (c)) return false;
			tm = at (c, tm === undefined || tm === null ? now (c) : tm);
			/* 先找游標落在哪個區間標記內（指定 id 時只看那一個；否則取最晚開始的） */
			if (id) {
				k = ix (c, id);
				if (k >= 0 && c.l[k].end && tm > c.l[k].time && tm < c.l[k].end) i = k;
			}
			else for (k = c.l.length - 1; k >= 0; --k)
				if (c.l[k].end && tm > c.l[k].time && tm < c.l[k].end) { i = k; break; }
			if (i < 0) {
				if (id) { OneUp (T ('split_none'), 1400); return false; }
				/* 不在區間內：看前一個標記是不是點標記，是的話在游標處新增一個點標記 */
				for (k = c.l.length - 1; k >= 0 && !(c.l[k].time < tm - 0.001); --k) ;
				if (k < 0 || c.l[k].end) { OneUp (T ('split_none'), 1400); return false; }
				i = k;
				nx = c.l[i + 1];
				m = c.l[i];
				tz = zcOn () ? zeroCross (c, tm, 0.008) : tm;
				if (tz > m.time + edge && (!nx || tz < nx.time - edge)) tm = tz;
				if (!(tm > m.time + edge) || (nx && !(tm < nx.time - edge))) { OneUp (T ('split_edge'), 1400); return false; }
				if (m.locked) { OneUp (T ('merge_lock'), 1600); return false; }
				hist (c, ser (c), T ('desc_split'));
				o = make (c, {time:tm, name:splitName (c, m.name), color:m.color, type:m.type});
				c.l[c.l.length] = o;
				sort ( c );
				emit (c, o.id);
				return o;
			}
			m = c.l[i];
			if (m.locked) { OneUp (T ('merge_lock'), 1600); return false; }
			tz = zcOn () ? zeroCross (c, tm, 0.008) : tm;
			if (tz > m.time + edge && tz < m.end - edge) tm = tz;
			if (!(tm > m.time + edge) || !(tm < m.end - edge)) { OneUp (T ('split_edge'), 1400); return false; }
			hist (c, ser (c), T ('desc_split'));
			o = make (c, {time:tm, end:m.end, name:splitName (c, m.name), color:m.color, type:m.type});
			m.end = tm;
			c.l[c.l.length] = o;
			sort ( c );
			emit (c, o.id);
			return o;
		}
		/* ids 必須在清單中連續；回傳合併後的標記 */
		function mergeIds ( c, ids ) {
			var set = {}, idx = [], i, a, b, first, end, notes = [], seen = {}, nn, hasR = false;
			for (i = 0; i < ids.length; ++i) set[ ids[i] ] = 1;
			for (i = 0; i < c.l.length; ++i) if (set[ c.l[i].id ]) idx.push (i);
			if (idx.length < 2) { OneUp (T ('merge_need'), 1400); return false; }
			for (i = 1; i < idx.length; ++i) if (idx[i] !== idx[i - 1] + 1) { OneUp (T ('merge_gap'), 1800); return false; }
			for (i = 0; i < idx.length; ++i) if (c.l[ idx[i] ].locked) { OneUp (T ('merge_lock'), 1600); return false; }
			a = idx[0]; b = idx[idx.length - 1];
			first = c.l[a];
			end = secEnd (c, b);
			for (i = a; i <= b; ++i) {
				if (c.l[i].end && c.l[i].end > end) end = c.l[i].end;
				if (c.l[i].end) hasR = true;
				nn = c.l[i].note;
				if (nn && !seen[nn]) { seen[nn] = 1; notes.push (nn); }
			}
			hist (c, ser (c), T ('desc_merge'));
			if (hasR && end > first.time + 0.001) first.end = end;
			if (notes.length) first.note = nt (notes.join (' / '));
			c.l.splice (a + 1, b - a);
			sort ( c );
			emit (c, first.id);
			return first;
		}
		/* 微調邊界：which 'start' 動起點（點標記就是整個標記）、'end' 動區間的結束；delta 為秒（正＝往後）。
		 * 連續微調（按住不放）800ms 內、同一個標記只留一筆復原紀錄 */
		var nudgeAt = 0, nudgeId = null;
		function nudge ( c, which, delta, id ) {
			var i = ix (c, id || c.a), m, v, durr, hi, now_;
			if (i < 0) { OneUp (T ('nudge_no_marker'), 1200); return false; }
			m = c.l[i];
			if (m.locked) { OneUp (T ('merge_lock'), 1600); return false; }
			durr = dur (c);
			if (which === 'end') {
				if (!m.end) { OneUp (T ('nudge_no_end'), 1600); return false; }
				v = m.end + delta;
				v = Math.max (m.time + 0.01, durr > 0 ? Math.min (durr, v) : v);
				if (Math.abs (v - m.end) < 0.0005) return false;
			}
			else {
				hi = m.end ? m.end - 0.01 : durr;
				v = Math.max (0, m.time + delta);
				if (hi > 0) v = Math.min (hi, v);
				if (Math.abs (v - m.time) < 0.0005) return false;
			}
			now_ = Date.now ();
			if (nudgeId !== m.id || now_ - nudgeAt > 800) hist (c, ser (c), T ('desc_nudge'));
			nudgeId = m.id; nudgeAt = now_;
			v = Math.round (v * 1000) / 1000;
			if (which === 'end') m.end = v; else m.time = v;
			sort ( c );
			emit (c, m.id);
			return true;
		}
		function mergeNext ( c, id ) {
			var i = ix (c, id || c.a);
			if (i < 0) { OneUp (T ('no_marker'), 1200); return false; }
			if (i >= c.l.length - 1) { OneUp (T ('merge_no_next'), 1400); return false; }
			return mergeIds (c, [c.l[i].id, c.l[i + 1].id]);
		}
		function mergePrev ( c, id ) {
			var i = ix (c, id || c.a);
			if (i < 0) { OneUp (T ('no_marker'), 1200); return false; }
			if (i < 1) { OneUp (T ('merge_no_prev'), 1400); return false; }
			return mergeIds (c, [c.l[i - 1].id, c.l[i].id]);
		}
		function noteUi ( c, id ) {
			var i = ix (c, id), mid = 'mrk_nt';
			if (i < 0) return ;
			new PKSimpleModal ({
				title:T ('note_title'),
				clss:'pk_fnt10',
				ondestroy:function () { modalOff ( mid ); },
				buttons:[{title:PKLocale.t('save_local.btn'), clss:'pk_modal_a_accpt', callback:function ( m ) {
					setNote (c, id, m.el_body.getElementsByTagName ('input')[0].value);
					m.Destroy ();
				}}],
				body:'<label for="k_mrkn">' + T ('note_label', {n:maxNote}) + '</label><input style="width:100%;box-sizing:border-box;min-width:0" maxlength="' + maxNote + '" class="pk_txt" type="text" id="k_mrkn" />',
				setup:function ( m ) {
					modalKeys ( m, mid );
					setTimeout (function () {
						if (!m.el) return ;
						var inp = m.el.getElementsByTagName ('input')[0];
						inp.value = c.l[i].note || '';
						inp.focus ();
						inp.select ();
					}, 20);
				}
			}).Show ();
		}
		function modalKeys ( m, mid ) {
			app.ui.InteractionHandler.forceSet (mid);
			app.ui.KeyHandler.addCallback (mid + 'esc', function () { if (app.ui.InteractionHandler.check (mid)) m.Destroy (); }, [27]);
			app.ui.KeyHandler.addCallback (mid + 'en', function () { if (app.ui.InteractionHandler.check (mid) && m.els.bottom[0]) m.els.bottom[0].click (); }, [13]);
		}
		function modalOff ( mid ) {
			app.ui.InteractionHandler.forceUnset (mid);
			app.ui.KeyHandler.removeCallback (mid + 'esc');
			app.ui.KeyHandler.removeCallback (mid + 'en');
		}
		function timeUi ( c, id ) {
			var i = ix (c, id), mid = 'mrk_tm';
			if (i < 0) return ;
			new PKSimpleModal ({
				title:T ('time_title'),
				clss:'pk_fnt10',
				ondestroy:function () { modalOff ( mid ); },
				buttons:[{title:PKLocale.t('save_local.btn'), clss:'pk_modal_a_accpt', callback:function ( m ) {
					var v = parse (m.el_body.getElementsByTagName ('input')[0].value);
					if (v === null) { OneUp (T ('time_bad'), 1400); return ; }
					setTime (c, id, v);
					m.Destroy ();
				}}],
				body:'<label for="k_mrkt">' + T ('time_label') + '</label><input style="width:100%;box-sizing:border-box;min-width:0" class="pk_txt" type="text" id="k_mrkt" />',
				setup:function ( m ) {
					modalKeys ( m, mid );
					setTimeout (function () {
						if (!m.el) return ;
						var inp = m.el.getElementsByTagName ('input')[0];
						inp.value = fmt (c.l[i].time);
						inp.focus ();
						inp.select ();
					}, 20);
				}
			}).Show ();
		}
		function colorUi ( c, id ) {
			var i = ix (c, id), mid = 'mrk_cl', html = '', k;
			if (i < 0) return ;
			for (k = 0; k < cols.length; ++k)
				html += '<a data-c="' + cols[k] + '" style="display:inline-block;width:28px;height:28px;margin:0 6px 6px 0;border-radius:4px;cursor:pointer;background:' + cols[k] + ';box-shadow:' + (cols[k] === c.l[i].color ? '0 0 0 2px #fff' : 'inset 0 0 0 1px rgba(0,0,0,.4)') + '"></a>';
			new PKSimpleModal ({
				title:T ('color_title'),
				clss:'pk_fnt10',
				ondestroy:function () { modalOff ( mid ); },
				buttons:[],
				body:'<div class="mrk_sw">' + html + '</div><div style="margin-top:6px"><label style="margin-right:8px">' + T ('custom') + '</label><input type="color" value="' + (/^#[0-9a-f]{6}$/i.test (c.l[i].color) ? c.l[i].color : '#9dff6a') + '" style="vertical-align:middle;width:44px;height:26px;padding:0;border:0;background:none"></div>',
				setup:function ( m ) {
					modalKeys ( m, mid );
					m.el_body.addEventListener ('click', function ( e ) {
						var col = e.target && e.target.getAttribute && e.target.getAttribute ('data-c');
						if (col) { setColor (c, id, col); m.Destroy (); }
					}, false);
					m.el_body.getElementsByTagName ('input')[0].addEventListener ('change', function () {
						setColor (c, id, this.value); m.Destroy ();
					}, false);
				}
			}).Show ();
		}
		function selectBetween ( c, id ) {
			var i = ix (c, id);
			if (i < 0) return ;
			app.fireEvent ('RequestRegionSet', c.l[i].time, c.l[i].end || (c.l[i + 1] ? c.l[i + 1].time : dur (c)));
		}
		function setSelEdge ( c, id, which ) {
			var i = ix (c, id), r = region (), tm;
			if (i < 0) return ;
			tm = c.l[i].time;
			if (which === 'in') app.fireEvent ('RequestRegionSet', tm, r && r.end > tm + 0.005 ? r.end : dur (c));
			else app.fireEvent ('RequestRegionSet', r && r.start < tm - 0.005 ? r.start : 0, tm);
		}
		function copyTime ( c, id ) {
			var i = ix (c, id), s;
			if (i < 0) return ;
			s = fmt (c.l[i].time);
			try { navigator.clipboard && navigator.clipboard.writeText (s); } catch (e) {}
			OneUp (s, 900);
		}
		function view ( c, o ) {
			var layer, nodes = {}, menu, rmenu, td, hs;
			function host () { return o.h (); }
			function stop ( e ) { e.preventDefault (); e.stopImmediatePropagation ? e.stopImmediatePropagation () : e.stopPropagation (); }
			function hit ( e, m ) { return e.clientY - m.r.top <= 24; }
			function node ( t ) {
				while (t && t !== host ()) {
					if (t.classList && t.classList.contains ('pk_mrkr')) return t;
					t = t.parentNode;
				}
			}
			function ensure ( p ) {
				if (layer && layer.parentNode === p) return layer;
				layer = d.createElement ('div');
				layer.className = 'pk_mrkrl';
				p.appendChild ( layer );
				nodes = {};
				return layer;
			}
			function mkNode ( id ) {
				var n = d.createElement ('div'), b = d.createElement ('b');
				n.className = 'pk_mrkr';
				n.setAttribute ('data-id', id);
				n.lbl = b;
				n.rg = d.createElement ('i'); n.rg.className = 'pk_mrkr_rg'; n.rg.style.display = 'none';
				n.re = d.createElement ('u'); n.re.className = 'pk_mrkr_re'; n.re.style.display = 'none';
				n.appendChild ( n.rg ); n.appendChild ( n.re );
				n.appendChild ( b );
				layer.appendChild ( n );
				return nodes[id] = n;
			}
			function paint () {
				var p = o.p (), mtr, h, stamp, i, m, n, cls, x, tr, id, lim;
				if (!p) return ;
				ensure ( p );
				if (o.v && !o.v ()) {
					if (layer._d !== 'none') { layer.style.display = 'none'; layer._d = 'none'; }
					return ;
				}
				if (layer._d) { layer.style.display = ''; layer._d = ''; }
				mtr = o.m ();
				lim = p.scrollWidth || p.clientWidth || 0;
				h = (Math.max (1, o.lh () - 24) >> 0) + 'px';
				if (layer._h !== h) { layer.style.setProperty ('--m', h); layer._h = h; }
				stamp = ++c.s;
				/* [標籤列 階段 1] 標記名稱常駐顯示在聲波上：先算每個標記的 x，才能知道標籤最多能有多寬 */
				var xs = [], lon = labelsOn () && !trkShow (), cl = 'pk_mrkrl' + (lon ? ' pk_lbl_on' : '') + (tlOn () && c === ed ? ' pk_tl' : '');	/* [修改] 單軌且開著時間軸：名稱要放在時間軸下方（pk_tl） */
				if (layer._k !== cl) { layer.className = cl; layer._k = cl; }
				for (i = 0; i < c.l.length; ++i) { x = mtr.x (c.l[i].time) >> 0; xs[i] = lim && x >= lim ? lim - 1 : x; }
				for (i = 0; i < c.l.length; ++i) {
					m = c.l[i]; n = nodes[m.id] || mkNode (m.id); x = xs[i];
					tr = 'translate3d(' + x + 'px,0,0)';
					cls = 'pk_mrkr' + (m.id === c.a ? ' pk_act' : '') + (m.type === 'chapter' ? ' pk_mrkr_ch' : m.type === 'loop' ? ' pk_mrkr_lp' : '') + (m.end ? ' pk_mrkr_rn' : '');
					n._s = stamp;
					if (n._c !== cls) { n.className = cls; n._c = cls; }
					if (n._n !== m.name + '\u0001' + (m.note || '') + (m.locked ? 'L' : '') + (m.type || '')) {
						n.lbl.textContent = (m.locked ? '\uD83D\uDD12 ' : '') + (m.type === 'chapter' ? '\u00A7 ' : m.type === 'loop' ? '\u21BB ' : '') + m.name;
						n.title = (m.type ? '[' + T ('type_' + m.type) + '] ' : '') + (m.note ? m.name + '\n' + m.note : m.name);	/* [新增] 完整名稱與備註放在提示 */
						n._n = m.name + '\u0001' + (m.note || '') + (m.locked ? 'L' : '') + (m.type || '');
					}
					if (m.end) {
							var wd = Math.max (3, Math.min ((mtr.x (m.end) >> 0) - x, (lim || 1e9) - x));
							if (n._w !== wd) { n.rg.style.width = wd + 'px'; n.re.style.left = (wd - 4) + 'px'; n._w = wd; }
							if (!n._r) { n.rg.style.display = ''; n.re.style.display = ''; n._r = 1; }
						}
						else if (n._r) { n.rg.style.display = 'none'; n.re.style.display = 'none'; n._r = 0; n._w = -1; }
						if (lon) {
							/* 可用寬度：區間標記＝色帶寬度；點標記＝到下一個標記之前。太窄就不顯示（滑過或選取時仍會完整顯示） */
							var nx = i + 1 < xs.length ? xs[i + 1] : (lim || 1e9), av = nx - x - 10;
							if (m.end) av = Math.min (av, Math.max (3, Math.min ((mtr.x (m.end) >> 0) - x, (lim || 1e9) - x)) - 6);
							av = Math.max (0, Math.min (av, 220)) >> 0;
							if (n._lw !== av) { n.lbl.style.maxWidth = av + 'px'; n.lbl.style.visibility = av < 22 ? 'hidden' : ''; n._lw = av; }
						}
						else if (n._lw !== undefined) { n.lbl.style.maxWidth = ''; n.lbl.style.visibility = ''; n._lw = undefined; }
						var mcol = window.PKMarkerColor ? window.PKMarkerColor (m.color) : m.color;
						if (n._o !== mcol) { n.style.color = mcol; n._o = mcol; }
					if (n._t !== tr) { n.style.transform = tr; n._t = tr; }
				}
				for (id in nodes)
					if (nodes[id]._s !== stamp) { nodes[id].parentNode && nodes[id].parentNode.removeChild (nodes[id]); delete nodes[id]; }
				trackPaint ();
				pvPaint ();
			}

			/* ==================================================================
			 * [標籤列 階段 2] Audacity 式標籤列：聲波正上方一條獨立軌道（只用於單軌）
			 *  - 固定兩層高；標籤依時間自動分層，同一層裡塞不下就截短（滑過／選取不影響這裡，完整名稱在提示）
			 *  - 區間標記在標籤下方畫一條色帶，標示起訖
			 *  - 點選＝選取並跳到該處；拖曳＝移動；雙擊＝改名；右鍵＝標記選單
			 *  - 空白處：點一下＝跳到該時間；雙擊＝在此新增標記；右鍵＝新增／以選取範圍建立區間
			 * ================================================================== */
			var tnodes = {}, tctx = null, tcache = {}, tlast = -1, TH = 18, FOLD_H = 20, tl = 1, tshr = 0, tdown = 0, tfix = 0, tmenu = null, thd = o.hd ? o.hd () : null;
			function pvOn () { return !!(c === ed && c.pv && c.pv.segs && c.pv.segs.length); }	/* [預覽] 單軌的「預告」分段 */
			function trkVis () { return !!(o.tr && trackOn () && (c.l.length || pvOn ()) && o.tr ()); }
			/* [標籤列 設定] 標籤列「有展開」才算顯示標籤；摺疊時名稱改畫在聲波上 */
			function trkShow () { return trkVis () && !trkFold (); }
			function tlabel ( m ) { return (m.locked ? '\uD83D\uDD12 ' : '') + (m.type === 'chapter' ? '\u00A7 ' : m.type === 'loop' ? '\u21BB ' : '') + m.name; }
			function tw ( s ) {
				if (tcache[s] !== undefined) return tcache[s];
				if (!tctx) { tctx = d.createElement ('canvas').getContext ('2d'); tctx.font = '11px sans-serif'; }
				if (Object.keys (tcache).length > 2000) tcache = {};
				return tcache[s] = Math.ceil (tctx.measureText (s).width);
			}
			function tnode ( id, el ) {
				var n = d.createElement ('div'), b = d.createElement ('b'), g = d.createElement ('i');
				n.className = 'pk_lt'; n.setAttribute ('data-id', id);
				g.className = 'pk_lt_rg'; g.style.display = 'none';
				n.lbl = b; n.rg = g; n.appendChild (b); n.appendChild (g);
				el.appendChild (n);
				return tnodes[id] = n;
			}
			/* [標籤列 設定] 排層：依序塞進第 1~cap 層，塞不下就放「最空」的那層並被前一個截短。
			 * 回傳實際用到的層數（need），同時算好每個標籤可用的寬度 it.w */
			function layoutLanes ( items, cap ) {
				var lanes = [], i, k, j, it, prev, lane, nx, need = 1;
				for (k = 0; k < cap; ++k) lanes.push ([]);
				for (i = 0; i < items.length; ++i) {
					it = items[i]; lane = -1;
					for (k = 0; k < cap; ++k) {
						prev = lanes[k][lanes[k].length - 1];
						if (!prev || prev.left + Math.min (prev.full, 24) + 2 <= it.left) { lane = k; break; }
					}
					if (lane < 0) {
						lane = 0;
						for (k = 1; k < cap; ++k)
							if (lanes[k][lanes[k].length - 1].left < lanes[lane][lanes[lane].length - 1].left) lane = k;
					}
					it.lane = lane; lanes[lane].push (it);
					if (lane + 1 > need) need = lane + 1;
				}
				for (k = 0; k < cap; ++k)
					for (j = 0; j < lanes[k].length; ++j) {
						it = lanes[k][j]; nx = lanes[k][j + 1];
						it.w = Math.max (0, Math.min (it.full, nx ? nx.left - it.left - 3 : 1e9, 260));
					}
				return need;
			}
			/* [標籤列 設定] 預覽（自動分割）的預告標籤：只算位置，不排層 */
			function pvItems ( mtr, el ) {
				var pv = c.pv, items = [], sr, off, TW, i, s, x0, x1, full, left;
				if (c !== ed || !pv || !pv.segs || !el) return items;
				sr = el.getBoundingClientRect ();
				off = mtr.r.left - (sr.left + el.clientLeft); TW = el.clientWidth;
				for (i = 0; i < pv.segs.length; ++i) {
					s = pv.segs[i];
					x0 = (mtr.x (s[0]) >> 0) + off; x1 = (mtr.x (s[1]) >> 0) + off;
					full = tw (String (s[2] || '')) + 14; left = x0 < 0 && x1 > 0 ? 0 : x0;
					if (left > TW || Math.max (x1, left + full) < 0) continue ;
					items.push ({name:String (s[2] || ''), left:left, full:full, rw:Math.max (3, Math.min (x1, TW) - left)});
				}
				return items;
			}
			/* [標籤列 設定] 左側控制欄（⚙ 設定、▾ 摺疊）跟著標籤列的位置與高度走 */
			function headSync ( el, vis, hh ) {
				if (!thd) return ;
				var disp = vis ? 'flex' : 'none', fold = trkFold (), cls = 'pk_lbhd' + (fold ? ' pk_fold' : '') + (hh >= 38 ? ' pk_lbhd_t' : '');
				if (thd._d !== disp) { thd.style.display = disp; thd._d = disp; }
				if (!vis) return ;
				if (thd._h !== hh + 1) { thd.style.height = (hh + 1) + 'px'; thd._h = hh + 1; }
				if (thd._o !== el.offsetTop) { thd.style.top = el.offsetTop + 'px'; thd._o = el.offsetTop; }
				if (thd._c !== cls) { thd.className = cls; thd._c = cls; }
			}
			function trackPaint () {
				if (!o.tr) return ;
				var el = o.tr (), vis = trkVis (), mtr, sr, off, W, items = [], pi, i, m, it, X0, X1, left, full, stamp, id, n, cls, tr, lb;
				var fold = trkFold (), fixed = trkLanes (), cap = fixed || TAUTO, need, want, hh, chg = 0, pn = 1;
				if (!el) return ;
				if (tlast !== (vis ? 1 : 0)) {
					tlast = vis ? 1 : 0;
					el.style.display = vis ? 'block' : 'none';
					chg = 1;
					if (!vis) { headSync (el, 0, 0); app.fireEvent ('RequestResize'); return ; }	/* 波形高度要還給標籤列 */
				}
				if (!vis) return ;
				mtr = o.m (); sr = el.getBoundingClientRect ();
				off = mtr.r.left - (sr.left + el.clientLeft); W = el.clientWidth;
				if (!fold) {
					for (i = 0; i < c.l.length; ++i) {
						m = c.l[i];
						X0 = (mtr.x (m.time) >> 0) + off; X1 = m.end ? (mtr.x (m.end) >> 0) + off : X0;
						full = tw (tlabel (m)) + 14;
						left = X0 < 0 && X1 > 0 ? 0 : X0;	/* 區間起點在畫面左邊：標籤貼著左緣 */
						if (left > W || Math.max (X1, left + full) < 0) continue ;
						items.push ({m:m, left:left, X1:X1, full:full, rw:m.end ? Math.max (3, Math.min (X1, W) - left) : 0});
					}
					need = layoutLanes (items, cap);
					pi = pvItems (mtr, el);
					if (pi.length) pn = layoutLanes (pi, cap);	/* 預覽的標籤也要算進需要的層數 */
					if (pn > need) need = pn;
				}
				else need = 1;
				/* [標籤列 設定] 決定層數：固定＝照設定；自動＝需要幾層就幾層（變多立刻長高，變少等 0.7 秒再縮，避免波形一直跳） */
				want = fixed || Math.min (Math.max (need, 1), TAUTO);
				if (fixed || want > tl) { tl = want; tdown = 0; if (tshr) { clearTimeout (tshr); tshr = 0; } }
				else if (want < tl) {
					if (tdown) { tl = want; tdown = 0; }
					else if (!tshr) tshr = setTimeout (function () { tshr = 0; tdown = 1; redraw (); }, 700);
				}
				else if (tshr) { clearTimeout (tshr); tshr = 0; }
				hh = fold ? FOLD_H : tl * TH + 2;
				if (el._hh !== hh) { el.style.height = hh + 'px'; el._hh = hh; chg = 1; }
				if (el._fd !== fold) { el._fd = fold; el.className = 'pk_lbtrk pk_noselect' + (fold ? ' pk_fold' : ''); chg = 1; }
				headSync (el, 1, hh);
				stamp = ++c.s;
				for (i = 0; i < items.length; ++i) {
					it = items[i]; m = it.m;
					n = tnodes[m.id] || tnode (m.id, el);
					n._s = stamp;
					cls = 'pk_lt' + (m.id === c.a ? ' pk_act' : '') + (m.end ? ' pk_lt_rn' : '');
					if (n._c !== cls) { n.className = cls; n._c = cls; }
					lb = tlabel (m) + '\u0001' + (m.note || '');
					if (n._n !== lb) { n.lbl.textContent = tlabel (m); n.title = (m.type ? '[' + T ('type_' + m.type) + '] ' : '') + (m.note ? m.name + '\n' + m.note : m.name); n._n = lb; }
					var mcol2 = window.PKMarkerColor ? window.PKMarkerColor (m.color) : m.color;
					if (n._o !== mcol2) { n.style.color = mcol2; n._o = mcol2; }
					tr = 'translate3d(' + (it.left >> 0) + 'px,' + (it.lane * TH + 1) + 'px,0)';
					if (n._t !== tr) { n.style.transform = tr; n._t = tr; }
					var bw = Math.max (0, it.w >> 0);
					if (n._w !== bw) { n.lbl.style.width = bw + 'px'; n.lbl.style.visibility = bw < 18 ? 'hidden' : ''; n._w = bw; }
					if (it.rw) {
						if (n._r !== it.rw) { n.rg.style.width = it.rw + 'px'; n.rg.style.display = ''; n._r = it.rw; }
					}
					else if (n._r) { n.rg.style.display = 'none'; n._r = 0; }
				}
				for (id in tnodes)
					if (tnodes[id]._s !== stamp) { tnodes[id].parentNode && tnodes[id].parentNode.removeChild (tnodes[id]); delete tnodes[id]; }
				if (chg) {
					app.fireEvent ('RequestResize');	/* 標籤列高度變了（層數、摺疊）：波形高度要重算，頁面才不會多出捲軸 */
					/* 下一幀再量一次：版面（標籤列、左側控制欄）都定案後，ui.js 的 MainHeight 會依實際版面再貼合一次 */
					if (!tfix) tfix = w.requestAnimationFrame (function () { tfix = 0; app.fireEvent ('RequestResize'); });
				}
			}

			/* ==================================================================
			 * [預覽] 自動分割對話框的「在聲波上預覽」（只用於單軌）
			 *  - 狀態放在 c.pv（{segs:[[起,迄,名稱]], dropped:[[起,迄]]}），獨立於標記清單：
			 *    不進復原堆疊、不存草稿、不影響匯出；由 q.preview / q.clearPreview 設定
			 *  - 聲波上：每句一塊淡色虛線色塊＋編號（標籤列沒顯示時改顯示名稱）；被濾掉的片段畫成灰色色塊
			 *  - 標籤列：每句一個虛線「預告標籤」（不可點、不可拖、沒有鎖頭）
			 *  - 全部 pointer-events:none，滑鼠照常捲動、縮放、點選聲波
			 * ================================================================== */
			var pvLayer = null, pvBlk = [], pvDrop = [], pvGh = [];
			function pvPool ( list, i, cls, parent, withB ) {
				var n = list[i];
				if (!n) {
					n = list[i] = d.createElement ('div');
					n.className = cls;
					if (withB) { n.b = d.createElement ('b'); n.appendChild (n.b); }
					parent.appendChild (n);
				}
				return n;
			}
			function pvHide ( list, from ) {
				for (var i = from; i < list.length; ++i)
					if (list[i]._v) { list[i].style.display = 'none'; list[i]._v = 0; }
			}
			function pvPlace ( n, l, wd ) {
				var tr = 'translate3d(' + l + 'px,0,0)', ww = wd + 'px';
				if (n._t !== tr) { n.style.transform = tr; n._t = tr; }
				if (n._w !== ww) { n.style.width = ww; n._w = ww; }
				if (!n._v) { n.style.display = ''; n._v = 1; }
			}
			function pvClean () {
				var i;
				if (pvLayer && pvLayer.parentNode) pvLayer.parentNode.removeChild (pvLayer);
				pvLayer = null; pvBlk = []; pvDrop = [];
				for (i = 0; i < pvGh.length; ++i) pvGh[i].parentNode && pvGh[i].parentNode.removeChild (pvGh[i]);
				pvGh = [];
			}
			function pvPaint () {
				if (c !== ed) return ;
				var pv = c.pv, p = o.p (), el = o.tr ? o.tr () : null, mtr, W, i, k, s, x0, x1, l, r, n, cnt, tv, items, it, bw, tr;
				if (!pv || !p || !((pv.segs && pv.segs.length) || (pv.dropped && pv.dropped.length))) { (pvLayer || pvGh.length) && pvClean (); return ; }
				mtr = o.m (); W = mtr.r.width;
				tv = trkShow ();	/* [修改] 摺疊時預告標籤不畫在標籤列，名稱改畫在聲波色塊上 */
				if (!pvLayer || pvLayer.parentNode !== p) {
					pvLayer = d.createElement ('div'); pvLayer.className = 'pk_pvl';
					p.appendChild (pvLayer); pvBlk = []; pvDrop = [];
				}
				/* 被濾掉的片段（灰） */
				for (cnt = 0, i = 0; pv.dropped && i < pv.dropped.length; ++i) {
					s = pv.dropped[i]; x0 = mtr.x (s[0]); x1 = mtr.x (s[1]);
					if (x1 < 0 || x0 > W) continue ;
					l = Math.max (0, x0) >> 0; r = Math.min (W, x1) >> 0;
					pvPlace ( pvPool (pvDrop, cnt++, 'pk_pv_drop', pvLayer, false), l, Math.max (2, r - l) );
				}
				pvHide (pvDrop, cnt);
				/* 預告的句段（色塊＋編號／名稱） */
				for (cnt = 0, i = 0; i < pv.segs.length; ++i) {
					s = pv.segs[i]; x0 = mtr.x (s[0]); x1 = mtr.x (s[1]);
					if (x1 < 0 || x0 > W) continue ;
					l = Math.max (0, x0) >> 0; r = Math.min (W, x1) >> 0;
					n = pvPool (pvBlk, cnt++, 'pk_pv_blk', pvLayer, true);
					pvPlace ( n, l, Math.max (2, r - l) );
					k = tv ? String (i + 1) : String (s[2] || i + 1);
					if (n._b !== k) { n.b.textContent = k; n._b = k; }
				}
				pvHide (pvBlk, cnt);

				/* 標籤列裡的預告標籤：排法與正式標籤相同（兩層，塞不下就截短） */
				if (!tv || !el) { for (i = 0; i < pvGh.length; ++i) if (pvGh[i]._v) { pvGh[i].style.display = 'none'; pvGh[i]._v = 0; } return ; }
				items = pvItems (mtr, el);	/* [修改] 位置與排層改用 pvItems／layoutLanes（層數跟著標籤列目前的層數 tl） */
				layoutLanes (items, Math.max (1, tl));
				for (i = 0; i < items.length; ++i) {
					it = items[i];
					n = pvGh[i];
					if (!n) {
						n = pvGh[i] = d.createElement ('div'); n.className = 'pk_pvt';
						n.b = d.createElement ('b'); n.r = d.createElement ('i');
						n.appendChild (n.b); n.appendChild (n.r); el.appendChild (n);
					}
					if (n._n !== it.name) { n.b.textContent = it.name; n._n = it.name; }
					tr = 'translate3d(' + (it.left >> 0) + 'px,' + (it.lane * TH + 1) + 'px,0)';
					if (n._t !== tr) { n.style.transform = tr; n._t = tr; }
					bw = Math.max (0, it.w >> 0);
					if (n._bw !== bw) { n.b.style.width = bw + 'px'; n.b.style.visibility = bw < 18 ? 'hidden' : ''; n._bw = bw; }
					if (n._rw !== it.rw) { n.r.style.width = it.rw + 'px'; n._rw = it.rw; }
					if (!n._v) { n.style.display = ''; n._v = 1; }
				}
				for (i = items.length; i < pvGh.length; ++i) if (pvGh[i]._v) { pvGh[i].style.display = 'none'; pvGh[i]._v = 0; }
			}
			function tnodeOf ( t ) {
				while (t && t !== o.tr ()) {
					if (t.classList && t.classList.contains ('pk_lt')) return t;
					t = t.parentNode;
				}
			}
			function trkDown ( e ) {
				var n = tnodeOf (e.target), m;
				if (n) return markerDown (e, n);
				if (!can (c)) return ;
				m = o.m ();
				if (e.button === 2 || e.which === 3) { stop (e); openRulerMenu (e, m.t (e.clientX)); }
			}
			function trkClick ( e ) {
				var n = tnodeOf (e.target);
				if (e.target && e.target.classList && (e.target.classList.contains ('pk_lbgrip'))) return stop (e);	/* [新增] 握把只負責調整層數 */
				if (n) return stop (e);
				if (!can (c) || (e.button !== undefined && e.button !== 0)) return ;
				var tm = o.m ().t (e.clientX);
				stop (e);
				if (e.detail > 1) add (c, {time:tm}); else seek (c, tm);
			}
			function trkDbl ( e ) {
				var n = tnodeOf (e.target);
				if (!n) return ;
				stop (e);
				renameUi (c, n.getAttribute ('data-id'));
			}
			function trkCtx ( e ) { e.preventDefault (); }
			/* [標籤列 設定] 左側控制欄的 ⚙ 選單：像 Audacity 的標籤軌道選單，所有標籤列相關設定集中在這裡。
			 * 選單每次開啟都重建，勾選／選項狀態才會是最新的 */
			function openTrkMenu ( e ) {
				if (!app._deps.ContextMenu) return false;
				if (!tmenu) tmenu = new app._deps.ContextMenu (d.createElement ('div'));
				tmenu.options = [];
				var fx = trkLanes (), n;
				function ck ( on ) { return (on ? '\u2713' : '\u2003') + ' '; }
				function rd ( on ) { return (on ? '\u25CF' : '\u25CB') + ' '; }
				tmenu.addOption (ck (trackOn ()) + T ('trk_show'), function () { q.track (!trackOn ()); }, false);
				tmenu.addOption (ck (trkFold ()) + T (trkFold () ? 'trk_unfold' : 'trk_fold'), function () { q.trackFold (!trkFold ()); }, false);
				tmenu.addOption (rd (!fx) + T ('trk_lanes_auto', {n:TAUTO}), function () { q.trackLanes (0); }, false);
				for (n = 1; n <= 4; ++n) (function ( k ) {
					tmenu.addOption (rd (fx === k) + T ('trk_lanes_n', {n:k}), function () { q.trackLanes (k); }, false);
				})(n);
				tmenu.addOption (ck (askName ()) + T ('trk_ask'), function () { q.askName (!askName ()); }, false);
				tmenu.addOption (ck (snapOn ()) + T ('trk_snap'), function () { q.snap (!snapOn ()); }, false);
				tmenu.addOption (T ('trk_panel'), function () { var P = PKAE._deps.mrkpanel; P && P.toggle (); }, false);
				tmenu.open ( e );
				return true;
			}
			function hdClick ( e ) {
				var b = e.target && e.target.closest ? e.target.closest ('button') : null;
				if (!b) return ;
				e.preventDefault (); e.stopPropagation ();
				if (b.classList.contains ('pk_lbhd_f')) q.trackFold (!trkFold ());
				else openTrkMenu ( e );
			}
			/* [標籤列 設定] 拖曳標籤列下緣的握把＝調整層數（每 18px 一層，最多 6 層）；雙擊＝回到自動 */
			function gripDown ( e ) {
				var g = e.target;
				if (!g || !g.classList || !g.classList.contains ('pk_lbgrip') || (e.button !== undefined && e.button !== 0)) return ;
				e.preventDefault (); e.stopPropagation ();
				var y0 = e.clientY, l0 = tl;
				try { g.setPointerCapture (e.pointerId); } catch (er) {}
				g.onpointermove = function ( ev ) {
					var k = Math.max (1, Math.min (TMAXL, Math.round (l0 + (ev.clientY - y0) / TH)));
					if (k !== trkLanes ()) q.trackLanes (k);
				};
				g.onpointerup = g.onpointercancel = function () { g.onpointermove = g.onpointerup = g.onpointercancel = null; };
			}
			function gripDbl ( e ) {
				if (!e.target || !e.target.classList || !e.target.classList.contains ('pk_lbgrip')) return ;
				e.preventDefault (); e.stopPropagation ();
				q.trackLanes (0);
			}

			function openMenu ( e, id ) {
				if (!app._deps.ContextMenu) return false;
				if (!menu) {
					menu = new app._deps.ContextMenu (d.createElement ('div'));
					menu.addOption (PKLocale.t('mrk.desc.rename'), function () { renameUi (menu.c, menu.id); }, false);
					menu.addOption (PKLocale.t('mrk.desc.delete'), function () { rem (menu.c, menu.id); }, false);
					menu.addOption (PKLocale.t('ui.play_from_here'), function () {
						var i = ix (menu.c, menu.id);
						if (i >= 0) { seek (menu.c, menu.c.l[i].time); if (!playing (menu.c)) app.fireEvent ('RequestPlay'); }
					}, false);
					/* [新增] 時間、顏色、選取、複製時間 */
					menu.addOption (T ('set_time'), function () { timeUi (menu.c, menu.id); }, false);
					menu.addOption (T ('set_color'), function () { colorUi (menu.c, menu.id); }, false);
					menu.addOption (T ('sel_next'), function () { selectBetween (menu.c, menu.id); }, false);
					menu.addOption (T ('set_in'), function () { setSelEdge (menu.c, menu.id, 'in'); }, false);
					menu.addOption (T ('set_out'), function () { setSelEdge (menu.c, menu.id, 'out'); }, false);
					menu.addOption (T ('set_end'), function () { endUi (menu.c, menu.id); }, false);
					menu.addOption (T ('range_from_sel'), function () { rangeFromSel (menu.c, menu.id); }, false);
					menu.addOption (T ('to_range'), function () { toRange (menu.c, menu.id); }, false);
					menu.addOption (T ('to_point'), function () { setRange (menu.c, menu.id, null, null); }, false);
					menu.addOption (T ('cycle_type'), function () { cycleType (menu.c, menu.id); }, false);
					menu.addOption (T ('play_loop'), function () { playLoop (menu.c, menu.id); }, false);
					menu.addOption (T ('play_from'), function () { q.playSections (menu.id); }, false);
					menu.addOption (T ('lock'), function () { var i = ix (menu.c, menu.id); i >= 0 && setLocked (menu.c, menu.id, !menu.c.l[i].locked); }, false);
					menu.addOption (T ('set_note'), function () { noteUi (menu.c, menu.id); }, false);
					menu.addOption (T ('copy_time'), function () { copyTime (menu.c, menu.id); }, false);
					/* [階段 4] 分割、合併 */
					menu.addOption (T ('split_here'), function () { splitAt (menu.c, now (menu.c), menu.id); }, false);
					menu.addOption (T ('sh_cur'), function () { shiftFrom (menu.c, menu.id); }, false);
					menu.addOption (T ('sh_by'), function () { shiftUi (menu.c, menu.id); }, false);
					menu.addOption (T ('merge_next'), function () { mergeNext (menu.c, menu.id); }, false);
					menu.addOption (T ('merge_prev'), function () { mergePrev (menu.c, menu.id); }, false);
				}
				menu.c = c; menu.id = id; menu.open ( e );
				return true;
			}
			function openRulerMenu ( e, t ) {
				if (!app._deps.ContextMenu || !can (c)) return false;
				if (!rmenu) {
					rmenu = new app._deps.ContextMenu (d.createElement ('div'));
					rmenu.addOption (PKLocale.t('ui.add_marker_here'), function () { add (rmenu.c, {time:rmenu.t}); }, false);
					rmenu.addOption (T ('range_new'), function () { addRangeSel (rmenu.c); }, false);
					rmenu.addOption (T ('split_at'), function () { splitAt (rmenu.c, rmenu.t); }, false);
					rmenu.onOpen = function ( mn, div ) {
						var r = region ();
						if ((!r || !(r.end > r.start)) && div.childNodes[1]) div.childNodes[1].className += ' pk_inact';
					};
				}
				rmenu.c = c; rmenu.t = t; rmenu.open ( e );
				return true;
			}
			function markerDown ( e, n ) {
				var id = n.getAttribute ('data-id'), i = ix (c, id), m, start, old, sx, moved = false;
				if (i < 0) return ;
				stop ( e );
				emit (c, id);
				if (e.button === 2 || e.which === 3) return openMenu (e, id);
									if (e.altKey) return renameUi (c, id);
					if (e.target.classList && e.target.classList.contains ('pk_mrkr_re')) return endDown (e, id);
				if (c.l[i].locked) return seek (c, c.l[i].time);	/* [新增] 鎖定的標記不能拖，只跳過去 */
				if (app.ui && app.ui.InteractionHandler && !app.ui.InteractionHandler.checkAndSet ('marker')) return ;
				m = c.l[i]; start = m.time; old = ser ( c ); sx = e.clientX; var len0 = m.end ? m.end - m.time : 0;
				function move ( ev ) {
					var mm = o.m (), t = o.m ().t (ev.clientX);
					if (Math.abs (ev.clientX - sx) > 2 || Math.abs (t - start) > 0.001) moved = true;
					if (moved) t = snapTime ( c, id, t, mm, ev.shiftKey );	/* [新增] 吸附到其他標記／游標／選取邊界 */
					slide (c, m, len0, t); emit (c, id);
					ev.preventDefault ();
				}
				function up ( ev ) {
					d.removeEventListener ('mousemove', move);
					d.removeEventListener ('mouseup', up);
					if (app.ui && app.ui.InteractionHandler) app.ui.InteractionHandler.forceUnset ('marker');
					if (moved) { sort ( c ); hist (c, old, t('mrk.desc.move')); emit (c, id); }
					else seek (c, start);
					ev && ev.preventDefault ();
				}
				d.addEventListener ('mousemove', move, false);
				d.addEventListener ('mouseup', up, false);
			}
							/* 拖曳區間的結束點（滑鼠）；觸控請用右鍵選單／清單改結束時間 */
				function endDown ( e, id ) {
					var i = ix (c, id), m, old, moved = false, sx = e.clientX;
					if (i < 0 || !c.l[i].end || c.l[i].locked) return ;
					if (app.ui && app.ui.InteractionHandler && !app.ui.InteractionHandler.checkAndSet ('marker')) return ;
					m = c.l[i]; old = ser ( c );
					function move ( ev ) {
						var mm = o.m (), tm;
						if (Math.abs (ev.clientX - sx) > 2) moved = true;
						if (!moved) return ;
						tm = snapTime ( c, id, mm.t (ev.clientX), mm, ev.shiftKey );
						m.end = Math.max (m.time + 0.001, tm);
						emit (c, id);
						ev.preventDefault ();
					}
					function up ( ev ) {
						d.removeEventListener ('mousemove', move);
						d.removeEventListener ('mouseup', up);
						if (app.ui && app.ui.InteractionHandler) app.ui.InteractionHandler.forceUnset ('marker');
						if (moved) { hist (c, old, T ('desc_range_edit')); emit (c, id); }
						ev && ev.preventDefault ();
					}
					d.addEventListener ('mousemove', move, false);
					d.addEventListener ('mouseup', up, false);
				}
				function down ( e ) {
				var n = node (e.target), m;
				if (n) return markerDown (e, n);
				m = o.m ();
				if (!hit (e, m)) return ;
				if (e.button === 2 || e.which === 3) { stop ( e ); openRulerMenu (e, m.t (e.clientX)); return ; }
				if ((e.button !== undefined && e.button !== 0) || (e.which && e.which !== 1)) return ;
				td = {x:e.clientX, y:e.clientY};
			}
			function click ( e ) {
				if (suppress && Date.now () - suppress < 800) return stop ( e );
				var n = node (e.target), m;
				if (n) return stop ( e );
				m = o.m ();
				if (!hit (e, m)) return ;
				stop ( e );
				if (e.detail > 1) return add (c, {time:m.t (e.clientX)});
				if (!td || Math.abs (e.clientX - td.x) + Math.abs (e.clientY - td.y) < 4) seek (c, m.t (e.clientX));
				td = null;
			}
			/* ------------------------------------------------------------------
			 * 新增：觸控支援
			 *   - 手指按住標記拖動 → 移動標記；輕點 → 跳到該標記
			 *   - 按住標記 550ms 不動 → 標記選單（重新命名 / 刪除 / 從這裡播放）
			 *   - 按住刻度尺（上方 24px）550ms 不動 → 「在此加入標記」選單
			 * 刻度尺的輕點與雙擊維持原本的滑鼠模擬行為。
			 * ------------------------------------------------------------------ */
			var tp = null, suppress = 0;
			function fake ( tc, target ) {
				return {clientX:tc.clientX, clientY:tc.clientY, pageX:tc.pageX, pageY:tc.pageY, target:target,
					preventDefault:function () {}, stopPropagation:function () {}};
			}
			function tclear () {
				if (tp && tp.timer) clearTimeout (tp.timer);
				tp = null;
			}
			function tstart ( e ) {
				tclear ();
				if (!e.touches || e.touches.length !== 1) return ;
				var tc = e.touches[0], n = node (e.target), m = o.m (), id, i = -1;
				if (!n && !hit (tc, m)) return ;
				if (n) {
					id = n.getAttribute ('data-id');
					i = ix (c, id);
					if (i < 0) return ;
					e.preventDefault ();
					emit (c, id);
				}
				tp = {n:n, id:id, x:tc.clientX, y:tc.clientY, tc:tc, tg:e.target,
					old:n ? ser (c) : null, start:n ? c.l[i].time : 0, drag:false, fired:false, timer:0,
					re:(n && e.target.classList && e.target.classList.contains ('pk_mrkr_re') && c.l[i].end && !c.l[i].locked) ? 1 : 0};	/* [階段 3 收尾] 手指按在區間結束點上 → 拖曳改結束時間 */
				tp.timer = setTimeout (function () {
					if (!tp) return ;
					tp.timer = 0;
					tp.fired = true;
					suppress = Date.now ();
					try { navigator.vibrate && navigator.vibrate (15); } catch (er) {}
					if (tp.n) openMenu (fake (tp.tc, tp.tg), tp.id);
					else openRulerMenu (fake (tp.tc, tp.tg), m.t (tp.x));
				}, 550);
			}
			function tmove ( e ) {
				if (!tp || tp.fired || !e.touches || e.touches.length !== 1) return ;
				var tc = e.touches[0], i, tm;
				if (!tp.drag) {
					if (Math.abs (tc.clientX - tp.x) < 10 && Math.abs (tc.clientY - tp.y) < 10) return ;
					if (tp.timer) { clearTimeout (tp.timer); tp.timer = 0; }
					if (!tp.n || (ix (c, tp.id) >= 0 && c.l[ix (c, tp.id)].locked)) { tclear (); return ; }
					if (app.ui && app.ui.InteractionHandler && !app.ui.InteractionHandler.checkAndSet ('marker')) { tclear (); return ; }
					tp.drag = true;
				}
				i = ix (c, tp.id);
				if (i < 0) { tclear (); return ; }
				tm = snapTime ( c, tp.id, o.m ().t (tc.clientX), o.m (), false );
				if (tp.re && c.l[i].end) c.l[i].end = Math.max (c.l[i].time + 0.001, tm);
				else slide (c, c.l[i], c.l[i].end ? c.l[i].end - c.l[i].time : 0, tm);
				emit (c, tp.id);
				e.preventDefault ();
			}
			function tend ( e ) {
				if (!tp) return ;
				var p = tp;
				tclear ();
				if (!p.n) return ;
				e.cancelable && e.preventDefault ();
				if (p.fired) return ;
				if (p.drag) {
					if (app.ui && app.ui.InteractionHandler) app.ui.InteractionHandler.forceUnset ('marker');
					if (!p.re) sort ( c );
					hist (c, p.old, p.re ? T ('desc_range_edit') : t('mrk.desc.move'));
					emit (c, p.id);
				}
				else seek (c, p.start);
			}
			function tcancel () {
				if (tp && tp.drag) {
					if (app.ui && app.ui.InteractionHandler) app.ui.InteractionHandler.forceUnset ('marker');
					if (!tp.re) sort ( c );
					hist (c, tp.old, tp.re ? T ('desc_range_edit') : t('mrk.desc.move'));
					emit (c, tp.id);
				}
				tclear ();
			}

			if (c.off) c.off ();
			hs = host ();
			hs.addEventListener ('mousedown', down, true);
			hs.addEventListener ('click', click, true);
			hs.addEventListener ('touchstart', tstart, {passive:false, capture:true});
			hs.addEventListener ('touchmove', tmove, {passive:false, capture:true});
			hs.addEventListener ('touchend', tend, true);
			hs.addEventListener ('touchcancel', tcancel, true);
			var ts = o.tr ? o.tr () : null;
			if (ts) {
				ts.addEventListener ('mousedown', trkDown, true);
				ts.addEventListener ('click', trkClick, true);
				ts.addEventListener ('dblclick', trkDbl, true);
				ts.addEventListener ('contextmenu', trkCtx, true);
				ts.addEventListener ('pointerdown', gripDown, true);
				ts.addEventListener ('dblclick', gripDbl, true);
			}
			if (thd) thd.addEventListener ('click', hdClick, false);
			c.off = function () {
				if (thd) thd.removeEventListener ('click', hdClick, false);
				if (ts) {
					ts.removeEventListener ('mousedown', trkDown, true);
					ts.removeEventListener ('click', trkClick, true);
					ts.removeEventListener ('dblclick', trkDbl, true);
					ts.removeEventListener ('contextmenu', trkCtx, true);
					ts.removeEventListener ('pointerdown', gripDown, true);
					ts.removeEventListener ('dblclick', gripDbl, true);
				}
				tclear ();
				hs.removeEventListener ('mousedown', down, true);
				hs.removeEventListener ('click', click, true);
				hs.removeEventListener ('touchstart', tstart, true);
				hs.removeEventListener ('touchmove', tmove, true);
				hs.removeEventListener ('touchend', tend, true);
				hs.removeEventListener ('touchcancel', tcancel, true);
				if (layer && layer.parentNode) layer.parentNode.removeChild (layer);
				pvClean ();
				if (menu) menu.destroy ();
				if (rmenu) rmenu.destroy ();
				if (tmenu) { tmenu.destroy (); tmenu = null; }
				if (tshr) { clearTimeout (tshr); tshr = 0; }
			};
			c.v = paint;
			paint ();
		}
		q.edge = function ( dir ) {
			var c = cx (), t = now ( c ), m = null, i;
			if (!c.l.length) return false;
			for (i = dir < 0 ? c.l.length - 1 : 0; dir < 0 ? i >= 0 : i < c.l.length; i += dir)
				if (dir < 0 ? c.l[i].time < t - 0.004 : c.l[i].time > t + 0.004) { m = c.l[i]; break; }
			if (!m) return false;
			emit (c, m.id);
			seek (c, m.time);
			return true;
		};
		q.ser = function ( n ) { return ser (cx (n)); };
		/* [新增] 管理 API（作用於目前的單軌／多軌脈絡） */
		q.T = T;
		q.fmt = fmt;
		q.parse = parse;
		q.ctx = function () { return cx () === mt ? 'mt' : 'ed'; };
		q.list = function () { return ser (cx ()); };
		q.active = function () { return cx ().a; };
		q.duration = function () { return dur (cx ()); };
		q.cursor = function () { return now (cx ()); };
		q.region = region;
		q.select = function ( id ) { var c = cx (), i = ix (c, id); if (i < 0) return false; emit (c, id); seek (c, c.l[i].time); return true; };
		q.addCursor = function () { return drop (); };
		q.addAt = function ( time ) { return drop ({time:time}); };
		q.rename = function ( id, name ) { return ren (cx (), id, name); };
		q.renameUi = function ( id ) { renameUi (cx (), id || cx ().a); };
		q.timeUi = function ( id ) { timeUi (cx (), id); };
		q.colorUi = function ( id ) { colorUi (cx (), id); };
		q.setTime = function ( id, time ) { return setTime (cx (), id, time); };
		q.setColor = function ( id, col ) { return setColor (cx (), id, col); };
		q.remove = function ( id ) { return rem (cx (), id); };
		q.noteUi = function ( id ) { noteUi (cx (), id || cx ().a); };
		q.setNote = function ( id, note ) { return setNote (cx (), id, note); };
		q.renameMany = function ( map ) { return renameMany (cx (), map || {}); };
		q.importMany = function ( items, replace ) { return importMany (cx (), items, !!replace); };
				q.setRange = function ( id, start, end ) { return setRange (cx (), id, start, end); };
		q.setEnd = function ( id, end ) { return setRange (cx (), id, null, end); };
		q.toRange = function ( id ) { return toRange (cx (), id); };
		q.toPoint = function ( id ) { return setRange (cx (), id, null, null); };
		q.endUi = function ( id ) { endUi (cx (), id || cx ().a); };
		q.addRangeFromSelection = function () { return addRangeSel (cx ()); };
		q.rangeFromSelection = function ( id ) { return rangeFromSel (cx (), id || cx ().a); };
		q.selectRange = function ( id ) { selectBetween (cx (), id || cx ().a); };
		/* [階段 3 收尾] 把目前標記的區間（或到下一個標記）設成選取；沒有目前標記時提示 */
		q.selectActive = function () {
			var c = cx ();
			if (!c.a || ix (c, c.a) < 0) { OneUp (T ('no_marker'), 1200); return false; }
			selectBetween (c, c.a);
			return true;
		};
		q.setType = function ( id, type ) { return setType (cx (), id, type); };
		q.cycleType = function ( id ) { return cycleType (cx (), id); };
		q.playLoop = function ( id ) { playLoop (cx (), id || cx ().a); };
		/* [階段 4] 分割／合併／跳到標記後自動播放 */
		q.split = function ( time, id ) { return splitAt (cx (), time, id); };
		q.merge = function ( ids ) { return mergeIds (cx (), ids || []); };
		q.mergeNext = function ( id ) { return mergeNext (cx (), id); };
		q.mergePrev = function ( id ) { return mergePrev (cx (), id); };
		q.nudge = function ( which, delta, id ) { return nudge (cx (), which, delta, id); };
		q.jumpPlay = function ( v ) {
			if (v === undefined) return jumpPlayOn ();
			try { w.localStorage.setItem ('pk_mrk_jumpplay', v ? '1' : '0'); } catch (e) {}
		};
		/* [階段 3] 給 actions.js 呼叫（單軌編輯連動）；follow() 可讀寫「標記跟著編輯移動」開關 */
		q.editShift = editShift;
		q.follow = function ( v ) {
			if (v === undefined) return followOn ();
			try { w.localStorage.setItem ('pk_mrk_follow', v ? '1' : '0'); } catch (e) {}
		};
		q.replaceCollapse = function ( v ) {
			if (v === undefined) return replCollapse ();
			try { w.localStorage.setItem ('pk_mrk_repl', v ? '1' : '0'); } catch (e) {}
		};
		q.ripple = function ( v ) {
			if (v === undefined) return rippleOn ();
			try { w.localStorage.setItem ('pk_mrk_ripple', v ? '1' : '0'); } catch (e) {}
		};
		q.setLocked = function ( id, v ) { return setLocked (cx (), id, v); };
		q.silenceSnap = function ( v ) {
			if (v === undefined) return silOn ();
			try { w.localStorage.setItem ('pk_mrk_sil', v ? '1' : '0'); } catch (e) {}
		};
		q.zeroCross = function ( v ) {
			if (v === undefined) return zcOn ();
			try { w.localStorage.setItem ('pk_mrk_zc', v ? '1' : '0'); } catch (e) {}
		};
		q.snap = function ( v ) {
			if (v === undefined) return snapOn ();
			try { w.localStorage.setItem ('pk_mrk_snap', v ? '1' : '0'); } catch (e) {}
		};
		q.removeMany = function ( ids ) { return removeMany (cx (), ids || []); };
		q.removeRange = function ( lo, hi ) { return removeRange (cx (), lo, hi); };
		q.clear = function () { return clear (cx ()); };
		q.track = function ( v ) {
			if (v === undefined) return trackOn ();
			try { w.localStorage.setItem ('pk_mrk_track', v ? '1' : '0'); } catch (e) {}
			redraw ();
		};
		/* [新增] 單軌波形上方的時間軸是否開啟（時間軸佔波形最上面約 28px，聲波上的名稱要避開它） */
		function tlOn () { var ws = app.engine && app.engine.wavesurfer; return !ws || !ws.params || ws.params.timeline !== false; }
		app.listenFor ('DidViewTimelineToggle', function () { redraw (); });
		/* [標籤列 設定] 摺疊／層數（0＝自動）。改動後標籤列高度會變，由 trackPaint 發出 RequestResize 讓波形重算高度 */
		q.trackFold = function ( v ) {
			if (v === undefined) return trkFold ();
			try { w.localStorage.setItem ('pk_mrk_fold', v ? '1' : '0'); } catch (e) {}
			redraw ();
		};
		q.trackLanes = function ( v ) {
			if (v === undefined) return trkLanes ();
			v = parseInt (v, 10);
			try { w.localStorage.setItem ('pk_mrk_lanes', v >= 1 && v <= TMAXL ? String (v) : '0'); } catch (e) {}
			redraw ();
		};
		q.labels = function ( v ) {
			if (v === undefined) return labelsOn ();
			try { w.localStorage.setItem ('pk_mrk_labels', v ? '1' : '0'); } catch (e) {}
			redraw ();
		};
		q.askName = function ( v ) {
			if (v === undefined) return askName ();
			try { w.localStorage.setItem ('pk_mrk_askname', v ? '1' : '0'); } catch (e) {}
		};
		q.serEd = function () { return ser (ed); };
		q.serMt = function () { return ser (mt); };
		q.loadEd = function ( a, h ) { load (ed, a, h); };
		q.loadMt = function ( a, h ) { load (mt, a, h); };
		q.clearEd = function ( h ) { return clear (ed, h); };
		/* [預覽] segs：[[起, 迄, 名稱], ...]；dropped：[[起, 迄], ...]（被濾掉的片段，可省略）。
		 * 只畫在單軌的聲波與標籤列上，不進標記清單、復原堆疊、草稿與匯出。傳空陣列等於清除 */
		q.preview = function ( segs, dropped ) {
			var has = (segs && segs.length) || (dropped && dropped.length);
			ed.pv = has ? {segs:segs || [], dropped:dropped || []} : null;
			redraw ();
		};
		q.clearPreview = function () { if (!ed.pv) return ; ed.pv = null; redraw (); };
		q.hasPreview = function () { return !!ed.pv; };
		q.wave = function ( ws, wave ) {
			if (!ws || !wave) return ;
			var cont = wave.closest ? wave.closest ('.pk_av_cont') : null, av = cont && cont.querySelector ('.pk_av'), strip = cont && cont.querySelector ('.pk_lbtrk');
			if (cont && av && !strip) {
				strip = d.createElement ('div');
				strip.className = 'pk_lbtrk pk_noselect';
				strip.setAttribute ('role', 'list');
				cont.insertBefore (strip, av);
			}
			/* [新增] 左側控制欄（在波形左邊 48px 的空白處）與下緣握把 */
			var hd = cont && cont.querySelector ('.pk_lbhd');
			if (cont && strip && !hd) {
				hd = d.createElement ('div');
				hd.className = 'pk_lbhd';
				hd.style.display = 'none';
				hd.innerHTML = '<div class="pk_lbhd_b"><button type="button" class="pk_lbhd_m" tabindex="-1" title="' + T ('trk_menu') + '">\u2699</button><button type="button" class="pk_lbhd_f" tabindex="-1" title="' + T ('trk_fold') + '">\u25BE</button></div><span class="pk_lbhd_n">' + T ('trk_name') + '</span>';
				cont.insertBefore (hd, strip);
			}
			if (strip && !strip.querySelector ('.pk_lbgrip')) {
				var gp = d.createElement ('div');
				gp.className = 'pk_lbgrip';
				gp.title = T ('trk_grip');
				strip.appendChild (gp);
			}
			view (ed, {
				hd:hd ? function () { return hd; } : null,
				tr:strip ? function () { return strip; } : null,
				h:function () { return wave; },
				p:function () { return wave; },
				lh:function () { return wave.clientHeight || 24; },
				m:function () {
					var r = wave.getBoundingClientRect (), durr = ws.getDuration ? ws.getDuration () || 0 : 0;
					var vis = ws.VisibleDuration || durr || 1, left = ws.LeftProgress || 0, scale = r.width / Math.max (0.0001, vis);
					return {r:r, x:function ( t ) { return (t - left) * scale; }, t:function ( x ) { return at (ed, left + (x - r.left) / scale); }};
				}
			});
		};
		q.mt = function ( main, ruler, px, vis ) {
			if (!main || !ruler || !px) return ;
			view (mt, {
				h:function () { return ruler; },
				p:function () { return ruler; },
				v:vis,
				lh:function () { return main.clientHeight || 24; },
				m:function () {
					var r = ruler.getBoundingClientRect (), scale = Math.max (1, px ());
					return {r:r, x:function ( t ) { return t * scale; }, t:function ( x ) { return at (mt, (x - r.left) / scale); }};
				}
			});
		};
		function draw ( c ) { c.v && c.v (); }
		q.drawEd = function () { draw ( ed ); };
		q.drawMt = function () { draw ( mt ); };
		q.draw = function () { draw (ed); draw (mt); };

		app.listenFor ('MrkrAdd', drop);
		app.listenFor ('MrkrPrv', function ( sel ) { jump (cx (), -1, sel); });
		app.listenFor ('MrkrNxt', function ( sel ) { jump (cx (), 1, sel); });
		/* [階段 5] 逐標記播放：逐幀檢查；停止、開始播放、卸載檔案時清掉追蹤中的段落 */
		app.listenFor ('DidAudioProcess', pmTick);
		app.listenFor ('DidAudioProcess', lcTick);
		app.listenFor ('DidStopPlay', function () { pm.id = null; lc.prev = -1; lc.n = 0; });
		app.listenFor ('DidPlay', function () { pm.id = null; lc.prev = -1; lc.n = 0; });
		app.listenFor ('DidZoom', redraw);
		app.listenFor ('DidCursorCenter', redraw);
		app.listenFor ('DidUpdateLen', redraw);
		app.listenFor ('RequestResize', redraw);
		window.PKTheme && window.PKTheme.onChange && window.PKTheme.onChange (function () { redraw (); });
		app.listenFor ('DidUnloadFile', function () { ed.pv = null; clear (ed, false); });
		/* [階段 3] 每一筆「音訊」復原狀態都附上推入當下的單軌標記快照（state.mk）。
		 * 復原／重做時換回快照，並把目前的標記存回 state.mk，讓重做也能還原。
		 * 'mrk'（只改標記）與 'mult'（多軌，自帶標記）不處理。 */
		app.listenFor ('StateRequestPush', function ( state ) {
			if (state && state.type !== 'mrk' && state.type !== 'mult' && !state.mk) state.mk = ser (ed);
			/* [階段 2 項目 10] 多軌狀態附上多軌標記快照，波紋刪除後復原才能還原標記 */
			else if (state && state.type === 'mult' && !state.mkm) state.mkm = ser (mt);
		});
		app.listenFor ('DidUpdateLen', clampSoon);
		app.listenFor ('StateDidPop', function ( state, undo ) {
			var cur;
			nudgeId = null;	/* 復原／重做之後，下一次微調要重新留一筆紀錄 */
			if (!state) return ;
			if (state.type === 'mrk') {
				/* 復原／重做後保留「目前標記」：還在就沿用；已消失（例如復原分割）就改選原位置之前最近的標記 */
				var cc = cx (state.ctx), ka = ix (cc, cc.a), ref = ka >= 0 ? cc.l[ka].time : now (cc), keep = ka >= 0 ? cc.a : null, k2, pick = null;
				load (cc, state.markers, false);
				if (keep && ix (cc, keep) >= 0) pick = keep;
				else {
					for (k2 = cc.l.length - 1; k2 >= 0; --k2) if (cc.l[k2].time <= ref + 0.001) { pick = cc.l[k2].id; break; }
					if (!pick && cc.l[0]) pick = cc.l[0].id;
				}
				if (pick && pick !== cc.a) emit (cc, pick);
				OneUp ((undo ? t('mt.msg.undo') + ' ' : t('mt.msg.redo') + ' ') + state.desc);
			}
			else if (state.type !== 'mult' && state.mk) {
				cur = ser (ed);
				load (ed, state.mk, false, true);
				state.mk = cur;
			}
			else if (state.type === 'mult' && state.mkm) {
				cur = ser (mt);
				load (mt, state.mkm, false, true);
				state.mkm = cur;
			}
		});
	}

	PKAE._deps.mrk = PKMrk;

})( window, document, PKAudioEditor );
