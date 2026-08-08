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

    // ★ 核心修復 1：不管有沒有標記，只要有音檔紀錄就強制渲染列表
    if ((allLabelsOrdered.length > 0 || localFileName || savedUrl) && typeof renderSentenceList === 'function') {
        renderSentenceList(); 
    }

    // ★ 核心修復 2：處理本地端音檔遺失的防呆介面 (附件圖三的設計)
    if (audioType === 'local' && localFileName) {
        const localFileHint = document.getElementById('localFileHint');
        if (localFileHint) {
            localFileHint.innerHTML = `<span class="material-icons" style="font-size: 1rem;">warning</span> 上次音檔：「${localFileName}」，請重新選取`;
            localFileHint.style.display = 'inline-flex';
        }

        const missingAudioWarning = document.getElementById('missingAudioWarning');
        const missingAudioName = document.getElementById('missingAudioName');
        const stickyPanel = document.getElementById('stickyPanel');
        const compactControls = document.getElementById('compactControls');
        const waveform = document.getElementById('waveform');

        if (missingAudioWarning && missingAudioName && stickyPanel) {
            missingAudioName.textContent = localFileName;
            missingAudioWarning.style.display = 'block';
            stickyPanel.style.display = 'block'; // 展開吸頂面板
            
            if (waveform) waveform.style.display = 'none'; // 隱藏空白聲波圖
            if (compactControls) {
                compactControls.style.display = 'flex';
                compactControls.style.opacity = '0.4'; // 控制列變半透明
                compactControls.style.pointerEvents = 'none'; // 禁用控制列點擊
            }
        }
    } else if (savedUrl) {
        const modalSingleUrlInput = document.getElementById('modalSingleUrlInput');
        if (modalSingleUrlInput) modalSingleUrlInput.value = savedUrl; 
        
        audioPlayer.src = savedUrl; 
        if (typeof initWaveSurfer === 'function') initWaveSurfer(); 
    }

    if (typeof checkButtonVisibility === 'function') checkButtonVisibility();
}

function executeParsing() {
    let rawText = rawTextInput.value.trim(); rawText = rawText.replace(/\\n/g, '\n'); const parseMode = currentParseMode;
    sentenceTextMap = {}; allLabelsOrdered = [];
    const rawLines = rawText.split(/\r?\n/).filter(p => p.trim() !== ''); const isTSV = rawLines.some(line => /^[A-Z]\d{2,}\t/.test(line));

    if (isTSV) {
        timeDataMap = {}; let currentParaLetter = ''; let paraIndex = -1;
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
        }); showToast('已成功載入試算表資料！', 'success');
    } else if (parseMode === 'newline') {
        rawLines.forEach((line, index) => { const label = String(index + 1).padStart(2, '0'); allLabelsOrdered.push(label); sentenceTextMap[label] = line.replace(/\([^)]+\)/g, ''); });
    } else if (parseMode === 'newline-para') {
        const rawFullLines = rawText.split(/\r?\n/); let paragraphs = []; let currentPara = [];
        for (let i = 0; i < rawFullLines.length; i++) {
            const line = rawFullLines[i].trim();
            if (line === '' || /^#+$/.test(line)) { if (currentPara.length > 0) { paragraphs.push(currentPara); currentPara = []; } } else currentPara.push(line);
        }
        if (currentPara.length > 0) paragraphs.push(currentPara);
        paragraphs.forEach((paraLines, paraIndex) => {
            const paraLetter = String.fromCharCode(65 + paraIndex); 
            paraLines.forEach((sentence, sentIndex) => { const sentNumber = String(sentIndex + 1).padStart(2, '0'); const label = `${paraLetter}${sentNumber}`; allLabelsOrdered.push(label); sentenceTextMap[label] = sentence.replace(/\([^)]+\)/g, ''); });
        });
    } else {
        const paragraphs = rawText.split(/\r?\n/).filter(p => p.trim() !== '');
        paragraphs.forEach((para, paraIndex) => {
            const paraLetter = String.fromCharCode(65 + paraIndex); 
            let sentences = []; let current = ''; let inBrackets = false;
            for (let i = 0; i < para.length; i++) {
                let char = para[i]; current += char;
                if (char === '[') inBrackets = true; if (char === ']') inBrackets = false;
                if (!inBrackets && /[，。：；！？、「」『』?!.,]/.test(char)) {
                    let isDecimal = false;
                    if ((char === '.' || char === ',') && i > 0 && i < para.length - 1) { if (/\d/.test(para[i-1]) && /\d/.test(para[i+1])) isDecimal = true; }
                    if (!isDecimal) {
                        while (i + 1 < para.length && /[，。：；！？、「」『』?!.,\s]/.test(para[i+1])) {
                            let nextChar = para[i+1]; if (nextChar === '[') break; 
                            if ((nextChar === '.' || nextChar === ',') && /\d/.test(para[i]) && i + 2 < para.length && /\d/.test(para[i+2])) break;
                            current += nextChar; i++;
                        }
                        if (current.trim()) sentences.push(current.trim()); current = '';
                    }
                }
            }
            if (current.trim()) sentences.push(current.trim()); if (sentences.length === 0) sentences = [para];
            sentences.forEach((sentence, sentIndex) => { const sentNumber = String(sentIndex + 1).padStart(2, '0'); const label = `${paraLetter}${sentNumber}`; allLabelsOrdered.push(label); sentenceTextMap[label] = sentence.replace(/\([^)]+\)/g, ''); });
        });
    }
    renderSentenceList(); saveToStorage(); rawTextInput.value = ''; showToast('文章解析完成！', 'success');
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
    if (text.trim() === '') {
        deleteSentence(label); showToast('已刪除空標記列', 'success');
    } else {
        delete timeDataMap[label]; saveToStorage(); updateAllTimeDisplays(); showToast(`已清除 ${label} 的時間標記`, 'success');
    }
}

function reassignLabels() {
    clearSelection(); // 排號改變前必須清除多選狀態，以免 UI 錯亂
    const newAllLabels = []; const newTextMap = {}; const newTimeMap = {};
    let currentParaLetter = ''; let currentParaItems = []; let paragraphs = [];

    allLabelsOrdered.forEach(label => {
        const letter = label.charAt(0);
        if (letter !== currentParaLetter) {
            if (currentParaItems.length > 0) paragraphs.push({ letter: currentParaLetter, items: currentParaItems });
            currentParaLetter = letter; currentParaItems = [];
        }
        currentParaItems.push(label);
    });
    if (currentParaItems.length > 0) paragraphs.push({ letter: currentParaLetter, items: currentParaItems });

    paragraphs.forEach(para => {
        const letter = para.letter;
        para.items.forEach((oldLabel, index) => {
            const newLabel = letter + String(index + 1).padStart(2, '0');
            newAllLabels.push(newLabel);
            newTextMap[newLabel] = sentenceTextMap[oldLabel] || '';
            if (timeDataMap[oldLabel]) newTimeMap[newLabel] = timeDataMap[oldLabel];
        });
    });

    allLabelsOrdered = newAllLabels; sentenceTextMap = newTextMap; timeDataMap = newTimeMap;
    saveToStorage(); renderSentenceList(); 
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
    const idx = allLabelsOrdered.indexOf(label); if (idx === 0) return showToast('已經是第一句', 'error');
    const prevLabel = allLabelsOrdered[idx - 1];
    sentenceTextMap[prevLabel] += sentenceTextMap[label]; 
    if (timeDataMap[label]) {
        if (!timeDataMap[prevLabel]) timeDataMap[prevLabel] = { start: timeDataMap[label].start };
        timeDataMap[prevLabel].end = timeDataMap[label].end;
    }
    allLabelsOrdered.splice(idx, 1); delete sentenceTextMap[label]; delete timeDataMap[label]; reassignLabels(); showToast('已向上合併', 'success');
};
window.mergeDown = function(label) {
    const idx = allLabelsOrdered.indexOf(label); if (idx === allLabelsOrdered.length - 1) return showToast('已經是最後一句', 'error');
    const nextLabel = allLabelsOrdered[idx + 1];
    sentenceTextMap[label] += sentenceTextMap[nextLabel];
    if (timeDataMap[nextLabel]) {
        if (!timeDataMap[label]) timeDataMap[label] = { start: timeDataMap[nextLabel].start };
        timeDataMap[label].end = timeDataMap[nextLabel].end;
    }
    allLabelsOrdered.splice(idx + 1, 1); delete sentenceTextMap[nextLabel]; delete timeDataMap[nextLabel]; reassignLabels(); showToast('已向下合併', 'success');
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
    
    // 依據原始陣列重新排序選取的項目 (確保不因點選順序出錯)
    selectedLabels.sort((a, b) => allLabelsOrdered.indexOf(a) - allLabelsOrdered.indexOf(b));
    
    // 檢查是否連續
    let isContinuous = true;
    for (let i = 0; i < selectedLabels.length - 1; i++) {
        if (allLabelsOrdered.indexOf(selectedLabels[i+1]) !== allLabelsOrdered.indexOf(selectedLabels[i]) + 1) {
            isContinuous = false; break;
        }
    }
    if (!isContinuous) return showToast('合併失敗：選取的項目必須是連續的！', 'error');

    // 頭尾時間與文字結合
    const firstLabel = selectedLabels[0];
    const lastLabel = selectedLabels[selectedLabels.length - 1];
    
    let mergedText = '';
    selectedLabels.forEach(lbl => { mergedText += sentenceTextMap[lbl]; });
    sentenceTextMap[firstLabel] = mergedText;

    let finalStart = null, finalEnd = null;
    if (timeDataMap[firstLabel]) finalStart = typeof timeDataMap[firstLabel] === 'object' ? timeDataMap[firstLabel].start : timeDataMap[firstLabel];
    if (timeDataMap[lastLabel]) finalEnd = typeof timeDataMap[lastLabel] === 'object' ? timeDataMap[lastLabel].end : null;

    if (finalStart !== null) {
        timeDataMap[firstLabel] = { start: finalStart, end: finalEnd };
    }

    // 殺掉被合併掉的句子
    for (let i = 1; i < selectedLabels.length; i++) {
        const lbl = selectedLabels[i];
        allLabelsOrdered.splice(allLabelsOrdered.indexOf(lbl), 1);
        delete sentenceTextMap[lbl];
        delete timeDataMap[lbl];
    }
    
    reassignLabels(); // 裡面已經包含 clearSelection()
    showToast('合併成功！', 'success');
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
            // 允許一點微小的誤差，確保不會切在邊緣導致長度為 0
            if (times && currentTime > (times.start + 0.05) && currentTime < (times.end - 0.05)) {
                targetLabel = label;
                targetTimes = times;
                break;
            }
        }
    }

    if (!targetLabel) {
        return showToast('游標位置不在任何可切割的句子範圍內', 'error');
    }

    // 2. 紀錄 Undo 狀態
    if (typeof saveState === 'function') saveState();

    // 3. 智慧分配文字內容 (依據時間比例切割字串)
    const originalText = sentenceTextMap[targetLabel] || '';
    const timeRatio = (currentTime - targetTimes.start) / targetTimes.duration;
    const splitIndex = Math.floor(originalText.length * timeRatio);
    
    const text1 = originalText.substring(0, splitIndex);
    const text2 = originalText.substring(splitIndex);

    // 4. 產生暫時標籤並寫入陣列
    const targetIdx = allLabelsOrdered.indexOf(targetLabel);
    const prefix = targetLabel.charAt(0);
    const newLabel = prefix + '_TEMP_' + Date.now();
    
    allLabelsOrdered.splice(targetIdx + 1, 0, newLabel);
    
    // 5. 更新兩句話的文字與時間
    sentenceTextMap[targetLabel] = text1;
    sentenceTextMap[newLabel] = text2;
    
    timeDataMap[targetLabel] = { start: targetTimes.start, end: parseFloat(currentTime.toFixed(3)) };
    timeDataMap[newLabel] = { start: parseFloat(currentTime.toFixed(3)), end: targetTimes.end };

    // 6. 重新排號並渲染畫面 (reassignLabels 內已包含存檔與清單重繪)
    reassignLabels(); 
    if (typeof renderAllRegions === 'function') renderAllRegions();
    
    showToast('已成功在游標處切割句子', 'success');
}
