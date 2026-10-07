// 4l_ui_list_mode_menu.js: 左上角模式選單（列表／單句全文／跨句範圍／多語字幕）
// 不改寫各模式的進入／離開邏輯（4g、4i、4j），只負責：
//   1. switchListMode(target)：先離開目前模式，再進入目標模式
//   2. syncListModeMenuUI()：模式變動後更新標題文字與選單勾選
// 相依：#listModeMenuBtn / #listModeMenu / #listHeaderTitle（index.html）、toggleHeaderMenu（4b）、4e/4g/4i/4j。
// #legacyModeButtons 內的三個舊切換按鈕必須保留（其他檔案仍用其 id 綁監聽或 .click()）。
// 載入順序：所有 4x 檔案之後（4k 之後）。

const LIST_MODE_LABELS = { list: '列表', full: '單句全文', groups: '跨句範圍', lang: '多語字幕' };

function getCurrentListMode() {
    if (typeof isLangEditView !== 'undefined' && isLangEditView) return 'lang';
    if (typeof isMediaGroupsView !== 'undefined' && isMediaGroupsView) return 'groups';
    if (typeof isScriptMode !== 'undefined' && isScriptMode) return 'full';
    return 'list';
}

function syncListModeMenuUI() {
    const mode = getCurrentListMode();
    const title = document.getElementById('listHeaderTitle');
    if (title) title.textContent = LIST_MODE_LABELS[mode];
    document.querySelectorAll('#listModeMenu [data-list-mode]').forEach(el => {
        el.classList.toggle('active', el.dataset.listMode === mode);
    });
    // 「語言」選單只在列表模式顯示
    if (typeof updateLangMenuVisibility === 'function') updateLangMenuVisibility();
}

function leaveCurrentListMode() {
    const mode = getCurrentListMode();
    if (mode === 'lang') exitLangEditView();
    else if (mode === 'groups') exitMediaGroupsView();
    else if (mode === 'full') document.getElementById('toggleScriptModeBtn')?.click();
}

// target: 'list' | 'full' | 'groups' | 'lang'
function switchListMode(target) {
    if (getCurrentListMode() === target) return;
    leaveCurrentListMode();
    if (target === 'full') document.getElementById('toggleScriptModeBtn')?.click();
    else if (target === 'groups') enterMediaGroupsView();
    else if (target === 'lang') enterLangEditView(); // 無字幕資料時 4j 會提示並留在列表
    syncListModeMenuUI(); // 進入失敗時標題也會停在實際狀態
}

// 包裝進入／離開函式，執行後同步標題
['enterMediaGroupsView', 'exitMediaGroupsView', 'enterLangEditView', 'exitLangEditView'].forEach(name => {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function (...args) {
        // 側邊欄等入口會直接呼叫 enterMediaGroupsView；多語模式中先離開，避免兩個檢視同時顯示
        if (name === 'enterMediaGroupsView' && typeof isLangEditView !== 'undefined' && isLangEditView) {
            window.exitLangEditView();
        }
        const result = orig.apply(this, args);
        syncListModeMenuUI();
        return result;
    };
});

// 本監聽器晚於 4g 註冊，觸發時 isScriptMode 已更新
document.getElementById('toggleScriptModeBtn')?.addEventListener('click', syncListModeMenuUI);

document.getElementById('listModeMenuBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof toggleHeaderMenu === 'function') toggleHeaderMenu('listModeMenu');
    else document.getElementById('listModeMenu')?.classList.toggle('show');
});

document.getElementById('listModeMenu')?.addEventListener('click', (e) => {
    const item = e.target.closest('[data-list-mode]');
    if (!item) return;
    e.stopPropagation();
    document.getElementById('listModeMenu')?.classList.remove('show');
    switchListMode(item.dataset.listMode);
});

syncListModeMenuUI();
