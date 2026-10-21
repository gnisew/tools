// ==========================================
// tableFill.js — 表格模式：右下角填滿控點 (仿 Excel)
//   拖曳 / Alt 拖曳 → 智慧序列（A01→A02；1,3→5,7；一二三；星期一；第一章；甲乙丙…）
//   Ctrl 拖曳       → 純複製（來源範圍會循環重複）
//   Shift 拖曳      → 在拖曳範圍插入空白格（既有資料往下／往右推）
//
// 載入順序：必須放在 table.js 之後
//   <script src="table.js"></script>
//   <script src="tableFill.js"></script>
// ==========================================

// ------------------------------------------
// 一、純函式：序列邏輯（不依賴 DOM，可單獨測試）
// ------------------------------------------

// ---- 阿拉伯數字：取出最後一組數字 A01 → { prefix:'A', digits:'01', suffix:'' } ----
function fillParseNumber(text) {
    const m = String(text).match(/^([\s\S]*?)(\d+)(\D*)$/);
    if (!m) return null;
    return { prefix: m[1], digits: m[2], suffix: m[3], num: parseInt(m[2], 10) };
}

function fillBuildNumber(parsed, num) {
    if (num < 0) {
        // 純數字允許負數；夾在文字中的數字不允許（回傳 null 代表留空）
        if (parsed.prefix === '' && parsed.suffix === '') return String(num);
        return null;
    }
    let s = String(num);
    if (parsed.digits.length > 1 && parsed.digits.startsWith('0')) {
        s = s.padStart(parsed.digits.length, '0');
    }
    return parsed.prefix + s + parsed.suffix;
}

// ---- 中文數字（一～九百九十九） ----
const CN_DIGIT = { '零': 0, '〇': 0, '一': 1, '二': 2, '兩': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
const CN_DIGIT_CHARS = '零一二三四五六七八九';
const CN_RUN = '[零〇一二三四五六七八九十百兩]+';

function cnToNum(str) {
    let total = 0, cur = 0, valid = false;
    for (const ch of str) {
        if (ch in CN_DIGIT) { cur = CN_DIGIT[ch]; valid = true; }
        else if (ch === '十') { total += (cur || 1) * 10; cur = 0; valid = true; }
        else if (ch === '百') { total += (cur || 1) * 100; cur = 0; valid = true; }
        else return null;
    }
    total += cur;
    return valid && total > 0 ? total : null;
}

function numToCn(n) {
    if (n < 1 || n > 999) return null;
    const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), o = n % 10;
    let s = '';
    if (h) s += CN_DIGIT_CHARS[h] + '百';
    if (t) s += (t === 1 && !h ? '' : CN_DIGIT_CHARS[t]) + '十';
    else if (h && o) s += '零';
    if (o) s += CN_DIGIT_CHARS[o];
    return s;
}

// 這些前綴／後綴出現時，才把中文數字視為「編號」（避免把「一起」「三明治」當序列）
const CN_PREFIX = ['第', '編號', '編碼', '單元', '號', 'No.', 'no.', 'Unit ', 'Lesson '];
const CN_SUFFIX = ['篇', '章', '課', '節', '回', '單元', '部', '期', '條', '項', '頁', '集', '堂', '關', '組', '週', '周', '天', '日'];

// ---- 循環清單（週幾、天干、地支） ----
const CYCLE_LISTS = [
    { name: 'wk1', items: '一二三四五六日'.split(''), prefixes: ['星期', '週', '周', '禮拜'] },
    { name: 'wk2', items: '一二三四五六天'.split(''), prefixes: ['星期', '週', '周', '禮拜'] },
    { name: 'gan', items: '甲乙丙丁戊己庚辛壬癸'.split(''), prefixes: [''] },
    { name: 'zhi', items: '子丑寅卯辰巳午未申酉戌亥'.split(''), prefixes: [''] }
];

// 把一格文字解析成「序列元素」；解析不了回傳 null
//   type: 'num' 阿拉伯數字 | 'cn' 中文數字 | 'cyc' 循環清單
function fillParseToken(text) {
    text = String(text);
    if (text === '') return null;

    // 1) 循環清單：整格必須剛好是 [前綴]+清單中的一字
    for (const L of CYCLE_LISTS) {
        for (const pre of L.prefixes) {
            if (text.length === pre.length + 1 && text.startsWith(pre)) {
                const idx = L.items.indexOf(text[pre.length]);
                // 單字的「日」「天」「一」…不當成週幾（必須有前綴），避免和中文數字衝突
                if (idx >= 0 && (pre !== '' || L.name === 'gan' || L.name === 'zhi')) {
                    return { type: 'cyc', list: L.name, items: L.items, prefix: pre, suffix: '', value: idx };
                }
            }
        }
    }

    // 2) 中文數字
    const m = text.match(new RegExp('^([\\s\\S]*?)(' + CN_RUN + ')([^零〇一二三四五六七八九十百兩]*)$'));
    if (m) {
        const prefix = m[1], run = m[2], suffix = m[3];
        const ok =
            (prefix === '' && suffix === '') ||
            CN_PREFIX.some(p => prefix.endsWith(p)) ||
            CN_SUFFIX.some(x => suffix.startsWith(x));
        const val = cnToNum(run);
        if (ok && val !== null) return { type: 'cn', prefix, suffix, value: val };
    }

    // 3) 阿拉伯數字
    const a = fillParseNumber(text);
    if (a) return { type: 'num', prefix: a.prefix, suffix: a.suffix, digits: a.digits, value: a.num };
    return null;
}

function fillBuildToken(tpl, value) {
    if (tpl.type === 'num') return fillBuildNumber(tpl, value);
    if (tpl.type === 'cn') {
        const s = numToCn(value);
        return s === null ? null : tpl.prefix + s + tpl.suffix;
    }
    if (tpl.type === 'cyc') {
        const n = tpl.items.length;
        return tpl.prefix + tpl.items[((value % n) + n) % n] + tpl.suffix;
    }
    return null;
}

// 產生一整欄／一整列的序列
//   srcValues : 來源格文字陣列（由來源起點排到終點）
//   count     : 要產生幾格
//   backward  : true 表示往上／往左填（遞減）
// 回傳字串陣列（null 代表該格留空）
function fillSmartSeries(srcValues, count, backward) {
    const n = srcValues.length;

    // 無法判斷時 → 退回「循環複製」
    const repeat = () => {
        const out = [];
        for (let i = 0; i < count; i++) {
            out.push(backward ? srcValues[((n - 1 - (i % n)) % n + n) % n] : srcValues[i % n]);
        }
        return out;
    };

    const tokens = srcValues.map(fillParseToken);
    if (tokens.some(t => t === null)) return repeat();

    // 全部來源格必須是同一種序列（型態、前後綴、清單相同）
    const t0 = tokens[0];
    const same = tokens.every(t => t.type === t0.type && t.prefix === t0.prefix &&
                                   t.suffix === t0.suffix && t.list === t0.list);
    if (!same) return repeat();

    // 公差：單格 → 1；多格 → 必須等差（循環清單以清單長度取模）
    const L = t0.type === 'cyc' ? t0.items.length : 0;
    const diff = (a, b) => (L ? (((b - a) % L) + L) % L : b - a);
    let step = 1;
    if (n >= 2) {
        const d = diff(tokens[0].value, tokens[1].value);
        for (let i = 2; i < n; i++) {
            if (diff(tokens[i - 1].value, tokens[i].value) !== d) return repeat();
        }
        step = d;
    }

    // 阿拉伯數字的補零位數取來源中最寬者
    const tpl = Object.assign({}, t0);
    if (t0.type === 'num') {
        tpl.digits = tokens.reduce((a, b) => (b.digits.length > a.length ? b.digits : a), t0.digits);
    }

    const out = [];
    const base = backward ? tokens[0].value : tokens[n - 1].value;
    const sign = backward ? -1 : 1;
    for (let i = 1; i <= count; i++) out.push(fillBuildToken(tpl, base + sign * step * i));
    return out;
}

// Node 測試用匯出（瀏覽器中 module 不存在，不影響）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fillParseNumber, fillBuildNumber, fillParseToken, fillSmartSeries, cnToNum, numToCn };
}

// ------------------------------------------
// 二、DOM 部分（僅在瀏覽器執行）
// ------------------------------------------
if (typeof document !== 'undefined' && typeof dataTable !== 'undefined') {
(function () {
    const wrapper = document.getElementById('tableWrapper') || tableModeContainer;
    const container = tableModeContainer;

    // ---- 樣式（自行注入，不必改 style.css）----
    const style = document.createElement('style');
    style.textContent = `
        #fillHandle {
            position: absolute; width: 9px; height: 9px; background: #2563eb;
            border: 1px solid #fff; box-sizing: border-box; cursor: crosshair;
            z-index: 15; display: none; touch-action: none;
        }
        #fillHandle::before { content: ''; position: absolute; inset: -8px; } /* 放大點擊範圍 */
        #fillPreview {
            position: absolute; border: 2px dashed #2563eb; background: rgba(37,99,235,.06);
            pointer-events: none; z-index: 14; display: none; box-sizing: border-box;
        }
        #fillTip {
            position: fixed; z-index: 10000; pointer-events: none; display: none;
            background: #1e293b; color: #fff; font-size: 12px; padding: 3px 8px;
            border-radius: 6px; white-space: nowrap;
        }
        body.is-fill-dragging, body.is-fill-dragging * { cursor: crosshair !important; user-select: none !important; }
    `;
    document.head.appendChild(style);

    const handle = document.createElement('div');  handle.id = 'fillHandle';
    const preview = document.createElement('div'); preview.id = 'fillPreview';
    const tip = document.createElement('div');     tip.id = 'fillTip';
    wrapper.appendChild(handle);
    wrapper.appendChild(preview);
    document.body.appendChild(tip);

    // ---- 工具 ----
    const isTableActive = () =>
        typeof currentMode !== 'undefined' && currentMode === 'table' &&
        window.getComputedStyle(container).display !== 'none';

    // 取得目前「來源範圍」：只認最後一個儲存格區塊（整欄／整列選取不顯示控點）
    function getSourceRange() {
        if (selectedRows.length > 0 || selectedCols.length > 0) return null;
        if (!selectedCellBlocks || selectedCellBlocks.length === 0) return null;
        const b = selectedCellBlocks[selectedCellBlocks.length - 1];
        return {
            minR: Math.min(b.startR, b.endR), maxR: Math.max(b.startR, b.endR),
            minC: Math.min(b.startC, b.endC), maxC: Math.max(b.startC, b.endC)
        };
    }

    const getTd = (r, c) => {
        const tr = dataTable.querySelector('tbody')?.children[r];
        return tr ? tr.children[c + 1] : null;
    };

    // td 相對於 wrapper 的座標
    function rectInWrapper(td) {
        const w = wrapper.getBoundingClientRect();
        const t = td.getBoundingClientRect();
        return { left: t.left - w.left, top: t.top - w.top, right: t.right - w.left, bottom: t.bottom - w.top };
    }

    // ---- 控點定位 ----
    let rafId = 0;
    function scheduleUpdate() {
        if (rafId) return;
        rafId = requestAnimationFrame(() => { rafId = 0; updateFillHandle(); });
    }

    function updateFillHandle() {
        if (dragState) return; // 拖曳中由拖曳邏輯自己管
        const src = isTableActive() && !isSelectionLocked ? getSourceRange() : null;
        const td = src ? getTd(src.maxR, src.maxC) : null;
        if (!td) { handle.style.display = 'none'; return; }

        // 控點若被固定的欄列標題蓋住就隱藏
        const cRect = container.getBoundingClientRect();
        const tRect = td.getBoundingClientRect();
        const headH = dataTable.querySelector('thead')?.getBoundingClientRect().height || 36;
        const headW = dataTable.querySelector('th.sticky-corner')?.getBoundingClientRect().width || 72;
        const cx = tRect.right, cy = tRect.bottom;
        if (cx < cRect.left + headW + 4 || cx > cRect.right ||
            cy < cRect.top + headH + 4 || cy > cRect.bottom) {
            handle.style.display = 'none';
            return;
        }

        const r = rectInWrapper(td);
        handle.style.left = (r.right - 8) + 'px';
        handle.style.top = (r.bottom - 8) + 'px';
        handle.style.display = 'block';
    }

    // 掛在 applySelectionVisuals 上：選取一變動就更新控點
    if (typeof applySelectionVisuals === 'function') {
        const orig = applySelectionVisuals;
        applySelectionVisuals = function () {
            const ret = orig.apply(this, arguments);
            scheduleUpdate();
            return ret;
        };
    }
    container.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    dataTable.addEventListener('input', scheduleUpdate);
    dataTable.addEventListener('focusout', scheduleUpdate);
    new MutationObserver(scheduleUpdate).observe(container, { attributes: true, attributeFilter: ['class', 'style'] });

    // ---- 拖曳 ----
    let dragState = null;

    function modeFromEvent(e) {
        if (e.shiftKey) return 'insert';
        if (e.ctrlKey || e.metaKey) return 'copy';
        return 'smart'; // 無修飾鍵 / Alt
    }
    const MODE_TEXT = { copy: '複製', smart: '智慧數字', insert: '插入空白格' };

    // 開拖前快取每列／每欄的位置（相對於 table 左上角）
    function cacheGeometry() {
        const tRect = dataTable.getBoundingClientRect();
        const rows = Array.from(dataTable.querySelectorAll('tbody tr'));
        const rowEdges = rows.map(tr => {
            const rc = tr.getBoundingClientRect();
            return { top: rc.top - tRect.top, bottom: rc.bottom - tRect.top };
        });
        const ths = Array.from(dataTable.querySelectorAll('thead th')).slice(1);
        const colEdges = ths.map(th => {
            const rc = th.getBoundingClientRect();
            return { left: rc.left - tRect.left, right: rc.right - tRect.left };
        });
        return { rowEdges, colEdges };
    }

    // 滑鼠位置 → 格座標（超出表格時以最後一列／欄的尺寸虛擬延伸）
    function pointToCell(clientX, clientY) {
        const tRect = dataTable.getBoundingClientRect();
        const px = clientX - tRect.left, py = clientY - tRect.top;
        const { rowEdges, colEdges } = dragState.geo;
        const R = rowEdges.length, C = colEdges.length;

        let r;
        if (py <= rowEdges[0].top) r = 0;
        else if (py >= rowEdges[R - 1].bottom) {
            const h = rowEdges[R - 1].bottom - rowEdges[R - 1].top || 36;
            r = R - 1 + Math.ceil((py - rowEdges[R - 1].bottom) / h);
        } else {
            r = rowEdges.findIndex(e => py >= e.top && py < e.bottom);
            if (r < 0) r = R - 1;
        }

        let c;
        if (px <= colEdges[0].left) c = 0;
        else if (px >= colEdges[C - 1].right) {
            const w = colEdges[C - 1].right - colEdges[C - 1].left || 150;
            c = C - 1 + Math.ceil((px - colEdges[C - 1].right) / w);
        } else {
            c = colEdges.findIndex(e => px >= e.left && px < e.right);
            if (c < 0) c = C - 1;
        }
        return { r, c };
    }

    // 依滑鼠所在格，決定往哪個方向、填到哪裡（和 Excel 一樣一次只選一個主軸）
    function computeTarget(cell) {
        const s = dragState.src;
        const dr = cell.r > s.maxR ? cell.r - s.maxR : (cell.r < s.minR ? cell.r - s.minR : 0);
        const dc = cell.c > s.maxC ? cell.c - s.maxC : (cell.c < s.minC ? cell.c - s.minC : 0);
        if (dr === 0 && dc === 0) return null;

        // 比較「超出的格數」，大的當主軸
        if (Math.abs(dr) >= Math.abs(dc)) {
            return dr > 0
                ? { dir: 'down',  from: s.maxR + 1, to: cell.r }
                : { dir: 'up',    from: cell.r,     to: s.minR - 1 };
        }
        return dc > 0
            ? { dir: 'right', from: s.maxC + 1, to: cell.c }
            : { dir: 'left',  from: cell.c,     to: s.minC - 1 };
    }

    // 虛擬格的預覽矩形（超出表格時用最後一列／欄尺寸推算）
    function virtualRect(r0, r1, c0, c1) {
        const w = wrapper.getBoundingClientRect();
        const t = dataTable.getBoundingClientRect();
        const { rowEdges, colEdges } = dragState.geo;
        const R = rowEdges.length, C = colEdges.length;
        const rh = rowEdges[R - 1].bottom - rowEdges[R - 1].top;
        const cw = colEdges[C - 1].right - colEdges[C - 1].left;
        const top = r0 < R ? rowEdges[r0].top : rowEdges[R - 1].bottom + (r0 - R) * rh;
        const bottom = r1 < R ? rowEdges[r1].bottom : rowEdges[R - 1].bottom + (r1 - R + 1) * rh;
        const left = c0 < C ? colEdges[c0].left : colEdges[C - 1].right + (c0 - C) * cw;
        const right = c1 < C ? colEdges[c1].right : colEdges[C - 1].right + (c1 - C + 1) * cw;
        const ox = t.left - w.left, oy = t.top - w.top;
        return { left: left + ox, top: top + oy, width: right - left, height: bottom - top };
    }

    function drawPreview(target, mode) {
        const s = dragState.src;
        if (!target) { preview.style.display = 'none'; tip.style.display = 'none'; return; }

        let r0 = s.minR, r1 = s.maxR, c0 = s.minC, c1 = s.maxC;
        if (target.dir === 'down')  r1 = target.to;
        if (target.dir === 'up')    r0 = target.from;
        if (target.dir === 'right') c1 = target.to;
        if (target.dir === 'left')  c0 = target.from;

        // 插入模式只框出「新增的空白區」，其餘模式框住 來源 + 延伸
        if (mode === 'insert') {
            if (target.dir === 'down' || target.dir === 'up') { r0 = target.from; r1 = target.to; }
            else { c0 = target.from; c1 = target.to; }
        }
        const v = virtualRect(r0, r1, c0, c1);
        preview.style.left = v.left + 'px';   preview.style.top = v.top + 'px';
        preview.style.width = v.width + 'px'; preview.style.height = v.height + 'px';
        preview.style.display = 'block';
        preview.style.borderColor = mode === 'insert' ? '#16a34a' : (mode === 'smart' ? '#d97706' : '#2563eb');
    }

    function updateTip(e, mode, target) {
        const n = target ? (target.to - target.from + 1) : 0;
        tip.textContent = `${MODE_TEXT[mode]}${n ? ` · ${n} 格` : ''}`;
        tip.style.left = (e.clientX + 14) + 'px';
        tip.style.top = (e.clientY + 16) + 'px';
        tip.style.display = 'block';
    }

    handle.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        const src = getSourceRange();
        if (!src) return;
        e.preventDefault();
        e.stopPropagation();

        // 先讓正在編輯的儲存格失焦，確保內容已寫回、公式已計算
        const ae = document.activeElement;
        if (ae && ae.classList && ae.classList.contains('td-inner')) ae.blur();

        dragState = { src, geo: cacheGeometry(), target: null, lastEvent: e, scrollTimer: 0 };
        handle.style.display = 'none';
        document.body.classList.add('is-fill-dragging');
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onCancel);
        document.addEventListener('keydown', onKey, true);
        document.addEventListener('keyup', onKey, true);
        autoScrollLoop();
    });

    function refresh(e) {
        if (!dragState) return;
        dragState.lastEvent = e;
        const cell = pointToCell(e.clientX, e.clientY);
        const mode = modeFromEvent(e);
        const target = computeTarget(cell);
        dragState.target = target;
        dragState.mode = mode;
        drawPreview(target, mode);
        updateTip(e, mode, target);
    }
    function onMove(e) { refresh(e); }

    // 拖曳中按下／放開 Ctrl、Shift、Alt 也要即時更新模式；並擋掉 Alt 單鍵觸發瀏覽器選單
    function onKey(e) {
        if (!dragState) return;
        if (e.key === 'Escape') { cancelDrag(); e.preventDefault(); return; }
        if (e.key === 'Alt') e.preventDefault();
        const le = dragState.lastEvent;
        refresh({
            clientX: le.clientX, clientY: le.clientY,
            shiftKey: e.shiftKey, altKey: e.altKey, ctrlKey: e.ctrlKey, metaKey: e.metaKey
        });
    }

    // 滑鼠靠近或超出容器邊緣時自動捲動
    function autoScrollLoop() {
        if (!dragState) return;
        const e = dragState.lastEvent;
        const cr = container.getBoundingClientRect();
        const headH = dataTable.querySelector('thead')?.getBoundingClientRect().height || 36;
        const headW = dataTable.querySelector('th.sticky-corner')?.getBoundingClientRect().width || 72;
        const edge = 40, maxSpeed = 28;
        let dx = 0, dy = 0;
        if (e.clientY > cr.bottom - edge) dy = Math.min(maxSpeed, (e.clientY - (cr.bottom - edge)) / 3 + 2);
        else if (e.clientY < cr.top + headH + edge / 2) dy = -Math.min(maxSpeed, ((cr.top + headH + edge / 2) - e.clientY) / 3 + 2);
        if (e.clientX > cr.right - edge) dx = Math.min(maxSpeed, (e.clientX - (cr.right - edge)) / 3 + 2);
        else if (e.clientX < cr.left + headW + edge / 2) dx = -Math.min(maxSpeed, ((cr.left + headW + edge / 2) - e.clientX) / 3 + 2);
        if (dx || dy) {
            container.scrollLeft += dx; container.scrollTop += dy;
            refresh(e); // 捲動後重新換算滑鼠所在格
        }
        dragState.scrollTimer = requestAnimationFrame(autoScrollLoop);
    }

    function endDrag() {
        if (!dragState) return;
        cancelAnimationFrame(dragState.scrollTimer);
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onCancel);
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('keyup', onKey, true);
        document.body.classList.remove('is-fill-dragging');
        preview.style.display = 'none';
        tip.style.display = 'none';
        dragState = null;
    }
    function cancelDrag() { endDrag(); scheduleUpdate(); }
    function onCancel() { cancelDrag(); }

    function onUp(e) {
        if (!dragState) return;
        // 放開時以當下的按鍵狀態為準
        const mode = modeFromEvent(e);
        const cell = pointToCell(e.clientX, e.clientY);
        const target = computeTarget(cell);
        const src = dragState.src;
        endDrag();
        if (!target) { scheduleUpdate(); return; }
        applyFill(src, target, mode);
    }

    // ---- 套用填滿 ----
    function readCell(r, c) {
        const inner = getTd(r, c)?.querySelector('.td-inner');
        if (!inner) return { text: '', formula: null };
        const f = inner.getAttribute('data-formula');
        let t = getCellText(inner).replace(/\n$/, '');
        return { text: t, formula: f };
    }
    function writeCell(r, c, value) {
        const inner = getTd(r, c)?.querySelector('.td-inner');
        if (!inner) return;
        if (value.formula) {
            inner.setAttribute('data-formula', value.formula);
            inner.innerText = value.formula; // 稍後 recalculateAllFormulas 會換成計算結果
        } else {
            inner.removeAttribute('data-formula');
            inner.innerText = value.text;
        }
    }

    // 確保表格至少有 needRows 列、needCols 欄
    function ensureSize(needRows, needCols) {
        const tbody = dataTable.querySelector('tbody');
        const curRows = tbody.children.length;
        if (needRows > curRows) insertRowAt(curRows, -1, needRows - curRows);
        const curCols = dataTable.querySelector('thead tr').children.length - 1;
        if (needCols > curCols) insertColAt(curCols, -1, needCols - curCols);
    }

    function applyFill(src, target, mode) {
        const vertical = target.dir === 'down' || target.dir === 'up';
        const backward = target.dir === 'up' || target.dir === 'left';
        const count = target.to - target.from + 1;
        if (count <= 0) return;

        // 先確保表格夠大（拖到表格外時自動長列／欄）
        const tbody = dataTable.querySelector('tbody');
        const curRows = tbody.children.length;
        const curCols = dataTable.querySelector('thead tr').children.length - 1;
        let needRows = curRows, needCols = curCols;
        if (target.dir === 'down')  needRows = Math.max(needRows, target.to + 1);
        if (target.dir === 'right') needCols = Math.max(needCols, target.to + 1);

        if (mode === 'insert') {
            // 插入空白格：把「插入點以後」的資料往下／往右推 count 格
            const lines = vertical ? (src.maxC - src.minC + 1) : (src.maxR - src.minR + 1);
            if (vertical) {
                const at = target.from; // 空白區的起點列
                // 找出這些欄位中，最後一個有資料的列，決定要不要擴表
                let lastData = -1;
                for (let r = curRows - 1; r >= at; r--) {
                    for (let c = src.minC; c <= src.maxC; c++) {
                        const v = readCell(r, c);
                        if (v.formula || v.text.trim() !== '') { lastData = r; break; }
                    }
                    if (lastData >= 0) break;
                }
                if (lastData >= 0) needRows = Math.max(needRows, lastData + count + 1);
                ensureSize(needRows, needCols);
                const totalRows = dataTable.querySelector('tbody').children.length;
                for (let c = src.minC; c <= src.maxC; c++) {
                    for (let r = totalRows - 1; r >= at + count; r--) writeCell(r, c, readCell(r - count, c));
                    for (let r = at; r < at + count; r++) writeCell(r, c, { text: '', formula: null });
                }
            } else {
                const at = target.from; // 空白區的起點欄
                let lastData = -1;
                for (let c = curCols - 1; c >= at; c--) {
                    for (let r = src.minR; r <= src.maxR; r++) {
                        const v = readCell(r, c);
                        if (v.formula || v.text.trim() !== '') { lastData = c; break; }
                    }
                    if (lastData >= 0) break;
                }
                if (lastData >= 0) needCols = Math.max(needCols, lastData + count + 1);
                ensureSize(needRows, needCols);
                const totalCols = dataTable.querySelector('thead tr').children.length - 1;
                for (let r = src.minR; r <= src.maxR; r++) {
                    for (let c = totalCols - 1; c >= at + count; c--) writeCell(r, c, readCell(r, c - count));
                    for (let c = at; c < at + count; c++) writeCell(r, c, { text: '', formula: null });
                }
            }
            finishFill(src, target);
            showToast(`✅ 已插入 ${count} 格空白`);
            return;
        }

        ensureSize(needRows, needCols);

        // 逐行（直向填滿＝逐欄；橫向填滿＝逐列）處理
        const lineStart = vertical ? src.minC : src.minR;
        const lineEnd   = vertical ? src.maxC : src.maxR;
        for (let line = lineStart; line <= lineEnd; line++) {
            // 取出沿填滿方向的來源格（由來源起點排到終點）
            const srcCells = [];
            if (vertical) for (let r = src.minR; r <= src.maxR; r++) srcCells.push({ r, c: line, v: readCell(r, line) });
            else          for (let c = src.minC; c <= src.maxC; c++) srcCells.push({ r: line, c, v: readCell(line, c) });
            const n = srcCells.length;

            // 智慧數字：只對「非公式」的來源有效
            let smart = null;
            if (mode === 'smart' && srcCells.every(s => !s.v.formula)) {
                smart = fillSmartSeries(srcCells.map(s => s.v.text), count, backward);
            }

            for (let i = 0; i < count; i++) {
                // 目標格座標：往下／右是 from + i；往上／左是由近到遠 to - i
                const pos = backward ? (target.to - i) : (target.from + i);
                const tr_ = vertical ? pos : line;
                const tc_ = vertical ? line : pos;

                // 對應的來源格（循環）：往後填 → 第 i 個來源；往前填 → 倒著數
                const srcIdx = backward ? (((n - 1 - (i % n)) % n) + n) % n : (i % n);
                const s = srcCells[srcIdx];

                if (smart) {
                    const t = smart[i];
                    writeCell(tr_, tc_, { text: t === null ? '' : t, formula: null });
                } else if (s.v.formula) {
                    // 公式：照 Excel 規則做相對位移
                    const dr = tr_ - s.r, dc = tc_ - s.c;
                    const shifted = typeof shiftFormula === 'function' ? shiftFormula(s.v.formula, dr, dc) : s.v.formula;
                    writeCell(tr_, tc_, { text: shifted, formula: shifted });
                } else {
                    writeCell(tr_, tc_, { text: s.v.text, formula: null });
                }
            }
        }
        finishFill(src, target);
        showToast(`✅ 已${MODE_TEXT[mode]}填滿 ${count} 格`);
    }

    function finishFill(src, target) {
        if (typeof updateTableHeaders === 'function') updateTableHeaders();
        if (typeof recalculateAllFormulas === 'function') recalculateAllFormulas();
        if (typeof applyFreeze === 'function') applyFreeze();

        // 選取範圍擴大到「來源 + 填滿區」，和 Excel 一致
        let r0 = src.minR, r1 = src.maxR, c0 = src.minC, c1 = src.maxC;
        if (target.dir === 'down')  r1 = target.to;
        if (target.dir === 'up')    r0 = target.from;
        if (target.dir === 'right') c1 = target.to;
        if (target.dir === 'left')  c0 = target.from;
        lastClickedCell = { r: r0, c: c0 };
        selectedCellBlocks = [{ startR: r0, startC: c0, endR: r1, endC: c1 }];
        selectedRows = []; selectedCols = [];
        applySelectionVisuals();

        if (typeof saveHistoryState === 'function') saveHistoryState();
        else if (typeof debouncedSaveHistory === 'function') debouncedSaveHistory();
    }
})();
}
