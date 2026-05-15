// === 1. 建立客語拼音對照字典 (示範用資料庫) ===
const hakkaDictionary = {
    'ngai': ['𠊎', '涯'], 
    'ge': ['个', '介'],   
    'an': ['按', '安'],   
    'zii': ['子', '紫'],
    'ho': ['好', '號'],
    'm': ['毋', '唔'],    
    'sii': ['是', '事'],
    'vug': ['屋'],
    'ka': ['家', '腳'],
    'hag': ['客', '黑'],
    'ngin': ['人', '銀'],
    'bau bau ngiab ngiab': ['包包㘝㘝'],
    'baubaungiabngiab': ['包包㘝㘝'],
    'bau i': ['胞衣'],
    'baui': ['胞衣'],
    'bau san sed hoi': ['包山塞海'],
    'bausansedhoi': ['包山塞海'],
    'heu deu': ['後斗'],
    'heudeu': ['後斗'],
    'di ded': ['知得'],
    'dided': ['知得'],
    'di soi': ['知衰'],
    'disoi': ['知衰']
};

// === 2. 獲取 DOM 元素 (新增了分頁控制元素) ===
const editor = document.getElementById('editor');
const pinyinInput = document.getElementById('pinyinInput');
const candidateArea = document.getElementById('candidateArea');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const csvUpload = document.getElementById('csvUpload');
const editorLabel = document.getElementById('editorLabel');

// 新增：更新字典數量的輔助函數，並在最一開始呼叫一次
function updateDictCount() {
    editorLabel.textContent = `烏衣行客語輸入法(${Object.keys(hakkaDictionary).length}拼法)`;
}
updateDictCount(); // 網頁剛載入時先執行一次，顯示預設數量

// 新增的控制項 DOM
// 新增的控制項 DOM
const candidateControls = document.getElementById('candidateControls');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageIndicator = document.getElementById('pageIndicator');
const toggleExpandBtn = document.getElementById('toggleExpandBtn');


// === 2.5 處理 CSV 匯入邏輯 ===
csvUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const text = event.target.result;
        parseCSVToDictionary(text);
    };
    reader.readAsText(file); 
});

function parseCSVToDictionary(csvText) {
    const lines = csvText.split('\n');
    let newWordsCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        let columns = [];
        let inQuotes = false;
        let currentWord = '';
        for (let char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                columns.push(currentWord);
                currentWord = '';
            } else {
                currentWord += char;
            }
        }
        columns.push(currentWord);

        if (columns.length > 4) {
            const word = columns[1] ? columns[1].trim() : '';
            let pinyinRaw = columns[4] ? columns[4].trim() : '';
            
            if (word && pinyinRaw) {
                let pyWithSpace = pinyinRaw.replace(/[0-9]/g, '').toLowerCase().trim();
                let pyNoSpace = pyWithSpace.replace(/\s+/g, '');
                
                const addWord = (py, w) => {
                    if (!hakkaDictionary[py]) {
                        hakkaDictionary[py] = [];
                    }
                    if (!hakkaDictionary[py].includes(w)) {
                        hakkaDictionary[py].push(w);
                        newWordsCount++;
                    }
                };

                if (pyWithSpace) addWord(pyWithSpace, word);
                if (pyNoSpace && pyNoSpace !== pyWithSpace) addWord(pyNoSpace, word);
            }
        }
    }

    // 匯入完成後，直接呼叫剛剛寫的函數來更新標題數量
    updateDictCount();
    alert(`成功匯入！新增了 ${newWordsCount} 個詞彙對應。`);
    csvUpload.value = ''; 
}

// === 3. 處理拼音輸入與候選字邏輯 (分頁與鍵盤選字版) ===
let currentCandidates = []; 
let currentPage = 0;        
const pageSize = 10;        
let isExpanded = false;     
let savedPinyin = '';        // 新增：暫存拼音 (展開模式切換用)
let numberFilter = '';       // 新增：展開模式下的數字篩選器

// 新增：統一的「出字並重置」輔助函數
function selectCandidate(char) {
    insertTextAtCursor(editor, char);
    pinyinInput.value = ''; 
    isExpanded = false;
    numberFilter = '';
    savedPinyin = '';
    pinyinInput.dispatchEvent(new Event('input')); 
    pinyinInput.focus();
}

// 監聽拼音輸入
// 監聽拼音輸入
pinyinInput.addEventListener('input', function(e) {
    const inputVal = e.target.value.trim().toLowerCase(); 
    
    // 初始化狀態
    currentCandidates = [];
    currentPage = 0;
    isExpanded = false;
    numberFilter = '';  
    savedPinyin = '';   
    
    if (inputVal === '') {
        candidateArea.innerHTML = ''; 
        candidateWindow.classList.add('hidden');
        candidateControls.classList.add('hidden');
        return;
    }

    // 搜尋符合的候選字
    for (let key in hakkaDictionary) {
        if (key.startsWith(inputVal)) {
            hakkaDictionary[key].forEach(word => {
                if (!currentCandidates.includes(word)) {
                    currentCandidates.push(word);
                }
            });
        }
    }

    renderCandidates();
});

// 先獲取新視窗的 DOM
const candidateWindow = document.getElementById('candidateWindow');

function renderCandidates() {
    candidateArea.innerHTML = '';

    if (currentCandidates.length === 0) {
        // 沒有字時，隱藏整個浮動視窗
        candidateWindow.classList.add('hidden');
        return;
    }

    // 顯示視窗
    candidateWindow.classList.remove('hidden');

    const totalPages = Math.ceil(currentCandidates.length / pageSize);
    let displayCandidates = [];

    if (isExpanded) {
        candidateWindow.classList.add('expanded-view'); // 套用擴張 CSS
        toggleExpandBtn.textContent = '收合(/)';
        prevPageBtn.style.display = 'inline-block'; // 展開時依然保留翻頁功能
        nextPageBtn.style.display = 'inline-block';
        pageIndicator.style.display = 'inline-block';
        
        // 渲染全部候選字，並加上絕對編號
        currentCandidates.forEach((char, i) => {
            const absIdxStr = (i + 1).toString();
            if (numberFilter === '' || absIdxStr.startsWith(numberFilter)) {
                displayCandidates.push({ char, displayIndex: absIdxStr });
            }
        });
    } else {
        candidateWindow.classList.remove('expanded-view'); // 恢復原本大小
        const startIndex = currentPage * pageSize;
        toggleExpandBtn.textContent = '展開全部(/)';
        
        // 分頁模式下，顯示上一頁/下一頁
        pageIndicator.textContent = `${currentPage + 1} / ${totalPages}`;
        prevPageBtn.disabled = currentPage === 0;
        nextPageBtn.disabled = currentPage >= totalPages - 1;

        const pageItems = currentCandidates.slice(startIndex, startIndex + pageSize);
        pageItems.forEach((char, i) => {
            const numKey = i === 9 ? 0 : i + 1;
            displayCandidates.push({ char, displayIndex: numKey.toString() });
        });
    }

    // (按鈕產生邏輯維持之前的優化版，縮小行距設定)
    displayCandidates.forEach((item, i) => {
        const btn = document.createElement('button');
        
        // 判斷分群背景：每 10 個換一次顏色 (白色與超淺灰色交替)
        const groupIndex = Math.floor(i / 10);
        const bgColorClass = (isExpanded && groupIndex % 2 !== 0) ? 'bg-gray-100' : 'bg-white';

        // 更新樣式：top-0 left-0.5 讓數字貼近最左上角
        btn.className = `relative pt-2.5 pb-1.5 px-3 ${bgColorClass} border border-gray-100 rounded shadow-sm text-2xl hover:bg-blue-100 hover:border-blue-400 hover:text-blue-700 transition min-w-[3.5rem] flex flex-col items-center`;
        
        btn.innerHTML = `
            <span class="absolute top-0 left-0.5 text-gray-400 text-[9px] font-mono leading-none">${item.displayIndex}</span>
            <span class="mt-1.5 leading-none">${item.char}</span>
        `;
        
        btn.onclick = () => selectCandidate(item.char);
        candidateArea.appendChild(btn);
    });

    // 控制視窗與按鈕列的顯示/隱藏
    if (currentCandidates.length > 0) {
        candidateWindow.classList.remove('hidden');
        candidateControls.classList.remove('hidden');
    } else {
        candidateWindow.classList.add('hidden');
        candidateControls.classList.add('hidden');
    }
}

// === 新增：監聽鍵盤快捷鍵 (選字與換頁) ===
// === 監聽鍵盤快捷鍵 (空白鍵、選字與換頁) ===
pinyinInput.addEventListener('keydown', function(e) {
    if (currentCandidates.length === 0) return;

    // 1. 空白鍵：直接送出目前畫面上的第一個候選字
    if (e.key === ' ') {
        e.preventDefault();
        const firstCandidateBtn = candidateArea.querySelector('button');
        if (firstCandidateBtn) firstCandidateBtn.click();
        return;
    }

    // 2. 切換展開/收合全部 (/)
    if (e.key === '/') {
        e.preventDefault();
        toggleExpandBtn.click();
        return;
    }

    // 3. 處理展開模式下的數字篩選
    if (isExpanded) {
        // 新增：使用 , 與 . 進行捲動
        if (e.key === ',') {
            e.preventDefault();
            candidateArea.scrollTop -= 80; // 往上捲動
            return;
        }
        if (e.key === '.') {
            e.preventDefault();
            candidateArea.scrollTop += 80; // 往下捲動
            return;
        }

        // 原有的數字篩選邏輯...
        if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            numberFilter += e.key;
            pinyinInput.value = numberFilter;
            renderCandidates();
            return;
        }
        // 刪除數字 (Backspace)
        if (e.key === 'Backspace' && numberFilter.length > 0) {
            e.preventDefault();
            numberFilter = numberFilter.slice(0, -1);
            pinyinInput.value = numberFilter.length > 0 ? numberFilter : savedPinyin;
            renderCandidates();
            return;
        }
        // 貼心設計：如果在展開模式下打了英文字母，自動切回分頁模式讓他繼續打拼音
        if (/^[a-z]$/i.test(e.key)) {
            toggleExpandBtn.click(); 
            // 不 preventDefault，讓字母自然輸入到拼音框
        }
    } 
    // 4. 處理分頁模式下的邏輯
    else {
        const totalPages = Math.ceil(currentCandidates.length / pageSize);
        if (e.key === ',' && currentPage > 0) {
            e.preventDefault();
            currentPage--;
            renderCandidates();
            return;
        }
        if (e.key === '.' && currentPage < totalPages - 1) {
            e.preventDefault();
            currentPage++;
            renderCandidates();
            return;
        }
        if (/^[0-9]$/.test(e.key)) {
            e.preventDefault();
            const num = parseInt(e.key);
            const indexOnPage = num === 0 ? 9 : num - 1; 
            const targetIndex = (currentPage * pageSize) + indexOnPage;

            if (currentCandidates[targetIndex]) {
                selectCandidate(currentCandidates[targetIndex]);
            }
        }
    }
});

// 綁定控制列按鈕事件
// 綁定控制列按鈕事件
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 0) { currentPage--; renderCandidates(); pinyinInput.focus(); }
});
nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(currentCandidates.length / pageSize);
    if (currentPage < totalPages - 1) { currentPage++; renderCandidates(); pinyinInput.focus(); }
});

toggleExpandBtn.addEventListener('click', () => {
    isExpanded = !isExpanded;
    
    if (isExpanded) {
        // 進入展開模式：記錄目前的拼音
        savedPinyin = pinyinInput.value;
        numberFilter = '';
    } else {
        // 退出展開模式：恢復原來的拼音
        pinyinInput.value = savedPinyin;
        currentPage = 0; // 重置頁碼為第一頁
    }
    
    renderCandidates();
    pinyinInput.focus();
});

// === 4. 在游標位置插入文字的輔助函數 ===
function insertTextAtCursor(textarea, text) {
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentVal = textarea.value;

    textarea.value = currentVal.substring(0, startPos) + text + currentVal.substring(endPos);
    textarea.selectionStart = startPos + text.length;
    textarea.selectionEnd = startPos + text.length;
    textarea.dispatchEvent(new Event('input'));
}

// === 5. 工具列按鈕功能 ===
copyBtn.addEventListener('click', () => {
    if (editor.value.trim() === '') {
        alert('編輯區是空的！');
        return;
    }
    navigator.clipboard.writeText(editor.value).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '已複製！';
        copyBtn.classList.remove('bg-blue-100', 'text-blue-700');
        copyBtn.classList.add('bg-green-100', 'text-green-700');
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove('bg-green-100', 'text-green-700');
            copyBtn.classList.add('bg-blue-100', 'text-blue-700');
        }, 2000);
    }).catch(err => {
        console.error('複製失敗: ', err);
        editor.select();
        document.execCommand('copy');
        alert('已嘗試複製。');
    });
});

clearBtn.addEventListener('click', () => {
    if (confirm('確定要清除所有文字嗎？')) {
        editor.value = '';
        editor.focus();
    }
});