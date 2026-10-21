// ==========================================
// textTools.js — 文字工具：尋找取代、批次取代、編號、拼音、分詞、文字編輯、字數統計、語文工具箱
// （由原 script.js 拆分而來；於 index.html 中依序載入）
// ==========================================

/* ==========================================
   特殊合併與底線消除邏輯 (浮動按鈕 - 全域取代版)
   ========================================== */
let currentMatch = null; let activeSelectionRange = null; 
function hideFloatingTool() { floatingTool.style.display = 'none'; currentMatch = null; activeSelectionRange = null; }

function checkAndShowSpecialMerge(selectedText, pageX, pageY) {
    // 1. 舊有邏輯： A/B_C/D 特殊合併
    const parts = selectedText.split('_');
    if (parts.length >= 2 && parts.every(part => part.split('/').length === 2)) {
        // 🌟 加入 textToFind 記錄你選取的字串
        currentMatch = { textToFind: selectedText, textToReplace: parts.map(p => p.split('/')[0]).join('\\') + '/' + parts.map(p => p.split('/')[1]).join('\\'), type: 'merge' };
        floatingTool.textContent = '✨ 特殊合併'; // 動態按鈕文字
        floatingTool.style.left = `${pageX - 40}px`; floatingTool.style.top = `${pageY - 50}px`; floatingTool.style.display = 'block'; 
        return true;
    }

    // 2. 新增邏輯： _飛_官_ 格式底線消除
    if (selectedText.startsWith('_') && selectedText.endsWith('_')) {
        const innerStr = selectedText.slice(1, -1); 
        if (innerStr.includes('_')) { // 條件：中間必須至少還有一個底線
            const nonUnderscores = innerStr.replace(/_/g, ''); 
            // 條件：扣除底線後，必須有文字且在 6 個字元以內
            if (nonUnderscores.length > 0 && nonUnderscores.length <= 6) {
                // 🌟 加入 textToFind 記錄你選取的字串
                currentMatch = { textToFind: selectedText, textToReplace: '_' + nonUnderscores + '_', type: 'remove_underscore' };
                floatingTool.textContent = '✨ 刪中底線'; // 動態按鈕文字
                floatingTool.style.left = `${pageX - 40}px`; floatingTool.style.top = `${pageY - 50}px`; floatingTool.style.display = 'block'; 
                return true;
            }
        }
    }
    return false;
}

document.addEventListener('mouseup', (e) => {
    if (e.target === floatingTool || e.target.closest('.icon-btn') || e.target.classList.contains('resize-handle') || e.target.closest('.btn-col-menu') || e.target.closest('.btn-row-menu')) return;
    setTimeout(() => {
        if (currentMode === 'text' && document.activeElement === editor) {
            if (editor.selectionStart !== editor.selectionEnd) { checkAndShowSpecialMerge(editor.value.substring(editor.selectionStart, editor.selectionEnd), e.pageX, e.pageY); return; }
        } else if (currentMode === 'table') {
            const sel = window.getSelection();
            if (!sel.isCollapsed && sel.rangeCount > 0 && dataTable.contains(sel.anchorNode)) {
                if (checkAndShowSpecialMerge(sel.toString(), e.pageX, e.pageY)) { activeSelectionRange = sel.getRangeAt(0).cloneRange(); return; }
            }
        }
        hideFloatingTool();
    }, 10);
});

floatingTool.addEventListener('click', () => {
    if (!currentMatch) return;
    
    // 🌟 建立全域取代的正則表達式 (安全跳脫字元，避免符號引發錯誤)
    const safeFindStr = currentMatch.textToFind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const globalRegex = new RegExp(safeFindStr, 'g');
    let count = 0;

    // 🌟 全域掃描與取代邏輯
    if (currentMode === 'text') {
        const originalText = editor.value;
        const newText = originalText.replace(globalRegex, currentMatch.textToReplace);
        
        if (originalText !== newText) {
            count = (originalText.match(globalRegex) || []).length; // 計算替換了幾個
            editor.value = newText;
            updateLineNumbers();
        }
    } else if (currentMode === 'table') {
        const cells = dataTable.querySelectorAll('.td-inner');
        cells.forEach(cell => {
            let text = cell.hasAttribute('data-formula') ? cell.getAttribute('data-formula') : getCellText(cell);
            if (globalRegex.test(text)) {
                const matches = text.match(globalRegex);
                count += matches ? matches.length : 0; // 計算替換了幾個
                const newText = text.replace(globalRegex, currentMatch.textToReplace);
                
                if (cell.hasAttribute('data-formula')) {
                    cell.setAttribute('data-formula', newText);
                } else {
                    cell.innerText = newText;
                }
            }
        });
        if (count > 0) recalculateAllFormulas();
    }
    
    // 動態顯示精準的提示訊息
    const msg = currentMatch.type === 'remove_underscore' ? `✨ 已將全部 ${count} 個目標的中間底線移除！` : `✨ 已完成 ${count} 筆特殊合併！`;
    
    hideFloatingTool(); 
    debouncedSaveHistory(); // 存檔支援 Ctrl+Z 復原
    showToast(msg);
});




/* ==========================================
   尋找與取代 核心模組
   ========================================== */
const findReplaceModal = document.getElementById('findReplaceModal');
const findInput = document.getElementById('findInput');
const replaceInput = document.getElementById('replaceInput');
const msgFind = document.getElementById('findReplaceMessage');

let lastMatchedCell = null; // 追蹤目前找到的儲存格內部元素

// 展開/收合進階設定
document.getElementById('btnToggleAdvancedSearch').addEventListener('click', () => {
    const opts = document.getElementById('advancedSearchOptions');
    const icon = document.getElementById('advancedSearchIcon');
    opts.classList.toggle('hidden');
    icon.textContent = opts.classList.contains('hidden') ? 'arrow_right' : 'arrow_drop_down';
});

// 輔助函數：將視窗精準置中
function centerModal(modal) {
    // 只有在「第一次打開」時才置中，這樣使用者拖曳後的位置才會被保留
    if (!modal.style.left) {
        modal.style.left = (window.innerWidth - modal.offsetWidth) / 2 + 'px';
        // 高度設定乘以 0.4，讓視窗稍微偏上一點點，視覺上最舒適
        modal.style.top = (window.innerHeight - modal.offsetHeight) * 0.4 + 'px'; 
    }
}

// 開啟/關閉視窗
document.getElementById('btnFindReplace').addEventListener('click', () => {
    findReplaceModal.classList.toggle('hidden');
    if (!findReplaceModal.classList.contains('hidden')) { 
        centerModal(findReplaceModal);
        
        let hasSelection = false;
        if (currentMode === 'text' && editor.selectionStart !== editor.selectionEnd) {
            hasSelection = true;
            const selectedText = editor.value.substring(editor.selectionStart, editor.selectionEnd);
            // 自動帶入單行選取文字到尋找框
            if (!selectedText.includes('\n')) {
                    findInput.value = selectedText;
                    localStorage.setItem(FIND_TEXT_KEY, selectedText);
                    updateFindReplaceClearButtons();
                }
        }
        
        if (!hasSelection) {
            findInput.focus(); 
            findInput.select(); 
        }
    } else {
        if (currentMode === 'text') editor.focus();
    }
});

document.getElementById('btnCloseFindReplace').addEventListener('click', () => {
    findReplaceModal.classList.add('hidden');
    if (currentMode === 'text') editor.focus();
});


// 視窗全區拖曳功能
let isDraggingFR = false, dragStartX = 0, dragStartY = 0, frStartLeft = 0, frStartTop = 0;
findReplaceModal.addEventListener('mousedown', (e) => {
    // 排除點擊輸入框、按鈕、表格等可互動元素
    if (e.target.closest('input, button, label, select, textarea, td, th')) return;
    
    if (!window.matchMedia || !window.matchMedia('(pointer: coarse)').matches) {
        e.preventDefault(); 
    }
    
    isDraggingFR = true; dragStartX = e.clientX; dragStartY = e.clientY;
    const rect = findReplaceModal.getBoundingClientRect();
    frStartLeft = rect.left; frStartTop = rect.top;
    document.body.style.userSelect = 'none'; // 拖曳時防止文字被意外反白
});

document.addEventListener('mousemove', (e) => {
    if (!isDraggingFR) return;
    findReplaceModal.style.left = `${frStartLeft + (e.clientX - dragStartX)}px`;
    findReplaceModal.style.top = `${frStartTop + (e.clientY - dragStartY)}px`;
    findReplaceModal.style.right = 'auto'; 
});

document.addEventListener('mouseup', () => { 
    isDraggingFR = false; 
    document.body.style.userSelect = ''; // 恢復文字選取功能
});

// ====== 新增：行動版觸控拖曳支援 (尋找與取代) ======
findReplaceModal.addEventListener('touchstart', (e) => {
    // 手機版同樣把這些可輸入、可選取的區域排除
    if (e.target.closest('input, button, label, select, textarea, td, th')) return;
    
    const touch = e.touches[0];
    isDraggingFR = true; 
    dragStartX = touch.clientX; 
    dragStartY = touch.clientY;
    const rect = findReplaceModal.getBoundingClientRect();
    frStartLeft = rect.left; 
    frStartTop = rect.top;
    
    // 避免觸控到非輸入/滾動區時觸發螢幕整體滾動
    if (!e.target.closest('input, textarea, select, td, th')) e.preventDefault(); 
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!isDraggingFR) return;
    const touch = e.touches[0];
    findReplaceModal.style.left = `${frStartLeft + (touch.clientX - dragStartX)}px`;
    findReplaceModal.style.top = `${frStartTop + (touch.clientY - dragStartY)}px`;
    findReplaceModal.style.right = 'auto'; 
    e.preventDefault(); // 拖曳時禁止畫面跟著滾動
}, { passive: false });

document.addEventListener('touchend', () => { 
    isDraggingFR = false; 
});
// ==========================================
// ==========================================

// 顯示頂端提示訊息
let msgTimeout;
function showFRMsg(text, isError = true) {
    clearTimeout(msgTimeout);
    msgFind.textContent = text;
    msgFind.className = `text-base ${isError ? 'font-bold text-red-500' : 'text-green-600'}`;
    
    msgTimeout = setTimeout(() => {
        msgFind.textContent = '尋找與取代';
        msgFind.className = 'text-gray-700 text-base';
    }, 3000);
}

// 建立正則表達式引擎
function buildSearchRegex(isGlobal = false) {
    let term = findInput.value;
    if (!term) return null;

    const isRegex = document.getElementById('chkRegex').checked;
    const isCase = document.getElementById('chkCaseSensitive').checked;
    const isWhole = document.getElementById('chkWholeWord').checked;
    const isPrefix = document.getElementById('chkPrefixMatch').checked;
    const isSuffix = document.getElementById('chkSuffixMatch').checked;
    const isCell = document.getElementById('chkCellMatch').checked;

    if (!isRegex) term = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (currentMode === 'table' && isCell) {
        term = '^' + term + '$';
    } else {
        if (isWhole) term = '\\b' + term + '\\b';
        else {
            if (isPrefix) term = '^' + term + '|\\b' + term; 
            if (isSuffix) term = term + '$|' + term + '\\b';
        }
    }

    try { 
        // 加上 'u' 標誌，完美支援擴充漢字
        const flags = (isCase ? '' : 'i') + (isGlobal ? 'g' : '') + 'u';
        return new RegExp(term, flags); 
    } 
    catch (e) { showFRMsg('正則語法錯誤'); return null; }
}

// 判斷當前選取狀態
function getSelectionContext() {
    if (currentMode === 'text') {
        return { hasSelection: editor.selectionStart !== editor.selectionEnd, start: editor.selectionStart, end: editor.selectionEnd };
    } else {
        // 判斷是否為「大於一格的範圍多選」。如果只是單點一格，就不限制搜尋範圍。
        const isMultiSelect = selectedRows.length > 0 || 
                              selectedCols.length > 0 || 
                              selectedCellBlocks.length > 1 || 
                              (selectedCellBlocks.length === 1 && (selectedCellBlocks[0].startR !== selectedCellBlocks[0].endR || selectedCellBlocks[0].startC !== selectedCellBlocks[0].endC));
        return { hasSelection: isMultiSelect };
    }
}

// 收集目標儲存格
function getTargetCells() {
    const rows = dataTable.querySelectorAll('tbody tr');
    let cells = [];
    const context = getSelectionContext();
    
    for (let r = 0; r < rows.length; r++) {
        const tds = rows[r].querySelectorAll('.td-inner');
        for (let c = 0; c < tds.length; c++) {
            if (!context.hasSelection || selectedRows.includes(r) || selectedCols.includes(c) || isCellInAnyBlock(r, c)) {
                cells.push({ row: r, col: c, inner: tds[c] });
            }
        }
    }
    return cells;
}

// --- 核心尋找函數 ---
function executeFind(isDown) {
    const regex = buildSearchRegex();
    if (!regex) return;

    if (currentMode === 'text') {
        const text = editor.value;
        const globalRegex = buildSearchRegex(true); // 取得全域正則以計算總數
        const matchIndices = [];
        let m;
        
        // 1. 預先掃描所有符合的目標位置
        while ((m = globalRegex.exec(text)) !== null) {
            matchIndices.push({ start: m.index, end: m.index + m[0].length });
            if (m.index === globalRegex.lastIndex) globalRegex.lastIndex++; // 防呆，避免無窮迴圈
        }

        const totalMatches = matchIndices.length;
        if (totalMatches === 0) {
            showFRMsg('找不到目標');
            return;
        }

        const cursor = isDown ? editor.selectionEnd : editor.selectionStart;
        let targetIndex = -1;
        let isWrapped = false;
        let isFirstSearch = (editor.selectionStart === editor.selectionEnd && editor.selectionStart === 0);

        // 2. 智慧尋找「下一個」或「上一個」目標
        if (isDown) {
            // 往下找：尋找結束位置「大於」目前游標的目標
            targetIndex = matchIndices.findIndex(match => match.end > cursor);
            if (targetIndex === -1) {
                targetIndex = 0; // 循環回第一個
                if (!isFirstSearch) isWrapped = true;
            }
        } else {
            // 往上找：尋找起始位置「小於」目前游標的目標
            for (let i = matchIndices.length - 1; i >= 0; i--) {
                if (matchIndices[i].start < cursor) {
                    targetIndex = i;
                    break;
                }
            }
            if (targetIndex === -1) {
                targetIndex = matchIndices.length - 1; // 循環回最後一個
                if (!isFirstSearch) isWrapped = true;
            }
        }

        // 3. 取得最終目標並計算 X/Y 進度
        const finalMatch = matchIndices[targetIndex];
        const matchStart = finalMatch.start;
        const matchEnd = finalMatch.end;
        const currentIndexDisplay = targetIndex + 1; // 第幾個目標

        // 4. 選取文字並聚焦
        editor.setSelectionRange(matchStart, matchEnd);
        editor.focus();
        
        const style = window.getComputedStyle(editor);
        mirror.style.fontFamily = style.fontFamily; 
        mirror.style.fontSize = style.fontSize;
        mirror.style.lineHeight = style.lineHeight; 
        mirror.style.whiteSpace = style.whiteSpace; 
        mirror.style.wordBreak = style.wordBreak;
        mirror.style.width = `${editor.clientWidth - parseFloat(style.paddingLeft || 0) - parseFloat(style.paddingRight || 0)}px`;
        
        // 測量文字高度以精準捲動置中
        mirror.textContent = editor.value.substring(0, matchStart) + 'A';
        const lineHeightStr = style.lineHeight;
        const lineHeight = lineHeightStr === 'normal' ? 24 : parseFloat(lineHeightStr);
        const paddingTop = parseFloat(style.paddingTop || 0);
        const bottomY = mirror.scrollHeight + paddingTop;
        const topY = bottomY - lineHeight;
        const currentScroll = editor.scrollTop;
        const clientHeight = editor.clientHeight;

        if (topY < currentScroll || bottomY > currentScroll + clientHeight) {
            const targetScrollTop = topY - (clientHeight / 2);
            editor.scrollTop = Math.max(0, targetScrollTop);
        }

        // ✨ 顯示 X/Y 提示訊息
        const msgPrefix = isWrapped ? '重找：' : '找到：';
        showFRMsg(`${msgPrefix}${currentIndexDisplay}/${totalMatches}`, false);

    } else {
        const cells = getTargetCells();
        if (cells.length === 0) return;

        const isFormulaMatch = document.getElementById('chkFormulaMatch')?.checked;
        const matchedIndices = [];
        
        // 1. 預先掃描表格內所有符合的儲存格
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            let textToSearch = getCellText(cell.inner);
            if (isFormulaMatch && cell.inner.hasAttribute('data-formula')) {
                textToSearch = cell.inner.getAttribute('data-formula');
            }
            // 每次建立獨立的 Regex 以策安全
            const freshRegex = buildSearchRegex(); 
            if (freshRegex.test(textToSearch)) {
                matchedIndices.push(i);
            }
        }

        const totalMatches = matchedIndices.length;
        if (totalMatches === 0) {
            showFRMsg('找不到目標');
            return;
        }

        // 2. 決定目前的起點索引
        let currentIdx = -1;
        if (lastMatchedCell) {
            currentIdx = cells.findIndex(c => c.inner === lastMatchedCell);
        } else {
            let targetInner = document.activeElement.closest('.td-inner');
            if (!targetInner && lastClickedCell) {
                const rows = dataTable.querySelectorAll('tbody tr');
                if (rows[lastClickedCell.r]) {
                    targetInner = rows[lastClickedCell.r].children[lastClickedCell.c + 1]?.querySelector('.td-inner');
                }
            }
            if (targetInner) {
                currentIdx = cells.findIndex(c => c.inner === targetInner);
            }
        }

        // 3. 智慧尋找「下一個」或「上一個」目標
        let targetMatchIndex = -1;
        let isWrapped = false;
        let isFirstSearch = (currentIdx === -1);

        if (isDown) {
            targetMatchIndex = matchedIndices.findIndex(idx => idx > currentIdx);
            if (targetMatchIndex === -1) {
                targetMatchIndex = 0; // 循環回第一個
                if (!isFirstSearch) isWrapped = true;
            }
        } else {
            for (let j = matchedIndices.length - 1; j >= 0; j--) {
                if (matchedIndices[j] < currentIdx) {
                    targetMatchIndex = j;
                    break;
                }
            }
            if (targetMatchIndex === -1) {
                targetMatchIndex = matchedIndices.length - 1; // 循環回最後一個
                if (!isFirstSearch) isWrapped = true;
            }
        }

        // 4. 取得最終目標並計算 X/Y 進度
        const checkIdx = matchedIndices[targetMatchIndex];
        const cell = cells[checkIdx];
        const currentIndexDisplay = targetMatchIndex + 1;

        // 5. 畫面滾動與視覺狀態標記
        lastMatchedCell = cell.inner;
        lastMatchedCell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        
        cell.inner.focus();

        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(cell.inner);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);

        const context = getSelectionContext();
        if (window.lastFoundTd) {
            window.lastFoundTd.style.removeProperty('background-color');
            window.lastFoundTd.style.removeProperty('outline');
            window.lastFoundTd.style.removeProperty('outline-offset');
            window.lastFoundTd = null;
        }

        if (!context.hasSelection) {
            lastClickedCell = { r: cell.row, c: cell.col };
            selectedCellBlocks = [{ startR: cell.row, startC: cell.col, endR: cell.row, endC: cell.col }];
            selectedRows = []; 
            selectedCols = [];
            applySelectionVisuals(); 
        } else {
            const activeTd = cell.inner.closest('td');
            if (activeTd) {
                activeTd.style.setProperty('background-color', '#ffffff', 'important');
                activeTd.style.setProperty('outline', '2px solid #3b82f6', 'important');
                activeTd.style.setProperty('outline-offset', '-2px', 'important');
                window.lastFoundTd = activeTd;
            }

            if (!window.hasFindClickClear) {
                document.addEventListener('mousedown', (e) => {
                    if (!e.target.closest('#findReplaceModal') && window.lastFoundTd) {
                        window.lastFoundTd.style.removeProperty('background-color');
                        window.lastFoundTd.style.removeProperty('outline');
                        window.lastFoundTd.style.removeProperty('outline-offset');
                        window.lastFoundTd = null;
                    }
                });
                window.hasFindClickClear = true;
            }
        }

        // ✨ 顯示 X/Y 提示訊息
        const msgPrefix = isWrapped ? '重找：' : '找到：';
        showFRMsg(`${msgPrefix}${currentIndexDisplay}/${totalMatches}`, false);
    }
}




// 綁定前一個/後一個按鈕
document.getElementById('btnFindNext').addEventListener('click', () => executeFind(true));
document.getElementById('btnFindPrev').addEventListener('click', () => executeFind(false));

// --- 取代 ---
document.getElementById('btnReplace').addEventListener('click', () => {
    const regex = buildSearchRegex();
    if (!regex) return;
	let replaceWith = replaceInput.value;
    const isRegex = document.getElementById('chkRegex').checked;
    if (isRegex) {
        replaceWith = replaceWith.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    }
    
    const isDown = document.querySelector('input[name="searchDirection"]:checked')?.value !== 'up';
    if (currentMode === 'text') {
        const selected = editor.value.substring(editor.selectionStart, editor.selectionEnd);
        if (regex.test(selected)) {
            const newText = selected.replace(regex, replaceWith);
            editor.setRangeText(newText, editor.selectionStart, editor.selectionEnd, 'end');
            debouncedSaveHistory();
            executeFind(isDown); 
        } else {
            executeFind(isDown);
        }
    } else {
        let targetCell = lastMatchedCell || document.activeElement.closest('.td-inner');
        
        if (!targetCell && lastClickedCell) {
            const rows = dataTable.querySelectorAll('tbody tr');
            if (rows[lastClickedCell.r]) {
                targetCell = rows[lastClickedCell.r].children[lastClickedCell.c + 1]?.querySelector('.td-inner');
            }
        }

        const isFormulaMatch = document.getElementById('chkFormulaMatch')?.checked;

        if (targetCell) {
            // 判斷要取代的是公式還是表面文字
            let textToSearch = targetCell.innerText;
            if (isFormulaMatch && targetCell.hasAttribute('data-formula')) {
                textToSearch = targetCell.getAttribute('data-formula');
            }

            if (regex.test(textToSearch)) {
                // ======== 關鍵修正：取得帶有全域 (g) 旗標的搜尋條件 ========
                const globalRegex = buildSearchRegex(true);
                // 使用全域條件來取代，確保儲存格內的所有目標都被換掉
                let newText = textToSearch.replace(globalRegex, replaceWith);
                // ==============================================================
                
                // 如果是替換公式，就把新公式存回屬性中
                if (isFormulaMatch && targetCell.hasAttribute('data-formula')) {
                    targetCell.setAttribute('data-formula', newText);
                } else {
                    targetCell.innerText = newText;
                    // 如果取代後不再是公式，移除公式標記
                    if (!newText.startsWith('=')) targetCell.removeAttribute('data-formula');
                }
                
                // 觸發全表重新計算，讓新公式立即生效顯示
                recalculateAllFormulas();
                debouncedSaveHistory();
                executeFind(isDown); 
            } else {
                executeFind(isDown); 
            }
        }
    }
});

// --- 全部取代 ---
// --- 全部取代 (支援套用到所有頁籤) ---
document.getElementById('btnReplaceAll').addEventListener('click', () => {
    const globalRegex = buildSearchRegex(true);
    if (!globalRegex) return;
    let replaceWith = replaceInput.value;
    const isRegex = document.getElementById('chkRegex').checked;
    if (isRegex) {
        replaceWith = replaceWith.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    }
    
    const isFormulaMatch = document.getElementById('chkFormulaMatch')?.checked;
    const chkAllTabs = document.getElementById('chkAllTabs')?.checked;
    
    let count = 0;

    // 邏輯分支：是否套用到所有頁籤
    if (chkAllTabs) {
        // 1. 先將當下畫面最新的資料存入 sheetTabs
        saveAllTabsData(); 

        // 2. 遍歷所有頁籤進行背景替換
        sheetTabs.forEach((tab) => {
            if (tab.mode === 'text') {
                const matches = tab.content.match(globalRegex);
                if (matches) {
                    count += matches.length;
                    tab.content = tab.content.replace(globalRegex, replaceWith);
                }
            } else {
                // 表格模式：在背景解析 TSV 並取代
                if (!tab.content) return;
                const data = parseTSV(tab.content);
                let tabCount = 0;
                
                const newData = data.map(row => {
                    return row.map(cellText => {
                        // 若未勾選「公式文字」，且開頭是等號，則跳過不取代
                        if (!isFormulaMatch && cellText.startsWith('=')) return cellText;

                        if (globalRegex.test(cellText)) {
                            const m = cellText.match(globalRegex);
                            tabCount += m ? m.length : 0;
                            return cellText.replace(globalRegex, replaceWith);
                        }
                        return cellText;
                    });
                });

                if (tabCount > 0) {
                    count += tabCount;
                    // 將陣列轉回 TSV 格式儲存
                    tab.content = newData.map(row => {
                        return row.map(cell => {
                            if (cell.includes('"') || cell.includes('\n') || cell.includes('\t')) {
                                return '"' + cell.replace(/"/g, '""') + '"';
                            }
                            return cell;
                        }).join('\t');
                    }).join('\n');
                }
            }
        });

		if (count > 0) {
            // 3. 將更新後的資料寫回 LocalStorage
            writeTabsToStorage(); // 與自動存檔共用：不存龐大的歷史、並處理空間不足
            
            // 將當前頁籤「已經被取代完成」的新內容，同步回目前的編輯器中！
            editor.value = sheetTabs[activeSheetIndex].content;

            // 4. 強制重新渲染目前畫面
            switchMode(currentMode, true);
            debouncedSaveHistory();
        }

    } else {
        // 保持原有的單一頁籤 (目前畫面) 取代邏輯
        const context = getSelectionContext();

        if (currentMode === 'text') {
            const text = editor.value;
            if (context.hasSelection) {
                const selectedText = text.substring(context.start, context.end);
                count = (selectedText.match(globalRegex) || []).length;
                if (count > 0) {
                    const newText = selectedText.replace(globalRegex, replaceWith);
                    editor.setRangeText(newText, context.start, context.end, 'select');
                }
            } else {
                count = (text.match(globalRegex) || []).length;
                if (count > 0) editor.value = text.replace(globalRegex, replaceWith);
            }
            if (count > 0) { debouncedSaveHistory(); updateLineNumbers(); }
        } else {
            const cells = getTargetCells();
            
            cells.forEach(cell => {
                let textToSearch = getCellText(cell.inner);
                if (isFormulaMatch && cell.inner.hasAttribute('data-formula')) {
                    textToSearch = cell.inner.getAttribute('data-formula');
                }

                if (globalRegex.test(textToSearch)) {
                    const matches = textToSearch.match(globalRegex);
                    count += matches ? matches.length : 0;
                    
                    let newText = textToSearch.replace(globalRegex, replaceWith);
                    
                    if (isFormulaMatch && cell.inner.hasAttribute('data-formula')) {
                        cell.inner.setAttribute('data-formula', newText);
                    } else {
                        cell.inner.innerText = newText;
                        if (!newText.startsWith('=')) cell.inner.removeAttribute('data-formula');
                    }
                }
            });
            
            if (count > 0) {
                recalculateAllFormulas();
                debouncedSaveHistory();
            }
        }
    }
    
    if (count > 0) showFRMsg(`完成 ${count} 筆取代`, false);
    else showFRMsg('找不到目標');
});


/* ==========================================
   數字 <-> 0-z (Base62) 編碼 輔助函數
   字元順序：0-9、A-Z、a-z，共 62 碼
   ========================================== */
const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function numberToBase62(numStr) {
    let n = BigInt(numStr);
    if (n === 0n) return '0';
    const neg = n < 0n;
    if (neg) n = -n;
    let result = '';
    while (n > 0n) {
        result = BASE62_CHARS[Number(n % 62n)] + result;
        n = n / 62n;
    }
    return neg ? '-' + result : result;
}

function base62ToNumber(str) {
    let s = str;
    const neg = s.startsWith('-');
    if (neg) s = s.slice(1);
    if (!s) throw new Error('empty base62 string');
    let n = 0n;
    for (const ch of s) {
        const idx = BASE62_CHARS.indexOf(ch);
        if (idx === -1) throw new Error(`invalid base62 character: ${ch}`);
        n = n * 62n + BigInt(idx);
    }
    return neg ? -n : n;
}

/* ==========================================
   文字模式專屬：文字編輯工具 (十二合一排版引擎)
   ========================================== */
function applyTextTool(action) {
    if (currentMode !== 'text') {
        showToast('⚠️ 此功能僅能在文字模式使用');
        return;
    }

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const hasSelection = start !== end;
    
    // 如果有反白選取文字，就只處理選取的部分；否則處理全文
    const textToProcess = hasSelection ? editor.value.substring(start, end) : editor.value;
    if (!textToProcess) return;

    let newText = '';

    if (action === 'break') {
        const lines = textToProcess.split('\n');
        const brokenLines = lines.map(line => {
            if (line.trim() === '') return line; 
            let broken = line.replace(/([：:][‘“「『〈《【（\(<"']+)(?![ \t]*\n)/g, '$1\n');
            broken = broken.replace(/([。，、；！？\.,!?;．]+|……|…|──|—|～|~+|﹏+|＿+)([’”」』〉》】）\)\]"']*)(?![ \t]*\n)/g, '$1$2\n');
            
            return `######\n${broken.trimEnd()}\n######`;
        });
        newText = brokenLines.join('\n');
    }
    else if (action === 'join') {
        if (textToProcess.includes('######')) {
            const lines = textToProcess.split('\n');
            const result = [];
            let inBlock = false, currentBlock = [];
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.trim() === '######') {
                    if (inBlock) { result.push(currentBlock.join('')); currentBlock = []; inBlock = false; } 
                    else { inBlock = true; }
                } else {
                    if (inBlock) currentBlock.push(line); else result.push(line);
                }
            }
            if (inBlock && currentBlock.length > 0) result.push(currentBlock.join(''));
            newText = result.join('\n');
        } else {
            const paragraphs = textToProcess.split(/\n{2,}/);
            const joined = paragraphs.map(p => p.replace(/([a-zA-Z0-9])\n([a-zA-Z0-9])/g, '$1 $2').replace(/\n/g, ''));
            newText = joined.join('\n\n');
        }

    // ======== 新增的 8 個排版功能 ========
    }else if (action === 'sort-az') {
        newText = textToProcess.split('\n').sort((a, b) => a.localeCompare(b, 'zh-TW', { numeric: true })).join('\n');

    }else if (action === 'sort-za') {
        newText = textToProcess.split('\n').sort((a, b) => b.localeCompare(a, 'zh-TW', { numeric: true })).join('\n');
    }
    else if (action === 'remove-dup') {
        // 先過濾掉所有的空行，再使用 Set 資料結構過濾重複行
        newText = [...new Set(textToProcess.split('\n').filter(line => line.trim() !== ''))].join('\n');

    }else if (action === 'remove-empty') {
        // 過濾掉全空白或無字元的行
        newText = textToProcess.split('\n').filter(line => line.trim() !== '').join('\n');

	}else if (action === 'remove-trailing-empty') {
        // 匹配字串尾端連續的「換行符號 + 任意空白/Tab/全形空白」，並將其清除
        newText = textToProcess.replace(/(?:\r?\n[\t \u3000]*)+$/g, '');
    }
    else if (action === 'trim-space') {
        // 移除每行字首字尾的半形空白、全形空白(\u3000)、TAB(\t)
        newText = textToProcess.split('\n').map(line => line.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '')).join('\n');
    
    }else if (action === 'capitalize') {
        // 句首大寫引擎：在「每行開頭」或「句尾標點 + 引號/空白」之後的第一個拉丁字母進行大寫轉換
        // 注意：在 u 旗標下，方括號內的 . ! ? 不需要也不可以加斜線跳脫
        newText = textToProcess.replace(/(^|[。！？.!?"'「『]\s*)([\p{sc=Latn}])/gmu, (match, prefix, letter) => {
            return prefix + letter.toUpperCase();
        });
    
    }else if (action === 'lowercase') {
        // 原生 toLowerCase 已完美支援 Unicode 拼音與擴充字元
        newText = textToProcess.toLowerCase();

	} else if (action === 'number-superscript') {
        // 數字轉上標：利用對照表，將所有文字中的數字 (0-9) 替換為上標字元
        const superMap = {'0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'};
        newText = textToProcess.replace(/[0-9]/g, match => superMap[match]);
        
    } else if (action === 'pinyin-superscript') {
        // 拼音尾數轉上標：利用 \p{Script=Latin} 和 \p{M} 匹配拉丁字母(含國際音標)與聲調符號，後方緊接數字時才進行轉換
        const superMap = {'0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'};
        newText = textToProcess.replace(/([\p{Script=Latin}\p{M}]+)([0-9]+)/gu, (match, letters, digits) => {
            const superDigits = digits.split('').map(d => superMap[d]).join('');
            return letters + superDigits;
        });

    } else if (action === 'remove-superscript') {
        // 取消上標：將所有上標字元還原為一般數字
        const normalMap = {'⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9'};
        newText = textToProcess.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, match => normalMap[match]);
    
    } else if (action === 'hakka-tone') {
        // 校正客語聲調：ˊ ˇ ˋ ˆ ⁺
        const toneMap = {'´': 'ˊ', '`': 'ˋ', '^': 'ˆ', '+': '⁺'};
        // 步驟一：韻尾字母 [mngbdraeiou] 後方的 ´ ` ^ + 換成正確聲調符號
        newText = textToProcess.replace(/([mngbdraeiou])([´`^+])/gi, (m, letter, mark) => letter + toneMap[mark]);
        // 步驟二：聲調符號後若緊接拉丁字母，統一補成「剛好一個半形空白」（不跨行、不動 Tab）
        newText = newText.replace(/([ˊˇˋˆ⁺])[ \u00A0\u3000]*(?=\p{Script=Latin})/gu, '$1 ');
    
    }else if (action === 'uppercase') {
        // 原生 toUpperCase 已完美支援 Unicode 拼音與擴充字元
        newText = textToProcess.toUpperCase();
    
	// 轉為全形
    }else if (action === 'to-fullwidth') {
        newText = textToProcess.replace(/[!-~]/g, function(ch) {
            // ASCII 字元位移 65248 轉為全形
            return String.fromCharCode(ch.charCodeAt(0) + 65248);
        }).replace(/ /g, '\u3000'); // 半形空白轉為全形空白
    
    // 轉為半形
    }else if (action === 'to-halfwidth') {
        newText = textToProcess.replace(/[！-～]/g, function(ch) {
            // 全形字元反向位移 65248 轉回半形
            return String.fromCharCode(ch.charCodeAt(0) - 65248);
        }).replace(/\u3000/g, ' '); // 全形空白轉回半形空白
    }else if (action === 'line-char-count') {
        newText = textToProcess.split('\n').map(line => {
            return `${[...line].length}\t${line}`;
        }).join('\n');
    }
    else if (action === 'base64-encode') {
        try {
            newText = btoa(unescape(encodeURIComponent(textToProcess)));
        } catch (e) {
            showToast('❌ Base64 編碼失敗');
            return;
        }
    }
    else if (action === 'base64-decode') {
        try {
            newText = decodeURIComponent(escape(atob(textToProcess.trim())));
        } catch (e) {
            showToast('❌ 解碼失敗，請確認內容是否為正確的 Base64 格式');
            return;
        }
    }
    else if (action === 'num-to-base62') {
        // 數字轉 0-z 編碼：逐行處理，非純數字的行原樣保留
        try {
            newText = textToProcess.split('\n').map(line => {
                const trimmed = line.trim();
                if (trimmed === '') return line;
                if (!/^-?\d+$/.test(trimmed)) return line;
                return numberToBase62(trimmed);
            }).join('\n');
        } catch (e) {
            showToast('❌ 轉換失敗，請確認內容是否為正確的數字');
            return;
        }
    }
    else if (action === 'base62-to-num') {
        // 0-z 編碼轉數字：逐行處理，非合法 0-9A-Za-z 編碼的行原樣保留
        try {
            newText = textToProcess.split('\n').map(line => {
                const trimmed = line.trim();
                if (trimmed === '') return line;
                if (!/^-?[0-9A-Za-z]+$/.test(trimmed)) return line;
                return base62ToNumber(trimmed).toString();
            }).join('\n');
        } catch (e) {
            showToast('❌ 解碼失敗，請確認內容是否為正確的 0-z 編碼格式');
            return;
        }
    }

    // 將處理完的文字寫回編輯器
    if (hasSelection) {
        editor.setRangeText(newText, start, end, 'select');
    } else {
        editor.value = newText;
    }

    // 觸發全域更新與存檔
    updateLineNumbers();
    localStorage.setItem(STORAGE_KEY, editor.value);
    debouncedSaveHistory();
    if (typeof updateWordCountWidget === 'function') updateWordCountWidget(); // 同步更新字數
    
    // 動態提示訊息
    const msgs = {
        'break': '標點斷行已套用', 'join': '斷行已精準接回',
        'sort-az': 'A-Z 排序完成', 'sort-za': 'Z-A 排序完成',
        'remove-dup': '重複行已移除', 'remove-empty': '空行已移除', 'trim-space': '首尾空格已移除',
		'remove-trailing-empty': '文末空行已乾淨移除',
        'capitalize': '句首已大寫', 'lowercase': '已轉為小寫', 'uppercase': '已轉為大寫',
		'number-superscript': '已將數字轉為上標',
        'pinyin-superscript': '已將拼音尾數轉為上標',
        'remove-superscript': '已取消數字上標',
        'hakka-tone': '已校正客語聲調',
		'to-fullwidth': '已轉為全形', 'to-halfwidth': '已轉為半形',
		'line-char-count': '已計算並輸出每行字數',
		'base64-encode': '已編碼為 Base64',
        'base64-decode': 'Base64 已解碼為文字',
        'num-to-base62': '已將數字轉為 0-z 編碼',
        'base62-to-num': '已將 0-z 編碼轉為數字',
    };
    showToast(`🥷 ${msgs[action]}`);
}

// 綁定所有 10 個按鈕的點擊事件
const textTools = [
    { id: 'btnPunctuationBreak', action: 'break' },
    { id: 'btnPunctuationJoin', action: 'join' },
    { id: 'btnSortAZ', action: 'sort-az' },
    { id: 'btnSortZA', action: 'sort-za' },
    { id: 'btnRemoveDupLines', action: 'remove-dup' },
    { id: 'btnRemoveEmptyLines', action: 'remove-empty' },
	{ id: 'btnRemoveTrailingEmptyLines', action: 'remove-trailing-empty' },
    { id: 'btnTrimSpaces', action: 'trim-space' },
    { id: 'btnCapitalize', action: 'capitalize' },
    { id: 'btnLowercase', action: 'lowercase' },
    { id: 'btnUppercase', action: 'uppercase' },
	{ id: 'btnNumberSuperscript', action: 'number-superscript' },
	{ id: 'btnPinyinSuperscript', action: 'pinyin-superscript' },
	{ id: 'btnRemoveSuperscript', action: 'remove-superscript' },
	{ id: 'btnHakkaTone', action: 'hakka-tone' },
	{ id: 'btnToFullWidth', action: 'to-fullwidth' },
    { id: 'btnToHalfWidth', action: 'to-halfwidth' },
	{ id: 'btnLineCharCount', action: 'line-char-count' },
	{ id: 'btnBase64Encode', action: 'base64-encode' },
    { id: 'btnBase64Decode', action: 'base64-decode' },
	{ id: 'btnNumToBase62', action: 'num-to-base62' },
    { id: 'btnBase62ToNum', action: 'base62-to-num' },
];

textTools.forEach(tool => {
    document.getElementById(tool.id)?.addEventListener('click', (e) => {
        e.stopPropagation();
        applyTextTool(tool.action);
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    });
});




/* ==========================================
   文字模式專屬：即時字數統計模組
   ========================================== */
const wordCountWidget = document.getElementById('wordCountWidget');
const wordCountDisplay = document.getElementById('wordCountDisplay');

// 開啟統計視窗
document.getElementById('btnWordCount')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentMode !== 'text') {
        showToast('⚠️ 字數統計僅能在文字模式使用');
        return;
    }
    wordCountWidget.classList.remove('hidden');
    updateWordCountWidget(); // 打開的瞬間先算一次
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
});

// 關閉統計視窗
document.getElementById('btnCloseWordCount')?.addEventListener('click', () => {
    wordCountWidget.classList.add('hidden');
});

// 預先建立正則（只編譯一次），並用 exec 迴圈只「計數」，不建立動輒數十萬筆的比對結果陣列
const WC_TOTAL_RE = /(?:[\p{sc=Latn}0-9][\p{sc=Latn}\p{M}0-9ˊˇˋˆ\^\+⁺]*)|(?:[˙]?[\u3105-\u312F\u31A0-\u31BF兀万廿勺]+[ˊˇˋˆ\^\+⁺˙]*)|[^\s]/gu;
const WC_HAN_RE = /(?:[\p{sc=Latn}0-9][\p{sc=Latn}\p{M}0-9ˊˇˋˆ\^\+⁺]*)|(?:[˙]?[\u3105-\u312F\u31A0-\u31BF兀万廿勺]+[ˊˇˋˆ\^\+⁺˙]*)|[^\s\p{P}\p{S}\p{sc=Latn}\p{M}0-9ˊˇˋˆ\^\+⁺˙\u3105-\u312F\u31A0-\u31BF兀万廿勺]/gu;
function countMatches(re, text) {
    re.lastIndex = 0;
    let n = 0;
    while (re.exec(text) !== null) n++;
    return n;
}

let wordCountTimeout;
const WC_IMMEDIATE_LIMIT = 20000; // 小於此字數：計算只需約 1ms，維持即時更新，不延遲

// 核心計算邏輯
function updateWordCountWidget() {
    clearTimeout(wordCountTimeout); // 已有直接呼叫時，取消尚未執行的排程，避免重複計算
    // 只有在視窗顯示且處於文字模式時才進行計算
    if (wordCountWidget.classList.contains('hidden') || currentMode !== 'text') return;

    const text = editor.value;
    
    // 1. 行數：根據換行符號計數 (沒打字時算 0 行)
    const lineCount = text.length === 0 ? 0 : countLines(text);
    
    // 2. 總字數 (含標點，不含空白)；正則說明見常數 WC_TOTAL_RE
    //    模式 A (羅馬拼音)：[\p{sc=Latn}0-9][\p{sc=Latn}\p{M}0-9ˊˇˋˆ\^\+⁺]*
    //    模式 B (方音與注音)：\u3105-\u312F 標準注音、\u31A0-\u31BF 擴充方音符號
    const totalChars = countMatches(WC_TOTAL_RE, text);
    
    // 3. 漢字/純字數 (不含標點、符號、空白)；排除拉丁字母、注音、方音、數字、聲調與借音字
    const hanChars = countMatches(WC_HAN_RE, text);

    // 更新畫面顯示
    wordCountDisplay.textContent = `總字${totalChars} , 漢字${hanChars}, ${lineCount}行`;
}

// 輸入時更新字數：小文件即時；大文件停止輸入後才計算（防抖），避免每個字都全文掃描
editor.addEventListener('input', () => {
    if (wordCountWidget.classList.contains('hidden')) return; // 統計視窗沒開就不排程
    clearTimeout(wordCountTimeout);
    const len = editor.value.length;
    if (len < WC_IMMEDIATE_LIMIT) { updateWordCountWidget(); return; }
    wordCountTimeout = setTimeout(updateWordCountWidget, len > 50000 ? 600 : 250);
});
// ==============================================
/* ==========================================
   尋找與取代：批次取代模組 (支援長度優先、安全佔位符與擴充漢字)
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    const BATCH_DATA_KEY = 'wesing-batch-replace-data';
    const BATCH_DIR_KEY = 'wesing-batch-direction';
    const BATCH_DELIM_KEY = 'wesing-batch-delimiter';

    const btnToggleBatchMode = document.getElementById('btnToggleBatchMode');
    const normalSearchContainer = document.getElementById('normalSearchContainer');
    const batchSearchContainer = document.getElementById('batchSearchContainer');
    const searchDirectionGroup = document.getElementById('searchDirectionGroup');
    const frTitleIcon = document.getElementById('frTitleIcon');
    const msgFind = document.getElementById('findReplaceMessage');

	// 「X」清除按鈕（宣告在函式外，讓下方的點擊綁定也能使用）
	const btnClearFind = document.getElementById('btnClearFind');
	const btnClearReplace = document.getElementById('btnClearReplace');

	// 輔助函數：根據輸入框內容，決定是否顯示「X」按鈕
	function updateFindReplaceClearButtons() {
		const findInput = document.getElementById('findInput');
		const replaceInput = document.getElementById('replaceInput');

		if (btnClearFind && findInput) {
			if (findInput.value.length > 0) btnClearFind.classList.remove('hidden');
			else btnClearFind.classList.add('hidden');
		}
		if (btnClearReplace && replaceInput) {
			if (replaceInput.value.length > 0) btnClearReplace.classList.remove('hidden');
			else btnClearReplace.classList.add('hidden');
		}
	}

	// 讓函式也能被區塊外的程式呼叫（例如選取文字自動帶入尋找框時）
	window.updateFindReplaceClearButtons = updateFindReplaceClearButtons;

	// 啟動時讀取記憶
	findInput.value = localStorage.getItem(FIND_TEXT_KEY) || '';
	replaceInput.value = localStorage.getItem(REPLACE_TEXT_KEY) || '';
	updateFindReplaceClearButtons();

	// 監聽打字事件：即時記憶與切換按鈕顯示
	findInput.addEventListener('input', () => {
		localStorage.setItem(FIND_TEXT_KEY, findInput.value);
		updateFindReplaceClearButtons();
	});
	replaceInput.addEventListener('input', () => {
		localStorage.setItem(REPLACE_TEXT_KEY, replaceInput.value);
		updateFindReplaceClearButtons();
	});

	// 點擊「X」按鈕：清除內容、清空記憶並對焦
	if (btnClearFind) {
		btnClearFind.addEventListener('click', () => {
			findInput.value = '';
			localStorage.setItem(FIND_TEXT_KEY, '');
			updateFindReplaceClearButtons();
			findInput.focus();
		});
	}
	if (btnClearReplace) {
		btnClearReplace.addEventListener('click', () => {
			replaceInput.value = '';
			localStorage.setItem(REPLACE_TEXT_KEY, '');
			updateFindReplaceClearButtons();
			replaceInput.focus();
		});
	}

    const batchInputTextarea = document.getElementById('batchInputTextarea');
    const batchInputTableWrapper = document.getElementById('batchInputTableWrapper');
    const batchTableBody = document.getElementById('batchTableBody');
    const btnBatchViewText = document.getElementById('btnBatchViewText');
    const btnBatchViewTable = document.getElementById('btnBatchViewTable');
    const batchDelimiter = document.getElementById('batchDelimiter');
    
    let isBatchMode = false;

    // 1. 初始化讀取快取資料與設定
    batchInputTextarea.value = localStorage.getItem(BATCH_DATA_KEY) || '';
    
    // 還原方向與分隔符號
    const savedDir = localStorage.getItem(BATCH_DIR_KEY) || 'L2R';
    const dirRadio = document.querySelector(`input[name="batchDirection"][value="${savedDir}"]`);
    if (dirRadio) dirRadio.checked = true;
    
    const savedDelim = localStorage.getItem(BATCH_DELIM_KEY) || 'TAB';
    if (batchDelimiter) batchDelimiter.value = savedDelim;

    // 2. 切換批次模式
    btnToggleBatchMode.addEventListener('click', () => {
        isBatchMode = !isBatchMode;
        if (isBatchMode) {
            normalSearchContainer.classList.add('hidden');
            batchSearchContainer.classList.remove('hidden');
            searchDirectionGroup.classList.add('opacity-30', 'pointer-events-none');
            btnToggleBatchMode.classList.replace('bg-gray-100', 'bg-indigo-100');
            btnToggleBatchMode.classList.replace('text-gray-700', 'text-indigo-700');
            frTitleIcon.textContent = 'checklist';
            msgFind.textContent = '批次取代';
        } else {
            normalSearchContainer.classList.remove('hidden');
            batchSearchContainer.classList.add('hidden');
            searchDirectionGroup.classList.remove('opacity-30', 'pointer-events-none');
            btnToggleBatchMode.classList.replace('bg-indigo-100', 'bg-gray-100');
            btnToggleBatchMode.classList.replace('text-indigo-700', 'text-gray-700');
            frTitleIcon.textContent = 'search';
            msgFind.textContent = '尋找與取代';
        }
    });

    // =====================================
    // 3. 視圖切換與同步邏輯 (支援動態分隔符)
    // =====================================

    // 取得目前選定的分隔符 (TAB 需轉換為真正的 \t)
    function getDelimiter() {
        return batchDelimiter.value === 'TAB' ? '\t' : batchDelimiter.value;
    }

    // 當分隔符改變時，記錄偏好，並若處於表格檢視，立即同步回文字框
    batchDelimiter.addEventListener('change', () => {
        localStorage.setItem(BATCH_DELIM_KEY, batchDelimiter.value); // 記憶偏好
        if (!batchInputTableWrapper.classList.contains('hidden')) {
            syncTableToTextarea();
        }
    });

    function syncTableToTextarea() {
		const delim = getDelimiter();
		const rows = [];
		
		batchTableBody.querySelectorAll('tr').forEach(tr => {
			const cols = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
			rows.push(cols.join(delim));
		});

		// ✨ 核心修改：移除末端沒有內容的空行
		while (rows.length > 0) {
			const lastRowCols = rows[rows.length - 1].split(delim);
			// 如果最後一行的每一格都是空的，就把它從陣列末端移除
			if (lastRowCols.every(text => text.trim() === '')) {
				rows.pop();
			} else {
				break; // 遇到有內容的行就停止檢查，保留中間的空行
			}
		}

		batchInputTextarea.value = rows.join('\n');
		localStorage.setItem(BATCH_DATA_KEY, batchInputTextarea.value);
	}

	function addBatchRow(col1Text = '', col2Text = '', idx = -1) {
		const tr = document.createElement('tr');
		// 如果沒有傳入索引，就以目前的列數作為索引，維持顏色交替
		if (idx === -1) idx = batchTableBody.children.length; 
		
		tr.className = (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50') + ' border-b border-gray-200';
		
		const td1 = document.createElement('td');
		td1.className = 'border-r border-gray-200 px-3 py-1.5 outline-none focus:bg-blue-50 break-all w-1/2 cursor-default';
		td1.contentEditable = true;
		td1.innerText = col1Text;

		const td2 = document.createElement('td');
		td2.className = 'px-3 py-1.5 outline-none focus:bg-blue-50 break-all w-1/2 cursor-default';
		td2.contentEditable = true;
		td2.innerText = col2Text;

		// 綁定編輯事件同步回 Textarea
		td1.addEventListener('blur', syncTableToTextarea);
		td2.addEventListener('blur', syncTableToTextarea);

		tr.appendChild(td1);
		tr.appendChild(td2);
		batchTableBody.appendChild(tr);
	}

    function renderBatchTable() {
		const delim = getDelimiter();
		const lines = batchInputTextarea.value.split('\n');
		batchTableBody.innerHTML = '';
		
		// 檢查目前是否為「全空」狀態
		const hasContent = lines.some(line => line.trim() !== '');

		if (!hasContent) {
			// 如果完全沒內容，預設產生 3 列空表格方便打字
			for (let i = 0; i < 3; i++) {
				addBatchRow('', '', i);
			}
		} else {
			// 若有內容，則逐行渲染顯示
			lines.forEach((line, idx) => {
				const parts = line.split(delim);
				addBatchRow(parts[0] || '', parts[1] || '', idx);
			});
		}
	}

	// 綁定增加一列的按鈕事件
	const btnBatchAddRow = document.getElementById('btnBatchAddRow');
	if (btnBatchAddRow) {
		btnBatchAddRow.addEventListener('click', () => {
			addBatchRow('', ''); // 在表格末端新增一列空資料
			syncTableToTextarea(); // 新增後立刻同步，確保資料一致
			
			// 自動將視窗往下滾動，讓使用者立刻看到剛新增的那一行
			const wrapper = document.getElementById('batchInputTableWrapper');
			if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;
		});
	}

    btnBatchViewText.addEventListener('click', () => {
        if (!batchInputTableWrapper.classList.contains('hidden')) {
            syncTableToTextarea();
        }
        batchInputTableWrapper.classList.add('hidden');
        batchInputTextarea.classList.remove('hidden');
        btnBatchViewText.classList.replace('text-gray-400', 'text-blue-600');
        btnBatchViewTable.classList.replace('text-blue-600', 'text-gray-400');
    });

    btnBatchViewTable.addEventListener('click', () => {
        renderBatchTable();
        batchInputTextarea.classList.add('hidden');
        batchInputTableWrapper.classList.remove('hidden');
        btnBatchViewTable.classList.replace('text-gray-400', 'text-blue-600');
        btnBatchViewText.classList.replace('text-blue-600', 'text-gray-400');
    });

	/*
    // 儲存文字框輸入
    batchInputTextarea.addEventListener('input', () => {
        localStorage.setItem(BATCH_DATA_KEY, batchInputTextarea.value);
    });
	*/
	// 新的寫法：整合開關控制與防抖優化（停止輸入 1.5 秒後才儲存）
	batchInputTextarea.addEventListener('input', () => {
		// 檢查：若使用者關閉了自動儲存，則直接跳出不執行
		if (!isAutoSaveEnabled) return;

		// 防抖核心邏輯：
		// 如果在 1.5 秒內使用者又打了字，就清除上一次的計時器，重新計算時間
		clearTimeout(autoSaveTimeout);

		// 重新設定計時器，1500 毫秒（1.5 秒）後才真正執行儲存
		autoSaveTimeout = setTimeout(() => {
			// 實際儲存批次取代文字框內容（原本呼叫的 saveToLocalStorage() 並不存在）
			localStorage.setItem(BATCH_DATA_KEY, batchInputTextarea.value);
			
			// 可選：在畫面邊角顯示一個精簡提示，讓使用者知道背景剛存好了
			console.log('--- 系統已在背景完成自動儲存 ---');
		}, 1500); 
	});

    batchTableBody.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    });

    batchTableBody.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.originalEvent || e).clipboardData.getData('text/plain');
    if (!text) return;

    // Excel 複製出來的資料必定是以 \t (欄) 和 \n (列) 分隔
    const rows = text.split(/\r?\n/);
    const activeTd = document.activeElement.closest('td');
    if (!activeTd || !batchTableBody.contains(activeTd)) return;

    const isMultiCell = text.includes('\t') || (rows.length > 1 && !(rows.length === 2 && rows[1] === ''));
    
    if (!isMultiCell) {
        // 消除從 Excel 單格複製時，尾端可能附帶的隱形換行符號
        let insertTextStr = text;
        if (insertTextStr.endsWith('\n')) insertTextStr = insertTextStr.slice(0, -1);
        if (insertTextStr.endsWith('\r')) insertTextStr = insertTextStr.slice(0, -1);
        
        // 使用 insertText 讓文字安插在游標目前的位置
        document.execCommand('insertText', false, insertTextStr);
        syncTableToTextarea();
        return; // 提早結束，不執行下方的表格擴充邏輯
    }

    const startTr = activeTd.closest('tr');
        let startRowIdx = Array.from(batchTableBody.children).indexOf(startTr);
        let startColIdx = Array.from(startTr.children).indexOf(activeTd);

        rows.forEach((rowStr, rOffset) => {
            // 忽略 Excel 複製時尾端多出的一個空白換行
            if (rowStr === '' && rOffset === rows.length - 1) return; 
            
            const cols = rowStr.split('\t');
            let targetTr = batchTableBody.children[startRowIdx + rOffset];
            
            // 如果貼上的列數超過目前的表格，自動產生新的一列
            if (!targetTr) {
                targetTr = document.createElement('tr');
                targetTr.className = (startRowIdx + rOffset) % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                
                const newTd1 = document.createElement('td');
                newTd1.className = 'border border-gray-200 px-2 py-1 outline-none focus:bg-blue-50 break-all';
                newTd1.contentEditable = true;
                newTd1.addEventListener('blur', syncTableToTextarea);
                
                const newTd2 = document.createElement('td');
                newTd2.className = 'border border-gray-200 px-2 py-1 outline-none focus:bg-blue-50 break-all';
                newTd2.contentEditable = true;
                newTd2.addEventListener('blur', syncTableToTextarea);

                targetTr.appendChild(newTd1);
                targetTr.appendChild(newTd2);
                batchTableBody.appendChild(targetTr);
            }

            // 將資料對應覆蓋進該格 (最多只覆蓋左、右兩欄)
            cols.forEach((colStr, cOffset) => {
                if (startColIdx + cOffset < 2) {
                    const targetTd = targetTr.children[startColIdx + cOffset];
                    if (targetTd) targetTd.innerText = colStr.trim();
                }
            });
        });
        
        syncTableToTextarea();
        showFRMsg('✅ 表格資料已貼上', false);
    });

    // 清除資料
    document.getElementById('btnBatchClear').addEventListener('click', () => {
        batchInputTextarea.value = '';
        batchTableBody.innerHTML = '';
        localStorage.removeItem(BATCH_DATA_KEY);
    });

    // 記錄方向選擇
    document.querySelectorAll('input[name="batchDirection"]').forEach(radio => {
        radio.addEventListener('change', (e) => localStorage.setItem(BATCH_DIR_KEY, e.target.value));
    });

    // =====================================
    // 4. 核心：安全佔位符批次取代引擎
    // =====================================
    document.getElementById('btnBatchReplaceAll').addEventListener('click', () => {
        const rawText = batchInputTextarea.value;
        const direction = document.querySelector('input[name="batchDirection"]:checked').value;
        const isRegex = document.getElementById('chkRegex').checked;
        const isCase = document.getElementById('chkCaseSensitive').checked;
        const isWhole = document.getElementById('chkWholeWord').checked;
        const isFormulaMatch = document.getElementById('chkFormulaMatch')?.checked;
        const context = getSelectionContext(); 
        
        // 1. 解析成規則陣列並過濾無效行
        let rules = [];
        const delim = getDelimiter();
        
        rawText.split('\n').forEach(line => {
            const parts = line.split(delim);
            if (parts.length >= 2) {
                let findStr = direction === 'L2R' ? parts[0] : parts[1];
                let replaceStr = direction === 'L2R' ? parts[1] : parts[0];
				if (isRegex && replaceStr) {
                    replaceStr = replaceStr.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
                }
                if (findStr) rules.push({ find: findStr, replace: replaceStr || '' });
            }
        });

        if (rules.length === 0) return showFRMsg('⚠️ 請貼上有效的兩欄對照表');

        // 2. ⭐ 關鍵：依尋找字串長度遞減排序 (字數多的優先處理，避免短詞攔截)
        rules.sort((a, b) => b.find.length - a.find.length);

        // 定義極高安全性的 Unicode 佔位符區段 (Private Use Area)
        const PL_START = '\uE000';
        const PL_END = '\uE001';
        const placeholderMap = {};

        // 3. 預先編譯正則表達式，提升效能
        rules.forEach((rule, index) => {
            let term = rule.find;
            if (!isRegex) term = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (!isRegex && isWhole) term = '\\b' + term + '\\b';
            
            // 加上 u 旗標以完美支援擴充漢字
            const flags = (isCase ? '' : 'i') + 'gmu';
            rule.regex = new RegExp(term, flags);
            rule.placeholder = `${PL_START}${index}${PL_END}`;
            placeholderMap[rule.placeholder] = rule.replace;
        });

        // 共用替換邏輯：單次文字處理
        const processTextSafely = (text) => {
            if (!text) return text;
            let tempText = text;
            
			rules.forEach(rule => {
				if (!rule.find) return; // 忽略空白規則

				let searchPattern = rule.find;
				
				const useRegex = isRegex; 

				if (useRegex) {
					try {
						// 建立 RegExp 物件 (g: 全域, m: 多行)
						const regex = new RegExp(searchPattern, 'gm'); 
						
						tempText = tempText.replace(regex, rule.replace); 
						
					} catch (err) {
						console.error("正則語法錯誤:", err);
					}
				} else {

					// 將所有正則特殊符號跳脫，視為純文字比對
					searchPattern = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
					const regex = new RegExp(searchPattern, 'gm');
					
					tempText = tempText.replace(regex, () => rule.replace);
				}
			});

            // 階段二：將佔位符還原為最終結果
            const finalRegex = new RegExp(`${PL_START}(\\d+)${PL_END}`, 'g');
            tempText = tempText.replace(finalRegex, (match) => placeholderMap[match] !== undefined ? placeholderMap[match] : match);
            
            return tempText;
        };

        // 4. 執行取代 (依模式分配)
        let replacedCount = 0; // 粗略計算是否有變化
        
        if (currentMode === 'text') {
            const text = editor.value;
            if (context.hasSelection) {
                const selectedText = text.substring(context.start, context.end);
                const newText = processTextSafely(selectedText);
                if (newText !== selectedText) {
                    editor.setRangeText(newText, context.start, context.end, 'select');
                    replacedCount++;
                }
            } else {
                const newText = processTextSafely(text);
                if (newText !== text) {
                    editor.value = newText;
                    replacedCount++;
                }
            }
            if (replacedCount > 0) { debouncedSaveHistory(); updateLineNumbers(); }
        } else {
            // 表格模式
            const cells = getTargetCells(); // 使用系統原本的函數來獲取目標儲存格
            
            cells.forEach(cell => {
                let textToSearch = getCellText(cell.inner);
                if (isFormulaMatch && cell.inner.hasAttribute('data-formula')) {
                    textToSearch = cell.inner.getAttribute('data-formula');
                }

                const newText = processTextSafely(textToSearch);
                
                if (newText !== textToSearch) {
                    replacedCount++;
                    if (isFormulaMatch && cell.inner.hasAttribute('data-formula')) {
                        cell.inner.setAttribute('data-formula', newText);
                    } else {
                        cell.inner.innerText = newText;
                        if (!newText.startsWith('=')) cell.inner.removeAttribute('data-formula');
                    }
                }
            });
            
            if (replacedCount > 0) {
                recalculateAllFormulas();
                debouncedSaveHistory();
            }
        }

        if (replacedCount > 0) showFRMsg(`✅ 批次取代已套用`, false);
        else showFRMsg('找不到符合的目標');
    });
});






/* ==========================================
   編號設定工具模組 (支援字母進制、漢字轉換與智慧移除)
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    const numberingModal = document.getElementById('numberingModal');

	document.getElementById('btnOpenNumbering')?.addEventListener('mousedown', (e) => {
        if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
        e.preventDefault(); 
    });
    
    // 1. 視窗開關
    document.getElementById('btnOpenNumbering')?.addEventListener('click', (e) => {
        e.stopPropagation();
        numberingModal.classList.remove('hidden');
        document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
        if (!numberingModal.style.left) {
            numberingModal.style.left = (window.innerWidth - numberingModal.offsetWidth) / 2 + 'px';
            numberingModal.style.top = (window.innerHeight - numberingModal.offsetHeight) * 0.4 + 'px';
        }
    });
    document.getElementById('btnCloseNumbering')?.addEventListener('click', () => {
        numberingModal.classList.add('hidden');
        if (currentMode === 'text') {
            document.getElementById('editor').focus();
        }
    });

    // 2. 視窗全區拖曳
    let isDraggingNum = false, dragStartXNum = 0, dragStartYNum = 0, numStartLeft = 0, numStartTop = 0;
    numberingModal.addEventListener('mousedown', (e) => {
        if (e.target.closest('input, select, button, label')) return; 
        
        if (!window.matchMedia || !window.matchMedia('(pointer: coarse)').matches) {
            e.preventDefault(); 
        }

        isDraggingNum = true; dragStartXNum = e.clientX; dragStartYNum = e.clientY;
        const rect = numberingModal.getBoundingClientRect();
        numStartLeft = rect.left; numStartTop = rect.top;
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDraggingNum) return;
        numberingModal.style.left = `${numStartLeft + (e.clientX - dragStartXNum)}px`;
        numberingModal.style.top = `${numStartTop + (e.clientY - dragStartYNum)}px`;
        numberingModal.style.transform = 'none';
    });
    document.addEventListener('mouseup', () => { isDraggingNum = false; document.body.style.userSelect = ''; });
    
    numberingModal.addEventListener('touchstart', (e) => {
        if (e.target.closest('input, select, button, label')) return; 
        const touch = e.touches[0];
        isDraggingNum = true; dragStartXNum = touch.clientX; dragStartYNum = touch.clientY;
        const rect = numberingModal.getBoundingClientRect();
        numStartLeft = rect.left; numStartTop = rect.top;
        if (!e.target.closest('input, select')) e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
        if (!isDraggingNum) return;
        const touch = e.touches[0];
        numberingModal.style.left = `${numStartLeft + (touch.clientX - dragStartXNum)}px`;
        numberingModal.style.top = `${numStartTop + (touch.clientY - dragStartYNum)}px`;
        numberingModal.style.transform = 'none';
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', () => { isDraggingNum = false; });


    // 當你在下拉選單選好選項，或是更改了輸入框的值之後，立刻把焦點還給編輯區，讓反白重新顯示
    document.querySelectorAll('#numberingModal select, #numberingModal input').forEach(el => {
        el.addEventListener('change', () => {
            if (currentMode === 'text') {
                document.getElementById('editor').focus();
            }
        });
    });

    // 3. 核心：編號產生引擎
    function getHanzi(num, isLarge) {
        const small = ['零','一','二','三','四','五','六','七','八','九','十','百','千'];
        const large = ['零','壹','貳','參','肆','伍','陸','柒','捌','玖','拾','佰','仟'];
        const m = isLarge ? large : small;
        if (num < 10) return m[num];
        if (num < 20) return (num === 10 ? m[10] : m[10] + m[num % 10]);
        if (num < 100) return m[Math.floor(num/10)] + m[10] + (num % 10 === 0 ? '' : m[num % 10]);
        if (num < 1000) return m[Math.floor(num/100)] + m[11] + (num % 100 === 0 ? '' : (num % 100 < 10 ? m[0] + m[num % 10] : getHanzi(num % 100, isLarge)));
        return num.toString(); // 大於 999 轉回數字
    }

    function generateNumberString(index, type, digits) {
        if (type === 'num' || type === '(num)') {
            let s = index.toString();
            if (digits > 1 && s.length < digits) s = s.padStart(digits, '0');
            return type === '(num)' ? `(${s})` : s;
        }
        if (type === 'A' || type === 'a' || type === 'Aa') {
            let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            if (type === 'a') chars = "abcdefghijklmnopqrstuvwxyz";
            else if (type === 'Aa') chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            let base = chars.length;
            let s = '';
            let temp = index;
            while (temp > 0) {
                let rem = (temp - 1) % base;
                s = chars[rem] + s;
                temp = Math.floor((temp - 1) / base);
            }
            return s;
        }
        if (type.startsWith('hz_') || type === '(hz_s)') {
            let s = getHanzi(index, type === 'hz_l');
            return type === '(hz_s)' ? `(${s})` : s;
        }
        return index.toString();
    }


    // 4. 取得輸入參數輔助函數
    function getFormatParams() {
        const sepMap = {'\\n': '\n', ' ': ' ', '\\t': '\t'};
        const sep = sepMap[document.getElementById('numSeparator').value];
        const type = document.getElementById('numType').value;
        const prefixRaw = document.getElementById('numPrefix').value;
        const suffixRaw = document.getElementById('numSuffix').value;
        const skip = document.getElementById('numSkip').value; 
        
        const getFix = (val) => val === '. ' ? '. ' : (val === '\\t' ? '\t' : val);
        const prefix = getFix(prefixRaw);
        const suffix = getFix(suffixRaw);
        
        const start = parseInt(document.getElementById('numStart').value) || 1;
        const digits = parseInt(document.getElementById('numDigits').value) || 1;

        return { sep, type, prefix, suffix, start, digits, skip };
    }

    // 5. 執行：加上編號
    document.getElementById('btnAddNumbering').addEventListener('click', () => {
        if (currentMode !== 'text') return showToast('⚠️ 編號功能目前僅支援文字模式');
        
        const { sep, type, prefix, suffix, start, digits, skip } = getFormatParams();
        const text = editor.value;
        const startPos = editor.selectionStart;
        const endPos = editor.selectionEnd;
        const hasSelection = startPos !== endPos;
        const targetText = hasSelection ? text.substring(startPos, endPos) : text;

        let index = start;
        const parts = targetText.split(sep);
        
        const newParts = parts.map(part => {
            const trimmed = part.trim();
            if (skip === 'empty' && (trimmed === '' || trimmed === '######' || trimmed === '#####' || trimmed === '------' || trimmed === '======')) {
                return part; // 直接返回原內容，且「不遞增」 index
            }
            
            const numStr = generateNumberString(index++, type, digits);
            return prefix + numStr + suffix + part;
        });

        const result = newParts.join(sep);
        if (hasSelection) editor.setRangeText(result, startPos, endPos, 'select');
        else editor.value = result;

        debouncedSaveHistory();
        updateLineNumbers();
        showToast('✅ 選取範圍已加上編號');
    });

    // 6. 執行：移除編號
    document.getElementById('btnRemoveNumbering').addEventListener('click', () => {
        if (currentMode !== 'text') return showToast('⚠️ 編號功能目前僅支援文字模式');
        
        const { sep } = getFormatParams();
        const text = editor.value;
        const startPos = editor.selectionStart;
        const endPos = editor.selectionEnd;
        const hasSelection = startPos !== endPos;
        const targetText = hasSelection ? text.substring(startPos, endPos) : text;

        // 智慧正則：匹配段落「最開頭」的 (各種前綴) + (數字/字母/漢字) + (各種後綴)
        const regex = /^[.\s\(\[\{【（〈\t]*(?:[0-9]+|[A-Za-z]+|[零一二三四五六七八九十百千壹貳參肆伍陸柒捌玖拾佰仟]+)[.\s\)\]\}】）〉、:\t]*/;
        
        const parts = targetText.split(sep);
        const newParts = parts.map(part => part.replace(regex, '')); // 清除頭部的編號特徵
        
        const result = newParts.join(sep);
        if (hasSelection) editor.setRangeText(result, startPos, endPos, 'select');
        else editor.value = result;

        debouncedSaveHistory();
        updateLineNumbers();
        showToast('🗑️ 選取範圍已移除編號');
    });
});


/* ==========================================
   拼音轉換工具模組
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    const btnOpenPinyin = document.getElementById('btnOpenPinyinTool');
    const modalPinyin = document.getElementById('floating-pinyin-tool');
    const dragHandlePinyin = document.getElementById('pinyin-drag-handle');
    const btnClosePinyin = document.getElementById('btnClosePinyinTool');
    const btnExecutePinyin = document.getElementById('btnExecutePinyin');

	// 拼音工具的選取狀態檢查引擎
	function checkPinyinButtonState() {
		const btnExecutePinyin = document.getElementById('btnExecutePinyin');
		if (!btnExecutePinyin) return;

		let hasSelection = false;

		// ✨ 修正：補上表格模式的判定
		if (typeof currentMode !== 'undefined' && currentMode === 'table') {
			const sel = window.getSelection();
			if (sel && sel.toString().trim().length > 0) {
				hasSelection = true;
			} else {
				const hasMultiCells = document.querySelectorAll('#data-table td.sel-bg').length > 0;
				const hasSingleCellOutline = document.querySelectorAll('#data-table td[style*="inset"]').length > 0;
				const isEditing = document.activeElement && document.activeElement.classList.contains('td-inner');
				if (hasMultiCells || hasSingleCellOutline || isEditing) {
					hasSelection = true;
				}
			}
		} else {
			// 💡 取得選取的便利貼或其他模式
			const selectedNotes = document.querySelectorAll('.sticky-note.ring-2');
			const sel = window.getSelection();
			const hasDivSelection = sel && sel.toString().trim().length > 0;
			
			let activeEl = document.activeElement;
			let isInputTarget = activeEl && (activeEl.tagName === 'TEXTAREA' || (activeEl.tagName === 'INPUT' && ['text', 'search', 'number', 'password', 'url', 'tel'].includes(activeEl.type)));

			if (selectedNotes.length > 0) {
				hasSelection = true;
			} else if (hasDivSelection) {
				hasSelection = true;
			} else if (isInputTarget) {
				try { hasSelection = activeEl.selectionStart !== activeEl.selectionEnd; } catch(e) {}
			} else if (window.lastFocusedInput && document.body.contains(window.lastFocusedInput)) {
				try { hasSelection = window.lastFocusedInput.selectionStart !== window.lastFocusedInput.selectionEnd; } catch(e) {}
			}
		}

		if (hasSelection) {
			btnExecutePinyin.disabled = false;
			btnExecutePinyin.classList.remove('opacity-50', 'cursor-not-allowed');
			btnExecutePinyin.title = "";
		} else {
			btnExecutePinyin.disabled = true;
			btnExecutePinyin.classList.add('opacity-50', 'cursor-not-allowed');
			btnExecutePinyin.title = "請先選取要轉換的文字、儲存格或便利貼";
		}
	}

    // 綁定事件，確保隨時偵測選取狀態
    document.addEventListener('selectionchange', checkPinyinButtonState);
    document.addEventListener('mouseup', () => setTimeout(checkPinyinButtonState, 50));
    document.addEventListener('keyup', () => setTimeout(checkPinyinButtonState, 50));
    
    // 網頁載入時先執行一次，預設鎖定按鈕
    checkPinyinButtonState();

    // UI 元素
    const langBtn = document.querySelector('[data-id="pinyin-lang-btn"]');
    const sourceBtn = document.querySelector('[data-id="pinyin-source-btn"]');
    const targetBtn = document.querySelector('[data-id="pinyin-target-btn"]');
    const langList = document.getElementById('pinyin-lang-list');
    const sourceList = document.getElementById('pinyin-source-list');
    const targetList = document.getElementById('pinyin-target-list');

    let isPinyinScriptsLoaded = false;
    let pinyinParsedConfig = {}; 
    
    const PY_LANG_KEY = 'wesing-py-lang';
    const PY_SRC_KEY = 'wesing-py-src';
    const PY_TGT_KEY = 'wesing-py-tgt';

    let pinyinState = {
        lang: localStorage.getItem(PY_LANG_KEY) || 'kasu',
        source: localStorage.getItem(PY_SRC_KEY) || '',
        target: localStorage.getItem(PY_TGT_KEY) || ''
    };

    // 1. 動態載入腳本
    function loadPinyinScripts() {
        if (isPinyinScriptsLoaded) return Promise.resolve();
        return new Promise((resolve, reject) => {
            window.APP_ID = "tauhu_pinyin_tool"; 
            
            const script1 = document.createElement('script');
            script1.src = 'https://gnisew.github.io/tools/turn/pinyin2/data-pinyin2pinyin.js';
            
            const script2 = document.createElement('script');
            script2.src = 'https://gnisew.github.io/tools/turn/pinyin2/menu.js';
            
            script1.onload = () => document.head.appendChild(script2);
            script2.onload = () => {
                isPinyinScriptsLoaded = true;
                parsePinyinMenuConfig();
                resolve();
            };
            
            script1.onerror = reject;
            script2.onerror = reject;
            document.head.appendChild(script1);
        });
    }

    // 2. 解析配置與建立語言選單
    function parsePinyinMenuConfig() {
        if (typeof languageConfigs === 'undefined') {
            showToast('❌ 無法讀取拼音配置');
            return;
        }
        
        pinyinParsedConfig = {};
        langList.innerHTML = '';
        
        for (const [langId, langData] of Object.entries(languageConfigs)) {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.value = langId;
            item.textContent = langData.name;
            item.addEventListener('click', () => {
                pinyinState.lang = langId;
                langBtn.textContent = langData.name;
                localStorage.setItem(PY_LANG_KEY, langId);
                item.closest('.dropdown-list').classList.remove('show');
                updatePinyinSourceSelect();
                if (currentMode === 'text') editor.focus();
            });
            langList.appendChild(item);
            
            // 解析 TSV
            pinyinParsedConfig[langId] = {};
            const lines = langData.config.trim().split(/\n/).slice(1);
            lines.forEach(line => {
                const parts = line.split('\t').map(s => s.trim());
                if (parts.length >= 3) {
                    const [left, right, func] = parts;
                    if (!pinyinParsedConfig[langId][left]) pinyinParsedConfig[langId][left] = {};
                    pinyinParsedConfig[langId][left][right] = func;
                }
            });
        }
        
        if (!languageConfigs[pinyinState.lang]) pinyinState.lang = 'kasu';
        langBtn.textContent = languageConfigs[pinyinState.lang].name;
        
        updatePinyinSourceSelect();
    }

    // 3. 連動選單更新
    function updatePinyinSourceSelect() {
        const langId = pinyinState.lang;
        sourceList.innerHTML = '';
        if (!pinyinParsedConfig[langId]) return;
        
        const sources = Object.keys(pinyinParsedConfig[langId]);
        sources.forEach(s => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.value = s;
            item.textContent = s;
            item.addEventListener('click', () => {
                pinyinState.source = s;
                sourceBtn.textContent = s;
                localStorage.setItem(PY_SRC_KEY, s);
                item.closest('.dropdown-list').classList.remove('show');
                updatePinyinTargetSelect();
                if (currentMode === 'text') editor.focus();
            });
            sourceList.appendChild(item);
        });
        
        if (pinyinState.source && sources.includes(pinyinState.source)) {
            sourceBtn.textContent = pinyinState.source;
        } else if (sources.length > 0) {
            pinyinState.source = sources[0];
            sourceBtn.textContent = sources[0];
        } else {
            pinyinState.source = '';
            sourceBtn.textContent = '原拼音';
        }
        updatePinyinTargetSelect();
    }

    function updatePinyinTargetSelect() {
        const langId = pinyinState.lang;
        const sourceId = pinyinState.source;
        targetList.innerHTML = '';
        
        if (!pinyinParsedConfig[langId] || !pinyinParsedConfig[langId][sourceId]) {
            pinyinState.target = '';
            targetBtn.textContent = '新拼音';
            return;
        }
        
        const targets = Object.keys(pinyinParsedConfig[langId][sourceId]);
        targets.forEach(t => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.value = t;
            item.textContent = t;
            item.addEventListener('click', () => {
                pinyinState.target = t;
                targetBtn.textContent = t;
                localStorage.setItem(PY_TGT_KEY, t); // 記憶新拼音
                item.closest('.dropdown-list').classList.remove('show');
                if (currentMode === 'text') editor.focus();
            });
            targetList.appendChild(item);
        });
        
        if (pinyinState.target && targets.includes(pinyinState.target)) {
            targetBtn.textContent = pinyinState.target;
        } else if (targets.length > 0) {
            pinyinState.target = targets[0];
            targetBtn.textContent = targets[0];
        } else {
            pinyinState.target = '';
            targetBtn.textContent = '新拼音';
        }
    }

    // 4. 視窗開關與按鈕狀態
    function togglePinyinPanel() {
        const isHidden = modalPinyin.style.display === 'none' || modalPinyin.style.display === '';
        if (isHidden) {
            modalPinyin.style.display = 'flex';
            btnOpenPinyin?.classList.add('bg-green-100', 'text-green-700');
        } else {
            modalPinyin.style.display = 'none';
            btnOpenPinyin?.classList.remove('bg-green-100', 'text-green-700');
            if (currentMode === 'text') editor.focus();
        }
    }

    btnOpenPinyin?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (window.matchMedia && !window.matchMedia('(pointer: coarse)').matches) {
            e.preventDefault();
        }

        if (!isPinyinScriptsLoaded) {
            showToast('🔄 正在載入拼音轉換引擎...', 2000);
            try {
                await loadPinyinScripts();
            } catch (err) {
                showToast('❌ 載入拼音模組失敗', 3000);
                return;
            }
        }
        
        togglePinyinPanel();
    });

    btnClosePinyin?.addEventListener('click', togglePinyinPanel);

    // 5. 視窗拖曳功能
    let isDraggingPinyin = false, startX, startY, initialX, initialY;
    function startPinyinDrag(clientX, clientY) {
        isDraggingPinyin = true; startX = clientX; startY = clientY;
        const rect = modalPinyin.getBoundingClientRect(); initialX = rect.left; initialY = rect.top;
        modalPinyin.style.transform = 'none'; modalPinyin.style.left = `${initialX}px`; modalPinyin.style.top = `${initialY}px`;
        modalPinyin.style.bottom = 'auto'; modalPinyin.style.right = 'auto';
        document.body.style.userSelect = 'none';
    }
    function dragPinyin(clientX, clientY) { if (isDraggingPinyin) { modalPinyin.style.left = `${initialX + (clientX - startX)}px`; modalPinyin.style.top = `${initialY + (clientY - startY)}px`; } }
    function stopPinyinDrag() { isDraggingPinyin = false; document.body.style.userSelect = ''; }

    if (dragHandlePinyin) {
        dragHandlePinyin.addEventListener('mousedown', (e) => { startPinyinDrag(e.clientX, e.clientY); document.addEventListener('mousemove', onMouseMovePinyin); document.addEventListener('mouseup', onMouseUpPinyin); });
        dragHandlePinyin.addEventListener('touchstart', (e) => { startPinyinDrag(e.touches[0].clientX, e.touches[0].clientY); document.addEventListener('touchmove', onTouchMovePinyin, { passive: false }); document.addEventListener('touchend', onTouchEndPinyin); }, { passive: false });
    }
    function onMouseMovePinyin(e) { dragPinyin(e.clientX, e.clientY); }
    function onMouseUpPinyin() { stopPinyinDrag(); document.removeEventListener('mousemove', onMouseMovePinyin); document.removeEventListener('mouseup', onMouseUpPinyin); }
    function onTouchMovePinyin(e) { if (!isDraggingPinyin) return; e.preventDefault(); dragPinyin(e.touches[0].clientX, e.touches[0].clientY); }
    function onTouchEndPinyin() { stopPinyinDrag(); document.removeEventListener('touchmove', onTouchMovePinyin); document.removeEventListener('touchend', onTouchEndPinyin); }

    // 6. 執行轉換邏輯
    btnExecutePinyin?.addEventListener('click', () => {
        const langId = pinyinState.lang;
        const sourceId = pinyinState.source;
        const targetId = pinyinState.target;
        
        if (!langId || !sourceId || !targetId) return;
        
        const funcName = pinyinParsedConfig[langId][sourceId][targetId];
        if (!funcName || typeof window[funcName] !== 'function') {
            showToast('❌ 找不到對應的轉換函數');
            return;
        }

        try {
            if (currentMode === 'text') {
                const start = editor.selectionStart, end = editor.selectionEnd;
                let text = (start !== end) ? editor.value.substring(start, end) : editor.value;
                if (!text) { showToast('⚠️ 編輯區沒有文字'); return; }
                
                text = window[funcName](text);
                
                if (start !== end) editor.setRangeText(text, start, end, 'select'); 
                else editor.value = text;
            } 
            else if (currentMode === 'table') {
                const sel = window.getSelection();
                if (sel.toString().length > 0 && dataTable && dataTable.contains(sel.anchorNode)) {
                    let text = window[funcName](sel.toString());
                    const range = sel.getRangeAt(0); 
                    range.deleteContents(); 
                    range.insertNode(document.createTextNode(text));
                } else {
                    let selectedCells = Array.from(document.querySelectorAll('table#data-table td.sel-bg .td-inner'));
                    if (selectedCells.length === 0) {
                        let activeCell = document.activeElement.closest('.td-inner') || 
                            (document.activeElement.classList && document.activeElement.classList.contains('td-inner') ? document.activeElement : null);
                        if (!activeCell) {
                            const allTds = document.querySelectorAll('table#data-table td');
                            const singleSelectedTd = Array.from(allTds).find(td => td.style.boxShadow && td.style.boxShadow.includes('inset'));
                            if (singleSelectedTd) activeCell = singleSelectedTd.querySelector('.td-inner');
                        }
                        if (activeCell) selectedCells.push(activeCell);
                    }
                    
                    if (selectedCells.length === 0) { 
                        showToast("請先選取要處理的文字或儲存格！"); 
                        return; 
                    }
                    
                    const SAFE_SEP = '\n\uFDD0\n';
					const DUMMY_PREFIX = '\uFDD1';
					const DUMMY_SUFFIX = '\uFDD2';
                    
                    const originalTexts = selectedCells.map(cell => cell.innerText || cell.textContent);
                    const combinedText = DUMMY_PREFIX + originalTexts.join(SAFE_SEP) + DUMMY_SUFFIX;
                    
                    let processedCombined = window[funcName](combinedText);
                    
                    if (processedCombined.startsWith(DUMMY_PREFIX)) processedCombined = processedCombined.substring(DUMMY_PREFIX.length);
                    if (processedCombined.endsWith(DUMMY_SUFFIX)) processedCombined = processedCombined.substring(0, processedCombined.length - DUMMY_SUFFIX.length);
                    
                    const processedTexts = processedCombined.split(SAFE_SEP);
                    
                    for (let i = 0; i < selectedCells.length; i++) {
                        const cell = selectedCells[i];
                        const newText = processedTexts[i] !== undefined ? processedTexts[i] : window[funcName](originalTexts[i]);
                        cell.innerText = newText;
                        if (cell.hasAttribute('data-formula')) cell.removeAttribute('data-formula');
                    }
                }
            } else {
                // =============== 處理：Live 模式等其他模式 ===============
                const selectedNotes = document.querySelectorAll('.sticky-note.ring-2');

                // 🌟 新增：優先處理選取的便利貼 (支援多選)
                if (selectedNotes.length > 0) {
                    const activeQId = window.currentSpaceData?.currentQuestionData?.id;
                    let currentMods = {};
                    if (activeQId) currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};

                    // 🚀 高效能批次處理引擎 (降低大量迴圈造成的效能耗損)
                    const SAFE_SEP = '\n\uFDD0\n';
                    const DUMMY_PREFIX = '\uFDD1';
                    const DUMMY_SUFFIX = '\uFDD2';

                    const notesArray = Array.from(selectedNotes);
                    const originalTexts = notesArray.map(note => {
                        const contentEl = note.querySelector('.note-text-content');
                        return contentEl ? (contentEl.innerText || contentEl.textContent) : '';
                    });

                    const combinedText = DUMMY_PREFIX + originalTexts.join(SAFE_SEP) + DUMMY_SUFFIX;
                    
                    // ⚡ 一次性運算！
                    let processedCombined = window[funcName](combinedText);

                    if (processedCombined.startsWith(DUMMY_PREFIX)) processedCombined = processedCombined.substring(DUMMY_PREFIX.length);
                    if (processedCombined.endsWith(DUMMY_SUFFIX)) processedCombined = processedCombined.substring(0, processedCombined.length - DUMMY_SUFFIX.length);

                    const processedTexts = processedCombined.split(SAFE_SEP);

                    for (let i = 0; i < notesArray.length; i++) {
                        const note = notesArray[i];
                        const contentEl = note.querySelector('.note-text-content');
                        if (contentEl) {
                            let newText = processedTexts[i] !== undefined ? processedTexts[i] : window[funcName](originalTexts[i]);
                            contentEl.innerText = newText;

                            const bodyEl = note.querySelector('.note-body');
                            if (bodyEl) bodyEl.setAttribute('data-first-char', (newText || '').trim().charAt(0) || '');

                            const noteId = note.dataset.id;
                            if (activeQId && noteId) {
                                currentMods[noteId] = { ...currentMods[noteId], text: newText };
                            }
                        }
                    }

                    // 將結果同步回 Firebase (若有權限的話)
                    if (activeQId && window.currentSpaceCode && typeof db !== 'undefined') {
                        db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods }).catch(()=>{});
                    }
                    debouncedSaveHistory();
                    showToast('✅ 拼音轉換完成！');
                    return; 
                }

                // ====== ✨ 確保變數完美定義 ======
                const sel = window.getSelection();
                const hasDivSelection = sel && sel.toString().trim().length > 0;

                let activeEl = document.activeElement; 
                let isInputTarget = activeEl && (activeEl.tagName === 'TEXTAREA' || (activeEl.tagName === 'INPUT' && ['text', 'search', 'number', 'password', 'url', 'tel'].includes(activeEl.type)));

                // 找回真正選取文字的輸入框
                if (!hasDivSelection && !isInputTarget && window.lastFocusedInput && document.body.contains(window.lastFocusedInput)) {
                    activeEl = window.lastFocusedInput;
                    isInputTarget = true;
                }

                if (isInputTarget) {
                    // 1. 處理輸入框 (如 Live 模式的便利貼)
                    let start = 0, end = 0;
                    try { start = activeEl.selectionStart; end = activeEl.selectionEnd; } catch(e) {}
                    let text = (start !== end) ? activeEl.value.substring(start, end) : activeEl.value;

                    if (!text) { showToast('⚠️ 沒有選取文字'); return; }
                    text = window[funcName](text);

                    if (start !== end) {
                        try { activeEl.setRangeText(text, start, end, 'select'); } catch(e) { activeEl.value = text; }
                    } else {
                        activeEl.value = text;
                    }
                    activeEl.dispatchEvent(new Event('input', { bubbles: true }));

                } else if (hasDivSelection) {
                    // 2. 處理畫面純文字反白
                    const originalText = sel.toString();
                    let text = window[funcName](originalText);
                    const range = sel.getRangeAt(0); 
                    range.deleteContents(); 
                    range.insertNode(document.createTextNode(text));
                } else {
                    showToast("請先選取要轉換的文字！"); 
                    return; 
                }
            }
            debouncedSaveHistory();
            showToast('✅ 拼音轉換完成！');
        } catch (err) {
            console.error("轉換發生錯誤:", err);
            showToast("❌ 轉換失敗，請檢查輸入內容", 3000);
        }
    });
});



// === 文字模式顯示行號切換邏輯 ===
const btnToggleLineNumbersTextMode = document.getElementById('btnToggleLineNumbersTextMode');
const iconTextLineNumbersCheck = document.getElementById('iconTextLineNumbersCheck');

function applyTextLineNumbersState() {
    if (isShowTextLineNumbers) {
        document.body.classList.remove('hide-text-line-numbers');
        if (iconTextLineNumbersCheck) iconTextLineNumbersCheck.classList.add('active');
    } else {
        document.body.classList.add('hide-text-line-numbers');
        if (iconTextLineNumbersCheck) iconTextLineNumbersCheck.classList.remove('active');
    }
}

if (btnToggleLineNumbersTextMode) {
    btnToggleLineNumbersTextMode.addEventListener('click', (e) => {
        e.stopPropagation(); // 讓選單保持開啟，方便連續操作
        isShowTextLineNumbers = !isShowTextLineNumbers;
        localStorage.setItem(SHOW_TEXT_LINE_NUMBERS_KEY, isShowTextLineNumbers);
        applyTextLineNumbersState();
        // 隱藏期間 updateLineNumbers 會略過更新，重新顯示時要補算一次
        if (isShowTextLineNumbers && currentMode === 'text') updateLineNumbers();
        showToast(isShowTextLineNumbers ? '✅ 已顯示行號' : '❌ 已隱藏行號');
    });
}





/* ==========================================
   文字排版工具：分詞統計 模組
   ========================================== */
const wordStatsModal = document.getElementById('wordStatsModal');

// 1. 開啟與關閉對話框
document.getElementById('btnOpenWordStats')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentMode !== 'text') {
        showToast('⚠️ 分詞統計僅能在文字模式使用');
        return;
    }
    wordStatsModal.classList.remove('hidden');
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    centerModal(wordStatsModal);
});
document.getElementById('btnCloseWordStats')?.addEventListener('click', () => {
    wordStatsModal.classList.add('hidden');
});

// 2. 視窗全區拖曳 (桌機 + 手機)
let isDraggingWS = false, dragStartXWS = 0, dragStartYWS = 0, wsStartLeft = 0, wsStartTop = 0;
wordStatsModal.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, select, button, label')) return; 
    isDraggingWS = true; dragStartXWS = e.clientX; dragStartYWS = e.clientY;
    const rect = wordStatsModal.getBoundingClientRect();
    wsStartLeft = rect.left; wsStartTop = rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingWS) return;
    wordStatsModal.style.left = `${wsStartLeft + (e.clientX - dragStartXWS)}px`;
    wordStatsModal.style.top = `${wsStartTop + (e.clientY - dragStartYWS)}px`;
    wordStatsModal.style.transform = 'none';
});
document.addEventListener('mouseup', () => { isDraggingWS = false; document.body.style.userSelect = ''; });

wordStatsModal.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, select, button, label')) return; 
    const touch = e.touches[0];
    isDraggingWS = true; dragStartXWS = touch.clientX; dragStartYWS = touch.clientY;
    const rect = wordStatsModal.getBoundingClientRect();
    wsStartLeft = rect.left; wsStartTop = rect.top;
    if (!e.target.closest('select')) e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    if (!isDraggingWS) return;
    const touch = e.touches[0];
    wordStatsModal.style.left = `${wsStartLeft + (touch.clientX - dragStartXWS)}px`;
    wordStatsModal.style.top = `${wsStartTop + (touch.clientY - dragStartYWS)}px`;
    wordStatsModal.style.transform = 'none';
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { isDraggingWS = false; });

// 3. 核心邏輯：執行分詞統計
document.getElementById('btnApplyWordStats')?.addEventListener('click', () => {
    if (currentMode !== 'text') return showToast('⚠️ 僅能在文字模式使用');

    const sepMode = document.getElementById('wsSeparator').value;
    const showCount = document.getElementById('wsShowCount').value === 'yes';
    const sortMode = document.getElementById('wsSort').value;
    const filterMode = document.getElementById('wsFilter').value;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const hasSelection = start !== end;
    
    // 如果有選取則統計選取範圍，否則統計全文
    let textToProcess = hasSelection ? editor.value.substring(start, end) : editor.value;
    if (!textToProcess.trim()) return showToast('⚠️ 沒有文字可供統計');

    // ================= 修改開始：對調分詞與篩選的順序 =================
    
    // (1) 先執行分詞
    let tokens = [];
    if (sepMode === 'char') {
        // 使用展開運算子 [...] 可完美處理含有代理對 (Surrogate Pairs) 的擴充漢字
        tokens = [...textToProcess].filter(t => !/^\s$/.test(t)); // 預設排除純空白字元
    } else if (sepMode === '_') {
        // 先用底線與換行將文字切開
        tokens = textToProcess.split(/[_\n\r]+/).map(t => t.trim()).filter(t => t !== '');
    } else {
        // 空格分詞 (預設，\s 已經包含換行與空格)
        tokens = textToProcess.split(/\s+/).filter(t => t !== '');
    }

    // (2) 再執行文字篩選：排除標點符號與符號
    if (filterMode === 'no_punct') {
        // 針對切好的每個詞彙，單獨清除裡面的標點符號，並過濾掉變成空字串的項目
        tokens = tokens.map(t => t.replace(/[\p{P}\p{S}]/gu, '')).filter(t => t !== '');
    }
    
    // ================= 修改結束 =================

    if (tokens.length === 0) return showToast('⚠️ 沒有可統計的詞彙');

    // (3) 統計次數並記錄初次出現的順序
    const counts = new Map();
    const firstAppearance = new Map();

    tokens.forEach((token, idx) => {
        counts.set(token, (counts.get(token) || 0) + 1);
        if (!firstAppearance.has(token)) {
            firstAppearance.set(token, idx);
        }
    });

    // (4) 進行排序
    let uniqueTokens = Array.from(counts.keys());
    uniqueTokens.sort((a, b) => {
        if (sortMode === 'desc') {
            const diff = counts.get(b) - counts.get(a);
            return diff !== 0 ? diff : firstAppearance.get(a) - firstAppearance.get(b);
        } else if (sortMode === 'asc') {
            const diff = counts.get(a) - counts.get(b);
            return diff !== 0 ? diff : firstAppearance.get(a) - firstAppearance.get(b);
        } else { // orig
            return firstAppearance.get(a) - firstAppearance.get(b);
        }
    });

    // (5) 格式化結果字串
    const resultLines = uniqueTokens.map(token => {
        if (showCount) {
            return `${counts.get(token)}\t${token}`;
        } else {
            return token;
        }
    });

    const newText = resultLines.join('\n');

    // (6) 輸出至編輯器
    if (hasSelection) {
        editor.setRangeText(newText, start, end, 'select');
    } else {
        editor.value = newText;
    }

    // 觸發全域更新與存檔
    updateLineNumbers();
    localStorage.setItem(STORAGE_KEY, editor.value);
    debouncedSaveHistory();
    if (typeof updateWordCountWidget === 'function') updateWordCountWidget();

    wordStatsModal.classList.add('hidden');
    showToast('✅ 分詞統計已完成');
});




// =================================================================
// 語文處理核心引擎 (Text Processing Engine) - 支援動態比對開關
// =================================================================
window.TextToolsEngine = {
    getLength(txt) { return [...(txt || '')].length; },
    getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },

    // ✨ 取得比對結果綴詞的共用引擎 (判斷核取方塊是否開啟)
    getCompareSuffix(cLen, pLen) {
        const chk = document.getElementById('chkAppendCompare');
        let needCompare = true;
        if (chk) {
            needCompare = chk.checked;
        } else {
            // 如果面板沒打開，則讀取使用者的歷史偏好 (預設為開啟)
            needCompare = localStorage.getItem('wesing-append-compare') !== 'false';
        }
        if (!needCompare) return '';
        const marker = cLen > pLen ? 'X' : (cLen === pLen ? 'O' : 'Y');
        return `\t${cLen}\\${pLen}\t${marker}`;
    },

    // 1. 併單音節
    combineCharacter(input) {
        const lines = input.split('\n');
        let finalLines = [];
        lines.forEach(line => {
            if (line.trim() === '' || line.trim() === '\t') { finalLines.push(line); return; }
            const [chinese, pinyin] = line.split('\t');
            if (!chinese && !pinyin) { finalLines.push(line); return; }
            
            let pinyinProcessed = (pinyin || '').replace(/([。，、；：【】「」『』（）─？！…﹏《 》〈 〉＿．—～~／\(\)\[\]{}\/,.?;:!"'“”‘’·])/g, ' $1 ')
                                    .replace(/\s+/g, ' ').replace(/(=)/g, ' =').replace(/(-+)/g, ' $1').trim();
            
            const chineseChars = [...(chinese || '').replace(/[\s|_]+/g, '')];
            const pinyinParts = pinyinProcessed.split(' ').filter(Boolean);

            let pinyinIndex = 0;
            let currentOutput = '';
            chineseChars.forEach(char => {
                if (char.trim() !== '') {
                    currentOutput += char + '\\' + (pinyinParts[pinyinIndex] || '') + ' ';
                    pinyinIndex++;
                }
            });
            
            // ✨ 呼叫引擎判斷是否要附加比對字串
            const suffix = window.TextToolsEngine.getCompareSuffix(chineseChars.length, pinyinParts.length);
            finalLines.push(currentOutput.trim() + suffix);
        });
        return finalLines.join('\n');
    },

    // 2. 併多音節
    combineHyphen(input) {
        const lines = input.split('\n');
        let output = '';
        const punctuationRegex = /[。，、；：【】「」『』（）─？！…﹏《》〈〉＿．—～~／\“\”\‘\’\(\)\[\]{}\/,.?;:!"'·]/;

        lines.forEach(line => {
            if (line.trim() === '' || line.trim() === '\t') { output += line + '\n'; return; }
            const parts = line.split('\t').map(part => part.trim());
            const chinese = parts[0] || '';
            const pinyin = parts[1] || '';
            if (!chinese || !pinyin) { output += line + '\n'; return; }

            let currentOutput = '';
            
            const splitChineseWithDigits = (text) => {
                let joinedText = [...text].join('ˉ'); 
                joinedText = joinedText.replace(/\d(ˉ\d)+/g, match => match.replace(/ˉ/g, ''));
                joinedText = joinedText.replace(/(…)(ˉ…)+/g, match => match.replace(/ˉ/g, '')); 
                joinedText = joinedText.replace(/(—)(ˉ—)+/g, match => match.replace(/ˉ/g, '')); 
                joinedText = joinedText.replace(/(─)(ˉ─)+/g, match => match.replace(/ˉ/g, '')); 
                
                const latinRegex = /([a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\u0300-\u036F\u207F\-]+(ˉ[a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\u0300-\u036F\u207F\-]+)+)/g;
                joinedText = joinedText.replace(latinRegex, match => match.replace(/ˉ/g, ''));

                return joinedText.split('ˉ');
            };

            const chineseChars = splitChineseWithDigits(chinese);
            
            let processedPinyin = pinyin.replace(/\.+/g, match => ` ⚑${match.length}⚑ `);
            processedPinyin = processedPinyin.replace(/([。，、；：【】「」『』（）─？！…﹏《》〈〉＿．—～~／\“\”\‘\’\(\)\[\]{}\/,.?;:!"'·])/g, ' $1 ');
            processedPinyin = processedPinyin.replace(/⚑(\d+)⚑/g, (match, p1) => '.'.repeat(parseInt(p1)));
            
            const pinyinGroups = processedPinyin.split(/\s+/).filter(g => g.length > 0);
            
            let chineseIndex = 0, pinyinIndex = 0, chineseCount = 0, pinyinCount = 0;
            
            while (chineseIndex < chineseChars.length || pinyinIndex < pinyinGroups.length) {
                let hasPunc = false;
                while (
                    (chineseIndex < chineseChars.length && punctuationRegex.test(chineseChars[chineseIndex])) ||
                    (pinyinIndex < pinyinGroups.length && punctuationRegex.test(pinyinGroups[pinyinIndex]))
                ) {
                    hasPunc = true;
                    let cPunc = '';
                    let pPunc = '';
                    
                    if (chineseIndex < chineseChars.length && punctuationRegex.test(chineseChars[chineseIndex])) {
                        cPunc = chineseChars[chineseIndex];
                        chineseIndex++; chineseCount++;
                    }
                    
                    if (pinyinIndex < pinyinGroups.length && punctuationRegex.test(pinyinGroups[pinyinIndex])) {
                        pPunc = pinyinGroups[pinyinIndex];
                        pinyinIndex++; pinyinCount++;
                    }
                    
                    if (cPunc && pPunc) {
                        currentOutput += `${cPunc} ${pPunc} `; 
                    } else if (cPunc) {
                        currentOutput += `${cPunc} `;          
                    } else if (pPunc) {
                        currentOutput += ` ${pPunc} `;         
                    }
                }
                
                if (hasPunc) continue; 
                
                if (chineseIndex < chineseChars.length && pinyinIndex < pinyinGroups.length) {
                    const currentPinyin = pinyinGroups[pinyinIndex];
                    if (!punctuationRegex.test(currentPinyin)) {
                        
                        // ✨ 核心修正點：音節動態分配器
                        if (currentPinyin.includes('-')) {
                            const pinyinParts = currentPinyin.split(/-+/).filter(Boolean);
                            const pSyllables = pinyinParts.length;

                            let matchGroup = [];
                            let matchSyllables = 0;
                            let tempIndex = chineseIndex;
                            let hasLatin = false;
                            const latinCheckRegex = /[a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]/;

                            // 1. 抓取滿足音節數量的文字群組
                            while (matchSyllables < pSyllables && tempIndex < chineseChars.length) {
                                let char = chineseChars[tempIndex];
                                if (punctuationRegex.test(char)) break;
                                matchGroup.push(char);
                                if (latinCheckRegex.test(char)) {
                                    hasLatin = true;
                                    matchSyllables += char.split(/-+/).filter(Boolean).length;
                                } else {
                                    matchSyllables += 1;
                                }
                                tempIndex++;
                            }

                            if (matchGroup.length === 0) {
                                currentOutput += `\\${currentPinyin} `;
                            } else if (!hasLatin) {
                                // 2A. 純中文模式：合併整個群組
                                const relevantChars = matchGroup.join('');
                                currentOutput += `${relevantChars}\\${currentPinyin} `;
                                chineseIndex += matchGroup.length;
                                chineseCount++;
                            } else {
                                // 2B. 中英夾雜模式：切割拼音並依序分配
                                const regex = /(-*)([^-]+)/g;
                                let match;
                                let parsedPinyin = [];
                                while ((match = regex.exec(currentPinyin)) !== null) {
                                    parsedPinyin.push({ sep: match[1], text: match[2] });
                                }

                                let pParsedIndex = 0;
                                for (let i = 0; i < matchGroup.length; i++) {
                                    let char = matchGroup[i];
                                    let sCount = latinCheckRegex.test(char) ? char.split(/-+/).filter(Boolean).length : 1;
                                    let piece = '';
                                    
                                    for (let s = 0; s < sCount; s++) {
                                        if (pParsedIndex < parsedPinyin.length) {
                                            let part = parsedPinyin[pParsedIndex];
                                            piece += part.sep + part.text;
                                            pParsedIndex++;
                                        }
                                    }
                                    currentOutput += `${char}\\${piece} `;
                                    chineseCount++;
                                }
                                chineseIndex += matchGroup.length;
                            }
                        } else {
                            currentOutput += `${chineseChars[chineseIndex]}\\${currentPinyin} `;
                            chineseIndex++; chineseCount++;
                        }
                        pinyinIndex++; pinyinCount++;
                    } else {
                        currentOutput += ` ${currentPinyin} `;
                        pinyinIndex++; pinyinCount++;
                    }
                } else if (chineseIndex < chineseChars.length) {
                    const currentChar = chineseChars[chineseIndex];
                    if (!punctuationRegex.test(currentChar)) {
                        currentOutput += `${currentChar}\\${currentChar} `;
                        chineseCount++;
                    } else { currentOutput += currentChar + ' '; }
                    chineseIndex++;
                } else if (pinyinIndex < pinyinGroups.length) {
                    const currentPinyin = pinyinGroups[pinyinIndex];
                    if (!punctuationRegex.test(currentPinyin)) {
                        currentOutput += `${currentPinyin}\\${currentPinyin} `;
                        pinyinCount++;
                    } else { currentOutput += ` ${currentPinyin} `; }
                    pinyinIndex++;
                }
            }
            currentOutput = currentOutput.replace(/\s+/g, ' ').trim();
            
            const suffix = window.TextToolsEngine.getCompareSuffix(chineseCount, pinyinCount);
            output += currentOutput + suffix + '\n';
        });
        return output.trim();
    },
    // 3. 詞音合併
    combineWords(input) {
        const lines = input.split('\n');
        let finalLines = [];
        lines.forEach(line => {
            if (line.trim() === '' || line.trim() === '\t') { finalLines.push(line); return; }
            const [chinesePart, pinyinPart] = line.split('\t');
            if (!chinesePart && !pinyinPart) { finalLines.push(line); return; }

            const chineseProcessed = (chinesePart||'').replace(/[\s|_]+/g, ' ').trim();
            const chineseLength = [...chineseProcessed.replace(/[\s|_]+/g, '')].length;
            let pinyinProcessed = (pinyinPart||'').replace(/([。，、；：【】「」『』（）─？！…﹏《 》〈 〉＿．—～~／\(\)\[\]{}\/,.?;:!"'“”‘’·])/g, ' $1 ').replace(/([-=]+)/g, ' $1').replace(/\s+/g, ' ').trim();
            
            const pinyinGroups = pinyinProcessed.split(' ').filter(Boolean);
            const pinyinLength = pinyinGroups.length;
            const chineseGroups = chineseProcessed.split(' ').filter(Boolean);

            let pinyinIndex = 0;
            let groupOutputs = [];
            chineseGroups.forEach(group => {
                let pinyinGroup = '';
                let groupLength = [...group].length;
                for (let i = 0; i < groupLength; i++) {
                    if (pinyinIndex < pinyinGroups.length) {
                        pinyinGroup += (i > 0 ? ' ' : '') + pinyinGroups[pinyinIndex++];
                    }
                }
                groupOutputs.push(group + '\\' + pinyinGroup);
            });
            
            // ✨ 呼叫引擎判斷是否要附加比對字串
            const suffix = window.TextToolsEngine.getCompareSuffix(chineseLength, pinyinLength);
            finalLines.push(groupOutputs.join('_') + suffix);
        });
        return finalLines.map(line => line.trim() ? "_" + line : line).join('\n');
    },

    // 4. 詞音交錯
    combineWordsPinyin(input) {
        const lines = input.split('\n');
        let finalLines = [];
        lines.forEach(line => {
            if (line.trim() === '' || line.trim() === '\t') { finalLines.push(line); return; }
            const [chinesePart, pinyinPart] = line.split('\t');
            if (!chinesePart && !pinyinPart) { finalLines.push(line); return; }

            const chineseProcessed = (chinesePart||'').replace(/\s+/g, ' ').trim();
            const pinyinProcessed = (pinyinPart||'').replace(/([。，、；：【】「」『』（）─？！…﹏《 》〈 〉＿．—～~／\(\)\[\]{}\/,.?;:!"'“”‘’·])/g, ' $1 ').replace(/([-=]+)/g, ' $1').replace(/\s+/g, ' ').trim();

            const chineseLength = [...chineseProcessed.replace(/[\s|_]+/g, '')].length;
            const pinyinGroups = pinyinProcessed.split(' ').filter(Boolean);
            const pinyinLength = pinyinGroups.length;
            const chineseGroups = chineseProcessed.split(' ').filter(Boolean);

            let pinyinIndex = 0;
            let groupOutputs = [];
            chineseGroups.forEach((group) => {
                let currentGroup = '';
                [...group].forEach((char, charIndex) => {
                    if (charIndex > 0) currentGroup += ' ';
                    currentGroup += char + '\\' + (pinyinGroups[pinyinIndex] || '');
                    pinyinIndex++;
                });
                groupOutputs.push(currentGroup);
            });
            
            // ✨ 呼叫引擎判斷是否要附加比對字串
            const suffix = window.TextToolsEngine.getCompareSuffix(chineseLength, pinyinLength);
            finalLines.push(groupOutputs.join('_') + suffix);
        });
        return finalLines.join('\n');
    },

    // 5. 標點同步 (相同注音)
    samePunctuation(input) {
        const lines = input.split('\n');
        const processedLines = [];
        const isHanziRegex = /\p{Script=Han}/u;
        const isPunctuationRegex = /[^\p{L}\p{N}]/u;
        const punctCaptureRegex = /([^\p{L}\p{N}])/gu;

        const extractContentAndPunctuation = (tokens, isContentCondition) => {
            const content = [];
            const punctuationMap = new Map();
            let currentPunctuation = [];

            for (const token of tokens) {
                const isContent = (typeof isContentCondition === 'function') ? isContentCondition(token) : isContentCondition.test(token);
                if (isContent) {
                    if (currentPunctuation.length > 0) {
                        punctuationMap.set(content.length, currentPunctuation);
                        currentPunctuation = [];
                    }
                    content.push(token);
                } else {
                    currentPunctuation.push(token);
                }
            }
            if (currentPunctuation.length > 0) {
                punctuationMap.set(content.length, currentPunctuation);
            }
            return { content, punctuationMap };
        };

        for (const line of lines) {
            if (line.trim() === '') { processedLines.push(''); continue; }
            
            const parts = line.split('\t');
            if (parts.length < 2) { processedLines.push(line); continue; }

            const [hanziPart, pinyinPart] = parts;
            const hanziTokens = [...hanziPart];
            const pinyinTokens = pinyinPart.trim().replace(punctCaptureRegex, ' $1 ').split(/\s+/).filter(Boolean);

            const { content: hanziContent, punctuationMap: hanziPunctuationMap } = extractContentAndPunctuation(hanziTokens, isHanziRegex);
            const { content: pinyinContent, punctuationMap: pinyinPunctuationMap } = extractContentAndPunctuation(pinyinTokens, (token) => !isPunctuationRegex.test(token));

            let newHanziString = '';
            let newPinyinString = '';
            const maxContentLength = Math.max(hanziContent.length, pinyinContent.length);

            for (let i = 0; i <= maxContentLength; i++) {
                const puncFromHanzi = hanziPunctuationMap.get(i) || [];
                const puncFromPinyin = pinyinPunctuationMap.get(i) || [];
                
                const finalPunctuationTokens = puncFromHanzi.length > 0 ? puncFromHanzi : puncFromPinyin;
                
                if (finalPunctuationTokens.length > 0) {
                    newHanziString += finalPunctuationTokens.join('');
                    const pinyinPunctuationString = finalPunctuationTokens.join(' ');
                    if (newPinyinString.length > 0 && !newPinyinString.endsWith(' ')) {
                         newPinyinString += ' ';
                    }
                    newPinyinString += pinyinPunctuationString + ' ';
                }

                if (i < hanziContent.length) { newHanziString += hanziContent[i]; }
                if (i < pinyinContent.length) { newPinyinString += pinyinContent[i] + ' '; }
            }
            
            // ✨ 呼叫引擎判斷是否要附加比對字串
            const suffix = window.TextToolsEngine.getCompareSuffix(hanziContent.length, pinyinContent.length);
            processedLines.push(`${newHanziString.trim()}\t${newPinyinString.trim()}${suffix}`);
        }
        return processedLines.join('\n');
    },

    // 6. 字音詞音
    arrangeText(input) {
        return input.split(/\r?\n/).map(line => {
            if (!line.trim()) return '';
            return line.split(/([；、，：。！])/g).map(segment => {
                if (!segment.trim() || /^[；、，：。！]$/.test(segment)) return segment;
                const pairs = segment.trim().split(/\s+/);
                if (!pairs[0]) return '';
                const characters = [], pronunciations = [];
                pairs.forEach(pair => {
                    let char, pron;
                    if (pair.includes('\\')) {
                        [char, pron] = pair.split('\\');
                    } else {
                        const pinyinStart = pair.search(/[a-zA-Z]/);
                        if (pinyinStart !== -1) {
                            char = pair.slice(0, pinyinStart);
                            pron = pair.slice(pinyinStart);
                        }
                    }
                    if (char && pron) { characters.push(char); pronunciations.push(pron); }
                });
                return characters.length > 0 ? `${characters.join('')}\\${pronunciations.join(' ')}` : '';
            }).join('');
        }).join('\n');
    },

    // 7. 詞音字音
    reverseArrangeText(input) {
        const lines = input.split(/\r?\n/);
        return lines.map(line => {
            if (!line.trim()) return '';
            
            const segments = line.split(/([。，、；：！？「」『』（）《》〈〉…—])/); 
            
            let cLen = 0, pLen = 0;
            let isTargetLine = false;

            const processedStr = segments.map(segment => {
                if (/^[。，、；：！？「」『』（）《》〈〉…—]$/.test(segment)) return segment;
                if (!segment.trim()) return segment;

                if (!segment.includes('\\')) {
                    const hanziRegex = /\p{Script=Han}/gu; 
                    const hanziMatches = segment.match(hanziRegex) || [];
                    let remainingText = segment;
                    hanziMatches.forEach(hanzi => { remainingText = remainingText.replace(hanzi, ''); });
                    const pronMatches = remainingText.trim().split(/\s+/).filter(Boolean);
                    
                    if (hanziMatches.length > 0 || pronMatches.length > 0) {
                        isTargetLine = true;
                        cLen += hanziMatches.length;
                        pLen += pronMatches.length;
                        if (hanziMatches.length === pronMatches.length && pronMatches.length > 0) {
                            return hanziMatches.map((char, i) => `${char}\\${pronMatches[i]}`).join(' ');
                        }
                    }
                    return segment;
                } else {
                    isTargetLine = true;
                    let parts = segment.trim().split('\\');
                    let chars = parts[0] || '';
                    let prons = parts[1] || '';
                    
                    const charArray = [...chars]; 
                    const pronArray = prons.split(/\s+/).filter(Boolean);
                    
                    cLen += charArray.length;
                    pLen += pronArray.length;

                    if (charArray.length === pronArray.length && pronArray.length > 0) {
                        return charArray.map((char, i) => `${char}\\${pronArray[i]}`).join(' ');
                    }
                    return segment;
                }
            }).join('');

            // ✨ 呼叫引擎判斷是否要附加比對字串
            if (isTargetLine) {
                const suffix = window.TextToolsEngine.getCompareSuffix(cLen, pLen);
                return `${processedStr}${suffix}`;
            }
            return processedStr;
        }).join('\n');
    },

    // 8. 字音字形
    examText(input) {
        const lines = input.trim().split('\n').filter(line => line.trim() !== '');
        let output = '', isTwoColumnFormat = false;
        if (lines.length > 0 && lines[0].split('\t').length === 2) isTwoColumnFormat = true;

        lines.forEach(line => {
            let num, chars, pinyin;
            if (isTwoColumnFormat) { [chars, pinyin] = line.split('\t'); num = 0; } 
            else { [num, chars, pinyin] = line.split('\t'); }
            chars = chars.replace(/\s+/g, '');
            pinyin = pinyin.replace(/([\s-=])+/g, '_$1');

            let numInt = parseInt(num);
            const charLength = this.getLength(chars);
            const pinyinArray = pinyin.split('_');
            
            if (isTwoColumnFormat || !num || numInt === 0) numInt = this.getRandomInt(1, charLength);
            
            if (numInt <= charLength && charLength === pinyinArray.length) {
                const selectedCharIndex = numInt - 1;
                const selectedChar = [...chars][selectedCharIndex]; 
                let selectedPinyin = pinyinArray[selectedCharIndex];
                const newChars = [...chars].map((c, index) => index === selectedCharIndex ? `「${c}」` : c).join('');
                let pinyinParts = pinyinArray.map((part, index) => index === selectedCharIndex ? `「${part}」` : part).join('');
                pinyinParts = pinyinParts.replace(/(「)(-+)/g, '$2$1').replace(/( )(「)/g, '$2').replace(/(」)( )/g, '$1');
                selectedPinyin = selectedPinyin.replace(/-+/g, '');
                output += `${numInt}\t${newChars}\t${selectedPinyin.trim()}\t${pinyinParts}\t${selectedChar}\n`;
            } else {
                output += line + '\t(錯誤: 長度不符)\n';
            }
        });
        return output.trim();
    },

    // 9. 「字」標數
    examWhichWord(input) {
        return input.trim().split(/\r?\n/).map(line => {
            const cleanChars = [...line.replace(/\s+/g, '')]; 
            const match = line.match(/「(.*?)」/);
            if (!match) return line;
            const targetChar = match[1];
            let count = 0, position = -1;
            for (let i = 0; i < cleanChars.length; i++) {
                const ch = cleanChars[i];
                if (ch === '「' || ch === '」') continue;
                count++;
                if (ch === targetChar) { position = count; break; }
            }
            return `${position}\t${line}`;
        }).join("\n");
    },

    // 10. 「yin」標數
    examWhichPinyin(input) {
        return input.trim().split('\n').map(line => {
            line = line.replace(/\s+/g, ' ').trim().replace(/「\s*/g, '「').replace(/\s*」/g, '」');
            const count = line.startsWith('「') ? 1 : 2;
            return `${count}\t${line}`;
        }).join('\n');
    },

    // 11. 比對字音 (抓錯專用工具，必定顯示比對結果)
    compareCharPinyin(input) {
        const lines = input.split('\n');
        let finalLines = [];
        lines.forEach(line => {
            if (line.trim() === '' || line.trim() === '\t') { finalLines.push(line); return; }
            const parts = line.split('\t');
            const chinese = parts[0] || '';
            const pinyin = parts[1] || '';
            
            if (!chinese && !pinyin) { finalLines.push(line); return; }
            
            let pinyinProcessed = pinyin.replace(/([。，、；：【】「」『』（）─？！…﹏《 》〈 〉＿．—～~／\(\)\[\]{}\/,.?;:!"'“”‘’·])/g, ' $1 ')
                                    .replace(/\s+/g, ' ').replace(/(=)/g, ' =').replace(/(-+)/g, ' $1').trim();
            
            const chineseChars = [...chinese.replace(/[\s|_]+/g, '')];
            const pinyinParts = pinyinProcessed.split(' ').filter(Boolean);

            const cLen = chineseChars.length;
            const pLen = pinyinParts.length;
            const marker = cLen > pLen ? 'X' : (cLen === pLen ? 'O' : 'Y');
            
            finalLines.push(`${line}\t${cLen}\\${pLen}\t${marker}`);
        });
        return finalLines.join('\n');
    }
};



// =================================================================
// 語文工具統一調度器 (完美支援文字模式與表格模式選取轉換)
// =================================================================
window.executeTextTool = async function(toolName) {
    // 詞詞整併不屬於 TextToolsEngine，轉交給專用處理函式
    if (toolName === 'compareWords') return window.runTextToolExtras('compareWords');

    if (!window.TextToolsEngine || typeof window.TextToolsEngine[toolName] !== 'function') {
        console.error("找不到該語文工具或引擎遺失:", toolName);
        if (typeof showToast === 'function') showToast('❌ 找不到核心引擎，請確認程式碼是否完整貼上');
        return;
    }

    const isTableMode = currentMode === 'table';
    const chkKeep = document.getElementById('chkKeepTextOriginal');
    
    // ✨ 表格模式預設為 true (強制保留原文，往右側擴充)；文字模式則看面板上的勾選狀態
    let keepOriginal = isTableMode ? true : (chkKeep ? chkKeep.checked : false);

    try {
        if (!isTableMode) {
            // ==========================================
            // 情境 1：文字模式 (Textarea 處理)
            // ==========================================
            const editor = document.getElementById('editor');
            if (!editor || !editor.value) return;

            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const isPartial = start !== end;
            
            let textToProcess = isPartial ? editor.value.substring(start, end) : editor.value;
            let convertedText = "";

            if (keepOriginal) {
                // 保留原文，將轉換結果用 Tab 拼接到原行後方
                const lines = textToProcess.split('\n');
                const newLines = lines.map(line => {
                    if (line.replace(/\t/g, '').trim() === '') return line; 
                    return line + '\t' + window.TextToolsEngine[toolName](line);
                });
                convertedText = newLines.join('\n');
            } else {
                convertedText = window.TextToolsEngine[toolName](textToProcess);
            }
            
            if (isPartial) {
                let processedText = editor.value.substring(0, start) + convertedText + editor.value.substring(end);
                editor.value = processedText;
                editor.setSelectionRange(start, start + convertedText.length);
                editor.blur(); editor.focus();
            } else {
                editor.value = convertedText;
            }

            if (typeof debouncedUpdateLineNumbers === 'function') debouncedUpdateLineNumbers();

        } else {
            // ==========================================
            // 情境 2：表格模式 (精準選取擷取與右側擴張寫入)
            // ==========================================
            
            // 1. 取得目前的選取範圍邊界
            let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
            if (selectedCellBlocks && selectedCellBlocks.length > 0) {
                selectedCellBlocks.forEach(b => {
                    minR = Math.min(minR, b.startR, b.endR); maxR = Math.max(maxR, b.startR, b.endR);
                    minC = Math.min(minC, b.startC, b.endC); maxC = Math.max(maxC, b.startC, b.endC);
                });
            } else if (selectedRows && selectedRows.length > 0) {
                minR = Math.min(...selectedRows); maxR = Math.max(...selectedRows);
                minC = 0; maxC = document.querySelector('#data-table thead tr').children.length - 2;
            } else if (selectedCols && selectedCols.length > 0) {
                minR = 0; maxR = document.querySelectorAll('#data-table tbody tr').length - 1;
                minC = Math.min(...selectedCols); maxC = Math.max(...selectedCols);
            } else if (lastClickedCell) {
                minR = maxR = lastClickedCell.r;
                minC = maxC = lastClickedCell.c;
            } else {
                return showToast('⚠️ 請先選取要轉換的儲存格範圍 (例如左欄漢字、右欄拼音)');
            }

            const tbodyRows = document.querySelectorAll('#data-table tbody tr');
            
            // 2. 讀取選取範圍內的資料，組合成 TSV 字串
            let extractedLines = [];
            for (let r = minR; r <= maxR; r++) {
                let rowParts = [];
                for (let c = minC; c <= maxC; c++) {
                    const inner = tbodyRows[r]?.children[c + 1]?.querySelector('.td-inner');
                    let cellText = inner ? (inner.hasAttribute('data-formula') ? inner.getAttribute('data-formula') : getCellText(inner)) : "";
                    rowParts.push(cellText);
                }
                extractedLines.push(rowParts.join('\t'));
            }
            const textToProcess = extractedLines.join('\n');

            // 3. 送入核心引擎轉換
            let convertedText = "";
            if (keepOriginal) {
                const lines = textToProcess.split('\n');
                const newLines = lines.map(line => {
                    if (line.replace(/\t/g, '').trim() === '') return line; 
                    return line + '\t' + window.TextToolsEngine[toolName](line);
                });
                convertedText = newLines.join('\n');
            } else {
                convertedText = window.TextToolsEngine[toolName](textToProcess);
            }
            
            // 4. 解析結果字串回二維陣列
            const convertedData = typeof parseTSV === 'function' ? parseTSV(convertedText) : convertedText.split('\n').map(l => l.split('\t'));
            
            // 5. 確保表格右側欄位數量足夠寫入新資料
            const resultWidth = convertedData[0] ? convertedData[0].length : 1;
            const theadTr = document.querySelector('#data-table thead tr');
            const currentCols = theadTr.children.length - 1;
            const requiredCols = minC + resultWidth;

            if (requiredCols > currentCols) {
                if (typeof insertColAt === 'function') {
                    insertColAt(currentCols, -1, requiredCols - currentCols);
                }
            }

            const updatedRows = document.querySelectorAll('#data-table tbody tr');

            // 6. 原位覆寫 (包含新產生的右側結果)
            for (let i = 0; i < convertedData.length; i++) {
                const r = minR + i;
                for (let j = 0; j < convertedData[i].length; j++) {
                    const targetInner = updatedRows[r]?.children[minC + j + 1]?.querySelector('.td-inner');
                    if (targetInner) {
                        targetInner.removeAttribute('data-formula');
                        targetInner.innerText = convertedData[i][j];
                    }
                }
            }
            
            // 7. 清除多餘殘留資料 (當不保留原文，且新資料欄位小於原本選取欄位時)
            const originalWidth = maxC - minC + 1;
            if (!keepOriginal && resultWidth < originalWidth) {
                for (let i = 0; i < convertedData.length; i++) {
                    const r = minR + i;
                    for (let j = resultWidth; j < originalWidth; j++) {
                        const targetInner = updatedRows[r]?.children[minC + j + 1]?.querySelector('.td-inner');
                        if (targetInner) {
                            targetInner.removeAttribute('data-formula');
                            targetInner.innerText = '';
                        }
                    }
                }
            }

            if (typeof recalculateAllFormulas === 'function') recalculateAllFormulas();
        }

        // 統一存檔與提示
        if (typeof debouncedSaveHistory === 'function') debouncedSaveHistory();
        if (typeof saveAllTabsData === 'function') saveAllTabsData();
        if (typeof showToast === 'function') showToast('✅ 轉換與檢核完成！');

    } catch (err) {
        console.error("轉換失敗:", err);
        if (typeof showToast === 'function') showToast('❌ 轉換失敗，請檢查資料格式');
    }
};




// =================================================================
// 視覺化語文工具箱
// =================================================================
window.showTextToolsModal = function() {
    const modalId = "text-tools-floating-panel";
    const existingModal = document.getElementById(modalId);
    
    if (existingModal) {
        existingModal.classList.add('opacity-0');
        setTimeout(() => existingModal.remove(), 200);
        return;
    }

    // 讀取使用者的比對開關偏好
    const isCompareChecked = localStorage.getItem('wesing-append-compare') !== 'false';

    const toolCategories = [
        {
            category: "詞彙整併與統計",
            icon: "rule_folder",
            tools: [
                { id: 'compareWords', name: '詞詞整併', desc: '比對兩欄詞數與統計', in: '_大_家_\t_大_家_', out: '2\\2\tO\t次數\t大\t大' }
            ]
        },
        {
            category: "基礎字音整併 (左字 \t 右音)",
            icon: "join",
            tools: [
                { id: 'compareCharPinyin', name: '比對字音', desc: '檢核字數音數', in: '大家\ttai ga', out: '大家\ttai ga\t2\\2\tO' },
                { id: 'combineCharacter', name: '併單音節', desc: '一字一音', in: '大 家\ttai gav', out: '大\\tai 家\\gav' },
                { id: 'combineHyphen', name: '併多音節', desc: '連字符號', in: '大家\ttai-gav', out: '大家\\tai-gav' },
                { id: 'combineWords', name: '詞音合併', desc: '以詞為單位', in: '大家 好\ttai gav hox', out: '大家\\tai gav_好\\hox' },
                { id: 'combineWordsPinyin', name: '詞音交錯', desc: '詞內交錯', in: '大家 好\ttai gav hox', out: '大\\tai 家\\gav_好\\hox' },
                { id: 'samePunctuation', name: '標點同步', desc: '雙邊符號一致', in: '大，家\ttai gav', out: '大，家\ttai ， gav' }
            ]
        },
        {
            category: "格式雙向轉換",
            icon: "transform",
            tools: [
                { id: 'arrangeText', name: '字音轉詞音', desc: '空格轉斜線', in: '大tai 家gav', out: '大家\\tai gav' },
                { id: 'reverseArrangeText', name: '詞音轉字音', desc: '斜線轉空格', in: '大家\\tai gav', out: '大tai 家gav' }
            ]
        },
        {
            category: "測驗與標記",
            icon: "quiz",
            tools: [
                { id: 'examText', name: '字音字形', desc: '隨機挖空', in: '大 家\ttai gav', out: '1\t「大」家\ttai\t「tai」 gav\t大' },
                { id: 'examWhichWord', name: '「字」標數', desc: '目標字位置', in: '文「字」', out: '2\t文「字」' },
                { id: 'examWhichPinyin', name: '「yin」標數', desc: '目標音位置', in: 'pin「yin」', out: '2\tpin「yin」' }
            ]
        }
    ];

    const panel = document.createElement('div');
    panel.id = modalId;
    panel.className = "fixed w-[280px] bg-[#f8f9fa] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex flex-col border border-gray-200 z-[6000] overflow-hidden transition-opacity duration-200 opacity-0";
    
    // ✨ 智慧判斷初始位置：手機版置中且偏上，避免擋住鍵盤或被截斷
    if (window.innerWidth <= 768) {
        const leftPos = (window.innerWidth - 280) / 2;
        panel.style.left = `${Math.max(5, leftPos)}px`;
        panel.style.top = '60px'; 
        panel.style.right = 'auto';
    } else {
        panel.style.top = '80px';
        panel.style.right = '32px';
        panel.style.left = 'auto';
    }

    let html = `
        <div id="text-tools-drag-handle" class="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 flex-shrink-0 cursor-move hover:bg-teal-50/50 transition-colors">
            <div class="flex items-center gap-1.5 pointer-events-none">
                <span class="material-symbols-outlined text-teal-600 text-[18px]">build_circle</span>
                <div><h3 class="font-extrabold text-gray-800 text-sm leading-tight">字音整併</h3></div>
            </div>
            <div class="flex items-center gap-1.5">
                <label class="flex items-center gap-1 cursor-pointer text-[11px] font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-1.5 py-1 rounded-md border border-teal-100 transition-colors">
                    <input type="checkbox" id="chkAppendCompare" class="accent-teal-600 w-3 h-3 pointer-events-none" ${isCompareChecked ? 'checked' : ''}>
                    比對
                </label>
                <label class="flex items-center gap-1 cursor-pointer text-[11px] font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-1.5 py-1 rounded-md border border-teal-100 transition-colors">
                    <input type="checkbox" id="chkKeepTextOriginal" class="accent-teal-600 w-3 h-3 pointer-events-none">
                    原文
                </label>
                <button id="btn-close-text-tools" class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition-colors cursor-pointer" title="關閉面板"><span class="material-symbols-outlined text-[18px] block">close</span></button>
            </div>
        </div>
        <div class="flex-1 overflow-y-auto p-2.5 scrollbar-thin max-h-[50vh] sm:max-h-[70vh]">
            <div class="flex flex-col gap-4">
    `;

    toolCategories.forEach(cat => {
        html += `<div><h4 class="text-[11px] font-extrabold text-teal-800 mb-2 flex items-center gap-1.5 pl-1"><span class="material-symbols-outlined text-[14px]">${cat.icon}</span> ${cat.category}</h4><div class="grid grid-cols-1 gap-1.5">`;
        cat.tools.forEach(tool => {
            html += `
                <div class="text-tool-card group bg-white border border-gray-200 rounded-lg p-2.5 cursor-pointer hover:border-teal-400 hover:shadow-sm transition-all active:scale-[0.98]" data-action="${tool.id}">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-extrabold text-gray-800 text-sm group-hover:text-teal-700 transition-colors">${tool.name}</span>
                        <span class="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">${tool.desc}</span>
                    </div>
                    <div class="bg-gray-50 rounded p-2 font-mono text-[11px] border border-gray-100/50 flex flex-col gap-1">
                        <div class="flex items-start gap-1.5 text-gray-500">
                            <span class="bg-gray-200 text-gray-600 text-[9px] px-1 py-0.5 rounded font-bold shrink-0 select-none mt-0.5">輸入</span>
                            <span class="break-all whitespace-pre-wrap">${escapeHtml(tool.in).replace(/\\t/g, '<span class="text-teal-300 mx-0.5">⇥</span>')}</span>
                        </div>
                        <div class="flex items-start gap-1.5 text-teal-800 font-bold">
                            <span class="bg-teal-100 text-teal-700 text-[9px] px-1 py-0.5 rounded font-bold shrink-0 select-none mt-0.5">輸出</span>
                            <span class="break-all whitespace-pre-wrap">${escapeHtml(tool.out)}</span>
                        </div>
                    </div>
                </div>`;
        });
        html += `</div></div>`;
    });
    html += `</div></div>`;

    panel.innerHTML = html;
    document.body.appendChild(panel);

    function escapeHtml(unsafe) {
        return (unsafe || '').toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    requestAnimationFrame(() => panel.classList.remove('opacity-0'));

    const closePanel = () => {
        panel.classList.add('opacity-0');
        setTimeout(() => panel.remove(), 200);
    };
    panel.querySelector('#btn-close-text-tools').addEventListener('click', closePanel);

    panel.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;
        const isTextInput = e.target.tagName === 'INPUT' && e.target.type === 'text';
        const isTextArea = e.target.tagName === 'TEXTAREA';
        if (!isTextInput && !isTextArea) {
            e.preventDefault(); 
        }
    });

    panel.querySelectorAll('label').forEach(lbl => {
        const inp = lbl.querySelector('input[type="checkbox"]');
        if (inp) {
            lbl.addEventListener('click', (e) => {
                e.preventDefault(); 
                inp.checked = !inp.checked; 
                
                if (inp.id === 'chkAppendCompare') {
                    localStorage.setItem('wesing-append-compare', inp.checked);
                }
            });
        }
    });

    const dragHandle = panel.querySelector('#text-tools-drag-handle');
    let isDragging = false, startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

    dragHandle.addEventListener('mousedown', (e) => {
        if (e.target.closest('button, input, label')) return; 
        isDragging = true;
        const rect = panel.getBoundingClientRect();
        initialLeft = rect.left; initialTop = rect.top;
        startX = e.clientX; startY = e.clientY;
        panel.style.right = 'auto'; panel.style.bottom = 'auto';
        panel.style.left = initialLeft + 'px'; panel.style.top = initialTop + 'px';
        panel.style.margin = '0';
        document.body.style.userSelect = 'none'; 
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panel.style.left = `${initialLeft + (e.clientX - startX)}px`;
        panel.style.top = `${initialTop + (e.clientY - startY)}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.userSelect = '';
    });

    dragHandle.addEventListener('touchstart', (e) => {
        if (e.target.closest('button, input, label')) return; 
        const touch = e.touches[0];
        isDragging = true;
        const rect = panel.getBoundingClientRect();
        initialLeft = rect.left; initialTop = rect.top;
        startX = touch.clientX; startY = touch.clientY;
        panel.style.right = 'auto'; panel.style.bottom = 'auto';
        panel.style.left = initialLeft + 'px'; panel.style.top = initialTop + 'px';
        panel.style.margin = '0';
        
        if (!e.target.closest('input, label')) e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        panel.style.left = `${initialLeft + (touch.clientX - startX)}px`;
        panel.style.top = `${initialTop + (touch.clientY - startY)}px`;
        e.preventDefault(); 
    }, { passive: false });

    document.addEventListener('touchend', () => {
        isDragging = false;
    });

    panel.querySelectorAll('.text-tool-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            if (typeof window.executeTextTool === 'function') window.executeTextTool(action);
        });
    });
};

// =================================================================
// 視覺化語文工具箱：執行核心邏輯
// =================================================================
window.runTextToolExtras = function(action) {
    
    // ==========================================
    // 工具二：詞詞整併 (compareWords)
    // ==========================================
    if (action === 'compareWords') {
        if (currentMode !== 'table') {
            showToast('⚠️ 詞詞整併僅能在表格模式使用');
            return;
        }

        // 1. 取得選取範圍的邊界
        let minR = Infinity, maxR = -1, minC = Infinity, maxC = -1;
        if (selectedCellBlocks.length > 0) {
            selectedCellBlocks.forEach(b => {
                minR = Math.min(minR, b.startR, b.endR); maxR = Math.max(maxR, b.startR, b.endR);
                minC = Math.min(minC, b.startC, b.endC); maxC = Math.max(maxC, b.startC, b.endC);
            });
        } else if (selectedRows.length > 0) {
            minR = Math.min(...selectedRows); maxR = Math.max(...selectedRows);
            minC = 0; maxC = dataTable.querySelector('thead tr').children.length - 2;
        } else if (selectedCols.length > 0) {
            minR = 0; maxR = dataTable.querySelectorAll('tbody tr').length - 1;
            minC = Math.min(...selectedCols); maxC = Math.max(...selectedCols);
        } else if (lastClickedCell) {
            minR = maxR = lastClickedCell.r;
            minC = maxC = lastClickedCell.c;
        }

        // 確保至少選取了兩欄
        if (minC === Infinity || maxC - minC < 1) {
            showToast('⚠️ 請至少選取包含兩欄的範圍 (如 A 欄與 B 欄)');
            return;
        }

        // 定義相對輸出的欄位索引
        const col1 = minC;           // 左欄 (A)
        const col2 = minC + 1;       // 右欄 (B)
        const outColC = minC + 2;    // 分詞數比較 (如 7\7)
        const outColD = minC + 3;    // O / X / Y
        const outColE = minC + 4;    // 統計次數
        const outColF = minC + 5;    // A欄的詞
        const outColG = minC + 6;    // B欄的詞

        // 2. 檢查欄數是否足夠，不足則動態新增
        const theadTr = dataTable.querySelector('thead tr');
        const currentCols = theadTr.children.length - 1; 
        if (outColG >= currentCols) {
            insertColAt(currentCols, -1, outColG - currentCols + 1);
        }

        const tbodyRows = dataTable.querySelectorAll('tbody tr');
        let mismatchCount = 0;
        const pairStats = new Map();

        // 3. 逐列處理比對與統計
        for (let r = minR; r <= maxR; r++) {
            const inner1 = tbodyRows[r]?.children[col1 + 1]?.querySelector('.td-inner');
            const inner2 = tbodyRows[r]?.children[col2 + 1]?.querySelector('.td-inner');

            const text1 = inner1 ? (inner1.hasAttribute('data-formula') ? inner1.getAttribute('data-formula') : getCellText(inner1)) : '';
            const text2 = inner2 ? (inner2.hasAttribute('data-formula') ? inner2.getAttribute('data-formula') : getCellText(inner2)) : '';

            // 以 '_' 分詞，並過濾掉空字串
            const tokens1 = text1.split('_').filter(t => t.trim() !== '');
            const tokens2 = text2.split('_').filter(t => t.trim() !== '');

            const count1 = tokens1.length;
            const count2 = tokens2.length;

            // 寫入 C 欄 (分詞數比較)
            const innerC = tbodyRows[r]?.children[outColC + 1]?.querySelector('.td-inner');
            if (innerC) {
                innerC.removeAttribute('data-formula');
                innerC.innerText = `${count1}\\${count2}`;
            }

            // 判斷狀態並寫入 D 欄
            let status = 'O';
            if (count1 > count2) status = 'X';
            else if (count2 > count1) status = 'Y';
            
            const innerD = tbodyRows[r]?.children[outColD + 1]?.querySelector('.td-inner');
            if (innerD) {
                innerD.removeAttribute('data-formula');
                innerD.innerText = status;
            }

            // 紀錄不一致的數量
            if (status !== 'O') mismatchCount++;

            // 組合兩欄詞彙進行統計 (使用 ❖ 作為內部安全分隔符)
            const maxLen = Math.max(count1, count2);
            for (let i = 0; i < maxLen; i++) {
                const w1 = tokens1[i] || '';
                const w2 = tokens2[i] || '';
                if (w1 || w2) { // 確保不是兩個都空
                    const key = `${w1}❖${w2}`;
                    pairStats.set(key, (pairStats.get(key) || 0) + 1);
                }
            }
        }

        // 4. 將 Map 轉為陣列並排序 (依出現次數由大到小)
        const statsArray = Array.from(pairStats.entries()).sort((a, b) => b[1] - a[1]);

        // 檢查列數是否足夠容納統計資料，不足則動態新增
        if (statsArray.length > tbodyRows.length) {
            insertRowAt(tbodyRows.length, -1, statsArray.length - tbodyRows.length);
        }

        // 重新抓取一次可能擴充過的 rows
        const updatedRows = dataTable.querySelectorAll('tbody tr');

        // 5. 將統計結果由第 1 列開始寫入 E, F, G 欄
        for (let r = 0; r < updatedRows.length; r++) {
            const innerE = updatedRows[r]?.children[outColE + 1]?.querySelector('.td-inner');
            const innerF = updatedRows[r]?.children[outColF + 1]?.querySelector('.td-inner');
            const innerG = updatedRows[r]?.children[outColG + 1]?.querySelector('.td-inner');

            if (!innerE || !innerF || !innerG) continue;

            innerE.removeAttribute('data-formula');
            innerF.removeAttribute('data-formula');
            innerG.removeAttribute('data-formula');

            if (r < statsArray.length) {
                // 有統計資料的列，寫入次數與詞彙
                const [key, count] = statsArray[r];
                const [w1, w2] = key.split('❖');
                innerE.innerText = count.toString();
                innerF.innerText = w1;
                innerG.innerText = w2;
            } else {
                // 如果該列沒有統計資料，則將儲存格清空
                innerE.innerText = '';
                innerF.innerText = '';
                innerG.innerText = '';
            }
        }

        // 更新畫面狀態並儲存歷史紀錄
        if (typeof recalculateAllFormulas === 'function') recalculateAllFormulas();
        if (typeof debouncedSaveHistory === 'function') debouncedSaveHistory();

        // 6. 執行完畢，通知不一致的數量
        showToast(`✅ 詞詞整併完成！發現 ${mismatchCount} 列數量不一致。`);
        
        // 如果工具面板還開著，自動把它關閉
        const modalId = "text-tools-floating-panel";
        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.classList.add('opacity-0');
            setTimeout(() => existingModal.remove(), 200);
        }

        return; // 執行完畢後結束函數
    }

    // ==========================================
    // 未來如果你有其他新增的工具，都可以依照上面的格式，
    // 寫成 if (action === '工具ID') { ... } 依序往下放！
    // ==========================================
};


