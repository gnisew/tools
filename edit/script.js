// ==========================================
// script.js — 核心：Firebase、全域狀態、觸控、網址參數、模式切換、分頁、檔案、Zen、分享、行動版介面
// （由原 script.js 拆分而來；於 index.html 中依序載入）
// ==========================================


// ==========================================
// Firebase Firestore 雲端資料庫設定
// ==========================================

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAuXpz1xu9whyIbtpFUP9_DbyQDAvdTuVY",
    authDomain: "wesing-editor.firebaseapp.com",
    projectId: "wesing-editor",
    storageBucket: "wesing-editor.firebasestorage.app",
    messagingSenderId: "1055094283651",
    appId: "1:1055094283651:web:75c96be4540073d081eab6",
    measurementId: "G-BNK2JP5HE5"
  };

	/*
	const firebaseConfig = {
	  apiKey: "AIzaSyAa-xAVmHlO_anFgB_SxGKZaTbZ0gq4Bns",
	  authDomain: "wesing-editor02.firebaseapp.com",
	  projectId: "wesing-editor02",
	  storageBucket: "wesing-editor02.firebasestorage.app",
	  messagingSenderId: "1094145877566",
	  appId: "1:1094145877566:web:c6056ecc77b83206a0d36f",
	  measurementId: "G-7YZLD07X8R"
	};
	*/

// Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();
  const googleProvider = new firebase.auth.GoogleAuthProvider();

	// 監聽登入狀態，控制按鈕顯示/隱藏
  auth.onAuthStateChanged((user) => {
      const adminElements = document.querySelectorAll('.admin-only');
      if (user) {
          // 將使用者的信箱轉為 Base64，與我們加密後的字串做比對
          // 'uioiu9420@gmail.com' 的 Base64 是 'dWlvaXU5NDIwQGdtYWlsLmNvbQ=='
          if (btoa(user.email) === 'dWlvaXU5NDIwQGdtYWlsLmNvbQ==') {
              adminElements.forEach(el => el.classList.remove('hidden'));
          } else {
              adminElements.forEach(el => el.classList.add('hidden'));
          }
      } else {
          // 未登入時隱藏
          adminElements.forEach(el => el.classList.add('hidden'));
      }
  });


let isAutoSaveEnabled = true; // 控制自動儲存是否啟用的旗標
let autoSaveTimeout = null;   // 用來存放防抖計時器的變數

const textModeContainer = document.getElementById('textModeContainer');
const gameModes = ['flashcard', 'matching', 'quiz', 'sorting', 'typing', 'choice', 'arena', 'live'];
window.currentLoadedBank = null;
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
const EDIT_TRIGGER_KEY = 'wesing-edit-trigger';

const FONT_FAMILY_KEY = 'wesing-font-family';

// 讀取記憶設定 (預設為 Excel 的點兩下)
let currentEditTrigger = localStorage.getItem(EDIT_TRIGGER_KEY) || 'double';


// ==========================================
// 觸控防誤觸機制
// ==========================================
if (typeof window.lastGlobalTouchTime === 'undefined') {
    window.lastGlobalTouchTime = 0;
    // 只要手指碰到螢幕，就記錄當下時間
    document.addEventListener('touchstart', () => { 
        window.lastGlobalTouchTime = Date.now(); 
    }, { passive: true, capture: true });
}


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

    // 2. 處理子選單
    document.querySelectorAll('.group\\/submenu').forEach(submenu => {
        const header = submenu.querySelector('div:first-child');
        if (header) {
            header.addEventListener('click', (e) => {
                e.stopPropagation(); 
                
                if (window.innerWidth <= 768) {
                    const parentMenu = submenu.closest('.dropdown-menu');
                    if (parentMenu) {
                        parentMenu.querySelectorAll('.group\\/submenu').forEach(s => {
                            if (s !== submenu) s.classList.remove('mobile-open');
                        });
                    }
                    submenu.classList.toggle('mobile-open');

                    if (submenu.classList.contains('mobile-open') && parentMenu) {
                        setTimeout(() => {
                            parentMenu.scrollTo({ 
                                top: submenu.offsetTop - 10,
                                behavior: 'smooth' 
                            });
                        }, 50); 
                    }
                }
            });
        }
    });

    // 3. 處理所有點擊選項
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const parentDataContainer = item.closest('[id^="dd-"]');
            
            if (parentDataContainer && item.hasAttribute('data-value')) {
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

/* 手機版「更多」選單：開啟時同步各項目狀態，點選時轉交給原本(被隱藏)的按鈕執行 */
function initMobileMoreMenu() {
    const root = document.getElementById('dd-mobileMore');
    if (!root) return;
    const btn = root.querySelector('.dropdown-btn');
    const menu = root.querySelector('.dropdown-menu');
    if (!btn || !menu) return;

    // 開啟選單時：依目前模式顯示/隱藏、啟用/停用各項目
    function refresh() {
        // 跟隨原按鈕的顯示狀態（例如對話模式會隱藏「尋找取代」「剪貼簿」）
        menu.querySelectorAll('[data-follow]').forEach(el => {
            const src = document.getElementById(el.dataset.follow);
            el.classList.toggle('hidden', !!src && src.classList.contains('hidden'));
        });

        // 「貼上為值」「刪除結構」僅表格模式可用（與原本電腦版邏輯一致）
        const isTable = (currentMode === 'table');
        const origPasteValue = document.getElementById('btn-paste-value');
        const origDeleteStructure = document.getElementById('btn-delete-structure');
        if (origPasteValue) origPasteValue.disabled = !isTable;
        if (origDeleteStructure) origDeleteStructure.disabled = !isTable;
        const mPaste = menu.querySelector('[data-mobile-paste-value]');
        const mDelete = menu.querySelector('[data-mobile-delete-structure]');
        if (mPaste) { mPaste.disabled = !isTable; mPaste.title = isTable ? '貼上純文字並清除公式' : '僅在表格模式可用'; }
        if (mDelete) { mDelete.disabled = !isTable; mDelete.title = isTable ? '刪除選取的列或欄結構' : '僅在表格模式可用'; }
    }
    btn.addEventListener('click', refresh);

    // 點選項目：有 data-proxy 的，轉交給原本的按鈕 (原按鈕被 CSS 隱藏，但仍可 .click())
    menu.addEventListener('click', (e) => {
        const item = e.target.closest('[data-proxy]');
        if (!item || item.disabled) return;
        const target = document.querySelector(item.dataset.proxy);
        if (target) target.click();
        // 選單由 document 的「點擊空白處關閉」邏輯自動收起
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

    setDropdownValue('dd-editTrigger', currentEditTrigger);
    const triggerIconMap = { 'double': 'mouse', 'single': 'touch_app' };
    if (document.getElementById('editTriggerIcon')) {
        document.getElementById('editTriggerIcon').textContent = triggerIconMap[currentEditTrigger];
    }


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
    if (!container) return;

    container.querySelectorAll('.dropdown-item').forEach(item => {
        // 先尋找按鈕內是否有 check-icon
        const checkIcon = item.querySelector('.check-icon');
        
        // 只有當 checkIcon 確實存在時，才執行 classList 的切換
        if (checkIcon) {
            checkIcon.classList.toggle('active', item.dataset.value === value);
        }
    });
}

/* 系統初始化與記憶設定讀取 */
function init() {
    initDropdowns();
    initMobileMoreMenu();
	// 綁定退出遊戲的按鈕
    const btnExitGame = document.getElementById('btnExitGame');
    if (btnExitGame) {
        btnExitGame.addEventListener('click', () => {
            // ✨ 採用您的「簡單規則」：優先檢查網址是否有 bank 參數
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('bank')) {
                switchMode('bank');
            } else {
                // 如果沒有題庫參數，則回歸原本的來源記憶或預設回表格
                const targetMode = window.originModeForGame || 'table';
                switchMode(targetMode); 
            }
        });
    }
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

    loadTabsData();
    renderSheetTabs();
    
    // 載入當前作用中的頁籤內容
    editor.value = sheetTabs[activeSheetIndex].content;
    // 讀取網址參數
    const urlParams = new URLSearchParams(window.location.search);
    let initialTargetMode = currentMode; 
    let hasBankAutoLoaded = false; 

    // ✨ 1. 優先處理題庫直接載入 (?bank=xxx)
    if (urlParams.has('bank') && window.presetBank) {
        const bankId = urlParams.get('bank');
        const bankIdx = window.presetBank.findIndex(p => p.id === bankId);
        
        if (bankIdx !== -1) {
            // 抓取網址上的目標模式 (例如 mode=sorting)
            let forcedMode = null;
            const urlModeParam = urlParams.get('mode');
            if (urlModeParam && urlModeParam !== 'bank') {
                forcedMode = urlModeParam === 'sheet' ? 'table' : (urlModeParam === 'txt' ? 'text' : urlModeParam);
            }
            
            // ✨ 將網址上的目標模式一併傳給題庫引擎
            playPresetBank(bankIdx, forcedMode); 
            hasBankAutoLoaded = true;
        }
    }

    // ✨ 2. 若沒載入題庫，才執行原有的 mode 切換邏輯
    if (!hasBankAutoLoaded) {
        if (urlParams.has('arena')) {
            initialTargetMode = 'arena';
        } else if (urlParams.has('live')) {
            initialTargetMode = 'live';
        } else if (urlParams.has('mode')) {
            const modeParam = urlParams.get('mode');
            if (modeParam === 'txt') initialTargetMode = 'text';
            else if (modeParam === 'sheet') initialTargetMode = 'table';
            else if (modeParam === 'chat') initialTargetMode = 'chat';
            else if (modeParam === 'bank') initialTargetMode = 'bank';
            else if (gameModes.includes(modeParam)) initialTargetMode = modeParam;
        }
        
        switchMode(initialTargetMode, true);
    }

    // ✨ 優先判斷是否有 arena 空間代碼 (解決被踢出或重整跑掉的問題)
    if (urlParams.has('arena')) {
        initialTargetMode = 'arena';
    } else if (urlParams.has('live')) {
        initialTargetMode = 'live';
    } else if (urlParams.has('mode')) {
        const modeParam = urlParams.get('mode');
        if (modeParam === 'txt') initialTargetMode = 'text';
        else if (modeParam === 'sheet') initialTargetMode = 'table';
        else if (modeParam === 'chat') initialTargetMode = 'chat';
		else if (modeParam === 'bank') initialTargetMode = 'bank';
        else if (gameModes.includes(modeParam)) initialTargetMode = modeParam;

        if (!gameModes.includes(initialTargetMode) && initialTargetMode !== 'arena') {
            sheetTabs[activeSheetIndex].mode = initialTargetMode;
            currentMode = initialTargetMode;
        }
    }
    
    switchMode(initialTargetMode, true);
    
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




	// ==========================================
    // 網址載入壓縮資料 (fflate) 讀取邏輯
    // ==========================================
    // ==========================================
    // 網址載入 Firebase 雲端資料邏輯
    // ==========================================
    if (urlParams.has('id')) {
        const docId = urlParams.get('id');
        showToast('⏳ 正在從雲端載入資料...');

        // ✨ 雲端資料載入期間，遊戲區顯示「載入中…」，避免閃現「沒有有效資料」警告
        const isGameTarget = gameModes.includes(currentMode);
        const setGameAreaMessage = (icon, text, spin) => {
            const area = document.getElementById('game-content-area');
            if (!area) return;
            area.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-gray-500 mt-20">
                <span class="material-symbols-outlined text-5xl mb-3 ${spin ? 'animate-spin' : ''}">${icon}</span>
                <p class="font-bold">${text}</p>
            </div>`;
        };
        if (isGameTarget) setGameAreaMessage('progress_activity', '載入中…', true);
        
        // 因為是 async，我們用一個 IIFE (立即執行函式) 包起來
        (async () => {
            try {
                const compressedData = await loadFromFirebase(docId);
                if (!compressedData) {
                    if (isGameTarget) setGameAreaMessage('error', '雲端資料不存在或已失效', false);
                    return showToast('❌ 雲端資料不存在或已失效');
                }

                const decompressedText = decompressDataFromUrl(compressedData);
                if (decompressedText !== null) {
                    editor.value = decompressedText;
                    if (sheetTabs[activeSheetIndex]) sheetTabs[activeSheetIndex].content = decompressedText;
                    
                    if (currentMode === 'table') {
                        renderTableFromText(decompressedText);
                        applyFreeze();
                    } else if (currentMode === 'chat' && typeof window.renderChatFromText === 'function') {
                        window.renderChatFromText(decompressedText);
                    } else if (gameModes.includes(currentMode) || currentMode === 'arena' || currentMode === 'live') {
                        // ✨ 修正：分享網址直接進入遊戲模式時，init() 會先用「空資料」啟動遊戲，
                        // 導致畫面停在「表格內似乎沒有有效資料喔！」。
                        // 雲端資料載入完成後，必須用新資料重新啟動遊戲畫面。
                        window.originModeForGame = 'table';
                        switchMode(currentMode, true, decompressedText);
                    }
                    
                    debouncedSaveHistory();
                    saveAllTabsData();
                    
                    // 記住這份內容對應的雲端 id，之後再分享時沿用，不會重複寫入 Firebase
                    if (typeof rememberSharedId === 'function') rememberSharedId(decompressedText, docId);
                    
                    // 清理網址上的 ?id= 參數
                    const cleanUrl = new URL(window.location.href);
                    cleanUrl.searchParams.delete('id');
                    window.history.replaceState({}, document.title, cleanUrl.href);
                    
                    showToast('✅ 已成功從雲端載入資料！');
                }
            } catch (e) {
                console.error('雲端載入或解壓縮失敗:', e);
                if (isGameTarget) setGameAreaMessage('error', '資料解析失敗，可能已損毀', false);
                showToast('❌ 資料解析失敗，可能已損毀');
            }
        })();
    }



	requestAnimationFrame(() => {
			mainContainer.style.opacity = '1';
	});
}

document.getElementById('dd-viewMode').addEventListener('change', (e) => switchMode(e.detail.value));

/* ==========================================
   網址參數同步功能
========================================== */
/* ==========================================
   網址參數同步功能 (升級版：支援題庫 ID 同步)
========================================== */
function updateUrlModeParam(internalMode) {
    const newUrl = new URL(window.location.href);
    
    if (newUrl.searchParams.has('arena') || newUrl.searchParams.has('live')) {
        newUrl.searchParams.delete('mode');
        window.history.replaceState({}, '', newUrl);
        return;
    }

    let urlMode = 'txt';
    if (internalMode === 'table') urlMode = 'sheet';
    else if (internalMode === 'chat') urlMode = 'chat';
    else if (internalMode === 'bank') urlMode = 'bank';
    else if (internalMode === 'live') urlMode = 'live';
    else if (gameModes.includes(internalMode)) urlMode = internalMode;
    
    let urlChanged = false;

    // 1. 同步 mode 參數
    if (newUrl.searchParams.get('mode') !== urlMode) {
        newUrl.searchParams.set('mode', urlMode);
        urlChanged = true;
    }

    // ✨ 2. 新增：智慧同步題庫 ID (bank 參數)
    if (window.currentLoadedBank && window.currentLoadedBank.id) {
        if (newUrl.searchParams.get('bank') !== window.currentLoadedBank.id) {
            newUrl.searchParams.set('bank', window.currentLoadedBank.id);
            urlChanged = true;
        }
    } else {
        // 如果目前沒有載入題庫 (例如使用者自己打字)，則清除 bank 參數保持網址乾淨
        if (newUrl.searchParams.has('bank')) {
            newUrl.searchParams.delete('bank');
            urlChanged = true;
        }
    }

    if (urlChanged) {
        window.history.replaceState({}, '', newUrl);
    }
}

// ==========================================
// 資料夾網址參數控制模組
// ==========================================

/**
 * 1. 更新網址參數 (當點擊進入資料夾時呼叫)
 * @param {string} folderName - 中文資料夾名稱
 */
function updateFolderUrl(folderName) {
    const url = new URL(window.location);
    // 使用 encodeURIComponent 將中文安全轉換為網址格式
    url.searchParams.set('folder', encodeURIComponent(folderName));
    // pushState 可以更改網址列，但不會觸發網頁重新整理！
    window.history.pushState({}, '', url);
}

/**
 * 2. 清除網址參數 (當點擊「返回」或回到主目錄時呼叫)
 */
function clearFolderUrl() {
    const url = new URL(window.location);
    url.searchParams.delete('folder');
    window.history.pushState({}, '', url);
}

/**
 * 3. 檢查網址是否有資料夾參數 (通常在網頁一載入時呼叫)
 * @returns {string|null} - 傳回解碼後的資料夾名稱，若無則傳回 null
 */
function getFolderFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const folderParam = urlParams.get('folder');
    
    if (folderParam) {
        // 將網址參數解碼回中文
        return decodeURIComponent(folderParam);
    }
    return null;
}








// 解決直接連結進入後「返回」路徑錯誤的問題
function switchMode(mode, isForce = false, dataOverride = null, configOverride = null) {
    if (currentMode === mode && !isForce) return;

    // 1. 數據提取與轉移：只有在「非注入模式」下才需要自動存檔，避免覆蓋
    if (!isForce && !dataOverride) {
        if (currentMode === 'table' && mode !== 'table') {
            editor.value = extractTextFromTable(true);
        } else if (currentMode === 'chat' && mode !== 'chat') {
            const chatExtracted = extractTextFromChat();
            if (chatExtracted && chatExtracted.trim() !== '') {
                editor.value = chatExtracted;
                debouncedSaveHistory();
            }
        }
    }
	
	const btnStudyMode = document.getElementById('btnStudyMode');
    
    // 只有在 mode 為 'table' 時才顯示「學習模式」按鈕
    if (mode === 'table') {
        btnStudyMode.style.display = 'flex'; // 顯示
    } else {
        btnStudyMode.style.display = 'none';  // 隱藏
    }


    // 記下進入遊戲前的「來源模式」
    // 只有在「不是遊戲模式」互切，且「沒有外部注入資料 (dataOverride)」時才更新來源
    if (!gameModes.includes(currentMode) && currentMode !== 'arena' && currentMode !== 'live') {
        if (!dataOverride) {
            window.originModeForGame = currentMode;
        }
    }

    // 記下切換前的模式
    const previousMode = currentMode;
    currentMode = mode; 

    // 遊戲/連線模式不存入 LocalStorage
    if (!gameModes.includes(mode) && mode !== 'arena' && mode !== 'live') {
        localStorage.setItem(MODE_KEY, mode);
    }

    updateUrlModeParam(mode);
    hideFloatingTool(); 
    clearTableSelection();

    // --- 2. UI 容器顯隱邏輯 ---
    const containers = {
        text: document.getElementById('textModeContainer'),
        table: document.getElementById('tableModeContainer'),
        chat: document.getElementById('chatModeContainer'),
        game: document.getElementById('gameModeContainer'),
        arena: document.getElementById('arenaModeContainer'),
        bank: document.getElementById('bankModeContainer')
    };
    Object.values(containers).forEach(c => { if(c) { c.style.display = 'none'; c.classList.add('hidden'); } });

    // --- 3. 工具列細節控制 ---
    const ddTextTool = document.getElementById('dd-textTool');
    const tableControls = document.getElementById('tableControls');
    const chatControls = document.getElementById('chatControls');
    const ddLanguageTools = document.getElementById('dd-languageTools');
    const btnFindReplace = document.getElementById('btnFindReplace');
    const ddClipboardGroup = document.getElementById('dd-clipboard-group');
    const btnToggleLineNumbers = document.getElementById('btnToggleLineNumbersTextMode');

    if (ddLanguageTools) ddLanguageTools.classList.remove('hidden');
    if (btnFindReplace) btnFindReplace.classList.remove('hidden');
    if (ddClipboardGroup) ddClipboardGroup.classList.remove('hidden');

	if (chatControls) {
        chatControls.classList.remove('flex');
        chatControls.classList.add('hidden');
    }

    if (tableControls) {
        tableControls.classList.remove('flex');
        tableControls.classList.add('hidden');
    }

    // --- 4. 根據模式執行特定邏輯 ---
	if (mode === 'arena' || mode === 'live' || gameModes.includes(mode)) {
		const targetContainer = (mode === 'arena' || mode === 'live') ? containers.arena : containers.game;
		if (targetContainer) { targetContainer.classList.remove('hidden'); targetContainer.style.display = 'block'; }

		[tableControls, chatControls, ddTextTool, btnToggleLineNumbers].forEach(el => el?.classList.add('hidden'));

		document.querySelectorAll('#gameCurrentTitle').forEach(el => {
			el.textContent = window.currentLoadedBank ? window.currentLoadedBank.name : '自訂測驗';
		});

        // 決定遊戲資料來源
        let rawDataText = dataOverride;
        if (!rawDataText) {
            if (gameModes.includes(previousMode) || previousMode === 'arena' || previousMode === 'live') {
                rawDataText = window.lastGameData || editor.value;
            } else if (containers.table.style.display !== 'none') {
                rawDataText = extractTextFromTable(true);
            } else {
                rawDataText = editor.value;
            }
        }
        window.lastGameData = rawDataText;

        const configs = configOverride || window.currentGameConfigs || { matchPairs: [{ id: 1, termCol: 0, defCol: 1, customName: '' }] };

        if (mode === 'arena' && typeof window.launchArenaMode === 'function') {
            window.launchArenaMode(rawDataText, configs);
        } else if (mode === 'live' && typeof window.launchLiveMode === 'function') {
            window.launchLiveMode(rawDataText, configs);
        } else if (typeof window.launchGameMode === 'function') {
            window.launchGameMode(mode, rawDataText, configs);
        }

    } else if (mode === 'bank') {
        if (containers.bank) { containers.bank.classList.remove('hidden'); containers.bank.style.display = 'flex'; }
        [tableControls, chatControls, ddTextTool, btnToggleLineNumbers].forEach(el => el?.classList.add('hidden'));
        if (typeof initBankCenter === 'function') { initBankCenter(); }

    } else if (mode === 'table') {
        renderTableFromText(editor.value);
        applyFreeze();
        containers.table.style.display = 'block';
        if (tableControls) tableControls.classList.replace('hidden', 'flex');
        if (ddTextTool) ddTextTool.classList.add('hidden');
        if (btnToggleLineNumbers) btnToggleLineNumbers.classList.add('hidden');

    } else if (mode === 'chat') {
        containers.chat.classList.remove('hidden');
        containers.chat.style.display = 'flex';
        if (chatControls) chatControls.classList.replace('hidden', 'flex');
        if (ddLanguageTools) ddLanguageTools.classList.add('hidden');
        if (btnFindReplace) btnFindReplace.classList.add('hidden');
        if (ddClipboardGroup) ddClipboardGroup.classList.add('hidden');
        if (ddTextTool) ddTextTool.classList.add('hidden');
        
        setTimeout(() => document.getElementById('chatInput')?.focus(), 100);
        if (typeof updateChatPivotOptions === 'function') updateChatPivotOptions();
        if (typeof window.renderChatFromText === 'function') window.renderChatFromText(editor.value);

    } else {
        containers.text.style.display = 'flex';
        if (ddTextTool) ddTextTool.classList.remove('hidden');
        if (btnToggleLineNumbers) btnToggleLineNumbers.classList.remove('hidden');
        updateLineNumbers();
    }
    
    setDropdownValue('dd-viewMode', mode);
	updateModeButtonUI(mode);
}


// 模式按鈕動態切換引擎
function updateModeButtonUI(mode) {
    const btn = document.querySelector('#dd-viewMode .dropdown-btn');
    const icon = document.getElementById('currentModeIcon');
    const text = document.getElementById('currentModeText');
    if (!btn || !icon || !text) return;

    // 清除舊有的顏色
    btn.classList.remove('bg-blue-100', 'text-blue-700', 'hover:bg-blue-200',
                         'bg-green-100', 'text-green-700', 'hover:bg-green-200',
                         'bg-emerald-100', 'text-emerald-700', 'hover:bg-emerald-200',
                         'bg-purple-100', 'text-purple-700', 'hover:bg-purple-200');

    // 依據模式賦予專屬顏色、圖示與短名稱
    if (mode === 'text') {
        icon.textContent = 'description';
        text.textContent = '文字';
        btn.classList.add('bg-blue-100', 'text-blue-700', 'hover:bg-blue-200');
    } else if (mode === 'table') {
        icon.textContent = 'table_view';
        text.textContent = '表格';
        btn.classList.add('bg-green-100', 'text-green-700', 'hover:bg-green-200');
    } else if (mode === 'chat') {
        icon.textContent = 'forum';
        text.textContent = '對話';
        btn.classList.add('bg-emerald-100', 'text-emerald-700', 'hover:bg-emerald-200');
    } else if (gameModes.includes(mode) || mode === 'arena' || mode === 'live' || mode === 'bank') {
        icon.textContent = 'style';
        text.textContent = '學習';
        btn.classList.add('bg-purple-100', 'text-purple-700', 'hover:bg-purple-200');
    }
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
    } else if (currentMode === 'table') {
        renderTableFromText(previousState);
        applyFreeze();
        clearTableSelection();
    } else if (currentMode === 'chat') {
        if (typeof window.renderChatFromText === 'function') {
            window.renderChatFromText(previousState);
        }
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
    if (sheetTabs[activeSheetIndex]) {
        sheetTabs[activeSheetIndex].colNames = names;
        saveAllTabsData(); // 呼叫存檔以寫入 localStorage
    }
}

function loadColNames() {
    if (sheetTabs[activeSheetIndex] && sheetTabs[activeSheetIndex].colNames) {
        return sheetTabs[activeSheetIndex].colNames;
    }
    try { return JSON.parse(localStorage.getItem(COL_NAMES_KEY)) || []; } 
    catch(e) { return []; }
}

function saveColWidths() {
    const theadThs = dataTable.querySelectorAll('thead th');
    const widths = [];
    for (let i = 1; i < theadThs.length; i++) {
        widths.push(theadThs[i].style.width || '150px');
    }
    if (sheetTabs[activeSheetIndex]) {
        sheetTabs[activeSheetIndex].colWidths = widths;
        saveAllTabsData(); 
    }
}

function loadColWidths() {
    if (sheetTabs[activeSheetIndex] && sheetTabs[activeSheetIndex].colWidths) {
        return sheetTabs[activeSheetIndex].colWidths;
    }
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
            <span class="col-label mx-auto pointer-events-auto cursor-pointer flex-1 text-center hover:text-blue-600 px-2" title="點擊選取｜左半拖曳：多選欄｜右半拖曳：移動欄"></span>
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

    // 若小於 5欄 10列，則自動補足
    if (maxCols < 5) maxCols = 5;
    
    // 補足列數 (至少 10 列)
    while (parsedRows.length < 10) {
        parsedRows.push([]);
    }
    
    parsedRows.forEach(row => {
        while (row.length < maxCols) {
            row.push('');
        }
    });

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
				td.innerHTML = `<div class="td-inner" contenteditable="true" spellcheck="false">${safeText}</div>`;
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

function extractTextFromTable(trimTrailing = false) {
    if (!dataTable.querySelector('tbody')) return '';

    // 1. 抓取表格所有資料並組成二維陣列
    let grid = Array.from(dataTable.querySelectorAll('tbody tr')).map(row => {
        return Array.from(row.querySelectorAll('.td-inner')).map(cell => {
            let text = cell.hasAttribute('data-formula') ? cell.getAttribute('data-formula') : cell.innerText;
            if (text.endsWith('\n')) text = text.slice(0, -1);
            return text;
        });
    });

    // 2. 只有在指定需要清理時 (例如手動切換到文字模式)，才移除邊緣的空欄與空列
    if (trimTrailing) {
        // 從底部往上檢查，移除完全空白的列
        while (grid.length > 0) {
            const lastRow = grid[grid.length - 1];
            const isEmptyRow = lastRow.every(cell => !cell || String(cell).trim() === '');
            if (isEmptyRow) {
                grid.pop();
            } else {
                break; // 遇到有資料的列就停止
            }
        }

        // 檢查每一列，找出最右邊有資料的欄位索引，藉此清除右側多餘空欄
        if (grid.length > 0) {
            let maxColWithData = -1;
            for (let r = 0; r < grid.length; r++) {
                const row = grid[r];
                for (let c = row.length - 1; c >= 0; c--) {
                    if (row[c] && String(row[c]).trim() !== '') {
                        if (c > maxColWithData) maxColWithData = c;
                        break;
                    }
                }
            }

            const validColCount = maxColWithData + 1;
            for (let r = 0; r < grid.length; r++) {
                if (grid[r].length > validColCount) {
                    grid[r] = grid[r].slice(0, validColCount);
                }
            }
        }
    }

    // 3. 轉為 TSV 文字格式 (支援跳脫字元)
    return grid.map(row => {
        return row.map(text => {
            if (text.includes('"') || text.includes('\n') || text.includes('\t')) {
                return '"' + text.replace(/"/g, '""') + '"';
            }
            return text;
        }).join('\t');
    }).join('\n');
}

/* ==========================================
   輸入法全域焦點同步引擎 (解決手機版與表格模式無反應問題)
   ========================================== */
document.addEventListener('focusin', (e) => {
    // 檢查目前是否已經載入並啟用了輸入法
    if (typeof WebIME !== 'undefined' && WebIME.isInitialized) {
        
        const target = e.target;

        // 如果是檢視全部的編碼框 (viewall-search-input) 或帶有 data-ignore-ime 屬性，就直接放行，不啟動輸入法
        if (target.getAttribute('data-ignore-ime') === 'true' || 
            target.id === 'viewall-search-input' || 
            target.classList.contains('viewall-search-input')) {
            return; 
        }
        
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
            const isInputFocus = document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
            
            if (isInputFocus && e.key !== 'Tab') {
                return;
            }

            const activeInner = document.activeElement.closest('.td-inner');
            const isEditing = activeInner !== null;
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
                // [表格篩選] 方向鍵跳過被篩選隱藏的列
                const prevR = headR;
                headR += dr; headC += dc;
                if (dr) {
                    while (headR >= 0 && headR <= maxR && tbody.children[headR].classList.contains('tf-hidden')) headR += dr;
                    if (headR < 0 || headR > maxR) headR = prevR;
                }
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
                        // [表格篩選] Enter 向下跳過被篩選隱藏的列
                        while (tbody.children[r] && tbody.children[r].classList.contains('tf-hidden')) r++;
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
	window.currentLoadedBank = null;
    debouncedUpdateLineNumbers();
    hideFloatingTool(); 
    debouncedSaveHistory(); 
});

editor.addEventListener('scroll', () => { 
    lineNumbers.scrollTop = editor.scrollTop; 
    hideFloatingTool(); 
});

dataTable.addEventListener('input', () => { 
	window.currentLoadedBank = null;
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

// 編輯觸發方式切換
document.getElementById('dd-editTrigger')?.addEventListener('change', (e) => {
    currentEditTrigger = e.detail.value;
    localStorage.setItem(EDIT_TRIGGER_KEY, currentEditTrigger);
    const iconMap = { 'double': 'mouse', 'single': 'touch_app' };
    document.getElementById('editTriggerIcon').textContent = iconMap[currentEditTrigger];
    showToast(`設定已變更：儲存格改為 [${currentEditTrigger === 'double' ? '點兩下' : '點一下'}] 編輯`);
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
        // 1. 清空背後的純文字資料
        editor.value = '';
        
        // 2. 根據目前所在的模式，重置對應的畫面
        if (currentMode === 'text') {
            updateLineNumbers();
        } else if (currentMode === 'table') {
            renderTableFromText(''); // 表格模式下繪製空表格
        } else if (currentMode === 'chat') {
            const chatArea = document.getElementById('chatMessagesArea');
            if (chatArea) chatArea.innerHTML = '';
        }
        
        // 3. 儲存至歷史紀錄與分頁資料
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
   線上輸入法：載入與卸載控制引擎
   ========================================== */

window.isMyImeLoaded = false;

document.addEventListener('click', (e) => {
    // 攔截擁有 ime-toggle-button 類別的按鈕
    const btn = e.target.closest('.ime-toggle-button');
    if (!btn) return;
    
    e.preventDefault();
    
    // 檢查 HTML 是否有正確載入 WebIME
    if (typeof WebIME !== 'undefined') {
        
        // 單純判斷我們自己的變數
        if (!window.isMyImeLoaded) {
            // 【執行載入】
            if (typeof WebIME.imeInit === 'function') {
                WebIME.imeInit({});
            }
            window.isMyImeLoaded = true; // 更新狀態為已載入
            showToast('✅ 烏衣行輸入法已載入！');
        } 
        else {
            // 【執行卸載】
            if (typeof WebIME.imeDestroy === 'function') {
                WebIME.imeDestroy();
            } else if (typeof WebIME.imeSetIsEnabled === 'function') {
                WebIME.imeSetIsEnabled(false); 
            }
            window.isMyImeLoaded = false; // 更新狀態為未載入
            showToast('❌ 烏衣行輸入法已卸載');
        }

        // 載入或卸載後，將游標精準對焦回輸入框，讓體驗不中斷
        setTimeout(() => {
            if (currentMode === 'text') {
                const editor = document.getElementById('editor');
                if (editor) editor.focus();
            } else if (currentMode === 'table') {
                const activeInner = document.querySelector('td.sel-bg .td-inner') || document.querySelector('.td-inner');
                if (activeInner) activeInner.focus();
            } else if (currentMode === 'chat') {
                const chatInput = document.getElementById('chatInput');
                if (chatInput) chatInput.focus();
            }
        }, 100);

    } else {
        showToast('⚠️ 輸入法核心未載入。');
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
    
    // ✨ 關鍵修復：絕不把遊戲、連線或題庫模式存進記憶體！
    // 這樣重新整理網頁時，預設一定會乖乖回到「表格」或「文字」模式
    let safeMode = currentMode;
    if (gameModes.includes(currentMode) || currentMode === 'arena' || currentMode === 'bank') {
        safeMode = 'table'; 
    }
    sheetTabs[activeSheetIndex].mode = safeMode;

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
                
               let leftPos = rect.left;
                const menuWidth = tabMenu.offsetWidth;
                
                // 如果選單的右側會超出螢幕右邊界，就把選單強制往左推
                if (leftPos + menuWidth > window.innerWidth) {
                    leftPos = window.innerWidth - menuWidth - 10; // 距離右邊緣保留 10px 安全距離
                }
                // 確保左側也不會超出螢幕（雙重保險）
                tabMenu.style.left = `${Math.max(5, leftPos)}px`; 
                
                // 垂直邊界防護
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
document.getElementById('tabMenu')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    const idx = window.activeTabMenuIndex;
    
    if (idx !== activeSheetIndex) switchSheet(idx); // 確保作用於正確頁籤
    
    // 新增對話模式，並更新判斷邏輯
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
        showConfirm('清空工作表', `目前僅剩一個工作表，刪除將會「清空」目前所有內容並保留結構。你確定嗎？`, () => {
            // 1. 清空編輯器的純文字資料
            editor.value = '';
            
            // 2. 根據目前所在的模式，立即重置畫面
            if (currentMode === 'text') {
                updateLineNumbers();
            } else if (currentMode === 'table') {
                renderTableFromText(''); // 表格模式下重繪空表格
            } else if (currentMode === 'chat') {
                const chatArea = document.getElementById('chatMessagesArea');
                if (chatArea) chatArea.innerHTML = ''; // 清空對話氣泡
            }
            
            // 3. 儲存至歷史紀錄與分頁資料
            saveHistoryState();
            saveAllTabsData();
            
            // 4. ✨ 額外加分：清空後自動重新命名為「工作表1」，保持介面整潔
            sheetTabs[0].name = '工作表1';
            renderSheetTabs();
            
            showToast('🗑️ 工作表內容已完全清空');
        });
        return;
    }

    // 原有的多頁籤刪除邏輯
    showConfirm('刪除工作表', `確定要刪除「${sheetTabs[index].name}」嗎？此操作無法復原。`, () => {
        sheetTabs.splice(index, 1);
        if (activeSheetIndex >= sheetTabs.length) {
            activeSheetIndex = Math.max(0, sheetTabs.length - 1);
        }
        
        const newTab = sheetTabs[activeSheetIndex];
        if (!newTab.history) newTab.history = [newTab.content];
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
    sheetTabs.push({ name: newName, content: '', history: [''], mode: currentMode });
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

// 控制自動儲存開關點擊
const btnToggleAutoSave = document.getElementById('btnToggleAutoSave');
if (btnToggleAutoSave) {
    btnToggleAutoSave.addEventListener('click', (e) => {
        // 防止點擊選單項目時，選單立刻被關閉（如果原本有這邏輯的話）
        e.stopPropagation(); 
        
        // 切換狀態
        isAutoSaveEnabled = !isAutoSaveEnabled;
        
        // 更新 UI 顯示
        const statusText = document.getElementById('autoSaveStatusText');
        const icon = document.getElementById('autoSaveIcon');
        
        if (isAutoSaveEnabled) {
            statusText.textContent = '開啟';
            statusText.className = 'text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold';
            icon.textContent = 'sync';
            showToast('已開啟自動儲存');
        } else {
            statusText.textContent = '關閉';
            statusText.className = 'text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold';
            icon.textContent = 'sync_disabled';
            showToast('已關閉自動儲存');
        }
    });
}




/* ==========================================
   極致滿版 (Zen Mode) 切換邏輯
   ========================================== */
const btnMaximizeView = document.getElementById('btnMaximizeView');
const btnExitMaximize = document.getElementById('btnExitMaximize');

function toggleMaximizeMode(isMaximized) {
    if (isMaximized) {
        document.body.classList.add('maximized-mode');
        
        // ✨ 判斷是否為「學習/遊戲模式」
        if (document.body.classList.contains('is-playing-game')) {
            // 學習模式下：隱藏左上角的預設退出按鈕 (因為有專屬的返回鈕)，且不顯示提示訊息
            btnExitMaximize.classList.add('hidden');
        } else {
            // 一般編輯模式下手動放大：顯示左上角按鈕與提示訊息
            btnExitMaximize.classList.remove('hidden');
            showToast('🧘 已進入極致滿版模式 (可按 Esc 退出)');
        }
    } else {
        document.body.classList.remove('maximized-mode');
        document.body.classList.remove('is-playing-game'); 
        btnExitMaximize.classList.add('hidden');
    }
    
    // 觸發視窗重新計算，確保行號或表格寬度正確渲染
    setTimeout(() => {
        if (currentMode === 'text') {
            if (typeof debouncedUpdateLineNumbers === 'function') debouncedUpdateLineNumbers();
        } else if (currentMode === 'table') {
            if (typeof applySelectionVisuals === 'function') applySelectionVisuals();
            if (typeof applyFreeze === 'function') applyFreeze();
        }
    }, 100);
}

// 點擊選單按鈕：進入滿版
if (btnMaximizeView) {
    btnMaximizeView.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.dropdown-menu, .group\\/submenu').forEach(m => {
            m.classList.remove('show', 'mobile-open');
        });
        toggleMaximizeMode(true);
    });
}

// 點擊浮動按鈕：退出滿版
if (btnExitMaximize) {
    btnExitMaximize.addEventListener('click', () => {
        toggleMaximizeMode(false);
    });
}

// 監聽鍵盤：按下 Esc 鍵退出滿版
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('maximized-mode')) {
        // ✨ 學習模式下「不允許」按 Esc 退出滿版
        if (document.body.classList.contains('is-playing-game')) return;
        
        toggleMaximizeMode(false);
    }
});





/* ==========================================
   產生分享網址
========================================== */
document.getElementById('btnShareLink')?.addEventListener('click', async () => {
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    
    let currentContent = currentMode === 'text' ? editor.value : extractTextFromTable();
    if (currentMode === 'chat') {
        currentContent = typeof extractTextFromChat === 'function' ? extractTextFromChat() : editor.value;
    }

    if (!currentContent || currentContent.trim() === '') {
        return showToast('⚠️ 目前沒有內容可以分享');
    }

    // 2. 檢查使用者是否已經登入
    let currentUser = auth.currentUser;

    // 3. 若未登入，觸發 Google 彈窗登入
    if (!currentUser) {
        try {
            showToast('⏳ 正在開啟 Google 登入...');
            const result = await auth.signInWithPopup(googleProvider);
            currentUser = result.user;
            showToast(`✅ 登入成功！歡迎，${currentUser.displayName}`);
        } catch (error) {
            console.error('Google 登入失敗:', error);
            showToast('❌ 登入失敗或已取消');
            return; // 登入失敗就中止分享動作
        }
    }

    // 4. 登入成功，繼續執行產生短網址的邏輯
    try {
        showToast('⏳ 正在產生雲端連結，請稍候...');
        // 相同內容已分享過就沿用原本的 id；否則才新增（寫入受 Firestore 安全規則保護）
        const docId = (await saveOrReuseSharedDoc(currentContent)).id;
        
        if (!docId) throw new Error("取得 ID 失敗");

        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('id', docId); 
        
        let urlMode = 'txt';
        if (currentMode === 'table') urlMode = 'sheet';
        else if (currentMode === 'chat') urlMode = 'chat';
        else if (gameModes.includes(currentMode)) urlMode = currentMode;
        shareUrl.searchParams.set('mode', urlMode);

        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareUrl.href);
            showToast('🔗 短網址已成功複製到剪貼簿！');
        } else {
            fallbackCopy(shareUrl.href);
        }
    } catch (e) {
        console.error('雲端分享失敗:', e);
        showToast('❌ 產生網址失敗，請檢查網路連線');
    }
});

// 萬一瀏覽器不支援 navigator.clipboard 的備用方案
function fallbackCopy(text) {
    showPrompt('請手動複製以下網址：', text, () => {});
}




// ==========================================
// fflate 高效壓縮引擎 (轉換為 URL 安全字串)
// ==========================================
function compressDataForUrl(text) {
    // 1. 將文字轉為二進位 (UTF-8)
    const uint8 = fflate.strToU8(text);
    // 2. 使用最高級別 (level: 9) 進行 Deflate 壓縮
    const compressed = fflate.deflateSync(uint8, { level: 9 });
    
    // 3. 將二進位轉換為純文字，再轉成 Base64
    let binaryStr = '';
    for (let i = 0; i < compressed.length; i++) {
        binaryStr += String.fromCharCode(compressed[i]);
    }
    // 4. 將 Base64 的 +, /, = 替換成網址安全字元
    return btoa(binaryStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decompressDataFromUrl(base64UrlSafe) {
    // 1. 將網址安全字元還原回標準 Base64
    let base64 = base64UrlSafe.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    
    // 2. 將 Base64 轉回二進位陣列
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    
    // 3. 進行解壓縮並還原成文字
    const decompressed = fflate.inflateSync(bytes);
    return fflate.strFromU8(decompressed);
}













// 1. 儲存壓縮資料到 Firebase，取得短 ID
async function saveToFirebase(compressedData) {
    try {
        // 在 "shared_docs" 集合中自動新增一筆文件，Firebase 會自動產生短 ID
        const docRef = await db.collection("shared_docs").add({
            data: compressedData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp() // 記錄時間
        });
        return docRef.id; // 回傳這組俐落的短 ID！
    } catch (e) {
        console.error("儲存到 Firebase 失敗:", e);
        return null;
    }
}

// 2. 從 Firebase 透過短 ID 讀取資料
async function loadFromFirebase(docId) {
    try {
        const docRef = db.collection("shared_docs").doc(docId);
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
            return docSnap.data().data; // 回傳當初存進去的壓縮字串
        } else {
            console.warn("找不到該份文件！");
            return null;
        }
    } catch (e) {
        console.error("從 Firebase 讀取失敗:", e);
        return null;
    }
}


// ==========================================
// 分享資料去重：相同內容只存一次，重複分享沿用同一個 id
// （避免每按一次分享就在 shared_docs 新增一筆相同資料）
// ==========================================
const SHARED_ID_CACHE_KEY = 'wesing-shared-id-cache';
const SHARED_ID_CACHE_MAX = 100;           // 最多記住 100 筆
const SHARED_DOC_REUSE_MAX_DAYS = 20;      // 雲端資料超過 20 天就不沿用（站長會清除 30 天前的資料）

// 簡易字串雜湊 (cyrb53)，把長內容縮成短字串當 key
function hashShareContent(text) {
    // 正規化：統一換行、去掉每行尾端空白/Tab 與結尾空行，避免「看起來一樣」卻因格式差異而判定不同
    const norm = String(text || '').replace(/\r\n?/g, '\n').split('\n').map(l => l.replace(/[\t ]+$/, '')).join('\n').trim();
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0, ch; i < norm.length; i++) {
        ch = norm.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36) + '_' + norm.length;
}

function getSharedIdCache() {
    try { return JSON.parse(localStorage.getItem(SHARED_ID_CACHE_KEY)) || {}; } catch (e) { return {}; }
}

// 記住「這份內容 → 雲端文件 id」（開啟分享連結、或新分享成功時呼叫）
function rememberSharedId(text, docId) {
    if (!text || !docId) return;
    try {
        const cache = getSharedIdCache();
        cache[hashShareContent(text)] = { id: docId, t: Date.now() };
        const keys = Object.keys(cache);
        if (keys.length > SHARED_ID_CACHE_MAX) {
            keys.sort((a, b) => cache[a].t - cache[b].t)
                .slice(0, keys.length - SHARED_ID_CACHE_MAX)
                .forEach(k => delete cache[k]);
        }
        localStorage.setItem(SHARED_ID_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {}
}

// 取得分享用的雲端 id：內容已存過且文件還在 → 直接沿用；否則新增一筆
async function saveOrReuseSharedDoc(text) {
    const cached = getSharedIdCache()[hashShareContent(text)];
    if (cached && cached.id) {
        try {
            const snap = await db.collection("shared_docs").doc(cached.id).get();
            if (snap.exists) {
                const ts = snap.data().timestamp;
                const ageDays = ts && ts.toMillis ? (Date.now() - ts.toMillis()) / 86400000 : 0;
                if (ageDays < SHARED_DOC_REUSE_MAX_DAYS) return { id: cached.id, reused: true };
            }
        } catch (e) { /* 讀取失敗就當作沒有，改為新增 */ }
    }
    const docId = await saveToFirebase(compressDataForUrl(text));
    if (docId) rememberSharedId(text, docId);
    return { id: docId, reused: false };
}

// ==========================================
// 站長專屬：一鍵清除 30 天前的過期分享網址
// ==========================================
async function adminCleanupOldShares() {
    // 再次雙重驗證前端權限 (比對 Base64 編碼的信箱)
    const user = auth.currentUser;
    if (!user || btoa(user.email) !== 'dWlvaXU5NDIwQGdtYWlsLmNvbQ==') {
        showToast('⚠️ 權限不足，無法執行此操作');
        return;
    }

    // 呼叫編輯器內建的自訂確認視窗 (showConfirm)
    showConfirm('確認清除雲端舊資料', '這將會永久刪除資料庫中所有「超過 30 天」的分享網址，空間將會釋放。此操作無法復原，確定要執行嗎？', async () => {
        showToast('⏳ 正在掃描並清理過期資料...');
        
        // 計算 30 天前的精確時間點
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        try {
            // 前往雲端撈出建立時間早於 30 天前的舊文件
            const snapshot = await db.collection("shared_docs")
                .where("timestamp", "<", thirtyDaysAgo)
                .get();

            if (snapshot.empty) {
                showToast('✅ 檢查完成：目前沒有超過 30 天的過期網址。');
                return;
            }

            // 使用 Firestore 批量刪除機制 (Batch)
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // 提交刪除指令到雲端
            await batch.commit();
            showToast(`🎉 成功清除 ${snapshot.size} 筆過期資料！空間已釋放。`);

        } catch (error) {
            console.error("站長資料清理失敗:", error);
            showToast('❌ 清理失敗，請檢查網路或雲端安全規則設定。');
        }
    });
}



















// ==========================================
// 行動版：鍵盤高度校正與對話介面
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const sheetTabBar = document.getElementById('sheetTabBar');
    const chatInput = document.getElementById('chatInput');

    if (window.visualViewport) {
        const adjustViewport = () => {
            // 使用 requestAnimationFrame 讓程式「等一下」，確保抓到的是鍵盤完全彈出後的最終高度
            requestAnimationFrame(() => {
                const vv = window.visualViewport;
                
                // 1. 將 body 高度嚴格設定為真正的可視高度
                document.body.style.height = `${vv.height}px`;
                
                // 2. 修正 Safari/Chrome 鍵盤彈出時的視窗推擠位移
                if (vv.offsetTop > 0) {
                    // 若瀏覽器將畫面往上推，我們強制利用 transform 將畫面往下補齊差距
                    document.body.style.transform = `translateY(${vv.offsetTop}px)`;
                } else {
                    document.body.style.transform = `translateY(0px)`;
                }
                
                // 3. 強制歸零捲動軸
                window.scrollTo(0, 0);
            });
        };

        // 當視窗大小改變 (鍵盤彈出/收起) 或發生滾動時，即時校正
        window.visualViewport.addEventListener('resize', adjustViewport);
        window.visualViewport.addEventListener('scroll', adjustViewport);
        
        // 初始執行
        adjustViewport();
    }

    if (sheetTabBar) {
    let blurTimeout;

    // 👇 1. 新增：獨立抽出一個同步高度的函式，讓視窗在鍵盤動畫期間能隨時修正
    const syncViewportHeight = () => {
        if (document.body.style.position === 'fixed' && window.visualViewport) {
            document.body.style.height = `${window.visualViewport.height}px`;
            window.scrollTo(0, 0); // 持續抵銷推擠
        }
    };

    // 處理鍵盤彈出
    const handleFocusIn = (e) => {
        if (window.innerWidth <= 768) {
            const target = e.target;
            if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.hasAttribute('contenteditable')) {
                if (blurTimeout) clearTimeout(blurTimeout);

                sheetTabBar.style.display = 'none';
                
                document.body.style.position = 'fixed';
                document.body.style.top = '0';
                document.body.style.left = '0';
                document.body.style.width = '100%';
                
                // 初始擷取高度
                const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                document.body.style.height = `${vh}px`; 
                window.scrollTo(0, 0);
                
                // 👇 2. 【關鍵修復】：綁定 resize 事件，精準捕捉鍵盤滑動過程中的高度變化
                if (window.visualViewport) {
                    window.visualViewport.addEventListener('resize', syncViewportHeight);
                }
            }
        }
    };

    // 處理鍵盤收起
    const handleFocusOut = (e) => {
        if (window.innerWidth <= 768) {
            const target = e.target;
            if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.hasAttribute('contenteditable')) {
                blurTimeout = setTimeout(() => {
                    
                    // 👇 3. 【關鍵修復】：鍵盤收合後，務必解除監聽，把主導權還給系統
                    if (window.visualViewport) {
                        window.visualViewport.removeEventListener('resize', syncViewportHeight);
                    }

                    sheetTabBar.style.display = '';
                    document.body.style.position = '';
                    document.body.style.top = '';
                    document.body.style.left = '';
                    document.body.style.width = '';
                    document.body.style.height = ''; 
                    
                    if (window.visualViewport) {
                        window.visualViewport.dispatchEvent(new Event('resize'));
                    }
                }, 100);
            }
        }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
}
});

// =================================================================
// 桌面版下拉選單：可捲動主選單 + 固定定位子選單 (避免被 overflow 裁切)
// =================================================================
(function setupScrollableDropdownFlyouts() {
    function positionFlyout(sub) {
        if (window.innerWidth <= 768) return; // 手機版使用手風琴式，不需處理
        const flyout = sub.lastElementChild;
        if (!flyout || flyout === sub.firstElementChild) return;
        const r = sub.getBoundingClientRect();
        flyout.style.position = 'fixed';
        flyout.style.marginTop = '0';
        flyout.style.top = r.top + 'px';
        flyout.style.left = r.right + 'px';
        const w = flyout.offsetWidth, h = flyout.offsetHeight;
        // 右側放不下 → 改往左展開
        if (r.right + w > window.innerWidth - 4) flyout.style.left = Math.max(4, r.left - w) + 'px';
        // 下方放不下 → 往上推，最少貼齊視窗上緣
        const maxTop = window.innerHeight - h - 8;
        flyout.style.top = Math.max(8, Math.min(r.top - 4, maxTop)) + 'px';
    }

    document.addEventListener('mouseover', (e) => {
        const sub = e.target.closest && e.target.closest('.dropdown-scroll .group\\/submenu');
        if (sub) positionFlyout(sub);
    });

    // 主選單捲動時，讓目前展開的子選單跟著對齊
    document.addEventListener('scroll', (e) => {
        const t = e.target;
        if (!t || !t.classList || !t.classList.contains('dropdown-scroll')) return;
        const sub = t.querySelector('.group\\/submenu:hover');
        if (sub) positionFlyout(sub);
    }, true);
})();
