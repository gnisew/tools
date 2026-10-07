// 2b_audio_clipboard.js: 聲波音訊複製／剪下／貼上
// 用途：補錄漏掉的音訊（框選 → 複製 → 游標移到位置 → 貼上）；修正錄音順序（剪下時標記一起帶走，貼上時帶回）
// 只編輯音訊層，不改句子文字與 label，時間標記同步位移；時間換算同 cutAudioRegion（以 timeRatio 轉換 media time 與 buffer time）
// 剪下時，完全落在選取範圍內的時間標記與跨句範圍 (mediaGroups) 一起帶走，貼上時依 label 帶回；複製 (Ctrl+C) 只複製音訊（label 不能重複）
// 接合處前後各 5ms 淡出／淡入，避免爆音
// 復原：Ctrl+Z 優先復原最近一次音訊編輯（含音檔、標記、跨句範圍），最多 3 步，不支援 Redo
// 快捷鍵（非打字、無選取文字時生效）：Ctrl+C 複製、Ctrl+X 剪下、Ctrl+V 貼上到游標處
// 需求：1_globals.js、2_audio_engine.js、3a_media_groups_core.js 之後載入；index.html 需有 #waveCopyAudioBtn / #waveCutMoveAudioBtn / #wavePasteAudioBtn

(function () {
    const FADE_MS = 5;  // 接合處淡入淡出長度（毫秒）
    const MAX_AUDIO_UNDO = 3;  // 音訊復原最多保留幾步
    const MIN_SELECT_SEC = 0.05;  // 選取範圍至少幾秒才允許操作

    // 剪貼簿：{ buffer, mediaDur, markers:[{label,start,end}], groups:[{...相對時間}] }
    let audioClipboard = null;
    // 音訊復原堆疊：{ buffer, times, groups, stateRef }
    const audioEditHistory = [];
    let busy = false;

    // 小工具
    const round3 = x => parseFloat(Number(x).toFixed(3));
    const clone = o => JSON.parse(JSON.stringify(o));

    // timeDataMap 的值可能是 {start,end} 或舊格式的純數字，統一讀成 {start,end}
    function readTime(v) {
        if (v === undefined || v === null) return null;
        if (typeof v === 'object') return { start: v.start, end: (v.end === undefined || v.end === null) ? null : v.end };
        return { start: v, end: null };
    }

    function getEditContext() {
        if (typeof wavesurfer === 'undefined' || !wavesurfer || !wavesurfer.getDecodedData()) return null;
        const buffer = wavesurfer.getDecodedData();
        const mediaDuration = audioPlayer.duration || buffer.duration;
        return {
            buffer,
            sr: buffer.sampleRate,
            ch: buffer.numberOfChannels,
            ratio: mediaDuration / buffer.duration  // media time / buffer time
        };
    }

    // media time（秒）→ buffer 內的 sample 位置
    function toSample(t, c) {
        return Math.max(0, Math.min(c.buffer.length, Math.round((t / c.ratio) * c.sr)));
    }
    // buffer 內的 sample 位置 → media time（秒）
    function toMedia(sample, c) {
        return (sample / c.sr) * c.ratio;
    }

    function sliceSamples(buffer, a, b) {
        const out = createBufferSafe(buffer.numberOfChannels, Math.max(0, b - a), buffer.sampleRate);
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            out.getChannelData(i).set(buffer.getChannelData(i).subarray(a, b));
        }
        return out;
    }

    // 淡出：dst[j-1-i]；淡入：dst[j+i]（j 為接合點，N 為淡化長度）
    function fadeJunction(dst, j, n) {
        const left = Math.min(n, j);
        const right = Math.min(n, dst.length - j);
        for (let i = 0; i < left; i++) dst[j - 1 - i] *= (i + 0.5) / left;
        for (let i = 0; i < right; i++) dst[j + i] *= (i + 0.5) / right;
    }

    // 組出新音訊：buf[0,a) + clip(可為 null) + buf[b,結尾)，並在接合處淡化
    function buildSplicedBuffer(buf, a, b, clip) {
        const clipLen = clip ? clip.length : 0;
        const newLen = a + clipLen + (buf.length - b);
        const out = createBufferSafe(buf.numberOfChannels, newLen, buf.sampleRate);
        const n = Math.max(1, Math.round(buf.sampleRate * FADE_MS / 1000));
        for (let c = 0; c < buf.numberOfChannels; c++) {
            const src = buf.getChannelData(c);
            const dst = out.getChannelData(c);
            dst.set(src.subarray(0, a), 0);
            if (clip) dst.set(clip.getChannelData(Math.min(c, clip.numberOfChannels - 1)), a);
            dst.set(src.subarray(b), a + clipLen);
            if (a > 0 && a < newLen) fadeJunction(dst, a, n);
            if (clip) {
                const j2 = a + clipLen;
                if (j2 > 0 && j2 < newLen) fadeJunction(dst, j2, n);
            }
        }
        return out;
    }

    // 換上新的音訊（流程與 cutAudioRegion 相同）。呼叫前，標記資料必須已經改好。
    // 回傳 Promise：WaveSurfer 重新初始化完成後 resolve。
    function swapInAudio(newBuffer) {
        return new Promise(resolve => {
            const wavBlob = audioBufferToWav(newBuffer);
            const oldSrc = audioPlayer.src;
            const newUrl = URL.createObjectURL(wavBlob);

            audioPlayer.pause();
            audioPlayer.src = newUrl;
            audioPlayer.load();

            // 新音檔載入後才釋放舊的 Blob 網址
            if (oldSrc && oldSrc.startsWith('blob:')) {
                let revoked = false;
                const revokeOld = () => {
                    if (revoked) return;
                    revoked = true;
                    URL.revokeObjectURL(oldSrc);
                };
                audioPlayer.addEventListener('loadeddata', revokeOld, { once: true });
                setTimeout(revokeOld, 5000);
            }

            localStorage.setItem('tagger_localFileName', '剪裁後音檔.wav');
            localStorage.setItem('tagger_isTrimmed', 'true');
            localStorage.setItem('tagger_audioType', 'local');
            if (typeof AudioStore !== 'undefined' && AudioStore.isSupported()) {
                AudioStore.save(wavBlob, { name: '剪裁後音檔.wav' });
            }
            if (typeof saveToStorage === 'function') saveToStorage();

            let done = false;
            const reinit = () => {
                if (done) return;
                done = true;
                audioPlayer.removeEventListener('loadedmetadata', reinit);
                if (typeof initWaveSurfer === 'function') initWaveSurfer();
                if (typeof updateAllTimeDisplays === 'function') updateAllTimeDisplays();
                if (tempRegion) { tempRegion.remove(); tempRegion = null; }
                if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
                resolve();
            };
            audioPlayer.addEventListener('loadedmetadata', reinit, { once: true });
            setTimeout(reinit, 1500);
        });
    }

    // 把聲波視窗捲到指定範圍：範圍放得下就置中，放不下就讓開頭落在畫面左側約 15% 處
    function scrollWaveTo(start, end) {
        try {
            if (!wavesurfer || typeof wavesurfer.setScrollTime !== 'function') return;
            const wrapper = wavesurfer.getWrapper();
            const view = wrapper && wrapper.parentElement;
            const dur = audioPlayer.duration;
            if (!view || !dur || !wrapper.scrollWidth) return;
            const visibleSec = (view.clientWidth / wrapper.scrollWidth) * dur;
            const len = end - start;
            const target = len <= visibleSec * 0.8 ? start + len / 2 - visibleSec / 2 : start - visibleSec * 0.15;
            wavesurfer.setScrollTime(Math.max(0, target));
        } catch (err) { console.warn('[AudioClipboard] 捲動聲波失敗', err); }
    }

    // 列表焦點：貼上的範圍內有標記 → 焦點給最早的那個標記；沒有標記 → 列表不留任何焦點
    function focusListOnRange(start, end) {
        let found = null, foundStart = Infinity;
        allLabelsOrdered.forEach(label => {
            const t = readTime(timeDataMap[label]);
            if (!t) return;
            const overlap = t.end === null
                ? (t.start >= start - 0.001 && t.start < end)
                : (t.start < end && t.end > start);
            if (overlap && t.start < foundStart) { found = label; foundStart = t.start; }
        });
        if (typeof clearSelection === 'function') clearSelection();
        currentActiveLabel = found;
        lastSelectedLabel = found;
        if (typeof updateSelectionUI === 'function') updateSelectionUI();
        if (found) {
            const itemDiv = document.getElementById(`item-${found}`);
            const inScript = (typeof isScriptMode !== 'undefined' && isScriptMode);
            if (itemDiv && !inScript && typeof smartScrollTo === 'function') smartScrollTo(itemDiv);
        }
    }

    // 依目前列表順序重新排號（同字母連續段落內 01、02、03…），句子文字與時間「跟著列走」，時間不會位移
    function renumberKeepTimes() {
        const newLabels = [], newText = {}, newTime = {};
        let letter = '', count = 0;
        allLabelsOrdered.forEach(old => {
            const L = old.charAt(0);
            if (L !== letter) { letter = L; count = 0; }
            count++;
            const nl = L + String(count).padStart(2, '0');
            newLabels.push(nl);
            newText[nl] = sentenceTextMap[old] || '';
            if (timeDataMap[old] !== undefined) newTime[nl] = timeDataMap[old];
        });
        allLabelsOrdered = newLabels;
        sentenceTextMap = newText;
        timeDataMap = newTime;
    }

    // 貼上後，把「被帶回時間的句子列」（文字 + 時間）移到時間順序正確的位置，再重新排號。
    // 例：C07 剪下貼到 B03 右邊 → 這一列變成 B04，原本的 B04 以後各列往後順延，C 段落自動遞補。
    function moveRowsToChronologicalPosition(labels) {
        const moving = labels.filter(l => allLabelsOrdered.includes(l) && timeDataMap[l] !== undefined);
        if (!moving.length) return;
        const saved = {}, texts = {};
        moving.forEach(l => {
            saved[l] = timeDataMap[l];
            texts[l] = sentenceTextMap[l] || '';
            delete timeDataMap[l];
            delete sentenceTextMap[l];
        });
        allLabelsOrdered = allLabelsOrdered.filter(l => !moving.includes(l));
        moving.sort((x, y) => readTime(saved[x]).start - readTime(saved[y]).start);
        moving.forEach((l, i) => {
            const idx = findChronologicalInsertIndex(readTime(saved[l]).start);  // 3_data_core.js 既有函式
            // 新列沿用前一列的段落字母（沒有前一列就沿用第一列），避免被誤判成新段落
            let prefix = 'A';
            if (idx > 0) prefix = allLabelsOrdered[idx - 1].charAt(0);
            else if (allLabelsOrdered.length > 0) prefix = allLabelsOrdered[0].charAt(0);
            const tmp = prefix + '_MOVE_' + Date.now() + '_' + i;
            allLabelsOrdered.splice(idx, 0, tmp);
            sentenceTextMap[tmp] = texts[l];
            timeDataMap[tmp] = saved[l];
        });
        if (typeof clearSelection === 'function') clearSelection();
        renumberKeepTimes();
    }

    // 重新繪製列表（單句列表 + 全文模式大編輯框）
    function refreshListViews() {
        if (typeof renderSentenceList === 'function') renderSentenceList();
        if (typeof refreshScriptEditorIfNeeded === 'function') refreshScriptEditorIfNeeded();
    }

    // 清掉列表與聲波的句子焦點（沒有任何句子亮起）
    function clearListFocus() {
        if (typeof clearSelection === 'function') clearSelection();
        currentActiveLabel = null;
        lastSelectedLabel = null;
        if (typeof updateSelectionUI === 'function') updateSelectionUI();
    }

    // 在 WaveSurfer 解碼完成後，把游標放到 playheadTime，並（可選）框選 [selStart, selEnd]。
    // focusMode：
    // 'paste' = 聲波捲到貼上的範圍，依範圍內有無標記決定列表焦點
    // 'cut'   = 聲波捲到剪接點（游標處），列表不留任何焦點
    function afterReady(playheadTime, selStart, selEnd, focusMode) {
        if (!wavesurfer) return;
        // 通知 6_wave_controller 的 ready 處理，不要用「上次選取的句子」覆蓋游標位置
        if (typeof playheadTime === 'number') window.pendingSeekTime = playheadTime;
        wavesurfer.once('ready', () => {
            try {
                if (playheadTime !== null && playheadTime !== undefined) wavesurfer.setTime(playheadTime);
                if (selStart !== undefined && selEnd !== undefined && wsRegions) {
                    wsRegions.addRegion({ start: selStart, end: selEnd, color: 'rgba(33, 150, 243, 0.3)', drag: true, resize: true });
                    if (typeof updateToolbarButtons === 'function') updateToolbarButtons();
                }
                if (focusMode === 'paste') {
                    focusListOnRange(selStart, selEnd);
                    scrollWaveTo(selStart, selEnd);
                    if (typeof snapWaveformToTop === 'function') snapWaveformToTop();
                } else if (focusMode === 'cut') {
                    clearListFocus();
                    scrollWaveTo(playheadTime, playheadTime);
                    if (typeof snapWaveformToTop === 'function') snapWaveformToTop();
                }
            } catch (err) { console.warn('[AudioClipboard] 還原游標／選取失敗', err); }
        });
    }

    // 編輯前拍下復原快照（音檔本體 + 時間標記 + 跨句範圍）
    function pushAudioUndo(buffer) {
        if (typeof saveState === 'function') saveState();  // 同步拍下句子資料快照，讓 Ctrl+Z 的堆疊順序一致
        audioEditHistory.push({
            buffer: buffer,
            labels: clone(allLabelsOrdered),  // 貼上會移動句子列，復原時要一起還原
            texts: clone(sentenceTextMap),
            times: clone(timeDataMap),
            groups: clone(mediaGroups),
            stateRef: (typeof undoStack !== 'undefined' && undoStack.length) ? undoStack[undoStack.length - 1] : null
        });
        while (audioEditHistory.length > MAX_AUDIO_UNDO) audioEditHistory.shift();
    }

    function getRegionSelection() {
        if (!tempRegion) return null;
        const c = getEditContext();
        if (!c) return null;
        const dur = audioPlayer.duration || c.buffer.duration * c.ratio;
        const s = Math.max(0, Math.min(tempRegion.start, tempRegion.end));
        const e = Math.min(dur, Math.max(tempRegion.start, tempRegion.end));
        if (e - s < MIN_SELECT_SEC) return null;
        return { s, e, c };
    }

    // 複製
    function copyAudio() {
        if (busy) return;
        const sel = getRegionSelection();
        if (!sel) return showToast('請先用滑鼠在聲波圖上框選要複製的範圍 (藍色框)', 'error');
        const { s, e, c } = sel;
        const a = toSample(s, c), b = toSample(e, c);
        if (b <= a) return showToast('選取範圍太短', 'error');
        audioClipboard = {
            buffer: sliceSamples(c.buffer, a, b),
            mediaDur: toMedia(b - a, c),
            markers: [],
            groups: []
        };
        showToast(`已複製 ${audioClipboard.mediaDur.toFixed(2)} 秒音訊，移動游標後按 Ctrl+V 貼上`, 'success');
    }

    // 剪下（標記一起帶走）
    async function cutAudioMoveMarkers() {
        if (busy) return;
        if (!isEditMode) return showToast('目前不是編輯模式', 'error');
        const sel = getRegionSelection();
        if (!sel) return showToast('請先用滑鼠在聲波圖上框選要剪下的範圍 (藍色框)', 'error');
        const { s, e, c } = sel;
        const a = toSample(s, c), b = toSample(e, c);
        if (b <= a) return showToast('選取範圍太短', 'error');
        if (c.buffer.length - (b - a) < c.sr * 0.1) return showToast('剪下後音檔會幾乎為空，已取消', 'error');

        busy = true;
        try {
            const s2 = toMedia(a, c), e2 = toMedia(b, c), d = e2 - s2;
            const EPS = 0.0005;
            const clip = sliceSamples(c.buffer, a, b);
            const newBuffer = buildSplicedBuffer(c.buffer, a, b, null);

            pushAudioUndo(c.buffer);

            // 1. 時間標記：完全落在範圍內的帶走，其餘位移
            const mapCut = x => (x <= s2 ? x : (x >= e2 ? x - d : s2));
            const carriedMarkers = [];
            Object.keys(timeDataMap).forEach(label => {
                const t = readTime(timeDataMap[label]);
                if (!t) return;
                const inside = t.start >= s2 - EPS && t.start < e2 && (t.end === null || t.end <= e2 + EPS);
                if (inside) {
                    carriedMarkers.push({
                        label,
                        start: t.start - s2,
                        end: t.end === null ? null : t.end - s2
                    });
                    delete timeDataMap[label];
                } else {
                    timeDataMap[label] = {
                        start: round3(mapCut(t.start)),
                        end: t.end === null ? null : round3(mapCut(t.end))
                    };
                }
            });

            // 2. 跨句範圍(mediaGroups)：完全落在範圍內的帶走，其餘位移
            const carriedGroups = [];
            for (let i = mediaGroups.length - 1; i >= 0; i--) {
                const g = mediaGroups[i];
                if (g.startTime >= s2 - EPS && g.endTime <= e2 + EPS) {
                    carriedGroups.unshift({ ...g, startTime: g.startTime - s2, endTime: g.endTime - s2 });
                    mediaGroups.splice(i, 1);
                } else {
                    g.startTime = round3(mapCut(g.startTime));
                    g.endTime = round3(mapCut(g.endTime));
                    if (g.endTime - g.startTime < 0.01) mediaGroups.splice(i, 1);  // 縮成一點的群組無意義，移除
                }
            }

            audioClipboard = { buffer: clip, mediaDur: d, markers: carriedMarkers, groups: carriedGroups };

            await swapInAudio(newBuffer);
            afterReady(Math.min(s2, audioPlayer.duration || s2), undefined, undefined, 'cut');  // 游標放在剪接點，聲波捲過去，列表不留焦點
            const extra = carriedMarkers.length ? `，已帶走 ${carriedMarkers.length} 個標記` : '';
            showToast(`已剪下 ${d.toFixed(2)} 秒${extra}。移動游標後按 Ctrl+V 貼上（Ctrl+Z 可復原）`, 'success');
        } catch (err) {
            console.error('[AudioClipboard] 剪下失敗：', err);
            showToast('剪下失敗，請查看主控台訊息', 'error');
        } finally {
            busy = false;
        }
    }

    // 貼上
    async function pasteAudio() {
        if (busy) return;
        if (!audioClipboard) return showToast('剪貼簿是空的，請先複製或剪下一段音訊', 'error');
        if (!isEditMode) return showToast('目前不是編輯模式', 'error');
        const c = getEditContext();
        if (!c) return showToast('無有效音檔', 'error');
        if (audioClipboard.buffer.sampleRate !== c.sr) {
            return showToast('剪貼簿音訊的取樣率與目前音檔不同，無法貼上', 'error');
        }

        busy = true;
        try {
            const clip = audioClipboard.buffer;
            const at = toSample(audioPlayer.currentTime, c);
            const t2 = toMedia(at, c);
            const d = toMedia(clip.length, c);
            const newBuffer = buildSplicedBuffer(c.buffer, at, at, clip);

            pushAudioUndo(c.buffer);

            // 1. 既有標記位移：開始時間 >= t 的往後推；結束時間 > t 的往後推（跨過游標的標記會被拉長）
            const mapStart = x => (x >= t2 ? x + d : x);
            const mapEnd = x => (x > t2 ? x + d : x);
            let stretched = 0;
            Object.keys(timeDataMap).forEach(label => {
                const t = readTime(timeDataMap[label]);
                if (!t) return;
                if (t.start < t2 && t.end !== null && t.end > t2) stretched++;
                timeDataMap[label] = {
                    start: round3(mapStart(t.start)),
                    end: t.end === null ? null : round3(mapEnd(t.end))
                };
            });
            mediaGroups.forEach(g => {
                g.startTime = round3(mapStart(g.startTime));
                g.endTime = round3(mapEnd(g.endTime));
            });

            // 2. 帶回剪下時帶走的標記（label 還在、而且目前沒有時間標記才帶回）
            let restored = 0, skipped = 0;
            const restoredLabels = [];  // 記下被帶回時間的 label
            audioClipboard.markers.forEach(m => {
                if (!allLabelsOrdered.includes(m.label) || timeDataMap[m.label] !== undefined) { skipped++; return; }
                timeDataMap[m.label] = {
                    start: round3(t2 + m.start),
                    end: m.end === null ? null : round3(t2 + m.end)
                };
                restoredLabels.push(m.label);
                restored++;
            });
            // 帶回的句子列（文字 + 時間）一起移到時間順序正確的位置並重新排號
            moveRowsToChronologicalPosition(restoredLabels);
            audioClipboard.groups.forEach(g => {
                const id = findMediaGroupById(g.id) ? generateMediaGroupId() : g.id;
                mediaGroups.push({ ...g, id, startTime: round3(t2 + g.startTime), endTime: round3(t2 + g.endTime) });
            });
            // 帶回一次就清掉，避免重複貼上時重複帶回
            audioClipboard.markers = [];
            audioClipboard.groups = [];

            await swapInAudio(newBuffer);
            refreshListViews();  // 列表編號變了，重新繪製
            afterReady(t2, t2, t2 + d, 'paste');  // 游標放在貼上段落開頭（按空白鍵就能試聽），框選剛貼上的範圍，聲波捲過去並更新列表焦點
            let msg = `已貼上 ${d.toFixed(2)} 秒音訊`;
            if (restored) msg += `，已帶回 ${restored} 個標記，句子列已依時間順序重新排號`;
            if (skipped) msg += `（${skipped} 個標記因句子已不存在或已有時間而略過）`;
            if (stretched) msg += `。注意：游標位於 ${stretched} 個標記內，該標記已被拉長`;
            showToast(msg, 'success');
        } catch (err) {
            console.error('[AudioClipboard] 貼上失敗：', err);
            showToast('貼上失敗，請查看主控台訊息', 'error');
        } finally {
            busy = false;
        }
    }

    // 復原最近一次音訊編輯
    async function undoAudioEdit() {
        const entry = audioEditHistory.pop();
        if (!entry || busy) return;
        busy = true;
        try {
            if (typeof undoStack !== 'undefined' && undoStack.length && undoStack[undoStack.length - 1] === entry.stateRef) {
                undoStack.pop();  // 移除當時 saveState 拍的快照，避免多一步空的復原
            }
            if (typeof redoStack !== 'undefined') redoStack = [];
            if (entry.labels) { allLabelsOrdered = entry.labels; sentenceTextMap = entry.texts; }
            timeDataMap = entry.times;
            mediaGroups.length = 0;
            entry.groups.forEach(g => mediaGroups.push(g));
            const resumeAt = audioPlayer.currentTime;
            await swapInAudio(entry.buffer);
            refreshListViews();
            afterReady(resumeAt);
            showToast('已復原音訊編輯（音訊編輯不支援重做）', 'success');
        } catch (err) {
            console.error('[AudioClipboard] 復原失敗：', err);
            showToast('復原失敗，請查看主控台訊息', 'error');
        } finally {
            busy = false;
        }
    }

    // 包裝全域 performUndo：如果「最近一步」是音訊編輯，優先復原音訊；否則走原本的流程
    const origPerformUndo = window.performUndo;
    if (typeof origPerformUndo === 'function') {
        window.performUndo = function () {
            // 清掉已經被別的流程擠掉的過期紀錄
            while (audioEditHistory.length) {
                const top = audioEditHistory[audioEditHistory.length - 1];
                const stillInStack = top.stateRef && undoStack.includes(top.stateRef);
                if (stillInStack) break;
                audioEditHistory.pop();
            }
            const top = audioEditHistory[audioEditHistory.length - 1];
            if (top && undoStack.length && undoStack[undoStack.length - 1] === top.stateRef) {
                return undoAudioEdit();
            }
            return origPerformUndo.apply(this, arguments);
        };
    }

    // 刪除「顯示中的靜音／短雜訊區塊」（真的從音檔刪除）
    // 流程：聲波「⋮」選單先開「顯示靜音區塊／顯示短雜訊」→ 用「播放略過」的設定調到滿意 → 按「刪除顯示中的區塊」。
    // 看到什麼就刪什麼；有藍色選取框（或選取標記）時只刪範圍內的區段，否則刪整份音檔。
    // 區段來源：SkipSilence.getViewRanges()（buffer 時間）。一律對「原始音訊」切，不是人聲強化後的分析用音訊。
    // 標記位移：mapT(t) = t − 此時間點之前被刪掉的總長（media time，已用 timeRatio 換算）。
    const fmtClock = sec => {
        sec = Math.max(0, Math.round(sec));
        return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
    };

    // 排序並合併重疊的 [a, b]
    function mergeCuts(list) {
        list.sort((x, y) => x[0] - y[0]);
        const out = [];
        for (const r of list) {
            const last = out[out.length - 1];
            if (last && r[0] <= last[1]) { if (r[1] > last[1]) last[1] = r[1]; }
            else out.push([r[0], r[1]]);
        }
        return out;
    }

    // 刪除範圍（media time）：藍色選取框 > 選取的標記 > null（整份音檔）
    function getRemoveScope() {
        if (tempRegion) {
            const s = Math.min(tempRegion.start, tempRegion.end), e = Math.max(tempRegion.start, tempRegion.end);
            if (e - s >= MIN_SELECT_SEC) return [[s, e]];
        }
        if (typeof selectedLabels !== 'undefined' && selectedLabels.length) {
            const list = [];
            selectedLabels.forEach(l => {
                const t = readTime(timeDataMap[l]);
                if (t && t.end !== null) list.push([t.start, t.end]);
            });
            return list;  // 可能是空的：選了標記卻沒有可用的時間範圍 → 沒有可刪的區段
        }
        return null;
    }

    // 算出要刪的 sample 區段（已限制在範圍內、合併排序）。很輕量，選單開啟時也會呼叫。
    function planCuts() {
        const c = getEditContext();
        if (!c || typeof SkipSilence === 'undefined') return null;
        const v = SkipSilence.getViewRanges();
        if (!v.ranges.length || v.sr !== c.sr || v.len !== c.buffer.length) return { c, cuts: [], scoped: false, v };
        let cuts = v.ranges.map(([a, b]) => [Math.round(a * c.sr), Math.round(b * c.sr)]);
        const scope = getRemoveScope();
        if (scope) {
            const sc = scope.map(([s, e]) => [toSample(s, c), toSample(e, c)]);
            const out = [];
            cuts.forEach(([a, b]) => sc.forEach(([s, e]) => {
                const x = Math.max(a, s), y = Math.min(b, e);
                if (y > x) out.push([x, y]);
            }));
            cuts = out;
        }
        cuts = mergeCuts(cuts.filter(([a, b]) => b > a));
        const removed = cuts.reduce((n, [a, b]) => n + (b - a), 0);
        return { c, cuts, scoped: !!scope, removedSamples: removed, removedMediaSec: toMedia(removed, c), v };
    }

    // 組出新音訊：依序串起保留的片段，每個接縫做 5ms 淡出／淡入（與 buildSplicedBuffer 相同）
    function buildMultiCutBuffer(buf, cuts) {
        let removed = 0;
        cuts.forEach(([a, b]) => { removed += b - a; });
        const newLen = buf.length - removed;
        const out = createBufferSafe(buf.numberOfChannels, newLen, buf.sampleRate);
        const n = Math.max(1, Math.round(buf.sampleRate * FADE_MS / 1000));
        for (let ch = 0; ch < buf.numberOfChannels; ch++) {
            const src = buf.getChannelData(ch), dst = out.getChannelData(ch);
            let pos = 0, from = 0;
            const joints = [];
            for (const [a, b] of cuts) {
                if (a > from) { dst.set(src.subarray(from, a), pos); pos += a - from; }
                if (pos > 0 && pos < newLen) joints.push(pos);
                from = b;
            }
            if (from < buf.length) dst.set(src.subarray(from), pos);
            joints.forEach(j => fadeJunction(dst, j, n));
        }
        return out;
    }

    // 時間標記／跨句範圍的位移規則（media time）
    function makeMapper(cuts, c) {
        const cm = cuts.map(([a, b]) => [toMedia(a, c), toMedia(b, c)]);
        const removedBefore = t => {
            let r = 0;
            for (const [s, e] of cm) { if (s >= t) break; r += Math.min(t, e) - s; }
            return r;
        };
        return { removedBefore, mapT: t => t - removedBefore(t), firstCutStart: cm.length ? cm[0][0] : 0 };
    }

    // 整段（或幾乎整段）被刪光的標記：回傳要清除時間的 label 清單
    function findWipedLabels(removedBefore) {
        const wiped = [];
        Object.keys(timeDataMap).forEach(label => {
            const t = readTime(timeDataMap[label]);
            if (!t || t.end === null) return;
            const len = t.end - t.start;
            if (len >= 0.02 && len - (removedBefore(t.end) - removedBefore(t.start)) < 0.02) wiped.push(label);
        });
        return wiped;
    }

    async function doRemoveRanges(plan) {
        if (busy) return;
        const { c, cuts } = plan;
        busy = true;
        try {
            const newBuffer = buildMultiCutBuffer(c.buffer, cuts);
            const { removedBefore, mapT, firstCutStart } = makeMapper(cuts, c);
            const wiped = findWipedLabels(removedBefore);

            pushAudioUndo(c.buffer);

            wiped.forEach(l => { delete timeDataMap[l]; });  // 文字保留，只清除時間
            Object.keys(timeDataMap).forEach(label => {
                const t = readTime(timeDataMap[label]);
                if (!t) return;
                timeDataMap[label] = { start: round3(mapT(t.start)), end: t.end === null ? null : round3(mapT(t.end)) };
            });
            for (let i = mediaGroups.length - 1; i >= 0; i--) {
                const g = mediaGroups[i];
                g.startTime = round3(mapT(g.startTime));
                g.endTime = round3(mapT(g.endTime));
                if (g.endTime - g.startTime < 0.01) mediaGroups.splice(i, 1);
            }

            await swapInAudio(newBuffer);
            refreshListViews();
            const newDur = toMedia(newBuffer.length, c);
            afterReady(Math.min(mapT(firstCutStart), newDur), undefined, undefined, 'cut');
            let msg = `已刪除 ${cuts.length} 段，共 ${plan.removedMediaSec.toFixed(1)} 秒（Ctrl+Z 可復原）`;
            if (wiped.length) msg += `。${wiped.length} 句因整段被刪而清除時間，文字已保留`;
            showToast(msg, 'success');
        } catch (err) {
            console.error('[AudioClipboard] 刪除區塊失敗：', err);
            showToast('刪除失敗，請查看主控台訊息', 'error');
        } finally {
            busy = false;
        }
    }

    function removeViewRanges() {
        if (busy) return;
        if (!isEditMode) return showToast('目前不是編輯模式', 'error');
        const plan = planCuts();
        if (!plan) return showToast('請先載入音檔', 'error');
        if (!plan.cuts.length) {
            return showToast(plan.scoped ? '選取範圍內沒有顯示中的區塊' : '請先在選單開啟「顯示靜音區塊」或「顯示短雜訊」', 'error');
        }
        const { c } = plan;
        if (c.buffer.length - plan.removedSamples < c.sr * 0.1) return showToast('刪除後音檔會幾乎為空，已取消', 'error');

        const totalSec = c.buffer.length / c.sr * c.ratio;
        const afterSec = totalSec - plan.removedMediaSec;
        const wiped = findWipedLabels(makeMapper(plan.cuts, c).removedBefore);
        let html = `將刪除${plan.scoped ? '<strong>選取範圍內</strong>的 ' : ' '}<strong style="color:#C62828;">${plan.cuts.length}</strong> 段，`
            + `音檔 <strong>${fmtClock(totalSec)} → ${fmtClock(afterSec)}</strong>。<br>此動作會真的修改音檔，可用 Ctrl+Z 復原。`;
        if (plan.v && plan.v.kept) html += `<br><span style="color:#2E7D32;">已保留 ${plan.v.kept} 段（不刪除）。</span>`;
        if (wiped.length) html += `<br><span style="color:#E65100;">${wiped.length} 句因整段被刪，其時間標記會被清除（文字保留）。</span>`;
        if (plan.v && plan.v.sil && plan.v.noise) html += `<br><span style="color:#5f6368;">提示：靜音與雜訊同時顯示，兩者一併刪除。想更徹底，可先只刪雜訊，再重新偵測靜音。</span>`;
        showCustomDialog({ title: '刪除顯示中的區塊', message: html, onConfirm: () => doRemoveRanges(plan) });
    }

    // 選單項目：沒有可刪的區塊時反灰，有的話顯示「N 段，約 X 秒」
    function refreshRemoveItem() {
        const item = document.getElementById('waveRemoveViewBtn');
        const label = document.getElementById('waveRemoveViewLabel');
        if (!item || !label) return;
        const p = planCuts();
        const n = p ? p.cuts.length : 0;
        item.style.opacity = n ? '1' : '0.45';
        const kept = (p && p.v && p.v.kept) || 0;
        label.textContent = n
            ? `刪除顯示中的區塊（${n} 段，約 ${p.removedMediaSec.toFixed(1)} 秒${p.scoped ? '・選取範圍' : ''}${kept ? '・保留 ' + kept + ' 段' : ''}）`
            : (kept ? '刪除顯示中的區塊（全部已保留）' : '刪除顯示中的區塊');
    }
    document.getElementById('waveRemoveViewBtn')?.addEventListener('click', () => { closeWaveMenu(); removeViewRanges(); });
    document.getElementById('waveMoreBtn')?.addEventListener('click', () => setTimeout(refreshRemoveItem, 0));
    if (typeof SkipSilence !== 'undefined') SkipSilence.onViewChange(refreshRemoveItem);

    // 選單按鈕與快捷鍵
    function closeWaveMenu() {
        document.getElementById('waveMoreMenu')?.classList.remove('show');
    }
    document.getElementById('waveCopyAudioBtn')?.addEventListener('click', () => { closeWaveMenu(); copyAudio(); });
    document.getElementById('waveCutMoveAudioBtn')?.addEventListener('click', () => { closeWaveMenu(); cutAudioMoveMarkers(); });
    document.getElementById('wavePasteAudioBtn')?.addEventListener('click', () => { closeWaveMenu(); pasteAudio(); });

    document.addEventListener('keydown', (e) => {
        if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
        if (e.code !== 'KeyC' && e.code !== 'KeyX' && e.code !== 'KeyV') return;

        const t = e.target;
        const isInputActive = t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.isContentEditable);
        if (isInputActive) return;  // 打字中：交給瀏覽器
        if (String(window.getSelection ? window.getSelection() : '').length > 0) return;  // 有選取文字：交給瀏覽器
        if (document.querySelector('.modal-overlay.show, #customDialogOverlay.show')) return;  // 有對話框開著
        if (typeof wavesurfer === 'undefined' || !wavesurfer || !wavesurfer.getDecodedData()) return;

        if (e.code === 'KeyC') {
            if (!tempRegion) return;  // 沒有框選：不攔截
            e.preventDefault(); copyAudio();
        } else if (e.code === 'KeyX') {
            if (!tempRegion) return;
            e.preventDefault(); cutAudioMoveMarkers();
        } else if (e.code === 'KeyV') {
            if (!audioClipboard) return;  // 剪貼簿沒有音訊：不攔截
            e.preventDefault(); pasteAudio();
        }
    });

    window.AudioClipboard = { copy: copyAudio, cut: cutAudioMoveMarkers, paste: pasteAudio, undo: undoAudioEdit, removeViewRanges, hasClip: () => !!audioClipboard };
})();
