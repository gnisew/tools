// ================= 6_wave_controller.js: 聲波圖與高精度播放核心 =================
function applyCurrentPlaybackSpeed() { 
    // 改為從新的按鈕文字中讀取速度數值 (移除 'x' 符號)
    const speedDisplay = document.getElementById('speedDisplay');
    const speedText = speedDisplay ? speedDisplay.textContent.replace('x', '') : '1.0';
    const speed = parseFloat(speedText); 
    
    audioPlayer.playbackRate = speed; 
    if (wavesurfer) wavesurfer.setPlaybackRate(speed); 
}

function togglePlayPause() {
    if (audioPlayer.paused) {
        if (tempRegion) {
            if (audioPlayer.currentTime < tempRegion.start || audioPlayer.currentTime >= tempRegion.end) { audioPlayer.currentTime = tempRegion.start; }
            verifyEndTime = tempRegion.end; verifyingLabel = null; 
            isContinuousSortedPlay = false; 
        } else if ((currentSortMode !== 'default' || continuousPlayMode === 'skip') && currentActiveLabel && timeDataMap[currentActiveLabel]) {
            const times = getCalculatedTimes(currentActiveLabel);
            if (audioPlayer.currentTime < times.start || audioPlayer.currentTime >= times.end) {
                // 加入前置緩衝
                audioPlayer.currentTime = Math.max(0, times.start - playPadding);
            }
            verifyEndTime = times.end;
            verifyingLabel = currentActiveLabel;
            isContinuousSortedPlay = true; 
        }
        audioPlayer.play();
    } else { audioPlayer.pause(); }
}

playPauseBtn.addEventListener('click', () => { togglePlayPause(); });
stopBtn.addEventListener('click', () => { audioPlayer.pause(); audioPlayer.currentTime = 0; if(wavesurfer) wavesurfer.seekTo(0); });
document.getElementById('rewindBtn').addEventListener('click', () => { audioPlayer.currentTime -= 2; });
document.getElementById('forwardBtn').addEventListener('click', () => { audioPlayer.currentTime += 2; });

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

function renderAllRegions() {
    if (!wsRegions) return;
    isRendering = true; wsRegions.clearRegions();
    if (tempRegion) tempRegion = wsRegions.addRegion({ start: tempRegion.start, end: tempRegion.end, color: 'rgba(33, 150, 243, 0.3)', drag: isEditMode, resize: isEditMode });
    
    allLabelsOrdered.forEach(label => {
        const times = getCalculatedTimes(label);
        if (times && timeDataMap[label]) { 
            const contentEl = document.createElement('div'); 
            contentEl.textContent = label; 
            contentEl.style.fontWeight = 'bold'; 
            contentEl.style.color = '#00695C'; 
            contentEl.style.fontSize = '0.8rem'; 
            contentEl.style.textShadow = '1px 1px 0px white, -1px -1px 0px white, 1px -1px 0px white, -1px 1px 0px white, 0px 0px 3px rgba(255,255,255,0.8)'; 
            contentEl.style.pointerEvents = 'none'; 
            contentEl.style.whiteSpace = 'nowrap';
            contentEl.style.overflow = 'hidden';
            contentEl.style.textOverflow = 'ellipsis';
            contentEl.style.position = 'absolute';
            contentEl.style.top = '2px';
            contentEl.style.left = '4px';  
            contentEl.style.width = 'calc(100% - 8px)';
            contentEl.style.boxSizing = 'border-box';
            
            let regionColor = 'rgba(0, 137, 123, 0.1)';
            if (selectedLabels.includes(label)) regionColor = 'rgba(25, 118, 210, 0.25)';
            else if (label === currentActiveLabel) regionColor = 'rgba(255, 112, 67, 0.15)';

            wsRegions.addRegion({ id: label, start: times.start, end: times.end, content: contentEl, color: regionColor, drag: isEditMode, resize: isEditMode });
        }
    });
    isRendering = false;
}

function initWaveSurfer() {
    if (wavesurfer) wavesurfer.destroy();
    document.getElementById('stickyPanel').style.display = 'block';
    document.getElementById('waveform').style.display = 'block'; compactControls.style.display = 'flex'; 
    wavesurfer = WaveSurfer.create({ 
        container: '#waveform', 
        waveColor: '#B2DFDB', 
        progressColor: '#00897B', 
        cursorColor: '#FF7043', 
        barWidth: 2, 
        height: currentWaveHeight,
        media: audioPlayer,
        autoScroll: true, 
        autoCenter: autoScrollMode === 'center' 
    });
    wsRegions = wavesurfer.registerPlugin(WaveSurfer.Regions.create());
    wsRegions.enableDragSelection({ color: 'rgba(33, 150, 243, 0.3)' });

    wsRegions.on('region-created', (region) => {
        if (isRendering) return; 
        if (tempRegion && tempRegion !== region) tempRegion.remove(); 
        region.setOptions({ color: 'rgba(33, 150, 243, 0.3)' }); 
        tempRegion = region;
        updateToolbarButtons(); 
    });

    wsRegions.on('region-updated', (region) => {
        if (region === tempRegion) return; 
        isDraggingRegion = true;
        if (timeDataMap[region.id]) {
            timeDataMap[region.id].start = parseFloat(region.start.toFixed(3)); 
            timeDataMap[region.id].end = parseFloat(region.end.toFixed(3));
            if(typeof updateSingleTimeDisplay === 'function') updateSingleTimeDisplay(region.id); 
            clearTimeout(regionDragTimeout); regionDragTimeout = setTimeout(() => { isDraggingRegion = false; saveToStorage(); }, 500);
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
            if (wavesurfer && audioPlayer.duration) {
                const wrapper = wavesurfer.getWrapper();
                const rect = wrapper.getBoundingClientRect();
                
                // 計算點擊位置 X 座標佔整個聲波圖的比例
                const relativeX = (e.clientX - rect.left) / rect.width;
                const clickTime = relativeX * audioPlayer.duration;
                
                // 設定播放時間，並使用 Math.max 與 Math.min 確保點擊邊緣時不會超出區塊範圍
                audioPlayer.currentTime = Math.max(region.start, Math.min(clickTime, region.end));
            } else {
                // 備用方案：如果無法取得座標，則退回原先的區塊開頭
                audioPlayer.currentTime = region.start;
            }

            document.querySelectorAll('.sentence-item').forEach(el => el.classList.remove('playing')); 
            itemDiv.classList.add('playing'); 
            if (currentSortMode === 'default') {
                if(typeof smartScrollTo === 'function') smartScrollTo(itemDiv); 
            }
        }
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
        updateToolbarButtons(); 
    });

    wavesurfer.on('ready', () => { 
        applyCurrentPlaybackSpeed(); 
        if(typeof updateStickyOffsets === 'function') updateStickyOffsets(); 
        audioTimeDisplay.textContent = `0:00 / ${formatTime(audioPlayer.duration)}`; 
        renderAllRegions(); 
        updateToolbarButtons(); 
        updateZoom(zoomPresetSelect ? zoomPresetSelect.value : 10);
        
        if(typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
    });
}

function precisionLoop() {
    if (audioPlayer.paused) return;
    
    const currentT = audioPlayer.currentTime;
    if (verifyEndTime !== null && currentT >= verifyEndTime) {
        
        // ===============================================================
        // 1. 單句循環 (Single Loop)
        // ===============================================================
        if (loopMode === 'single' && verifyingLabel) {
            if (loopCount === 0 || currentLoopCounter < loopCount) {
                if (loopCount > 0) currentLoopCounter++; // 只有非無限循環才增加計數
                const times = getCalculatedTimes(verifyingLabel);
                if (times) {
                    audioPlayer.currentTime = Math.max(0, times.start - playPadding);
                    precisionRafId = requestAnimationFrame(precisionLoop);
                    return; 
                }
            } else {
                currentLoopCounter = 0; // 次數到達，重置計數並允許程式往下執行
            }
        }

        // ===============================================================
        // 2. 尋找下一句 (Continuous Play / Skip Silence)
        // ===============================================================
        if (isContinuousSortedPlay && verifyingLabel) {
            const currentIndex = currentSortedLabels.indexOf(verifyingLabel);
            if (currentIndex !== -1 && currentIndex + 1 < currentSortedLabels.length) {
                
                let nextLabel = null;
                let nextTimes = null;
                for (let i = currentIndex + 1; i < currentSortedLabels.length; i++) {
                    const tempLabel = currentSortedLabels[i];
                    const tempTimes = getCalculatedTimes(tempLabel);
                    if (tempTimes) {
                        nextLabel = tempLabel;
                        nextTimes = tempTimes;
                        break; 
                    }
                }

                if (nextTimes) {
                    currentLoopCounter = 0; // 成功切換下一句時，循環計數歸零
                    audioPlayer.currentTime = Math.max(0, nextTimes.start - playPadding);
                    verifyEndTime = nextTimes.end;
                    verifyingLabel = nextLabel;
                    currentActiveLabel = nextLabel;
                    if(typeof updateToolbarButtons === 'function') updateToolbarButtons();
                    
                    const nextItemDiv = document.getElementById(`item-${nextLabel}`);
                    if (nextItemDiv && typeof smartScrollTo === 'function') smartScrollTo(nextItemDiv); 
                    precisionRafId = requestAnimationFrame(precisionLoop);
                    return; 
                }
            }
            
            // ===============================================================
            // 3. 全部循環 (All Loop) - 當找不到下一句 (代表列表到底了)
            // ===============================================================
            if (loopMode === 'all') {
                if (loopCount === 0 || currentLoopCounter < loopCount) {
                    if (loopCount > 0) currentLoopCounter++;
                    
                    // 尋找列表中的「第一句有標記的時間」
                    let firstLabel = null;
                    let firstTimes = null;
                    for (let i = 0; i < currentSortedLabels.length; i++) {
                        const tempLabel = currentSortedLabels[i];
                        const tempTimes = getCalculatedTimes(tempLabel);
                        if (tempTimes) {
                            firstLabel = tempLabel;
                            firstTimes = tempTimes;
                            break; 
                        }
                    }

                    if (firstTimes) {
                        audioPlayer.currentTime = Math.max(0, firstTimes.start - playPadding);
                        verifyEndTime = firstTimes.end;
                        verifyingLabel = firstLabel;
                        currentActiveLabel = firstLabel;
                        if(typeof updateToolbarButtons === 'function') updateToolbarButtons();
                        
                        const firstItemDiv = document.getElementById(`item-${firstLabel}`);
                        if (firstItemDiv && typeof smartScrollTo === 'function') smartScrollTo(firstItemDiv); 
                        precisionRafId = requestAnimationFrame(precisionLoop);
                        return;
                    }
                } else {
                    currentLoopCounter = 0; // 列表循環次數達成
                }
            }
        }
        
        // ===============================================================
        // 4. 停止播放 (重置所有狀態)
        // ===============================================================
        currentLoopCounter = 0; 
        audioPlayer.pause(); 
        audioPlayer.currentTime = verifyEndTime; 
        const finalLabel = verifyingLabel;
        verifyEndTime = null; 
        isContinuousSortedPlay = false; 
        
        if (finalLabel) { 
            const currentItemDiv = document.getElementById(`item-${finalLabel}`); 
            if (currentItemDiv && currentSortMode === 'default') {
                if(typeof smartScrollTo === 'function') smartScrollTo(currentItemDiv.nextElementSibling); 
            }
            verifyingLabel = null; 
        }
        return; 
    }
    precisionRafId = requestAnimationFrame(precisionLoop);
}

audioPlayer.addEventListener('play', () => { 
    playPauseBtn.querySelector('.material-icons').textContent = 'pause'; 
    if (precisionRafId) cancelAnimationFrame(precisionRafId);
    precisionRafId = requestAnimationFrame(precisionLoop);
});

audioPlayer.addEventListener('pause', () => { 
    playPauseBtn.querySelector('.material-icons').textContent = 'play_arrow'; 
    if (precisionRafId) cancelAnimationFrame(precisionRafId);
});

audioPlayer.addEventListener('timeupdate', () => {
    const currentT = audioPlayer.currentTime;
    if(audioPlayer.duration) audioTimeDisplay.textContent = `${formatTime(currentT)} / ${formatTime(audioPlayer.duration)}`;
    
    let activeLabel = null;
    for (let i = 0; i < allLabelsOrdered.length; i++) {
        const label = allLabelsOrdered[i]; if(timeDataMap[label] === undefined) continue;
        const times = getCalculatedTimes(label); if (currentT >= times.start && currentT < times.end) { activeLabel = label; break; }
    }
    
    if (activeLabel && activeLabel !== currentActiveLabel) {
        currentActiveLabel = activeLabel;
        updateToolbarButtons();
    }

    if (wsRegions) { 
        wsRegions.getRegions().forEach(region => { 
            if (region !== tempRegion) {
                if (selectedLabels.includes(region.id)) {
                    region.setOptions({ color: 'rgba(25, 118, 210, 0.25)' });
                } else if (region.id === currentActiveLabel) {
                    region.setOptions({ color: 'rgba(255, 112, 67, 0.15)' });
                } else {
                    region.setOptions({ color: 'rgba(0, 137, 123, 0.1)' });
                }
            }
        }); 
    }
    
    document.querySelectorAll('.sentence-item').forEach(item => {
        if (item.id.replace('item-', '') === activeLabel) {
            if (!item.classList.contains('playing')) { 
                item.classList.add('playing'); 
                if (currentSortMode === 'default') {
                    const rect = item.getBoundingClientRect(); 
                    const headerHeight = (stickyPanel ? stickyPanel.offsetHeight : 0) + (listHeaderContainer ? listHeaderContainer.offsetHeight : 0); 
                    if (rect.top < headerHeight || rect.bottom > window.innerHeight - 50) {
                        if(typeof smartScrollTo === 'function') smartScrollTo(item); 
                    }
                }
            }
        } else {
            item.classList.remove('playing');
        }
    });
});

window.addEventListener('DOMContentLoaded', () => { 
    if (projectTitleInput) {
        projectTitleInput.value = localStorage.getItem('tagger_projectTitle') || '';
    }
    if(typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay();
    if(typeof loadFromStorage === 'function') loadFromStorage(); 
    if(typeof autoResizeRawText === 'function') autoResizeRawText();
    if(typeof updateStickyOffsets === 'function') setTimeout(updateStickyOffsets, 500); 
});





// ================= 終極優化：進階聲波圖滾輪控制 (Alt=Zoom, Shift=Pan) =================
const waveformContainer = document.getElementById('waveform');

waveformContainer?.addEventListener('wheel', (e) => {
    // 如果沒有按 Alt 或 Shift，完全放行，讓網頁順暢上下捲動
    if (!e.altKey && !e.shiftKey) return;
    
    // 有按組合鍵時，才攔截瀏覽器預設行為
    e.preventDefault(); 
    
    if (!wavesurfer) return;

    if (e.shiftKey) {
        // ==========================================
        // 模式 A：Shift + 滾輪 -> 左右平移時間軸 (Pan)
        // ==========================================
        const wrapper = wavesurfer.getWrapper(); 
        let scrollContainer = wrapper;
        
        // 終極解謎：WaveSurfer 7 真正的捲軸其實是 wrapper 的「父元素」！
        if (wrapper && wrapper.parentElement) {
            scrollContainer = wrapper.parentElement;
        }
        
        if (scrollContainer) {
            // 完美相容所有瀏覽器與作業系統的滾動訊號
            const scrollAmount = e.deltaX || e.deltaY;
            
            // 執行左右捲動 (乘上 1.5 增加滑鼠手感與順暢度)
            scrollContainer.scrollLeft += scrollAmount * 1.5; 
        }
    } else if (e.altKey) {
        // ==========================================
        // 模式 B：Alt + 滾輪 -> 放大縮小聲波圖 (Zoom)
        // ==========================================
        let currentZoom = Number(zoomSlider.value);
        const zoomStep = 5; 
        
        const scrollAmount = e.deltaY || e.deltaX;
        
        if (scrollAmount < 0) {
            // 往上滾：放大
            currentZoom = Math.min(200, currentZoom + zoomStep);
        } else {
            // 往下滾：縮小
            currentZoom = Math.max(1, currentZoom - zoomStep);
        }
        
        if(typeof updateZoom === 'function') updateZoom(currentZoom);
    }
}, { passive: false }); 
// =========================================================================