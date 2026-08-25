// ================= 4d_ui_settings.js: 自動斷句/縮放/AI語言/時間精度/播放速度/循環播放等設定面板事件 =================
// 本檔案由 4_ui_events.js 拆分而來（原始第 1651-2131 行），內容未經改寫，僅搬移。
// 依賴：1_globals.js 中定義的 DOM 參照與全域狀態變數，需在此檔之前載入。

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
initAutoSegmentSetting('asDetectionMode', null, 'tagger_asDetectionMode', null); // ★ 新增：偵測模式（Peak/RMS），預設 peak 與舊行為完全相同
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
    tabAutoSilence.setAttribute('aria-selected', 'true'); tabAutoTime.setAttribute('aria-selected', 'false');
    sectionAutoSilence.style.display = 'block'; sectionAutoTime.style.display = 'none';
});

tabAutoTime?.addEventListener('click', () => {
    tabAutoTime.style.background = 'white'; tabAutoTime.style.color = '#1976D2'; tabAutoTime.style.borderBottom = '3px solid #1976D2';
    tabAutoSilence.style.background = 'transparent'; tabAutoSilence.style.color = '#666'; tabAutoSilence.style.borderBottom = '3px solid transparent';
    tabAutoTime.setAttribute('aria-selected', 'true'); tabAutoSilence.setAttribute('aria-selected', 'false');
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

// ★ 修正：appWidthSelect 原本在這裡跟下方「聲波圖高度與寬度設定事件」區塊
// 各綁了一份幾乎相同的 change 監聽器，切換寬度時 applyAppWidth() 與 toast
// 都會各觸發兩次。已整併，唯一保留的版本在本檔案下方（多了一道防呆判斷）。

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


