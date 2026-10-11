// 2f_audio_append.js: 載入音檔時「附加到目前聲波後面」（本機檔案、線上網址、錄音共用）
// 做法：在「選擇音檔」視窗底部提供核取方塊；勾選後，三種來源都不再「取代」目前音檔，
//       而是解碼成 AudioBuffer，交給 2b_audio_clipboard.js 的 AudioClipboard.appendBuffer() 接在尾端。
//       現有標記、跨句範圍、音量區段都在尾端之前，不需位移；可用 Ctrl+Z 復原（音訊編輯最多 3 步）。
// 設計：
//   · 預設關閉、不記憶（每次開啟視窗都取消勾選，避免誤附加）；只有已載入音檔時才顯示。
//   · 編輯鎖定（isEditMode 為 false）時停用；錄音進行中鎖定，錄完依錄製當下的勾選處理。
//   · 第一版一次只附加一個音檔：多檔、ZIP、批次網址請先取消勾選。附加段不新增標記。
//   · 線上網址需要對方網站開放跨網域（CORS）才能下載解碼；失敗時提示改用本機檔案。
//   · 附加後音檔變成本機合併檔，tagger_audioUrl 會被清除（由 appendBuffer 處理）。
// 相依：2b_audio_clipboard.js（AudioClipboard.appendBuffer）、4b_ui_audio_loader.js（closeAudioModal）、
//       index.html 的 #appendAudioBlock / #appendAudioCheck / #appendAudioOptions / #appendGapSeconds / #appendAudioHint
// 載入順序：2b、4b、2e 之後（建議放在 2e 後面）。

(function () {
    const overlay = document.getElementById('audioLoadModalOverlay');
    const block = document.getElementById('appendAudioBlock');
    const check = document.getElementById('appendAudioCheck');
    if (!overlay || !block || !check) return;

    const optionsEl = document.getElementById('appendAudioOptions');
    const gapInput = document.getElementById('appendGapSeconds');
    const hintEl = document.getElementById('appendAudioHint');
    const confirmBtn = document.getElementById('audioLoadConfirmBtn');
    const CONFIRM_TEXT = confirmBtn ? confirmBtn.textContent : '確定載入';
    const KEY_GAP = 'tagger_appendGapSec'; // 只記憶間隔秒數，勾選狀態不記憶
    const MULTI_MSG = '附加模式一次只能附加一個音檔。多檔、ZIP 或批次網址，請先取消勾選「附加到目前聲波後面」。';

    const toast = (m, t, d) => { if (typeof showToast === 'function') showToast(m, t, d); };

    // ---------- 狀態判斷 ----------
    function getDecoded() {
        return (typeof wavesurfer !== 'undefined' && wavesurfer && wavesurfer.getDecodedData) ? wavesurfer.getDecodedData() : null;
    }
    const hasAudio = () => !!getDecoded();
    const editLocked = () => (typeof isEditMode !== 'undefined') && !isEditMode;

    // 勾選中且條件成立；不看視窗是否顯示（錄音停止時視窗已關閉）
    function isOn() {
        return check.checked && hasAudio() && !editLocked();
    }

    function getGap() {
        const v = parseFloat(gapInput.value);
        return isNaN(v) ? 0.5 : Math.max(0, Math.min(10, v));
    }

    // ---------- 介面同步 ----------
    function refresh() {
        const loaded = hasAudio();
        const locked = editLocked();
        const recActive = overlay.classList.contains('rec-active');
        const recTab = overlay.classList.contains('rec-mode');

        block.style.display = loaded ? 'block' : 'none';
        if (!loaded || locked) check.checked = false;
        check.disabled = locked || recActive; // 錄音進行中鎖定，避免錄到一半改變處理方式
        block.style.opacity = recActive ? '0.55' : '';

        optionsEl.style.display = check.checked ? 'flex' : 'none';
        // 平常是低調的一行選項；勾選後才換成綠底加粗，提示目前是附加模式
        const on = check.checked;
        const label = check.parentElement;
        block.style.background = on ? '#E8F5E9' : 'transparent';
        block.style.borderColor = on ? '#C8E6C9' : 'transparent';
        label.style.fontWeight = on ? 'bold' : 'normal';
        label.style.color = on ? '#1B5E20' : '#666';
        let hint = '';
        if (locked) hint = '目前是編輯鎖定狀態，解除鎖定後才能附加。';
        else if (check.checked) hint = (recTab ? '錄音完成後，會接在目前聲波尾端' : '載入的音檔會接在目前聲波尾端')
            + '，現有標記不變，可用 Ctrl+Z 復原。附加後音檔會變成本機合併檔。';
        hintEl.textContent = hint;
        hintEl.style.display = hint ? 'block' : 'none';
        if (hint && locked) hintEl.style.color = '#C62828'; else hintEl.style.color = '#2E7D32';

        if (confirmBtn) confirmBtn.textContent = check.checked ? '附加載入' : CONFIRM_TEXT;
    }

    // 視窗每次開啟都回到「未勾選」（錄音進行中重新開啟除外）
    let wasShown = overlay.classList.contains('show');
    new MutationObserver(() => {
        const shown = overlay.classList.contains('show');
        if (shown && !wasShown && !overlay.classList.contains('rec-active')) check.checked = false;
        wasShown = shown;
        refresh();
    }).observe(overlay, { attributes: true, attributeFilter: ['class'] });

    check.addEventListener('change', refresh);

    const savedGap = parseFloat(localStorage.getItem(KEY_GAP));
    if (!isNaN(savedGap) && savedGap >= 0 && savedGap <= 10) gapInput.value = savedGap;
    gapInput.addEventListener('change', () => {
        gapInput.value = getGap();
        localStorage.setItem(KEY_GAP, String(getGap()));
    });

    // ---------- 解碼 ----------
    // 用現有音檔的取樣率建立 AudioContext，解碼時就轉成相同取樣率；
    // 不支援指定取樣率的瀏覽器退回預設，之後由 appendBuffer 重採樣
    async function decodeArrayBuffer(ab, targetSr) {
        const AC = window.AudioContext || window.webkitAudioContext;
        let ctx;
        try { ctx = new AC({ sampleRate: targetSr }); } catch (e) { ctx = new AC(); }
        try {
            return await ctx.decodeAudioData(ab);
        } finally {
            try { const p = ctx.close(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* 略過 */ }
        }
    }

    async function finishAppend(buf, name) {
        if (!window.AudioClipboard || typeof AudioClipboard.appendBuffer !== 'function') {
            return toast('找不到附加功能（2b_audio_clipboard.js 尚未載入）', 'error');
        }
        const r = await AudioClipboard.appendBuffer(buf, { gapSec: getGap(), fileName: '合併音檔.wav' });
        if (!r || !r.ok) return; // 失敗訊息已由 appendBuffer 顯示
        check.checked = false;
        refresh();
        let msg = `已將「${name}」附加到聲波後面（新增 ${r.addedSec.toFixed(2)} 秒），Ctrl+Z 可復原`;
        if (r.urlCleared) msg += '。音檔已變成本機合併檔，專案內的線上音檔網址已清除，分享前請先下載合併後的音檔';
        toast(msg, 'success', r.urlCleared ? 8000 : undefined);
    }

    // 附加本機檔案（也供錄音使用，錄音 File 的名稱就是錄音檔名）
    async function appendFile(file, label) {
        const dec = getDecoded();
        if (!dec) return toast('目前沒有已載入的音檔，無法附加', 'error');
        toast(`正在解碼「${file.name}」…`, 'normal');
        let buf;
        try {
            buf = await decodeArrayBuffer(await file.arrayBuffer(), dec.sampleRate);
        } catch (err) {
            console.error('[AudioAppend] 解碼失敗：', err);
            return toast('無法解碼此檔案，請確認是有效的音訊檔', 'error');
        }
        return finishAppend(buf, label || file.name);
    }

    // 附加線上音檔：需要 CORS 才能下載解碼
    async function appendUrl(url) {
        const dec = getDecoded();
        if (!dec) return toast('目前沒有已載入的音檔，無法附加', 'error');
        toast('正在下載線上音檔…', 'normal');
        let ab;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            ab = await res.arrayBuffer();
        } catch (err) {
            console.error('[AudioAppend] 下載失敗：', err);
            return toast('無法下載此網址的音檔（網址有誤，或對方網站未開放跨網域存取）。可改為先下載到電腦，再用「本機檔案」附加', 'error', 8000);
        }
        let buf;
        try {
            buf = await decodeArrayBuffer(ab, dec.sampleRate);
        } catch (err) {
            console.error('[AudioAppend] 解碼失敗：', err);
            return toast('無法解碼此網址的音檔，請確認是有效的音訊檔', 'error');
        }
        let name = '線上音檔';
        try { name = decodeURIComponent(url.split('?')[0].split('/').pop()) || name; } catch (e) { /* 網址含無法解碼的字元 */ }
        return finishAppend(buf, name);
    }

    // ---------- 「確定載入」接手（由 4b 在勾選時呼叫） ----------
    // 驗證失敗時視窗保持開啟，讓使用者直接修正
    function handleConfirm() {
        const isLocalMode = document.getElementById('sectionLocalLoad')?.style.display !== 'none';
        if (isLocalMode) {
            const files = Array.from(document.getElementById('modalLocalFilesInput')?.files || []);
            if (files.length === 0) return toast('請先選擇檔案', 'error');
            if (files.length > 1 || /\.zip$/i.test(files[0].name)) return toast(MULTI_MSG, 'error', 6000);
            if (typeof closeAudioModal === 'function') closeAudioModal();
            appendFile(files[0]);
        } else {
            const mode = document.querySelector('input[name="onlineMode"]:checked')?.value;
            if (mode === 'batch') return toast(MULTI_MSG, 'error', 6000);
            const url = (document.getElementById('modalSingleUrlInput')?.value || '').trim();
            if (!url) return toast('請先輸入音檔網址', 'error');
            if (!/^https?:/i.test(url)) return toast('請輸入有效網址', 'error');
            if (typeof closeAudioModal === 'function') closeAudioModal();
            appendUrl(url);
        }
    }

    window.AudioAppend = { isOn, handleConfirm, appendFile, appendUrl };
    refresh();
})();
