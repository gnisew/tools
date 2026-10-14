const { PDFDocument, degrees } = PDFLib;

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

// 1. 合併狀態：[{ file, name, pageCount, selected }]
let mergeFiles = [];
let draggedItemIndex = null;
let isMergeSelectionMode = false;
let lastCheckedMergeIndex = null;

// 2. 分割狀態
let splitFile = null;
let splitPdfDoc = null;
let splitTotalPages = 0;

// 3. 頁序狀態
let reorderFile = null;
let reorderPdfDoc = null;
let reorderPdfJsDoc = null;
let reorderPages = []; // [{ originalIndex, originalPageNum, selected, rotation }]  rotation：額外旋轉角度（0/90/180/270，順時針）
let initialReorderPages = [];
let draggedPageIndex = null;
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
const mergeInput = document.getElementById('mergeInput');
const mergeEmptyDropzone = document.getElementById('mergeEmptyDropzone');
const mergeFileList = document.getElementById('mergeFileList');
const clearMergeBtn = document.getElementById('clearMergeBtn');
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
const splitInput = document.getElementById('splitInput');
const splitEmptyDropzone = document.getElementById('splitEmptyDropzone');
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
const reorderInput = document.getElementById('reorderInput');
const reorderEmptyDropzone = document.getElementById('reorderEmptyDropzone');
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

toggleSidebarBtn.addEventListener('click', () => {
  const isHidden = reorderSidebar.classList.toggle('hidden');
  toggleSidebarBtn.classList.toggle('active', !isHidden);
  if (reorderPageList.dataset.cols) {
    applyColumnPreset(parseInt(reorderPageList.dataset.cols, 10));
  }
});

openFileBtn.addEventListener('click', () => {
  if (currentTab === 'merge') {
    mergeInput.click();
  } else if (currentTab === 'split') {
    splitInput.click();
  } else if (currentTab === 'reorder') {
    reorderInput.click();
  }
});


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
  if (!reorderPdfJsDoc) return;
  clearThumbnailCache();
  initThumbObserver();
  renderReorderPages();
});

// 分頁切換邏輯（以網址 hash 為準：#merge / #split / #reorder）
const VALID_TABS = ['merge', 'split', 'reorder'];

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

  openFileBtnText.textContent = name === 'merge' ? '加檔' : '選檔';
  updateSaveButtonState();
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.tab;
    if (tabFromHash() === name) {
      switchTab(name);
    } else {
      location.hash = name; // 觸發 hashchange，並留下瀏覽紀錄（可用上一頁 / 下一頁切換）
    }
  });
});

window.addEventListener('hashchange', () => {
  switchTab(tabFromHash() || 'merge');
});

// 更新左上角「儲存」按鈕文字與啟用狀態（文字保持簡短以節省工具列寬度）
function updateSaveButtonState() {
  if (currentTab === 'merge') {
    if (mergeFiles.length === 0) {
      primarySaveBtn.disabled = true;
      saveBtnText.textContent = '儲存';
      return;
    }
    if (isMergeSelectionMode) {
      const selectedCount = mergeFiles.filter(item => item.selected).length;
      primarySaveBtn.disabled = selectedCount < 2;
      saveBtnText.textContent = selectedCount >= 2 ? `儲存 (${selectedCount})` : '選 2 檔';
    } else {
      primarySaveBtn.disabled = mergeFiles.length < 2;
      saveBtnText.textContent = '儲存';
    }
  } else if (currentTab === 'split') {
    primarySaveBtn.disabled = !splitPdfDoc;
    saveBtnText.textContent = '儲存';
  } else if (currentTab === 'reorder') {
    if (!reorderPdfDoc || reorderPages.length === 0) {
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
function setStatus(message, type = '', sticky = false) {
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
    }, 2400);
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
mergeInput.addEventListener('change', (e) => {
  addMergeFiles(Array.from(e.target.files));
  mergeInput.value = '';
});

async function addMergeFiles(files) {
  const pdfFiles = files.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
  if (pdfFiles.length === 0) {
    setStatus('請選擇 PDF 檔案', 'error');
    return;
  }

  const newItems = pdfFiles.map(file => ({
    file,
    name: file.name,
    pageCount: null,
    selected: false
  }));

  mergeFiles.push(...newItems);
  mergeFiles.sort((a, b) =>
    a.name.localeCompare(b.name, 'zh-TW', { numeric: true, sensitivity: 'base' })
  );

  renderMergeList();

  let loaded = 0;
  for (const item of newItems) {
    try {
      const arrayBuffer = await item.file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      item.pageCount = pdf.getPageCount();
    } catch (err) {
      console.error(`讀取 ${item.name} 頁數失敗:`, err);
      item.pageCount = 0;
    }
    renderMergeList();
    loaded++;
    if (newItems.length > 1) setProgress(loaded, newItems.length);
  }
  clearProgress();
}

toggleMergeSelectModeBtn.addEventListener('click', () => {
  isMergeSelectionMode = !isMergeSelectionMode;
  toggleMergeSelectModeBtn.classList.toggle('active', isMergeSelectionMode);
  mergeSelectionSubTools.classList.toggle('hidden', !isMergeSelectionMode);
  mergeFileList.classList.toggle('selection-mode', isMergeSelectionMode);

  mergeFiles.forEach(item => { item.selected = false; });
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
  const allSelected = mergeFiles.length > 0 && mergeFiles.every(item => item.selected);
  const targetState = !allSelected;
  mergeFiles.forEach(item => { item.selected = targetState; });
  updateMergeSelectionUI();
});

mergeInvertSelectBtn.addEventListener('click', () => {
  if (!isMergeSelectionMode) return;
  mergeFiles.forEach(item => { item.selected = !item.selected; });
  updateMergeSelectionUI();
});

// 刪除所勾選的合併檔案
deleteSelectedMergeBtn.addEventListener('click', () => {
  if (!isMergeSelectionMode) return;
  const selectedCount = mergeFiles.filter(item => item.selected).length;
  if (selectedCount === 0) return;

  mergeFiles = mergeFiles.filter(item => !item.selected);
  lastCheckedMergeIndex = null;
  renderMergeList();
  setStatus(`✓ 已移除所選的 ${selectedCount} 個檔案`);
});

function toggleMergeItemSelection(index, isShiftKey) {
  if (!isMergeSelectionMode) return;
  const targetChecked = !mergeFiles[index].selected;

  if (isShiftKey && lastCheckedMergeIndex !== null && lastCheckedMergeIndex !== index) {
    const start = Math.min(lastCheckedMergeIndex, index);
    const end = Math.max(lastCheckedMergeIndex, index);
    for (let i = start; i <= end; i++) {
      mergeFiles[i].selected = targetChecked;
    }
  } else {
    mergeFiles[index].selected = targetChecked;
  }

  lastCheckedMergeIndex = index;
  updateMergeSelectionUI();
}

function updateMergeSelectionUI() {
  const totalFiles = mergeFiles.length;
  const hasFiles = totalFiles > 0;

  if (!hasFiles) {
    mergePageInfo.classList.add('hidden');
    updateSaveButtonState();
    return;
  }

  mergePageInfo.classList.remove('hidden');

  if (isMergeSelectionMode) {
    const selectedItems = mergeFiles.filter(item => item.selected);
    const selectedCount = selectedItems.length;
    const selectedPages = selectedItems.reduce((sum, item) => sum + (item.pageCount || 0), 0);
    const allSelected = selectedCount === totalFiles;

    mergePageInfo.textContent = `已選 ${selectedCount}/${totalFiles} 檔 (${selectedPages}頁)`;
    mergeSelectAllBtnText.textContent = allSelected ? '取消' : '全選';
    deleteSelectedMergeBtn.disabled = selectedCount === 0;
    deleteSelectedMergeText.textContent = selectedCount > 0 ? `刪除 (${selectedCount})` : '刪除';
  } else {
    const totalPages = mergeFiles.reduce((sum, item) => sum + (item.pageCount || 0), 0);
    mergePageInfo.textContent = `${totalFiles} 檔 · 共 ${totalPages} 頁`;
  }

  const rows = mergeFileList.querySelectorAll('.file-item');
  mergeFiles.forEach((item, idx) => {
    const row = rows[idx];
    if (row) {
      row.classList.toggle('selected', isMergeSelectionMode && item.selected);
    }
  });

  updateSaveButtonState();
}

function renderMergeList() {
  mergeFileList.innerHTML = '';

  const hasFiles = mergeFiles.length > 0;
  mergeEmptyDropzone.classList.toggle('hidden', hasFiles);
  mergeFileList.classList.toggle('hidden', !hasFiles);
  toggleMergeSelectModeBtn.classList.toggle('hidden', !hasFiles);

  if (!hasFiles && isMergeSelectionMode) {
    isMergeSelectionMode = false;
    toggleMergeSelectModeBtn.classList.remove('active');
    mergeSelectionSubTools.classList.add('hidden');
    mergeFileList.classList.remove('selection-mode');
  }

  mergeFiles.forEach((item, index) => {
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
      pageBadge.textContent = `${item.pageCount} 頁`;
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
    downBtn.disabled = index === mergeFiles.length - 1;
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
      mergeFiles.splice(index, 1);
      renderMergeList();
    });

    controls.append(upBtn, downBtn, removeBtn);
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

      const [movedFile] = mergeFiles.splice(draggedItemIndex, 1);
      mergeFiles.splice(index, 0, movedFile);
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

  clearMergeBtn.disabled = !hasFiles;
  updateMergeSelectionUI();
}

function moveMergeFile(index, direction) {
  const target = index + direction;
  const temp = mergeFiles[index];
  mergeFiles[index] = mergeFiles[target];
  mergeFiles[target] = temp;
  renderMergeList();
}

clearMergeBtn.addEventListener('click', () => {
  mergeFiles = [];
  renderMergeList();
});

async function executeMergeSave() {
  const itemsToMerge = isMergeSelectionMode
    ? mergeFiles.filter(item => item.selected)
    : mergeFiles;

  if (itemsToMerge.length < 2) {
    setStatus('請至少選擇 2 個 PDF 檔案進行合併', 'error');
    return;
  }

  try {
    primarySaveBtn.disabled = true;
    const total = itemsToMerge.length;
    setStatus('正在合併 PDF...', '', true);
    setProgress(0, total);
    await nextFrame();

    const mergedPdf = await PDFDocument.create();

    let done = 0;
    for (const item of itemsToMerge) {
      setStatus(`正在合併 PDF… ${done + 1}/${total}`, '', true);
      const arrayBuffer = await item.file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      done++;
      setProgress(done, total);
      await nextFrame();
    }

    setStatus('正在產生檔案…', '', true);
    await nextFrame();
    const mergedBytes = await mergedPdf.save();
    const firstBaseName = itemsToMerge[0].name.replace(/\.pdf$/i, '');
    downloadBlob(mergedBytes, `${firstBaseName}_合併.pdf`);

    setStatus(`✓ 已合併 ${itemsToMerge.length} 個檔案並開始下載`, 'success');
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
splitInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    loadSplitFile(e.target.files[0]);
  }
  splitInput.value = '';
});

async function loadSplitFile(file) {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    setStatus('請選擇 PDF 檔案', 'error');
    return;
  }
  try {
    const arrayBuffer = await file.arrayBuffer();
    splitPdfDoc = await PDFDocument.load(arrayBuffer);
    splitFile = file;
    splitTotalPages = splitPdfDoc.getPageCount();

    splitEmptyDropzone.classList.add('hidden');
    splitOptions.classList.remove('hidden');
    splitPageInfo.classList.remove('hidden');

    splitFileNameTitle.textContent = `📄 ${file.name}（共 ${splitTotalPages} 頁）`;
    splitPageInfo.textContent = `${splitTotalPages} 頁`;
    updateChunkHint();
    pageRangeInput.placeholder = `例如：1-${Math.min(3, splitTotalPages)}, ${splitTotalPages}`;
    updateSaveButtonState();
  } catch (err) {
    console.error(err);
    setStatus('無法讀取此 PDF', 'error');
  }
}

// 依目前選的分割模式，顯示或隱藏 ZIP 選項
function updateSplitModeUI() {
  const checked = document.querySelector('input[name="splitMode"]:checked');
  const mode = checked ? checked.value : 'range';
  splitZipRow.classList.toggle('hidden', mode === 'range');
}

// 「每 N 頁」的即時結果提示（例如：20 頁 → 4 份）
function updateChunkHint() {
  if (!splitPdfDoc || splitTotalPages === 0) {
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
  if (!splitPdfDoc) return;

  const mode = document.querySelector('input[name="splitMode"]:checked').value;
  const baseName = splitFile.name.replace(/\.pdf$/i, '');

  try {
    primarySaveBtn.disabled = true;
    setStatus('正在處理分割...', '', true);
    await nextFrame();

    if (mode === 'range') {
      const pageIndices = parsePageRanges(pageRangeInput.value, splitTotalPages);
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(splitPdfDoc, pageIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      downloadBlob(pdfBytes, `${baseName}_擷取.pdf`);
      setStatus('✓ 擷取完成並下載', 'success');
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

      for (let g = 0; g < groups.length; g++) {
        setStatus(`正在拆分… ${g + 1}/${groups.length}`, '', true);
        setProgress(g, groups.length);
        await nextFrame();

        const [s, e] = groups[g];
        const indices = [];
        for (let i = s; i <= e; i++) indices.push(i);

        const part = await PDFDocument.create();
        const copied = await part.copyPages(splitPdfDoc, indices);
        copied.forEach(p => part.addPage(p));
        const pdfBytes = await part.save();
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
        const zipName = mode === 'chunk'
          ? `${baseName}_每${size}頁.zip`
          : `${baseName}_逐頁拆分.zip`;
        downloadBlob(zipBlob, zipName);
        setStatus(`✓ 已將 ${groups.length} 個檔案打包成 ZIP 並開始下載`, 'success');
      } else {
        setStatus(`✓ 已拆分為 ${groups.length} 個檔案`, 'success');
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
reorderInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    loadReorderFile(e.target.files[0]);
  }
  reorderInput.value = '';
});

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
    }

    const side = sideItems[idx];
    if (side) {
      side.classList.toggle('selected', isSelected);
      side.classList.toggle('active-page', isActivePage);
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
        const pageNum = parseInt(wrapper.dataset.pageNum, 10);
        thumbObserver.unobserve(wrapper);
        renderSingleThumbnail(pageNum);
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

function renderSingleThumbnail(originalPageNum) {
  if (!reorderPdfJsDoc) return;

  if (thumbnailCache[originalPageNum]) {
    applyCachedThumbToDom(originalPageNum, thumbnailCache[originalPageNum]);
    return;
  }

  if (renderingPages.has(originalPageNum)) return;
  renderingPages.add(originalPageNum);
  thumbQueue.push(originalPageNum);
  pumpThumbQueue();
}

function pumpThumbQueue() {
  while (thumbActive < THUMB_CONCURRENCY && thumbQueue.length > 0) {
    const pageNum = thumbQueue.shift();
    thumbActive++;
    renderThumbnailNow(pageNum).finally(() => {
      thumbActive--;
      pumpThumbQueue();
    });
  }
}

async function renderThumbnailNow(originalPageNum) {
  const generation = thumbGeneration;
  const doc = reorderPdfJsDoc;

  try {
    if (!doc) return;
    const preset = QUALITY_PRESETS[thumbQualitySelect.value] || QUALITY_PRESETS.hd;
    const page = await doc.getPage(originalPageNum);
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

    if (generation !== thumbGeneration || !blob) return; // 已換檔或換清晰度，丟棄舊結果

    const url = URL.createObjectURL(blob);
    thumbnailCache[originalPageNum] = url;
    applyCachedThumbToDom(originalPageNum, url);
  } catch (err) {
    if (generation === thumbGeneration) {
      console.error(`渲染第 ${originalPageNum} 頁縮圖失敗:`, err);
    }
  } finally {
    if (generation === thumbGeneration) {
      renderingPages.delete(originalPageNum);
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
      originalIndex: p.originalIndex,
      originalPageNum: p.originalPageNum,
      rotation: p.rotation || 0
    })),
    active: activeSidebarIndex
  };
}

// 每次「修改前」呼叫，記錄修改前的狀態
function pushHistory(label) {
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
  const selectedSet = new Set(reorderPages.filter(p => p.selected).map(p => p.originalPageNum));
  reorderPages = snap.pages.map(p => ({ ...p, selected: selectedSet.has(p.originalPageNum) }));
  activeSidebarIndex = Math.max(0, Math.min(snap.active, reorderPages.length - 1));
  lastCheckedPageIndex = null;
  renderReorderPages();
  updateHistoryButtons();
}

function undoReorder() {
  if (!reorderPdfDoc || undoStack.length === 0) return;
  const entry = undoStack.pop();
  redoStack.push(snapshotReorder(entry.label));
  restoreSnapshot(entry);
  setStatus(`↶ 已復原：${entry.label}`);
}

function redoReorder() {
  if (!reorderPdfDoc || redoStack.length === 0) return;
  const entry = redoStack.pop();
  undoStack.push(snapshotReorder(entry.label));
  restoreSnapshot(entry);
  setStatus(`↷ 已重做：${entry.label}`);
}

undoBtn.addEventListener('click', undoReorder);
redoBtn.addEventListener('click', redoReorder);

window.addEventListener('keydown', (e) => {
  if (currentTab !== 'reorder' || !reorderPdfDoc) return;
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

function getPageRotation(originalPageNum) {
  const p = reorderPages.find(x => x.originalPageNum === originalPageNum);
  return p ? (p.rotation || 0) : 0;
}

function refreshPageRotationDom(pageObj) {
  const rot = pageObj.rotation || 0;
  document.querySelectorAll(`[data-page-num="${pageObj.originalPageNum}"]`).forEach(wrapper => {
    const img = wrapper.querySelector('.page-thumb-img');
    if (img) setImgRotation(img, rot);
  });
  const idx = reorderPages.indexOf(pageObj);
  const card = reorderPageList.querySelectorAll('.page-card')[idx];
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

function applyCachedThumbToDom(originalPageNum, dataUrl) {
  const wrappers = document.querySelectorAll(`[data-page-num="${originalPageNum}"]`);
  wrappers.forEach(wrapper => {
    const imgEl = wrapper.querySelector('.page-thumb-img');
    const placeholderEl = wrapper.querySelector('.thumb-placeholder');
    if (imgEl) {
      imgEl.src = dataUrl;
      imgEl.classList.add('loaded');
      setImgRotation(imgEl, getPageRotation(originalPageNum));
    }
    if (placeholderEl) {
      placeholderEl.remove();
    }
  });
}

async function loadReorderFile(file) {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    setStatus('請選擇 PDF 檔案', 'error');
    return;
  }
  try {
    const arrayBuffer = await file.arrayBuffer();

    clearThumbnailCache();
    if (reorderPdfJsDoc) {
      await reorderPdfJsDoc.destroy();
      reorderPdfJsDoc = null;
    }

    const bufferForPdfLib = arrayBuffer.slice(0);
    const bufferForPdfJs = new Uint8Array(arrayBuffer.slice(0));

    reorderPdfDoc = await PDFDocument.load(bufferForPdfLib);
    if (window.pdfjsLib) {
      reorderPdfJsDoc = await pdfjsLib.getDocument({ data: bufferForPdfJs }).promise;
    }

    reorderFile = file;
    const pages = reorderPdfDoc.getPages();
    const totalPages = pages.length;

    if (totalPages <= 30 && file.size <= 15 * 1024 * 1024) {
      thumbQualitySelect.value = 'hd';
    } else if (totalPages <= 65) {
      thumbQualitySelect.value = 'high';
    } else {
      thumbQualitySelect.value = 'fast';
    }

    isSelectionMode = false;
    toggleSelectModeBtn.classList.remove('active');
    selectionSubTools.classList.add('hidden');
    reorderBody.classList.remove('selection-mode');

    clearHistory();
    initialReorderPages = pages.map((_, idx) => ({
      originalIndex: idx,
      originalPageNum: idx + 1,
      selected: false,
      rotation: 0
    }));

    reorderPages = initialReorderPages.map(p => ({ ...p }));
    activeSidebarIndex = 0;
    lastCheckedPageIndex = null;

    reorderEmptyDropzone.classList.add('hidden');
    reorderBody.classList.remove('hidden');
    reorderTools.classList.remove('hidden');

    initThumbObserver();
    renderReorderPages();

    currentPresetCycleIndex = isTabMode ? 1 : 2;
    applyColumnPreset(isTabMode ? 4 : 2);
  } catch (err) {
    console.error(err);
    setStatus('無法讀取此 PDF', 'error');
  }
}

function renderReorderPages() {
  reorderPageList.innerHTML = '';
  sidebarThumbList.innerHTML = '';

  const fileNameShort = reorderFile ? reorderFile.name : '';
  reorderPageInfo.title = fileNameShort;

  reorderPages.forEach((pageObj, index) => {
    const li = document.createElement('li');
    li.className = 'page-card';
    li.draggable = true;
    li.dataset.cardIndex = index;

    const thumbWrapper = document.createElement('div');
    thumbWrapper.className = 'thumb-wrapper';
    thumbWrapper.dataset.pageNum = pageObj.originalPageNum;
    thumbWrapper.title = '按住可拖曳排序；雙擊可開啟獨立預覽視窗';

    li.addEventListener('click', (e) => {
      if (isSelectionMode) {
        togglePageSelection(index, e.shiftKey);
      } else {
        setActivePage(index, false);
      }
    });

    thumbWrapper.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openHighResPreview(pageObj.originalPageNum);
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
      openHighResPreview(pageObj.originalPageNum);
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

    rotateGroup.append(rotLeftBtn, rotRightBtn);
    rotateBar.appendChild(rotateGroup);

    const img = document.createElement('img');
    img.className = 'page-thumb-img';
    img.alt = `第 ${pageObj.originalPageNum} 頁`;
    img.draggable = false;

    if (thumbnailCache[pageObj.originalPageNum]) {
      img.src = thumbnailCache[pageObj.originalPageNum];
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

    if (pageObj.originalPageNum !== (index + 1)) {
      const origSpan = document.createElement('span');
      origSpan.className = 'orig-tag';
      origSpan.textContent = `(原${pageObj.originalPageNum})`;
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
    sideItem.title = `點擊定位至第 ${index + 1} 頁；按住可上下拖曳調整頁序`;

    const sideBox = document.createElement('div');
    sideBox.className = 'sidebar-thumb-box';
    sideBox.dataset.pageNum = pageObj.originalPageNum;

    const sideImg = document.createElement('img');
    sideImg.className = 'page-thumb-img';
    sideImg.draggable = false;

    if (thumbnailCache[pageObj.originalPageNum]) {
      sideImg.src = thumbnailCache[pageObj.originalPageNum];
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
    if (pageObj.originalPageNum !== (index + 1)) {
      const sideOrig = document.createElement('span');
      sideOrig.className = 'orig-tag';
      sideOrig.textContent = `(${pageObj.originalPageNum})`;
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
}

function bindPageDragEvents(element, index) {
  element.addEventListener('dragstart', (e) => {
    draggedPageIndex = index;
    element.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  element.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (draggedPageIndex === null || draggedPageIndex === index) return;
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

    if (draggedPageIndex === null || draggedPageIndex === index) return;

    pushHistory('調整頁序');
    const [movedPage] = reorderPages.splice(draggedPageIndex, 1);
    reorderPages.splice(index, 0, movedPage);
    activeSidebarIndex = index;
    draggedPageIndex = null;
    renderReorderPages();
  });

  element.addEventListener('dragend', () => {
    draggedPageIndex = null;
    document.querySelectorAll('.page-card, .sidebar-item').forEach(card => {
      card.classList.remove('dragging', 'drag-over-card');
    });
  });
}

async function openHighResPreview(originalPageNum) {
  if (!reorderPdfJsDoc) return;
  try {
    previewModalTitle.textContent = `原第 ${originalPageNum} 頁 — 載入中...`;
    previewModal.classList.remove('hidden');

    const page = await reorderPdfJsDoc.getPage(originalPageNum);
    const rotation = ((page.rotate || 0) + getPageRotation(originalPageNum)) % 360;
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
    previewModalTitle.textContent = `原第 ${originalPageNum} 頁`;
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
  previewModal.classList.add('hidden');
  previewCanvas.width = 0;
  previewCanvas.height = 0;
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
  reorderPages = initialReorderPages.map(p => ({ ...p, selected: false }));
  activeSidebarIndex = 0;
  lastCheckedPageIndex = null;
  renderReorderPages();
  setStatus('已還原預設頁面順序、頁數與旋轉（可按 Ctrl+Z 復原）');
});

async function executeReorderSave() {
  const pagesToSave = isSelectionMode
    ? reorderPages.filter(p => p.selected)
    : reorderPages;

  if (!reorderPdfDoc || pagesToSave.length === 0) {
    setStatus('請至少勾選 1 個頁面', 'error');
    return;
  }

  try {
    primarySaveBtn.disabled = true;
    setStatus('正在匯出 PDF...', '', true);
    await nextFrame();

    const newPdf = await PDFDocument.create();
    const pageIndices = pagesToSave.map(p => p.originalIndex);
    const copiedPages = await newPdf.copyPages(reorderPdfDoc, pageIndices);
    copiedPages.forEach((page, i) => {
      const extra = pagesToSave[i].rotation || 0;
      if (extra) {
        page.setRotation(degrees((page.getRotation().angle + extra) % 360));
      }
      newPdf.addPage(page);
    });

    const pdfBytes = await newPdf.save();
    const baseName = reorderFile.name.replace(/\.pdf$/i, '');
    const suffix = isSelectionMode ? `_選取${pagesToSave.length}頁` : '_調整頁序';

    downloadBlob(pdfBytes, `${baseName}${suffix}.pdf`);
    setStatus(`✓ 已儲存下載（共 ${pagesToSave.length} 頁）`, 'success');
  } catch (err) {
    console.error(err);
    setStatus('匯出失敗', 'error');
  } finally {
    updateSaveButtonState();
  }
}

// =======================
// 全頁拖放：整個視窗都能接收 PDF，依目前分頁分派
// =======================
const dropOverlay = document.getElementById('dropOverlay');
const dropOverlayText = document.getElementById('dropOverlayText');
const DROP_HINTS = {
  merge: '放開以加入 PDF 檔案（可多個）',
  split: '放開以載入要分割的 PDF',
  reorder: '放開以載入要調整頁序的 PDF'
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

  if (currentTab === 'merge') {
    addMergeFiles(files);
  } else if (currentTab === 'split') {
    loadSplitFile(files[0]);
  } else if (currentTab === 'reorder') {
    loadReorderFile(files[0]);
  }
});

// =======================
// 啟動：依網址 hash 決定初始分頁
// =======================
{
  const initialTab = tabFromHash();
  switchTab(initialTab || 'merge');
  if (!initialTab) history.replaceState(null, '', '#merge');
}
