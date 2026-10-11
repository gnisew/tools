// 11_ai_transcribe.js: AI 聽打（多組 API Key、Groq Whisper / Google Gemini）
// 流程：使用者自己標好時間 → 在設定啟用並新增 API → 「編輯」選單的 AI 聽打會把所選（或目前）句子的聲音轉成文字。
// 只送出「該句時間範圍」的短音訊（16kHz 單聲道 WAV），不會上傳整份音檔。
// 設計重點：
//   · 可新增多組 API（Groq / Gemini）。某組額度滿或金鑰無效時會標記狀態（含預計恢復時間），
//     並提示（或自動）換下一組，從中斷的那一句接著跑，已完成的不重做
//   · 一次 saveState()，整批只需一次復原；寫回時用 setLang() 只改目標語言，不動其他語言
//   · 每組金鑰各自限速；遇 429 依等待時間重試，等太久（每日額度）則判定額度已滿
//   · 開始時記下每句的起點，寫回前核對；處理期間若合併／刪除／重排導致標籤對不上，該句略過而不會寫錯行
//   · API Key 只存在 localStorage，不會進入 JSON 專案匯出（generateJSON 為白名單欄位）
//   · 新增金鑰後會立即向服務端測試，通過才標示可用；尚未測試過的舊金鑰，開啟設定時會自動補測一次
// 注意：Groq 的額度以「組織（帳號）」計算，同一帳號建多把 Key 並不會增加額度；要輪替請用不同帳號的 Key，或搭配 Gemini。
// 相依：1_globals.js（allLabelsOrdered、sentenceTextMap、timeDataMap、selectedLabels、currentActiveLabel、
//       getCalculatedTimes、saveState、saveToStorage、showToast、showCustomDialog、audioPlayer、wavesurfer）、
//       1c_languages.js（setLang、getLang、getLangMultiEnabled、getLangCount、getLangName，皆以 typeof 檢查）。
// 載入順序：放在 index.html 最後（2e 之後）。
// index.html 需有：#aiEnableCheck #aiConfigBlock #aiKeyList #aiAddProvider #aiAddName #aiAddKey #aiAddBtn #aiKeyHint
//                  #aiAutoSwitchCheck #aiLangSelect #aiModelSelect #aiGeminiModelInput #aiTargetLangRow #aiTargetLangSelect #aiPromptInput
//                  編輯選單內的 #aiTranscribeSelBtn #aiTranscribeEmptyBtn #aiTranscribeMenuHr（含文字 span #aiTranscribeSelText）

(function () {
    'use strict';

    const GROQ_BASE = 'https://api.groq.com/openai/v1';
    const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
    const KEY = {
        on: 'tagger_aiEnabled',
        keys: 'tagger_aiKeys',            // [{ id, name, provider, key, blockedUntil, invalid }]
        active: 'tagger_aiActiveKey',
        autoSwitch: 'tagger_aiAutoSwitch',
        oldGroqKey: 'tagger_aiGroqKey',   // 舊版單一 Key，載入時自動轉成第一筆
        model: 'tagger_aiModel',          // Groq 模型
        geminiModel: 'tagger_aiGeminiModel',
        lang: 'tagger_aiLang',
        prompt: 'tagger_aiPrompt',
        target: 'tagger_aiTargetLang'
    };

    const DEFAULT_GROQ_MODEL = 'whisper-large-v3-turbo';
    const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite'; // 模型名稱會隨 Google 更新，可在進階設定自行更改

    // 辨識語言：code 傳給 Whisper（ISO-639-1），prompt 用來偏向繁／簡體輸出；name 供 Gemini 提示詞使用
    const LANG_MAP = {
        'zh-TW': { code: 'zh', prompt: '以下是繁體中文的句子。', name: '繁體中文' },
        'zh-CN': { code: 'zh', prompt: '以下是简体中文的句子。', name: '简体中文' },
        'en': { code: 'en', prompt: '', name: 'English' },
        'ja': { code: 'ja', prompt: '', name: '日本語' },
        'ko': { code: 'ko', prompt: '', name: '한국어' },
        'auto': { code: '', prompt: '', name: '' }
    };

    const PROVIDERS = {
        groq: { label: 'Groq', keyUrl: 'https://console.groq.com/keys', perMin: 18 },      // 免費方案 20 次／分，保留餘裕
        gemini: { label: 'Gemini', keyUrl: 'https://aistudio.google.com/apikey', perMin: 8 } // 免費額度依模型而異，先保守，其餘靠 429 重試
    };

    const PAD_SEC = 0.15;       // 每句前後多留一點，避免字頭字尾被切掉
    const SILENT_PEAK = 0.003;  // 峰值低於此視為無聲，不送出（省額度）
    const NO_SPEECH_DROP = 0.8; // Whisper 的 no_speech_prob 高於此的片段丟棄（擋對靜音的幻聽）
    const LONG_WAIT_SEC = 90;   // 需要等超過這麼久才能重試，視為額度已滿

    const store = {
        get(k, d = '') { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
        set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 無痕模式等略過 */ } },
        del(k) { try { localStorage.removeItem(k); } catch (e) { /* 略過 */ } }
    };

    let running = false;
    let cancelled = false;
    let abortCtrl = null;
    const checking = new Set();  // 正在測試中的 keyId
    const netErr = new Map();    // keyId -> 最近一次無法驗證的原因（連線失敗等），只存在本次頁面
    const stampsByKey = new Map(); // keyId -> 最近的請求時間（跨次執行共用，才能正確限速）

    // ================= API 清單 =================
    let keys = [];

    function loadKeys() {
        let arr = [];
        try { arr = JSON.parse(store.get(KEY.keys, '[]')); } catch (e) { arr = []; }
        if (!Array.isArray(arr)) arr = [];
        arr = arr.filter(e => e && e.id && e.key && PROVIDERS[e.provider]);
        // 舊版單一 Groq Key → 第一筆
        const old = store.get(KEY.oldGroqKey).trim();
        if (old) {
            if (!arr.some(e => e.key === old)) arr.unshift(makeEntry('groq', 'Groq 1', old));
            store.del(KEY.oldGroqKey);
            store.set(KEY.keys, JSON.stringify(arr));
        }
        keys = arr;
        return keys;
    }

    function saveKeys() { store.set(KEY.keys, JSON.stringify(keys)); }

    function makeEntry(provider, name, key) {
        return { id: 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, provider, key, blockedUntil: 0, invalid: false, checked: false };
    }

    function isUsable(e) { return !!e && !e.invalid && !(e.blockedUntil && e.blockedUntil > Date.now()); }
    function findKey(id) { return keys.find(e => e.id === id) || null; }

    function getActiveId() { return store.get(KEY.active); }
    function setActiveId(id) { store.set(KEY.active, id || ''); }

    // 目前使用的 API：優先用選定的，不可用時退而求其次找第一個可用的
    function pickStartKey() {
        const act = findKey(getActiveId());
        if (isUsable(act)) return act;
        return keys.find(isUsable) || null;
    }

    // 從目前這組之後依序找下一個可用的（繞一圈）
    function findNextUsable(cur) {
        const i = keys.findIndex(e => e.id === (cur && cur.id));
        for (let step = 1; step < keys.length; step++) {
            const e = keys[(i + step + keys.length) % keys.length];
            if (isUsable(e)) return e;
        }
        return null;
    }

    function earliestRecovery() {
        const times = keys.filter(e => !e.invalid && e.blockedUntil > Date.now()).map(e => e.blockedUntil);
        return times.length ? Math.min(...times) : 0;
    }

    function formatWait(ms) {
        const m = Math.max(1, Math.ceil(ms / 60000));
        if (m < 60) return `${m} 分鐘`;
        const h = Math.floor(m / 60), mm = m % 60;
        return mm ? `${h} 小時 ${mm} 分鐘` : `${h} 小時`;
    }

    // Gemini 的每日額度約在太平洋時間午夜重置
    function msUntilPacificMidnight() {
        try {
            const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date());
            const g = t => parseInt(parts.find(p => p.type === t).value, 10);
            const h = g('hour') % 24;
            return ((24 - h) * 3600 - g('minute') * 60 - g('second')) * 1000;
        } catch (e) { return 24 * 3600 * 1000; }
    }

    function maskKey(k) { return k.length > 12 ? `${k.slice(0, 4)}••••${k.slice(-4)}` : '••••••••'; }

    // ================= 設定讀取 =================
    function isEnabled() { return store.get(KEY.on) === 'true'; }
    function autoSwitchOn() { return store.get(KEY.autoSwitch) === 'true'; }

    function readConfig(entry) {
        const langKey = store.get(KEY.lang, 'zh-TW');
        const lang = LANG_MAP[langKey] || LANG_MAP['zh-TW'];
        // 專有名詞可用頓號、逗號、分號或換行隔開，統一整理成「、」
        const custom = store.get(KEY.prompt).split(/[、,，;；\n]+/).map(x => x.trim()).filter(Boolean).join('、');
        const isGemini = entry.provider === 'gemini';
        return {
            provider: entry.provider,
            key: entry.key,
            model: isGemini ? (store.get(KEY.geminiModel).trim() || DEFAULT_GEMINI_MODEL) : (store.get(KEY.model) || DEFAULT_GROQ_MODEL),
            language: lang.code,
            langName: lang.name,
            customPrompt: custom,
            prompt: [lang.prompt, custom ? `詞彙：${custom}` : ''].filter(Boolean).join('') // Whisper 用：語言提示 + 專有名詞
        };
    }

    function multiLangOn() { return typeof getLangMultiEnabled === 'function' && getLangMultiEnabled(); }

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

    // ================= 音訊：切片 → 16kHz 單聲道 → WAV =================
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

    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result).split(',')[1] || '');
            r.onerror = () => reject(r.error);
            r.readAsDataURL(blob);
        });
    }

    // ================= 各供應商 adapter =================
    // 每個 adapter：transcribe(blob, cfg) → 文字；失敗時丟出 Error，並帶：
    //   status（HTTP 狀態）、retryAfter（秒）、daily（是否為每日額度）、resetMs（預計多久後恢復）、auth（金鑰問題）、network

    async function doFetch(url, init) {
        try {
            return await fetch(url, { ...init, signal: abortCtrl ? abortCtrl.signal : undefined });
        } catch (e) {
            if (e.name !== 'AbortError') e.network = true;
            throw e;
        }
    }

    function cleanText(text, cfg) {
        let t = String(text || '').replace(/^```\w*\s*|\s*```$/g, '').replace(/\s*[\r\n]+\s*/g, ' ').trim();
        if (cfg.provider === 'groq' && cfg.prompt) t = t.split(cfg.prompt).join('').trim(); // Whisper 對無聲片段有時把提示詞吐出來
        if (multiLangOn() && typeof getLangDelimiter === 'function') t = t.split(getLangDelimiter()).join(' ');
        return t;
    }

    async function transcribeGroq(blob, cfg) {
        const fd = new FormData();
        fd.append('file', blob, 'clip.wav');
        fd.append('model', cfg.model);
        fd.append('response_format', 'verbose_json');
        fd.append('temperature', '0');
        if (cfg.language) fd.append('language', cfg.language);
        if (cfg.prompt) fd.append('prompt', cfg.prompt);

        const res = await doFetch(`${GROQ_BASE}/audio/transcriptions`, { method: 'POST', headers: { Authorization: `Bearer ${cfg.key}` }, body: fd });
        if (!res.ok) {
            let msg = '';
            try { const j = await res.json(); msg = (j && j.error && j.error.message) || ''; } catch (e) { /* 非 JSON */ }
            const err = new Error(msg || `HTTP ${res.status}`);
            err.status = res.status;
            const ra = parseFloat(res.headers.get('retry-after'));
            if (!isNaN(ra)) err.retryAfter = ra;
            if (res.status === 429) err.daily = /per day|\bRPD\b|\bTPD\b|\bASD\b/i.test(msg);
            if (res.status === 401 || res.status === 403) err.auth = true;
            throw err;
        }
        const data = await res.json();
        let text;
        if (Array.isArray(data.segments) && data.segments.length) {
            text = data.segments.filter(s => !(typeof s.no_speech_prob === 'number' && s.no_speech_prob > NO_SPEECH_DROP)).map(s => s.text).join('');
        } else {
            text = data.text || '';
        }
        return cleanText(text, cfg);
    }

    function parseGeminiRetry(errObj) {
        const details = (errObj && errObj.details) || [];
        for (const d of details) {
            if (d && /RetryInfo/.test(d['@type'] || '') && d.retryDelay) {
                const m = String(d.retryDelay).match(/([\d.]+)s/);
                if (m) return parseFloat(m[1]);
            }
        }
        return NaN;
    }

    async function transcribeGemini(blob, cfg) {
        let prompt = '請逐字聽打這段音訊，只輸出聽到的文字，不要加任何說明、時間、說話者標記或引號。若沒有人聲，什麼都不要輸出。';
        if (cfg.langName) prompt += `語言：${cfg.langName}。`;
        if (cfg.customPrompt) prompt += `參考詞彙（專有名詞、人名）：${cfg.customPrompt}。`;
        const b64 = await blobToBase64(blob);
        const body = {
            contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'audio/wav', data: b64 } }] }],
            generationConfig: { temperature: 0 }
        };
        const res = await doFetch(`${GEMINI_BASE}/models/${encodeURIComponent(cfg.model)}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.key },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            let j = null, msg = '';
            try { j = await res.json(); msg = (j && j.error && j.error.message) || ''; } catch (e) { /* 非 JSON */ }
            const err = new Error(msg || `HTTP ${res.status}`);
            err.status = res.status;
            const raw = JSON.stringify((j && j.error) || {});
            if (res.status === 429) {
                const ra = parseGeminiRetry(j && j.error);
                if (!isNaN(ra)) err.retryAfter = ra;
                err.daily = /PerDay/i.test(raw) || /per day/i.test(msg);
                if (err.daily) err.resetMs = msUntilPacificMidnight();
            }
            if (res.status === 401 || res.status === 403 || /API key not valid|API_KEY_INVALID/i.test(raw)) err.auth = true;
            throw err;
        }
        const data = await res.json();
        const cand = data.candidates && data.candidates[0];
        const parts = (cand && cand.content && cand.content.parts) || [];
        return cleanText(parts.map(p => p.text || '').join(''), cfg); // 被安全機制擋下或沒有輸出時視為空白
    }

    async function testKey(entry) {
        try {
            const url = entry.provider === 'gemini' ? `${GEMINI_BASE}/models?pageSize=1` : `${GROQ_BASE}/models`;
            const headers = entry.provider === 'gemini' ? { 'x-goog-api-key': entry.key } : { Authorization: `Bearer ${entry.key}` };
            const res = await fetch(url, { headers });
            if (res.ok) return { ok: true };
            let msg = '';
            try { const j = await res.json(); msg = (j && j.error && j.error.message) || ''; } catch (e) { /* 略過 */ }
            const bad = res.status === 401 || res.status === 403 || res.status === 400;
            return { ok: false, auth: bad, status: res.status, message: msg };
        } catch (e) {
            return { ok: false, network: true };
        }
    }

    // ================= 限速與重試 =================
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    async function waitCancelable(ms, onTick) {
        const end = Date.now() + ms;
        while (!cancelled && Date.now() < end) {
            if (onTick) onTick(Math.ceil((end - Date.now()) / 1000));
            await sleep(Math.min(250, Math.max(0, end - Date.now())));
        }
    }

    async function throttle(entry, setStatus) {
        const limit = PROVIDERS[entry.provider].perMin;
        let stamps = stampsByKey.get(entry.id);
        if (!stamps) { stamps = []; stampsByKey.set(entry.id, stamps); }
        for (;;) {
            if (cancelled) return;
            const now = Date.now();
            while (stamps.length && now - stamps[0] > 60000) stamps.shift();
            if (stamps.length < limit) { stamps.push(now); return; }
            const wait = 60000 - (now - stamps[0]) + 100;
            await waitCancelable(wait, s => setStatus(`等待額度 ${s} 秒…`));
        }
    }

    // 回傳字串；被取消回傳 null；
    // 丟出的錯誤帶 fatal：'auth'（金鑰無效）/ 'quota'（額度滿，附 blockedMs）/ 'model' / 'network'；或 skip（單句略過）
    async function transcribeWithRetry(blob, entry, cfg, setStatus) {
        const call = entry.provider === 'gemini' ? transcribeGemini : transcribeGroq;
        let attempt = 0;
        for (;;) {
            await throttle(entry, setStatus);
            if (cancelled) return null;
            try {
                return await call(blob, cfg);
            } catch (err) {
                if (err.name === 'AbortError') return null;
                if (err.auth) { err.fatal = 'auth'; throw err; }
                if (err.status === 404) { err.fatal = 'model'; throw err; }
                if (err.status === 429) {
                    if (err.daily) { err.fatal = 'quota'; err.blockedMs = err.resetMs || (err.retryAfter ? err.retryAfter * 1000 : 24 * 3600 * 1000); throw err; }
                    const wait = err.retryAfter || 20;
                    if (wait > LONG_WAIT_SEC) { err.fatal = 'quota'; err.blockedMs = wait * 1000; throw err; }
                    if (attempt >= 3) { err.fatal = 'quota'; err.blockedMs = 5 * 60 * 1000; throw err; }
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

    // ================= 進度提示與詢問 =================
    function ensureStyle() {
        if (document.getElementById('aiTranscribeStyle')) return;
        const st = document.createElement('style');
        st.id = 'aiTranscribeStyle';
        st.textContent = `
            .ai-progress { position: fixed; top: 14px; left: 50%; transform: translateX(-50%); z-index: 3000;
                display: none; align-items: center; gap: 8px; padding: 8px 8px 8px 14px; border-radius: 999px;
                background: #263238; color: #fff; font-size: 0.85rem; box-shadow: 0 4px 14px rgba(0,0,0,.25); max-width: 92vw; }
            .ai-progress.show { display: flex; }
            .ai-progress .material-icons { font-size: 1.1rem; color: #80CBC4; }
            .ai-progress button { border: none; border-radius: 999px; padding: 4px 12px; background: rgba(255,255,255,.18);
                color: #fff; font-size: 0.8rem; cursor: pointer; }
            .ai-progress button:hover { background: rgba(255,255,255,.3); }
            .ai-key-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; min-width: 0; }
            .ai-key-empty { font-size: 0.8rem; color: #90A4AE; padding: 6px 2px; }
            .ai-key-row { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 7px 6px 7px 10px;
                border: 1px solid #ECEFF1; border-radius: 8px; background: #fff; transition: border-color .15s, background-color .15s; }
            .ai-key-row:hover { border-color: #B2DFDB; }
            .ai-key-row.active { border-color: #00897B; background: #F1F8F7; }
            .ai-key-row.is-invalid { background: #FAFAFA; }
            .ai-key-radio { margin: 0; width: 16px; height: 16px; accent-color: #00897B; flex: none; cursor: pointer; }
            .ai-key-radio:disabled { cursor: not-allowed; }
            .ai-key-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; cursor: pointer; }
            .ai-key-row.is-invalid .ai-key-body { cursor: default; }
            .ai-key-line { display: flex; align-items: center; gap: 5px; min-width: 0; }
            .ai-key-name { font-size: 0.85rem; font-weight: 700; color: #263238; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .ai-key-row.is-invalid .ai-key-name { color: #90A4AE; }
            .ai-key-state { flex: none; font-size: 1.05rem; line-height: 1; }
            .ai-key-state.ok { color: #00897B; } .ai-key-state.warn { color: #EF6C00; }
            .ai-key-state.err { color: #E53935; } .ai-key-state.idle { color: #B0BEC5; }
            .ai-key-sub { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 0.72rem; color: #90A4AE; }
            .ai-key-sub .ai-note { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .ai-key-sub .ai-note.warn { color: #EF6C00; } .ai-key-sub .ai-note.err { color: #E53935; }
            .ai-tag { font-size: 0.68rem; padding: 0 7px; border-radius: 999px; background: #E0F2F1; color: #00695C; flex: none; line-height: 1.55; }
            .ai-mask { font-family: Consolas, "Courier New", monospace; letter-spacing: .2px; }
            .ai-key-actions { display: flex; gap: 2px; flex: none; }
            /* 全域 button 有 flex:1、min-width:100px、padding:10px，圖示鈕必須逐項覆蓋 */
            .ai-key-actions .ai-icon-btn { flex: none; min-width: 0; width: 28px; height: 28px; padding: 0; border: none; border-radius: 6px;
                background: transparent; color: #78909C; font-weight: normal; }
            .ai-key-actions .ai-icon-btn .material-icons { font-size: 1.1rem; }
            .ai-key-actions .ai-icon-btn:hover { background: #E0F2F1; color: #00695C; }
            .ai-key-actions .ai-icon-btn:active { background: #B2DFDB; }
            .ai-key-actions .ai-icon-btn.danger:hover { background: #FFEBEE; color: #E53935; }
            .ai-key-actions .ai-icon-btn:disabled { opacity: .4; cursor: default; background: transparent; color: #78909C; }
            .ai-key-actions .ai-icon-btn:focus-visible { outline: 2px solid #00897B; outline-offset: 1px; }
            .ai-add-row { display: flex; gap: 6px; flex-wrap: wrap; }
            .ai-add-row .btn-small { height: auto; align-self: stretch; padding: 0 14px; }
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

    // 問使用者是否切換到下一組 API；關閉視窗（未按任何鈕）視為「停止」
    function askSwitch(title, message, nextName) {
        return new Promise(resolve => {
            if (typeof showCustomDialog !== 'function') return resolve(true);
            let done = false;
            const finish = (v) => { if (!done) { done = true; clearInterval(poll); resolve(v); } };
            showCustomDialog({
                title,
                message,
                confirmText: `改用「${nextName}」繼續`,
                cancelText: '停止',
                onConfirm: () => finish(true),
                onCancel: () => finish(false)
            });
            const poll = setInterval(() => {
                const ov = document.getElementById('customModalOverlay');
                if (ov && !ov.classList.contains('show')) setTimeout(() => finish(false), 300); // 給按鈕回呼先執行的時間
            }, 300);
        });
    }

    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    // ================= 寫回畫面 =================
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

    // ================= 主流程 =================
    async function run(labels) {
        if (running) return showToast('AI 聽打進行中', 'error');
        loadKeys();
        let cur = pickStartKey();
        if (!cur) return showNoKeyMessage();
        const buffer = getDecoded();
        if (!buffer) return showToast('請先載入音檔並等待分析完成', 'error');

        // 開始時記下每句時間；寫回前用起點核對，避免處理期間標籤被重排而寫錯行
        const jobs = labels.map(label => {
            const t = getCalculatedTimes(label);
            return t ? { label, start: t.start, end: t.end } : null;
        }).filter(Boolean);
        if (!jobs.length) return showToast('所選句子沒有時間標記', 'error');

        const idx = getTargetIndex();
        let cfg = readConfig(cur);
        running = true; cancelled = false; abortCtrl = new AbortController();
        if (typeof saveState === 'function') saveState(); // 整批只需一次復原

        const stats = { ok: 0, silent: 0, empty: 0, failed: 0, moved: 0 };
        let fatal = null, fatalNoNext = false, unsaved = 0, lastErrMsg = '';
        const label_ = () => (keys.length > 1 ? ` · ${cur.name}` : '');
        const setStatus = (msg) => showProgress(msg);

        try {
            let i = 0;
            while (i < jobs.length) {
                if (cancelled) break;
                const job = jobs[i];
                setStatus(`AI 聽打 ${i + 1}/${jobs.length}${label_()}`);

                let slice;
                try { slice = await sliceToWav(buffer, job.start, job.end); }
                catch (e) { console.error('[AI 聽打] 音訊切片失敗', e); stats.failed++; i++; continue; }
                if (!slice) { stats.empty++; i++; continue; }
                if (slice.silent) { stats.silent++; i++; continue; }

                let text;
                try {
                    text = await transcribeWithRetry(slice.blob, cur, cfg, (m) => setStatus(`${m}（${i + 1}/${jobs.length}${label_()}）`));
                } catch (err) {
                    console.warn('[AI 聽打]', job.label, err);
                    lastErrMsg = err.message || '';

                    if (err.fatal === 'quota' || err.fatal === 'auth') {
                        // 標記這組 API 的狀態，再看要不要換下一組
                        if (err.fatal === 'auth') cur.invalid = true;
                        else cur.blockedUntil = Date.now() + (err.blockedMs || 5 * 60 * 1000);
                        saveKeys(); renderKeyList();

                        const next = findNextUsable(cur);
                        if (!next) { fatal = err; fatalNoNext = true; break; }

                        let doSwitch = autoSwitchOn();
                        if (!doSwitch) {
                            hideProgress();
                            const why = err.fatal === 'auth'
                                ? `「${escapeHtml(cur.name)}」的金鑰無效或沒有權限。`
                                : `「${escapeHtml(cur.name)}」的額度已滿（約 ${formatWait(cur.blockedUntil - Date.now())} 後恢復）。`;
                            doSwitch = await askSwitch('API 無法使用',
                                `${why}<br>已完成 <strong>${stats.ok}</strong> / ${jobs.length} 句。<br><br>要改用「${escapeHtml(next.name)}」從這一句繼續嗎？`, next.name);
                        }
                        if (!doSwitch) { fatal = err; break; }
                        cur = next; setActiveId(cur.id); cfg = readConfig(cur); renderKeyList();
                        showToast(`已切換到「${cur.name}」繼續`, 'normal');
                        continue; // 同一句重做，不遞增 i
                    }
                    if (err.fatal) { fatal = err; break; } // model / network
                    stats.failed++; i++;
                    continue;
                }
                if (text === null) break; // 取消

                if (!text) { stats.empty++; i++; continue; } // 沒聽到內容：不動原本的文字

                // 核對標籤仍對應同一個時間起點
                const curT = timeDataMap[job.label];
                const curStart = curT === undefined ? null : (typeof curT === 'object' ? curT.start : curT);
                if (!allLabelsOrdered.includes(job.label) || curStart === null || Math.abs(curStart - job.start) > 0.02) {
                    stats.moved++; i++;
                    continue;
                }

                const prev = sentenceTextMap[job.label] || '';
                sentenceTextMap[job.label] = (typeof setLang === 'function') ? setLang(prev, idx, text) : text;
                refreshRow(job.label);
                stats.ok++; i++;
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
            let why;
            if (fatalNoNext) {
                const t = earliestRecovery();
                why = fatal.fatal === 'auth' && !t
                    ? '所有 API 的金鑰都無效或無法使用，請到設定檢查'
                    : `所有 API 額度都已用完${t ? `，最早約 ${formatWait(t - Date.now())} 後恢復` : ''}`;
            } else {
                why = {
                    auth: '金鑰無效或沒有權限',
                    quota: `「${cur.name}」額度已用完`,
                    model: `找不到模型「${cfg.model}」，請到進階設定更改模型名稱`,
                    network: '無法連線到服務，請檢查網路'
                }[fatal.fatal] || (fatal.message || '發生錯誤');
            }
            showToast(`AI 聽打中斷：${why}。已完成 ${stats.ok} 句（可用復原還原）`, 'error');
        } else if (cancelled) {
            showToast(`已取消，${parts.join('、')}（可用復原還原）`, 'normal');
        } else if (stats.ok === 0 && stats.failed > 0) {
            showToast(`AI 聽打失敗${lastErrMsg ? '：' + lastErrMsg : ''}`, 'error');
        } else {
            showToast(`AI 聽打完成：${parts.join('、')}`, stats.failed ? 'normal' : 'success');
        }
    }

    function showNoKeyMessage() {
        if (!keys.length) return showToast('請先在設定「AI 聽打」新增 API Key', 'error');
        const t = earliestRecovery();
        showToast(t ? `所有 API 額度都已用完，最早約 ${formatWait(t - Date.now())} 後恢復` : '所有 API 的金鑰都無效，請到設定檢查', 'error');
    }

    // ================= 要處理的句子 =================
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

    function closeEditMenu() { document.getElementById('editMenu')?.classList.remove('show'); }

    function startSelection() {
        closeEditMenu();
        loadKeys();
        if (!keys.length) return showToast('請先在設定「AI 聽打」新增 API Key', 'error');
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
        loadKeys();
        if (!keys.length) return showToast('請先在設定「AI 聽打」新增 API Key', 'error');
        const targets = getEmptyTargets();
        if (!targets.length) return showToast('沒有需要聽打的空白句', 'normal');
        const go = () => run(targets);
        if (typeof showCustomDialog === 'function') {
            showCustomDialog({
                title: 'AI 聽打全部空白句',
                message: `將為 <strong style="color:#7B1FA2;">${targets.length}</strong> 個空白句子聽打，已有文字的句子不會動。<br><br>確定繼續嗎？`,
                onConfirm: go
            });
        } else go();
    }

    // ================= 編輯選單 =================
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

    // ================= 設定側邊欄 =================
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

    // 狀態：圖示顏色 cls、圖示名稱 icon、提示 tip、第二行說明 note（可用時不顯示文字，只留圖示）
    function statusOf(e) {
        if (checking.has(e.id)) return { cls: 'idle', icon: 'sync', spin: true, tip: '測試中…', note: '測試中…' };
        if (e.invalid) return { cls: 'err', icon: 'error', tip: '金鑰無效或沒有權限', note: '金鑰無效或沒有權限' };
        if (e.blockedUntil && e.blockedUntil > Date.now()) {
            const t = `額度已滿，約 ${formatWait(e.blockedUntil - Date.now())} 後恢復`;
            return { cls: 'warn', icon: 'schedule', tip: t, note: t };
        }
        if (netErr.has(e.id)) return { cls: 'warn', icon: 'wifi_off', tip: netErr.get(e.id), note: netErr.get(e.id) };
        if (!e.checked) return { cls: 'idle', icon: 'help_outline', tip: '尚未測試', note: '尚未測試' };
        return { cls: 'ok', icon: 'check_circle', tip: '可用', note: '' };
    }

    function makeIcon(name) {
        const i = document.createElement('span');
        i.className = 'material-icons';
        i.setAttribute('aria-hidden', 'true');
        i.textContent = name;
        return i;
    }

    function makeIconBtn(icon, label, extraCls) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ai-icon-btn' + (extraCls ? ' ' + extraCls : '');
        b.title = label;
        b.setAttribute('aria-label', label);
        b.appendChild(makeIcon(icon));
        return b;
    }

    // 修改某一筆後存檔並重畫（用 id 重新取得，避免拿到重新載入前的舊物件）
    function updateKey(id, fn) {
        const t = findKey(id);
        if (t) { fn(t); saveKeys(); }
        renderKeyList();
    }

    // 向服務端測試金鑰並更新狀態。回傳 'ok' | 'invalid' | 'network' | 'error' | null（已在測試中或已被刪除）
    async function verifyEntry(id, opts) {
        const toast = !!(opts && opts.toast);
        const target = findKey(id);
        if (!target || checking.has(id)) return null;
        const probe = { provider: target.provider, key: target.key, name: target.name };
        checking.add(id); netErr.delete(id);
        renderKeyList();

        const r = await testKey(probe);
        checking.delete(id);

        const e = findKey(id); // 期間 renderKeyList 會重新載入清單，這裡重新取得
        if (!e) { renderKeyList(); return null; }
        let result;
        if (r.ok) { e.invalid = false; e.checked = true; result = 'ok'; }
        else if (r.network) { netErr.set(id, '無法連線，尚未驗證'); result = 'network'; }
        else if (r.auth) { e.invalid = true; e.checked = false; result = 'invalid'; }
        else { netErr.set(id, `測試失敗（HTTP ${r.status}）`); result = 'error'; }
        saveKeys();
        renderKeyList();

        if (toast) {
            if (result === 'ok') showToast((e.blockedUntil > Date.now()) ? `「${e.name}」金鑰有效，但額度仍標示為已滿` : `「${e.name}」可以使用`, 'success');
            else if (result === 'invalid') showToast(`「${e.name}」金鑰無效或沒有權限`, 'error');
            else showToast(netErr.get(id) || '測試失敗', 'error');
        }
        return result;
    }

    // 尚未測試過（含舊版沒有 checked 欄位）的金鑰自動補測一次；無法連線的本次不重試，避免反覆送出請求
    function verifyPending() {
        if (!isEnabled()) return;
        keys.filter(e => !e.checked && !e.invalid && !checking.has(e.id) && !netErr.has(e.id))
            .forEach(e => verifyEntry(e.id));
    }

    function renderKeyList() {
        const box = document.getElementById('aiKeyList');
        if (!box) return;
        loadKeys();
        box.textContent = '';
        if (!keys.length) {
            const empty = document.createElement('div');
            empty.className = 'ai-key-empty';
            empty.textContent = '尚未新增 API';
            box.appendChild(empty);
            return;
        }
        const activeId = (pickStartKey() || {}).id || getActiveId();
        keys.forEach(e => {
            const st = statusOf(e);
            const row = document.createElement('div');
            row.className = 'ai-key-row' + (e.id === activeId ? ' active' : '') + (e.invalid ? ' is-invalid' : '');

            const radio = document.createElement('input');
            radio.type = 'radio'; radio.name = 'aiActiveKey'; radio.className = 'ai-key-radio';
            radio.id = 'aiKeyRadio_' + e.id;
            radio.checked = e.id === activeId;
            radio.disabled = !!e.invalid;
            radio.setAttribute('aria-label', `使用「${e.name}」`);
            radio.addEventListener('change', () => { setActiveId(e.id); renderKeyList(); });

            // 第一行：名稱 + 狀態圖示；第二行：供應商 + 金鑰遮罩（有狀況時改顯示說明文字）
            const body = document.createElement('label');
            body.className = 'ai-key-body';
            body.htmlFor = radio.id;
            const line = document.createElement('div');
            line.className = 'ai-key-line';
            const name = document.createElement('span'); name.className = 'ai-key-name'; name.textContent = e.name; name.title = e.name;
            const state = makeIcon(st.icon);
            state.classList.add('ai-key-state', st.cls);
            if (st.spin) state.classList.add('rotating');
            state.title = st.tip;
            line.append(name, state);

            const sub = document.createElement('div');
            sub.className = 'ai-key-sub';
            const tag = document.createElement('span'); tag.className = 'ai-tag'; tag.textContent = PROVIDERS[e.provider].label;
            sub.appendChild(tag);
            const extra = document.createElement('span');
            if (st.note) { extra.className = 'ai-note ' + (st.cls === 'idle' ? '' : st.cls); extra.textContent = st.note; }
            else { extra.className = 'ai-mask'; extra.textContent = maskKey(e.key); }
            sub.appendChild(extra);
            body.append(line, sub);

            const actions = document.createElement('div');
            actions.className = 'ai-key-actions';

            const testBtn = makeIconBtn('refresh', '測試金鑰');
            testBtn.disabled = checking.has(e.id);
            testBtn.addEventListener('click', () => verifyEntry(e.id, { toast: true }));
            actions.appendChild(testBtn);

            if (e.invalid || (e.blockedUntil && e.blockedUntil > Date.now())) {
                const resetBtn = makeIconBtn('restart_alt', '標為可用並重新測試');
                resetBtn.addEventListener('click', () => {
                    updateKey(e.id, t => { t.invalid = false; t.blockedUntil = 0; });
                    verifyEntry(e.id);
                });
                actions.appendChild(resetBtn);
            }

            const delBtn = makeIconBtn('delete_outline', '刪除', 'danger');
            delBtn.addEventListener('click', () => {
                keys = keys.filter(k => k.id !== e.id);
                stampsByKey.delete(e.id); netErr.delete(e.id); checking.delete(e.id);
                if (getActiveId() === e.id) setActiveId('');
                saveKeys(); renderKeyList();
            });
            actions.appendChild(delBtn);

            row.append(radio, body, actions);
            box.appendChild(row);
        });
    }

    function updateKeyHint() {
        const sel = document.getElementById('aiAddProvider');
        const hint = document.getElementById('aiKeyHint');
        if (!sel || !hint) return;
        const p = PROVIDERS[sel.value] || PROVIDERS.groq;
        hint.textContent = '';
        hint.append('取得金鑰：');
        const a = document.createElement('a');
        a.href = p.keyUrl; a.target = '_blank'; a.rel = 'noopener'; a.textContent = p.keyUrl.replace('https://', '');
        hint.appendChild(a);
        if (sel.value === 'groq') hint.append('　同帳號的 Key 共用額度');
    }

    async function addKeyFromForm() {
        const provSel = document.getElementById('aiAddProvider');
        const nameIn = document.getElementById('aiAddName');
        const keyIn = document.getElementById('aiAddKey');
        if (!provSel || !keyIn) return;
        const key = keyIn.value.trim();
        if (!key) { showToast('請貼上 API Key', 'error'); keyIn.focus(); return; }
        loadKeys();
        if (keys.some(e => e.key === key)) { showToast('這組金鑰已經新增過了', 'error'); return; }
        const provider = provSel.value;
        const sameCount = keys.filter(e => e.provider === provider).length;
        const name = (nameIn && nameIn.value.trim()) || `${PROVIDERS[provider].label} ${sameCount + 1}`;
        const entry = makeEntry(provider, name, key);
        keys.push(entry);
        saveKeys();
        keyIn.value = ''; if (nameIn) nameIn.value = '';
        renderKeyList(); // 先以「測試中」的狀態出現在清單

        const result = await verifyEntry(entry.id);
        if (result === 'ok') {
            if (!isUsable(findKey(getActiveId()))) setActiveId(entry.id); // 目前沒有可用的選定項目時，改用新的這組
            renderKeyList();
            showToast(`「${name}」測試通過，可以使用`, 'success');
        } else if (result === 'invalid') {
            showToast(`「${name}」金鑰無效或沒有權限，請確認供應商與金鑰是否正確`, 'error');
        } else if (result === 'network') {
            showToast(`「${name}」已新增，但無法連線，尚未驗證（可按重新測試）`, 'error');
        } else if (result === 'error') {
            showToast(`「${name}」已新增，但測試失敗，請稍後再試`, 'error');
        }
    }

    function bindSettings() {
        ensureStyle();
        const enable = document.getElementById('aiEnableCheck');
        const block = document.getElementById('aiConfigBlock');
        const langSel = document.getElementById('aiLangSelect');
        const modelSel = document.getElementById('aiModelSelect');
        const gModel = document.getElementById('aiGeminiModelInput');
        const promptInput = document.getElementById('aiPromptInput');
        const targetSel = document.getElementById('aiTargetLangSelect');
        const autoChk = document.getElementById('aiAutoSwitchCheck');

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
                if (enable.checked && !loadKeys().length) document.getElementById('aiAddKey')?.focus();
                if (enable.checked) verifyPending();
            });
        }
        if (autoChk) {
            autoChk.checked = autoSwitchOn();
            autoChk.addEventListener('change', () => store.set(KEY.autoSwitch, autoChk.checked ? 'true' : 'false'));
        }
        if (langSel) {
            langSel.value = store.get(KEY.lang, 'zh-TW');
            if (!langSel.value) langSel.value = 'zh-TW';
            langSel.addEventListener('change', () => store.set(KEY.lang, langSel.value));
        }
        if (modelSel) {
            modelSel.value = store.get(KEY.model, DEFAULT_GROQ_MODEL);
            if (!modelSel.value) modelSel.value = DEFAULT_GROQ_MODEL;
            modelSel.addEventListener('change', () => store.set(KEY.model, modelSel.value));
        }
        if (gModel) {
            gModel.value = store.get(KEY.geminiModel) || DEFAULT_GEMINI_MODEL;
            gModel.addEventListener('input', () => store.set(KEY.geminiModel, gModel.value.trim()));
        }
        if (promptInput) {
            promptInput.value = store.get(KEY.prompt);
            promptInput.addEventListener('input', () => store.set(KEY.prompt, promptInput.value));
        }
        if (targetSel) targetSel.addEventListener('change', () => store.set(KEY.target, targetSel.value));

        document.getElementById('aiAddProvider')?.addEventListener('change', updateKeyHint);
        document.getElementById('aiAddBtn')?.addEventListener('click', addKeyFromForm);
        document.getElementById('aiAddKey')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyFromForm(); } });
        document.getElementById('langMultiEnableCheck')?.addEventListener('change', () => setTimeout(populateTargetLang, 0));

        // 開啟設定側邊欄時，重新整理 API 狀態與「寫入語言」選項
        const sidebar = document.getElementById('settingsSidebar');
        if (sidebar) {
            new MutationObserver(() => { if (sidebar.classList.contains('open')) { populateTargetLang(); renderKeyList(); verifyPending(); } })
                .observe(sidebar, { attributes: true, attributeFilter: ['class'] });
        }
        updateKeyHint();
        renderKeyList();
        syncBlock();
    }

    function init() { loadKeys(); bindSettings(); bindMenu(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    window.AiTranscribe = { run, isEnabled, getSelectionTargets, getEmptyTargets };
})();
