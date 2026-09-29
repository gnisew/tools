// ================= 4k_ui_url_params.js: 檢視模式 ↔ 網址參數同步 =================
// 目的：讓「單句全文 / 跨句群組 / 多語字幕」三種列表模式，能反映在網址上，
//       重新整理（F5）或用網址分享／加書籤時，可以直接回到同一個模式。
//
// 網址格式（單句列表為預設，不帶參數，網址保持乾淨）：
//   ?mode=full     → 全文模式（劇本大編輯框）
//   ?mode=groups   → 跨句群組
//   ?mode=lang     → 多語字幕
//
// 做法：用 history.replaceState 更新網址，不新增瀏覽紀錄，不會讓「上一頁」變得混亂；
//       其他既有的網址參數與 #hash 會原樣保留。
//
// 需求：必須在所有 4x 檔案之後載入（放在 index.html 最後一支 script），
//       因為要包裝 4i / 4j 的進入／離開函式，且要等 loadFromStorage() 跑完才還原模式。

const URL_MODE_PARAM = 'mode';
const URL_MODE_VALUES = { full: 'full', groups: 'groups', lang: 'lang' };
let urlModeRestoring = false; // 還原期間不寫回網址，避免中途狀態把參數洗掉

// 依目前三個旗標，算出現在的模式（單句列表回傳 null）
function getCurrentUrlMode() {
    if (typeof isLangEditView !== 'undefined' && isLangEditView) return URL_MODE_VALUES.lang;
    if (typeof isMediaGroupsView !== 'undefined' && isMediaGroupsView) return URL_MODE_VALUES.groups;
    if (typeof isScriptMode !== 'undefined' && isScriptMode) return URL_MODE_VALUES.full;
    return null;
}

// 把目前模式寫進網址（其他參數、hash 保留）
function syncUrlFromMode() {
    if (urlModeRestoring) return;
    try {
        const url = new URL(window.location.href);
        const mode = getCurrentUrlMode();
        if (mode) url.searchParams.set(URL_MODE_PARAM, mode);
        else url.searchParams.delete(URL_MODE_PARAM);
        const next = url.pathname + url.search + url.hash;
        const cur = window.location.pathname + window.location.search + window.location.hash;
        if (next !== cur) history.replaceState(null, '', next);
    } catch (e) {
        // file:// 或特殊環境不允許改網址時，安靜略過，不影響原本功能
    }
}

// 包裝既有的進入／離開函式：原函式跑完後，自動同步網址（不需改 4i / 4j 原始碼）
['enterMediaGroupsView', 'exitMediaGroupsView', 'enterLangEditView', 'exitLangEditView'].forEach(name => {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function (...args) {
        const result = orig.apply(this, args);
        syncUrlFromMode();
        return result;
    };
});

// 全文模式是按鈕切換（4g 綁定），本檔監聽器晚於 4g 註冊，所以觸發時 isScriptMode 已更新
document.getElementById('toggleScriptModeBtn')?.addEventListener('click', syncUrlFromMode);

// ================= ★ 載入時依網址還原模式 ★ =================
// 本檔的 DOMContentLoaded 監聽器註冊得比 4d / 6 的 loadFromStorage 晚，
// 觸發時資料已載入；再延遲一下，讓列表先完成初次渲染。
window.addEventListener('DOMContentLoaded', () => {
    const mode = new URLSearchParams(window.location.search).get(URL_MODE_PARAM);
    if (!mode) return;

    setTimeout(() => {
        urlModeRestoring = true;
        try {
            if (mode === URL_MODE_VALUES.full) {
                if (!isScriptMode) document.getElementById('toggleScriptModeBtn')?.click();
            } else if (mode === URL_MODE_VALUES.groups) {
                if (typeof enterMediaGroupsView === 'function') enterMediaGroupsView();
            } else if (mode === URL_MODE_VALUES.lang) {
                if (typeof enterLangEditView === 'function') enterLangEditView();
            }
        } finally {
            urlModeRestoring = false;
            syncUrlFromMode(); // 還原失敗（例如沒有資料無法進入多語字幕）時，把網址校正回實際狀態
        }
    }, 300);
});
