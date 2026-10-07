// 4k_ui_url_params.js: 檢視模式 ↔ 網址參數同步
// ?mode=full（全文）／groups（跨句範圍）／lang（多語字幕）；單句列表為預設，不帶參數。
// 用 history.replaceState 更新，不新增瀏覽紀錄，其他參數與 #hash 保留。
// 載入順序：必須在所有 4x 檔案之後（要包裝 4i / 4j 的函式，且要等 loadFromStorage() 跑完）。

const URL_MODE_PARAM = 'mode';
const URL_MODE_VALUES = { full: 'full', groups: 'groups', lang: 'lang' };
let urlModeRestoring = false; // 還原期間不寫回網址，避免中途狀態洗掉參數

function getCurrentUrlMode() {
    if (typeof isLangEditView !== 'undefined' && isLangEditView) return URL_MODE_VALUES.lang;
    if (typeof isMediaGroupsView !== 'undefined' && isMediaGroupsView) return URL_MODE_VALUES.groups;
    if (typeof isScriptMode !== 'undefined' && isScriptMode) return URL_MODE_VALUES.full;
    return null;
}

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
        // file:// 等環境不允許改網址時略過
    }
}

// 包裝進入／離開函式，執行後同步網址
['enterMediaGroupsView', 'exitMediaGroupsView', 'enterLangEditView', 'exitLangEditView'].forEach(name => {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function (...args) {
        const result = orig.apply(this, args);
        syncUrlFromMode();
        return result;
    };
});

// 本監聽器晚於 4g 註冊，觸發時 isScriptMode 已更新
document.getElementById('toggleScriptModeBtn')?.addEventListener('click', syncUrlFromMode);

// 載入時依網址還原模式（監聽器晚於 loadFromStorage，延遲 300ms 讓列表先完成初次渲染）
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
            syncUrlFromMode(); // 還原失敗（如無資料）時，把網址校正回實際狀態
        }
    }, 300);
});
