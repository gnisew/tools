const { PDFDocument, degrees, rgb, StandardFonts } = PDFLib;

// 設定 PDF.js 的離線背景 Worker 路徑
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
  console.info('[PDF.js] 版本', pdfjsLib.version);   // [新增]

  // [新增] 診斷：pdf.js 的 Worker 啟動失敗時會悄悄退回「假 worker」（全部在主執行緒做，大檔會非常慢、畫面會卡）
  // 這裡試著自己開一次 Worker，失敗就說明原因（console + 左下角提示）
  (function checkPdfWorker() {
    const fail = (why) => {
      console.warn('[PDF.js Worker] 無法啟動背景 Worker，會很慢：', why);
      setTimeout(() => { try { setStatus(`⚠ PDF.js 背景 Worker 無法啟動，大檔會很慢（${why}）`, 'error', false, 12000); } catch (e) {} }, 1500);
    };
    try {
      const w = new Worker('pdf.worker.min.js');
      let done = false;
      w.onerror = (ev) => { if (!done) { done = true; fail(location.protocol === 'file:' ? '找不到 pdf.worker.min.js，或瀏覽器不允許從 file:// 載入' : '找不到 pdf.worker.min.js（請確認與 index.html 同一資料夾）'); } try { w.terminate(); } catch (e) {} };
      setTimeout(() => { done = true; try { w.terminate(); } catch (e) {} }, 1200);
    } catch (e) {
      fail(location.protocol === 'file:'
        ? '用 file:// 開啟時 Chrome 不允許建立 Worker，請改用本機伺服器開啟，例如在這個資料夾執行 python -m http.server 8000，再開 http://localhost:8000'
        : String(e && e.message || e));
    }
  })();
}

// 6 段清晰度設定 (30 頁內小檔案自動預設為「高清 hd」)
//  [新增] instant（光速）：完全不產生縮圖，只顯示頁碼空框（超大檔案用，換清晰度或雙擊預覽才看得到內容）
//  [新增] ultra（超速）：比極速更小、更低品質，並略過註解繪製以加快速度
const QUALITY_PRESETS = {
  instant: { width: 0,   quality: 0,    none: true },
  ultra:  { width: 80,   quality: 0.4,  noAnnots: true },
  fast:   { width: 160,  quality: 0.55 },
  medium: { width: 300,  quality: 0.75 },
  high:   { width: 550,  quality: 0.85 },
  hd:     { width: 1100, quality: 0.92 }
};

// 狀態管理
let currentTab = 'merge';

// 檔案庫（合併 / 調動 / 分割 三個檢視共用）
// [{ id, file, name, pageCount, selected, pdfJsPromise, pagesAdded, password }]   ← password：加密檔解鎖用的密碼（無則為 null）
let docs = [];
let nextDocId = 1;
const knownDocs = new Map();            // 用來偵測「檔案被移除」並釋放資源
const OPEN_VIEW_KEY = 'pdf_tool_open_view';

// 合併檢視狀態
let draggedItemIndex = null;
let isMergeSelectionMode = false;
let lastCheckedMergeIndex = null;

// 分割檢視狀態（針對檔案庫中的某一個檔案）
let splitDocId = null;
let splitFile = null;
let splitItem = null;      // 目前要分割的檔案庫項目（儲存時才用 pdf-lib 載入）
let splitTotalPages = 0;

// 調動檢視狀態（頁面可來自多個檔案）
// [{ uid, docId, key, originalIndex, originalPageNum, selected, rotation, blank? }]
// [修改] uid＝每張卡片唯一識別（複製頁面後 key 會重複，key 只用來共用縮圖）；blank＝插入的空白頁
// key = `${docId}_${原頁碼}`，作為縮圖快取與 DOM 的唯一識別；rotation：額外旋轉角度（0/90/180/270，順時針）
let reorderPages = [];
let reorderEdited = false;   // 使用者是否在調動中做過編輯（有編輯時，檔案庫的排序變動不會覆蓋頁面順序）
let reorderOrderSig = '';    // 上次同步時的檔案順序簽章
let reorderMulti = false;    // 調動中是否包含多個檔案
let draggedPageIndex = null;
let draggedPageGroup = [];   // 本次拖曳要一起移動的頁面物件（多選時為所有已勾選頁；按住 Ctrl/⌘ 或該頁未勾選時只有單頁）
let activeSidebarIndex = 0;
let isSelectionMode = false;
let lastCheckedPageIndex = null;
let statusTimeout = null;

// 縮圖快取與懶載入觀察器
let thumbnailCache = {};
let renderingPages = new Set();
let thumbObserver = null;
// [效能] 調動檢視的查表：每次重繪時重建，避免用 querySelectorAll / find / indexOf 做 O(n) 掃描
let thumbEls = new Map();       // 縮圖 key → [縮圖容器…]
let uidEls = new Map();         // 頁面 uid → [縮圖容器…]（主畫面 + 側欄）
let uidPage = new Map();        // 頁面 uid → 頁面物件
let uidCard = new Map();        // 頁面 uid → 主畫面卡片
let cardEls = [];               // 與 reorderPages 同序的卡片元素
let sideEls = [];               // 與 reorderPages 同序的側欄項目（側欄收合時為空）
let thumbVisible = new Map();   // 縮圖 key → 目前在可視範圍內的容器數（捲離的縮圖不再繪製）
let renderDocCache = null;      // 重繪期間的檔案名稱 / 序號查表
function pushMap(map, k, v) { const a = map.get(k); if (a) a.push(v); else map.set(k, [v]); }

// 頂端共用 DOM
const openFileBtn = document.getElementById('openFileBtn');
const primarySaveBtn = document.getElementById('primarySaveBtn');
const saveBtnText = document.getElementById('saveBtnText');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const ctxGroups = document.querySelectorAll('.ctx-group');
const statusMsg = document.getElementById('statusMsg');
const themeSelect = document.getElementById('themeSelect');


// 1. 合併相關 DOM
const mergeSection = document.getElementById('merge');
const fileInput = document.getElementById('fileInput');
const workspaceEl = document.querySelector('.workspace');
const mergeFileList = document.getElementById('mergeFileList');
const clearAllBtn = document.getElementById('clearAllBtn');
const toggleMergeSelectModeBtn = document.getElementById('toggleMergeSelectModeBtn');
const mergeSelectionSubTools = document.getElementById('mergeSelectionSubTools');
const mergeSelectAllBtn = document.getElementById('mergeSelectAllBtn');
const mergeSelectAllBtnText = document.getElementById('mergeSelectAllBtnText');
const deleteSelectedMergeBtn = document.getElementById('deleteSelectedMergeBtn');
const deleteSelectedMergeText = document.getElementById('deleteSelectedMergeText');
const mergePageInfo = document.getElementById('mergePageInfo');

// 2. 分割相關 DOM
const splitSection = document.getElementById('split');
const splitDocRow = document.getElementById('splitDocRow');
const splitDocSelect = document.getElementById('splitDocSelect');
const splitOptions = document.getElementById('splitOptions');
const splitFileNameTitle = document.getElementById('splitFileNameTitle');
const splitPageInfo = document.getElementById('splitPageInfo');
const pageRangeInput = document.getElementById('pageRangeInput');
const splitZipCheck = document.getElementById('splitZipCheck');
const splitZipRow = document.getElementById('splitZipRow');
const chunkSizeInput = document.getElementById('chunkSizeInput');
const chunkHint = document.getElementById('chunkHint');

// 3. 調整頁序與選取相關 DOM
const reorderSection = document.getElementById('reorder');
const reorderTools = document.getElementById('reorderTools');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const toggleSelectModeBtn = document.getElementById('toggleSelectModeBtn');
const selectionSubTools = document.getElementById('selectionSubTools');
const rangeSelectWrap = document.getElementById('rangeSelectWrap');   // [新增] 右側收合的頁碼範圍選取
const rangeMenuBtn = document.getElementById('rangeMenuBtn');
const rangeMenu = document.getElementById('rangeMenu');
const selectAllBtn = document.getElementById('selectAllBtn');
const selectAllBtnText = document.getElementById('selectAllBtnText');
const deleteSelectedPagesBtn = document.getElementById('deleteSelectedPagesBtn');
const rotateLeftSelectedBtn = document.getElementById('rotateLeftSelectedBtn');
const rotateRightSelectedBtn = document.getElementById('rotateRightSelectedBtn');
const deleteSelectedPagesText = document.getElementById('deleteSelectedPagesText');
const reorderBody = document.getElementById('reorderBody');
const reorderSidebar = document.getElementById('reorderSidebar');
const sidebarThumbList = document.getElementById('sidebarThumbList');
const reorderPageInfo = document.getElementById('reorderPageInfo');
const reorderPageList = document.getElementById('reorderPageList');
const thumbSizeSlider = document.getElementById('thumbSizeSlider');
const zoomModeLabel = document.getElementById('zoomModeLabel');
const zoomMenu = document.getElementById('zoomMenu');   // [新增]
const thumbQualitySelect = document.getElementById('thumbQualitySelect');
const reverseOrderBtn = document.getElementById('reverseOrderBtn');
const resetOrderBtn = document.getElementById('resetOrderBtn');
const insertBlankBtn = document.getElementById('insertBlankBtn');   // [新增]
const duplicateBtn = document.getElementById('duplicateBtn');       // [新增]
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

// 單頁放大預覽燈箱 DOM
const previewModal = document.getElementById('previewModal');
const previewModalTitle = document.getElementById('previewModalTitle');
const previewCanvas = document.getElementById('previewCanvas');
const closePreviewBtn = document.getElementById('closePreviewBtn');

// [新增] 內建 SVG 圖示：取代文字符號與 emoji，風格一致並跟隨主題色
const ICONS = {
  up:    'M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z',
  down:  'M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z',
  close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  left:  'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z',
  right: 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z',
  zoom:  'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  grip:  'M9 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0 6.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-1.5 8a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM16.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM18 18.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z',
  cut:   'M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3h-3z',
  rotL:  'M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z',
  rotR:  'M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.47z'
};
// [新增] 選取開關：開啟時顯示「取消」與 ✕ 圖示，關閉時還原
function setSelectToggleUI(btn, on) {
  btn.classList.toggle('active', on);
  const label = btn.querySelector('.btn-text');
  const path = btn.querySelector('svg path');
  if (!btn.dataset.idleLabel) {
    btn.dataset.idleLabel = label.textContent;
    btn.dataset.idlePath = path.getAttribute('d');
  }
  label.textContent = on ? '取消' : btn.dataset.idleLabel;
  path.setAttribute('d', on ? ICONS.close : btn.dataset.idlePath);
}

function setIcon(el, name, size = 16) {
  el.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="currentColor" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
}

// 一般網頁版：固定使用滿版模式，並載入上次選擇的主題
const isTabMode = true;
document.body.classList.add('tab-mode');
{
  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem('pdf_tool_theme') || 'light'; } catch (e) {}
  applyTheme(savedTheme);
  themeSelect.value = savedTheme;
}

function applyTheme(themeName) {
  document.body.classList.remove('theme-light', 'theme-gray', 'theme-dark');
  document.body.classList.add(`theme-${themeName}`);
}

themeSelect.addEventListener('change', (e) => {
  const chosen = e.target.value;
  applyTheme(chosen);
  try { localStorage.setItem('pdf_tool_theme', chosen); } catch (e) {}
});

const brandToggle = document.getElementById('brandToggle');
const sidebarMenuSep = document.getElementById('sidebarMenuSep');

// 側邊欄只在「調動」模式使用：設定選單的項目與標題點擊都只在該模式生效
function toggleReorderSidebar() {
  if (currentTab !== 'reorder') return;
  const isHidden = reorderSidebar.classList.toggle('hidden');
  toggleSidebarBtn.classList.toggle('active', !isHidden);
  if (!isHidden) renderReorderPages();                       // [效能] 側欄收合時不建立，展開時才補建
  else { sidebarThumbList.replaceChildren(); sideEls = []; } // 收合時釋放
  if (reorderPageList.dataset.cols) {
    applyColumnPreset(parseInt(reorderPageList.dataset.cols, 10));
  }
}

function updateSidebarToggleVisibility() {
  const inReorder = currentTab === 'reorder';
  toggleSidebarBtn.classList.toggle('hidden', !inReorder);
  if (sidebarMenuSep) sidebarMenuSep.classList.toggle('hidden', !inReorder);
  brandToggle.classList.toggle('clickable', inReorder);
  brandToggle.title = inReorder ? '烏衣行 PDF（點擊：開啟 / 關閉側邊欄）' : '烏衣行 PDF';
}

toggleSidebarBtn.addEventListener('click', toggleReorderSidebar);
brandToggle.addEventListener('click', toggleReorderSidebar);

openFileBtn.addEventListener('click', () => fileInput.click());

// =========================================
// 工具列下拉選單：點按鈕展開，點選項 / 點外面 / Esc / 捲動 / 縮放視窗時收起
// =========================================
const menuPairs = [
  { btn: document.getElementById('fileMenuBtn'), panel: document.getElementById('fileMenu'), align: 'left' },
  { btn: document.getElementById('pageMenuBtn'), panel: document.getElementById('pageMenu') },
  { btn: document.getElementById('settingsMenuBtn'), panel: document.getElementById('settingsMenu') },
  { btn: document.getElementById('rangeMenuBtn'), panel: document.getElementById('rangeMenu') },   // [新增]
  { btn: document.getElementById('zoomModeLabel'), panel: document.getElementById('zoomMenu') },    // [新增] 比例選單
  { btn: document.getElementById('thumbQualityBtn'), panel: document.getElementById('thumbQualityMenu') }   // [新增] 縮圖清晰度選單
];

function closeMenus(returnFocus = false) {
  menuPairs.forEach(({ btn, panel }) => {
    if (!panel.classList.contains('hidden')) {
      panel.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
      if (returnFocus) btn.focus();
    }
  });
}

function openMenu({ btn, panel, align }) {
  closeMenus();
  closeFileFilterMenu();
  panel.classList.remove('hidden');
  btn.setAttribute('aria-expanded', 'true');
  const r = btn.getBoundingClientRect();
  const w = panel.offsetWidth;
  panel.style.top = `${r.bottom + 4}px`;
  const x = align === 'left' ? r.left : r.right - w;   // 預設與按鈕右緣對齊；檔案選單改為左緣對齊
  panel.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, x))}px`;   // 並限制在視窗內
}

menuPairs.forEach((pair) => {
  pair.btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (pair.panel.classList.contains('hidden')) {
      openMenu(pair);
      if (pair.panel === rangeMenu) { rangeSelectInput.focus(); rangeSelectInput.select(); }   // [新增]
    } else closeMenus();
  });
  pair.panel.addEventListener('click', (e) => {
    // 點到選項（含 disabled 以外的按鈕）後收起；原本各按鈕的點擊處理照常執行
    if (e.target.closest('.menu-item:not(:disabled)')) closeMenus();
  });
  pair.panel.addEventListener('keydown', (e) => {
    const items = Array.from(pair.panel.querySelectorAll('.menu-item:not(:disabled)'));
    if (!items.length) return;                     // [新增] 頁碼範圍面板沒有選單項目
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  });
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-wrap')) closeMenus();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuPairs.some(p => !p.panel.classList.contains('hidden'))) {
    e.preventDefault();
    closeMenus(true);
  }
}, true);
window.addEventListener('resize', () => closeMenus());
document.querySelector('.topbar').addEventListener('scroll', () => closeMenus());


// =========================================
// 即時縮放控制 與 點擊比例按鈕開啟選單（檢視模式：單頁／雙頁／四頁；縮放比例：35%～400%）
// =========================================
function applyContinuousZoom(val) {
  const minVal = parseInt(thumbSizeSlider.min, 10);
  const maxVal = parseInt(thumbSizeSlider.max, 10);
  const clamped = Math.max(minVal, Math.min(maxVal, val));
  thumbSizeSlider.value = clamped;

  delete reorderPageList.dataset.cols;
  reorderPageList.style.setProperty('--thumb-width', `${clamped}px`);
  document.documentElement.style.setProperty('--thumb-width', `${clamped}px`);

  const pct = Math.round((clamped / 200) * 100);
  zoomModeLabel.textContent = `${pct}%`;
  syncZoomMenuActive();   // [新增]
}

function applyColumnPreset(cols) {
  const containerWidth = reorderPageList.clientWidth || (window.innerWidth - 60);
  const horizontalPadding = 36;
  const gap = 16;
  const availableWidth = Math.max(200, containerWidth - horizontalPadding - gap * (cols - 1));

  let targetWidth = Math.floor(availableWidth / cols);
  if (cols === 1) {
    targetWidth = Math.min(targetWidth, 820);
  } else if (cols === 2) {
    targetWidth = Math.min(targetWidth, 520);
  }

  const minVal = parseInt(thumbSizeSlider.min, 10);
  const maxVal = parseInt(thumbSizeSlider.max, 10);
  const clampedSliderVal = Math.max(minVal, Math.min(maxVal, targetWidth));
  thumbSizeSlider.value = clampedSliderVal;

  reorderPageList.dataset.cols = String(cols);
  reorderPageList.style.setProperty('--thumb-width', `${targetWidth}px`);
  document.documentElement.style.setProperty('--thumb-width', `${targetWidth}px`);

  const labelMap = { 1: '單頁', 2: '雙頁', 4: '四頁' };
  zoomModeLabel.textContent = labelMap[cols] || `${Math.round((targetWidth / 200) * 100)}%`;
  syncZoomMenuActive();   // [新增]
}

thumbSizeSlider.addEventListener('input', (e) => {
  applyContinuousZoom(parseInt(e.target.value, 10));
});

// [新增] 比例選單：標示目前選中的項目（✓），並處理點選
function syncZoomMenuActive() {
  const cols = reorderPageList.dataset.cols;
  const pct = Math.round((parseInt(thumbSizeSlider.value, 10) / 200) * 100);
  zoomMenu.querySelectorAll('.menu-item').forEach((item) => {
    const on = cols ? item.dataset.cols === cols : item.dataset.pct === String(pct);
    item.classList.toggle('active', on);
  });
}

zoomMenu.addEventListener('click', (e) => {
  const item = e.target.closest('.menu-item');
  if (!item) return;
  if (item.dataset.cols) applyColumnPreset(parseInt(item.dataset.cols, 10));
  else if (item.dataset.pct) applyContinuousZoom(Math.round(parseInt(item.dataset.pct, 10) / 100 * 200));
});

window.addEventListener('resize', () => {
  if (reorderPageList.dataset.cols) {
    applyColumnPreset(parseInt(reorderPageList.dataset.cols, 10));
  }
});

// =========================================
// 縮圖清晰度選單：由隱藏的 <select> 產生選項，並與它雙向同步
//   - 程式其他地方照舊讀寫 thumbQualitySelect.value / option.disabled，選單會自動跟著更新
// =========================================
const thumbQualityBtn = document.getElementById('thumbQualityBtn');
const thumbQualityMenu = document.getElementById('thumbQualityMenu');
Array.from(thumbQualitySelect.options).forEach((opt) => {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'menu-item';
  item.setAttribute('role', 'menuitemradio');
  item.dataset.q = opt.value;
  item.innerHTML = '<span class="menu-label"></span>';
  item.querySelector('.menu-label').textContent = opt.textContent;
  thumbQualityMenu.appendChild(item);
});
function syncQualityMenu() {
  const cur = thumbQualitySelect.options[thumbQualitySelect.selectedIndex];
  thumbQualityBtn.textContent = cur ? cur.textContent : '';
  thumbQualityBtn.title = thumbQualitySelect.title;
  thumbQualityMenu.querySelectorAll('.menu-item').forEach((item) => {
    const opt = Array.from(thumbQualitySelect.options).find(o => o.value === item.dataset.q);
    const on = item.dataset.q === thumbQualitySelect.value;
    item.classList.toggle('active', on);
    item.setAttribute('aria-checked', on ? 'true' : 'false');
    item.disabled = !!(opt && opt.disabled);
  });
}
{
  // 程式直接設定 select.value 時（自動等級、大檔降級）也要同步選單
  const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  Object.defineProperty(thumbQualitySelect, 'value', {
    configurable: true,
    get() { return desc.get.call(this); },
    set(v) { desc.set.call(this, v); syncQualityMenu(); }
  });
}
thumbQualityMenu.addEventListener('click', (e) => {
  const item = e.target.closest('.menu-item:not(:disabled)');
  if (!item || item.dataset.q === thumbQualitySelect.value) return;
  thumbQualitySelect.value = item.dataset.q;
  thumbQualitySelect.dispatchEvent(new Event('change'));
});
syncQualityMenu();

thumbQualitySelect.addEventListener('change', () => {
  updateThumbModeHint();
  if (reorderPages.length === 0) return;
  clearThumbnailCache();
  initThumbObserver();
  renderReorderPages();
});

// 分頁切換邏輯（以網址 hash 為準：#merge / #split / #reorder）
const VALID_TABS = ['merge', 'split', 'reorder', 'read'];

function tabFromHash() {
  const name = location.hash.replace(/^#\/?/, '').toLowerCase();
  return VALID_TABS.includes(name) ? name : null;
}

function switchTab(name) {
  if (!VALID_TABS.includes(name)) name = 'merge';
  const prevTab = currentTab;
  currentTab = name;

  // [新增] 從「調動」切到「閱讀」：跳到調動中目前選取的那一頁（對應到原檔頁碼與所屬檔案）
  if (name === 'read' && prevTab === 'reorder') {
    const cur = reorderPages[activeSidebarIndex];
    if (cur && docs.some(d => d.id === cur.docId && d.pageCount > 0)) {
      readerDocId = cur.docId;
      readerResumeIndex = cur.originalPageNum - 1;
      readerPositions.set(cur.docId, cur.originalPageNum - 1);
    }
  }

  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  tabContents.forEach(c => c.classList.toggle('active', c.id === name));
  ctxGroups.forEach(g => g.classList.toggle('active', g.id === `ctx-${name}`));

  updateSidebarToggleVisibility();
  if (name === 'split') refreshSplitView();
  if (name === 'reorder') syncReorder();
  if (name === 'read') syncReader();
  else pauseReader();                 // 離開閱讀檢視時釋放所有已繪製的頁面
  updateSaveButtonState();
}

function goToTab(name) {
  if (tabFromHash() === name) {
    switchTab(name);
  } else {
    location.hash = name; // 觸發 hashchange，並留下瀏覽紀錄（可用上一頁 / 下一頁切換）
  }
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    goToTab(btn.dataset.tab);
  });
});

window.addEventListener('hashchange', () => {
  switchTab(tabFromHash() || 'merge');
});

// 更新左上角「儲存」按鈕文字與啟用狀態（文字保持簡短以節省工具列寬度）
function updateSaveButtonState() {
  if (currentTab === 'merge') {
    if (docs.length === 0) {
      primarySaveBtn.disabled = true;
      saveBtnText.textContent = '儲存';
      return;
    }
    if (isMergeSelectionMode) {
      const selectedCount = docs.filter(item => item.selected).length;
      primarySaveBtn.disabled = selectedCount < 2;
      saveBtnText.textContent = selectedCount >= 2 ? `儲存 (${selectedCount})` : '選 2 檔';
    } else {
      primarySaveBtn.disabled = docs.length < 2;
      saveBtnText.textContent = '儲存';
    }
  } else if (currentTab === 'read') {
    primarySaveBtn.disabled = true;     // 閱讀檢視只供瀏覽，沒有可儲存的編輯
    saveBtnText.textContent = '儲存';
  } else if (currentTab === 'split') {
    primarySaveBtn.disabled = !splitItem;
    saveBtnText.textContent = '儲存';
  } else if (currentTab === 'reorder') {
    if (reorderPages.length === 0) {
      primarySaveBtn.disabled = true;
      saveBtnText.textContent = '儲存';
      return;
    }
    if (isSelectionMode) {
      const selectedCount = reorderPages.filter(p => p.selected).length;
      primarySaveBtn.disabled = selectedCount === 0;
      saveBtnText.textContent = selectedCount > 0 ? `儲存 (${selectedCount})` : '請勾選';
    } else {
      primarySaveBtn.disabled = false;
      saveBtnText.textContent = '儲存';
    }
  }
}

primarySaveBtn.addEventListener('click', async () => {
  compressOut = 0;                 // [新增] 每次儲存重新累計實際輸出大小
  if (currentJob) return;          // [新增] 已有儲存在進行中
  const job = startJob();          // [新增] 計時 + 可取消（從第一則處理訊息開始計時，不含填檔名 / 選壓縮的等待）
  try {
    if (currentTab === 'merge') {
      await executeMergeSave();
    } else if (currentTab === 'split') {
      await executeSplitSave();
    } else if (currentTab === 'reorder') {
      await executeReorderSave();
    }
  } finally {
    compressOverride = null;       // [新增] 儲存前詢問選的壓縮等級只用這一次
    endJob(job);                   // [新增]
  }
});

// [修改] 訊息分流：
//   sticky = true（載入 / 處理中）→ 右下角進度卡，不會自動消失，由下一次 setStatus 取代
//   sticky = false（一般訊息）   → 左下角提示，數秒後自動消失
const progressCard = document.getElementById('progressCard');
const progressText = document.getElementById('progressText');
const progressCancelBtn = document.getElementById('progressCancelBtn');   // [新增]
function syncProgressCard() {
  const hasText = progressText.textContent !== '';
  const hasBar = !progressBar.classList.contains('hidden');
  progressCard.classList.toggle('hidden', !hasText && !hasBar);
  // [修改] 「還有檔案在載入」或「儲存進行中」時才顯示 ✕
  const loading = docs.some(d => d.pageCount === null);
  const saving = !!(currentJob && currentJob.t0 !== null && !currentJob.cancelled);
  progressCancelBtn.classList.toggle('hidden', !(loading || saving));
  const cancelTitle = saving ? '取消儲存' : '取消載入';
  progressCancelBtn.title = cancelTitle;
  progressCancelBtn.setAttribute('aria-label', cancelTitle);
}

// [新增] 取消所有載入中的檔案（沿用 releaseDoc 流程中止讀取 / 解析 / 密碼對話框）
progressCancelBtn.addEventListener('click', () => {
  // [新增] 儲存中：取消儲存（優先）
  if (currentJob && currentJob.t0 !== null) { cancelCurrentJob(); return; }
  if (!docs.some(d => d.pageCount === null)) return;
  docs = docs.filter(d => d.pageCount !== null);
  renderMergeList();
  setStatus('已取消載入', '', false, 0);
});

// [新增] 儲存作業（合併 / 分割 / 調動）：計時 + 可取消
//  - 計時：從第一則「處理中」訊息開始，右下角每秒更新「已耗時 mm:ss」
//  - 取消：讀檔、pdf-lib 解析這類無法中途打斷的長步驟會立刻放棄等待（背景計算做完後自動丟棄結果）；
//          其餘步驟在下一個 nextFrame() 檢查點中止
let currentJob = null;
let lastStickyMsg = '';

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
function renderStickyText() {
  if (!lastStickyMsg) return;
  if (currentJob && currentJob.t0 === null) currentJob.t0 = performance.now();
  const t = currentJob ? ` · 已耗時 ${formatElapsed(performance.now() - currentJob.t0)}` : '';
  progressText.textContent = lastStickyMsg + t;
  syncProgressCard();
}
function startJob() {
  const job = { cancelled: false, t0: null, timer: 0, rejectCancel: null, cancelPromise: null };
  job.cancelPromise = new Promise((_, reject) => { job.rejectCancel = reject; });
  job.cancelPromise.catch(() => {});               // 避免沒人等待時出現未處理的 rejection
  job.timer = setInterval(renderStickyText, 1000);
  currentJob = job;
  return job;
}
function endJob(job) {
  clearInterval(job.timer);
  if (currentJob === job) currentJob = null;
  syncProgressCard();
}
function cancelCurrentJob() {
  const job = currentJob;
  if (!job || job.cancelled) return;
  job.cancelled = true;
  job.rejectCancel(makeCancelError());
  syncProgressCard();
}
// 讓長時間的 await 可以被取消：取消時立刻拋出，不必等它做完
function jobGuard(promise) {
  return currentJob ? Promise.race([promise, currentJob.cancelPromise]) : promise;
}

function setStatus(message, type = '', sticky = false, duration = 2400) {
  if (!message) {                                  // 清空：左右都收起
    // [新增] 常駐訊息（例如「已取消儲存」）不會被一般的清空動作收掉，只能由使用者按 ✕ 或被下一則訊息取代
    if (!statusMsg.classList.contains('persistent')) {
      if (statusTimeout) clearTimeout(statusTimeout);
      statusMsg.classList.add('hidden');
    }
    lastStickyMsg = '';
    progressText.textContent = '';
    syncProgressCard();
    return;
  }
  if (sticky) {                                    // 右下角：處理進度
    lastStickyMsg = message;
    renderStickyText();
    return;
  }
  lastStickyMsg = '';
  progressText.textContent = '';                   // 一般訊息會取代處理中訊息（維持原行為）
  syncProgressCard();
  if (statusTimeout) clearTimeout(statusTimeout);
  // [修改] duration = 0 → 常駐：不會自動消失，附 ✕ 讓使用者自己關閉（用在「已取消…」，避免被誤以為已完成）
  const persistent = duration === 0;
  statusMsg.replaceChildren();
  const textEl = document.createElement('span');
  textEl.className = 'status-toast-text';
  textEl.textContent = message;                    // 左下角：一般訊息
  statusMsg.appendChild(textEl);
  if (persistent) {
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'status-toast-close';
    closeBtn.title = '關閉訊息';
    closeBtn.setAttribute('aria-label', '關閉訊息');
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    closeBtn.addEventListener('click', () => statusMsg.classList.add('hidden'));
    statusMsg.appendChild(closeBtn);
  }
  statusMsg.className = `status-toast ${type}${persistent ? ' persistent' : ''}`;
  if (!persistent) {
    statusTimeout = setTimeout(() => {
      statusMsg.classList.add('hidden');
    }, duration);
  }
}

// 進度條（現在位於右下角進度卡內）
const progressBar = document.getElementById('progressBar');
const progressFill = progressBar.querySelector('.progress-fill');
function setProgress(done, total) {
  progressBar.classList.remove('hidden', 'indeterminate');
  progressFill.style.width = `${total > 0 ? Math.round((done / total) * 100) : 0}%`;
  syncProgressCard();
}
// [新增] 不知道要多久時（例如 pdf.js 解析大檔）：色線條來回滑動
function setProgressIndeterminate() {
  progressBar.classList.remove('hidden');
  progressBar.classList.add('indeterminate');
  progressFill.style.width = '';
  syncProgressCard();
}
function clearProgress() {
  progressBar.classList.add('hidden');
  progressBar.classList.remove('indeterminate');
  progressFill.style.width = '0%';
  syncProgressCard();
}
// 讓出主執行緒，讓進度畫面有機會更新
// [修改] 同時是「取消儲存」的檢查點：使用者按了 ✕ 就在這裡中止
let lastYieldAt = 0;
const nextFrame = () => new Promise(resolve => setTimeout(resolve, 0)).then(() => {
  lastYieldAt = performance.now();
  if (currentJob && currentJob.cancelled) throw makeCancelError();
});
// [優化] 熱迴圈（逐頁 / 每頁組裝）專用：距離上次讓出不到 40 ms 就不讓出，只檢查取消。
// 數千次迴圈若每圈都 setTimeout(0)，瀏覽器會把巢狀計時器夾到至少 4 ms，光等待就多花數十秒。
function maybeYield() {
  if (currentJob && currentJob.cancelled) return Promise.reject(makeCancelError());
  if (performance.now() - lastYieldAt < 40) return Promise.resolve();
  return nextFrame();
}

function downloadBlob(bytes, filename, mime = 'application/pdf') {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// =======================
// 儲存前可編輯檔名（偏好會記在 localStorage）
// =======================
const ASK_FILENAME_KEY = 'pdf_tool_ask_filename';
const askNameBtn = document.getElementById('askNameBtn');
const filenameModal = document.getElementById('filenameModal');
const filenameModalTitle = document.getElementById('filenameModalTitle');
const filenameInput = document.getElementById('filenameInput');
const filenameExt = document.getElementById('filenameExt');
const filenameError = document.getElementById('filenameError');
const askFilenameCheck = document.getElementById('askFilenameCheck');
const filenameOkBtn = document.getElementById('filenameOkBtn');
const filenameCancelBtn = document.getElementById('filenameCancelBtn');

let askFilenameEnabled = true;
try { askFilenameEnabled = localStorage.getItem(ASK_FILENAME_KEY) !== '0'; } catch (e) {}
let filenameResolver = null;
let filenameCurrentExt = 'pdf';

function setAskFilenameEnabled(on) {
  askFilenameEnabled = on;
  try { localStorage.setItem(ASK_FILENAME_KEY, on ? '1' : '0'); } catch (e) {}
  askNameBtn.classList.toggle('active', on);
}
setAskFilenameEnabled(askFilenameEnabled);

askNameBtn.addEventListener('click', () => {
  setAskFilenameEnabled(!askFilenameEnabled);
  setStatus(askFilenameEnabled ? '已開啟：儲存前會詢問檔名' : '已關閉：儲存時直接使用自動檔名');
});

// 移除檔名不允許的字元、結尾的副檔名與句點 / 空白
function sanitizeFileName(raw, ext) {
  return raw
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .trim()
    .replace(new RegExp('\\.' + ext + '$', 'i'), '')
    .replace(/[\s.]+$/g, '')
    .trim();
}

// 回傳完整檔名（含副檔名）；使用者取消回傳 null；偏好關閉時直接回傳自動檔名
function askFileName(defaultBase, ext = 'pdf', title = '儲存檔案') {
  if (!askFilenameEnabled) return Promise.resolve(`${defaultBase}.${ext}`);
  if (filenameResolver) return Promise.resolve(null);   // 已有對話框開啟中

  return new Promise((resolve) => {
    filenameResolver = resolve;
    filenameCurrentExt = ext;
    filenameModalTitle.textContent = title;
    filenameExt.textContent = `.${ext}`;
    filenameInput.value = defaultBase;
    filenameError.classList.add('hidden');
    askFilenameCheck.checked = true;
    filenameModal.classList.remove('hidden');
    filenameInput.focus();
    filenameInput.select();
  });
}

function closeFilenameModal(result) {
  filenameModal.classList.add('hidden');
  const resolve = filenameResolver;
  filenameResolver = null;
  if (resolve) resolve(result);
}

function confirmFilename() {
  const base = sanitizeFileName(filenameInput.value, filenameCurrentExt);
  if (!base) {
    filenameError.textContent = '檔名不可為空白';
    filenameError.classList.remove('hidden');
    filenameInput.focus();
    return;
  }
  if (!askFilenameCheck.checked) {
    setAskFilenameEnabled(false);
    setStatus('已關閉「儲存前詢問檔名」，可從工具列 ✎ 重新開啟');
  }
  closeFilenameModal(`${base}.${filenameCurrentExt}`);
}

filenameOkBtn.addEventListener('click', confirmFilename);
filenameCancelBtn.addEventListener('click', () => closeFilenameModal(null));
filenameModal.addEventListener('mousedown', (e) => {
  if (e.target === filenameModal) closeFilenameModal(null);
});
filenameModal.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) {      // 輸入法選字時的 Enter 不算確認
    e.preventDefault();
    confirmFilename();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeFilenameModal(null);
  }
});

// =======================
// [新增] 加密 PDF 的密碼輸入對話框
// =======================
const passwordModal = document.getElementById('passwordModal');
const passwordFileLabel = document.getElementById('passwordFileLabel');
const passwordInput = document.getElementById('passwordInput');
const passwordError = document.getElementById('passwordError');
const passwordOkBtn = document.getElementById('passwordOkBtn');
const passwordSkipBtn = document.getElementById('passwordSkipBtn');

let passwordResolver = null;
let passwordOwner = null;                // [新增] 目前對話框在詢問哪個檔案（該檔被取消 / 移除時要自動關閉對話框）
let passwordQueue = Promise.resolve();   // 一次只開一個對話框；同時載入多個加密檔時依序詢問

// 回傳使用者輸入的密碼；按「略過此檔」/ Esc 回傳 null
// [修改] 參數由檔名改為檔案庫項目 item，才能在排隊期間得知該檔是否已被取消
function askPassword(item, wrongBefore = false) {
  const task = () => new Promise((resolve) => {
    if (item.cancelled) { resolve(null); return; }   // [新增] 排隊等待時已被取消：不再跳出對話框
    passwordResolver = resolve;
    passwordOwner = item;
    passwordFileLabel.textContent = `檔案：${item.name}`;
    passwordInput.value = '';
    passwordError.textContent = '密碼不正確，請再試一次';
    passwordError.classList.toggle('hidden', !wrongBefore);
    passwordModal.classList.remove('hidden');
    passwordInput.focus();
  });
  const result = passwordQueue.then(task);
  passwordQueue = result.catch(() => {});
  return result;
}

function closePasswordModal(result) {
  passwordModal.classList.add('hidden');
  passwordInput.value = '';              // [新增] 不在輸入框裡殘留密碼
  const resolve = passwordResolver;
  passwordResolver = null;
  passwordOwner = null;                  // [新增]
  if (resolve) resolve(result);
}

function confirmPassword() {
  if (!passwordInput.value) {
    passwordError.textContent = '請輸入密碼';
    passwordError.classList.remove('hidden');
    passwordInput.focus();
    return;
  }
  closePasswordModal(passwordInput.value);
}

passwordOkBtn.addEventListener('click', confirmPassword);
passwordSkipBtn.addEventListener('click', () => closePasswordModal(null));
passwordModal.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) {
    e.preventDefault();
    confirmPassword();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closePasswordModal(null);
  }
});


// =======================
// [新增] 頁碼功能：儲存時把頁碼寫進輸出的 PDF（設定記在 localStorage）
// =======================
const PAGE_NUM_KEY = 'pdf_tool_page_numbers';
const PAGE_NUM_DEFAULTS = {
  enabled: false, position: 'bc', format: 'n',
  start: 1, size: 11, margin: 28, skipFirst: false
};
let pageNumSettings = { ...PAGE_NUM_DEFAULTS };
try {
  const saved = JSON.parse(localStorage.getItem(PAGE_NUM_KEY) || 'null');
  if (saved && typeof saved === 'object') pageNumSettings = { ...PAGE_NUM_DEFAULTS, ...saved };
} catch (e) {}

const pageNumBtn = document.getElementById('pageNumBtn');
const pageNumModal = document.getElementById('pageNumModal');
const pnEnable = document.getElementById('pnEnable');
const pnPosition = document.getElementById('pnPosition');
const pnFormat = document.getElementById('pnFormat');
const pnStart = document.getElementById('pnStart');
const pnSize = document.getElementById('pnSize');
const pnMargin = document.getElementById('pnMargin');
const pnSkipFirst = document.getElementById('pnSkipFirst');
const pnSample = document.getElementById('pnSample');
const pnOkBtn = document.getElementById('pnOkBtn');
const pnCancelBtn = document.getElementById('pnCancelBtn');

function formatPageNumber(fmt, n, total) {
  switch (fmt) {
    case 'dash':    return `- ${n} -`;
    case 'nOfN':    return `${n} / ${total}`;
    case 'page':    return `Page ${n}`;
    case 'pageOfN': return `Page ${n} of ${total}`;
    default:        return `${n}`;
  }
}

function refreshPageNumBtn() {
  pageNumBtn.classList.toggle('active', pageNumSettings.enabled);
  pageNumBtn.title = `頁碼設定：儲存時在每一頁加上頁碼（${pageNumSettings.enabled ? '開' : '關'}）`;
}
refreshPageNumBtn();

// 把表單內容讀成設定物件（數字欄位做範圍檢查）
function readPageNumForm() {
  const num = (el, min, max, fallback) => {
    const v = parseInt(el.value, 10);
    return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
  };
  return {
    enabled: pnEnable.checked,
    position: pnPosition.value,
    format: pnFormat.value,
    start: num(pnStart, 0, 99999, 1),
    size: num(pnSize, 6, 48, 11),
    margin: num(pnMargin, 0, 200, 28),
    skipFirst: pnSkipFirst.checked
  };
}

function updatePageNumSample() {
  const s = readPageNumForm();
  pnSample.textContent = formatPageNumber(s.format, s.start, s.start + 9);
}

function openPageNumModal() {
  pnEnable.checked = pageNumSettings.enabled;
  pnPosition.value = pageNumSettings.position;
  pnFormat.value = pageNumSettings.format;
  pnStart.value = pageNumSettings.start;
  pnSize.value = pageNumSettings.size;
  pnMargin.value = pageNumSettings.margin;
  pnSkipFirst.checked = pageNumSettings.skipFirst;
  updatePageNumSample();
  pageNumModal.classList.remove('hidden');
  pnEnable.focus();
}

function closePageNumModal() {
  pageNumModal.classList.add('hidden');
}

function confirmPageNum() {
  pageNumSettings = readPageNumForm();
  try { localStorage.setItem(PAGE_NUM_KEY, JSON.stringify(pageNumSettings)); } catch (e) {}
  refreshPageNumBtn();
  closePageNumModal();
  setStatus(pageNumSettings.enabled ? '已開啟：儲存時會加入頁碼' : '已關閉頁碼');
}

pageNumBtn.addEventListener('click', openPageNumModal);
pnOkBtn.addEventListener('click', confirmPageNum);
pnCancelBtn.addEventListener('click', closePageNumModal);
pageNumModal.addEventListener('mousedown', (e) => {
  if (e.target === pageNumModal) closePageNumModal();
});
pageNumModal.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing && e.target.tagName !== 'SELECT') {
    e.preventDefault();
    confirmPageNum();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closePageNumModal();
  }
});
[pnPosition, pnFormat, pnStart, pnSize, pnMargin].forEach(el => {
  el.addEventListener('input', updatePageNumSample);
});

// 在 pdf-lib 文件的每一頁畫上頁碼。
//  offset：此文件第 1 頁在「完整頁碼序列」中的位移（逐頁 / 每 N 頁拆分時沿用原檔頁碼）
//  total ：「1 / N」格式用的總頁數（預設為此文件的頁數）
// 會處理頁面本身的 /Rotate 與裁切框，確保頁碼永遠出現在「畫面上」的指定位置。
async function applyPageNumbers(pdfDoc, offset = 0, total = null) {
  const s = pageNumSettings;
  if (!s.enabled) return;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const totalLabel = total !== null ? total : pages.length;
  const lastNumber = s.start + totalLabel - 1;

  pages.forEach((page, i) => {
    if (s.skipFirst && offset + i === 0) return;

    const text = formatPageNumber(s.format, s.start + offset + i, lastNumber);
    const textW = font.widthOfTextAtSize(text, s.size);

    // 頁面的實際可見區域與顯示旋轉
    const box = page.getCropBox();
    const rot = (((page.getRotation().angle || 0) % 360) + 360) % 360;
    const swap = rot === 90 || rot === 270;
    const visW = swap ? box.height : box.width;     // 畫面上的寬 / 高
    const visH = swap ? box.width : box.height;

    // 先算出「畫面座標」（原點在畫面左下角）
    const hAlign = s.position[1];                    // l / c / r
    const vAlign = s.position[0];                    // t / b
    let vx = hAlign === 'l' ? s.margin
           : hAlign === 'r' ? visW - s.margin - textW
           : (visW - textW) / 2;
    let vy = vAlign === 't' ? visH - s.margin - s.size : s.margin;
    vx = Math.max(0, vx);
    vy = Math.max(0, vy);

    // 再換算回頁面原始座標，文字方向跟著旋轉
    let x, y;
    if (rot === 90)       { x = box.width - vy;  y = vx; }
    else if (rot === 180) { x = box.width - vx;  y = box.height - vy; }
    else if (rot === 270) { x = vy;              y = box.height - vx; }
    else                  { x = vx;              y = vy; }

    page.drawText(text, {
      x: box.x + x,
      y: box.y + y,
      size: s.size,
      font,
      color: rgb(0.1, 0.1, 0.1),
      rotate: degrees(rot)
    });
  });
}

// =======================
// [新增] 縮小檔案：儲存時重新壓縮 JPEG 影像 + 使用 Object Streams
// =======================
// 說明：
//  - 一律以 useObjectStreams 儲存（把大量小物件打包壓縮，結構部分變小，不影響畫質）。
//  - 選擇壓縮等級時，另外會把 PDF 內的 JPEG 影像（DCTDecode）降解析度並重新編碼。
//    只有「重新編碼後確實變小」的影像才會被替換；文字、向量、其他格式的影像維持原樣。
//  - 壓縮只作用在輸出的新檔案，載入的原檔不會被更動。
const COMPRESS_KEY = 'pdf_tool_compress';
const COMPRESS_PRESETS = {
  light:    { maxDim: 2400, quality: 0.85, desc: '影像最長邊上限 2400 px、JPEG 品質 85%。肉眼幾乎看不出差異，適合要列印的文件。' },
  standard: { maxDim: 1600, quality: 0.72, desc: '影像最長邊上限 1600 px、JPEG 品質 72%。適合螢幕閱讀與 Email 附件（建議）。' },
  strong:   { maxDim: 1100, quality: 0.55, desc: '影像最長邊上限 1100 px、JPEG 品質 55%。檔案最小，但細節會明顯變糊。' }
};
const COMPRESS_OFF_DESC = '不重新壓縮影像（仍會以 Object Streams 儲存）。';

let compressLevel = 'off';
try {
  const v = localStorage.getItem(COMPRESS_KEY);
  if (v && COMPRESS_PRESETS[v]) compressLevel = v;
} catch (e) {}

let compressSaved = 0;                       // 單次儲存作業累計「影像縮減」的位元組數
let compressOut = 0;                         // [新增] 單次儲存作業累計「實際輸出」的位元組數
let compressOverride = null;                 // [新增] 儲存前詢問時選的等級，只影響這一次儲存（null＝沿用設定）
const COMPRESS_ASK_KEY = 'pdf_tool_compress_ask';
const COMPRESS_LAST_KEY = 'pdf_tool_compress_last';
const LARGE_SAVE_PROMPT_BYTES = 20 * 1024 * 1024;   // [新增] 預估輸出達這個大小才會在儲存前詢問
let askCompressEnabled = true;
let lastPromptLevel = 'off';
try {
  askCompressEnabled = localStorage.getItem(COMPRESS_ASK_KEY) !== '0';
  const lp = localStorage.getItem(COMPRESS_LAST_KEY);
  if (lp && (lp === 'off' || COMPRESS_PRESETS[lp])) lastPromptLevel = lp;
} catch (e) {}
const imageOptCache = new WeakMap();         // 以原始影像位元組為鍵，同一張圖在同一等級只處理一次（逐頁 / 每 N 頁拆分時很有用）

const compressBtn = document.getElementById('compressBtn');
const compressModal = document.getElementById('compressModal');
const cmpLevel = document.getElementById('cmpLevel');
const cmpDesc = document.getElementById('cmpDesc');
const cmpOkBtn = document.getElementById('cmpOkBtn');
const cmpCancelBtn = document.getElementById('cmpCancelBtn');
const cmpModalTitle = document.getElementById('cmpModalTitle');
const cmpAskCheck = document.getElementById('cmpAskCheck');
const cmpEstimateWrap = document.getElementById('cmpEstimateWrap');
const cmpEstimateBtn = document.getElementById('cmpEstimateBtn');
const cmpEstimateList = document.getElementById('cmpEstimateList');
const cmpEstimateNote = document.getElementById('cmpEstimateNote');

const CMP_LEVEL_NAMES = { off: '不壓縮', light: '輕度', standard: '標準', strong: '強力' };

function formatBytes(n) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

// 取出並歸零本次作業的壓縮摘要，附加在成功訊息後面
function takeCompressNote() {
  const n = compressSaved;
  const out = compressOut;
  compressSaved = 0;
  compressOut = 0;
  const parts = [];
  if (n > 0) parts.push(`影像縮減約 ${formatBytes(n)}`);
  if (out > 0) parts.push(`輸出 ${formatBytes(out)}`);      // [新增] 顯示實際輸出大小，可對照預估
  return parts.length ? `（${parts.join('，')}）` : '';
}

function refreshCompressBtn() {
  const on = compressLevel !== 'off';
  compressBtn.classList.toggle('active', on);
  const names = { light: '輕度', standard: '標準', strong: '強力' };
  compressBtn.title = `縮小檔案：儲存時重新壓縮影像（${on ? names[compressLevel] : '關'}）`;
}
refreshCompressBtn();

// ---- [新增] 儲存範圍與預估 ----
// scope = [{ item, fraction }]：要輸出的檔案，以及各檔輸出的頁數比例（調動 / 擷取只輸出部分頁面時 < 1）
function scopeBytes(scope) {
  return scope.reduce((s, x) => s + x.item.file.size * x.fraction, 0);
}

function reorderScope(pages) {
  const counts = new Map();
  const idxs = new Map();                                  // [新增] 各檔實際用到的原始頁索引（快速擷取用）
  pages.forEach(p => {
    counts.set(p.docId, (counts.get(p.docId) || 0) + 1);
    if (Number.isInteger(p.originalIndex)) {
      if (!idxs.has(p.docId)) idxs.set(p.docId, []);
      idxs.get(p.docId).push(p.originalIndex);
    }
  });
  return [...counts].map(([id, n]) => {
    const item = docs.find(d => d.id === id);
    return item ? { item, fraction: Math.min(1, n / Math.max(1, item.pageCount)), indices: idxs.get(id) || [] } : null;
  }).filter(Boolean);
}

// 目前分頁「按下儲存會輸出的內容」（設定選單開啟對話框時用）
function getCurrentSaveScope() {
  if (currentTab === 'merge') {
    const items = isMergeSelectionMode ? docs.filter(d => d.selected) : docs;
    return items.map(item => ({ item, fraction: 1 }));
  }
  if (currentTab === 'split') return splitItem ? [{ item: splitItem, fraction: 1 }] : [];
  if (currentTab === 'reorder') {
    return reorderScope(isSelectionMode ? reorderPages.filter(p => p.selected) : reorderPages);
  }
  return [];
}

let cmpMode = 'settings';          // 'settings'＝設定選單開啟（記住等級）；'save'＝大檔儲存前詢問（只影響這次）
let cmpResolver = null;            // save 模式：resolve(等級) 或 resolve(null＝取消儲存)
let cmpScope = [];
let cmpEstimateToken = 0;          // 關閉 / 重新預估時遞增，讓舊的非同步預估失效
let cmpEstimateData = null;

// 等距挑出 k 個索引（含第一個與最後一個）
function pickSampleIndexes(n, k) {
  if (n <= k) return Array.from({ length: n }, (_, i) => i);
  const set = new Set();
  for (let i = 0; i < k; i++) set.add(Math.round(i * (n - 1) / (k - 1)));
  return [...set].sort((a, b) => a - b);
}

// 取樣試壓：掃描各檔的 JPEG 影像，依大小排序後等距挑幾張，實際以三個等級各壓一次，
// 再依「各取樣所代表的影像群」的位元組數放大，推算整份的縮減量。非 JPEG 的內容視為不變。
async function estimateCompression(scope, token, onProgress) {
  const { PDFRawStream } = PDFLib;
  const levels = ['light', 'standard', 'strong'];
  const perItemK = Math.min(6, Math.max(2, Math.floor(24 / Math.max(1, scope.length))));
  const res = { orig: 0, jpeg: 0, saved: { light: 0, standard: 0, strong: 0 }, skipped: 0, sampled: 0 };

  for (let f = 0; f < scope.length; f++) {
    const { item, fraction, indices } = scope[f];
    let scale = fraction;                       // [新增] 用「只含所需頁面」的子集時，影像已是輸出內容，不需再乘比例
    if (token !== cmpEstimateToken) return null;
    res.orig += item.file.size * fraction;
    onProgress(`正在分析影像… 檔案 ${f + 1}/${scope.length}`);
    await nextFrame();

    // 不走 loadLibDoc：加密檔在那裡會被整份轉成影像，只為了預估太浪費；載入失敗的檔案直接略過
    let lib = null;
    try {
      const sub = indices && indices.length ? await tryFastSubset(item, indices, { quiet: true, isCancelled: () => token !== cmpEstimateToken }) : null;
      if (sub) {
        lib = sub.doc;
        scale = 1;
      } else {
        const bytes = await getItemBytes(item);   // [修改]
        lib = await PDFDocument.load(bytes, { updateMetadata: false, parseSpeed: LIB_PARSE_SPEED });   // [修改] 加速
      }
    } catch (e) {
      res.skipped++;
      continue;
    }

    const targets = [];
    for (const [, obj] of lib.context.enumerateIndirectObjects()) {
      if (obj instanceof PDFRawStream && obj.contents.length >= 20000 && jpegImageInfo(obj)) targets.push(obj.contents);
    }
    if (targets.length === 0) { lib = null; continue; }

    targets.sort((a, b) => b.length - a.length);
    const idxs = pickSampleIndexes(targets.length, perItemK);
    const jpegTotal = targets.reduce((s, c) => s + c.length, 0);

    for (let si = 0; si < idxs.length; si++) {
      // 這張取樣代表的影像群（以相鄰取樣的中點為界）
      const lo = si === 0 ? 0 : Math.floor((idxs[si - 1] + idxs[si]) / 2) + 1;
      const hi = si === idxs.length - 1 ? targets.length - 1 : Math.floor((idxs[si] + idxs[si + 1]) / 2);
      let stratumBytes = 0;
      for (let i = lo; i <= hi; i++) stratumBytes += targets[i].length;

      const sample = targets[idxs[si]];
      for (const lv of levels) {
        if (token !== cmpEstimateToken) return null;
        onProgress(`正在試壓影像… 檔案 ${f + 1}/${scope.length}・${si + 1}/${idxs.length}`);
        const r = await recompressJpeg(sample, COMPRESS_PRESETS[lv]);
        if (r) res.saved[lv] += (r.saved / sample.length) * stratumBytes * scale;
      }
      res.sampled++;
      await nextFrame();
    }
    res.jpeg += jpegTotal * scale;
    lib = null;
  }
  return res;
}

function estimatedBytes(level) {
  if (!cmpEstimateData) return null;
  const d = cmpEstimateData;
  return level === 'off' ? d.orig : Math.max(1, d.orig - d.saved[level]);
}

function renderCmpEstimate() {
  cmpEstimateList.replaceChildren();
  const d = cmpEstimateData;
  if (!d) return;
  for (const lv of ['off', 'light', 'standard', 'strong']) {
    const est = estimatedBytes(lv);
    const li = document.createElement('li');
    li.className = 'cmp-est-row' + (cmpLevel.value === lv ? ' selected' : '');
    li.dataset.level = lv;
    const name = document.createElement('span');
    name.textContent = CMP_LEVEL_NAMES[lv];
    const size = document.createElement('span');
    size.className = 'cmp-est-size';
    size.textContent = `約 ${formatBytes(est)}`;
    const pct = document.createElement('span');
    pct.className = 'cmp-est-pct';
    pct.textContent = lv === 'off' || d.orig <= 0 ? '' : `−${Math.round((1 - est / d.orig) * 100)}%`;
    li.append(name, size, pct);
    cmpEstimateList.appendChild(li);
  }

  const notes = [];
  if (d.orig > 0 && d.jpeg / d.orig < 0.1) {
    notes.push(d.jpeg === 0
      ? '找不到可壓縮的 JPEG 影像，壓縮幾乎不會變小。'
      : `可壓縮的 JPEG 影像只佔約 ${Math.round((d.jpeg / d.orig) * 100)}%，壓縮效果有限。`);
  }
  if (d.skipped > 0) notes.push(`有 ${d.skipped} 個檔案無法分析（例如加密檔，儲存時會轉成影像，大小可能差很多）。`);
  notes.push('預估值依取樣試壓推算，實際大小可能相差約 ±15%；儲存完成後會顯示實際大小。');
  cmpEstimateNote.textContent = notes.join(' ');
}

async function runCmpEstimate() {
  if (cmpScope.length === 0) return;
  const token = ++cmpEstimateToken;
  cmpEstimateBtn.disabled = true;
  cmpEstimateData = null;
  cmpEstimateList.replaceChildren();
  cmpEstimateNote.textContent = '預估中…';
  try {
    const data = await estimateCompression(cmpScope, token, (msg) => {
      if (token === cmpEstimateToken) cmpEstimateNote.textContent = msg;
    });
    if (!data || token !== cmpEstimateToken) return;     // 已關閉或重新預估
    cmpEstimateData = data;
    renderCmpEstimate();
  } catch (err) {
    console.error(err);
    if (token === cmpEstimateToken) cmpEstimateNote.textContent = '預估失敗，仍可直接選擇等級儲存。';
  } finally {
    if (token === cmpEstimateToken) {
      cmpEstimateBtn.disabled = false;
      cmpEstimateBtn.textContent = '重新預估';
    }
  }
}
cmpEstimateBtn.addEventListener('click', runCmpEstimate);
cmpEstimateList.addEventListener('click', (e) => {
  const row = e.target.closest('.cmp-est-row');
  if (!row) return;
  cmpLevel.value = row.dataset.level;
  updateCompressDesc();
});

function updateCompressDesc() {
  const p = COMPRESS_PRESETS[cmpLevel.value];
  cmpDesc.textContent = p ? p.desc : COMPRESS_OFF_DESC;
  if (cmpMode === 'save') cmpOkBtn.textContent = cmpLevel.value === 'off' ? '直接儲存' : '壓縮並儲存';
  if (cmpEstimateData) renderCmpEstimate();
}

function showCompressModal() {
  cmpAskCheck.checked = askCompressEnabled;
  cmpEstimateData = null;
  cmpEstimateList.replaceChildren();
  cmpEstimateBtn.disabled = false;
  cmpEstimateBtn.textContent = '預估大小';
  const hasScope = cmpScope.length > 0;
  cmpEstimateWrap.classList.toggle('hidden', !hasScope);
  if (hasScope) {
    cmpEstimateNote.textContent = cmpMode === 'save'
      ? ''
      : `目前內容約 ${formatBytes(scopeBytes(cmpScope))}；按「預估大小」可試算各等級壓縮後的大小（大檔需要數秒到數十秒）。`;
  }
  updateCompressDesc();
  compressModal.classList.remove('hidden');
  cmpLevel.focus();
  if (cmpMode === 'save' && hasScope) runCmpEstimate();     // 儲存前詢問：自動開始預估
}

// 設定選單開啟：記住等級（原本的行為）
function openCompressModal() {
  cmpMode = 'settings';
  cmpModalTitle.textContent = '縮小檔案';
  cmpOkBtn.textContent = '確定';
  cmpLevel.value = compressLevel;
  cmpScope = getCurrentSaveScope();
  showCompressModal();
}

// [新增] 大檔儲存前詢問：回傳選的等級，使用者取消儲存則回傳 null
function openCompressPrompt(scope) {
  return new Promise((resolve) => {
    cmpMode = 'save';
    cmpResolver = resolve;
    cmpModalTitle.textContent = `檔案較大（約 ${formatBytes(scopeBytes(scope))}），要壓縮後再儲存嗎？`;
    cmpLevel.value = lastPromptLevel;
    cmpScope = scope;
    showCompressModal();
  });
}

// 儲存前呼叫：回傳 false＝使用者取消儲存。只有「預估輸出大」且「設定沒有固定壓縮等級」且「沒關閉詢問」才會跳出
async function promptCompressForSave(scope) {
  compressOverride = null;
  if (!askCompressEnabled || compressLevel !== 'off' || scope.length === 0) return true;
  if (scopeBytes(scope) < LARGE_SAVE_PROMPT_BYTES) return true;
  if (cmpResolver) return false;
  const level = await openCompressPrompt(scope);
  if (level === null) return false;
  compressOverride = level;
  return true;
}

function closeCompressModal() {
  cmpEstimateToken++;                          // 取消進行中的預估
  compressModal.classList.add('hidden');
  const resolve = cmpResolver;
  cmpResolver = null;
  if (resolve) resolve(null);                  // save 模式下關閉＝取消儲存
}

function saveAskCompressPref() {
  const on = cmpAskCheck.checked;
  if (on === askCompressEnabled) return;
  askCompressEnabled = on;
  try { localStorage.setItem(COMPRESS_ASK_KEY, on ? '1' : '0'); } catch (e) {}
  if (!on) setStatus('已關閉「大檔案儲存前詢問壓縮」，可從設定 ⚙ → 縮小檔案重新開啟');
}

function confirmCompress() {
  const chosen = COMPRESS_PRESETS[cmpLevel.value] ? cmpLevel.value : 'off';
  saveAskCompressPref();
  if (cmpMode === 'save') {
    lastPromptLevel = chosen;
    try { localStorage.setItem(COMPRESS_LAST_KEY, chosen); } catch (e) {}
    cmpEstimateToken++;
    compressModal.classList.add('hidden');
    const resolve = cmpResolver;
    cmpResolver = null;
    if (resolve) resolve(chosen);              // 只影響這一次儲存，不改動設定中的等級
    return;
  }
  compressLevel = chosen;
  try { localStorage.setItem(COMPRESS_KEY, compressLevel); } catch (e) {}
  refreshCompressBtn();
  closeCompressModal();
  setStatus(compressLevel === 'off' ? '已關閉影像壓縮' : '已開啟：儲存時會壓縮影像');
}

compressBtn.addEventListener('click', openCompressModal);
cmpOkBtn.addEventListener('click', confirmCompress);
cmpCancelBtn.addEventListener('click', closeCompressModal);
cmpLevel.addEventListener('change', updateCompressDesc);
compressModal.addEventListener('mousedown', (e) => {
  if (e.target === compressModal) closeCompressModal();
});
compressModal.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing && e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') {
    e.preventDefault();
    confirmCompress();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeCompressModal();
  }
});

// 判斷這個 PDF 物件是不是「可安全重新壓縮的 JPEG 影像」；是則回傳資訊，否則 null
// 只處理 8 bit 的 DeviceRGB / DeviceGray / ICCBased(1 或 3 色)，其餘（CMYK、Indexed、色鍵遮罩、Decode 反轉等）一律略過
function jpegImageInfo(stream) {
  const { PDFName, PDFArray, PDFNumber, PDFRawStream } = PDFLib;
  if (!(stream instanceof PDFRawStream)) return null;
  const d = stream.dict;

  const sub = d.lookup(PDFName.of('Subtype'));
  if (!(sub instanceof PDFName) || sub.asString() !== '/Image') return null;

  let filter = d.lookup(PDFName.of('Filter'));
  if (filter instanceof PDFArray) {
    if (filter.size() !== 1) return null;
    filter = filter.lookup(0);
  }
  if (!(filter instanceof PDFName) || filter.asString() !== '/DCTDecode') return null;

  if (d.has(PDFName.of('Decode')) || d.has(PDFName.of('ImageMask'))) return null;
  if (d.lookup(PDFName.of('Mask')) instanceof PDFArray) return null;

  const bpc = d.lookup(PDFName.of('BitsPerComponent'));
  if (!(bpc instanceof PDFNumber) || bpc.asNumber() !== 8) return null;

  const cs = d.lookup(PDFName.of('ColorSpace'));
  let comps = 0;
  if (cs instanceof PDFName) {
    const n = cs.asString();
    comps = n === '/DeviceRGB' ? 3 : n === '/DeviceGray' ? 1 : 0;
  } else if (cs instanceof PDFArray && cs.size() >= 2) {
    const head = cs.lookup(0);
    if (head instanceof PDFName && head.asString() === '/ICCBased') {
      const prof = cs.lookup(1);
      const nObj = prof && prof.dict ? prof.dict.lookup(PDFName.of('N')) : null;
      comps = nObj instanceof PDFNumber ? nObj.asNumber() : 0;
    }
  }
  if (comps !== 1 && comps !== 3) return null;

  return { comps };
}

async function decodeJpegBitmap(bytes) {
  const blob = new Blob([bytes], { type: 'image/jpeg' });
  try {
    return await createImageBitmap(blob, { imageOrientation: 'none' });   // PDF 不套用 EXIF 方向
  } catch (e) {
    return await createImageBitmap(blob);
  }
}

function canvasToJpegBytes(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(async (b) => resolve(b ? new Uint8Array(await b.arrayBuffer()) : null), 'image/jpeg', quality);
  });
}

// 解碼 → 縮小 → 重新編碼；沒有明顯變小（至少省 5%）就回傳 null（保留原圖）
async function recompressJpeg(bytes, preset) {
  let bmp;
  try {
    bmp = await decodeJpegBitmap(bytes);
  } catch (e) {
    return null;
  }
  try {
    const longest = Math.max(bmp.width, bmp.height);
    const scale = longest > preset.maxDim ? preset.maxDim / longest : 1;
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, w, h);

    const out = await canvasToJpegBytes(canvas, preset.quality);
    canvas.width = 0;
    canvas.height = 0;

    if (!out || out.length >= bytes.length * 0.95) return null;
    return { bytes: out, w, h, saved: bytes.length - out.length };
  } finally {
    if (bmp && bmp.close) bmp.close();
  }
}

// 掃描 pdf-lib 文件內所有 JPEG 影像並就地替換為較小的版本；回傳省下的位元組數
async function optimizeImages(pdfDoc, preset, presetKey, quiet) {
  const { PDFName, PDFNumber, PDFDict, PDFRawStream } = PDFLib;
  const ctx = pdfDoc.context;

  const targets = [];
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream && obj.contents.length >= 20000) {   // 太小的圖不值得處理
      const info = jpegImageInfo(obj);
      if (info) targets.push({ ref, obj, info });
    }
  }

  const SKIP = new Set(['/Length', '/Filter', '/DecodeParms', '/DL', '/Width', '/Height', '/ColorSpace', '/BitsPerComponent']);
  let saved = 0;

  for (let i = 0; i < targets.length; i++) {
    const { ref, obj, info } = targets[i];
    if (!quiet) setStatus(`正在壓縮影像… ${i + 1}/${targets.length}`, '', true);

    let cached = imageOptCache.get(obj.contents);
    if (!cached) {
      cached = {};
      imageOptCache.set(obj.contents, cached);
    }
    if (!(presetKey in cached)) cached[presetKey] = await recompressJpeg(obj.contents, preset);
    const res = cached[presetKey];

    if (res) {
      const dict = PDFDict.withContext(ctx);
      for (const [k, v] of obj.dict.entries()) {
        if (!SKIP.has(k.asString())) dict.set(k, v);       // 保留 Type / Subtype / SMask / Intent 等其他欄位
      }
      dict.set(PDFName.of('Width'), PDFNumber.of(res.w));
      dict.set(PDFName.of('Height'), PDFNumber.of(res.h));
      dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
      dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
      // 3 色維持原本的色彩空間（含 ICC）；灰階影像經 canvas 會變成 RGB，故改標為 DeviceRGB
      dict.set(PDFName.of('ColorSpace'),
        info.comps === 3 ? obj.dict.get(PDFName.of('ColorSpace')) : PDFName.of('DeviceRGB'));
      dict.set(PDFName.of('Length'), PDFNumber.of(res.bytes.length));
      ctx.assign(ref, PDFRawStream.of(dict, res.bytes));
      saved += res.saved;
    }

    await maybeYield();
  }
  return saved;
}

// 所有「輸出前」的收尾：頁碼 → （選用）影像壓縮 → 以 Object Streams 儲存
// quiet = true 時不更新狀態文字（逐頁 / 每 N 頁拆分時由外層顯示進度）
async function finalizePdf(pdfDoc, offset = 0, total = null, quiet = false) {
  await applyPageNumbers(pdfDoc, offset, total);

  const level = compressOverride || compressLevel;       // [修改] 儲存前詢問選的等級優先
  const preset = COMPRESS_PRESETS[level];
  if (preset) {
    compressSaved += await optimizeImages(pdfDoc, preset, level, quiet);
  }

  if (!quiet) {
    setStatus('正在產生檔案…', '', true);
    await nextFrame();
  }
  const out = await jobGuard(pdfDoc.save({ useObjectStreams: true }));   // [修改] 可取消
  compressOut += out.length;                              // [新增]
  return out;
}

// =======================
// 簡易 ZIP 打包器（僅儲存、不壓縮；PDF 本身已壓縮，再壓縮效益很小）
// =======================
// [優化] CRC32：slice-by-4（一次處理 4 個位元組，約比逐位元組快 3～4 倍）
const CRC32_TABLE = (() => {
  const t = new Uint32Array(256 * 4);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  for (let n = 0; n < 256; n++) {
    let c = t[n];
    for (let k = 1; k < 4; k++) {
      c = t[c & 255] ^ (c >>> 8);
      t[k * 256 + n] = c >>> 0;
    }
  }
  return t;
})();

function crc32Update(crc, bytes, start, end) {
  const T = CRC32_TABLE;
  let c = crc, i = start;
  for (const stop = end - 3; i < stop; i += 4) {
    c ^= bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24);
    c = T[768 + (c & 255)] ^ T[512 + ((c >>> 8) & 255)] ^ T[256 + ((c >>> 16) & 255)] ^ T[c >>> 24];
  }
  for (; i < end; i++) c = T[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  return c;
}

function crc32(bytes) {
  return (crc32Update(0xFFFFFFFF, bytes, 0, bytes.length) ^ 0xFFFFFFFF) >>> 0;
}

// [優化] 大資料分塊計算，每 8 MB 讓出一次主執行緒（畫面與計時不凍結，也可按 ✕ 取消）
async function crc32Async(bytes) {
  const STEP = 8 * 1024 * 1024;
  if (bytes.length <= STEP) return crc32(bytes);
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i += STEP) {
    c = crc32Update(c, bytes, i, Math.min(bytes.length, i + STEP));
    await nextFrame();
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// entries: [{ name: string, data: Uint8Array }] → Blob (application/zip)
async function buildZip(entries) {
  const MAX = 0xFFFFFFFF;
  const encoder = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  const chunks = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const size = entry.data.length;
    const crc = await crc32Async(entry.data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);        // 解壓所需版本
    local.setUint16(6, 0x0800, true);    // 旗標：檔名為 UTF-8
    local.setUint16(8, 0, true);         // 壓縮方式：僅儲存
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true);
    local.setUint32(22, size, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);
    chunks.push(new Uint8Array(local.buffer), nameBytes, entry.data);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, dosTime, true);
    cd.setUint16(14, dosDate, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, size, true);
    cd.setUint32(24, size, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), nameBytes);

    offset += 30 + nameBytes.length + size;
    if (offset > MAX) throw new Error('檔案總量超過 4 GB，無法打包成 ZIP');
  }

  const cdSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}

// =======================
// 1. 合併 PDF 功能 (支援各檔案頁數、勾選合併、勾選刪除)
// =======================
fileInput.addEventListener('change', (e) => {
  addFiles(Array.from(e.target.files));
  fileInput.value = '';
});

// 載入後的預設檢視偏好：auto（單檔→調動、多檔→合併）/ merge / reorder
// 舊版曾存成 list / preview，這裡自動轉成新值
const LEGACY_OPEN_VIEW = { list: 'merge', preview: 'reorder' };
function getOpenViewPref() {
  try {
    const raw = localStorage.getItem(OPEN_VIEW_KEY) || 'auto';
    const v = LEGACY_OPEN_VIEW[raw] || raw;
    if (v !== raw) localStorage.setItem(OPEN_VIEW_KEY, v);
    return ['auto', 'merge', 'reorder'].includes(v) ? v : 'auto';
  } catch (e) { return 'auto'; }
}

// 只在「儲存」時才用 pdf-lib 載入檔案（載入檔案時改用 pdf.js 取頁數，速度快很多）
// 位元組直接向 pdf.js 取回（getData），不再另外讀一份檔案；取不到時才退回重新讀檔
// [新增] pdf-lib 解析速度：預設每 100 個物件就讓出一次主執行緒，幾十萬個物件的大檔光是排程就拖很久
// 改成每 1500 個物件讓出一次（約快 10 倍以上），畫面與計時仍可更新、可取消
const LIB_PARSE_SPEED = PDFLib.ParseSpeeds ? PDFLib.ParseSpeeds.Fast : undefined;

async function loadLibDoc(item) {
  const shortName = item.name.length > 30 ? `${item.name.slice(0, 27)}…` : item.name;
  setStatus(`正在讀取「${shortName}」(${formatBytes(item.file.size)})…`, '', true);
  const bytes = await jobGuard(getItemBytes(item));   // [修改] 大檔按需讀取時直接讀原檔；可取消
  setStatus(`正在解析「${shortName}」的 PDF 結構…（大檔需要較久，可按 ✕ 取消）`, '', true);
  await nextFrame();
  try {
    return await jobGuard(PDFDocument.load(bytes, { parseSpeed: LIB_PARSE_SPEED }));   // [修改] 加速 + 可取消
  } catch (err) {
    if (err && err.cancelled) throw err;
    // [新增] pdf-lib 無法解密：改用 pdf.js（已解鎖）逐頁轉成影像再寫入
    if (/encrypt/i.test(String(err && err.message))) {
      return rasterizeToLibDoc(item);
    }
    throw err;
  }
}

// [新增] 把「加密檔」的每一頁用 pdf.js 畫成影像，包成一份 pdf-lib 文件（外觀不變，但文字無法選取）
// 頁面已含原本的 /Rotate，輸出的新頁面旋轉為 0，因此調動中的額外旋轉仍可正確疊加
async function rasterizeToLibDoc(item) {
  const pdf = await ensurePdfJsDoc(item);
  const out = await PDFDocument.create();
  for (let n = 1; n <= pdf.numPages; n++) {
    setStatus(`正在轉換加密檔案「${item.name}」… ${n}/${pdf.numPages}`, '', true);
    const page = await pdf.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 4000 / Math.max(base.width, base.height));   // 約 144 dpi，單邊上限 4000px
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });
    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    canvas.width = 0;
    canvas.height = 0;
    if (!blob) throw new Error('加密檔案轉換失敗');

    const img = await out.embedJpg(new Uint8Array(await blob.arrayBuffer()));
    const newPage = out.addPage([base.width, base.height]);
    newPage.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
    page.cleanup();
    await nextFrame();
  }
  return out;
}

// =======================
// [新增] 快速擷取：大檔只匯出部分頁面時，不整份讀進來，改用 File.slice() 只讀必要位元組（見 pdf-extract.js）
//  1) 只讀檔尾 xref → 2) 只讀目標頁面與它們用到的物件 → 3) 組成一份「只含這些頁面」的小 PDF 再交給 pdf-lib
// 失敗（加密檔、xref 損毀、瀏覽器不支援…）一律回傳 null，呼叫端退回原本的整份讀取，不影響原有功能
// =======================
const FAST_EXTRACT_MIN_BYTES = 32 * 1024 * 1024;   // 小於這個大小整份讀取本來就快，不必走快速擷取
const FAST_EXTRACT_MAX_RATIO = 0.5;                // 用到的頁數超過一半時，整份讀取較划算
let fastSubsetCache = null;                        // { key, promise }：預估壓縮與實際儲存共用同一份擷取結果

function clearFastSubsetCache() { fastSubsetCache = null; }

async function tryFastSubset(item, indices, opts = {}) {
  if (!window.FastPdfExtract || !item || !item.file || !item.file.slice) return null;
  if (item.file.size < FAST_EXTRACT_MIN_BYTES) return null;
  const uniq = [...new Set(indices)].filter(Number.isInteger).sort((a, b) => a - b);
  if (!uniq.length || !item.pageCount || uniq.length > item.pageCount * FAST_EXTRACT_MAX_RATIO) return null;

  const key = `${item.id}|${uniq.join(',')}`;
  if (!fastSubsetCache || fastSubsetCache.key !== key) {
    const job = currentJob;
    const shortName = item.name.length > 30 ? `${item.name.slice(0, 27)}…` : item.name;
    if (!opts.quiet) setStatus(`正在擷取「${shortName}」的 ${uniq.length} 頁（只讀必要資料，不載入整份檔案）…`, '', true);
    const promise = (async () => {
      const res = await FastPdfExtract.extractPages(item.file, uniq, {
        isCancelled: () => !!((job && job.cancelled) || (opts.isCancelled && opts.isCancelled())),
        onProgress: (s) => {
          const ph = { xref: '讀取索引', pages: '尋找頁面', objects: '收集頁面內容' }[s.phase] || '';
          if (!opts.quiet) setStatus(`正在擷取「${shortName}」… ${ph ? ph + ' · ' : ''}已讀取 ${formatBytes(s.bytesRead)}／${formatBytes(item.file.size)}（${s.reads} 次讀取${s.objects ? `、${s.objects} 個物件` : ''}）`, '', true);
        },
      });
      const doc = await PDFDocument.load(res.bytes, { updateMetadata: false, parseSpeed: LIB_PARSE_SPEED });
      return { doc, map: res.indexMap };
    })();
    fastSubsetCache = { key, promise };
    promise.catch(() => { if (fastSubsetCache && fastSubsetCache.promise === promise) fastSubsetCache = null; });
  }
  try {
    return await jobGuard(fastSubsetCache.promise);
  } catch (err) {
    if (err && err.cancelled) throw err;
    console.warn('快速擷取失敗，改用完整讀取：', err);
    return null;
  }
}

// 單次儲存作業內的 pdf-lib 文件快取（同一檔案多次用到時只載入一次；作業結束後隨區域變數釋放）
function createLibLoader() {
  const cache = new Map();
  return async (item) => {
    if (!cache.has(item.id)) cache.set(item.id, await loadLibDoc(item));
    return cache.get(item.id);
  };
}

// [新增] 目前正在載入中的批次數（頂端進度條只在全部批次結束後才收起）
let activeLoadBatches = 0;

// [新增] 建立「使用者取消載入」的例外（以 cancelled 旗標識別，不會被當成讀檔失敗）
function makeCancelError() {
  const err = new Error('載入已取消');
  err.cancelled = true;
  return err;
}

// 統一的載入入口：按鈕、拖放都走這裡
async function addFiles(files) {
  const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
  if (pdfFiles.length === 0) {
    setStatus('請選擇 PDF 檔案', 'error');
    return;
  }

  const wasEmpty = docs.length === 0;
  const newItems = pdfFiles.map(file => ({
    id: nextDocId++,
    file,
    name: file.name,
    pageCount: null,
    selected: false,
    pdfJsPromise: null,
    pagesAdded: false,
    password: null,
    cancelled: false,      // [新增] 被移除 / 清空時設為 true，載入流程據此中止
    loadingTask: null      // [新增] pdf.js 的載入工作（取消時用來 destroy）
  }));
  newItems.forEach(item => knownDocs.set(item.id, item));

  // 只排序「這一批新檔案」，再接在檔案庫最後面（不動已手動排好的順序）
  newItems.sort((a, b) =>
    a.name.localeCompare(b.name, 'zh-TW', { numeric: true, sensitivity: 'base' })
  );
  docs.push(...newItems);

  // 第一次載入：依偏好（或檔案數量）決定先看「合併」還是「調動」
  if (wasEmpty) {
    const pref = getOpenViewPref();
    const target = pref !== 'auto' ? pref
      : (pdfFiles.length === 1 ? 'reorder' : 'merge');
    goToTab(target);
  }

  setStatus('正在讀取檔案…', '', true);
  renderMergeList();

  let loaded = 0;
  const failed = [];

  // [新增] 載入進度：頂端色線條＝整批檔案的「已讀位元組 / 總位元組」，狀態列顯示百分比與剩餘時間；
  //        pdf.js 解析階段無法得知進度，改用來回滑動的線條表示「處理中」
  const totalBytes = newItems.reduce((s, it) => s + it.file.size, 0) || 1;
  const readBytes = new Map();                       // docId → 已讀位元組
  const sumRead = () => { let s = 0; readBytes.forEach(v => { s += v; }); return s; };
  const t0 = performance.now();
  let lastPaint = 0;
  const shortName = (n) => (n.length > 30 ? `${n.slice(0, 27)}…` : n);
  const setBadge = (item, text) => {
    item.loadLabel = text;
    const el = mergeFileList.querySelector(`.file-page-badge[data-doc-id="${item.id}"]`);
    if (el && item.pageCount === null) el.textContent = text;
  };
  const makeHooks = (item, idx) => ({
    onRead(done, size) {
      readBytes.set(item.id, done);
      const now = performance.now();
      if (done < size && now - lastPaint < 100) return;     // 節流：最多每 0.1 秒更新一次畫面
      lastPaint = now;
      const sum = sumRead();
      const elapsed = (now - t0) / 1000;
      const eta = elapsed > 3 && sum / totalBytes > 0.02 ? Math.ceil(elapsed * (totalBytes - sum) / sum) : null;   // [修改] 讀到 2% 且超過 3 秒才估算
      const etaText = eta !== null && eta >= 1 ? `，約剩 ${eta >= 60 ? `${Math.ceil(eta / 60)} 分鐘` : `${eta} 秒`}` : '';
      const multi = newItems.length > 1 ? `（${idx + 1}/${newItems.length}）` : '';
      setProgress(sum, totalBytes);
      setStatus(`正在讀取${multi}「${shortName(item.name)}」${Math.round((sum / totalBytes) * 100)}%（${formatBytes(sum)} / ${formatBytes(totalBytes)}${etaText}）· 可按右側 ✕ 取消`, '', true);
      setBadge(item, `讀取 ${Math.round((done / Math.max(1, size)) * 100)}%`);
    },
    onParse() {
      readBytes.set(item.id, item.file.size);
      setProgressIndeterminate();
      setStatus(`正在解析「${shortName(item.name)}」…（大型檔案可能需要數秒）`, '', true);
      setBadge(item, '解析中...');
    }
  });
  newItems.forEach(it => { it.loadLabel = '等待中'; });
  renderMergeList();

  activeLoadBatches++;
  for (let idx = 0; idx < newItems.length; idx++) {
    const item = newItems[idx];
    if (item.cancelled) continue;                    // [新增] 已被取消 / 移除：直接跳過
    try {
      const pdf = await openDocWithPassword(item, makeHooks(item, idx));   // 與縮圖 / 預覽共用同一份 pdf.js 文件；加密檔會先詢問密碼
      if (item.cancelled) continue;                  // [新增] 解析完成的瞬間被取消：資源已由 releaseDoc 釋放
      item.pageCount = pdf.numPages;
    } catch (err) {
      if (item.cancelled) continue;                  // [新增] 取消造成的例外不算失敗
      console.error(`讀取 ${item.name} 失敗:`, err);
      item.pageCount = 0;
      failed.push({ name: item.name, kind: classifyLoadError(err) });
    }
    renderMergeList();
    loaded++;
    readBytes.set(item.id, item.file.size);
    setProgress(sumRead(), totalBytes);              // 離開「解析」階段，回到有刻度的進度
  }
  activeLoadBatches = Math.max(0, activeLoadBatches - 1);
  if (activeLoadBatches === 0) clearProgress();      // [修改] 還有其他批次在載入時，保留進度條
  if (newItems.every(it => it.cancelled)) setStatus('已取消載入', '', false, 0); else setStatus('');

  if (failed.length > 0) {
    docs = docs.filter(d => d.pageCount !== 0);
    renderMergeList();
    // [修改] 區分「加密未解鎖」與「損毀 / 格式無效」兩種原因
    const groups = [
      ['encrypted', '🔒 加密檔未解鎖'],
      ['corrupt', '⚠ 檔案損毀或不是有效的 PDF'],
      ['other', '無法讀取']
    ];
    const parts = groups
      .map(([kind, label]) => {
        const names = failed.filter(f => f.kind === kind).map(f => f.name);
        return names.length ? `${label}：${names.join('、')}` : '';
      })
      .filter(Boolean);
    setStatus(`已略過 — ${parts.join('；')}`, 'error', false, 6000);
  }
}

// [新增] 是否為 pdf.js 的「需要密碼 / 密碼錯誤」例外（code 1 = 需要密碼，2 = 密碼錯誤）
function isPasswordError(err) {
  return !!err && err.name === 'PasswordException';
}

// [新增] 載入失敗原因分類：encrypted（加密未解鎖）/ corrupt（損毀或格式無效）/ other
function classifyLoadError(err) {
  if (err && err.skippedPassword) return 'encrypted';
  if (isPasswordError(err)) return 'encrypted';
  if (err && (err.name === 'InvalidPDFException' || err.name === 'FormatError' || err.name === 'XRefParseException')) {
    return 'corrupt';
  }
  return 'other';
}

// [新增] 開啟 PDF；遇到加密檔就跳出密碼對話框，密碼錯誤可重試，按「略過」則丟出錯誤
async function openDocWithPassword(item, hooks) {
  while (true) {
    if (item.cancelled) throw makeCancelError();         // [新增]
    try {
      return await ensurePdfJsDoc(item, hooks);
    } catch (err) {
      if (!isPasswordError(err) || item.cancelled) throw err;   // [修改] 已取消就直接往外丟
      const wrong = err.code === 2;          // 2 = 密碼錯誤
      item.password = null;
      setStatus('');                          // 先收起「正在讀取檔案…」提示，避免遮住對話框
      const pwd = await askPassword(item, wrong);   // [修改] 傳入 item（原本是 item.name）
      if (item.cancelled) throw makeCancelError();  // [新增] 對話框開著時被取消
      if (pwd === null) {
        const skipped = new Error('使用者略過加密檔案');
        skipped.skippedPassword = true;
        throw skipped;
      }
      item.password = pwd;
      setStatus('正在讀取檔案…', '', true);
    }
  }
}

toggleMergeSelectModeBtn.addEventListener('click', () => {
  isMergeSelectionMode = !isMergeSelectionMode;
  setSelectToggleUI(toggleMergeSelectModeBtn, isMergeSelectionMode);
  mergeSelectionSubTools.classList.toggle('hidden', !isMergeSelectionMode);
  mergeFileList.classList.toggle('selection-mode', isMergeSelectionMode);

  docs.forEach(item => { item.selected = false; });
  lastCheckedMergeIndex = null;

  if (isMergeSelectionMode) {
    setStatus('已啟用檔案選取：可勾選後點擊「儲存」或「刪除」');
  } else {
    setStatus('已退出選取模式');
  }
  updateMergeSelectionUI();
});

mergeSelectAllBtn.addEventListener('click', () => {
  if (!isMergeSelectionMode) return;
  const allSelected = docs.length > 0 && docs.every(item => item.selected);
  const targetState = !allSelected;
  docs.forEach(item => { item.selected = targetState; });
  updateMergeSelectionUI();
});

// 刪除所勾選的合併檔案
deleteSelectedMergeBtn.addEventListener('click', () => {
  if (!isMergeSelectionMode) return;
  const selectedCount = docs.filter(item => item.selected).length;
  if (selectedCount === 0) return;

  docs = docs.filter(item => !item.selected);
  lastCheckedMergeIndex = null;
  renderMergeList();
  setStatus(`✓ 已移除所選的 ${selectedCount} 個檔案`);
});

function toggleMergeItemSelection(index, isShiftKey) {
  if (!isMergeSelectionMode) return;
  const targetChecked = !docs[index].selected;

  if (isShiftKey && lastCheckedMergeIndex !== null && lastCheckedMergeIndex !== index) {
    const start = Math.min(lastCheckedMergeIndex, index);
    const end = Math.max(lastCheckedMergeIndex, index);
    for (let i = start; i <= end; i++) {
      docs[i].selected = targetChecked;
    }
  } else {
    docs[index].selected = targetChecked;
  }

  lastCheckedMergeIndex = index;
  updateMergeSelectionUI();
}

function updateMergeSelectionUI() {
  const totalFiles = docs.length;
  const hasFiles = totalFiles > 0;

  if (!hasFiles) {
    mergePageInfo.classList.add('hidden');
    updateSaveButtonState();
    return;
  }

  mergePageInfo.classList.remove('hidden');

  if (isMergeSelectionMode) {
    const selectedItems = docs.filter(item => item.selected);
    const selectedCount = selectedItems.length;
    const selectedPages = selectedItems.reduce((sum, item) => sum + (item.pageCount || 0), 0);
    const allSelected = selectedCount === totalFiles;

    mergePageInfo.textContent = `已選 ${selectedCount}/${totalFiles} 檔 (${selectedPages}頁)`;
    mergeSelectAllBtnText.textContent = allSelected ? '取消全選' : '全選';
    deleteSelectedMergeBtn.disabled = selectedCount === 0;
    deleteSelectedMergeText.textContent = selectedCount > 0 ? `刪除 (${selectedCount})` : '刪除';
  } else {
    const totalPages = docs.reduce((sum, item) => sum + (item.pageCount || 0), 0);
    mergePageInfo.textContent = `${totalFiles} 檔 · 共 ${totalPages} 頁`;
  }

  const rows = mergeFileList.querySelectorAll('.file-item');
  docs.forEach((item, idx) => {
    const row = rows[idx];
    if (row) {
      row.classList.toggle('selected', isMergeSelectionMode && item.selected);
    }
  });

  updateSaveButtonState();
}

function renderMergeList() {
  mergeFileList.innerHTML = '';

  const hasFiles = docs.length > 0;
  workspaceEl.classList.toggle('is-empty', !hasFiles);
  mergeFileList.classList.toggle('hidden', !hasFiles);
  toggleMergeSelectModeBtn.classList.toggle('hidden', !hasFiles);

  if (!hasFiles && isMergeSelectionMode) {
    isMergeSelectionMode = false;
    setSelectToggleUI(toggleMergeSelectModeBtn, false);
    mergeSelectionSubTools.classList.add('hidden');
    mergeFileList.classList.remove('selection-mode');
  }

  docs.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = `file-item ${isMergeSelectionMode && item.selected ? 'selected' : ''}`;
    li.draggable = true;

    li.addEventListener('click', (e) => {
      if (isMergeSelectionMode) {
        toggleMergeItemSelection(index, e.shiftKey);
      }
    });

    const checkBadge = document.createElement('span');
    checkBadge.className = 'merge-check-badge';
    checkBadge.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';

    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    setIcon(dragHandle, 'grip', 18);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'file-name';
    nameSpan.textContent = `${index + 1}. ${item.name}`;
    nameSpan.title = item.name;

    const pageBadge = document.createElement('span');
    pageBadge.className = 'file-page-badge';
    pageBadge.dataset.docId = String(item.id);
    if (item.pageCount === null) {
      pageBadge.textContent = item.loadLabel || '讀取中...';
    } else if (item.pageCount > 0) {
      pageBadge.textContent = item.password ? `${item.pageCount} 頁 🔒` : `${item.pageCount} 頁`;
      if (item.password) pageBadge.title = '已解鎖的加密檔案；儲存時此檔案的頁面會轉成影像';
    } else {
      pageBadge.textContent = '無法讀取';
    }

    const controls = document.createElement('div');
    controls.className = 'file-controls';

    const upBtn = document.createElement('button');
    upBtn.className = 'icon-btn';
    setIcon(upBtn, 'up', 18);
    upBtn.title = '上移';
    upBtn.disabled = index === 0;
    upBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moveMergeFile(index, -1);
    });

    const downBtn = document.createElement('button');
    downBtn.className = 'icon-btn';
    setIcon(downBtn, 'down', 18);
    downBtn.title = '下移';
    downBtn.disabled = index === docs.length - 1;
    downBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moveMergeFile(index, 1);
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'icon-btn';
    setIcon(removeBtn, 'close', 16);
    removeBtn.title = item.pageCount === null ? '取消載入並移除' : '移除';   // [修改] 載入中的檔案按 ✕ ＝ 取消載入
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      docs.splice(index, 1);
      renderMergeList();
    });

    const splitBtn = document.createElement('button');
    splitBtn.className = 'icon-btn';
    setIcon(splitBtn, 'cut', 16);
    splitBtn.title = '分割此檔案';
    splitBtn.disabled = !(item.pageCount > 0);
    splitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      splitDocId = item.id;
      goToTab('split');
    });

    controls.append(splitBtn, upBtn, downBtn, removeBtn);
    li.append(checkBadge, dragHandle, nameSpan, pageBadge, controls);

    li.addEventListener('dragstart', (e) => {
      draggedItemIndex = index;
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (draggedItemIndex === null || draggedItemIndex === index) return;
      e.dataTransfer.dropEffect = 'move';

      li.classList.remove('drag-over-top', 'drag-over-bottom');
      if (draggedItemIndex < index) {
        li.classList.add('drag-over-bottom');
      } else {
        li.classList.add('drag-over-top');
      }
    });

    li.addEventListener('dragleave', () => {
      li.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    li.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      li.classList.remove('drag-over-top', 'drag-over-bottom');

      if (draggedItemIndex === null || draggedItemIndex === index) return;

      const [movedFile] = docs.splice(draggedItemIndex, 1);
      docs.splice(index, 0, movedFile);
      draggedItemIndex = null;
      renderMergeList();
    });

    li.addEventListener('dragend', () => {
      draggedItemIndex = null;
      document.querySelectorAll('.file-item').forEach(row => {
        row.classList.remove('dragging', 'drag-over-top', 'drag-over-bottom');
      });
    });

    mergeFileList.appendChild(li);
  });

  clearAllBtn.disabled = !hasFiles;
  updateMergeSelectionUI();
  onLibraryChanged();
}

// 檔案庫變動時：更新分頁可用狀態、釋放已移除檔案的資源、同步目前顯示的檢視
function onLibraryChanged() {
  const hasFiles = docs.length > 0;
  tabBtns.forEach(b => { b.disabled = !hasFiles; });

  for (const [id, item] of knownDocs) {
    if (!docs.includes(item)) {
      knownDocs.delete(id);
      releaseDoc(item);
    }
  }

  // 目前顯示的檢視立刻同步；檔案庫清空時則不論在哪個檢視都重置
  if (currentTab === 'split' || !hasFiles) refreshSplitView();
  if (currentTab === 'reorder' || !hasFiles) syncReorder();
  if (currentTab === 'read' || !hasFiles) syncReader();
  if (!hasFiles) purgeAllDocMemory();   // [新增] 檔案庫清空：釋放所有快取與「頁碼記憶」
  syncProgressCard();   // [新增] 檔案載完或被移除時，✕ 即時隱藏
}

function releaseDoc(item) {
  item.cancelled = true;                                       // [新增] 通知載入流程：此檔已被移除，請中止
  if (passwordOwner === item) closePasswordModal(null);        // [新增] 正在問這個檔案的密碼 → 關閉對話框
  if (item.loadingTask) {                                      // [新增] 還在讀取 / 解析中 → 直接中止 pdf.js 載入
    try { item.loadingTask.destroy(); } catch (e) {}
    item.loadingTask = null;
  }
  const prefix = `${item.id}_`;

  // 已完成的縮圖（Blob URL）
  Object.keys(thumbnailCache).forEach(k => {
    if (k.startsWith(prefix)) {
      URL.revokeObjectURL(thumbnailCache[k]);
      delete thumbnailCache[k];
    }
  });

  // [新增] 還在排隊的縮圖工作：移出佇列，並同步修正進度計數
  let dropped = 0;
  for (let q = thumbQueue.length - 1; q >= 0; q--) {
    if (thumbQueue[q].startsWith(prefix)) {
      renderingPages.delete(thumbQueue[q]);
      thumbQueue.splice(q, 1);
      dropped++;
    }
  }
  if (dropped > 0) {
    thumbBatchTotal = Math.max(thumbBatchDone, thumbBatchTotal - dropped);
    updateThumbProgress();
  }

  dropPreviewMini(item.id);                                    // [新增] 單頁預覽用的小文件快取
  if (fastSubsetCache && fastSubsetCache.key.startsWith(`${item.id}|`)) fastSubsetCache = null;   // [新增] 快速擷取暫存
  readerPositions.delete(item.id);                             // [新增] 此檔的閱讀頁碼記憶
  hiddenDocIds.delete(item.id);                                // [新增] 調動中「隱藏檔案」的紀錄與暫存頁面
  hiddenPageStash.delete(item.id);
  item.password = null;                                        // [新增] 不再保留解鎖用的密碼

  if (item.pdfJsPromise) item.pdfJsPromise.then(d => d.destroy()).catch(() => {});
  item.pdfJsPromise = null;
}

// [新增] 釋放「單頁預覽」用的小文件（不帶 docId＝全部釋放）
function dropPreviewMini(docId) {
  const prefix = docId === undefined ? null : `${docId}:`;
  for (const [k, p] of [...previewMiniCache]) {
    if (prefix === null || k.startsWith(prefix)) {
      previewMiniCache.delete(k);
      p.then(d => d.destroy()).catch(() => {});
    }
  }
}

// [新增] 檔案庫完全清空時：把所有跟檔案有關的快取、暫存與「頁碼記憶」一次放掉
function purgeAllDocMemory() {
  reorderRenderGen++;                         // [優化] 取消尚未完成的分批建立
  // 縮圖：Blob URL、佇列、進度，以及懶載入觀察器（會握住已脫離畫面的縮圖元素）
  clearThumbnailCache();
  clearTimeout(idleCleanupTimer);
  if (thumbObserver) { thumbObserver.disconnect(); thumbObserver = null; }   // 下次進入調動時會重新建立
  reorderPageList.replaceChildren();
  sidebarThumbList.replaceChildren();
  cardEls = []; sideEls = [];
  thumbEls = new Map(); uidEls = new Map(); uidPage = new Map(); uidCard = new Map(); thumbVisible = new Map();

  // 預覽、快速擷取、壓縮預估
  dropPreviewMini();
  clearFastSubsetCache();
  cmpEstimateToken++;
  cmpEstimateData = null;
  cmpScope = [];
  cmpEstimateList.replaceChildren();
  compressOverride = null;
  compressSaved = 0;
  compressOut = 0;

  // 頁碼記憶：閱讀檢視
  readerPositions.clear();
  readerResumeIndex = 0;
  readerCurrent = 0;
  readerCenter = 0;
  readerDocId = null;
  readPageInput.value = '1';
  readPageTotal.textContent = '0';

  // 頁碼記憶：調動檢視（目前頁、勾選起點、復原 / 重做紀錄、隱藏檔案的暫存頁面）
  reorderPages = [];
  activeSidebarIndex = 0;
  lastCheckedPageIndex = null;
  lastCheckedMergeIndex = null;
  draggedPageIndex = null;
  draggedPageGroup = [];
  draggedItemIndex = null;
  reorderEdited = false;
  reorderOrderSig = '';
  reorderMulti = false;
  hiddenDocIds.clear();
  hiddenPageStash.clear();
  clearHistory();

  // 預覽視窗的跳頁欄位
  previewJumpInput.value = '';
  previewJumpTotal.textContent = '0';
}

function moveMergeFile(index, direction) {
  const target = index + direction;
  const temp = docs[index];
  docs[index] = docs[target];
  docs[target] = temp;
  renderMergeList();
}

// [新增] 自訂確認視窗：回傳 Promise<boolean>；Esc、點背景、取消皆視為否。預設聚焦在「取消」避免誤按
const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMsg = document.getElementById('confirmMsg');
const confirmOkBtn = document.getElementById('confirmOkBtn');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');

function askConfirm({ title, message, okText = '確定' }) {
  return new Promise((resolve) => {
    confirmTitle.textContent = title;
    confirmMsg.textContent = message;
    confirmOkBtn.textContent = okText;
    const prevFocus = document.activeElement;

    const done = (result) => {
      confirmModal.classList.add('hidden');
      confirmOkBtn.removeEventListener('click', onOk);
      confirmCancelBtn.removeEventListener('click', onCancel);
      confirmModal.removeEventListener('mousedown', onOverlay);
      document.removeEventListener('keydown', onKey, true);
      if (prevFocus && prevFocus.focus) prevFocus.focus();
      resolve(result);
    };
    const onOk = () => done(true);
    const onCancel = () => done(false);
    const onOverlay = (e) => { if (e.target === confirmModal) done(false); };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false); }
    };

    confirmOkBtn.addEventListener('click', onOk);
    confirmCancelBtn.addEventListener('click', onCancel);
    confirmModal.addEventListener('mousedown', onOverlay);
    document.addEventListener('keydown', onKey, true);
    confirmModal.classList.remove('hidden');
    confirmCancelBtn.focus();
  });
}

clearAllBtn.addEventListener('click', async () => {
  if (docs.length === 0) return;
  // 調動中有調過頁序 / 刪除 / 旋轉時，清除會一併丟失，訊息要特別提醒
  const ok = await askConfirm({
    title: '清除所有檔案？',
    message: reorderEdited
      ? '調動中有尚未儲存的編輯（頁序、刪除、旋轉），清除後會全部消失。'
      : `將從清單移除全部 ${docs.length} 個檔案，並釋放縮圖、快取與頁碼記憶。原始檔案不會被更動。`,
    okText: '清除檔案'
  });
  if (!ok || docs.length === 0) return;
  docs = [];
  renderMergeList();
  setStatus('已清除所有檔案並釋放記憶體');
});

// 離開頁面前提醒：調動中有未儲存的編輯（頁序、刪除、旋轉）時，重新整理或關閉分頁會先跳出瀏覽器的確認視窗
// 註：現代瀏覽器不允許自訂提示文字，只會顯示瀏覽器內建的訊息
window.addEventListener('beforeunload', (e) => {
  if (!reorderEdited) return;
  e.preventDefault();
  e.returnValue = ''; // 舊版瀏覽器需要設定此值才會觸發提醒
});

async function executeMergeSave() {
  const itemsToMerge = isMergeSelectionMode
    ? docs.filter(item => item.selected)
    : docs;

  if (itemsToMerge.length < 2) {
    setStatus('請至少選擇 2 個 PDF 檔案進行合併', 'error');
    return;
  }

  // [新增] 大檔案儲存前詢問是否壓縮（可預估壓縮後大小）
  if (!(await promptCompressForSave(itemsToMerge.map(item => ({ item, fraction: 1 }))))) return;

  const mergeDefaultBase = `${itemsToMerge[0].name.replace(/\.pdf$/i, '')}_合併`;
  const mergeOutName = await askFileName(mergeDefaultBase, 'pdf', '儲存合併後的 PDF');
  if (!mergeOutName) return;

  try {
    primarySaveBtn.disabled = true;
    compressSaved = 0;
    const total = itemsToMerge.length;
    setStatus('正在合併 PDF...', '', true);
    setProgress(0, total);
    await nextFrame();

    const mergedPdf = await PDFDocument.create();

    let done = 0;
    for (const item of itemsToMerge) {
      setStatus(`正在合併 PDF… ${done + 1}/${total}`, '', true);
      const pdf = await loadLibDoc(item);       // 複製完頁面後即可釋放，不長期佔用記憶體
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      done++;
      setProgress(done, total);
      await nextFrame();
    }

    const mergedBytes = await finalizePdf(mergedPdf);
    downloadBlob(mergedBytes, mergeOutName);

    setStatus(`✓ 已合併 ${itemsToMerge.length} 個檔案並開始下載${takeCompressNote()}`, 'success');
  } catch (err) {
    if (err && err.cancelled) { setStatus('已取消儲存', '', false, 0); return; }   // [新增]
    console.error(err);
    setStatus('合併失敗：檔案可能受保護或損毀', 'error');
  } finally {
    clearProgress();
    updateSaveButtonState();
  }
}

// =======================
// 2. 分割 PDF 功能
// =======================
// 進入分割檢視 / 檔案庫變動時：決定要分割哪個檔案並更新畫面
function refreshSplitView() {
  const ready = docs.filter(d => d.pageCount > 0);
  const has = ready.length > 0;
  splitOptions.classList.toggle('hidden', !has);
  splitPageInfo.classList.toggle('hidden', !has);

  if (!has) {
    splitDocId = null;
    splitFile = null;
    splitItem = null;
    splitTotalPages = 0;
    pageRangeInput.value = '';                   // [新增] 清空後不保留上次輸入的擷取頁碼
    updateSaveButtonState();
    return;
  }

  // 已指定且仍存在 → 沿用；否則「合併選取模式只勾 1 檔」→ 該檔；否則第一個檔案
  if (!ready.some(d => d.id === splitDocId)) {
    const picked = isMergeSelectionMode ? ready.filter(d => d.selected) : [];
    splitDocId = (picked.length === 1 ? picked[0] : ready[0]).id;
  }
  const item = ready.find(d => d.id === splitDocId);

  splitDocRow.classList.toggle('hidden', ready.length < 2);
  splitDocSelect.innerHTML = '';
  ready.forEach(d => {
    const opt = document.createElement('option');
    opt.value = String(d.id);
    opt.textContent = `${d.name.replace(/\.pdf$/i, '')}（${d.pageCount} 頁）`;
    opt.title = d.name;
    splitDocSelect.appendChild(opt);
  });
  splitDocSelect.value = String(item.id);

  splitFile = item.file;
  splitItem = item;
  splitTotalPages = item.pageCount;

  splitFileNameTitle.textContent = `📄 ${item.name}（共 ${splitTotalPages} 頁）`;
  splitPageInfo.textContent = `${splitTotalPages} 頁`;
  updateChunkHint();
  pageRangeInput.placeholder = `例如：1-${Math.min(3, splitTotalPages)}, ${splitTotalPages}`;
  updateSaveButtonState();
}

splitDocSelect.addEventListener('change', () => {
  splitDocId = parseInt(splitDocSelect.value, 10);
  refreshSplitView();
});

// 依目前選的分割模式，顯示或隱藏 ZIP 選項
function updateSplitModeUI() {
  const checked = document.querySelector('input[name="splitMode"]:checked');
  const mode = checked ? checked.value : 'range';
  splitZipRow.classList.toggle('hidden', mode === 'range');
}

// 「每 N 頁」的即時結果提示（例如：20 頁 → 4 份）
function updateChunkHint() {
  if (!splitItem || splitTotalPages === 0) {
    chunkHint.textContent = '載入檔案後顯示拆分結果';
    return;
  }
  const n = parseInt(chunkSizeInput.value, 10);
  if (!Number.isInteger(n) || n < 1) {
    chunkHint.textContent = '請輸入 1 以上的整數';
    return;
  }
  if (n >= splitTotalPages) {
    chunkHint.textContent = `每份頁數需小於總頁數（共 ${splitTotalPages} 頁）`;
    return;
  }
  const count = Math.ceil(splitTotalPages / n);
  const last = splitTotalPages - (count - 1) * n;
  chunkHint.textContent = last === n
    ? `共 ${splitTotalPages} 頁 → ${count} 份，每份 ${n} 頁`
    : `共 ${splitTotalPages} 頁 → ${count} 份（前 ${count - 1} 份各 ${n} 頁，最後一份 ${last} 頁）`;
}

document.querySelectorAll('input[name="splitMode"]').forEach(radio => {
  radio.addEventListener('change', updateSplitModeUI);
});
chunkSizeInput.addEventListener('input', () => {
  document.querySelector('input[name="splitMode"][value="chunk"]').checked = true;
  updateSplitModeUI();
  updateChunkHint();
});
chunkSizeInput.addEventListener('focus', () => {
  document.querySelector('input[name="splitMode"][value="chunk"]').checked = true;
  updateSplitModeUI();
});

function parsePageRanges(inputStr, maxPages) {
  // [新增] 容錯：全形數字 / 逗號 / 連字號（中文輸入法常見）轉成半形
  inputStr = inputStr
    .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[，、；;]/g, ',')
    .replace(/[－–—~～]/g, '-');
  const pages = new Set();
  const parts = inputStr.split(',').map(s => s.trim()).filter(Boolean);

  if (parts.length === 0) {
    throw new Error('請輸入頁碼範圍');
  }

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map(s => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end) || start < 1 || end > maxPages || start > end) {
        throw new Error(`無效範圍：「${part}」（1~${maxPages}）`);
      }
      for (let i = start; i <= end; i++) {
        pages.add(i - 1);
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum) || pageNum < 1 || pageNum > maxPages) {
        throw new Error(`無效頁碼：「${part}」（1~${maxPages}）`);
      }
      pages.add(pageNum - 1);
    }
  }
  return Array.from(pages);
}

async function executeSplitSave() {
  if (!splitItem) return;

  const mode = document.querySelector('input[name="splitMode"]:checked').value;
  const baseName = splitFile.name.replace(/\.pdf$/i, '');

  try {
    primarySaveBtn.disabled = true;
    compressSaved = 0;
    setStatus('正在處理分割...', '', true);
    await nextFrame();

    if (mode === 'range') {
      const pageIndices = parsePageRanges(pageRangeInput.value, splitTotalPages);
      // [新增] 大檔案儲存前詢問是否壓縮（輸出大小依擷取頁數比例預估）
      if (!(await promptCompressForSave([{ item: splitItem, fraction: pageIndices.length / splitTotalPages }]))) { setStatus(''); return; }
      const rangeOutName = await askFileName(`${baseName}_擷取`, 'pdf', '儲存擷取的 PDF');
      if (!rangeOutName) { setStatus(''); return; }
      if (currentJob) currentJob.t0 = performance.now();   // [新增] 計時從填完檔名後開始
      const fast = await tryFastSubset(splitItem, pageIndices);      // [新增] 大檔只擷取部分頁面：快速擷取
      const srcDoc = fast ? fast.doc : await loadLibDoc(splitItem);
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(srcDoc, fast ? pageIndices.map(n => fast.map.get(n)) : pageIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await finalizePdf(newPdf);
      downloadBlob(pdfBytes, rangeOutName);
      setStatus(`✓ 擷取完成並下載${takeCompressNote()}`, 'success');
    } else if (mode === 'each' || mode === 'chunk') {
      const total = splitTotalPages;

      // 每份的頁數：逐頁 = 1；每 N 頁 = N
      let size = 1;
      if (mode === 'chunk') {
        size = parseInt(chunkSizeInput.value, 10);
        if (!Number.isInteger(size) || size < 1) {
          throw new Error('請輸入有效的每份頁數（1 以上的整數）');
        }
        if (size >= total) {
          throw new Error(`每份頁數需小於總頁數（共 ${total} 頁）`);
        }
      }

      // 分組：[起始索引, 結束索引]（含）
      const groups = [];
      for (let start = 0; start < total; start += size) {
        groups.push([start, Math.min(start + size, total) - 1]);
      }

      const padWidth = String(total).length;
      const pad = (n) => String(n).padStart(padWidth, '0');
      const nameFor = ([s, e]) => (s === e)
        ? `${baseName}_第${pad(s + 1)}頁.pdf`
        : `${baseName}_第${pad(s + 1)}-${pad(e + 1)}頁.pdf`;

      const useZip = splitZipCheck.checked && groups.length > 1;
      const entries = [];

      // [新增] 大檔案儲存前詢問是否壓縮
      if (!(await promptCompressForSave([{ item: splitItem, fraction: 1 }]))) { setStatus(''); return; }

      // 打包 ZIP 時才有「單一輸出檔」可命名；分開下載時沿用自動檔名
      let zipOutName = '';
      if (useZip) {
        const zipDefaultBase = mode === 'chunk' ? `${baseName}_每${size}頁` : `${baseName}_逐頁拆分`;
        zipOutName = await askFileName(zipDefaultBase, 'zip', '儲存 ZIP 壓縮檔');
        if (!zipOutName) { setStatus(''); return; }
      }

      if (currentJob) currentJob.t0 = performance.now();   // [新增] 計時從填完檔名後開始
      const srcDoc = await loadLibDoc(splitItem);

      for (let g = 0; g < groups.length; g++) {
        setStatus(`正在拆分… ${g + 1}/${groups.length}`, '', true);
        setProgress(g, groups.length);
        await maybeYield();

        const [s, e] = groups[g];
        const indices = [];
        for (let i = s; i <= e; i++) indices.push(i);

        const part = await PDFDocument.create();
        const copied = await part.copyPages(srcDoc, indices);
        copied.forEach(p => part.addPage(p));
        const pdfBytes = await finalizePdf(part, s, total, true);
        const fileName = nameFor(groups[g]);

        if (useZip) {
          entries.push({ name: fileName, data: pdfBytes });
        } else {
          downloadBlob(pdfBytes, fileName);
        }
      }
      setProgress(groups.length, groups.length);

      if (useZip) {
        setStatus('正在打包 ZIP…', '', true);
        await nextFrame();
        const zipBlob = await buildZip(entries);
        entries.length = 0;                          // [新增] ZIP 已建好，立刻放掉各份 PDF 的暫存位元組
        downloadBlob(zipBlob, zipOutName);
        setStatus(`✓ 已將 ${groups.length} 個檔案打包成 ZIP 並開始下載${takeCompressNote()}`, 'success');
      } else {
        setStatus(`✓ 已拆分為 ${groups.length} 個檔案${takeCompressNote()}`, 'success');
      }
    }
  } catch (err) {
    if (err && err.cancelled) { setStatus('已取消儲存', '', false, 0); return; }   // [新增]
    setStatus(err.message || '分割發生錯誤', 'error');
  } finally {
    clearFastSubsetCache();
    clearProgress();
    updateSaveButtonState();
  }
}

// =======================
// 3. 調整 PDF 頁序與多選儲存 / 多選刪除功能
// =======================
toggleSelectModeBtn.addEventListener('click', () => {
  isSelectionMode = !isSelectionMode;
  setSelectToggleUI(toggleSelectModeBtn, isSelectionMode);
  selectionSubTools.classList.toggle('hidden', !isSelectionMode);
  rangeSelectWrap.classList.toggle('hidden', !isSelectionMode);   // [新增]
  document.body.classList.toggle('selecting', isSelectionMode);   // [新增] 手機：選取時只顯示選取工具列
  if (!isSelectionMode) closeMenus();                              // [新增]
  reorderBody.classList.toggle('selection-mode', isSelectionMode);

  if (isSelectionMode) {
    reorderPages.forEach(p => { p.selected = false; });
    lastCheckedPageIndex = null;
    setStatus('已啟用選取模式：勾選頁面後可點「儲存」匯出或點「刪除」移除');
  } else {
    reorderPages.forEach(p => { p.selected = false; });
    setStatus('已退出選取模式');
  }

  updateSelectionUI();
});

selectAllBtn.addEventListener('click', () => {
  if (!isSelectionMode) return;
  const allSelected = reorderPages.length > 0 && reorderPages.every(p => p.selected);
  const targetState = !allSelected;
  reorderPages.forEach(p => {
    p.selected = targetState;
  });
  updateSelectionUI();
});

// [新增] 依頁碼範圍選取：頁碼 = 畫面上每張縮圖的編號（目前頁序）；輸入如 3-5, 9
const rangeSelectInput = document.getElementById('rangeSelectInput');
const rangeSelectBtn = document.getElementById('rangeSelectBtn');

function selectPagesByRange() {
  if (!isSelectionMode || reorderPages.length === 0) return;
  const text = rangeSelectInput.value.trim();
  if (!text) {
    rangeSelectInput.classList.add('invalid');
    setStatus('請輸入頁碼，例如 3-5, 9', 'error');
    return;
  }

  let indices;
  try {
    indices = parsePageRanges(text, reorderPages.length);
  } catch (err) {
    rangeSelectInput.classList.add('invalid');
    setStatus(err.message, 'error');
    return;
  }
  rangeSelectInput.classList.remove('invalid');

  const picked = new Set(indices);
  reorderPages.forEach((p, i) => { p.selected = picked.has(i); });
  lastCheckedPageIndex = null;
  setActivePage(Math.min(...indices), true);   // 捲動到第一個被選取的頁面（同時更新選取狀態畫面）
  setStatus(`✓ 已依頁碼選取 ${picked.size} 頁`, 'success');
  closeMenus();                                  // [新增] 套用後收合
}

rangeSelectBtn.addEventListener('click', selectPagesByRange);
rangeSelectInput.addEventListener('input', () => rangeSelectInput.classList.remove('invalid'));
rangeSelectInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) {   // 輸入法選字時的 Enter 不算確認
    e.preventDefault();
    selectPagesByRange();
  }
});

// [新增] 頁碼面板快捷鈕：奇數頁 / 偶數頁 / 反選 / 清除
rangeMenu.addEventListener('click', (e) => {
  const q = e.target.closest('[data-q]')?.dataset.q;
  if (!q || !isSelectionMode) return;
  reorderPages.forEach((p, i) => {
    if (q === 'odd')    p.selected = (i + 1) % 2 === 1;
    if (q === 'even')   p.selected = (i + 1) % 2 === 0;
    if (q === 'invert') p.selected = !p.selected;
    if (q === 'clear')  p.selected = false;
  });
  lastCheckedPageIndex = null;
  updateSelectionUI();
  if (q !== 'clear') closeMenus();
});

// [新增] 長按縮圖 → 進入選取模式並勾選該頁（觸控裝置）
{
  let lpTimer = null, lpX = 0, lpY = 0, lpFired = false;
  const clearLP = () => { clearTimeout(lpTimer); lpTimer = null; };
  reorderPageList.addEventListener('touchstart', (e) => {
    if (isSelectionMode || e.touches.length !== 1) return;
    const li = e.target.closest('li');
    if (!li) return;
    const t = e.touches[0]; lpX = t.clientX; lpY = t.clientY; lpFired = false;
    clearLP();
    lpTimer = setTimeout(() => {
      lpTimer = null;
      const idx = cardEls.indexOf(li);
      if (idx < 0 || isSelectionMode) return;
      lpFired = true;
      toggleSelectModeBtn.click();          // 進入選取模式
      togglePageSelection(idx, false);      // 並勾選這一頁
      if (navigator.vibrate) navigator.vibrate(15);
    }, 450);
  }, { passive: true });
  reorderPageList.addEventListener('touchmove', (e) => {
    if (!lpTimer) return;
    const t = e.touches[0];
    if (Math.abs(t.clientX - lpX) > 8 || Math.abs(t.clientY - lpY) > 8) clearLP();
  }, { passive: true });
  ['touchend', 'touchcancel'].forEach(ev => reorderPageList.addEventListener(ev, clearLP, { passive: true }));
  // 長按放開後瀏覽器會補一個 click，會把剛勾的頁面又取消，這裡攔掉
  reorderPageList.addEventListener('click', (e) => {
    if (lpFired) { e.stopPropagation(); e.preventDefault(); lpFired = false; }
  }, true);
  // 長按時不要跳出系統選單 / 選字
  reorderPageList.addEventListener('contextmenu', (e) => { if (lpFired || lpTimer) e.preventDefault(); });
}

// 批次刪除所勾選的頁面
function executeDeleteSelectedPages() {
  if (!isSelectionMode) return;
  const selectedCount = reorderPages.filter(p => p.selected).length;
  if (selectedCount === 0) return;

  if (selectedCount >= reorderPages.length) {
    setStatus('無法刪除全部頁面（請至少保留 1 頁）', 'error');
    return;
  }

  pushHistory(`刪除 ${selectedCount} 頁`);
  reorderPages = reorderPages.filter(p => !p.selected);
  lastCheckedPageIndex = null;
  if (activeSidebarIndex >= reorderPages.length) {
    activeSidebarIndex = Math.max(0, reorderPages.length - 1);
  }
  renderReorderPages();
  setStatus(`✓ 已刪除所選的 ${selectedCount} 頁（剩餘 ${reorderPages.length} 頁）`, 'success');
}

deleteSelectedPagesBtn.addEventListener('click', executeDeleteSelectedPages);

// 支援按鍵盤 Delete 鍵快速刪除所勾選的頁面或檔案
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (e.key === 'Delete') {
    if (currentTab === 'reorder' && isSelectionMode) {
      executeDeleteSelectedPages();
    } else if (currentTab === 'merge' && isMergeSelectionMode) {
      deleteSelectedMergeBtn.click();
    }
  }
});

function updateSelectionUI() {
  const totalCount = reorderPages.length;
  let selectedCount = 0;
  for (let i = 0; i < totalCount; i++) if (reorderPages[i].selected) selectedCount++;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  if (isSelectionMode) {
    reorderPageInfo.textContent = `${selectedCount} / ${totalCount} 頁`;
    selectAllBtnText.textContent = allSelected ? '取消全選' : '全選';
    deleteSelectedPagesBtn.disabled = selectedCount === 0 || selectedCount >= totalCount;
    rotateLeftSelectedBtn.disabled = selectedCount === 0;
    rotateRightSelectedBtn.disabled = selectedCount === 0;
    deleteSelectedPagesText.textContent = selectedCount > 0 ? `刪除 (${selectedCount})` : '刪除';
  } else {
    reorderPageInfo.textContent = `共 ${totalCount} 頁`;
  }

  // [效能] 用重繪時建好的陣列（不再每次 querySelectorAll），而且只動「狀態真的有變」的卡片
  for (let idx = 0; idx < totalCount; idx++) {
    if (idx >= cardEls.length) break;      // [優化] 尚未建立的卡片等建立後再套用狀態
    const p = reorderPages[idx];
    const isSelected = isSelectionMode && !!p.selected;
    const isActivePage = idx === activeSidebarIndex;
    const sig = (isSelected ? 1 : 0) | (isActivePage ? 2 : 0) | (isSelectionMode ? 4 : 0);
    if (p._sig === sig) continue;
    p._sig = sig;

    const card = cardEls[idx];
    if (card) {
      card.classList.toggle('selected', isSelected);
      card.classList.toggle('active-page', isActivePage);
      card.tabIndex = isActivePage ? 0 : -1;
      if (isSelectionMode) card.setAttribute('aria-selected', String(!!p.selected));
      else card.removeAttribute('aria-selected');
    }

    const side = sideEls[idx];
    if (side) {
      side.classList.toggle('selected', isSelected);
      side.classList.toggle('active-page', isActivePage);
      if (isActivePage) side.setAttribute('aria-current', 'true');
      else side.removeAttribute('aria-current');
    }
  }

  updateSaveButtonState();
}

function togglePageSelection(index, isShiftKey) {
  if (!isSelectionMode) return;
  const targetChecked = !reorderPages[index].selected;

  if (isShiftKey && lastCheckedPageIndex !== null && lastCheckedPageIndex !== index) {
    const start = Math.min(lastCheckedPageIndex, index);
    const end = Math.max(lastCheckedPageIndex, index);
    for (let i = start; i <= end; i++) {
      reorderPages[i].selected = targetChecked;
    }
  } else {
    reorderPages[index].selected = targetChecked;
  }

  lastCheckedPageIndex = index;
  activeSidebarIndex = index;
  updateSelectionUI();
}

function setActivePage(index, scrollMainView = false) {
  activeSidebarIndex = index;
  ensureCardBuilt(index);                // [優化] 跳到尚未建立的頁面前先補建
  updateSelectionUI();

  if (scrollMainView) {
    const targetCard = reorderPageList.children[index];
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

function initThumbObserver() {
  if (thumbObserver) {
    thumbObserver.disconnect();
  }
  thumbVisible = new Map();
  // [效能] 不再「進入視窗就取消觀察」：持續追蹤進出，捲離視窗的縮圖若還沒開始畫就直接放棄（快速捲動大檔時不浪費算力）
  thumbObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      const key = el.dataset.pageNum;
      const n = thumbVisible.get(key) || 0;
      if (entry.isIntersecting) {
        if (el._thumbIn) return;
        el._thumbIn = true;
        thumbVisible.set(key, n + 1);
        renderSingleThumbnail(key);
      } else if (el._thumbIn) {
        el._thumbIn = false;
        if (n <= 1) thumbVisible.delete(key); else thumbVisible.set(key, n - 1);
      }
    });
  }, {
    rootMargin: '320px 0px'
  });
}

// 縮圖以 Blob URL 保存（比 base64 字串省記憶體），並限制同時渲染數量
let thumbGeneration = 0;      // 換檔 / 換清晰度時遞增，讓舊的渲染結果失效
// [優化] 依裝置記憶體 / 核心數調整的參數（Safari 沒有 deviceMemory，視為 4 GB）
const DEVICE_MEM = (typeof navigator !== 'undefined' && navigator.deviceMemory) || 4;
const DEVICE_CORES = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
const IS_COARSE_POINTER = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
const THUMB_CONCURRENCY = DEVICE_MEM <= 2
  ? 2
  : Math.max(2, Math.min(IS_COARSE_POINTER ? 3 : 6, Math.floor(DEVICE_CORES / 2)));
let thumbActive = 0;
const thumbQueue = [];

// [新增] 縮圖產生進度：這一批排進佇列的張數 / 已完成張數，顯示在調動工具列的小標籤
const thumbProgressPill = document.getElementById('thumbProgressPill');
let thumbBatchTotal = 0;
let thumbBatchDone = 0;
function updateThumbProgress() {
  const pending = thumbBatchTotal - thumbBatchDone;
  if (pending <= 0) {                              // 全部完成：重置並隱藏
    thumbBatchTotal = 0;
    thumbBatchDone = 0;
    thumbProgressPill.classList.add('hidden');
    return;
  }
  if (thumbBatchTotal < 6) return;                 // 張數很少時不打擾
  thumbProgressPill.textContent = `縮圖 ${Math.round((thumbBatchDone / thumbBatchTotal) * 100)}%（${thumbBatchDone}/${thumbBatchTotal}）`;
  thumbProgressPill.classList.remove('hidden');
}

function clearThumbnailCache() {
  thumbGeneration++;
  Object.values(thumbnailCache).forEach(url => URL.revokeObjectURL(url));
  thumbnailCache = {};
  renderingPages.clear();
  thumbQueue.length = 0;
  thumbBatchTotal = 0;
  thumbBatchDone = 0;
  updateThumbProgress();
}

function renderSingleThumbnail(key) {
  if (!window.pdfjsLib) return;

  if (thumbnailCache[key]) {
    applyCachedThumbToDom(key, thumbnailCache[key]);
    return;
  }

  if ((QUALITY_PRESETS[thumbQualitySelect.value] || {}).none) return;   // [新增] 光速：不產生縮圖，保留頁碼空框

  if (renderingPages.has(key)) return;
  renderingPages.add(key);
  thumbQueue.push(key);
  thumbBatchTotal++;                // [新增]
  updateThumbProgress();
  pumpThumbQueue();
}

function pumpThumbQueue() {
  while (thumbActive < THUMB_CONCURRENCY && thumbQueue.length > 0) {
    const key = thumbQueue.shift();
    if (!thumbVisible.get(key)) {                    // [效能] 已捲離可視範圍：不畫；捲回來時觀察器會重新排隊
      renderingPages.delete(key);
      thumbBatchTotal = Math.max(thumbBatchDone, thumbBatchTotal - 1);
      updateThumbProgress();
      continue;
    }
    thumbActive++;
    renderThumbnailNow(key).finally(() => {
      thumbActive--;
      pumpThumbQueue();
      if (thumbActive === 0 && thumbQueue.length === 0) scheduleIdleCleanup();   // [新增]
    });
  }
}

// [新增] 縮圖全部畫完、閒置一段時間後，請 pdf.js 釋放字型 / 影像等快取
let idleCleanupTimer = 0;
function scheduleIdleCleanup() {
  clearTimeout(idleCleanupTimer);
  idleCleanupTimer = setTimeout(() => {
    if (thumbActive > 0 || thumbQueue.length > 0) return;
    if (currentTab === 'read' || !previewModal.classList.contains('hidden')) return;   // 閱讀 / 預覽中不打斷
    docs.forEach(item => {
      if (item.pdfJsPromise) item.pdfJsPromise.then(d => d.cleanup()).catch(() => {});   // 仍在繪製時會丟錯，直接忽略
    });
  }, 1500);
}

// 取得檔案的 pdf.js 文件（載入檔案取頁數時就建立並快取；檔案只讀一次，位元組交給 pdf.js 保管）
// [新增] 串流讀檔並回報位元組進度（不支援串流或失敗時退回一次讀完）
// [修改] 新增 isCancelled：讀取途中被取消就立刻中止串流並丟出取消例外
async function readFileBytes(file, onRead, isCancelled) {
  if (!onRead || !file.stream) return new Uint8Array(await file.arrayBuffer());
  try {
    const out = new Uint8Array(file.size);
    const reader = file.stream().getReader();
    let off = 0;
    for (;;) {
      if (isCancelled && isCancelled()) {
        try { await reader.cancel(); } catch (e) {}
        throw makeCancelError();
      }
      const { done, value } = await reader.read();
      if (done) break;
      if (off + value.length > out.length) throw new Error('size mismatch');
      out.set(value, off);
      off += value.length;
      onRead(off, file.size);
    }
    if (off !== out.length) throw new Error('size mismatch');
    return out;
  } catch (err) {
    if (err && err.cancelled) throw err;             // [新增] 取消不要退回「一次讀完」
    return new Uint8Array(await file.arrayBuffer());
  }
}

// hooks（選用）：{ onRead(已讀, 總計), onParse() }，只有載入檔案時會傳入，用來顯示進度
// [新增] 超過這個大小的檔案改用「按需讀取」，不整份讀進記憶體
const RANGE_LOAD_MIN_BYTES = 64 * 1024 * 1024;

// [新增] 取得檔案完整位元組（儲存、預估壓縮時用）
async function getItemBytes(item) {
  if (item.usedRange) return new Uint8Array(await item.file.arrayBuffer());
  try { return await (await ensurePdfJsDoc(item)).getData(); }
  catch (e) { return new Uint8Array(await item.file.arrayBuffer()); }
}

// [修改] 大檔改走按需讀取；失敗（非密碼、非取消）會自動退回整份讀取
function ensurePdfJsDoc(item, hooks) {
  if (!item.pdfJsPromise) {
    const useRange = item.file.size >= RANGE_LOAD_MIN_BYTES && !item.rangeFailed;
    item.usedRange = useRange;

    const start = useRange
      ? item.file.slice(0, 65536).arrayBuffer().then(head => {
          if (item.cancelled) throw makeCancelError();
          if (hooks && hooks.onParse) hooks.onParse();
          const rt = new pdfjsLib.PDFDataRangeTransport(item.file.size, new Uint8Array(head));
          rt.requestDataRange = (begin, end) => {
            item.file.slice(begin, end).arrayBuffer()
              .then(buf => rt.onDataRange(begin, new Uint8Array(buf)))
              .catch(() => {});
          };
          const task = pdfjsLib.getDocument({
            range: rt,
            length: item.file.size,
            disableAutoFetch: true,
            password: item.password || undefined
          });
          item.loadingTask = task;
          return task.promise;
        })
      : readFileBytes(item.file, hooks && hooks.onRead, () => item.cancelled).then(bytes => {
          if (item.cancelled) throw makeCancelError();
          if (hooks && hooks.onParse) hooks.onParse();
          const task = pdfjsLib.getDocument({ data: bytes, password: item.password || undefined });
          item.loadingTask = task;
          return task.promise;
        });

    item.pdfJsPromise = start
      .then(doc => {
        item.loadingTask = null;
        if (item.cancelled) { doc.destroy(); throw makeCancelError(); }
        return doc;
      })
      .catch(err => {
        if (item.loadingTask) { try { item.loadingTask.destroy(); } catch (e) {} item.loadingTask = null; }
        item.pdfJsPromise = null;
        // [新增] 按需讀取失敗 → 退回舊的整份讀取
        if (useRange && !item.cancelled && !isPasswordError(err) && !(err && err.cancelled)) {
          console.warn('按需讀取失敗，改用整份讀取:', err);
          item.rangeFailed = true;
          return ensurePdfJsDoc(item, hooks);
        }
        throw err;
      });
  }
  return item.pdfJsPromise;
}

async function renderThumbnailNow(key) {
  const generation = thumbGeneration;

  try {
    const [docId, pageNum] = key.split('_').map(Number);
    const item = docs.find(d => d.id === docId);
    if (!item) return;

    const preset = QUALITY_PRESETS[thumbQualitySelect.value] || QUALITY_PRESETS.hd;
    const pdf = await ensurePdfJsDoc(item);
    const page = await pdf.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = preset.width / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d', { alpha: false });

    const renderParams = { canvasContext: ctx, viewport };
    if (preset.noAnnots && window.pdfjsLib && pdfjsLib.AnnotationMode) {
      renderParams.annotationMode = pdfjsLib.AnnotationMode.DISABLE;   // [新增] 超速：不繪製註解 / 表單欄位
    }
    await page.render(renderParams).promise;
    safeCleanup(page);                                   // [新增] 縮圖畫完就釋放此頁在 pdf.js 內的暫存（運算列表、影像快取）

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', preset.quality));

    canvas.width = 0;
    canvas.height = 0;

    if (generation !== thumbGeneration || !blob || !docs.includes(item)) return; // 已換清晰度 / 重建 / 檔案已被移除，丟棄舊結果

    const url = URL.createObjectURL(blob);
    thumbnailCache[key] = url;
    applyCachedThumbToDom(key, url);
  } catch (err) {
    if (generation === thumbGeneration) {
      console.error(`渲染縮圖 ${key} 失敗:`, err);
    }
  } finally {
    if (generation === thumbGeneration) {
      renderingPages.delete(key);
      thumbBatchDone++;             // [新增]
      updateThumbProgress();
    }
  }
}

// =======================
// 復原 / 重做（頁序模式：排序、刪除、反轉、旋轉、還原）
// =======================
const HISTORY_LIMIT = 100;
const HISTORY_PAGE_BUDGET = 150000;   // [效能] 所有復原快照加總的頁面物件上限（超多頁時自動縮短可復原的步數，避免吃光記憶體）
let undoStack = [];
let redoStack = [];

function snapshotReorder(label) {
  return {
    label,
    pages: reorderPages.map(p => ({
      uid: p.uid,                 // [新增]
      blank: !!p.blank,           // [新增]
      docId: p.docId,
      key: p.key,
      originalIndex: p.originalIndex,
      originalPageNum: p.originalPageNum,
      rotation: p.rotation || 0
    })),
    active: activeSidebarIndex
  };
}

// 每次「修改前」呼叫，記錄修改前的狀態
function pushHistory(label) {
  reorderEdited = true;
  undoStack.push(snapshotReorder(label));
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
  let histPages = 0;
  for (const e of undoStack) histPages += e.pages.length;
  while (undoStack.length > 1 && histPages > HISTORY_PAGE_BUDGET) histPages -= undoStack.shift().pages.length;
  redoStack = [];
  updateHistoryButtons();
}

function clearHistory() {
  undoStack = [];
  redoStack = [];
  updateHistoryButtons();
}

function updateHistoryButtons() {
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

function restoreSnapshot(snap) {
  // 勾選狀態不屬於編輯內容：保留目前仍存在的頁面的勾選
  const selectedSet = new Set(reorderPages.filter(p => p.selected).map(p => p.uid));   // [修改] 用 uid（複製的頁面 key 相同）
  reorderPages = snap.pages.map(p => ({ ...p, selected: selectedSet.has(p.uid) }));
  activeSidebarIndex = Math.max(0, Math.min(snap.active, reorderPages.length - 1));
  lastCheckedPageIndex = null;
  renderReorderPages();
  updateHistoryButtons();
}

function undoReorder() {
  if (reorderPages.length === 0 || undoStack.length === 0) return;
  const entry = undoStack.pop();
  redoStack.push(snapshotReorder(entry.label));
  restoreSnapshot(entry);
  setStatus(`↶ 已復原：${entry.label}`);
}

function redoReorder() {
  if (reorderPages.length === 0 || redoStack.length === 0) return;
  const entry = redoStack.pop();
  undoStack.push(snapshotReorder(entry.label));
  restoreSnapshot(entry);
  setStatus(`↷ 已重做：${entry.label}`);
}

undoBtn.addEventListener('click', undoReorder);
redoBtn.addEventListener('click', redoReorder);

window.addEventListener('keydown', (e) => {
  if (currentTab !== 'reorder' || reorderPages.length === 0) return;
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  if (!previewModal.classList.contains('hidden')) return;

  // 在輸入框內交給瀏覽器處理文字的復原
  const t = e.target;
  const typing = t && (t.tagName === 'TEXTAREA' || t.isContentEditable ||
    (t.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'button'].includes(t.type)));
  if (typing) return;

  const key = e.key.toLowerCase();
  if (key === 'z' && !e.shiftKey) {
    e.preventDefault();
    undoReorder();
  } else if ((key === 'z' && e.shiftKey) || key === 'y') {
    e.preventDefault();
    redoReorder();
  }
});

// =======================
// 頁面旋轉（僅在畫面以 CSS 預覽，儲存時才寫入 PDF）
// =======================
const THUMB_BOX_ASPECT = 1 / 1.414; // 縮圖容器寬高比，需與 CSS aspect-ratio 一致

// 旋轉 90 / 270 度時，縮放圖片讓整頁仍完整放進縮圖容器
function fitScaleForRotation(naturalW, naturalH, deg) {
  if (deg % 180 === 0 || !naturalW || !naturalH) return 1;
  const a = naturalW / naturalH;
  const boxW = 1;
  const boxH = 1 / THUMB_BOX_ASPECT;
  const contentW = a > THUMB_BOX_ASPECT ? boxW : boxH * a;
  const contentH = a > THUMB_BOX_ASPECT ? boxW / a : boxH;
  return Math.min(boxW / contentH, boxH / contentW);
}

function setImgRotation(img, deg) {
  img.dataset.rot = String(deg);
  const apply = () => {
    const d = parseInt(img.dataset.rot || '0', 10);
    if (d === 0) {
      img.style.transform = '';
      return;
    }
    const s = fitScaleForRotation(img.naturalWidth, img.naturalHeight, d);
    img.style.transform = `rotate(${d}deg) scale(${s})`;
  };
  if (img.complete && img.naturalWidth) {
    apply();
  } else {
    img.addEventListener('load', apply, { once: true });
  }
}

// [修改] 改用 uid 查旋轉角度（複製的頁面 key 相同，但旋轉各自獨立）
function getPageRotation(uid) {
  const p = reorderPages.find(x => x.uid === uid);
  return p ? (p.rotation || 0) : 0;
}

function refreshPageRotationDom(pageObj) {
  const rot = pageObj.rotation || 0;
  (uidEls.get(pageObj.uid) || []).forEach(wrapper => {   // [效能] 查表
    const img = wrapper.querySelector('.page-thumb-img');
    if (img) setImgRotation(img, rot);
  });
  const card = uidCard.get(pageObj.uid);                 // [效能] 批次旋轉大量頁面時不再每頁 O(n) 掃描
  const idx = card ? parseInt(card.dataset.cardIndex, 10) : -1;
  if (card) card.setAttribute('aria-label', pageCardLabel(pageObj, idx));
  const tag = card && card.querySelector('.rot-tag');
  if (tag) {
    tag.textContent = `↻${rot}°`;
    tag.classList.toggle('hidden', rot === 0);
  }
}

function rotatePages(pageObjs, delta) {
  if (pageObjs.length === 0) return;
  pushHistory(delta > 0 ? '向右旋轉' : '向左旋轉');
  pageObjs.forEach(p => {
    p.rotation = (((p.rotation || 0) + delta) % 360 + 360) % 360;
    refreshPageRotationDom(p);
  });
  updateSaveButtonState();
}

rotateLeftSelectedBtn.addEventListener('click', () => {
  const targets = reorderPages.filter(p => p.selected);
  rotatePages(targets, -90);
  if (targets.length > 0) setStatus(`✓ 已將 ${targets.length} 頁向左旋轉 90°`, 'success');
});
rotateRightSelectedBtn.addEventListener('click', () => {
  const targets = reorderPages.filter(p => p.selected);
  rotatePages(targets, 90);
  if (targets.length > 0) setStatus(`✓ 已將 ${targets.length} 頁向右旋轉 90°`, 'success');
});

function applyCachedThumbToDom(key, dataUrl) {
  const wrappers = thumbEls.get(key);                    // [效能] 查表，不再對整份 DOM 做屬性選擇器掃描（原本畫 N 張縮圖 = O(N²)）
  if (!wrappers) return;
  wrappers.forEach(wrapper => {
    if (!wrapper.isConnected) return;
    const imgEl = wrapper.querySelector('.page-thumb-img');
    const placeholderEl = wrapper.querySelector('.thumb-placeholder');
    if (imgEl) {
      imgEl.src = dataUrl;
      imgEl.classList.add('loaded');
      const pg = uidPage.get(parseInt(wrapper.dataset.uid, 10));
      setImgRotation(imgEl, pg ? (pg.rotation || 0) : 0);
    }
    if (placeholderEl) {
      placeholderEl.remove();
    }
    if (thumbObserver) thumbObserver.unobserve(wrapper);   // 畫好就不必再追蹤
  });
}

// =========================================
// 調動：檔案顯示篩選
//  取消勾選的檔案，其頁面會暫存起來並從調動（與儲存）中移除；重新勾選時原樣放回（接在最後）
// =========================================
const fileFilterWrap = document.getElementById('fileFilterWrap');
const fileFilterBtn = document.getElementById('fileFilterBtn');
const fileFilterBadge = document.getElementById('fileFilterBadge');
const fileFilterMenu = document.getElementById('fileFilterMenu');
const fileFilterList = document.getElementById('fileFilterList');
const fileFilterAllBtn = document.getElementById('fileFilterAll');
const fileFilterNoneBtn = document.getElementById('fileFilterNone');
let hiddenDocIds = new Set();        // 目前在調動中隱藏的檔案
const hiddenPageStash = new Map();   // docId -> 被隱藏檔案的頁面（保留原本的順序與旋轉）

function loadedDocs() { return docs.filter(d => d.pageCount > 0); }
function visibleReadyDocs() { return loadedDocs().filter(d => !hiddenDocIds.has(d.id)); }

function pruneHiddenDocs() {
  const ids = new Set(docs.map(d => d.id));
  [...hiddenDocIds].forEach(id => {
    if (!ids.has(id)) { hiddenDocIds.delete(id); hiddenPageStash.delete(id); }
  });
}

function updateFileFilterUI() {
  const ready = loadedDocs();
  const multi = ready.length > 1;
  fileFilterWrap.classList.toggle('hidden', !multi);
  if (!multi) { closeFileFilterMenu(); return; }
  const shown = ready.filter(d => !hiddenDocIds.has(d.id)).length;
  const filtered = shown < ready.length;
  fileFilterBadge.textContent = `${shown}/${ready.length}`;
  fileFilterBadge.classList.toggle('hidden', !filtered);
  fileFilterBtn.classList.toggle('active', filtered);
  fileFilterBtn.title = filtered
    ? `調動中顯示 ${shown} / ${ready.length} 個檔案（點擊調整）`
    : '選擇要在調動中顯示的檔案';
  if (!fileFilterMenu.classList.contains('hidden')) renderFileFilterList();
}

function renderFileFilterList(focusIdx = -1) {
  const ready = loadedDocs();
  const shown = ready.filter(d => !hiddenDocIds.has(d.id)).length;
  fileFilterAllBtn.disabled = shown === ready.length;
  fileFilterNoneBtn.disabled = shown <= 1;
  fileFilterList.innerHTML = '';
  ready.forEach((d, i) => {
    const checked = !hiddenDocIds.has(d.id);
    const li = document.createElement('li');
    li.className = 'filter-item';

    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'filter-row';
    row.setAttribute('role', 'checkbox');
    row.setAttribute('aria-checked', String(checked));
    row.dataset.docId = d.id;
    row.title = d.name;
    row.innerHTML = '<span class="filter-check">✓</span><span class="filter-dot"></span><span class="filter-name"></span><span class="filter-count"></span>';
    const fdot = row.querySelector('.filter-dot');
    fdot.textContent = String(i + 1);
    fdot.style.background = DOC_COLORS[i % DOC_COLORS.length];
    row.querySelector('.filter-name').textContent = d.name.replace(/\.pdf$/i, '');
    row.querySelector('.filter-count').textContent = `${d.pageCount} 頁`;

    const only = document.createElement('button');
    only.type = 'button';
    only.className = 'filter-only-btn';
    only.dataset.docId = d.id;
    only.dataset.only = '1';
    only.textContent = '只看此檔';
    only.title = '只顯示這個檔案';

    li.append(row, only);
    fileFilterList.appendChild(li);
  });
  if (focusIdx >= 0) {
    const rows = fileFilterList.querySelectorAll('.filter-row');
    if (rows[focusIdx]) rows[focusIdx].focus();
  }
}

function closeFileFilterMenu() {
  if (fileFilterMenu.classList.contains('hidden')) return;
  fileFilterMenu.classList.add('hidden');
  fileFilterBtn.setAttribute('aria-expanded', 'false');
}

// 套用新的「顯示哪些檔案」：把被取消的檔案頁面收起、被勾回的檔案頁面放回
function setVisibleDocs(visibleIds) {
  const ready = loadedDocs();
  const nextHidden = new Set(ready.filter(d => !visibleIds.has(d.id)).map(d => d.id));
  if (nextHidden.size >= ready.length) return;                       // 至少保留 1 個檔案
  const same = nextHidden.size === hiddenDocIds.size && [...nextHidden].every(id => hiddenDocIds.has(id));
  if (same) return;

  const newlyHidden = [...nextHidden].filter(id => !hiddenDocIds.has(id));
  const newlyShown = [...hiddenDocIds].filter(id => !nextHidden.has(id));

  newlyHidden.forEach(id => {
    hiddenPageStash.set(id, reorderPages.filter(p => p.docId === id));
  });
  if (newlyHidden.length) {
    const hs = new Set(newlyHidden);
    reorderPages = reorderPages.filter(p => !hs.has(p.docId));
  }
  newlyShown.forEach(id => {
    const stash = hiddenPageStash.get(id);
    const d = docs.find(x => x.id === id);
    reorderPages.push(...(stash || (d ? buildPageList([d]) : [])));
    hiddenPageStash.delete(id);
  });
  hiddenDocIds = nextHidden;

  reorderPages.forEach(p => { p.selected = false; });
  activeSidebarIndex = Math.max(0, Math.min(activeSidebarIndex, reorderPages.length - 1));
  lastCheckedPageIndex = null;
  clearHistory();                                                     // 檔案顯示變更後，舊的復原紀錄已不適用
  enforceQualityCap(visibleReadyDocs());                              // 顯示的檔案變了：重新評估清晰度上限
  renderReorderPages();
  updateSelectionUI();
  updateFileFilterUI();
  updateSaveButtonState();
  setStatus(`調動顯示 ${visibleReadyDocs().length} / ${ready.length} 個檔案（共 ${reorderPages.length} 頁）`);
}

function currentVisibleIdSet() { return new Set(visibleReadyDocs().map(d => d.id)); }

fileFilterBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (!fileFilterMenu.classList.contains('hidden')) { closeFileFilterMenu(); return; }
  closeMenus();
  renderFileFilterList();
  fileFilterMenu.classList.remove('hidden');
  fileFilterBtn.setAttribute('aria-expanded', 'true');
  const r = fileFilterBtn.getBoundingClientRect();
  const w = fileFilterMenu.offsetWidth;
  fileFilterMenu.style.top = `${r.bottom + 4}px`;
  fileFilterMenu.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.left))}px`;
});

// 選單內的點擊不往外傳（避免觸發「點外面關閉」；選項重繪後 target 也會脫離 DOM）
fileFilterMenu.addEventListener('click', (e) => {
  e.stopPropagation();
  const onlyBtn = e.target.closest('[data-only]');
  if (onlyBtn) {
    setVisibleDocs(new Set([Number(onlyBtn.dataset.docId)]));
    renderFileFilterList();
    return;
  }
  const row = e.target.closest('.filter-row');
  if (row) {
    const idx = [...fileFilterList.querySelectorAll('.filter-row')].indexOf(row);
    const ids = currentVisibleIdSet();
    const id = Number(row.dataset.docId);
    if (ids.has(id)) ids.delete(id); else ids.add(id);
    if (ids.size === 0) { setStatus('至少要保留 1 個檔案', 'error'); return; }
    setVisibleDocs(ids);
    renderFileFilterList(idx);
  }
});

fileFilterAllBtn.addEventListener('click', () => {
  setVisibleDocs(new Set(loadedDocs().map(d => d.id)));
  renderFileFilterList();
});
fileFilterNoneBtn.addEventListener('click', () => {
  // 「取消全選」：只保留第一個仍顯示的檔案（至少要有 1 個）
  const keep = visibleReadyDocs()[0] || loadedDocs()[0];
  if (keep) setVisibleDocs(new Set([keep.id]));
  renderFileFilterList();
});

fileFilterMenu.addEventListener('keydown', (e) => {
  const rows = [...fileFilterList.querySelectorAll('.filter-row')];
  const i = rows.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); rows[(i + 1) % rows.length]?.focus(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); rows[(i - 1 + rows.length) % rows.length]?.focus(); }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#fileFilterWrap')) closeFileFilterMenu();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !fileFilterMenu.classList.contains('hidden')) {
    e.preventDefault();
    closeFileFilterMenu();
    fileFilterBtn.focus();
  }
}, true);
window.addEventListener('resize', closeFileFilterMenu);

// [新增] 頁面唯一識別碼
let pageUidSeq = 0;
const newPageUid = () => ++pageUidSeq;

function buildPageList(readyDocs) {
  return readyDocs.flatMap(d =>
    Array.from({ length: d.pageCount }, (_, i) => ({
      uid: newPageUid(),
      docId: d.id,
      key: `${d.id}_${i + 1}`,
      originalIndex: i,
      originalPageNum: i + 1,
      selected: false,
      rotation: 0
    }))
  );
}

// [新增] 大檔預設的縮圖寬度：70px ÷ 200px = 35%
const LARGE_DOC_DEFAULT_THUMB_WIDTH = 70;

// 依總頁數與檔案大小自動挑選縮圖清晰度；回傳是否有變動
// [新增] 更大型檔案的門檻（頁數「或」檔案大小任一達到就升級；想調整改這裡）
const MB = 1024 * 1024;
const QUALITY_ULTRA_AT   = { pages: 300, bytes: 120 * MB };   // 達到 → 超速
const QUALITY_INSTANT_AT = { pages: 400, bytes: 200 * MB };   // 達到 → 光速（[修改] 原為 800 頁 / 400 MB）
const LARGE_QUALITIES = ['fast', 'ultra', 'instant'];         // 這些等級視為「大檔」，預設檢視比例 35%

// [新增] 清晰度由低到高；大檔時下拉選單中「高於自動等級」的選項會被停用（縮圖快取沒有上限，
// 上萬頁若用「清晰」「高清」會吃掉大量記憶體），維持自動選到的低清晰度
const QUALITY_ORDER = ['instant', 'ultra', 'fast', 'medium', 'high', 'hd'];

function autoQualityLevel(readyDocs) {
  const totalPages = readyDocs.reduce((sum, d) => sum + d.pageCount, 0);
  const totalSize = readyDocs.reduce((sum, d) => sum + d.file.size, 0);
  let q = 'fast';
  if (totalPages >= QUALITY_INSTANT_AT.pages || totalSize >= QUALITY_INSTANT_AT.bytes) q = 'instant';
  else if (totalPages >= QUALITY_ULTRA_AT.pages || totalSize >= QUALITY_ULTRA_AT.bytes) q = 'ultra';
  else if (totalPages <= 30 && totalSize <= 15 * MB) q = 'hd';
  else if (totalPages <= 65) q = 'high';
  return q;
}

// 套用「大檔清晰度上限」：只有自動等級屬於大檔（極速 / 超速 / 光速）時才有上限
function applyQualityCap(readyDocs) {
  const auto = autoQualityLevel(readyDocs);
  const cap = LARGE_QUALITIES.includes(auto) ? auto : null;
  const capIdx = cap ? QUALITY_ORDER.indexOf(cap) : QUALITY_ORDER.length;
  Array.from(thumbQualitySelect.options).forEach(opt => {
    opt.disabled = QUALITY_ORDER.indexOf(opt.value) > capIdx;
  });
  thumbQualitySelect.title = cap
    ? '大檔案為節省記憶體，清晰度上限固定為自動選擇的等級（較高的選項已停用）'
    : '縮圖清晰度（30 頁內自動預設高清）';
  syncQualityMenu();   // 同步選單的停用狀態與提示文字
  return { auto, cap, capIdx };
}

// 檔案增減後：重新評估上限；若目前等級高於上限就降到上限，並清掉舊縮圖快取。回傳是否有降級
function enforceQualityCap(readyDocs) {
  const { cap, capIdx } = applyQualityCap(readyDocs);
  if (!cap || QUALITY_ORDER.indexOf(thumbQualitySelect.value) <= capIdx) return false;
  thumbQualitySelect.value = cap;
  updateThumbModeHint();
  clearThumbnailCache();
  return true;
}

function autoQualityFor(readyDocs) {
  const q = autoQualityLevel(readyDocs);
  const changed = thumbQualitySelect.value !== q;
  thumbQualitySelect.value = q;
  applyQualityCap(readyDocs);
  updateThumbModeHint();
  return changed;
}

// [修改] 縮圖清晰度改為工具列上的下拉按鈕，不再顯示說明文字；這裡只負責光速模式的空框樣式
function updateThumbModeHint() {
  reorderBody.classList.toggle('thumbs-instant', thumbQualitySelect.value === 'instant');
}

// 讓調動的頁面與檔案庫一致：
//  - 還沒編輯過：依檔案庫順序完整重建
//  - 已有編輯：只新增 / 移除檔案的頁面，保留使用者調整的順序
function syncReorder() {
  pruneHiddenDocs();
  if (hiddenDocIds.size > 0 && !docs.some(d => d.pageCount > 0 && !hiddenDocIds.has(d.id))) {
    hiddenDocIds.clear();
    hiddenPageStash.clear();
  }
  const ready = docs.filter(d => d.pageCount > 0 && !hiddenDocIds.has(d.id));   // 調動中實際顯示的檔案
  const hasPages = docs.some(d => d.pageCount > 0);
  updateFileFilterUI();
  reorderBody.classList.toggle('hidden', !hasPages);
  reorderTools.classList.toggle('hidden', !hasPages);

  if (!hasPages) {
    hiddenDocIds.clear();
    hiddenPageStash.clear();
    reorderRenderGen++;
    if (reorderPages.length > 0) {
      reorderPages = [];
      clearThumbnailCache();
      reorderPageList.innerHTML = '';
      sidebarThumbList.innerHTML = '';
    }
    reorderEdited = false;
    reorderOrderSig = '';
    rangeSelectInput.value = '';                 // [新增] 清空後不保留上次輸入的頁碼範圍
    rangeSelectInput.classList.remove('invalid');
    isSelectionMode = false;
    setSelectToggleUI(toggleSelectModeBtn, false);
    selectionSubTools.classList.add('hidden');
    rangeSelectWrap.classList.add('hidden');     // [新增]
    document.body.classList.remove('selecting'); // [新增]
    closeMenus();                                // [新增]
    reorderBody.classList.remove('selection-mode');
    clearHistory();
    updateSelectionUI();
    return;
  }

  const sig = ready.map(d => d.id).join(',');
  const ids = new Set(ready.map(d => d.id));
  const wasEmpty = reorderPages.length === 0;
  const hasNewDoc = ready.some(d => !d.pagesAdded);
  const hasGoneDoc = reorderPages.some(p => !ids.has(p.docId));

  if (!wasEmpty && sig === reorderOrderSig && !hasNewDoc && !hasGoneDoc) return; // 沒有變化

  if (!thumbObserver) initThumbObserver();

  // 檔案增減後（非首次載入）：大檔總量變大時，把清晰度壓回上限
  if (!wasEmpty) enforceQualityCap(ready);

  if (wasEmpty || !reorderEdited) {
    reorderPages = buildPageList(ready);
    ready.forEach(d => { d.pagesAdded = true; });
    if (wasEmpty) {
      clearThumbnailCache();
      autoQualityFor(ready);
      initThumbObserver();
    }
    reorderEdited = false;
    activeSidebarIndex = 0;
    lastCheckedPageIndex = null;
    clearHistory();
    renderReorderPages();
    if (wasEmpty) {
      const isMobileView = window.innerWidth <= 820;
      if (LARGE_QUALITIES.includes(thumbQualitySelect.value)) {
        // 手機版大檔仍維持雙頁寬度才看得清、點得到；桌機版維持 35%
        if (isMobileView) applyColumnPreset(2);
        else applyContinuousZoom(LARGE_DOC_DEFAULT_THUMB_WIDTH);
      } else {
        // 手機預設「雙頁（2 欄）」，桌機預設「四頁（4 欄）」
        applyColumnPreset(isMobileView ? 2 : 4);
      }
    }
  } else if (!hasNewDoc && !hasGoneDoc) {
    // 只是檔案庫的排序變了：使用者已自訂頁序，不動頁面，也保留復原紀錄
  } else {
    if (hasGoneDoc) reorderPages = reorderPages.filter(p => ids.has(p.docId));
    ready.filter(d => !d.pagesAdded).forEach(d => {
      reorderPages.push(...buildPageList([d]));
      d.pagesAdded = true;
    });
    activeSidebarIndex = Math.max(0, Math.min(activeSidebarIndex, reorderPages.length - 1));
    lastCheckedPageIndex = null;
    clearHistory(); // 檔案增減後，舊的復原紀錄已不適用
    renderReorderPages();
    setStatus('已依檔案庫更新頁面（復原紀錄已清除）');
  }
  reorderOrderSig = sig;
}

function docNameOf(pageObj) {
  if (renderDocCache) return renderDocCache.name.get(pageObj.docId) || '';
  const d = docs.find(x => x.id === pageObj.docId);
  return d ? d.name : '';
}

// [新增] 多檔案時用「色彩圓點 + 編號」代替過長的檔名（顏色依檔案順序固定）
const DOC_COLORS = ['#e37400', '#1a73e8', '#188038', '#a142f4', '#d93025', '#00897b', '#c2185b', '#5f6368'];
function docIndexOf(docId) {
  if (renderDocCache) { const i = renderDocCache.idx.get(docId); return i === undefined ? -1 : i; }
  return docs.filter(d => d.pageCount > 0).findIndex(d => d.id === docId);
}
function docColorOf(pageObj) {
  const i = docIndexOf(pageObj.docId);
  return DOC_COLORS[(i < 0 ? 0 : i) % DOC_COLORS.length];
}
function buildDocTag(pageObj) {
  const i = docIndexOf(pageObj.docId);
  const name = docNameOf(pageObj).replace(/\.pdf$/i, '');
  const wrap = document.createElement('span');
  wrap.className = 'orig-tag doc-tag';
  wrap.title = `${docNameOf(pageObj)}｜原第 ${pageObj.originalPageNum} 頁`;
  const dot = document.createElement('span');
  dot.className = 'doc-dot';
  dot.textContent = String(i + 1);
  const nm = document.createElement('span');
  nm.className = 'doc-name';
  nm.textContent = name;
  const n = document.createElement('span');
  n.className = 'doc-n';
  n.textContent = pageObj.blank ? '·空白' : `·${pageObj.originalPageNum}`;   // [修改]
  wrap.append(dot, nm, n);
  // 手機沒有滑過提示：點一下顯示完整檔名
  wrap.addEventListener('click', (e) => {
    e.stopPropagation();
    setStatus(`${i + 1}. ${docNameOf(pageObj)}（原第 ${pageObj.originalPageNum} 頁）`, '', false, 3200);
  });
  return wrap;
}

// 頁面標註「來源」：單檔時只在頁序改變後顯示「原N」；多檔時一律顯示來源
function origTagText(pageObj, index, compact) {
  if (pageObj.blank) return '空白';      // [新增]
  const n = pageObj.originalPageNum;
  if (!reorderMulti) {
    if (n === index + 1) return '';
    return compact ? `(${n})` : `(原${n})`;
  }
  const docIdx = docIndexOf(pageObj.docId);
  if (compact) return `(${docIdx + 1}-${n})`;
  const name = docNameOf(pageObj).replace(/\.pdf$/i, '');
  return `(${name.length > 8 ? name.slice(0, 8) + '…' : name}·${n})`;
}

// [效能] 卡片上的「前移 / 後移 / 預覽 / 刪除 / 旋轉」按鈕：第一次滑過卡片時才建立（原本每張卡片一開始就建 6 個按鈕 + SVG）
function buildCardBars(thumbWrapper, pageObj, index) {
  if (thumbWrapper.querySelector('.card-hover-actions')) return;
    const hoverBar = document.createElement('div');
    hoverBar.className = 'card-hover-actions';

    const actionGroup = document.createElement('div');
    actionGroup.className = 'hover-group';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'float-btn';
    setIcon(prevBtn, 'left', 16);
    prevBtn.title = '前移一頁';
    prevBtn.disabled = index === 0;
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moveReorderPage(index, -1);
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'float-btn';
    setIcon(nextBtn, 'right', 16);
    nextBtn.title = '後移一頁';
    nextBtn.disabled = index === reorderPages.length - 1;
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moveReorderPage(index, 1);
    });

    const zoomBtn = document.createElement('button');
    zoomBtn.className = 'float-btn';
    setIcon(zoomBtn, 'zoom', 16);
    zoomBtn.title = '獨立燈箱預覽';
    zoomBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openHighResPreview(pageObj);
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'float-btn danger';
    setIcon(removeBtn, 'close', 16);
    removeBtn.title = '移除此頁';
    removeBtn.disabled = reorderPages.length <= 1;
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pushHistory('移除頁面');
      reorderPages.splice(index, 1);
      if (activeSidebarIndex >= reorderPages.length) {
        activeSidebarIndex = reorderPages.length - 1;
      }
      renderReorderPages();
    });

    actionGroup.append(prevBtn, nextBtn, zoomBtn, removeBtn);
    hoverBar.appendChild(actionGroup);

    // 旋轉按鈕（縮圖左下角，滑過才顯示）
    const rotateBar = document.createElement('div');
    rotateBar.className = 'card-rotate-actions';
    const rotateGroup = document.createElement('div');
    rotateGroup.className = 'hover-group';

    const rotLeftBtn = document.createElement('button');
    rotLeftBtn.className = 'float-btn';
    setIcon(rotLeftBtn, 'rotL', 16);
    rotLeftBtn.title = '向左旋轉 90°';
    rotLeftBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      rotatePages([pageObj], -90);
    });

    const rotRightBtn = document.createElement('button');
    rotRightBtn.className = 'float-btn';
    setIcon(rotRightBtn, 'rotR', 16);
    rotRightBtn.title = '向右旋轉 90°';
    rotRightBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      rotatePages([pageObj], 90);
    });

    [prevBtn, nextBtn, zoomBtn, removeBtn, rotLeftBtn, rotRightBtn].forEach(b => {
      b.setAttribute('aria-label', b.title);
      b.tabIndex = -1;
    });
    rotateGroup.append(rotLeftBtn, rotRightBtn);
    rotateBar.appendChild(rotateGroup);
  const anchor = thumbWrapper.querySelector('.select-check-badge');
  thumbWrapper.insertBefore(rotateBar, anchor ? anchor.nextSibling : thumbWrapper.firstChild);
  thumbWrapper.insertBefore(hoverBar, anchor ? anchor.nextSibling : thumbWrapper.firstChild);
}

// [優化] 調動畫面漸進式建立卡片：先建可視範圍附近的一批，其餘在閒置時分批補上（不再一次建立上萬張卡片卡住畫面）
let reorderRenderGen = 0;                 // 每次重繪遞增，讓舊的分批工作失效
let ensureCardBuilt = () => {};           // 確保第 i 張卡片已建立（跳頁 / 鍵盤導覽前呼叫）
const REORDER_FIRST_BATCH = 300;
const REORDER_CHUNK = 250;

function renderReorderPages() {
  renderDocCache = { idx: new Map(), name: new Map() };
  let n = 0;
  docs.forEach(d => { renderDocCache.name.set(d.id, d.name); if (d.pageCount > 0) renderDocCache.idx.set(d.id, n++); });
  try { renderReorderPagesImpl(); } finally { renderDocCache = null; }
}

function renderReorderPagesImpl() {
  const hadFocus = reorderPageList.contains(document.activeElement);   // 重繪後要把焦點還給卡片
  // [優化] 記住捲動位置，並估算「要補建到第幾張卡片才蓋得到原本的位置」（漸進式建立後不先補建，捲動位置會被夾回頂端）
  const prevTop = reorderPageList.scrollTop;
  const prevSideTop = reorderSidebar.scrollTop;
  let needCards = 0;
  if (prevTop > 0 && cardEls.length > 0) {
    const rowH = (cardEls[0].offsetHeight || 0) + 20;
    if (rowH > 20) needCards = (Math.ceil((prevTop + reorderPageList.clientHeight) / rowH) + 2) * pageGridColumns();
  }
  if (prevSideTop > 0 && sideEls.length > 0) {
    const itemH = (sideEls[0].offsetHeight || 0) + 12;
    if (itemH > 12) needCards = Math.max(needCards, Math.ceil((prevSideTop + reorderSidebar.clientHeight) / itemH) + 2);
  }
  reorderPageList.innerHTML = '';
  sidebarThumbList.innerHTML = '';
  cardEls = []; sideEls = [];
  thumbEls = new Map(); uidEls = new Map(); uidPage = new Map(); uidCard = new Map();
  thumbVisible = new Map();
  initThumbObserver();                                   // [效能] 每次重繪都重建觀察器：不再握住已脫離畫面的舊元素
  const buildSide = !reorderSidebar.classList.contains('hidden');   // [效能] 側欄收合時不建立（DOM 少一半）
  reorderPages.forEach(pg => { pg._sig = undefined; uidPage.set(pg.uid, pg); });

  const reorderDocIds = new Set(reorderPages.map(p => p.docId));
  reorderMulti = reorderDocIds.size > 1;
  reorderPageInfo.title = reorderMulti
    ? `${reorderDocIds.size} 個檔案`
    : docNameOf(reorderPages[0] || {});

  const buildCard = (index, cardFrag, sideFrag) => {
    const pageObj = reorderPages[index];
    const li = document.createElement('li');
    li.className = 'page-card';
    li.draggable = true;
    li.dataset.cardIndex = index;
    li.tabIndex = index === activeSidebarIndex ? 0 : -1;     // roving tabindex：Tab 只停在目前這一張
    li.setAttribute('role', 'option');
    li.setAttribute('aria-label', pageCardLabel(pageObj, index));
    bindPageCardKeys(li, pageObj, index);

    const thumbWrapper = document.createElement('div');
    thumbWrapper.className = 'thumb-wrapper';
    thumbWrapper.dataset.pageNum = pageObj.key;
    thumbWrapper.dataset.uid = pageObj.uid;                          // [新增]
    pushMap(uidEls, pageObj.uid, thumbWrapper);
    if (!pageObj.blank) pushMap(thumbEls, pageObj.key, thumbWrapper);
    if (pageObj.blank) thumbWrapper.classList.add('is-blank');       // [新增]
    thumbWrapper.title = '按住可拖曳排序（選取模式下會一起拖曳所有已勾選頁面，按住 Ctrl 則只拖曳這一頁）；雙擊可開啟獨立預覽視窗';

    li.addEventListener('click', (e) => {
      if (isSelectionMode) {
        togglePageSelection(index, e.shiftKey);
      } else {
        setActivePage(index, false);
      }
    });

    thumbWrapper.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openHighResPreview(pageObj);
    });

    const checkBadge = document.createElement('span');
    checkBadge.className = 'select-check-badge';
    checkBadge.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';


    const img = document.createElement('img');
    img.className = 'page-thumb-img';
    img.alt = '';   // 卡片本身已有 aria-label，縮圖視為裝飾
    img.draggable = false;

    if (pageObj.blank) {
      // [新增] 空白頁：不需要渲染縮圖，直接顯示白底＋「空白」字樣
      const placeholder = document.createElement('div');
      placeholder.className = 'thumb-placeholder';
      placeholder.textContent = '空白頁';
      thumbWrapper.append(checkBadge, placeholder);
    } else if (thumbnailCache[pageObj.key]) {
      img.src = thumbnailCache[pageObj.key];
      img.classList.add('loaded');
      setImgRotation(img, pageObj.rotation || 0);
      thumbWrapper.append(checkBadge, img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'thumb-placeholder';
      placeholder.textContent = `${pageObj.originalPageNum}`;
      thumbWrapper.append(checkBadge, placeholder, img);
      if (thumbObserver) {
        thumbObserver.observe(thumbWrapper);
      }
    }

    checkBadge.setAttribute('aria-hidden', 'true');
    thumbWrapper.addEventListener('pointerenter', () => buildCardBars(thumbWrapper, pageObj, index), { once: true });

    const caption = document.createElement('div');
    caption.className = 'page-caption';

    const numPill = document.createElement('span');
    numPill.className = 'page-num-pill';
    numPill.textContent = `${index + 1}`;
    caption.appendChild(numPill);

    if (reorderMulti) {
      li.classList.add('multi-doc');
      li.style.setProperty('--doc-color', docColorOf(pageObj));
      caption.appendChild(buildDocTag(pageObj));
    } else {
      const origText = origTagText(pageObj, index, false);
      if (origText) {
        const origSpan = document.createElement('span');
        origSpan.className = 'orig-tag';
        origSpan.textContent = origText;
        origSpan.title = docNameOf(pageObj);
        caption.appendChild(origSpan);
      }
    }

    const rotTag = document.createElement('span');
    rotTag.className = 'rot-tag' + ((pageObj.rotation || 0) === 0 ? ' hidden' : '');
    rotTag.textContent = `↻${pageObj.rotation || 0}°`;
    caption.appendChild(rotTag);

    li.append(thumbWrapper, caption);
    bindPageDragEvents(li, index);
    cardFrag.appendChild(li);
    cardEls.push(li);
    uidCard.set(pageObj.uid, li);

    if (buildSide) {
    const sideItem = document.createElement('li');
    sideItem.className = 'sidebar-item';
    sideItem.draggable = true;
    sideItem.title = `點擊定位至第 ${index + 1} 頁；按住可上下拖曳調整頁序（Ctrl＝只拖單頁）`;
    sideItem.setAttribute('aria-label', `定位至第 ${index + 1} 頁`);

    const sideBox = document.createElement('div');
    sideBox.className = 'sidebar-thumb-box';
    sideBox.dataset.pageNum = pageObj.key;
    sideBox.dataset.uid = pageObj.uid;                               // [新增]
    pushMap(uidEls, pageObj.uid, sideBox);
    if (!pageObj.blank) pushMap(thumbEls, pageObj.key, sideBox);
    if (pageObj.blank) sideBox.classList.add('is-blank');            // [新增]

    const sideImg = document.createElement('img');
    sideImg.className = 'page-thumb-img';
    sideImg.draggable = false;

    if (pageObj.blank) {
      // [新增] 空白頁
      const sidePlaceholder = document.createElement('div');
      sidePlaceholder.className = 'thumb-placeholder';
      sidePlaceholder.textContent = '空白';
      sideBox.appendChild(sidePlaceholder);
    } else if (thumbnailCache[pageObj.key]) {
      sideImg.src = thumbnailCache[pageObj.key];
      sideImg.classList.add('loaded');
      setImgRotation(sideImg, pageObj.rotation || 0);
      sideBox.appendChild(sideImg);
    } else {
      const sidePlaceholder = document.createElement('div');
      sidePlaceholder.className = 'thumb-placeholder';
      sidePlaceholder.textContent = `${pageObj.originalPageNum}`;
      sideBox.append(sidePlaceholder, sideImg);
      if (thumbObserver) {
        thumbObserver.observe(sideBox);
      }
    }

    const sideCaption = document.createElement('div');
    sideCaption.className = 'sidebar-caption';

    const sideDot = document.createElement('span');
    sideDot.className = 'sidebar-check-dot';

    const sideNumBadge = document.createElement('span');
    sideNumBadge.className = 'sidebar-num-badge';
    sideNumBadge.textContent = `${index + 1}`;

    sideCaption.append(sideDot, sideNumBadge);
    const sideOrigText = origTagText(pageObj, index, true);
    if (sideOrigText) {
      const sideOrig = document.createElement('span');
      sideOrig.className = 'orig-tag';
      sideOrig.textContent = sideOrigText;
      sideOrig.title = docNameOf(pageObj);
      if (reorderMulti) sideOrig.style.color = docColorOf(pageObj);
      sideCaption.appendChild(sideOrig);
    }

    sideItem.append(sideBox, sideCaption);

    sideItem.addEventListener('click', () => {
      setActivePage(index, true);
    });

    bindPageDragEvents(sideItem, index);
    sideFrag.appendChild(sideItem);
    sideEls.push(sideItem);
    }
  };

  const docCache = renderDocCache;
  const myGen = ++reorderRenderGen;
  let built = 0;
  const buildRange = (to) => {
    to = Math.min(to, reorderPages.length);
    if (built >= to) return;
    const cf = document.createDocumentFragment();
    const sf = buildSide ? document.createDocumentFragment() : null;
    const prevCache = renderDocCache;
    renderDocCache = docCache;               // 分批建立時沿用重繪當下的檔案查表
    try {
      while (built < to) { buildCard(built, cf, sf); built++; }
    } finally { renderDocCache = prevCache; }
    reorderPageList.appendChild(cf);
    if (sf) sidebarThumbList.appendChild(sf);
  };
  ensureCardBuilt = (i) => { if (i >= built) buildRange(i + 1); };

  buildRange(Math.max(REORDER_FIRST_BATCH, activeSidebarIndex + 40, needCards));
  if (prevTop > 0) reorderPageList.scrollTop = prevTop;
  if (prevSideTop > 0) reorderSidebar.scrollTop = prevSideTop;
  const step = () => {
    if (myGen !== reorderRenderGen) return;
    buildRange(built + REORDER_CHUNK);
    updateSelectionUI();
    if (built < reorderPages.length) setTimeout(step, 0);
  };
  if (built < reorderPages.length) setTimeout(step, 0);

  updateSelectionUI();

  if (hadFocus) {
    ensureCardBuilt(activeSidebarIndex);
    const card = reorderPageList.children[activeSidebarIndex];
    if (card) card.focus({ preventScroll: true });
  }
}

// =======================
// [新增] 頁面卡片：無障礙標籤與鍵盤操作
// =======================
function pageCardLabel(pageObj, index) {
  const parts = [`第 ${index + 1} 頁，共 ${reorderPages.length} 頁`];
  if (pageObj.blank) {
    parts.push('空白頁');                                  // [新增]
  } else if (reorderMulti) {
    parts.push(`來自 ${docNameOf(pageObj)} 第 ${pageObj.originalPageNum} 頁`);
  } else if (pageObj.originalPageNum !== index + 1) {
    parts.push(`原第 ${pageObj.originalPageNum} 頁`);
  }
  if (pageObj.rotation) parts.push(`已旋轉 ${pageObj.rotation} 度`);
  return parts.join('，');
}

// 目前一列有幾張卡片（上下方向鍵一次移動一整列）
function pageGridColumns() {
  const cards = reorderPageList.children;
  if (cards.length === 0) return 1;
  const top = cards[0].offsetTop;
  let n = 0;
  while (n < cards.length && cards[n].offsetTop === top) n++;
  return Math.max(1, n);
}

function focusPageCard(index) {
  if (reorderPages.length === 0) return;
  const target = Math.max(0, Math.min(reorderPages.length - 1, index));
  setActivePage(target, false);          // 更新 roving tabindex 與目前頁面標示
  const card = reorderPageList.children[target];
  if (card) card.focus();                // 聚焦時瀏覽器會自動捲動到可見處
}

function bindPageCardKeys(li, pageObj, index) {
  li.addEventListener('keydown', (e) => {
    if (e.target !== li || e.isComposing) return;   // 卡片內按鈕自己處理按鍵
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); focusPageCard(index + 1); break;
      case 'ArrowLeft':  e.preventDefault(); focusPageCard(index - 1); break;
      case 'ArrowDown':  e.preventDefault(); focusPageCard(index + pageGridColumns()); break;
      case 'ArrowUp':    e.preventDefault(); focusPageCard(index - pageGridColumns()); break;
      case 'Home':       e.preventDefault(); focusPageCard(0); break;
      case 'End':        e.preventDefault(); focusPageCard(reorderPages.length - 1); break;
      case ' ':
      case 'Spacebar':
        e.preventDefault();                          // 避免空白鍵捲動頁面
        if (isSelectionMode) {
          togglePageSelection(index, e.shiftKey);    // Shift+空白鍵＝範圍勾選（同 Shift+點擊）
        } else {
          setStatus('請先點工具列的「選取」啟用勾選模式');
        }
        break;
      case 'Enter':
        e.preventDefault();
        openHighResPreview(pageObj);
        break;
    }
  });
}

// 預覽燈箱：Esc 關閉，關閉後焦點回到原本的頁面卡片
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !previewModal.classList.contains('hidden')) {
    e.preventDefault();
    closeHighResPreview();
  }
});
let previewReturnFocus = null;

// 決定這次拖曳要移動哪些頁面：
//  - 選取模式下，拖曳「已勾選」的頁面 → 一起拖動所有已勾選的頁面
//  - 按住 Ctrl（Mac 為 ⌘）拖曳 → 只拖曳這一頁
//  - 拖曳「未勾選」的頁面，或不在選取模式 → 只拖曳這一頁
function getDragGroup(index, e) {
  const page = reorderPages[index];
  if (!isSelectionMode || !page.selected || e.ctrlKey || e.metaKey) return [page];
  const selected = reorderPages.filter(p => p.selected);
  return selected.length > 1 ? selected : [page];
}

function bindPageDragEvents(element, index) {
  element.addEventListener('dragstart', (e) => {
    draggedPageIndex = index;
    draggedPageGroup = getDragGroup(index, e);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', ''); } catch (err) {}   // Firefox 需要有資料才會開始拖曳

    // 所有一起被拖的頁面（主畫面與側欄）都變淡
    const dragIdx = new Map();
    reorderPages.forEach((pg, ix) => { dragIdx.set(pg, ix); });
    draggedPageGroup.forEach(p => {
      const i = dragIdx.get(p);
      reorderPageList.children[i]?.classList.add('dragging');
      sidebarThumbList.children[i]?.classList.add('dragging');
    });

    // 多頁拖曳時，滑鼠旁顯示「N 頁」徽章
    if (draggedPageGroup.length > 1) {
      const ghost = document.createElement('div');
      ghost.className = 'drag-ghost-count';
      ghost.textContent = `${draggedPageGroup.length} 頁`;
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 16, 16);
      setTimeout(() => ghost.remove(), 0);
    }
  });

  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (draggedPageIndex === null) return;
    if (draggedPageGroup.includes(reorderPages[index])) return;   // 不能放在自己（或同組頁面）上
    e.dataTransfer.dropEffect = 'move';
    element.classList.add('drag-over-card');
  });

  element.addEventListener('dragleave', () => {
    element.classList.remove('drag-over-card');
  });

  element.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove('drag-over-card');

    if (draggedPageIndex === null || draggedPageGroup.length === 0) return;
    const targetPage = reorderPages[index];
    if (draggedPageGroup.includes(targetPage)) return;

    const anchorPage = reorderPages[draggedPageIndex];
    const movingDown = draggedPageIndex < index;   // 往後拖 → 放到目標之後；往前拖 → 放到目標之前

    pushHistory(draggedPageGroup.length > 1 ? `調整頁序（${draggedPageGroup.length} 頁）` : '調整頁序');

    const groupSet = new Set(draggedPageGroup);
    const moved = reorderPages.filter(p => groupSet.has(p));      // 維持原本的相對順序
    const rest = reorderPages.filter(p => !groupSet.has(p));
    const at = rest.indexOf(targetPage) + (movingDown ? 1 : 0);
    rest.splice(at, 0, ...moved);
    reorderPages.splice(0, reorderPages.length, ...rest);

    activeSidebarIndex = reorderPages.indexOf(anchorPage);
    draggedPageIndex = null;
    draggedPageGroup = [];
    renderReorderPages();
  });

  element.addEventListener('dragend', () => {
    draggedPageIndex = null;
    draggedPageGroup = [];
    document.querySelectorAll('.page-card, .sidebar-item').forEach(card => {
      card.classList.remove('dragging', 'drag-over-card');
    });
  });
}

// ---- 預覽燈箱的「選取文字」圖層 ----
const previewPageWrap = document.getElementById('previewPageWrap');
const previewTextLayer = document.getElementById('previewTextLayer');
const previewTextEnabled = true;   // [修改] 預覽一律可選取文字（已移除「選取文字」開關）
let previewToken = 0;           // 每次開啟預覽遞增，避免舊的非同步結果蓋掉新的
let currentPreviewPage = null;

// 在 canvas 上疊文字圖層（座標以 CSS 尺寸為準，與畫面上顯示的大小一致）
async function renderPreviewTextLayer(page, cssViewport, token) {
  previewTextLayer.replaceChildren();
  previewTextLayer.style.width = `${Math.floor(cssViewport.width)}px`;
  previewTextLayer.style.height = `${Math.floor(cssViewport.height)}px`;
  previewTextLayer.style.setProperty('--scale-factor', String(cssViewport.scale));
  previewTextLayer.style.setProperty('--total-scale-factor', String(cssViewport.scale));
  if (!previewTextEnabled) return;

  try {
    const textContent = await page.getTextContent();
    if (token !== previewToken) return;
    if (pdfjsLib.TextLayer) {                       // pdf.js 4.x
      const layer = new pdfjsLib.TextLayer({
        textContentSource: textContent,
        container: previewTextLayer,
        viewport: cssViewport
      });
      await layer.render();
    } else if (pdfjsLib.renderTextLayer) {          // pdf.js 3.x
      await pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        textContent,
        container: previewTextLayer,
        viewport: cssViewport,
        textDivs: []
      }).promise;
    }
  } catch (err) {
    console.error('建立文字圖層失敗:', err);
  }
}

// scrollEdge：'top'＝從頂端開始看（預設）、'bottom'＝從底端開始（往上翻到前一頁時）、'keep'＝不動捲動位置
// [新增] 預覽單頁（大檔加速）
// 大檔以按需讀取載入時，pdf.js 要取得第 N 頁，得沿頁面樹逐頁往前讀（頁面散落在整份檔案各處，每頁一次獨立讀取），
// 越後面的頁越慢。改用 pdf-extract.js 只讀這一頁所需的位元組，組成只有 1 頁的小 PDF 再交給 pdf.js 繪製。
// 失敗（加密檔、xref 損毀…）一律退回原本的 getPage。最近用過的幾頁小文件會保留，來回翻頁不必重讀。
const PREVIEW_MINI_CACHE_MAX = 6;
const previewMiniCache = new Map();   // `${docId}:${頁碼}` → Promise<pdf.js 文件>

function evictPreviewMini() {
  while (previewMiniCache.size > PREVIEW_MINI_CACHE_MAX) {
    const [k, p] = previewMiniCache.entries().next().value;
    previewMiniCache.delete(k);
    p.then(d => d.destroy()).catch(() => {});
  }
}

async function getPreviewPage(item, pageNum) {
  if (window.FastPdfExtract && window.pdfjsLib && item.file.size >= FAST_EXTRACT_MIN_BYTES && !item.password) {
    const key = `${item.id}:${pageNum}`;
    try {
      let p = previewMiniCache.get(key);
      if (p) { previewMiniCache.delete(key); previewMiniCache.set(key, p); }   // 刷新「最近使用」
      else {
        p = (async () => {
          const res = await FastPdfExtract.extractPages(item.file, [pageNum - 1], {});
          return pdfjsLib.getDocument({ data: res.bytes }).promise;
        })();
        previewMiniCache.set(key, p);
        evictPreviewMini();
      }
      const doc = await p;
      return await doc.getPage(1);
    } catch (err) {
      previewMiniCache.delete(key);
      console.warn('預覽單頁擷取失敗，改用原本的載入方式：', err);
    }
  }
  const pdf = await ensurePdfJsDoc(item);
  return pdf.getPage(pageNum);
}

async function openHighResPreview(pageObj, scrollEdge = 'top') {
  const token = ++previewToken;
  currentPreviewPage = pageObj;
  previewBusy = true;                    // [新增] 載入中暫停自動翻頁，避免連跳好幾頁
  if (previewModal.classList.contains('hidden')) previewNavigated = false;
  updatePreviewNav();
  const item = docs.find(d => d.id === pageObj.docId);
  if (!item || !window.pdfjsLib) { previewBusy = false; return; }
  const originalPageNum = pageObj.originalPageNum;
  const tPrev0 = performance.now();                    // [新增] 計時：分辨時間花在讀檔還是解碼
  const label = pageObj.blank ? '空白頁' : (docs.length > 1
    ? `${item.name} · 第 ${originalPageNum} 頁`
    : `原第 ${originalPageNum} 頁`);
  try {
    previewModalTitle.textContent = `${label} — 載入中...`;
    if (previewModal.classList.contains('hidden')) previewReturnFocus = document.activeElement;
    previewModal.classList.remove('hidden');
    closePreviewBtn.focus();

    const page = await getPreviewPage(item, originalPageNum);   // [修改] 大檔改走單頁擷取
    const tPrev1 = performance.now();                   // [新增]
    const rotation = ((page.rotate || 0) + (pageObj.rotation || 0)) % 360;   // [修改] 直接用頁面物件的旋轉
    const unscaled = page.getViewport({ scale: 1, rotation });
    const dpr = window.devicePixelRatio || 1;
    // [修改] 手機：頁面撐滿預覽區寬度（只留極小邊距）；桌面維持原本 85% / 最大 920px
    const narrowView = window.innerWidth <= 820;
    const bodyW = (typeof previewBody !== 'undefined' && previewBody.clientWidth) || window.innerWidth;
    const cssTargetWidth = narrowView ? Math.max(200, bodyW - 8) : Math.min(window.innerWidth * 0.85, 920);
    const cssScale = cssTargetWidth / unscaled.width;

    const renderViewport = page.getViewport({ scale: cssScale * dpr, rotation });

    previewCanvas.width = renderViewport.width;
    previewCanvas.height = renderViewport.height;
    previewCanvas.style.width = `${Math.round(unscaled.width * cssScale)}px`;

    // [新增] 版面已確定，先決定捲動位置（往上翻頁時停在前一頁的底端）
    if (scrollEdge === 'top') previewBody.scrollTop = 0;
    else if (scrollEdge === 'bottom') previewBody.scrollTop = previewBody.scrollHeight;

    const ctx = previewCanvas.getContext('2d', { alpha: false });
    if (pageObj.blank) {
      // [新增] 空白頁：畫白底即可，不渲染來源頁內容、不建文字層
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
      previewTextLayer.replaceChildren();
      if (token === previewToken) {
        previewModalTitle.textContent = '空白頁';
        previewBusy = false;
        previewLockUntil = performance.now() + 450;
      }
      safeCleanup(page);
      return;
    }
    await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
    console.info(`[預覽] 第 ${originalPageNum} 頁：取得頁面 ${Math.round(tPrev1 - tPrev0)} ms、繪製 ${Math.round(performance.now() - tPrev1)} ms（繪製慢通常是影像解碼，例如 JPEG2000）`);   // [新增]
    if (token !== previewToken) { safeCleanup(page); return; }   // [修改] 被取代時也釋放此頁
    previewModalTitle.textContent = label;
    previewBusy = false;
    previewLockUntil = performance.now() + 450;   // [新增] 翻頁後的短暫冷卻，吸收滾輪慣性
    await renderPreviewTextLayer(page, page.getViewport({ scale: cssScale, rotation }), token);
    safeCleanup(page);                               // [新增] 預覽與文字層都完成後釋放此頁暫存
  } catch (err) {
    console.error(err);
    previewModalTitle.textContent = `預覽載入失敗`;
    if (token === previewToken) previewBusy = false;
  }
}

// =======================
// [新增] 預覽視窗翻頁：上一頁 / 下一頁 / 跳頁 / 捲到底自動下一頁 / 捲到頂自動上一頁
// 頁碼以「調動畫面上的順序」為準（與縮圖網格、「選取頁碼範圍」一致）
// =======================
const previewBody = previewModal.querySelector('.modal-body');
const previewPrevBtn = document.getElementById('previewPrevBtn');
const previewNextBtn = document.getElementById('previewNextBtn');
const previewJumpInput = document.getElementById('previewJumpInput');
const previewJumpTotal = document.getElementById('previewJumpTotal');
let previewBusy = false;          // 目前頁面載入中
let previewLockUntil = 0;         // 冷卻時間點（performance.now）
let previewNavigated = false;     // 是否翻過頁（關閉時據此把焦點帶回最後看的那頁）
let previewEdgeAcc = 0;           // 在邊界上累積的滾輪量
let previewEdgeTimer = 0;
const PREVIEW_EDGE_THRESHOLD = 120;   // 在邊界再多滾這麼多才翻頁（約 1～2 格滾輪）
const PREVIEW_TOUCH_THRESHOLD = 80;   // 觸控在邊界再多拉這麼多 px 才翻頁

function previewIndex() {
  if (!currentPreviewPage) return -1;
  let i = reorderPages.indexOf(currentPreviewPage);
  if (i < 0) i = reorderPages.findIndex(p => p.uid === currentPreviewPage.uid);   // [修改] key → uid
  return i;
}

function updatePreviewNav() {
  const i = previewIndex();
  const total = reorderPages.length;
  previewJumpTotal.textContent = String(total);
  previewJumpInput.max = String(total);
  if (document.activeElement !== previewJumpInput) previewJumpInput.value = i >= 0 ? String(i + 1) : '';
  previewPrevBtn.disabled = i <= 0;
  previewNextBtn.disabled = i < 0 || i >= total - 1;
}

// 換到第 idx 頁（0 起算）；edge 決定新頁從頂端或底端開始看
function gotoPreviewIndex(idx, edge = 'top') {
  if (idx < 0 || idx >= reorderPages.length) return false;
  if (idx === previewIndex()) return false;
  previewNavigated = true;
  previewEdgeAcc = 0;
  openHighResPreview(reorderPages[idx], edge);
  return true;
}

previewPrevBtn.addEventListener('click', () => gotoPreviewIndex(previewIndex() - 1, 'top'));
previewNextBtn.addEventListener('click', () => gotoPreviewIndex(previewIndex() + 1, 'top'));

function jumpPreviewToInput() {
  const n = parseInt(previewJumpInput.value, 10);
  if (!Number.isInteger(n) || reorderPages.length === 0) { updatePreviewNav(); return; }
  gotoPreviewIndex(Math.max(1, Math.min(reorderPages.length, n)) - 1, 'top');
  updatePreviewNav();
}
previewJumpInput.addEventListener('keydown', (e) => {
  // 輸入框內的左右鍵不會觸發翻頁（下方的全域按鍵處理已排除 INPUT），Esc 仍可關閉預覽
  if (e.key === 'Enter') { e.preventDefault(); jumpPreviewToInput(); previewJumpInput.blur(); }
});
previewJumpInput.addEventListener('change', jumpPreviewToInput);
previewJumpInput.addEventListener('focus', () => previewJumpInput.select());

// 目前是否已在可捲動範圍的頂端 / 底端（頁面比視窗短、不需捲動時，頂端與底端同時成立）
function previewAtTop() { return previewBody.scrollTop <= 1; }
function previewAtBottom() { return previewBody.scrollTop + previewBody.clientHeight >= previewBody.scrollHeight - 1; }

function previewCanAutoFlip() {
  return !previewModal.classList.contains('hidden') && !previewBusy && performance.now() >= previewLockUntil;
}

// 滑鼠 / 觸控板滾輪：在底端繼續往下 → 下一頁；在頂端繼續往上 → 上一頁
previewBody.addEventListener('wheel', (e) => {
  if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;   // 縮放手勢、橫向捲動不處理
  const dir = e.deltaY > 0 ? 1 : -1;
  const atEdge = dir > 0 ? previewAtBottom() : previewAtTop();
  if (!atEdge) { previewEdgeAcc = 0; return; }
  if (!previewCanAutoFlip()) { e.preventDefault(); return; }

  if (Math.sign(previewEdgeAcc) !== dir) previewEdgeAcc = 0;
  previewEdgeAcc += e.deltaY;
  clearTimeout(previewEdgeTimer);
  previewEdgeTimer = setTimeout(() => { previewEdgeAcc = 0; }, 350);   // 停手就歸零

  if (Math.abs(previewEdgeAcc) >= PREVIEW_EDGE_THRESHOLD) {
    previewEdgeAcc = 0;
    // 往下翻 → 新頁從頂端開始；往上翻 → 新頁從底端開始（接續剛才的閱讀方向）
    if (gotoPreviewIndex(previewIndex() + dir, dir > 0 ? 'top' : 'bottom')) e.preventDefault();
  }
}, { passive: false });

// 觸控：在邊界時再拉動一段距離才翻頁
let previewTouchY = null;
let previewTouchDone = false;
previewBody.addEventListener('touchstart', (e) => {
  previewTouchY = e.touches.length === 1 ? e.touches[0].clientY : null;
  previewTouchDone = false;
}, { passive: true });
previewBody.addEventListener('touchmove', (e) => {
  if (previewTouchY === null || previewTouchDone || e.touches.length !== 1) return;
  const dy = previewTouchY - e.touches[0].clientY;          // >0 ＝ 手指往上滑（要看下面）
  if (Math.abs(dy) < PREVIEW_TOUCH_THRESHOLD) return;
  const dir = dy > 0 ? 1 : -1;
  if (!(dir > 0 ? previewAtBottom() : previewAtTop())) { previewTouchY = e.touches[0].clientY; return; }
  if (!previewCanAutoFlip()) return;
  previewTouchDone = true;
  gotoPreviewIndex(previewIndex() + dir, dir > 0 ? 'top' : 'bottom');
}, { passive: true });

// 鍵盤：← / PageUp 以外維持原本；左右鍵＝上一頁 / 下一頁（不在輸入框內時）
window.addEventListener('keydown', (e) => {
  if (previewModal.classList.contains('hidden')) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); gotoPreviewIndex(previewIndex() - 1, 'top'); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); gotoPreviewIndex(previewIndex() + 1, 'top'); }
});

closePreviewBtn.addEventListener('click', closeHighResPreview);
previewModal.addEventListener('click', (e) => {
  if (e.target === previewModal) closeHighResPreview();
});

function closeHighResPreview() {
  const lastIdx = previewIndex();          // [新增] 關閉前記住最後看的是哪一頁
  previewToken++;
  currentPreviewPage = null;
  previewBusy = false;
  previewTextLayer.replaceChildren();
  previewModal.classList.add('hidden');
  previewCanvas.width = 0;
  previewCanvas.height = 0;
  // [新增] 若在預覽中翻過頁，關閉後把縮圖網格定位到最後看的那一頁
  if (previewNavigated && lastIdx >= 0) {
    setActivePage(lastIdx, true);
    previewReturnFocus = reorderPageList.children[lastIdx] || null;
  }
  previewNavigated = false;
  const back = previewReturnFocus && document.contains(previewReturnFocus)
    ? previewReturnFocus
    : reorderPageList.children[activeSidebarIndex];
  previewReturnFocus = null;
  if (back && back.focus) back.focus({ preventScroll: true });
}

function moveReorderPage(index, direction) {
  pushHistory('移動頁面');
  const target = index + direction;
  const temp = reorderPages[index];
  reorderPages[index] = reorderPages[target];
  reorderPages[target] = temp;
  activeSidebarIndex = target;
  renderReorderPages();
  // [新增] 移動回饋：提示「第 a 頁 → 第 b 頁」，並讓移動後的縮圖短暫高亮、捲到可見處
  setStatus(`已移動：第 ${index + 1} 頁 → 第 ${target + 1} 頁`, 'success');
  requestAnimationFrame(() => {
    const li = cardEls[target];
    if (!li) return;
    const card = li.classList.contains('page-card') ? li : (li.querySelector('.page-card') || li);
    card.classList.remove('just-moved'); void card.offsetWidth;   // 重新觸發動畫
    card.classList.add('just-moved');
    setTimeout(() => card.classList.remove('just-moved'), 1300);
    if (li.scrollIntoView) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

reverseOrderBtn.addEventListener('click', () => {
  pushHistory('反轉順序');
  reorderPages.reverse();
  renderReorderPages();
  setStatus('✓ 已反轉頁面順序', 'success');
});

resetOrderBtn.addEventListener('click', () => {
  pushHistory('還原預設');
  reorderPages = buildPageList(visibleReadyDocs());
  activeSidebarIndex = 0;
  lastCheckedPageIndex = null;
  renderReorderPages();
  setStatus('已還原預設頁面順序、頁數與旋轉（可按 Ctrl+Z 復原）');
});

// =======================
// [新增] 插入空白頁 / 複製頁面（皆可用 Ctrl+Z 復原）
// =======================
function insertBlankPage() {
  if (reorderPages.length === 0) { setStatus('請先載入 PDF 檔案', 'error'); return; }
  const at = Math.max(0, Math.min(activeSidebarIndex, reorderPages.length - 1));
  const ref = reorderPages[at];                       // 以目前頁面作為尺寸參考與所屬檔案
  pushHistory('插入空白頁');
  const uid = newPageUid();
  const blankPage = {
    uid,
    blank: true,
    docId: ref.docId,                                 // 沿用所屬檔案（顏色標示、儲存範圍判斷）
    key: `blank_${uid}`,
    originalIndex: ref.originalIndex,                 // 儲存時用此頁的尺寸建立空白頁
    originalPageNum: ref.originalPageNum,
    selected: false,
    rotation: 0
  };
  reorderPages.splice(at + 1, 0, blankPage);
  activeSidebarIndex = at + 1;
  lastCheckedPageIndex = null;
  renderReorderPages();
  focusPageCard(activeSidebarIndex);
  setStatus(`✓ 已在第 ${at + 1} 頁之後插入空白頁（可按 Ctrl+Z 復原）`, 'success');
}

function duplicatePages() {
  if (reorderPages.length === 0) { setStatus('請先載入 PDF 檔案', 'error'); return; }
  // 選取模式且有勾選 → 複製所有勾選頁；否則複製目前頁面
  let targets = isSelectionMode ? reorderPages.filter(p => p.selected) : [];
  if (targets.length === 0) {
    const cur = reorderPages[Math.max(0, Math.min(activeSidebarIndex, reorderPages.length - 1))];
    if (!cur) return;
    targets = [cur];
  }
  pushHistory('複製頁面');
  const targetSet = new Set(targets);
  const next = [];
  let newActive = activeSidebarIndex;
  reorderPages.forEach((p, i) => {
    next.push(p);
    if (targetSet.has(p)) {
      const uid = newPageUid();
      next.push({ ...p, uid, key: p.blank ? `blank_${uid}` : p.key, selected: false });   // 副本接在原頁之後；縮圖與原頁共用
      if (i === activeSidebarIndex) newActive = next.length - 1;
    }
  });
  reorderPages = next;
  activeSidebarIndex = newActive;
  lastCheckedPageIndex = null;
  renderReorderPages();
  focusPageCard(activeSidebarIndex);
  setStatus(`✓ 已複製 ${targets.length} 頁（副本在原頁之後，可按 Ctrl+Z 復原）`, 'success');
}

insertBlankBtn.addEventListener('click', insertBlankPage);
duplicateBtn.addEventListener('click', duplicatePages);

async function executeReorderSave() {
  const pagesToSave = isSelectionMode
    ? reorderPages.filter(p => p.selected)
    : reorderPages;

  if (pagesToSave.length === 0) {
    setStatus('請至少勾選 1 個頁面', 'error');
    return;
  }

  // [新增] 大檔案儲存前詢問是否壓縮（輸出大小依保留頁數比例預估）
  if (!(await promptCompressForSave(reorderScope(pagesToSave)))) return;

  const usedDocIds = new Set(pagesToSave.map(p => p.docId));
  const firstItem = docs.find(d => d.id === pagesToSave[0].docId);
  const reorderBaseName = firstItem.name.replace(/\.pdf$/i, '');
  const reorderSuffix = isSelectionMode
    ? `_選取${pagesToSave.length}頁`
    : (usedDocIds.size > 1 ? '_合併' : '_調整頁序');
  const reorderOutName = await askFileName(`${reorderBaseName}${reorderSuffix}`, 'pdf', '儲存 PDF');
  if (!reorderOutName) return;

  try {
    primarySaveBtn.disabled = true;
    compressSaved = 0;
    setStatus('正在匯出 PDF...', '', true);
    setProgress(0, pagesToSave.length);
    await nextFrame();

    const newPdf = await PDFDocument.create();
    const getLib = createLibLoader();

    // [新增] 大檔只用到部分頁面時，走快速擷取（只讀必要位元組）；其餘情況與原本相同
    const wantedIdx = new Map();
    pagesToSave.forEach(p => {
      if (!wantedIdx.has(p.docId)) wantedIdx.set(p.docId, []);
      wantedIdx.get(p.docId).push(p.originalIndex);
    });
    const fastDocs = new Map();
    const getSrc = async (item) => {
      if (!fastDocs.has(item.id)) fastDocs.set(item.id, await tryFastSubset(item, wantedIdx.get(item.id) || []));
      const f = fastDocs.get(item.id);
      if (f) return { src: f.doc, idx: (n) => f.map.get(n) };
      return { src: await getLib(item), idx: (n) => n };
    };

    // [優化] 依檔案分塊（每塊 400 頁）一次複製所有需要的頁面，再依輸出順序組裝。
    //   原本每段連續頁面各呼叫一次 copyPages；頁序被打亂的大檔會變成每頁一次，
    //   共用的字型 / 影像每次都重複複製，既慢、輸出也大。現在重複複製的次數 ≈ 頁數 / 400。
    //   （同一頁被複製多次時，同一次 copyPages 會產生各自獨立的副本，可安全加入文件。）
    const COPY_CHUNK = 400;
    const pageMap = new Map();                       // 頁面物件 → 複製出的 PDFPage
    const perDoc = new Map();                        // docId → 頁面物件陣列（輸出順序）
    pagesToSave.forEach(pg => {
      if (pg.blank) return;
      if (!perDoc.has(pg.docId)) perDoc.set(pg.docId, []);
      perDoc.get(pg.docId).push(pg);
    });
    const totalCopy = pagesToSave.reduce((n, pg) => n + (pg.blank ? 0 : 1), 0);
    let copiedCount = 0;
    for (const [docId, list] of perDoc) {
      const item = docs.find(d => d.id === docId);
      const { src, idx } = await getSrc(item);
      for (let a0 = 0; a0 < list.length; a0 += COPY_CHUNK) {
        const part = list.slice(a0, a0 + COPY_CHUNK);
        setStatus(`正在複製頁面… ${copiedCount + 1}/${totalCopy}`, '', true);
        const copied = await newPdf.copyPages(src, part.map(pg => idx(pg.originalIndex)));
        copied.forEach((pdfPage, k) => pageMap.set(part[k], pdfPage));
        copiedCount += part.length;
        setProgress(copiedCount, totalCopy);
        await nextFrame();
      }
    }

    setStatus('正在組合頁面…', '', true);
    for (let n = 0; n < pagesToSave.length; n++) {
      const pg = pagesToSave[n];
      if (pg.blank) {
        // 空白頁：依參考頁的尺寸建立新頁（不從來源複製）
        const item = docs.find(d => d.id === pg.docId);
        const { src, idx } = await getSrc(item);
        let w = 595.28, h = 841.89;                       // 取不到參考頁時退回 A4
        try {
          const refPage = src.getPage(idx(pg.originalIndex));
          const sz = refPage.getSize();
          const ra = ((refPage.getRotation().angle % 360) + 360) % 360;
          if (ra === 90 || ra === 270) { w = sz.height; h = sz.width; } else { w = sz.width; h = sz.height; }
        } catch (e) { /* 使用 A4 */ }
        const blankPdfPage = newPdf.addPage([w, h]);
        if (pg.rotation) blankPdfPage.setRotation(degrees(pg.rotation % 360));
      } else {
        const pdfPage = pageMap.get(pg);
        pageMap.delete(pg);
        const extra = pg.rotation || 0;
        if (extra) pdfPage.setRotation(degrees((pdfPage.getRotation().angle + extra) % 360));
        newPdf.addPage(pdfPage);
      }
      if ((n & 127) === 127) { setProgress(n + 1, pagesToSave.length); await maybeYield(); }
    }

    const pdfBytes = await finalizePdf(newPdf);
    downloadBlob(pdfBytes, reorderOutName);
    setStatus(`✓ 已儲存下載（共 ${pagesToSave.length} 頁）${takeCompressNote()}`, 'success');
  } catch (err) {
    if (err && err.cancelled) { setStatus('已取消儲存', '', false, 0); return; }   // [新增]
    console.error(err);
    setStatus('匯出失敗', 'error');
  } finally {
    clearFastSubsetCache();
    clearProgress();
    updateSaveButtonState();
  }
}

// =======================
// [新增] 閱讀檢視：連續捲動原始文件、文字可選取
// 記憶體策略：
//  - 所有頁面先建「只有尺寸的空框」（很輕），只有視窗上下 READER_MARGIN_PX 內的頁面才真的繪製
//  - 同時最多 READER_MAX_LIVE 頁有 canvas；捲離範圍的頁面立刻歸零 canvas、移除文字層、釋放 pdf.js 頁面資源
//  - 繪製中的頁面若被捲離會直接取消；同時繪製數量有限；單頁 canvas 像素有上限
//  - 與縮圖 / 預覽共用同一份 pdf.js 文件，不會多讀一份檔案；離開閱讀分頁時全部釋放
// =======================
const readerScroll = document.getElementById('readerScroll');
const readerPagesEl = document.getElementById('readerPages');
const readerTools = document.getElementById('readerTools');
const readDocSelect = document.getElementById('readDocSelect');
const readPageInput = document.getElementById('readPageInput');
const readPageTotal = document.getElementById('readPageTotal');
const readZoomOutBtn = document.getElementById('readZoomOutBtn');
const readZoomInBtn = document.getElementById('readZoomInBtn');
const readZoomBadge = document.getElementById('readZoomBadge');

const READER_MARGIN_PX = DEVICE_MEM >= 8 ? 1800 : DEVICE_MEM >= 4 ? 1400 : 800;
const READER_MAX_LIVE = DEVICE_MEM >= 8 ? 16 : DEVICE_MEM >= 4 ? 12 : 6;
const READER_CONCURRENCY = (DEVICE_CORES >= 8 && DEVICE_MEM >= 4) ? 3 : 2;
const READER_MAX_PIXELS = DEVICE_MEM >= 8 ? 16e6 : DEVICE_MEM >= 4 ? 12e6 : 6e6;
const READER_MIN_SCALE = 0.25;
const READER_MAX_SCALE = 4;
const READER_FIT_CAP = 1.5;
const READER_SIZE_SCAN_MAX = 300;   // [效能] 超過這個頁數就不在背景逐頁讀尺寸（大檔會造成成千上萬次讀取），改成「畫到哪頁才校正那頁」

let readerDocId = null;          // 使用者選的檔案
let readerBuiltDocId = null;     // 目前畫面上已建立的檔案（離開分頁後為 null）
let readerGen = 0;               // 換檔 / 關閉時遞增，讓舊的非同步工作失效
let readerScale = 1;
let readerScaleSet = false;
let readerFitMode = true;
let readerSizes = [];            // 各頁在 scale=1 的尺寸 { w, h }
let readerEntries = [];          // { el, state: idle|queued|rendering|live, token, canvas, textDiv, page, task, fails }
let readerTracked = new Set();   // 狀態不是 idle 的頁面索引
let readerQueue = [];
let readerActive = 0;
let readerWin = { lo: 0, hi: -1 };
let readerCenter = 0;
let readerCurrent = 0;
let readerResumeIndex = 0;
const readerPositions = new Map();   // docId → 最後閱讀的頁索引（切換檔案 / 離開分頁後接續閱讀）
let readerRaf = 0;

const clampNum = (v, min, max) => Math.max(min, Math.min(max, v));
function safeCleanup(page) { try { page.cleanup(); } catch (e) {} }
const inReaderWindow = (i) => i >= readerWin.lo && i <= readerWin.hi;

// 以 CSS 尺寸建立透明文字層（與 renderPreviewTextLayer 相同的相容寫法：pdf.js 3.x / 4.x）
async function fillTextLayer(page, container, cssViewport, isStale) {
  container.replaceChildren();
  container.style.width = `${Math.round(cssViewport.width)}px`;
  container.style.height = `${Math.round(cssViewport.height)}px`;
  container.style.setProperty('--scale-factor', String(cssViewport.scale));
  container.style.setProperty('--total-scale-factor', String(cssViewport.scale));
  try {
    const textContent = await page.getTextContent();
    if (isStale()) return;
    if (pdfjsLib.TextLayer) {
      await new pdfjsLib.TextLayer({ textContentSource: textContent, container, viewport: cssViewport }).render();
    } else if (pdfjsLib.renderTextLayer) {
      await pdfjsLib.renderTextLayer({ textContentSource: textContent, textContent, container, viewport: cssViewport, textDivs: [] }).promise;
    }
  } catch (err) {
    if (!isStale()) console.error('建立文字圖層失敗:', err);
  }
}

function findReaderPageAt(y) {
  let lo = 0, hi = readerEntries.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (readerEntries[mid].el.offsetTop <= y) lo = mid; else hi = mid - 1;
  }
  return lo;
}

function layoutReaderEntry(i) {
  const s = readerSizes[i];
  const el = readerEntries[i].el;
  el.style.width = `${Math.round(s.w * readerScale)}px`;
  el.style.height = `${Math.round(s.h * readerScale)}px`;
}
function layoutReaderAll() {
  for (let i = 0; i < readerEntries.length; i++) layoutReaderEntry(i);
}

function computeReaderFit() {
  const base = readerSizes[0] ? readerSizes[0].w : 600;
  const avail = Math.max(200, readerScroll.clientWidth - 32);
  return clampNum(avail / base, READER_MIN_SCALE, READER_FIT_CAP);
}

function updateReaderZoomBadge() {
  readZoomBadge.textContent = `${Math.round(readerScale * 100)}%`;
}

// 釋放單一頁面的所有資源
function releaseReaderPage(i) {
  const e = readerEntries[i];
  if (!e) return;
  e.token++;
  if (e.task) { try { e.task.cancel(); } catch (err) {} e.task = null; }
  if (e.canvas) { e.canvas.width = 0; e.canvas.height = 0; e.canvas.remove(); e.canvas = null; }
  if (e.textDiv) { e.textDiv.remove(); e.textDiv = null; }
  if (e.page) { safeCleanup(e.page); e.page = null; }
  e.state = 'idle';
  readerTracked.delete(i);
}

function releaseAllReaderPages() {
  readerQueue.length = 0;
  [...readerTracked].forEach(releaseReaderPage);
}

function teardownReaderDom() {
  readerGen++;
  releaseAllReaderPages();
  readerEntries.forEach(e => { e.token++; });
  readerPagesEl.replaceChildren();
  readerEntries = [];
  readerSizes = [];
  readerTracked.clear();
  readerWin = { lo: 0, hi: -1 };
  readerBuiltDocId = null;
}

function pauseReader() {
  if (readerBuiltDocId === null) return;
  readerResumeIndex = readerCurrent;
  readerPositions.set(readerBuiltDocId, readerCurrent);
  teardownReaderDom();
}

function enqueueReaderPage(i) {
  const e = readerEntries[i];
  if (!e || e.state !== 'idle') return;
  e.state = 'queued';
  readerTracked.add(i);
  readerQueue.push(i);
  pumpReaderQueue();
}

function pumpReaderQueue() {
  while (readerActive < READER_CONCURRENCY) {
    readerQueue = readerQueue.filter(i => readerEntries[i] && readerEntries[i].state === 'queued' && inReaderWindow(i));
    if (readerQueue.length === 0) break;
    let bi = 0, bd = Infinity;
    readerQueue.forEach((q, k) => {                       // 先畫最靠近畫面中央的
      const d = Math.abs(q - readerCenter);
      if (d < bd) { bd = d; bi = k; }
    });
    const i = readerQueue.splice(bi, 1)[0];
    readerActive++;
    renderReaderPage(i).finally(() => { readerActive--; pumpReaderQueue(); });
  }
}

async function renderReaderPage(i) {
  const gen = readerGen;
  const entry = readerEntries[i];
  const item = docs.find(d => d.id === readerBuiltDocId);
  if (!entry || !item) return;

  const my = ++entry.token;
  entry.state = 'rendering';
  const stale = () => gen !== readerGen || entry.token !== my || !inReaderWindow(i);

  let page = null;
  let canvas = null;
  try {
    const pdf = await ensurePdfJsDoc(item);
    page = await pdf.getPage(i + 1);
    if (stale()) return;

    // [效能] 這頁的真實尺寸跟預設不同 → 當場校正版面（大檔不做背景掃描時靠這裡）
    {
      const base = page.getViewport({ scale: 1 });
      const old = readerSizes[i];
      if (old && (Math.abs(old.w - base.width) > 0.5 || Math.abs(old.h - base.height) > 0.5)) {
        readerSizes[i] = { w: base.width, h: base.height };
        layoutReaderEntry(i);
      }
    }

    const scale = readerScale;
    const vp = page.getViewport({ scale });
    let ratio = Math.min(window.devicePixelRatio || 1, 2);
    ratio = Math.min(ratio, Math.sqrt(READER_MAX_PIXELS / (vp.width * vp.height)));   // 單頁像素上限，避免放大時爆記憶體
    const rvp = page.getViewport({ scale: scale * ratio });

    canvas = document.createElement('canvas');
    canvas.className = 'reader-canvas';
    canvas.width = Math.max(1, Math.floor(rvp.width));
    canvas.height = Math.max(1, Math.floor(rvp.height));
    const ctx = canvas.getContext('2d', { alpha: false });

    const task = page.render({ canvasContext: ctx, viewport: rvp });
    entry.task = task;
    await task.promise;
    entry.task = null;
    if (stale()) return;

    const textDiv = document.createElement('div');
    textDiv.className = 'textLayer';
    entry.el.append(canvas, textDiv);
    entry.canvas = canvas;
    entry.textDiv = textDiv;
    entry.page = page;
    entry.state = 'live';
    entry.fails = 0;
    canvas = null;                                          // 已交給 entry 管理，之後由 releaseReaderPage 釋放

    await fillTextLayer(page, textDiv, vp, () => entry.textDiv !== textDiv);
  } catch (err) {
    if (!(err && err.name === 'RenderingCancelledException')) console.error(`閱讀檢視：第 ${i + 1} 頁繪製失敗:`, err);
  } finally {
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    if (entry.token === my) {
      entry.task = null;
      if (entry.state === 'rendering') { entry.state = 'idle'; readerTracked.delete(i); }
    }
    if (page && entry.page !== page) safeCleanup(page);
    if (gen === readerGen && entry.token === my && entry.state === 'idle' && inReaderWindow(i) && ++entry.fails <= 2) {
      enqueueReaderPage(i);
    }
  }
}

// 依目前捲動位置決定要保留哪些頁面（最多 READER_MAX_LIVE 頁），其餘釋放
function updateReaderWindow() {
  if (readerEntries.length === 0 || currentTab !== 'read') return;
  const top = readerScroll.scrollTop;
  const h = readerScroll.clientHeight;

  readerCenter = findReaderPageAt(top + h / 2);
  readerCurrent = findReaderPageAt(top + h * 0.3);

  let lo = findReaderPageAt(top - READER_MARGIN_PX);
  let hi = findReaderPageAt(top + h + READER_MARGIN_PX);
  while (hi - lo + 1 > READER_MAX_LIVE) {
    if (readerCenter - lo > hi - readerCenter) lo++; else hi--;
  }
  readerWin = { lo, hi };

  [...readerTracked].forEach(i => { if (i < lo || i > hi) releaseReaderPage(i); });
  for (let i = lo; i <= hi; i++) enqueueReaderPage(i);

  if (document.activeElement !== readPageInput) readPageInput.value = String(readerCurrent + 1);
}

function scheduleReaderUpdate() {
  if (readerRaf) return;
  readerRaf = requestAnimationFrame(() => {
    readerRaf = 0;
    updateReaderWindow();
  });
}

function scrollReaderToPage(i, smooth) {
  const e = readerEntries[clampNum(i, 0, readerEntries.length - 1)];
  if (!e) return;
  readerScroll.scrollTo({ top: Math.max(0, e.el.offsetTop - 12), behavior: smooth ? 'smooth' : 'auto' });
}

function applyReaderScale(next) {
  if (readerEntries.length === 0) return;
  next = clampNum(next, READER_MIN_SCALE, READER_MAX_SCALE);
  if (Math.abs(next - readerScale) / readerScale < 0.005) return;

  const h = readerScroll.clientHeight;
  const ratio = (readerScroll.scrollTop + h / 2) / Math.max(1, readerScroll.scrollHeight);   // 縮放後維持看的位置
  releaseAllReaderPages();
  readerScale = next;
  readerScaleSet = true;
  layoutReaderAll();
  readerScroll.scrollTop = ratio * readerScroll.scrollHeight - h / 2;
  updateReaderZoomBadge();
  updateReaderWindow();
}

// 背景讀取每一頁的真實尺寸（尺寸不同的頁面才會調整版面）
async function loadReaderSizes(item, gen) {
  try {
    const pdf = await ensurePdfJsDoc(item);
    const n = item.pageCount;
    for (let start = 1; start <= n; start += 20) {
      const changed = [];
      for (let p = start; p < Math.min(start + 20, n + 1); p++) {
        if (gen !== readerGen) return;
        const page = await pdf.getPage(p);
        const vp = page.getViewport({ scale: 1 });
        if (!readerTracked.has(p - 1)) safeCleanup(page);
        const old = readerSizes[p - 1];
        if (!old || Math.abs(old.w - vp.width) > 0.5 || Math.abs(old.h - vp.height) > 0.5) {
          readerSizes[p - 1] = { w: vp.width, h: vp.height };
          changed.push(p - 1);
        }
      }
      if (gen !== readerGen) return;
      if (changed.length) {
        changed.forEach(i => {
          if (readerTracked.has(i)) releaseReaderPage(i);   // 尺寸變了：重畫
          layoutReaderEntry(i);
        });
        updateReaderWindow();
      }
      await nextFrame();
    }
  } catch (err) {
    if (gen === readerGen) console.error('讀取頁面尺寸失敗:', err);
  }
}

async function buildReader(item, resumeIndex = 0) {
  teardownReaderDom();
  const gen = readerGen;
  readerBuiltDocId = item.id;
  try {
    const pdf = await ensurePdfJsDoc(item);
    const first = await pdf.getPage(1);
    const vp = first.getViewport({ scale: 1 });
    safeCleanup(first);
    if (gen !== readerGen) return;

    const def = { w: vp.width, h: vp.height };
    readerSizes = Array.from({ length: item.pageCount }, () => def);
    if (readerFitMode || !readerScaleSet) readerScale = computeReaderFit();

    const frag = document.createDocumentFragment();
    readerEntries = readerSizes.map((_, i) => {
      const el = document.createElement('div');
      el.className = 'reader-page';
      el.dataset.i = String(i);
      el.dataset.n = String(i + 1);
      frag.appendChild(el);
      return { el, state: 'idle', token: 0, canvas: null, textDiv: null, page: null, task: null, fails: 0 };
    });
    readerPagesEl.appendChild(frag);
    layoutReaderAll();

    readPageTotal.textContent = String(item.pageCount);
    readPageInput.max = String(item.pageCount);
    updateReaderZoomBadge();
    scrollReaderToPage(resumeIndex, false);
    updateReaderWindow();
    if (item.pageCount <= READER_SIZE_SCAN_MAX) loadReaderSizes(item, gen);
  } catch (err) {
    if (gen === readerGen) {
      console.error(err);
      setStatus('閱讀檢視載入失敗', 'error');
    }
  }
}

// 進入閱讀檢視 / 檔案庫變動時：決定要閱讀哪個檔案並建立畫面
function syncReader() {
  const ready = docs.filter(d => d.pageCount > 0);
  const has = ready.length > 0;
  readerScroll.classList.toggle('hidden', !has);
  readerTools.classList.toggle('hidden', !has);

  if (!has) {
    teardownReaderDom();
    readerDocId = null;
    // [新增] 清空後不保留上次的閱讀頁碼與縮放
    //   （原本 readerResumeIndex 會殘留，下次載入新檔會直接跳到舊頁碼）
    readerResumeIndex = 0;
    readerCurrent = 0;
    readerPositions.clear();
    readerScale = 1;
    readerScaleSet = false;
    readerFitMode = true;
    readPageInput.value = '1';
    readPageTotal.textContent = '0';
    readerScroll.scrollTop = 0;
    updateReaderZoomBadge();
    return;
  }

  if (!ready.some(d => d.id === readerDocId)) readerDocId = ready[0].id;
  const item = ready.find(d => d.id === readerDocId);

  readDocSelect.classList.toggle('hidden', ready.length < 2);
  readDocSelect.innerHTML = '';
  ready.forEach(d => {
    const opt = document.createElement('option');
    opt.value = String(d.id);
    opt.textContent = `${d.pageCount}頁｜${d.name.replace(/\.pdf$/i, '')}`;
    opt.title = d.name;
    readDocSelect.appendChild(opt);
  });
  readDocSelect.value = String(item.id);
  readDocSelect.title = item.name;

  // 清掉已移除檔案的位置紀錄
  for (const id of [...readerPositions.keys()]) {
    if (!docs.some(d => d.id === id)) readerPositions.delete(id);
  }

  if (readerBuiltDocId === item.id) return;
  const saved = readerResumeIndex || readerPositions.get(item.id) || 0;
  const resume = Math.min(Math.max(saved, 0), item.pageCount - 1);
  readerResumeIndex = 0;
  buildReader(item, resume);
}

readDocSelect.addEventListener('change', () => {
  // 離開前先記住目前這份檔案讀到哪一頁
  if (readerBuiltDocId !== null) readerPositions.set(readerBuiltDocId, readerCurrent);
  readerDocId = parseInt(readDocSelect.value, 10);
  readerResumeIndex = 0;
  teardownReaderDom();
  syncReader();
});

readerScroll.addEventListener('scroll', scheduleReaderUpdate, { passive: true });

readZoomInBtn.addEventListener('click', () => {
  readerFitMode = false;
  applyReaderScale(readerScale * 1.2);
});
readZoomOutBtn.addEventListener('click', () => {
  readerFitMode = false;
  applyReaderScale(readerScale / 1.2);
});
readZoomBadge.addEventListener('click', () => {
  readerFitMode = true;
  applyReaderScale(computeReaderFit());
});

function jumpReaderToInput() {
  const n = parseInt(readPageInput.value, 10);
  if (!Number.isInteger(n) || readerEntries.length === 0) return;
  scrollReaderToPage(clampNum(n, 1, readerEntries.length) - 1, false);
}
readPageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) {
    e.preventDefault();
    jumpReaderToInput();
    readPageInput.blur();
  }
});
readPageInput.addEventListener('change', jumpReaderToInput);

let readerResizeTimer = null;
window.addEventListener('resize', () => {
  if (currentTab !== 'read' || !readerFitMode || readerEntries.length === 0) return;
  clearTimeout(readerResizeTimer);
  readerResizeTimer = setTimeout(() => applyReaderScale(computeReaderFit()), 150);
});

// =======================
// 全頁拖放：整個視窗都能接收 PDF，依目前分頁分派
// =======================
const dropOverlay = document.getElementById('dropOverlay');
const dropOverlayText = document.getElementById('dropOverlayText');
const DROP_HINTS = {
  merge: '放開以載入 PDF 檔案（可多個）',
  split: '放開以載入 PDF 檔案（可多個）',
  reorder: '放開以載入 PDF 檔案（可多個）'
};
let dragDepth = 0;

function dragHasFiles(e) {
  return !!e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
}
function hideDropOverlay() {
  dragDepth = 0;
  dropOverlay.classList.add('hidden');
}

// 頁面內部的拖曳排序不帶 Files，不會觸發這裡
window.addEventListener('dragenter', (e) => {
  if (!dragHasFiles(e)) return;
  e.preventDefault();
  dragDepth++;
  dropOverlayText.textContent = DROP_HINTS[currentTab] || DROP_HINTS.merge;
  dropOverlay.classList.remove('hidden');
});
window.addEventListener('dragover', (e) => {
  if (!dragHasFiles(e)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});
window.addEventListener('dragleave', (e) => {
  if (!dragHasFiles(e)) return;
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) dropOverlay.classList.add('hidden');
});
window.addEventListener('drop', (e) => {
  if (!dragHasFiles(e)) return;
  e.preventDefault();
  hideDropOverlay();

  const files = Array.from(e.dataTransfer.files);
  if (files.length === 0) return;

  addFiles(files);
});

// =======================
// 啟動：依網址 hash 決定初始分頁
// =======================
// 載入前畫面的「預設檢視」偏好
document.querySelectorAll('input[name="openView"]').forEach(radio => {
  radio.checked = radio.value === getOpenViewPref();
  radio.addEventListener('change', () => {
    try { localStorage.setItem(OPEN_VIEW_KEY, radio.value); } catch (e) {}
  });
});

{
  onLibraryChanged();
  const initialTab = tabFromHash();
  switchTab(initialTab || 'merge');
  if (!initialTab) history.replaceState(null, '', '#merge');
}


// =========================================
// [新增] 手機版工具列：收合第二列、清空移入設定選單
// =========================================
const toolbarCollapseBtn = document.getElementById('toolbarCollapseBtn');
function setToolbarCollapsed(v) {
  document.body.classList.toggle('tb-collapsed', v);
  toolbarCollapseBtn.setAttribute('aria-pressed', String(v));
  toolbarCollapseBtn.title = v ? '展開工具列' : '收合工具列';
  try { localStorage.setItem('pdf_tool_tb_collapsed', v ? '1' : '0'); } catch (e) {}
}
toolbarCollapseBtn.addEventListener('click', () => setToolbarCollapsed(!document.body.classList.contains('tb-collapsed')));
try { setToolbarCollapsed(localStorage.getItem('pdf_tool_tb_collapsed') === '1'); } catch (e) {}

// =========================================
// [新增] 右側可拖曳的快速捲動滑塊（顯示目前頁碼，拖曳時顯示「第 N / 總頁數 頁」）
// 只在手機 / 觸控裝置顯示（CSS 控制）
// =========================================
function createScrubber({ scrollEl, host, getLabel, watch = [] }) {
  const TH = 40, PAD = 6;
  const wrap = document.createElement('div');
  wrap.className = 'scrub hidden';
  const bubble = document.createElement('div');
  bubble.className = 'scrub-bubble';
  const thumb = document.createElement('div');
  thumb.className = 'scrub-thumb';
  thumb.setAttribute('aria-hidden', 'true');
  wrap.append(bubble, thumb);
  host.appendChild(wrap);

  let dragging = false, fadeTimer = 0;

  function place(ratio) {
    const trackH = Math.max(0, wrap.clientHeight - TH - PAD * 2);
    const top = PAD + ratio * trackH;
    thumb.style.top = `${top}px`;
    bubble.style.top = `${top + TH / 2}px`;
  }
  function paintLabel() {
    const { cur, total } = getLabel();
    thumb.textContent = String(cur);
    bubble.textContent = `第 ${cur} / ${total} 頁`;
  }
  function wake() {
    wrap.classList.add('active');
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => { if (!dragging) wrap.classList.remove('active'); }, 1400);
  }
  function update(fromScroll) {
    const max = scrollEl.scrollHeight - scrollEl.clientHeight;
    const show = scrollEl.clientHeight > 0 && max > scrollEl.clientHeight * 0.6;
    wrap.classList.toggle('hidden', !show);
    if (!show) return;
    paintLabel();
    if (!dragging) place(max > 0 ? Math.min(1, Math.max(0, scrollEl.scrollTop / max)) : 0);
    if (fromScroll) wake();
  }

  thumb.addEventListener('pointerdown', (e) => {
    dragging = true;
    thumb.setPointerCapture(e.pointerId);
    wrap.classList.add('dragging', 'active');
    e.preventDefault();
  });
  thumb.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = wrap.getBoundingClientRect();
    const trackH = Math.max(1, r.height - TH - PAD * 2);
    const ratio = Math.min(1, Math.max(0, (e.clientY - r.top - PAD - TH / 2) / trackH));
    place(ratio);
    scrollEl.scrollTop = ratio * (scrollEl.scrollHeight - scrollEl.clientHeight);
    paintLabel();
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove('dragging');
    update(false);
    wake();
  };
  thumb.addEventListener('pointerup', endDrag);
  thumb.addEventListener('pointercancel', endDrag);
  thumb.addEventListener('contextmenu', (e) => e.preventDefault());

  scrollEl.addEventListener('scroll', () => update(true), { passive: true });
  window.addEventListener('resize', () => update(false));
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => update(false));
    [scrollEl, ...watch].forEach(el => el && ro.observe(el));
  }
  if (window.MutationObserver) {
    new MutationObserver(() => update(false)).observe(scrollEl, { childList: true });
  }
  update(false);
  return { update };
}

// 閱讀檢視
const scrubReader = createScrubber({
  scrollEl: readerScroll,
  host: document.getElementById('read'),
  watch: [document.getElementById('readerPages')],
  getLabel: () => {
    const total = readerEntries.length;
    if (!total) return { cur: 0, total: 0 };
    return { cur: findReaderPageAt(readerScroll.scrollTop + readerScroll.clientHeight * 0.3) + 1, total };
  }
});

// 調動頁面縮圖網格
const scrubGrid = createScrubber({
  scrollEl: reorderPageList,
  host: document.getElementById('reorderBody'),
  getLabel: () => {
    const kids = reorderPageList.children;
    const total = kids.length;
    if (!total) return { cur: 0, total: 0 };
    const top = reorderPageList.getBoundingClientRect().top;
    let lo = 0, hi = total - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (kids[mid].getBoundingClientRect().bottom - top > 12) hi = mid; else lo = mid + 1;
    }
    return { cur: lo + 1, total: Math.max(total, reorderPages.length) };
  }
});

// 滑塊開關（預設關閉，記在 localStorage）
const scrubToggleBtn = document.getElementById('scrubToggleBtn');
function setScrubEnabled(on) {
  document.body.classList.toggle('scrub-on', on);
  scrubToggleBtn.classList.toggle('active', on);
  try { localStorage.setItem('pdf_tool_scrub', on ? '1' : '0'); } catch (e) {}
  requestAnimationFrame(() => { scrubReader.update(false); scrubGrid.update(false); });
}
scrubToggleBtn.addEventListener('click', () => setScrubEnabled(!document.body.classList.contains('scrub-on')));
{
  let on = false;
  try { on = localStorage.getItem('pdf_tool_scrub') === '1'; } catch (e) {}
  setScrubEnabled(on);
}

// =========================================
// [新增] 頁面浮動操作列（觸控 / 手機；縮圖上的小按鈕在這些裝置上隱藏）
//   一般模式：作用於目前選取的那一頁（移動、預覽、旋轉、刪除）
//   選取模式：作用於所有已勾選頁面（旋轉、刪除）
// =========================================
const pageFloatBar = document.getElementById('pageFloatBar');
const pfbCount = document.getElementById('pfbCount');
const pfbPrev = document.getElementById('pfbPrev');
const pfbNext = document.getElementById('pfbNext');
const pfbPreview = document.getElementById('pfbPreview');
const pfbRotL = document.getElementById('pfbRotL');
const pfbRotR = document.getElementById('pfbRotR');
const pfbDelete = document.getElementById('pfbDelete');

function syncFloatBar() {
  const show = currentTab === 'reorder' && reorderPages.length > 0;
  pageFloatBar.classList.toggle('hidden', !show);
  document.body.classList.toggle('has-floatbar', show);
  if (!show) return;
  const total = reorderPages.length;
  const sel = reorderPages.filter(p => p.selected).length;
  pageFloatBar.classList.toggle('selection', isSelectionMode);
  pfbCount.classList.toggle('hidden', !isSelectionMode);
  pfbCount.textContent = `已選 ${sel}`;
  [pfbPrev, pfbNext, pfbPreview, document.getElementById('pfbSep1')].forEach(b => b.classList.toggle('hidden', isSelectionMode));
  if (isSelectionMode) {
    pfbRotL.disabled = pfbRotR.disabled = sel === 0;
    pfbDelete.disabled = sel === 0 || sel >= total;
  } else {
    pfbPrev.disabled = activeSidebarIndex <= 0;
    pfbNext.disabled = activeSidebarIndex >= total - 1;
    pfbRotL.disabled = pfbRotR.disabled = false;
    pfbDelete.disabled = total <= 1;
  }
}
function floatTargets() {
  return isSelectionMode ? reorderPages.filter(p => p.selected) : [reorderPages[activeSidebarIndex]].filter(Boolean);
}
pfbPrev.addEventListener('click', () => { if (activeSidebarIndex > 0) moveReorderPage(activeSidebarIndex, -1); });
pfbNext.addEventListener('click', () => { if (activeSidebarIndex < reorderPages.length - 1) moveReorderPage(activeSidebarIndex, 1); });
pfbPreview.addEventListener('click', () => { const p = reorderPages[activeSidebarIndex]; if (p) openHighResPreview(p); });
pfbRotL.addEventListener('click', () => rotatePages(floatTargets(), -90));
pfbRotR.addEventListener('click', () => rotatePages(floatTargets(), 90));
pfbDelete.addEventListener('click', () => {
  if (isSelectionMode) { deleteSelectedPagesBtn.click(); return; }
  if (reorderPages.length <= 1) return;
  pushHistory('移除頁面');
  reorderPages.splice(activeSidebarIndex, 1);
  if (activeSidebarIndex >= reorderPages.length) activeSidebarIndex = reorderPages.length - 1;
  renderReorderPages();
});

// 任何 .menu-panel 開啟時，替 body 加上 menu-open（給不支援 :has() 的舊瀏覽器用）
{
  const panels = document.querySelectorAll('.menu-panel');
  const syncMenuOpen = () => document.body.classList.toggle('menu-open', [...panels].some(p => !p.classList.contains('hidden')));
  const mo = new MutationObserver(syncMenuOpen);
  panels.forEach(p => mo.observe(p, { attributes: true, attributeFilter: ['class'] }));
  syncMenuOpen();
}

// 狀態改變時同步浮動列（包裝既有函式，不改動它們原本的內容）
{
  const _render = renderReorderPages;
  renderReorderPages = function (...a) { const r = _render.apply(this, a); syncFloatBar(); return r; };
  const _sel = updateSelectionUI;
  updateSelectionUI = function (...a) { const r = _sel.apply(this, a); syncFloatBar(); return r; };
  const _tab = switchTab;
  switchTab = function (...a) { const r = _tab.apply(this, a); syncFloatBar(); return r; };
  syncFloatBar();
}
