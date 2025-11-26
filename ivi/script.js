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
    listColumns: ['check', 'num', 'word', 'kk', 'part', 'def', 'other'],
    highlightVowels: true,
    pagination: {
        mode: 'unit', // 'unit', '50', '100', 'all'
        currentPage: 1
    },
    
    // Quiz & Story (保持原樣)
	quiz: {
        questions: [],
        currentIndex: 0,
        score: 0,
        wrongQuestions: [],
        status: 'answering',
        selectedOption: null,
        isFinished: false,
        mode: '',
        subMode: 'choice', // 'choice' (四選一) 或 'spell' (拼字)
		spellingDifficulty: 5, 
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
		options: {
            showEnglish: true,
            showTranslation: true // 預設顯示翻譯，也可設為 false
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
    // 阻止事件冒泡 (如果是由按鈕觸發)
    const event = window.event;
    if(event) event.stopPropagation();

    const set = state.customSets.find(s => s.id === id);
    if (!set) return;

    showConfirmModal(
        "刪除學習集",
        `確定要刪除「${set.name}」嗎？<br>此動作無法復原。`,
        () => {
            state.customSets = state.customSets.filter(s => s.id !== id);
            
            // 如果刪除的是當前選中的，回到預設模式
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

    // 加入並去重
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
    render(); // 重新渲染列表以移除該項目
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
    updateNavActiveState();
}

// --- HOME VIEW ---
function renderHome() {
    const container = document.createElement('div');
    container.className = "flex flex-col items-center justify-start w-full max-w-2xl min-h-[80vh] px-4 pt-6 pb-10"; 
    
    // 1. 頂部標題
    const headerHTML = `
        <div class="w-full mb-4 pl-1">
            <h1 class="text-3xl font-extrabold text-gray-800 tracking-tight">Let's Learn!</h1>
        </div>
    `;

    // 2. 分頁切換器
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
    let floatingBtnHTML = '';

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

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-48">
                    ${unitsHTML}
                </div>
            </div>
        `;

		floatingBtnHTML = `
		<div id="home-floating-container" class="fixed bottom-[65px] left-0 right-0 z-50 px-6 pt-12 pb-4 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent flex justify-center pointer-events-none transition-all duration-300 ease-in-out">
					<button onclick="startLearning('default')" class="pointer-events-auto w-full max-w-md bg-indigo-600 text-white h-14 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 transform translate-y-0">
						<span>開始學習</span>
						<i class="fas fa-arrow-right animate-pulse"></i>
					</button>
		</div>
`;



    // --- TAB 2: 自訂學習集 (已修改) ---
} else {
        const hasSets = state.customSets.length > 0;
        let setsHTML = '';
        
        if (!hasSets) {
            // ... (無學習集時的顯示保持不變) ...
            setsHTML = '';
        } else {
            setsHTML = state.customSets.map(set => {
                const isSelected = state.activeSetId === set.id;
                const isEmpty = set.wordIds.length === 0;
                
                // --- 樣式與互動邏輯修正 ---
                let borderClass = '';
                let iconColor = '';
                let textColor = '';
                let countColor = '';
                let clickAction = ''; // 預設無點擊動作
                let cursorClass = 'cursor-default'; // 預設無游標反應

                if (isEmpty) {
                    // [空集合]: 灰色、無點擊事件、無 Hover 邊框變色
                    borderClass = 'bg-gray-100 border-gray-200 border-2'; 
                    iconColor = 'text-gray-400';
                    textColor = 'text-gray-500';
                    countColor = 'text-gray-400';
                    clickAction = ''; // ★ 關鍵：空集合沒有 onclick
                    cursorClass = 'cursor-default'; // ★ 關鍵：游標不變手型
                } else {
                    // [一般集合]: 正常樣式、可點擊
                    borderClass = isSelected 
                        ? 'bg-indigo-50 border-indigo-600 border-2 shadow-sm' 
                        : 'bg-white border-gray-200 border-2 hover:border-indigo-300 hover:bg-gray-50';
                    iconColor = isSelected ? 'text-indigo-600' : 'text-amber-400';
                    textColor = isSelected ? 'text-indigo-900' : 'text-gray-800';
                    countColor = isSelected ? 'text-indigo-500' : 'text-gray-400';
                    clickAction = `onclick="selectCustomSet('${set.id}')"`; // ★ 正常集合才有 onclick
                    cursorClass = 'cursor-pointer'; // ★ 正常集合游標變手型
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
                                 <button onclick="openRenameSetModal('${set.id}', '${set.name}'); event.stopPropagation();" class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-black/5 rounded-lg transition-colors" title="重新命名">
                                    <i class="fas fa-pen text-xs"></i>
                                 </button>
                                 <button onclick="deleteCustomSet('${set.id}'); event.stopPropagation();" class="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-black/5 rounded-lg transition-colors" title="刪除">
                                    <i class="fas fa-trash text-xs"></i>
                                 </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 修改後的 Grid (與 Unit 相同: grid-cols-2 sm:grid-cols-3)
        // 並將建立按鈕的高度設為 h-28 以匹配新的卡片高度
        contentHTML = `
            <div class="w-full">
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-48">
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

        // 檢查選中的集合是否為空
        let isSetEmpty = false;
        if (state.activeSetId) {
            const activeSet = state.customSets.find(s => s.id === state.activeSetId);
            if (activeSet && activeSet.wordIds.length === 0) {
                isSetEmpty = true;
            }
        }
        
        // 按鈕狀態邏輯：如果沒選 OR 選中的是空的，都 Disable
        const isBtnDisabled = !state.activeSetId || isSetEmpty;
        const btnText = isSetEmpty ? '此學習集是空的' : '進入單字表';
        const btnBgClass = isBtnDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-900';

        floatingBtnHTML = `
            <div class="fixed bottom-[65px] left-0 right-0 z-50 px-6 pt-12 pb-4 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent flex justify-center pointer-events-none">
                 <button onclick="startLearning('custom')" class="pointer-events-auto w-full max-w-md text-white h-14 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${btnBgClass} active:scale-95 disabled:transform-none disabled:shadow-none" ${isBtnDisabled ? 'disabled' : ''}>
                    <span>${btnText}</span>
                    ${!isSetEmpty ? '<i class="fas fa-list-ul"></i>' : '<i class="fas fa-ban"></i>'}
                </button>
            </div>
        `;
    }

    container.innerHTML = headerHTML + tabHTML + contentHTML + floatingBtnHTML;
    appRoot.appendChild(container);
}

// --- LIST VIEW ---
function renderList() {
    // 1. 根據 FilterMode 篩選資料
    let allWords = [];
    let listTitle = "";

    if (state.filterMode === 'custom' && state.activeSetId) {
        const set = state.customSets.find(s => s.id === state.activeSetId);
        if (set) {
            allWords = state.vocabulary.filter(w => set.wordIds.includes(w.id));
            listTitle = `📘 ${set.name}`;
        } else {
            // Fallback: 若找不到 Set，回退到預設模式
            state.filterMode = 'default';
            allWords = state.vocabulary.filter(w => state.selectedUnits.includes(w.unit));
            listTitle = "單字學習 (預設)";
        }
    } else {
        // Default Mode
        allWords = state.vocabulary.filter(w => state.selectedUnits.includes(w.unit));
        listTitle = "單字學習";
    }

    // 2. 排序
    if (state.sortOrder === 'alpha') {
        allWords.sort((a, b) => a.word.localeCompare(b.word));
    } else {
        allWords.sort((a, b) => a.id - b.id);
    }

    // 3. 分頁邏輯
    let displayWords = [];
    let totalPages = 1;
    let pageInfo = "";
    const mode = state.pagination.mode; // 'unit', '50', '100', 'all'
    let currentPage = state.pagination.currentPage;

    // 計算分頁偏移量 (用於序號顯示)
    let seqOffset = 0;

    if (mode === 'all') {
        displayWords = allWords;
        totalPages = 1;
        currentPage = 1;
        pageInfo = `共 ${allWords.length} 個單字`;
        seqOffset = 0;
    } else if (mode === 'unit') {
        // 單元分頁模式：找出目前資料涵蓋的所有 Unit
        const distinctUnits = [...new Set(allWords.map(w => w.unit))].sort((a, b) => a - b);
        totalPages = distinctUnits.length;
        
        if (totalPages === 0) {
            currentPage = 1;
            pageInfo = "無資料";
        } else {
            if (currentPage > totalPages) currentPage = 1;
            if (currentPage < 1) currentPage = 1;
            
            // 更新狀態
            state.pagination.currentPage = currentPage;
            
            const currentUnit = distinctUnits[currentPage - 1];
            displayWords = allWords.filter(w => w.unit === currentUnit);
            pageInfo = `Unit ${currentUnit}`;
            // 在 Unit 模式下，每個 Unit 從 1 開始編號，或是接續？
            // 這裡採用「該頁面從 1 開始」，若要連續需要額外計算累積量，通常 Unit 視為獨立章節，從 1 開始較合理。
            seqOffset = 0; 
        }
    } else {
        // 數字分頁模式 (50, 100)
        const pageSize = parseInt(mode);
        totalPages = Math.ceil(allWords.length / pageSize);
        
        if (currentPage > totalPages) currentPage = 1;
        if (currentPage < 1 && totalPages > 0) currentPage = 1;
        
        state.pagination.currentPage = currentPage;
        
        const startIndex = (currentPage - 1) * pageSize;
        displayWords = allWords.slice(startIndex, startIndex + pageSize);
        pageInfo = `第 ${currentPage} 頁`;
        
        // 設定序號偏移量 (例如第2頁，每頁50，則從 50 開始 + 1)
        seqOffset = startIndex;
    }

    // Header Checkbox 狀態計算
    const isAllChecked = displayWords.length > 0 && displayWords.every(w => w.checked);
    
    // --- Render Start ---
    const container = document.createElement('div');
    container.className = "pb-48 w-full max-w-6xl mx-auto px-4";

    // Top Pagination Controls
    let topPaginationHTML = '';
    if (totalPages > 1) {
        topPaginationHTML = `
            <div class="flex items-center gap-3">
                <button onclick="changePage(-1)" class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-indigo-500 transition-colors ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-white text-indigo-200'}" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left text-xs"></i></button>
                <span class="font-mono text-indigo-100 text-sm">${currentPage} / ${totalPages}</span>
                <button onclick="changePage(1)" class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-indigo-500 transition-colors ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:text-white text-indigo-200'}" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right text-xs"></i></button>
            </div>
        `;
    }

    // List Header (Toolbar)
    const header = document.createElement('div');
    header.className = "bg-indigo-600 text-white p-4 md:p-6 rounded-b-3xl shadow-lg mb-6 -mx-4 md:mx-0 md:rounded-3xl";
    header.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
           <div class="flex flex-col">
               <h2 class="text-2xl font-bold truncate max-w-[200px] md:max-w-md">${listTitle}</h2>
               ${state.filterMode === 'custom' ? `<span class="text-xs text-indigo-200 bg-indigo-800/50 px-2 py-0.5 rounded w-fit mt-1">自訂學習集模式</span>` : ''}
           </div>

           <div class="flex flex-wrap justify-center items-center gap-2">
                <button onclick="toggleListMode()" class="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-sm transition-colors border border-indigo-500">
                    <i class="fas ${state.listMode === 'full' ? 'fa-list' : 'fa-th'}"></i>
                    <span>${state.listMode === 'full' ? '精簡' : '完整'}</span>
                </button>

                <div class="relative">
                    <select onchange="setPaginationMode(this.value)" class="appearance-none bg-indigo-700 hover:bg-indigo-500 text-white pl-3 pr-8 py-1.5 rounded-lg text-sm font-bold outline-none cursor-pointer transition-colors border border-indigo-500">
                        <option value="unit" ${mode === 'unit' ? 'selected' : ''}>單元分頁</option>
                        <option value="50" ${mode === '50' ? 'selected' : ''}>每頁 50</option>
                        <option value="100" ${mode === '100' ? 'selected' : ''}>每頁 100</option>
                        <option value="all" ${mode === 'all' ? 'selected' : ''}>顯示全部</option>
                    </select>
                    <div class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-200 text-xs"><i class="fas fa-chevron-down"></i></div>
                </div>
               
                <button onclick="toggleSortOrder()" class="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-sm transition-colors border border-indigo-500">
                    <i class="fas ${state.sortOrder === 'default' ? 'fa-sort-alpha-down' : 'fa-sort-numeric-down'}"></i>
                </button>

                <button onclick="toggleVowelMode()" class="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-sm transition-colors border border-indigo-500" title="切換母音紅字">
                    <i class="fas fa-font ${state.highlightVowels ? 'text-red-300' : 'text-indigo-300'}"></i>
                </button>
           </div>
        </div>
        
        <div class="flex justify-between items-center bg-indigo-800/30 px-4 py-2 rounded-lg min-h-[40px]">
            <span class="text-indigo-100 text-sm font-medium">${pageInfo}</span>
            ${topPaginationHTML}
        </div>
    `;
    container.appendChild(header);

    // List Body Container
const listContainer = document.createElement('div');
    
    if (displayWords.length === 0) {
        listContainer.innerHTML = `<div class="text-center py-10 text-gray-500">本頁無資料</div>`;
    } else if (state.listMode === 'compact') {
        // --- Compact View (Table) ---
        listContainer.className = "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 overflow-x-auto";
        
        // Table Header
        const headerRow = document.createElement('div');
        headerRow.className = "flex bg-gray-50 p-2 border-b border-gray-200 gap-2 select-none min-w-[800px]";
        
        const checkIcon = isAllChecked ? 'fa-check-square text-indigo-600' : 'fa-square text-gray-400';
        
        // ★ 修改 1: 在 colLabels 和 colWidths 加入 remove 的定義
        const colLabels = { 
            check: `<i class="far ${checkIcon} text-lg cursor-pointer hover:text-indigo-500" onclick="event.stopPropagation(); toggleAllVocabCheck(${!isAllChecked})"></i>`,
            num: '編號', word: '單字', kk: 'KK', part: '詞性', def: '中文定義', other: '變化形',
            remove: '移除' // 新增
        };
        const colWidths = { 
            check: 'w-12', num: 'w-12', word: 'w-40', kk: 'w-28', part: 'w-14', 
            def: 'flex-1', other: 'w-48', remove: 'w-16' // 新增
        };

        state.listColumns.forEach(col => {
            // 防呆：如果切換回 default 模式但 state 還有 remove，則跳過 (雙重保險)
            if (col === 'remove' && state.filterMode !== 'custom') return;

            const cell = document.createElement('div');
            let alignClass = (col === 'check' || col === 'remove') ? 'justify-center text-center' : 'justify-start text-left pl-2';
            
            cell.className = `${colWidths[col]} font-bold text-gray-500 text-sm py-2 rounded flex items-center gap-1 ${alignClass} flex-shrink-0 cursor-move hover:bg-gray-100 transition-colors`;
            
            // Drag Grip
            if (col === 'check') {
                cell.innerHTML = colLabels[col];
            } else {
                cell.innerHTML = `<i class="fas fa-grip-lines-vertical text-gray-300 text-xs"></i> ${colLabels[col]}`;
            }

            // Drag Events
            cell.draggable = true;
            cell.ondragstart = (e) => e.dataTransfer.setData('text/plain', col);
            cell.ondragover = (e) => e.preventDefault();
            cell.ondrop = (e) => handleDrop(e, col);

            headerRow.appendChild(cell);
        });
        
        // ★ 刪除：原本這裡手動加入 Action Column 的程式碼已移除
        
        listContainer.appendChild(headerRow);

        // Table Rows
        displayWords.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = "flex items-center p-2 hover:bg-indigo-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0 gap-2 min-w-[800px]";
            row.onclick = () => speak(item.word);

            const displayNum = seqOffset + index + 1;

            state.listColumns.forEach(col => {
                // 防呆
                if (col === 'remove' && state.filterMode !== 'custom') return;

                let cellHTML = '';
                switch(col) {
                    case 'check':
                        cellHTML = `<div class="w-12 text-center flex-shrink-0" onclick="event.stopPropagation(); toggleVocabCheck(${item.id})">
                            <i class="far ${item.checked ? 'fa-check-square text-indigo-600' : 'fa-square text-gray-300'} text-xl"></i>
                        </div>`;
                        break;
                    case 'num': 
                        // ★ 修改 2: 修正左邊界 (pl-4 -> pl-2)
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
                    // ★ 修改 3: 新增 remove case
                    case 'remove':
                         cellHTML = `<div class="w-16 text-center flex-shrink-0"><button onclick="event.stopPropagation(); removeWordFromSet('${state.activeSetId}', ${item.id})" class="text-gray-300 hover:text-red-500 transition-colors p-2"><i class="fas fa-trash-alt"></i></button></div>`;
                         break;
                }
                row.innerHTML += cellHTML;
            });

            // ★ 刪除：原本這裡手動加入 Remove Button 的程式碼已移除

            listContainer.appendChild(row);
        });
    } else {
        // --- Full (Card) View ---
        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 gap-4 mb-6";
        displayWords.forEach(item => {
            const card = document.createElement('div');
            card.className = "bg-white p-0 rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-2 relative group";
            
            let removeBtnHTML = '';
            if (state.filterMode === 'custom') {
                removeBtnHTML = `<button onclick="event.stopPropagation(); removeWordFromSet('${state.activeSetId}', ${item.id})" class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-full transition-colors z-20"><i class="fas fa-trash-alt text-sm"></i></button>`;
            }

            const highlightedSentence = highlightTargetWord(item.sentence, item.word, item.other);

            // ★ 修改 4: 修正卡片模式左邊界 (pl-10 -> pl-5)
            card.innerHTML = `
                ${removeBtnHTML}
                <div class="relative p-5 cursor-pointer group flex flex-col justify-center pl-5" onclick="speak('${item.word}')">
                    <div class="flex items-baseline flex-wrap gap-2 mb-2 pr-4">
                        <span class="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded">U${item.unit}</span>
                        <span class="text-2xl sm:text-3xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors break-all">${formatDisplayWord(item.word)}</span>
                        <span class="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded-md">${item.kk}</span>
                        <span class="text-sm font-semibold text-indigo-500 italic">${item.part}</span>
                        ${item.other ? `<span class="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200 ml-1 cursor-pointer" onclick="event.stopPropagation(); speak('${item.other.replace(/'/g, "\\'")}')"><i class="fas fa-code-branch text-xs mr-1 opacity-50"></i>${formatDisplayWord(item.other)}</span>` : ''}
                    </div>
                    <p class="text-gray-600 text-lg font-medium">${item.def}</p>
                </div>
                <div class="p-5 border-t md:border-t-0 md:border-l border-gray-100 bg-gray-50/50 cursor-pointer hover:bg-indigo-50 transition-colors flex flex-col justify-center" onclick="speak('${item.sentence.replace(/'/g, "\\'")}')">
                    <p class="text-gray-800 text-base font-medium leading-relaxed">${highlightedSentence} <span class="inline-block ml-2 text-indigo-400"><i class="fas fa-volume-up"></i></span></p>
                    <p class="text-gray-500 text-sm mt-1">${item.senTrans}</p>
                </div>
            `;
            grid.appendChild(card);
        });
        listContainer.appendChild(grid);
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
    // 讓 FAB 在 Compact 模式下出現，方便大量操作
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

/**
 * 通用的客製化輸入對話框
 * @param {string} title - 標題
 * @param {string} defaultValue - 預設文字
 * @param {string} placeholder - 提示文字
 * @param {function} onConfirm - 確認後的回呼函式 (接收輸入的字串)
 */
function showInputModal(title, defaultValue, placeholder, onConfirm) {
    // 建立 Overlay
    const overlay = document.createElement('div');
    overlay.className = "fixed inset-0 z-[150] flex items-center justify-center input-modal-overlay p-4 animate-fade-in";
    
    // 建立 Modal 本體
    const modal = document.createElement('div');
    modal.className = "bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in transform transition-all";
    
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

/**
 * 通用的確認對話框
 * @param {string} title - 標題
 * @param {string} message - 訊息內容
 * @param {function} onConfirm - 確認後的回呼函式
 * @param {string} confirmText - 確認按鈕文字 (預設: 確定)
 * @param {string} confirmColor - 確認按鈕顏色 class (預設: bg-indigo-600)
 */
function showConfirmModal(title, message, onConfirm, confirmText = "確定", confirmColor = "bg-indigo-600") {
    const overlay = document.createElement('div');
    overlay.className = "fixed inset-0 z-[150] flex items-center justify-center input-modal-overlay p-4 animate-fade-in";
    
    const modal = document.createElement('div');
    modal.className = "bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in transform transition-all";
    
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
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
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

function openAddToSetModal() {
    // 1. Get Checked Words
    let candidates = [];
    if (state.filterMode === 'custom' && state.activeSetId) {
         const set = state.customSets.find(s => s.id === state.activeSetId);
         candidates = state.vocabulary.filter(w => set.wordIds.includes(w.id) && w.checked);
    } else {
         candidates = state.vocabulary.filter(w => state.selectedUnits.includes(w.unit) && w.checked);
    }

    if (candidates.length === 0) {
        // 使用 toast 替代 alert，體驗更好
        showToast("請先勾選至少一個單字！"); 
        return;
    }

    const idsToAdd = candidates.map(w => w.id);

    // 2. Create Modal HTML
    const overlay = document.createElement('div');
    overlay.className = "fixed inset-0 z-[100] flex items-center justify-center modal-overlay p-4 animate-fade-in";
    
    const modal = document.createElement('div');
    modal.className = "bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden modal-content animate-scale-in";
    
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
            // [修改點] 這裡改用自訂的 showInputModal，而不是 prompt
            // 我們暫時隱藏原本的 modal 或是讓 Input Modal 疊在上面 (z-index 150 > 100)
            
            const defaultName = "我的單字集 " + (new Date().toLocaleDateString());
            
            showInputModal(
                "建立新學習集", 
                defaultName, 
                "請輸入名稱...", 
                (name) => {
                    // Confirm Callback
                    const newSet = createCustomSet(name.trim(), idsToAdd);
                    showToast(`已建立並加入「${newSet.name}」`);
                    window.closeModal(); // 關閉選擇視窗
                    render(); // 重新渲染以更新 UI
                }
            );
        } else {
            addWordsToSet(targetId, idsToAdd);
            window.closeModal();
        }
    };
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
        
        // ★ 新增這一行：切換 body 的 class，讓 CSS 可以偵測狀態
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

// --- QUIZ LOGIC ---
function initQuiz(mode) {
    // 1. 重置基本測驗狀態
    state.quiz.mode = mode;
    state.quiz.currentIndex = 0;
    state.quiz.score = 0;
    state.quiz.isFinished = false;
    state.quiz.wrongQuestions = [];
    state.quiz.status = 'answering';
    state.quiz.selectedOption = null;

    // 確保 subMode 有預設值 (若尚未設定過)
    if (!state.quiz.subMode) state.quiz.subMode = 'choice';

    // 2. 決定資料來源 (篩選單字)
    let activeWords = [];
    
    // 判斷是否為「自訂學習集」模式
    if (state.filterMode === 'custom' && state.activeSetId) {
        const set = state.customSets.find(s => s.id === state.activeSetId);
        if (set) {
            // 找出 set 裡的單字，並且只選 checked (已勾選) 的
            activeWords = state.vocabulary.filter(w => set.wordIds.includes(w.id) && w.checked);
        }
    } else {
        // 預設模式：使用首頁勾選的 Unit
        activeWords = state.vocabulary.filter(w => state.selectedUnits.includes(w.unit) && w.checked);
    }
    
    // 若無單字則返回 (renderQuiz 會處理空狀態顯示)
    if (activeWords.length === 0) {
        state.quiz.questions = []; 
        return;
    }

    // 3. 產生題目 (根據模式)
    // 初始化 Emoji
    let currentEmoji = getRandomEmoji();

    if (mode === 'sentence') {
        // --- 句子填空模式 ---
        const validWords = activeWords.filter(w => w.sentence && w.sentence.length > 5);
        
        state.quiz.questions = shuffle([...validWords]).map((w, index) => {
            // 每 5 題換一個 Emoji
            if (index > 0 && index % 5 === 0) {
                currentEmoji = getRandomEmoji();
            }

            let usedWord = w.word; 
            const variations = w.other ? w.other.split('/').map(s => s.trim()).filter(s => s) : [];
            const candidates = [w.word, ...variations].sort((a, b) => b.length - a.length);
            let matched = false;
            let regex = null;

            // 嘗試在句子中比對單字 (包含變化形)
            for (const cand of candidates) {
                const re = new RegExp(`\\b${cand}\\b`, 'i');
                if (re.test(w.sentence)) {
                    usedWord = w.sentence.match(re)[0];
                    regex = re;
                    matched = true;
                    break;
                }
            }
            // 若精確比對失敗，嘗試模糊比對
            if (!matched) {
                const looseRe = new RegExp(`\\b${w.word}\\w*\\b`, 'i');
                if (looseRe.test(w.sentence)) {
                    usedWord = w.sentence.match(looseRe)[0];
                    regex = looseRe;
                } else {
                    regex = new RegExp(w.word, 'i');
                }
            }

            // 挖空處理 (用於選擇模式)
            const blankPlaceholder = '_______';
            const questionText = w.sentence.replace(regex, blankPlaceholder);
            
            // 產生選項 (混淆項從所有單字中隨機挑選)
            const others = shuffle(state.vocabulary.filter(cw => cw.id !== w.id)).slice(0, 3);
            const rawOptions = shuffle([w, ...others]);
            
            // 處理選項顯示文字 (盡量使用變化形以配合時態)
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
        // --- 一般選擇題 (中選英 / 英選中) ---
        state.quiz.questions = shuffle([...activeWords]).map((w, index) => {
            // 每 5 題換一個 Emoji
            if (index > 0 && index % 5 === 0) {
                currentEmoji = getRandomEmoji();
            }

            const others = shuffle(state.vocabulary.filter(cw => cw.id !== w.id)).slice(0, 3);
            const options = shuffle([w, ...others]);
            
            return { 
                target: w, 
                options, 
                emoji: currentEmoji 
            };
        });
    }

    // 4. ★ 特殊模式初始化 (拼字 / 排序)
    if (state.quiz.questions.length > 0) {
        // 如果是「中選英」且為「拼字模式」
        if (mode === 'cn-en' && state.quiz.subMode === 'spell') {
            initSpellingData(state.quiz.questions[0].target.word);
        }
        // 如果是「填空題」且為「排序模式」
        if (mode === 'sentence' && state.quiz.subMode === 'order') {
            initOrderingData(state.quiz.questions[0].target.sentence);
        }
    }
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
        if (synth.speaking) {
            synth.cancel();
            if (state.audio.lastText === text && state.audio.lastRate === rate) {
                state.audio.lastText = null;
                state.audio.lastRate = null;
                state.audio.isPlaying = false; 
                render(); 
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
        };
        utterance.onend = () => {
            if (state.audio.lastText === text) { // Simple check
                state.audio.isPlaying = false;
            }
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
            if(icon) icon.classList.add('scale-110', '-translate-y-1');
            if(text) {
                text.classList.remove('opacity-80');
                text.classList.add('opacity-100');
            }
        } else {
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
                <div class="text-center p-8 bg-white rounded-3xl shadow-lg w-full max-w-lg border-2 border-indigo-50 animate-scale-in">
                    <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">${pct > 0.65 ? "🎉" : "💪"}</div>
                    <h2 class="text-3xl font-bold text-gray-800 mb-2">測驗結束！</h2>
                    <p class="text-xl text-gray-600 mb-8">得分: <span class="text-indigo-600 font-bold text-4xl">${score}</span> / ${total}</p>
                    ${wrongQuestions.length > 0 ? `<button onclick="retryWrongQuestions()" class="w-full py-4 bg-orange-500 text-white rounded-xl font-bold shadow-lg hover:bg-orange-600 mb-4 flex items-center justify-center gap-2"><i class="fas fa-redo"></i> 練習答錯的 ${wrongQuestions.length} 題</button>` : ''}
                    <button onclick="setState('view', 'list')" class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700">返回列表</button>
                </div>
            </div>
        `;
        appRoot.appendChild(container);
        return;
    }

    const currentQ = questions[currentIndex];
    
    // 3. 頂部工具列
    let headerHTML = `
        <div class="flex flex-col items-center mb-6">
            <div class="w-full flex justify-between items-center text-sm font-medium text-gray-500 bg-gray-100 px-4 py-2 rounded-full shadow-inner">
                <span>進度: ${currentIndex + 1} / ${questions.length}</span>
                <div class="flex items-center gap-2">
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
        questionDisplayHTML = formatDisplayWord(currentQ.target.word);
        fontClass = "text-3xl md:text-4xl leading-tight text-center";
        breakClass = "break-all";
    } else {
        // --- 句子填空模式 (Speech Mode) ---
        let rawContent = "";
        
        if (subMode === 'order') {
            rawContent = currentQ.target.senTrans;
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
                    <div class="mt-4 p-4 rounded-xl text-center border ${resultClass} animate-fade-in noselect">
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

        // 簡潔置中版 HTML
        questionDisplayHTML = `
            <div class="flex items-center justify-center gap-4 w-full animate-fade-in mt-12 mb-2">
                <div class="flex-shrink-0 text-3xl select-none transform scale-x-[-1] cursor-pointer hover:scale-110 transition-transform opacity-90" onclick="speak('${currentQ.target.word}')">
                    ${currentQ.emoji}
                </div>
                <div class="font-bold text-gray-800 text-left cursor-pointer hover:text-indigo-600 transition-colors" onclick="speak('${currentQ.target.word}')">
                     ${rawContent}
                </div>
            </div>
        `;
    }

    // 難度按鈕 HTML
    let difficultySelectorHTML = '';
    if (mode === 'cn-en' && subMode === 'spell') {
        difficultySelectorHTML = `
             <div class="absolute top-4 left-4 z-20 flex items-center gap-1 bg-gray-100 rounded-lg p-1 shadow-inner">
                <span class="text-[10px] font-bold text-gray-400 px-1 select-none">按鈕數</span>
                <button onclick="setSpellingDifficulty('a')" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${spellingDifficulty === 'a' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}">a</button>
                <button onclick="setSpellingDifficulty(3)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${spellingDifficulty === 3 ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}">3</button>
                <button onclick="setSpellingDifficulty(4)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${spellingDifficulty === 4 ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}">4</button>
                <button onclick="setSpellingDifficulty(5)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${spellingDifficulty === 5 ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}">5</button>
             </div>
        `;
    } else if (mode === 'sentence' && subMode === 'order') {
        difficultySelectorHTML = `
             <div class="absolute top-4 left-4 z-20 flex items-center gap-1 bg-gray-100 rounded-lg p-1 shadow-inner">
                <span class="text-[10px] font-bold text-gray-400 px-1 select-none">按鈕數</span>
                <button onclick="setSentenceDifficulty(3)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${sentenceDifficulty === 3 ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}">3</button>
                <button onclick="setSentenceDifficulty(4)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${sentenceDifficulty === 4 ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}">4</button>
                <button onclick="setSentenceDifficulty(5)" class="w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold transition-all ${sentenceDifficulty === 5 ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}">5</button>
             </div>
        `;
    }

    // 模式切換 HTML
    let modeToggleHTML = '';
    if (mode === 'cn-en') {
        modeToggleHTML = `
             <div class="mode-toggle-pill">
                <button onclick="setQuizSubMode('choice')" class="mode-btn-small ${subMode === 'choice' ? 'active' : ''}"><i class="fas fa-list-ul"></i> 選擇</button>
                <button onclick="setQuizSubMode('spell')" class="mode-btn-small ${subMode === 'spell' ? 'active' : ''}"><i class="fas fa-keyboard"></i> 拼字</button>
             </div>
        `;
    } else if (mode === 'sentence') {
        modeToggleHTML = `
             <div class="mode-toggle-pill">
                <button onclick="setQuizSubMode('choice')" class="mode-btn-small ${subMode === 'choice' ? 'active' : ''}"><i class="fas fa-check-square"></i> 選擇</button>
                <button onclick="setQuizSubMode('order')" class="mode-btn-small ${subMode === 'order' ? 'active' : ''}"><i class="fas fa-sort"></i> 排序</button>
             </div>
        `;
    }

    const bigEmojiHTML = !isSpeechMode ? `
        <div onclick="speak('${currentQ.target.word}')" class="flex-shrink-0 w-24 h-24 md:w-24 md:h-24 flex items-center justify-center cursor-pointer hover:scale-105 transition-all active:scale-95 group mb-4 md:mb-0 md:absolute md:left-8 md:top-1/2 md:-translate-y-1/2 z-10 mt-8 md:mt-0">
             <div class="text-5xl filter drop-shadow-sm group-hover:scale-110 transition-transform">
                <span style="display:inline-block; transform: scaleX(-1);">${currentQ.emoji}</span>
             </div>
        </div>
    ` : '';

    headerHTML += `
        <div class="relative bg-white p-6 md:p-8 rounded-3xl shadow-sm mb-6 flex flex-col md:block items-center justify-center gap-6 border-b-4 border-indigo-100 min-h-[160px]">
             
             ${difficultySelectorHTML}
             ${modeToggleHTML}
             ${bigEmojiHTML}
              
              <div class="w-full flex flex-col items-center justify-center md:min-h-[120px] noselect">
                
                <h3 class="${fontClass} font-bold text-gray-800 w-full ${breakClass} ${!isSpeechMode ? 'px-4 md:px-32' : ''} noselect">
                    ${questionDisplayHTML}
                </h3>
                
                ${feedbackHTML}

                ${(mode === 'cn-en' && subMode === 'spell') ? `
                    <div class="spelling-display mt-4 w-full px-2 md:px-4 noselect">
                        ${state.quiz.spelling.revealedMask.map(char => {
                            if (char) return `<span class="text-indigo-600 border-b-4 border-indigo-200 px-2">${formatDisplayWord(char)}</span>`;
                            else return `<span class="text-gray-300 border-b-4 border-gray-200 px-2">_</span>`;
                        }).join('')}
                    </div>
                ` : ''}

                ${(mode === 'sentence' && subMode === 'order') ? `
                    <div class="ordering-display mt-4 w-full px-2 md:px-4 noselect">
                        ${state.quiz.ordering.revealedMask.map(word => {
                            if (word) return `<span class="ordering-slot filled">${word}</span>`;
                            else return `<span class="ordering-slot">____</span>`;
                        }).join(' ')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // 5. 選項/操作區域
    let optionsHTML = '';

    if (mode === 'cn-en' && subMode === 'spell') {
        // --- 拼字模式 ---
        optionsHTML = `
            <div class="letter-pool animate-fade-in noselect">
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
            <div class="word-pool animate-fade-in noselect">
                ${state.quiz.ordering.wordPool.map(item => `
                    <button id="order-btn-${item.id}" onclick="checkOrderingInput('${item.text.replace(/'/g, "\\'")}', ${item.id})" class="word-btn hover:bg-blue-100 active:scale-95 noselect">
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
        optionsHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${currentQ.options.map((opt, idx) => {
                let content = '';
                if (mode === 'sentence') content = formatDisplayWord(opt.displayText || opt.word);
                else if (mode === 'cn-en') content = formatDisplayWord(opt.word);
                else content = opt.def;
                
                return `
                <button onclick="handleAnswer(${opt.id})" class="p-6 rounded-xl text-xl font-medium border-2 bg-white border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700 active:scale-[0.98] shadow-sm hover:-translate-y-1 transition-all relative overflow-hidden break-all noselect">
                    <span class="key-hint">${idx + 1}</span>
                    ${content}
                </button>`;
            }).join('')}
        </div>`;
    } else {
         // --- 結果顯示 (Result State) ---
         
         // ★ 修改：如果是填空題 (sentence)，隱藏選項，顯示下一題按鈕
         if (mode === 'sentence' && subMode === 'choice') {
             optionsHTML = `<button onclick="nextQuestion()" class="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-transform active:scale-95 noselect">${currentIndex < questions.length - 1 ? '下一題' : '查看結果'} <i class="fas fa-chevron-right"></i></button>`;
         } else {
             // 其他模式 (如 CN-EN, EN-CN) 保持顯示變色後的選項
             optionsHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${currentQ.options.map((opt, idx) => {
                    let content = '';
                    if (mode === 'cn-en') content = formatDisplayWord(opt.word);
                    else content = opt.def;

                    let btnClass = "p-6 rounded-xl text-xl font-medium border-2 transition-all relative overflow-hidden break-all noselect ";
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
    const currentQ = state.quiz.questions[state.quiz.currentIndex];
    const option = currentQ.options.find(o => o.id === optionId);
    state.quiz.selectedOption = option;
    speak(currentQ.target.word);
    if (option.id === currentQ.target.id) state.quiz.score++;
    else state.quiz.wrongQuestions.push(currentQ.target);
    
    state.quiz.status = 'result';
    render();     
    
    if (state.quiz.mode !== 'sentence') {
        setTimeout(nextQuestion, 1000);
    }
}

function nextQuestion() {
    if (state.quiz.currentIndex < state.quiz.questions.length - 1) {
        state.quiz.currentIndex++;
        state.quiz.status = 'answering';
        state.quiz.selectedOption = null;
        
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

// 切換子模式 (四選一 / 拼字)
function setQuizSubMode(mode) {
    state.quiz.subMode = mode;
    // 切換模式時，如果是拼字模式，需要初始化當前題目的拼字資料
    if (mode === 'spell' && state.quiz.questions.length > 0) {
        initSpellingData(state.quiz.questions[state.quiz.currentIndex].target.word);
    }
    render();
}

// 設定拼字難度
function setSpellingDifficulty(num) {
    state.quiz.spellingDifficulty = num;
    // 如果當前有題目，立即重置該題的拼字資料以反映新難度
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
        // --- ★ 母音模式 (Vowel Mode) ---
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
        // --- ★ 數量模式 (Number Mode: 3, 4, 5) ---
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
        speak(inputChar); // 唸出字母
        
        // 1. 更新顯示文字
        state.quiz.spelling.revealedMask[nextIndex] = currentWord[nextIndex]; // 填入原本的大小寫
        
        // 2. 從 Pool 中移除該按鈕
        state.quiz.spelling.letterPool = state.quiz.spelling.letterPool.filter(item => item.id !== btnId);
        
        // 3. 計算下一個空格位置
        let newNextIndex = nextIndex + 1;
        // 跳過原本就已經顯示的尾字 (如果有的話)
        while (newNextIndex < currentWord.length && state.quiz.spelling.revealedMask[newNextIndex] !== null) {
            newNextIndex++;
        }
        state.quiz.spelling.nextIndex = newNextIndex;

        // 4. 檢查是否完成
        if (state.quiz.spelling.letterPool.length === 0) {
            // 完成！
            speak(state.quiz.spelling.currentWord);
            state.quiz.score++;
            state.quiz.status = 'result'; // 借用 result 狀態來顯示過場或直接下一題
            
            // 延遲一點點後進入下一題
            render();
            setTimeout(nextQuestion, 800);
        } else {
            render();
        }

    } else {
        // --- 答錯 ---
        // 觸發按鈕動畫
        const btn = document.getElementById(`spell-btn-${btnId}`);
        if (btn) {
            btn.classList.add('btn-error');
            // 動畫結束後移除 class
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

// 初始化單題排序資料
function initOrderingData(sentence) {
    // 1. 切割句子 (依空白切割，保留標點符號在單字內，較簡單)
    // 例如: "How are you?" -> ["How", "are", "you?"]
    const words = sentence.trim().split(/\s+/);
    const len = words.length;
    
    let revealed = new Array(len).fill(null);
    let pool = [];
    let buttonIndices = [];

    // 讀取設定
    const MAX_BUTTONS = state.quiz.sentenceDifficulty || 5;

    // 建立所有可能的索引
    let allIndices = [];
    for(let i=0; i<len; i++) allIndices.push(i);

    // ★ 規則：
    // 如果句子長度 <= 難度，全部挖空
    // 如果句子長度 > 難度，隨機挖空 MAX_BUTTONS 個，其餘直接顯示
    
    if (len <= MAX_BUTTONS) {
        buttonIndices = allIndices;
    } else {
        // 隨機洗牌
        const shuffled = allIndices.sort(() => 0.5 - Math.random());
        
        // 取出前 N 個作為「按鈕」 (挖空)
        buttonIndices = shuffled.slice(0, MAX_BUTTONS).sort((a,b) => a-b);
        
        // 剩下的直接顯示
        const indicesToReveal = shuffled.slice(MAX_BUTTONS);
        indicesToReveal.forEach(idx => {
            revealed[idx] = words[idx];
        });
    }

    // 建立按鈕池
    buttonIndices.forEach(idx => {
        pool.push({ text: words[idx], id: idx });
    });

    // 按鈕池隨機排序 (打亂順序)
    pool.sort(() => 0.5 - Math.random());

    // 計算 nextIndex
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
    const { targetWords, nextIndex } = state.quiz.ordering;
    const correctWord = targetWords[nextIndex];

    if (selectedWord.toLowerCase() === correctWord.toLowerCase()) {
        // --- 答對 ---
        speak(selectedWord);
        
        // 1. 更新顯示 (這裡填入 correctWord，保留原本句子的大小寫格式，比較美觀)
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
            // 完成
            speak(state.quiz.questions[state.quiz.currentIndex].target.sentence);
            state.quiz.score++;
            state.quiz.status = 'result';
            render();
            setTimeout(nextQuestion, 1000);
        } else {
            render();
        }

    } else {
        // --- 答錯 ---
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
    // ... (重用原邏輯) ...
    // 這裡為了簡潔直接重跑 init 邏輯的部分
    // 但因為 wrongQuestions 已經有了，我們直接用它
    const generateOptions = (w) => {
        const others = shuffle(state.vocabulary.filter(cw => cw.id !== w.id)).slice(0, 3);
        return shuffle([w, ...others]);
    };
    
    if (state.quiz.mode === 'sentence') {
         state.quiz.questions = shuffle([...wrongWords]).map(w => {
            // 簡化: 這裡省略了複雜的正則重建，實際使用建議封裝成 generateQuestion(w)
            // 這裡直接回退到簡單模式以避免報錯，或者你需要複製 initQuiz 的完整邏輯
            // 為求穩定，我們重新呼叫 initQuiz，但這會重置題目
            // 更好的做法是只針對錯題生成。
            // 這裡做一個簡單的 Fallback
             const others = shuffle(state.vocabulary.filter(cw => cw.id !== w.id)).slice(0, 3);
             return { 
                 target: w, 
                 text: w.sentence.replace(w.word, '_____'), // 簡單替換
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

    const segments = currentStory.text.split(/(\{.*?\})/).map((part, idx) => {
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
    
    const speakText = currentStory.text.replace(/[{}]/g, '').replace(/'/g, "\\'");
    const isPlayingThis = state.audio.isPlaying && state.audio.lastText === currentStory.text.replace(/[{}]/g, '');
    const currentRate = state.audio.lastRate;

    const normalBtnClass = (isPlayingThis && currentRate === 1) ? "bg-gray-700 text-white" : "bg-amber-100 text-amber-800 hover:bg-amber-200";
    const slowBtnClass = (isPlayingThis && currentRate === 0.7) ? "bg-gray-700 text-white" : "bg-green-100 text-green-800 hover:bg-green-200";
    
    const showEn = state.story.options.showEnglish;
    const showCn = state.story.options.showTranslation;

    // ★ 修改重點：將啟用狀態改為 淡藍色背景 (bg-indigo-100) 配 深色文字 (text-indigo-700)
    const enBtnClass = showEn 
        ? "bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold hover:bg-indigo-200" 
        : "bg-white text-gray-400 border border-gray-200 hover:bg-gray-50";
    const cnBtnClass = showCn 
        ? "bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold hover:bg-indigo-200" 
        : "bg-white text-gray-400 border border-gray-200 hover:bg-gray-50";

    let leftControlHTML = '';
    if (state.story.mode === 'read') {
        leftControlHTML = `
            <div class="flex items-center gap-2 w-full sm:w-auto">
                <span class="text-xs font-bold text-gray-400 mr-1">顯示:</span>
                <button onclick="toggleStoryOption('showEnglish')" class="flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 ${enBtnClass}">
                    <i class="fas fa-font"></i> <span class="hidden xs:inline">英文</span>
                </button>
                <button onclick="toggleStoryOption('showTranslation')" class="flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 ${cnBtnClass}">
                    <i class="fas fa-language"></i> <span class="hidden xs:inline">中文</span>
                </button>
            </div>
        `;
    } else {
        const showReset = state.story.quizStatus !== 'idle';
        leftControlHTML = `
            <div class="flex items-center gap-2">
                ${showReset ? `
                <button onclick="stopStoryQuiz()" class="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors active:scale-90" title="重新開始">
                    <i class="fas fa-times text-sm"></i>
                </button>` : ''}
                
                <div class="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 h-[30px]">
                    <i class="fas fa-stopwatch text-indigo-400 text-xs ${state.story.quizStatus === 'playing' ? 'animate-pulse' : ''}"></i>
                    <span id="quiz-timer-display" class="timer-badge font-bold text-indigo-600 text-xs min-w-[2.5rem] text-center">${formatTime(state.story.timer)}</span>
                </div>
            </div>
        `;
    }

    controls.innerHTML = `
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
            <div class="flex gap-2 p-1 bg-gray-100 rounded-xl mb-4">
                <button onclick="setStoryMode('read')" class="flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${state.story.mode === 'read' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">
                    <i class="far fa-eye"></i> 閱讀
                </button>
                <button onclick="setStoryMode('quiz')" class="flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${state.story.mode === 'quiz' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">
                    <i class="far fa-check-circle"></i> 填空
                </button>
            </div>

            <div class="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div class="w-full sm:w-auto flex justify-center sm:justify-start">
                    ${leftControlHTML}
                </div>
                <div class="flex gap-2 w-full sm:w-auto justify-end">
                    <button onclick="speak('${speakText}', 1)" class="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold transition-all h-[30px] ${normalBtnClass}">
                        <i class="fas ${isPlayingThis && currentRate === 1 ? 'fa-stop' : 'fa-volume-up'}"></i> 正常
                    </button>
                    <button onclick="speak('${speakText}', 0.7)" class="flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold transition-all h-[30px] ${slowBtnClass}">
                        <i class="fas ${isPlayingThis && currentRate === 0.7 ? 'fa-stop' : 'fa-volume-down'}"></i> 慢速
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
                // 個別設定優先於全域設定
                const isRevealed = state.story.revealedTrans[idx] !== undefined 
                    ? state.story.revealedTrans[idx] 
                    : state.story.options.showTranslation;
                
                const isEnBlurred = !state.story.options.showEnglish;
                
                return `
                <div class="sentence-card bg-white p-4 rounded-xl shadow-sm border border-gray-100 group hover:border-indigo-100">
                    <div class="flex items-start gap-3">
                        <button onclick="speak('${item.text.replace(/'/g, "\\'")}')" class="play-icon mt-1 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 flex-shrink-0" title="播放此句">
                            <i class="fas fa-volume-up text-sm"></i>
                        </button>
                        
                        <div class="flex-1">
                            <p class="text-lg leading-relaxed font-medium text-gray-800 cursor-pointer ${isEnBlurred ? 'text-blur' : ''}" onclick="speak('${item.text.replace(/'/g, "\\'")}')">
                                ${item.text.split(' ').map(word => {
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
			footer.innerHTML = `
				<div class="max-w-2xl mx-auto px-4"> 
					<div class="flex flex-wrap justify-center gap-2 pb-1">
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
        // 為了效能，我們可以選擇每秒只更新計時器 DOM，或者直接呼叫 render
        // 這裡為了簡單與一致性，我們直接更新 Timer 的 DOM 元素 (若存在)
        const timerEl = document.getElementById('quiz-timer-display');
        if (timerEl) {
            const mins = Math.floor(state.story.timer / 60).toString().padStart(2, '0');
            const secs = (state.story.timer % 60).toString().padStart(2, '0');
            timerEl.innerText = `${mins}:${secs}`;
        }
    }, 1000);

    // 3. 自動選取第一個空格
    // 透過 segments 找出第一個 type為 'word' 的 id
    // 為了拿到 segments，我們需要重新獲取當前故事 (邏輯同 renderStory)
    const set = state.customSets.find(s => s.id === state.activeSetId);
    let effectiveUnits = state.selectedUnits;
    if (state.filterMode === 'custom' && set) {
         const setWords = state.vocabulary.filter(w => set.wordIds.includes(w.id));
         effectiveUnits = [...new Set(setWords.map(w => w.unit))];
    }
    const validStories = STORIES.filter(story => story.units.some(u => effectiveUnits.includes(u)));
    const currentStory = validStories[state.story.activeIndex];
    
    // 找出第一個空格 ID
    let firstBlankId = null;
    currentStory.text.split(/(\{.*?\})/).forEach((part, idx) => {
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
    // 重置為待機狀態
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
    // ... (前段邏輯結束) ...

    // 找出正確答案
    let correctWord = null;
    currentStory.text.split(/(\{.*?\})/).forEach((part, idx) => {
        if (idx === state.story.selectedBlank && part.startsWith('{') && part.endsWith('}')) {
            correctWord = part.slice(1, -1);
        }
    });

    if (!correctWord) return;

    if (userWord.toLowerCase() === correctWord.toLowerCase()) {
        // --- 答對 ---
        state.story.filledBlanks[state.story.selectedBlank] = correctWord;
        state.story.consecutiveErrors = 0;
        speak(correctWord);

        const segments = currentStory.text.split(/(\{.*?\})/).map((part, idx) => {
            if (part.startsWith('{') && part.endsWith('}')) return { type: 'word', id: idx };
            return { type: 'text', id: idx };
        });

        const totalBlanks = segments.filter(s => s.type === 'word').length;
        const filledCount = Object.keys(state.story.filledBlanks).length;
        
        if (totalBlanks === filledCount) {
            // ★ 全部完成
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
            // ★ 自動跳到下一個未填空格
            // 邏輯：在 segments 中，從當前 selectedBlank 往後找，找到第一個是 word 且尚未 filled 的
            // 如果後面沒了，就從頭找 (循環)
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
        // --- 答錯 (保持原邏輯) ---
        speak(userWord);
        state.story.consecutiveErrors = (state.story.consecutiveErrors || 0) + 1;
        if (state.story.consecutiveErrors >= 5) {
             showCustomAlert("您似乎遇到了一些困難，<br>建議先回到閱讀模式複習一下喔！", () => {
                stopStoryTimer(); // 記得停止計時
                state.story.quizStatus = 'idle';
                state.story.filledBlanks = {};
                state.story.consecutiveErrors = 0;
                state.story.selectedBlank = null;
                state.story.mode = 'read';
                render();
            });
            return;
        }
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
    state[key] = value;
    render();
    if (key === 'view') window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleVocabCheck(id) {
    state.vocabulary = state.vocabulary.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
    );
    render();
}

function toggleAllVocabCheck(checked) {
    // 根據目前的 view items 來 toggle
    // 這裡需要重複 renderList 的篩選邏輯
    let targets = [];
    if (state.filterMode === 'custom' && state.activeSetId) {
        const set = state.customSets.find(s => s.id === state.activeSetId);
        if (set) targets = state.vocabulary.filter(w => set.wordIds.includes(w.id));
    } else {
        targets = state.vocabulary.filter(w => state.selectedUnits.includes(w.unit));
    }

    // 分頁邏輯應用 (只選當前頁面)
    // ... (為了簡便，這裡 toggle 所有篩選後的單字，或者您可以保留原本「只 toggle 當前頁」的邏輯)
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

function getRandomEmoji() {
    if (typeof EMOJIS !== 'undefined' && EMOJIS.length > 0) {
        return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    }
    return '🌟';
}

// --- Global Keyboard Listener ---
function initKeyboardListener() {
    document.addEventListener('keydown', (e) => {
        // 1. 檢查是否在測驗頁面
        if (!state.view.startsWith('quiz') || state.quiz.questions.length === 0 || state.quiz.isFinished) return;

        const currentQ = state.quiz.questions[state.quiz.currentIndex];
        
        // --- 狀況 A: 四選一 (包含 英選中, 填空, 中選英的選擇模式) ---
        if (state.quiz.status === 'answering' && 
           (state.quiz.mode !== 'cn-en' || state.quiz.subMode === 'choice')) {
            
            if (['1', '2', '3', '4'].includes(e.key)) {
                const index = parseInt(e.key) - 1;
                // 確保選項存在
                if (currentQ.options && currentQ.options[index]) {
                    handleAnswer(currentQ.options[index].id);
                }
            }
        }

        // --- 狀況 B: 拼字模式 (僅 中選英 的 spell 模式) ---
        if (state.quiz.mode === 'cn-en' && state.quiz.subMode === 'spell') {
            const char = e.key.toLowerCase();
            // 檢查是否為 a-z 字母
            if (/^[a-z]$/.test(char)) {
                // 在字母池中尋找符合的按鈕
                // 注意：可能有重複字母 (如 apple 的 p)，需找第一個存在的
                const btn = state.quiz.spelling.letterPool.find(item => item.char.toLowerCase() === char);
                
                if (btn) {
                    checkSpellingInput(btn.char, btn.id);
                } else {
                    // 如果字母是對的但已經按過了(不在池中)，或是錯誤字母
                    // 這裡可以選擇是否要給予錯誤回饋 (目前邏輯是按錯按鈕會搖晃)
                    // 若要模擬按錯鍵盤的錯誤回饋，可能需要更複雜的邏輯去尋找 DOM
                }
            }
        }
        
        // --- 狀況 C: 結果頁面按 Enter 下一題 ---
        if (state.quiz.status === 'result' && e.key === 'Enter') {
            if (state.quiz.mode !== 'sentence') { // 填空模式是自動下一題，其他模式可能有手動按鈕
                 // 檢查是否有下一題按鈕
                 nextQuestion();
            }
        }
    });
}

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
    
    render();
}
const originalInit = init;
init = function() {
    originalInit();
    initKeyboardListener();
};

// Start
init();