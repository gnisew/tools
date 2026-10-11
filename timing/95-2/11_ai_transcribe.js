// 11_ai_transcribe.js: AI 聽打（Groq 免費 Whisper API）
// 流程：使用者自己標好時間 → 在設定啟用並填入 API Key → 「編輯」選單的 AI 聽打會把所選（或目前）句子的聲音轉成文字。
// 只送出「該句時間範圍」的短音訊（16kHz 單聲道 WAV），不會上傳整份音檔。
// 設計重點：
//   · 一次 saveState()，整批只需一次復原；寫回時用 setLang() 只改目標語言，不動其他語言
//   · 排隊依序送出，並以滑動視窗限速（免費方案每分鐘 20 次，這裡取 18 次保留餘裕）；遇 429 依 retry-after 重試
//   · 開始時記下每句的起點，寫回前核對；處理期間若合併／刪除／重排導致標籤對不上，該句略過而不會寫錯行
//   · API Key 只存在 localStorage，不會進入 JSON 專案匯出（generateJSON 為白名單欄位）
// 相依：1_globals.js（allLabelsOrdered、sentenceTextMap、timeDataMap、selectedLabels、currentActiveLabel、
//       getCalculatedTimes、saveState、saveToStorage、showToast、showCustomDialog、audioPlayer、wavesurfer）、
//       1c_languages.js（setLang、getLang、getLangMultiEnabled、getLangCount、getLangName，皆以 typeof 檢查）。
// 載入順序：放在 index.html 最後（2e 之後）。
// index.html 需有：#aiEnableCheck #aiConfigBlock #aiKeyInput #aiTestBtn #aiStatusText #aiLangSelect
//                  #aiModelSelect #aiTargetLangRow #aiTargetLangSelect #aiPromptInput
//                  編輯選單內的 #aiTranscribeSelBtn #aiTranscribeEmptyBtn（含文字 span #aiTranscribeSelText）

(function () {
    'use strict';

    const API_BASE = 'https://api.groq.com/openai/v1';
    const KEY = {
        on: 'tagger_aiEnabled',
        key: 'tagger_aiGroqKey',
        model: 'tagger_aiModel',
        lang: 'tagger_aiLang',
        prompt: 'tagger_aiPrompt',
        target: 'tagger_aiTargetLang'
    };

    // 辨識語言：code 傳給 Whisper（ISO-639-1），prompt 用來偏向繁／簡體輸出
    const LANG_MAP = {
        'zh-TW': { code: 'zh', prompt: '以下是繁體中文的句子。' },
        'zh-CN': { code: 'zh', prompt: '以下是简体中文的句子。' },
        'en': { code: 'en', prompt: '' },
        'ja': { code: 'ja', prompt: '' },
        'ko': { code: 'ko', prompt: '' },
        'auto': { code: '', prompt: '' }
    };

    const PAD_SEC = 0.15;       // 每句前後多留一點，避免字頭字尾被切掉
    const MAX_PER_MIN = 18;     // 免費方案上限 20 次／分，保留餘裕
    const SILENT_PEAK = 0.003;  // 峰值低於此視為無聲，不送出（省額度）
    const NO_SPEECH_DROP = 0.8; // verbose_json 的 no_speech_prob 高於此的片段丟棄（擋 Whisper 對靜音的幻聽）

    const store = {
        get(k, d = '') { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 無痕模式等略過 */ } }
    };

    let running = false;
    let cancelled = false;
    let abortCtrl = null;
    const requestStamps = []; // 最近的請求時間（跨次執行共用，才能正確限速）

    // ---------- 設定讀取 ----------
    function isEnabled() { return store.get(KEY.on) === 'true'; }
    function getApiKey() { return store.get(KEY.key).trim(); }

    function readConfig() {
        const langKey = store.get(KEY.lang, 'zh-TW');
        const lang = LANG_MAP[langKey] || LANG_MAP['zh-TW'];
        const custom = store.get(KEY.prompt).trim();
        return {
            key: getApiKey(),
            model: store.get(KEY.model, 'whisper-large-v3-turbo'),
            language: lang.code,
            prompt: custom || lang.prompt
        };
    }

    function multiLangOn() {
        return typeof getLangMultiEnabled === 'function' && getLangMultiEnabled();
    }

    // 寫入哪個語言：未啟用多語字幕時固定 0（setLang 會整段覆蓋）
    function getTargetIndex() {
        if (!multiLangOn()) return 0;
        const n = parseInt(store.get(KEY.target, '0'), 10);
        return isNaN(n) || n < 0 ? 0 : n;
    }

    function getSegText(label, idx) {
        const full = sentenceTextMap[label] || '';
        return typeof getLang === 'function' ? getLang(full, idx) : full;
    }

    // ---------- 音訊：切片 → 16kHz 單聲道 → WAV ----------
    function getDecoded() {
        return (typeof wavesurfer !== 'undefined' && wavesurfer && wavesurfer.getDecodedData) ? wavesurfer.getDecodedData() : null;
    }

    function encodeWav16(samples, sampleRate) {
        const buf = new ArrayBuffer(44 + samples.length * 2);
        const v = new DataView(buf);
        const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
        w(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); w(8, 'WAVE');
        w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
        v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
        w(36, 'data'); v.setUint32(40, samples.length * 2, true);
        let o = 44;
        for (let i = 0; i < samples.length; i++, o += 2) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        return new Blob([buf], { type: 'audio/wav' });
    }

    // 回傳 { blob } 或 { silent: true }；範圍太短則回傳 null
    async function sliceToWav(buffer, startSec, endSec) {
        const mediaDuration = (typeof audioPlayer !== 'undefined' && audioPlayer && audioPlayer.duration) || buffer.duration;
        const ratio = mediaDuration / buffer.duration; // 與靜音斷句相同的時間換算
        const sr = buffer.sampleRate;
        const i0 = Math.max(0, Math.floor(((startSec - PAD_SEC) / ratio) * sr));
        const i1 = Math.min(buffer.length, Math.ceil(((endSec + PAD_SEC) / ratio) * sr));
        const len = i1 - i0;
        if (len < sr * 0.1) return null;

        const nCh = buffer.numberOfChannels;
        const mono = new Float32Array(len);
        for (let c = 0; c < nCh; c++) {
            const ch = buffer.getChannelData(c);
            for (let i = 0; i < len; i++) mono[i] += ch[i0 + i] / nCh;
        }
        let peak = 0;
        for (let i = 0; i < len; i += 8) { const a = Math.abs(mono[i]); if (a > peak) peak = a; }
        if (peak < SILENT_PEAK) return { silent: true };

        const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        const outLen = Math.max(1, Math.ceil((len / sr) * 16000));
        const off = new OAC(1, outLen, 16000);
        const tmp = off.createBuffer(1, len, sr);
        tmp.getChannelData(0).set(mono);
        const src = off.createBufferSource();
        src.buffer = tmp;
        src.connect(off.destination);
        src.start(0);
        const rendered = await off.startRendering();
        return { blob: encodeWav16(rendered.getChannelData(0), 16000) };
    }

    // ---------- Groq API ----------
    async function callGroq(blob, cfg) {
        const fd = new FormData();
        fd.append('file', blob, 'clip.wav');
        fd.append('model', cfg.model);
        fd.append('response_format', 'verbose_json');
        fd.append('temperature', '0');
        if (cfg.language) fd.append('language', cfg.language);
        if (cfg.prompt) fd.append('prompt', cfg.prompt);

        let res;
        try {
            res = await fetch(`${API_BASE}/audio/transcriptions`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${cfg.key}` },
                body: fd,
                signal: abortCtrl ? abortCtrl.signal : undefined
            });
        } catch (e) {
            if (e.name !== 'AbortError') e.network = true;
            throw e;
        }

        if (!res.ok) {
            let msg = '';
            try { const j = await res.json(); msg = (j && j.error && j.error.message) || ''; } catch (e) { /* 非 JSON 回應 */ }
            const err = new Error(msg || `HTTP ${res.status}`);
            err.status = res.status;
            const ra = parseFloat(res.headers.get('retry-after'));
            if (!isNaN(ra)) err.retryAfter = ra;
            throw err;
        }

        const data = await res.json();
        let text;
        if (Array.isArray(data.segments) && data.segments.length) {
            text = data.segments
                .filter(s => !(typeof s.no_speech_prob === 'number' && s.no_speech_prob > NO_SPEECH_DROP))
                .map(s => s.text).join('');
        } else {
            text = data.text || '';
        }
        return cleanText(text, cfg);
    }

    function cleanText(text, cfg) {
        let t = String(text || '').replace(/\s*[\r\n]+\s*/g, ' ').trim();
        // Whisper 對無聲片段有時會把提示詞原樣吐出來
        if (cfg.prompt) t = t.split(cfg.prompt).join('').trim();
        // 辨識結果若含多語分隔字元，換成空白，避免多出一個語言欄
        if (multiLangOn() && typeof getLangDelimiter === 'function') t = t.split(getLangDelimiter()).join(' ');
        return t;
    }

    // ---------- 限速與重試 ----------
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    async function waitCancelable(ms, onTick) {
        const end = Date.now() + ms;
        while (!cancelled && Date.now() < end) {
            if (onTick) onTick(Math.ceil((end - Date.now()) / 1000));
            await sleep(Math.min(250, Math.max(0, end - Date.now())));
        }
    }

    async function throttle(setStatus) {
        for (;;) {
            if (cancelled) return;
            const now = Date.now();
            while (requestStamps.length && now - requestStamps[0] > 60000) requestStamps.shift();
            if (requestStamps.length < MAX_PER_MIN) { requestStamps.push(now); return; }
            const wait = 60000 - (now - requestStamps[0]) + 100;
            await waitCancelable(wait, s => setStatus(`等待額度 ${s} 秒…`));
        }
    }

    // 回傳字串；被取消回傳 null；致命錯誤丟出 err.fatal；單句可略過的錯誤丟出 err.skip
    async function transcribeWithRetry(blob, cfg, setStatus) {
        let attempt = 0;
        for (;;) {
            await throttle(setStatus);
            if (cancelled) return null;
            try {
                return await callGroq(blob, cfg);
            } catch (err) {
                if (err.name === 'AbortError') return null;
                if (err.status === 401 || err.status === 403) { err.fatal = 'auth'; throw err; }
                if (err.status === 429) {
                    const wait = err.retryAfter || 20;
                    if (wait > 90 || attempt >= 3) { err.fatal = 'quota'; throw err; }
                    attempt++;
                    await waitCancelable(wait * 1000 + 500, s => setStatus(`額度限制，${s} 秒後重試…`));
                    continue;
                }
                if (err.status === 400 || err.status === 413) { err.skip = true; throw err; }
                if ((err.network || err.status >= 500) && attempt < 1) {
                    attempt++;
                    await waitCancelable(2000);
                    continue;
                }
                if (err.network) err.fatal = 'network';
                throw err;
            }
        }
    }

    // ---------- 進度提示 ----------
    function ensureStyle() {
        if (document.getElementById('aiTranscribeStyle')) return;
        const st = document.createElement('style');
        st.id = 'aiTranscribeStyle';
        st.textContent = `
            .ai-progress { position: fixed; top: 14px; left: 50%; transform: translateX(-50%); z-index: 3000;
                display: none; align-items: center; gap: 8px; padding: 8px 8px 8px 14px; border-radius: 999px;
                background: #263238; color: #fff; font-size: 0.85rem; box-shadow: 0 4px 14px rgba(0,0,0,.25); max-width: 92vw; }
            .ai-progress.show { display: flex; }
            .ai-progress .material-icons { font-size: 1.1rem; color: #CE93D8; }
            .ai-progress button { border: none; border-radius: 999px; padding: 4px 12px; background: rgba(255,255,255,.18);
                color: #fff; font-size: 0.8rem; cursor: pointer; }
            .ai-progress button:hover { background: rgba(255,255,255,.3); }
            .ai-advanced { margin-top: 4px; }
            .ai-advanced summary { cursor: pointer; font-size: 0.8rem; font-weight: 600; color: #546E7A; margin: 2px 0 12px; }
            .ai-status-ok { color: #2E7D32; } .ai-status-err { color: #C62828; }
        `;
        document.head.appendChild(st);
    }

    let pill = null;
    function showProgress(text) {
        ensureStyle();
        if (!pill) {
            pill = document.createElement('div');
            pill.className = 'ai-progress';
            pill.setAttribute('role', 'status');
            pill.setAttribute('aria-live', 'polite');
            pill.innerHTML = '<span class="material-icons rotating" aria-hidden="true">auto_awesome</span><span class="ai-progress-text"></span><button type="button">取消</button>';
            pill.querySelector('button').addEventListener('click', () => {
                cancelled = true;
                if (abortCtrl) abortCtrl.abort();
                pill.querySelector('.ai-progress-text').textContent = '正在取消…';
            });
            document.body.appendChild(pill);
        }
        pill.querySelector('.ai-progress-text').textContent = text;
        pill.classList.add('show');
    }
    function hideProgress() { if (pill) pill.classList.remove('show'); }

    // ---------- 寫回畫面 ----------
    function refreshRow(label) {
        const div = document.getElementById('item-' + label);
        if (!div) return;
        const full = sentenceTextMap[label] || '';
        div.dataset.rawText = full;
        if (typeof isLangTableView === 'function' && isLangTableView() && typeof getLang === 'function') {
            div.querySelectorAll('.sentence-text-display[data-lang-idx]').forEach(cell => {
                const seg = getLang(full, parseInt(cell.dataset.langIdx, 10));
                cell.textContent = seg;
                cell.classList.toggle('is-empty-cell', seg.trim() === '');
            });
        } else {
            const d = div.querySelector('.sentence-text-display');
            if (!d) return;
            const vi = (typeof getCurrentLangViewIndex === 'function') ? getCurrentLangViewIndex() : null;
            d.textContent = (vi !== null && typeof getLang === 'function') ? getLang(full, vi) : full;
        }
    }

    // ---------- 主流程 ----------
    async function run(labels) {
        if (running) return showToast('AI 聽打進行中', 'error');
        const cfg = readConfig();
        if (!cfg.key) return showToast('請先在設定「AI 聽打」填入 Groq API Key', 'error');
        const buffer = getDecoded();
        if (!buffer) return showToast('請先載入音檔並等待分析完成', 'error');

        // 開始時記下每句時間；寫回前用起點核對，避免處理期間標籤被重排而寫錯行
        const jobs = labels.map(label => {
            const t = getCalculatedTimes(label);
            return t ? { label, start: t.start, end: t.end } : null;
        }).filter(Boolean);
        if (!jobs.length) return showToast('所選句子沒有時間標記', 'error');

        const idx = getTargetIndex();
        running = true; cancelled = false; abortCtrl = new AbortController();
        if (typeof saveState === 'function') saveState(); // 整批只需一次復原

        const stats = { ok: 0, silent: 0, empty: 0, failed: 0, moved: 0 };
        let fatal = null, unsaved = 0, lastErrMsg = '';
        const setStatus = (msg) => showProgress(msg);

        try {
            for (let i = 0; i < jobs.length; i++) {
                if (cancelled) break;
                const job = jobs[i];
                setStatus(`AI 聽打 ${i + 1}/${jobs.length}`);

                let slice;
                try { slice = await sliceToWav(buffer, job.start, job.end); }
                catch (e) { console.error('[AI 聽打] 音訊切片失敗', e); stats.failed++; continue; }
                if (!slice) { stats.empty++; continue; }
                if (slice.silent) { stats.silent++; continue; }

                let text;
                try {
                    text = await transcribeWithRetry(slice.blob, cfg, (m) => setStatus(`${m}（${i + 1}/${jobs.length}）`));
                } catch (err) {
                    console.warn('[AI 聽打]', job.label, err);
                    lastErrMsg = err.message || '';
                    if (err.fatal) { fatal = err; break; }
                    stats.failed++;
                    continue;
                }
                if (text === null) break; // 取消
                setStatus(`AI 聽打 ${i + 1}/${jobs.length}`);

                if (!text) { stats.empty++; continue; } // 沒聽到內容：不動原本的文字

                // 核對標籤仍對應同一個時間起點
                const cur = timeDataMap[job.label];
                const curStart = cur === undefined ? null : (typeof cur === 'object' ? cur.start : cur);
                if (!allLabelsOrdered.includes(job.label) || curStart === null || Math.abs(curStart - job.start) > 0.02) {
                    stats.moved++;
                    continue;
                }

                const prev = sentenceTextMap[job.label] || '';
                sentenceTextMap[job.label] = (typeof setLang === 'function') ? setLang(prev, idx, text) : text;
                refreshRow(job.label);
                stats.ok++;
                if (++unsaved >= 5) { saveToStorage(); unsaved = 0; }
            }
        } finally {
            running = false;
            abortCtrl = null;
            hideProgress();
            saveToStorage();
            if (typeof renderSentenceList === 'function') renderSentenceList();
            if (typeof isScriptMode !== 'undefined' && isScriptMode && typeof populateScriptEditor === 'function') populateScriptEditor();
            if (typeof isRendering === 'undefined' || !isRendering) {
                if (typeof renderAllRegions === 'function') renderAllRegions();
            }
        }

        const parts = [`${stats.ok} 句完成`];
        if (stats.silent) parts.push(`${stats.silent} 句無聲略過`);
        if (stats.empty) parts.push(`${stats.empty} 句沒聽到內容`);
        if (stats.moved) parts.push(`${stats.moved} 句因標記變動略過`);
        if (stats.failed) parts.push(`${stats.failed} 句失敗`);

        if (fatal) {
            const why = {
                auth: 'API Key 無效或沒有權限，請到設定檢查',
                quota: '免費額度已用完（或被限流太久），請稍後再試',
                network: '無法連線到 Groq，請檢查網路'
            }[fatal.fatal] || (fatal.message || '發生錯誤');
            showToast(`AI 聽打中斷：${why}。已完成 ${stats.ok} 句（可用復原還原）`, 'error');
        } else if (cancelled) {
            showToast(`已取消，${parts.join('、')}（可用復原還原）`, 'normal');
        } else if (stats.ok === 0 && stats.failed > 0) {
            showToast(`AI 聽打失敗${lastErrMsg ? '：' + lastErrMsg : ''}`, 'error');
        } else {
            showToast(`AI 聽打完成：${parts.join('、')}`, stats.failed ? 'normal' : 'success');
        }
    }

    // ---------- 要處理的句子 ----------
    function sortByOrder(labels) {
        return [...new Set(labels)].sort((a, b) => allLabelsOrdered.indexOf(a) - allLabelsOrdered.indexOf(b));
    }

    // 所選標記；沒有多選時用目前句子
    function getSelectionTargets() {
        let labels = (typeof selectedLabels !== 'undefined' && selectedLabels.length) ? selectedLabels.slice() : [];
        if (!labels.length && typeof currentActiveLabel !== 'undefined' && currentActiveLabel) labels = [currentActiveLabel];
        return sortByOrder(labels.filter(l => timeDataMap[l] !== undefined));
    }

    function getEmptyTargets() {
        const idx = getTargetIndex();
        return allLabelsOrdered.filter(l => timeDataMap[l] !== undefined && getSegText(l, idx).trim() === '');
    }

    function startSelection() {
        closeEditMenu();
        if (!getApiKey()) return showToast('請先在設定「AI 聽打」填入 Groq API Key', 'error');
        const targets = getSelectionTargets();
        if (!targets.length) return showToast('請先選取有時間標記的句子', 'error');
        const idx = getTargetIndex();
        const hasText = targets.filter(l => getSegText(l, idx).trim() !== '').length;
        if (hasText > 0 && typeof showCustomDialog === 'function') {
            showCustomDialog({
                title: 'AI 聽打',
                message: `所選 ${targets.length} 句中，有 <strong style="color:#C62828;">${hasText}</strong> 句已有文字，將被 AI 結果覆蓋。<br><span style="color:#666; font-size:0.9em;">（可用復原還原）</span><br><br>確定繼續嗎？`,
                onConfirm: () => run(targets)
            });
        } else {
            run(targets);
        }
    }

    function startEmpty() {
        closeEditMenu();
        if (!getApiKey()) return showToast('請先在設定「AI 聽打」填入 Groq API Key', 'error');
        const targets = getEmptyTargets();
        if (!targets.length) return showToast('沒有需要聽打的空白句', 'normal');
        const go = () => run(targets);
        if (typeof showCustomDialog === 'function') {
            showCustomDialog({
                title: 'AI 聽打全部空白句',
                message: `將為 <strong style="color:#7B1FA2;">${targets.length}</strong> 個空白句子聽打，已有文字的句子不會動。<br><span style="color:#666; font-size:0.9em;">免費方案每分鐘約 20 句，過程中可隨時取消。</span><br><br>確定繼續嗎？`,
                onConfirm: go
            });
        } else go();
    }

    function closeEditMenu() { document.getElementById('editMenu')?.classList.remove('show'); }

    // ---------- 編輯選單 ----------
    function refreshMenu() {
        const selBtn = document.getElementById('aiTranscribeSelBtn');
        const emptyBtn = document.getElementById('aiTranscribeEmptyBtn');
        if (!selBtn || !emptyBtn) return;

        const mode = (typeof getCurrentListMode === 'function') ? getCurrentListMode() : 'list';
        const show = isEnabled() && (mode === 'list' || mode === 'full');
        selBtn.style.display = show ? '' : 'none';
        emptyBtn.style.display = show ? '' : 'none';
        const sep = document.getElementById('aiTranscribeMenuHr');
        if (sep) sep.style.display = show ? '' : 'none';
        if (!show) return;

        const n = getSelectionTargets().length;
        const txt = document.getElementById('aiTranscribeSelText');
        const multi = (typeof selectedLabels !== 'undefined' && selectedLabels.length > 1);
        if (txt) txt.textContent = n === 0 ? 'AI 聽打（先選取句子）' : (multi ? `AI 聽打所選 ${n} 句` : 'AI 聽打這一句');
        selBtn.style.opacity = n === 0 ? '0.5' : '';
    }

    function bindMenu() {
        document.getElementById('aiTranscribeSelBtn')?.addEventListener('click', startSelection);
        document.getElementById('aiTranscribeEmptyBtn')?.addEventListener('click', startEmpty);
        const menu = document.getElementById('editMenu');
        if (menu) {
            new MutationObserver(() => { if (menu.classList.contains('show')) refreshMenu(); })
                .observe(menu, { attributes: true, attributeFilter: ['class'] });
        }
        refreshMenu();
    }

    // ---------- 設定側邊欄 ----------
    function populateTargetLang() {
        const row = document.getElementById('aiTargetLangRow');
        const sel = document.getElementById('aiTargetLangSelect');
        if (!row || !sel) return;
        const multi = multiLangOn();
        row.style.display = multi ? '' : 'none';
        if (!multi) return;
        const count = Math.max(2, (typeof getLangCount === 'function') ? getLangCount() : 2);
        let html = '';
        for (let i = 0; i < count; i++) html += `<option value="${i}">${(typeof getLangName === 'function') ? getLangName(i) : '語言' + (i + 1)}</option>`;
        sel.innerHTML = html;
        const saved = String(getTargetIndex());
        sel.value = Array.from(sel.options).some(o => o.value === saved) ? saved : '0';
    }

    function setStatusText(msg, ok) {
        const el = document.getElementById('aiStatusText');
        if (!el) return;
        el.textContent = msg || '';
        el.className = msg ? (ok ? 'ai-status-ok' : 'ai-status-err') : '';
    }

    async function testConnection() {
        const key = getApiKey();
        if (!key) { setStatusText('請先填入 API Key', false); return; }
        const btn = document.getElementById('aiTestBtn');
        if (btn) btn.disabled = true;
        setStatusText('測試中…', true);
        try {
            const res = await fetch(`${API_BASE}/models`, { headers: { Authorization: `Bearer ${key}` } });
            if (res.ok) setStatusText('✓ 連線成功，金鑰可用。', true);
            else if (res.status === 401 || res.status === 403) setStatusText('✗ 金鑰無效，請重新複製。', false);
            else setStatusText(`✗ 測試失敗（HTTP ${res.status}）。`, false);
        } catch (e) {
            setStatusText('✗ 無法連線（網路或瀏覽器限制）。', false);
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    function bindSettings() {
        ensureStyle();
        const enable = document.getElementById('aiEnableCheck');
        const block = document.getElementById('aiConfigBlock');
        const keyInput = document.getElementById('aiKeyInput');
        const langSel = document.getElementById('aiLangSelect');
        const modelSel = document.getElementById('aiModelSelect');
        const promptInput = document.getElementById('aiPromptInput');
        const targetSel = document.getElementById('aiTargetLangSelect');

        const syncBlock = () => {
            if (block) block.style.display = (enable && enable.checked) ? '' : 'none';
            populateTargetLang();
            refreshMenu();
        };

        if (enable) {
            enable.checked = isEnabled();
            enable.addEventListener('change', () => {
                store.set(KEY.on, enable.checked ? 'true' : 'false');
                syncBlock();
                if (enable.checked && !getApiKey()) keyInput?.focus();
            });
        }
        if (keyInput) {
            keyInput.value = getApiKey();
            keyInput.addEventListener('input', () => { store.set(KEY.key, keyInput.value.trim()); setStatusText(''); });
        }
        if (langSel) {
            langSel.value = store.get(KEY.lang, 'zh-TW');
            if (langSel.value !== store.get(KEY.lang, 'zh-TW')) langSel.value = 'zh-TW';
            langSel.addEventListener('change', () => store.set(KEY.lang, langSel.value));
        }
        if (modelSel) {
            modelSel.value = store.get(KEY.model, 'whisper-large-v3-turbo');
            if (!modelSel.value) modelSel.value = 'whisper-large-v3-turbo';
            modelSel.addEventListener('change', () => store.set(KEY.model, modelSel.value));
        }
        if (promptInput) {
            promptInput.value = store.get(KEY.prompt);
            promptInput.addEventListener('input', () => store.set(KEY.prompt, promptInput.value));
        }
        if (targetSel) targetSel.addEventListener('change', () => store.set(KEY.target, targetSel.value));

        document.getElementById('aiTestBtn')?.addEventListener('click', testConnection);
        document.getElementById('langMultiEnableCheck')?.addEventListener('change', () => setTimeout(populateTargetLang, 0));

        // 開啟設定側邊欄時，依目前語言數重建「寫入語言」選項
        const sidebar = document.getElementById('settingsSidebar');
        if (sidebar) {
            new MutationObserver(() => { if (sidebar.classList.contains('open')) populateTargetLang(); })
                .observe(sidebar, { attributes: true, attributeFilter: ['class'] });
        }
        syncBlock();
    }

    function init() { bindSettings(); bindMenu(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    window.AiTranscribe = { run, isEnabled, getSelectionTargets, getEmptyTargets };
})();
