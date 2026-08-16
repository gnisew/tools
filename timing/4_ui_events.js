// ================= 4_ui_events.js: 介面互動與通用事件管理 =================

function updateMainTitleDisplay() {
    if (!mainTitleDisplay) return;
    
    // 如果使用者正在打字編輯標題，就不要干擾他
    if (document.activeElement === mainTitleDisplay) return;

    const customTitle = localStorage.getItem('tagger_projectTitle');
    const localFile = localStorage.getItem('tagger_localFileName');
    const onlineUrl = localStorage.getItem('tagger_audioUrl');

    let displayText = "烏衣行打點時間";

    if (customTitle && customTitle.trim() !== '') {
        displayText = customTitle;
    } else if (localFile) {
        displayText = localFile.replace(/\.[^/.]+$/, ""); // 去除副檔名
    } else if (onlineUrl) {
        const parts = onlineUrl.split('/');
        displayText = parts[parts.length - 1] || "未命名專案";
    }

    mainTitleDisplay.textContent = displayText;

    // ★ 新增：控制左上角網站標題的顯示與隱藏
    const topLeftTitle = document.getElementById('topLeftTitle');
    if (topLeftTitle) {
        // 如果中間已經是預設名稱，左上角就隱藏；否則顯示
        if (displayText === "烏衣行打點時間") {
            topLeftTitle.style.display = 'none';
        } else {
            topLeftTitle.style.display = 'inline-block';
        }
    }
}

if (mainTitleDisplay) {
    mainTitleDisplay.addEventListener('blur', () => {
        const newTitle = mainTitleDisplay.textContent.trim();
        if (newTitle === '' || newTitle === '烏衣行打點時間') {
            localStorage.removeItem('tagger_projectTitle');
        } else {
            localStorage.setItem('tagger_projectTitle', newTitle);
        }
        updateMainTitleDisplay(); 
    });

    mainTitleDisplay.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            mainTitleDisplay.blur(); 
        }
    });
}
// =========================================================================

clearStorageBtn.addEventListener('click', (e) => { 
    e.stopPropagation();
    showCustomDialog({ 
        title: '清除專案資料', 
        message: '確定清除所有的句子、時間標記與音檔紀錄嗎？<br><br><span style="color:#00897B; font-weight:bold;">(您的偏好設定將會被保留)</span>', 
        onConfirm: () => { 
            // 1. 阻斷防呆存檔：將計時器清空並設為 null
            if (typeof saveStorageTimeout !== 'undefined') {
                clearTimeout(saveStorageTimeout);
                saveStorageTimeout = null; 
            }
            
            // 2. 清空記憶體陣列
            allLabelsOrdered = [];
            sentenceTextMap = {};
            timeDataMap = {};
            
            // 3. 建立「專案資料」專屬清單，並精準刪除
            const projectKeys = [
                'tagger_allLabels', 'tagger_textMap', 'tagger_timeDataMap',
                'tagger_projectTitle', 'tagger_audioUrl', 'tagger_localFileName',
                'tagger_audioType', 'tagger_lastDataFile'
            ];
            
            projectKeys.forEach(key => localStorage.removeItem(key));
            
            // 4. 重新整理網頁
            location.reload(); 
        } 
    });
});


attachKeyCatcher(hkRewind, 'rewind');
attachKeyCatcher(hkForward, 'forward');
attachKeyCatcher(hkPrev, 'prev');
attachKeyCatcher(hkNext, 'next');
attachKeyCatcher(hkSplit, 'split');
attachKeyCatcher(hkMerge, 'merge');

resetShortcutsBtn?.addEventListener('click', () => {
    showCustomDialog({
        title: '恢復預設設定',
        message: '確定要將所有「偏好設定」(包含快速鍵、顯示模式、播放速度等) 恢復為預設值嗎？<br><br><span style="color:#00897B; font-weight:bold;">(您的文章與標記進度將會安全保留)</span>',
        onConfirm: () => {
            // 1. 定義要被「保護」的專案資料清單
            const projectKeys = [
                'tagger_allLabels', 'tagger_textMap', 'tagger_timeDataMap',
                'tagger_projectTitle', 'tagger_audioUrl', 'tagger_localFileName',
                'tagger_audioType', 'tagger_lastDataFile'
            ];

            // 2. 智慧掃描：找出所有是 tagger_ 開頭，但「不是」專案資料的設定
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('tagger_') && !projectKeys.includes(key)) {
                    keysToRemove.push(key);
                }
            }

            // 3. 執行清除設定
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // 4. 重新整理套用預設值
            location.reload();
        }
    });
});

// 1. 點擊「目前時間」：回到選取標記或游標位置 (接管原定位按鈕功能)
document.getElementById('audioTimeCurrent')?.addEventListener('click', () => {
    if (currentActiveLabel && timeDataMap[currentActiveLabel]) {
        // 有選取標記，回到該句子的列表與聲波位置
        const itemDiv = document.getElementById(`item-${currentActiveLabel}`);
        if (itemDiv && typeof smartScrollTo === 'function') smartScrollTo(itemDiv);
        
        const times = getCalculatedTimes(currentActiveLabel);
        if (times) {
            audioPlayer.currentTime = times.start;
            if (typeof wavesurfer !== 'undefined' && wavesurfer && audioPlayer.duration) {
                wavesurfer.seekTo(times.start / audioPlayer.duration);
            }
        }
        showToast(`已定位至 ${currentActiveLabel}`, 'success');
    } else {
        // 沒標記，將畫面與聲波圖對齊目前的游標所在
        if (typeof snapWaveformToTop === 'function') snapWaveformToTop();
        if (typeof wavesurfer !== 'undefined' && wavesurfer && audioPlayer && audioPlayer.duration) {
            wavesurfer.seekTo(audioPlayer.currentTime / audioPlayer.duration);
        }
        showToast('已回到游標位置', 'success');
    }
});

// 2. 點擊「全部時間」：全選 / 取消全選
document.getElementById('audioTimeTotal')?.addEventListener('click', () => {
    // ★ 核心修復：檢查是否有選取的標記，或是「有藍色暫存選取框 (例如全選音檔產生的)」
    const hasSelection = (typeof selectedLabels !== 'undefined' && selectedLabels.length > 0) || 
                         (typeof tempRegion !== 'undefined' && tempRegion !== null);

    if (hasSelection) {
        // 若已有選取，視同取消全選 (清除標記選取狀態，並移除藍色框)
        if (typeof clearSelection === 'function') clearSelection();
        if (typeof tempRegion !== 'undefined' && tempRegion) {
            tempRegion.remove();
            tempRegion = null;
        }
        // 更新工具列狀態
        if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
        showToast('已取消選取', 'normal');
    } else {
        // 沒選取時，全選所有有時間的標記
        if (typeof allLabelsOrdered !== 'undefined') {
            selectedLabels = allLabelsOrdered.filter(label => timeDataMap[label] !== undefined);
            if (typeof updateSelectionUI === 'function') updateSelectionUI();
            showToast(`已全選 ${selectedLabels.length} 個標記`, 'success');
        }
    }
});

// 3. 改寫為「切換：僅播放選取範圍」模式按鈕
function togglePlaySelectionMode() {
    isPlaySelectionOnlyMode = !isPlaySelectionOnlyMode;
    const btn = document.getElementById('locateCurrentBtn');
    if (btn) {
        if (isPlaySelectionOnlyMode) {
            btn.style.background = '#1565C0'; // 啟用時：深藍底
            btn.style.color = 'white';        // 啟用時：白字
            btn.title = "已啟用：僅播放選取範圍 (Shift + Space)";
            showToast('已啟用：僅播放選取範圍', 'success');
        } else {
            btn.style.background = '#E3F2FD'; // 關閉時：淺藍底
            btn.style.color = '#1565C0';      // 關閉時：藍字
            btn.title = "已切換：一般連續播放 (Shift + Space)";
            showToast('已切換：一般連續播放', 'normal');
        }
    }
}

const oldLocateBtn = document.getElementById('locateCurrentBtn');
if (oldLocateBtn) {
    const newLocateBtn = oldLocateBtn.cloneNode(true);
    oldLocateBtn.parentNode.replaceChild(newLocateBtn, oldLocateBtn);
    
    // 點擊按鈕時觸發開關
    newLocateBtn.addEventListener('click', (e) => {
        if(e) e.preventDefault();
        if(e && e.currentTarget) e.currentTarget.blur();
        togglePlaySelectionMode();
    });
}

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
    
    // ★ 取消文字合併
    let finalStart = null, finalEnd = null;
    if (timeDataMap[firstLabel]) finalStart = typeof timeDataMap[firstLabel] === 'object' ? timeDataMap[firstLabel].start : timeDataMap[firstLabel];
    if (timeDataMap[lastLabel]) finalEnd = typeof timeDataMap[lastLabel] === 'object' ? timeDataMap[lastLabel].end : null;

    if (finalStart !== null) timeDataMap[firstLabel] = { start: finalStart, end: finalEnd };

    // ★ 取消刪除整列
    for (let i = 1; i < selectedLabels.length; i++) {
        const lbl = selectedLabels[i];
        delete timeDataMap[lbl];
    }
    if(typeof reassignLabels === 'function') reassignLabels(); 
    showToast('合併成功！時間已重新對齊', 'success');
});
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

            if (typeof saveState === 'function') saveState(); // 紀錄 Undo 狀態

            let modifiedCount = 0;
            selectedLabels.forEach(label => {
                if (timeDataMap[label]) {
                    const times = getCalculatedTimes(label);
                    if (times) {
                        const currentIndex = allLabelsOrdered.indexOf(label);
                        
                        // 1. 尋找「前一個」有效標記的結束時間 (作為左側極限)
                        let prevEnd = 0;
                        for (let i = currentIndex - 1; i >= 0; i--) {
                            const prevLabel = allLabelsOrdered[i];
                            if (timeDataMap[prevLabel]) {
                                const prevTimes = getCalculatedTimes(prevLabel);
                                if (prevTimes) { prevEnd = prevTimes.end; break; }
                            }
                        }

                        // 2. 尋找「後一個」有效標記的開始時間 (作為右側極限)
                        let nextStart = (typeof audioPlayer !== 'undefined' && audioPlayer.duration) ? audioPlayer.duration : Infinity;
                        for (let i = currentIndex + 1; i < allLabelsOrdered.length; i++) {
                            const nextLabel = allLabelsOrdered[i];
                            if (timeDataMap[nextLabel]) {
                                const nextTimes = getCalculatedTimes(nextLabel);
                                if (nextTimes) { nextStart = nextTimes.start; break; }
                            }
                        }

                        // 3. 計算新的起迄時間，並套用極限值防護
                        let newStart = times.start;
                        let newEnd = times.end;

                        if (padding > 0) {
                            // 【向外擴張】：確保不超出鄰居邊界
                            newStart = Math.max(prevEnd, times.start - padding);
                            if (times.end !== null) {
                                newEnd = Math.min(nextStart, times.end + padding);
                            }
                        } else {
                            // 【向內縮減】：確保起點與終點不會互相跨越
                            newStart = times.start - padding; // padding 是負數，所以這會增加數值
                            if (times.end !== null) {
                                newEnd = times.end + padding;
                                if (newStart > newEnd) {
                                    const mid = (times.start + times.end) / 2;
                                    newStart = mid;
                                    newEnd = mid;
                                }
                            }
                        }

                        // 4. 寫入新時間 (精確到小數點後 3 位)
                        const finalStart = parseFloat(newStart.toFixed(3));
                        const finalEnd = newEnd !== null ? parseFloat(newEnd.toFixed(3)) : null;
                        
                        if (finalStart !== times.start || finalEnd !== times.end) {
                            timeDataMap[label] = { start: finalStart, end: finalEnd };
                            modifiedCount++;
                        }
                    }
                }
            });

            saveToStorage();
            if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
            if (typeof renderAllRegions === 'function') renderAllRegions(); // ★ 確保重新繪製聲波圖避免殘影
            showToast(`已成功調整 ${modifiedCount} 個句子的邊界！`, 'success');
        }
    });
});

openSidebarBtn.addEventListener('click', () => { settingsSidebar.classList.add('open'); sidebarOverlay.classList.add('show'); });
closeSidebarBtn.addEventListener('click', () => { settingsSidebar.classList.remove('open'); sidebarOverlay.classList.remove('show');});
sidebarOverlay.addEventListener('click', () => { settingsSidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); });

// 綁定高度微調事件與即時預覽
if (scrollFineTuneInput) {
    scrollFineTuneInput.value = currentScrollFineTune;
    scrollFineTuneInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value) || -30;
        currentScrollFineTune = val;
        e.target.value = val;
        localStorage.setItem('tagger_scrollFineTune', currentScrollFineTune);
        showToast(`捲動微調已更新為 ${val}px`, 'success');
        
        // 即時預覽：如果目前有鎖定某個句子，立刻重新捲動讓使用者看效果
        if (currentActiveLabel) {
            const itemDiv = document.getElementById(`item-${currentActiveLabel}`);
            if (itemDiv) smartScrollTo(itemDiv);
        }
    });
}
scrollAlignSelect?.addEventListener('change', (e) => { localStorage.setItem('tagger_scrollAlign', e.target.value); showToast('已更新列表捲動定位方式', 'success'); });

sortToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    sortMenu.classList.toggle('show');
    parseMenu.classList.remove('show'); 
});

const parseModeSelect = document.getElementById('parseModeSelect');
if (parseModeSelect) {
    parseModeSelect.value = currentParseMode;
    parseModeSelect.addEventListener('change', (e) => {
        currentParseMode = e.target.value;
        saveToStorage();
    });
}

document.addEventListener('click', () => { 
    sortMenu?.classList.remove('show');
    const zoomMenu = document.getElementById('zoomMenu');
    if (zoomMenu) zoomMenu.classList.remove('show');
    const speedMenu = document.getElementById('speedMenu');
    if (speedMenu) speedMenu.classList.remove('show');
    
    if (waveMoreMenu) waveMoreMenu.classList.remove('show');
    
    document.querySelectorAll('.item-more-menu').forEach(m => m.classList.remove('show')); 
});




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






// ================= ★ 萬能音檔載入控制中心 ★ =================

// 1. 單一檔案處理引擎 (移植自舊版)
function handleSingleLocalFile(file) {
    const expectedFileName = localStorage.getItem('tagger_localFileName');
    const actualFileName = file.name;
    const isVideo = file.type.startsWith('video/') || actualFileName.toLowerCase().match(/\.(mp4|m4v|mov|webm)$/);

    const processAudioFile = (updateProjectName = true, fileToLoad = file) => {
        audioPlayer.src = URL.createObjectURL(fileToLoad); 
        audioPlayer.load();
        if (updateProjectName) localStorage.setItem('tagger_localFileName', actualFileName); 
        localStorage.setItem('tagger_audioType', 'local'); 
        if (localFileHint) localFileHint.style.display = 'none'; 
        saveToStorage(); 
        if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay(); 
        if(typeof initWaveSurfer === 'function') initWaveSurfer(); 
        
        if(typeof renderSentenceList === 'function') renderSentenceList(); 
        
        showToast(`正在載入音檔：「${actualFileName}」...`, 'normal'); 
        if(typeof checkButtonVisibility === 'function') checkButtonVisibility(); 
    };

    const checkNameAndLoad = (updateProj, fileData) => {
        if (expectedFileName && expectedFileName !== actualFileName && allLabelsOrdered.length > 0) {
            showCustomDialog({
                title: '音檔名稱不符警告',
                message: `您選擇的檔案與專案紀錄不一致！<br><br>專案：<b>${expectedFileName}</b><br>您選擇：<b style="color:#C62828;">${actualFileName}</b><br><br>確定載入？`,
                // ★ 核心修復：當使用者確定要載入新音檔時，將原本寫死的 false 改為 updateProj (true)
                // 這樣系統就會把新的檔名 (B.mp3) 正式寫入暫存記憶體中！
                onConfirm: () => processAudioFile(updateProj, fileData) 
            });
        } else { processAudioFile(updateProj, fileData); }
    };

    if (isVideo) {
        showCustomDialog({
            title: '偵測到影片檔',
            message: `建議將影片轉為純音訊檔以確保效能。<br>若原專案使用影片檔，請選「直接載入」。`,
            confirmText: '轉存音檔 (建議)', altText: '直接載入影片', cancelText: '取消',
            onConfirm: async () => {
                showToast('轉檔中，請稍候...', 'normal');
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const arrayBuffer = await file.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    const wavBlob = audioBufferToWav(audioBuffer);
                    
                    const url = URL.createObjectURL(wavBlob);
                    const a = document.createElement('a'); a.style.display = 'none'; a.href = url;
                    a.download = actualFileName.replace(/\.[^/.]+$/, "") + "_音軌.wav";
                    document.body.appendChild(a); a.click(); setTimeout(() => document.body.removeChild(a), 100);
                    checkNameAndLoad(true, wavBlob);
                } catch (err) { showToast('轉檔失敗，請手動轉檔', 'error'); }
            },
            onAlt: () => checkNameAndLoad(true, file)
        });
    } else { checkNameAndLoad(true, file); }
}

// 2. 單一網址處理引擎 (移植自舊版)
function handleSingleOnlineUrl(url) {
    url = url.trim();
    if (!url) return showToast('請先輸入音檔網址', 'error');
    if (!url.toLowerCase().startsWith('http')) return showToast('請輸入有效網址', 'error');

    const executeLoad = () => {
        audioPlayer.src = url; audioPlayer.load(); 
        localStorage.setItem('tagger_audioType', 'online'); 
        localStorage.setItem('tagger_audioUrl', url);
        if (localFileHint) localFileHint.style.display = 'none'; 
        saveToStorage(); 
        if (typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay(); 
        if (typeof initWaveSurfer === 'function') initWaveSurfer(); 
        
        if(typeof renderSentenceList === 'function') renderSentenceList(); 
        
        showToast('正在載入線上音檔...', 'normal'); 
        if (typeof checkButtonVisibility === 'function') checkButtonVisibility();
    };

    if (allLabelsOrdered.length > 0) {
        showCustomDialog({
            title: '更換音檔警告', message: '目前已有進度，確定要載入新網址嗎？', onConfirm: executeLoad
        });
    } else { executeLoad(); }
}


// 3. 視窗 UI 互動綁定
const openAudioModalBtn = document.getElementById('openAudioModalBtn');
const audioLoadModal = document.getElementById('audioLoadModalOverlay');
const tabLocalLoad = document.getElementById('tabLocalLoad');
const tabOnlineLoad = document.getElementById('tabOnlineLoad');
const sectionLocalLoad = document.getElementById('sectionLocalLoad');
const sectionOnlineLoad = document.getElementById('sectionOnlineLoad');
const onlineSingleBlock = document.getElementById('onlineSingleBlock');
const onlineBatchBlock = document.getElementById('onlineBatchBlock');
const mergeSettingsBlock = document.getElementById('mergeSettingsBlock');

// ★ 智慧防呆引擎：自動判斷是否要隱藏底部的橘色設定區塊
function updateMergeSettingsVisibility() {
    if (!mergeSettingsBlock) return;

    const isLocalMode = sectionLocalLoad && sectionLocalLoad.style.display !== 'none';
    const onlineModeNode = document.querySelector('input[name="onlineMode"]:checked');
    const onlineMode = onlineModeNode ? onlineModeNode.value : 'single';
    
    if (isLocalMode) {
        // 在本機模式下，必須判斷「是否選擇了多個檔案或 ZIP」才顯示
        const fileInput = document.getElementById('modalLocalFilesInput');
        const files = fileInput ? fileInput.files : null;
        let showBatchSettings = false;

        if (files && files.length > 0) {
            if (files.length > 1 || (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip'))) {
                showBatchSettings = true;
            }
        }
        mergeSettingsBlock.style.display = showBatchSettings ? 'block' : 'none';
    } else {
        // 在線上模式下，只要選了「批次串接」就顯示
        mergeSettingsBlock.style.display = (onlineMode === 'batch') ? 'block' : 'none';
    }
}

// 關閉視窗
function closeAudioModal() {
    audioLoadModal.classList.remove('show');
    document.body.style.overflow = ''; // 恢復網頁背景滾動
}

openAudioModalBtn?.addEventListener('click', () => {
    audioLoadModal.classList.add('show');
    document.body.style.overflow = 'hidden'; // 鎖定網頁背景滾動
    updateMergeSettingsVisibility(); // 開啟時檢查一次狀態
});

document.getElementById('audioLoadCancelBtn')?.addEventListener('click', closeAudioModal);

// 頁籤切換邏輯
tabLocalLoad?.addEventListener('click', () => {
    tabLocalLoad.style.background = 'white'; tabLocalLoad.style.color = '#00897B'; tabLocalLoad.style.borderBottom = '3px solid #00897B';
    tabOnlineLoad.style.background = 'transparent'; tabOnlineLoad.style.color = '#666'; tabOnlineLoad.style.borderBottom = '3px solid transparent';
    sectionLocalLoad.style.display = 'block'; sectionOnlineLoad.style.display = 'none';
    updateMergeSettingsVisibility();
});

tabOnlineLoad?.addEventListener('click', () => {
    tabOnlineLoad.style.background = 'white'; tabOnlineLoad.style.color = '#00897B'; tabOnlineLoad.style.borderBottom = '3px solid #00897B';
    tabLocalLoad.style.background = 'transparent'; tabLocalLoad.style.color = '#666'; tabLocalLoad.style.borderBottom = '3px solid transparent';
    sectionOnlineLoad.style.display = 'block'; sectionLocalLoad.style.display = 'none';
    updateMergeSettingsVisibility();
});

// 單一/批次網址切換邏輯
document.getElementsByName('onlineMode').forEach(radio => {
    radio.addEventListener('change', (e) => {
        onlineSingleBlock.style.display = e.target.value === 'single' ? 'block' : 'none';
        onlineBatchBlock.style.display = e.target.value === 'batch' ? 'block' : 'none';
        updateMergeSettingsVisibility();
    });
});

// ★ 核取方塊連動邏輯：空白時長開關
const batchEnablePaddingCheck = document.getElementById('batchEnablePaddingCheck');
const batchSilencePadding = document.getElementById('batchSilencePadding');

batchEnablePaddingCheck?.addEventListener('change', (e) => {
    batchSilencePadding.disabled = !e.target.checked;
    batchSilencePadding.style.background = e.target.checked ? 'white' : '#f0f0f0';
});

// 4. 終極確認按鈕邏輯分流
document.getElementById('audioLoadConfirmBtn')?.addEventListener('click', async () => {
    const isLocalMode = sectionLocalLoad.style.display !== 'none';
    
    // 讀取新的 checkbox 狀態來決定是否要有留白秒數
    const enablePadding = document.getElementById('batchEnablePaddingCheck').checked;
    const paddingSec = enablePadding ? (parseFloat(document.getElementById('batchSilencePadding').value) || 1.0) : 0;
    const autoPara = document.getElementById('batchAutoParaCheck').checked;

    closeAudioModal();

    audioLoadModal.classList.remove('show'); // 先隱藏視窗

    if (isLocalMode) {
        const fileInput = document.getElementById('modalLocalFilesInput');
        const files = Array.from(fileInput.files);
        if (files.length === 0) return showToast('請先選擇檔案', 'error');

        // 單一檔案
        if (files.length === 1 && !files[0].name.toLowerCase().endsWith('.zip')) {
            handleSingleLocalFile(files[0]);
        } 
        // 批次或 ZIP 檔案
        else {
            try {
                let validFiles = [];
                if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
                    if (typeof JSZip === 'undefined') throw new Error("找不到 JSZip 套件");
                    showToast('正在解壓縮 ZIP 檔...', 'normal');
                    const zip = new JSZip(); const zipContent = await zip.loadAsync(files[0]);
                    for (const [filename, entry] of Object.entries(zipContent.files)) {
                        if (!entry.dir && filename.match(/\.(mp3|wav|m4a|ogg|aac)$/i) && !filename.includes('__MACOSX')) {
                            const blob = await entry.async('blob');
                            validFiles.push(new File([blob], filename.split('/').pop(), { type: blob.type }));
                        }
                    }
                } else { validFiles = files.filter(f => f.name.match(/\.(mp3|wav|m4a|ogg|aac)$/i)); }

                if (validFiles.length === 0) return showToast('無支援的音檔', 'error');
                
                if (typeof saveState === 'function') saveState();
                const result = await processBatchLocalFiles(validFiles, paddingSec, autoPara);
                
                allLabelsOrdered = result.labels; sentenceTextMap = result.texts; timeDataMap = result.times;
                const mergedFileName = "批次合併_" + Date.now() + ".wav";
                const mergedFile = new File([result.blob], mergedFileName, { type: 'audio/wav' });

                audioPlayer.src = URL.createObjectURL(mergedFile); audioPlayer.load();
                localStorage.setItem('tagger_localFileName', mergedFileName); localStorage.setItem('tagger_audioType', 'local'); 
                saveToStorage(); 
                if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay(); 
                if(typeof renderSentenceList === 'function') renderSentenceList(); 
                if(typeof initWaveSurfer === 'function') initWaveSurfer(); 
                showToast(`成功合併 ${validFiles.length} 個音檔！`, 'success'); 
            } catch (err) { showToast('批次失敗：' + err.message, 'error'); }
        }
    } else {
        const onlineMode = document.querySelector('input[name="onlineMode"]:checked').value;
        if (onlineMode === 'single') {
            handleSingleOnlineUrl(document.getElementById('modalSingleUrlInput').value);
        } else {
            // 線上批次抓取邏輯
            const baseUrl = document.getElementById('batchBaseUrl').value.trim();
            const ext = document.getElementById('batchExtension').value.trim();
            let sep = document.getElementById('batchSeparator').value;
            if (sep === '\\n') sep = '\n';
            const listText = document.getElementById('batchFilenameList').value.trim();

            if (!baseUrl || !listText) return showToast('請填寫上層網址與清單', 'error');
            const filenames = listText.split(sep).map(s => s.trim()).filter(s => s !== '');
            if (filenames.length === 0) return showToast('清單為空', 'error');

            showToast(`開始抓取 ${filenames.length} 個線上檔案...`, 'normal');
            try {
                if (typeof saveState === 'function') saveState();
                const validFiles = [];
                for (let i = 0; i < filenames.length; i++) {
                    const name = filenames[i]; const fullUrl = baseUrl + name + ext;
                    showToast(`下載中: ${name}${ext} (${i+1}/${filenames.length})`, 'normal');
                    try {
                        const response = await fetch(fullUrl);
                        if (!response.ok) throw new Error(response.status);
                        const blob = await response.blob();
                        validFiles.push(new File([blob], name + ext, { type: blob.type }));
                    } catch (e) { console.error(e); showToast(`略過 ${name}${ext} (下載失敗)`, 'error'); }
                }
                if (validFiles.length === 0) throw new Error('全部下載失敗，請檢查網址或 CORS 權限');

                const result = await processBatchLocalFiles(validFiles, paddingSec, autoPara);
                allLabelsOrdered = result.labels; sentenceTextMap = result.texts; timeDataMap = result.times;
                const mergedFileName = "線上批次_" + Date.now() + ".wav";
                const mergedFile = new File([result.blob], mergedFileName, { type: 'audio/wav' });

                audioPlayer.src = URL.createObjectURL(mergedFile); audioPlayer.load();
                localStorage.setItem('tagger_localFileName', mergedFileName); localStorage.setItem('tagger_audioType', 'local'); 
                saveToStorage(); 
                if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay(); 
                if(typeof renderSentenceList === 'function') renderSentenceList(); 
                if(typeof initWaveSurfer === 'function') initWaveSurfer(); 
                showToast(`成功下載並合併 ${validFiles.length} 個音檔！`, 'success'); 
            } catch (err) { showToast('線上批次失敗：' + err.message, 'error'); }
        }
    }
});
// =========================================================================

// ================= ★ 全新：巢狀下拉選單與工具列狀態引擎 ★ =================

// 1. 選單開關邏輯
const headerMenus = ['editMenu', 'viewMenu', 'btnMenu'];

document.getElementById('editMenuBtn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleHeaderMenu('editMenu'); });
document.getElementById('viewMenuBtn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleHeaderMenu('viewMenu'); });
document.getElementById('btnMenuBtn')?.addEventListener('click', (e) => { e.stopPropagation(); toggleHeaderMenu('btnMenu'); });

function toggleHeaderMenu(menuId) {
    headerMenus.forEach(id => {
        if (id !== menuId) document.getElementById(id)?.classList.remove('show');
    });
    document.getElementById(menuId)?.classList.toggle('show');
    document.getElementById('sortMenu')?.classList.remove('show'); // 確保排序選單關閉
}

// 點擊空白處關閉所有選單
document.addEventListener('click', () => {
    headerMenus.forEach(id => document.getElementById(id)?.classList.remove('show'));
    document.getElementById('sortMenu')?.classList.remove('show');
});

// 2. 排序選單開啟 (相對於檢視選單)
document.getElementById('sortMenuToggleBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('sortMenu')?.classList.toggle('show');
});

// 3. 字體大小與時間格式切換 (在選單內切換)
document.getElementById('fontToggleBtn')?.addEventListener('click', (e) => { 
    e.stopPropagation(); // 阻止關閉選單，讓使用者可以連續點擊
    currentFontIndex = (currentFontIndex + 1) % fontSizes.length; 
    document.documentElement.style.setProperty('--sentence-font-size', fontSizes[currentFontIndex] + 'px'); 
    document.getElementById('fontToggleBtn').innerHTML = `<span class="material-icons">format_size</span> 字體大小 (${fontSizes[currentFontIndex]})`; 
});

document.getElementById('timeDisplayToggleBtn')?.addEventListener('click', (e) => { 
    e.stopPropagation();
    currentTimeModeIndex = (currentTimeModeIndex + 1) % timeModes.length; 
    document.getElementById('timeDisplayToggleBtn').innerHTML = `<span class="material-icons">schedule</span> 時間標記 (${timeModes[currentTimeModeIndex].label})`; 
    if(typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays(); 
});

// 4. 動態更新按鈕選單裡的打勾狀態
function updateBtnMenuItem(id, isActive, iconName, labelText) {
    const el = document.getElementById(id);
    if(el) {
        el.innerHTML = `<span class="material-icons" style="color: ${isActive ? '#00897B' : '#555'}">${iconName}</span> ${labelText} ${isActive ? '<span class="material-icons" style="margin-left:auto; color:#00897B; font-size:1.1rem;">check</span>' : ''}`;
        el.style.backgroundColor = isActive ? '#E0F2F1' : '';
        el.style.color = isActive ? '#00897B' : '#333';
    }
}

document.getElementById('toggleClearBtnsBtn')?.addEventListener('click', (e) => { 
    e.stopPropagation(); showClearBtns = !showClearBtns; 
    sentenceList.classList.toggle('show-clear-btns', showClearBtns); 
    updateBtnMenuItem('toggleClearBtnsBtn', showClearBtns, 'backspace', '清除按鈕');
});
document.getElementById('toggleTagBtnsBtn')?.addEventListener('click', (e) => { 
    e.stopPropagation(); 
    showTagBtns = !showTagBtns; 
    sentenceList.classList.toggle('show-tag-btns', showTagBtns); 
    updateBtnMenuItem('toggleTagBtnsBtn', showTagBtns, 'add_alarm', '標記按鈕');
});
document.getElementById('toggleAiBtnsBtn')?.addEventListener('click', (e) => { 
    e.stopPropagation(); showAiBtns = !showAiBtns; 
    sentenceList.classList.toggle('show-ai-btns', showAiBtns); 
    updateBtnMenuItem('toggleAiBtnsBtn', showAiBtns, 'auto_fix_high', 'AI 填詞按鈕');
});
document.getElementById('toggleShiftBtnsBtn')?.addEventListener('click', (e) => { 
    e.stopPropagation(); showShiftBtns = !showShiftBtns; 
    sentenceList.classList.toggle('show-shift-btns', showShiftBtns); 
    updateBtnMenuItem('toggleShiftBtnsBtn', showShiftBtns, 'update', '平移按鈕');
});
document.getElementById('toggleMoreBtnsBtn')?.addEventListener('click', (e) => { 
    e.stopPropagation(); showMoreBtns = !showMoreBtns; 
    sentenceList.classList.toggle('show-more-btns', showMoreBtns); 
    updateBtnMenuItem('toggleMoreBtnsBtn', showMoreBtns, 'more_vert', '其他按鈕');
});

// 5. 鎖定 / 解鎖引擎 (Lock Mode)
document.getElementById('toggleModeBtn')?.addEventListener('click', () => {
    isEditMode = !isEditMode;
    const toggleModeBtn = document.getElementById('toggleModeBtn');
    const modeText = document.getElementById('modeText');

    if (isEditMode) { 
        document.body.classList.remove('is-view-mode'); 
        modeText.textContent = '解鎖'; 
        toggleModeBtn.querySelector('.material-icons').textContent = 'lock_open'; 
        sentenceList.className = 'is-edit-mode'; 
        showToast('已解鎖'); 
        document.querySelectorAll('.sentence-text-display').forEach(el => { el.contentEditable = true; el.classList.add('is-editable'); });
        
        // ★ 加入防呆檢查：確認 setupPanel 存在才去更改樣式
        if (setupPanel) {
            setupPanel.style.display = 'block';
        }
    } else { 
        document.body.classList.add('is-view-mode'); 
        modeText.textContent = '鎖定'; 
        toggleModeBtn.querySelector('.material-icons').textContent = 'lock'; 
        sentenceList.className = 'is-view-mode'; 
        showToast('已鎖定'); 
        document.querySelectorAll('.sentence-text-display').forEach(el => { el.contentEditable = false; el.classList.remove('is-editable'); }); 
        
        // 鎖定時自動關閉這些按鈕狀態
        if (showClearBtns) document.getElementById('toggleClearBtnsBtn')?.click(); 
        if (showShiftBtns) document.getElementById('toggleShiftBtnsBtn')?.click(); 
        if (showMoreBtns) document.getElementById('toggleMoreBtnsBtn')?.click(); 
		if (showAiBtns) document.getElementById('toggleAiBtnsBtn')?.click();
        
        // ★ 加入防呆檢查：確認 setupPanel 存在才去更改樣式
        if (setupPanel) {
            setupPanel.style.display = 'none';
        }
    }
    
    if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
    if (typeof renderAllRegions === 'function') renderAllRegions();

    // 處理全文模式的編輯框
    const scriptTextarea = document.getElementById('scriptTextarea');
    const editorContainer = document.getElementById('scriptEditorContainer');
    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
        if (scriptTextarea) scriptTextarea.readOnly = !isEditMode;
        if (editorContainer) editorContainer.style.background = isEditMode ? '#ffffff' : '#f8f9fa';
    }
});

// 6. 全文模式防呆引擎 (Script Mode Constraint)
document.getElementById('toggleScriptModeBtn')?.addEventListener('click', () => {
    isScriptMode = !isScriptMode;
    const toggleScriptModeBtn = document.getElementById('toggleScriptModeBtn');
    
    if (isScriptMode) {
        // 切換為單句模式文字
        toggleScriptModeBtn.innerHTML = `<span class="material-icons">list</span> 單句模式`;
        sentenceList.style.display = 'none';
        scriptEditorContainer.style.display = 'flex';
        
        if (typeof saveState === 'function') saveState(); 
        populateScriptEditor();
        showToast('已進入全文模式', 'success');

        // ★ 防呆限制：隱藏不支援的選單項目
        const toHide = ['sortMenuToggleBtn', 'timeDisplayToggleBtn', 'clearAllTagsBtn', 'btnMenuContainer', 'mergeSelectedBtn'];
        toHide.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
        
    } else {
        // 切換為全文模式文字
        toggleScriptModeBtn.innerHTML = `<span class="material-icons">article</span> 全文模式`;
        sentenceList.style.display = 'flex';
        scriptEditorContainer.style.display = 'none';
        
        if (typeof renderSentenceList === 'function') renderSentenceList();
        showToast('已恢復單句模式', 'normal');

        // 解除限制：恢復所有選單項目
        const toShow = ['sortMenuToggleBtn', 'timeDisplayToggleBtn', 'clearAllTagsBtn'];
        toShow.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'flex'; });
        if (document.getElementById('btnMenuContainer')) document.getElementById('btnMenuContainer').style.display = 'inline-block';
        // 註：mergeSelectedBtn 將由 updateSelectionUI 自動接管決定是否顯示
    }
    
    // UI 外觀連動
    const scriptTextarea = document.getElementById('scriptTextarea');
    const editorContainer = document.getElementById('scriptEditorContainer');
    if (isScriptMode) {
        if (scriptTextarea) scriptTextarea.readOnly = !isEditMode;
        if (editorContainer) editorContainer.style.background = isEditMode ? '#ffffff' : '#f8f9fa';
    }
});
// =========================================================================


function updateStickyOffsets() { 
    if (stickyPanel && listHeaderContainer) { 
        listHeaderContainer.style.top = stickyPanel.offsetHeight + 'px'; 
    } 
}

let resizeTimeout = null;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateStickyOffsets, 150);
});

function toggleWaveHeight() { if (typeof wavesurfer === 'undefined' || !wavesurfer) return; currentWaveHeightIndex = (currentWaveHeightIndex + 1) % waveHeights.length; wavesurfer.setOptions({ height: waveHeights[currentWaveHeightIndex] }); showToast(`聲波高度切換為 ${waveHeights[currentWaveHeightIndex]}px`, 'success'); setTimeout(updateStickyOffsets, 50); }

const modalAltBtn = document.getElementById('customModalAltBtn');

modalCancelBtn?.addEventListener('click', () => {
    if (modalCancelCallback) modalCancelCallback();
    closeCustomDialog();
});

modalAltBtn?.addEventListener('click', () => {
    if (modalAltCallback) modalAltCallback();
    closeCustomDialog();
});

modalConfirmBtn?.addEventListener('click', () => { 
    if (modalConfirmCallback) { 
        modalConfirmCallback(modalInput.style.display === 'block' ? modalInput.value : true); 
    } 
    closeCustomDialog(); 
});

modalInput?.addEventListener('keydown', (e) => { 
    if (e.key === 'Enter') modalConfirmBtn.click(); 
});
// =========================================================================
// ================= 滾動與定位控制 (效能優化版) =================
let isScrolling = false;
window.addEventListener('scroll', () => { 
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            // 控制回到頂端按鈕
            if (window.scrollY > 400) scrollToTopBtn.classList.add('visible'); 
            else scrollToTopBtn.classList.remove('visible'); 

            const topLeftTitle = document.getElementById('topLeftTitle');
            if (topLeftTitle) {
                if (window.scrollY > 20) {
                    topLeftTitle.classList.add('is-scrolled');
                } else {
                    topLeftTitle.classList.remove('is-scrolled');
                }
            }
            isScrolling = false;
        });
        isScrolling = true;
    }
});

scrollToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });

// ================= ★ 升級版：智慧捲動與定位引擎 ★ =================
function smartScrollTo(element) {
    if (typeof isScriptMode !== 'undefined' && isScriptMode) return;
    if (!element) return;

    // 1. 計算頂部吸頂面板的總高度
    const headerHeight = (stickyPanel ? stickyPanel.offsetHeight : 0) + (listHeaderContainer ? listHeaderContainer.offsetHeight : 0);

    // 2. ★ 核心修復：強制從 DOM 即時讀取選單值，避免讀到舊的暫存變數
    const alignSelectDOM = document.getElementById('scrollAlignSelect');
    const alignMode = alignSelectDOM ? alignSelectDOM.value : 'top';

    let offset = 15; // 預設給予 15px 的呼吸空間

    if (alignMode === 'second') {
        // 3. ★ 核心修復：使用更穩健的方式尋找「上一句」
        let prev = element.previousElementSibling;

        // 防呆：如果 DOM 結構有異，改用陣列資料來找上一句，保證不會出錯
        if (!prev || !prev.classList.contains('sentence-item')) {
            const currentLabel = element.id.replace('item-', '');
            if (typeof currentSortedLabels !== 'undefined') {
                const idx = currentSortedLabels.indexOf(currentLabel);
                if (idx > 0) {
                    prev = document.getElementById(`item-${currentSortedLabels[idx - 1]}`);
                }
            }
        }

        // 4. 精準加上「前一句」的高度，留出完美空間
        if (prev) {
            offset = prev.offsetHeight + 15;
        } else {
            offset = 80; // 如果剛好是第一句，預設推下 80px
        }
    }

    // 5. 加上使用者的自訂微調高度
    offset += (typeof currentScrollFineTune !== 'undefined' ? currentScrollFineTune : 0);

    // 6. 執行精準的平滑捲動
    window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - headerHeight - offset, behavior: 'smooth' });
}

function scrollToKeepMouseSteady(currentItemDiv) {
    const nextItemDiv = currentItemDiv.nextElementSibling;
    if (nextItemDiv) window.scrollBy({ top: nextItemDiv.getBoundingClientRect().top - currentItemDiv.getBoundingClientRect().top, behavior: 'smooth' });
}

function jumpToRegion(direction) {
    // 1. 判斷目前焦點是否在輸入框內 (包含單句模式與劇本模式)
    const activeEl = document.activeElement;
    const isInputActive = activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT' || activeEl.isContentEditable);

    let targetLabel = null;

    // 2. 決定下一個要跳轉的標籤 (如果沒選取，預設跳第一句)
    if (!currentActiveLabel) {
        if (allLabelsOrdered.length > 0) targetLabel = allLabelsOrdered[0];
    } else {
        const nextIdx = allLabelsOrdered.indexOf(currentActiveLabel) + direction;
        if (nextIdx >= 0 && nextIdx < allLabelsOrdered.length) {
            targetLabel = allLabelsOrdered[nextIdx];
        }
    }

    // 3. 執行跳轉與焦點分離邏輯
    if (targetLabel) {
        // A. 更新全域狀態與視覺選取
        currentActiveLabel = targetLabel;
        lastSelectedLabel = targetLabel;
        if (typeof clearSelection === 'function') clearSelection();
        if (typeof updateSelectionUI === 'function') updateSelectionUI();

        // B. 手動移動游標 (不再依賴文字框的 focus 事件)
        const times = typeof getCalculatedTimes === 'function' ? getCalculatedTimes(targetLabel) : null;
        if (times) {
            if (typeof wavesurfer !== 'undefined' && wavesurfer && audioPlayer.duration) {
                wavesurfer.setTime(times.start);
            } else if (typeof audioPlayer !== 'undefined' && audioPlayer) {
                audioPlayer.currentTime = times.start;
            }
        }

        const isScript = (typeof isScriptMode !== 'undefined' && isScriptMode);
        
        // C. 情境感知：根據目前狀態決定焦點去留
        if (isInputActive) {
            // 【情境 A】目前在打字：焦點必須跟著文字走
            if (isScript) {
                const scriptTextarea = document.getElementById('scriptTextarea');
                if (scriptTextarea) scriptTextarea.focus();
            } else {
                const itemDiv = document.getElementById(`item-${targetLabel}`);
                if (itemDiv) {
                    if (typeof smartScrollTo === 'function') smartScrollTo(itemDiv);
                    const textDisplay = itemDiv.querySelector('.sentence-text-display');
                    if (textDisplay) textDisplay.focus();
                }
            }
        } else {
            // 【情境 B】目前在操作聲波：清除焦點，確保 Space 鍵能播放！
            if (activeEl) activeEl.blur(); 
            
            if (isScript) {
                const targetGutter = document.getElementById(`gutter-${targetLabel}`);
                const scriptTextarea = document.getElementById('scriptTextarea');
                if (targetGutter && scriptTextarea) {
                    scriptTextarea.scrollTop = Math.max(0, targetGutter.offsetTop - 40);
                    const backdrop = document.getElementById('scriptBackdrop');
                    if (backdrop) backdrop.scrollTop = scriptTextarea.scrollTop;
                }
            } else {
                const itemDiv = document.getElementById(`item-${targetLabel}`);
                if (itemDiv && typeof smartScrollTo === 'function') smartScrollTo(itemDiv);
            }
            
            // 讓波形吸頂生效
            if (typeof snapWaveformToTop === 'function') setTimeout(snapWaveformToTop, 50);
        }
    }
}


// 鍵盤快速鍵核心監聽器
document.addEventListener('keydown', e => { if(e.key === 'Shift') isShiftPressed = true; });
document.addEventListener('keyup', e => { if(e.key === 'Shift') isShiftPressed = false; });
document.addEventListener('keydown', (e) => {
    const isInputActive = (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable);
	if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF') {
        e.preventDefault();
        
        const findBtn = document.getElementById('openBatchReplaceBtn');
        if (findBtn) {
            findBtn.click();
        }
        return; 
    }
    
    if (e.code === 'Tab' && !isInputActive) {
        e.preventDefault(); // 阻止瀏覽器預設的焦點切換
        if (typeof jumpToRegion === 'function') {
            // 支援 Shift + Tab 往回跳！
            jumpToRegion(e.shiftKey ? -1 : 1);
        }
        return;
    }
    
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
        
        const searchPanel = document.getElementById('batchReplaceModalOverlay');
        if (searchPanel && searchPanel.classList.contains('show')) {
            document.getElementById('batchReplaceCancelBtn')?.click();
            return;
        }

        if(typeof clearSelection === 'function') clearSelection(); 
        if (tempRegion) { tempRegion.remove(); tempRegion = null; }
        currentActiveLabel = null;
        if(typeof updateSelectionUI === 'function') updateSelectionUI(); 
        return;
    }

    if (e.code === 'Space' && !isInputActive) { 
        e.preventDefault(); 
        if (document.activeElement) document.activeElement.blur(); 
        
        if(typeof togglePlayPause === 'function') togglePlayPause(); 
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
        if (e.shiftKey) {
            // 1. 處理 Ctrl + Shift + A (全選整個音檔聲波)
            if (isInputActive) return; // 若正在打字則不干擾
            e.preventDefault();
            const waveSelectAllAudioBtn = document.getElementById('waveSelectAllAudioBtn');
            if (waveSelectAllAudioBtn) waveSelectAllAudioBtn.click(); // 直接觸發按鈕點擊事件
        } else {
            // 2. 處理一般的 Ctrl + A (全選文字或標記)
            if (typeof isScriptMode !== 'undefined' && isScriptMode) {
                // 劇本模式：全選大編輯框文字
                e.preventDefault();
                const scriptTextarea = document.getElementById('scriptTextarea');
                if (scriptTextarea) {
                    scriptTextarea.focus();
                    scriptTextarea.select();
                    showToast('已全選劇本文字', 'success');
                }
            } else if (isInputActive) {
                // 一般模式且正在打字：交給瀏覽器原生處理
                return;
            } else {
                // 一般模式且未打字：全選聲波圖標記
                e.preventDefault();
                selectedLabels = allLabelsOrdered.filter(label => timeDataMap[label] !== undefined);
                if (typeof updateSelectionUI === 'function') updateSelectionUI();
                showToast(`已全選 ${selectedLabels.length} 個標記`, 'success');
            }
        }
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

    // 1. 優先檢查：是否有藍色選取框 (tempRegion)
    if (typeof tempRegion !== 'undefined' && tempRegion !== null) {
        if (typeof downloadTimeRangeAudio === 'function') {
            let prefix = "自訂選取範圍";
            // 智慧判斷：如果選取範圍剛好是從 0 到最後，就命名為「完整音檔」
            if (audioPlayer && audioPlayer.duration && tempRegion.start === 0 && tempRegion.end === audioPlayer.duration) {
                prefix = "完整音檔";
            }
            downloadTimeRangeAudio(tempRegion.start, tempRegion.end, prefix);
        } else {
            showToast('找不到下載引擎', 'error');
        }
        return; // 執行完自訂下載就結束，不跑下面的原本邏輯
    }

    // 2. 如果有選取多個句子，開啟進階視窗
    if (typeof selectedLabels !== 'undefined' && selectedLabels.length > 1) {
        document.getElementById('downloadSelectionCount').textContent = selectedLabels.length;
        advDownloadModal.classList.add('show');
    } 
    // 3. 單選，或是沒有特別選取但有正在作用中的句子，直接下載單檔
    else {
        const targetLabel = (typeof selectedLabels !== 'undefined' && selectedLabels.length === 1) ? selectedLabels[0] : currentActiveLabel;
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
    
    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
        // 劇本模式：全選大編輯框文字
        const scriptTextarea = document.getElementById('scriptTextarea');
        if (scriptTextarea) {
            scriptTextarea.focus();
            scriptTextarea.select();
            showToast('已全選劇本文字', 'success');
        }
    } else {
        // 一般模式：全選聲波標記
        selectedLabels = allLabelsOrdered.filter(label => timeDataMap[label] !== undefined);
        if (typeof updateSelectionUI === 'function') updateSelectionUI();
        showToast(`已全選 ${selectedLabels.length} 個標記`, 'success');
    }
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


const waveSelectAllAudioBtn = document.getElementById('waveSelectAllAudioBtn');
waveSelectAllAudioBtn?.addEventListener('click', () => {
    if (waveMoreMenu) waveMoreMenu.classList.remove('show');
    
    if (typeof wavesurfer === 'undefined' || !wavesurfer || !audioPlayer || !audioPlayer.duration) {
        return showToast('請先載入音檔並等待解析完成', 'error');
    }

    // 1. 清除畫面上現有的選取與暫存狀態，確保環境乾淨
    if (typeof clearSelection === 'function') clearSelection();
    if (tempRegion) { tempRegion.remove(); tempRegion = null; }
    currentActiveLabel = null;
    document.querySelectorAll('.sentence-item.playing').forEach(el => el.classList.remove('playing'));
    if (wsRegions) wsRegions.getRegions().forEach(r => r.setOptions({ color: 'rgba(0, 137, 123, 0.1)' }));

    // 2. 建立涵蓋 0 到音檔總長度的全新藍色選取框
    if (wsRegions) {
        tempRegion = wsRegions.addRegion({ 
            start: 0, 
            end: audioPlayer.duration, 
            color: 'rgba(33, 150, 243, 0.3)', 
            drag: true, 
            resize: true 
        });
    }

    // 3. 刷新工具列狀態並顯示提示
    if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
    showToast('已選取整首音檔範圍', 'success');
});

tagRegionBtn?.addEventListener('click', () => {
    if (tagRegionBtn.disabled || !isEditMode) return; 
    
    if (tempRegion) {
        const tStart = parseFloat(tempRegion.start.toFixed(3));
        const tEnd = parseFloat(tempRegion.end.toFixed(3));
        let overlapLabels = [];

        // 掃描所有有效的標記，檢查是否與目前的藍色選取框重疊
        for (let i = 0; i < allLabelsOrdered.length; i++) {
            const label = allLabelsOrdered[i];
            if (timeDataMap[label]) {
                const times = typeof getCalculatedTimes === 'function' ? getCalculatedTimes(label) : null;
                if (times) {
                    // 檢查重疊 (容許 0.01 秒的邊界貼齊，大於此數值才算重疊)
                    if (tStart < (times.end - 0.01) && tEnd > (times.start + 0.01)) {
                        overlapLabels.push(label);
                    }
                }
            }
        }

        // 如果發現重疊，攔截並跳出警告視窗
        if (overlapLabels.length > 0) {
            showCustomDialog({
                title: '標記範圍重疊',
                message: `您選取的範圍與現有的標記（包含 <strong style="color:#C62828;">${overlapLabels[0]}</strong>）發生重疊！<br><br>為避免句子順序與時間錯亂，系統已阻擋此次新增。<br><br><span style="color:#00897B; font-weight:bold;">💡 建議作法：</span><br>1. 若要重新標記，請先點選原有標記並按 <b>Delete</b> 清除。<br>2. 若要將多個句子連在一起，請選取它們後使用 <b>合併 (Ctrl+J)</b> 功能。`,
                onConfirm: () => {
                    if (tempRegion) { tempRegion.remove(); tempRegion = null; }
                    if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
                }
            });
            return; 
        }

        // 若無重疊，則執行寫入邏輯
        if(typeof saveState === 'function') saveState(); // 紀錄狀態
        
        // 1. 如果有明確選中某個「尚未標記時間」的句子，優先套用給它
        if (currentActiveLabel && !timeDataMap[currentActiveLabel]) { 
            timeDataMap[currentActiveLabel] = { start: tStart, end: tEnd }; 
            showToast(`已套用至 ${currentActiveLabel}`, 'success'); 
        } 
        else { 
            // 2. 否則，執行「骨牌推移 (Domino Shift)」插入邏輯
            // 尋找這個新時間應該安插在哪一個位置 (依據時間先後順序)
            let insertIdx = allLabelsOrdered.length;
            for (let i = 0; i < allLabelsOrdered.length; i++) {
                const lbl = allLabelsOrdered[i];
                if (timeDataMap[lbl]) {
                    const lblStart = typeof timeDataMap[lbl] === 'object' ? timeDataMap[lbl].start : timeDataMap[lbl];
                    if (lblStart > tStart) {
                        insertIdx = i;
                        break;
                    }
                }
            }

            // 收集要往後推的現有時間標記 (包含新加入的這個)
            let timesToReassign = [{ start: tStart, end: tEnd }];
            for (let i = insertIdx; i < allLabelsOrdered.length; i++) {
                const lbl = allLabelsOrdered[i];
                if (timeDataMap[lbl]) {
                    timesToReassign.push(timeDataMap[lbl]);
                    delete timeDataMap[lbl]; // 先從原地拔除
                }
            }

            // 依序貼回句子上
            let assignIdx = insertIdx;
            let overflowCount = 0;
            
            for (let i = 0; i < timesToReassign.length; i++) {
                if (assignIdx < allLabelsOrdered.length) {
                    timeDataMap[allLabelsOrdered[assignIdx]] = timesToReassign[i];
                    assignIdx++;
                } else {
                    overflowCount++; // 如果句子不夠了，只能捨棄溢出的標記
                }
            }

            if (overflowCount > 0) {
                showToast(`已新增標記並推移！但句子不足，末端 ${overflowCount} 個標記已捨棄`, 'normal');
            } else {
                const targetLabel = allLabelsOrdered[insertIdx];
                showToast(`已新增標記！套用至 ${targetLabel}，後方標記已順延`, 'success');
            }
        }
        
        saveToStorage(); 
        if(typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays(); 
        if(typeof renderAllRegions === 'function') renderAllRegions(); // 確保重新繪製聲波圖，讓編號正確顯示
        
        tempRegion.remove(); 
        tempRegion = null;
    }
    
    if(typeof updateToolbarButtons === 'function') updateToolbarButtons(); 
});


clearRegionBtn?.addEventListener('click', () => { 
    if (clearRegionBtn.disabled || !isEditMode) return; 
    
    // 1. 如果有選取多個標記 (批次清除，需確認)
    if (typeof selectedLabels !== 'undefined' && selectedLabels.length > 1) {
        showCustomDialog({
            title: '批次清除時間標記',
            message: `確定要清除選取的 <strong style="color:#C62828;">${selectedLabels.length}</strong> 個時間標記嗎？<br><br><span style="font-size: 0.85em; color: #666;">(清除後，後續所有的標記將會無條件跨段落往前遞補)</span>`,
            onConfirm: () => {
                if (typeof saveState === 'function') saveState();
                
                let clearedCount = 0;
                let rowDeleted = false; 
                let minIdx = allLabelsOrdered.length; // 記錄最上面被刪除的位置
                
                selectedLabels.forEach(label => {
                    const text = sentenceTextMap[label] || '';
                    const idx = allLabelsOrdered.indexOf(label);
                    
                    if (text.trim() === '') {
                        if (idx > -1) {
                            allLabelsOrdered.splice(idx, 1);
                            delete sentenceTextMap[label];
                            delete timeDataMap[label];
                            rowDeleted = true;
                            clearedCount++;
                        }
                    } else if (timeDataMap[label]) {
                        delete timeDataMap[label];
                        if (idx < minIdx) minIdx = idx;
                        clearedCount++;
                    }
                });

                if (rowDeleted) {
                    if(typeof reassignLabels === 'function') reassignLabels(); 
                } else {
                    // ★ 核心修復：從最上面被刪掉的位置，把後面所有時間像接龍一樣往前拉
                    if (minIdx < allLabelsOrdered.length) {
                        let extractedTimes = [];
                        for (let i = minIdx; i < allLabelsOrdered.length; i++) {
                            const lbl = allLabelsOrdered[i];
                            if (timeDataMap[lbl]) {
                                extractedTimes.push(timeDataMap[lbl]);
                                delete timeDataMap[lbl];
                            }
                        }
                        
                        let assignIdx = minIdx;
                        for (let i = 0; i < extractedTimes.length; i++) {
                            if (assignIdx < allLabelsOrdered.length) {
                                timeDataMap[allLabelsOrdered[assignIdx]] = extractedTimes[i];
                                assignIdx++;
                            }
                        }
                    }

                    saveToStorage(); 
                    if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays(); 
                    if (typeof renderAllRegions === 'function') renderAllRegions(); 
                    if (typeof clearSelection === 'function') clearSelection(); 
                }
                
                if (typeof updateToolbarButtons === 'function') updateToolbarButtons(); 
                showToast(`成功清除並遞補了 ${clearedCount} 個標記`, 'success');
            }
        });
    } else if (currentActiveLabel) {
        if (typeof saveState === 'function') saveState();
        if (typeof handleClearTag === 'function') handleClearTag(currentActiveLabel); 
        if (typeof clearSelection === 'function') clearSelection(); 
        if (typeof updateToolbarButtons === 'function') updateToolbarButtons(); 
    }
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


// 2. 匯入專案檔 (Import JSON) - 無縫熱更新版
importProjectBtn?.addEventListener('click', () => importProjectInput.click());

importProjectInput?.addEventListener('change', (e) => {
    const file = e.target.files[0]; 
    e.target.value = ''; 
    if (!file) return;
    
    const processImport = () => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (!data.allLabelsOrdered || !data.sentenceTextMap) throw new Error("格式不符");
                
                if(typeof saveState === 'function') saveState(); 

                allLabelsOrdered = data.allLabelsOrdered;
                sentenceTextMap = data.sentenceTextMap;
                timeDataMap = data.timeDataMap || {};
                
                if (data.title) {
                    localStorage.setItem('tagger_projectTitle', data.title);
                } else {
                    localStorage.removeItem('tagger_projectTitle');
                }
                
                if (rawTextInput) {
                    rawTextInput.value = data.rawText || '';
                    if (typeof autoResizeRawText === 'function') autoResizeRawText(); 
                }
                
                currentParseMode = data.settings?.currentParseMode || 'punct';
                currentSortMode = data.settings?.currentSortMode || 'default';

                localStorage.setItem('tagger_audioUrl', data.audioUrl || '');
                localStorage.setItem('tagger_localFileName', data.localFileName || '');
                
                // ★ 確保匯入時設定正確的音檔類型，讓系統能辨識
                if (data.localFileName) {
                    localStorage.setItem('tagger_audioType', 'local');
                } else if (data.audioUrl) {
                    localStorage.setItem('tagger_audioType', 'online');
                }

                saveToStorage();

                if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay();
                if(typeof renderSentenceList === 'function') renderSentenceList(); 
                if(typeof renderAllRegions === 'function') renderAllRegions();
                
                // ★ 核心修改：使用共用的 UI 引擎展開聲波面板與警告，取代原本的對話框
                if (data.localFileName && (!audioPlayer.src || !audioPlayer.src.includes('blob:'))) {
                    if (typeof window.showMissingAudioUI === 'function') {
                        window.showMissingAudioUI(data.localFileName);
                    }
                    // 使用輕量化的 Toast 提示，不打斷使用者流程
                    showToast('專案載入成功！請點擊上方橘色區塊重新選取音檔', 'normal');
                } else if (data.audioUrl) {
                    // 若是線上網址，可考慮自動載入 (此處保留原邏輯，不自動播放以省流量)
                    showToast('專案檔讀取成功！畫面已還原', 'success');
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

    if (allLabelsOrdered.length > 0) {
        showCustomDialog({
            title: '覆蓋警告',
            message: '匯入專案將會<span style="color:#C62828; font-weight:bold;">覆蓋您目前的編輯進度</span>，確定要繼續嗎？',
            onConfirm: () => { processImport(); }
        });
    } else {
        processImport();
    }
});

// ================= 自動斷句 Modal 設定與記憶 =================
function initAutoSegmentSetting(inputId, displayId, storageKey, formatFn) {
    const inputEl = document.getElementById(inputId);
    const displayEl = displayId ? document.getElementById(displayId) : null;
    if (!inputEl) return;

    // 1. 網頁載入時，先讀取暫存的設定
    const savedValue = localStorage.getItem(storageKey);
    if (savedValue !== null) {
        inputEl.value = savedValue;
    }

    // 2. 初始化畫面上的文字顯示
    if (displayEl && formatFn) {
        displayEl.textContent = formatFn(inputEl.value);
    }

    // 3. 監聽使用者操作：滑動時即時更新畫面，並存入 localStorage
    inputEl.addEventListener('input', (e) => {
        if (displayEl && formatFn) displayEl.textContent = formatFn(e.target.value);
        localStorage.setItem(storageKey, e.target.value);
    });
}

// 綁定「依靜音斷句」的四個滑桿
initAutoSegmentSetting('asThreshold', 'asThresholdVal', 'tagger_asThreshold', v => `(${v}%)`);
initAutoSegmentSetting('asSilence', 'asSilenceVal', 'tagger_asSilence', v => `(${parseFloat(v).toFixed(1)} 秒)`);
initAutoSegmentSetting('asMinSegment', 'asMinSegmentVal', 'tagger_asMinSegment', v => `(${parseFloat(v).toFixed(1)} 秒)`);
initAutoSegmentSetting('asPadding', 'asPaddingVal', 'tagger_asPadding', v => `(${parseFloat(v).toFixed(1)} 秒)`);

// 順便綁定「依等長時間」的兩個輸入框
initAutoSegmentSetting('asFixedTimeMinutes', null, 'tagger_asFixedTimeMinutes', null);
initAutoSegmentSetting('asFixedTimeSeconds', null, 'tagger_asFixedTimeSeconds', null);

// 1. 全域自動斷句 (左側清單按鈕)
autoSegmentBtn?.addEventListener('click', () => { 
    if (typeof wavesurfer === 'undefined' || !wavesurfer || !wavesurfer.getDecodedData()) {
        return showToast('請先載入音檔並等待分析完成', 'error'); 
    }
    targetAutoSegmentRange = null; // 設定為全域模式
    asModal?.classList.add('show'); 
});

// 2. ★ 修改：局部自動斷句 (支援無標記全選、藍色選取框 與 選取現有標記)
autoSegmentRegionBtn?.addEventListener('click', () => {
    if (!isEditMode) return;

    // 檢查是否完全沒有標記
    const hasNoMarkers = typeof allLabelsOrdered === 'undefined' || allLabelsOrdered.length === 0;

    // 【狀況 A】如果畫面完全沒有標記：自動「全選」整首音檔並開啟設定
    if (hasNoMarkers) {
        if (typeof wavesurfer === 'undefined' || !wavesurfer || !audioPlayer || !audioPlayer.duration) {
            return showToast('請先載入音檔', 'error');
        }

        // 建立一個涵蓋全音檔的藍色選取框作為視覺提示
        if (typeof clearSelection === 'function') clearSelection();
        if (typeof tempRegion !== 'undefined' && tempRegion) { tempRegion.remove(); tempRegion = null; }

        if (typeof wsRegions !== 'undefined' && wsRegions) {
            tempRegion = wsRegions.addRegion({
                start: 0,
                end: audioPlayer.duration,
                color: 'rgba(33, 150, 243, 0.3)',
                drag: true,
                resize: true
            });
        }

        // ★ 核心修復：將目標範圍設定為 null！
        // 這樣確認送出時，系統就會知道要呼叫「全域斷句引擎 (performAutoSegmentation)」，進而幫你產生新句子！
        targetAutoSegmentRange = null; 
        
        if (typeof asModal !== 'undefined' && asModal) asModal.classList.add('show');
        if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
        return; // 結束執行
    }

    // 如果按鈕被禁用 (且不是無標記的特殊狀態)，則阻擋點擊
    if (autoSegmentRegionBtn.disabled) return;

    // 【狀況 B】處理「選取現有標記」
    if (typeof selectedLabels !== 'undefined' && selectedLabels.length > 0) {
        let minStart = Infinity;
        let maxEnd = 0;
        const validLabels = [];

        selectedLabels.forEach(label => {
            if (timeDataMap[label]) {
                const times = typeof getCalculatedTimes === 'function' ? getCalculatedTimes(label) : null;
                if (times) {
                    minStart = Math.min(minStart, times.start);
                    maxEnd = Math.max(maxEnd, times.end);
                    validLabels.push(label);
                }
            }
        });

        if (validLabels.length > 0) {
            targetAutoSegmentRange = { start: minStart, end: maxEnd, labelsToClear: validLabels };
            if (typeof asModal !== 'undefined' && asModal) asModal.classList.add('show');
        } else {
            showToast('選取的標記沒有時間資料', 'error');
        }

    // 【狀況 C】處理單純的「藍色選取框」
    } else if (typeof tempRegion !== 'undefined' && tempRegion) {
        targetAutoSegmentRange = { start: tempRegion.start, end: tempRegion.end, labelsToClear: [] };
        if (typeof asModal !== 'undefined' && asModal) asModal.classList.add('show');
    } else {
        showToast('請先選取要斷句的範圍', 'error');
    }
});

asCancelBtn?.addEventListener('click', () => asModal?.classList.remove('show'));

// ================= 自動斷句 Modal 雙頁籤與按鈕事件 =================
const tabAutoSilence = document.getElementById('tabAutoSilence');
const tabAutoTime = document.getElementById('tabAutoTime');
const sectionAutoSilence = document.getElementById('sectionAutoSilence');
const sectionAutoTime = document.getElementById('sectionAutoTime');

// 頁籤切換動畫與顯示邏輯
tabAutoSilence?.addEventListener('click', () => {
    tabAutoSilence.style.background = 'white'; tabAutoSilence.style.color = '#1976D2'; tabAutoSilence.style.borderBottom = '3px solid #1976D2';
    tabAutoTime.style.background = 'transparent'; tabAutoTime.style.color = '#666'; tabAutoTime.style.borderBottom = '3px solid transparent';
    sectionAutoSilence.style.display = 'block'; sectionAutoTime.style.display = 'none';
});

tabAutoTime?.addEventListener('click', () => {
    tabAutoTime.style.background = 'white'; tabAutoTime.style.color = '#1976D2'; tabAutoTime.style.borderBottom = '3px solid #1976D2';
    tabAutoSilence.style.background = 'transparent'; tabAutoSilence.style.color = '#666'; tabAutoSilence.style.borderBottom = '3px solid transparent';
    sectionAutoTime.style.display = 'block'; sectionAutoSilence.style.display = 'none';
});

// 3. 執行分析 (分流：靜音引擎 vs 等長時間引擎)
asConfirmBtn?.addEventListener('click', () => { 
    asModal?.classList.remove('show'); 
    
    // 檢查目前在哪個頁籤
    const isTimeMode = sectionAutoTime && sectionAutoTime.style.display !== 'none';
    
    if (targetAutoSegmentRange) {
        if (typeof saveState === 'function') saveState(); // 紀錄狀態以便反悔

        // 若是針對現有標記重新斷句，先清除它們的時間(釋放空間)避免重疊！
        if (targetAutoSegmentRange.labelsToClear && targetAutoSegmentRange.labelsToClear.length > 0) {
            targetAutoSegmentRange.labelsToClear.forEach(label => {
                if (timeDataMap[label]) delete timeDataMap[label];
            });
            if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
            if (typeof clearSelection === 'function') clearSelection();
        }

        // 分流：呼叫對應的局部斷句引擎
        if (isTimeMode) {
            if (typeof performTimeSegmentation === 'function') performTimeSegmentation(targetAutoSegmentRange);
        } else {
            if (typeof performRegionAutoSegmentation === 'function') {
                performRegionAutoSegmentation(targetAutoSegmentRange.start, targetAutoSegmentRange.end);
            }
        }
    } else {
        // 分流：呼叫對應的全域斷句引擎
        if (typeof saveState === 'function') saveState(); 
        if (isTimeMode) {
            if (typeof performTimeSegmentation === 'function') performTimeSegmentation(null);
        } else {
            if (typeof performAutoSegmentation === 'function') performAutoSegmentation(); 
        }
    }
});


// 頁面載入核心初始化
window.addEventListener('DOMContentLoaded', () => { 
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
    
    // 1. 智慧偵測：計算按鈕距離視窗底部的距離
    const rect = waveMoreBtn.getBoundingClientRect();
    
    // 如果距離底部小於 260px (空間不足)，就往上展開
    if (window.innerHeight - rect.bottom < 260) {
        waveMoreMenu.style.top = 'auto';
        waveMoreMenu.style.bottom = '100%';
        waveMoreMenu.style.marginTop = '0';
        waveMoreMenu.style.marginBottom = '8px';
    } else {
        // 否則預設往下展開
        waveMoreMenu.style.top = '100%';
        waveMoreMenu.style.bottom = 'auto';
        waveMoreMenu.style.marginTop = '8px';
        waveMoreMenu.style.marginBottom = '0';
    }

    // 2. 切換顯示狀態
    waveMoreMenu.classList.toggle('show');
    
    // 3. 開啟時，確保關閉其他相鄰的選單，保持畫面乾淨
    const zoomMenu = document.getElementById('zoomMenu');
    if (zoomMenu) zoomMenu.classList.remove('show');
    const speedMenu = document.getElementById('speedMenu');
    if (speedMenu) speedMenu.classList.remove('show');
});

// 防止點擊選單內部時意外關閉 (除非點擊的是執行按鈕)
waveMoreMenu?.addEventListener('click', (e) => {
    e.stopPropagation(); 
});

// ================= ★ 新增：AI 辨識語言設定事件 ★ =================
const transcribeLangSelect = document.getElementById('transcribeLangSelect');

if (transcribeLangSelect) {
    // 網頁載入時，從暫存讀取上一次設定的語言 (預設為 zh-TW)
    const savedLang = localStorage.getItem('tagger_aiLanguage') || 'zh-TW';
    transcribeLangSelect.value = savedLang;
    
    // 當使用者切換選單時
    transcribeLangSelect.addEventListener('change', (e) => {
        const selectedLang = e.target.value;
        localStorage.setItem('tagger_aiLanguage', selectedLang); // 記住設定
        
        let langName = '繁體中文';
        if (selectedLang === 'en') langName = '英文';
        if (selectedLang === 'ja') langName = '日文';
        
        showToast(`AI 辨識語言已切換為：${langName}`, 'success');
    });
}

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


// ================= 新增：播放模式與側邊欄動態連動 =================
if (playbackModeSelect) {
    playbackModeSelect.value = playbackMode;
    
    // 定義動態顯示隱藏的邏輯
    const toggleContinuousSettings = () => {
        if (continuousSettingsBlock) {
            continuousSettingsBlock.style.display = playbackModeSelect.value === 'continuous' ? 'block' : 'none';
        }
    };
    toggleContinuousSettings(); // 載入時先執行一次

    playbackModeSelect.addEventListener('change', (e) => {
        playbackMode = e.target.value;
        localStorage.setItem('tagger_playbackMode', playbackMode);
        toggleContinuousSettings(); // 切換時自動隱藏/顯示
        showToast(`已切換為：${playbackMode === 'single' ? '單句/區段' : '連續'}播放模式`, 'success');
    });
}

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


// ================= ★ 6. 全文模式防呆切換引擎 (單句/全文切換) ★ =================
const toggleScriptModeBtnEl = document.getElementById('toggleScriptModeBtn');

toggleScriptModeBtnEl?.addEventListener('click', (e) => {
    e.stopPropagation(); // 防止事件冒泡干擾
    
    isScriptMode = !isScriptMode;
    
    // 點擊後自動關閉檢視選單，讓使用者直接看到畫面變化
    document.getElementById('viewMenu')?.classList.remove('show');
    
    if (isScriptMode) {
        // 【進入全文模式】：★ 修改：按鈕文字改為顯示目前的狀態「全文模式」
        toggleScriptModeBtnEl.innerHTML = `<span class="material-icons">article</span> 全文模式`;
        
        // 切換版面
        document.getElementById('sentenceList').style.display = 'none';
        document.getElementById('scriptEditorContainer').style.display = 'flex';
        
        if (typeof saveState === 'function') saveState(); 
        if (typeof populateScriptEditor === 'function') populateScriptEditor();
        showToast('已進入全文模式', 'success');

        // 防呆限制：隱藏不支援的選單項目
        const toHide = ['sortMenuToggleBtn', 'timeDisplayToggleBtn', 'clearAllTagsBtn', 'btnMenuContainer', 'mergeSelectedBtn'];
        toHide.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
        
    } else {
        // 【恢復單句模式】：★ 修改：按鈕文字改回顯示目前的狀態「單句模式」
        toggleScriptModeBtnEl.innerHTML = `<span class="material-icons">list</span> 單句模式`;
        
        // 切換版面
        document.getElementById('sentenceList').style.display = 'flex';
        document.getElementById('scriptEditorContainer').style.display = 'none';
        
        if (typeof renderSentenceList === 'function') renderSentenceList();
        showToast('已恢復單句模式', 'normal');

        // 解除限制：恢復所有選單項目
        const toShow = ['sortMenuToggleBtn', 'timeDisplayToggleBtn', 'clearAllTagsBtn'];
        toShow.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'flex'; });
        if (document.getElementById('btnMenuContainer')) document.getElementById('btnMenuContainer').style.display = 'inline-block';
    }
    
    // UI 外觀 (鎖定/解鎖) 連動
    const scriptTextarea = document.getElementById('scriptTextarea');
    const editorContainer = document.getElementById('scriptEditorContainer');
    if (isScriptMode) {
        if (scriptTextarea) scriptTextarea.readOnly = !isEditMode;
        if (editorContainer) editorContainer.style.background = isEditMode ? '#ffffff' : '#f8f9fa';
    }
});
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
openDataModalBtn?.addEventListener('click', () => { dataImportModal.classList.add('show'); document.body.style.overflow = 'hidden'; });
function closeDataModal() { dataImportModal.classList.remove('show'); document.body.style.overflow = ''; }
closeDataModalBtn?.addEventListener('click', closeDataModal);

tabPasteText?.addEventListener('click', () => {
    tabPasteText.style.background = 'white'; tabPasteText.style.color = '#00897B'; tabPasteText.style.borderBottom = '3px solid #00897B';
    tabImportFile.style.background = 'transparent'; tabImportFile.style.color = '#666'; tabImportFile.style.borderBottom = '3px solid transparent';
    sectionPasteText.style.display = 'flex'; sectionImportFile.style.display = 'none';
});
tabImportFile?.addEventListener('click', () => {
    tabImportFile.style.background = 'white'; tabImportFile.style.color = '#00897B'; tabImportFile.style.borderBottom = '3px solid #00897B';
    tabPasteText.style.background = 'transparent'; tabPasteText.style.color = '#666'; tabPasteText.style.borderBottom = '3px solid transparent';
    sectionImportFile.style.display = 'block'; sectionPasteText.style.display = 'none';
});

// ★ 核心功能：原地預覽解析結果
const previewParseBtn = document.getElementById('previewParseBtn');
previewParseBtn?.addEventListener('click', () => {
    const rawTextInput = document.getElementById('rawTextInput');
    let rawText = rawTextInput.value.trim().replace(/\\n/g, '\n');
    if (!rawText) return showToast('請先貼上文字', 'error');
    
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
                
                if (!inBrackets && /[，。：；！？、．─「」【】『』《》?!.,]/.test(char)) {
                    let isDecimal = false;
                    if ((char === '.' || char === ',') && i > 0 && i < para.length - 1) { if (/\d/.test(para[i-1]) && /\d/.test(para[i+1])) isDecimal = true; }
                    
                    if (!isDecimal) {
                        // 貪婪吸收後續的標點符號
                        while (i + 1 < para.length && /[，。：；！？、．─「」【】『』《》"”'’?!.,\s]/.test(para[i+1])) {
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
    rawTextInput.value = tempLabels.map(lbl => `${lbl}\t\t\t${tempTexts[lbl]}`).join('\n');
    showToast('已在原地解析！確認無誤後請點擊「確定載入」', 'success');
});

// ★ 更新上次載入資料的提示文字
function updateDataFileHint() {
    const lastFile = localStorage.getItem('tagger_lastDataFile');
    const hintEl = document.getElementById('localDataFileHint');
    if (lastFile && hintEl) {
        hintEl.innerHTML = `<span class="material-icons" style="font-size: 1.1rem; margin-right: 4px;">warning</span> 上次匯入資料：「${lastFile}」，請確認是否需重新選取`;
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

// 搜尋狀態機
let searchEngine = { query: '', useRegex: false, matches: [], currentIndex: -1 };

// 開啟視窗與關閉視窗
openBatchReplaceBtn?.addEventListener('click', () => {
    batchReplaceModal.classList.add('show');
    setTimeout(() => { findTextInput.focus(); findTextInput.select(); }, 100); 
});
batchReplaceCancelBtn?.addEventListener('click', () => {
    batchReplaceModal.classList.remove('show');
    searchEngine.query = ''; 
    clearAllHighlights(); // 關閉時清除高亮
});

// 核心：掃描並更新所有符合的字串位置
function updateSearchMatches() {
    const findStr = findTextInput.value;
    const useRegex = useRegexCheck ? useRegexCheck.checked : false;
    searchEngine.matches = [];
    searchEngine.query = findStr;
    searchEngine.useRegex = useRegex;

    if (!findStr) { renderHighlights(); return; }

    let searchRegex = null;
    if (useRegex) {
        try { searchRegex = new RegExp(findStr, 'g'); } catch(e) { renderHighlights(); return; }
    }

    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
        // 劇本模式：計算 textarea 內的文字索引
        const text = document.getElementById('scriptTextarea')?.value || '';
        if (useRegex) {
            let match;
            while ((match = searchRegex.exec(text)) !== null) {
                if (match[0].length === 0) { searchRegex.lastIndex++; continue; }
                searchEngine.matches.push({ start: match.index, end: match.index + match[0].length });
            }
        } else {
            let idx = text.indexOf(findStr);
            while (idx !== -1) {
                searchEngine.matches.push({ start: idx, end: idx + findStr.length });
                idx = text.indexOf(findStr, idx + findStr.length);
            }
        }
    } else {
        // 單句模式：計算所有標籤內的文字索引
        allLabelsOrdered.forEach(label => {
            const text = sentenceTextMap[label] || '';
            if (useRegex) {
                searchRegex.lastIndex = 0;
                let match;
                while ((match = searchRegex.exec(text)) !== null) {
                    if (match[0].length === 0) { searchRegex.lastIndex++; continue; }
                    searchEngine.matches.push({ label, start: match.index, end: match.index + match[0].length });
                }
            } else {
                let idx = text.indexOf(findStr);
                while (idx !== -1) {
                    searchEngine.matches.push({ label, start: idx, end: idx + findStr.length });
                    idx = text.indexOf(findStr, idx + findStr.length);
                }
            }
        });
    }

    if (searchEngine.currentIndex >= searchEngine.matches.length) searchEngine.currentIndex = Math.max(0, searchEngine.matches.length - 1);
    else if (searchEngine.currentIndex === -1 && searchEngine.matches.length > 0) searchEngine.currentIndex = 0;

    renderHighlights();
}

// 核心：在畫面上塗上黃色與橘色高亮
function renderHighlights() {
    if (!searchEngine.query || searchEngine.matches.length === 0) {
        searchMatchCount.style.display = 'none';
        clearAllHighlights();
        return;
    }

    searchMatchCount.style.display = 'block';
    searchMatchCount.textContent = `${searchEngine.currentIndex + 1}/${searchEngine.matches.length}`;
    clearAllHighlights(); 

    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
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
            const display = itemDiv?.querySelector('.sentence-text-display');
            if (!display) continue;
            
            const text = sentenceTextMap[label] || '';
            let html = ''; let lastIdx = 0;
            
            labelMatches[label].forEach(m => {
                html += escapeHtml(text.substring(lastIdx, m.start));
                const markClass = m.globalIdx === searchEngine.currentIndex ? 'list-mark active' : 'list-mark';
                html += `<mark class="${markClass}">${escapeHtml(text.substring(m.start, m.end))}</mark>`;
                lastIdx = m.end;
            });
            html += escapeHtml(text.substring(lastIdx));
            display.innerHTML = html;
        }
    }
}

// 清除所有高亮痕跡 (保護原始資料)
function clearAllHighlights() {
    if (searchEngine && searchEngine.matches) {
        // 使用 Set 來排除重複的標籤 (因為一句話可能有多個關鍵字)
        const affectedLabels = new Set(searchEngine.matches.map(m => m.label));
        
        affectedLabels.forEach(label => {
            if (!label) return; // 劇本模式沒有 label
            const display = document.querySelector(`#item-${label} .sentence-text-display`);
            if (display) {
                // 直接從原始資料還原文字，消除 <mark>
                display.textContent = sentenceTextMap[label] || '';
            }
        });
    }
    
    // 處理劇本模式的背景
    const backdrop = document.getElementById('scriptBackdrop');
    if (backdrop) backdrop.innerHTML = '';
}

function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// 捲動並選取目標
function scrollToCurrentMatch() {
    if (searchEngine.currentIndex === -1 || searchEngine.matches.length === 0) return;
    const match = searchEngine.matches[searchEngine.currentIndex];
    
    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
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

// 單步取代
replaceSingleBtn?.addEventListener('click', () => {
    if (searchEngine.matches.length === 0 || searchEngine.currentIndex === -1) return;
    const replaceStr = replaceTextInput.value;
    if (typeof saveState === 'function') saveState();

    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
        const match = searchEngine.matches[searchEngine.currentIndex];
        const textarea = document.getElementById('scriptTextarea');
        const text = textarea.value;
        textarea.value = text.substring(0, match.start) + replaceStr + text.substring(match.end);
        if (typeof renderGutterAndSyncData === 'function') renderGutterAndSyncData();
    } else {
        const match = searchEngine.matches[searchEngine.currentIndex];
        let text = sentenceTextMap[match.label] || '';
        text = text.substring(0, match.start) + replaceStr + text.substring(match.end);
        sentenceTextMap[match.label] = text;
        const itemDiv = document.getElementById(`item-${match.label}`);
        if (itemDiv) { 
            itemDiv.querySelector('.sentence-text-display').textContent = text; 
            itemDiv.dataset.rawText = text; 
        }
        
        // ★ 效能優化：精準只更新這一個聲波圖標記的文字
        if (typeof updateRegionTextDisplay === 'function') {
            updateRegionTextDisplay(match.label, text);
        }
        
        saveToStorage();
    }
    updateSearchMatches(); scrollToCurrentMatch();
});

// 全部取代
batchReplaceConfirmBtn?.addEventListener('click', () => {
    if (searchEngine.matches.length === 0) return;
    const replaceStr = replaceTextInput.value;
    if (typeof saveState === 'function') saveState();
    let count = searchEngine.matches.length;

    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
        const textarea = document.getElementById('scriptTextarea');
        let text = textarea.value; let offset = 0;
        searchEngine.matches.forEach(m => {
            text = text.substring(0, m.start + offset) + replaceStr + text.substring(m.end + offset);
            offset += replaceStr.length - (m.end - m.start);
        });
        textarea.value = text;
        if (typeof renderGutterAndSyncData === 'function') renderGutterAndSyncData();
    } else {
        const labelOffsetMap = {};
        const affectedLabels = new Set(); // ★ 使用 Set 收集受影響的標籤，自動排除重複

        searchEngine.matches.forEach(m => {
            if (!labelOffsetMap[m.label]) labelOffsetMap[m.label] = 0;
            let text = sentenceTextMap[m.label];
            const offset = labelOffsetMap[m.label];
            text = text.substring(0, m.start + offset) + replaceStr + text.substring(m.end + offset);
            sentenceTextMap[m.label] = text;
            labelOffsetMap[m.label] += replaceStr.length - (m.end - m.start);
            
            const itemDiv = document.getElementById(`item-${m.label}`);
            if (itemDiv) { 
                itemDiv.querySelector('.sentence-text-display').textContent = text; 
                itemDiv.dataset.rawText = text; 
            }
            affectedLabels.add(m.label); // 記錄被修改過的句子
        });
        
        // ★ 效能優化：批次精準更新聲波圖文字，每句最多只更新一次
        affectedLabels.forEach(label => {
            if (typeof updateRegionTextDisplay === 'function') {
                updateRegionTextDisplay(label, sentenceTextMap[label]);
            }
        });

        saveToStorage();
    }
    showToast(`替換完成！共替換了 ${count} 處。`, 'success');
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


// ================= ★ 全新設計：模組化匯出引擎 ★ =================
const openExportModalBtn = document.getElementById('openExportModalBtn');
const exportModalOverlay = document.getElementById('exportModalOverlay');
const closeExportModalBtn = document.getElementById('closeExportModalBtn');
const modalOutputArea = document.getElementById('modalOutputArea');
const exportTextFormatSelect = document.getElementById('exportTextFormatSelect');

// 開啟與關閉視窗 (保留文字不清空，讓使用者方便回頭複製)
openExportModalBtn?.addEventListener('click', () => {
    exportModalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden'; 
});
closeExportModalBtn?.addEventListener('click', () => {
    exportModalOverlay.classList.remove('show');
    document.body.style.overflow = ''; 
});

// 1. 各格式產生器 (Generators)
function generateTSV() {
    if (allLabelsOrdered.length === 0) { showToast('目前沒有資料', 'error'); return ""; }
    let content = "標籤\t開始時間\t結束時間\t文字內容\n";
    allLabelsOrdered.forEach(label => {
        const times = getCalculatedTimes(label);
        const text = sentenceTextMap[label] || "";
        if (times) content += `${label}\t${times.start}\t${times.end !== null ? times.end : ''}\t${text}\n`;
        else content += `${label}\t\t\t${text}\n`;
    });
    return content;
}

function generateSRT() {
    const validLabels = allLabelsOrdered.filter(lbl => timeDataMap[lbl] !== undefined);
    if (validLabels.length === 0) { showToast('沒有時間標記', 'error'); return ""; }
    let content = ""; let srtIndex = 1;
    validLabels.forEach(label => {
        const times = getCalculatedTimes(label);
        const text = sentenceTextMap[label] || "";
        if (times && times.end !== null) {
            content += `${srtIndex}\n${formatSrtTime(times.start)} --> ${formatSrtTime(times.end)}\n${text}\n\n`;
            srtIndex++;
        }
    });
    return content;
}

function generateAudacity() {
    const validLabels = allLabelsOrdered.filter(lbl => timeDataMap[lbl] !== undefined);
    if (validLabels.length === 0) { showToast('沒有時間標記', 'error'); return ""; }
    let content = "";
    validLabels.forEach(label => {
        const times = getCalculatedTimes(label);
        const text = sentenceTextMap[label] || "";
        if (times) content += `${times.start}\t${times.end !== null ? times.end : times.start}\t${text || label}\n`;
    });
    return content;
}

function generateJSON() {
    const projectData = {
        version: "1.0",
        title: localStorage.getItem('tagger_projectTitle') || document.getElementById('mainTitleDisplay')?.textContent || "",
        audioUrl: localStorage.getItem('tagger_audioUrl') || "",
        localFileName: localStorage.getItem('tagger_localFileName') || "",
        rawText: document.getElementById('rawTextInput')?.value || "",
        allLabelsOrdered: allLabelsOrdered,
        sentenceTextMap: sentenceTextMap,
        timeDataMap: timeDataMap,
        settings: { currentParseMode: currentParseMode, currentSortMode: currentSortMode }
    };
    return JSON.stringify(projectData, null, 2);
}

function getProjectFilename(ext) {
    const currentTitle = localStorage.getItem('tagger_projectTitle') || document.getElementById('mainTitleDisplay')?.textContent || "烏衣行打點專案";
    return `${currentTitle.trim()}.${ext}`;
}

function downloadExportFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

// 2. 上方直接下載按鈕綁定
document.getElementById('exportTsvBtn')?.addEventListener('click', () => {
    const content = generateTSV();
    if(content) { downloadExportFile(content, getProjectFilename('tsv')); showToast('TSV 下載成功！', 'success'); }
});
document.getElementById('exportSrtBtn')?.addEventListener('click', () => {
    const content = generateSRT();
    if(content) { downloadExportFile(content, getProjectFilename('srt')); showToast('SRT 下載成功！', 'success'); }
});
document.getElementById('exportAudacityBtn')?.addEventListener('click', () => {
    const content = generateAudacity();
    if(content) { downloadExportFile(content, getProjectFilename('txt')); showToast('Audacity 標籤下載成功！', 'success'); }
});
document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
    const content = generateJSON();
    if(content) { downloadExportFile(content, getProjectFilename('json'), 'application/json'); showToast('JSON 專案下載成功！', 'success'); }
});
document.getElementById('exportAudioZipBtn')?.addEventListener('click', () => closeExportModalBtn.click());


// 3. 下方產生純文字預覽邏輯
document.getElementById('exportTextBtn')?.addEventListener('click', () => {
    const format = exportTextFormatSelect.value;
    let result = "";

    if (format === 'tsv') result = generateTSV();
    else if (format === 'srt') result = generateSRT();
    else if (format === 'audacity') result = generateAudacity();
    else if (format === 'json') result = generateJSON();
    else {
        // 處理一般文字排版 (沿用原本 executeExportText 的邏輯)
        if (allLabelsOrdered.length === 0) return showToast('目前沒有任何句子！', 'error');
        let paragraphs = []; let currentLetter = ''; let currentPara = [];
        allLabelsOrdered.forEach(label => {
            const letter = label.charAt(0);
            if (letter !== currentLetter) { if (currentPara.length > 0) paragraphs.push(currentPara); currentLetter = letter; currentPara = []; }
            currentPara.push(label);
        });
        if (currentPara.length > 0) paragraphs.push(currentPara);

        if (format === 'para') result = paragraphs.map(para => para.map(label => sentenceTextMap[label] || '').join('')).join('\n');
        else if (format === 'para-slash-n') result = paragraphs.map(para => para.map(label => sentenceTextMap[label] || '').join('')).join('\\n');
        else if (format === 'sent-no-para') result = allLabelsOrdered.map(label => sentenceTextMap[label] || '').join('\n');
        else if (format === 'sent-empty-line') result = paragraphs.map(para => para.map(label => sentenceTextMap[label] || '').join('\n')).join('\n\n');
        else if (format === 'sent-hash') {
            const outLines = []; paragraphs.forEach(para => { outLines.push('######'); para.forEach(label => outLines.push(sentenceTextMap[label] || '')); outLines.push('######'); });
            result = outLines.join('\n');
        }
    }

    if (result && modalOutputArea) {
        modalOutputArea.value = result;
        showToast('已產生文字預覽', 'success');
    }
});

// 下載目前文字框內的內容
document.getElementById('downloadTextFileBtn')?.addEventListener('click', () => {
    const content = modalOutputArea?.value;
    if (!content) return showToast('請先產生或輸入文字', 'error');
    
    const format = exportTextFormatSelect.value;
    let ext = 'txt';
    if (format === 'tsv') ext = 'tsv';
    else if (format === 'srt') ext = 'srt';
    else if (format === 'json') ext = 'json';
    
    downloadExportFile(content, getProjectFilename(ext));
    showToast(`檔案已下載 (.${ext})`, 'success');
});

// 一鍵複製與清除邏輯
document.getElementById('modalCopyExportBtn')?.addEventListener('click', () => {
    if (!modalOutputArea || !modalOutputArea.value) return showToast('沒有內容可以複製', 'error');
    navigator.clipboard.writeText(modalOutputArea.value).then(() => showToast('已複製全部文字！', 'success'));
});
document.getElementById('modalClearExportBtn')?.addEventListener('click', () => {
    if (modalOutputArea) modalOutputArea.value = '';
    showToast('文字已清除', 'normal');
});
// =========================================================================
// ================= ★ 終極修復：切換單句/全文模式 ★ =================
// 使用 cloneNode 技巧，徹底洗掉舊的、會互相打架的幽靈監聽器！
const oldToggleBtn = document.getElementById('toggleScriptModeBtn');
if (oldToggleBtn) {
    const newToggleBtn = oldToggleBtn.cloneNode(true);
    oldToggleBtn.parentNode.replaceChild(newToggleBtn, oldToggleBtn);

    newToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        
        isScriptMode = !isScriptMode;
        
        // 點擊後自動關閉檢視選單
        document.getElementById('viewMenu')?.classList.remove('show');
        
        // ★ 取得列表標題容器，準備動態調整底線
        const listHeaderContainer = document.getElementById('listHeaderContainer');
        
        if (isScriptMode) {
            // 【切換為全文大編輯框】
            document.getElementById('sentenceList').style.display = 'none';
            document.getElementById('scriptEditorContainer').style.display = 'flex';
            
            // ★ 隱藏標題底線，解決雙重線條的視覺干擾
            if (listHeaderContainer) listHeaderContainer.style.borderBottom = 'none';
            
            if (typeof saveState === 'function') saveState(); 
            if (typeof populateScriptEditor === 'function') populateScriptEditor();
            showToast('已切換為：全文模式 (劇本)', 'success');

            // 隱藏不支援的選單項目
            const toHide = ['sortMenuToggleBtn', 'timeDisplayToggleBtn', 'clearAllTagsBtn', 'btnMenuContainer', 'mergeSelectedBtn'];
            toHide.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; });
            
        } else {
            // 【切換回單句列表】
            document.getElementById('sentenceList').style.display = 'flex';
            document.getElementById('scriptEditorContainer').style.display = 'none';
            
            // ★ 恢復標題的淺藍色底線
            if (listHeaderContainer) listHeaderContainer.style.borderBottom = '2px solid #E0F2F1';
            
            if (typeof renderSentenceList === 'function') renderSentenceList();
            showToast('已切換為：單句模式 (列表)', 'normal');

            // 恢復所有選單項目
            const toShow = ['sortMenuToggleBtn', 'timeDisplayToggleBtn', 'clearAllTagsBtn'];
            toShow.forEach(id => { if(document.getElementById(id)) document.getElementById(id).style.display = 'flex'; });
            if (document.getElementById('btnMenuContainer')) document.getElementById('btnMenuContainer').style.display = 'inline-block';
        }
        
        // UI 外觀 (鎖定/解鎖) 連動
        const scriptTextarea = document.getElementById('scriptTextarea');
        const editorContainer = document.getElementById('scriptEditorContainer');
        if (isScriptMode) {
            if (scriptTextarea) scriptTextarea.readOnly = !isEditMode;
            if (editorContainer) editorContainer.style.background = isEditMode ? '#ffffff' : '#f8f9fa';
        }

        // 核心修復：切換模式後，給予 100ms 讓畫面排版完成，然後執行追蹤與高亮
        setTimeout(() => {
            // 1. 強制重新掃描搜尋高亮
            if (typeof updateSearchMatches === 'function') {
                updateSearchMatches();
            }

            // 2. 視角錨點追蹤 (View Tracking)
            if (currentActiveLabel) {
                if (isScriptMode) {
                    // 【單句 -> 全文】：捲動大編輯框，讓目標行號出現在視野中
                    const targetGutter = document.getElementById(`gutter-${currentActiveLabel}`);
                    if (targetGutter && scriptTextarea) {
                        // 將捲動軸移至該行，減去 40px 的緩衝空間避免貼齊頂部太有壓迫感
                        scriptTextarea.scrollTop = targetGutter.offsetTop - 40;
                        
                        // 將透明高亮背板同步捲動
                        const backdrop = document.getElementById('scriptBackdrop');
                        if (backdrop) backdrop.scrollTop = scriptTextarea.scrollTop;
                    }
                } else {
                    // 【全文 -> 單句】：讓網頁捲動到對應的句子區塊
                    const itemDiv = document.getElementById(`item-${currentActiveLabel}`);
                    if (itemDiv && typeof smartScrollTo === 'function') {
                        smartScrollTo(itemDiv);
                    }
                }
            }
            
            // 3. 確保如果正在搜尋，跳回當前的搜尋目標
            if (typeof scrollToCurrentMatch === 'function') {
                scrollToCurrentMatch();
            }
        }, 100);
    });
}

// ================= ★ 全新：三大清除與刪除功能模組 (防幽靈事件版) ★ =================

// 實用小工具：清除按鈕上所有舊的幽靈事件，再綁定新事件 (絕對不會跳兩次視窗)
function cleanAndBindEvent(btnId, callback) {
    const oldBtn = document.getElementById(btnId);
    if (oldBtn) {
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
        newBtn.addEventListener('click', callback);
    }
}

// 1. 清除時間標記 (自動判斷是否刪除空行)
cleanAndBindEvent('clearTimeTagsBtn', () => {
    document.getElementById('editMenu')?.classList.remove('show');
    if (Object.keys(timeDataMap).length === 0) return showToast('目前沒有時間資料', 'error');
    
    showCustomDialog({
        title: '清除時間標記',
        message: '確定要清除所有時間標記嗎？<br><br><span style="color:#666; font-size:0.9em;">(列表與聲波上的標記皆會清除。<strong style="color:#C62828;">若列表句子無文字，將會一併刪除該列</strong>)</span>',
        onConfirm: () => {
            if (typeof saveState === 'function') saveState(); 
            
            // 清除聲波區塊
            if (typeof wavesurfer !== 'undefined' && wavesurfer && wavesurfer.regions) {
                wavesurfer.regions.clear(); 
            }

            let rowDeleted = false;
            const labelsToProcess = [...allLabelsOrdered]; 
            
            labelsToProcess.forEach(label => {
                const text = sentenceTextMap[label] || '';
                
                // 條件 A：沒有文字 -> 連同標記整列刪除
                if (text.trim() === '') {
                    const idx = allLabelsOrdered.indexOf(label);
                    if (idx > -1) {
                        allLabelsOrdered.splice(idx, 1);
                        delete sentenceTextMap[label];
                        delete timeDataMap[label];
                        rowDeleted = true;
                    }
                } 
                // 條件 B：有文字 -> 保留該列，只清除時間
                else {
                    if (timeDataMap[label]) {
                        delete timeDataMap[label];
                    }
                }
            });

            // 如果有刪除整列，呼叫重新排號並重繪畫面
            if (rowDeleted && typeof reassignLabels === 'function') {
                reassignLabels(); 
            } else {
                saveToStorage();
                if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
                if (typeof renderSentenceList === 'function') renderSentenceList();
            }
            
            showToast('已清除時間標記', 'success');
        }
    });
});

// 2. 清空列表文字 (保留時間)
cleanAndBindEvent('clearListTextBtn', () => {
    document.getElementById('editMenu')?.classList.remove('show');
    if (allLabelsOrdered.length === 0) return showToast('目前沒有資料', 'error');
    
    showCustomDialog({
        title: '清空列表文字',
        message: '確定要清空列表文字嗎？<br><br><span style="color:#666; font-size:0.9em;">(將會清空所有句子的文字內容，但會<strong style="color:#00897B;">完全保留您的時間標記與聲波區塊</strong>)</span>',
        onConfirm: () => {
            if (typeof saveState === 'function') saveState();
            
            sentenceTextMap = {};
            allLabelsOrdered.forEach(label => { sentenceTextMap[label] = ""; });
            
            saveToStorage();
            if (typeof renderSentenceList === 'function') renderSentenceList();
            if (typeof populateScriptEditor === 'function' && typeof isScriptMode !== 'undefined' && isScriptMode) {
                populateScriptEditor();
            }
            showToast('已清空列表文字', 'success');
        }
    });
});

// 3. 刪除列表與標記 (徹底重置)
cleanAndBindEvent('deleteAllDataBtn', () => {
    document.getElementById('editMenu')?.classList.remove('show');
    if (allLabelsOrdered.length === 0 && Object.keys(timeDataMap).length === 0) return showToast('目前沒有資料', 'error');
    
    showCustomDialog({
        title: '刪除列表與標記',
        message: '<span style="color:#C62828; font-weight:bold; font-size:1.1em;">⚠️ 嚴重警告</span><br><br>確定要刪除整個列表與標記嗎？<br><br>這將會徹底清空您的文字、時間數據與聲波標記，讓專案回到最初的空白狀態！',
        confirmText: '確定刪除',
        onConfirm: () => {
            if (typeof saveState === 'function') saveState();
            
            timeDataMap = {};
            sentenceTextMap = {};
            allLabelsOrdered = [];
            
            if (typeof wavesurfer !== 'undefined' && wavesurfer && wavesurfer.regions) {
                wavesurfer.regions.clear();
            }
            
            localStorage.removeItem('tagger_allLabels');
            localStorage.removeItem('tagger_textMap');
            localStorage.removeItem('tagger_timeDataMap');
            
            saveToStorage();
            if (typeof renderSentenceList === 'function') renderSentenceList();
            if (typeof checkButtonVisibility === 'function') checkButtonVisibility();
            
            if (typeof isScriptMode !== 'undefined' && isScriptMode) {
                document.getElementById('toggleScriptModeBtn')?.click();
            }
            
            showToast('已徹底刪除列表與標記', 'success');
        }
    });
});
// =========================================================================
// ================= ★ 新增：聲波圖顯示文字與字數設定 ★ =================
const showRegionTextCheck = document.getElementById('showRegionTextCheck');
const regionTextLengthInput = document.getElementById('regionTextLengthInput');
const regionTextLengthBlock = document.getElementById('regionTextLengthBlock');

// 1. 讀取儲存的設定 (預設為不顯示，字數預設為 4)
window.showRegionText = localStorage.getItem('tagger_showRegionText') === 'true';
window.regionTextLength = parseInt(localStorage.getItem('tagger_regionTextLength'));
if (isNaN(window.regionTextLength)) window.regionTextLength = 4;

if (showRegionTextCheck && regionTextLengthInput) {
    // 2. 初始化介面狀態
    showRegionTextCheck.checked = window.showRegionText;
    regionTextLengthInput.value = window.regionTextLength;
    if (regionTextLengthBlock) regionTextLengthBlock.style.display = window.showRegionText ? 'block' : 'none';

    // 3. 監聽開關改變
    showRegionTextCheck.addEventListener('change', (e) => {
        window.showRegionText = e.target.checked;
        localStorage.setItem('tagger_showRegionText', window.showRegionText ? 'true' : 'false');
        if (regionTextLengthBlock) regionTextLengthBlock.style.display = window.showRegionText ? 'block' : 'none';
        
        // 即時重新繪製聲波圖標記
        if (typeof renderAllRegions === 'function') renderAllRegions();
    });

    // 4. 監聽字數改變
    regionTextLengthInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value) || 0;
        if (val < 0) val = 0; // 防止負數
        window.regionTextLength = val;
        e.target.value = val;
        localStorage.setItem('tagger_regionTextLength', window.regionTextLength);
        
        // 即時重新繪製聲波圖標記
        if (typeof renderAllRegions === 'function') renderAllRegions();
    });
}


// ================= ★ 新增：列表編號顯示方式 (顯示映射引擎) ★ =================
const labelDisplayModeSelect = document.getElementById('labelDisplayModeSelect');
const continuousLabelSettings = document.getElementById('continuousLabelSettings');
const labelPrefixInput = document.getElementById('labelPrefixInput');
const labelStartNumInput = document.getElementById('labelStartNumInput');
const labelDigitsSelect = document.getElementById('labelDigitsSelect');

// 1. 讀取儲存的設定
window.labelDisplayMode = localStorage.getItem('tagger_labelMode') || 'default';
window.labelPrefix = localStorage.getItem('tagger_labelPrefix') || '';
window.labelStartNum = parseInt(localStorage.getItem('tagger_labelStartNum'));
if (isNaN(window.labelStartNum)) window.labelStartNum = 1;
window.labelDigits = parseInt(localStorage.getItem('tagger_labelDigits'));
if (isNaN(window.labelDigits)) window.labelDigits = 3;

// 2. 核心翻譯函式：負責把 A01 轉換成使用者設定的格式
window.getDisplayLabel = function(originalLabel) {
    if (window.labelDisplayMode !== 'continuous') return originalLabel;
    
    // 取得該句子在所有資料中的絕對順序
    const index = allLabelsOrdered.indexOf(originalLabel);
    if (index === -1) return originalLabel; // 防呆
    
    // 計算連續數字並補零
    const num = window.labelStartNum + index;
    const numStr = String(num).padStart(window.labelDigits, '0');
    return `${window.labelPrefix}${numStr}`;
};

// 3. 極致優化的即時更新引擎 (不重新繪製 DOM，只替換文字)
window.refreshAllDisplayLabels = function() {
    // 更新單句列表
    document.querySelectorAll('.sentence-item').forEach(item => {
        const label = item.id.replace('item-', '');
        const labelSpan = item.querySelector('.sentence-label');
        if (labelSpan) labelSpan.textContent = window.getDisplayLabel(label);
    });
    
    // 更新劇本模式行號
    document.querySelectorAll('.gutter-line:not(.para)').forEach(el => {
        const label = el.dataset.label;
        if (label) el.textContent = window.getDisplayLabel(label);
    });

    // 更新聲波圖上的標籤
    allLabelsOrdered.forEach(label => {
        const rawText = sentenceTextMap[label] || '';
        if (typeof updateRegionTextDisplay === 'function') {
            updateRegionTextDisplay(label, rawText);
        }
    });
};

if (labelDisplayModeSelect) {
    // 綁定介面初始值
    labelDisplayModeSelect.value = window.labelDisplayMode;
    labelPrefixInput.value = window.labelPrefix;
    labelStartNumInput.value = window.labelStartNum;
    labelDigitsSelect.value = window.labelDigits;
    continuousLabelSettings.style.display = window.labelDisplayMode === 'continuous' ? 'block' : 'none';

    // 監聽各種設定改變，並呼叫即時更新引擎
    labelDisplayModeSelect.addEventListener('change', (e) => {
        window.labelDisplayMode = e.target.value;
        localStorage.setItem('tagger_labelMode', window.labelDisplayMode);
        continuousLabelSettings.style.display = window.labelDisplayMode === 'continuous' ? 'block' : 'none';
        window.refreshAllDisplayLabels();
    });

    labelPrefixInput.addEventListener('input', (e) => {
        window.labelPrefix = e.target.value;
        localStorage.setItem('tagger_labelPrefix', window.labelPrefix);
        window.refreshAllDisplayLabels();
    });

    labelStartNumInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 0) val = 1;
        window.labelStartNum = val;
        e.target.value = val;
        localStorage.setItem('tagger_labelStartNum', window.labelStartNum);
        window.refreshAllDisplayLabels();
    });

    labelDigitsSelect.addEventListener('change', (e) => {
        window.labelDigits = parseInt(e.target.value);
        localStorage.setItem('tagger_labelDigits', window.labelDigits);
        window.refreshAllDisplayLabels();
    });
}

// ================= ★ 新增：刪除音訊與匯出完整音訊事件 ★ =================

// 1. 綁定刪除音訊事件 (聲波圖右上角的「三個點」更多選單內)
document.getElementById('waveCutAudioBtn')?.addEventListener('click', () => {
    const waveMoreMenu = document.getElementById('waveMoreMenu');
    if (waveMoreMenu) waveMoreMenu.classList.remove('show');
    
    if (!tempRegion) {
        return showToast('請先用滑鼠在聲波圖上框選要刪除的範圍 (藍色框)', 'error');
    }
    
    showCustomDialog({
        title: '刪除音檔區段',
        message: `<span style="color:#C62828; font-weight:bold;">警告：此動作會修改原始音檔！</span><br><br>系統將會刪除您選取的這段聲音，並將後方所有的聲音與標記<strong style="color:#00897B;">自動往前平移遞補</strong>。<br><br>確定要執行嗎？`,
        onConfirm: () => {
            if (typeof cutAudioRegion === 'function') {
                cutAudioRegion(tempRegion.start, tempRegion.end);
            }
        }
    });
});

// 2. 綁定匯出完整音檔事件
document.getElementById('exportFullAudioBtn')?.addEventListener('click', () => {
    if (!audioPlayer || !audioPlayer.duration) return showToast('沒有可匯出的音檔', 'error');
    if (typeof downloadTimeRangeAudio === 'function') {
        // 利用既有的下載引擎，範圍設定為 0 到音檔總長度
        downloadTimeRangeAudio(0, audioPlayer.duration, "完整音檔");
    }
});

// ================= ★ 新增：一鍵錨點對齊與平移引擎 ★ =================
window.syncToPlayheadAndShift = function(label) {
    if (!audioPlayer || !audioPlayer.src) return showToast('請先載入音檔', 'error');
    if (!timeDataMap[label]) return showToast('此句尚未標記時間', 'error');

    // 1. 取得目標游標時間與原始時間，計算誤差值 (Offset)
    const currentTime = audioPlayer.currentTime;
    const originalStart = typeof timeDataMap[label] === 'object' ? timeDataMap[label].start : timeDataMap[label];
    const offset = currentTime - originalStart;

    if (Math.abs(offset) < 0.005) return showToast('游標與標記時間幾乎相同，無需平移', 'normal');

    const offsetSec = parseFloat(offset.toFixed(3));

    // 2. 彈出確認視窗，讓使用者知道即將平移多少時間
    showCustomDialog({
        title: '對齊游標並平移後續',
        message: `將以此句為基準，自動與目前的游標時間對齊。<br><br>計算出的時間差為：<strong style="color:#00897B;">${offsetSec > 0 ? '+' : ''}${offsetSec} 秒</strong><br><br>此句與<strong style="color:#C62828;">後方所有的時間標記</strong>都會同步平移此秒數。確定執行嗎？`,
        onConfirm: () => {
            if (typeof saveState === 'function') saveState(); // 紀錄 Undo 狀態

            const startIndex = allLabelsOrdered.indexOf(label);
            let modifiedCount = 0;

            // 3. 骨牌式平移：更新該句與後面所有句子的時間
            for (let i = startIndex; i < allLabelsOrdered.length; i++) {
                const curLabel = allLabelsOrdered[i];
                if (timeDataMap[curLabel] !== undefined) {
                    let newStart = (typeof timeDataMap[curLabel] === 'object' ? timeDataMap[curLabel].start : timeDataMap[curLabel]) + offset;
                    if (newStart < 0) newStart = 0; 
                    
                    let newEnd = (typeof timeDataMap[curLabel] === 'object' && timeDataMap[curLabel].end !== null) 
                        ? Math.max(0, timeDataMap[curLabel].end + offset) 
                        : null;
                    
                    timeDataMap[curLabel] = { 
                        start: parseFloat(newStart.toFixed(3)), 
                        end: newEnd !== null ? parseFloat(newEnd.toFixed(3)) : null 
                    };
                    modifiedCount++;
                }
            }

            // 4. 存檔並重繪畫面
            saveToStorage();
            if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
            if (typeof renderAllRegions === 'function') renderAllRegions();
            showToast(`成功對齊！共平移了 ${modifiedCount} 句`, 'success');
        }
    });
};