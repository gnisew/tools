// ================= 4g_ui_export.js: 模組化匯出引擎、單句/全文模式切換 =================
// 本檔案由 4_ui_events.js 拆分而來（原始第 3183-3444 行），內容未經改寫，僅搬移。
// 依賴：1_globals.js 中定義的 DOM 參照與全域狀態變數，需在此檔之前載入。

// ================= ★ 全新設計：模組化匯出引擎 ★ =================
const openExportModalBtn = document.getElementById('openExportModalBtn');
const exportModalOverlay = document.getElementById('exportModalOverlay');
const closeExportModalBtn = document.getElementById('closeExportModalBtn');
const modalOutputArea = document.getElementById('modalOutputArea');
const exportTextFormatSelect = document.getElementById('exportTextFormatSelect');

// 開啟與關閉視窗 (保留文字不清空，讓使用者方便回頭複製)
openExportModalBtn?.addEventListener('click', () => {
    exportModalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden'; 
});
closeExportModalBtn?.addEventListener('click', () => {
    exportModalOverlay.classList.remove('show');
    document.body.style.overflow = ''; 
});

// 1. 各格式產生器 (Generators)
// TSV / SRT / Audacity 的實際字串格式，統一交給 1_globals.js 的 buildStandardToAny()
// 產生（跟批次轉檔 9_batch_converter.js 共用同一份邏輯，不再各寫一份）。
// 這裡只負責：從目前的全域資料組出標準 items 陣列，以及沒有資料時的提示文字。
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
            text: sentenceTextMap[label] || ""
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
        version: "1.0",
        title: localStorage.getItem('tagger_projectTitle') || document.getElementById('mainTitleDisplay')?.textContent || "",
        audioUrl: localStorage.getItem('tagger_audioUrl') || "",
        localFileName: localStorage.getItem('tagger_localFileName') || "",
        rawText: document.getElementById('rawTextInput')?.value || "",
        allLabelsOrdered: allLabelsOrdered,
        sentenceTextMap: sentenceTextMap,
        timeDataMap: timeDataMap,
        settings: { currentParseMode: currentParseMode, currentSortMode: currentSortMode }
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

// 2. 上方直接下載按鈕綁定
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


// 3. 下方產生純文字預覽邏輯
document.getElementById('exportTextBtn')?.addEventListener('click', () => {
    const format = exportTextFormatSelect.value;
    let result = "";

    if (format === 'tsv') result = generateTSV();
    else if (format === 'srt') result = generateSRT();
    else if (format === 'audacity') result = generateAudacity();
    else if (format === 'json') result = generateJSON();
    else {
        // 處理一般文字排版 (沿用原本 executeExportText 的邏輯)
        if (allLabelsOrdered.length === 0) return showToast('目前沒有任何句子！', 'error');
        let paragraphs = []; let currentLetter = ''; let currentPara = [];
        allLabelsOrdered.forEach(label => {
            const letter = label.charAt(0);
            if (letter !== currentLetter) { if (currentPara.length > 0) paragraphs.push(currentPara); currentLetter = letter; currentPara = []; }
            currentPara.push(label);
        });
        if (currentPara.length > 0) paragraphs.push(currentPara);

        if (format === 'para') result = paragraphs.map(para => para.map(label => sentenceTextMap[label] || '').join('')).join('\n');
        else if (format === 'para-slash-n') result = paragraphs.map(para => para.map(label => sentenceTextMap[label] || '').join('')).join('\\n');
        else if (format === 'sent-no-para') result = allLabelsOrdered.map(label => sentenceTextMap[label] || '').join('\n');
        else if (format === 'sent-empty-line') result = paragraphs.map(para => para.map(label => sentenceTextMap[label] || '').join('\n')).join('\n\n');
        else if (format === 'sent-hash') {
            const outLines = []; paragraphs.forEach(para => { outLines.push('######'); para.forEach(label => outLines.push(sentenceTextMap[label] || '')); outLines.push('######'); });
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
// =========================================================================
// ================= ★ 切換單句/全文模式（唯一綁定處） ★ =================
// 註：4b_ui_audio_loader.js 與 4e_ui_script_mode.js 原本也各綁了一份幾乎相同的
// click 監聽器（其中 4b 那份按鈕文字邏輯還是反的），過去靠 cloneNode 把舊監聽器
// 洗掉才能正常運作。三份邏輯已整併成這裡唯一一份，不再需要 cloneNode 技巧。
const toggleScriptModeBtnMain = document.getElementById('toggleScriptModeBtn');
if (toggleScriptModeBtnMain) {
    toggleScriptModeBtnMain.addEventListener('click', (e) => {
        e.stopPropagation(); 
        
        isScriptMode = !isScriptMode;
        
        // 點擊後自動關閉檢視選單
        document.getElementById('viewMenu')?.classList.remove('show');
        
        // ★ 取得列表標題容器，準備動態調整底線
        const listHeaderContainer = document.getElementById('listHeaderContainer');
        
        if (isScriptMode) {
            // 【切換為全文大編輯框】
            document.getElementById('sentenceList').style.display = 'none';
            document.getElementById('scriptEditorContainer').style.display = 'flex';
            
            // ★ 隱藏標題底線，解決雙重線條的視覺干擾
            if (listHeaderContainer) listHeaderContainer.style.borderBottom = 'none';
            
            if (typeof saveState === 'function') saveState(); 
            if (typeof populateScriptEditor === 'function') populateScriptEditor();
            showToast('已切換為：全文模式 (劇本)', 'success');

            // 隱藏不支援的選單項目
            const toHide = ['sortMenuToggleBtn', 'timeDisplayToggleBtn', 'clearAllTagsBtn', 'btnMenuContainer', 'mergeSelectedBtn'];
            toHide.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
            
        } else {
            // 【切換回單句列表】
            document.getElementById('sentenceList').style.display = 'flex';
            document.getElementById('scriptEditorContainer').style.display = 'none';
            
            // ★ 恢復標題的淺藍色底線
            if (listHeaderContainer) listHeaderContainer.style.borderBottom = '2px solid #E0F2F1';
            
            if (typeof renderSentenceList === 'function') renderSentenceList();
            showToast('已切換為：單句模式 (列表)', 'normal');

            // 恢復所有選單項目
            const toShow = ['sortMenuToggleBtn', 'timeDisplayToggleBtn', 'clearAllTagsBtn'];
            toShow.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'flex'; });
            if (document.getElementById('btnMenuContainer')) document.getElementById('btnMenuContainer').style.display = 'inline-block';
        }
        
        // UI 外觀 (鎖定/解鎖) 連動
        const scriptTextarea = document.getElementById('scriptTextarea');
        const editorContainer = document.getElementById('scriptEditorContainer');
        if (isScriptMode) {
            if (scriptTextarea) scriptTextarea.readOnly = !isEditMode;
            if (editorContainer) editorContainer.style.background = isEditMode ? '#ffffff' : '#f8f9fa';
        }

        // 核心修復：切換模式後，給予 100ms 讓畫面排版完成，然後執行追蹤與高亮
        setTimeout(() => {
            // 1. 強制重新掃描搜尋高亮
            if (typeof updateSearchMatches === 'function') {
                updateSearchMatches();
            }

            // 2. 視角錨點追蹤 (View Tracking)
            if (currentActiveLabel) {
                if (isScriptMode) {
                    // 【單句 -> 全文】：捲動大編輯框，讓目標行號出現在視野中
                    const targetGutter = document.getElementById(`gutter-${currentActiveLabel}`);
                    if (targetGutter && scriptTextarea) {
                        // 將捲動軸移至該行，減去 40px 的緩衝空間避免貼齊頂部太有壓迫感
                        scriptTextarea.scrollTop = targetGutter.offsetTop - 40;
                        
                        // 將透明高亮背板同步捲動
                        const backdrop = document.getElementById('scriptBackdrop');
                        if (backdrop) backdrop.scrollTop = scriptTextarea.scrollTop;
                    }
                } else {
                    // 【全文 -> 單句】：讓網頁捲動到對應的句子區塊
                    const itemDiv = document.getElementById(`item-${currentActiveLabel}`);
                    if (itemDiv && typeof smartScrollTo === 'function') {
                        smartScrollTo(itemDiv);
                    }
                }
            }
            
            // 3. 確保如果正在搜尋，跳回當前的搜尋目標
            if (typeof scrollToCurrentMatch === 'function') {
                scrollToCurrentMatch();
            }
        }, 100);
    });
}

