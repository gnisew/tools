// ==========================================
// tableRowNum.js — 表格模式：列編號欄「可收合」（手機省空間）
//
//  三段模式（點左上角的小按鈕依序切換：精簡 → 隱藏 → 完整 → 精簡…）
//    精簡：欄寬依列數位數自動縮窄，只留數字（拿掉 ▾ 列選單）
//    隱藏：只留一條細邊，不佔空間
//    完整：原本的樣子（數字 + ▾）
//  · 預設：手機（寬度 ≤ 768px）精簡、桌機完整；手動切換後會記住（localStorage: wesing-rownum-mode）
//  · 左上角按鈕以外的區域仍是「全選」
//  · 精簡／隱藏模式沒有 ▾，改由快速工具列處理列操作（見 tableQuickBar.js）
//
// 載入順序：放在 table.js 之後、tableQuickBar.js 之前
// ==========================================
(function () {
    'use strict';

    const KEY = 'wesing-rownum-mode';
    const ORDER = ['compact', 'hidden', 'full'];
    const NAMES = { compact: '精簡', hidden: '隱藏', full: '完整' };

    let mode = localStorage.getItem(KEY);
    if (ORDER.indexOf(mode) < 0) mode = window.matchMedia('(max-width: 768px)').matches ? 'compact' : 'full';

    // 給其他模組讀取目前模式
    window.RowNumMode = { get: function () { return mode; } };

    const st = document.createElement('style');
    st.textContent = [
        'body.rn-compact table#data-table th.sticky-left,body.rn-compact table#data-table th.sticky-corner,',
        'body.rn-hidden table#data-table th.sticky-left,body.rn-hidden table#data-table th.sticky-corner{',
        '  width:var(--rn-w) !important;min-width:var(--rn-w) !important;max-width:var(--rn-w) !important;padding:0 !important;}',
        'body.rn-compact .btn-row-menu,body.rn-hidden .btn-row-menu{display:none !important;}',
        'body.rn-compact table#data-table th.sticky-left > div,body.rn-hidden table#data-table th.sticky-left > div{padding:0 !important;}',
        'body.rn-compact table#data-table th.sticky-left .row-label{font-size:11px;padding:0 !important;}',
        'body.rn-hidden table#data-table th.sticky-left .row-label{font-size:0 !important;padding:0 !important;}',
        'table#data-table th.sticky-corner .rn-toggle{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);',
        '  width:26px;height:26px;padding:0;border:0;border-radius:6px;background:transparent;color:#94a3b8;',
        '  display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;}',
        'table#data-table th.sticky-corner .rn-toggle:hover{background:#e2e8f0;color:#475569;}',
        'table#data-table th.sticky-corner .rn-toggle .material-symbols-outlined{font-size:16px;}',
        'body.rn-hidden table#data-table th.sticky-corner .rn-toggle{width:100%;height:100%;top:0;left:0;transform:none;border-radius:0;}'
    ].join('\n');
    document.head.appendChild(st);

    function iconFor(m) { return m === 'hidden' ? 'chevron_right' : 'format_list_numbered'; }

    function updateWidth() {
        const tbody = dataTable.querySelector('tbody');
        const rows = tbody ? tbody.children.length : 0;
        const digits = String(Math.max(rows, 10)).length;
        const w = mode === 'hidden' ? 14 : Math.max(30, 7 * digits + 12);
        document.documentElement.style.setProperty('--rn-w', w + 'px');
    }

    function ensureButton() {
        const corner = dataTable.querySelector('th.sticky-corner');
        if (!corner) return;
        let btn = corner.querySelector('.rn-toggle');
        if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'rn-toggle';
            btn.innerHTML = '<span class="material-symbols-outlined"></span>';
            // 不要觸發角落原本的「全選」
            btn.addEventListener('click', function (e) { e.stopPropagation(); cycle(); });
            btn.addEventListener('mousedown', function (e) { e.stopPropagation(); });
            corner.appendChild(btn);
        }
        btn.firstChild.textContent = iconFor(mode);
        btn.title = '列編號：' + NAMES[mode] + '（點擊切換）';
    }

    function apply() {
        document.body.classList.toggle('rn-compact', mode === 'compact');
        document.body.classList.toggle('rn-hidden', mode === 'hidden');
        updateWidth();
        ensureButton();
        if (typeof applySelectionVisuals === 'function') applySelectionVisuals();   // 通知工具列等重新定位
    }

    function cycle() {
        mode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
        localStorage.setItem(KEY, mode);
        apply();
        showToast('🔢 列編號：' + NAMES[mode]);
    }

    // 表格重繪、增刪列時：補回按鈕、依列數重算寬度
    let raf = 0;
    function schedule() {
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = 0; updateWidth(); ensureButton(); });
    }
    new MutationObserver(schedule).observe(dataTable, { childList: true, subtree: true });

    function init() { apply(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
