// ==========================================
// tableFilter.js — 表格模式：欄位篩選（檢視型篩選）
// 載入順序：放在 table.js、tableFill.js 之後即可（會自動接上工具列、欄選單、欄標題圖示）
//
// 設計原則
//  1. 只「隱藏列」(tr.tf-hidden)，絕不改動資料；列號保持原樣，所以看得出哪幾列被藏起來
//  2. 條件綁在「欄標題 <th> 元素」上（WeakMap），所以欄位被拖曳移動 / 新增 / 刪除時，條件會跟著欄走
//  3. 條件存在 sheetTabs[activeSheetIndex].tableFilter，換頁籤 / 復原 / 切換模式後自動還原
//  4. 篩選中，會波及隱藏列的動作（清除、複製、刪列、貼上…）一律改成「只作用於可見列」或「擋下並提示」
// ==========================================
(function () {
    'use strict';

    // ---------- 狀態 ----------
    const TF = window.TableFilter = {};   // 對外介面：TableFilter.apply() / clearAll() / toggle()
    const conds = new WeakMap();     // th -> { ex:Set(被取消勾選的值), op, v1, v2 }
    const thIds = new WeakMap();     // th -> 流水號（用來偵測欄位結構是否改變）
    let thIdSeq = 1;
    const state = { header: true };  // 第 1 列是否為標題（凍結列數 > 0 時，以凍結列數為準）
    const AUTO_KEY = 'wesing-tf-auto';
    let autoReapply = localStorage.getItem(AUTO_KEY) !== 'false';   // 編輯完成後自動重篩（預設開）
    let modeOn = false;              // 是否顯示每個欄標題上的篩選圖示
    let stale = false;               // 篩選後資料又被編輯過 → 提示「重新套用」
    let lastThead = null, lastSig = '', rowsAtApply = -1, settling = false, syncTimer = null;
    let panelTh = null, work = null; // 篩選面板的暫存狀態

    const OPS = [
        ['', '（無條件）'],
        ['contains', '文字包含'], ['notcontains', '文字不包含'],
        ['eq', '文字完全等於'], ['neq', '文字不等於'],
        ['starts', '開頭是'], ['ends', '結尾是'],
        ['empty', '是空白'], ['notempty', '不是空白'],
        ['gt', '大於'], ['ge', '大於或等於'], ['lt', '小於'], ['le', '小於或等於'], ['between', '介於'],
        ['regex', '符合正規表示式']
    ];
    const NO_VALUE_OPS = ['', 'empty', 'notempty'];

    // ---------- 小工具 ----------
    const thList = () => Array.from(dataTable.querySelectorAll('thead th[data-col]'));
    const bodyRows = () => { const tb = dataTable.querySelector('tbody'); return tb ? Array.from(tb.children) : []; };
    const isHidden = tr => tr && tr.classList.contains('tf-hidden');
    const isActive = c => !!c && ((c.ex && c.ex.size > 0) || !!c.op);
    const headerRows = () => (typeof frozenRowsCount === 'number' && frozenRowsCount > 0) ? frozenRowsCount : (state.header ? 1 : 0);
    const toast = m => { if (typeof showToast === 'function') showToast(m); };

    function cellText(tr, c) {
        const inner = tr.children[c + 1] && tr.children[c + 1].querySelector('.td-inner');
        return inner ? inner.textContent.replace(/\u00a0/g, ' ').trim() : '';
    }
    function cellRaw(tr, c) {
        const inner = tr.children[c + 1] && tr.children[c + 1].querySelector('.td-inner');
        if (!inner) return '';
        if (inner.hasAttribute('data-formula')) return inner.getAttribute('data-formula');
        return inner.innerText.replace(/\n$/, '');
    }
    const num = s => { const n = Number(String(s).replace(/,/g, '').trim()); return (String(s).trim() === '' || isNaN(n)) ? NaN : n; };

    function pass(c, text) {
        if (c.ex && c.ex.has(text)) return false;
        if (!c.op) return true;
        const t = text.toLowerCase(), a = String(c.v1 || '').toLowerCase();
        switch (c.op) {
            case 'contains': return t.includes(a);
            case 'notcontains': return !t.includes(a);
            case 'eq': return t === a;
            case 'neq': return t !== a;
            case 'starts': return t.startsWith(a);
            case 'ends': return t.endsWith(a);
            case 'empty': return text === '';
            case 'notempty': return text !== '';
            case 'regex': try { return new RegExp(c.v1, 'i').test(text); } catch (e) { return true; }
            default: {
                const n = num(text), x = num(c.v1);
                if (isNaN(n) || isNaN(x)) return false;
                if (c.op === 'gt') return n > x;
                if (c.op === 'ge') return n >= x;
                if (c.op === 'lt') return n < x;
                if (c.op === 'le') return n <= x;
                if (c.op === 'between') { const y = num(c.v2); return !isNaN(y) && n >= Math.min(x, y) && n <= Math.max(x, y); }
                return true;
            }
        }
    }

    function activeList() {
        const out = [];
        thList().forEach((th, i) => { const c = conds.get(th); if (isActive(c)) out.push({ th, i, c }); });
        return out;
    }
    const hasActiveFilter = () => activeList().length > 0;
    function markStale() {
        stale = true;
        if (bar) bar.querySelector('.tf-reapply').classList.add('stale');
    }
    // 程式性修改（清除、貼上、獨立編輯器）後呼叫：自動重篩，或提示手動重新套用
    function afterEdit() {
        if (!hasActiveFilter()) return;
        if (autoReapply) setTimeout(apply, 0); else markStale();
    }

    // ---------- 套用篩選（核心） ----------
    function apply() {
        if (!dataTable.querySelector('tbody')) return;
        const act = activeList(), trs = bodyRows(), hdr = headerRows();
        let hidden = 0;
        trs.forEach((tr, r) => {
            const show = (r < hdr || act.length === 0) ? true : act.every(a => pass(a.c, cellText(tr, a.i)));
            tr.classList.toggle('tf-hidden', !show);
            if (!show) hidden++;
        });
        stale = false;
        rowsAtApply = trs.length;
        dataTable.classList.toggle('tf-active', act.length > 0);
        if (act.length > 0 && !modeOn) setMode(true);
        persist(act);
        decorate();
        updateBar(act.length, hidden);
    }
    window.reapplyTableFilter = apply;

    function persist(act) {
        const tab = (typeof sheetTabs !== 'undefined') ? sheetTabs[activeSheetIndex] : null;
        if (!tab) return;
        if (act.length === 0 && state.header) { delete tab.tableFilter; }
        else {
            const out = {};
            act.forEach(a => { out[a.i] = { ex: [...(a.c.ex || [])], op: a.c.op || '', v1: a.c.v1 || '', v2: a.c.v2 || '' }; });
            tab.tableFilter = { conds: out, header: state.header };
        }
        if (typeof debouncedSaveHistory === 'function') debouncedSaveHistory();
    }

    function restore() {
        const tab = (typeof sheetTabs !== 'undefined') ? sheetTabs[activeSheetIndex] : null;
        const saved = tab && tab.tableFilter;
        state.header = saved ? saved.header !== false : true;
        const ths = thList();
        if (saved && saved.conds) {
            Object.keys(saved.conds).forEach(k => {
                const th = ths[parseInt(k, 10)], c = saved.conds[k];
                if (th) conds.set(th, { ex: new Set(c.ex || []), op: c.op || '', v1: c.v1 || '', v2: c.v2 || '' });
            });
        }
        apply();
    }

    function clearAll() {
        thList().forEach(th => conds.delete(th));
        apply();
        toast('🧹 已清除全部篩選');
    }

    // ---------- 欄標題圖示 ----------
    function decorate() {
        thList().forEach(th => {
            if (!thIds.has(th)) thIds.set(th, thIdSeq++);
            let ic = th.querySelector('.btn-col-filter');
            if (!ic) {
                const anchor = th.querySelector('.btn-col-menu');
                if (!anchor) return;
                ic = document.createElement('span');
                ic.className = 'material-symbols-outlined pointer-events-auto cursor-pointer btn-col-filter';
                ic.style.fontSize = '18px';
                ic.textContent = 'filter_alt';
                anchor.parentNode.insertBefore(ic, anchor);
            }
            const on = isActive(conds.get(th));
            ic.classList.toggle('on', on);
            ic.title = on ? '此欄已篩選（點擊修改）' : '篩選此欄';
            th.classList.toggle('tf-th-on', on);
        });
    }
    const signature = () => thList().map(th => { if (!thIds.has(th)) thIds.set(th, thIdSeq++); return thIds.get(th); }).join(',');

    // ---------- 工具列按鈕 / 狀態列 ----------
    let btnFilter = null, bar = null;
    function setMode(on) {
        modeOn = on;
        dataTable.classList.toggle('tf-on', on);
        const chk = document.getElementById('iconTableFilterCheck');
        if (chk) chk.classList.toggle('active', on);
        decorate();
    }
    function toggleMode() {
        if (modeOn) { thList().forEach(th => conds.delete(th)); apply(); setMode(false); toast('篩選已關閉（資料未被更動）'); }
        else { setMode(true); toast('篩選已開啟：點欄標題的漏斗圖示設定條件'); }
    }
    function updateBar(nCols, hidden) {
        if (!bar) return;
        bar.classList.toggle('show', nCols > 0);
        bar.querySelector('.tf-bar-text').textContent = `篩選中：${nCols} 欄有條件，隱藏 ${hidden} 列`;
        bar.querySelector('.tf-reapply').classList.toggle('stale', stale);
    }

    // ---------- 篩選面板 ----------
    let panel = null;
    function buildPanel() {
        panel = document.createElement('div');
        panel.id = 'tfPanel';
        panel.className = 'tf-panel code-text';
        panel.innerHTML = `
            <div class="tf-head"><span class="tf-title"></span><button class="tf-x" title="關閉">×</button></div>
            <div class="tf-sec">
                <div class="tf-lab">依條件</div>
                <select class="tf-op">${OPS.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}</select>
                <div class="tf-vals"><input class="tf-v1" placeholder="值"><input class="tf-v2" placeholder="到"></div>
            </div>
            <div class="tf-sec">
                <div class="tf-lab">依值 <span class="tf-count"></span></div>
                <input class="tf-search" placeholder="搜尋值…">
                <div class="tf-links"><a data-a="all">全選</a>・<a data-a="none">全不選</a><span class="tf-hint">（對搜尋結果生效）</span></div>
                <div class="tf-list"></div>
            </div>
            <div class="tf-foot">
                <label class="tf-hdr"><input type="checkbox" class="tf-header"> 第 1 列是標題</label>
                <span class="tf-spacer"></span>
                <button class="tf-btn tf-clear">清除此欄</button>
                <button class="tf-btn tf-ok">確定</button>
            </div>`;
        document.body.appendChild(panel);
        const q = s => panel.querySelector(s);
        q('.tf-x').onclick = closePanel;
        q('.tf-op').onchange = syncOpUI;
        q('.tf-search').oninput = e => { work.q = e.target.value.trim().toLowerCase(); renderList(); };
        q('.tf-links').onclick = e => {
            const a = e.target.closest('a'); if (!a) return;
            matched().forEach(it => a.dataset.a === 'all' ? work.ex.delete(it.v) : work.ex.add(it.v));
            renderList();
        };
        q('.tf-list').onchange = e => {
            const cb = e.target.closest('input[type=checkbox]'); if (!cb) return;
            const it = work.items[parseInt(cb.dataset.i, 10)];
            cb.checked ? work.ex.delete(it.v) : work.ex.add(it.v);
            updateCount();
        };
        q('.tf-ok').onclick = commitPanel;
        q('.tf-clear').onclick = () => { conds.delete(panelTh); closePanel(); apply(); };
        panel.addEventListener('keydown', e => {
            if (e.key === 'Escape') closePanel();
            else if (e.key === 'Enter' && e.target.matches('.tf-v1,.tf-v2')) commitPanel();
        });
        document.addEventListener('mousedown', e => {
            if (panel.classList.contains('open') && !panel.contains(e.target) && !e.target.closest('.btn-col-filter')) closePanel();
        });
    }

    const matched = () => work.items.filter(it => !work.q || (it.v === '' ? '(空白)' : it.v).toLowerCase().includes(work.q));
    function syncOpUI() {
        const op = panel.querySelector('.tf-op').value;
        panel.querySelector('.tf-v1').style.display = NO_VALUE_OPS.includes(op) ? 'none' : '';
        panel.querySelector('.tf-v2').style.display = op === 'between' ? '' : 'none';
    }
    function updateCount() {
        const n = work.items.filter(it => !work.ex.has(it.v)).length;
        panel.querySelector('.tf-count').textContent = `（已選 ${n} / ${work.items.length}）`;
    }
    function renderList() {
        const list = panel.querySelector('.tf-list'), m = matched(), CAP = 300;
        list.innerHTML = '';
        const frag = document.createDocumentFragment();
        m.slice(0, CAP).forEach(it => {
            const idx = work.items.indexOf(it);
            const row = document.createElement('label'); row.className = 'tf-item';
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.dataset.i = idx; cb.checked = !work.ex.has(it.v);
            const tx = document.createElement('span'); tx.className = 'tf-txt';
            tx.textContent = it.v === '' ? '(空白)' : it.v.replace(/\s*\n\s*/g, ' ⏎ ');
            tx.title = tx.textContent;
            if (it.v === '') tx.classList.add('tf-blank');
            const n = document.createElement('span'); n.className = 'tf-n'; n.textContent = it.n;
            row.append(cb, tx, n); frag.appendChild(row);
        });
        list.appendChild(frag);
        if (m.length > CAP) { const more = document.createElement('div'); more.className = 'tf-more'; more.textContent = `還有 ${m.length - CAP} 項，請用搜尋縮小範圍`; list.appendChild(more); }
        if (m.length === 0) { const none = document.createElement('div'); none.className = 'tf-more'; none.textContent = '沒有符合的值'; list.appendChild(none); }
        updateCount();
    }

    function openPanel(th) {
        const ths = thList(), idx = ths.indexOf(th);
        if (idx < 0) return;
        if (!panel) buildPanel();
        if (!modeOn) setMode(true);
        panelTh = th;
        const c = conds.get(th) || { ex: new Set(), op: '', v1: '', v2: '' };
        work = { ex: new Set(c.ex), items: [], q: '' };

        // 「依值」清單：只列出「通過其他欄篩選」的列的值（連動篩選）＋本欄已被取消勾選的值
        const others = activeList().filter(a => a.th !== th);
        const trs = bodyRows(), hdr = headerRows(), counts = new Map();
        for (let r = hdr; r < trs.length; r++) {
            if (others.every(o => pass(o.c, cellText(trs[r], o.i)))) {
                const v = cellText(trs[r], idx);
                counts.set(v, (counts.get(v) || 0) + 1);
            }
        }
        work.ex.forEach(v => { if (!counts.has(v)) counts.set(v, 0); });
        work.items = [...counts].map(([v, n]) => ({ v, n })).sort((a, b) =>
            (a.v === '') - (b.v === '') || a.v.localeCompare(b.v, 'zh-TW', { numeric: true }));

        const name = th.dataset.colName ? `（${th.dataset.colName}）` : '';
        panel.querySelector('.tf-title').textContent = `篩選：${getColLabel(idx)} 欄${name}`;
        panel.querySelector('.tf-op').value = c.op || '';
        panel.querySelector('.tf-v1').value = c.v1 || '';
        panel.querySelector('.tf-v2').value = c.v2 || '';
        panel.querySelector('.tf-search').value = '';
        const hdrBox = panel.querySelector('.tf-header');
        hdrBox.checked = state.header;
        const frozen = typeof frozenRowsCount === 'number' && frozenRowsCount > 0;
        hdrBox.disabled = frozen;
        panel.querySelector('.tf-hdr').title = frozen ? `已凍結 ${frozenRowsCount} 列，以凍結列為標題` : '勾選後，第 1 列不會被篩選隱藏';
        syncOpUI();
        renderList();

        panel.classList.add('open');
        const r = th.getBoundingClientRect(), pw = panel.offsetWidth, ph = panel.offsetHeight;
        let left = Math.min(Math.max(8, r.left), window.innerWidth - pw - 8);
        let top = r.bottom + 4;
        if (top + ph > window.innerHeight - 8) top = Math.max(8, window.innerHeight - ph - 8);
        panel.style.left = left + 'px'; panel.style.top = top + 'px';
        setTimeout(() => panel.querySelector('.tf-search').focus(), 0);
    }
    function closePanel() { if (panel) panel.classList.remove('open'); panelTh = null; }

    function commitPanel() {
        const op = panel.querySelector('.tf-op').value;
        let v1 = panel.querySelector('.tf-v1').value, v2 = panel.querySelector('.tf-v2').value;
        let useOp = op;
        if (!NO_VALUE_OPS.includes(op) && v1 === '') { useOp = ''; toast('⚠️ 條件沒有填值，已略過「依條件」'); }
        if (useOp === 'between' && v2 === '') { useOp = ''; toast('⚠️ 「介於」需要兩個值，已略過「依條件」'); }
        const c = { ex: new Set(work.ex), op: useOp, v1: useOp ? v1 : '', v2: useOp === 'between' ? v2 : '' };
        if (isActive(c)) conds.set(panelTh, c); else conds.delete(panelTh);
        if (!panel.querySelector('.tf-header').disabled) state.header = panel.querySelector('.tf-header').checked;
        closePanel();
        apply();
    }

    // ---------- 「選取範圍內有幾列被隱藏」 ----------
    function selectionRowSet() {
        const R = bodyRows().length, set = new Set();
        selectedRows.forEach(r => set.add(r));
        if (selectedCols.length) for (let r = 0; r < R; r++) set.add(r);
        selectedCellBlocks.forEach(b => {
            for (let r = Math.min(b.startR, b.endR); r <= Math.max(b.startR, b.endR); r++) set.add(r);
        });
        return set;
    }
    function hiddenInSelection() {
        const trs = bodyRows(); let n = 0;
        selectionRowSet().forEach(r => { if (isHidden(trs[r])) n++; });
        return n;
    }
    // 依選取類型列出「可見列」的儲存格座標
    function visibleCells(kind) {
        const trs = bodyRows(), R = trs.length, C = thList().length, out = [], seen = new Set();
        const add = (r, c) => {
            if (r < 0 || r >= R || c < 0 || c >= C || isHidden(trs[r])) return;
            const k = r * 100000 + c; if (seen.has(k)) return; seen.add(k); out.push([r, c]);
        };
        if (kind === 'rows' || kind === 'all') selectedRows.forEach(r => { for (let c = 0; c < C; c++) add(r, c); });
        if (kind === 'cols' || kind === 'all') selectedCols.forEach(c => { for (let r = 0; r < R; r++) add(r, c); });
        if (kind === 'blocks' || kind === 'all') selectedCellBlocks.forEach(b => {
            for (let r = Math.min(b.startR, b.endR); r <= Math.max(b.startR, b.endR); r++)
                for (let c = Math.min(b.startC, b.endC); c <= Math.max(b.startC, b.endC); c++) add(r, c);
        });
        return out;
    }

    // ---------- 包裝既有動作：篩選中只動可見列 ----------
    function wrapGlobals() {
        const wrap = (name, make) => {
            const orig = window[name];
            if (typeof orig !== 'function') return;
            window[name] = make(orig);
        };

        // 複製：只複製可見列（原本的實作會把隱藏列變成空白行）
        wrap('copySelectedTableData', orig => function () {
            if (!hasActiveFilter()) return orig.apply(this, arguments);
            const cells = visibleCells('all');
            if (!cells.length) return orig.apply(this, arguments);
            const trs = bodyRows();
            const rows = [...new Set(cells.map(x => x[0]))].sort((a, b) => a - b);
            const minC = Math.min(...cells.map(x => x[1])), maxC = Math.max(...cells.map(x => x[1]));
            const inSel = new Set(cells.map(x => x[0] * 100000 + x[1]));
            const esc = t => (/["\n\t]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t);
            const text = rows.map(r => {
                const parts = [];
                for (let c = minC; c <= maxC; c++) parts.push(inSel.has(r * 100000 + c) ? esc(cellRaw(trs[r], c)) : '');
                return parts.join('\t');
            }).join('\n');
            window.clipboardOrigin = { r: rows[0], c: minC };
            const done = () => toast(`✅ 已複製 ${rows.length} 列（僅含可見列）`);
            try {
                if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done);
                else { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); }
            } catch (err) { toast('❌ 複製失敗'); }
        });

        // 清除：只清可見列
        const clearVisible = kind => orig => function () {
            if (!hasActiveFilter()) return orig.apply(this, arguments);
            const trs = bodyRows(), hid = hiddenInSelection();
            visibleCells(kind).forEach(([r, c]) => {
                const inner = trs[r].children[c + 1] && trs[r].children[c + 1].querySelector('.td-inner');
                if (inner) { inner.innerHTML = ''; inner.removeAttribute('data-formula'); }
            });
            if (typeof debouncedSaveHistory === 'function') debouncedSaveHistory();
            afterEdit();
            toast(hid ? `🗑️ 已清除（略過 ${hid} 列隱藏資料）` : '🗑️ 已清除');
        };
        wrap('clearSelectedRows', clearVisible('rows'));
        wrap('clearSelectedCols', clearVisible('cols'));
        wrap('clearSelectedCells', clearVisible('blocks'));

        // 刪列：只刪可見列
        wrap('deleteSelectedRows', orig => function () {
            if (hasActiveFilter()) {
                const trs = bodyRows();
                selectedRows = selectedRows.filter(r => !isHidden(trs[r]));
                if (!selectedRows.length) return toast('⚠️ 沒有可刪除的可見列');
            }
            return orig.apply(this, arguments);
        });

        // 刪除儲存格並上移：會把隱藏列的資料一起搬動 → 篩選中不允許
        wrap('deleteSelectedCellsAndShiftUp', orig => function () {
            if (hasActiveFilter()) return toast('⚠️ 篩選中無法「刪除並上移」，請先清除篩選');
            return orig.apply(this, arguments);
        });

        // 貼上：貼上範圍若蓋到隱藏列 → 擋下
        wrap('handleTablePaste', orig => function (text) {
            if (hasActiveFilter()) {
                const data = parseTSV(text), trs = bodyRows();
                const b0 = selectedCellBlocks[0];
                const multiTarget = selectedRows.length || selectedCols.length || selectedCellBlocks.length > 1 ||
                    (b0 && (b0.startR !== b0.endR || b0.startC !== b0.endC));
                let startR = 0, endR = 0;
                if (selectedRows.length) startR = Math.min(...selectedRows);
                else if (b0) startR = Math.min(b0.startR, b0.endR);
                else if (lastClickedCell) startR = lastClickedCell.r;
                endR = startR + data.length - 1;
                if (selectedCols.length || (multiTarget && data.length === 1 && data[0].length === 1)) {
                    selectionRowSet().forEach(r => { endR = Math.max(endR, r); startR = Math.min(startR, r); });
                }
                if (data.length > 1 || multiTarget) {
                    for (let r = startR; r <= endR; r++) {
                        if (isHidden(trs[r])) return toast('⚠️ 貼上範圍包含被篩選隱藏的列，會覆蓋看不到的資料。請先清除篩選再貼上');
                    }
                }
            }
            const res = orig.apply(this, arguments);
            afterEdit();
            return res;
        });

        // 不換行模式的獨立儲存格編輯器：關閉時寫回，不會觸發 focusout
        wrap('closeCellEditor', orig => function () {
            const res = orig.apply(this, arguments);
            afterEdit();
            return res;
        });
    }

    // ---------- 神奇工具 / 排序：篩選中先確認，做完自動重新套用 ----------
    function hookTools() {
        let bypass = false;
        ['btnApplyAutoFill', 'btnApplyAutoFormula', 'btnApplyAutoSplit', 'btnApplyAutoMerge',
         'btnApplyAutoOption', 'btnApplyRemoveDuplicates', 'btnApplySort'].forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('click', e => {
                if (bypass || !hasActiveFilter()) return;
                const n = hiddenInSelection();
                if (!n || typeof showConfirm !== 'function') return;
                e.stopImmediatePropagation(); e.preventDefault();
                showConfirm('目前有篩選', `選取範圍內有 ${n} 列被篩選隱藏，這個工具會連同它們一起處理。要繼續嗎？`,
                    () => { bypass = true; btn.click(); bypass = false; });
            }, true);
            btn.addEventListener('click', () => { setTimeout(() => { if (hasActiveFilter()) apply(); }, 0); });
        });
    }

    // ---------- 注入 UI ----------
    function injectCSS() {
        const st = document.createElement('style');
        st.textContent = `
        tr.tf-hidden { display: none !important; }
        .btn-col-filter { display: none; border-radius: 4px; color: #6b7280; }
        table#data-table.tf-on .btn-col-filter, .btn-col-filter.on { display: inline-block; }
        .btn-col-filter:hover { background: #d1d5db; }
        .btn-col-filter.on { color: #1d4ed8; background: #dbeafe; }
        table#data-table th.tf-th-on { background-color: #eff6ff; }
        table#data-table.tf-active th.sticky-left .row-label { color: #2563eb; font-weight: 600; }
        #tfBar { display: none; align-items: center; gap: .75rem; padding: .25rem .75rem; background: #eff6ff; border-top: 1px solid #bfdbfe; color: #1e40af; font-size: .8rem; flex: none; }
        #tfBar.show { display: flex; }
        #tableModeContainer.hidden + #tfBar { display: none !important; }
        #tfBar button { display: inline-flex; align-items: center; gap: 2px; padding: 1px 8px; border-radius: 6px; cursor: pointer; }
        #tfBar button:hover { background: #dbeafe; }
        #tfBar .tf-auto { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; margin-left: auto; }
        #tfBar .tf-reapply.stale { background: #fde68a; color: #92400e; }
        .tf-panel { position: fixed; display: none; z-index: 10000; width: 300px; max-width: calc(100vw - 16px); background: #fff; border: 1px solid #e5e7eb; border-radius: .6rem; box-shadow: 0 10px 25px rgba(0,0,0,.15); font-size: .85rem; color: #374151; }
        .tf-panel.open { display: block; }
        .tf-panel, .tf-panel * { box-sizing: border-box; }
        .tf-head { display: flex; align-items: center; justify-content: space-between; padding: .5rem .75rem; border-bottom: 1px solid #f3f4f6; font-weight: 600; }
        .tf-x { font-size: 1.25rem; line-height: 1; color: #9ca3af; cursor: pointer; } .tf-x:hover { color: #374151; }
        .tf-sec { padding: .5rem .75rem; border-bottom: 1px solid #f3f4f6; }
        .tf-lab { font-size: .75rem; color: #6b7280; margin-bottom: .25rem; }
        .tf-panel select, .tf-panel input[type=text], .tf-panel input:not([type]) { width: 100%; border: 1px solid #d1d5db; border-radius: .375rem; padding: .25rem .5rem; outline: none; background: #fff; }
        .tf-panel select:focus, .tf-panel input:focus { border-color: #60a5fa; }
        .tf-vals { display: flex; gap: .4rem; margin-top: .4rem; } .tf-vals input { flex: 1; min-width: 0; }
        .tf-links { margin: .35rem 0; font-size: .75rem; color: #2563eb; } .tf-links a { cursor: pointer; } .tf-links a:hover { text-decoration: underline; } .tf-hint { color: #9ca3af; margin-left: .25rem; }
        .tf-list { max-height: 220px; overflow: auto; border: 1px solid #f3f4f6; border-radius: .375rem; }
        .tf-item { display: flex; align-items: center; gap: .5rem; padding: .2rem .5rem; cursor: pointer; } .tf-item:hover { background: #f9fafb; }
        .tf-txt { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .tf-blank { color: #9ca3af; font-style: italic; }
        .tf-n { color: #9ca3af; font-size: .75rem; }
        .tf-more { padding: .35rem .5rem; color: #9ca3af; font-size: .75rem; text-align: center; }
        .tf-foot { display: flex; align-items: center; gap: .5rem; padding: .5rem .75rem; } .tf-spacer { flex: 1; }
        .tf-hdr { display: flex; align-items: center; gap: .25rem; font-size: .75rem; color: #6b7280; cursor: pointer; }
        .tf-btn { padding: .25rem .75rem; border-radius: .375rem; border: 1px solid #d1d5db; cursor: pointer; } .tf-btn:hover { background: #f3f4f6; }
        .tf-ok { background: #2563eb; border-color: #2563eb; color: #fff; } .tf-ok:hover { background: #1d4ed8; }
        `;
        document.head.appendChild(st);
    }

    function injectUI() {
        // 1. 「表格設定」選單項目（放在「凍結列數」下方；用勾選圖示表示是否開啟）
        const settingsMenu = document.querySelector('#dd-tableSettings .dropdown-menu');
        btnFilter = document.createElement('button');
        btnFilter.id = 'btnTableFilter';
        btnFilter.className = 'w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-100 text-gray-700 transition-colors';
        btnFilter.title = '顯示欄標題的篩選圖示 (Ctrl+Shift+L)';
        btnFilter.innerHTML = `<div class="flex items-center gap-2"><span class="material-symbols-outlined text-base">filter_alt</span><span>篩選</span></div>
            <span class="material-symbols-outlined text-base check-icon text-blue-600 font-bold" id="iconTableFilterCheck">check</span>`;
        btnFilter.addEventListener('click', e => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
            toggleMode();
        });
        const freeze = document.getElementById('dd-freeze');
        if (settingsMenu && freeze) freeze.insertAdjacentElement('afterend', btnFilter);
        else if (settingsMenu) settingsMenu.appendChild(btnFilter);
        else { const ctrl = document.getElementById('tableControls'); if (ctrl) ctrl.appendChild(btnFilter); }

        // 2. 欄位選單：新增「篩選此欄…」
        const menu = document.getElementById('colMenu');
        if (menu) {
            const rename = menu.querySelector('[data-action="rename"]');
            const item = document.createElement('button');
            item.className = 'context-menu-item'; item.dataset.action = 'filter';
            item.innerHTML = '<span class="material-symbols-outlined text-base">filter_alt</span>篩選此欄…';
            if (rename) rename.insertAdjacentElement('afterend', item); else menu.prepend(item);
            menu.addEventListener('click', e => {
                const b = e.target.closest('button[data-action="filter"]'); if (!b) return;
                const th = dataTable.querySelector(`thead th[data-col="${activeMenuColIndex}"]`);
                if (th) setTimeout(() => openPanel(th), 0);
            });
        }

        // 3. 狀態列（放在表格容器正下方）
        const cont = document.getElementById('tableModeContainer');
        bar = document.createElement('div');
        bar.id = 'tfBar'; bar.className = 'code-text';
        bar.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px">filter_alt</span>
            <span class="tf-bar-text"></span>
            <label class="tf-auto" title="編輯完儲存格後，自動重新篩選"><input type="checkbox" class="tf-auto-cb"> 自動重新套用</label>
            <button class="tf-reapply" title="資料有改動後，重新依條件篩選">↻ 重新套用</button>
            <button class="tf-clearall">清除全部篩選</button>`;
        if (cont) cont.insertAdjacentElement('afterend', bar);
        bar.querySelector('.tf-reapply').onclick = () => { apply(); toast('✅ 已重新套用篩選'); };
        bar.querySelector('.tf-clearall').onclick = clearAll;
        const cb = bar.querySelector('.tf-auto-cb');
        cb.checked = autoReapply;
        cb.onchange = () => { autoReapply = cb.checked; localStorage.setItem(AUTO_KEY, autoReapply); if (autoReapply && stale) apply(); };
    }

    // ---------- 事件：欄標題的漏斗圖示（捕獲階段攔截，避免觸發「選取整欄 / 拖曳欄」） ----------
    function bindEvents() {
        dataTable.addEventListener('mousedown', e => { if (e.target.closest('.btn-col-filter')) e.stopPropagation(); }, true);
        dataTable.addEventListener('click', e => {
            const ic = e.target.closest('.btn-col-filter'); if (!ic) return;
            e.stopPropagation(); e.preventDefault();
            const th = ic.closest('th');
            if (panel && panel.classList.contains('open') && panelTh === th) closePanel(); else openPanel(th);
        }, true);

        // 編輯中不重篩（避免打字打到一半那列就消失）；離開儲存格（Enter / Tab / 點別處）時才重篩
        dataTable.addEventListener('input', () => { if (hasActiveFilter()) markStale(); });
        dataTable.addEventListener('focusout', e => {
            if (!e.target.classList || !e.target.classList.contains('td-inner')) return;
            if (stale && autoReapply) setTimeout(() => { if (!dataTable.querySelector('.td-inner:focus')) apply(); }, 0);
        });

        document.addEventListener('keydown', e => {
            if (typeof currentMode !== 'undefined' && currentMode === 'table' && (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
                e.preventDefault(); toggleMode();
            }
        });

        // 表格被重建（換頁籤 / 復原 / 切換模式）或欄位結構改變 → 還原或重新套用
        const mo = new MutationObserver(() => { clearTimeout(syncTimer); syncTimer = setTimeout(sync, 80); });
        mo.observe(dataTable, { childList: true, subtree: true });
    }

    function sync() {
        const thead = dataTable.querySelector('thead');
        if (!thead) return;
        decorate();
        const sig = signature(), rowN = bodyRows().length;
        if (thead !== lastThead) {               // 整張表被重建
            lastThead = thead; lastSig = sig; restore(); settling = true; return;
        }
        if (sig !== lastSig) {                   // 欄位被新增 / 刪除 / 移動
            lastSig = sig; if (hasActiveFilter()) apply(); return;
        }
        if (settling) {                          // 大表分批渲染中：列數還在長，等穩定後再套一次
            if (rowN !== rowsAtApply) apply(); else settling = false;
        }
    }

    // ---------- 啟動 ----------
    function init() {
        if (typeof dataTable === 'undefined' || !dataTable) return;
        injectCSS(); injectUI(); bindEvents(); wrapGlobals(); hookTools();
        sync();
        TF.apply = apply; TF.clearAll = clearAll; TF.openPanel = openPanel; TF.toggle = toggleMode;
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
