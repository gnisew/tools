// --- CONSTANTS & CONFIG ---
const STORAGE_KEY = 'vioiv_vocab_custom_sets_v1';

// --- STATE MANAGEMENT ---
const state = {
    view: 'home',
    // 過濾模式: 'default' (依單元) 或 'custom' (依自訂學習集)
    filterMode: 'default', 
    
    // Default Mode 相關
    selectedUnits: [],
    allUnits: [],
    
    // Custom Mode 相關
    customSets: [], // 從 LocalStorage 載入
    activeSetId: null, // 目前選中的學習集 ID
    homeTab: 'default', // 首頁分頁: 'default' 或 'custom'

    vocabulary: [], // Will be initialized from VOCAB_DATA
    
    // UI 狀態
    listMode: 'full', // 'full' or 'compact'
    sortOrder: 'default', // 'default' or 'alpha'
    listColumns: ['check', 'num', 'word', 'kk', 'part', 'other', 'def'],
    highlightVowels: true,
    pagination: {
        mode: 'unit', // 'unit', '50', '100', 'all'
        currentPage: 1
    },
    
	quiz: {
        questions: [],
        currentIndex: 0,
        score: 0,
        wrongQuestions: [],
        status: 'answering',
        selectedOption: null,
        isFinished: false,
		lastActionTime: 0, // 上一次點擊或按鍵的時間戳記
        spamCounter: 0,    // 連續快速操作的計數器
        mode: '',
        subMode: 'choice', // 'choice' (四選一) 或 'spell' (拼字)
		spellingDifficulty: 5, 
		sentenceDifficulty: 5,
        matchingDifficulty: 4, 
        matching: {
            items: [],      // 卡片列表
            selectedId: null, // 目前選中的卡片 ID
            matchedPairs: 0, // 已配對組數
            totalPairs: 0   // 本輪總組數
        },
        spelling: {
            currentWord: "",
            revealedMask: [],
            letterPool: [],
            nextIndex: 0
        },
		ordering: {
            targetWords: [],
            revealedMask: [],
            wordPool: [],
            nextIndex: 0
        }
    },
    story: {
        activeIndex: 0,
        mode: 'read',
        filledBlanks: {},
        selectedBlank: null,
        revealedTrans: {},
        consecutiveErrors: 0,
        showCelebration: false,
        currentWordBank: null,
        cachedTitle: null,
		feedbackSpeed: 1,
		options: {
            showEnglish: true,
            showTranslation: true, // 預設顯示翻譯，也可設為 false
			feedbackAudio: true
        },
		quizStatus: 'idle', // 'idle' (尚未開始), 'playing' (進行中), 'finished' (完成)
        timer: 0,           // 秒數
        timerInterval: null // setInterval ID
    },
    audio: {
        lastText: null,
        lastRate: null,
        isPlaying: false
    }
};

// --- DOM ELEMENTS ---
const appRoot = document.getElementById('app-root');
const navContainer = document.getElementById('nav-container');

// --- INITIALIZATION ---
function init() {
    if (typeof VOCAB_DATA !== 'undefined') {
        // 初始化單字資料 (產生 ID)
        state.vocabulary = JSON.parse(JSON.stringify(VOCAB_DATA)).map((item, index) => ({
            ...item,
            id: index + 1,
            checked: true
        }));
        
        const distinctUnits = [...new Set(state.vocabulary.map(v => v.unit))].sort((a, b) => a - b);
        state.allUnits = distinctUnits;
        state.selectedUnits = [...distinctUnits];
       
    } else {
        console.error("VOCAB_DATA not found.");
    }

    // 載入自訂學習集
    loadCustomSets();
    renderNav();
    render();
	initNavToggle();
}

// --- STORAGE MANAGER ---
function loadCustomSets() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            state.customSets = JSON.parse(stored);
        } else {
            state.customSets = [];
        }
    } catch (e) {
        console.error("Failed to load sets", e);
        state.customSets = [];
    }
}

function saveCustomSets() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.customSets));
    } catch (e) {
        console.error("Failed to save sets", e);
        alert("儲存失敗，可能是儲存空間已滿。");
    }
}

function createCustomSet(name, initialWordIds = []) {
    const newSet = {
        id: 'set_' + Date.now(),
        name: name,
        wordIds: initialWordIds,
        createdAt: Date.now()
    };
    state.customSets.push(newSet);
    saveCustomSets();
    return newSet;
}

function updateCustomSet(id, newName) {
    const set = state.customSets.find(s => s.id === id);
    if (set) {
        set.name = newName;
        saveCustomSets();
        render();
    }
}

function deleteCustomSet(id) {
    const event = window.event;
    if(event) event.stopPropagation();

    const set = state.customSets.find(s => s.id === id);
    if (!set) return;

    showConfirmModal(
        "刪除學習集",
        `確定要刪除「${set.name}」嗎？<br>此動作無法復原。`,
        () => {
            state.customSets = state.customSets.filter(s => s.id !== id);
            
            if (state.activeSetId === id) {
                state.activeSetId = null;
                state.filterMode = 'default';
            }
            
            saveCustomSets();
            render();
            showToast("學習集已刪除");
        },
        "刪除",
        "bg-red-500"
    );
}

function addWordsToSet(setId, wordIds) {
    const set = state.customSets.find(s => s.id === setId);
    if (!set) return;

    const newIds = [...new Set([...set.wordIds, ...wordIds])];
    set.wordIds = newIds;
    saveCustomSets();
    showToast(`成功加入 ${wordIds.length} 個單字到「${set.name}」`);
}

function removeWordFromSet(setId, wordId) {
    const set = state.customSets.find(s => s.id === setId);
    if (!set) return;

    set.wordIds = set.wordIds.filter(id => id !== wordId);
    saveCustomSets();
    render();
}

// --- CORE RENDER FUNCTION ---
function render() {
    appRoot.innerHTML = '';
    
    switch (state.view) {
        case 'home':
            renderHome();
            break;
        case 'list':
            renderList();
            break;
        case 'quiz-cn':
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

    renderNav();
    updateNavActiveState();
}

// --- HOME VIEW ---
function renderHome() {
    const container = document.createElement('div');
    container.className = "flex flex-col items-center justify-start w-full max-w-2xl min-h-[80vh] px-4 pt-6 pb-28"; 
    
    const headerHTML = `
        <div class="w-full mb-4 pl-1">
            <h1 class="text-3xl font-extrabold text-gray-800 tracking-tight">Let's Learn!</h1>
        </div>
    `;

    const tabHTML = `
        <div class="w-full bg-gray-100 p-1.5 rounded-2xl flex relative mb-6 shadow-inner">
            <button onclick="setHomeTab('default')" class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 z-10 ${state.homeTab === 'default' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}">
                <i class="fas fa-book-open mr-2"></i>課程單元
            </button>
            <button onclick="setHomeTab('custom')" class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 z-10 ${state.homeTab === 'custom' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}">
                <i class="fas fa-folder mr-2"></i>我的收藏
            </button>
        </div>
    `;

    let contentHTML = '';

    // --- TAB 1: 預設單元 ---
    if (state.homeTab === 'default') {
        const isAllSelected = state.selectedUnits.length === state.allUnits.length;
        
        const unitsHTML = state.allUnits.map(unit => {
            const isSelected = state.selectedUnits.includes(unit);
            const count = state.vocabulary.filter(v => v.unit === unit).length;
            
            const cardClass = isSelected 
                ? 'bg-indigo-50 border-indigo-600 border-2 shadow-sm' 
                : 'bg-white border-gray-200 border-2 hover:border-indigo-200 hover:bg-gray-50';

            const titleClass = isSelected ? 'text-indigo-800' : 'text-gray-600';
            const subTextClass = isSelected ? 'text-indigo-500 font-bold' : 'text-gray-400';
            const iconClass = isSelected ? 'text-indigo-600' : 'text-gray-200';

            return `
                <div onclick="toggleUnit(${unit})" class="relative group cursor-pointer rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between h-24 ${cardClass}">
                    <div class="flex justify-between items-start">
                        <span class="font-bold text-lg ${titleClass}">Unit ${unit}</span>
                        <i class="fas ${isSelected ? 'fa-check-circle' : 'fa-circle'} ${iconClass} text-2xl transition-colors"></i>
                    </div>
                    <div class="text-xs font-mono mt-auto ${subTextClass}">
                        ${count} words
                    </div>
                </div>
            `;
        }).join('');

        contentHTML = `
            <div class="w-full">
                <div class="mb-5">
                    <button onclick="toggleAllUnits()" class="w-full py-3 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center gap-2 font-bold text-sm ${isAllSelected ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400'}">
                        <i class="fas ${isAllSelected ? 'fa-check-square' : 'fa-square'} text-lg"></i>
                        <span>${isAllSelected ? '取消全選' : '全選所有單元'}</span>
                    </button>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-4">
                    ${unitsHTML}
                </div>
            </div>
        `;

    // --- TAB 2: 自訂學習集 ---
    } else {
        const hasSets = state.customSets.length > 0;
        let setsHTML = '';
        
        if (!hasSets) {

        } else {
            setsHTML = state.customSets.map(set => {
                const isSelected = state.activeSetId === set.id;
                const isEmpty = set.wordIds.length === 0;
                let borderClass = '', iconColor = '', textColor = '', countColor = '', clickAction = '', cursorClass = 'cursor-default';

                if (isEmpty) {
                    borderClass = 'bg-gray-100 border-gray-200 border-2'; 
                    iconColor = 'text-gray-400';
                    textColor = 'text-gray-500';
                    countColor = 'text-gray-400';
                    clickAction = ''; 
                    cursorClass = 'cursor-default'; 
                } else {
                    borderClass = isSelected 
                        ? 'bg-indigo-50 border-indigo-600 border-2 shadow-sm' 
                        : 'bg-white border-gray-200 border-2 hover:border-indigo-300 hover:bg-gray-50';
                    iconColor = isSelected ? 'text-indigo-600' : 'text-amber-400';
                    textColor = isSelected ? 'text-indigo-900' : 'text-gray-800';
                    countColor = isSelected ? 'text-indigo-500' : 'text-gray-400';
                    clickAction = `onclick="selectCustomSet('${set.id}')"`; 
                    cursorClass = 'cursor-pointer'; 
                }
                
                return `
                    <div ${clickAction} class="relative group ${cursorClass} rounded-2xl p-3 transition-all duration-200 flex flex-col justify-between h-28 ${borderClass}">
                        <div class="flex justify-between items-start gap-2">
                            <div class="flex flex-col overflow-hidden">
                                <div class="flex items-center gap-1.5 mb-1">
                                    <i class="fas fa-folder ${iconColor} text-sm"></i>
                                    <span class="text-[10px] ${isEmpty ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 text-indigo-600'} px-1.5 rounded font-bold">
                                        ${isEmpty ? 'Empty' : 'Set'}
                                    </span>
                                </div>
                                <h3 class="font-bold text-sm ${textColor} truncate leading-tight" title="${set.name}">${set.name}</h3>
                            </div>
                            <div class="w-5 h-5 flex-shrink-0 flex items-center justify-center ${isEmpty ? 'opacity-0' : 'opacity-100'}">
                                <i class="fas ${isSelected ? 'fa-check-circle text-indigo-600' : 'fa-circle text-gray-200'} text-xl transition-colors"></i>
                            </div>
                        </div>
                        <div class="flex justify-between items-end mt-auto">
                            <span class="text-xs font-mono font-bold ${countColor}">
                                ${set.wordIds.length} words
                            </span>
                            <div class="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                 <button onclick="openRenameSetModal('${set.id}', '${set.name}'); event.stopPropagation();" class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-black/5 rounded-lg transition-colors" title="重新命名"><i class="fas fa-pen text-xs"></i></button>
                                 <button onclick="deleteCustomSet('${set.id}'); event.stopPropagation();" class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-black/5 rounded-lg transition-colors" title="刪除"><i class="fas fa-trash text-xs"></i></button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        contentHTML = `
            <div class="w-full">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-4">
                    <button onclick="openCreateSetModal()" class="border-2 border-dashed border-indigo-200 rounded-2xl p-3 flex flex-col items-center justify-center gap-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-400 transition-all h-28 group">
                        <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i class="fas fa-plus text-indigo-600 text-sm"></i>
                        </div>
                        <span class="font-bold text-xs">建立新學習集</span>
                    </button>
                    ${setsHTML}
                </div>
            </div>
        `;
    }

    container.innerHTML = headerHTML + tabHTML + contentHTML;
    appRoot.appendChild(container);
}





// --- LIST VIEW ---
function setListMode(mode) {
    state.listMode = mode;
    render();
}

function renderList() {
    const allAvailableCols = [
        { id: 'num', label: '編號' },
        { id: 'word', label: '單字' },
        { id: 'kk', label: 'KK' },
        { id: 'part', label: '詞性' },
        { id: 'other', label: '變化形' },
        { id: 'def', label: '中文定義' },
    ];
    // 1. 根據 FilterMode 篩選資料
    let allWords = [];
    
    if (state.filterMode === 'custom' && state.activeSetId) {
        const set = state.customSets.find(s => s.id === state.activeSetId);
        if (set) {
            allWords = state.vocabulary.filter(w => set.wordIds.includes(w.id));
        } else {
            state.filterMode = 'default';
            allWords = state.vocabulary.filter(w => state.selectedUnits.includes(w.unit));
        }
    } else {
        allWords = state.vocabulary.filter(w => state.selectedUnits.includes(w.unit));
    }

    if (state.sortOrder === 'alpha') {
        allWords.sort((a, b) => a.word.localeCompare(b.word));
    } else {
        allWords.sort((a, b) => a.id - b.id);
    }

    let displayWords = [];
    let totalPages = 1;
    let pageInfo = "";
    const mode = state.pagination.mode; 
    let currentPage = state.pagination.currentPage;
    let seqOffset = 0;

    if (mode === 'all') {
        displayWords = allWords;
        totalPages = 1;
        currentPage = 1;
        pageInfo = `共 ${allWords.length} 字`;
        seqOffset = 0;
    } else if (mode === 'unit') {
        const distinctUnits = [...new Set(allWords.map(w => w.unit))].sort((a, b) => a - b);
        totalPages = distinctUnits.length;
        if (totalPages === 0) {
            currentPage = 1;
            pageInfo = "無資料";
        } else {
            if (currentPage > totalPages) currentPage = 1;
            if (currentPage < 1) currentPage = 1;
            state.pagination.currentPage = currentPage;
            const currentUnit = distinctUnits[currentPage - 1];
            displayWords = allWords.filter(w => w.unit === currentUnit);
            pageInfo = `Unit ${currentUnit}`;
            seqOffset = 0; 
        }
    } else {
        const pageSize = parseInt(mode);
        totalPages = Math.ceil(allWords.length / pageSize);
        if (currentPage > totalPages) currentPage = 1;
        if (currentPage < 1 && totalPages > 0) currentPage = 1;
        state.pagination.currentPage = currentPage;
        const startIndex = (currentPage - 1) * pageSize;
        displayWords = allWords.slice(startIndex, startIndex + pageSize);
        pageInfo = `${currentPage}/${totalPages} 頁`; // 簡化顯示
        seqOffset = startIndex;
    }

    const isAllChecked = displayWords.length > 0 && displayWords.every(w => w.checked);
    
    const container = document.createElement('div');
    container.className = "pb-48 w-full max-w-6xl mx-auto px-4";

    let topPaginationHTML = '';
    if (totalPages > 1) {
        topPaginationHTML = `
            <div class="flex items-center gap-2 bg-indigo-700/50 rounded-lg px-2 py-1">
                <button onclick="changePage(-1)" class="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 transition-colors ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'text-white'}" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left text-xs"></i></button>
                <span class="font-mono text-white text-xs font-bold whitespace-nowrap">${pageInfo}</span>
                <button onclick="changePage(1)" class="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 transition-colors ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'text-white'}" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right text-xs"></i></button>
            </div>
        `;
    }

    const header = document.createElement('div');
    header.className = "bg-indigo-600 text-white p-3 md:px-6 md:py-4 rounded-b-3xl shadow-lg mb-6 -mx-4 md:mx-0 md:rounded-3xl";
	
    const listModeSwitchHTML = `
        <div class="flex bg-indigo-800/50 p-1 rounded-xl shadow-inner select-none">
            <button onclick="setListMode('full')" class="px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 flex items-center gap-2 ${state.listMode === 'full' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-200 hover:text-white hover:bg-white/10'}">
                <i class="fas fa-th"></i><span>完整字表</span>
            </button>
            <button onclick="setListMode('compact')" class="px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 flex items-center gap-2 ${state.listMode === 'compact' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-200 hover:text-white hover:bg-white/10'}">
                <i class="fas fa-list"></i><span>挑選字表</span>
            </button>
        </div>
    `;

    header.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-center gap-3">
           
           <div class="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-start">
               ${listModeSwitchHTML}
           </div>

           <div class="flex flex-wrap justify-center md:justify-end items-center gap-2 w-full md:w-auto">

                ${state.listMode === 'compact' ? `
                <div class="relative group">
                    <button onclick="document.getElementById('col-dropdown').classList.toggle('hidden'); event.stopPropagation();" class="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-sm transition-colors border border-indigo-500/50 shadow-sm">
                        <i class="fas fa-eye"></i>
                    </button>
                    <div id="col-dropdown" class="hidden absolute top-full left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 text-gray-800" onclick="event.stopPropagation()">
                        <div class="text-xs font-bold text-gray-400 px-2 py-1 mb-1">顯示欄位</div>
                        ${allAvailableCols.map(col => {
                            const isChecked = state.listColumns.includes(col.id);
                            return `
                            <label class="flex items-center px-2 py-2 hover:bg-indigo-50 rounded cursor-pointer transition-colors">
                                <input type="checkbox" class="form-checkbox text-indigo-600 rounded w-4 h-4 mr-2" 
                                    ${isChecked ? 'checked' : ''} 
                                    onchange="toggleListColumn('${col.id}')">
                                <span class="text-sm font-bold text-gray-700 select-none">${col.label}</span>
                            </label>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}

                <div class="w-px h-6 bg-indigo-400/30 mx-1 hidden md:block"></div>

               
                <button onclick="toggleSortOrder()" class="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-sm transition-colors border border-indigo-500/50 shadow-sm" title="切換排序">
                    <i class="fas ${state.sortOrder === 'default' ? 'fa-sort-alpha-down' : 'fa-sort-numeric-down'}"></i>
                </button>

                <button onclick="toggleVowelMode()" class="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-sm transition-colors border border-indigo-500/50 shadow-sm" title="切換母音紅字">
                    <i class="fas fa-font ${state.highlightVowels ? 'text-red-300' : 'text-indigo-300'}"></i>
                </button>

                <div class="relative">
                    <select onchange="setPaginationMode(this.value)" class="appearance-none bg-indigo-700 hover:bg-indigo-500 text-white pl-3 pr-8 py-1.5 rounded-lg text-sm font-bold outline-none cursor-pointer transition-colors border border-indigo-500/50 shadow-sm">
                        <option value="unit" ${mode === 'unit' ? 'selected' : ''}>單元換頁</option>
                        <option value="50" ${mode === '50' ? 'selected' : ''}>50筆</option>
                        <option value="100" ${mode === '100' ? 'selected' : ''}>100筆</option>
                        <option value="all" ${mode === 'all' ? 'selected' : ''}>全部</option>
                    </select>
                    <div class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-200 text-xs"><i class="fas fa-chevron-down"></i></div>
                </div>

                ${topPaginationHTML}


           </div>
        </div>
    `;
    container.appendChild(header);

	const listContainer = document.createElement('div');
    
    if (displayWords.length === 0) {
        listContainer.innerHTML = `<div class="text-center py-10 text-gray-500">本頁無資料</div>`;
    } else if (state.listMode === 'compact') {
        listContainer.className = "bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 relative overflow-x-auto";
        
        const headerRow = document.createElement('div');
        headerRow.className = "sticky top-0 z-30 flex bg-gray-50 p-2 border-b border-gray-200 gap-2 select-none min-w-[800px] shadow-sm";
        
        const checkIcon = isAllChecked ? 'fa-check-square text-indigo-600' : 'fa-square text-gray-400';
        
        const colLabels = { 
            check: `<i class="far ${checkIcon} text-lg cursor-pointer hover:text-indigo-500" onclick="event.stopPropagation(); toggleAllVocabCheck(${!isAllChecked})"></i>`,
            num: '編號', word: '單字', kk: 'KK', part: '詞性', def: '中文定義', other: '變化形',
            remove: '移除'
        };
        const colWidths = { 
            check: 'w-12', num: 'w-12', word: 'w-40', kk: 'w-28', part: 'w-14', 
            def: 'flex-1', other: 'w-48', remove: 'w-16'
        };

        state.listColumns.forEach(col => {
            if (col === 'remove' && state.filterMode !== 'custom') return;

            const cell = document.createElement('div');
            let alignClass = (col === 'check' || col === 'remove') ? 'justify-center text-center' : 'justify-start text-left pl-2';
            
            cell.className = `${colWidths[col]} font-bold text-gray-500 text-sm py-2 rounded flex items-center gap-1 ${alignClass} flex-shrink-0 cursor-move hover:bg-gray-100 transition-colors`;
            
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

        displayWords.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = "flex items-center p-2 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0 gap-2 min-w-[800px]";
            row.onclick = () => speak(item.word);

            const displayNum = seqOffset + index + 1;

            state.listColumns.forEach(col => {
                if (col === 'remove' && state.filterMode !== 'custom') return;

                let cellHTML = '';
                switch(col) {
                    case 'check':
                        cellHTML = `<div class="w-12 text-center flex-shrink-0" onclick="event.stopPropagation(); toggleVocabCheck(${item.id})">
                            <i class="far ${item.checked ? 'fa-check-square text-indigo-600' : 'fa-square text-gray-300'} text-xl"></i>
                        </div>`;
                        break;
                    case 'num': 
                        cellHTML = `<div class="w-12 text-left pl-2 text-indigo-600 font-mono text-xs font-bold flex-shrink-0">${displayNum}</div>`; 
                        break;
                    case 'word': 
                        cellHTML = `<div class="w-40 text-left pl-2 font-bold text-gray-800 text-lg flex-shrink-0 truncate">${formatDisplayWord(item.word)}</div>`; 
                        break;
                    case 'kk': 
                        cellHTML = `<div class="w-28 text-left pl-2 text-gray-500 font-mono text-sm flex-shrink-0 truncate">${item.kk}</div>`; 
                        break;
                    case 'part': 
                        cellHTML = `<div class="w-14 text-left pl-2 text-gray-500 font-bold text-xs italic flex-shrink-0">${item.part}</div>`; 
                        break;
                    case 'def': 
                        cellHTML = `<div class="flex-1 text-left pl-2 text-gray-600 truncate text-base">${item.def}</div>`; 
                        break;
                    case 'other': 
                         const hasOther = !!item.other;
                         const style = hasOther ? 'text-indigo-700 font-bold cursor-pointer hover:bg-indigo-100 px-2 -ml-2 rounded' : 'text-gray-300';
                         const action = hasOther ? `onclick="event.stopPropagation(); speak('${item.other.replace(/'/g, "\\'")}')"` : '';
                         cellHTML = `<div class="w-48 text-left pl-2 text-sm flex-shrink-0 truncate ${style}" ${action}>${item.other || ''}</div>`; 
                         break;
                    case 'remove':
                         cellHTML = `<div class="w-16 text-center flex-shrink-0"><button onclick="event.stopPropagation(); removeWordFromSet('${state.activeSetId}', ${item.id})" class="text-gray-300 hover:text-red-500 transition-colors p-2"><i class="fas fa-trash-alt"></i></button></div>`;
                         break;
                }
                row.innerHTML += cellHTML;
            });

            listContainer.appendChild(row);
        });
    } else {
        
        listContainer.className = "flex flex-col bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-6";
        
        displayWords.forEach((item, index) => {
            const card = document.createElement('div');
            const isLast = index === displayWords.length - 1;

            let cardClass = "grid grid-cols-1 md:grid-cols-2 relative group transition-colors hover:bg-indigo-50/40";
            if (!isLast) {
                cardClass += " border-b border-gray-100";
            }
            card.className = cardClass;
            
            let removeBtnHTML = '';
            if (state.filterMode === 'custom') {
                removeBtnHTML = `<button onclick="event.stopPropagation(); removeWordFromSet('${state.activeSetId}', ${item.id})" class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-full transition-colors z-20"><i class="fas fa-trash-alt text-sm"></i></button>`;
            }

            const highlightedSentence = highlightTargetWord(item.sentence, item.word, item.other);

            card.innerHTML = `
                ${removeBtnHTML}
                <div class="relative p-5 md:p-6 cursor-pointer group flex flex-col justify-center pl-5 md:pl-8" onclick="speak('${item.word}')">
                    <div class="flex items-baseline flex-wrap gap-2 mb-2 pr-4">
                        <span class="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded">U${item.unit}</span>
                        <span class="text-2xl sm:text-3xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors break-all">${formatDisplayWord(item.word)}</span>
                        <span class="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded-md">${item.kk}</span>
                        <span class="text-sm font-semibold text-indigo-500 italic">${item.part}</span>
                        ${item.other ? `<span class="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200 ml-1 cursor-pointer" onclick="event.stopPropagation(); speak('${item.other.replace(/'/g, "\\'")}')"><i class="fas fa-code-branch text-xs mr-1 opacity-50"></i>${formatDisplayWord(item.other)}</span>` : ''}
                    </div>
                    <p class="text-gray-600 text-lg font-medium">${item.def}</p>
                </div>
                
                <div class="p-5 md:p-6 md:border-l border-gray-100 cursor-pointer flex flex-col justify-center bg-gray-50/30 md:bg-transparent" onclick="speak('${item.sentence.replace(/'/g, "\\'")}')">
                    <p class="text-gray-800 text-base font-medium leading-relaxed">${highlightedSentence} <span class="inline-block ml-2 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"><i class="fas fa-volume-up"></i></span></p>
                    <p class="text-gray-500 text-sm mt-1">${item.senTrans}</p>
                </div>
            `;
            listContainer.appendChild(card);
        });
    }
    container.appendChild(listContainer);
    // Bottom Pagination
    if (totalPages > 1) {
        const paginationNav = document.createElement('div');
        paginationNav.className = "flex justify-center items-center gap-4 py-6";
        paginationNav.innerHTML = `
            <button onclick="changePage(-1)" class="w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
            <span class="font-bold text-gray-600 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">${currentPage} / ${totalPages}</span>
            <button onclick="changePage(1)" class="w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
        `;
        container.appendChild(paginationNav);
    }

    // Floating Action Button (FAB)
    if (state.listMode === 'compact') {
        const fabBtn = document.createElement('button');
        fabBtn.className = "fixed bottom-20 right-6 z-40 w-12 h-12 bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-500 rounded-full shadow-lg flex items-center justify-center hover:text-indigo-600 hover:border-indigo-300 hover:scale-110 transition-all active:scale-95";
        fabBtn.title = "加入學習集";
        fabBtn.onclick = openAddToSetModal;
        fabBtn.innerHTML = '<i class="fas fa-folder-plus text-lg"></i>';
        container.appendChild(fabBtn);
    }

    appRoot.appendChild(container);
}

// --- DRAG AND DROP HELPER ---
function handleDrop(e, targetCol) {
    e.preventDefault();
    const draggedCol = e.dataTransfer.getData('text/plain');
    // 如果拖曳的欄位跟目標欄位一樣，不做任何事
    if (draggedCol === targetCol) return;

    const newCols = [...state.listColumns];
    const fromIdx = newCols.indexOf(draggedCol);
    const toIdx = newCols.indexOf(targetCol);

    // 移動陣列元素
    newCols.splice(fromIdx, 1);
    newCols.splice(toIdx, 0, draggedCol);
    
    // 更新狀態並重新渲染
    state.listColumns = newCols;
    render(); 
}

// --- LOGIC: MODALS & ACTIONS ---
function showInputModal(title, defaultValue, placeholder, onConfirm) {
    // 建立 Overlay
    const overlay = document.createElement('div');
    overlay.className = "fixed inset-0 z-[150] flex items-center justify-center input-modal-overlay p-4";
    
    const modal = document.createElement('div');
    modal.className = "bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden";
    
    modal.innerHTML = `
        <div class="p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">${title}</h3>
            <input type="text" id="custom-input-field" 
                class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold focus:outline-none input-field-focus transition-all placeholder-gray-300" 
                value="${defaultValue || ''}" 
                placeholder="${placeholder || ''}" 
                autocomplete="off">
            
            <div class="flex justify-end gap-3 mt-6">
                <button id="btn-cancel" class="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">取消</button>
                <button id="btn-confirm" class="px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all active:scale-95">確定</button>
            </div>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const input = modal.querySelector('#custom-input-field');
    const btnConfirm = modal.querySelector('#btn-confirm');
    const btnCancel = modal.querySelector('#btn-cancel');

    // 自動聚焦並選取文字
    setTimeout(() => {
        input.focus();
        if (defaultValue) input.select();
    }, 100);

    const close = () => {
        overlay.classList.add('opacity-0'); // Simple fade out effect could be added here
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 200);
    };

    const confirm = () => {
        const val = input.value.trim();
        if (val) {
            onConfirm(val);
            close();
        } else {
            // 簡單的震動效果提示不可為空
            input.classList.add('border-red-500', 'animate-pulse');
            setTimeout(() => input.classList.remove('border-red-500', 'animate-pulse'), 500);
        }
    };

    btnConfirm.onclick = confirm;
    btnCancel.onclick = close;

    // 綁定 Enter 鍵
    input.onkeydown = (e) => {
        if (e.key === 'Enter') confirm();
        if (e.key === 'Escape') close();
    };
    
    // 點擊背景關閉
    overlay.onclick = (e) => {
        if (e.target === overlay) close();
    };
}

function showConfirmModal(title, message, onConfirm, confirmText = "確定", confirmColor = "bg-indigo-600") {
    const overlay = document.createElement('div');
    overlay.className = "fixed inset-0 z-[150] flex items-center justify-center input-modal-overlay p-4 animate-fade-in";
    
    const modal = document.createElement('div');
    
    // --- 修改重點：加入 select-none ---
    // 這樣視窗內的所有標題、訊息文字都無法被滑鼠反白選取
    modal.className = "bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all select-none";
    // --------------------------------
    
    modal.innerHTML = `
        <div class="p-6 text-center">
            <div class="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-exclamation-triangle text-xl"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">${title}</h3>
            <p class="text-gray-500 text-sm mb-6 leading-relaxed">${message}</p>
            
            <div class="flex gap-3">
                <button id="btn-cancel" class="flex-1 px-4 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">取消</button>
                <button id="btn-confirm" class="flex-1 px-4 py-2.5 rounded-xl font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-95 ${confirmColor} hover:opacity-90">${confirmText}</button>
            </div>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => {
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
    };

    modal.querySelector('#btn-confirm').onclick = () => {
        onConfirm();
        close();
    };
    
    modal.querySelector('#btn-cancel').onclick = close;
}

function openCreateSetModal() {
    showInputModal(
        "建立新學習集", 
        "", 
        "請輸入名稱...", 
        (name) => {
            createCustomSet(name.trim());
            render();
            showToast("建立成功！");
        }
    );
}

function openRenameSetModal(id, oldName) {
    // 阻止冒泡 (原本的邏輯)
    const event = window.event;
    if(event) event.stopPropagation();

    showInputModal(
        "重新命名學習集",
        oldName,
        "請輸入新的名稱...",
        (name) => {
            updateCustomSet(id, name.trim());
            showToast("名稱已更新");
        }
    );
}

// 修改後的 openAddToSetModal
function openAddToSetModal(specificIds = null) {
    let idsToAdd = [];

    // 判斷是否傳入了指定的 ID 陣列 (來自錯題收藏)
    if (Array.isArray(specificIds)) {
        idsToAdd = specificIds;
    } else {
        // 原本的邏輯：從列表介面抓取已勾選(Checked)的單字
        let candidates = [];
        if (state.filterMode === 'custom' && state.activeSetId) {
             const set = state.customSets.find(s => s.id === state.activeSetId);
             candidates = state.vocabulary.filter(w => set.wordIds.includes(w.id) && w.checked);
        } else {
             candidates = state.vocabulary.filter(w => state.selectedUnits.includes(w.unit) && w.checked);
        }

        if (candidates.length === 0) {
            showToast("請先勾選至少一個單字！"); 
            return;
        }
        idsToAdd = candidates.map(w => w.id);
    }

    // --- 以下為原本的 Modal 渲染邏輯 (保持不變) ---

    // 2. Create Modal HTML
    const overlay = document.createElement('div');
    overlay.className = "fixed inset-0 z-[100] flex items-center justify-center modal-overlay p-4 animate-fade-in";
    
    const modal = document.createElement('div');
    modal.className = "bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden modal-content ";
    
    // 列表生成
    let setsListHTML = state.customSets.length > 0 ? state.customSets.map(set => `
        <button onclick="handleAddAction('${set.id}')" class="w-full text-left p-4 hover:bg-indigo-50 border-b border-gray-100 flex justify-between items-center group transition-colors">
            <span class="font-bold text-gray-700 group-hover:text-indigo-700">${set.name}</span>
            <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded group-hover:bg-white">${set.wordIds.length} words</span>
        </button>
    `).join('') : `<div class="p-8 text-center text-gray-400 text-sm">尚無其他學習集</div>`;

    modal.innerHTML = `
        <div class="bg-indigo-600 p-4 text-white flex justify-between items-center">
            <h3 class="font-bold text-lg"><i class="fas fa-folder-plus mr-2"></i>加入學習集</h3>
            <button onclick="closeModal()" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-indigo-500 transition-colors"><i class="fas fa-times"></i></button>
        </div>
        <div class="p-4 bg-gray-50 border-b border-gray-200">
            <p class="text-gray-600 text-sm">已選擇 <span class="font-bold text-indigo-600 text-lg">${idsToAdd.length}</span> 個單字</p>
        </div>
        <div class="max-h-[300px] overflow-y-auto">
            <button onclick="handleAddAction('NEW')" class="w-full text-left p-4 hover:bg-green-50 border-b border-gray-100 text-green-600 font-bold flex items-center gap-3 transition-colors">
                <div class="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><i class="fas fa-plus"></i></div>
                建立新的學習集
            </button>
            ${setsListHTML}
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Temporary global handler
    window.closeModal = () => {
        if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
        }
        delete window.closeModal;
        delete window.handleAddAction;
    };

    window.handleAddAction = (targetId) => {
        if (targetId === 'NEW') {
            const defaultName = "我的單字集 " + (new Date().toLocaleDateString());
            showInputModal(
                "建立新學習集", 
                defaultName, 
                "請輸入名稱...", 
                (name) => {
                    const newSet = createCustomSet(name.trim(), idsToAdd);
                    showToast(`已建立並加入「${newSet.name}」`);
                    window.closeModal(); 
                    render(); 
                }
            );
        } else {
            addWordsToSet(targetId, idsToAdd);
            window.closeModal();
        }
    };
}

function saveWrongQuestionsToSet() {
    if (!state.quiz.wrongQuestions || state.quiz.wrongQuestions.length === 0) {
        showToast("沒有錯題可收藏");
        return;
    }
    const ids = state.quiz.wrongQuestions.map(w => w.id);
    openAddToSetModal(ids);
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = "fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg z-[200] text-sm font-bold flex items-center gap-2 toast-enter";
    toast.innerHTML = `<i class="fas fa-check-circle text-green-400"></i> ${message}`;
    document.body.appendChild(toast);

    // Animation trigger
    requestAnimationFrame(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-enter-active');
    });

    setTimeout(() => {
        toast.classList.remove('toast-enter-active');
        toast.classList.add('toast-exit-active');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
}

// --- Nav Toggle Logic ---
function initNavToggle() {
    const nav = document.getElementById('bottom-nav');
    const btn = document.getElementById('nav-toggle-btn');
    const icon = document.getElementById('nav-toggle-icon');
    
    if (!nav || !btn || !icon) return;

    let isCollapsed = false;

    btn.addEventListener('click', () => {
        isCollapsed = !isCollapsed;
        
        document.body.classList.toggle('nav-collapsed', isCollapsed);

        if (isCollapsed) {
            nav.classList.add('translate-y-full');
            nav.classList.remove('translate-y-0');
            icon.classList.add('rotate-180');
        } else {
            nav.classList.remove('translate-y-full');
            nav.classList.add('translate-y-0');
            icon.classList.remove('rotate-180');
        }
    });
}

// --- HELPER LOGIC ---
function setHomeTab(tab) {
    state.homeTab = tab;
    if (tab === 'default') {
        state.filterMode = 'default';
        state.activeSetId = null;
        state.listColumns = state.listColumns.filter(c => c !== 'remove');
    }
    render();
}

function selectCustomSet(setId) {
    state.activeSetId = setId;
    state.filterMode = 'custom';
    state.view = 'list';
    state.pagination.currentPage = 1;
    
    if (!state.listColumns.includes('remove')) {
        state.listColumns.push('remove');
    }
    
    render();
    window.scrollTo(0,0);
}

function startLearning(mode) {
    if (mode === 'default') {
        if (state.selectedUnits.length === 0) {
            alert("請至少選擇一個單元！");
            return;
        }
        state.filterMode = 'default';
        state.activeSetId = null;
        state.listColumns = state.listColumns.filter(c => c !== 'remove');
    } else {
        if (state.customSets.length === 0) {
            alert("請先建立學習集！");
            return;
        }
        state.filterMode = 'custom';
        // 如果是 Custom 模式，理論上也要加入 remove，但通常會先經過 selectCustomSet
        // 為了保險起見，這裡也可以加：
        if (!state.listColumns.includes('remove')) {
            state.listColumns.push('remove');
        }
    }
    setState('view', 'list');
}

// --- Matching Mode Logic ---

function setMatchingDifficulty(num) {
    state.quiz.matchingDifficulty = num;
    initMatchingData();
    render();
}

function initMatchingData() {
    const { questions, currentIndex, matchingDifficulty } = state.quiz;
    
    // 從 questions 中取出 N 個題目
    const sliceEnd = Math.min(currentIndex + matchingDifficulty, questions.length);
    const targetQuestions = questions.slice(currentIndex, sliceEnd);
    
    let enList = [];
    let cnList = [];
    
    targetQuestions.forEach((q, idx) => {
        // 英文卡 (word) -> 放入左側列表
        enList.push({
            id: `w-${q.target.id}`,
            pairId: q.target.id,
            type: 'word',
            text: q.target.word,
            matched: false
        });
        
        // 中文卡 (def) -> 放入右側列表
        cnList.push({
            id: `d-${q.target.id}`,
            pairId: q.target.id,
            type: 'def',
            text: q.target.def,
            matched: false
        });
    });
    
    // 左右分開洗牌
    enList = shuffle(enList);
    cnList = shuffle(cnList);
    
    // 合併到 items 供後續邏輯使用 (render 時會再分開讀取)
    state.quiz.matching = {
        items: [...enList, ...cnList],
        selectedId: null,
        matchedPairs: 0,
        totalPairs: targetQuestions.length
    };
}

function handleMatchClick(itemId) {
    const { matching } = state.quiz;
    const item = matching.items.find(i => i.id === itemId);
    
    if (!item || item.matched || matching.selectedId === itemId) {
        if (matching.selectedId === itemId) {
            state.quiz.matching.selectedId = null;
            render();
        }
        return;
    }

    // 發音：如果點到的是英文卡，播放聲音 (若開啟自動播放)
    if (item.type === 'word' && state.quiz.autoPlayAudio) {
        speak(item.text);
    }

    if (!matching.selectedId) {
        // --- 情況 1：還沒選第一張 ---
        state.quiz.matching.selectedId = itemId;
        render();
    } else {
        // --- 情況 2：已經選了一張，這是第二張 ---
        const firstId = matching.selectedId;
        const firstItem = matching.items.find(i => i.id === firstId);
        
        // 判斷是否配對成功 (檢查 pairId 是否相同)
        if (firstItem.pairId === item.pairId) {
            // 1. 標記為 matched
            firstItem.matched = true;
            item.matched = true;
            
            // 2. 清除選取
            state.quiz.matching.selectedId = null;
            state.quiz.matching.matchedPairs++;
            state.quiz.score++; // 這裡可以斟酌是否加分
            
            // 3. 播放成功音效 (可選，這裡用簡單的視覺)
            render();
            
            // 4. 檢查是否全部完成
            if (state.quiz.matching.matchedPairs >= state.quiz.matching.totalPairs) {
                // 完成本組
                setTimeout(() => {
                    nextMatchingBatch();
                }, 800); // 稍微停頓讓使用者看到最後一組消失
            }
            
        } else {
            // 1. 先渲染選中狀態 (讓使用者看到選了哪兩張)
            // 並加上 error class
            const card1 = document.getElementById(`match-card-${firstId}`);
            const card2 = document.getElementById(`match-card-${itemId}`);
            
            if (card1) card1.classList.add('error');
            if (card2) card2.classList.add('error');
            
            // 2. 延遲後取消選取
            state.quiz.matching.selectedId = null; // 立即清空邏輯選取，防止快速點第三張
            
            setTimeout(() => {
                render(); // 重繪以移除 error 樣式
            }, 500);
        }
    }
}

function nextMatchingBatch() {
    // 增加 index
    const step = state.quiz.matching.totalPairs;
    state.quiz.currentIndex += step;
    
    if (state.quiz.currentIndex >= state.quiz.questions.length) {
        endQuiz();
    } else {
        initMatchingData(); // 載入下一批
        render();
    }
}

// --- QUIZ LOGIC ---
function initQuiz(mode) {
    // 1. 重置基本測驗狀態
    

    // 偵測模式是否改變 (例如從 sentence 切換到 cn-en)
    // 如果改變了，強制將子模式重置為 'choice'，避免帶入不相容的模式 (如把 order 帶入 cn-en)
    if (state.quiz.mode !== mode) {
        state.quiz.subMode = 'choice';
    }
    // 確保 subMode 有值
    state.quiz.subMode = state.quiz.subMode || 'choice';
    
    state.quiz.mode = mode;


    // 初始化順序模式 (預設隨機)
    if (!state.quiz.orderMode) state.quiz.orderMode = 'random';

    state.quiz.spellingDifficulty = 5;
    state.quiz.sentenceDifficulty = 5;
    state.quiz.matchingDifficulty = 4;
    if (state.quiz.autoPlayAudio === undefined) {
        state.quiz.autoPlayAudio = true;
    }
    state.quiz.currentIndex = 0;
    state.quiz.score = 0;

	state.quiz.lastActionTime = 0;
    state.quiz.spamCounter = 0;
    state.quiz.questionLoadedTime = Date.now();
	state.quiz.consecutiveErrorCount = 0;

    state.quiz.isFinished = false;
    state.quiz.wrongQuestions = [];
    state.quiz.status = 'answering';
    state.quiz.selectedOption = null;

    // 2. 決定資料來源 (篩選單字)
    let activeWords = [];
    if (state.filterMode === 'custom' && state.activeSetId) {
        const set = state.customSets.find(s => s.id === state.activeSetId);
        if (set) {
            activeWords = state.vocabulary.filter(w => set.wordIds.includes(w.id) && w.checked);
        }
    } else {
        activeWords = state.vocabulary.filter(w => state.selectedUnits.includes(w.unit) && w.checked);
    }
    
    if (activeWords.length === 0) {
        state.quiz.questions = []; 
        return;
    }

    // --- 內部輔助函式：根據模式決定列表順序 ---
    const getSrcList = (list) => {
        if (state.quiz.orderMode === 'random') {
            return shuffle([...list]);
        } else {
            // 依序 (依 ID 排序)
            return [...list].sort((a, b) => a.id - b.id);
        }
    };

    // 3. 產生題目
    let currentEmoji = getRandomEmoji();

    if (mode === 'sentence') {
        // --- 句子填空模式 ---
        const validWords = activeWords.filter(w => w.sentence && w.sentence.length > 5);
        
        // 使用 getSrcList 替代原本的 shuffle
        state.quiz.questions = getSrcList(validWords).map((w, index) => {
            if (index > 0 && index % 5 === 0) currentEmoji = getRandomEmoji();

            let usedWord = w.word; 
            const variations = w.other ? w.other.split('/').map(s => s.trim()).filter(s => s) : [];
            const candidates = [w.word, ...variations].sort((a, b) => b.length - a.length);
            let matched = false;
            let regex = null;

            for (const cand of candidates) {
                const re = new RegExp(`\\b${cand}\\b`, 'i');
                if (re.test(w.sentence)) {
                    usedWord = w.sentence.match(re)[0];
                    regex = re;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                const looseRe = new RegExp(`\\b${w.word}\\w*\\b`, 'i');
                if (looseRe.test(w.sentence)) {
                    usedWord = w.sentence.match(looseRe)[0];
                    regex = looseRe;
                } else {
                    regex = new RegExp(w.word, 'i');
                }
            }

            const blankPlaceholder = '_______';
            const questionText = w.sentence.replace(regex, blankPlaceholder);
            
            // 選項仍需隨機
            const others = shuffle(state.vocabulary.filter(cw => cw.id !== w.id)).slice(0, 3);
            const rawOptions = shuffle([w, ...others]);
            
            const processedOptions = rawOptions.map(opt => {
                let displayText = opt.word; 
                if (opt.id === w.id) {
                    displayText = usedWord;
                } else if (opt.other) {
                     const optVars = opt.other.split('/').map(s => s.trim()).filter(s => s);
                     if(optVars.length > 0) displayText = optVars[0]; 
                }
                return { ...opt, displayText };
            });

            return { 
                target: w, 
                text: questionText, 
                answerWord: usedWord, 
                options: processedOptions, 
                emoji: currentEmoji 
            };
        });

    } else {
        // --- 一般選擇題 ---
        // 使用 getSrcList 替代原本的 shuffle
        state.quiz.questions = getSrcList(activeWords).map((w, index) => {
            if (index > 0 && index % 5 === 0) currentEmoji = getRandomEmoji();

            const others = shuffle(state.vocabulary.filter(cw => cw.id !== w.id)).slice(0, 3);
            const options = shuffle([w, ...others]);
            
            return { 
                target: w, 
                options, 
                emoji: currentEmoji 
            };
        });
    }

    // 4. 特殊模式初始化
    if (state.quiz.questions.length > 0) {
        const currentQ = state.quiz.questions[0];
        if (mode === 'cn-en' && state.quiz.subMode === 'spell') {
            initSpellingData(currentQ.target.word);
        }
        // 注意：這裡要加上 isFirstLastMode 的判斷 (如果您之前有加過)
        if (mode === 'sentence' && state.quiz.subMode === 'order') {
            initOrderingData(currentQ.target.sentence);
        }
        if (mode === 'en-cn' && state.quiz.subMode === 'match') {
            initMatchingData();
        }
    }
}

function toggleQuizOrder() {
    // 切換模式
    state.quiz.orderMode = state.quiz.orderMode === 'random' ? 'sequential' : 'random';
    
    // 重新初始化測驗 (因為順序改變了，必須重新生成題目列表)
    initQuiz(state.quiz.mode);
    render();

    // 提示使用者
    const msg = state.quiz.orderMode === 'random' ? "隨機模式 (重新開始)" : "依序模式 (重新開始)";
    showToast(msg);
}

function jumpToQuestion() {
    // 防呆：只有依序模式才允許跳題 (隨機模式跳題意義不大，但若您想開放也可以拿掉這行)
    if (state.quiz.orderMode !== 'sequential') {
        showToast("請先切換為「依序模式」才能指定跳題");
        return;
    }

    const total = state.quiz.questions.length;
    const current = state.quiz.currentIndex + 1;

    showInputModal(
        "跳至指定題目", 
        "", // 預設值留空
        `請輸入題號 (1 - ${total})`, 
        (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 1 || num > total) {
                showToast("無效的題號！");
                return;
            }

            // 更新索引 (使用者輸入 1-based，程式用 0-based)
            state.quiz.currentIndex = num - 1;
            
            // 重置該題狀態
            state.quiz.status = 'answering';
            state.quiz.selectedOption = null;
            state.quiz.isFinished = false;

            // 重要：針對特殊模式 (拼字/排序/配對)，必須重新初始化該題資料
            const currentQ = state.quiz.questions[state.quiz.currentIndex];
            
            if (state.quiz.mode === 'cn-en' && state.quiz.subMode === 'spell') {
                initSpellingData(currentQ.target.word);
            } else if (state.quiz.mode === 'sentence' && state.quiz.subMode === 'order') {
                initOrderingData(currentQ.target.sentence);
            } else if (state.quiz.mode === 'en-cn' && state.quiz.subMode === 'match') {
                initMatchingData();
            }

            render();
            showToast(`已跳至第 ${num} 題`);
        }
    );
}

// --- UTILITIES (Existing + Updated) ---

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function speak(text, rate = 1) {
    if (!text) return;
    if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        
        // 如果正在播放
        if (synth.speaking) {
            synth.cancel();
            // 如果點擊的是同一個按鈕(相同的文字與速度)，則視為「停止」操作，更新狀態並重繪
            if (state.audio.lastText === text && state.audio.lastRate === rate) {
                state.audio.lastText = null;
                state.audio.lastRate = null;
                state.audio.isPlaying = false; 
                render(); // 這裡原本就有，保持不動
                return;
            }
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = /[\u4e00-\u9fa5]/.test(text) ? 'zh-TW' : 'en-US';
        utterance.rate = rate;
        window.currentUtterance = utterance;

        utterance.onstart = () => {
            state.audio.lastText = text;
            state.audio.lastRate = rate;
            state.audio.isPlaying = true;
            render();
        };

        utterance.onend = () => {
            if (state.audio.lastText === text) { 
                state.audio.isPlaying = false;
                render();
            }
        };

        utterance.onerror = () => {
            state.audio.isPlaying = false;
            render();
        };

        setTimeout(() => { synth.speak(utterance); }, 50);
    }
}

function highlightTargetWord(sentence, targetWord, otherWords) {
    if (!sentence || !targetWord) return sentence;
    let candidates = [targetWord];
    if (otherWords) {
        const variations = otherWords.split('/').map(w => w.trim()).filter(w => w);
        candidates = candidates.concat(variations);
    }
    candidates.sort((a, b) => b.length - a.length);
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const safeCandidates = candidates.map(escapeRegExp);
    const strictPattern = `\\b(${safeCandidates.join('|')})\\b`;
    const strictRegex = new RegExp(strictPattern, 'gi');
    if (strictRegex.test(sentence)) {
        return sentence.replace(strictRegex, (match) => `<span class="text-indigo-600 font-bold border-b-2 border-indigo-200">${match}</span>`);
    }
    const safeRoot = escapeRegExp(targetWord);
    const looseRegex = new RegExp(`\\b${safeRoot}\\w*`, 'gi');
    return sentence.replace(looseRegex, (match) => `<span class="text-indigo-600 font-bold border-b-2 border-indigo-200">${match}</span>`);
}

function formatDisplayWord(text) {
    if (!state.highlightVowels || !text) return text;
    return text.replace(/([aeiou])/gi, '<span class="text-red-500 font-bold">$1</span>');
}

function toggleVowelMode() {
    state.highlightVowels = !state.highlightVowels;
    render();
}

function toggleQuizAudio() {
    state.quiz.autoPlayAudio = !state.quiz.autoPlayAudio;
    render();
}

function renderNav() {
    const navItems = [
        { id: 'list', label: '單字表', icon: 'fa-book-open' },
        { id: 'quiz-cn', label: '中選英', icon: 'fa-check-circle' },
        { id: 'quiz-en', label: '英選中', icon: 'fa-question-circle' },
        { id: 'quiz-sen', label: '填空題', icon: 'fa-list-alt' },
        { id: 'story', label: '故事集', icon: 'fa-graduation-cap' }
    ];

    let isEnabled = false;
    
    if (state.view === 'home') {
        if (state.homeTab === 'default') {
            isEnabled = state.selectedUnits.length > 0;
        } else {
            isEnabled = !!state.activeSetId;
        }
    } else {
        isEnabled = true;
    }

    // --- 樣式設定 ---
    const disabledClass = isEnabled ? '' : 'opacity-30 grayscale pointer-events-none cursor-not-allowed';
    const hoverClass = isEnabled ? 'hover:text-indigo-600 active:bg-gray-50' : '';

    // 首頁按鈕 (永遠啟用)
    let html = `
        <button onclick="setState('view', 'home')" class="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-indigo-600 transition-colors active:bg-gray-50">
             <i class="fas fa-home mb-1 text-xl"></i>
             <span class="text-[10px] font-bold">首頁</span>
        </button>
    `;

    // 產生其他功能按鈕
    navItems.forEach(item => {
        html += `
            <button onclick="handleNavClick('${item.id}')" class="nav-btn flex flex-col items-center justify-center w-full h-full text-gray-400 transition-colors ${hoverClass} ${disabledClass}" data-id="${item.id}" ${!isEnabled ? 'disabled' : ''}>
                <i class="fas ${item.icon} mb-1 text-xl transition-transform"></i>
                <span class="text-[10px] font-bold">${item.label}</span>
            </button>
        `;
    });
    navContainer.innerHTML = html;
}

function handleNavClick(viewId) {
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
        
        // 判斷是否為當前頁面
        const isActiveView = btn.dataset.id === state.view;
        
        // 我們利用 btn.disabled 屬性來判斷 (renderNav 時若沒選單元會設為 disabled)
        const isHomeReady = state.view === 'home' && !btn.disabled;

        // 如果是「當前頁面」或是「首頁準備就緒狀態」，都顯示藍色
        if (isActiveView || isHomeReady) {
            btn.classList.remove('text-gray-400');
            btn.classList.add('text-indigo-600');
            
            // 只有「當前頁面」才會有圖示放大效果，避免混淆
            if(isActiveView && icon) icon.classList.add('scale-110', '-translate-y-1');
            
            if(text) {
                text.classList.remove('opacity-80');
                text.classList.add('opacity-100');
            }
        } else {
            // 停用或非當前頁面
            btn.classList.add('text-gray-400');
            btn.classList.remove('text-indigo-600');
            if(icon) icon.classList.remove('scale-110', '-translate-y-1');
            if(text) {
                text.classList.add('opacity-80');
                text.classList.remove('opacity-100');
            }
        }
    });
}

function toggleUnit(unit) {
    if (state.selectedUnits.includes(unit)) {
        state.selectedUnits = state.selectedUnits.filter(u => u !== unit);
    } else {
        state.selectedUnits.push(unit);
    }
    render();
}

function toggleAllUnits() {
    if (state.selectedUnits.length === state.allUnits.length) {
        state.selectedUnits = [];
    } else {
        state.selectedUnits = [...state.allUnits];
    }
    render();
}


// --- QUIZ VIEW RENDER ---
function renderQuiz() {
    const { questions, currentIndex, score, isFinished, wrongQuestions, status, mode, selectedOption, subMode, spellingDifficulty, sentenceDifficulty } = state.quiz;
    const container = document.createElement('div');
    container.className = "max-w-4xl mx-auto pb-24 px-4 pt-6 w-full";

    // 1. 檢查是否有題目
    if (questions.length === 0) {
        const msg = state.filterMode === 'custom' ? '自訂學習集中沒有選取(勾選)的單字。' : '請先在單字表中勾選要測驗的單字。';
        container.innerHTML = `<div class="text-center p-10 text-gray-500">${msg}</div>`;
        appRoot.appendChild(container);
        return;
    }

	// 2. 測驗結束畫面
    if (isFinished) {
        const total = questions.length;
        const pct = score / total;
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[60vh] w-full">
                <div class="text-center p-8 bg-white rounded-3xl shadow-lg w-full max-w-lg border-2 border-indigo-50">
                    <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">${pct > 0.65 ? "🎉" : "💪"}</div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">測驗結束！</h2>
                    <p class="text-xl text-gray-600 mb-8">得分: <span class="text-indigo-600 font-bold text-4xl">${score}</span> / ${total}</p>
                    
                    ${wrongQuestions.length > 0 ? `
                        <button onclick="retryWrongQuestions()" class="w-full py-4 bg-orange-500 text-white rounded-xl font-bold shadow-lg hover:bg-orange-600 mb-3 flex items-center justify-center gap-2">
                            <i class="fas fa-redo"></i> 練習答錯的 ${wrongQuestions.length} 題
                        </button>
                        
                        <button onclick="saveWrongQuestionsToSet()" class="w-full py-4 bg-green-500 text-white rounded-xl font-bold shadow-lg hover:bg-green-600 mb-4 flex items-center justify-center gap-2">
                            <i class="fas fa-folder-plus"></i> 將錯題加入學習集
                        </button>
                    ` : ''}

                    <button onclick="setState('view', 'list')" class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700">返回列表</button>
                </div>
            </div>
        `;
        appRoot.appendChild(container);
        return;
    }
	
	const currentQ = questions[currentIndex];
    
    // 3. 頂部工具列
    
	// 準備按鈕圖示與標題 (保持原本邏輯)
    const orderIcon = state.quiz.orderMode === 'random' ? 'fa-random' : 'fa-sort-numeric-down';
    const orderTitle = state.quiz.orderMode === 'random' ? '目前為隨機，點擊切換為依序' : '目前為依序，點擊切換為隨機';
    const orderColor = state.quiz.orderMode === 'random' ? 'text-indigo-500' : 'text-blue-600';

    // 進度條的可點擊設定 (保持原本邏輯)
    const isSequential = state.quiz.orderMode === 'sequential';
    const progressClass = isSequential 
        ? "cursor-pointer hover:text-indigo-600 hover:bg-white/50 px-2 py-1 rounded transition-colors border-b border-dashed border-gray-400 hover:border-indigo-600 select-none" 
        : "select-none";
    const progressAction = isSequential ? `onclick="jumpToQuestion()"` : "";
    const progressTitle = isSequential ? "點擊可跳題" : "隨機模式無法跳題";

    let headerHTML = `
        <div class="flex flex-col items-center mb-6">
            <div class="w-full flex justify-between items-center text-sm font-medium text-gray-500 bg-gray-100 px-3 py-2 rounded-full shadow-inner">
                
                <div class="flex items-center gap-2">
                    <button onclick="toggleQuizOrder()" class="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 hover:bg-indigo-50 transition-colors active:scale-95 flex-shrink-0" title="${orderTitle}">
                        <i class="fas ${orderIcon} ${orderColor}"></i>
                    </button>
                    
                    <span class="${progressClass} text-xs sm:text-sm" ${progressAction} title="${progressTitle}">
                        ${currentIndex + 1} / ${questions.length}
                    </span>
                </div>

                <div class="flex items-center gap-2">
                    <button onclick="toggleQuizAudio()" class="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 hover:bg-indigo-50 transition-colors active:scale-95" title="${state.quiz.autoPlayAudio ? '關閉自動發音' : '開啟自動發音'}">
                        <i class="fas ${state.quiz.autoPlayAudio ? 'fa-volume-up text-indigo-500' : 'fa-volume-mute text-gray-400'}"></i>
                    </button>
                    
                    <button onclick="toggleVowelMode()" class="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 hover:bg-indigo-50 transition-colors active:scale-95" title="切換母音紅字">
                        <i class="fas fa-font ${state.highlightVowels ? 'text-red-400' : 'text-gray-400'}"></i>
                    </button>
                    
                    <button onclick="endQuiz()" class="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200 hover:bg-red-50 active:scale-95 transition-all text-xs">
                        <i class="fas fa-sign-out-alt"></i> <span class="hidden sm:inline">結束</span>
                    </button>
                </div>
            </div>
        </div>`;

    // 4. 題目與結果回饋準備
    let questionDisplayHTML = '';
    let feedbackHTML = '';
    
    let fontClass = "";
    let breakClass = "";
    
    // 判斷是否為「填空題模式」(sentence)
    const isSpeechMode = (mode === 'sentence');

    if (mode === 'cn-en') {
        questionDisplayHTML = currentQ.target.def;
        fontClass = "text-3xl md:text-4xl leading-tight text-center";
        breakClass = "break-all";
    } else if (mode === 'en-cn') {
        if (subMode === 'match') {
             questionDisplayHTML = '';
             fontClass = "hidden"; // 直接隱藏容器
        } else {
             questionDisplayHTML = formatDisplayWord(currentQ.target.word);
             fontClass = "text-3xl md:text-4xl leading-tight text-center";
        }
        breakClass = "break-all";
    } else {
        // --- 句子填空模式 (Speech Mode) ---
        let rawContent = "";
        
        if (subMode === 'order') {
            const shouldBlur = state.quiz.isFirstLastMode && state.quiz.status !== 'result';
            const blurClass = shouldBlur ? 'text-blur transition-all duration-200' : '';
            
            rawContent = `<span class="${blurClass}">${currentQ.target.senTrans}</span>`;
            
            fontClass = "text-xl md:text-2xl leading-relaxed"; 
            breakClass = "break-words";
        } else {
            rawContent = currentQ.text;
            fontClass = "text-xl md:text-2xl leading-relaxed";
            breakClass = "break-words";
            
            if (status === 'result') {
                const highlightedWord = `<span class="inline-block px-2 rounded-md bg-indigo-100 text-indigo-700 border-b-2 border-indigo-400 font-bold mx-1">${currentQ.answerWord}</span>`;
                rawContent = currentQ.text.replace('_______', highlightedWord);

                const isCorrect = selectedOption && selectedOption.id === currentQ.target.id;
                const resultClass = isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
                const iconClass = isCorrect ? 'fa-check-circle text-green-600' : 'fa-times-circle text-red-500';
                
                feedbackHTML = `
                    <div class="mt-4 p-4 rounded-xl text-center border ${resultClass} noselect">
                         <div class="flex items-center justify-center gap-2 mb-2">
                            <i class="fas ${iconClass} text-xl"></i>
                            <span class="text-xl font-bold text-indigo-600">${currentQ.answerWord}</span>
                            <button onclick="speak('${currentQ.target.word}')" class="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors"><i class="fas fa-volume-up text-gray-600 text-sm"></i></button>
                         </div>
                         <p class="text-gray-700 font-medium">${currentQ.target.senTrans}</p>
                    </div>
                `;
            }
        }

		const sentenceToSpeak = currentQ.target.sentence.replace(/'/g, "\\'");

		// 簡潔置中版 HTML
        questionDisplayHTML = `
			<div class="flex items-center justify-center gap-4 w-full mt-12 mb-2">
                <div class="flex-shrink-0 text-3xl select-none transform scale-x-[-1] cursor-pointer hover:scale-110 transition-transform opacity-90" onclick="speak('${sentenceToSpeak}')">
                    ${currentQ.emoji}
                </div>
                <div class="font-bold text-gray-800 text-left cursor-pointer hover:text-indigo-600 transition-colors" onclick="speak('${sentenceToSpeak}')">
                     ${rawContent}
                </div>
            </div>
        `;
    }

	// 選中狀態：白底、藍字、陰影、輕微放大 (不突兀的凸顯)
    const activeClass = "bg-white text-indigo-600 shadow-sm transform scale-105"; 
    // 未選中狀態：灰字、滑鼠懸停變深
    const inactiveClass = "text-gray-400 hover:text-gray-600 hover:bg-gray-200";

    // 輔助函式 1：通用按鈕樣式 (給難度數字用)
    const getBtnStyle = (condition) => condition ? activeClass : inactiveClass;
    
    // 輔助函式 2：模式切換按鈕專用 (保留 mode-btn-small 的排版設定，並疊加顏色樣式)
    const getModeBtnClass = (condition) => `mode-btn-small ${condition ? activeClass : inactiveClass}`;


    // --- 1. 難度/設定按鈕區域 (左上角) ---
    let difficultySelectorHTML = '';
    
    // (A) 拼字模式 (中選英 - spell)
    if (mode === 'cn-en' && subMode === 'spell') {
        difficultySelectorHTML = `
             <div class="absolute top-4 left-4 z-20 flex items-center gap-1 bg-gray-100 rounded-lg p-1 shadow-inner">
                <span class="text-[10px] font-bold text-gray-400 px-1 select-none">數量</span>
                <button onclick="setSpellingDifficulty('a')" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${getBtnStyle(spellingDifficulty === 'a')}">a</button>
                <button onclick="setSpellingDifficulty(3)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${getBtnStyle(spellingDifficulty === 3)}">3</button>
                <button onclick="setSpellingDifficulty(4)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${getBtnStyle(spellingDifficulty === 4)}">4</button>
                <button onclick="setSpellingDifficulty(5)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${getBtnStyle(spellingDifficulty === 5)}">5</button>
             </div>
        `;
    
    // (B) 排序模式 (填空題 - order)
    } else if (mode === 'sentence' && subMode === 'order') {
        const isFL = state.quiz.isFirstLastMode;
        difficultySelectorHTML = `
             <div class="absolute top-4 left-4 z-20 flex items-center gap-1 bg-gray-100 rounded-lg p-1 shadow-inner">
                <span class="text-[10px] font-bold text-gray-400 px-1 select-none">設定</span>
                
                <button onclick="toggleFirstLastMode()" class="w-8 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${getBtnStyle(isFL)}" title="首尾模式">
                    &lt;&gt;
                </button>
                
                <div class="w-px h-3 bg-gray-300 mx-1"></div>

                <button onclick="setSentenceDifficulty(3)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${getBtnStyle(sentenceDifficulty === 3)}">3</button>
                <button onclick="setSentenceDifficulty(4)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${getBtnStyle(sentenceDifficulty === 4)}">4</button>
                <button onclick="setSentenceDifficulty(5)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${getBtnStyle(sentenceDifficulty === 5)}">5</button>
             </div>
        `;
    
    // (C) 配對模式 (英選中 - match)
    } else if (mode === 'en-cn' && subMode === 'match') {
        difficultySelectorHTML = `
             <div class="absolute top-4 left-4 z-20 flex items-center gap-1 bg-gray-100 rounded-lg p-1 shadow-inner">
                <span class="text-[10px] font-bold text-gray-400 px-1 select-none">組數</span>
                <button onclick="setMatchingDifficulty(2)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${getBtnStyle(state.quiz.matchingDifficulty === 2)}">2</button>
                <button onclick="setMatchingDifficulty(3)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${getBtnStyle(state.quiz.matchingDifficulty === 3)}">3</button>
                <button onclick="setMatchingDifficulty(4)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${getBtnStyle(state.quiz.matchingDifficulty === 4)}">4</button>
                <button onclick="setMatchingDifficulty(5)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${getBtnStyle(state.quiz.matchingDifficulty === 5)}">5</button>
             </div>
        `;
    }


    // --- 2. 模式切換按鈕區域 (右上角) ---
    // 這裡使用 getModeBtnClass 來確保所有模式的按鈕風格一致
    
    let modeToggleHTML = '';
    
    // (A) 中選英 (CN-EN)
    if (mode === 'cn-en') {
        modeToggleHTML = `
             <div class="mode-toggle-pill">
                <button onclick="setQuizSubMode('choice')" class="${getModeBtnClass(subMode === 'choice')}"><i class="fas fa-list-ul"></i> 選擇</button>
                <button onclick="setQuizSubMode('spell')" class="${getModeBtnClass(subMode === 'spell')}"><i class="fas fa-keyboard"></i> 拼字</button>
             </div>
        `;
    
    // (B) 填空題 (Sentence) [修正重點：原本這裡使用 .active class，現在改用 getModeBtnClass]
    } else if (mode === 'sentence') {
        modeToggleHTML = `
             <div class="mode-toggle-pill">
                <button onclick="setQuizSubMode('choice')" class="${getModeBtnClass(subMode === 'choice')}"><i class="fas fa-check-square"></i> 選擇</button>
                <button onclick="setQuizSubMode('order')" class="${getModeBtnClass(subMode === 'order')}"><i class="fas fa-sort"></i> 排序</button>
             </div>
        `;
    
    // (C) 英選中 (EN-CN) [修正重點：原本這裡使用 .active class，現在改用 getModeBtnClass]
    } else if (mode === 'en-cn') {
        modeToggleHTML = `
             <div class="mode-toggle-pill">
                <button onclick="setQuizSubMode('choice')" class="${getModeBtnClass(subMode === 'choice')}"><i class="fas fa-list-ul"></i> 選擇</button>
                <button onclick="setQuizSubMode('match')" class="${getModeBtnClass(subMode === 'match')}"><i class="fas fa-th-large"></i> 配對</button>
             </div>
        `;
    }
	const bigEmojiHTML = (!isSpeechMode && !(mode === 'en-cn' && subMode === 'match')) ? `
        <div onclick="speak('${currentQ.target.word}')" class="
            flex-shrink-0 flex items-center justify-center cursor-pointer group z-10 transition-transform active:scale-95
            w-16 h-16 md:w-24 md:h-24            
            mt-12 mb-4 md:mt-0 md:mb-0 
            md:absolute md:left-8 md:top-1/2 md:-translate-y-1/2
        ">
             <div class="text-5xl md:text-7xl filter drop-shadow-sm group-hover:rotate-12 transition-transform duration-300">
                <span style="display:inline-block; transform: scaleX(-1);">${currentQ.emoji}</span>
             </div>
        </div>
    ` : '';

	const isMatchMode = (mode === 'en-cn' && subMode === 'match');
    const isSpellMode = (mode === 'cn-en' && subMode === 'spell');
    
    let containerClass = "relative bg-white rounded-3xl shadow-sm mb-4 flex flex-col items-center justify-center border-b-4 border-indigo-100 ";
    
    if (isMatchMode) {
        containerClass += "p-4 min-h-[65px]";
    } else if (isSpellMode) {
        // --- 修改重點 ---
        // 1. md:justify-start: 電腦版改為「靠上對齊」，不再垂直置中
        // 2. md:pt-20: 電腦版增加頂部內距，讓中文題目往下移，避開頂部按鈕
        // 3. min-h-[250px]: 稍微加高容器最小高度
        containerClass += "p-5 md:p-6 min-h-[250px] md:justify-start md:pt-20"; 
    } else {
        containerClass += "p-5 md:p-6 min-h-[160px]";
    }
    const contentAreaClass = isMatchMode
        ? "w-full flex flex-col items-center justify-center noselect hidden" 
        : "w-full flex flex-col items-center justify-center noselect text-center relative z-0"; 

    headerHTML += `
        <div class="${containerClass}">
             ${difficultySelectorHTML}
             ${modeToggleHTML}
             
             ${bigEmojiHTML}
              
              <div class="${contentAreaClass}">
                <h3 class="${fontClass} font-bold text-gray-800 w-full ${breakClass} noselect px-2">
                    ${questionDisplayHTML}
                </h3>
                ${feedbackHTML}

				${(mode === 'cn-en' && subMode === 'spell') ? `
                    <div class="spelling-display mt-6 w-full px-1 md:px-0 noselect flex flex-wrap justify-center items-end gap-0">
                        ${state.quiz.spelling.revealedMask.map((char, idx) => {
                            const isCurrent = idx === state.quiz.spelling.nextIndex;
                            const activeStyle = isCurrent 
                                ? "border-indigo-500 bg-indigo-100 shadow-sm" 
                                : "border-gray-200";
                            
                            if (char) {
                                return `<span class="text-indigo-600 border-b-4 border-indigo-200 w-8 text-center pb-1 text-3xl font-mono">${formatDisplayWord(char)}</span>`;
                            } else {
                                return `<span class="border-b-4 ${activeStyle} h-12 w-8 inline-block transition-all duration-200 rounded-t-lg"></span>`;
                            }
                        }).join('')}
                    </div>
                ` : ''}

                ${(mode === 'sentence' && subMode === 'order') ? `
                    <div class="ordering-display mt-6 w-full px-1 md:px-0 noselect flex flex-wrap justify-center gap-2">
                        ${state.quiz.ordering.revealedMask.map((word, idx) => {
                            const isCurrent = idx === state.quiz.ordering.nextIndex;
                            let slotClass = "ordering-slot";
                            if (word) slotClass += " filled";
                            if (isCurrent) {
                                slotClass += " border-indigo-500 bg-indigo-50 shadow-sm ring-2 ring-indigo-100 ring-opacity-50";
                            }
                            if (word) return `<span class="${slotClass}">${word}</span>`;
                            else return `<span class="${slotClass}"></span>`;
                        }).join(' ')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    let optionsHTML = '';

	if (mode === 'en-cn' && subMode === 'match') {
	// --- 配對模式 (左右分欄版) ---
        
        // 1. 分離出左右兩邊的資料
        const leftItems = state.quiz.matching.items.filter(i => i.type === 'word');
        const rightItems = state.quiz.matching.items.filter(i => i.type === 'def');

        // 2. 定義生成卡片 HTML 的輔助函式
        const createCardHTML = (item) => {
            const isSelected = state.quiz.matching.selectedId === item.id;
            const isMatched = item.matched;
            // 英文顯示紅色母音，中文直接顯示
            let content = item.type === 'word' ? formatDisplayWord(item.text) : item.text;
            
            let cls = "match-card";
            if (isSelected) cls += " selected";
            if (isMatched) cls += " matched";
            
            return `
            <div id="match-card-${item.id}" onclick="handleMatchClick('${item.id}')" class="${cls}">
                ${content}
            </div>`;
        };

        // 3. 生成左右兩欄的 HTML
        optionsHTML = `
            <div class="matching-container noselect mt-4">
                <div class="matching-column">
                    ${leftItems.map(createCardHTML).join('')}
                </div>
                
                <div class="matching-column">
                    ${rightItems.map(createCardHTML).join('')}
                </div>
            </div>
        `;
        
        // (選擇性) 隱藏 Header 中的題目顯示區，保持介面乾淨
        if(questionDisplayHTML) {
             // 這裡不做事，維持前面邏輯設定的 '請找出所有對應的卡片'
        }

    } else if (mode === 'cn-en' && subMode === 'spell') {
        // --- 拼字模式 ---
        optionsHTML = `
            <div class="letter-pool noselect">
                ${state.quiz.spelling.letterPool.map(item => `
                    <button id="spell-btn-${item.id}" onclick="checkSpellingInput('${item.char}', ${item.id})" class="letter-btn hover:bg-blue-100 active:scale-95 noselect">
                        ${formatDisplayWord(item.char)}
                    </button>
                `).join('')}
            </div>
            <div class="text-center mt-6">
                <button onclick="speak('${currentQ.target.word}')" class="text-gray-400 hover:text-indigo-500 text-sm font-bold"><i class="fas fa-volume-up"></i> 提示發音</button>
            </div>
        `;

	} else if (mode === 'sentence' && subMode === 'order') {
        // --- 排序模式 ---
        optionsHTML = `
            <div class="word-pool noselect">
                ${state.quiz.ordering.wordPool.map((item, idx) => `
                    <button id="order-btn-${item.id}" onclick="checkOrderingInput('${item.text.replace(/'/g, "\\'")}', ${item.id})" class="word-btn hover:bg-blue-100 active:scale-95 noselect relative flex items-center justify-center">
                        <span class="key-hint" style="top: 2px; left: 4px; font-size: 0.6rem; opacity: 0.6;">${idx + 1}</span>
                        ${item.text.toLowerCase()}
                    </button>
                `).join('')}
            </div>
            <div class="text-center mt-6">
                <button onclick="speak('${currentQ.target.sentence.replace(/'/g, "\\'")}')" class="text-gray-400 hover:text-indigo-500 text-sm font-bold"><i class="fas fa-volume-up"></i> 提示發音</button>
            </div>
        `;


	} else if (status === 'answering') {
        // --- 四選一 (作答中) ---
        
        // 1. 定義「要顯示」的按鍵提示字元 (僅顯示 ERDF)
        const displayKeys = ['E', 'R', 'D', 'F'];

        optionsHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${currentQ.options.map((opt, idx) => {
                let content = '';
                if (mode === 'sentence') content = formatDisplayWord(opt.displayText || opt.word);
                else if (mode === 'cn-en') content = formatDisplayWord(opt.word);
                else content = opt.def;
                
                // 2. 取得對應的字元
                const extraKey = displayKeys[idx] || '';

                return `
                <button onclick="handleAnswer(${opt.id})" class="p-6 rounded-xl text-xl font-medium border-2 bg-white border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700 active:scale-[0.98] shadow-sm hover:-translate-y-1 transition-all relative overflow-hidden break-all noselect">
                    
                    <span class="key-hint">${idx + 1}</span>
                    
                    <span class="absolute bottom-2 left-4 text-xs font-bold text-gray-200 select-none block z-10 opacity-70">${extraKey}</span>
                    
                    ${content}
                </button>`;
            }).join('')}
        </div>`;
	} else {
         // --- 結果顯示 (Result State) ---
         
         if (mode === 'sentence' && subMode === 'choice') {
             // 填空題結果顯示下一題按鈕 (保持不變)
             optionsHTML = `<button onclick="nextQuestion()" class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-transform active:scale-95 noselect">${currentIndex < questions.length - 1 ? '下一題' : '查看結果'} <i class="fas fa-chevron-right"></i></button>`;
         } else {
             // 其他模式顯示結果選項
             // 修改重點：同樣改為 p-4 md:p-6 和 text-xl
             optionsHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                ${currentQ.options.map((opt, idx) => {
                    let content = '';
                    if (mode === 'cn-en') content = formatDisplayWord(opt.word);
                    else content = opt.def;

                    let btnClass = "p-4 md:p-6 rounded-xl text-xl font-medium border-2 transition-all relative overflow-hidden break-all noselect ";
                    if (opt.id === currentQ.target.id) btnClass += "bg-green-50 border-green-500 text-green-800 shadow-md transform scale-[1.02]";
                    else if (opt.id === selectedOption.id) btnClass += "bg-red-50 border-red-500 text-red-800";
                    else btnClass += "bg-gray-50 border-gray-100 text-gray-400 opacity-50";
                    return `<button disabled class="${btnClass}"><span class="key-hint">${idx + 1}</span>${content}</button>`;
                }).join('')}
             </div>`;
         }
    }
	
    container.innerHTML = headerHTML + optionsHTML;
    appRoot.appendChild(container);
}

function handleAnswer(optionId) {
	if (checkSpamming()) return;
    const currentQ = state.quiz.questions[state.quiz.currentIndex];
    const option = currentQ.options.find(o => o.id === optionId);
    state.quiz.selectedOption = option;
    
    if (state.quiz.autoPlayAudio) {
        speak(currentQ.target.word);
    }
    
    if (option.id === currentQ.target.id) state.quiz.score++;
    else state.quiz.wrongQuestions.push(currentQ.target);
    
    state.quiz.status = 'result';
    render();     
    
    if (state.quiz.mode !== 'sentence') {
        setTimeout(nextQuestion, 1000);
    }
}

// --- 防亂猜機制 (Anti-Spam) ---
function checkSpamming() {
    const now = Date.now();

    // --- 情況 A: 選擇題模式 (中選英/英選中/填空選擇) ---
    // 規則：嚴格判定，只要發生 1 次「秒按」(反應時間 < 600ms)，直接進無聊模式
    if (state.quiz.subMode === 'choice') {
        const loadTime = state.quiz.questionLoadedTime || now;
        const reactionTime = now - loadTime;
        
        // 修改重點：不必累積次數，只要太快就直接觸發
        if (reactionTime < 600) {
            showBoringCooldown();
            return true; // 阻擋本次操作
        }
        return false; // 時間正常，通過
    } 
    
    // --- 情況 B: 操作型模式 (拼字/排序) ---
    // 規則：寬容判定，因為打字/點擊按鈕本來就比較快
    // 必須「連續」且「極短間隔」多次才視為亂按
    else {
        const lastTime = state.quiz.lastActionTime || 0;
        const interval = now - lastTime;
        state.quiz.lastActionTime = now; // 更新動作時間

        // 如果間隔小於 300ms，計入嫌疑
        if (interval < 300) {
            state.quiz.spamCounter++;
        } else {
            // 正常操作，減少嫌疑值
            if (state.quiz.spamCounter > 0) state.quiz.spamCounter--;
        }

        // 連續 3 次過快才觸發 (避免誤判手速快的高手)
        if (state.quiz.spamCounter >= 3) {
            showBoringCooldown();
            state.quiz.spamCounter = 0; // 重置
            return true; // 阻擋
        }
        return false;
    }
}


// 顯示極度無聊的倒數畫面
function showBoringCooldown() {
    // 防止重複開啟
    if (document.getElementById('cooldown-overlay')) return;

    // 1. 建立遮罩
    const overlay = document.createElement('div');
    overlay.id = "cooldown-overlay"; // ID 供全域鍵盤監聽檢測使用
    
    // 樣式：白色半透明、無滑鼠、無選取
    overlay.className = "fixed inset-0 z-[500] bg-white/50 flex items-center justify-center cursor-none select-none transition-all duration-300";
    
    // 重點：內容全空，沒有倒數數字，沒有文字
    overlay.innerHTML = ''; 
    
    document.body.appendChild(overlay);

    // 2. 計時邏輯
    let timeLeft = 3; // 初始 3 秒

    // 定義結束函式
    const endCooldown = () => {
        clearInterval(timerInterval);
        // 移除懲罰監聽器
        document.removeEventListener('keydown', penaltyAction, true);
        document.removeEventListener('mousedown', penaltyAction, true);
        document.removeEventListener('touchstart', penaltyAction, true);
        
        // 淡出移除
        overlay.classList.add('opacity-0');
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 300);
    };

    // 啟動倒數
    const timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            endCooldown();
        }
    }, 1000);

    // 3. 懲罰機制：如果在冷卻期間亂動，時間重置回 3 秒
    const penaltyAction = (e) => {
        // 阻止事件傳遞 (確保不會點到後面的按鈕)
        e.stopPropagation();
        e.preventDefault();
        
        // 重置時間 (只有完全停止動作後，才會順利倒數完 3 秒)
        timeLeft = 3;
    };

    // 使用 useCapture (true) 確保在事件最開始就攔截
    document.addEventListener('keydown', penaltyAction, true);
    document.addEventListener('mousedown', penaltyAction, true);
    document.addEventListener('touchstart', penaltyAction, true);
}

function nextQuestion() {
    if (state.quiz.currentIndex < state.quiz.questions.length - 1) {
        state.quiz.currentIndex++;
        state.quiz.status = 'answering';
        state.quiz.selectedOption = null;

		state.quiz.questionLoadedTime = Date.now();
        
        if (state.quiz.mode === 'cn-en' && state.quiz.subMode === 'spell') {
            initSpellingData(state.quiz.questions[state.quiz.currentIndex].target.word);
        }
        if (state.quiz.mode === 'sentence' && state.quiz.subMode === 'order') {
            initOrderingData(state.quiz.questions[state.quiz.currentIndex].target.sentence);
        }
        
        render();
    } else {
        endQuiz();
    }
}

// --- Spelling Mode Logic ---

function setQuizSubMode(newSubMode) {
    state.quiz.subMode = newSubMode;
    
    // 根據當前主模式與新子模式，初始化對應資料
    const currentQ = state.quiz.questions[state.quiz.currentIndex];
    
    if (state.quiz.mode === 'cn-en' && newSubMode === 'spell') {
        initSpellingData(currentQ.target.word);
    }
    
    if (state.quiz.mode === 'sentence' && newSubMode === 'order') {
        initOrderingData(currentQ.target.sentence);
    }

    if (state.quiz.mode === 'en-cn' && newSubMode === 'match') {
        initMatchingData();
    }
    
    render();
}

// 設定拼字難度
function setSpellingDifficulty(num) {
    state.quiz.spellingDifficulty = num;
    if (state.quiz.questions.length > 0) {
        initSpellingData(state.quiz.questions[state.quiz.currentIndex].target.word);
    }
    render();
}

// 初始化單題拼字資料
function initSpellingData(word) {
    const cleanWord = word.trim();
    const len = cleanWord.length;
    
    let revealed = new Array(len).fill(null);
    let pool = [];
    let buttonIndices = []; // 最終要變成按鈕的索引列表

    // 讀取設定 (可能是 數字 3,4,5 或 字串 'a')
    const diff = state.quiz.spellingDifficulty;

    if (diff === 'a') {
        // 定義母音 (包含大小寫)
        const vowels = ['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'];
        let hasVowel = false;

        for (let i = 0; i < len; i++) {
            const char = cleanWord[i];
            if (vowels.includes(char)) {
                // 是母音 -> 變成按鈕 (revealed 維持 null)
                buttonIndices.push(i);
                hasVowel = true;
            } else {
                // 是子音 -> 直接顯示
                revealed[i] = char;
            }
        }

        // 防呆：如果單字完全沒有母音 (例如 "cry", "rhythm")，
        // 為了避免沒有題目可做，改為隨機挖空一個字母
        if (!hasVowel && len > 0) {
            const randIdx = Math.floor(Math.random() * len);
            revealed[randIdx] = null; // 挖空
            buttonIndices.push(randIdx);
        }

    } else {
        // --- 數量模式 (Number Mode: 3, 4, 5) ---
        const MAX_BUTTONS = typeof diff === 'number' ? diff : 5;

        if (len < 4) {
            // 短單字 (< 4)：全部挖空
            for (let i = 0; i < len; i++) {
                buttonIndices.push(i);
            }
        } else {
            // 一般單字：先顯示首尾
            revealed[0] = cleanWord[0];
            revealed[len - 1] = cleanWord[len - 1];

            // 取得中間部分
            let innerIndices = [];
            for (let i = 1; i < len - 1; i++) {
                innerIndices.push(i);
            }

            // 檢查中間是否過長
            if (innerIndices.length > MAX_BUTTONS) {
                const countToReveal = innerIndices.length - MAX_BUTTONS;
                const shuffled = innerIndices.sort(() => 0.5 - Math.random());
                
                // 取出多餘部分直接顯示
                const indicesToReveal = shuffled.slice(0, countToReveal);
                indicesToReveal.forEach(idx => {
                    revealed[idx] = cleanWord[idx];
                });

                // 剩下的作為按鈕
                buttonIndices = shuffled.slice(countToReveal).sort((a, b) => a - b);
            } else {
                // 沒過長，中間全挖空
                buttonIndices = innerIndices;
            }
        }
    }

    // 建立按鈕池
    buttonIndices.forEach(idx => {
        pool.push({ char: cleanWord[idx], id: idx }); 
    });

    // 排序按鈕 (A-Z)
    pool.sort((a, b) => a.char.toLowerCase().localeCompare(b.char.toLowerCase()));

    // 計算下一個填空位置
    let nextIndex = 0;
    while (nextIndex < len && revealed[nextIndex] !== null) {
        nextIndex++;
    }

    state.quiz.spelling = {
        currentWord: cleanWord,
        revealedMask: revealed,
        letterPool: pool,
        nextIndex: nextIndex
    };
}


// 檢查拼字輸入
function checkSpellingInput(inputChar, btnId) {
    const { currentWord, nextIndex } = state.quiz.spelling;
    
    // 取得正確答案的該字元
    const correctChar = currentWord[nextIndex];

    // 比較 (不分大小寫)
    if (inputChar.toLowerCase() === correctChar.toLowerCase()) {
        // --- 答對 ---
        
        if (state.quiz.autoPlayAudio) {
            speak(inputChar); // 唸出字母
        }
        
        // ... (以下代碼保持不變) ...
        state.quiz.spelling.revealedMask[nextIndex] = currentWord[nextIndex]; 
        state.quiz.spelling.letterPool = state.quiz.spelling.letterPool.filter(item => item.id !== btnId);
        
        let newNextIndex = nextIndex + 1;
        while (newNextIndex < currentWord.length && state.quiz.spelling.revealedMask[newNextIndex] !== null) {
            newNextIndex++;
        }
        state.quiz.spelling.nextIndex = newNextIndex;

        if (state.quiz.spelling.letterPool.length === 0) {
            // 完成！
            // 如果希望拼完後自動唸單字，且受開關控制：
            if (state.quiz.autoPlayAudio) {
                speak(state.quiz.spelling.currentWord);
            } else {
                // 如果關閉靜音，原本代碼會強制唸出，這裡可以改為不唸或保持 speak(state.quiz.spelling.currentWord) 看您需求
                // 建議改為由 if 包覆，或者僅在完成時強制唸一次(視教學設計而定)
            }
            
            state.quiz.score++;
            state.quiz.status = 'result'; 
            render();
            setTimeout(nextQuestion, 1200);
        } else {
            render();
        }

    } else {
        const btn = document.getElementById(`spell-btn-${btnId}`);
        if (btn) {
            btn.classList.add('btn-error');
            setTimeout(() => {
                btn.classList.remove('btn-error');
            }, 400);
        }
    }
}


// --- Sentence Ordering Logic ---

// 設定句子排序難度
function setSentenceDifficulty(num) {
    state.quiz.sentenceDifficulty = num;
    if (state.quiz.questions.length > 0) {
        initOrderingData(state.quiz.questions[state.quiz.currentIndex].target.sentence);
    }
    render();
}

function toggleFirstLastMode() {
    // 切換模式狀態
    state.quiz.isFirstLastMode = !state.quiz.isFirstLastMode;
    
    // 重新初始化當前題目的排序資料
    if (state.quiz.questions.length > 0) {
        initOrderingData(state.quiz.questions[state.quiz.currentIndex].target.sentence);
    }
    render();
}

// 初始化單題排序資料
function initOrderingData(sentence) {
    // 1. 切割句子 (依空白切割，保留標點符號在單字內)
    const words = sentence.trim().split(/\s+/);
    const len = words.length;
    
    let revealed = new Array(len).fill(null);
    let pool = [];
    let buttonIndices = []; // 這些索引將會被挖空變成按鈕

    // 讀取設定
    const MAX_BUTTONS = state.quiz.sentenceDifficulty || 5;
    const isFirstLastMode = state.quiz.isFirstLastMode; // 讀取是否啟用 <> 模式

    // 建立所有可能的索引 [0, 1, 2, ... len-1]
    let candidates = [];
    for(let i=0; i<len; i++) candidates.push(i);

    if (isFirstLastMode) {
        // --- 首尾模式 ---
        // 邏輯：預設保留首尾，中間挖空。若中間挖空數量超過 MAX_BUTTONS，則從首尾往內縮，減少挖空。
        
        // 1. 先決定要保留的索引 (預設保留頭尾)
        let keepIndices = [];
        if (len > 0) keepIndices.push(0);
        if (len > 1) keepIndices.push(len - 1);

        // 2. 初始挖空名單 (排除頭尾)
        let potentialHides = candidates.filter(idx => !keepIndices.includes(idx));

        // 3. 檢查挖空數量是否超過設定的 MAX_BUTTONS
        // 如果中間太長 (例如 "A b c d e f G", max=3)，目前挖空 5 個 (b,c,d,e,f)
        // 我們需要減少挖空，把 b 和 f 也顯示出來，變成 "A b _ _ _ f G"
        while (potentialHides.length > MAX_BUTTONS) {
            // 從前面吐一個回去 (變成顯示)
            const first = potentialHides.shift(); 
            // 從後面吐一個回去 (變成顯示)
            if (potentialHides.length > MAX_BUTTONS) {
                 const last = potentialHides.pop();
            }
            // 迴圈繼續，直到剩餘的挖空數量 <= MAX_BUTTONS
        }
        
        buttonIndices = potentialHides;

        // 4. 設定 revealed (非按鈕的都顯示)
        for (let i = 0; i < len; i++) {
            if (!buttonIndices.includes(i)) {
                revealed[i] = words[i];
            }
        }

    } else {
        // --- 原本的隨機模式 ---
        // 邏輯：隨機選 MAX_BUTTONS 個挖空，其餘顯示
        
        if (len <= MAX_BUTTONS) {
            buttonIndices = candidates; // 全部挖空
        } else {
            // 隨機洗牌
            const shuffled = candidates.sort(() => 0.5 - Math.random());
            
            // 取出前 N 個作為「按鈕」 (挖空)
            buttonIndices = shuffled.slice(0, MAX_BUTTONS).sort((a,b) => a-b);
            
            // 剩下的直接顯示
            const indicesToReveal = shuffled.slice(MAX_BUTTONS);
            indicesToReveal.forEach(idx => {
                revealed[idx] = words[idx];
            });
        }
    }

	// 建立按鈕池
    buttonIndices.forEach(idx => {
        // 移除標點符號，讓按鈕看起來乾淨一點 (比對時也會移除)
        const cleanText = words[idx].replace(/[.,!?;:]/g, '');
        pool.push({ text: cleanText, id: idx });
    });

    // 按鈕池隨機排序 (打亂順序供使用者選擇)
    pool.sort(() => 0.5 - Math.random());

    // 計算 nextIndex (第一個非 null 的位置)
    let nextIndex = 0;
    while (nextIndex < len && revealed[nextIndex] !== null) {
        nextIndex++;
    }

    state.quiz.ordering = {
        targetWords: words,
        revealedMask: revealed,
        wordPool: pool,
        nextIndex: nextIndex
    };
}



// 檢查排序輸入
function checkOrderingInput(selectedWord, btnId) {
    // 防亂按 (速度檢測)
    if (checkSpamming()) return;

    const { targetWords, nextIndex } = state.quiz.ordering;
    const correctWord = targetWords[nextIndex];
    
    // 移除標點符號進行比對
    const cleanCorrect = correctWord.replace(/[.,!?;:]/g, '');

    if (selectedWord.toLowerCase() === cleanCorrect.toLowerCase()) {
        // --- 答對 ---
        
        // 重置連續錯誤計數
        state.quiz.consecutiveErrorCount = 0;

        if (state.quiz.autoPlayAudio) {
            speak(selectedWord);
        }
        
        // 1. 更新顯示
        state.quiz.ordering.revealedMask[nextIndex] = correctWord;
        
        // 2. 移除按鈕
        state.quiz.ordering.wordPool = state.quiz.ordering.wordPool.filter(item => item.id !== btnId);
        
        // 3. 計算下一個
        let newNextIndex = nextIndex + 1;
        while (newNextIndex < targetWords.length && state.quiz.ordering.revealedMask[newNextIndex] !== null) {
            newNextIndex++;
        }
        state.quiz.ordering.nextIndex = newNextIndex;

        // 4. 檢查完成
        if (state.quiz.ordering.wordPool.length === 0) {
            state.quiz.score++;
            state.quiz.status = 'result'; 
            render();
            
            const delay = state.quiz.isFirstLastMode ? 2000 : 1200;
            setTimeout(nextQuestion, delay);
        } else {
            render();
        }

    } else {
        // --- 答錯 ---
        
        // 1. 累加錯誤次數
        state.quiz.consecutiveErrorCount = (state.quiz.consecutiveErrorCount || 0) + 1;

        // 2. 檢查是否連續錯 3 次
        if (state.quiz.consecutiveErrorCount >= 3) {
            showBoringCooldown(); // 顯示無聊遮罩
            state.quiz.consecutiveErrorCount = 0; // 重置計數
            return; // 阻擋後續動畫，直接進遮罩
        }

        // 3. 錯誤搖晃動畫
        const btn = document.getElementById(`order-btn-${btnId}`);
        if (btn) {
            btn.classList.add('btn-error');
            setTimeout(() => btn.classList.remove('btn-error'), 400);
        }
    }
}





function endQuiz() {
    state.quiz.isFinished = true;
    render();
}

function retryWrongQuestions() {
    const wrongWords = state.quiz.wrongQuestions;
    const generateOptions = (w) => {
        const others = shuffle(state.vocabulary.filter(cw => cw.id !== w.id)).slice(0, 3);
        return shuffle([w, ...others]);
    };
    
    if (state.quiz.mode === 'sentence') {
         state.quiz.questions = shuffle([...wrongWords]).map(w => {
             const others = shuffle(state.vocabulary.filter(cw => cw.id !== w.id)).slice(0, 3);
             return { 
                 target: w, 
                 text: w.sentence.replace(w.word, '_____'),
                 answerWord: w.word,
                 options: shuffle([w, ...others]).map(o => ({...o, displayText: o.word})), 
                 emoji: getRandomEmoji() 
             };
        });
    } else {
        state.quiz.questions = shuffle([...wrongWords]).map(w => {
            return { target: w, options: generateOptions(w), emoji: getRandomEmoji() };
        });
    }
    state.quiz.wrongQuestions = [];
    state.quiz.currentIndex = 0;
    state.quiz.score = 0;
    state.quiz.isFinished = false;
    state.quiz.status = 'answering';
    state.quiz.selectedOption = null;
	state.quiz.questionLoadedTime = Date.now();
    render();
}

// --- STORY VIEW ---
function renderStory() {
    // --- 1. 決定要顯示哪些單元的故事 ---
    let effectiveUnits = [];
    if (state.filterMode === 'custom' && state.activeSetId) {
        const set = state.customSets.find(s => s.id === state.activeSetId);
        if (set) {
            const setWords = state.vocabulary.filter(w => set.wordIds.includes(w.id));
            effectiveUnits = [...new Set(setWords.map(w => w.unit))];
        }
    } else {
        effectiveUnits = state.selectedUnits;
    }

    const validStories = STORIES.filter(story => story.units.some(u => effectiveUnits.includes(u)));
    
    // --- 2. 容器與無資料處理 ---
    const container = document.createElement('div');
    container.className = "pb-48 w-full max-w-4xl mx-auto relative"; 

    if (validStories.length === 0) {
        const msg = state.filterMode === 'custom' 
            ? "您的自訂學習集中沒有包含任何相關的故事單元。" 
            : "目前選擇的範圍沒有相關故事。<br><span class='text-sm'>請嘗試在首頁勾選更多單元。</span>";
        container.innerHTML = `
            <div class="p-10 text-center text-gray-500 mt-10 bg-white rounded-2xl shadow-sm border border-gray-100 mx-4">
                <i class="fas fa-book-open text-4xl mb-4 text-gray-300"></i><br>${msg}
            </div>`;
        appRoot.appendChild(container);
        return;
    }

    // --- 3. 狀態與索引校正 ---
    if (state.story.activeIndex >= validStories.length) {
        state.story.activeIndex = 0;
    }
    const currentStory = validStories[state.story.activeIndex];

    // 動態組合完整文章
    const fullStoryText = currentStory.translations.map(t => t.text).join(' ');

    const segments = fullStoryText.split(/(\{.*?\})/).map((part, idx) => {
        if (part.startsWith('{') && part.endsWith('}')) {
            return { type: 'word', content: part.slice(1, -1), id: idx };
        }
        return { type: 'text', content: part };
    });

    const rawWords = [...new Set(segments.filter(s => s.type === 'word').map(s => s.content.toLowerCase()))];
    
    if (state.story.cachedTitle !== currentStory.title || !state.story.currentWordBank) {
        state.story.cachedTitle = currentStory.title;
        state.story.currentWordBank = rawWords.sort();
        state.story.filledBlanks = {};
        state.story.selectedBlank = null;
        state.story.revealedTrans = {};
        state.story.consecutiveErrors = 0;
        state.story.quizStatus = 'idle'; 
        state.story.timer = 0;
        
        if (state.story.options.feedbackAudio === undefined) {
            state.story.options.feedbackAudio = true;
        }

        if (state.story.timerInterval) clearInterval(state.story.timerInterval);
    }
    const wordBank = state.story.currentWordBank;

    // --- 4. 渲染 UI 元件 ---

    // (A) 頂部導航列
    const prevIndex = (state.story.activeIndex - 1 + validStories.length) % validStories.length;
    const nextIndex = (state.story.activeIndex + 1) % validStories.length;

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

    // (B) 控制面板
	const controls = document.createElement('div');
    controls.className = "px-4";
    
    const speakText = fullStoryText.replace(/[{}]/g, '').replace(/'/g, "\\'");
    const isPlayingThis = state.audio.isPlaying && state.audio.lastText === fullStoryText.replace(/[{}]/g, '');
    const currentRate = state.audio.lastRate;

    const btnBase = "flex items-center justify-center gap-1 px-3 py-1 rounded-md text-xs font-bold transition-all border shadow-sm active:scale-95";
    
    const normalBtnClass = (isPlayingThis && currentRate === 1) ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50";
    const slowBtnClass = (isPlayingThis && currentRate === 0.7) ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50";
    const normalIcon = (isPlayingThis && currentRate === 1) ? 'fa-stop' : 'fa-volume-up';
    const slowContent = (isPlayingThis && currentRate === 0.7) ? '<i class="fas fa-stop"></i>' : '🐢';

    const showEn = state.story.options.showEnglish;
    const showCn = state.story.options.showTranslation;
    const enBtnClass = showEn ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-white text-gray-400 border-gray-200";
    const cnBtnClass = showCn ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-white text-gray-400 border-gray-200";

    // 左側控制項
    let leftControlHTML = '';
    if (state.story.mode === 'read') {
        leftControlHTML = `
            <div class="flex items-center gap-1">
                <span class="text-[10px] font-bold text-gray-400 mr-1">顯示</span>
                <button onclick="toggleStoryOption('showEnglish')" class="${btnBase} ${enBtnClass}">EN</button>
                <button onclick="toggleStoryOption('showTranslation')" class="${btnBase} ${cnBtnClass}">中</button>
            </div>
        `;
    } else {
        const showReset = state.story.quizStatus !== 'idle';
        leftControlHTML = `
            <div class="flex items-center gap-2">
                ${showReset ? `
                <button onclick="stopStoryQuiz()" class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors active:scale-90" title="重新開始">
                    <i class="fas fa-times text-xs"></i>
                </button>` : ''}
                <div class="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                    <i class="fas fa-stopwatch text-gray-400 text-[10px] ${state.story.quizStatus === 'playing' ? 'animate-pulse' : ''}"></i>
                    <span id="quiz-timer-display" class="timer-badge font-mono font-bold text-indigo-600 text-xs w-8 text-center">${formatTime(state.story.timer)}</span>
                </div>
            </div>
        `;
    }

    // [修改重點] 移除了原本中間的 middleControlHTML (發音開關)，這裡清空
    
    controls.innerHTML = `
        <div class="bg-white p-2 rounded-xl shadow-sm border border-gray-100 mb-4">
            
            <div class="w-full bg-gray-100 p-1.5 rounded-2xl flex relative mb-3 shadow-inner">
                <button onclick="setStoryMode('read')" class="flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-300 z-10 flex items-center justify-center gap-2 ${state.story.mode === 'read' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}">
                    <i class="far fa-eye"></i> 閱讀
                </button>
                <button onclick="setStoryMode('quiz')" class="flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-300 z-10 flex items-center justify-center gap-2 ${state.story.mode === 'quiz' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}">
                    <i class="far fa-check-circle"></i> 填空
                </button>
            </div>

            <div class="flex justify-between items-center px-1">
                ${leftControlHTML}
                
                <div class="flex items-center gap-2">
                    <button onclick="speak('${speakText}', 1)" class="${btnBase} ${normalBtnClass} w-9 h-8" title="全文原速">
                        <i class="fas ${normalIcon}"></i>
                    </button>
                    <button onclick="speak('${speakText}', 0.7)" class="${btnBase} ${slowBtnClass} w-9 h-8" title="全文慢速">
                        <span class="">${slowContent}</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    container.appendChild(controls);

    // (C) 內容區域
    const content = document.createElement('div');
    content.className = "bg-transparent mb-6 mx-2 relative overflow-hidden";
    
    if (state.story.mode === 'quiz' && state.story.showCelebration) {
        content.innerHTML = `
            <div class="absolute inset-0 pointer-events-none z-20 flex flex-col items-center justify-center overflow-hidden h-full min-h-[300px]">
                <div class="text-[100px] animate-bounce-subtle opacity-20 select-none">🎉</div>
                <div class="absolute top-10 left-10 text-4xl animate-pulse select-none">✨</div>
                <div class="absolute bottom-10 right-10 text-4xl animate-pulse delay-75 select-none">🌟</div>
            </div>
        `;
    }

    if (state.story.mode === 'read') {
        // --- 閱讀模式 ---
        content.innerHTML += `<div class="space-y-3">
            ${currentStory.translations.map((item, idx) => {
                const isRevealed = state.story.revealedTrans[idx] !== undefined 
                    ? state.story.revealedTrans[idx] 
                    : state.story.options.showTranslation;
                const isEnBlurred = !state.story.options.showEnglish;
                const displaySentence = item.text.replace(/[{}]/g, '');
                const safeSentence = displaySentence.replace(/'/g, "\\'");
                
                return `
                <div class="sentence-card bg-white p-4 rounded-xl shadow-sm border border-gray-100 group hover:border-indigo-100">
                    <div class="flex items-start gap-3">
                        <button onclick="speak('${safeSentence}')" class="play-icon mt-1 w-8 h-8 hidden md:flex items-center justify-center rounded-full bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 flex-shrink-0" title="播放此句">
							<i class="fas fa-volume-up text-sm"></i>
						</button>
                        
                        <div class="flex-1">
                            <p class="text-lg leading-relaxed font-medium text-gray-800 cursor-pointer ${isEnBlurred ? 'text-blur' : ''}" onclick="speak('${safeSentence}')">
                                ${displaySentence.split(' ').map(word => {
                                    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
                                    const isKey = state.vocabulary.some(v => v.word.toLowerCase() === cleanWord.toLowerCase());
                                    return `<span class="${isKey ? 'text-indigo-700 font-bold' : ''}">${word} </span>`;
                                }).join('')}
                            </p>
                            
                            <div class="mt-3 pt-3 border-t border-gray-100 flex items-start gap-2">
                                <button onclick="toggleTrans(${idx})" class="mt-0.5 text-gray-400 hover:text-indigo-500 focus:outline-none p-1" title="${isRevealed ? '隱藏翻譯' : '顯示翻譯'}">
                                    <i class="fas ${isRevealed ? 'fa-eye-slash' : 'fa-language'}"></i>
                                </button>
                                <span class="text-base text-gray-600 font-medium leading-relaxed ${isRevealed ? 'block' : 'hidden'}">
                                    ${item.trans}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    } else {
        // --- 填空模式 ---
        let blankCounter = 0;
        const isGameActive = state.story.quizStatus === 'playing';
        
        content.innerHTML += `<div class="bg-white p-6 md:p-8 rounded-2xl shadow-md leading-[3.5rem] text-lg text-gray-800 font-serif relative min-h-[300px]">
            ${segments.map(seg => {
                if (seg.type === 'text') return `<span>${seg.content}</span>`;
                
                blankCounter++;
                const userWord = state.story.filledBlanks[seg.id];
                const isActive = state.story.selectedBlank === seg.id;
                const isError = state.story.errorBlank === seg.id;
                
                let cssClass = "blank-slot inline-flex items-center justify-center mx-1 border-b-2 transition-all px-2 rounded-md align-middle font-bold ";
                
                if (isError) {
                    cssClass += "border-red-500 bg-red-100 text-red-600 animate-pulse";
                } else if (isActive) {
                    cssClass += "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 text-indigo-700 shadow-md transform scale-105";
                } else if (userWord) {
                    cssClass += "border-green-500 text-green-700 bg-green-50 cursor-default";
                } else {
                    cssClass += "border-gray-300 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:border-indigo-300 cursor-pointer";
                }

                const clickAction = isGameActive ? `onclick="selectStoryBlank(${seg.id})"` : "";
                let innerContent = userWord || `<span class="blank-number">${blankCounter}</span>`;

                return `<span ${clickAction} class="${cssClass}">${innerContent}</span>`;
            }).join('')}
        </div>`;
    }
    container.appendChild(content);

    // (D) 底部 Footer
    if (state.story.mode === 'quiz') {
        const footer = document.createElement('div');
        footer.id = "story-footer";
        footer.className = "fixed bottom-[70px] left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40 transition-all duration-300 ease-in-out";        
        
        if (state.story.quizStatus === 'idle') {
            footer.innerHTML = `
                <div class="max-w-2xl mx-auto flex justify-center">
                    <button onclick="startStoryQuiz()" class="w-full max-w-sm h-14 bg-indigo-600 text-white rounded-2xl font-bold text-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                        <i class="fas fa-play"></i> 開始挑戰
                    </button>
                </div>
            `;
        } else if (state.story.quizStatus === 'finished') {
            footer.innerHTML = `
                <div class="max-w-4xl mx-auto flex flex-col items-center pb-2">
                    <div class="flex gap-3 w-full justify-center max-w-md">
                        <button onclick="startStoryQuiz()" class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                            <i class="fas fa-redo"></i> 再次挑戰
                        </button>
                        <button onclick="changeStory(${nextIndex})" class="flex-1 px-4 py-3 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl font-bold shadow-sm hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center gap-2">
                            下一篇 <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            `;
        } else {
            // --- 修改重點：在 Word Bank 按鈕群組的最前面，加入靜音開關 ---
            const isFeedbackOn = state.story.options.feedbackAudio;
            
            // 靜音按鈕 HTML (樣式調整為與單字按鈕高度一致)
            const muteBtnHTML = `
                <button onclick="toggleStoryOption('feedbackAudio')" class="px-3 py-2 rounded-xl font-bold text-sm border border-gray-200 transition-all active:scale-95 flex items-center justify-center ${isFeedbackOn ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-gray-100 text-gray-400'}" title="${isFeedbackOn ? '點擊發音' : '靜音'}">
                    <i class="fas ${isFeedbackOn ? 'fa-volume-up' : 'fa-volume-mute'}"></i>
                </button>
            `;

			footer.innerHTML = `
				<div class="max-w-2xl mx-auto px-4"> 
					<div class="flex flex-wrap justify-center gap-2 pb-1">
                        ${muteBtnHTML}
                        
						${wordBank.map(word => `
							<button onclick="fillStoryBlank('${word}')" class="px-4 py-2 rounded-xl font-bold text-sm border transition-all active:scale-95 whitespace-nowrap ${state.story.selectedBlank !== null ? 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400 shadow-sm' : 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed'}" ${state.story.selectedBlank === null ? 'disabled' : ''}>
								${word}
							</button>
						`).join('')}
					</div>
				</div>
			`;
        }
        container.appendChild(footer);
    }

    appRoot.appendChild(container);
}

// Story Helpers
function changeStory(idx) {
    state.story.activeIndex = parseInt(idx);
    state.story.filledBlanks = {};
    state.story.selectedBlank = null;
    state.story.revealedTrans = {};
    state.story.currentWordBank = null;
    state.story.cachedTitle = null; 
    state.story.consecutiveErrors = 0;

    stopStoryTimer();
    state.story.quizStatus = 'idle';
    state.story.timer = 0;
    
    render();
}

function setStoryMode(mode) {
    state.story.mode = mode;
    if (mode === 'quiz') {
        state.story.quizStatus = 'idle';
        state.story.timer = 0;
    } 
    stopStoryTimer();
    render();
}

function setStoryFeedbackSpeed(speed) {
    state.story.feedbackSpeed = speed;
    render(); 
}

function toggleTrans(idx) {
    const currentState = state.story.revealedTrans[idx] !== undefined 
        ? state.story.revealedTrans[idx] 
        : state.story.options.showTranslation;
    // 設定為相反狀態 (這會產生一個個別覆蓋設定)
    state.story.revealedTrans[idx] = !currentState;
    render();
}
function toggleStoryOption(option) {
    state.story.options[option] = !state.story.options[option];
    if (option === 'showTranslation') {
        state.story.revealedTrans = {};
    }
    render();
}
function startStoryQuiz() {
    // 1. 重置狀態
    state.story.filledBlanks = {};
    state.story.consecutiveErrors = 0;
    state.story.quizStatus = 'playing';
    state.story.timer = 0;
    
    // 2. 啟動計時器
    if (state.story.timerInterval) clearInterval(state.story.timerInterval);
    state.story.timerInterval = setInterval(() => {
        state.story.timer++;
        const timerEl = document.getElementById('quiz-timer-display');
        if (timerEl) {
            const mins = Math.floor(state.story.timer / 60).toString().padStart(2, '0');
            const secs = (state.story.timer % 60).toString().padStart(2, '0');
            timerEl.innerText = `${mins}:${secs}`;
        }
    }, 1000);

    // 3. 自動選取第一個空格
    const set = state.customSets.find(s => s.id === state.activeSetId);
    let effectiveUnits = state.selectedUnits;
    if (state.filterMode === 'custom' && set) {
         const setWords = state.vocabulary.filter(w => set.wordIds.includes(w.id));
         effectiveUnits = [...new Set(setWords.map(w => w.unit))];
    }
    const validStories = STORIES.filter(story => story.units.some(u => effectiveUnits.includes(u)));
    const currentStory = validStories[state.story.activeIndex];
    
    // [修改重點] 動態組合全文以尋找空格
    const fullStoryText = currentStory.translations.map(t => t.text).join(' ');

    // 找出第一個空格 ID
    let firstBlankId = null;
    fullStoryText.split(/(\{.*?\})/).forEach((part, idx) => {
        if (part.startsWith('{') && part.endsWith('}') && firstBlankId === null) {
            firstBlankId = idx;
        }
    });

    state.story.selectedBlank = firstBlankId;
    render();
}

function stopStoryTimer() {
    if (state.story.timerInterval) {
        clearInterval(state.story.timerInterval);
        state.story.timerInterval = null;
    }
}

function stopStoryQuiz() {
    stopStoryTimer();
    state.story.quizStatus = 'idle';
    state.story.timer = 0;
    state.story.filledBlanks = {};
    state.story.selectedBlank = null;
    state.story.consecutiveErrors = 0;
    render();
}
// 格式化時間 mm:ss
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}
function selectStoryBlank(id) {
    if (state.story.filledBlanks[id]) return;
    state.story.selectedBlank = id;
    render();
}

function fillStoryBlank(userWord) {
    // 1. 防呆檢查
    if (state.story.selectedBlank === null) return;

    // --- 防亂按機制 (連續點擊同一個按鈕超過 3 次) ---
    // 判斷是否跟上一次點擊的單字相同
    if (userWord === state.story.lastClickedWord) {
        state.story.sameWordClickCount = (state.story.sameWordClickCount || 0) + 1;
    } else {
        // 如果點了不同的字，重置計數
        state.story.lastClickedWord = userWord;
        state.story.sameWordClickCount = 1;
    }

    // 如果連續點同一個字超過 3 次 (即第 4 次)
    if (state.story.sameWordClickCount > 3) {
        showBoringCooldown();           // 顯示無聊遮罩
        state.story.sameWordClickCount = 0; // 重置計數
        state.story.consecutiveErrors = 0;  // 重要：重置錯誤計數，避免回來後又馬上觸發休息
        return;                         // 阻擋執行
    }
    // -----------------------------------------------------

    // 找出目前的故事 (需與 renderStory 的篩選邏輯一致)
	let effectiveUnits = [];
    if (state.filterMode === 'custom' && state.activeSetId) {
        const set = state.customSets.find(s => s.id === state.activeSetId);
        if (set) {
            const setWords = state.vocabulary.filter(w => set.wordIds.includes(w.id));
            effectiveUnits = [...new Set(setWords.map(w => w.unit))];
        }
    } else {
        effectiveUnits = state.selectedUnits;
    }
    const validStories = STORIES.filter(story => story.units.some(u => effectiveUnits.includes(u)));
    if (validStories.length === 0 || state.story.activeIndex >= validStories.length) return;
    const currentStory = validStories[state.story.activeIndex];

    // [修改重點] 動態組合完整文章
    const fullStoryText = currentStory.translations.map(t => t.text).join(' ');

    // 找出正確答案
    let correctWord = null;
    fullStoryText.split(/(\{.*?\})/).forEach((part, idx) => {
        if (idx === state.story.selectedBlank && part.startsWith('{') && part.endsWith('}')) {
            correctWord = part.slice(1, -1);
        }
    });

    if (!correctWord) return;

    if (userWord.toLowerCase() === correctWord.toLowerCase()) {
        // --- 答對 ---
        state.story.filledBlanks[state.story.selectedBlank] = correctWord;
        state.story.consecutiveErrors = 0;
        
        // [修改重點] 根據設定播放聲音
        if (state.story.options.feedbackAudio) {
            speak(correctWord);
        }

        const segments = fullStoryText.split(/(\{.*?\})/).map((part, idx) => {
            if (part.startsWith('{') && part.endsWith('}')) return { type: 'word', id: idx };
            return { type: 'text', id: idx };
        });

        const totalBlanks = segments.filter(s => s.type === 'word').length;
        const filledCount = Object.keys(state.story.filledBlanks).length;
        
        if (totalBlanks === filledCount) {
            // 全部完成
            state.story.showCelebration = true;
            state.story.quizStatus = 'finished'; // 設定狀態為完成
            stopStoryTimer(); // 停止計時
            
            // 重置選取，避免殘留
            state.story.selectedBlank = null;
            render();

            setTimeout(() => {
                state.story.showCelebration = false;
                render();
            }, 2000);
        } else {
            // 自動跳到下一個未填空格
            let nextBlankId = null;
            const wordSegments = segments.filter(s => s.type === 'word');
            
            // 1. 嘗試找後面的
            const currentIdxInWords = wordSegments.findIndex(s => s.id === state.story.selectedBlank);
            for (let i = currentIdxInWords + 1; i < wordSegments.length; i++) {
                if (!state.story.filledBlanks[wordSegments[i].id]) {
                    nextBlankId = wordSegments[i].id;
                    break;
                }
            }
            // 2. 如果後面都填滿了，從頭找
            if (nextBlankId === null) {
                for (let i = 0; i < currentIdxInWords; i++) {
                     if (!state.story.filledBlanks[wordSegments[i].id]) {
                        nextBlankId = wordSegments[i].id;
                        break;
                    }
                }
            }

            state.story.selectedBlank = nextBlankId;
            render();
        }

    } else {
        // --- 答錯 ---
        
        // [修改重點] 根據設定播放聲音
        if (state.story.options.feedbackAudio) {
            speak(userWord);
        }

        state.story.consecutiveErrors = (state.story.consecutiveErrors || 0) + 1;
        
        // 檢查是否連續錯誤達 5 次
        if (state.story.consecutiveErrors >= 5) {
             
             // [修改重點] 立即重置計數，避免無限迴圈
             state.story.consecutiveErrors = 0;

             showConfirmModal(
                "休息一下", 
                "您似乎遇到了一些困難，<br>建議先回到閱讀模式複習一下喔！", 
                () => {
                    // 按下確定後的動作
                    stopStoryTimer(); 
                    state.story.quizStatus = 'idle';
                    state.story.filledBlanks = {};
                    state.story.selectedBlank = null;
                    state.story.mode = 'read';
                    render();
                },
                "好的，去複習" 
            );
            return;
        }

        // 錯誤回饋動畫
        state.story.errorBlank = state.story.selectedBlank;
        render();
        setTimeout(() => {
            state.story.errorBlank = null;
            render();
        }, 800);
    }
}


function resetStoryQuiz() {
    state.story.filledBlanks = {};
    state.story.selectedBlank = null;
    state.story.consecutiveErrors = 0;
    render();
}

// --- STATE UPDATERS (Generic) ---
function setState(key, value) {
    if (key === 'view') {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        state.audio.isPlaying = false;
        state.audio.lastText = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }    
    state[key] = value;
    render();
}
function toggleVocabCheck(id) {
    state.vocabulary = state.vocabulary.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
    );
    render();
}

function toggleAllVocabCheck(checked) {
    let targets = [];
    if (state.filterMode === 'custom' && state.activeSetId) {
        const set = state.customSets.find(s => s.id === state.activeSetId);
        if (set) targets = state.vocabulary.filter(w => set.wordIds.includes(w.id));
    } else {
        targets = state.vocabulary.filter(w => state.selectedUnits.includes(w.unit));
    }

    const ids = targets.map(w => w.id);
    state.vocabulary = state.vocabulary.map(item => 
        ids.includes(item.id) ? { ...item, checked: checked } : item
    );
    render();
}

function setPaginationMode(mode) {
    state.pagination.mode = mode;
    state.pagination.currentPage = 1; 
    render();
}

function changePage(delta) {
    state.pagination.currentPage += delta;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSortOrder() {
    state.sortOrder = state.sortOrder === 'default' ? 'alpha' : 'default';
    render();
}

function toggleListMode() {
    state.listMode = state.listMode === 'full' ? 'compact' : 'full';
    render();
}

function toggleListColumn(colId) {
    if (state.listColumns.includes(colId)) {
        state.listColumns = state.listColumns.filter(c => c !== colId);
    } else {
        const defaultOrder = ['check', 'remove', 'num', 'word', 'kk', 'part', 'other', 'def'];
        
        const currentSet = new Set([...state.listColumns, colId]);
        
        state.listColumns = defaultOrder.filter(c => currentSet.has(c));
    }
    render();
    
    setTimeout(() => {
        const dropdown = document.getElementById('col-dropdown');
        if (dropdown) dropdown.classList.remove('hidden');
    }, 0);
}
function getRandomEmoji() {
    if (typeof EMOJIS !== 'undefined' && EMOJIS.length > 0) {
        return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    }
    return '🌟';
}


// --- Global Keyboard Listener ---
function initKeyboardListener() {
    document.addEventListener('keydown', (e) => {
        // 1. 檢查是否有開啟任何視窗 (防止與依序模式的輸入框衝突)
        if (document.querySelector('.input-modal-overlay') || document.querySelector('.modal-overlay') || 
            document.getElementById('cooldown-overlay')) {
            return;
        }

        // 2. 檢查是否在測驗頁面
        if (!state.view.startsWith('quiz') || state.quiz.questions.length === 0 || state.quiz.isFinished) return;

        const currentQ = state.quiz.questions[state.quiz.currentIndex];
        
        // --- 狀況 A: 四選一 (包含 英選中, 填空, 中選英的選擇模式) ---
        if (state.quiz.status === 'answering' && 
           (state.quiz.mode !== 'cn-en' || state.quiz.subMode === 'choice') &&
           (state.quiz.mode !== 'sentence' || state.quiz.subMode === 'choice')) {
            
            const key = e.key.toLowerCase();
            
            // 修改重點：同時支援三組按鍵
            const keyMap = {
                // 數字鍵
                '1': 0, '2': 1, '3': 2, '4': 3, 
                // 左手鍵 (顯示在畫面上)
                'e': 0, 'r': 1, 'd': 2, 'f': 3,
                // 右手鍵 (隱藏功能)
                'u': 0, 'i': 1, 'j': 2, 'k': 3  
            };

            // 檢查是否在映射表中
            if (keyMap.hasOwnProperty(key)) {
                const index = keyMap[key];
                // 確保選項存在
                if (currentQ.options && currentQ.options[index]) {
                    handleAnswer(currentQ.options[index].id);
                }
            }
        }

        // --- 狀況 B: 拼字模式 (僅 中選英 - spell) ---
        if (state.quiz.status === 'answering' && 
            state.quiz.mode === 'cn-en' && state.quiz.subMode === 'spell') {
            const char = e.key.toLowerCase();
            if (/^[a-z]$/.test(char)) {
                const btn = state.quiz.spelling.letterPool.find(item => item.char.toLowerCase() === char);
                if (btn) {
                    checkSpellingInput(btn.char, btn.id);
                }
            }
        }

        // --- 狀況 D: 排序模式 (僅 填空題 - order) [新增] ---
        if (state.quiz.status === 'answering' && 
            state.quiz.mode === 'sentence' && state.quiz.subMode === 'order') {
            
            const num = parseInt(e.key);
            // 檢查是否為數字鍵 1-9
            if (!isNaN(num) && num >= 1 && num <= 9) {
                const index = num - 1;
                const pool = state.quiz.ordering.wordPool;
                
                // 檢查該索引是否有對應的單字按鈕
                if (pool && pool[index]) {
                    const item = pool[index];
                    checkOrderingInput(item.text, item.id);
                }
            }
        }
        
        // --- 狀況 C: 結果頁面 (Result State) ---
        if (state.quiz.status === 'result') {
            
            // 修改重點：只允許 Enter 或 空白鍵 (Space)
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); // 重要：防止按下空白鍵時網頁往下滑動
                
                // 無論是填空題(需手動)或其他模式(加速跳過倒數)，都執行下一題
                nextQuestion();
            }
        }
    });
}


// --- Global Click Listener (處理點擊外部關閉選單) ---
function initGlobalClickListener() {
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('col-dropdown');
        // 如果選單存在且是開啟狀態 (沒有 hidden class)
        if (dropdown && !dropdown.classList.contains('hidden')) {
            // 關閉選單
            dropdown.classList.add('hidden');
        }
    });
}

const originalInit = init;
init = function() {
    originalInit();
    initKeyboardListener();
	initGlobalClickListener();
};

// Start
init();