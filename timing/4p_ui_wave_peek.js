// ================= 4p_ui_wave_peek.js: 調整「播放略過」時，遮罩暫時透明以便看聲波 =================
// 問題：設定側邊欄開著時，#sidebarOverlay 會讓右邊的聲波變暗＋模糊，
//       調整「播放時略過靜音」的靈敏度時，看不清楚聲波上將被略過的灰色斜線。
// 做法：操作「播放略過」區塊時，替遮罩加上 .wave-peek（透明、無模糊，樣式在 style.css）；
//       放開滑桿／離開輸入框約 1.2 秒後恢復。遮罩的 .show 不受影響，
//       所以 4o_ui_scroll_guard.js 的防穿透與「點遮罩關閉側邊欄」照常運作。
// 需求：放在 index.html 最後面載入即可（只依賴 #skipSilenceCheck 與 #sidebarOverlay）。

(function () {
    const check = document.getElementById('skipSilenceCheck');
    const overlay = document.getElementById('sidebarOverlay');
    if (!check || !overlay) return;

    const group = check.closest('.sidebar-group');   // 「四、播放略過」整個區塊
    if (!group) return;

    const HOLD_MS = 1200;   // 放開後多久恢復遮罩
    let timer = null;
    let holding = false;    // 按著（拖曳滑桿）或數字輸入框有焦點時為 true

    function peekOn() {
        clearTimeout(timer);
        overlay.classList.add('wave-peek');
    }
    function peekOffLater() {
        clearTimeout(timer);
        timer = setTimeout(() => {
            if (!holding) overlay.classList.remove('wave-peek');
        }, HOLD_MS);
    }

    // 拖曳滑桿、點靈敏度按鈕、勾選／取消勾選
    group.addEventListener('pointerdown', () => { holding = true; peekOn(); });
    window.addEventListener('pointerup', () => { holding = false; peekOffLater(); });
    window.addEventListener('pointercancel', () => { holding = false; peekOffLater(); });
    group.addEventListener('input', () => { peekOn(); peekOffLater(); });
    group.addEventListener('click', () => { peekOn(); peekOffLater(); });

    // 輸入「最短靜音／前後保留」數字時，整段輸入期間都保持透明
    group.addEventListener('focusin', (e) => {
        if (e.target.matches('input[type="number"]')) { holding = true; peekOn(); }
    });
    group.addEventListener('focusout', (e) => {
        if (e.target.matches('input[type="number"]')) { holding = false; peekOffLater(); }
    });

    // 側邊欄關閉時，確保 wave-peek 被清掉
    // ★ 修改：原本用「遮罩沒有 .show」判斷關閉，且沒檢查 wave-peek 是否存在就移除，
    //   遮罩若不是靠 .show 顯示，移除動作會再觸發 observer，造成無限迴圈、頁面卡死。
    //   現在改成：① 只在「真的有 wave-peek」時才動 class；② 用遮罩實際是否顯示（display）判斷。
    const sidebar = document.getElementById('settingsSidebar');
    function isOverlayVisible() {
        return getComputedStyle(overlay).display !== 'none';
    }
    function cleanupIfClosed() {
        if (!overlay.classList.contains('wave-peek')) return;   // 沒有需要清的就不碰 class
        if (isOverlayVisible()) return;                         // 還開著就不清
        clearTimeout(timer);
        holding = false;
        overlay.classList.remove('wave-peek');
    }
    const mo = new MutationObserver(cleanupIfClosed);
    mo.observe(overlay, { attributes: true, attributeFilter: ['class', 'style'] });
    if (sidebar) mo.observe(sidebar, { attributes: true, attributeFilter: ['class', 'style'] });
})();
