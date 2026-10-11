// 1c_languages.js: 多語言字幕核心（分割 / 取值 / 寫回 / 空白判斷）
// 做法：多語言文字以分隔字元合併在同一個字串（例如 "語言1|語言2|語言3"），
//       切割、合併、Undo/Redo、存檔等流程照舊搬運整串文字，只有顯示與寫回走這裡的函式。
// 相容性：預設不啟用。未啟用時整段文字視為單一語言、不切割，舊專案不需轉換。
// 載入順序：1_globals.js 之後、2_audio_engine.js / 3_data_core.js / 5_list_renderer.js 之前

// ================= 設定 =================
const LANG_DEFAULT_DELIMITER = '|';

// 啟用開關不記憶，每次開啟網頁都是關閉。之後由三種方式開啟：
// 使用者在「設定 > 多語字幕」勾選、JSON 專案檔記錄、或載入的字幕至少 3 句含分隔字元時自動偵測。
let langMultiEnabled = false;
localStorage.removeItem('tagger_langMultiEnabled'); // 清除舊版殘留

function getLangMultiEnabled() { return langMultiEnabled; }

function setLangMultiEnabled(enabled) {
    langMultiEnabled = !!enabled;
    return langMultiEnabled;
}

let langDelimiter = localStorage.getItem('tagger_langDelimiter') || LANG_DEFAULT_DELIMITER;

// 檢視模式：'table' 並排表格（預設；語言數不足 2 種時自動退回全部語言）；'raw' 顯示整串原文；'0' / '1' / '2' 只顯示該語言
let langViewMode = localStorage.getItem('tagger_langViewMode') || 'table';

function getLangDelimiter() { return langDelimiter || LANG_DEFAULT_DELIMITER; }

// 注意：更換分隔字元不會轉換既有資料中的舊分隔字元
function setLangDelimiter(newDelim) {
    langDelimiter = (newDelim && String(newDelim).length > 0) ? String(newDelim) : LANG_DEFAULT_DELIMITER;
    localStorage.setItem('tagger_langDelimiter', langDelimiter);
    return langDelimiter;
}

// 語言名稱固定為「語言N」，不開放自訂，避免誤植特定語言稱呼
function getLangName(i) {
    return `語言${i + 1}`;
}

function getLangViewMode() { return langViewMode; }

function setLangViewMode(mode) {
    langViewMode = mode;
    localStorage.setItem('tagger_langViewMode', langViewMode);
    return langViewMode;
}

// 「只看第 N 語言」時回傳索引；原始或表格模式回傳 null（視為全部語言）
function getCurrentLangViewIndex() {
    if (!langViewMode || langViewMode === 'raw') return null;
    const idx = parseInt(langViewMode, 10);
    return isNaN(idx) ? null : idx;
}

// 取所有句子中分段數最多者；未啟用時固定為 1
function getLangCount() {
    if (!getLangMultiEnabled()) return 1;
    let maxCount = 1;
    try {
        if (typeof sentenceTextMap === 'object' && sentenceTextMap) {
            Object.values(sentenceTextMap).forEach(txt => {
                const c = String(txt || '').split(getLangDelimiter()).length;
                if (c > maxCount) maxCount = c;
            });
        }
    } catch (e) {
        // 資料尚未就緒時略過
    }
    return maxCount;
}

// ================= 並排表格檢視 =================
const LANG_TABLE_MAX_COLS = 3;
let langTableCols = (() => {
    try {
        const a = JSON.parse(localStorage.getItem('tagger_langTableCols'));
        return Array.isArray(a) ? a.filter(n => Number.isInteger(n) && n >= 0) : null;
    } catch (e) { return null; }
})();

// 表格檢視生效條件：模式為 table、已啟用多語字幕、語言數大於 1；否則退回全部語言
function isLangTableView() {
    return langViewMode === 'table' && getLangMultiEnabled() && getLangCount() > 1;
}

// 表格要顯示的語言索引（由小到大，最多 LANG_TABLE_MAX_COLS 個）
function getLangTableColumns() {
    const count = getLangCount();
    let cols = (langTableCols || []).filter(i => i < count);
    if (cols.length < 2) cols = Array.from({ length: Math.min(count, LANG_TABLE_MAX_COLS) }, (_, i) => i);
    return [...new Set(cols)].sort((a, b) => a - b).slice(0, LANG_TABLE_MAX_COLS);
}

// 勾選／取消欄位；超過上限或少於 2 欄時回傳 false
function toggleLangTableColumn(i) {
    const cols = getLangTableColumns();
    const at = cols.indexOf(i);
    if (at > -1) {
        if (cols.length <= 2) return false;
        cols.splice(at, 1);
    } else {
        if (cols.length >= LANG_TABLE_MAX_COLS) return false;
        cols.push(i);
    }
    langTableCols = cols.sort((a, b) => a - b);
    localStorage.setItem('tagger_langTableCols', JSON.stringify(langTableCols));
    return true;
}

// ================= 核心函式 =================

// 依分隔字元切成陣列；未啟用時整段視為單一語言
function splitLangs(text) {
    const str = String(text || '');
    if (!getLangMultiEnabled()) return [str];
    return str.split(getLangDelimiter());
}

// 取第 i 個語言（從 0 開始），不存在時回傳 ''
function getLang(text, i) {
    const arr = splitLangs(text);
    return (i >= 0 && arr[i] !== undefined) ? arr[i] : '';
}

// 只替換第 i 個語言，不足的語言以空字串補齊；未啟用時直接整段覆蓋
function setLang(text, i, newText) {
    const safeText = (newText === undefined || newText === null) ? '' : String(newText);
    if (!getLangMultiEnabled()) return safeText;
    const arr = splitLangs(text);
    while (arr.length <= i) arr.push('');
    arr[i] = safeText;
    return arr.join(getLangDelimiter());
}

// 所有語言 trim 後皆為空才算空白（單獨一個分隔字元也算空白）
function isBlank(text) {
    if (!text) return true;
    return splitLangs(text).every(seg => seg.trim() === '');
}

// ================= 匯出語言選單（單筆匯出 4g 與批次轉檔 9 共用） =================
// 預設：啟用多語字幕時才顯示選單，並依目前專案的最大語言數重建選項（保留上次選的值）；未啟用則隱藏。
// opts.always：不看多語開關，一律顯示（批次轉檔的來源檔案與目前專案無關）
// opts.count：指定語言數（省略時用 getLangCount()）
// 回傳是否顯示。
function populateLangExportSelect(wrapEl, selectEl, opts = {}) {
    if (!wrapEl || !selectEl) return false;
    if (!opts.always && !getLangMultiEnabled()) {
        wrapEl.style.display = 'none';
        return false;
    }
    wrapEl.style.display = '';

    const prevValue = selectEl.value; // 重開視窗時盡量保留使用者上次的選擇
    const count = (opts.count != null) ? opts.count : getLangCount();
    let html = '<option value="all">全部語言（含分隔字元）</option>';
    for (let i = 0; i < count; i++) html += `<option value="${i}">${getLangName(i)}</option>`;
    selectEl.innerHTML = html;

    if (Array.from(selectEl.options).some(opt => opt.value === prevValue)) selectEl.value = prevValue;
    return true;
}

// 依選單取出要匯出的文字：選「全部語言」時回傳原文，否則只取該語言。
// 預設：未啟用多語字幕時一律回傳原文。
// opts.standalone：不看多語開關，直接用設定的分隔字元拆分（批次轉檔用）
function pickExportLang(rawText, selectEl, opts = {}) {
    if (!opts.standalone && !getLangMultiEnabled()) return rawText;
    const sel = selectEl ? selectEl.value : 'all';
    if (!sel || sel === 'all') return rawText;
    const idx = parseInt(sel, 10);
    if (!opts.standalone) return getLang(rawText, idx);
    const arr = String(rawText == null ? '' : rawText).split(getLangDelimiter());
    return arr[idx] !== undefined ? arr[idx] : '';
}

// ================= 載入字幕時自動偵測／還原多語設定 =================
// 所有載入入口（JSON、SRT、TSV、Audacity、貼上文字、重新整理還原）載入後都應呼叫下列函式

const LANG_AUTO_DETECT_MIN_SENTENCES = 3;

// 計算「切成 2 段以上且至少一段有內容」的句數
function countMultiLangSentences(textMap, labels) {
    const delim = getLangDelimiter();
    const map = textMap || {};
    let n = 0;
    (labels || Object.keys(map)).forEach(lbl => {
        const segs = String(map[lbl] || '').split(delim);
        if (segs.length >= 2 && segs.some(s => s.trim() !== '')) n++;
    });
    return n;
}

// 讓設定頁與列表畫面和目前狀態一致
function syncLangMultiUI(enabled, render = true) {
    const chk = document.getElementById('langMultiEnableCheck');
    if (chk) chk.checked = !!enabled;
    const delimInput = document.getElementById('langDelimiterInput');
    if (delimInput) delimInput.value = getLangDelimiter();
    if (typeof applyLangMultiEnabledUI === 'function') applyLangMultiEnabledUI(!!enabled);
    else if (typeof updateLangViewMenuLabels === 'function') updateLangViewMenuLabels();
    if (render) {
        if (typeof renderSentenceList === 'function') renderSentenceList();
        if (typeof isScriptMode !== 'undefined' && isScriptMode && typeof populateScriptEditor === 'function') populateScriptEditor();
        if (typeof renderAllRegions === 'function') renderAllRegions();
    }
}

// 延遲提示，避免被「載入成功」等提示蓋掉
function notifyLangMultiEnabled(message) {
    setTimeout(() => {
        if (typeof showToast === 'function') showToast(message, 'success');
    }, 2000);
}

// 至少 3 句含分隔字元時自動啟用；已啟用或不符條件則不動作
// opts.notify：是否提示（重新整理後靜默還原用 false）；opts.render：是否重繪
function autoEnableMultiLangIfNeeded(opts = {}) {
    const { notify = true, render = true } = opts;
    if (getLangMultiEnabled()) return false;
    if (typeof sentenceTextMap !== 'object' || !sentenceTextMap) return false;
    const labels = (typeof allLabelsOrdered !== 'undefined' && Array.isArray(allLabelsOrdered)) ? allLabelsOrdered : null;
    if (countMultiLangSentences(sentenceTextMap, labels) < LANG_AUTO_DETECT_MIN_SENTENCES) return false;
    setLangMultiEnabled(true);
    syncLangMultiUI(true, render);
    if (notify) notifyLangMultiEnabled('偵測到多語字幕，已自動啟用（可在「設定 > 多語字幕」查看或關閉）');
    return true;
}

// 載入 JSON 專案檔時呼叫：有記錄就照記錄；舊專案檔沒有記錄則先關閉再自動偵測
// settings 為 JSON 內的 settings 物件（可能為 undefined）
function applyLangMultiFromProject(settings, opts = {}) {
    const { render = true } = opts;
    if (settings && typeof settings.langMultiEnabled === 'boolean') {
        if (typeof settings.langDelimiter === 'string' && settings.langDelimiter) setLangDelimiter(settings.langDelimiter);
        const wasEnabled = getLangMultiEnabled();
        setLangMultiEnabled(settings.langMultiEnabled);
        syncLangMultiUI(settings.langMultiEnabled, render);
        if (settings.langMultiEnabled && !wasEnabled) {
            notifyLangMultiEnabled('此專案使用多語字幕，已自動啟用（可在「設定 > 多語字幕」查看或關閉）');
        }
        return;
    }
    setLangMultiEnabled(false);
    syncLangMultiUI(false, false);
    autoEnableMultiLangIfNeeded({ notify: true, render });
}
