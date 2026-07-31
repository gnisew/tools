// ================= 4_ui_events.js: 介面互動與通用事件管理 =================

function updateMainTitleDisplay() {
    const customTitle = projectTitleInput.value.trim();
    if (customTitle) {
        mainTitleDisplay.textContent = customTitle;
    } else {
        const localFile = localStorage.getItem('tagger_localFileName');
        const onlineUrl = localStorage.getItem('tagger_audioUrl');
        if (localFile) {
            mainTitleDisplay.textContent = localFile.replace(/\.[^/.]+$/, "");
        } else if (onlineUrl) {
            const parts = onlineUrl.split('/');
            mainTitleDisplay.textContent = parts[parts.length - 1] || "未命名專案";
        } else {
            mainTitleDisplay.textContent = "烏衣行打點時間";
        }
    }
}

projectTitleInput?.addEventListener('input', (e) => {
    localStorage.setItem('tagger_projectTitle', e.target.value);
    updateMainTitleDisplay();
});

setupPanelHeader?.addEventListener('click', () => {
    if (setupPanelBody.style.display === 'none') {
        setupPanelBody.style.display = 'block';
        setupToggleIcon.textContent = 'expand_less';
    } else {
        setupPanelBody.style.display = 'none';
        setupToggleIcon.textContent = 'expand_more';
    }
});

clearStorageBtn.addEventListener('click', (e) => { 
    e.stopPropagation();
    showCustomDialog({ title: '清除暫存', message: '確定清除所有文章與暫存？', onConfirm: () => { localStorage.clear(); location.reload(); } });
});

attachKeyCatcher(hkRewind, 'rewind');
attachKeyCatcher(hkForward, 'forward');
attachKeyCatcher(hkPrev, 'prev');
attachKeyCatcher(hkNext, 'next');
attachKeyCatcher(hkSplit, 'split');
attachKeyCatcher(hkMerge, 'merge');

resetShortcutsBtn?.addEventListener('click', () => {
    activeShortcuts = { ...defaultShortcuts };
    localStorage.setItem('tagger_shortcuts', JSON.stringify(activeShortcuts));
    loadShortcuts();
    showToast('已恢復預設快速鍵', 'success');
});

locateCurrentBtn?.addEventListener('click', () => {
    if (!currentActiveLabel) return showToast('目前沒有選取的句子', 'error');
    const itemDiv = document.getElementById(`item-${currentActiveLabel}`);
    if (itemDiv) {
        if(typeof smartScrollTo === 'function') smartScrollTo(itemDiv);
        if(typeof getCalculatedTimes === 'function') {
            const times = getCalculatedTimes(currentActiveLabel);
            if (times) { audioPlayer.currentTime = times.start; }
        }
        showToast(`已定位至 ${currentActiveLabel}`, 'success');
    }
});

mergeSelectedBtn?.addEventListener('click', () => {
    if (selectedLabels.length < 2) return;
    selectedLabels.sort((a, b) => allLabelsOrdered.indexOf(a) - allLabelsOrdered.indexOf(b));
    let isContinuous = true;
    for (let i = 0; i < selectedLabels.length - 1; i++) {
        if (allLabelsOrdered.indexOf(selectedLabels[i+1]) !== allLabelsOrdered.indexOf(selectedLabels[i]) + 1) { isContinuous = false; break; }
    }
    if (!isContinuous) return showToast('合併失敗：選取的項目必須是連續的！', 'error');

    if(typeof saveState === 'function') saveState(); // 紀錄狀態

    const firstLabel = selectedLabels[0];
    const lastLabel = selectedLabels[selectedLabels.length - 1];
    
    let mergedText = '';
    selectedLabels.forEach(lbl => { mergedText += sentenceTextMap[lbl]; });
    sentenceTextMap[firstLabel] = mergedText;

    let finalStart = null, finalEnd = null;
    if (timeDataMap[firstLabel]) finalStart = typeof timeDataMap[firstLabel] === 'object' ? timeDataMap[firstLabel].start : timeDataMap[firstLabel];
    if (timeDataMap[lastLabel]) finalEnd = typeof timeDataMap[lastLabel] === 'object' ? timeDataMap[lastLabel].end : null;

    if (finalStart !== null) timeDataMap[firstLabel] = { start: finalStart, end: finalEnd };

    for (let i = 1; i < selectedLabels.length; i++) {
        const lbl = selectedLabels[i];
        allLabelsOrdered.splice(allLabelsOrdered.indexOf(lbl), 1);
        delete sentenceTextMap[lbl]; delete timeDataMap[lbl];
    }
    if(typeof reassignLabels === 'function') reassignLabels(); 
    showToast('合併成功！', 'success');
});

// ================= 批次調整標記邊界 (增減空白) =================
adjustPaddingBtn?.addEventListener('click', () => {
    if (selectedLabels.length === 0) return;
    
    showCustomDialog({
        title: '調整標記邊界 (增減空白)',
        message: '請輸入要往外擴張的秒數 (正數 = 增加空白，負數 = 減少空白)：<br><span style="font-size:0.85em; color:#666;">例如輸入 0.2，則開頭提早 0.2 秒，結尾延後 0.2 秒。</span>',
        isPrompt: true,
        defaultValue: '0.2',
        onConfirm: (val) => {
            const padding = parseFloat(val);
            if (isNaN(padding) || padding === 0) return;

            if (typeof saveState === 'function') saveState(); // 紀錄 Undo 狀態，萬一調壞了可以復原

            let modifiedCount = 0;
            selectedLabels.forEach(label => {
                if (timeDataMap[label]) {
                    const times = getCalculatedTimes(label);
                    if (times) {
                        let newStart = Math.max(0, times.start - padding); // 確保不會低於 0 秒
                        let newEnd = times.end !== null ? Math.max(0, times.end + padding) : null;
                        
                        // 防呆：如果是負數減少空白，防止結束時間被縮減到比開始時間還早
                        if (newEnd !== null && newStart > newEnd) {
                            const mid = (newStart + newEnd) / 2;
                            newStart = mid;
                            newEnd = mid;
                        }

                        // 寫入新時間 (精確到小數點後 3 位)
                        timeDataMap[label] = { 
                            start: parseFloat(newStart.toFixed(3)), 
                            end: newEnd !== null ? parseFloat(newEnd.toFixed(3)) : null 
                        };
                        modifiedCount++;
                    }
                }
            });

            saveToStorage();
            if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
            showToast(`已成功調整 ${modifiedCount} 個句子的邊界！`, 'success');
        }
    });
});

openSidebarBtn.addEventListener('click', () => { settingsSidebar.classList.add('open'); sidebarOverlay.classList.add('show'); });
closeSidebarBtn.addEventListener('click', () => { settingsSidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); });
sidebarOverlay.addEventListener('click', () => { settingsSidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); });
scrollAlignSelect?.addEventListener('change', (e) => { localStorage.setItem('tagger_scrollAlign', e.target.value); showToast('已更新列表捲動定位方式', 'success'); });

sortToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    sortMenu.classList.toggle('show');
    parseMenu.classList.remove('show'); 
    exportMenu.classList.remove('show');
});

parseToggleBtn.addEventListener('click', (e) => { e.stopPropagation(); parseMenu.classList.toggle('show'); exportMenu.classList.remove('show'); sortMenu?.classList.remove('show'); });
exportToggleBtn.addEventListener('click', (e) => { e.stopPropagation(); exportMenu.classList.toggle('show'); parseMenu.classList.remove('show'); sortMenu?.classList.remove('show'); });

document.addEventListener('click', () => { 
    parseMenu.classList.remove('show'); 
    exportMenu.classList.remove('show'); 
    sortMenu?.classList.remove('show');
    const zoomMenu = document.getElementById('zoomMenu');
    if (zoomMenu) zoomMenu.classList.remove('show');
    const speedMenu = document.getElementById('speedMenu');
    if (speedMenu) speedMenu.classList.remove('show');
    
    if (waveMoreMenu) waveMoreMenu.classList.remove('show');
    
    document.querySelectorAll('.item-more-menu').forEach(m => m.classList.remove('show')); 
});

document.querySelectorAll('#parseMenu .custom-dropdown-item').forEach(item => { 
    item.addEventListener('click', (e) => { 
        currentParseMode = e.target.getAttribute('data-value'); 
        saveToStorage(); 
        parseMenu.classList.remove('show'); 
        if(typeof saveState === 'function') saveState();
        if(typeof triggerParseAction === 'function') triggerParseAction(); 
    }); 
});

document.querySelectorAll('#exportMenu .custom-dropdown-item').forEach(item => { item.addEventListener('click', (e) => { currentExportFormat = e.target.getAttribute('data-value'); exportMenu.classList.remove('show'); if(typeof executeExportText === 'function') executeExportText(); }); });

document.querySelectorAll('#sortMenu .custom-dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
        currentSortMode = e.target.getAttribute('data-value');
        sortMenu.classList.remove('show');
        if(typeof renderSentenceList === 'function') renderSentenceList(); 
        showToast('列表已重新排序', 'success');
    });
});

copyTextBtn.addEventListener('click', () => { if(!rawTextInput.value) return showToast('沒有內容', 'error'); navigator.clipboard.writeText(rawTextInput.value).then(() => showToast('已複製', 'success')); });

clearTextBtn.addEventListener('click', () => { 
    rawTextInput.value = ''; 
    showToast('已清空', 'success'); 
});

parseBtn.addEventListener('click', () => { 
    if(typeof saveState === 'function') saveState(); // 紀錄狀態
    if(typeof triggerParseAction === 'function') triggerParseAction(); 
});

clearAllTagsBtn.addEventListener('click', () => { 
    if (Object.keys(timeDataMap).length === 0) return showToast('無標記', 'error'); 
    showCustomDialog({ 
        title: '清空標記', 
        message: '清除所有時間？', 
        onConfirm: () => { 
            if(typeof saveState === 'function') saveState(); // 紀錄狀態
            timeDataMap = {}; 
            saveToStorage(); 
            if(typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays(); 
            showToast('已清除', 'success'); 
        } 
    }); 
});

function executeLoadOnlineAudio(url) {
    audioPlayer.src = url; 
    localStorage.setItem('tagger_audioType', 'online'); 
    localFileHint.style.display = 'none'; 
    saveToStorage(); 
    if (typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay(); 
    if (typeof initWaveSurfer === 'function') initWaveSurfer(); 
    showToast('線上音檔載入成功', 'success'); 
    if (typeof checkButtonVisibility === 'function') checkButtonVisibility();
}

function handleOnlineAudioLoad() {
    const url = audioUrlInput.value.trim();
    if (!url) return showToast('請先輸入或貼上音檔網址', 'error');
    
    const lowerUrl = url.toLowerCase();
    if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
        return showToast('請輸入以 http 結尾的有效網址。若要載入本機檔案，請點擊「選擇檔案」', 'error');
    }

    const validExtensions = /\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i;
    if (!url.match(validExtensions)) {
        return showToast('網址似乎不是有效的音檔格式 (支援 .mp3, .wav 等)', 'error');
    }
    
    if (allLabelsOrdered.length > 0) {
        showCustomDialog({
            title: '更換音檔警告',
            message: '目前已經有編輯好的標記進度。<br>隨意更換音檔可能會導致時間標記與聲音對不上！<br><br>確定要強制載入新的線上音檔嗎？',
            onConfirm: () => executeLoadOnlineAudio(url)
        });
    } else {
        executeLoadOnlineAudio(url);
    }
}

// 綁定實體「載入」按鈕
loadOnlineAudioBtn?.addEventListener('click', handleOnlineAudioLoad);

// 在輸入框內按下 Enter 鍵也能觸發載入
audioUrlInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleOnlineAudioLoad();
    }
});

triggerAudioUploadBtn?.addEventListener('click', () => {
    if (audioUpload) audioUpload.click();
});

audioUpload.addEventListener('change', function(e) { 
    const file = e.target.files[0];
    
    // 先將 input 重置，確保使用者取消後還能重新點擊同一個檔案
    e.target.value = ''; 
    
    if (!file) return;

    // 取得 JSON 專案中記錄的預期檔名，以及使用者實際選擇的檔名
    const expectedFileName = localStorage.getItem('tagger_localFileName');
    const actualFileName = file.name;

    // 步驟一：將載入音檔的核心邏輯打包成獨立函式，並加入 updateProjectName 參數
    const processAudioFile = (updateProjectName = true) => {
        audioPlayer.src = URL.createObjectURL(file); 
        if (audioUrlInput) audioUrlInput.value = actualFileName;
        
        // 核心修復：只有在檔名吻合，或全新專案時，才更新 localStorage 的專案預設檔名
        if (updateProjectName) {
            localStorage.setItem('tagger_localFileName', actualFileName); 
        }
        
        localStorage.setItem('tagger_audioType', 'local'); 
        if (localFileHint) localFileHint.style.display = 'none'; 
        
        saveToStorage(); 
        if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay(); 
        if(typeof initWaveSurfer === 'function') initWaveSurfer(); 
        
        showToast('本機音檔載入成功', 'success'); 
        if(typeof checkButtonVisibility === 'function') checkButtonVisibility(); 
    };

    // 步驟二：防呆比對
    if (expectedFileName && expectedFileName !== actualFileName && allLabelsOrdered.length > 0) {
        showCustomDialog({
            title: '音檔名稱不符警告',
            message: `您選擇的音檔與專案紀錄<span style="color:#C62828; font-weight:bold;">不一致</span>！<br><br>專案原始音檔：<b>${expectedFileName}</b><br>您選擇的音檔：<b style="color:#C62828;">${actualFileName}</b><br><br>這可能會導致時間標記與聲波圖對不上。<br>確定要強制載入這個音檔嗎？<br><br><span style="font-size:0.85em; color:#00897B;">(註：強制載入僅供本次檢視，不會覆蓋專案原本紀錄的檔名)</span>`,
            onConfirm: () => {
                // 按下確定後強制載入，但傳入 false，避免錯誤的檔名污染專案紀錄
                processAudioFile(false); 
            }
        });
    } else {
        // 如果檔名一致，或者是全新的專案，就正常載入並更新專案檔名 (傳入 true)
        processAudioFile(true);
    }
});

toggleModeBtn.addEventListener('click', () => {
    isEditMode = !isEditMode;
    if (isEditMode) { 
        document.body.classList.remove('is-view-mode'); modeText.textContent = '編輯'; toggleModeBtn.querySelector('.material-icons').textContent = 'edit'; sentenceList.className = 'is-edit-mode'; showToast('編輯模式'); 
        document.querySelectorAll('.sentence-text-display').forEach(el => { el.contentEditable = true; el.classList.add('is-editable'); });
        setupPanel.style.display = 'block';
    } else { 
        document.body.classList.add('is-view-mode'); modeText.textContent = '檢視'; toggleModeBtn.querySelector('.material-icons').textContent = 'visibility'; sentenceList.className = 'is-view-mode'; showToast('檢視模式'); 
        document.querySelectorAll('.sentence-text-display').forEach(el => { el.contentEditable = false; el.classList.remove('is-editable'); }); 
        if(showClearBtns) toggleClearBtnsBtn.click(); if(showShiftBtns) toggleShiftBtnsBtn.click(); if(showMoreBtns) toggleMoreBtnsBtn.click(); 
        setupPanel.style.display = 'none';
    }
    if(typeof updateToolbarButtons === 'function') updateToolbarButtons();
    if(typeof renderAllRegions === 'function') renderAllRegions();
});

fontToggleBtn.addEventListener('click', () => { currentFontIndex = (currentFontIndex + 1) % fontSizes.length; document.documentElement.style.setProperty('--sentence-font-size', fontSizes[currentFontIndex] + 'px'); fontToggleBtn.innerHTML = `<span class="material-icons">format_size</span> ${fontSizes[currentFontIndex]}`; });
timeDisplayToggleBtn.addEventListener('click', () => { currentTimeModeIndex = (currentTimeModeIndex + 1) % timeModes.length; timeDisplayToggleBtn.innerHTML = `<span class="material-icons">schedule</span> ${timeModes[currentTimeModeIndex].label}`; if(typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays(); });
toggleClearBtnsBtn.addEventListener('click', () => { showClearBtns = !showClearBtns; sentenceList.classList.toggle('show-clear-btns', showClearBtns); toggleClearBtnsBtn.classList.toggle('active', showClearBtns); });
toggleShiftBtnsBtn.addEventListener('click', () => { showShiftBtns = !showShiftBtns; sentenceList.classList.toggle('show-shift-btns', showShiftBtns); toggleShiftBtnsBtn.classList.toggle('active', showShiftBtns); });
toggleMoreBtnsBtn.addEventListener('click', () => { showMoreBtns = !showMoreBtns; sentenceList.classList.toggle('show-more-btns', showMoreBtns); toggleMoreBtnsBtn.classList.toggle('active', showMoreBtns); });

function updateStickyOffsets() { if (stickyPanel && listHeaderContainer) { listHeaderContainer.style.top = stickyPanel.offsetHeight + 'px'; } }
window.addEventListener('resize', updateStickyOffsets);
function toggleWaveHeight() { if (typeof wavesurfer === 'undefined' || !wavesurfer) return; currentWaveHeightIndex = (currentWaveHeightIndex + 1) % waveHeights.length; wavesurfer.setOptions({ height: waveHeights[currentWaveHeightIndex] }); showToast(`聲波高度切換為 ${waveHeights[currentWaveHeightIndex]}px`, 'success'); setTimeout(updateStickyOffsets, 50); }

modalCancelBtn.addEventListener('click', closeCustomDialog);
modalConfirmBtn.addEventListener('click', () => { if (modalConfirmCallback) { modalConfirmCallback(modalInput.style.display === 'block' ? modalInput.value : true); } closeCustomDialog(); });
modalInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') modalConfirmBtn.click(); });
window.addEventListener('scroll', () => { if (window.scrollY > 400) scrollToTopBtn.classList.add('visible'); else scrollToTopBtn.classList.remove('visible'); });
scrollToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });

function smartScrollTo(element) {
    if (!element) return;
    const headerHeight = (stickyPanel ? stickyPanel.offsetHeight : 0) + (listHeaderContainer ? listHeaderContainer.offsetHeight : 0);
    const alignMode = scrollAlignSelect ? scrollAlignSelect.value : 'top';
    let offset = 10; 
    if (alignMode === 'second') { const prev = element.previousElementSibling; if (prev) offset = prev.offsetHeight + 15; else offset = 80; }
    window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - headerHeight - offset, behavior: 'smooth' });
}
function scrollToKeepMouseSteady(currentItemDiv) {
    const nextItemDiv = currentItemDiv.nextElementSibling;
    if (nextItemDiv) window.scrollBy({ top: nextItemDiv.getBoundingClientRect().top - currentItemDiv.getBoundingClientRect().top, behavior: 'smooth' });
}
function jumpToRegion(direction) {
    if (!currentActiveLabel) return;
    const nextIdx = allLabelsOrdered.indexOf(currentActiveLabel) + direction;
    if (nextIdx >= 0 && nextIdx < allLabelsOrdered.length) {
        const itemDiv = document.getElementById(`item-${allLabelsOrdered[nextIdx]}`);
        if (itemDiv) { const textDisplay = itemDiv.querySelector('.sentence-text-display'); textDisplay.click(); textDisplay.focus(); }
    }
}

// 鍵盤快速鍵核心監聽器
document.addEventListener('keydown', e => { if(e.key === 'Shift') isShiftPressed = true; });
document.addEventListener('keyup', e => { if(e.key === 'Shift') isShiftPressed = false; });
document.addEventListener('keydown', (e) => {
    const isInputActive = (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable);
    
    // 歷史紀錄快捷鍵 (Undo: Ctrl+Z, Redo: Ctrl+Y 或是 Ctrl+Shift+Z) 
    // 如果正在打字，讓瀏覽器原生接管打字的復原；否則觸發全域狀態復原
    if (!isInputActive) {
        if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
            e.preventDefault();
            if(typeof performUndo === 'function') performUndo();
            return;
        }
        if ((e.code === 'KeyY' && (e.ctrlKey || e.metaKey)) || (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
            e.preventDefault();
            if(typeof performRedo === 'function') performRedo();
            return;
        }
    }

    if (e.code === 'Escape') {
        if (isInputActive) e.target.blur(); 
        if(typeof clearSelection === 'function') clearSelection(); 
        if (tempRegion) { tempRegion.remove(); tempRegion = null; }
        currentActiveLabel = null;
        if(typeof updateSelectionUI === 'function') updateSelectionUI(); 
        return;
    }

    if (e.code === 'Space' && !isInputActive) { 
        e.preventDefault(); 
        if (e.shiftKey) { locateCurrentBtn?.click(); } else { if(typeof togglePlayPause === 'function') togglePlayPause(); }
        return; 
    }
    
    if (e.code === 'Enter' && !isInputActive) { 
        e.preventDefault(); 
        if(isEditMode && tagRegionBtn && !tagRegionBtn.disabled) tagRegionBtn.click(); 
        return; 
    }
    
    if (e.code === 'Delete' && !isInputActive) { 
        e.preventDefault(); 
        if(isEditMode && clearRegionBtn && !clearRegionBtn.disabled) clearRegionBtn.click(); 
        return; 
    }

    let keys = []; if (e.ctrlKey) keys.push('Ctrl'); if (e.altKey) keys.push('Alt'); if (e.shiftKey) keys.push('Shift');
    if (e.code.startsWith('Arrow')) keys.push(e.code); else if (e.code === 'Space') keys.push('Space'); else if (e.key.length === 1) keys.push(e.key.toUpperCase());
    const comboStr = keys.join('+');

    if (comboStr === activeShortcuts.rewind) { e.preventDefault(); audioPlayer.currentTime -= 2; audioPlayer.play(); } 
    else if (comboStr === activeShortcuts.forward) { e.preventDefault(); audioPlayer.currentTime += 2; audioPlayer.play(); }
    else if (comboStr === activeShortcuts.prev) { e.preventDefault(); jumpToRegion(-1); }
    else if (comboStr === activeShortcuts.next) { e.preventDefault(); jumpToRegion(1); }
	else if (comboStr === activeShortcuts.split) { 
        e.preventDefault(); 
        if (typeof splitRegionAtPlayhead === 'function') splitRegionAtPlayhead(); 
    }
	else if (comboStr === activeShortcuts.merge) {
        e.preventDefault();
        const listMergeBtn = document.getElementById('mergeSelectedBtn');
        if (listMergeBtn && selectedLabels.length > 1) listMergeBtn.click();
    }
	else if (e.code === 'KeyA' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        selectedLabels = allLabelsOrdered.filter(label => timeDataMap[label] !== undefined);
        if (typeof updateSelectionUI === 'function') updateSelectionUI();
        showToast(`已全選 ${selectedLabels.length} 個標記`, 'success');
    }

    if (e.altKey && currentActiveLabel && wsRegions && !isInputActive) {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
            e.preventDefault();
            const activeRegion = wsRegions.getRegions().find(r => r.id === currentActiveLabel);
            if (activeRegion) {
                let s = activeRegion.start; let e_time = activeRegion.end; 
                const step = e.shiftKey ? 0.1 : 0.01; 
                
                if (e.code === 'ArrowLeft') s = Math.max(0, s - step); 
                else if (e.code === 'ArrowRight') s = Math.min(e_time - 0.01, s + step); 
                else if (e.code === 'ArrowUp') e_time = Math.min(audioPlayer.duration || 9999, e_time + step); 
                else if (e.code === 'ArrowDown') e_time = Math.max(s + 0.01, e_time - step);

                if (s !== activeRegion.start || e_time !== activeRegion.end) {
                    activeRegion.setOptions({ start: s, end: e_time });
                    if (timeDataMap[currentActiveLabel]) { 
                        timeDataMap[currentActiveLabel].start = parseFloat(s.toFixed(3)); 
                        timeDataMap[currentActiveLabel].end = parseFloat(e_time.toFixed(3)); 
                    }
                    if(typeof updateSingleTimeDisplay === 'function') updateSingleTimeDisplay(currentActiveLabel); 
                    if(typeof regionDragTimeout !== 'undefined') clearTimeout(regionDragTimeout); 
                    regionDragTimeout = setTimeout(() => saveToStorage(), 500);
                }
            }
        }
    }
});

// 工具列按鈕與匯出事件
const advDownloadModal = document.getElementById('advancedDownloadModalOverlay');
const advDownloadMode = document.getElementById('advDownloadMode');
const mergePaddingConfig = document.getElementById('mergePaddingConfig');
const advMergeSilence = document.getElementById('advMergeSilence');
const advMergeSilenceVal = document.getElementById('advMergeSilenceVal');

// 切換合併模式時，顯示/隱藏靜音設定
advDownloadMode?.addEventListener('change', (e) => {
    mergePaddingConfig.style.display = e.target.value === 'merge' ? 'block' : 'none';
});

// 拖曳靜音滑桿時更新文字
advMergeSilence?.addEventListener('input', (e) => {
    advMergeSilenceVal.textContent = `${parseFloat(e.target.value).toFixed(1)} 秒`;
});

// 工具列上的下載按鈕
downloadActiveRegionBtn?.addEventListener('click', () => {
    if (downloadActiveRegionBtn.disabled) return; 
    
    // 如果有選取多個句子，開啟進階視窗
    if (selectedLabels.length > 1) {
        document.getElementById('downloadSelectionCount').textContent = selectedLabels.length;
        advDownloadModal.classList.add('show');
    } 
    // 單選，或是沒有特別選取但有正在作用中的句子，直接下載單檔
    else {
        const targetLabel = selectedLabels.length === 1 ? selectedLabels[0] : currentActiveLabel;
        if (!targetLabel) return showToast('請先點選要下載的句子', 'error');
        if (typeof downloadSingleAudio === 'function') downloadSingleAudio(targetLabel);
    }
});

// 關閉視窗
document.getElementById('advDownloadCancelBtn')?.addEventListener('click', () => {
    advDownloadModal.classList.remove('show');
});

// 確認執行多重下載 / 合併
document.getElementById('advDownloadConfirmBtn')?.addEventListener('click', () => {
    advDownloadModal.classList.remove('show');
    const mode = advDownloadMode.value;
    const silenceSeconds = parseFloat(advMergeSilence.value) || 0;
    
    if (typeof processAdvancedDownload === 'function') {
        processAdvancedDownload([...selectedLabels], mode, silenceSeconds);
    } else {
        showToast('音訊處理引擎尚未準備好', 'error');
    }
});

waveSelectAllBtn?.addEventListener('click', () => {
    if (waveMoreMenu) waveMoreMenu.classList.remove('show');
    
    // 執行全選邏輯
    selectedLabels = allLabelsOrdered.filter(label => timeDataMap[label] !== undefined);
    if (typeof updateSelectionUI === 'function') updateSelectionUI();
    showToast(`已全選 ${selectedLabels.length} 個標記`, 'success');
});

waveCancelSelectBtn?.addEventListener('click', () => {
    if (waveMoreMenu) waveMoreMenu.classList.remove('show');
    
    // 執行取消選取邏輯 (還原到乾淨狀態)
    if (typeof clearSelection === 'function') clearSelection();
    if (tempRegion) { tempRegion.remove(); tempRegion = null; }
    currentActiveLabel = null;
    if (typeof updateSelectionUI === 'function') updateSelectionUI(); 
    showToast('已取消選取', 'normal');
});


tagRegionBtn?.addEventListener('click', () => {
    if (tagRegionBtn.disabled || !isEditMode) return; 
    if (tempRegion) {
        if(typeof saveState === 'function') saveState(); // 紀錄狀態
        if (currentActiveLabel && !timeDataMap[currentActiveLabel]) { 
            timeDataMap[currentActiveLabel] = { start: parseFloat(tempRegion.start.toFixed(3)), end: parseFloat(tempRegion.end.toFixed(3)) }; 
            saveToStorage(); 
            if(typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays(); 
            showToast(`已套用至 ${currentActiveLabel}`, 'success'); 
        } 
        else { 
            if(typeof insertRowChronologically === 'function') insertRowChronologically(tempRegion.start, tempRegion.end); 
        }
        tempRegion.remove(); tempRegion = null;
    }
    if(typeof updateToolbarButtons === 'function') updateToolbarButtons(); 
});

clearRegionBtn?.addEventListener('click', () => { 
    if (clearRegionBtn.disabled || !isEditMode) return; 
    if (!currentActiveLabel) return; 
    if(typeof saveState === 'function') saveState();
    if(typeof handleClearTag === 'function') handleClearTag(currentActiveLabel); 
    if(typeof updateToolbarButtons === 'function') updateToolbarButtons(); 
});


splitRegionBtn?.addEventListener('click', () => {
    if (splitRegionBtn.disabled || !isEditMode) return;
    if (typeof splitRegionAtPlayhead === 'function') splitRegionAtPlayhead();
});

mergeRegionBtn?.addEventListener('click', () => {
    if (mergeRegionBtn.disabled || !isEditMode) return;
    // 直接觸發既有的合併按鈕邏輯
    const listMergeBtn = document.getElementById('mergeSelectedBtn');
    if (listMergeBtn) listMergeBtn.click();
});

// JSON 匯出與匯入系統
exportJsonBtn?.addEventListener('click', () => {
    if (allLabelsOrdered.length === 0 && !rawTextInput.value) return showToast('目前沒有資料可以匯出喔！', 'error');
    const projectData = {
        version: "1.0",
        title: projectTitleInput.value,
        audioUrl: localStorage.getItem('tagger_audioUrl') || "",
        localFileName: localStorage.getItem('tagger_localFileName') || "",
        rawText: rawTextInput.value,
        allLabelsOrdered: allLabelsOrdered,
        sentenceTextMap: sentenceTextMap,
        timeDataMap: timeDataMap,
        settings: { currentParseMode: currentParseMode, currentSortMode: currentSortMode }
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${projectTitleInput.value.trim() || "烏衣行打點專案"}.json`;
    document.body.appendChild(downloadLink); downloadLink.click(); document.body.removeChild(downloadLink); URL.revokeObjectURL(url); 
    showToast('專案檔下載成功！', 'success');
});

// 2. 匯入專案檔 (Import JSON) - 無縫熱更新版
importProjectBtn?.addEventListener('click', () => importProjectInput.click());

importProjectInput?.addEventListener('change', (e) => {
    const file = e.target.files[0]; 
    
    // 立即重置輸入框，不影響已抓取的 file，同時確保使用者取消後還能重新點擊同一個檔案
    e.target.value = ''; 
    
    if (!file) return;
    
    // 步驟一：將核心讀取邏輯打包成獨立函式
    const processImport = () => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (!data.allLabelsOrdered || !data.sentenceTextMap) throw new Error("格式不符");
                
                if(typeof saveState === 'function') saveState(); // 匯入前先存入 Undo 歷史

                // 熱更新寫入全域變數
                allLabelsOrdered = data.allLabelsOrdered;
                sentenceTextMap = data.sentenceTextMap;
                timeDataMap = data.timeDataMap || {};
                
                if (projectTitleInput) projectTitleInput.value = data.title || '';
                if (rawTextInput) {
                    rawTextInput.value = data.rawText || '';
                    if (typeof autoResizeRawText === 'function') autoResizeRawText(); 
                }
                
                currentParseMode = data.settings?.currentParseMode || 'punct';
                currentSortMode = data.settings?.currentSortMode || 'default';

                // 同步更新至 localStorage
                localStorage.setItem('tagger_projectTitle', data.title || '');
                localStorage.setItem('tagger_audioUrl', data.audioUrl || '');
                localStorage.setItem('tagger_localFileName', data.localFileName || '');
                saveToStorage();

                // 強制呼叫渲染引擎
                if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay();
                if(typeof renderSentenceList === 'function') renderSentenceList(); 
                if(typeof renderAllRegions === 'function') renderAllRegions();
                
                // 本機音檔提示
                if (data.localFileName && (!audioPlayer.src || !audioPlayer.src.includes('blob:'))) {
                    showCustomDialog({
                        title: '專案文字與標記載入成功！',
                        message: `您的文字清單與時間標記已完整還原。<br><br><span style="color:#C62828; font-weight:bold;">【重要提醒】</span><br>基於瀏覽器安全限制，我們無法自動讀取您的硬碟檔案。<br>請點擊上方的「選擇檔案」重新載入您的音檔：<br><b>${data.localFileName}</b><br><br>載入後，聲波圖就會立刻與這些標記完美對齊！`,
                        onConfirm: () => {}
                    });
                } else {
                    showToast('專案檔讀取成功！畫面已還原', 'success');
                }
                
            } catch (err) { 
                showToast('匯入失敗：檔案損毀或不是有效的專案檔', 'error'); 
                console.error(err);
            }
        };
        reader.readAsText(file); 
    };

    // 步驟二：判斷是否需要跳出漂亮的自訂警告視窗
    if (allLabelsOrdered.length > 0) {
        showCustomDialog({
            title: '覆蓋警告',
            message: '匯入專案將會<span style="color:#C62828; font-weight:bold;">覆蓋您目前的編輯進度</span>，確定要繼續嗎？',
            onConfirm: () => {
                processImport(); // 點擊確定後才執行讀取
            }
        });
    } else {
        // 如果目前沒有進度，就不囉嗦，直接匯入
        processImport();
    }
});

// 自動斷句 Modal 與按鈕事件
asThreshold?.addEventListener('input', (e) => { if(asThresholdVal) asThresholdVal.textContent = `(${e.target.value}%)`; });
asSilence?.addEventListener('input', (e) => { if(asSilenceVal) asSilenceVal.textContent = `(${parseFloat(e.target.value).toFixed(1)} 秒)`; });
asMinSegment?.addEventListener('input', (e) => { if(asMinSegmentVal) asMinSegmentVal.textContent = `(${parseFloat(e.target.value).toFixed(1)} 秒)`; });
asPadding?.addEventListener('input', (e) => { if(asPaddingVal) asPaddingVal.textContent = `(${parseFloat(e.target.value).toFixed(1)} 秒)`; });


autoSegmentBtn?.addEventListener('click', () => { 
    if (typeof wavesurfer === 'undefined' || !wavesurfer || !wavesurfer.getDecodedData()) {
        return showToast('請先載入音檔並等待分析完成', 'error'); 
    }
    asModal?.classList.add('show'); 
});

asCancelBtn?.addEventListener('click', () => asModal?.classList.remove('show'));

asConfirmBtn?.addEventListener('click', () => { 
    asModal?.classList.remove('show'); 
    if (typeof performAutoSegmentation === 'function') {
        if(typeof saveState === 'function') saveState(); // 紀錄狀態：避免自動斷句洗掉原有進度
        performAutoSegmentation(); 
    } else {
        showToast('找不到斷句引擎，請確認 2_audio_engine.js 已載入', 'error');
    }
});

// 頁面載入核心初始化
window.addEventListener('DOMContentLoaded', () => { 
    if (projectTitleInput) {
        projectTitleInput.value = localStorage.getItem('tagger_projectTitle') || '';
    }
    if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay();
    if(typeof loadFromStorage === 'function') loadFromStorage(); 
    if(typeof updateStickyOffsets === 'function') setTimeout(updateStickyOffsets, 500); 
});


// ================= 收納式縮放選單控制  =================
const zoomMenuToggleBtn = document.getElementById('zoomMenuToggleBtn');
const zoomMenu = document.getElementById('zoomMenu');

zoomMenuToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation(); // 防止觸發 document 點擊事件
    zoomMenu.classList.toggle('show');
    // 關閉其他可能開啟的選單
    sortMenu?.classList.remove('show');
});

// 防止在拉動滑桿或點擊選單內部時，選單意外關閉
zoomMenu?.addEventListener('click', (e) => {
    e.stopPropagation(); 
});



waveMoreBtn?.addEventListener('click', (e) => {
    e.stopPropagation(); 
    waveMoreMenu.classList.toggle('show');
    // 開啟時，確保關閉其他相鄰的選單
    if (zoomMenu) zoomMenu.classList.remove('show');
    const speedMenu = document.getElementById('speedMenu');
    if (speedMenu) speedMenu.classList.remove('show');
});

// 防止點擊選單內部時意外關閉 (除非點擊的是執行按鈕)
waveMoreMenu?.addEventListener('click', (e) => {
    e.stopPropagation(); 
});



// ================= 時間顯示精確度設定事件  =================
const timeDecimalSelect = document.getElementById('timeDecimalSelect');

if (timeDecimalSelect) {
    // 進入網頁時，先同步下拉選單的值
    timeDecimalSelect.value = timeDecimalPlaces;
    
    // 當使用者改變選項時
    timeDecimalSelect.addEventListener('change', (e) => {
        timeDecimalPlaces = parseInt(e.target.value);
        localStorage.setItem('tagger_timeDecimals', timeDecimalPlaces); // 記住設定
        
        // 重新渲染畫面上的所有時間
        if(typeof updateAllTimeDisplays === 'function') {
            updateAllTimeDisplays();
        }
        showToast(`時間顯示已更改為小數點後 ${timeDecimalPlaces} 位`, 'success');
    });
}


// ================= 播放速度選單控制 =================
const speedMenuToggleBtn = document.getElementById('speedMenuToggleBtn');
const speedMenu = document.getElementById('speedMenu');
const speedDisplay = document.getElementById('speedDisplay');

speedMenuToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation(); 
    
    // 智慧偵測：計算按鈕距離視窗底部的距離
    const rect = speedMenuToggleBtn.getBoundingClientRect();
    
    // 如果距離底部小於 220px (空間不足)，就往上展開
    if (window.innerHeight - rect.bottom < 220) {
        speedMenu.style.top = 'auto';
        speedMenu.style.bottom = '100%';
        speedMenu.style.marginTop = '0';
        speedMenu.style.marginBottom = '8px';
    } else {
        // 否則預設往下展開
        speedMenu.style.top = '100%';
        speedMenu.style.bottom = 'auto';
        speedMenu.style.marginTop = '8px';
        speedMenu.style.marginBottom = '0';
    }

    speedMenu.classList.toggle('show');
    
    // 開啟速度選單時，自動關閉縮放選單以防畫面雜亂
    const zoomMenu = document.getElementById('zoomMenu');
    if (zoomMenu) zoomMenu.classList.remove('show');
});

// 綁定所有速度選項的點擊事件
document.querySelectorAll('.speed-item').forEach(item => {
    item.addEventListener('click', (e) => {
        const speed = e.target.getAttribute('data-speed');
        if (speedDisplay) speedDisplay.textContent = speed + 'x';
        speedMenu.classList.remove('show');
        
        // 呼叫 6_wave_controller.js 中的更新函式套用速度
        if(typeof applyCurrentPlaybackSpeed === 'function') {
            applyCurrentPlaybackSpeed();
        }
        showToast(`播放速度已切換為 ${speed}x`, 'success');
    });
});

// ================= 手動恢復標記按鈕事件  =================
restoreTagsBtn?.addEventListener('click', () => {
    if(typeof saveState === 'function') saveState();
    
    // 強制從 localStorage 讀取最後一次的存檔
    const savedMap = localStorage.getItem('tagger_timeDataMap');
    if (savedMap) {
        try {
            timeDataMap = JSON.parse(savedMap);
            saveToStorage(); // 確保全域狀態同步
            
            // 強制畫面重新渲染
            if(typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
            if(typeof renderAllRegions === 'function') renderAllRegions();
            
            showToast('已成功從暫存恢復標記！', 'success');
        } catch (e) {
            showToast('還原失敗，存檔可能已損毀', 'error');
        }
    }
});


// ================= 播放與跳轉設定事件 =================
if (continuousPlayModeSelect) {
    continuousPlayModeSelect.value = continuousPlayMode;
    continuousPlayModeSelect.addEventListener('change', (e) => {
        continuousPlayMode = e.target.value;
        localStorage.setItem('tagger_continuousPlayMode', continuousPlayMode);
        showToast('播放模式已更改', 'success');
    });
}

if (playPaddingInput) {
    playPaddingInput.value = playPadding;
    playPaddingInput.addEventListener('change', (e) => {
        playPadding = parseFloat(e.target.value) || 0;
        localStorage.setItem('tagger_playPadding', playPadding);
    });
}


// ================= 修改：聲波圖寬度專屬設定事件 =================
function applyAppWidth(width) {
    // 核心修改：不再修改 body，而是只改變聲波面板的變數
    const stickyPanel = document.getElementById('stickyPanel');
    if (stickyPanel) {
        stickyPanel.style.setProperty('--wave-width', width);
    }
    
    // 延遲 350 毫秒（等待 CSS 的動畫跑完），觸發重繪
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        if (typeof updateStickyOffsets === 'function') updateStickyOffsets();
    }, 350); 
}

if (appWidthSelect) {
    appWidthSelect.value = currentAppWidth;
    applyAppWidth(currentAppWidth);
    
    appWidthSelect.addEventListener('change', (e) => {
        currentAppWidth = e.target.value;
        localStorage.setItem('tagger_appWidth', currentAppWidth);
        applyAppWidth(currentAppWidth);
        showToast(`聲波圖寬度已切換`, 'success');
    });
}



// ================= 進階循環播放設定事件 =================
if (loopModeSelect) {
    loopModeSelect.value = loopMode;
    loopModeSelect.addEventListener('change', (e) => {
        loopMode = e.target.value;
        localStorage.setItem('tagger_loopMode', loopMode);
        currentLoopCounter = 0; // 更改設定時重置計數
        showToast('循環模式已更新', 'success');
    });
}

if (loopCountInput) {
    loopCountInput.value = loopCount;
    loopCountInput.addEventListener('change', (e) => {
        loopCount = parseInt(e.target.value) || 0;
        localStorage.setItem('tagger_loopCount', loopCount);
        currentLoopCounter = 0; // 更改設定時重置計數
    });
}

if (autoScrollModeSelect) {
    autoScrollModeSelect.value = autoScrollMode;
    autoScrollModeSelect.addEventListener('change', (e) => {
        autoScrollMode = e.target.value;
        localStorage.setItem('tagger_autoScrollMode', autoScrollMode);
        
        if (wavesurfer) {
            wavesurfer.setOptions({
                autoScroll: true,
                autoCenter: autoScrollMode === 'center' // 若選 center 則為 true，否則為 false
            });
        }
        showToast('波形跟隨模式已更新', 'success');
    });
}

// ================= ★ 修改：聲波圖高度與寬度設定事件 ★ =================
if (waveHeightSelect) {
    waveHeightSelect.value = currentWaveHeight;
    waveHeightSelect.addEventListener('change', (e) => {
        currentWaveHeight = parseInt(e.target.value);
        localStorage.setItem('tagger_waveHeight', currentWaveHeight);
        // ★ 即時動態改變 WaveSurfer 高度
        if (wavesurfer) {
            wavesurfer.setOptions({ height: currentWaveHeight });
        }
        showToast('聲波圖高度已更新', 'success');
    });
}

if (appWidthSelect) {
    appWidthSelect.value = currentAppWidth;
    if (!appWidthSelect.value) { appWidthSelect.value = '100%'; } // 終極防呆
    applyAppWidth(appWidthSelect.value);
    
    appWidthSelect.addEventListener('change', (e) => {
        currentAppWidth = e.target.value;
        localStorage.setItem('tagger_appWidth', currentAppWidth);
        applyAppWidth(currentAppWidth);
        showToast('聲波圖寬度已切換', 'success');
    });
}
