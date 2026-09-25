// ================= 4h_ui_list_tools.js: 清除刪除功能、聲波圖文字顯示設定、列表編號、音訊刪除/匯出、錨點平移引擎 =================
// 本檔案由 4_ui_events.js 拆分而來（原始第 3445-3783 行），內容未經改寫，僅搬移。
// 依賴：1_globals.js 中定義的 DOM 參照與全域狀態變數，需在此檔之前載入。

// ================= ★ 全新：三大清除與刪除功能模組 (防幽靈事件版) ★ =================

// 實用小工具：清除按鈕上所有舊的幽靈事件，再綁定新事件 (絕對不會跳兩次視窗)
function cleanAndBindEvent(btnId, callback) {
    const oldBtn = document.getElementById(btnId);
    if (oldBtn) {
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
        newBtn.addEventListener('click', callback);
    }
}

// 1. 清除時間標記 (自動判斷是否刪除空行)
cleanAndBindEvent('clearTimeTagsBtn', () => {
    document.getElementById('editMenu')?.classList.remove('show');
    if (Object.keys(timeDataMap).length === 0) return showToast('目前沒有時間資料', 'error');
    
    showCustomDialog({
        title: '清除時間標記',
        message: '確定要清除所有時間標記嗎？<br><br><span style="color:#666; font-size:0.9em;">(列表與聲波上的標記皆會清除。<strong style="color:#C62828;">若列表句子無文字，將會一併刪除該列</strong>)</span>',
        onConfirm: () => {
            if (typeof saveState === 'function') saveState(); 
            
            // 清除聲波區塊
            if (typeof wavesurfer !== 'undefined' && wavesurfer && wavesurfer.regions) {
                wavesurfer.regions.clear(); 
            }

            let rowDeleted = false;
            const labelsToProcess = [...allLabelsOrdered]; 
            
            labelsToProcess.forEach(label => {
                const text = sentenceTextMap[label] || '';
                
                // 條件 A：沒有文字 -> 連同標記整列刪除
                // ★ 修改：改用 isBlank 判斷「所有語言」是否都空白（原因同 handleClearTag）
                if ((typeof isBlank === 'function') ? isBlank(text) : text.trim() === '') {
                    const idx = allLabelsOrdered.indexOf(label);
                    if (idx > -1) {
                        allLabelsOrdered.splice(idx, 1);
                        delete sentenceTextMap[label];
                        delete timeDataMap[label];
                        rowDeleted = true;
                    }
                } 
                // 條件 B：有文字 -> 保留該列，只清除時間
                else {
                    if (timeDataMap[label]) {
                        delete timeDataMap[label];
                    }
                }
            });

            // 如果有刪除整列，呼叫重新排號並重繪畫面
            if (rowDeleted && typeof reassignLabels === 'function') {
                reassignLabels(); 
            } else {
                saveToStorage();
                if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
                if (typeof renderSentenceList === 'function') renderSentenceList();
            }
            
            showToast('已清除時間標記', 'success');
        }
    });
});

// 2. 清空列表文字 (保留時間)
cleanAndBindEvent('clearListTextBtn', () => {
    document.getElementById('editMenu')?.classList.remove('show');
    if (allLabelsOrdered.length === 0) return showToast('目前沒有資料', 'error');
    
    showCustomDialog({
        title: '清空列表文字',
        message: '確定要清空列表文字嗎？<br><br><span style="color:#666; font-size:0.9em;">(將會清空所有句子的文字內容，但會<strong style="color:#00897B;">完全保留您的時間標記與聲波區塊</strong>)</span>',
        onConfirm: () => {
            if (typeof saveState === 'function') saveState();
            
            sentenceTextMap = {};
            allLabelsOrdered.forEach(label => { sentenceTextMap[label] = ""; });
            
            saveToStorage();
            if (typeof renderSentenceList === 'function') renderSentenceList();
            if (typeof populateScriptEditor === 'function' && typeof isScriptMode !== 'undefined' && isScriptMode) {
                populateScriptEditor();
            }
            showToast('已清空列表文字', 'success');
        }
    });
});

// 3. 刪除列表與標記 (徹底重置)
cleanAndBindEvent('deleteAllDataBtn', () => {
    document.getElementById('editMenu')?.classList.remove('show');
    if (allLabelsOrdered.length === 0 && Object.keys(timeDataMap).length === 0) return showToast('目前沒有資料', 'error');
    
    showCustomDialog({
        title: '刪除列表與標記',
        message: '<span style="color:#C62828; font-weight:bold; font-size:1.1em;">⚠️ 嚴重警告</span><br><br>確定要刪除整個列表與標記嗎？<br><br>這將會徹底清空您的文字、時間數據與聲波標記，讓專案回到最初的空白狀態！',
        confirmText: '確定刪除',
        onConfirm: () => {
            if (typeof saveState === 'function') saveState();
            
            timeDataMap = {};
            sentenceTextMap = {};
            allLabelsOrdered = [];
            
            if (typeof wavesurfer !== 'undefined' && wavesurfer && wavesurfer.regions) {
                wavesurfer.regions.clear();
            }
            
            localStorage.removeItem('tagger_allLabels');
            localStorage.removeItem('tagger_textMap');
            localStorage.removeItem('tagger_timeDataMap');
            
            saveToStorage();
            if (typeof renderSentenceList === 'function') renderSentenceList();
            if (typeof checkButtonVisibility === 'function') checkButtonVisibility();
            
            if (typeof isScriptMode !== 'undefined' && isScriptMode) {
                document.getElementById('toggleScriptModeBtn')?.click();
            }
            
            showToast('已徹底刪除列表與標記', 'success');
        }
    });
});
// =========================================================================
// ================= ★ 新增：聲波圖顯示文字與字數設定 ★ =================
const showRegionTextCheck = document.getElementById('showRegionTextCheck');
const regionTextLengthInput = document.getElementById('regionTextLengthInput');
const regionTextLengthBlock = document.getElementById('regionTextLengthBlock');

// 1. 讀取儲存的設定 (預設為不顯示，字數預設為 4)
window.showRegionText = localStorage.getItem('tagger_showRegionText') === 'true';
window.regionTextLength = parseInt(localStorage.getItem('tagger_regionTextLength'));
if (isNaN(window.regionTextLength)) window.regionTextLength = 4;

if (showRegionTextCheck && regionTextLengthInput) {
    // 2. 初始化介面狀態
    showRegionTextCheck.checked = window.showRegionText;
    regionTextLengthInput.value = window.regionTextLength;
    if (regionTextLengthBlock) regionTextLengthBlock.style.display = window.showRegionText ? 'block' : 'none';

    // 3. 監聽開關改變
    showRegionTextCheck.addEventListener('change', (e) => {
        window.showRegionText = e.target.checked;
        localStorage.setItem('tagger_showRegionText', window.showRegionText ? 'true' : 'false');
        if (regionTextLengthBlock) regionTextLengthBlock.style.display = window.showRegionText ? 'block' : 'none';
        
        // 即時重新繪製聲波圖標記
        if (typeof renderAllRegions === 'function') renderAllRegions();
    });

    // 4. 監聽字數改變
    regionTextLengthInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value) || 0;
        if (val < 0) val = 0; // 防止負數
        window.regionTextLength = val;
        e.target.value = val;
        localStorage.setItem('tagger_regionTextLength', window.regionTextLength);
        
        // 即時重新繪製聲波圖標記
        if (typeof renderAllRegions === 'function') renderAllRegions();
    });
}

// ================= ★ 新增：聲波圖顯示文字 - 選擇要顯示哪個語言 ★ =================
// 預設「全部語言」（跟舊行為一致：直接顯示 sentenceTextMap 裡的原始整串文字）。
// 只有啟用多語字幕時才會顯示這個下拉選單，因為停用時只有一種語言，沒有選擇的意義。
window.regionTextLang = localStorage.getItem('tagger_regionTextLang') || 'raw';

const regionTextLangRow = document.getElementById('regionTextLangRow');
const regionTextLangSelect = document.getElementById('regionTextLangSelect');

// 依目前偵測到的語言數量重新產生選項；並依「是否啟用多語字幕」決定這一列要不要顯示。
// 語言的偵測與命名跟頁首「語言」選單共用同一套邏輯（getLangCount / getLangName，見 1c_languages.js），
// 所以由 4a_ui_title_misc.js 的 updateLangViewMenuLabels() 統一呼叫這裡，確保兩處同步。
function rebuildRegionTextLangOptions() {
    if (!regionTextLangSelect || !regionTextLangRow) return;

    const enabled = (typeof getLangMultiEnabled === 'function') ? getLangMultiEnabled() : false;
    regionTextLangRow.style.display = enabled ? 'flex' : 'none';
    if (!enabled) return;

    const count = (typeof getLangCount === 'function') ? getLangCount() : 1;
    const prevValue = window.regionTextLang;
    regionTextLangSelect.innerHTML = '';

    const rawOption = document.createElement('option');
    rawOption.value = 'raw';
    rawOption.textContent = '全部語言';
    regionTextLangSelect.appendChild(rawOption);

    for (let i = 0; i < count; i++) {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = (typeof getLangName === 'function') ? getLangName(i) : `語言${i + 1}`;
        regionTextLangSelect.appendChild(opt);
    }

    // 還原之前選過的值；如果該語言已經不存在了（例如語言數變少），退回「全部語言」
    const validValues = Array.from(regionTextLangSelect.options).map(o => o.value);
    regionTextLangSelect.value = validValues.includes(prevValue) ? prevValue : 'raw';
    if (regionTextLangSelect.value !== prevValue) {
        window.regionTextLang = regionTextLangSelect.value;
        localStorage.setItem('tagger_regionTextLang', window.regionTextLang);
    }
}
rebuildRegionTextLangOptions();

regionTextLangSelect?.addEventListener('change', (e) => {
    window.regionTextLang = e.target.value;
    localStorage.setItem('tagger_regionTextLang', window.regionTextLang);

    // 即時重新繪製聲波圖標記
    if (typeof renderAllRegions === 'function') renderAllRegions();
});


// ================= ★ 新增：列表編號顯示方式 (顯示映射引擎) ★ =================
const labelDisplayModeSelect = document.getElementById('labelDisplayModeSelect');
const continuousLabelSettings = document.getElementById('continuousLabelSettings');
const labelPrefixInput = document.getElementById('labelPrefixInput');
const labelStartNumInput = document.getElementById('labelStartNumInput');
const labelDigitsSelect = document.getElementById('labelDigitsSelect');

// 1. 讀取儲存的設定
window.labelDisplayMode = localStorage.getItem('tagger_labelMode') || 'default';
window.labelPrefix = localStorage.getItem('tagger_labelPrefix') || '';
window.labelStartNum = parseInt(localStorage.getItem('tagger_labelStartNum'));
if (isNaN(window.labelStartNum)) window.labelStartNum = 1;
window.labelDigits = parseInt(localStorage.getItem('tagger_labelDigits'));
if (isNaN(window.labelDigits)) window.labelDigits = 3;

// 2. 核心翻譯函式：負責把 A01 轉換成使用者設定的格式
window.getDisplayLabel = function(originalLabel) {
    if (window.labelDisplayMode !== 'continuous') return originalLabel;
    
    // 取得該句子在所有資料中的絕對順序
    const index = allLabelsOrdered.indexOf(originalLabel);
    if (index === -1) return originalLabel; // 防呆
    
    // 計算連續數字並補零
    const num = window.labelStartNum + index;
    const numStr = String(num).padStart(window.labelDigits, '0');
    return `${window.labelPrefix}${numStr}`;
};

// 3. 極致優化的即時更新引擎 (不重新繪製 DOM，只替換文字)
window.refreshAllDisplayLabels = function() {
    // 更新單句列表
    document.querySelectorAll('.sentence-item').forEach(item => {
        const label = item.id.replace('item-', '');
        const labelSpan = item.querySelector('.sentence-label');
        if (labelSpan) labelSpan.textContent = window.getDisplayLabel(label);
    });
    
    // 更新劇本模式行號
    document.querySelectorAll('.gutter-line:not(.para)').forEach(el => {
        const label = el.dataset.label;
        if (label) el.textContent = window.getDisplayLabel(label);
    });

    // 更新聲波圖上的標籤
    allLabelsOrdered.forEach(label => {
        const rawText = sentenceTextMap[label] || '';
        if (typeof updateRegionTextDisplay === 'function') {
            updateRegionTextDisplay(label, rawText);
        }
    });
};

if (labelDisplayModeSelect) {
    // 綁定介面初始值
    labelDisplayModeSelect.value = window.labelDisplayMode;
    labelPrefixInput.value = window.labelPrefix;
    labelStartNumInput.value = window.labelStartNum;
    labelDigitsSelect.value = window.labelDigits;
    continuousLabelSettings.style.display = window.labelDisplayMode === 'continuous' ? 'block' : 'none';

    // 監聽各種設定改變，並呼叫即時更新引擎
    labelDisplayModeSelect.addEventListener('change', (e) => {
        window.labelDisplayMode = e.target.value;
        localStorage.setItem('tagger_labelMode', window.labelDisplayMode);
        continuousLabelSettings.style.display = window.labelDisplayMode === 'continuous' ? 'block' : 'none';
        window.refreshAllDisplayLabels();
    });

    labelPrefixInput.addEventListener('input', (e) => {
        window.labelPrefix = e.target.value;
        localStorage.setItem('tagger_labelPrefix', window.labelPrefix);
        window.refreshAllDisplayLabels();
    });

    labelStartNumInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 0) val = 1;
        window.labelStartNum = val;
        e.target.value = val;
        localStorage.setItem('tagger_labelStartNum', window.labelStartNum);
        window.refreshAllDisplayLabels();
    });

    labelDigitsSelect.addEventListener('change', (e) => {
        window.labelDigits = parseInt(e.target.value);
        localStorage.setItem('tagger_labelDigits', window.labelDigits);
        window.refreshAllDisplayLabels();
    });
}

// ================= ★ 新增：刪除音訊與匯出完整音訊事件 ★ =================

// 1. 綁定刪除音訊事件 (聲波圖右上角的「三個點」更多選單內)
document.getElementById('waveCutAudioBtn')?.addEventListener('click', () => {
    const waveMoreMenu = document.getElementById('waveMoreMenu');
    if (waveMoreMenu) waveMoreMenu.classList.remove('show');
    
    if (!tempRegion) {
        return showToast('請先用滑鼠在聲波圖上框選要刪除的範圍 (藍色框)', 'error');
    }
    
    showCustomDialog({
        title: '刪除音檔區段',
        message: `<span style="color:#C62828; font-weight:bold;">警告：此動作會修改原始音檔！</span><br><br>系統將會刪除您選取的這段聲音，並將後方所有的聲音與標記<strong style="color:#00897B;">自動往前平移遞補</strong>。<br><br>確定要執行嗎？`,
        onConfirm: () => {
            if (typeof cutAudioRegion === 'function') {
                cutAudioRegion(tempRegion.start, tempRegion.end);
            }
        }
    });
});

// 2. 綁定匯出完整音檔事件
document.getElementById('exportFullAudioBtn')?.addEventListener('click', () => {
    if (!audioPlayer || !audioPlayer.duration) return showToast('沒有可匯出的音檔', 'error');
    if (typeof downloadTimeRangeAudio === 'function') {
        // 利用既有的下載引擎，範圍設定為 0 到音檔總長度
        downloadTimeRangeAudio(0, audioPlayer.duration, "完整音檔");
    }
});

// ================= ★ 新增：一鍵錨點對齊與平移引擎 ★ =================
window.syncToPlayheadAndShift = function(label) {
    if (!audioPlayer || !audioPlayer.src) return showToast('請先載入音檔', 'error');
    if (!timeDataMap[label]) return showToast('此句尚未標記時間', 'error');

    // 1. 取得目標游標時間與原始時間，計算誤差值 (Offset)
    const currentTime = audioPlayer.currentTime;
    const originalStart = typeof timeDataMap[label] === 'object' ? timeDataMap[label].start : timeDataMap[label];
    const offset = currentTime - originalStart;

    if (Math.abs(offset) < 0.005) return showToast('游標與標記時間幾乎相同，無需平移', 'normal');

    const offsetSec = parseFloat(offset.toFixed(3));

    // 2. 彈出確認視窗，讓使用者知道即將平移多少時間
    showCustomDialog({
        title: '對齊游標並平移後續',
        message: `將以此句為基準，自動與目前的游標時間對齊。<br><br>計算出的時間差為：<strong style="color:#00897B;">${offsetSec > 0 ? '+' : ''}${offsetSec} 秒</strong><br><br>此句與<strong style="color:#C62828;">後方所有的時間標記</strong>都會同步平移此秒數。確定執行嗎？`,
        onConfirm: () => {
            if (typeof saveState === 'function') saveState(); // 紀錄 Undo 狀態

            const startIndex = allLabelsOrdered.indexOf(label);
            let modifiedCount = 0;

            // 3. 骨牌式平移：更新該句與後面所有句子的時間
            for (let i = startIndex; i < allLabelsOrdered.length; i++) {
                const curLabel = allLabelsOrdered[i];
                if (timeDataMap[curLabel] !== undefined) {
                    let newStart = (typeof timeDataMap[curLabel] === 'object' ? timeDataMap[curLabel].start : timeDataMap[curLabel]) + offset;
                    if (newStart < 0) newStart = 0; 
                    
                    let newEnd = (typeof timeDataMap[curLabel] === 'object' && timeDataMap[curLabel].end !== null) 
                        ? Math.max(0, timeDataMap[curLabel].end + offset) 
                        : null;
                    
                    timeDataMap[curLabel] = { 
                        start: parseFloat(newStart.toFixed(3)), 
                        end: newEnd !== null ? parseFloat(newEnd.toFixed(3)) : null 
                    };
                    modifiedCount++;
                }
            }

            // 4. 存檔並重繪畫面
            saveToStorage();
            if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
            if (typeof renderAllRegions === 'function') renderAllRegions();
            showToast(`成功對齊！共平移了 ${modifiedCount} 句`, 'success');
        }
    });
};
