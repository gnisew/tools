// ================= 4e_ui_script_mode.js: 大編輯框(劇本/全文)模式核心引擎、Alt鍵防誤觸、最大播放時長設定 =================
// 本檔案由 4_ui_events.js 拆分而來（原始第 2132-2497 行），內容未經改寫，僅搬移。
// 依賴：1_globals.js 中定義的 DOM 參照與全域狀態變數，需在此檔之前載入。

// ================= ★ 大編輯框 (純文字對齊模式) 核心引擎 ★ =================

// 1. 載入文字到大編輯框 (加入 ######) 並自動觸發同步
function populateScriptEditor() {
    let textLines = [];
    let currentPara = allLabelsOrdered.length > 0 ? allLabelsOrdered[0].charAt(0) : 'A';
    
    // 開頭強制補上第一段的段落標記
    if (allLabelsOrdered.length > 0) {
        textLines.push('######');
    }

    allLabelsOrdered.forEach((label) => {
        const p = label.charAt(0);
        // 當開頭字母改變時，插入新的段落標記 ######
        if (p !== currentPara) {
            textLines.push('######');
            currentPara = p;
        }
        
        // 防呆核心：強制將句子內容的換行符號替換為空白
        let safeText = (sentenceTextMap[label] || '').replace(/\r?\n/g, ' ');
        textLines.push(safeText);
    });
    
    // 將結果寫入畫面大編輯框
    scriptTextarea.value = textLines.join('\n');
    
    // ★ 核心修復：自動觸發同步引擎！
    // 這裡的效果就等同於你手動「全選 -> 剪下 -> 貼上」，
    // 它會負責重新計算行號、生成左側的 A01/B01 標籤，並要求聲波圖同步更新。
    if (typeof renderGutterAndSyncData === 'function') {
        renderGutterAndSyncData();
    }
}

// 2. 解析大編輯框文字，依序對應給現有時間標記，並渲染行號
function renderGutterAndSyncData() {
    let rawLines = scriptTextarea.value.split('\n');
    
    // 移除尾部多餘的空行
    while (rawLines.length > 0 && rawLines[rawLines.length - 1].trim() === '') {
        rawLines.pop();
    }

    // ★ 核心修復：全域收集有效時間標記，不再被段落侷限
    const validOldTimes = allLabelsOrdered
        .filter(lbl => timeDataMap[lbl] !== undefined)
        .map(lbl => timeDataMap[lbl]);

    let newAllLabels = [];
    let newTextMap = {};
    let newTimeMap = {};
    let gutterRenderData = [];

    let paraCharIdx = 65; // 'A' 的 ASCII 碼
    let currentParaChar = 'A';
    let isFirstParaMarker = true;
    let sentenceCountInPara = 1;
    let timeAssignIdx = 0; // 全域時間分配游標

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

            // ★ 循序貼上時間，無縫跨越所有段落
            if (timeAssignIdx < validOldTimes.length) {
                newTimeMap[label] = validOldTimes[timeAssignIdx];
                timeAssignIdx++;
            }

            gutterRenderData.push({ type: 'text', label: label });
            sentenceCountInPara++;
        }
    });

    // ★ 防呆：如果時間標記比文字多，產生空句子把時間保留下來
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


// ================= ★ 6. 全文模式切換按鈕 ★ =================
// 點擊監聽器已整併至 4g_ui_export.js（唯一事實來源），此處不再重複綁定。
// 下方 syncActiveLabelFromCursor / populateScriptEditor / renderGutterAndSyncData
// 等核心引擎函式維持原樣，仍由 4g 的切換邏輯呼叫使用。
// =========================================================================

// ================= ★ 全文模式 (劇本) 游標與事件連動引擎 ★ =================

// 獨立功能：根據編輯框目前的游標位置，自動算出對應的標籤並亮起聲波圖顏色
function syncActiveLabelFromCursor() {
    if (!scriptTextarea) return null;
    const pos = scriptTextarea.selectionStart;
    const textUpToCursor = scriptTextarea.value.substring(0, pos);
    const lineIndex = textUpToCursor.split('\n').length - 1;

    const rawLines = scriptTextarea.value.split('\n');
    let paraChar = 65; // 'A' 的 ASCII
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
        // ★ 核心修復：只要游標移動到新句子，立刻更新聲波圖顏色 (變為橘紅色)
        if (typeof updateSelectionUI === 'function') updateSelectionUI();
    }
    return targetLabel;
}

// 1. 處理游標用鍵盤移動 (上下左右)、確保顏色跟著跑
scriptTextarea?.addEventListener('keyup', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        syncActiveLabelFromCursor();
    }
});

// 2. 處理滑鼠點擊內文：不僅要更新顏色，還要同步跳轉音檔 (取消自動播放)
scriptTextarea?.addEventListener('click', () => {
    const targetLabel = syncActiveLabelFromCursor();
    
    // 找到標籤後，執行跳轉與置頂 (暫停播放)
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

// 3. 當大編輯框文字改變時 (打字、按Enter換行、刪除)
let scriptInputTimeout;
scriptTextarea?.addEventListener('input', () => {
    clearTimeout(scriptInputTimeout);
    scriptInputTimeout = setTimeout(() => {
        if (typeof renderGutterAndSyncData === 'function') {
            renderGutterAndSyncData();
        }
        syncActiveLabelFromCursor(); // 重繪完畢後，確保顏色正確歸位
        
        if (typeof updateSearchMatches === 'function') {
            updateSearchMatches();
        }
    }, 500);
});
// 4. 捲動連動 (文字框捲動時，行號與高亮背板跟著捲動)
scriptTextarea?.addEventListener('scroll', () => {
    scriptGutter.scrollTop = scriptTextarea.scrollTop;
    const backdrop = document.getElementById('scriptBackdrop');
    if (backdrop) {
        backdrop.scrollTop = scriptTextarea.scrollTop;
        backdrop.scrollLeft = scriptTextarea.scrollLeft;
    }
});

// 5. 大編輯框左側「行號」點擊事件 (點擊行號 = 播放該句)
scriptGutter?.addEventListener('click', (e) => {
    if (e.target.classList.contains('gutter-line') && !e.target.classList.contains('para')) {
        const label = e.target.dataset.label;
        currentActiveLabel = label;
        
        // ★ 核心修復：點擊行號時也立刻更新顏色
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

// ================= Alt 鍵防誤觸拖曳機制 =================
let isAltPressed = false;

// 更新所有標記的拖曳狀態
function updateRegionsDragState(draggable) {
    if (typeof wsRegions !== 'undefined' && wsRegions) {
        wsRegions.getRegions().forEach(r => r.setOptions({ drag: draggable }));
    }
}

// 1. 監聽 Alt 鍵按下 (解鎖拖曳，游標變手型)
window.addEventListener('keydown', (e) => {
    // 判斷是否按下 Alt 鍵
    if (e.key === 'Alt') {
        isAltPressed = true;
        updateRegionsDragState(true);
    }
});

// 2. 監聽 Alt 鍵放開 (鎖定拖曳)
window.addEventListener('keyup', (e) => {
    if (e.key === 'Alt') {
        isAltPressed = false;
        updateRegionsDragState(false);
    }
});

// 3. 安全防護：當視窗失去焦點 (如切換分頁) 時，自動解除 Alt 狀態，避免按鍵卡住
window.addEventListener('blur', () => {
    isAltPressed = false;
    updateRegionsDragState(false);
});

// 4. 動態巡檢引擎：確保所有「新產生」的標記預設都被強制鎖定
// 這樣就不用去修改所有新增標記或斷句的原始程式碼
setInterval(() => {
    if (!isAltPressed && typeof wsRegions !== 'undefined' && wsRegions) {
        wsRegions.getRegions().forEach(r => {
            // 如果發現有標記處於可拖曳狀態，立刻將其鎖定，保留縮放邊緣功能
            if (r.drag === true) {
                r.setOptions({ drag: false });
            }
        });
    }
}, 200);

const enableMinimapCheck = document.getElementById('enableMinimapCheck');

if (enableMinimapCheck) {
    // 網頁載入時，讀取先前的設定狀態 (預設為 false)
    enableMinimapCheck.checked = localStorage.getItem('tagger_enableMinimap') === 'true';

    // 監聽使用者打勾/取消打勾的動作
    enableMinimapCheck.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        // 記憶設定
        localStorage.setItem('tagger_enableMinimap', isEnabled ? 'true' : 'false');
        
        // 即時呼叫控制引擎，顯示或隱藏
        if (typeof toggleMinimap === 'function') {
            toggleMinimap(isEnabled);
        }
    });
}


// ================= ★ 新增：最大播放時長設定綁定與記憶 ★ =================
