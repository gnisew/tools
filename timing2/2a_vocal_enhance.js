// 2a_vocal_enhance.js: 人聲強化（壓抑配樂）即時播放引擎
// 原理（純 Web Audio，不需 CDN 或模型）：
//   1. 人聲多在立體聲正中央，配樂多分散左右：拆成 mid=(L+R)/2 與 side=(L-R)/2，強度越高 side 壓得越小
//   2. 再套用高通（切低頻鼓/貝斯）與低通（切高頻鈸/嘶聲）濾波
// 只處理播放輸出，不改 audioPlayer.src、音檔長度或 WaveSurfer 解碼資料，時間標記、剪裁、下載、IndexedDB 備份不受影響
// 預設關閉；第一次勾選時才建立 AudioContext
// 限制：跨網域且未開 CORS 的音檔會被瀏覽器靜音，故拒絕啟用（blob: 與同網域不受影響）
// 限制：單聲道錄音 (L=R) 的 side 為 0，無法分離，只剩濾波效果
// 需求：1_globals.js（audioPlayer、showToast）之後載入；index.html 需有 #vocalEnhanceCheck、#vocalEnhanceStrength、#vocalEnhanceStrengthLabel

const VocalEnhance = (() => {
    const KEY_ON = 'tagger_vocalEnhanceOn';
    const KEY_STRENGTH = 'tagger_vocalEnhanceStrength';

    let ctx = null;
    let source = null;  // MediaElementSource（整個頁面生命週期只能建立一次）
    let nodes = null;  // 處理鏈節點
    let enabled = false;
    let strength = parseInt(localStorage.getItem(KEY_STRENGTH), 10);
    if (isNaN(strength)) strength = 60;

    // 判斷音檔來源是否安全（blob/data/同網域）
    function isSourceSafe() {
        const src = audioPlayer.currentSrc || audioPlayer.src || '';
        if (!src) return true;  // 還沒載入音檔，先放行
        if (src.startsWith('blob:') || src.startsWith('data:')) return true;
        try {
            return new URL(src, location.href).origin === location.origin;
        } catch (e) { return false; }
    }

    // 建立處理鏈：source → 拆 mid/side → 重組立體聲 → 高通 → 低通 → 輸出
    function buildGraph() {
        // 優先使用 2d_volume_regions.js 的共用處理鏈（MediaElementSource 只能建立一次）
        const shared = window.AudioGraph ? AudioGraph.ensure() : null;
        if (shared) {
            ctx = shared.ctx;
            source = shared.source;
        } else {
            const AC = window.AudioContext || window.webkitAudioContext;
            ctx = new AC();
            source = ctx.createMediaElementSource(audioPlayer);
        }

        const splitter = ctx.createChannelSplitter(2);
        const merger = ctx.createChannelMerger(2);

        const midBus = ctx.createGain();  // (L+R)/2
        const sideBus = ctx.createGain();  // (L-R)/2
        const sideK = ctx.createGain();  // 側邊成分縮放（強度越高越小）
        const sideInv = ctx.createGain();  // 反相給右聲道
        sideInv.gain.value = -1;

        const lToMid = ctx.createGain(); lToMid.gain.value = 0.5;
        const rToMid = ctx.createGain(); rToMid.gain.value = 0.5;
        const lToSide = ctx.createGain(); lToSide.gain.value = 0.5;
        const rToSide = ctx.createGain(); rToSide.gain.value = -0.5;

        source.connect(splitter);
        splitter.connect(lToMid, 0);  lToMid.connect(midBus);
        splitter.connect(rToMid, 1);  rToMid.connect(midBus);
        splitter.connect(lToSide, 0); lToSide.connect(sideBus);
        splitter.connect(rToSide, 1); rToSide.connect(sideBus);
        sideBus.connect(sideK);

        // 左 = mid + k*side；右 = mid - k*side
        midBus.connect(merger, 0, 0);
        midBus.connect(merger, 0, 1);
        sideK.connect(merger, 0, 0);
        sideK.connect(sideInv);
        sideInv.connect(merger, 0, 1);

        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        const out = ctx.createGain();

        merger.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(out);

        nodes = { sideK, highpass, lowpass, out, entry: splitter };
        applyStrength();
    }

    // 依強度 0~100 更新參數
    function applyStrength() {
        if (!nodes) return;
        const s = strength / 100;
        const t = ctx.currentTime;
        nodes.sideK.gain.setTargetAtTime(1 - s, t, 0.02);  // 側邊成分：1 → 0
        nodes.highpass.frequency.setTargetAtTime(80 + s * 120, t, 0.02);  // 80Hz → 200Hz
        nodes.lowpass.frequency.setTargetAtTime(12000 - s * 6000, t, 0.02);  // 12kHz → 6kHz
        nodes.out.gain.setTargetAtTime(1 + s * 0.4, t, 0.02);  // 補償音量
    }

    // 輸出目的地：有共用處理鏈時接到音量區段的 GainNode，否則直接輸出
    function dest() { return (window.AudioGraph && AudioGraph.sink()) || ctx.destination; }

    // 切換「經過處理鏈」或「直通」
    function route(on) {
        if (!source) return;
        try { source.disconnect(); } catch (e) {}
        if (on) {
            source.connect(nodes.entry);
            nodes.out.connect(dest());
        } else {
            try { nodes.out.disconnect(); } catch (e) {}
            source.connect(dest());
        }
    }

    function setEnabled(on) {
        if (on) {
            if (!isSourceSafe()) {
                if (typeof showToast === 'function') showToast('此音檔來自其他網域，瀏覽器限制無法處理，人聲強化已取消', 'error');
                return false;
            }
            if (!ctx) {
                try { buildGraph(); }
                catch (err) {
                    console.error('[VocalEnhance] 建立失敗：', err);
                    if (typeof showToast === 'function') showToast('此瀏覽器無法啟用人聲強化', 'error');
                    return false;
                }
            }
            if (ctx.state === 'suspended') ctx.resume();
            route(true);
        } else if (ctx) {
            route(false);
        }
        enabled = on;
        localStorage.setItem(KEY_ON, on ? 'true' : 'false');
        return true;
    }

    function setStrength(v) {
        strength = Math.max(0, Math.min(100, parseInt(v, 10) || 0));
        localStorage.setItem(KEY_STRENGTH, String(strength));
        applyStrength();
    }

    // 產生人聲強化版分析音訊（供靜音斷句、漏標檢查、區段斷句使用）
    // 做法同播放（取中間成分 + 高通/低通），輸出單聲道、長度與取樣率與原檔相同，timeRatio 與標記位置不受影響；
    // 原始 buffer 不被修改，剪裁／下載／Whisper 轉錄仍使用原始資料
    let cacheSrc = null, cacheStrength = -1, cacheResult = null;

    // RBJ 雙二階濾波器（就地處理 Float32Array）
    function biquadInPlace(data, type, freq, sr) {
        const w0 = 2 * Math.PI * Math.min(freq, sr / 2 - 100) / sr;
        const cosw = Math.cos(w0), alpha = Math.sin(w0) / (2 * 0.7071);
        let b0, b1, b2;
        if (type === 'hp') { b0 = (1 + cosw) / 2; b1 = -(1 + cosw); b2 = b0; }
        else               { b0 = (1 - cosw) / 2; b1 = 1 - cosw;    b2 = b0; }
        const a0 = 1 + alpha, a1 = -2 * cosw, a2 = 1 - alpha;
        b0 /= a0; b1 /= a0; b2 /= a0; const na1 = a1 / a0, na2 = a2 / a0;
        let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        for (let i = 0; i < data.length; i++) {
            const x0 = data[i];
            const y0 = b0 * x0 + b1 * x1 + b2 * x2 - na1 * y1 - na2 * y2;
            x2 = x1; x1 = x0; y2 = y1; y1 = y0;
            data[i] = y0;
        }
    }

    function getAnalysisBuffer(buffer) {
        if (!enabled || !buffer) return buffer;
        if (cacheSrc === buffer && cacheStrength === strength && cacheResult) return cacheResult;

        const sr = buffer.sampleRate, len = buffer.length;
        const out = new Float32Array(len);
        const L = buffer.getChannelData(0);
        const R = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : L;
        for (let i = 0; i < len; i++) out[i] = (L[i] + R[i]) * 0.5;  // 中間成分（配樂偏左右的部分被抵消）

        const s = strength / 100;
        biquadInPlace(out, 'hp', 80 + s * 120, sr);
        biquadInPlace(out, 'lp', 12000 - s * 6000, sr);
        const g = 1 + s * 0.4;
        for (let i = 0; i < len; i++) out[i] *= g;

        const result = createBufferSafe(1, len, sr);
        result.getChannelData(0).set(out);
        cacheSrc = buffer; cacheStrength = strength; cacheResult = result;
        return result;
    }

    return { setEnabled, setStrength, getStrength: () => strength, isEnabled: () => enabled, isSourceSafe, getAnalysisBuffer,
             resume: () => { if (ctx && ctx.state === 'suspended') ctx.resume(); } };
})();

window.VocalEnhance = VocalEnhance;

// UI 綁定
(function bindVocalEnhanceUI() {
    const check = document.getElementById('vocalEnhanceCheck');
    const slider = document.getElementById('vocalEnhanceStrength');
    const label = document.getElementById('vocalEnhanceStrengthLabel');
    if (!check || !slider) return;

    slider.value = VocalEnhance.getStrength();
    if (label) label.textContent = slider.value + '%';

    check.addEventListener('change', () => {
        const ok = VocalEnhance.setEnabled(check.checked);
        if (!ok) check.checked = false;  // 啟用失敗，勾選退回
        slider.disabled = !check.checked;
    });

    slider.addEventListener('input', () => {
        VocalEnhance.setStrength(slider.value);
        if (label) label.textContent = slider.value + '%';
    });

    // 瀏覽器規定 AudioContext 需在使用者操作後才能出聲：每次播放時確保它是運作狀態
    audioPlayer.addEventListener('play', () => VocalEnhance.resume());

    // 還原上次的開關狀態
    slider.disabled = true;
    if (localStorage.getItem('tagger_vocalEnhanceOn') === 'true') {
        // 載入時 AudioContext 尚未被手勢解鎖，先還原勾選與設定，第一次播放時再實際啟用
        check.checked = true;
        slider.disabled = false;
        const activate = () => {
            audioPlayer.removeEventListener('play', activate);
            if (!VocalEnhance.setEnabled(true)) { check.checked = false; slider.disabled = true; }
        };
        audioPlayer.addEventListener('play', activate);
    }
})();
