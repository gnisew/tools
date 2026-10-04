// ================= 4i_ui_media_groups.js: 跨句圖片群組（mediaGroups）管理 UI =================
// 階段四：拿掉獨立的「新增群組」表單區塊，改為「清單即表單」——
//   每一列（無論是已建立的群組，還是尚未填時間的空白草稿列）都用同一套欄位：
//   開始/結束秒數（旁邊各有一顆抓取目前播放位置的圓鈕）、備註、圖片網址。
//   欄位失焦（focusout）時自動判斷存檔，不再需要「建立群組／套用範圍／套用網址」
//   這幾顆按鈕。清單一律依開始時間排序，尚未填時間的空白草稿列固定排在最後面，
//   按最下方「+ 新增群組」可以再生出下一張空白列。
// 資料層（mediaGroups 陣列的存取函式）在 3a_media_groups_core.js。
//
// ★ 草稿（draft）機制：
//   還沒有正式時間區間的空白列，只存在這個檔案的 mgDrafts 陣列裡（id 開頭是
//   'draft-'），不會寫進 mediaGroups、也不會存進 localStorage。使用者一旦把
//   開始/結束時間都填成合法區間（結束 > 開始），這一列就會「升級」成正式群組
//   （呼叫 createMediaGroup 拿到 id 開頭 'grp-' 的正式記錄），並從草稿陣列移除。
//   重新整理頁面後，尚未升級的空白草稿列會消失（本來就沒東西可保留），
//   但已經升級的正式群組完全不受影響。
//
// ★ 圖片改用網址參照（見 3a_media_groups_core.js 開頭說明），不再依賴 IndexedDB，
//   所以這裡完全不用等待非同步讀檔，畫面可以同步渲染完成。
//
// 需求：需在 1_globals.js、3a_media_groups_core.js 之後載入，
//       且 index.html 需有 #mediaGroupsView、#mediaGroupsListContainer、
//       #mgAddGroupBtn，以及「檢視」選單裡的 #toggleMediaGroupsViewBtn。

// ================= ★ 小工具 ★ =================

// 屬性值（value="..."）專用的逃逸函式：escapeHtml()（見 4f_ui_import_search.js）
// 沒有處理雙引號，直接塞進 value 屬性可能被使用者輸入的 " 提早截斷，這裡另外處理。
function mgEscapeAttr(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// 時間格式：固定「兩位數分:兩位數秒」（例如 00:05、02:14），跟全域 formatTime()
// 的「m:ss」（不補零分鐘）不同——這裡刻意獨立一份，才不會動到其他地方的時間顯示。
function mgFormatTime(seconds) {
    if (!isFinite(seconds)) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// 群組時間範圍的顯示文字，例如「00:12 ~ 00:45」
function mgRangeLabel(startTime, endTime) {
    return `${mgFormatTime(startTime)} ~ ${mgFormatTime(endTime)}`;
}

// 跳到指定時間（沿用既有的聲波圖/audio 跳轉邏輯，跟大編輯框行號點擊一致）
function mgJumpTo(startTime) {
    if (typeof wavesurfer !== 'undefined' && wavesurfer) {
        wavesurfer.setTime(startTime);
    } else if (typeof audioPlayer !== 'undefined' && audioPlayer) {
        audioPlayer.currentTime = startTime;
    }
    if (typeof snapWaveformToTop === 'function') {
        setTimeout(snapWaveformToTop, 50);
    }
}

// 放大檢視縮圖：獨立的極簡遮罩+大圖 viewer（跟 showCustomDialog 是不同的元件——
// showCustomDialog 固定會有標題/確定/取消按鈕，不適合單純「看一張圖」的用途）。
// 點遮罩本身或按 Esc 都能關閉。
function mgOpenLightbox(url) {
    const overlay = document.getElementById('mgImageLightbox');
    const img = document.getElementById('mgImageLightboxImg');
    if (!overlay || !img) return;
    img.src = url;
    overlay.style.display = 'flex';
}

function mgCloseLightbox() {
    const overlay = document.getElementById('mgImageLightbox');
    const img = document.getElementById('mgImageLightboxImg');
    if (overlay) overlay.style.display = 'none';
    if (img) img.src = '';
}

document.getElementById('mgImageLightbox')?.addEventListener('click', mgCloseLightbox);
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') mgCloseLightbox();
});

// 產生草稿列的本地 id（開頭固定為 'draft-'，跟正式群組的 'grp-' 區分）
function mgCreateDraftId() {
    return 'draft-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function mgNewDraft() {
    return { id: mgCreateDraftId(), startTime: '', endTime: '', note: '', imageUrl: '' };
}

// ================= ★ 草稿狀態（尚未升級成正式群組的空白列） ★ =================

let mgDrafts = [];

// 只在「整個功能第一次被打開、而且完全沒有任何資料」時，自動送一張空白草稿列
// 讓使用者能馬上開始填——之後不管使用者刪掉幾筆、清空到剩 0 筆，都不會再自動
// 補列，一律要靠使用者自己按「+ 新增群組」。用 mgStarterDraftGiven 這個旗標
// 確保這個「自動給第一列」的行為這個分頁只會發生一次。
let mgStarterDraftGiven = false;

function mgMaybeSeedStarterDraft() {
    if (mgStarterDraftGiven) return;
    mgStarterDraftGiven = true;
    const groups = (typeof getSortedMediaGroups === 'function') ? getSortedMediaGroups() : [];
    if (groups.length + mgDrafts.length === 0) {
        mgDrafts.push(mgNewDraft());
    }
}

// ================= ★ 清單渲染 ★ =================

// item 可能是正式群組（來自 mediaGroups，id 開頭 'grp-'）或草稿列（id 開頭 'draft-'）。
// 兩者共用同一套欄位版面，差別只在草稿列的 startTime/endTime 可能是空字串 ''（尚未填）。
// orderNum：依開始時間排序後的第幾個正式群組（從 1 開始），草稿列固定傳 null 不編號。
function buildMediaGroupRowHtml(item, orderNum) {
    const hasStart = item.startTime !== '' && item.startTime !== null && isFinite(item.startTime);
    const hasEnd = item.endTime !== '' && item.endTime !== null && isFinite(item.endTime);
    const hasImage = !!(item.imageUrl && String(item.imageUrl).trim());

    // 縮圖：有網址就直接嘗試載入，失敗（網址失效/跨網域擋掉）就 onerror 換回預設圖示。
    // 有圖時縮圖可點放大檢視（不是跳轉——跳轉改成點時間輸入框處理，見下方）。
    const thumbHtml = hasImage
        ? `<img src="${mgEscapeAttr(item.imageUrl)}" alt="群組圖片" style="width:100%; height:100%; object-fit:cover;" onerror="this.parentElement.innerHTML='<span class=\\'material-icons\\' style=\\'font-size:28px;color:#EF5350;\\'>broken_image</span>';">`
        : `<span class="material-icons" style="font-size:28px;">image</span>`;
    const thumbClass = hasImage ? 'mg-thumb mg-thumb-viewable' : 'mg-thumb';
    const thumbTitle = hasImage ? ' title="點擊放大檢視"' : '';

    // 排序編號：疊在縮圖左上角的小圓形徽章，只有正式群組才有（依目前開始時間排序後的順序）
    const badgeHtml = (orderNum !== null && orderNum !== undefined)
        ? `<span class="mg-order-badge">${orderNum}</span>`
        : '';

    const hasRange = hasStart && hasEnd;
    // 還沒填時間時，用淡灰色的「＿＿:＿＿ ~ ＿＿:＿＿」佔位樣式，而不是完全空白，
    // 讓使用者一眼看出「這裡等一下會顯示分:秒」。填完之後變深色實際數值。
    const rangeText = hasRange ? mgRangeLabel(item.startTime, item.endTime) : '__:__ ~ __:__';
    const rangeColor = hasRange ? '#666' : '#bbb';
    const startVal = hasStart ? Number(item.startTime).toFixed(1) : '';
    const endVal = hasEnd ? Number(item.endTime).toFixed(1) : '';

    // 精簡版版面：縮圖 + 兩行內容（第一行：時間／分秒顯示／刪除；第二行：備註／圖片網址／清除圖片）。
    // 「跳至此處」不再是獨立按鈕或縮圖點擊，改成直接點「開始(秒)」/「結束(秒)」輸入框本身：
    // 點開頭就跳到開頭、點結尾就跳到結尾，跟編輯欄位是同一個動作，不需要額外元件。
    return `
    <div class="mg-row" data-id="${item.id}" style="position:relative; display:flex; gap:10px; align-items:flex-start; padding:12px 44px 12px 12px; border:1px solid #EEE; border-radius:8px; margin-bottom:10px; background:#FAFAFA;">
        <div class="${thumbClass}"${thumbTitle} style="position:relative; width:64px; height:64px; flex-shrink:0; border-radius:6px; overflow:hidden; background:#E0E0E0; display:flex; align-items:center; justify-content:center; color:#9E9E9E;">
            ${thumbHtml}
            ${badgeHtml}
        </div>
        <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px; flex-wrap:wrap;">
                <input type="number" class="mg-start-input" value="${startVal}" placeholder="開始(秒)" step="0.1" min="0" title="點擊跳至開頭" style="width:80px; padding:4px; border:1px solid #ccc; border-radius:4px; font-size:0.85rem;">
                <button class="mg-grab-start-btn mg-grab-time-btn" type="button" title="抓取目前播放位置"><span class="material-icons">add_alarm</span></button>
                <span style="color:#999;">~</span>
                <input type="number" class="mg-end-input" value="${endVal}" placeholder="結束(秒)" step="0.1" min="0" title="點擊跳至結尾" style="width:80px; padding:4px; border:1px solid #ccc; border-radius:4px; font-size:0.85rem;">
                <button class="mg-grab-end-btn mg-grab-time-btn" type="button" title="抓取目前播放位置"><span class="material-icons">add_alarm</span></button>
                <span class="mg-range-text" style="font-size:0.8rem; color:${rangeColor}; white-space:nowrap;">${rangeText}</span>
            </div>
            <div style="display:flex; gap:6px; align-items:center;">
                <input type="text" class="mg-note-input" placeholder="備註（選填，例如：第一幕：森林）" value="${mgEscapeAttr(item.note)}" style="flex:1 1 45%; min-width:100px; box-sizing:border-box; padding:6px; border:1px solid #ddd; border-radius:4px; font-size:0.85rem;">
                <input type="text" class="mg-image-url-input" placeholder="圖片網址（絕對網址或相對路徑）" value="${mgEscapeAttr(item.imageUrl)}" style="flex:1 1 55%; min-width:140px; box-sizing:border-box; padding:6px; border:1px solid #ddd; border-radius:4px; font-size:0.85rem;">
            </div>
        </div>
        <div class="mg-row-actions" style="position:absolute; top:0; right:0; bottom:0; width:44px; box-sizing:border-box; padding:12px 8px; display:flex; flex-direction:column; align-items:center; justify-content:space-between;">
            <button class="mg-delete-btn mg-delete-icon-btn" type="button" title="刪除群組"><span class="material-icons">delete</span></button>
            <button class="mg-clear-image-btn mg-clear-btn" type="button" title="清除圖片" style="${hasImage ? '' : 'visibility:hidden;'}"><span class="material-icons">close</span></button>
        </div>
    </div>`;
}

function renderMediaGroupsList() {
    const container = document.getElementById('mediaGroupsListContainer');
    const emptyHint = document.getElementById('mgEmptyHint');
    if (!container) return;

    const groups = (typeof getSortedMediaGroups === 'function') ? getSortedMediaGroups() : [];

    if (groups.length + mgDrafts.length === 0) {
        container.innerHTML = '';
        if (emptyHint) emptyHint.style.display = 'block';
        return;
    }
    if (emptyHint) emptyHint.style.display = 'none';

    // 正式群組（依開始時間排序）在前，編號 1、2、3...跟著這個順序走；
    // 尚未填時間的空白草稿列固定排在最後面、不編號，依建立先後排列。
    const html = groups.map((g, i) => buildMediaGroupRowHtml(g, i + 1)).join('')
        + mgDrafts.map(d => buildMediaGroupRowHtml(d, null)).join('');
    container.innerHTML = html;
    // ★ 列表被重建，搜尋面板開著時要重掃並補畫高亮
    if (typeof mgSearchRefreshIfOpen === 'function') mgSearchRefreshIfOpen();
}

// ================= ★ 欄位自動存檔核心 ★ =================

// 讀取某一列目前畫面上的欄位值，判斷要：
//   1. 草稿列：時間區間一旦合法就升級成正式群組（createMediaGroup），
//      否則只把目前輸入暫存在 mgDrafts，不落地存檔。
//   2. 正式群組：只有值真的改變時才呼叫對應的更新函式並重新整頁渲染
//      （重新渲染才會套用最新排序；沒有變動就不重繪，避免使用者編輯到一半被打斷）。
function mgProcessRow(row) {
    if (!row) return;
    const id = row.dataset.id;
    const isDraft = id.startsWith('draft-');

    const startInput = row.querySelector('.mg-start-input');
    const endInput = row.querySelector('.mg-end-input');
    const startRaw = startInput?.value ?? '';
    const endRaw = endInput?.value ?? '';
    const note = row.querySelector('.mg-note-input')?.value || '';
    const imageUrl = row.querySelector('.mg-image-url-input')?.value || '';

    const bothFilled = startRaw !== '' && endRaw !== '';
    const s = bothFilled ? parseFloat(startRaw) : NaN;
    const en = bothFilled ? parseFloat(endRaw) : NaN;
    const rangeValid = bothFilled && isFinite(s) && isFinite(en) && en > s;

    // 只有兩個欄位都填了、但區間不合法（結束 <= 開始）時才標紅提示；
    // 還沒填完（例如只填了開始）不算錯誤，不要一直閃紅框干擾輸入。
    const showError = bothFilled && !rangeValid;
    startInput?.classList.toggle('mg-input-error', showError);
    endInput?.classList.toggle('mg-input-error', showError);
    if (showError) {
        showToast('時間區間不合法（結束時間必須大於開始時間）', 'error');
    }

    if (isDraft) {
        const draft = mgDrafts.find(d => d.id === id);
        if (!draft) return;
        draft.note = note;
        draft.imageUrl = imageUrl;
        if (!bothFilled) {
            // 使用者可能還在填、或清空了其中一格：暫存目前值，不升級也不重繪
            draft.startTime = startRaw === '' ? '' : draft.startTime;
            draft.endTime = endRaw === '' ? '' : draft.endTime;
            return;
        }
        if (!rangeValid) return; // 兩格都填了但不合法，先不升級，等使用者修正

        // 時間合法：升級成正式群組
        const record = createMediaGroup(s, en, note);
        if (!record) return;
        if (imageUrl.trim()) setMediaGroupImageUrl(record.id, imageUrl);
        mgDrafts = mgDrafts.filter(d => d.id !== id);
        showToast('已建立群組', 'success');
        renderMediaGroupsList();
        return;
    }

    // 正式群組：只在真的有變動時才寫入＋重繪
    const g = findMediaGroupById(id);
    if (!g) return;
    let changed = false;
    if (rangeValid && (g.startTime !== s || g.endTime !== en)) {
        updateMediaGroupRange(id, s, en);
        changed = true;
    }
    if (g.note !== note) {
        updateMediaGroupNote(id, note);
        changed = true;
    }
    if ((g.imageUrl || '') !== imageUrl) {
        setMediaGroupImageUrl(id, imageUrl);
        changed = true;
    }
    if (changed) renderMediaGroupsList();
}

// ================= ★ 清單內的操作（事件委派，只需綁定一次） ★ =================

const mgListContainer = document.getElementById('mediaGroupsListContainer');

// 欄位失焦（不管是開始/結束/備註/圖片網址）就交給 mgProcessRow 判斷是否存檔。
// 用 focusout（會冒泡）而不是 blur，才能用事件委派一次綁定整個容器。
mgListContainer?.addEventListener('focusout', (e) => {
    if (!e.target.matches('.mg-start-input, .mg-end-input, .mg-note-input, .mg-image-url-input')) return;
    mgProcessRow(e.target.closest('.mg-row'));
});

// 在這幾個欄位按 Enter，等同直接離開欄位（觸發上面的 focusout 自動存檔)
mgListContainer?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('.mg-start-input, .mg-end-input, .mg-note-input, .mg-image-url-input')) {
        e.preventDefault();
        e.target.blur();
    }
});

mgListContainer?.addEventListener('click', (e) => {
    const row = e.target.closest('.mg-row');
    if (!row) return;
    const id = row.dataset.id;
    const isDraft = id.startsWith('draft-');

    // 1. 抓取目前播放位置到開始/結束欄位
    if (e.target.closest('.mg-grab-start-btn') || e.target.closest('.mg-grab-end-btn')) {
        const targetInput = e.target.closest('.mg-grab-start-btn')
            ? row.querySelector('.mg-start-input')
            : row.querySelector('.mg-end-input');
        if (!targetInput) return;
        if (typeof audioPlayer === 'undefined' || !audioPlayer || isNaN(audioPlayer.currentTime)) {
            showToast('目前沒有可抓取的播放位置，請先選擇音檔', 'error');
            return;
        }
        targetInput.value = audioPlayer.currentTime.toFixed(1);
        mgProcessRow(row);
        return;
    }

    // 2. 點縮圖＝放大檢視圖片（不跳轉——跳轉改成點開始/結束輸入框，見下方 focus 委派）
    if (e.target.closest('.mg-thumb-viewable')) {
        const url = row.querySelector('.mg-image-url-input')?.value || '';
        if (url.trim()) mgOpenLightbox(url.trim());
        return;
    }

    // 2b. 點「開始(秒)」/「結束(秒)」輸入框＝跳至對應時間（單純點擊、不影響照常編輯數字）
    if (e.target.matches('.mg-start-input') || e.target.matches('.mg-end-input')) {
        const val = parseFloat(e.target.value);
        if (isFinite(val)) mgJumpTo(val);
        return;
    }

    // 3. 清除圖片網址（保留群組本身／草稿列）
    if (e.target.closest('.mg-clear-image-btn')) {
        const urlInput = row.querySelector('.mg-image-url-input');
        if (urlInput) urlInput.value = '';
        if (isDraft) {
            const draft = mgDrafts.find(d => d.id === id);
            if (draft) draft.imageUrl = '';
            e.target.closest('.mg-clear-image-btn').style.visibility = 'hidden';
        } else {
            if (clearMediaGroupImage(id)) {
                showToast('已清除圖片', 'success');
                renderMediaGroupsList();
            }
        }
        return;
    }

    // 4. 刪除整列（草稿列直接移除；正式群組要先確認）
    if (e.target.closest('.mg-delete-btn')) {
        if (isDraft) {
            mgDrafts = mgDrafts.filter(d => d.id !== id);
            renderMediaGroupsList();
            return;
        }
        const g = findMediaGroupById(id);
        if (!g) return;
        const titleText = g.note && g.note.trim() ? g.note.trim() : mgRangeLabel(g.startTime, g.endTime);
        showCustomDialog({
            title: '刪除群組',
            message: `確定要刪除「${mgEscapeAttr(titleText)}」這個群組嗎？此動作無法復原。`,
            confirmText: '確定刪除',
            onConfirm: () => {
                if (removeMediaGroup(id)) {
                    showToast('已刪除群組', 'success');
                    renderMediaGroupsList();
                }
            }
        });
        return;
    }
});

// ================= ★「+ 新增群組」：再生一張空白草稿列 ★ =================

document.getElementById('mgAddGroupBtn')?.addEventListener('click', () => {
    mgDrafts.push(mgNewDraft());
    renderMediaGroupsList();
    // 體驗優化：新列出現後直接把游標放到它的「開始」欄位，不用再點一次
    const rows = document.querySelectorAll('#mediaGroupsListContainer .mg-row');
    const lastRow = rows[rows.length - 1];
    lastRow?.querySelector('.mg-start-input')?.focus();
});

// ================= ★ 檢視模式切換：跨句圖片群組 ★ =================
// #sentenceList（單句列表）、#scriptEditorContainer（全文模式）、#mediaGroupsView
// （跨句範圍）三個容器互斥顯示，直接佔用列表本身的空間，不疊視窗。
// 從「列表工具列 → 編輯 → 跨句範圍」或側邊欄同名按鈕切換進入，
// 再點一次（或側邊欄按鈕）即可返回單句列表。

let isMediaGroupsView = false;

// 這個模式下不適用的檢視項目，進入時先隱藏、離開時再復原
const MG_VIEW_HIDE_MENU_IDS = ['toggleScriptModeBtn', 'sortMenuToggleBtn'];

function enterMediaGroupsView() {
    if (isMediaGroupsView) return;

    // 若目前是全文模式，先切回單句，避免三個容器同時搶顯示
    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
        document.getElementById('toggleScriptModeBtn')?.click();
    }

    // ★ 進入前先關閉搜尋面板，避免單句列表的高亮/命中狀態殘留（必須在旗標設為 true 之前）
    if (document.getElementById('batchReplaceModalOverlay')?.classList.contains('show')) {
        document.getElementById('batchReplaceCancelBtn')?.click();
    }

    isMediaGroupsView = true;

    // ★ 編輯選單只保留此模式可用的項目（尋找取代、返回列表），其餘由 CSS 隱藏（見 style.css .mg-mode）
    document.getElementById('editMenu')?.classList.add('mg-mode');

    const sentenceListEl = document.getElementById('sentenceList');
    const scriptEditorEl = document.getElementById('scriptEditorContainer');
    const mediaGroupsViewEl = document.getElementById('mediaGroupsView');
    if (sentenceListEl) sentenceListEl.style.display = 'none';
    if (scriptEditorEl) scriptEditorEl.style.display = 'none';
    if (mediaGroupsViewEl) mediaGroupsViewEl.style.display = 'flex';

    // 標題底線跟全文模式一樣先隱藏，避免雙重線條的視覺干擾
    const listHeaderContainer = document.getElementById('listHeaderContainer');
    if (listHeaderContainer) listHeaderContainer.style.borderBottom = 'none';

    // 下次點擊選單項目時顯示「返回列表」
    const mgModeText = document.getElementById('mediaGroupsViewModeText');
    if (mgModeText) mgModeText.textContent = '返回列表';

    // 標題「列表」→「群組」，並在旁邊顯示「返回列表」麵包屑
    const headerTitle = document.getElementById('listHeaderTitle');
    if (headerTitle) headerTitle.textContent = '群組';

    MG_VIEW_HIDE_MENU_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    mgMaybeSeedStarterDraft();
    renderMediaGroupsList();

    document.getElementById('editMenu')?.classList.remove('show');
    showToast('已切換為：跨句範圍模式', 'success');
}

function exitMediaGroupsView() {
    if (!isMediaGroupsView) return;

    // ★ 離開前關閉搜尋面板並清掉群組欄位高亮（必須在旗標還是 true 時做）
    if (document.getElementById('batchReplaceModalOverlay')?.classList.contains('show')) {
        document.getElementById('batchReplaceCancelBtn')?.click();
    }
    const mgSearchHintEl = document.getElementById('langEditSearchHint');
    if (mgSearchHintEl) mgSearchHintEl.style.display = 'none';
    const mgScopeSelEl = document.getElementById('mgSearchScopeSel'); // ★ 新增：範圍選單只在群組模式顯示
    if (mgScopeSelEl) mgScopeSelEl.style.display = 'none';
    mgSearchClearPaint();

    isMediaGroupsView = false;
    document.getElementById('editMenu')?.classList.remove('mg-mode'); // 復原完整的編輯選單

    const sentenceListEl = document.getElementById('sentenceList');
    const mediaGroupsViewEl = document.getElementById('mediaGroupsView');
    if (mediaGroupsViewEl) mediaGroupsViewEl.style.display = 'none';
    if (sentenceListEl) sentenceListEl.style.display = 'flex';

    // 恢復標題的淺藍色底線
    const listHeaderContainer = document.getElementById('listHeaderContainer');
    if (listHeaderContainer) listHeaderContainer.style.borderBottom = '2px solid #E0F2F1';

    const mgModeText = document.getElementById('mediaGroupsViewModeText');
    if (mgModeText) mgModeText.textContent = '跨句範圍';

    // 標題復原成「列表」，隱藏「返回列表」麵包屑
    const headerTitle = document.getElementById('listHeaderTitle');
    if (headerTitle) headerTitle.textContent = '列表';

    MG_VIEW_HIDE_MENU_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'flex';
    });

    if (typeof renderSentenceList === 'function') renderSentenceList();

    document.getElementById('editMenu')?.classList.remove('show');
    showToast('已返回列表', 'normal');
}

function toggleMediaGroupsView() {
    if (isMediaGroupsView) {
        exitMediaGroupsView();
    } else {
        enterMediaGroupsView();
    }
}

document.getElementById('toggleMediaGroupsViewBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMediaGroupsView();
});

// ================= ★ 跨句範圍模式專用：尋找與取代（範圍選單：全部／開始／結束／備註／網址） ★ =================
// 搜尋引擎（面板、上下筆、命中計數）沿用 4f_ui_import_search.js，isMediaGroupsView 為 true 時
// 4f 會把 掃描／高亮／捲動／單筆取代／全部取代 轉交給下面的 mgSearch* 函式。
// 範圍由面板上的「範圍」選單決定（全部＝四個欄位都搜）：開始、結束、備註、網址。
//   - 不碰句子文字、時間標記；尚未升級成正式群組的空白草稿列不納入（它們不在 mediaGroups 資料裡）。
//   - ★ 時間欄（開始／結束）：比對的是畫面上顯示的文字（秒，小數 1 位，例如 12.3）。
//     取代後必須是有效數字（≥ 0）且「結束 > 開始」才會寫入，否則略過並提示；
//     同一群組的開始、結束同時被取代時，會一起檢查區間再寫入（避免先改一邊就被判不合法）。
// 命中資料格式：{ id, field: 'startTime' | 'endTime' | 'note' | 'imageUrl', start, end }
// 輸入框無法塗色，改用：有命中的欄位淡橘底色，目前這一筆較深（見 style.css .mg-search-hit）。
// 取代後直接存檔（updateMediaGroupRange / updateMediaGroupNote / setMediaGroupImageUrl 內部都會 saveToStorage），
// 所以不需要「尚未存檔」的提醒。

const MG_SEARCH_FIELDS = [
    { field: 'startTime', selector: '.mg-start-input',     label: '開始', isTime: true },
    { field: 'endTime',   selector: '.mg-end-input',       label: '結束', isTime: true },
    { field: 'note',      selector: '.mg-note-input',      label: '備註' },
    { field: 'imageUrl',  selector: '.mg-image-url-input', label: '網址' }
];
let mgSearchScope = 'all'; // 'all' | 'startTime' | 'endTime' | 'note' | 'imageUrl'

function mgSearchIsOpen() {
    return isMediaGroupsView && !!document.getElementById('batchReplaceModalOverlay')?.classList.contains('show');
}

// 依範圍選單算出要搜尋的欄位定義
function mgSearchGetFields() {
    if (mgSearchScope === 'all') return MG_SEARCH_FIELDS;
    const def = MG_SEARCH_FIELDS.find(f => f.field === mgSearchScope);
    return def ? [def] : MG_SEARCH_FIELDS;
}
function mgSearchScopeLabel() {
    if (mgSearchScope === 'all') return '全部';
    return (MG_SEARCH_FIELDS.find(f => f.field === mgSearchScope) || { label: '全部' }).label;
}

// 取出某群組某欄位「用來比對的文字」：時間欄用畫面上顯示的格式（小數 1 位），其餘直接用字串
function mgSearchFieldText(g, def) {
    if (def.isTime) {
        const v = g[def.field];
        return (v === '' || v === null || v === undefined || !isFinite(v)) ? '' : Number(v).toFixed(1);
    }
    return String(g[def.field] || '');
}

// 更新範圍選單、搜尋框提示；只有範圍包含時間欄時，才顯示一行取代限制的說明
function mgSearchUpdateUI() {
    const scopeSel = document.getElementById('mgSearchScopeSel');
    if (scopeSel) {
        scopeSel.style.display = '';
        if (scopeSel.value !== mgSearchScope) scopeSel.value = mgSearchScope;
    }
    if (findTextInput) findTextInput.placeholder = `尋找目標（${mgSearchScopeLabel()}）`;
    const hint = document.getElementById('langEditSearchHint');
    if (!hint) return;
    if (mgSearchGetFields().some(f => f.isTime)) {
        hint.style.display = 'block';
        hint.style.color = '#5F6368';
        hint.textContent = '時間欄取代後須為有效秒數且結束 > 開始，否則會略過';
    } else {
        hint.style.display = 'none';
    }
}

function mgSearchGetInput(id, field) {
    const def = MG_SEARCH_FIELDS.find(f => f.field === field);
    if (!def) return null;
    return document.querySelector(`#mediaGroupsListContainer .mg-row[data-id="${id}"] ${def.selector}`);
}

// 清掉所有欄位上的搜尋高亮
function mgSearchClearPaint() {
    document.querySelectorAll('#mediaGroupsListContainer .mg-search-hit, #mediaGroupsListContainer .mg-search-current')
        .forEach(el => el.classList.remove('mg-search-hit', 'mg-search-current'));
}

// 掃描所有正式群組（範圍內的欄位），結果存進 searchEngine.matches
function mgSearchScan() {
    const findStr = findTextInput.value;
    const useRegex = useRegexCheck ? useRegexCheck.checked : false;
    searchEngine.matches = [];
    searchEngine.query = findStr;
    searchEngine.useRegex = useRegex;
    mgSearchUpdateUI();

    if (findStr) {
        let searchRegex = null;
        let regexOk = true;
        if (useRegex) {
            try { searchRegex = new RegExp(findStr, 'g'); } catch (e) { regexOk = false; }
        }
        if (regexOk) {
            const fields = mgSearchGetFields();
            getSortedMediaGroups().forEach(g => {
                fields.forEach(f => {
                    findMatchesInString(mgSearchFieldText(g, f), findStr, searchRegex).forEach(m => {
                        searchEngine.matches.push({ id: g.id, field: f.field, start: m.start, end: m.end });
                    });
                });
            });
        }
    }

    if (searchEngine.currentIndex >= searchEngine.matches.length) searchEngine.currentIndex = Math.max(0, searchEngine.matches.length - 1);
    else if (searchEngine.currentIndex === -1 && searchEngine.matches.length > 0) searchEngine.currentIndex = 0;

    mgSearchPaint();
}

// 重畫命中計數與欄位高亮
function mgSearchPaint() {
    mgSearchClearPaint();
    const hasMatch = mgSearchIsOpen() && searchEngine.query && searchEngine.matches.length > 0;
    if (searchMatchCount) {
        if (hasMatch) {
            searchMatchCount.style.display = 'block';
            searchMatchCount.textContent = `${searchEngine.currentIndex + 1}/${searchEngine.matches.length}`;
        } else {
            searchMatchCount.style.display = 'none';
        }
    }
    if (!hasMatch) return;

    const cur = searchEngine.matches[searchEngine.currentIndex];
    searchEngine.matches.forEach(m => {
        const input = mgSearchGetInput(m.id, m.field);
        if (!input) return;
        input.classList.add('mg-search-hit');
        if (cur && cur.id === m.id && cur.field === m.field) input.classList.add('mg-search-current');
    });
}

// 捲動到目前命中的那一列（不搶搜尋框焦點，才不會打字打到一半跳掉）
function mgSearchScrollToCurrent() {
    if (searchEngine.currentIndex === -1 || searchEngine.matches.length === 0) return;
    const m = searchEngine.matches[searchEngine.currentIndex];
    const row = document.querySelector(`#mediaGroupsListContainer .mg-row[data-id="${m.id}"]`);
    if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

// 面板開著時，資料有變就重掃一次
function mgSearchRefreshIfOpen() {
    if (!mgSearchIsOpen()) return;
    mgSearchUpdateUI();
    if (findTextInput && findTextInput.value) mgSearchScan();
}

// 把新文字寫回群組資料（內部已含 saveToStorage）。回傳 false 代表沒寫入（時間不合法）。
function mgSearchWriteField(id, field, newText) {
    if (field === 'note') return updateMediaGroupNote(id, newText);
    if (field === 'imageUrl') return setMediaGroupImageUrl(id, newText);
    return false;
}

// ★ 新增：時間欄取代的共用寫入。edits = { startTime?: 新文字, endTime?: 新文字 }，
// 沒被取代的那一邊沿用原值；兩邊一起檢查「有效數字且結束 > 開始」，通過才寫入。
function mgSearchWriteTimes(id, edits) {
    const g = findMediaGroupById(id);
    if (!g) return false;
    const parse = (txt, fallback) => {
        if (txt === undefined) return fallback;
        const t = String(txt).trim();
        if (t === '') return NaN;
        const v = Number(t);
        return (isFinite(v) && v >= 0) ? v : NaN;
    };
    const s = parse(edits.startTime, g.startTime);
    const e = parse(edits.endTime, g.endTime);
    if (!isFinite(s) || !isFinite(e) || e <= s) return false;
    return updateMediaGroupRange(id, s, e);
}

// 單步取代：只取代目前這一筆
function mgSearchReplaceSingle() {
    mgSearchScan(); // 動手前重掃，避免命中位置過期
    if (searchEngine.matches.length === 0 || searchEngine.currentIndex === -1) return;
    const m = searchEngine.matches[searchEngine.currentIndex];
    const g = findMediaGroupById(m.id);
    if (!g) return;
    const def = MG_SEARCH_FIELDS.find(f => f.field === m.field);
    const replaceStr = replaceTextInput.value;
    const oldText = mgSearchFieldText(g, def);
    const newText = oldText.substring(0, m.start) + replaceStr + oldText.substring(m.end);

    if (def.isTime) {
        if (!mgSearchWriteTimes(m.id, { [m.field]: newText })) {
            showToast('時間取代後不合法（須為有效秒數且結束 > 開始），已略過', 'error');
            return;
        }
    } else {
        mgSearchWriteField(m.id, m.field, newText);
    }
    renderMediaGroupsList();
    mgSearchScan();
    mgSearchScrollToCurrent();
}

// 全部取代：同一欄位的多筆命中由後往前取代，前面的位置才不會被位移
function mgSearchReplaceAll() {
    mgSearchScan();
    if (searchEngine.matches.length === 0) return;
    const replaceStr = replaceTextInput.value;
    const count = searchEngine.matches.length;

    const byKey = {};
    searchEngine.matches.forEach(m => {
        const key = m.id + '||' + m.field;
        if (!byKey[key]) byKey[key] = { id: m.id, field: m.field, list: [] };
        byKey[key].list.push(m);
    });

    const timeEdits = {}; // id -> { startTime?: {text, n}, endTime?: {text, n} }，同一群組的兩個時間欄一起檢查
    Object.values(byKey).forEach(({ id, field, list }) => {
        const g = findMediaGroupById(id);
        if (!g) return;
        const def = MG_SEARCH_FIELDS.find(f => f.field === field);
        let text = mgSearchFieldText(g, def);
        [...list].sort((a, b) => b.start - a.start).forEach(m => {
            text = text.substring(0, m.start) + replaceStr + text.substring(m.end);
        });
        if (def.isTime) {
            (timeEdits[id] = timeEdits[id] || {})[field] = { text, n: list.length };
        } else {
            mgSearchWriteField(id, field, text);
        }
    });

    let skipped = 0;
    Object.entries(timeEdits).forEach(([id, ed]) => {
        const plain = {};
        Object.keys(ed).forEach(k => { plain[k] = ed[k].text; });
        if (!mgSearchWriteTimes(id, plain)) {
            Object.keys(ed).forEach(k => { skipped += ed[k].n; });
        }
    });

    renderMediaGroupsList();
    const done = count - skipped;
    if (skipped > 0) showToast(`（${mgSearchScopeLabel()}）已替換 ${done} 處；另有 ${skipped} 處時間取代後不合法，已略過`, done > 0 ? 'normal' : 'error');
    else showToast(`替換完成！（${mgSearchScopeLabel()}）共替換了 ${count} 處。`, 'success');
    // ★ 修改：取代後不再清空尋找框，只重新掃描（命中數會依取代結果更新）
    searchEngine.currentIndex = -1;
    mgSearchScan();
}

// ★ 新增：範圍選單（全部／開始／結束／備註／網址）切換時重新掃描
document.getElementById('mgSearchScopeSel')?.addEventListener('change', (e) => {
    mgSearchScope = e.target.value;
    searchEngine.currentIndex = -1;
    mgSearchUpdateUI();
    if (findTextInput && findTextInput.value) {
        mgSearchScan();
        mgSearchScrollToCurrent();
    } else {
        mgSearchPaint();
    }
});
