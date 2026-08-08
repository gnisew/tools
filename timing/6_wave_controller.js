// ================= 6_wave_controller.js: 聲波圖與高精度播放核心 =================
window.lastToggleTime = 0; // 防連點雙擊計時器

function applyCurrentPlaybackSpeed() { 
    const speedDisplay = document.getElementById('speedDisplay');
    const speedText = speedDisplay ? speedDisplay.textContent.replace('x', '') : '1.0';
    const speed = parseFloat(speedText); 
    
    audioPlayer.playbackRate = speed; 
    if (wavesurfer) wavesurfer.setPlaybackRate(speed); 
}

// 全域跳轉保護鎖，防止時間差導致誤判暫停
window.jumpLockTime = 0; 

function togglePlayPause() {
    // 1. 防呆檢查：確認是否有載入有效音檔
    if (!audioPlayer || !audioPlayer.src || audioPlayer.src === window.location.href) {
        if (typeof showToast === 'function') showToast('請先載入音檔再進行播放喔！', 'error');
        return;
    }
    if (audioPlayer.readyState === 0) {
        if (typeof showToast === 'function') showToast('音檔正在載入或解碼中，請稍候...', 'normal');
        return;
    }

    const now = Date.now();
    if (now - window.lastToggleTime < 200) return;
    window.lastToggleTime = now;

    // 優先以 WaveSurfer 的狀態為主
    const wsAvailable = (typeof wavesurfer !== 'undefined' && wavesurfer);
    const isCurrentlyPlaying = wsAvailable ? wavesurfer.isPlaying() : !audioPlayer.paused;

    if (isCurrentlyPlaying) {
        if (wsAvailable) wavesurfer.pause();
        else audioPlayer.pause();
        verifyEndTime = null;
        isContinuousSortedPlay = false;
        return;
    }

    if (typeof applyCurrentPlaybackSpeed === 'function') applyCurrentPlaybackSpeed();

    // ★ 終極修正：直接讀取畫面上的 UI 選單，杜絕變數錯亂
    const modeSelect = document.getElementById('playbackModeSelect');
    const realMode = modeSelect ? modeSelect.value : (typeof playbackMode !== 'undefined' ? playbackMode : 'continuous');

    const currentT = audioPlayer.currentTime;
    const duration = audioPlayer.duration || 0;

    let targetStart = null;
    let targetEnd = null;
    let targetLabel = null;
    let willSetContinuousSorted = false;
    let jumpTo = null;

    // =========================================================
    // 模式 A：單句 / 區段播放模式 (播完即停)
    // =========================================================
    if (realMode === 'single') {
        if (typeof tempRegion !== 'undefined' && tempRegion !== null) {
            targetStart = tempRegion.start;
            targetEnd = tempRegion.end;
        } else {
            const labelsToPlay = (typeof selectedLabels !== 'undefined' && selectedLabels.length > 0) 
                ? selectedLabels : (currentActiveLabel ? [currentActiveLabel] : []);
            
            if (labelsToPlay.length > 0) {
                let minStart = Infinity; let maxEnd = 0;
                labelsToPlay.forEach(label => {
                    const times = getCalculatedTimes(label);
                    if (times) {
                        minStart = Math.min(minStart, times.start);
                        maxEnd = Math.max(maxEnd, times.end !== null ? times.end : (minStart + 1));
                    }
                });
                if (minStart !== Infinity) {
                    targetStart = minStart;
                    targetEnd = maxEnd;
                    targetLabel = labelsToPlay.length === 1 ? labelsToPlay[0] : null;
                }
            }
        }
        
        if (targetStart !== null) {
            // 如果游標不在範圍內，或已經在結尾了，跳回開頭
            if (currentT < targetStart || currentT >= targetEnd - 0.05) jumpTo = targetStart;
            verifyEndTime = targetEnd;
        }

    // =========================================================
    // 模式 B：連續播放模式 (播到底)
    // =========================================================
    } else {
        if (typeof tempRegion !== 'undefined' && tempRegion !== null) {
            // 有藍色選取框時，優先播放框內範圍並暫停
            targetStart = tempRegion.start;
            targetEnd = tempRegion.end;
            if (currentT < targetStart || currentT >= targetEnd - 0.05) jumpTo = targetStart;
            verifyEndTime = targetEnd;
        } else {
            // 檢查是否開啟了「略過無標記片段」
            const skipSelect = document.getElementById('continuousPlayModeSelect');
            const skipMode = skipSelect ? skipSelect.value : (typeof continuousPlayMode !== 'undefined' ? continuousPlayMode : 'normal');
            
            if (skipMode === 'skip' && currentActiveLabel && timeDataMap[currentActiveLabel]) {
                const times = getCalculatedTimes(currentActiveLabel);
                if (times) {
                    targetStart = Math.max(0, times.start - (typeof playPadding !== 'undefined' ? playPadding : 0.2));
                    targetEnd = times.end !== null ? times.end : duration;
                    targetLabel = currentActiveLabel;
                    willSetContinuousSorted = true;
                    if (currentT < targetStart || currentT >= targetEnd - 0.05) jumpTo = targetStart;
                    verifyEndTime = targetEnd;
                }
            } else {
                // ★ 最純粹的一般連續播放：絕對不會被暫停！
                if (duration && currentT >= duration - 0.1) jumpTo = 0; // 如果播到底了，才回到 0
                verifyEndTime = null; // 設定為 null，系統巡邏迴圈就會無視它，順暢播到底！
            }
        }
    }

    // ★ 最大播放秒數限制檢查
    if (verifyEndTime !== null && document.getElementById('enableMaxPlayCheck')?.checked) {
        const maxSec = parseFloat(document.getElementById('maxPlaySecondsInput')?.value) || 2;
        const startRef = targetStart !== null ? targetStart : currentT;
        verifyEndTime = Math.min(verifyEndTime, startRef + maxSec);
    }

    verifyingLabel = targetLabel;
    isContinuousSortedPlay = willSetContinuousSorted;

    // 如果需要跳轉，先跳轉，並上「時間保護鎖」
    if (jumpTo !== null) {
        window.jumpLockTime = Date.now();
        if (wsAvailable) wavesurfer.setTime(jumpTo);
        else audioPlayer.currentTime = jumpTo;
    }

    // 延遲 50 毫秒執行播放，確保瀏覽器時間已確實更新
    setTimeout(() => {
        const playPromise = wsAvailable ? wavesurfer.play() : audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => { if (err.name !== 'AbortError') console.warn("播放器保護機制:", err); });
        }
    }, 50);

    if (document.activeElement === playPauseBtn) playPauseBtn.blur();
}


function precisionLoop() {
    if (!audioPlayer || audioPlayer.paused) return;
    
    // 防護 1：剛下達跳轉指令的 300 毫秒內，不進行暫停判定
    if (Date.now() - (window.jumpLockTime || 0) < 300) {
        precisionRafId = requestAnimationFrame(precisionLoop);
        return;
    }

    // 防護 2：瀏覽器原生正在緩衝跳轉中
    if (audioPlayer.seeking) {
        precisionRafId = requestAnimationFrame(precisionLoop);
        return;
    }

    const currentT = audioPlayer.currentTime;
    const wsAvailable = (typeof wavesurfer !== 'undefined' && wavesurfer);

    // ★ 只有當 verifyEndTime 不是 null 時，才會觸發自動暫停或切換句子的邏輯
    if (verifyEndTime !== null && currentT >= verifyEndTime) {
        
        if (typeof loopMode !== 'undefined' && loopMode === 'single' && verifyingLabel) {
            if (typeof loopCount !== 'undefined' && (loopCount === 0 || currentLoopCounter < loopCount)) {
                if (loopCount > 0) currentLoopCounter++; 
                const times = getCalculatedTimes(verifyingLabel);
                if (times) {
                    window.jumpLockTime = Date.now();
                    const jumpTo = Math.max(0, times.start - (typeof playPadding !== 'undefined' ? playPadding : 0.2));
                    if (wsAvailable) wavesurfer.setTime(jumpTo); else audioPlayer.currentTime = jumpTo;
                    precisionRafId = requestAnimationFrame(precisionLoop);
                    return; 
                }
            } else {
                if (typeof currentLoopCounter !== 'undefined') currentLoopCounter = 0; 
            }
        }

        if (isContinuousSortedPlay && verifyingLabel) {
            const currentIndex = currentSortedLabels.indexOf(verifyingLabel);
            if (currentIndex !== -1 && currentIndex + 1 < currentSortedLabels.length) {
                let nextLabel = null; let nextTimes = null;
                for (let i = currentIndex + 1; i < currentSortedLabels.length; i++) {
                    const tempLabel = currentSortedLabels[i];
                    const tempTimes = getCalculatedTimes(tempLabel);
                    if (tempTimes) { nextLabel = tempLabel; nextTimes = tempTimes; break; }
                }

                if (nextTimes) {
                    if (typeof currentLoopCounter !== 'undefined') currentLoopCounter = 0; 
                    window.jumpLockTime = Date.now();
                    const jumpTo = Math.max(0, nextTimes.start - (typeof playPadding !== 'undefined' ? playPadding : 0.2));
                    if (wsAvailable) wavesurfer.setTime(jumpTo); else audioPlayer.currentTime = jumpTo;
                    
                    verifyEndTime = nextTimes.end;
                    verifyingLabel = nextLabel;
                    currentActiveLabel = nextLabel;
                    if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
                    const nextItemDiv = document.getElementById(`item-${nextLabel}`);
                    if (nextItemDiv && typeof smartScrollTo === 'function') smartScrollTo(nextItemDiv); 
                    precisionRafId = requestAnimationFrame(precisionLoop);
                    return; 
                }
            }
        }
        
        if (typeof currentLoopCounter !== 'undefined') currentLoopCounter = 0; 
        
        // 觸發暫停
        if (wsAvailable) wavesurfer.pause(); else audioPlayer.pause(); 
        if (wsAvailable) wavesurfer.setTime(verifyEndTime); else audioPlayer.currentTime = verifyEndTime; 
        
        const finalLabel = verifyingLabel;
        verifyEndTime = null; 
        isContinuousSortedPlay = false; 
        
        if (finalLabel) { 
            const currentItemDiv = document.getElementById(`item-${finalLabel}`); 
            if (currentItemDiv && currentSortMode === 'default') {
                if (typeof isScriptMode !== 'undefined' && isScriptMode) {
                    if (typeof snapWaveformToTop === 'function') setTimeout(snapWaveformToTop, 50);
                } else {
                    if(typeof smartScrollTo === 'function') smartScrollTo(currentItemDiv.nextElementSibling); 
                }
            }
            verifyingLabel = null; 
        }
        return;
    }
    
    precisionRafId = requestAnimationFrame(precisionLoop);
}

playPauseBtn.addEventListener('click', (e) => { if(e && e.currentTarget) e.currentTarget.blur(); togglePlayPause(); });
stopBtn.addEventListener('click', (e) => { if(e && e.currentTarget) e.currentTarget.blur(); verifyEndTime = null; audioPlayer.pause(); audioPlayer.currentTime = 0; if(wavesurfer) wavesurfer.seekTo(0); });
document.getElementById('rewindBtn').addEventListener('click', (e) => { if(e && e.currentTarget) e.currentTarget.blur(); verifyEndTime = null; audioPlayer.currentTime -= 2; });
document.getElementById('forwardBtn').addEventListener('click', (e) => { if(e && e.currentTarget) e.currentTarget.blur(); verifyEndTime = null; audioPlayer.currentTime += 2; });

// =========== 移除原本對 locateCurrentBtn 的圖示更新 ============
audioPlayer.addEventListener('play', () => { 
    if(playPauseBtn) playPauseBtn.querySelector('.material-icons').textContent = 'pause'; 
    if (precisionRafId) cancelAnimationFrame(precisionRafId);
    precisionRafId = requestAnimationFrame(precisionLoop);
});

audioPlayer.addEventListener('pause', () => { 
    if(playPauseBtn) playPauseBtn.querySelector('.material-icons').textContent = 'play_arrow'; 
    if (precisionRafId) cancelAnimationFrame(precisionRafId);
});



function updateZoom(value) {
    if (!wavesurfer) return;
    let numValue;
    if (value === 'fit') {
        const containerWidth = document.getElementById('waveform').clientWidth;
        numValue = audioPlayer.duration ? containerWidth / audioPlayer.duration : 10;
        zoomDisplay.textContent = '適應';
    } else {
        numValue = Number(value);
        zoomDisplay.textContent = Math.round(numValue) + 'x';
    }
    
    numValue = Math.max(1, Math.min(200, numValue));
    if (zoomSlider && value !== 'fit') zoomSlider.value = numValue;
    
    if (zoomPresetSelect) {
        const presetOptions = ['fit', '10', '50', '100', '200'];
        if (presetOptions.includes(String(value))) { zoomPresetSelect.value = String(value); } 
        else { zoomPresetSelect.value = 'custom'; }
    }
    wavesurfer.zoom(numValue);
}

zoomSlider?.addEventListener('input', (e) => updateZoom(e.target.value));
zoomPresetSelect?.addEventListener('change', (e) => updateZoom(e.target.value));
zoomOutBtn?.addEventListener('click', () => updateZoom(Math.max(1, Number(zoomSlider.value) - 10)));
zoomInBtn?.addEventListener('click', () => updateZoom(Math.min(200, Number(zoomSlider.value) + 10)));

let renderRegionsTimeout = null;

function renderAllRegions() {
    if (!wsRegions) return;
    
    // 等待音檔就緒保護鎖
    if (!wavesurfer || !audioPlayer || !audioPlayer.duration || audioPlayer.duration < 0.1) return;

    clearTimeout(renderRegionsTimeout);
    
    renderRegionsTimeout = setTimeout(() => {
        isRendering = true; 
        wsRegions.clearRegions();
        
        if (tempRegion) {
            tempRegion = wsRegions.addRegion({ start: tempRegion.start, end: tempRegion.end, color: 'rgba(33, 150, 243, 0.3)', drag: isEditMode, resize: isEditMode });
        }
        
        allLabelsOrdered.forEach((label, idx) => {
			const times = getCalculatedTimes(label, idx);
			if (times && timeDataMap[label]) {
                const contentEl = document.createElement('div'); 
     
                 const displayLabel = typeof window.getDisplayLabel === 'function' ? window.getDisplayLabel(label) : label;
                 let displayText = displayLabel;

	         if (typeof window.showRegionText !== 'undefined' && window.showRegionText) {
                     let rawText = sentenceTextMap[label] || '';
                     if (rawText.trim() !== '') {
                         let textArray = Array.from(rawText.trim());
                         let limit = window.regionTextLength;
                         let snippet = (limit === 0) ? rawText.trim() : textArray.slice(0, limit).join('');
                         displayText = `${displayLabel} ${snippet}`;
                     }
                 }

                contentEl.textContent = displayText; 
                contentEl.style.fontWeight = 'bold'; 
                contentEl.style.color = '#00695C'; 
                contentEl.style.fontSize = '0.8rem'; 
                contentEl.style.textShadow = '1px 1px 0px white, -1px -1px 0px white, 1px -1px 0px white, -1px 1px 0px white, 0px 0px 3px rgba(255,255,255,0.8)'; 
                contentEl.style.pointerEvents = 'none'; 
                
                contentEl.style.maxWidth = 'calc(100% - 8px)';
                contentEl.style.whiteSpace = 'nowrap';
                contentEl.style.overflow = 'hidden';
                contentEl.style.textOverflow = 'ellipsis';
                
                contentEl.style.position = 'sticky';
                contentEl.style.left = '4px';  
                contentEl.style.top = '2px';
                contentEl.style.display = 'inline-block';
                contentEl.style.zIndex = '10'; 
                
                let regionColor = 'rgba(0, 137, 123, 0.1)';
                if (selectedLabels.includes(label)) regionColor = 'rgba(25, 118, 210, 0.25)';
                else if (label === currentActiveLabel) regionColor = 'rgba(255, 112, 67, 0.15)';

                wsRegions.addRegion({ id: label, start: times.start, end: times.end, content: contentEl, color: regionColor, drag: isEditMode, resize: isEditMode });
            }
        });
        isRendering = false;
    }, 100); // 結束計時器區塊
}

// ================= ★ 新增：即時更新單一標記文字 (搭配防抖) ★ =================
window.updateRegionTextDisplay = function(label, rawText) {
    if (!wsRegions) return;

    // 從 WaveSurfer 中找出對應的標記區塊
    const targetRegion = wsRegions.getRegions().find(r => r.id === label);

    if (targetRegion && targetRegion.content) {
        // 1. 套用連續編號映射
        const displayLabel = typeof window.getDisplayLabel === 'function' ? window.getDisplayLabel(label) : label;
        let displayText = displayLabel;

        // 2. 處理文字與字數限制
        if (typeof window.showRegionText !== 'undefined' && window.showRegionText) {
            if (rawText && rawText.trim() !== '') {
                let textArray = Array.from(rawText.trim());
                let limit = window.regionTextLength;
                let snippet = (limit === 0) ? rawText.trim() : textArray.slice(0, limit).join('');
                displayText = `${displayLabel} ${snippet}`;
            }
        }
        
        targetRegion.content.textContent = displayText;
    }
};

function initWaveSurfer() {
    const warning = document.getElementById('missingAudioWarning');
    if (warning) warning.style.display = 'none';
    const waveform = document.getElementById('waveform');
    if (waveform) waveform.style.display = 'block';
    
    const compactControls = document.getElementById('compactControls');
    if (compactControls) {
        // ★ 核心修改 1：開始載入聲波前，先鎖定控制面板，防止誤觸
        compactControls.style.opacity = '0.5';
        compactControls.style.pointerEvents = 'none';
    }

    if (typeof wavesurfer !== 'undefined' && wavesurfer !== null) {
        // 載入新音檔前，先上鎖並清空舊標記
        isRendering = true;
        if (wsRegions) wsRegions.clearRegions();
        isRendering = false;
        
        wavesurfer.load(audioPlayer.src);
        return; 
    }
    
    document.getElementById('stickyPanel').style.display = 'block';
    document.getElementById('waveform').style.display = 'block'; 
    if (compactControls) compactControls.style.display = 'flex'; 
    
    wavesurfer = WaveSurfer.create({ 
        container: '#waveform', 
        waveColor: '#B2DFDB', 
        progressColor: '#00897B', 
        cursorColor: '#FF7043', 
        barWidth: 2, 
        height: currentWaveHeight,
        media: audioPlayer,
        autoScroll: true, 
        autoCenter: autoScrollMode === 'center',
    });

    const isMinimapEnabled = localStorage.getItem('tagger_enableMinimap') === 'true';
    if (typeof toggleMinimap === 'function') toggleMinimap(isMinimapEnabled);
    wsRegions = wavesurfer.registerPlugin(WaveSurfer.Regions.create());
    wsRegions.enableDragSelection({ color: 'rgba(33, 150, 243, 0.3)' });

    wsRegions.on('region-created', (region) => {
        if (isRendering) return; 
        if (tempRegion && tempRegion !== region) tempRegion.remove(); 
        region.setOptions({ color: 'rgba(33, 150, 243, 0.3)' }); 
        tempRegion = region;
        if(typeof updateToolbarButtons === 'function') updateToolbarButtons(); 
    });

    wsRegions.on('region-updated', (region) => {
        if (isRendering) return; 
        if (!audioPlayer || !audioPlayer.duration || audioPlayer.duration < 0.1) return; 

        if (region === tempRegion) return; 
        isDraggingRegion = true;
        
        const snapTolerance = 0.15; // 設定 0.15 秒的磁吸範圍
        let newStart = region.start;
        let newEnd = region.end;
        let snapped = false;

        const currentIndex = allLabelsOrdered.indexOf(region.id);
        
        // 1. 檢查左側：是否與上一句的結尾足夠靠近？
        if (currentIndex > 0) {
            const prevLabel = allLabelsOrdered[currentIndex - 1];
            if (timeDataMap[prevLabel]) {
                const prevEnd = typeof timeDataMap[prevLabel] === 'object' ? timeDataMap[prevLabel].end : null;
                if (prevEnd !== null && Math.abs(newStart - prevEnd) < snapTolerance) {
                    newStart = prevEnd; // 強制貼齊
                    snapped = true;
                }
            }
        }
        
        // 2. 檢查右側：是否與下一句的開頭足夠靠近？
        if (currentIndex !== -1 && currentIndex < allLabelsOrdered.length - 1) {
            const nextLabel = allLabelsOrdered[currentIndex + 1];
            if (timeDataMap[nextLabel]) {
                const nextStart = typeof timeDataMap[nextLabel] === 'object' ? timeDataMap[nextLabel].start : timeDataMap[nextLabel];
                if (nextStart !== null && Math.abs(newEnd - nextStart) < snapTolerance) {
                    newEnd = nextStart; // 強制貼齊
                    snapped = true;
                }
            }
        }

        // 若觸發磁吸，強制覆寫區域的畫面表現
        if (snapped) {
            region.setOptions({ start: newStart, end: newEnd });
        }
        if (timeDataMap[region.id]) {
            timeDataMap[region.id].start = parseFloat(region.start.toFixed(3)); 
            timeDataMap[region.id].end = parseFloat(region.end.toFixed(3));
            if(typeof updateSingleTimeDisplay === 'function') updateSingleTimeDisplay(region.id, currentIndex); 
            clearTimeout(regionDragTimeout); 
            regionDragTimeout = setTimeout(() => { isDraggingRegion = false; saveToStorage(); }, 500);
        }
    });

    wsRegions.on('region-clicked', (region, e) => {
        e.stopPropagation(); 
        if (region === tempRegion) return; 
        
        if (e.ctrlKey || e.metaKey) {
            if(typeof toggleSelection === 'function') toggleSelection(region.id);
            lastSelectedLabel = region.id; 
            return;
        } else if (e.shiftKey) {
            if(typeof selectRange === 'function') selectRange(lastSelectedLabel, region.id);
            return;
        }

        if(typeof clearSelection === 'function') clearSelection();
        currentActiveLabel = region.id; 
        lastSelectedLabel = region.id; 

        const itemDiv = document.getElementById(`item-${region.id}`);
        if(typeof updateSelectionUI === 'function') updateSelectionUI(); 
        
        if (itemDiv) { 
            let targetTime = region.start;
            if (wavesurfer && audioPlayer.duration) {
                const wrapper = wavesurfer.getWrapper();
                const rect = wrapper.getBoundingClientRect();
                const relativeX = (e.clientX - rect.left) / rect.width;
                const clickTime = relativeX * audioPlayer.duration;
                targetTime = Math.max(region.start, Math.min(clickTime, region.end));
            }

            if (typeof wavesurfer !== 'undefined' && wavesurfer) {
                wavesurfer.setTime(targetTime);
            } else {
                audioPlayer.currentTime = targetTime;
            }

            document.querySelectorAll('.sentence-item').forEach(el => el.classList.remove('playing')); 
            itemDiv.classList.add('playing'); 
            
            if (currentSortMode === 'default') {
                if (typeof isScriptMode !== 'undefined' && isScriptMode) {
                } else {
                    if(typeof smartScrollTo === 'function') smartScrollTo(itemDiv); 
                }
            }
        }
        
        if (typeof snapWaveformToTop === 'function') setTimeout(snapWaveformToTop, 50);
    });
    
    wavesurfer.on('click', (relativeX) => {
        const clickTime = relativeX * audioPlayer.duration;
        if (isShiftPressed && lastClickTime !== null) {
            if (tempRegion) tempRegion.remove();
            tempRegion = wsRegions.addRegion({ start: Math.min(lastClickTime, clickTime), end: Math.max(lastClickTime, clickTime), color: 'rgba(33, 150, 243, 0.3)', drag: true, resize: true });
        } else {
            if (tempRegion) { tempRegion.remove(); tempRegion = null; }
            currentActiveLabel = null;
            if(typeof clearSelection === 'function') clearSelection();
            if (wsRegions) wsRegions.getRegions().forEach(r => r.setOptions({ color: 'rgba(0, 137, 123, 0.1)' }));
            document.querySelectorAll('.sentence-item.playing').forEach(el => el.classList.remove('playing'));
        }
        lastClickTime = clickTime;
        if(typeof updateToolbarButtons === 'function') updateToolbarButtons(); 
        if (typeof snapWaveformToTop === 'function') snapWaveformToTop();
    });

    // ★ 核心修改 2：當聲波圖解碼完成、正式繪製出來時觸發
    wavesurfer.on('ready', () => { 
        applyCurrentPlaybackSpeed(); 
        if(typeof updateStickyOffsets === 'function') updateStickyOffsets(); 
        
        const elTot = document.getElementById('audioTimeTotal');
        if(elTot) elTot.textContent = formatTime(audioPlayer.duration); 
        
        renderAllRegions();
        if(typeof updateToolbarButtons === 'function') updateToolbarButtons(); 
        updateZoom(zoomPresetSelect ? zoomPresetSelect.value : 10);
        
        if(typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();

        // ★ 解鎖控制按鈕列
        if (compactControls) {
            compactControls.style.opacity = '1';
            compactControls.style.pointerEvents = 'auto';
        }

        // ★ 提示載入成功
        const audioType = localStorage.getItem('tagger_audioType');
        if (audioType === 'local') {
            showToast('本機音檔載入成功', 'success');
        } else if (audioType === 'online') {
            showToast('線上音檔載入成功', 'success');
        } else {
            showToast('音檔載入成功', 'success');
        }
    });
}

window.addEventListener('DOMContentLoaded', () => { 
    if (projectTitleInput) {
        projectTitleInput.value = localStorage.getItem('tagger_projectTitle') || '';
    }
    if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay();
    if(typeof loadFromStorage === 'function') loadFromStorage(); 
    if(typeof autoResizeRawText === 'function') autoResizeRawText();
    if(typeof updateStickyOffsets === 'function') setTimeout(updateStickyOffsets, 500); 
});

const waveformContainer = document.getElementById('waveform');

waveformContainer?.addEventListener('wheel', (e) => {
    if (!e.altKey && !e.shiftKey) return;
    
    e.preventDefault(); 
    if (!wavesurfer) return;

    if (e.shiftKey) {
        const wrapper = wavesurfer.getWrapper(); 
        let scrollContainer = wrapper;
        
        if (wrapper && wrapper.parentElement) {
            scrollContainer = wrapper.parentElement;
        }
        
        if (scrollContainer) {
            const scrollAmount = e.deltaX || e.deltaY;
            scrollContainer.scrollLeft += scrollAmount * 1.5; 
        }
    } else if (e.altKey) {
        let currentZoom = Number(zoomSlider.value);
        const zoomStep = 5; 
        const scrollAmount = e.deltaY || e.deltaX;
        
        if (scrollAmount < 0) {
            currentZoom = Math.min(200, currentZoom + zoomStep);
        } else {
            currentZoom = Math.max(1, currentZoom - zoomStep);
        }
        
        if(typeof updateZoom === 'function') updateZoom(currentZoom);
    }
}, { passive: false }); 

window.minimapPlugin = null; 

window.toggleMinimap = function(enable) {
    const container = document.getElementById('wave-minimap');
    if (!container) return;

    if (enable) {
        container.style.display = 'block';
        if (typeof wavesurfer !== 'undefined' && wavesurfer && !window.minimapPlugin) {
            window.minimapPlugin = wavesurfer.registerPlugin(WaveSurfer.Minimap.create({
                container: '#wave-minimap',
                height: 40,
                waveColor: '#B2DFDB',
                progressColor: '#00897B',
                cursorColor: '#00695C',
                cursorWidth: 2,
                overlay: true
            }));
        }
    } else {
        container.style.display = 'none';
        if (window.minimapPlugin) {
            window.minimapPlugin.destroy();
            window.minimapPlugin = null;
        }
        container.innerHTML = ''; 
    }

    if (typeof updateStickyOffsets === 'function') {
        setTimeout(updateStickyOffsets, 50);
    }
};









// ================= 時間顯示即時更新 =================
// 綁定原生音訊的時間更新事件，讓左下角的時間隨播放與點擊連動
if (audioPlayer) {
    audioPlayer.addEventListener('timeupdate', () => {
        const timeCurrentEl = document.getElementById('audioTimeCurrent');
        // 確保時間為有效數字，並使用 1_globals.js 中的 formatTime 轉換格式
        if (timeCurrentEl && !isNaN(audioPlayer.currentTime)) {
            timeCurrentEl.textContent = formatTime(audioPlayer.currentTime);
        }
    });
}