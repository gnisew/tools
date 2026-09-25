// ================= 5_list_renderer.js: 清單渲染與選取邏輯 =================

function updateSelectionUI() {
    // 1. 先拔除畫面上所有已選取的樣式 (極快速的 DOM 查詢)
    document.querySelectorAll('.sentence-item.selected-row').forEach(item => {
        item.classList.remove('selected-row');
    });
    
    // 2. 只針對有被選取的標籤，精準加上樣式 (免除全體掃描)
    selectedLabels.forEach(lbl => {
        const item = document.getElementById(`item-${lbl}`);
        if (item) item.classList.add('selected-row');
    });

    // ★ 修正：列表「目前焦點列」(綠底 playing) 統一在這裡與 currentActiveLabel 同步，
    //   不再讓各呼叫端各自手動加減 class。原本聲波圖點擊、Tab 跳句、自動連續播放等
    //   多處各自維護一份「移除全部 playing → 找 itemDiv → 加上 playing」的重複邏輯，
    //   只要有任何一處漏掉或提早 return，就會出現「聲波圖焦點動了、列表綠底卻沒跟著動」
    //   的不同步問題。現在只要 currentActiveLabel 有更新、且呼叫了 updateSelectionUI()
    //   (幾乎所有會改動 currentActiveLabel 的地方都會呼叫)，列表就一定會跟著同步。
    document.querySelectorAll('.sentence-item.playing').forEach(item => {
        item.classList.remove('playing');
    });
    if (currentActiveLabel) {
        const activeItem = document.getElementById(`item-${currentActiveLabel}`);
        if (activeItem) activeItem.classList.add('playing');
    }

    // ★ 新增：每次更新選取狀態時，順便將目前的游標標記存入暫存
    if (currentActiveLabel) {
        localStorage.setItem('tagger_lastActiveLabel', currentActiveLabel);
    }

    if (wsRegions) {
        wsRegions.getRegions().forEach(r => {
            if (r === tempRegion) return;
            if (selectedLabels.includes(r.id)) {
                r.setOptions({ color: 'rgba(25, 118, 210, 0.25)' }); 
            } else if (r.id === currentActiveLabel) {
                r.setOptions({ color: 'rgba(255, 112, 67, 0.15)' }); 
            } else {
                r.setOptions({ color: 'rgba(0, 137, 123, 0.1)' });   
            }
        });
    }

    let isContinuousSelection = false;
    if (selectedLabels.length > 1) {
        // 先將選取的標籤依照原始順序排序
        let sortedSelected = [...selectedLabels].sort((a, b) => allLabelsOrdered.indexOf(a) - allLabelsOrdered.indexOf(b));
        isContinuousSelection = true;
        // 檢查是否每一個項目的索引都剛好比前一個多 1
        for (let i = 0; i < sortedSelected.length - 1; i++) {
            if (allLabelsOrdered.indexOf(sortedSelected[i+1]) !== allLabelsOrdered.indexOf(sortedSelected[i]) + 1) {
                isContinuousSelection = false;
                break;
            }
        }
    }

    // 列表上方的合併按鈕：只有在連續選取時才顯示
    if (mergeSelectedBtn) {
        mergeSelectedBtn.style.display = isContinuousSelection ? 'inline-flex' : 'none';
    }

    if (adjustPaddingBtn) {
        adjustPaddingBtn.style.display = selectedLabels.length > 0 ? 'inline-flex' : 'none';
    }

    updateToolbarButtons();
}

function toggleSelection(label) {
    const idx = selectedLabels.indexOf(label);
    if (idx > -1) selectedLabels.splice(idx, 1);
    else selectedLabels.push(label);
    updateSelectionUI();
}

function selectRange(startLabel, endLabel) {
    if (!startLabel || !allLabelsOrdered.includes(startLabel)) {
        startLabel = currentActiveLabel || allLabelsOrdered[0];
    }
    const startIdx = allLabelsOrdered.indexOf(startLabel);
    const endIdx = allLabelsOrdered.indexOf(endLabel);
    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);
    
    selectedLabels = [];
    for (let i = minIdx; i <= maxIdx; i++) {
        selectedLabels.push(allLabelsOrdered[i]);
    }
    updateSelectionUI();
}

function clearSelection() {
    selectedLabels = [];
    updateSelectionUI();
}

function updateSingleTimeDisplay(label, optionalIndex = -1) {
    const timeSpan = document.getElementById(`time-${label}`); 
    const verifyBtn = document.getElementById(`verify-${label}`); 
    const itemDiv = document.getElementById(`item-${label}`);
    
    if (!timeSpan || !itemDiv) return;
    
    const times = getCalculatedTimes(label, optionalIndex);
    if (times) {
        itemDiv.classList.add('tagged'); 
        const mode = timeModes[currentTimeModeIndex].id;
        const d = timeDecimalPlaces;
        
        // 核心修改：為時間加上 Material Design 的專屬顏色
        const startStr = `<span style="color: #1976D2;">${times.start.toFixed(d)}</span>`; // 藍色 (Blue 700)
        const endStr = `<span style="color: #388E3C;">${times.end.toFixed(d)}</span>`;     // 綠色 (Green 700)
        const durStr = `<span style="color: #757575; font-size: 0.85em;">(${times.duration.toFixed(d)})</span>`; // 灰色 (Grey 600)
        
        // ★ 核心修復：完美還原設計！左側放上下時間，右側放垂直置中的時長
        if (mode === 'start') {
            timeSpan.innerHTML = startStr; 
        } else if (mode === 'duration') {
            timeSpan.innerHTML = durStr; 
        } else if (mode === 'range') {
            // 只有頭尾時，分為上下兩個 div
            timeSpan.innerHTML = `<div>${startStr}</div><div>${endStr}</div>`; 
        } else {
            // 完整模式：左邊垂直排列時間，右邊垂直置中放時長
            timeSpan.innerHTML = `
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="display: flex; flex-direction: column; align-items: flex-end;">
                        <div>${startStr}</div>
                        <div>${endStr}</div>
                    </div>
                    <div>${durStr}</div>
                </div>
            `;
        }
        
        if(verifyBtn) verifyBtn.style.display = 'flex';
    } else {
        itemDiv.classList.remove('tagged'); 
        timeSpan.textContent = '--:--'; 
        if(verifyBtn) verifyBtn.style.display = 'none';
    }
    
    if (typeof checkButtonVisibility === 'function') checkButtonVisibility();
}


let updateTimeDisplaysTimeout = null;

function updateAllTimeDisplays() { 
    clearTimeout(updateTimeDisplaysTimeout);
    
    updateTimeDisplaysTimeout = setTimeout(() => {
        allLabelsOrdered.forEach((label, idx) => updateSingleTimeDisplay(label, idx));
        if (!isDraggingRegion && typeof renderAllRegions === 'function') renderAllRegions(); 
    }, 100);
}

function renderSentenceList() {
    const hasAudio = localStorage.getItem('tagger_audioUrl') || localStorage.getItem('tagger_localFileName');
    listPanel.style.display = (allLabelsOrdered.length > 0 || hasAudio) ? 'block' : 'none';
    
    sentenceList.innerHTML = '';
	if (showClearBtns) sentenceList.classList.add('show-clear-btns'); 
    if (showShiftBtns) sentenceList.classList.add('show-shift-btns'); 
    if (showMoreBtns) sentenceList.classList.add('show-more-btns'); 
    if (typeof showTagBtns !== 'undefined' && showTagBtns) sentenceList.classList.add('show-tag-btns');
    currentSortedLabels = [...allLabelsOrdered];
    
    if (currentSortMode !== 'default') {
        currentSortedLabels.sort((a, b) => {
            const hasTimeA = timeDataMap[a] !== undefined;
            const hasTimeB = timeDataMap[b] !== undefined;
            
            if (!hasTimeA && !hasTimeB) return a.localeCompare(b);
            if (!hasTimeA) return 1;  
            if (!hasTimeB) return -1; 

            if (currentSortMode === 'duration-asc') {
                const durA = getCalculatedTimes(a).duration;
                const durB = getCalculatedTimes(b).duration;
                if (durA === durB) return a.localeCompare(b);
                return durA - durB;
            } else if (currentSortMode === 'duration-desc') {
                const durA = getCalculatedTimes(a).duration;
                const durB = getCalculatedTimes(b).duration;
                if (durA === durB) return a.localeCompare(b);
                return durB - durA;
            } else if (currentSortMode === 'text') {
                const textA = sentenceTextMap[a] || '';
                const textB = sentenceTextMap[b] || '';
                if (textA === textB) return a.localeCompare(b);
                return textA.localeCompare(textB, 'zh-Hant');
            }
            return 0;
        });
    }

    // 在迴圈開始前，建立一個虛擬容器 (DocumentFragment)
    const fragment = document.createDocumentFragment();

    currentSortedLabels.forEach(label => {
        // ★ 新增：多語言字幕檢視。fullText 是存在 sentenceTextMap 裡「完整」的原始字串
        // （可能含多語言分隔字元），text 則是依目前「檢視模式」實際要顯示在畫面上的內容：
        // 「原始」模式顯示整串；「只看第 N 語言」模式只顯示該語言那一段。
        const fullText = sentenceTextMap[label] || '';
        const langViewIndex = (typeof getCurrentLangViewIndex === 'function') ? getCurrentLangViewIndex() : null;
        const text = (langViewIndex !== null && typeof getLang === 'function') ? getLang(fullText, langViewIndex) : fullText;
        // 「這一列是否空白」要看所有語言（而不是只看目前顯示的那個語言），避免只是切到某個
        // 還沒填詞的語言，就被誤判成空白列而顯示「刪除」圖示。
        const isRowBlank = (typeof isBlank === 'function') ? isBlank(fullText) : text.trim() === '';
        const paraIndex = label.charCodeAt(0) - 65; const colorVar = `var(--color-p${paraIndex % 10})`;
        const displayLabel = typeof window.getDisplayLabel === 'function' ? window.getDisplayLabel(label) : label;
        const div = document.createElement('div'); div.className = 'sentence-item'; div.id = `item-${label}`; div.dataset.rawText = fullText; 
        
        if (selectedLabels.includes(label)) div.classList.add('selected-row');
        // ★ 新增：整份清單重繪時（例如編輯文字、匯入、切換語言檢視等），若這一列正是
        //   目前的焦點列，直接補上 playing class，避免重繪後焦點列的綠底消失。
        if (label === currentActiveLabel) div.classList.add('playing');

        // 修改：在選單的各個破壞性操作中，插入 saveState(); 
        div.innerHTML = `
            <div class="sentence-content">
                <button class="action-icon-btn verify-btn" id="verify-${label}" title="播放該句" aria-label="播放該句"><span class="material-icons">volume_up</span></button>
                <span class="sentence-label" style="color: ${colorVar};">${displayLabel}</span>

                <span class="sentence-text-display ${isEditMode ? 'is-editable' : ''}" ${isEditMode ? 'contenteditable="true" role="textbox" aria-multiline="false" aria-label="字幕文字，可點擊編輯"' : ''} spellcheck="false">${escapeHtml(text)}</span>
                
                <button class="inline-delete-btn" id="inline-del-${label}" title="刪除此列與聲波標記" aria-label="刪除此列與聲波標記" style="${isRowBlank ? 'display:flex;' : 'display:none;'}"><span class="material-icons">delete</span></button>
            </div>
            <div class="sentence-actions">
                <button class="action-icon-btn shift-time-btn" title="批次平移時間" aria-label="批次平移時間"><span class="material-icons">update</span></button>
                <span class="sentence-time" id="time-${label}" title="從該句播放">--:--</span>
                <button class="action-icon-btn clear-tag-btn" title="清除時間" aria-label="清除時間"><span class="material-icons">clear</span></button>
                <button class="action-icon-btn tag-time-btn" title="標記時間" aria-label="標記時間"><span class="material-icons">add_alarm</span></button>
                <button class="action-icon-btn more-options-btn" title="更多選項" aria-label="更多選項"><span class="material-icons">more_vert</span></button>
                <div class="custom-dropdown-menu item-more-menu" id="menu-${label}">
					<div class="custom-dropdown-item" onclick="syncToPlayheadAndShift('${label}')"><span class="material-icons" style="font-size:1.1rem; margin-right:4px; color:#00897B;">sync_alt</span> 對齊游標並平移後續</div>
                    <div class="custom-dropdown-item" onclick="insertUp('${label}')"><span class="material-icons" style="font-size:1.1rem; margin-right:4px;">arrow_upward</span> 向上新增一列</div>
                    <div class="custom-dropdown-item" onclick="insertDown('${label}')"><span class="material-icons" style="font-size:1.1rem; margin-right:4px;">arrow_downward</span> 向下新增一列</div>
                    <div class="custom-dropdown-item" onclick="removeRow('${label}')"><span class="material-icons" style="font-size:1.1rem; margin-right:4px;">close</span> 移除此列</div><hr>
                    <div class="custom-dropdown-item" onclick="mergeUp('${label}')"><span class="material-icons" style="font-size:1.1rem; margin-right:4px;">arrow_back</span> 向前合併聲波標記</div>
                    <div class="custom-dropdown-item" onclick="mergeDown('${label}')"><span class="material-icons" style="font-size:1.1rem; margin-right:4px;">arrow_forward</span> 向後合併聲波標記</div><hr>
                    <div class="custom-dropdown-item" onclick="downloadSingleAudio('${label}')" style="color: #1976D2;"><span class="material-icons" style="font-size:1.1rem; margin-right:4px;">music_note</span> 匯出音檔</div><hr>
                    <div class="custom-dropdown-item" style="color: #E53935;" onclick="deleteSentence('${label}')"><span class="material-icons" style="font-size:1.1rem; margin-right:4px;">delete</span> 刪除此列與聲波標記</div>
                </div>
            </div>
        `;
        const textDisplay = div.querySelector('.sentence-text-display'); const inlineDelBtn = div.querySelector(`#inline-del-${label}`);
        inlineDelBtn.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            // ★ 集中化：deleteSentence 內部已會呼叫 saveState()，這裡不必重複
            deleteSentence(label); 
        });

        div.addEventListener('mousedown', (e) => {
            if (e.target.closest('.action-icon-btn') || e.target.closest('.inline-delete-btn') || e.target.closest('.item-more-menu')) return; 
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault(); toggleSelection(label); lastSelectedLabel = label; 
            } else if (e.shiftKey) {
                e.preventDefault(); selectRange(lastSelectedLabel, label);
            }
        });

        div.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey || e.shiftKey) return; 
            if (e.target.closest('.action-icon-btn') || e.target.closest('.inline-delete-btn') || e.target.closest('.item-more-menu')) return; 
            if (e.target.closest('.sentence-text-display')) return; 

            clearSelection();
            lastSelectedLabel = label; 
            currentActiveLabel = label; 
            
            if (!isEditMode) {
                div.querySelector('.sentence-time').click(); 
            } else {
                updateSelectionUI(); 
            }
        });

        textDisplay.addEventListener('focus', () => {
            clearSelection(); 
            lastSelectedLabel = label; 
            currentActiveLabel = label; 
            const times = getCalculatedTimes(label);
            if (times) {
                audioPlayer.currentTime = times.start; 
                updateSelectionUI(); 
            }
        });
        textDisplay.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey || e.shiftKey) return; 
            currentActiveLabel = label; 
            if (!isEditMode) {
                const times = getCalculatedTimes(label);
                if (times) { 
                    audioPlayer.currentTime = times.start; 
                    updateSelectionUI(); 
                    if (currentSortMode === 'default') smartScrollTo(div); 
                }
            } else e.stopPropagation(); 
        });

        // ★ 核心修復：加入防抖計時器
        let rowInputTimeout = null;

        textDisplay.addEventListener('input', () => {
            // ★ 修改：切換刪除按鈕顯示狀態，要看「所有語言」是否都空白，而不只是目前顯示的這段
            const curLangViewIndex = (typeof getCurrentLangViewIndex === 'function') ? getCurrentLangViewIndex() : null;
            const prospectiveFull = (curLangViewIndex !== null && typeof setLang === 'function')
                ? setLang(sentenceTextMap[label] || '', curLangViewIndex, textDisplay.textContent)
                : textDisplay.textContent;
            inlineDelBtn.style.display = (typeof isBlank === 'function' ? isBlank(prospectiveFull) : textDisplay.textContent.trim() === '') ? 'flex' : 'none';

            clearTimeout(rowInputTimeout);
            rowInputTimeout = setTimeout(() => {
                const tempText = textDisplay.textContent.trim().replace(/\([^)]+\)/g, '');
                if (typeof updateRegionTextDisplay === 'function') {
                    updateRegionTextDisplay(label, tempText);
                }
            }, 500);
        });
        
        // 當修改完文字移開焦點時，正式紀錄狀態並存檔
        textDisplay.addEventListener('blur', () => {
            // 取得目前的輸入內容，並利用 trim() 濾掉頭尾空白
            const rawInput = textDisplay.textContent;
            const newSegText = rawInput.trim();
            
            // ★ 高效清除空白：只要發現有不小心的頭尾空白，就在畫面上立刻幫他清除掉
            // 這不需要存取全域迴圈，直接修改 DOM，極度節省效能！
            if (rawInput !== newSegText) {
                textDisplay.textContent = newSegText;
            }

            // 去除可能干擾的括號
            const cleanSegText = newSegText.replace(/\([^)]+\)/g, '');

            // ★ 修改：依目前「檢視模式」算出應該存回 sentenceTextMap 的完整字串
            // 「原始」模式：跟過去行為一樣，整串直接覆蓋
            // 「只看第 N 語言」模式：只替換該語言那一段，其他語言的文字不能被動到
            const curLangViewIndex = (typeof getCurrentLangViewIndex === 'function') ? getCurrentLangViewIndex() : null;
            const prevFullText = sentenceTextMap[label] || '';
            const newFullText = (curLangViewIndex !== null && typeof setLang === 'function')
                ? setLang(prevFullText, curLangViewIndex, cleanSegText)
                : cleanSegText;

            // 檢查真正的文字內容是否有被修改過
            if (newFullText !== prevFullText) { 
                if(typeof saveState === 'function') saveState(); // 紀錄歷史狀態
                div.dataset.rawText = newFullText; 
                sentenceTextMap[label] = newFullText; 
                saveToStorage(); 

                // 終極防護：確保失去焦點時，聲波圖文字必定是最新狀態
                if (typeof updateRegionTextDisplay === 'function') {
                    updateRegionTextDisplay(label, newFullText);
                }
            }
        });

        textDisplay.addEventListener('keydown', (e) => { 
            if (e.key === 'Enter') { e.preventDefault(); textDisplay.blur(); } 
            
            // ★ 支援 Shift + Tab 往回跳
            if (e.key === 'Tab') { 
                e.preventDefault(); 
                jumpToRegion(e.shiftKey ? -1 : 1); 
            }
        });

        div.querySelector('.more-options-btn').addEventListener('click', (e) => {
            e.stopPropagation(); const moreMenu = div.querySelector(`#menu-${label}`); document.querySelectorAll('.item-more-menu').forEach(m => { if (m !== moreMenu) m.classList.remove('show'); });
            const rect = div.querySelector('.more-options-btn').getBoundingClientRect();
            if (window.innerHeight - rect.bottom < 250) { moreMenu.style.top = 'auto'; moreMenu.style.bottom = '100%'; moreMenu.style.marginBottom = '8px'; } 
            else { moreMenu.style.top = '100%'; moreMenu.style.bottom = 'auto'; moreMenu.style.marginBottom = '0'; }
            moreMenu.classList.toggle('show');
        });

        div.querySelector('.shift-time-btn').addEventListener('click', (e) => {
            e.stopPropagation(); if (!isEditMode) return;
            showCustomDialog({ title: '平移時間', message: `輸入秒數：`, isPrompt: true, defaultValue: '0', onConfirm: (offsetStr) => {
                const offset = parseFloat(offsetStr); if (isNaN(offset) || offset === 0) return;
                
                if(typeof saveState === 'function') saveState(); // 紀錄狀態

                const startIndex = allLabelsOrdered.indexOf(label); let modifiedCount = 0;
                for (let i = startIndex; i < allLabelsOrdered.length; i++) {
                    const curLabel = allLabelsOrdered[i];
                    if (timeDataMap[curLabel] !== undefined) {
                        let newStart = (typeof timeDataMap[curLabel] === 'object' ? timeDataMap[curLabel].start : timeDataMap[curLabel]) + offset; if (newStart < 0) newStart = 0; 
                        let newEnd = (typeof timeDataMap[curLabel] === 'object' && timeDataMap[curLabel].end !== null) ? Math.max(0, timeDataMap[curLabel].end + offset) : null;
                        timeDataMap[curLabel] = { start: parseFloat(newStart.toFixed(3)), end: newEnd !== null ? parseFloat(newEnd.toFixed(3)) : null }; modifiedCount++;
                    }
                }
                saveToStorage(); updateAllTimeDisplays(); showToast(`成功平移 ${modifiedCount} 句`, 'success');
            }});
        });

        div.querySelector('.clear-tag-btn').addEventListener('click', (e) => { 
            e.stopPropagation(); if (!isEditMode) return; 
            // ★ 集中化：handleClearTag 內部已會呼叫 saveState()，這裡不必重複
            handleClearTag(label); 
        });
        
        div.querySelector('.tag-time-btn').addEventListener('click', (e) => {
            e.stopPropagation(); if (!isEditMode) return; if (!audioPlayer.src) return;
            let rawTime = audioPlayer.currentTime - 0.2; if (rawTime < 0) rawTime = 0; const finalTime = parseFloat(rawTime.toFixed(3));
            const currentIndex = allLabelsOrdered.indexOf(label); let prevTime = 0, nextTime = Infinity;
            for (let i = currentIndex - 1; i >= 0; i--) { if (timeDataMap[allLabelsOrdered[i]] !== undefined) { const pData = timeDataMap[allLabelsOrdered[i]]; prevTime = typeof pData === 'object' ? pData.start : pData; break; } }
            for (let i = currentIndex + 1; i < allLabelsOrdered.length; i++) { if (timeDataMap[allLabelsOrdered[i]] !== undefined) { const nData = timeDataMap[allLabelsOrdered[i]]; nextTime = typeof nData === 'object' ? nData.start : nData; break; } }
            if (finalTime < prevTime || finalTime > nextTime) return showToast('失敗！時間順序錯誤', 'error');
            
            if(typeof saveState === 'function') saveState();
            timeDataMap[label] = { start: finalTime, end: null }; saveToStorage(); updateAllTimeDisplays(); scrollToKeepMouseSteady(div.nextElementSibling); 
        });

        // 1. 修正「時間標籤」的點擊播放事件
        div.querySelector('.sentence-time').addEventListener('click', (e) => {
            e.stopPropagation(); clearSelection(); lastSelectedLabel = label; currentActiveLabel = label; 
            
            if (typeof currentLoopCounter !== 'undefined') currentLoopCounter = 0; 
            
            const times = getCalculatedTimes(label);
            if (times) { 
                if(typeof applyCurrentPlaybackSpeed === 'function') applyCurrentPlaybackSpeed(); 
                
                // 計算最大播放時間
                let targetEnd = times.end;
                const isMaxPlayEnabled = document.getElementById('enableMaxPlayCheck')?.checked;
                if (isMaxPlayEnabled) {
                    const maxSec = parseFloat(document.getElementById('maxPlaySecondsInput')?.value) || 2;
                    targetEnd = Math.min(times.end, times.start + maxSec);
                }

                // 判斷是否為連續播放模式
                if (currentSortMode !== 'default' || continuousPlayMode === 'skip') {
                    isContinuousSortedPlay = true; 
                    verifyEndTime = targetEnd; 
                    verifyingLabel = label;
                } else {
                    isContinuousSortedPlay = false; 
                    verifyEndTime = isMaxPlayEnabled ? targetEnd : null; 
                    verifyingLabel = isMaxPlayEnabled ? label : null;
                }
                
                // ★ 修正核心：加入跳轉鎖，並優先使用 wavesurfer.setTime
                window.jumpLockTime = Date.now();
                if (typeof wavesurfer !== 'undefined' && wavesurfer) {
                    wavesurfer.setTime(times.start);
                } else {
                    audioPlayer.currentTime = times.start;
                }

                // 加入 50 毫秒延遲，確保 WaveSurfer 與 Audio 引擎同步後再播放
                setTimeout(() => {
                    const playPromise = (typeof wavesurfer !== 'undefined' && wavesurfer) ? wavesurfer.play() : audioPlayer.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(err => { if (err.name !== 'AbortError') console.warn(err); });
                    }
                }, 50);

                updateSelectionUI();
            } 
        });

        // 2. 修正「喇叭圖示 (播放該句)」的點擊播放事件
        div.querySelector('.verify-btn').addEventListener('click', (e) => {
            e.stopPropagation(); currentActiveLabel = label; 
            
            if (typeof currentLoopCounter !== 'undefined') currentLoopCounter = 0; 
            
            const times = getCalculatedTimes(label);
            if (times) {
                // 計算最大播放時間
                let targetEnd = times.end;
                if (document.getElementById('enableMaxPlayCheck')?.checked) {
                    const maxSec = parseFloat(document.getElementById('maxPlaySecondsInput')?.value) || 2;
                    targetEnd = Math.min(times.end, times.start + maxSec);
                }

                isContinuousSortedPlay = false; 
                verifyEndTime = targetEnd; 
                verifyingLabel = label; 
                
                if(typeof applyCurrentPlaybackSpeed === 'function') applyCurrentPlaybackSpeed(); 

                // ★ 修正核心：加入跳轉鎖，並優先使用 wavesurfer.setTime
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

                updateSelectionUI();
            }
        });
        fragment.appendChild(div);
    });
    
    sentenceList.appendChild(fragment);

    if (mergeSelectedBtn) mergeSelectedBtn.style.display = selectedLabels.length > 1 ? 'inline-flex' : 'none';
    
    updateAllTimeDisplays(); if(typeof updateStickyOffsets === 'function') updateStickyOffsets();
}