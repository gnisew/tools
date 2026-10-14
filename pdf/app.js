const { PDFDocument, degrees, rgb, StandardFonts } = PDFLib;

// 設定 PDF.js 的離線背景 Worker 路徑
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
}

// 4 段清晰度設定 (30 頁內小檔案自動預設為「高清 hd」)
const QUALITY_PRESETS = {
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
// [{ docId, key, originalIndex, originalPageNum, selected, rotation }]
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
let currentPresetCycleIndex = 1;
let statusTimeout = null;

// 縮圖快取與懶載入觀察器
let thumbnailCache = {};
let renderingPages = new Set();
let thumbObserver = null;

// 頂端共用 DOM
const openFileBtn = document.getElementById('openFileBtn');
const openFileBtnText = document.getElementById('openFileBtnText');
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
const mergeInvertSelectBtn = document.getElementById('mergeInvertSelectBtn');
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
const selectAllBtn = document.getElementById('selectAllBtn');
const selectAllBtnText = document.getElementById('selectAllBtnText');
const invertSelectBtn = document.getElementById('invertSelectBtn');
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
const thumbQualitySelect = document.getElementById('thumbQualitySelect');
const reverseOrderBtn = document.getElementById('reverseOrderBtn');
const resetOrderBtn = document.getElementById('resetOrderBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

// 單頁放大預覽燈箱 DOM
const previewModal = document.getElementById('previewModal');
const previewModalTitle = document.getElementById('previewModalTitle');
const previewCanvas = document.getElementById('previewCanvas');
const closePreviewBtn = document.getElementById('closePreviewBtn');

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
  if (reorderPageList.dataset.cols) {
    applyColumnPreset(parseInt(reorderPageList.dataset.cols, 10));
  }
}

function updateSidebarToggleVisibility() {
  const inReorder = currentTab === 'reorder';
  toggleSidebarBtn.classList.toggle('hidden', !inReorder);
  sidebarMenuSep.classList.toggle('hidden', !inReorder);
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
  { btn: document.getElementById('pageMenuBtn'), panel: document.getElementById('pageMenu') },
  { btn: document.getElementById('settingsMenuBtn'), panel: document.getElementById('settingsMenu') }
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

function openMenu({ btn, panel }) {
  closeMenus();
  closeFileFilterMenu();
  panel.classList.remove('hidden');
  btn.setAttribute('aria-expanded', 'true');
  const r = btn.getBoundingClientRect();
  const w = panel.offsetWidth;
  panel.style.top = `${r.bottom + 4}px`;
  panel.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w))}px`;   // 與按鈕右緣對齊，並限制在視窗內
}

menuPairs.forEach((pair) => {
  pair.btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (pair.panel.classList.contains('hidden')) openMenu(pair);
    else closeMenus();
  });
  pair.panel.addEventListener('click', (e) => {
    // 點到選項（含 disabled 以外的按鈕）後收起；原本各按鈕的點擊處理照常執行
    if (e.target.closest('.menu-item:not(:disabled)')) closeMenus();
  });
  pair.panel.addEventListener('keydown', (e) => {
    const items = Array.from(pair.panel.querySelectorAll('.menu-item:not(:disabled)'));
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
// 即時縮放控制 與 點擊比例按鈕切換「四頁 ➔ 雙頁 ➔ 單頁」
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
}

thumbSizeSlider.addEventListener('input', (e) => {
  applyContinuousZoom(parseInt(e.target.value, 10));
});

const presetCycleOrder = [4, 2, 1];
zoomModeLabel.addEventListener('click', () => {
  const cols = presetCycleOrder[currentPresetCycleIndex % presetCycleOrder.length];
  currentPresetCycleIndex++;
  applyColumnPreset(cols);
});

window.addEventListener('resize', () => {
  if (reorderPageList.dataset.cols) {
    applyColumnPreset(parseInt(reorderPageList.dataset.cols, 10));
  }
});

thumbQualitySelect.addEventListener('change', () => {
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
  currentTab = name;

  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  tabContents.forEach(c => c.classList.toggle('active', c.id === name));
  ctxGroups.forEach(g => g.classList.toggle('active', g.id === `ctx-${name}`));

  updateSidebarToggleVisibility();
  openFileBtnText.textContent = '載入';
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

primarySaveBtn.addEventListener('click', () => {
  if (currentTab === 'merge') {
    executeMergeSave();
  } else if (currentTab === 'split') {
    executeSplitSave();
  } else if (currentTab === 'reorder') {
    executeReorderSave();
  }
});

// sticky = true 時不會自動消失（用於處理中的進度訊息，完成後由下一次 setStatus 取代）
function setStatus(message, type = '', sticky = false, duration = 2400) {
  if (statusTimeout) clearTimeout(statusTimeout);
  if (!message) {
    statusMsg.classList.add('hidden');
    return;
  }
  statusMsg.textContent = message;
  statusMsg.className = `status-toast ${type}`;
  if (!sticky) {
    statusTimeout = setTimeout(() => {
      statusMsg.classList.add('hidden');
    }, duration);
  }
}

// 頂端細進度條
const progressBar = document.getElementById('progressBar');
const progressFill = progressBar.querySelector('.progress-fill');
function setProgress(done, total) {
  progressBar.classList.remove('hidden');
  progressFill.style.width = `${total > 0 ? Math.round((done / total) * 100) : 0}%`;
}
function clearProgress() {
  progressBar.classList.add('hidden');
  progressFill.style.width = '0%';
}
// 讓出主執行緒，讓進度畫面有機會更新
const nextFrame = () => new Promise(resolve => setTimeout(resolve, 0));

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
let passwordQueue = Promise.resolve();   // 一次只開一個對話框；同時載入多個加密檔時依序詢問

// 回傳使用者輸入的密碼；按「略過此檔」/ Esc 回傳 null
function askPassword(fileName, wrongBefore = false) {
  const task = () => new Promise((resolve) => {
    passwordResolver = resolve;
    passwordFileLabel.textContent = `檔案：${fileName}`;
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
  const resolve = passwordResolver;
  passwordResolver = null;
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
const imageOptCache = new WeakMap();         // 以原始影像位元組為鍵，同一張圖在同一等級只處理一次（逐頁 / 每 N 頁拆分時很有用）

const compressBtn = document.getElementById('compressBtn');
const compressModal = document.getElementById('compressModal');
const cmpLevel = document.getElementById('cmpLevel');
const cmpDesc = document.getElementById('cmpDesc');
const cmpOkBtn = document.getElementById('cmpOkBtn');
const cmpCancelBtn = document.getElementById('cmpCancelBtn');

function formatBytes(n) {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

// 取出並歸零本次作業的壓縮摘要，附加在成功訊息後面
function takeCompressNote() {
  const n = compressSaved;
  compressSaved = 0;
  return n > 0 ? `（影像縮減約 ${formatBytes(n)}）` : '';
}

function refreshCompressBtn() {
  const on = compressLevel !== 'off';
  compressBtn.classList.toggle('active', on);
  const names = { light: '輕度', standard: '標準', strong: '強力' };
  compressBtn.title = `縮小檔案：儲存時重新壓縮影像（${on ? names[compressLevel] : '關'}）`;
}
refreshCompressBtn();

function updateCompressDesc() {
  const p = COMPRESS_PRESETS[cmpLevel.value];
  cmpDesc.textContent = p ? p.desc : COMPRESS_OFF_DESC;
}

function openCompressModal() {
  cmpLevel.value = compressLevel;
  updateCompressDesc();
  compressModal.classList.remove('hidden');
  cmpLevel.focus();
}
function closeCompressModal() {
  compressModal.classList.add('hidden');
}
function confirmCompress() {
  compressLevel = COMPRESS_PRESETS[cmpLevel.value] ? cmpLevel.value : 'off';
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
  if (e.key === 'Enter' && !e.isComposing && e.target.tagName !== 'SELECT') {
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

    if (i % 2 === 1) await nextFrame();
  }
  return saved;
}

// 所有「輸出前」的收尾：頁碼 → （選用）影像壓縮 → 以 Object Streams 儲存
// quiet = true 時不更新狀態文字（逐頁 / 每 N 頁拆分時由外層顯示進度）
async function finalizePdf(pdfDoc, offset = 0, total = null, quiet = false) {
  await applyPageNumbers(pdfDoc, offset, total);

  const preset = COMPRESS_PRESETS[compressLevel];
  if (preset) {
    compressSaved += await optimizeImages(pdfDoc, preset, compressLevel, quiet);
  }

  if (!quiet) {
    setStatus('正在產生檔案…', '', true);
    await nextFrame();
  }
  return pdfDoc.save({ useObjectStreams: true });
}

// =======================
// 簡易 ZIP 打包器（僅儲存、不壓縮；PDF 本身已壓縮，再壓縮效益很小）
// =======================
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC32_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// entries: [{ name: string, data: Uint8Array }] → Blob (application/zip)
function buildZip(entries) {
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
    const crc = crc32(entry.data);

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
async function loadLibDoc(item) {
  let bytes;
  try {
    const pdf = await ensurePdfJsDoc(item);
    bytes = await pdf.getData();
  } catch (err) {
    bytes = new Uint8Array(await item.file.arrayBuffer());
  }
  try {
    return await PDFDocument.load(bytes);
  } catch (err) {
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

// 單次儲存作業內的 pdf-lib 文件快取（同一檔案多次用到時只載入一次；作業結束後隨區域變數釋放）
function createLibLoader() {
  const cache = new Map();
  return async (item) => {
    if (!cache.has(item.id)) cache.set(item.id, await loadLibDoc(item));
    return cache.get(item.id);
  };
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
    password: null
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
  for (const item of newItems) {
    try {
      const pdf = await openDocWithPassword(item);   // 與縮圖 / 預覽共用同一份 pdf.js 文件；加密檔會先詢問密碼
      item.pageCount = pdf.numPages;
    } catch (err) {
      console.error(`讀取 ${item.name} 失敗:`, err);
      item.pageCount = 0;
      failed.push({ name: item.name, kind: classifyLoadError(err) });
    }
    renderMergeList();
    loaded++;
    if (newItems.length > 1) setProgress(loaded, newItems.length);
  }
  clearProgress();
  setStatus('');

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
async function openDocWithPassword(item) {
  while (true) {
    try {
      return await ensurePdfJsDoc(item);
    } catch (err) {
      if (!isPasswordError(err)) throw err;
      const wrong = err.code === 2;          // 2 = 密碼錯誤
      item.password = null;
      setStatus('');                          // 先收起「正在讀取檔案…」提示，避免遮住對話框
      const pwd = await askPassword(item.name, wrong);
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
  toggleMergeSelectModeBtn.classList.toggle('active', isMergeSelectionMode);
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

mergeInvertSelectBtn.addEventListener('click', () => {
  if (!isMergeSelectionMode) return;
  docs.forEach(item => { item.selected = !item.selected; });
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
    mergeSelectAllBtnText.textContent = allSelected ? '取消' : '全選';
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
    toggleMergeSelectModeBtn.classList.remove('active');
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
    dragHandle.textContent = '⋮⋮';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'file-name';
    nameSpan.textContent = `${index + 1}. ${item.name}`;
    nameSpan.title = item.name;

    const pageBadge = document.createElement('span');
    pageBadge.className = 'file-page-badge';
    if (item.pageCount === null) {
      pageBadge.textContent = '讀取中...';
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
    upBtn.textContent = '↑';
    upBtn.title = '上移';
    upBtn.disabled = index === 0;
    upBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moveMergeFile(index, -1);
    });

    const downBtn = document.createElement('button');
    downBtn.className = 'icon-btn';
    downBtn.textContent = '↓';
    downBtn.title = '下移';
    downBtn.disabled = index === docs.length - 1;
    downBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moveMergeFile(index, 1);
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'icon-btn';
    removeBtn.textContent = '✕';
    removeBtn.title = '移除';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      docs.splice(index, 1);
      renderMergeList();
    });

    const splitBtn = document.createElement('button');
    splitBtn.className = 'icon-btn';
    splitBtn.textContent = '✂';
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
}

function releaseDoc(item) {
  const prefix = `${item.id}_`;
  Object.keys(thumbnailCache).forEach(k => {
    if (k.startsWith(prefix)) {
      URL.revokeObjectURL(thumbnailCache[k]);
      delete thumbnailCache[k];
    }
  });
  if (item.pdfJsPromise) item.pdfJsPromise.then(d => d.destroy()).catch(() => {});
  item.pdfJsPromise = null;
}

function moveMergeFile(index, direction) {
  const target = index + direction;
  const temp = docs[index];
  docs[index] = docs[target];
  docs[target] = temp;
  renderMergeList();
}

clearAllBtn.addEventListener('click', () => {
  if (docs.length === 0) return;
  // 調動中有調過頁序 / 刪除 / 旋轉時，清空會一併丟失，先確認
  if (reorderEdited && !confirm('調動中有尚未儲存的編輯（頁序、刪除、旋轉），清空後會全部消失。確定要清空嗎？')) {
    return;
  }
  docs = [];
  renderMergeList();
  setStatus('已清空所有檔案');
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
      const rangeOutName = await askFileName(`${baseName}_擷取`, 'pdf', '儲存擷取的 PDF');
      if (!rangeOutName) { setStatus(''); return; }
      const srcDoc = await loadLibDoc(splitItem);
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(srcDoc, pageIndices);
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

      // 打包 ZIP 時才有「單一輸出檔」可命名；分開下載時沿用自動檔名
      let zipOutName = '';
      if (useZip) {
        const zipDefaultBase = mode === 'chunk' ? `${baseName}_每${size}頁` : `${baseName}_逐頁拆分`;
        zipOutName = await askFileName(zipDefaultBase, 'zip', '儲存 ZIP 壓縮檔');
        if (!zipOutName) { setStatus(''); return; }
      }

      setStatus('正在讀取檔案…', '', true);
      const srcDoc = await loadLibDoc(splitItem);

      for (let g = 0; g < groups.length; g++) {
        setStatus(`正在拆分… ${g + 1}/${groups.length}`, '', true);
        setProgress(g, groups.length);
        await nextFrame();

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
        const zipBlob = buildZip(entries);
        downloadBlob(zipBlob, zipOutName);
        setStatus(`✓ 已將 ${groups.length} 個檔案打包成 ZIP 並開始下載${takeCompressNote()}`, 'success');
      } else {
        setStatus(`✓ 已拆分為 ${groups.length} 個檔案${takeCompressNote()}`, 'success');
      }
    }
  } catch (err) {
    setStatus(err.message || '分割發生錯誤', 'error');
  } finally {
    clearProgress();
    updateSaveButtonState();
  }
}

// =======================
// 3. 調整 PDF 頁序與多選儲存 / 多選刪除功能
// =======================
toggleSelectModeBtn.addEventListener('click', () => {
  isSelectionMode = !isSelectionMode;
  toggleSelectModeBtn.classList.toggle('active', isSelectionMode);
  selectionSubTools.classList.toggle('hidden', !isSelectionMode);
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

invertSelectBtn.addEventListener('click', () => {
  if (!isSelectionMode) return;
  reorderPages.forEach(p => {
    p.selected = !p.selected;
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
}

rangeSelectBtn.addEventListener('click', selectPagesByRange);
rangeSelectInput.addEventListener('input', () => rangeSelectInput.classList.remove('invalid'));
rangeSelectInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) {   // 輸入法選字時的 Enter 不算確認
    e.preventDefault();
    selectPagesByRange();
  }
});

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
  const selectedCount = reorderPages.filter(p => p.selected).length;
  const allSelected = totalCount > 0 && selectedCount === totalCount;

  if (isSelectionMode) {
    reorderPageInfo.textContent = `${selectedCount} / ${totalCount} 頁`;
    selectAllBtnText.textContent = allSelected ? '取消' : '全選';
    deleteSelectedPagesBtn.disabled = selectedCount === 0 || selectedCount >= totalCount;
    rotateLeftSelectedBtn.disabled = selectedCount === 0;
    rotateRightSelectedBtn.disabled = selectedCount === 0;
    deleteSelectedPagesText.textContent = selectedCount > 0 ? `刪除 (${selectedCount})` : '刪除';
  } else {
    reorderPageInfo.textContent = `共 ${totalCount} 頁`;
  }

  const mainCards = reorderPageList.querySelectorAll('.page-card');
  const sideItems = sidebarThumbList.querySelectorAll('.sidebar-item');

  reorderPages.forEach((p, idx) => {
    const isSelected = isSelectionMode && p.selected;
    const isActivePage = idx === activeSidebarIndex;

    const card = mainCards[idx];
    if (card) {
      card.classList.toggle('selected', isSelected);
      card.classList.toggle('active-page', isActivePage);
      card.tabIndex = isActivePage ? 0 : -1;
      if (isSelectionMode) card.setAttribute('aria-selected', String(!!p.selected));
      else card.removeAttribute('aria-selected');
    }

    const side = sideItems[idx];
    if (side) {
      side.classList.toggle('selected', isSelected);
      side.classList.toggle('active-page', isActivePage);
      if (isActivePage) side.setAttribute('aria-current', 'true');
      else side.removeAttribute('aria-current');
    }
  });

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
  thumbObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const wrapper = entry.target;
        const key = wrapper.dataset.pageNum;
        thumbObserver.unobserve(wrapper);
        renderSingleThumbnail(key);
      }
    });
  }, {
    rootMargin: '320px 0px'
  });
}

// 縮圖以 Blob URL 保存（比 base64 字串省記憶體），並限制同時渲染數量
let thumbGeneration = 0;      // 換檔 / 換清晰度時遞增，讓舊的渲染結果失效
const THUMB_CONCURRENCY = 3;
let thumbActive = 0;
const thumbQueue = [];

function clearThumbnailCache() {
  thumbGeneration++;
  Object.values(thumbnailCache).forEach(url => URL.revokeObjectURL(url));
  thumbnailCache = {};
  renderingPages.clear();
  thumbQueue.length = 0;
}

function renderSingleThumbnail(key) {
  if (!window.pdfjsLib) return;

  if (thumbnailCache[key]) {
    applyCachedThumbToDom(key, thumbnailCache[key]);
    return;
  }

  if (renderingPages.has(key)) return;
  renderingPages.add(key);
  thumbQueue.push(key);
  pumpThumbQueue();
}

function pumpThumbQueue() {
  while (thumbActive < THUMB_CONCURRENCY && thumbQueue.length > 0) {
    const key = thumbQueue.shift();
    thumbActive++;
    renderThumbnailNow(key).finally(() => {
      thumbActive--;
      pumpThumbQueue();
    });
  }
}

// 取得檔案的 pdf.js 文件（載入檔案取頁數時就建立並快取；檔案只讀一次，位元組交給 pdf.js 保管）
function ensurePdfJsDoc(item) {
  if (!item.pdfJsPromise) {
    item.pdfJsPromise = item.file.arrayBuffer()
      .then(buf => pdfjsLib.getDocument({ data: new Uint8Array(buf), password: item.password || undefined }).promise)
      .catch(err => { item.pdfJsPromise = null; throw err; });
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

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', preset.quality));

    canvas.width = 0;
    canvas.height = 0;

    if (generation !== thumbGeneration || !blob) return; // 已換清晰度或重建，丟棄舊結果

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
    }
  }
}

// =======================
// 復原 / 重做（頁序模式：排序、刪除、反轉、旋轉、還原）
// =======================
const HISTORY_LIMIT = 100;
let undoStack = [];
let redoStack = [];

function snapshotReorder(label) {
  return {
    label,
    pages: reorderPages.map(p => ({
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
  const selectedSet = new Set(reorderPages.filter(p => p.selected).map(p => p.key));
  reorderPages = snap.pages.map(p => ({ ...p, selected: selectedSet.has(p.key) }));
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

function getPageRotation(key) {
  const p = reorderPages.find(x => x.key === key);
  return p ? (p.rotation || 0) : 0;
}

function refreshPageRotationDom(pageObj) {
  const rot = pageObj.rotation || 0;
  document.querySelectorAll(`[data-page-num="${pageObj.key}"]`).forEach(wrapper => {
    const img = wrapper.querySelector('.page-thumb-img');
    if (img) setImgRotation(img, rot);
  });
  const idx = reorderPages.indexOf(pageObj);
  const card = reorderPageList.querySelectorAll('.page-card')[idx];
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
  const wrappers = document.querySelectorAll(`[data-page-num="${key}"]`);
  wrappers.forEach(wrapper => {
    const imgEl = wrapper.querySelector('.page-thumb-img');
    const placeholderEl = wrapper.querySelector('.thumb-placeholder');
    if (imgEl) {
      imgEl.src = dataUrl;
      imgEl.classList.add('loaded');
      setImgRotation(imgEl, getPageRotation(key));
    }
    if (placeholderEl) {
      placeholderEl.remove();
    }
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
    row.innerHTML = '<span class="filter-check">✓</span><span class="filter-name"></span><span class="filter-count"></span>';
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

function buildPageList(readyDocs) {
  return readyDocs.flatMap(d =>
    Array.from({ length: d.pageCount }, (_, i) => ({
      docId: d.id,
      key: `${d.id}_${i + 1}`,
      originalIndex: i,
      originalPageNum: i + 1,
      selected: false,
      rotation: 0
    }))
  );
}

// 依總頁數與檔案大小自動挑選縮圖清晰度；回傳是否有變動
function autoQualityFor(readyDocs) {
  const totalPages = readyDocs.reduce((sum, d) => sum + d.pageCount, 0);
  const totalSize = readyDocs.reduce((sum, d) => sum + d.file.size, 0);
  let q = 'fast';
  if (totalPages <= 30 && totalSize <= 15 * 1024 * 1024) q = 'hd';
  else if (totalPages <= 65) q = 'high';
  if (thumbQualitySelect.value === q) return false;
  thumbQualitySelect.value = q;
  return true;
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
    if (reorderPages.length > 0) {
      reorderPages = [];
      clearThumbnailCache();
      reorderPageList.innerHTML = '';
      sidebarThumbList.innerHTML = '';
    }
    reorderEdited = false;
    reorderOrderSig = '';
    isSelectionMode = false;
    toggleSelectModeBtn.classList.remove('active');
    selectionSubTools.classList.add('hidden');
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
      currentPresetCycleIndex = 1;
      applyColumnPreset(4);
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
  const d = docs.find(x => x.id === pageObj.docId);
  return d ? d.name : '';
}

// 頁面標註「來源」：單檔時只在頁序改變後顯示「原N」；多檔時一律顯示來源
function origTagText(pageObj, index, compact) {
  const n = pageObj.originalPageNum;
  if (!reorderMulti) {
    if (n === index + 1) return '';
    return compact ? `(${n})` : `(原${n})`;
  }
  const docIdx = docs.findIndex(d => d.id === pageObj.docId);
  if (compact) return `(${docIdx + 1}-${n})`;
  const name = docNameOf(pageObj).replace(/\.pdf$/i, '');
  return `(${name.length > 8 ? name.slice(0, 8) + '…' : name}·${n})`;
}

function renderReorderPages() {
  const hadFocus = reorderPageList.contains(document.activeElement);   // 重繪後要把焦點還給卡片
  reorderPageList.innerHTML = '';
  sidebarThumbList.innerHTML = '';

  const reorderDocIds = new Set(reorderPages.map(p => p.docId));
  reorderMulti = reorderDocIds.size > 1;
  reorderPageInfo.title = reorderMulti
    ? `${reorderDocIds.size} 個檔案`
    : docNameOf(reorderPages[0] || {});

  reorderPages.forEach((pageObj, index) => {
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

    const hoverBar = document.createElement('div');
    hoverBar.className = 'card-hover-actions';

    const actionGroup = document.createElement('div');
    actionGroup.className = 'hover-group';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'float-btn';
    prevBtn.textContent = '←';
    prevBtn.title = '前移一頁';
    prevBtn.disabled = index === 0;
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moveReorderPage(index, -1);
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'float-btn';
    nextBtn.textContent = '→';
    nextBtn.title = '後移一頁';
    nextBtn.disabled = index === reorderPages.length - 1;
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      moveReorderPage(index, 1);
    });

    const zoomBtn = document.createElement('button');
    zoomBtn.className = 'float-btn';
    zoomBtn.textContent = '🔍';
    zoomBtn.title = '獨立燈箱預覽';
    zoomBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openHighResPreview(pageObj);
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'float-btn danger';
    removeBtn.textContent = '✕';
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

    checkBadge.setAttribute('aria-hidden', 'true');
    actionGroup.append(prevBtn, nextBtn, zoomBtn, removeBtn);
    hoverBar.appendChild(actionGroup);

    // 旋轉按鈕（縮圖左下角，滑過才顯示）
    const rotateBar = document.createElement('div');
    rotateBar.className = 'card-rotate-actions';
    const rotateGroup = document.createElement('div');
    rotateGroup.className = 'hover-group';

    const rotLeftBtn = document.createElement('button');
    rotLeftBtn.className = 'float-btn';
    rotLeftBtn.textContent = '↺';
    rotLeftBtn.title = '向左旋轉 90°';
    rotLeftBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      rotatePages([pageObj], -90);
    });

    const rotRightBtn = document.createElement('button');
    rotRightBtn.className = 'float-btn';
    rotRightBtn.textContent = '↻';
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

    const img = document.createElement('img');
    img.className = 'page-thumb-img';
    img.alt = '';   // 卡片本身已有 aria-label，縮圖視為裝飾
    img.draggable = false;

    if (thumbnailCache[pageObj.key]) {
      img.src = thumbnailCache[pageObj.key];
      img.classList.add('loaded');
      setImgRotation(img, pageObj.rotation || 0);
      thumbWrapper.append(checkBadge, hoverBar, rotateBar, img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'thumb-placeholder';
      placeholder.textContent = `${pageObj.originalPageNum}`;
      thumbWrapper.append(checkBadge, hoverBar, rotateBar, placeholder, img);
      if (thumbObserver) {
        thumbObserver.observe(thumbWrapper);
      }
    }

    const caption = document.createElement('div');
    caption.className = 'page-caption';

    const numPill = document.createElement('span');
    numPill.className = 'page-num-pill';
    numPill.textContent = `${index + 1}`;
    caption.appendChild(numPill);

    const origText = origTagText(pageObj, index, false);
    if (origText) {
      const origSpan = document.createElement('span');
      origSpan.className = 'orig-tag';
      origSpan.textContent = origText;
      origSpan.title = docNameOf(pageObj);
      caption.appendChild(origSpan);
    }

    const rotTag = document.createElement('span');
    rotTag.className = 'rot-tag' + ((pageObj.rotation || 0) === 0 ? ' hidden' : '');
    rotTag.textContent = `↻${pageObj.rotation || 0}°`;
    caption.appendChild(rotTag);

    li.append(thumbWrapper, caption);
    bindPageDragEvents(li, index);
    reorderPageList.appendChild(li);

    const sideItem = document.createElement('li');
    sideItem.className = 'sidebar-item';
    sideItem.draggable = true;
    sideItem.title = `點擊定位至第 ${index + 1} 頁；按住可上下拖曳調整頁序（Ctrl＝只拖單頁）`;
    sideItem.setAttribute('aria-label', `定位至第 ${index + 1} 頁`);

    const sideBox = document.createElement('div');
    sideBox.className = 'sidebar-thumb-box';
    sideBox.dataset.pageNum = pageObj.key;

    const sideImg = document.createElement('img');
    sideImg.className = 'page-thumb-img';
    sideImg.draggable = false;

    if (thumbnailCache[pageObj.key]) {
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
      sideCaption.appendChild(sideOrig);
    }

    sideItem.append(sideBox, sideCaption);

    sideItem.addEventListener('click', () => {
      setActivePage(index, true);
    });

    bindPageDragEvents(sideItem, index);
    sidebarThumbList.appendChild(sideItem);
  });

  updateSelectionUI();

  if (hadFocus) {
    const card = reorderPageList.children[activeSidebarIndex];
    if (card) card.focus({ preventScroll: true });
  }
}

// =======================
// [新增] 頁面卡片：無障礙標籤與鍵盤操作
// =======================
function pageCardLabel(pageObj, index) {
  const parts = [`第 ${index + 1} 頁，共 ${reorderPages.length} 頁`];
  if (reorderMulti) {
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
    draggedPageGroup.forEach(p => {
      const i = reorderPages.indexOf(p);
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
const PREVIEW_TEXT_KEY = 'pdf_tool_preview_text';
const previewTextToggle = document.getElementById('previewTextToggle');
const previewPageWrap = document.getElementById('previewPageWrap');
const previewTextLayer = document.getElementById('previewTextLayer');
let previewTextEnabled = true;
try { previewTextEnabled = localStorage.getItem(PREVIEW_TEXT_KEY) !== '0'; } catch (e) {}
let previewToken = 0;           // 每次開啟預覽遞增，避免舊的非同步結果蓋掉新的
let currentPreviewPage = null;

function refreshPreviewTextToggle() {
  previewTextToggle.classList.toggle('active', previewTextEnabled);
  previewTextToggle.setAttribute('aria-pressed', String(previewTextEnabled));
  previewPageWrap.classList.toggle('no-text', !previewTextEnabled);
}
refreshPreviewTextToggle();

previewTextToggle.addEventListener('click', () => {
  previewTextEnabled = !previewTextEnabled;
  try { localStorage.setItem(PREVIEW_TEXT_KEY, previewTextEnabled ? '1' : '0'); } catch (e) {}
  refreshPreviewTextToggle();
  // 開啟時若目前這頁還沒建立文字圖層，重新載入一次
  if (previewTextEnabled && currentPreviewPage && !previewModal.classList.contains('hidden') &&
      previewTextLayer.childElementCount === 0) {
    openHighResPreview(currentPreviewPage);
  }
});

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

async function openHighResPreview(pageObj) {
  const token = ++previewToken;
  currentPreviewPage = pageObj;
  const item = docs.find(d => d.id === pageObj.docId);
  if (!item || !window.pdfjsLib) return;
  const originalPageNum = pageObj.originalPageNum;
  const label = docs.length > 1
    ? `${item.name} · 第 ${originalPageNum} 頁`
    : `原第 ${originalPageNum} 頁`;
  try {
    previewModalTitle.textContent = `${label} — 載入中...`;
    if (previewModal.classList.contains('hidden')) previewReturnFocus = document.activeElement;
    previewModal.classList.remove('hidden');
    closePreviewBtn.focus();

    const pdf = await ensurePdfJsDoc(item);
    const page = await pdf.getPage(originalPageNum);
    const rotation = ((page.rotate || 0) + getPageRotation(pageObj.key)) % 360;
    const unscaled = page.getViewport({ scale: 1, rotation });
    const dpr = window.devicePixelRatio || 1;
    const cssTargetWidth = Math.min(window.innerWidth * 0.85, 920);
    const cssScale = cssTargetWidth / unscaled.width;

    const renderViewport = page.getViewport({ scale: cssScale * dpr, rotation });

    previewCanvas.width = renderViewport.width;
    previewCanvas.height = renderViewport.height;
    previewCanvas.style.width = `${Math.round(unscaled.width * cssScale)}px`;

    const ctx = previewCanvas.getContext('2d', { alpha: false });
    await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
    if (token !== previewToken) return;
    previewModalTitle.textContent = label;
    await renderPreviewTextLayer(page, page.getViewport({ scale: cssScale, rotation }), token);
  } catch (err) {
    console.error(err);
    previewModalTitle.textContent = `預覽載入失敗`;
  }
}

closePreviewBtn.addEventListener('click', closeHighResPreview);
previewModal.addEventListener('click', (e) => {
  if (e.target === previewModal) closeHighResPreview();
});

function closeHighResPreview() {
  previewToken++;
  currentPreviewPage = null;
  previewTextLayer.replaceChildren();
  previewModal.classList.add('hidden');
  previewCanvas.width = 0;
  previewCanvas.height = 0;
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

async function executeReorderSave() {
  const pagesToSave = isSelectionMode
    ? reorderPages.filter(p => p.selected)
    : reorderPages;

  if (pagesToSave.length === 0) {
    setStatus('請至少勾選 1 個頁面', 'error');
    return;
  }

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

    // 連續來自同一檔案的頁面一次複製（共用字型等資源，輸出檔案較小）
    let i = 0;
    while (i < pagesToSave.length) {
      const docId = pagesToSave[i].docId;
      let j = i;
      while (j < pagesToSave.length && pagesToSave[j].docId === docId) j++;
      const run = pagesToSave.slice(i, j);

      const item = docs.find(d => d.id === docId);
      const src = await getLib(item);
      const copied = await newPdf.copyPages(src, run.map(p => p.originalIndex));
      copied.forEach((page, k) => {
        const extra = run[k].rotation || 0;
        if (extra) {
          page.setRotation(degrees((page.getRotation().angle + extra) % 360));
        }
        newPdf.addPage(page);
      });

      i = j;
      setProgress(i, pagesToSave.length);
      await nextFrame();
    }

    const pdfBytes = await finalizePdf(newPdf);
    downloadBlob(pdfBytes, reorderOutName);
    setStatus(`✓ 已儲存下載（共 ${pagesToSave.length} 頁）${takeCompressNote()}`, 'success');
  } catch (err) {
    console.error(err);
    setStatus('匯出失敗', 'error');
  } finally {
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

const READER_MARGIN_PX = 1400;
const READER_MAX_LIVE = 12;
const READER_CONCURRENCY = 2;
const READER_MAX_PIXELS = 12e6;
const READER_MIN_SCALE = 0.25;
const READER_MAX_SCALE = 4;
const READER_FIT_CAP = 1.5;

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
    loadReaderSizes(item, gen);
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
