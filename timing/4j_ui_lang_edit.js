// ===== 4j_ui_lang_edit.js: 多語言編輯 —— 內嵌於列表區域的第四種檢視模式 =====
// 目的：已有語言 A 字幕時，方便貼上/編輯語言 B（或更多語言）的對應文字，不必逐句手動插入分隔字元。
// 模式切換邏輯與「跨句範圍」（4i_ui_media_groups.js）相同：從「編輯 → 多語言編輯」進入，
// 取代 #sentenceList 的畫面，點「返回列表」麵包屑離開。
//
// 版面：左右兩欄都是純文字 <textarea>，逐行對應目前 allLabelsOrdered 的既有順序（不含
//       ###### 段落記號），兩欄都可以直接編輯：
//       - 左欄「顯示語言」：選哪個語言就顯示哪個語言的既有內容，可直接修改，防抖後
//         只有在「行數跟目前句子數相符」時才會自動存檔（安全起見，行數對不上就不動資料，
//         避免打字打到一半、行數暫時不齊時誤把文字寫到錯的句子上）。
//       - 右欄「貼到語言」：
//           ‧ 選到既有語言：自動載入該語言內容，編輯後跟左欄一樣「防抖自動存檔」
//             （行數需與句子數相符），此時「匯入」按鈕淡化不可點。
//           ‧ 選到最後的「＋新增」：維持空白讓使用者貼上全新語言，只有這個情況才需要按
//             「匯入」才會寫入資料（行數不相等也能匯入：多出的行捨棄、不足的句子維持原狀）。
//           ‧ 左右欄選到同一個語言時，其中一欄自動存檔後會把另一欄同步成相同內容，避免舊文字回蓋。
//
// 資料層沿用 1c_languages.js 的 splitLangs / getLang / setLang / getLangCount /
// getLangMultiEnabled / setLangMultiEnabled，不新增資料欄位、不改動存檔格式。
//
// 依賴：1_globals.js、1c_languages.js、3_data_core.js 需先載入；
//       index.html 需有 #langEditView 與「編輯」選單裡的 #openLangEditBtn。

// ===== 狀態 =====
let isLangEditView = false;
let langEditDebounceTimer = null;
let langEditLastSide = 'left'; // 最後一次輸入的是哪一欄，防抖時只自動存檔那一欄
const LANG_EDIT_DEBOUNCE_MS = 500; // 防抖：使用者停止輸入約 0.5 秒後才重新比較行數／嘗試自動存檔

// 此模式下不適用的選單項目：進入時隱藏、離開時復原（比照 4i 的 MG_VIEW_HIDE_MENU_IDS）
const LANG_EDIT_HIDE_MENU_IDS = [
    'toggleScriptModeBtn', 'toggleMediaGroupsViewBtn', 'sortMenuToggleBtn',
    'openBatchReplaceBtn', 'openLangEditBtn', 'clearTimeTagsBtn', 'clearListTextBtn', 'deleteAllDataBtn',
    // 一併隱藏分隔線，避免殘留孤立分隔線
    'editMenuHrTop'
];

// ===== 小工具 =====

function langEditGetLangName(i) {
    return (typeof getLangName === 'function') ? getLangName(i) : `語言${i + 1}`;
}

// 只認實際的換行字元；textarea 本身設 wrap="off" + white-space:pre，長句不會被自動換行
// 誤判成新的一行，這裡直接用 \n 切割即可。空字串視為 0 行（而不是 1 行空字串）。
function langEditCountLines(text) {
    return text === '' ? 0 : text.split('\n').length;
}

// ===== 下拉選單：依偵測到的語言數量動態產生 =====
// 左欄「顯示語言」：只列出偵測到的既有語言。
// 右欄「貼到語言」：既有語言之後多一個「＋新增」；即使尚未啟用多語字幕也能選，
//   按「匯入」時會自動開啟多語字幕設定。
function langEditPopulateSelects() {
    const rawCount = (typeof getLangCount === 'function') ? getLangCount() : 1;
    const multiEnabled = (typeof getLangMultiEnabled === 'function') && getLangMultiEnabled();
    const count = multiEnabled ? Math.max(rawCount, 1) : 1;

    const leftSel = document.getElementById('langEditLeftSel');
    const rightSel = document.getElementById('langEditRightSel');
    if (!leftSel || !rightSel) return;

    const prevLeft = leftSel.value !== '' ? parseInt(leftSel.value, 10) : 0;
    const prevRight = rightSel.value !== '' ? parseInt(rightSel.value, 10) : NaN;

    leftSel.innerHTML = '';
    for (let i = 0; i < count; i++) {
        leftSel.appendChild(new Option(langEditGetLangName(i), i));
    }
    leftSel.value = Math.min(isNaN(prevLeft) ? 0 : prevLeft, count - 1);

    rightSel.innerHTML = '';
    for (let i = 0; i < count; i++) {
        rightSel.appendChild(new Option(langEditGetLangName(i), i));
    }
    rightSel.appendChild(new Option(`${langEditGetLangName(count)}（新增）`, count));
    // 預設：已有第二種語言時右欄指向語言2，否則指向「＋新增」
    const defaultRight = count >= 2 ? 1 : count;
    rightSel.value = Math.min(isNaN(prevRight) ? defaultRight : prevRight, count);
}

// ===== 左欄：從資料載入目前顯示語言的內容 =====
function langEditLoadLeft() {
    const leftSel = document.getElementById('langEditLeftSel');
    const leftText = document.getElementById('langEditLeftText');
    if (!leftSel || !leftText) return;
    const idx = parseInt(leftSel.value, 10) || 0;
    const lines = allLabelsOrdered.map(lbl => {
        const raw = sentenceTextMap[lbl] || '';
        return (typeof getLang === 'function') ? getLang(raw, idx) : raw;
    });
    leftText.value = lines.join('\n');
}

// 既有語言數量（算法需與 langEditPopulateSelects() 一致），
// 用來判斷右欄選到的是既有語言還是最後的「＋新增」。
function langEditGetExistingLangCount() {
    const rawCount = (typeof getLangCount === 'function') ? getLangCount() : 1;
    const multiEnabled = (typeof getLangMultiEnabled === 'function') && getLangMultiEnabled();
    return multiEnabled ? Math.max(rawCount, 1) : 1;
}

// ===== 右欄：選到既有語言時，載入該語言目前的既有內容 =====
// 選到「＋新增」（尚不存在的語言）時維持空白，供貼上全新內容；選到既有語言時載入其現有內容。
function langEditLoadRight() {
    const rightSel = document.getElementById('langEditRightSel');
    const rightText = document.getElementById('langEditRightText');
    if (!rightSel || !rightText) return;
    const idx = parseInt(rightSel.value, 10);
    const existingCount = langEditGetExistingLangCount();
    if (isNaN(idx) || idx >= existingCount) {
        rightText.value = '';
    } else {
        const lines = allLabelsOrdered.map(lbl => {
            const raw = sentenceTextMap[lbl] || '';
            return (typeof getLang === 'function') ? getLang(raw, idx) : raw;
        });
        rightText.value = lines.join('\n');
    }
    langEditUpdateImportBtn(); // 依右欄是否為「＋新增」決定匯入鈕可否點擊
}

// 右欄是既有語言 -> 自動存檔，不需匯入（按鈕淡化）；只有「＋新增」語言才需按匯入。
function langEditSideIsAutoSave(side) {
    if (side === 'left') return true;
    const rightSel = document.getElementById('langEditRightSel');
    const idx = rightSel ? parseInt(rightSel.value, 10) : NaN;
    return !isNaN(idx) && idx < langEditGetExistingLangCount();
}

function langEditUpdateImportBtn() {
    const btn = document.getElementById('langEditImportBtn');
    if (!btn) return;
    const needImport = !langEditSideIsAutoSave('right');
    btn.disabled = !needImport;
    btn.title = needImport
        ? '依行對應匯入到左側句子，即使行數不相等也可以直接匯入'
        : '此語言已存在，右欄編輯會自動存檔，不需要匯入';
}

// ===== 行號 gutter：左右欄各自依目前行數重繪 1..N 的行號 =====
// 視覺慣例同劇本模式的 #scriptGutter，但只做逐行編號、不處理段落標記；
// 行數取自 langEditUpdateBanner() 算出的 leftCount/rightCount，不重複掃描 textarea。
function langEditRenderGutterHtml(count) {
    const n = Math.max(count, 1); // 至少顯示第 1 行
    let html = '';
    for (let i = 1; i <= n; i++) {
        html += `<div class="lang-edit-gutter-line">${i}</div>`;
    }
    return html;
}

function langEditRefreshGutters(leftCount, rightCount) {
    const leftGutter = document.getElementById('langEditLeftGutter');
    const rightGutter = document.getElementById('langEditRightGutter');
    if (leftGutter) leftGutter.innerHTML = langEditRenderGutterHtml(leftCount);
    if (rightGutter) rightGutter.innerHTML = langEditRenderGutterHtml(rightCount);
}

// ===== 左右欄同步捲動 =====
// 捲動其中一欄時，另一欄（含各自的行號 gutter）同步捲到同一位置，方便逐行對照。
//
// 不能直接複製 scrollTop：兩欄字體不同（中文字幕 vs 拼音／符號），即使 line-height 相同，
//   實際行高仍有細微落差，直接複製像素會讓誤差隨行數累積。
//   做法：用來源欄的實際行高把 scrollTop 換算成「第幾行」，再用目標欄的實際行高換回像素。
function langEditGetLineHeightPx(el) {
    const val = el ? parseFloat(getComputedStyle(el).lineHeight) : NaN;
    return (isFinite(val) && val > 0) ? val : 1;
}

function langEditSyncScrollTop(sourceEl, ownGutter, crossEl, crossGutter) {
    // 同側 gutter 與自己的 textarea 共用 CSS 規則與字體，行高一致，直接複製像素
    if (ownGutter && ownGutter.scrollTop !== sourceEl.scrollTop) ownGutter.scrollTop = sourceEl.scrollTop;

    if (!crossEl) return;
    const srcLineH = langEditGetLineHeightPx(sourceEl);
    const dstLineH = langEditGetLineHeightPx(crossEl);
    const lineIndex = sourceEl.scrollTop / srcLineH;
    const targetScrollTop = lineIndex * dstLineH;
    if (Math.abs(crossEl.scrollTop - targetScrollTop) > 0.5) crossEl.scrollTop = targetScrollTop;
    if (crossGutter && crossGutter.scrollTop !== crossEl.scrollTop) crossGutter.scrollTop = crossEl.scrollTop;
}

document.getElementById('langEditLeftText')?.addEventListener('scroll', (e) => {
    langEditSyncScrollTop(
        e.target,
        document.getElementById('langEditLeftGutter'),
        document.getElementById('langEditRightText'),
        document.getElementById('langEditRightGutter')
    );
});
document.getElementById('langEditRightText')?.addEventListener('scroll', (e) => {
    langEditSyncScrollTop(
        e.target,
        document.getElementById('langEditRightGutter'),
        document.getElementById('langEditLeftText'),
        document.getElementById('langEditLeftGutter')
    );
});

// ===== 上方橫幅：左右行數比較（防抖後才呼叫） =====
function langEditUpdateBanner() {
    const banner = document.getElementById('langEditCountBanner');
    const leftText = document.getElementById('langEditLeftText');
    const rightText = document.getElementById('langEditRightText');
    if (!banner || !leftText || !rightText) return { leftCount: 0, rightCount: 0, match: true };

    const leftCount = langEditCountLines(leftText.value);
    const rightCount = langEditCountLines(rightText.value);
    const match = leftCount === rightCount;

    banner.textContent = `左 ${leftCount} 句／右 ${rightCount} 行` + (match ? '　✅ 行數相符' : '　⚠️ 行數不相符');
    banner.classList.toggle('lang-edit-match', match);
    banner.classList.toggle('lang-edit-mismatch', !match);
    langEditRefreshGutters(leftCount, rightCount);
    if (typeof langEditSearchPaint === 'function') langEditSearchPaint(); // gutter 被重建，補畫搜尋高亮
    return { leftCount, rightCount, match };
}

// ===== 自動存檔（左欄／右欄既有語言共用；只在行數對得上時才寫入） =====
// 回傳 true = 行數相符且已處理（不論內容有無變動）；false = 不適用或行數對不上，未動資料
function langEditTryAutoSaveSide(side) {
    if (!langEditSideIsAutoSave(side)) return false; // 右欄是「＋新增」→ 只能按匯入
    const sel = document.getElementById(side === 'left' ? 'langEditLeftSel' : 'langEditRightSel');
    const ta = document.getElementById(side === 'left' ? 'langEditLeftText' : 'langEditRightText');
    if (!sel || !ta) return false;

    const lines = ta.value === '' ? [] : ta.value.split('\n');
    // 行數與句子數不一致時不自動存檔（可能正在插入/刪除行，對應暫時錯位）
    if (lines.length !== allLabelsOrdered.length) return false;

    const idx = parseInt(sel.value, 10) || 0;
    let changed = false;
    allLabelsOrdered.forEach((lbl, i) => {
        const raw = sentenceTextMap[lbl] || '';
        const newVal = (typeof setLang === 'function') ? setLang(raw, idx, lines[i]) : lines[i];
        if (newVal !== raw) {
            sentenceTextMap[lbl] = newVal;
            changed = true;
        }
    });

    if (changed) {
        if (typeof saveToStorage === 'function') saveToStorage();
        allLabelsOrdered.forEach(lbl => {
            if (typeof updateRegionTextDisplay === 'function') updateRegionTextDisplay(lbl, sentenceTextMap[lbl]);
        });
    }

    // 另一欄若顯示同一語言，同步成相同內容，避免舊文字回蓋
    const otherSide = side === 'left' ? 'right' : 'left';
    const otherSel = document.getElementById(otherSide === 'left' ? 'langEditLeftSel' : 'langEditRightSel');
    const otherTa = document.getElementById(otherSide === 'left' ? 'langEditLeftText' : 'langEditRightText');
    if (otherSel && otherTa && langEditSideIsAutoSave(otherSide)
        && (parseInt(otherSel.value, 10) || 0) === idx && otherTa.value !== ta.value) {
        otherTa.value = ta.value;
    }
    return true;
}

// ===== 防抖排程：左右任一欄輸入時共用同一個計時器 =====
function langEditScheduleWork() {
    clearTimeout(langEditDebounceTimer);
    langEditDebounceTimer = setTimeout(langEditDebouncedWork, LANG_EDIT_DEBOUNCE_MS);
}
function langEditDebouncedWork() {
    langEditDebounceTimer = null;
    langEditTryAutoSaveSide(langEditLastSide); // 先存檔（含同語言同步），再更新橫幅
    langEditUpdateBanner();
    langEditSearchRefreshIfOpen(); // 文字變了，搜尋命中位置要重算
}
// 立即執行待處理的防抖工作（切換語言／離開模式前呼叫，避免剛輸入的內容未存檔）
function langEditFlushPendingWork() {
    if (langEditDebounceTimer) {
        clearTimeout(langEditDebounceTimer);
        langEditDebouncedWork();
    }
}

// ===== 右欄：標點斷行（原地把整段文字依標點符號斷成多行） =====
// 逐行掃描，每一行各自依標點符號斷開；已分行的內容再跑一次也不會被誤傷。
function langEditSplitOneParagraph(para) {
    let sentences = [];
    let current = '';
    let inBrackets = false;
    for (let i = 0; i < para.length; i++) {
        const char = para[i];
        current += char;
        if (char === '[' || char === '「' || char === '『') inBrackets = true;
        if (char === ']' || char === '」' || char === '』') inBrackets = false;

        if (!inBrackets && /[，。：；！？、．―─「」【】『』《》〈〉·"'?!.,]/.test(char)) {
            let isDecimal = false;
            if ((char === '.' || char === ',') && i > 0 && i < para.length - 1) {
                if (/\d/.test(para[i - 1]) && /\d/.test(para[i + 1])) isDecimal = true;
            }
            if (!isDecimal) {
                // 貪婪吸收後續的標點符號，避免「。」「」」被拆成兩個殘缺片段
                while (i + 1 < para.length && /[，。：；！？、．―─「」【】『』《》〈〉·"'?!.,\s]/.test(para[i + 1])) {
                    const nextChar = para[i + 1];
                    if ((nextChar === '.' || nextChar === ',') && /\d/.test(para[i]) && i + 2 < para.length && /\d/.test(para[i + 2])) break;
                    current += nextChar;
                    i++;
                }
                if (current.trim()) {
                    sentences.push(current.trim());
                    current = '';
                }
            }
        }
    }
    if (current.trim()) sentences.push(current.trim());
    if (sentences.length === 0) sentences = [para];
    return sentences;
}

function langEditSplitByPunctuation(text) {
    const resultLines = [];
    text.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed === '') return; // 斷行後不留空白行
        resultLines.push(...langEditSplitOneParagraph(trimmed));
    });
    return resultLines;
}

// ===== 開啟 / 關閉 =====
function enterLangEditView() {
    if (isLangEditView) return;

    if (!allLabelsOrdered || allLabelsOrdered.length === 0) {
        if (typeof showToast === 'function') showToast('目前尚無字幕資料，請先建立句子與時間標記', 'error');
        return;
    }

    // 若在全文／跨句範圍模式，先切回單句列表
    if (typeof isScriptMode !== 'undefined' && isScriptMode) {
        document.getElementById('toggleScriptModeBtn')?.click();
    }
    if (typeof isMediaGroupsView !== 'undefined' && isMediaGroupsView && typeof exitMediaGroupsView === 'function') {
        exitMediaGroupsView();
    }

    // 搜尋面板若開著，命中資料屬於列表版，先關閉避免混用
    if (document.getElementById('batchReplaceModalOverlay')?.classList.contains('show')) {
        document.getElementById('batchReplaceCancelBtn')?.click();
    }

    isLangEditView = true;

    document.getElementById('sentenceList').style.display = 'none';
    const scriptEditorEl = document.getElementById('scriptEditorContainer');
    if (scriptEditorEl) scriptEditorEl.style.display = 'none';
    const mgViewEl = document.getElementById('mediaGroupsView');
    if (mgViewEl) mgViewEl.style.display = 'none';
    document.getElementById('langEditView').style.display = 'flex';

    // 隱藏標題底線，避免雙重線條
    const listHeaderContainer = document.getElementById('listHeaderContainer');
    if (listHeaderContainer) listHeaderContainer.style.borderBottom = 'none';

    // 標題「列表」→「多語」，並在旁邊顯示「返回列表」麵包屑
    const headerTitle = document.getElementById('listHeaderTitle');
    if (headerTitle) headerTitle.textContent = '多語';

    LANG_EDIT_HIDE_MENU_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const langEditMenuGroupEl = document.getElementById('langEditMenuGroup');
    if (langEditMenuGroupEl) langEditMenuGroupEl.style.display = 'block';

    langEditPopulateSelects();
    langEditLoadLeft();
    langEditLoadRight();
    langEditUpdateBanner();

    document.getElementById('editMenu')?.classList.remove('show');
    if (typeof showToast === 'function') showToast('已切換為：多語言編輯模式', 'success');
}

function exitLangEditView() {
    if (!isLangEditView) return;

    // 離開前先存下尚未自動存檔的左欄內容
    langEditFlushPendingWork();

    // 關閉搜尋面板並清掉命中狀態（須在 isLangEditView 仍為 true 時）
    if (document.getElementById('batchReplaceModalOverlay')?.classList.contains('show')) {
        document.getElementById('batchReplaceCancelBtn')?.click();
    }
    const searchHintEl = document.getElementById('langEditSearchHint');
    if (searchHintEl) searchHintEl.style.display = 'none';
    const scopeSelEl = document.getElementById('langEditSearchScopeSel'); // 範圍選單只在多語模式顯示
    if (scopeSelEl) scopeSelEl.style.display = 'none';
    const findInputEl = document.getElementById('findTextInput');
    if (findInputEl) findInputEl.placeholder = '尋找目標...';
    if (findInputEl) findInputEl.title = '';
    const repInputEl = document.getElementById('replaceTextInput');
    if (repInputEl) repInputEl.title = '';

    isLangEditView = false;

    document.getElementById('langEditView').style.display = 'none';
    document.getElementById('sentenceList').style.display = 'flex';

    const listHeaderContainer = document.getElementById('listHeaderContainer');
    if (listHeaderContainer) listHeaderContainer.style.borderBottom = '2px solid #E0F2F1';

    const headerTitle = document.getElementById('listHeaderTitle');
    if (headerTitle) headerTitle.textContent = '列表';

    LANG_EDIT_HIDE_MENU_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'flex';
    });
    const langEditMenuGroupEl = document.getElementById('langEditMenuGroup');
    if (langEditMenuGroupEl) langEditMenuGroupEl.style.display = 'none';

    if (typeof renderSentenceList === 'function') renderSentenceList();

    document.getElementById('editMenu')?.classList.remove('show');
    if (typeof showToast === 'function') showToast('已返回列表', 'normal');
}

// ===== 事件綁定 =====
document.getElementById('openLangEditBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    enterLangEditView();
});

document.getElementById('langEditLeftText')?.addEventListener('input', () => { langEditLastSide = 'left'; langEditScheduleWork(); });
document.getElementById('langEditRightText')?.addEventListener('input', () => { langEditLastSide = 'right'; langEditScheduleWork(); });

document.getElementById('langEditLeftSel')?.addEventListener('change', () => {
    langEditFlushPendingWork(); // 先存下剛才的編輯，避免被下方重新載入蓋掉
    langEditLoadLeft();
    langEditUpdateBanner();
    langEditSearchRefreshIfOpen();
});

document.getElementById('langEditRightSel')?.addEventListener('change', () => {
    langEditFlushPendingWork(); // 切換前先把剛打的字存下來
    langEditLoadRight();
    langEditUpdateBanner();
    langEditSearchRefreshIfOpen();
});

document.getElementById('langEditSplitBtn')?.addEventListener('click', () => {
    const ta = document.getElementById('langEditRightText');
    if (!ta) return;
    if (!ta.value.trim()) {
        if (typeof showToast === 'function') showToast('右側輸入框是空的，沒有可斷行的文字', 'error');
        return;
    }
    const lines = langEditSplitByPunctuation(ta.value);
    ta.value = lines.join('\n');
    langEditUpdateBanner();
    if (langEditSideIsAutoSave('right')) {
        langEditLastSide = 'right';
        langEditScheduleWork(); // 既有語言斷行後走自動存檔
        if (typeof showToast === 'function') showToast(`已依標點斷成 ${lines.length} 行`, 'success');
    } else if (typeof showToast === 'function') {
        showToast(`已依標點斷成 ${lines.length} 行，請確認無誤後再匯入`, 'success');
    }
});

document.getElementById('langEditImportBtn')?.addEventListener('click', () => {
    const rightText = document.getElementById('langEditRightText');
    const rightSel = document.getElementById('langEditRightSel');
    if (!rightText || !rightSel) return;
    if (langEditSideIsAutoSave('right')) return; // 既有語言已自動存檔，不需匯入

    const rightLines = rightText.value === '' ? [] : rightText.value.split('\n');
    if (rightLines.length === 0) {
        if (typeof showToast === 'function') showToast('右側輸入框是空的，沒有可匯入的內容', 'error');
        return;
    }

    const targetIdx = parseInt(rightSel.value, 10) || 0;

    // 目標是「＋新增」且多語字幕尚未啟用時先啟用，否則 setLang 只會整段覆蓋、不會併入多語字串
    const multiEnabled = (typeof getLangMultiEnabled === 'function') && getLangMultiEnabled();
    if (!multiEnabled && targetIdx > 0) {
        if (typeof setLangMultiEnabled === 'function') setLangMultiEnabled(true);
        const chk = document.getElementById('langMultiEnableCheck');
        if (chk) chk.checked = true;
        if (typeof applyLangMultiEnabledUI === 'function') applyLangMultiEnabledUI(true);
        if (typeof showToast === 'function') showToast('已自動開啟「多語字幕」設定', 'normal');
    }

    if (typeof saveState === 'function') saveState(); // 存一次歷史快照，方便 Ctrl+Z 整批復原

    let updatedCount = 0;
    allLabelsOrdered.forEach((lbl, i) => {
        // 右側行數不足時，沒有對應行的句子該語言維持原狀
        if (i >= rightLines.length) return;
        const raw = sentenceTextMap[lbl] || '';
        const newVal = (typeof setLang === 'function') ? setLang(raw, targetIdx, rightLines[i]) : rightLines[i];
        sentenceTextMap[lbl] = newVal;
        updatedCount++;
    });

    if (typeof saveToStorage === 'function') saveToStorage();

    // 語言數可能增加：重整下拉選單，並讓左欄切到剛匯入的語言
    langEditPopulateSelects();
    const leftSel = document.getElementById('langEditLeftSel');
    if (leftSel) leftSel.value = Math.min(targetIdx, leftSel.options.length - 1);
    langEditLoadLeft();
    langEditLoadRight(); // 匯入後右欄改載入實際資料，並讓匯入鈕淡化（之後編輯自動存檔）

    allLabelsOrdered.forEach(lbl => {
        if (typeof updateRegionTextDisplay === 'function') updateRegionTextDisplay(lbl, sentenceTextMap[lbl]);
    });
    if (typeof updateLangViewMenuLabels === 'function') updateLangViewMenuLabels();

    langEditUpdateBanner();

    const discardedCount = Math.max(0, rightLines.length - allLabelsOrdered.length);
    const missingCount = Math.max(0, allLabelsOrdered.length - rightLines.length);
    let msg = `已匯入 ${updatedCount} 句`;
    if (discardedCount > 0) msg += `（捨棄 ${discardedCount} 行多餘文字）`;
    if (missingCount > 0) msg += `（少 ${missingCount} 句維持原狀）`;
    if (typeof showToast === 'function') showToast(msg, 'success');
});

// ===== 左右欄互換：交換兩個語言的實際資料 =====
// 將「顯示語言」與「貼到語言」所選的兩種語言，對所有句子整組對調。
// 會直接改動 sentenceTextMap，故先 saveState()，可用 Ctrl+Z 整批復原。
// 右欄選「＋新增」時該語言不存在，無法交換。
document.getElementById('langEditSwapDataBtn')?.addEventListener('click', () => {
    const leftSel = document.getElementById('langEditLeftSel');
    const rightSel = document.getElementById('langEditRightSel');
    if (!leftSel || !rightSel) return;

    const leftIdx = parseInt(leftSel.value, 10) || 0;
    const rightIdx = parseInt(rightSel.value, 10);
    const existingCount = langEditGetExistingLangCount();

    if (isNaN(rightIdx) || rightIdx >= existingCount) {
        if (typeof showToast === 'function') showToast('右欄目前選的是「＋新增」，尚無資料可交換', 'error');
        document.getElementById('editMenu')?.classList.remove('show');
        return;
    }
    if (leftIdx === rightIdx) {
        if (typeof showToast === 'function') showToast('左右欄選到同一個語言，沒有需要交換的資料', 'error');
        document.getElementById('editMenu')?.classList.remove('show');
        return;
    }

    langEditFlushPendingWork(); // 先存下左欄內容，避免被覆蓋

    if (typeof saveState === 'function') saveState(); // 存一次歷史快照，方便 Ctrl+Z 整批復原

    allLabelsOrdered.forEach(lbl => {
        let raw = sentenceTextMap[lbl] || '';
        const leftVal = (typeof getLang === 'function') ? getLang(raw, leftIdx) : '';
        const rightVal = (typeof getLang === 'function') ? getLang(raw, rightIdx) : '';
        raw = (typeof setLang === 'function') ? setLang(raw, leftIdx, rightVal) : raw;
        raw = (typeof setLang === 'function') ? setLang(raw, rightIdx, leftVal) : raw;
        sentenceTextMap[lbl] = raw;
    });

    if (typeof saveToStorage === 'function') saveToStorage();

    langEditLoadLeft();
    langEditLoadRight();
    langEditUpdateBanner();

    allLabelsOrdered.forEach(lbl => {
        if (typeof updateRegionTextDisplay === 'function') updateRegionTextDisplay(lbl, sentenceTextMap[lbl]);
    });

    document.getElementById('editMenu')?.classList.remove('show');
    if (typeof showToast === 'function') {
        showToast(`已交換「${langEditGetLangName(leftIdx)}」與「${langEditGetLangName(rightIdx)}」的資料（可按 Ctrl+Z 復原）`, 'success');
    }
});

// ===== 刪除語言：把某個語言從「每一句」移除，後面的語言往前遞補 =====
// 語言數是以「分隔字元切出最多幾段」偵測的，清空語言2文字後每句仍殘留「文字|」，語言仍存在，
// 因此直接把該段（含分隔字元）從每句移除。例：刪除語言2，「甲|乙|丙」→「甲|丙」；
// 只剩一種語言時不含分隔字元。動手前先 saveState()，可 Ctrl+Z 整批復原。
function langEditDeleteLanguage(delIdx) {
    langEditFlushPendingWork(); // 先把剛打的字存下來
    if (typeof saveState === 'function') saveState();

    const delim = (typeof getLangDelimiter === 'function') ? getLangDelimiter() : '|';
    allLabelsOrdered.forEach(lbl => {
        const arr = (typeof splitLangs === 'function') ? splitLangs(sentenceTextMap[lbl]) : [String(sentenceTextMap[lbl] || '')];
        if (delIdx < arr.length) arr.splice(delIdx, 1);
        sentenceTextMap[lbl] = arr.join(delim);
    });
    if (typeof saveToStorage === 'function') saveToStorage();

    // 被刪除或往前遞補的語言，原本記住的「只看第 N 語言」「表格欄位」索引已失效，改回預設
    if (typeof getCurrentLangViewIndex === 'function' && typeof setLangViewMode === 'function') {
        const viewIdx = getCurrentLangViewIndex();
        if (viewIdx !== null && viewIdx >= delIdx) setLangViewMode('table');
    }
    if (typeof langTableCols !== 'undefined') {
        langTableCols = null;
        localStorage.removeItem('tagger_langTableCols');
    }

    const leftSel = document.getElementById('langEditLeftSel');
    const rightSel = document.getElementById('langEditRightSel');
    if (leftSel) leftSel.value = '0';
    if (rightSel) rightSel.value = ''; // 清掉舊值，讓右欄回到預設選項
    langEditPopulateSelects();
    langEditLoadLeft();
    langEditLoadRight();
    langEditUpdateBanner();
    allLabelsOrdered.forEach(lbl => {
        if (typeof updateRegionTextDisplay === 'function') updateRegionTextDisplay(lbl, sentenceTextMap[lbl]);
    });
    if (typeof updateLangViewMenuLabels === 'function') updateLangViewMenuLabels();
    langEditSearchRefreshIfOpen();

    if (typeof showToast === 'function') {
        showToast(`已刪除「${langEditGetLangName(delIdx)}」（可按 Ctrl+Z 復原）`, 'success');
    }
}

document.getElementById('langEditDeleteLangBtn')?.addEventListener('click', () => {
    document.getElementById('editMenu')?.classList.remove('show');
    const count = langEditGetExistingLangCount();
    if (count < 2) {
        if (typeof showToast === 'function') showToast('目前只有一種語言，沒有可刪除的語言', 'error');
        return;
    }
    // 預設選右欄目前的語言（右欄在「＋新增」時選最後一個語言）
    const rightIdx = parseInt(document.getElementById('langEditRightSel')?.value, 10);
    const defIdx = (!isNaN(rightIdx) && rightIdx < count) ? rightIdx : count - 1;
    let opts = '';
    for (let i = 0; i < count; i++) {
        opts += `<option value="${i}"${i === defIdx ? ' selected' : ''}>${langEditGetLangName(i)}</option>`;
    }
    showCustomDialog({
        title: '刪除語言',
        message: `要刪除哪一個語言？<br>
            <select id="langEditDeleteSel" class="input-select" style="margin:10px 0;">${opts}</select><br>
            <span style="color:#C62828; font-weight:bold;">該語言的文字會從每一句移除</span>，後面的語言會往前遞補（例如刪除語言2，原語言3變成語言2）。可按 Ctrl+Z 復原。`,
        confirmText: '刪除',
        onConfirm: () => {
            const idx = parseInt(document.getElementById('langEditDeleteSel')?.value, 10);
            if (!isNaN(idx) && idx >= 0 && idx < count) langEditDeleteLanguage(idx);
        }
    });
});

// ===== 尋找取代（範圍選單：全部／左欄／右欄） =====
// 沿用 4f 的浮動搜尋面板與 searchEngine，由面板「範圍」選單決定掃描哪一欄：
//   - 4f 的 updateSearchMatches / renderHighlights / scrollToCurrentMatch / 取代 / 全部取代
//     在 isLangEditView 為 true 時轉交給本區的 langEditSearch* 函式。
//   - 取代後：既有語言（左欄，或右欄選既有語言）一律自動存檔（行數需與句子數相符）；
//     右欄為「＋新增」語言時只改文字框，仍需按「匯入」。
//   - 「全部」：左右欄為同一既有語言時只掃左欄，避免重複計算。
//   - 命中以整段文字比對，可跨行。textarea 無法塗色，改以行號 gutter 底色標示命中行
//     （目前這筆較深）＋ 選取文字 ＋ 捲動到該行。
let langEditSearchScope = 'all'; // 'all' | 'left' | 'right'

function langEditSearchIsOpen() {
    return isLangEditView && !!document.getElementById('batchReplaceModalOverlay')?.classList.contains('show');
}
function langEditSearchGetTextarea(side) {
    return document.getElementById(side === 'left' ? 'langEditLeftText' : 'langEditRightText');
}
// 依範圍算出要掃描的欄位
function langEditSearchGetSides() {
    if (langEditSearchScope === 'left') return ['left'];
    if (langEditSearchScope === 'right') return ['right'];
    const l = parseInt(document.getElementById('langEditLeftSel')?.value, 10);
    const r = parseInt(document.getElementById('langEditRightSel')?.value, 10);
    if (langEditSideIsAutoSave('right') && l === r) return ['left']; // 同語言，右欄會自動同步，不重複掃
    return ['left', 'right'];
}
function langEditSearchScopeLabel() {
    return { all: '全部', left: '左欄', right: '右欄' }[langEditSearchScope] || '全部';
}

// 更新範圍選單、輸入框提示。只有「掃描範圍內含尚需匯入的新增語言」才顯示提醒，其餘不打擾。
function langEditSearchUpdateUI() {
    const scopeSel = document.getElementById('langEditSearchScopeSel');
    if (scopeSel) {
        scopeSel.style.display = isLangEditView ? '' : 'none';
        if (scopeSel.value !== langEditSearchScope) scopeSel.value = langEditSearchScope;
    }
    if (typeof findTextInput !== 'undefined' && findTextInput) findTextInput.placeholder = `尋找目標（${langEditSearchScopeLabel()}）`;
    // \n 只有勾選「正則」時才代表換行；未勾選時為純文字
    const regexOn = !!(typeof useRegexCheck !== 'undefined' && useRegexCheck && useRegexCheck.checked);
    const nlTip = regexOn ? '正則模式：\\n 代表換行（取代欄的 \\n 也會變成換行）' : '';
    if (typeof findTextInput !== 'undefined' && findTextInput) findTextInput.title = nlTip;
    const repInput = document.getElementById('replaceTextInput');
    if (repInput) repInput.title = nlTip;

    const hint = document.getElementById('langEditSearchHint');
    if (!hint) return;
    const needImport = langEditSearchGetSides().some(side => !langEditSideIsAutoSave(side));
    if (needImport) {
        hint.style.display = 'block';
        hint.style.color = '#E65100';
        hint.textContent = '⚠️ 右欄為「＋新增」語言，取代只改文字框，需按「匯入」才會生效';
    } else {
        hint.style.display = 'none';
    }
}

// 只在「正則」模式下，取代欄的「\n」才轉成換行；「\\」代表一個反斜線
//   （要取代成字面上的 \n 請寫 \\n）。未勾選正則時一律純文字。
function langEditSearchUnescape(str) {
    return String(str).replace(/\\([n\\])/g, (m, c) => (c === 'n' ? '\n' : '\\'));
}
function langEditSearchGetReplaceStr() {
    const raw = replaceTextInput.value;
    const regexOn = !!(useRegexCheck && useRegexCheck.checked);
    return regexOn ? langEditSearchUnescape(raw) : raw;
}
// 正則裡有 \n（且不是被跳脫的 \\n）才需要跨行比對；其餘維持「逐行」比對，避免 \s、[^x] 意外跨到下一行
function langEditSearchNeedsCrossLine(findStr) {
    return /\\n/.test(findStr.replace(/\\\\/g, ''));
}

// 掃描範圍內每一欄，結果存進 searchEngine.matches：{ side, line, start, end, absStart, absEnd }
//   line/start/end = 命中起點所在的行與行內位置（給行號底色用）；absStart/absEnd = 整段文字內的絕對位置（給選取、取代用）
//   - 正則且含 \n：對整段文字比對（可跨行）；
//   - 其餘（含未勾正則）：逐行比對，再換算成絕對位置。
function langEditSearchScan() {
    const findStr = findTextInput.value;
    const useRegex = useRegexCheck ? useRegexCheck.checked : false;
    searchEngine.matches = [];
    searchEngine.query = findStr;
    searchEngine.useRegex = useRegex;
    langEditSearchUpdateUI();

    if (findStr) {
        let searchRegex = null;
        let regexOk = true;
        if (useRegex) {
            // 'm'：讓 ^ $ 以「行」為單位
            try { searchRegex = new RegExp(findStr, 'gm'); } catch (e) { regexOk = false; }
        }
        const crossLine = useRegex && langEditSearchNeedsCrossLine(findStr);
        if (regexOk) {
            langEditSearchGetSides().forEach(side => {
                const text = langEditSearchGetTextarea(side).value;
                const lineStarts = [0];
                for (let i = 0; i < text.length; i++) if (text[i] === '\n') lineStarts.push(i + 1);
                const pushMatch = (absStart, absEnd) => {
                    // 二分搜尋：命中起點落在哪一行
                    let lo = 0, hi = lineStarts.length - 1;
                    while (lo < hi) {
                        const mid = (lo + hi + 1) >> 1;
                        if (lineStarts[mid] <= absStart) lo = mid; else hi = mid - 1;
                    }
                    searchEngine.matches.push({
                        side, line: lo,
                        start: absStart - lineStarts[lo], end: absEnd - lineStarts[lo],
                        absStart, absEnd
                    });
                };
                if (crossLine) {
                    findMatchesInString(text, findStr, searchRegex).forEach(m => pushMatch(m.start, m.end));
                } else {
                    text.split('\n').forEach((lineText, i) => {
                        findMatchesInString(lineText, findStr, searchRegex).forEach(m => {
                            pushMatch(lineStarts[i] + m.start, lineStarts[i] + m.end);
                        });
                    });
                }
            });
        }
    }

    if (searchEngine.currentIndex >= searchEngine.matches.length) searchEngine.currentIndex = Math.max(0, searchEngine.matches.length - 1);
    else if (searchEngine.currentIndex === -1 && searchEngine.matches.length > 0) searchEngine.currentIndex = 0;

    langEditSearchPaint();
}

// 重畫「命中計數」與「行號 gutter 底色」（不動 textarea 內容）
function langEditSearchPaint() {
    ['langEditLeftGutter', 'langEditRightGutter'].forEach(id => {
        document.getElementById(id)?.querySelectorAll('.lang-edit-gutter-line').forEach(el => { el.style.background = ''; });
    });

    const hasMatch = langEditSearchIsOpen() && searchEngine.query && searchEngine.matches.length > 0;
    if (typeof searchMatchCount !== 'undefined' && searchMatchCount) {
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
        const gutter = document.getElementById(m.side === 'left' ? 'langEditLeftGutter' : 'langEditRightGutter');
        const g = gutter?.children[m.line];
        if (!g) return;
        // 目前這一筆所在行用較深的橘色，其餘命中行用淡橘色
        g.style.background = (cur && m.side === cur.side && m.line === cur.line) ? '#FFB74D' : '#FFE0B2';
    });
}

// 選取目前命中的文字並捲動到該行（不搶輸入框焦點，才不會打字打到一半跳掉）
function langEditSearchScrollToCurrent() {
    if (searchEngine.currentIndex === -1 || searchEngine.matches.length === 0) return;
    const m = searchEngine.matches[searchEngine.currentIndex];
    if (!m) return;
    const ta = langEditSearchGetTextarea(m.side);
    if (!ta) return;

    ta.setSelectionRange(m.absStart, m.absEnd);

    const lh = langEditGetLineHeightPx(ta);
    const top = m.line * lh;
    if (top < ta.scrollTop || top + lh > ta.scrollTop + ta.clientHeight) {
        ta.scrollTop = Math.max(0, top - ta.clientHeight / 2); // 會觸發 scroll 事件，另一欄與 gutter 自動同步
    }
}

// 面板開著時，資料／欄位／語言有變就重掃一次
function langEditSearchRefreshIfOpen() {
    if (!langEditSearchIsOpen()) return;
    langEditSearchUpdateUI();
    if (findTextInput && findTextInput.value) langEditSearchScan();
}

// 把取代後的文字寫回指定欄位。既有語言：存快照後立刻自動存檔；「＋新增」右欄：只改文字框。
// 回傳 'saved' | 'unsaved'（行數對不上，沒存）| 'import-needed'（新增語言，需匯入）
function langEditSearchCommit(side, ta, newText) {
    if (langEditSideIsAutoSave(side)) {
        langEditFlushPendingWork();
        const willSave = langEditCountLines(newText) === allLabelsOrdered.length;
        if (willSave && typeof saveState === 'function') saveState(); // 存一次歷史快照
        ta.value = newText;
        if (willSave) langEditTryAutoSaveSide(side);
        langEditUpdateBanner();
        return willSave ? 'saved' : 'unsaved';
    }
    ta.value = newText;
    langEditUpdateBanner();
    return 'import-needed';
}

function langEditSearchReplaceSingle() {
    langEditSearchScan(); // 動手前重掃，避免命中位置過期
    if (searchEngine.matches.length === 0 || searchEngine.currentIndex === -1) return;
    const replaceStr = langEditSearchGetReplaceStr();
    if (replaceStrBreaksLangStructure(replaceStr)) return warnReplaceHasDelimiter();

    const m = searchEngine.matches[searchEngine.currentIndex];
    const ta = langEditSearchGetTextarea(m.side);
    const text = ta.value;
    const newText = text.substring(0, m.absStart) + replaceStr + text.substring(m.absEnd);
    const result = langEditSearchCommit(m.side, ta, newText);
    if (result === 'unsaved' && typeof showToast === 'function') {
        showToast(`${m.side === 'left' ? '左欄' : '右欄'}行數與句子數不符，已取代但尚未存檔（行數補齊後會自動存檔）`, 'error');
    }
    langEditSearchScan();
    langEditSearchScrollToCurrent();
}

function langEditSearchReplaceAll() {
    langEditSearchScan();
    if (searchEngine.matches.length === 0) return;
    const replaceStr = langEditSearchGetReplaceStr();
    if (replaceStrBreaksLangStructure(replaceStr)) return warnReplaceHasDelimiter();

    const count = searchEngine.matches.length;
    const scopeLabel = langEditSearchScopeLabel();
    const results = [];

    ['left', 'right'].forEach(side => {
        const sideMatches = searchEngine.matches.filter(m => m.side === side);
        if (sideMatches.length === 0) return;
        const ta = langEditSearchGetTextarea(side);
        let text = ta.value;
        // 由後往前取代，前面的絕對位置才不會位移
        sideMatches.slice().sort((a, b) => b.absStart - a.absStart).forEach(m => {
            text = text.substring(0, m.absStart) + replaceStr + text.substring(m.absEnd);
        });
        results.push(langEditSearchCommit(side, ta, text));
    });

    if (typeof showToast === 'function') {
        if (results.includes('unsaved')) showToast(`（${scopeLabel}）共替換 ${count} 處，但行數與句子數不符，尚未存檔（行數補齊後會自動存檔）`, 'error');
        else if (results.includes('import-needed')) showToast(`（${scopeLabel}）共替換 ${count} 處。⚠️ 新增語言尚未存入資料，請按「匯入」才會生效`, 'normal');
        else showToast(`替換完成！（${scopeLabel}）共替換 ${count} 處，已自動存檔`, 'success');
    }
    // 取代後保留尋找框內容，只重新掃描
    searchEngine.currentIndex = -1;
    langEditSearchScan();
}

// ---------- 選單入口 ----------
function langEditOpenSearch() {
    langEditFlushPendingWork();
    document.getElementById('editMenu')?.classList.remove('show');
    document.getElementById('batchReplaceModalOverlay')?.classList.add('show');
    searchEngine.currentIndex = -1;
    langEditSearchUpdateUI();
    if (findTextInput && findTextInput.value) langEditSearchScan();
    setTimeout(() => { findTextInput?.focus(); findTextInput?.select(); }, 100);
}
document.getElementById('langEditFindBtn')?.addEventListener('click', (e) => { e.stopPropagation(); langEditOpenSearch(); });

// 範圍選單切換時重新掃描
document.getElementById('langEditSearchScopeSel')?.addEventListener('change', (e) => {
    langEditSearchScope = e.target.value;
    searchEngine.currentIndex = -1;
    langEditSearchUpdateUI();
    if (findTextInput && findTextInput.value) {
        langEditSearchScan();
        langEditSearchScrollToCurrent();
    } else {
        langEditSearchPaint();
    }
});

// Ctrl+F（4c 會去點 #openBatchReplaceBtn）在此模式下沿用上次選的範圍（預設全部）。
// 4f 的開啟處理會先跑，這裡只補上本模式的提示與掃描。
document.getElementById('openBatchReplaceBtn')?.addEventListener('click', () => {
    if (!isLangEditView) return;
    langEditSearchUpdateUI();
    if (findTextInput && findTextInput.value) langEditSearchScan();
});

// 關閉面板：清掉行號高亮與命中狀態（4f 的關閉處理會先跑）
document.getElementById('batchReplaceCancelBtn')?.addEventListener('click', () => {
    searchEngine.matches = [];
    searchEngine.currentIndex = -1;
    langEditSearchPaint();
});
