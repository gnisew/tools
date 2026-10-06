// ================= 4o_ui_scroll_guard.js: 選單／側邊欄「捲動不穿透」防護 =================
// 問題：聲波「⋮」選單、列表各種選單（模式／編輯／檢視／每句的 ⋮）、設定側邊欄，
//       捲到頂或底、或內容根本不夠長不需要捲動時，滑鼠滾輪／手指滑動會「穿透」去捲動底下的頁面。
// 做法：CSS 的 overscroll-behavior: contain 只對「本身可捲動」的容器有效（見 style.css），
//       內容短、不能捲動的選單仍會穿透，所以這裡再加一層 JS 防護：
//       · 滑鼠滾輪／觸控滑動發生在「已開啟的選單或側邊欄」內時，
//         由內往外找第一個「還能往該方向捲動」的容器；找不到就 preventDefault，不讓事件傳給頁面。
//       · 設定側邊欄開著時，在半透明遮罩區（#sidebarOverlay）滾動也一律擋下。
//       · 選單／側邊欄關閉時完全不介入，頁面照常捲動。
// 需求：放在 index.html 最後面載入即可（不依賴任何其他檔案）。

(function () {
    // 需要防穿透的「圖層」：已開啟的下拉選單（含每句的 ⋮ 選單、聲波 ⋮ 選單）與已開啟的設定側邊欄
    const LAYER_SEL = '.custom-dropdown-menu.show, .sidebar.open';

    function toElement(node) {
        return node instanceof Element ? node : (node && node.parentElement) || null;
    }

    // 找出事件所在的「最外層」已開啟圖層（處理選單裡再開子選單的情況，例如 檢視 > 排序）
    function getOuterLayer(target) {
        const el = toElement(target);
        if (!el) return null;
        let outer = el.closest(LAYER_SEL);
        while (outer && outer.parentElement) {
            const up = outer.parentElement.closest(LAYER_SEL);
            if (!up) break;
            outer = up;
        }
        return outer;
    }

    // 這個元素「往 dy 方向」還能不能捲動（dy > 0 = 往下，dy < 0 = 往上）
    function canScrollY(el, dy) {
        const oy = getComputedStyle(el).overflowY;
        if (oy !== 'auto' && oy !== 'scroll' && oy !== 'overlay') return false;
        if (el.scrollHeight <= el.clientHeight + 1) return false;
        if (dy < 0) return el.scrollTop > 0;
        if (dy > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
        return false;
    }

    // 從 target 往上找到圖層根元素為止，只要有任何一層還能捲動就放行
    function layerCanScroll(target, layer, dy) {
        let el = toElement(target);
        while (el) {
            if (canScrollY(el, dy)) return true;
            if (el === layer) break;
            el = el.parentElement;
        }
        return false;
    }

    // ---------- 滑鼠滾輪 ----------
    document.addEventListener('wheel', (e) => {
        if (e.ctrlKey) return; // Ctrl + 滾輪 = 瀏覽器縮放，不干涉
        if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return; // 橫向捲動不處理

        const layer = getOuterLayer(e.target);
        if (layer) {
            if (!layerCanScroll(e.target, layer, e.deltaY)) e.preventDefault();
            return;
        }
        // 側邊欄開著時，滑鼠在半透明遮罩上滾動：擋下，避免捲動底下的頁面
        const el = toElement(e.target);
        if (el && el.closest('#sidebarOverlay.show')) e.preventDefault();
    }, { passive: false, capture: true });

    // ---------- 觸控滑動（手機／平板） ----------
    let touchY = null;
    document.addEventListener('touchstart', (e) => {
        touchY = e.touches.length === 1 ? e.touches[0].clientY : null;
    }, { passive: true, capture: true });

    document.addEventListener('touchmove', (e) => {
        if (touchY === null || e.touches.length !== 1) return;
        const el = toElement(e.target);
        if (el && el.closest('input[type="range"]')) return; // 拖曳滑桿時不干涉
        const y = e.touches[0].clientY;
        const dy = touchY - y; // 手指往上滑 → 內容往下捲 → dy > 0
        touchY = y;
        if (dy === 0) return;

        const layer = getOuterLayer(e.target);
        if (layer) {
            if (!layerCanScroll(e.target, layer, dy) && e.cancelable) e.preventDefault();
            return;
        }
        if (el && el.closest('#sidebarOverlay.show') && e.cancelable) e.preventDefault();
    }, { passive: false, capture: true });
})();
