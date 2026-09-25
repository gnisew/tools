// ================= 4a_ui_title_misc.js: 標題編輯、清除工作區、快捷鍵重設等雜項小型事件綁定 =================
// 本檔案由 4_ui_events.js 拆分而來（原始第 1-400 行），內容未經改寫，僅搬移。
// 依賴：1_globals.js 中定義的 DOM 參照與全域狀態變數，需在此檔之前載入。

// ================= 4_ui_events.js: 介面互動與通用事件管理 =================

function updateMainTitleDisplay() {
    if (!mainTitleDisplay) return;
    
    // 如果使用者正在打字編輯標題，就不要干擾他
    if (document.activeElement === mainTitleDisplay) return;

    const customTitle = localStorage.getItem('tagger_projectTitle');
    // ★ 修改：優先用原始檔名當標題，剪裁後也不會變成「剪裁後音檔」
    const localFile = localStorage.getItem('tagger_originalFileName') || localStorage.getItem('tagger_localFileName');
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
                'tagger_originalFileName', 'tagger_isTrimmed',
                'tagger_audioType', 'tagger_lastDataFile'
            ];
            
            projectKeys.forEach(key => localStorage.removeItem(key));
            
            // 4. ★ 新增：清除 IndexedDB 裡背景備份的本地音檔本體，
            // 否則「清除專案資料」後，舊音檔仍會留在 IndexedDB 裡，
            // 下次載入新專案時可能誤讀到不相干的舊音檔。
            // 用 .finally() 確保無論清除成功或失敗，都會繼續重新整理頁面。
            const finishReload = () => location.reload();
            if (typeof AudioStore !== 'undefined' && AudioStore.isSupported()) {
                AudioStore.clear().finally(finishReload);
            } else {
                finishReload();
            }
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
                'tagger_originalFileName', 'tagger_isTrimmed',
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

// ★ 修正：mergeSelectedBtn 原本在這裡跟 3_data_core.js 各綁了一份幾乎相同的
// click 監聽器，點一次「合併」按鈕會連續觸發兩次 saveState()（Undo 堆疊多塞
// 一筆假紀錄，按一次 Ctrl+Z 會感覺沒反應）、兩次 reassignLabels()、兩次 toast
// 疊字。已整併為單一事實來源，唯一保留的版本在 3_data_core.js 第 535 行附近。

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

    // ★ 新增：點擊外部時，一併關閉語言檢視子選單
    const langViewMenuEl = document.getElementById('langViewMenu');
    if (langViewMenuEl) langViewMenuEl.classList.remove('show');
    
    document.querySelectorAll('.item-more-menu').forEach(m => m.classList.remove('show')); 
});

// ================= ★ 新增：多語言字幕 - 「語言」獨立頂層選單（全部語言／只看第 N 語言） =================
// 開關（點擊展開/收合、跟其他選單互斥）已交給 4b_ui_audio_loader.js 的 toggleHeaderMenu() 統一處理，
// 這裡只負責：整個按鈕容器要不要顯示（未啟用多語字幕就整個藏起來）、按鈕文字、選單內容。
const langMenuContainer = document.getElementById('langMenuContainer');
const langMenuBtn = document.getElementById('langMenuBtn');
const langViewMenu = document.getElementById('langViewMenu');

// 依目前偵測到的語言數量，重新產生子選單裡「語言1、語言2…」的項目（不再寫死 3 個）。
// 前面用核取方塊呈現「目前選到哪一個」：這裡仍是單選（跟原本點選行為一致，一次只會勾一個），
// 只是外觀從數字圖示改成核取方塊，方便一眼看出目前的語言檢視模式。
function rebuildLangViewMenuItems() {
    const dynamicContainer = document.getElementById('langViewMenuDynamic');
    if (!dynamicContainer) return;
    const count = (typeof getLangCount === 'function') ? getLangCount() : 1;
    const currentMode = (typeof getLangViewMode === 'function') ? getLangViewMode() : 'raw';
    dynamicContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const name = (typeof getLangName === 'function') ? getLangName(i) : `語言${i + 1}`;

        const item = document.createElement('div');
        item.className = 'custom-dropdown-item';
        item.setAttribute('data-lang-value', String(i));

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'lang-menu-checkbox';
        checkbox.style.cssText = 'margin-right:6px; pointer-events:none;'; // 勾選狀態交由點擊項目統一處理，避免點到方塊本身時邏輯分岔
        checkbox.checked = (currentMode === String(i));

        const nameSpan = document.createElement('span');
        nameSpan.className = 'lang-menu-name';
        nameSpan.dataset.langIdx = String(i);
        nameSpan.textContent = name; // 用 textContent 賦值，避免語言名稱裡若含特殊字元破壞選單結構

        item.appendChild(checkbox);
        item.appendChild(nameSpan);
        dynamicContainer.appendChild(item);
    }
}

// 依目前的語言檢視模式，更新子選單裡的項目，以及「語言」按鈕上顯示的目前模式。
// 未啟用多語字幕時，直接隱藏整個「語言」按鈕（只有一種語言，沒有切換的意義）。
function updateLangViewMenuLabels() {
    rebuildLangViewMenuItems();
    // 聲波圖「顯示哪個語言」的設定選項，跟這裡共用同一套語言數量偵測，一併同步更新
    if (typeof rebuildRegionTextLangOptions === 'function') rebuildRegionTextLangOptions();

    const enabled = (typeof getLangMultiEnabled === 'function') ? getLangMultiEnabled() : false;
    if (langMenuContainer) langMenuContainer.style.display = enabled ? 'inline-block' : 'none';
    if (langMenuBtn) {
        const mode = (typeof getLangViewMode === 'function') ? getLangViewMode() : 'raw';
        const label = (mode === 'raw')
            ? '語言全'
            : ((typeof getLangName === 'function') ? getLangName(parseInt(mode, 10)) : mode);
        langMenuBtn.innerHTML = `<span class="material-icons">translate</span> ${label}`;
    }
}
updateLangViewMenuLabels();

// ★ 改用事件代理綁在容器上：語言項目會依語言數量動態重新產生，
//   若像舊寫法逐一綁定監聽器，重繪後就會失效，改綁在固定不變的父層才不受影響
langViewMenu?.addEventListener('click', (e) => {
    const item = e.target.closest('.custom-dropdown-item');
    if (!item || !langViewMenu.contains(item)) return;
    const value = item.getAttribute('data-lang-value');
    if (value === null) return;

    if (typeof setLangViewMode === 'function') setLangViewMode(value);
    langViewMenu.classList.remove('show');
    updateLangViewMenuLabels();

    if (typeof renderSentenceList === 'function') renderSentenceList();

    const modeName = (value === 'raw') ? '全部語言' : (typeof getLangName === 'function' ? getLangName(parseInt(value, 10)) : value);
    showToast(`已切換為：語言檢視 - ${modeName}`, 'normal');
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






