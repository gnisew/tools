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
            mediaGroups = []; // ★ 新增：跨句圖片群組也一併清空記憶體

            // 3. 建立「專案資料」專屬清單，並精準刪除
            const projectKeys = [
                'tagger_allLabels', 'tagger_textMap', 'tagger_timeDataMap',
                'tagger_projectTitle', 'tagger_audioUrl', 'tagger_localFileName',
                'tagger_originalFileName', 'tagger_isTrimmed',
                'tagger_audioType', 'tagger_lastDataFile',
                'tagger_mediaGroups' // ★ 新增：跨句圖片群組的 localStorage 記錄
            ];
            
            projectKeys.forEach(key => localStorage.removeItem(key));
            
            // 4. 清除 IndexedDB 裡背景備份的本地音檔本體與圖片群組圖片，
            // 否則「清除專案資料」後，舊音檔／舊圖片仍會留在 IndexedDB 裡，
            // 下次載入新專案時可能誤讀到不相干的舊資料，或留下永遠用不到的孤兒圖片。
            // 用 .finally() 確保無論清除成功或失敗，都會繼續重新整理頁面。
            const finishReload = () => location.reload();
            const clearJobs = [];
            if (typeof AudioStore !== 'undefined' && AudioStore.isSupported()) {
                clearJobs.push(AudioStore.clear());
            }
            if (typeof ImageStore !== 'undefined' && ImageStore.isSupported()) {
                clearJobs.push(ImageStore.clear()); // ★ 新增
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

// ================= ★ 微調選取邊界：依「音量門檻」的智慧處理 ★ =================
// 規則（以每個選取句子的「頭」與「尾」分別判斷）：
//   1. 依「音量門檻」找出實際有聲音的邊界（聲音開始／結束的位置）。
//   2. 該邊界與目前選取邊界之間的靜音 < 保留靜音 → 向外擴增，直到剛好留足保留靜音；
//      但遇到相鄰標記的邊界就停住，不會超過。
//   3. 靜音 > 保留靜音 → 向內縮減，直到剛好留足保留靜音。
//   4. 選取邊界本身就落在聲音上（聲音被切到）→ 先往外找到聲音真正的起點／終點，再留足保留靜音（同樣不越過鄰居）。
// 偵測方式（峰值／RMS）沿用「依靜音斷句」的偵測模式；啟用「人聲強化」時，也用同一份壓低配樂的分析音訊。
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
    // ★ 凹陷容許：往外找聲音邊界時，短於「保留靜音」的安靜片段（字與字之間、氣音、尾音變弱）
    //   視為聲音的一部分繼續找；安靜達到保留靜音長度，才算真正的靜音、才停下。
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

    // 1. 先拍下所有標記的「原始時間」快照，鄰居限制一律以快照為準，避免處理順序影響結果
    const orig = {};
    const validOrder = [];
    allLabelsOrdered.forEach(label => {
        const t = getCalculatedTimes(label);
        if (t) { orig[label] = t; validOrder.push(label); }
    });
    const selectedSet = new Set(selectedLabels);

    // 2. 逐句計算新的頭／尾
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

    // 3. 相鄰的兩句都被選取、且擴增後互相重疊 → 在重疊處取中點，兩邊各讓一半
    for (let k = 0; k < validOrder.length - 1; k++) {
        const a = res[validOrder[k]], b = res[validOrder[k + 1]];
        if (a && b && a.end > b.start) {
            const mid = (a.end + b.start) / 2;
            a.end = mid;
            b.start = mid;
        }
    }

    // 4. 統計並寫入（有變動才拍 Undo 快照）
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

// ================= 設定視窗（音量門檻 + 保留靜音） =================
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

// ★ 新增：聲波圖「⋮」更多選單裡的「微調選取邊界」(#waveAdjustPaddingBtn)。
//   原本這個按鈕沒有任何 click 綁定，點了沒反應。這裡先關閉選單，再轉交給「編輯」選單的
//   「調整邊界」(#adjustPaddingBtn) 處理，兩個入口共用同一份邏輯，不會各維護一份。
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

    // ★ 新增：「並排表格」項目（至少 2 種語言才出現）
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

// 依目前的語言檢視模式，更新子選單裡的項目，以及「語言」按鈕上顯示的目前模式。
// 未啟用多語字幕時，直接隱藏整個「語言」按鈕（只有一種語言，沒有切換的意義）。
// ★ 新增：「語言」按鈕只在「列表」模式顯示。單句全文／跨句範圍／多語字幕模式用不到語言檢視，
//   所以直接隱藏（getCurrentListMode 定義在 4l，尚未載入時視為列表模式）。
function updateLangMenuVisibility() {
    if (!langMenuContainer) return;
    const enabled = (typeof getLangMultiEnabled === 'function') ? getLangMultiEnabled() : false;
    const inListMode = (typeof getCurrentListMode === 'function') ? (getCurrentListMode() === 'list') : true;
    langMenuContainer.style.display = (enabled && inListMode) ? 'inline-block' : 'none';
    if (!(enabled && inListMode) && langViewMenu) langViewMenu.classList.remove('show');
}

function updateLangViewMenuLabels() {
    rebuildLangViewMenuItems();
    // 聲波圖「顯示哪個語言」的設定選項，跟這裡共用同一套語言數量偵測，一併同步更新
    if (typeof rebuildRegionTextLangOptions === 'function') rebuildRegionTextLangOptions();

    updateLangMenuVisibility(); // ★ 修改：顯示與否改由這個函式統一判斷（要啟用多語字幕、且在列表模式）
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

// ★ 改用事件代理綁在容器上：語言項目會依語言數量動態重新產生，
//   若像舊寫法逐一綁定監聽器，重繪後就會失效，改綁在固定不變的父層才不受影響
langViewMenu?.addEventListener('click', (e) => {
    const item = e.target.closest('.custom-dropdown-item');
    if (!item || !langViewMenu.contains(item)) return;
    // ★ 新增：表格欄位勾選（不關閉選單，方便連續勾選）
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






