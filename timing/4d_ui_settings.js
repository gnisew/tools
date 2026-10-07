// 4d_ui_settings.js: 自動斷句、縮放、AI語言、時間精度、播放速度、循環播放等設定面板事件
// 依賴：1_globals.js 的 DOM 參照與全域狀態變數，需先載入。

// ---------- 自動斷句設定與記憶 ----------
function initAutoSegmentSetting(inputId, displayId, storageKey, formatFn) {
    const inputEl = document.getElementById(inputId);
    const displayEl = displayId ? document.getElementById(displayId) : null;
    if (!inputEl) return;

    const savedValue = localStorage.getItem(storageKey);
    if (savedValue !== null) {
        inputEl.value = savedValue;
    }

    if (displayEl && formatFn) {
        displayEl.textContent = formatFn(inputEl.value);
    }

    inputEl.addEventListener('input', (e) => {
        if (displayEl && formatFn) displayEl.textContent = formatFn(e.target.value);
        localStorage.setItem(storageKey, e.target.value);
    });
}

// ---------- 新增標記時是否新增列表 ----------
// 預設皆為「新增列表」。取消勾選時只把時間套用到既有的列（適合文字已分好句、只對時間）。
//   tag = 新增聲波標記 (Enter)、split = 在游標處切割、segment = 選取範圍自動斷句
const ADD_ROW_SETTINGS = {
    tag:     { id: 'addRowOnTagCheck',     key: 'tagger_addRowOnTag' },
    split:   { id: 'addRowOnSplitCheck',   key: 'tagger_addRowOnSplit' },
    segment: { id: 'addRowOnSegmentCheck', key: 'tagger_addRowOnSegment' }
};

// 供 2_audio_engine.js、3_data_core.js、4c_ui_scroll.js 呼叫；沒設定過視為「新增列表」
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

// ---------- Tab 跳句時是否自動播放 ----------
// 預設不自動播放。適用 Tab / Shift+Tab 與自訂的上一句／下一句快速鍵（皆走 jumpToRegion）
const TAB_AUTOPLAY_KEY = 'tagger_tabAutoPlay';
window.isTabAutoPlayEnabled = function() {
    return localStorage.getItem(TAB_AUTOPLAY_KEY) === 'true';
};
const tabAutoPlayCheck = document.getElementById('tabAutoPlayCheck');
if (tabAutoPlayCheck) {
    tabAutoPlayCheck.checked = window.isTabAutoPlayEnabled();
    tabAutoPlayCheck.addEventListener('change', (e) => {
        localStorage.setItem(TAB_AUTOPLAY_KEY, e.target.checked ? 'true' : 'false');
    });
}

// ---------- 匯出音檔的檔名規則 ----------
// 組成順序固定：前綴 → 標題 → 編號 → 列標文字 → 後綴，勾選的項目以「中綴」隔開。
// 預設：編號 + 列標文字，中綴 "_"，例如 A01_今天天氣很好.wav（與舊版相同）
const AUDIO_NAME_KEY = 'tagger_audioNameRule';
const AUDIO_NAME_DEFAULT = {
    title: false, number: true, text: true,
    prefixOn: false, prefix: '',
    infixOn: true, infix: '_',
    suffixOn: false, suffix: '',
    removePunct: false // 只套用於標題與列標文字
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

// 依規則組成檔名（不含副檔名）。parts = { title, number, text }
window.composeAudioName = function(parts, rule) {
    rule = rule || window.getAudioNameRule();
    const seq = [];
    const push = (value, maxLen) => {
        const clean = sanitizeFilename(String(value == null ? '' : value)).substring(0, maxLen).trim();
        if (clean) seq.push(clean);
    };
    if (rule.prefixOn) push(rule.prefix, 30);
    // 移除標點須在截斷長度之前，標點才不會佔用字數額度
    const strip = (v) => (rule.removePunct && typeof removePunctuationFromText === 'function') ? removePunctuationFromText(String(v == null ? '' : v)) : v;
    if (rule.title)    push(strip(parts.title), 50);
    if (rule.number)   push(parts.number, 30);
    if (rule.text)     push(strip(parts.text), 30);
    if (rule.suffixOn) push(rule.suffix, 30);
    const sep = rule.infixOn ? String(rule.infix == null ? '' : rule.infix).replace(/[\\/:*?"<>|]/g, '_') : '';
    return seq.join(sep);
};

// 某一句匯出時的檔名（不含副檔名）。結果為空時退回內部標籤，避免檔名空白
window.buildAudioExportBaseName = function(label) {
    const title = (localStorage.getItem('tagger_projectTitle') || document.getElementById('mainTitleDisplay')?.textContent || '').trim();
    const number = typeof window.getDisplayLabel === 'function' ? window.getDisplayLabel(label) : label;
    const text = (typeof sentenceTextMap !== 'undefined' && sentenceTextMap[label]) || '';
    const name = window.composeAudioName({ title, number, text });
    return name || sanitizeFilename(String(label));
};

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
    [['prefixOn', 'audioNamePrefixInput'], ['infixOn', 'audioNameInfixInput'], ['suffixOn', 'audioNameSuffixInput']].forEach(([flag, id]) => {
        const input = document.getElementById(id);
        if (input) input.disabled = !rule[flag];
    });

    const previewEl = document.getElementById('audioNamePreview');
    if (!previewEl) return;
    const ext = document.getElementById('exportAudioFormatSelect')?.value === 'mp3' ? '.mp3' : '.wav';
    let name;
    if (typeof allLabelsOrdered !== 'undefined' && allLabelsOrdered.length > 0) {
        name = window.buildAudioExportBaseName(allLabelsOrdered[0]);
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

// ---------- 自動斷句參數 ----------
initAutoSegmentSetting('asThreshold', 'asThresholdVal', 'tagger_asThreshold', v => `${v}%`);
initAutoSegmentSetting('asDetectionMode', null, 'tagger_asDetectionMode', null);
initAutoSegmentSetting('asSilence', 'asSilenceVal', 'tagger_asSilence', v => `${parseFloat(v).toFixed(1)} 秒`);
initAutoSegmentSetting('asMinSegment', 'asMinSegmentVal', 'tagger_asMinSegment', v => `${parseFloat(v).toFixed(1)} 秒`);
initAutoSegmentSetting('asPadding', 'asPaddingVal', 'tagger_asPadding', v => `${parseFloat(v).toFixed(1)} 秒`);

initAutoSegmentSetting('asFixedTimeMinutes', null, 'tagger_asFixedTimeMinutes', null);
initAutoSegmentSetting('asFixedTimeSeconds', null, 'tagger_asFixedTimeSeconds', null);

// 智慧等長分割：勾選後才顯示尋找範圍滑桿
initAutoSegmentSetting('asSmartWindow', 'asSmartWindowVal', 'tagger_asSmartWindow', v => `${parseFloat(v).toFixed(1)} 秒`);
(function bindSmartTimeCheck() {
    const chk = document.getElementById('asSmartTimeCheck');
    const box = document.getElementById('asSmartWindowBox');
    if (!chk) return;
    chk.checked = localStorage.getItem('tagger_asSmartTime') === 'true';
    const sync = () => { if (box) box.style.display = chk.checked ? 'block' : 'none'; };
    chk.addEventListener('change', () => {
        localStorage.setItem('tagger_asSmartTime', chk.checked ? 'true' : 'false');
        sync();
    });
    sync();
})();

// 全域自動斷句（左側清單按鈕）
autoSegmentBtn?.addEventListener('click', () => {
    if (typeof wavesurfer === 'undefined' || !wavesurfer || !wavesurfer.getDecodedData()) {
        return showToast('請先載入音檔並等待分析完成', 'error');
    }
    targetAutoSegmentRange = null;
    asModal?.classList.add('show');
});

// 「依靜音斷句」只針對選取範圍：
//   A. 有選取標記 → 重新斷句這些標記涵蓋的範圍
//   B. 有藍色選取框 → 斷句框選範圍
//   C. 都沒選：音檔完全沒有標記才自動全選整首；已有標記則需先選取範圍
autoSegmentRegionBtn?.addEventListener('click', () => {
    if (!isEditMode) return;
    if (autoSegmentRegionBtn.disabled) return;

    const hasMarkerSelection = typeof selectedLabels !== 'undefined' && selectedLabels.length > 0;
    const hasBlueBox = typeof tempRegion !== 'undefined' && tempRegion;

    if (!hasMarkerSelection && !hasBlueBox && !hasAnyTimeMarker()) {
        if (typeof wavesurfer === 'undefined' || !wavesurfer || !audioPlayer || !audioPlayer.duration) {
            return showToast('請先載入音檔', 'error');
        }

        // 建立涵蓋全音檔的藍色選取框作為視覺提示
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
            // 列表為空：走全域引擎，從零建立句子列
            targetAutoSegmentRange = null;
        } else {
            // 已有句子列但沒有時間：用局部模式只套時間，不清掉既有文字
            targetAutoSegmentRange = { start: 0, end: audioPlayer.duration, labelsToClear: [] };
        }

        if (typeof asModal !== 'undefined' && asModal) asModal.classList.add('show');
        if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
        return;
    }

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

    } else if (hasBlueBox) {
        targetAutoSegmentRange = { start: tempRegion.start, end: tempRegion.end, labelsToClear: [] };
        if (typeof asModal !== 'undefined' && asModal) asModal.classList.add('show');
    } else {
        showToast('請先選取要斷句的範圍', 'error');
    }
});

// 檢查遺漏：用紅色暫時標記提示未被覆蓋卻疑似有聲音的空隙，不動既有時間資料
checkMissedBtn?.addEventListener('click', () => {
    if (typeof performMissedSegmentCheck === 'function') performMissedSegmentCheck();
});

asCancelBtn?.addEventListener('click', () => asModal?.classList.remove('show'));

// ---------- 自動斷句視窗頁籤 ----------
const tabAutoSilence = document.getElementById('tabAutoSilence');
const tabAutoTime = document.getElementById('tabAutoTime');
const sectionAutoSilence = document.getElementById('sectionAutoSilence');
const sectionAutoTime = document.getElementById('sectionAutoTime');

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

// 執行分析：依目前頁籤分流到靜音引擎或等長時間引擎
asConfirmBtn?.addEventListener('click', () => {
    asModal?.classList.remove('show');

    const isTimeMode = sectionAutoTime && sectionAutoTime.style.display !== 'none';

    if (targetAutoSegmentRange) {
        if (typeof saveState === 'function') saveState();
        if (typeof clearSelection === 'function') clearSelection();

        // 重新斷句現有標記前先清除其時間，避免重疊
        if (targetAutoSegmentRange.labelsToClear && targetAutoSegmentRange.labelsToClear.length > 0) {
            targetAutoSegmentRange.labelsToClear.forEach(label => {
                if (timeDataMap[label]) delete timeDataMap[label];
            });
            if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
            if (typeof clearSelection === 'function') clearSelection();
        }

        if (isTimeMode) {
            if (typeof performTimeSegmentation === 'function') performTimeSegmentation(targetAutoSegmentRange);
        } else {
            if (typeof performRegionAutoSegmentation === 'function') {
                performRegionAutoSegmentation(targetAutoSegmentRange.start, targetAutoSegmentRange.end);
            }
        }
    } else {
        if (typeof saveState === 'function') saveState();
        if (isTimeMode) {
            if (typeof performTimeSegmentation === 'function') performTimeSegmentation(null);
        } else {
            if (typeof performAutoSegmentation === 'function') performAutoSegmentation();
        }
    }
});

// 頁面載入初始化
window.addEventListener('DOMContentLoaded', () => {
    if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay();
    if(typeof loadFromStorage === 'function') loadFromStorage();
    if(typeof updateStickyOffsets === 'function') setTimeout(updateStickyOffsets, 500);
});

// ---------- 縮放與更多選單 ----------
const zoomMenuToggleBtn = document.getElementById('zoomMenuToggleBtn');
const zoomMenu = document.getElementById('zoomMenu');

zoomMenuToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    zoomMenu.classList.toggle('show');
    sortMenu?.classList.remove('show');
});

// 避免拉動滑桿或點擊選單內部時選單關閉
zoomMenu?.addEventListener('click', (e) => {
    e.stopPropagation();
});

waveMoreBtn?.addEventListener('click', (e) => {
    e.stopPropagation();

    // 按鈕距視窗底部不足 260px 時往上展開
    const rect = waveMoreBtn.getBoundingClientRect();
    if (window.innerHeight - rect.bottom < 260) {
        waveMoreMenu.style.top = 'auto';
        waveMoreMenu.style.bottom = '100%';
        waveMoreMenu.style.marginTop = '0';
        waveMoreMenu.style.marginBottom = '8px';
    } else {
        waveMoreMenu.style.top = '100%';
        waveMoreMenu.style.bottom = 'auto';
        waveMoreMenu.style.marginTop = '8px';
        waveMoreMenu.style.marginBottom = '0';
    }

    waveMoreMenu.classList.toggle('show');

    const zoomMenu = document.getElementById('zoomMenu');
    if (zoomMenu) zoomMenu.classList.remove('show');
    const speedMenu = document.getElementById('speedMenu');
    if (speedMenu) speedMenu.classList.remove('show');
});

waveMoreMenu?.addEventListener('click', (e) => {
    e.stopPropagation();
});

// ---------- AI 辨識語言 ----------
const transcribeLangSelect = document.getElementById('transcribeLangSelect');

if (transcribeLangSelect) {
    const savedLang = localStorage.getItem('tagger_aiLanguage') || 'zh-TW';
    transcribeLangSelect.value = savedLang;

    transcribeLangSelect.addEventListener('change', (e) => {
        const selectedLang = e.target.value;
        localStorage.setItem('tagger_aiLanguage', selectedLang);

        let langName = '繁體中文';
        if (selectedLang === 'en') langName = '英文';
        if (selectedLang === 'ja') langName = '日文';

        showToast(`AI 辨識語言已切換為：${langName}`, 'success');
    });
}

// ---------- 多語言字幕：啟用開關 ----------
// 預設不啟用。停用時分隔字元輸入框鎖住（切換分隔字元不會轉換舊資料，見 1c_languages.js）
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

        // 切換後需重新渲染才會反映新狀態
        if (typeof renderSentenceList === 'function') renderSentenceList();
        if (typeof isScriptMode !== 'undefined' && isScriptMode && typeof populateScriptEditor === 'function') {
            populateScriptEditor();
        }
    });
}

// ---------- 多語言字幕：分隔字元 ----------
const langDelimiterInput = document.getElementById('langDelimiterInput');
if (langDelimiterInput) {
    langDelimiterInput.value = (typeof getLangDelimiter === 'function') ? getLangDelimiter() : '\\';

    langDelimiterInput.addEventListener('change', (e) => {
        const newDelim = (typeof setLangDelimiter === 'function') ? setLangDelimiter(e.target.value) : e.target.value;
        e.target.value = newDelim; // 輸入空白時 setLangDelimiter 會還原預設值，畫面需同步

        showToast(`語言分隔字元已更新為：${newDelim}`, 'success');

        if (typeof updateLangViewMenuLabels === 'function') updateLangViewMenuLabels();
        if (typeof renderSentenceList === 'function') renderSentenceList();
        if (typeof isScriptMode !== 'undefined' && isScriptMode && typeof populateScriptEditor === 'function') {
            populateScriptEditor();
        }
    });
}

// ---------- 時間顯示精確度 ----------
const timeDecimalSelect = document.getElementById('timeDecimalSelect');

if (timeDecimalSelect) {
    timeDecimalSelect.value = timeDecimalPlaces;

    timeDecimalSelect.addEventListener('change', (e) => {
        timeDecimalPlaces = parseInt(e.target.value);
        localStorage.setItem('tagger_timeDecimals', timeDecimalPlaces);

        if(typeof updateAllTimeDisplays === 'function') {
            updateAllTimeDisplays();
        }
        showToast(`時間顯示已更改為小數點後 ${timeDecimalPlaces} 位`, 'success');
    });
}

// ---------- 時間顯示格式與內容 ----------
// timeFormatMode: 'clock' = 00:00.0（預設）、'seconds' = 秒數
// timeContentMode: 'full' 完整（預設）、'range' 頭尾、'start' 開頭、'duration' 長度
let timeFormatMode = localStorage.getItem('tagger_timeFormat') === 'seconds' ? 'seconds' : 'clock';
let timeContentMode = ['full', 'range', 'start', 'duration'].includes(localStorage.getItem('tagger_timeContent'))
    ? localStorage.getItem('tagger_timeContent') : 'full';

function formatListTime(t) {
    const d = timeDecimalPlaces;
    if (timeFormatMode === 'seconds') return t.toFixed(d);
    const r = Number(t.toFixed(d)); // 先四捨五入，避免 59.96 顯示成 00:60.0
    const m = Math.floor(r / 60);
    const sec = (r - m * 60).toFixed(d).padStart(d > 0 ? d + 3 : 2, '0');
    return String(m).padStart(2, '0') + ':' + sec;
}

// 長度專用：未滿 60 秒省略分鐘（02.5），滿 60 秒用分:秒（01:02.5）
function formatListDuration(t) {
    if (timeFormatMode === 'seconds') return formatListTime(t);
    const d = timeDecimalPlaces;
    const r = Number(t.toFixed(d));
    if (r < 60) return r.toFixed(d).padStart(d > 0 ? d + 3 : 2, '0');
    return formatListTime(t);
}

[['timeFormatSelect', () => timeFormatMode, v => { timeFormatMode = v; localStorage.setItem('tagger_timeFormat', v); }],
 ['timeContentSelect', () => timeContentMode, v => { timeContentMode = v; localStorage.setItem('tagger_timeContent', v); }]
].forEach(([id, get, set]) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.value = get();
    sel.addEventListener('change', (e) => {
        set(e.target.value);
        if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
    });
});

// ---------- 播放速度選單 ----------
const speedMenuToggleBtn = document.getElementById('speedMenuToggleBtn');
const speedMenu = document.getElementById('speedMenu');
const speedDisplay = document.getElementById('speedDisplay');

speedMenuToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();

    // 按鈕距視窗底部不足 220px 時往上展開
    const rect = speedMenuToggleBtn.getBoundingClientRect();
    if (window.innerHeight - rect.bottom < 220) {
        speedMenu.style.top = 'auto';
        speedMenu.style.bottom = '100%';
        speedMenu.style.marginTop = '0';
        speedMenu.style.marginBottom = '8px';
    } else {
        speedMenu.style.top = '100%';
        speedMenu.style.bottom = 'auto';
        speedMenu.style.marginTop = '8px';
        speedMenu.style.marginBottom = '0';
    }

    speedMenu.classList.toggle('show');

    const zoomMenu = document.getElementById('zoomMenu');
    if (zoomMenu) zoomMenu.classList.remove('show');
});

document.querySelectorAll('.speed-item').forEach(item => {
    item.addEventListener('click', (e) => {
        const speed = e.target.getAttribute('data-speed');
        if (speedDisplay) speedDisplay.textContent = speed + 'x';
        speedMenu.classList.remove('show');

        // applyCurrentPlaybackSpeed 定義於 6_wave_controller.js
        if(typeof applyCurrentPlaybackSpeed === 'function') {
            applyCurrentPlaybackSpeed();
        }
        showToast(`播放速度已切換為 ${speed}x`, 'success');
    });
});

// ---------- 手動恢復標記 ----------
restoreTagsBtn?.addEventListener('click', () => {
    if(typeof saveState === 'function') saveState();

    const savedMap = localStorage.getItem('tagger_timeDataMap');
    if (savedMap) {
        try {
            timeDataMap = JSON.parse(savedMap);
            saveToStorage();

            if(typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
            if(typeof renderAllRegions === 'function') renderAllRegions();

            showToast('已成功從暫存恢復標記！', 'success');
        } catch (e) {
            showToast('還原失敗，存檔可能已損毀', 'error');
        }
    }
});

// ---------- 播放模式與側邊欄連動 ----------
if (playbackModeSelect) {
    playbackModeSelect.value = playbackMode;

    const toggleContinuousSettings = () => {
        if (continuousSettingsBlock) {
            continuousSettingsBlock.style.display = playbackModeSelect.value === 'continuous' ? 'block' : 'none';
        }
    };
    toggleContinuousSettings();

    playbackModeSelect.addEventListener('change', (e) => {
        playbackMode = e.target.value;
        localStorage.setItem('tagger_playbackMode', playbackMode);
        toggleContinuousSettings();
        showToast(`已切換為：${playbackMode === 'single' ? '單句/區段' : '連續'}播放模式`, 'success');
    });
}

// ---------- 播放與跳轉 ----------
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

// ---------- 聲波圖寬度 ----------
function applyAppWidth(width) {
    // 只改聲波面板的 CSS 變數，不動 body
    const stickyPanel = document.getElementById('stickyPanel');
    if (stickyPanel) {
        stickyPanel.style.setProperty('--wave-width', width);
    }

    // 等待 CSS 動畫（350ms）結束後再觸發重繪
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (typeof updateStickyOffsets === 'function') updateStickyOffsets();
    }, 350);
}

// ---------- 介面字體 ----------
// twhei.css 提供 twhei-s / TWHEI（台灣黑體），tauhu-oo.css 提供 tauhu-oo。
// 台灣楷體、台灣宋體沒有網路字體檔，使用系統本機同名字型，未安裝時退回 tauhu-oo。
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

// ---------- 循環播放與波形跟隨 ----------
if (loopModeSelect) {
    loopModeSelect.value = loopMode;
    loopModeSelect.addEventListener('change', (e) => {
        loopMode = e.target.value;
        localStorage.setItem('tagger_loopMode', loopMode);
        currentLoopCounter = 0;
        showToast('循環模式已更新', 'success');
    });
}

if (loopCountInput) {
    loopCountInput.value = loopCount;
    loopCountInput.addEventListener('change', (e) => {
        loopCount = parseInt(e.target.value) || 0;
        localStorage.setItem('tagger_loopCount', loopCount);
        currentLoopCounter = 0;
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
                autoCenter: autoScrollMode === 'center'
            });
        }
        showToast('波形跟隨模式已更新', 'success');
    });
}

// ---------- 聲波圖高度與寬度 ----------
if (waveHeightSelect) {
    waveHeightSelect.value = currentWaveHeight;
    waveHeightSelect.addEventListener('change', (e) => {
        currentWaveHeight = parseInt(e.target.value);
        localStorage.setItem('tagger_waveHeight', currentWaveHeight);
        if (wavesurfer) {
            wavesurfer.setOptions({ height: currentWaveHeight });
        }
        // 聲波面板高度改變後，列表標題與語言列的吸頂位置要跟著重算
        if (typeof updateStickyOffsets === 'function') setTimeout(updateStickyOffsets, 50);
        showToast('聲波圖高度已更新', 'success');
    });
}

// 聲波寬度循環按鈕（#waveWidthToggleBtn）與設定面板的 #appWidthSelect 共用同一份設定
// （currentAppWidth / tagger_appWidth），皆透過 setWaveWidth() 寫入
const WAVE_WIDTH_OPTIONS = [
    { value: '100%',   label: '預設' },
    { value: '1200px', label: '1200px' },
    { value: '100vw',  label: '全螢幕' }
];

function refreshWaveWidthUI() {
    const opt = WAVE_WIDTH_OPTIONS.find(o => o.value === currentAppWidth) || WAVE_WIDTH_OPTIONS[0];
    const label = document.getElementById('waveWidthToggleLabel');
    if (label) label.textContent = `聲波寬度 (${opt.label})`;
    if (appWidthSelect && appWidthSelect.value !== opt.value) appWidthSelect.value = opt.value;
}

function setWaveWidth(width) {
    currentAppWidth = width;
    localStorage.setItem('tagger_appWidth', currentAppWidth);
    applyAppWidth(currentAppWidth);
    refreshWaveWidthUI();
}

if (appWidthSelect) {
    appWidthSelect.value = currentAppWidth;
    if (!appWidthSelect.value) { appWidthSelect.value = '100%'; }
    applyAppWidth(appWidthSelect.value);

    appWidthSelect.addEventListener('change', (e) => {
        setWaveWidth(e.target.value);
        showToast('聲波圖寬度已切換', 'success');
    });
}
refreshWaveWidthUI();

// 選單本身的點擊已 stopPropagation，選單不會關閉，可連續點擊
document.getElementById('waveWidthToggleBtn')?.addEventListener('click', () => {
    const idx = WAVE_WIDTH_OPTIONS.findIndex(o => o.value === currentAppWidth);
    setWaveWidth(WAVE_WIDTH_OPTIONS[(idx + 1) % WAVE_WIDTH_OPTIONS.length].value);
});

// 編輯區寬度：與「檢視」選單的循環按鈕共用設定，統一透過 4b 的 setListWidth() 寫入
const listWidthSelect = document.getElementById('listWidthSelect');
if (listWidthSelect) {
    listWidthSelect.value = currentListWidth;
    if (!listWidthSelect.value) listWidthSelect.value = '100%';
    listWidthSelect.addEventListener('change', (e) => {
        if (typeof setListWidth === 'function') setListWidth(e.target.value);
        showToast('編輯區寬度已切換', 'success');
    });
}

// ---------- 聲波工具列按鈕顯示 ----------
// 未勾選只是隱藏，功能不受影響；取消選取即使不常駐，仍可從 ⋮ 更多選單使用
const TOOLBAR_BTN_VISIBILITY = {
    seek:     { checkId: 'toolbarShowSeekCheck',     targets: ['rewindBtn', 'forwardBtn'],   key: 'tagger_toolbarShowSeek',     defaultOn: false },
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

// 工具列的「取消選取」轉發到 ⋮ 選單的 waveCancelSelectBtn，兩者共用同一套邏輯。
// 停用狀態由 1_globals.js 的 updateToolbarButtons() 控制，這裡多一層防呆
document.getElementById('cancelRegionBtn')?.addEventListener('click', function() {
    if (this.disabled) return;
    document.getElementById('waveCancelSelectBtn')?.click();
});

// 介面字體切換
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
