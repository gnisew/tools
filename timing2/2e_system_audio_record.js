// 2e_system_audio_record.js: 錄製系統／分頁音訊（聲波 ⋮ 選單 > 錄製系統音訊）
// 原理：navigator.mediaDevices.getDisplayMedia 取得分享畫面的音訊軌（視訊軌立刻丟棄），
//       用 AudioWorklet（不支援時退回 ScriptProcessor）直接擷取原始 PCM，停止後自行寫成 16-bit WAV。
//       不經過 MediaRecorder／webm：webm 沒有時長資訊（會顯示 Infinity）、且被 4b 當成影片檔詢問轉檔。
// 流程：開始錄製 → 右上角出現錄音中小工具（可停止）→ 停止 →
//       若專案已有句子或時間標記，先跳確認視窗 → 取代目前音檔（走與選檔相同的載入流程）。
// 下載：錄音不自動下載；載入後使用者自行用既有的下載／匯出功能儲存。
// 限制：桌面版 Chrome／Edge 才完整支援；需 HTTPS 或 localhost；單次最長 60 分鐘（約 700MB 記憶體）。
//   · 選「Chrome 分頁」並勾「分享分頁音訊」：各系統皆可，適合錄網頁聲音
//   · 選「整個螢幕」並勾「分享系統音訊」：僅 Windows 可錄整機聲音
// 需求：1_globals.js（audioPlayer、showToast、showCustomDialog、saveToStorage）、
//       1a_audio_store_idb.js、
//       4b_ui_audio_loader.js（initWaveSurferAfterAudioLoad）、index.html 的 #waveSysRecordBtn
// 載入順序：4b 之後即可，建議放在 index.html 最後。

(function () {
    const btn = document.getElementById('waveSysRecordBtn');
    if (!btn) return;

    const btnIcon = btn.querySelector('.material-icons');
    const btnLabel = document.getElementById('waveSysRecordLabel');

    const MAX_MINUTES = 60;
    let session = null;   // { ctx, tracks, source, node, sink, chunks, frames, nCh, sampleRate, discard }
    let startedAt = 0;
    let tickTimer = null;

    function isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia && (window.AudioContext || window.webkitAudioContext));
    }

    // ---------- 錄音中小工具（固定在畫面上方，不必開選單即可停止） ----------
    const style = document.createElement('style');
    style.textContent = `
        #sysRecIndicator { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 3000;
            display: none; align-items: center; gap: 10px; padding: 6px 8px 6px 14px; border-radius: 999px;
            background: #C62828; color: #fff; font-size: 0.9rem; font-weight: bold;
            box-shadow: 0 4px 14px rgba(0,0,0,0.3); }
        #sysRecIndicator.show { display: flex; }
        #sysRecIndicator .rec-dot { width: 10px; height: 10px; border-radius: 50%; background: #fff; animation: sysRecBlink 1s infinite; }
        #sysRecIndicator .rec-time { font-family: monospace; min-width: 52px; }
        #sysRecIndicator button { border: none; border-radius: 999px; background: #fff; color: #C62828;
            font-weight: bold; padding: 4px 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 2px; }
        @keyframes sysRecBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
    `;
    document.head.appendChild(style);

    const indicator = document.createElement('div');
    indicator.id = 'sysRecIndicator';
    indicator.innerHTML = '<span class="rec-dot"></span><span>錄音中</span><span class="rec-time" id="sysRecTime">00:00</span>'
        + '<button type="button" id="sysRecStopBtn"><span class="material-icons" style="font-size:1.1rem;">stop</span>停止</button>';
    document.body.appendChild(indicator);
    const timeEl = indicator.querySelector('#sysRecTime');
    indicator.querySelector('#sysRecStopBtn').addEventListener('click', () => stopRecording());

    function fmtClock(sec) {
        const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function setRecordingUI(on) {
        indicator.classList.toggle('show', on);
        if (btnIcon) btnIcon.textContent = on ? 'stop_circle' : 'fiber_manual_record';
        if (btnLabel) btnLabel.textContent = on ? '停止錄製系統音訊' : '錄製系統音訊';
        clearInterval(tickTimer);
        if (on) {
            timeEl.textContent = '00:00';
            tickTimer = setInterval(() => { timeEl.textContent = fmtClock((Date.now() - startedAt) / 1000); }, 500);
        }
    }

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
        const nCh = s.nCh;
        const len = channels[0].length;
        const out = new Int16Array(len * nCh);
        for (let i = 0; i < len; i++) {
            for (let c = 0; c < nCh; c++) {
                const v = Math.max(-1, Math.min(1, channels[Math.min(c, channels.length - 1)][i]));
                out[i * nCh + c] = v < 0 ? v * 0x8000 : v * 0x7FFF;
            }
        }
        s.chunks.push(out);
        s.frames += len;
        if (s.frames / s.sampleRate >= MAX_MINUTES * 60) {
            showToast(`已達 ${MAX_MINUTES} 分鐘上限，自動結束錄製`, 'normal');
            stopRecording();
        }
    }

    async function startRecording() {
        if (!isSupported()) {
            return showToast('此瀏覽器不支援錄製系統音訊，請使用電腦版 Chrome 或 Edge', 'error');
        }
        if (!window.isSecureContext) {
            return showToast('錄製系統音訊需要 HTTPS 或 localhost 環境', 'error');
        }

        let stream;
        try {
            // 瀏覽器規定要同時申請畫面；取得後立刻丟掉視訊軌
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
            });
        } catch (err) {
            if (err && err.name === 'NotAllowedError') showToast('已取消分享，未開始錄製', 'normal');
            else showToast('無法開始錄製：' + (err && err.message ? err.message : err), 'error');
            return;
        }

        const tracks = stream.getAudioTracks();
        if (!tracks.length) {
            stream.getTracks().forEach(t => t.stop());
            return showToast('沒有取得音訊：請在分享視窗選「Chrome 分頁」並勾選「分享分頁音訊」（或 Windows 整個螢幕並勾選「分享系統音訊」）', 'error', 7000);
        }
        stream.getVideoTracks().forEach(t => t.stop());

        const AC = window.AudioContext || window.webkitAudioContext;
        let s;
        try {
            const ctx = new AC();
            if (ctx.state === 'suspended') await ctx.resume();
            const source = ctx.createMediaStreamSource(new MediaStream(tracks));
            const nCh = Math.min(2, Math.max(1, source.channelCount || 2));
            s = { ctx, tracks, source, node: null, sink: ctx.createGain(), chunks: [], frames: 0, nCh, sampleRate: ctx.sampleRate, discard: false };
            s.sink.gain.value = 0; // 不讓錄到的聲音再從喇叭播出（避免回授），只為了讓節點持續運作

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
            source.connect(s.node);
            s.node.connect(s.sink);
            s.sink.connect(ctx.destination);
        } catch (err) {
            console.error('[SysRecord] 建立錄音失敗：', err);
            tracks.forEach(t => t.stop());
            return showToast('無法開始錄製：' + (err && err.message ? err.message : err), 'error');
        }

        session = s;
        // 使用者在瀏覽器按「停止分享」時，同步結束錄製
        tracks[0].addEventListener('ended', () => { if (session === s) stopRecording(); });

        try { audioPlayer.pause(); } catch (e) {}

        startedAt = Date.now();
        setRecordingUI(true);
        showToast('開始錄製，請播放要錄的聲音；完成後按「停止」', 'success');
    }

    function stopRecording(discard) {
        const s = session;
        if (!s) return;
        session = null;
        try { s.source.disconnect(); s.node.disconnect(); s.sink.disconnect(); } catch (e) {}
        if (s.node && s.node.port) s.node.port.onmessage = null;
        s.tracks.forEach(t => t.stop());
        s.ctx.close().catch(() => {});
        setRecordingUI(false);
        if (discard) return;
        if (!s.frames) return showToast('沒有錄到任何聲音', 'error');
        handleRecordedBlob(buildWavBlob(s));
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

    function makeFileName() {
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        return `系統錄音_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}.wav`;
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none'; a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    }

    function handleRecordedBlob(wavBlob) {
        const fileName = makeFileName();
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

    // ---------- 綁定按鈕 ----------
    btn.addEventListener('click', () => {
        document.getElementById('waveMoreMenu')?.classList.remove('show');
        if (session) stopRecording();
        else startRecording();
    });

    // 錄製中關閉／重新整理頁面時提醒
    window.addEventListener('beforeunload', (e) => {
        if (session) { e.preventDefault(); e.returnValue = ''; }
    });

    // 不支援的瀏覽器：選項仍顯示，但標示灰階，點擊時給出原因
    if (!isSupported()) btn.style.opacity = '0.5';
})();
