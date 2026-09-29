// ================= 4l_ui_list_mode_menu.js: 左上角「模式選單」（列表／單句全文／跨句群組／多語字幕） =================
// 目的：原本左上角只是顯示「列表」的標題，切換模式的入口藏在「編輯」選單裡，進入群組／多語後
//       還要另外點「返回列表」。現在標題本身就是下拉選單，四種模式一次列出、隨時可互相切換，
//       不再需要任何「返回列表」按鈕。
//
// 做法：不重寫各模式的進入／離開邏輯（4g 全文、4i 群組、4j 多語都維持原樣），
//       只負責兩件事：
//       1. switchListMode(target)：先「離開目前模式」，再「進入目標模式」，
//          避免像過去直接點 toggleScriptModeBtn 那樣在群組／多語模式下把全文旗標亂切。
//       2. syncListModeMenuUI()：任何模式變動後，更新標題文字與選單裡的勾選狀態。
//          用跟 4k 相同的手法——包裝既有的進入／離開函式，並監聽全文按鈕的 click。
//
// 相依：#listModeMenuBtn / #listModeMenu / #listHeaderTitle（index.html）、
//       toggleHeaderMenu（4b）、以及 4e/4g/4i/4j 的既有函式。
//       原本在「編輯」選單的三個切換按鈕仍保留在隱藏容器 #legacyModeButtons 內，
//       因為其他檔案仍用它們的 id 綁監聽或 .click()。
//       需在所有 4x 檔案之後載入（放在 4k 之後）。

const LIST_MODE_LABELS = { list: '列表', full: '單句全文', groups: '跨句群組', lang: '多語字幕' };

// 依目前三個旗標算出現在的模式
function getCurrentListMode() {
    if (typeof isLangEditView !== 'undefined' && isLangEditView) return 'lang';
    if (typeof isMediaGroupsView !== 'undefined' && isMediaGroupsView) return 'groups';
    if (typeof isScriptMode !== 'undefined' && isScriptMode) return 'full';
    return 'list';
}

// 更新標題文字與選單勾選狀態
function syncListModeMenuUI() {
    const mode = getCurrentListMode();
    const title = document.getElementById('listHeaderTitle');
    if (title) title.textContent = LIST_MODE_LABELS[mode];
    document.querySelectorAll('#listModeMenu [data-list-mode]').forEach(el => {
        el.classList.toggle('active', el.dataset.listMode === mode);
    });
}

// 離開目前模式（回到單句列表）
function leaveCurrentListMode() {
    const mode = getCurrentListMode();
    if (mode === 'lang') exitLangEditView();
    else if (mode === 'groups') exitMediaGroupsView();
    else if (mode === 'full') document.getElementById('toggleScriptModeBtn')?.click();
}

// 切換到指定模式：'list' | 'full' | 'groups' | 'lang'
function switchListMode(target) {
    if (getCurrentListMode() === target) return;
    leaveCurrentListMode();
    if (target === 'full') document.getElementById('toggleScriptModeBtn')?.click();
    else if (target === 'groups') enterMediaGroupsView();
    else if (target === 'lang') enterLangEditView(); // 沒有字幕資料時 4j 會自己提示並留在列表
    syncListModeMenuUI(); // 進入失敗（例如沒有資料）時，標題也會正確停在實際狀態
}

// ================= ★ 包裝既有的進入／離開函式：原函式跑完後自動同步標題 ★ =================
['enterMediaGroupsView', 'exitMediaGroupsView', 'enterLangEditView', 'exitLangEditView'].forEach(name => {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function (...args) {
        // 側邊欄按鈕等入口會直接呼叫 enterMediaGroupsView；若此時正在多語模式，先離開，避免兩個檢視同時顯示
        if (name === 'enterMediaGroupsView' && typeof isLangEditView !== 'undefined' && isLangEditView) {
            window.exitLangEditView();
        }
        const result = orig.apply(this, args);
        syncListModeMenuUI();
        return result;
    };
});

// 全文模式是按鈕切換（4g 綁定），本檔監聽器晚於 4g 註冊，所以觸發時 isScriptMode 已更新
document.getElementById('toggleScriptModeBtn')?.addEventListener('click', syncListModeMenuUI);

// ================= ★ 選單開關與項目點擊 ★ =================
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
