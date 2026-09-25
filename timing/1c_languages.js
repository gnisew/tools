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

// 多語言字幕功能開關：預設不啟用，避免影響舊專案；啟用後才會真正切割/合併多語言文字
let langMultiEnabled = localStorage.getItem('tagger_langMultiEnabled') === 'true';

function getLangMultiEnabled() { return langMultiEnabled; }

function setLangMultiEnabled(enabled) {
    langMultiEnabled = !!enabled;
    localStorage.setItem('tagger_langMultiEnabled', langMultiEnabled ? 'true' : 'false');
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
