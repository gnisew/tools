// 1b_toast.js: 提示訊息（Toast）
// showToast(message, type, duration)：type 為 'success' / 'error' / 其他（一般）；
// duration（毫秒）可省略，省略時依類型與文字長度自動計算。
// 載入順序：1_globals.js 之後（會取代其中舊的 showToast，舊版可刪除）

(function () {
    let hideTimer = null;
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

        el.className = kind;
        // 左下角有圓形浮動按鈕時讓出位置
        const fabShown = ['showWavePanelBtn', 'showListPanelBtn'].some(id => {
            const b = document.getElementById(id);
            return b && b.style.display !== 'none' && b.offsetParent !== null;
        });
        if (fabShown) el.classList.add('avoid-fab');
        void el.offsetWidth; // 強制重排，讓連續觸發時動畫重新播放
        el.classList.add('show');

        clearTimeout(hideTimer);
        pendingHide = false;
        hideTimer = setTimeout(() => {
            if (hovering) { pendingHide = true; return; }
            hide(el);
        }, Number(duration) > 0 ? Number(duration) : calcDuration(message, kind));
    };

    // 滑鼠停在提示上時暫停倒數，移開後 1 秒收起
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
