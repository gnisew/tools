// ================= 修改優化：動態按鈕顯示與隱藏防呆邏輯 =================
// ================= 修改優化：動態按鈕顯示與隱藏防呆邏輯 =================
function checkButtonVisibility() {
    const hasRegions = typeof allLabelsOrdered !== 'undefined' && allLabelsOrdered.length > 0;
    const hasActiveRegion = (typeof activeRegion !== 'undefined' && activeRegion) || (typeof tempRegion !== 'undefined' && tempRegion);
    
    const autoSegmentRegionBtn = document.getElementById('autoSegmentRegionBtn'); 
    if (autoSegmentRegionBtn) {
        autoSegmentRegionBtn.disabled = !(hasActiveRegion || !hasRegions);
    }

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
        localStorage.setItem('tagger_allLabels', JSON.stringify(allLabelsOrdered));
        localStorage.setItem('tagger_textMap', JSON.stringify(sentenceTextMap));
        localStorage.setItem('tagger_timeDataMap', JSON.stringify(timeDataMap));
        localStorage.setItem('tagger_parseMode', currentParseMode); 
        if (typeof checkButtonVisibility === 'function') checkButtonVisibility();
    }, 500); 
}

// 防護機制：確保使用者直接關閉分頁時，如果還有在倒數中的存檔，能強制寫入
window.addEventListener('beforeunload', () => {
    if (saveStorageTimeout) {
        clearTimeout(saveStorageTimeout);
        localStorage.setItem('tagger_allLabels', JSON.stringify(allLabelsOrdered));
        localStorage.setItem('tagger_textMap', JSON.stringify(sentenceTextMap));
        localStorage.setItem('tagger_timeDataMap', JSON.stringify(timeDataMap));
        localStorage.setItem('tagger_parseMode', currentParseMode); 
    }
});

window.showMissingAudioUI = function(fileName) {
    const missingAudioWarning = document.getElementById('missingAudioWarning');
    const missingAudioName = document.getElementById('missingAudioName');
    const stickyPanel = document.getElementById('stickyPanel');
    const compactControls = document.getElementById('compactControls');
    const waveform = document.getElementById('waveform');

    if (missingAudioWarning && missingAudioName && stickyPanel) {
        missingAudioName.textContent = fileName;
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
        if (localFileHint) {
            localFileHint.innerHTML = `<span class="material-icons" style="font-size: 1rem;">warning</span> 上次音檔：「${localFileName}」，請重新選取`;
            localFileHint.style.display = 'inline-flex';
        }
        
        window.showMissingAudioUI(localFileName);
        
    } else if (savedUrl) {
        const modalSingleUrlInput = document.getElementById('modalSingleUrlInput');
        if (modalSingleUrlInput) modalSingleUrlInput.value = savedUrl; 
        
        audioPlayer.src = savedUrl; 
        if (typeof initWaveSurfer === 'function') initWaveSurfer(); 
    }

    if (typeof checkButtonVisibility === 'function') checkButtonVisibility();
}

function executeParsing() {
    let rawText = rawTextInput.value.trim(); 
    rawText = rawText.replace(/\\n/g, '\n'); 
    const parseMode = currentParseMode;
    const rawLines = rawText.split(/\r?\n/).filter(p => p.trim() !== ''); 
    const isTSV = rawLines.some(line => /^[A-Z]\d{2,}\t/.test(line));

    if (isTSV) {
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
        // ★ 一般文字解析：先「循序」備份現有的時間標記
        const existingMarkers = allLabelsOrdered
            .map(lbl => ({ time: timeDataMap[lbl] }))
            .filter(m => m.time !== undefined);

        let newLabels = [];
        let newTextMap = {};

        // 進行文字解析...
        if (parseMode === 'newline') {
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
                    
                    if (!inBrackets && /[，。：；！？、．―─「」【】『』《》?!.,]/.test(char)) {
                        let isDecimal = false;
                        if ((char === '.' || char === ',') && i > 0 && i < para.length - 1) { 
                            if (/\d/.test(para[i-1]) && /\d/.test(para[i+1])) isDecimal = true; 
                        }
                        
                        if (!isDecimal) {
                            // 貪婪吸收後續的連續標點符號與空白，確保 ？」 或 ：「 不會被拆開
                            while (i + 1 < para.length && /[，。：；！？、．―─「」【】『』《》"”'’?!.,\s]/.test(para[i+1])) {
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

        // ★ 核心修復：將備份的舊時間，循序貼上新生成的句子
        let newTimeMap = {};
        let markerIndex = 0;

        for (let i = 0; i < newLabels.length; i++) {
            if (markerIndex < existingMarkers.length) {
                newTimeMap[newLabels[i]] = existingMarkers[markerIndex].time;
                markerIndex++;
            }
        }

        // ★ 極致防呆：如果舊時間比較多（新文字比較少），創建空白標記來保留時間，確保聲波圖完全不遺失
        if (markerIndex < existingMarkers.length) {
            let lastLabel = newLabels.length > 0 ? newLabels[newLabels.length - 1] : 'A00';
            let paraChar = lastLabel.charCodeAt(0);
            let sentenceCount = parseInt(lastLabel.slice(1), 10) + 1;

            while (markerIndex < existingMarkers.length) {
                const label = String.fromCharCode(paraChar) + String(sentenceCount).padStart(2, '0');
                newLabels.push(label);
                newTextMap[label] = '';
                newTimeMap[label] = existingMarkers[markerIndex].time;
                sentenceCount++;
                markerIndex++;
            }
        }

        // 寫入全域變數
        allLabelsOrdered = newLabels;
        sentenceTextMap = newTextMap;
        timeDataMap = newTimeMap;
        showToast('文章解析完成！時間標記已完美保留。', 'success');
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

function insertRowChronologically(start, end) {
    let insertIndex = allLabelsOrdered.length;
    for (let i = 0; i < allLabelsOrdered.length; i++) {
        const lbl = allLabelsOrdered[i];
        if (timeDataMap[lbl]) {
            const lblStart = typeof timeDataMap[lbl] === 'object' ? timeDataMap[lbl].start : timeDataMap[lbl];
            if (lblStart > start) { insertIndex = i; break; }
        }
    }
    let prefix = 'A';
    if (insertIndex > 0) { prefix = allLabelsOrdered[insertIndex - 1].charAt(0); } 
    else if (allLabelsOrdered.length > 0) { prefix = allLabelsOrdered[0].charAt(0); }
    const tempLabel = prefix + '_TEMP_' + Date.now();

    allLabelsOrdered.splice(insertIndex, 0, tempLabel);
    timeDataMap[tempLabel] = { start: parseFloat(start.toFixed(2)), end: parseFloat(end.toFixed(2)) };
    sentenceTextMap[tempLabel] = '';
    reassignLabels(); 
    
    const newLabel = allLabelsOrdered[insertIndex]; 
    currentActiveLabel = newLabel;
    setTimeout(() => {
        const itemDiv = document.getElementById(`item-${newLabel}`);
        if(itemDiv) {
            const textInput = itemDiv.querySelector('.sentence-text-display');
            if(textInput) { textInput.focus(); smartScrollTo(itemDiv); }
        }
    }, 50);
    showToast('已新增標記列', 'success');
}

function handleClearTag(label) {
    if (!timeDataMap[label]) return showToast('此句尚未標記！', 'error');
    const text = sentenceTextMap[label] || '';
    const idx = allLabelsOrdered.indexOf(label);

    if (text.trim() === '') {
        deleteSentence(label); 
        showToast('已刪除空標記列', 'success');
    } else {
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

function reassignLabels() {
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
    const validOldTimes = allLabelsOrdered
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
}

window.insertUp = function(label) {
    const idx = allLabelsOrdered.indexOf(label); const tempLabel = label.charAt(0) + '_TEMP_' + Date.now();
    allLabelsOrdered.splice(idx, 0, tempLabel); sentenceTextMap[tempLabel] = ''; reassignLabels(); showToast('已向上新增空白句', 'success');
};
window.insertDown = function(label) {
    const idx = allLabelsOrdered.indexOf(label); const tempLabel = label.charAt(0) + '_TEMP_' + Date.now();
    allLabelsOrdered.splice(idx + 1, 0, tempLabel); sentenceTextMap[tempLabel] = ''; reassignLabels(); showToast('已向下新增空白句', 'success');
};

// 修復：徹底拔除時間吸收邏輯，現在只負責刪除自己 
window.deleteSentence = function(label) {
    const idx = allLabelsOrdered.indexOf(label);
    allLabelsOrdered.splice(idx, 1); 
    delete sentenceTextMap[label]; 
    delete timeDataMap[label];
    reassignLabels(); 
    showToast('已刪除此句', 'success');
};

window.mergeUp = function(label) {
    const idx = allLabelsOrdered.indexOf(label); 
    if (idx === 0) return showToast('已經是第一句', 'error');
    const prevLabel = allLabelsOrdered[idx - 1];
    
    if (typeof saveState === 'function') saveState(); // 紀錄狀態
    
    // ★ 取消文字合併，保留原本文字
    if (timeDataMap[label]) {
        if (!timeDataMap[prevLabel]) timeDataMap[prevLabel] = { start: timeDataMap[label].start };
        timeDataMap[prevLabel].end = timeDataMap[label].end;
    }
    
    // ★ 取消刪除整列，僅清除時間
    delete timeDataMap[label]; 
    
    reassignLabels(); // 呼叫全域無縫遞補引擎
    showToast('已向上合併時間', 'success');
};

window.mergeDown = function(label) {
    const idx = allLabelsOrdered.indexOf(label); 
    if (idx === allLabelsOrdered.length - 1) return showToast('已經是最後一句', 'error');
    const nextLabel = allLabelsOrdered[idx + 1];
    
    if (typeof saveState === 'function') saveState(); // 紀錄狀態
    
    // ★ 取消文字合併，保留原本文字
    if (timeDataMap[nextLabel]) {
        if (!timeDataMap[label]) timeDataMap[label] = { start: timeDataMap[nextLabel].start };
        timeDataMap[label].end = timeDataMap[nextLabel].end;
    }
    
    // ★ 取消刪除整列，僅清除時間
    delete timeDataMap[nextLabel]; 
    
    reassignLabels(); // 呼叫全域無縫遞補引擎
    showToast('已向下合併時間', 'success');
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
    
    reassignLabels(); 
    showToast('合併成功！時間已重新對齊', 'success');
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

    // ★ 核心步驟 1：將目前句子的時間，縮短到游標切割處 (保留前半段)
    timeDataMap[targetLabel] = { start: targetTimes.start, end: parseFloat(currentTime.toFixed(3)) };

    const targetIdx = allLabelsOrdered.indexOf(targetLabel);

    // ★ 核心步驟 2：收集即將要往後塞的「所有時間標記」
    let timesToReassign = [];
    
    // 第一個要往後塞的，就是剛剛切出來的「後半段時間」
    timesToReassign.push({ start: parseFloat(currentTime.toFixed(3)), end: targetTimes.end });

    // 接著，把目標句子後方的「所有現有時間標記」也收集起來，並先從原地拔除
    for (let i = targetIdx + 1; i < allLabelsOrdered.length; i++) {
        const lbl = allLabelsOrdered[i];
        if (timeDataMap[lbl]) {
            timesToReassign.push(timeDataMap[lbl]);
            delete timeDataMap[lbl];
        }
    }

    // ★ 核心步驟 3：骨牌推移！從下一個句子開始，把收集到的時間依序貼回去
    let assignIdx = targetIdx + 1;
    let overflowCount = 0;
    
    for (let i = 0; i < timesToReassign.length; i++) {
        // 只要列表還有句子，就依序貼上時間
        if (assignIdx < allLabelsOrdered.length) {
            timeDataMap[allLabelsOrdered[assignIdx]] = timesToReassign[i];
            assignIdx++;
        } else {
            // 防呆：如果時間標記被往後擠，但列表已經沒有句子了，只好捨棄溢出的標記
            overflowCount++;
        }
    }

    // 更新畫面與提示
    if (overflowCount > 0) {
        showToast(`已切割並往後推移！但句子不足，末端 ${overflowCount} 個標記已擠出捨棄`, 'normal');
    } else {
        showToast('已切割聲波！後方時間標記已依序往後推移', 'success');
    }

    saveToStorage();
    if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
    if (typeof renderAllRegions === 'function') renderAllRegions();
}