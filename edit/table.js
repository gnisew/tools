// ==========================================
// table.js — 表格編輯：選取/複製貼上/欄列操作/排序、公式引擎、神奇工具、欄位名稱、自動加總
// （由原 script.js 拆分而來；於 index.html 中依序載入）
// ==========================================

// ==========================================
// 編輯器專屬：複製與貼上邏輯 (修復選單開關與單格判定)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const tableContainer = document.getElementById('tableModeContainer');
    const btnPasteValue = document.getElementById('btn-paste-value');
    const pasteGroup = document.getElementById('dd-clipboard-group');

    // 輔助函數：判斷目前是否為表格模式
    function isTableModeActive() {
        return tableContainer && window.getComputedStyle(tableContainer).display !== 'none';
    }

    // 1. 動態控制「貼上為值」的按鈕狀態
    if (pasteGroup) {
        const pasteActionBtn = pasteGroup.querySelector('.action-btn');
        if (pasteActionBtn) {
            pasteActionBtn.addEventListener('click', () => {
                if (isTableModeActive()) {
                    if (btnPasteValue) {
                        btnPasteValue.disabled = false;
                        btnPasteValue.title = "貼上純文字並清除公式";
                    }
                } else {
                    if (btnPasteValue) {
                        btnPasteValue.disabled = true;
                        btnPasteValue.title = "僅在表格模式可用";
                    }
                }
            });
        }
    }

    // 2. 取得表格單格內容的輔助函數 (解決焦點被工具列搶走的問題)
    function getSingleCellContent() {
        const rows = dataTable.querySelectorAll('tbody tr');
        let targetInner = null;
        // 利用系統全域變數 lastClickedCell 來回溯目標
        if (typeof lastClickedCell !== 'undefined' && lastClickedCell && rows[lastClickedCell.r]) {
            targetInner = rows[lastClickedCell.r].children[lastClickedCell.c + 1]?.querySelector('.td-inner');
        }
        if (targetInner) {
            return targetInner.hasAttribute('data-formula') ? targetInner.getAttribute('data-formula') : (targetInner.innerText || targetInner.textContent).trim();
        }
        return '';
    }

    // 3. 綁定「複製」相關動作
    document.querySelectorAll('#dd-clipboard-group button[data-action^="copy"], #dd-clipboard-group button[data-action="select-all"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            // 【修復 1】只移除 class，絕不加上 style="display:none"
            const menu = btn.closest('.action-menu');
            if (menu) menu.classList.remove('show');
            
            const action = btn.dataset.action;
            
            if (action === 'select-all') {
                if (isTableModeActive()) {
                    if (typeof selectAllTable === 'function') selectAllTable();
                } else if (editor) { 
                    editor.focus(); editor.select(); 
                }
                return;
            }
            
            if (action === 'copy-all') {
                if (isTableModeActive()) {
                    if (typeof selectAllTable === 'function') selectAllTable();
                } else if (editor) { 
                    editor.focus(); editor.select(); 
                }
                
                // 稍微延遲讓 DOM 更新選取狀態後再複製
                setTimeout(async () => {
                    if (isTableModeActive() && typeof copySelectedTableData === 'function') {
                        copySelectedTableData();
                    } else {
                        document.execCommand('copy');
                        if (typeof showToast === 'function') showToast('✅ 內容已複製！');
                    }
                }, 50);
                return;
            }
            
            if (action === 'copy-selected') {
                if (isTableModeActive()) {
                    // 【修復 2】判斷是否有多選
                    const isMultiSelect = selectedRows.length > 0 || selectedCols.length > 0 || selectedCellBlocks.length > 0;
                    
                    if (isMultiSelect) {
                        // 呼叫系統原本的強大多選複製引擎
                        if (typeof copySelectedTableData === 'function') copySelectedTableData();
                    } else {
                        // 單格複製
                        const textToCopy = getSingleCellContent();
                        if (textToCopy) {
                            try {
                                await navigator.clipboard.writeText(textToCopy);
                                if (typeof showToast === 'function') showToast('✅ 儲存格內容已複製！');
                            } catch (err) {
                                console.error('複製失敗:', err);
                            }
                        } else {
                            if (typeof showToast === 'function') showToast('沒有可複製的內容。');
                        }
                    }
                } else {
                    document.execCommand('copy');
                    if (typeof showToast === 'function') showToast('✅ 文字已複製！');
                }
            }
        });
    });

    // 4. 綁定「貼上」相關動作
    // 綁定貼上選單動作
	document.querySelectorAll('#dd-clipboard-group button[data-action^="paste"]').forEach(btn => {
		btn.addEventListener('click', async (e) => {
			e.stopPropagation();
			if (btn.disabled) return;
			
			const menu = btn.closest('.action-menu');
			if (menu) menu.classList.remove('show');

			const isPasteValue = btn.dataset.action === 'paste-value';

			try {
				const rawText = await navigator.clipboard.readText();
				if (!rawText) return;

				// 1. 消除 Windows 剪貼簿的 \r\n 造成的雙重換行 bug
				let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                
                // 2. 消除從網頁複製文字時，剪貼簿常在尾端多夾帶一個換行符號的 Bug
                if (text.endsWith('\n')) {
                    text = text.slice(0, -1);
                }

                // 智慧判斷：如果文字中包含 \n\n，且「所有的」換行都是 \n\n（沒有落單的 \n），就將其減半還原
                if (text.includes('\n\n') && text.split('\n\n').join('').indexOf('\n') === -1) {
                    text = text.replace(/\n\n/g, '\n');
                }

				if (currentMode === 'text') {
					editor.focus(); 
					document.execCommand('insertText', false, text);
					showToast('✅ 內容已貼上！');
				} else {
					// 傳遞貼上為值模式給 handleTablePaste
					window.isPasteValueMode = isPasteValue;
					const data = parseTSV(text);
					
					if (data.length > 1 || (data[0] && data[0].length > 1) || selectedRows.length > 0 || selectedCols.length > 0 || selectedCellBlocks.length > 0) {
						handleTablePaste(text);
					} else {
						const activeInner = document.activeElement.closest('.td-inner');
						if (activeInner && dataTable.contains(activeInner)) {
							activeInner.focus(); 
							document.execCommand('insertText', false, text);
							if (isPasteValue) activeInner.removeAttribute('data-formula');
							debouncedSaveHistory();
						} else { 
							handleTablePaste(text); 
						}
					}
					// 用完恢復預設狀態
					window.isPasteValueMode = false;
					showToast(isPasteValue ? '✅ 內容已貼上 (純文字)！' : '✅ 內容已貼上！');
				}
			} catch (err) {
				showToast('❌ 無法讀取剪貼簿，請使用快捷鍵 Ctrl+V');
			}
		});
	});
});


// ==========================================
// ✨ 智慧格式解析引擎 (Auto-Detector)
// 自動判定任何題庫格式的欄位配置
// ==========================================
window.analyzeTableHeaders = function(dataText) {
    if (!dataText) return null;
    const lines = dataText.trim().split('\n');
    if (lines.length === 0) return null;

    // 取得第一行並清除引號
    const headers = lines[0].split('\t').map(s => s.trim().replace(/"/g, ''));
    const maxCols = lines.reduce((max, l) => Math.max(max, l.split('\t').length), headers.length);
    const activeCols = Array.from({length: maxCols}, (_, i) => i);

    let qCol = -1, ansCol = -1, catCol = -1;
    let optCols = [];
    let isFixed = false;
    let matchTermCol = -1, matchDefCol = -1;

    // 1. 關鍵字智慧比對
    headers.forEach((h, i) => {
        const text = h.toLowerCase();
        
        if (text.includes('分類') || text.includes('單元') || text.includes('主題')) {
            catCol = i;
        } 
        else if ((text.includes('題') || text.includes('問')) && !text.includes('題數') && qCol === -1 && !text.includes('答')) {
            qCol = i;
            matchTermCol = i; // 配對遊戲的題目
        } 
        else if (text === '答案' || text === '解答' || text === '答' || text === '正解') {
            ansCol = i;
            if (matchDefCol === -1) matchDefCol = i;
        } 
        else if (text.includes('正確') || text === '正') {
            optCols.push(i);
            // 如果遇到「正確選項」，代表答案是固定的某個選項
            if (!isFixed) {
                ansCol = 'fixed_' + optCols.length; // 例如第一個找到的選項，就是 fixed_1
                isFixed = true;
                if (matchDefCol === -1) matchDefCol = i;
            }
        } 
        else if (text.includes('錯') || text.includes('選項') || /^[a-d1-4]$/i.test(text)) {
            // 包含「錯誤」、「選項」或是單純寫 A, B, C, D 的欄位
            optCols.push(i);
        }
    });

    // 2. 找不到關鍵字時的「盲猜補全邏輯」
    if (qCol === -1) { qCol = 0; matchTermCol = 0; }
    if (matchDefCol === -1) matchDefCol = 1;

    // 若沒有明確寫出「選項」，就把除了題目、答案、分類以外的欄位全當作選項
    if (optCols.length === 0) {
        for (let i = 0; i < maxCols; i++) {
            if (i !== qCol && i !== (typeof ansCol === 'number' ? ansCol : -1) && i !== catCol) {
                optCols.push(i);
            }
        }
    }

    // ✨ 核心修正：將 ansCol 轉為系統認得的字串格式 (col_X 或 fixed_X)
    if (ansCol === -1) {
        ansCol = optCols.length > 0 ? 'fixed_1' : 'col_1'; 
    } else if (typeof ansCol === 'number') {
        ansCol = 'col_' + ansCol;
    }

    // 確保產生 4 個選項對應 (即使資料欄位不足，也不會讓系統當機)
    const o1 = optCols.length > 0 ? optCols[0] : (maxCols > 1 ? 1 : 0);
    const o2 = optCols.length > 1 ? optCols[1] : (maxCols > 2 ? 2 : o1);
    const o3 = optCols.length > 2 ? optCols[2] : (maxCols > 3 ? 3 : o2);
    const o4 = optCols.length > 3 ? optCols[3] : (maxCols > 4 ? 4 : o3);

    // 判斷這行到底是不是標題
    const isLikelyHeader = /題|答|選|正|錯|分|單元|主題/.test(headers.join(''));

    return {
        hasHeader: isLikelyHeader,
        activeCols: activeCols,
        catCol: catCol,
        mcConfig: { qCol, o1Col: o1, o2Col: o2, o3Col: o3, o4Col: o4, ansCol },
        matchConfig: { termCol: matchTermCol, defCol: matchDefCol },
        optCols: optCols.slice() // ✨ 新增：完整選項欄位清單 (不限 4 個，供「選項處理」工具使用)
    };
};








/* ---------------------------------
   選單操作功能 (增、刪、複製、清除、命名)
   --------------------------------- */
function insertColAt(index, copyFromIndex = -1, count = 1) {
    for (let c = 0; c < count; c++) {
        const theadTr = dataTable.querySelector('thead tr');
        const newTh = document.createElement('th');
        newTh.className = 'sticky-top group';
        newTh.innerHTML = createThColHTML(0);
        
        if (copyFromIndex !== -1) {
            const originalTh = theadTr.children[copyFromIndex + 1];
            if (originalTh && originalTh.dataset.colName) newTh.dataset.colName = originalTh.dataset.colName;
            if (originalTh) {
                newTh.style.width = originalTh.style.width;
                newTh.style.minWidth = originalTh.style.minWidth;
                newTh.style.maxWidth = originalTh.style.maxWidth;
            }
        } else {
            newTh.style.width = '150px';
            newTh.style.minWidth = '150px';
            newTh.style.maxWidth = '150px';
        }

        theadTr.insertBefore(newTh, theadTr.children[index + 1] || null);
        
        dataTable.querySelectorAll('tbody tr').forEach(tr => {
            const newTd = document.createElement('td');
            const inner = document.createElement('div');
            inner.className = 'td-inner';
            inner.contentEditable = "true";
			inner.spellcheck = false;
            if (copyFromIndex !== -1 && tr.children[copyFromIndex + 1]) {
                const copyInner = tr.children[copyFromIndex + 1].querySelector('.td-inner');
                if (copyInner) inner.innerHTML = copyInner.innerHTML;
            }
            newTd.appendChild(inner);
            tr.insertBefore(newTd, tr.children[index + 1] || null);
        });
    }
    
    updateTableHeaders(); 
    saveColNames(); 
    saveColWidths(); 
    debouncedSaveHistory(); 
    applyFreeze();
}

function insertRowAt(index, copyFromIndex = -1, count = 1) {
    const tbody = dataTable.querySelector('tbody');
    const colCount = tbody.querySelector('tr')?.querySelectorAll('td').length || 1;
    
    for (let c = 0; c < count; c++) {
        const newRow = document.createElement('tr');
        const newTh = document.createElement('th');
        newTh.className = 'sticky-left group';
        newTh.innerHTML = createThRowHTML(0);
        newRow.appendChild(newTh);
            
        for(let i = 0; i < colCount; i++) {
            const newTd = document.createElement('td');
            const inner = document.createElement('div');
            inner.className = 'td-inner';
            inner.contentEditable = "true";
			inner.spellcheck = false;
            if (copyFromIndex !== -1 && tbody.children[copyFromIndex]) {
                const copyInner = tbody.children[copyFromIndex].querySelectorAll('.td-inner')[i];
                if (copyInner) inner.innerHTML = copyInner.innerHTML;
            }
            newTd.appendChild(inner);
            newRow.appendChild(newTd);
        }
        tbody.insertBefore(newRow, tbody.children[index] || null);
    }
    
    updateTableHeaders(); 
    debouncedSaveHistory(); 
    applyFreeze();
}



/* 智慧清除與刪除 */
function handleClearAction() {
    // �文字模式下的 Delete 功能
    if (currentMode === 'text') {
        const editor = document.getElementById('editor');
        if (editor && editor.selectionStart !== editor.selectionEnd) {
            // 刪除選取文字，並將游標停留在刪除處
            editor.setRangeText('', editor.selectionStart, editor.selectionEnd, 'end');
            editor.focus();
            localStorage.setItem(STORAGE_KEY, editor.value);
            debouncedSaveHistory();
            updateLineNumbers();
            showToast('🗑️ 選取文字已清除');
        } else {
            showToast('⚠️ 請先選取要清除的文字');
        }
        return;
    }

    // 原有的表格模式邏輯
    if (selectedRows.length > 0) clearSelectedRows();
    else if (selectedCols.length > 0) clearSelectedCols();
    else if (selectedCellBlocks.length > 0) clearSelectedCells();
    else showToast('⚠️ 請先選取要清除的範圍');
}

function handleDeleteAction() {
    if (currentMode !== 'table') return; // 防呆：非表格模式直接阻擋

    if (selectedRows.length > 0) deleteSelectedRows();
    else if (selectedCols.length > 0) deleteSelectedCols();
    else if (selectedCellBlocks.length > 0) {
        // ⭐ 修改這裡：改為呼叫刪除並上移的專屬函數
        deleteSelectedCellsAndShiftUp();
    } else {
        showToast('⚠️ 請先選取要刪除的列、欄或儲存格');
    }
}

/* 刪除儲存格並將下方資料上移 */
function deleteSelectedCellsAndShiftUp() {
    if (selectedCellBlocks.length === 0) return;

    const tbody = dataTable.querySelector('tbody');
    const totalRows = tbody.children.length;

    // 1. 記錄每個欄位 (Column) 中，有哪些列 (Row) 被選取要刪除
    const colsToDelete = new Map();

    selectedCellBlocks.forEach(block => {
        const minR = Math.min(block.startR, block.endR);
        const maxR = Math.max(block.startR, block.endR);
        const minC = Math.min(block.startC, block.endC);
        const maxC = Math.max(block.startC, block.endC);

        for (let c = minC; c <= maxC; c++) {
            if (!colsToDelete.has(c)) colsToDelete.set(c, new Set());
            for (let r = minR; r <= maxR; r++) {
                colsToDelete.get(c).add(r);
            }
        }
    });

    // 2. 逐欄進行資料上移處理
    colsToDelete.forEach((rowSet, c) => {
        const keptData = []; // 用來存放該欄「沒有被刪除」的資料

        // 收集需要保留的資料
        for (let r = 0; r < totalRows; r++) {
            if (!rowSet.has(r)) {
                const inner = tbody.children[r]?.children[c + 1]?.querySelector('.td-inner');
                if (inner) {
                    keptData.push({
                        text: inner.innerText,
                        formula: inner.getAttribute('data-formula')
                    });
                } else {
                    keptData.push({ text: '', formula: null });
                }
            }
        }

        // 將保留的資料由上往下重新寫回該欄
        for (let r = 0; r < totalRows; r++) {
            const inner = tbody.children[r]?.children[c + 1]?.querySelector('.td-inner');
            if (!inner) continue;

            if (r < keptData.length) {
                // 填入上移的資料
                const data = keptData[r];
                if (data.formula !== null && data.formula !== undefined) {
                    inner.setAttribute('data-formula', data.formula);
                    inner.innerText = data.formula; // 稍後會被重新計算
                } else {
                    inner.removeAttribute('data-formula');
                    inner.innerText = data.text;
                }
            } else {
                // 底部多出來的格子清空
                inner.removeAttribute('data-formula');
                inner.innerText = '';
            }
        }
    });

    // 3. 更新畫面與歷史紀錄
    recalculateAllFormulas(); // 重新計算公式，讓畫面顯示正確數值
    clearTableSelection();    // 清除選取藍框 (因為格子已經移位了)
    debouncedSaveHistory();   // 存檔，支援 Ctrl+Z 復原
    showToast('🗑️ 儲存格已刪除，下方資料已上移');
}

// ==========================================
// 清除選單狀態控制
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const deleteGroup = document.getElementById('dd-delete-group');
    if (deleteGroup) {
        const deleteActionBtn = deleteGroup.querySelector('.action-btn');
        if (deleteActionBtn) {
            deleteActionBtn.addEventListener('click', () => {
                const btnDeleteStructure = document.getElementById('btn-delete-structure');
                if (!btnDeleteStructure) return;
                
                // 動態判斷：只有表格模式可以點擊「刪除結構」
                if (currentMode === 'table') {
                    btnDeleteStructure.disabled = false;
                    btnDeleteStructure.title = "刪除選取的列或欄結構";
                } else {
                    btnDeleteStructure.disabled = true;
                    btnDeleteStructure.title = "僅在表格模式可用";
                }
            });
        }
    }
});

function clearSelectedCols() {
    if (selectedCols.length === 0) return;
    dataTable.querySelectorAll('tbody tr').forEach(tr => {
        selectedCols.forEach(idx => { 
            const inner = tr.children[idx + 1]?.querySelector('.td-inner');
            if (inner) {
                inner.innerHTML = ''; 
                // 新增這行：確實清除背後的公式標記
                inner.removeAttribute('data-formula'); 
            }
        });
    });
    saveHistoryState(); showToast('🗑️ 選定欄資料清潔溜溜');
}

function deleteSelectedCols() {
    if (selectedCols.length === 0) return;
    const tbody = dataTable.querySelector('tbody');
    const currentCols = tbody.children[0].children.length - 1;
    if (currentCols - selectedCols.length < 1) return showToast('⚠️ 至少需保留一欄！');
    
    const sorted = [...selectedCols].sort((a,b) => b - a);
    sorted.forEach(idx => {
        const th = dataTable.querySelector(`thead th[data-col="${idx}"]`);
        if (th) th.remove();
        dataTable.querySelectorAll('tbody tr').forEach(tr => { if (tr.children[idx + 1]) tr.children[idx + 1].remove(); });
    });
    clearTableSelection(); updateTableHeaders();
    saveColNames(); saveColWidths(); saveHistoryState(); applyFreeze(); showToast('🗑️ 欄已刪除');
}

function clearSelectedRows() {
    if (selectedRows.length === 0) return;
    const tbody = dataTable.querySelector('tbody');
    selectedRows.forEach(idx => { 
        if (tbody.children[idx]) {
            tbody.children[idx].querySelectorAll('.td-inner').forEach(inner => {
                inner.innerHTML = '';
                // 新增這行：確實清除背後的公式標記
                inner.removeAttribute('data-formula');
            });
        }
    });
    saveHistoryState(); showToast('🗑️ 選定列資料已清除');
}

function deleteSelectedRows() {
    if (selectedRows.length === 0) return;
    const tbody = dataTable.querySelector('tbody');
    if (tbody.children.length - selectedRows.length < 1) return showToast('⚠️ 至少需保留一列！');
    
    const sorted = [...selectedRows].sort((a,b) => b - a);
    sorted.forEach(idx => { if (tbody.children[idx]) tbody.children[idx].remove(); });
    
    clearTableSelection(); updateTableHeaders();
	saveHistoryState(); applyFreeze(); showToast('🗑️ 列已刪除');
}

function clearSelectedCells() {
    if (selectedCellBlocks.length === 0) return;
    const rows = dataTable.querySelectorAll('tbody tr');
    
    selectedCellBlocks.forEach(block => {
        const minR = Math.min(block.startR, block.endR);
        const maxR = Math.max(block.startR, block.endR);
        const minC = Math.min(block.startC, block.endC);
        const maxC = Math.max(block.startC, block.endC);

        for (let r = minR; r <= maxR; r++) {
            const row = rows[r]; if (!row) continue;
            for (let c = minC; c <= maxC; c++) {
                const inner = row.children[c + 1]?.querySelector('.td-inner');
                if (inner) {
                    inner.innerHTML = '';
                    // 新增這行：確實清除背後的公式標記
                    inner.removeAttribute('data-formula');
                }
            }
        }
    });
    debouncedSaveHistory(); showToast('🗑️ 儲存格資料已清除');
}

/* 單欄暫時對齊（僅改畫面，不存檔；重新整理或切換模式後恢復靠左） */
function setColumnAlign(colIndex, align) {
    const value = align === 'left' ? '' : align; // 靠左 = 還原預設
    dataTable.querySelectorAll('tbody tr').forEach(tr => {
        const inner = tr.children[colIndex + 1]?.querySelector('.td-inner');
        if (inner) inner.style.textAlign = value;
    });
    if (typeof showToast === 'function') {
        showToast(align === 'center' ? '↔️ 此欄已置中' : align === 'right' ? '➡️ 此欄已靠右' : '⬅️ 此欄已靠左');
    }
}

colMenu.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const action = btn.dataset.action;
    
    if (action === 'rename') {
        const th = dataTable.querySelector(`thead th[data-col="${activeMenuColIndex}"]`);
        const currentName = th.dataset.colName || '';
        showPrompt('命名此欄 (留空則清除名稱)', currentName, (val) => {
            th.dataset.colName = val.trim();
            updateTableHeaders();
            saveColNames();
        });
    }
    if (action === 'add-left') insertColAt(activeMenuColIndex);
    if (action === 'add-right') insertColAt(activeMenuColIndex + 1);
    if (action === 'add-n') {
        const idx = activeMenuColIndex; // 輸入視窗是非同步的，先記住位置
        showPrompt('新增幾欄？（加在此欄左側）', '5', (val) => {
            const n = Math.min(parseInt(val, 10), 200);
            if (n > 0) { insertColAt(idx, -1, n); showToast(`✅ 已在此欄左側新增 ${n} 欄`); }
        });
    }
    if (action === 'duplicate') insertColAt(activeMenuColIndex + 1, activeMenuColIndex);
    if (action && action.startsWith('align-')) setColumnAlign(activeMenuColIndex, action.slice(6));
    if (action === 'clear') {
        if (!selectedCols.includes(activeMenuColIndex)) selectTableColumn(activeMenuColIndex, false, false);
        handleClearAction();
    }
    if (action === 'delete') {
        if (!selectedCols.includes(activeMenuColIndex)) selectTableColumn(activeMenuColIndex, false, false);
        handleDeleteAction();
    }
    colMenu.classList.remove('show');
});

rowMenu.addEventListener('click', (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'add-above') insertRowAt(activeMenuRowIndex);
    if (action === 'add-below') insertRowAt(activeMenuRowIndex + 1);
    if (action === 'add-n') {
        const idx = activeMenuRowIndex;
        showPrompt('新增幾列？（加在此列下方）', '5', (val) => {
            const n = Math.min(parseInt(val, 10), 1000);
            if (n > 0) { insertRowAt(idx + 1, -1, n); showToast(`✅ 已在此列下方新增 ${n} 列`); }
        });
    }
    if (action === 'duplicate') insertRowAt(activeMenuRowIndex + 1, activeMenuRowIndex);
    if (action === 'clear') {
        if (!selectedRows.includes(activeMenuRowIndex)) selectTableRow(activeMenuRowIndex, false, false);
        handleClearAction();
    }
    if (action === 'delete') {
        if (!selectedRows.includes(activeMenuRowIndex)) selectTableRow(activeMenuRowIndex, false, false);
        handleDeleteAction();
    }
    rowMenu.classList.remove('show');
});

function insertRowsFromTop(count) {
    const tbody = dataTable.querySelector('tbody');
    insertRowAt(tbody ? tbody.children.length : 0, -1, count);
    tableModeContainer.scrollTop = tableModeContainer.scrollHeight; 
}
function promptInsertRows() { showPrompt('輸入新增列數', '5', (val) => { const count = parseInt(val); if (count > 0) insertRowsFromTop(count); }); }

function insertColsFromTop(count) {
    const thead = dataTable.querySelector('thead tr');
    insertColAt(thead ? thead.children.length - 1 : 0, -1, count);
    tableModeContainer.scrollLeft = tableModeContainer.scrollWidth; 
}
function promptInsertCols() { showPrompt('輸入新增欄數', '5', (val) => { const count = parseInt(val); if (count > 0) insertColsFromTop(count); }); }

/* 刪除右側/下方的「空」欄列（只含空白、&nbsp;、換行、零寬字元也視為空） */
function isCellBlank(td) {
    const inner = td && td.querySelector('.td-inner');
    if (!inner) return true;
    if (inner.hasAttribute('data-formula')) return false;
    if (inner.querySelector('img, video, audio, canvas')) return false;
    return inner.textContent.replace(/[\s\u00A0\u200B-\u200D\u2060\uFEFF\u3000]/g, '') === '';
}

function deleteTrailingEmptyCols() {
    const theadTr = dataTable.querySelector('thead tr');
    const rows = [...dataTable.querySelectorAll('tbody tr')];
    if (!theadTr || rows.length === 0) return;
    const total = theadTr.children.length - 1;
    let keep = total;
    while (keep > 1) {
        const idx = keep; // children 索引 = 欄索引 + 1，最後一欄 = keep
        if (!rows.every(tr => isCellBlank(tr.children[idx]))) break;
        keep--;
    }
    const removeCount = total - keep;
    if (removeCount <= 0) return showToast('ℹ️ 右側沒有空欄可刪除');
    for (let i = 0; i < removeCount; i++) {
        theadTr.lastElementChild.remove();
        rows.forEach(tr => tr.lastElementChild && tr.lastElementChild.remove());
    }
    clearTableSelection(); updateTableHeaders();
    saveColNames(); saveColWidths(); saveHistoryState(); applyFreeze();
    showToast(`🗑️ 已刪除右側 ${removeCount} 個空欄`);
}

function deleteTrailingEmptyRows() {
    const tbody = dataTable.querySelector('tbody');
    if (!tbody) return;
    const total = tbody.children.length;
    let keep = total;
    while (keep > 1) {
        const tr = tbody.children[keep - 1];
        if (![...tr.children].slice(1).every(isCellBlank)) break;
        keep--;
    }
    const removeCount = total - keep;
    if (removeCount <= 0) return showToast('ℹ️ 下方沒有空列可刪除');
    for (let i = 0; i < removeCount; i++) tbody.lastElementChild.remove();
    clearTableSelection(); updateTableHeaders();
    saveHistoryState(); applyFreeze();
    showToast(`🗑️ 已刪除下方 ${removeCount} 個空列`);
}

/* ---------------------------------
   多選與剪貼簿核心功能
   --------------------------------- */
function applySelectionVisuals() {
    // 不要掃描全表，直接找出有標記的節點清除
    document.querySelectorAll('.selected-header').forEach(el => el.classList.remove('selected-header'));
    document.querySelectorAll('.sel-bg').forEach(el => {
        el.classList.remove('sel-bg');
        el.style.boxShadow = '';
    });

    const tbody = dataTable.querySelector('tbody');
    const theadTr = dataTable.querySelector('thead tr');
    if (!tbody || !theadTr) return;

    const R = tbody.children.length;
    const C = theadTr.children.length - 1;
    
    if (selectedRows.length === 0 && selectedCols.length === 0 && selectedCellBlocks.length === 0) {
        if (typeof updateAutoSum === 'function') updateAutoSum(new Set());
        return;
    }

    // 標記表頭 (Th)
    selectedCols.forEach(colIndex => { 
        if(theadTr.children[colIndex + 1]) theadTr.children[colIndex + 1].classList.add('selected-header'); 
    });
    selectedRows.forEach(rIdx => { 
        const row = tbody.children[rIdx];
        if (row && row.children[0]) row.children[0].classList.add('selected-header'); 
    });

    // 【優化 2：稀疏矩陣邏輯】
    // 只記錄被選取格子的座標，不再產生巨大二維陣列
    // selMap 用法: "r,c" -> true
    const selMap = new Set();
    
    // 收集所有選取的座標
    selectedRows.forEach(r => {
        if(r >= 0 && r < R) {
            for(let c = 0; c < C; c++) selMap.add(`${r},${c}`);
        }
    });
    
    selectedCols.forEach(c => {
        if(c >= 0 && c < C) {
            for(let r = 0; r < R; r++) selMap.add(`${r},${c}`);
        }
    });
    
    selectedCellBlocks.forEach(block => {
        const minR = Math.max(0, Math.min(block.startR, block.endR));
        const maxR = Math.min(R - 1, Math.max(block.startR, block.endR));
        const minC = Math.max(0, Math.min(block.startC, block.endC));
        const maxC = Math.min(C - 1, Math.max(block.startC, block.endC));

        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
                selMap.add(`${r},${c}`);
            }
        }
    });

    // 依據收集到的座標，精準繪製邊框與底色
    selMap.forEach(coord => {
        const [rStr, cStr] = coord.split(',');
        const r = parseInt(rStr, 10);
        const c = parseInt(cStr, 10);
        
        const tr = tbody.children[r];
        if (!tr) return;
        const td = tr.children[c + 1];
        if (!td) return;

        // 判斷上下左右相鄰的格子是否也被選取，決定是否要畫藍框
        const hasTop = r > 0 && selMap.has(`${r - 1},${c}`);
        const hasBottom = r < R - 1 && selMap.has(`${r + 1},${c}`);
        const hasLeft = c > 0 && selMap.has(`${r},${c - 1}`);
        const hasRight = c < C - 1 && selMap.has(`${r},${c + 1}`);

        let top = !hasTop ? '2px' : '0';
        let bottom = !hasBottom ? '-2px' : '0';
        let left = !hasLeft ? '2px' : '0';
        let right = !hasRight ? '-2px' : '0';
        
        let shadows = [];
        if (top !== '0') shadows.push(`inset 0 ${top} 0 0 #93c5fd`);
        if (bottom !== '0') shadows.push(`inset 0 ${bottom} 0 0 #93c5fd`);
        if (left !== '0') shadows.push(`inset ${left} 0 0 0 #93c5fd`);
        if (right !== '0') shadows.push(`inset ${right} 0 0 0 #93c5fd`);
        
        if (shadows.length > 0) {
            td.style.boxShadow = shadows.join(', ');
        }
        
        td.classList.add('sel-bg');
    });

    if (typeof updateAutoSum === 'function') {
        updateAutoSum(selMap);
    }
}

// 欄/列 Shift 範圍選取的起點記錄（原本未宣告，Shift 點標題可能直接報錯）
let lastSelectedRowIndex = -1;
let lastSelectedColIndex = -1;

function clearTableSelection(resetArrays = true) {
    if (resetArrays) {
        selectedRows = []; selectedCols = [];
        lastSelectedRowIndex = -1; lastSelectedColIndex = -1;
        selectedCellBlocks = []; lastClickedCell = null;
    }
    applySelectionVisuals();
}

// 全選表格功能 ======
function selectAllTable() {
    // 1. 先清除目前的選取狀態
    clearTableSelection(true); 

    const tbody = dataTable.querySelector('tbody');
    const theadTr = dataTable.querySelector('thead tr');

    if (!tbody || !theadTr) return;

    // 2. 取得表格目前的總列數與總欄數
    const rowCount = tbody.children.length;
    // 扣除最左側用來顯示數字的標題欄
    const colCount = theadTr.children.length - 1; 

    // 3. 將所有的列加入選取陣列
    for (let i = 0; i < rowCount; i++) {
        selectedRows.push(i);
    }

    // 4. 將所有的欄加入選取陣列
    for (let i = 0; i < colCount; i++) {
        selectedCols.push(i);
    }

    // 5. 更新畫面，畫上選取框與底色
    applySelectionVisuals();
}

function selectTableColumn(colIndex, isShift = false, isCtrl = false) {
    if (isShift && lastSelectedColIndex !== -1) {
        const start = Math.min(lastSelectedColIndex, colIndex);
        const end = Math.max(lastSelectedColIndex, colIndex);
        if (!isCtrl) clearTableSelection(true); 
        for (let i = start; i <= end; i++) { if (!selectedCols.includes(i)) selectedCols.push(i); }
    } else if (isCtrl) {
        if (selectedCols.includes(colIndex)) selectedCols = selectedCols.filter(i => i !== colIndex);
        else selectedCols.push(colIndex);
        lastSelectedColIndex = colIndex;
    } else {
        clearTableSelection(true);
        selectedCols.push(colIndex);
        lastSelectedColIndex = colIndex;
    }
    applySelectionVisuals();
}

function selectTableRow(rowIndex, isShift = false, isCtrl = false) {
    if (isShift && lastSelectedRowIndex !== -1) {
        const start = Math.min(lastSelectedRowIndex, rowIndex);
        const end = Math.max(lastSelectedRowIndex, rowIndex);
        if (!isCtrl) clearTableSelection(true);
        for (let i = start; i <= end; i++) { if (!selectedRows.includes(i)) selectedRows.push(i); }
    } else if (isCtrl) {
        if (selectedRows.includes(rowIndex)) selectedRows = selectedRows.filter(i => i !== rowIndex);
        else selectedRows.push(rowIndex);
        lastSelectedRowIndex = rowIndex;
    } else {
        clearTableSelection(true);
        selectedRows.push(rowIndex);
        lastSelectedRowIndex = rowIndex;
    }
    applySelectionVisuals();
}

function isCellInAnyBlock(r, c) {
    return selectedCellBlocks.some(b => {
        const minR = Math.min(b.startR, b.endR); const maxR = Math.max(b.startR, b.endR);
        const minC = Math.min(b.startC, b.endC); const maxC = Math.max(b.startC, b.endC);
        return r >= minR && r <= maxR && c >= minC && c <= maxC;
    });
}

function copySelectedTableData() {
    let copyText = "";
    // 新增：記錄複製起點，方便貼上時計算偏移量
    window.clipboardOrigin = null; 

    if (selectedRows.length > 0) {
        const sortedRows = [...selectedRows].sort((a,b) => a - b);
        window.clipboardOrigin = { r: sortedRows[0], c: 0 };
        const rows = dataTable.querySelectorAll('tbody tr');
        copyText = sortedRows.map(idx => {
            if (!rows[idx]) return '';
            return Array.from(rows[idx].querySelectorAll('.td-inner')).map(c => {
                // 優先抓公式，沒有才抓文字
                return c.hasAttribute('data-formula') ? c.getAttribute('data-formula') : c.innerText.replace(/\n$/, '');
            }).join('\t');
        }).join('\n');
    } else if (selectedCols.length > 0) {
        const sortedCols = [...selectedCols].sort((a,b) => a - b);
        window.clipboardOrigin = { r: 0, c: sortedCols[0] };
        const rows = Array.from(dataTable.querySelectorAll('tbody tr'));
        copyText = rows.map(row => {
            return sortedCols.map(colIdx => {
                const inner = row.children[colIdx + 1]?.querySelector('.td-inner');
                let t = inner ? (inner.hasAttribute('data-formula') ? inner.getAttribute('data-formula') : inner.innerText.replace(/\n$/, '')) : '';
                if (t.includes('"') || t.includes('\n') || t.includes('\t')) t = '"' + t.replace(/"/g, '""') + '"';
                return t;
            }).join('\t');
        }).join('\n');
    } else if (selectedCellBlocks.length > 0) {
        let gMinR = Infinity, gMaxR = -1, gMinC = Infinity, gMaxC = -1;
        selectedCellBlocks.forEach(b => {
            gMinR = Math.min(gMinR, b.startR, b.endR); gMaxR = Math.max(gMaxR, b.startR, b.endR);
            gMinC = Math.min(gMinC, b.startC, b.endC); gMaxC = Math.max(gMaxC, b.startC, b.endC);
        });
        
        window.clipboardOrigin = { r: gMinR, c: gMinC };

        const rows = dataTable.querySelectorAll('tbody tr');
        const lines = [];
        for (let r = gMinR; r <= gMaxR; r++) {
            const row = rows[r]; if (!row) continue;
            const rowData = [];
            for (let c = gMinC; c <= gMaxC; c++) {
                if (isCellInAnyBlock(r, c)) {
                    const inner = row.children[c + 1]?.querySelector('.td-inner');
                    let t = inner ? (inner.hasAttribute('data-formula') ? inner.getAttribute('data-formula') : inner.innerText.replace(/\n$/, '')) : '';
                    if (t.includes('"') || t.includes('\n') || t.includes('\t')) t = '"' + t.replace(/"/g, '""') + '"';
                    rowData.push(t);
                } else {
                    rowData.push(''); 
                }
            }
            lines.push(rowData.join('\t'));
        }
        copyText = lines.join('\n');
    }
    
    try {
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(copyText).then(() => showToast('✅ 選定內容已複製！'));
        else {
            const ta = document.createElement('textarea'); ta.value = copyText; document.body.appendChild(ta);
            ta.select(); document.execCommand('copy'); document.body.removeChild(ta); showToast('✅ 選定內容已複製！');
        }
    } catch (err) { showToast('❌ 複製失敗'); }
}

/* 智慧貼上分配引擎 */
function handleTablePaste(text) {
    const data = parseTSV(text);
    if (data.length === 0 || (data.length === 1 && data[0].length === 0)) return;

    if (data.length > 1 && data[data.length - 1].length === 1 && data[data.length - 1][0] === '') {
        data.pop();
    }
    // 1. 從底部往上檢查，移除完全空白的列
    while (data.length > 0) {
        const lastRow = data[data.length - 1];
        // 檢查該列的所有儲存格是否都是空白
        const isEmptyRow = lastRow.every(cell => !cell || String(cell).trim() === '');
        if (isEmptyRow) {
            data.pop();
        } else {
            break; // 遇到有資料的列就停止往上刪除
        }
    }

    if (data.length === 0) return; // 如果全部都是空的就提早結束

    // 2. 檢查每一列，找出最右邊有資料的欄位索引
    let maxColWithData = -1;
    for (let r = 0; r < data.length; r++) {
        const row = data[r];
        for (let c = row.length - 1; c >= 0; c--) {
            if (row[c] && String(row[c]).trim() !== '') {
                if (c > maxColWithData) maxColWithData = c;
                break; // 這列找到最右邊的有資料欄位後，換下一列檢查
            }
        }
    }

    // 3. 把所有列的長度都裁減到 maxColWithData + 1
    const validColCount = maxColWithData + 1;
    for (let r = 0; r < data.length; r++) {
        if (data[r].length > validColCount) {
            data[r] = data[r].slice(0, validColCount);
        }
    }
    // ==========================================

    let startRow = 0; let startCol = 0;
    const activeInner = document.activeElement.closest('.td-inner');
    if (activeInner) activeInner.blur();

    let isMultiTarget = false;
    let targetBlocks = selectedCellBlocks;

    if (selectedRows.length > 0) { startRow = Math.min(...selectedRows); startCol = 0; } 
    else if (selectedCols.length > 0) { startRow = 0; startCol = Math.min(...selectedCols); } 
    else if (selectedCellBlocks.length > 0) {
        startRow = Math.min(selectedCellBlocks[0].startR, selectedCellBlocks[0].endR); 
        startCol = Math.min(selectedCellBlocks[0].startC, selectedCellBlocks[0].endC);
        if (selectedCellBlocks.length > 1 || selectedCellBlocks[0].startR !== selectedCellBlocks[0].endR || selectedCellBlocks[0].startC !== selectedCellBlocks[0].endC) {
            isMultiTarget = true;
        }
    } else if (activeInner && dataTable.contains(activeInner)) {
        const tr = activeInner.closest('tr');
        startRow = Array.from(tr.parentNode.children).indexOf(tr);
        startCol = Array.from(tr.children).indexOf(activeInner.closest('td')) - 1; 
    }

    const tbody = dataTable.querySelector('tbody');
    const theadTr = dataTable.querySelector('thead tr');
    
    // 獨立處理器：負責填入資料並計算平移偏移量
    const applyPastedCell = (inner, cellData, targetR, targetC) => {
        // 【修復 2：貼上為值模式，絕對不平移，直接取得原值】
        if (window.isPasteValueMode) {
            inner.removeAttribute('data-formula');
            if (cellData.startsWith('=')) {
                inner.innerText = typeof evaluateFormula === 'function' ? evaluateFormula(cellData) : cellData;
            } else {
                inner.innerText = cellData;
            }
            return;
        }

        // 一般貼上模式
        if (cellData.startsWith('=') && window.clipboardOrigin) {
            let rowOffset = targetR - window.clipboardOrigin.r;
            let colOffset = targetC - window.clipboardOrigin.c;
            let shiftedFormula = shiftFormula(cellData, rowOffset, colOffset);
            inner.setAttribute('data-formula', shiftedFormula);
            inner.innerText = shiftedFormula; // 等等會被全域重算更新
        } else {
            if (cellData.startsWith('=')) inner.setAttribute('data-formula', cellData);
            else inner.removeAttribute('data-formula');
            inner.innerText = cellData;
        }
    };

    let pastedRange = null; // 一般貼上完成後，用來選取剛貼上的範圍
    // 填滿模式
    if (data.length === 1 && data[0].length === 1 && isMultiTarget) {
        const sourceText = data[0][0];
        targetBlocks.forEach(block => {
            const minR = Math.min(block.startR, block.endR); const maxR = Math.max(block.startR, block.endR);
            const minC = Math.min(block.startC, block.endC); const maxC = Math.max(block.startC, block.endC);

            for (let r = minR; r <= maxR; r++) {
                const rowElem = tbody.children[r]; if (!rowElem) continue;
                for (let c = minC; c <= maxC; c++) {
                    const inner = rowElem.children[c + 1]?.querySelector('.td-inner');
                    if (inner) applyPastedCell(inner, sourceText, r, c);
                }
            }
        });
    } else {
        // 一般貼上 (自動擴充表格並對應貼上)
        const rowsNeeded = startRow + data.length;
        const currentRows = tbody.children.length;
        
        if (rowsNeeded > currentRows) {
            insertRowAt(currentRows, -1, rowsNeeded - currentRows);
        }

        let maxColsNeeded = startCol;
        data.forEach(r => { if (startCol + r.length > maxColsNeeded) maxColsNeeded = startCol + r.length; });
        const currentCols = theadTr.children.length - 1;
        
        // 欄位原本就是批次新增的，維持不變
        if (maxColsNeeded > currentCols) { 
            insertColAt(currentCols, -1, maxColsNeeded - currentCols); 
        }

        pastedRange = {
            startR: startRow, startC: startCol,
            endR: startRow + data.length - 1,
            endC: startCol + Math.max(...data.map(r => r.length)) - 1
        };
        for (let r = 0; r < data.length; r++) {
            const rowElem = tbody.children[startRow + r];
            for (let c = 0; c < data[r].length; c++) {
                const inner = rowElem.children[startCol + c + 1]?.querySelector('.td-inner');
                if (inner) applyPastedCell(inner, data[r][c], startRow + r, startCol + c);
            }
        }
    }

    updateTableHeaders();
    recalculateAllFormulas();     
    debouncedSaveHistory(); applyFreeze();

    // 貼上後預設選取「所貼上的整個範圍」(填滿模式則維持原本選取)
    if (pastedRange && pastedRange.endC >= pastedRange.startC) {
        selectedRows = []; selectedCols = [];
        selectedCellBlocks = [pastedRange];
        lastClickedCell = { r: pastedRange.startR, c: pastedRange.startC };
        applySelectionVisuals();
    }
}

/* ---------------------------------
   獨立儲存格編輯器 (不換行模式專用)
   --------------------------------- */
let activeEditorTd = null;
function openCellEditor(td) {
    activeEditorTd = td;
    const inner = td.querySelector('.td-inner');
    const rect = td.getBoundingClientRect();
    const editor = document.getElementById('cellEditor');
    const overlay = document.getElementById('cellEditorOverlay');
    
    editor.value = inner ? inner.innerText : '';
    
    // 同步基礎字體與行高樣式
    editor.style.fontFamily = window.getComputedStyle(dataTable).fontFamily;
    editor.style.fontSize = window.getComputedStyle(dataTable).fontSize;
    editor.style.lineHeight = window.getComputedStyle(dataTable).lineHeight;
    editor.style.padding = '0.5rem 0.75rem';

    overlay.classList.remove('hidden');
    editor.classList.remove('hidden');

    // 給予編輯器合理舒適的預設大小
    let idealWidth = Math.max(rect.width, 350);
    editor.style.width = `${idealWidth}px`;
    editor.style.height = '1px'; // to measure properly
    
    // 稍等一幀確保 computed style 完成
    setTimeout(() => {
        let contentHeight = editor.scrollHeight;
        let idealHeight = Math.max(120, Math.min(contentHeight + 20, window.innerHeight * 0.6));

        let left = rect.left;
        let top = rect.top;

        if (left + idealWidth > window.innerWidth) left = Math.max(10, window.innerWidth - idealWidth - 20);
        
        if (top + idealHeight > window.innerHeight) {
            top = rect.bottom - idealHeight;
            if (top < 10) top = 10;
        }

        editor.style.left = `${left}px`;
        editor.style.top = `${top}px`;
        editor.style.height = `${idealHeight}px`;

        editor.focus();
        editor.setSelectionRange(0, 0); // 游標強制回到最前方
        editor.scrollTop = 0;
    }, 0);
}

function closeCellEditor(save = true) {
    const editor = document.getElementById('cellEditor');
    const overlay = document.getElementById('cellEditorOverlay');
    if (activeEditorTd && save && !editor.classList.contains('hidden')) {
        const inner = activeEditorTd.querySelector('.td-inner');
        if (inner) inner.innerText = editor.value;
        debouncedSaveHistory();
    }
    editor.classList.add('hidden');
    overlay.classList.add('hidden');
    activeEditorTd = null;
}

document.getElementById('cellEditorOverlay').addEventListener('click', () => closeCellEditor(true));

/* ==========================================
   原生剪下事件 (Ctrl+X / Cmd+X) 攔截
   ========================================== */
document.addEventListener('cut', (e) => {
    // 1. 檢查使用者是否有「反白」選取文字 (例如正在儲存格內打字時反白)
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
        // 2. 如果焦點正在儲存格內 (.td-inner) 或獨立編輯器內，直接 return，讓瀏覽器執行原生的文字剪下
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.classList.contains('td-inner') || activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
            return; 
        }
    }

    // 3. 當沒有反白文字時，攔截預設行為並執行「表格儲存格」的剪下邏輯
    if (currentMode === 'table' && (selectedRows.length > 0 || selectedCols.length > 0 || selectedCellBlocks.length > 0)) { 
        // 阻止瀏覽器預設的剪下行為
        e.preventDefault(); 
        
        // 步驟 A：先執行複製，將選取的資料寫入剪貼簿
        copySelectedTableData(); 
        
        // 步驟 B：執行清除，將選取範圍的資料清空
        // (handleClearAction 內部已經包含儲存歷史紀錄與畫面更新的邏輯)
        handleClearAction();
        
        // 覆寫提示訊息為「剪下」
        setTimeout(() => {
            showToast('✂️ 內容已剪下！');
        }, 100); // 稍微延遲以覆蓋 copy 和 clear 原本的提示
    }
});



document.addEventListener('paste', (e) => {
    const activeEl = document.activeElement;
    const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    const isCellEditor = activeEl && activeEl.id === 'cellEditor';
    const isInsideTdInner = activeEl && activeEl.classList.contains('td-inner');
    const isMainEditor = activeEl && activeEl.id === 'editor';
    
    const isFindReplaceModal = activeEl && activeEl.closest('#findReplaceModal') !== null;

    if ((isInput && !isCellEditor && !isMainEditor) || isFindReplaceModal) return;

    const rawText = (e.originalEvent || e).clipboardData.getData('text/plain');
    if (!rawText) return;

    // 1. 消除 Windows 剪貼簿的 \r\n 造成的雙重換行 bug
    let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 2. 消除尾端多夾帶的換行符號
    if (text.endsWith('\n')) {
        text = text.slice(0, -1);
    }

    // 3. 關鍵修復：解決從網頁複製段落 (<p>) 造成的「全面雙重換行」
    if (text.includes('\n\n') && text.split('\n\n').join('').indexOf('\n') === -1) {
        text = text.replace(/\n\n/g, '\n');
    }

    if (currentMode === 'text') {
        e.preventDefault(); // 攔截原生貼上，改由我們寫入以確保換行符號乾淨
        editor.focus();

        // 【效能優化】判斷文字量：超過 1 萬字元時，改用直接賦值以防瀏覽器卡死
        if (text.length > 10000) {
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            // 替換選取區或在游標處插入文字
            editor.value = editor.value.substring(0, start) + text + editor.value.substring(end);
            // 將游標移動到貼上文字的末端
            editor.selectionStart = editor.selectionEnd = start + text.length;
            
            // 手動觸發更新
            debouncedUpdateLineNumbers();
            debouncedSaveHistory();
            if (typeof updateWordCountWidget === 'function') updateWordCountWidget();
        } else {
            // 少量文字維持原生 execCommand，保留系統預設的 undo 順暢度
            document.execCommand('insertText', false, text);
        }
        return;
    }

    // --- 表格模式貼上處理 ---
        if (currentMode === 'table') {
            const data = parseTSV(text);

            const isMultiSelect = selectedRows.length > 0 || selectedCols.length > 0 || 
                                  selectedCellBlocks.length > 1 || 
                                  (selectedCellBlocks.length === 1 && (selectedCellBlocks[0].startR !== selectedCellBlocks[0].endR || selectedCellBlocks[0].startC !== selectedCellBlocks[0].endC));

            // 🌟 修正：只要游標在儲存格內閃爍（編輯狀態）且無多選，不論貼上幾行，一律全塞進同一格
            if ((isInsideTdInner || isCellEditor) && !isMultiSelect) {
                e.preventDefault();
                document.execCommand('insertText', false, text);
                return;
            }

            // 🌟 否則（單擊藍框選取，或框選多格時），交給智慧貼上分配引擎
            if (isMultiSelect || data.length > 1 || (data[0] && data[0].length > 1) || selectedCellBlocks.length > 0) {
                e.preventDefault();
                handleTablePaste(text); 
                
                if (isCellEditor) {
                    closeCellEditor(false);
                }
            }
        }
});



dataTable.addEventListener('input', () => { 
    hideFloatingTool(); debouncedSaveHistory(); applyFreeze();
});

/* 滑鼠點擊選取與選單邏輯 */
dataTable.addEventListener('click', (e) => {
    // 【新增】剛完成「拖曳多選欄」時，略過隨後觸發的 click，避免選取被覆蓋
    if (window.isColDragSelecting) return;

    const btnColMenu = e.target.closest('.btn-col-menu');
    if (btnColMenu) {
        const th = btnColMenu.closest('th'); 
        activeMenuColIndex = parseInt(th.dataset.col);
        const rect = th.getBoundingClientRect();
        
        // 先顯示選單以取得真實尺寸
        colMenu.classList.add('show'); 
        rowMenu.classList.remove('show'); 
        
        const menuRect = colMenu.getBoundingClientRect();
        let leftPos = rect.right - menuRect.width;
        let topPos = rect.bottom + 5;
        
        // 邊界防護：如果超出下邊界，改為向上展開
        if (topPos + menuRect.height > window.innerHeight) {
            topPos = rect.top - menuRect.height - 5;
            if (topPos < 5) topPos = 5; // 防呆保底
        }
        if (leftPos < 5) leftPos = 5; // 防呆保底
        
        colMenu.style.left = `${leftPos}px`; 
        colMenu.style.top = `${topPos}px`;
        return;
    }

    const btnRowMenu = e.target.closest('.btn-row-menu');
    if (btnRowMenu) {
        const th = btnRowMenu.closest('th'); 
        const tr = th.closest('tr'); 
        activeMenuRowIndex = Array.from(tr.parentNode.children).indexOf(tr);
        const rect = th.getBoundingClientRect(); 
        
        // 先顯示選單以取得真實尺寸
        rowMenu.classList.add('show'); 
        colMenu.classList.remove('show'); 
        
        const menuRect = rowMenu.getBoundingClientRect();
        let leftPos = rect.right + 5;
        let topPos = rect.top;
        
        // 邊界防護：如果超出視窗底部，將選單向上推 (確保完整顯示)
        if (topPos + menuRect.height > window.innerHeight) {
            topPos = window.innerHeight - menuRect.height - 10; 
            // 確保不會被推到視窗最上方外面
            if (topPos < 10) topPos = 10;
        }
        
        rowMenu.style.left = `${leftPos}px`; 
        rowMenu.style.top = `${topPos}px`;
        return;
    }

    // 調整過濾邏輯：保留對拖曳控制把手的阻擋
    if (e.target.closest('.resize-handle')) return;

    // 偵測是否點擊左上角全選區塊
    if (e.target.closest('th.sticky-corner')) {
        if (isSelectionLocked) return; 
        selectAllTable();
        return; 
    }

    const thTop = e.target.closest('th.sticky-top');
    if (thTop && !e.target.closest('.btn-col-menu')) {
        if (isSelectionLocked) return; 
        const isCtrl = e.ctrlKey || e.metaKey || isMobileMultiSelect;
        return selectTableColumn(parseInt(thTop.dataset.col), e.shiftKey, isCtrl);
    }

    const thLeft = e.target.closest('th.sticky-left');
    if (thLeft && !e.target.closest('.btn-row-menu')) {
        if (isSelectionLocked) return; 
        const isCtrl = e.ctrlKey || e.metaKey || isMobileMultiSelect;
        const tr = thLeft.closest('tr');
        return selectTableRow(Array.from(tr.parentNode.children).indexOf(tr), e.shiftKey, isCtrl);
    }

    // 如果使用者正在「反白文字」，絕對不要觸發任何失去焦點或儲存格點擊的邏輯
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
        return;
    }

    const td = e.target.closest('td');
    if (td) {
        lastMatchedCell = null;
        
        const isClickOnInner = e.target.closest('.td-inner') !== null;

        if (!isClickOnInner && document.activeElement && document.activeElement.classList.contains('td-inner')) {
            document.activeElement.blur();
        }

        const tr = td.closest('tr');
        const rIdx = Array.from(tr.parentNode.children).indexOf(tr);
        const cIdx = Array.from(tr.children).indexOf(td) - 1;

        if (isSelectionLocked) {
            
            // 1. 先清除前一次點擊的白底標記 (與尋找取代共用同一個清除邏輯)
            if (window.lastFoundTd) {
                window.lastFoundTd.style.removeProperty('background-color');
                window.lastFoundTd.style.removeProperty('outline');
                window.lastFoundTd.style.removeProperty('outline-offset');
                window.lastFoundTd = null;
            }

            // 2. 判斷點擊的儲存格是否在「目前的選取範圍」內
            const isInsideSelection = selectedRows.includes(rIdx) || 
                                      selectedCols.includes(cIdx) || 
                                      isCellInAnyBlock(rIdx, cIdx);
            
            // 3. 如果在選取範圍內，為該格加上白底藍框
            if (isInsideSelection) {
                td.style.setProperty('background-color', '#ffffff', 'important');
                td.style.setProperty('outline', '2px solid #93c5fd', 'important');
                td.style.setProperty('outline-offset', '-2px', 'important');
                window.lastFoundTd = td; // 記錄下來，下次點擊時才能自動清除
            }

            // 4. 處理獨立編輯器的開啟
            if (dataTable.classList.contains('table-nowrap') && !e.shiftKey && !e.ctrlKey && !e.metaKey && isClickOnInner) {
                if (currentEditTrigger === 'single') openCellEditor(td);
            }
            
            return; // 提早結束，防止原本的選取範圍被清空
        }
        
        // 統一把 Ctrl 判斷提取出來
        const isCtrl = e.ctrlKey || e.metaKey || isMobileMultiSelect;

        // 如果剛才發生了拖曳，我們就跳過點擊開啟編輯器的動作
        if (window.isCellDragging) return;

        // 修改：如果不換行模式且沒有按住特殊鍵 (包含多選模式)，點擊文字區才開啟編輯器
        if (dataTable.classList.contains('table-nowrap') && !e.shiftKey && !isCtrl && isClickOnInner) {
            if (currentEditTrigger === 'single') openCellEditor(td);
        }
    }
});

// 雙擊表格進入編輯模式
dataTable.addEventListener('dblclick', (e) => {
    if (currentMode !== 'table') return;
    
    const td = e.target.closest('td');
    if (td) {
        // 情境 1：不換行模式，雙擊直接開啟浮動獨立編輯器
        if (dataTable.classList.contains('table-nowrap')) {
            openCellEditor(td);
            return;
        }

        // 情境 2：一般模式，雙擊強制讓該格獲得焦點，並將游標移至文字最後方
        const inner = td.querySelector('.td-inner');
        if (inner && document.activeElement !== inner) {
            inner.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(inner);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
});

// 拖曳排序實作
// 【新增】判斷滑鼠按在「欄標題」的哪一半：左半 = 'select'(拖曳多選欄)、右半 = 'move'(拖曳移動欄)
function getColHeaderZone(e) {
    const th = e.target.closest('th.sticky-top');
    if (!th || th.classList.contains('sticky-corner')) return null;
    if (e.target.closest('.btn-col-menu') || e.target.closest('.resize-handle')) return null;
    const rect = th.getBoundingClientRect();
    return (e.clientX < rect.left + rect.width / 2) ? 'select' : 'move';
}

// 【新增】欄標題左半「拖曳多選欄」的狀態
let colDragSelectStart = -1;      // 起點欄索引 (-1 表示未在拖曳選取)
let colDragSelectBase = [];       // 按住 Ctrl 時，保留原本已選取的欄
window.isColDragSelecting = false;

// 【修改】原本「col-label / row-label 一按就可拖曳」→ 欄改成依左右半邊判斷，列維持原樣
dataTable.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;

    // --- 欄標題 ---
    const zone = getColHeaderZone(e);
    if (zone === 'move') {
        // 右半：啟用原生拖曳，移動欄位
        e.target.closest('th').setAttribute('draggable', 'true');
        return;
    }
    if (zone === 'select') {
        // 左半：開始拖曳多選欄 (實際選取在 mouseover 時進行，單純點擊仍由 click 處理)
        if (isSelectionLocked) return;
        const th = e.target.closest('th.sticky-top');
        colDragSelectStart = parseInt(th.dataset.col);
        const isCtrl = e.ctrlKey || e.metaKey || isMobileMultiSelect;
        colDragSelectBase = isCtrl ? [...selectedCols] : [];
        return;
    }

    // --- 列標題 (維持原本行為) ---
    if (e.target.classList.contains('row-label')) {
        const th = e.target.closest('th'); if (th) th.setAttribute('draggable', 'true');
    }
});

// 【新增】拖曳經過其他欄時，擴充選取範圍
dataTable.addEventListener('mouseover', (e) => {
    if (colDragSelectStart === -1 || isSelectionLocked) return;

    let curCol = -1;
    const th = e.target.closest('th.sticky-top');
    if (th && !th.classList.contains('sticky-corner')) {
        curCol = parseInt(th.dataset.col);
    } else {
        const td = e.target.closest('td');
        if (td) curCol = Array.from(td.closest('tr').children).indexOf(td) - 1;
    }
    if (curCol < 0) return;
    if (curCol === colDragSelectStart && !window.isColDragSelecting) return; // 還沒離開起點欄

    window.isColDragSelecting = true;
    const start = Math.min(colDragSelectStart, curCol);
    const end = Math.max(colDragSelectStart, curCol);

    if (colDragSelectBase.length === 0) { selectedRows = []; selectedCellBlocks = []; }
    const range = [];
    for (let i = start; i <= end; i++) range.push(i);
    selectedCols = Array.from(new Set([...colDragSelectBase, ...range]));
    lastSelectedColIndex = colDragSelectStart;

    applySelectionVisuals();
    window.getSelection().removeAllRanges(); // 防止拖曳時反白文字
});

// 【新增】放開滑鼠：結束拖曳多選欄
document.addEventListener('mouseup', () => {
    colDragSelectStart = -1;
    colDragSelectBase = [];
    // 延遲到 click 事件之後再解除旗標，讓 click 能被略過
    setTimeout(() => { window.isColDragSelecting = false; }, 0);
});

// 【新增】滑鼠游標提示：左半 = 多選欄、右半 = 移動欄
dataTable.addEventListener('mousemove', (e) => {
    if (colDragSelectStart !== -1 || e.buttons) return;
    const label = e.target.closest('th.sticky-top .col-label');
    if (!label) return;
    const zone = getColHeaderZone(e);
    if (zone === 'move') label.style.cursor = 'grab';
    else if (zone === 'select') label.style.cursor = 'cell';
});
dataTable.addEventListener('mouseup', () => { dataTable.querySelectorAll('th[draggable="true"]').forEach(th => th.removeAttribute('draggable')); });
dataTable.addEventListener('dragend', (e) => { if (e.target.tagName === 'TH') e.target.removeAttribute('draggable'); });

dataTable.addEventListener('dragstart', (e) => {
    const thTop = e.target.closest('th.sticky-top');
    if (thTop) { dragType = 'col'; dragIndex = parseInt(thTop.dataset.col); return; }
    const thLeft = e.target.closest('th.sticky-left');
    if (thLeft) { dragType = 'row'; const tr = thLeft.closest('tr'); dragIndex = Array.from(tr.parentNode.children).indexOf(tr); }
});

dataTable.addEventListener('dragover', (e) => {
    e.preventDefault();
    dataTable.querySelectorAll('.drag-over-col, .drag-over-row').forEach(el => el.classList.remove('drag-over-col', 'drag-over-row'));
    if (dragType === 'col') {
        const target = e.target.closest('th.sticky-top');
        if (target && !target.classList.contains('sticky-corner')) target.classList.add('drag-over-col');
    } else if (dragType === 'row') {
        const target = e.target.closest('th.sticky-left');
        if (target) target.closest('tr').classList.add('drag-over-row');
    }
});

dataTable.addEventListener('dragleave', (e) => {
    const tgtCol = e.target.closest('th.sticky-top'); if (tgtCol) tgtCol.classList.remove('drag-over-col');
    const tgtRow = e.target.closest('th.sticky-left'); if (tgtRow) tgtRow.closest('tr').classList.remove('drag-over-row');
});

dataTable.addEventListener('drop', (e) => {
    e.preventDefault();
    dataTable.querySelectorAll('.drag-over-col, .drag-over-row').forEach(el => el.classList.remove('drag-over-col', 'drag-over-row'));
    
    if (dragType === 'col') {
        const targetTh = e.target.closest('th.sticky-top');
        if (targetTh && !targetTh.classList.contains('sticky-corner')) {
            const targetIndex = parseInt(targetTh.dataset.col);
            if (targetIndex !== dragIndex) {
                const theadTr = dataTable.querySelector('thead tr'); const thToMove = theadTr.children[dragIndex + 1];
                const refTh = targetIndex > dragIndex ? theadTr.children[targetIndex + 2] : theadTr.children[targetIndex + 1];
                theadTr.insertBefore(thToMove, refTh);
                dataTable.querySelectorAll('tbody tr').forEach(tr => {
                    const tdToMove = tr.children[dragIndex + 1]; const refTd = targetIndex > dragIndex ? tr.children[targetIndex + 2] : tr.children[targetIndex + 1];
                    tr.insertBefore(tdToMove, refTd);
                });
				adjustFormulasForColMove(dragIndex, targetIndex);
                updateTableHeaders();
				saveColNames(); saveColWidths(); saveHistoryState(); applyFreeze();
            }
        }
    } else if (dragType === 'row') {
        const targetTh = e.target.closest('th.sticky-left');
        if (targetTh) {
            const tr = targetTh.closest('tr'); const targetIndex = Array.from(tr.parentNode.children).indexOf(tr);
            if (targetIndex !== dragIndex) {
                const tbody = dataTable.querySelector('tbody'); const trToMove = tbody.children[dragIndex];
                const refTr = targetIndex > dragIndex ? tbody.children[targetIndex + 1] : tbody.children[targetIndex];
                tbody.insertBefore(trToMove, refTr);
                updateTableHeaders();
				saveHistoryState(); applyFreeze();
            }
        }
    }
    dragType = null; dragIndex = -1;
});

// ====== 新增：行動版觸控拖曳排序支援 (欄與列) ======
let touchDragType = null;
let touchDragIndex = -1;
let currentDropTarget = null;
let touchStartTimer = null; 

dataTable.addEventListener('touchstart', (e) => {
    // 確保是按在欄列標籤上
    if (e.target.classList.contains('col-label') || e.target.classList.contains('row-label')) {
        const thTop = e.target.closest('th.sticky-top');
        const thLeft = e.target.closest('th.sticky-left');
        
        // 為了不阻礙使用者原本「點擊選取」或「滑動畫面」的動作，
        // 我們加入長按機制：手指按住 300 毫秒後才視為「開始拖曳」
        touchStartTimer = setTimeout(() => {
            if (thTop) { 
                touchDragType = 'col'; 
                touchDragIndex = parseInt(thTop.dataset.col); 
                showToast('🔄 開始拖曳欄位...');
            } else if (thLeft) { 
                touchDragType = 'row'; 
                const tr = thLeft.closest('tr'); 
                touchDragIndex = Array.from(tr.parentNode.children).indexOf(tr); 
                showToast('🔄 開始拖曳橫列...');
            }
        }, 300);
    }
}, { passive: true });

dataTable.addEventListener('touchmove', (e) => {
    // 如果手指提早滑動（還沒達到長按時間），取消拖曳判定，讓畫面正常滾動
    if (!touchDragType) {
        clearTimeout(touchStartTimer);
        return;
    }
    
    e.preventDefault(); // 確認開始拖曳後，阻止畫面跟著滾動
    const touch = e.touches[0];
    
    // 取得手指目前位置下方的元素 (模擬 hover 效果)
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetElement) return;

    // 清除舊的高亮標記
    dataTable.querySelectorAll('.drag-over-col, .drag-over-row').forEach(el => el.classList.remove('drag-over-col', 'drag-over-row'));
    currentDropTarget = null;

    // 依照拖曳類型加上新的高亮標記
    if (touchDragType === 'col') {
        const targetTh = targetElement.closest('th.sticky-top');
        if (targetTh && !targetTh.classList.contains('sticky-corner')) {
            targetTh.classList.add('drag-over-col');
            currentDropTarget = targetTh;
        }
    } else if (touchDragType === 'row') {
        const targetTh = targetElement.closest('th.sticky-left');
        if (targetTh) {
            targetTh.closest('tr').classList.add('drag-over-row');
            currentDropTarget = targetTh;
        }
    }
}, { passive: false });

dataTable.addEventListener('touchend', (e) => {
    clearTimeout(touchStartTimer); // 放開手指時清除長按計時器
    
    if (!touchDragType) return;
    
    // 移除所有高亮標記
    dataTable.querySelectorAll('.drag-over-col, .drag-over-row').forEach(el => el.classList.remove('drag-over-col', 'drag-over-row'));
    
    // 如果有有效的放置目標，執行與桌面版完全相同的資料交換邏輯
    if (currentDropTarget) {
        if (touchDragType === 'col') {
            const targetIndex = parseInt(currentDropTarget.dataset.col);
            if (targetIndex !== touchDragIndex) {
                const theadTr = dataTable.querySelector('thead tr'); 
                const thToMove = theadTr.children[touchDragIndex + 1];
                const refTh = targetIndex > touchDragIndex ? theadTr.children[targetIndex + 2] : theadTr.children[targetIndex + 1];
                theadTr.insertBefore(thToMove, refTh);
                
                dataTable.querySelectorAll('tbody tr').forEach(tr => {
                    const tdToMove = tr.children[touchDragIndex + 1]; 
                    const refTd = targetIndex > touchDragIndex ? tr.children[targetIndex + 2] : tr.children[targetIndex + 1];
                    tr.insertBefore(tdToMove, refTd);
                });
				adjustFormulasForColMove(touchDragIndex, targetIndex);
                updateTableHeaders();
				saveColNames(); saveColWidths(); saveHistoryState(); applyFreeze();
            }
        } else if (touchDragType === 'row') {
            const tr = currentDropTarget.closest('tr'); 
            const targetIndex = Array.from(tr.parentNode.children).indexOf(tr);
            if (targetIndex !== touchDragIndex) {
                const tbody = dataTable.querySelector('tbody'); 
                const trToMove = tbody.children[touchDragIndex];
                const refTr = targetIndex > touchDragIndex ? tbody.children[targetIndex + 1] : tbody.children[targetIndex];
                tbody.insertBefore(trToMove, refTr);
                
                updateTableHeaders();
				saveHistoryState(); applyFreeze();
            }
        }
    }
    
    // 狀態重置
    touchDragType = null;
    touchDragIndex = -1;
    currentDropTarget = null;
});


// ====== 新增：行動版觸控調整欄寬支援 (Resize) ======
dataTable.addEventListener('touchstart', (e) => {
    if (e.target.classList.contains('resize-handle')) {
        isResizing = true; 
        currentTh = e.target.closest('th'); 
        const touch = e.touches[0];
        startX = touch.pageX; 
        startWidth = currentTh.offsetWidth;
        e.target.classList.add('active'); 
        e.preventDefault(); // 避免觸發點擊或捲動
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!isResizing || !currentTh) return;
    const touch = e.touches[0];
    
    // 計算新寬度並套用，與桌面版邏輯一致
    const newWidth = Math.max(50, startWidth + (touch.pageX - startX));
    const currentColIndex = parseInt(currentTh.dataset.col);

    if (selectedCols.includes(currentColIndex)) {
        selectedCols.forEach(colIdx => {
            const th = dataTable.querySelector(`thead th[data-col="${colIdx}"]`);
            if (th) {
                th.style.width = `${newWidth}px`;
                th.style.minWidth = `${newWidth}px`;
                th.style.maxWidth = `${newWidth}px`;
            }
        });
    } else {
        currentTh.style.width = `${newWidth}px`;
        currentTh.style.minWidth = `${newWidth}px`;
        currentTh.style.maxWidth = `${newWidth}px`;
    }
    applySelectionVisuals(); 
}, { passive: true });

document.addEventListener('touchend', () => {
    if (isResizing) { 
        isResizing = false; 
        if (currentTh) {
            currentTh.querySelector('.resize-handle').classList.remove('active'); 
            saveColWidths(); 
        }
        currentTh = null; 
    }
});
// ==========================================

let isResizing = false; let currentTh = null; let startX = 0; let startWidth = 0;

dataTable.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('resize-handle')) {
        isResizing = true; 
        currentTh = e.target.closest('th'); 
        startX = e.pageX; 
        startWidth = currentTh.offsetWidth;
        e.target.classList.add('active'); 
        e.preventDefault(); 
    }
});

document.addEventListener('mousemove', (e) => {
    if (!isResizing || !currentTh) return;
    
    // 計算拖曳後的新寬度 (最小限制為 50px)
    const newWidth = Math.max(50, startWidth + (e.pageX - startX));
    
    // 取得目前正在調整寬度的欄位索引 (Index)
    const currentColIndex = parseInt(currentTh.dataset.col);

    // 【核心邏輯】判斷：目前拖曳的欄位，是否包含在「已選取的欄位」清單中？
    if (selectedCols.includes(currentColIndex)) {
        // 如果是，則將新寬度同步套用到所有被選取的欄位
        selectedCols.forEach(colIdx => {
            const th = dataTable.querySelector(`thead th[data-col="${colIdx}"]`);
            if (th) {
                th.style.width = `${newWidth}px`;
                th.style.minWidth = `${newWidth}px`;
                th.style.maxWidth = `${newWidth}px`;
            }
        });
    } else {
        // 如果不是 (單獨拖曳沒被選取的欄位)，則只調整當前欄位
        currentTh.style.width = `${newWidth}px`;
        currentTh.style.minWidth = `${newWidth}px`;
        currentTh.style.maxWidth = `${newWidth}px`;
    }
    
    // 更新畫面的藍色選取框線
    applySelectionVisuals(); 
});

document.addEventListener('mouseup', () => {
    if (isResizing) { 
        isResizing = false; 
        if (currentTh) {
            currentTh.querySelector('.resize-handle').classList.remove('active'); 
            // 拖曳結束時，原本的 saveColWidths 會自動掃描所有欄位並儲存，所以這裡不需修改
            saveColWidths(); 
        }
        currentTh = null; 
    }
});


/* ==========================================
   表格多欄位排序模組 (支援局部範圍、特定欄位與亂數排序)
   ========================================== */
const sortPanel = document.getElementById('sortPanel');
const sortRulesContainer = document.getElementById('sortRulesContainer');
const chkSortHasHeader = document.getElementById('chkSortHasHeader');
const sortPanelHeader = document.getElementById('sortPanelHeader');

// 全域變數：儲存目前選取範圍內的欄位資訊，供新增規則使用
let currentSortColumns = []; 

// 重設「有標題」核取方塊的狀態
function resetSortHeaderCheckbox() {
    chkSortHasHeader.checked = false;
}

// 開啟視窗 
document.getElementById('btnOpenSort').addEventListener('click', (e) => {
    e.stopPropagation(); 
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    openSortPanel();
});

document.getElementById('btnCloseSort').addEventListener('click', () => sortPanel.classList.add('hidden'));
document.getElementById('btnCancelSort').addEventListener('click', () => sortPanel.classList.add('hidden'));

// --- 視窗拖曳邏輯 ---
let isDraggingSort = false, dragStartXSort = 0, dragStartYSort = 0, sortPanelStartLeft = 0, sortPanelStartTop = 0;
sortPanel.addEventListener('mousedown', (e) => {
    if (e.target.closest('button, select, input, label')) return; 
    isDraggingSort = true; dragStartXSort = e.clientX; dragStartYSort = e.clientY;
    const rect = sortPanel.getBoundingClientRect();
    sortPanelStartLeft = rect.left; sortPanelStartTop = rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingSort) return;
    sortPanel.style.left = `${sortPanelStartLeft + (e.clientX - dragStartXSort)}px`;
    sortPanel.style.top = `${sortPanelStartTop + (e.clientY - dragStartYSort)}px`;
    sortPanel.style.right = 'auto'; 
});
document.addEventListener('mouseup', () => { isDraggingSort = false; document.body.style.userSelect = ''; });

sortPanel.addEventListener('touchstart', (e) => {
    if (e.target.closest('button, select, input, label')) return; 
    const touch = e.touches[0];
    isDraggingSort = true; dragStartXSort = touch.clientX; dragStartYSort = touch.clientY;
    const rect = sortPanel.getBoundingClientRect();
    sortPanelStartLeft = rect.left; sortPanelStartTop = rect.top;
    if (!e.target.closest('input, select')) e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    if (!isDraggingSort) return;
    const touch = e.touches[0];
    sortPanel.style.left = `${sortPanelStartLeft + (touch.clientX - dragStartXSort)}px`;
    sortPanel.style.top = `${sortPanelStartTop + (touch.clientY - dragStartYSort)}px`;
    sortPanel.style.right = 'auto'; 
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { isDraggingSort = false; });

// 核心引擎 1：精準計算選取範圍與涵蓋的欄位 (已修復致命 Bug)
function getSortSelectionInfo() {
    let minR = Infinity, maxR = -1;
    let cIndices = new Set(); 

    if (selectedCellBlocks.length > 0) {
        selectedCellBlocks.forEach(b => {
            minR = Math.min(minR, b.startR, b.endR);
            maxR = Math.max(maxR, b.startR, b.endR);
            // 修復點：正確計算範圍寬度，不再引發系統崩潰
            let minC = Math.min(b.startC, b.endC);
            let maxC = Math.max(b.startC, b.endC); 
            for (let c = minC; c <= maxC; c++) cIndices.add(c);
        });
    } else if (selectedRows.length > 0) {
        minR = Math.min(...selectedRows);
        maxR = Math.max(...selectedRows);
        let maxCols = dataTable.querySelector('thead tr').children.length - 2;
        for (let c = 0; c <= maxCols; c++) cIndices.add(c);
    } else if (selectedCols.length > 0) {
        minR = 0;
        maxR = dataTable.querySelectorAll('tbody tr').length - 1;
        selectedCols.forEach(c => cIndices.add(c));
    } else if (lastClickedCell) {
        minR = maxR = lastClickedCell.r;
        cIndices.add(lastClickedCell.c);
    }

    if (minR === Infinity || cIndices.size === 0) return null;

    return {
        minR,
        maxR,
        cIndices: Array.from(cIndices).sort((a, b) => a - b) 
    };
}

// 核心引擎 2：動態建立規則下拉選單 (只顯示選取範圍內的欄位)
function createSortRuleElement() {
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'flex items-center gap-2 bg-white py-1 rule-item';
    
    const optionsHtml = currentSortColumns.map(c => `<option value="${c.index}">${c.displayName}</option>`).join('');
    
    ruleDiv.innerHTML = `
        <select class="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-purple-300 code-text bg-white cursor-pointer appearance-none">
            ${optionsHtml}
        </select>
        <select class="border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-purple-300 order-select code-text bg-white cursor-pointer appearance-none">
            <option value="1">A-Z (順序)</option>
            <option value="-1">Z-A (逆序)</option>
            <option value="0">隨機 (亂數)</option>
        </select>
        <button class="text-gray-300 hover:text-red-500 transition btn-remove-rule cursor-pointer" title="移除此條件">
            <span class="material-symbols-outlined text-xl">delete</span>
        </button>
        <button class="text-gray-300 hover:text-purple-600 transition btn-add-rule cursor-pointer" title="新增排序條件">
            <span class="material-symbols-outlined text-xl">add</span>
        </button>
    `;
    
    ruleDiv.querySelector('.btn-remove-rule').addEventListener('click', () => {
        if (sortRulesContainer.children.length > 1) {
            ruleDiv.remove();
        } else {
            sortRulesContainer.innerHTML = '';
            sortRulesContainer.appendChild(createSortRuleElement());
        }
    });
    ruleDiv.querySelector('.btn-add-rule').addEventListener('click', () => {
        sortRulesContainer.insertBefore(createSortRuleElement(), ruleDiv.nextSibling);
    });
    
    return ruleDiv;
}

// 開啟與初始化設定窗格
function openSortPanel() {
    const selInfo = getSortSelectionInfo();
    if (!selInfo) {
        showToast('⚠️ 請先選取要排序的範圍');
        return;
    }
    
    // 放寬條件：即使只選一格，依然允許開啟視窗，確保 UX 順暢
    if (selInfo.minR === selInfo.maxR) {
        // showToast('⚠️ 排序範圍至少需要包含兩列資料');
        // 取消阻擋，讓它正常開窗
    }

    sortRulesContainer.innerHTML = ''; 
    
    // 更新全域欄位資訊，精準篩選出有被選取到的欄位
    currentSortColumns = selInfo.cIndices.map(colIndex => {
        const th = document.querySelector(`#data-table thead th[data-col="${colIndex}"]`);
        const customName = th && th.dataset.colName ? th.dataset.colName : '';
        const defaultName = getColLabel(colIndex);
        return {
            index: colIndex,
            displayName: customName ? `${defaultName} (${customName})` : defaultName
        };
    });
    
    sortRulesContainer.appendChild(createSortRuleElement());
    
    if (frozenRowsCount > 0 && selInfo.minR < frozenRowsCount) {
        chkSortHasHeader.checked = true;
        chkSortHasHeader.setAttribute('disabled', 'true');
    } else {
        chkSortHasHeader.checked = false; 
        chkSortHasHeader.removeAttribute('disabled');
    }

    sortPanel.classList.remove('hidden');
    
    // 確保視窗一定能出現在螢幕中央
    if (!sortPanel.style.left) {
        sortPanel.style.left = (window.innerWidth - sortPanel.offsetWidth) / 2 + 'px';
        sortPanel.style.top = (window.innerHeight - sortPanel.offsetHeight) * 0.4 + 'px';
    }
}

// 核心引擎 3：局部萃取與原位覆寫排序
document.getElementById('btnApplySort').addEventListener('click', () => {
    const ruleElements = sortRulesContainer.querySelectorAll('.rule-item');
    const rules = Array.from(ruleElements).map(el => ({
        colIndex: parseInt(el.querySelector('select').value),
        order: parseInt(el.querySelector('.order-select').value)
    }));

    if (rules.length === 0) {
        sortPanel.classList.add('hidden');
        return;
    }

    const selInfo = getSortSelectionInfo();
    if (!selInfo) return;

    let { minR, maxR, cIndices } = selInfo;

    // 若使用者宣告範圍第一列為標題，跳過不排
    if (chkSortHasHeader.checked && minR < maxR) {
        minR += 1;
    }

    if (minR >= maxR) {
        sortPanel.classList.add('hidden');
        showToast('✅ 排序完成 (僅單列無需變動)');
        return;
    }

    const tbody = dataTable.querySelector('tbody');
    let itemsToSort = [];

    // 【步驟 A】只把選取範圍的格子「挖」出來
    for (let r = minR; r <= maxR; r++) {
        let rowData = {};
        for (let c of cIndices) {
            const inner = tbody.children[r]?.children[c + 1]?.querySelector('.td-inner');
            rowData[c] = {
                text: inner ? inner.innerText : "",
                formula: inner && inner.hasAttribute('data-formula') ? inner.getAttribute('data-formula') : null
            };
        }
        itemsToSort.push({ rand: Math.random(), data: rowData });
    }

    // 【步驟 B】執行多欄位規則排序
    itemsToSort.sort((itemA, itemB) => {
        for (let rule of rules) {
            if (rule.order === 0) {
                let cmp = itemA.rand - itemB.rand;
                if (cmp !== 0) return cmp;
            } else {
                let valA = itemA.data[rule.colIndex]?.text || "";
                let valB = itemB.data[rule.colIndex]?.text || "";
                // 【修改】比照 Excel：空白儲存格不論 A-Z 或 Z-A，一律排在最後
                const blankA = valA.trim() === "";
                const blankB = valB.trim() === "";
                if (blankA && blankB) continue;      // 兩者皆空白 → 交給下一個排序條件
                if (blankA) return 1;                // A 空白 → 往後排（不乘 order）
                if (blankB) return -1;               // B 空白 → A 往前排
                let cmp = valA.localeCompare(valB, 'zh-TW', { numeric: true });
                if (cmp !== 0) return cmp * rule.order;
            }
        }
        return 0;
    });

    // 【步驟 C】把排好的格子「塞回原本的洞裡」，絕不影響其他欄列
    for (let i = 0; i < itemsToSort.length; i++) {
        let r = minR + i;
        let sortedRowData = itemsToSort[i].data;
        
        for (let c of cIndices) {
            const inner = tbody.children[r]?.children[c + 1]?.querySelector('.td-inner');
            if (inner) {
                let cellData = sortedRowData[c];
                if (cellData.formula) {
                    inner.setAttribute('data-formula', cellData.formula);
                    inner.innerText = cellData.formula; 
                } else {
                    inner.removeAttribute('data-formula');
                    inner.innerText = cellData.text;
                }
            }
        }
    }

    // 【步驟 D】觸發全域運算與存檔
    if (typeof recalculateAllFormulas === 'function') recalculateAllFormulas(); 
    if (typeof debouncedSaveHistory === 'function') debouncedSaveHistory();   
    
    sortPanel.classList.add('hidden'); 
    showToast('✅ 局部範圍排序已成功套用！');
});


/* ==========================================
   神奇多功能工具：自動填入 模組 (邏輯優化版)
   ========================================== */
const autoFillModal = document.getElementById('autoFillModal');

// 1. 開啟與關閉對話框
document.getElementById('btnOpenAutoFill').addEventListener('click', (e) => {
    e.stopPropagation();
    autoFillModal.classList.remove('hidden');
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    centerModal(autoFillModal);
    document.getElementById('autoFillPrefix').focus();
});
document.getElementById('btnCloseAutoFill').addEventListener('click', () => {
    autoFillModal.classList.add('hidden');
});

// 2. 實作視窗全區拖曳 (避開輸入框與按鈕)
let isDraggingAF = false, dragStartXAF = 0, dragStartYAF = 0, afStartLeft = 0, afStartTop = 0;
autoFillModal.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, button, label')) return; // 點擊到輸入框不觸發拖曳
    
    isDraggingAF = true; 
    dragStartXAF = e.clientX; 
    dragStartYAF = e.clientY;
    const rect = autoFillModal.getBoundingClientRect();
    afStartLeft = rect.left; 
    afStartTop = rect.top;
    document.body.style.userSelect = 'none'; // 防止拖曳時反白文字
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingAF) return;
    autoFillModal.style.left = `${afStartLeft + (e.clientX - dragStartXAF)}px`;
    autoFillModal.style.top = `${afStartTop + (e.clientY - dragStartYAF)}px`;
    autoFillModal.style.right = 'auto'; 
});
document.addEventListener('mouseup', () => { 
    isDraggingAF = false; 
    document.body.style.userSelect = ''; 
});

autoFillModal.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, button, label')) return; 
    const touch = e.touches[0];
    isDraggingAF = true; 
    dragStartXAF = touch.clientX; 
    dragStartYAF = touch.clientY;
    const rect = autoFillModal.getBoundingClientRect();
    afStartLeft = rect.left; 
    afStartTop = rect.top;
    if (!e.target.closest('input')) e.preventDefault();
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!isDraggingAF) return;
    const touch = e.touches[0];
    autoFillModal.style.left = `${afStartLeft + (touch.clientX - dragStartXAF)}px`;
    autoFillModal.style.top = `${afStartTop + (touch.clientY - dragStartYAF)}px`;
    autoFillModal.style.right = 'auto'; 
    e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', () => { 
    isDraggingAF = false; 
});

// 3. 核心邏輯：套用按鈕
document.getElementById('btnApplyAutoFill').addEventListener('click', () => {
    // 確保只在表格模式執行
    if (currentMode !== 'table') {
        showToast('⚠️ 自動填入僅能在表格模式使用');
        return;
    }

    // 取得輸入值
    const prefix = document.getElementById('autoFillPrefix').value || "";
    const suffix = document.getElementById('autoFillSuffix').value || "";
    const startNumRaw = document.getElementById('autoFillStartNum').value;
    const digitsRaw = document.getElementById('autoFillDigits').value;
    
    const hasStartNum = startNumRaw !== '';
    let currentNum = hasStartNum ? parseInt(startNumRaw, 10) : null;
    const digits = digitsRaw !== '' ? parseInt(digitsRaw, 10) : 0;

    // 判斷是否有多選範圍
    const isMultiSelect = selectedRows.length > 0 || selectedCols.length > 0 || selectedCellBlocks.length > 0;
    const rows = dataTable.querySelectorAll('tbody tr');
    
    // 智慧收集選取範圍內的儲存格 (.td-inner)
    const cellsToUpdate = [];
    
    if (!isMultiSelect) {
        // [修正] 若無多選範圍，檢查是否有聚焦或單擊的儲存格
        let targetInner = null;
        const activeEl = document.activeElement;
        if (activeEl && activeEl.classList.contains('td-inner') && dataTable.contains(activeEl)) {
            targetInner = activeEl;
        } else if (lastClickedCell && rows[lastClickedCell.r]) {
            targetInner = rows[lastClickedCell.r].children[lastClickedCell.c + 1]?.querySelector('.td-inner');
        }

        if (targetInner) {
            cellsToUpdate.push(targetInner);
        } else {
            showToast('⚠️ 請先選取要套用的儲存格範圍');
            return;
        }
    } else {
        // 循序收集選取範圍內的儲存格 (由上到下、由左至右)
        for (let r = 0; r < rows.length; r++) {
            const tr = rows[r];
            const colsCount = tr.children.length - 1; // 扣除序號 Th
            for (let c = 0; c < colsCount; c++) {
                if (selectedRows.includes(r) || selectedCols.includes(c) || isCellInAnyBlock(r, c)) {
                    const inner = tr.children[c + 1]?.querySelector('.td-inner');
                    if (inner) cellsToUpdate.push(inner);
                }
            }
        }
    }

    if (cellsToUpdate.length === 0) return;

    // 進行資料更新
    cellsToUpdate.forEach(inner => {
        if (hasStartNum) {
            // 情境 A：有輸入起始數字 -> [覆寫模式]
            let numStr = currentNum.toString();
            // 處理數字補零 (如果指定位數)
            if (digits > 0 && numStr.length < digits) {
                numStr = numStr.padStart(digits, '0');
            }
            inner.innerText = prefix + numStr + suffix;
            currentNum++; // 數字累加
        } else {
            // 情境 B：無起始數字 -> [前後追加模式] (保留原內容)
            inner.innerText = prefix + inner.innerText + suffix;
        }
    });

    // 儲存狀態並更新紀錄 (使用原本專案的函數)
    debouncedSaveHistory();

    // 提示完成
    showToast('✅ 自動填入完成！');
});



/* ==========================================
   輕量級試算表公式引擎 (Spreadsheet Formula Engine)
   ========================================== */

// 0. 輔助函數：將欄位字母 (A, B, AA) 轉為數字索引 (0, 1, 26)
function colStrToNum(colStr) {
    let colIndex = 0;
    for (let i = 0; i < colStr.length; i++) {
        colIndex = colIndex * 26 + (colStr.charCodeAt(i) - 64);
    }
    return colIndex - 1;
}

// 0.5 輔助函數：將數字索引轉回欄位字母 (0=A, 1=B, 26=AA)
function colNumToStr(colIndex) {
    let str = '';
    let temp = colIndex + 1;
    while (temp > 0) {
        let remainder = (temp - 1) % 26;
        str = String.fromCharCode(65 + remainder) + str;
        temp = Math.floor((temp - 1) / 26);
    }
    return str;
}
// 1. 座標轉換：將 "A1" 轉換為 { row: 0, col: 0 }
function parseCellReference(ref) {
    const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    
    const colIndex = colStrToNum(match[1]);
    const rowIndex = parseInt(match[2], 10) - 1; // 轉為 0-based
    return { row: rowIndex, col: colIndex };
}

// 2. 取得儲存格的值
function getCellValue(rowIdx, colIdx) {
    const rows = dataTable.querySelectorAll('tbody tr');
    if (!rows[rowIdx]) return "";
    // 記得要加 1，因為第 0 欄是左側的數字標題 (th.sticky-left)
    const td = rows[rowIdx].children[colIdx + 1]; 
    if (!td) return "";
    
    const inner = td.querySelector('.td-inner');
    if (!inner) return "";
    
    // 優先抓計算結果，轉為數字方便計算
    let val = inner.innerText.trim();
    
    // 利用正則檢查是否為「純數字+逗號+小數點」的格式，避免誤傷一般文字 (如 "蘋果,香蕉")
    let cleanVal = val;
    if (/^-?[\d,]+(\.\d+)?$/.test(val)) {
        cleanVal = val.replace(/,/g, ''); // 把逗號全部空字串替換掉
    }

    const num = parseFloat(cleanVal);
    return isNaN(num) ? val : num;
}

// 3. 解析範圍：支援 "A1"、"A1:A3"、"A:A" (整欄) 與 "1:1" (整列)
function getRangeValues(rangeStr) {
    const parts = rangeStr.split(':');
    
    // 處理單一儲存格，例如 A1
    if (parts.length === 1) {
        const cell = parseCellReference(parts[0]);
        return cell ? [getCellValue(cell.row, cell.col)] : [];
    }
    
    if (parts.length === 2) {
        const str1 = parts[0].toUpperCase().trim();
        const str2 = parts[1].toUpperCase().trim();

        // 處理【整欄參照】，例如 A:A 或 A:C
        if (/^[A-Z]+$/.test(str1) && /^[A-Z]+$/.test(str2)) {
            const minCol = Math.min(colStrToNum(str1), colStrToNum(str2));
            const maxCol = Math.max(colStrToNum(str1), colStrToNum(str2));
            const maxRow = dataTable.querySelectorAll('tbody tr').length - 1;
            
            const values = [];
            for (let r = 0; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    values.push(getCellValue(r, c));
                }
            }
            return values;
        }
        
        // 處理【整列參照】，例如 1:1 或 2:5
        if (/^\d+$/.test(str1) && /^\d+$/.test(str2)) {
            const minRow = Math.min(parseInt(str1, 10) - 1, parseInt(str2, 10) - 1);
            const maxRow = Math.max(parseInt(str1, 10) - 1, parseInt(str2, 10) - 1);
            // 取得目前的總欄數
            const maxCol = dataTable.querySelector('thead tr').children.length - 2; 

            const values = [];
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = 0; c <= maxCol; c++) {
                    values.push(getCellValue(r, c));
                }
            }
            return values;
        }

        // 處理【區塊參照】，例如 A1:B5
        const start = parseCellReference(str1);
        const end = parseCellReference(str2);
        if (!start || !end) return [];
        
        const values = [];
        const minRow = Math.min(start.row, end.row);
        const maxRow = Math.max(start.row, end.row);
        const minCol = Math.min(start.col, end.col);
        const maxCol = Math.max(start.col, end.col);
        
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                values.push(getCellValue(r, c));
            }
        }
        return values;
    }
    return [];
}

// 4. 定義支援的函數庫
const formulaFunctions = {
    // 字數計算：=LEN(A1)
    LEN: (args) => {
        if (!args[0]) return 0;
        const cell = parseCellReference(args[0]);
        if (!cell) return 0;
        const val = getCellValue(cell.row, cell.col);
        // 將值轉為字串
        const strVal = String(val);
        // 使用 ES6 展開運算子 [...str]，正確解析 Unicode 擴充漢字
        return [...strVal].length;
    },

	// 特定字元計數：=COUNTCHAR(A1, "蘋果")
    COUNTCHAR: (args) => {
        // 確保使用者有輸入儲存格與要找的字元
        if (args.length < 2) return "錯誤: 參數不足";
        
        // 解析儲存格座標
        const cell = parseCellReference(args[0]);
        if (!cell) return "錯誤: 參照無效";
        
        // 取得儲存格內容並強制轉為純字串
        const val = String(getCellValue(cell.row, cell.col));
        
        // 取得要尋找的目標字元，並移除前後可能帶有的單引號或雙引號
        const targetChar = args[1].replace(/^["']|["']$/g, "");
        
        // 如果要找的字元是空的，直接回傳 0
        if (!targetChar) return 0;
        
        // 利用 split 方法切割字串，陣列長度減 1 即為出現次數
        // 例如 "A-B-A".split("-") 會變成 ["A", "B", "A"] (長度3)，出現次數為 2
        return val.split(targetChar).length - 1;
    },

	// 精確比對：=EXACT(A1, B1) 或 =EXACT(A1, "測試")
    EXACT: (args) => {
        // 確保使用者有輸入兩個參數來進行比對
        if (args.length < 2) return "錯誤: 參數不足";
        
        // 建立一個內部小工具：用來判斷參數是「儲存格」還是「純文字」
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) {
                // 如果是合法座標，去表格抓值出來
                return String(getCellValue(cell.row, cell.col));
            }
            // 如果不是座標，就把前後可能帶有的單引號或雙引號拿掉，當作純文字
            return arg.replace(/^["']|["']$/g, "");
        };

        // 取得兩個參數的實際文字內容
        const val1 = resolveArg(args[0]);
        const val2 = resolveArg(args[1]);

        // 嚴格比對兩者是否完全相同 (區分大小寫)
        return val1 === val2 ? "O" : "X";
    },

	// 字元數量比對：=EXACTCHAR(A1, B1, "X")
    // 參數 4 (選填): 1 代表精確比對 (區分大小寫，預設)，0 代表模糊比對
    EXACTCHAR: (args) => {
        // 需要至少 3 個參數：A1, B1, "要找的字元"
        if (args.length < 3) return "錯誤: 參數不足";
        
        // 內部小工具：判斷參數是「儲存格」還是「純文字」
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) {
                return String(getCellValue(cell.row, cell.col));
            }
            return arg.replace(/^["']|["']$/g, "");
        };

        const val1 = resolveArg(args[0]);
        const val2 = resolveArg(args[1]);
        const targetChar = args[2].replace(/^["']|["']$/g, "");
        
        if (!targetChar) return "錯誤: 無目標字元";

        // 判斷是否開啟 exact 精確比對模式 (預設為 true)
        let isExact = true;
        if (args.length >= 4) {
            isExact = args[3].trim() !== "0"; 
        }

        let count1 = 0;
        let count2 = 0;

        // 計算次數的邏輯 (沿用 COUNTCHAR 的穩健寫法)
        if (isExact) {
            count1 = val1.split(targetChar).length - 1;
            count2 = val2.split(targetChar).length - 1;
        } else {
            const safeTarget = targetChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(safeTarget, 'gi');
            const matches1 = val1.match(regex);
            const matches2 = val2.match(regex);
            count1 = matches1 ? matches1.length : 0;
            count2 = matches2 ? matches2.length : 0;
        }

        // 比較次數並組合輸出結果
        if (count1 === count2) {
            return `O,${count1}`;
        } else {
            return `X,${count1},${count2}`;
        }
    },

	// 截取左側字元：=LEFT(文字, [截取長度])
    LEFT: (args) => {
        if (args.length < 1) return "錯誤: 參數不足";
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) return String(getCellValue(cell.row, cell.col));
            return arg.replace(/^["']|["']$/g, "");
        };
        const text = resolveArg(args[0]);
        let numChars = 1; // 預設截取 1 個字元
        if (args.length >= 2) {
            numChars = parseInt(resolveArg(args[1]), 10);
            if (isNaN(numChars) || numChars < 0) return "#VALUE!";
        }
        if (numChars === 0) return "";
        
        // 使用展開運算子完美處理 Unicode 擴充漢字
        const chars = [...text];
        return chars.slice(0, numChars).join('');
    },

    // 截取右側字元：=RIGHT(文字, [截取長度])
    RIGHT: (args) => {
        if (args.length < 1) return "錯誤: 參數不足";
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) return String(getCellValue(cell.row, cell.col));
            return arg.replace(/^["']|["']$/g, "");
        };
        const text = resolveArg(args[0]);
        let numChars = 1;
        if (args.length >= 2) {
            numChars = parseInt(resolveArg(args[1]), 10);
            if (isNaN(numChars) || numChars < 0) return "#VALUE!";
        }
        if (numChars === 0) return "";
        
        const chars = [...text];
        if (numChars >= chars.length) return text;
        return chars.slice(-numChars).join('');
    },

    // 截取中間字元：=MID(文字, 起始位置, 截取長度)
    MID: (args) => {
        if (args.length < 3) return "錯誤: 參數不足";
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) return String(getCellValue(cell.row, cell.col));
            return arg.replace(/^["']|["']$/g, "");
        };
        const text = resolveArg(args[0]);
        const startNum = parseInt(resolveArg(args[1]), 10);
        const numChars = parseInt(resolveArg(args[2]), 10);
        
        if (isNaN(startNum) || startNum < 1 || isNaN(numChars) || numChars < 0) return "#VALUE!";
        if (numChars === 0) return "";
        
        const chars = [...text];
        if (startNum > chars.length) return "";
        
        // Excel 的起始位置是 1-based，所以陣列索引要減 1
        return chars.slice(startNum - 1, startNum - 1 + numChars).join('');
    },
	
	// 陣列合併：=JOIN(分隔符, 範圍) 或 =JOIN("-", A1, B1)
    // 陣列合併：=JOIN(分隔符, 範圍) 或 =JOIN("-", A1, B1)
    JOIN: (args) => {
        if (args.length < 2) return "錯誤: 參數不足";
        
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            return cell ? String(getCellValue(cell.row, cell.col)) : arg.replace(/^["']|["']$/g, "");
        };

        const separator = resolveArg(args[0]);
        let valuesToJoin = [];

        // 遍歷第二個參數開始的所有項目
        for (let i = 1; i < args.length; i++) {
            const arg = args[i].trim();
            // 如果是範圍 (包含冒號)
            if (arg.includes(':')) {
                const rangeVals = getRangeValues(arg);
                valuesToJoin = valuesToJoin.concat(rangeVals.map(String));
            } else {
                valuesToJoin.push(resolveArg(arg));
            }
        }
        
        // 排除空字串後再合併
        return valuesToJoin.filter(v => v !== "").join(separator);
    },

    // 正則擷取：=REGEXEXTRACT(文字, 正規表達式)
    REGEXEXTRACT: (args) => {
        if (args.length < 2) return "錯誤: 參數不足";
        
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            return cell ? String(getCellValue(cell.row, cell.col)) : arg.replace(/^["']|["']$/g, "");
        };

        const text = resolveArg(args[0]);
        const regexStr = resolveArg(args[1]);

        try {
            const regex = new RegExp(regexStr);
            const match = text.match(regex);
            // 如果有捕捉群組，回傳第一個群組；否則回傳整個匹配的字串
            return match ? (match[1] || match[0]) : "#N/A";
        } catch (e) {
            return "錯誤: 無效的正則表達式";
        }
    },

    // 取代位置字元：=REPLACE(文字, 起始位置, 取代長度, 新文字)
    REPLACE: (args) => {
        if (args.length < 4) return "錯誤: 參數不足";
        
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            return cell ? String(getCellValue(cell.row, cell.col)) : arg.replace(/^["']|["']$/g, "");
        };

        const text = resolveArg(args[0]);
        const startPos = parseInt(resolveArg(args[1]), 10);
        const numChars = parseInt(resolveArg(args[2]), 10);
        const newText = resolveArg(args[3]);

        if (isNaN(startPos) || startPos < 1 || isNaN(numChars) || numChars < 0) return "#VALUE!";

        // 轉換成陣列以支援擴充漢字
        const chars = [...text];
        const before = chars.slice(0, startPos - 1).join('');
        const after = chars.slice(startPos - 1 + numChars).join('');

        return before + newText + after;
    },

	// 隨機亂數：=RAND() 或 =RAND(最小, 最大)
    RAND: (args) => {
        if (args.length >= 2) {
            // 確保從小排到大，避免使用者輸入 =RAND(10, 1) 發生錯誤
            const val1 = parseInt(args[0], 10);
            const val2 = parseInt(args[1], 10);
            
            if (!isNaN(val1) && !isNaN(val2)) {
                const min = Math.min(val1, val2);
                const max = Math.max(val1, val2);
                const key = `${min}-${max}`; // 為這個範圍建立專屬的袋子標籤
                
                // 1. 如果這個範圍的袋子不存在，或是數字已經被抽光了，就重新裝填並洗牌
                if (!window.randBags[key] || window.randBags[key].length === 0) {
                    let newBag = [];
                    for (let i = min; i <= max; i++) {
                        newBag.push(i);
                    }
                    
                    // 進行陣列洗牌 (著名的 Fisher-Yates 洗牌演算法)
                    for (let i = newBag.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
                    }
                    window.randBags[key] = newBag;
                }
                
                // 2. 從洗好的袋子中抽出最後一個數字並回傳
                return window.randBags[key].pop();
            }
        }
        
        // 若沒有參數，維持 6 位小數的標準亂數
        return parseFloat(Math.random().toFixed(6));
    },
    // 總和計算
    SUM: (args) => {
        if (!args[0]) return 0;
        const values = getRangeValues(args[0]);
        return values.reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
    },

	// 垂直搜尋：=VLOOKUP(尋找目標, 搜尋範圍, 回傳欄數, [是否精確比對])
    // 範例：=VLOOKUP(A1, D:E, 2, 0)
    VLOOKUP: (args) => {
        if (args.length < 3) return "錯誤: 參數不足";

        // 1. 解析「尋找目標」(Lookup Value)
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) return getCellValue(cell.row, cell.col);
            return arg.replace(/^["']|["']$/g, ""); // 移除引號
        };
        const lookupValue = String(resolveArg(args[0])).trim();

        // 2. 解析「搜尋範圍」(Table Array)
        const rangeParts = args[1].split(':');
        if (rangeParts.length !== 2) return "#VALUE!";
        
        const str1 = rangeParts[0].trim().toUpperCase();
        const str2 = rangeParts[1].trim().toUpperCase();
        
        let minRow, maxRow, minCol, maxCol;

        // 支援整欄選取 (如 D:E)
        if (/^[A-Z]+$/.test(str1) && /^[A-Z]+$/.test(str2)) {
            minCol = Math.min(colStrToNum(str1), colStrToNum(str2));
            maxCol = Math.max(colStrToNum(str1), colStrToNum(str2));
            minRow = 0;
            maxRow = dataTable.querySelectorAll('tbody tr').length - 1;
        } 
        // 支援區塊選取 (如 D1:E10)
        else {
            const start = parseCellReference(str1);
            const end = parseCellReference(str2);
            if (!start || !end) return "#REF!";
            minRow = Math.min(start.row, end.row);
            maxRow = Math.max(start.row, end.row);
            minCol = Math.min(start.col, end.col);
            maxCol = Math.max(start.col, end.col);
        }

        // 3. 解析「回傳欄數」(Column Index)
        const colIndex = parseInt(args[2].trim(), 10);
        if (isNaN(colIndex) || colIndex < 1) return "#VALUE!";
        
        // 檢查回傳欄數是否超出了選取範圍的寬度
        if (colIndex > (maxCol - minCol + 1)) return "#REF!";

        // 4. 解析「比對模式」 (預設為精確比對)
        let isExact = true; 
        if (args.length >= 4) {
            const exactArg = args[3].trim().toUpperCase();
            if (exactArg === '1' || exactArg === 'TRUE') isExact = false;
        }

        // 5. 開始由上往下逐列搜尋
        for (let r = minRow; r <= maxRow; r++) {
            // 抓取該列第一欄的值
            const cellVal = String(getCellValue(r, minCol)).trim();
            
            // 簡單強大的字串比對
            if (cellVal === lookupValue) {
                // 找到目標！回傳該列往右數 (colIndex - 1) 欄的值
                return getCellValue(r, minCol + colIndex - 1);
            }
        }

        // 找不到目標時，回傳標準的 Excel 錯誤代碼
        return "#N/A";
    },
	
	// 垂直搜尋全部符合項目：=VLOOKUPALL(尋找目標, 搜尋範圍, 回傳欄數, [分隔符號])
    // 範例：=VLOOKUPALL(A1, D:E, 2, ", ")
    VLOOKUPALL: (args) => {
        if (args.length < 3) return "錯誤: 參數不足";

        // 1. 解析「尋找目標」(Lookup Value)
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) return getCellValue(cell.row, cell.col);
            return arg.replace(/^["']|["']$/g, "");
        };
        const lookupValue = String(resolveArg(args[0])).trim();

        // 2. 解析「搜尋範圍」(Table Array)
        const rangeParts = args[1].split(':');
        if (rangeParts.length !== 2) return "#VALUE!";
        
        const str1 = rangeParts[0].trim().toUpperCase();
        const str2 = rangeParts[1].trim().toUpperCase();
        
        let minRow, maxRow, minCol, maxCol;

        if (/^[A-Z]+$/.test(str1) && /^[A-Z]+$/.test(str2)) {
            minCol = Math.min(colStrToNum(str1), colStrToNum(str2));
            maxCol = Math.max(colStrToNum(str1), colStrToNum(str2));
            minRow = 0;
            maxRow = dataTable.querySelectorAll('tbody tr').length - 1;
        } else {
            const start = parseCellReference(str1);
            const end = parseCellReference(str2);
            if (!start || !end) return "#REF!";
            minRow = Math.min(start.row, end.row);
            maxRow = Math.max(start.row, end.row);
            minCol = Math.min(start.col, end.col);
            maxCol = Math.max(start.col, end.col);
        }

        // 3. 解析「回傳欄數」(Column Index)
        const colIndex = parseInt(args[2].trim(), 10);
        if (isNaN(colIndex) || colIndex < 1) return "#VALUE!";
        if (colIndex > (maxCol - minCol + 1)) return "#REF!";

        // 4. 解析「分隔符號」 (預設為 ", ")
        let separator = ", ";
        if (args.length >= 4) {
            // 允許使用者自訂分隔符，並移除外層引號
            separator = args[3].replace(/^["']|["']$/g, ""); 
        }

        // 5. 開始由上往下逐列搜尋，收集所有符合的項目
        const results = [];
        for (let r = minRow; r <= maxRow; r++) {
            const cellVal = String(getCellValue(r, minCol)).trim();
            
            if (cellVal === lookupValue) {
                const matchVal = String(getCellValue(r, minCol + colIndex - 1)).trim();
                // 避免把完全空白的格子也加進去
                if (matchVal !== "") {
                    results.push(matchVal);
                }
            }
        }

        // 6. 組合並回傳結果
        if (results.length === 0) return "#N/A";
        return results.join(separator);
    },// 垂直搜尋全部符合項目：=VLOOKUPALL(尋找目標, 搜尋範圍, 回傳欄數, [分隔符號])
    // 範例：=VLOOKUPALL(A1, D:E, 2, ", ")
    VLOOKUPALL: (args) => {
        if (args.length < 3) return "錯誤: 參數不足";

        // 1. 解析「尋找目標」(Lookup Value)
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            if (cell) return getCellValue(cell.row, cell.col);
            return arg.replace(/^["']|["']$/g, "");
        };
        const lookupValue = String(resolveArg(args[0])).trim();

        // 2. 解析「搜尋範圍」(Table Array)
        const rangeParts = args[1].split(':');
        if (rangeParts.length !== 2) return "#VALUE!";
        
        const str1 = rangeParts[0].trim().toUpperCase();
        const str2 = rangeParts[1].trim().toUpperCase();
        
        let minRow, maxRow, minCol, maxCol;

        if (/^[A-Z]+$/.test(str1) && /^[A-Z]+$/.test(str2)) {
            minCol = Math.min(colStrToNum(str1), colStrToNum(str2));
            maxCol = Math.max(colStrToNum(str1), colStrToNum(str2));
            minRow = 0;
            maxRow = dataTable.querySelectorAll('tbody tr').length - 1;
        } else {
            const start = parseCellReference(str1);
            const end = parseCellReference(str2);
            if (!start || !end) return "#REF!";
            minRow = Math.min(start.row, end.row);
            maxRow = Math.max(start.row, end.row);
            minCol = Math.min(start.col, end.col);
            maxCol = Math.max(start.col, end.col);
        }

        // 3. 解析「回傳欄數」(Column Index)
        const colIndex = parseInt(args[2].trim(), 10);
        if (isNaN(colIndex) || colIndex < 1) return "#VALUE!";
        if (colIndex > (maxCol - minCol + 1)) return "#REF!";

        // 4. 解析「分隔符號」 (預設為 ", ")
        let separator = ", ";
        if (args.length >= 4) {
            // 允許使用者自訂分隔符，並移除外層引號
            separator = args[3].replace(/^["']|["']$/g, ""); 
        }

        // 5. 開始由上往下逐列搜尋，收集所有符合的項目
        const results = [];
        for (let r = minRow; r <= maxRow; r++) {
            const cellVal = String(getCellValue(r, minCol)).trim();
            
            if (cellVal === lookupValue) {
                const matchVal = String(getCellValue(r, minCol + colIndex - 1)).trim();
                // 避免把完全空白的格子也加進去
                if (matchVal !== "") {
                    results.push(matchVal);
                }
            }
        }

        // 6. 組合並回傳結果
        if (results.length === 0) return "#N/A";
        return results.join(separator);
    },

	// Base64 編碼：=BASE64(A1) 或 =BASE64("測試")
    BASE64: (args) => {
        if (args.length < 1) return "錯誤: 參數不足";
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            return cell ? String(getCellValue(cell.row, cell.col)) : arg.replace(/^["']|["']$/g, "");
        };
        const text = resolveArg(args[0]);
        try {
            // 處理 Unicode (中文字) 的 Base64 編碼
            return btoa(unescape(encodeURIComponent(text)));
        } catch (e) {
            return "#VALUE!";
        }
    },

    // Base64 解碼：=BASE64DEC(A1)
    BASE64DEC: (args) => {
        if (args.length < 1) return "錯誤: 參數不足";
        const resolveArg = (arg) => {
            const cell = parseCellReference(arg);
            return cell ? String(getCellValue(cell.row, cell.col)) : arg.replace(/^["']|["']$/g, "");
        };
        const text = resolveArg(args[0]);
        try {
            // 處理 Unicode (中文字) 的 Base64 解碼
            return decodeURIComponent(escape(atob(text.trim())));
        } catch (e) {
            return "#VALUE!"; // 若格式錯誤則回傳 #VALUE!
        }
    },

    // 條件計數：=COUNTIF(A1:A5, ">10") 或 =COUNTIF(A1:A5, "蘋果")
    COUNTIF: (args) => {
        if (args.length < 2) return "錯誤: 參數不足";
        const values = getRangeValues(args[0]);
        const condition = args[1].replace(/["']/g, "").trim(); // 移除引號
        
        return values.filter(val => {
            // 處理運算子條件 (如 >10, <=5)
            const match = condition.match(/^(>=|<=|>|<|=)?(.+)$/);
            if (match) {
                const operator = match[1] || '===';
                
                let numStr = match[2].trim();
                if (/^-?[\d,]+(\.\d+)?$/.test(numStr)) {
                    numStr = numStr.replace(/,/g, '');
                }
                
                const targetValue = parseFloat(numStr);
                
                if (!isNaN(targetValue) && typeof val === 'number') {
                    switch(operator) {
                        case '>': return val > targetValue;
                        case '<': return val < targetValue;
                        case '>=': return val >= targetValue;
                        case '<=': return val <= targetValue;
                        case '=': case '===': return val === targetValue;
                    }
                }
            }
            // 純文字比對
            return String(val) === condition;
        }).length;
    }
};

// 5. 解析並執行公式字串 (支援簡寫、引號保護、保留大小寫、智慧括號、基礎運算)
function evaluateFormula(formulaStr) {
    let cleanFormula = formulaStr.substring(1).trim(); 
    
    // 智慧補齊右括號 (自動加上缺失的 ')')
    const openBrackets = (cleanFormula.match(/\(/g) || []).length;
    const closeBrackets = (cleanFormula.match(/\)/g) || []).length;
    if (openBrackets > closeBrackets) {
        cleanFormula += ')'.repeat(openBrackets - closeBrackets);
    }
    
    // 判斷是否為函數模式：找尋 函數名(參數)
    const match = cleanFormula.match(/^([a-zA-Z][a-zA-Z0-9_]*)\((.*)\)$/);
    
    // 如果不是函數，嘗試作為基礎運算式執行 (例如 A1+B1, C2&"測試")
    if (!match) {
        let evalStr = cleanFormula;
        
        // 解析儲存格並帶入實際值
        evalStr = evalStr.replace(/[A-Z]+\d+/gi, (cellRef) => {
            const cell = parseCellReference(cellRef);
            if (!cell) return cellRef;
            const val = getCellValue(cell.row, cell.col);
            // 數字直接輸出，文字則包上雙引號並做安全跳脫
            if (typeof val === 'number' && !isNaN(val)) return val;
            return `"${String(val).replace(/"/g, '\\"')}"`;
        });

        // 處理 '&' 連接符號：將不在引號內的 '&' 替換為 '+""+'，強制將前後變數轉型並執行純文字合併
        let inQuotesForAmp = false;
        let processedEvalStr = '';
        for(let i=0; i<evalStr.length; i++) {
            if (evalStr[i] === '"') inQuotesForAmp = !inQuotesForAmp;
            if (evalStr[i] === '&' && !inQuotesForAmp) {
                processedEvalStr += '+""+';
            } else {
                processedEvalStr += evalStr[i];
            }
        }
        evalStr = processedEvalStr;

        try {
            // 使用安全的 Function 建構式進行數學與字串運算
            const result = new Function(`return ${evalStr}`)();
            return result === undefined ? "" : result;
        } catch (e) {
            return "錯誤: 無效的運算式";
        }
    }
    
    let funcName = match[1].toUpperCase();
    let argsStr = match[2]; 
    
    const args = [];
    let currentArg = '';
    let inDoubleQuotes = false;
    let inSingleQuotes = false;
    
    for (let i = 0; i < argsStr.length; i++) {
        const char = argsStr[i];
        
        if (char === '"' && !inSingleQuotes) inDoubleQuotes = !inDoubleQuotes;
        else if (char === "'" && !inDoubleQuotes) inSingleQuotes = !inSingleQuotes;
        
        if (char === ',' && !inDoubleQuotes && !inSingleQuotes) {
            args.push(currentArg.trim());
            currentArg = '';
        } else {
            currentArg += char;
        }
    }
    args.push(currentArg.trim());

    const aliases = {
        'L': 'LEN',
        'S': 'SUM',
        'CI': 'COUNTIF',
        'CC': 'COUNTCHAR',
        'E': 'EXACT',
        'EC': 'EXACTCHAR',
		'V': 'VLOOKUP',
		'VA': 'VLOOKUPALL',
		'LF': 'LEFT',
        'R': 'RIGHT',
        'M': 'MID',
        'J': 'JOIN',
        'RE': 'REGEXEXTRACT',
        'RP': 'REPLACE',
		'RD': 'RAND',
		'B64': 'BASE64',
        'B64D': 'BASE64DEC',
    };
    
    if (aliases[funcName]) {
        funcName = aliases[funcName];
    }
    
    if (formulaFunctions[funcName]) {
        try {
            return formulaFunctions[funcName](args);
        } catch (e) {
            return "錯誤: 計算失敗";
        }
    } else {
        return "錯誤: 找不到函數";
    }
}



/* ==========================================
   綁定公式行為到 UI 介面
   ========================================== */

// 處理 Focus：進入編輯時，如果背後有公式，顯示公式讓使用者編輯
dataTable.addEventListener('focusin', (e) => {
    if (e.target.classList.contains('td-inner')) {
        const formula = e.target.getAttribute('data-formula');
        if (formula) {
            e.target.innerText = formula;
        }
    }
});

// 處理 Blur：離開編輯時，檢查是否為公式並計算
dataTable.addEventListener('focusout', (e) => {
    if (e.target.classList.contains('td-inner')) {
        const text = e.target.innerText.trim();
        
        // 1. 先處理當前編輯的儲存格
        if (text.startsWith('=')) {
            e.target.setAttribute('data-formula', text);
        } else {
            // 如果改回普通文字，記得清除公式標記
            e.target.removeAttribute('data-formula');
        }
        
        // 2. 觸發全表重新計算，確保所有相依的儲存格 (如 B1) 都更新
        recalculateAllFormulas();
        
        // 3. 儲存最新狀態到 localStorage
        debouncedSaveHistory();
    }
});



// 全域重新計算函數，確保所有公式都能同步更新
function recalculateAllFormulas() {
    // 找出表格中所有的儲存格內容區塊
    const cells = dataTable.querySelectorAll('.td-inner');
    
    cells.forEach(cell => {
        // 優先讀取背後的公式，如果沒有，就讀取畫面上的文字
        let content = cell.getAttribute('data-formula') || cell.innerText.trim();
        
        // 如果確定這是一個公式
        if (content.startsWith('=')) {
            // 確保屬性有被正確標記，以便下次讀取
            cell.setAttribute('data-formula', content);
            // 執行計算並將結果顯示在畫面上
            cell.innerText = evaluateFormula(content);
        }
    });
}











/* ==========================================
   公式相對參照平移引擎
   ========================================== */

// 將欄位字母與數字平移指定的偏移量
function shiftCellReference(ref, rowOffset, colOffset) {
    const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
    if (!match) return ref;

    let colStr = match[1];
    let rowStr = match[2];

    // 將字母轉為數字索引 (A=0, B=1...)
    let colIndex = 0;
    for (let i = 0; i < colStr.length; i++) {
        colIndex = colIndex * 26 + (colStr.charCodeAt(i) - 64);
    }
    colIndex -= 1;

    let rowIndex = parseInt(rowStr, 10) - 1;

    // 加上偏移量
    let newColIndex = colIndex + colOffset;
    let newRowIndex = rowIndex + rowOffset;

    // 如果平移後超出邊界 (例如 A1 往左移)，回傳錯誤參照
    if (newColIndex < 0 || newRowIndex < 0) return "#REF!";

    // 將新數字轉換回字母 (0=A, 25=Z, 26=AA...)
    let newColStr = '';
    let tempCol = newColIndex + 1;
    while (tempCol > 0) {
        let remainder = (tempCol - 1) % 26;
        newColStr = String.fromCharCode(65 + remainder) + newColStr;
        tempCol = Math.floor((tempCol - 1) / 26);
    }

    return newColStr + (newRowIndex + 1);
}

// 掃描公式並取代所有座標
function shiftFormula(formula, rowOffset, colOffset) {
    if (!formula.startsWith('=')) return formula;

    // 尋找大寫字母配上數字的組合 (例如 A1, Z99)
    return formula.replace(/([A-Z]+)(\d+)\b(?!\()/g, (match) => {
        return shiftCellReference(match, rowOffset, colOffset);
    });
}




/* ==========================================
   神奇多功能工具：自動函數 模組
   ========================================== */
const autoFormulaModal = document.getElementById('autoFormulaModal');
const autoFormulaInput = document.getElementById('autoFormulaInput');
const autoFormulaSelect = document.getElementById('autoFormulaSelect');

// 開啟與關閉對話框
document.getElementById('btnOpenAutoFormula').addEventListener('click', (e) => {
    e.stopPropagation();
    autoFormulaModal.classList.remove('hidden');
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    centerModal(autoFormulaModal);
    autoFormulaInput.focus();
});
document.getElementById('btnCloseAutoFormula').addEventListener('click', () => {
    autoFormulaModal.classList.add('hidden');
});

// 當選擇參考函數時，自動帶入輸入框並智慧調整列號
autoFormulaSelect.addEventListener('change', (e) => {
    let formulaStr = e.target.value;
    if (!formulaStr) return;

    // 1. 嘗試找出目前選取範圍的「起始列 (0-based)」
    let startR = -1;
    
    if (selectedCellBlocks.length > 0) {
        startR = Math.min(selectedCellBlocks[0].startR, selectedCellBlocks[0].endR);
    } else if (selectedRows.length > 0) {
        startR = Math.min(...selectedRows);
    } else if (lastClickedCell) {
        startR = lastClickedCell.r;
    } else {
        // 如果都沒選，看看游標停在哪一格
        const activeInner = document.activeElement.closest('.td-inner');
        if (activeInner && dataTable.contains(activeInner)) {
            const tr = activeInner.closest('tr');
            startR = Array.from(tr.parentNode.children).indexOf(tr);
        }
    }

    // 2. 如果有找到起始列，將範例公式中的列號加上位移量
    if (startR !== -1) {
        // 範例公式都是以第 1 列 (Row 1) 為基準，所以位移量就是 startR
        const rowOffset = startR;
        
        // 使用正則表達式尋找所有「字母+數字」的組合 (例如 A1, B1, A5)
        formulaStr = formulaStr.replace(/([A-Z]+)(\d+)\b(?!\()/g, (match, col, row) => {
            const originalRow = parseInt(row, 10);
            // 將原本的數字加上位移量 (例如起點在第 3 列，A1 會變成 A3，A5 會變成 A7)
            return col + (originalRow + rowOffset);
        });
    }

    // 3. 將調整好的公式填入輸入框
    autoFormulaInput.value = formulaStr;
});

// 視窗全區拖曳 (桌機 + 手機)
let isDraggingAFM = false, dragStartXAFM = 0, dragStartYAFM = 0, afmStartLeft = 0, afmStartTop = 0;
autoFormulaModal.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, select, button, label')) return; 
    isDraggingAFM = true; dragStartXAFM = e.clientX; dragStartYAFM = e.clientY;
    const rect = autoFormulaModal.getBoundingClientRect();
    afmStartLeft = rect.left; afmStartTop = rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingAFM) return;
    autoFormulaModal.style.left = `${afmStartLeft + (e.clientX - dragStartXAFM)}px`;
    autoFormulaModal.style.top = `${afmStartTop + (e.clientY - dragStartYAFM)}px`;
    autoFormulaModal.style.right = 'auto'; 
});
document.addEventListener('mouseup', () => { isDraggingAFM = false; document.body.style.userSelect = ''; });

autoFormulaModal.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, select, button, label')) return; 
    const touch = e.touches[0];
    isDraggingAFM = true; dragStartXAFM = touch.clientX; dragStartYAFM = touch.clientY;
    const rect = autoFormulaModal.getBoundingClientRect();
    afmStartLeft = rect.left; afmStartTop = rect.top;
    if (!e.target.closest('input, select')) e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    if (!isDraggingAFM) return;
    const touch = e.touches[0];
    autoFormulaModal.style.left = `${afmStartLeft + (touch.clientX - dragStartXAFM)}px`;
    autoFormulaModal.style.top = `${afmStartTop + (touch.clientY - dragStartYAFM)}px`;
    autoFormulaModal.style.right = 'auto'; 
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { isDraggingAFM = false; });

// 核心邏輯：套用智慧函數
document.getElementById('btnApplyAutoFormula').addEventListener('click', () => {
    if (currentMode !== 'table') return showToast('⚠️ 僅能在表格模式使用');
    
    let formulaStr = autoFormulaInput.value.trim();
    if (!formulaStr) return showToast('⚠️ 請輸入公式');
    if (!formulaStr.startsWith('=')) formulaStr = '=' + formulaStr; // 防呆：自動補上等號

    const rows = dataTable.querySelectorAll('tbody tr');
    const cellsToUpdate = [];
    let startR = Infinity, startC = Infinity; // 用來找出選取範圍的「最左上角(起點)」

    // 收集所有被選取的儲存格，並找出起點
    for (let r = 0; r < rows.length; r++) {
        const tr = rows[r];
        const colsCount = tr.children.length - 1; 
        for (let c = 0; c < colsCount; c++) {
            // 判斷是否在選取範圍內
            if (selectedRows.includes(r) || selectedCols.includes(c) || isCellInAnyBlock(r, c)) {
                const inner = tr.children[c + 1]?.querySelector('.td-inner');
                if (inner) {
                    cellsToUpdate.push({ r, c, inner });
                    startR = Math.min(startR, r);
                    startC = Math.min(startC, c);
                }
            }
        }
    }

    // 處理單格選取 (如果沒有多選，就只套用目前游標或點擊的那一格)
    if (cellsToUpdate.length === 0) {
        let targetInner = null;
        let r = -1, c = -1;
        const activeEl = document.activeElement;
        if (activeEl && activeEl.classList.contains('td-inner') && dataTable.contains(activeEl)) {
            targetInner = activeEl;
            r = Array.from(activeEl.closest('tr').parentNode.children).indexOf(activeEl.closest('tr'));
            c = Array.from(activeEl.closest('tr').children).indexOf(activeEl.closest('td')) - 1;
        } else if (lastClickedCell && rows[lastClickedCell.r]) {
            targetInner = rows[lastClickedCell.r].children[lastClickedCell.c + 1]?.querySelector('.td-inner');
            r = lastClickedCell.r; c = lastClickedCell.c;
        }

        if (targetInner) {
            cellsToUpdate.push({ r, c, inner: targetInner });
            startR = r; startC = c;
        } else {
            return showToast('⚠️ 請先選取要套用的儲存格範圍');
        }
    }

    // 執行套用與公式平移
    cellsToUpdate.forEach(cell => {
        // 計算這格相對於「第一格」的位移量
        const rowOffset = cell.r - startR;
        const colOffset = cell.c - startC;
        
        // 利用我們寫好的引擎進行平移 (例如 B2 移到 B3，公式中的 A3 就會變成 A4)
        const shiftedFormula = shiftFormula(formulaStr, rowOffset, colOffset);
        
        // 寫入儲存格
        cell.inner.setAttribute('data-formula', shiftedFormula);
        cell.inner.innerText = shiftedFormula;
    });

    // 觸發全表重算、存檔與歷史紀錄
    recalculateAllFormulas();
    debouncedSaveHistory();
    
    showToast('✅ 函數已智慧套用完成！');
});



/* ==========================================
   神奇多功能工具：移除重複 模組
   ========================================== */
const removeDuplicatesModal = document.getElementById('removeDuplicatesModal');

// 開啟與關閉對話框
document.getElementById('btnOpenRemoveDuplicates').addEventListener('click', (e) => {
    e.stopPropagation();
    removeDuplicatesModal.classList.remove('hidden');
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    centerModal(removeDuplicatesModal); // 呼叫你之前寫好的置中函數
});
document.getElementById('btnCloseRemoveDuplicates').addEventListener('click', () => {
    removeDuplicatesModal.classList.add('hidden');
});

// 視窗全區拖曳 (桌機 + 手機)
let isDraggingRDM = false, dragStartXRDM = 0, dragStartYRDM = 0, rdmStartLeft = 0, rdmStartTop = 0;
removeDuplicatesModal.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, select, button, label')) return; 
    isDraggingRDM = true; dragStartXRDM = e.clientX; dragStartYRDM = e.clientY;
    const rect = removeDuplicatesModal.getBoundingClientRect();
    rdmStartLeft = rect.left; rdmStartTop = rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingRDM) return;
    removeDuplicatesModal.style.left = `${rdmStartLeft + (e.clientX - dragStartXRDM)}px`;
    removeDuplicatesModal.style.top = `${rdmStartTop + (e.clientY - dragStartYRDM)}px`;
    removeDuplicatesModal.style.transform = 'none'; // 覆寫 Tailwind 的置中偏移
});
document.addEventListener('mouseup', () => { isDraggingRDM = false; document.body.style.userSelect = ''; });
removeDuplicatesModal.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, select, button, label')) return; 
    const touch = e.touches[0];
    isDraggingRDM = true; dragStartXRDM = touch.clientX; dragStartYRDM = touch.clientY;
    const rect = removeDuplicatesModal.getBoundingClientRect();
    rdmStartLeft = rect.left; rdmStartTop = rect.top;
    if (!e.target.closest('input')) e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    if (!isDraggingRDM) return;
    const touch = e.touches[0];
    removeDuplicatesModal.style.left = `${rdmStartLeft + (touch.clientX - dragStartXRDM)}px`;
    removeDuplicatesModal.style.top = `${rdmStartTop + (touch.clientY - dragStartYRDM)}px`;
    removeDuplicatesModal.style.transform = 'none';
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { isDraggingRDM = false; });

// 輔助函數：在指定欄位右側精準插入一欄
function insertColumnRightOf(colIdx) {
    const theadTr = dataTable.querySelector('thead tr');
    const newTh = document.createElement('th');
    
    // 使用系統標準的表頭樣式，並呼叫 createThColHTML 建立標題結構
    newTh.className = 'sticky-top group';
    newTh.style.width = '150px';
    newTh.style.minWidth = '150px';
    newTh.style.maxWidth = '150px';
    newTh.innerHTML = createThColHTML(0); 
    
    if (colIdx + 2 < theadTr.children.length) {
        theadTr.insertBefore(newTh, theadTr.children[colIdx + 2]);
    } else {
        theadTr.appendChild(newTh);
    }
    
    const tbody = dataTable.querySelector('tbody');
    Array.from(tbody.children).forEach(tr => {
        const newTd = document.createElement('td');
        // 使用系統標準的儲存格結構
        const inner = document.createElement('div');
        inner.className = 'td-inner';
        inner.contentEditable = "true";
        newTd.appendChild(inner);
		inner.spellcheck = false;
        
        if (colIdx + 2 < tr.children.length) {
            tr.insertBefore(newTd, tr.children[colIdx + 2]);
        } else {
            tr.appendChild(newTd);
        }
    });
    
    // 強制重繪標題陣列與記憶設定
    if (typeof updateTableHeaders === 'function') updateTableHeaders();
    if (typeof saveColNames === 'function') saveColNames();
    if (typeof saveColWidths === 'function') saveColWidths();
}

// 取得移除重複的作用範圍 (找不到回傳 null)
function getRdmRange() {
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
    } else {
        return null;
    }
    return { minR, maxR, minC, maxC };
}

// 重新產生「要累加的欄」勾選清單 (預設勾選範圍最右欄)
function refreshRdSumColsList() {
    const list = document.getElementById('rdSumColsList');
    const range = getRdmRange();
    list.innerHTML = '';
    if (!range) {
        list.textContent = '請先選取範圍';
        return;
    }
    for (let c = range.minC; c <= range.maxC; c++) {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-1 cursor-pointer';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'rd-sum-col accent-purple-600 w-4 h-4';
        cb.value = String(c);
        cb.checked = (c === range.maxC && range.maxC > range.minC);
        const span = document.createElement('span');
        span.textContent = colNumToStr(c) + ' 欄';
        label.appendChild(cb);
        label.appendChild(span);
        list.appendChild(label);
    }
}

document.getElementById('chkRdSum').addEventListener('change', (e) => {
    const wrap = document.getElementById('rdSumColsWrap');
    if (e.target.checked) {
        refreshRdSumColsList();
        wrap.classList.remove('hidden');
        wrap.classList.add('flex');
    } else {
        wrap.classList.add('hidden');
        wrap.classList.remove('flex');
    }
});

// 每次開啟視窗時，若累加功能已啟用，依目前選取範圍重建清單
document.getElementById('btnOpenRemoveDuplicates').addEventListener('click', () => {
    if (document.getElementById('chkRdSum').checked) refreshRdSumColsList();
});

// 核心邏輯：執行移除重複
document.getElementById('btnApplyRemoveDuplicates').addEventListener('click', () => {
    if (currentMode !== 'table') return showToast('⚠️ 僅能在表格模式使用');
    
    // 1. 確認並鎖定選取範圍
    const rdRange = getRdmRange();
    if (!rdRange) return showToast('⚠️ 請先選取要處理的範圍');
    const { minR, maxR, minC, maxC } = rdRange;

    const layout = document.querySelector('input[name="rdLayout"]:checked').value;
    const addCountCol = document.getElementById('chkRdCount').checked;
    const tbodyRows = dataTable.querySelectorAll('tbody tr');
    const DELIMITER = '||_RDM_||';

    // 累加設定：被勾選的欄不參與重複判斷，重複列的數值累加到第一筆
    const sumCols = new Set();
    if (document.getElementById('chkRdSum').checked) {
        document.querySelectorAll('#rdSumColsList .rd-sum-col:checked').forEach(cb => {
            const c = parseInt(cb.value, 10);
            if (c >= minC && c <= maxC) sumCols.add(c);
        });
        if (sumCols.size === 0) return showToast('⚠️ 請至少勾選一個要累加的欄');
        if (sumCols.size === (maxC - minC + 1)) return showToast('⚠️ 至少要保留一欄作為重複判斷依據');
    }
    const useSum = sumCols.size > 0;
    const toNum = (txt) => {
        const n = parseFloat(String(txt == null ? '' : txt).replace(/,/g, '').trim());
        return isNaN(n) ? 0 : n;
    };
    const fmtNum = (n) => String(Math.round(n * 1e10) / 1e10);
    const sums = new Map();     // key -> { 欄索引: 累計值 }

    // 2. 第一階段掃描：讀取資料並建立唯一金鑰字典
    const seen = new Map();     
    const counts = new Map();   
    const uniqueData = [];      

    const readCell = (r, c) => {
        const inner = tbodyRows[r]?.children[c + 1]?.querySelector('.td-inner');
        return inner ? { formula: inner.getAttribute('data-formula'), text: inner.innerText } : { formula: null, text: '' };
    };

    // 產生重複判斷金鑰 (排除累加欄)；同時回傳是否為全空列
    const buildKey = (r) => {
        const keyParts = [];
        const allParts = [];
        for (let c = minC; c <= maxC; c++) {
            const cd = readCell(r, c);
            const v = cd.formula || cd.text;
            allParts.push(v);
            if (!sumCols.has(c)) keyParts.push(v);
        }
        return {
            key: keyParts.join(DELIMITER),
            isEmptyRow: allParts.every(p => !p || String(p).trim() === '')
        };
    };

    for (let r = minR; r <= maxR; r++) {
        const { key, isEmptyRow } = buildKey(r);
        // 整行皆空白就直接忽略
        if (isEmptyRow) continue; 

        if (useSum) {
            if (!sums.has(key)) sums.set(key, {});
            const acc = sums.get(key);
            sumCols.forEach(c => { acc[c] = (acc[c] || 0) + toNum(readCell(r, c).text); });
        }

        if (!seen.has(key)) {
            const rowData = [];
            for (let c = minC; c <= maxC; c++) rowData.push(readCell(r, c));
            seen.set(key, r);
            counts.set(key, 1);
            uniqueData.push({ key, data: rowData }); 
        } else {
            counts.set(key, counts.get(key) + 1);
        }
    }

    // 把累加結果套回「唯一列」資料
    if (useSum) {
        uniqueData.forEach(ud => {
            sumCols.forEach(c => {
                ud.data[c - minC] = { formula: null, text: fmtNum(sums.get(ud.key)[c]) };
            });
        });
    }

    // 沒有任何重複時直接提示，不動資料
    const removedCount = uniqueData.reduce((n, ud) => n + counts.get(ud.key) - 1, 0);
    if (removedCount === 0) {
        return showToast(useSum
            ? '⚠️ 沒有找到重複項目 (未勾選的欄位內容都不同)'
            : '⚠️ 沒有找到重複項目：需「整列內容完全相同」才算重複。若只想依某一欄判斷，請只選取該欄，或勾選「累加數值欄」');
    }

    // 3. 第二階段：視需求新增右欄
    let countColIdx = -1;
    if (addCountCol) {
        insertColumnRightOf(maxC);
        countColIdx = maxC + 1; 
    }

    const updatedRows = dataTable.querySelectorAll('tbody tr');
    
    const writeCell = (r, c, cellData) => {
        const inner = updatedRows[r]?.children[c + 1]?.querySelector('.td-inner');
        if (!inner) return;
        if (cellData && cellData.formula) {
            inner.setAttribute('data-formula', cellData.formula);
            inner.innerText = cellData.formula; 
        } else {
            inner.removeAttribute('data-formula');
            inner.innerText = cellData ? cellData.text : '';
        }
    };

    // 4. 第三階段：覆寫資料
    if (layout === 'inplace') {
        // 【留在原位】
        for (let r = minR; r <= maxR; r++) {
            const { key, isEmptyRow } = buildKey(r);
            if (isEmptyRow) continue; // 遇到空行不處理也不清空

            if (seen.get(key) === r) {
                // 首次出現保留；若有累加則寫入加總值
                if (useSum) {
                    sumCols.forEach(c => writeCell(r, c, { text: fmtNum(sums.get(key)[c]), formula: null }));
                }
                if (addCountCol) {
                    writeCell(r, countColIdx, { text: counts.get(key).toString(), formula: null });
                }
            } else {
                // 重複出現，清空儲存格
                for (let c = minC; c <= maxC; c++) writeCell(r, c, { text: '', formula: null });
            }
        }
    } else {
        // 【往上集中】
        for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) writeCell(r, c, { text: '', formula: null });
        }
        
        let targetR = minR;
        for (const ud of uniqueData) {
            // uniqueData 裡面現在保證沒有全空行了
            for (let i = 0; i < ud.data.length; i++) {
                writeCell(targetR, minC + i, ud.data[i]);
            }
            if (addCountCol) {
                writeCell(targetR, countColIdx, { text: counts.get(ud.key).toString(), formula: null });
            }
            targetR++;
        }
    }

    // 5. 收尾工作
    recalculateAllFormulas(); 
    debouncedSaveHistory();
    removeDuplicatesModal.classList.add('hidden');
    showToast(useSum ? `✅ 已合併 ${removedCount} 筆重複並累加` : `✅ 已移除 ${removedCount} 筆重複`);
});

/* ==========================================
   公式動態參照更新引擎 (攔截欄位移動)
   ========================================== */
function adjustFormulasForColMove(oldIdx, newIdx) {
    if (oldIdx === newIdx) return;

    // 1. 建立欄位索引的新舊對照表 (Mapping)
    const colMap = {};
    for (let i = 0; i < 1000; i++) colMap[i] = i; // 初始化 1000 欄

    if (oldIdx < newIdx) {
        // 往右移：中間的欄位會全部往左遞補 (-1)
        for (let i = oldIdx + 1; i <= newIdx; i++) colMap[i] = i - 1;
        colMap[oldIdx] = newIdx;
    } else {
        // 往左移：中間的欄位會全部往右推 (+1)
        for (let i = newIdx; i < oldIdx; i++) colMap[i] = i + 1;
        colMap[oldIdx] = newIdx;
    }

    // 2. 定義安全的正則表達式：
    // 群組1: (["'].*?["']) -> 抓取引號內的字串 (保護不替換)
    // 群組2,3: ([a-zA-Z]+)(\d+)\b -> 抓取單格座標如 A1, B2
    // 群組4,5: ([a-zA-Z]+):([a-zA-Z]+)\b -> 抓取整欄座標如 A:B
    const regex = /(["'].*?["'])|([a-zA-Z]+)(\d+)\b(?!\()|([a-zA-Z]+):([a-zA-Z]+)\b/g;

    const cells = dataTable.querySelectorAll('.td-inner');
    
    // 3. 掃描全表更新公式
    cells.forEach(cell => {
        const formula = cell.getAttribute('data-formula');
        if (formula) {
            const newFormula = formula.replace(regex, (match, str, col, row, col1, col2) => {
                if (str) return str; // 若是純字串，原封不動退回
                
                // 處理 A1, B5 這種單格座標
                if (col && row) {
                    let oldColIdx = colStrToNum(col.toUpperCase());
                    let newColIdx = colMap[oldColIdx] !== undefined ? colMap[oldColIdx] : oldColIdx;
                    return colNumToStr(newColIdx) + row;
                }
                
                // 處理 A:B 這種整欄座標
                if (col1 && col2) {
                    let oldColIdx1 = colStrToNum(col1.toUpperCase());
                    let newColIdx1 = colMap[oldColIdx1] !== undefined ? colMap[oldColIdx1] : oldColIdx1;
                    let oldColIdx2 = colStrToNum(col2.toUpperCase());
                    let newColIdx2 = colMap[oldColIdx2] !== undefined ? colMap[oldColIdx2] : oldColIdx2;
                    return colNumToStr(newColIdx1) + ':' + colNumToStr(newColIdx2);
                }
                
                return match;
            });

            // 寫入更新後的公式
            cell.setAttribute('data-formula', newFormula);
            cell.innerText = newFormula;
        }
    });

    // 4. 更新完畢後，觸發全表重算讓新結果顯示
    recalculateAllFormulas();
}



/* ==========================================
   神奇多功能工具：自動分割 模組
   ========================================== */
const autoSplitModal = document.getElementById('autoSplitModal');

// 1. 開啟與關閉對話框
document.getElementById('btnOpenAutoSplit').addEventListener('click', (e) => {
    e.stopPropagation();
    autoSplitModal.classList.remove('hidden');
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    centerModal(autoSplitModal); // 呼叫你寫好的置中函數
});
document.getElementById('btnCloseAutoSplit').addEventListener('click', () => {
    autoSplitModal.classList.add('hidden');
});

// 2. 視窗全區拖曳 (桌機 + 手機)
let isDraggingASM = false, dragStartXASM = 0, dragStartYASM = 0, asmStartLeft = 0, asmStartTop = 0;
autoSplitModal.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, button, label')) return; 
    isDraggingASM = true; dragStartXASM = e.clientX; dragStartYASM = e.clientY;
    const rect = autoSplitModal.getBoundingClientRect();
    asmStartLeft = rect.left; asmStartTop = rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingASM) return;
    autoSplitModal.style.left = `${asmStartLeft + (e.clientX - dragStartXASM)}px`;
    autoSplitModal.style.top = `${asmStartTop + (e.clientY - dragStartYASM)}px`;
    autoSplitModal.style.transform = 'none';
});
document.addEventListener('mouseup', () => { isDraggingASM = false; document.body.style.userSelect = ''; });
autoSplitModal.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, button, label')) return; 
    const touch = e.touches[0];
    isDraggingASM = true; dragStartXASM = touch.clientX; dragStartYASM = touch.clientY;
    const rect = autoSplitModal.getBoundingClientRect();
    asmStartLeft = rect.left; asmStartTop = rect.top;
    if (!e.target.closest('input')) e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    if (!isDraggingASM) return;
    const touch = e.touches[0];
    autoSplitModal.style.left = `${asmStartLeft + (touch.clientX - dragStartXASM)}px`;
    autoSplitModal.style.top = `${asmStartTop + (touch.clientY - dragStartYASM)}px`;
    autoSplitModal.style.transform = 'none';
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { isDraggingASM = false; });

// 3. 核心邏輯：執行分割
document.getElementById('btnApplyAutoSplit').addEventListener('click', () => {
    if (currentMode !== 'table') return showToast('⚠️ 僅能在表格模式使用');
    
    // 找出選取範圍
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
    } else {
        return showToast('⚠️ 請先選取要處理的範圍');
    }

    const delimiter = document.getElementById('autoSplitDelimiter').value;
    const mergeDelimiters = document.getElementById('chkMergeDelimiters').checked;
    // ======== 新增：讀取保留字元設定 ========
    const keepDelimiter = document.getElementById('chkKeepDelimiter').checked; 
    const tbodyRows = dataTable.querySelectorAll('tbody tr');

    const splitData = []; 
    let maxSplitLength = 1;

    // 第一階段：讀取並精準切割資料
    for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
            const inner = tbodyRows[r]?.children[c + 1]?.querySelector('.td-inner');
            if (!inner) continue;
            
            const text = inner.hasAttribute('data-formula') ? inner.getAttribute('data-formula') : inner.innerText;
            if (!text) continue;

            let parts = [];
            if (delimiter === '') {
                // 【無分隔符號】：逐字元切割
                parts = [...text];
                if (mergeDelimiters) {
                    parts = parts.filter((char, index, arr) => index === 0 || char !== arr[index - 1]);
                }
            } else {
                // 【有分隔符號】
                const safeDelim = delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                
                if (keepDelimiter) {
                    // 使用捕捉群組切割，把分隔符號留在陣列中
                    const regex = new RegExp('(' + safeDelim + (mergeDelimiters ? '+' : '') + ')', 'gu');
                    const rawParts = text.split(regex);
                    
                    // ======== 魔法在這裡：將分隔符號當作「前綴」與後段文字合併 ========
                    // 例如 ["A", ",", "B", ",", "C"] 會變成 ["A", ",B", ",C"]
                    parts.push(rawParts[0]); // 先推入第一段文字
                    
                    for (let i = 1; i < rawParts.length; i += 2) {
                        const delim = rawParts[i];
                        const nextText = rawParts[i + 1] || '';
                        parts.push(delim + nextText);
                    }
                    // =================================================================
                } else {
                    // 一般切割 (不保留分隔符號)
                    if (mergeDelimiters) {
                        const regex = new RegExp(safeDelim + '+', 'gu'); 
                        parts = text.split(regex);
                    } else {
                        parts = text.split(delimiter);
                    }
                }
            }

            if (parts.length > 0) {
                splitData.push({ r, c, parts });
                if (parts.length > maxSplitLength) maxSplitLength = parts.length;
            }
        }
    }

    // 第二階段：檢查是否需要擴充表格欄位
    const theadTr = dataTable.querySelector('thead tr');
    const currentCols = theadTr.children.length - 1;
    const requiredCols = maxC + maxSplitLength; 
    
    if (requiredCols > currentCols) {
        insertColAt(currentCols, -1, requiredCols - currentCols);
    }

    // 第三階段：覆寫資料到畫面上
    const updatedRows = dataTable.querySelectorAll('tbody tr');
    splitData.forEach(item => {
        for (let i = 0; i < item.parts.length; i++) {
            const targetInner = updatedRows[item.r]?.children[item.c + i + 1]?.querySelector('.td-inner');
            if (targetInner) {
                targetInner.removeAttribute('data-formula'); 
                targetInner.innerText = item.parts[i];
            }
        }
    });

    recalculateAllFormulas();
    debouncedSaveHistory();
    autoSplitModal.classList.add('hidden');
    showToast('✅ 自動分割完成！');
});



/* ==========================================
   神奇多功能工具：自動合併 模組
   ========================================== */
const autoMergeModal = document.getElementById('autoMergeModal');

// 1. 開啟與關閉對話框
document.getElementById('btnOpenAutoMerge').addEventListener('click', (e) => {
    e.stopPropagation();
    autoMergeModal.classList.remove('hidden');
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    centerModal(autoMergeModal); // 呼叫置中函數
    document.getElementById('autoMergeDelimiter').focus();
});
document.getElementById('btnCloseAutoMerge').addEventListener('click', () => {
    autoMergeModal.classList.add('hidden');
});

// 2. 視窗全區拖曳
let isDraggingAMM = false, dragStartXAMM = 0, dragStartYAMM = 0, ammStartLeft = 0, ammStartTop = 0;
autoMergeModal.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, button, label')) return; 
    isDraggingAMM = true; dragStartXAMM = e.clientX; dragStartYAMM = e.clientY;
    const rect = autoMergeModal.getBoundingClientRect();
    ammStartLeft = rect.left; ammStartTop = rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingAMM) return;
    autoMergeModal.style.left = `${ammStartLeft + (e.clientX - dragStartXAMM)}px`;
    autoMergeModal.style.top = `${ammStartTop + (e.clientY - dragStartYAMM)}px`;
    autoMergeModal.style.transform = 'none';
});
document.addEventListener('mouseup', () => { isDraggingAMM = false; document.body.style.userSelect = ''; });
autoMergeModal.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, button, label')) return; 
    const touch = e.touches[0];
    isDraggingAMM = true; dragStartXAMM = touch.clientX; dragStartYAMM = touch.clientY;
    const rect = autoMergeModal.getBoundingClientRect();
    ammStartLeft = rect.left; ammStartTop = rect.top;
    if (!e.target.closest('input')) e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    if (!isDraggingAMM) return;
    const touch = e.touches[0];
    autoMergeModal.style.left = `${ammStartLeft + (touch.clientX - dragStartXAMM)}px`;
    autoMergeModal.style.top = `${ammStartTop + (touch.clientY - dragStartYAMM)}px`;
    autoMergeModal.style.transform = 'none';
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { isDraggingAMM = false; });

// 3. 核心邏輯：執行合併
document.getElementById('btnApplyAutoMerge').addEventListener('click', () => {
    if (currentMode !== 'table') return showToast('⚠️ 僅能在表格模式使用');
    
    // 找出選取範圍的邊界 (Bounding Box)
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

    if (minR === Infinity || (minR === maxR && minC === maxC)) {
        return showToast('⚠️ 請先選取大於一格的範圍來進行合併');
    }

    const delimiter = document.getElementById('autoMergeDelimiter').value;
    const direction = document.querySelector('input[name="mergeDirection"]:checked').value;
    const tbodyRows = dataTable.querySelectorAll('tbody tr');

    // 橫向合併 (左或右)
    if (direction === 'left' || direction === 'right') {
        for (let r = minR; r <= maxR; r++) {
            let parts = [];
            let cellsToClear = [];
            for (let c = minC; c <= maxC; c++) {
                const inner = tbodyRows[r]?.children[c + 1]?.querySelector('.td-inner');
                if (inner) {
                    let txt = inner.hasAttribute('data-formula') ? inner.getAttribute('data-formula') : inner.innerText;
                    if (txt !== null && txt !== undefined && txt.trim() !== '') {
                        parts.push(txt);
                    }
                    cellsToClear.push(inner);
                }
            }
            if (parts.length > 0) {
                let mergedText = parts.join(delimiter);
                cellsToClear.forEach(inner => { inner.removeAttribute('data-formula'); inner.innerText = ''; });
                
                let targetCell = direction === 'left' ? cellsToClear[0] : cellsToClear[cellsToClear.length - 1];
                targetCell.innerText = mergedText;
                if (mergedText.startsWith('=')) targetCell.setAttribute('data-formula', mergedText);
            }
        }
    } 
    // 直向合併 (上或下)
    else if (direction === 'up' || direction === 'down') {
        for (let c = minC; c <= maxC; c++) {
            let parts = [];
            let cellsToClear = [];
            for (let r = minR; r <= maxR; r++) {
                const inner = tbodyRows[r]?.children[c + 1]?.querySelector('.td-inner');
                if (inner) {
                    let txt = inner.hasAttribute('data-formula') ? inner.getAttribute('data-formula') : inner.innerText;
                    if (txt !== null && txt !== undefined && txt.trim() !== '') {
                        parts.push(txt);
                    }
                    cellsToClear.push(inner);
                }
            }
            if (parts.length > 0) {
                let mergedText = parts.join(delimiter);
                cellsToClear.forEach(inner => { inner.removeAttribute('data-formula'); inner.innerText = ''; });
                
                let targetCell = direction === 'up' ? cellsToClear[0] : cellsToClear[cellsToClear.length - 1];
                targetCell.innerText = mergedText;
                if (mergedText.startsWith('=')) targetCell.setAttribute('data-formula', mergedText);
            }
        }
    }
    recalculateAllFormulas();
    debouncedSaveHistory();
    autoMergeModal.classList.add('hidden');
    showToast('✅ 自動合併完成！');
});



/* ==========================================
   神奇多功能工具：選項處理 模組
   功能1：依「答案」數字，在選取範圍右側新增「正確選項」欄
   功能2：選項亂數 (A: 固定答案位置 / B: 答案位置也隨機)
   功能3：依答案文字 (或字母)，在選取範圍右側新增「答案數字」欄  ✨ 新增
   ========================================== */
const autoOptionModal = document.getElementById('autoOptionModal');

// 1. 開啟與關閉對話框
document.getElementById('btnOpenAutoOption').addEventListener('click', (e) => {
    e.stopPropagation();
    autoOptionModal.classList.remove('hidden');
    document.querySelectorAll('.dropdown-menu, .action-menu').forEach(m => m.classList.remove('show'));
    optRefresh();   // ✨ 新增：讀取選取範圍、自動辨識並建立「題目／答案／選項」下拉選單
    centerModal(autoOptionModal);
    updateAutoOptionUI();
});
document.getElementById('btnCloseAutoOption').addEventListener('click', () => {
    autoOptionModal.classList.add('hidden');
});

// 切換功能時，顯示／隱藏「亂數」專屬設定
function updateAutoOptionUI() {
    const fn = optFn();   // ✏️ 修改：改用 optFn() 取得目前功能
    document.getElementById('optionShuffleSettings').classList.toggle('hidden', fn !== 'shuffle');
    document.getElementById('optionDistractSettings').classList.toggle('hidden', fn !== 'distract');   // ✨ 新增
    optUpdateNumColVisibility();   // ✨ 新增：B 模式才顯示「答案數字欄」下拉

    // ✨ 新增：功能4 只需「題目＋答案」兩欄 (2 欄即可)，其他功能需 3 欄以上。
    //        若目前範圍的欄數不符合新功能，或欄位對應區是隱藏的，就重新讀取；否則保留使用者已改好的對應
    if (optCtx) {
        const need = fn === 'distract' ? 2 : 3;
        const boxHidden = document.getElementById('optMappingBox').classList.contains('hidden');
        if (optCtx.width < need || boxHidden) optRefresh();
        else { optApplyFnVisibility(); optOnChanged(); }
    }
}
// ✨ 新增：目前選擇的功能
function optFn() {
    return document.querySelector('input[name="optionFn"]:checked').value;
}
// ✨ 新增：功能4 不需要「答案格式」與「選項N」，把它們藏起來
function optApplyFnVisibility() {
    const hide = optFn() === 'distract';
    document.getElementById('optFmtRow').classList.toggle('hidden', hide);     // ✏️ 修改：版面調整後改用 optFmtRow／optOptsBlock
    document.getElementById('optOptsBlock').classList.toggle('hidden', hide);
}
document.querySelectorAll('input[name="optionFn"]').forEach(r => r.addEventListener('change', updateAutoOptionUI));

// 2. 視窗全區拖曳
let isDraggingAOP = false, dragStartXAOP = 0, dragStartYAOP = 0, aopStartLeft = 0, aopStartTop = 0;
autoOptionModal.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, button, label, select')) return;
    isDraggingAOP = true; dragStartXAOP = e.clientX; dragStartYAOP = e.clientY;
    const rect = autoOptionModal.getBoundingClientRect();
    aopStartLeft = rect.left; aopStartTop = rect.top;
    document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
    if (!isDraggingAOP) return;
    autoOptionModal.style.left = `${aopStartLeft + (e.clientX - dragStartXAOP)}px`;
    autoOptionModal.style.top = `${aopStartTop + (e.clientY - dragStartYAOP)}px`;
    autoOptionModal.style.transform = 'none';
});
document.addEventListener('mouseup', () => { isDraggingAOP = false; document.body.style.userSelect = ''; });
autoOptionModal.addEventListener('touchstart', (e) => {
    if (e.target.closest('input, button, label, select')) return;
    const touch = e.touches[0];
    isDraggingAOP = true; dragStartXAOP = touch.clientX; dragStartYAOP = touch.clientY;
    const rect = autoOptionModal.getBoundingClientRect();
    aopStartLeft = rect.left; aopStartTop = rect.top;
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchmove', (e) => {
    if (!isDraggingAOP) return;
    const touch = e.touches[0];
    autoOptionModal.style.left = `${aopStartLeft + (touch.clientX - dragStartXAOP)}px`;
    autoOptionModal.style.top = `${aopStartTop + (touch.clientY - dragStartYAOP)}px`;
    autoOptionModal.style.transform = 'none';
    e.preventDefault();
}, { passive: false });
document.addEventListener('touchend', () => { isDraggingAOP = false; });

// 3. 工具函式
// 3-1 取得選取範圍的邊界 (與自動合併相同邏輯)
function getOptionToolBounds() {
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
    } else {
        return null;
    }
    return { minR, maxR, minC, maxC };
}

// 3-2 讀寫儲存格
function optGetText(trs, r, c) {
    const inner = trs[r]?.children[c + 1]?.querySelector('.td-inner');
    return inner ? inner.innerText.replace(/\u00a0/g, ' ').trim() : '';
}
function optSetText(trs, r, c, text) {
    const inner = trs[r]?.children[c + 1]?.querySelector('.td-inner');
    if (!inner) return;
    inner.removeAttribute('data-formula');
    inner.innerText = text;
}

// 3-3 解析答案：1,2,3… / A,B,C… / 直接寫選項文字 (與學習模式規則一致)
// ✏️ 修改：新增第三個參數 fmt ('auto' 自動 / 'num' 數字 / 'letter' 字母 / 'text' 選項文字)
function optParseAnswer(raw, optTexts, fmt = 'auto') {
    raw = (raw || '').trim();
    if (!raw) return null;
    if ((fmt === 'auto' || fmt === 'num') && /^\d+$/.test(raw)) {
        const idx = parseInt(raw, 10) - 1;
        if (idx >= 0 && idx < optTexts.length) return { idx, style: 'num' };
        if (fmt === 'num') return null;
    }
    if ((fmt === 'auto' || fmt === 'letter') && /^[A-Za-z]$/.test(raw)) {
        const idx = raw.toUpperCase().charCodeAt(0) - 65;
        if (idx < optTexts.length) return { idx, style: raw === raw.toUpperCase() ? 'upper' : 'lower' };
        if (fmt === 'letter') return null;
    }
    if (fmt === 'num' || fmt === 'letter') return null;
    const idx = optTexts.indexOf(raw); // 答案欄直接寫選項文字
    return idx >= 0 ? { idx, style: 'text' } : null;
}

// 3-4 辨識「題目 / 選項 / 答案」欄位 (優先沿用學習模式的 analyzeTableHeaders；辨識不到再用位置推測)
function detectOptionLayout(rows) {
    if (rows.length === 0) return null;
    const width = rows[0].length;

    // (a) 有標題列：用學習模式的智慧比對
    if (typeof window.analyzeTableHeaders === 'function') {
        const info = window.analyzeTableHeaders(rows.map(r => r.join('\t')).join('\n'));
        if (info && info.hasHeader && typeof info.mcConfig.ansCol === 'string' && info.mcConfig.ansCol.startsWith('col_')) {
            const ansCol = parseInt(info.mcConfig.ansCol.split('_')[1], 10);
            const optCols = (info.optCols || []).filter(i => i !== ansCol && i !== info.mcConfig.qCol && i < width).sort((a, b) => a - b);
            if (optCols.length >= 2) {
                return { hasHeader: true, qCol: info.mcConfig.qCol, optCols, ansCol, dataStart: 1 };
            }
        }
    }

    // (b) 位置推測：第一欄=題目、最後一欄=答案(數字或字母)、中間=選項
    if (width >= 3) {   // ✏️ 修改：原本 width >= 4
        const ansCol = width - 1;
        const optCols = Array.from({ length: width - 2 }, (_, i) => i + 1);
        const isAnsToken = v => /^\d+$/.test(v) || /^[A-Za-z]$/.test(v);
        const firstIsAns = isAnsToken(rows[0][ansCol]);
        return { hasHeader: !firstIsAns, qCol: 0, optCols, ansCol, dataStart: firstIsAns ? 0 : 1 };
    }
    return null;
}

// 3-5 亂數工具
function optShuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function optIsNum(v) { return /^-?\d+(\.\d+)?$/.test(v.replace(/,/g, '')); }
function optCharLen(v) { return [...v].length; }

// 錯誤選項排列：useRule=true → 先亂數(同字數者隨機)，再依字數多→少；若全是數字則小→大
function optOrderWrongs(wrongs, allItems, useRule) {
    let list = optShuffle(wrongs);
    if (!useRule) return list;
    if (allItems.every(optIsNum)) {
        list.sort((a, b) => parseFloat(a.replace(/,/g, '')) - parseFloat(b.replace(/,/g, '')));
    } else {
        list.sort((a, b) => optCharLen(b) - optCharLen(a));
    }
    return list;
}

// 3-6 ✨ 新增：欄位對應設定 (題目／答案／選項 下拉選單，可確認或修改自動辨識結果)
let optCtx = null;                                            // 目前選取範圍 { bounds, width }
const optState = { q: -1, ans: -1, opts: [], fmt: 'auto' };   // 欄位對應 (皆為「相對於選取範圍」的欄位索引)
let optOptSels = [];                                          // 動態產生的「選項N」下拉選單
const OPT_SEL_CLASS = 'flex-1 min-w-0 border border-gray-300 rounded-md px-1.5 py-1 text-xs bg-white outline-none focus:border-pink-400 cursor-pointer';

// 讀取選取範圍內的非空白列
function optReadRows(bounds) {
    const trs = dataTable.querySelectorAll('tbody tr');
    const rowsInfo = [];
    for (let r = bounds.minR; r <= bounds.maxR; r++) {
        const cells = [];
        for (let c = bounds.minC; c <= bounds.maxC; c++) cells.push(optGetText(trs, r, c));
        if (cells.some(v => v !== '')) rowsInfo.push({ r, cells });
    }
    return rowsInfo;
}

// 下拉選單顯示文字：「A：標題文字」；沒有標題就顯示「A 欄」
function optColLabels(rowsInfo) {
    const hasHeader = document.getElementById('optHasHeader').checked;
    return Array.from({ length: optCtx.width }, (_, i) => {
        const abs = optCtx.bounds.minC + i;
        let name = (hasHeader && rowsInfo[0]) ? rowsInfo[0].cells[i] : '';
        if (!name) {
            const th = dataTable.querySelector(`thead th[data-col="${abs}"]`);
            name = (th && th.dataset.colName) || '';
        }
        const chars = [...name];
        if (chars.length > 8) name = chars.slice(0, 8).join('') + '…';
        return name ? `${getColLabel(abs)}：${name}` : `${getColLabel(abs)} 欄`;
    });
}

function optFillSelect(sel, value, labels, withNone) {
    sel.innerHTML = '';
    if (withNone) sel.add(new Option('(不指定)', '-1'));
    labels.forEach((t, i) => sel.add(new Option(t, String(i))));
    sel.value = String(value);
}

// 重新讀取選取範圍並自動辨識欄位
function optRefresh() {
    const rangeText = document.getElementById('optRangeText');
    const box = document.getElementById('optMappingBox');
    const applyBtn = document.getElementById('btnApplyAutoOption');
    const setDisabled = (d) => {
        applyBtn.disabled = d;
        applyBtn.classList.toggle('opacity-50', d);
        applyBtn.classList.toggle('cursor-not-allowed', d);
    };

    const bounds = getOptionToolBounds();
    if (!bounds) {
        optCtx = null;
        rangeText.textContent = '⚠️ 尚未選取範圍，請選取「題目～答案」後按「重新讀取」';
        box.classList.add('hidden'); setDisabled(true);
        return;
    }
    const width = bounds.maxC - bounds.minC + 1;
    optCtx = { bounds, width };
    rangeText.textContent = `選取範圍：${getColLabel(bounds.minC)}～${getColLabel(bounds.maxC)} 欄，第 ${bounds.minR + 1}～${bounds.maxR + 1} 列`;
    const minWidth = optFn() === 'distract' ? 2 : 3;   // ✨ 新增：功能4 只需 題目＋答案 兩欄
    if (width < minWidth) {   // ✏️ 修改：原本 width < 3
        rangeText.textContent += optFn() === 'distract' ? '　⚠️ 至少需包含 題目、答案 兩欄' : '　⚠️ 至少需包含 題目、選項、答案 三欄';   // ✏️ 修改：提示依功能而定
        box.classList.add('hidden'); setDisabled(true);
        return;
    }

    // 自動辨識 (標題 → analyzeTableHeaders；否則位置推測)
    const rowsInfo = optReadRows(bounds);
    const layout = rowsInfo.length ? detectOptionLayout(rowsInfo.map(x => x.cells)) : null;
    if (layout) {
        optState.q = layout.qCol;
        optState.ans = layout.ansCol;
        optState.opts = layout.optCols.slice();
        document.getElementById('optHasHeader').checked = layout.hasHeader;
    } else {
        optState.q = 0;
        optState.ans = width - 1;
        optState.opts = Array.from({ length: width - 2 }, (_, i) => i + 1);
        document.getElementById('optHasHeader').checked = true;
    }
    optState.fmt = 'auto';
    box.classList.remove('hidden');
    optApplyFnVisibility();   // ✨ 新增
    optFillNumColSelect();    // ✨ 新增：建立「答案數字欄」下拉並自動偵測
    optRenderMapping();
}

// 依 optState 畫出所有下拉選單
function optRenderMapping() {
    if (!optCtx) return;
    const labels = optColLabels(optReadRows(optCtx.bounds));
    optFillSelect(document.getElementById('optSelQ'), optState.q, labels, true);
    optFillSelect(document.getElementById('optSelAns'), optState.ans, labels, false);
    document.getElementById('optSelFmt').value = optState.fmt;

    const wrap = document.getElementById('optOptsContainer');
    wrap.innerHTML = '';
    optOptSels = [];
    optState.opts.forEach((val, k) => {
        // ✏️ 修改：選項欄改為「標籤在上、下拉在下」，兩欄並排
        const cell = document.createElement('div');
        cell.className = 'flex flex-col gap-1 min-w-0';
        const lab = document.createElement('span');
        lab.className = 'opt-field-label';
        lab.textContent = `選項${k + 1}`;
        const row = document.createElement('div');
        row.className = 'flex items-center gap-1';
        const sel = document.createElement('select');
        sel.className = OPT_SEL_CLASS;
        optFillSelect(sel, val, labels, false);
        sel.addEventListener('change', () => { optState.opts[k] = parseInt(sel.value, 10); optOnChanged(); });
        row.append(sel);
        if (optState.opts.length > 2) {
            const del = document.createElement('button');
            del.type = 'button';
            del.title = '移除此選項欄';
            del.className = 'text-gray-400 hover:text-red-500 cursor-pointer flex-shrink-0 flex items-center';
            del.innerHTML = '<span class="material-symbols-outlined text-base">remove_circle</span>';
            del.addEventListener('click', () => { optState.opts.splice(k, 1); optRenderMapping(); });
            row.appendChild(del);
        }
        cell.append(lab, row);
        wrap.appendChild(cell);
        optOptSels.push(sel);
    });
    optOnChanged();
}

function optOnChanged() {
    if (!optCtx) return;
    optValidate();
    optUpdatePreview();
}

// 防呆：同一欄不能重複當作多個角色；至少 2 個選項欄
function optValidate() {
    const applyBtn = document.getElementById('btnApplyAutoOption');
    const warn = document.getElementById('optWarn');
    const items = [];
    if (optState.q >= 0) items.push({ el: document.getElementById('optSelQ'), col: optState.q });
    items.push({ el: document.getElementById('optSelAns'), col: optState.ans });
    const needOpts = optFn() !== 'distract';   // ✨ 新增：功能4 不檢查選項欄
    if (needOpts) optState.opts.forEach((c, k) => items.push({ el: optOptSels[k], col: c }));   // ✏️ 修改：加上 needOpts 判斷

    const count = {};
    items.forEach(it => { count[it.col] = (count[it.col] || 0) + 1; });
    let dup = false;
    items.forEach(it => {
        const bad = count[it.col] > 1;
        if (bad) dup = true;
        it.el.style.borderColor = bad ? '#f87171' : '';
        it.el.style.backgroundColor = bad ? '#fef2f2' : '';
    });

    let msg = '';
    if (dup) msg = '⚠️ 同一欄不能同時當作多個角色 (紅框處請修改)';
    else if (needOpts && optState.opts.length < 2) msg = '⚠️ 至少需要 2 個選項欄';   // ✏️ 修改：加上 needOpts 判斷
    warn.textContent = msg;
    warn.classList.toggle('hidden', !msg);

    const ok = !msg;
    applyBtn.disabled = !ok;
    applyBtn.classList.toggle('opacity-50', !ok);
    applyBtn.classList.toggle('cursor-not-allowed', !ok);
    return ok;
}

// 預覽：第一題的辨識結果，與可處理／會略過的題數
function optUpdatePreview() {
    const el = document.getElementById('optPreview');
    const hasHeader = document.getElementById('optHasHeader').checked;
    const dataRows = optReadRows(optCtx.bounds).slice(hasHeader ? 1 : 0);
    if (dataRows.length === 0) { el.textContent = '預覽：尚無題目資料列'; return; }

    // ✨ 新增：功能4 的預覽 (不需解析選項)
    if (optFn() === 'distract') {
        const n = optGetDistractCount();
        const uniq = new Set(dataRows.map(r => optNormKey(r.cells[optState.ans])).filter(k => k !== ''));
        const withAns = dataRows.filter(r => r.cells[optState.ans] !== '');
        const short = uniq.size - 1 < n ? withAns.length : 0;   // 不重複答案數 ≤ 要產生的數量 → 每題都湊不滿
        const f = dataRows[0];
        el.textContent = `預覽 第1題：「${optState.q >= 0 ? f.cells[optState.q] : ''}」正確答案「${f.cells[optState.ans]}」\n共 ${withAns.length} 題，不重複答案 ${uniq.size} 種，每題產生 ${n} 個錯誤選項` +
            (short ? `\n⚠️ 可用的其他答案只有 ${Math.max(uniq.size - 1, 0)} 種，湊不滿 ${n} 個 (不足處留空)` : '');
        return;
    }

    let ok = 0, bad = 0;
    dataRows.forEach(row => {
        const optTexts = optState.opts.map(i => row.cells[i]);
        const a = optParseAnswer(row.cells[optState.ans], optTexts, optState.fmt);
        (a && optTexts[a.idx] !== '') ? ok++ : bad++;
    });

    const first = dataRows[0];
    const optTexts = optState.opts.map(i => first.cells[i]);
    const a = optParseAnswer(first.cells[optState.ans], optTexts, optState.fmt);
    const raw = first.cells[optState.ans];
    const firstText = (a && optTexts[a.idx] !== '') ? `→ 選項${a.idx + 1}「${optTexts[a.idx]}」` : '→ ⚠️ 對不到選項';
    el.textContent = `預覽 第1題：答案「${raw}」${firstText}\n共 ${dataRows.length} 題，可處理 ${ok} 題${bad ? `，${bad} 題答案對不到選項 (將略過)` : ''}`;
}

// ✨ 新增：選項亂數 B 模式 —「答案數字」欄同步更新
// 只有 B 模式 (答案位置也亂數) 才顯示此下拉
function optUpdateNumColVisibility() {
    const mode = document.querySelector('input[name="shuffleMode"]:checked').value;
    document.getElementById('optNumColRow').classList.toggle('hidden', mode !== 'B');
}
document.querySelectorAll('input[name="shuffleMode"]').forEach(r => r.addEventListener('change', optUpdateNumColVisibility));

// 建立下拉 (列出整張表所有欄，因為「答案數字」欄可能在選取範圍外)，並自動選標題為「答案數字」的欄
function optFillNumColSelect() {
    const sel = document.getElementById('optSelNumCol');
    if (!sel || !optCtx) return;
    const total = dataTable.querySelector('thead tr').children.length - 1;
    const trs = dataTable.querySelectorAll('tbody tr');
    sel.innerHTML = '';
    sel.add(new Option('(不指定)', '-1'));
    let auto = -1;
    for (let c = 0; c < total; c++) {
        const th = dataTable.querySelector(`thead th[data-col="${c}"]`);
        const hdr = (th && th.dataset.colName) || '';
        const first = optGetText(trs, optCtx.bounds.minR, c);   // 選取範圍第一列 (標題列)
        const name = hdr || first;
        if (auto === -1 && (hdr === '答案數字' || first === '答案數字')) auto = c;
        const chars = [...name];
        const short = chars.length > 8 ? chars.slice(0, 8).join('') + '…' : name;
        sel.add(new Option(short ? `${getColLabel(c)}：${short}` : `${getColLabel(c)} 欄`, String(c)));
    }
    sel.value = String(auto);   // 找不到就是 -1 (不指定)
}

// ✨ 新增：功能4 用的小工具
function optNormKey(v) { return (v || '').trim().toLowerCase(); }   // 比對用：去頭尾空白、不分大小寫
function optGetDistractCount() {
    const n = parseInt(document.getElementById('optDistractCount').value, 10);
    return Math.max(1, Math.min(9, isNaN(n) ? 3 : n));
}
document.getElementById('optDistractCount').addEventListener('input', () => { if (optCtx) optOnChanged(); });

// 綁定下拉選單事件
document.getElementById('btnOptRefresh').addEventListener('click', optRefresh);
document.getElementById('optHasHeader').addEventListener('change', optRenderMapping);
document.getElementById('optSelQ').addEventListener('change', (e) => { optState.q = parseInt(e.target.value, 10); optOnChanged(); });
document.getElementById('optSelAns').addEventListener('change', (e) => { optState.ans = parseInt(e.target.value, 10); optOnChanged(); });
document.getElementById('optSelFmt').addEventListener('change', (e) => { optState.fmt = e.target.value; optOnChanged(); });
document.getElementById('btnOptAddOpt').addEventListener('click', () => {
    if (!optCtx) return;
    const used = new Set([optState.q, optState.ans, ...optState.opts]);
    let pick = -1;
    for (let i = 0; i < optCtx.width; i++) if (!used.has(i)) { pick = i; break; }
    if (pick === -1) return showToast('⚠️ 選取範圍內已沒有可用的欄位，請擴大選取範圍');
    optState.opts.push(pick);
    optRenderMapping();
});

// 4. 核心邏輯：執行
document.getElementById('btnApplyAutoOption').addEventListener('click', () => {
    if (currentMode !== 'table') return showToast('⚠️ 僅能在表格模式使用');

    // ✏️ 修改：不再即時自動辨識，改用視窗中「題目／答案／選項」下拉選單的設定
    if (!optCtx) return showToast('⚠️ 請先選取「題目～答案」的範圍 (例如 A～F 欄)，再按「重新讀取」');
    if (!optValidate()) return showToast('⚠️ 欄位對應有誤，請先修正 (見視窗內紅字)');
    const { minR, maxR, minC, maxC } = optCtx.bounds;

    const trs = dataTable.querySelectorAll('tbody tr');

    // 收集非空白列 (執行當下重新讀取，避免視窗開啟後儲存格又被編輯)
    const rowsInfo = optReadRows(optCtx.bounds);
    if (rowsInfo.length === 0) return showToast('⚠️ 選取範圍內沒有資料');

    const hasHeader = document.getElementById('optHasHeader').checked;
    const layout = { hasHeader, qCol: optState.q, optCols: optState.opts.slice(), ansCol: optState.ans, dataStart: hasHeader ? 1 : 0 };
    const ansFmt = optState.fmt;   // ✨ 新增：答案格式 (自動／數字／字母／選項文字)

    const dataRows = rowsInfo.slice(layout.dataStart);
    if (dataRows.length === 0) return showToast('⚠️ 找不到題目資料列');

    const fn = optFn();   // ✏️ 修改：改用 optFn()
    let done = 0, skipped = 0;

    // ---------- ✨ 新增 功能4：由正確答案產生錯誤選項 ----------
    if (fn === 'distract') {
        const n = optGetDistractCount();

        // 候選池：選取範圍內所有「不重複」的正確答案 (不分大小寫去重，保留原文)
        const pool = [];
        const seen = new Set();
        dataRows.forEach(row => {
            const v = row.cells[layout.ansCol];
            const k = optNormKey(v);
            if (k !== '' && !seen.has(k)) { seen.add(k); pool.push(v); }
        });

        const startCol = maxC + 1;
        insertColAt(startCol, -1, n);   // 一次在選取範圍右側新增 n 欄
        const trsNew = dataTable.querySelectorAll('tbody tr');

        if (layout.dataStart === 1) {
            for (let k = 0; k < n; k++) optSetText(trsNew, rowsInfo[0].r, startCol + k, `錯誤選項${k + 1}`);
        }

        let short = 0;
        dataRows.forEach(row => {
            const correct = row.cells[layout.ansCol];
            const ck = optNormKey(correct);
            if (ck === '') { skipped++; return; }
            // 排除與正確答案相同者，再亂數取 n 個
            const picks = optShuffle(pool.filter(v => optNormKey(v) !== ck)).slice(0, n);
            picks.forEach((v, k) => optSetText(trsNew, row.r, startCol + k, v));
            if (picks.length < n) short++;
            done++;
        });

        recalculateAllFormulas();
        debouncedSaveHistory();
        autoOptionModal.classList.add('hidden');
        return showToast(`✅ 已新增 ${n} 個「錯誤選項」欄：${done} 題${skipped ? `，${skipped} 題答案空白已略過` : ''}${short ? `，${short} 題因其他答案不足而未湊滿` : ''}`);
    }

    // ---------- 功能1：新增「正確選項」欄 ／ 功能3：新增「答案數字」欄 ----------
    // ✏️ 修改：原本只處理 'correct'，現在 'number' 共用同一段流程 (差別只在標題、寫入內容、提示文字)
    if (fn === 'correct' || fn === 'number') {
        const isNumFn = (fn === 'number');   // ✨ 新增
        const newCol = maxC + 1;
        insertColAt(newCol);
        const trsNew = dataTable.querySelectorAll('tbody tr');

        if (layout.dataStart === 1) optSetText(trsNew, rowsInfo[0].r, newCol, isNumFn ? '答案數字' : '正確選項');   // ✏️ 修改：標題依功能而定

        dataRows.forEach(row => {
            const optTexts = layout.optCols.map(i => row.cells[i]);
            const ans = optParseAnswer(row.cells[layout.ansCol], optTexts, ansFmt);   // ✏️ 修改：多帶 ansFmt
            if (!ans || optTexts[ans.idx] === '') { skipped++; return; }
            optSetText(trsNew, row.r, newCol, isNumFn ? String(ans.idx + 1) : optTexts[ans.idx]);   // ✏️ 修改：功能3 寫入選項編號 (1 起算)，功能1 仍寫入選項文字
            done++;
        });

        recalculateAllFormulas();
        debouncedSaveHistory();
        autoOptionModal.classList.add('hidden');
        return showToast(`✅ 已新增「${isNumFn ? '答案數字' : '正確選項'}」欄：${done} 題${skipped ? `，${skipped} 題答案無法對應已略過` : ''}`);   // ✏️ 修改：提示文字依功能而定
    }

    // ---------- 功能2：選項亂數 ----------
    const mode = document.querySelector('input[name="shuffleMode"]:checked').value; // 'A' 固定答案位置 / 'B' 答案也亂數
    const useRule = document.getElementById('optionKeepOrderRule').checked;
    const numCol = (mode === 'B') ? parseInt(document.getElementById('optSelNumCol').value, 10) : -1;   // ✨ 新增：要同步更新的「答案數字」欄 (絕對欄位索引，-1 = 不更新)
    let numSynced = 0;   // ✨ 新增

    dataRows.forEach(row => {
        const optTexts = layout.optCols.map(i => row.cells[i]);
        const ans = optParseAnswer(row.cells[layout.ansCol], optTexts, ansFmt);   // ✏️ 修改：多帶 ansFmt
        if (!ans || optTexts[ans.idx] === '') { skipped++; return; }

        // 有內容的選項位置 (空白選項不參與亂數)
        const positions = [];
        optTexts.forEach((t, i) => { if (t !== '') positions.push(i); });
        if (positions.length < 2) { skipped++; return; }

        const items = positions.map(i => optTexts[i]);
        const p = positions.indexOf(ans.idx);               // 正確答案目前在 positions 的第幾個
        const correct = items[p];
        const wrongs = items.filter((_, i) => i !== p);

        const newP = mode === 'A' ? p : Math.floor(Math.random() * positions.length);
        const orderedWrongs = optOrderWrongs(wrongs, items, useRule);

        const result = new Array(positions.length);
        result[newP] = correct;
        let w = 0;
        for (let k = 0; k < result.length; k++) if (k !== newP) result[k] = orderedWrongs[w++];

        // 寫回選項欄
        positions.forEach((optIdx, k) => optSetText(trs, row.r, minC + layout.optCols[optIdx], result[k]));

        // B 模式：答案位置改變，同步更新答案欄 (保持原本的 數字／字母 格式；答案為文字則不用改)
        if (mode === 'B') {   // ✏️ 修改：拿掉 ans.style !== 'text' 條件，改在內部判斷
            const newIdx = positions[newP];
            if (ans.style !== 'text') {
                let newAns = String(newIdx + 1);
                if (ans.style === 'upper') newAns = String.fromCharCode(65 + newIdx);
                if (ans.style === 'lower') newAns = String.fromCharCode(97 + newIdx);
                optSetText(trs, row.r, minC + layout.ansCol, newAns);
            }
            // ✨ 新增：同步更新獨立的「答案數字」欄 (不管答案欄是文字還是數字，只要有指定就更新)
            if (numCol >= 0 && !(ans.style !== 'text' && numCol === minC + layout.ansCol)) {
                optSetText(trs, row.r, numCol, String(newIdx + 1));
                numSynced++;
            }
        }
        done++;
    });

    recalculateAllFormulas();
    debouncedSaveHistory();
    autoOptionModal.classList.add('hidden');
    showToast(`✅ 選項亂數完成：${done} 題${numSynced ? `，已同步更新答案數字 ${numSynced} 題` : ''}${skipped ? `，${skipped} 題無法辨識已略過` : ''}`);   // ✏️ 修改：加上同步數量
});



/* ==========================================
   滑鼠拖曳與多選儲存格引擎
   ========================================== */
window.isCellDragging = false;
let isMouseDownOnCell = false;

// 1. 按下滑鼠：記錄起點，並執行原有的多選判斷
dataTable.addEventListener('mousedown', (e) => {
    // 排除標題列、選單按鈕、縮放把手等 UI 元素
    if (e.target.closest('th') || e.target.closest('.resize-handle') || e.target.closest('.btn-col-menu') || e.target.closest('.btn-row-menu')) return;

    const td = e.target.closest('td');
    if (td && currentMode === 'table') {
        const inner = td.querySelector('.td-inner');
        if (document.activeElement === inner) return;

        if (currentEditTrigger === 'double' && e.target.closest('.td-inner')) {
            e.preventDefault();
            // 修正：preventDefault 會讓焦點留在原本正在編輯的儲存格(例如 A1)，
            // 導致點選 A2 後立刻打字仍寫進 A1。這裡主動讓原儲存格失焦(同時觸發公式計算與存檔)，
            // 之後打字就會走「選取格 → 直接覆蓋輸入」的流程進入 A2。
            const prevFocused = document.activeElement;
            if (prevFocused && prevFocused !== inner && prevFocused.classList && prevFocused.classList.contains('td-inner')) {
                prevFocused.blur();
            }
        }
        
        if (isSelectionLocked) return;

        const tr = td.closest('tr');
        const rIdx = Array.from(tr.parentNode.children).indexOf(tr);
        const cIdx = Array.from(tr.children).indexOf(td) - 1;

        isMouseDownOnCell = true;
        window.isCellDragging = false; 

        // 完美保留你的多選狀態判斷
        const isCtrl = e.ctrlKey || e.metaKey || isMobileMultiSelect;

        if (e.shiftKey && lastClickedCell) {
            if (selectedCellBlocks.length === 0) {
                selectedCellBlocks.push({ startR: lastClickedCell.r, startC: lastClickedCell.c, endR: rIdx, endC: cIdx });
            } else {
                const lastBlock = selectedCellBlocks[selectedCellBlocks.length - 1];
                lastBlock.endR = rIdx; lastBlock.endC = cIdx;
            }
            if (!isCtrl) {
                selectedCellBlocks = [selectedCellBlocks[selectedCellBlocks.length - 1]];
                selectedRows = []; selectedCols = [];
            }
            applySelectionVisuals(); 
            window.getSelection().removeAllRanges();
        } else if (isCtrl) {
            selectedCellBlocks.push({ startR: rIdx, startC: cIdx, endR: rIdx, endC: cIdx });
            lastClickedCell = { r: rIdx, c: cIdx };
            applySelectionVisuals();
        } else {
            lastClickedCell = { r: rIdx, c: cIdx };
            selectedCellBlocks = [{ startR: rIdx, startC: cIdx, endR: rIdx, endC: cIdx }];
            clearTableSelection(false);
            selectedRows = []; selectedCols = [];
            applySelectionVisuals();
        }
    }
});

// 2. 滑鼠移動：動態更新選取框邊界
dataTable.addEventListener('mouseover', (e) => {
    if (!isMouseDownOnCell || isSelectionLocked) return;

    // ⭐ 核心細節修正：判斷是否正在「選取文字」
    // 如果使用者已經反白了文字，當游標滑到邊界時，直接中斷並關閉「儲存格多選」引擎
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
        isMouseDownOnCell = false; // 徹底解除這回合的儲存格拖曳狀態
        return;
    }

    const td = e.target.closest('td');
    if (td) {
        const tr = td.closest('tr');
        const rIdx = Array.from(tr.parentNode.children).indexOf(tr);
        const cIdx = Array.from(tr.children).indexOf(td) - 1;

        const lastBlock = selectedCellBlocks[selectedCellBlocks.length - 1];
        
        // 只要游標進入了不同的一格，就擴充選取範圍
        if (lastBlock && (lastBlock.endR !== rIdx || lastBlock.endC !== cIdx)) {
            window.isCellDragging = true; // 標記為「拖曳中」
            lastBlock.endR = rIdx;
            lastBlock.endC = cIdx;
            
            applySelectionVisuals();
            window.getSelection().removeAllRanges(); // 防止拖曳時反白到文字
        }
    }
});
// 3. 放開滑鼠：結束拖曳狀態 (綁在 document 上確保滑出表格也能正確解除)
document.addEventListener('mouseup', () => {
    if (isMouseDownOnCell) {
        isMouseDownOnCell = false;
        // 延遲解除拖曳旗標，避免 click 事件誤判
        setTimeout(() => {
            window.isCellDragging = false;
        }, 50);
    }
});



/* ==========================================
   表格模式專屬：自動加總提示視窗模組
========================================== */
const SHOW_AUTO_SUM_KEY = 'wesing-show-auto-sum';
let isShowAutoSum = localStorage.getItem(SHOW_AUTO_SUM_KEY) !== 'false'; // 預設開啟
const AUTO_SUM_EXPANDED_KEY = 'wesing-auto-sum-expanded';
let isAutoSumExpanded = localStorage.getItem(AUTO_SUM_EXPANDED_KEY) === 'true'; // 預設收合
let autoSumHasNumbers = false; // 目前選取範圍是否含數字（決定「⋯」按鈕要不要出現）

// 依展開狀態更新「中位數／最大／最小」與「⋯」按鈕
function applyAutoSumExpanded() {
    const btn = document.getElementById('btnAutoSumMore');
    if (btn) {
        btn.style.display = autoSumHasNumbers ? 'flex' : 'none';
        btn.title = isAutoSumExpanded ? '收合' : '顯示更多';
        btn.classList.toggle('text-green-600', isAutoSumExpanded);
        btn.classList.toggle('text-gray-400', !isAutoSumExpanded);
    }
    ['asMed', 'asMax', 'asMin'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (autoSumHasNumbers && isAutoSumExpanded) ? 'inline-block' : 'none';
    });
}

function applyAutoSumState() {
    const icon = document.getElementById('iconAutoSumCheck');
    if (icon) {
        if (isShowAutoSum) icon.classList.add('active');
        else icon.classList.remove('active');
    }
    const widget = document.getElementById('autoSumWidget');
    if (!isShowAutoSum && widget) {
        widget.classList.add('hidden');
    }
}

function updateAutoSum(selMap) {
    const autoSumWidget = document.getElementById('autoSumWidget');
    if (!autoSumWidget) return;
    
    // 當選取數量少於 2 格，隱藏視窗 (仿效 Excel 原生行為)
    if (!isShowAutoSum || currentMode !== 'table' || !selMap || selMap.size < 2) {
        autoSumWidget.classList.add('hidden');
        return;
    }

    const tbody = dataTable.querySelector('tbody');
    let count = 0;
    let sum = 0;
    let numCount = 0;
    const nums = [];

    // 遍歷當下選取的儲存格坐標
    selMap.forEach(coord => {
        const [rStr, cStr] = coord.split(',');
        const r = parseInt(rStr, 10);
        const c = parseInt(cStr, 10);
        
        const tr = tbody.children[r];
        if (!tr) return;
        const td = tr.children[c + 1];
        if (!td) return;

        const inner = td.querySelector('.td-inner');
        if (!inner) return;

        let val = inner.textContent.trim();
        
        if (val !== '') {
            count++;
            // 清理數值格式 (例如千分位符號 1,000.5)
            let cleanVal = val;
            if (/^-?[\d,]+(\.\d+)?$/.test(val)) {
                cleanVal = val.replace(/,/g, '');
            }
            const num = parseFloat(cleanVal);
            if (!isNaN(num)) {
                sum += num;
                numCount++;
                nums.push(num);
            }
        }
    });

    if (count > 0) {
        document.getElementById('asCount').textContent = `項目: ${count}`;
        if (numCount > 0) {
            // 處理浮點數精度，最多保留四位小數避免 IEEE 754 誤差
            const roundedSum = Math.round(sum * 10000) / 10000;
            const avg = sum / numCount;
            const roundedAvg = Math.round(avg * 10000) / 10000;
            
            document.getElementById('asSum').textContent = `加總: ${roundedSum}`;
            document.getElementById('asSum').style.display = 'inline-block';
            document.getElementById('asAvg').textContent = `平均: ${roundedAvg}`;
            document.getElementById('asAvg').style.display = 'inline-block';

            // 中位數、最大、最小
            const sorted = nums.slice().sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
            const r4 = v => Math.round(v * 10000) / 10000;
            document.getElementById('asMed').textContent = `中位數: ${r4(median)}`;
            document.getElementById('asMax').textContent = `最大: ${r4(sorted[sorted.length - 1])}`;
            document.getElementById('asMin').textContent = `最小: ${r4(sorted[0])}`;
            autoSumHasNumbers = true;
        } else {
            autoSumHasNumbers = false;
            // 若範圍內全為純文字，則隱藏加總與平均，只顯示項目數量
            document.getElementById('asSum').style.display = 'none';
            document.getElementById('asAvg').style.display = 'none';
        }
        applyAutoSumExpanded();
        autoSumWidget.classList.remove('hidden');
    } else {
        autoSumWidget.classList.add('hidden'); // 全都是空格就不顯示
    }
}

// 綁定設定選單事件
document.addEventListener('DOMContentLoaded', () => {
    applyAutoSumState();
    applyAutoSumExpanded();
    const btnAutoSumMore = document.getElementById('btnAutoSumMore');
    if (btnAutoSumMore) {
        // mousedown 擋掉預設行為，避免點按鈕時儲存格失去焦點或選取被清掉
        btnAutoSumMore.addEventListener('mousedown', (e) => e.preventDefault());
        btnAutoSumMore.addEventListener('click', (e) => {
            e.stopPropagation();
            isAutoSumExpanded = !isAutoSumExpanded;
            localStorage.setItem(AUTO_SUM_EXPANDED_KEY, isAutoSumExpanded);
            applyAutoSumExpanded();
        });
    }
    const btnToggleAutoSum = document.getElementById('btnToggleAutoSum');
    if (btnToggleAutoSum) {
        btnToggleAutoSum.addEventListener('click', (e) => {
            e.stopPropagation();
            isShowAutoSum = !isShowAutoSum;
            localStorage.setItem(SHOW_AUTO_SUM_KEY, isShowAutoSum);
            applyAutoSumState();
            showToast(isShowAutoSum ? '✅ 已顯示自動加總' : '❌ 已隱藏自動加總');
            
            // 觸發重新繪製以即時更新面板
            if(typeof applySelectionVisuals === 'function') applySelectionVisuals();
        });
    }
});












/* ==========================================
   欄／列／頁籤選單 與 上方工具列選單 互斥
   原因：工具列的下拉按鈕會 stopPropagation，導致 script.js 底部
   「點擊空白處關閉選單」收不到事件，欄列選單因此一直殘留。
   這裡改在「捕獲階段」處理，不受 stopPropagation 影響。
========================================== */
document.addEventListener('click', (e) => {
    // 點的是哪一個選單的開關，就保留那一個；其餘一律關閉
    const keepId = e.target.closest('.btn-col-menu') ? 'colMenu'
                 : e.target.closest('.btn-row-menu') ? 'rowMenu'
                 : e.target.closest('.tab-menu-btn') ? 'tabMenu'
                 : null;
    document.querySelectorAll('.context-menu.show').forEach(m => {
        if (m.id === keepId) return;      // 正要開啟／切換的那個
        if (m.contains(e.target)) return; // 點在選單自己裡面（選項會自行關閉）
        m.classList.remove('show');
    });
}, true);


/* ==========================================
   表格欄位名稱管理工具 (首列設欄名 / 移除欄名)
   ========================================== */

// 1. 首列設欄名邏輯
document.getElementById('btnSetFirstRowAsHeader')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const tbody = dataTable.querySelector('tbody');
    if (!tbody || !tbody.children[0]) {
        showToast('⚠️ 表格內沒有資料');
        return;
    }

    // 取得第一列的所有儲存格內容
    const firstRow = tbody.children[0];
    const cells = firstRow.querySelectorAll('.td-inner');
    const theadThs = dataTable.querySelectorAll('thead th');

    // 將內容填入 Th 的 dataset 中 (略過第 0 欄的序號欄)
    cells.forEach((cell, i) => {
        const targetTh = theadThs[i + 1];
        if (targetTh) {
            const name = cell.innerText.trim();
            targetTh.dataset.colName = name;
        }
    });

    // 更新介面顯示並儲存設定
    updateTableHeaders();
    saveColNames();
    debouncedSaveHistory();
    
    // 自動關閉選單
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    showToast('✅ 已將首列內容設為欄位名稱');
});

// 2. 移除欄名邏輯
document.getElementById('btnRemoveAllHeaderNames')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const theadThs = dataTable.querySelectorAll('thead th');

    // 清除所有自訂名稱 (略過序號欄)
    for (let i = 1; i < theadThs.length; i++) {
        theadThs[i].dataset.colName = '';
    }

    updateTableHeaders();
    saveColNames();
    debouncedSaveHistory();

    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    showToast('🗑️ 已移除所有自訂欄位名稱');
});
document.addEventListener('click', () => {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
        document.querySelectorAll('.chat-actions').forEach(act => {
            act.classList.remove('opacity-100');
            act.classList.add('opacity-0');
        });
    }
});

/* ==========================================
   表格：儲存格換行方式 (A / B / C，預設 A)
   A: 依儲存格寬度自動換行，單字可能被截斷
   B: 依儲存格寬度自動換行，單字不被截斷
   C: 不換行，超出的部分顯示為 ...
   ========================================== */
(function initTableWrapMode() {
    const KEY = 'tableWrapMode';
    const menu = document.getElementById('dd-tableWrapMode');
    if (!menu) return;
    const items = menu.querySelectorAll('.dropdown-item[data-value]');
    const TOASTS = {
        A: '✅ 自動換行 (單字可能被截斷)',
        B: '✅ 自動換行 (單字不被截斷)',
        C: '✅ 不換行 (超出顯示 ...)'
    };
    let mode = 'A';
    try {
        const saved = localStorage.getItem(KEY);
        if (saved === 'A' || saved === 'B' || saved === 'C') mode = saved;
    } catch (e) {}

    function apply() {
        dataTable.classList.toggle('table-wrap-word', mode === 'B');
        dataTable.classList.toggle('table-nowrap', mode === 'C');
        items.forEach(btn => {
            const ic = btn.querySelector('.check-icon');
            if (ic) ic.classList.toggle('active', btn.dataset.value === mode);
        });
    }
    apply();

    // 其他程式碼若動到 table-nowrap / table-wrap-word，立刻校正回目前選的模式
    new MutationObserver(() => {
        if (dataTable.classList.contains('table-nowrap') !== (mode === 'C') ||
            dataTable.classList.contains('table-wrap-word') !== (mode === 'B')) apply();
    }).observe(dataTable, { attributes: true, attributeFilter: ['class'] });

    items.forEach(btn => {
        btn.addEventListener('click', () => {
            mode = btn.dataset.value;
            try { localStorage.setItem(KEY, mode); } catch (err) {}
            apply();
            showToast(TOASTS[mode]);
        });
    });
})();

/* ==========================================
   下拉選單的子選單：游標跨過縫隙時不要立刻消失 (延遲 300ms 才關閉)
   ========================================== */
(function keepSubmenuOpen() {
    const mq = window.matchMedia('(min-width: 769px)');
    const groups = document.querySelectorAll('.dropdown-menu [class~="group/submenu"]');
    groups.forEach(g => {
        let timer = null;
        g.addEventListener('mouseenter', () => {
            clearTimeout(timer);
            if (!mq.matches) return;
            groups.forEach(o => {
                if (o !== g && o.parentElement === g.parentElement) o.classList.remove('submenu-hold');
            });
            g.classList.add('submenu-hold');
        });
        g.addEventListener('mouseleave', () => {
            clearTimeout(timer);
            timer = setTimeout(() => g.classList.remove('submenu-hold'), 300);
        });
    });
})();
