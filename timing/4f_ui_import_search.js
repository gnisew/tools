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
    
    // ★ 新增：貼上的是 SRT 字幕或 Audacity 標籤文字 → 原地轉成「標籤/開始/結束/文字」表格預覽
    if (typeof looksLikeTimedText === 'function' && looksLikeTimedText(rawText)) {
        const kindName = looksLikeSrt(rawText) ? 'SRT 字幕' : 'Audacity 標籤';
        const tsv = timedTextToTsv(rawText);
        if (!tsv) return showToast(`讀不到有效的 ${kindName} 時間軸，請確認格式`, 'error');
        rawTextInput.value = tsv;
        return showToast(`已辨識為 ${kindName}！確認無誤後請點擊「確定載入」`, 'success');
    }
    
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
// ★ 多語言字幕：搜尋／取代的範圍，直接跟著列表右上角「語言」檢視選項走
//   - 檢視「語言N」：只比對、只取代第 N 語言那一段，其他語言原封不動（寫回一律走 setLang）
//   - 檢視「全部語言」：把整串文字用 splitLangs 切開，每個語言各自比對，
//     比對結果不會跨越分隔字元，取代也只改到命中的那一段
//   - 全文模式（大編輯框）畫面上本來就顯示整串原始文字（含分隔字元），維持整串比對
//   - 取代文字若含分隔字元，會破壞語言結構，直接擋下並提示
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
const findPlaceholderDefault = findTextInput ? findTextInput.placeholder : '';

// 搜尋狀態機
// 單句模式的每筆命中：{ label, langIdx, start, end, dStart, dEnd }
//   start/end   = 相對於「該語言那一段」的位置（取代時使用）
//   dStart/dEnd = 相對於「畫面上顯示的文字」的位置（高亮時使用）
// 全文模式的每筆命中：{ start, end }（相對於整個 textarea）
let searchEngine = { query: '', useRegex: false, matches: [], currentIndex: -1 };
// 記錄目前畫面上被塗上高亮的列，好在下一次重繪前確實還原（避免舊高亮殘留）
let searchPaintedLabels = new Set();

// ---------- 多語言輔助 ----------
function isScriptModeActive() {
    return (typeof isScriptMode !== 'undefined' && isScriptMode);
}
function isLangMultiOn() {
    return (typeof getLangMultiEnabled === 'function') && getLangMultiEnabled();
}
// 目前列表的語言檢視索引：null = 全部語言；數字 = 只看第 N 語言（與 renderSentenceList 判斷一致）
function getSearchLangViewIndex() {
    return (typeof getCurrentLangViewIndex === 'function') ? getCurrentLangViewIndex() : null;
}
function searchSplit(text) {
    return (typeof splitLangs === 'function') ? splitLangs(text) : [String(text || '')];
}
function searchJoin(segs) {
    if (!isLangMultiOn() || typeof getLangDelimiter !== 'function') return segs[0] || '';
    return segs.join(getLangDelimiter());
}
// 這一列在列表上「實際顯示」的文字（與 renderSentenceList 的邏輯一致）
function getListDisplayText(label) {
    const full = sentenceTextMap[label] || '';
    const idx = getSearchLangViewIndex();
    return (idx !== null && typeof getLang === 'function') ? getLang(full, idx) : full;
}
// 搜尋範圍名稱（顯示在輸入框提示與提示訊息）；未啟用多語、或全文模式時回傳空字串
function getSearchScopeName() {
    if (isScriptModeActive() || !isLangMultiOn()) return '';
    const idx = getSearchLangViewIndex();
    if (idx === null) return '全部語言';
    return (typeof getLangName === 'function') ? getLangName(idx) : `語言${idx + 1}`;
}
function updateSearchScopeHint() {
    if (!findTextInput) return;
    // ★ 跨句群組模式：搜尋範圍是群組的備註與圖片網址，提示文字改由 4i 處理
    if (typeof isMediaGroupsView !== 'undefined' && isMediaGroupsView && typeof mgSearchUpdateUI === 'function') { mgSearchUpdateUI(); return; }
    const scope = getSearchScopeName();
    findTextInput.placeholder = scope ? `尋找目標（${scope}）` : findPlaceholderDefault;
}
// 取代文字若含分隔字元，會憑空多出（或改變）語言分段，直接擋下
function replaceStrBreaksLangStructure(replaceStr) {
    if (isScriptModeActive() || !isLangMultiOn() || typeof getLangDelimiter !== 'function') return false;
    return String(replaceStr).includes(getLangDelimiter());
}
function warnReplaceHasDelimiter() {
    showToast(`取代文字含有語言分隔字元「${getLangDelimiter()}」，會破壞多語言結構，已取消取代`, 'error');
}

// 在單一字串裡找出所有命中位置（一般或正則）
function findMatchesInString(text, findStr, searchRegex) {
    const result = [];
    if (!text) return result;
    if (searchRegex) {
        searchRegex.lastIndex = 0;
        let match;
        while ((match = searchRegex.exec(text)) !== null) {
            if (match[0].length === 0) { searchRegex.lastIndex++; continue; }
            result.push({ start: match.index, end: match.index + match[0].length });
        }
    } else {
        let idx = text.indexOf(findStr);
        while (idx !== -1) {
            result.push({ start: idx, end: idx + findStr.length });
            idx = text.indexOf(findStr, idx + findStr.length);
        }
    }
    return result;
}

// 開啟視窗與關閉視窗
openBatchReplaceBtn?.addEventListener('click', () => {
    batchReplaceModal.classList.add('show');
    updateSearchScopeHint();
    setTimeout(() => { findTextInput.focus(); findTextInput.select(); }, 100); 
});
batchReplaceCancelBtn?.addEventListener('click', () => {
    batchReplaceModal.classList.remove('show');
    searchEngine.query = ''; 
    clearAllHighlights(); // 關閉時清除高亮
});

// 核心：掃描並更新所有符合的字串位置
function updateSearchMatches() {
    // ★ 多語言編輯模式：搜尋範圍是左/右欄 textarea，改由 4j_ui_lang_edit.js 處理
    if (typeof isLangEditView !== 'undefined' && isLangEditView && typeof langEditSearchScan === 'function') { langEditSearchScan(); return; }
    // ★ 跨句群組模式：搜尋範圍限定群組資料，改由 4i_ui_media_groups.js 處理
    if (typeof isMediaGroupsView !== 'undefined' && isMediaGroupsView && typeof mgSearchScan === 'function') { mgSearchScan(); return; }
    const findStr = findTextInput.value;
    const useRegex = useRegexCheck ? useRegexCheck.checked : false;
    searchEngine.matches = [];
    searchEngine.query = findStr;
    searchEngine.useRegex = useRegex;
    updateSearchScopeHint();

    if (!findStr) { renderHighlights(); return; }

    let searchRegex = null;
    if (useRegex) {
        try { searchRegex = new RegExp(findStr, 'g'); } catch(e) { renderHighlights(); return; }
    }

    if (isScriptModeActive()) {
        // 劇本模式：畫面顯示整串原始文字，直接計算 textarea 內的文字索引
        const text = document.getElementById('scriptTextarea')?.value || '';
        searchEngine.matches = findMatchesInString(text, findStr, searchRegex);
    } else {
        // 單句模式：只搜尋「目前檢視的語言」
        const viewIdx = getSearchLangViewIndex();
        const delimLen = (isLangMultiOn() && typeof getLangDelimiter === 'function') ? getLangDelimiter().length : 0;

        allLabelsOrdered.forEach(label => {
            const full = sentenceTextMap[label] || '';

            if (viewIdx !== null && typeof getLang === 'function') {
                // 檢視「語言N」：只比對第 N 語言那一段，畫面上顯示的就是那一段，位置不需換算
                const seg = getLang(full, viewIdx);
                findMatchesInString(seg, findStr, searchRegex).forEach(m => {
                    searchEngine.matches.push({ label, langIdx: viewIdx, start: m.start, end: m.end, dStart: m.start, dEnd: m.end });
                });
            } else {
                // 檢視「全部語言」：每個語言各自比對（命中不會跨越分隔字元）
                // 畫面顯示整串，所以高亮位置要加上該語言在整串中的起點
                const segs = searchSplit(full);
                let base = 0;
                segs.forEach((seg, langIdx) => {
                    findMatchesInString(seg, findStr, searchRegex).forEach(m => {
                        searchEngine.matches.push({ label, langIdx, start: m.start, end: m.end, dStart: base + m.start, dEnd: base + m.end });
                    });
                    base += seg.length + delimLen;
                });
            }
        });
    }

    if (searchEngine.currentIndex >= searchEngine.matches.length) searchEngine.currentIndex = Math.max(0, searchEngine.matches.length - 1);
    else if (searchEngine.currentIndex === -1 && searchEngine.matches.length > 0) searchEngine.currentIndex = 0;

    renderHighlights();
}

// 核心：在畫面上塗上黃色與橘色高亮
function renderHighlights() {
    // ★ 多語言編輯模式：改由 4j 重畫行號高亮與命中計數
    if (typeof isLangEditView !== 'undefined' && isLangEditView && typeof langEditSearchPaint === 'function') { langEditSearchPaint(); return; }
    // ★ 跨句群組模式：改由 4i 重畫欄位高亮與命中計數
    if (typeof isMediaGroupsView !== 'undefined' && isMediaGroupsView && typeof mgSearchPaint === 'function') { mgSearchPaint(); return; }
    if (!searchEngine.query || searchEngine.matches.length === 0) {
        searchMatchCount.style.display = 'none';
        clearAllHighlights();
        return;
    }

    searchMatchCount.style.display = 'block';
    searchMatchCount.textContent = `${searchEngine.currentIndex + 1}/${searchEngine.matches.length}`;
    clearAllHighlights(); 

    if (isScriptModeActive()) {
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
            // ★ 新增：並排表格檢視 → 每個語言各自一格，命中位置本來就是「該語言片段內」的位置，逐格塗色
            if (typeof isLangTableView === 'function' && isLangTableView()) {
                const full = sentenceTextMap[label] || '';
                const byLang = {};
                labelMatches[label].forEach(m => { (byLang[m.langIdx] = byLang[m.langIdx] || []).push(m); });
                for (const li in byLang) {
                    const cell = itemDiv?.querySelector(`.sentence-text-display[data-lang-idx="${li}"]`);
                    if (!cell) continue; // 該語言欄位沒顯示在表格上（超過 3 欄時）
                    const seg = getLang(full, parseInt(li, 10));
                    let cHtml = ''; let cLast = 0;
                    byLang[li].forEach(m => {
                        cHtml += escapeHtml(seg.substring(cLast, m.start));
                        const markClass = m.globalIdx === searchEngine.currentIndex ? 'list-mark active' : 'list-mark';
                        cHtml += `<mark class="${markClass}">${escapeHtml(seg.substring(m.start, m.end))}</mark>`;
                        cLast = m.end;
                    });
                    cHtml += escapeHtml(seg.substring(cLast));
                    cell.innerHTML = cHtml;
                }
                searchPaintedLabels.add(label);
                continue;
            }
            const display = itemDiv?.querySelector('.sentence-text-display');
            if (!display) continue;
            
            // ★ 用「畫面上實際顯示的文字」來切割高亮，而不是完整的原始字串
            const text = getListDisplayText(label);
            let html = ''; let lastIdx = 0;
            
            labelMatches[label].forEach(m => {
                html += escapeHtml(text.substring(lastIdx, m.dStart));
                const markClass = m.globalIdx === searchEngine.currentIndex ? 'list-mark active' : 'list-mark';
                html += `<mark class="${markClass}">${escapeHtml(text.substring(m.dStart, m.dEnd))}</mark>`;
                lastIdx = m.dEnd;
            });
            html += escapeHtml(text.substring(lastIdx));
            display.innerHTML = html;
            searchPaintedLabels.add(label);
        }
    }
}

// 清除所有高亮痕跡 (保護原始資料)
function clearAllHighlights() {
    // ★ 還原「曾經塗過高亮的所有列」，而不只是目前這一輪命中的列，
    //   否則搜尋字串改變後，已不再命中的列會殘留舊的 <mark>
    const affectedLabels = new Set(searchPaintedLabels);
    if (searchEngine && searchEngine.matches) {
        searchEngine.matches.forEach(m => { if (m.label) affectedLabels.add(m.label); });
    }
    affectedLabels.forEach(label => {
        // ★ 新增：並排表格檢視 → 逐格還原成各語言片段
        if (typeof isLangTableView === 'function' && isLangTableView()) {
            const full = sentenceTextMap[label] || '';
            document.querySelectorAll(`#item-${label} .sentence-text-display[data-lang-idx]`).forEach(cell => {
                cell.textContent = getLang(full, parseInt(cell.dataset.langIdx, 10));
            });
            return;
        }
        const display = document.querySelector(`#item-${label} .sentence-text-display`);
        if (display) {
            // 直接從原始資料還原「畫面上該顯示的文字」，消除 <mark>
            display.textContent = getListDisplayText(label);
        }
    });
    searchPaintedLabels = new Set();
    
    // ★ 一併清除跨句群組欄位上的搜尋高亮（沒有高亮時什麼都不做）
    if (typeof mgSearchClearPaint === 'function') mgSearchClearPaint();
    
    // 處理劇本模式的背景
    const backdrop = document.getElementById('scriptBackdrop');
    if (backdrop) backdrop.innerHTML = '';
}

function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 捲動並選取目標
function scrollToCurrentMatch() {
    // ★ 多語言編輯模式：改由 4j 選取並捲動到命中位置
    if (typeof isLangEditView !== 'undefined' && isLangEditView && typeof langEditSearchScrollToCurrent === 'function') { langEditSearchScrollToCurrent(); return; }
    // ★ 跨句群組模式：捲動到命中的那一列
    if (typeof isMediaGroupsView !== 'undefined' && isMediaGroupsView && typeof mgSearchScrollToCurrent === 'function') { mgSearchScrollToCurrent(); return; }
    if (searchEngine.currentIndex === -1 || searchEngine.matches.length === 0) return;
    const match = searchEngine.matches[searchEngine.currentIndex];
    
    if (isScriptModeActive()) {
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

// ★ 搜尋視窗開著時，使用者切換「語言」檢視 → 搜尋範圍跟著換，重新掃描一次
//   （列表會被重繪，舊的高亮與命中位置都已失效）。setTimeout 0 確保排在 4a 的切換處理之後。
document.getElementById('langViewMenu')?.addEventListener('click', () => {
    setTimeout(() => {
        updateSearchScopeHint();
        if (batchReplaceModal?.classList.contains('show') && findTextInput && findTextInput.value) {
            updateSearchMatches();
        }
    }, 0);
});

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

// 依「命中清單」算出某一列取代後的完整字串：只改命中的那一段，其他語言原封不動
function buildTextAfterReplace(label, labelMatches, replaceStr) {
    const segs = searchSplit(sentenceTextMap[label] || '');
    // 同一個語言段落內，由後往前取代，前面的位置才不會被位移
    const ordered = [...labelMatches].sort((a, b) => (b.langIdx - a.langIdx) || (b.start - a.start));
    ordered.forEach(m => {
        while (segs.length <= m.langIdx) segs.push('');
        const seg = segs[m.langIdx];
        segs[m.langIdx] = seg.substring(0, m.start) + replaceStr + seg.substring(m.end);
    });
    return searchJoin(segs);
}

// 取代後同步更新該列的畫面（顯示「目前檢視語言」那一段）與資料
function refreshRowAfterReplace(label) {
    const full = sentenceTextMap[label] || '';
    const itemDiv = document.getElementById(`item-${label}`);
    if (itemDiv) {
        if (typeof isLangTableView === 'function' && isLangTableView()) {
            // ★ 新增：並排表格檢視 → 每一格各自顯示自己的語言片段，並更新空格樣式
            itemDiv.querySelectorAll('.sentence-text-display[data-lang-idx]').forEach(cell => {
                const seg = getLang(full, parseInt(cell.dataset.langIdx, 10));
                cell.textContent = seg;
                cell.classList.toggle('is-empty-cell', seg.trim() === '');
            });
        } else {
            const display = itemDiv.querySelector('.sentence-text-display');
            if (display) display.textContent = getListDisplayText(label);
        }
        itemDiv.dataset.rawText = full;
    }
    // ★ 效能優化：精準只更新這一個聲波圖標記的文字（傳入完整字串，由聲波圖自己依設定過濾語言）
    if (typeof updateRegionTextDisplay === 'function') {
        updateRegionTextDisplay(label, full);
    }
}

// 單步取代
replaceSingleBtn?.addEventListener('click', () => {
    // ★ 多語言編輯模式：改由 4j 處理（範圍限定所選欄位）
    if (typeof isLangEditView !== 'undefined' && isLangEditView && typeof langEditSearchReplaceSingle === 'function') { langEditSearchReplaceSingle(); return; }
    // ★ 跨句群組模式：只取代群組資料（備註、圖片網址）
    if (typeof isMediaGroupsView !== 'undefined' && isMediaGroupsView && typeof mgSearchReplaceSingle === 'function') { mgSearchReplaceSingle(); return; }
    // 動手前先重新掃描一次，避免使用者中途改過文字導致命中位置過期
    updateSearchMatches();
    if (searchEngine.matches.length === 0 || searchEngine.currentIndex === -1) return;
    const replaceStr = replaceTextInput.value;
    if (replaceStrBreaksLangStructure(replaceStr)) return warnReplaceHasDelimiter();
    if (typeof saveState === 'function') saveState();

    if (isScriptModeActive()) {
        const match = searchEngine.matches[searchEngine.currentIndex];
        const textarea = document.getElementById('scriptTextarea');
        const text = textarea.value;
        textarea.value = text.substring(0, match.start) + replaceStr + text.substring(match.end);
        if (typeof renderGutterAndSyncData === 'function') renderGutterAndSyncData();
    } else {
        const match = searchEngine.matches[searchEngine.currentIndex];
        sentenceTextMap[match.label] = buildTextAfterReplace(match.label, [match], replaceStr);
        refreshRowAfterReplace(match.label);
        saveToStorage();
    }
    updateSearchMatches(); scrollToCurrentMatch();
});

// 全部取代
batchReplaceConfirmBtn?.addEventListener('click', () => {
    // ★ 多語言編輯模式：改由 4j 處理（範圍限定所選欄位）
    if (typeof isLangEditView !== 'undefined' && isLangEditView && typeof langEditSearchReplaceAll === 'function') { langEditSearchReplaceAll(); return; }
    // ★ 跨句群組模式：只取代群組資料（備註、圖片網址）
    if (typeof isMediaGroupsView !== 'undefined' && isMediaGroupsView && typeof mgSearchReplaceAll === 'function') { mgSearchReplaceAll(); return; }
    updateSearchMatches(); // 動手前先重新掃描，確保命中位置是最新的
    if (searchEngine.matches.length === 0) return;
    const replaceStr = replaceTextInput.value;
    if (replaceStrBreaksLangStructure(replaceStr)) return warnReplaceHasDelimiter();
    if (typeof saveState === 'function') saveState();
    let count = searchEngine.matches.length;
    const scopeName = getSearchScopeName();

    if (isScriptModeActive()) {
        const textarea = document.getElementById('scriptTextarea');
        let text = textarea.value; let offset = 0;
        searchEngine.matches.forEach(m => {
            text = text.substring(0, m.start + offset) + replaceStr + text.substring(m.end + offset);
            offset += replaceStr.length - (m.end - m.start);
        });
        textarea.value = text;
        if (typeof renderGutterAndSyncData === 'function') renderGutterAndSyncData();
    } else {
        // 依句子分組，每句只組一次新字串、只更新一次畫面與聲波圖
        const matchesByLabel = {};
        searchEngine.matches.forEach(m => {
            if (!matchesByLabel[m.label]) matchesByLabel[m.label] = [];
            matchesByLabel[m.label].push(m);
        });

        Object.keys(matchesByLabel).forEach(label => {
            sentenceTextMap[label] = buildTextAfterReplace(label, matchesByLabel[label], replaceStr);
            refreshRowAfterReplace(label);
        });

        saveToStorage();
    }
    showToast(`替換完成！${scopeName ? `（${scopeName}）` : ''}共替換了 ${count} 處。`, 'success');
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


