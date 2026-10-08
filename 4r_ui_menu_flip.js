// 4r_ui_menu_flip.js: 下拉選單超出視窗底部時，自動改往上展開
// 任何 .custom-dropdown-menu 被打開（加上 .show）後量測是否超出視窗底部：
//   · 超出且上方空間較大 → 改往上展開（子選單改為底部對齊）
//   · 上下都放不下 → 選較大的一側，並縮小 max-height（選單內可捲動）
//   · 關閉時還原行內樣式，下次打開重新判斷
// 打開期間也會暫時拉高祖先層級，避免被黏性聲波面板蓋住。
// 不修改既有選單的開關邏輯，只依 class 變化介入；已標示 .upwards 的選單不處理。
// 無相依，放在 index.html 最後載入即可。

(function () {
    const GAP = 8;                       // 與視窗邊緣保留的距離
    const KEYS = ['top', 'bottom', 'marginTop', 'marginBottom', 'maxHeight'];
    const saved = new WeakMap();         // menu -> 原本的行內樣式
    const raised = new WeakMap();        // menu -> [{el, z}]：被暫時拉高層級的祖先
    const LIFT_Z = '150';                // 高於黏性聲波面板（z-index: 100），低於對話框／側邊欄

    // 選單的祖先若有自己的 z-index（如列表標題列），往上展開時會被黏性聲波面板蓋住，
    // 因此打開期間暫時拉高這些祖先，關閉後還原。
    function lift(menu) {
        if (raised.has(menu)) return;
        const list = [];
        for (let el = menu.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
            const cs = getComputedStyle(el);
            if (cs.position === 'static') continue;
            const z = parseInt(cs.zIndex, 10);
            if (!isNaN(z) && z >= parseInt(LIFT_Z, 10)) continue;
            if (cs.position === 'fixed') continue;
            list.push({ el, z: el.style.zIndex });
            el.style.zIndex = LIFT_Z;
        }
        raised.set(menu, list);
    }
    function drop(menu) {
        const list = raised.get(menu);
        if (!list) return;
        list.forEach(o => { o.el.style.zIndex = o.z; });
        raised.delete(menu);
    }

    function restore(menu) {
        const s = saved.get(menu);
        if (!s) return;
        KEYS.forEach(k => { menu.style[k] = s[k]; });
        saved.delete(menu);
    }

    function place(menu) {
        if (menu.classList.contains('upwards')) return;
        if (getComputedStyle(menu).position !== 'absolute') return;
        restore(menu);

        const vh = window.innerHeight;
        const r = menu.getBoundingClientRect();
        if (r.bottom <= vh - GAP) return; // 放得下，維持往下

        const parent = menu.offsetParent || document.body;
        const pr = parent.getBoundingClientRect();
        const isSub = parseFloat(menu.style.top) === 0 && menu.style.left === '100%'; // 子選單（如 檢視 > 排序）

        // 往上展開的底部基準線：一般選單 = 觸發按鈕上緣；子選單 = 對齊父層底部
        const anchorBottom = isSub ? Math.min(pr.bottom, vh - GAP) : pr.top;
        const roomBelow = vh - r.top - GAP;
        const roomAbove = anchorBottom - GAP;
        if (roomAbove <= roomBelow) { // 上方更小，留在下方，只限制高度
            saved.set(menu, Object.fromEntries(KEYS.map(k => [k, menu.style[k]])));
            menu.style.maxHeight = Math.max(120, roomBelow) + 'px';
            return;
        }

        saved.set(menu, Object.fromEntries(KEYS.map(k => [k, menu.style[k]])));
        menu.style.top = 'auto';
        menu.style.bottom = isSub ? '0' : '100%';
        menu.style.marginTop = '0';
        menu.style.marginBottom = isSub ? '0' : GAP + 'px';
        const natural = menu.scrollHeight;
        if (natural > roomAbove) menu.style.maxHeight = Math.max(120, roomAbove) + 'px';
    }

    const mo = new MutationObserver((list) => {
        for (const m of list) {
            const el = m.target;
            if (!(el instanceof Element) || !el.classList.contains('custom-dropdown-menu')) continue;
            if (el.classList.contains('show')) { lift(el); place(el); } else { restore(el); drop(el); }
        }
    });
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });

    // 選單開著時視窗大小改變 → 重新判斷
    window.addEventListener('resize', () => {
        document.querySelectorAll('.custom-dropdown-menu.show').forEach(place);
    });
})();
