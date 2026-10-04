// ================= 1b_toast.js: 提示訊息（Toast）顯示引擎 =================
// 目的：縮短提示停留時間、改為深灰色靠左下角（比照 Google Material Snackbar）。
// 做法：重新定義全域 showToast(message, type, duration)，呼叫方式與舊版完全相容
//       （type 為 'success' / 'error' / 其他或省略 = 一般）。第三個參數 duration（毫秒）可選，
//       不給就依「類型 + 文字長度」自動決定：
//         成功／一般：1.8 ~ 3 秒（「載入成功」這類短訊息約 1.8 秒）
//         錯誤：4 ~ 7 秒（要留時間讓人讀完；滑鼠移到提示上時暫停倒數）
// 需求：index.html 中必須放在 1_globals.js 之後、其他檔案之前。
//       放在 1_globals.js 之後，這裡的定義會取代它原本的 showToast，
//       之後可自行把 1_globals.js 裡舊的 showToast 刪除。

(function () {
    let hideTimer = null;
    let removeClassTimer = null;
    let hovering = false;
    let pendingHide = false;

    function calcDuration(message, type) {
        const len = String(message || '').length;
        if (type === 'error') return Math.min(7000, Math.max(4000, 2500 + len * 80));
        return Math.min(3000, Math.max(1800, 1200 + len * 40));
    }

    function hide(el) {
        el.classList.remove('show');
        pendingHide = false;
    }

    window.showToast = function (message, type, duration) {
        const el = document.getElementById('toast');
        if (!el) return;

        const kind = (type === 'success' || type === 'error') ? type : 'normal';
        const iconName = kind === 'success' ? 'check_circle' : (kind === 'error' ? 'error' : '');

        el.textContent = '';
        const icon = document.createElement('span');
        icon.className = 'material-icons toast-icon';
        icon.textContent = iconName;
        const text = document.createElement('span');
        text.textContent = String(message == null ? '' : message);
        el.append(icon, text);

        el.className = kind; // 重設 class（success / error / normal）
        // 左下角有「恢復聲波／編輯區」圓形按鈕時，讓出位置
        const fabShown = ['showWavePanelBtn', 'showListPanelBtn'].some(id => {
            const b = document.getElementById(id);
            return b && b.style.display !== 'none' && b.offsetParent !== null;
        });
        if (fabShown) el.classList.add('avoid-fab');
        void el.offsetWidth; // 強制重排，讓連續觸發時動畫能重新播放
        el.classList.add('show');

        clearTimeout(hideTimer);
        pendingHide = false;
        hideTimer = setTimeout(() => {
            if (hovering) { pendingHide = true; return; } // 滑鼠停在上面就先不收
            hide(el);
        }, Number(duration) > 0 ? Number(duration) : calcDuration(message, kind));
    };

    // 錯誤訊息要讀的時候，滑鼠移上去暫停；移開後 1 秒收起
    // （#toast 預設 pointer-events:none，只在 .show 時才可感應）
    const el = document.getElementById('toast');
    if (el) {
        el.style.pointerEvents = 'auto';
        el.addEventListener('mouseenter', () => { hovering = true; });
        el.addEventListener('mouseleave', () => {
            hovering = false;
            if (pendingHide) { clearTimeout(hideTimer); hideTimer = setTimeout(() => hide(el), 1000); }
        });
    }
})();
