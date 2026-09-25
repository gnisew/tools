// ================= 4c_ui_scroll.js: 捲動與定位控制、智慧捲動與自動置中引擎 =================
// 本檔案由 4_ui_events.js 拆分而來（原始第 942-1650 行），內容未經改寫，僅搬移。
// 依賴：1_globals.js 中定義的 DOM 參照與全域狀態變數，需在此檔之前載入。

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

// ★ 新增：沒有選取任何標記時，依「游標（播放頭）位置」找出要跳轉的標記範圍。
// 使用情境：使用者在波形空白處點一下（會清除選取），游標落在兩個標記之間，
// 這時按 Tab / Ctrl+↓ 應跳到「游標之後」最近的標記，按 Shift+Tab / Ctrl+↑ 應跳到「游標之前」最近的標記，
// 而不是一律跳回第一句。
// 回傳值：
//   標籤字串 → 游標不在任何標記範圍內；direction>0 為游標「之後」最近的標記，direction<0 為游標「之前」最近的標記
//   null      → 游標不在任何標記範圍內，但該方向已沒有標記可跳（例如游標在最後一個標記之後按 Tab），不跳轉
//   undefined → 不適用（游標落在某個標記範圍內，或音檔上沒有任何時間標記），由呼叫端沿用原本行為
function findRegionAroundCursor(direction) {
    if (typeof audioPlayer === 'undefined' || !audioPlayer) return undefined;
    const t = audioPlayer.currentTime;
    if (typeof t !== 'number' || !isFinite(t)) return undefined;

    const EPS = 0.001; // 浮點數誤差容忍，游標剛好在標記邊界上也算「在範圍內」
    let nextLabel = null, nextStart = Infinity;
    let prevLabel = null, prevStart = -Infinity;
    let hasAnyMarker = false;

    for (const label of allLabelsOrdered) {
        if (timeDataMap[label] === undefined) continue;
        const times = getCalculatedTimes(label);
        if (!times) continue;
        hasAnyMarker = true;

        // 游標落在這個標記範圍內：不適用「游標在空白處」的邏輯
        if (t >= times.start - EPS && t <= times.end + EPS) return undefined;

        // 以「時間」而非清單順序挑選最靠近游標的標記
        if (times.start > t && times.start < nextStart) { nextStart = times.start; nextLabel = label; }
        if (times.end < t && times.start > prevStart) { prevStart = times.start; prevLabel = label; }
    }

    if (!hasAnyMarker) return undefined;
    return direction > 0 ? nextLabel : prevLabel;
}

// ★ 新增：跳到某一句之後，自動播放該句（行為與列表的「播放該句」喇叭按鈕相同：播到該句結尾停止）
function playRegionAfterJump(label, times) {
    if (!times) return;
    if (typeof currentLoopCounter !== 'undefined') currentLoopCounter = 0;

    // 計算最大播放時間（沿用「標記只播 N 秒」的設定）
    let targetEnd = times.end;
    if (document.getElementById('enableMaxPlayCheck')?.checked) {
        const maxSec = parseFloat(document.getElementById('maxPlaySecondsInput')?.value) || 2;
        targetEnd = Math.min(times.end, times.start + maxSec);
    }

    isContinuousSortedPlay = false;
    verifyEndTime = targetEnd;
    verifyingLabel = label;
    if (typeof applyCurrentPlaybackSpeed === 'function') applyCurrentPlaybackSpeed();

    // 加入跳轉鎖，並重新定位到句首，再延遲 50 毫秒播放，確保 WaveSurfer 與 Audio 引擎同步
    window.jumpLockTime = Date.now();
    if (typeof wavesurfer !== 'undefined' && wavesurfer) {
        wavesurfer.setTime(times.start);
    } else if (typeof audioPlayer !== 'undefined' && audioPlayer) {
        audioPlayer.currentTime = times.start;
    }
    setTimeout(() => {
        const playPromise = (typeof wavesurfer !== 'undefined' && wavesurfer) ? wavesurfer.play() : audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => { if (err.name !== 'AbortError') console.warn(err); });
        }
    }, 50);
}

function jumpToRegion(direction) {
    // 1. 判斷目前焦點是否在輸入框內 (包含單句模式與劇本模式)
    const activeEl = document.activeElement;
    const isInputActive = activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT' || activeEl.isContentEditable);

    let targetLabel = null;

    // 2. 決定下一個要跳轉的標籤
    if (!currentActiveLabel) {
        // ★ 修改：沒有選取任何標記時，先看「游標位置」，而不是一律跳第一句
        const aroundCursor = findRegionAroundCursor(direction);
        if (aroundCursor !== undefined) {
            targetLabel = aroundCursor; // 可能是 null（該方向沒有標記可跳），此時不跳轉
        } else if (allLabelsOrdered.length > 0) {
            // 游標在某個標記範圍內、或沒有任何時間標記：維持原本行為，預設跳第一句
            targetLabel = allLabelsOrdered[0];
        }
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
        // ★ 修正：列表的綠色高亮底色 (playing class) 已改為 updateSelectionUI() 內部
        //   依 currentActiveLabel 統一同步，這裡不再需要另外手動加減 class
        //   （避免與 6_wave_controller.js 等其他地方的邏輯重複、日後改一處漏一處）。
        if (typeof updateSelectionUI === 'function') updateSelectionUI();
        const targetItemDiv = document.getElementById(`item-${targetLabel}`);

        // B. 手動移動游標 (不再依賴文字框的 focus 事件)
        const times = typeof getCalculatedTimes === 'function' ? getCalculatedTimes(targetLabel) : null;
        if (times) {
            if (typeof wavesurfer !== 'undefined' && wavesurfer && audioPlayer.duration) {
                wavesurfer.setTime(times.start);
            } else if (typeof audioPlayer !== 'undefined' && audioPlayer) {
                audioPlayer.currentTime = times.start;
            }

            // ★ 新增：依設定「Tab 跳句時自動播放」（預設不勾選 = 只跳轉、不播放）
            if (typeof isTabAutoPlayEnabled === 'function' && isTabAutoPlayEnabled()) {
                playRegionAfterJump(targetLabel, times);
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
                if (targetItemDiv) {
                    if (typeof smartScrollTo === 'function') smartScrollTo(targetItemDiv);
                    const textDisplay = targetItemDiv.querySelector('.sentence-text-display');
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
                if (targetItemDiv && typeof smartScrollTo === 'function') smartScrollTo(targetItemDiv);
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
        
        // ★ 修改：依設定「新增聲波標記時新增列表」決定處理方式（預設：新增列表）
        //   勾選（新增列表）：依時間先後在列表（單句／全文）新增一列承接這個標記，
        //                     適合一邊聽一邊打字。
        //   取消勾選：不新增列，只把時間套用到既有的列（適合文字已分好、只是來對時間）：
        //             目前選中的句子若還沒標記就直接套用，否則放在前一個標記之後的列，後方標記依序順延。
        if (typeof isAddRowEnabled !== 'function' || isAddRowEnabled('tag')) {
            if (typeof insertRowChronologically === 'function') {
                insertRowChronologically(tStart, tEnd);
            }
        } else if (typeof applyTimeToExistingRows === 'function') {
            applyTimeToExistingRows(tStart, tEnd, { preferActiveLabel: true, lead: '已套用' });
        }
        
        saveToStorage(); 
        if(typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays(); 
        if(typeof renderAllRegions === 'function') renderAllRegions(); // 確保重新繪製聲波圖，讓編號正確顯示
        
        // ★ 修改：reassignLabels() 內部已會清掉藍色選取框(tempRegion 變成 null)，
        // 這裡要先判斷再移除，否則會出現 Cannot read properties of null 的錯誤
        if (tempRegion) { tempRegion.remove(); tempRegion = null; }
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
                    
                    // ★ 修改：改用 isBlank 判斷「所有語言」是否都空白（原因同 handleClearTag）
                    if ((typeof isBlank === 'function') ? isBlank(text) : text.trim() === '') {
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
        // ★ 集中化：handleClearTag 內部已會呼叫 saveState()，這裡不必重複（避免要按兩次 Ctrl+Z 才能復原）
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
                    // ★ 新增：匯入的專案是線上網址類型時，清掉 IndexedDB 裡可能殘留的
                    // 上一個專案的本地音檔備份，避免混淆或白白佔用空間。
                    if (typeof AudioStore !== 'undefined' && AudioStore.isSupported()) {
                        AudioStore.clear();
                    }
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

