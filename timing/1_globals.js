// DOM 元素參考
const rawTextInput = document.getElementById('rawTextInput');
const audioUrlInput = document.getElementById('audioUrlInput');
const loadOnlineAudioBtn = document.getElementById('loadOnlineAudioBtn');
const audioUpload = document.getElementById('audioUpload');
const triggerAudioUploadBtn = document.getElementById('triggerAudioUploadBtn');
const parseBtn = document.getElementById('parseBtn');
const clearStorageBtn = document.getElementById('clearStorageBtn');
const clearAllTagsBtn = document.getElementById('clearAllTagsBtn'); 
const sentenceList = document.getElementById('sentenceList');
const audioPlayer = document.getElementById('audioPlayer');
const audioTimeDisplay = document.getElementById('audioTimeDisplay'); 
const listPanel = document.getElementById('listPanel');

const mainTitleDisplay = document.getElementById('mainTitleDisplay');
const setupPanel = document.getElementById('setupPanel');
const setupPanelHeader = document.getElementById('setupPanelHeader');
const setupToggleIcon = document.getElementById('setupToggleIcon');
const setupPanelBody = document.getElementById('setupPanelBody');
const projectTitleInput = document.getElementById('projectTitleInput');
const importProjectBtn = document.getElementById('importProjectBtn');
const importProjectInput = document.getElementById('importProjectInput');

const exportTextBtn = document.getElementById('exportTextBtn');
const exportTsvBtn = document.getElementById('exportTsvBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const exportAudacityBtn = document.getElementById('exportAudacityBtn');
const exportSrtBtn = document.getElementById('exportSrtBtn');
const importSrtBtn = document.getElementById('importSrtBtn');
const importSrtInput = document.getElementById('importSrtInput');
const exportAudioZipBtn = document.getElementById('exportAudioZipBtn');

const downloadActiveRegionBtn = document.getElementById('downloadActiveRegionBtn');
const tagRegionBtn = document.getElementById('tagRegionBtn');
const clearRegionBtn = document.getElementById('clearRegionBtn');
const splitRegionBtn = document.getElementById('splitRegionBtn');
const mergeRegionBtn = document.getElementById('mergeRegionBtn');
const hkMerge = document.getElementById('hkMerge');
const mergeSelectedBtn = document.getElementById('mergeSelectedBtn');
const adjustPaddingBtn = document.getElementById('adjustPaddingBtn');
const locateCurrentBtn = document.getElementById('locateCurrentBtn'); 

const sortToggleBtn = document.getElementById('sortToggleBtn');
const sortMenu = document.getElementById('sortMenu');

const exportWrapper = document.getElementById('exportWrapper');
const copyExportBtn = document.getElementById('copyExportBtn');
const closeExportBtn = document.getElementById('closeExportBtn');
const outputArea = document.getElementById('outputArea');

const importAudacityBtn = document.getElementById('importAudacityBtn');
const importAudacityInput = document.getElementById('importAudacityInput');

const toggleModeBtn = document.getElementById('toggleModeBtn');
const modeText = document.getElementById('modeText');
const stickyPanel = document.getElementById('stickyPanel');
const listHeaderContainer = document.getElementById('listHeaderContainer'); 
const compactControls = document.getElementById('compactControls');
const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn'); 
const playbackSpeedSelect = document.getElementById('playbackSpeedSelect'); 
const scrollToTopBtn = document.getElementById('scrollToTopBtn');

const openSidebarBtn = document.getElementById('openSidebarBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const settingsSidebar = document.getElementById('settingsSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const exportAudioFormatSelect = document.getElementById('exportAudioFormatSelect');
const scrollAlignSelect = document.getElementById('scrollAlignSelect');

const appWidthSelect = document.getElementById('appWidthSelect');
const autoScrollModeSelect = document.getElementById('autoScrollModeSelect');

const continuousPlayModeSelect = document.getElementById('continuousPlayModeSelect');
const playPaddingInput = document.getElementById('playPaddingInput');
const loopModeSelect = document.getElementById('loopModeSelect');
const loopCountInput = document.getElementById('loopCountInput');

const hkRewind = document.getElementById('hkRewind');
const hkForward = document.getElementById('hkForward');
const hkPrev = document.getElementById('hkPrev');
const hkNext = document.getElementById('hkNext');
const hkSplit = document.getElementById('hkSplit');
const resetShortcutsBtn = document.getElementById('resetShortcutsBtn');

const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomSlider = document.getElementById('zoomSlider');
const zoomPresetSelect = document.getElementById('zoomPresetSelect');
const zoomDisplay = document.getElementById('zoomDisplay');

const waveMoreBtn = document.getElementById('waveMoreBtn');
const waveMoreMenu = document.getElementById('waveMoreMenu');
const waveSelectAllBtn = document.getElementById('waveSelectAllBtn');
const waveCancelSelectBtn = document.getElementById('waveCancelSelectBtn');

const waveHeightSelect = document.getElementById('waveHeightSelect');
const heightToggleBtnSidebar = document.getElementById('heightToggleBtnSidebar');
const copyTextBtn = document.getElementById('copyTextBtn');
const clearTextBtn = document.getElementById('clearTextBtn');
const localFileHint = document.getElementById('localFileHint');

const toggleShiftBtnsBtn = document.getElementById('toggleShiftBtnsBtn');
const toggleClearBtnsBtn = document.getElementById('toggleClearBtnsBtn');
const toggleMoreBtnsBtn = document.getElementById('toggleMoreBtnsBtn'); 

const restoreTagsBtn = document.getElementById('restoreTagsBtn');
const autoSegmentBtn = document.getElementById('autoSegmentBtn');
const timeDisplayToggleBtn = document.getElementById('timeDisplayToggleBtn');
const fontToggleBtn = document.getElementById('fontToggleBtn');

const asModal = document.getElementById('autoSegmentModalOverlay');
const asThreshold = document.getElementById('asThreshold');
const asThresholdVal = document.getElementById('asThresholdVal');
const asSilence = document.getElementById('asSilence');
const asSilenceVal = document.getElementById('asSilenceVal');
const asMinSegment = document.getElementById('asMinSegment');
const asMinSegmentVal = document.getElementById('asMinSegmentVal');
const asPadding = document.getElementById('asPadding');
const asPaddingVal = document.getElementById('asPaddingVal');
const asConfirmBtn = document.getElementById('asConfirmBtn');
const asCancelBtn = document.getElementById('asCancelBtn');

const modalOverlay = document.getElementById('customModalOverlay');
const modalTitle = document.getElementById('customModalTitle');
const modalMessage = document.getElementById('customModalMessage');
const modalInput = document.getElementById('customModalInput');
const modalConfirmBtn = document.getElementById('customModalConfirmBtn');
const modalCancelBtn = document.getElementById('customModalCancelBtn');

let timeDecimalPlaces = parseInt(localStorage.getItem('tagger_timeDecimals')) || 1;

// 全域狀態變數
let currentParseMode = 'punct'; 
let currentExportFormat = 'para'; 
let currentActiveLabel = null;
let tempRegion = null;
let lastClickTime = null;
let isShiftPressed = false;
let timeDataMap = {}; 
let sentenceTextMap = {}; 
let allLabelsOrdered = []; 
let verifyEndTime = null; 
let verifyingLabel = null; 
let isEditMode = true; 
let wavesurfer = null; 
let isRendering = false; 
let wsRegions = null; 
let isDraggingRegion = false;
let regionDragTimeout = null;

let continuousPlayMode = localStorage.getItem('tagger_continuousPlayMode') || 'normal';
let currentAppWidth = localStorage.getItem('tagger_appWidth') || '100%';
if (currentAppWidth === '800px') { currentAppWidth = '100%'; }
let currentWaveHeight = parseInt(localStorage.getItem('tagger_waveHeight')) || 80;

let autoScrollMode = localStorage.getItem('tagger_autoScrollMode') || 'center';
let playPadding = parseFloat(localStorage.getItem('tagger_playPadding')) || 0.2;

let loopMode = localStorage.getItem('tagger_loopMode') || 'none';
let loopCount = parseInt(localStorage.getItem('tagger_loopCount')) || 0;
let currentLoopCounter = 0; 

let showShiftBtns = false;
let showClearBtns = false;
let showMoreBtns = false; 

const waveHeights = [60, 100, 140]; 
const fontSizes = [16, 18, 20, 22, 24];
let currentFontIndex = 0;
const timeModes = [{ id: 'full', label: '完整' }, { id: 'range', label: '頭尾' }, { id: 'start', label: '開頭' }, { id: 'duration', label: '長度' }];
let currentTimeModeIndex = 0;
let modalConfirmCallback = null;

let currentSortMode = 'default';
let currentSortedLabels = []; 
let isContinuousSortedPlay = false;
let precisionRafId = null;

function updateToolbarButtons() {
    const hasTemp = tempRegion !== null;
    const hasActive = currentActiveLabel !== null && timeDataMap[currentActiveLabel] !== undefined;

    if (tagRegionBtn) {
        if (!isEditMode) { tagRegionBtn.style.display = 'none'; } 
        else {
            tagRegionBtn.style.display = '';
            tagRegionBtn.disabled = !hasTemp;
            tagRegionBtn.style.opacity = hasTemp ? '1' : '0.3';
            tagRegionBtn.style.cursor = hasTemp ? 'pointer' : 'not-allowed';
        }
    }
    
    if (clearRegionBtn) {
        if (!isEditMode) { clearRegionBtn.style.display = 'none'; } 
        else {
            clearRegionBtn.style.display = '';
            clearRegionBtn.disabled = !hasActive;
            clearRegionBtn.style.opacity = hasActive ? '1' : '0.3';
            clearRegionBtn.style.cursor = hasActive ? 'pointer' : 'not-allowed';
        }
    }
	
    if (splitRegionBtn) {
        if (!isEditMode) { 
            splitRegionBtn.style.display = 'none'; 
        } else {
            splitRegionBtn.style.display = '';
            
            // 核心判斷：有選取當前句，且總選取數量不超過 1
            const canSplit = hasActive && selectedLabels.length <= 1; 
            
            splitRegionBtn.disabled = !canSplit;
            splitRegionBtn.style.opacity = canSplit ? '1' : '0.3';
            splitRegionBtn.style.cursor = canSplit ? 'pointer' : 'not-allowed';
        }
    }
	
    if (mergeRegionBtn) {
        if (!isEditMode) { 
            mergeRegionBtn.style.display = 'none'; 
        } else {
            mergeRegionBtn.style.display = '';
            
            // 判斷是否連續選取
            let isContinuousSelection = false;
            if (selectedLabels.length > 1) {
                let sortedSelected = [...selectedLabels].sort((a, b) => allLabelsOrdered.indexOf(a) - allLabelsOrdered.indexOf(b));
                isContinuousSelection = true;
                for (let i = 0; i < sortedSelected.length - 1; i++) {
                    if (allLabelsOrdered.indexOf(sortedSelected[i+1]) !== allLabelsOrdered.indexOf(sortedSelected[i]) + 1) {
                        isContinuousSelection = false; break;
                    }
                }
            }
            
            // 依據連續性決定是否鎖定按鈕
            mergeRegionBtn.disabled = !isContinuousSelection;
            mergeRegionBtn.style.opacity = isContinuousSelection ? '1' : '0.3';
            mergeRegionBtn.style.cursor = isContinuousSelection ? 'pointer' : 'not-allowed';
        }
    }

    if (downloadActiveRegionBtn) {
        const canDownload = selectedLabels.length > 0 || (currentActiveLabel !== null && timeDataMap[currentActiveLabel] !== undefined);
        downloadActiveRegionBtn.disabled = !canDownload;
        downloadActiveRegionBtn.style.opacity = canDownload ? '1' : '0.3';
        downloadActiveRegionBtn.style.cursor = canDownload ? 'pointer' : 'not-allowed';
    }
}

let selectedLabels = [];
let lastSelectedLabel = null;



function toggleSelection(label) {
    const idx = selectedLabels.indexOf(label);
    if (idx > -1) selectedLabels.splice(idx, 1);
    else selectedLabels.push(label);
    updateSelectionUI();
}

function selectRange(startLabel, endLabel) {
    if (!startLabel || !allLabelsOrdered.includes(startLabel)) {
        startLabel = currentActiveLabel || allLabelsOrdered[0];
    }
    const startIdx = allLabelsOrdered.indexOf(startLabel);
    const endIdx = allLabelsOrdered.indexOf(endLabel);
    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);
    
    selectedLabels = [];
    for (let i = minIdx; i <= maxIdx; i++) {
        selectedLabels.push(allLabelsOrdered[i]);
    }
    updateSelectionUI();
}

function clearSelection() {
    selectedLabels = [];
    updateSelectionUI();
}

const defaultShortcuts = { 
    rewind: 'Ctrl+ArrowLeft', 
    forward: 'Ctrl+ArrowRight', 
    prev: 'Ctrl+ArrowUp', 
    next: 'Ctrl+ArrowDown',
    split: 'Ctrl+I',
    merge: 'Ctrl+J'
};
let activeShortcuts = { ...defaultShortcuts };

function loadShortcuts() {
    const saved = localStorage.getItem('tagger_shortcuts');
    if (saved) {
        try { activeShortcuts = { ...defaultShortcuts, ...JSON.parse(saved) }; } 
        catch (e) { activeShortcuts = { ...defaultShortcuts }; }
    }
    if (hkRewind) hkRewind.value = activeShortcuts.rewind;
    if (hkForward) hkForward.value = activeShortcuts.forward;
    if (hkPrev) hkPrev.value = activeShortcuts.prev;
    if (hkNext) hkNext.value = activeShortcuts.next;
}

function attachKeyCatcher(inputEl, keyName) {
    if (!inputEl) return;
    inputEl.addEventListener('keydown', (e) => {
        e.preventDefault(); 
        if (e.key === 'Tab' || e.key === 'Escape') return inputEl.blur();
        
        let keys = [];
        if (e.ctrlKey) keys.push('Ctrl');
        if (e.altKey) keys.push('Alt');
        if (e.shiftKey) keys.push('Shift');
        
        if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
            if (e.code.startsWith('Arrow')) keys.push(e.code);
            else if (e.code === 'Space') keys.push('Space');
            else keys.push(e.key.toUpperCase());
            
            const comboStr = keys.join('+');
            inputEl.value = comboStr;
            activeShortcuts[keyName] = comboStr;
            localStorage.setItem('tagger_shortcuts', JSON.stringify(activeShortcuts));
            showToast('快速鍵已更新', 'success');
            inputEl.blur(); 
        }
    });
}

let toastTimeout;
function showToast(message, type = 'normal') {
    const toast = document.getElementById("toast");
    toast.textContent = message; toast.className = ""; 
    if (type === 'error') toast.classList.add("error");
    if (type === 'success') toast.classList.add("success");
    void toast.offsetWidth; toast.classList.add("show");
    clearTimeout(toastTimeout); toastTimeout = setTimeout(() => { toast.classList.remove("show"); }, 3000);
}

// ================= 修改優化：自訂對話框渲染修正 =================
function showCustomDialog(options) {
    const overlay = document.getElementById('customModalOverlay');
    const titleEl = document.getElementById('customModalTitle');
    const messageEl = document.getElementById('customModalMessage');
    const inputEl = document.getElementById('customModalInput');
    
    if (!overlay || !titleEl || !messageEl) return;

    titleEl.textContent = options.title || '提示';
    
    messageEl.innerHTML = options.message || ''; 
    
    if (options.isPrompt) {
        inputEl.style.display = 'block';
        inputEl.value = options.defaultValue || '';
        setTimeout(() => inputEl.focus(), 100);
    } else {
        inputEl.style.display = 'none';
        inputEl.value = '';
    }
    
    modalConfirmCallback = options.onConfirm || null;
    overlay.classList.add('show');
}
// =========================================================================
function closeCustomDialog() { modalOverlay.classList.remove('show'); modalConfirmCallback = null; }

function sanitizeFilename(name) { return name.replace(/[\\/:*?"<>|]/g, '_').trim(); }
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}
function formatSrtTime(seconds) {
    if (isNaN(seconds) || seconds === null) return "00:00:00,000";
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    const ms = Math.round((seconds - Math.floor(seconds)) * 1000).toString().padStart(3, '0');
    return `${h}:${m}:${s},${ms}`;
}
function parseSrtTime(timeStr) {
    const parts = timeStr.split(':'); if (parts.length !== 3) return 0;
    const h = parseInt(parts[0], 10); const m = parseInt(parts[1], 10);
    const secParts = parts[2].split(','); const s = parseInt(secParts[0], 10);
    const ms = secParts[1] ? parseInt(secParts[1], 10) : 0;
    return h * 3600 + m * 60 + s + ms / 1000;
}

// 核心升級：精確度提升至 1 毫秒 (toFixed(3)) 
function getCalculatedTimes(label) {
    let data = timeDataMap[label]; if (!data) return null;
    let start = typeof data === 'object' ? data.start : data;
    let end = (typeof data === 'object' && data.end !== null) ? data.end : null;
    if (end === null) {
        const currentIndex = allLabelsOrdered.indexOf(label); let nextStart = null;
        for (let i = currentIndex + 1; i < allLabelsOrdered.length; i++) {
            const nextData = timeDataMap[allLabelsOrdered[i]];
            if (nextData) { nextStart = typeof nextData === 'object' ? nextData.start : nextData; break; }
        }
        if (nextStart !== null) end = Math.max(start, nextStart); 
        else end = audioPlayer.duration ? audioPlayer.duration : start + 1; 
    }
    return { start: parseFloat(start.toFixed(3)), end: parseFloat(end.toFixed(3)), duration: parseFloat((end - start).toFixed(3)) };
}

// ================= Undo / Redo 歷史狀態引擎 =================
const MAX_HISTORY = 30; // 最多保留 30 步復原紀錄
let undoStack = [];
let redoStack = [];

// 在執行任何破壞性動作前呼叫此函式，拍下資料快照
function saveState() {
    // 使用 JSON 深拷貝來複製目前的資料狀態
    const currentState = {
        labels: JSON.parse(JSON.stringify(allLabelsOrdered)),
        texts: JSON.parse(JSON.stringify(sentenceTextMap)),
        times: JSON.parse(JSON.stringify(timeDataMap))
    };
    undoStack.push(currentState);
    
    // 如果超過設定的步數上限，移除最舊的紀錄
    if (undoStack.length > MAX_HISTORY) {
        undoStack.shift();
    }
    // 一旦有了新動作，舊的「重做」紀錄就會失效清空
    redoStack = []; 
}

// 執行復原 (Undo)
function performUndo() {
    if (undoStack.length === 0) {
        if (typeof showToast === 'function') showToast('已經是最初狀態，沒有可復原的動作', 'normal');
        return;
    }
    // 將「現在」的狀態推入 Redo 堆疊，以便反悔
    redoStack.push({
        labels: JSON.parse(JSON.stringify(allLabelsOrdered)),
        texts: JSON.parse(JSON.stringify(sentenceTextMap)),
        times: JSON.parse(JSON.stringify(timeDataMap))
    });
    
    // 取出上一步的狀態並套用
    const prevState = undoStack.pop();
    applyHistoryState(prevState);
    if (typeof showToast === 'function') showToast('已復原 (Undo)', 'success');
}

// 執行重做 (Redo)
function performRedo() {
    if (redoStack.length === 0) {
        if (typeof showToast === 'function') showToast('沒有可重做的動作', 'normal');
        return;
    }
    // 將「現在」的狀態推回 Undo 堆疊
    undoStack.push({
        labels: JSON.parse(JSON.stringify(allLabelsOrdered)),
        texts: JSON.parse(JSON.stringify(sentenceTextMap)),
        times: JSON.parse(JSON.stringify(timeDataMap))
    });
    
    // 取出下一步的狀態並套用
    const nextState = redoStack.pop();
    applyHistoryState(nextState);
    if (typeof showToast === 'function') showToast('已重做 (Redo)', 'success');
}

// 套用歷史紀錄的核心復原程式
function applyHistoryState(state) {
    allLabelsOrdered = state.labels;
    sentenceTextMap = state.texts;
    timeDataMap = state.times;
    
    // 強制寫入瀏覽器暫存並要求畫面重新繪製
    saveToStorage();
    if (typeof renderSentenceList === 'function') renderSentenceList();
    if (typeof renderAllRegions === 'function') renderAllRegions();
    if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
}
