const { PDFDocument } = PDFLib;

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
let reorderPages = []; // [{ originalIndex, originalPageNum, selected }]
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
  thumbnailCache = {};
  renderingPages.clear();
  initThumbObserver();
  renderReorderPages();
});

// 分頁切換邏輯
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentTab = btn.dataset.tab;

    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    ctxGroups.forEach(g => g.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(currentTab).classList.add('active');
    document.getElementById(`ctx-${currentTab}`).classList.add('active');

    openFileBtnText.textContent = currentTab === 'merge' ? '加檔' : '選檔';
    updateSaveButtonState();
  });
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

function setStatus(message, type = '') {
  if (statusTimeout) clearTimeout(statusTimeout);
  if (!message) {
    statusMsg.classList.add('hidden');
    return;
  }
  statusMsg.textContent = message;
  statusMsg.className = `status-toast ${type}`;
  statusTimeout = setTimeout(() => {
    statusMsg.classList.add('hidden');
  }, 2400);
}

function downloadBlob(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
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
// 1. 合併 PDF 功能 (支援各檔案頁數、勾選合併、勾選刪除)
// =======================
mergeInput.addEventListener('change', (e) => {
  addMergeFiles(Array.from(e.target.files));
  mergeInput.value = '';
});

setupDragAndDrop(mergeSection, (files) => {
  addMergeFiles(files);
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
  }
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
    setStatus('正在合併 PDF...');

    const mergedPdf = await PDFDocument.create();

    for (const item of itemsToMerge) {
      const arrayBuffer = await item.file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    const firstBaseName = itemsToMerge[0].name.replace(/\.pdf$/i, '');
    downloadBlob(mergedBytes, `${firstBaseName}_合併.pdf`);

    setStatus(`✓ 已合併 ${itemsToMerge.length} 個檔案並開始下載`, 'success');
  } catch (err) {
    console.error(err);
    setStatus('合併失敗：檔案可能受保護或損毀', 'error');
  } finally {
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

setupDragAndDrop(splitSection, (files) => {
  if (files.length > 0) {
    loadSplitFile(files[0]);
  }
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
    pageRangeInput.placeholder = `例如：1-${Math.min(3, splitTotalPages)}, ${splitTotalPages}`;
    updateSaveButtonState();
  } catch (err) {
    console.error(err);
    setStatus('無法讀取此 PDF', 'error');
  }
}

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
    setStatus('正在處理分割...');

    if (mode === 'range') {
      const pageIndices = parsePageRanges(pageRangeInput.value, splitTotalPages);
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(splitPdfDoc, pageIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      downloadBlob(pdfBytes, `${baseName}_擷取.pdf`);
      setStatus('✓ 擷取完成並下載', 'success');
    } else if (mode === 'each') {
      for (let i = 0; i < splitTotalPages; i++) {
        const singlePdf = await PDFDocument.create();
        const [copiedPage] = await singlePdf.copyPages(splitPdfDoc, [i]);
        singlePdf.addPage(copiedPage);
        const pdfBytes = await singlePdf.save();
        downloadBlob(pdfBytes, `${baseName}_第${i + 1}頁.pdf`);
      }
      setStatus(`✓ 已拆分為 ${splitTotalPages} 個檔案`, 'success');
    }
  } catch (err) {
    setStatus(err.message || '分割發生錯誤', 'error');
  } finally {
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

setupDragAndDrop(reorderSection, (files) => {
  if (files.length > 0) {
    loadReorderFile(files[0]);
  }
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

async function renderSingleThumbnail(originalPageNum) {
  if (!reorderPdfJsDoc) return;

  if (thumbnailCache[originalPageNum]) {
    applyCachedThumbToDom(originalPageNum, thumbnailCache[originalPageNum]);
    return;
  }

  if (renderingPages.has(originalPageNum)) return;
  renderingPages.add(originalPageNum);

  try {
    const preset = QUALITY_PRESETS[thumbQualitySelect.value] || QUALITY_PRESETS.hd;
    const page = await reorderPdfJsDoc.getPage(originalPageNum);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = preset.width / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d', { alpha: false });

    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', preset.quality);
    thumbnailCache[originalPageNum] = dataUrl;

    canvas.width = 0;
    canvas.height = 0;

    applyCachedThumbToDom(originalPageNum, dataUrl);
  } catch (err) {
    console.error(`渲染第 ${originalPageNum} 頁縮圖失敗:`, err);
  } finally {
    renderingPages.delete(originalPageNum);
  }
}

function applyCachedThumbToDom(originalPageNum, dataUrl) {
  const wrappers = document.querySelectorAll(`[data-page-num="${originalPageNum}"]`);
  wrappers.forEach(wrapper => {
    const imgEl = wrapper.querySelector('.page-thumb-img');
    const placeholderEl = wrapper.querySelector('.thumb-placeholder');
    if (imgEl) {
      imgEl.src = dataUrl;
      imgEl.classList.add('loaded');
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

    thumbnailCache = {};
    renderingPages.clear();
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

    initialReorderPages = pages.map((_, idx) => ({
      originalIndex: idx,
      originalPageNum: idx + 1,
      selected: false
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
      reorderPages.splice(index, 1);
      if (activeSidebarIndex >= reorderPages.length) {
        activeSidebarIndex = reorderPages.length - 1;
      }
      renderReorderPages();
    });

    actionGroup.append(prevBtn, nextBtn, zoomBtn, removeBtn);
    hoverBar.appendChild(actionGroup);

    const img = document.createElement('img');
    img.className = 'page-thumb-img';
    img.alt = `第 ${pageObj.originalPageNum} 頁`;
    img.draggable = false;

    if (thumbnailCache[pageObj.originalPageNum]) {
      img.src = thumbnailCache[pageObj.originalPageNum];
      img.classList.add('loaded');
      thumbWrapper.append(checkBadge, hoverBar, img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'thumb-placeholder';
      placeholder.textContent = `${pageObj.originalPageNum}`;
      thumbWrapper.append(checkBadge, hoverBar, placeholder, img);
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
    const unscaled = page.getViewport({ scale: 1 });
    const dpr = window.devicePixelRatio || 1;
    const cssTargetWidth = Math.min(window.innerWidth * 0.85, 920);
    const cssScale = cssTargetWidth / unscaled.width;

    const renderViewport = page.getViewport({ scale: cssScale * dpr });

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
  const target = index + direction;
  const temp = reorderPages[index];
  reorderPages[index] = reorderPages[target];
  reorderPages[target] = temp;
  activeSidebarIndex = target;
  renderReorderPages();
}

reverseOrderBtn.addEventListener('click', () => {
  reorderPages.reverse();
  renderReorderPages();
  setStatus('✓ 已反轉頁面順序', 'success');
});

resetOrderBtn.addEventListener('click', () => {
  reorderPages = initialReorderPages.map(p => ({ ...p, selected: false }));
  activeSidebarIndex = 0;
  lastCheckedPageIndex = null;
  renderReorderPages();
  setStatus('已還原預設頁面順序與頁數');
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
    setStatus('正在匯出 PDF...');

    const newPdf = await PDFDocument.create();
    const pageIndices = pagesToSave.map(p => p.originalIndex);
    const copiedPages = await newPdf.copyPages(reorderPdfDoc, pageIndices);
    copiedPages.forEach(page => newPdf.addPage(page));

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

function setupDragAndDrop(element, callback) {
  element.addEventListener('dragover', (e) => {
    if (draggedItemIndex !== null || draggedPageIndex !== null) return;
    e.preventDefault();
    element.classList.add('dragover');
  });
  element.addEventListener('dragleave', () => {
    element.classList.remove('dragover');
  });
  element.addEventListener('drop', (e) => {
    if (draggedItemIndex !== null || draggedPageIndex !== null) return;
    e.preventDefault();
    element.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      callback(Array.from(e.dataTransfer.files));
    }
  });
}