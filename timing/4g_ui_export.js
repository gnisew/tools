// ===== 4g_ui_export.js: 模組化匯出引擎、單句/全文模式切換 =====
// 依賴：1_globals.js 的 DOM 參照與全域狀態變數，需先載入。

// ===== 模組化匯出引擎 =====
const openExportModalBtn = document.getElementById('openExportModalBtn');
const exportModalOverlay = document.getElementById('exportModalOverlay');
const closeExportModalBtn = document.getElementById('closeExportModalBtn');
const modalOutputArea = document.getElementById('modalOutputArea');
const exportTextFormatSelect = document.getElementById('exportTextFormatSelect');

// 開啟與關閉視窗（保留文字不清空，方便回頭複製）
openExportModalBtn?.addEventListener('click', () => {
    exportModalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden'; 
    populateExportLangSelect(); // 每次開啟視窗都重新檢查是否要顯示語言選單
});
closeExportModalBtn?.addEventListener('click', () => {
    exportModalOverlay.classList.remove('show');
    document.body.style.overflow = ''; 
});

// ===== 多語言字幕匯出語言選擇 =====
// 只有啟用「多語字幕」時才顯示此選單；未啟用時不影響匯出行為。
const exportLangSelectWrap = document.getElementById('exportLangSelectWrap');
const exportLangSelect = document.getElementById('exportLangSelect');

// 開啟匯出視窗時呼叫：依目前是否啟用多語字幕，決定要不要顯示選單，並動態產生語言選項
function populateExportLangSelect() {
    populateLangExportSelect(exportLangSelectWrap, exportLangSelect); // 共用邏輯在 1c_languages.js
}

// 依目前「匯出語言」選單的選擇，取出某一句實際要匯出的文字。
// 未啟用多語字幕、或選到「全部語言」時，回傳原始整串文字。
// 選到特定語言時：呼叫 1c_languages.js 的 getLang() 只取出該語言。
// 注意：JSON「專案」匯出（generateJSON）刻意不透過這個函式，因為 JSON 是完整專案備份，
//   必須保留所有語言的原始資料，才能之後重新匯入時還原多語言內容。
function getExportText(label) {
    return pickExportLang(sentenceTextMap[label] || '', exportLangSelect);
}

// 1. 各格式產生器 (Generators)
// TSV / SRT / Audacity 的字串格式統一由 1_globals.js 的 buildStandardToAny() 產生
// （與 9_batch_converter.js 共用）。這裡只負責組出標準 items 陣列與無資料時的提示。
function buildItemsFromCurrentProject(requireTime) {
    const labels = requireTime
        ? allLabelsOrdered.filter(lbl => timeDataMap[lbl] !== undefined)
        : allLabelsOrdered;
    return labels.map(label => {
        const times = getCalculatedTimes(label);
        return {
            label,
            start: times ? times.start : '',
            end: times ? times.end : null,
            text: getExportText(label) // 依匯出語言選單取值
        };
    });
}

function generateTSV() {
    if (allLabelsOrdered.length === 0) { showToast('目前沒有資料', 'error'); return ""; }
    return buildStandardToAny(buildItemsFromCurrentProject(false), 'tsv') || "";
}

function generateSRT() {
    const items = buildItemsFromCurrentProject(true).filter(item => item.end !== null);
    if (items.length === 0) { showToast('沒有時間標記', 'error'); return ""; }
    return buildStandardToAny(items, 'srt') || "";
}

function generateAudacity() {
    const items = buildItemsFromCurrentProject(true);
    if (items.length === 0) { showToast('沒有時間標記', 'error'); return ""; }
    return buildStandardToAny(items, 'audacity') || "";
}

function generateJSON() {
    const projectData = {
        version: "1.1", // 1.1 起包含 mediaGroups 欄位
        title: localStorage.getItem('tagger_projectTitle') || document.getElementById('mainTitleDisplay')?.textContent || "",
        audioUrl: localStorage.getItem('tagger_audioUrl') || "",
        localFileName: localStorage.getItem('tagger_localFileName') || "",
        rawText: document.getElementById('rawTextInput')?.value || "",
        allLabelsOrdered: allLabelsOrdered,
        sentenceTextMap: sentenceTextMap,
        timeDataMap: timeDataMap,
        // 記錄多語字幕開關與分隔字元，匯入時才能還原相同的顯示狀態
        settings: {
            currentParseMode: currentParseMode,
            currentSortMode: currentSortMode,
            langMultiEnabled: (typeof getLangMultiEnabled === 'function') ? getLangMultiEnabled() : false,
            langDelimiter: (typeof getLangDelimiter === 'function') ? getLangDelimiter() : '|'
        },
        // 跨句圖片群組；圖片為網址參照（imageUrl），換瀏覽器／電腦匯入也不會遺失縮圖
        mediaGroups: (typeof mediaGroups !== 'undefined' && Array.isArray(mediaGroups)) ? mediaGroups : []
    };
    return JSON.stringify(projectData, null, 2);
}

function getProjectFilename(ext) {
    const currentTitle = localStorage.getItem('tagger_projectTitle') || document.getElementById('mainTitleDisplay')?.textContent || "烏衣行打點專案";
    return `${currentTitle.trim()}.${ext}`;
}

function downloadExportFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// 上方直接下載按鈕
document.getElementById('exportTsvBtn')?.addEventListener('click', () => {
    const content = generateTSV();
    if(content) { downloadExportFile(content, getProjectFilename('tsv')); showToast('TSV 下載成功！', 'success'); }
});
document.getElementById('exportSrtBtn')?.addEventListener('click', () => {
    const content = generateSRT();
    if(content) { downloadExportFile(content, getProjectFilename('srt')); showToast('SRT 下載成功！', 'success'); }
});
document.getElementById('exportAudacityBtn')?.addEventListener('click', () => {
    const content = generateAudacity();
    if(content) { downloadExportFile(content, getProjectFilename('txt')); showToast('Audacity 標籤下載成功！', 'success'); }
});
document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
    const content = generateJSON();
    if(content) { downloadExportFile(content, getProjectFilename('json'), 'application/json'); showToast('JSON 專案下載成功！', 'success'); }
});
document.getElementById('exportAudioZipBtn')?.addEventListener('click', () => closeExportModalBtn.click());

// 下方產生純文字預覽
document.getElementById('exportTextBtn')?.addEventListener('click', () => {
    const format = exportTextFormatSelect.value;
    let result = "";

    if (format === 'tsv') result = generateTSV();
    else if (format === 'srt') result = generateSRT();
    else if (format === 'audacity') result = generateAudacity();
    else if (format === 'json') result = generateJSON();
    else {
        // 一般文字排版
        if (allLabelsOrdered.length === 0) return showToast('目前沒有任何句子！', 'error');
        let paragraphs = []; let currentLetter = ''; let currentPara = [];
        allLabelsOrdered.forEach(label => {
            const letter = label.charAt(0);
            if (letter !== currentLetter) { if (currentPara.length > 0) paragraphs.push(currentPara); currentLetter = letter; currentPara = []; }
            currentPara.push(label);
        });
        if (currentPara.length > 0) paragraphs.push(currentPara);

        // 文字取自 getExportText(label)，會依匯出語言選單取值
        if (format === 'para') result = paragraphs.map(para => para.map(label => getExportText(label)).join('')).join('\n');
        else if (format === 'para-slash-n') result = paragraphs.map(para => para.map(label => getExportText(label)).join('')).join('\\n');
        else if (format === 'sent-no-para') result = allLabelsOrdered.map(label => getExportText(label)).join('\n');
        else if (format === 'sent-empty-line') result = paragraphs.map(para => para.map(label => getExportText(label)).join('\n')).join('\n\n');
        else if (format === 'sent-hash') {
            const outLines = []; paragraphs.forEach(para => { outLines.push('######'); para.forEach(label => outLines.push(getExportText(label))); outLines.push('######'); });
            result = outLines.join('\n');
        }
    }

    if (result && modalOutputArea) {
        modalOutputArea.value = result;
        showToast('已產生文字預覽', 'success');
    }
});

// 下載目前文字框內的內容
document.getElementById('downloadTextFileBtn')?.addEventListener('click', () => {
    const content = modalOutputArea?.value;
    if (!content) return showToast('請先產生或輸入文字', 'error');
    
    const format = exportTextFormatSelect.value;
    let ext = 'txt';
    if (format === 'tsv') ext = 'tsv';
    else if (format === 'srt') ext = 'srt';
    else if (format === 'json') ext = 'json';
    
    downloadExportFile(content, getProjectFilename(ext));
    showToast(`檔案已下載 (.${ext})`, 'success');
});

// 一鍵複製與清除邏輯
document.getElementById('modalCopyExportBtn')?.addEventListener('click', () => {
    if (!modalOutputArea || !modalOutputArea.value) return showToast('沒有內容可以複製', 'error');
    navigator.clipboard.writeText(modalOutputArea.value).then(() => showToast('已複製全部文字！', 'success'));
});
document.getElementById('modalClearExportBtn')?.addEventListener('click', () => {
    if (modalOutputArea) modalOutputArea.value = '';
    showToast('文字已清除', 'normal');
});

// ===== 切換單句/全文模式（唯一綁定處，其他檔案不得重複綁定） =====
const toggleScriptModeBtnMain = document.getElementById('toggleScriptModeBtn');
if (toggleScriptModeBtnMain) {
    toggleScriptModeBtnMain.addEventListener('click', (e) => {
        e.stopPropagation(); 
        
        isScriptMode = !isScriptMode;
        
        // 關閉編輯選單
        document.getElementById('editMenu')?.classList.remove('show');
        
        // 列表標題容器（切換模式時調整底線）
        const listHeaderContainer = document.getElementById('listHeaderContainer');
        
        if (isScriptMode) {
            // 切換為全文模式
            document.getElementById('sentenceList').style.display = 'none';
            document.getElementById('scriptEditorContainer').style.display = 'flex';
            
            // 隱藏標題底線，避免雙重線條
            if (listHeaderContainer) listHeaderContainer.style.borderBottom = 'none';
            
            if (typeof saveState === 'function') saveState(); 
            if (typeof populateScriptEditor === 'function') populateScriptEditor();
            showToast('已切換為：全文模式 (劇本)', 'success');

            // 隱藏不支援的選單項目
            const toHide = ['sortMenuToggleBtn', 'timeDisplayToggleBtn', 'clearAllTagsBtn', 'mergeSelectedBtn'];
            toHide.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
            
        } else {
            // 切換回單句列表
            document.getElementById('sentenceList').style.display = 'flex';
            document.getElementById('scriptEditorContainer').style.display = 'none';
            
            // 恢復標題底線
            if (listHeaderContainer) listHeaderContainer.style.borderBottom = '2px solid #E0F2F1';
            
            if (typeof renderSentenceList === 'function') renderSentenceList();
            showToast('已切換為：單句模式 (列表)', 'normal');

            // 恢復所有選單項目
            const toShow = ['sortMenuToggleBtn', 'timeDisplayToggleBtn', 'clearAllTagsBtn'];
            toShow.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'flex'; });
        }
        
        // 依編輯鎖定狀態調整全文編輯框外觀
        const scriptTextarea = document.getElementById('scriptTextarea');
        const editorContainer = document.getElementById('scriptEditorContainer');
        if (isScriptMode) {
            if (scriptTextarea) scriptTextarea.readOnly = !isEditMode;
            if (editorContainer) editorContainer.style.background = isEditMode ? '#ffffff' : '#f8f9fa';
        }

        // 等排版完成後再重新掃描高亮並追蹤視角
        setTimeout(() => {
            // 重新掃描搜尋高亮
            if (typeof updateSearchMatches === 'function') {
                updateSearchMatches();
            }

            // 視角追蹤：捲到目前句子
            if (currentActiveLabel) {
                if (isScriptMode) {
                    // 單句 -> 全文：捲動大編輯框到目標行
                    const targetGutter = document.getElementById(`gutter-${currentActiveLabel}`);
                    if (targetGutter && scriptTextarea) {
                        // 保留 40px 上方緩衝
                        scriptTextarea.scrollTop = targetGutter.offsetTop - 40;
                        
                        // 同步高亮背板捲動
                        const backdrop = document.getElementById('scriptBackdrop');
                        if (backdrop) backdrop.scrollTop = scriptTextarea.scrollTop;
                    }
                } else {
                    // 全文 -> 單句：捲到對應句子
                    const itemDiv = document.getElementById(`item-${currentActiveLabel}`);
                    if (itemDiv && typeof smartScrollTo === 'function') {
                        smartScrollTo(itemDiv);
                    }
                }
            }
            
            // 搜尋中則跳回目前命中
            if (typeof scrollToCurrentMatch === 'function') {
                scrollToCurrentMatch();
            }
        }, 100);
    });
}

