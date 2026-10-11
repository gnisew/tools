// 4q_ui_segment_estimate.js: 自動斷句視窗「預估結果」
// 在視窗底部 #asEstimateBar 顯示預估，不修改斷句引擎（2_audio_engine.js）：
//   · 依靜音斷句：預估句數與標記總長度（含前後留白，並佔範圍的百分比）
//   · 依等長時間：預估段數（智慧等長會移動分割點，故標示「約」）
// 靜音預估沿用引擎判斷（10ms 一格、Peak／RMS、最短靜音、最短有效句段、動態留白）。
// 每 10ms 音量表只算一次並快取，拖動滑桿只重跑輕量迴圈。範圍依 targetAutoSegmentRange 切換全域／選取範圍。
// 相依：#autoSegmentModalOverlay、#asEstimateBar 與各設定欄位。放在 index.html 最後載入即可。
// 注意：僅為預估，範圍起點對齊方式與引擎略有差異時，句數可能相差約 1 句。

(function () {
    const modal = document.getElementById('autoSegmentModalOverlay');
    const bar = document.getElementById('asEstimateBar');
    if (!modal || !bar) return;

    const $ = (id) => document.getElementById(id);
    const num = (id, def) => { const v = parseFloat($(id)?.value); return isNaN(v) ? def : v; };

    function fmtSec(sec) {
        if (sec < 60) return sec.toFixed(1) + ' 秒';
        const r = Math.round(sec);
        const h = Math.floor(r / 3600), m = Math.floor((r % 3600) / 60), s = r % 60;
        return (h ? h + ' 小時 ' : '') + (h || m ? m + ' 分 ' : '') + s + ' 秒';
    }

    function setBar(html) { bar.innerHTML = html; }
    const strong = (t) => `<b>${t}</b>`;

    function isTimeTab() {
        const sec = $('sectionAutoTime');
        return !!sec && sec.style.display !== 'none';
    }

    // 與引擎相同的分析來源（人聲強化啟用時用壓低配樂的版本）
    function getBuffer() {
        if (typeof wavesurfer === 'undefined' || !wavesurfer || !wavesurfer.getDecodedData) return null;
        const d = wavesurfer.getDecodedData();
        if (!d) return null;
        return (window.VocalEnhance ? VocalEnhance.getAnalysisBuffer(d) : d);
    }

    // 斷句範圍：選取範圍模式用 targetAutoSegmentRange，否則整份音檔
    function getRange() {
        const dur = (typeof audioPlayer !== 'undefined' && audioPlayer && audioPlayer.duration) || 0;
        const r = (typeof targetAutoSegmentRange !== 'undefined') ? targetAutoSegmentRange : null;
        if (r) return { start: r.start, end: r.end, isRegion: true, dur };
        return { start: 0, end: dur, isRegion: false, dur };
    }

    // ---------- 每 10ms 音量表（換音檔或偵測模式才重算） ----------
    let lvCache = null;   // { buf, mode, step, sr, levels }
    let inflight = null;  // { buf, mode, promise }

    function getLevels(buf, mode) {
        if (lvCache && lvCache.buf === buf && lvCache.mode === mode) return Promise.resolve(lvCache);
        if (inflight && inflight.buf === buf && inflight.mode === mode) return inflight.promise;
        const p = (async () => {
            const sr = buf.sampleRate, len = buf.length, nCh = buf.numberOfChannels;
            const step = Math.floor(sr / 100);
            const chs = [];
            for (let c = 0; c < nCh; c++) chs.push(buf.getChannelData(c));
            const n = Math.ceil(len / step);
            const levels = new Float32Array(n);
            let lastYield = Date.now();
            for (let k = 0; k < n; k++) {
                const i = k * step, e = Math.min(i + step, len);
                let maxAmp = 0, sumSq = 0;
                for (let j = i; j < e; j++) {
                    for (let c = 0; c < nCh; c++) {
                        const a = Math.abs(chs[c][j]);
                        if (a > maxAmp) maxAmp = a;
                        if (mode === 'rms') sumSq += a * a;
                    }
                }
                const cnt = (e - i) * nCh;
                levels[k] = (mode === 'rms' && cnt > 0) ? Math.sqrt(sumSq / cnt) : maxAmp;
                if (Date.now() - lastYield > 40) { // 長音檔不卡畫面
                    await new Promise(r => setTimeout(r, 0));
                    lastYield = Date.now();
                }
            }
            lvCache = { buf, mode, step, sr, levels };
            return lvCache;
        })();
        inflight = { buf, mode, promise: p };
        p.then(() => { if (inflight && inflight.promise === p) inflight = null; },
               () => { if (inflight && inflight.promise === p) inflight = null; });
        return p;
    }

    // ---------- 依靜音斷句：重現引擎判斷，算出句數與總長 ----------
    function estimateSilence(cache, buf, range) {
        const { levels, step, sr } = cache;
        const mediaDuration = (typeof audioPlayer !== 'undefined' && audioPlayer.duration) || buf.duration;
        const timeRatio = mediaDuration / buf.duration;
        const threshold = num('asThreshold', 5) / 100;
        const minSilence = num('asSilence', 0.8);
        const padding = num('asPadding', 0.2);
        const minSegment = num('asMinSegment', 0.5);

        const n = levels.length;
        let startIdx = 0, endIdx = n, endTime = mediaDuration;
        if (range.isRegion) {
            startIdx = Math.max(0, Math.floor(Math.floor((range.start / timeRatio) * sr) / step));
            endIdx = Math.min(n, Math.ceil(Math.floor((range.end / timeRatio) * sr) / step));
            endTime = range.end;
        }

        const segs = [];
        let isSilence = true, silenceStart = range.isRegion ? range.start : 0, segmentStart = -1;
        for (let k = startIdx; k < endIdx; k++) {
            const t = (k * step / sr) * timeRatio;
            if (levels[k] < threshold) {
                if (!isSilence) { isSilence = true; silenceStart = t; }
                else if (t - silenceStart >= minSilence && segmentStart !== -1) {
                    if (silenceStart - segmentStart >= minSegment) segs.push({ start: segmentStart, end: silenceStart });
                    segmentStart = -1;
                }
            } else if (isSilence) {
                isSilence = false;
                if (segmentStart === -1) segmentStart = t;
            }
        }
        if (segmentStart !== -1) {
            const finalEnd = isSilence ? silenceStart : endTime;
            if (finalEnd - segmentStart >= minSegment) segs.push({ start: segmentStart, end: finalEnd });
        }

        // 與引擎相同的動態留白（空間不夠就縮小）
        const gapMargin = 0.005;
        let total = 0;
        for (let i = 0; i < segs.length; i++) {
            let ps = padding, pe = padding;
            if (i > 0) ps = Math.min(padding, (segs[i].start - segs[i - 1].end) / 2 - gapMargin);
            if (i < segs.length - 1) pe = Math.min(padding, (segs[i + 1].start - segs[i].end) / 2 - gapMargin);
            ps = Math.max(0, ps); pe = Math.max(0, pe);
            const s = Math.max(0, segs[i].start - ps);
            const e = Math.min(mediaDuration, segs[i].end + pe);
            total += Math.max(0, e - s);
        }
        return { count: segs.length, total };
    }

    // ---------- 依等長時間：算段數 ----------
    function estimateTime(range) {
        const L = num('asFixedTimeMinutes', 0) * 60 + num('asFixedTimeSeconds', 0);
        if (L <= 0) return { error: '請設定有效的標記長度' };
        const span = range.end - range.start;
        if (!(span > 0)) return { error: '範圍太小，無法進行切割' };
        const smart = !!$('asSmartTimeCheck')?.checked;
        let count;
        if (!smart) {
            count = Math.max(1, Math.ceil(span / L - 1e-9)); // 與引擎的 for 迴圈同結果
        } else {
            // 智慧模式：不移動分割點，只套用「結尾不足 25% 併入最後一段」
            const minTail = L * 0.25;
            count = 1;
            let cursor = range.start;
            while (cursor + L < range.end - minTail && count < 1e6) { cursor += L; count++; }
        }
        return { count, L, span, smart };
    }

    // ---------- 更新預估列 ----------
    let token = 0, timer = null;
    function schedule(delay) { clearTimeout(timer); timer = setTimeout(update, delay === undefined ? 150 : delay); }

    async function update() {
        if (!modal.classList.contains('show')) return;
        const my = ++token;
        const range = getRange();

        if (isTimeTab()) {
            if (!range.dur) return setBar('<span style="color:#888;">請先載入音檔，才能預估</span>');
            const r = estimateTime(range);
            if (r.error) return setBar(`<span style="color:#C62828;">${r.error}</span>`);
            setBar(`預估${r.smart ? '約 ' : ''}${strong(r.count + ' 段')}<span class="as-sub">每段 ${fmtSec(r.L)}${range.isRegion ? '・選取範圍' : ''}</span>`);
            return;
        }

        const buf = getBuffer();
        if (!buf) return setBar('<span style="color:#888;">請先載入音檔，才能預估</span>');
        const mode = $('asDetectionMode')?.value === 'rms' ? 'rms' : 'peak';
        if (!(lvCache && lvCache.buf === buf && lvCache.mode === mode)) setBar('<span style="color:#888;">預估計算中…</span>');
        let cache;
        try { cache = await getLevels(buf, mode); } catch (e) { console.error(e); return setBar(''); }
        if (my !== token || !modal.classList.contains('show') || isTimeTab()) return; // 設定已變，丟掉舊結果

        const r = estimateSilence(cache, buf, getRange());
        if (!r.count) {
            return setBar('<span style="color:#C62828;">找不到符合的斷句，請調高門檻或縮短靜音時長</span>');
        }
        const span = range.isRegion ? (range.end - range.start) : (range.dur || buf.duration);
        const pct = span > 0 ? Math.round(r.total / span * 100) : 0;
        let note = '';
        // 全域模式且列表已有句子時，引擎只會套用到現有句數
        if (!range.isRegion && typeof allLabelsOrdered !== 'undefined' && allLabelsOrdered.length > 0 && r.count > allLabelsOrdered.length) {
            note = `<div class="as-warn">列表僅 ${allLabelsOrdered.length} 句，多出 ${r.count - allLabelsOrdered.length} 段不套用</div>`;
        }
        setBar(`預估 ${strong(r.count + ' 句')}<span class="as-sub">共 ${fmtSec(r.total)}・佔${range.isRegion ? '選取範圍' : '全檔'} ${pct}%</span>` + note);
    }

    // ---------- 觸發時機 ----------
    new MutationObserver(() => { if (modal.classList.contains('show')) schedule(0); })
        .observe(modal, { attributes: true, attributeFilter: ['class'] });
    modal.addEventListener('input', () => schedule());
    modal.addEventListener('change', () => schedule());
    modal.addEventListener('click', (e) => {
        if (e.target.closest && e.target.closest('#tabAutoSilence, #tabAutoTime')) setTimeout(() => schedule(0), 0);
    });
})();
