const textModeContainer = document.getElementById('textModeContainer');
const tableModeContainer = document.getElementById('tableModeContainer');
const editor = document.getElementById('editor');
const dataTable = document.getElementById('data-table');
const tableControls = document.getElementById('tableControls');
const lineNumbers = document.getElementById('lineNumbers');
const mainContainer = document.getElementById('mainContainer');
const floatingTool = document.getElementById('floating-tool');
const colMenu = document.getElementById('colMenu');
const rowMenu = document.getElementById('rowMenu');
const toast = document.getElementById('toast');
const btnPaste = document.getElementById('btnPaste');
const cellEditor = document.getElementById('cellEditor');

const mirror = document.createElement('div');
mirror.style.position = 'absolute'; mirror.style.visibility = 'hidden';
mirror.style.pointerEvents = 'none'; mirror.style.top = '0'; mirror.style.left = '0';
document.body.appendChild(mirror);

const STORAGE_KEY = 'tauhu-editor-content';
const MODE_KEY = 'tauhu-editor-mode';
const COL_NAMES_KEY = 'tauhu-col-names'; 
const FONT_SIZE_KEY = 'tauhu-font-size';
const LINE_HEIGHT_KEY = 'tauhu-line-height';
const COL_WIDTHS_KEY = 'tauhu-col-widths';
const WORD_WRAP_KEY = 'tauhu-word-wrap'; 
const EDITOR_WIDTH_KEY = 'tauhu-editor-width';
const FREEZE_ROWS_KEY = 'tauhu-freeze-rows';

let currentMode = 'text';

let selectedRows = [];
let selectedCols = [];
let selectedCellBlocks = []; 
let lastClickedCell = null; 
let isSelectionLocked = false;
let isMobileMultiSelect = false;

let activeMenuColIndex = -1;
let activeMenuRowIndex = -1;

let dragType = null;
let dragIndex = -1;

let frozenRowsCount = 0;
let historyStack = [];
let isUndoing = false;
let saveTimeout;

const FONT_FAMILY_KEY = 'tauhu-font-family';

/* 工具列元件初始化 */
function initDropdowns() {
    document.querySelectorAll('.dropdown-container').forEach(container => {
        const btn = container.querySelector('.dropdown-btn');
        const menu = container.querySelector('.dropdown-menu');
        const items = container.querySelectorAll('.dropdown-item');
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => { if (m !== menu) m.classList.remove('show'); });
            menu.classList.toggle('show');
        });

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                items.forEach(i => i.querySelector('.check-icon').classList.remove('active'));
                item.querySelector('.check-icon').classList.add('active');
                menu.classList.remove('show');
                container.dispatchEvent(new CustomEvent('change', { detail: { value: item.dataset.value } }));
            });
        });
    });

    document.querySelectorAll('.action-dropdown .action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = btn.nextElementSibling;
            document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => { if (m !== menu) m.classList.remove('show'); });
            menu.classList.toggle('show');
        });
    });

    document.addEventListener('click', (e) => {
        document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
        if (!e.target.closest('#colMenu') && !e.target.closest('.btn-col-menu')) colMenu.classList.remove('show');
        if (!e.target.closest('#rowMenu') && !e.target.closest('.btn-row-menu')) rowMenu.classList.remove('show');
    });
}

// 行動版多選模式按鈕切換邏輯
const btnToggleMultiSelect = document.getElementById('btnToggleMultiSelect');
if (btnToggleMultiSelect) {
    btnToggleMultiSelect.addEventListener('click', () => {
        isMobileMultiSelect = !isMobileMultiSelect;
        
        // 切換按鈕的外觀 (給予明顯的藍底標示)
        btnToggleMultiSelect.classList.toggle('bg-blue-100', isMobileMultiSelect);
        btnToggleMultiSelect.classList.toggle('text-blue-600', isMobileMultiSelect);
        
        showToast(isMobileMultiSelect ? '✅ 多選模式已啟用' : '❌ 多選模式已關閉');
    });
}
function setDropdownValue(id, value) {
    const container = document.getElementById(id);
    container.querySelectorAll('.dropdown-item').forEach(item => {
        item.querySelector('.check-icon').classList.toggle('active', item.dataset.value === value);
    });
}

/* 系統初始化與記憶設定讀取 */
function init() {
    initDropdowns();
    const savedFont = localStorage.getItem(FONT_FAMILY_KEY);
    if (savedFont) {
        document.documentElement.style.setProperty('--main-font', savedFont);
        setDropdownValue('dd-fontFamily', savedFont);
    }
    const savedWidth = localStorage.getItem(EDITOR_WIDTH_KEY);
    if (savedWidth) {
        mainContainer.style.maxWidth = savedWidth;
        setDropdownValue('dd-editorWidth', savedWidth);
    }

    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    if (savedFontSize) {
        document.documentElement.style.setProperty('--editor-font-size', savedFontSize);
        setDropdownValue('dd-fontSize', savedFontSize);
    }
    const savedLineHeight = localStorage.getItem(LINE_HEIGHT_KEY);
    if (savedLineHeight) {
        document.documentElement.style.setProperty('--editor-line-height', savedLineHeight);
        setDropdownValue('dd-lineHeight', savedLineHeight);
    }
    
    const savedWordWrap = localStorage.getItem(WORD_WRAP_KEY);
    if (savedWordWrap) {
        editor.style.whiteSpace = savedWordWrap;
        document.documentElement.style.setProperty('--table-white-space', savedWordWrap);
        if (savedWordWrap === 'pre') dataTable.classList.add('table-nowrap');
        else dataTable.classList.remove('table-nowrap');
        setDropdownValue('dd-wordWrap', savedWordWrap);
    }

    const savedFreeze = localStorage.getItem(FREEZE_ROWS_KEY);
    if (savedFreeze !== null) {
        frozenRowsCount = parseInt(savedFreeze);
        setDropdownValue('dd-freeze', savedFreeze);
    }

    const savedContent = localStorage.getItem(STORAGE_KEY) || '';
    editor.value = savedContent;
    historyStack.push(savedContent); 
    
    const savedMode = localStorage.getItem(MODE_KEY);
    if (savedMode === 'table') {
        setDropdownValue('dd-viewMode', 'table');
        switchMode('table');
    } else { updateLineNumbers(); }
    
    if (window.ResizeObserver) {
        new ResizeObserver(() => { 
            if (currentMode === 'text') updateLineNumbers(); 
            if (currentMode === 'table' && frozenRowsCount > 0) applyFreeze();
        }).observe(editor.parentElement);
        new ResizeObserver(() => { 
            if (currentMode === 'table') { applyFreeze(); applySelectionVisuals(); }
        }).observe(dataTable);
    }
	/* 初始化排序面板相關 */
	// 初始化排序核取方塊 (預設勾選)
    resetSortHeaderCheckbox();
    
    // 監聽凍結列的下拉選單變更，自動同步排序窗格的核取方塊
    document.getElementById('dd-freeze').addEventListener('change', () => {
        // 當開啟模式時，才會根據目前凍結列數動態設定
        // 這裡只需要一個全域的同步機制即可
    });
}

/* 模式切換 */
document.getElementById('dd-viewMode').addEventListener('change', (e) => switchMode(e.detail.value));

function switchMode(mode) {
    currentMode = mode; localStorage.setItem(MODE_KEY, mode);
    hideFloatingTool(); clearTableSelection();
    document.getElementById('viewModeIcon').textContent = mode === 'table' ? 'table_chart' : 'edit_document';

    if (mode === 'table') {
        renderTableFromText(editor.value);
        applyFreeze();
        textModeContainer.style.display = 'none'; tableModeContainer.style.display = 'block';
        tableControls.classList.remove('hidden'); tableControls.classList.add('flex');
        
        // 切換到表格模式時，重設核取方塊
        resetSortHeaderCheckbox();
    } else {
        editor.value = extractTextFromTable();
        tableModeContainer.style.display = 'none'; textModeContainer.style.display = 'flex';
        tableControls.classList.remove('flex'); tableControls.classList.add('hidden');
        updateLineNumbers();
    }
}

/* 復原系統 (Undo) */
function debouncedSaveHistory() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveHistoryState, 500);
}

function saveHistoryState() {
    if (isUndoing) return;
    const text = currentMode === 'text' ? editor.value : extractTextFromTable();
    if (historyStack.length === 0 || historyStack[historyStack.length - 1] !== text) {
        historyStack.push(text);
        if (historyStack.length > 50) historyStack.shift(); 
    }
}

function triggerUndo() {
    if (historyStack.length <= 1) return showToast('⚠️ 沒有可復原的操作');
    isUndoing = true;
    historyStack.pop(); 
    const previousState = historyStack[historyStack.length - 1];
    
    if (currentMode === 'text') {
        editor.value = previousState;
        updateLineNumbers();
    } else {
        renderTableFromText(previousState);
        applyFreeze();
        clearTableSelection();
    }
    localStorage.setItem(STORAGE_KEY, previousState);
    isUndoing = false;
    showToast('↩️ 已復原');
}

document.getElementById('btnUndo').addEventListener('click', triggerUndo);

/* 自訂互動對話框 */
let confirmCallback = null;
function showConfirm(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = onConfirm;
    document.getElementById('confirmModal').classList.remove('hidden');
}
document.getElementById('btnCancelConfirm').addEventListener('click', () => document.getElementById('confirmModal').classList.add('hidden'));
document.getElementById('btnAcceptConfirm').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    document.getElementById('confirmModal').classList.add('hidden');
});

let promptCallback = null;
function showPrompt(title, defaultValue, onConfirm) {
    document.getElementById('promptTitle').textContent = title;
    const input = document.getElementById('promptInput');
    input.value = defaultValue;
    promptCallback = onConfirm;
    document.getElementById('promptModal').classList.remove('hidden');
    setTimeout(() => { input.focus(); input.select(); }, 50);
}
document.getElementById('btnCancelPrompt').addEventListener('click', () => document.getElementById('promptModal').classList.add('hidden'));
document.getElementById('btnAcceptPrompt').addEventListener('click', () => {
    if (promptCallback) promptCallback(document.getElementById('promptInput').value);
    document.getElementById('promptModal').classList.add('hidden');
});

/* 欄寬與欄位名稱儲存邏輯 */
function saveColNames() {
    const theadThs = dataTable.querySelectorAll('thead th');
    const names = [];
    for (let i = 1; i < theadThs.length; i++) {
        names.push(theadThs[i].dataset.colName || '');
    }
    localStorage.setItem(COL_NAMES_KEY, JSON.stringify(names));
}

function loadColNames() {
    try { return JSON.parse(localStorage.getItem(COL_NAMES_KEY)) || []; } 
    catch(e) { return []; }
}

function saveColWidths() {
    const theadThs = dataTable.querySelectorAll('thead th');
    const widths = [];
    for (let i = 1; i < theadThs.length; i++) {
        widths.push(theadThs[i].style.width || '150px');
    }
    localStorage.setItem(COL_WIDTHS_KEY, JSON.stringify(widths));
}

function loadColWidths() {
    try { return JSON.parse(localStorage.getItem(COL_WIDTHS_KEY)) || []; } 
    catch(e) { return []; }
}

/* 表格 HTML 產生與解析引擎 */
function getColLabel(index) {
    let label = '';
    while (index >= 0) { label = String.fromCharCode(65 + (index % 26)) + label; index = Math.floor(index / 26) - 1; }
    return label;
}

function createThColHTML(index) {
    return `
        <div class="flex justify-between items-center w-full pointer-events-none px-1">
            <span class="col-label mx-auto pointer-events-auto cursor-pointer flex-1 text-center hover:text-blue-600 px-2" title="點擊選取 / 拖曳排序"></span>
            <span class="material-symbols-outlined pointer-events-auto cursor-pointer hover:bg-gray-300 rounded text-gray-500 btn-col-menu" style="font-size: 18px;" title="欄位選項">arrow_drop_down</span>
        </div>
        <div class="resize-handle pointer-events-auto"></div>`;
}

function createThRowHTML(index) {
    return `
        <div class="flex justify-between items-center w-full pointer-events-none px-1">
            <span class="row-label mx-auto pointer-events-auto cursor-pointer flex-1 text-center hover:text-blue-600 px-2" title="點擊選取 / 拖曳排序">${index + 1}</span>
            <span class="material-symbols-outlined pointer-events-auto cursor-pointer hover:bg-gray-300 rounded text-gray-500 btn-row-menu" style="font-size: 18px;" title="列選項">arrow_drop_down</span>
        </div>`;
}

function parseTSV(text) {
    const parsedRows = []; let currentRow = []; let currentCell = ''; let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i]; const nextChar = text[i + 1];
        if (inQuotes) {
            if (char === '"' && nextChar === '"') { currentCell += '"'; i++; }
            else if (char === '"') inQuotes = false; else currentCell += char;
        } else {
            if (char === '"') inQuotes = true;
            else if (char === '\t') { currentRow.push(currentCell); currentCell = ''; }
            else if (char === '\n') { currentRow.push(currentCell); parsedRows.push(currentRow); currentRow = []; currentCell = ''; }
            else if (char === '\r' && nextChar === '\n') { } else if (char !== '\r') currentCell += char;
        }
    }
    currentRow.push(currentCell);
    if (currentRow.length > 0 || currentCell !== '') parsedRows.push(currentRow);
    if (parsedRows.length === 0) parsedRows.push(['']);
    return parsedRows;
}

function renderTableFromText(text) {
    const parsedRows = parseTSV(text);
    let maxCols = 1; parsedRows.forEach(row => { if (row.length > maxCols) maxCols = row.length; });

    const savedNames = loadColNames();
    const savedWidths = loadColWidths();

    let html = '<thead><tr><th class="sticky-corner"></th>';
    for (let i = 0; i < maxCols; i++) { 
        const name = savedNames[i] || '';
        const width = savedWidths[i] || '150px';
        html += `<th class="sticky-top group" data-col="${i}" data-col-name="${name}" style="width: ${width}; min-width: ${width}; max-width: ${width};">${createThColHTML(i)}</th>`; 
    }
    html += '</tr></thead><tbody>';
    
    parsedRows.forEach((row, index) => {
        html += '<tr>';
        html += `<th class="sticky-left group">${createThRowHTML(index)}</th>`;
        for (let i = 0; i < maxCols; i++) {
            const safeText = (row[i] !== undefined ? row[i] : '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            html += `<td><div class="td-inner" contenteditable="true">${safeText}</div></td>`;
        }
        html += '</tr>';
    });
    html += '</tbody>';
    dataTable.innerHTML = html;
    updateTableHeaders();
	recalculateAllFormulas();
}

function extractTextFromTable() {
    if (!dataTable.querySelector('tbody')) return '';
    
    const textLines = Array.from(dataTable.querySelectorAll('tbody tr')).map(row => {
        return Array.from(row.querySelectorAll('.td-inner')).map(cell => {
            // 優先抓取公式，如果沒有公式再抓取畫面上的文字
			let text = cell.hasAttribute('data-formula') ? cell.getAttribute('data-formula') : cell.innerText;
            if (text.endsWith('\n')) text = text.slice(0, -1);
            if (text.includes('"') || text.includes('\n') || text.includes('\t')) return '"' + text.replace(/"/g, '""') + '"';
            return text;
        }).join('\t');
    }).join('\n');

    return textLines;
}

function updateTableHeaders() {
    const theadThs = dataTable.querySelectorAll('thead th');
    for (let i = 1; i < theadThs.length; i++) {
        theadThs[i].dataset.col = i - 1;
        const lbl = theadThs[i].querySelector('.col-label');
        const colName = theadThs[i].dataset.colName;
        if (lbl) {
            lbl.textContent = colName ? `${getColLabel(i - 1)} ${colName}` : getColLabel(i - 1);
        }
    }
    dataTable.querySelectorAll('tbody tr').forEach((tr, index) => {
        const lbl = tr.querySelector('.row-label');
        if (lbl) lbl.textContent = index + 1;
    });
}

/* 凍結列設定 */
document.getElementById('dd-freeze').addEventListener('change', (e) => {
    frozenRowsCount = parseInt(e.detail.value);
    localStorage.setItem(FREEZE_ROWS_KEY, e.detail.value);
    applyFreeze();
});

function applyFreeze() {
    dataTable.querySelectorAll('tbody th, tbody td').forEach(cell => {
        cell.style.position = ''; cell.style.top = ''; cell.style.zIndex = '';
        cell.style.backgroundColor = ''; cell.style.borderBottom = '';
    });

    if (currentMode !== 'table' || frozenRowsCount === 0) return;

    const thead = dataTable.querySelector('thead');
    let currentTop = thead ? thead.getBoundingClientRect().height : 36;

    for (let i = 0; i < frozenRowsCount; i++) {
        const tr = dataTable.querySelectorAll('tbody tr')[i];
        if (!tr) break;

        const th = tr.querySelector('th');
        const tds = tr.querySelectorAll('td');
        const isLastFrozen = (i === frozenRowsCount - 1);
        const borderStyle = isLastFrozen ? '2px solid #94a3b8' : '';

        if (th) {
            th.style.position = 'sticky'; th.style.top = `${currentTop}px`;
            th.style.zIndex = '35'; 
            if(isLastFrozen) th.style.borderBottom = borderStyle;
        }

        tds.forEach(td => {
            td.style.position = 'sticky'; td.style.top = `${currentTop}px`;
            td.style.zIndex = '25'; td.style.backgroundColor = '#f1f5f9';
            if(isLastFrozen) td.style.borderBottom = borderStyle;
        });
        currentTop += tr.getBoundingClientRect().height;
    }
}

/* ---------------------------------
   選單操作功能 (增、刪、複製、清除、命名)
   --------------------------------- */
function insertColAt(index, copyFromIndex = -1, count = 1) {
    for (let c = 0; c < count; c++) {
        const theadTr = dataTable.querySelector('thead tr');
        const newTh = document.createElement('th');
        newTh.className = 'sticky-top group';
        newTh.innerHTML = createThColHTML(0);
        
        if (copyFromIndex !== -1) {
            const originalTh = theadTr.children[copyFromIndex + 1];
            if (originalTh && originalTh.dataset.colName) newTh.dataset.colName = originalTh.dataset.colName;
            if (originalTh) {
                newTh.style.width = originalTh.style.width;
                newTh.style.minWidth = originalTh.style.minWidth;
                newTh.style.maxWidth = originalTh.style.maxWidth;
            }
        } else {
            newTh.style.width = '150px';
            newTh.style.minWidth = '150px';
            newTh.style.maxWidth = '150px';
        }

        theadTr.insertBefore(newTh, theadTr.children[index + 1] || null);
        
        dataTable.querySelectorAll('tbody tr').forEach(tr => {
            const newTd = document.createElement('td');
            const inner = document.createElement('div');
            inner.className = 'td-inner';
            inner.contentEditable = "true";
            if (copyFromIndex !== -1 && tr.children[copyFromIndex + 1]) {
                const copyInner = tr.children[copyFromIndex + 1].querySelector('.td-inner');
                if (copyInner) inner.innerHTML = copyInner.innerHTML;
            }
            newTd.appendChild(inner);
            tr.insertBefore(newTd, tr.children[index + 1] || null);
        });
    }
    updateTableHeaders(); localStorage.setItem(STORAGE_KEY, extractTextFromTable());
    saveColNames(); saveColWidths(); saveHistoryState(); applyFreeze();
}

function insertRowAt(index, copyFromIndex = -1, count = 1) {
    const tbody = dataTable.querySelector('tbody');
    const colCount = tbody.querySelector('tr')?.querySelectorAll('td').length || 1;
    
    for (let c = 0; c < count; c++) {
        const newRow = document.createElement('tr');
        const newTh = document.createElement('th');
        newTh.className = 'sticky-left group';
        newTh.innerHTML = createThRowHTML(0);
        newRow.appendChild(newTh);
            
        for(let i = 0; i < colCount; i++) {
            const newTd = document.createElement('td');
            const inner = document.createElement('div');
            inner.className = 'td-inner';
            inner.contentEditable = "true";
            if (copyFromIndex !== -1 && tbody.children[copyFromIndex]) {
                const copyInner = tbody.children[copyFromIndex].querySelectorAll('.td-inner')[i];
                if (copyInner) inner.innerHTML = copyInner.innerHTML;
            }
            newTd.appendChild(inner);
            newRow.appendChild(newTd);
        }
        tbody.insertBefore(newRow, tbody.children[index] || null);
    }
    updateTableHeaders(); localStorage.setItem(STORAGE_KEY, extractTextFromTable());
    saveHistoryState(); applyFreeze();
}



/* 智慧清除與刪除 */
function handleClearAction() {
    if (selectedRows.length > 0) clearSelectedRows();
    else if (selectedCols.length > 0) clearSelectedCols();
    else if (selectedCellBlocks.length > 0) clearSelectedCells();
    else showToast('請先選取要清除的範圍');
}

function handleDeleteAction() {
    if (selectedRows.length > 0) deleteSelectedRows();
    else if (selectedCols.length > 0) deleteSelectedCols();
    else if (selectedCellBlocks.length > 0) {
        clearSelectedCells();
        showToast('儲存格僅能清除資料，無法刪除結構');
    } else {
        showToast('請先選取要刪除的列或欄');
    }
}

function clearSelectedCols() {
    if (selectedCols.length === 0) return;
    dataTable.querySelectorAll('tbody tr').forEach(tr => {
        selectedCols.forEach(idx => { 
            const inner = tr.children[idx + 1]?.querySelector('.td-inner');
            if (inner) {
                inner.innerHTML = ''; 
                // 新增這行：確實清除背後的公式標記
                inner.removeAttribute('data-formula'); 
            }
        });
    });
    localStorage.setItem(STORAGE_KEY, extractTextFromTable()); saveHistoryState(); showToast('🗑️ 選定欄資料清潔溜溜');
}

function deleteSelectedCols() {
    if (selectedCols.length === 0) return;
    const tbody = dataTable.querySelector('tbody');
    const currentCols = tbody.children[0].children.length - 1;
    if (currentCols - selectedCols.length < 1) return showToast('⚠️ 至少需保留一欄！');
    
    const sorted = [...selectedCols].sort((a,b) => b - a);
    sorted.forEach(idx => {
        const th = dataTable.querySelector(`thead th[data-col="${idx}"]`);
        if (th) th.remove();
        dataTable.querySelectorAll('tbody tr').forEach(tr => { if (tr.children[idx + 1]) tr.children[idx + 1].remove(); });
    });
    clearTableSelection(); updateTableHeaders(); localStorage.setItem(STORAGE_KEY, extractTextFromTable()); 
    saveColNames(); saveColWidths(); saveHistoryState(); applyFreeze(); showToast('🗑️ 欄已刪除');
}

function clearSelectedRows() {
    if (selectedRows.length === 0) return;
    const tbody = dataTable.querySelector('tbody');
    selectedRows.forEach(idx => { 
        if (tbody.children[idx]) {
            tbody.children[idx].querySelectorAll('.td-inner').forEach(inner => {
                inner.innerHTML = '';
                // 新增這行：確實清除背後的公式標記
                inner.removeAttribute('data-formula');
            });
        }
    });
    localStorage.setItem(STORAGE_KEY, extractTextFromTable()); saveHistoryState(); showToast('🗑️ 選定列資料已清除');
}

function deleteSelectedRows() {
    if (selectedRows.length === 0) return;
    const tbody = dataTable.querySelector('tbody');
    if (tbody.children.length - selectedRows.length < 1) return showToast('⚠️ 至少需保留一列！');
    
    const sorted = [...selectedRows].sort((a,b) => b - a);
    sorted.forEach(idx => { if (tbody.children[idx]) tbody.children[idx].remove(); });
    
    clearTableSelection(); updateTableHeaders(); localStorage.setItem(STORAGE_KEY, extractTextFromTable()); saveHistoryState(); applyFreeze(); showToast('🗑️ 列已刪除');
}

function clearSelectedCells() {
    if (selectedCellBlocks.length === 0) return;
    const rows = dataTable.querySelectorAll('tbody tr');
    
    selectedCellBlocks.forEach(block => {
        const minR = Math.min(block.startR, block.endR);
        const maxR = Math.max(block.startR, block.endR);
        const minC = Math.min(block.startC, block.endC);
        const maxC = Math.max(block.startC, block.endC);

        for (let r = minR; r <= maxR; r++) {
            const row = rows[r]; if (!row) continue;
            for (let c = minC; c <= maxC; c++) {
                const inner = row.children[c + 1]?.querySelector('.td-inner');
                if (inner) {
                    inner.innerHTML = '';
                    // 新增這行：確實清除背後的公式標記
                    inner.removeAttribute('data-formula');
                }
            }
        }
    });
    localStorage.setItem(STORAGE_KEY, extractTextFromTable()); debouncedSaveHistory(); showToast('🗑️ 儲存格資料已清除');
}

colMenu.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const action = btn.dataset.action;
    
    if (action === 'rename') {
        const th = dataTable.querySelector(`thead th[data-col="${activeMenuColIndex}"]`);
        const currentName = th.dataset.colName || '';
        showPrompt('命名此欄 (留空則清除名稱)', currentName, (val) => {
            th.dataset.colName = val.trim();
            updateTableHeaders();
            saveColNames();
        });
    }
    if (action === 'add-left') insertColAt(activeMenuColIndex);
    if (action === 'add-right') insertColAt(activeMenuColIndex + 1);
    if (action === 'duplicate') insertColAt(activeMenuColIndex + 1, activeMenuColIndex);
    if (action === 'clear') {
        if (!selectedCols.includes(activeMenuColIndex)) selectTableColumn(activeMenuColIndex, false, false);
        handleClearAction();
    }
    if (action === 'delete') {
        if (!selectedCols.includes(activeMenuColIndex)) selectTableColumn(activeMenuColIndex, false, false);
        handleDeleteAction();
    }
    colMenu.classList.remove('show');
});

rowMenu.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'add-above') insertRowAt(activeMenuRowIndex);
    if (action === 'add-below') insertRowAt(activeMenuRowIndex + 1);
    if (action === 'duplicate') insertRowAt(activeMenuRowIndex + 1, activeMenuRowIndex);
    if (action === 'clear') {
        if (!selectedRows.includes(activeMenuRowIndex)) selectTableRow(activeMenuRowIndex, false, false);
        handleClearAction();
    }
    if (action === 'delete') {
        if (!selectedRows.includes(activeMenuRowIndex)) selectTableRow(activeMenuRowIndex, false, false);
        handleDeleteAction();
    }
    rowMenu.classList.remove('show');
});

function insertRowsFromTop(count) {
    const tbody = dataTable.querySelector('tbody');
    insertRowAt(tbody ? tbody.children.length : 0, -1, count);
    tableModeContainer.scrollTop = tableModeContainer.scrollHeight; 
}
function promptInsertRows() { showPrompt('輸入新增列數', '5', (val) => { const count = parseInt(val); if (count > 0) insertRowsFromTop(count); }); }

function insertColsFromTop(count) {
    const thead = dataTable.querySelector('thead tr');
    insertColAt(thead ? thead.children.length - 1 : 0, -1, count);
    tableModeContainer.scrollLeft = tableModeContainer.scrollWidth; 
}
function promptInsertCols() { showPrompt('輸入新增欄數', '5', (val) => { const count = parseInt(val); if (count > 0) insertColsFromTop(count); }); }

/* ---------------------------------
   多選與剪貼簿核心功能 (外圍藍框實作)
   --------------------------------- */
function applySelectionVisuals() {
    const headers = dataTable.querySelectorAll('thead th');
    const rows = dataTable.querySelectorAll('tbody tr');
    
    headers.forEach(h => h.classList.remove('selected-header'));
    rows.forEach(r => r.querySelector('th')?.classList.remove('selected-header'));

    selectedCols.forEach(colIndex => { if(headers[colIndex + 1]) headers[colIndex + 1].classList.add('selected-header'); });
    rows.forEach((row, rIdx) => { if (selectedRows.includes(rIdx)) row.querySelector('th')?.classList.add('selected-header'); });

    const R = rows.length;
    const C = headers.length - 1;
    let sel = Array(R).fill().map(() => Array(C).fill(false));
    let totalSelectedCells = 0;

    selectedRows.forEach(r => {
        if(r >= 0 && r < R) {
            for(let c=0; c<C; c++) { if(!sel[r][c]) { sel[r][c] = true; totalSelectedCells++; } }
        }
    });
    selectedCols.forEach(c => {
        if(c >= 0 && c < C) {
            for(let r=0; r<R; r++) { if(!sel[r][c]) { sel[r][c] = true; totalSelectedCells++; } }
        }
    });
    selectedCellBlocks.forEach(block => {
        const minR = Math.max(0, Math.min(block.startR, block.endR));
        const maxR = Math.min(R - 1, Math.max(block.startR, block.endR));
        const minC = Math.max(0, Math.min(block.startC, block.endC));
        const maxC = Math.min(C - 1, Math.max(block.startC, block.endC));

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                if (!sel[r][c]) { sel[r][c] = true; totalSelectedCells++; }
            }
        }
    });

    const isMulti = totalSelectedCells > 1;

    // 動態產生外圍框線 (Inset Box-Shadow) 與底色
    for (let r = 0; r < R; r++) {
        const row = rows[r];
        if (!row) continue;
        for (let c = 0; c < C; c++) {
            const td = row.children[c + 1];
            if (!td) continue;

            if (sel[r][c]) {
                let top = (r === 0 || !sel[r - 1][c]) ? '2px' : '0';
                let bottom = (r === R - 1 || !sel[r + 1][c]) ? '-2px' : '0';
                let left = (c === 0 || !sel[r][c - 1]) ? '2px' : '0';
                let right = (c === C - 1 || !sel[r][c + 1]) ? '-2px' : '0';
                
                let shadows = [];
                if (top !== '0') shadows.push(`inset 0 ${top} 0 0 #93c5fd`);
                if (bottom !== '0') shadows.push(`inset 0 ${bottom} 0 0 #93c5fd`);
                if (left !== '0') shadows.push(`inset ${left} 0 0 0 #93c5fd`);
                if (right !== '0') shadows.push(`inset ${right} 0 0 0 #93c5fd`);
                
                td.style.boxShadow = shadows.join(', ');
                if (isMulti) td.classList.add('sel-bg');
                else td.classList.remove('sel-bg');
            } else {
                td.style.boxShadow = '';
                td.classList.remove('sel-bg');
            }
        }
    }
}

function clearTableSelection(resetArrays = true) {
    if (resetArrays) {
        selectedRows = []; selectedCols = [];
        lastSelectedRowIndex = -1; lastSelectedColIndex = -1;
        selectedCellBlocks = []; lastClickedCell = null;
    }
    applySelectionVisuals();
}

// 全選表格功能 ======
function selectAllTable() {
    // 1. 先清除目前的選取狀態
    clearTableSelection(true); 

    const tbody = dataTable.querySelector('tbody');
    const theadTr = dataTable.querySelector('thead tr');

    if (!tbody || !theadTr) return;

    // 2. 取得表格目前的總列數與總欄數
    const rowCount = tbody.children.length;
    // 扣除最左側用來顯示數字的標題欄
    const colCount = theadTr.children.length - 1; 

    // 3. 將所有的列加入選取陣列
    for (let i = 0; i < rowCount; i++) {
        selectedRows.push(i);
    }

    // 4. 將所有的欄加入選取陣列
    for (let i = 0; i < colCount; i++) {
        selectedCols.push(i);
    }

    // 5. 更新畫面，畫上選取框與底色
    applySelectionVisuals();
}

function selectTableColumn(colIndex, isShift = false, isCtrl = false) {
    if (isShift && lastSelectedColIndex !== -1) {
        const start = Math.min(lastSelectedColIndex, colIndex);
        const end = Math.max(lastSelectedColIndex, colIndex);
        if (!isCtrl) clearTableSelection(true); 
        for (let i = start; i <= end; i++) { if (!selectedCols.includes(i)) selectedCols.push(i); }
    } else if (isCtrl) {
        if (selectedCols.includes(colIndex)) selectedCols = selectedCols.filter(i => i !== colIndex);
        else selectedCols.push(colIndex);
        lastSelectedColIndex = colIndex;
    } else {
        clearTableSelection(true);
        selectedCols.push(colIndex);
        lastSelectedColIndex = colIndex;
    }
    applySelectionVisuals();
}

function selectTableRow(rowIndex, isShift = false, isCtrl = false) {
    if (isShift && lastSelectedRowIndex !== -1) {
        const start = Math.min(lastSelectedRowIndex, rowIndex);
        const end = Math.max(lastSelectedRowIndex, rowIndex);
        if (!isCtrl) clearTableSelection(true);
        for (let i = start; i <= end; i++) { if (!selectedRows.includes(i)) selectedRows.push(i); }
    } else if (isCtrl) {
        if (selectedRows.includes(rowIndex)) selectedRows = selectedRows.filter(i => i !== rowIndex);
        else selectedRows.push(rowIndex);
        lastSelectedRowIndex = rowIndex;
    } else {
        clearTableSelection(true);
        selectedRows.push(rowIndex);
        lastSelectedRowIndex = rowIndex;
    }
    applySelectionVisuals();
}

function isCellInAnyBlock(r, c) {
    return selectedCellBlocks.some(b => {
        const minR = Math.min(b.startR, b.endR); const maxR = Math.max(b.startR, b.endR);
        const minC = Math.min(b.startC, b.endC); const maxC = Math.max(b.startC, b.endC);
        return r >= minR && r <= maxR && c >= minC && c <= maxC;
    });
}

function copySelectedTableData() {
    let copyText = "";
    // 新增：記錄複製起點，方便貼上時計算偏移量
    window.clipboardOrigin = null; 

    if (selectedRows.length > 0) {
        const sortedRows = [...selectedRows].sort((a,b) => a - b);
        window.clipboardOrigin = { r: sortedRows[0], c: 0 };
        const rows = dataTable.querySelectorAll('tbody tr');
        copyText = sortedRows.map(idx => {
            if (!rows[idx]) return '';
            return Array.from(rows[idx].querySelectorAll('.td-inner')).map(c => {
                // 優先抓公式，沒有才抓文字
                return c.hasAttribute('data-formula') ? c.getAttribute('data-formula') : c.innerText.replace(/\n$/, '');
            }).join('\t');
        }).join('\n');
    } else if (selectedCols.length > 0) {
        const sortedCols = [...selectedCols].sort((a,b) => a - b);
        window.clipboardOrigin = { r: 0, c: sortedCols[0] };
        const rows = Array.from(dataTable.querySelectorAll('tbody tr'));
        copyText = rows.map(row => {
            return sortedCols.map(colIdx => {
                const inner = row.children[colIdx + 1]?.querySelector('.td-inner');
                let t = inner ? (inner.hasAttribute('data-formula') ? inner.getAttribute('data-formula') : inner.innerText.replace(/\n$/, '')) : '';
                if (t.includes('"') || t.includes('\n') || t.includes('\t')) t = '"' + t.replace(/"/g, '""') + '"';
                return t;
            }).join('\t');
        }).join('\n');
    } else if (selectedCellBlocks.length > 0) {
        let gMinR = Infinity, gMaxR = -1, gMinC = Infinity, gMaxC = -1;
        selectedCellBlocks.forEach(b => {
            gMinR = Math.min(gMinR, b.startR, b.endR); gMaxR = Math.max(gMaxR, b.startR, b.endR);
            gMinC = Math.min(gMinC, b.startC, b.endC); gMaxC = Math.max(gMaxC, b.startC, b.endC);
        });
        
        window.clipboardOrigin = { r: gMinR, c: gMinC };

        const rows = dataTable.querySelectorAll('tbody tr');
        const lines = [];
        for (let r = gMinR; r <= gMaxR; r++) {
            const row = rows[r]; if (!row) continue;
            const rowData = [];
            for (let c = gMinC; c <= gMaxC; c++) {
                if (isCellInAnyBlock(r, c)) {
                    const inner = row.children[c + 1]?.querySelector('.td-inner');
                    let t = inner ? (inner.hasAttribute('data-formula') ? inner.getAttribute('data-formula') : inner.innerText.replace(/\n$/, '')) : '';
                    if (t.includes('"') || t.includes('\n') || t.includes('\t')) t = '"' + t.replace(/"/g, '""') + '"';
                    rowData.push(t);
                } else {
                    rowData.push(''); 
                }
            }
            lines.push(rowData.join('\t'));
        }
        copyText = lines.join('\n');
    }
    
    try {
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(copyText).then(() => showToast('✅ 選定內容已複製！'));
        else {
            const ta = document.createElement('textarea'); ta.value = copyText; document.body.appendChild(ta);
            ta.select(); document.execCommand('copy'); document.body.removeChild(ta); showToast('✅ 選定內容已複製！');
        }
    } catch (err) { showToast('❌ 複製失敗'); }
}

/* 智慧貼上分配引擎 */
function handleTablePaste(text) {
    const data = parseTSV(text);
    if (data.length === 0 || (data.length === 1 && data[0].length === 0)) return;

    let startRow = 0; let startCol = 0;
    
    // 取得目前游標所在的儲存格
    const activeInner = document.activeElement.closest('.td-inner');

   if (activeInner) {
        activeInner.blur();
    }

    let isMultiTarget = false;
    let targetBlocks = selectedCellBlocks;

    if (selectedRows.length > 0) { startRow = Math.min(...selectedRows); startCol = 0; } 
    else if (selectedCols.length > 0) { startRow = 0; startCol = Math.min(...selectedCols); } 
    else if (selectedCellBlocks.length > 0) {
        startRow = Math.min(selectedCellBlocks[0].startR, selectedCellBlocks[0].endR); 
        startCol = Math.min(selectedCellBlocks[0].startC, selectedCellBlocks[0].endC);
        // 判斷使用者是否選取了大於一格的範圍
        if (selectedCellBlocks.length > 1 || selectedCellBlocks[0].startR !== selectedCellBlocks[0].endR || selectedCellBlocks[0].startC !== selectedCellBlocks[0].endC) {
            isMultiTarget = true;
        }
    } else if (activeInner && dataTable.contains(activeInner)) {
        const tr = activeInner.closest('tr');
        startRow = Array.from(tr.parentNode.children).indexOf(tr);
        startCol = Array.from(tr.children).indexOf(activeInner.closest('td')) - 1; 
    }

    const tbody = dataTable.querySelector('tbody');
    const theadTr = dataTable.querySelector('thead tr');
    
    // 獨立處理器：負責填入資料並計算平移偏移量
    const applyPastedCell = (inner, cellData, targetR, targetC) => {
        if (cellData.startsWith('=') && window.clipboardOrigin) {
            let rowOffset = targetR - window.clipboardOrigin.r;
            let colOffset = targetC - window.clipboardOrigin.c;
            let shiftedFormula = shiftFormula(cellData, rowOffset, colOffset);
            inner.setAttribute('data-formula', shiftedFormula);
            inner.innerText = shiftedFormula; // 等等會被全域重算更新
        } else {
            if (cellData.startsWith('=')) inner.setAttribute('data-formula', cellData);
            else inner.removeAttribute('data-formula');
            inner.innerText = cellData;
        }
    };

    // 【情境一】：剪貼簿只有 1 格，但使用者選取了多格 -> 啟動填滿模式
    if (data.length === 1 && data[0].length === 1 && isMultiTarget) {
        const sourceText = data[0][0];
        targetBlocks.forEach(block => {
            const minR = Math.min(block.startR, block.endR); const maxR = Math.max(block.startR, block.endR);
            const minC = Math.min(block.startC, block.endC); const maxC = Math.max(block.startC, block.endC);

            for (let r = minR; r <= maxR; r++) {
                const rowElem = tbody.children[r]; if (!rowElem) continue;
                for (let c = minC; c <= maxC; c++) {
                    const inner = rowElem.children[c + 1]?.querySelector('.td-inner');
                    if (inner) applyPastedCell(inner, sourceText, r, c);
                }
            }
        });
    } else {
        // 【情境二】：一般貼上 (自動擴充表格並對應貼上)
        const rowsNeeded = startRow + data.length;
        while (tbody.children.length < rowsNeeded) { insertRowAt(tbody.children.length); }

        let maxColsNeeded = startCol;
        data.forEach(r => { if (startCol + r.length > maxColsNeeded) maxColsNeeded = startCol + r.length; });
        const currentCols = theadTr.children.length - 1;
        if (maxColsNeeded > currentCols) { insertColAt(currentCols, -1, maxColsNeeded - currentCols); }

        for (let r = 0; r < data.length; r++) {
            const rowElem = tbody.children[startRow + r];
            for (let c = 0; c < data[r].length; c++) {
                const inner = rowElem.children[startCol + c + 1]?.querySelector('.td-inner');
                if (inner) applyPastedCell(inner, data[r][c], startRow + r, startCol + c);
            }
        }
    }

    updateTableHeaders();
    // 貼上後觸發我們上次做的全域重算，所有貼上的公式會立刻變成數字！
    recalculateAllFormulas(); 
    localStorage.setItem(STORAGE_KEY, extractTextFromTable());
    debouncedSaveHistory(); applyFreeze();
}

/* ---------------------------------
   獨立儲存格編輯器 (不換行模式專用)
   --------------------------------- */
let activeEditorTd = null;
function openCellEditor(td) {
    activeEditorTd = td;
    const inner = td.querySelector('.td-inner');
    const rect = td.getBoundingClientRect();
    const editor = document.getElementById('cellEditor');
    const overlay = document.getElementById('cellEditorOverlay');
    
    editor.value = inner ? inner.innerText : '';
    
    // 同步基礎字體與行高樣式
    editor.style.fontFamily = window.getComputedStyle(dataTable).fontFamily;
    editor.style.fontSize = window.getComputedStyle(dataTable).fontSize;
    editor.style.lineHeight = window.getComputedStyle(dataTable).lineHeight;
    editor.style.padding = '0.5rem 0.75rem';

    overlay.classList.remove('hidden');
    editor.classList.remove('hidden');

    // 給予編輯器合理舒適的預設大小
    let idealWidth = Math.max(rect.width, 350);
    editor.style.width = `${idealWidth}px`;
    editor.style.height = '1px'; // to measure properly
    
    // 稍等一幀確保 computed style 完成
    setTimeout(() => {
        let contentHeight = editor.scrollHeight;
        let idealHeight = Math.max(120, Math.min(contentHeight + 20, window.innerHeight * 0.6));

        let left = rect.left;
        let top = rect.top;

        if (left + idealWidth > window.innerWidth) left = Math.max(10, window.innerWidth - idealWidth - 20);
        
        if (top + idealHeight > window.innerHeight) {
            top = rect.bottom - idealHeight;
            if (top < 10) top = 10;
        }

        editor.style.left = `${left}px`;
        editor.style.top = `${top}px`;
        editor.style.height = `${idealHeight}px`;

        editor.focus();
        editor.setSelectionRange(0, 0); // 游標強制回到最前方
        editor.scrollTop = 0;
    }, 0);
}

function closeCellEditor(save = true) {
    const editor = document.getElementById('cellEditor');
    const overlay = document.getElementById('cellEditorOverlay');
    if (activeEditorTd && save && !editor.classList.contains('hidden')) {
        const inner = activeEditorTd.querySelector('.td-inner');
        if (inner) inner.innerText = editor.value;
        localStorage.setItem(STORAGE_KEY, extractTextFromTable());
        debouncedSaveHistory();
    }
    editor.classList.add('hidden');
    overlay.classList.add('hidden');
    activeEditorTd = null;
}

document.getElementById('cellEditorOverlay').addEventListener('click', () => closeCellEditor(true));

/* 鍵盤與剪貼簿事件監聽 */
/* 鍵盤與剪貼簿事件監聽 */
document.addEventListener('keydown', (e) => {
    // 攔截 Ctrl+F 快捷鍵
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        document.getElementById('findReplaceModal').classList.toggle('hidden');
        if (!document.getElementById('findReplaceModal').classList.contains('hidden')) {
            document.getElementById('findInput').focus();
            document.getElementById('findInput').select();
        }
        return;
    }

    if (currentMode === 'table' && (e.key === 'Delete' || e.key === 'Backspace')) {
        // [修正關鍵] 將輸入框判斷移到最前面：只要發現正在輸入框內打字或刪除，絕對不觸發表格結構刪除
        const isInput = e.target.closest('input, textarea, .td-inner');
        if (isInput) return;

        // 忽略文字編輯器或對話框內的操作
        if (!document.getElementById('promptModal').classList.contains('hidden') ||
            !document.getElementById('confirmModal').classList.contains('hidden') ||
            !document.getElementById('cellEditor').classList.contains('hidden') ||
            !document.getElementById('findReplaceModal').classList.contains('hidden')) {
            return;
        }
        
        const isMultiSelect = selectedRows.length > 0 || selectedCols.length > 0 || selectedCellBlocks.length > 1 || (selectedCellBlocks.length === 1 && (selectedCellBlocks[0].startR !== selectedCellBlocks[0].endR || selectedCellBlocks[0].startC !== selectedCellBlocks[0].endC));
        
        if (isMultiSelect) { 
            e.preventDefault(); 
            handleClearAction(); 
            return; 
        }

        if (selectedCellBlocks.length === 1 && selectedCellBlocks[0].startR === selectedCellBlocks[0].endR && selectedCellBlocks[0].startC === selectedCellBlocks[0].endC) {
            const activeInner = document.activeElement.closest('.td-inner');
            if (!activeInner) {
                e.preventDefault(); handleClearAction();
            }
        }
    }
});

document.addEventListener('copy', (e) => {
    // 1. 檢查使用者是否有「反白」選取文字
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
        // 2. 如果焦點正在儲存格內 (.td-inner) 或獨立編輯器內，直接 return，讓瀏覽器複製反白的文字
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.classList.contains('td-inner') || activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            return; 
        }
    }

    // 3. 原有邏輯：當沒有反白文字時，才攔截預設行為並複製選取的「整個儲存格」
    if (currentMode === 'table' && (selectedRows.length > 0 || selectedCols.length > 0 || selectedCellBlocks.length > 0)) { 
        e.preventDefault(); 
        copySelectedTableData(); 
    }
});

// 順便補上工具列「複製按鈕」的點擊觸發機制 (確保點擊上方工具列也能運作)
const btnCopyElement = document.getElementById('btnCopy');
if (btnCopyElement) {
    btnCopyElement.addEventListener('click', () => {
        document.execCommand('copy');
    });
}

btnPaste.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (currentMode === 'text') {
            editor.focus(); document.execCommand('insertText', false, text);
        } else {
            const data = parseTSV(text);
            if (data.length > 1 || (data[0] && data[0].length > 1) || selectedRows.length > 0 || selectedCols.length > 0 || selectedCellBlocks.length > 0) {
                handleTablePaste(text);
            } else {
                const activeInner = document.activeElement.closest('.td-inner');
                if (activeInner && dataTable.contains(activeInner)) {
                    activeInner.focus(); document.execCommand('insertText', false, text); debouncedSaveHistory();
                } else { handleTablePaste(text); }
            }
        }
        showToast('✅ 內容已貼上！');
    } catch (e) { showToast('❌ 無法讀取剪貼簿，請直接在畫面中按 Ctrl+V'); }
});

document.addEventListener('paste', (e) => {
    // 只有在表格模式下才處理
    if (currentMode !== 'table') return;

    const activeEl = document.activeElement;
    const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    const isCellEditor = activeEl && activeEl.id === 'cellEditor';
    const isInsideTdInner = activeEl && activeEl.classList.contains('td-inner');

    // 如果焦點在其他輸入框 (例如：尋找與取代輸入框)，不攔截，放行原生貼上
    if (isInput && !isCellEditor) return;

    const text = (e.originalEvent || e).clipboardData.getData('text/plain');
    if (!text) return;
    
    const data = parseTSV(text);

    // 新增：判斷是否有多選範圍 (大於一格的選取)
    const isMultiSelect = selectedRows.length > 0 || selectedCols.length > 0 || 
                          selectedCellBlocks.length > 1 || 
                          (selectedCellBlocks.length === 1 && (selectedCellBlocks[0].startR !== selectedCellBlocks[0].endR || selectedCellBlocks[0].startC !== selectedCellBlocks[0].endC));

    // 【情境 1 修正】如果游標正在儲存格文字內 (或使用獨立編輯器)，且貼上的只是單筆文字，
    // 「並且沒有選取多個儲存格 (!isMultiSelect)」，才放行原生行為(插入在游標處)
    if ((isInsideTdInner || isCellEditor) && data.length <= 1 && (!data[0] || data[0].length <= 1) && !isMultiSelect) {
        return;
    }

    // 【情境 2】只要有多選儲存格，或是貼上多筆資料 -> 強制接管並執行自動填滿/覆蓋
    if (isMultiSelect || data.length > 1 || (data[0] && data[0].length > 1) || selectedCellBlocks.length > 0) {
        e.preventDefault();
        handleTablePaste(text); // 透過此函數覆寫或填滿選取範圍
        
        // 如果目前正在用浮動編輯器，貼上後應將其關閉
        if (isCellEditor) {
            closeCellEditor(false);
        }
    }
});

dataTable.addEventListener('input', () => { 
    localStorage.setItem(STORAGE_KEY, extractTextFromTable()); hideFloatingTool(); debouncedSaveHistory(); applyFreeze();
});

/* 滑鼠點擊選取與選單邏輯 */
dataTable.addEventListener('click', (e) => {
    const btnColMenu = e.target.closest('.btn-col-menu');
    if (btnColMenu) {
        const th = btnColMenu.closest('th'); activeMenuColIndex = parseInt(th.dataset.col);
        const rect = th.getBoundingClientRect();
        colMenu.style.left = `${rect.right - 180}px`; colMenu.style.top = `${rect.bottom + 5}px`;
        colMenu.classList.add('show'); rowMenu.classList.remove('show'); return;
    }
    const btnRowMenu = e.target.closest('.btn-row-menu');
    if (btnRowMenu) {
        const th = btnRowMenu.closest('th'); const tr = th.closest('tr'); activeMenuRowIndex = Array.from(tr.parentNode.children).indexOf(tr);
        const rect = th.getBoundingClientRect(); let topPos = rect.top;
        if (topPos + 220 > window.innerHeight) topPos = window.innerHeight - 230; 
        rowMenu.style.left = `${rect.right + 5}px`; rowMenu.style.top = `${topPos}px`;
        rowMenu.classList.add('show'); colMenu.classList.remove('show'); return;
    }

    // 調整過濾邏輯：保留對拖曳控制把手的阻擋
    if (e.target.closest('.resize-handle')) return;

    // 新增：偵測是否點擊左上角全選區塊
    if (e.target.closest('th.sticky-corner')) {
        // 如果目前處於「鎖定選取」狀態，則不執行全選
        if (isSelectionLocked) return; 
        
        selectAllTable();
        return; // 執行完畢後直接結束，不繼續往後判斷
    }

    const thTop = e.target.closest('th.sticky-top');
    if (thTop && !e.target.closest('.btn-col-menu')) {
        if (isSelectionLocked) return; 
        // 修改：加入 isMobileMultiSelect 判斷
        const isCtrl = e.ctrlKey || e.metaKey || isMobileMultiSelect;
        return selectTableColumn(parseInt(thTop.dataset.col), e.shiftKey, isCtrl);
    }

    const thLeft = e.target.closest('th.sticky-left');
    if (thLeft && !e.target.closest('.btn-row-menu')) {
        if (isSelectionLocked) return; 
        // 修改：加入 isMobileMultiSelect 判斷
        const isCtrl = e.ctrlKey || e.metaKey || isMobileMultiSelect;
        const tr = thLeft.closest('tr');
        return selectTableRow(Array.from(tr.parentNode.children).indexOf(tr), e.shiftKey, isCtrl);
    }

    const td = e.target.closest('td');
    if (td) {
        const tdRect = td.getBoundingClientRect();
        const isClickOnPaddingGap = (e.clientX >= tdRect.right - 12) || (e.clientX <= tdRect.left + 12);
        
        if (isClickOnPaddingGap && document.activeElement && document.activeElement.classList.contains('td-inner')) {
            document.activeElement.blur(); 
        }
        
        const tr = td.closest('tr');
        const rIdx = Array.from(tr.parentNode.children).indexOf(tr);
        const cIdx = Array.from(tr.children).indexOf(td) - 1;

        // 🌟 如果狀態為鎖定，我們攔截後面的選取邏輯，並加入單格高亮提示
        if (isSelectionLocked) {
            
            // 1. 先清除前一次點擊的白底標記 (與尋找取代共用同一個清除邏輯)
            if (window.lastFoundTd) {
                window.lastFoundTd.style.removeProperty('background-color');
                window.lastFoundTd.style.removeProperty('outline');
                window.lastFoundTd.style.removeProperty('outline-offset');
                window.lastFoundTd = null;
            }

            // 2. 判斷點擊的儲存格是否在「目前的選取範圍」內
            const isInsideSelection = selectedRows.includes(rIdx) || 
                                      selectedCols.includes(cIdx) || 
                                      isCellInAnyBlock(rIdx, cIdx);
            
            // 3. 如果在選取範圍內，為該格加上白底藍框
            if (isInsideSelection) {
                td.style.setProperty('background-color', '#ffffff', 'important');
                td.style.setProperty('outline', '2px solid #93c5fd', 'important');
                td.style.setProperty('outline-offset', '-2px', 'important');
                window.lastFoundTd = td; // 記錄下來，下次點擊時才能自動清除
            }

            // 4. 處理獨立編輯器的開啟 (維持原功能)
            if (dataTable.classList.contains('table-nowrap') && !e.shiftKey && !e.ctrlKey && !e.metaKey && !isClickOnPaddingGap) {
                openCellEditor(td);
            }
            
            return; // 提早結束，防止原本的選取範圍被清空
        }
		// 修改：統一把 Ctrl 判斷提取出來
        const isCtrl = e.ctrlKey || e.metaKey || isMobileMultiSelect;

        if (e.shiftKey && lastClickedCell) {
            if (selectedCellBlocks.length === 0) {
                selectedCellBlocks.push({ startR: lastClickedCell.r, startC: lastClickedCell.c, endR: rIdx, endC: cIdx });
            } else {
                const lastBlock = selectedCellBlocks[selectedCellBlocks.length - 1];
                lastBlock.endR = rIdx; lastBlock.endC = cIdx;
            }
            if (!isCtrl) { // 修改這裡
                selectedCellBlocks = [selectedCellBlocks[selectedCellBlocks.length - 1]];
                selectedRows = []; selectedCols = [];
            }
            applySelectionVisuals(); window.getSelection().removeAllRanges();
        } else if (isCtrl) { // 修改這裡
            selectedCellBlocks.push({ startR: rIdx, startC: cIdx, endR: rIdx, endC: cIdx });
            lastClickedCell = { r: rIdx, c: cIdx };
            applySelectionVisuals();
        } else {
            lastClickedCell = { r: rIdx, c: cIdx };
            selectedCellBlocks = [{ startR: rIdx, startC: cIdx, endR: rIdx, endC: cIdx }];
            clearTableSelection(false);
            selectedRows = []; selectedCols = [];
            applySelectionVisuals();
        }

        // 修改：如果不換行模式且沒有按住特殊鍵 (包含多選模式)，點文字才開啟編輯器
        if (dataTable.classList.contains('table-nowrap') && !e.shiftKey && !isCtrl && !isClickOnPaddingGap) {
            openCellEditor(td);
        }
    }
});

// 拖曳排序實作
dataTable.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('col-label') || e.target.classList.contains('row-label')) {
        const th = e.target.closest('th'); if (th) th.setAttribute('draggable', 'true');
    }
});
dataTable.addEventListener('mouseup', () => { dataTable.querySelectorAll('th[draggable="true"]').forEach(th => th.removeAttribute('draggable')); });
dataTable.addEventListener('dragend', (e) => { if (e.target.tagName === 'TH') e.target.removeAttribute('draggable'); });

dataTable.addEventListener('dragstart', (e) => {
    const thTop = e.target.closest('th.sticky-top');
    if (thTop) { dragType = 'col'; dragIndex = parseInt(thTop.dataset.col); return; }
    const thLeft = e.target.closest('th.sticky-left');
    if (thLeft) { dragType = 'row'; const tr = thLeft.closest('tr'); dragIndex = Array.from(tr.parentNode.children).indexOf(tr); }
});

dataTable.addEventListener('dragover', (e) => {
    e.preventDefault();
    dataTable.querySelectorAll('.drag-over-col, .drag-over-row').forEach(el => el.classList.remove('drag-over-col', 'drag-over-row'));
    if (dragType === 'col') {
        const target = e.target.closest('th.sticky-top');
        if (target && !target.classList.contains('sticky-corner')) target.classList.add('drag-over-col');
    } else if (dragType === 'row') {
        const target = e.target.closest('th.sticky-left');
        if (target) target.closest('tr').classList.add('drag-over-row');
    }
});

dataTable.addEventListener('dragleave', (e) => {
    const tgtCol = e.target.closest('th.sticky-top'); if (tgtCol) tgtCol.classList.remove('drag-over-col');
    const tgtRow = e.target.closest('th.sticky-left'); if (tgtRow) tgtRow.closest('tr').classList.remove('drag-over-row');
});

dataTable.addEventListener('drop', (e) => {
    e.preventDefault();
    dataTable.querySelectorAll('.drag-over-col, .drag-over-row').forEach(el => el.classList.remove('drag-over-col', 'drag-over-row'));
    
    if (dragType === 'col') {
        const targetTh = e.target.closest('th.sticky-top');
        if (targetTh && !targetTh.classList.contains('sticky-corner')) {
            const targetIndex = parseInt(targetTh.dataset.col);
            if (targetIndex !== dragIndex) {
                const theadTr = dataTable.querySelector('thead tr'); const thToMove = theadTr.children[dragIndex + 1];
                const refTh = targetIndex > dragIndex ? theadTr.children[targetIndex + 2] : theadTr.children[targetIndex + 1];
                theadTr.insertBefore(thToMove, refTh);
                dataTable.querySelectorAll('tbody tr').forEach(tr => {
                    const tdToMove = tr.children[dragIndex + 1]; const refTd = targetIndex > dragIndex ? tr.children[targetIndex + 2] : tr.children[targetIndex + 1];
                    tr.insertBefore(tdToMove, refTd);
                });
                updateTableHeaders(); localStorage.setItem(STORAGE_KEY, extractTextFromTable()); saveColNames(); saveColWidths(); saveHistoryState(); applyFreeze();
            }
        }
    } else if (dragType === 'row') {
        const targetTh = e.target.closest('th.sticky-left');
        if (targetTh) {
            const tr = targetTh.closest('tr'); const targetIndex = Array.from(tr.parentNode.children).indexOf(tr);
            if (targetIndex !== dragIndex) {
                const tbody = dataTable.querySelector('tbody'); const trToMove = tbody.children[dragIndex];
                const refTr = targetIndex > dragIndex ? tbody.children[targetIndex + 1] : tbody.children[targetIndex];
                tbody.insertBefore(trToMove, refTr);
                updateTableHeaders(); localStorage.setItem(STORAGE_KEY, extractTextFromTable()); saveHistoryState(); applyFreeze();
            }
        }
    }
    dragType = null; dragIndex = -1;
});

// ====== 新增：行動版觸控拖曳排序支援 (欄與列) ======
let touchDragType = null;
let touchDragIndex = -1;
let currentDropTarget = null;
let touchStartTimer = null; 

dataTable.addEventListener('touchstart', (e) => {
    // 確保是按在欄列標籤上
    if (e.target.classList.contains('col-label') || e.target.classList.contains('row-label')) {
        const thTop = e.target.closest('th.sticky-top');
        const thLeft = e.target.closest('th.sticky-left');
        
        // 為了不阻礙使用者原本「點擊選取」或「滑動畫面」的動作，
        // 我們加入長按機制：手指按住 300 毫秒後才視為「開始拖曳」
        touchStartTimer = setTimeout(() => {
            if (thTop) { 
                touchDragType = 'col'; 
                touchDragIndex = parseInt(thTop.dataset.col); 
                showToast('🔄 開始拖曳欄位...');
            } else if (thLeft) { 
                touchDragType = 'row'; 
                const tr = thLeft.closest('tr'); 
                touchDragIndex = Array.from(tr.parentNode.children).indexOf(tr); 
                showToast('🔄 開始拖曳橫列...');
            }
        }, 300);
    }
}, { passive: true });

dataTable.addEventListener('touchmove', (e) => {
    // 如果手指提早滑動（還沒達到長按時間），取消拖曳判定，讓畫面正常滾動
    if (!touchDragType) {
        clearTimeout(touchStartTimer);
        return;
    }
    
    e.preventDefault(); // 確認開始拖曳後，阻止畫面跟著滾動
    const touch = e.touches[0];
    
    // 取得手指目前位置下方的元素 (模擬 hover 效果)
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetElement) return;

    // 清除舊的高亮標記
    dataTable.querySelectorAll('.drag-over-col, .drag-over-row').forEach(el => el.classList.remove('drag-over-col', 'drag-over-row'));
    currentDropTarget = null;

    // 依照拖曳類型加上新的高亮標記
    if (touchDragType === 'col') {
        const targetTh = targetElement.closest('th.sticky-top');
        if (targetTh && !targetTh.classList.contains('sticky-corner')) {
            targetTh.classList.add('drag-over-col');
            currentDropTarget = targetTh;
        }
    } else if (touchDragType === 'row') {
        const targetTh = targetElement.closest('th.sticky-left');
        if (targetTh) {
            targetTh.closest('tr').classList.add('drag-over-row');
            currentDropTarget = targetTh;
        }
    }
}, { passive: false });

dataTable.addEventListener('touchend', (e) => {
    clearTimeout(touchStartTimer); // 放開手指時清除長按計時器
    
    if (!touchDragType) return;
    
    // 移除所有高亮標記
    dataTable.querySelectorAll('.drag-over-col, .drag-over-row').forEach(el => el.classList.remove('drag-over-col', 'drag-over-row'));
    
    // 如果有有效的放置目標，執行與桌面版完全相同的資料交換邏輯
    if (currentDropTarget) {
        if (touchDragType === 'col') {
            const targetIndex = parseInt(currentDropTarget.dataset.col);
            if (targetIndex !== touchDragIndex) {
                const theadTr = dataTable.querySelector('thead tr'); 
                const thToMove = theadTr.children[touchDragIndex + 1];
                const refTh = targetIndex > touchDragIndex ? theadTr.children[targetIndex + 2] : theadTr.children[targetIndex + 1];
                theadTr.insertBefore(thToMove, refTh);
                
                dataTable.querySelectorAll('tbody tr').forEach(tr => {
                    const tdToMove = tr.children[touchDragIndex + 1]; 
                    const refTd = targetIndex > touchDragIndex ? tr.children[targetIndex + 2] : tr.children[targetIndex + 1];
                    tr.insertBefore(tdToMove, refTd);
                });
                updateTableHeaders(); localStorage.setItem(STORAGE_KEY, extractTextFromTable()); saveColNames(); saveColWidths(); saveHistoryState(); applyFreeze();
            }
        } else if (touchDragType === 'row') {
            const tr = currentDropTarget.closest('tr'); 
            const targetIndex = Array.from(tr.parentNode.children).indexOf(tr);
            if (targetIndex !== touchDragIndex) {
                const tbody = dataTable.querySelector('tbody'); 
                const trToMove = tbody.children[touchDragIndex];
                const refTr = targetIndex > touchDragIndex ? tbody.children[targetIndex + 1] : tbody.children[targetIndex];
                tbody.insertBefore(trToMove, refTr);
                
                updateTableHeaders(); localStorage.setItem(STORAGE_KEY, extractTextFromTable()); saveHistoryState(); applyFreeze();
            }
        }
    }
    
    // 狀態重置
    touchDragType = null;
    touchDragIndex = -1;
    currentDropTarget = null;
});


// ====== 新增：行動版觸控調整欄寬支援 (Resize) ======
dataTable.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('resize-handle')) {
        isResizing = true; 
        currentTh = e.target.closest('th'); 
        const touch = e.touches[0];
        startX = touch.pageX; 
        startWidth = currentTh.offsetWidth;
        e.target.classList.add('active'); 
        e.preventDefault(); // 避免觸發點擊或捲動
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!isResizing || !currentTh) return;
    const touch = e.touches[0];
    
    // 計算新寬度並套用，與桌面版邏輯一致
    const newWidth = Math.max(50, startWidth + (touch.pageX - startX));
    const currentColIndex = parseInt(currentTh.dataset.col);

    if (selectedCols.includes(currentColIndex)) {
        selectedCols.forEach(colIdx => {
            const th = dataTable.querySelector(`thead th[data-col="${colIdx}"]`);
            if (th) {
                th.style.width = `${newWidth}px`;
                th.style.minWidth = `${newWidth}px`;
                th.style.maxWidth = `${newWidth}px`;
            }
        });
    } else {
        currentTh.style.width = `${newWidth}px`;
        currentTh.style.minWidth = `${newWidth}px`;
        currentTh.style.maxWidth = `${newWidth}px`;
    }
    applySelectionVisuals(); 
}, { passive: true });

document.addEventListener('touchend', () => {
    if (isResizing) { 
        isResizing = false; 
        if (currentTh) {
            currentTh.querySelector('.resize-handle').classList.remove('active'); 
            saveColWidths(); 
        }
        currentTh = null; 
    }
});
// ==========================================

let isResizing = false; let currentTh = null; let startX = 0; let startWidth = 0;

dataTable.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('resize-handle')) {
        isResizing = true; 
        currentTh = e.target.closest('th'); 
        startX = e.pageX; 
        startWidth = currentTh.offsetWidth;
        e.target.classList.add('active'); 
        e.preventDefault(); 
    }
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing || !currentTh) return;
    
    // 計算拖曳後的新寬度 (最小限制為 50px)
    const newWidth = Math.max(50, startWidth + (e.pageX - startX));
    
    // 取得目前正在調整寬度的欄位索引 (Index)
    const currentColIndex = parseInt(currentTh.dataset.col);

    // 【核心邏輯】判斷：目前拖曳的欄位，是否包含在「已選取的欄位」清單中？
    if (selectedCols.includes(currentColIndex)) {
        // 如果是，則將新寬度同步套用到所有被選取的欄位
        selectedCols.forEach(colIdx => {
            const th = dataTable.querySelector(`thead th[data-col="${colIdx}"]`);
            if (th) {
                th.style.width = `${newWidth}px`;
                th.style.minWidth = `${newWidth}px`;
                th.style.maxWidth = `${newWidth}px`;
            }
        });
    } else {
        // 如果不是 (單獨拖曳沒被選取的欄位)，則只調整當前欄位
        currentTh.style.width = `${newWidth}px`;
        currentTh.style.minWidth = `${newWidth}px`;
        currentTh.style.maxWidth = `${newWidth}px`;
    }
    
    // 更新畫面的藍色選取框線
    applySelectionVisuals(); 
});

document.addEventListener('mouseup', () => {
    if (isResizing) { 
        isResizing = false; 
        if (currentTh) {
            currentTh.querySelector('.resize-handle').classList.remove('active'); 
            // 拖曳結束時，原本的 saveColWidths 會自動掃描所有欄位並儲存，所以這裡不需修改
            saveColWidths(); 
        }
        currentTh = null; 
    }
});

/* ---------------------------------
   全域與特殊合併設定
   --------------------------------- */
function updateLineNumbers() {
    if (currentMode !== 'text') return; 
    const text = editor.value; const lines = text.split('\n'); const style = window.getComputedStyle(editor);
    mirror.style.fontFamily = style.fontFamily; mirror.style.fontSize = style.fontSize;
    mirror.style.lineHeight = style.lineHeight; mirror.style.whiteSpace = style.whiteSpace; mirror.style.wordBreak = style.wordBreak;
    mirror.style.width = `${editor.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)}px`;
    mirror.innerHTML = '';
    lines.forEach(line => { const div = document.createElement('div'); div.textContent = line.length === 0 ? '\u200b' : line; mirror.appendChild(div); });
    let numbersHtml = ''; const measureDivs = mirror.children;
    for (let i = 0; i < lines.length; i++) { numbersHtml += `<div class="line-number-item" style="height: ${measureDivs[i].getBoundingClientRect().height}px;">${i + 1}</div>`; }
    lineNumbers.innerHTML = numbersHtml;
}

editor.addEventListener('input', () => { localStorage.setItem(STORAGE_KEY, editor.value); updateLineNumbers(); hideFloatingTool(); debouncedSaveHistory(); });
editor.addEventListener('scroll', () => { lineNumbers.scrollTop = editor.scrollTop; hideFloatingTool(); });

document.getElementById('dd-fontSize').addEventListener('change', (e) => { 
    const val = e.detail.value;
    document.documentElement.style.setProperty('--editor-font-size', val); 
    localStorage.setItem(FONT_SIZE_KEY, val);
    if (currentMode === 'text') setTimeout(updateLineNumbers, 50); else applySelectionVisuals(); 
});
document.getElementById('dd-lineHeight').addEventListener('change', (e) => { 
    const val = e.detail.value;
    document.documentElement.style.setProperty('--editor-line-height', val); 
    localStorage.setItem(LINE_HEIGHT_KEY, val);
    if (currentMode === 'text') setTimeout(updateLineNumbers, 50); else applySelectionVisuals(); 
});
document.getElementById('dd-editorWidth').addEventListener('change', (e) => { 
    mainContainer.style.maxWidth = e.detail.value; 
    localStorage.setItem(EDITOR_WIDTH_KEY, e.detail.value);
    if (currentMode === 'text') setTimeout(updateLineNumbers, 350); else setTimeout(applySelectionVisuals, 350); 
});

/* 鎖定選取狀態切換 */
document.getElementById('dd-lockSelection').addEventListener('change', (e) => {
    isSelectionLocked = (e.detail.value === 'true');
    document.getElementById('lockSelectionIcon').textContent = isSelectionLocked ? 'lock' : 'lock_open';
    showToast(isSelectionLocked ? '🔒 選取範圍已鎖定' : '🔓 選取範圍已解除鎖定');
});

document.getElementById('dd-wordWrap').addEventListener('change', (e) => { 
    const wrap = e.detail.value;
    editor.style.whiteSpace = wrap; 
    document.documentElement.style.setProperty('--table-white-space', wrap); 
    localStorage.setItem(WORD_WRAP_KEY, wrap);
    
    if (wrap === 'pre') dataTable.classList.add('table-nowrap');
    else dataTable.classList.remove('table-nowrap');

    if (currentMode === 'text') { 
        updateLineNumbers(); setTimeout(() => { lineNumbers.scrollTop = editor.scrollTop; }, 50); 
    } else {
        applySelectionVisuals();
    }
});

function showToast(message) { toast.textContent = message; toast.classList.remove('opacity-0'); setTimeout(() => { toast.classList.add('opacity-0'); }, 3000); }

document.getElementById('btnClearAll').addEventListener('click', () => { 
    showConfirm('確認全部清空', '這將會清空所有的資料與結構，你確定嗎？', () => {
        localStorage.setItem(STORAGE_KEY, ''); localStorage.removeItem(COL_NAMES_KEY); localStorage.removeItem(COL_WIDTHS_KEY); editor.value = '';
        if (currentMode === 'text') updateLineNumbers(); else renderTableFromText('');
        saveHistoryState(); showToast('🗑️ 全域內容已清除');
    });
});

/* 特殊合併邏輯 */
let currentMatch = null; let activeSelectionRange = null; 
function hideFloatingTool() { floatingTool.style.display = 'none'; currentMatch = null; activeSelectionRange = null; }
function checkAndShowSpecialMerge(selectedText, pageX, pageY) {
    const parts = selectedText.split('_');
    if (parts.length >= 2 && parts.every(part => part.split('/').length === 2)) {
        currentMatch = { textToReplace: parts.map(p => p.split('/')[0]).join('\\') + '/' + parts.map(p => p.split('/')[1]).join('\\') };
        floatingTool.style.left = `${pageX - 40}px`; floatingTool.style.top = `${pageY - 50}px`; floatingTool.style.display = 'block'; return true;
    }
    return false;
}

document.addEventListener('mouseup', (e) => {
    if (e.target === floatingTool || e.target.closest('.icon-btn') || e.target.classList.contains('resize-handle') || e.target.closest('.btn-col-menu') || e.target.closest('.btn-row-menu')) return;
    setTimeout(() => {
        if (currentMode === 'text' && document.activeElement === editor) {
            if (editor.selectionStart !== editor.selectionEnd) { checkAndShowSpecialMerge(editor.value.substring(editor.selectionStart, editor.selectionEnd), e.pageX, e.pageY); return; }
        } else if (currentMode === 'table') {
            const sel = window.getSelection();
            if (!sel.isCollapsed && sel.rangeCount > 0 && dataTable.contains(sel.anchorNode)) {
                if (checkAndShowSpecialMerge(sel.toString(), e.pageX, e.pageY)) { activeSelectionRange = sel.getRangeAt(0).cloneRange(); return; }
            }
        }
        hideFloatingTool();
    }, 10);
});

floatingTool.addEventListener('click', () => {
    if (!currentMatch) return;
    if (currentMode === 'text') {
        editor.setRangeText(currentMatch.textToReplace, editor.selectionStart, editor.selectionEnd, 'select');
        localStorage.setItem(STORAGE_KEY, editor.value); updateLineNumbers();
    } else if (currentMode === 'table') {
        const sel = window.getSelection(); sel.removeAllRanges();
        if (activeSelectionRange) { 
            sel.addRange(activeSelectionRange); 
            document.execCommand('insertText', false, currentMatch.textToReplace); 
            localStorage.setItem(STORAGE_KEY, extractTextFromTable()); 
        }
    }
    hideFloatingTool(); saveHistoryState(); showToast('✨ 特殊合併完成！');
});




// =========================
// 雲端字體延遲載入 (Lazy Load)
// =========================
let isExtraFontsLoaded = false;
function loadExtraFonts() {
    if (!isExtraFontsLoaded) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://oikasu1.github.io/fonts/twfonts.css';
        document.head.appendChild(link);
        isExtraFontsLoaded = true;
        console.log('已動態載入進階雲端字體包');
    }
}

// =========================
// 全域字體選擇與套用功能
// =========================
const ddFontFamily = document.getElementById('dd-fontFamily');
if (ddFontFamily) {
    const btnFont = ddFontFamily.querySelector('.dropdown-btn');
    
    // 【效能優化】當滑鼠移入或點擊「字體圖示按鈕」時，才載入龐大字體包
    btnFont.addEventListener('mouseenter', loadExtraFonts);
    btnFont.addEventListener('click', loadExtraFonts);

    // 監聽字體下拉選單的變更
    ddFontFamily.addEventListener('change', (e) => {
        const fontName = e.detail.value;
        if (!fontName) return;
        
        loadExtraFonts(); // 防呆確保已載入
        
        // 核心魔法：直接改變根目錄的 CSS 變數，全網頁包含表格、尋找框會瞬間套用新字體！
        document.documentElement.style.setProperty('--main-font', fontName);
        
        // 記憶使用者的選擇
        localStorage.setItem(FONT_FAMILY_KEY, fontName);
    });
}

/* ==========================================
   尋找與取代 核心模組
   ========================================== */
const findReplaceModal = document.getElementById('findReplaceModal');
const findInput = document.getElementById('findInput');
const replaceInput = document.getElementById('replaceInput');
const msgFind = document.getElementById('findReplaceMessage');

let lastMatchedCell = null; // 追蹤目前找到的儲存格內部元素

// 展開/收合進階設定
document.getElementById('btnToggleAdvancedSearch').addEventListener('click', () => {
    const opts = document.getElementById('advancedSearchOptions');
    const icon = document.getElementById('advancedSearchIcon');
    opts.classList.toggle('hidden');
    icon.textContent = opts.classList.contains('hidden') ? 'arrow_right' : 'arrow_drop_down';
});

// 開啟/關閉視窗
document.getElementById('btnFindReplace').addEventListener('click', () => {
    findReplaceModal.classList.toggle('hidden');
    if (!findReplaceModal.classList.contains('hidden')) { findInput.focus(); findInput.select(); }
});
document.getElementById('btnCloseFindReplace').addEventListener('click', () => {
    findReplaceModal.classList.add('hidden');
});

// 視窗全區拖曳功能
let isDraggingFR = false, dragStartX = 0, dragStartY = 0, frStartLeft = 0, frStartTop = 0;
findReplaceModal.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, button, label')) return;
    
    isDraggingFR = true; dragStartX = e.clientX; dragStartY = e.clientY;
    const rect = findReplaceModal.getBoundingClientRect();
    frStartLeft = rect.left; frStartTop = rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingFR) return;
    findReplaceModal.style.left = `${frStartLeft + (e.clientX - dragStartX)}px`;
    findReplaceModal.style.top = `${frStartTop + (e.clientY - dragStartY)}px`;
    findReplaceModal.style.right = 'auto'; 
});
document.addEventListener('mouseup', () => { isDraggingFR = false; document.body.style.userSelect = ''; });

// ====== 新增：行動版觸控拖曳支援 (尋找與取代) ======
findReplaceModal.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, button, label')) return;
    const touch = e.touches[0];
    isDraggingFR = true; 
    dragStartX = touch.clientX; 
    dragStartY = touch.clientY;
    const rect = findReplaceModal.getBoundingClientRect();
    frStartLeft = rect.left; 
    frStartTop = rect.top;
    // 避免觸控到非輸入框時觸發螢幕滾動
    if (!e.target.closest('input')) e.preventDefault(); 
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!isDraggingFR) return;
    const touch = e.touches[0];
    findReplaceModal.style.left = `${frStartLeft + (touch.clientX - dragStartX)}px`;
    findReplaceModal.style.top = `${frStartTop + (touch.clientY - dragStartY)}px`;
    findReplaceModal.style.right = 'auto'; 
    e.preventDefault(); // 拖曳時禁止畫面跟著滾動
}, { passive: false });

document.addEventListener('touchend', () => { 
    isDraggingFR = false; 
});
// ==========================================

// 顯示頂端提示訊息
let msgTimeout;
function showFRMsg(text, isError = true) {
    clearTimeout(msgTimeout);
    msgFind.textContent = text;
    msgFind.className = `text-base ${isError ? 'font-bold text-red-500' : 'text-green-600'}`;
    
    msgTimeout = setTimeout(() => {
        msgFind.textContent = '尋找與取代';
        msgFind.className = 'text-gray-700 text-base';
    }, 3000);
}

// 建立正則表達式引擎
function buildSearchRegex(isGlobal = false) {
    let term = findInput.value;
    if (!term) return null;

    const isRegex = document.getElementById('chkRegex').checked;
    const isCase = document.getElementById('chkCaseSensitive').checked;
    const isWhole = document.getElementById('chkWholeWord').checked;
    const isPrefix = document.getElementById('chkPrefixMatch').checked;
    const isSuffix = document.getElementById('chkSuffixMatch').checked;
    const isCell = document.getElementById('chkCellMatch').checked;

    if (!isRegex) term = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (currentMode === 'table' && isCell) {
        term = '^' + term + '$';
    } else {
        if (isWhole) term = '\\b' + term + '\\b';
        else {
            if (isPrefix) term = '^' + term + '|\\b' + term; 
            if (isSuffix) term = term + '$|' + term + '\\b';
        }
    }

    try { 
        // 加上 'u' 標誌，完美支援擴充漢字
        const flags = (isCase ? '' : 'i') + (isGlobal ? 'g' : '') + 'u';
        return new RegExp(term, flags); 
    } 
    catch (e) { showFRMsg('正則語法錯誤'); return null; }
}

// 判斷當前選取狀態
function getSelectionContext() {
    if (currentMode === 'text') {
        return { hasSelection: editor.selectionStart !== editor.selectionEnd, start: editor.selectionStart, end: editor.selectionEnd };
    } else {
        // 判斷是否為「大於一格的範圍多選」。如果只是單點一格，就不限制搜尋範圍。
        const isMultiSelect = selectedRows.length > 0 || 
                              selectedCols.length > 0 || 
                              selectedCellBlocks.length > 1 || 
                              (selectedCellBlocks.length === 1 && (selectedCellBlocks[0].startR !== selectedCellBlocks[0].endR || selectedCellBlocks[0].startC !== selectedCellBlocks[0].endC));
        return { hasSelection: isMultiSelect };
    }
}

// 收集目標儲存格
function getTargetCells() {
    const rows = dataTable.querySelectorAll('tbody tr');
    let cells = [];
    const context = getSelectionContext();
    
    for (let r = 0; r < rows.length; r++) {
        const tds = rows[r].querySelectorAll('.td-inner');
        for (let c = 0; c < tds.length; c++) {
            if (!context.hasSelection || selectedRows.includes(r) || selectedCols.includes(c) || isCellInAnyBlock(r, c)) {
                cells.push({ row: r, col: c, inner: tds[c] });
            }
        }
    }
    return cells;
}

// --- 核心尋找函數 ---
function executeFind(isDown) {
    const regex = buildSearchRegex();
    if (!regex) return;

    if (currentMode === 'text') {
        const text = editor.value;
        const cursor = isDown ? editor.selectionEnd : editor.selectionStart;
        const searchSpace = isDown ? text.substring(cursor) : text.substring(0, cursor);
        
        const globalRegex = buildSearchRegex(true);
        let match, lastMatch = null;
        while ((match = globalRegex.exec(searchSpace)) !== null) { lastMatch = match; }

        const finalMatch = isDown ? searchSpace.match(regex) : lastMatch;

        if (finalMatch) {
            const matchStart = isDown ? cursor + finalMatch.index : finalMatch.index;
            const matchEnd = matchStart + finalMatch[0].length;
            
            // 選取文字並聚焦
            editor.setSelectionRange(matchStart, matchEnd);
            editor.focus();
            
            const style = window.getComputedStyle(editor);
            mirror.style.fontFamily = style.fontFamily; 
            mirror.style.fontSize = style.fontSize;
            mirror.style.lineHeight = style.lineHeight; 
            mirror.style.whiteSpace = style.whiteSpace; 
            mirror.style.wordBreak = style.wordBreak;
            // 扣除左右 padding，確保測量寬度與真實 textarea 內部完全一致
            mirror.style.width = `${editor.clientWidth - parseFloat(style.paddingLeft || 0) - parseFloat(style.paddingRight || 0)}px`;
            
            // 將尋找點之前的文字放入 mirror，並在尾端加一個字元 'A'，確保最後的換行高度被正確計算
            mirror.textContent = editor.value.substring(0, matchStart) + 'A';
            
            const lineHeightStr = style.lineHeight;
            const lineHeight = lineHeightStr === 'normal' ? 24 : parseFloat(lineHeightStr);
            const paddingTop = parseFloat(style.paddingTop || 0);
            
            // 取得精準的文字頂部與底部 Y 座標 (補回 paddingTop)
            const bottomY = mirror.scrollHeight + paddingTop;
            const topY = bottomY - lineHeight;
            
            const currentScroll = editor.scrollTop;
            const clientHeight = editor.clientHeight;

            // 判斷是否超出可視範圍 (上半部被遮住，或是下半部被遮住)
            if (topY < currentScroll || bottomY > currentScroll + clientHeight) {
                // 只有確定超出範圍時，才滾動畫面讓目標置中
                const targetScrollTop = topY - (clientHeight / 2);
                editor.scrollTop = Math.max(0, targetScrollTop);
            }


            showFRMsg('找到符合項目', false);
        } else {
            showFRMsg('找不到目標');
        }
    } else {
        const cells = getTargetCells();
        if (cells.length === 0) return;

        let currentIdx = -1;
        
        if (lastMatchedCell) {
            currentIdx = cells.findIndex(c => c.inner === lastMatchedCell);
        } else {
            const activeInner = document.activeElement.closest('.td-inner');
            if (activeInner) currentIdx = cells.findIndex(c => c.inner === activeInner);
        }
        
        if (currentIdx === -1) currentIdx = isDown ? -1 : 0; 

        let found = false;
        for (let i = 1; i <= cells.length; i++) {
            let step = isDown ? i : -i;
            let checkIdx = (currentIdx + step) % cells.length;
            if (checkIdx < 0) checkIdx += cells.length;
            
            const cell = cells[checkIdx];
            if (regex.test(cell.inner.innerText)) {
                lastMatchedCell = cell.inner;
                
                // 利用 nearest 屬性，只有在該儲存格超出畫面時才會滾動
                lastMatchedCell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                
                // 1. 讓找到的儲存格獲得焦點
                cell.inner.focus();

                // 2. 將游標強制設定在文字最前方，確實取消所有文字反白
                const sel = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(cell.inner);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);

                // 3. 處理視覺選取狀態
                const context = getSelectionContext();
                
                // 清除之前的 outline 標記 (如果有的話)
                if (window.lastFoundTd) {
                    window.lastFoundTd.style.removeProperty('background-color');
                    window.lastFoundTd.style.removeProperty('outline');
                    window.lastFoundTd.style.removeProperty('outline-offset');
                    window.lastFoundTd = null;
                }

                if (!context.hasSelection) {
                    // 【單格/全域搜尋模式】：直接將系統的選取焦點移動到找到的這一格
                    lastClickedCell = { r: cell.row, c: cell.col };
                    selectedCellBlocks = [{ startR: cell.row, startC: cell.col, endR: cell.row, endC: cell.col }];
                    selectedRows = []; 
                    selectedCols = [];
                    applySelectionVisuals(); // 呼叫你原本的系統，畫出標準單格藍色選取框
                } else {
                    // 【多選範圍模式】：保留多選底色，改用 outline 強調這一格
                    const activeTd = cell.inner.closest('td');
                    if (activeTd) {
                        activeTd.style.setProperty('background-color', '#ffffff', 'important');
                        activeTd.style.setProperty('outline', '2px solid #3b82f6', 'important');
                        activeTd.style.setProperty('outline-offset', '-2px', 'important');
                        window.lastFoundTd = activeTd;
                    }

                    if (!window.hasFindClickClear) {
                        document.addEventListener('mousedown', (e) => {
                            if (!e.target.closest('#findReplaceModal') && window.lastFoundTd) {
                                window.lastFoundTd.style.removeProperty('background-color');
                                window.lastFoundTd.style.removeProperty('outline');
                                window.lastFoundTd.style.removeProperty('outline-offset');
                                window.lastFoundTd = null;
                            }
                        });
                        window.hasFindClickClear = true;
                    }
                }

                found = true;
                showFRMsg('找到符合項目', false);
                break;
            }
        }
        if (!found) {
            showFRMsg('找不到目標');
        }
    }
}

// 綁定前一個/後一個按鈕
document.getElementById('btnFindNext').addEventListener('click', () => executeFind(true));
document.getElementById('btnFindPrev').addEventListener('click', () => executeFind(false));

// --- 取代 ---
document.getElementById('btnReplace').addEventListener('click', () => {
    const regex = buildSearchRegex();
    if (!regex) return;
    const replaceWith = replaceInput.value;
    const isDown = document.querySelector('input[name="searchDirection"]:checked')?.value !== 'up';

    if (currentMode === 'text') {
        const selected = editor.value.substring(editor.selectionStart, editor.selectionEnd);
        if (regex.test(selected)) {
            const newText = selected.replace(regex, replaceWith);
            editor.setRangeText(newText, editor.selectionStart, editor.selectionEnd, 'end');
            debouncedSaveHistory();
            executeFind(isDown); 
        } else {
            executeFind(isDown);
        }
    } else {
        let targetCell = lastMatchedCell || document.activeElement.closest('.td-inner');
        if (targetCell && regex.test(targetCell.innerText)) {
            targetCell.innerText = targetCell.innerText.replace(regex, replaceWith);
            debouncedSaveHistory();
            localStorage.setItem(STORAGE_KEY, extractTextFromTable());
            executeFind(isDown); 
        } else {
            executeFind(isDown); 
        }
    }
});

// --- 全部取代 ---
document.getElementById('btnReplaceAll').addEventListener('click', () => {
    const globalRegex = buildSearchRegex(true);
    if (!globalRegex) return;
    const replaceWith = replaceInput.value;
    const context = getSelectionContext();
    let count = 0;

    if (currentMode === 'text') {
        const text = editor.value;
        if (context.hasSelection) {
            const selectedText = text.substring(context.start, context.end);
            count = (selectedText.match(globalRegex) || []).length;
            if (count > 0) {
                const newText = selectedText.replace(globalRegex, replaceWith);
                editor.setRangeText(newText, context.start, context.end, 'select');
            }
        } else {
            count = (text.match(globalRegex) || []).length;
            if (count > 0) editor.value = text.replace(globalRegex, replaceWith);
        }
        if (count > 0) { debouncedSaveHistory(); updateLineNumbers(); }
    } else {
        const cells = getTargetCells();
        cells.forEach(cell => {
            const text = cell.inner.innerText;
            if (globalRegex.test(text)) {
                const matches = text.match(globalRegex);
                count += matches ? matches.length : 0;
                cell.inner.innerText = text.replace(globalRegex, replaceWith);
            }
        });
        if (count > 0) {
            debouncedSaveHistory();
            localStorage.setItem(STORAGE_KEY, extractTextFromTable());
        }
    }
    
    if (count > 0) showFRMsg(`完成 ${count} 筆取代`, false);
    else showFRMsg('找不到目標');
});



/* ==========================================
   表格多欄位排序模組
   ========================================== */
const sortPanel = document.getElementById('sortPanel');
const sortRulesContainer = document.getElementById('sortRulesContainer');
const chkSortHasHeader = document.getElementById('chkSortHasHeader');
const sortPanelHeader = document.getElementById('sortPanelHeader');

// 重設「有標題」核取方塊的狀態
function resetSortHeaderCheckbox() {
    chkSortHasHeader.checked = false;
}

// 開啟與關閉視窗
document.getElementById('btnOpenSort').addEventListener('click', () => {
    openSortPanel();
});
document.getElementById('btnCloseSort').addEventListener('click', () => sortPanel.classList.add('hidden'));
document.getElementById('btnCancelSort').addEventListener('click', () => sortPanel.classList.add('hidden'));

let isDraggingSort = false, dragStartXSort = 0, dragStartYSort = 0, sortPanelStartLeft = 0, sortPanelStartTop = 0;
sortPanel.addEventListener('mousedown', (e) => {
    if (e.target.closest('button, select, input, label')) return; 
    
    isDraggingSort = true; dragStartXSort = e.clientX; dragStartYSort = e.clientY;
    const rect = sortPanel.getBoundingClientRect();
    sortPanelStartLeft = rect.left; sortPanelStartTop = rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingSort) return;
    sortPanel.style.left = `${sortPanelStartLeft + (e.clientX - dragStartXSort)}px`;
    sortPanel.style.top = `${sortPanelStartTop + (e.clientY - dragStartYSort)}px`;
    sortPanel.style.right = 'auto'; 
});
document.addEventListener('mouseup', () => { isDraggingSort = false; document.body.style.userSelect = ''; });

// ====== 新增：行動版觸控拖曳支援 (排序設定) ======
sortPanel.addEventListener('touchstart', (e) => {
    if (e.target.closest('button, select, input, label')) return; 
    const touch = e.touches[0];
    isDraggingSort = true; 
    dragStartXSort = touch.clientX; 
    dragStartYSort = touch.clientY;
    const rect = sortPanel.getBoundingClientRect();
    sortPanelStartLeft = rect.left; 
    sortPanelStartTop = rect.top;
    if (!e.target.closest('input, select')) e.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!isDraggingSort) return;
    const touch = e.touches[0];
    sortPanel.style.left = `${sortPanelStartLeft + (touch.clientX - dragStartXSort)}px`;
    sortPanel.style.top = `${sortPanelStartTop + (touch.clientY - dragStartYSort)}px`;
    sortPanel.style.right = 'auto'; 
    e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', () => { 
    isDraggingSort = false; 
});
// ==========================================

// 取得當前表格的所有欄位名稱
function getTableColumnsForSort() {
    const ths = document.querySelectorAll('#data-table thead th:not(.sticky-corner)');
    return Array.from(ths).map(th => {
        const colIndex = parseInt(th.dataset.col);
        const customName = th.dataset.colName;
        // 使用原有的 getColLabel (例如 A, B, C...)
        const defaultName = getColLabel(colIndex);
        return {
            index: colIndex,
            // 介面參考圖片：只顯示 A, B, C... (或可選擇顯示欄位名稱)
            displayName: customName ? `${defaultName} (${customName})` : defaultName
        };
    });
}

// 動態建立一筆排序規則 UI (參考 image_0.png + 用戶要求)
function createSortRuleElement(columns) {
    const ruleDiv = document.createElement('div');
    // 去除整列的外框與陰影，縮小 padding 和 gap
    ruleDiv.className = 'flex items-center gap-2 bg-white py-1 rule-item';
    
    // 欄位選項
    const optionsHtml = columns.map(c => `<option value="${c.index}">${c.displayName}</option>`).join('');
    
    // 將 select 內的 py-2.5 改為 py-1.5，讓上下不要太開
    ruleDiv.innerHTML = `
        <select class="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-purple-300 code-text bg-white cursor-pointer appearance-none">
            ${optionsHtml}
        </select>
        <select class="border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-purple-300 order-select code-text bg-white cursor-pointer appearance-none">
            <option value="1">A-Z (順序)</option>
            <option value="-1">Z-A (逆序)</option>
        </select>
        <button class="text-gray-300 hover:text-red-500 transition btn-remove-rule cursor-pointer" title="移除此條件">
            <span class="material-symbols-outlined text-xl">delete</span>
        </button>
        <button class="text-gray-300 hover:text-purple-600 transition btn-add-rule cursor-pointer" title="新增排序條件">
            <span class="material-symbols-outlined text-xl">add</span>
        </button>
    `;
    
    // 綁定按鈕事件
    ruleDiv.querySelector('.btn-remove-rule').addEventListener('click', () => {
        // 如果只剩一條規則，則不移除，只清空
        if (sortRulesContainer.children.length > 1) {
            ruleDiv.remove();
        } else {
            sortRulesContainer.innerHTML = '';
            sortRulesContainer.appendChild(createSortRuleElement(getTableColumnsForSort()));
        }
    });
    ruleDiv.querySelector('.btn-add-rule').addEventListener('click', () => {
        const columns = getTableColumnsForSort();
        // 將新規則插入到當前規則後面
        sortRulesContainer.insertBefore(createSortRuleElement(columns), ruleDiv.nextSibling);
    });
    
    return ruleDiv;
}

// 初始化並開啟排序窗格
function openSortPanel() {
    sortRulesContainer.innerHTML = ''; // 清空舊規則
    const columns = getTableColumnsForSort();
    
    if (columns.length === 0) {
        showToast('⚠️ 表格中沒有可排序的欄位');
        return;
    }
    
    // 預設加入第一條規則
    sortRulesContainer.appendChild(createSortRuleElement(columns));
    
    // 重新取得並設定「有標題」核取方塊的狀態
    // 如果有凍結列，則預設勾選且不可取消
    if (frozenRowsCount > 0) {
        chkSortHasHeader.checked = true;
        // 如果有凍結列，則「有標題」應強制選取，不讓用戶修改
        chkSortHasHeader.setAttribute('disabled', 'true');
    } else {
        // 如果沒有凍結列，則恢復為預設 (false)，且可修改
        chkSortHasHeader.checked = false; 
        chkSortHasHeader.removeAttribute('disabled');
    }

    sortPanel.classList.remove('hidden');
}

// 套用排序邏輯
document.getElementById('btnApplySort').addEventListener('click', () => {
    // 1. 收集使用者設定的規則
    const ruleElements = sortRulesContainer.querySelectorAll('.rule-item');
    const rules = Array.from(ruleElements).map(el => ({
        colIndex: parseInt(el.querySelector('select').value),
        order: parseInt(el.querySelector('.order-select').value)
    }));

    if (rules.length === 0) {
        sortPanel.classList.add('hidden');
        return;
    }

    // 2. 擷取並解析目前的表格資料
    const currentTsv = extractTextFromTable();
    if (!currentTsv) return;
    const data = parseTSV(currentTsv);

    // 3. 智慧處理標題與凍結列：計算不參與排序的列數 (skipRowsCount)
    let skipRows = frozenRowsCount;
    // 如果沒有凍結列，且用戶勾選「有標題」，則跳過第一列
    if (skipRows === 0 && chkSortHasHeader.checked) {
        skipRows = 1;
    }
    
    // 4. 分離標題和資料
    const headerData = data.slice(0, skipRows); // 標題部分 (含凍結列)
    const dataToSort = data.slice(skipRows); // 要排序的資料部分

    if (dataToSort.length === 0) {
        showToast('✅ 標題已設定，無資料可排序！');
        sortPanel.classList.add('hidden');
        return;
    }

    // 5. 執行多條件智慧排序
    dataToSort.sort((rowA, rowB) => {
        // 迭代所有規則，先排第一欄，若相同排第二欄，依此類推
        for (let rule of rules) {
            let valA = rowA[rule.colIndex] || "";
            let valB = rowB[rule.colIndex] || "";
            
            // 使用 localeCompare 並開啟 numeric 屬性，聰明判斷文字與數字的混合排序
            let cmp = valA.localeCompare(valB, 'zh-TW', { numeric: true });
            
            if (cmp !== 0) {
                return cmp * rule.order; // 如果不同，就依照順序/逆序回傳結果
            }
            // 如果此欄相同，則繼續比對下一個規則
        }
        return 0; // 所有規則都相等
    });

    // 6. 合併標題與排序後的資料
    const mergedData = [...headerData, ...dataToSort];

    // 7. 將資料陣列轉回 TSV 格式
    const sortedTsv = mergedData.map(row => {
        return row.map(cell => {
            if (cell.includes('"') || cell.includes('\n') || cell.includes('\t')) {
                return '"' + cell.replace(/"/g, '""') + '"';
            }
            return cell;
        }).join('\t');
    }).join('\n');

    // 8. 重新渲染表格並儲存狀態
    // 呼叫你原有的函數
    renderTableFromText(sortedTsv);
    localStorage.setItem(STORAGE_KEY, sortedTsv);
    debouncedSaveHistory(); // 寫入復原紀錄
    clearTableSelection();
    applyFreeze(); // 確保凍結效果依然在
    
    sortPanel.classList.remove('hidden');
    showToast('✅ 多欄位排序已成功套用！');
});



/* ==========================================
   神奇多功能工具：自動填入 模組 (邏輯優化版)
   ========================================== */
const autoFillModal = document.getElementById('autoFillModal');

// 1. 開啟與關閉對話框
document.getElementById('btnOpenAutoFill').addEventListener('click', (e) => {
    e.stopPropagation();
    autoFillModal.classList.remove('hidden');
    // 關閉其他可能開啟的下拉選單
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    // 自動聚焦到第一個輸入框
    document.getElementById('autoFillPrefix').focus();
});
document.getElementById('btnCloseAutoFill').addEventListener('click', () => {
    autoFillModal.classList.add('hidden');
});

// 2. 實作視窗全區拖曳 (避開輸入框與按鈕)
let isDraggingAF = false, dragStartXAF = 0, dragStartYAF = 0, afStartLeft = 0, afStartTop = 0;
autoFillModal.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, button, label')) return; // 點擊到輸入框不觸發拖曳
    
    isDraggingAF = true; 
    dragStartXAF = e.clientX; 
    dragStartYAF = e.clientY;
    const rect = autoFillModal.getBoundingClientRect();
    afStartLeft = rect.left; 
    afStartTop = rect.top;
    document.body.style.userSelect = 'none'; // 防止拖曳時反白文字
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingAF) return;
    autoFillModal.style.left = `${afStartLeft + (e.clientX - dragStartXAF)}px`;
    autoFillModal.style.top = `${afStartTop + (e.clientY - dragStartYAF)}px`;
    autoFillModal.style.right = 'auto'; 
});
document.addEventListener('mouseup', () => { 
    isDraggingAF = false; 
    document.body.style.userSelect = ''; 
});

autoFillModal.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, button, label')) return; 
    const touch = e.touches[0];
    isDraggingAF = true; 
    dragStartXAF = touch.clientX; 
    dragStartYAF = touch.clientY;
    const rect = autoFillModal.getBoundingClientRect();
    afStartLeft = rect.left; 
    afStartTop = rect.top;
    if (!e.target.closest('input')) e.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!isDraggingAF) return;
    const touch = e.touches[0];
    autoFillModal.style.left = `${afStartLeft + (touch.clientX - dragStartXAF)}px`;
    autoFillModal.style.top = `${afStartTop + (touch.clientY - dragStartYAF)}px`;
    autoFillModal.style.right = 'auto'; 
    e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', () => { 
    isDraggingAF = false; 
});

// 3. 核心邏輯：套用按鈕
document.getElementById('btnApplyAutoFill').addEventListener('click', () => {
    // 確保只在表格模式執行
    if (currentMode !== 'table') {
        showToast('⚠️ 自動填入僅能在表格模式使用');
        return;
    }

    // 取得輸入值
    const prefix = document.getElementById('autoFillPrefix').value || "";
    const suffix = document.getElementById('autoFillSuffix').value || "";
    const startNumRaw = document.getElementById('autoFillStartNum').value;
    const digitsRaw = document.getElementById('autoFillDigits').value;
    
    const hasStartNum = startNumRaw !== '';
    let currentNum = hasStartNum ? parseInt(startNumRaw, 10) : null;
    const digits = digitsRaw !== '' ? parseInt(digitsRaw, 10) : 0;

    // 判斷是否有多選範圍
    const isMultiSelect = selectedRows.length > 0 || selectedCols.length > 0 || selectedCellBlocks.length > 0;
    const rows = dataTable.querySelectorAll('tbody tr');
    
    // 智慧收集選取範圍內的儲存格 (.td-inner)
    const cellsToUpdate = [];
    
    if (!isMultiSelect) {
        // [修正] 若無多選範圍，檢查是否有聚焦或單擊的儲存格
        let targetInner = null;
        const activeEl = document.activeElement;
        if (activeEl && activeEl.classList.contains('td-inner') && dataTable.contains(activeEl)) {
            targetInner = activeEl;
        } else if (lastClickedCell && rows[lastClickedCell.r]) {
            targetInner = rows[lastClickedCell.r].children[lastClickedCell.c + 1]?.querySelector('.td-inner');
        }

        if (targetInner) {
            cellsToUpdate.push(targetInner);
        } else {
            showToast('⚠️ 請先選取要套用的儲存格範圍');
            return;
        }
    } else {
        // 循序收集選取範圍內的儲存格 (由上到下、由左至右)
        for (let r = 0; r < rows.length; r++) {
            const tr = rows[r];
            const colsCount = tr.children.length - 1; // 扣除序號 Th
            for (let c = 0; c < colsCount; c++) {
                if (selectedRows.includes(r) || selectedCols.includes(c) || isCellInAnyBlock(r, c)) {
                    const inner = tr.children[c + 1]?.querySelector('.td-inner');
                    if (inner) cellsToUpdate.push(inner);
                }
            }
        }
    }

    if (cellsToUpdate.length === 0) return;

    // 進行資料更新
    cellsToUpdate.forEach(inner => {
        if (hasStartNum) {
            // 情境 A：有輸入起始數字 -> [覆寫模式]
            let numStr = currentNum.toString();
            // 處理數字補零 (如果指定位數)
            if (digits > 0 && numStr.length < digits) {
                numStr = numStr.padStart(digits, '0');
            }
            inner.innerText = prefix + numStr + suffix;
            currentNum++; // 數字累加
        } else {
            // 情境 B：無起始數字 -> [前後追加模式] (保留原內容)
            inner.innerText = prefix + inner.innerText + suffix;
        }
    });

    // 儲存狀態並更新紀錄 (使用原本專案的函數)
    localStorage.setItem(STORAGE_KEY, extractTextFromTable());
    debouncedSaveHistory();

    // 提示完成
    showToast('✅ 自動填入完成！');
});



/* ==========================================
   輕量級試算表公式引擎 (Spreadsheet Formula Engine)
   ========================================== */

// 0. 輔助函數：將欄位字母 (A, B, AA) 轉為數字索引 (0, 1, 26)
function colStrToNum(colStr) {
    let colIndex = 0;
    for (let i = 0; i < colStr.length; i++) {
        colIndex = colIndex * 26 + (colStr.charCodeAt(i) - 64);
    }
    return colIndex - 1;
}

// 1. 座標轉換：將 "A1" 轉換為 { row: 0, col: 0 }
function parseCellReference(ref) {
    const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    
    const colIndex = colStrToNum(match[1]);
    const rowIndex = parseInt(match[2], 10) - 1; // 轉為 0-based
    return { row: rowIndex, col: colIndex };
}

// 2. 取得儲存格的值
function getCellValue(rowIdx, colIdx) {
    const rows = dataTable.querySelectorAll('tbody tr');
    if (!rows[rowIdx]) return "";
    // 記得要加 1，因為第 0 欄是左側的數字標題 (th.sticky-left)
    const td = rows[rowIdx].children[colIdx + 1]; 
    if (!td) return "";
    
    const inner = td.querySelector('.td-inner');
    if (!inner) return "";
    
    // 優先抓計算結果，轉為數字方便計算
    let val = inner.innerText.trim();
    const num = parseFloat(val);
    return isNaN(num) ? val : num;
}

// 3. 解析範圍：支援 "A1"、"A1:A3"、"A:A" (整欄) 與 "1:1" (整列)
function getRangeValues(rangeStr) {
    const parts = rangeStr.split(':');
    
    // 處理單一儲存格，例如 A1
    if (parts.length === 1) {
        const cell = parseCellReference(parts[0]);
        return cell ? [getCellValue(cell.row, cell.col)] : [];
    }
    
    if (parts.length === 2) {
        const str1 = parts[0].toUpperCase().trim();
        const str2 = parts[1].toUpperCase().trim();

        // 處理【整欄參照】，例如 A:A 或 A:C
        if (/^[A-Z]+$/.test(str1) && /^[A-Z]+$/.test(str2)) {
            const minCol = Math.min(colStrToNum(str1), colStrToNum(str2));
            const maxCol = Math.max(colStrToNum(str1), colStrToNum(str2));
            const maxRow = dataTable.querySelectorAll('tbody tr').length - 1;
            
            const values = [];
            for (let r = 0; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    values.push(getCellValue(r, c));
                }
            }
            return values;
        }
        
        // 處理【整列參照】，例如 1:1 或 2:5
        if (/^\d+$/.test(str1) && /^\d+$/.test(str2)) {
            const minRow = Math.min(parseInt(str1, 10) - 1, parseInt(str2, 10) - 1);
            const maxRow = Math.max(parseInt(str1, 10) - 1, parseInt(str2, 10) - 1);
            // 取得目前的總欄數
            const maxCol = dataTable.querySelector('thead tr').children.length - 2; 

            const values = [];
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = 0; c <= maxCol; c++) {
                    values.push(getCellValue(r, c));
                }
            }
            return values;
        }

        // 處理【區塊參照】，例如 A1:B5
        const start = parseCellReference(str1);
        const end = parseCellReference(str2);
        if (!start || !end) return [];
        
        const values = [];
        const minRow = Math.min(start.row, end.row);
        const maxRow = Math.max(start.row, end.row);
        const minCol = Math.min(start.col, end.col);
        const maxCol = Math.max(start.col, end.col);
        
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                values.push(getCellValue(r, c));
            }
        }
        return values;
    }
    return [];
}

// 4. 定義支援的函數庫
const formulaFunctions = {
    // 字數計算：=LEN(A1)
    LEN: (args) => {
        if (!args[0]) return 0;
        const cell = parseCellReference(args[0]);
        if (!cell) return 0;
        const val = getCellValue(cell.row, cell.col);
        // 將值轉為字串
        const strVal = String(val);
        // 使用 ES6 展開運算子 [...str]，正確解析 Unicode 擴充漢字
        // 這樣「𠊎」就會被正確計算為 1 個字
        return [...strVal].length;
    },

	// 特定字元計數：=COUNTCHAR(A1, "蘋果")
    COUNTCHAR: (args) => {
        // 確保使用者有輸入儲存格與要找的字元
        if (args.length < 2) return "錯誤: 參數不足";
        
        // 解析儲存格座標
        const cell = parseCellReference(args[0]);
        if (!cell) return "錯誤: 參照無效";
        
        // 取得儲存格內容並強制轉為純字串
        const val = String(getCellValue(cell.row, cell.col));
        
        // 取得要尋找的目標字元，並移除前後可能帶有的單引號或雙引號
        const targetChar = args[1].replace(/^["']|["']$/g, "");
        
        // 如果要找的字元是空的，直接回傳 0
        if (!targetChar) return 0;
        
        // 利用 split 方法切割字串，陣列長度減 1 即為出現次數
        // 例如 "A-B-A".split("-") 會變成 ["A", "B", "A"] (長度3)，出現次數為 2
        return val.split(targetChar).length - 1;
    },

	// 精確比對：=EXACT(A1, B1) 或 =EXACT(A1, "測試")
    EXACT: (args) => {
        // 確保使用者有輸入兩個參數來進行比對
        if (args.length < 2) return "錯誤: 參數不足";
        
        // 建立一個內部小工具：用來判斷參數是「儲存格」還是「純文字」
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) {
                // 如果是合法座標，去表格抓值出來
                return String(getCellValue(cell.row, cell.col));
            }
            // 如果不是座標，就把前後可能帶有的單引號或雙引號拿掉，當作純文字
            return arg.replace(/^["']|["']$/g, "");
        };

        // 取得兩個參數的實際文字內容
        const val1 = resolveArg(args[0]);
        const val2 = resolveArg(args[1]);

        // 嚴格比對兩者是否完全相同 (區分大小寫)
        return val1 === val2 ? "O" : "X";
    },
    // 總和計算 (贈送的基礎功能)：=SUM(A1:A5)
    SUM: (args) => {
        if (!args[0]) return 0;
        const values = getRangeValues(args[0]);
        return values.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
    },

    // 條件計數：=COUNTIF(A1:A5, ">10") 或 =COUNTIF(A1:A5, "蘋果")
    COUNTIF: (args) => {
        if (args.length < 2) return "錯誤: 參數不足";
        const values = getRangeValues(args[0]);
        const condition = args[1].replace(/["']/g, "").trim(); // 移除引號
        
        return values.filter(val => {
            // 處理運算子條件 (如 >10, <=5)
            const match = condition.match(/^(>=|<=|>|<|=)?(.+)$/);
            if (match) {
                const operator = match[1] || '===';
                const targetValue = parseFloat(match[2]);
                
                if (!isNaN(targetValue) && typeof val === 'number') {
                    switch(operator) {
                        case '>': return val > targetValue;
                        case '<': return val < targetValue;
                        case '>=': return val >= targetValue;
                        case '<=': return val <= targetValue;
                        case '=': case '===': return val === targetValue;
                    }
                }
            }
            // 純文字比對
            return String(val) === condition;
        }).length;
    }
};

// 5. 解析並執行公式字串
// 5. 解析並執行公式字串 (支援簡寫)
function evaluateFormula(formulaStr) {
    // 移除等號並轉大寫：=len(a1) 或 =l(a1) -> LEN(A1) 或 L(A1)
    const cleanFormula = formulaStr.substring(1).trim().toUpperCase(); 
    
    // 簡單正則解析：找尋 函數名(參數)
    const match = cleanFormula.match(/^([A-Z]+)\((.*)\)$/);
    if (!match) return "錯誤: 語法無效";
    
    let funcName = match[1];
    // 將參數以逗號分隔，並移除多餘空白
    const args = match[2].split(',').map(arg => arg.trim()); 
    
    // ======== 新增：函數簡寫對照表 (Alias Dictionary) ========
    const aliases = {
        'L': 'LEN',
        'S': 'SUM',
        'CI': 'COUNTIF',
        'CC': 'COUNTCHAR',
        'E': 'EXACT'
    };
    
    // 如果輸入的名稱在簡寫字典中找得到，就將其轉換為完整的函數名稱
    if (aliases[funcName]) {
        funcName = aliases[funcName];
    }
    // =========================================================
    
    // 檢查轉換後的函數是否存在於我們的函數庫中
    if (formulaFunctions[funcName]) {
        try {
            return formulaFunctions[funcName](args);
        } catch (e) {
            return "錯誤: 計算失敗";
        }
    } else {
        return "錯誤: 找不到函數";
    }
}


/* ==========================================
   綁定公式行為到 UI 介面
   ========================================== */

// 處理 Focus：進入編輯時，如果背後有公式，顯示公式讓使用者編輯
dataTable.addEventListener('focusin', (e) => {
    if (e.target.classList.contains('td-inner')) {
        const formula = e.target.getAttribute('data-formula');
        if (formula) {
            e.target.innerText = formula;
        }
    }
});

// 處理 Blur：離開編輯時，檢查是否為公式並計算
dataTable.addEventListener('focusout', (e) => {
    if (e.target.classList.contains('td-inner')) {
        const text = e.target.innerText.trim();
        
        // 1. 先處理當前編輯的儲存格
        if (text.startsWith('=')) {
            e.target.setAttribute('data-formula', text);
        } else {
            // 如果改回普通文字，記得清除公式標記
            e.target.removeAttribute('data-formula');
        }
        
        // 2. 觸發全表重新計算，確保所有相依的儲存格 (如 B1) 都更新
        recalculateAllFormulas();
        
        // 3. 儲存最新狀態到 localStorage
        localStorage.setItem(STORAGE_KEY, extractTextFromTable());
        debouncedSaveHistory();
    }
});



// 全域重新計算函數，確保所有公式都能同步更新
function recalculateAllFormulas() {
    // 找出表格中所有的儲存格內容區塊
    const cells = dataTable.querySelectorAll('.td-inner');
    
    cells.forEach(cell => {
        // 優先讀取背後的公式，如果沒有，就讀取畫面上的文字
        let content = cell.getAttribute('data-formula') || cell.innerText.trim();
        
        // 如果確定這是一個公式
        if (content.startsWith('=')) {
            // 確保屬性有被正確標記，以便下次讀取
            cell.setAttribute('data-formula', content);
            // 執行計算並將結果顯示在畫面上
            cell.innerText = evaluateFormula(content);
        }
    });
}











/* ==========================================
   公式相對參照平移引擎
   ========================================== */

// 將欄位字母與數字平移指定的偏移量
function shiftCellReference(ref, rowOffset, colOffset) {
    const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
    if (!match) return ref;

    let colStr = match[1];
    let rowStr = match[2];

    // 將字母轉為數字索引 (A=0, B=1...)
    let colIndex = 0;
    for (let i = 0; i < colStr.length; i++) {
        colIndex = colIndex * 26 + (colStr.charCodeAt(i) - 64);
    }
    colIndex -= 1;

    let rowIndex = parseInt(rowStr, 10) - 1;

    // 加上偏移量
    let newColIndex = colIndex + colOffset;
    let newRowIndex = rowIndex + rowOffset;

    // 如果平移後超出邊界 (例如 A1 往左移)，回傳錯誤參照
    if (newColIndex < 0 || newRowIndex < 0) return "#REF!";

    // 將新數字轉換回字母 (0=A, 25=Z, 26=AA...)
    let newColStr = '';
    let tempCol = newColIndex + 1;
    while (tempCol > 0) {
        let remainder = (tempCol - 1) % 26;
        newColStr = String.fromCharCode(65 + remainder) + newColStr;
        tempCol = Math.floor((tempCol - 1) / 26);
    }

    return newColStr + (newRowIndex + 1);
}

// 掃描公式並取代所有座標
function shiftFormula(formula, rowOffset, colOffset) {
    if (!formula.startsWith('=')) return formula;

    // 尋找大寫字母配上數字的組合 (例如 A1, Z99)
    return formula.replace(/[A-Z]+\d+/g, (match) => {
        return shiftCellReference(match, rowOffset, colOffset);
    });
}
init();