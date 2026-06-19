document.addEventListener('DOMContentLoaded', () => {

    // --- 1. 資料定義 ---

    const LANGUAGES = {
        'chinese': { name: '華語' },
        'sixian': { name: '四縣', file: 'data-sixian-chinese.js' },
        'hailu': { name: '海陸', file: 'data-hailu-chinese.js' },
        'dapu': { name: '大埔', file: 'data-dapu-chinese.js' },
        'raoping': { name: '饒平', file: '' },
		//'raoping': { name: '饒平', file: 'data-raoping-chinese.js' },
        'kasu': { name: '詔安', file: 'data-kasu-chinese.js' },
        'sixiannan': { name: '南四縣', file: '' },
		'sixiannan': { name: '南四縣', file: 'data-sixiannan-chinese.js' },
        'holo': { name: '和樂', file: 'data-holo-chinese.js' },
        'matsu': { name: '馬祖', file: 'data-matsu-chinese.js' },
    };

    const DIRECT_PAIRS = {
        'sixian-hailu': 'data-sixian-hailu.js',
        'sixian-dapu': 'data-sixian-dapu.js',
		'sixian-raoping': 'data-sixian-raoping.js',
        'sixian-kasu': 'data-sixian-kasu.js',
		'sixian-sixiannan': 'data-sixian-sixiannan.js',
		'hailu-dapu': 'data-hailu-dapu.js',
		'hailu-kasu': 'data-hailu-kasu.js',
		'dapu-kasu': 'data-dapu-kasu.js',
        'holo-kasu': 'data-holo-kasu.js',
    };
    
    // 定義 data 檔案與其包含的語言對，用於優化快取
    const DATA_FILE_MAP = {
        'data-sixian-chinese.js': ['chinese-sixian', 'sixian-chinese'],
        'data-hailu-chinese.js': ['chinese-hailu', 'hailu-chinese'],
        'data-dapu-chinese.js': ['chinese-dapu', 'dapu-chinese'],
        //'data-raoping-chinese.js': ['chinese-raoping', 'raoping-chinese'],
        'data-kasu-chinese.js': ['chinese-kasu', 'kasu-chinese'],
        'data-sixiannan-chinese.js': ['chinese-sixiannan', 'sixiannan-chinese'],
        'data-holo-chinese.js': ['chinese-holo', 'holo-chinese'],
        'data-matsu-chinese.js': ['chinese-matsu', 'matsu-chinese'],
        
        'data-sixian-hailu.js': ['sixian-hailu', 'hailu-sixian'],
        'data-sixian-dapu.js': ['sixian-dapu', 'dapu-sixian'],
		'data-sixian-raoping.js': ['sixian-raoping', 'raoping-sixian'],
        'data-sixian-kasu.js': ['sixian-kasu', 'kasu-sixian'],
		'data-sixian-sixiannan.js': ['sixian-sixiannan', 'sixiannan-sixian'],
		'data-hailu-dapu.js': ['hailu-dapu', 'dapu-hailu'],
		'data-hailu-kasu.js': ['hailu-kasu', 'kasu-hailu'],
		'data-dapu-kasu.js': ['dapu-kasu', 'kasu-dapu'],
        'data-holo-kasu.js': ['holo-kasu', 'kasu-holo'],
    };
	// --- 動態 Textarea 高度 ---
    const isMobile = () => window.innerWidth <= 768;

    /**
     * 動態調整 Textarea 高度以符合內容
     * @param {HTMLElement} element - 要調整的 textarea 元素
     */
    function autoResizeTextarea(element) {
        if (!element) return;
        
        if (!isMobile()) {
            // 如果切換回桌機版，重設樣式
            element.style.height = '';
            return;
        }
        
        element.style.height = 'auto'; // 1. 重設高度
        
        // 2. 設定為捲動高度 (scrollHeight)
        // 3. 加上 2px 緩衝，避免某些瀏覽器出現閃爍的捲動條
        element.style.height = (element.scrollHeight + 2) + 'px';
    }

	// --- 預先計算代理 (Proxy) 語言 ---
    const proxyMap = new Map();
    function buildProxyMap() {
        for (const langKey in LANGUAGES) {
            // 條件 1: 該語言沒有自己的 '...-chinese.js' 檔案
            if (!LANGUAGES[langKey].file) {
                let proxyTarget = null;
                let pairCount = 0;
                
                // 條件 2: 在 DIRECT_PAIRS 中尋找 *唯一* 的配對
                for (const pairKey in DIRECT_PAIRS) {
                    const [langA, langB] = pairKey.split('-');
                    if (langA === langKey) {
                        proxyTarget = langB;
                        pairCount++;
                    } else if (langB === langKey) {
                        proxyTarget = langA;
                        pairCount++;
                    }
                }
                
                // 條件 3: 必須 *只有* 一個配對
                if (pairCount === 1) {
                    proxyMap.set(langKey, proxyTarget);
                }
            }
        }
    }
    buildProxyMap(); // 立即執行
    console.log("[Proxy] 代理地圖:", proxyMap);

    /**
     * [HELPER] 取得語言的代理目標 (如果有的話)
     */
    function getProxyTarget(lang) {
        return proxyMap.get(lang);
    }

    /**
     * 檢查兩個語言之間是否有直接翻譯路徑
     * @param {string} langA 
     * @param {string} langB 
     * @returns {boolean}
     */
    function hasDirectPath(langA, langB) {
        if (!langA || !langB || langA === langB) return false;
        // 檢查 DIRECT_PAIRS (雙向)
        if (DIRECT_PAIRS[`${langA}-${langB}`] || DIRECT_PAIRS[`${langB}-${langA}`]) {
            return true;
        }
        // 檢查與華語的連接
        if (langA === DEFAULT_PIVOT && LANGUAGES[langB]?.file) return true;
        if (langB === DEFAULT_PIVOT && LANGUAGES[langA]?.file) return true;
        
        return false;
    }

    /**
     * 尋找所有可能的 "一站式" 中介語言
     * @param {string} from - 來源語言
     * @param {string} to - 目標語言
     * @returns {string[]} - 所有有效的中介語言 key 陣列
     */
    function findPossiblePivots(from, to) {
        const pivots = [];
        // 永遠將華語作為預設檢查對象
        if (from !== DEFAULT_PIVOT && to !== DEFAULT_PIVOT && hasDirectPath(from, DEFAULT_PIVOT) && hasDirectPath(DEFAULT_PIVOT, to)) {
            pivots.push(DEFAULT_PIVOT);
        }

        // 遍歷所有語言，尋找其他可能的中介
        for (const langKey in LANGUAGES) {
            if (langKey !== from && langKey !== to && langKey !== DEFAULT_PIVOT) {
                if (hasDirectPath(from, langKey) && hasDirectPath(langKey, to)) {
                    pivots.push(langKey);
                }
            }
        }
        return pivots;
    }

    // --- 2. 狀態與設定 ---

    const STORAGE_PREFIX = 'OIKASU_TRANSLATOR_V5_';
    const DEFAULT_LEFT = 'chinese';
    const DEFAULT_RIGHT = 'kasu';
	
	const DEFAULT_PIVOT = 'chinese'; // 預設的中介語言
    const DIRECT_TRANSLATE_KEY = 'direct'; // "直達" 選項的 key
    let currentPivotLang = DEFAULT_PIVOT; // 目前選擇的中介語言

	const DEFAULT_DELIMITER = ""; //預設分詞符號
    let translationDelimiter = DEFAULT_DELIMITER;

    let langLeft = DEFAULT_LEFT;
    let langRight = DEFAULT_RIGHT;
    let isInstantTranslate = true;
    let currentTranslateAction = 'translate'; // 'translate', 'segment', 'space'
	let currentMode = 'translate'; // 儲存目前模式：'translate'(翻譯) 或 'search'(查詢)

    // --- 新增：字典快取與載入狀態 ---
    let dictionaryCache = {}; 
    let scriptLoadPromises = {};
	
	// --- 查詢模式專用狀態 ---
    let currentSearchResults = [];
    let currentPage = 1;
    const ITEMS_PER_PAGE = 24; // 每頁顯示 24 筆，適合在各種螢幕尺寸排列網格

    // --- 3. DOM 元素 ---

    const btnLangLeft = document.getElementById('btnLangLeft');
    const btnLangRight = document.getElementById('btnLangRight');
    const popoverLeft = document.getElementById('popoverLeft');
    const popoverRight = document.getElementById('popoverRight');
    const btnSwap = document.getElementById('btnSwap');

    const textInput = document.getElementById('textInput');
    const textOutput = document.getElementById('textOutput');

    const btnClearInput = document.getElementById('btnClearInput');
	const btnClearOutput = document.getElementById('btnClearOutput');
    const btnCopyInput = document.getElementById('btnCopyInput');
    const btnCopyOutput = document.getElementById('btnCopyOutput');

    const toastContainer = document.getElementById('toastContainer');
    const chkInstantTranslate = document.getElementById('chkInstantTranslate');
    const manualTranslateControls = document.getElementById('manualTranslateControls');
    const btnManualTranslateAction = document.getElementById('btnManualTranslateAction');
    const btnManualTranslateToggle = document.getElementById('btnManualTranslateToggle');
    const popoverTranslateOptions = document.getElementById('popoverTranslateOptions');

	const btnOpenSettings = document.getElementById('btnOpenSettings');
    const settingsSidebar = document.getElementById('settingsSidebar');
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const settingsBackdrop = document.getElementById('settingsBackdrop');
    const inputDelimiter = document.getElementById('inputDelimiter');

	const pivotLangContainer = document.getElementById('pivotLangContainer');
    const selectPivotLang = document.getElementById('selectPivotLang');
    const btnModeTranslate = document.getElementById('btnModeTranslate');
    const btnModeSearch = document.getElementById('btnModeSearch');
    const searchInput = document.getElementById('searchInput');
    const btnSearchAction = document.getElementById('btnSearchAction');

	const searchResultsGrid = document.getElementById('searchResultsGrid');
    const searchResultsCount = document.getElementById('searchResultsCount');
    const paginationContainer = document.getElementById('paginationContainer');
    const btnPrevPage = document.getElementById('btnPrevPage');
    const btnNextPage = document.getElementById('btnNextPage');
    const pageInfo = document.getElementById('pageInfo');


    // --- 4. 核心函式 ---

    /**
     * 顯示提示訊息
     * @param {string} message - 要顯示的訊息
     */
    function showToast(message) {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toastContainer.appendChild(toast);

        // 3 秒後自動移除
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * 儲存語言狀態到 LocalStorage 並更新 URL
     */
    function saveState() {
        try {
            localStorage.setItem(STORAGE_PREFIX + 'langLeft', langLeft);
            localStorage.setItem(STORAGE_PREFIX + 'langRight', langRight);
            localStorage.setItem(STORAGE_PREFIX + 'currentMode', currentMode); // 新增：儲存模式快取
            
            const params = new URLSearchParams(window.location.search);
            params.set('from', langLeft);
            params.set('to', langRight);
            params.set('mode', currentMode); // 新增：同步網址參數 ?mode=
            window.history.pushState({ path: `?${params.toString()}` }, '', `?${params.toString()}`);
        } catch (e) {
            console.error("無法儲存狀態:", e);
        }
    }

    /**
     * 從 URL 或 LocalStorage 載入狀態
     */
    function loadState() {
        const params = new URLSearchParams(window.location.search);
        const urlFrom = params.get('from');
        const urlTo = params.get('to');
        const urlMode = params.get('mode'); // 新增：讀取網址模式

        const localFrom = localStorage.getItem(STORAGE_PREFIX + 'langLeft');
        const localTo = localStorage.getItem(STORAGE_PREFIX + 'langRight');
        const localInstant = localStorage.getItem(STORAGE_PREFIX + 'isInstant');
        const localMode = localStorage.getItem(STORAGE_PREFIX + 'currentMode'); // 新增：讀取快取模式
        
        const validateLang = (key) => LANGUAGES[key] ? key : null;

        // 1. 載入模式 (優先使用網址參數，次之為本地快取，預設為 translate)
        currentMode = urlMode === 'search' || localMode === 'search' ? 'search' : 'translate';

        // 2. 載入語言
        langLeft = validateLang(urlFrom) || validateLang(localFrom) || DEFAULT_LEFT;
        langRight = validateLang(urlTo) || validateLang(localTo) || DEFAULT_RIGHT;

        // 載入即時翻譯設定 (預設為 true)
        isInstantTranslate = (localInstant === null) ? true : (localInstant === 'true');

        // 翻譯模式下的同語言狀態校正
        if (currentMode === 'translate' && langLeft === langRight) {
            if (langLeft === DEFAULT_PIVOT) {
                langRight = DEFAULT_RIGHT;
            } else {
                langRight = DEFAULT_PIVOT;
            }
        }
        
        // 更新即時翻譯 UI
        updateInstantTranslateUI();

        // 載入分隔符號設定
        const localDelimiter = localStorage.getItem(STORAGE_PREFIX + 'delimiter');
        translationDelimiter = (localDelimiter === null) ? DEFAULT_DELIMITER : localDelimiter;
        if (inputDelimiter) inputDelimiter.value = translationDelimiter;

        // 執行模式與 UI 初始化切換
        switchMode(currentMode);
    }

    /**
     * 更新即時翻譯的 UI (核取方塊和按鈕)
     */
    function updateInstantTranslateUI() {
        chkInstantTranslate.checked = isInstantTranslate;
        manualTranslateControls.classList.toggle('hidden', isInstantTranslate);
    }

    /**
     * 儲存即時翻譯的設定
     */
    function saveInstantTranslateState() {
        try {
            localStorage.setItem(STORAGE_PREFIX + 'isInstant', isInstantTranslate);
        } catch (e) {
            console.error("無法儲存即時翻譯設定:", e);
        }
    }


    /**
     * 儲存分隔符號設定
     */
    function saveDelimiterState() {
        try {
            localStorage.setItem(STORAGE_PREFIX + 'delimiter', translationDelimiter);
        } catch (e) {
            console.error("無法儲存分隔符號設定:", e);
        }
    }

	/**
     * 儲存中介語言設定
     */
    function savePivotLangState() {
        try {
            localStorage.setItem(STORAGE_PREFIX + 'pivotLang', currentPivotLang);
        } catch (e) {
            console.error("無法儲存中介語言設定:", e);
        }
    }

	/**
     * [REVISED] 動態更新中介語言選單
     * (修正代理語言的 'effective' 判斷 Bug)
     * @param {string} from - 來源語言
     * @param {string} to - 目標語言
     * @param {string | null} savedPivot - 儲存在 localStorage 的偏好
     */
    function updatePivotLangSelector(from, to, savedPivot = null) {
        selectPivotLang.innerHTML = '';
        
        // --- 修正代理 (Proxy) 判斷 ---
        const proxyFromTarget = getProxyTarget(from);
        const proxyToTarget = getProxyTarget(to);
        
        // 1. "有效"來源：如果是代理，則使用其目標
        const effectiveFrom = proxyFromTarget || from;
        
        // 2. "有效"目標：如果是代理，*且* 來源不是其代理目標，才使用其目標
        // (修正: 避免 sixian -> sixiannan 時, effectiveTo 變成 sixian)
        let effectiveTo = to;
        if (proxyToTarget && from !== proxyToTarget) {
            effectiveTo = proxyToTarget;
        }
        // --- 修正結束 ---

        let defaultSelection = '';
        let options = [];

        // 1. 檢查並加入 "直達" 選項
        // (檢查 'effectiveFrom' 和 'effectiveTo')
        if (hasDirectPath(effectiveFrom, effectiveTo)) {
            options.push({ value: DIRECT_TRANSLATE_KEY, text: '直達 (建議)' });
            defaultSelection = DIRECT_TRANSLATE_KEY;
        }
        
        // 【修正】: 
        // 檢查 "sixiannan" (proxy) -> "sixian" (target) 這種也算直達
        if (proxyFromTarget && to === proxyFromTarget) {
             if (!options.find(o => o.value === DIRECT_TRANSLATE_KEY)) {
                options.push({ value: DIRECT_TRANSLATE_KEY, text: '直達 (建議)' });
             }
             defaultSelection = DIRECT_TRANSLATE_KEY;
        }
        // 檢查 "sixian" (target) -> "sixiannan" (proxy) 這種也算直達
        if (proxyToTarget && from === proxyToTarget) {
            if (!options.find(o => o.value === DIRECT_TRANSLATE_KEY)) {
                options.push({ value: DIRECT_TRANSLATE_KEY, text: '直達 (建議)' });
            }
            defaultSelection = DIRECT_TRANSLATE_KEY;
        }


        // 2. 尋找並加入所有可能的中介語言選項
        const possiblePivots = findPossiblePivots(effectiveFrom, effectiveTo);
        possiblePivots.forEach(pivotKey => {
             if (pivotKey !== effectiveFrom && pivotKey !== effectiveTo) {
                options.push({ value: pivotKey, text: LANGUAGES[pivotKey].name });
                if (!defaultSelection) {
                    defaultSelection = pivotKey;
                }
             }
        });
        
        // 3. 產生 <option> 元素
        options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.text;
            selectPivotLang.appendChild(optionEl);
        });
        
        // 4. 決定最終選項
        if (savedPivot && options.find(opt => opt.value === savedPivot)) {
            defaultSelection = savedPivot;
        }
        if (options.length > 0 && !options.find(opt => opt.value === defaultSelection)) {
             defaultSelection = options[0].value;
        }

        selectPivotLang.value = defaultSelection;
        currentPivotLang = defaultSelection;
        
        // 5. 決定是否隱藏選單
        // (修正: sixian <-> sixiannan 只有直達, options.length < 2 會為 true)
        if (effectiveFrom === effectiveTo || options.length < 2) {
             // 特例: A <-> ProxyTarget (e.g. sixian <-> sixiannan)
             if (proxyFromTarget && to === proxyFromTarget) {
                pivotLangContainer.classList.add('hidden');
             } else if (proxyToTarget && from === proxyToTarget) {
                pivotLangContainer.classList.add('hidden');
             } else if (effectiveFrom === effectiveTo) {
                pivotLangContainer.classList.add('hidden');
             } else {
                 pivotLangContainer.classList.remove('hidden'); // e.g. only 1 pivot
             }
        } else {
            pivotLangContainer.classList.remove('hidden');
        }
        
        console.log(`[Pivot] 中介語言更新為: ${currentPivotLang}, 選項:`, options.map(o=>o.value));
    }

	/**
     * 重新產生兩個語言選單
     */
    function populatePopovers() {
        popoverLeft.innerHTML = '';
        popoverRight.innerHTML = '';

        Object.entries(LANGUAGES).forEach(([key, { name }]) => {
            // --- 左側選單 ---
            const btnLeft = document.createElement('button');
            btnLeft.dataset.lang = key;
            btnLeft.textContent = name;
            if (key === langLeft) btnLeft.classList.add('active');
            popoverLeft.appendChild(btnLeft);

            // --- 右側選單 ---
            const btnRight = document.createElement('button');
            btnRight.dataset.lang = key;
            btnRight.textContent = name;
            if (key === langRight) btnRight.classList.add('active');
            
            // 判斷是否要禁用右側按鈕
            if (currentMode === 'search') {
                // 【查詢模式】: 右側只能點選與左側「有直接資料庫」的語言
                let isDirect = false;
                if (langLeft === 'chinese' && LANGUAGES[key].file) {
                    isDirect = true; // 華語對應有 file 的客語/本土語言
                } else if (key === 'chinese' && LANGUAGES[langLeft].file) {
                    isDirect = true; // 本土語言對應華語
                } else if (DIRECT_PAIRS[`${langLeft}-${key}`] || DIRECT_PAIRS[`${key}-${langLeft}`]) {
                    isDirect = true; // 存在直接方言對應
                }
                
                // 如果沒有直接對應，或者是相同語言，則禁用
                if (!isDirect || key === langLeft) {
                    btnRight.disabled = true;
                }
            } else {
                // 【翻譯模式】: 右側不能選左側已選的 (原本邏輯)
                if (key === langLeft) btnRight.disabled = true;
            }
            popoverRight.appendChild(btnRight);
        });
    }

    /**
     * 切換 Popover 顯示/隱藏
     */
    function togglePopover(popover) {
        const isHidden = popover.classList.contains('hidden');
        closeAllPopovers();
        if (isHidden) {
            popover.classList.remove('hidden');
        }
    }

	/**
     * 處理語言選擇
     */
    function handleLangSelect(e, side) {
        const btn = e.target.closest('button');
        if (!btn || btn.disabled) return;

        const newLang = btn.dataset.lang;

        if (side === 'left') {
            langLeft = newLang;
            
            if (currentMode === 'search') {
                // 【查詢模式智慧預設】
                // 1. 如果左側選的是「華語」，則右側智慧設為「詔安」(DEFAULT_RIGHT)
                if (langLeft === 'chinese') { 
                    langRight = 'kasu';
                } 
                // 2. 如果左側選的是任何其他本土語言，則右側自動預設查「華語」
                else {
                    langRight = 'chinese'; 
                }
            } else {
                // 【翻譯模式原本邏輯】
                if (langLeft === DEFAULT_PIVOT) { 
                    langRight = DEFAULT_RIGHT;
                } else {
                    langRight = DEFAULT_PIVOT; 
                }
            }
        } else { 
            // 右側選單變更
            langRight = newLang;
        }

        updateLanguageButtons();
        populatePopovers(); // 重新整理選單的 disabled 和 active 狀態
        closeAllPopovers();
        saveState();
        triggerTranslation();

        preloadDictionaries(langLeft, langRight);
        updatePivotLangSelector(langLeft, langRight);
    }

    /**
     * 交換左右語言
     */
    function swapLanguages() {
        [langLeft, langRight] = [langRight, langLeft];
        
        const tempText = textInput.value;
        textInput.value = textOutput.value;
        textOutput.value = tempText;

        updateLanguageButtons();
        populatePopovers();
        saveState();
        triggerTranslation();
		preloadDictionaries(langLeft, langRight);

		// --- (不傳入 savedPivot，讓函式自動選擇預設值) ---
        updatePivotLangSelector(langLeft, langRight);
		autoResizeTextarea(textInput);
        autoResizeTextarea(textOutput);
    }

    /**
     * 更新按鈕上顯示的語言名稱
     */
    function updateLanguageButtons() {
        btnLangLeft.childNodes[0].nodeValue = LANGUAGES[langLeft].name;
        btnLangRight.childNodes[0].nodeValue = LANGUAGES[langRight].name;
    }

    /**
     * 關閉所有 Popover
     */
    function closeAllPopovers() {
        popoverLeft.classList.add('hidden');
        popoverRight.classList.add('hidden');
        popoverTranslateOptions.classList.add('hidden');
    }

	/**
     * 新增：執行模式切換 (控制 UI、校正語言、儲存狀態)
     * @param {string} mode - 'translate' 或 'search'
     */
    function switchMode(mode) {
        currentMode = mode;
        
        // 1. 切換 body 類別，觸發 CSS 的介面顯示/隱藏
        document.body.classList.toggle('search-mode', currentMode === 'search');
        
        // 2. 更新 Header 頁籤的 active 狀態
        if (btnModeTranslate && btnModeSearch) {
            btnModeTranslate.classList.toggle('active', currentMode === 'translate');
            btnModeSearch.classList.toggle('active', currentMode === 'search');
        }
        
        // 3. 查詢模式專屬的語言有效性校正 (確保兩者有直接資料庫對應)
        if (currentMode === 'search') {
            let isDirect = false;
            // 檢查是否能直接與華語互查，或者在 DIRECT_PAIRS 中
            if (langLeft === 'chinese' && LANGUAGES[langRight]?.file) isDirect = true;
            if (langRight === 'chinese' && LANGUAGES[langLeft]?.file) isDirect = true;
            if (DIRECT_PAIRS[`${langLeft}-${langRight}`] || DIRECT_PAIRS[`${langRight}-${langLeft}`]) isDirect = true;
            
            // 如果當前組合沒有直接資料庫，執行智慧預設規則
            if (!isDirect) {
                if (langLeft === 'chinese') {
                    langRight = 'kasu'; // 華語預設查 詔安
                } else {
                    langRight = 'chinese'; // 客語/閩南語預設查 華語
                }
            }
        }
        
        // 4. 刷新語言按鈕文字與選單內容
        updateLanguageButtons();
        populatePopovers();
        
        // 5. 更新中介語言選單 (若是查詢模式，這個選單會被 CSS 自動隱藏)
        updatePivotLangSelector(langLeft, langRight);
        
        // 6. 同步狀態與網址
        saveState();
        
        // 7. 預載當前組合的字典檔
        preloadDictionaries(langLeft, langRight);
        
        console.log(`[Mode] 已成功切換至: ${currentMode} 模式`);
    }

    /**
     * [重構] 動態載入 data-*.js 檔案並建立字典
     * @param {string} pairKey - 字典的快取鍵名 (例如 'chinese-kasu')
     * @param {string} dataFile - 要載入的 .js 檔案 (例如 'data-kasu-chinese.js')
     * @returns {Promise<object>} 包含 { reGK, mapGK, ... } 的字典物件
     */
    function loadDictionary(pairKey, dataFile) {
        // 1. 檢查快取
        if (dictionaryCache[pairKey]) {
            console.log(`[Cache] 使用快取的字典: ${pairKey}`);
            return Promise.resolve(dictionaryCache[pairKey]);
        }
        
        // 2. 檢查是否有正在進行的載入
        if (scriptLoadPromises[dataFile]) {
            console.log(`[Loading] 等待 ${dataFile} 載入...`);
            // 等待該檔案載入完成，然後從快取中取得
            return scriptLoadPromises[dataFile].then(() => dictionaryCache[pairKey]);
        }

        console.log(`[Network] 載入新字典: ${dataFile} (for ${pairKey})`);

        // 3. 執行載入
        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = dataFile;
            
            script.onload = () => {
                console.log(`[Loaded] ${dataFile} 載入完成.`);
                
                // data-*.js 載入後，全域變數 'ww' 會被設定
                if (typeof ww === 'undefined') {
                    console.error(`[Error] ${dataFile} 已載入，但未定義 'ww' 變數。`);
                    return reject(new Error(`檔案 ${dataFile} 格式錯誤。`));
                }

                // 呼叫 translate.js 的函式來建立字典
                try {
                    // setupDictionaries 是由 translate.js 提供的
                    const dictionaries = setupDictionaries(ww);
                    
                    // 優化：一次載入，儲存所有相關的語言對
                    const keysToCache = DATA_FILE_MAP[dataFile] || [pairKey];
                    
                    keysToCache.forEach(key => {
                         dictionaryCache[key] = dictionaries;
                         console.log(`[Cache] 已儲存字典: ${key}`);
                    });
                    
                    resolve(dictionaries);
                    
                } catch (e) {
                    console.error(`[Error] setupDictionaries 執行失敗:`, e);
                    reject(new Error('字典建立失敗。'));
                } finally {
                    // 清理全域 ww
                    if (typeof ww !== 'undefined') {
                        ww = undefined; 
                    }
                    script.remove(); // 移除 script 標籤
                }
            };
            
            script.onerror = () => {
                console.error(`[Error] 載入 ${dataFile} 失敗.`);
                reject(new Error(`無法載入語言資料: ${dataFile}`));
                scriptLoadPromises[dataFile] = undefined; // 允許重試
                script.remove();
            };

            document.body.appendChild(script);
        });

        // 儲存 promise，防止重複載入
        scriptLoadPromises[dataFile] = promise;
        return promise;
    }




	/**
     * [REVISED] 預先載入翻譯所需的字典
     * (修正以處理代理語言)
     * @param {string} from - 來源語言
     * @param {string} to - 目標語言
     */
    function preloadDictionaries(from, to) {
        console.log(`[Preload] 準備預載入: ${from} -> ${to}`);
        const filesToLoad = new Map(); // [dataFile, pairKey]
        
        // --- 0. 取得代理 (Proxy) ---
        const proxyFrom = getProxyTarget(from);
        const proxyTo = getProxyTarget(to);
        
        const effectiveFrom = proxyFrom || from;
        const effectiveTo = proxyTo || to;

        // --- 1. 預載入 'from' 代理 (e.g., sixiannan -> sixian) ---
        if (proxyFrom) {
            const pairKey = `${from}-${proxyFrom}`;
            const dataFile = DIRECT_PAIRS[pairKey] || DIRECT_PAIRS[`${proxyFrom}-${from}`];
            if (dataFile) filesToLoad.set(dataFile, [pairKey, dataFile]);
        }
        
        // --- 2. 預載入 'to' 代理 (e.g., sixian -> sixiannan) ---
        if (proxyTo) {
            const pairKey = `${proxyTo}-${to}`;
            const dataFile = DIRECT_PAIRS[pairKey] || DIRECT_PAIRS[`${to}-${proxyTo}`];
            if (dataFile) filesToLoad.set(dataFile, [pairKey, dataFile]);
        }

        // --- 3. 預載入 "effectiveFrom" 的斷詞/翻譯字典 (A -> 華語) ---
        if (effectiveFrom !== DEFAULT_PIVOT && LANGUAGES[effectiveFrom]?.file) {
            const file = LANGUAGES[effectiveFrom].file;
            const pairKey = `${effectiveFrom}-${DEFAULT_PIVOT}`;
            filesToLoad.set(file, [pairKey, file]);
        } 
        else if (effectiveFrom === DEFAULT_PIVOT && LANGUAGES[DEFAULT_RIGHT]?.file) { 
            const file = LANGUAGES[DEFAULT_RIGHT].file;
            const pairKey = `${DEFAULT_PIVOT}-${DEFAULT_RIGHT}`;
            filesToLoad.set(file, [pairKey, file]);
        }

        // --- 4. 預載入 "effectiveTo" 的翻譯字典 (華語 -> B) ---
        if (effectiveTo !== DEFAULT_PIVOT && LANGUAGES[effectiveTo]?.file) {
            const file = LANGUAGES[effectiveTo].file;
            const pairKey = `${DEFAULT_PIVOT}-${effectiveTo}`;
            filesToLoad.set(file, [pairKey, file]);
        }

        // --- 5. 預載入 "直達" 字典 (effectiveFrom <-> effectiveTo) ---
        const pairKey = `${effectiveFrom}-${effectiveTo}`;
        const reversePairKey = `${effectiveTo}-${effectiveFrom}`;
        const directFile = DIRECT_PAIRS[pairKey] || DIRECT_PAIRS[reversePairKey];
        if (directFile) {
            filesToLoad.set(directFile, [pairKey, directFile]);
        }
        
        // --- 6. 預載入 "其他中介" (e.g., kasu) ---
        const possiblePivots = findPossiblePivots(effectiveFrom, effectiveTo);
        for (const pivot of possiblePivots) {
            // A -> Pivot
            const pair1 = `${effectiveFrom}-${pivot}`;
            const file1 = (DIRECT_PAIRS[pair1] || DIRECT_PAIRS[`${pivot}-${effectiveFrom}`]) || (pivot === DEFAULT_PIVOT ? LANGUAGES[effectiveFrom]?.file : null);
            if(file1) filesToLoad.set(file1, [pair1, file1]);
            
            // Pivot -> B
            const pair2 = `${pivot}-${effectiveTo}`;
            const file2 = (DIRECT_PAIRS[pair2] || DIRECT_PAIRS[`${effectiveTo}-${pivot}`]) || (pivot === DEFAULT_PIVOT ? LANGUAGES[effectiveTo]?.file : null);
            if(file2) filesToLoad.set(file2, [pair2, file2]);
        }

        // --- 執行所有預載入 ---
        filesToLoad.forEach(([pairKey, dataFile]) => {
            console.log(`[Preload] 正在載入: ${dataFile} (for ${pairKey})`);
            loadDictionary(pairKey, dataFile)
                .catch(err => console.warn(`[Preload] 字典 ${dataFile} 預載入失敗:`, err));
        });
    }




/**
     * [REVISED] 根據來源/目標語言和動作，取得字典和要執行的函式
     * @param {string} from - 來源語言
     * @param {string} to - 目標語言
     * @param {string} action - 'translate', 'segment', 'space'
     * @returns {Promise<object>} { dicts, actionFn, sourceText }
     */
    async function getDictionaryAndAction(from, to, action) {
        
        const sourceText = textInput.value;
        const delimiter = translationDelimiter;

        // --- 1. 處理斷詞 (邏輯不變) ---
        if (action === 'space' || action === 'segment') {
            // ... (此區塊邏輯不變，請保留您原有的程式碼) ...
            console.log(`[Segment] 執行斷詞: ${from}`);
            const proxyFromTarget = getProxyTarget(from);
            const segmentSourceLang = proxyFromTarget || from; 
            let dataFile, segmentPairKey;
            let isPivotSource = (segmentSourceLang === DEFAULT_PIVOT);
            if (isPivotSource) {
                dataFile = LANGUAGES[DEFAULT_RIGHT].file; 
                segmentPairKey = `${DEFAULT_PIVOT}-${DEFAULT_RIGHT}`;
            } else {
                dataFile = LANGUAGES[segmentSourceLang]?.file;
                segmentPairKey = `${segmentSourceLang}-${DEFAULT_PIVOT}`;
                if (!dataFile && proxyFromTarget) {
                    const proxyPairKey = `${from}-${proxyFromTarget}`;
                    dataFile = DIRECT_PAIRS[proxyPairKey] || DIRECT_PAIRS[`${proxyFromTarget}-${from}`];
                    segmentPairKey = proxyPairKey; 
                }
            }
            if (!dataFile) throw new Error(`缺少 ${from} (或其代理 ${segmentSourceLang}) 的斷詞資料`);
            const dicts = await loadDictionary(segmentPairKey, dataFile);
            let reSegment;
            if (isPivotSource) {
                reSegment = dicts.reTonv; 
            } else {
                const [langA, langB] = segmentPairKey.split('-');
                if (segmentSourceLang === langA) reSegment = dicts.reKG; 
                else if (segmentSourceLang === langB) reSegment = dicts.reGK; 
                else reSegment = dicts.reKG; 
            }
            if (action === 'space') {
                return { dicts: dicts, actionFn: (text, d) => TonvBasic(text, reSegment, d.reVariant, d.mapVariant), sourceText: sourceText };
            } else {
                return { dicts: dicts, actionFn: (text, d) => TonvSegment(text, reSegment, d.reVariant, d.mapVariant), sourceText: sourceText };
            }
        }
        
        // --- 2. 處理翻譯 ---
        let currentText = sourceText;
        let currentFrom = from;
        let currentTo = to;

        // --- Step 1: 處理 'from' 代理 (e.g., sixiannan -> sixian) ---
        const proxyFromTarget = getProxyTarget(currentFrom);
        if (proxyFromTarget && currentTo !== proxyFromTarget) {
            console.log(`[Proxy] 步驟 1 (FROM): ${currentFrom} -> ${proxyFromTarget}`);
            currentText = await executeTranslation(currentFrom, proxyFromTarget, currentText, delimiter);
            currentFrom = proxyFromTarget;
        }

        // --- Step 2: 處理 'to' 代理 (e.g., sixiannan <- sixian) ---
        const proxyToTarget = getProxyTarget(currentTo);
        if (proxyToTarget && currentFrom !== proxyToTarget) {
            console.log(`[Proxy] 步驟 2 (FINAL TO): 目標是代理 ${currentTo}，將在最後處理`);
        }
        
        // --- Step 3: 執行主要翻譯 (currentFrom -> effectiveTo) ---
        const effectiveTo = (proxyToTarget && currentFrom !== proxyToTarget) ? proxyToTarget : currentTo;

        let mainResultText;
        // 【核心修正】: 使用更明確的判斷
        const usePivot = (currentPivotLang && currentPivotLang !== DIRECT_TRANSLATE_KEY);

        if (usePivot) {
            // --- A. 樞軸翻譯 ---
            const pivotLang = currentPivotLang;
            console.log(`[Pivot] MAIN: ${currentFrom} -> ${pivotLang} -> ${effectiveTo}`);
            let pivotText = await executeTranslation(currentFrom, pivotLang, currentText, delimiter);
            mainResultText = await executeTranslation(pivotLang, effectiveTo, pivotText, delimiter);
        } else {
            // --- B. 直達翻譯 ---
            console.log(`[Translate] MAIN: ${currentFrom} -> ${effectiveTo}`);
            mainResultText = await executeTranslation(currentFrom, effectiveTo, currentText, delimiter);
        }

        // --- Step 4: 處理 'to' 代理 (final hop) ---
        let finalResultText = mainResultText;
        if (proxyToTarget && currentFrom !== proxyToTarget) {
             console.log(`[Proxy] FINAL HOP: ${proxyToTarget} -> ${currentTo}`);
             finalResultText = await executeTranslation(proxyToTarget, currentTo, mainResultText, delimiter);
        }

        // --- Step 5: 返回一個立即執行的函式 ---
        return {
            dicts: null,
            actionFn: () => finalResultText, // 直接返回已計算好的結果
            sourceText: sourceText
        };
    }


	// --- 執行單步翻譯的輔助函式 ---
    /**
     * 執行一步 A -> B 的翻譯
     * @param {string} from
     * @param {string} to
     * @param {string} text
     * @param {string} delimiter
     * @returns {Promise<string>} 翻譯後的文字
     */
    async function executeTranslation(from, to, text, delimiter) {
        if (from === to) return text.trim(); // 如果來源和目標相同，直接返回

        const dicts = await loadDictionaryForPair(from, to);
        const direction = determineDirection(from, to);
        
        const result = GoixBasic(
            text,
            direction === 'GK' ? dicts.reGK : dicts.reKG,
            direction === 'GK' ? dicts.mapGK : dicts.mapKG,
            dicts.reVariant,
            dicts.mapVariant,
            delimiter
        );
        return result.trim(); // 每一步都 trim
    }


    // 兩個用於 getDictionaryAndAction 的輔助函式 ---
    // 請將這兩個函式貼在 getDictionaryAndAction 函式之後
    
    /**
     * 根據兩個語言，找到並載入對應的字典檔
     */
    async function loadDictionaryForPair(from, to) {
        const pairKey = `${from}-${to}`;
        const reversePairKey = `${to}-${from}`;
        let dataFile = DIRECT_PAIRS[pairKey] || DIRECT_PAIRS[reversePairKey];

        if (!dataFile) {
            if (from === DEFAULT_PIVOT) dataFile = LANGUAGES[to]?.file;
            else if (to === DEFAULT_PIVOT) dataFile = LANGUAGES[from]?.file;
            else if (from === to) dataFile = LANGUAGES[from]?.file; // 同語言翻譯
        }
        if (!dataFile) throw new Error(`找不到 ${from} 和 ${to} 之間的翻譯資料`);
        
        return await loadDictionary(pairKey, dataFile);
    }

    /**
     * [HELPER] 判斷 A->B 的翻譯方向是 KG 還是 GK
     */
    function determineDirection(from, to) {
        const pairKey = `${from}-${to}`;
        const reversePairKey = `${to}-${from}`;

        if (DIRECT_PAIRS[pairKey]) { // from-to 匹配 (e.g., sixian-sixiannan)
            return 'KG'; // A->B
        }
        if (DIRECT_PAIRS[reversePairKey]) { // to-from 匹配
            return 'GK'; // B->A
        }
        if (from === DEFAULT_PIVOT) return 'GK'; // 華語->B
        if (to === DEFAULT_PIVOT) return 'KG'; // A->華語
        
        return 'KG'; // 預設 A->A
    }


    /**
     * 觸發翻譯
     */
    function triggerTranslation(actionOverride = null) {
        // 決定要執行的動作：優先使用傳入的 actionOverride，
        // 否則使用全域的 currentTranslateAction (用於即時翻譯)
        const actionToPerform = actionOverride || currentTranslateAction;

        // 如果執行的動作是 'translate' (無論是點擊主按鈕或即時翻譯)
        // 我們都重設全域狀態並更新選單 UI
        if (actionToPerform === 'translate') {
            currentTranslateAction = 'translate';
            popoverTranslateOptions.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            popoverTranslateOptions.querySelector('button[data-action="translate"]').classList.add('active');
        }

        const text = textInput.value; // 保留頭尾空格
        
        if (text.trim() === '') {
            if (actionToPerform === 'translate') {
                textOutput.value = '';
            } else {
                textOutput.value = ''; // 斷詞時也清空右欄
            }
			autoResizeTextarea(textOutput);
            return;
        }

        console.log(`準備執行動作: ${actionToPerform} (從 ${langLeft} 到 ${langRight})`);
        
        if (actionToPerform === 'translate') {
            textOutput.value = "處理中...";
			autoResizeTextarea(textOutput);
        } else {
            textOutput.value = ''; // 確保右欄為空
			autoResizeTextarea(textOutput);
        }
        
        // 檢查核心庫是否載入
        if (typeof setupDictionaries !== 'function') {
             console.error("translate.js 尚未載入");
             showToast("錯誤：核心翻譯庫尚未載入。");
             textOutput.value = "載入失敗，請重試。";
             return;
        }
        
        // 使用 actionToPerform 取得字典
        getDictionaryAndAction(langLeft, langRight, actionToPerform)
            .then(({ dicts, actionFn, sourceText }) => {
                const result = actionFn(sourceText, dicts);

                // 根據 actionToPerform 決定輸出位置
                if (actionToPerform === 'translate') {
                    textOutput.value = result.trim();
					autoResizeTextarea(textOutput);
                } else {
                    textInput.value = result.trim();
                    textOutput.value = ''; 
					autoResizeTextarea(textInput);
					autoResizeTextarea(textOutput);
                }
            })
            .catch(err => {
                console.error("翻譯/斷詞處理失敗:", err);
                showToast(err.message || "處理失敗");
                textOutput.value = "處理錯誤";
				autoResizeTextarea(textOutput);
            });
    }

	/**
     * 執行搜尋的核心邏輯 (包含精確/模糊比對與排序)
     */
    async function performSearch() {
        const keyword = searchInput.value.trim();
        if (!keyword) {
            showToast("請輸入要查詢的語詞");
            return;
        }

        // 初始化搜尋狀態
        searchResultsGrid.innerHTML = '';
        searchResultsCount.textContent = "🔍 搜尋中...";
        paginationContainer.classList.add('hidden');

        try {
            // 1. 取得當前方向與對應的字典
            const direction = determineDirection(langLeft, langRight);
            const dicts = await loadDictionaryForPair(langLeft, langRight);
            const rawList = dicts.rawList; // 從 translate.js 取得的原始陣列

            if (!rawList) throw new Error("字典資料不完整，無法執行查詢");

            // 2. 設定比對索引 
            // 原始資料格式: [count(詞頻), stringA(本土語言), stringB(華語)]
            // KG(客->華): 搜A(index 1), 顯示B(index 2)
            // GK(華->客): 搜B(index 2), 顯示A(index 1)
            let searchIndex = direction === 'GK' ? 2 : 1;
            let targetIndex = direction === 'GK' ? 1 : 2;

            // 3. 過濾與評分機制
            const results = [];
            const keywordLower = keyword.toLowerCase();

            rawList.forEach(item => {
                const sourceText = item[searchIndex] || '';
                const targetText = item[targetIndex] || '';

                if (!sourceText || !targetText) return;

                const sourceLower = sourceText.toLowerCase();
                let score = 0;

                // 評分標準：完全符合 (3) > 開頭符合 (2) > 包含字串 (1)
                if (sourceLower === keywordLower) {
                    score = 3; 
                } else if (sourceLower.startsWith(keywordLower)) {
                    score = 2; 
                } else if (sourceLower.includes(keywordLower)) {
                    score = 1; 
                }

                if (score > 0) {
                    results.push({
                        source: sourceText,
                        target: targetText,
                        score: score,
                        count: item[0] // 記錄詞頻，用於同分時的排序
                    });
                }
            });

            // 4. 排序邏輯：分數(降冪) -> 詞頻(降冪) -> 字串長度(升冪)
            results.sort((a, b) => {
                if (a.score !== b.score) return b.score - a.score;
                if (a.count !== b.count) return b.count - a.count;
                return a.source.length - b.source.length;
            });

            // 5. 過濾重複結果 (確保畫面上不出現完全相同的翻譯卡片)
            const uniqueResults = [];
            const seen = new Set();
            results.forEach(item => {
                const key = `${item.source}-${item.target}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueResults.push(item);
                }
            });

            // 6. 更新狀態並呼叫渲染函式
            currentSearchResults = uniqueResults;
            currentPage = 1;
            renderSearchResults();

        } catch (err) {
            console.error("搜尋錯誤:", err);
            searchResultsCount.textContent = "搜尋發生錯誤，請稍後再試。";
            showToast(err.message || "搜尋失敗");
        }
    }

    /**
     * 渲染搜尋結果與分頁 UI
     */
    function renderSearchResults() {
        const totalItems = currentSearchResults.length;
        
        // 處理無結果的情況
        if (totalItems === 0) {
            searchResultsCount.textContent = "歹勢，無尋著 🥲";
            searchResultsGrid.innerHTML = '';
            paginationContainer.classList.add('hidden');
            return;
        }

        // 處理有結果的情況
        searchResultsCount.textContent = `找到 ${totalItems} 筆結果`;

        // 計算分頁
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
        const pageItems = currentSearchResults.slice(startIndex, endIndex);

        searchResultsGrid.innerHTML = '';

        const leftLangName = LANGUAGES[langLeft].name;
        const rightLangName = LANGUAGES[langRight].name;

        // 動態生成 HTML 卡片
        pageItems.forEach((item, index) => {
            const isExact = item.score === 3;
            
            // 計算跨頁的絕對編號 (例如：第 2 頁的第 1 筆，若每頁 24 筆，編號就是 25)
            const globalIndex = startIndex + index + 1; 
            
            const card = document.createElement('div');
            card.className = `search-card ${isExact ? 'exact-match' : ''}`;
            
            // 加入卡片結構，新增 card-index 元素
            card.innerHTML = `
                <div class="card-index">${globalIndex}</div>
                <div class="card-source">${item.source}</div>
                <div class="card-target">${item.target}</div>
            `;
            searchResultsGrid.appendChild(card);
        });

        // 更新分頁按鈕狀態
        if (totalPages > 1) {
            paginationContainer.classList.remove('hidden');
            pageInfo.textContent = `第 ${currentPage} / ${totalPages} 頁`;
            btnPrevPage.disabled = currentPage === 1;
            btnNextPage.disabled = currentPage === totalPages;
        } else {
            paginationContainer.classList.add('hidden');
        }
    }


    // --- 5. 事件綁定 ---
	// --- 頁籤模式切換事件監聽 ---
    if (btnModeTranslate) {
        btnModeTranslate.addEventListener('click', () => switchMode('translate'));
    }
    if (btnModeSearch) {
        btnModeSearch.addEventListener('click', () => switchMode('search'));
    }

    btnLangLeft.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePopover(popoverLeft);
    });

    btnLangRight.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePopover(popoverRight);
    });

    popoverLeft.addEventListener('click', (e) => handleLangSelect(e, 'left'));
    popoverRight.addEventListener('click', (e) => handleLangSelect(e, 'right'));

    btnSwap.addEventListener('click', swapLanguages);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.lang-control') && !e.target.closest('.split-btn-container')) {
            closeAllPopovers();
        }
    });

	// 即時翻譯事件
    textInput.addEventListener('input', () => {
        autoResizeTextarea(textInput);
        
        if (isInstantTranslate) {
            triggerTranslation('translate');
        }
    });

    // 即時翻譯控制
    chkInstantTranslate.addEventListener('change', () => {
        isInstantTranslate = chkInstantTranslate.checked;
        updateInstantTranslateUI();
        saveInstantTranslateState();
        if (isInstantTranslate) {
            // 剛開啟即時翻譯時，執行一次 'translate'
            triggerTranslation('translate');
        }
    });

    // 手動翻譯按鈕 (主按鈕)
    btnManualTranslateAction.addEventListener('click', () => {
        // 主按鈕永遠觸發 'translate' 動作
        triggerTranslation('translate');
    });

	// 手動翻譯選項 (下拉按鈕)
	btnManualTranslateToggle.addEventListener('click', (e) => {
		e.stopPropagation(); // 防止事件冒泡觸發 document 的點擊事件

		// 1. 獨立切換
		const isHidden = popoverTranslateOptions.classList.contains('hidden');

		// 2. 先關閉所有的 popover (包含自己)
		closeAllPopovers();

		// 3. 如果原本是隱藏的，就把它打開
		if (isHidden) {
			popoverTranslateOptions.classList.remove('hidden');
		}
		// 如果原本是開啟的，第二步的 closeAllPopovers() 就會處理掉，這裡什麼都不用做
	});

    // 手動翻譯選項 (popover 內部點擊)
    popoverTranslateOptions.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn || btn.disabled) return;
        
        const action = btn.dataset.action;
        if (!action) return;

        // 1. 更新全域狀態 (用於下次選單打開時的 active 狀態)
        currentTranslateAction = action;
        
        // 2. (已移除) 不再更新主按鈕的文字
        // btnManualTranslateAction.textContent = btn.textContent;
        
        // 3. 更新彈出選單中的 'active' 樣式
        popoverTranslateOptions.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 4. 關閉選單
        popoverTranslateOptions.classList.add('hidden');

        // 5. 觸發使用者點擊的特定動作 ('segment', 'space', 或 'translate')
        triggerTranslation(action); 
    });

    // 工具列按鈕
    btnClearInput.addEventListener('click', () => {
        textInput.value = '';
        autoResizeTextarea(textInput);
        showToast('已清除輸入內容');
    });

    btnClearOutput.addEventListener('click', () => {
        textOutput.value = '';
        autoResizeTextarea(textOutput);
        showToast('已清除輸出內容');
    });

    btnCopyInput.addEventListener('click', () => {
        if (!textInput.value) return;
        navigator.clipboard.writeText(textInput.value).then(() => {
            showToast('已複製來源文字');
        });
    });

    btnCopyOutput.addEventListener('click', () => {
        if (!textOutput.value) return;
        navigator.clipboard.writeText(textOutput.value).then(() => {
            showToast('已複製翻譯結果');
        });
    });

	// --- 側邊欄事件 ---
    function openSidebar() {
        settingsSidebar.classList.remove('hidden');
        settingsBackdrop.classList.remove('hidden');
    }
    function closeSidebar() {
        settingsSidebar.classList.add('hidden');
        settingsBackdrop.classList.add('hidden');
    }

    btnOpenSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        openSidebar();
    });

    btnCloseSettings.addEventListener('click', closeSidebar);
    settingsBackdrop.addEventListener('click', closeSidebar);
    
    // 儲存設定
    inputDelimiter.addEventListener('input', () => {
        translationDelimiter = inputDelimiter.value;
        saveDelimiterState();
    });

	selectPivotLang.addEventListener('change', () => {
        currentPivotLang = selectPivotLang.value;
        savePivotLangState();
        console.log(`[Pivot] 中介語言變更為: ${currentPivotLang}`);
    });


	// --- 查詢模式事件監聽 ---
    if (btnSearchAction) {
        btnSearchAction.addEventListener('click', performSearch);
    }

    if (searchInput) {
        // 讓使用者按下 Enter 鍵也能觸發搜尋
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }

    // 上一頁
    if (btnPrevPage) {
        btnPrevPage.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderSearchResults();
                // 翻頁後自動捲動回搜尋結果頂部
                document.getElementById('searchContainer').scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // 下一頁
    if (btnNextPage) {
        btnNextPage.addEventListener('click', () => {
            const totalPages = Math.ceil(currentSearchResults.length / ITEMS_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage++;
                renderSearchResults();
                document.getElementById('searchContainer').scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // --- 6. 初始化 ---

    loadState(); // 載入狀態
    updateLanguageButtons(); // 更新按鈕文字
    populatePopovers(); // 產生選單
	preloadDictionaries(langLeft, langRight); // 預先載入預設語言

	// --- 頁面載入時和視窗大小改變時，重設高度 ---
    // 延遲執行，確保字體和佈局載入完成
    setTimeout(() => {
        autoResizeTextarea(textInput);
        autoResizeTextarea(textOutput);
    }, 100); 

    window.addEventListener('resize', () => {
        autoResizeTextarea(textInput);
        autoResizeTextarea(textOutput);
    });
    
    // 如果輸入框有內容且設定為自動，則觸發一次翻譯
    if (isInstantTranslate && textInput.value.trim() !== '') {
        // 延遲一點執行，確保字典載入函式已準備好
        setTimeout(() => triggerTranslation('translate'), 100);
    }
});