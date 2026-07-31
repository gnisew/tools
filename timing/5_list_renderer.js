// ================= 5_list_renderer.js: 清單渲染與選取邏輯 =================

function updateSelectionUI() {
    document.querySelectorAll('.sentence-item').forEach(item => {
        const lbl = item.id.replace('item-', '');
        if (selectedLabels.includes(lbl)) {
            item.classList.add('selected-row');
        } else {
            item.classList.remove('selected-row');
        }
    });
    
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

function updateSingleTimeDisplay(label) {
    const timeSpan = document.getElementById(`time-${label}`); 
    const verifyBtn = document.getElementById(`verify-${label}`); 
    const itemDiv = document.getElementById(`item-${label}`);
    
    if (!timeSpan || !itemDiv) return;
    
    const times = getCalculatedTimes(label);
    if (times) {
        itemDiv.classList.add('tagged'); 
        const mode = timeModes[currentTimeModeIndex].id;
        const d = timeDecimalPlaces;
        
        // 核心修改：為時間加上 Material Design 的專屬顏色
        const startStr = `<span style="color: #1976D2;">${times.start.toFixed(d)}</span>`; // 藍色 (Blue 700)
        const endStr = `<span style="color: #388E3C;">${times.end.toFixed(d)}</span>`;     // 綠色 (Green 700)
        const durStr = `<span style="color: #757575; font-size: 0.85em;">(${times.duration.toFixed(d)})</span>`; // 灰色 (Grey 600)
        
        // 依據顯示模式組合彩色文字
        if (mode === 'start') {
            timeSpan.innerHTML = startStr; 
        } else if (mode === 'range') {
            timeSpan.innerHTML = `${startStr} - ${endStr}`; 
        } else if (mode === 'duration') {
            timeSpan.innerHTML = durStr; 
        } else {
            timeSpan.innerHTML = `${startStr} - ${endStr} ${durStr}`;
        }
        
        if(verifyBtn) verifyBtn.style.display = 'flex';
    } else {
        itemDiv.classList.remove('tagged'); 
        timeSpan.textContent = '--:--'; 
        if(verifyBtn) verifyBtn.style.display = 'none';
    }
    
    if (typeof checkButtonVisibility === 'function') checkButtonVisibility();
}


function updateAllTimeDisplays() { 
    allLabelsOrdered.forEach(label => updateSingleTimeDisplay(label)); 
    if (!isDraggingRegion && typeof renderAllRegions === 'function') renderAllRegions(); 
}

function renderSentenceList() {
    listPanel.style.display = allLabelsOrdered.length > 0 ? 'block' : 'none';
    sentenceList.innerHTML = '';
    if (showClearBtns) sentenceList.classList.add('show-clear-btns'); if (showShiftBtns) sentenceList.classList.add('show-shift-btns'); if (showMoreBtns) sentenceList.classList.add('show-more-btns');

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

    currentSortedLabels.forEach(label => {
        const text = sentenceTextMap[label]; const paraIndex = label.charCodeAt(0) - 65; const colorVar = `var(--color-p${paraIndex % 10})`;
        const div = document.createElement('div'); div.className = 'sentence-item'; div.id = `item-${label}`; div.dataset.rawText = text; 
        
        if (selectedLabels.includes(label)) div.classList.add('selected-row');

        // 修改：在選單的各個破壞性操作中，插入 saveState(); 
        div.innerHTML = `
            <div class="sentence-content">
                <button class="action-icon-btn verify-btn" id="verify-${label}" title="播放該句"><span class="material-icons">volume_up</span></button>
                <span class="sentence-label" style="color: ${colorVar};">${label}</span>
                <span class="sentence-text-display ${isEditMode ? 'is-editable' : ''}" ${isEditMode ? 'contenteditable="true"' : ''}>${text}</span>
                <button class="inline-delete-btn" id="inline-del-${label}" style="${text.trim() === '' ? 'display:flex;' : 'display:none;'}"><span class="material-icons">delete</span> 刪除</button>
            </div>
            <div class="sentence-actions">
                <button class="action-icon-btn shift-time-btn" title="批次平移時間"><span class="material-icons">update</span></button>
                <span class="sentence-time" id="time-${label}" title="從該句播放">--:--</span>
                <button class="action-icon-btn clear-tag-btn" title="清除時間"><span class="material-icons">clear</span></button>
                <button class="action-icon-btn tag-time-btn" title="標記時間"><span class="material-icons">add_alarm</span></button>
                <button class="action-icon-btn more-options-btn" title="更多選項"><span class="material-icons">more_vert</span></button>
                <div class="custom-dropdown-menu item-more-menu" id="menu-${label}">
                    <div class="custom-dropdown-item" onclick="if(typeof saveState==='function') saveState(); insertUp('${label}')"><span class="material-icons" style="font-size:1.1rem; margin-right:4px;">arrow_upward</span> 向上新增一列</div>
                    <div class="custom-dropdown-item" onclick="if(typeof saveState==='function') saveState(); insertDown('${label}')"><span class="material-icons" style="font-size:1.1rem; margin-right:4px;">arrow_downward</span> 向下新增一列</div><hr>
                    <div class="custom-dropdown-item" onclick="if(typeof saveState==='function') saveState(); mergeUp('${label}')"><span class="material-icons" style="font-size:1.1rem; margin-right:4px;">merge_type</span> 向上合併</div>
                    <div class="custom-dropdown-item" onclick="if(typeof saveState==='function') saveState(); mergeDown('${label}')"><span class="material-icons" style="font-size:1.1rem; margin-right:4px; transform: rotate(180deg);">merge_type</span> 向下合併</div><hr>
                    <div class="custom-dropdown-item" onclick="downloadSingleAudio('${label}')" style="color: #1976D2;"><span class="material-icons" style="font-size:1.1rem; margin-right:4px;">music_note</span> 匯出音檔</div><hr>
                    <div class="custom-dropdown-item" style="color: #E53935;" onclick="if(typeof saveState==='function') saveState(); deleteSentence('${label}')"><span class="material-icons" style="font-size:1.1rem; margin-right:4px;">delete</span> 刪除此句</div>
                </div>
            </div>
        `;
        const textDisplay = div.querySelector('.sentence-text-display'); const inlineDelBtn = div.querySelector(`#inline-del-${label}`);
        inlineDelBtn.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            if(typeof saveState === 'function') saveState(); // 紀錄狀態
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

        textDisplay.addEventListener('input', () => { inlineDelBtn.style.display = textDisplay.textContent.trim() === '' ? 'flex' : 'none'; });
        
        // 當修改完文字移開焦點時，紀錄狀態
        textDisplay.addEventListener('blur', () => {
            const newText = textDisplay.textContent.trim();
            if (newText !== div.dataset.rawText) { 
                if(typeof saveState === 'function') saveState(); // 紀錄狀態
                div.dataset.rawText = newText; 
                sentenceTextMap[label] = newText.replace(/\([^)]+\)/g, ''); 
                saveToStorage(); 
            }
        });

        textDisplay.addEventListener('keydown', (e) => { 
            if (e.key === 'Enter') { e.preventDefault(); textDisplay.blur(); } 
            if (e.key === 'Tab') { e.preventDefault(); jumpToRegion(1); }
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
            if(typeof saveState === 'function') saveState(); // 紀錄狀態
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

        div.querySelector('.sentence-time').addEventListener('click', (e) => {
            e.stopPropagation(); clearSelection(); lastSelectedLabel = label; currentActiveLabel = label; 
            
            if (typeof currentLoopCounter !== 'undefined') currentLoopCounter = 0; 
            
            const times = getCalculatedTimes(label);
            if (times) { 
                if(typeof applyCurrentPlaybackSpeed === 'function') applyCurrentPlaybackSpeed(); 
                
                // 核心修改：當不是預設排序，或是開啟了「略過模式」時，啟動連續播放
                if (currentSortMode !== 'default' || continuousPlayMode === 'skip') {
                    isContinuousSortedPlay = true; 
                    verifyEndTime = times.end; 
                    verifyingLabel = label;
                } else {
                    isContinuousSortedPlay = false; 
                    verifyEndTime = null; 
                    verifyingLabel = null;
                }
                
                audioPlayer.currentTime = times.start; 
                audioPlayer.play(); 
                updateSelectionUI();
            } 
        });

        div.querySelector('.verify-btn').addEventListener('click', (e) => {
            e.stopPropagation(); currentActiveLabel = label; 
            
            if (typeof currentLoopCounter !== 'undefined') currentLoopCounter = 0; 
            
            const times = getCalculatedTimes(label);
            isContinuousSortedPlay = false; verifyEndTime = times.end; verifyingLabel = label; 
            if(typeof applyCurrentPlaybackSpeed === 'function') applyCurrentPlaybackSpeed(); 
            audioPlayer.currentTime = times.start; audioPlayer.play(); updateSelectionUI();
        });
        sentenceList.appendChild(div);
    });
    
    if (mergeSelectedBtn) mergeSelectedBtn.style.display = selectedLabels.length > 1 ? 'inline-flex' : 'none';
    
    updateAllTimeDisplays(); if(typeof updateStickyOffsets === 'function') updateStickyOffsets();
}