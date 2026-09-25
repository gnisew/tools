// ================= 4d_ui_settings.js: 自動斷句/縮放/AI語言/時間精度/播放速度/循環播放等設定面板事件 =================
// 本檔案由 4_ui_events.js 拆分而來（原始第 1651-2131 行），內容未經改寫，僅搬移。
// 依賴：1_globals.js 中定義的 DOM 參照與全域狀態變數，需在此檔之前載入。

// ================= 自動斷句 Modal 設定與記憶 =================
function initAutoSegmentSetting(inputId, displayId, storageKey, formatFn) {
    const inputEl = document.getElementById(inputId);
    const displayEl = displayId ? document.getElementById(displayId) : null;
    if (!inputEl) return;

    // 1. 網頁載入時，先讀取暫存的設定
    const savedValue = localStorage.getItem(storageKey);
    if (savedValue !== null) {
        inputEl.value = savedValue;
    }

    // 2. 初始化畫面上的文字顯示
    if (displayEl && formatFn) {
        displayEl.textContent = formatFn(inputEl.value);
    }

    // 3. 監聽使用者操作：滑動時即時更新畫面，並存入 localStorage
    inputEl.addEventListener('input', (e) => {
        if (displayEl && formatFn) displayEl.textContent = formatFn(e.target.value);
        localStorage.setItem(storageKey, e.target.value);
    });
}

// ================= ★ 新增：「新增標記時是否新增列表」設定 ★ =================
// 三種操作各自一個開關，預設都是「新增列表」（適合一邊聽一邊打字）。
// 取消勾選時，只把時間套用到既有的列（適合文字已經分好句子、只是來對時間）。
//   tag     = 新增聲波標記 (Enter)
//   split   = 在游標處切割
//   segment = 選取範圍依靜音／等長自動斷句
const ADD_ROW_SETTINGS = {
    tag:     { id: 'addRowOnTagCheck',     key: 'tagger_addRowOnTag' },
    split:   { id: 'addRowOnSplitCheck',   key: 'tagger_addRowOnSplit' },
    segment: { id: 'addRowOnSegmentCheck', key: 'tagger_addRowOnSegment' }
};

// 其他檔案（2_audio_engine.js、3_data_core.js、4c_ui_scroll.js）在執行當下呼叫，直接讀 localStorage；
// 沒設定過（null）視為「新增列表」。
window.isAddRowEnabled = function(kind) {
    const cfg = ADD_ROW_SETTINGS[kind];
    if (!cfg) return true;
    return localStorage.getItem(cfg.key) !== 'false';
};

Object.values(ADD_ROW_SETTINGS).forEach(cfg => {
    const el = document.getElementById(cfg.id);
    if (!el) return;
    el.checked = localStorage.getItem(cfg.key) !== 'false';
    el.addEventListener('change', (e) => {
        localStorage.setItem(cfg.key, e.target.checked ? 'true' : 'false');
    });
});

// ================= ★ 新增：「Tab 跳句時是否自動播放」設定 ★ =================
// 預設不勾選（不自動播放）。適用 Tab / Shift+Tab，以及自訂的「上一句／下一句」快速鍵（都走 jumpToRegion）。
const TAB_AUTOPLAY_KEY = 'tagger_tabAutoPlay';
window.isTabAutoPlayEnabled = function() {
    return localStorage.getItem(TAB_AUTOPLAY_KEY) === 'true'; // 沒設定過 = 不自動播放
};
const tabAutoPlayCheck = document.getElementById('tabAutoPlayCheck');
if (tabAutoPlayCheck) {
    tabAutoPlayCheck.checked = window.isTabAutoPlayEnabled();
    tabAutoPlayCheck.addEventListener('change', (e) => {
        localStorage.setItem(TAB_AUTOPLAY_KEY, e.target.checked ? 'true' : 'false');
    });
}

// ================= ★ 新增：匯出音檔的檔名規則 ★ =================
// 組成順序固定為：前綴 → 標題 → 編號 → 列標文字 → 後綴，勾選的項目之間用「中綴」（預設 "_"）隔開。
//   編號 = 列表上顯示的編號（預設 A01 這類 ABC 段落編號；若設為連續編號則是 001、002…）
//   預設：標題 ✗、編號 ✓、列標文字 ✓、前綴 ✗、中綴 ✓（"_"）、後綴 ✗  → 例如 A01_今天天氣很好.wav
//   這與舊版的檔名規則相同（舊版固定是「編號_文字」）。
const AUDIO_NAME_KEY = 'tagger_audioNameRule';
const AUDIO_NAME_DEFAULT = {
    title: false, number: true, text: true,
    prefixOn: false, prefix: '',
    infixOn: true, infix: '_',
    suffixOn: false, suffix: '',
    removePunct: false // 移除標點：只套用於「標題」與「列標文字」（前綴、後綴、中綴是你自己輸入的，編號是系統產生的，都不處理）
};
const AUDIO_NAME_CONTROLS = {
    title: 'audioNameTitleCheck', number: 'audioNameNumberCheck', text: 'audioNameTextCheck',
    prefixOn: 'audioNamePrefixCheck', prefix: 'audioNamePrefixInput',
    infixOn: 'audioNameInfixCheck', infix: 'audioNameInfixInput',
    suffixOn: 'audioNameSuffixCheck', suffix: 'audioNameSuffixInput',
    removePunct: 'audioNameRemovePunctCheck'
};

window.getAudioNameRule = function() {
    try {
        return { ...AUDIO_NAME_DEFAULT, ...JSON.parse(localStorage.getItem(AUDIO_NAME_KEY) || '{}') };
    } catch (e) {
        return { ...AUDIO_NAME_DEFAULT };
    }
};

// 依規則把各部分組成檔名（不含副檔名）。parts = { title, number, text }
window.composeAudioName = function(parts, rule) {
    rule = rule || window.getAudioNameRule();
    const seq = [];
    const push = (value, maxLen) => {
        const clean = sanitizeFilename(String(value == null ? '' : value)).substring(0, maxLen).trim();
        if (clean) seq.push(clean);
    };
    if (rule.prefixOn) push(rule.prefix, 30);
    // 移除標點要在「截斷長度」之前處理，才不會把標點也算進 30 字的額度
    const strip = (v) => (rule.removePunct && typeof removePunctuationFromText === 'function') ? removePunctuationFromText(String(v == null ? '' : v)) : v;
    if (rule.title)    push(strip(parts.title), 50);
    if (rule.number)   push(parts.number, 30);
    if (rule.text)     push(strip(parts.text), 30);
    if (rule.suffixOn) push(rule.suffix, 30);
    const sep = rule.infixOn ? String(rule.infix == null ? '' : rule.infix).replace(/[\\/:*?"<>|]/g, '_') : '';
    return seq.join(sep);
};

// 取得某一句匯出時的檔名（不含副檔名）。全部項目都沒勾或內容皆為空白時，退回內部標籤，避免檔名變成空白
window.buildAudioExportBaseName = function(label) {
    const title = (localStorage.getItem('tagger_projectTitle') || document.getElementById('mainTitleDisplay')?.textContent || '').trim();
    const number = typeof window.getDisplayLabel === 'function' ? window.getDisplayLabel(label) : label;
    const text = (typeof sentenceTextMap !== 'undefined' && sentenceTextMap[label]) || '';
    const name = window.composeAudioName({ title, number, text });
    return name || sanitizeFilename(String(label));
};

// 設定面板：讀寫與即時預覽
function saveAudioNameRule() {
    const rule = {};
    Object.entries(AUDIO_NAME_CONTROLS).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (!el) { rule[key] = AUDIO_NAME_DEFAULT[key]; return; }
        rule[key] = el.type === 'checkbox' ? el.checked : el.value;
    });
    localStorage.setItem(AUDIO_NAME_KEY, JSON.stringify(rule));
}

function refreshAudioNamePreview() {
    const rule = window.getAudioNameRule();
    // 沒勾選的項目，其輸入框反灰
    [['prefixOn', 'audioNamePrefixInput'], ['infixOn', 'audioNameInfixInput'], ['suffixOn', 'audioNameSuffixInput']].forEach(([flag, id]) => {
        const input = document.getElementById(id);
        if (input) input.disabled = !rule[flag];
    });

    const previewEl = document.getElementById('audioNamePreview');
    if (!previewEl) return;
    const ext = document.getElementById('exportAudioFormatSelect')?.value === 'mp3' ? '.mp3' : '.wav';
    let name;
    if (typeof allLabelsOrdered !== 'undefined' && allLabelsOrdered.length > 0) {
        name = window.buildAudioExportBaseName(allLabelsOrdered[0]); // 用第一句當範例
    } else {
        name = window.composeAudioName({ title: '專案標題', number: 'A01', text: '範例，句子。' }, rule) || 'A01';
    }
    previewEl.textContent = name + ext;
}

Object.entries(AUDIO_NAME_CONTROLS).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const rule = window.getAudioNameRule();
    if (el.type === 'checkbox') el.checked = !!rule[key]; else el.value = rule[key];
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => {
        saveAudioNameRule();
        refreshAudioNamePreview();
    });
});
document.getElementById('exportAudioFormatSelect')?.addEventListener('change', refreshAudioNamePreview);
document.getElementById('labelDisplayModeSelect')?.addEventListener('change', () => setTimeout(refreshAudioNamePreview, 0));
refreshAudioNamePreview();

// 綁定「依靜音斷句」的四個滑桿
initAutoSegmentSetting('asThreshold', 'asThresholdVal', 'tagger_asThreshold', v => `(${v}%)`);
initAutoSegmentSetting('asDetectionMode', null, 'tagger_asDetectionMode', null); // ★ 新增：偵測模式（Peak/RMS），預設 peak 與舊行為完全相同
initAutoSegmentSetting('asSilence', 'asSilenceVal', 'tagger_asSilence', v => `(${parseFloat(v).toFixed(1)} 秒)`);
initAutoSegmentSetting('asMinSegment', 'asMinSegmentVal', 'tagger_asMinSegment', v => `(${parseFloat(v).toFixed(1)} 秒)`);
initAutoSegmentSetting('asPadding', 'asPaddingVal', 'tagger_asPadding', v => `(${parseFloat(v).toFixed(1)} 秒)`);

// 順便綁定「依等長時間」的兩個輸入框
initAutoSegmentSetting('asFixedTimeMinutes', null, 'tagger_asFixedTimeMinutes', null);
initAutoSegmentSetting('asFixedTimeSeconds', null, 'tagger_asFixedTimeSeconds', null);

// 1. 全域自動斷句 (左側清單按鈕)
autoSegmentBtn?.addEventListener('click', () => { 
    if (typeof wavesurfer === 'undefined' || !wavesurfer || !wavesurfer.getDecodedData()) {
        return showToast('請先載入音檔並等待分析完成', 'error'); 
    }
    targetAutoSegmentRange = null; // 設定為全域模式
    asModal?.classList.add('show'); 
});

// 2. ★ 修改：「依靜音斷句」按鈕 —— 只針對「選取的範圍」斷句，不會每次都處理整首音檔
//    (a) 有選取現有標記 → 只重新斷句這些標記涵蓋的範圍
//    (b) 有藍色選取框   → 只斷句這個框選範圍（不論音檔上有沒有標記）
//    (c) 什麼都沒選：
//        - 音檔上「完全沒有時間標記」→ 才會自動全選整首音檔
//        - 音檔上「已有標記」        → 不會自動全選（按鈕停用，需先選取範圍）
autoSegmentRegionBtn?.addEventListener('click', () => {
    if (!isEditMode) return;

    // 按鈕被停用時（例如：音檔已有標記、卻沒有選取任何範圍）阻擋點擊
    if (autoSegmentRegionBtn.disabled) return;

    const hasMarkerSelection = typeof selectedLabels !== 'undefined' && selectedLabels.length > 0;
    const hasBlueBox = typeof tempRegion !== 'undefined' && tempRegion;

    // 【狀況 A】沒有選取任何範圍，且音檔上完全沒有時間標記：自動「全選」整首音檔
    if (!hasMarkerSelection && !hasBlueBox && !hasAnyTimeMarker()) {
        if (typeof wavesurfer === 'undefined' || !wavesurfer || !audioPlayer || !audioPlayer.duration) {
            return showToast('請先載入音檔', 'error');
        }

        // 建立一個涵蓋全音檔的藍色選取框作為視覺提示
        if (typeof clearSelection === 'function') clearSelection();
        if (typeof wsRegions !== 'undefined' && wsRegions) {
            tempRegion = wsRegions.addRegion({
                start: 0,
                end: audioPlayer.duration,
                color: 'rgba(33, 150, 243, 0.3)',
                drag: true,
                resize: true
            });
        }

        if (allLabelsOrdered.length === 0) {
            // 列表也是空的：走全域引擎，從零建立句子列（與過去行為相同）
            targetAutoSegmentRange = null;
        } else {
            // 已有句子列（只是還沒打時間）：改用「整首音檔範圍」的局部模式，
            // 只把時間套到尚未標記的句子上，絕不會清掉既有的句子文字。
            targetAutoSegmentRange = { start: 0, end: audioPlayer.duration, labelsToClear: [] };
        }

        if (typeof asModal !== 'undefined' && asModal) asModal.classList.add('show');
        if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
        return; // 結束執行
    }

    // 【狀況 B】處理「選取現有標記」
    if (hasMarkerSelection) {
        let minStart = Infinity;
        let maxEnd = 0;
        const validLabels = [];

        selectedLabels.forEach(label => {
            if (timeDataMap[label]) {
                const times = typeof getCalculatedTimes === 'function' ? getCalculatedTimes(label) : null;
                if (times) {
                    minStart = Math.min(minStart, times.start);
                    maxEnd = Math.max(maxEnd, times.end);
                    validLabels.push(label);
                }
            }
        });

        if (validLabels.length > 0) {
            targetAutoSegmentRange = { start: minStart, end: maxEnd, labelsToClear: validLabels };
            if (typeof asModal !== 'undefined' && asModal) asModal.classList.add('show');
        } else {
            showToast('選取的標記沒有時間資料', 'error');
        }

    // 【狀況 C】處理單純的「藍色選取框」：只斷句框選的範圍
    } else if (hasBlueBox) {
        targetAutoSegmentRange = { start: tempRegion.start, end: tempRegion.end, labelsToClear: [] };
        if (typeof asModal !== 'undefined' && asModal) asModal.classList.add('show');
    } else {
        // 音檔上已有標記、又沒選任何範圍：不會自動全選
        showToast('請先選取要斷句的範圍', 'error');
    }
});

asCancelBtn?.addEventListener('click', () => asModal?.classList.remove('show'));

// ================= 自動斷句 Modal 雙頁籤與按鈕事件 =================
const tabAutoSilence = document.getElementById('tabAutoSilence');
const tabAutoTime = document.getElementById('tabAutoTime');
const sectionAutoSilence = document.getElementById('sectionAutoSilence');
const sectionAutoTime = document.getElementById('sectionAutoTime');

// 頁籤切換動畫與顯示邏輯
tabAutoSilence?.addEventListener('click', () => {
    tabAutoSilence.style.background = 'white'; tabAutoSilence.style.color = '#1976D2'; tabAutoSilence.style.borderBottom = '3px solid #1976D2';
    tabAutoTime.style.background = 'transparent'; tabAutoTime.style.color = '#666'; tabAutoTime.style.borderBottom = '3px solid transparent';
    tabAutoSilence.setAttribute('aria-selected', 'true'); tabAutoTime.setAttribute('aria-selected', 'false');
    sectionAutoSilence.style.display = 'block'; sectionAutoTime.style.display = 'none';
});

tabAutoTime?.addEventListener('click', () => {
    tabAutoTime.style.background = 'white'; tabAutoTime.style.color = '#1976D2'; tabAutoTime.style.borderBottom = '3px solid #1976D2';
    tabAutoSilence.style.background = 'transparent'; tabAutoSilence.style.color = '#666'; tabAutoSilence.style.borderBottom = '3px solid transparent';
    tabAutoTime.setAttribute('aria-selected', 'true'); tabAutoSilence.setAttribute('aria-selected', 'false');
    sectionAutoTime.style.display = 'block'; sectionAutoSilence.style.display = 'none';
});

// 3. 執行分析 (分流：靜音引擎 vs 等長時間引擎)
asConfirmBtn?.addEventListener('click', () => { 
    asModal?.classList.remove('show'); 
    
    // 檢查目前在哪個頁籤
    const isTimeMode = sectionAutoTime && sectionAutoTime.style.display !== 'none';
    
    if (targetAutoSegmentRange) {
        if (typeof saveState === 'function') saveState(); // 紀錄狀態以便反悔

        // 若是針對現有標記重新斷句，先清除它們的時間(釋放空間)避免重疊！
        if (targetAutoSegmentRange.labelsToClear && targetAutoSegmentRange.labelsToClear.length > 0) {
            targetAutoSegmentRange.labelsToClear.forEach(label => {
                if (timeDataMap[label]) delete timeDataMap[label];
            });
            if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
            if (typeof clearSelection === 'function') clearSelection();
        }

        // 分流：呼叫對應的局部斷句引擎
        if (isTimeMode) {
            if (typeof performTimeSegmentation === 'function') performTimeSegmentation(targetAutoSegmentRange);
        } else {
            if (typeof performRegionAutoSegmentation === 'function') {
                performRegionAutoSegmentation(targetAutoSegmentRange.start, targetAutoSegmentRange.end);
            }
        }
    } else {
        // 分流：呼叫對應的全域斷句引擎
        if (typeof saveState === 'function') saveState(); 
        if (isTimeMode) {
            if (typeof performTimeSegmentation === 'function') performTimeSegmentation(null);
        } else {
            if (typeof performAutoSegmentation === 'function') performAutoSegmentation(); 
        }
    }
});


// 頁面載入核心初始化
window.addEventListener('DOMContentLoaded', () => { 
    if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay();
    if(typeof loadFromStorage === 'function') loadFromStorage(); 
    if(typeof updateStickyOffsets === 'function') setTimeout(updateStickyOffsets, 500); 
});


// ================= 收納式縮放選單控制  =================
const zoomMenuToggleBtn = document.getElementById('zoomMenuToggleBtn');
const zoomMenu = document.getElementById('zoomMenu');

zoomMenuToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation(); // 防止觸發 document 點擊事件
    zoomMenu.classList.toggle('show');
    // 關閉其他可能開啟的選單
    sortMenu?.classList.remove('show');
});

// 防止在拉動滑桿或點擊選單內部時，選單意外關閉
zoomMenu?.addEventListener('click', (e) => {
    e.stopPropagation(); 
});



waveMoreBtn?.addEventListener('click', (e) => {
    e.stopPropagation(); 
    
    // 1. 智慧偵測：計算按鈕距離視窗底部的距離
    const rect = waveMoreBtn.getBoundingClientRect();
    
    // 如果距離底部小於 260px (空間不足)，就往上展開
    if (window.innerHeight - rect.bottom < 260) {
        waveMoreMenu.style.top = 'auto';
        waveMoreMenu.style.bottom = '100%';
        waveMoreMenu.style.marginTop = '0';
        waveMoreMenu.style.marginBottom = '8px';
    } else {
        // 否則預設往下展開
        waveMoreMenu.style.top = '100%';
        waveMoreMenu.style.bottom = 'auto';
        waveMoreMenu.style.marginTop = '8px';
        waveMoreMenu.style.marginBottom = '0';
    }

    // 2. 切換顯示狀態
    waveMoreMenu.classList.toggle('show');
    
    // 3. 開啟時，確保關閉其他相鄰的選單，保持畫面乾淨
    const zoomMenu = document.getElementById('zoomMenu');
    if (zoomMenu) zoomMenu.classList.remove('show');
    const speedMenu = document.getElementById('speedMenu');
    if (speedMenu) speedMenu.classList.remove('show');
});

// 防止點擊選單內部時意外關閉 (除非點擊的是執行按鈕)
waveMoreMenu?.addEventListener('click', (e) => {
    e.stopPropagation(); 
});

// ================= ★ 新增：AI 辨識語言設定事件 ★ =================
const transcribeLangSelect = document.getElementById('transcribeLangSelect');

if (transcribeLangSelect) {
    // 網頁載入時，從暫存讀取上一次設定的語言 (預設為 zh-TW)
    const savedLang = localStorage.getItem('tagger_aiLanguage') || 'zh-TW';
    transcribeLangSelect.value = savedLang;
    
    // 當使用者切換選單時
    transcribeLangSelect.addEventListener('change', (e) => {
        const selectedLang = e.target.value;
        localStorage.setItem('tagger_aiLanguage', selectedLang); // 記住設定
        
        let langName = '繁體中文';
        if (selectedLang === 'en') langName = '英文';
        if (selectedLang === 'ja') langName = '日文';
        
        showToast(`AI 辨識語言已切換為：${langName}`, 'success');
    });
}

// ================= ★ 新增：多語言字幕 - 啟用開關 =================
// 預設不啟用；勾選後才能修改下方的分隔字元。停用時分隔字元輸入框反灰鎖住，
// 避免使用者誤以為隨時都能切換分隔字元（切換分隔字元不會轉換舊資料，見 1c_languages.js 的風險提醒）。
const langMultiEnableCheck = document.getElementById('langMultiEnableCheck');

function applyLangMultiEnabledUI(enabled) {
    const delimiterInputEl = document.getElementById('langDelimiterInput');
    if (delimiterInputEl) delimiterInputEl.disabled = !enabled;
    if (typeof updateLangViewMenuLabels === 'function') updateLangViewMenuLabels();
}

if (langMultiEnableCheck) {
    const enabled = (typeof getLangMultiEnabled === 'function') ? getLangMultiEnabled() : false;
    langMultiEnableCheck.checked = enabled;
    applyLangMultiEnabledUI(enabled);

    langMultiEnableCheck.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        if (typeof setLangMultiEnabled === 'function') setLangMultiEnabled(isEnabled);
        applyLangMultiEnabledUI(isEnabled);

        showToast(isEnabled ? '已啟用多語字幕' : '已停用多語字幕（每行文字視為單一語言）', isEnabled ? 'success' : 'normal');

        // 開關切換後，畫面需要依「切割 / 不切割」重新渲染，才會立刻反映新狀態
        if (typeof renderSentenceList === 'function') renderSentenceList();
        if (typeof isScriptMode !== 'undefined' && isScriptMode && typeof populateScriptEditor === 'function') {
            populateScriptEditor();
        }
    });
}

// ================= ★ 新增：多語言字幕 - 分隔字元與語言名稱設定 =================
const langDelimiterInput = document.getElementById('langDelimiterInput');
if (langDelimiterInput) {
    // 進入網頁時，先同步輸入框目前的分隔字元
    langDelimiterInput.value = (typeof getLangDelimiter === 'function') ? getLangDelimiter() : '\\';

    langDelimiterInput.addEventListener('change', (e) => {
        const newDelim = (typeof setLangDelimiter === 'function') ? setLangDelimiter(e.target.value) : e.target.value;
        e.target.value = newDelim; // 若輸入空白，setLangDelimiter 會自動還原成預設值 \，這裡同步畫面

        showToast(`語言分隔字元已更新為：${newDelim}`, 'success');

        // 分隔字元改變後：偵測到的語言數量、語言檢視選單、畫面上的分語言檢視都要用新字元重算一次
        if (typeof updateLangViewMenuLabels === 'function') updateLangViewMenuLabels();
        if (typeof renderSentenceList === 'function') renderSentenceList();
        if (typeof isScriptMode !== 'undefined' && isScriptMode && typeof populateScriptEditor === 'function') {
            populateScriptEditor();
        }
    });
}

// ================= 時間顯示精確度設定事件  =================
const timeDecimalSelect = document.getElementById('timeDecimalSelect');

if (timeDecimalSelect) {
    // 進入網頁時，先同步下拉選單的值
    timeDecimalSelect.value = timeDecimalPlaces;
    
    // 當使用者改變選項時
    timeDecimalSelect.addEventListener('change', (e) => {
        timeDecimalPlaces = parseInt(e.target.value);
        localStorage.setItem('tagger_timeDecimals', timeDecimalPlaces); // 記住設定
        
        // 重新渲染畫面上的所有時間
        if(typeof updateAllTimeDisplays === 'function') {
            updateAllTimeDisplays();
        }
        showToast(`時間顯示已更改為小數點後 ${timeDecimalPlaces} 位`, 'success');
    });
}


// ================= 播放速度選單控制 =================
const speedMenuToggleBtn = document.getElementById('speedMenuToggleBtn');
const speedMenu = document.getElementById('speedMenu');
const speedDisplay = document.getElementById('speedDisplay');

speedMenuToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation(); 
    
    // 智慧偵測：計算按鈕距離視窗底部的距離
    const rect = speedMenuToggleBtn.getBoundingClientRect();
    
    // 如果距離底部小於 220px (空間不足)，就往上展開
    if (window.innerHeight - rect.bottom < 220) {
        speedMenu.style.top = 'auto';
        speedMenu.style.bottom = '100%';
        speedMenu.style.marginTop = '0';
        speedMenu.style.marginBottom = '8px';
    } else {
        // 否則預設往下展開
        speedMenu.style.top = '100%';
        speedMenu.style.bottom = 'auto';
        speedMenu.style.marginTop = '8px';
        speedMenu.style.marginBottom = '0';
    }

    speedMenu.classList.toggle('show');
    
    // 開啟速度選單時，自動關閉縮放選單以防畫面雜亂
    const zoomMenu = document.getElementById('zoomMenu');
    if (zoomMenu) zoomMenu.classList.remove('show');
});

// 綁定所有速度選項的點擊事件
document.querySelectorAll('.speed-item').forEach(item => {
    item.addEventListener('click', (e) => {
        const speed = e.target.getAttribute('data-speed');
        if (speedDisplay) speedDisplay.textContent = speed + 'x';
        speedMenu.classList.remove('show');
        
        // 呼叫 6_wave_controller.js 中的更新函式套用速度
        if(typeof applyCurrentPlaybackSpeed === 'function') {
            applyCurrentPlaybackSpeed();
        }
        showToast(`播放速度已切換為 ${speed}x`, 'success');
    });
});

// ================= 手動恢復標記按鈕事件  =================
restoreTagsBtn?.addEventListener('click', () => {
    if(typeof saveState === 'function') saveState();
    
    // 強制從 localStorage 讀取最後一次的存檔
    const savedMap = localStorage.getItem('tagger_timeDataMap');
    if (savedMap) {
        try {
            timeDataMap = JSON.parse(savedMap);
            saveToStorage(); // 確保全域狀態同步
            
            // 強制畫面重新渲染
            if(typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
            if(typeof renderAllRegions === 'function') renderAllRegions();
            
            showToast('已成功從暫存恢復標記！', 'success');
        } catch (e) {
            showToast('還原失敗，存檔可能已損毀', 'error');
        }
    }
});


// ================= 新增：播放模式與側邊欄動態連動 =================
if (playbackModeSelect) {
    playbackModeSelect.value = playbackMode;
    
    // 定義動態顯示隱藏的邏輯
    const toggleContinuousSettings = () => {
        if (continuousSettingsBlock) {
            continuousSettingsBlock.style.display = playbackModeSelect.value === 'continuous' ? 'block' : 'none';
        }
    };
    toggleContinuousSettings(); // 載入時先執行一次

    playbackModeSelect.addEventListener('change', (e) => {
        playbackMode = e.target.value;
        localStorage.setItem('tagger_playbackMode', playbackMode);
        toggleContinuousSettings(); // 切換時自動隱藏/顯示
        showToast(`已切換為：${playbackMode === 'single' ? '單句/區段' : '連續'}播放模式`, 'success');
    });
}

// ================= 播放與跳轉設定事件 =================
if (continuousPlayModeSelect) {
    continuousPlayModeSelect.value = continuousPlayMode;
    continuousPlayModeSelect.addEventListener('change', (e) => {
        continuousPlayMode = e.target.value;
        localStorage.setItem('tagger_continuousPlayMode', continuousPlayMode);
        showToast('播放模式已更改', 'success');
    });
}

if (playPaddingInput) {
    playPaddingInput.value = playPadding;
    playPaddingInput.addEventListener('change', (e) => {
        playPadding = parseFloat(e.target.value) || 0;
        localStorage.setItem('tagger_playPadding', playPadding);
    });
}


// ================= 修改：聲波圖寬度專屬設定事件 =================
function applyAppWidth(width) {
    // 核心修改：不再修改 body，而是只改變聲波面板的變數
    const stickyPanel = document.getElementById('stickyPanel');
    if (stickyPanel) {
        stickyPanel.style.setProperty('--wave-width', width);
    }
    
    // 延遲 350 毫秒（等待 CSS 的動畫跑完），觸發重繪
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (typeof updateStickyOffsets === 'function') updateStickyOffsets();
    }, 350); 
}

// ================= ★ 新增：介面字體切換設定 ★ =================
// 對應 <link> 引入的兩套字體 CSS：
//   twhei.css  → 提供 twhei-s / TWHEI（顯示為「台灣黑體」）
//   tauhu-oo.css → 提供 tauhu-oo
// 「台灣楷體」「台灣宋體」目前沒有對應的網路字體檔，採用系統本機同名字型
// （若使用者電腦沒有安裝，會自動 fallback 到 tauhu-oo，不會整個排版壞掉）。
const FONT_FAMILY_MAP = {
    twhei: 'twhei-s, TWHEI, "台灣黑體", tauhu-oo, sans-serif',
    kai:   '"台灣楷體", tauhu-oo, serif',
    song:  '"台灣宋體", tauhu-oo, serif',
    tauhu: 'tauhu-oo, sans-serif'
};

function applyFontFamily(key) {
    const stack = FONT_FAMILY_MAP[key] || FONT_FAMILY_MAP.twhei;
    document.documentElement.style.setProperty('--main-font-family', stack);
}

// ★ 修正：appWidthSelect 原本在這裡跟下方「聲波圖高度與寬度設定事件」區塊
// 各綁了一份幾乎相同的 change 監聽器，切換寬度時 applyAppWidth() 與 toast
// 都會各觸發兩次。已整併，唯一保留的版本在本檔案下方（多了一道防呆判斷）。

// ================= 進階循環播放設定事件 =================
if (loopModeSelect) {
    loopModeSelect.value = loopMode;
    loopModeSelect.addEventListener('change', (e) => {
        loopMode = e.target.value;
        localStorage.setItem('tagger_loopMode', loopMode);
        currentLoopCounter = 0; // 更改設定時重置計數
        showToast('循環模式已更新', 'success');
    });
}

if (loopCountInput) {
    loopCountInput.value = loopCount;
    loopCountInput.addEventListener('change', (e) => {
        loopCount = parseInt(e.target.value) || 0;
        localStorage.setItem('tagger_loopCount', loopCount);
        currentLoopCounter = 0; // 更改設定時重置計數
    });
}

if (autoScrollModeSelect) {
    autoScrollModeSelect.value = autoScrollMode;
    autoScrollModeSelect.addEventListener('change', (e) => {
        autoScrollMode = e.target.value;
        localStorage.setItem('tagger_autoScrollMode', autoScrollMode);
        
        if (wavesurfer) {
            wavesurfer.setOptions({
                autoScroll: true,
                autoCenter: autoScrollMode === 'center' // 若選 center 則為 true，否則為 false
            });
        }
        showToast('波形跟隨模式已更新', 'success');
    });
}

// ================= ★ 修改：聲波圖高度與寬度設定事件 ★ =================
if (waveHeightSelect) {
    waveHeightSelect.value = currentWaveHeight;
    waveHeightSelect.addEventListener('change', (e) => {
        currentWaveHeight = parseInt(e.target.value);
        localStorage.setItem('tagger_waveHeight', currentWaveHeight);
        // ★ 即時動態改變 WaveSurfer 高度
        if (wavesurfer) {
            wavesurfer.setOptions({ height: currentWaveHeight });
        }
        showToast('聲波圖高度已更新', 'success');
    });
}

if (appWidthSelect) {
    appWidthSelect.value = currentAppWidth;
    if (!appWidthSelect.value) { appWidthSelect.value = '100%'; } // 終極防呆
    applyAppWidth(appWidthSelect.value);
    
    appWidthSelect.addEventListener('change', (e) => {
        currentAppWidth = e.target.value;
        localStorage.setItem('tagger_appWidth', currentAppWidth);
        applyAppWidth(currentAppWidth);
        showToast('聲波圖寬度已切換', 'success');
    });
}

// ================= ★ 新增：聲波工具列按鈕顯示設定 ★ =================
// 讓使用者自行勾選哪些按鈕要常駐顯示在聲波工具列（退2秒／進2秒／下載選取音檔 較少用；
// 取消選取 有時候需要，但原本只藏在 ⋮ 更多選單裡，這裡讓它也可以選擇常駐顯示）。
// 未勾選時按鈕只是隱藏，功能不受影響：退/進2秒、下載仍可從工具列拿掉的位置移除；
// 取消選取即使沒常駐，也依然能從 ⋮ 更多選單使用。
const TOOLBAR_BTN_VISIBILITY = {
    seek:     { checkId: 'toolbarShowSeekCheck',     targets: ['rewindBtn', 'forwardBtn'],   key: 'tagger_toolbarShowSeek',     defaultOn: true },
    download: { checkId: 'toolbarShowDownloadCheck', targets: ['downloadActiveRegionBtn'],   key: 'tagger_toolbarShowDownload', defaultOn: true },
    cancel:   { checkId: 'toolbarShowCancelCheck',   targets: ['cancelRegionBtn'],           key: 'tagger_toolbarShowCancel',   defaultOn: false }
};

function applyToolbarBtnVisibility(cfg) {
    const saved = localStorage.getItem(cfg.key);
    const isOn = saved === null ? cfg.defaultOn : saved === 'true';
    cfg.targets.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = isOn ? '' : 'none';
    });
    return isOn;
}

Object.values(TOOLBAR_BTN_VISIBILITY).forEach(cfg => {
    const isOn = applyToolbarBtnVisibility(cfg);
    const checkEl = document.getElementById(cfg.checkId);
    if (!checkEl) return;
    checkEl.checked = isOn;
    checkEl.addEventListener('change', (e) => {
        localStorage.setItem(cfg.key, e.target.checked ? 'true' : 'false');
        applyToolbarBtnVisibility(cfg);
    });
});

// 工具列常駐的「取消選取」按鈕：直接觸發 ⋮ 更多選單裡原本的 waveCancelSelectBtn，
// 兩者共用同一套取消選取邏輯，避免以後改了一處、忘了改另一處。
// 停用狀態（沒有任何選取時，由 1_globals.js 的 updateToolbarButtons() 控制）多一層防呆判斷。
document.getElementById('cancelRegionBtn')?.addEventListener('click', function() {
    if (this.disabled) return;
    document.getElementById('waveCancelSelectBtn')?.click();
});

// ★ 新增：介面字體切換事件
if (fontFamilySelect) {
    fontFamilySelect.value = currentFontFamily;
    applyFontFamily(currentFontFamily);

    fontFamilySelect.addEventListener('change', (e) => {
        currentFontFamily = e.target.value;
        localStorage.setItem('tagger_fontFamily', currentFontFamily);
        applyFontFamily(currentFontFamily);
        showToast('介面字體已切換', 'success');
    });
}


