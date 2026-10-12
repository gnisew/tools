// =================================================================
// 紀錄備份模組 (records.js)
// 連線遊戲 / 互動問答 結束時自動備份成績，僅存在本機瀏覽器 (localStorage)
// 提供：列表、下載 CSV、複製（可貼到 Excel）、單筆刪除、多選刪除
// =================================================================
(function () {
    const KEY = 'wuyixing_game_records_v1';
    const MAX_RECORDS = 200;
    const TYPE_META = {
        arena: { label: '連線', icon: 'sports_esports', badge: 'bg-indigo-100 text-indigo-700' },
        live:  { label: '問答', icon: 'forum',          badge: 'bg-teal-100 text-teal-700' }
    };

    let records = [];
    let modal = null;
    let selectMode = false;
    let filter = 'all';   // all | arena | live
    const selected = new Set();

    const toast = (m) => { if (typeof showToast === 'function') showToast(m); };
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

    // ---------- 儲存 ----------
    function load() {
        try {
            const data = JSON.parse(localStorage.getItem(KEY) || '[]');
            records = Array.isArray(data) ? data : [];
        } catch (e) { records = []; }
        return records;
    }

    function persist() {
        let dropped = 0;
        while (true) {
            try {
                localStorage.setItem(KEY, JSON.stringify(records));
                if (dropped) toast(`⚠️ 儲存空間不足，已自動移除最舊的 ${dropped} 筆紀錄`);
                return true;
            } catch (e) {
                if (records.length <= 1) { toast('⚠️ 儲存空間不足，無法備份紀錄'); return false; }
                records.pop(); dropped++;
            }
        }
    }

    // rec: { type, title, spaceCode, playerCount, qCount, tables:[{label, rows}] }
    function save(rec) {
        if (!rec || !Array.isArray(rec.tables) || rec.tables.length === 0) return false;
        load();
        const entry = {
            id: 'rec_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            type: rec.type === 'live' ? 'live' : 'arena',
            title: rec.title || '未命名',
            spaceCode: rec.spaceCode || '',
            playerCount: rec.playerCount || 0,
            qCount: rec.qCount || 0,
            ts: Date.now(),
            tables: rec.tables
        };
        // 同一個空間重複存（例如先結束、再關閉）→ 覆蓋舊的，不重複產生
        const dup = entry.spaceCode ? records.findIndex(r => r.type === entry.type && r.spaceCode === entry.spaceCode) : -1;
        if (dup >= 0) records.splice(dup, 1);
        records.unshift(entry);
        if (records.length > MAX_RECORDS) records.length = MAX_RECORDS;
        const ok = persist();
        if (ok && modal) render();
        return ok;
    }

    // ---------- CSV / 複製 ----------
    function safeCell(cell) {
        let str = String(cell ?? '');
        if (typeof cell === 'string' && /^[=+\-@]/.test(str)) str = "'" + str; // 防 Excel 公式
        return str;
    }
    function rowsToCSV(rows) {
        return rows.map(r => r.map(c => {
            let s = safeCell(c);
            if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
            return s;
        }).join(',')).join('\r\n');
    }
    function rowsToTSV(rows) {
        return rows.map(r => r.map(c => {
            let s = safeCell(c);
            if (/[\t\r\n"]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
            return s;
        }).join('\t')).join('\n');
    }
    function copyText(text) {
        const fallback = () => new Promise((res, rej) => {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
            document.body.appendChild(ta); ta.focus(); ta.select();
            let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
            ta.remove(); ok ? res() : rej(new Error('copy failed'));
        });
        if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(fallback);
        return fallback();
    }
    function fmtDate(ts, withTime = true) {
        const d = new Date(ts), p = n => String(n).padStart(2, '0');
        const day = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
        return withTime ? `${day} ${p(d.getHours())}:${p(d.getMinutes())}` : day;
    }
    function downloadTable(rec, t) {
        const blob = new Blob(['\uFEFF' + rowsToCSV(t.rows)], { type: 'text/csv;charset=utf-8' });
        const name = `${t.label}_${rec.title}_${fmtDate(rec.ts, false)}`.replace(/[\\/:*?"<>|\s]+/g, '_') + '.csv';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast(`✅ 已下載「${t.label}」`);
    }
    function copyTable(t) {
        copyText(rowsToTSV(t.rows))
            .then(() => toast(`✅ 已複製「${t.label}」，到 Excel／試算表按 Ctrl+V 貼上`))
            .catch(() => toast('⚠️ 複製失敗，請改用下載 CSV'));
    }

    // ---------- 改名（點標題直接編輯，自動儲存） ----------
    function renameRecord(id, title) {
        load();
        const r = records.find(x => x.id === id);
        if (!r || r.title === title) return false;
        r.title = title;
        return persist();
    }
    let renameTimer = null;
    function commitTitle(input, toastIt) {
        const id = input.dataset.id;
        let v = input.value.trim();
        if (!v) { input.value = input.dataset.orig; return; }   // 不允許空白，還原
        if (v !== input.value) input.value = v;
        if (renameRecord(id, v)) {
            input.dataset.orig = v;
            if (toastIt) toast('✅ 名稱已儲存');
        }
    }

    // ---------- 刪除 ----------
    function deleteIds(ids) {
        const set = new Set(ids);
        load();
        records = records.filter(r => !set.has(r.id));
        persist();
        ids.forEach(id => selected.delete(id));
        if (records.length === 0) selectMode = false;
        render();
        toast(`🗑️ 已刪除 ${ids.length} 筆紀錄`);
    }

    function askDelete(ids) {
        if (!modal || ids.length === 0) return;
        modal.querySelector('#rec-confirm')?.remove();
        const box = document.createElement('div');
        box.id = 'rec-confirm';
        box.className = 'absolute inset-0 bg-black/30 flex items-center justify-center p-4 rounded-2xl';
        const single = ids.length === 1 ? records.find(r => r.id === ids[0]) : null;
        box.innerHTML = `
            <div class="bg-white rounded-2xl w-full max-w-xs p-5 shadow-2xl border border-gray-200 text-center">
                <span class="material-symbols-outlined text-4xl text-rose-400">delete</span>
                <h3 class="text-lg font-extrabold text-gray-800 mt-1">刪除紀錄</h3>
                <p class="text-gray-500 font-bold text-sm my-3 leading-relaxed">${single ? `確定要刪除「${esc(single.title)}」嗎？` : `確定要刪除選取的 ${ids.length} 筆紀錄嗎？`}<br>刪除後無法復原。</p>
                <div class="flex gap-2">
                    <button data-act="confirm-cancel" class="w-1/2 px-4 py-2 rounded-lg font-bold text-gray-500 hover:bg-gray-100 border border-gray-200 text-sm">取消</button>
                    <button data-act="confirm-ok" class="w-1/2 px-4 py-2 rounded-lg font-bold text-white bg-rose-500 hover:bg-rose-600 text-sm">刪除</button>
                </div>
            </div>`;
        box.querySelector('[data-act="confirm-cancel"]').onclick = () => box.remove();
        box.querySelector('[data-act="confirm-ok"]').onclick = () => { box.remove(); deleteIds(ids); };
        modal.firstElementChild.appendChild(box);
    }

    // ---------- 畫面 ----------
    function ensureModal() {
        if (modal) return;
        modal = document.createElement('div');
        modal.id = 'records-modal';
        modal.className = 'fixed inset-0 bg-black/40 flex items-center justify-center p-4';
        modal.style.zIndex = '7000';
        modal.addEventListener('click', onClick);
        modal.addEventListener('input', (e) => {
            const t = e.target.closest('.rec-title'); if (!t) return;
            clearTimeout(renameTimer);
            renameTimer = setTimeout(() => commitTitle(t, false), 400);   // 打字中也自動存
        });
        modal.addEventListener('focusout', (e) => {
            const t = e.target.closest && e.target.closest('.rec-title'); if (!t) return;
            clearTimeout(renameTimer);
            const changed = t.value.trim() !== t.dataset.orig;
            commitTitle(t, changed);
        });
        modal.addEventListener('keydown', (e) => {
            const t = e.target.closest && e.target.closest('.rec-title'); if (!t) return;
            if (e.key === 'Enter') { e.preventDefault(); t.blur(); }
        });
        document.body.appendChild(modal);
        document.addEventListener('keydown', onKey);
    }

    function onKey(e) {
        if (!modal || e.key !== 'Escape') return;
        e.preventDefault();
        const ti = document.activeElement;
        if (ti && ti.classList && ti.classList.contains('rec-title')) {   // 編輯中按 Esc：還原並離開輸入框
            clearTimeout(renameTimer);
            ti.value = ti.dataset.orig; renameRecord(ti.dataset.id, ti.dataset.orig); ti.blur();
            return;
        }
        const c = modal.querySelector('#rec-confirm');
        if (c) c.remove();
        else if (selectMode) { selectMode = false; selected.clear(); render(); }
        else close();
    }

    function render() {
        if (!modal) return;
        const keepScroll = modal.querySelector('#rec-list')?.scrollTop || 0;
        const visible = filter === 'all' ? records : records.filter(r => r.type === filter);
        const allChecked = visible.length > 0 && visible.every(r => selected.has(r.id));
        const cnt = { all: records.length, arena: records.filter(r => r.type === 'arena').length, live: records.filter(r => r.type === 'live').length };
        const pill = (key, label) => `<button data-act="filter" data-f="${key}" class="px-3 py-1 rounded-full text-sm font-bold transition-colors ${filter === key ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}">${label} <span class="${filter === key ? 'text-gray-300' : 'text-gray-400'} font-medium">${cnt[key]}</span></button>`;

        const items = visible.map(r => {
            const meta = TYPE_META[r.type] || TYPE_META.arena;
            const isSel = selected.has(r.id);
            const info = [fmtDate(r.ts), r.playerCount ? `${r.playerCount} 人` : '', r.qCount ? `${r.qCount} 題` : '', r.spaceCode ? `代碼 ${r.spaceCode}` : '']
                .filter(Boolean).join(' · ');
            const tableBtns = r.tables.map((t, i) => `
                <span class="inline-flex items-center bg-white border border-gray-200 rounded-md overflow-hidden shrink-0">
                    <span class="px-2 py-0.5 text-xs font-bold text-gray-600">${esc(t.label)}</span>
                    <button data-act="download" data-id="${r.id}" data-t="${i}" title="下載 CSV" class="px-1 py-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 border-l border-gray-200"><span class="material-symbols-outlined text-[16px] align-middle">download</span></button>
                    <button data-act="copy" data-id="${r.id}" data-t="${i}" title="複製（可貼到 Excel）" class="px-1 py-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 border-l border-gray-200"><span class="material-symbols-outlined text-[16px] align-middle">content_copy</span></button>
                </span>`).join('');
            const titleEl = selectMode
                ? `<span class="flex-1 min-w-[6rem] truncate text-[15px] font-bold text-gray-800">${esc(r.title)}</span>`
                : `<input type="text" class="rec-title flex-1 min-w-[6rem] text-[15px] font-bold text-gray-800 bg-transparent border-0 border-b-2 border-transparent focus:border-blue-500 rounded-none px-0 py-0.5 outline-none transition-colors truncate cursor-text" data-id="${r.id}" data-orig="${esc(r.title)}" value="${esc(r.title)}" maxlength="60" title="點擊可修改名稱（自動儲存）" spellcheck="false">`;
            return `
            <div data-row="${r.id}" class="flex items-center gap-x-3 gap-y-1.5 flex-wrap px-4 py-2.5 border-b border-gray-100 ${selectMode ? 'cursor-pointer' : ''} ${isSel ? 'bg-blue-50' : 'hover:bg-gray-50/70'}">
                ${selectMode ? `<span class="material-symbols-outlined text-[22px] ${isSel ? 'text-blue-600' : 'text-gray-300'}">${isSel ? 'check_box' : 'check_box_outline_blank'}</span>` : ''}
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.badge} inline-flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[14px]">${meta.icon}</span>${meta.label}</span>
                ${titleEl}
                <span class="text-xs text-gray-400 font-medium whitespace-nowrap">${esc(info)}</span>
                ${selectMode ? '' : `<span class="flex items-center gap-1.5 shrink-0">${tableBtns}</span>
                <button data-act="delete" data-id="${r.id}" title="刪除紀錄" class="p-1 rounded-md text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"><span class="material-symbols-outlined text-[19px] align-middle">delete</span></button>`}
            </div>`;
        }).join('');

        modal.innerHTML = `
        <div class="relative bg-white rounded-2xl w-full max-w-4xl h-[75vh] max-h-[85vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            <div class="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <span class="material-symbols-outlined text-gray-500">history</span>
                <div class="flex-1 min-w-0">
                    <h2 class="text-lg font-extrabold text-gray-800 leading-tight">紀錄備份</h2>
                    <div class="text-xs text-gray-400 font-medium">只存在這台電腦的瀏覽器，不會上傳；清除瀏覽器資料會一併消失</div>
                </div>
                ${records.length && !selectMode ? `<button data-act="select-mode" class="px-3 py-1.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 border border-gray-200 flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">checklist</span>選取</button>` : ''}
                <button data-act="close" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"><span class="material-symbols-outlined">close</span></button>
            </div>
            ${records.length ? `<div class="flex items-center gap-1.5 px-5 py-2 border-b border-gray-100">${pill('all', '全部')}${pill('arena', '連線')}${pill('live', '問答')}</div>` : ''}
            ${selectMode ? `
            <div class="flex items-center gap-3 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                <button data-act="select-all" class="flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-gray-800">
                    <span class="material-symbols-outlined text-[22px] ${allChecked ? 'text-blue-600' : 'text-gray-400'}">${allChecked ? 'check_box' : 'check_box_outline_blank'}</span>全選
                </button>
                <span class="text-sm font-bold text-gray-500">已選 ${selected.size} 項</span>
                <span class="flex-1"></span>
                <button data-act="delete-selected" ${selected.size ? '' : 'disabled'} class="px-3 py-1.5 rounded-lg text-sm font-bold text-white flex items-center gap-1 ${selected.size ? 'bg-rose-500 hover:bg-rose-600' : 'bg-gray-300 cursor-not-allowed'}"><span class="material-symbols-outlined text-[18px]">delete</span>刪除</button>
                <button data-act="exit-select" class="px-3 py-1.5 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-200 border border-gray-200">取消</button>
            </div>` : ''}
            <div id="rec-list" class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                ${visible.length ? items : (records.length ? `
                <div class="flex flex-col items-center justify-center py-16 text-gray-400"><span class="material-symbols-outlined text-5xl mb-2">filter_alt_off</span><div class="font-bold">這個類型還沒有紀錄</div></div>` : `
                <div class="flex flex-col items-center justify-center py-16 text-gray-400">
                    <span class="material-symbols-outlined text-5xl mb-2">inbox</span>
                    <div class="font-bold">還沒有任何紀錄</div>
                    <div class="text-xs mt-1">連線遊戲或互動問答結束後，會自動備份在這裡</div>
                </div>`)}
            </div>
        </div>`;
        const list = modal.querySelector('#rec-list');
        if (list) list.scrollTop = keepScroll;
    }

    function onClick(e) {
        if (e.target === modal) { if (!modal.querySelector('#rec-confirm')) close(); return; }
        const btn = e.target.closest('[data-act]');
        if (btn) {
            const act = btn.dataset.act, id = btn.dataset.id;
            const rec = id ? records.find(r => r.id === id) : null;
            if (act === 'close') return close();
            if (act === 'filter') { filter = btn.dataset.f; selected.clear(); return render(); }
            if (act === 'select-mode') { selectMode = true; selected.clear(); return render(); }
            if (act === 'exit-select') { selectMode = false; selected.clear(); return render(); }
            if (act === 'select-all') {
                const vis = filter === 'all' ? records : records.filter(r => r.type === filter);
                if (vis.length && vis.every(r => selected.has(r.id))) vis.forEach(r => selected.delete(r.id));
                else vis.forEach(r => selected.add(r.id));
                return render();
            }
            if (act === 'delete-selected') return askDelete([...selected]);
            if (act === 'delete' && rec) return askDelete([rec.id]);
            if (act === 'download' && rec) return downloadTable(rec, rec.tables[+btn.dataset.t]);
            if (act === 'copy' && rec) return copyTable(rec.tables[+btn.dataset.t]);
            return;
        }
        if (selectMode) {
            const row = e.target.closest('[data-row]');
            if (row) {
                const id = row.dataset.row;
                selected.has(id) ? selected.delete(id) : selected.add(id);
                render();
            }
        }
    }

    function open() {
        load();
        selectMode = false; selected.clear(); filter = 'all';
        ensureModal();
        modal.style.display = 'flex';
        render();
    }
    function close() {
        if (!modal) return;
        document.removeEventListener('keydown', onKey);
        modal.remove();
        modal = null;
        selectMode = false; selected.clear();
    }

    window.GameRecords = { save, open, close, list: () => load() };
})();
