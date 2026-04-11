// =================================================================
// 互動學習模式模組 (game-module.js)
// =================================================================

// ✨ 1. 將啟動函數綁定到 window，並改為接收 configs 物件
window.launchGameMode = function(mode, rawData, configs) {
    const hasHeader = configs.hasHeader || false;
    const hasCategory = configs.hasCategory || false;
    const colC = configs.colC !== undefined ? configs.colC : -1;
    
    // 安全處理：確保有配對資料
    if (!configs.matchPairs || configs.matchPairs.length === 0) {
        configs.matchPairs = [{ id: 1, termCol: configs.colA || 0, defCol: configs.colB || 1, customName: '' }];
    }

    // 取得當前選擇的配對索引 (預設 0)
    let currentMatchIndex = configs.currentMatchIndex || 0;
    if (currentMatchIndex >= configs.matchPairs.length) currentMatchIndex = 0;
    
    // ✨ 關鍵修復：把防呆後的預設索引值寫回 configs 裡面，讓後續的函數抓得到！
    configs.currentMatchIndex = currentMatchIndex;

    document.body.classList.add('is-playing-game');
    if (typeof toggleMaximizeMode === 'function') toggleMaximizeMode(true);

    const gameArea = document.getElementById('gameArea');
    if (!gameArea) return;

    // 輔助函數：取得欄位的顯示名稱
    function getColName(idx) {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const letter = alphabet[idx % 26];
        if (hasHeader && window.gameHeaders && window.gameHeaders[idx]) {
            return window.gameHeaders[idx].trim();
        }
        return `${letter}欄`;
    }

    // ✨ 建立匹配形式下拉選單 HTML (大於 1 組才顯示)
    let matchSelectorHTML = '';
    if (configs.matchPairs.length > 1) {
        const options = configs.matchPairs.map((pair, idx) => {
            const defaultName = `${getColName(pair.termCol)} ➔ ${getColName(pair.defCol)}`;
            const displayName = pair.customName ? pair.customName : defaultName;
            return `<option value="${idx}" ${idx === currentMatchIndex ? 'selected' : ''}>${displayName}</option>`;
        }).join('');

        matchSelectorHTML = `
            <div class="flex items-center gap-1 bg-purple-50 px-2 py-1.5 rounded-xl border border-purple-100 flex-shrink-0">
                <span class="material-symbols-outlined text-purple-500 text-[18px]">swap_horiz</span>
                <select id="game-match-filter" class="bg-transparent text-purple-800 font-bold text-sm outline-none cursor-pointer max-w-[120px] md:max-w-[160px] truncate">
                    ${options}
                </select>
            </div>
        `;
    }

    // 🌟 統一的頂部工具列 (保留你的篩選器並加入新的匹配選單)
    // (注意：這裡保留你原本用來裝分類篩選器的地方，我在它旁邊加上了 matchSelectorHTML)
    const toolbarHTML = `
        <div class="w-full bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm flex-shrink-0 z-50">
            <div class="flex items-center gap-2 md:gap-4 flex-wrap">
                <button id="btn-exit-game" class="flex items-center gap-1 text-gray-600 hover:text-purple-600 font-bold px-2 py-1.5 md:px-3 md:py-2 rounded-xl hover:bg-purple-50 transition-colors">
                    <span class="material-symbols-outlined">arrow_back</span>
                    返回
                </button>
                
                <div class="hidden md:block h-6 w-px bg-gray-300"></div> 
                
                <div id="game-dynamic-filters-area" class="flex gap-2 flex-wrap">
                    ${matchSelectorHTML}
                </div>
                
                <div class="flex bg-gray-100 p-1 rounded-xl gap-1 overflow-x-auto">
                    <button class="mode-switch-btn px-3 py-1.5 md:px-5 md:py-1.5 rounded-lg font-bold text-sm transition-colors ${mode === 'flashcard' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}" data-mode="flashcard">字卡</button>
                    <button class="mode-switch-btn px-3 py-1.5 md:px-5 md:py-1.5 rounded-lg font-bold text-sm transition-colors ${mode === 'matching' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}" data-mode="matching">配對</button>
                    <button class="mode-switch-btn px-3 py-1.5 md:px-5 md:py-1.5 rounded-lg font-bold text-sm transition-colors ${mode === 'quiz' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}" data-mode="quiz">測驗</button>
                    <button class="mode-switch-btn px-3 py-1.5 md:px-5 md:py-1.5 rounded-lg font-bold text-sm transition-colors ${mode === 'sorting' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}" data-mode="sorting">排序</button>
					<button class="mode-switch-btn px-3 py-1.5 md:px-5 md:py-1.5 rounded-lg font-bold text-sm transition-colors ${mode === 'typing' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'}" data-mode="typing">打字</button>
                </div>
            </div>
        </div>
        
        <div id="game-content-area" class="w-full flex-1 overflow-y-auto bg-gray-50 relative"></div>
    `;

    gameArea.innerHTML = toolbarHTML;
    const container = document.getElementById('game-content-area');
    const filtersArea = document.getElementById('game-dynamic-filters-area');

    // 綁定基礎事件
    document.getElementById('btn-exit-game').addEventListener('click', () => {
        document.body.classList.remove('is-playing-game');
        if (typeof toggleMaximizeMode === 'function') toggleMaximizeMode(false);
        if (typeof switchMode === 'function') switchMode('table');
    });

    document.querySelectorAll('.mode-switch-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const newMode = e.target.getAttribute('data-mode');
            if (newMode !== mode && typeof switchMode === 'function') switchMode(newMode);
        });
    });

    // 綁定匹配選單變更事件
    const matchFilter = document.getElementById('game-match-filter');
    if (matchFilter) {
        matchFilter.addEventListener('change', (e) => {
            configs.currentMatchIndex = parseInt(e.target.value, 10);
            window.currentGameConfigs.currentMatchIndex = configs.currentMatchIndex;
            localStorage.setItem('wesing-game-configs', JSON.stringify(window.currentGameConfigs));
            reparseAndRender(); // 重抓資料並重繪
        });
    }

    // ✨ 核心包裝：當匹配欄位改變時，我們必須重新解析整個表格資料
    function reparseAndRender() {
        let parsedData = [];
        
        // 根據遊戲模式，呼叫不同的資料解析引擎
        if (mode === 'choice') {
            parsedData = parseMultipleChoiceData(rawData, configs.mcConfig, hasHeader, hasCategory, colC);
        } else {
            const activePair = configs.matchPairs[configs.currentMatchIndex];
            parsedData = parseGameData(rawData, activePair.termCol, activePair.defCol, hasHeader, hasCategory, colC);
        }

        if (parsedData.length === 0) {
            container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-gray-500 mt-20">
                <span class="material-symbols-outlined text-5xl mb-2">warning</span>
                <p class="font-bold">表格內似乎沒有有效資料喔！</p>
            </div>`;
            return;
        }

        // 動態生成並更新分類過濾器
        let uniqueCategories = [];
        if (hasCategory) {
            uniqueCategories = Array.from(new Set(parsedData.map(d => d.category))).sort();
            
            let catSelect = document.getElementById('game-category-filter');
            if (!catSelect) {
                const catHtml = `
                    <div class="flex items-center gap-1 bg-blue-50 px-2 py-1.5 rounded-xl border border-blue-100 flex-shrink-0">
                        <span class="material-symbols-outlined text-blue-500 text-[18px]">filter_list</span>
                        <select id="game-category-filter" class="bg-transparent text-blue-800 font-bold text-sm outline-none cursor-pointer max-w-[120px] md:max-w-[150px] truncate">
                            <option value="ALL">全部</option>
                            ${uniqueCategories.map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                `;
                filtersArea.insertAdjacentHTML('afterbegin', catHtml);
                catSelect = document.getElementById('game-category-filter');
                
                catSelect.addEventListener('change', (e) => {
                    configs.filterCategory = e.target.value;
                    window.currentGameConfigs.filterCategory = e.target.value;
                    localStorage.setItem('wesing-game-configs', JSON.stringify(window.currentGameConfigs));
                    renderFinalGame(parsedData);
                });
            }
            if (configs.filterCategory && (uniqueCategories.includes(configs.filterCategory) || configs.filterCategory === 'ALL')) {
                catSelect.value = configs.filterCategory;
            }
        }
        renderFinalGame(parsedData);
    }

    function renderFinalGame(parsedData) {
        const catSelect = document.getElementById('game-category-filter');
        const selectedCat = catSelect ? catSelect.value : 'ALL';
        const filteredData = selectedCat === 'ALL' ? parsedData : parsedData.filter(d => d.category === selectedCat);

        if (filteredData.length === 0) {
            container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-gray-500 mt-20">
                <span class="material-symbols-outlined text-5xl mb-4 text-blue-300">category</span>
                <p class="font-bold text-lg">此分類下目前沒有題目喔！</p>
            </div>`;
            return;
        }

        // ✨ 隱藏選擇題模式下無意義的切換按鈕與匹配下拉選單
        const switchGroup = document.querySelector('.mode-switch-btn')?.parentElement;
        const matchFilterUI = document.getElementById('game-match-filter')?.parentElement;
        if (mode === 'choice') {
            if (switchGroup) switchGroup.style.display = 'none';
            if (matchFilterUI) matchFilterUI.style.display = 'none';
        } else {
            if (switchGroup) switchGroup.style.display = 'flex';
            if (matchFilterUI) matchFilterUI.style.display = 'flex';
        }

        switch (mode) {
            case 'flashcard': renderFlashcardGame(filteredData, container); break;
            case 'matching': renderMatchingGame(filteredData, container); break;
            case 'quiz': renderQuizGame(filteredData, container); break;
            case 'sorting': renderSortingGame(filteredData, container); break;
            case 'typing': renderTypingGame(filteredData, container); break;
            case 'choice': renderMultipleChoiceGame(filteredData, container); break;
        }
    }

    // 啟動第一次解析與渲染
    reparseAndRender();
};
// =================================================================
// 資料解析中心 (Data Parser)
// =================================================================
// 2. 更新解析器支援 Category
function parseGameData(rawData, colA, colB, hasHeader, hasCategory, colC) {
    if (!rawData) return [];
    
    let lines = rawData.split('\n').filter(line => line.trim() !== '');
    if (hasHeader && lines.length > 0) lines.shift(); 

    const result = [];

    lines.forEach(line => {
        const cols = line.split('\t');
        
        const termVal = cols[colA] ? cols[colA].trim() : '';
        const defVal = cols[colB] ? cols[colB].trim() : '';
        // 抓取分類值，如果開啟分類卻是空值，則賦予 (無名)
        const catVal = (hasCategory && colC >= 0 && cols[colC]) ? cols[colC].trim() : '';
        
        if (termVal !== '' || defVal !== '') {
            result.push({
                term: termVal || '無題目',
                definition: defVal || '無解釋',
                category: hasCategory ? (catVal || '(無名)') : '',
                extra: '' 
            });
        }
    });

    return result;
}

// 3. 專屬：選擇題解析器
function parseMultipleChoiceData(rawData, mcConfig, hasHeader, hasCategory, colC) {
    if (!rawData || !mcConfig) return [];
    let lines = rawData.split('\n').filter(line => line.trim() !== '');
    if (hasHeader && lines.length > 0) lines.shift(); 

    const result = [];

    lines.forEach(line => {
        const cols = line.split('\t');
        
        const q = cols[mcConfig.qCol] ? cols[mcConfig.qCol].trim() : '';
        if (!q) return; // 沒題目就跳過

        // 💡 判斷是否大於等於 0，避免把 -1 (無) 當作有效欄位去抓資料
        let o1 = (mcConfig.o1Col >= 0 && cols[mcConfig.o1Col]) ? cols[mcConfig.o1Col].trim() : '';
        let o2 = (mcConfig.o2Col >= 0 && cols[mcConfig.o2Col]) ? cols[mcConfig.o2Col].trim() : '';
        let o3 = (mcConfig.o3Col >= 0 && cols[mcConfig.o3Col]) ? cols[mcConfig.o3Col].trim() : '';
        let o4 = (mcConfig.o4Col >= 0 && cols[mcConfig.o4Col]) ? cols[mcConfig.o4Col].trim() : '';

        let ansText = '';
        
        // 判斷答案來源
        if (mcConfig.ansCol.startsWith('fixed_')) {
            const idx = parseInt(mcConfig.ansCol.split('_')[1], 10);
            if (idx === 1) ansText = o1;
            else if (idx === 2) ansText = o2;
            else if (idx === 3) ansText = o3;
            else if (idx === 4) ansText = o4;
        } else if (mcConfig.ansCol.startsWith('col_')) {
            const cIdx = parseInt(mcConfig.ansCol.split('_')[1], 10);
            let rawAns = cols[cIdx] ? cols[cIdx].trim() : '';
            
            // 如果欄位寫的是 1, 2, 3, 4，就對應去抓選項內容
            if (rawAns === '1' || rawAns === 'A' || rawAns === 'a') ansText = o1;
            else if (rawAns === '2' || rawAns === 'B' || rawAns === 'b') ansText = o2;
            else if (rawAns === '3' || rawAns === 'C' || rawAns === 'c') ansText = o3;
            else if (rawAns === '4' || rawAns === 'D' || rawAns === 'd') ansText = o4;
            else ansText = rawAns; 
        }

        // 過濾掉空字串，並且利用 Set 刪除重複的選項
        const rawOptions = [o1, o2, o3, o4].filter(o => o !== '');
        const options = [...new Set(rawOptions)]; 

        // 如果沒有選項，或是解析不出答案，這題就作廢
        if (options.length === 0 || !ansText) return;

        const catVal = (hasCategory && colC >= 0 && cols[colC]) ? cols[colC].trim() : '';

        result.push({
            term: q,
            definition: ansText, 
            options: options,    
            category: hasCategory ? (catVal || '(無名)') : '',
            extra: '' 
        });
    });

    return result;
}






// =================================================================
// 遊戲渲染區：閃示卡 (Flashcard) - 極簡精緻版
// =================================================================
function renderFlashcardGame(data, container) {
    let flashcardData = [...data];
    let originalData = [...data];
    let currentIndex = 0;
    let isFlipped = false;
    let isShuffled = false;
    let fontSize = 48; // 預設大字體
    let autoPlayTimer = null;
    let autoPlaySec = 3; 
    let isPlaying = false;

    // 清理先前的鍵盤事件，避免重複觸發
    if (window.flashcardKeyHandler) {
        document.removeEventListener('keydown', window.flashcardKeyHandler);
    }

    container.innerHTML = `
        <div class="max-w-4xl mx-auto flex flex-col h-full py-4 px-4 sm:px-6 w-full items-center justify-center relative">
            
            <div id="fc-card" class="group w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col relative cursor-default hover:shadow-md transition-shadow duration-300 overflow-hidden" style="min-height: 320px; height: 50vh; max-height: 450px;">
                
                <div class="absolute top-0 left-0 w-full h-1 bg-gray-50 z-10">
                    <div id="fc-progress-bar" class="bg-blue-500 h-full rounded-t-2xl transition-all duration-300" style="width: 0%"></div>
                </div>
                
                <div class="absolute top-4 right-6 flex justify-end gap-2.5 text-gray-400 font-bold text-sm select-none z-20">
                    <button id="fc-btn-font-dec" class="hover:text-gray-600 transition-colors cursor-pointer p-1">A-</button>
                    <button id="fc-btn-font-inc" class="hover:text-gray-600 transition-colors cursor-pointer p-1">A+</button>
                </div>

                <button id="fc-btn-first" class="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-300 hover:text-blue-600 p-2 z-20 cursor-pointer disabled:opacity-0 disabled:cursor-not-allowed" title="跳至第一張">
                    <span class="material-symbols-outlined text-[28px]">first_page</span>
                </button>

                <button id="fc-btn-last" class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-gray-300 hover:text-blue-600 p-2 z-20 cursor-pointer disabled:opacity-0 disabled:cursor-not-allowed" title="跳至最後一張">
                    <span class="material-symbols-outlined text-[28px]">last_page</span>
                </button>

                <div class="flex-1 flex flex-col justify-center items-center pt-14 pb-10 px-14 overflow-y-auto scrollbar-thin">
                    <div id="fc-content" class="text-center font-bold text-slate-800 break-words leading-tight transition-opacity duration-150 select-none" style="font-size: ${fontSize}px"></div>
                </div>
            </div>

            <div class="w-full max-w-3xl mt-2 flex items-center justify-between select-none px-4 py-1">
                
                <div class="flex items-center gap-2 sm:gap-4 w-1/3">
                    <button id="fc-btn-shuffle" class="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer flex items-center p-1.5" title="亂數排序">
                        <span class="material-symbols-outlined text-[20px]" id="fc-shuffle-icon">shuffle</span>
                    </button>
                    
                    <div class="relative flex items-center">
                        <button id="fc-btn-autoplay" class="text-gray-400 hover:text-blue-600 transition-colors cursor-pointer flex items-center p-1.5" title="自動播放">
                            <span class="material-symbols-outlined text-[20px]" id="fc-autoplay-icon">play_circle</span>
                        </button>
                        <button id="fc-btn-speed" class="text-gray-300 hover:text-gray-500 transition-colors ml-0 cursor-pointer flex items-center" title="播放速度">
                            <span class="material-symbols-outlined text-[14px]">expand_less</span>
                        </button>
                        
                        <div id="fc-autoplay-popup" class="hidden absolute bottom-full left-0 mb-3 w-28 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 overflow-hidden">
                            <div class="px-3 py-1.5 text-xs text-gray-400 font-bold border-b border-gray-100 mb-1 bg-gray-50">播放間隔</div>
                            <button class="fc-speed-btn w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-bold text-gray-600 cursor-pointer" data-sec="2">2 秒</button>
                            <button class="fc-speed-btn w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-bold text-blue-600 bg-blue-50 cursor-pointer" data-sec="3">3 秒</button>
                            <button class="fc-speed-btn w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-bold text-gray-600 cursor-pointer" data-sec="5">5 秒</button>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-3 sm:gap-6 w-1/3 justify-center">
                    <button id="fc-btn-prev" class="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center p-1.5">
                        <span class="material-symbols-outlined text-[22px]">skip_previous</span>
                    </button>
                    
                    <button id="fc-btn-flip-action" class="w-11 h-11 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors cursor-pointer flex-shrink-0" title="翻面 (空白鍵)">
                        <span class="material-symbols-outlined text-[22px]">sync</span>
                    </button>
                    
                    <button id="fc-btn-next" class="text-gray-600 hover:text-gray-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center p-1.5">
                        <span class="material-symbols-outlined text-[22px]">skip_next</span>
                    </button>
                </div>

                <div class="w-1/3 text-right text-gray-300 font-bold text-sm tracking-wider pr-2" id="fc-counter">
                    1 / 10
                </div>
            </div>
        </div>
    `;

    // 取得 DOM
    const contentEl = document.getElementById('fc-content');
    const cardEl = document.getElementById('fc-card');
    const counterEl = document.getElementById('fc-counter');
    const progressBar = document.getElementById('fc-progress-bar');
	const btnFirst = document.getElementById('fc-btn-first');
    const btnLast = document.getElementById('fc-btn-last');
    
    const btnPrev = document.getElementById('fc-btn-prev');
    const btnNext = document.getElementById('fc-btn-next');
    const btnFlipAction = document.getElementById('fc-btn-flip-action');
    
    const btnShuffle = document.getElementById('fc-btn-shuffle');
    const shuffleIcon = document.getElementById('fc-shuffle-icon');
    const btnAutoPlay = document.getElementById('fc-btn-autoplay');
    const autoPlayIcon = document.getElementById('fc-autoplay-icon');
    const btnSpeed = document.getElementById('fc-btn-speed');
    const popupSpeed = document.getElementById('fc-autoplay-popup');
    const speedBtns = document.querySelectorAll('.fc-speed-btn');
    
    const btnFontInc = document.getElementById('fc-btn-font-inc');
    const btnFontDec = document.getElementById('fc-btn-font-dec');

    // 核心：更新卡片資料
    function updateCard() {
        isFlipped = false;
        contentEl.style.fontSize = `${fontSize}px`;
        contentEl.textContent = flashcardData[currentIndex].term;
        contentEl.classList.remove('text-blue-800');
        contentEl.classList.add('text-slate-800');
        
        counterEl.textContent = `${currentIndex + 1} / ${flashcardData.length}`;
        progressBar.style.width = `${((currentIndex + 1) / flashcardData.length) * 100}%`;
        
        // 智能禁用箭頭按鈕
        btnPrev.disabled = currentIndex === 0;
        if (currentIndex === 0) btnPrev.classList.replace('text-gray-600', 'text-gray-300');
        else btnPrev.classList.replace('text-gray-300', 'text-gray-600');

        btnNext.disabled = currentIndex === flashcardData.length - 1;
        if (currentIndex === flashcardData.length - 1) btnNext.classList.replace('text-gray-800', 'text-gray-400');
        else btnNext.classList.replace('text-gray-400', 'text-gray-800');

        btnFirst.disabled = currentIndex === 0;
        btnLast.disabled = currentIndex === flashcardData.length - 1;
    }

    // 核心：翻牌動畫
    function flipCard() {
        isFlipped = !isFlipped;
        contentEl.style.opacity = 0;
        setTimeout(() => {
            contentEl.textContent = isFlipped ? flashcardData[currentIndex].definition : flashcardData[currentIndex].term;
            if (isFlipped) {
                contentEl.classList.replace('text-slate-800', 'text-blue-800');
            } else {
                contentEl.classList.replace('text-blue-800', 'text-slate-800');
            }
            contentEl.style.opacity = 1;
        }, 150); 
    }

    // --- 事件綁定 ---
    btnFlipAction.addEventListener('click', flipCard);

	btnFirst.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentIndex > 0) {
            currentIndex = 0;
            updateCard();
        }
    });

    btnLast.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentIndex < flashcardData.length - 1) {
            currentIndex = flashcardData.length - 1;
            updateCard();
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentIndex > 0) { currentIndex--; updateCard(); }
    });

    btnNext.addEventListener('click', () => {
        if (currentIndex < flashcardData.length - 1) { currentIndex++; updateCard(); }
    });

    // 字體縮放
    btnFontInc.addEventListener('click', () => {
        if (fontSize < 100) { fontSize += 4; contentEl.style.fontSize = `${fontSize}px`; }
    });
    btnFontDec.addEventListener('click', () => {
        if (fontSize > 16) { fontSize -= 4; contentEl.style.fontSize = `${fontSize}px`; }
    });

    // 亂數排序
    btnShuffle.addEventListener('click', () => {
        isShuffled = !isShuffled;
        if (isShuffled) {
            flashcardData.sort(() => Math.random() - 0.5);
            btnShuffle.classList.add('text-blue-600');
            btnShuffle.classList.remove('text-gray-400');
            shuffleIcon.textContent = 'shuffle_on';
        } else {
            flashcardData = [...originalData];
            btnShuffle.classList.remove('text-blue-600');
            btnShuffle.classList.add('text-gray-400');
            shuffleIcon.textContent = 'shuffle';
        }
        currentIndex = 0;
        updateCard();
    });

    // 播放速度選單
    btnSpeed.addEventListener('click', (e) => {
        e.stopPropagation();
        popupSpeed.classList.toggle('hidden');
    });
    document.addEventListener('click', (e) => {
        if (!popupSpeed.contains(e.target) && e.target !== btnSpeed) {
            popupSpeed.classList.add('hidden');
        }
    });

    speedBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            autoPlaySec = parseInt(btn.dataset.sec);
            speedBtns.forEach(b => {
                b.classList.remove('bg-blue-50', 'text-blue-600');
                b.classList.add('text-gray-600');
            });
            btn.classList.add('bg-blue-50', 'text-blue-600');
            btn.classList.remove('text-gray-600');
            popupSpeed.classList.add('hidden');
            
            if (isPlaying) {
                clearTimeout(autoPlayTimer);
                autoPlayTimer = setTimeout(nextAutoPlayStep, autoPlaySec * 1000 * 0.5);
            }
        });
    });

    // 自動播放引擎
    function stopAutoPlay() {
        isPlaying = false;
        clearTimeout(autoPlayTimer);
        autoPlayIcon.textContent = 'play_circle';
        btnAutoPlay.classList.remove('text-blue-600');
        btnAutoPlay.classList.add('text-gray-400');
    }

    function nextAutoPlayStep() {
        if (!isPlaying) return;
        if (!isFlipped) {
            flipCard();
            autoPlayTimer = setTimeout(nextAutoPlayStep, autoPlaySec * 1000 * 0.6);
        } else {
            if (currentIndex < flashcardData.length - 1) {
                currentIndex++;
                updateCard();
                autoPlayTimer = setTimeout(nextAutoPlayStep, autoPlaySec * 1000 * 0.4);
            } else {
                currentIndex = 0;
                updateCard();
                autoPlayTimer = setTimeout(nextAutoPlayStep, autoPlaySec * 1000 * 0.4);
            }
        }
    }

    btnAutoPlay.addEventListener('click', () => {
        if (isPlaying) {
            stopAutoPlay();
        } else {
            isPlaying = true;
            autoPlayIcon.textContent = 'pause_circle';
            btnAutoPlay.classList.add('text-blue-600');
            btnAutoPlay.classList.remove('text-gray-400');
            
            if (!isFlipped) {
                autoPlayTimer = setTimeout(nextAutoPlayStep, autoPlaySec * 1000 * 0.6);
            } else {
                nextAutoPlayStep();
            }
        }
    });

    // 鍵盤快捷鍵支援
    window.flashcardKeyHandler = (e) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
        
        if (e.key === ' ') {
            e.preventDefault(); 
            flipCard();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (currentIndex < flashcardData.length - 1) {
                currentIndex++;
                updateCard();
            }
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (currentIndex > 0) {
                currentIndex--;
                updateCard();
            }
        }
    };
    document.addEventListener('keydown', window.flashcardKeyHandler);

    updateCard();
}












// =================================================================
// 遊戲渲染區：配對遊戲 (Matching Game)
// =================================================================
function renderMatchingGame(data, container) {
    let currentPairCount = 4; 
    let isCoverMode = false;  
    let questionOrder = 'random'; // 'random' 或 'sequential'
	let questionPool = [];
    
    let winConditionType = 'none'; // 'none', 'time', 'level'
    let timeLimit = 0;        
    let targetLevels = 1;     
    let currentLevel = 1;     

    let isPlaying = false;    
    let matchedPairs = 0;
	let totalScore = 0;
    let moves = 0;
    let secondsElapsed = 0;
    let remainingSeconds = 0; 
    
    let selectedLeftCard = null;
    let selectedRightCard = null;
    let lockBoard = false; 

    if (window.currentMatchTimer) clearInterval(window.currentMatchTimer);

    // 介面佈局
    container.innerHTML = `
        <div class="max-w-6xl mx-auto flex flex-col h-full py-4 px-2 sm:px-4 w-full relative">
            
            <div class="relative mb-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-shrink-0" style="z-index: 50;">
                
                <div class="flex flex-wrap lg:flex-nowrap justify-between items-center gap-2 sm:gap-4 p-2 sm:p-3">
                    <div class="flex items-center flex-wrap lg:flex-nowrap gap-2 w-full lg:w-auto relative">
                        <h2 class="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-1 hidden 2xl:flex">
                            <span class="material-symbols-outlined text-orange-500">extension</span> 配對
                        </h2>
                        
                        <select id="match-question-order" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 sm:px-3 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-sm cursor-pointer hover:bg-gray-50 transition-colors" style="position: relative; z-index: 9999;">
                            <option value="random" selected>隨機</option>
                            <option value="sequential">依序</option>
                        </select>

                        <select id="match-pair-count" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 sm:px-3 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-sm cursor-pointer hover:bg-gray-50 transition-colors" style="position: relative; z-index: 9999;">
                            <option value="4" selected>4 組</option>
                            <option value="5">5 組</option>
                            <option value="6">6 組</option>
                            <option value="7">7 組</option>
                            <option value="8">8 組</option>
                        </select>

                        <select id="match-cover-mode" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 sm:px-3 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-sm cursor-pointer hover:bg-gray-50 transition-colors" style="position: relative; z-index: 9999;">
                            <option value="false" selected>掀開</option>
                            <option value="true">蓋牌</option>
                        </select>

                        <select id="match-win-condition" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 sm:px-3 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-sm cursor-pointer hover:bg-gray-50 transition-colors" style="position: relative; z-index: 9999;">
                            <option value="none">無限制</option>
                            <optgroup label="⏱️ 限時挑戰">
                                <option value="time-30">30 秒</option>
                                <option value="time-60">60 秒</option>
                                <option value="time-90" selected>90 秒</option>
                                <option value="time-120">120 秒</option>
                                <option value="time-150">150 秒</option>
                                <option value="time-180">180 秒</option>
                            </optgroup>
                            <optgroup label="🎯 連續闖關">
                                <option value="level-1">1 關</option>
                                <option value="level-2">2 關</option>
                                <option value="level-3">3 關</option>
                                <option value="level-4">4 關</option>
                                <option value="level-5">5 關</option>
                                <option value="level-6">6 關</option>
                                <option value="level-8">8 關</option>
                                <option value="level-10">10 關</option>
                            </optgroup>
                        </select>

                        <button id="btn-start-match" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-1 min-w-[100px] justify-center cursor-pointer">
                            <span class="material-symbols-outlined text-[18px]">play_arrow</span> <span id="btn-start-text">開始</span>
                        </button>
                    </div>
                    
                    <div class="flex items-center gap-2 sm:gap-3 text-sm font-bold text-gray-600 ml-auto xl:ml-0 flex-wrap">
                        <div id="match-level-wrapper" class="hidden items-center gap-1 bg-gray-100 px-2 py-1 rounded-md text-gray-700 border border-gray-200">
                            <span class="material-symbols-outlined text-[18px]">layers</span>
                            <span id="match-level-display" class="w-8 text-center text-base">1/1</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[18px] text-blue-500">timer</span>
                            <span id="match-timer" class="w-10 text-center text-base">00:00</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[18px] text-orange-500">footprint</span>
                            <span id="match-moves" class="text-gray-800 w-6 text-center text-base">0</span>步
                        </div>
                    </div>
                </div>

                <div class="w-full bg-gray-100 h-1.5 relative">
                    <div id="match-progress-bar" class="bg-green-500 h-full transition-all duration-500 ease-out" style="width: 0%;"></div>
                </div>
            </div>
            
            <div id="match-board" class="flex gap-2 sm:gap-4 flex-1 pb-4 relative min-h-0" style="z-index: 1;">
                
                <div id="match-overlay" class="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300" style="z-index: 10;">
                    <span class="material-symbols-outlined text-5xl sm:text-6xl text-gray-400 mb-2">touch_app</span>
                    <p class="text-lg sm:text-xl font-bold text-gray-600">請設定條件並點擊開始</p>
                </div>

                <div class="flex-1 flex flex-col w-1/2 min-h-0 relative" style="z-index: 20;">
                    <div id="match-col-left" class="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-2 auto-rows-fr flex-1 h-full min-h-0"></div>
                </div>
                
                <div class="flex-1 flex flex-col w-1/2 min-h-0 relative" style="z-index: 20;">
                    <div id="match-col-right" class="grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-2 auto-rows-fr flex-1 h-full min-h-0"></div>
                </div>
            </div>
            
            <div id="match-result" class="hidden absolute inset-0 flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl pointer-events-none" style="z-index: 100;">
                <div class="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center max-w-sm w-full mx-4 pointer-events-auto">
                    <div id="match-result-icon" class="text-6xl mb-3 z-10 animate-bounce">🏆</div>
                    <h3 id="match-result-title" class="text-2xl font-bold text-gray-800 mb-2 z-10">成功！</h3>
                    <div class="w-full bg-gray-50 rounded-xl border border-gray-200 p-4 mb-5 flex flex-col gap-3">
                        <div id="match-result-level-row" class="hidden justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">通過關數</span>
                            <span id="match-level-result" class="font-bold text-purple-600 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">成功配對</span>
                            <span id="match-score-result" class="font-bold text-green-600 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">遊戲耗時</span>
                            <span id="match-time-result" class="font-bold text-blue-600 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 font-bold text-sm">移動步數</span>
                            <span id="match-moves-result" class="font-bold text-orange-500 text-lg"></span>
                        </div>
                    </div>
                    <button id="btn-restart-match" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-md transition-colors text-base flex justify-center items-center gap-1.5">
                        <span class="material-symbols-outlined text-[20px]">refresh</span> 再挑戰一次
                    </button>
                </div>
            </div>
        </div>
    `;

    const colLeft = document.getElementById('match-col-left');
    const colRight = document.getElementById('match-col-right');
    const overlay = document.getElementById('match-overlay');
    const movesEl = document.getElementById('match-moves');
    const timerEl = document.getElementById('match-timer');
    const levelDisplayWrapper = document.getElementById('match-level-wrapper');
    const levelDisplay = document.getElementById('match-level-display');
    const progressBar = document.getElementById('match-progress-bar');
    const resultArea = document.getElementById('match-result');
    const btnStart = document.getElementById('btn-start-match');
    const btnStartText = document.getElementById('btn-start-text');
    
    const selectQuestionOrder = document.getElementById('match-question-order');
    const selectPair = document.getElementById('match-pair-count');
    const selectCover = document.getElementById('match-cover-mode');
    const selectWinCondition = document.getElementById('match-win-condition');

    // 阻擋外層事件干擾
    [selectQuestionOrder, selectPair, selectCover, selectWinCondition].forEach(selectEl => {
        selectEl.addEventListener('mousedown', (e) => e.stopPropagation());
        selectEl.addEventListener('touchstart', (e) => e.stopPropagation());
        selectEl.addEventListener('click', (e) => e.stopPropagation());
    });
    
    // 綁定選單變更事件
    selectQuestionOrder.addEventListener('change', (e) => { questionOrder = e.target.value; resetToIdle(); });
    selectPair.addEventListener('change', (e) => { currentPairCount = parseInt(e.target.value); resetToIdle(); });
    selectCover.addEventListener('change', (e) => { isCoverMode = e.target.value === 'true'; resetToIdle(); });
    
    selectWinCondition.addEventListener('change', (e) => { 
        const val = e.target.value;
        if (val === 'none') {
            winConditionType = 'none'; timeLimit = 0; targetLevels = 1;
        } else if (val.startsWith('time-')) {
            winConditionType = 'time'; timeLimit = parseInt(val.split('-')[1]); targetLevels = 1;
        } else if (val.startsWith('level-')) {
            winConditionType = 'level'; timeLimit = 0; targetLevels = parseInt(val.split('-')[1]);
        }
        resetToIdle(); 
    });

    function formatTime(totalSeconds) {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    }

    function resetToIdle() {
        isPlaying = false;
        lockBoard = false;
        clearInterval(window.currentMatchTimer);
        clearTimeout(window.matchResultTimeout); 
        
        if (winConditionType === 'time') {
            timerEl.textContent = formatTime(timeLimit);
            timerEl.classList.add('text-red-500'); 
        } else {
            timerEl.textContent = "00:00";
            timerEl.classList.remove('text-red-500');
        }
        
        if (winConditionType === 'level') {
            levelDisplayWrapper.classList.remove('hidden');
            levelDisplayWrapper.classList.add('flex');
            currentLevel = 1;
            levelDisplay.textContent = `${currentLevel}/${targetLevels}`;
        } else {
            levelDisplayWrapper.classList.add('hidden');
            levelDisplayWrapper.classList.remove('flex');
        }

        movesEl.textContent = "0";
        progressBar.style.width = '0%';
        colLeft.innerHTML = '';
        colRight.innerHTML = '';
        overlay.classList.remove('hidden');
        resultArea.classList.add('hidden'); resultArea.classList.remove('flex');
        selectedLeftCard = null;
        selectedRightCard = null;

        // 恢復「開始」按鈕外觀 (藍色)
        btnStartText.textContent = "開始";
        btnStart.querySelector('.material-symbols-outlined').textContent = "play_arrow";
        btnStart.classList.remove('bg-red-500', 'hover:bg-red-600');
        btnStart.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }

    function renderBoard() {
        matchedPairs = 0;
        selectedLeftCard = null;
        selectedRightCard = null;
        lockBoard = false;
        progressBar.style.width = '0%';
        if (winConditionType === 'level') {
            levelDisplay.textContent = `${currentLevel}/${targetLevels}`;
        }

        let actualPairCount = Math.min(currentPairCount, data.length);
        
        let selectedData = [];
        let attempts = 0;
        
        for (let i = 0; i < actualPairCount; i++) {
            // 如果題庫空了，自動依照模式重新裝填
            if (questionPool.length === 0) {
                if (questionOrder === 'random') {
                    questionPool = [...data].sort(() => Math.random() - 0.5);
                } else {
                    questionPool = [...data].reverse();
                }
            }
            
            let drawnItem = questionPool.pop();

            if (selectedData.some(item => item.term === drawnItem.term)) {
                attempts++;
                if (data.length > actualPairCount && attempts < 20) {
                    questionPool.unshift(drawnItem);
                    i--; 
                    continue;
                }
            }
            
            attempts = 0; 
            selectedData.push(drawnItem);
        }
        
        let termsData = selectedData.map(item => ({ text: item.term, pairId: item.term }));
        let defsData = selectedData.map(item => ({ text: item.definition, pairId: item.term }));
        
        // 選項的位置永遠保持隨機打亂
        termsData.sort(() => Math.random() - 0.5);
        defsData.sort(() => Math.random() - 0.5);

        colLeft.innerHTML = '';
        termsData.forEach((item, idx) => colLeft.appendChild(createCardEl(item, 'left', idx)));

        colRight.innerHTML = '';
        defsData.forEach((item, idx) => colRight.appendChild(createCardEl(item, 'right', idx)));
    }

    btnStart.addEventListener('click', () => {
        if (isPlaying) {
            if (totalScore === 0) {
                resetToIdle();
            } else {
                if (winConditionType === 'none') {
                    endGame(true); 
                } else {
                    resetToIdle();
                }
            }
            return;
        }
        
        isPlaying = true;
        totalScore = 0;
        moves = 0;
        secondsElapsed = 0;
        remainingSeconds = timeLimit;
        currentLevel = 1;
        
        // 切換為「停止」按鈕外觀 (紅色)
        btnStartText.textContent = "停止";
        btnStart.querySelector('.material-symbols-outlined').textContent = "stop";
        btnStart.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        btnStart.classList.add('bg-red-500', 'hover:bg-red-600');

        movesEl.textContent = moves;
        overlay.classList.add('hidden');

        clearInterval(window.currentMatchTimer);
        window.currentMatchTimer = setInterval(() => {
            if (winConditionType === 'time') {
                remainingSeconds--;
                timerEl.textContent = formatTime(remainingSeconds);
                if (remainingSeconds <= 0) {
                    endGame(false); 
                }
            } else {
                secondsElapsed++;
                timerEl.textContent = formatTime(secondsElapsed);
            }
        }, 1000);

        // 開始時強制依照模式初始化牌堆
        if (questionOrder === 'random') {
            questionPool = [...data].sort(() => Math.random() - 0.5);
        } else {
            questionPool = [...data].reverse();
        }

        renderBoard();
    });

    function endGame(isSuccess) {
        clearInterval(window.currentMatchTimer);
        isPlaying = false;
        lockBoard = true;
        
        const resultTitle = document.getElementById('match-result-title');
        const resultIcon = document.getElementById('match-result-icon');
        const levelResultRow = document.getElementById('match-result-level-row');
        const levelResult = document.getElementById('match-level-result');
        
        if (isSuccess) {
            resultIcon.textContent = '🏆';
            resultTitle.textContent = (winConditionType === 'level' || winConditionType === 'none') ? '闖關成功！' : '配對成功！';
            resultTitle.className = 'text-2xl font-bold text-gray-800 mb-2 z-10';
            triggerConfettiEffect(); 
        } else {
            resultIcon.textContent = '⏱️';
            resultTitle.textContent = '時間到！任務失敗';
            resultTitle.className = 'text-2xl font-bold text-red-600 mb-2 z-10';
        }

        if (winConditionType === 'level') {
            levelResultRow.classList.remove('hidden');
            levelResultRow.classList.add('flex');
            if (isSuccess) {
                levelResult.textContent = `${targetLevels} / ${targetLevels} 關`;
                levelResult.className = 'font-bold text-purple-600 text-xl';
            } else {
                levelResult.textContent = `${currentLevel - 1} / ${targetLevels} 關`;
                levelResult.className = 'font-bold text-red-500 text-xl';
            }
        } else {
            levelResultRow.classList.add('hidden');
            levelResultRow.classList.remove('flex');
        }

        window.matchResultTimeout = setTimeout(() => {
            resultArea.classList.remove('hidden'); 
            resultArea.classList.add('flex');
            
            const timeSpent = winConditionType === 'time' ? (timeLimit - remainingSeconds) : secondsElapsed;
            document.getElementById('match-time-result').textContent = formatTime(timeSpent);
            document.getElementById('match-moves-result').textContent = moves;
            document.getElementById('match-score-result').textContent = `${totalScore} 組`;     
            
            // 恢復開始按鈕藍色
            btnStartText.textContent = "開始";
            btnStart.querySelector('.material-symbols-outlined').textContent = "play_arrow";
            btnStart.classList.remove('bg-red-500', 'hover:bg-red-600');
            btnStart.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }, 500);
    }

    function createCardEl(item, side, index) {
        const cardEl = document.createElement('div');
        cardEl.className = `match-card h-full w-full bg-white border-2 border-gray-200 rounded-lg shadow-sm flex items-center justify-center p-2 sm:p-3 cursor-pointer transition-all duration-150 select-none relative min-h-[40px]`;
        cardEl.dataset.side = side;
        cardEl.dataset.pairId = item.pairId;
        cardEl.dataset.matched = "false";
        
        const textSpan = document.createElement('span');
        textSpan.className = `text-sm sm:text-base md:text-lg font-normal text-gray-800 break-words text-center w-full transition-opacity duration-200 pointer-events-none leading-tight`;
        textSpan.textContent = item.text;
        
        if (isCoverMode) {
            textSpan.style.opacity = "0";
            const qm = document.createElement('span');
            qm.className = 'absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl text-gray-300 font-bold pointer-events-none question-mark';
            qm.textContent = '?';
            cardEl.appendChild(qm);
        }

        cardEl.appendChild(textSpan);
        cardEl.addEventListener('click', () => handleCardClick(cardEl));
        return cardEl;
    }

    function handleCardClick(cardEl) {
        if (!isPlaying || lockBoard || cardEl.dataset.matched === "true") return;
        const side = cardEl.dataset.side;
        
        if (side === 'left' && selectedLeftCard === cardEl) { deselectCard(cardEl); selectedLeftCard = null; return; }
        if (side === 'right' && selectedRightCard === cardEl) { deselectCard(cardEl); selectedRightCard = null; return; }

        if (side === 'left') {
            if (selectedLeftCard) deselectCard(selectedLeftCard);
            selectedLeftCard = cardEl;
        } else {
            if (selectedRightCard) deselectCard(selectedRightCard);
            selectedRightCard = cardEl;
        }

        selectCard(cardEl);

        if (selectedLeftCard && selectedRightCard) {
            moves++;
            movesEl.textContent = moves;
            checkMatch();
        }
    }

    function selectCard(cardEl) {
        cardEl.classList.add('border-blue-500', 'bg-blue-50');
        cardEl.classList.remove('border-gray-200', 'bg-white');
        if (isCoverMode) {
            cardEl.querySelector('span:not(.question-mark)').style.opacity = "1";
            if(cardEl.querySelector('.question-mark')) cardEl.querySelector('.question-mark').style.opacity = "0";
        }
    }

    function deselectCard(cardEl) {
        cardEl.classList.remove('border-blue-500', 'bg-blue-50', 'border-red-500', 'bg-red-50');
        cardEl.classList.add('border-gray-200', 'bg-white');
        if (isCoverMode && cardEl.dataset.matched !== "true") {
            cardEl.querySelector('span:not(.question-mark)').style.opacity = "0";
            if(cardEl.querySelector('.question-mark')) cardEl.querySelector('.question-mark').style.opacity = "1";
        }
    }

    function checkMatch() {
        lockBoard = true;
        const card1 = selectedLeftCard;
        const card2 = selectedRightCard;
        const isMatch = card1.dataset.pairId === card2.dataset.pairId;

        if (isMatch) {
            setTimeout(() => {
                [card1, card2].forEach(c => {
                    c.classList.remove('border-blue-500', 'bg-blue-50');
                    c.classList.add('border-green-400', 'bg-green-50');
                    c.dataset.matched = "true";
                    setTimeout(() => {
                        c.classList.add('opacity-40', 'cursor-default');
                        c.classList.remove('border-green-400', 'bg-green-50');
                        c.classList.add('border-gray-200', 'bg-gray-100');
                    }, 400);
                });
                
                matchedPairs++;
				totalScore++;
                let actualPairCount = Math.min(currentPairCount, data.length);
                progressBar.style.width = `${(matchedPairs / actualPairCount) * 100}%`;

                if (matchedPairs === actualPairCount) {
                    if (winConditionType === 'none' || (winConditionType === 'level' && currentLevel < targetLevels)) {
                        currentLevel++;
                        setTimeout(() => { renderBoard(); }, 500); 
                    } else {
                        endGame(true); 
                    }
                } else {
                    selectedLeftCard = null; selectedRightCard = null; lockBoard = false;
                }
            }, 250);
        } else {
            setTimeout(() => {
                [card1, card2].forEach(c => {
                    c.classList.remove('border-blue-500', 'bg-blue-50');
                    c.classList.add('border-red-500', 'bg-red-50');
                });
                setTimeout(() => {
                    deselectCard(card1); deselectCard(card2);
                    selectedLeftCard = null; selectedRightCard = null; lockBoard = false;
                }, 500); 
            }, 150);
        }
    }

    function triggerConfettiEffect() {
        if (typeof triggerConfetti === 'function') { triggerConfetti(); return; }
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4CAF50', '#FFEB3B', '#FF9800'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            const isTriangle = Math.random() > 0.5;
            confetti.style.position = 'fixed';
            confetti.style.left = '50%'; confetti.style.top = '30%';
            confetti.style.width = isTriangle ? '0' : `${Math.random() * 6 + 4}px`;
            confetti.style.height = isTriangle ? '0' : `${Math.random() * 10 + 6}px`;
            if (isTriangle) {
                confetti.style.borderLeft = '4px solid transparent'; confetti.style.borderRight = '4px solid transparent';
                confetti.style.borderBottom = `8px solid ${colors[Math.floor(Math.random() * colors.length)]}`;
            } else {
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            }
            confetti.style.zIndex = '9999'; confetti.style.pointerEvents = 'none';
            const angle = Math.random() * Math.PI * 2; const velocity = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity; const ty = Math.sin(angle) * velocity + 100; 
            
            confetti.animate([
                { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.8 },
                { transform: `translate(${tx * 1.5}px, ${ty * 1.5 + 200}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
            ], { duration: 1500 + Math.random() * 1000, easing: 'ease-out', fill: 'forwards' });
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    document.getElementById('btn-restart-match').addEventListener('click', resetToIdle);
    resetToIdle();
}


// =================================================================
// 遊戲渲染區：測驗題 (Quiz Game)
// =================================================================
function renderQuizGame(data, container) {
    let currentOptionCount = 4;
    let quizLayout = 'horizontal'; // horizontal, vertical, flow
    let isPlaying = false;
    
    let winConditionType = 'none'; // 'none', 'time', 'correct'
    let timeLimit = 0;
    let targetCorrect = 0;
    let questionOrder = 'random'; // 'random' 或 'sequential'

    let correctCount = 0;
    let incorrectCount = 0;
    let totalAnswered = 0;
    let secondsElapsed = 0;
    let remainingSeconds = 0;
    
    let questionPool = [];
    let currentQuestionData = null;
    let currentOptions = [];
    let isAnswered = false;

    if (window.currentQuizTimer) clearInterval(window.currentQuizTimer);
    clearTimeout(window.quizResultTimeout);

    container.innerHTML = `
        <div class="max-w-6xl mx-auto flex flex-col h-full py-4 px-2 sm:px-4 w-full relative">
            
            <div class="relative mb-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-shrink-0" style="z-index: 50;">
                
                <div class="flex flex-wrap lg:flex-nowrap justify-between items-center gap-2 sm:gap-4 p-2 sm:p-3">
                    <div class="flex items-center flex-wrap lg:flex-nowrap gap-2 w-full lg:w-auto relative">
                        <h2 class="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-1 hidden 2xl:flex">
                            <span class="material-symbols-outlined text-red-500">quiz</span> 測驗
                        </h2>
                        
                        <select id="quiz-question-order" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 sm:px-3 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-sm cursor-pointer hover:bg-gray-50 transition-colors" style="position: relative; z-index: 9999;">
                            <option value="random" selected>隨機</option>
                            <option value="sequential">依序</option>
                        </select>

                        <select id="quiz-option-count" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 sm:px-3 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-sm cursor-pointer hover:bg-gray-50 transition-colors" style="position: relative; z-index: 9999;">
                            <option value="3">3 個選項</option>
                            <option value="4" selected>4 個選項</option>
                            <option value="5">5 個選項</option>
                            <option value="6">6 個選項</option>
                        </select>

                        <select id="quiz-win-condition" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 sm:px-3 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-sm cursor-pointer hover:bg-gray-50 transition-colors" style="position: relative; z-index: 9999;">
                            <option value="none">無限制</option>
                            <optgroup label="⏱️ 限時挑戰">
                                <option value="time-30">30 秒</option>
                                <option value="time-60">60 秒</option>
                                <option value="time-90">90 秒</option>
                                <option value="time-120">120 秒</option>
                            </optgroup>
                            <optgroup label="🎯 答對目標">
                                <option value="correct-5">5 題</option>
                                <option value="correct-10" selected>10 題</option>
                                <option value="correct-20">20 題</option>
                                <option value="correct-30">30 題</option>
                            </optgroup>
                        </select>

                        <button id="btn-start-quiz" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-1 min-w-[100px] justify-center cursor-pointer">
                            <span class="material-symbols-outlined text-[18px]">play_arrow</span> <span id="btn-start-text">開始</span>
                        </button>
                    </div>
                    
                    <div class="flex items-center gap-2 sm:gap-3 text-sm font-bold text-gray-600 ml-auto xl:ml-0 flex-wrap">
                        <button id="quiz-layout-toggle" class="p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer text-gray-500 hover:text-gray-800 flex items-center" title="切換排版">
                            <span class="material-symbols-outlined text-[20px]">view_agenda</span>
                        </button>
                        
                        <div class="h-4 w-px bg-gray-300 mx-1 hidden sm:block"></div>

                        <div class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[18px] text-blue-500">timer</span>
                            <span id="quiz-timer" class="w-10 text-center text-base">00:00</span>
                        </div>
                        <div class="flex items-center gap-1" title="答對">
                            <span class="material-symbols-outlined text-[18px] text-green-500">check_circle</span>
                            <span id="quiz-correct-count" class="text-green-600 w-6 text-center text-base">0</span>
                        </div>
                        <div class="flex items-center gap-1" title="答錯">
                            <span class="material-symbols-outlined text-[18px] text-red-500">cancel</span>
                            <span id="quiz-incorrect-count" class="text-red-600 w-6 text-center text-base">0</span>
                        </div>
                    </div>
                </div>

                <div class="w-full bg-gray-100 h-1.5 relative">
                    <div id="quiz-progress-bar" class="bg-green-500 h-full transition-all duration-500 ease-out" style="width: 0%;"></div>
                </div>
            </div>
            
            <div id="quiz-board" class="flex flex-col gap-2 sm:gap-4 flex-1 pb-4 relative min-h-0" style="z-index: 1;">
                
                <div id="quiz-overlay" class="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300" style="z-index: 10;">
                    <span class="material-symbols-outlined text-5xl sm:text-6xl text-gray-400 mb-2">touch_app</span>
                    <p class="text-lg sm:text-xl font-bold text-gray-600">請設定條件並點擊開始</p>
                </div>

                <div class="flex-1 flex flex-col min-h-0 relative items-center w-full" style="z-index: 20;">
                    <div class="w-full mb-6 mt-4 flex items-center justify-center">
                        <div class="flex items-center text-center gap-3 max-w-4xl px-4">
                            <span id="quiz-question-number" class="text-2xl sm:text-3xl font-bold text-red-700"></span>
                            <h3 id="quiz-question-text" class="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-800 leading-tight"></h3>
                        </div>
                    </div>

                    <div id="quiz-options-container" class="w-full max-w-4xl px-2"></div>
                </div>
            </div>
            
            <div id="quiz-result" class="hidden absolute inset-0 flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl pointer-events-none" style="z-index: 100;">
                <div class="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center max-w-sm w-full mx-4 pointer-events-auto">
                    <div id="quiz-result-icon" class="text-6xl mb-3 z-10 animate-bounce">🏆</div>
                    <h3 id="quiz-result-title" class="text-2xl font-bold text-gray-800 mb-2 z-10">測驗完成！</h3>
                    <div class="w-full bg-gray-50 rounded-xl border border-gray-200 p-4 mb-5 flex flex-col gap-3">
                        <div id="quiz-result-target-row" class="hidden justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">目標進度</span>
                            <span id="quiz-target-result" class="font-bold text-purple-600 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">答對題數</span>
                            <span id="quiz-correct-result" class="font-bold text-green-600 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">答錯題數</span>
                            <span id="quiz-incorrect-result" class="font-bold text-red-600 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">正確率</span>
                            <span id="quiz-accuracy-result" class="font-bold text-orange-500 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 font-bold text-sm">遊戲耗時</span>
                            <span id="quiz-time-result" class="font-bold text-blue-600 text-lg"></span>
                        </div>
                    </div>
                    <button id="btn-restart-quiz" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-md transition-colors text-base flex justify-center items-center gap-1.5">
                        <span class="material-symbols-outlined text-[20px]">refresh</span> 再挑戰一次
                    </button>
                </div>
            </div>
        </div>
    `;

    // 取得 DOM
    const selectQuestionOrder = document.getElementById('quiz-question-order');
    const selectOptionCount = document.getElementById('quiz-option-count');
    const selectWinCondition = document.getElementById('quiz-win-condition');
    const btnStart = document.getElementById('btn-start-quiz');
    const btnStartText = document.getElementById('btn-start-text');
    const layoutToggle = document.getElementById('quiz-layout-toggle');
    
    const timerEl = document.getElementById('quiz-timer');
    const correctEl = document.getElementById('quiz-correct-count');
    const incorrectEl = document.getElementById('quiz-incorrect-count');
    const progressBar = document.getElementById('quiz-progress-bar');
    
    const overlay = document.getElementById('quiz-overlay');
    const resultArea = document.getElementById('quiz-result');
    const questionNumberEl = document.getElementById('quiz-question-number');
    const questionTextEl = document.getElementById('quiz-question-text');
    const optionsContainer = document.getElementById('quiz-options-container');

    // 阻擋事件冒泡
    [selectQuestionOrder, selectOptionCount, selectWinCondition].forEach(el => {
        el.addEventListener('mousedown', e => e.stopPropagation());
        el.addEventListener('touchstart', e => e.stopPropagation());
        el.addEventListener('click', e => e.stopPropagation());
    });

    // 綁定選單變更事件
    selectQuestionOrder.addEventListener('change', (e) => { questionOrder = e.target.value; resetToIdle(); });
    selectOptionCount.addEventListener('change', (e) => { currentOptionCount = parseInt(e.target.value); resetToIdle(); });
    selectWinCondition.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'none') {
            winConditionType = 'none'; timeLimit = 0; targetCorrect = 0;
        } else if (val.startsWith('time-')) {
            winConditionType = 'time'; timeLimit = parseInt(val.split('-')[1]); targetCorrect = 0;
        } else if (val.startsWith('correct-')) {
            winConditionType = 'correct'; timeLimit = 0; targetCorrect = parseInt(val.split('-')[1]);
        }
        resetToIdle();
    });

    // 初始化條件
    selectWinCondition.dispatchEvent(new Event('change'));

    // 排版切換
    layoutToggle.addEventListener('click', () => {
        const layouts = ['horizontal', 'vertical', 'flow'];
        const currentIdx = layouts.indexOf(quizLayout);
        quizLayout = layouts[(currentIdx + 1) % layouts.length];
        
        const icon = layoutToggle.querySelector('.material-symbols-outlined');
        if (quizLayout === 'horizontal') icon.textContent = 'view_agenda';
        else if (quizLayout === 'vertical') icon.textContent = 'wrap_text';
        else icon.textContent = 'view_column';
        
        if (isPlaying) renderOptions();
    });

    function formatTime(totalSeconds) {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    }

    function resetToIdle() {
        isPlaying = false;
        clearInterval(window.currentQuizTimer);
        clearTimeout(window.quizResultTimeout);

        if (winConditionType === 'time') {
            timerEl.textContent = formatTime(timeLimit);
            timerEl.classList.add('text-red-500');
        } else {
            timerEl.textContent = "00:00";
            timerEl.classList.remove('text-red-500');
        }

        correctEl.textContent = "0";
        incorrectEl.textContent = "0";
        progressBar.style.width = '0%';
        questionNumberEl.textContent = "";
        questionTextEl.textContent = "";
        optionsContainer.innerHTML = "";
        
        overlay.classList.remove('hidden');
        resultArea.classList.add('hidden'); resultArea.classList.remove('flex');
        
        btnStart.innerHTML = `<span class="material-symbols-outlined text-[18px]">play_arrow</span> <span id="btn-start-text">開始</span>`;
        btnStart.classList.remove('bg-red-500', 'hover:bg-red-600'); 
        btnStart.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }

    btnStart.addEventListener('click', () => {
        if (isPlaying) {
            // ✨ 修改：若沒有作答或沒答對半題，直接重設；否則顯示結算畫面
            if (totalAnswered === 0 || correctCount === 0) {
                resetToIdle();
            } else {
                endGame(true); 
            }
            return;
        }

        isPlaying = true;
        correctCount = 0;
        incorrectCount = 0;
        totalAnswered = 0;
        secondsElapsed = 0;
        remainingSeconds = timeLimit;
        
        btnStart.innerHTML = `<span class="material-symbols-outlined text-[18px]">stop</span> <span id="btn-start-text">停止</span>`;
        btnStart.classList.remove('bg-blue-600', 'hover:bg-blue-700'); 
        btnStart.classList.add('bg-red-500', 'hover:bg-red-600');
        
        correctEl.textContent = correctCount;
        incorrectEl.textContent = incorrectCount;
        overlay.classList.add('hidden');

        clearInterval(window.currentQuizTimer);
        window.currentQuizTimer = setInterval(() => {
            if (winConditionType === 'time') {
                remainingSeconds--;
                timerEl.textContent = formatTime(remainingSeconds);
                if (remainingSeconds <= 0) {
                    endGame(false); 
                }
            } else {
                secondsElapsed++;
                timerEl.textContent = formatTime(secondsElapsed);
            }
        }, 1000);

        if (questionOrder === 'random') {
            questionPool = [...data].sort(() => Math.random() - 0.5);
        } else {
            questionPool = [...data].reverse();
        }
        
        loadQuestion();
    });

    function loadQuestion() {
        if (questionPool.length === 0) {
            if (questionOrder === 'random') {
                questionPool = [...data].sort(() => Math.random() - 0.5);
            } else {
                questionPool = [...data].reverse();
            }
        }
        currentQuestionData = questionPool.pop();
        isAnswered = false;
        
        questionNumberEl.textContent = `${totalAnswered + 1}.`;
        questionTextEl.textContent = currentQuestionData.term;

        let options = [currentQuestionData.definition];
        let wrongOptions = data.filter(d => d.definition !== currentQuestionData.definition).map(d => d.definition);
        
        wrongOptions = [...new Set(wrongOptions)];
        wrongOptions.sort(() => Math.random() - 0.5);
        
        let neededWrongOptions = Math.min(currentOptionCount - 1, wrongOptions.length);
        options.push(...wrongOptions.slice(0, neededWrongOptions));
        options.sort(() => Math.random() - 0.5); 
        
        currentOptions = options;
        renderOptions();
    }

    function renderOptions() {
        let containerClass = '';
        let btnClasses = '';
        
        if (quizLayout === 'horizontal') {
            containerClass = 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4';
            btnClasses = 'px-4 py-3 sm:px-6 sm:py-4 text-lg sm:text-xl';
        } else if (quizLayout === 'vertical') {
            containerClass = 'flex flex-col gap-3';
            btnClasses = 'w-full px-5 py-3 text-lg';
        } else { // flow
            containerClass = 'flex flex-wrap justify-center gap-3';
            btnClasses = 'px-5 py-2.5 text-lg';
        }

        optionsContainer.className = `w-full max-w-4xl px-2 ${containerClass}`;
        optionsContainer.innerHTML = '';

        currentOptions.forEach((opt, index) => {
            const prefix = quizLayout !== 'flow' ? `${String.fromCharCode(65 + index)}. ` : '';
            const btn = document.createElement('button');
            btn.className = `quiz-option bg-white border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-800 rounded-xl transition-all duration-200 text-left shadow-sm ${btnClasses}`;
            btn.textContent = prefix + opt;
            btn.dataset.answer = opt;
            
            btn.addEventListener('click', () => handleOptionClick(btn, opt));
            optionsContainer.appendChild(btn);
        });
    }

    function handleOptionClick(btn, selectedOption) {
        if (isAnswered || !isPlaying) return;
        isAnswered = true;
        totalAnswered++;

        const isCorrect = selectedOption === currentQuestionData.definition;
        
        Array.from(optionsContainer.children).forEach(b => {
            b.classList.remove('hover:border-gray-400', 'hover:bg-gray-50', 'cursor-pointer');
            b.style.pointerEvents = 'none';
            
            if (b.dataset.answer === currentQuestionData.definition) {
                b.classList.replace('border-gray-200', 'border-green-500');
                b.classList.add('bg-green-50', 'text-green-700');
                if (isCorrect) showConfetti(b);
            } else if (b === btn && !isCorrect) {
                b.classList.replace('border-gray-200', 'border-red-500');
                b.classList.add('bg-red-50', 'text-red-700');
            }
        });

        if (isCorrect) {
            correctCount++;
            correctEl.textContent = correctCount;
        } else {
            incorrectCount++;
            incorrectEl.textContent = incorrectCount;
        }

        if (winConditionType === 'correct') {
            progressBar.style.width = `${Math.min((correctCount / targetCorrect) * 100, 100)}%`;
        }

        if (winConditionType === 'correct' && correctCount >= targetCorrect) {
            setTimeout(() => endGame(true), 1200);
            return;
        }

        setTimeout(() => {
            if (isPlaying) loadQuestion();
        }, 1200);
    }

    function endGame(isSuccess) {
        clearInterval(window.currentQuizTimer);
        isPlaying = false;

        const resultTitle = document.getElementById('quiz-result-title');
        const resultIcon = document.getElementById('quiz-result-icon');
        const targetResultRow = document.getElementById('quiz-result-target-row');
        const targetResult = document.getElementById('quiz-target-result');
        
        if (isSuccess) {
            resultIcon.textContent = '🏆';
            resultTitle.textContent = (winConditionType === 'correct' || winConditionType === 'none') ? '測驗完成！' : '時間到！';
            resultTitle.className = 'text-2xl font-bold text-gray-800 mb-2 z-10';
            if (winConditionType === 'correct' || winConditionType === 'none') triggerGlobalConfetti();
        } else {
            resultIcon.textContent = '⏱️';
            resultTitle.textContent = '時間到！任務失敗';
            resultTitle.className = 'text-2xl font-bold text-red-600 mb-2 z-10';
        }

        if (winConditionType === 'correct') {
            targetResultRow.classList.remove('hidden');
            targetResultRow.classList.add('flex');
            targetResult.textContent = `${correctCount} / ${targetCorrect} 題`;
            targetResult.className = isSuccess ? 'font-bold text-purple-600 text-xl' : 'font-bold text-red-500 text-xl';
        } else {
            targetResultRow.classList.add('hidden');
            targetResultRow.classList.remove('flex');
        }

        window.quizResultTimeout = setTimeout(() => {
            resultArea.classList.remove('hidden');
            resultArea.classList.add('flex');
            
            const timeSpent = winConditionType === 'time' ? (timeLimit - remainingSeconds) : secondsElapsed;
            const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
            
            document.getElementById('quiz-time-result').textContent = formatTime(timeSpent);
            document.getElementById('quiz-correct-result').textContent = correctCount;
            document.getElementById('quiz-incorrect-result').textContent = incorrectCount;
            document.getElementById('quiz-accuracy-result').textContent = `${accuracy}%`;
            
            btnStart.innerHTML = `<span class="material-symbols-outlined text-[18px]">play_arrow</span> <span id="btn-start-text">開始</span>`;
            btnStart.classList.remove('bg-red-500', 'hover:bg-red-600'); 
            btnStart.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }, 500);
    }

    function showConfetti(element) {
        element.classList.add('scale-105');
        setTimeout(() => element.classList.remove('scale-105'), 300);
    }

    function triggerGlobalConfetti() {
        if (typeof triggerConfetti === 'function') { triggerConfetti(); return; }
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4CAF50', '#FFEB3B', '#FF9800'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            const isTriangle = Math.random() > 0.5;
            confetti.style.position = 'fixed';
            confetti.style.left = '50%'; confetti.style.top = '30%';
            confetti.style.width = isTriangle ? '0' : `${Math.random() * 6 + 4}px`;
            confetti.style.height = isTriangle ? '0' : `${Math.random() * 10 + 6}px`;
            if (isTriangle) {
                confetti.style.borderLeft = '4px solid transparent'; confetti.style.borderRight = '4px solid transparent';
                confetti.style.borderBottom = `8px solid ${colors[Math.floor(Math.random() * colors.length)]}`;
            } else {
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            }
            confetti.style.zIndex = '9999'; confetti.style.pointerEvents = 'none';
            const angle = Math.random() * Math.PI * 2; const velocity = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity; const ty = Math.sin(angle) * velocity + 100; 
            
            confetti.animate([
                { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.8 },
                { transform: `translate(${tx * 1.5}px, ${ty * 1.5 + 200}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
            ], { duration: 1500 + Math.random() * 1000, easing: 'ease-out', fill: 'forwards' });
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    document.getElementById('btn-restart-quiz').addEventListener('click', resetToIdle);
}



// =================================================================
// 遊戲渲染區：排序遊戲 (Sorting Game) - 優雅置中 + 題號修復版
// =================================================================
function renderSortingGame(data, container) {
    let splitMode = 'auto'; // 'auto', 'char', 'space'
    let questionOrder = 'random'; // 'random' 或 'sequential'
    
    let winConditionType = 'none'; // 'none', 'time', 'correct'
    let timeLimit = 0;
    let targetCorrect = 0;

    let isPlaying = false;
    let correctCount = 0;
    let incorrectCount = 0;
    let totalAnswered = 0;
    let secondsElapsed = 0;
    let remainingSeconds = 0;
    
    let questionPool = [];
    let currentQuestionData = null;
    let originalWordObjects = [];
    let shuffledWordObjects = [];
    let userOrderObjects = [];
    let fixedCount = 0;
    let isChecking = false;

    if (window.currentSortingTimer) clearInterval(window.currentSortingTimer);
    clearTimeout(window.sortingResultTimeout);

    container.innerHTML = `
        <div class="max-w-6xl mx-auto flex flex-col h-full py-4 px-2 sm:px-4 w-full relative">
            
            <div class="relative mb-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-shrink-0" style="z-index: 50;">
                
                <div class="flex flex-wrap lg:flex-nowrap justify-between items-center gap-2 sm:gap-4 p-2 sm:p-3">
                    <div class="flex items-center flex-wrap lg:flex-nowrap gap-2 w-full lg:w-auto relative">
                        <h2 class="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-1 hidden 2xl:flex">
                            <span class="material-symbols-outlined text-indigo-500">sort</span> 排序
                        </h2>
                        
                        <select id="sort-question-order" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 sm:px-3 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-sm cursor-pointer hover:bg-gray-50 transition-colors" style="position: relative; z-index: 9999;">
                            <option value="random" selected>隨機</option>
                            <option value="sequential">依序</option>
                        </select>

                        <select id="sort-split-mode" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 sm:px-3 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-sm cursor-pointer hover:bg-gray-50 transition-colors" style="position: relative; z-index: 9999;">
                            <option value="auto" selected>自動分割</option>
                            <option value="char">逐字分割</option>
                            <option value="space">空格分割</option>
                        </select>

                        <select id="sort-win-condition" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 sm:px-3 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-sm cursor-pointer hover:bg-gray-50 transition-colors" style="position: relative; z-index: 9999;">
                            <option value="none">無限制</option>
                            <optgroup label="⏱️ 限時挑戰">
                                <option value="time-30">30 秒</option>
                                <option value="time-60">60 秒</option>
                                <option value="time-90">90 秒</option>
                                <option value="time-120">120 秒</option>
                            </optgroup>
                            <optgroup label="🎯 答對目標">
                                <option value="correct-5">5 題</option>
                                <option value="correct-10" selected>10 題</option>
                                <option value="correct-20">20 題</option>
                                <option value="correct-30">30 題</option>
                            </optgroup>
                        </select>

                        <button id="btn-start-sort" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-1 min-w-[100px] justify-center cursor-pointer">
                            <span class="material-symbols-outlined text-[18px]">play_arrow</span> <span id="btn-start-text">開始</span>
                        </button>
                    </div>
                    
                    <div class="flex items-center gap-2 sm:gap-3 text-sm font-bold text-gray-600 ml-auto xl:ml-0 flex-wrap">
                        <div class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[18px] text-blue-500">timer</span>
                            <span id="sort-timer" class="w-10 text-center text-base">00:00</span>
                        </div>
                        <div class="flex items-center gap-1" title="答對">
                            <span class="material-symbols-outlined text-[18px] text-green-500">check_circle</span>
                            <span id="sort-correct-count" class="text-green-600 w-6 text-center text-base">0</span>
                        </div>
                        <div class="flex items-center gap-1" title="答錯">
                            <span class="material-symbols-outlined text-[18px] text-red-500">cancel</span>
                            <span id="sort-incorrect-count" class="text-red-600 w-6 text-center text-base">0</span>
                        </div>
                    </div>
                </div>

                <div class="w-full bg-gray-100 h-1.5 relative">
                    <div id="sort-progress-bar" class="bg-indigo-500 h-full transition-all duration-500 ease-out" style="width: 0%;"></div>
                </div>
            </div>
            
            <div id="sort-board" class="flex flex-col gap-2 sm:gap-4 flex-1 pb-4 relative min-h-0" style="z-index: 1;">
                
                <div id="sort-overlay" class="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300" style="z-index: 10;">
                    <span class="material-symbols-outlined text-5xl sm:text-6xl text-gray-400 mb-2">touch_app</span>
                    <p class="text-lg sm:text-xl font-bold text-gray-600">請設定條件並點擊開始</p>
                </div>

                <div class="flex-1 flex flex-col min-h-0 relative items-center w-full" style="z-index: 20;">
                    
                    <div class="w-full mb-4 mt-2 flex items-center justify-center">
                        <div class="flex items-center text-center gap-3 max-w-4xl px-4">
                            <span id="sort-question-number" class="text-2xl sm:text-3xl font-bold text-indigo-700"></span>
                            <h3 id="sort-question-text" class="text-2xl sm:text-3xl lg:text-4xl font-bold text-indigo-800 leading-tight"></h3>
                        </div>
                    </div>

                    <div class="w-full max-w-4xl bg-gray-50 rounded-2xl p-4 sm:p-6 mb-6 min-h-[100px] border border-gray-200 shadow-inner flex items-center justify-center">
                        <div id="sort-target" class="flex gap-2 sm:gap-3 flex-wrap justify-center items-center w-full"></div>
                    </div>

                    <div id="sort-word-bank" class="w-full max-w-4xl flex gap-2 sm:gap-3 flex-wrap justify-center mb-8 min-h-[80px] items-center"></div>

                    <div class="flex gap-4 justify-center mt-auto">
                        <button id="btn-check-sort" class="px-10 py-3 rounded-2xl font-bold transition-colors bg-gray-200 text-gray-400 cursor-not-allowed shadow-sm text-lg tracking-widest" disabled>檢查</button>
                    </div>
                </div>
            </div>
            
            <div id="sort-result" class="hidden absolute inset-0 flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl pointer-events-none" style="z-index: 100;">
                <div class="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center max-w-sm w-full mx-4 pointer-events-auto">
                    <div id="sort-result-icon" class="text-6xl mb-3 z-10 animate-bounce">🏆</div>
                    <h3 id="sort-result-title" class="text-2xl font-bold text-gray-800 mb-2 z-10">排序完成！</h3>
                    <div class="w-full bg-gray-50 rounded-xl border border-gray-200 p-4 mb-5 flex flex-col gap-3">
                        <div id="sort-result-target-row" class="hidden justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">目標進度</span>
                            <span id="sort-target-result" class="font-bold text-purple-600 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">答對題數</span>
                            <span id="sort-correct-result" class="font-bold text-green-600 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">答錯題數</span>
                            <span id="sort-incorrect-result" class="font-bold text-red-600 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">正確率</span>
                            <span id="sort-accuracy-result" class="font-bold text-orange-500 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 font-bold text-sm">遊戲耗時</span>
                            <span id="sort-time-result" class="font-bold text-blue-600 text-lg"></span>
                        </div>
                    </div>
                    <button id="btn-restart-sort" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-md transition-colors text-base flex justify-center items-center gap-1.5">
                        <span class="material-symbols-outlined text-[20px]">refresh</span> 再挑戰一次
                    </button>
                </div>
            </div>
        </div>
    `;

    // 取得 DOM
    const selectQuestionOrder = document.getElementById('sort-question-order');
    const selectSplitMode = document.getElementById('sort-split-mode');
    const selectWinCondition = document.getElementById('sort-win-condition');
    const btnStart = document.getElementById('btn-start-sort');
    const btnStartText = document.getElementById('btn-start-text');
    
    const timerEl = document.getElementById('sort-timer');
    const correctEl = document.getElementById('sort-correct-count');
    const incorrectEl = document.getElementById('sort-incorrect-count');
    const progressBar = document.getElementById('sort-progress-bar');
    
    const overlay = document.getElementById('sort-overlay');
    const resultArea = document.getElementById('sort-result');
    const questionNumberEl = document.getElementById('sort-question-number');
    const questionTextEl = document.getElementById('sort-question-text');
    const targetArea = document.getElementById('sort-target');
    const wordBankArea = document.getElementById('sort-word-bank');
    const btnCheck = document.getElementById('btn-check-sort');

    // 阻擋事件冒泡
    [selectQuestionOrder, selectSplitMode, selectWinCondition].forEach(el => {
        el.addEventListener('mousedown', e => e.stopPropagation());
        el.addEventListener('touchstart', e => e.stopPropagation());
        el.addEventListener('click', e => e.stopPropagation());
    });

    // 綁定選單變更事件
    selectQuestionOrder.addEventListener('change', (e) => { questionOrder = e.target.value; resetToIdle(); });
    selectSplitMode.addEventListener('change', (e) => { splitMode = e.target.value; resetToIdle(); });
    selectWinCondition.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'none') {
            winConditionType = 'none'; timeLimit = 0; targetCorrect = 0;
        } else if (val.startsWith('time-')) {
            winConditionType = 'time'; timeLimit = parseInt(val.split('-')[1]); targetCorrect = 0;
        } else if (val.startsWith('correct-')) {
            winConditionType = 'correct'; timeLimit = 0; targetCorrect = parseInt(val.split('-')[1]);
        }
        resetToIdle();
    });

    // 初始化條件
    selectWinCondition.dispatchEvent(new Event('change'));

    function formatTime(totalSeconds) {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    }

    function resetToIdle() {
        isPlaying = false;
        isChecking = false;
        clearInterval(window.currentSortingTimer);
        clearTimeout(window.sortingResultTimeout);

        if (winConditionType === 'time') {
            timerEl.textContent = formatTime(timeLimit);
            timerEl.classList.add('text-red-500');
        } else {
            timerEl.textContent = "00:00";
            timerEl.classList.remove('text-red-500');
        }

        correctEl.textContent = "0";
        incorrectEl.textContent = "0";
        progressBar.style.width = '0%';
        questionNumberEl.textContent = "";
        questionTextEl.textContent = "";
        targetArea.innerHTML = "";
        wordBankArea.innerHTML = "";
        
        // 恢復檢查按鈕狀態
        btnCheck.disabled = true;
        btnCheck.className = 'px-10 py-3 rounded-2xl font-bold transition-colors bg-gray-200 text-gray-400 cursor-not-allowed shadow-sm text-lg tracking-widest';
        
        overlay.classList.remove('hidden');
        resultArea.classList.add('hidden'); resultArea.classList.remove('flex');
        
        // 恢復開始按鈕 (藍色)
        btnStart.innerHTML = `<span class="material-symbols-outlined text-[18px]">play_arrow</span> <span id="btn-start-text">開始</span>`;
        btnStart.classList.remove('bg-red-500', 'hover:bg-red-600'); 
        btnStart.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }

    btnStart.addEventListener('click', () => {
        if (isPlaying) {
            if (totalAnswered === 0) {
                resetToIdle();
            } else {
                if (winConditionType === 'none') endGame(true); 
                else resetToIdle(); 
            }
            return;
        }

        isPlaying = true;
        isChecking = false;
        correctCount = 0;
        incorrectCount = 0;
        totalAnswered = 0;
        secondsElapsed = 0;
        remainingSeconds = timeLimit;
        
        // 切換為停止按鈕 (紅色)
        btnStart.innerHTML = `<span class="material-symbols-outlined text-[18px]">stop</span> <span id="btn-start-text">停止</span>`;
        btnStart.classList.remove('bg-blue-600', 'hover:bg-blue-700'); 
        btnStart.classList.add('bg-red-500', 'hover:bg-red-600');
        
        correctEl.textContent = correctCount;
        incorrectEl.textContent = incorrectCount;
        overlay.classList.add('hidden');

        clearInterval(window.currentSortingTimer);
        window.currentSortingTimer = setInterval(() => {
            if (winConditionType === 'time') {
                remainingSeconds--;
                timerEl.textContent = formatTime(remainingSeconds);
                if (remainingSeconds <= 0) {
                    endGame(false); 
                }
            } else {
                secondsElapsed++;
                timerEl.textContent = formatTime(secondsElapsed);
            }
        }, 1000);

        if (questionOrder === 'random') {
            questionPool = [...data].sort(() => Math.random() - 0.5);
        } else {
            questionPool = [...data].reverse();
        }
        
        loadQuestion();
    });

    function loadQuestion() {
        if (questionPool.length === 0) {
            if (questionOrder === 'random') {
                questionPool = [...data].sort(() => Math.random() - 0.5);
            } else {
                questionPool = [...data].reverse();
            }
        }
        currentQuestionData = questionPool.pop();
        isChecking = false;
        
        // ✨ 修正這裡：題號改為依據「答對題數」加一，而非「點擊檢查次數」
        questionNumberEl.textContent = `${correctCount + 1}.`;
        questionTextEl.textContent = currentQuestionData.term;

        // 核心：智慧分割定義文字
        let defText = currentQuestionData.definition;
        let parts = [];
        
        if (splitMode === 'auto') {
            if (defText.includes(' ') || defText.includes('　')) {
                parts = defText.split(/\s+/).filter(w => w.trim() !== '');
            } else {
                parts = Array.from(defText);
            }
        } else if (splitMode === 'space') {
            parts = defText.split(/\s+/).filter(w => w.trim() !== '');
        } else { // 'char'
            parts = Array.from(defText);
        }

        // 防呆：如果分割後只有一塊，還是讓它玩
        if (parts.length === 0) parts = ['(無內容)'];

        originalWordObjects = parts.map((text, idx) => ({ id: idx, display: text }));

        let fixedObjects = [];
        let shuffleObjects = [...originalWordObjects];
        fixedCount = 0;

        // 防呆機制：如果長度大於 6，自動固定前面幾個
        if (originalWordObjects.length > 6) {
            fixedCount = originalWordObjects.length - 6;
            fixedObjects = originalWordObjects.slice(0, fixedCount);
            shuffleObjects = originalWordObjects.slice(fixedCount);
        }

        userOrderObjects = [...fixedObjects];
        shuffledWordObjects = shuffleObjects.sort(() => Math.random() - 0.5);

        renderSortingArea();
    }

    function renderSortingArea() {
        // 渲染目標區 (加入完美的 flex 與 padding 置中設定)
        targetArea.innerHTML = userOrderObjects.map((wordObj, index) => {
            if (index < fixedCount) {
                return `<div class="bg-green-600 text-white px-4 py-2.5 rounded-xl cursor-default shadow-sm text-lg md:text-xl font-bold flex items-center justify-center min-w-[3.5rem] min-h-[3.5rem] leading-none select-none">${wordObj.display}</div>`;
            } else {
                return `<div class="bg-indigo-500 text-white px-4 py-2.5 rounded-xl cursor-pointer hover:-translate-y-1 transition-transform shadow-sm text-lg md:text-xl font-bold flex items-center justify-center min-w-[3.5rem] min-h-[3.5rem] leading-none select-none" data-target-idx="${index}">${wordObj.display}</div>`;
            }
        }).join("");
        
        if (userOrderObjects.length === 0) {
            targetArea.innerHTML = `<div class="invisible px-4 py-2">　</div>`;
        }

        // 渲染待選區 (加入完美的 flex 與 padding 置中設定)
        wordBankArea.innerHTML = shuffledWordObjects.map((wordObj, index) => {
            return `<div class="bg-white border-2 border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all shadow-sm text-lg md:text-xl font-bold flex items-center justify-center min-w-[3.5rem] min-h-[3.5rem] leading-none select-none" data-bank-idx="${index}">${wordObj.display}</div>`;
        }).join("");

        if (shuffledWordObjects.length === 0) {
            wordBankArea.innerHTML = `<div class="invisible px-4 py-2">　</div>`;
        }

        // 更新檢查按鈕狀態
        const canCheck = userOrderObjects.length === originalWordObjects.length && !isChecking;
        btnCheck.disabled = !canCheck;
        
        if (canCheck) {
            btnCheck.className = 'px-10 py-3 rounded-2xl font-bold transition-colors bg-green-500 hover:bg-green-600 text-white shadow-md text-lg tracking-widest cursor-pointer';
        } else {
            btnCheck.className = 'px-10 py-3 rounded-2xl font-bold transition-colors bg-gray-200 text-gray-400 cursor-not-allowed shadow-sm text-lg tracking-widest';
        }

        // 綁定點擊事件
        targetArea.querySelectorAll('div[data-target-idx]').forEach(el => {
            el.addEventListener('click', () => {
                if (isChecking) return;
                const idx = parseInt(el.dataset.targetIdx);
                const wordObj = userOrderObjects[idx];
                userOrderObjects.splice(idx, 1);
                shuffledWordObjects.push(wordObj);
                renderSortingArea();
            });
        });

        wordBankArea.querySelectorAll('div[data-bank-idx]').forEach(el => {
            el.addEventListener('click', () => {
                if (isChecking) return;
                const idx = parseInt(el.dataset.bankIdx);
                const wordObj = shuffledWordObjects[idx];
                shuffledWordObjects.splice(idx, 1);
                userOrderObjects.push(wordObj);
                renderSortingArea();
            });
        });
    }

    btnCheck.addEventListener('click', () => {
        if (!isPlaying || isChecking) return;
        isChecking = true;
        totalAnswered++; // 這邊的 totalAnswered 代表「檢查作答的總次數 (嘗試次數)」，不影響題號，但用於計算正確率

        // 檢查順序是否完全正確
        const isCorrect = userOrderObjects.every((obj, index) => obj.id === originalWordObjects[index].id);

        if (isCorrect) {
            correctCount++;
            correctEl.textContent = correctCount;
            
            // 將所有區塊變為綠色
            targetArea.querySelectorAll('div').forEach(el => {
                el.className = 'bg-green-600 text-white px-4 py-2.5 rounded-xl cursor-default shadow-md text-lg md:text-xl font-bold flex items-center justify-center min-w-[3.5rem] min-h-[3.5rem] leading-none select-none scale-105 transition-transform';
                setTimeout(() => el.classList.remove('scale-105'), 300);
            });
            showConfetti(targetArea);

            if (winConditionType === 'correct') {
                progressBar.style.width = `${Math.min((correctCount / targetCorrect) * 100, 100)}%`;
            }

            if (winConditionType === 'correct' && correctCount >= targetCorrect) {
                setTimeout(() => endGame(true), 1500);
                return;
            }

            setTimeout(() => {
                if (isPlaying) loadQuestion();
            }, 1500);

        } else {
            incorrectCount++;
            incorrectEl.textContent = incorrectCount;
            
            // 找出答錯的部分
            let correctLen = 0;
            for (let i = 0; i < userOrderObjects.length; i++) {
                if (userOrderObjects[i].id === originalWordObjects[i].id) {
                    correctLen++;
                } else {
                    break;
                }
            }

            // 讓答錯的方塊震動並標紅
            const wrongElements = Array.from(targetArea.children).slice(correctLen);
            wrongElements.forEach(el => {
                el.classList.replace('bg-indigo-500', 'bg-red-500');
                el.classList.add('animate-pulse');
            });

            setTimeout(() => {
                // 將錯的部分退回待選區
                const wrongPart = userOrderObjects.slice(correctLen);
                userOrderObjects.splice(correctLen);
                shuffledWordObjects.push(...wrongPart);
                isChecking = false;
                renderSortingArea();
            }, 800);
        }
    });

    function endGame(isSuccess) {
        clearInterval(window.currentSortingTimer);
        isPlaying = false;

        const resultTitle = document.getElementById('sort-result-title');
        const resultIcon = document.getElementById('sort-result-icon');
        const targetResultRow = document.getElementById('sort-result-target-row');
        const targetResult = document.getElementById('sort-target-result');
        
        if (isSuccess) {
            resultIcon.textContent = '🏆';
            resultTitle.textContent = (winConditionType === 'correct' || winConditionType === 'none') ? '排序完成！' : '時間到！';
            resultTitle.className = 'text-2xl font-bold text-gray-800 mb-2 z-10';
            if (winConditionType === 'correct' || winConditionType === 'none') triggerGlobalConfetti();
        } else {
            resultIcon.textContent = '⏱️';
            resultTitle.textContent = '時間到！任務失敗';
            resultTitle.className = 'text-2xl font-bold text-red-600 mb-2 z-10';
        }

        if (winConditionType === 'correct') {
            targetResultRow.classList.remove('hidden');
            targetResultRow.classList.add('flex');
            targetResult.textContent = `${correctCount} / ${targetCorrect} 題`;
            targetResult.className = isSuccess ? 'font-bold text-purple-600 text-xl' : 'font-bold text-red-500 text-xl';
        } else {
            targetResultRow.classList.add('hidden');
            targetResultRow.classList.remove('flex');
        }

        window.sortingResultTimeout = setTimeout(() => {
            resultArea.classList.remove('hidden');
            resultArea.classList.add('flex');
            
            const timeSpent = winConditionType === 'time' ? (timeLimit - remainingSeconds) : secondsElapsed;
            // 這裡的 totalAnswered 作為分母正好是「嘗試總次數」，這樣算出來的才是真實的「檢查正確率」
            const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
            
            document.getElementById('sort-time-result').textContent = formatTime(timeSpent);
            document.getElementById('sort-correct-result').textContent = correctCount;
            document.getElementById('sort-incorrect-result').textContent = incorrectCount;
            document.getElementById('sort-accuracy-result').textContent = `${accuracy}%`;
            
            // 恢復開始按鈕藍色
            btnStart.innerHTML = `<span class="material-symbols-outlined text-[18px]">play_arrow</span> <span id="btn-start-text">開始</span>`;
            btnStart.classList.remove('bg-red-500', 'hover:bg-red-600'); 
            btnStart.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }, 500);
    }

    function showConfetti(element) {
        element.classList.add('scale-105');
        setTimeout(() => element.classList.remove('scale-105'), 300);
    }

    function triggerGlobalConfetti() {
        if (typeof triggerConfetti === 'function') { triggerConfetti(); return; }
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4CAF50', '#FFEB3B', '#FF9800'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            const isTriangle = Math.random() > 0.5;
            confetti.style.position = 'fixed';
            confetti.style.left = '50%'; confetti.style.top = '30%';
            confetti.style.width = isTriangle ? '0' : `${Math.random() * 6 + 4}px`;
            confetti.style.height = isTriangle ? '0' : `${Math.random() * 10 + 6}px`;
            if (isTriangle) {
                confetti.style.borderLeft = '4px solid transparent'; confetti.style.borderRight = '4px solid transparent';
                confetti.style.borderBottom = `8px solid ${colors[Math.floor(Math.random() * colors.length)]}`;
            } else {
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            }
            confetti.style.zIndex = '9999'; confetti.style.pointerEvents = 'none';
            const angle = Math.random() * Math.PI * 2; const velocity = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity; const ty = Math.sin(angle) * velocity + 100; 
            
            confetti.animate([
                { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.8 },
                { transform: `translate(${tx * 1.5}px, ${ty * 1.5 + 200}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
            ], { duration: 1500 + Math.random() * 1000, easing: 'ease-out', fill: 'forwards' });
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    document.getElementById('btn-restart-sort').addEventListener('click', resetToIdle);
}












// =================================================================
// 遊戲渲染區：打字遊戲 (Typing Game) - 優化美化版
// =================================================================
function renderTypingGame(data, container) {
    let subMode = 'single'; // 'single', 'multi', 'continuous'
    let questionOrder = 'random'; // 'random', 'sequential'
    let winConditionType = 'none'; // 'none', 'time', 'count'
    let timeLimit = 0;
    let targetCount = 10;
    
    let isPlaying = false;
    let currentData = [];
    let currentIndex = 0;
    let correctCount = 0;
    let secondsElapsed = 0;
    let remainingSeconds = 0;

    if (window.currentTypingTimer) clearInterval(window.currentTypingTimer);

    // 1. 介面佈局渲染
    container.innerHTML = `
        <div class="max-w-5xl mx-auto flex flex-col h-full py-4 px-2 sm:px-4 w-full relative font-normal">
            
            <div class="relative mb-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-shrink-0" style="z-index: 50;">
                <div class="flex flex-wrap lg:flex-nowrap justify-between items-center gap-2 p-2 sm:p-3">
                    <div class="flex items-center flex-wrap gap-2">
                        <select id="typing-submode" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 rounded-lg text-sm cursor-pointer outline-none relative z-50">
                            <option value="single" selected>單題闖關</option>
                            <option value="multi">多題檢查</option>
                            <option value="continuous">連續文章</option>
                        </select>

                        <select id="typing-order" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 rounded-lg text-sm cursor-pointer outline-none relative z-50">
                            <option value="random" selected>隨機</option>
                            <option value="sequential">依序</option>
                        </select>

                        <select id="typing-win-condition" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 rounded-lg text-sm cursor-pointer outline-none relative z-50">
                            <option value="none">無限制</option>
                            <optgroup label="⏱️ 限時挑戰">
                                <option value="time-60">60 秒</option>
                                <option value="time-120">120 秒</option>
                                <option value="time-180">180 秒</option>
                            </optgroup>
                            <optgroup label="🎯 題數目標">
                                <option value="count-5">5 題</option>
                                <option value="count-10" selected>10 題</option>
                                <option value="count-20">20 題</option>
                            </optgroup>
                        </select>

                        <button id="btn-start-typing" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition-colors text-sm flex items-center gap-1 min-w-[80px] justify-center cursor-pointer">
                            <span class="material-symbols-outlined text-[18px]">play_arrow</span> <span id="btn-start-text">開始</span>
                        </button>
                    </div>
                    
                    <div class="flex items-center gap-3 text-sm text-gray-600">
                        <button id="btn-ime-typing" class="ime-toggle-button flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg cursor-pointer">
                            <span class="material-symbols-outlined text-[18px] text-blue-600">keyboard</span> 鍵盤
                        </button>
                        <div class="flex items-center gap-1 min-w-[60px] justify-center">
                            <span class="material-symbols-outlined text-[18px] text-blue-500">timer</span>
                            <span id="typing-timer">00:00</span>
                        </div>
                        <div class="flex items-center gap-1 min-w-[60px] justify-center">
                            <span class="material-symbols-outlined text-[18px] text-green-500">check_circle</span>
                            <span id="typing-score">0</span>
                        </div>
                    </div>
                </div>
                <div class="w-full bg-gray-100 h-1 relative">
                    <div id="typing-progress-bar" class="bg-teal-500 h-full transition-all duration-500" style="width: 0%;"></div>
                </div>
            </div>
            
            <div id="typing-board" class="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 relative overflow-y-auto scrollbar-thin">
                <div id="typing-overlay" class="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
                    <span class="material-symbols-outlined text-5xl text-gray-300 mb-2">keyboard</span>
                    <p class="text-gray-500">請設定並點擊開始</p>
                </div>
                <div id="typing-main-content" class="p-4 md:p-8 flex flex-col items-center justify-start w-full flex-1 min-h-full relative"></div>
            </div>

            <div id="typing-result" class="hidden absolute inset-0 flex-col items-center justify-center bg-white/95 z-[100] rounded-2xl"></div>
        </div>
    `;

    // 取得 DOM 元素
    const mainContent = document.getElementById('typing-main-content');
    const timerEl = document.getElementById('typing-timer');
    const scoreEl = document.getElementById('typing-score');
    const progressBar = document.getElementById('typing-progress-bar');
    const btnStart = document.getElementById('btn-start-typing');
    const btnStartText = document.getElementById('btn-start-text');
    const submodeSelect = document.getElementById('typing-submode');
    const orderSelect = document.getElementById('typing-order');
    const conditionSelect = document.getElementById('typing-win-condition');

    [submodeSelect, orderSelect, conditionSelect].forEach(el => {
        el.addEventListener('mousedown', e => e.stopPropagation());
        el.addEventListener('touchstart', e => e.stopPropagation());
        el.addEventListener('click', e => e.stopPropagation());
        
        el.addEventListener('change', () => {
            if (isPlaying) resetToIdle();
        });
    });

    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    function resetToIdle() {
        isPlaying = false;
        clearInterval(window.currentTypingTimer);
        mainContent.innerHTML = '';
        document.getElementById('typing-overlay').classList.remove('hidden');
        btnStartText.textContent = "開始";
        btnStart.querySelector('.material-symbols-outlined').textContent = "play_arrow";
        btnStart.classList.remove('bg-red-500', 'hover:bg-red-600');
        btnStart.classList.add('bg-blue-600', 'hover:bg-blue-700');
        progressBar.style.width = '0%';
        scoreEl.textContent = "0";
        timerEl.textContent = "00:00";
    }

    // 2. 開始與停止邏輯 (含防呆結算機制)
    btnStart.addEventListener('click', () => {
        if (isPlaying) { 
            // ✨ 中途停止邏輯：判斷是否已經有作答，若有則觸發結算
            if (subMode === 'multi') {
                const inputs = document.querySelectorAll('.multi-typing-input');
                const hasAnswer = Array.from(inputs).some(input => input.value.trim() !== '');
                if (hasAnswer) endGame(false);
                else resetToIdle();
            } else {
                if (correctCount > 0) endGame(false);
                else resetToIdle(); 
            }
            return; 
        }

        subMode = submodeSelect.value;
        questionOrder = orderSelect.value;
        const cond = conditionSelect.value;
        
        if (cond === 'none') { winConditionType = 'none'; }
        else if (cond.startsWith('time-')) { winConditionType = 'time'; timeLimit = parseInt(cond.split('-')[1]); remainingSeconds = timeLimit; }
        else if (cond.startsWith('count-')) { winConditionType = 'count'; targetCount = parseInt(cond.split('-')[1]); }

        isPlaying = true;
        currentIndex = 0;
        correctCount = 0;
        secondsElapsed = 0;
        
        currentData = [...data];
        if (questionOrder === 'random') currentData.sort(() => Math.random() - 0.5);

        document.getElementById('typing-overlay').classList.add('hidden');
        btnStartText.textContent = "停止";
        btnStart.querySelector('.material-symbols-outlined').textContent = "stop";
        btnStart.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        btnStart.classList.add('bg-red-500', 'hover:bg-red-600');

        startTimer();
        renderActiveMode();
    });

    function startTimer() {
        if (window.currentTypingTimer) clearInterval(window.currentTypingTimer);
        window.currentTypingTimer = setInterval(() => {
            if (winConditionType === 'time') {
                remainingSeconds--;
                timerEl.textContent = formatTime(remainingSeconds);
                if (remainingSeconds <= 0) endGame(false);
            } else {
                secondsElapsed++;
                timerEl.textContent = formatTime(secondsElapsed);
            }
        }, 1000);
    }

    function renderActiveMode() {
        mainContent.innerHTML = '';
        if (subMode === 'single') renderSingleQuestion();
        else if (subMode === 'multi') renderMultiQuestion();
        else if (subMode === 'continuous') renderContinuous();
    }

    // --- 模式 A: 單題闖關 ---
    function renderSingleQuestion() {
        if (currentIndex >= currentData.length) { endGame(true); return; }
        const item = currentData[currentIndex];

        let displayTotal = currentData.length;
        if (winConditionType === 'count') {
            displayTotal = Math.min(targetCount, currentData.length);
        }

        mainContent.innerHTML = `
            <div class="absolute top-4 left-4 text-gray-400 font-bold text-sm sm:text-base tracking-widest z-10 select-none bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                ${currentIndex + 1}/${displayTotal}
            </div>

            <div class="w-full max-w-2xl flex flex-col items-center gap-6 sm:gap-8 py-4 relative my-auto">
                <div id="single-feedback" class="h-10 w-full flex items-center justify-center text-xl transition-all duration-300"></div>
                
                <div class="text-4xl md:text-5xl text-gray-800 text-center leading-tight px-4 break-words w-full">${item.term}</div>
                
                <div class="relative w-full max-w-[320px] sm:max-w-md mt-2">
                    
                    <button id="btn-clear-single" class="hidden absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-10 h-10 flex items-center justify-center cursor-pointer transition-colors bg-transparent rounded-full z-10">
                        <span class="material-symbols-outlined text-[24px]">close</span>
                    </button>

                    <input type="text" id="typing-input" 
                        class="w-full text-center text-3xl md:text-4xl py-3 sm:py-4 px-12 sm:px-14 border-b-4 border-gray-200 bg-gray-50 hover:bg-gray-100 outline-none focus:border-teal-500 focus:bg-teal-50 transition-colors font-normal rounded-t-2xl" 
                        autocomplete="off" spellcheck="false" placeholder="">
                    
                    <button id="btn-submit-single" class="absolute right-2 top-1/2 -translate-y-1/2 text-teal-600 hover:text-teal-800 w-10 h-10 flex items-center justify-center cursor-pointer transition-colors bg-transparent rounded-full z-10">
                        <span class="material-symbols-outlined text-[28px]">send</span>
                    </button>
                </div>
            </div>
        `;

        const input = document.getElementById('typing-input');
        const btnSubmit = document.getElementById('btn-submit-single');
        const btnClear = document.getElementById('btn-clear-single');
        const fb = document.getElementById('single-feedback');
        input.focus();

        input.addEventListener('input', () => {
            if (input.value.length > 0) {
                btnClear.classList.remove('hidden');
            } else {
                btnClear.classList.add('hidden');
            }
        });

        btnClear.addEventListener('click', () => {
            input.value = '';
            btnClear.classList.add('hidden');
            input.focus();
        });

        const checkAnswer = () => {
            const userVal = input.value.trim();
            const targetVal = item.definition.trim();
            
            if (userVal === targetVal) {
                correctCount++;
                scoreEl.textContent = correctCount;
                fb.innerHTML = `<span class="text-green-500 font-bold">✅ 正確！</span>`;
                
                input.classList.remove('border-gray-200', 'border-red-400', 'text-red-500', 'bg-red-50', 'focus:border-teal-500', 'focus:bg-teal-50');
                input.classList.add('text-green-600', 'border-green-500', 'bg-green-50');
                
                input.disabled = true;
                btnSubmit.disabled = true;
                btnClear.classList.add('hidden'); 

                if (winConditionType === 'count') {
                    progressBar.style.width = `${Math.min(100, (correctCount / targetCount) * 100)}%`;
                    if (correctCount >= targetCount) { setTimeout(() => endGame(true), 800); return; }
                }

                setTimeout(() => {
                    currentIndex++;
                    renderSingleQuestion();
                }, 800);
            } else {
                fb.innerHTML = `<span class="text-red-500 font-bold">❌ 錯誤，請重試</span>`;
                input.classList.remove('border-gray-200', 'focus:border-teal-500', 'focus:bg-teal-50');
                input.classList.add('text-red-500', 'border-red-400', 'bg-red-50');
                
                input.classList.add('animate-pulse');
                setTimeout(() => input.classList.remove('animate-pulse'), 500);
            }
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') checkAnswer();
            else {
                input.classList.remove('text-red-500', 'border-red-400', 'bg-red-50');
                input.classList.add('border-gray-200');
                fb.innerHTML = '';
            }
        });
        btnSubmit.addEventListener('click', checkAnswer);
    }

    // --- 模式 B: 多題檢查 (雙欄 Grid + 緊接排版) ---
    function renderMultiQuestion() {
        let displayData = currentData;
        if (winConditionType === 'count') displayData = currentData.slice(0, targetCount);

        mainContent.innerHTML = `
            <div class="w-full max-w-6xl flex flex-col mt-2 mb-auto pb-10">
                
                <div id="multi-result-banner" class="hidden mb-6 p-4 sm:p-5 bg-teal-50 border border-teal-200 rounded-xl justify-between items-center shadow-sm">
                    <div class="text-teal-800 font-bold text-lg sm:text-xl flex items-center gap-2">
                        <span class="material-symbols-outlined">task_alt</span>
                        測驗結束！正確：<span id="multi-final-score" class="text-2xl"></span> 題
                    </div>
                    <div class="text-teal-700 font-bold text-base sm:text-lg flex items-center gap-1">
                        <span class="material-symbols-outlined text-[20px]">timer</span>
                        耗時：<span id="multi-final-time"></span>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4 w-full">
                    ${displayData.map((item, i) => `
                        <div class="flex items-center p-2 sm:p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow gap-3">
                            <span class="bg-gray-100 text-gray-400 font-mono text-sm font-bold px-2 py-1 rounded select-none flex-shrink-0">${String(i + 1).padStart(2, '0')}</span>
                            <span class="text-lg text-gray-800 font-bold whitespace-nowrap flex-shrink-0 max-w-[40%] truncate" title="${item.term}">${item.term}</span>
                            <div class="relative flex-1 min-w-0">
                                <input type="text" data-idx="${i}" class="multi-typing-input w-full py-1.5 px-2 pr-8 text-lg border-b-2 border-gray-200 bg-gray-50 focus:bg-teal-50 outline-none focus:border-teal-500 rounded-t font-normal transition-colors" autocomplete="off" spellcheck="false">
                                <span class="fb-icon absolute right-2 top-1/2 -translate-y-1/2 text-xl z-10 pointer-events-none"></span>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="flex justify-center mt-8">
                    <button id="btn-submit-multi" class="bg-teal-600 text-white font-bold px-10 py-3 rounded-xl text-lg hover:bg-teal-700 shadow-md transition-colors cursor-pointer" data-finished="false">送出檢查</button>
                </div>
            </div>
        `;

        const btnSubmit = document.getElementById('btn-submit-multi');
        const inputs = document.querySelectorAll('.multi-typing-input');
        
        inputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (index + 1 < inputs.length) {
                        inputs[index + 1].focus();
                    } else {
                        btnSubmit.focus();
                    }
                }
            });
        });

        btnSubmit.addEventListener('click', () => {
            if (btnSubmit.dataset.finished === 'true') {
                resetToIdle();
                return;
            }

            const hasAnswer = Array.from(inputs).some(input => input.value.trim() !== '');
            if (!hasAnswer) {
                if (typeof showToast === 'function') showToast('⚠️ 請至少作答一題後再送出！');
                return;
            }

            endGame(true); // 使用統整的 endGame 處理結算
        });
    }

    // --- 模式 C: 連續文章 (無序作答) ---
    function renderContinuous() {
        // ✨ 正確擷取指定的題數
        let displayData = currentData;
        if (winConditionType === 'count') {
            displayData = currentData.slice(0, targetCount);
        }
        
        const fullTextArray = displayData.map(d => d.definition.trim());
        let foundIndices = new Set();

        mainContent.innerHTML = `
            <div class="w-full max-w-4xl flex flex-col items-center gap-6 py-6 h-full justify-start my-auto">
                
                <div id="continuous-result-banner" class="hidden w-full mb-2 p-4 sm:p-5 bg-teal-50 border border-teal-200 rounded-xl justify-between items-center shadow-sm">
                    <div class="text-teal-800 font-bold text-lg sm:text-xl flex items-center gap-2">
                        <span class="material-symbols-outlined">task_alt</span>
                        測驗結束！正確：<span id="continuous-final-score" class="text-2xl"></span> 題
                    </div>
                    <div class="text-teal-700 font-bold text-base sm:text-lg flex items-center gap-1">
                        <span class="material-symbols-outlined text-[20px]">timer</span>
                        耗時：<span id="continuous-final-time"></span>
                    </div>
                </div>

                <div id="article-display" class="w-full text-2xl md:text-3xl text-gray-700 leading-relaxed text-justify break-all p-5 bg-white border border-gray-200 rounded-xl shadow-sm scrollbar-thin min-h-[150px] max-h-[50vh] overflow-y-auto">
                    ${fullTextArray.map((w, i) => `<span id="word-${i}" class="transition-all duration-300 inline-block mx-1 px-1 rounded border border-transparent">${w}</span>`).join('')}
                </div>
                
                <div id="continuous-input-area" class="w-full flex flex-col items-center gap-4 mt-2">
                    <div class="relative w-full max-w-[320px] sm:max-w-md">
                        
                        <button id="btn-clear-continuous" class="hidden absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-10 h-10 flex items-center justify-center cursor-pointer transition-colors bg-transparent rounded-full z-10">
                            <span class="material-symbols-outlined text-[24px]">close</span>
                        </button>

                        <input type="text" id="continuous-input" 
                            class="w-full text-center text-3xl md:text-4xl py-3 sm:py-4 px-12 sm:px-14 border-b-4 border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-t-2xl outline-none focus:border-teal-500 focus:bg-teal-50 transition-colors font-normal" 
                            autocomplete="off" spellcheck="false" placeholder="">
                        
                        <button id="btn-submit-continuous" class="absolute right-2 top-1/2 -translate-y-1/2 text-teal-600 hover:text-teal-800 w-10 h-10 flex items-center justify-center cursor-pointer transition-colors bg-transparent rounded-full z-10">
                            <span class="material-symbols-outlined text-[28px]">send</span>
                        </button>
                    </div>
                </div>

                <button id="btn-restart-continuous" class="hidden mt-2 bg-blue-600 text-white font-bold px-10 py-3 rounded-xl text-lg hover:bg-blue-700 shadow-md transition-colors cursor-pointer flex items-center gap-2">
                    <span class="material-symbols-outlined text-[20px]">refresh</span> 返回設定
                </button>

            </div>
        `;

        const input = document.getElementById('continuous-input');
        const btnSubmit = document.getElementById('btn-submit-continuous');
        const btnClear = document.getElementById('btn-clear-continuous');
        const btnRestart = document.getElementById('btn-restart-continuous');
        input.focus();

        input.addEventListener('input', () => {
            if (input.value.length > 0) {
                btnClear.classList.remove('hidden');
            } else {
                btnClear.classList.add('hidden');
            }
        });

        btnClear.addEventListener('click', () => {
            input.value = '';
            btnClear.classList.add('hidden');
            input.focus();
        });

        const checkContinuousAnswer = () => {
            const userVal = input.value.trim();
            if (!userVal) return;

            let matchIndex = -1;
            for (let i = 0; i < fullTextArray.length; i++) {
                if (fullTextArray[i] === userVal && !foundIndices.has(i)) {
                    matchIndex = i;
                    break;
                }
            }

            if (matchIndex !== -1) {
                foundIndices.add(matchIndex);
                const span = document.getElementById(`word-${matchIndex}`);
                if (span) {
                    span.classList.add('line-through', 'text-gray-300', 'bg-gray-100', 'border-gray-200');
                    span.classList.remove('text-gray-700', 'border-transparent');
                }
                
                correctCount++;
                scoreEl.textContent = correctCount;
                input.value = ''; 
                btnClear.classList.add('hidden');
                
                input.classList.add('bg-green-100', 'border-green-400');
                setTimeout(() => input.classList.remove('bg-green-100', 'border-green-400'), 300);

                if (correctCount >= fullTextArray.length) {
                    setTimeout(() => endGame(true), 500);
                }
            } else {
                input.classList.add('bg-red-100', 'border-red-400');
                setTimeout(() => input.classList.remove('bg-red-100', 'border-red-400'), 300);
            }
        };

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkContinuousAnswer();
            }
        });
        
        btnSubmit.addEventListener('click', checkContinuousAnswer);
        btnRestart.addEventListener('click', resetToIdle);
    }

    // 🌟 全域統整版的結算邏輯
    function endGame(isSuccess) {
        isPlaying = false;
        clearInterval(window.currentTypingTimer);
        
        const timeTaken = winConditionType === 'time' ? (timeLimit - remainingSeconds) : secondsElapsed;

        // 停止後，將頂端左側的「停止」按鈕變回「開始」
        btnStartText.textContent = "開始";
        btnStart.querySelector('.material-symbols-outlined').textContent = "play_arrow";
        btnStart.classList.remove('bg-red-500', 'hover:bg-red-600');
        btnStart.classList.add('bg-blue-600', 'hover:bg-blue-700');

        if (subMode === 'single') {
            // 單題模式：保留彈出視窗
            const resultArea = document.getElementById('typing-result');
            resultArea.classList.remove('hidden');
            resultArea.classList.add('flex');

            resultArea.innerHTML = `
                <div class="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center max-w-sm w-full mx-4">
                    <div class="text-6xl mb-4 animate-bounce">${isSuccess ? '🏆' : '⏱️'}</div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-6">${isSuccess ? '任務達成！' : '測驗結束！'}</h3>
                    <div class="w-full bg-gray-50 rounded-xl p-4 mb-6 flex flex-col gap-3 border border-gray-100">
                        <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span class="font-bold text-gray-600 text-sm">正確題數</span>
                            <span class="text-teal-600 font-bold text-lg">${correctCount}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="font-bold text-gray-600 text-sm">完成時間</span>
                            <span class="text-blue-600 font-bold text-lg">${formatTime(timeTaken)}</span>
                        </div>
                    </div>
                    <button id="btn-restart-typing" class="w-full bg-teal-600 text-white font-bold py-3 rounded-xl hover:bg-teal-700 transition-colors shadow-md flex justify-center items-center gap-1.5 cursor-pointer">
                        <span class="material-symbols-outlined text-[20px]">refresh</span> 返回設定
                    </button>
                </div>
            `;

            document.getElementById('btn-restart-typing').addEventListener('click', () => {
                resultArea.classList.add('hidden');
                resetToIdle();
            });

        } else if (subMode === 'multi') {
            // 多題模式：進行批次核對並顯示上方 Banner
            const btnSubmit = document.getElementById('btn-submit-multi');
            
            if (btnSubmit && btnSubmit.dataset.finished !== 'true') {
                let correct = 0;
                const inputs = document.querySelectorAll('.multi-typing-input');
                let displayData = currentData;
                if (winConditionType === 'count') displayData = currentData.slice(0, targetCount);

                inputs.forEach(input => {
                    const idx = parseInt(input.dataset.idx);
                    const userVal = input.value.trim();
                    const targetVal = displayData[idx].definition.trim();
                    const fbIcon = input.nextElementSibling;
                    
                    if (userVal === targetVal && userVal !== '') {
                        correct++;
                        fbIcon.innerHTML = '✅';
                        input.classList.add('text-green-600', 'border-green-400', 'bg-green-50');
                        input.classList.remove('focus:border-teal-500', 'bg-gray-50');
                    } else if (userVal !== '') {
                        fbIcon.innerHTML = '❌';
                        input.classList.add('text-red-500', 'border-red-400', 'bg-red-50');
                        input.classList.remove('focus:border-teal-500', 'bg-gray-50');
                        input.value = `${userVal} (${targetVal})`;
                    } else {
                        fbIcon.innerHTML = '❌';
                        input.classList.add('text-red-400', 'bg-red-50');
                        input.value = `(${targetVal})`;
                    }
                    input.disabled = true;
                });
                correctCount = correct;
                scoreEl.textContent = correctCount;
            }

            if (btnSubmit) {
                btnSubmit.dataset.finished = 'true';
                btnSubmit.innerHTML = '<span class="material-symbols-outlined text-[20px] align-middle mr-1">refresh</span> 返回設定';
                btnSubmit.classList.replace('bg-teal-600', 'bg-blue-600');
                btnSubmit.classList.replace('hover:bg-teal-700', 'hover:bg-blue-700');
            }
            
            const banner = document.getElementById('multi-result-banner');
            if (banner) {
                document.getElementById('multi-final-score').textContent = correctCount;
                document.getElementById('multi-final-time').textContent = formatTime(timeTaken);
                banner.classList.remove('hidden');
                banner.classList.add('flex');
            }
            mainContent.scrollTop = 0;

        } else if (subMode === 'continuous') {
            // 連續模式：隱藏輸入框，顯示上方 Banner 與返回按鈕
            const inputArea = document.getElementById('continuous-input-area');
            if (inputArea) inputArea.classList.add('hidden');

            const btnRestart = document.getElementById('btn-restart-continuous');
            if (btnRestart) btnRestart.classList.remove('hidden');

            const banner = document.getElementById('continuous-result-banner');
            if (banner) {
                document.getElementById('continuous-final-score').textContent = correctCount;
                document.getElementById('continuous-final-time').textContent = formatTime(timeTaken);
                banner.classList.remove('hidden');
                banner.classList.add('flex');
            }
            mainContent.scrollTop = 0;
        }
    }

    resetToIdle();
}












// =================================================================
// 遊戲渲染區：選擇題 (Multiple Choice) - 固定選項進階版
// =================================================================
function renderMultipleChoiceGame(data, container) {
    // 動態計算「使用者實際配置了幾個選項欄位」
    const mcConfig = window.currentGameConfigs?.mcConfig || {};
    let maxConfiguredOptions = 0;
    if (mcConfig.o1Col !== undefined && mcConfig.o1Col >= 0) maxConfiguredOptions++;
    if (mcConfig.o2Col !== undefined && mcConfig.o2Col >= 0) maxConfiguredOptions++;
    if (mcConfig.o3Col !== undefined && mcConfig.o3Col >= 0) maxConfiguredOptions++;
    if (mcConfig.o4Col !== undefined && mcConfig.o4Col >= 0) maxConfiguredOptions++;

    // 防呆：最少要有 2 個選項才能玩
    if (maxConfiguredOptions < 2) maxConfiguredOptions = 2;

    let currentOptionCount = maxConfiguredOptions; // 預設使用最大可用數量
    
    // 動態生成選項數量下拉選單 HTML
    let optionCountHtml = '';
    for (let i = 2; i <= maxConfiguredOptions; i++) {
        optionCountHtml += `<option value="${i}" ${i === maxConfiguredOptions ? 'selected' : ''}>${i} 個選項</option>`;
    }

    let quizLayout = 'horizontal'; 
    let isPlaying = false;
    
    let winConditionType = 'none';
    let timeLimit = 0;
    let targetCorrect = 0;
    let questionOrder = 'random'; 

    let correctCount = 0;
    let incorrectCount = 0;
    let totalAnswered = 0;
    let secondsElapsed = 0;
    let remainingSeconds = 0;
    
    let questionPool = [];
    let currentQuestionData = null;
    let currentOptions = [];
    let isAnswered = false;

    if (window.currentQuizTimer) clearInterval(window.currentQuizTimer);
    clearTimeout(window.quizResultTimeout);

    // 介面基底與「測驗」相同，但改變色彩為琥珀黃色系 (Amber) 以作區隔
    container.innerHTML = `
        <div class="max-w-6xl mx-auto flex flex-col h-full py-4 px-2 sm:px-4 w-full relative">
            
            <div class="relative mb-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-shrink-0" style="z-index: 50;">
                
                <div class="flex flex-wrap lg:flex-nowrap justify-between items-center gap-2 sm:gap-4 p-2 sm:p-3">
                    <div class="flex items-center flex-wrap lg:flex-nowrap gap-2 w-full lg:w-auto relative">
                        <h2 class="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-1 hidden 2xl:flex">
                            <span class="material-symbols-outlined text-yellow-500">list_alt</span> 選擇題
                        </h2>
                        
                        <select id="mc-question-order" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 sm:px-3 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                            <option value="random" selected>隨機</option>
                            <option value="sequential">依序</option>
                        </select>

                        <select id="mc-option-count" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 sm:px-3 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                            ${optionCountHtml}
                        </select>

                        <select id="mc-win-condition" class="bg-white border border-gray-300 text-gray-700 py-1.5 px-2 sm:px-3 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-0 text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                            <option value="none">無限制</option>
                            <optgroup label="⏱️ 限時挑戰">
                                <option value="time-30">30 秒</option>
                                <option value="time-60">60 秒</option>
                                <option value="time-90">90 秒</option>
                                <option value="time-120">120 秒</option>
                            </optgroup>
                            <optgroup label="🎯 答對目標">
                                <option value="correct-5">5 題</option>
                                <option value="correct-10" selected>10 題</option>
                                <option value="correct-20">20 題</option>
                                <option value="correct-30">30 題</option>
                            </optgroup>
                        </select>

                        <button id="btn-start-mc" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-1 min-w-[100px] justify-center cursor-pointer">
                            <span class="material-symbols-outlined text-[18px]">play_arrow</span> <span id="btn-start-mc-text">開始</span>
                        </button>
                    </div>
                    
                    <div class="flex items-center gap-2 sm:gap-3 text-sm font-bold text-gray-600 ml-auto xl:ml-0 flex-wrap">
                        <button id="mc-layout-toggle" class="p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer text-gray-500 hover:text-gray-800 flex items-center" title="切換排版">
                            <span class="material-symbols-outlined text-[20px]">view_agenda</span>
                        </button>
                        
                        <div class="h-4 w-px bg-gray-300 mx-1 hidden sm:block"></div>

                        <div class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-[18px] text-blue-500">timer</span>
                            <span id="mc-timer" class="w-10 text-center text-base">00:00</span>
                        </div>
                        <div class="flex items-center gap-1" title="答對">
                            <span class="material-symbols-outlined text-[18px] text-green-500">check_circle</span>
                            <span id="mc-correct-count" class="text-green-600 w-6 text-center text-base">0</span>
                        </div>
                        <div class="flex items-center gap-1" title="答錯">
                            <span class="material-symbols-outlined text-[18px] text-red-500">cancel</span>
                            <span id="mc-incorrect-count" class="text-red-600 w-6 text-center text-base">0</span>
                        </div>
                    </div>
                </div>

                <div class="w-full bg-gray-100 h-1.5 relative">
                    <div id="mc-progress-bar" class="bg-yellow-400 h-full transition-all duration-500 ease-out" style="width: 0%;"></div>
                </div>
            </div>
            
            <div id="mc-board" class="flex flex-col gap-2 sm:gap-4 flex-1 pb-4 relative min-h-0" style="z-index: 1;">
                
                <div id="mc-overlay" class="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300" style="z-index: 10;">
                    <span class="material-symbols-outlined text-5xl sm:text-6xl text-gray-400 mb-2">touch_app</span>
                    <p class="text-lg sm:text-xl font-bold text-gray-600">請設定條件並點擊開始</p>
                </div>

                <div class="flex-1 flex flex-col min-h-0 relative items-center w-full" style="z-index: 20;">
                    <div class="w-full mb-6 mt-4 flex items-center justify-center">
                        <div class="flex items-center text-center gap-3 max-w-4xl px-4">
                            <span id="mc-question-number" class="text-2xl sm:text-3xl font-bold text-yellow-700"></span>
                            <h3 id="mc-question-text" class="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-800 leading-tight"></h3>
                        </div>
                    </div>

                    <div id="mc-options-container" class="w-full max-w-4xl px-2"></div>
                </div>
            </div>
            
            <div id="mc-result" class="hidden absolute inset-0 flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-2xl pointer-events-none" style="z-index: 100;">
                <div class="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center max-w-sm w-full mx-4 pointer-events-auto">
                    <div id="mc-result-icon" class="text-6xl mb-3 z-10 animate-bounce">🏆</div>
                    <h3 id="mc-result-title" class="text-2xl font-bold text-gray-800 mb-2 z-10">測驗完成！</h3>
                    <div class="w-full bg-gray-50 rounded-xl border border-gray-200 p-4 mb-5 flex flex-col gap-3">
                        <div id="mc-result-target-row" class="hidden justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">目標進度</span>
                            <span id="mc-target-result" class="font-bold text-purple-600 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">答對題數</span>
                            <span id="mc-correct-result" class="font-bold text-green-600 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">答錯題數</span>
                            <span id="mc-incorrect-result" class="font-bold text-red-600 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span class="text-gray-600 font-bold text-sm">正確率</span>
                            <span id="mc-accuracy-result" class="font-bold text-orange-500 text-lg"></span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-600 font-bold text-sm">遊戲耗時</span>
                            <span id="mc-time-result" class="font-bold text-blue-600 text-lg"></span>
                        </div>
                    </div>
                    <button id="btn-restart-mc" class="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2.5 rounded-lg shadow-md transition-colors text-base flex justify-center items-center gap-1.5">
                        <span class="material-symbols-outlined text-[20px]">refresh</span> 再挑戰一次
                    </button>
                </div>
            </div>
        </div>
    `;

    // DOM 連接
    const selectQuestionOrder = document.getElementById('mc-question-order');
    const selectOptionCount = document.getElementById('mc-option-count');
    const selectWinCondition = document.getElementById('mc-win-condition');
    const btnStart = document.getElementById('btn-start-mc');
    const btnStartText = document.getElementById('btn-start-mc-text');
    const layoutToggle = document.getElementById('mc-layout-toggle');
    
    const timerEl = document.getElementById('mc-timer');
    const correctEl = document.getElementById('mc-correct-count');
    const incorrectEl = document.getElementById('mc-incorrect-count');
    const progressBar = document.getElementById('mc-progress-bar');
    
    const overlay = document.getElementById('mc-overlay');
    const resultArea = document.getElementById('mc-result');
    const questionNumberEl = document.getElementById('mc-question-number');
    const questionTextEl = document.getElementById('mc-question-text');
    const optionsContainer = document.getElementById('mc-options-container');

    // 阻擋事件冒泡
    [selectQuestionOrder, selectOptionCount, selectWinCondition].forEach(el => {
        el.addEventListener('mousedown', e => e.stopPropagation());
        el.addEventListener('touchstart', e => e.stopPropagation());
        el.addEventListener('click', e => e.stopPropagation());
    });

    selectQuestionOrder.addEventListener('change', (e) => { questionOrder = e.target.value; resetToIdle(); });
    selectOptionCount.addEventListener('change', (e) => { currentOptionCount = parseInt(e.target.value); resetToIdle(); });
    selectWinCondition.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'none') { winConditionType = 'none'; timeLimit = 0; targetCorrect = 0; } 
        else if (val.startsWith('time-')) { winConditionType = 'time'; timeLimit = parseInt(val.split('-')[1]); targetCorrect = 0; } 
        else if (val.startsWith('correct-')) { winConditionType = 'correct'; timeLimit = 0; targetCorrect = parseInt(val.split('-')[1]); }
        resetToIdle();
    });
    selectWinCondition.dispatchEvent(new Event('change'));

    layoutToggle.addEventListener('click', () => {
        const layouts = ['horizontal', 'vertical', 'flow'];
        const currentIdx = layouts.indexOf(quizLayout);
        quizLayout = layouts[(currentIdx + 1) % layouts.length];
        
        const icon = layoutToggle.querySelector('.material-symbols-outlined');
        if (quizLayout === 'horizontal') icon.textContent = 'view_agenda';
        else if (quizLayout === 'vertical') icon.textContent = 'wrap_text';
        else icon.textContent = 'view_column';
        
        if (isPlaying) renderOptions();
    });

    function formatTime(totalSeconds) {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    }

    function resetToIdle() {
        isPlaying = false;
        clearInterval(window.currentQuizTimer);
        clearTimeout(window.quizResultTimeout);

        if (winConditionType === 'time') {
            timerEl.textContent = formatTime(timeLimit);
            timerEl.classList.add('text-red-500');
        } else {
            timerEl.textContent = "00:00";
            timerEl.classList.remove('text-red-500');
        }

        correctEl.textContent = "0"; incorrectEl.textContent = "0";
        progressBar.style.width = '0%';
        questionNumberEl.textContent = ""; questionTextEl.textContent = "";
        optionsContainer.innerHTML = "";
        
        overlay.classList.remove('hidden');
        resultArea.classList.add('hidden'); resultArea.classList.remove('flex');
        
        btnStart.innerHTML = `<span class="material-symbols-outlined text-[18px]">play_arrow</span> <span id="btn-start-mc-text">開始</span>`;
        btnStart.classList.remove('bg-red-500', 'hover:bg-red-600'); 
        btnStart.classList.add('bg-blue-600', 'hover:bg-blue-700');
    }

    btnStart.addEventListener('click', () => {
        if (isPlaying) {
            // ✨ 修改：若沒有作答或沒答對半題，直接重設；否則顯示結算畫面
            if (totalAnswered === 0 || correctCount === 0) {
                resetToIdle();
            } else {
                endGame(true); 
            }
            return;
        }

        isPlaying = true;
        correctCount = 0; incorrectCount = 0; totalAnswered = 0; secondsElapsed = 0;
        remainingSeconds = timeLimit;
        
        btnStart.innerHTML = `<span class="material-symbols-outlined text-[18px]">stop</span> <span id="btn-start-mc-text">停止</span>`;
        btnStart.classList.remove('bg-blue-600', 'hover:bg-blue-700'); 
        btnStart.classList.add('bg-red-500', 'hover:bg-red-600');
        
        correctEl.textContent = correctCount; incorrectEl.textContent = incorrectCount;
        overlay.classList.add('hidden');

        clearInterval(window.currentQuizTimer);
        window.currentQuizTimer = setInterval(() => {
            if (winConditionType === 'time') {
                remainingSeconds--;
                timerEl.textContent = formatTime(remainingSeconds);
                if (remainingSeconds <= 0) endGame(false); 
            } else {
                secondsElapsed++;
                timerEl.textContent = formatTime(secondsElapsed);
            }
        }, 1000);

        if (questionOrder === 'random') questionPool = [...data].sort(() => Math.random() - 0.5);
        else questionPool = [...data].reverse();
        
        loadQuestion();
    });

    function loadQuestion() {
        if (questionPool.length === 0) {
            if (questionOrder === 'random') questionPool = [...data].sort(() => Math.random() - 0.5);
            else questionPool = [...data].reverse();
        }
        currentQuestionData = questionPool.pop();
        isAnswered = false;
        
        questionNumberEl.textContent = `${totalAnswered + 1}.`;
        questionTextEl.textContent = currentQuestionData.term;

        // 🎯 核心邏輯：動態抓取固定選項
        let options = [...currentQuestionData.options]; 
        
        // 確保正確答案一定在陣列中 (防呆)
        if (!options.includes(currentQuestionData.definition)) {
            options.push(currentQuestionData.definition);
        }

        // 如果設定的「希望選項數量」小於「實際有的選項數量」，進行裁減
        if (options.length > currentOptionCount) {
            // 挑出錯誤選項打亂
            let wrongOptions = options.filter(o => o !== currentQuestionData.definition);
            wrongOptions.sort(() => Math.random() - 0.5);
            
            // 湊齊 [正確答案] + [隨機的錯誤選項]
            let neededWrongOptions = currentOptionCount - 1;
            options = [currentQuestionData.definition, ...wrongOptions.slice(0, neededWrongOptions)];
        }
        // ✨ 修復 2：如果該題選項不足 (例如表格有空值)，從題庫借其他選項來補齊！
        else if (options.length < currentOptionCount) {
            let allOtherOptions = [];
            data.forEach(d => {
                if (d.options) {
                    d.options.forEach(o => {
                        if (o !== currentQuestionData.definition && !options.includes(o)) {
                            allOtherOptions.push(o);
                        }
                    });
                }
            });
            // 去除重複並打亂
            allOtherOptions = [...new Set(allOtherOptions)];
            allOtherOptions.sort(() => Math.random() - 0.5);

            let needed = currentOptionCount - options.length;
            options = [...options, ...allOtherOptions.slice(0, needed)];
        }

        // 最後再把這題的選項打亂，呈現給使用者
        options.sort(() => Math.random() - 0.5); 
        currentOptions = options;
        renderOptions();
    }

    function renderOptions() {
        let containerClass = '';
        let btnClasses = '';
        
        if (quizLayout === 'horizontal') {
            containerClass = 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4';
            btnClasses = 'px-4 py-3 sm:px-6 sm:py-4 text-lg sm:text-xl';
        } else if (quizLayout === 'vertical') {
            containerClass = 'flex flex-col gap-3';
            btnClasses = 'w-full px-5 py-3 text-lg';
        } else { // flow
            containerClass = 'flex flex-wrap justify-center gap-3';
            btnClasses = 'px-5 py-2.5 text-lg';
        }

        optionsContainer.className = `w-full max-w-4xl px-2 ${containerClass}`;
        optionsContainer.innerHTML = '';

        currentOptions.forEach((opt, index) => {
            const prefix = quizLayout !== 'flow' ? `${String.fromCharCode(65 + index)}. ` : '';
            const btn = document.createElement('button');
            btn.className = `quiz-option bg-white border-2 border-gray-200 hover:border-gray-400 hover:bg-yellow-50 text-gray-800 rounded-xl transition-all duration-200 text-left shadow-sm ${btnClasses}`;
            btn.textContent = prefix + opt;
            btn.dataset.answer = opt;
            
            btn.addEventListener('click', () => handleOptionClick(btn, opt));
            optionsContainer.appendChild(btn);
        });
    }

    function handleOptionClick(btn, selectedOption) {
        if (isAnswered || !isPlaying) return;
        isAnswered = true;
        totalAnswered++;

        const isCorrect = selectedOption === currentQuestionData.definition;
        
        Array.from(optionsContainer.children).forEach(b => {
            b.classList.remove('hover:border-gray-400', 'hover:bg-yellow-50', 'cursor-pointer');
            b.style.pointerEvents = 'none';
            
            if (b.dataset.answer === currentQuestionData.definition) {
                b.classList.replace('border-gray-200', 'border-green-500');
                b.classList.add('bg-green-50', 'text-green-700');
                if (isCorrect) showConfetti(b);
            } else if (b === btn && !isCorrect) {
                b.classList.replace('border-gray-200', 'border-red-500');
                b.classList.add('bg-red-50', 'text-red-700');
            }
        });

        if (isCorrect) {
            correctCount++; correctEl.textContent = correctCount;
        } else {
            incorrectCount++; incorrectEl.textContent = incorrectCount;
        }

        if (winConditionType === 'correct') {
            progressBar.style.width = `${Math.min((correctCount / targetCorrect) * 100, 100)}%`;
        }

        if (winConditionType === 'correct' && correctCount >= targetCorrect) {
            setTimeout(() => endGame(true), 1200);
            return;
        }

        setTimeout(() => { if (isPlaying) loadQuestion(); }, 1200);
    }

    function endGame(isSuccess) {
        clearInterval(window.currentQuizTimer);
        isPlaying = false;

        const resultTitle = document.getElementById('mc-result-title');
        const resultIcon = document.getElementById('mc-result-icon');
        const targetResultRow = document.getElementById('mc-result-target-row');
        const targetResult = document.getElementById('mc-target-result');
        
        if (isSuccess) {
            resultIcon.textContent = '🏆';
            resultTitle.textContent = (winConditionType === 'correct' || winConditionType === 'none') ? '測驗完成！' : '時間到！';
            resultTitle.className = 'text-2xl font-bold text-gray-800 mb-2 z-10';
            if (winConditionType === 'correct' || winConditionType === 'none') triggerGlobalConfetti();
        } else {
            resultIcon.textContent = '⏱️';
            resultTitle.textContent = '時間到！任務失敗';
            resultTitle.className = 'text-2xl font-bold text-red-600 mb-2 z-10';
        }

        if (winConditionType === 'correct') {
            targetResultRow.classList.remove('hidden'); targetResultRow.classList.add('flex');
            targetResult.textContent = `${correctCount} / ${targetCorrect} 題`;
            targetResult.className = isSuccess ? 'font-bold text-purple-600 text-xl' : 'font-bold text-red-500 text-xl';
        } else {
            targetResultRow.classList.add('hidden'); targetResultRow.classList.remove('flex');
        }

        window.quizResultTimeout = setTimeout(() => {
            resultArea.classList.remove('hidden'); resultArea.classList.add('flex');
            
            const timeSpent = winConditionType === 'time' ? (timeLimit - remainingSeconds) : secondsElapsed;
            const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
            
            document.getElementById('mc-time-result').textContent = formatTime(timeSpent);
            document.getElementById('mc-correct-result').textContent = correctCount;
            document.getElementById('mc-incorrect-result').textContent = incorrectCount;
            document.getElementById('mc-accuracy-result').textContent = `${accuracy}%`;
            
            btnStart.innerHTML = `<span class="material-symbols-outlined text-[18px]">play_arrow</span> <span id="btn-start-mc-text">開始</span>`;
            btnStart.classList.remove('bg-red-500', 'hover:bg-red-600'); 
            btnStart.classList.add('bg-blue-600', 'hover:bg-blue-700');
        }, 500);
    }

    function showConfetti(element) { element.classList.add('scale-105'); setTimeout(() => element.classList.remove('scale-105'), 300); }

    function triggerGlobalConfetti() {
        if (typeof triggerConfetti === 'function') { triggerConfetti(); return; }
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4CAF50', '#FFEB3B', '#FF9800'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            const isTriangle = Math.random() > 0.5;
            confetti.style.position = 'fixed'; confetti.style.left = '50%'; confetti.style.top = '30%';
            confetti.style.width = isTriangle ? '0' : `${Math.random() * 6 + 4}px`;
            confetti.style.height = isTriangle ? '0' : `${Math.random() * 10 + 6}px`;
            if (isTriangle) {
                confetti.style.borderLeft = '4px solid transparent'; confetti.style.borderRight = '4px solid transparent';
                confetti.style.borderBottom = `8px solid ${colors[Math.floor(Math.random() * colors.length)]}`;
            } else {
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            }
            confetti.style.zIndex = '9999'; confetti.style.pointerEvents = 'none';
            const angle = Math.random() * Math.PI * 2; const velocity = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity; const ty = Math.sin(angle) * velocity + 100; 
            
            confetti.animate([
                { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.8 },
                { transform: `translate(${tx * 1.5}px, ${ty * 1.5 + 200}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
            ], { duration: 1500 + Math.random() * 1000, easing: 'ease-out', fill: 'forwards' });
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    document.getElementById('btn-restart-mc').addEventListener('click', resetToIdle);
}