// ================= 6_wave_controller.js: 聲波圖與高精度播放核心 =================
window.lastToggleTime = 0; // 防連點雙擊計時器

function applyCurrentPlaybackSpeed() { 
    const speedDisplay = document.getElementById('speedDisplay');
    const speedText = speedDisplay ? speedDisplay.textContent.replace('x', '') : '1.0';
    const speed = parseFloat(speedText); 
    
    audioPlayer.playbackRate = speed; 
    if (wavesurfer) wavesurfer.setPlaybackRate(speed); 
}

// ★ 徹底重構：Space 鍵專屬的「一般播放」，不再強制跳轉游標
function togglePlayPause() {
    const now = Date.now();
    if (now - window.lastToggleTime < 200) return; 
    window.lastToggleTime = now;

    if (audioPlayer.paused) {
        let targetEnd = null;

        // 1. 若有啟用「限制最高播放秒數」
        if (document.getElementById('enableMaxPlayCheck')?.checked) {
            const maxSec = parseFloat(document.getElementById('maxPlaySecondsInput')?.value) || 2;
            targetEnd = audioPlayer.currentTime + maxSec;
        }

        // 2. 若啟用「略過無標記片段」
        if (continuousPlayMode === 'skip') {
            let activeLabel = null;
            for (let i = 0; i < allLabelsOrdered.length; i++) {
                const label = allLabelsOrdered[i];
                if (timeDataMap[label]) {
                    const times = getCalculatedTimes(label);
                    if (audioPlayer.currentTime >= times.start && audioPlayer.currentTime < times.end) {
                        activeLabel = label; break;
                    }
                }
            }
            if (activeLabel) {
                const times = getCalculatedTimes(activeLabel);
                targetEnd = targetEnd ? Math.min(targetEnd, times.end) : times.end;
                verifyingLabel = activeLabel;
                isContinuousSortedPlay = true;
            } else {
                verifyingLabel = null;
                isContinuousSortedPlay = false;
            }
        } else {
            verifyingLabel = null;
            isContinuousSortedPlay = false;
        }

        verifyEndTime = targetEnd;

        const playPromise = audioPlayer.play();
        if (playPromise !== undefined) playPromise.catch(err => { if (err.name !== 'AbortError') console.warn(err); });
    } else { 
        audioPlayer.pause(); 
    }

    if (document.activeElement === playPauseBtn) playPauseBtn.blur();
}

playPauseBtn.addEventListener('click', (e) => { if(e) e.preventDefault(); if(e && e.currentTarget) e.currentTarget.blur(); togglePlayPause(); });
stopBtn.addEventListener('click', (e) => { if(e) e.preventDefault(); if(e && e.currentTarget) e.currentTarget.blur(); verifyEndTime = null; audioPlayer.pause(); audioPlayer.currentTime = 0; if(wavesurfer) wavesurfer.seekTo(0); });
document.getElementById('rewindBtn').addEventListener('click', (e) => { if(e) e.preventDefault(); if(e && e.currentTarget) e.currentTarget.blur(); verifyEndTime = null; audioPlayer.currentTime -= 2; });
document.getElementById('forwardBtn').addEventListener('click', (e) => { if(e) e.preventDefault(); if(e && e.currentTarget) e.currentTarget.blur(); verifyEndTime = null; audioPlayer.currentTime += 2; });

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
    const warning = document.getElementById('missingAudioWarning');
    if (warning) warning.style.display = 'none';
    const waveform = document.getElementById('waveform');
    if (waveform) waveform.style.display = 'block';
    const compactControls = document.getElementById('compactControls');
    if (compactControls) {
        compactControls.style.opacity = '1';
        compactControls.style.pointerEvents = 'auto';
    }

    if (typeof wavesurfer !== 'undefined' && wavesurfer !== null) {
        wavesurfer.load(audioPlayer.src);
        return; 
    }
    
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
                
                const relativeX = (e.clientX - rect.left) / rect.width;
                const clickTime = relativeX * audioPlayer.duration;
                
                audioPlayer.currentTime = Math.max(region.start, Math.min(clickTime, region.end));
            } else {
                audioPlayer.currentTime = region.start;
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

    wavesurfer.on('ready', () => { 
        applyCurrentPlaybackSpeed(); 
        if(typeof updateStickyOffsets === 'function') updateStickyOffsets(); 
        
        const elTot = document.getElementById('audioTimeTotal');
        if(elTot) elTot.textContent = formatTime(audioPlayer.duration); 
        
        renderAllRegions();
        if(typeof updateToolbarButtons === 'function') updateToolbarButtons(); 
        updateZoom(zoomPresetSelect ? zoomPresetSelect.value : 10);
        
        if(typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
    });
}

function precisionLoop() {
    if (audioPlayer.paused) return;
    
    // ★ 終極防護 6：當音訊正在跳轉 (seeking) 時，暫停所有煞車判斷，避免讀取到舊的 currentTime 導致誤觸暫停
    if (audioPlayer.seeking) {
        precisionRafId = requestAnimationFrame(precisionLoop);
        return;
    }

    const currentT = audioPlayer.currentTime;
    if (verifyEndTime !== null && currentT >= verifyEndTime) {
        
        if (loopMode === 'single' && verifyingLabel) {
            if (loopCount === 0 || currentLoopCounter < loopCount) {
                if (loopCount > 0) currentLoopCounter++; 
                const times = getCalculatedTimes(verifyingLabel);
                if (times) {
                    audioPlayer.currentTime = Math.max(0, times.start - playPadding);
                    precisionRafId = requestAnimationFrame(precisionLoop);
                    return; 
                }
            } else {
                currentLoopCounter = 0; 
            }
        }

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
                    currentLoopCounter = 0; 
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
            
            if (loopMode === 'all') {
                if (loopCount === 0 || currentLoopCounter < loopCount) {
                    if (loopCount > 0) currentLoopCounter++;
                    
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
                    currentLoopCounter = 0; 
                }
            }
        }
        
        currentLoopCounter = 0; 
        audioPlayer.pause(); 
        audioPlayer.currentTime = verifyEndTime; 
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

audioPlayer.addEventListener('play', () => { 
    if(playPauseBtn) playPauseBtn.querySelector('.material-icons').textContent = 'pause'; 
    const locateBtn = document.getElementById('locateCurrentBtn');
    if (locateBtn) locateBtn.querySelector('.material-icons').textContent = 'pause_circle';

    if (precisionRafId) cancelAnimationFrame(precisionRafId);
    precisionRafId = requestAnimationFrame(precisionLoop);
});

audioPlayer.addEventListener('pause', () => { 
    if(playPauseBtn) playPauseBtn.querySelector('.material-icons').textContent = 'play_arrow'; 
    const locateBtn = document.getElementById('locateCurrentBtn');
    if (locateBtn) locateBtn.querySelector('.material-icons').textContent = 'play_circle';

    if (precisionRafId) cancelAnimationFrame(precisionRafId);
});

audioPlayer.addEventListener('timeupdate', () => {
    const currentT = audioPlayer.currentTime;
    if(audioPlayer.duration) {
        const elCurr = document.getElementById('audioTimeCurrent');
        const elTot = document.getElementById('audioTimeTotal');
        if (elCurr) elCurr.textContent = formatTime(currentT);
        if (elTot) elTot.textContent = formatTime(audioPlayer.duration);
    }
    
    let activeLabel = null;
    for (let i = 0; i < allLabelsOrdered.length; i++) {
        const label = allLabelsOrdered[i]; if(timeDataMap[label] === undefined) continue;
        const times = getCalculatedTimes(label); if (currentT >= times.start && currentT < times.end) { activeLabel = label; break; }
    }
    
    if (activeLabel && activeLabel !== currentActiveLabel) {
        currentActiveLabel = activeLabel;
        if(typeof updateToolbarButtons === 'function') updateToolbarButtons();
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
                    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
                    } else {
                        const rect = item.getBoundingClientRect(); 
                        const headerHeight = (stickyPanel ? stickyPanel.offsetHeight : 0) + (listHeaderContainer ? listHeaderContainer.offsetHeight : 0); 
                        if (rect.top < headerHeight || rect.bottom > window.innerHeight - 50) {
                            if(typeof smartScrollTo === 'function') smartScrollTo(item); 
                        }
                    }
                }
            }
        } else {
            item.classList.remove('playing');
        }
    });
    if (isScriptMode && scriptGutter && activeLabel) {
        document.querySelectorAll('.gutter-line').forEach(el => el.classList.remove('active'));
        
        const activeGutterEl = document.getElementById(`gutter-${activeLabel}`);
        if (activeGutterEl) {
            activeGutterEl.classList.add('active'); 
            
            const scrollTarget = activeGutterEl.offsetTop - 100; 
            scriptTextarea.scrollTo({ top: scrollTarget, behavior: 'smooth' });
        }
    }
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