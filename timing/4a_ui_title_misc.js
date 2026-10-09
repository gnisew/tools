// 4a_ui_title_misc.js: 標題編輯、清除工作區、快捷鍵重設等雜項小型事件綁定
// 依賴：1_globals.js 中定義的 DOM 參照與全域狀態變數，需在此檔之前載入。

function updateMainTitleDisplay() {
    if (!mainTitleDisplay) return;

    // 如果使用者正在打字編輯標題，就不要干擾他
    if (document.activeElement === mainTitleDisplay) return;

    const customTitle = localStorage.getItem('tagger_projectTitle');
    // 優先用原始檔名當標題，剪裁後也不會變成「剪裁後音檔」
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

    // 控制左上角網站標題的顯示與隱藏
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

clearStorageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showCustomDialog({
        title: '清除專案資料',
        message: '確定清除所有的句子、時間標記與音檔紀錄嗎？<br><br><span style="color:#00897B; font-weight:bold;">(您的偏好設定將會被保留)</span>',
        onConfirm: () => {
            // 阻斷防呆存檔：將計時器清空並設為 null
            if (typeof saveStorageTimeout !== 'undefined') {
                clearTimeout(saveStorageTimeout);
                saveStorageTimeout = null;
            }

            // 清空記憶體陣列
            allLabelsOrdered = [];
            sentenceTextMap = {};
            timeDataMap = {};
            mediaGroups = []; // 跨句圖片群組也一併清空記憶體
            volumeRegions = []; // 範圍音量調整也一併清空

            // 建立「專案資料」專屬清單，並精準刪除
            const projectKeys = [
                'tagger_allLabels', 'tagger_textMap', 'tagger_timeDataMap',
                'tagger_projectTitle', 'tagger_audioUrl', 'tagger_localFileName',
                'tagger_originalFileName', 'tagger_originalFileSig', 'tagger_isTrimmed',
                'tagger_audioType', 'tagger_lastDataFile',
                'tagger_mediaGroups', // 跨句圖片群組的 localStorage 記錄
                'tagger_volumeRegions' // 範圍音量調整的 localStorage 記錄
            ];

            projectKeys.forEach(key => localStorage.removeItem(key));

            // 一併清除 IndexedDB 備份的音檔與圖片；無論成功或失敗都重新整理頁面
            const finishReload = () => location.reload();
            const clearJobs = [];
            if (typeof AudioStore !== 'undefined' && AudioStore.isSupported()) {
                clearJobs.push(AudioStore.clear());
            }
            if (typeof ImageStore !== 'undefined' && ImageStore.isSupported()) {
                clearJobs.push(ImageStore.clear()); //
            }
            if (clearJobs.length > 0) {
                Promise.allSettled(clearJobs).finally(finishReload);
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
attachKeyCatcher(hkWaveSelect, 'waveSelect'); // 框選模式快速鍵

resetShortcutsBtn?.addEventListener('click', () => {
    showCustomDialog({
        title: '恢復預設設定',
        message: '確定要將所有「偏好設定」(包含快速鍵、顯示模式、播放速度等) 恢復為預設值嗎？<br><br><span style="color:#00897B; font-weight:bold;">(您的文章與標記進度將會安全保留)</span>',
        onConfirm: () => {
            // 定義要被「保護」的專案資料清單
            const projectKeys = [
                'tagger_allLabels', 'tagger_textMap', 'tagger_timeDataMap',
                'tagger_projectTitle', 'tagger_audioUrl', 'tagger_localFileName',
                'tagger_originalFileName', 'tagger_originalFileSig', 'tagger_isTrimmed',
                'tagger_audioType', 'tagger_lastDataFile'
            ];

            // 智慧掃描：找出所有是 tagger_ 開頭，但「不是」專案資料的設定
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('tagger_') && !projectKeys.includes(key)) {
                    keysToRemove.push(key);
                }
            }

            // 執行清除設定
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // 重新整理套用預設值
            location.reload();
        }
    });
});

// 點擊「目前時間」：回到選取標記或游標位置 (接管原定位按鈕功能)
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

// 點擊「全部時間」：全選 / 取消全選
document.getElementById('audioTimeTotal')?.addEventListener('click', () => {
    // 檢查是否有選取的標記，或是「有藍色暫存選取框 (例如全選音檔產生的)」
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

// 改寫為「切換：僅播放選取範圍」模式按鈕
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

// mergeSelectedBtn 的 click 只在 3_data_core.js 綁定一次，此處不重複綁定

// 微調選取邊界：每個選取句子的頭、尾分別處理
//   1. 依音量門檻找出實際有聲音的邊界
//   2. 邊界與聲音之間的靜音不足保留靜音 → 向外擴增（遇到相鄰標記即停）
//   3. 靜音超過保留靜音 → 向內縮減
//   4. 邊界落在聲音上 → 先往外找到聲音起點／終點，再留足保留靜音
// 偵測方式（峰值／RMS）與人聲強化沿用「依靜音斷句」的設定
const TRIM_KEY_THRESHOLD = 'tagger_trimThreshold';
const TRIM_KEY_PADDING = 'tagger_trimPadding';

// 保留靜音的預設值 = 「依靜音斷句」的「前後留白時間」(#asPadding) 在 index.html 的預設值（0.2 秒）
function getTrimPaddingDefault() {
    const v = parseFloat(asPadding?.getAttribute('value'));
    return v > 0 ? v : 0.2;
}

function getTrimSettings() {
    let threshold = parseFloat(localStorage.getItem(TRIM_KEY_THRESHOLD));
    if (!(threshold > 0 && threshold <= 50)) threshold = parseFloat(asThreshold?.value) || 5; // 沒設定過就沿用斷句的音量門檻
    let padding = parseFloat(localStorage.getItem(TRIM_KEY_PADDING));
    if (!(padding > 0)) padding = getTrimPaddingDefault(); // 不可 <= 0
    return { threshold, padding };
}

// 建立「以 10 毫秒為一格」的音量分析器（與靜音斷句相同的切格方式，結果才會一致）
function createTrimAnalyzer(thresholdPct, padding) {
    const raw = (typeof wavesurfer !== 'undefined' && wavesurfer) ? wavesurfer.getDecodedData() : null;
    if (!raw) return null;
    const buffer = window.VocalEnhance ? VocalEnhance.getAnalysisBuffer(raw) : raw;
    const sr = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    const channels = [];
    for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

    const mediaDuration = audioPlayer.duration || buffer.duration;
    const timeRatio = mediaDuration / buffer.duration;
    const step = Math.max(1, Math.floor(sr / 100));
    const blockCount = Math.max(1, Math.ceil(buffer.length / step));
    const blockSec = (step / sr) * timeRatio;
    const threshold = thresholdPct / 100;
    const mode = asDetectionMode ? asDetectionMode.value : 'peak';
    // 凹陷容許：往外找邊界時，短於保留靜音的安靜片段視為聲音的一部分，達到保留靜音長度才算真正靜音
    const bridge = Math.max(1, Math.round(padding / blockSec));
    const cache = new Map();

    function isLoud(b) {
        if (cache.has(b)) return cache.get(b);
        const from = b * step;
        const to = Math.min(from + step, buffer.length);
        let maxAmp = 0, sumSquares = 0;
        for (let j = from; j < to; j++) {
            for (let c = 0; c < numChannels; c++) {
                const amp = Math.abs(channels[c][j]);
                if (amp > maxAmp) maxAmp = amp;
                if (mode === 'rms') sumSquares += amp * amp;
            }
        }
        const count = (to - from) * numChannels;
        const level = (mode === 'rms' && count > 0) ? Math.sqrt(sumSquares / count) : maxAmp;
        const loud = level >= threshold;
        cache.set(b, loud);
        return loud;
    }

    const blockOf = t => Math.min(blockCount - 1, Math.max(0, Math.floor(t / blockSec)));
    const timeOf = b => b * blockSec;

    // 找「聲音開始」的時間；floorT = 往外找的下限（鄰居的結束時間）。整段都是靜音回傳 null
    function findSoundStart(s, e, floorT) {
        const bs = blockOf(s);
        const be = Math.max(bs, blockOf(e - 0.0005));
        const bLow = blockOf(floorT);
        // 邊界落在聲音上、或邊界剛好落在聲音中的小凹陷（往外 bridge 格內仍有聲音）→ 以該處為起點，繼續往外找
        let anchor = -1;
        for (let k = bs; k >= Math.max(bLow, bs - bridge + 1); k--) {
            if (isLoud(k)) { anchor = k; break; }
        }
        if (anchor !== -1) {
            let lastLoud = anchor, quiet = 0;
            for (let k = anchor - 1; k >= bLow; k--) {
                if (isLoud(k)) { lastLoud = k; quiet = 0; }
                else if (++quiet >= bridge) break; // 安靜達保留靜音長度 = 真正的靜音
            }
            return timeOf(lastLoud);
        }
        // 邊界在靜音裡 → 往內找第一個有聲音的位置
        for (let b = bs + 1; b <= be; b++) if (isLoud(b)) return timeOf(b);
        return null;
    }

    // 找「聲音結束」的時間；ceilT = 往外找的上限（鄰居的開始時間，不含鄰居自己的第一格）。整段都是靜音回傳 null
    function findSoundEnd(s, e, ceilT) {
        const bs = blockOf(s);
        const be = Math.max(bs, blockOf(e - 0.0005));
        const bHigh = Math.max(be, blockOf(ceilT) - 1);
        let anchor = -1;
        for (let k = be; k <= Math.min(bHigh, be + bridge - 1); k++) {
            if (isLoud(k)) { anchor = k; break; }
        }
        if (anchor !== -1) {
            let lastLoud = anchor, quiet = 0;
            for (let k = anchor + 1; k <= bHigh; k++) {
                if (isLoud(k)) { lastLoud = k; quiet = 0; }
                else if (++quiet >= bridge) break;
            }
            return timeOf(lastLoud + 1);
        }
        for (let b = be - 1; b >= bs; b--) if (isLoud(b)) return timeOf(b + 1);
        return null;
    }

    return { mediaDuration, findSoundStart, findSoundEnd };
}

// 套用到目前選取的句子
function applySmartTrim(threshold, padding) {
    const analyzer = createTrimAnalyzer(threshold, padding);
    if (!analyzer) return showToast('請先載入音檔並等待分析完成', 'error');

    // 先拍下所有標記的「原始時間」快照，鄰居限制一律以快照為準，避免處理順序影響結果
    const orig = {};
    const validOrder = [];
    allLabelsOrdered.forEach(label => {
        const t = getCalculatedTimes(label);
        if (t) { orig[label] = t; validOrder.push(label); }
    });
    const selectedSet = new Set(selectedLabels);

    // 逐句計算新的頭／尾
    const res = {};
    let silentSkipped = 0;
    validOrder.forEach((label, k) => {
        if (!selectedSet.has(label)) return;
        const o = orig[label];
        const prevEnd = k > 0 ? orig[validOrder[k - 1]].end : 0;
        const nextStart = k < validOrder.length - 1 ? orig[validOrder[k + 1]].start : analyzer.mediaDuration;
        const floorT = Math.min(prevEnd, o.start); // 往前擴增的極限（不碰前一個標記）
        const ceilT = Math.max(nextStart, o.end);  // 往後擴增的極限（不碰後一個標記）

        const soundStart = analyzer.findSoundStart(o.start, o.end, floorT);
        const soundEnd = analyzer.findSoundEnd(o.start, o.end, ceilT);
        if (soundStart === null || soundEnd === null || soundEnd <= soundStart) { silentSkipped++; return; }

        // 聲音邊界 ± 保留靜音：比現在大 = 擴增（受極限限制），比現在小 = 縮減
        res[label] = {
            start: Math.max(floorT, soundStart - padding, 0),
            end: Math.min(ceilT, soundEnd + padding, analyzer.mediaDuration)
        };
    });

    // 相鄰的兩句都被選取、且擴增後互相重疊 → 在重疊處取中點，兩邊各讓一半
    for (let k = 0; k < validOrder.length - 1; k++) {
        const a = res[validOrder[k]], b = res[validOrder[k + 1]];
        if (a && b && a.end > b.start) {
            const mid = (a.end + b.start) / 2;
            a.end = mid;
            b.start = mid;
        }
    }

    // 統計並寫入（有變動才拍 Undo 快照）
    const EPS = 0.0005;
    const changes = [];
    let grow = 0, shrink = 0;
    Object.keys(res).forEach(label => {
        const o = orig[label];
        const s = parseFloat(res[label].start.toFixed(3));
        const e = parseFloat(res[label].end.toFixed(3));
        if (e <= s) return; // 防呆：不合理的結果一律不套用
        if (Math.abs(s - o.start) < EPS && Math.abs(e - o.end) < EPS) return;
        if (s < o.start - EPS) grow++; else if (s > o.start + EPS) shrink++;
        if (e > o.end + EPS) grow++; else if (e < o.end - EPS) shrink++;
        changes.push({ label, start: s, end: e });
    });

    if (changes.length === 0) {
        const extra = silentSkipped ? `（另有 ${silentSkipped} 句整段低於門檻，已略過）` : '';
        return showToast('邊界已符合設定，沒有需要調整的句子' + extra, 'normal');
    }

    if (typeof saveState === 'function') saveState(); // 紀錄 Undo 狀態
    changes.forEach(c => { timeDataMap[c.label] = { start: c.start, end: c.end }; });

    saveToStorage();
    if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
    if (typeof renderAllRegions === 'function') renderAllRegions(); // 重新繪製聲波圖避免殘影

    let msg = `已調整 ${changes.length} 個句子（邊界擴增 ${grow} 處、縮減 ${shrink} 處）`;
    if (silentSkipped) msg += `，${silentSkipped} 句整段低於門檻已略過`;
    showToast(msg, 'success');
}

// 設定視窗（音量門檻 + 保留靜音）
function ensureTrimDialog() {
    let overlay = document.getElementById('trimModalOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'trimModalOverlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="custom-modal" role="dialog" aria-modal="true" aria-labelledby="trimModalTitle">
            <h4 id="trimModalTitle">微調選取邊界（依音量門檻）</h4>
            <p style="font-size:0.88rem; color:#666; margin-bottom:16px;">依音量門檻找出聲音的實際邊界，再讓頭尾各保留指定的靜音：不足就往外擴增（碰到相鄰標記就停住），太多就往內縮減。</p>
            <label for="trimThresholdInput" style="display:block; margin-bottom:5px; font-weight:bold; font-size:0.9rem;">音量門檻 (%)</label>
            <input type="number" id="trimThresholdInput" min="0.5" max="50" step="0.5">
            <label for="trimPaddingInput" style="display:block; margin-bottom:5px; font-weight:bold; font-size:0.9rem;">保留靜音 (秒，必須大於 0)</label>
            <input type="number" id="trimPaddingInput" min="0.01" step="0.05" style="margin-bottom:8px;">
            <div id="trimModalError" style="color:#C62828; font-size:0.85rem; min-height:1.2em; margin-bottom:12px;"></div>
            <div class="modal-buttons">
                <button id="trimConfirmBtn" class="btn-modal-confirm">套用</button>
                <button id="trimCancelBtn" class="btn-modal-cancel">取消</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    const thInput = overlay.querySelector('#trimThresholdInput');
    const padInput = overlay.querySelector('#trimPaddingInput');
    const errEl = overlay.querySelector('#trimModalError');
    const close = () => overlay.classList.remove('show');

    const confirm = () => {
        const threshold = parseFloat(thInput.value);
        const padding = parseFloat(padInput.value);
        if (!(threshold > 0 && threshold <= 50)) {
            errEl.textContent = '音量門檻請輸入 0 ~ 50 之間的數字（不含 0）';
            return thInput.focus();
        }
        if (!(padding > 0)) { // 同時擋掉 NaN、0、負數
            errEl.textContent = '保留靜音必須大於 0 秒';
            return padInput.focus();
        }
        localStorage.setItem(TRIM_KEY_THRESHOLD, String(threshold));
        localStorage.setItem(TRIM_KEY_PADDING, String(padding));
        close();
        applySmartTrim(threshold, padding);
    };

    overlay.querySelector('#trimConfirmBtn').addEventListener('click', confirm);
    overlay.querySelector('#trimCancelBtn').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    // 視窗內的按鍵不往外傳，避免觸發全域快捷鍵（例如 Esc 取消選取、空白鍵播放）
    overlay.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); confirm(); }
        else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    [thInput, padInput].forEach(el => el.addEventListener('input', () => { errEl.textContent = ''; }));
    return overlay;
}

function showTrimBoundaryDialog() {
    const overlay = ensureTrimDialog();
    const { threshold, padding } = getTrimSettings();
    overlay.querySelector('#trimThresholdInput').value = threshold;
    overlay.querySelector('#trimPaddingInput').value = padding;
    overlay.querySelector('#trimModalError').textContent = '';
    overlay.classList.add('show');
    setTimeout(() => overlay.querySelector('#trimPaddingInput').select(), 100);
}

adjustPaddingBtn?.addEventListener('click', () => {
    if (selectedLabels.length === 0) return;
    if (typeof wavesurfer === 'undefined' || !wavesurfer || !wavesurfer.getDecodedData()) {
        return showToast('請先載入音檔並等待分析完成', 'error');
    }
    showTrimBoundaryDialog();
});

// 聲波圖「⋮」選單的「微調選取邊界」：關閉選單後轉交 #adjustPaddingBtn，與「編輯」選單共用同一份邏輯
document.getElementById('waveAdjustPaddingBtn')?.addEventListener('click', () => {
    document.getElementById('waveMoreMenu')?.classList.remove('show');
    if (selectedLabels.length === 0) {
        return showToast('請先選取要微調邊界的句子（列表 Ctrl／Shift 多選，或在聲波圖按 Ctrl+Shift+A 全選）', 'error');
    }
    adjustPaddingBtn?.click();
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

    // 點擊外部時，一併關閉語言檢視子選單
    const langViewMenuEl = document.getElementById('langViewMenu');
    if (langViewMenuEl) langViewMenuEl.classList.remove('show');

    document.querySelectorAll('.item-more-menu').forEach(m => m.classList.remove('show'));
});

// 「語言」頂層選單：未啟用多語字幕或不在列表模式時整個隱藏
// 開關由 4b_ui_audio_loader.js 的 toggleHeaderMenu() 處理
const langMenuContainer = document.getElementById('langMenuContainer');
const langMenuBtn = document.getElementById('langMenuBtn');
const langViewMenu = document.getElementById('langViewMenu');

// 依語言數量重新產生子選單項目（單選，以核取方塊顯示目前選到的語言）
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

    // 「並排表格」項目（至少 2 種語言才出現）
    if (count > 1) {
        const tableItem = document.createElement('div');
        tableItem.className = 'custom-dropdown-item';
        tableItem.setAttribute('data-lang-value', 'table');
        const tChk = document.createElement('input');
        tChk.type = 'checkbox';
        tChk.className = 'lang-menu-checkbox';
        tChk.style.cssText = 'margin-right:6px; pointer-events:none;';
        tChk.checked = (currentMode === 'table');
        const tName = document.createElement('span');
        tName.textContent = '並排表格';
        tableItem.append(tChk, tName);
        dynamicContainer.appendChild(tableItem);

        // 語言數超過表格欄數上限、且目前是表格檢視時，列出「欄位」勾選（最多 3 欄、至少 2 欄）
        const maxCols = (typeof LANG_TABLE_MAX_COLS !== 'undefined') ? LANG_TABLE_MAX_COLS : 3;
        if (currentMode === 'table' && count > maxCols && typeof getLangTableColumns === 'function') {
            const shown = getLangTableColumns();
            dynamicContainer.appendChild(document.createElement('hr'));
            for (let i = 0; i < count; i++) {
                const colItem = document.createElement('div');
                colItem.className = 'custom-dropdown-item';
                colItem.setAttribute('data-lang-col', String(i));
                const cChk = document.createElement('input');
                cChk.type = 'checkbox';
                cChk.className = 'lang-menu-checkbox';
                cChk.style.cssText = 'margin-right:6px; pointer-events:none;';
                cChk.checked = shown.includes(i);
                const cName = document.createElement('span');
                cName.textContent = '欄位：' + ((typeof getLangName === 'function') ? getLangName(i) : `語言${i + 1}`);
                colItem.append(cChk, cName);
                dynamicContainer.appendChild(colItem);
            }
        }
    }
}

// 「語言」按鈕只在多語字幕啟用且為列表模式時顯示（getCurrentListMode 定義在 4l，尚未載入時視為列表模式）
function updateLangMenuVisibility() {
    if (!langMenuContainer) return;
    const enabled = (typeof getLangMultiEnabled === 'function') ? getLangMultiEnabled() : false;
    const inListMode = (typeof getCurrentListMode === 'function') ? (getCurrentListMode() === 'list') : true;
    langMenuContainer.style.display = (enabled && inListMode) ? 'inline-block' : 'none';
    if (!(enabled && inListMode) && langViewMenu) langViewMenu.classList.remove('show');
}

// 更新子選單項目與「語言」按鈕文字
function updateLangViewMenuLabels() {
    rebuildLangViewMenuItems();
    // 聲波圖「顯示哪個語言」的設定選項，跟這裡共用同一套語言數量偵測，一併同步更新
    if (typeof rebuildRegionTextLangOptions === 'function') rebuildRegionTextLangOptions();

    updateLangMenuVisibility(); // 顯示與否改由這個函式統一判斷（要啟用多語字幕、且在列表模式）
    if (langMenuBtn) {
        const mode = (typeof getLangViewMode === 'function') ? getLangViewMode() : 'raw';
        const label = (mode === 'raw')
            ? '語言全'
            : (mode === 'table')
                ? ((typeof isLangTableView === 'function' && isLangTableView()) ? '並排表格' : '語言全')
                : ((typeof getLangName === 'function') ? getLangName(parseInt(mode, 10)) : mode);
        langMenuBtn.innerHTML = `<span class="material-icons">translate</span> ${label}`;
    }
}
updateLangViewMenuLabels();

// 事件代理：語言項目會動態重新產生，監聽器綁在固定的父層
langViewMenu?.addEventListener('click', (e) => {
    const item = e.target.closest('.custom-dropdown-item');
    if (!item || !langViewMenu.contains(item)) return;
    // 表格欄位勾選（不關閉選單，方便連續勾選）
    const colVal = item.getAttribute('data-lang-col');
    if (colVal !== null) {
        e.stopPropagation();
        if (typeof toggleLangTableColumn === 'function' && !toggleLangTableColumn(parseInt(colVal, 10))) {
            showToast(`表格最多顯示 ${LANG_TABLE_MAX_COLS} 欄，且至少要保留 2 欄`, 'error');
        }
        updateLangViewMenuLabels();
        if (typeof renderSentenceList === 'function') renderSentenceList();
        return;
    }

    const value = item.getAttribute('data-lang-value');
    if (value === null) return;

    if (typeof setLangViewMode === 'function') setLangViewMode(value);
    langViewMenu.classList.remove('show');
    updateLangViewMenuLabels();

    if (typeof renderSentenceList === 'function') renderSentenceList();

    const modeName = (value === 'raw') ? '全部語言' : (value === 'table') ? '並排表格' : (typeof getLangName === 'function' ? getLangName(parseInt(value, 10)) : value);
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
