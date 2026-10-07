// 4f_ui_import_search.js: 最大播放時長設定、批次匯入、匯入資料視窗、搜尋取代引擎、遺失音檔提示
// 依賴：1_globals.js 的 DOM 參照與全域狀態變數，需先載入。

// ---------- 最大播放時長設定 ----------
const enableMaxPlayCheck = document.getElementById('enableMaxPlayCheck');
const maxPlaySecondsInput = document.getElementById('maxPlaySecondsInput');

if (enableMaxPlayCheck && maxPlaySecondsInput) {
    enableMaxPlayCheck.checked = localStorage.getItem('tagger_enableMaxPlay') === 'true';
    const savedSec = localStorage.getItem('tagger_maxPlaySeconds');
    if (savedSec) maxPlaySecondsInput.value = savedSec;

    enableMaxPlayCheck.addEventListener('change', (e) => {
        localStorage.setItem('tagger_enableMaxPlay', e.target.checked ? 'true' : 'false');
    });
    maxPlaySecondsInput.addEventListener('change', (e) => {
        // 非合理數字時退回預設值 2
        let val = parseFloat(e.target.value);
        if (isNaN(val) || val <= 0) val = 2;
        e.target.value = val;
        localStorage.setItem('tagger_maxPlaySeconds', val);
    });
}

// ---------- 批次匯入 ----------
const openBatchImportBtn = document.getElementById('openBatchImportBtn');
const batchImportModal = document.getElementById('batchImportModalOverlay');
const tabLocalZip = document.getElementById('tabLocalZip');
const tabOnlineBatch = document.getElementById('tabOnlineBatch');
const sectionLocalZip = document.getElementById('sectionLocalZip');
const sectionOnlineBatch = document.getElementById('sectionOnlineBatch');

openBatchImportBtn?.addEventListener('click', () => {
    batchImportModal.classList.add('show');
});

document.getElementById('batchImportCancelBtn')?.addEventListener('click', () => {
    batchImportModal.classList.remove('show');
});

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

document.getElementById('batchImportConfirmBtn')?.addEventListener('click', async () => {
    const isLocalMode = sectionLocalZip.style.display !== 'none';
    const paddingSec = parseFloat(document.getElementById('batchSilencePadding').value) || 1.0;
    const autoPara = document.getElementById('batchAutoParaCheck').checked;

    if (isLocalMode) {
        const fileInput = document.getElementById('batchLocalFilesInput');
        const files = Array.from(fileInput.files);
        if (files.length === 0) return showToast('請先選擇檔案或 ZIP 壓縮檔', 'error');

        batchImportModal.classList.remove('show');

        try {
            let validAudioFiles = [];

            if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
                if (typeof JSZip === 'undefined') throw new Error("找不到 JSZip 解壓縮套件");
                showToast('正在解壓縮 ZIP 檔...', 'normal');
                const zip = new JSZip();
                const zipContent = await zip.loadAsync(files[0]);

                for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
                    // 只取音訊檔，排除 macOS 的 __MACOSX 隱藏項目
                    if (!zipEntry.dir && filename.match(/\.(mp3|wav|m4a|ogg|aac)$/i) && !filename.includes('__MACOSX')) {
                        const blob = await zipEntry.async('blob');
                        const pureName = filename.split('/').pop();
                        const file = new File([blob], pureName, { type: blob.type });
                        validAudioFiles.push(file);
                    }
                }
            } else {
                validAudioFiles = files.filter(f => f.name.match(/\.(mp3|wav|m4a|ogg|aac)$/i));
            }

            if (validAudioFiles.length === 0) return showToast('沒有找到支援的音訊檔案', 'error');
            if (validAudioFiles.length > 100) showToast('檔案數量龐大，處理可能需要較長時間，請勿關閉網頁', 'error');

            if (typeof saveState === 'function') saveState();

            // processBatchLocalFiles 定義於 2_audio_engine.js
            const result = await processBatchLocalFiles(validAudioFiles, paddingSec, autoPara);

            allLabelsOrdered = result.labels;
            sentenceTextMap = result.texts;
            timeDataMap = result.times;

            const mergedFileName = "批次合併音檔_" + Date.now() + ".wav";
            const mergedFile = new File([result.blob], mergedFileName, { type: 'audio/wav' });

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
        // 線上批次匯入尚未實作
        showToast('線上批次匯入功能即將推出！', 'normal');
    }
});

// 本機檔案選擇與線上網址模式變化時，更新批次合併設定區塊的顯示
const modalLocalFilesInput = document.getElementById('modalLocalFilesInput');
const onlineModeRadios = document.querySelectorAll('input[name="onlineMode"]');

if (modalLocalFilesInput) {
    modalLocalFilesInput.addEventListener('change', updateMergeSettingsVisibility);
}

if (onlineModeRadios.length > 0) {
    onlineModeRadios.forEach(radio => {
        radio.addEventListener('change', updateMergeSettingsVisibility);
    });
}

// ---------- 匯入資料視窗 ----------
const openDataModalBtn = document.getElementById('openDataModalBtn');
const dataImportModal = document.getElementById('dataImportModalOverlay');
const closeDataModalBtn = document.getElementById('closeDataModalBtn');
const dataLoadConfirmBtn = document.getElementById('dataLoadConfirmBtn');

const tabPasteText = document.getElementById('tabPasteText');
const tabImportFile = document.getElementById('tabImportFile');
const sectionPasteText = document.getElementById('sectionPasteText');
const sectionImportFile = document.getElementById('sectionImportFile');

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

// 原地預覽解析結果：把解析後的 TSV 寫回輸入框
const previewParseBtn = document.getElementById('previewParseBtn');
previewParseBtn?.addEventListener('click', () => {
    const rawTextInput = document.getElementById('rawTextInput');
    let rawText = rawTextInput.value.trim().replace(/\\n/g, '\n');
    if (!rawText) return showToast('請先貼上文字', 'error');

    // SRT 字幕或 Audacity 標籤：轉成「標籤/開始/結束/文字」表格預覽
    if (typeof looksLikeTimedText === 'function' && looksLikeTimedText(rawText)) {
        const kindName = looksLikeSrt(rawText) ? 'SRT 字幕' : 'Audacity 標籤';
        const tsv = timedTextToTsv(rawText);
        if (!tsv) return showToast(`讀不到有效的 ${kindName} 時間軸，請確認格式`, 'error');
        rawTextInput.value = tsv;
        return showToast(`已辨識為 ${kindName}！確認無誤後請點擊「確定載入」`, 'success');
    }

    // 已是含 Tab 的表格格式，不需再解析
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
                        // 吸收後續連續的標點
                        while (i + 1 < para.length && /[，。：；！？、．―─「」【】『』《》〈〉·"”'’?!.,\s]/.test(para[i+1])) {
                            let nextChar = para[i+1]; if (nextChar === '[') break;
                            if ((nextChar === '.' || nextChar === ',') && /\d/.test(para[i]) && i + 2 < para.length && /\d/.test(para[i+2])) break;
                            current += nextChar; i++;
                        }

                        if (current.trim()) {
                            // 純標點／符號的片段不獨立成句
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

    // 先移除沒有實際文字的句子（如整句只有括號註解），與「確定載入」的結果一致
    const compactPreview = (typeof compactParsedList === 'function')
        ? compactParsedList(tempLabels, tempTexts)
        : { labels: tempLabels, textMap: tempTexts };
    rawTextInput.value = compactPreview.labels.map(lbl => `${lbl}\t\t\t${compactPreview.textMap[lbl]}`).join('\n');
    showToast('已在原地解析！確認無誤後請點擊「確定載入」', 'success');
});

function updateDataFileHint() {
    const lastFile = localStorage.getItem('tagger_lastDataFile');
    const hintEl = document.getElementById('localDataFileHint');
    if (lastFile && hintEl) {
        hintEl.innerHTML = `<span class="material-icons" style="font-size: 1.1rem; margin-right: 4px;">warning</span> 上次匯入資料：「${escapeHtml(lastFile)}」，請確認是否需重新選取`;
        hintEl.style.display = 'flex';
    }
}

// 開啟視窗時一併更新上次匯入檔案的提示
openDataModalBtn?.addEventListener('click', () => {
    dataImportModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    updateDataFileHint();
});

// 確定載入：依頁籤分流
dataLoadConfirmBtn?.addEventListener('click', () => {
    const isPasteMode = sectionPasteText.style.display !== 'none';

    if (isPasteMode) {
        if (document.getElementById('rawTextInput').value.trim() !== '') {
            if(typeof saveState === 'function') saveState();
            if(typeof triggerParseAction === 'function') triggerParseAction();
            closeDataModal();
        } else {
            showToast('請先貼上文字並點擊預覽解析', 'error');
        }
    } else {
        const fileInput = document.getElementById('modalDataFileInput');
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            return showToast('請先選擇檔案', 'error');
        }

        const file = fileInput.files[0];
        const ext = file.name.split('.').pop().toLowerCase();

        localStorage.setItem('tagger_lastDataFile', file.name);

        // 透過 DataTransfer 把檔案轉交給對應的隱藏輸入框
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
                // 沒有 Audacity 輸入框時，直接把純文字交給解析
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

        closeDataModal();
    }
});

// 選擇外部檔案後自動關閉視窗
const autoCloseInputs = ['importProjectInput', 'importSrtInput', 'importAudacityInput'];
autoCloseInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
        if (el.files.length > 0) closeDataModal();
    });
});

// ---------- 即時高亮搜尋與取代引擎 ----------
// 搜尋／取代範圍跟隨列表右上角的「語言」檢視：
//   檢視「語言N」：只比對、取代第 N 語言那一段，其他語言不動（寫回走 setLang）
//   檢視「全部語言」：整串以 splitLangs 切開，各語言各自比對，命中不跨分隔字元
//   全文模式：畫面顯示整串原始文字（含分隔字元），維持整串比對
//   取代文字若含分隔字元會破壞語言結構，直接擋下
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

// 單句模式的命中：{ label, langIdx, start, end, dStart, dEnd }
//   start/end   相對於該語言那一段（取代用）
//   dStart/dEnd 相對於畫面顯示的文字（高亮用）
// 全文模式的命中：{ start, end }，相對於整個 textarea
let searchEngine = { query: '', useRegex: false, matches: [], currentIndex: -1 };
// 目前被塗上高亮的列，重繪前據此還原，避免舊高亮殘留
let searchPaintedLabels = new Set();

function isScriptModeActive() {
    return (typeof isScriptMode !== 'undefined' && isScriptMode);
}
function isLangMultiOn() {
    return (typeof getLangMultiEnabled === 'function') && getLangMultiEnabled();
}
// 列表目前的語言檢視索引：null = 全部語言，數字 = 第 N 語言（與 renderSentenceList 一致）
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
// 某列在列表上實際顯示的文字
function getListDisplayText(label) {
    const full = sentenceTextMap[label] || '';
    const idx = getSearchLangViewIndex();
    return (idx !== null && typeof getLang === 'function') ? getLang(full, idx) : full;
}
// 搜尋範圍名稱；未啟用多語或全文模式時回傳空字串
function getSearchScopeName() {
    if (isScriptModeActive() || !isLangMultiOn()) return '';
    const idx = getSearchLangViewIndex();
    if (idx === null) return '全部語言';
    return (typeof getLangName === 'function') ? getLangName(idx) : `語言${idx + 1}`;
}
function updateSearchScopeHint() {
    if (!findTextInput) return;
    // 跨句範圍模式的提示文字由 4i 處理
    if (typeof isMediaGroupsView !== 'undefined' && isMediaGroupsView && typeof mgSearchUpdateUI === 'function') { mgSearchUpdateUI(); return; }
    const scope = getSearchScopeName();
    findTextInput.placeholder = scope ? `尋找目標（${scope}）` : findPlaceholderDefault;
}
function replaceStrBreaksLangStructure(replaceStr) {
    if (isScriptModeActive() || !isLangMultiOn() || typeof getLangDelimiter !== 'function') return false;
    return String(replaceStr).includes(getLangDelimiter());
}
function warnReplaceHasDelimiter() {
    showToast(`取代文字含有語言分隔字元「${getLangDelimiter()}」，會破壞多語言結構，已取消取代`, 'error');
}

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

openBatchReplaceBtn?.addEventListener('click', () => {
    batchReplaceModal.classList.add('show');
    updateSearchScopeHint();
    setTimeout(() => { findTextInput.focus(); findTextInput.select(); }, 100);
});
batchReplaceCancelBtn?.addEventListener('click', () => {
    batchReplaceModal.classList.remove('show');
    searchEngine.query = '';
    clearAllHighlights();
});

// 掃描並更新所有命中位置
function updateSearchMatches() {
    // 多語言編輯模式由 4j_ui_lang_edit.js 處理
    if (typeof isLangEditView !== 'undefined' && isLangEditView && typeof langEditSearchScan === 'function') { langEditSearchScan(); return; }
    // 跨句範圍模式由 4i_ui_media_groups.js 處理
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
        const text = document.getElementById('scriptTextarea')?.value || '';
        searchEngine.matches = findMatchesInString(text, findStr, searchRegex);
    } else {
        const viewIdx = getSearchLangViewIndex();
        const delimLen = (isLangMultiOn() && typeof getLangDelimiter === 'function') ? getLangDelimiter().length : 0;

        allLabelsOrdered.forEach(label => {
            const full = sentenceTextMap[label] || '';

            if (viewIdx !== null && typeof getLang === 'function') {
                // 單一語言檢視：畫面顯示的就是該段，位置不需換算
                const seg = getLang(full, viewIdx);
                findMatchesInString(seg, findStr, searchRegex).forEach(m => {
                    searchEngine.matches.push({ label, langIdx: viewIdx, start: m.start, end: m.end, dStart: m.start, dEnd: m.end });
                });
            } else {
                // 全部語言檢視：畫面顯示整串，高亮位置需加上該語言在整串中的起點
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

// 在畫面上塗上高亮（目前命中為橘色，其餘為黃色）
function renderHighlights() {
    if (typeof isLangEditView !== 'undefined' && isLangEditView && typeof langEditSearchPaint === 'function') { langEditSearchPaint(); return; }
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
            // 並排表格檢視：每個語言一格，命中位置為該語言片段內的位置，逐格塗色
            if (typeof isLangTableView === 'function' && isLangTableView()) {
                const full = sentenceTextMap[label] || '';
                const byLang = {};
                labelMatches[label].forEach(m => { (byLang[m.langIdx] = byLang[m.langIdx] || []).push(m); });
                for (const li in byLang) {
                    const cell = itemDiv?.querySelector(`.sentence-text-display[data-lang-idx="${li}"]`);
                    if (!cell) continue; // 超過 3 欄時該語言沒有顯示在表格上
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

            // 以畫面實際顯示的文字切割高亮，不用完整原始字串
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

// 清除高亮並從原始資料還原文字
function clearAllHighlights() {
    // 還原所有曾塗過高亮的列，否則搜尋字串改變後已不命中的列會殘留舊 <mark>
    const affectedLabels = new Set(searchPaintedLabels);
    if (searchEngine && searchEngine.matches) {
        searchEngine.matches.forEach(m => { if (m.label) affectedLabels.add(m.label); });
    }
    affectedLabels.forEach(label => {
        if (typeof isLangTableView === 'function' && isLangTableView()) {
            const full = sentenceTextMap[label] || '';
            document.querySelectorAll(`#item-${label} .sentence-text-display[data-lang-idx]`).forEach(cell => {
                cell.textContent = getLang(full, parseInt(cell.dataset.langIdx, 10));
            });
            return;
        }
        const display = document.querySelector(`#item-${label} .sentence-text-display`);
        if (display) {
            display.textContent = getListDisplayText(label);
        }
    });
    searchPaintedLabels = new Set();

    if (typeof mgSearchClearPaint === 'function') mgSearchClearPaint();

    const backdrop = document.getElementById('scriptBackdrop');
    if (backdrop) backdrop.innerHTML = '';
}

function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 捲動並選取目前命中
function scrollToCurrentMatch() {
    if (typeof isLangEditView !== 'undefined' && isLangEditView && typeof langEditSearchScrollToCurrent === 'function') { langEditSearchScrollToCurrent(); return; }
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

// 搜尋視窗開著時切換語言檢視：列表會重繪，舊高亮與命中位置失效，需重新掃描。
// setTimeout 0 確保排在 4a 的切換處理之後
document.getElementById('langViewMenu')?.addEventListener('click', () => {
    setTimeout(() => {
        updateSearchScopeHint();
        if (batchReplaceModal?.classList.contains('show') && findTextInput && findTextInput.value) {
            updateSearchMatches();
        }
    }, 0);
});

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

// 算出某列取代後的完整字串：只改命中的段落，其他語言不動
function buildTextAfterReplace(label, labelMatches, replaceStr) {
    const segs = searchSplit(sentenceTextMap[label] || '');
    // 由後往前取代，前面的位置才不會位移
    const ordered = [...labelMatches].sort((a, b) => (b.langIdx - a.langIdx) || (b.start - a.start));
    ordered.forEach(m => {
        while (segs.length <= m.langIdx) segs.push('');
        const seg = segs[m.langIdx];
        segs[m.langIdx] = seg.substring(0, m.start) + replaceStr + seg.substring(m.end);
    });
    return searchJoin(segs);
}

// 取代後更新該列畫面與聲波圖標記文字
function refreshRowAfterReplace(label) {
    const full = sentenceTextMap[label] || '';
    const itemDiv = document.getElementById(`item-${label}`);
    if (itemDiv) {
        if (typeof isLangTableView === 'function' && isLangTableView()) {
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
    // 只更新單一聲波標記；傳入完整字串，由聲波圖依設定過濾語言
    if (typeof updateRegionTextDisplay === 'function') {
        updateRegionTextDisplay(label, full);
    }
}

replaceSingleBtn?.addEventListener('click', () => {
    if (typeof isLangEditView !== 'undefined' && isLangEditView && typeof langEditSearchReplaceSingle === 'function') { langEditSearchReplaceSingle(); return; }
    if (typeof isMediaGroupsView !== 'undefined' && isMediaGroupsView && typeof mgSearchReplaceSingle === 'function') { mgSearchReplaceSingle(); return; }
    // 動手前重新掃描，避免使用者中途改過文字導致命中位置過期
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

batchReplaceConfirmBtn?.addEventListener('click', () => {
    if (typeof isLangEditView !== 'undefined' && isLangEditView && typeof langEditSearchReplaceAll === 'function') { langEditSearchReplaceAll(); return; }
    if (typeof isMediaGroupsView !== 'undefined' && isMediaGroupsView && typeof mgSearchReplaceAll === 'function') { mgSearchReplaceAll(); return; }
    updateSearchMatches();
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

// ---------- 側邊欄捷徑 ----------
// 先關閉側邊欄，等 300ms 動畫結束再開啟目標視窗
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

// ---------- 遺失音檔提示：點擊直接開啟選擇視窗 ----------
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
