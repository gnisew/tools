// 2e_system_audio_record.js: 錄製系統／分頁音訊（聲波 ⋮ 選單 > 錄製系統音訊）
// 原理：navigator.mediaDevices.getDisplayMedia 取得分享畫面的音訊軌（視訊軌立刻丟棄），
//       用 MediaRecorder 錄成 webm，停止後以 decodeAudioData 解成 PCM 再編成 WAV 載入。
//       （直接載入 MediaRecorder 的 webm 會沒有時長資訊，無法拖曳定位，所以一律轉 WAV）
// 流程：開始錄製 → 右上角出現錄音中小工具（可停止）→ 停止 →
//       若專案已有句子或時間標記，先跳確認視窗 → 取代目前音檔（走與選檔相同的載入流程）。
// 下載：錄音不自動下載；載入後使用者自行用既有的下載／匯出功能儲存。
// 限制：桌面版 Chrome／Edge 才完整支援；需 HTTPS 或 localhost。
//   · 選「Chrome 分頁」並勾「分享分頁音訊」：各系統皆可，適合錄網頁聲音
//   · 選「整個螢幕」並勾「分享系統音訊」：僅 Windows 可錄整機聲音
// 需求：1_globals.js（audioPlayer、showToast、showCustomDialog、saveToStorage）、
//       1a_audio_store_idb.js、2_audio_engine.js（audioBufferToWav）、
//       4b_ui_audio_loader.js（initWaveSurferAfterAudioLoad）、index.html 的 #waveSysRecordBtn
// 載入順序：4b 之後即可，建議放在 index.html 最後。

(function () {
    const btn = document.getElementById('waveSysRecordBtn');
    if (!btn) return;

    const btnIcon = btn.querySelector('.material-icons');
    const btnLabel = document.getElementById('waveSysRecordLabel');

    let recorder = null;
    let displayStream = null;
    let chunks = [];
    let startedAt = 0;
    let tickTimer = null;
    let discardOnStop = false; // 錄製中被中斷且不想保留時使用

    // ---------- 支援檢查 ----------
    function isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia && window.MediaRecorder);
    }

    function pickMimeType() {
        const list = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
        return list.find(t => MediaRecorder.isTypeSupported(t)) || '';
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
    async function startRecording() {
        if (!isSupported()) {
            return showToast('此瀏覽器不支援錄製系統音訊，請使用電腦版 Chrome 或 Edge', 'error');
        }
        if (!window.isSecureContext) {
            return showToast('錄製系統音訊需要 HTTPS 或 localhost 環境', 'error');
        }

        try {
            // 瀏覽器規定要同時申請畫面；取得後立刻丟掉視訊軌
            displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
            });
        } catch (err) {
            displayStream = null;
            if (err && err.name === 'NotAllowedError') showToast('已取消分享，未開始錄製', 'normal');
            else showToast('無法開始錄製：' + (err && err.message ? err.message : err), 'error');
            return;
        }

        const audioTracks = displayStream.getAudioTracks();
        if (!audioTracks.length) {
            displayStream.getTracks().forEach(t => t.stop());
            displayStream = null;
            return showToast('沒有取得音訊：請在分享視窗選「Chrome 分頁」並勾選「分享分頁音訊」（或 Windows 整個螢幕並勾選「分享系統音訊」）', 'error', 7000);
        }
        displayStream.getVideoTracks().forEach(t => t.stop());

        const audioStream = new MediaStream(audioTracks);
        const mimeType = pickMimeType();
        try {
            recorder = new MediaRecorder(audioStream, mimeType ? { mimeType } : undefined);
        } catch (err) {
            audioTracks.forEach(t => t.stop());
            displayStream = null;
            return showToast('無法建立錄音器：' + err.message, 'error');
        }

        chunks = [];
        discardOnStop = false;
        const myRecorder = recorder;
        myRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
        myRecorder.onerror = (e) => {
            console.error('[SysRecord] 錄製錯誤：', e.error || e);
            showToast('錄製發生錯誤，已停止', 'error');
            stopRecording(true);
        };
        myRecorder.onstop = () => {
            const type = myRecorder.mimeType || mimeType || 'audio/webm';
            const blob = new Blob(chunks, { type });
            chunks = [];
            audioTracks.forEach(t => t.stop());
            displayStream = null;
            recorder = null;
            setRecordingUI(false);
            if (discardOnStop) return;
            if (!blob.size) return showToast('沒有錄到任何聲音', 'error');
            handleRecordedBlob(blob);
        };

        // 使用者在瀏覽器按「停止分享」時，同步結束錄製
        audioTracks[0].addEventListener('ended', () => {
            if (recorder === myRecorder && myRecorder.state !== 'inactive') myRecorder.stop();
        });

        // 錄製期間先暫停目前播放，避免畫面操作干擾
        try { audioPlayer.pause(); } catch (e) {}

        startedAt = Date.now();
        myRecorder.start(1000);
        setRecordingUI(true);
        showToast('開始錄製，請播放要錄的聲音；完成後按「停止」', 'success');
    }

    function stopRecording(discard) {
        if (!recorder) return;
        discardOnStop = !!discard;
        if (recorder.state !== 'inactive') recorder.stop();
    }

    // ---------- 錄完：轉 WAV → 確認 → 載入 ----------
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

    async function handleRecordedBlob(rawBlob) {
        showToast('錄製完成，正在處理音檔...', 'normal');
        let wavBlob;
        let ctx;
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            ctx = new AC();
            const audioBuffer = await ctx.decodeAudioData(await rawBlob.arrayBuffer());
            wavBlob = audioBufferToWav(audioBuffer);
        } catch (err) {
            console.error('[SysRecord] 解碼失敗：', err);
            showCustomDialog({
                title: '錄音處理失敗',
                message: '無法把錄音轉成可編輯的音檔。<br>是否先下載原始錄音檔（webm）保存？',
                confirmText: '下載原始錄音', cancelText: '放棄',
                onConfirm: () => downloadBlob(rawBlob, makeFileName().replace(/\.wav$/, '.webm'))
            });
            return;
        } finally {
            if (ctx && ctx.close) ctx.close().catch(() => {});
        }

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
        if (recorder) stopRecording();
        else startRecording();
    });

    // 錄製中關閉／重新整理頁面時提醒
    window.addEventListener('beforeunload', (e) => {
        if (recorder) { e.preventDefault(); e.returnValue = ''; }
    });

    // 不支援的瀏覽器：選項仍顯示，但標示灰階，點擊時給出原因
    if (!isSupported()) btn.style.opacity = '0.5';
})();
