// 2e_system_audio_record.js: 錄製音訊（系統／分頁、麥克風、系統＋麥克風）
// 入口：「選擇音檔」視窗的第三個頁籤「錄製音訊」（#tabRecordAudio / #sectionRecordAudio / #recStartBtn）。
//       聲波 ⋮ 選單的「錄製音訊」(#waveSysRecordBtn) 為捷徑：未錄製時開啟視窗並切到錄製頁籤；錄製中則直接停止。
// 三種來源：
//   system：getDisplayMedia 的音訊軌（視訊軌立刻丟棄）
//   mic   ：getUserMedia 麥克風（單聲道）
//   both  ：兩者在同一個 AudioContext 混成一軌（立體聲）
// 擷取：AudioWorklet（不支援時退回 ScriptProcessor）直接取原始 PCM，停止後自行寫成 16-bit WAV。
//       不經過 MediaRecorder／webm：webm 沒有時長資訊（會顯示 Infinity）、且被 4b 當成影片檔詢問轉檔。
// 流程：選來源 → 按「開始錄製」（此時才會跳出瀏覽器的分享／麥克風授權）→ 視窗不關閉，來源選擇換成「錄音中」面板
//       （大字計時＋音量條），底部按鈕變成「停止錄製」，其他兩個頁籤停用 →
//       按「停止錄製」→ 視窗自動關閉 → 若專案已有句子或時間標記，先跳確認視窗 → 取代目前音檔（走與選檔相同的載入流程）。
//       錄製中可按「暫停」／「繼續錄製」（暫停期間的聲音不收，不計入時間，最後合成同一個檔）。
//       錄製中底部的「取消」改叫「關閉視窗」，按下後錄音繼續，此時才在右上角顯示浮動小工具；重新開啟視窗會直接回到錄製頁籤的錄音中面板。
// 下載：錄音不自動下載；載入後使用者自行用既有的下載／匯出功能儲存。
// 限制：需 HTTPS 或 localhost；系統／分頁音訊僅電腦版 Chrome／Edge；單次最長 60 分鐘（約 700MB 記憶體）。
//   · 選「Chrome 分頁」並勾「分享分頁音訊」：各系統皆可，適合錄網頁聲音
//   · 選「整個螢幕」並勾「分享系統音訊」：僅 Windows 可錄整機聲音
//   · 麥克風錄音在手機瀏覽器也可使用
// 需求：1_globals.js（audioPlayer、showToast、showCustomDialog、saveToStorage）、1a_audio_store_idb.js、
//       4b_ui_audio_loader.js（initWaveSurferAfterAudioLoad）、index.html 的「選擇音檔」視窗與錄製頁籤
// 載入順序：4b 之後即可，建議放在 index.html 最後。

(function () {
    const overlay = document.getElementById('audioLoadModalOverlay');
    const tabRec = document.getElementById('tabRecordAudio');
    const startBtn = document.getElementById('recStartBtn');
    if (!overlay || !tabRec || !startBtn) return;

    const menuBtn = document.getElementById('waveSysRecordBtn');  // ⋮ 選單捷徑（選用）
    const menuIcon = menuBtn && menuBtn.querySelector('.material-icons');
    const menuLabel = document.getElementById('waveSysRecordLabel');
    const hintEl = document.getElementById('recModeHint');
    const radios = Array.from(document.querySelectorAll('input[name="recMode"]'));

    const MAX_MINUTES = 60;
    const KEY_MODE = 'tagger_recMode';
    const MODES = {
        system: { label: '系統錄音',   prefix: '系統錄音',   display: true,  mic: false },
        mic:    { label: '麥克風錄音', prefix: '麥克風錄音', display: false, mic: true  },
        both:   { label: '混合錄音',   prefix: '混合錄音',   display: true,  mic: true  }
    };
    const HINTS = {
        system: '按下「開始錄製」後，瀏覽器會跳出分享視窗：選「Chrome 分頁」並勾選「分享分頁音訊」（各系統適用），或選「整個螢幕」並勾選「分享系統音訊」（僅 Windows）。',
        mic:    '按下「開始錄製」後，瀏覽器會詢問麥克風權限，允許後立即開始錄製。',
        both:   '先選分享來源（同「系統音訊」），再允許麥克風，兩者會混成一軌。建議戴耳機，避免麥克風收進喇叭的聲音而產生回音。'
    };

    let session = null;   // { ctx, tracks, nodes, node, sink, analyser, chunks, frames, nCh, sampleRate, peak, mode }
    let starting = false;
    let startedAt = 0;
    let pausedAt = 0;      // 暫停開始的時間（未暫停為 0）
    let pausedTotal = 0;   // 累計已暫停的毫秒數
    let tickTimer = null;
    let pendingOpenRec = false;

    // ---------- 樣式：頁籤切換完全由 .rec-mode 類別控制，不依賴 4b 的切換程式 ----------
    const style = document.createElement('style');
    style.textContent = `
        #sectionRecordAudio { display: none; }
        #audioLoadModalOverlay.rec-mode #sectionRecordAudio { display: block; }
        #audioLoadModalOverlay.rec-mode #sectionLocalLoad,
        #audioLoadModalOverlay.rec-mode #sectionOnlineLoad,
        #audioLoadModalOverlay.rec-mode #mergeSettingsBlock,
        #audioLoadModalOverlay.rec-mode #audioLoadConfirmBtn { display: none !important; }
        #audioLoadModalOverlay.rec-mode #tabLocalLoad,
        #audioLoadModalOverlay.rec-mode #tabOnlineLoad { background: transparent !important; color: #666 !important; border-bottom-color: transparent !important; }
        #audioLoadModalOverlay.rec-mode #tabRecordAudio { background: white !important; color: #C62828 !important; border-bottom-color: #C62828 !important; }
        .rec-mode-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .rec-mode-card { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 6px; text-align: center;
            border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 0.88rem; font-weight: bold; color: #444; background: #FAFAFA; }
        .rec-mode-card input { position: absolute; opacity: 0; pointer-events: none; }
        .rec-mode-card .material-icons { font-size: 1.6rem; color: #888; }
        .rec-mode-card:has(input:checked) { border-color: #C62828; background: #FFEBEE; color: #C62828; }
        .rec-mode-card:has(input:checked) .material-icons { color: #C62828; }
        .rec-mode-card:has(input:focus-visible) { outline: 2px solid #C62828; outline-offset: 2px; }
        .rec-mode-card:has(input:disabled) { opacity: 0.45; cursor: not-allowed; }
        #recStartBtn { display: none; padding: 10px 24px; border: none; border-radius: 6px; background: #C62828; color: #fff;
            font-weight: bold; cursor: pointer; align-items: center; gap: 4px; }
        #audioLoadModalOverlay.rec-mode #recStartBtn { display: inline-flex; }
        #recStartBtn .material-icons { font-size: 1.1rem; }
        #recStartBtn:disabled { background: #BDBDBD; cursor: not-allowed; }

        #recStartBtn.is-stop { background: #263238; }
        #recPauseBtn { display: none; padding: 10px 20px; border: 2px solid #C62828; border-radius: 6px; background: #fff; color: #C62828;
            font-weight: bold; cursor: pointer; align-items: center; gap: 4px; }
        #audioLoadModalOverlay.rec-active #recPauseBtn { display: inline-flex; }
        #recPauseBtn .material-icons { font-size: 1.1rem; }
        #recPauseBtn.is-paused { border-color: #E65100; background: #FFF3E0; color: #E65100; }
        #recActivePane.paused .rec-act-label { color: #E65100; }
        #recActivePane.paused .rec-dot { animation: none; background: #E65100; }
        #recActivePane.paused .rec-act-time { color: #999; }
        #sysRecIndicator.paused { background: #E65100; }
        #sysRecIndicator.paused .rec-dot { animation: none; }
        #recActivePane { display: none; }
        #audioLoadModalOverlay.rec-active #recSourcePane { display: none; }
        #audioLoadModalOverlay.rec-active #recActivePane { display: flex; flex-direction: column; align-items: center; justify-content: center;
            gap: 10px; min-height: 200px; text-align: center; }
        #recActivePane .rec-act-label { display: inline-flex; align-items: center; gap: 8px; font-weight: bold; color: #C62828; font-size: 1rem; }
        #recActivePane .rec-dot { width: 10px; height: 10px; border-radius: 50%; background: #C62828; animation: sysRecBlink 1s infinite; }
        #recActivePane .rec-act-time { font-family: monospace; font-size: 3.2rem; font-weight: bold; color: #222; line-height: 1.1; }
        #recActivePane .rec-act-meter { width: 100%; max-width: 360px; height: 10px; border-radius: 5px; background: #ECEFF1; overflow: hidden; }
        #recActivePane .rec-act-meter i { display: block; height: 100%; width: 0; background: #C62828; transition: width 0.08s linear; }
        #recActivePane .rec-act-hint { margin: 4px 0 0 0; font-size: 0.82rem; color: #888; line-height: 1.5; }
        #tabLocalLoad:disabled, #tabOnlineLoad:disabled { opacity: 0.4; cursor: not-allowed !important; }

        #sysRecIndicator { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 3000;
            display: none; align-items: center; gap: 10px; padding: 6px 8px 6px 14px; border-radius: 999px;
            background: #C62828; color: #fff; font-size: 0.9rem; font-weight: bold;
            box-shadow: 0 4px 14px rgba(0,0,0,0.3); }
        #sysRecIndicator.show { display: flex; }
        #sysRecIndicator .rec-dot { width: 10px; height: 10px; border-radius: 50%; background: #fff; animation: sysRecBlink 1s infinite; }
        #sysRecIndicator .rec-time { font-family: monospace; min-width: 52px; }
        #sysRecIndicator .rec-meter { width: 44px; height: 6px; border-radius: 3px; background: rgba(255,255,255,0.3); overflow: hidden; }
        #sysRecIndicator .rec-meter i { display: block; height: 100%; width: 0; background: #fff; transition: width 0.08s linear; }
        #sysRecIndicator button { border: none; border-radius: 999px; background: #fff; color: #C62828;
            font-weight: bold; padding: 4px 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 2px; }
        @keyframes sysRecBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
    `;
    document.head.appendChild(style);

    // ---------- 錄音中小工具（固定在畫面上方，不必開視窗即可停止；含音量條，可確認有收到聲音） ----------
    const indicator = document.createElement('div');
    indicator.id = 'sysRecIndicator';
    indicator.innerHTML = '<span class="rec-dot"></span><span id="sysRecLabel">錄音中</span><span class="rec-time" id="sysRecTime">00:00</span>'
        + '<span class="rec-meter" title="輸入音量"><i id="sysRecMeter"></i></span>'
        + '<button type="button" id="sysRecPauseBtn"></button>'
        + '<button type="button" id="sysRecStopBtn"><span class="material-icons" style="font-size:1.1rem;">stop</span>停止</button>';
    document.body.appendChild(indicator);
    const timeEl = indicator.querySelector('#sysRecTime');
    const meterEl = indicator.querySelector('#sysRecMeter');
    const recLabelEl = indicator.querySelector('#sysRecLabel');
    indicator.querySelector('#sysRecStopBtn').addEventListener('click', () => stopRecording());
    const indPauseBtn = indicator.querySelector('#sysRecPauseBtn');
    indPauseBtn.addEventListener('click', () => togglePause());

    // ---------- 視窗內的「錄音中」面板：把原本的來源選擇包進 #recSourcePane，錄製中以 .rec-active 切換顯示 ----------
    const section = document.getElementById('sectionRecordAudio');
    const sourcePane = document.createElement('div');
    sourcePane.id = 'recSourcePane';
    while (section.firstChild) sourcePane.appendChild(section.firstChild);
    section.appendChild(sourcePane);
    const activePane = document.createElement('div');
    activePane.id = 'recActivePane';
    activePane.innerHTML = '<div class="rec-act-label"><span class="rec-dot"></span><span id="recActLabel">錄音中</span></div>'
        + '<div class="rec-act-time" id="recActTime">00:00</div>'
        + '<div class="rec-act-meter" title="輸入音量"><i id="recActMeter"></i></div>'
        + '<p class="rec-act-hint">可按「暫停」稍作休息再繼續，完成後按「停止錄製」。關閉視窗不會中斷錄音，可改用右上角小工具操作。</p>';
    section.appendChild(activePane);
    let recBaseLabel = '';
    const actLabelEl = activePane.querySelector('#recActLabel');
    const actTimeEl = activePane.querySelector('#recActTime');
    const actMeterEl = activePane.querySelector('#recActMeter');
    const tabLocalEl = document.getElementById('tabLocalLoad');
    const tabOnlineEl = document.getElementById('tabOnlineLoad');

    // 浮動小工具只在「錄製中且視窗已關閉」時顯示
    function syncIndicator() {
        indicator.classList.toggle('show', !!session && !overlay.classList.contains('show'));
    }

    function renderStartBtn() {
        const rec = !!session;
        startBtn.classList.toggle('is-stop', rec);
        startBtn.innerHTML = rec
            ? '<span class="material-icons">stop</span> 停止錄製'
            : '<span class="material-icons">fiber_manual_record</span> 開始錄製';
    }

    const cancelBtn = document.getElementById('audioLoadCancelBtn');
    const pauseBtn = document.createElement('button');
    pauseBtn.type = 'button';
    pauseBtn.id = 'recPauseBtn';
    startBtn.parentNode.insertBefore(pauseBtn, startBtn);
    pauseBtn.addEventListener('click', () => togglePause());

    function elapsedMs() {
        const end = pausedAt || Date.now();
        return Math.max(0, end - startedAt - pausedTotal);
    }

    function renderPauseUI() {
        const p = !!(session && session.paused);
        activePane.classList.toggle('paused', p);
        indicator.classList.toggle('paused', p);
        pauseBtn.classList.toggle('is-paused', p);
        pauseBtn.innerHTML = p
            ? '<span class="material-icons">play_arrow</span> 繼續錄製'
            : '<span class="material-icons">pause</span> 暫停';
        indPauseBtn.innerHTML = p
            ? '<span class="material-icons" style="font-size:1.1rem;">play_arrow</span>繼續'
            : '<span class="material-icons" style="font-size:1.1rem;">pause</span>暫停';
        const text = (p ? '已暫停・' : '錄音中・') + recBaseLabel;
        recLabelEl.textContent = text;
        actLabelEl.textContent = text;
        if (p) { meterEl.style.width = '0'; actMeterEl.style.width = '0'; }
    }

    function togglePause() {
        const s = session;
        if (!s) return;
        s.paused = !s.paused;
        if (s.paused) pausedAt = Date.now();
        else { pausedTotal += Date.now() - pausedAt; pausedAt = 0; }
        renderPauseUI();
    }

    function closeWindow() {
        if (overlay.classList.contains('show')) document.getElementById('audioLoadCancelBtn')?.click();
    }

    function fmtClock(sec) {
        const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function setRecordingUI(on, mode) {
        overlay.classList.toggle('rec-active', on);
        if (tabLocalEl) tabLocalEl.disabled = on;    // 錄製中停用其他兩個頁籤（被停用的按鈕連程式 click() 也不會觸發）
        if (tabOnlineEl) tabOnlineEl.disabled = on;
        renderStartBtn();
        if (cancelBtn) cancelBtn.textContent = on ? '關閉視窗' : '取消';   // 錄製中它只是關視窗，錄音不會取消
        syncIndicator();
        if (menuIcon) menuIcon.textContent = on ? 'stop_circle' : 'fiber_manual_record';
        if (menuLabel) menuLabel.textContent = on ? '停止錄製' : '錄製音訊';
        clearInterval(tickTimer);
        meterEl.style.width = '0';
        actMeterEl.style.width = '0';
        if (on) {
            recBaseLabel = MODES[mode].label.replace('錄音', '');
            timeEl.textContent = '00:00';
            actTimeEl.textContent = '00:00';
            renderPauseUI();
            const buf = new Float32Array(1024);
            tickTimer = setInterval(() => {
                const clock = fmtClock(elapsedMs() / 1000);
                timeEl.textContent = clock;
                actTimeEl.textContent = clock;
                const s = session;
                if (s && s.analyser && !s.paused) {
                    s.analyser.getFloatTimeDomainData(buf);
                    let p = 0;
                    for (let i = 0; i < buf.length; i++) { const a = Math.abs(buf[i]); if (a > p) p = a; }
                    const w = Math.min(100, Math.sqrt(p) * 100) + '%';
                    meterEl.style.width = w;
                    actMeterEl.style.width = w;
                }
            }, 100);
        }
    }

    // ---------- 頁籤與來源選擇 ----------
    function setRecTab(on) {
        overlay.classList.toggle('rec-mode', on);
        tabRec.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) {
            ['tabLocalLoad', 'tabOnlineLoad'].forEach(id => document.getElementById(id)?.setAttribute('aria-selected', 'false'));
        }
    }
    tabRec.addEventListener('click', () => setRecTab(true));
    // 本檔最後載入，所以這裡的監聽會排在 4b 的切換之後執行
    ['tabLocalLoad', 'tabOnlineLoad'].forEach(id => document.getElementById(id)?.addEventListener('click', () => setRecTab(false)));

    // 視窗重新開啟時回到預設頁籤（由聲波選單捷徑開啟時例外）
    let wasShown = overlay.classList.contains('show');
    new MutationObserver(() => {
        const shown = overlay.classList.contains('show');
        if (shown && !wasShown) {
            if (session) { pendingOpenRec = false; setRecTab(true); }   // 錄製中重新開啟：直接回到錄製頁籤
            else if (pendingOpenRec) pendingOpenRec = false;
            else setRecTab(false);
        }
        if (!shown) pendingOpenRec = false;
        wasShown = shown;
        syncIndicator();   // 視窗開著時隱藏浮動小工具，關閉時（錄製中）顯示
    }).observe(overlay, { attributes: true, attributeFilter: ['class'] });

    function unsupportedReason(mode) {
        if (!window.isSecureContext) return '需要 HTTPS 或 localhost 環境';
        if (!(window.AudioContext || window.webkitAudioContext)) return '此瀏覽器不支援 Web Audio';
        const md = navigator.mediaDevices, m = MODES[mode];
        if (m.display && !(md && md.getDisplayMedia)) return '需要電腦版 Chrome 或 Edge';
        if (m.mic && !(md && md.getUserMedia)) return '此瀏覽器無法使用麥克風';
        return '';
    }

    function getMode() {
        const r = radios.find(x => x.checked);
        return r ? r.value : 'system';
    }

    function refreshModeUI() {
        if (session) { startBtn.disabled = false; return; }   // 錄製中：按鈕是「停止錄製」，不可被停用
        const mode = getMode();
        if (hintEl) hintEl.textContent = unsupportedReason(mode) ? '此來源無法使用：' + unsupportedReason(mode) : HINTS[mode];
        startBtn.disabled = !!unsupportedReason(mode);
    }

    (function initModes() {
        radios.forEach(r => {
            const why = unsupportedReason(r.value);
            if (why) { r.disabled = true; r.parentElement.title = why; }
            r.addEventListener('change', () => { localStorage.setItem(KEY_MODE, r.value); refreshModeUI(); });
        });
        const saved = localStorage.getItem(KEY_MODE);
        const pick = radios.find(r => r.value === saved && !r.disabled) || radios.find(r => !r.disabled) || radios[0];
        if (pick) pick.checked = true;
        refreshModeUI();
    })();

    // ---------- 開始／停止 ----------
    const WORKLET_CODE = `
        class SysRecProcessor extends AudioWorkletProcessor {
            constructor() { super(); this.buf = null; this.n = 0; }
            process(inputs) {
                const inp = inputs[0];
                if (!inp || !inp.length) return true;
                const nCh = Math.min(2, inp.length);
                if (!this.buf) this.buf = Array.from({ length: nCh }, () => new Float32Array(4096));
                const len = inp[0].length;
                for (let c = 0; c < this.buf.length; c++) this.buf[c].set(inp[Math.min(c, inp.length - 1)], this.n);
                this.n += len;
                if (this.n + 128 > 4096) {
                    this.port.postMessage(this.buf.map(b => b.slice(0, this.n)));
                    this.n = 0;
                }
                return true;
            }
        }
        registerProcessor('sys-rec-processor', SysRecProcessor);
    `;

    // 收到一批各聲道的 Float32 → 轉 16-bit 並交錯存放
    function pushFrames(s, channels) {
        if (s.paused) return;   // 暫停：收到的資料直接丟掉，不寫入、不計時
        const nCh = s.nCh;
        const len = channels[0].length;
        const out = new Int16Array(len * nCh);
        let peak = s.peak;
        for (let i = 0; i < len; i++) {
            for (let c = 0; c < nCh; c++) {
                const v = Math.max(-1, Math.min(1, channels[Math.min(c, channels.length - 1)][i]));
                const a = v < 0 ? -v : v;
                if (a > peak) peak = a;
                out[i * nCh + c] = v < 0 ? v * 0x8000 : v * 0x7FFF;
            }
        }
        s.peak = peak;
        s.chunks.push(out);
        s.frames += len;
        if (s.frames / s.sampleRate >= MAX_MINUTES * 60) {
            showToast(`已達 ${MAX_MINUTES} 分鐘上限，自動結束錄製`, 'normal');
            stopRecording();
        }
    }

    async function startRecording() {
        if (session || starting) return;
        const mode = getMode();
        const why = unsupportedReason(mode);
        if (why) return showToast('無法錄製：' + why, 'error');

        starting = true;
        startBtn.disabled = true;

        // 在使用者點擊當下就建立 AudioContext，避免等授權視窗結束後被瀏覽器擋成 suspended
        const AC = window.AudioContext || window.webkitAudioContext;
        const ctx = new AC();
        try { ctx.resume(); } catch (e) {}
        const allTracks = [];
        const cleanup = () => { allTracks.forEach(t => t.stop()); ctx.close().catch(() => {}); };

        try {
            const m = MODES[mode];
            let sysTracks = [], micStream = null;

            // 先要分享畫面（需使用者手勢），再要麥克風
            if (m.display) {
                let stream;
                try {
                    // 瀏覽器規定要同時申請畫面；取得後立刻丟掉視訊軌
                    stream = await navigator.mediaDevices.getDisplayMedia({
                        video: true,
                        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
                    });
                } catch (err) {
                    cleanup();
                    if (err && err.name === 'NotAllowedError') showToast('已取消分享，未開始錄製', 'normal');
                    else showToast('無法開始錄製：' + (err && err.message ? err.message : err), 'error');
                    return;
                }
                stream.getTracks().forEach(t => allTracks.push(t));
                sysTracks = stream.getAudioTracks();
                stream.getVideoTracks().forEach(t => t.stop());
                if (!sysTracks.length) {
                    cleanup();
                    return showToast('沒有取得系統音訊：請在分享視窗選「Chrome 分頁」並勾選「分享分頁音訊」（或 Windows 整個螢幕並勾選「分享系統音訊」）', 'error', 7000);
                }
            }

            if (m.mic) {
                try {
                    micStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            channelCount: 1,
                            echoCancellation: mode === 'both',  // 混合時開啟，減少麥克風收進喇叭聲；單錄麥克風保持原音
                            noiseSuppression: false,
                            autoGainControl: false
                        }
                    });
                } catch (err) {
                    cleanup();
                    const name = err && err.name;
                    if (name === 'NotAllowedError' || name === 'SecurityError') showToast('麥克風權限被拒絕，請在網址列左側的網站設定中允許麥克風', 'error', 6000);
                    else if (name === 'NotFoundError' || name === 'OverconstrainedError') showToast('找不到可用的麥克風', 'error');
                    else showToast('無法使用麥克風：' + (err && err.message ? err.message : err), 'error');
                    return;
                }
                micStream.getTracks().forEach(t => allTracks.push(t));
            }

            // 處理鏈：（系統音訊 × 0.8）＋ 麥克風 → mixer → 分析器（音量條）＋ 擷取節點 → 靜音 sink
            const nCh = mode === 'mic' ? 1 : 2;
            const mixer = ctx.createGain();
            mixer.channelCount = nCh; mixer.channelCountMode = 'explicit'; mixer.channelInterpretation = 'speakers';  // 單聲道麥克風會複製到左右
            const nodes = [mixer];
            if (sysTracks.length) {
                const sysSrc = ctx.createMediaStreamSource(new MediaStream(sysTracks));
                const sysGain = ctx.createGain();
                sysGain.gain.value = mode === 'both' ? 0.8 : 1;  // 混合時略降，避免與人聲疊加後爆音
                sysSrc.connect(sysGain); sysGain.connect(mixer);
                nodes.push(sysSrc, sysGain);
            }
            if (micStream) {
                const micSrc = ctx.createMediaStreamSource(micStream);
                micSrc.connect(mixer);
                nodes.push(micSrc);
            }
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            mixer.connect(analyser);
            nodes.push(analyser);

            const s = { ctx, tracks: allTracks, nodes, node: null, sink: ctx.createGain(), analyser, chunks: [], frames: 0, nCh, sampleRate: ctx.sampleRate, peak: 0, mode, paused: false };
            s.sink.gain.value = 0;  // 不讓錄到的聲音再從喇叭播出（避免回授），只為了讓節點持續運作
            nodes.push(s.sink);

            if (ctx.audioWorklet && window.AudioWorkletNode) {
                const url = URL.createObjectURL(new Blob([WORKLET_CODE], { type: 'application/javascript' }));
                try { await ctx.audioWorklet.addModule(url); } finally { URL.revokeObjectURL(url); }
                s.node = new AudioWorkletNode(ctx, 'sys-rec-processor', { numberOfInputs: 1, numberOfOutputs: 1, channelCount: nCh, channelCountMode: 'explicit' });
                s.node.port.onmessage = (e) => { if (session === s) pushFrames(s, e.data); };
            } else {
                s.node = ctx.createScriptProcessor(4096, nCh, nCh);
                s.node.onaudioprocess = (e) => {
                    if (session !== s) return;
                    const chans = [];
                    for (let c = 0; c < nCh; c++) chans.push(new Float32Array(e.inputBuffer.getChannelData(c)));
                    pushFrames(s, chans);
                };
            }
            nodes.push(s.node);
            mixer.connect(s.node);
            s.node.connect(s.sink);
            s.sink.connect(ctx.destination);

            session = s;
            // 使用者在瀏覽器按「停止分享」或麥克風被拔除時，同步結束錄製
            allTracks.forEach(t => t.addEventListener('ended', () => { if (session === s) stopRecording(); }));

            try { audioPlayer.pause(); } catch (e) {}

            startedAt = Date.now();
            pausedAt = 0; pausedTotal = 0;
            setRecordingUI(true, mode);   // 視窗保持開啟，切換成「錄音中」面板
            showToast(mode === 'mic' ? '開始錄製麥克風，完成後按「停止錄製」' : '開始錄製，請播放要錄的聲音；完成後按「停止錄製」', 'success');
        } catch (err) {
            console.error('[Record] 建立錄音失敗：', err);
            cleanup();
            showToast('無法開始錄製：' + (err && err.message ? err.message : err), 'error');
        } finally {
            starting = false;
            refreshModeUI();
        }
    }

    function stopRecording(discard) {
        const s = session;
        if (!s) return;
        session = null;
        try { s.nodes.forEach(n => n.disconnect()); } catch (e) {}
        if (s.node && s.node.port) s.node.port.onmessage = null;
        s.tracks.forEach(t => t.stop());
        s.ctx.close().catch(() => {});
        setRecordingUI(false);
        if (discard) return;
        if (!s.frames) return showToast('沒有錄到任何聲音', 'error');
        if (s.peak < 0.001) {
            // 整段都是靜音，載入只會把原本的音檔換成一段空白
            const tip = s.mode === 'mic' ? '請確認麥克風沒有被靜音、系統選對了輸入裝置' : '請確認分享時有勾選音訊，且來源確實有在播放';
            return showToast('整段錄音幾乎沒有聲音，已放棄。' + tip, 'error', 7000);
        }
        closeWindow();   // 錄到有效聲音：關閉視窗，再進入確認／載入流程
        handleRecordedBlob(buildWavBlob(s), s.mode);
    }

    // 16-bit PCM WAV：檔頭長度由實際錄到的取樣數算出，所以總長一定正確
    function buildWavBlob(s) {
        const dataSize = s.frames * s.nCh * 2;
        const header = new ArrayBuffer(44);
        const v = new DataView(header);
        const str = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
        str(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true); str(8, 'WAVE');
        str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, s.nCh, true);
        v.setUint32(24, s.sampleRate, true); v.setUint32(28, s.sampleRate * s.nCh * 2, true);
        v.setUint16(32, s.nCh * 2, true); v.setUint16(34, 16, true);
        str(36, 'data'); v.setUint32(40, dataSize, true);
        return new Blob([header, ...s.chunks], { type: 'audio/wav' });
    }

    // ---------- 錄完：確認 → 載入 ----------
    function hasProjectProgress() {
        const hasLabels = typeof allLabelsOrdered !== 'undefined' && allLabelsOrdered.length > 0;
        const hasTimes = typeof timeDataMap !== 'undefined' && Object.keys(timeDataMap).length > 0;
        return hasLabels || hasTimes;
    }

    function makeFileName(mode) {
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        return `${MODES[mode].prefix}_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}.wav`;
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none'; a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    }

    function handleRecordedBlob(wavBlob, mode) {
        const fileName = makeFileName(mode);
        const file = new File([wavBlob], fileName, { type: 'audio/wav', lastModified: Date.now() });

        if (hasProjectProgress()) {
            showCustomDialog({
                title: '用錄音取代目前音檔？',
                message: `已錄好 <b>${fileName}</b>。<br><br>載入後會<b style="color:#C62828;">取代目前的音檔</b>，文字與時間標記維持不變，但標記位置可能對不上新錄音。<br><span style="color:#00897B;">（若不取代，可先下載錄音另行保存）</span>`,
                confirmText: '取代音檔', altText: '僅下載錄音', cancelText: '放棄錄音',
                onConfirm: () => loadRecordedFile(file),
                onAlt: () => { downloadBlob(wavBlob, fileName); showToast('錄音已下載', 'success'); }
            });
        } else {
            loadRecordedFile(file);
        }
    }

    // 與 4b 的 processAudioFile 相同的載入步驟（略過檔名比對對話框，因為前面已確認過）
    function loadRecordedFile(file) {
        const oldSrc = audioPlayer.src;
        audioPlayer.src = URL.createObjectURL(file);
        audioPlayer.load();

        if (oldSrc && oldSrc.startsWith('blob:') && oldSrc !== audioPlayer.src) {
            let revoked = false;
            const revokeOld = () => {
                if (revoked) return;
                revoked = true;
                URL.revokeObjectURL(oldSrc);
                audioPlayer.removeEventListener('loadeddata', revokeOld);
            };
            audioPlayer.addEventListener('loadeddata', revokeOld, { once: true });
            setTimeout(revokeOld, 5000);
        }

        if (typeof AudioStore !== 'undefined' && AudioStore.isSupported()) {
            AudioStore.save(file, { name: file.name });
        }
        localStorage.setItem('tagger_localFileName', file.name);
        localStorage.setItem('tagger_originalFileName', file.name);
        localStorage.setItem('tagger_originalFileSig', `${file.size}-${file.lastModified}`);
        localStorage.removeItem('tagger_isTrimmed');
        localStorage.removeItem('tagger_originalBitrateKbps'); // WAV 無損，匯出 MP3 退回預設位元率
        localStorage.setItem('tagger_audioType', 'local');
        if (typeof localFileHint !== 'undefined' && localFileHint) localFileHint.style.display = 'none';

        if (typeof saveToStorage === 'function') saveToStorage();
        if (typeof updateMainTitleDisplay === 'function') updateMainTitleDisplay();
        if (typeof initWaveSurferAfterAudioLoad === 'function') initWaveSurferAfterAudioLoad();
        if (typeof renderSentenceList === 'function') renderSentenceList();
        if (typeof checkButtonVisibility === 'function') checkButtonVisibility();

        showToast(`已載入錄音「${file.name}」。如需保存，請用下載功能自行儲存`, 'success', 5000);
    }

    // ---------- 綁定 ----------
    startBtn.addEventListener('click', () => { if (session) stopRecording(); else startRecording(); });

    // ⋮ 選單捷徑：錄製中 → 停止；未錄製 → 開啟「選擇音檔」並切到錄製頁籤
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            document.getElementById('waveMoreMenu')?.classList.remove('show');
            if (session) return stopRecording();
            pendingOpenRec = true;
            (document.getElementById('openAudioModalBtn') || document.getElementById('sidebarAudioBtn'))?.click();
            if (!overlay.classList.contains('show')) { overlay.classList.add('show'); document.body.style.overflow = 'hidden'; }
            setRecTab(true);
        });
    }

    // 錄製中關閉／重新整理頁面時提醒
    window.addEventListener('beforeunload', (e) => {
        if (session) { e.preventDefault(); e.returnValue = ''; }
    });
})();
