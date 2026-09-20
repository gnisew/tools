// ================= 4f_ui_import_search.js: 批次匯入介面、匯入資料視窗綁定、搜尋取代引擎、遺失音檔提示 =================
// 本檔案由 4_ui_events.js 拆分而來（原始第 2498-3182 行），內容未經改寫，僅搬移。
// 依賴：1_globals.js 中定義的 DOM 參照與全域狀態變數，需在此檔之前載入。

const enableMaxPlayCheck = document.getElementById('enableMaxPlayCheck');
const maxPlaySecondsInput = document.getElementById('maxPlaySecondsInput');

if (enableMaxPlayCheck && maxPlaySecondsInput) {
    // 1. 網頁載入時，讀取先前的設定狀態
    enableMaxPlayCheck.checked = localStorage.getItem('tagger_enableMaxPlay') === 'true';
    const savedSec = localStorage.getItem('tagger_maxPlaySeconds');
    if (savedSec) maxPlaySecondsInput.value = savedSec;

    // 2. 監聽狀態改變並儲存到 LocalStorage
    enableMaxPlayCheck.addEventListener('change', (e) => {
        localStorage.setItem('tagger_enableMaxPlay', e.target.checked ? 'true' : 'false');
    });
    maxPlaySecondsInput.addEventListener('change', (e) => {
        // 確保輸入的值是合理的數字，否則退回預設值 2
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val <= 0) val = 2;
        e.target.value = val;
        localStorage.setItem('tagger_maxPlaySeconds', val);
    });
}

// ================= ★ 新增：批次匯入介面與事件綁定 ★ =================
const openBatchImportBtn = document.getElementById('openBatchImportBtn');
const batchImportModal = document.getElementById('batchImportModalOverlay');
const tabLocalZip = document.getElementById('tabLocalZip');
const tabOnlineBatch = document.getElementById('tabOnlineBatch');
const sectionLocalZip = document.getElementById('sectionLocalZip');
const sectionOnlineBatch = document.getElementById('sectionOnlineBatch');

// 打開視窗
openBatchImportBtn?.addEventListener('click', () => {
    batchImportModal.classList.add('show');
});

// 關閉視窗
document.getElementById('batchImportCancelBtn')?.addEventListener('click', () => {
    batchImportModal.classList.remove('show');
});

// 切換頁籤
tabLocalZip?.addEventListener('click', () => {
    tabLocalZip.style.background = '#E0F2F1'; tabLocalZip.style.border = 'none'; tabLocalZip.style.color = '#00897B';
    tabOnlineBatch.style.background = 'transparent'; tabOnlineBatch.style.border = '1px solid #CBD5E1'; tabOnlineBatch.style.color = '#475569';
    sectionLocalZip.style.display = 'block'; sectionOnlineBatch.style.display = 'none';
});
tabOnlineBatch?.addEventListener('click', () => {
    tabOnlineBatch.style.background = '#E0F2F1'; tabOnlineBatch.style.border = 'none'; tabOnlineBatch.style.color = '#00897B';
    tabLocalZip.style.background = 'transparent'; tabLocalZip.style.border = '1px solid #CBD5E1'; tabLocalZip.style.color = '#475569';
    sectionOnlineBatch.style.display = 'block'; sectionLocalZip.style.display = 'none';
});

// 執行批次匯入
document.getElementById('batchImportConfirmBtn')?.addEventListener('click', async () => {
    const isLocalMode = sectionLocalZip.style.display !== 'none';
    const paddingSec = parseFloat(document.getElementById('batchSilencePadding').value) || 1.0;
    const autoPara = document.getElementById('batchAutoParaCheck').checked;

    if (isLocalMode) {
        const fileInput = document.getElementById('batchLocalFilesInput');
        const files = Array.from(fileInput.files);
        if (files.length === 0) return showToast('請先選擇檔案或 ZIP 壓縮檔', 'error');

        batchImportModal.classList.remove('show'); // 隱藏視窗開始處理

        try {
            let validAudioFiles = [];

            // 判斷是否為單一 ZIP 檔
            if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
                if (typeof JSZip === 'undefined') throw new Error("找不到 JSZip 解壓縮套件");
                showToast('正在解壓縮 ZIP 檔...', 'normal');
                const zip = new JSZip();
                const zipContent = await zip.loadAsync(files[0]);
                
                for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
                    // 過濾出音訊檔且排除隱藏檔案/資料夾 (如 macOS 的 __MACOSX)
                    if (!zipEntry.dir && filename.match(/\.(mp3|wav|m4a|ogg|aac)$/i) && !filename.includes('__MACOSX')) {
                        const blob = await zipEntry.async('blob');
                        // 擷取真正的檔名 (去除路徑)
                        const pureName = filename.split('/').pop();
                        const file = new File([blob], pureName, { type: blob.type });
                        validAudioFiles.push(file);
                    }
                }
            } else {
                // 一般多選檔案
                validAudioFiles = files.filter(f => f.name.match(/\.(mp3|wav|m4a|ogg|aac)$/i));
            }

            if (validAudioFiles.length === 0) return showToast('沒有找到支援的音訊檔案', 'error');
            if (validAudioFiles.length > 100) showToast('檔案數量龐大，處理可能需要較長時間，請勿關閉網頁', 'error');

            // 紀錄歷史狀態以防反悔
            if (typeof saveState === 'function') saveState();

            // 呼叫 2_audio_engine.js 中的混音器
            const result = await processBatchLocalFiles(validAudioFiles, paddingSec, autoPara);

            // 寫入全域資料
            allLabelsOrdered = result.labels;
            sentenceTextMap = result.texts;
            timeDataMap = result.times;

            // 產生一個虛擬的檔案名稱
            const mergedFileName = "批次合併音檔_" + Date.now() + ".wav";
            const mergedFile = new File([result.blob], mergedFileName, { type: 'audio/wav' });

            // 餵給播放器載入
            audioPlayer.src = URL.createObjectURL(mergedFile); 
            audioPlayer.load();
            
            localStorage.setItem('tagger_localFileName', mergedFileName); 
            localStorage.setItem('tagger_audioType', 'local'); 
            
            saveToStorage(); 
            if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay(); 
            if(typeof renderSentenceList === 'function') renderSentenceList(); 
            if(typeof initWaveSurfer === 'function') initWaveSurfer(); 
            
            showToast(`成功匯入並合併 ${validAudioFiles.length} 個音檔！`, 'success'); 

        } catch (err) {
            console.error(err);
            showToast('匯入失敗：' + err.message, 'error');
        }
    } else {
        // 線上批次匯入邏輯 (我們下個階段實作)
        showToast('線上批次匯入功能即將推出！', 'normal');
    }
});


// ================= ★ 新增：動態顯示「批次合併設定」區塊的邏輯 ★ =================
const modalLocalFilesInput = document.getElementById('modalLocalFilesInput');
const onlineModeRadios = document.querySelectorAll('input[name="onlineMode"]');

// 1. 監聽本機檔案選擇，有變化時直接呼叫中央防呆引擎
if (modalLocalFilesInput) {
    modalLocalFilesInput.addEventListener('change', updateMergeSettingsVisibility);
}

// 2. 監聽線上網址模式切換，有變化時直接呼叫中央防呆引擎
if (onlineModeRadios.length > 0) {
    onlineModeRadios.forEach(radio => {
        radio.addEventListener('change', updateMergeSettingsVisibility);
    });
}


// ================= ★ 新增：匯入資料視窗 UI 互動綁定 ★ =================
const openDataModalBtn = document.getElementById('openDataModalBtn');
const dataImportModal = document.getElementById('dataImportModalOverlay');
const closeDataModalBtn = document.getElementById('closeDataModalBtn');
const dataLoadConfirmBtn = document.getElementById('dataLoadConfirmBtn');

const tabPasteText = document.getElementById('tabPasteText');
const tabImportFile = document.getElementById('tabImportFile');
const sectionPasteText = document.getElementById('sectionPasteText');
const sectionImportFile = document.getElementById('sectionImportFile');

// 開關與頁籤切換
// ★ 修正：openDataModalBtn 的 click 監聽器原本在這裡跟下方「每次打開視窗時，
// 順便更新提示」各綁了一份，開窗動作雖是冪等所以使用者看不太出來，但仍屬多餘
// 重複程式碼。已整併，唯一保留的版本在本檔案下方（多做了 updateDataFileHint()）。
function closeDataModal() { dataImportModal.classList.remove('show'); document.body.style.overflow = ''; }
closeDataModalBtn?.addEventListener('click', closeDataModal);

tabPasteText?.addEventListener('click', () => {
    tabPasteText.style.background = 'white'; tabPasteText.style.color = '#00897B'; tabPasteText.style.borderBottom = '3px solid #00897B';
    tabImportFile.style.background = 'transparent'; tabImportFile.style.color = '#666'; tabImportFile.style.borderBottom = '3px solid transparent';
    tabPasteText.setAttribute('aria-selected', 'true'); tabImportFile.setAttribute('aria-selected', 'false');
    sectionPasteText.style.display = 'flex'; sectionImportFile.style.display = 'none';
});
tabImportFile?.addEventListener('click', () => {
    tabImportFile.style.background = 'white'; tabImportFile.style.color = '#00897B'; tabImportFile.style.borderBottom = '3px solid #00897B';
    tabPasteText.style.background = 'transparent'; tabPasteText.style.color = '#666'; tabPasteText.style.borderBottom = '3px solid transparent';
    tabImportFile.setAttribute('aria-selected', 'true'); tabPasteText.setAttribute('aria-selected', 'false');
    sectionImportFile.style.display = 'block'; sectionPasteText.style.display = 'none';
});

// ★ 核心功能：原地預覽解析結果
const previewParseBtn = document.getElementById('previewParseBtn');
previewParseBtn?.addEventListener('click', () => {
    const rawTextInput = document.getElementById('rawTextInput');
    let rawText = rawTextInput.value.trim().replace(/\\n/g, '\n');
    if (!rawText) return showToast('請先貼上文字', 'error');
    
    // 如果已經是包含 Tab 的表格格式，就提示使用者不用再點了
    const rawLines = rawText.split(/\r?\n/).filter(p => p.trim() !== '');
    if (rawLines.some(line => /^[A-Z]\d{2,}\t/.test(line))) {
        return showToast('已經是解析好的表格格式囉！請直接點擊確定載入', 'normal');
    }

    const parseMode = document.getElementById('parseModeSelect').value;
    let tempLabels = []; let tempTexts = {};
    
    if (parseMode === 'newline') {
        rawLines.forEach((line, index) => { 
            const label = String(index + 1).padStart(2, '0'); 
            tempLabels.push(label); tempTexts[label] = line.replace(/\([^)]+\)/g, ''); 
        });
    } else if (parseMode === 'newline-para') {
        const rawFullLines = rawText.split(/\r?\n/); let paragraphs = []; let currentPara = [];
        for (let i = 0; i < rawFullLines.length; i++) {
            const line = rawFullLines[i].trim();
            if (line === '' || /^#+$/.test(line)) { if (currentPara.length > 0) { paragraphs.push(currentPara); currentPara = []; } } else currentPara.push(line);
        }
        if (currentPara.length > 0) paragraphs.push(currentPara);
        paragraphs.forEach((paraLines, paraIndex) => {
            const paraLetter = String.fromCharCode(65 + paraIndex); 
            paraLines.forEach((sentence, sentIndex) => { 
                const label = `${paraLetter}${String(sentIndex + 1).padStart(2, '0')}`; 
                tempLabels.push(label); tempTexts[label] = sentence.replace(/\([^)]+\)/g, ''); 
            });
        });
    } else {
        const paragraphs = rawLines;
        paragraphs.forEach((para, paraIndex) => {
            const paraLetter = String.fromCharCode(65 + paraIndex); 
            let sentences = []; let current = ''; let inBrackets = false;
            for (let i = 0; i < para.length; i++) {
                let char = para[i]; current += char;
                if (char === '[') inBrackets = true; if (char === ']') inBrackets = false;
                
                if (!inBrackets && /[，。：；！？、．―─「」【】『』《》〈〉·?!.,]/.test(char)) {
                    let isDecimal = false;
                    if ((char === '.' || char === ',') && i > 0 && i < para.length - 1) { if (/\d/.test(para[i-1]) && /\d/.test(para[i+1])) isDecimal = true; }
                    
                    if (!isDecimal) {
                        // 貪婪吸收後續的標點符號
                        while (i + 1 < para.length && /[，。：；！？、．―─「」【】『』《》〈〉·"”'’?!.,\s]/.test(para[i+1])) {
                            let nextChar = para[i+1]; if (nextChar === '[') break; 
                            if ((nextChar === '.' || nextChar === ',') && /\d/.test(para[i]) && i + 2 < para.length && /\d/.test(para[i+2])) break;
                            current += nextChar; i++;
                        }
                        
                        if (current.trim()) {
                            // 同步套用 Unicode 防呆機制
                            if (!/^[\p{P}\p{S}\s]+$/u.test(current)) {
                                sentences.push(current.trim()); 
                                current = '';
                            }
                        }
                    }
                }
            }
            
            if (current.trim()) {
                if (/^[\p{P}\p{S}\s]+$/u.test(current) && sentences.length > 0) {
                    sentences[sentences.length - 1] += current.trim();
                } else {
                    sentences.push(current.trim()); 
                }
            }
            
            if (sentences.length === 0) sentences = [para];
            sentences.forEach((sentence, sentIndex) => { 
                const label = `${paraLetter}${String(sentIndex + 1).padStart(2, '0')}`; 
                tempLabels.push(label); tempTexts[label] = sentence.replace(/\([^)]+\)/g, ''); 
            });
        });
    }

    // 將結果以 TSV 格式寫回輸入框，讓使用者「原地預覽」
    // ★ 新增：預覽時也先移除沒有實際文字的句子（例如整句只有括號註解），與「確定載入」的結果一致
    const compactPreview = (typeof compactParsedList === 'function')
        ? compactParsedList(tempLabels, tempTexts)
        : { labels: tempLabels, textMap: tempTexts };
    rawTextInput.value = compactPreview.labels.map(lbl => `${lbl}\t\t\t${compactPreview.textMap[lbl]}`).join('\n');
    showToast('已在原地解析！確認無誤後請點擊「確定載入」', 'success');
});

// ★ 更新上次載入資料的提示文字
function updateDataFileHint() {
    const lastFile = localStorage.getItem('tagger_lastDataFile');
    const hintEl = document.getElementById('localDataFileHint');
    if (lastFile && hintEl) {
        hintEl.innerHTML = `<span class="material-icons" style="font-size: 1.1rem; margin-right: 4px;">warning</span> 上次匯入資料：「${escapeHtml(lastFile)}」，請確認是否需重新選取`;
        hintEl.style.display = 'flex';
    }
}

// 每次打開視窗時，順便更新提示
openDataModalBtn?.addEventListener('click', () => { 
    dataImportModal.classList.add('show'); 
    document.body.style.overflow = 'hidden'; 
    updateDataFileHint(); 
});

// ★ 確定載入按鈕：執行真正的載入動作 (支援雙頁籤分流)
dataLoadConfirmBtn?.addEventListener('click', () => {
    const isPasteMode = sectionPasteText.style.display !== 'none';
    
    if (isPasteMode) {
        // 【狀況 A】如果在「貼上文字解析」頁籤
        if (document.getElementById('rawTextInput').value.trim() !== '') {
            if(typeof saveState === 'function') saveState();
            if(typeof triggerParseAction === 'function') triggerParseAction();
            closeDataModal();
        } else {
            showToast('請先貼上文字並點擊預覽解析', 'error');
        }
    } else {
        // 【狀況 B】如果在「選擇外部檔案」頁籤
        const fileInput = document.getElementById('modalDataFileInput');
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            return showToast('請先選擇檔案', 'error');
        }
        
        const file = fileInput.files[0];
        const ext = file.name.split('.').pop().toLowerCase();
        
        // 記憶這次載入的檔名，下次打開視窗就會提示
        localStorage.setItem('tagger_lastDataFile', file.name);
        
        // 利用 DataTransfer 把檔案完美轉交給對應的隱藏輸入框
        const dt = new DataTransfer();
        dt.items.add(file);
        
        if (ext === 'json') {
            const projectInput = document.getElementById('importProjectInput');
            if (projectInput) {
                projectInput.files = dt.files;
                projectInput.dispatchEvent(new Event('change'));
            }
        } else if (ext === 'srt') {
            const srtInput = document.getElementById('importSrtInput');
            if (srtInput) {
                srtInput.files = dt.files;
                srtInput.dispatchEvent(new Event('change'));
            } else {
                showToast('已接收 SRT 檔案，請實作後續匯入邏輯', 'normal');
            }
        } else if (ext === 'txt' || ext === 'tsv') {
            const audInput = document.getElementById('importAudacityInput');
            if (audInput) {
                audInput.files = dt.files;
                audInput.dispatchEvent(new Event('change'));
            } else {
                // 防呆：如果沒有寫 Audacity 解析，直接把純文字丟進預覽框
                const reader = new FileReader();
                reader.onload = (e) => {
                    const rawTextInput = document.getElementById('rawTextInput');
                    if (rawTextInput) {
                        rawTextInput.value = e.target.result;
                        if(typeof saveState === 'function') saveState();
                        if(typeof triggerParseAction === 'function') triggerParseAction();
                    }
                };
                reader.readAsText(file);
            }
        } else {
            return showToast('不支援的檔案格式', 'error');
        }
        
        closeDataModal(); // 執行完畢關閉視窗
    }
});

// 選擇外部檔案後，自動關閉視窗以提升流暢度
const autoCloseInputs = ['importProjectInput', 'importSrtInput', 'importAudacityInput'];
autoCloseInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
        if (el.files.length > 0) closeDataModal();
    });
});
// =========================================================================

// ================= ★ Chrome級：即時高亮搜尋與取代引擎 ★ =================
const openBatchReplaceBtn = document.getElementById('openBatchReplaceBtn');
const batchReplaceModal = document.getElementById('batchReplaceModalOverlay');
const batchReplaceConfirmBtn = document.getElementById('batchReplaceConfirmBtn');
const batchReplaceCancelBtn = document.getElementById('batchReplaceCancelBtn');
const findPrevBtn = document.getElementById('findPrevBtn');
const findNextBtn = document.getElementById('findNextBtn');
const replaceSingleBtn = document.getElementById('replaceSingleBtn');
const findTextInput = document.getElementById('findTextInput');
const replaceTextInput = document.getElementById('replaceTextInput');
const useRegexCheck = document.getElementById('useRegexCheck');
const searchMatchCount = document.getElementById('searchMatchCount');

// 搜尋狀態機
let searchEngine = { query: '', useRegex: false, matches: [], currentIndex: -1 };

// 開啟視窗與關閉視窗
openBatchReplaceBtn?.addEventListener('click', () => {
    batchReplaceModal.classList.add('show');
    setTimeout(() => { findTextInput.focus(); findTextInput.select(); }, 100); 
});
batchReplaceCancelBtn?.addEventListener('click', () => {
    batchReplaceModal.classList.remove('show');
    searchEngine.query = ''; 
    clearAllHighlights(); // 關閉時清除高亮
});

// 核心：掃描並更新所有符合的字串位置
function updateSearchMatches() {
    const findStr = findTextInput.value;
    const useRegex = useRegexCheck ? useRegexCheck.checked : false;
    searchEngine.matches = [];
    searchEngine.query = findStr;
    searchEngine.useRegex = useRegex;

    if (!findStr) { renderHighlights(); return; }

    let searchRegex = null;
    if (useRegex) {
        try { searchRegex = new RegExp(findStr, 'g'); } catch(e) { renderHighlights(); return; }
    }

    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
        // 劇本模式：計算 textarea 內的文字索引
        const text = document.getElementById('scriptTextarea')?.value || '';
        if (useRegex) {
            let match;
            while ((match = searchRegex.exec(text)) !== null) {
                if (match[0].length === 0) { searchRegex.lastIndex++; continue; }
                searchEngine.matches.push({ start: match.index, end: match.index + match[0].length });
            }
        } else {
            let idx = text.indexOf(findStr);
            while (idx !== -1) {
                searchEngine.matches.push({ start: idx, end: idx + findStr.length });
                idx = text.indexOf(findStr, idx + findStr.length);
            }
        }
    } else {
        // 單句模式：計算所有標籤內的文字索引
        allLabelsOrdered.forEach(label => {
            const text = sentenceTextMap[label] || '';
            if (useRegex) {
                searchRegex.lastIndex = 0;
                let match;
                while ((match = searchRegex.exec(text)) !== null) {
                    if (match[0].length === 0) { searchRegex.lastIndex++; continue; }
                    searchEngine.matches.push({ label, start: match.index, end: match.index + match[0].length });
                }
            } else {
                let idx = text.indexOf(findStr);
                while (idx !== -1) {
                    searchEngine.matches.push({ label, start: idx, end: idx + findStr.length });
                    idx = text.indexOf(findStr, idx + findStr.length);
                }
            }
        });
    }

    if (searchEngine.currentIndex >= searchEngine.matches.length) searchEngine.currentIndex = Math.max(0, searchEngine.matches.length - 1);
    else if (searchEngine.currentIndex === -1 && searchEngine.matches.length > 0) searchEngine.currentIndex = 0;

    renderHighlights();
}

// 核心：在畫面上塗上黃色與橘色高亮
function renderHighlights() {
    if (!searchEngine.query || searchEngine.matches.length === 0) {
        searchMatchCount.style.display = 'none';
        clearAllHighlights();
        return;
    }

    searchMatchCount.style.display = 'block';
    searchMatchCount.textContent = `${searchEngine.currentIndex + 1}/${searchEngine.matches.length}`;
    clearAllHighlights(); 

    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
        const textarea = document.getElementById('scriptTextarea');
        const backdrop = document.getElementById('scriptBackdrop');
        if (!textarea || !backdrop) return;
        
        const text = textarea.value;
        let html = ''; let lastIdx = 0;
        
        searchEngine.matches.forEach((m, idx) => {
            html += escapeHtml(text.substring(lastIdx, m.start));
            const markClass = idx === searchEngine.currentIndex ? 'backdrop-mark active' : 'backdrop-mark';
            html += `<mark class="${markClass}">${escapeHtml(text.substring(m.start, m.end))}</mark>`;
            lastIdx = m.end;
        });
        html += escapeHtml(text.substring(lastIdx));
        backdrop.innerHTML = html;
    } else {
        const labelMatches = {};
        searchEngine.matches.forEach((m, idx) => {
            if (!labelMatches[m.label]) labelMatches[m.label] = [];
            labelMatches[m.label].push({ ...m, globalIdx: idx });
        });
        
        for (const label in labelMatches) {
            const itemDiv = document.getElementById(`item-${label}`);
            const display = itemDiv?.querySelector('.sentence-text-display');
            if (!display) continue;
            
            const text = sentenceTextMap[label] || '';
            let html = ''; let lastIdx = 0;
            
            labelMatches[label].forEach(m => {
                html += escapeHtml(text.substring(lastIdx, m.start));
                const markClass = m.globalIdx === searchEngine.currentIndex ? 'list-mark active' : 'list-mark';
                html += `<mark class="${markClass}">${escapeHtml(text.substring(m.start, m.end))}</mark>`;
                lastIdx = m.end;
            });
            html += escapeHtml(text.substring(lastIdx));
            display.innerHTML = html;
        }
    }
}

// 清除所有高亮痕跡 (保護原始資料)
function clearAllHighlights() {
    if (searchEngine && searchEngine.matches) {
        // 使用 Set 來排除重複的標籤 (因為一句話可能有多個關鍵字)
        const affectedLabels = new Set(searchEngine.matches.map(m => m.label));
        
        affectedLabels.forEach(label => {
            if (!label) return; // 劇本模式沒有 label
            const display = document.querySelector(`#item-${label} .sentence-text-display`);
            if (display) {
                // 直接從原始資料還原文字，消除 <mark>
                display.textContent = sentenceTextMap[label] || '';
            }
        });
    }
    
    // 處理劇本模式的背景
    const backdrop = document.getElementById('scriptBackdrop');
    if (backdrop) backdrop.innerHTML = '';
}

function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 捲動並選取目標
function scrollToCurrentMatch() {
    if (searchEngine.currentIndex === -1 || searchEngine.matches.length === 0) return;
    const match = searchEngine.matches[searchEngine.currentIndex];
    
    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
        const textarea = document.getElementById('scriptTextarea');
        textarea.focus();
        textarea.setSelectionRange(match.start, match.end);
    } else {
        currentActiveLabel = match.label;
        if (typeof updateSelectionUI === 'function') updateSelectionUI();
        const itemDiv = document.getElementById(`item-${match.label}`);
        if (itemDiv && typeof smartScrollTo === 'function') smartScrollTo(itemDiv);
    }
}

let searchInputTimeout = null;
findTextInput?.addEventListener('input', () => { 
    clearTimeout(searchInputTimeout);
    searchInputTimeout = setTimeout(() => {
        updateSearchMatches(); 
        scrollToCurrentMatch(); 
    }, 500);
});

useRegexCheck?.addEventListener('change', () => { updateSearchMatches(); scrollToCurrentMatch(); });

// 上下步切換
function stepMatch(direction) {
    if (searchEngine.matches.length === 0) return;
    searchEngine.currentIndex += direction;
    if (searchEngine.currentIndex >= searchEngine.matches.length) searchEngine.currentIndex = 0;
    if (searchEngine.currentIndex < 0) searchEngine.currentIndex = searchEngine.matches.length - 1;
    renderHighlights(); scrollToCurrentMatch();
}
findNextBtn?.addEventListener('click', () => stepMatch(1));
findPrevBtn?.addEventListener('click', () => stepMatch(-1));
findTextInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') stepMatch(1); });

// 單步取代
replaceSingleBtn?.addEventListener('click', () => {
    if (searchEngine.matches.length === 0 || searchEngine.currentIndex === -1) return;
    const replaceStr = replaceTextInput.value;
    if (typeof saveState === 'function') saveState();

    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
        const match = searchEngine.matches[searchEngine.currentIndex];
        const textarea = document.getElementById('scriptTextarea');
        const text = textarea.value;
        textarea.value = text.substring(0, match.start) + replaceStr + text.substring(match.end);
        if (typeof renderGutterAndSyncData === 'function') renderGutterAndSyncData();
    } else {
        const match = searchEngine.matches[searchEngine.currentIndex];
        let text = sentenceTextMap[match.label] || '';
        text = text.substring(0, match.start) + replaceStr + text.substring(match.end);
        sentenceTextMap[match.label] = text;
        const itemDiv = document.getElementById(`item-${match.label}`);
        if (itemDiv) { 
            itemDiv.querySelector('.sentence-text-display').textContent = text; 
            itemDiv.dataset.rawText = text; 
        }
        
        // ★ 效能優化：精準只更新這一個聲波圖標記的文字
        if (typeof updateRegionTextDisplay === 'function') {
            updateRegionTextDisplay(match.label, text);
        }
        
        saveToStorage();
    }
    updateSearchMatches(); scrollToCurrentMatch();
});

// 全部取代
batchReplaceConfirmBtn?.addEventListener('click', () => {
    if (searchEngine.matches.length === 0) return;
    const replaceStr = replaceTextInput.value;
    if (typeof saveState === 'function') saveState();
    let count = searchEngine.matches.length;

    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
        const textarea = document.getElementById('scriptTextarea');
        let text = textarea.value; let offset = 0;
        searchEngine.matches.forEach(m => {
            text = text.substring(0, m.start + offset) + replaceStr + text.substring(m.end + offset);
            offset += replaceStr.length - (m.end - m.start);
        });
        textarea.value = text;
        if (typeof renderGutterAndSyncData === 'function') renderGutterAndSyncData();
    } else {
        const labelOffsetMap = {};
        const affectedLabels = new Set(); // ★ 使用 Set 收集受影響的標籤，自動排除重複

        searchEngine.matches.forEach(m => {
            if (!labelOffsetMap[m.label]) labelOffsetMap[m.label] = 0;
            let text = sentenceTextMap[m.label];
            const offset = labelOffsetMap[m.label];
            text = text.substring(0, m.start + offset) + replaceStr + text.substring(m.end + offset);
            sentenceTextMap[m.label] = text;
            labelOffsetMap[m.label] += replaceStr.length - (m.end - m.start);
            
            const itemDiv = document.getElementById(`item-${m.label}`);
            if (itemDiv) { 
                itemDiv.querySelector('.sentence-text-display').textContent = text; 
                itemDiv.dataset.rawText = text; 
            }
            affectedLabels.add(m.label); // 記錄被修改過的句子
        });
        
        // ★ 效能優化：批次精準更新聲波圖文字，每句最多只更新一次
        affectedLabels.forEach(label => {
            if (typeof updateRegionTextDisplay === 'function') {
                updateRegionTextDisplay(label, sentenceTextMap[label]);
            }
        });

        saveToStorage();
    }
    showToast(`替換完成！共替換了 ${count} 處。`, 'success');
    searchEngine.query = ''; findTextInput.value = ''; updateSearchMatches();
});
// =========================================================================

// 點擊後，先關閉側邊欄，稍微延遲 300 毫秒等動畫結束，再彈出目標視窗，讓體驗更滑順
document.getElementById('sidebarAudioBtn')?.addEventListener('click', () => {
    document.getElementById('closeSidebarBtn')?.click(); 
    setTimeout(() => document.getElementById('openAudioModalBtn')?.click(), 300); 
});

document.getElementById('sidebarDataBtn')?.addEventListener('click', () => {
    document.getElementById('closeSidebarBtn')?.click();
    setTimeout(() => document.getElementById('openDataModalBtn')?.click(), 300);
});

document.getElementById('sidebarExportBtn')?.addEventListener('click', () => {
    document.getElementById('closeSidebarBtn')?.click();
    setTimeout(() => document.getElementById('openExportModalBtn')?.click(), 300);
});

document.getElementById('sidebarClearBtn')?.addEventListener('click', () => {
    document.getElementById('closeSidebarBtn')?.click();
    setTimeout(() => document.getElementById('clearStorageBtn')?.click(), 300);
});

// ================= ★ 新增：點擊遺失音檔提示，直接開啟選擇視窗 ★ =================
const missingAudioWarning = document.getElementById('missingAudioWarning');
missingAudioWarning?.addEventListener('click', () => {
    document.getElementById('openAudioModalBtn')?.click();
});
missingAudioWarning?.addEventListener('mouseover', () => {
    missingAudioWarning.style.backgroundColor = '#FFE0B2';
});
missingAudioWarning?.addEventListener('mouseout', () => {
    missingAudioWarning.style.backgroundColor = '#FFF8E1';
});
// =========================================================================


