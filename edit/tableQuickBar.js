// ==========================================
// tableQuickBar.js — 表格模式：選取後的「快速工具列」
//
//  · 選取儲存格、整列、整欄後，在第一個選取位置的上方浮出簡潔工具列
//    （上方放不下時，改放在下方）
//  · 依選取類型顯示不同的插入按鈕：
//      儲存格 → 上方列／下方列／左側欄／右側欄
//      整列   → 上方列／下方列
//      整欄   → 左側欄／右側欄
//  · 插入列／欄後，選取範圍維持在原本那批儲存格（隨資料位移）
//  · 「⋯ 更多」收納：刪除（依選取類型）、復原、取消選取
//  · 進入儲存格編輯（行內編輯、獨立編輯器）或拖曳選取中，自動隱藏
//  · 設定選單可開關，預設關閉（localStorage: wesing-table-quickbar）
//
// 載入順序：放在 table.js、tableFilter.js 之後
// ==========================================
(function () {
    'use strict';

    const KEY = 'wesing-table-quickbar';
    let enabled = localStorage.getItem(KEY) === 'true';   // 預設關閉

    const container = document.getElementById('tableModeContainer');
    if (!container) return;

    // ---------- 樣式 ----------
    const st = document.createElement('style');
    st.textContent = [
        '#tableQuickBar{position:fixed;z-index:35;display:none;align-items:center;gap:2px;padding:3px;',
        'background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 4px 14px rgba(0,0,0,.16);',
        'max-width:calc(100vw - 16px);overflow-x:auto;scrollbar-width:none;user-select:none;-webkit-user-select:none;}',
        '#tableQuickBar::-webkit-scrollbar{display:none;}',
        '#tableQuickBar .qb-btn{flex:none;width:34px;height:32px;display:flex;align-items:center;justify-content:center;',
        'border:0;background:transparent;border-radius:7px;color:#4b5563;cursor:pointer;-webkit-tap-highlight-color:transparent;}',
        '#tableQuickBar .qb-btn:hover,#tableQuickBar .qb-btn.on{background:#f3f4f6;color:#111827;}',
        '#tableQuickBar .qb-btn:active{background:#e5e7eb;}',
        '#tableQuickBar .qb-btn.danger:hover{background:#fef2f2;color:#dc2626;}',
        '#tableQuickBar .qb-btn .material-symbols-outlined,#tableQuickMenu .material-symbols-outlined{font-size:20px;}',
        '#tableQuickBar .qb-tag{flex:none;padding:0 8px 0 6px;font-size:12px;color:#6b7280;white-space:nowrap;border-right:1px solid #e5e7eb;margin-right:3px;}',
        '#tableQuickBar .qb-sep{flex:none;width:1px;height:18px;background:#e5e7eb;margin:0 3px;}',
        '#tableQuickMenu{position:fixed;z-index:36;display:none;min-width:190px;padding:4px;background:#fff;',
        'border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.18);user-select:none;-webkit-user-select:none;}',
        '#tableQuickMenu .qm-item{display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border:0;background:transparent;',
        'border-radius:7px;font-size:14px;color:#374151;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent;}',
        '#tableQuickMenu .qm-item:hover{background:#f3f4f6;}',
        '#tableQuickMenu .qm-item.danger{color:#dc2626;}',
        '#tableQuickMenu .qm-item.danger:hover{background:#fef2f2;}'
    ].join('\n');
    document.head.appendChild(st);

    const bar = document.createElement('div');
    bar.id = 'tableQuickBar';
    document.body.appendChild(bar);
    const menu = document.createElement('div');
    menu.id = 'tableQuickMenu';
    document.body.appendChild(menu);

    function rowNumMode() { return window.RowNumMode ? window.RowNumMode.get() : 'full'; }

    // ---------- 選取類型 ----------
    function ctxType() {
        if (selectedRows.length > 0) return 'rows';
        if (selectedCols.length > 0) return 'cols';
        if (selectedCellBlocks.length > 0) return 'cells';
        return null;
    }

    function span(kind) {   // kind: 'r' | 'c'
        let lo = Infinity, hi = -1;
        const t = ctxType();
        if (kind === 'r' && t === 'rows') selectedRows.forEach(function (v) { lo = Math.min(lo, v); hi = Math.max(hi, v); });
        else if (kind === 'c' && t === 'cols') selectedCols.forEach(function (v) { lo = Math.min(lo, v); hi = Math.max(hi, v); });
        else if (t === 'cells') {
            selectedCellBlocks.forEach(function (b) {
                const a = kind === 'r' ? [b.startR, b.endR] : [b.startC, b.endC];
                lo = Math.min(lo, a[0], a[1]); hi = Math.max(hi, a[0], a[1]);
            });
        }
        return { lo: lo, hi: hi };
    }

    // ---------- 動作（沿用既有函式，行為與原本選單一致） ----------
    function doCopy() { copySelectedTableData(); }
    function doCut() {
        copySelectedTableData();
        handleClearAction();
        setTimeout(function () { showToast('✂️ 內容已剪下！'); }, 100);
    }
    function doPaste() {
        const b = document.querySelector('#dd-clipboard-group button[data-action="paste-normal"]');
        if (b) b.click(); else showToast('⚠️ 找不到貼上功能');
    }
    function doClear() { handleClearAction(); }
    // 插入後，讓原本選取的內容「跟著資料位移」：index 以後的列／欄各 +1，選取範圍維持在同一批儲存格上
    function shiftSelection(kind, at) {
        const f = function (n) { return n >= at ? n + 1 : n; };
        if (kind === 'r') {
            selectedRows = selectedRows.map(f);
            selectedCellBlocks.forEach(function (b) { b.startR = f(b.startR); b.endR = f(b.endR); });
            if (lastClickedCell) lastClickedCell = { r: f(lastClickedCell.r), c: lastClickedCell.c };
            if (lastSelectedRowIndex >= 0) lastSelectedRowIndex = f(lastSelectedRowIndex);
        } else {
            selectedCols = selectedCols.map(f);
            selectedCellBlocks.forEach(function (b) { b.startC = f(b.startC); b.endC = f(b.endC); });
            if (lastClickedCell) lastClickedCell = { r: lastClickedCell.r, c: f(lastClickedCell.c) };
            if (lastSelectedColIndex >= 0) lastSelectedColIndex = f(lastSelectedColIndex);
        }
        applySelectionVisuals();
    }
    function doInsertRow(below) {
        const s = span('r'); if (s.hi < 0) return;
        const at = below ? s.hi + 1 : s.lo;
        insertRowAt(at);
        shiftSelection('r', at);
        showToast(below ? '✅ 已在下方插入一列' : '✅ 已在上方插入一列');
    }
    function doInsertCol(right) {
        const s = span('c'); if (s.hi < 0) return;
        const at = right ? s.hi + 1 : s.lo;
        insertColAt(at);
        shiftSelection('c', at);
        showToast(right ? '✅ 已在右側插入一欄' : '✅ 已在左側插入一欄');
    }
    function doDelete() { handleDeleteAction(); }
    function doUndo() { triggerUndo(); }
    function doDeselect() { clearTableSelection(true); }

    // ---------- 依選取類型組出按鈕 ----------
    const B = {
        copy:  { icon: 'content_copy', title: '複製', run: doCopy },
        cut:   { icon: 'content_cut', title: '剪下', run: doCut },
        paste: { icon: 'content_paste', title: '貼上', run: doPaste },
        clear: { icon: 'ink_eraser', title: '清除內容', run: doClear, danger: true },
        rowUp: { icon: 'vertical_align_top', title: '在上方插入一列', run: function () { doInsertRow(false); } },
        rowDn: { icon: 'vertical_align_bottom', title: '在下方插入一列', run: function () { doInsertRow(true); } },
        colLt: { icon: 'align_horizontal_left', title: '在左側插入一欄', run: function () { doInsertCol(false); } },
        colRt: { icon: 'align_horizontal_right', title: '在右側插入一欄', run: function () { doInsertCol(true); } },
        more:  { icon: 'more_horiz', title: '更多', more: true }
    };
    const LAYOUT = {
        cells: [B.copy, B.cut, B.paste, null, B.clear, null, B.rowUp, B.rowDn, B.colLt, B.colRt, null, B.more],
        rows:  [B.copy, B.cut, B.paste, null, B.clear, null, B.rowUp, B.rowDn, null, B.more],
        cols:  [B.copy, B.cut, B.paste, null, B.clear, null, B.colLt, B.colRt, null, B.more]
    };
    const DELETE_LABEL = { cells: '刪除儲存格（下方上移）', rows: '刪除列', cols: '刪除欄' };

    let builtFor = null;
    function build(t) {
        builtFor = t;
        closeMenu();
        bar.textContent = '';
        const tag = document.createElement('span');
        tag.className = 'qb-tag';
        tag.style.display = 'none';
        bar.appendChild(tag);
        LAYOUT[t].forEach(function (b) {
            if (!b) {
                const sep = document.createElement('span');
                sep.className = 'qb-sep';
                bar.appendChild(sep);
                return;
            }
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'qb-btn' + (b.danger ? ' danger' : '');
            btn.title = b.title;
            btn.setAttribute('aria-label', b.title);
            btn.innerHTML = '<span class="material-symbols-outlined">' + b.icon + '</span>';
            btn._def = b;
            bar.appendChild(btn);
        });
        menu.textContent = '';
        [
            { icon: 'delete', label: DELETE_LABEL[t], run: doDelete, danger: true },
            { icon: 'undo', label: '復原', run: doUndo },
            { icon: 'deselect', label: '取消選取', run: doDeselect }
        ].forEach(function (it) {
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'qm-item' + (it.danger ? ' danger' : '');
            el.innerHTML = '<span class="material-symbols-outlined">' + it.icon + '</span><span></span>';
            el.lastChild.textContent = it.label;
            el._run = it.run;
            menu.appendChild(el);
        });
    }

    // 點按鈕時不要讓儲存格失去焦點／選取被清掉
    [bar, menu].forEach(function (el) {
        el.addEventListener('mousedown', function (e) { e.preventDefault(); e.stopPropagation(); });
    });
    bar.addEventListener('click', function (e) {
        e.stopPropagation();
        const btn = e.target.closest('.qb-btn');
        if (!btn || !btn._def) return;
        if (btn._def.more) { toggleMenu(btn); return; }
        closeMenu();
        try { btn._def.run(); } catch (err) { console.error(err); }
        schedule();
    });
    menu.addEventListener('click', function (e) {
        e.stopPropagation();
        const it = e.target.closest('.qm-item');
        if (!it || !it._run) return;
        closeMenu();
        try { it._run(); } catch (err) { console.error(err); }
        schedule();
    });

    // ---------- 「⋯ 更多」選單 ----------
    let moreBtn = null;
    function closeMenu() {
        menu.style.display = 'none';
        if (moreBtn) moreBtn.classList.remove('on');
        moreBtn = null;
    }
    function toggleMenu(btn) {
        if (menu.style.display === 'block') { closeMenu(); return; }
        moreBtn = btn;
        btn.classList.add('on');
        menu.style.visibility = 'hidden';
        menu.style.display = 'block';
        placeMenu();
        menu.style.visibility = 'visible';
    }
    function placeMenu() {
        if (!moreBtn) return;
        const br = bar.getBoundingClientRect();
        const mr = moreBtn.getBoundingClientRect();
        const mw = menu.offsetWidth, mh = menu.offsetHeight;
        const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
        let left = Math.min(Math.max(mr.right - mw, 8), vw - mw - 8);
        let top = br.bottom + 4;
        if (top + mh > vh - 8) top = Math.max(8, br.top - mh - 4);
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
    }
    // 點到工具列／選單以外的地方就收起選單
    document.addEventListener('mousedown', function (e) {
        if (menu.style.display === 'block' && !menu.contains(e.target) && !bar.contains(e.target)) closeMenu();
    }, true);
    document.addEventListener('touchstart', function (e) {
        if (menu.style.display === 'block' && !menu.contains(e.target) && !bar.contains(e.target)) closeMenu();
    }, { passive: true, capture: true });

    // ---------- 顯示條件 ----------
    function isEditing() {
        const ae = document.activeElement;
        if (ae && ae.classList && ae.classList.contains('td-inner') && dataTable.contains(ae)) return true;
        const ce = document.getElementById('cellEditor');
        if (ce && !ce.classList.contains('hidden')) return true;
        return false;
    }

    function shouldShow() {
        if (currentMode !== 'table') return false;
        if (container.getClientRects().length === 0) return false;
        const t = ctxType();
        if (!t) return false;
        // 列編號收合後沒有 ▾ 列選單 → 整列選取時一律顯示工具列（即使設定關閉）
        const needRowTools = t === 'rows' && rowNumMode() !== 'full';
        if (!enabled && !needRowTools) return false;
        if (isEditing()) return false;
        if (window.isCellDragging || window.isColDragSelecting || window.isRowDragSelecting || (typeof isMouseDownOnCell !== 'undefined' && isMouseDownOnCell)) return false;
        return true;
    }

    function visible(el) { return el && el.getClientRects().length > 0; }

    // 取得「定位用矩形」：第一個看得到的選取位置
    function anchorRect(t, visTop) {
        const tbody = dataTable.querySelector('tbody');
        if (!tbody) return null;
        if (t === 'cols') {
            const th = dataTable.querySelector('thead tr').children[span('c').lo + 1];
            if (!visible(th)) return null;
            const r = th.getBoundingClientRect();
            return { left: r.left, right: r.right, top: visTop, bottom: visTop };   // 欄：貼在表頭下緣
        }
        let rows, c;
        if (t === 'rows') {
            rows = selectedRows.slice().sort(function (a, b) { return a - b; });
            c = 0;
        } else {
            const b = selectedCellBlocks[0];
            const minR = Math.min(b.startR, b.endR), maxR = Math.min(Math.max(b.startR, b.endR), Math.min(b.startR, b.endR) + 2000);
            rows = [];
            for (let r = minR; r <= maxR; r++) rows.push(r);
            c = Math.min(b.startC, b.endC);
        }
        for (let i = 0; i < rows.length; i++) {
            const tr = tbody.children[rows[i]];
            const td = tr && tr.children[c + 1];
            if (visible(td)) return td.getBoundingClientRect();
        }
        return null;
    }

    // ---------- 定位 ----------
    let raf = 0;
    function schedule() { if (!raf) raf = requestAnimationFrame(update); }

    function hideAll() { bar.style.display = 'none'; closeMenu(); }

    function update() {
        raf = 0;
        if (!shouldShow()) { hideAll(); return; }
        const t = ctxType();

        const cr = container.getBoundingClientRect();
        const thead = container.querySelector('thead');
        const corner = container.querySelector('th.sticky-corner');
        const visTop = cr.top + (thead ? thead.getBoundingClientRect().height : 0);
        const visLeft = cr.left + (corner ? corner.getBoundingClientRect().width : 0);

        const r = anchorRect(t, visTop);
        if (!r || r.bottom < visTop || r.top >= cr.bottom || r.right <= visLeft || r.left >= cr.right) { hideAll(); return; }

        if (builtFor !== t) build(t);

        // 列編號隱藏時，在工具列最前面標示目前選取的列號
        const tagEl = bar.querySelector('.qb-tag');
        if (tagEl) {
            if (rowNumMode() === 'hidden' && t !== 'cols') {
                const rs = span('r');
                tagEl.textContent = rs.lo === rs.hi ? '第 ' + (rs.lo + 1) + ' 列' : '第 ' + (rs.lo + 1) + '–' + (rs.hi + 1) + ' 列';
                tagEl.style.display = '';
            } else tagEl.style.display = 'none';
        }

        bar.style.visibility = 'hidden';
        bar.style.display = 'flex';
        const bw = bar.offsetWidth, bh = bar.offsetHeight;
        const vw = document.documentElement.clientWidth;

        let left = Math.max(r.left, visLeft);
        left = Math.max(Math.min(left, vw - bw - 8), 8);

        let top = r.top - bh - 6;                 // 預設：第一個選取位置的正上方
        if (top < visTop + 2) top = r.bottom + 6; // 上方放不下 → 放到下方
        top = Math.min(top, cr.bottom - bh - 6);

        bar.style.left = left + 'px';
        bar.style.top = top + 'px';
        bar.style.visibility = 'visible';
        if (menu.style.display === 'block') placeMenu();
    }

    // ---------- 更新時機 ----------
    // 掛在 applySelectionVisuals 上：選取一變動就重算（與 tableFill.js 相同做法）
    if (typeof applySelectionVisuals === 'function') {
        const orig = applySelectionVisuals;
        applySelectionVisuals = function () {
            const ret = orig.apply(this, arguments);
            closeMenu();
            schedule();
            return ret;
        };
    }
    container.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', schedule);
    dataTable.addEventListener('focusin', schedule);
    dataTable.addEventListener('focusout', function () { setTimeout(schedule, 0); });
    dataTable.addEventListener('input', schedule);
    ['mouseup', 'touchend'].forEach(function (evt) {
        document.addEventListener(evt, function () { setTimeout(schedule, 80); }, { passive: true });
    });
    document.addEventListener('keyup', schedule, { passive: true });

    const ce = document.getElementById('cellEditor');
    if (ce) new MutationObserver(schedule).observe(ce, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(schedule).observe(container, { attributes: true, attributeFilter: ['class', 'style'] });
    if (window.ResizeObserver) new ResizeObserver(schedule).observe(container);

    // ---------- 設定選單開關 ----------
    function applyState() {
        const icon = document.getElementById('iconQuickBarCheck');
        if (icon) icon.classList.toggle('active', enabled);
        schedule();
    }
    function bindSetting() {
        applyState();
        const btn = document.getElementById('btnToggleQuickBar');
        if (!btn) return;
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            enabled = !enabled;
            localStorage.setItem(KEY, enabled);
            applyState();
            showToast(enabled ? '✅ 已啟用快速工具列' : '❌ 已關閉快速工具列');
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindSetting);
    else bindSetting();
})();
