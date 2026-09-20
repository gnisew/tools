// ================= 修改優化：動態按鈕顯示與隱藏防呆邏輯 =================
// ================= 修改優化：動態按鈕顯示與隱藏防呆邏輯 =================
function checkButtonVisibility() {
    const hasRegions = typeof allLabelsOrdered !== 'undefined' && allLabelsOrdered.length > 0;
    
    // ★ 修復：「依靜音斷句」按鈕的啟用/停用狀態，統一交給 updateToolbarButtons() 判斷（唯一事實來源）。
    // 原本這裡用另一套規則（看句子列、看 tempRegion）直接改 disabled，每次存檔/重繪都會執行，
    // 會把 updateToolbarButtons() 剛設好的狀態蓋掉，造成有選取標記卻點不了、或沒標記卻被停用。
    if (typeof updateToolbarButtons === 'function') updateToolbarButtons();

    const hasAudio = localStorage.getItem('tagger_audioUrl') || localStorage.getItem('tagger_localFileName');
    const mainTitleDisplay = document.getElementById('mainTitleDisplay');
    
    if (!hasAudio && !hasRegions) {
        document.body.classList.add('is-empty-state');
        if (mainTitleDisplay) mainTitleDisplay.contentEditable = "false"; // ★ 進入首頁時，禁止編輯
    } else {
        document.body.classList.remove('is-empty-state');
        if (mainTitleDisplay) mainTitleDisplay.contentEditable = "true";  // ★ 開始工作時，恢復可編輯
    }
}
// =========================================================================
// ================= ★ 效能優化：存檔防抖機制 (Debounce) ★ =================
let saveStorageTimeout = null;

function saveToStorage() {
    clearTimeout(saveStorageTimeout);
    saveStorageTimeout = setTimeout(() => {
        try {
            localStorage.setItem('tagger_allLabels', JSON.stringify(allLabelsOrdered));
            localStorage.setItem('tagger_textMap', JSON.stringify(sentenceTextMap));
            localStorage.setItem('tagger_timeDataMap', JSON.stringify(timeDataMap));
            localStorage.setItem('tagger_parseMode', currentParseMode); 
        } catch (err) {
            // ★ 修補：容量爆滿或其他寫入失敗時，明確提示使用者，避免編輯內容悄悄遺失
            console.error('存檔失敗：', err);
            if (typeof showToast === 'function') showToast('存檔失敗！瀏覽器儲存空間可能已滿，請盡快匯出備份', 'error');
        }
        if (typeof checkButtonVisibility === 'function') checkButtonVisibility();
    }, 500); 
}

// 防護機制：確保使用者直接關閉分頁時，如果還有在倒數中的存檔，能強制寫入
window.addEventListener('beforeunload', () => {
    if (saveStorageTimeout) {
        clearTimeout(saveStorageTimeout);
        try {
            localStorage.setItem('tagger_allLabels', JSON.stringify(allLabelsOrdered));
            localStorage.setItem('tagger_textMap', JSON.stringify(sentenceTextMap));
            localStorage.setItem('tagger_timeDataMap', JSON.stringify(timeDataMap));
            localStorage.setItem('tagger_parseMode', currentParseMode); 
        } catch (err) {
            console.error('關閉頁面前強制存檔失敗：', err);
        }
    }
});

window.showMissingAudioUI = function(fileName, isTrimmed = false) {
    const missingAudioWarning = document.getElementById('missingAudioWarning');
    const missingAudioName = document.getElementById('missingAudioName');
    const missingAudioTrimmedNote = document.getElementById('missingAudioTrimmedNote');
    const stickyPanel = document.getElementById('stickyPanel');
    const compactControls = document.getElementById('compactControls');
    const waveform = document.getElementById('waveform');

    if (missingAudioWarning && missingAudioName && stickyPanel) {
        missingAudioName.textContent = fileName;
        // ★ 新增：有修剪過的話，額外顯示「（有修剪）」註記
        if (missingAudioTrimmedNote) missingAudioTrimmedNote.textContent = isTrimmed ? '（有修剪）' : '';
        missingAudioWarning.style.display = 'block';
        stickyPanel.style.display = 'block'; // 展開吸頂面板
        
        if (waveform) waveform.style.display = 'none'; // 隱藏空白聲波圖
        if (compactControls) {
            compactControls.style.display = 'flex';
            compactControls.style.opacity = '0.4'; // 控制列變半透明
            compactControls.style.pointerEvents = 'none'; // 禁用控制列點擊
        }
    }
};

function loadFromStorage() {
    if (typeof loadShortcuts === 'function') loadShortcuts();
    const savedLabels = localStorage.getItem('tagger_allLabels');
    const savedTextMap = localStorage.getItem('tagger_textMap');
    const savedMap = localStorage.getItem('tagger_timeDataMap');
    const savedUrl = localStorage.getItem('tagger_audioUrl');
    const savedParseMode = localStorage.getItem('tagger_parseMode');
    const audioType = localStorage.getItem('tagger_audioType');
    const localFileName = localStorage.getItem('tagger_localFileName');
    // ★ 新增：優先使用原始檔名（不受剪裁影響），並讀取是否修剪過的標記
    const originalFileName = localStorage.getItem('tagger_originalFileName') || localFileName;
    const isTrimmed = localStorage.getItem('tagger_isTrimmed') === 'true';

    const savedScrollAlign = localStorage.getItem('tagger_scrollAlign');
    if (savedScrollAlign && typeof scrollAlignSelect !== 'undefined' && scrollAlignSelect) {
        scrollAlignSelect.value = savedScrollAlign;
    }
    if (savedParseMode) currentParseMode = savedParseMode;
    
    if (savedMap) { try { timeDataMap = JSON.parse(savedMap); } catch (e) { timeDataMap = {}; } }
    if (savedLabels && savedTextMap) {
        try {
            allLabelsOrdered = JSON.parse(savedLabels); 
            sentenceTextMap = JSON.parse(savedTextMap);
        } catch (e) { console.error('還原資料失敗', e); }
    }

    if ((allLabelsOrdered.length > 0 || localFileName || savedUrl) && typeof renderSentenceList === 'function') {
        renderSentenceList(); 
    }

    // ★ 修改：呼叫我們剛剛寫好的共用引擎
    if (audioType === 'local' && localFileName) {
        const localFileHint = document.getElementById('localFileHint');

        // 找不到 IndexedDB 備份時的最終備援：顯示「請重新選取」的防呆畫面
        const fallbackToReselect = () => {
            if (localFileHint) {
                const trimmedNote = isTrimmed ? '（有修剪）' : '';
                localFileHint.innerHTML = `<span class="material-icons" style="font-size: 1rem;">warning</span> 上次音檔：「${escapeHtml(originalFileName)}」${trimmedNote}，請重新選取`;
                localFileHint.style.display = 'inline-flex';
            }
            window.showMissingAudioUI(originalFileName, isTrimmed);
        };

        // ★ 新增：先嘗試從 IndexedDB 背景讀回音檔本體。讀到就直接自動掛回播放器，
        // 使用者完全不需要重新選檔；讀不到（例如這是加入本功能前就存在的舊專案、
        // 無痕模式、或使用者手動清過瀏覽器資料）才退回原本「請重新選取」的畫面。
        if (typeof AudioStore !== 'undefined' && AudioStore.isSupported()) {
            AudioStore.load().then(rec => {
                if (rec && rec.blob) {
                    audioPlayer.src = URL.createObjectURL(rec.blob);
                    audioPlayer.load();
                    if (typeof initWaveSurfer === 'function') initWaveSurfer();
                    if (localFileHint) localFileHint.style.display = 'none';
                    showToast('已自動還原上次的音檔', 'success');
                } else {
                    fallbackToReselect();
                }
            }).catch(fallbackToReselect);
        } else {
            fallbackToReselect();
        }

    } else if (savedUrl) {
        const modalSingleUrlInput = document.getElementById('modalSingleUrlInput');
        if (modalSingleUrlInput) modalSingleUrlInput.value = savedUrl; 
        
        audioPlayer.src = savedUrl; 
        if (typeof initWaveSurfer === 'function') initWaveSurfer(); 
    }

    if (typeof checkButtonVisibility === 'function') checkButtonVisibility();
}

// ★ 新增：整理解析出來的句子列表 —— 移除「沒有實際文字」的句子（例如整句只有括號註解，
// 括號內容會被移除而變成空白），避免產生無意義的空白列；並重新排號，段落字母也保持連續。
function compactParsedList(labels, textMap) {
    const counters = {};
    const prefixMap = {}; // 舊段落字母 → 新段落字母（略過整段都被移除的段落）
    let prefixCount = 0;
    const outLabels = [];
    const outMap = {};
    labels.forEach(lbl => {
        const text = textMap[lbl] || '';
        if (text.trim() === '') return;
        const m = lbl.match(/^([A-Z]*)(\d+)$/);
        let prefix = m ? m[1] : lbl.charAt(0);
        if (prefix !== '') {
            if (prefixMap[prefix] === undefined) prefixMap[prefix] = String.fromCharCode(65 + prefixCount++);
            prefix = prefixMap[prefix];
        }
        counters[prefix] = (counters[prefix] || 0) + 1;
        const newLabel = prefix + String(counters[prefix]).padStart(2, '0');
        outLabels.push(newLabel);
        outMap[newLabel] = text;
    });
    return { labels: outLabels, textMap: outMap };
}

// ★ 新增：把既有的聲波標記「依序」貼到新解析出的句子列表上，規則如下：
//   句子 > 標記：保留全部句子，最後幾句沒有標記（不多補任何空白列）
//   句子 < 標記：保留全部標記，只為「沒有句子可放」的標記各補一列空白列（數量 = 標記數 − 句子數）
//   句子 = 標記：一一對應，沒有空白列
// 會直接在 labels / textMap 後面補上空白列，並回傳 { timeMap, extraRows, sentenceCount }。
function attachMarkersToParsedList(labels, textMap, markers) {
    const timeMap = {};
    const sentenceCount = labels.length;
    let markerIndex = 0;
    for (let i = 0; i < labels.length && markerIndex < markers.length; i++) {
        timeMap[labels[i]] = markers[markerIndex].time;
        markerIndex++;
    }

    let extraRows = 0;
    if (markerIndex < markers.length) {
        const last = labels.length > 0 ? labels[labels.length - 1] : 'A00';
        const m = last.match(/^([A-Z]*)(\d+)$/);
        const prefix = m ? m[1] : 'A';
        let n = m ? parseInt(m[2], 10) : 0;
        while (markerIndex < markers.length) {
            let label;
            do { n++; label = prefix + String(n).padStart(2, '0'); } while (textMap[label] !== undefined);
            labels.push(label);
            textMap[label] = '';
            timeMap[label] = markers[markerIndex].time;
            markerIndex++;
            extraRows++;
        }
    }
    return { timeMap, extraRows, sentenceCount };
}

function executeParsing() {
    let rawText = rawTextInput.value.trim(); 
    rawText = rawText.replace(/\\n/g, '\n'); 
    const parseMode = currentParseMode;
    const rawLines = rawText.split(/\r?\n/).filter(p => p.trim() !== ''); 
    const isTSV = rawLines.some(line => /^[A-Z]\d{2,}\t/.test(line));

    // ★ 修改：先「循序」備份現有的聲波標記（移到最前面，兩種路徑都要用）
    const existingMarkers = allLabelsOrdered
        .map(lbl => ({ time: timeDataMap[lbl] }))
        .filter(m => m.time !== undefined);

    // ★ 新增：TSV 是否真的帶有時間。「預覽解析」產生的表格（A01<Tab><Tab><Tab>文字）沒有任何時間，
    // 過去會被當成完整試算表整份覆寫，導致既有的聲波標記全部消失；現在改視為純文字句子列表。
    const tsvHasTime = isTSV && rawLines.some(line => {
        if (!/^[A-Z]\d{2,}\t/.test(line)) return false;
        const p = line.split('\t');
        return p.length >= 4 && !isNaN(parseFloat(p[1]));
    });

    if (isTSV && tsvHasTime) {
        // TSV 本身包含時間與文字，所以直接覆寫全部資料
        sentenceTextMap = {}; allLabelsOrdered = []; timeDataMap = {};
        let currentParaLetter = ''; let paraIndex = -1;
        rawLines.forEach((line) => {
            if (!/^[A-Z]\d{2,}\t/.test(line)) return; 
            const parts = line.split('\t');
            if (parts.length >= 4) {
                const label = parts[0].trim(); const start = parseFloat(parts[1]); let endVal = parts[2].trim();
                const end = (endVal === 'null' || endVal === '') ? null : parseFloat(endVal); const text = parts.slice(3).join('\t').trim();
                const letter = label.charAt(0);
                if (letter !== currentParaLetter) { currentParaLetter = letter; paraIndex++; }
                allLabelsOrdered.push(label); sentenceTextMap[label] = text.replace(/\([^)]+\)/g, '');
                if (!isNaN(start)) timeDataMap[label] = { start: start, end: isNaN(end) ? null : end };
            }
        }); 
        showToast('已成功載入試算表資料！', 'success');
    } else {
        // ★ 一般文字解析（既有的聲波標記已在上方備份）
        let newLabels = [];
        let newTextMap = {};

        // 進行文字解析...
        if (isTSV) {
            // ★ 新增：沒有時間的 TSV（預覽解析的輸出）→ 取出標籤與文字，當作純文字句子列表
            rawLines.forEach(line => {
                if (!/^[A-Z]\d{2,}\t/.test(line)) return;
                const parts = line.split('\t');
                if (parts.length >= 4) {
                    const label = parts[0].trim();
                    newLabels.push(label);
                    newTextMap[label] = parts.slice(3).join('\t').trim().replace(/\([^)]+\)/g, '');
                }
            });
        } else if (parseMode === 'newline') {
            rawLines.forEach((line, index) => { 
                const label = String(index + 1).padStart(2, '0'); 
                newLabels.push(label); 
                newTextMap[label] = line.replace(/\([^)]+\)/g, ''); 
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
                    const sentNumber = String(sentIndex + 1).padStart(2, '0'); 
                    const label = `${paraLetter}${sentNumber}`; 
                    newLabels.push(label); 
                    newTextMap[label] = sentence.replace(/\([^)]+\)/g, ''); 
                });
            });
        } else { // punct 模式
            const paragraphs = rawLines;
            paragraphs.forEach((para, paraIndex) => {
                const paraLetter = String.fromCharCode(65 + paraIndex); 
                let sentences = []; let current = ''; let inBrackets = false;
                
                for (let i = 0; i < para.length; i++) {
                    let char = para[i]; current += char;
                    if (char === '[') inBrackets = true; if (char === ']') inBrackets = false;
                    
                    if (!inBrackets && /[，。：；！？、．―─「」【】『』《》〈〉·?!.,]/.test(char)) {
                        let isDecimal = false;
                        if ((char === '.' || char === ',') && i > 0 && i < para.length - 1) { 
                            if (/\d/.test(para[i-1]) && /\d/.test(para[i+1])) isDecimal = true; 
                        }
                        
                        if (!isDecimal) {
                            // 貪婪吸收後續的連續標點符號與空白，確保 ？」 或 ：「 不會被拆開
                            while (i + 1 < para.length && /[，。：；！？、．―─「」【】『』《》〈〉·"”'’?!.,\s]/.test(para[i+1])) {
                                let nextChar = para[i+1]; if (nextChar === '[') break; 
                                if ((nextChar === '.' || nextChar === ',') && /\d/.test(para[i]) && i + 2 < para.length && /\d/.test(para[i+2])) break;
                                current += nextChar; i++;
                            }
                            
                            // ★ 核心修復：防呆檢查
                            if (current.trim()) {
                                // 利用 Unicode 特性，如果這段字串「全是標點符號或空白」，就不斷句，繼續收集下一個字
                                if (/^[\p{P}\p{S}\s]+$/u.test(current)) {
                                    // 保留 current，什麼都不做
                                } else {
                                    sentences.push(current.trim()); 
                                    current = '';
                                }
                            }
                        }
                    }
                }
                
                // 將段落最後剩下的文字處理好
                if (current.trim()) {
                    if (/^[\p{P}\p{S}\s]+$/u.test(current) && sentences.length > 0) {
                        // 如果最後只剩標點，接回上一句
                        sentences[sentences.length - 1] += current.trim();
                    } else {
                        sentences.push(current.trim()); 
                    }
                }
                if (sentences.length === 0) sentences = [para];
                
                // 依序寫入資料庫
                sentences.forEach((sentence, sentIndex) => { 
                    const sentNumber = String(sentIndex + 1).padStart(2, '0'); 
                    const label = `${paraLetter}${sentNumber}`; 
                    newLabels.push(label); 
                    newTextMap[label] = sentence.replace(/\([^)]+\)/g, ''); 
                });
            });
        }

        // ★ 修改：先移除沒有實際文字的句子（避免無意義的空白列），再把既有標記依序貼上：
        //   句子多於標記 → 保持句子數，最後幾句沒有標記
        //   句子少於標記 → 保持標記數，只為多出來的標記在末端補空白列
        const compact = compactParsedList(newLabels, newTextMap);
        newLabels = compact.labels;
        newTextMap = compact.textMap;

        const attached = attachMarkersToParsedList(newLabels, newTextMap, existingMarkers);

        // 寫入全域變數
        allLabelsOrdered = newLabels;
        sentenceTextMap = newTextMap;
        timeDataMap = attached.timeMap;

        const S = attached.sentenceCount;
        const M = existingMarkers.length;
        if (M === 0) {
            showToast(`文章解析完成！共 ${S} 句`, 'success');
        } else if (S > M) {
            showToast(`文章解析完成！共 ${S} 句，${M} 個聲波標記已依序套用，最後 ${S - M} 句尚未標記`, 'success');
        } else if (S < M) {
            showToast(`文章解析完成！共 ${S} 句，${M} 個聲波標記全數保留（末端補 ${M - S} 列空白列承接多出的標記）`, 'success');
        } else {
            showToast(`文章解析完成！${S} 句與 ${M} 個聲波標記一一對應`, 'success');
        }
    }
    
    // 渲染畫面並存檔
    renderSentenceList(); 
    if (typeof renderAllRegions === 'function') renderAllRegions(); // 確保聲波圖也跟著更新標籤顯示
    saveToStorage(); 
    rawTextInput.value = ''; 
}


function triggerParseAction() {
    if (!rawTextInput.value.trim()) return showToast('請先輸入文章！', 'error');
    if (allLabelsOrdered.length > 0) {
        showCustomDialog({ title: '覆寫確認', message: '目前已經有解析好的句子列表。重新解析將會清空目前的修改紀錄，確定繼續嗎？', onConfirm: () => executeParsing() });
    } else executeParsing();
}

// ★ 新增：依時間先後，找出新標記（新列）應該插入的位置
// 原本沒有更晚的標記時，會把新列插在整個列表的最尾端；但列表尾端常有
// 「還沒標記時間的文字列」，新列插在它們後面，reassignLabels 依序分配時間時，
// 標記會落到前面的文字列上，新列反而變成沒有標記的空白列。
// 現在改為：插在「最後一個有標記的列」之後，讓新列與標記保持在一起。
function findChronologicalInsertIndex(start) {
    let insertIndex = -1;
    let lastMarkedIndex = -1;
    for (let i = 0; i < allLabelsOrdered.length; i++) {
        const lbl = allLabelsOrdered[i];
        if (timeDataMap[lbl]) {
            const lblStart = typeof timeDataMap[lbl] === 'object' ? timeDataMap[lbl].start : timeDataMap[lbl];
            if (lblStart > start) { insertIndex = i; break; }
            lastMarkedIndex = i;
        }
    }
    return insertIndex === -1 ? lastMarkedIndex + 1 : insertIndex; // 完全沒有任何標記時 = 0（插在最上面）
}

// ★ 新增：一次為多個時間範圍各新增一列空白句子（供「依靜音／等長斷句」使用）
// timeList 需依開始時間由小到大排列；全部插入完才呼叫一次 reassignLabels()。
function addRowsForTimes(timeList) {
    if (!Array.isArray(timeList) || timeList.length === 0) return;
    timeList.forEach((t, i) => {
        const idx = findChronologicalInsertIndex(t.start);
        let prefix = 'A';
        if (idx > 0) prefix = allLabelsOrdered[idx - 1].charAt(0);
        else if (allLabelsOrdered.length > 0) prefix = allLabelsOrdered[0].charAt(0);
        const tempLabel = prefix + '_TEMP_' + Date.now() + '_' + i;
        allLabelsOrdered.splice(idx, 0, tempLabel);
        sentenceTextMap[tempLabel] = '';
        timeDataMap[tempLabel] = { start: parseFloat(t.start.toFixed(3)), end: parseFloat(t.end.toFixed(3)) };
    });
    reassignLabels(); // 內含存檔、重繪列表，全文模式下也會同步重繪大編輯框
}

// ★ 新增：在列表最後面補上空白句子列，專門承接「沒有列可放」的時間標記（不會遺失資料）
function appendBlankRowsWithTimes(timeList) {
    let pChar = 'A';
    let n = 0;
    if (allLabelsOrdered.length > 0) {
        const last = allLabelsOrdered[allLabelsOrdered.length - 1];
        pChar = last.charAt(0);
        n = parseInt(last.slice(1), 10) || 0;
    }
    timeList.forEach(t => {
        let label;
        do { n++; label = pChar + String(n).padStart(2, '0'); } while (allLabelsOrdered.includes(label));
        allLabelsOrdered.push(label);
        sentenceTextMap[label] = '';
        timeDataMap[label] = t;
    });
}

// ★ 新增：「不新增列」模式 —— 把新的時間範圍套用到「既有的列」
// 適用情境：文字已經分好句子，只是來對時間。
//   1. opts.preferActiveLabel 為 true 且目前選中的句子尚未標記 → 直接套用給它
//   2. 否則放在「最後一個開始時間不晚於新標記的列」的下一列，
//      該處起的既有標記依序往後順延（骨牌推移）
//   3. 列表完全沒有列、或列數不足以承接全部標記時，才在最後補空白列承接，
//      不會像舊版那樣把溢出的標記直接捨棄
// 只負責改資料；重繪聲波標記與時間顯示由呼叫端處理。
function applyTimeToExistingRows(start, end, opts = {}) {
    const newTime = { start: parseFloat(start.toFixed(3)), end: parseFloat(end.toFixed(3)) };
    const lead = opts.lead || '已套用'; // 提示訊息開頭，讓不同操作（切割／新增標記）顯示各自的說明

    // 1. 選中的句子尚未標記 → 直接套用
    if (opts.preferActiveLabel && currentActiveLabel
        && allLabelsOrdered.includes(currentActiveLabel) && !timeDataMap[currentActiveLabel]) {
        timeDataMap[currentActiveLabel] = newTime;
        showToast(`${lead}至 ${currentActiveLabel}`, 'success');
        return;
    }

    // 2. 列表完全是空的：沒有任何列可以承接，只好新增一列
    if (allLabelsOrdered.length === 0) {
        addRowsForTimes([newTime]);
        showToast(`${lead}；列表是空的，已新增一列承接`, 'success');
        return;
    }

    // 3. 骨牌推移：從「最後一個開始時間不晚於新標記的列」的下一列開始
    let insertIdx = 0;
    for (let i = 0; i < allLabelsOrdered.length; i++) {
        const lbl = allLabelsOrdered[i];
        if (timeDataMap[lbl]) {
            const lblStart = typeof timeDataMap[lbl] === 'object' ? timeDataMap[lbl].start : timeDataMap[lbl];
            if (lblStart <= newTime.start) insertIdx = i + 1;
        }
    }

    const timesToReassign = [newTime];
    for (let i = insertIdx; i < allLabelsOrdered.length; i++) {
        const lbl = allLabelsOrdered[i];
        if (timeDataMap[lbl]) {
            timesToReassign.push(timeDataMap[lbl]);
            delete timeDataMap[lbl]; // 先從原地拔除，稍後依序貼回
        }
    }

    let assignIdx = insertIdx;
    const overflow = [];
    let firstLabel = null;
    timesToReassign.forEach(t => {
        if (assignIdx < allLabelsOrdered.length) {
            timeDataMap[allLabelsOrdered[assignIdx]] = t;
            if (firstLabel === null) firstLabel = allLabelsOrdered[assignIdx];
            assignIdx++;
        } else {
            overflow.push(t);
        }
    });

    if (overflow.length > 0) {
        // 列數不足：在最後補空白列承接，並重繪列表（全文模式一併同步大編輯框）
        appendBlankRowsWithTimes(overflow);
        saveToStorage();
        if (typeof renderSentenceList === 'function') renderSentenceList();
        if (typeof refreshScriptEditorIfNeeded === 'function') refreshScriptEditorIfNeeded();
        showToast(`${lead}；句子列不足，已在最後補上 ${overflow.length} 列空白列承接`, 'normal');
    } else if (timesToReassign.length > 1) {
        showToast(`${lead}至 ${firstLabel}，後方標記已順延`, 'success');
    } else {
        showToast(`${lead}至 ${firstLabel}`, 'success');
    }
}

function insertRowChronologically(start, end) {
    const insertIndex = findChronologicalInsertIndex(start);
    let prefix = 'A';
    if (insertIndex > 0) { prefix = allLabelsOrdered[insertIndex - 1].charAt(0); } 
    else if (allLabelsOrdered.length > 0) { prefix = allLabelsOrdered[0].charAt(0); }
    const tempLabel = prefix + '_TEMP_' + Date.now();

    allLabelsOrdered.splice(insertIndex, 0, tempLabel);
    timeDataMap[tempLabel] = { start: parseFloat(start.toFixed(3)), end: parseFloat(end.toFixed(3)) };
    sentenceTextMap[tempLabel] = '';
    reassignLabels(); 
    
    const newLabel = allLabelsOrdered[insertIndex]; 
    currentActiveLabel = newLabel;
    setTimeout(() => {
        // ★ 新增：全文模式下沒有單句列表可以聚焦，改為讓新列出現在大編輯框可視範圍內
        if (typeof isScriptMode !== 'undefined' && isScriptMode) {
            if (typeof updateSelectionUI === 'function') updateSelectionUI();
            const ta = document.getElementById('scriptTextarea');
            const gutterLine = document.getElementById(`gutter-${newLabel}`);
            if (ta && gutterLine) {
                const top = gutterLine.offsetTop;
                if (top < ta.scrollTop || top > ta.scrollTop + ta.clientHeight - 40) {
                    ta.scrollTop = Math.max(0, top - 40);
                }
            }
            return;
        }
        const itemDiv = document.getElementById(`item-${newLabel}`);
        if(itemDiv) {
            const textInput = itemDiv.querySelector('.sentence-text-display');
            if(textInput) { textInput.focus(); smartScrollTo(itemDiv); }
        }
    }, 50);
    showToast('已新增聲波標記與列表列', 'success');
}

function handleClearTag(label) {
    if (!timeDataMap[label]) return showToast('此句尚未標記！', 'error');
    const text = sentenceTextMap[label] || '';
    const idx = allLabelsOrdered.indexOf(label);

    if (text.trim() === '') {
        deleteSentence(label); // ★ deleteSentence 自己已會呼叫 saveState()，這裡不必重複
        showToast('已刪除空標記列', 'success');
    } else {
        if (typeof saveState === 'function') saveState(); // ★ 集中化：這個分支不會經過 deleteSentence，需要自己保護
        delete timeDataMap[label]; 
        
        let extractedTimes = [];
        // ★ 核心修復：無條件收集後續「所有」的時間標記，不再受限於段落
        for (let i = idx + 1; i < allLabelsOrdered.length; i++) {
            const lbl = allLabelsOrdered[i];
            if (timeDataMap[lbl]) {
                extractedTimes.push(timeDataMap[lbl]);
                delete timeDataMap[lbl];
            }
        }
        
        // ★ 依序填回：跨越段落，無縫往前補齊
        let assignIdx = idx;
        for (let i = 0; i < extractedTimes.length; i++) {
            if (assignIdx < allLabelsOrdered.length) {
                timeDataMap[allLabelsOrdered[assignIdx]] = extractedTimes[i];
                assignIdx++;
            }
        }

        saveToStorage(); 
        updateAllTimeDisplays(); 
        if (typeof renderAllRegions === 'function') renderAllRegions();
        showToast(`已清除標記，後續聲波已無縫往前遞補`, 'success');
    }
}

// ★ 新增：全文模式(劇本)下，列表資料變動後同步重繪「大編輯框」。
// 過去 reassignLabels 只會重繪「單句列表」(renderSentenceList)，全文模式下大編輯框不會更新，
// 造成「在游標處切割」等操作要切換到單句再切回全文才看得到新增的列。
// 集中在此處理，所有經過 reassignLabels 的操作（切割、新增標記列、清除標記…）都會一致同步。
function refreshScriptEditorIfNeeded() {
    if (typeof isScriptMode === 'undefined' || !isScriptMode) return;
    if (typeof populateScriptEditor !== 'function') return;

    // 重繪前先記住捲動位置與游標，避免畫面跳到最上方或游標跑到最後面
    const ta = document.getElementById('scriptTextarea');
    const savedScroll = ta ? ta.scrollTop : 0;
    const hadFocus = !!ta && document.activeElement === ta;
    const savedCaret = ta ? ta.selectionStart : 0;

    populateScriptEditor(); // 內部會重繪行號、同步資料並更新聲波標記

    if (ta) {
        ta.scrollTop = savedScroll;
        if (hadFocus) {
            const pos = Math.min(savedCaret, ta.value.length);
            ta.setSelectionRange(pos, pos);
        }
    }
    if (typeof updateSearchMatches === 'function') updateSearchMatches(); // 搜尋高亮跟著更新
}

// ★ 修改：新增選用參數 overrideTimes。
// 平常不傳參數，行為與以前完全相同（從 allLabelsOrdered 內收集聲波標記）；
// 「移除此列」需要把已被移出 allLabelsOrdered 的那列的聲波標記也保留下來，才會傳入。
// ★ 修改：新增選用參數 opts.trimTrailingBlank（數字）——排號完成後，最多從列表末端刪除這麼多列
// 「沒有聲波標記、文字也是空白」的列。供「合併聲波標記」使用：合併後標記變少，
// 末端多出來的空白列已經沒有用途。不傳 opts 時行為與以前完全相同。
function reassignLabels(overrideTimes, opts) {
    clearSelection(); // 排號改變前必須清除多選狀態，以免 UI 錯亂
    
    // 清除可能殘留的暫存藍色選取框
    if (typeof tempRegion !== 'undefined' && tempRegion !== null) {
        tempRegion.remove();
        tempRegion = null;
    }

    const newAllLabels = []; const newTextMap = {}; const newTimeMap = {};
    let currentParaLetter = ''; let currentParaItems = []; let paragraphs = [];

    // 1. 將現有的標籤依字母分段
    allLabelsOrdered.forEach(label => {
        const letter = label.charAt(0);
        if (letter !== currentParaLetter) {
            if (currentParaItems.length > 0) paragraphs.push({ letter: currentParaLetter, items: currentParaItems });
            currentParaLetter = letter; currentParaItems = [];
        }
        currentParaItems.push(label);
    });
    if (currentParaItems.length > 0) paragraphs.push({ letter: currentParaLetter, items: currentParaItems });

    // ★ 核心修復 1：無條件抽出所有的時間標記 (打破舊有的死板對齊限制)
    // ★ 修改：若有傳入 overrideTimes（陣列）就直接使用，否則沿用原本的收集方式
    const validOldTimes = Array.isArray(overrideTimes)
        ? overrideTimes
        : allLabelsOrdered
            .filter(lbl => timeDataMap[lbl] !== undefined)
            .map(lbl => timeDataMap[lbl]);
        
    let timeAssignIdx = 0;

    // 2. 重新排號，並依序賦予時間標記 (無縫跨段落遞補)
    paragraphs.forEach(para => {
        const letter = para.letter;
        para.items.forEach((oldLabel, index) => {
            const newLabel = letter + String(index + 1).padStart(2, '0');
            newAllLabels.push(newLabel);
            newTextMap[newLabel] = sentenceTextMap[oldLabel] || '';
            
            // 只要還有時間標記，就依序貼上，填滿所有空隙
            if (timeAssignIdx < validOldTimes.length) {
                newTimeMap[newLabel] = validOldTimes[timeAssignIdx];
                timeAssignIdx++;
            }
        });
    });
    
    // ★ 核心修復 2：如果時間標記比文字句子多，自動產生空句子來承接，防止時間遺失
    if (timeAssignIdx < validOldTimes.length) {
        let lastLabel = newAllLabels.length > 0 ? newAllLabels[newAllLabels.length - 1] : 'A00';
        let pChar = lastLabel.charAt(0);
        let sentenceCount = parseInt(lastLabel.slice(1), 10) + 1;
        
        while (timeAssignIdx < validOldTimes.length) {
            const newLabel = pChar + String(sentenceCount).padStart(2, '0');
            newAllLabels.push(newLabel);
            newTextMap[newLabel] = '';
            newTimeMap[newLabel] = validOldTimes[timeAssignIdx];
            timeAssignIdx++;
            sentenceCount++;
        }
    }

    // ★ 新增：自動刪除列表末端多餘的空白列（沒有標記、文字為空白），數量不超過 opts.trimTrailingBlank
    // 這樣即使列表尾端本來就有使用者自己預留的空白列，也不會被多刪。
    const maxTrim = (opts && opts.trimTrailingBlank) || 0;
    let trimmedCount = 0;
    while (trimmedCount < maxTrim && newAllLabels.length > 0) {
        const lastLabel = newAllLabels[newAllLabels.length - 1];
        if (newTimeMap[lastLabel] !== undefined || (newTextMap[lastLabel] || '').trim() !== '') break;
        newAllLabels.pop();
        delete newTextMap[lastLabel];
        trimmedCount++;
    }

    // 3. 寫入全域資料並存檔
    allLabelsOrdered = newAllLabels; 
    sentenceTextMap = newTextMap; 
    timeDataMap = newTimeMap;
    
    saveToStorage(); 
    renderSentenceList(); 

    // 4. 強制更新畫面與聲波圖
    if (typeof updateAllTimeDisplays === 'function') {
        updateAllTimeDisplays();
    }

    // ★ 新增：全文模式下同步重繪大編輯框（單句模式不受影響）
    refreshScriptEditorIfNeeded();
}

window.insertUp = function(label) {
    if (typeof saveState === 'function') saveState(); // ★ 集中化：改由函式自己保護，呼叫端不必再記得加
    const idx = allLabelsOrdered.indexOf(label); const tempLabel = label.charAt(0) + '_TEMP_' + Date.now();
    allLabelsOrdered.splice(idx, 0, tempLabel); sentenceTextMap[tempLabel] = ''; reassignLabels(); showToast('已向上新增空白句', 'success');
};
window.insertDown = function(label) {
    if (typeof saveState === 'function') saveState(); // ★ 集中化：改由函式自己保護，呼叫端不必再記得加
    const idx = allLabelsOrdered.indexOf(label); const tempLabel = label.charAt(0) + '_TEMP_' + Date.now();
    allLabelsOrdered.splice(idx + 1, 0, tempLabel); sentenceTextMap[tempLabel] = ''; reassignLabels(); showToast('已向下新增空白句', 'success');
};

// ★ 新增：移除此列（只移除這一列的文字，聲波標記全部保留，後面的列往前遞補）
// 與 deleteSentence 的差別：deleteSentence 會連這列的聲波標記一起刪掉；
// 這裡則是把聲波標記留下來，由 reassignLabels 依序重新對應，後面的文字會往前補上。
window.removeRow = function(label) {
    const idx = allLabelsOrdered.indexOf(label);
    if (idx === -1) return;
    if (typeof saveState === 'function') saveState();

    // 先在「移除前」依序收集所有聲波標記（包含這一列自己的），避免它隨著列被移除而遺失
    const allTimes = allLabelsOrdered
        .filter(lbl => timeDataMap[lbl] !== undefined)
        .map(lbl => timeDataMap[lbl]);

    allLabelsOrdered.splice(idx, 1);
    delete sentenceTextMap[label];
    delete timeDataMap[label];

    reassignLabels(allTimes); // 後面的列依序往前遞補；多出來的聲波標記會由空白列承接
    showToast('已移除此列，後面的列已往前遞補（聲波標記保留）', 'success');
};

// 修復：徹底拔除時間吸收邏輯，現在只負責刪除自己 
window.deleteSentence = function(label) {
    if (typeof saveState === 'function') saveState(); // ★ 集中化：改由函式自己保護，呼叫端不必再記得加
    const idx = allLabelsOrdered.indexOf(label);
    allLabelsOrdered.splice(idx, 1); 
    delete sentenceTextMap[label]; 
    delete timeDataMap[label];
    reassignLabels(); 
    showToast('已刪除此列與聲波標記', 'success');
};

// ★ 新增：計算目前有聲波標記的列數（用來得知「合併」後減少了幾個標記）
function countTimeMarkers() {
    return allLabelsOrdered.filter(l => timeDataMap[l] !== undefined).length;
}

// ★ 新增：合併聲波標記時，同步「正在播放」與「目前選取」的狀態 ------------------------------
// 問題：正在播放標記 A 時，把 A、B 兩個標記合併，reassignLabels() 會把後面的標記往前遞補、重新對應到各列，
// 但播放引擎(precisionLoop)仍記著「舊 A 的結尾時間」與舊標籤 → 播到舊 A 結尾就停止，或在連續播放時
// 跳到「下一句」（此時已是原本的 C）並把選取移到 C。
// 做法：合併前拍下播放狀態，合併後用「開始時間」找回對應的新標籤，並把播放結尾更新為合併後的結尾。
function markerStartOf(label) {
    const d = timeDataMap[label];
    if (!d) return null;
    return typeof d === 'object' ? d.start : d;
}

function findLabelByStart(start) {
    if (start === null || start === undefined) return null;
    return allLabelsOrdered.find(l => {
        const t = getCalculatedTimes(l);
        return t && Math.abs(t.start - start) < 0.0005;
    }) || null;
}

// 合併前呼叫：mergedLabels = 這次參與合併的所有標籤
function snapshotPlayStateForMerge(mergedLabels) {
    const snap = { verifying: null, active: null };
    if (typeof verifyingLabel !== 'undefined' && verifyingLabel && verifyEndTime !== null) {
        const t = getCalculatedTimes(verifyingLabel);
        if (t) snap.verifying = { start: t.start, inMerge: mergedLabels.includes(verifyingLabel) };
    }
    if (currentActiveLabel) {
        const activeStart = markerStartOf(currentActiveLabel);
        if (activeStart !== null) snap.active = { start: activeStart, inMerge: mergedLabels.includes(currentActiveLabel) };
    }
    return snap;
}

// 合併後呼叫：mergedStart = 合併後那個標記的開始時間
function syncPlayStateAfterMerge(snap, mergedStart) {
    // 1. 選取狀態：原本選取的是參與合併的標記 → 改選合併後的標記；
    //    選取的是其他標記 → 用開始時間找回它遞補後的新標籤（避免選取停在被遞補成別的標記的舊標籤上）
    if (snap.active) {
        const activeLabel = findLabelByStart(snap.active.inMerge ? mergedStart : snap.active.start);
        if (activeLabel) {
            currentActiveLabel = activeLabel;
            if (snap.active.inMerge) lastSelectedLabel = activeLabel;
            if (typeof updateSelectionUI === 'function') updateSelectionUI();
        }
    }

    // 2. 播放狀態：正在播放（有播放結尾時間）時，讓播放引擎跟著新的標籤與結尾
    if (snap.verifying) {
        const baseStart = snap.verifying.inMerge ? mergedStart : snap.verifying.start;
        const newLabel = findLabelByStart(baseStart);
        if (newLabel) {
            verifyingLabel = newLabel;
            if (snap.verifying.inMerge) {
                const t = getCalculatedTimes(newLabel);
                if (t) {
                    let newEnd = t.end;
                    if (document.getElementById('enableMaxPlayCheck')?.checked) {
                        const maxSec = parseFloat(document.getElementById('maxPlaySecondsInput')?.value) || 2;
                        newEnd = Math.min(newEnd, t.start + maxSec);
                    }
                    verifyEndTime = newEnd; // 播到「合併後」的結尾，不再停在舊標記的結尾或跳去下一句
                }
            }
        } else {
            verifyingLabel = null; // 找不到對應標記：不要讓播放引擎依舊標籤亂跳，播到原本的結尾就停
        }
    }
}

window.mergeUp = function(label) {
    const idx = allLabelsOrdered.indexOf(label); 
    if (idx === 0) return showToast('已經是第一句', 'error');
    const prevLabel = allLabelsOrdered[idx - 1];
    const markerCountBefore = countTimeMarkers(); // ★ 新增：記錄合併前的標記數
    const playSnap = snapshotPlayStateForMerge([prevLabel, label]); // ★ 新增：記錄合併前的播放／選取狀態
    
    if (typeof saveState === 'function') saveState(); // 紀錄狀態
    
    // ★ 取消文字合併，保留原本文字
    if (timeDataMap[label]) {
        if (!timeDataMap[prevLabel]) timeDataMap[prevLabel] = { start: timeDataMap[label].start };
        timeDataMap[prevLabel].end = timeDataMap[label].end;
    }
    
    // ★ 取消刪除整列，僅清除時間
    delete timeDataMap[label]; 
    
    // ★ 修改：合併後標記少了，末端多出來的空白列一併刪除
    const mergedStart = markerStartOf(prevLabel); // ★ 新增：合併後標記的開始時間（排號前先記下來）
    const mergedCount = markerCountBefore - countTimeMarkers();
    const rowsBefore = allLabelsOrdered.length;
    reassignLabels(undefined, { trimTrailingBlank: mergedCount }); // 呼叫全域無縫遞補引擎
    syncPlayStateAfterMerge(playSnap, mergedStart); // ★ 新增：同步播放／選取狀態
    const removedRows = rowsBefore - allLabelsOrdered.length;
    showToast('已向前合併聲波標記' + (removedRows > 0 ? `，並刪除末端 ${removedRows} 個空白列` : ''), 'success');
};

window.mergeDown = function(label) {
    const idx = allLabelsOrdered.indexOf(label); 
    if (idx === allLabelsOrdered.length - 1) return showToast('已經是最後一句', 'error');
    const nextLabel = allLabelsOrdered[idx + 1];
    const markerCountBefore = countTimeMarkers(); // ★ 新增：記錄合併前的標記數
    const playSnap = snapshotPlayStateForMerge([label, nextLabel]); // ★ 新增：記錄合併前的播放／選取狀態
    
    if (typeof saveState === 'function') saveState(); // 紀錄狀態
    
    // ★ 取消文字合併，保留原本文字
    if (timeDataMap[nextLabel]) {
        if (!timeDataMap[label]) timeDataMap[label] = { start: timeDataMap[nextLabel].start };
        timeDataMap[label].end = timeDataMap[nextLabel].end;
    }
    
    // ★ 取消刪除整列，僅清除時間
    delete timeDataMap[nextLabel]; 
    
    // ★ 修改：合併後標記少了，末端多出來的空白列一併刪除
    const mergedStart = markerStartOf(label); // ★ 新增：合併後標記的開始時間（排號前先記下來）
    const mergedCount = markerCountBefore - countTimeMarkers();
    const rowsBefore = allLabelsOrdered.length;
    reassignLabels(undefined, { trimTrailingBlank: mergedCount }); // 呼叫全域無縫遞補引擎
    syncPlayStateAfterMerge(playSnap, mergedStart); // ★ 新增：同步播放／選取狀態
    const removedRows = rowsBefore - allLabelsOrdered.length;
    showToast('已向後合併聲波標記' + (removedRows > 0 ? `，並刪除末端 ${removedRows} 個空白列` : ''), 'success');
};


function executeExportText() {
    if (allLabelsOrdered.length === 0) return showToast('目前沒有任何句子！', 'error');
    let paragraphs = []; let currentLetter = ''; let currentPara = [];
    allLabelsOrdered.forEach(label => {
        const letter = label.charAt(0);
        if (letter !== currentLetter) { if (currentPara.length > 0) paragraphs.push(currentPara); currentLetter = letter; currentPara = []; }
        currentPara.push(label);
    });
    if (currentPara.length > 0) paragraphs.push(currentPara);
    const format = currentExportFormat; let resultText = '';
    
    if (format === 'para') resultText = paragraphs.map(para => para.map(label => sentenceTextMap[label]).join('')).join('\n');
    else if (format === 'para-slash-n') resultText = paragraphs.map(para => para.map(label => sentenceTextMap[label]).join('')).join('\\n');
    else if (format === 'sent-no-para') resultText = allLabelsOrdered.map(label => sentenceTextMap[label]).join('\n');
    else if (format === 'sent-empty-line') resultText = paragraphs.map(para => para.map(label => sentenceTextMap[label]).join('\n')).join('\n\n');
    else if (format === 'sent-hash') {
        const outLines = []; paragraphs.forEach(para => { outLines.push('######'); para.forEach(label => outLines.push(sentenceTextMap[label])); outLines.push('######'); });
        resultText = outLines.join('\n');
    }
    
    const modalOutputArea = document.getElementById('modalOutputArea');
    if (modalOutputArea) {
        modalOutputArea.value = resultText;
    }
}

// 新增：跨行多項選取合併的演算法 
mergeSelectedBtn?.addEventListener('click', () => {
    if (selectedLabels.length < 2) return;
    
    // 依據原始陣列重新排序選取的項目
    selectedLabels.sort((a, b) => allLabelsOrdered.indexOf(a) - allLabelsOrdered.indexOf(b));
    
    // 檢查是否連續
    let isContinuous = true;
    for (let i = 0; i < selectedLabels.length - 1; i++) {
        if (allLabelsOrdered.indexOf(selectedLabels[i+1]) !== allLabelsOrdered.indexOf(selectedLabels[i]) + 1) {
            isContinuous = false; break;
        }
    }
    if (!isContinuous) return showToast('合併失敗：選取的項目必須是連續的！', 'error');

    if (typeof saveState === 'function') saveState();

    const markerCountBefore = countTimeMarkers(); // ★ 新增：記錄合併前的標記數
    const playSnap = snapshotPlayStateForMerge(selectedLabels.slice()); // ★ 新增：記錄合併前的播放／選取狀態（reassignLabels 會清掉選取）
    const firstLabel = selectedLabels[0];
    const lastLabel = selectedLabels[selectedLabels.length - 1];
    
    // ★ 取消文字合併，直接處理時間
    let finalStart = null, finalEnd = null;
    if (timeDataMap[firstLabel]) finalStart = typeof timeDataMap[firstLabel] === 'object' ? timeDataMap[firstLabel].start : timeDataMap[firstLabel];
    if (timeDataMap[lastLabel]) finalEnd = typeof timeDataMap[lastLabel] === 'object' ? timeDataMap[lastLabel].end : null;

    if (finalStart !== null) {
        timeDataMap[firstLabel] = { start: finalStart, end: finalEnd };
    }

    // ★ 取消刪除整列與文字，僅清除被合併掉的時間
    for (let i = 1; i < selectedLabels.length; i++) {
        const lbl = selectedLabels[i];
        delete timeDataMap[lbl];
    }
    
    // ★ 修改：合併後標記少了，末端多出來的空白列一併刪除
    const mergedCount = markerCountBefore - countTimeMarkers();
    const rowsBefore = allLabelsOrdered.length;
    reassignLabels(undefined, { trimTrailingBlank: mergedCount }); 
    if (finalStart !== null) syncPlayStateAfterMerge(playSnap, finalStart); // ★ 新增：同步播放／選取狀態
    const removedRows = rowsBefore - allLabelsOrdered.length;
    showToast('合併成功！時間已重新對齊' + (removedRows > 0 ? `，並刪除末端 ${removedRows} 個空白列` : ''), 'success');
});

function splitRegionAtPlayhead() {
    if (!audioPlayer || !audioPlayer.src) return showToast('請先載入音檔', 'error');
    
    const currentTime = audioPlayer.currentTime;
    let targetLabel = null;
    let targetTimes = null;

    // 1. 找出目前游標時間落在哪一個句子的時間範圍內
    for (let i = 0; i < allLabelsOrdered.length; i++) {
        const label = allLabelsOrdered[i];
        if (timeDataMap[label]) {
            const times = getCalculatedTimes(label);
            if (times && currentTime > (times.start + 0.05) && currentTime < (times.end - 0.05)) {
                targetLabel = label;
                targetTimes = times;
                break;
            }
        }
    }

    if (!targetLabel) return showToast('游標位置不在任何可切割的句子範圍內', 'error');

    if (typeof saveState === 'function') saveState();

    const splitPoint = parseFloat(currentTime.toFixed(3));

    // ★ 核心步驟 1：目前句子縮短到切割點，保留前半段時間
    timeDataMap[targetLabel] = { start: targetTimes.start, end: splitPoint };

    // ★ 新增：依設定「切割時新增列表」決定要不要新增列。
    // 取消勾選時：不新增列，後半段時間套用到目標句子之後的既有列，後方標記依序順延。
    if (typeof isAddRowEnabled === 'function' && !isAddRowEnabled('split')) {
        applyTimeToExistingRows(splitPoint, targetTimes.end, { preferActiveLabel: false, lead: '已切割聲波（不新增列），後半段套用' });
        saveToStorage();
        if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
        if (typeof renderAllRegions === 'function') renderAllRegions();
        return;
    }

    // ★ 核心步驟 2：在目標句子「後面」新插入一列空白句子，承接後半段時間，
    // 再交給 reassignLabels() 統一重排。
    //
    // 舊寫法在此自行實作「骨牌推移」：把後半段時間、以及後方所有既有時間標記，
    // 依序覆蓋貼到後方的文字列上——但完全不管那些文字列「原本有沒有時間」，
    // 可能把時間貼到不相干的句子上、造成文字與時間對不齊；句子數不夠時還會直接
    // 捨棄溢出的時間標記。
    //
    // 改為新增一列＋呼叫 reassignLabels()，就能跟 insertUp / insertDown /
    // mergeUp / mergeDown / handleClearTag 用的是同一套、已經驗證過的重排引擎：
    // 只重新排「有時間」的標記本身的順序（順序不變，只是多插了一個），不會覆蓋到
    // 本來沒有時間的文字列；句子數不夠時也會自動補空白列承接，不會遺失資料。
    const targetIdx = allLabelsOrdered.indexOf(targetLabel);
    const tempLabel = targetLabel.charAt(0) + '_TEMP_' + Date.now();
    allLabelsOrdered.splice(targetIdx + 1, 0, tempLabel);
    sentenceTextMap[tempLabel] = '';
    timeDataMap[tempLabel] = { start: splitPoint, end: targetTimes.end };

    reassignLabels(); // 統一重新排號、重新對齊所有時間標記（saveToStorage/renderSentenceList 已內含）

    showToast('已切割聲波！新句子已插入，後續時間已依序對齊', 'success');

    if (typeof renderAllRegions === 'function') renderAllRegions();
}