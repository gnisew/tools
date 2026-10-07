// 4e_ui_script_mode.js: 大編輯框（劇本/全文）模式核心引擎、Alt 鍵防誤觸拖曳、迷你地圖設定
// 依賴：1_globals.js 的 DOM 參照與全域狀態變數，需先載入。
// 單句/全文模式的切換按鈕統一綁定在 4g_ui_export.js，由它呼叫本檔的 populateScriptEditor。

// 將句子載入大編輯框（以 ###### 分隔段落），並觸發同步以重算行號與標籤
function populateScriptEditor() {
    let textLines = [];
    let currentPara = allLabelsOrdered.length > 0 ? allLabelsOrdered[0].charAt(0) : 'A';

    if (allLabelsOrdered.length > 0) {
        textLines.push('######');
    }

    allLabelsOrdered.forEach((label) => {
        const p = label.charAt(0);
        if (p !== currentPara) {
            textLines.push('######');
            currentPara = p;
        }

        // 句子內的換行一律換成空白，避免破壞逐行對應
        let safeText = (sentenceTextMap[label] || '').replace(/\r?\n/g, ' ');
        textLines.push(safeText);
    });

    scriptTextarea.value = textLines.join('\n');

    if (typeof renderGutterAndSyncData === 'function') {
        renderGutterAndSyncData();
    }
}

// 解析大編輯框文字，依序對應給現有時間標記，並渲染行號
function renderGutterAndSyncData() {
    let rawLines = scriptTextarea.value.split('\n');

    while (rawLines.length > 0 && rawLines[rawLines.length - 1].trim() === '') {
        rawLines.pop();
    }

    // 時間標記不分段落，全域依序收集、依序分配
    const validOldTimes = allLabelsOrdered
        .filter(lbl => timeDataMap[lbl] !== undefined)
        .map(lbl => timeDataMap[lbl]);

    let newAllLabels = [];
    let newTextMap = {};
    let newTimeMap = {};
    let gutterRenderData = [];

    let paraCharIdx = 65; // 'A'
    let currentParaChar = 'A';
    let isFirstParaMarker = true;
    let sentenceCountInPara = 1;
    let timeAssignIdx = 0;

    rawLines.forEach((line) => {
        if (/^#{6,}$/.test(line.trim())) {
            if (!isFirstParaMarker) {
                paraCharIdx++;
                currentParaChar = String.fromCharCode(paraCharIdx);
            }
            isFirstParaMarker = false;
            sentenceCountInPara = 1;
            gutterRenderData.push({ type: 'para', char: currentParaChar });
        } else {
            if (isFirstParaMarker) {
                gutterRenderData.push({ type: 'para', char: currentParaChar });
                isFirstParaMarker = false;
            }

            const label = currentParaChar + String(sentenceCountInPara).padStart(2, '0');
            newAllLabels.push(label);
            newTextMap[label] = line.trim();

            if (timeAssignIdx < validOldTimes.length) {
                newTimeMap[label] = validOldTimes[timeAssignIdx];
                timeAssignIdx++;
            }

            gutterRenderData.push({ type: 'text', label: label });
            sentenceCountInPara++;
        }
    });

    // 時間標記比文字多時，補空句子保留多出的時間
    while (timeAssignIdx < validOldTimes.length) {
        const label = currentParaChar + String(sentenceCountInPara).padStart(2, '0');
        newAllLabels.push(label);
        newTextMap[label] = '';
        newTimeMap[label] = validOldTimes[timeAssignIdx];
        timeAssignIdx++;
        sentenceCountInPara++;
    }

    allLabelsOrdered = newAllLabels;
    sentenceTextMap = newTextMap;
    timeDataMap = newTimeMap;
    saveToStorage();

    let html = '';
    gutterRenderData.forEach(item => {
        if (item.type === 'para') {
            html += `<div class="gutter-line para">${item.char}</div>`;
        } else {
            const displayLabel = typeof window.getDisplayLabel === 'function' ? window.getDisplayLabel(item.label) : item.label;
            html += `<div class="gutter-line" id="gutter-${item.label}" data-label="${item.label}">${displayLabel}</div>`;
        }
    });

    scriptGutter.innerHTML = html;
    if (!isRendering && typeof renderAllRegions === 'function') renderAllRegions();
}

// 依游標位置算出對應標籤，並更新聲波圖的選取顏色
function syncActiveLabelFromCursor() {
    if (!scriptTextarea) return null;
    const pos = scriptTextarea.selectionStart;
    const textUpToCursor = scriptTextarea.value.substring(0, pos);
    const lineIndex = textUpToCursor.split('\n').length - 1;

    const rawLines = scriptTextarea.value.split('\n');
    let paraChar = 65; // 'A'
    let sentenceCount = 1;
    let targetLabel = null;

    for (let i = 0; i <= lineIndex; i++) {
        if (/^#{6,}$/.test(rawLines[i].trim())) {
            if (sentenceCount > 1) paraChar++;
            sentenceCount = 1;
        } else {
            targetLabel = String.fromCharCode(paraChar) + String(sentenceCount).padStart(2, '0');
            sentenceCount++;
        }
    }

    if (targetLabel && targetLabel !== currentActiveLabel) {
        currentActiveLabel = targetLabel;
        if (typeof updateSelectionUI === 'function') updateSelectionUI();
    }
    return targetLabel;
}

// 方向鍵移動游標時同步顏色
scriptTextarea?.addEventListener('keyup', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        syncActiveLabelFromCursor();
    }
});

// 點擊內文：更新顏色並跳轉音檔（不自動播放）
scriptTextarea?.addEventListener('click', () => {
    const targetLabel = syncActiveLabelFromCursor();

    if (targetLabel && timeDataMap[targetLabel]) {
        const times = getCalculatedTimes(targetLabel);
        if (times) {
            audioPlayer.currentTime = times.start;
            audioPlayer.pause();
        }

        if (typeof snapWaveformToTop === 'function') {
            setTimeout(snapWaveformToTop, 50);
        }
    }
});

// 文字改變（打字、換行、刪除）：延遲 500ms 後同步
let scriptInputTimeout;
scriptTextarea?.addEventListener('input', () => {
    clearTimeout(scriptInputTimeout);
    scriptInputTimeout = setTimeout(() => {
        if (typeof renderGutterAndSyncData === 'function') {
            renderGutterAndSyncData();
        }
        syncActiveLabelFromCursor();

        if (typeof updateSearchMatches === 'function') {
            updateSearchMatches();
        }
    }, 500);
});

// 捲動連動：行號與高亮背板跟著文字框捲動
scriptTextarea?.addEventListener('scroll', () => {
    scriptGutter.scrollTop = scriptTextarea.scrollTop;
    const backdrop = document.getElementById('scriptBackdrop');
    if (backdrop) {
        backdrop.scrollTop = scriptTextarea.scrollTop;
        backdrop.scrollLeft = scriptTextarea.scrollLeft;
    }
});

// 點擊行號：播放該句
scriptGutter?.addEventListener('click', (e) => {
    if (e.target.classList.contains('gutter-line') && !e.target.classList.contains('para')) {
        const label = e.target.dataset.label;
        currentActiveLabel = label;

        if (typeof updateSelectionUI === 'function') updateSelectionUI();
        if (typeof currentLoopCounter !== 'undefined') currentLoopCounter = 0;

        const times = getCalculatedTimes(label);
        if (times) {
            isContinuousSortedPlay = false;
            let targetEnd = times.end;
            if (document.getElementById('enableMaxPlayCheck')?.checked) {
                const maxSec = parseFloat(document.getElementById('maxPlaySecondsInput')?.value) || 2;
                targetEnd = Math.min(times.end, times.start + maxSec);
            }
            verifyEndTime = targetEnd;
            verifyingLabel = label;

            if(typeof applyCurrentPlaybackSpeed === 'function') applyCurrentPlaybackSpeed();

            window.jumpLockTime = Date.now();
            if (typeof wavesurfer !== 'undefined' && wavesurfer) {
                wavesurfer.setTime(times.start);
            } else {
                audioPlayer.currentTime = times.start;
            }

            setTimeout(() => {
                const playPromise = (typeof wavesurfer !== 'undefined' && wavesurfer) ? wavesurfer.play() : audioPlayer.play();
                if (playPromise !== undefined) {
                    playPromise.catch(err => { if (err.name !== 'AbortError') console.warn(err); });
                }
            }, 50);
        }

        if (typeof snapWaveformToTop === 'function') snapWaveformToTop();
    }
});

// ---------- Alt 鍵防誤觸拖曳 ----------
// 標記預設鎖定拖曳（保留邊緣縮放），按住 Alt 才可拖曳
let isAltPressed = false;

function updateRegionsDragState(draggable) {
    if (typeof wsRegions !== 'undefined' && wsRegions) {
        wsRegions.getRegions().forEach(r => r.setOptions({ drag: draggable }));
    }
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Alt') {
        isAltPressed = true;
        updateRegionsDragState(true);
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'Alt') {
        isAltPressed = false;
        updateRegionsDragState(false);
    }
});

// 視窗失焦（如切換分頁）時解除 Alt 狀態，避免按鍵卡住
window.addEventListener('blur', () => {
    isAltPressed = false;
    updateRegionsDragState(false);
});

// 定時巡檢，讓新產生的標記也預設鎖定，不必修改各處新增標記的程式碼
setInterval(() => {
    if (!isAltPressed && typeof wsRegions !== 'undefined' && wsRegions) {
        wsRegions.getRegions().forEach(r => {
            if (r.drag === true) {
                r.setOptions({ drag: false });
            }
        });
    }
}, 200);

// ---------- 迷你地圖設定 ----------
const enableMinimapCheck = document.getElementById('enableMinimapCheck');

if (enableMinimapCheck) {
    enableMinimapCheck.checked = localStorage.getItem('tagger_enableMinimap') === 'true';

    enableMinimapCheck.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        localStorage.setItem('tagger_enableMinimap', isEnabled ? 'true' : 'false');

        if (typeof toggleMinimap === 'function') {
            toggleMinimap(isEnabled);
        }
    });
}
