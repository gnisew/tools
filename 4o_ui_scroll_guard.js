// 4o_ui_scroll_guard.js: 選單／側邊欄「捲動不穿透」防護
// style.css 的 overscroll-behavior: contain 只對可捲動的容器有效；內容短、不能捲動的選單仍會穿透，
// 所以在此以 JS 補強：
//   · 滾輪／觸控發生在已開啟的選單或側邊欄內時，由內往外找第一個還能往該方向捲動的容器，找不到就 preventDefault
//   · 側邊欄開著時，在遮罩（#sidebarOverlay）上滾動一律擋下
//   · 選單／側邊欄關閉時完全不介入
// 無相依，放在 index.html 最後載入即可。

(function () {
    // 需防穿透的圖層：已開啟的下拉選單（含每句 ⋮、聲波 ⋮）與已開啟的設定側邊欄
    const LAYER_SEL = '.custom-dropdown-menu.show, .sidebar.open';

    function toElement(node) {
        return node instanceof Element ? node : (node && node.parentElement) || null;
    }

    // 取得事件所在的最外層已開啟圖層（處理選單內再開子選單，如 檢視 > 排序）
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

    // dy > 0 = 往下，dy < 0 = 往上
    function canScrollY(el, dy) {
        const oy = getComputedStyle(el).overflowY;
        if (oy !== 'auto' && oy !== 'scroll' && oy !== 'overlay') return false;
        if (el.scrollHeight <= el.clientHeight + 1) return false;
        if (dy < 0) return el.scrollTop > 0;
        if (dy > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
        return false;
    }

    // 從 target 往上到圖層根元素，任何一層還能捲動就放行
    function layerCanScroll(target, layer, dy) {
        let el = toElement(target);
        while (el) {
            if (canScrollY(el, dy)) return true;
            if (el === layer) break;
            el = el.parentElement;
        }
        return false;
    }

    document.addEventListener('wheel', (e) => {
        if (e.ctrlKey) return; // 瀏覽器縮放
        if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return; // 橫向捲動不處理

        const layer = getOuterLayer(e.target);
        if (layer) {
            if (!layerCanScroll(e.target, layer, e.deltaY)) e.preventDefault();
            return;
        }
        const el = toElement(e.target);
        if (el && el.closest('#sidebarOverlay.show')) e.preventDefault();
    }, { passive: false, capture: true });

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
