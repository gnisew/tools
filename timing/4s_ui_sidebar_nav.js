// 4s_ui_sidebar_nav.js: 設定側邊欄左側的「分區圖示欄」
// 在側邊欄左邊固定一欄圖示，每個圖示對應一個設定區塊：滑鼠移上去顯示名稱，點擊平滑捲動到該區塊，
// 捲動側邊欄時會標示目前所在的區塊。圖示與名稱直接讀取各區塊標題（.sidebar-group 的第一個 h4），
// 之後新增、改名或調整順序的區塊會自動同步，不必改這個檔案。
// 版面：側邊欄左側加 48px 內距讓出圖示欄的位置（內容寬度維持原本的 300px）；圖示欄與側邊欄同步滑入滑出。
// 樣式由本檔注入，不需修改 style.css。無其他相依，放在 index.html 最後載入即可。

(function () {
    const sidebar = document.getElementById('settingsSidebar');
    if (!sidebar) return;

    const RAIL_W = 48;
    const SIDEBAR_W = 300;

    // ---------- 樣式 ----------
    const st = document.createElement('style');
    st.id = 'sidebarNavStyle';
    st.textContent = `
        .sidebar { width: ${SIDEBAR_W + RAIL_W}px; max-width: 100vw; padding-left: ${RAIL_W}px; box-sizing: border-box; left: -${SIDEBAR_W + RAIL_W + 20}px; }
        .sidebar.open { left: 0; }
        #sidebarNav { position: fixed; top: 0; left: -${SIDEBAR_W + RAIL_W + 20}px; width: ${RAIL_W}px; height: 100%; z-index: 2002;
            background: #fff; border-right: 1px solid #E0E0E0; box-sizing: border-box;
            display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 0;
            overflow-y: auto; overflow-x: hidden; scrollbar-width: none; overscroll-behavior: contain;
            transition: left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
        #sidebarNav::-webkit-scrollbar { display: none; }
        #sidebarNav.open { left: 0; }
        #sidebarNav .sb-nav-btn { position: relative; flex: none; width: 36px; height: 36px; border: none; border-radius: 10px;
            background: transparent; color: #78909C; cursor: pointer; display: flex; align-items: center; justify-content: center;
            padding: 0; transition: background-color .15s, color .15s; }
        #sidebarNav .sb-nav-btn .material-icons { font-size: 1.3rem; }
        #sidebarNav .sb-nav-btn:hover { background: #ECEFF1; color: #00695C; }
        #sidebarNav .sb-nav-btn:focus-visible { outline: 2px solid #00897B; outline-offset: 1px; }
        #sidebarNav .sb-nav-btn.active { background: #E0F2F1; color: #00897B; }
        #sidebarNav .sb-nav-btn.active::before { content: ''; position: absolute; left: -6px; top: 8px; bottom: 8px; width: 3px; border-radius: 0 3px 3px 0; background: #00897B; }
        #sidebarNavTip { position: fixed; z-index: 2003; left: ${RAIL_W + 8}px; transform: translateY(-50%); pointer-events: none;
            background: #263238; color: #fff; font-size: 0.8rem; line-height: 1; padding: 7px 10px; border-radius: 6px; white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,.25); opacity: 0; transition: opacity .12s; }
        #sidebarNavTip.show { opacity: 1; }
    `;
    document.head.appendChild(st);

    // ---------- 建立圖示欄 ----------
    const rail = document.createElement('nav');
    rail.id = 'sidebarNav';
    rail.setAttribute('aria-label', '設定分區');
    const tip = document.createElement('div');
    tip.id = 'sidebarNavTip';
    tip.setAttribute('aria-hidden', 'true');
    document.body.append(rail, tip);

    let items = []; // { group, btn }

    function getGroups() {
        return Array.from(sidebar.querySelectorAll('.sidebar-content > .sidebar-group'));
    }

    function readTitle(h4) {
        const c = h4.cloneNode(true);
        c.querySelectorAll('.material-icons, .setting-num').forEach(n => n.remove());
        return c.textContent.trim();
    }

    function build() {
        rail.textContent = '';
        items = [];
        getGroups().forEach(group => {
            const h4 = group.querySelector('h4');
            const icon = h4 && h4.querySelector('.material-icons');
            if (!h4 || !icon) return;
            const label = readTitle(h4) || '設定';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'sb-nav-btn';
            btn.setAttribute('aria-label', label);
            const ic = document.createElement('span');
            ic.className = 'material-icons';
            ic.setAttribute('aria-hidden', 'true');
            ic.textContent = icon.textContent.trim();
            btn.appendChild(ic);

            btn.addEventListener('click', () => { goTo(group); setActive(btn); });
            btn.addEventListener('mouseenter', () => showTip(btn, label));
            btn.addEventListener('focus', () => showTip(btn, label));
            btn.addEventListener('mouseleave', hideTip);
            btn.addEventListener('blur', hideTip);

            rail.appendChild(btn);
            items.push({ group, btn });
        });
        syncVisibility();
        updateActive();
    }

    // 區塊被隱藏時（display: none），對應圖示也隱藏
    function syncVisibility() {
        items.forEach(({ group, btn }) => {
            btn.style.display = (getComputedStyle(group).display === 'none') ? 'none' : '';
        });
    }

    // ---------- 提示文字 ----------
    function showTip(btn, text) {
        const r = btn.getBoundingClientRect();
        tip.textContent = text;
        tip.style.top = (r.top + r.height / 2) + 'px';
        tip.classList.add('show');
    }
    function hideTip() { tip.classList.remove('show'); }
    rail.addEventListener('scroll', hideTip, { passive: true });
    // 圖示欄本身不能捲動時，擋掉滾輪／觸控，避免帶動後方頁面
    const blockIfStatic = (e) => { if (rail.scrollHeight <= rail.clientHeight + 1 && e.cancelable) e.preventDefault(); };
    rail.addEventListener('wheel', blockIfStatic, { passive: false });
    rail.addEventListener('touchmove', blockIfStatic, { passive: false });

    // ---------- 捲動與目前位置 ----------
    function headerHeight() {
        const h = sidebar.querySelector('.sidebar-header');
        return h ? h.offsetHeight : 0;
    }

    function goTo(group) {
        const top = group.getBoundingClientRect().top - sidebar.getBoundingClientRect().top + sidebar.scrollTop - headerHeight() - 10;
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        sidebar.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
    }

    function setActive(btn) {
        items.forEach(it => it.btn.classList.toggle('active', it.btn === btn));
        if (btn) btn.scrollIntoView({ block: 'nearest' });
    }

    // 目前區塊 = 最後一個頂端已捲過標題列下緣的區塊；捲到底時選最後一個
    function updateActive() {
        const visible = items.filter(it => it.btn.style.display !== 'none');
        if (!visible.length) return;
        const line = sidebar.getBoundingClientRect().top + headerHeight() + 24;
        let cur = visible[0];
        for (const it of visible) {
            if (it.group.getBoundingClientRect().top <= line) cur = it; else break;
        }
        if (sidebar.scrollTop + sidebar.clientHeight >= sidebar.scrollHeight - 2) cur = visible[visible.length - 1];
        setActive(cur.btn);
    }

    let ticking = false;
    sidebar.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { ticking = false; updateActive(); });
    }, { passive: true });

    // ---------- 與側邊欄同步開關 ----------
    function syncOpen() {
        const open = sidebar.classList.contains('open');
        rail.classList.toggle('open', open);
        if (open) { syncVisibility(); updateActive(); } else { hideTip(); }
    }
    new MutationObserver(syncOpen).observe(sidebar, { attributes: true, attributeFilter: ['class'] });

    build();
    syncOpen();
})();
