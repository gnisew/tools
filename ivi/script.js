// --- STATE MANAGEMENT ---
const state = {
    view: 'home',
    selectedUnits: [23, 24, 25, 26, 27],
    allUnits: [23, 24, 25, 26, 27],
    vocabulary: [], // Will be initialized from VOCAB_DATA
    listMode: 'full', // 'full' or 'compact'
    sortOrder: 'default', // 'default' or 'alpha'
    listColumns: ['check', 'num', 'word', 'kk', 'part', 'def', 'other'],
	pagination: {
        mode: 'unit', // 選項: 'unit', '50', '100', 'all'
        currentPage: 1
    },
    quiz: {
        questions: [],
        currentIndex: 0,
        score: 0,
        wrongQuestions: [],
        status: 'answering', // 'answering', 'result'
        selectedOption: null,
        isFinished: false,
        mode: '' // 'cn-en', 'en-cn', 'sentence'
    },
    story: {
        activeIndex: 0,
        mode: 'read', // 'read', 'quiz'
        filledBlanks: {},
        selectedBlank: null,
        revealedTrans: {},
		consecutiveErrors: 0
    },
	audio: {
        lastText: null,
        lastRate: null
    }
};

// --- DOM ELEMENTS ---
const appRoot = document.getElementById('app-root');
const navContainer = document.getElementById('nav-container');

// --- INITIALIZATION ---
function init() {
    // Clone data to avoid mutating original source directly if we re-fetch
    if (typeof VOCAB_DATA !== 'undefined') {
        state.vocabulary = JSON.parse(JSON.stringify(VOCAB_DATA)).map(item => ({ ...item, checked: true }));
        
        const distinctUnits = [...new Set(state.vocabulary.map(v => v.unit))].sort((a, b) => a - b);
        state.allUnits = distinctUnits;
        state.selectedUnits = [...distinctUnits]; // 預設全選所有新單元
       
    } else {
        console.error("VOCAB_DATA not found. Make sure data.js is loaded first.");
    }
    renderNav();
    render();
}

// --- CORE RENDER FUNCTION ---
function render() {
    // 重要：先清空內容，避免元素重複堆疊
    appRoot.innerHTML = '';
    
    switch (state.view) {
        case 'home':
            renderHome();
            break;
        case 'list':
            renderList();
            break;
        case 'quiz-cn':
            // 只有在第一次切換到此視圖且沒有題目時才初始化，避免刷新時重置題目
            // 但為了簡單起見，這裡依賴 setState 切換 view 時的行為
            if (state.quiz.questions.length === 0 || state.quiz.mode !== 'cn-en') {
                initQuiz('cn-en');
            }
            renderQuiz();
            break;
        case 'quiz-en':
            if (state.quiz.questions.length === 0 || state.quiz.mode !== 'en-cn') {
                initQuiz('en-cn');
            }
            renderQuiz();
            break;
        case 'quiz-sen':
            if (state.quiz.questions.length === 0 || state.quiz.mode !== 'sentence') {
                initQuiz('sentence');
            }
            renderQuiz();
            break;
        case 'story':
            renderStory();
            break;
    }
    updateNavActiveState();
}

// --- UTILITIES (新增的缺失函式) ---

// 1. Shuffle Function (Fisher-Yates)
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}


// 2. Speak Function (TTS)
function speak(text, rate = 1) {
    if (!text) return;
    
    if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        
        // 1. 檢查並停止目前的播放
        if (synth.speaking) {
            synth.cancel();

            // 如果點擊的是同一個正在播放的內容，則視為「停止」操作
            if (state.audio.lastText === text && state.audio.lastRate === rate) {
                state.audio.lastText = null;
                state.audio.lastRate = null;
                state.audio.isPlaying = false; 
                
                // 保持畫面位置
                const scrollY = window.scrollY;
                render(); 
                window.scrollTo(0, scrollY);
                return;
            }
        }

        // [修改重點] 直接使用原始文字，移除會被唸出來的標點符號 (padding)
        const textToSpeak = text;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        // 語系判斷
        utterance.lang = 'en-US'; 
        if (/[\u4e00-\u9fa5]/.test(text)) {
            utterance.lang = 'zh-TW';
        }
        utterance.rate = rate;

        // 掛載到 window 避免被記憶體回收機制清除導致中斷
        window.currentUtterance = utterance;

        // --- 播放開始事件 ---
        utterance.onstart = () => {
            state.audio.lastText = text;
            state.audio.lastRate = rate;
            state.audio.isPlaying = true;
            
            const scrollY = window.scrollY;
            render();
            window.scrollTo(0, scrollY);
        };

        // --- 播放結束事件 ---
        utterance.onend = () => {
            if (state.audio.lastText === text && state.audio.lastRate === rate) {
                state.audio.lastText = null;
                state.audio.lastRate = null;
                state.audio.isPlaying = false;
                
                const scrollY = window.scrollY;
                render();
                window.scrollTo(0, scrollY);
            }
        };

        // [修改重點] 使用延遲來解決開頭被切掉的問題，而不是加字
        // 50ms 通常足夠讓 iOS 的音訊 session 啟動
        setTimeout(() => {
            synth.speak(utterance);
        }, 50);

    } else {
        console.warn("Browser does not support Speech Synthesis");
    }
}
// --- NAVIGATION ---
function renderNav() {
    const navItems = [
        { id: 'list', label: '單字表', icon: 'fa-book-open' },
        { id: 'quiz-cn', label: '中選英', icon: 'fa-check-circle' },
        { id: 'quiz-en', label: '英選中', icon: 'fa-question-circle' },
        { id: 'quiz-sen', label: '填空題', icon: 'fa-list-alt' },
        { id: 'story', label: '故事集', icon: 'fa-graduation-cap' }
    ];

    let html = `
        <button onclick="setState('view', 'home')" class="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-indigo-600 transition-colors active:bg-gray-50">
             <i class="fas fa-home mb-1 text-xl"></i>
             <span class="text-[10px] font-bold">首頁</span>
        </button>
    `;

    navItems.forEach(item => {
        html += `
            <button onclick="handleNavClick('${item.id}')" class="nav-btn flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-indigo-600 transition-colors active:bg-gray-50" data-id="${item.id}">
                <i class="fas ${item.icon} mb-1 text-xl transition-transform"></i>
                <span class="text-[10px] font-bold">${item.label}</span>
            </button>
        `;
    });

    navContainer.innerHTML = html;
}

function handleNavClick(viewId) {
    // Reset quiz state when clicking nav items to start fresh
    if (viewId.startsWith('quiz')) {
        state.quiz.questions = []; 
    }
    setState('view', viewId);
}

function updateNavActiveState() {
    const btns = document.querySelectorAll('.nav-btn');
    btns.forEach(btn => {
        const icon = btn.querySelector('i');
        const text = btn.querySelector('span');
        if (btn.dataset.id === state.view) {
            btn.classList.remove('text-gray-400');
            btn.classList.add('text-indigo-600');
            icon.classList.add('scale-110', '-translate-y-1');
            text.classList.remove('opacity-80');
            text.classList.add('opacity-100');
        } else {
            btn.classList.add('text-gray-400');
            btn.classList.remove('text-indigo-600');
            icon.classList.remove('scale-110', '-translate-y-1');
            text.classList.add('opacity-80');
            text.classList.remove('opacity-100');
        }
    });
}

// --- HOME VIEW ---
function renderHome() {
    const container = document.createElement('div');
    // [修改點] 移除了 'animate-fade-in'
    container.className = "flex flex-col items-center justify-center p-6 w-full max-w-2xl";
    
    const isAllSelected = state.selectedUnits.length === state.allUnits.length;

    container.innerHTML = `
        <div class="bg-white p-8 rounded-3xl shadow-xl w-full text-center border-2 border-indigo-100">
            <h1 class="text-2xl font-bold text-gray-800 mb-2">vioiv 基礎字彙</h1><br />
            
            <button onclick="toggleAllUnits()" class="mb-6 flex items-center justify-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-full transition-colors w-full border border-indigo-200">
                <i class="far ${isAllSelected ? 'fa-check-square' : 'fa-square'} text-xl"></i>
                ${isAllSelected ? '取消全選' : '全選'}
            </button>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-h-[400px] overflow-y-auto pr-2">
                ${state.allUnits.map(unit => {
                    const isSelected = state.selectedUnits.includes(unit);
                    const count = state.vocabulary.filter(v => v.unit === unit).length;
                    return `
                        <div onclick="toggleUnit(${unit})" class="p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-indigo-300'}">
                            <div class="flex items-center gap-3">
                                <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}">
                                    ${isSelected ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
                                </div>
                                <span class="text-lg font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-500'}">Unit ${unit}</span>
                            </div>
                            <span class="text-sm text-gray-400 font-mono">${count} Words</span>
                        </div>
                    `;
                }).join('')}
            </div>

            <button onclick="startLearning()" class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
                開始學習
            </button>
        </div>
    `;
    appRoot.appendChild(container);
}

// --- LIST VIEW ---
function renderList() {
    // 1. 篩選與排序
    let allWords = state.vocabulary.filter(w => state.selectedUnits.includes(w.unit));
    
    if (state.sortOrder === 'alpha') {
        allWords.sort((a, b) => a.word.localeCompare(b.word));
    } else {
        allWords.sort((a, b) => a.id - b.id);
    }

    // 2. 分頁邏輯
    let displayWords = [];
    let totalPages = 1;
    let pageInfo = "";

    const mode = state.pagination.mode;
    let currentPage = state.pagination.currentPage;

    if (mode === 'all') {
        displayWords = allWords;
        totalPages = 1;
        currentPage = 1;
        pageInfo = `共 ${allWords.length} 個單字`;
    } else if (mode === 'unit') {
        const distinctUnits = [...new Set(allWords.map(w => w.unit))].sort((a, b) => a - b);
        totalPages = distinctUnits.length;
        
        if (currentPage > totalPages) currentPage = 1;
        if (currentPage < 1 && totalPages > 0) currentPage = 1;
        state.pagination.currentPage = currentPage;

        if (totalPages > 0) {
            const currentUnit = distinctUnits[currentPage - 1];
            displayWords = allWords.filter(w => w.unit === currentUnit);
            pageInfo = `Unit ${currentUnit}`;
        } else {
            pageInfo = "無資料";
        }
    } else {
        const pageSize = parseInt(mode);
        totalPages = Math.ceil(allWords.length / pageSize);
        
        if (currentPage > totalPages) currentPage = 1;
        if (currentPage < 1) currentPage = 1;
        state.pagination.currentPage = currentPage;

        const startIndex = (currentPage - 1) * pageSize;
        displayWords = allWords.slice(startIndex, startIndex + pageSize);
        pageInfo = `第 ${currentPage} 頁`;
    }

    const isAllChecked = displayWords.length > 0 && displayWords.every(w => w.checked);

    // 3. 建立容器與 Header
    const container = document.createElement('div');
    container.className = "pb-48 w-full max-w-6xl mx-auto px-4";

    let topPaginationHTML = '';
    if (totalPages > 1) {
        topPaginationHTML = `
            <div class="flex items-center gap-3">
                <button onclick="changePage(-1)" class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-indigo-500 transition-colors ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-white text-indigo-200'}" ${currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left text-xs"></i>
                </button>
                <span class="font-mono text-indigo-100 text-sm">${currentPage} / ${totalPages}</span>
                <button onclick="changePage(1)" class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-indigo-500 transition-colors ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:text-white text-indigo-200'}" ${currentPage === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right text-xs"></i>
                </button>
            </div>
        `;
    }

    const header = document.createElement('div');
    header.className = "bg-indigo-600 text-white p-4 md:p-6 rounded-b-3xl shadow-lg mb-6 -mx-4 md:mx-0 md:rounded-3xl";
    header.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
           <h2 class="text-2xl font-bold">單字學習</h2>
           
           <div class="flex flex-wrap justify-center items-center gap-2">
                <div class="relative">
                    <select onchange="setPaginationMode(this.value)" class="appearance-none bg-indigo-700 hover:bg-indigo-500 text-white pl-3 pr-8 py-1.5 rounded-lg text-sm font-bold outline-none cursor-pointer transition-colors border border-indigo-500">
                        <option value="unit" ${mode === 'unit' ? 'selected' : ''}>依單元分頁</option>
                        <option value="50" ${mode === '50' ? 'selected' : ''}>每頁 50 筆</option>
                        <option value="100" ${mode === '100' ? 'selected' : ''}>每頁 100 筆</option>
                        <option value="all" ${mode === 'all' ? 'selected' : ''}>顯示全部</option>
                    </select>
                    <div class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-200 text-xs">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>

                <button onclick="toggleSortOrder()" class="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-sm transition-colors border border-indigo-500">
                    <i class="fas ${state.sortOrder === 'default' ? 'fa-sort-alpha-down' : 'fa-sort-numeric-down'}"></i> ${state.sortOrder === 'default' ? "字母" : "原序"}
                </button>
                
                <button onclick="toggleListMode()" class="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-sm transition-colors border border-indigo-500">
                    <i class="fas ${state.listMode === 'full' ? 'fa-list' : 'fa-th'}"></i>
                    <span>${state.listMode === 'full' ? '精簡' : '完整'}</span>
                </button>
           </div>
        </div>
        
        <div class="flex justify-between items-center bg-indigo-800/30 px-4 py-2 rounded-lg min-h-[40px]">
            <span class="text-indigo-100 text-sm font-medium">${pageInfo}</span>
            ${topPaginationHTML}
        </div>
    `;
    container.appendChild(header);

    // 4. List Content
    const listContainer = document.createElement('div');
    
    if (displayWords.length === 0) {
        listContainer.innerHTML = `<div class="text-center py-10 text-gray-500">本頁無資料</div>`;
    } else if (state.listMode === 'compact') {
        // --- Compact Mode (精簡檢視 - 維持不變) ---
        listContainer.className = "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 overflow-x-auto";
        
        const headerRow = document.createElement('div');
        headerRow.className = "flex bg-gray-50 p-2 border-b border-gray-200 gap-2 select-none min-w-[800px]"; 
        
        const checkIcon = isAllChecked ? 'fa-check-square text-indigo-600' : 'fa-square text-gray-400';
        const checkHTML = `<i class="far ${checkIcon} text-lg cursor-pointer hover:text-indigo-500 transition-colors" onclick="event.stopPropagation(); toggleAllVocabCheck(${!isAllChecked})"></i>`;

        const colLabels = { 
            check: checkHTML,
            num: '編號', 
            word: '單字', 
            kk: 'KK', 
            part: '詞性', 
            def: '中文定義',
            other: '變化形'
        };
        
        const colWidths = { 
            check: 'w-12', 
            num: 'w-12', 
            word: 'w-40', 
            kk: 'w-28',   
            part: 'w-14', 
            def: 'flex-1', 
            other: 'w-48'
        };

        state.listColumns.forEach(col => {
            const cell = document.createElement('div');
            let alignClass = (col === 'check') ? 'justify-center text-center' : 'justify-start text-left pl-2';
            
            cell.className = `${colWidths[col]} font-bold text-gray-500 text-sm cursor-move hover:bg-gray-100 py-2 rounded flex items-center gap-1 ${alignClass} flex-shrink-0`;
            
            if (col === 'check') {
                cell.innerHTML = colLabels[col];
            } else {
                cell.innerHTML = `<i class="fas fa-grip-lines-vertical text-gray-300 text-xs"></i> ${colLabels[col]}`;
            }

            cell.draggable = true;
            cell.ondragstart = (e) => e.dataTransfer.setData('text/plain', col);
            cell.ondragover = (e) => e.preventDefault();
            cell.ondrop = (e) => handleDrop(e, col);
            headerRow.appendChild(cell);
        });
        listContainer.appendChild(headerRow);

        // Data Rows
        displayWords.forEach((item, index) => {
            const rowNum = index + 1;
            const row = document.createElement('div');
            row.className = "flex items-center p-2 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0 gap-2 min-w-[800px]";
            
            row.onclick = () => speak(item.word);

            state.listColumns.forEach(col => {
                let cellHTML = '';
                switch(col) {
                    case 'check':
                        cellHTML = `<div class="w-12 text-center flex-shrink-0" onclick="event.stopPropagation(); toggleVocabCheck(${item.id})">
                            <i class="far ${item.checked ? 'fa-check-square text-indigo-600' : 'fa-square text-gray-300'} text-xl"></i>
                        </div>`;
                        break;
                    case 'num': 
                        cellHTML = `<div class="w-12 text-left pl-4 text-indigo-600 font-mono text-xs font-bold flex-shrink-0">${rowNum}</div>`; 
                        break;
                    case 'word': 
                        cellHTML = `<div class="w-40 text-left pl-2 font-bold text-gray-800 text-lg flex-shrink-0 truncate" title="${item.word}">${item.word}</div>`; 
                        break;
                    case 'kk': 
                        cellHTML = `<div class="w-28 text-left pl-2 text-gray-500 font-mono text-sm flex-shrink-0 truncate">${item.kk}</div>`; 
                        break;
                    case 'part': 
                        cellHTML = `<div class="w-14 text-left pl-2 text-gray-500 font-bold text-xs italic flex-shrink-0">${item.part}</div>`; 
                        break;
                    case 'def': 
                        cellHTML = `<div class="flex-1 text-left pl-2 text-gray-600 truncate text-base" title="${item.def}">${item.def}</div>`; 
                        break;
                    case 'other': 
                        const otherText = item.other || '';
                        const hasOther = !!item.other;
                        const speakAction = hasOther ? `onclick="event.stopPropagation(); speak('${item.other.replace(/'/g, "\\'")}')"` : '';
                        const styleClass = hasOther ? 
                            'text-indigo-700 font-bold cursor-pointer hover:bg-indigo-100 hover:text-indigo-900 rounded px-2 -ml-2 transition-colors' : 
                            'text-gray-300 pointer-events-none px-2 -ml-2';
                        
                        cellHTML = `<div class="w-48 text-left pl-2 text-sm flex-shrink-0 truncate ${styleClass}" title="${hasOther ? `點擊念出: ${otherText}` : ''}" ${speakAction}>
                            ${otherText}
                        </div>`; 
                        break;
                }
                row.innerHTML += cellHTML;
            });
            listContainer.appendChild(row);
        });

    } else {
        // --- Full Mode (Cards) - [修改重點] ---
        const toolsRow = document.createElement('div');
        toolsRow.className = "flex justify-between items-center mb-4 px-2";
        toolsRow.innerHTML = `
            <div class="flex items-center gap-2 cursor-pointer text-gray-500 hover:text-indigo-600" onclick="toggleAllVocabCheck(${!isAllChecked})">
                 <i class="far ${isAllChecked ? 'fa-check-square text-indigo-600' : 'fa-square text-gray-300'} text-xl"></i>
                 <span class="text-sm font-bold">全選本頁</span>
            </div>
        `;
        listContainer.appendChild(toolsRow);

        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 gap-4 mb-6";
        displayWords.forEach(item => {
            const card = document.createElement('div');
            card.className = "bg-white p-0 rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative";
            // [修改 1] 移除左側獨立 Checkbox 區塊，改為單一容器
            card.innerHTML = `
                <div class="flex flex-col relative">
                    <div class="absolute top-3 right-3 z-10 p-2 cursor-pointer rounded-full hover:bg-gray-50" onclick="toggleVocabCheck(${item.id}); event.stopPropagation();">
                        <i class="far ${item.checked ? 'fa-check-square text-indigo-600' : 'fa-square text-gray-300'} text-2xl"></i>
                    </div>

                    <div class="p-5 pr-12 cursor-pointer group" onclick="speak('${item.word}')">
                        <div class="flex items-baseline flex-wrap gap-2 mb-2">
                            <span class="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded">U${item.unit}</span>
                            <span class="text-3xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">${item.word}</span>
                            <span class="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded-md">${item.kk}</span>
                            <span class="text-sm font-semibold text-indigo-500 italic">${item.part}</span>
                            
                            ${item.other ? `
                            <span class="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200 ml-1 cursor-pointer hover:bg-indigo-100 hover:text-indigo-900 transition-colors shadow-sm" 
                                  title="點擊朗讀變化形" 
                                  onclick="event.stopPropagation(); speak('${item.other.replace(/'/g, "\\'")}')">
                                <i class="fas fa-code-branch text-xs mr-1 opacity-50"></i>${item.other}
                            </span>` : ''}
                        </div>
                        <p class="text-gray-600 text-lg font-medium mb-2">${item.def}</p>
                    </div>

                    <div class="p-5 border-t border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-indigo-50 transition-colors" onclick="speak('${item.sentence.replace(/'/g, "\\'")}')">
                        <p class="text-gray-800 text-base font-medium leading-relaxed">
                            ${item.sentence}
                            <span class="inline-block ml-2 text-indigo-400"><i class="fas fa-volume-up"></i></span>
                        </p>
                        <p class="text-gray-500 text-sm mt-1">${item.senTrans}</p>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        listContainer.appendChild(grid);
    }
    container.appendChild(listContainer);

    // 5. Bottom Pagination
    if (totalPages > 1) {
        const paginationNav = document.createElement('div');
        paginationNav.className = "flex justify-center items-center gap-4 py-6";
        paginationNav.innerHTML = `
            <button onclick="changePage(-1)" class="w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
            <span class="font-bold text-gray-600 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                ${currentPage} / ${totalPages}
            </span>
            <button onclick="changePage(1)" class="w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        container.appendChild(paginationNav);
    }

    appRoot.appendChild(container);
}

// --- QUIZ VIEW ---
function initQuiz(mode) {
    state.quiz.mode = mode;
    state.quiz.currentIndex = 0;
    state.quiz.score = 0;
    state.quiz.isFinished = false;
    state.quiz.wrongQuestions = [];
    state.quiz.status = 'answering';
    state.quiz.selectedOption = null;

    const activeWords = state.vocabulary.filter(w => state.selectedUnits.includes(w.unit) && w.checked);
    
    if (activeWords.length === 0) {
        state.quiz.questions = []; 
        return;
    }

    // Generate Questions
    if (mode === 'sentence') {
        const validWords = activeWords.filter(w => w.sentence && w.sentence.length > 5);
        
        state.quiz.questions = shuffle([...validWords]).map(w => {
            // --- 1. 找出句子裡實際用的是哪個字 (原形或變化形) ---
            let usedWord = w.word; // 預設為原形
            
            const variations = w.other ? w.other.split('/').map(s => s.trim()).filter(s => s) : [];
            const candidates = [w.word, ...variations];
            
            // 依照長度由長到短排序
            candidates.sort((a, b) => b.length - a.length);

            let matched = false;
            let regex = null;

            for (const cand of candidates) {
                const re = new RegExp(`\\b${cand}\\b`, 'i');
                if (re.test(w.sentence)) {
                    const match = w.sentence.match(re);
                    usedWord = match[0]; // 抓出句子裡實際的大小寫與拼法
                    regex = re;
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                const looseRe = new RegExp(`\\b${w.word}\\w*\\b`, 'i');
                if (looseRe.test(w.sentence)) {
                    const match = w.sentence.match(looseRe);
                    usedWord = match[0];
                    regex = looseRe;
                } else {
                    regex = new RegExp(w.word, 'i');
                }
            }

            // --- 2. 產生題目文字 (挖空) ---
            const blankPlaceholder = '_______';
            const questionText = w.sentence.replace(regex, blankPlaceholder);

            // --- 3. 準備選項 ---
            const others = shuffle(state.vocabulary.filter(cw => cw.id !== w.id)).slice(0, 3);
            const rawOptions = shuffle([w, ...others]);

            const processedOptions = rawOptions.map(opt => {
                let displayText = opt.word; 

                if (opt.id === w.id) {
                    displayText = usedWord;
                } else {
                    if (usedWord.toLowerCase() !== w.word.toLowerCase() && opt.other) {
                        const optVars = opt.other.split('/').map(s => s.trim()).filter(s => s);
                        if (optVars.length > 0) {
                            displayText = optVars[Math.floor(Math.random() * optVars.length)];
                        }
                    }
                }
                return { ...opt, displayText };
            });

            // [新增] 將 usedWord 存入物件中，作為 answerWord
            return { 
                target: w, 
                text: questionText, 
                answerWord: usedWord, // 儲存正確答案的詞形
                options: processedOptions, 
                emoji: getRandomEmoji() 
            };
        });
    } else {
        // 一般模式 (不變)
        state.quiz.questions = shuffle([...activeWords]).map(w => {
            const others = shuffle(state.vocabulary.filter(cw => cw.id !== w.id)).slice(0, 3);
            const options = shuffle([w, ...others]);
            return { target: w, options, emoji: getRandomEmoji() };
        });
    }
}

function renderQuiz() {
    const { questions, currentIndex, score, isFinished, wrongQuestions, status, mode, selectedOption } = state.quiz;
    const container = document.createElement('div');
    container.className = "max-w-4xl mx-auto pb-24 px-4 pt-6 w-full";

    if (questions.length === 0) {
        container.innerHTML = `<div class="text-center p-10 text-gray-500">請先在單字表中勾選要測驗的單字。</div>`;
        appRoot.appendChild(container);
        return;
    }

    if (isFinished) {
        // 結算畫面 (維持不變)
        const total = questions.length;
        const pct = score / total;
        container.innerHTML = `
            <div class="text-center p-8 bg-white rounded-3xl shadow-lg mt-10 mx-4 animate-scale-in max-w-lg mx-auto border-2 border-indigo-50">
                <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                    ${pct > 0.65 ? "🎉" : "💪"}
                </div>
                <h2 class="text-3xl font-bold text-gray-800 mb-2">測驗結束！</h2>
                <p class="text-xl text-gray-600 mb-8">
                  得分: <span class="text-indigo-600 font-bold text-4xl">${score}</span> / ${total}
                </p>
                ${wrongQuestions.length > 0 ? `
                  <button onclick="retryWrongQuestions()" class="w-full py-4 bg-orange-500 text-white rounded-xl font-bold shadow-lg hover:bg-orange-600 transition-all active:scale-95 mb-4 flex items-center justify-center gap-2">
                    <i class="fas fa-redo"></i> 練習答錯的 ${wrongQuestions.length} 題
                  </button>
                ` : ''}
                <button onclick="setState('view', 'list')" class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all active:scale-95">返回主選單</button>
            </div>
        `;
        appRoot.appendChild(container);
        return;
    }

    const currentQ = questions[currentIndex];
    
    // 預設題目文字 (含底線)
    let questionDisplayHTML = mode === 'cn-en' ? currentQ.target.def : (mode === 'en-cn' ? currentQ.target.word : currentQ.text);
    const targetWord = currentQ.target.word;

    // [新增邏輯] 若為句子模式且已作答，將題目中的底線替換為高亮的正確答案
    if (mode === 'sentence' && status === 'result') {
        // 使用 CSS 加上底色(bg-indigo-100) 與 文字顏色(text-indigo-700)
        const highlightedWord = `<span class="inline-block px-2 rounded-md bg-indigo-100 text-indigo-700 border-b-2 border-indigo-400 font-bold mx-1 animate-scale-in">${currentQ.answerWord}</span>`;
        // 將底線替換掉
        questionDisplayHTML = currentQ.text.replace('_______', highlightedWord);
    }

    let headerHTML = `
        <div class="mb-6 flex justify-between items-center text-sm font-medium text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
            <span>進度: ${currentIndex + 1} / ${questions.length}</span>
            <button onclick="endQuiz()" class="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200 hover:bg-red-50 transition-colors">
               <i class="fas fa-sign-out-alt"></i> 結束
            </button>
        </div>`;

    if (mode !== 'sentence') {
        // 一般模式 Header
        headerHTML += `
        <div class="relative bg-white p-6 md:p-8 rounded-3xl shadow-sm mb-6 flex flex-col md:block items-center justify-center gap-6 border-b-4 border-indigo-100 min-h-[160px]">
             <div onclick="speak('${targetWord}')" class="flex-shrink-0 bg-indigo-50 w-24 h-24 md:w-24 md:h-24 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 hover:bg-indigo-100 transition-all active:scale-95 group mb-4 md:mb-0 md:absolute md:left-8 md:top-1/2 md:-translate-y-1/2 z-10">
                 <div class="text-5xl filter drop-shadow-sm group-hover:scale-110 transition-transform">
                    ${currentQ.emoji}
                 </div>
              </div>
              <div class="w-full flex flex-col items-center justify-center text-center md:h-[120px] md:px-32">
                <h3 onclick="speak('${targetWord}')" class="text-3xl md:text-4xl font-bold text-gray-800 leading-tight cursor-pointer hover:text-indigo-600 transition-colors select-none active:scale-[0.98]">
                    ${questionDisplayHTML}
                </h3>
            </div>
        </div>
        `;
    } else {
        // 句子模式 Header
        headerHTML += `
        <div class="bg-white p-6 md:p-10 rounded-3xl shadow-sm mb-6 min-h-[220px] flex flex-col justify-center border border-gray-100 text-center relative overflow-hidden">
             <h3 class="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed font-serif relative z-10">${questionDisplayHTML}</h3>
             
             ${status === 'result' ? `
                <div class="mt-6 p-4 rounded-xl text-center animate-fade-in border ${selectedOption.id === currentQ.target.id ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
                     <div class="flex items-center justify-center gap-2 mb-2">
                        <i class="fas ${selectedOption.id === currentQ.target.id ? 'fa-check-circle text-green-600' : 'fa-times-circle text-red-600'} text-xl"></i>
                        <span class="text-lg font-bold text-gray-500">正確答案: </span>
                        <span class="text-xl font-bold text-indigo-600">${currentQ.answerWord}</span>
                        <button onclick="speak('${currentQ.target.word}')" class="p-1 bg-white rounded-full shadow-sm hover:bg-gray-100"><i class="fas fa-volume-up text-gray-600"></i></button>
                     </div>
                     <p class="text-gray-700 font-medium">${currentQ.target.senTrans}</p>
                </div>
             ` : ''}
        </div>
        `;
    }

    // 選項區塊
    let optionsHTML = '';
    if (status === 'answering') {
        optionsHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${currentQ.options.map(opt => {
                let content = '';
                if (mode === 'sentence') {
                    content = opt.displayText || opt.word; 
                } else if (mode === 'cn-en') {
                    content = opt.word;
                } else {
                    content = opt.def;
                }
                
                return `<button onclick="handleAnswer(${opt.id})" class="p-6 rounded-xl text-xl font-medium border-2 bg-white border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700 active:scale-[0.98] shadow-sm hover:-translate-y-1 transition-all relative overflow-hidden">${content}</button>`;
            }).join('')}
        </div>`;
    } else {
         if (mode !== 'sentence') {
             // 一般模式的結果選項
             optionsHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${currentQ.options.map(opt => {
                    const content = mode === 'cn-en' ? opt.word : opt.def;
                    let btnClass = "p-6 rounded-xl text-xl font-medium border-2 transition-all relative overflow-hidden ";
                    if (opt.id === currentQ.target.id) btnClass += "bg-green-50 border-green-500 text-green-800 shadow-md transform scale-[1.02]";
                    else if (opt.id === selectedOption.id) btnClass += "bg-red-50 border-red-500 text-red-800";
                    else btnClass += "bg-gray-50 border-gray-100 text-gray-400 opacity-50";
                    return `<button disabled class="${btnClass}">${content}</button>`;
                }).join('')}
             </div>`;
         } else {
             // 句子模式的下一題按鈕 (選項消失，只留按鈕)
             optionsHTML = `<button onclick="nextQuestion()" class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 animate-bounce-subtle">
                ${currentIndex < questions.length - 1 ? '下一題' : '查看結果'} <i class="fas fa-chevron-right"></i>
             </button>`;
         }
    }

    container.innerHTML = headerHTML + optionsHTML;
    appRoot.appendChild(container);
}

function handleAnswer(optionId) {
    const currentQ = state.quiz.questions[state.quiz.currentIndex];
    const option = currentQ.options.find(o => o.id === optionId);
    state.quiz.selectedOption = option;
    
    speak(currentQ.target.word);

    if (option.id === currentQ.target.id) {
        state.quiz.score++;
    } else {
        state.quiz.wrongQuestions.push(currentQ.target);
    }

    if (state.quiz.mode === 'sentence') {
        state.quiz.status = 'result';
        render(); // Use render() to ensure screen is cleared and redrawn
    } else {
        state.quiz.status = 'result';
        render(); // Use render() to ensure screen is cleared and redrawn
        setTimeout(nextQuestion, 1000);
    }
}

function nextQuestion() {
    if (state.quiz.currentIndex < state.quiz.questions.length - 1) {
        state.quiz.currentIndex++;
        state.quiz.status = 'answering';
        state.quiz.selectedOption = null;
        render();
    } else {
        endQuiz();
    }
}

function endQuiz() {
    state.quiz.isFinished = true;
    render();
}

function retryWrongQuestions() {
    // Generate new questions based on wrong ones
    const wrongWords = state.quiz.wrongQuestions;
    if (state.quiz.mode === 'sentence') {
         state.quiz.questions = shuffle([...wrongWords]).map(w => {
            const regex = new RegExp(`\\b${w.word}\\w*\\b`, 'i');
            const questionText = w.sentence.replace(regex, '_______');
            const others = shuffle(state.vocabulary.filter(cw => cw.id !== w.id)).slice(0, 3);
            const options = shuffle([w, ...others]);
            return { target: w, text: questionText, options, emoji: getRandomEmoji() };
        });
    } else {
        state.quiz.questions = shuffle([...wrongWords]).map(w => {
            const others = shuffle(state.vocabulary.filter(cw => cw.id !== w.id)).slice(0, 3);
            const options = shuffle([w, ...others]);
            return { target: w, options, emoji: getRandomEmoji() };
        });
    }
    state.quiz.wrongQuestions = [];
    state.quiz.currentIndex = 0;
    state.quiz.score = 0;
    state.quiz.isFinished = false;
    state.quiz.status = 'answering';
    state.quiz.selectedOption = null;
    render();
}

// --- STORY VIEW ---
function renderStory() {
    const validStories = STORIES.filter(story => story.units.some(u => state.selectedUnits.includes(u)));
    const container = document.createElement('div');
    container.className = "pb-48 w-full max-w-4xl mx-auto";

    if (validStories.length === 0) {
        container.innerHTML = `<div class="p-10 text-center text-gray-500">您選擇的單元沒有相關故事。</div>`;
        appRoot.appendChild(container);
        return;
    }

    if (state.story.activeIndex >= validStories.length) {
        state.story.activeIndex = 0;
    }
    const currentStory = validStories[state.story.activeIndex];

    // --- 計算上一篇/下一篇索引 ---
    const prevIndex = (state.story.activeIndex - 1 + validStories.length) % validStories.length;
    const nextIndex = (state.story.activeIndex + 1) % validStories.length;

    const segments = currentStory.text.split(/(\{.*?\})/).map((part, idx) => {
        if (part.startsWith('{') && part.endsWith('}')) {
            return { type: 'word', content: part.slice(1, -1), id: idx };
        }
        return { type: 'text', content: part };
    });

    // 單字庫邏輯
    const rawWords = [...new Set(segments.filter(s => s.type === 'word').map(s => s.content.toLowerCase()))];
    if (state.story.cachedTitle !== currentStory.title || !state.story.currentWordBank) {
        state.story.cachedTitle = currentStory.title;
        state.story.currentWordBank = rawWords.sort();
    }
    const wordBank = state.story.currentWordBank;

    // --- Header ---
    const header = document.createElement('div');
    header.className = "px-4 mb-4";
    header.innerHTML = `
        <div class="flex items-center gap-2">
            <button onclick="changeStory(${prevIndex})" class="w-12 h-12 flex items-center justify-center rounded-xl bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm active:scale-95 flex-shrink-0" title="上一篇">
                <i class="fas fa-chevron-left"></i>
            </button>

            <div class="relative flex-1">
                <select onchange="changeStory(this.value)" class="w-full p-3 pr-8 rounded-xl border-2 border-indigo-100 bg-white font-bold text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none appearance-none cursor-pointer transition-all truncate h-12">
                    ${validStories.map((s, idx) => `<option value="${idx}" ${idx === state.story.activeIndex ? 'selected' : ''}>${s.title}</option>`).join('')}
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500 text-sm"><i class="fas fa-chevron-down"></i></div>
            </div>

            <button onclick="changeStory(${nextIndex})" class="w-12 h-12 flex items-center justify-center rounded-xl bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm active:scale-95 flex-shrink-0" title="下一篇">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
    container.appendChild(header);

    const controls = document.createElement('div');
    controls.className = "px-4";
    
    // 準備要朗讀的文字
    const speakText = currentStory.text.replace(/[{}]/g, '').replace(/'/g, "\\'");
    
    // --- 判斷播放狀態 (決定按鈕樣式) ---
    // 檢查目前是否正在播放「這篇故事」
    const isPlayingThis = state.audio.isPlaying && state.audio.lastText === currentStory.text.replace(/[{}]/g, '');
    const currentRate = state.audio.lastRate;

    // 1. 正常速度按鈕設定
    const isNormalActive = isPlayingThis && currentRate === 1;
    const normalBtnClass = isNormalActive 
        ? "bg-gray-600 text-white hover:bg-gray-700 shadow-inner"  // 停止樣式
        : "bg-amber-100 text-amber-800 hover:bg-amber-200";         // 播放樣式
    const normalIcon = isNormalActive ? "fa-stop" : "fa-volume-up";
    const normalText = isNormalActive ? "停止" : "正常";

    // 2. 慢速按鈕設定
    const isSlowActive = isPlayingThis && currentRate === 0.7;
    const slowBtnClass = isSlowActive 
        ? "bg-gray-600 text-white hover:bg-gray-700 shadow-inner"   // 停止樣式
        : "bg-green-100 text-green-800 hover:bg-green-200";           // 播放樣式
    const slowIcon = isSlowActive ? "fa-stop" : ""; // 慢速播放時顯示 Stop，否則無 icon (用 emoji)
    const slowContent = isSlowActive ? "" : "🐢";   // 慢速播放時不顯示龜，否則顯示龜
    const slowText = isSlowActive ? "停止" : "慢速";

    controls.innerHTML = `
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                <h2 class="font-bold text-lg text-gray-800 line-clamp-1">故事閱讀</h2>
                
                <div class="flex gap-2 self-end sm:self-auto">
                    <button onclick="speak('${speakText}', 1)" class="flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${normalBtnClass}">
                        <i class="fas ${normalIcon}"></i> ${normalText}
                    </button>
                    
                    <button onclick="speak('${speakText}', 0.7)" class="flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${slowBtnClass}">
                        ${slowIcon ? `<i class="fas ${slowIcon}"></i>` : slowContent} ${slowText}
                    </button>
                </div>
            </div>
            
            <div class="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button onclick="setStoryMode('read')" class="flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${state.story.mode === 'read' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">
                    <i class="far fa-eye"></i> 閱讀
                </button>
                <button onclick="setStoryMode('quiz')" class="flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${state.story.mode === 'quiz' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">
                    <i class="far fa-check-circle"></i> 填空
                </button>
            </div>
        </div>
    `;
    container.appendChild(controls);

    const content = document.createElement('div');
    content.className = "bg-white p-6 md:p-8 rounded-2xl shadow-md mb-6 leading-loose text-lg text-gray-800 font-serif mx-4";
    
    if (state.story.mode === 'read') {
        content.innerHTML = `<div>
            ${currentStory.translations.map((item, idx) => {
                const isRevealed = state.story.revealedTrans[idx];
                return `
                <div class="mb-6 last:mb-0">
                    <p class="mb-1 cursor-pointer hover:bg-indigo-50 rounded px-2 -mx-2 transition-colors py-1" onclick="speak('${item.text.replace(/'/g, "\\'")}')">
                        ${item.text.split(' ').map(word => {
                            const cleanWord = word.replace(/[^a-zA-Z]/g, '');
                            const isKey = state.vocabulary.some(v => v.word.toLowerCase() === cleanWord.toLowerCase());
                            return `<span class="${isKey ? 'font-bold text-indigo-700 border-b-2 border-indigo-100' : ''}">${word} </span>`;
                        }).join('')}
                    </p>
                    <div class="flex items-start gap-2 pl-1 select-none">
                        <button onclick="toggleTrans(${idx})" class="mt-1 flex-shrink-0 transition-transform hover:scale-110 active:scale-90 focus:outline-none" title="切換翻譯">
                            <i class="fas ${isRevealed ? 'fa-minus-circle text-indigo-500' : 'fa-plus-circle text-gray-300 hover:text-indigo-400'} text-lg"></i>
                        </button>
                        ${isRevealed ? `<span class="text-gray-600 text-base leading-snug animate-fade-in pt-0.5">${item.trans}</span>` : ''}
                    </div>
                </div>
                `;
            }).join('')}
        </div>`;
    } else {
        content.className += " leading-[3.5rem]";
        content.innerHTML = `<div>
            ${segments.map(seg => {
                if (seg.type === 'text') return `<span>${seg.content}</span>`;
                
                const userWord = state.story.filledBlanks[seg.id];
                const isActive = state.story.selectedBlank === seg.id;
                const isError = state.story.errorBlank === seg.id;
                const isFinished = !!userWord;

                let cssClass = "inline-flex items-center justify-center mx-1 min-w-[80px] h-10 border-b-2 transition-all px-3 rounded-md align-middle font-bold ";
                cssClass += isFinished ? "cursor-default " : "cursor-pointer ";
                
                if (isError) {
                    cssClass += "border-red-500 bg-red-100 text-red-600 animate-pulse";
                } else if (isActive) {
                    cssClass += "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 text-indigo-700";
                } else if (userWord) {
                    cssClass += "border-green-500 text-green-700 bg-green-50";
                } else {
                    cssClass += "border-gray-300 bg-gray-50 text-gray-400 hover:bg-gray-100";
                }

                const clickAction = isFinished ? "" : `onclick="selectStoryBlank(${seg.id})"`;
                let innerContent = '';
                if (userWord) {
                    innerContent = userWord;
                } else if (isError) {
                    innerContent = '<i class="fas fa-exclamation-circle text-xl"></i>';
                } else {
                    innerContent = '<i class="fas fa-hand-pointer text-indigo-100 text-lg transform rotate-[-15deg]"></i>';
                }

                return `<span ${clickAction} class="${cssClass}">${innerContent}</span>`;
            }).join('')}
        </div>`;
    }
    container.appendChild(content);

    if (state.story.mode === 'quiz') {
        const footer = document.createElement('div');
        footer.className = "fixed bottom-[70px] left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 overflow-x-auto";
        footer.innerHTML = `
            <div class="max-w-4xl mx-auto">
                <div class="flex flex-wrap justify-center gap-2 pb-1">
                    ${wordBank.map(word => `
                        <button onclick="fillStoryBlank('${word}')" class="px-4 py-2 rounded-xl font-bold text-sm border transition-all active:scale-95 ${state.story.selectedBlank !== null ? 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 shadow-sm' : 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed'}" ${state.story.selectedBlank === null ? 'disabled' : ''}>
                            ${word}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        container.appendChild(footer);
    }

    appRoot.appendChild(container);
}

// --- EVENT HANDLERS & HELPERS ---

// Global helper to update state and re-render
function setState(key, value) {
    state[key] = value;
    render();
    
    // 新增：如果是切換主視圖 (view)，自動滾動到頁面最上方
    if (key === 'view') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function toggleUnit(unit) {
    if (state.selectedUnits.includes(unit)) {
        state.selectedUnits = state.selectedUnits.filter(u => u !== unit);
    } else {
        state.selectedUnits.push(unit);
    }
    // 修正：必須呼叫 render() 而不是 renderHome()，以確保畫面先被清空再重繪
    render(); 
}

function toggleAllUnits() {
    if (state.selectedUnits.length === state.allUnits.length) {
        state.selectedUnits = [];
    } else {
        state.selectedUnits = [...state.allUnits];
    }
    // 修正：必須呼叫 render()
    render();
}

function startLearning() {
    if (state.selectedUnits.length === 0) {
        alert("請至少選擇一個單元！");
        return;
    }
    setState('view', 'list');
}

function toggleVocabCheck(id) {
    state.vocabulary = state.vocabulary.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
    );
    render(); // FIX: Call render() to clear screen
}

function setPaginationMode(mode) {
    state.pagination.mode = mode;
    state.pagination.currentPage = 1; 
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changePage(delta) {
    state.pagination.currentPage += delta;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


function toggleAllVocabCheck(checked) {
    // 1. 重新取得目前頁面的單字 (邏輯需與 renderList 相同，為避免重複代碼，這裡簡化處理：)
    // 簡單做法：針對目前 selectedUnits 下的所有單字操作 (原行為)
    // 或者：只針對「目前顯示在畫面上」的單字操作 (更直覺)
    
    // 為了符合使用者預期「勾選本頁」，我們採用後者：
    
    // 步驟 A: 取得所有候選字並排序
    let allWords = state.vocabulary.filter(w => state.selectedUnits.includes(w.unit));
    if (state.sortOrder === 'alpha') {
        allWords.sort((a, b) => a.word.localeCompare(b.word));
    } else {
        allWords.sort((a, b) => a.id - b.id);
    }

    // 步驟 B: 根據分頁模式找出目前的單字 ID 列表
    let targetIds = [];
    const mode = state.pagination.mode;
    let page = state.pagination.currentPage;

    if (mode === 'all') {
        targetIds = allWords.map(w => w.id);
    } else if (mode === 'unit') {
        const distinctUnits = [...new Set(allWords.map(w => w.unit))].sort((a, b) => a - b);
        if (distinctUnits.length > 0) {
             // 防呆
            if (page > distinctUnits.length) page = 1;
            const currentUnit = distinctUnits[page - 1];
            targetIds = allWords.filter(w => w.unit === currentUnit).map(w => w.id);
        }
    } else {
        const pageSize = parseInt(mode);
        const totalPages = Math.ceil(allWords.length / pageSize);
        if (page > totalPages) page = 1;
        const startIndex = (page - 1) * pageSize;
        const pageWords = allWords.slice(startIndex, startIndex + pageSize);
        targetIds = pageWords.map(w => w.id);
    }

    // 步驟 C: 更新 state
    state.vocabulary = state.vocabulary.map(item => 
        targetIds.includes(item.id) ? { ...item, checked: checked } : item
    );
    render();
}

function toggleSortOrder() {
    state.sortOrder = state.sortOrder === 'default' ? 'alpha' : 'default';
    render(); // FIX: Call render() to clear screen
}

function toggleListMode() {
    state.listMode = state.listMode === 'full' ? 'compact' : 'full';
    render(); // FIX: Call render() to clear screen
}

// Drag and Drop Logic
function handleDrop(e, targetCol) {
    e.preventDefault();
    const draggedCol = e.dataTransfer.getData('text/plain');
    if (draggedCol === targetCol) return;

    const newCols = [...state.listColumns];
    const fromIdx = newCols.indexOf(draggedCol);
    const toIdx = newCols.indexOf(targetCol);

    newCols.splice(fromIdx, 1);
    newCols.splice(toIdx, 0, draggedCol);
    state.listColumns = newCols;
    render(); // FIX: Call render() to clear screen
}

// Story Logic
function changeStory(idx) {
    state.story.activeIndex = parseInt(idx);
    state.story.filledBlanks = {};
    state.story.selectedBlank = null;
    state.story.revealedTrans = {};
    
    // 重置緩存與錯誤計數
    state.story.currentWordBank = null;
    state.story.cachedTitle = null; 
    state.story.consecutiveErrors = 0; // [新增] 重置錯誤計數
    
    render();
}

function setStoryMode(mode) {
    state.story.mode = mode;
    render(); // FIX: Call render() to clear screen
}

function toggleTrans(idx) {
    state.story.revealedTrans[idx] = !state.story.revealedTrans[idx];
    render(); // FIX: Call render() to clear screen
}

function selectStoryBlank(id) {
    // 新增：如果該格子已經填入正確答案 (在 filledBlanks 中有值)，則直接返回，不允許選取
    if (state.story.filledBlanks[id]) return;

    state.story.selectedBlank = id;
    render(); // FIX: Call render() to clear screen
}

function fillStoryBlank(userWord) {
    if (state.story.selectedBlank === null) return;

    const validStories = STORIES.filter(story => story.units.some(u => state.selectedUnits.includes(u)));
    if (validStories.length === 0 || state.story.activeIndex >= validStories.length) return;
    const currentStory = validStories[state.story.activeIndex];

    let correctWord = null;
    currentStory.text.split(/(\{.*?\})/).forEach((part, idx) => {
        if (idx === state.story.selectedBlank && part.startsWith('{') && part.endsWith('}')) {
            correctWord = part.slice(1, -1);
        }
    });

    if (!correctWord) return;

    if (userWord === correctWord) {
        // --- 答對 ---
        state.story.filledBlanks[state.story.selectedBlank] = userWord;
        state.story.selectedBlank = null;
        state.story.consecutiveErrors = 0; // 重置錯誤計數
        
        speak(userWord);
        render();
    } else {
        // --- 答錯 ---
        speak(userWord);
        state.story.consecutiveErrors = (state.story.consecutiveErrors || 0) + 1;

        // [修改點] 檢查是否達到 5 次錯誤
        if (state.story.consecutiveErrors >= 5) {
            
            // 使用新的美觀提示窗
            showCustomAlert("您似乎遇到了一些困難，<br>建議先回到閱讀模式複習一下喔！", () => {
                // 1. 清空作答
                state.story.filledBlanks = {};
                // 2. 重置狀態
                state.story.consecutiveErrors = 0;
                state.story.selectedBlank = null;
                state.story.errorBlank = null;
                // 3. 自動切換回「閱讀模式」(更符合提示語境)
                state.story.mode = 'read';
                
                render();
            });
            return; // 中斷後續執行，等待使用者點擊確認
        }
        
        // 未達 5 次，顯示錯誤紅框
        state.story.errorBlank = state.story.selectedBlank;
        render();
        
        setTimeout(() => {
            state.story.errorBlank = null;
            render();
        }, 800);
    }
}


function showCustomAlert(message, callback) {
    // 1. 建立遮罩層
    const overlay = document.createElement('div');
    overlay.className = "fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-fade-in p-4";

    // 2. 建立卡片內容
    const card = document.createElement('div');
    card.className = "bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all animate-scale-in border-4 border-indigo-50 relative overflow-hidden";

    // 裝飾背景圓圈
    const decor = document.createElement('div');
    decor.className = "absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full opacity-50 pointer-events-none";
    card.appendChild(decor);

    card.innerHTML += `
        <div class="relative z-10">
            <div class="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-5 text-indigo-600 shadow-sm">
                <i class="fas fa-book-reader text-3xl"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-3">學習建議</h3>
            <p class="text-gray-600 mb-8 font-medium leading-relaxed text-lg">${message}</p>
            <button id="custom-alert-btn" class="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                <span>好的，前往閱讀</span> <i class="fas fa-arrow-right"></i>
            </button>
        </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // 3. 綁定按鈕事件
    const btn = card.querySelector('#custom-alert-btn');
    btn.onclick = () => {
        // 移除特效並關閉
        overlay.classList.remove('animate-fade-in');
        overlay.classList.add('opacity-0', 'transition-opacity', 'duration-200');
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            if (callback) callback();
        }, 200);
    };
}

function getRandomEmoji() {
    if (typeof EMOJIS !== 'undefined' && EMOJIS.length > 0) {
        return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    }
    return '🌟';
}

// Start the app
init();