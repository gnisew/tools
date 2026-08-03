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

const autoSegmentRegionBtn = document.getElementById('autoSegmentRegionBtn');
let targetAutoSegmentRange = null

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

const toggleScriptModeBtn = document.getElementById('toggleScriptModeBtn');
const scriptEditorContainer = document.getElementById('scriptEditorContainer');
const scriptGutter = document.getElementById('scriptGutter');
const scriptTextarea = document.getElementById('scriptTextarea');
let isScriptMode = false;

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

    let isOverlapping = false;
    if (hasTemp) {
        const tStart = tempRegion.start;
        const tEnd = tempRegion.end;
        for (let i = 0; i < allLabelsOrdered.length; i++) {
            const label = allLabelsOrdered[i];
            if (timeDataMap[label]) {
                const times = typeof getCalculatedTimes === 'function' ? getCalculatedTimes(label) : null;
                if (times && tStart < (times.end - 0.01) && tEnd > (times.start + 0.01)) {
                    isOverlapping = true;
                    break;
                }
            }
        }
    }

    // 設定安全旗標：有藍色選取框，而且「沒有」重疊時，才允許執行新增類型的動作
    const canAddSafe = hasTemp && !isOverlapping;

    // 2. 更新「新增標記 (Enter)」按鈕狀態
    if (typeof tagRegionBtn !== 'undefined' && tagRegionBtn) {
        if (!isEditMode) { 
            tagRegionBtn.style.display = 'none'; 
        } else {
            tagRegionBtn.style.display = '';
            tagRegionBtn.disabled = !canAddSafe;
            tagRegionBtn.style.opacity = canAddSafe ? '1' : '0.3';
            tagRegionBtn.style.cursor = canAddSafe ? 'pointer' : 'not-allowed';
            
            if (hasTemp && isOverlapping) {
                tagRegionBtn.title = "標記範圍重疊，請縮小邊界";
            } else {
                tagRegionBtn.title = "將選取範圍套用至目前句子 (Enter)";
            }
        }
    }

    // 3. 更新「局部自動斷句」按鈕狀態
    const autoSegmentRegionBtn = document.getElementById('autoSegmentRegionBtn');
    if (autoSegmentRegionBtn) {
        if (!isEditMode) { 
            autoSegmentRegionBtn.style.display = 'none'; 
        } else {
            autoSegmentRegionBtn.style.display = '';
            
            const hasSelection = typeof selectedLabels !== 'undefined' && selectedLabels.length > 0;
            
            // ★ 新增：檢查是否完全沒有標記
            const hasNoMarkers = typeof allLabelsOrdered === 'undefined' || allLabelsOrdered.length === 0;
            
            // ★ 修改：允許在「無標記」時啟用 (canAutoSegment 為 true)
            const canAutoSegment = canAddSafe || hasSelection || hasNoMarkers;
            autoSegmentRegionBtn.disabled = !canAutoSegment;
            autoSegmentRegionBtn.style.opacity = canAutoSegment ? '1' : '0.3';
            autoSegmentRegionBtn.style.cursor = canAutoSegment ? 'pointer' : 'not-allowed';
            
            // 動態提示
            if (hasSelection) {
                autoSegmentRegionBtn.title = `針對選取的 ${selectedLabels.length} 個標記範圍重新自動斷句`;
            } else if (hasTemp && isOverlapping) {
                autoSegmentRegionBtn.title = "標記範圍重疊，無法執行局部自動斷句";
            } else if (hasNoMarkers) {
                // ★ 新增：無標記時的專屬提示文字
                autoSegmentRegionBtn.title = "自動全選並依靜音斷句"; 
            } else {
                autoSegmentRegionBtn.title = "選取的範圍依靜音自動斷句";
            }
        }
    }
    
    // 4. 其他工具列按鈕更新
    if (typeof clearRegionBtn !== 'undefined' && clearRegionBtn) {
        if (!isEditMode) { 
            clearRegionBtn.style.display = 'none'; 
        } else {
            clearRegionBtn.style.display = '';
            const canClear = hasActive || (typeof selectedLabels !== 'undefined' && selectedLabels.length > 0);
            clearRegionBtn.disabled = !canClear;
            clearRegionBtn.style.opacity = canClear ? '1' : '0.3';
            clearRegionBtn.style.cursor = canClear ? 'pointer' : 'not-allowed';
        }
    }
	
    if (typeof splitRegionBtn !== 'undefined' && splitRegionBtn) {
        if (!isEditMode) { 
            splitRegionBtn.style.display = 'none'; 
        } else {
            splitRegionBtn.style.display = '';
            const canSplit = hasActive && (typeof selectedLabels === 'undefined' || selectedLabels.length <= 1); 
            splitRegionBtn.disabled = !canSplit;
            splitRegionBtn.style.opacity = canSplit ? '1' : '0.3';
            splitRegionBtn.style.cursor = canSplit ? 'pointer' : 'not-allowed';
        }
    }
	
    if (typeof mergeRegionBtn !== 'undefined' && mergeRegionBtn) {
        if (!isEditMode) { 
            mergeRegionBtn.style.display = 'none'; 
        } else {
            mergeRegionBtn.style.display = '';
            let isContinuousSelection = false;
            if (typeof selectedLabels !== 'undefined' && selectedLabels.length > 1) {
                let sortedSelected = [...selectedLabels].sort((a, b) => allLabelsOrdered.indexOf(a) - allLabelsOrdered.indexOf(b));
                isContinuousSelection = true;
                for (let i = 0; i < sortedSelected.length - 1; i++) {
                    if (allLabelsOrdered.indexOf(sortedSelected[i+1]) !== allLabelsOrdered.indexOf(sortedSelected[i]) + 1) {
                        isContinuousSelection = false; break;
                    }
                }
            }
            mergeRegionBtn.disabled = !isContinuousSelection;
            mergeRegionBtn.style.opacity = isContinuousSelection ? '1' : '0.3';
            mergeRegionBtn.style.cursor = isContinuousSelection ? 'pointer' : 'not-allowed';
        }
    }

    if (typeof downloadActiveRegionBtn !== 'undefined' && downloadActiveRegionBtn) {
        const canDownload = (typeof selectedLabels !== 'undefined' && selectedLabels.length > 0) || (currentActiveLabel !== null && timeDataMap[currentActiveLabel] !== undefined) || hasTemp;
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




let modalAltCallback = null;
let modalCancelCallback = null;

function showCustomDialog(options) {
    const overlay = document.getElementById('customModalOverlay');
    const titleEl = document.getElementById('customModalTitle');
    const messageEl = document.getElementById('customModalMessage');
    const inputEl = document.getElementById('customModalInput');
    const confirmBtn = document.getElementById('customModalConfirmBtn');
    const cancelBtn = document.getElementById('customModalCancelBtn');
    const altBtn = document.getElementById('customModalAltBtn');
    
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
    
    // 自訂按鈕文字
    confirmBtn.textContent = options.confirmText || '確定';
    cancelBtn.textContent = options.cancelText || '取消';
    
    if (options.altText) {
        altBtn.style.display = 'inline-block';
        altBtn.textContent = options.altText;
    } else {
        altBtn.style.display = 'none';
    }
    
    modalConfirmCallback = options.onConfirm || null;
    modalAltCallback = options.onAlt || null;
    modalCancelCallback = options.onCancel || null;
    
    overlay.classList.add('show');
}

function closeCustomDialog() { 
    const overlay = document.getElementById('customModalOverlay');
    if (overlay) overlay.classList.remove('show'); 
    modalConfirmCallback = null; 
    modalAltCallback = null;
    modalCancelCallback = null;
}

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


window.snapWaveformToTop = function() {
    const stickyPanel = document.getElementById('stickyPanel');
    if (!stickyPanel) return;
    
    // 使用 offsetTop 取得面板在網頁中最原始的絕對 Y 座標 (不受 sticky 浮動干擾)
    const targetY = stickyPanel.offsetTop - 15;
    
    // 取得目前視窗的捲動位置
    const currentY = window.scrollY || document.documentElement.scrollTop;
    
    // 只有當視窗還沒往下捲過聲波圖時 (代表面板還沒吸頂)，才往下捲動
    if (currentY < targetY) {
        window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
};
