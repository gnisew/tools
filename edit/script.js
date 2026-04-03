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

const cellEditor = document.getElementById('cellEditor');

const mirror = document.createElement('div');
mirror.style.position = 'absolute'; mirror.style.visibility = 'hidden';
mirror.style.pointerEvents = 'none'; mirror.style.top = '0'; mirror.style.left = '0';
document.body.appendChild(mirror);

const STORAGE_KEY = 'wesing-editor-content';
const MODE_KEY = 'wesing-editor-mode';
const COL_NAMES_KEY = 'wesing-col-names'; 
const FONT_SIZE_KEY = 'wesing-font-size';
const LINE_HEIGHT_KEY = 'wesing-line-height';
const COL_WIDTHS_KEY = 'wesing-col-widths';
const WORD_WRAP_KEY = 'wesing-word-wrap'; 
const EDITOR_WIDTH_KEY = 'wesing-editor-width';
const FREEZE_ROWS_KEY = 'wesing-freeze-rows';
const SHOW_TEXT_LINE_NUMBERS_KEY = 'wesing-show-line-numbers';
const ROW_NUM_ALIGN_KEY = 'wesing-row-num-align';
let isShowTextLineNumbers = true;

let currentMode = 'text';

const FIND_TEXT_KEY = 'wesing-find-text';
const REPLACE_TEXT_KEY = 'wesing-replace-text';

const TABS_DATA_KEY = 'wesing-tabs-data';
const ACTIVE_TAB_KEY = 'wesing-active-tab';

let sheetTabs = [];
let activeSheetIndex = 0;

// 建立一個全域物件，用來儲存各個範圍的「抽籤袋」
window.randBags = {};

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

const ENTER_ACTION_KEY = 'wesing-enter-action';
const ENTER_DIRECTION_KEY = 'wesing-enter-direction';

const FONT_FAMILY_KEY = 'wesing-font-family';

/* 工具列元件初始化 */
function initDropdowns() {
    // 共用的邊界偵測函數
    function adjustMenuPosition(menu) {
        if (!menu.classList.contains('show')) return;
        
        // 1. 判斷選單 HTML 裡原本是不是設定靠右對齊 (right-0)
        const isRightAligned = menu.classList.contains('right-0');
        
        // 2. 重置所有可能被動態修改過的樣式 (確保每次展開都重新計算)
        menu.style.left = isRightAligned ? 'auto' : '0px';
        menu.style.right = isRightAligned ? '0px' : 'auto';
        menu.style.top = '100%';          // 預設向下展開
        menu.style.bottom = 'auto';
        menu.style.marginTop = '4px';     // 對應原本 Tailwind 的 mt-1
        menu.style.marginBottom = '0px';
        menu.style.maxHeight = '';        // 清除可能殘留的高度限制
        menu.style.transform = 'none';

        // 3. 取得選單在螢幕上的真實位置與視窗大小
        let rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const padding = 8; // 距離螢幕邊緣保留 8px 的安全距離

        // 4. 動態修正：水平方向 (如果超出右邊界)
        if (rect.right > viewportWidth) {
            menu.style.left = 'auto';
            menu.style.right = '0px'; 
            
            // 再次檢查如果改靠右後，反而超出左邊界
            rect = menu.getBoundingClientRect();
            if (rect.left < 0) {
                menu.style.right = 'auto';
                const parentLeft = menu.parentElement.getBoundingClientRect().left;
                menu.style.left = `-${parentLeft - padding}px`; 
            }
        } 
        // 5. 動態修正：水平方向 (如果一開始就超出左邊界)
        else if (rect.left < 0) {
            menu.style.right = 'auto';
            const parentLeft = menu.parentElement.getBoundingClientRect().left;
            menu.style.left = `-${parentLeft - padding}px`;
        }

        rect = menu.getBoundingClientRect();
        if (rect.bottom > viewportHeight) {
            const parentRect = menu.parentElement.getBoundingClientRect();
            const spaceBelow = viewportHeight - parentRect.bottom;
            const spaceAbove = parentRect.top;

            // 如果上方空間大於下方空間，且選單高度塞不下下方，則改為「向上展開」
            if (spaceAbove > spaceBelow && rect.height > spaceBelow) {
                menu.style.top = 'auto';
                menu.style.bottom = '100%';
                menu.style.marginTop = '0px';
                menu.style.marginBottom = '4px'; // 留一點空隙
                // 限制最大高度，避免往上也超出視窗
                menu.style.maxHeight = `${spaceAbove - padding}px`;
            } else {
                // 否則維持向下展開，但強制縮小它的高度，讓它可以內部正常滾動
                menu.style.maxHeight = `${spaceBelow - padding}px`;
            }
        }
    }
    // 1. 處理主要展開按鈕 (第一層)
    document.querySelectorAll('.dropdown-container').forEach(container => {
        const btn = container.querySelector('.dropdown-btn');
        const menu = container.querySelector('.dropdown-menu');
        
        if (btn && menu) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                // 關閉其他不相關的選單
                document.querySelectorAll('.dropdown-menu.show, .action-menu.show').forEach(m => { 
                    if (m !== menu && !menu.contains(m)) m.classList.remove('show'); 
                });
                menu.querySelectorAll('.group\\/submenu').forEach(s => s.classList.remove('mobile-open'));
                
                menu.classList.toggle('show');
                
                // 觸發邊界偵測
                adjustMenuPosition(menu);
            });
        }
    });

    // 2. 處理子選單 (group/submenu) 的點擊展開 (專為行動裝置設計)
    document.querySelectorAll('.group\\/submenu').forEach(submenu => {
        const header = submenu.querySelector('div:first-child');
        if (header) {
            header.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.stopPropagation(); 
                    const parentMenu = submenu.closest('.dropdown-menu');
                    if (parentMenu) {
                        parentMenu.querySelectorAll('.group\\/submenu').forEach(s => {
                            if (s !== submenu) s.classList.remove('mobile-open');
                        });
                    }
                    submenu.classList.toggle('mobile-open');
                }
            });
        }
    });

    // 3. 處理所有點擊選項 (最終選項)
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const parentDataContainer = item.closest('[id^="dd-"]');
            
            if (parentDataContainer) {
                parentDataContainer.querySelectorAll('.dropdown-item .check-icon').forEach(i => i.classList.remove('active'));
                const myCheck = item.querySelector('.check-icon');
                if (myCheck) myCheck.classList.add('active');
                parentDataContainer.dispatchEvent(new CustomEvent('change', { detail: { value: item.dataset.value } }));
            }

            document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
            document.querySelectorAll('.group\\/submenu').forEach(s => s.classList.remove('mobile-open'));
        });
    });

    // 4. 處理 action-dropdown (例如：新增欄列、清除刪除選單)
    document.querySelectorAll('.action-dropdown .action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = btn.nextElementSibling;
            document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => { if (m !== menu) m.classList.remove('show'); });
            
            menu.classList.toggle('show');
            
            // 觸發邊界偵測
            adjustMenuPosition(menu);
        });
    });

    // 5. 點擊空白處關閉選單
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
        document.querySelectorAll('.group\\/submenu').forEach(s => s.classList.remove('mobile-open'));
        if (!e.target.closest('#colMenu') && !e.target.closest('.btn-col-menu')) {
            const colMenu = document.getElementById('colMenu');
            if(colMenu) colMenu.classList.remove('show');
        }
        if (!e.target.closest('#rowMenu') && !e.target.closest('.btn-row-menu')) {
            const rowMenu = document.getElementById('rowMenu');
            if(rowMenu) rowMenu.classList.remove('show');
        }
        if (!e.target.closest('#tabMenu') && !e.target.closest('.tab-menu-btn')) {
            const tabMenu = document.getElementById('tabMenu');
            if(tabMenu) tabMenu.classList.remove('show');
        }
    });
}

	// 讀取 Enter 鍵偏好設定
    const savedEnterAction = localStorage.getItem(ENTER_ACTION_KEY) || 'confirm';
    setDropdownValue('dd-enterAction', savedEnterAction);
    document.getElementById('enterActionIcon').textContent = savedEnterAction === 'confirm' ? 'check_circle' : 'keyboard_return';

    const savedEnterDirection = localStorage.getItem(ENTER_DIRECTION_KEY) || 'down';
    setDropdownValue('dd-enterDirection', savedEnterDirection);
    const dirIconMap = { 'down': 'arrow_downward', 'right': 'arrow_forward', 'stay': 'pan_tool' };
    document.getElementById('enterDirectionIcon').textContent = dirIconMap[savedEnterDirection];


// 行動版多選模式按鈕切換邏輯 (結合至設定選單)
const btnToggleMultiSelect = document.getElementById('btnToggleMultiSelect');
const multiSelectText = document.getElementById('multiSelectText'); 
if (btnToggleMultiSelect) {
    btnToggleMultiSelect.addEventListener('click', (e) => {
        isMobileMultiSelect = !isMobileMultiSelect;
        
        // 切換選單項目的外觀與文字
        if (isMobileMultiSelect) {
            btnToggleMultiSelect.classList.add('bg-blue-50', 'text-blue-600');
            btnToggleMultiSelect.classList.remove('text-gray-700');
            if (multiSelectText) multiSelectText.textContent = '取消多選 (模擬 Ctrl)';
        } else {
            btnToggleMultiSelect.classList.remove('bg-blue-50', 'text-blue-600');
            btnToggleMultiSelect.classList.add('text-gray-700');
            if (multiSelectText) multiSelectText.textContent = '啟用多選 (模擬 Ctrl)';
        }
        
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


const savedRowNumAlign = localStorage.getItem(ROW_NUM_ALIGN_KEY) || 'middle';
    document.documentElement.style.setProperty('--row-num-valign', savedRowNumAlign);
    setDropdownValue('dd-rowNumAlign', savedRowNumAlign);
    const rowNumIcon = document.getElementById('rowNumAlignIcon');
    if (rowNumIcon) {
        rowNumIcon.textContent = savedRowNumAlign === 'top' ? 'vertical_align_top' : (savedRowNumAlign === 'bottom' ? 'vertical_align_bottom' : 'vertical_align_center');
    }
    const savedFont = localStorage.getItem(FONT_FAMILY_KEY);
    if (savedFont) {
        document.documentElement.style.setProperty('--main-font', savedFont);
        setDropdownValue('dd-fontFamily', savedFont);
    }

	const savedWidth = localStorage.getItem(EDITOR_WIDTH_KEY) || '800px';
    mainContainer.style.maxWidth = savedWidth;
    if (document.getElementById('dd-editorWidth')) {
        setDropdownValue('dd-editorWidth', savedWidth);
    }
    
    if (savedWidth === '100%') {
        document.body.classList.add('full-width-mode');
    } else {
        document.body.classList.remove('full-width-mode');
    }

    if (savedWidth) {
        mainContainer.style.transition = 'none';
        mainContainer.style.maxWidth = savedWidth;
        if (document.getElementById('dd-editorWidth')) {
             setDropdownValue('dd-editorWidth', savedWidth);
        }
        void mainContainer.offsetWidth;
        mainContainer.style.transition = '';
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

    loadTabsData();
    renderSheetTabs();
    
    // 載入當前作用中的頁籤內容
    editor.value = sheetTabs[activeSheetIndex].content;
    // 讀取網址參數，決定初始模式 
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('mode')) {
        const modeParam = urlParams.get('mode');
        if (modeParam === 'txt') {
            currentMode = 'text';
        } else if (modeParam === 'sheet') {
            currentMode = 'table';
        } else if (modeParam === 'chat') {
            currentMode = 'chat';
        }
        // 同步更新記憶體中該頁籤的狀態，避免存檔時跑掉
        sheetTabs[activeSheetIndex].mode = currentMode;
    }
    switchMode(currentMode, true);
    
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
	requestAnimationFrame(() => {
			mainContainer.style.opacity = '1';
	});
}

document.getElementById('dd-viewMode').addEventListener('change', (e) => switchMode(e.detail.value));

/* ==========================================
   網址參數同步功能
========================================== */
function updateUrlModeParam(internalMode) {
    // 將內部模式對應到你要的網址參數
    let urlMode = 'txt';
    if (internalMode === 'table') urlMode = 'sheet';
    else if (internalMode === 'chat') urlMode = 'chat';
    
    const newUrl = new URL(window.location.href);
    
    // 如果目前的網址參數不等於目標參數，就進行更新 (不重新載入頁面)
    if (newUrl.searchParams.get('mode') !== urlMode) {
        newUrl.searchParams.set('mode', urlMode);
        window.history.replaceState({}, '', newUrl);
    }
}

/* ==========================================
   全域模式切換核心 (支援無縫資料轉移)
========================================== */
function switchMode(mode, isForce = false) {
    if (currentMode === mode && !isForce) return;

    // 🌟 核心：離開特定模式時的資料提取與無縫轉移
    if (!isForce) {
        if (currentMode === 'table' && mode !== 'table') {
            editor.value = extractTextFromTable();
        } else if (currentMode === 'chat' && mode !== 'chat') {
            // 離開對話模式時，將對話紀錄轉為 TSV 表格格式
            const chatExtracted = extractTextFromChat();
            if (chatExtracted && chatExtracted.trim() !== '') {
                editor.value = chatExtracted;
                debouncedSaveHistory(); // 存檔，讓轉換後的表格支援復原
            }
        }
    }

    currentMode = mode; 
    localStorage.setItem(MODE_KEY, mode);
    updateUrlModeParam(mode);
    hideFloatingTool(); 
    clearTableSelection();

    const ddTextTool = document.getElementById('dd-textTool');
    const btnToggleLineNumbersTextMode = document.getElementById('btnToggleLineNumbersTextMode');
    const chatModeContainer = document.getElementById('chatModeContainer');

    // 隱藏所有容器，後面再根據模式顯示
    textModeContainer.style.display = 'none'; 
    tableModeContainer.style.display = 'none';
    chatModeContainer.classList.add('hidden');
    chatModeContainer.style.display = 'none';

    if (mode === 'table') {
        renderTableFromText(editor.value);
        applyFreeze();
        tableModeContainer.style.display = 'block';
        tableControls.classList.remove('hidden'); 
        tableControls.classList.add('flex');
        if (ddTextTool) ddTextTool.classList.add('hidden');
        if (btnToggleLineNumbersTextMode) btnToggleLineNumbersTextMode.classList.add('hidden');
    } else if (mode === 'chat') {
        chatModeContainer.classList.remove('hidden');
        chatModeContainer.style.display = 'flex';
        tableControls.classList.add('hidden');
        if (ddTextTool) ddTextTool.classList.add('hidden');
        if (btnToggleLineNumbersTextMode) btnToggleLineNumbersTextMode.classList.add('hidden');
        setTimeout(() => document.getElementById('chatInput').focus(), 100);
        
        if (typeof updateChatPivotOptions === 'function') updateChatPivotOptions();
        
        // 🌟 新增：切換回對話模式時，將目前的文字重新渲染成氣泡
        if (typeof window.renderChatFromText === 'function') {
            window.renderChatFromText(editor.value);
        }
    } else {
        textModeContainer.style.display = 'flex';
        tableControls.classList.add('hidden');
        if (ddTextTool) ddTextTool.classList.remove('hidden');
        if (btnToggleLineNumbersTextMode) btnToggleLineNumbersTextMode.classList.remove('hidden');
        updateLineNumbers();
    }
    setDropdownValue('dd-viewMode', mode);
}

/* 復原系統 (Undo) */
function debouncedSaveHistory() {
    clearTimeout(saveTimeout);
    const textLength = editor.value.length;
    const delayTime = textLength > 50000 ? 1500 : 500; 
    saveTimeout = setTimeout(saveHistoryState, delayTime);
}

function saveHistoryState() {
    if (isUndoing) return;
    
    let text = editor.value;
    if (currentMode === 'table') {
        text = extractTextFromTable();
    } else if (currentMode === 'chat') {
        text = typeof extractTextFromChat === 'function' ? extractTextFromChat() : editor.value;
    }
    
    if (historyStack.length === 0 || historyStack[historyStack.length - 1] !== text) {
        historyStack.push(text);
        
        // 【優化 1：動態調整復原次數】
        const maxHistory = text.length > 50000 ? 5 : 10;
        if (historyStack.length > maxHistory) {
            historyStack.shift(); 
        }
    }

    // 【優化 2：針對巨量資料，延遲或略過寫入 localStorage】
    if (text.length < 100000) {
        saveAllTabsData(); // 正常資料量，安全存檔
    } else {
        // 超大資料量：我們只更新當前頁籤物件的內容，但不立即觸發 localStorage.setItem
        sheetTabs[activeSheetIndex].content = text;
        sheetTabs[activeSheetIndex].history = historyStack;
        sheetTabs[activeSheetIndex].mode = currentMode;
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
    let maxCols = 1; 
    parsedRows.forEach(row => { if (row.length > maxCols) maxCols = row.length; });

    const savedNames = loadColNames();
    const savedWidths = loadColWidths();

    // 1. 先快速建立好表頭 (thead) 與空的表格主體 (tbody)
    let theadHtml = '<thead><tr><th class="sticky-corner"></th>';
    for (let i = 0; i < maxCols; i++) { 
        const name = savedNames[i] || '';
        const width = savedWidths[i] || '150px';
        theadHtml += `<th class="sticky-top group" data-col="${i}" data-col-name="${name}" style="width: ${width}; min-width: ${width}; max-width: ${width};">${createThColHTML(i)}</th>`; 
    }
    theadHtml += '</tr></thead><tbody></tbody>';
    dataTable.innerHTML = theadHtml;

    const tbody = dataTable.querySelector('tbody');
    let currentRowIndex = 0;
    const CHUNK_SIZE = 500; // 每次產生 500 行，可依據效能微調

    if (typeof showToast === 'function' && parsedRows.length > 1000) {
        showToast('⏳ 巨量資料載入中，請稍候...');
    }

    // 2. 建立分批渲染函數
    function renderChunk() {
        // 使用 DocumentFragment 在記憶體中組裝 DOM，效能極高
        const fragment = document.createDocumentFragment();
        const endRow = Math.min(currentRowIndex + CHUNK_SIZE, parsedRows.length);

        for (let r = currentRowIndex; r < endRow; r++) {
            const rowData = parsedRows[r];
            const tr = document.createElement('tr');
            
            // 建立左側行號
            const th = document.createElement('th');
            th.className = 'sticky-left group';
            th.innerHTML = createThRowHTML(r);
            tr.appendChild(th);

            // 建立資料欄位
            for (let i = 0; i < maxCols; i++) {
                const td = document.createElement('td');
                const safeText = (rowData[i] !== undefined ? rowData[i] : '')
                                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                
                // 直接指派 innerHTML 比一再 createElement 更快
                td.innerHTML = `<div class="td-inner" contenteditable="true">${safeText}</div>`;
                tr.appendChild(td);
            }
            fragment.appendChild(tr);
        }

        // 將這 500 行一次性塞入真實網頁中
        tbody.appendChild(fragment);
        currentRowIndex = endRow;

        // 3. 判斷是否還有資料未渲染
        if (currentRowIndex < parsedRows.length) {
            // 利用 requestAnimationFrame 讓瀏覽器喘口氣，避免畫面凍結
            requestAnimationFrame(renderChunk);
        } else {
            // 4. 全部載入完畢後，執行後續設定
            updateTableHeaders();
            recalculateAllFormulas();
            if (typeof showToast === 'function' && parsedRows.length > 1000) {
                showToast('✅ 表格載入完成！');
            }
        }
    }

    // 啟動第一次的渲染
    renderChunk();
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

// ==========================================
// 將對話模式的氣泡內容轉換為 TSV 表格格式
// A欄: 使用者輸入 | B欄: 翻譯結果 | C欄: 拼音
// ==========================================
function extractTextFromChat() {
    const wrappers = document.querySelectorAll('#chatMessagesArea .chat-message-wrapper');
    // 如果對話區是空的，就保留原本編輯器裡的內容
    if (wrappers.length === 0) return editor.value; 

    let tsvData = [];
    let currentUserText = "";

    // 處理 TSV 儲存格安全跳脫 (包含換行、引號或Tab時加上雙引號)
    const escapeTSV = (text) => {
        if (!text) return "";
        if (text.includes('"') || text.includes('\n') || text.includes('\t')) {
            return '"' + text.replace(/"/g, '""') + '"';
        }
        return text;
    };

    // 加上自動標題列 (如果你覺得不需要標題，可以把這行註解掉)
    tsvData.push(["原文", "翻譯", "拼音"].join('\t'));

    wrappers.forEach(wrapper => {
        const userBubble = wrapper.querySelector('.chat-bubble-user');
        const systemBubble = wrapper.querySelector('.chat-bubble-system');

        if (userBubble) {
            // 如果連續兩次都是使用者發言(無系統回覆)，先把上一次的推進去
            if (currentUserText) {
                tsvData.push([escapeTSV(currentUserText), "", ""].join('\t'));
            }
            currentUserText = userBubble.innerText.trim();
        } else if (systemBubble) {
            const systemText = systemBubble.innerText.trim();
            // 以換行符號切割系統訊息。第一行通常是翻譯，剩下的通常是拼音
            const parts = systemText.split('\n');
            const translation = parts[0] || "";
            // 將剩下的拼音行合併
            const pinyin = parts.slice(1).join('\n') || ""; 

            if (currentUserText) {
                // 湊齊一組：使用者 -> 翻譯 -> 拼音
                tsvData.push([escapeTSV(currentUserText), escapeTSV(translation), escapeTSV(pinyin)].join('\t'));
                currentUserText = ""; // 重置，等待下一個使用者發言
            } else {
                // 只有系統發言 (例如：剛開始的錯誤訊息或例外狀況)
                tsvData.push(["", escapeTSV(translation), escapeTSV(pinyin)].join('\t'));
            }
        }
    });

    // 處理最後可能遺留的使用者訊息 (還沒等到系統回覆就切換模式)
    if (currentUserText) {
        tsvData.push([escapeTSV(currentUserText), "", ""].join('\t'));
    }

    return tsvData.join('\n');
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






// ==========================================
// 編輯器專屬：複製與貼上邏輯 (修復選單開關與單格判定)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const tableContainer = document.getElementById('tableModeContainer');
    const btnPasteValue = document.getElementById('btn-paste-value');
    const pasteGroup = document.getElementById('dd-clipboard-group');

    // 輔助函數：判斷目前是否為表格模式
    function isTableModeActive() {
        return tableContainer && window.getComputedStyle(tableContainer).display !== 'none';
    }

    // 1. 動態控制「貼上為值」的按鈕狀態
    if (pasteGroup) {
        const pasteActionBtn = pasteGroup.querySelector('.action-btn');
        if (pasteActionBtn) {
            pasteActionBtn.addEventListener('click', () => {
                if (isTableModeActive()) {
                    if (btnPasteValue) {
                        btnPasteValue.disabled = false;
                        btnPasteValue.title = "貼上純文字並清除公式";
                    }
                } else {
                    if (btnPasteValue) {
                        btnPasteValue.disabled = true;
                        btnPasteValue.title = "僅在表格模式可用";
                    }
                }
            });
        }
    }

    // 2. 取得表格單格內容的輔助函數 (解決焦點被工具列搶走的問題)
    function getSingleCellContent() {
        const rows = dataTable.querySelectorAll('tbody tr');
        let targetInner = null;
        // 利用系統全域變數 lastClickedCell 來回溯目標
        if (typeof lastClickedCell !== 'undefined' && lastClickedCell && rows[lastClickedCell.r]) {
            targetInner = rows[lastClickedCell.r].children[lastClickedCell.c + 1]?.querySelector('.td-inner');
        }
        if (targetInner) {
            return targetInner.hasAttribute('data-formula') ? targetInner.getAttribute('data-formula') : (targetInner.innerText || targetInner.textContent).trim();
        }
        return '';
    }

    // 3. 綁定「複製」相關動作
    document.querySelectorAll('#dd-clipboard-group button[data-action^="copy"], #dd-clipboard-group button[data-action="select-all"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            // 【修復 1】只移除 class，絕不加上 style="display:none"
            const menu = btn.closest('.action-menu');
            if (menu) menu.classList.remove('show');
            
            const action = btn.dataset.action;
            
            if (action === 'select-all') {
                if (isTableModeActive()) {
                    if (typeof selectAllTable === 'function') selectAllTable();
                } else if (editor) { 
                    editor.focus(); editor.select(); 
                }
                return;
            }
            
            if (action === 'copy-all') {
                if (isTableModeActive()) {
                    if (typeof selectAllTable === 'function') selectAllTable();
                } else if (editor) { 
                    editor.focus(); editor.select(); 
                }
                
                // 稍微延遲讓 DOM 更新選取狀態後再複製
                setTimeout(async () => {
                    if (isTableModeActive() && typeof copySelectedTableData === 'function') {
                        copySelectedTableData();
                    } else {
                        document.execCommand('copy');
                        if (typeof showToast === 'function') showToast('✅ 內容已複製！');
                    }
                }, 50);
                return;
            }
            
            if (action === 'copy-selected') {
                if (isTableModeActive()) {
                    // 【修復 2】判斷是否有多選
                    const isMultiSelect = selectedRows.length > 0 || selectedCols.length > 0 || selectedCellBlocks.length > 0;
                    
                    if (isMultiSelect) {
                        // 呼叫系統原本的強大多選複製引擎
                        if (typeof copySelectedTableData === 'function') copySelectedTableData();
                    } else {
                        // 單格複製
                        const textToCopy = getSingleCellContent();
                        if (textToCopy) {
                            try {
                                await navigator.clipboard.writeText(textToCopy);
                                if (typeof showToast === 'function') showToast('✅ 儲存格內容已複製！');
                            } catch (err) {
                                console.error('複製失敗:', err);
                            }
                        } else {
                            if (typeof showToast === 'function') showToast('沒有可複製的內容。');
                        }
                    }
                } else {
                    document.execCommand('copy');
                    if (typeof showToast === 'function') showToast('✅ 文字已複製！');
                }
            }
        });
    });

    // 4. 綁定「貼上」相關動作
    // 綁定貼上選單動作
	document.querySelectorAll('#dd-clipboard-group button[data-action^="paste"]').forEach(btn => {
		btn.addEventListener('click', async (e) => {
			e.stopPropagation();
			if (btn.disabled) return;
			
			const menu = btn.closest('.action-menu');
			if (menu) menu.classList.remove('show');

			const isPasteValue = btn.dataset.action === 'paste-value';

			try {
				const rawText = await navigator.clipboard.readText();
				if (!rawText) return;

				// 1. 消除 Windows 剪貼簿的 \r\n 造成的雙重換行 bug
				let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
				// 2. 將所有連續兩個以上的換行 (中間可能夾雜空白) 強制縮減為單一換行
				text = text.replace(/\n\s*\n/g, '\n');

				if (currentMode === 'text') {
					editor.focus(); 
					document.execCommand('insertText', false, text);
					showToast('✅ 內容已貼上！');
				} else {
					// 傳遞貼上為值模式給 handleTablePaste
					window.isPasteValueMode = isPasteValue;
					const data = parseTSV(text);
					
					if (data.length > 1 || (data[0] && data[0].length > 1) || selectedRows.length > 0 || selectedCols.length > 0 || selectedCellBlocks.length > 0) {
						handleTablePaste(text);
					} else {
						const activeInner = document.activeElement.closest('.td-inner');
						if (activeInner && dataTable.contains(activeInner)) {
							activeInner.focus(); 
							document.execCommand('insertText', false, text);
							if (isPasteValue) activeInner.removeAttribute('data-formula');
							debouncedSaveHistory();
						} else { 
							handleTablePaste(text); 
						}
					}
					// 用完恢復預設狀態
					window.isPasteValueMode = false;
					showToast(isPasteValue ? '✅ 內容已貼上 (純文字)！' : '✅ 內容已貼上！');
				}
			} catch (err) {
				showToast('❌ 無法讀取剪貼簿，請使用快捷鍵 Ctrl+V');
			}
		});
	});
});




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
    
    updateTableHeaders(); 
    saveColNames(); 
    saveColWidths(); 
    debouncedSaveHistory(); 
    applyFreeze();
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
    
    updateTableHeaders(); 
    debouncedSaveHistory(); 
    applyFreeze();
}



/* 智慧清除與刪除 */
function handleClearAction() {
    // �文字模式下的 Delete 功能
    if (currentMode === 'text') {
        const editor = document.getElementById('editor');
        if (editor && editor.selectionStart !== editor.selectionEnd) {
            // 刪除選取文字，並將游標停留在刪除處
            editor.setRangeText('', editor.selectionStart, editor.selectionEnd, 'end');
            editor.focus();
            localStorage.setItem(STORAGE_KEY, editor.value);
            debouncedSaveHistory();
            updateLineNumbers();
            showToast('🗑️ 選取文字已清除');
        } else {
            showToast('⚠️ 請先選取要清除的文字');
        }
        return;
    }

    // 原有的表格模式邏輯
    if (selectedRows.length > 0) clearSelectedRows();
    else if (selectedCols.length > 0) clearSelectedCols();
    else if (selectedCellBlocks.length > 0) clearSelectedCells();
    else showToast('⚠️ 請先選取要清除的範圍');
}

function handleDeleteAction() {
    if (currentMode !== 'table') return; // 防呆：非表格模式直接阻擋

    if (selectedRows.length > 0) deleteSelectedRows();
    else if (selectedCols.length > 0) deleteSelectedCols();
    else if (selectedCellBlocks.length > 0) {
        // ⭐ 修改這裡：改為呼叫刪除並上移的專屬函數
        deleteSelectedCellsAndShiftUp();
    } else {
        showToast('⚠️ 請先選取要刪除的列、欄或儲存格');
    }
}

/* 刪除儲存格並將下方資料上移 */
function deleteSelectedCellsAndShiftUp() {
    if (selectedCellBlocks.length === 0) return;

    const tbody = dataTable.querySelector('tbody');
    const totalRows = tbody.children.length;

    // 1. 記錄每個欄位 (Column) 中，有哪些列 (Row) 被選取要刪除
    const colsToDelete = new Map();

    selectedCellBlocks.forEach(block => {
        const minR = Math.min(block.startR, block.endR);
        const maxR = Math.max(block.startR, block.endR);
        const minC = Math.min(block.startC, block.endC);
        const maxC = Math.max(block.startC, block.endC);

        for (let c = minC; c <= maxC; c++) {
            if (!colsToDelete.has(c)) colsToDelete.set(c, new Set());
            for (let r = minR; r <= maxR; r++) {
                colsToDelete.get(c).add(r);
            }
        }
    });

    // 2. 逐欄進行資料上移處理
    colsToDelete.forEach((rowSet, c) => {
        const keptData = []; // 用來存放該欄「沒有被刪除」的資料

        // 收集需要保留的資料
        for (let r = 0; r < totalRows; r++) {
            if (!rowSet.has(r)) {
                const inner = tbody.children[r]?.children[c + 1]?.querySelector('.td-inner');
                if (inner) {
                    keptData.push({
                        text: inner.innerText,
                        formula: inner.getAttribute('data-formula')
                    });
                } else {
                    keptData.push({ text: '', formula: null });
                }
            }
        }

        // 將保留的資料由上往下重新寫回該欄
        for (let r = 0; r < totalRows; r++) {
            const inner = tbody.children[r]?.children[c + 1]?.querySelector('.td-inner');
            if (!inner) continue;

            if (r < keptData.length) {
                // 填入上移的資料
                const data = keptData[r];
                if (data.formula !== null && data.formula !== undefined) {
                    inner.setAttribute('data-formula', data.formula);
                    inner.innerText = data.formula; // 稍後會被重新計算
                } else {
                    inner.removeAttribute('data-formula');
                    inner.innerText = data.text;
                }
            } else {
                // 底部多出來的格子清空
                inner.removeAttribute('data-formula');
                inner.innerText = '';
            }
        }
    });

    // 3. 更新畫面與歷史紀錄
    recalculateAllFormulas(); // 重新計算公式，讓畫面顯示正確數值
    clearTableSelection();    // 清除選取藍框 (因為格子已經移位了)
    debouncedSaveHistory();   // 存檔，支援 Ctrl+Z 復原
    showToast('🗑️ 儲存格已刪除，下方資料已上移');
}

// ==========================================
// 清除選單狀態控制
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const deleteGroup = document.getElementById('dd-delete-group');
    if (deleteGroup) {
        const deleteActionBtn = deleteGroup.querySelector('.action-btn');
        if (deleteActionBtn) {
            deleteActionBtn.addEventListener('click', () => {
                const btnDeleteStructure = document.getElementById('btn-delete-structure');
                if (!btnDeleteStructure) return;
                
                // 動態判斷：只有表格模式可以點擊「刪除結構」
                if (currentMode === 'table') {
                    btnDeleteStructure.disabled = false;
                    btnDeleteStructure.title = "刪除選取的列或欄結構";
                } else {
                    btnDeleteStructure.disabled = true;
                    btnDeleteStructure.title = "僅在表格模式可用";
                }
            });
        }
    }
});

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
    saveHistoryState(); showToast('🗑️ 選定欄資料清潔溜溜');
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
    clearTableSelection(); updateTableHeaders();
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
    saveHistoryState(); showToast('🗑️ 選定列資料已清除');
}

function deleteSelectedRows() {
    if (selectedRows.length === 0) return;
    const tbody = dataTable.querySelector('tbody');
    if (tbody.children.length - selectedRows.length < 1) return showToast('⚠️ 至少需保留一列！');
    
    const sorted = [...selectedRows].sort((a,b) => b - a);
    sorted.forEach(idx => { if (tbody.children[idx]) tbody.children[idx].remove(); });
    
    clearTableSelection(); updateTableHeaders();
	saveHistoryState(); applyFreeze(); showToast('🗑️ 列已刪除');
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
    debouncedSaveHistory(); showToast('🗑️ 儲存格資料已清除');
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
   多選與剪貼簿核心功能 (外圍藍框實作 - 極速優化版)
   --------------------------------- */
function applySelectionVisuals() {
    // 【優化 1：精準清除】
    // 不要掃描全表，直接找出有標記的節點清除
    document.querySelectorAll('.selected-header').forEach(el => el.classList.remove('selected-header'));
    document.querySelectorAll('.sel-bg').forEach(el => {
        el.classList.remove('sel-bg');
        el.style.boxShadow = '';
    });

    const tbody = dataTable.querySelector('tbody');
    const theadTr = dataTable.querySelector('thead tr');
    if (!tbody || !theadTr) return;

    const R = tbody.children.length;
    const C = theadTr.children.length - 1; // 扣掉左上角的全選區
    
    // 如果沒有任何選取，直接結束
    if (selectedRows.length === 0 && selectedCols.length === 0 && selectedCellBlocks.length === 0) {
        return;
    }

    // 標記表頭 (Th)
    selectedCols.forEach(colIndex => { 
        if(theadTr.children[colIndex + 1]) theadTr.children[colIndex + 1].classList.add('selected-header'); 
    });
    selectedRows.forEach(rIdx => { 
        const row = tbody.children[rIdx];
        if (row && row.children[0]) row.children[0].classList.add('selected-header'); 
    });

    // 【優化 2：稀疏矩陣邏輯】
    // 只記錄被選取格子的座標，不再產生巨大二維陣列
    // selMap 用法: "r,c" -> true
    const selMap = new Set();
    
    // 收集所有選取的座標
    selectedRows.forEach(r => {
        if(r >= 0 && r < R) {
            for(let c = 0; c < C; c++) selMap.add(`${r},${c}`);
        }
    });
    
    selectedCols.forEach(c => {
        if(c >= 0 && c < C) {
            for(let r = 0; r < R; r++) selMap.add(`${r},${c}`);
        }
    });
    
    selectedCellBlocks.forEach(block => {
        const minR = Math.max(0, Math.min(block.startR, block.endR));
        const maxR = Math.min(R - 1, Math.max(block.startR, block.endR));
        const minC = Math.max(0, Math.min(block.startC, block.endC));
        const maxC = Math.min(C - 1, Math.max(block.startC, block.endC));

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                selMap.add(`${r},${c}`);
            }
        }
    });

    // 依據收集到的座標，精準繪製邊框與底色
    selMap.forEach(coord => {
        const [rStr, cStr] = coord.split(',');
        const r = parseInt(rStr, 10);
        const c = parseInt(cStr, 10);
        
        const tr = tbody.children[r];
        if (!tr) return;
        const td = tr.children[c + 1];
        if (!td) return;

        // 判斷上下左右相鄰的格子是否也被選取，決定是否要畫藍框
        const hasTop = r > 0 && selMap.has(`${r - 1},${c}`);
        const hasBottom = r < R - 1 && selMap.has(`${r + 1},${c}`);
        const hasLeft = c > 0 && selMap.has(`${r},${c - 1}`);
        const hasRight = c < C - 1 && selMap.has(`${r},${c + 1}`);

        let top = !hasTop ? '2px' : '0';
        let bottom = !hasBottom ? '-2px' : '0';
        let left = !hasLeft ? '2px' : '0';
        let right = !hasRight ? '-2px' : '0';
        
        let shadows = [];
        if (top !== '0') shadows.push(`inset 0 ${top} 0 0 #93c5fd`);
        if (bottom !== '0') shadows.push(`inset 0 ${bottom} 0 0 #93c5fd`);
        if (left !== '0') shadows.push(`inset ${left} 0 0 0 #93c5fd`);
        if (right !== '0') shadows.push(`inset ${right} 0 0 0 #93c5fd`);
        
        if (shadows.length > 0) {
            td.style.boxShadow = shadows.join(', ');
        }
        
        td.classList.add('sel-bg');
    });
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

    if (data.length > 1 && data[data.length - 1].length === 1 && data[data.length - 1][0] === '') {
        data.pop();
    }
    // 1. 從底部往上檢查，移除完全空白的列
    while (data.length > 0) {
        const lastRow = data[data.length - 1];
        // 檢查該列的所有儲存格是否都是空白
        const isEmptyRow = lastRow.every(cell => !cell || String(cell).trim() === '');
        if (isEmptyRow) {
            data.pop();
        } else {
            break; // 遇到有資料的列就停止往上刪除
        }
    }

    if (data.length === 0) return; // 如果全部都是空的就提早結束

    // 2. 檢查每一列，找出最右邊有資料的欄位索引
    let maxColWithData = -1;
    for (let r = 0; r < data.length; r++) {
        const row = data[r];
        for (let c = row.length - 1; c >= 0; c--) {
            if (row[c] && String(row[c]).trim() !== '') {
                if (c > maxColWithData) maxColWithData = c;
                break; // 這列找到最右邊的有資料欄位後，換下一列檢查
            }
        }
    }

    // 3. 把所有列的長度都裁減到 maxColWithData + 1
    const validColCount = maxColWithData + 1;
    for (let r = 0; r < data.length; r++) {
        if (data[r].length > validColCount) {
            data[r] = data[r].slice(0, validColCount);
        }
    }
    // ==========================================

    let startRow = 0; let startCol = 0;
    const activeInner = document.activeElement.closest('.td-inner');
    if (activeInner) activeInner.blur();

    let isMultiTarget = false;
    let targetBlocks = selectedCellBlocks;

    if (selectedRows.length > 0) { startRow = Math.min(...selectedRows); startCol = 0; } 
    else if (selectedCols.length > 0) { startRow = 0; startCol = Math.min(...selectedCols); } 
    else if (selectedCellBlocks.length > 0) {
        startRow = Math.min(selectedCellBlocks[0].startR, selectedCellBlocks[0].endR); 
        startCol = Math.min(selectedCellBlocks[0].startC, selectedCellBlocks[0].endC);
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
        // 【修復 2：貼上為值模式，絕對不平移，直接取得原值】
        if (window.isPasteValueMode) {
            inner.removeAttribute('data-formula');
            if (cellData.startsWith('=')) {
                inner.innerText = typeof evaluateFormula === 'function' ? evaluateFormula(cellData) : cellData;
            } else {
                inner.innerText = cellData;
            }
            return;
        }

        // 一般貼上模式
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

    // 填滿模式
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
        // 一般貼上 (自動擴充表格並對應貼上)
        const rowsNeeded = startRow + data.length;
        const currentRows = tbody.children.length;
        
        if (rowsNeeded > currentRows) {
            insertRowAt(currentRows, -1, rowsNeeded - currentRows);
        }

        let maxColsNeeded = startCol;
        data.forEach(r => { if (startCol + r.length > maxColsNeeded) maxColsNeeded = startCol + r.length; });
        const currentCols = theadTr.children.length - 1;
        
        // 欄位原本就是批次新增的，維持不變
        if (maxColsNeeded > currentCols) { 
            insertColAt(currentCols, -1, maxColsNeeded - currentCols); 
        }

        for (let r = 0; r < data.length; r++) {
            const rowElem = tbody.children[startRow + r];
            for (let c = 0; c < data[r].length; c++) {
                const inner = rowElem.children[startCol + c + 1]?.querySelector('.td-inner');
                if (inner) applyPastedCell(inner, data[r][c], startRow + r, startCol + c);
            }
        }
    }

    updateTableHeaders();
    recalculateAllFormulas();     
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
        debouncedSaveHistory();
    }
    editor.classList.add('hidden');
    overlay.classList.add('hidden');
    activeEditorTd = null;
}

document.getElementById('cellEditorOverlay').addEventListener('click', () => closeCellEditor(true));

/* ==========================================
   輸入法全域焦點同步引擎 (解決手機版與表格模式無反應問題)
   ========================================== */
document.addEventListener('focusin', (e) => {
    // 檢查目前是否已經載入並啟用了輸入法
    if (typeof WebIME !== 'undefined' && WebIME.isInitialized) {
        
        const target = e.target;
        
        // 判斷獲得焦點的元素是否為「可輸入區域」
        // 包含：一般的 input/textarea，以及我們表格中的 .td-inner 儲存格
        const isEditable = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.isContentEditable || 
                           target.classList.contains('td-inner');
                           
        if (isEditable) {
            WebIME.imeActivate(target);
            
            // 在手機版，為了確保虛擬鍵盤彈出後不影響，稍微延遲再觸發一次重新定位
            if (WebIME.isMobile) {
                setTimeout(() => {
                    if (WebIME.activeElement === target) {
                        WebIME.imeReposition();
                    }
                }, 300);
            }
        }
    }
});

/* 鍵盤與剪貼簿事件監聽 */
document.addEventListener('keydown', (e) => {
	if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        triggerUndo();
        return;
    }
    // 1. 攔截 Ctrl+F 快捷鍵
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const modal = document.getElementById('findReplaceModal');
        const fInput = document.getElementById('findInput');
        modal.classList.toggle('hidden');
        
        if (!modal.classList.contains('hidden')) {
            centerModal(modal);
            
            let hasSelection = false;
            if (currentMode === 'text' && editor.selectionStart !== editor.selectionEnd) {
                hasSelection = true;
                const selectedText = editor.value.substring(editor.selectionStart, editor.selectionEnd);
                // 自動帶入單行選取文字到尋找框
                if (!selectedText.includes('\n')) fInput.value = selectedText;
            }
            
            if (!hasSelection) {
                fInput.focus();
                fInput.select();
            }
        }
        return;
    }

    if (currentMode === 'table') {
        // 判斷目前是否有文字游標正在儲存格內閃爍 (編輯模式)
        const activeInner = document.activeElement.closest('.td-inner');
        const isEditing = activeInner !== null;
        
        // 判斷是否處於選取狀態 (有藍框，不在編輯模式)
        const hasSelection = !isEditing && selectedCellBlocks.length > 0;

        // --- 處理 Tab 鍵 (向右/向左移動並選取) ---
        if (e.key === 'Tab') {
            // 讓對話框內的輸入框保留原本的 Tab 切換功能
            const isInputTarget = e.target.closest('input:not(#cellEditor), textarea:not(#cellEditor), select');
            if (isInputTarget && !isEditing) return; 
            
            e.preventDefault(); // 攔截預設的焦點切換
            
            const tbody = dataTable.querySelector('tbody');
            let maxR = tbody.children.length - 1;
            const maxC = dataTable.querySelector('thead tr').children.length - 2;

            let r, c;

            // 決定起點：如果在打字就從打字的這格算，否則從藍框算
            if (isEditing) {
                activeInner.blur();
                let tr = activeInner.closest('tr');
                r = Array.from(tr.parentNode.children).indexOf(tr);
                c = Array.from(tr.children).indexOf(activeInner.closest('td')) - 1;
            } else if (lastClickedCell) {
                r = lastClickedCell.r; c = lastClickedCell.c;
            } else if (selectedCellBlocks.length > 0) {
                r = selectedCellBlocks[0].startR; c = selectedCellBlocks[0].startC;
            } else {
                r = 0; c = 0; // 都沒選就從 A1 開始
            }

            // 計算移動方向
            if (e.shiftKey) {
                // Shift + Tab 往左移動
                c--;
                if (c < 0) { c = maxC; r--; } // 到最左邊就往上一列的最右邊
                if (r < 0) { r = 0; c = 0; }
            } else {
                // Tab 往右移動
                c++;
                if (c > maxC) { 
                    c = 0; r++; // 到最右邊就換下一列
                    if (r > maxR) {
                        insertRowAt(tbody.children.length); // 如果到底了，自動新增一列
                        maxR++;
                    }
                }
            }

            // 更新選取框
            lastClickedCell = { r, c };
            selectedCellBlocks = [{ startR: r, startC: c, endR: r, endC: c }];
            selectedRows = []; selectedCols = [];
            applySelectionVisuals();

            // 捲動到視野內
            const targetTd = tbody.children[r]?.children[c + 1];
            if (targetTd) targetTd.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            return;
        }

        // --- 處理方向鍵導覽 (支援 Shift / Ctrl 多選與端點跳轉) ---
        if (hasSelection && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault(); 
            
            const tbody = dataTable.querySelector('tbody');
            const maxR = tbody.children.length - 1;
            const maxC = dataTable.querySelector('thead tr').children.length - 2;

            const lastBlock = selectedCellBlocks[selectedCellBlocks.length - 1];
            
            let headR = e.shiftKey ? lastBlock.endR : (lastClickedCell ? lastClickedCell.r : lastBlock.startR);
            let headC = e.shiftKey ? lastBlock.endC : (lastClickedCell ? lastClickedCell.c : lastBlock.startC);

            // 計算位移向量
            let dr = 0, dc = 0;
            if (e.key === 'ArrowUp') dr = -1;
            else if (e.key === 'ArrowDown') dr = 1;
            else if (e.key === 'ArrowLeft') dc = -1;
            else if (e.key === 'ArrowRight') dc = 1;

            const isCtrl = e.ctrlKey || e.metaKey;

            if (isCtrl) {
                // 智慧端點跳轉引擎 (模擬 Excel 行為)
                const isCellEmpty = (r, c) => {
                    const inner = tbody.children[r]?.children[c + 1]?.querySelector('.td-inner');
                    if (!inner) return true;
                    const text = inner.hasAttribute('data-formula') ? inner.getAttribute('data-formula') : inner.innerText;
                    return text.trim() === '';
                };

                let currR = headR, currC = headC;
                const startEmpty = isCellEmpty(currR, currC);
                let nextR = currR + dr, nextC = currC + dc;

                if (nextR >= 0 && nextR <= maxR && nextC >= 0 && nextC <= maxC) {
                    const nextEmpty = isCellEmpty(nextR, nextC);
                    
                    if (!startEmpty && !nextEmpty) {
                        // 有資料 -> 有資料：跳到「連續資料區塊」的最邊緣
                        while (nextR >= 0 && nextR <= maxR && nextC >= 0 && nextC <= maxC && !isCellEmpty(nextR, nextC)) {
                            currR = nextR; currC = nextC;
                            nextR += dr; nextC += dc;
                        }
                    } else {
                        // 有資料 -> 空白，或 空白 -> 空白：跳過所有空白，直達「下一個有資料的格子」或「表格底端」
                        while (nextR >= 0 && nextR <= maxR && nextC >= 0 && nextC <= maxC && isCellEmpty(nextR, nextC)) {
                            currR = nextR; currC = nextC;
                            nextR += dr; nextC += dc;
                        }
                        if (nextR >= 0 && nextR <= maxR && nextC >= 0 && nextC <= maxC) {
                            currR = nextR; currC = nextC; // 停在碰到的第一個有資料的格子
                        }
                    }
                }
                headR = currR; headC = currC;
            } else {
                // 一般移動
                headR += dr; headC += dc;
            }

            // 邊界限制
            if (headR < 0) headR = 0; if (headR > maxR) headR = maxR;
            if (headC < 0) headC = 0; if (headC > maxC) headC = maxC;

            if (e.shiftKey) {
                // Shift: 擴展選取範圍
                lastBlock.endR = headR;
                lastBlock.endC = headC;
            } else {
                // 單純方向鍵: 重置為單格選取
                lastClickedCell = { r: headR, c: headC };
                selectedCellBlocks = [{ startR: headR, startC: headC, endR: headR, endC: headC }];
                selectedRows = []; selectedCols = [];
            }

            applySelectionVisuals();

            const targetTd = tbody.children[headR]?.children[headC + 1];
            if (targetTd) targetTd.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            return;
        }

        // --- 處理 Enter 鍵 ---
        if (e.key === 'Enter') {
            if (hasSelection && !isEditing) {
                // 【情境 A：選取模式下按 Enter ➔ 進入編輯】
                e.preventDefault();
                // 如果是多選狀態，以「起點 (Anchor)」的儲存格作為編輯目標
                const editR = lastClickedCell ? lastClickedCell.r : selectedCellBlocks[0].startR;
                const editC = lastClickedCell ? lastClickedCell.c : selectedCellBlocks[0].startC;
                const tbody = dataTable.querySelector('tbody');
                const targetInner = tbody.children[editR]?.children[editC + 1]?.querySelector('.td-inner');
                
                if (targetInner) {
                    targetInner.focus();
                    // 將文字游標精準移到文字的最末端
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(targetInner);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                return;
            } 
            else if (isEditing) {
                // 【情境 B：編輯模式下按 Enter】
                const enterAction = localStorage.getItem(ENTER_ACTION_KEY) || 'confirm';
                
                if (e.shiftKey || e.altKey || enterAction === 'newline') {
                    // 為了確保所有瀏覽器在 Alt + Enter 時都能正確換行，我們手動攔截並插入換行符號
                    if (e.altKey) {
                        e.preventDefault();
                        document.execCommand('insertText', false, '\n');
                    }
                    return; 
                } 
                else {
                    e.preventDefault();
                    activeInner.blur();

                    const direction = localStorage.getItem(ENTER_DIRECTION_KEY) || 'down';
                    let tr = activeInner.closest('tr');
                    let r = Array.from(tr.parentNode.children).indexOf(tr);
                    let c = Array.from(tr.children).indexOf(activeInner.closest('td')) - 1;

                    const tbody = dataTable.querySelector('tbody');
                    let maxR = tbody.children.length - 1;
                    const maxC = dataTable.querySelector('thead tr').children.length - 2;

                    if (direction === 'down') {
                        r++;
                        if (r > maxR) insertRowAt(tbody.children.length);
                    } else if (direction === 'right') {
                        c++;
                        if (c > maxC) c = maxC; 
                    }

                    lastClickedCell = { r, c };
                    selectedCellBlocks = [{ startR: r, startC: c, endR: r, endC: c }];
                    selectedRows = []; selectedCols = [];
                    applySelectionVisuals();

                    const targetTd = tbody.children[r]?.children[c + 1];
                    if (targetTd) targetTd.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }
            }
        }

		// --- 處理一般字元輸入 (直接覆蓋並進入編輯) ---
        // 判斷：按下的是單一可列印字元 (長度為1)，且沒有按 Ctrl/Alt/Meta 等組合鍵
        const isPrintableKey = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
        // 確保焦點不是在其他對話框的搜尋/輸入框裡
        const isInputTarget = e.target.closest('input, textarea'); 

        if (hasSelection && !isEditing && isPrintableKey && !isInputTarget) {
            e.preventDefault(); // 攔截預設輸入，交由我們手動寫入
            
            // 取得目前選取的目標儲存格 (以起點為主)
            const editR = lastClickedCell ? lastClickedCell.r : selectedCellBlocks[0].startR;
            const editC = lastClickedCell ? lastClickedCell.c : selectedCellBlocks[0].startC;
            const tbody = dataTable.querySelector('tbody');
            const targetInner = tbody.children[editR]?.children[editC + 1]?.querySelector('.td-inner');
            
            if (targetInner) {
                // 1. 瞬間清空原有資料與背後公式，並填入剛按下的字元
                targetInner.removeAttribute('data-formula');
                targetInner.innerText = e.key;
                
                // 2. 讓該儲存格獲得焦點，進入編輯模式
                targetInner.focus();
                
                // 3. 將游標精準定位到文字的最末端 (剛打的那個字元後面)
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(targetInner);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
            return;
        }



        // --- 處理 Delete 與 Backspace (刪除內容) ---
        if (e.key === 'Delete' || e.key === 'Backspace') {
            
            // 1. 如果有開啟任何對話框，不觸發表格刪除 (讓對話框內的輸入框正常使用)
            if (!document.getElementById('promptModal').classList.contains('hidden') ||
                !document.getElementById('confirmModal').classList.contains('hidden') ||
                !document.getElementById('cellEditor').classList.contains('hidden') ||
                !document.getElementById('findReplaceModal').classList.contains('hidden')) {
                return;
            }

            // 2. 判斷目前是否為「多選狀態」(大於一格的選取)
            const isMultiSelect = selectedRows.length > 0 || selectedCols.length > 0 || 
                                  selectedCellBlocks.length > 1 || 
                                  (selectedCellBlocks.length === 1 && 
                                  (selectedCellBlocks[0].startR !== selectedCellBlocks[0].endR || 
                                   selectedCellBlocks[0].startC !== selectedCellBlocks[0].endC));

            const isInput = e.target.closest('input, textarea, .td-inner');
            
            // ======== 關鍵修復： ========
            // 如果正在打字 (焦點在輸入框或單格編輯中)，且「沒有」多選範圍，才放行讓系統刪除一個字元
            if (isInput && !isMultiSelect) return; 
            // ============================

            // 3. 只要有選取範圍 (無論單格或多格)，統一呼叫清除動作
            const anySelected = selectedRows.length > 0 || selectedCols.length > 0 || selectedCellBlocks.length > 0;
            
            if (anySelected) { 
                e.preventDefault(); 
                handleClearAction(); 
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

/* ==========================================
   原生剪下事件 (Ctrl+X / Cmd+X) 攔截
   ========================================== */
document.addEventListener('cut', (e) => {
    // 1. 檢查使用者是否有「反白」選取文字 (例如正在儲存格內打字時反白)
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
        // 2. 如果焦點正在儲存格內 (.td-inner) 或獨立編輯器內，直接 return，讓瀏覽器執行原生的文字剪下
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.classList.contains('td-inner') || activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            return; 
        }
    }

    // 3. 當沒有反白文字時，攔截預設行為並執行「表格儲存格」的剪下邏輯
    if (currentMode === 'table' && (selectedRows.length > 0 || selectedCols.length > 0 || selectedCellBlocks.length > 0)) { 
        // 阻止瀏覽器預設的剪下行為
        e.preventDefault(); 
        
        // 步驟 A：先執行複製，將選取的資料寫入剪貼簿
        copySelectedTableData(); 
        
        // 步驟 B：執行清除，將選取範圍的資料清空
        // (handleClearAction 內部已經包含儲存歷史紀錄與畫面更新的邏輯)
        handleClearAction();
        
        // 覆寫提示訊息為「剪下」
        setTimeout(() => {
            showToast('✂️ 內容已剪下！');
        }, 100); // 稍微延遲以覆蓋 copy 和 clear 原本的提示
    }
});



document.addEventListener('paste', (e) => {
    const activeEl = document.activeElement;
    const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    const isCellEditor = activeEl && activeEl.id === 'cellEditor';
    const isInsideTdInner = activeEl && activeEl.classList.contains('td-inner');
    const isMainEditor = activeEl && activeEl.id === 'editor';

    // 如果焦點在其他輸入框 (例如：尋找與取代輸入框)，不攔截，放行原生貼上
    if (isInput && !isCellEditor && !isMainEditor) return;

    const rawText = (e.originalEvent || e).clipboardData.getData('text/plain');
    if (!rawText) return;

    // 1. 消除 Windows 剪貼簿的 \r\n 造成的雙重換行 bug
    let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // 2. 將所有連續兩個以上的換行 (中間可能夾雜空白) 強制縮減為單一換行
    text = text.replace(/\n\s*\n/g, '\n');

    // --- 文字模式貼上處理 ---
    if (currentMode === 'text') {
        e.preventDefault(); // 攔截原生貼上，改由我們寫入以確保換行符號乾淨
        editor.focus();

        // 【效能優化】判斷文字量：超過 1 萬字元時，改用直接賦值以防瀏覽器卡死
        if (text.length > 10000) {
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            // 替換選取區或在游標處插入文字
            editor.value = editor.value.substring(0, start) + text + editor.value.substring(end);
            // 將游標移動到貼上文字的末端
            editor.selectionStart = editor.selectionEnd = start + text.length;
            
            // 手動觸發更新
            debouncedUpdateLineNumbers();
            debouncedSaveHistory();
            if (typeof updateWordCountWidget === 'function') updateWordCountWidget();
        } else {
            // 少量文字維持原生 execCommand，保留系統預設的 undo 順暢度
            document.execCommand('insertText', false, text);
        }
        return;
    }

    // --- 表格模式貼上處理 ---
    if (currentMode === 'table') {
        const data = parseTSV(text);

        const isMultiSelect = selectedRows.length > 0 || selectedCols.length > 0 || 
                              selectedCellBlocks.length > 1 || 
                              (selectedCellBlocks.length === 1 && (selectedCellBlocks[0].startR !== selectedCellBlocks[0].endR || selectedCellBlocks[0].startC !== selectedCellBlocks[0].endC));

        // 單格內文字貼上放行
        if ((isInsideTdInner || isCellEditor) && data.length <= 1 && (!data[0] || data[0].length <= 1) && !isMultiSelect) {
            e.preventDefault();
            document.execCommand('insertText', false, text);
            return;
        }

        // 多格或多筆資料的智慧貼上
        if (isMultiSelect || data.length > 1 || (data[0] && data[0].length > 1) || selectedCellBlocks.length > 0) {
            e.preventDefault();
            handleTablePaste(text); 
            
            if (isCellEditor) {
                closeCellEditor(false);
            }
        }
    }
});



dataTable.addEventListener('input', () => { 
    hideFloatingTool(); debouncedSaveHistory(); applyFreeze();
});

/* 滑鼠點擊選取與選單邏輯 */
dataTable.addEventListener('click', (e) => {
    const btnColMenu = e.target.closest('.btn-col-menu');
    if (btnColMenu) {
        const th = btnColMenu.closest('th'); 
        activeMenuColIndex = parseInt(th.dataset.col);
        const rect = th.getBoundingClientRect();
        
        // 先顯示選單以取得真實尺寸
        colMenu.classList.add('show'); 
        rowMenu.classList.remove('show'); 
        
        const menuRect = colMenu.getBoundingClientRect();
        let leftPos = rect.right - menuRect.width;
        let topPos = rect.bottom + 5;
        
        // 邊界防護：如果超出下邊界，改為向上展開
        if (topPos + menuRect.height > window.innerHeight) {
            topPos = rect.top - menuRect.height - 5;
            if (topPos < 5) topPos = 5; // 防呆保底
        }
        if (leftPos < 5) leftPos = 5; // 防呆保底
        
        colMenu.style.left = `${leftPos}px`; 
        colMenu.style.top = `${topPos}px`;
        return;
    }

    const btnRowMenu = e.target.closest('.btn-row-menu');
    if (btnRowMenu) {
        const th = btnRowMenu.closest('th'); 
        const tr = th.closest('tr'); 
        activeMenuRowIndex = Array.from(tr.parentNode.children).indexOf(tr);
        const rect = th.getBoundingClientRect(); 
        
        // 先顯示選單以取得真實尺寸
        rowMenu.classList.add('show'); 
        colMenu.classList.remove('show'); 
        
        const menuRect = rowMenu.getBoundingClientRect();
        let leftPos = rect.right + 5;
        let topPos = rect.top;
        
        // 邊界防護：如果超出視窗底部，將選單向上推 (確保完整顯示)
        if (topPos + menuRect.height > window.innerHeight) {
            topPos = window.innerHeight - menuRect.height - 10; 
            // 確保不會被推到視窗最上方外面
            if (topPos < 10) topPos = 10;
        }
        
        rowMenu.style.left = `${leftPos}px`; 
        rowMenu.style.top = `${topPos}px`;
        return;
    }

    // 調整過濾邏輯：保留對拖曳控制把手的阻擋
    if (e.target.closest('.resize-handle')) return;

    // 偵測是否點擊左上角全選區塊
    if (e.target.closest('th.sticky-corner')) {
        if (isSelectionLocked) return; 
        selectAllTable();
        return; 
    }

    const thTop = e.target.closest('th.sticky-top');
    if (thTop && !e.target.closest('.btn-col-menu')) {
        if (isSelectionLocked) return; 
        const isCtrl = e.ctrlKey || e.metaKey || isMobileMultiSelect;
        return selectTableColumn(parseInt(thTop.dataset.col), e.shiftKey, isCtrl);
    }

    const thLeft = e.target.closest('th.sticky-left');
    if (thLeft && !e.target.closest('.btn-row-menu')) {
        if (isSelectionLocked) return; 
        const isCtrl = e.ctrlKey || e.metaKey || isMobileMultiSelect;
        const tr = thLeft.closest('tr');
        return selectTableRow(Array.from(tr.parentNode.children).indexOf(tr), e.shiftKey, isCtrl);
    }

    // 如果使用者正在「反白文字」，絕對不要觸發任何失去焦點或儲存格點擊的邏輯
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
        return;
    }

    const td = e.target.closest('td');
    if (td) {
        lastMatchedCell = null;
        
        const isClickOnInner = e.target.closest('.td-inner') !== null;

        if (!isClickOnInner && document.activeElement && document.activeElement.classList.contains('td-inner')) {
            document.activeElement.blur();
        }

        const tr = td.closest('tr');
        const rIdx = Array.from(tr.parentNode.children).indexOf(tr);
        const cIdx = Array.from(tr.children).indexOf(td) - 1;

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

            // 4. 處理獨立編輯器的開啟 (將 !isClickOnPaddingGap 替換為 isClickOnInner)
            if (dataTable.classList.contains('table-nowrap') && !e.shiftKey && !e.ctrlKey && !e.metaKey && isClickOnInner) {
                openCellEditor(td);
            }
            
            return; // 提早結束，防止原本的選取範圍被清空
        }
        
        // 統一把 Ctrl 判斷提取出來
        const isCtrl = e.ctrlKey || e.metaKey || isMobileMultiSelect;

        // 如果剛才發生了拖曳，我們就跳過點擊開啟編輯器的動作
        if (window.isCellDragging) return;

        // 修改：如果不換行模式且沒有按住特殊鍵 (包含多選模式)，點擊文字區才開啟編輯器
        if (dataTable.classList.contains('table-nowrap') && !e.shiftKey && !isCtrl && isClickOnInner) {
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
				adjustFormulasForColMove(dragIndex, targetIndex);
                updateTableHeaders();
				saveColNames(); saveColWidths(); saveHistoryState(); applyFreeze();
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
                updateTableHeaders();
				saveHistoryState(); applyFreeze();
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
				adjustFormulasForColMove(touchDragIndex, targetIndex);
                updateTableHeaders();
				saveColNames(); saveColWidths(); saveHistoryState(); applyFreeze();
            }
        } else if (touchDragType === 'row') {
            const tr = currentDropTarget.closest('tr'); 
            const targetIndex = Array.from(tr.parentNode.children).indexOf(tr);
            if (targetIndex !== touchDragIndex) {
                const tbody = dataTable.querySelector('tbody'); 
                const trToMove = tbody.children[touchDragIndex];
                const refTr = targetIndex > touchDragIndex ? tbody.children[targetIndex + 1] : tbody.children[targetIndex];
                tbody.insertBefore(trToMove, refTr);
                
                updateTableHeaders();
				saveHistoryState(); applyFreeze();
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


/* ==========================================
   全域與特殊合併設定 (加入防抖更新行號)
   ========================================== */

let lineNumbersTimeout;

function updateLineNumbers() {
    if (currentMode !== 'text') return; 
    const text = editor.value; 
    const lines = text.split('\n'); 
    
    if (lines.length > 2000) {
        // 【效能優化】使用 Array.from 與 join 來快速大量生成 DOM 字串，比 += 快非常多
        const numbersHtml = Array.from({ length: lines.length }, (_, i) => 
            `<div class="line-number-item" style="height: 1.6em;">${i + 1}</div>`
        ).join('');
        
        lineNumbers.innerHTML = numbersHtml;
        return; // 提早結束，不執行下方的複雜運算
    }

    // 【原有邏輯】少於 2000 行時，維持精準的自動換行高度測量
    const style = window.getComputedStyle(editor);
    mirror.style.fontFamily = style.fontFamily; 
    mirror.style.fontSize = style.fontSize;
    mirror.style.lineHeight = style.lineHeight; 
    mirror.style.whiteSpace = style.whiteSpace; 
    mirror.style.wordBreak = style.wordBreak;
    mirror.style.width = `${editor.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)}px`;
    mirror.innerHTML = '';
    
    lines.forEach(line => { 
        const div = document.createElement('div'); 
        div.textContent = line.length === 0 ? '\u200b' : line; 
        mirror.appendChild(div); 
    });
    
    let numbersHtml = ''; 
    const measureDivs = mirror.children;
    for (let i = 0; i < lines.length; i++) { 
        numbersHtml += `<div class="line-number-item" style="height: ${measureDivs[i].getBoundingClientRect().height}px;">${i + 1}</div>`; 
    }
    lineNumbers.innerHTML = numbersHtml;
}

function debouncedUpdateLineNumbers() {
    clearTimeout(lineNumbersTimeout);
    lineNumbersTimeout = setTimeout(updateLineNumbers, 100); 
}

editor.addEventListener('input', () => { 
    debouncedUpdateLineNumbers();
    hideFloatingTool(); 
    debouncedSaveHistory(); 
});

editor.addEventListener('scroll', () => { 
    lineNumbers.scrollTop = editor.scrollTop; 
    hideFloatingTool(); 
});

dataTable.addEventListener('input', () => { 
    hideFloatingTool(); 
    debouncedSaveHistory(); 
    applyFreeze(); 
});

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
document.getElementById('dd-editorWidth')?.addEventListener('change', (e) => { 
    const val = e.detail.value;
    mainContainer.style.maxWidth = val; 
    localStorage.setItem(EDITOR_WIDTH_KEY, val);
    
    if (val === '100%') {
        document.body.classList.add('full-width-mode');
    } else {
        document.body.classList.remove('full-width-mode');
    }
    
    if (currentMode === 'text') setTimeout(updateLineNumbers, 350); else setTimeout(applySelectionVisuals, 350); 
});

/* 鎖定選取狀態切換 */
document.getElementById('dd-lockSelection').addEventListener('change', (e) => {
    isSelectionLocked = (e.detail.value === 'true');
    document.getElementById('lockSelectionIcon').textContent = isSelectionLocked ? 'lock' : 'lock_open';
    showToast(isSelectionLocked ? '🔒 選取範圍已鎖定' : '🔓 選取範圍已解除鎖定');
});

/* 列號對齊切換 */
document.getElementById('dd-rowNumAlign')?.addEventListener('change', (e) => {
    const val = e.detail.value;
    // 即時變更 CSS 變數
    document.documentElement.style.setProperty('--row-num-valign', val);
    // 記憶設定
    localStorage.setItem(ROW_NUM_ALIGN_KEY, val);
    
    // 更新選單圖示
    const icon = document.getElementById('rowNumAlignIcon');
    if (icon) {
        icon.textContent = val === 'top' ? 'vertical_align_top' : (val === 'bottom' ? 'vertical_align_bottom' : 'vertical_align_center');
    }
    
    showToast(`✅ 列號已設定為${val === 'top' ? '靠上' : (val === 'bottom' ? '靠下' : '置中')}`);
});

// Enter 鍵行為切換
document.getElementById('dd-enterAction').addEventListener('change', (e) => {
    localStorage.setItem(ENTER_ACTION_KEY, e.detail.value);
    document.getElementById('enterActionIcon').textContent = e.detail.value === 'confirm' ? 'check_circle' : 'keyboard_return';
    showToast(`設定已變更：Enter 鍵將執行 [${e.detail.value === 'confirm' ? '確認' : '換行'}]`);
});

// 確認後移動方向切換
document.getElementById('dd-enterDirection').addEventListener('change', (e) => {
    localStorage.setItem(ENTER_DIRECTION_KEY, e.detail.value);
    const dirIconMap = { 'down': 'arrow_downward', 'right': 'arrow_forward', 'stay': 'pan_tool' };
    document.getElementById('enterDirectionIcon').textContent = dirIconMap[e.detail.value];
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

function handleClearCurrentTab() {
    showConfirm('確認清除本頁', '這將會清空目前頁籤的所有資料，但保留其他頁籤。你確定嗎？', () => {
        editor.value = '';
        if (currentMode === 'text') {
            updateLineNumbers();
        } else {
            renderTableFromText(''); // 表格模式下繪製空表格
        }
        // 儲存至歷史紀錄與分頁資料
        saveHistoryState();
        saveAllTabsData();
        showToast('🗑️ 本頁內容已清除');
    });
}

/* ==========================================
   完全刪除 (清空所有分頁，只保留一個空白分頁)
========================================== */
document.getElementById('btnFullDelete').addEventListener('click', () => { 
    showConfirm('確認完全刪除', '這將會刪除所有的分頁、資料與結構，只保留一個空白分頁。你確定嗎？', () => {
        // 重設分頁陣列
        sheetTabs = [{ name: '工作表1', content: '', history: [''], mode: 'text' }];
        activeSheetIndex = 0;
        historyStack = sheetTabs[0].history;
        
        // 清空編輯器
        editor.value = '';
        
        // 直接使用強制切換回到文字模式，系統會幫我們把介面都整理好！
        switchMode('text', true);
        
        saveAllTabsData();
        renderSheetTabs();
        
        showToast('🗑️ 所有分頁與內容已完全刪除');
    });
});

/* ==========================================
   清空記憶 (清除 LocalStorage 並重整網頁)
========================================== */
document.getElementById('btnClearCache').addEventListener('click', () => {
    showConfirm('確認清空記憶', '這將會清除所有儲存在瀏覽器中的偏好設定與暫存紀錄，並重新載入網頁。你確定嗎？', () => {
        // 安全移除專案使用的 LocalStorage Key
        const keysToRemove = [
            STORAGE_KEY, MODE_KEY, COL_NAMES_KEY, FONT_SIZE_KEY, 
            LINE_HEIGHT_KEY, COL_WIDTHS_KEY, WORD_WRAP_KEY, 
            EDITOR_WIDTH_KEY, FREEZE_ROWS_KEY, SHOW_TEXT_LINE_NUMBERS_KEY,
            TABS_DATA_KEY, ACTIVE_TAB_KEY, ENTER_ACTION_KEY, 
            ENTER_DIRECTION_KEY, FONT_FAMILY_KEY, FIND_TEXT_KEY, 
            REPLACE_TEXT_KEY, 'wesing-batch-replace-data', 
            'wesing-batch-direction', 'wesing-batch-delimiter',
            'wesing-py-lang', 'wesing-py-src', 'wesing-py-tgt'
        ];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        showToast('🧹 記憶已清空，即將重新載入...');
        setTimeout(() => {
            window.location.reload();
        }, 1200);
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
    // 【修改這裡】：因為結構改變，直接監聽整個 dd-fontFamily 選單項目即可
    ddFontFamily.addEventListener('mouseenter', loadExtraFonts);
    ddFontFamily.addEventListener('click', loadExtraFonts);

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

// 輔助函數：將視窗精準置中
function centerModal(modal) {
    // 只有在「第一次打開」時才置中，這樣使用者拖曳後的位置才會被保留
    if (!modal.style.left) {
        modal.style.left = (window.innerWidth - modal.offsetWidth) / 2 + 'px';
        // 高度設定乘以 0.4，讓視窗稍微偏上一點點，視覺上最舒適
        modal.style.top = (window.innerHeight - modal.offsetHeight) * 0.4 + 'px'; 
    }
}

// 開啟/關閉視窗
document.getElementById('btnFindReplace').addEventListener('click', () => {
    findReplaceModal.classList.toggle('hidden');
    if (!findReplaceModal.classList.contains('hidden')) { 
        centerModal(findReplaceModal);
        
        let hasSelection = false;
        if (currentMode === 'text' && editor.selectionStart !== editor.selectionEnd) {
            hasSelection = true;
            const selectedText = editor.value.substring(editor.selectionStart, editor.selectionEnd);
            // 自動帶入單行選取文字到尋找框
            if (!selectedText.includes('\n')) {
                    findInput.value = selectedText;
                    localStorage.setItem(FIND_TEXT_KEY, selectedText);
                    updateFindReplaceClearButtons();
                }
        }
        
        if (!hasSelection) {
            findInput.focus(); 
            findInput.select(); 
        }
    } else {
        if (currentMode === 'text') editor.focus();
    }
});

document.getElementById('btnCloseFindReplace').addEventListener('click', () => {
    findReplaceModal.classList.add('hidden');
    if (currentMode === 'text') editor.focus();
});


// 視窗全區拖曳功能
let isDraggingFR = false, dragStartX = 0, dragStartY = 0, frStartLeft = 0, frStartTop = 0;
findReplaceModal.addEventListener('mousedown', (e) => {
    // 排除點擊輸入框、按鈕、表格等可互動元素
    if (e.target.closest('input, button, label, select, textarea, td, th')) return;
    
    if (!window.matchMedia || !window.matchMedia('(pointer: coarse)').matches) {
        e.preventDefault(); 
    }
    
    isDraggingFR = true; dragStartX = e.clientX; dragStartY = e.clientY;
    const rect = findReplaceModal.getBoundingClientRect();
    frStartLeft = rect.left; frStartTop = rect.top;
    document.body.style.userSelect = 'none'; // 拖曳時防止文字被意外反白
});

document.addEventListener('mousemove', (e) => {
    if (!isDraggingFR) return;
    findReplaceModal.style.left = `${frStartLeft + (e.clientX - dragStartX)}px`;
    findReplaceModal.style.top = `${frStartTop + (e.clientY - dragStartY)}px`;
    findReplaceModal.style.right = 'auto'; 
});

document.addEventListener('mouseup', () => { 
    isDraggingFR = false; 
    document.body.style.userSelect = ''; // 恢復文字選取功能
});

// ====== 新增：行動版觸控拖曳支援 (尋找與取代) ======
findReplaceModal.addEventListener('touchstart', (e) => {
    // 手機版同樣把這些可輸入、可選取的區域排除
    if (e.target.closest('input, button, label, select, textarea, td, th')) return;
    
    const touch = e.touches[0];
    isDraggingFR = true; 
    dragStartX = touch.clientX; 
    dragStartY = touch.clientY;
    const rect = findReplaceModal.getBoundingClientRect();
    frStartLeft = rect.left; 
    frStartTop = rect.top;
    
    // 避免觸控到非輸入/滾動區時觸發螢幕整體滾動
    if (!e.target.closest('input, textarea, select, td, th')) e.preventDefault(); 
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
            // 如果是連續點擊「下一個」，就接續上一次找到的儲存格
            currentIdx = cells.findIndex(c => c.inner === lastMatchedCell);
        } else {
            // 優先看有沒有正在編輯的儲存格 (文字游標閃爍中)
            let targetInner = document.activeElement.closest('.td-inner');
            
            // 如果沒有 (因為你剛點了尋找按鈕，焦點被按鈕搶走了)，就去抓「你最後點擊的那一格」
            if (!targetInner && lastClickedCell) {
                const rows = dataTable.querySelectorAll('tbody tr');
                if (rows[lastClickedCell.r]) {
                    targetInner = rows[lastClickedCell.r].children[lastClickedCell.c + 1]?.querySelector('.td-inner');
                }
            }
            
            // 找到起點後，取得它在搜尋陣列中的索引
            if (targetInner) {
                currentIdx = cells.findIndex(c => c.inner === targetInner);
            }
        }
        
        // 如果都沒選，預設從頭(或尾)開始找
        if (currentIdx === -1) currentIdx = isDown ? -1 : 0; 
        
        let found = false;
        for (let i = 1; i <= cells.length; i++) {
            let step = isDown ? i : -i;
            let checkIdx = (currentIdx + step) % cells.length;
            if (checkIdx < 0) checkIdx += cells.length;
            
            const cell = cells[checkIdx];
			const isFormulaMatch = document.getElementById('chkFormulaMatch')?.checked;
            // 優先抓取公式，如果沒有公式或沒勾選，就抓取表面文字
            let textToSearch = cell.inner.innerText;
            if (isFormulaMatch && cell.inner.hasAttribute('data-formula')) {
                textToSearch = cell.inner.getAttribute('data-formula');
            }
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
	let replaceWith = replaceInput.value;
    const isRegex = document.getElementById('chkRegex').checked;
    if (isRegex) {
        replaceWith = replaceWith.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    }
    
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
        
        if (!targetCell && lastClickedCell) {
            const rows = dataTable.querySelectorAll('tbody tr');
            if (rows[lastClickedCell.r]) {
                targetCell = rows[lastClickedCell.r].children[lastClickedCell.c + 1]?.querySelector('.td-inner');
            }
        }

        const isFormulaMatch = document.getElementById('chkFormulaMatch')?.checked;

        if (targetCell) {
            // 判斷要取代的是公式還是表面文字
            let textToSearch = targetCell.innerText;
            if (isFormulaMatch && targetCell.hasAttribute('data-formula')) {
                textToSearch = targetCell.getAttribute('data-formula');
            }

            if (regex.test(textToSearch)) {
                // ======== 關鍵修正：取得帶有全域 (g) 旗標的搜尋條件 ========
                const globalRegex = buildSearchRegex(true);
                // 使用全域條件來取代，確保儲存格內的所有目標都被換掉
                let newText = textToSearch.replace(globalRegex, replaceWith);
                // ==============================================================
                
                // 如果是替換公式，就把新公式存回屬性中
                if (isFormulaMatch && targetCell.hasAttribute('data-formula')) {
                    targetCell.setAttribute('data-formula', newText);
                } else {
                    targetCell.innerText = newText;
                    // 如果取代後不再是公式，移除公式標記
                    if (!newText.startsWith('=')) targetCell.removeAttribute('data-formula');
                }
                
                // 觸發全表重新計算，讓新公式立即生效顯示
                recalculateAllFormulas();
                debouncedSaveHistory();
                executeFind(isDown); 
            } else {
                executeFind(isDown); 
            }
        }
    }
});

// --- 全部取代 ---
// --- 全部取代 (支援套用到所有頁籤) ---
document.getElementById('btnReplaceAll').addEventListener('click', () => {
    const globalRegex = buildSearchRegex(true);
    if (!globalRegex) return;
    let replaceWith = replaceInput.value;
    const isRegex = document.getElementById('chkRegex').checked;
    if (isRegex) {
        replaceWith = replaceWith.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    }
    
    const isFormulaMatch = document.getElementById('chkFormulaMatch')?.checked;
    const chkAllTabs = document.getElementById('chkAllTabs')?.checked;
    
    let count = 0;

    // 🌟 邏輯分支：是否套用到所有頁籤
    if (chkAllTabs) {
        // 1. 先將當下畫面最新的資料存入 sheetTabs
        saveAllTabsData(); 

        // 2. 遍歷所有頁籤進行背景替換
        sheetTabs.forEach((tab) => {
            if (tab.mode === 'text') {
                const matches = tab.content.match(globalRegex);
                if (matches) {
                    count += matches.length;
                    tab.content = tab.content.replace(globalRegex, replaceWith);
                }
            } else {
                // 表格模式：在背景解析 TSV 並取代
                if (!tab.content) return;
                const data = parseTSV(tab.content);
                let tabCount = 0;
                
                const newData = data.map(row => {
                    return row.map(cellText => {
                        // 若未勾選「公式文字」，且開頭是等號，則跳過不取代
                        if (!isFormulaMatch && cellText.startsWith('=')) return cellText;

                        if (globalRegex.test(cellText)) {
                            const m = cellText.match(globalRegex);
                            tabCount += m ? m.length : 0;
                            return cellText.replace(globalRegex, replaceWith);
                        }
                        return cellText;
                    });
                });

                if (tabCount > 0) {
                    count += tabCount;
                    // 將陣列轉回 TSV 格式儲存
                    tab.content = newData.map(row => {
                        return row.map(cell => {
                            if (cell.includes('"') || cell.includes('\n') || cell.includes('\t')) {
                                return '"' + cell.replace(/"/g, '""') + '"';
                            }
                            return cell;
                        }).join('\t');
                    }).join('\n');
                }
            }
        });

		if (count > 0) {
            // 3. 將更新後的資料寫回 LocalStorage
            localStorage.setItem(TABS_DATA_KEY, JSON.stringify(sheetTabs));
            
            // 將當前頁籤「已經被取代完成」的新內容，同步回目前的編輯器中！
            editor.value = sheetTabs[activeSheetIndex].content;

            // 4. 強制重新渲染目前畫面
            switchMode(currentMode, true);
            debouncedSaveHistory();
        }

    } else {
        // 🌟 保持原有的單一頁籤 (目前畫面) 取代邏輯
        const context = getSelectionContext();

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
                let textToSearch = cell.inner.innerText;
                if (isFormulaMatch && cell.inner.hasAttribute('data-formula')) {
                    textToSearch = cell.inner.getAttribute('data-formula');
                }

                if (globalRegex.test(textToSearch)) {
                    const matches = textToSearch.match(globalRegex);
                    count += matches ? matches.length : 0;
                    
                    let newText = textToSearch.replace(globalRegex, replaceWith);
                    
                    if (isFormulaMatch && cell.inner.hasAttribute('data-formula')) {
                        cell.inner.setAttribute('data-formula', newText);
                    } else {
                        cell.inner.innerText = newText;
                        if (!newText.startsWith('=')) cell.inner.removeAttribute('data-formula');
                    }
                }
            });
            
            if (count > 0) {
                recalculateAllFormulas();
                debouncedSaveHistory();
            }
        }
    }
    
    if (count > 0) showFRMsg(`完成 ${count} 筆取代`, false);
    else showFRMsg('找不到目標');
});


/* ==========================================
   表格多欄位排序模組 (支援局部範圍、特定欄位與亂數排序)
   ========================================== */
const sortPanel = document.getElementById('sortPanel');
const sortRulesContainer = document.getElementById('sortRulesContainer');
const chkSortHasHeader = document.getElementById('chkSortHasHeader');
const sortPanelHeader = document.getElementById('sortPanelHeader');

// 全域變數：儲存目前選取範圍內的欄位資訊，供新增規則使用
let currentSortColumns = []; 

// 重設「有標題」核取方塊的狀態
function resetSortHeaderCheckbox() {
    chkSortHasHeader.checked = false;
}

// 🌟 開啟視窗 
document.getElementById('btnOpenSort').addEventListener('click', (e) => {
    e.stopPropagation(); 
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    openSortPanel();
});

document.getElementById('btnCloseSort').addEventListener('click', () => sortPanel.classList.add('hidden'));
document.getElementById('btnCancelSort').addEventListener('click', () => sortPanel.classList.add('hidden'));

// --- 視窗拖曳邏輯 ---
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

sortPanel.addEventListener('touchstart', (e) => {
    if (e.target.closest('button, select, input, label')) return; 
    const touch = e.touches[0];
    isDraggingSort = true; dragStartXSort = touch.clientX; dragStartYSort = touch.clientY;
    const rect = sortPanel.getBoundingClientRect();
    sortPanelStartLeft = rect.left; sortPanelStartTop = rect.top;
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
document.addEventListener('touchend', () => { isDraggingSort = false; });

// 🌟 核心引擎 1：精準計算選取範圍與涵蓋的欄位 (已修復致命 Bug)
function getSortSelectionInfo() {
    let minR = Infinity, maxR = -1;
    let cIndices = new Set(); 

    if (selectedCellBlocks.length > 0) {
        selectedCellBlocks.forEach(b => {
            minR = Math.min(minR, b.startR, b.endR);
            maxR = Math.max(maxR, b.startR, b.endR);
            // 修復點：正確計算範圍寬度，不再引發系統崩潰
            let minC = Math.min(b.startC, b.endC);
            let maxC = Math.max(b.startC, b.endC); 
            for (let c = minC; c <= maxC; c++) cIndices.add(c);
        });
    } else if (selectedRows.length > 0) {
        minR = Math.min(...selectedRows);
        maxR = Math.max(...selectedRows);
        let maxCols = dataTable.querySelector('thead tr').children.length - 2;
        for (let c = 0; c <= maxCols; c++) cIndices.add(c);
    } else if (selectedCols.length > 0) {
        minR = 0;
        maxR = dataTable.querySelectorAll('tbody tr').length - 1;
        selectedCols.forEach(c => cIndices.add(c));
    } else if (lastClickedCell) {
        minR = maxR = lastClickedCell.r;
        cIndices.add(lastClickedCell.c);
    }

    if (minR === Infinity || cIndices.size === 0) return null;

    return {
        minR,
        maxR,
        cIndices: Array.from(cIndices).sort((a, b) => a - b) 
    };
}

// 🌟 核心引擎 2：動態建立規則下拉選單 (只顯示選取範圍內的欄位)
function createSortRuleElement() {
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'flex items-center gap-2 bg-white py-1 rule-item';
    
    const optionsHtml = currentSortColumns.map(c => `<option value="${c.index}">${c.displayName}</option>`).join('');
    
    ruleDiv.innerHTML = `
        <select class="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-purple-300 code-text bg-white cursor-pointer appearance-none">
            ${optionsHtml}
        </select>
        <select class="border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-purple-300 order-select code-text bg-white cursor-pointer appearance-none">
            <option value="1">A-Z (順序)</option>
            <option value="-1">Z-A (逆序)</option>
            <option value="0">隨機 (亂數)</option>
        </select>
        <button class="text-gray-300 hover:text-red-500 transition btn-remove-rule cursor-pointer" title="移除此條件">
            <span class="material-symbols-outlined text-xl">delete</span>
        </button>
        <button class="text-gray-300 hover:text-purple-600 transition btn-add-rule cursor-pointer" title="新增排序條件">
            <span class="material-symbols-outlined text-xl">add</span>
        </button>
    `;
    
    ruleDiv.querySelector('.btn-remove-rule').addEventListener('click', () => {
        if (sortRulesContainer.children.length > 1) {
            ruleDiv.remove();
        } else {
            sortRulesContainer.innerHTML = '';
            sortRulesContainer.appendChild(createSortRuleElement());
        }
    });
    ruleDiv.querySelector('.btn-add-rule').addEventListener('click', () => {
        sortRulesContainer.insertBefore(createSortRuleElement(), ruleDiv.nextSibling);
    });
    
    return ruleDiv;
}

// 🌟 開啟與初始化設定窗格
function openSortPanel() {
    const selInfo = getSortSelectionInfo();
    if (!selInfo) {
        showToast('⚠️ 請先選取要排序的範圍');
        return;
    }
    
    // 放寬條件：即使只選一格，依然允許開啟視窗，確保 UX 順暢
    if (selInfo.minR === selInfo.maxR) {
        // showToast('⚠️ 排序範圍至少需要包含兩列資料');
        // 取消阻擋，讓它正常開窗
    }

    sortRulesContainer.innerHTML = ''; 
    
    // 更新全域欄位資訊，精準篩選出有被選取到的欄位
    currentSortColumns = selInfo.cIndices.map(colIndex => {
        const th = document.querySelector(`#data-table thead th[data-col="${colIndex}"]`);
        const customName = th && th.dataset.colName ? th.dataset.colName : '';
        const defaultName = getColLabel(colIndex);
        return {
            index: colIndex,
            displayName: customName ? `${defaultName} (${customName})` : defaultName
        };
    });
    
    sortRulesContainer.appendChild(createSortRuleElement());
    
    if (frozenRowsCount > 0 && selInfo.minR < frozenRowsCount) {
        chkSortHasHeader.checked = true;
        chkSortHasHeader.setAttribute('disabled', 'true');
    } else {
        chkSortHasHeader.checked = false; 
        chkSortHasHeader.removeAttribute('disabled');
    }

    sortPanel.classList.remove('hidden');
    
    // 確保視窗一定能出現在螢幕中央
    if (!sortPanel.style.left) {
        sortPanel.style.left = (window.innerWidth - sortPanel.offsetWidth) / 2 + 'px';
        sortPanel.style.top = (window.innerHeight - sortPanel.offsetHeight) * 0.4 + 'px';
    }
}

// 🌟 核心引擎 3：局部萃取與原位覆寫排序
document.getElementById('btnApplySort').addEventListener('click', () => {
    const ruleElements = sortRulesContainer.querySelectorAll('.rule-item');
    const rules = Array.from(ruleElements).map(el => ({
        colIndex: parseInt(el.querySelector('select').value),
        order: parseInt(el.querySelector('.order-select').value)
    }));

    if (rules.length === 0) {
        sortPanel.classList.add('hidden');
        return;
    }

    const selInfo = getSortSelectionInfo();
    if (!selInfo) return;

    let { minR, maxR, cIndices } = selInfo;

    // 若使用者宣告範圍第一列為標題，跳過不排
    if (chkSortHasHeader.checked && minR < maxR) {
        minR += 1;
    }

    if (minR >= maxR) {
        sortPanel.classList.add('hidden');
        showToast('✅ 排序完成 (僅單列無需變動)');
        return;
    }

    const tbody = dataTable.querySelector('tbody');
    let itemsToSort = [];

    // 【步驟 A】只把選取範圍的格子「挖」出來
    for (let r = minR; r <= maxR; r++) {
        let rowData = {};
        for (let c of cIndices) {
            const inner = tbody.children[r]?.children[c + 1]?.querySelector('.td-inner');
            rowData[c] = {
                text: inner ? inner.innerText : "",
                formula: inner && inner.hasAttribute('data-formula') ? inner.getAttribute('data-formula') : null
            };
        }
        itemsToSort.push({ rand: Math.random(), data: rowData });
    }

    // 【步驟 B】執行多欄位規則排序
    itemsToSort.sort((itemA, itemB) => {
        for (let rule of rules) {
            if (rule.order === 0) {
                let cmp = itemA.rand - itemB.rand;
                if (cmp !== 0) return cmp;
            } else {
                let valA = itemA.data[rule.colIndex]?.text || "";
                let valB = itemB.data[rule.colIndex]?.text || "";
                let cmp = valA.localeCompare(valB, 'zh-TW', { numeric: true });
                if (cmp !== 0) return cmp * rule.order;
            }
        }
        return 0;
    });

    // 【步驟 C】把排好的格子「塞回原本的洞裡」，絕不影響其他欄列
    for (let i = 0; i < itemsToSort.length; i++) {
        let r = minR + i;
        let sortedRowData = itemsToSort[i].data;
        
        for (let c of cIndices) {
            const inner = tbody.children[r]?.children[c + 1]?.querySelector('.td-inner');
            if (inner) {
                let cellData = sortedRowData[c];
                if (cellData.formula) {
                    inner.setAttribute('data-formula', cellData.formula);
                    inner.innerText = cellData.formula; 
                } else {
                    inner.removeAttribute('data-formula');
                    inner.innerText = cellData.text;
                }
            }
        }
    }

    // 【步驟 D】觸發全域運算與存檔
    if (typeof recalculateAllFormulas === 'function') recalculateAllFormulas(); 
    if (typeof debouncedSaveHistory === 'function') debouncedSaveHistory();   
    
    sortPanel.classList.add('hidden'); 
    showToast('✅ 局部範圍排序已成功套用！');
});


/* ==========================================
   神奇多功能工具：自動填入 模組 (邏輯優化版)
   ========================================== */
const autoFillModal = document.getElementById('autoFillModal');

// 1. 開啟與關閉對話框
document.getElementById('btnOpenAutoFill').addEventListener('click', (e) => {
    e.stopPropagation();
    autoFillModal.classList.remove('hidden');
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    centerModal(autoFillModal);
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

// 0.5 輔助函數：將數字索引轉回欄位字母 (0=A, 1=B, 26=AA)
function colNumToStr(colIndex) {
    let str = '';
    let temp = colIndex + 1;
    while (temp > 0) {
        let remainder = (temp - 1) % 26;
        str = String.fromCharCode(65 + remainder) + str;
        temp = Math.floor((temp - 1) / 26);
    }
    return str;
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

	// 字元數量比對：=EXACTCHAR(A1, B1, "X")
    // 參數 4 (選填): 1 代表精確比對 (區分大小寫，預設)，0 代表模糊比對
    EXACTCHAR: (args) => {
        // 需要至少 3 個參數：A1, B1, "要找的字元"
        if (args.length < 3) return "錯誤: 參數不足";
        
        // 內部小工具：判斷參數是「儲存格」還是「純文字」
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) {
                return String(getCellValue(cell.row, cell.col));
            }
            return arg.replace(/^["']|["']$/g, "");
        };

        const val1 = resolveArg(args[0]);
        const val2 = resolveArg(args[1]);
        const targetChar = args[2].replace(/^["']|["']$/g, "");
        
        if (!targetChar) return "錯誤: 無目標字元";

        // 判斷是否開啟 exact 精確比對模式 (預設為 true)
        let isExact = true;
        if (args.length >= 4) {
            isExact = args[3].trim() !== "0"; 
        }

        let count1 = 0;
        let count2 = 0;

        // 計算次數的邏輯 (沿用 COUNTCHAR 的穩健寫法)
        if (isExact) {
            count1 = val1.split(targetChar).length - 1;
            count2 = val2.split(targetChar).length - 1;
        } else {
            const safeTarget = targetChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(safeTarget, 'gi');
            const matches1 = val1.match(regex);
            const matches2 = val2.match(regex);
            count1 = matches1 ? matches1.length : 0;
            count2 = matches2 ? matches2.length : 0;
        }

        // 比較次數並組合輸出結果
        if (count1 === count2) {
            return `O,${count1}`;
        } else {
            return `X,${count1},${count2}`;
        }
    },

	// 截取左側字元：=LEFT(文字, [截取長度])
    LEFT: (args) => {
        if (args.length < 1) return "錯誤: 參數不足";
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) return String(getCellValue(cell.row, cell.col));
            return arg.replace(/^["']|["']$/g, "");
        };
        const text = resolveArg(args[0]);
        let numChars = 1; // 預設截取 1 個字元
        if (args.length >= 2) {
            numChars = parseInt(resolveArg(args[1]), 10);
            if (isNaN(numChars) || numChars < 0) return "#VALUE!";
        }
        if (numChars === 0) return "";
        
        // 使用展開運算子完美處理 Unicode 擴充漢字
        const chars = [...text];
        return chars.slice(0, numChars).join('');
    },

    // 截取右側字元：=RIGHT(文字, [截取長度])
    RIGHT: (args) => {
        if (args.length < 1) return "錯誤: 參數不足";
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) return String(getCellValue(cell.row, cell.col));
            return arg.replace(/^["']|["']$/g, "");
        };
        const text = resolveArg(args[0]);
        let numChars = 1;
        if (args.length >= 2) {
            numChars = parseInt(resolveArg(args[1]), 10);
            if (isNaN(numChars) || numChars < 0) return "#VALUE!";
        }
        if (numChars === 0) return "";
        
        const chars = [...text];
        if (numChars >= chars.length) return text;
        return chars.slice(-numChars).join('');
    },

    // 截取中間字元：=MID(文字, 起始位置, 截取長度)
    MID: (args) => {
        if (args.length < 3) return "錯誤: 參數不足";
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) return String(getCellValue(cell.row, cell.col));
            return arg.replace(/^["']|["']$/g, "");
        };
        const text = resolveArg(args[0]);
        const startNum = parseInt(resolveArg(args[1]), 10);
        const numChars = parseInt(resolveArg(args[2]), 10);
        
        if (isNaN(startNum) || startNum < 1 || isNaN(numChars) || numChars < 0) return "#VALUE!";
        if (numChars === 0) return "";
        
        const chars = [...text];
        if (startNum > chars.length) return "";
        
        // Excel 的起始位置是 1-based，所以陣列索引要減 1
        return chars.slice(startNum - 1, startNum - 1 + numChars).join('');
    },
	
	// 陣列合併：=JOIN(分隔符, 範圍) 或 =JOIN("-", A1, B1)
    // 陣列合併：=JOIN(分隔符, 範圍) 或 =JOIN("-", A1, B1)
    JOIN: (args) => {
        if (args.length < 2) return "錯誤: 參數不足";
        
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            return cell ? String(getCellValue(cell.row, cell.col)) : arg.replace(/^["']|["']$/g, "");
        };

        const separator = resolveArg(args[0]);
        let valuesToJoin = [];

        // 遍歷第二個參數開始的所有項目
        for (let i = 1; i < args.length; i++) {
            const arg = args[i].trim();
            // 如果是範圍 (包含冒號)
            if (arg.includes(':')) {
                const rangeVals = getRangeValues(arg);
                valuesToJoin = valuesToJoin.concat(rangeVals.map(String));
            } else {
                valuesToJoin.push(resolveArg(arg));
            }
        }
        
        // 排除空字串後再合併
        return valuesToJoin.filter(v => v !== "").join(separator);
    },

    // 正則擷取：=REGEXEXTRACT(文字, 正規表達式)
    REGEXEXTRACT: (args) => {
        if (args.length < 2) return "錯誤: 參數不足";
        
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            return cell ? String(getCellValue(cell.row, cell.col)) : arg.replace(/^["']|["']$/g, "");
        };

        const text = resolveArg(args[0]);
        const regexStr = resolveArg(args[1]);

        try {
            const regex = new RegExp(regexStr);
            const match = text.match(regex);
            // 如果有捕捉群組，回傳第一個群組；否則回傳整個匹配的字串
            return match ? (match[1] || match[0]) : "#N/A";
        } catch (e) {
            return "錯誤: 無效的正則表達式";
        }
    },

    // 取代位置字元：=REPLACE(文字, 起始位置, 取代長度, 新文字)
    REPLACE: (args) => {
        if (args.length < 4) return "錯誤: 參數不足";
        
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            return cell ? String(getCellValue(cell.row, cell.col)) : arg.replace(/^["']|["']$/g, "");
        };

        const text = resolveArg(args[0]);
        const startPos = parseInt(resolveArg(args[1]), 10);
        const numChars = parseInt(resolveArg(args[2]), 10);
        const newText = resolveArg(args[3]);

        if (isNaN(startPos) || startPos < 1 || isNaN(numChars) || numChars < 0) return "#VALUE!";

        // 轉換成陣列以支援擴充漢字
        const chars = [...text];
        const before = chars.slice(0, startPos - 1).join('');
        const after = chars.slice(startPos - 1 + numChars).join('');

        return before + newText + after;
    },

	// 隨機亂數：=RAND() 或 =RAND(最小, 最大)
    RAND: (args) => {
        if (args.length >= 2) {
            // 確保從小排到大，避免使用者輸入 =RAND(10, 1) 發生錯誤
            const val1 = parseInt(args[0], 10);
            const val2 = parseInt(args[1], 10);
            
            if (!isNaN(val1) && !isNaN(val2)) {
                const min = Math.min(val1, val2);
                const max = Math.max(val1, val2);
                const key = `${min}-${max}`; // 為這個範圍建立專屬的袋子標籤
                
                // 1. 如果這個範圍的袋子不存在，或是數字已經被抽光了，就重新裝填並洗牌
                if (!window.randBags[key] || window.randBags[key].length === 0) {
                    let newBag = [];
                    for (let i = min; i <= max; i++) {
                        newBag.push(i);
                    }
                    
                    // 進行陣列洗牌 (著名的 Fisher-Yates 洗牌演算法)
                    for (let i = newBag.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
                    }
                    window.randBags[key] = newBag;
                }
                
                // 2. 從洗好的袋子中抽出最後一個數字並回傳
                return window.randBags[key].pop();
            }
        }
        
        // 若沒有參數，維持 6 位小數的標準亂數
        return parseFloat(Math.random().toFixed(6));
    },
    // 總和計算
    SUM: (args) => {
        if (!args[0]) return 0;
        const values = getRangeValues(args[0]);
        return values.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
    },

	// 垂直搜尋：=VLOOKUP(尋找目標, 搜尋範圍, 回傳欄數, [是否精確比對])
    // 範例：=VLOOKUP(A1, D:E, 2, 0)
    VLOOKUP: (args) => {
        if (args.length < 3) return "錯誤: 參數不足";

        // 1. 解析「尋找目標」(Lookup Value)
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) return getCellValue(cell.row, cell.col);
            return arg.replace(/^["']|["']$/g, ""); // 移除引號
        };
        const lookupValue = String(resolveArg(args[0])).trim();

        // 2. 解析「搜尋範圍」(Table Array)
        const rangeParts = args[1].split(':');
        if (rangeParts.length !== 2) return "#VALUE!";
        
        const str1 = rangeParts[0].trim().toUpperCase();
        const str2 = rangeParts[1].trim().toUpperCase();
        
        let minRow, maxRow, minCol, maxCol;

        // 支援整欄選取 (如 D:E)
        if (/^[A-Z]+$/.test(str1) && /^[A-Z]+$/.test(str2)) {
            minCol = Math.min(colStrToNum(str1), colStrToNum(str2));
            maxCol = Math.max(colStrToNum(str1), colStrToNum(str2));
            minRow = 0;
            maxRow = dataTable.querySelectorAll('tbody tr').length - 1;
        } 
        // 支援區塊選取 (如 D1:E10)
        else {
            const start = parseCellReference(str1);
            const end = parseCellReference(str2);
            if (!start || !end) return "#REF!";
            minRow = Math.min(start.row, end.row);
            maxRow = Math.max(start.row, end.row);
            minCol = Math.min(start.col, end.col);
            maxCol = Math.max(start.col, end.col);
        }

        // 3. 解析「回傳欄數」(Column Index)
        const colIndex = parseInt(args[2].trim(), 10);
        if (isNaN(colIndex) || colIndex < 1) return "#VALUE!";
        
        // 檢查回傳欄數是否超出了選取範圍的寬度
        if (colIndex > (maxCol - minCol + 1)) return "#REF!";

        // 4. 解析「比對模式」 (預設為精確比對)
        let isExact = true; 
        if (args.length >= 4) {
            const exactArg = args[3].trim().toUpperCase();
            if (exactArg === '1' || exactArg === 'TRUE') isExact = false;
        }

        // 5. 開始由上往下逐列搜尋
        for (let r = minRow; r <= maxRow; r++) {
            // 抓取該列第一欄的值
            const cellVal = String(getCellValue(r, minCol)).trim();
            
            // 簡單強大的字串比對
            if (cellVal === lookupValue) {
                // 找到目標！回傳該列往右數 (colIndex - 1) 欄的值
                return getCellValue(r, minCol + colIndex - 1);
            }
        }

        // 找不到目標時，回傳標準的 Excel 錯誤代碼
        return "#N/A";
    },
	
	// 垂直搜尋全部符合項目：=VLOOKUPALL(尋找目標, 搜尋範圍, 回傳欄數, [分隔符號])
    // 範例：=VLOOKUPALL(A1, D:E, 2, ", ")
    VLOOKUPALL: (args) => {
        if (args.length < 3) return "錯誤: 參數不足";

        // 1. 解析「尋找目標」(Lookup Value)
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) return getCellValue(cell.row, cell.col);
            return arg.replace(/^["']|["']$/g, "");
        };
        const lookupValue = String(resolveArg(args[0])).trim();

        // 2. 解析「搜尋範圍」(Table Array)
        const rangeParts = args[1].split(':');
        if (rangeParts.length !== 2) return "#VALUE!";
        
        const str1 = rangeParts[0].trim().toUpperCase();
        const str2 = rangeParts[1].trim().toUpperCase();
        
        let minRow, maxRow, minCol, maxCol;

        if (/^[A-Z]+$/.test(str1) && /^[A-Z]+$/.test(str2)) {
            minCol = Math.min(colStrToNum(str1), colStrToNum(str2));
            maxCol = Math.max(colStrToNum(str1), colStrToNum(str2));
            minRow = 0;
            maxRow = dataTable.querySelectorAll('tbody tr').length - 1;
        } else {
            const start = parseCellReference(str1);
            const end = parseCellReference(str2);
            if (!start || !end) return "#REF!";
            minRow = Math.min(start.row, end.row);
            maxRow = Math.max(start.row, end.row);
            minCol = Math.min(start.col, end.col);
            maxCol = Math.max(start.col, end.col);
        }

        // 3. 解析「回傳欄數」(Column Index)
        const colIndex = parseInt(args[2].trim(), 10);
        if (isNaN(colIndex) || colIndex < 1) return "#VALUE!";
        if (colIndex > (maxCol - minCol + 1)) return "#REF!";

        // 4. 解析「分隔符號」 (預設為 ", ")
        let separator = ", ";
        if (args.length >= 4) {
            // 允許使用者自訂分隔符，並移除外層引號
            separator = args[3].replace(/^["']|["']$/g, ""); 
        }

        // 5. 開始由上往下逐列搜尋，收集所有符合的項目
        const results = [];
        for (let r = minRow; r <= maxRow; r++) {
            const cellVal = String(getCellValue(r, minCol)).trim();
            
            if (cellVal === lookupValue) {
                const matchVal = String(getCellValue(r, minCol + colIndex - 1)).trim();
                // 避免把完全空白的格子也加進去
                if (matchVal !== "") {
                    results.push(matchVal);
                }
            }
        }

        // 6. 組合並回傳結果
        if (results.length === 0) return "#N/A";
        return results.join(separator);
    },// 垂直搜尋全部符合項目：=VLOOKUPALL(尋找目標, 搜尋範圍, 回傳欄數, [分隔符號])
    // 範例：=VLOOKUPALL(A1, D:E, 2, ", ")
    VLOOKUPALL: (args) => {
        if (args.length < 3) return "錯誤: 參數不足";

        // 1. 解析「尋找目標」(Lookup Value)
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) return getCellValue(cell.row, cell.col);
            return arg.replace(/^["']|["']$/g, "");
        };
        const lookupValue = String(resolveArg(args[0])).trim();

        // 2. 解析「搜尋範圍」(Table Array)
        const rangeParts = args[1].split(':');
        if (rangeParts.length !== 2) return "#VALUE!";
        
        const str1 = rangeParts[0].trim().toUpperCase();
        const str2 = rangeParts[1].trim().toUpperCase();
        
        let minRow, maxRow, minCol, maxCol;

        if (/^[A-Z]+$/.test(str1) && /^[A-Z]+$/.test(str2)) {
            minCol = Math.min(colStrToNum(str1), colStrToNum(str2));
            maxCol = Math.max(colStrToNum(str1), colStrToNum(str2));
            minRow = 0;
            maxRow = dataTable.querySelectorAll('tbody tr').length - 1;
        } else {
            const start = parseCellReference(str1);
            const end = parseCellReference(str2);
            if (!start || !end) return "#REF!";
            minRow = Math.min(start.row, end.row);
            maxRow = Math.max(start.row, end.row);
            minCol = Math.min(start.col, end.col);
            maxCol = Math.max(start.col, end.col);
        }

        // 3. 解析「回傳欄數」(Column Index)
        const colIndex = parseInt(args[2].trim(), 10);
        if (isNaN(colIndex) || colIndex < 1) return "#VALUE!";
        if (colIndex > (maxCol - minCol + 1)) return "#REF!";

        // 4. 解析「分隔符號」 (預設為 ", ")
        let separator = ", ";
        if (args.length >= 4) {
            // 允許使用者自訂分隔符，並移除外層引號
            separator = args[3].replace(/^["']|["']$/g, ""); 
        }

        // 5. 開始由上往下逐列搜尋，收集所有符合的項目
        const results = [];
        for (let r = minRow; r <= maxRow; r++) {
            const cellVal = String(getCellValue(r, minCol)).trim();
            
            if (cellVal === lookupValue) {
                const matchVal = String(getCellValue(r, minCol + colIndex - 1)).trim();
                // 避免把完全空白的格子也加進去
                if (matchVal !== "") {
                    results.push(matchVal);
                }
            }
        }

        // 6. 組合並回傳結果
        if (results.length === 0) return "#N/A";
        return results.join(separator);
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

// 5. 解析並執行公式字串 (支援簡寫、引號保護、保留大小寫、智慧括號、基礎運算)
function evaluateFormula(formulaStr) {
    let cleanFormula = formulaStr.substring(1).trim(); 
    
    // 🌟 智慧補齊右括號 (自動加上缺失的 ')')
    const openBrackets = (cleanFormula.match(/\(/g) || []).length;
    const closeBrackets = (cleanFormula.match(/\)/g) || []).length;
    if (openBrackets > closeBrackets) {
        cleanFormula += ')'.repeat(openBrackets - closeBrackets);
    }
    
    // 判斷是否為函數模式：找尋 函數名(參數)
    const match = cleanFormula.match(/^([a-zA-Z]+)\((.*)\)$/);
    
    // 🌟 如果不是函數，嘗試作為基礎運算式執行 (例如 A1+B1, C2&"測試")
    if (!match) {
        let evalStr = cleanFormula;
        
        // 解析儲存格並帶入實際值
        evalStr = evalStr.replace(/[A-Z]+\d+/gi, (cellRef) => {
            const cell = parseCellReference(cellRef);
            if (!cell) return cellRef;
            const val = getCellValue(cell.row, cell.col);
            // 數字直接輸出，文字則包上雙引號並做安全跳脫
            if (typeof val === 'number' && !isNaN(val)) return val;
            return `"${String(val).replace(/"/g, '\\"')}"`;
        });

        // 處理 '&' 連接符號：將不在引號內的 '&' 替換為 '+""+'，強制將前後變數轉型並執行純文字合併
        let inQuotesForAmp = false;
        let processedEvalStr = '';
        for(let i=0; i<evalStr.length; i++) {
            if (evalStr[i] === '"') inQuotesForAmp = !inQuotesForAmp;
            if (evalStr[i] === '&' && !inQuotesForAmp) {
                processedEvalStr += '+""+';
            } else {
                processedEvalStr += evalStr[i];
            }
        }
        evalStr = processedEvalStr;

        try {
            // 使用安全的 Function 建構式進行數學與字串運算
            const result = new Function(`return ${evalStr}`)();
            return result === undefined ? "" : result;
        } catch (e) {
            return "錯誤: 無效的運算式";
        }
    }
    
    let funcName = match[1].toUpperCase();
    let argsStr = match[2]; 
    
    const args = [];
    let currentArg = '';
    let inDoubleQuotes = false;
    let inSingleQuotes = false;
    
    for (let i = 0; i < argsStr.length; i++) {
        const char = argsStr[i];
        
        if (char === '"' && !inSingleQuotes) inDoubleQuotes = !inDoubleQuotes;
        else if (char === "'" && !inDoubleQuotes) inSingleQuotes = !inSingleQuotes;
        
        if (char === ',' && !inDoubleQuotes && !inSingleQuotes) {
            args.push(currentArg.trim());
            currentArg = '';
        } else {
            currentArg += char;
        }
    }
    args.push(currentArg.trim());

    const aliases = {
        'L': 'LEN',
        'S': 'SUM',
        'CI': 'COUNTIF',
        'CC': 'COUNTCHAR',
        'E': 'EXACT',
        'EC': 'EXACTCHAR',
		'V': 'VLOOKUP',
		'VA': 'VLOOKUPALL',
		'LF': 'LEFT',
        'R': 'RIGHT',
        'M': 'MID',
        'J': 'JOIN',
        'RE': 'REGEXEXTRACT',
        'RP': 'REPLACE',
		'RD': 'RAND',
    };
    
    if (aliases[funcName]) {
        funcName = aliases[funcName];
    }
    
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




/* ==========================================
   神奇多功能工具：自動函數 模組
   ========================================== */
const autoFormulaModal = document.getElementById('autoFormulaModal');
const autoFormulaInput = document.getElementById('autoFormulaInput');
const autoFormulaSelect = document.getElementById('autoFormulaSelect');

// 開啟與關閉對話框
document.getElementById('btnOpenAutoFormula').addEventListener('click', (e) => {
    e.stopPropagation();
    autoFormulaModal.classList.remove('hidden');
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    centerModal(autoFormulaModal);
    autoFormulaInput.focus();
});
document.getElementById('btnCloseAutoFormula').addEventListener('click', () => {
    autoFormulaModal.classList.add('hidden');
});

// 當選擇參考函數時，自動帶入輸入框並智慧調整列號
autoFormulaSelect.addEventListener('change', (e) => {
    let formulaStr = e.target.value;
    if (!formulaStr) return;

    // 1. 嘗試找出目前選取範圍的「起始列 (0-based)」
    let startR = -1;
    
    if (selectedCellBlocks.length > 0) {
        startR = Math.min(selectedCellBlocks[0].startR, selectedCellBlocks[0].endR);
    } else if (selectedRows.length > 0) {
        startR = Math.min(...selectedRows);
    } else if (lastClickedCell) {
        startR = lastClickedCell.r;
    } else {
        // 如果都沒選，看看游標停在哪一格
        const activeInner = document.activeElement.closest('.td-inner');
        if (activeInner && dataTable.contains(activeInner)) {
            const tr = activeInner.closest('tr');
            startR = Array.from(tr.parentNode.children).indexOf(tr);
        }
    }

    // 2. 如果有找到起始列，將範例公式中的列號加上位移量
    if (startR !== -1) {
        // 範例公式都是以第 1 列 (Row 1) 為基準，所以位移量就是 startR
        const rowOffset = startR;
        
        // 使用正則表達式尋找所有「字母+數字」的組合 (例如 A1, B1, A5)
        formulaStr = formulaStr.replace(/([A-Z]+)(\d+)\b/g, (match, col, row) => {
            const originalRow = parseInt(row, 10);
            // 將原本的數字加上位移量 (例如起點在第 3 列，A1 會變成 A3，A5 會變成 A7)
            return col + (originalRow + rowOffset);
        });
    }

    // 3. 將調整好的公式填入輸入框
    autoFormulaInput.value = formulaStr;
});

// 視窗全區拖曳 (桌機 + 手機)
let isDraggingAFM = false, dragStartXAFM = 0, dragStartYAFM = 0, afmStartLeft = 0, afmStartTop = 0;
autoFormulaModal.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, select, button, label')) return; 
    isDraggingAFM = true; dragStartXAFM = e.clientX; dragStartYAFM = e.clientY;
    const rect = autoFormulaModal.getBoundingClientRect();
    afmStartLeft = rect.left; afmStartTop = rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingAFM) return;
    autoFormulaModal.style.left = `${afmStartLeft + (e.clientX - dragStartXAFM)}px`;
    autoFormulaModal.style.top = `${afmStartTop + (e.clientY - dragStartYAFM)}px`;
    autoFormulaModal.style.right = 'auto'; 
});
document.addEventListener('mouseup', () => { isDraggingAFM = false; document.body.style.userSelect = ''; });

autoFormulaModal.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, select, button, label')) return; 
    const touch = e.touches[0];
    isDraggingAFM = true; dragStartXAFM = touch.clientX; dragStartYAFM = touch.clientY;
    const rect = autoFormulaModal.getBoundingClientRect();
    afmStartLeft = rect.left; afmStartTop = rect.top;
    if (!e.target.closest('input, select')) e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    if (!isDraggingAFM) return;
    const touch = e.touches[0];
    autoFormulaModal.style.left = `${afmStartLeft + (touch.clientX - dragStartXAFM)}px`;
    autoFormulaModal.style.top = `${afmStartTop + (touch.clientY - dragStartYAFM)}px`;
    autoFormulaModal.style.right = 'auto'; 
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { isDraggingAFM = false; });

// 核心邏輯：套用智慧函數
document.getElementById('btnApplyAutoFormula').addEventListener('click', () => {
    if (currentMode !== 'table') return showToast('⚠️ 僅能在表格模式使用');
    
    let formulaStr = autoFormulaInput.value.trim();
    if (!formulaStr) return showToast('⚠️ 請輸入公式');
    if (!formulaStr.startsWith('=')) formulaStr = '=' + formulaStr; // 防呆：自動補上等號

    const rows = dataTable.querySelectorAll('tbody tr');
    const cellsToUpdate = [];
    let startR = Infinity, startC = Infinity; // 用來找出選取範圍的「最左上角(起點)」

    // 收集所有被選取的儲存格，並找出起點
    for (let r = 0; r < rows.length; r++) {
        const tr = rows[r];
        const colsCount = tr.children.length - 1; 
        for (let c = 0; c < colsCount; c++) {
            // 判斷是否在選取範圍內
            if (selectedRows.includes(r) || selectedCols.includes(c) || isCellInAnyBlock(r, c)) {
                const inner = tr.children[c + 1]?.querySelector('.td-inner');
                if (inner) {
                    cellsToUpdate.push({ r, c, inner });
                    startR = Math.min(startR, r);
                    startC = Math.min(startC, c);
                }
            }
        }
    }

    // 處理單格選取 (如果沒有多選，就只套用目前游標或點擊的那一格)
    if (cellsToUpdate.length === 0) {
        let targetInner = null;
        let r = -1, c = -1;
        const activeEl = document.activeElement;
        if (activeEl && activeEl.classList.contains('td-inner') && dataTable.contains(activeEl)) {
            targetInner = activeEl;
            r = Array.from(activeEl.closest('tr').parentNode.children).indexOf(activeEl.closest('tr'));
            c = Array.from(activeEl.closest('tr').children).indexOf(activeEl.closest('td')) - 1;
        } else if (lastClickedCell && rows[lastClickedCell.r]) {
            targetInner = rows[lastClickedCell.r].children[lastClickedCell.c + 1]?.querySelector('.td-inner');
            r = lastClickedCell.r; c = lastClickedCell.c;
        }

        if (targetInner) {
            cellsToUpdate.push({ r, c, inner: targetInner });
            startR = r; startC = c;
        } else {
            return showToast('⚠️ 請先選取要套用的儲存格範圍');
        }
    }

    // 執行套用與公式平移
    cellsToUpdate.forEach(cell => {
        // 計算這格相對於「第一格」的位移量
        const rowOffset = cell.r - startR;
        const colOffset = cell.c - startC;
        
        // 利用我們寫好的引擎進行平移 (例如 B2 移到 B3，公式中的 A3 就會變成 A4)
        const shiftedFormula = shiftFormula(formulaStr, rowOffset, colOffset);
        
        // 寫入儲存格
        cell.inner.setAttribute('data-formula', shiftedFormula);
        cell.inner.innerText = shiftedFormula;
    });

    // 觸發全表重算、存檔與歷史紀錄
    recalculateAllFormulas();
    debouncedSaveHistory();
    
    showToast('✅ 函數已智慧套用完成！');
});



/* ==========================================
   神奇多功能工具：移除重複 模組
   ========================================== */
const removeDuplicatesModal = document.getElementById('removeDuplicatesModal');

// 開啟與關閉對話框
document.getElementById('btnOpenRemoveDuplicates').addEventListener('click', (e) => {
    e.stopPropagation();
    removeDuplicatesModal.classList.remove('hidden');
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    centerModal(removeDuplicatesModal); // 呼叫你之前寫好的置中函數
});
document.getElementById('btnCloseRemoveDuplicates').addEventListener('click', () => {
    removeDuplicatesModal.classList.add('hidden');
});

// 視窗全區拖曳 (桌機 + 手機)
let isDraggingRDM = false, dragStartXRDM = 0, dragStartYRDM = 0, rdmStartLeft = 0, rdmStartTop = 0;
removeDuplicatesModal.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, select, button, label')) return; 
    isDraggingRDM = true; dragStartXRDM = e.clientX; dragStartYRDM = e.clientY;
    const rect = removeDuplicatesModal.getBoundingClientRect();
    rdmStartLeft = rect.left; rdmStartTop = rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingRDM) return;
    removeDuplicatesModal.style.left = `${rdmStartLeft + (e.clientX - dragStartXRDM)}px`;
    removeDuplicatesModal.style.top = `${rdmStartTop + (e.clientY - dragStartYRDM)}px`;
    removeDuplicatesModal.style.transform = 'none'; // 覆寫 Tailwind 的置中偏移
});
document.addEventListener('mouseup', () => { isDraggingRDM = false; document.body.style.userSelect = ''; });
removeDuplicatesModal.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, select, button, label')) return; 
    const touch = e.touches[0];
    isDraggingRDM = true; dragStartXRDM = touch.clientX; dragStartYRDM = touch.clientY;
    const rect = removeDuplicatesModal.getBoundingClientRect();
    rdmStartLeft = rect.left; rdmStartTop = rect.top;
    if (!e.target.closest('input')) e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    if (!isDraggingRDM) return;
    const touch = e.touches[0];
    removeDuplicatesModal.style.left = `${rdmStartLeft + (touch.clientX - dragStartXRDM)}px`;
    removeDuplicatesModal.style.top = `${rdmStartTop + (touch.clientY - dragStartYRDM)}px`;
    removeDuplicatesModal.style.transform = 'none';
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { isDraggingRDM = false; });

// 輔助函數：在指定欄位右側精準插入一欄 (修復標題空白問題)
// 輔助函數：在指定欄位右側精準插入一欄 (修復標題空白與格式問題)
function insertColumnRightOf(colIdx) {
    const theadTr = dataTable.querySelector('thead tr');
    const newTh = document.createElement('th');
    
    // 使用系統標準的表頭樣式，並呼叫 createThColHTML 建立標題結構
    newTh.className = 'sticky-top group';
    newTh.style.width = '150px';
    newTh.style.minWidth = '150px';
    newTh.style.maxWidth = '150px';
    newTh.innerHTML = createThColHTML(0); 
    
    if (colIdx + 2 < theadTr.children.length) {
        theadTr.insertBefore(newTh, theadTr.children[colIdx + 2]);
    } else {
        theadTr.appendChild(newTh);
    }
    
    const tbody = dataTable.querySelector('tbody');
    Array.from(tbody.children).forEach(tr => {
        const newTd = document.createElement('td');
        // 使用系統標準的儲存格結構
        const inner = document.createElement('div');
        inner.className = 'td-inner';
        inner.contentEditable = "true";
        newTd.appendChild(inner);
        
        if (colIdx + 2 < tr.children.length) {
            tr.insertBefore(newTd, tr.children[colIdx + 2]);
        } else {
            tr.appendChild(newTd);
        }
    });
    
    // 強制重繪標題陣列與記憶設定
    if (typeof updateTableHeaders === 'function') updateTableHeaders();
    if (typeof saveColNames === 'function') saveColNames();
    if (typeof saveColWidths === 'function') saveColWidths();
}

// 核心邏輯：執行移除重複
document.getElementById('btnApplyRemoveDuplicates').addEventListener('click', () => {
    if (currentMode !== 'table') return showToast('⚠️ 僅能在表格模式使用');
    
    // 1. 確認並鎖定選取範圍
    let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
    if (selectedCellBlocks.length > 0) {
        selectedCellBlocks.forEach(b => {
            minR = Math.min(minR, b.startR, b.endR); maxR = Math.max(maxR, b.startR, b.endR);
            minC = Math.min(minC, b.startC, b.endC); maxC = Math.max(maxC, b.startC, b.endC);
        });
    } else if (selectedRows.length > 0) {
        minR = Math.min(...selectedRows); maxR = Math.max(...selectedRows);
        minC = 0; maxC = dataTable.querySelector('thead tr').children.length - 2;
    } else if (selectedCols.length > 0) {
        minR = 0; maxR = dataTable.querySelectorAll('tbody tr').length - 1;
        minC = Math.min(...selectedCols); maxC = Math.max(...selectedCols);
    } else if (lastClickedCell) {
        minR = maxR = lastClickedCell.r;
        minC = maxC = lastClickedCell.c;
    } else {
        return showToast('⚠️ 請先選取要處理的範圍');
    }

    const layout = document.querySelector('input[name="rdLayout"]:checked').value;
    const addCountCol = document.getElementById('chkRdCount').checked;
    const tbodyRows = dataTable.querySelectorAll('tbody tr');
    const DELIMITER = '||_RDM_||';

    // 2. 第一階段掃描：讀取資料並建立唯一金鑰字典
    const seen = new Map();     
    const counts = new Map();   
    const uniqueData = [];      

    const readCell = (r, c) => {
        const inner = tbodyRows[r]?.children[c + 1]?.querySelector('.td-inner');
        return inner ? { formula: inner.getAttribute('data-formula'), text: inner.innerText } : { formula: null, text: '' };
    };

    for (let r = minR; r <= maxR; r++) {
        let rowData = [];
        let keyParts = [];
        for (let c = minC; c <= maxC; c++) {
            const cellData = readCell(r, c);
            rowData.push(cellData);
            keyParts.push(cellData.formula || cellData.text); 
        }
        
        const key = keyParts.join(DELIMITER);
        
        // ======== 核心修正：判斷全空行並直接跳過 ========
        // 如果整行的每一個格子都是空的 (null 或只包含空白)，直接忽略這行！
        const isEmptyRow = keyParts.every(p => !p || String(p).trim() === '');
        if (isEmptyRow) continue; 
        // ===============================================
        
        if (!seen.has(key)) {
            seen.set(key, r);
            counts.set(key, 1);
            uniqueData.push({ key, data: rowData }); 
        } else {
            counts.set(key, counts.get(key) + 1);
        }
    }

    // 3. 第二階段：視需求新增右欄
    let countColIdx = -1;
    if (addCountCol) {
        insertColumnRightOf(maxC);
        countColIdx = maxC + 1; 
    }

    const updatedRows = dataTable.querySelectorAll('tbody tr');
    
    const writeCell = (r, c, cellData) => {
        const inner = updatedRows[r]?.children[c + 1]?.querySelector('.td-inner');
        if (!inner) return;
        if (cellData && cellData.formula) {
            inner.setAttribute('data-formula', cellData.formula);
            inner.innerText = cellData.formula; 
        } else {
            inner.removeAttribute('data-formula');
            inner.innerText = cellData ? cellData.text : '';
        }
    };

    // 4. 第三階段：覆寫資料
    if (layout === 'inplace') {
        // 【留在原位】
        for (let r = minR; r <= maxR; r++) {
            let keyParts = [];
            for (let c = minC; c <= maxC; c++) {
                const cellData = readCell(r, c);
                keyParts.push(cellData.formula || cellData.text);
            }
            const key = keyParts.join(DELIMITER);
            const isEmptyRow = keyParts.every(p => !p || String(p).trim() === '');
            
            if (isEmptyRow) continue; // 遇到空行不處理也不清空

            if (seen.get(key) === r) {
                // 首次出現保留，若有勾選則填入次數
                if (addCountCol) {
                    writeCell(r, countColIdx, { text: counts.get(key).toString(), formula: null });
                }
            } else {
                // 重複出現，清空儲存格
                for (let c = minC; c <= maxC; c++) writeCell(r, c, { text: '', formula: null });
            }
        }
    } else {
        // 【往上集中】
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) writeCell(r, c, { text: '', formula: null });
        }
        
        let targetR = minR;
        for (const ud of uniqueData) {
            // uniqueData 裡面現在保證沒有全空行了
            for (let i = 0; i < ud.data.length; i++) {
                writeCell(targetR, minC + i, ud.data[i]);
            }
            if (addCountCol) {
                writeCell(targetR, countColIdx, { text: counts.get(ud.key).toString(), formula: null });
            }
            targetR++;
        }
    }

    // 5. 收尾工作
    recalculateAllFormulas(); 
    debouncedSaveHistory();
    removeDuplicatesModal.classList.add('hidden');
    showToast(`✅ 移除重複完成！`);
});

/* ==========================================
   公式動態參照更新引擎 (攔截欄位移動)
   ========================================== */
function adjustFormulasForColMove(oldIdx, newIdx) {
    if (oldIdx === newIdx) return;

    // 1. 建立欄位索引的新舊對照表 (Mapping)
    const colMap = {};
    for (let i = 0; i < 1000; i++) colMap[i] = i; // 初始化 1000 欄

    if (oldIdx < newIdx) {
        // 往右移：中間的欄位會全部往左遞補 (-1)
        for (let i = oldIdx + 1; i <= newIdx; i++) colMap[i] = i - 1;
        colMap[oldIdx] = newIdx;
    } else {
        // 往左移：中間的欄位會全部往右推 (+1)
        for (let i = newIdx; i < oldIdx; i++) colMap[i] = i + 1;
        colMap[oldIdx] = newIdx;
    }

    // 2. 定義安全的正則表達式：
    // 群組1: (["'].*?["']) -> 抓取引號內的字串 (保護不替換)
    // 群組2,3: ([a-zA-Z]+)(\d+)\b -> 抓取單格座標如 A1, B2
    // 群組4,5: ([a-zA-Z]+):([a-zA-Z]+)\b -> 抓取整欄座標如 A:B
    const regex = /(["'].*?["'])|([a-zA-Z]+)(\d+)\b|([a-zA-Z]+):([a-zA-Z]+)\b/g;

    const cells = dataTable.querySelectorAll('.td-inner');
    
    // 3. 掃描全表更新公式
    cells.forEach(cell => {
        const formula = cell.getAttribute('data-formula');
        if (formula) {
            const newFormula = formula.replace(regex, (match, str, col, row, col1, col2) => {
                if (str) return str; // 若是純字串，原封不動退回
                
                // 處理 A1, B5 這種單格座標
                if (col && row) {
                    let oldColIdx = colStrToNum(col.toUpperCase());
                    let newColIdx = colMap[oldColIdx] !== undefined ? colMap[oldColIdx] : oldColIdx;
                    return colNumToStr(newColIdx) + row;
                }
                
                // 處理 A:B 這種整欄座標
                if (col1 && col2) {
                    let oldColIdx1 = colStrToNum(col1.toUpperCase());
                    let newColIdx1 = colMap[oldColIdx1] !== undefined ? colMap[oldColIdx1] : oldColIdx1;
                    let oldColIdx2 = colStrToNum(col2.toUpperCase());
                    let newColIdx2 = colMap[oldColIdx2] !== undefined ? colMap[oldColIdx2] : oldColIdx2;
                    return colNumToStr(newColIdx1) + ':' + colNumToStr(newColIdx2);
                }
                
                return match;
            });

            // 寫入更新後的公式
            cell.setAttribute('data-formula', newFormula);
            cell.innerText = newFormula;
        }
    });

    // 4. 更新完畢後，觸發全表重算讓新結果顯示
    recalculateAllFormulas();
}



/* ==========================================
   神奇多功能工具：自動分割 模組
   ========================================== */
const autoSplitModal = document.getElementById('autoSplitModal');

// 1. 開啟與關閉對話框
document.getElementById('btnOpenAutoSplit').addEventListener('click', (e) => {
    e.stopPropagation();
    autoSplitModal.classList.remove('hidden');
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    centerModal(autoSplitModal); // 呼叫你寫好的置中函數
});
document.getElementById('btnCloseAutoSplit').addEventListener('click', () => {
    autoSplitModal.classList.add('hidden');
});

// 2. 視窗全區拖曳 (桌機 + 手機)
let isDraggingASM = false, dragStartXASM = 0, dragStartYASM = 0, asmStartLeft = 0, asmStartTop = 0;
autoSplitModal.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, button, label')) return; 
    isDraggingASM = true; dragStartXASM = e.clientX; dragStartYASM = e.clientY;
    const rect = autoSplitModal.getBoundingClientRect();
    asmStartLeft = rect.left; asmStartTop = rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingASM) return;
    autoSplitModal.style.left = `${asmStartLeft + (e.clientX - dragStartXASM)}px`;
    autoSplitModal.style.top = `${asmStartTop + (e.clientY - dragStartYASM)}px`;
    autoSplitModal.style.transform = 'none';
});
document.addEventListener('mouseup', () => { isDraggingASM = false; document.body.style.userSelect = ''; });
autoSplitModal.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, button, label')) return; 
    const touch = e.touches[0];
    isDraggingASM = true; dragStartXASM = touch.clientX; dragStartYASM = touch.clientY;
    const rect = autoSplitModal.getBoundingClientRect();
    asmStartLeft = rect.left; asmStartTop = rect.top;
    if (!e.target.closest('input')) e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    if (!isDraggingASM) return;
    const touch = e.touches[0];
    autoSplitModal.style.left = `${asmStartLeft + (touch.clientX - dragStartXASM)}px`;
    autoSplitModal.style.top = `${asmStartTop + (touch.clientY - dragStartYASM)}px`;
    autoSplitModal.style.transform = 'none';
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { isDraggingASM = false; });

// 3. 核心邏輯：執行分割
document.getElementById('btnApplyAutoSplit').addEventListener('click', () => {
    if (currentMode !== 'table') return showToast('⚠️ 僅能在表格模式使用');
    
    // 找出選取範圍
    let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
    if (selectedCellBlocks.length > 0) {
        selectedCellBlocks.forEach(b => {
            minR = Math.min(minR, b.startR, b.endR); maxR = Math.max(maxR, b.startR, b.endR);
            minC = Math.min(minC, b.startC, b.endC); maxC = Math.max(maxC, b.startC, b.endC);
        });
    } else if (selectedRows.length > 0) {
        minR = Math.min(...selectedRows); maxR = Math.max(...selectedRows);
        minC = 0; maxC = dataTable.querySelector('thead tr').children.length - 2;
    } else if (selectedCols.length > 0) {
        minR = 0; maxR = dataTable.querySelectorAll('tbody tr').length - 1;
        minC = Math.min(...selectedCols); maxC = Math.max(...selectedCols);
    } else if (lastClickedCell) {
        minR = maxR = lastClickedCell.r;
        minC = maxC = lastClickedCell.c;
    } else {
        return showToast('⚠️ 請先選取要處理的範圍');
    }

    const delimiter = document.getElementById('autoSplitDelimiter').value;
    const mergeDelimiters = document.getElementById('chkMergeDelimiters').checked;
    // ======== 新增：讀取保留字元設定 ========
    const keepDelimiter = document.getElementById('chkKeepDelimiter').checked; 
    const tbodyRows = dataTable.querySelectorAll('tbody tr');

    const splitData = []; 
    let maxSplitLength = 1;

    // 第一階段：讀取並精準切割資料
    for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
            const inner = tbodyRows[r]?.children[c + 1]?.querySelector('.td-inner');
            if (!inner) continue;
            
            const text = inner.hasAttribute('data-formula') ? inner.getAttribute('data-formula') : inner.innerText;
            if (!text) continue;

            let parts = [];
            if (delimiter === '') {
                // 【無分隔符號】：逐字元切割
                parts = [...text];
                if (mergeDelimiters) {
                    parts = parts.filter((char, index, arr) => index === 0 || char !== arr[index - 1]);
                }
            } else {
                // 【有分隔符號】
                const safeDelim = delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                
                if (keepDelimiter) {
                    // 使用捕捉群組切割，把分隔符號留在陣列中
                    const regex = new RegExp('(' + safeDelim + (mergeDelimiters ? '+' : '') + ')', 'gu');
                    const rawParts = text.split(regex);
                    
                    // ======== 魔法在這裡：將分隔符號當作「前綴」與後段文字合併 ========
                    // 例如 ["A", ",", "B", ",", "C"] 會變成 ["A", ",B", ",C"]
                    parts.push(rawParts[0]); // 先推入第一段文字
                    
                    for (let i = 1; i < rawParts.length; i += 2) {
                        const delim = rawParts[i];
                        const nextText = rawParts[i + 1] || '';
                        parts.push(delim + nextText);
                    }
                    // =================================================================
                } else {
                    // 一般切割 (不保留分隔符號)
                    if (mergeDelimiters) {
                        const regex = new RegExp(safeDelim + '+', 'gu'); 
                        parts = text.split(regex);
                    } else {
                        parts = text.split(delimiter);
                    }
                }
            }

            if (parts.length > 0) {
                splitData.push({ r, c, parts });
                if (parts.length > maxSplitLength) maxSplitLength = parts.length;
            }
        }
    }

    // 第二階段：檢查是否需要擴充表格欄位
    const theadTr = dataTable.querySelector('thead tr');
    const currentCols = theadTr.children.length - 1;
    const requiredCols = maxC + maxSplitLength; 
    
    if (requiredCols > currentCols) {
        insertColAt(currentCols - 1, -1, requiredCols - currentCols);
    }

    // 第三階段：覆寫資料到畫面上
    const updatedRows = dataTable.querySelectorAll('tbody tr');
    splitData.forEach(item => {
        for (let i = 0; i < item.parts.length; i++) {
            const targetInner = updatedRows[item.r]?.children[item.c + i + 1]?.querySelector('.td-inner');
            if (targetInner) {
                targetInner.removeAttribute('data-formula'); 
                targetInner.innerText = item.parts[i];
            }
        }
    });

    recalculateAllFormulas();
    debouncedSaveHistory();
    autoSplitModal.classList.add('hidden');
    showToast('✅ 自動分割完成！');
});



/* ==========================================
   神奇多功能工具：自動合併 模組
   ========================================== */
const autoMergeModal = document.getElementById('autoMergeModal');

// 1. 開啟與關閉對話框
document.getElementById('btnOpenAutoMerge').addEventListener('click', (e) => {
    e.stopPropagation();
    autoMergeModal.classList.remove('hidden');
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    centerModal(autoMergeModal); // 呼叫置中函數
    document.getElementById('autoMergeDelimiter').focus();
});
document.getElementById('btnCloseAutoMerge').addEventListener('click', () => {
    autoMergeModal.classList.add('hidden');
});

// 2. 視窗全區拖曳
let isDraggingAMM = false, dragStartXAMM = 0, dragStartYAMM = 0, ammStartLeft = 0, ammStartTop = 0;
autoMergeModal.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, button, label')) return; 
    isDraggingAMM = true; dragStartXAMM = e.clientX; dragStartYAMM = e.clientY;
    const rect = autoMergeModal.getBoundingClientRect();
    ammStartLeft = rect.left; ammStartTop = rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingAMM) return;
    autoMergeModal.style.left = `${ammStartLeft + (e.clientX - dragStartXAMM)}px`;
    autoMergeModal.style.top = `${ammStartTop + (e.clientY - dragStartYAMM)}px`;
    autoMergeModal.style.transform = 'none';
});
document.addEventListener('mouseup', () => { isDraggingAMM = false; document.body.style.userSelect = ''; });
autoMergeModal.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, button, label')) return; 
    const touch = e.touches[0];
    isDraggingAMM = true; dragStartXAMM = touch.clientX; dragStartYAMM = touch.clientY;
    const rect = autoMergeModal.getBoundingClientRect();
    ammStartLeft = rect.left; ammStartTop = rect.top;
    if (!e.target.closest('input')) e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    if (!isDraggingAMM) return;
    const touch = e.touches[0];
    autoMergeModal.style.left = `${ammStartLeft + (touch.clientX - dragStartXAMM)}px`;
    autoMergeModal.style.top = `${ammStartTop + (touch.clientY - dragStartYAMM)}px`;
    autoMergeModal.style.transform = 'none';
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { isDraggingAMM = false; });

// 3. 核心邏輯：執行合併
document.getElementById('btnApplyAutoMerge').addEventListener('click', () => {
    if (currentMode !== 'table') return showToast('⚠️ 僅能在表格模式使用');
    
    // 找出選取範圍的邊界 (Bounding Box)
    let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
    if (selectedCellBlocks.length > 0) {
        selectedCellBlocks.forEach(b => {
            minR = Math.min(minR, b.startR, b.endR); maxR = Math.max(maxR, b.startR, b.endR);
            minC = Math.min(minC, b.startC, b.endC); maxC = Math.max(maxC, b.startC, b.endC);
        });
    } else if (selectedRows.length > 0) {
        minR = Math.min(...selectedRows); maxR = Math.max(...selectedRows);
        minC = 0; maxC = dataTable.querySelector('thead tr').children.length - 2;
    } else if (selectedCols.length > 0) {
        minR = 0; maxR = dataTable.querySelectorAll('tbody tr').length - 1;
        minC = Math.min(...selectedCols); maxC = Math.max(...selectedCols);
    } else if (lastClickedCell) {
        minR = maxR = lastClickedCell.r;
        minC = maxC = lastClickedCell.c;
    } 

    if (minR === Infinity || (minR === maxR && minC === maxC)) {
        return showToast('⚠️ 請先選取大於一格的範圍來進行合併');
    }

    const delimiter = document.getElementById('autoMergeDelimiter').value;
    const direction = document.querySelector('input[name="mergeDirection"]:checked').value;
    const tbodyRows = dataTable.querySelectorAll('tbody tr');

    // 橫向合併 (左或右)
    if (direction === 'left' || direction === 'right') {
        for (let r = minR; r <= maxR; r++) {
            let parts = [];
            let cellsToClear = [];
            for (let c = minC; c <= maxC; c++) {
                const inner = tbodyRows[r]?.children[c + 1]?.querySelector('.td-inner');
                if (inner) {
                    let txt = inner.hasAttribute('data-formula') ? inner.getAttribute('data-formula') : inner.innerText;
                    if (txt !== null && txt !== undefined && txt.trim() !== '') {
                        parts.push(txt);
                    }
                    cellsToClear.push(inner);
                }
            }
            if (parts.length > 0) {
                let mergedText = parts.join(delimiter);
                cellsToClear.forEach(inner => { inner.removeAttribute('data-formula'); inner.innerText = ''; });
                
                let targetCell = direction === 'left' ? cellsToClear[0] : cellsToClear[cellsToClear.length - 1];
                targetCell.innerText = mergedText;
                if (mergedText.startsWith('=')) targetCell.setAttribute('data-formula', mergedText);
            }
        }
    } 
    // 直向合併 (上或下)
    else if (direction === 'up' || direction === 'down') {
        for (let c = minC; c <= maxC; c++) {
            let parts = [];
            let cellsToClear = [];
            for (let r = minR; r <= maxR; r++) {
                const inner = tbodyRows[r]?.children[c + 1]?.querySelector('.td-inner');
                if (inner) {
                    let txt = inner.hasAttribute('data-formula') ? inner.getAttribute('data-formula') : inner.innerText;
                    if (txt !== null && txt !== undefined && txt.trim() !== '') {
                        parts.push(txt);
                    }
                    cellsToClear.push(inner);
                }
            }
            if (parts.length > 0) {
                let mergedText = parts.join(delimiter);
                cellsToClear.forEach(inner => { inner.removeAttribute('data-formula'); inner.innerText = ''; });
                
                let targetCell = direction === 'up' ? cellsToClear[0] : cellsToClear[cellsToClear.length - 1];
                targetCell.innerText = mergedText;
                if (mergedText.startsWith('=')) targetCell.setAttribute('data-formula', mergedText);
            }
        }
    }
    recalculateAllFormulas();
    debouncedSaveHistory();
    autoMergeModal.classList.add('hidden');
    showToast('✅ 自動合併完成！');
});



/* ==========================================
   文字模式專屬：文字編輯工具 (十合一排版引擎)
   ========================================== */
function applyTextTool(action) {
    if (currentMode !== 'text') {
        showToast('⚠️ 此功能僅能在文字模式使用');
        return;
    }

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const hasSelection = start !== end;
    
    // 如果有反白選取文字，就只處理選取的部分；否則處理全文
    const textToProcess = hasSelection ? editor.value.substring(start, end) : editor.value;
    if (!textToProcess) return;

    let newText = '';

    if (action === 'break') {
        const lines = textToProcess.split('\n');
        const brokenLines = lines.map(line => {
            if (line.trim() === '') return line; 
            let broken = line.replace(/([：:][‘“「『〈《【（\(<"']+)(?![ \t]*\n)/g, '$1\n');
            broken = broken.replace(/([。，、；！？\.,!?;．]+|……|…|──|—|～|~+|﹏+|＿+)([’”」』〉》】）\)\]"']*)(?![ \t]*\n)/g, '$1$2\n');
            
            return `######\n${broken.trimEnd()}\n######`;
        });
        newText = brokenLines.join('\n');
    }
    else if (action === 'join') {
        if (textToProcess.includes('######')) {
            const lines = textToProcess.split('\n');
            const result = [];
            let inBlock = false, currentBlock = [];
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.trim() === '######') {
                    if (inBlock) { result.push(currentBlock.join('')); currentBlock = []; inBlock = false; } 
                    else { inBlock = true; }
                } else {
                    if (inBlock) currentBlock.push(line); else result.push(line);
                }
            }
            if (inBlock && currentBlock.length > 0) result.push(currentBlock.join(''));
            newText = result.join('\n');
        } else {
            const paragraphs = textToProcess.split(/\n{2,}/);
            const joined = paragraphs.map(p => p.replace(/([a-zA-Z0-9])\n([a-zA-Z0-9])/g, '$1 $2').replace(/\n/g, ''));
            newText = joined.join('\n\n');
        }
    }
    // ======== 新增的 8 個排版功能 ========
    else if (action === 'sort-az') {
        newText = textToProcess.split('\n').sort((a, b) => a.localeCompare(b, 'zh-TW', { numeric: true })).join('\n');
    }
    else if (action === 'sort-za') {
        newText = textToProcess.split('\n').sort((a, b) => b.localeCompare(a, 'zh-TW', { numeric: true })).join('\n');
    }
    else if (action === 'remove-dup') {
        // 先過濾掉所有的空行，再使用 Set 資料結構過濾重複行
        newText = [...new Set(textToProcess.split('\n').filter(line => line.trim() !== ''))].join('\n');
    }
    else if (action === 'remove-empty') {
        // 過濾掉全空白或無字元的行
        newText = textToProcess.split('\n').filter(line => line.trim() !== '').join('\n');
    }
	else if (action === 'remove-trailing-empty') {
        // 匹配字串尾端連續的「換行符號 + 任意空白/Tab/全形空白」，並將其清除
        newText = textToProcess.replace(/(?:\r?\n[\t \u3000]*)+$/g, '');
    }
    else if (action === 'trim-space') {
        // 移除每行字首字尾的半形空白、全形空白(\u3000)、TAB(\t)
        newText = textToProcess.split('\n').map(line => line.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '')).join('\n');
    }
    else if (action === 'capitalize') {
        // 句首大寫引擎：在「每行開頭」或「句尾標點 + 引號/空白」之後的第一個拉丁字母進行大寫轉換
        // 注意：在 u 旗標下，方括號內的 . ! ? 不需要也不可以加斜線跳脫
        newText = textToProcess.replace(/(^|[。！？.!?"'「『]\s*)([\p{sc=Latn}])/gmu, (match, prefix, letter) => {
            return prefix + letter.toUpperCase();
        });
    }
    else if (action === 'lowercase') {
        // 原生 toLowerCase 已完美支援 Unicode 拼音與擴充字元
        newText = textToProcess.toLowerCase();
    }
    else if (action === 'uppercase') {
        // 原生 toUpperCase 已完美支援 Unicode 拼音與擴充字元
        newText = textToProcess.toUpperCase();
    }

    // 將處理完的文字寫回編輯器
    if (hasSelection) {
        editor.setRangeText(newText, start, end, 'select');
    } else {
        editor.value = newText;
    }

    // 觸發全域更新與存檔
    updateLineNumbers();
    localStorage.setItem(STORAGE_KEY, editor.value);
    debouncedSaveHistory();
    if (typeof updateWordCountWidget === 'function') updateWordCountWidget(); // 同步更新字數
    
    // 動態提示訊息
    const msgs = {
        'break': '標點斷行已套用', 'join': '斷行已精準接回',
        'sort-az': 'A-Z 排序完成', 'sort-za': 'Z-A 排序完成',
        'remove-dup': '重複行已移除', 'remove-empty': '空行已移除', 'trim-space': '首尾空格已移除',
		'remove-trailing-empty': '文末空行已乾淨移除',
        'capitalize': '句首已大寫', 'lowercase': '已轉為小寫', 'uppercase': '已轉為大寫'
    };
    showToast(`🥷 ${msgs[action]}`);
}

// 綁定所有 10 個按鈕的點擊事件
const textTools = [
    { id: 'btnPunctuationBreak', action: 'break' },
    { id: 'btnPunctuationJoin', action: 'join' },
    { id: 'btnSortAZ', action: 'sort-az' },
    { id: 'btnSortZA', action: 'sort-za' },
    { id: 'btnRemoveDupLines', action: 'remove-dup' },
    { id: 'btnRemoveEmptyLines', action: 'remove-empty' },
	{ id: 'btnRemoveTrailingEmptyLines', action: 'remove-trailing-empty' },
    { id: 'btnTrimSpaces', action: 'trim-space' },
    { id: 'btnCapitalize', action: 'capitalize' },
    { id: 'btnLowercase', action: 'lowercase' },
    { id: 'btnUppercase', action: 'uppercase' }
];

textTools.forEach(tool => {
    document.getElementById(tool.id)?.addEventListener('click', (e) => {
        e.stopPropagation();
        applyTextTool(tool.action);
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    });
});




/* ==========================================
   滑鼠拖曳與多選儲存格引擎
   ========================================== */
window.isCellDragging = false;
let isMouseDownOnCell = false;

// 1. 按下滑鼠：記錄起點，並執行原有的多選判斷
dataTable.addEventListener('mousedown', (e) => {
    // 排除標題列、選單按鈕、縮放把手等 UI 元素
    if (e.target.closest('th') || e.target.closest('.resize-handle') || e.target.closest('.btn-col-menu') || e.target.closest('.btn-row-menu')) return;

    const td = e.target.closest('td');
    if (td && currentMode === 'table') {
        // 如果游標正在這格裡面閃爍 (打字中)，放行讓使用者可以點擊反白文字，不觸發拖曳選取
        if (document.activeElement === td.querySelector('.td-inner')) return;
        
        if (isSelectionLocked) return;

        const tr = td.closest('tr');
        const rIdx = Array.from(tr.parentNode.children).indexOf(tr);
        const cIdx = Array.from(tr.children).indexOf(td) - 1;

        isMouseDownOnCell = true;
        window.isCellDragging = false; 

        // 完美保留你的多選狀態判斷
        const isCtrl = e.ctrlKey || e.metaKey || isMobileMultiSelect;

        if (e.shiftKey && lastClickedCell) {
            if (selectedCellBlocks.length === 0) {
                selectedCellBlocks.push({ startR: lastClickedCell.r, startC: lastClickedCell.c, endR: rIdx, endC: cIdx });
            } else {
                const lastBlock = selectedCellBlocks[selectedCellBlocks.length - 1];
                lastBlock.endR = rIdx; lastBlock.endC = cIdx;
            }
            if (!isCtrl) {
                selectedCellBlocks = [selectedCellBlocks[selectedCellBlocks.length - 1]];
                selectedRows = []; selectedCols = [];
            }
            applySelectionVisuals(); 
            window.getSelection().removeAllRanges();
        } else if (isCtrl) {
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
    }
});

// 2. 滑鼠移動：動態更新選取框邊界
dataTable.addEventListener('mouseover', (e) => {
    if (!isMouseDownOnCell || isSelectionLocked) return;

    // ⭐ 核心細節修正：判斷是否正在「選取文字」
    // 如果使用者已經反白了文字，當游標滑到邊界時，直接中斷並關閉「儲存格多選」引擎
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
        isMouseDownOnCell = false; // 徹底解除這回合的儲存格拖曳狀態
        return;
    }

    const td = e.target.closest('td');
    if (td) {
        const tr = td.closest('tr');
        const rIdx = Array.from(tr.parentNode.children).indexOf(tr);
        const cIdx = Array.from(tr.children).indexOf(td) - 1;

        const lastBlock = selectedCellBlocks[selectedCellBlocks.length - 1];
        
        // 只要游標進入了不同的一格，就擴充選取範圍
        if (lastBlock && (lastBlock.endR !== rIdx || lastBlock.endC !== cIdx)) {
            window.isCellDragging = true; // 標記為「拖曳中」
            lastBlock.endR = rIdx;
            lastBlock.endC = cIdx;
            
            applySelectionVisuals();
            window.getSelection().removeAllRanges(); // 防止拖曳時反白到文字
        }
    }
});
// 3. 放開滑鼠：結束拖曳狀態 (綁在 document 上確保滑出表格也能正確解除)
document.addEventListener('mouseup', () => {
    if (isMouseDownOnCell) {
        isMouseDownOnCell = false;
        // 延遲解除拖曳旗標，避免 click 事件誤判
        setTimeout(() => {
            window.isCellDragging = false;
        }, 50);
    }
});


/* ==========================================
   文字模式專屬：即時字數統計模組
   ========================================== */
const wordCountWidget = document.getElementById('wordCountWidget');
const wordCountDisplay = document.getElementById('wordCountDisplay');

// 開啟統計視窗
document.getElementById('btnWordCount')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentMode !== 'text') {
        showToast('⚠️ 字數統計僅能在文字模式使用');
        return;
    }
    wordCountWidget.classList.remove('hidden');
    updateWordCountWidget(); // 打開的瞬間先算一次
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
});

// 關閉統計視窗
document.getElementById('btnCloseWordCount')?.addEventListener('click', () => {
    wordCountWidget.classList.add('hidden');
});

// 核心計算邏輯
function updateWordCountWidget() {
    // 只有在視窗顯示且處於文字模式時才進行計算
    if (wordCountWidget.classList.contains('hidden') || currentMode !== 'text') return;

    const text = editor.value;
    
    // 1. 行數：根據換行符號切割 (沒打字時算 0 行)
    const lineCount = text.length === 0 ? 0 : text.split('\n').length;
    
    // ======== 魔法正則表達式解析 ========
    // 模式 A (羅馬拼音)：[\p{sc=Latn}0-9][\p{sc=Latn}\p{M}0-9ˊˇˋˆ\^\+⁺]*
    // 模式 B (方音與注音)：
    //   \u3105-\u312F 是標準注音 (ㄅ-ㄩ)
    //   \u31A0-\u31BF 是擴充方音符號 (ㆠ-ㆿ)
    // ===================================
    
    // 2. 總字數 (含標點，不含空白)
    const totalMatches = text.match(/(?:[\p{sc=Latn}0-9][\p{sc=Latn}\p{M}0-9ˊˇˋˆ\^\+⁺]*)|(?:[˙]?[\u3105-\u312F\u31A0-\u31BF兀万廿勺]+[ˊˇˋˆ\^\+⁺˙]*)|[^\s]/gu);
    const totalChars = totalMatches ? totalMatches.length : 0;
    
    // 3. 漢字/純字數 (不含標點、符號、空白)
    // 排除清單加入 \p{P}(標點) \p{S}(符號)，並將拉丁字母、注音、方音、數字、聲調與所有借音字全數排除，留下純漢字
    const hanMatches = text.match(/(?:[\p{sc=Latn}0-9][\p{sc=Latn}\p{M}0-9ˊˇˋˆ\^\+⁺]*)|(?:[˙]?[\u3105-\u312F\u31A0-\u31BF兀万廿勺]+[ˊˇˋˆ\^\+⁺˙]*)|[^\s\p{P}\p{S}\p{sc=Latn}\p{M}0-9ˊˇˋˆ\^\+⁺˙\u3105-\u312F\u31A0-\u31BF兀万廿勺]/gu);
    const hanChars = hanMatches ? hanMatches.length : 0;

    // 更新畫面顯示
    wordCountDisplay.textContent = `總字${totalChars} , 漢字${hanChars}, ${lineCount}行`;
}

// 只要編輯器內容有任何變動強制立刻重新計算！
editor.addEventListener('input', updateWordCountWidget);
// ==============================================













// ==========================================
// 編輯器專屬：浮動翻譯工具整合模組 (新增 字〔yin〕華 混合功能)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. 防止焦點轉移，保持編輯區反白 ---
    document.addEventListener('mousedown', (e) => {
        const isTranslator = e.target.closest('#floating-translator');
        const isToolbar = e.target.closest('.mb-3.flex') || e.target.closest('.dropdown-menu') || e.target.closest('.action-menu');
        const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
        
        if ((isTranslator || isToolbar) && !isInput) {
            if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
                return;
            }
            e.preventDefault(); 
        }
    });

    if (typeof setupDictionaries === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://gnisew.github.io/tools/translate/translate.js';
        document.head.appendChild(script);
    }

    // 準備全域變數，供拼音字典腳本使用
    window.ccc = ''; window.ddd = ''; window.c = []; window.d = [];
    window.currentLanguageKey = 'kasu';

    const BASE_URL_TRANS = 'https://gnisew.github.io/tools/translate/';
    const BASE_URL_RUBY = 'https://gnisew.github.io/tools/ruby/';
    
    const STORE_KEY_SOURCE = 'translate_source_lang';
    const STORE_KEY_TARGET = 'translate_target_lang';
    
    const LANGUAGES = {
        'chinese': { name: '華語' },
        'sixian': { name: '四縣', file: 'data-sixian-chinese.js', pyFile: 'hanzitopinyin-sixian.js' },
        'sixiannan': { name: '南四縣', file: '', pyFile: 'hanzitopinyin-sixiannan.js' },
        'hailu': { name: '海陸', file: 'data-hailu-chinese.js', pyFile: 'hanzitopinyin-hailu.js' },
        'dapu': { name: '大埔', file: 'data-dapu-chinese.js', pyFile: 'hanzitopinyin-dapu.js' },
        'raoping': { name: '饒平', file: '', pyFile: 'hanzitopinyin-raoping.js' },
        'kasu': { name: '詔安', file: 'data-kasu-chinese.js', pyFile: 'hanzitopinyin-kasu.js' },
        'holo': { name: '和樂', file: 'data-holo-chinese.js', pyFile: 'hanzitopinyin-holo.js' },
        'jinmen': { name: '金門', file: '', pyFile: 'hanzitopinyin-jinmen.js' }, 
        'matsu': { name: '馬祖', file: 'data-matsu-chinese.js' },
        'segment': { name: '分詞', file: '' },
        'pinyin': { name: '拼音', file: '' } 
    };

    const DIRECT_PAIRS = {
        'sixian-hailu': 'data-sixian-hailu.js',
        'sixian-dapu': 'data-sixian-dapu.js',
        'sixian-raoping': 'data-sixian-raoping.js',
        'sixian-kasu': 'data-sixian-kasu.js',
        'sixian-sixiannan': 'data-sixian-sixiannan.js',
        'hailu-dapu': 'data-hailu-dapu.js',
        'hailu-kasu': 'data-hailu-kasu.js',
        'dapu-kasu': 'data-dapu-kasu.js',
        'holo-kasu': 'data-holo-kasu.js',
        'holo-jinmen': 'data-holo-jinmen.js'
    };

    const DEFAULT_PIVOT = 'chinese';
    let dictCache = {};

    const proxyMap = new Map();
    for (const langKey in LANGUAGES) {
        if (langKey !== 'segment' && langKey !== 'pinyin' && langKey !== 'chinese' && !LANGUAGES[langKey].file) {
            let proxyTarget = null, pairCount = 0;
            for (const pairKey in DIRECT_PAIRS) {
                const [langA, langB] = pairKey.split('-');
                if (langA === langKey) { proxyTarget = langB; pairCount++; }
                else if (langB === langKey) { proxyTarget = langA; pairCount++; }
            }
            if (pairCount === 1) proxyMap.set(langKey, proxyTarget);
        }
    }
    function getProxyTarget(lang) { return proxyMap.get(lang); }

    let transState = {
        source: localStorage.getItem(STORE_KEY_SOURCE) || 'chinese',
        target: localStorage.getItem(STORE_KEY_TARGET) || 'kasu',
        pivot: 'direct' 
    };

    const transPanel = document.getElementById('floating-translator');
    const dragHandle = document.getElementById('translator-drag-handle');
    const btnExecute = document.getElementById('btn-execute-translate');
    const btnOptionsToggle = document.getElementById('btn-trans-options-toggle');
    const optionsMenu = document.getElementById('trans-options-menu');
    const btnClose = document.getElementById('btn-close-translator');
    const btnToggle = document.getElementById('btn-toggle-translator');
    const sourceBtn = document.querySelector('[data-id="source-btn"]');
    const targetBtn = document.querySelector('[data-id="target-btn"]');
    const pivotLabel = document.getElementById('pivot-label');
    const pivotList = document.getElementById('pivot-list');
    const pivotWrapper = document.getElementById('dropdown-pivot');

    // --- 2. UI 邏輯與膠囊按鈕 ---
    function initDropdowns() {
        sourceBtn.textContent = LANGUAGES[transState.source].name;
        targetBtn.textContent = LANGUAGES[transState.target].name;

        document.querySelectorAll('.dropdown-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const list = btn.nextElementSibling;
                document.querySelectorAll('.dropdown-list, #trans-options-menu').forEach(l => {
                    if (l !== list) l.classList.remove('show', 'hidden');
                    if (l.id === 'trans-options-menu' && l !== list) l.classList.add('hidden');
                });
                list.classList.toggle('show');

                if (list.classList.contains('show')) {
                    const btnRect = btn.getBoundingClientRect();
                    const windowHeight = window.innerHeight;
                    const spaceBelow = windowHeight - btnRect.bottom;
                    const spaceAbove = btnRect.top;
                    const listMaxHeight = 260; 

                    if (spaceBelow < listMaxHeight && spaceAbove > spaceBelow) {
                        list.style.bottom = 'calc(100% + 5px)';
                        list.style.top = 'auto';
                    } else {
                        list.style.bottom = 'auto';
                        list.style.top = 'calc(100% + 5px)';
                    }
                }
            });
        });

        btnOptionsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-list').forEach(l => l.classList.remove('show'));
            optionsMenu.classList.toggle('hidden');

            if (!optionsMenu.classList.contains('hidden')) {
                const btnRect = btnOptionsToggle.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const spaceBelow = windowHeight - btnRect.bottom;
                const spaceAbove = btnRect.top;
                const menuMaxHeight = 180; 

                if (spaceBelow < menuMaxHeight && spaceAbove > spaceBelow) {
                    optionsMenu.style.bottom = 'calc(100% + 5px)';
                    optionsMenu.style.top = 'auto';
                    optionsMenu.classList.remove('origin-top-right');
                    optionsMenu.classList.add('origin-bottom-right');
                } else {
                    optionsMenu.style.bottom = 'auto';
                    optionsMenu.style.top = 'calc(100% + 5px)';
                    optionsMenu.classList.remove('origin-bottom-right');
                    optionsMenu.classList.add('origin-top-right');
                }
            }
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-list').forEach(l => l.classList.remove('show'));
            optionsMenu.classList.add('hidden');
        });

        document.querySelectorAll('#dropdown-source .dropdown-item').forEach(item => {
            item.addEventListener('click', () => { setLanguage('source', item.dataset.value); item.closest('.dropdown-list').classList.remove('show'); });
        });
        document.querySelectorAll('#dropdown-target .dropdown-item').forEach(item => {
            item.addEventListener('click', () => { setLanguage('target', item.dataset.value); item.closest('.dropdown-list').classList.remove('show'); });
        });
    }

    function setLanguage(type, value) {
        transState[type] = value;
        if (type === 'source') {
            sourceBtn.textContent = LANGUAGES[value].name; localStorage.setItem(STORE_KEY_SOURCE, value);
        } else if (type === 'target') {
            targetBtn.textContent = LANGUAGES[value].name; localStorage.setItem(STORE_KEY_TARGET, value);
        }
        updatePivotOptions(); 
        updateCapsuleButtonUI();
    }

    function updateCapsuleButtonUI() {
        const isTargetPinyin = transState.target === 'pinyin';
        const isTargetSegment = transState.target === 'segment';
        
        // 嚴格判斷：是否為直達且擁有直接對應的檔案
        const isDirect = (transState.pivot === 'direct' || !transState.pivot) && getFileForPair(transState.source, transState.target);

        btnExecute.innerHTML = '轉換';
        let menuHTML = '';

        if (isTargetPinyin) {
            menuHTML = `
                <button class="menu-action-btn" data-action="default"><span class="material-symbols-outlined text-[16px] text-blue-600">arrow_downward</span> 字轉音 (預設)</button>
                <button class="menu-action-btn" data-action="raw"><span class="material-symbols-outlined text-[16px] text-teal-600">raw_on</span> Bunxc-bienx</button>
                <button class="menu-action-btn" data-action="bracket"><span class="material-symbols-outlined text-[16px] text-purple-600">data_object</span> 字〔yin〕</button>
                <button class="menu-action-btn" data-action="bracket_trans"><span class="material-symbols-outlined text-[16px] text-indigo-600">translate</span> 字〔yin〕華</button>
                <button class="menu-action-btn" data-action="segment"><span class="material-symbols-outlined text-[16px] text-orange-500">space_bar</span> 空格分詞</button>
                <button class="menu-action-btn" data-action="segment_underscore"><span class="material-symbols-outlined text-[16px] text-orange-600">horizontal_rule</span> 底線分詞</button>
            `;
            btnOptionsToggle.style.display = 'flex';
            optionsMenu.innerHTML = menuHTML;
            btnExecute.classList.remove('rounded-full', 'pr-3');
            btnExecute.classList.add('rounded-l-full', 'border-r', 'border-blue-200', 'pr-2');
        } else if (isTargetSegment) {
            menuHTML = `
                <button class="menu-action-btn" data-action="default"><span class="material-symbols-outlined text-[16px] text-orange-600">horizontal_rule</span> 底線分詞 (預設)</button>
                <button class="menu-action-btn" data-action="segment_space"><span class="material-symbols-outlined text-[16px] text-orange-500">space_bar</span> 空格分詞</button>
            `;
            btnOptionsToggle.style.display = 'flex';
            optionsMenu.innerHTML = menuHTML;
            btnExecute.classList.remove('rounded-full', 'pr-3');
            btnExecute.classList.add('rounded-l-full', 'border-r', 'border-blue-200', 'pr-2');
        } else {
            menuHTML = `
                <button class="menu-action-btn" data-action="default"><span class="material-symbols-outlined text-[16px] text-blue-600">translate</span> 預設轉換</button>
                <button class="menu-action-btn ${!isDirect ? 'opacity-40 cursor-not-allowed' : ''}" data-action="exact" ${!isDirect ? 'disabled' : ''}><span class="material-symbols-outlined text-[16px] text-green-600">done_all</span> 完全符合</button>
                <button class="menu-action-btn ${!isDirect ? 'opacity-40 cursor-not-allowed' : ''}" data-action="all" ${!isDirect ? 'disabled' : ''}><span class="material-symbols-outlined text-[16px] text-purple-600">format_list_bulleted</span> 所有符合</button>
                <button class="menu-action-btn ${!isDirect ? 'opacity-40 cursor-not-allowed' : ''}" data-action="fuzzy" ${!isDirect ? 'disabled' : ''}><span class="material-symbols-outlined text-[16px] text-orange-600">blur_on</span> 模糊符合</button>
            `;
            btnOptionsToggle.style.display = 'flex';
            optionsMenu.innerHTML = menuHTML;
            btnExecute.classList.remove('rounded-full', 'pr-3');
            btnExecute.classList.add('rounded-l-full', 'border-r', 'border-blue-200', 'pr-2');
        }

        optionsMenu.querySelectorAll('.menu-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                optionsMenu.classList.add('hidden');
                performConversion(btn.dataset.action); 
            });
        });
        
        checkButtonState();
    }

    function checkButtonState() {
        if (!btnExecute) return;
        const source = transState.source;
        const target = transState.target;
        
        const isSame = source === target;
        const isBothPinyin = source === 'pinyin' && target === 'pinyin';
        const isSegmentPinyin = source === 'pinyin' && target === 'segment'; 
        
        let isMissingPinyinDict = false;
        if (target === 'pinyin' && source !== 'pinyin') {
            if (!LANGUAGES[source].pyFile) isMissingPinyinDict = true;
        } else if (source === 'pinyin' && target !== 'pinyin') {
            if (!LANGUAGES[target].pyFile) isMissingPinyinDict = true;
        }

        // 檢查路徑是否真實存在
        let isPathValid = true;
        if (source !== 'pinyin' && target !== 'pinyin' && source !== target) {
            let canDirect = target === 'segment' ? (source === 'chinese' || LANGUAGES[source].file) : hasDirectPath(source, target);
            const possiblePivots = findPossiblePivots(source, target);
            if (!canDirect && possiblePivots.length === 0) isPathValid = false;
        }

        let hasSelection = false;
        if (typeof currentMode !== 'undefined') {
            if (currentMode === 'text') {
                const editor = document.getElementById('editor');
                if (editor) hasSelection = editor.selectionStart !== editor.selectionEnd;
            } else if (currentMode === 'table') {
                const sel = window.getSelection();
                if (sel && sel.toString().trim().length > 0) {
                    hasSelection = true;
                } else {
                    const hasMultiCells = document.querySelectorAll('#data-table td.sel-bg').length > 0;
                    const hasSingleCellOutline = document.querySelectorAll('#data-table td[style*="inset"]').length > 0;
                    const isEditing = document.activeElement && document.activeElement.classList.contains('td-inner');
                    if (!isEditing && (hasMultiCells || hasSingleCellOutline)) hasSelection = true;
                }
            }
        }

        if (isSame || isBothPinyin || isMissingPinyinDict || isSegmentPinyin || !hasSelection || !isPathValid) {
            btnExecute.disabled = true; 
            btnOptionsToggle.disabled = true;
            
            if (!hasSelection) btnExecute.title = "請先選取要轉換的文字或儲存格";
            else if (isSame) btnExecute.title = "來源與結果語言相同";
            else if (!isPathValid) btnExecute.title = "無可用的翻譯路徑或中介語言";
            else if (isBothPinyin) btnExecute.title = "無法執行拼音轉拼音";
            else if (isSegmentPinyin) btnExecute.title = "不支援拼音直接分詞";
            else btnExecute.title = `未配置 ${LANGUAGES[source === 'pinyin' ? target : source].name} 的拼音字典，無法轉換`;
            
        } else {
            btnExecute.disabled = false; 
            btnOptionsToggle.disabled = false;
            btnExecute.title = "";
        }
    }

    // 監聽選取變化，即時更新按鈕狀態
    document.addEventListener('selectionchange', checkButtonState);
    document.addEventListener('mouseup', () => setTimeout(checkButtonState, 50));
    document.addEventListener('keyup', () => setTimeout(checkButtonState, 50));

    // --- 3. 動態中介語言與拼音鎖定 ---
    function hasDirectPath(langA, langB) {
        if (!langA || !langB || langA === langB) return false;
        if (DIRECT_PAIRS[`${langA}-${langB}`] || DIRECT_PAIRS[`${langB}-${langA}`]) return true;
        if (langA === 'chinese' && LANGUAGES[langB]?.file) return true;
        if (langB === 'chinese' && LANGUAGES[langA]?.file) return true;
        return false;
    }

    function findPossiblePivots(from, to) {
        if (from === 'pinyin' || to === 'pinyin') return []; 

        const pivots = [];

        if (to === 'segment') {
            if (from === 'chinese') {
                for (const key in LANGUAGES) if (LANGUAGES[key].file) pivots.push(key);
            } else if (!LANGUAGES[from].file) {
                for (const key in LANGUAGES) {
                    if (key !== from && hasDirectPath(from, key) && LANGUAGES[key].file) {
                        pivots.push(key);
                    }
                }
            } else {
                pivots.push('chinese');
            }
            return pivots;
        }

        // 階段一：嚴格檢查只允許「一層」直達傳遞 (Source -> Pivot -> Target)
        for (const pivotKey in LANGUAGES) {
            if (pivotKey === from || pivotKey === to || pivotKey === 'segment' || pivotKey === 'pinyin') continue;

            if (hasDirectPath(from, pivotKey) && hasDirectPath(pivotKey, to)) {
                pivots.push(pivotKey);
            }
        }

        // 如果第一層有找到，優先將華語排在第一順位並回傳 (不再找第二層)
        if (pivots.length > 0) {
            if (pivots.includes('chinese')) {
                return ['chinese', ...pivots.filter(p => p !== 'chinese')];
            }
            return pivots;
        }

        // 階段二：如果第一層找不到，啟動「兩層」中介搜索 (Source -> P1 -> P2 -> Target)
        for (const p1 in LANGUAGES) {
            if (p1 === from || p1 === to || p1 === 'segment' || p1 === 'pinyin') continue;
            
            // 如果來源能到 P1
            if (hasDirectPath(from, p1)) {
                for (const p2 in LANGUAGES) {
                    if (p2 === from || p2 === to || p2 === 'segment' || p2 === 'pinyin' || p2 === p1) continue;
                    
                    // 且 P1 能到 P2，P2 能到目標
                    if (hasDirectPath(p1, p2) && hasDirectPath(p2, to)) {
                        // 以逗號分隔字串儲存這條兩層路徑
                        pivots.push(`${p1},${p2}`);
                    }
                }
            }
        }

        // 兩層路徑中，優先顯示包含華語的路徑
        if (pivots.length > 0) {
            const withChinese = pivots.filter(p => p.includes('chinese'));
            const withoutChinese = pivots.filter(p => !p.includes('chinese'));
            return [...withChinese, ...withoutChinese];
        }

        return pivots;
    }

    function updatePivotOptions() {
        const source = transState.source;
        const target = transState.target;

        if (source === 'pinyin' || target === 'pinyin' || source === target) {
            pivotWrapper.style.opacity = '0.4';
            pivotWrapper.style.pointerEvents = 'none';
            transState.pivot = 'direct';
            updatePivotLabel();
            checkButtonState();
            return;
        } else {
            pivotWrapper.style.opacity = '1';
            pivotWrapper.style.pointerEvents = 'auto';
        }
        
        let canDirect = false;
        if (target === 'segment') {
            canDirect = (source === 'chinese' || LANGUAGES[source].file) ? true : false;
        } else {
            canDirect = hasDirectPath(source, target);
        }

        const possiblePivots = findPossiblePivots(source, target);
        pivotList.innerHTML = '';
        
        if (canDirect) {
            const item = document.createElement('div');
            item.className = 'dropdown-item'; 
            item.dataset.value = 'direct'; 
            item.textContent = '直達 (無)';
            pivotList.appendChild(item);
        }

        // 🌟 處理選項文字的渲染
        possiblePivots.forEach(pivotKey => {
            const item = document.createElement('div');
            item.className = 'dropdown-item'; 
            item.dataset.value = pivotKey; 
            
            // 將逗號分隔的路徑轉為 "A > B" 的視覺格式
            const names = pivotKey.split(',').map(p => LANGUAGES[p].name);
            item.textContent = names.join(' > ');
            
            pivotList.appendChild(item);
        });

        pivotList.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                transState.pivot = item.dataset.value; 
                updatePivotLabel(); 
                item.closest('.dropdown-list').classList.remove('show');
            });
        });

        if (canDirect) {
            if (transState.pivot !== 'direct' && !possiblePivots.includes(transState.pivot)) {
                transState.pivot = 'direct';
            }
            if (!transState.pivot) transState.pivot = 'direct';
        } else {
            if (possiblePivots.length > 0) {
                if (!possiblePivots.includes(transState.pivot)) {
                    transState.pivot = possiblePivots[0]; 
                }
            } else {
                transState.pivot = '';
            }
        }

        updatePivotLabel(); checkButtonState();
    }

    function updatePivotLabel() {
        if (!pivotLabel) return;
        if (transState.pivot === 'direct' || !transState.pivot) {
            pivotLabel.style.display = 'none';
        } else {
            const names = transState.pivot.split(',').map(p => LANGUAGES[p].name);
            pivotLabel.textContent = names.join(' > '); 
            pivotLabel.style.display = 'inline'; 
        }
    }

    // --- 4. 拖曳面板 ---
    function closeTranslatorPanel() {
        transPanel.style.display = 'none';
        if (btnToggle) btnToggle.classList.remove('active'); // 移除按鈕變色狀態
    }

    function openTranslatorPanel() {
        transPanel.style.display = 'flex';
        if (btnToggle) btnToggle.classList.add('active'); // 加上按鈕變色狀態
    }

    // 工具列按鈕：點擊時進行「開關切換」
    if(btnToggle) {
        btnToggle.addEventListener('click', () => {
            if (transPanel.style.display === 'none' || transPanel.style.display === '') {
                openTranslatorPanel();
            } else {
                closeTranslatorPanel();
            }
        });
    }

    // 面板上的關閉按鈕 (✖)
    if(btnClose) {
        btnClose.addEventListener('click', closeTranslatorPanel);
    }
    
    let isDragging = false, startX, startY, initialX, initialY;
    function startDrag(clientX, clientY) {
        isDragging = true; startX = clientX; startY = clientY;
        const rect = transPanel.getBoundingClientRect(); initialX = rect.left; initialY = rect.top;
        transPanel.style.transform = 'none'; transPanel.style.left = `${initialX}px`; transPanel.style.top = `${initialY}px`;
        transPanel.style.bottom = 'auto'; transPanel.style.right = 'auto';
        document.body.style.userSelect = 'none';
    }
    function drag(clientX, clientY) { if (isDragging) { transPanel.style.left = `${initialX + (clientX - startX)}px`; transPanel.style.top = `${initialY + (clientY - startY)}px`; } }
    function stopDrag() { isDragging = false; document.body.style.userSelect = ''; }

    if (dragHandle) {
        dragHandle.addEventListener('mousedown', (e) => { startDrag(e.clientX, e.clientY); document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp); });
        dragHandle.addEventListener('touchstart', (e) => { startDrag(e.touches[0].clientX, e.touches[0].clientY); document.addEventListener('touchmove', onTouchMove, { passive: false }); document.addEventListener('touchend', onTouchEnd); }, { passive: false });
    }
    function onMouseMove(e) { drag(e.clientX, e.clientY); }
    function onMouseUp() { stopDrag(); document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); }
    function onTouchMove(e) { if (!isDragging) return; e.preventDefault(); drag(e.touches[0].clientX, e.touches[0].clientY); }
    function onTouchEnd() { stopDrag(); document.removeEventListener('touchmove', onTouchMove); document.removeEventListener('touchend', onTouchEnd); }

    // --- 5. 核心輔助工具 (腳本載入與解析引擎) ---
    function loadScript(url) {
        return new Promise((resolve) => {
            if (document.querySelector(`script[src="${url}"]`)) return resolve();
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = () => { console.warn(`腳本載入失敗: ${url}`); resolve(); };
            document.head.appendChild(script);
        });
    }

    let PROCESSED_IME_DICTS = {};
    function initializeImeDicts() {
        if (typeof dictionaries === 'undefined') return;
        for (const lang in dictionaries) {
            const dict = dictionaries[lang];
            const map = new Map();
            for (const pinyin in dict) {
                const hanziOptions = dict[pinyin].split(' ');
                map.set(pinyin, hanziOptions[0]);
            }
            PROCESSED_IME_DICTS[lang] = map;
        }
    }

    function tokenizePinyinWithHyphens(raw) {
        const tokens = [];
        let currentToken = '';
        const toCharArray = (str) => Array.from(str || '');
        const PUNCTS = new Set(['，', '。', '、', '；', '：', '！', '？', '（', '）', '「', '」', '『', '』', '《', '》', '〈', '〉', '—', '…', '－', '‧', '·', '﹑', ',', '.', ';', ':', '!', '?', '(', ')', '[', ']', '{', '}', '"', "'", '-', '…']);
        const WHITESPACES = new Set([' ', '\t', '\u3000']);
        const isPunct = (ch) => PUNCTS.has(ch);
        const isWhitespace = (ch) => WHITESPACES.has(ch);
        
        for (const ch of toCharArray(raw || '')) {
            const isDelimiter = isWhitespace(ch) || (isPunct(ch) && ch !== '-');
            if (isDelimiter) {
                if (currentToken.length > 0) { tokens.push(currentToken); currentToken = ''; }
                tokens.push(ch);
            } else { currentToken += ch; }
        }
        if (currentToken.length > 0) tokens.push(currentToken);
        return tokens;
    }

    function pinyinToHanziEngine(pinyinText, langKey) {
        const hakkaLanguages = new Set(['sixian', 'hailu', 'dapu', 'raoping', 'sixiannan']);
        if (hakkaLanguages.has(langKey) && typeof hakkaToneToZvs === 'function') {
            pinyinText = hakkaToneToZvs(pinyinText);
        } else if (langKey === 'kasu' && typeof hakkaToneToZvs === 'function') {
            pinyinText = hakkaToneToZvs(pinyinText);
            pinyinText = pinyinText
                .replace(/([bpfvdtlgkhzcsi])oo([zvsx]?)\b/g, '$1o$2')
                .replace(/(\b)(rh)([aeiou])/g, '$1r$3')
                .replace(/(\b)(bb)([aeiou])/g, '$1v$3')
                .replace(/(\b)(ji)/g, '$1zi')
                .replace(/(\b)(qi)/g, '$1ci')
                .replace(/(\b)(xi)/g, '$1si');
        }
        
        pinyinText = pinyinText
          .replace(/(?<![A-Za-z\s-])([A-Za-z]+)/g, ' $1')
          .replace(/([A-Za-z]+)(?![A-Za-z\s-])/g, '$1 ')
          .replace(/([A-Za-z])\n/g, '$1 \n')
          .replace(/\n([A-Za-z])/g, '\n $1')
          .trim();

        let dict = PROCESSED_IME_DICTS[langKey];
        if (!dict || dict.size === 0) return pinyinText;

        const lowerDict = new Map();
        for (const [key, value] of dict.entries()) {
            lowerDict.set(key.toLowerCase(), value);
        }
        dict = lowerDict;

        const tokens = tokenizePinyinWithHyphens(pinyinText);
        const WHITESPACES = new Set([' ', '\t', '\u3000']);
        const PUNCTS = new Set(['，', '。', '、', '；', '：', '！', '？', '（', '）', '「', '」', '『', '』', '《', '》', '〈', '〉', '—', '…', '－', '‧', '·', '﹑', ',', '.', ';', ':', '!', '?', '(', ')', '[', ']', '{', '}', '"', "'", '-', '…']);
        const isActualSyllable = (token) => !WHITESPACES.has(token) && !PUNCTS.has(token);
        const syllables = tokens.filter(isActualSyllable);

        const convertedUnits = [];
        let i = 0;
        while (i < syllables.length) {
            let matchFound = false;
            for (let n = Math.min(5, syllables.length - i); n > 1; n--) {
                const phrase = syllables.slice(i, i + n).join(' ').toLowerCase();
                if (dict.has(phrase)) {
                    convertedUnits.push({ hanzi: dict.get(phrase), sourceCount: n });
                    i += n;
                    matchFound = true;
                    break;
                }
            }
            if (matchFound) continue;

            const currentSyl = syllables[i].toLowerCase();
            if (dict.has(currentSyl)) {
                convertedUnits.push({ hanzi: dict.get(currentSyl), sourceCount: 1 });
            } else if (currentSyl.includes('-')) {
                const subPinyins = currentSyl.split(/-+/);
                const translatedSubs = subPinyins.map(sub => dict.get(sub.toLowerCase()) || sub);
                convertedUnits.push({ hanzi: translatedSubs.join(''), sourceCount: 1 });
            } else {
                convertedUnits.push({ hanzi: syllables[i], sourceCount: 1 });
            }
            i++;
        }

        let unitIndex = 0;
        let syllablesToSkip = 0;
        let finalText = "";
        tokens.forEach(token => {
            if (!isActualSyllable(token)) {
                if (!WHITESPACES.has(token)) finalText += token;
                return;
            }
            if (syllablesToSkip > 0) { syllablesToSkip--; return; }
            if (unitIndex < convertedUnits.length) {
                const unit = convertedUnits[unitIndex];
                finalText += unit.hanzi;
                syllablesToSkip = unit.sourceCount - 1;
                unitIndex++;
            } else {
                finalText += token;
            }
        });

        finalText = finalText.replace(/\s+([，。、；：！？.,;:!?])/g, '$1').trim();
        finalText = finalText
            .replace(/,/g, '，').replace(/(?<!\.)\.(?!\.)/g, '。') 
            .replace(/\?/g, '？').replace(/!/g, '！').replace(/;/g, '；')
            .replace(/:/g, '：').replace(/\(/g, '（').replace(/\)/g, '）');

        return finalText;
    }

    function prepareDummyDOM() {
        let dummyContainer = document.getElementById('dummy-ruby-container');
        if (dummyContainer) return;
        dummyContainer = document.createElement('div');
        dummyContainer.id = 'dummy-ruby-container';
        dummyContainer.style.display = 'none'; 
        ['hanziInput', 'pinyinInput'].forEach(id => {
            let el = document.createElement('textarea');
            el.id = id; 
            el.readOnly = true; 
            el.setAttribute('inputmode', 'none'); 
            dummyContainer.appendChild(el);
        });
        document.body.appendChild(dummyContainer);
    }

    function loadRubyDictionary(langCode) {
        return new Promise((resolve, reject) => {
            const pyFile = LANGUAGES[langCode].pyFile;
            if (!pyFile) return resolve();

            if (dictCache[pyFile]) {
                window.pinyinMap = dictCache[pyFile].pinyinMap;
                window.masterRegex = dictCache[pyFile].masterRegex;
                return resolve();
            }

            const SCRIPT_ID = 'ruby-lang-db-script';
            const existingScript = document.getElementById(SCRIPT_ID);
            if (existingScript) existingScript.remove();

            const script = document.createElement('script');
            script.id = SCRIPT_ID;
            script.src = BASE_URL_RUBY + pyFile;
            script.onload = () => {
                if (typeof initializeConverter === 'function') {
                    initializeConverter();
                    dictCache[pyFile] = { pinyinMap: window.pinyinMap, masterRegex: window.masterRegex };
                }
                resolve();
            };
            script.onerror = () => reject('拼音字典載入失敗: ' + pyFile);
            document.head.appendChild(script);
        });
    }

    function getFileForPair(langA, langB) {
        const pair1 = `${langA}-${langB}`, pair2 = `${langB}-${langA}`;
        // 檢查是否有直接對應的資料庫檔案
        if (DIRECT_PAIRS[pair1]) return DIRECT_PAIRS[pair1];
        if (DIRECT_PAIRS[pair2]) return DIRECT_PAIRS[pair2];
        
        // 如果沒有彼此的直接對應，檢查是否有與華語的對應
        if (langA === 'chinese') return LANGUAGES[langB]?.file;
        if (langB === 'chinese') return LANGUAGES[langA]?.file;
        
        return null;
    }

    function fetchDictionaryByFile(fileName) {
        return new Promise((resolve, reject) => {
            if (!fileName) return resolve(null);
            if (dictCache[fileName]) return resolve(dictCache[fileName]);
            const script = document.createElement('script');
            script.src = BASE_URL_TRANS + fileName;
            script.onload = () => {
                if (typeof ww !== 'undefined') { dictCache[fileName] = setupDictionaries(ww); ww = undefined; } 
                else { dictCache[fileName] = true; }
                resolve(dictCache[fileName]); 
                script.remove();
            };
            script.onerror = () => reject(`網路連線失敗: ${fileName}`);
            document.body.appendChild(script);
        });
    }

    async function executeTranslation(from, to, text) {
        if (from === to || !text) return text;
        const file = getFileForPair(from, to);
        if (!file) return text;
        const dicts = await fetchDictionaryByFile(file);
        if (!dicts) return text;

        let direction = 'KG';
        if (DIRECT_PAIRS[`${to}-${from}`]) direction = 'GK';
        else if (from === 'chinese') direction = 'GK';
        
        const re = direction === 'GK' ? dicts.reGK : dicts.reKG;
        const map = direction === 'GK' ? dicts.mapGK : dicts.mapKG;
        return GoixBasic(text, re, map, dicts.reVariant, dicts.mapVariant, "");
    }

    function doSegmentText(text, dicts, isSourceChinese, separator = ' ') {
        if (!text || !dicts) return text;
        let result = text.replace(dicts.reVariant, (match) => dicts.mapVariant.get(match));
        const marker = ""; 
        const re = isSourceChinese ? dicts.reTonv : dicts.reKG;
        result = result.replace(re, (match) => marker + match + marker);
        // 將原本寫死的 ' ' 替換為 separator
        return result.replace(new RegExp(marker + '{1,2}', 'g'), separator).trim();
    }

    // --- 6. 抽出轉換核心執行器 ---
    async function performConversion(actionMode) {
        const source = transState.source;
        const target = transState.target;
        const pivot = transState.pivot;

        const originalBtnText = btnExecute.innerHTML;
        btnExecute.innerHTML = "🥷...";
        btnExecute.disabled = true;

		try {
            // 攔截進階資料庫比對邏輯 (完全符合、所有符合、模糊符合)
            // 在 performConversion 頂部攔截進階資料庫的部分：
            if (['exact', 'all', 'fuzzy'].includes(actionMode)) {
                const source = transState.source;
                const target = transState.target;
                
                // 真實尋找檔案，不再偽裝
                const file = getFileForPair(source, target);
                
                if (!file) { alert("此語言組合沒有直接對應的資料庫"); return; }
                const dicts = await fetchDictionaryByFile(file);
                if (!dicts) { alert("資料庫載入失敗"); return; }

                let direction = 'KG';
                if (DIRECT_PAIRS[`${target}-${source}`]) direction = 'GK';
                else if (source === 'chinese') direction = 'GK';
                
                const mapForward = direction === 'GK' ? dicts.mapGK : dicts.mapKG;
                const mapBackward = direction === 'GK' ? dicts.mapKG : dicts.mapGK;

                // 核心比對邏輯 (雙向掃描，保留原始優先次序)
                const getMatches = (word) => {
                    let results = [];
                    
                    if (actionMode === 'exact') {
                        // 完全符合：優先從反向字典(保留原始排序)中找第一筆
                        for (let [k, v] of mapBackward.entries()) {
                            if (v === word || v.split(/[\s、，,]+/).includes(word)) {
                                results.push(k.split(/[\s、，,]+/)[0]);
                                break;
                            }
                        }
                        // 若找不到，再從正向字典找
                        if (results.length === 0 && mapForward.has(word)) {
                            results.push(mapForward.get(word).split(/[\s、，,]+/)[0]);
                        }
                    } else if (actionMode === 'all') {
                        // 所有符合：掃描反向字典取得完整對應清單 (保留資料庫原始優先順序)
                        for (let [k, v] of mapBackward.entries()) {
                            if (v === word || v.split(/[\s、，,]+/).includes(word)) {
                                results.push(...k.split(/[\s、，,]+/));
                            }
                        }
                        // 補上正向字典中可能的遺漏
                        if (mapForward.has(word)) {
                            results.push(...mapForward.get(word).split(/[\s、，,]+/));
                        }
                    } else if (actionMode === 'fuzzy') {
                        // 模糊符合
                        for (let [k, v] of mapBackward.entries()) {
                            if (v.includes(word) || word.includes(v)) {
                                results.push(...k.split(/[\s、，,]+/));
                            }
                        }
                        for (let [k, v] of mapForward.entries()) {
                            if (k.includes(word) || word.includes(k)) {
                                results.push(...v.split(/[\s、，,]+/));
                            }
                        }
                    }
                    
                    // 去除重複項目並過濾空值，完美輸出！
                    return [...new Set(results)].filter(Boolean);
                };

                const editor = document.getElementById('editor');
                const tableContainer = document.getElementById('tableModeContainer');
                const isTableMode = tableContainer && window.getComputedStyle(tableContainer).display !== 'none';

                // 文字模式處理：行後加 TAB
                if (!isTableMode && editor) {
                    const start = editor.selectionStart, end = editor.selectionEnd;
                    let text = (start !== end) ? editor.value.substring(start, end) : editor.value;
                    let lines = text.split('\n');
                    let newLines = lines.map(line => {
                        let word = line.trim();
                        if (!word) return line;
                        let matches = getMatches(word);
                        if (matches.length > 0) {
                            return line + '\t' + matches.join('、');
                        }
                        return line;
                    });
                    let newText = newLines.join('\n');
                    
                    if (start !== end) editor.setRangeText(newText, start, end, 'select');
                    else editor.value = newText;
                    
                    debouncedSaveHistory();
                    showToast('✅ 比對完成');
                } 
                // 表格模式處理：右側新增一欄
                else if (isTableMode) {
                    let selectedCells = Array.from(document.querySelectorAll('table#data-table td.sel-bg .td-inner'));
                    if (selectedCells.length === 0) {
                        let activeCell = document.activeElement.closest('.td-inner') || (document.activeElement.classList && document.activeElement.classList.contains('td-inner') ? document.activeElement : null);
                        if (!activeCell) {
                            const allTds = document.querySelectorAll('table#data-table td');
                            const singleSelectedTd = Array.from(allTds).find(td => td.style.boxShadow && td.style.boxShadow.includes('inset'));
                            if (singleSelectedTd) activeCell = singleSelectedTd.querySelector('.td-inner');
                        }
                        if (activeCell) selectedCells.push(activeCell);
                    }
                    if (selectedCells.length === 0) { alert("請先選取要比對的儲存格範圍！"); return; }

                    // 找出所有被選取的欄位索引
                    let colIndices = new Set();
                    selectedCells.forEach(cell => {
                        let td = cell.closest('td');
                        let cIdx = Array.from(td.parentNode.children).indexOf(td) - 1;
                        colIndices.add(cIdx);
                    });
                    
                    // 由右至左處理，避免新增欄位時擠壓到原始索引
                    let cols = Array.from(colIndices).sort((a,b) => b - a);

                    for (let cIdx of cols) {
                        insertColumnRightOf(cIdx);
                        
                        let tbodyRows = dataTable.querySelectorAll('tbody tr');
                        for (let r = 0; r < tbodyRows.length; r++) {
                            let tr = tbodyRows[r];
                            let origInner = tr.children[cIdx + 1]?.querySelector('.td-inner');
                            let newInner = tr.children[cIdx + 2]?.querySelector('.td-inner');
                            
                            if (origInner && newInner) {
                                let word = origInner.innerText.trim();
                                if (word) {
                                    let matches = getMatches(word);
                                    if (matches.length > 0) {
                                        newInner.innerText = matches.join('、');
                                    }
                                }
                            }
                        }
                    }
                    updateTableHeaders();
                    saveColNames(); saveColWidths();
                    debouncedSaveHistory();
                    showToast('✅ 比對完成，已在右側新增比對結果');
                }
                return; // 結束執行，不走原本的整句翻譯流程
            }

            const processText = async (text) => {
                // A. 處理拼音相關
                if (source === 'pinyin' || target === 'pinyin') {
                    const langCode = source === 'pinyin' ? target : source;
                    const pyFile = LANGUAGES[langCode].pyFile;
                    
                    if (pyFile) {
                        prepareDummyDOM();
                        await loadScript('https://gnisew.github.io/tools/turn/pinyin2/data-pinyin2pinyin.js');
                        await loadScript('https://gnisew.github.io/tools/ruby/hanzitopinyin.js');

                        if (target === 'pinyin') {
                            window.currentLanguageKey = langCode;
                            await loadRubyDictionary(langCode);

                            // 🌟 關鍵修改：支援 segment 與 segment_underscore
                            if (actionMode === 'segment' || actionMode === 'segment_underscore') {
                                // --- FMM 空格斷詞演算法 ---
                                const map = window.pinyinMap;
                                if (!map || map.size === 0) return text;

                                let maxLen = 0;
                                for (const key of map.keys()) {
                                    if (key.length > maxLen) maxLen = key.length;
                                }

                                const resultTokens = [];
                                let i = 0;
                                const len = text.length;

                                while (i < len) {
                                    let matched = false;
                                    let currentMax = Math.min(maxLen, len - i);
                                    for (let l = currentMax; l >= 1; l--) {
                                        const sub = text.substr(i, l);
                                        if (map.has(sub)) {
                                            resultTokens.push(sub);
                                            i += l;
                                            matched = true;
                                            break;
                                        }
                                    }
                                    if (!matched) {
                                        resultTokens.push(text[i]);
                                        i++;
                                    }
                                }

                                // 🌟 依照選項套用對應的連接符號
                                const separator = (actionMode === 'segment_underscore') ? '_' : ' ';
                                let raw = resultTokens.join(separator);
                                
                                let lines = raw.split('\n').map(line => {
                                    // 使用正則動態清除多餘的分隔符號
                                    let processed = line.replace(new RegExp('\\' + separator + '+', 'g'), separator);
                                    processed = processed.replace(new RegExp('^\\' + separator + '|\\' + separator + '$', 'g'), '');
                                    return processed.length > 0 ? separator + processed + separator : processed;
                                });
                                return lines.join('\n').trim();
                            } else if (actionMode === 'bracket_trans') {
                                // --- 字〔yin〕華 複合翻譯演算法 ---
                                
                                // 第一步：取得華語翻譯
                                let chineseTrans = text;
                                if (source !== 'chinese') {
                                    let currentSrc = source;
                                    if (pivot !== 'direct' && pivot !== '') {
                                        chineseTrans = await executeTranslation(currentSrc, pivot, chineseTrans);
                                        currentSrc = pivot;
                                    }
                                    if (currentSrc !== 'chinese') {
                                        chineseTrans = await executeTranslation(currentSrc, 'chinese', chineseTrans);
                                    }
                                }

                                // 第二步：取得 字〔yin〕格式
                                let hiddenHanzi = document.getElementById('hanziInput');
                                let hiddenPinyin = document.getElementById('pinyinInput');
                                hiddenHanzi.value = text;
                                hiddenPinyin.value = ''; 
                                
                                if (typeof hanziToPinyin === 'function') {
                                    hanziToPinyin('bracket');
                                }
                                
                                let bracketResult = hiddenPinyin.value || text;

                                // 第三步：逐行合併排版
                                let origLines = text.split('\n');
                                let bLines = bracketResult.split('\n');
                                let cLines = chineseTrans.split('\n');
                                let combined = [];
                                
                                for (let i = 0; i < Math.max(bLines.length, cLines.length); i++) {
                                    let orig = (origLines[i] || '').trim();
                                    let b = (bLines[i] || '').trim();
                                    let c = (cLines[i] || '').trim();
                                    
                                    // 只有當翻譯結果不同於原文時，才加上華語翻譯 (防呆，避免：朋友〔pen giu〕：朋友)
                                    if (b && c && c !== orig) {
                                        let line = `${b}：${c}`;
                                        // 智慧標點：如果沒有以標點符號結尾，幫它補上句號
                                        if (!/[。！？.!?]$/.test(line)) line += '。';
                                        combined.push(line);
                                    } else if (b) {
                                        combined.push(b);
                                    } else if (c) {
                                        combined.push(c);
                                    } else {
                                        combined.push('');
                                    }
                                }
                                return combined.join('\n');

                            } else {
                                // --- 一般字轉音 ---
                                let hiddenHanzi = document.getElementById('hanziInput');
                                let hiddenPinyin = document.getElementById('pinyinInput');
                                hiddenHanzi.value = text;
                                hiddenPinyin.value = ''; 
                                
                                if (typeof hanziToPinyin === 'function') {
                                    hanziToPinyin(actionMode === 'default' ? undefined : actionMode);
                                }
                                
                                const result = hiddenPinyin.value;
                                return result && result.trim() !== '' ? result : text; 
                            }
                        } 
                        else {
                            window.currentLanguageKey = langCode;
                            await loadScript('https://gnisew.github.io/tools/ime/ime-dict.js');
                            initializeImeDicts(); 
                            
                            const result = pinyinToHanziEngine(text, langCode);
                            return result && result.trim() !== '' ? result : text; 
                        }
                    }
                    return text;
                }

                // B. 一般翻譯流程 
                let currentText = text;
                let currentFrom = source;
                const proxyFrom = getProxyTarget(currentFrom);
                if (proxyFrom && target !== proxyFrom) {
                    currentText = await executeTranslation(currentFrom, proxyFrom, currentText);
                    currentFrom = proxyFrom;
                }
                const proxyTo = getProxyTarget(target);
                const effectiveTo = (proxyTo && currentFrom !== proxyTo) ? proxyTo : target;


                if (target === 'segment') {
                    let segLang = currentFrom;
                    // 若是多層路徑，抓最後一個中介當作分詞參考語
                    if (currentFrom === 'chinese' || !LANGUAGES[currentFrom].file) {
                        segLang = transState.pivot.split(',').pop(); 
                    }
                    if (!segLang || segLang === 'direct') segLang = 'kasu';

                    // 🌟 支援多層陣列的接力翻譯
                    if (pivot !== 'direct' && pivot !== '') {
                        const pivotSteps = pivot.split(',');
                        for (const p of pivotSteps) {
                            if (currentFrom !== p) {
                                currentText = await executeTranslation(currentFrom, p, currentText);
                                currentFrom = p;
                            }
                        }
                    }

                    const segFile = getFileForPair('chinese', segLang);
                    const dictsSeg = await fetchDictionaryByFile(segFile);
                    
                    const separator = (actionMode === 'segment_space') ? ' ' : '_';
                    currentText = doSegmentText(currentText, dictsSeg, currentFrom === 'chinese', separator);
                } else {
                    // 🌟 支援多層陣列的接力翻譯
                    if (pivot !== 'direct' && pivot !== '') {
                        const pivotSteps = pivot.split(',');
                        for (const p of pivotSteps) {
                            if (currentFrom !== p) {
                                currentText = await executeTranslation(currentFrom, p, currentText);
                                currentFrom = p;
                            }
                        }
                    }
                    
                    if (currentFrom !== target) {
                        currentText = await executeTranslation(currentFrom, target, currentText);
                    }
                }
                return currentText;
			};

            const editor = document.getElementById('editor');
            const tableContainer = document.getElementById('tableModeContainer');
            const isTableMode = tableContainer && window.getComputedStyle(tableContainer).display !== 'none';

            if (!isTableMode && editor) {
                const start = editor.selectionStart, end = editor.selectionEnd;
                let text = (start !== end) ? editor.value.substring(start, end) : editor.value;
                text = await processText(text);
                if (start !== end) editor.setRangeText(text, start, end, 'select'); else editor.value = text;
            } else if (isTableMode) {
                const sel = window.getSelection();
                if (sel.toString().length > 0 && tableContainer && tableContainer.contains(sel.anchorNode)) {
                    let text = await processText(sel.toString());
                    const range = sel.getRangeAt(0); range.deleteContents(); range.insertNode(document.createTextNode(text));
                } else {
                    let selectedCells = Array.from(document.querySelectorAll('table#data-table td.sel-bg .td-inner'));
                    if (selectedCells.length === 0) {
                        let activeCell = document.activeElement.closest('.td-inner') || (document.activeElement.classList && document.activeElement.classList.contains('td-inner') ? document.activeElement : null);
                        if (!activeCell) {
                            const allTds = document.querySelectorAll('table#data-table td');
                            const singleSelectedTd = Array.from(allTds).find(td => td.style.boxShadow && td.style.boxShadow.includes('inset'));
                            if (singleSelectedTd) activeCell = singleSelectedTd.querySelector('.td-inner');
                        }
                        if (activeCell) selectedCells.push(activeCell);
                    }
                    if (selectedCells.length === 0) { alert("請先選取要處理的文字或儲存格！"); return; }
                    
                    for (const cell of selectedCells) {
                        let text = cell.innerText || cell.textContent;
                        cell.innerText = await processText(text);
                        if (cell.hasAttribute('data-formula')) cell.removeAttribute('data-formula');
                    }
                }
            }
			debouncedSaveHistory();
        } catch (err) {
            console.error("轉換發生錯誤:", err); 
            alert("轉換發生錯誤，詳細請查看主控台 (Console)。");
        } finally {
            btnExecute.innerHTML = originalBtnText; 
            checkButtonState();
        }
    }

    if (btnExecute) {
        btnExecute.addEventListener('click', () => {
            performConversion('default');
        });
    }

    initDropdowns();
    updateCapsuleButtonUI();
    updatePivotOptions();




// ========== 以下是對話模式與翻譯系統的共用邏輯 ==========
    const chatInput = document.getElementById('chatInput');
    const btnSendChat = document.getElementById('btnSendChat');
    const chatMessagesArea = document.getElementById('chatMessagesArea');
    const chatConvertToPinyin = document.getElementById('chatConvertToPinyin');

    // 建立對話模式獨立的狀態，預設讀取原本的記憶
    let chatTransState = {
        source: localStorage.getItem('translate_source_lang') || 'chinese',
        target: localStorage.getItem('translate_target_lang') || 'kasu',
        pivot: 'direct'
    };

    if (chatInput && btnSendChat) {
        
        // 🌟 新增：預先載入翻譯字典與拼音引擎 (選定語言時立即觸發)
        async function preloadChatDictionaries() {
            const { source, target, pivot } = chatTransState;
            const needPinyin = chatConvertToPinyin.checked;
            
            // 預載翻譯字典
            const loadTrans = async (from, to) => {
                if (from === to) return;
                const file = getFileForPair(from, to);
                if (file) await fetchDictionaryByFile(file);
            };

            if (source !== target) {
                let currentFrom = source;
                const proxyFrom = getProxyTarget(currentFrom);
                if (proxyFrom && target !== proxyFrom) {
                    await loadTrans(currentFrom, proxyFrom);
                    currentFrom = proxyFrom;
                }
                const proxyTo = getProxyTarget(target);
                const effectiveTo = (proxyTo && currentFrom !== proxyTo) ? proxyTo : target;

                if (pivot && pivot !== 'direct') {
                    for (const p of pivot.split(',')) {
                        if (currentFrom !== p) {
                            await loadTrans(currentFrom, p);
                            currentFrom = p;
                        }
                    }
                }
                if (currentFrom !== effectiveTo) {
                    await loadTrans(currentFrom, effectiveTo);
                }
            }

            // 預載拼音引擎與字典
            if (needPinyin && target !== 'pinyin') {
                await loadScript('https://gnisew.github.io/tools/turn/pinyin2/data-pinyin2pinyin.js');
                await loadScript('https://gnisew.github.io/tools/ruby/hanzitopinyin.js');
                window.currentLanguageKey = target;
                await loadRubyDictionary(target);
            }
        }

        // 1. 初始化對話模式的下拉選單
        // 1. 初始化對話模式的下拉選單
        function initChatDropdowns() {
            document.getElementById('chat-source-btn').textContent = LANGUAGES[chatTransState.source]?.name || '華語';
            document.getElementById('chat-target-btn').textContent = LANGUAGES[chatTransState.target]?.name || '詔安';

            document.querySelectorAll('#chat-dropdown-source .dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    chatTransState.source = item.dataset.value;
                    document.getElementById('chat-source-btn').textContent = item.textContent;
                    
                    // 🌟 新增：將來源語言存入記憶體 (與主翻譯系統共用同一個 Key)
                    localStorage.setItem('translate_source_lang', item.dataset.value);
                    
                    updateChatPivotOptions();
                    e.target.closest('.dropdown-list').classList.remove('show');
                    preloadChatDictionaries(); 
                });
            });

            document.querySelectorAll('#chat-dropdown-target .dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    chatTransState.target = item.dataset.value;
                    document.getElementById('chat-target-btn').textContent = item.textContent;
                    
                    // 🌟 新增：將目標語言存入記憶體
                    localStorage.setItem('translate_target_lang', item.dataset.value);
                    
                    updateChatPivotOptions();
                    e.target.closest('.dropdown-list').classList.remove('show');
                    preloadChatDictionaries(); 
                });
            });

            if (chatConvertToPinyin) {
                // 剛載入時，嘗試讀取之前的勾選紀錄 (預設為 true)
                const savedPinyinCheck = localStorage.getItem('wesing-chat-pinyin-checked');
                if (savedPinyinCheck !== null) {
                    chatConvertToPinyin.checked = (savedPinyinCheck === 'true');
                }
                
                // 勾選狀態改變時，存入記憶體並觸發預載
                chatConvertToPinyin.addEventListener('change', (e) => {
                    localStorage.setItem('wesing-chat-pinyin-checked', e.target.checked);
                    preloadChatDictionaries();
                });
            }
        }

        // 共用 findPossiblePivots 來更新中介語言選單
        function updateChatPivotOptions() {
            const { source, target } = chatTransState;
            const pivotList = document.getElementById('chat-pivot-list');
            const pivotWrapper = document.getElementById('chat-dropdown-pivot');
            const pivotLabel = document.getElementById('chat-pivot-label');

            if (source === 'pinyin' || target === 'pinyin' || source === target) {
                pivotWrapper.style.opacity = '0.4';
                chatTransState.pivot = 'direct';
                pivotLabel.style.display = 'none';
                return;
            }
            
            pivotWrapper.style.opacity = '1';
            const possiblePivots = findPossiblePivots(source, target); 
            pivotList.innerHTML = '';
            
            const directItem = document.createElement('div');
            directItem.className = 'dropdown-item'; directItem.textContent = '直達 (無)';
            directItem.onclick = (e) => { 
                chatTransState.pivot = 'direct'; 
                pivotLabel.style.display = 'none'; 
                e.target.closest('.dropdown-list').classList.remove('show'); 
                preloadChatDictionaries();
            };
            pivotList.appendChild(directItem);

            possiblePivots.forEach(pKey => {
                const item = document.createElement('div');
                item.className = 'dropdown-item';
                const names = pKey.split(',').map(p => LANGUAGES[p].name);
                item.textContent = names.join(' > ');
                item.onclick = (e) => {
                    chatTransState.pivot = pKey;
                    pivotLabel.textContent = item.textContent;
                    pivotLabel.style.display = 'inline';
                    e.target.closest('.dropdown-list').classList.remove('show');
                    preloadChatDictionaries();
                };
                pivotList.appendChild(item);
            });

            if (possiblePivots.length > 0 && chatTransState.pivot !== 'direct' && !possiblePivots.includes(chatTransState.pivot)) {
                chatTransState.pivot = possiblePivots[0];
                const names = chatTransState.pivot.split(',').map(p => LANGUAGES[p].name);
                pivotLabel.textContent = names.join(' > ');
                pivotLabel.style.display = 'inline';
            }
        }

        // 2. 聊天互動與發送
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); }
        });

        btnSendChat.addEventListener('click', handleSendChat);

        async function handleSendChat() {
            const text = chatInput.value.trim();
            if (!text) return;

            chatInput.value = ''; chatInput.style.height = 'auto';
            appendChatMessage(text, true);

            const loadingWrapper = appendChatMessage('翻譯處理中...', false);
            const loadingBubble = loadingWrapper.querySelector('.chat-bubble');

            try {
                // 確保送出前資源皆已就緒
                await preloadChatDictionaries();

                let currentText = text;
                const { source, target, pivot } = chatTransState;
                const needPinyin = chatConvertToPinyin.checked;

                // --- 翻譯核心 ---
                if (source !== target) {
                    let currentFrom = source;
                    const proxyFrom = getProxyTarget(currentFrom);
                    if (proxyFrom && target !== proxyFrom) {
                        currentText = await executeTranslation(currentFrom, proxyFrom, currentText);
                        currentFrom = proxyFrom;
                    }
                    const proxyTo = getProxyTarget(target);
                    const effectiveTo = (proxyTo && currentFrom !== proxyTo) ? proxyTo : target;

                    if (pivot && pivot !== 'direct') {
                        for (const p of pivot.split(',')) {
                            if (currentFrom !== p) {
                                currentText = await executeTranslation(currentFrom, p, currentText);
                                currentFrom = p;
                            }
                        }
                    }
                    if (currentFrom !== effectiveTo) {
                        currentText = await executeTranslation(currentFrom, effectiveTo, currentText);
                    }
                }

                // --- 拼音核心 ---
                let pinyinText = "";
                if (needPinyin && target !== 'pinyin') {
                    prepareDummyDOM(); 
                    let hiddenHanzi = document.getElementById('hanziInput');
                    let hiddenPinyin = document.getElementById('pinyinInput');
                    
                    if (hiddenHanzi && hiddenPinyin) {
                        hiddenHanzi.value = currentText;
                        hiddenPinyin.value = '';
                        window.currentLanguageKey = target; // 明確告訴引擎當前目標語言
                        
                        if (typeof hanziToPinyin === 'function') {
                            hanziToPinyin();
                            pinyinText = hiddenPinyin.value;
                        }
                    }
                }

                const finalResult = pinyinText ? `${currentText}\n${pinyinText}` : currentText;
                loadingBubble.innerText = finalResult;
            } catch (err) {
                loadingBubble.innerText = '❌ 轉換發生錯誤';
                loadingBubble.classList.add('text-red-500');
                console.error(err);
            }
            chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
        }

        function appendChatMessage(text, isUser) {
            const wrapper = document.createElement('div');
            wrapper.className = `chat-message-wrapper flex flex-col ${isUser ? 'items-end' : 'items-start'}`;
            
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble code-text ${isUser ? 'chat-bubble-user' : 'chat-bubble-system'}`;
            bubble.style.whiteSpace = 'pre-wrap';
            bubble.innerText = text;

            const actions = document.createElement('div');
            actions.className = `chat-actions ${isUser ? 'justify-end pr-1' : 'justify-start pl-1'}`;
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'chat-action-btn';
            copyBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;">content_copy</span>複製';
            
            // 🌟 關鍵修正：將 text 改為 bubble.innerText，確保每次都抓取最新結果
            copyBtn.onclick = () => navigator.clipboard.writeText(bubble.innerText).then(() => {
                const toast = document.getElementById('toast');
                if(toast) { 
                    toast.textContent = '✅ 已複製'; 
                    toast.classList.remove('opacity-0'); 
                    setTimeout(()=>toast.classList.add('opacity-0'), 2000); 
                }
            });

            const delBtn = document.createElement('button');
            delBtn.className = 'chat-action-btn delete';
            delBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;">delete</span>刪除';
            delBtn.onclick = () => wrapper.remove();

            actions.appendChild(copyBtn); actions.appendChild(delBtn);
            wrapper.appendChild(bubble); wrapper.appendChild(actions);
            chatMessagesArea.appendChild(wrapper);
            chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
            return wrapper;
        }

		// 🌟 新增：讀取編輯器或表格的文字，重新生成對話氣泡
        window.renderChatFromText = function(text) {
            // 1. 先清空目前的對話區
            chatMessagesArea.innerHTML = '';
            if (!text || text.trim() === '') return;

            // 2. 利用現成的 TSV 解析器將文字轉為陣列
            const rows = parseTSV(text);
            let isFirstRow = true;

            rows.forEach(row => {
                // 跳過我們自動產生的標題列 (A欄="原文")
                if (isFirstRow && row[0] === '原文') {
                    isFirstRow = false;
                    return; 
                }
                isFirstRow = false;

                const userText = row[0] || '';
                const transText = row[1] || '';
                const pinyinText = row[2] || '';

                // 如果這行全空，就跳過
                if (userText.trim() === '' && transText.trim() === '' && pinyinText.trim() === '') return;

                // 3. 根據 A 欄建立「使用者氣泡」
                if (userText) {
                    appendChatMessage(userText, true);
                }

                // 4. 根據 B 欄與 C 欄建立「系統氣泡 (翻譯+拼音)」
                let sysParts = [];
                if (transText) sysParts.push(transText);
                if (pinyinText) sysParts.push(pinyinText);
                
                if (sysParts.length > 0) {
                    appendChatMessage(sysParts.join('\n'), false);
                }
            });
            
            // 捲動到最底部
            chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
        };

        initChatDropdowns();
        updateChatPivotOptions();
        
        // 初次載入時主動預載一次
        preloadChatDictionaries();
		if (currentMode === 'chat') {
            window.renderChatFromText(editor.value);
        }
    }





});

// ==========================================
// 複製與貼上選單控制與執行邏輯
// ==========================================
const pasteGroup = document.getElementById('dd-clipboard-group');
if (pasteGroup) {
    const pasteActionBtn = pasteGroup.querySelector('.action-btn');
    pasteActionBtn.addEventListener('click', () => {
        const btnPasteValue = document.getElementById('btn-paste-value');
        if (!btnPasteValue) return;
        if (currentMode === 'table') {
            btnPasteValue.disabled = false;
            btnPasteValue.title = "貼上純文字並清除公式";
        } else {
            btnPasteValue.disabled = true;
            btnPasteValue.title = "僅在表格模式可用";
        }
    });
}

// 綁定複製選單動作
document.querySelectorAll('#dd-clipboard-group button[data-action^="copy"], #dd-clipboard-group button[data-action="select-all"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = btn.closest('.action-menu');
        if (menu) menu.classList.remove('show');
        
        const action = btn.dataset.action;
        if (action === 'select-all') {
            if (currentMode === 'table') selectAllTable();
            else { editor.focus(); editor.select(); }
        } else if (action === 'copy-all') {
            if (currentMode === 'table') selectAllTable();
            else { editor.focus(); editor.select(); }
            
            setTimeout(() => {
                if (currentMode === 'table') copySelectedTableData();
                else document.execCommand('copy');
            }, 50);
        } else if (action === 'copy-selected') {
            if (currentMode === 'table' && (selectedRows.length > 0 || selectedCols.length > 0 || selectedCellBlocks.length > 0)) {
                copySelectedTableData();
            } else {
                document.execCommand('copy');
                showToast('✅ 文字已複製！');
            }
        }
    });
});


// ==========================================
// 手機版：關閉鍵盤功能 (使用 inputmode="none")
// ==========================================
let isMobileKeyboardDisabled = false;

document.addEventListener('DOMContentLoaded', () => {
    const btnToggleKeyboard = document.getElementById('btnToggleKeyboardMobile');
    const iconKeyboardCheck = document.getElementById('iconKeyboardCheck');

    if (btnToggleKeyboard) {
        btnToggleKeyboard.addEventListener('click', (e) => {
            e.stopPropagation();
            isMobileKeyboardDisabled = !isMobileKeyboardDisabled;
            
            if (isMobileKeyboardDisabled) {
                iconKeyboardCheck.style.opacity = '1';
                if (typeof showToast === 'function') showToast('✅ 已啟用「關閉鍵盤」');
            } else {
                iconKeyboardCheck.style.opacity = '0';
                if (typeof showToast === 'function') showToast('❌ 已取消「關閉鍵盤」');
            }
            
            applyKeyboardState();
            
            // 點擊後自動關閉選單
            const menu = btnToggleKeyboard.closest('.dropdown-menu');
            if (menu) menu.classList.remove('show');
        });
    }

    // 自動監聽表格變化，確保未來「新增的列或欄」也一併套用關閉鍵盤狀態
    const dataTable = document.getElementById('data-table');
    if (dataTable) {
        const tableObserver = new MutationObserver((mutations) => {
            if (isMobileKeyboardDisabled) {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // 確保是元素節點
                            if (node.classList && node.classList.contains('td-inner')) {
                                node.setAttribute('inputmode', 'none');
                            }
                            node.querySelectorAll('.td-inner').forEach(inner => inner.setAttribute('inputmode', 'none'));
                        }
                    });
                });
            }
        });
        tableObserver.observe(dataTable, { childList: true, subtree: true });
    }
});

// 套用狀態到所有輸入區塊
function applyKeyboardState() {
    const editor = document.getElementById('editor');
    const cellEditor = document.getElementById('cellEditor');
    const tdInners = document.querySelectorAll('.td-inner');
    
    // 收集所有需要防護的輸入元素 (包含主編輯區、獨立儲存格編輯器、各類對話框)
    const inputs = [
        editor, cellEditor, 
        document.getElementById('findInput'), document.getElementById('replaceInput'), 
        document.getElementById('promptInput'), document.getElementById('autoFillPrefix'), 
        document.getElementById('autoFillSuffix'), document.getElementById('autoFillStartNum'), 
        document.getElementById('autoFillDigits'), document.getElementById('autoFormulaInput'),
        document.getElementById('autoSplitDelimiter'), document.getElementById('autoMergeDelimiter')
    ];
                    
    if (isMobileKeyboardDisabled) {
        inputs.forEach(el => { if (el) el.setAttribute('inputmode', 'none'); });
        tdInners.forEach(td => td.setAttribute('inputmode', 'none'));
    } else {
        inputs.forEach(el => { if (el) el.removeAttribute('inputmode'); });
        tdInners.forEach(td => td.removeAttribute('inputmode'));
    }
    
    // 智慧焦點處理：如果當前游標停在任何輸入框上，強制讓它失去焦點再重新聚焦，讓 OS 鍵盤狀態立刻生效
    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT' || active.classList.contains('td-inner'))) {
        active.blur();
        if (!isMobileKeyboardDisabled) {
            setTimeout(() => active.focus(), 50); 
        }
    }
}





/* ==========================================
   尋找與取代：批次取代模組 (支援長度優先、安全佔位符與擴充漢字)
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    const BATCH_DATA_KEY = 'wesing-batch-replace-data';
    const BATCH_DIR_KEY = 'wesing-batch-direction';
    const BATCH_DELIM_KEY = 'wesing-batch-delimiter';

    const btnToggleBatchMode = document.getElementById('btnToggleBatchMode');
    const normalSearchContainer = document.getElementById('normalSearchContainer');
    const batchSearchContainer = document.getElementById('batchSearchContainer');
    const searchDirectionGroup = document.getElementById('searchDirectionGroup');
    const frTitleIcon = document.getElementById('frTitleIcon');
    const msgFind = document.getElementById('findReplaceMessage');

	// 輔助函數：根據輸入框內容，決定是否顯示「X」按鈕
	function updateFindReplaceClearButtons() {
		const btnClearFind = document.getElementById('btnClearFind');
		const btnClearReplace = document.getElementById('btnClearReplace');
		const findInput = document.getElementById('findInput');
		const replaceInput = document.getElementById('replaceInput');

		if (btnClearFind && findInput) {
			if (findInput.value.length > 0) btnClearFind.classList.remove('hidden');
			else btnClearFind.classList.add('hidden');
		}
		if (btnClearReplace && replaceInput) {
			if (replaceInput.value.length > 0) btnClearReplace.classList.remove('hidden');
			else btnClearReplace.classList.add('hidden');
		}
	}

	// 啟動時讀取記憶
	findInput.value = localStorage.getItem(FIND_TEXT_KEY) || '';
	replaceInput.value = localStorage.getItem(REPLACE_TEXT_KEY) || '';
	updateFindReplaceClearButtons();

	// 監聽打字事件：即時記憶與切換按鈕顯示
	findInput.addEventListener('input', () => {
		localStorage.setItem(FIND_TEXT_KEY, findInput.value);
		updateFindReplaceClearButtons();
	});
	replaceInput.addEventListener('input', () => {
		localStorage.setItem(REPLACE_TEXT_KEY, replaceInput.value);
		updateFindReplaceClearButtons();
	});

	// 點擊「X」按鈕：清除內容、清空記憶並對焦
	if (btnClearFind) {
		btnClearFind.addEventListener('click', () => {
			findInput.value = '';
			localStorage.setItem(FIND_TEXT_KEY, '');
			updateFindReplaceClearButtons();
			findInput.focus();
		});
	}
	if (btnClearReplace) {
		btnClearReplace.addEventListener('click', () => {
			replaceInput.value = '';
			localStorage.setItem(REPLACE_TEXT_KEY, '');
			updateFindReplaceClearButtons();
			replaceInput.focus();
		});
	}

    const batchInputTextarea = document.getElementById('batchInputTextarea');
    const batchInputTableWrapper = document.getElementById('batchInputTableWrapper');
    const batchTableBody = document.getElementById('batchTableBody');
    const btnBatchViewText = document.getElementById('btnBatchViewText');
    const btnBatchViewTable = document.getElementById('btnBatchViewTable');
    const batchDelimiter = document.getElementById('batchDelimiter');
    
    let isBatchMode = false;

    // 1. 初始化讀取快取資料與設定
    batchInputTextarea.value = localStorage.getItem(BATCH_DATA_KEY) || '';
    
    // 還原方向與分隔符號
    const savedDir = localStorage.getItem(BATCH_DIR_KEY) || 'L2R';
    const dirRadio = document.querySelector(`input[name="batchDirection"][value="${savedDir}"]`);
    if (dirRadio) dirRadio.checked = true;
    
    const savedDelim = localStorage.getItem(BATCH_DELIM_KEY) || 'TAB';
    if (batchDelimiter) batchDelimiter.value = savedDelim;

    // 2. 切換批次模式
    btnToggleBatchMode.addEventListener('click', () => {
        isBatchMode = !isBatchMode;
        if (isBatchMode) {
            normalSearchContainer.classList.add('hidden');
            batchSearchContainer.classList.remove('hidden');
            searchDirectionGroup.classList.add('opacity-30', 'pointer-events-none');
            btnToggleBatchMode.classList.replace('bg-gray-100', 'bg-indigo-100');
            btnToggleBatchMode.classList.replace('text-gray-700', 'text-indigo-700');
            frTitleIcon.textContent = 'checklist';
            msgFind.textContent = '批次取代';
        } else {
            normalSearchContainer.classList.remove('hidden');
            batchSearchContainer.classList.add('hidden');
            searchDirectionGroup.classList.remove('opacity-30', 'pointer-events-none');
            btnToggleBatchMode.classList.replace('bg-indigo-100', 'bg-gray-100');
            btnToggleBatchMode.classList.replace('text-indigo-700', 'text-gray-700');
            frTitleIcon.textContent = 'search';
            msgFind.textContent = '尋找與取代';
        }
    });

    // =====================================
    // 3. 視圖切換與同步邏輯 (支援動態分隔符)
    // =====================================

    // 取得目前選定的分隔符 (TAB 需轉換為真正的 \t)
    function getDelimiter() {
        return batchDelimiter.value === 'TAB' ? '\t' : batchDelimiter.value;
    }

    // 當分隔符改變時，記錄偏好，並若處於表格檢視，立即同步回文字框
    batchDelimiter.addEventListener('change', () => {
        localStorage.setItem(BATCH_DELIM_KEY, batchDelimiter.value); // 🌟 記憶偏好
        if (!batchInputTableWrapper.classList.contains('hidden')) {
            syncTableToTextarea();
        }
    });

    function syncTableToTextarea() {
        const delim = getDelimiter();
        const rows = [];
        batchTableBody.querySelectorAll('tr').forEach(tr => {
            const cols = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
            // 只要其中一格有文字，就保留這一列
            if (cols.length > 0 && cols.some(text => text !== '')) rows.push(cols.join(delim));
        });
        batchInputTextarea.value = rows.join('\n');
        localStorage.setItem(BATCH_DATA_KEY, batchInputTextarea.value);
    }

    function renderBatchTable() {
        const delim = getDelimiter();
        const lines = batchInputTextarea.value.split('\n');
        batchTableBody.innerHTML = '';
        
        lines.forEach((line, idx) => {
            if (line.trim() === '') return; // 跳過空行
            const parts = line.split(delim);
            if (parts.length >= 1) {
                const tr = document.createElement('tr');
                tr.className = (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50') + ' border-b border-gray-200';
                
                // 第一欄 (加上 cursor-default 讓游標變成一般箭頭指標)
                const td1 = document.createElement('td');
                td1.className = 'border-r border-gray-200 px-3 py-1.5 outline-none focus:bg-blue-50 break-all w-1/2 cursor-default';
                td1.contentEditable = true;
                td1.innerText = parts[0] || '';
                
                // 第二欄 (加上 cursor-default 讓游標變成一般箭頭指標)
                const td2 = document.createElement('td');
                td2.className = 'px-3 py-1.5 outline-none focus:bg-blue-50 break-all w-1/2 cursor-default';
                td2.contentEditable = true;
                td2.innerText = parts[1] || '';

                // 綁定編輯事件同步回 Textarea
                td1.addEventListener('blur', syncTableToTextarea);
                td2.addEventListener('blur', syncTableToTextarea);

                tr.appendChild(td1);
                tr.appendChild(td2);
                batchTableBody.appendChild(tr);
            }
        });
    }

    btnBatchViewText.addEventListener('click', () => {
        if (!batchInputTableWrapper.classList.contains('hidden')) {
            syncTableToTextarea();
        }
        batchInputTableWrapper.classList.add('hidden');
        batchInputTextarea.classList.remove('hidden');
        btnBatchViewText.classList.replace('text-gray-400', 'text-blue-600');
        btnBatchViewTable.classList.replace('text-blue-600', 'text-gray-400');
    });

    btnBatchViewTable.addEventListener('click', () => {
        renderBatchTable(); // 根據當前分隔符號重新繪製表格
        batchInputTextarea.classList.add('hidden');
        batchInputTableWrapper.classList.remove('hidden');
        btnBatchViewTable.classList.replace('text-gray-400', 'text-blue-600');
        btnBatchViewText.classList.replace('text-blue-600', 'text-gray-400');
    });

    // 儲存文字框輸入
    batchInputTextarea.addEventListener('input', () => {
        localStorage.setItem(BATCH_DATA_KEY, batchInputTextarea.value);
    });

    batchTableBody.addEventListener('keydown', (e) => {
        // 表格檢視下，阻擋 Enter 鍵換行
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur(); // 按下 Enter 時自動失去焦點並同步
        }
    });

    batchTableBody.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.originalEvent || e).clipboardData.getData('text/plain');
        if (!text) return;
        
        // Excel 複製出來的資料必定是以 \t (欄) 和 \n (列) 分隔
        const rows = text.split(/\r?\n/);
        const activeTd = document.activeElement.closest('td');
        if (!activeTd || !batchTableBody.contains(activeTd)) return;

        const startTr = activeTd.closest('tr');
        let startRowIdx = Array.from(batchTableBody.children).indexOf(startTr);
        let startColIdx = Array.from(startTr.children).indexOf(activeTd);

        rows.forEach((rowStr, rOffset) => {
            // 忽略 Excel 複製時尾端多出的一個空白換行
            if (rowStr === '' && rOffset === rows.length - 1) return; 
            
            const cols = rowStr.split('\t');
            let targetTr = batchTableBody.children[startRowIdx + rOffset];
            
            // 如果貼上的列數超過目前的表格，自動產生新的一列
            if (!targetTr) {
                targetTr = document.createElement('tr');
                targetTr.className = (startRowIdx + rOffset) % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                
                const newTd1 = document.createElement('td');
                newTd1.className = 'border border-gray-200 px-2 py-1 outline-none focus:bg-blue-50 break-all';
                newTd1.contentEditable = true;
                newTd1.addEventListener('blur', syncTableToTextarea);
                
                const newTd2 = document.createElement('td');
                newTd2.className = 'border border-gray-200 px-2 py-1 outline-none focus:bg-blue-50 break-all';
                newTd2.contentEditable = true;
                newTd2.addEventListener('blur', syncTableToTextarea);

                targetTr.appendChild(newTd1);
                targetTr.appendChild(newTd2);
                batchTableBody.appendChild(targetTr);
            }

            // 將資料對應覆蓋進該格 (最多只覆蓋左、右兩欄)
            cols.forEach((colStr, cOffset) => {
                if (startColIdx + cOffset < 2) {
                    const targetTd = targetTr.children[startColIdx + cOffset];
                    if (targetTd) targetTd.innerText = colStr.trim();
                }
            });
        });
        
        syncTableToTextarea(); // 貼上完畢後立刻同步到文字快取
        showFRMsg('✅ 表格資料已貼上', false);
    });

    // 清除資料
    document.getElementById('btnBatchClear').addEventListener('click', () => {
        batchInputTextarea.value = '';
        batchTableBody.innerHTML = '';
        localStorage.removeItem(BATCH_DATA_KEY);
    });

    // 記錄方向選擇
    document.querySelectorAll('input[name="batchDirection"]').forEach(radio => {
        radio.addEventListener('change', (e) => localStorage.setItem(BATCH_DIR_KEY, e.target.value));
    });

    // =====================================
    // 4. 核心：安全佔位符批次取代引擎
    // =====================================
    document.getElementById('btnBatchReplaceAll').addEventListener('click', () => {
        const rawText = batchInputTextarea.value;
        const direction = document.querySelector('input[name="batchDirection"]:checked').value;
        const isRegex = document.getElementById('chkRegex').checked;
        const isCase = document.getElementById('chkCaseSensitive').checked;
        const isWhole = document.getElementById('chkWholeWord').checked;
        const isFormulaMatch = document.getElementById('chkFormulaMatch')?.checked;
        const context = getSelectionContext(); 
        
        // 1. 解析成規則陣列並過濾無效行
        let rules = [];
        const delim = getDelimiter();
        
        rawText.split('\n').forEach(line => {
            const parts = line.split(delim);
            if (parts.length >= 2) {
                let findStr = direction === 'L2R' ? parts[0] : parts[1];
                let replaceStr = direction === 'L2R' ? parts[1] : parts[0];
				if (isRegex && replaceStr) {
                    replaceStr = replaceStr.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
                }
                if (findStr) rules.push({ find: findStr, replace: replaceStr || '' });
            }
        });

        if (rules.length === 0) return showFRMsg('⚠️ 請貼上有效的兩欄對照表');

        // 2. ⭐ 關鍵：依尋找字串長度遞減排序 (字數多的優先處理，避免短詞攔截)
        rules.sort((a, b) => b.find.length - a.find.length);

        // 定義極高安全性的 Unicode 佔位符區段 (Private Use Area)
        const PL_START = '\uE000';
        const PL_END = '\uE001';
        const placeholderMap = {};

        // 3. 預先編譯正則表達式，提升效能
        rules.forEach((rule, index) => {
            let term = rule.find;
            if (!isRegex) term = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (!isRegex && isWhole) term = '\\b' + term + '\\b';
            
            // 加上 u 旗標以完美支援擴充漢字
            const flags = (isCase ? '' : 'i') + 'gmu';
            rule.regex = new RegExp(term, flags);
            rule.placeholder = `${PL_START}${index}${PL_END}`;
            placeholderMap[rule.placeholder] = rule.replace;
        });

        // 共用替換邏輯：單次文字處理
        const processTextSafely = (text) => {
            if (!text) return text;
            let tempText = text;
            
            // 階段一：把所有命中的字串變成佔位符
            rules.forEach(rule => {
                tempText = tempText.replace(rule.regex, rule.placeholder);
            });

            // 階段二：將佔位符還原為最終結果
            const finalRegex = new RegExp(`${PL_START}(\\d+)${PL_END}`, 'g');
            tempText = tempText.replace(finalRegex, (match) => placeholderMap[match] !== undefined ? placeholderMap[match] : match);
            
            return tempText;
        };

        // 4. 執行取代 (依模式分配)
        let replacedCount = 0; // 粗略計算是否有變化
        
        if (currentMode === 'text') {
            const text = editor.value;
            if (context.hasSelection) {
                const selectedText = text.substring(context.start, context.end);
                const newText = processTextSafely(selectedText);
                if (newText !== selectedText) {
                    editor.setRangeText(newText, context.start, context.end, 'select');
                    replacedCount++;
                }
            } else {
                const newText = processTextSafely(text);
                if (newText !== text) {
                    editor.value = newText;
                    replacedCount++;
                }
            }
            if (replacedCount > 0) { debouncedSaveHistory(); updateLineNumbers(); }
        } else {
            // 表格模式
            const cells = getTargetCells(); // 使用系統原本的函數來獲取目標儲存格
            
            cells.forEach(cell => {
                let textToSearch = cell.inner.innerText;
                if (isFormulaMatch && cell.inner.hasAttribute('data-formula')) {
                    textToSearch = cell.inner.getAttribute('data-formula');
                }

                const newText = processTextSafely(textToSearch);
                
                if (newText !== textToSearch) {
                    replacedCount++;
                    if (isFormulaMatch && cell.inner.hasAttribute('data-formula')) {
                        cell.inner.setAttribute('data-formula', newText);
                    } else {
                        cell.inner.innerText = newText;
                        if (!newText.startsWith('=')) cell.inner.removeAttribute('data-formula');
                    }
                }
            });
            
            if (replacedCount > 0) {
                recalculateAllFormulas();
                debouncedSaveHistory();
            }
        }

        if (replacedCount > 0) showFRMsg(`✅ 批次取代已套用`, false);
        else showFRMsg('找不到符合的目標');
    });
});






/* ==========================================
   編號設定工具模組 (支援字母進制、漢字轉換與智慧移除)
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    const numberingModal = document.getElementById('numberingModal');

	document.getElementById('btnOpenNumbering')?.addEventListener('mousedown', (e) => {
        if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
        e.preventDefault(); 
    });
    
    // 1. 視窗開關
    document.getElementById('btnOpenNumbering')?.addEventListener('click', (e) => {
        e.stopPropagation();
        numberingModal.classList.remove('hidden');
        document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
        if (!numberingModal.style.left) {
            numberingModal.style.left = (window.innerWidth - numberingModal.offsetWidth) / 2 + 'px';
            numberingModal.style.top = (window.innerHeight - numberingModal.offsetHeight) * 0.4 + 'px';
        }
    });
    document.getElementById('btnCloseNumbering')?.addEventListener('click', () => {
        numberingModal.classList.add('hidden');
        if (currentMode === 'text') {
            document.getElementById('editor').focus();
        }
    });

    // 2. 視窗全區拖曳
    let isDraggingNum = false, dragStartXNum = 0, dragStartYNum = 0, numStartLeft = 0, numStartTop = 0;
    numberingModal.addEventListener('mousedown', (e) => {
        if (e.target.closest('input, select, button, label')) return; 
        
        if (!window.matchMedia || !window.matchMedia('(pointer: coarse)').matches) {
            e.preventDefault(); 
        }

        isDraggingNum = true; dragStartXNum = e.clientX; dragStartYNum = e.clientY;
        const rect = numberingModal.getBoundingClientRect();
        numStartLeft = rect.left; numStartTop = rect.top;
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDraggingNum) return;
        numberingModal.style.left = `${numStartLeft + (e.clientX - dragStartXNum)}px`;
        numberingModal.style.top = `${numStartTop + (e.clientY - dragStartYNum)}px`;
        numberingModal.style.transform = 'none';
    });
    document.addEventListener('mouseup', () => { isDraggingNum = false; document.body.style.userSelect = ''; });
    
    numberingModal.addEventListener('touchstart', (e) => {
        if (e.target.closest('input, select, button, label')) return; 
        const touch = e.touches[0];
        isDraggingNum = true; dragStartXNum = touch.clientX; dragStartYNum = touch.clientY;
        const rect = numberingModal.getBoundingClientRect();
        numStartLeft = rect.left; numStartTop = rect.top;
        if (!e.target.closest('input, select')) e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
        if (!isDraggingNum) return;
        const touch = e.touches[0];
        numberingModal.style.left = `${numStartLeft + (touch.clientX - dragStartXNum)}px`;
        numberingModal.style.top = `${numStartTop + (touch.clientY - dragStartYNum)}px`;
        numberingModal.style.transform = 'none';
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', () => { isDraggingNum = false; });


    // 當你在下拉選單選好選項，或是更改了輸入框的值之後，立刻把焦點還給編輯區，讓反白重新顯示
    document.querySelectorAll('#numberingModal select, #numberingModal input').forEach(el => {
        el.addEventListener('change', () => {
            if (currentMode === 'text') {
                document.getElementById('editor').focus();
            }
        });
    });

    // 3. 核心：編號產生引擎
    function getHanzi(num, isLarge) {
        const small = ['零','一','二','三','四','五','六','七','八','九','十','百','千'];
        const large = ['零','壹','貳','參','肆','伍','陸','柒','捌','玖','拾','佰','仟'];
        const m = isLarge ? large : small;
        if (num < 10) return m[num];
        if (num < 20) return (num === 10 ? m[10] : m[10] + m[num % 10]);
        if (num < 100) return m[Math.floor(num/10)] + m[10] + (num % 10 === 0 ? '' : m[num % 10]);
        if (num < 1000) return m[Math.floor(num/100)] + m[11] + (num % 100 === 0 ? '' : (num % 100 < 10 ? m[0] + m[num % 10] : getHanzi(num % 100, isLarge)));
        return num.toString(); // 大於 999 轉回數字
    }

    function generateNumberString(index, type, digits) {
        if (type === 'num' || type === '(num)') {
            let s = index.toString();
            if (digits > 1 && s.length < digits) s = s.padStart(digits, '0');
            return type === '(num)' ? `(${s})` : s;
        }
        if (type === 'A' || type === 'a' || type === 'Aa') {
            let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            if (type === 'a') chars = "abcdefghijklmnopqrstuvwxyz";
            else if (type === 'Aa') chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            let base = chars.length;
            let s = '';
            let temp = index;
            while (temp > 0) {
                let rem = (temp - 1) % base;
                s = chars[rem] + s;
                temp = Math.floor((temp - 1) / base);
            }
            return s;
        }
        if (type.startsWith('hz_') || type === '(hz_s)') {
            let s = getHanzi(index, type === 'hz_l');
            return type === '(hz_s)' ? `(${s})` : s;
        }
        return index.toString();
    }


    // 4. 取得輸入參數輔助函數
    function getFormatParams() {
        const sepMap = {'\\n': '\n', ' ': ' ', '\\t': '\t'};
        const sep = sepMap[document.getElementById('numSeparator').value];
        const type = document.getElementById('numType').value;
        const prefixRaw = document.getElementById('numPrefix').value;
        const suffixRaw = document.getElementById('numSuffix').value;
        const skip = document.getElementById('numSkip').value; 
        
        const getFix = (val) => val === '. ' ? '. ' : (val === '\\t' ? '\t' : val);
        const prefix = getFix(prefixRaw);
        const suffix = getFix(suffixRaw);
        
        const start = parseInt(document.getElementById('numStart').value) || 1;
        const digits = parseInt(document.getElementById('numDigits').value) || 1;

        return { sep, type, prefix, suffix, start, digits, skip };
    }

    // 5. 執行：加上編號
    document.getElementById('btnAddNumbering').addEventListener('click', () => {
        if (currentMode !== 'text') return showToast('⚠️ 編號功能目前僅支援文字模式');
        
        const { sep, type, prefix, suffix, start, digits, skip } = getFormatParams();
        const text = editor.value;
        const startPos = editor.selectionStart;
        const endPos = editor.selectionEnd;
        const hasSelection = startPos !== endPos;
        const targetText = hasSelection ? text.substring(startPos, endPos) : text;

        let index = start;
        const parts = targetText.split(sep);
        
        const newParts = parts.map(part => {
            const trimmed = part.trim();
            if (skip === 'empty' && (trimmed === '' || trimmed === '######' || trimmed === '#####' || trimmed === '------' || trimmed === '======')) {
                return part; // 直接返回原內容，且「不遞增」 index
            }
            
            const numStr = generateNumberString(index++, type, digits);
            return prefix + numStr + suffix + part;
        });

        const result = newParts.join(sep);
        if (hasSelection) editor.setRangeText(result, startPos, endPos, 'select');
        else editor.value = result;

        debouncedSaveHistory();
        updateLineNumbers();
        showToast('✅ 選取範圍已加上編號');
    });

    // 6. 執行：移除編號
    document.getElementById('btnRemoveNumbering').addEventListener('click', () => {
        if (currentMode !== 'text') return showToast('⚠️ 編號功能目前僅支援文字模式');
        
        const { sep } = getFormatParams();
        const text = editor.value;
        const startPos = editor.selectionStart;
        const endPos = editor.selectionEnd;
        const hasSelection = startPos !== endPos;
        const targetText = hasSelection ? text.substring(startPos, endPos) : text;

        // 智慧正則：匹配段落「最開頭」的 (各種前綴) + (數字/字母/漢字) + (各種後綴)
        const regex = /^[.\s\(\[\{【（〈\t]*(?:[0-9]+|[A-Za-z]+|[零一二三四五六七八九十百千壹貳參肆伍陸柒捌玖拾佰仟]+)[.\s\)\]\}】）〉、:\t]*/;
        
        const parts = targetText.split(sep);
        const newParts = parts.map(part => part.replace(regex, '')); // 清除頭部的編號特徵
        
        const result = newParts.join(sep);
        if (hasSelection) editor.setRangeText(result, startPos, endPos, 'select');
        else editor.value = result;

        debouncedSaveHistory();
        updateLineNumbers();
        showToast('🗑️ 選取範圍已移除編號');
    });
});


/* ==========================================
   拼音轉換工具模組
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    const btnOpenPinyin = document.getElementById('btnOpenPinyinTool');
    const modalPinyin = document.getElementById('floating-pinyin-tool');
    const dragHandlePinyin = document.getElementById('pinyin-drag-handle');
    const btnClosePinyin = document.getElementById('btnClosePinyinTool');
    const btnExecutePinyin = document.getElementById('btnExecutePinyin');

	// 拼音工具的選取狀態檢查引擎
    function checkPinyinButtonState() {
        if (!btnExecutePinyin) return;
        
        let hasSelection = false;
        if (typeof currentMode !== 'undefined') {
            if (currentMode === 'text') {
                const editor = document.getElementById('editor');
                if (editor) hasSelection = editor.selectionStart !== editor.selectionEnd;
            } else if (currentMode === 'table') {
                const sel = window.getSelection();
                if (sel && sel.toString().trim().length > 0) {
                    hasSelection = true;
                } else {
                    const hasMultiCells = document.querySelectorAll('#data-table td.sel-bg').length > 0;
                    const hasSingleCellOutline = document.querySelectorAll('#data-table td[style*="inset"]').length > 0;
                    const isEditing = document.activeElement && document.activeElement.classList.contains('td-inner');
                    
                    if (!isEditing && (hasMultiCells || hasSingleCellOutline)) {
                        hasSelection = true;
                    }
                }
            }
        }

        // 切換按鈕的視覺與點擊狀態
        if (!hasSelection) {
            btnExecutePinyin.disabled = true;
            btnExecutePinyin.classList.add('opacity-50', 'cursor-not-allowed');
            btnExecutePinyin.title = "請先選取要轉換的文字或儲存格";
        } else {
            btnExecutePinyin.disabled = false;
            btnExecutePinyin.classList.remove('opacity-50', 'cursor-not-allowed');
            btnExecutePinyin.title = "";
        }
    }

    // 綁定事件，確保隨時偵測選取狀態
    document.addEventListener('selectionchange', checkPinyinButtonState);
    document.addEventListener('mouseup', () => setTimeout(checkPinyinButtonState, 50));
    document.addEventListener('keyup', () => setTimeout(checkPinyinButtonState, 50));
    
    // 網頁載入時先執行一次，預設鎖定按鈕
    checkPinyinButtonState();

    // UI 元素
    const langBtn = document.querySelector('[data-id="pinyin-lang-btn"]');
    const sourceBtn = document.querySelector('[data-id="pinyin-source-btn"]');
    const targetBtn = document.querySelector('[data-id="pinyin-target-btn"]');
    const langList = document.getElementById('pinyin-lang-list');
    const sourceList = document.getElementById('pinyin-source-list');
    const targetList = document.getElementById('pinyin-target-list');

    let isPinyinScriptsLoaded = false;
    let pinyinParsedConfig = {}; 
    
    const PY_LANG_KEY = 'wesing-py-lang';
    const PY_SRC_KEY = 'wesing-py-src';
    const PY_TGT_KEY = 'wesing-py-tgt';

    let pinyinState = {
        lang: localStorage.getItem(PY_LANG_KEY) || 'kasu',
        source: localStorage.getItem(PY_SRC_KEY) || '',
        target: localStorage.getItem(PY_TGT_KEY) || ''
    };

    // 1. 動態載入腳本
    function loadPinyinScripts() {
        if (isPinyinScriptsLoaded) return Promise.resolve();
        return new Promise((resolve, reject) => {
            window.APP_ID = "tauhu_pinyin_tool"; 
            
            const script1 = document.createElement('script');
            script1.src = 'https://gnisew.github.io/tools/turn/pinyin2/data-pinyin2pinyin.js';
            
            const script2 = document.createElement('script');
            script2.src = 'https://gnisew.github.io/tools/turn/pinyin2/menu.js';
            
            script1.onload = () => document.head.appendChild(script2);
            script2.onload = () => {
                isPinyinScriptsLoaded = true;
                parsePinyinMenuConfig();
                resolve();
            };
            
            script1.onerror = reject;
            script2.onerror = reject;
            document.head.appendChild(script1);
        });
    }

    // 2. 解析配置與建立語言選單
    function parsePinyinMenuConfig() {
        if (typeof languageConfigs === 'undefined') {
            showToast('❌ 無法讀取拼音配置');
            return;
        }
        
        pinyinParsedConfig = {};
        langList.innerHTML = '';
        
        for (const [langId, langData] of Object.entries(languageConfigs)) {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.value = langId;
            item.textContent = langData.name;
            item.addEventListener('click', () => {
                pinyinState.lang = langId;
                langBtn.textContent = langData.name;
                localStorage.setItem(PY_LANG_KEY, langId);
                item.closest('.dropdown-list').classList.remove('show');
                updatePinyinSourceSelect();
                if (currentMode === 'text') editor.focus();
            });
            langList.appendChild(item);
            
            // 解析 TSV
            pinyinParsedConfig[langId] = {};
            const lines = langData.config.trim().split(/\n/).slice(1);
            lines.forEach(line => {
                const parts = line.split('\t').map(s => s.trim());
                if (parts.length >= 3) {
                    const [left, right, func] = parts;
                    if (!pinyinParsedConfig[langId][left]) pinyinParsedConfig[langId][left] = {};
                    pinyinParsedConfig[langId][left][right] = func;
                }
            });
        }
        
        if (!languageConfigs[pinyinState.lang]) pinyinState.lang = 'kasu';
        langBtn.textContent = languageConfigs[pinyinState.lang].name;
        
        updatePinyinSourceSelect();
    }

    // 3. 連動選單更新
    function updatePinyinSourceSelect() {
        const langId = pinyinState.lang;
        sourceList.innerHTML = '';
        if (!pinyinParsedConfig[langId]) return;
        
        const sources = Object.keys(pinyinParsedConfig[langId]);
        sources.forEach(s => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.value = s;
            item.textContent = s;
            item.addEventListener('click', () => {
                pinyinState.source = s;
                sourceBtn.textContent = s;
                localStorage.setItem(PY_SRC_KEY, s);
                item.closest('.dropdown-list').classList.remove('show');
                updatePinyinTargetSelect();
                if (currentMode === 'text') editor.focus();
            });
            sourceList.appendChild(item);
        });
        
        if (pinyinState.source && sources.includes(pinyinState.source)) {
            sourceBtn.textContent = pinyinState.source;
        } else if (sources.length > 0) {
            pinyinState.source = sources[0];
            sourceBtn.textContent = sources[0];
        } else {
            pinyinState.source = '';
            sourceBtn.textContent = '原拼音';
        }
        updatePinyinTargetSelect();
    }

    function updatePinyinTargetSelect() {
        const langId = pinyinState.lang;
        const sourceId = pinyinState.source;
        targetList.innerHTML = '';
        
        if (!pinyinParsedConfig[langId] || !pinyinParsedConfig[langId][sourceId]) {
            pinyinState.target = '';
            targetBtn.textContent = '新拼音';
            return;
        }
        
        const targets = Object.keys(pinyinParsedConfig[langId][sourceId]);
        targets.forEach(t => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.value = t;
            item.textContent = t;
            item.addEventListener('click', () => {
                pinyinState.target = t;
                targetBtn.textContent = t;
                localStorage.setItem(PY_TGT_KEY, t); // 🌟 記憶新拼音
                item.closest('.dropdown-list').classList.remove('show');
                if (currentMode === 'text') editor.focus();
            });
            targetList.appendChild(item);
        });
        
        if (pinyinState.target && targets.includes(pinyinState.target)) {
            targetBtn.textContent = pinyinState.target;
        } else if (targets.length > 0) {
            pinyinState.target = targets[0];
            targetBtn.textContent = targets[0];
        } else {
            pinyinState.target = '';
            targetBtn.textContent = '新拼音';
        }
    }

    // 4. 視窗開關與按鈕狀態
    function togglePinyinPanel() {
        const isHidden = modalPinyin.style.display === 'none' || modalPinyin.style.display === '';
        if (isHidden) {
            modalPinyin.style.display = 'flex';
            btnOpenPinyin?.classList.add('bg-green-100', 'text-green-700');
        } else {
            modalPinyin.style.display = 'none';
            btnOpenPinyin?.classList.remove('bg-green-100', 'text-green-700');
            if (currentMode === 'text') editor.focus();
        }
    }

    btnOpenPinyin?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (window.matchMedia && !window.matchMedia('(pointer: coarse)').matches) {
            e.preventDefault();
        }

        if (!isPinyinScriptsLoaded) {
            showToast('🔄 正在載入拼音轉換引擎...', 2000);
            try {
                await loadPinyinScripts();
            } catch (err) {
                showToast('❌ 載入拼音模組失敗', 3000);
                return;
            }
        }
        
        togglePinyinPanel();
    });

    btnClosePinyin?.addEventListener('click', togglePinyinPanel);

    // 5. 視窗拖曳功能
    let isDraggingPinyin = false, startX, startY, initialX, initialY;
    function startPinyinDrag(clientX, clientY) {
        isDraggingPinyin = true; startX = clientX; startY = clientY;
        const rect = modalPinyin.getBoundingClientRect(); initialX = rect.left; initialY = rect.top;
        modalPinyin.style.transform = 'none'; modalPinyin.style.left = `${initialX}px`; modalPinyin.style.top = `${initialY}px`;
        modalPinyin.style.bottom = 'auto'; modalPinyin.style.right = 'auto';
        document.body.style.userSelect = 'none';
    }
    function dragPinyin(clientX, clientY) { if (isDraggingPinyin) { modalPinyin.style.left = `${initialX + (clientX - startX)}px`; modalPinyin.style.top = `${initialY + (clientY - startY)}px`; } }
    function stopPinyinDrag() { isDraggingPinyin = false; document.body.style.userSelect = ''; }

    if (dragHandlePinyin) {
        dragHandlePinyin.addEventListener('mousedown', (e) => { startPinyinDrag(e.clientX, e.clientY); document.addEventListener('mousemove', onMouseMovePinyin); document.addEventListener('mouseup', onMouseUpPinyin); });
        dragHandlePinyin.addEventListener('touchstart', (e) => { startPinyinDrag(e.touches[0].clientX, e.touches[0].clientY); document.addEventListener('touchmove', onTouchMovePinyin, { passive: false }); document.addEventListener('touchend', onTouchEndPinyin); }, { passive: false });
    }
    function onMouseMovePinyin(e) { dragPinyin(e.clientX, e.clientY); }
    function onMouseUpPinyin() { stopPinyinDrag(); document.removeEventListener('mousemove', onMouseMovePinyin); document.removeEventListener('mouseup', onMouseUpPinyin); }
    function onTouchMovePinyin(e) { if (!isDraggingPinyin) return; e.preventDefault(); dragPinyin(e.touches[0].clientX, e.touches[0].clientY); }
    function onTouchEndPinyin() { stopPinyinDrag(); document.removeEventListener('touchmove', onTouchMovePinyin); document.removeEventListener('touchend', onTouchEndPinyin); }

    // 6. 執行轉換邏輯
    btnExecutePinyin?.addEventListener('click', () => {
        const langId = pinyinState.lang;
        const sourceId = pinyinState.source;
        const targetId = pinyinState.target;
        
        if (!langId || !sourceId || !targetId) return;
        
        const funcName = pinyinParsedConfig[langId][sourceId][targetId];
        if (!funcName || typeof window[funcName] !== 'function') {
            showToast('❌ 找不到對應的轉換函數');
            return;
        }

        try {
            if (currentMode === 'text') {
                const start = editor.selectionStart, end = editor.selectionEnd;
                let text = (start !== end) ? editor.value.substring(start, end) : editor.value;
                if (!text) { showToast('⚠️ 編輯區沒有文字'); return; }
                
                text = window[funcName](text);
                
                if (start !== end) editor.setRangeText(text, start, end, 'select'); 
                else editor.value = text;
            } 
            else if (currentMode === 'table') {
                const sel = window.getSelection();
                if (sel.toString().length > 0 && dataTable && dataTable.contains(sel.anchorNode)) {
                    let text = window[funcName](sel.toString());
                    const range = sel.getRangeAt(0); 
                    range.deleteContents(); 
                    range.insertNode(document.createTextNode(text));
                } else {
                    let selectedCells = Array.from(document.querySelectorAll('table#data-table td.sel-bg .td-inner'));
                    if (selectedCells.length === 0) {
                        let activeCell = document.activeElement.closest('.td-inner') || 
                            (document.activeElement.classList && document.activeElement.classList.contains('td-inner') ? document.activeElement : null);
                        if (!activeCell) {
                            const allTds = document.querySelectorAll('table#data-table td');
                            const singleSelectedTd = Array.from(allTds).find(td => td.style.boxShadow && td.style.boxShadow.includes('inset'));
                            if (singleSelectedTd) activeCell = singleSelectedTd.querySelector('.td-inner');
                        }
                        if (activeCell) selectedCells.push(activeCell);
                    }
                    
                    if (selectedCells.length === 0) { 
                        showToast("請先選取要處理的文字或儲存格！"); 
                        return; 
                    }
                    
                    for (const cell of selectedCells) {
                        let text = cell.innerText || cell.textContent;
                        cell.innerText = window[funcName](text);
                        if (cell.hasAttribute('data-formula')) cell.removeAttribute('data-formula');
                    }
                }
            }
            debouncedSaveHistory();
            showToast('✅ 拼音轉換完成！');
        } catch (err) {
            console.error("轉換發生錯誤:", err);
            showToast("❌ 轉換失敗，請檢查輸入內容", 3000);
        }
    });
});



// === 文字模式顯示行號切換邏輯 ===
const btnToggleLineNumbersTextMode = document.getElementById('btnToggleLineNumbersTextMode');
const iconTextLineNumbersCheck = document.getElementById('iconTextLineNumbersCheck');

function applyTextLineNumbersState() {
    if (isShowTextLineNumbers) {
        document.body.classList.remove('hide-text-line-numbers');
        if (iconTextLineNumbersCheck) iconTextLineNumbersCheck.classList.add('active');
    } else {
        document.body.classList.add('hide-text-line-numbers');
        if (iconTextLineNumbersCheck) iconTextLineNumbersCheck.classList.remove('active');
    }
}

if (btnToggleLineNumbersTextMode) {
    btnToggleLineNumbersTextMode.addEventListener('click', (e) => {
        e.stopPropagation(); // 讓選單保持開啟，方便連續操作
        isShowTextLineNumbers = !isShowTextLineNumbers;
        localStorage.setItem(SHOW_TEXT_LINE_NUMBERS_KEY, isShowTextLineNumbers);
        applyTextLineNumbersState();
        showToast(isShowTextLineNumbers ? '✅ 已顯示行號' : '❌ 已隱藏行號');
    });
}





/* ==========================================
   文字排版工具：分詞統計 模組
   ========================================== */
const wordStatsModal = document.getElementById('wordStatsModal');

// 1. 開啟與關閉對話框
document.getElementById('btnOpenWordStats')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentMode !== 'text') {
        showToast('⚠️ 分詞統計僅能在文字模式使用');
        return;
    }
    wordStatsModal.classList.remove('hidden');
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    centerModal(wordStatsModal);
});
document.getElementById('btnCloseWordStats')?.addEventListener('click', () => {
    wordStatsModal.classList.add('hidden');
});

// 2. 視窗全區拖曳 (桌機 + 手機)
let isDraggingWS = false, dragStartXWS = 0, dragStartYWS = 0, wsStartLeft = 0, wsStartTop = 0;
wordStatsModal.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, select, button, label')) return; 
    isDraggingWS = true; dragStartXWS = e.clientX; dragStartYWS = e.clientY;
    const rect = wordStatsModal.getBoundingClientRect();
    wsStartLeft = rect.left; wsStartTop = rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingWS) return;
    wordStatsModal.style.left = `${wsStartLeft + (e.clientX - dragStartXWS)}px`;
    wordStatsModal.style.top = `${wsStartTop + (e.clientY - dragStartYWS)}px`;
    wordStatsModal.style.transform = 'none';
});
document.addEventListener('mouseup', () => { isDraggingWS = false; document.body.style.userSelect = ''; });

wordStatsModal.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, select, button, label')) return; 
    const touch = e.touches[0];
    isDraggingWS = true; dragStartXWS = touch.clientX; dragStartYWS = touch.clientY;
    const rect = wordStatsModal.getBoundingClientRect();
    wsStartLeft = rect.left; wsStartTop = rect.top;
    if (!e.target.closest('select')) e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    if (!isDraggingWS) return;
    const touch = e.touches[0];
    wordStatsModal.style.left = `${wsStartLeft + (touch.clientX - dragStartXWS)}px`;
    wordStatsModal.style.top = `${wsStartTop + (touch.clientY - dragStartYWS)}px`;
    wordStatsModal.style.transform = 'none';
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { isDraggingWS = false; });

// 3. 核心邏輯：執行分詞統計
document.getElementById('btnApplyWordStats')?.addEventListener('click', () => {
    if (currentMode !== 'text') return showToast('⚠️ 僅能在文字模式使用');

    const sepMode = document.getElementById('wsSeparator').value;
    const showCount = document.getElementById('wsShowCount').value === 'yes';
    const sortMode = document.getElementById('wsSort').value;
    const filterMode = document.getElementById('wsFilter').value;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const hasSelection = start !== end;
    
    // 如果有選取則統計選取範圍，否則統計全文
    let textToProcess = hasSelection ? editor.value.substring(start, end) : editor.value;

    if (!textToProcess.trim()) return showToast('⚠️ 沒有文字可供統計');

    // (1) 文字篩選：使用 u 旗標配合 Unicode 特性來排除標點符號與符號
    if (filterMode === 'no_punct') {
        textToProcess = textToProcess.replace(/[\p{P}\p{S}]/gu, '');
    }

    // (2) 執行分詞
    let tokens = [];
    if (sepMode === 'char') {
        // 使用展開運算子 [...] 可完美處理含有代理對 (Surrogate Pairs) 的擴充漢字
        tokens = [...textToProcess].filter(t => !/^\s$/.test(t)); // 預設排除純空白字元
    } else if (sepMode === '_') {
        tokens = textToProcess.split(/[_\n\r]+/).map(t => t.trim()).filter(t => t !== '');
    } else {
        // 空格分詞 (預設，\s 已經包含換行與空格)
        tokens = textToProcess.split(/\s+/).filter(t => t !== '');
    }

    if (tokens.length === 0) return showToast('⚠️ 沒有可統計的詞彙');

    // (3) 統計次數並記錄初次出現的順序
    const counts = new Map();
    const firstAppearance = new Map();

    tokens.forEach((token, idx) => {
        counts.set(token, (counts.get(token) || 0) + 1);
        if (!firstAppearance.has(token)) {
            firstAppearance.set(token, idx);
        }
    });

    // (4) 進行排序
    let uniqueTokens = Array.from(counts.keys());
    uniqueTokens.sort((a, b) => {
        if (sortMode === 'desc') {
            const diff = counts.get(b) - counts.get(a);
            return diff !== 0 ? diff : firstAppearance.get(a) - firstAppearance.get(b);
        } else if (sortMode === 'asc') {
            const diff = counts.get(a) - counts.get(b);
            return diff !== 0 ? diff : firstAppearance.get(a) - firstAppearance.get(b);
        } else { // orig
            return firstAppearance.get(a) - firstAppearance.get(b);
        }
    });

    // (5) 格式化結果字串
    const resultLines = uniqueTokens.map(token => {
        if (showCount) {
            return `${counts.get(token)}\t${token}`;
        } else {
            return token;
        }
    });

    const newText = resultLines.join('\n');

    // (6) 輸出至編輯器
    if (hasSelection) {
        editor.setRangeText(newText, start, end, 'select');
    } else {
        editor.value = newText;
    }

    // 觸發全域更新與存檔
    updateLineNumbers();
    localStorage.setItem(STORAGE_KEY, editor.value);
    debouncedSaveHistory();
    if (typeof updateWordCountWidget === 'function') updateWordCountWidget();

    wordStatsModal.classList.add('hidden');
    showToast('✅ 分詞統計已完成');
});




/* ==========================================
   線上輸入法：啟動與開關控制引擎
   ========================================== */

document.addEventListener('click', (e) => {
    // 攔截擁有 ime-toggle-button 類別的按鈕
    const btn = e.target.closest('.ime-toggle-button');
    if (!btn) return;
    
    e.preventDefault();
    
    // 檢查 HTML 是否有正確載入 WebIME
    if (typeof WebIME !== 'undefined') {
        
        // 如果尚未初始化，進行初始化並強制開啟
        if (!WebIME.isInitialized) {
            WebIME.imeInit({});
            if (typeof WebIME.imeSetIsEnabled === 'function') {
                WebIME.imeSetIsEnabled(true);
            }
            btn.classList.add('ime-active');
            showToast('✅ 輸入法已開啟！');
        } 
        // 如果已經初始化過了，則執行關閉 (Destroy) 
        else {
            if (typeof WebIME.imeDestroy === 'function') {
                WebIME.imeDestroy();
            } else if (typeof WebIME.imeSetIsEnabled === 'function') {
                WebIME.imeSetIsEnabled(false);
            }
            btn.classList.remove('ime-active');
            showToast('❌ 輸入法已關閉');
        }

        // 強制將游標對焦到目前的編輯器，藉此喚醒工具列
        setTimeout(() => {
            if (currentMode === 'text') {
                const editor = document.getElementById('editor');
                if (editor) editor.focus();
            } else if (currentMode === 'table') {
                const activeInner = document.querySelector('td.sel-bg .td-inner') || document.querySelector('.td-inner');
                if (activeInner) activeInner.focus();
            }
        }, 100);

    } else {
        showToast('⚠️ 輸入法核心未載入，請確認 HTML 標籤。');
    }
});


// 處理網址參數自動啟動 (支援分享設定網址)
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('ime')) {
        const imeParam = params.get('ime');
        const parts = imeParam.split('-');
        
        if (parts[0] === '0') {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('ime');
            window.history.replaceState({}, document.title, newUrl.href);
            return;
        }

        // 解析設定碼
        const configFromUrl = { features: {} };
        if (parts.length === 3) {
            configFromUrl.defaultMode = parts[1];
            const settingsCode = parts[2];
            const f = configFromUrl.features;
            if (settingsCode.length >= 1) f.singleCharMode = (settingsCode[0] === '1');
            if (settingsCode.length >= 2) f.prediction = (settingsCode[1] === '1');
            if (settingsCode.length >= 3) f.numericTone = (settingsCode[2] === '1');
            if (settingsCode.length >= 4) f.longPhrase = (settingsCode[3] === '1');
            if (settingsCode.length >= 5) f.fullWidthPunctuation = (settingsCode[4] === '1');
            if (settingsCode.length >= 6) f.outputEnabled = (settingsCode[5] === '1');
            if (settingsCode.length >= 7) {
                switch(settingsCode[6]) { 
                    case '1': f.outputMode = 'pinyin_mode'; break;
                    case '2': f.outputMode = 'pinyin'; break;
                    case '3': f.outputMode = 'word_pinyin'; break;
                    case '4': f.outputMode = 'word_pinyin2'; break;
                }
            }
        }

        // 一進網頁發現有參數，立刻觸發動態載入
        initOnlineIme(configFromUrl).then(() => {
            if (parts[0] === '1') WebIME.imeSetIsEnabled(true);
            else if (parts[0] === '2') WebIME.imeSetIsEnabled(false);
            
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('ime');
            window.history.replaceState({}, document.title, newUrl.href);
        });
    }
});




/* ==========================================
   多頁籤
========================================== */
const sheetTabContainer = document.getElementById('sheetTabContainer');
const btnAddSheet = document.getElementById('btnAddSheet');

// 載入或初始化頁籤資料
function loadTabsData() {
    try {
        const savedData = localStorage.getItem(TABS_DATA_KEY);
        if (savedData) {
            sheetTabs = JSON.parse(savedData);
            // 確保舊資料擁有 mode 屬性
            sheetTabs.forEach(tab => tab.mode = tab.mode || 'text');
            activeSheetIndex = parseInt(localStorage.getItem(ACTIVE_TAB_KEY)) || 0;
            if (activeSheetIndex >= sheetTabs.length) activeSheetIndex = 0;
        } else {
            const oldContent = localStorage.getItem(STORAGE_KEY) || '';
            sheetTabs = [{ name: '工作表1', content: oldContent, history: [oldContent], mode: currentMode }];
            activeSheetIndex = 0;
        }
    } catch (e) {
        sheetTabs = [{ name: '工作表1', content: '', history: [], mode: 'text' }];
        activeSheetIndex = 0;
    }
    
    if (!sheetTabs[activeSheetIndex].history) {
        sheetTabs[activeSheetIndex].history = [sheetTabs[activeSheetIndex].content];
    }
    historyStack = sheetTabs[activeSheetIndex].history;
    
    // 載入時，強制將全域模式切換為當前頁籤的專屬模式
    currentMode = sheetTabs[activeSheetIndex].mode || 'text';
    localStorage.setItem(MODE_KEY, currentMode);
}

// 儲存所有頁籤資料至 localStorage
function saveAllTabsData() {
    let currentContent = editor.value;
    if (currentMode === 'table') {
        currentContent = extractTextFromTable();
    } else if (currentMode === 'chat') {
        currentContent = typeof extractTextFromChat === 'function' ? extractTextFromChat() : editor.value;
    }

    sheetTabs[activeSheetIndex].content = currentContent;
    sheetTabs[activeSheetIndex].history = historyStack;
    sheetTabs[activeSheetIndex].mode = currentMode; // 記錄該頁籤當前的獨立模式

    localStorage.setItem(TABS_DATA_KEY, JSON.stringify(sheetTabs));
    localStorage.setItem(ACTIVE_TAB_KEY, activeSheetIndex);
}

// 渲染頁籤列
function renderSheetTabs() {
    sheetTabContainer.innerHTML = '';
    sheetTabs.forEach((tab, index) => {
        const tabEl = document.createElement('div');
        tabEl.className = `sheet-tab ${index === activeSheetIndex ? 'active' : ''}`;
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = tab.name;
        tabEl.appendChild(nameSpan);

        if (index === activeSheetIndex) {
            const menuBtn = document.createElement('span');
            menuBtn.className = 'material-symbols-outlined text-[16px] hover:text-gray-800 ml-1 tab-menu-btn';
            menuBtn.textContent = 'arrow_drop_down';
            
            menuBtn.onclick = (e) => {
                e.stopPropagation();
                // 關閉其他可能開啟的右鍵選單
                document.querySelectorAll('.context-menu').forEach(m => m.classList.remove('show'));
                
                const tabMenu = document.getElementById('tabMenu');
                const rect = menuBtn.getBoundingClientRect();
                
                tabMenu.classList.add('show');
                tabMenu.style.left = `${rect.left}px`;
                
                // 判斷：按鈕底部 + 選單真實高度，是否會大於螢幕總高度？
                if (rect.bottom + tabMenu.offsetHeight > window.innerHeight) {
                    // 如果會超出底部 ➔ 向上展開
                    tabMenu.style.top = 'auto'; // 清除 top 限制
                    // 利用 bottom 屬性，把選單底部精準釘在「按鈕頂部」的上方 5px 處
                    tabMenu.style.bottom = `${window.innerHeight - rect.top + 5}px`; 
                } else {
                    // 如果下方空間足夠 ➔ 向下展開
                    tabMenu.style.bottom = 'auto'; // 清除 bottom 限制
                    tabMenu.style.top = `${rect.bottom + 5}px`;
                }
                
                window.activeTabMenuIndex = index; // 記錄目前操作的是哪個頁籤
            };
            tabEl.appendChild(menuBtn);
        }

        tabEl.addEventListener('click', () => switchSheet(index));
        tabEl.addEventListener('dblclick', (e) => { e.stopPropagation(); renameTab(index); });
        sheetTabContainer.appendChild(tabEl);
    });
}

// 重新命名邏輯封裝
function renameTab(index) {
    const tabEl = sheetTabContainer.children[index];
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'sheet-rename-input';
    input.value = sheetTabs[index].name;
    tabEl.innerHTML = '';
    tabEl.appendChild(input);
    input.focus();
    input.select();

    const finishRename = () => {
        const newName = input.value.trim() || `工作表${index + 1}`;
        sheetTabs[index].name = newName;
        saveAllTabsData();
        renderSheetTabs();
    };
    input.addEventListener('blur', finishRename);
    input.addEventListener('keydown', (ek) => { if (ek.key === 'Enter') input.blur(); });
}

// 頁籤專屬選單操作邏輯
// 頁籤專屬選單操作邏輯
document.getElementById('tabMenu')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    const idx = window.activeTabMenuIndex;
    
    if (idx !== activeSheetIndex) switchSheet(idx); // 確保作用於正確頁籤
    
    // 🌟 新增對話模式，並更新判斷邏輯
    if (action === 'mode-chat') {
        switchMode('chat');
        saveAllTabsData();
    } else if (action === 'mode-table') {
        switchMode('table');
        saveAllTabsData();
    } else if (action === 'mode-text') {
        switchMode('text');
        saveAllTabsData();
    } else if (action === 'rename') {
        renameTab(idx);
    } else if (action === 'move-left') {
        if (idx > 0) {
            const temp = sheetTabs[idx];
            sheetTabs[idx] = sheetTabs[idx - 1];
            sheetTabs[idx - 1] = temp;
            activeSheetIndex = idx - 1;
            saveAllTabsData(); renderSheetTabs();
        }
    } else if (action === 'move-right') {
        if (idx < sheetTabs.length - 1) {
            const temp = sheetTabs[idx];
            sheetTabs[idx] = sheetTabs[idx + 1];
            sheetTabs[idx + 1] = temp;
            activeSheetIndex = idx + 1;
            saveAllTabsData(); renderSheetTabs();
        }
    } else if (action === 'duplicate') {
        saveAllTabsData();
        const clone = JSON.parse(JSON.stringify(sheetTabs[idx])); // 深度複製
        clone.name = clone.name + ' (複製)';
        sheetTabs.splice(idx + 1, 0, clone);
        switchSheet(idx + 1);
    } else if (action === 'delete') {
        deleteSheet(idx);
    }
    
    document.getElementById('tabMenu').classList.remove('show');
});

// 切換工作表
function switchSheet(index) {
    if (index === activeSheetIndex) return;

    saveAllTabsData(); // 先存檔舊的
    activeSheetIndex = index;
    
    const newTab = sheetTabs[activeSheetIndex];
    if (!newTab.history) newTab.history = [newTab.content];
    historyStack = newTab.history;
    
    // 載入新分頁內容至 textarea (做為中介)
    editor.value = newTab.content;
    
    // 強制執行模式切換與 UI 渲染 (傳入 true)
    switchMode(newTab.mode || 'text', true);

    saveAllTabsData();
    renderSheetTabs();   
}

// 刪除工作表
function deleteSheet(index) {
    if (sheetTabs.length <= 1) {
        return showToast('⚠️ 至少需保留一個工作表');
    }
    showConfirm('刪除工作表', `確定要刪除「${sheetTabs[index].name}」嗎？此操作無法復原。`, () => {
        sheetTabs.splice(index, 1);
        if (activeSheetIndex >= sheetTabs.length) {
            activeSheetIndex = Math.max(0, sheetTabs.length - 1);
        }
        
        const newTab = sheetTabs[activeSheetIndex];
        historyStack = newTab.history;
        editor.value = newTab.content;

        // 強制執行模式切換與 UI 渲染
        switchMode(newTab.mode || 'text', true);
        
        saveAllTabsData();
        renderSheetTabs();
        showToast('🗑️ 工作表已刪除');
    });
}

// 新增工作表
btnAddSheet?.addEventListener('click', () => {
    saveAllTabsData();
    const newName = `工作表${sheetTabs.length + 1}`;
    // 預設新建頁籤為文字模式
    sheetTabs.push({ name: newName, content: '', history: [''], mode: 'text' });
    switchSheet(sheetTabs.length - 1);
});


/* ==========================================
   檔案管理模組 (開啟檔案與儲存檔案)
========================================== */
const fileInput = document.getElementById('fileInput');

// 開啟檔案
document.getElementById('btnOpenFile')?.addEventListener('click', () => {
    fileInput.click();
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
});

fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const content = event.target.result;
        
        // 將內容寫入編輯器，並更新頁籤名稱
        editor.value = content;
        sheetTabs[activeSheetIndex].name = file.name;
        
        // 智慧判斷：如果是 .csv 結尾，自動切換至表格模式，否則切換為文字模式
        const extension = file.name.split('.').pop().toLowerCase();
        const targetMode = extension === 'csv' ? 'table' : 'text';
        
        switchMode(targetMode, true);
        
        saveAllTabsData();
        renderSheetTabs();
        showToast(`📂 已開啟檔案：${file.name}`);
        
        // 清空 input 值，讓下次選同一個檔案也能觸發 change 事件
        fileInput.value = '';
    };
    reader.onerror = () => {
        showToast('❌ 檔案讀取失敗');
    };
    reader.readAsText(file);
});

// 儲存檔案
document.getElementById('btnSaveFile')?.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    
    const currentContent = currentMode === 'text' ? editor.value : extractTextFromTable();
    if (!currentContent) {
        return showToast('⚠️ 沒有內容可以儲存');
    }

    const currentTabName = sheetTabs[activeSheetIndex].name;
    const defaultExt = currentMode === 'table' ? '.csv' : '.txt';
    const defaultFilename = currentTabName.includes('.') ? currentTabName : currentTabName + defaultExt;

    // 呼叫內建的自訂 Prompt 詢問檔名
    showPrompt('儲存檔案', defaultFilename, (filename) => {
        if (!filename) return;
        
        let blobContent = currentContent;
        
        // 如果是儲存為 CSV，我們需要把 TSV 的 Tab 轉為逗號，並加上 UTF-8 BOM 以防 Excel 亂碼
        if (filename.toLowerCase().endsWith('.csv') && currentMode === 'table') {
            const rows = currentContent.split('\n');
            const csvRows = rows.map(row => {
                return row.split('\t').map(cell => {
                    // 若內容包含逗號、換行或引號，需用雙引號包覆並跳脫
                    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                        return '"' + cell.replace(/"/g, '""') + '"';
                    }
                    return cell;
                }).join(',');
            });
            blobContent = '\uFEFF' + csvRows.join('\n'); // \uFEFF 是 BOM
        }

        // 觸發下載
        const blob = new Blob([blobContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast(`💾 檔案已儲存：${filename}`);
    });
});

/* ==========================================
   表格欄位名稱管理工具 (首列設欄名 / 移除欄名)
   ========================================== */

// 1. 首列設欄名邏輯
document.getElementById('btnSetFirstRowAsHeader')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const tbody = dataTable.querySelector('tbody');
    if (!tbody || !tbody.children[0]) {
        showToast('⚠️ 表格內沒有資料');
        return;
    }

    // 取得第一列的所有儲存格內容
    const firstRow = tbody.children[0];
    const cells = firstRow.querySelectorAll('.td-inner');
    const theadThs = dataTable.querySelectorAll('thead th');

    // 將內容填入 Th 的 dataset 中 (略過第 0 欄的序號欄)
    cells.forEach((cell, i) => {
        const targetTh = theadThs[i + 1];
        if (targetTh) {
            const name = cell.innerText.trim();
            targetTh.dataset.colName = name;
        }
    });

    // 更新介面顯示並儲存設定
    updateTableHeaders();
    saveColNames();
    debouncedSaveHistory();
    
    // 自動關閉選單
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    showToast('✅ 已將首列內容設為欄位名稱');
});

// 2. 移除欄名邏輯
document.getElementById('btnRemoveAllHeaderNames')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const theadThs = dataTable.querySelectorAll('thead th');

    // 清除所有自訂名稱 (略過序號欄)
    for (let i = 1; i < theadThs.length; i++) {
        theadThs[i].dataset.colName = '';
    }

    updateTableHeaders();
    saveColNames();
    debouncedSaveHistory();

    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    showToast('🗑️ 已移除所有自訂欄位名稱');
});





init();