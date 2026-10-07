// 2c_skip_silence.js: 播放時自動略過靜音
// 用途：播放時遇到夠長的靜音就跳到靜音結束處，節省聽打／檢查時間
// 做法：
//   1. 用 wavesurfer 已解碼資料每 20ms 算 RMS，低於「靜音門檻(dB)」且連續超過「最短靜音長度」的區段記為靜音（啟用「人聲強化」時沿用壓低配樂的分析資料）
//   2. 播放中每個畫面更新檢查一次，進入靜音區段（扣掉前後保留秒數）就 seek 到區段尾端
//   3. 「略過極短雜音」：略過前後皆為靜音的孤立短聲音（咳嗽、碰撞、點擊聲等）；與「略過靜音」各自獨立開關，區段自動合併
//   4. 門檻以「保守／標準／積極」呈現（dB 收進「進階」）；調整參數時在聲波上即時顯示將被略過的區段（靜音＝灰色斜線、雜音＝橘色）；
//      「自動偵測」依底噪與人聲音量算門檻；顯示「偵測到 N 段，預計省下約 X 秒」
//   5. 聲波「⋮」選單的「顯示靜音區塊／顯示短雜訊」為純顯示切換，不需啟用略過、不影響播放（再點一次、Esc 或「取消選取」關閉）
// 只改播放位置，不修改音檔、標記與資料；預設關閉；設定存在 localStorage；預覽圖層為 pointer-events:none 的純顯示元素
// 需求：index.html 需有 #skipSilenceCheck、#skipSilenceThreshold、#skipSilenceThresholdVal、#skipSilenceMinLen、#skipSilencePad、#skipSilenceOptions、
//       #skipNoiseCheck、#skipNoiseThreshold、#skipNoiseThresholdVal、#skipNoiseMaxLen、#skipNoiseOptions、
//       #skipSilenceLevelText、#skipSilenceInfo、#skipSilenceAuto、#skipNoiseLevelText、#skipNoiseInfo、#skipNoiseAuto，
//       以及帶 data-skip-kind / data-db 的預設按鈕（可選）；於 6_wave_controller.js 之後載入

const SkipSilence = (() => {
    const KEY = {
        on: 'tagger_skipSilenceOn',
        th: 'tagger_skipSilenceThreshold',
        min: 'tagger_skipSilenceMinLen',
        pad: 'tagger_skipSilencePad',
        // 略過極短雜音
        noiseOn: 'tagger_skipNoiseOn',
        noiseTh: 'tagger_skipNoiseThreshold',
        noiseMax: 'tagger_skipNoiseMaxLen'
    };
    const readNum = (k, def) => {
        const v = parseFloat(localStorage.getItem(k));
        return isNaN(v) ? def : v;
    };

    let enabled = localStorage.getItem(KEY.on) === 'true';
    let thresholdDb = readNum(KEY.th, -40);  // 低於此音量視為靜音
    let minLen = readNum(KEY.min, 0.5);  // 最短靜音長度（秒）
    let pad = readNum(KEY.pad, 0.15);  // 靜音前後保留（秒），避免切到字頭字尾
    // 略過極短雜音的設定
    let noiseEnabled = localStorage.getItem(KEY.noiseOn) === 'true';
    let noiseThDb = readNum(KEY.noiseTh, -40);  // 高於此音量才算「有聲音」
    let noiseMaxLen = readNum(KEY.noiseMax, 0.15);  // 聲音短於此秒數才當雜音略過
    const NOISE_GAP = 0.1;  // 雜音前後都要有至少這麼長的靜音，才算「孤立」的雜音
    let ranges = [];  // 有效略過區段 [[from, to], ...]（靜音 + 雜音，已合併排序）
    let silRanges = [];  // 只有「靜音」的區段（預覽與統計用）
    let noiseRanges = [];  // 只有「雜音」的區段（預覽與統計用）
    let cacheBuf = null, cacheKey = '';
    let rafId = null;

    // 變更通知（讓 UI 更新「偵測到 N 段」）
    const listeners = [];
    const emit = () => listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });

    function getBuffer() {
        if (typeof wavesurfer === 'undefined' || !wavesurfer || !wavesurfer.getDecodedData) return null;
        const d = wavesurfer.getDecodedData();
        if (!d) return null;
        return (window.VocalEnhance ? VocalEnhance.getAnalysisBuffer(d) : d);
    }

    function detect(buf) {
        const sr = buf.sampleRate, len = buf.length;
        const win = Math.max(1, Math.round(sr * 0.02));
        const L = buf.getChannelData(0);
        const R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : null;
        const thr = Math.pow(10, thresholdDb / 20);
        const out = [];
        let silStart = null;
        for (let s = 0; s < len; s += win) {
            const e = Math.min(len, s + win);
            let sum = 0, cnt = 0;
            for (let i = s; i < e; i += 2) {
                let v = Math.abs(L[i]);
                if (R) { const r = Math.abs(R[i]); if (r > v) v = r; }
                sum += v * v; cnt++;
            }
            const rms = Math.sqrt(sum / Math.max(1, cnt));
            const t = s / sr;
            if (rms < thr) {
                if (silStart === null) silStart = t;
            } else if (silStart !== null) {
                if (t - silStart >= minLen) out.push([silStart, t]);
                silStart = null;
            }
        }
        if (silStart !== null) {
            const t = len / sr;
            if (t - silStart >= minLen) out.push([silStart, t]);
        }
        // 扣掉前後保留秒數；扣完太短的就不略過
        return out
            .map(([a, b]) => [a + pad, b - pad])
            .filter(([a, b]) => b - a > 0.1);
    }

    // 找出「孤立的極短聲音」。以 10ms 為一格，高於門檻視為有聲；
    // 有聲區段長度 ≤ noiseMaxLen，且前後各有 ≥ NOISE_GAP 秒的靜音，就記為雜音
    function detectNoise(buf) {
        const sr = buf.sampleRate, len = buf.length;
        const win = Math.max(1, Math.round(sr * 0.01));
        const L = buf.getChannelData(0);
        const R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : null;
        const thr = Math.pow(10, noiseThDb / 20);
        const nFrames = Math.ceil(len / win);
        const loud = new Uint8Array(nFrames);
        for (let f = 0; f < nFrames; f++) {
            const s = f * win, e = Math.min(len, s + win);
            let sum = 0, cnt = 0;
            for (let i = s; i < e; i += 2) {
                let v = Math.abs(L[i]);
                if (R) { const r = Math.abs(R[i]); if (r > v) v = r; }
                sum += v * v; cnt++;
            }
            loud[f] = Math.sqrt(sum / Math.max(1, cnt)) >= thr ? 1 : 0;
        }
        // 補平 1 格（10ms）以內的小缺口，避免一個雜音被拆成兩段而誤判成更短
        for (let f = 1; f < nFrames - 1; f++) {
            if (!loud[f] && loud[f - 1] && loud[f + 1]) loud[f] = 1;
        }
        const frameSec = win / sr;
        const gapFrames = Math.ceil(NOISE_GAP / frameSec);
        const maxFrames = Math.max(1, Math.round(noiseMaxLen / frameSec));
        const quiet = (a, b) => {  // [a, b) 這幾格是否全為靜音；超出音檔頭尾的部分視為靜音（檔案開頭／結尾的短雜訊也抓得到）
            for (let f = Math.max(0, a); f < Math.min(nFrames, b); f++) if (loud[f]) return false;
            return true;
        };
        const out = [];
        let f = 0;
        while (f < nFrames) {
            if (!loud[f]) { f++; continue; }
            let g = f; while (g < nFrames && loud[g]) g++;
            if (g - f <= maxFrames && quiet(f - gapFrames, f) && quiet(g, g + gapFrames)) {
                // 前後各多跳 20ms，把雜音的尾音／回音一起略過
                out.push([Math.max(0, f * frameSec - 0.02), Math.min(len / sr, g * frameSec + 0.02)]);
            }
            f = g;
        }
        return out;
    }

    // 把靜音與雜音的區段合併成一份「由小到大、互不重疊」的清單
    function mergeRanges(list) {
        list.sort((x, y) => x[0] - y[0]);
        const out = [];
        for (const r of list) {
            const last = out[out.length - 1];
            if (last && r[0] <= last[1]) { if (r[1] > last[1]) last[1] = r[1]; }
            else out.push([r[0], r[1]]);
        }
        return out;
    }

    // 自動偵測門檻。算出整份錄音每 20ms 的音量(dB)，
    // 取最安靜的 10% 當「背景底噪」、最大聲的 10% 當「人聲」，門檻設在底噪上方一小段。
    function autoCalibrate() {
        const buf = getBuffer();
        if (!buf) return { ok: false, reason: 'nobuf' };
        const sr = buf.sampleRate, len = buf.length;
        const win = Math.max(1, Math.round(sr * 0.02));
        const n = Math.ceil(len / win);
        if (n < 20) return { ok: false, reason: 'short' };
        const L = buf.getChannelData(0);
        const R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : null;
        const dbs = new Float32Array(n);
        for (let k = 0; k < n; k++) {
            const s = k * win, e = Math.min(len, s + win);
            let sum = 0, cnt = 0;
            for (let i = s; i < e; i += 2) {
                let v = Math.abs(L[i]);
                if (R) { const r = Math.abs(R[i]); if (r > v) v = r; }
                sum += v * v; cnt++;
            }
            const rms = Math.sqrt(sum / Math.max(1, cnt));
            dbs[k] = 20 * Math.log10(Math.max(rms, 1e-5));
        }
        dbs.sort();  // Float32Array 的 sort 是數值排序
        const floor = dbs[Math.floor(n * 0.10)];
        const speech = dbs[Math.min(n - 1, Math.floor(n * 0.90))];
        if (speech - floor < 8) return { ok: false, reason: 'flat', floor, speech };
        let db = floor + Math.max(5, (speech - floor) * 0.2);
        db = Math.round(Math.min(-20, Math.max(-70, db)));
        return { ok: true, db, floor: Math.round(floor), speech: Math.round(speech) };
    }

    // 把 dB 轉成「保守／標準／積極」。
    // 靜音：門檻越高 → 越多聲音被當成靜音 → 越積極。
    // 雜音：門檻越低 → 連很小的聲音都算「有聲」、都可能被當雜音略過 → 越積極。
    function levelText(kind, db) {
        if (kind === 'silence') return db <= -52 ? '保守' : (db <= -38 ? '標準' : '積極');
        return db >= -32 ? '保守' : (db >= -46 ? '標準' : '積極');
    }

    // 聲波上的「將被略過」預覽
    // 蓋一層純顯示的圖層在 wavesurfer 的 wrapper 內（寬度＝整段聲波，會跟著縮放／捲動），
    // 用百分比定位；wavesurfer 的聲波在 shadow DOM 內，所以這裡一律用 inline style。
    let previewOn = false, previewTimer = null, previewLayer = null;

    function clearPreviewDom() {
        if (previewLayer && previewLayer.parentNode) previewLayer.parentNode.removeChild(previewLayer);
        previewLayer = null;
    }

    function renderPreview() {
        clearPreviewDom();
        if (!previewOn) return;
        if (typeof wavesurfer === 'undefined' || !wavesurfer || !wavesurfer.getWrapper) return;
        const wrapper = wavesurfer.getWrapper();
        const dur = wavesurfer.getDuration ? wavesurfer.getDuration() : 0;
        if (!wrapper || !dur) return;
        const layer = document.createElement('div');
        layer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:4;';
        const addSegs = (list, bg, border) => {
            for (const [a, b] of list) {
                const seg = document.createElement('div');
                seg.style.cssText = 'position:absolute;top:0;height:100%;box-sizing:border-box;' +
                    'left:' + (a / dur * 100) + '%;width:' + Math.max(0.05, (b - a) / dur * 100) + '%;' +
                    'background:' + bg + ';border-left:1px solid ' + border + ';border-right:1px solid ' + border + ';';
                layer.appendChild(seg);
            }
        };
        addSegs(silRanges,
            'repeating-linear-gradient(135deg, rgba(84,110,122,0.50) 0, rgba(84,110,122,0.50) 4px, rgba(84,110,122,0.18) 4px, rgba(84,110,122,0.18) 8px)',
            'rgba(84,110,122,0.9)');
        addSegs(noiseRanges, 'rgba(255,112,67,0.45)', 'rgba(230,81,0,0.95)');
        wrapper.appendChild(layer);
        previewLayer = layer;
    }

    // 顯示預覽 ms 毫秒（每次呼叫都重新計時）；ms <= 0 表示不自動消失
    function showPreview(ms) {
        previewOn = true;
        renderPreview();
        if (previewTimer) clearTimeout(previewTimer);
        previewTimer = null;
        if (ms === undefined) ms = 3000;
        if (ms > 0) previewTimer = setTimeout(hidePreview, ms);
    }
    function hidePreview() {
        previewOn = false;
        if (previewTimer) { clearTimeout(previewTimer); previewTimer = null; }
        clearPreviewDom();
    }

    // 常駐顯示「靜音區塊／短雜訊」（選單開關，無自動消失）
    // 與上面的「調整靈敏度時的短暫預覽」分開：不受 enabled / noiseEnabled 影響，
    // 偵測參數沿用「播放略過」的設定（靈敏度、最短靜音、前後保留、雜音最長長度）。
    const view = { sil: false, noise: false };
    let viewSilRanges = [], viewNoiseRanges = [], viewLayer = null, viewKey = '';
    let keep = [];  // 使用者標記「保留、不刪除」的區塊 [{kind:'sil'|'noise', a, b}]（buffer 時間；只在目前這一輪顯示有效）
    const isKept = (kind, a, b) => { const m = (a + b) / 2; return keep.some(k => k.kind === kind && m >= k.a && m <= k.b); };
    function toggleKeep(kind, a, b) {
        const m = (a + b) / 2, i = keep.findIndex(k => k.kind === kind && m >= k.a && m <= k.b);
        if (i >= 0) keep.splice(i, 1); else keep.push({ kind, a, b });
        renderView();
        emitView();
    }
    let viewLen = 0;  // 偵測當時的音檔長度（sample 數），刪除前用來確認區段還對得上目前的音檔
    const viewListeners = [];
    const emitView = () => viewListeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });

    function clearViewDom() {
        if (viewLayer && viewLayer.parentNode) viewLayer.parentNode.removeChild(viewLayer);
        viewLayer = null;
    }

    function renderView() {
        clearViewDom();
        if (!view.sil && !view.noise) return;
        if (typeof wavesurfer === 'undefined' || !wavesurfer || !wavesurfer.getWrapper) return;
        const wrapper = wavesurfer.getWrapper();
        const dur = wavesurfer.getDuration ? wavesurfer.getDuration() : 0;
        if (!wrapper || !dur) return;
        const layer = document.createElement('div');
        layer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:3;';
        // 每個區塊頂端中央有一個可點的小圖示（✕＝會刪除；✓＝保留）；其餘部分仍不攔截滑鼠，不影響聲波操作
        const addSegs = (list, kind, bg, border) => {
            for (const [a, b] of list) {
                const kept = isKept(kind, a, b);
                const seg = document.createElement('div');
                seg.style.cssText = 'position:absolute;top:0;height:100%;box-sizing:border-box;' +
                    'left:' + (a / dur * 100) + '%;width:' + Math.max(0.05, (b - a) / dur * 100) + '%;' +
                    (kept ? 'background:rgba(76,175,80,0.14);border:1px dashed rgba(46,125,50,0.9);'
                          : 'background:' + bg + ';border-left:1px solid ' + border + ';border-right:1px solid ' + border + ';');
                const btn = document.createElement('div');
                btn.textContent = kept ? '✓' : '✕';
                btn.title = kept ? '這段會保留（點一下改回刪除）' : '點一下：這段保留，不刪除';
                btn.style.cssText = 'position:absolute;top:3px;left:50%;transform:translateX(-50%);width:18px;height:18px;' +
                    'line-height:18px;text-align:center;border-radius:50%;font-size:11px;font-weight:bold;cursor:pointer;' +
                    'pointer-events:auto;user-select:none;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.35);' +
                    'color:' + (kept ? '#2E7D32' : '#C62828') + ';';
                ['pointerdown', 'mousedown', 'touchstart', 'dblclick', 'contextmenu'].forEach(ev =>
                    btn.addEventListener(ev, e => e.stopPropagation()));  // 不要讓聲波把它當成移動游標／框選
                btn.addEventListener('click', e => { e.stopPropagation(); toggleKeep(kind, a, b); });
                seg.appendChild(btn);
                layer.appendChild(seg);
            }
        };
        if (view.sil) addSegs(viewSilRanges, 'sil',
            'repeating-linear-gradient(135deg, rgba(84,110,122,0.50) 0, rgba(84,110,122,0.50) 4px, rgba(84,110,122,0.18) 4px, rgba(84,110,122,0.18) 8px)',
            'rgba(84,110,122,0.9)');
        if (view.noise) addSegs(viewNoiseRanges, 'noise', 'rgba(255,112,67,0.45)', 'rgba(230,81,0,0.95)');
        wrapper.appendChild(layer);
        viewLayer = layer;
    }

    // 依目前開關與參數重算並重畫；force = true 表示參數或音檔變了，必須重算
    function refreshView(force) {
        if (!view.sil && !view.noise) { clearViewDom(); viewSilRanges = []; viewNoiseRanges = []; viewKey = ''; keep = []; return true; }
        const buf = getBuffer();
        if (!buf) { viewSilRanges = []; viewNoiseRanges = []; viewKey = ''; renderView(); return false; }
        const key = [view.sil, view.noise, thresholdDb, minLen, pad, noiseThDb, noiseMaxLen].join('|');
        if (force || key !== viewKey || !viewLayer) {
            if (force || key !== viewKey) {
                if (viewLen && viewLen !== buf.length) keep = [];  // 音檔被編輯過，舊的保留記錄不再可信
                viewSilRanges = view.sil ? detect(buf) : [];
                viewNoiseRanges = view.noise ? detectNoise(buf) : [];
                viewKey = key;
                viewLen = buf.length;
            }
            renderView();
            emitView();  // 區段有變，通知選單更新「刪除顯示中的區塊（N 段…）」
        }
        return true;
    }

    // 切換顯示；回傳 'ok'（已切換）或 'nobuf'（還沒載入音檔）
    function toggleView(kind) {
        if (!(kind in view)) return 'ok';
        if (!view[kind] && !getBuffer()) return 'nobuf';
        view[kind] = !view[kind];
        if (!view[kind]) keep = keep.filter(k => k.kind !== kind);
        refreshView(true);
        emitView();
        return 'ok';
    }
    // 關閉全部顯示（Esc、取消選取用）；有關掉東西才回傳 true
    function hideView() {
        if (!view.sil && !view.noise) return false;
        view.sil = false; view.noise = false;
        refreshView(true);
        emitView();
        return true;
    }

    // 目前「顯示中」的區段（靜音與雜音的聯集，已合併排序），單位＝buffer 時間（秒）。
    // 給 2b_audio_clipboard.js 的 removeViewRanges 使用：看到什麼就刪什麼。
    function getViewRanges() {
        const buf = getBuffer();
        const empty = { ranges: [], sr: 0, len: 0, sil: view.sil, noise: view.noise, kept: 0 };
        if (!buf || (!view.sil && !view.noise) || viewLen !== buf.length) return empty;
        let kept = 0;
        const pick = (list, kind) => list.filter(([a, b]) => { if (isKept(kind, a, b)) { kept++; return false; } return true; });
        const list = (view.sil ? pick(viewSilRanges, 'sil') : []).concat(view.noise ? pick(viewNoiseRanges, 'noise') : []).map(r => [r[0], r[1]]);
        return { ranges: mergeRanges(list), sr: buf.sampleRate, len: buf.length, sil: view.sil, noise: view.noise, kept };
    }

    // 音檔或參數有變才重算
    // 靜音與雜音分開存放（silRanges / noiseRanges），再合併成 ranges 供播放跳段使用
    function ensureRanges(force) {
        const buf = getBuffer();
        if (!buf) {
            ranges = []; silRanges = []; noiseRanges = []; cacheBuf = null;
            if (previewOn) renderPreview();
            emit();
            return false;
        }
        const key = [enabled, thresholdDb, minLen, pad, noiseEnabled, noiseThDb, noiseMaxLen].join('|');
        if (!force && buf === cacheBuf && key === cacheKey) return true;
        silRanges = enabled ? detect(buf) : [];
        noiseRanges = noiseEnabled ? detectNoise(buf) : [];
        ranges = mergeRanges(silRanges.concat(noiseRanges));
        cacheBuf = buf; cacheKey = key;
        if (previewOn) renderPreview();
        emit();
        return true;
    }

    function findRange(t) {
        let lo = 0, hi = ranges.length - 1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (t < ranges[mid][0]) hi = mid - 1;
            else if (t >= ranges[mid][1] - 0.02) lo = mid + 1;
            else return ranges[mid];
        }
        return null;
    }

    function seek(t) {
        if (typeof wavesurfer !== 'undefined' && wavesurfer) wavesurfer.setTime(t);
        else audioPlayer.currentTime = t;
    }

    function tick() {
        rafId = null;
        if (!(enabled || noiseEnabled) || audioPlayer.paused) return;
        if (!audioPlayer.seeking) {
            if (getBuffer() !== cacheBuf) ensureRanges(false);  // 換了音檔
            if (ranges.length) {
                const r = findRange(audioPlayer.currentTime);
                if (r) seek(r[1]);
            }
        }
        rafId = requestAnimationFrame(tick);
    }

    function start() {
        if (rafId !== null || !(enabled || noiseEnabled)) return;
        ensureRanges(false);
        rafId = requestAnimationFrame(tick);
    }

    function setEnabled(on, silent) {
        enabled = !!on;
        localStorage.setItem(KEY.on, enabled ? 'true' : 'false');
        const ok = ensureRanges(true);  // 開或關都重算（關掉靜音後仍會保留雜音區段；兩者都關則清空）
        if (enabled) {
            if (!silent && typeof showToast === 'function') {
                if (ok) showToast(ranges.length ? `略過靜音已啟用，偵測到 ${silRanges.length} 段可略過的靜音` : '略過靜音已啟用（目前沒有偵測到符合條件的靜音）', 'success');
                else showToast('略過靜音已啟用，載入音檔後生效', 'normal');
            }
            if (!audioPlayer.paused) start();
        } else if (!(enabled || noiseEnabled) && rafId !== null) {
            cancelAnimationFrame(rafId); rafId = null;
        }
    }

    // 開關「略過極短雜音」
    function setNoiseEnabled(on, silent) {
        noiseEnabled = !!on;
        localStorage.setItem(KEY.noiseOn, noiseEnabled ? 'true' : 'false');
        const ok = ensureRanges(true);  // 同 setEnabled
        if (noiseEnabled) {
            if (!silent && typeof showToast === 'function') {
                if (ok) showToast('略過極短雜音已啟用', 'success');
                else showToast('略過極短雜音已啟用，載入音檔後生效', 'normal');
            }
            if (!audioPlayer.paused) start();
        } else if (!(enabled || noiseEnabled) && rafId !== null) {
            cancelAnimationFrame(rafId); rafId = null;
        }
    }

    function setParams(p) {
        if (p.thresholdDb !== undefined) { thresholdDb = p.thresholdDb; localStorage.setItem(KEY.th, String(thresholdDb)); }
        if (p.minLen !== undefined) { minLen = p.minLen; localStorage.setItem(KEY.min, String(minLen)); }
        if (p.pad !== undefined) { pad = p.pad; localStorage.setItem(KEY.pad, String(pad)); }
        // 雜音參數
        if (p.noiseThDb !== undefined) { noiseThDb = p.noiseThDb; localStorage.setItem(KEY.noiseTh, String(noiseThDb)); }
        if (p.noiseMaxLen !== undefined) { noiseMaxLen = p.noiseMaxLen; localStorage.setItem(KEY.noiseMax, String(noiseMaxLen)); }
        if (enabled || noiseEnabled) ensureRanges(true);
        if (view.sil || view.noise) refreshView(true);  // 常駐顯示跟著參數更新
    }

    const sumLen = (list) => list.reduce((s, r) => s + (r[1] - r[0]), 0);

    return {
        setEnabled, setNoiseEnabled, setParams, start,
        isEnabled: () => enabled,
        isNoiseEnabled: () => noiseEnabled,
        getParams: () => ({ thresholdDb, minLen, pad, noiseThDb, noiseMaxLen }),
        getRangeCount: () => ranges.length,
        autoCalibrate, levelText, showPreview, hidePreview,
        // 常駐顯示（選單開關）
        toggleView, hideView, refreshView, getViewRanges,
        isViewOn: (kind) => !!view[kind],
        onViewChange: (fn) => viewListeners.push(fn),
        onChange: (fn) => listeners.push(fn),
        getStats: () => ({
            ready: cacheBuf !== null,
            silCount: silRanges.length, silSec: sumLen(silRanges),
            noiseCount: noiseRanges.length, noiseSec: sumLen(noiseRanges)
        })
    };
})();

window.SkipSilence = SkipSilence;

// UI 綁定
// 共用小工具
function skipFmtSec(sec) {
    sec = Math.round(sec);
    if (sec < 60) return sec + ' 秒';
    return Math.floor(sec / 60) + ' 分 ' + (sec % 60) + ' 秒';
}

// 「靈敏度」區塊（滑桿＋保守/標準/積極按鈕＋自動偵測＋結果文字）共用的綁定函式，
// 靜音與雜音各呼叫一次。invert = true 時，滑桿值 = -dB（雜音用：右邊＝積極，與靜音方向一致）
function bindSensitivity(cfg) {
    const { kind, check, options, slider, valEl, levelEl, infoEl, autoBtn, invert, paramKey, getDb } = cfg;
    const toDb = (v) => invert ? -v : v;
    const toSlider = (db) => invert ? -db : db;
    let timer = null;

    const refreshLabels = (db) => {
        if (valEl) valEl.textContent = db + ' dB';
        if (levelEl) levelEl.textContent = SkipSilence.levelText(kind, db);
        document.querySelectorAll('.skip-preset-btn[data-skip-kind="' + kind + '"]').forEach(b => {
            b.classList.toggle('active', parseFloat(b.dataset.db) === db);
        });
    };
    const apply = (db, immediate) => {  // 滑桿拖動時稍微延遲重算（長音檔每次重算要掃整份資料，避免卡頓）
        refreshLabels(db);
        SkipSilence.showPreview(3000);
        clearTimeout(timer);
        const run = () => SkipSilence.setParams({ [paramKey]: db });
        if (immediate) run(); else timer = setTimeout(run, 120);
    };
    const refreshInfo = () => {
        if (!infoEl) return;
        if (!check.checked) { infoEl.textContent = ''; return; }
        const st = SkipSilence.getStats();
        if (!st.ready) { infoEl.textContent = '載入音檔後會顯示偵測結果'; return; }
        const n = kind === 'silence' ? st.silCount : st.noiseCount;
        const s = kind === 'silence' ? st.silSec : st.noiseSec;
        infoEl.textContent = n ? `偵測到 ${n} 段，預計省下約 ${skipFmtSec(s)}` : '目前沒有偵測到符合條件的區段';
    };

    const db0 = getDb();
    if (slider) slider.value = toSlider(db0);
    refreshLabels(db0);

    slider?.addEventListener('input', () => apply(toDb(parseFloat(slider.value)), false));
    slider?.addEventListener('pointerdown', () => SkipSilence.showPreview(60000));  // 按住期間持續顯示
    slider?.addEventListener('pointerup', () => SkipSilence.showPreview(2500));
    slider?.addEventListener('change', () => SkipSilence.showPreview(2500));  // 鍵盤操作放開時也重新計時

    document.querySelectorAll('.skip-preset-btn[data-skip-kind="' + kind + '"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const db = parseFloat(btn.dataset.db);
            if (slider) slider.value = toSlider(db);
            apply(db, true);
        });
    });

    autoBtn?.addEventListener('click', () => {
        const r = SkipSilence.autoCalibrate();
        if (!r.ok) {
            const msg = r.reason === 'nobuf' ? '請先載入音檔，才能自動偵測'
                : r.reason === 'short' ? '音檔太短，無法自動偵測'
                : '這份錄音的音量起伏很小，無法自動判斷，請用「保守／標準／積極」手動選擇';
            if (typeof showToast === 'function') showToast(msg, 'normal');
            return;
        }
        if (slider) slider.value = toSlider(r.db);
        apply(r.db, true);
        if (typeof showToast === 'function') showToast(`已自動設定為「${SkipSilence.levelText(kind, r.db)}」（背景約 ${r.floor} dB、人聲約 ${r.speech} dB）`, 'success');
    });

    SkipSilence.onChange(refreshInfo);
    check.addEventListener('change', () => { refreshInfo(); if (check.checked) SkipSilence.showPreview(3000); });
    refreshInfo();
}

// 靜音區塊的 UI 綁定（門檻部分改用 bindSensitivity）
(function bindSkipSilenceUI() {
    const check = document.getElementById('skipSilenceCheck');
    const options = document.getElementById('skipSilenceOptions');
    const minIn = document.getElementById('skipSilenceMinLen');
    const padIn = document.getElementById('skipSilencePad');
    if (!check) return;

    const p = SkipSilence.getParams();
    check.checked = SkipSilence.isEnabled();
    if (minIn) minIn.value = p.minLen;
    if (padIn) padIn.value = p.pad;

    const syncDisabled = () => {
        if (!options) return;
        options.style.opacity = check.checked ? '1' : '0.5';
        options.querySelectorAll('input, button').forEach(el => { el.disabled = !check.checked; });  // 連按鈕一起停用
    };
    syncDisabled();

    check.addEventListener('change', () => {
        SkipSilence.setEnabled(check.checked);
        syncDisabled();
    });

    bindSensitivity({
        kind: 'silence', check, options, invert: false, paramKey: 'thresholdDb',
        slider: document.getElementById('skipSilenceThreshold'),
        valEl: document.getElementById('skipSilenceThresholdVal'),
        levelEl: document.getElementById('skipSilenceLevelText'),
        infoEl: document.getElementById('skipSilenceInfo'),
        autoBtn: document.getElementById('skipSilenceAuto'),
        getDb: () => SkipSilence.getParams().thresholdDb
    });

    minIn?.addEventListener('change', () => {
        const v = Math.max(0.1, parseFloat(minIn.value) || 0.5);
        minIn.value = v;
        SkipSilence.setParams({ minLen: v });
        SkipSilence.showPreview(3000);
    });
    padIn?.addEventListener('change', () => {
        const v = Math.max(0, parseFloat(padIn.value) || 0);
        padIn.value = v;
        SkipSilence.setParams({ pad: v });
        SkipSilence.showPreview(3000);
    });

    // 每次開始播放時啟動檢查迴圈（重新整理後的還原也靠這裡）
    audioPlayer.addEventListener('play', () => SkipSilence.start());
    // 音檔載入完成、解碼資料更新後，若已啟用就重新偵測
    audioPlayer.addEventListener('loadedmetadata', () => {
        if (SkipSilence.isEnabled()) setTimeout(() => SkipSilence.setEnabled(true, true), 1500);
        if (SkipSilence.isNoiseEnabled()) setTimeout(() => SkipSilence.setNoiseEnabled(true, true), 1500);
        // 換音檔後（聲波已重建）重新偵測並重畫常駐顯示
        if (SkipSilence.isViewOn('sil') || SkipSilence.isViewOn('noise')) setTimeout(() => SkipSilence.refreshView(true), 1500);
    });
})();

// 「略過極短雜音」UI 綁定（滑桿方向反轉：值 = -dB，右邊＝積極）
(function bindSkipNoiseUI() {
    const check = document.getElementById('skipNoiseCheck');
    const options = document.getElementById('skipNoiseOptions');
    const maxIn = document.getElementById('skipNoiseMaxLen');
    if (!check) return;

    const p = SkipSilence.getParams();
    check.checked = SkipSilence.isNoiseEnabled();
    if (maxIn) maxIn.value = p.noiseMaxLen;

    const syncDisabled = () => {
        if (!options) return;
        options.style.opacity = check.checked ? '1' : '0.5';
        options.querySelectorAll('input, button').forEach(el => { el.disabled = !check.checked; });  // 連按鈕一起停用
    };
    syncDisabled();

    check.addEventListener('change', () => {
        SkipSilence.setNoiseEnabled(check.checked);
        syncDisabled();
    });

    bindSensitivity({
        kind: 'noise', check, options, invert: true, paramKey: 'noiseThDb',
        slider: document.getElementById('skipNoiseThreshold'),
        valEl: document.getElementById('skipNoiseThresholdVal'),
        levelEl: document.getElementById('skipNoiseLevelText'),
        infoEl: document.getElementById('skipNoiseInfo'),
        autoBtn: document.getElementById('skipNoiseAuto'),
        getDb: () => SkipSilence.getParams().noiseThDb
    });

    maxIn?.addEventListener('change', () => {
        const v = Math.max(0.02, parseFloat(maxIn.value) || 0.15);
        maxIn.value = v;
        SkipSilence.setParams({ noiseMaxLen: v });
        SkipSilence.showPreview(3000);
    });
})();

// 聲波「⋮」選單 —— 顯示靜音區塊／短雜訊（僅切換顯示）
// 關閉方式：① 再點一次同一個項目 ② 按 Esc ③ 按「取消選取」（選單內或工具列的按鈕皆可）
// 選單點擊後不自動關閉（#waveMoreMenu 本來就會擋掉點擊冒泡），方便對照聲波。
(function bindWaveViewMenu() {
    const items = {
        sil: document.getElementById('waveViewSilenceBtn'),
        noise: document.getElementById('waveViewNoiseBtn')
    };
    const labels = { sil: '靜音區塊', noise: '短雜訊' };

    function syncUI() {
        for (const k of Object.keys(items)) {
            const el = items[k];
            if (!el) continue;
            const on = SkipSilence.isViewOn(k);
            el.classList.toggle('view-on', on);
            const chip = el.querySelector('.wave-view-chip');
            if (chip) chip.style.display = on ? '' : 'none';
        }
    }
    SkipSilence.onViewChange(syncUI);

    for (const k of Object.keys(items)) {
        items[k]?.addEventListener('click', () => {
            const r = SkipSilence.toggleView(k);
            if (r === 'nobuf') {
                if (typeof showToast === 'function') showToast('請先載入音檔', 'error');
                return;
            }
            if (typeof showToast === 'function') {
                showToast(SkipSilence.isViewOn(k) ? `已顯示${labels[k]}（點區塊上的 ✕ 可保留；再點一次選單、按 Esc 或取消選取可關閉）` : `已關閉${labels[k]}顯示`, 'normal');
            }
        });
    }

    // Esc：只負責關閉顯示，不攔截事件（Esc 原本的取消選取、關選單等照常執行）
    document.addEventListener('keydown', (e) => {
        if (e.code !== 'Escape') return;
        const t = e.target;
        if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.isContentEditable)) return;
        SkipSilence.hideView();
    });

    // 取消選取：用 capture 先關閉顯示，不阻止原本的取消選取流程
    document.getElementById('waveCancelSelectBtn')?.addEventListener('click', () => SkipSilence.hideView(), true);
    document.getElementById('cancelRegionBtn')?.addEventListener('click', () => SkipSilence.hideView(), true);
})();
