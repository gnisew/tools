// ================= 1c_languages.js: 多語言字幕核心引擎（分割/取值/寫回/空白判斷） =================
// 目的：舊專案的每一列字幕只有單一語言。若要支援第二、第三語言（甚至更多）字幕，對既有
//       程式改動最小、也最穩的做法：把多語言文字塞進同一個字串裡，用一個分隔字元隔開，例如：
//           語言1文字|語言2文字|語言3文字
//       （語言的順序、種類完全由使用者自訂，這裡不預設誰是第一語言）
//       切割、合併、插入、刪除、重新排號、Undo/Redo、localStorage 存檔、JSON 匯出入…
//       這些都只是把整串文字搬來搬去（跟著 reassignLabels 走），完全不需要更動。
//       真正需要處理的只有「怎麼顯示」跟「怎麼寫回」，統一交給這個檔案的四個函式處理。
//
// 使用方式（其餘檔案只需呼叫這幾個函式，呼叫前建議加上 typeof 防呆判斷）：
//   splitLangs(text)            // 依目前設定的分隔字元，把一整串文字切成陣列（未啟用多語字幕時，整段文字視為單一語言，不切割）
//   getLang(text, i)            // 取出第 i 個語言（i 從 0 開始），沒有該語言時回傳 ''
//   setLang(text, i, newText)   // 只替換第 i 個語言，其餘語言原封不動，回傳合併後的新字串
//   isBlank(text)               // 判斷「所有語言」是否都是空字串，才算真的空白列
//   getLangCount()              // 動態偵測目前專案實際用到幾種語言（未啟用多語字幕時固定回傳 1）
//
// ★ 舊專案相容性：多語言字幕功能預設「不啟用」，此時 splitLangs 一律把整段文字當成
//   單一語言（即使文字裡剛好出現分隔字元也不會被切開），getLang(text, 0) 等於原本的
//   文字，setLang(text, 0, x) 也等於直接覆蓋。所以舊專案原封不動可用，不需要任何資料轉換。
//   使用者必須先在設定裡勾選「啟用多語字幕」，才會真正依分隔字元切割。
//
// 需求：必須在 1_globals.js 之後、2_audio_engine.js / 3_data_core.js / 5_list_renderer.js
//       之前載入（在 index.html 內插入 <script src="1c_languages.js"></script>）。

// ================= ★ 啟用開關、分隔字元、語言名稱設定（存在 localStorage，跨重整保留） ★ =================
const LANG_DEFAULT_DELIMITER = '|'; // 預設分隔字元：直線 |（比反斜線更不會跟 \n 等既有跳脫字元衝突）

// 多語言字幕功能開關：每次開啟網頁一律預設「不啟用」，且不記憶在 localStorage。
// 之後由三種方式決定：使用者在「設定 > 多語字幕」自己勾選、載入的 JSON 專案檔有記錄、
// 或載入的字幕至少 3 句都用分隔字元分割同句字幕時自動啟用（見檔案最下方）。
let langMultiEnabled = false;
localStorage.removeItem('tagger_langMultiEnabled'); // 清掉舊版留下的記憶，避免殘留

function getLangMultiEnabled() { return langMultiEnabled; }

function setLangMultiEnabled(enabled) {
    langMultiEnabled = !!enabled;
    return langMultiEnabled;
}

let langDelimiter = localStorage.getItem('tagger_langDelimiter') || LANG_DEFAULT_DELIMITER;

// 目前的「檢視模式」：'raw' = 顯示整串原始文字（含分隔字元）；'0'/'1'/'2' = 只顯示第幾語言
let langViewMode = localStorage.getItem('tagger_langViewMode') || 'raw';

function getLangDelimiter() { return langDelimiter || LANG_DEFAULT_DELIMITER; }

// 更新分隔字元。newDelim 為空字串時，自動還原為預設值，避免切割功能整個失效。
// ★ 注意（風險提醒，第 3 階段再處理）：更換分隔字元不會轉換既有資料裡的舊分隔字元，
//   如果專案裡已經有用舊分隔字元存的多語言文字，換了新字元後那些舊資料會切不開。
function setLangDelimiter(newDelim) {
    langDelimiter = (newDelim && String(newDelim).length > 0) ? String(newDelim) : LANG_DEFAULT_DELIMITER;
    localStorage.setItem('tagger_langDelimiter', langDelimiter);
    return langDelimiter;
}

// 語言名稱固定顯示為「語言N」（N 從 1 開始），不提供自訂名稱，避免特定語言的稱呼
// （例如「客語」「華語」）被誤植到不是那個語言的欄位上。
function getLangName(i) {
    return `語言${i + 1}`;
}

function getLangViewMode() { return langViewMode; }

function setLangViewMode(mode) {
    langViewMode = mode;
    localStorage.setItem('tagger_langViewMode', langViewMode);
    return langViewMode;
}

// 目前檢視模式若是「只看第 N 語言」，回傳該語言索引（數字，從 0 開始）；
// 若是「原始」模式（或設定壞掉），回傳 null，代表要顯示整串原始文字。
function getCurrentLangViewIndex() {
    if (!langViewMode || langViewMode === 'raw') return null;
    const idx = parseInt(langViewMode, 10);
    return isNaN(idx) ? null : idx;
}

// 動態偵測目前專案實際用到幾種語言：掃描所有句子文字，用目前的分隔字元切割後，
// 取「切出來的段數」最多的那一句當作語言數量。
// 未啟用多語字幕時固定回傳 1（此時一律視為單一語言，不進行任何切割偵測）。
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
        // 資料尚未就緒（例如頁面剛載入）時，安靜地略過，沿用目前已知的數量
    }
    return maxCount;
}

// ================= ★ 並排表格檢視（列表模式的第四種語言檢視） ★ =================
// 檢視模式值 'table'：每一列的文字區塊拆成 N 個欄位（每個語言一欄）。
// getCurrentLangViewIndex() 對 'table' 仍回傳 null（parseInt('table') 為 NaN），
// 所以其他沒改到的程式會把它當成「全部語言」處理，不會壞掉。
const LANG_TABLE_MAX_COLS = 3; // 表格最多同時顯示幾欄
let langTableCols = (() => {
    try {
        const a = JSON.parse(localStorage.getItem('tagger_langTableCols'));
        return Array.isArray(a) ? a.filter(n => Number.isInteger(n) && n >= 0) : null;
    } catch (e) { return null; }
})();

// 表格檢視是否「真的生效」：模式是 table、已啟用多語字幕、且語言數大於 1，否則一律退回全部語言
// （不改動已記憶的模式值，所以之後自動偵測成功時會自動回到表格）
function isLangTableView() {
    return langViewMode === 'table' && getLangMultiEnabled() && getLangCount() > 1;
}

// 目前表格要顯示哪幾個語言（索引陣列，由小到大，最多 LANG_TABLE_MAX_COLS 個）
function getLangTableColumns() {
    const count = getLangCount();
    let cols = (langTableCols || []).filter(i => i < count);
    if (cols.length < 2) cols = Array.from({ length: Math.min(count, LANG_TABLE_MAX_COLS) }, (_, i) => i);
    return [...new Set(cols)].sort((a, b) => a - b).slice(0, LANG_TABLE_MAX_COLS);
}

// 勾選／取消某個語言欄位。超過上限或少於 2 欄時不接受並回傳 false
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

// ================= ★ 核心四函式 ★ =================

// 依分隔字元把一整串文字切成陣列。text 為 undefined/null 時視為空字串。
// ★ 未啟用多語字幕時，整段文字一律視為單一語言（不切割），即使文字裡剛好出現
//   分隔字元也不受影響，確保舊專案／單語言使用者完全不受此功能影響。
function splitLangs(text) {
    const str = String(text || '');
    if (!getLangMultiEnabled()) return [str];
    return str.split(getLangDelimiter());
}

// 取出第 i 個語言（i 從 0 開始）。沒有該語言（陣列長度不夠）時回傳空字串。
function getLang(text, i) {
    const arr = splitLangs(text);
    return (i >= 0 && arr[i] !== undefined) ? arr[i] : '';
}

// 只替換第 i 個語言，其餘語言原封不動。若原本的語言數量不夠，會自動用空字串補齊。
// ★ 未啟用多語字幕時，一律只有「語言0」存在，直接整段覆蓋，不會把分隔字元寫進資料裡。
function setLang(text, i, newText) {
    const safeText = (newText === undefined || newText === null) ? '' : String(newText);
    if (!getLangMultiEnabled()) return safeText;
    const arr = splitLangs(text);
    while (arr.length <= i) arr.push('');
    arr[i] = safeText;
    return arr.join(getLangDelimiter());
}

// 判斷「所有語言」是否都是空白。只要有任何一個語言有內容（trim 後非空），就不算空白列。
// 例如文字只有單獨一個分隔字元「|」，兩個語言都是空字串，一樣算空白。
function isBlank(text) {
    if (!text) return true;
    return splitLangs(text).every(seg => seg.trim() === '');
}

// ================= ★ 載入字幕時：自動偵測／依專案檔還原「啟用多語字幕」 ★ =================
// 因為開關不再記憶，所以任何「載入字幕」的入口（JSON、SRT、TSV、Audacity、貼上文字、重新整理後還原）
// 都呼叫下面的函式，讓多語字幕資料載入後能正確以多語顯示。
const LANG_AUTO_DETECT_MIN_SENTENCES = 3; // 至少幾句含分隔字元，才自動啟用

// 數出有幾句「用分隔字元分割成 2 段以上，且至少有一段有內容」
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

// 讓設定頁的勾選、分隔字元欄位、語言選單，以及（需要時）列表畫面跟目前狀態一致
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

// 延遲一下再提示，避免被「載入成功」之類同時跳出的提示蓋掉
function notifyLangMultiEnabled(message) {
    setTimeout(() => {
        if (typeof showToast === 'function') showToast(message, 'success');
    }, 2000);
}

// 目前資料至少有 3 句含分隔字元 → 自動啟用並提示。已啟用或不符合條件時什麼都不做。
// opts.notify：是否跳提示（重新整理後的靜默還原用 false）；opts.render：是否重繪畫面
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

// 載入 JSON 專案檔時呼叫：專案檔有記錄就照記錄；舊專案檔沒有記錄就先關閉，再用自動偵測判斷。
// settings 即 JSON 裡的 settings 物件（可能為 undefined）。
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
