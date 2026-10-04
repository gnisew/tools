// ================= 9a_batch_edit.js: 批次修改（集體替換 title / audioUrl / localFileName） =================
// 目的：在「批次轉檔工具」視窗新增「批次修改」頁籤。載入多個專案檔 (.json) 或 ZIP，
//       把每個專案的 title、audioUrl、localFileName 列成表格（或 TSV 文字），集體替換後再打包下載 ZIP。
// 設計：
//   · 表格與 TSV 文字區共用同一份資料（rows），切換檢視時自動同步。
//   · TSV 以「原始檔名」當比對鍵，不看行序，貼回時順序打亂也不會錯位。
//   · 取代工具「按下套用才生效」，不做即時預覽，避免誤改。
//   · 只改有被修改的欄位；JSON 其餘內容（句子、時間標記、mediaGroups…）原封不動。
// 相依：9_batch_converter.js（視窗與 #closeBatchConvertBtn）、JSZip、showToast、showCustomDialog。
// 載入位置：index.html 中放在 9_batch_converter.js 之後。

(function () {
    const $ = id => document.getElementById(id);
    const FIELDS = ['title', 'audioUrl', 'localFileName'];   // 會寫進 JSON 內容的欄位
    const COLS = ['name', ...FIELDS];                         // ★ 新增：表格全部欄位（name = 檔名，不寫進 JSON，只決定下載後的檔名）
    const COL_LABEL = { name: '檔名(.json)', title: '標題(title)', audioUrl: '音檔網址(audioUrl)', localFileName: '本地路徑(localFileName)' };                       // ★ 新增：表頭顯示名稱（沒列的就顯示欄位名稱本身）

    let rows = [];          
    let view = 'table';     // 'table' | 'tsv'
    let tsvDirty = false;
    let tsvBase = '';       // 文字區「未被使用者改動」時的內容，用來判斷有沒有變更
    let nextId = 1;
    let loadState = { skipped: 0, tip: '', failed: false };   // ★ 新增：載入結果（顯示在頂部狀態文字，不再跳視窗）

    const modal = $('batchConvertModal');
    const tabConvert = $('batchTabConvert'), tabEdit = $('batchTabEdit');
    const paneConvert = $('batchPaneConvert'), paneEdit = $('batchPaneEdit');
    if (!modal || !tabConvert || !tabEdit || !paneEdit) return;

    const toast = (m, t) => { if (typeof showToast === 'function') showToast(m, t); };
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const cleanCell = v => String(v == null ? '' : v).replace(/[\t\r\n]+/g, ' ');
    const rowById = id => rows.find(r => r.id === id);
    const isChanged = (r, f) => r.cur[f] !== r.orig[f];
    const rowHasChange = r => COLS.some(f => isChanged(r, f));   // ★ 修改：FIELDS → COLS（檔名變更也算修改）

    // ★ 新增：檔名處理（.json 不顯示、不可修改，下載時一律自動補上）
    const stripJson = v => cleanCell(v).replace(/\.json$/i, '');            // 使用者貼上或輸入了 .json 就自動拿掉
    const safeName = v => stripJson(v)
        .replace(/\\/g, '/').replace(/[:*?"<>|\x00-\x1f]/g, '')           // 去掉檔名不能用的字元
        .replace(/\/{2,}/g, '/').trim().replace(/^\/+|\/+$/g, '').trim();
    // 下載後的實際路徑：沒改名就用原本路徑；改成空白則沿用原本路徑
    function finalPath(r) {
        if (r.cur.name === r.orig.name) return r.path;
        const n = safeName(r.cur.name);
        return n ? n + '.json' : r.path;
    }

    // ================= 頁籤切換 =================
    function switchTab(which) {
        const edit = which === 'edit';
        tabConvert.classList.toggle('active', !edit);
        tabEdit.classList.toggle('active', edit);
        paneConvert.style.display = edit ? 'none' : '';
        paneEdit.style.display = edit ? '' : 'none';
        modal.classList.toggle('be-wide', edit);
    }
    tabConvert.addEventListener('click', () => switchTab('convert'));
    tabEdit.addEventListener('click', () => switchTab('edit'));
    $('batchEditCloseBtn')?.addEventListener('click', () => $('closeBatchConvertBtn')?.click());

    // ================= 載入檔案 =================
    $('batchEditInput')?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const run = () => loadFiles(files);
        if (rows.some(rowHasChange) && typeof showCustomDialog === 'function') {
            showCustomDialog({
                title: '重新載入確認',
                message: '目前表格有尚未下載的修改，重新載入將<span style="color:#C62828; font-weight:bold;">放棄這些修改</span>，確定要繼續嗎？',
                onConfirm: run,
                onCancel: () => { e.target.value = ''; }
            });
        } else run();
    });

    async function loadFiles(files) {
        if (typeof JSZip === 'undefined' && files.some(f => /\.zip$/i.test(f.name))) {
            return toast('缺少 JSZip 套件，無法處理壓縮檔', 'error');
        }
        const newRows = [];
        const skipped = [];
        const usedKeys = new Set();

        const addJson = (text, display, path) => {
            let data;
            try { data = JSON.parse(String(text).replace(/^\uFEFF/, '')); }
            catch (err) { skipped.push(`${display}（JSON 格式錯誤）`); return; }
            const ok = data && typeof data === 'object' && !Array.isArray(data)
                && (FIELDS.some(f => f in data) || 'allLabelsOrdered' in data);
            if (!ok) { skipped.push(`${display}（不是專案檔）`); return; }
            let key = display, n = 2;
            while (usedKeys.has(key)) key = `${display} #${n++}`; // 原始檔名重複時加編號，確保 TSV 比對鍵唯一
            usedKeys.add(key);
            const orig = {};
            FIELDS.forEach(f => { orig[f] = data[f] == null ? '' : String(data[f]); });
            orig.name = String(path).replace(/\.json$/i, '');   // ★ 新增：檔名（不含 .json）
            newRows.push({ id: nextId++, key, path, data, orig, cur: { ...orig } });
        };

        try {
            for (const file of files) {
                const ext = file.name.split('.').pop().toLowerCase();
                if (ext === 'json') {
                    addJson(await file.text(), file.name, file.name);
                } else if (ext === 'zip') {
                    const zip = await new JSZip().loadAsync(file);
                    for (const [path, entry] of Object.entries(zip.files)) {
                        if (entry.dir || path.includes('__MACOSX') || !/\.json$/i.test(path)) continue;
                        addJson(await entry.async('string'), `${file.name}/${path}`, path);
                    }
                }
            }
        } catch (err) {
            console.error(err);
            return toast('讀取檔案時發生錯誤', 'error');
        }

        rows = newRows;
        tsvDirty = false;
        // ★ 修改：略過的檔案不再跳視窗，改記在狀態文字（滑鼠移上去可看清單）
        loadState = { skipped: skipped.length, tip: skipped.join('\n'), failed: !rows.length };
        afterDataChange();
    }

    // ================= 畫面渲染 =================
    function afterDataChange() {
        if (view === 'table') renderTable();
        else { $('batchEditTsv').value = tsvBase = toTsv(); tsvDirty = false; }
        updateApplyBtn();
        refreshStates();
    }

    function renderTable() {
        const wrap = $('batchEditTableWrap');
        if (!rows.length) { wrap.innerHTML = '<div class="be-empty">尚未載入檔案</div>'; return; }
        let html = '<table class="be-table"><thead><tr>'
            + '<th class="be-c-no">#</th>'
            + COLS.map(f => `<th class="be-th-f" data-f="${f}" title="點擊選取整欄（可貼上 Excel 資料）">${COL_LABEL[f] || f}</th>`).join('') + '</tr></thead><tbody>'; // ★ 修改：原始檔名欄併入 COLS，可編輯
        rows.forEach((r, i) => {
            html += `<tr data-id="${r.id}">`
                + `<td class="be-c-no">${i + 1}</td>`
                + COLS.map(f => `<td class="be-cell${f === 'name' ? ' be-name-cell' : ''}" data-f="${f}"><div class="be-cellwrap">`
                    + `<input type="text" data-f="${f}" value="${esc(r.cur[f])}" spellcheck="false">`
                    + '</div></td>').join('')
                + '</tr>';
        });
        wrap.innerHTML = html + '</tbody></table>';
    }

    // 更新「已修改」標示與頂部狀態文字（不重繪表格，輸入時不會失焦）
    // ★ 簡化：移除「重複」「音檔欄位皆為空」等警告與 ⚠ 標示
    function refreshStates() {
        let changedCells = 0;
        const wrap = $('batchEditTableWrap');
        rows.forEach(r => {
            const tr = wrap.querySelector(`tr[data-id="${r.id}"]`);
            COLS.forEach(f => {
                const changed = isChanged(r, f);
                if (changed) changedCells++;
                const td = tr?.querySelector(`td.be-cell[data-f="${f}"]`);
                if (td) {
                    td.classList.toggle('changed', changed);
                    td.classList.toggle('sel', !!selCell && selCell.id === r.id && selCell.f === f);
                    td.classList.toggle('colsel', selCol === f);
                    td.title = f === 'name' ? '原始檔名：' + r.key : '';
                }
            });
        });
        wrap.querySelectorAll('th.be-th-f').forEach(th => th.classList.toggle('colsel', th.dataset.f === selCol));
        updateRevertBtn();

        // 按鈕狀態：沒東西可做時直接反灰，不再用提示訊息告知
        const has = rows.length > 0;
        const onlyChanged = !!$('batchEditOnlyChanged')?.checked;
        if ($('batchEditClearBtn')) $('batchEditClearBtn').disabled = !has;
        if ($('batchEditResetBtn')) $('batchEditResetBtn').disabled = !changedCells;
        if ($('batchEditDownloadBtn')) $('batchEditDownloadBtn').disabled = !has || (onlyChanged && !changedCells);

        // 頂部單一狀態文字：「已載入 N 個專案檔 · 已修改 M 格」
        const info = $('batchEditLoadInfo');
        if (info) {
            info.textContent = !has
                ? (loadState.failed ? '沒有可用的專案檔' : '選擇專案檔 (.json) 或 ZIP（可多選）')
                : `已載入 ${rows.length} 個專案檔`
                    + (loadState.skipped ? `，略過 ${loadState.skipped} 個` : '')
                    + (changedCells ? ` · 已修改 ${changedCells} 格` : '');
            info.title = loadState.skipped ? '已略過：\n' + loadState.tip : '';
        }
    }

    // ================= 目前選取的格子（供「還原此格」使用） =================
    let selCell = null; // { id, f }
    let selCol = null;  // ★ 新增：目前選取的整欄（欄位名稱，例如 'title'），沒選取時為 null
    function updateRevertBtn() {
        const btn = $('batchEditRevertCellBtn');
        if (!btn) return;
        // ★ 新增：整欄選取時，按鈕變成「還原此欄」
        if (selCol) {
            btn.textContent = '還原此欄';
            btn.title = '還原選取的整欄';
            btn.disabled = !(view === 'table' && rows.some(r => isChanged(r, selCol)));
            return;
        }
        btn.textContent = '還原此格';
        btn.title = '還原最後點擊的那一格';
        const r = selCell && rowById(selCell.id);
        btn.disabled = !(view === 'table' && r && isChanged(r, selCell.f));
    }

    // ================= 表格事件（事件委派） =================
    const tableWrap = $('batchEditTableWrap');
    tableWrap.addEventListener('input', (e) => {
        const inp = e.target.closest('input[data-f]');
        if (!inp) return;
        const r = rowById(Number(inp.closest('tr').dataset.id));
        if (!r) return;
        r.cur[inp.dataset.f] = inp.value;
        refreshStates();
    });
    // ★ 新增：檔名欄輸入完成（離開格子）時，自動拿掉使用者多打的 .json
    tableWrap.addEventListener('change', (e) => {
        const inp = e.target.closest('input[data-f="name"]');
        if (!inp) return;
        const r = rowById(Number(inp.closest('tr').dataset.id));
        if (!r) return;
        const v = stripJson(inp.value);
        if (v !== inp.value) { inp.value = v; r.cur.name = v; refreshStates(); }
    });
    tableWrap.addEventListener('focusin', (e) => {
        const inp = e.target.closest('input[data-f]');
        if (!inp) return;
        selCell = { id: Number(inp.closest('tr').dataset.id), f: inp.dataset.f };
        selCol = null; // ★ 新增：點進任一格就取消整欄選取
        refreshStates();
    });
    $('batchEditRevertCellBtn')?.addEventListener('click', () => {
        // ★ 新增：整欄還原
        if (selCol) {
            rows.forEach(r => { r.cur[selCol] = r.orig[selCol]; });
            afterDataChange();
            return;
        }
        const r = selCell && rowById(selCell.id);
        if (!r || !isChanged(r, selCell.f)) return;
        r.cur[selCell.f] = r.orig[selCell.f];
        const inp = tableWrap.querySelector(`tr[data-id="${r.id}"] input[data-f="${selCell.f}"]`);
        if (inp) { inp.value = r.orig[selCell.f]; inp.focus(); }
        refreshStates();
    });
    // ================= ★ 新增：選取整欄、貼上 Excel 資料、複製整欄 ★ =================
    // 點表頭選取整欄（再點一次取消）；選取後按 Ctrl+V 從第 1 列開始往下填，Ctrl+C 複製整欄。
    tableWrap.addEventListener('click', (e) => {
        const th = e.target.closest('th.be-th-f');
        if (!th) return;
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        selCol = (selCol === th.dataset.f) ? null : th.dataset.f;
        selCell = null;
        refreshStates();
    });

    // 解析剪貼簿文字（Excel 格式：欄以 Tab 分隔、列以換行分隔；含換行或引號的儲存格會被雙引號包起來）
    function parseClipboardGrid(text) {
        const out = [];
        let row = [], cell = '', inQ = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (inQ) {
                if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
                else cell += c;
            } else if (c === '"' && cell === '') inQ = true;
            else if (c === '\t') { row.push(cell); cell = ''; }
            else if (c === '\n' || c === '\r') {
                if (c === '\r' && text[i + 1] === '\n') i++;
                row.push(cell); cell = ''; out.push(row); row = [];
            } else cell += c;
        }
        if (cell !== '' || row.length) { row.push(cell); out.push(row); }
        return out;
    }

    const editActive = () => view === 'table' && paneEdit.getClientRects().length > 0;

    document.addEventListener('paste', (e) => {
        if (!editActive() || !rows.length) return;
        const ae = document.activeElement;
        const inInput = !!(ae && ae.matches && ae.matches('input[data-f]') && tableWrap.contains(ae));
        if (!inInput && !selCol) return;
        const text = (e.clipboardData || window.clipboardData).getData('text');
        if (!text) return;
        const grid = parseClipboardGrid(text);
        if (!grid.length) return;
        const single = grid.length === 1 && grid[0].length === 1;
        if (inInput && single) return; // 單一儲存格：維持瀏覽器原本的貼上行為
        e.preventDefault();

        // 單一值 + 整欄選取：整欄填入同一個值（與 Excel 相同）
        if (single && selCol) {
            const v = selCol === 'name' ? stripJson(grid[0][0]) : cleanCell(grid[0][0]);   // ★ 修改
            rows.forEach(r => { r.cur[selCol] = v; });
            afterDataChange();
            return;
        }

        let startRow, startCol;
        if (selCol) { startRow = 0; startCol = COLS.indexOf(selCol); }
        else {
            const id = Number(ae.closest('tr').dataset.id);
            startRow = rows.findIndex(r => r.id === id);
            startCol = COLS.indexOf(ae.dataset.f);
        }
        // 超出檔案數量的列、超出欄數的格子直接略過（不再跳提示）
        grid.forEach((line, i) => {
            const r = rows[startRow + i];
            if (!r) return;
            line.forEach((v, j) => {
                const f = COLS[startCol + j];
                if (!f) return;
                r.cur[f] = f === 'name' ? stripJson(v) : cleanCell(v);
            });
        });
        afterDataChange();
    });

    // ★ 新增：選取整欄後按 Delete / Backspace 清空該欄（檔名欄不能留空，改為還原成原本檔名）
    document.addEventListener('keydown', (e) => {
        if ((e.key !== 'Delete' && e.key !== 'Backspace') || !editActive() || !selCol || !rows.length) return;
        const ae = document.activeElement;
        if (ae && (/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) || ae.isContentEditable)) return; // 正在輸入時維持原本的刪字行為
        e.preventDefault();
        rows.forEach(r => { r.cur[selCol] = selCol === 'name' ? r.orig.name : ''; });
        afterDataChange();
    });

    document.addEventListener('copy', (e) => {
        if (!editActive() || !selCol || !rows.length) return;
        e.clipboardData.setData('text/plain', rows.map(r => cleanCell(r.cur[selCol])).join('\n'));
        e.preventDefault();
    });

    // ================= TSV 文字區 =================
    function toTsv() {
        if (!rows.length) return '';   // ★ 新增：沒資料時不輸出標題列
        // ★ 修改：最後多一欄「新檔名」（放最後面，舊版匯出的 TSV 貼回來時欄位位置不會錯位）
        const lines = [['原始檔名', ...FIELDS, '新檔名'].join('\t')];
        rows.forEach(r => lines.push([cleanCell(r.key), ...FIELDS.map(f => cleanCell(r.cur[f])), cleanCell(r.cur.name)].join('\t')));
        return lines.join('\n');
    }

    // 把 TSV 文字依「原始檔名」比對回 rows；缺少的欄位視為不修改
    function fromTsv() {
        const byKey = new Map(rows.map(r => [cleanCell(r.key), r]));
        const unmatched = [];
        let matched = 0, changed = 0;
        $('batchEditTsv').value.split('\n').forEach((raw) => {
            const line = raw.replace(/\r$/, '');
            if (!line.trim()) return;
            const parts = line.split('\t');
            const key = parts[0].trim();
            if (key === '原始檔名') return; // 標題列（即使行順序被打亂也略過）
            const r = byKey.get(key);
            if (!r) { unmatched.push(key || '(空白)'); return; }
            matched++;
            FIELDS.forEach((f, i) => {
                const v = parts[i + 1];
                if (v === undefined) return;
                if (v !== cleanCell(r.cur[f])) { r.cur[f] = v; changed++; }
            });
            // ★ 新增：最後一欄「新檔名」
            const nv = parts[FIELDS.length + 1];
            if (nv !== undefined && nv.trim() !== '' && stripJson(nv) !== r.cur.name) { r.cur.name = stripJson(nv); changed++; }
        });
        tsvDirty = false;
        // ★ 簡化：只有「找不到對應檔案」才提示一句，不再跳視窗、不再顯示成功訊息
        if (unmatched.length) toast(`有 ${unmatched.length} 行找不到對應的原始檔名，已略過`, 'error');
    }
    function syncFromTsvIfDirty() { if (view === 'tsv' && tsvDirty) fromTsv(); }

    // 「套用」按鈕：文字內容沒有變更時不可點
    function updateApplyBtn() {
        const btn = $('batchEditApplyTsvBtn');
        if (btn) btn.disabled = $('batchEditTsv').value === tsvBase;
    }
    $('batchEditTsv')?.addEventListener('input', () => {
        tsvDirty = $('batchEditTsv').value !== tsvBase;
        updateApplyBtn();
    });
    $('batchEditApplyTsvBtn')?.addEventListener('click', () => { fromTsv(); afterDataChange(); });
    $('batchEditCopyTsv')?.addEventListener('click', async () => {
        syncFromTsvIfDirty();
        const text = toTsv();
        try { await navigator.clipboard.writeText(text); toast('已複製 TSV，可貼到試算表', 'success'); }
        catch (err) { $('batchEditTsv').select(); toast('無法自動複製，請手動按 Ctrl+C', 'error'); }
    });

    // ================= 檢視切換 =================
    function setView(v) {
        if (v === view) return;
        syncFromTsvIfDirty();
        view = v;
        $('batchEditViewTable').classList.toggle('active', v === 'table');
        $('batchEditViewTsv').classList.toggle('active', v === 'tsv');
        tableWrap.style.display = v === 'table' ? '' : 'none';
        $('batchEditTsvWrap').style.display = v === 'tsv' ? '' : 'none';
        afterDataChange();
    }
    $('batchEditViewTable')?.addEventListener('click', () => setView('table'));
    $('batchEditViewTsv')?.addEventListener('click', () => setView('tsv'));

    // ================= 全部還原 =================
    $('batchEditResetBtn')?.addEventListener('click', () => {
        syncFromTsvIfDirty();
        rows.forEach(r => { r.cur = { ...r.orig }; });   // ★ 簡化：不再跳確認視窗與提示
        afterDataChange();
    });

    // ================= ★ 新增：清除（清空已載入的資料） ★ =================
    $('batchEditClearBtn')?.addEventListener('click', () => {
        rows = [];
        selCell = null;
        selCol = null;
        tsvDirty = false;
        loadState = { skipped: 0, tip: '', failed: false };
        const input = $('batchEditInput');
        if (input) input.value = '';              // 讓同一個檔案可以再次選取
        afterDataChange();                        // ★ 簡化：不再跳確認視窗與提示
    });

    // ================= 下載修改後 ZIP =================
    function triggerDownload(blob, name) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none'; a.href = url; a.download = name;
        document.body.appendChild(a); a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    }

    async function doDownload(list) {
        const zip = new JSZip();
        const used = new Set();
        list.forEach(r => {
            const out = { ...r.data };                       // 其餘欄位原封不動
            FIELDS.forEach(f => { if (isChanged(r, f)) out[f] = r.cur[f]; }); // 只寫入有改的欄位
            let path = finalPath(r), n = 2;   // ★ 修改：r.path → finalPath(r)（套用新檔名，並自動補上 .json）
            const dot = path.lastIndexOf('.');
            const base = dot > path.lastIndexOf('/') ? path.slice(0, dot) : path;
            const ext = dot > path.lastIndexOf('/') ? path.slice(dot) : '';
            while (used.has(path.toLowerCase())) path = `${base}(${n++})${ext}`;
            used.add(path.toLowerCase());
            zip.file(path, JSON.stringify(out, null, 2));
        });
        const blob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(blob, `批次修改結果_${Date.now()}.zip`);
    }

    $('batchEditDownloadBtn')?.addEventListener('click', () => {
        syncFromTsvIfDirty();
        if (typeof JSZip === 'undefined') return toast('缺少 JSZip 套件，無法打包', 'error');
        afterDataChange();
        const list = $('batchEditOnlyChanged')?.checked ? rows.filter(rowHasChange) : rows;
        if (!list.length) return;
        // ★ 簡化：移除「有欄位被清空」確認視窗；沒東西可下載時按鈕本身會反灰
        doDownload(list).catch(err => { console.error(err); toast('打包過程中發生錯誤', 'error'); });
    });
    $('batchEditOnlyChanged')?.addEventListener('change', refreshStates);
})();
