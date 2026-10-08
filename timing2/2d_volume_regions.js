// 2d_volume_regions.js: 範圍音量調整（非破壞式：靜音／降低／放大）
// 做法：把「某段時間 × 音量倍率」存成 volumeRegions，不改音檔本身。
//   · 播放：用 Web Audio GainNode 依播放時間套用倍率（0 = 靜音、0.5 = 一半、2 = 兩倍），
//     以 AudioContext 時鐘預先排程，邊緣 8ms 淡入淡出避免爆音；拖曳跳轉、倍速、暫停都會重新排程。
//   · 匯出：sliceAudioBufferForExport()（2_audio_engine.js）切出每個片段後，由 applyToSlice() 把倍率烤進去（逐 sample 精準）。
//   · 資料：只認時間區間（秒），不引用句子 label，句子合併／分割／重新對齊都不影響。
//     區段彼此不重疊：在已有調整的範圍再調整，會「蓋過」舊的；調回 100% 等於清除該範圍。
//     隨專案存檔（localStorage tagger_volumeRegions）、JSON 專案檔（volumeRegions 欄位）、音訊剪下／貼上／刪除／復原一起位移。
// 限制：
//   · 跨網域且未開 CORS 的音檔，瀏覽器不允許 Web Audio 處理 → 播放時不套用（資料仍保存，匯出仍有效）。
//   · 播放時的邊緣位置依 audio.currentTime 排程，可能與實際聽到的有數十毫秒誤差；匯出才是逐 sample 精準。
//   · 放大超過 100% 時，播放與匯出都會在滿格處限幅，原本就大聲的部分可能破音。
// 需求：1_globals.js（volumeRegions、audioPlayer、tempRegion、selectedLabels…）之後載入，建議放在 2b_audio_clipboard.js 旁。
//   index.html 需有 #waveVolumeBtn / #waveVolumeMuteBtn（聲波 ⋮ 選單）。

// ================= 共用音訊處理鏈（與 2a_vocal_enhance.js 共用同一個 MediaElementSource） =================
// createMediaElementSource 對同一個 <audio> 只能呼叫一次，所以由這裡統一建立：
//   audioPlayer → source →（人聲強化處理鏈，若啟用）→ sink(GainNode，音量區段用) → destination
const AudioGraph = (() => {
    let ctx = null, source = null, sink = null;

    // 音檔來源是否允許 Web Audio 處理（blob / data / 同網域）
    function isSafe() {
        const src = audioPlayer.currentSrc || audioPlayer.src || '';
        if (!src) return true;
        if (src.startsWith('blob:') || src.startsWith('data:')) return true;
        try { return new URL(src, location.href).origin === location.origin; }
        catch (e) { return false; }
    }

    // 建立（或取回）處理鏈；來源不安全或瀏覽器不支援時回傳 null
    function ensure() {
        if (ctx) return { ctx, source, sink };
        if (!isSafe()) return null;
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            ctx = new AC();
            source = ctx.createMediaElementSource(audioPlayer);
            sink = ctx.createGain();
            sink.gain.value = 1;
            // 播放端保險：sink 之後接一顆限幅器（只壓過滿格的瞬間峰值），舊專案或手動放大過頭也不會爆音
            const limiter = ctx.createDynamicsCompressor();
            limiter.threshold.value = -1;
            limiter.knee.value = 0;
            limiter.ratio.value = 20;
            limiter.attack.value = 0.002;
            limiter.release.value = 0.08;
            sink.connect(limiter);
            limiter.connect(ctx.destination);
            source.connect(sink);
        } catch (err) {
            console.error('[AudioGraph] 建立失敗：', err);
            ctx = source = sink = null;
            return null;
        }
        return { ctx, source, sink };
    }

    return {
        ensure,
        isSafe,
        peek: () => (ctx ? { ctx, source, sink } : null),
        sink: () => sink
    };
})();
window.AudioGraph = AudioGraph;

// ================= 範圍音量調整 =================
const VolumeRegions = (() => {
    const KEY_EXPORT = 'tagger_volumeApplyExport';
    const MIN_LEN = 0.02;      // 區段最短秒數
    const FADE = 0.008;        // 邊緣淡入淡出（秒）
    const LOOKAHEAD = 4;       // 往前排程幾秒（播放時間）
    const MAX_GAIN = 3;        // 倍率上限（300%）
    const SAFE_PEAK = 0.97;    // 放大後的峰值不超過此值（約 -0.26 dBFS），確保不破音
    const HISTORY_MAX = 10;

    const round3 = x => parseFloat(Number(x).toFixed(3));
    const genId = () => 'vol-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const toast = (m, t) => { if (typeof showToast === 'function') showToast(m, t); };

    let applyOnExport = localStorage.getItem(KEY_EXPORT) === 'true';    // 預設不套用，需要時再勾選
    const history = [];        // 復原用快照（JSON 字串）
    let scheduledTo = 0;       // 已排程到的播放時間
    let layer = null;          // 聲波上的標示層
    let warnedUnsafe = false;

    // ---------- 資料 ----------
    function sanitize() {
        if (!Array.isArray(volumeRegions)) volumeRegions = [];
        const ok = volumeRegions.filter(r => r && isFinite(r.startTime) && isFinite(r.endTime)
            && r.endTime - r.startTime >= 0.005 && isFinite(r.gain) && r.gain >= 0);
        if (ok.length !== volumeRegions.length) volumeRegions = ok;
        return volumeRegions;
    }
    function list() { return sanitize().slice().sort((a, b) => a.startTime - b.startTime); }
    function gainAt(t, ls) {
        for (const r of (ls || list())) if (t >= r.startTime && t < r.endTime) return r.gain;
        return 1;
    }
    function persist() { if (typeof saveToStorage === 'function') saveToStorage(); }
    function pushHistory() {
        history.push(JSON.stringify(sanitize()));
        while (history.length > HISTORY_MAX) history.shift();
    }

    // 把 [s,e) 範圍內的舊區段切掉（保留範圍外的部分）
    function carve(s, e) {
        const next = [];
        sanitize().forEach(r => {
            if (r.endTime <= s || r.startTime >= e) { next.push(r); return; }
            const parts = [];
            if (r.startTime < s && s - r.startTime >= MIN_LEN) parts.push({ ...r, endTime: round3(s) });
            if (r.endTime > e && r.endTime - e >= MIN_LEN) parts.push({ ...r, id: parts.length ? genId() : r.id, startTime: round3(e) });
            next.push(...parts);
        });
        volumeRegions = next;
    }

    // 相鄰且倍率相同的區段合併
    function mergeNeighbours() {
        const ls = list();
        const out = [];
        ls.forEach(r => {
            const p = out[out.length - 1];
            if (p && Math.abs(r.startTime - p.endTime) < 0.0015 && Math.abs(r.gain - p.gain) < 0.001) p.endTime = r.endTime;
            else out.push({ ...r });
        });
        volumeRegions = out;
    }

    // 設定某範圍的倍率（不寫歷史、不觸發更新，由呼叫端統一處理）；倍率 ≈ 1 等於清除
    function setRangeRaw(start, end, gain) {
        start = round3(Math.max(0, start)); end = round3(end);
        if (!isFinite(start) || !isFinite(end) || end - start < MIN_LEN) return false;
        gain = Math.max(0, Math.min(MAX_GAIN, Number(gain)));
        if (!isFinite(gain)) return false;
        carve(start, end);
        if (Math.abs(gain - 1) > 0.001) volumeRegions.push({ id: genId(), startTime: start, endTime: end, gain: round3(gain) });
        mergeNeighbours();
        return true;
    }

    function afterChange() {
        persist();
        renderOverlay();
        resetSchedule();
        if (dlgOpen()) { renderSources(); renderList(); }
    }

    // ---------- 給 2b／2_audio_engine 的位移工具 ----------
    // 剪下：完全落在 [s,e] 內的區段帶走（回傳相對時間，貼上時帶回），其餘位移
    function takeRange(s, e) {
        const d = e - s, EPS = 0.0005, carried = [], keep = [];
        const mapCut = x => (x <= s ? x : (x >= e ? x - d : s));
        sanitize().forEach(r => {
            if (r.startTime >= s - EPS && r.endTime <= e + EPS) {
                carried.push({ ...r, startTime: round3(r.startTime - s), endTime: round3(r.endTime - s) });
                return;
            }
            const a = mapCut(r.startTime), b = mapCut(r.endTime);
            if (b - a >= MIN_LEN) keep.push({ ...r, startTime: round3(a), endTime: round3(b) });
        });
        volumeRegions = keep;
        afterChange();
        return carried;
    }
    // 貼上：跨過插入點的區段從中切開（貼入的音訊不繼承倍率），之後的往後推，再帶回剪下時帶走的
    function insertAt(t, d, carried) {
        const next = [];
        sanitize().forEach(r => {
            if (r.endTime <= t) next.push(r);
            else if (r.startTime >= t) next.push({ ...r, startTime: round3(r.startTime + d), endTime: round3(r.endTime + d) });
            else {
                next.push({ ...r, endTime: round3(t) });
                next.push({ ...r, id: genId(), startTime: round3(t + d), endTime: round3(r.endTime + d) });
            }
        });
        (carried || []).forEach(c => next.push({ ...c, id: genId(), startTime: round3(t + c.startTime), endTime: round3(t + c.endTime) }));
        volumeRegions = next;
        afterChange();
    }
    // 刪除 [s,e]（時間往前補）
    function shiftForCut(s, e, d) {
        const mapCut = x => (x <= s ? x : (x >= e ? x - d : s));
        mapAll(mapCut);
    }
    // 套用任意時間換算函式（刪除多段時用）；縮成一點的區段移除
    function mapAll(mapT) {
        const keep = [];
        sanitize().forEach(r => {
            const a = mapT(r.startTime), b = mapT(r.endTime);
            if (b - a >= MIN_LEN) keep.push({ ...r, startTime: round3(a), endTime: round3(b) });
        });
        volumeRegions = keep;
        afterChange();
    }
    function snapshot() { return JSON.parse(JSON.stringify(sanitize())); }
    function restore(arr) {
        volumeRegions = Array.isArray(arr) ? JSON.parse(JSON.stringify(arr)) : [];
        afterChange();
    }

    // ---------- 不破音：算出某範圍「最多能放大幾倍」 ----------
    // 由原始解碼資料量測峰值（與已設定的調整無關），放大倍率上限 = SAFE_PEAK / 峰值
    const peakCache = new Map();
    function decodedBuffer() {
        return (typeof wavesurfer !== 'undefined' && wavesurfer && wavesurfer.getDecodedData) ? wavesurfer.getDecodedData() : null;
    }
    function peakInRange(start, end) {
        const buf = decodedBuffer();
        if (!buf) return null;
        const key = buf.length + '|' + start.toFixed(3) + '|' + end.toFixed(3);
        if (peakCache.has(key)) return peakCache.get(key);
        const mediaDur = audioPlayer.duration || buf.duration;
        const k = buf.duration / mediaDur;                    // 媒體時間 → buffer 時間
        const sr = buf.sampleRate;
        const i0 = Math.max(0, Math.floor(start * k * sr)), i1 = Math.min(buf.length, Math.ceil(end * k * sr));
        let pk = 0;
        for (let c = 0; c < buf.numberOfChannels; c++) {
            const d = buf.getChannelData(c);
            for (let i = i0; i < i1; i++) { const v = d[i] < 0 ? -d[i] : d[i]; if (v > pk) pk = v; }
        }
        if (peakCache.size > 200) peakCache.clear();
        peakCache.set(key, pk);
        return pk;
    }
    // 回傳該範圍不破音的最大倍率（量不到峰值時視為不設限）
    function safeGainFor(start, end) {
        const pk = peakInRange(start, end);
        if (pk === null || pk < 1e-4) return MAX_GAIN;
        return Math.min(MAX_GAIN, SAFE_PEAK / pk);
    }

    // ---------- 匯出：把倍率烤進切片 ----------
    // sliceBuf：sliceAudioBuffer 切出的新 buffer（可直接修改）；startSec：切片起點（buffer 時間，秒）
    let lastClipWarn = 0;
    function applyToSlice(sliceBuf, startSec, fullBuffer) {
        if (!applyOnExport || !sliceBuf) return sliceBuf;
        const ls = list();
        if (!ls.length) return sliceBuf;
        const sr = sliceBuf.sampleRate, len = sliceBuf.length;
        const mediaDur = audioPlayer.duration || fullBuffer.duration;
        const ratio = mediaDur / fullBuffer.duration;      // media time / buffer time
        let clipped = false;
        ls.forEach(r => {
            const a = Math.round(((r.startTime / ratio) - startSec) * sr);
            const b = Math.round(((r.endTime / ratio) - startSec) * sr);
            const i0 = Math.max(0, a), i1 = Math.min(len, b);
            if (i1 <= i0) return;
            const F = Math.max(1, Math.min(Math.round(sr * FADE), Math.floor((b - a) / 2)));
            // 放大時：以此區段實際峰值決定倍率上限，保證不破音（舊專案裡過大的倍率也會被收斂）
            let gain = r.gain;
            if (gain > 1) {
                let pk = 0;
                for (let c = 0; c < sliceBuf.numberOfChannels; c++) {
                    const d = sliceBuf.getChannelData(c);
                    for (let i = i0; i < i1; i++) { const v = d[i] < 0 ? -d[i] : d[i]; if (v > pk) pk = v; }
                }
                if (pk > 1e-4) gain = Math.max(1, Math.min(gain, SAFE_PEAK / pk));
            }
            for (let c = 0; c < sliceBuf.numberOfChannels; c++) {
                const data = sliceBuf.getChannelData(c);
                for (let i = i0; i < i1; i++) {
                    let k = gain;
                    if (a >= 0 && i - a < F) k = 1 + (gain - 1) * ((i - a + 0.5) / F);          // 起點淡入
                    else if (b <= len && b - i <= F) k = 1 + (gain - 1) * ((b - i - 0.5) / F);   // 終點淡出
                    let v = data[i] * k;
                    if (v > 1) { v = 1; clipped = true; } else if (v < -1) { v = -1; clipped = true; }
                    data[i] = v;
                }
            }
        });
        if (clipped && Date.now() - lastClipWarn > 3000) {
            lastClipWarn = Date.now();
            toast('部分片段在放大後仍超過滿格（例如與其他處理疊加），已限幅', 'normal');
        }
        return sliceBuf;
    }

    // ---------- 播放：GainNode 排程 ----------
    function graph() { return AudioGraph.peek(); }

    function resetSchedule() {
        const g = graph();
        if (!g) return;
        try {
            const p = g.sink.gain, now = g.ctx.currentTime;
            const t0 = audioPlayer.currentTime || 0;
            p.cancelScheduledValues(now);
            p.setValueAtTime(gainAt(t0), now);
            scheduledTo = t0;
            if (!audioPlayer.paused) extendSchedule();
        } catch (err) { console.warn('[VolumeRegions] 排程失敗：', err); }
    }

    function extendSchedule() {
        const g = graph();
        if (!g) return;
        try {
            const p = g.sink.gain, now = g.ctx.currentTime;
            const ls = list();
            const rate = audioPlayer.playbackRate || 1;
            const t0 = audioPlayer.currentTime || 0;
            const horizon = t0 + LOOKAHEAD * rate;
            const from = Math.max(scheduledTo, t0);
            const bounds = new Map();   // 以毫秒為鍵去重（相鄰區段共用同一個邊界）
            ls.forEach(r => {
                [r.startTime, r.endTime].forEach(t => { if (t > from && t <= horizon) bounds.set(Math.round(t * 1000), t); });
            });
            [...bounds.values()].sort((a, b) => a - b).forEach(tb => {
                const before = gainAt(tb - 0.0005, ls), after = gainAt(tb + 0.0005, ls);
                if (Math.abs(before - after) < 1e-4) return;
                const ctxT = now + (tb - t0) / rate;
                p.setValueAtTime(before, Math.max(now, ctxT - FADE / 2));
                p.linearRampToValueAtTime(after, Math.max(now, ctxT + FADE / 2));
            });
            scheduledTo = horizon;
        } catch (err) { console.warn('[VolumeRegions] 排程失敗：', err); }
    }

    function warnUnsafe() {
        if (warnedUnsafe) return;
        warnedUnsafe = true;
        toast('此音檔來自其他網域，瀏覽器限制無法在播放時套用音量調整（匯出音檔時仍會套用）', 'error');
    }

    // 有調整區段時，才在播放前建立處理鏈（沒有調整就完全不介入播放）
    function onPlay() {
        if (!list().length) return;
        const g = AudioGraph.ensure();
        if (!g) { warnUnsafe(); return; }
        resetSchedule();
        if (g.ctx.state === 'suspended') g.ctx.resume().then(resetSchedule).catch(() => {});
    }

    ['playing', 'seeked', 'ratechange', 'pause', 'emptied'].forEach(ev => audioPlayer.addEventListener(ev, resetSchedule));
    audioPlayer.addEventListener('play', onPlay);
    audioPlayer.addEventListener('loadedmetadata', () => {
        renderOverlay();
        resetSchedule();
        if (AudioGraph.peek() && !AudioGraph.isSafe()) {
            toast('目前音檔來自其他網域，但音訊處理已啟用過，播放會變成無聲。請重新整理頁面後再載入此音檔', 'error');
        }
    });
    setInterval(() => {
        if (audioPlayer.paused || !graph()) return;
        const rate = audioPlayer.playbackRate || 1;
        if (scheduledTo - audioPlayer.currentTime < LOOKAHEAD * 0.5 * rate) extendSchedule();
    }, 250);

    // ---------- 聲波上的標示層 ----------
    const pctLabel = g => (g < 0.001 ? '靜音' : Math.round(g * 100) + '%');
    const fmt = t => { const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + s.toFixed(2).padStart(5, '0'); };

    function renderOverlay() {
        injectStyle();    // 主文件（對話框）
        if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
        layer = null;
        if (typeof wavesurfer === 'undefined' || !wavesurfer || !wavesurfer.getWrapper) return;
        const wrapper = wavesurfer.getWrapper();
        // 聲波在 Shadow DOM 內：把樣式也放進 ShadowRoot，標示層才會正確定位在聲波上
        const rootNode = wrapper && wrapper.getRootNode ? wrapper.getRootNode() : null;
        if (rootNode && rootNode !== document && rootNode.host) injectStyle(rootNode);
        const dur = audioPlayer.duration || (wavesurfer.getDuration ? wavesurfer.getDuration() : 0);
        const ls = list();
        if (!wrapper || !dur || !ls.length) return;
        layer = document.createElement('div');
        layer.className = 'vol-layer';
        ls.forEach(r => {
            const seg = document.createElement('div');
            seg.className = 'vol-seg ' + (r.gain < 0.001 ? 'mute' : (r.gain < 1 ? 'down' : 'up'));
            seg.style.left = (r.startTime / dur * 100) + '%';
            seg.style.width = Math.max(0.05, (r.endTime - r.startTime) / dur * 100) + '%';
            seg.title = `${fmt(r.startTime)} – ${fmt(r.endTime)}：${pctLabel(r.gain)}`;
            const tag = document.createElement('span');
            tag.className = 'vol-tag';
            tag.textContent = pctLabel(r.gain);
            seg.appendChild(tag);
            layer.appendChild(seg);
        });
        wrapper.appendChild(layer);
    }

    // WaveSurfer 每次重建（換音檔、剪下、貼上）都要重新掛上標示層
    function hookWave() {
        if (typeof wavesurfer === 'undefined' || !wavesurfer || wavesurfer.__volHooked) return;
        wavesurfer.__volHooked = true;
        wavesurfer.on('ready', renderOverlay);
        wavesurfer.on('decode', renderOverlay);
        renderOverlay();
    }
    const origInit = window.initWaveSurfer;
    if (typeof origInit === 'function') {
        window.initWaveSurfer = function (...args) {
            const result = origInit.apply(this, args);
            hookWave();
            return result;
        };
    }
    hookWave();

    // ---------- 選取來源：藍色選取框 或 所選標記 ----------
    function resolveSources() {
        const out = { box: null, markers: null };
        const dur = audioPlayer.duration || 0;
        if (typeof tempRegion !== 'undefined' && tempRegion) {
            const s = Math.max(0, Math.min(tempRegion.start, tempRegion.end));
            const e = Math.min(dur || Infinity, Math.max(tempRegion.start, tempRegion.end));
            if (e - s >= MIN_LEN) out.box = { start: s, end: e };
        }
        const sel = (typeof selectedLabels !== 'undefined' && selectedLabels.length) ? selectedLabels.slice() : [];
        const labels = sel;    // 只算明確選取的標記；游標停在某句不等於選取
        const ranges = [];
        labels.forEach(l => {
            if (typeof timeDataMap === 'undefined' || timeDataMap[l] === undefined) return;
            const t = getCalculatedTimes(l);
            if (t && t.end - t.start >= MIN_LEN) ranges.push({ label: l, start: t.start, end: t.end });
        });
        ranges.sort((a, b) => a.start - b.start);
        if (ranges.length) out.markers = { ranges, multi: sel.length > 1 };
        return out;
    }

    function canEdit() {
        if (!audioPlayer.duration) { toast('請先載入音檔', 'error'); return false; }
        if (typeof isEditMode !== 'undefined' && !isEditMode) { toast('目前不是編輯模式', 'error'); return false; }
        return true;
    }

    // 對一組範圍套用倍率（整批算一步復原）
    // 放大（gain > 1）時，每個範圍各自限制在「不破音上限」以內；已接近滿格的範圍直接略過，不強迫放大
    // 結果摘要放在 lastApply：{ n 已套用段數, capped 被限制的段數, skipped 因無法放大而略過的段數, minCapPct }
    let lastApply = { n: 0, capped: 0, skipped: 0, minCapPct: 0 };
    function applyToRanges(ranges, gain) {
        const plan = [];
        let capped = 0, skipped = 0, minCapPct = Infinity;
        ranges.forEach(r => {
            let g = gain;
            if (gain > 1) {
                const cap = safeGainFor(r.start, r.end);
                if (cap < 1.01) { skipped++; return; }
                if (g > cap) { g = Math.floor(cap * 100) / 100; capped++; minCapPct = Math.min(minCapPct, Math.round(g * 100)); }
            }
            plan.push({ r, g });
        });
        lastApply = { n: 0, capped, skipped, minCapPct: isFinite(minCapPct) ? minCapPct : 0 };
        if (!plan.length) return 0;
        pushHistory();
        let n = 0;
        plan.forEach(({ r, g }) => { if (setRangeRaw(r.start, r.end, g)) n++; });
        lastApply.n = n;
        afterChange();
        if (n && Math.abs(gain - 1) > 0.001) {
            const g = AudioGraph.ensure();    // 在使用者操作當下建立處理鏈
            if (!g) warnUnsafe();
            else if (g.ctx.state === 'suspended') g.ctx.resume().then(resetSchedule).catch(() => {});
        }
        return n;
    }

    // 選單「靜音選取範圍」：一鍵靜音（優先用藍色選取框，否則用所選標記）
    function quickMute() {
        if (!canEdit()) return;
        const src = resolveSources();
        const ranges = src.box ? [src.box] : (src.markers ? src.markers.ranges : []);
        if (!ranges.length) return toast('請先框選範圍（藍色框）或選取標記', 'error');
        const n = applyToRanges(ranges, 0);
        toast(`已靜音 ${n} 段（可在「調整選取範圍音量」復原上一步）`, 'success');
    }

    // ---------- 對話框 ----------
    let ov = null, chosenSource = 'box', lastPct = 0, prevBodyOverflow = '', safeInfo = null;
    const $ = id => document.getElementById(id);
    function dlgOpen() { return !!ov && ov.classList.contains('show'); }

    // root 省略 = 主文件（對話框用）；傳入 WaveSurfer 的 ShadowRoot = 聲波裡的標示層用
    // WaveSurfer 7 的聲波容器在 Shadow DOM 內，主文件的 CSS 進不去，必須另外注入一份
    function injectStyle(root) {
        const host = (root && root !== document) ? root : document.head;
        if (host.querySelector('#volStyle')) return;
        const st = document.createElement('style');
        st.id = 'volStyle';
        st.textContent = `
.vol-layer{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:3;}
.vol-seg{position:absolute;top:0;height:100%;box-sizing:border-box;border-left:1px solid;border-right:1px solid;}
.vol-seg.mute{background:repeating-linear-gradient(135deg,rgba(198,40,40,.38) 0,rgba(198,40,40,.38) 4px,rgba(198,40,40,.14) 4px,rgba(198,40,40,.14) 8px);border-color:rgba(198,40,40,.9);}
.vol-seg.down{background:rgba(255,179,0,.28);border-color:#F9A825;}
.vol-seg.up{background:rgba(67,160,71,.26);border-color:#2E7D32;}
.vol-tag{position:absolute;left:2px;bottom:2px;z-index:4;font-size:10px;line-height:1.2;padding:0 3px;border-radius:3px;background:rgba(255,255,255,.85);color:#37474F;max-width:100%;overflow:hidden;white-space:nowrap;}
#volOverlay .vol-box{background:#fff;border-radius:16px;width:min(94vw,460px);max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.28);font-size:.95rem;color:#3c4043;}
#volOverlay .vol-head{flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:12px 12px 12px 20px;border-bottom:1px solid #eceff1;}
#volOverlay .vol-title{flex:1;display:flex;align-items:center;gap:6px;font-weight:700;font-size:1.1rem;color:#00796B;}
#volOverlay .vol-body{flex:1 1 auto;overflow:auto;padding:6px 20px 14px;}
#volOverlay .vol-sec{padding:12px 0;border-bottom:1px solid #f1f3f4;}
#volOverlay .vol-sec:last-child{border-bottom:none;}
#volOverlay .vol-label{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:700;margin:0 0 8px;color:#5f6368;}
#volOverlay .vol-src{display:flex;align-items:flex-start;gap:8px;padding:4px 0;cursor:pointer;line-height:1.5;}
#volOverlay .vol-hint{font-size:.85rem;color:#80868b;margin-top:4px;line-height:1.5;}
#volOverlay .vol-hint:empty{display:none;}
#volOverlay .vol-safe{font-size:.82rem;line-height:1.5;margin-top:10px;color:#80868b;}
#volOverlay .vol-safe:empty{display:none;}
#volOverlay .vol-safe.warn{color:#D84315;}
#volOverlay .vol-row{display:flex;align-items:center;gap:8px;}
#volOverlay .vol-row input[type=range]{flex:1;min-width:0;}
#volOverlay .vol-row input[type=number]{width:68px;padding:5px 6px;border:1px solid #dadce0;border-radius:6px;box-sizing:border-box;}
#volOverlay .vol-db{font-weight:400;color:#00796B;}
#volOverlay .vol-quick{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}
#volOverlay button{flex:none;min-width:0;display:inline-flex;align-items:center;justify-content:center;gap:4px;cursor:pointer;border:1px solid #dadce0;background:#f8f9fa;color:#3c4043;border-radius:8px;padding:6px 12px;font-size:.9rem;font-weight:700;}
#volOverlay button:hover{background:#eef1f3;}
#volOverlay button.primary{background:#00897B;border-color:#00897B;color:#fff;}
#volOverlay button.primary:hover{background:#00796B;}
#volOverlay button:disabled{opacity:.45;cursor:not-allowed;}
#volOverlay .vol-quick button{padding:5px 12px;font-size:.85rem;}
#volOverlay .vol-quick button.over{border-style:dashed;color:#9aa0a6;}
#volOverlay .vol-quick button.max{background:#E0F2F1;border-color:#80CBC4;color:#00695C;}
#volOverlay .vol-x{width:34px;height:34px;padding:0;border:none;background:transparent;border-radius:50%;color:#5f6368;}
#volOverlay .vol-x:hover{background:#f1f3f4;}
#volOverlay .vol-x .material-icons{font-size:1.4rem;}
#volOverlay .vol-actions{flex:0 0 auto;display:flex;gap:8px;padding:12px 20px;border-top:1px solid #eceff1;background:#fafafa;}
#volOverlay .vol-actions button{padding:9px 12px;}
#volOverlay .vol-actions .primary{flex:1.4;}
#volOverlay .vol-actions button:not(.primary){flex:1;}
#volOverlay .vol-tools{display:flex;justify-content:flex-end;gap:6px;margin-top:8px;}
#volOverlay .vol-tools button{padding:3px 10px;font-size:.8rem;font-weight:600;}
#volOverlay .vol-empty{padding:10px 0 4px;color:#5f6368;line-height:1.6;}
#volOverlay .vol-empty span{font-size:.85rem;color:#9aa0a6;}
#volOverlay .vol-more summary{cursor:pointer;font-weight:700;color:#5f6368;list-style-position:inside;}
#volOverlay .vol-more[open] summary{margin-bottom:8px;}
#volOverlay .vol-list{max-height:156px;overflow:auto;border:1px solid #eceff1;border-radius:8px;}
#volOverlay .vol-list .vol-hint{padding:10px 12px;margin:0;}
#volOverlay .vol-item{display:flex;align-items:center;gap:8px;padding:6px 8px 6px 12px;border-bottom:1px solid #f1f3f4;}
#volOverlay .vol-item:last-child{border-bottom:none;}
#volOverlay .vol-item .t{flex:1;font-family:monospace;font-size:.85rem;white-space:nowrap;}
#volOverlay .vol-badge{padding:1px 8px;border-radius:10px;font-size:.78rem;font-weight:700;white-space:nowrap;}
#volOverlay .vol-badge.mute{background:#FFEBEE;color:#C62828;}
#volOverlay .vol-badge.down{background:#FFF8E1;color:#E65100;}
#volOverlay .vol-badge.up{background:#E8F5E9;color:#2E7D32;}
#volOverlay .vol-ib{width:30px;height:30px;padding:0;}
#volOverlay .vol-ib .material-icons{font-size:1.1rem;}
#volOverlay .vol-chk{display:flex;align-items:center;gap:6px;padding-top:12px;font-size:.88rem;color:#5f6368;cursor:pointer;}
`;
        host.appendChild(st);
    }

    function buildDialog() {
        if (ov) return;
        injectStyle();
        ov = document.createElement('div');
        ov.id = 'volOverlay';
        ov.className = 'modal-overlay';
        ov.innerHTML = `
<div class="vol-box" role="dialog" aria-label="調整範圍音量">
  <div class="vol-head">
    <div class="vol-title"><span class="material-icons">volume_up</span>調整範圍音量</div>
    <button id="volXBtn" class="vol-x" title="關閉 (Esc)" aria-label="關閉"><span class="material-icons">close</span></button>
  </div>
  <div class="vol-body">
    <div class="vol-sec">
      <div class="vol-label">範圍</div>
      <div id="volSources"></div>
      <div id="volRangeInfo" class="vol-hint"></div>
    </div>
    <div class="vol-sec">
      <div class="vol-label"><span>音量</span><span id="volDb" class="vol-db"></span></div>
      <div class="vol-row">
        <input type="range" id="volSlider" min="0" max="300" step="5" value="0">
        <input type="number" id="volNum" min="0" max="300" step="5" value="0"><span>%</span>
      </div>
      <div class="vol-quick" id="volQuick"></div>
      <div id="volWarn" class="vol-safe"></div>
    </div>
    <details class="vol-sec vol-more" id="volMore">
      <summary>已設定的調整（<span id="volCount">0</span>）</summary>
      <div id="volList" class="vol-list"></div>
      <div class="vol-tools"><button id="volUndoBtn">復原上一步</button><button id="volClearAllBtn">全部清除</button></div>
    </details>
    <label class="vol-chk"><input type="checkbox" id="volExportChk"> 匯出音檔時套用這些調整</label>
  </div>
  <div class="vol-actions">
    <button id="volCloseBtn">關閉</button>
    <button id="volRestoreBtn" title="把範圍內的調整清掉，恢復原音量">還原原音量</button>
    <button id="volApplyBtn" class="primary">套用</button>
  </div>
</div>`;
        document.body.appendChild(ov);

        const quick = $('volQuick');
        [[0, '靜音'], [25, '25%'], [50, '50%'], [150, '150%'], [200, '200%'], [300, '300%']].forEach(([v, text]) => {
            const b = document.createElement('button');
            b.textContent = text;
            b.addEventListener('click', () => setPct(v));
            b.dataset.pct = v;
            quick.appendChild(b);
        });
        const maxBtn = document.createElement('button');
        maxBtn.id = 'volMaxBtn';
        maxBtn.className = 'max';
        maxBtn.style.display = 'none';
        maxBtn.addEventListener('click', () => { if (safeInfo) setPct(safeInfo.pct); });
        quick.appendChild(maxBtn);

        $('volSlider').addEventListener('input', e => setPct(e.target.value));
        $('volNum').addEventListener('input', e => { if (e.target.value !== '') setPct(e.target.value); });
        $('volApplyBtn').addEventListener('click', () => applyFromDialog(false));
        $('volRestoreBtn').addEventListener('click', () => applyFromDialog(true));
        $('volCloseBtn').addEventListener('click', closeDialog);
        $('volXBtn').addEventListener('click', closeDialog);
        $('volExportChk').addEventListener('change', e => {
            applyOnExport = e.target.checked;
            localStorage.setItem(KEY_EXPORT, applyOnExport ? 'true' : 'false');
        });
        $('volUndoBtn').addEventListener('click', undoLast);
        $('volClearAllBtn').addEventListener('click', () => {
            if (!sanitize().length) return;
            pushHistory();
            volumeRegions = [];
            afterChange();
            toast('已清除全部音量調整', 'success');
        });
        ov.addEventListener('mousedown', e => { if (e.target === ov) closeDialog(); });
        ov.addEventListener('keydown', e => {
            if (e.key === 'Escape') { e.preventDefault(); closeDialog(); }
            e.stopPropagation();    // 對話框內的按鍵不要觸發全站快捷鍵（空白鍵播放、Ctrl+Z 等）
        });
    }

    // 目前所選範圍的不破音資訊：{ pct 最大倍率(%)，peakDb 峰值(dBFS) }；沒有選範圍或量不到時為 null
    function refreshSafe() {
        safeInfo = null;
        const rs = currentRanges();
        if (rs.length) {
            let minPct = Infinity, maxPk = 0, ok = true;
            rs.forEach(r => {
                const pk = peakInRange(r.start, r.end);
                if (pk === null) { ok = false; return; }
                maxPk = Math.max(maxPk, pk);
                minPct = Math.min(minPct, Math.floor(safeGainFor(r.start, r.end) * 100));
            });
            if (ok && isFinite(minPct)) safeInfo = { pct: minPct, peakDb: maxPk > 0 ? 20 * Math.log10(maxPk) : -Infinity, multi: rs.length > 1 };
        }
        renderSafe();
    }

    function renderSafe() {
        if (!ov) return;
        const warn = $('volWarn'), maxBtn = $('volMaxBtn');
        document.querySelectorAll('#volQuick button[data-pct]').forEach(b => {
            b.classList.toggle('over', !!safeInfo && Number(b.dataset.pct) > 100 && Number(b.dataset.pct) > safeInfo.pct);
        });
        warn.className = 'vol-safe';
        if (!safeInfo) { warn.textContent = ''; maxBtn.style.display = 'none'; return; }
        const peak = isFinite(safeInfo.peakDb) ? '峰值 ' + safeInfo.peakDb.toFixed(1) + ' dBFS' : '';
        if (safeInfo.pct <= 100) {
            maxBtn.style.display = 'none';
            warn.textContent = '此範圍已接近滿格，無法再放大。';
            warn.classList.add('warn');
            return;
        }
        maxBtn.style.display = '';
        maxBtn.textContent = `上限 ${safeInfo.pct}%`;
        if (lastPct > safeInfo.pct) {
            warn.textContent = `超過上限，套用時將限制為 ${safeInfo.pct}%，避免破音。`;
            warn.classList.add('warn');
        } else {
            warn.textContent = `不破音上限 ${safeInfo.pct}%${peak ? '（' + peak + '）' : ''}`;
        }
    }

    function setPct(v) {
        let p = Math.round(Number(v));
        if (!isFinite(p)) p = 0;
        p = Math.max(0, Math.min(MAX_GAIN * 100, p));
        lastPct = p;
        $('volSlider').value = p;
        if (document.activeElement !== $('volNum')) $('volNum').value = p;
        $('volDb').textContent = p === 0 ? '靜音' : `${(20 * Math.log10(p / 100) >= 0 ? '+' : '')}${(20 * Math.log10(p / 100)).toFixed(1)} dB`;
        renderSafe();
    }

    function renderSources() {
        const src = resolveSources();
        const box = $('volSources');
        const opts = [];
        if (src.box) opts.push(['box', `選取框　${fmt(src.box.start)} – ${fmt(src.box.end)}`]);
        if (src.markers) {
            const rs = src.markers.ranges;
            const total = rs.reduce((a, r) => a + (r.end - r.start), 0);
            opts.push(['markers', rs.length === 1
                ? `${rs[0].label}　${fmt(rs[0].start)} – ${fmt(rs[0].end)}`
                : `已選 ${rs.length} 句（共 ${total.toFixed(1)} 秒）`]);
        }
        if (!opts.length) {
            box.innerHTML = '<div class="vol-empty">尚未選取範圍</div>';
            chosenSource = '';
        } else {
            if (!opts.some(o => o[0] === chosenSource)) chosenSource = opts[0][0];
            box.innerHTML = opts.map(([k, text]) =>
                `<label class="vol-src"><input type="radio" name="volSrc" value="${k}" ${k === chosenSource ? 'checked' : ''}><span>${text}</span></label>`).join('');
            box.querySelectorAll('input[name=volSrc]').forEach(r => r.addEventListener('change', () => { chosenSource = r.value; updateInfo(); }));
        }
        updateInfo();
    }

    function updateInfo() {
        const info = $('volRangeInfo');
        const src = resolveSources();
        info.textContent = (chosenSource === 'markers' && src.markers && src.markers.ranges.length > 1)
            ? '句子之間的空隙不受影響。' : '';
        const has = !!chosenSource;
        $('volApplyBtn').disabled = !has;
        $('volRestoreBtn').disabled = !has;
        refreshSafe();
    }

    function currentRanges() {
        const src = resolveSources();
        if (chosenSource === 'box' && src.box) return [src.box];
        if (chosenSource === 'markers' && src.markers) return src.markers.ranges;
        return [];
    }

    function applyFromDialog(restoreOriginal) {
        if (!canEdit()) return;
        const ranges = currentRanges();
        if (!ranges.length) return toast('請先框選範圍（藍色框）或選取標記', 'error');
        const gain = restoreOriginal ? 1 : lastPct / 100;
        const n = applyToRanges(ranges, gain);
        if (restoreOriginal) return toast(`已還原 ${n} 段的原音量`, 'success');
        const { capped, skipped, minCapPct } = lastApply;
        if (!n && skipped) return toast('這個範圍已接近滿格，無法再放大而不破音，未做調整', 'normal');
        let msg = gain === 0 ? `已靜音：${n} 段` : `已調整為 ${lastPct}%：${n} 段`;
        if (capped) msg = `已放大 ${n} 段；其中 ${capped} 段為避免破音，自動限制在 ${minCapPct}%`;
        if (skipped) msg += `（${skipped} 段已接近滿格，未放大）`;
        toast(msg, capped || skipped ? 'normal' : 'success');
    }

    function undoLast() {
        const snap = history.pop();
        if (snap === undefined) return toast('沒有可復原的音量調整', 'normal');
        volumeRegions = JSON.parse(snap);
        afterChange();
        toast('已復原上一步音量調整', 'success');
    }

    function renderList() {
        const ls = list();
        $('volCount').textContent = ls.length;
        $('volUndoBtn').disabled = history.length === 0;
        $('volClearAllBtn').disabled = ls.length === 0;
        const box = $('volList');
        if (!ls.length) { box.innerHTML = '<div class="vol-hint">尚無調整</div>'; return; }
        box.innerHTML = ls.map(r => {
            const cls = r.gain < 0.001 ? 'mute' : (r.gain < 1 ? 'down' : 'up');
            return `<div class="vol-item" data-id="${r.id}">
  <span class="t">${fmt(r.startTime)} – ${fmt(r.endTime)}</span>
  <span class="vol-badge ${cls}">${pctLabel(r.gain)}</span>
  <button class="vol-ib" data-act="play" title="試聽"><span class="material-icons" style="font-size:1.1rem;">play_arrow</span></button>
  <button class="vol-ib" data-act="del" title="刪除此調整"><span class="material-icons" style="font-size:1.1rem;">delete</span></button>
</div>`;
        }).join('');
        box.querySelectorAll('.vol-item').forEach(row => {
            const id = row.dataset.id;
            row.querySelector('[data-act=play]').addEventListener('click', () => {
                const r = sanitize().find(x => x.id === id);
                if (!r) return;
                audioPlayer.currentTime = Math.max(0, r.startTime - 1);
                const p = audioPlayer.play();
                if (p && p.catch) p.catch(() => {});
            });
            row.querySelector('[data-act=del]').addEventListener('click', () => {
                pushHistory();
                volumeRegions = sanitize().filter(x => x.id !== id);
                afterChange();
            });
        });
    }

    function openDialog() {
        if (!audioPlayer.duration) return toast('請先載入音檔', 'error');
        buildDialog();
        $('volExportChk').checked = applyOnExport;
        const src = resolveSources();
        chosenSource = src.box ? 'box' : (src.markers ? 'markers' : '');
        renderSources();
        setPct(lastPct);
        renderList();
        prevBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        ov.classList.add('show');
    }

    function closeDialog() {
        if (!ov) return;
        ov.classList.remove('show');
        document.body.style.overflow = prevBodyOverflow;
    }

    // ---------- 選單 ----------
    const closeMenu = () => $('waveMoreMenu')?.classList.remove('show');
    $('waveVolumeBtn')?.addEventListener('click', () => { closeMenu(); openDialog(); });
    $('waveVolumeMuteBtn')?.addEventListener('click', () => { closeMenu(); quickMute(); });

    return {
        takeRange, insertAt, shiftForCut, mapAll, snapshot, restore,
        applyToSlice,
        refresh() { sanitize(); renderOverlay(); resetSchedule(); if (dlgOpen()) { renderSources(); renderList(); } },
        getAll: list,
        openDialog, quickMute
    };
})();
window.VolumeRegions = VolumeRegions;
