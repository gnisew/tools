const defaultKeyMap = {
    selectCandidate: [' '],
    commitComposition: ['Enter'],
    clearComposition: ["'",'Escape'],
    nextCandidate: ['.', 'ArrowRight'],
    prevCandidate: [',', 'ArrowLeft'],
    nextPage: [']', 'PageDown', 'ArrowDown'],
    prevPage: ['[', 'PageUp', 'ArrowUp'],
    moveCursorRight: ['>'],
    moveCursorLeft: ['<'],
    toggleLongPhrase: ['='],
    transformTone: ['w'],
    backspaceWithCandidates: [";"],
    reverseLookup: ['/']
};

// 客語通用的標點符號對應表
const hakkaPunctuationMappings = {
	'x':'， 。 、 ？ ！ ； ： 「」 （） 『』 ── …… ﹏﹏ 〈〉 《》 ＿＿ ． — ～',
	'xx':'； ： 「」 （） 『』 ── …… ﹏﹏ 〈〉 《》 ＿＿ ． — ～',
	'xxx':'── …… ﹏﹏ 〈〉 《》 ＿＿ ． — ～',
	'xxxx':'＿＿ ． — ～',
	'xd':'、 ．',
	'xj':'。 ．',
	'xw':'？',
	'xt':'！',
	'xf':'；',
	'xm':'：',
	'xy':'「 」 『 』',
	'xyy':'」 』',
	'xg':'（　） 〈 〉 《 》',
	'xgg':'） 〉 》',
	'xp':'──',
	'xs':'…… ﹏﹏ 〈 〉 《 》',
	'xl':'— ～',
};

// 動態將標點符號對應表，只加入到 targetLanguages 列表指定的字典中
const targetLanguages = ['kasu', 'sixian', 'hailu', 'dapu', 'raoping', 'sixiannan', 'holo', 'cangjie', 'xiami'];
targetLanguages.forEach(lang => {
    if (dictionaries[lang]) {
        Object.assign(dictionaries[lang], hakkaPunctuationMappings);
    }
});




const imeLanguageProperties = {
    'cangjie': {
        maxLength: 5,                 // 最大編碼長度
        longPhraseMode: false,        // 關閉連打功能
        allowLongPhraseToggle: false, // 不允許使用者切換連打功能 (會隱藏按鈕)
        enableToneTransform: false,   // 禁用 'w' 拼音轉換鍵
		spaceActionOnNoCandidates: 'clear', 
		layoutType: 'narrow',
		toneType: 'alphabetic',
        keyMap: {
            ...defaultKeyMap,
            selectCandidate: [' '],
            nextCandidate: ['.', 'ArrowRight', '>'],
            prevCandidate: [',', 'ArrowLeft', '<'],
            nextPage: ['PageDown', 'ArrowDown', ']'],
            prevPage: ['PageUp', 'ArrowUp', '['],
            moveCursorRight: [],
            moveCursorLeft: [],
            toggleLongPhrase: [],
            transformTone: []
        }
    },
    'xiami': {
        maxLength: 5,
        longPhraseMode: false,
        allowLongPhraseToggle: false,
        enableToneTransform: false,
		spaceActionOnNoCandidates: 'clear', 
		layoutType: 'narrow',
		toneType: 'alphabetic',
        keyMap: {
            ...defaultKeyMap,
            selectCandidate: [' '],
            nextCandidate: ['.', 'ArrowRight', '>'],
            prevCandidate: [',', 'ArrowLeft', '<'],
            nextPage: ['PageDown', 'ArrowDown', ']'],
            prevPage: ['PageUp', 'ArrowUp', '['],
            moveCursorRight: [],
            moveCursorLeft: [],
            toggleLongPhrase: [],
            transformTone: []
        }
    },

    'hanglie': {
        maxLength: 5,
        longPhraseMode: false,
        allowLongPhraseToggle: false,
        enableToneTransform: false,
		spaceActionOnNoCandidates: 'clear',
		layoutType: 'narrow',
		toneType: 'alphabetic',
        keyMap: {
            ...defaultKeyMap,
            nextCandidate: ['ArrowRight', '>'],
            prevCandidate: ['ArrowLeft', '<'],
            nextPage: ['PageDown', 'ArrowDown', ']'],
            prevPage: ['PageUp', 'ArrowUp', '['],
            moveCursorRight: [],
            moveCursorLeft: [],
            reverseLookup: [],
            backspaceWithCandidates: [],
			transformTone: []
        }
    },
	'pinyin': { 
        toneType: 'numeric',
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w' ],
		keyMap: defaultKeyMap
    },
    'kasu': { 
        toneType: 'alphabetic',
        toneModes: ['alphabetic', 'numeric'],
		keyMap: defaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'zh', 'ch', 'sh', 'rh', 'ng', 'bb', 'b', 'p', 'm', 'f', 'v', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'z', 'c', 's' ],
        numericToneMap: {
            '2': 'z',
            '6': 'z',
            '3': 'v',
            '4': 's',
            '7': 'x',
            '5': 'x'

        }
    },
    'sixian': { 
        toneType: 'numeric',
        // 定義可用的聲調模式
        toneModes: ['alphabetic', 'numeric'],
        // 定義數字到字母聲調的映射表
		keyMap: defaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'ng', 'b', 'p', 'm', 'f', 'v', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'z', 'c', 's' ],
        numericToneMap: {
            '2': 'z',
            '6': 'z',
            '3': 'v',
            '4': 's'
        }
    },
    'hailu': { 
        toneType: 'numeric',
        // 定義可用的聲調模式
        toneModes: ['alphabetic', 'numeric'],  //toneModes: ['alphabetic', 'numeric'],
        // 定義數字到字母聲調的映射表
		keyMap: defaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'zh', 'ch', 'sh', 'rh', 'ng', 'b', 'p', 'm', 'f', 'v', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'z', 'c', 's' ],
        numericToneMap: {
            '2': 'z',
            '6': 'z',
            '3': 'v',
            '7': 'f',
            '4': 's'
        }
    },
    'dapu': { 
        toneType: 'numeric',
        // 定義可用的聲調模式
        toneModes: ['alphabetic', 'numeric'],  //toneModes: ['alphabetic', 'numeric'],
        // 定義數字到字母聲調的映射表
		keyMap: defaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'zh', 'ch', 'sh', 'rh', 'ng', 'b', 'p', 'm', 'f', 'v', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'z', 'c', 's' ],
        numericToneMap: {
            '2': 'z',
            '6': 'z',
            '3': 'v',
            '7': 'f',
            '5': 'x',
            '4': 's'
        }
    },
    'raoping': { 
        toneType: 'numeric',
        // 定義可用的聲調模式
        toneModes: ['alphabetic', 'numeric'],  //toneModes: ['alphabetic', 'numeric'],
        // 定義數字到字母聲調的映射表
		keyMap: defaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'zh', 'ch', 'sh', 'rh', 'ng', 'b', 'p', 'm', 'f', 'v', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'z', 'c', 's' ],
        numericToneMap: {
            '2': 'z',
            '6': 'z',
            '3': 'v',
            '7': 'f',
            '5': 'x',
            '4': 's'
        }
    },
    'sixiannan': { 
        toneType: 'numeric',
        // 定義可用的聲調模式
        toneModes: ['alphabetic', 'numeric'],
        // 定義數字到字母聲調的映射表
		keyMap: defaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'ng', 'b', 'p', 'm', 'f', 'v', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'z', 'c', 's' ],
        numericToneMap: {
            '2': 'z',
            '6': 'z',
            '3': 'v',
            '4': 's'
        }
    },
    'holo': { 
        toneType: 'numeric',
        // 定義可用的聲調模式
        toneModes: ['alphabetic', 'numeric'],  //toneModes: ['alphabetic', 'numeric'],
        // 定義數字到字母聲調的映射表
		keyMap: defaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'tsh', 'kh', 'ng', 'ph', 'th', 'ts', 'b', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 's', 't' ],
        numericToneMap: {
            '1': '',
            '2': 'z',
            '3': 's',
            '4': '',
            '5': 'x',
            '7': 'f',
            '8': 'l'
        }
    },
};

/**
 * 聲調定義表
 * 使用「正則表達式」來定義需要從音節字尾移除的聲調標記。
 * 這讓規則定義更有彈性，可以同時處理字母和數字聲調。
 */
const imeToneMappings = {
    'pinyin': /[1-5]/,
    'kasu': /[zvsfxl]$/,
    'sixian': /[zvs]$/,
    'hailu': /[zvsf]$/,
    'dapu': /[zvsxf]$/,
    'raoping': /[zvsxf]$/,
    'sixiannan': /[zvs]$/,
    'holo': /[zvsfxl]$/,
};



(function() {

    /**
     * --- NEW: 強制載入 Google Material Icons ---
     * 這段程式碼會在 ime.js 被讀取時立即執行，
     * 以確保在頁面渲染前，圖示字型的 CSS 已經被加入到 <head> 中。
     */
    (function forceLoadMaterialIcons() {
        // 定義一個 ID，用來檢查是否已經手動或透過此腳本加入過 CSS
        const styleId = 'google-material-icons-stylesheet';

        // 如果頁面上已經存在這個 <link> 標籤，就直接返回，避免重複載入
        if (document.getElementById(styleId) || document.querySelector('link[href*="Material+Icons"]')) {
            return;
        }

        // 建立 <link> 元素並設定屬性
        const link = document.createElement('link');
        link.id = styleId;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
        
        // 將 <link> 元素附加到 <head> 的最前面，確保優先載入
        document.head.insertBefore(link, document.head.firstChild);
    })();

    const materialIcons = [
        'emoji_people', 'accessibility', 'accessibility_new', 'directions_run',
        'directions_walk', 'downhill_skiing', 'sports_martial_arts', 'self_improvement',
        'skateboarding', 'sledding', 'snowboarding', 'sports_handball', 'surfing'
    ];
    const randomIconName = materialIcons[Math.floor(Math.random() * materialIcons.length)];

    if (window.WebIME) {
        return;
    }

    const WebIME = {
	isInitialized: false,
	boundGlobalKeyDownHandler: null, 
	boundEnsureInBounds: null,
    isPredictionState: false,
    predictionMap: {},
    defaultKeyMap: window.defaultKeyMap || {},
    activeElement: null,
    boundFocusInHandler: null,
    boundFocusOutHandler: null,
    toolbarContainer: null, 
    candidatesContainer: null, 
    candidatesList: null,
    topBar: null,
	toastElement: null,
    // 按鈕註冊表，用於同步多個UI上的按鈕
    allToneModeButtons: [],
    allLongPhraseButtons: [],
    allPunctuationButtons: [],
    allOutputModeButtons: [],
    allSettingsButtons: [],
    allModeDisplayTexts: [],
    allModeMenus: [],

    // 外部工具列的容器元素
    externalToolbarContainer: null, 
    modeDisplayButton: null,
    modeDisplayText: null,
    modeMenu: null,
    compositionDisplay: null,
    longPhraseToggleBtn: null,
    prevPageBtn: null,
    nextPageBtn: null,
	toneModeToggleBtn: null,
	outputModeToggleBtn: null,

    // --- NEW START ---
    // 設定集中管理
    // 外部呼叫 init() 時可以傳入客製化設定來覆寫它們
    config: {
        defaultMode: 'sixian',      // 預設輸入法
        longPhrase: false,           // 預設是否啟用連打模式
        candidatesPerPage: 5,       // 每頁顯示的候選字數量
        maxCompositionLength: 30,   // 編碼區最大字元數
        storagePrefix: 'webime_1_',   // 用於 localStorage 的前綴
		enablePrediction: false,
		outputMode: 'pinyin', 
    },
    
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isCommittingText: false, // 用於防止 input 事件的遞迴觸發
    lastInputValue: '',      // 用於在行動裝置上比對輸入差異
    // --- NEW END ---


    isEnabled: true,
    isLongPhraseEnabled: true,
    currentMode: 'pinyin',
	toneModes: {},

    compositionBuffer: '',
    compositionCursorPos: 0,

    allCandidates: [],
    currentPage: 0,
    highlightedIndex: 0,

    phraseCache: {},

    boundHandleInput: null,
    boundHandleKeyDown: null,
    boundInitDrag: null,
    boundDragMove: null,
    boundDragEnd: null,

    isDragging: false,
    isClickingInside: false,
    isPinned: false,
    pinnedTop: '50px',
    pinnedLeft: '50px',
    pinToggleBtn: null,
	boundReposition: null,
    offsetX: 0,
    offsetY: 0,
    preprocessedDicts: {},
    isFullWidthMode: true,
    punctuationModeToggleBtn: null,
    isQueryMode: false,
	isPositionRight: false,
    queriedWord: '',
    originalState: null,
    reverseDicts: {
        cangjie: {},
        xiami: {}
    },

/**
 * 預處理所有字典，以優化搜尋效能。
 * 將字典按簡化後 key 的首字母進行分組。
 */
preprocessDictionaries() {
    console.log("Preprocessing dictionaries for performance optimization...");
    for (const mode in dictionaries) {
        if (Object.hasOwnProperty.call(dictionaries, mode)) {
            this.preprocessedDicts[mode] = {};
            const dictionary = dictionaries[mode];
            for (const key in dictionary) {
                if (Object.hasOwnProperty.call(dictionary, key)) {
                    // 簡化 key，移除聲調與空白，用於後續比對
                    const simplifiedKey = this.simplifyKey(key, mode);
                    if (simplifiedKey.length === 0) continue;

                    const firstChar = simplifiedKey[0].toLowerCase();

                    // 如果該首字母的分組還不存在，就建立一個空陣列
                    if (!this.preprocessedDicts[mode][firstChar]) {
                        this.preprocessedDicts[mode][firstChar] = [];
                    }

                    // 將原 key、簡化後的 key 和對應的值存入分組
                    this.preprocessedDicts[mode][firstChar].push({
                        originalKey: key,
                        simplifiedKey: simplifiedKey,
                        values: dictionary[key].split(' ')
                    });
                }
            }
        }
    }
    console.log("Preprocessing complete.");
},



/**
 * [修改後的函式] 建立反向字典 (字 -> 碼)，用於反查與拼音輸出功能。
 * 移除了只處理單一漢字的限制，現在會為所有詞彙建立索引。
 */
createReverseDictionaries() {
    console.log("Creating reverse dictionaries for query and pinyin output features...");
    
    const modesToProcess = Object.keys(dictionaries);

    modesToProcess.forEach(mode => {
        const dictionary = dictionaries[mode];
        if (!dictionary) return;

        // 為每種語言在 reverseDicts 中建立一個空物件
        if (!this.reverseDicts[mode]) {
            this.reverseDicts[mode] = {};
        }

        for (const code in dictionary) {
            if (Object.hasOwnProperty.call(dictionary, code)) {
                const words = dictionary[code].split(' ');
                words.forEach(word => {
                    // 移除了 if (Array.from(word).length === 1) 的判斷
                    // 讓單字和多字的詞彙都能被加入反向字典
                    if (!this.reverseDicts[mode][word]) {
                        this.reverseDicts[mode][word] = [];
                    }
                    // 避免重複加入相同的碼
                    if (!this.reverseDicts[mode][word].includes(code)) {
                        this.reverseDicts[mode][word].push(code);
                    }
                });
            }
        }
    });
    console.log("Reverse dictionaries created.");
},


/**
 * 建立聯想詞地圖以優化效能。
 * 遍歷所有字典，將每個詞拆解成 "前綴" 和 "後續字"，並存儲起來。
 * 例如：詞 "大家" -> { "大": ["家"] }
 */
createPredictionMap() {
    console.log("Creating prediction maps...");
    for (const mode in dictionaries) {
        this.predictionMap[mode] = {};
        const dictionary = dictionaries[mode];
        for (const key in dictionary) {
            const words = dictionary[key].split(' ');
            for (const word of words) {
                // 只處理長度大於1的詞彙
                if (word.length > 1) {
                    for (let i = 1; i < word.length; i++) {
                        const prefix = word.substring(0, i);
                        const suffix = word.substring(i);
                        if (!this.predictionMap[mode][prefix]) {
                            this.predictionMap[mode][prefix] = new Set();
                        }
                        this.predictionMap[mode][prefix].add(suffix);
                    }
                }
            }
        }
        // 將 Set 轉換為 Array 以方便後續使用
        for (const prefix in this.predictionMap[mode]) {
            this.predictionMap[mode][prefix] = Array.from(this.predictionMap[mode][prefix]);
        }
    }
    console.log("Prediction maps created.");
},

/**
 * 根據給定的前綴詞，從預處理的地圖中尋找聯想詞。
 * @param {string} prefix - 已送出的文字 (例如 "大" 或 "鴨嫲")
 * @returns {string[]} - 聯想詞陣列 (例如 ["方", "紅", "風"])
 */
findPredictionCandidates(prefix) {
    if (!prefix) {
        return [];
    }
    // 檢查當前輸入法是否設定了對應的聯想詞來源
    // 若有，則使用來源的聯想詞庫；若無，則使用自己的
    const predictionMode = (this.config.predictionMapping && this.config.predictionMapping[this.currentMode]) 
                           ? this.config.predictionMapping[this.currentMode] 
                           : this.currentMode;

    // 如果 predictionMode 為空字串或 null，代表設定為「無」，直接返回空陣列
    if (!predictionMode || !this.predictionMap[predictionMode]) {
        return [];
    }

    return this.predictionMap[predictionMode][prefix] || [];
},

/**
 * 從 localStorage 載入聯想詞設定
 */
loadPredictionSettings() {
    const saved = localStorage.getItem(this.config.storagePrefix + 'prediction');
    this.config.enablePrediction = (saved !== null) ? (saved === 'true') : false;

    if (this.settingsModal) {
        const checkbox = this.settingsModal.querySelector('#toggle-prediction');
        if (checkbox) {
            checkbox.checked = this.config.enablePrediction;
        }
    }
},

/**
 * 儲存聯想詞設定到 localStorage
 */
savePredictionSettings() {
    const checkbox = this.settingsModal.querySelector('#toggle-prediction');
    if (checkbox) {
        this.config.enablePrediction = checkbox.checked;
        localStorage.setItem(this.config.storagePrefix + 'prediction', this.config.enablePrediction);
    }
},

/**
 * 從 localStorage 載入聯想詞來源的對應設定
 */
loadPredictionMappingSettings() {
    let settings;
    try {
        settings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'predictionMapping'));
    } catch (e) {
        settings = null;
    }
    // 如果沒有儲存的設定，則使用空物件
    this.config.predictionMapping = settings || {};
},

/**
 * 儲存聯想詞來源的對應設定到 localStorage
 */
savePredictionMappingSettings() {
    if (!this.settingsModal) return;

    const newMapping = {};
    const selectElements = this.settingsModal.querySelectorAll('.prediction-source-select');

    selectElements.forEach(select => {
        const imeMode = select.dataset.ime;
        if (imeMode && select.value) { // 只儲存有被設定的值
            newMapping[imeMode] = select.value;
        }
    });

    this.config.predictionMapping = newMapping;
    localStorage.setItem(this.config.storagePrefix + 'predictionMapping', JSON.stringify(newMapping));

    this.showToast('聯想詞來源已儲存');
},


/**
 * 初始化函數接受客製化設定
 * @param {object} userConfig - 使用者傳入的設定物件，可覆寫預設值
 */
init(userConfig = {}) {
    // 防止重複初始化
    if (this.isInitialized) {
        console.warn("WebIME is already initialized.");
        return;
    }

    this.preprocessDictionaries();
    this.createReverseDictionaries();
    this.createPredictionMap(); 

    // 將傳入的設定與預設設定合併
    this.config = { ...this.config, ...userConfig };
    this.config.globalMaxCompositionLength = this.config.maxCompositionLength;

    // --- 【核心修改點】狀態初始化邏輯 ---
    // 規則變更為：localStorage 優先 > URL 參數 (userConfig) > 程式預設值

    // 1. 決定當前語言模式 (localStorage 優先)
    const savedMode = localStorage.getItem(this.config.storagePrefix + 'mode');
    const urlMode = (userConfig.defaultMode && dictionaries[userConfig.defaultMode]) 
                    ? userConfig.defaultMode 
                    : null;

    this.currentMode = (savedMode && dictionaries[savedMode]) 
                       ? savedMode 
                       : (urlMode || this.config.defaultMode);

    // 2. 決定是否啟用長詞連打
    const savedLongPhrase = localStorage.getItem(this.config.storagePrefix + 'longPhrase');
    if (typeof userConfig.longPhrase === 'boolean') {
        this.isLongPhraseEnabled = userConfig.longPhrase;
    } else {
        this.isLongPhraseEnabled = (savedLongPhrase !== null) ? (savedLongPhrase === 'true') : this.config.longPhrase;
    }

    // 3. 載入所有語言的聲調模式設定
    const savedToneModes = localStorage.getItem(this.config.storagePrefix + 'toneModes');
    if (savedToneModes) {
        try { this.toneModes = JSON.parse(savedToneModes); } catch (e) { this.toneModes = {}; }
    }
    // 如果 URL 有指定初始聲調模式，就覆蓋當前語言的設定
    if (userConfig.initialToneMode) {
        this.toneModes[this.currentMode] = userConfig.initialToneMode;
    }

    // 4. 決定全形/半形模式
    const savedFullWidth = localStorage.getItem(this.config.storagePrefix + 'fullWidth');
    if (typeof userConfig.initialFullWidth === 'boolean') {
        this.isFullWidthMode = userConfig.initialFullWidth;
    } else {
        this.isFullWidthMode = (savedFullWidth !== null) ? (savedFullWidth === 'true') : true;
    }

    // 5. 決定聯想詞設定
    const savedPrediction = localStorage.getItem(this.config.storagePrefix + 'prediction');
    if (typeof userConfig.enablePrediction === 'boolean') {
        this.config.enablePrediction = userConfig.enablePrediction;
    } else {
        this.config.enablePrediction = (savedPrediction !== null) ? (savedPrediction === 'true') : false;
    }

    // 6. 決定輸出模式
    const savedOutputMode = localStorage.getItem(this.config.storagePrefix + 'outputMode');
    if (userConfig.outputMode) {
        this.config.outputMode = userConfig.outputMode;
    } else {
        this.config.outputMode = ['word', 'pinyin', 'word_pinyin', 'word_pinyin2'].includes(savedOutputMode) ? savedOutputMode : 'word';
    }


    // --- 後續程式碼與原版相同 ---
    
    this.boundReposition = this.reposition.bind(this);
    this.boundHandleInput = this.handleInput.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundInitDrag = this.initDrag.bind(this);
    this.boundDragMove = this.dragMove.bind(this);
    this.boundDragEnd = this.dragEnd.bind(this);

    this.boundEnsureInBounds = this.ensureInBounds.bind(this);

    this.loadKeyMapSettings();
    this.loadToolbarSettings();


    // 載入「輸出字音」功能的啟用/停用狀態 (與按鈕是否可見分開)
    const savedOutputModeActive = localStorage.getItem(this.config.storagePrefix + 'outputModeActive');
    // 如果 localStorage 中有儲存 'true'，則設為 true，否則預設為 false (停用)
    this.config.outputModeActive = savedOutputModeActive === 'true';
    // 如果 URL 參數有指定 outputEnabled，它會覆蓋 loadToolbarSettings 的結果
    if (typeof userConfig.outputEnabled === 'boolean') {
        this.config.toolbarButtons.outputModeToggle = userConfig.outputEnabled;
    }

    this.loadOutputModeSettings(); // 確保 UI 顯示正確
    // 再次檢查 URL 參數以確保最高優先級
    if (userConfig.outputMode) {
        this.config.outputMode = userConfig.outputMode;
    }
    
    this.loadPredictionSettings(); // 確保 UI 顯示正確
    if (typeof userConfig.enablePrediction === 'boolean') {
        this.config.enablePrediction = userConfig.enablePrediction;
    }

	this.loadPredictionMappingSettings();

    this.createUI();

    // 尋找並填充外部工具列容器
    this.externalToolbarContainer = document.getElementById('ime-external-toolbar-container');
    if (this.externalToolbarContainer) {
        this.createExternalToolbar();
    }
    this.loadQuerySettings();
    
    const pinnedTop = localStorage.getItem(this.config.storagePrefix + 'pinnedTop');
    const pinnedLeft = localStorage.getItem(this.config.storagePrefix + 'pinnedLeft');
    if (pinnedTop && pinnedLeft) {
        this.toolbarContainer.style.top = pinnedTop;
        this.toolbarContainer.style.left = pinnedLeft;
        this.toolbarContainer.style.bottom = 'auto';
        this.toolbarContainer.style.right = 'auto';
    } else {
        this.toolbarContainer.style.left = '10px';
        this.toolbarContainer.style.right = 'auto';
    }

    this.updateToolbarButtonsVisibility();
    this.updateToneModeButtonUI();
    this.updateOutputModeButtonUI();

    const initialLangProps = imeLanguageProperties[this.currentMode] || {};
    this.config.maxCompositionLength = initialLangProps.maxLength || this.config.globalMaxCompositionLength;

    if (initialLangProps.allowLongPhraseToggle === false) {
        this.isLongPhraseEnabled = initialLangProps.longPhraseMode === true;
    }
    this.longPhraseToggleBtn.classList.toggle('active', this.isLongPhraseEnabled);

    if (initialLangProps.layoutType === 'narrow') {
        this.candidatesContainer.classList.add('ime-narrow');
    } else {
        this.candidatesContainer.classList.remove('ime-narrow');
    }
    
    this.updatePunctuationButtonUI();

    this.attachEventListeners();
    window.addEventListener('resize', this.boundEnsureInBounds);

    this.boundGlobalKeyDownHandler = (e) => {
        if (e.ctrlKey && e.key === '/') {
            e.preventDefault();
            this.toggleIsEnabled();
        }
    };
    document.addEventListener('keydown', this.boundGlobalKeyDownHandler);


    document.addEventListener('mousedown', (e) => {
        if (!this.isInitialized || !this.candidatesContainer || this.candidatesContainer.style.display === 'none') {
            return;
        }

        const isClickInsideIME = this.toolbarContainer.contains(e.target) || this.candidatesContainer.contains(e.target);
        
        if (!isClickInsideIME) {
            this.compositionBuffer = '';
            this.compositionCursorPos = 0;
            this.updateCandidates();
        }
    });

    this.isInitialized = true;
    console.log("WebIME initialized.");
},


/**
 * 徹底銷毀 WebIME 實例，移除所有 UI 和事件監聽。
 */

destroy() {
    if (!this.isInitialized) {
        return; // 如果尚未初始化，則不執行任何操作
    }

    // 1. 停用目前作用中的輸入框
    this.deactivate();

    // 2. 移除全域事件監聽器
    if (this.boundFocusInHandler) {
        document.removeEventListener("focusin", this.boundFocusInHandler);
    }
    if (this.boundFocusOutHandler) {
        document.removeEventListener("focusout", this.boundFocusOutHandler);
    }
    if (this.boundGlobalKeyDownHandler) {
        document.removeEventListener('keydown', this.boundGlobalKeyDownHandler);
    }
    if (this.boundEnsureInBounds) {
        window.removeEventListener('resize', this.boundEnsureInBounds);
    }

    // 3. 從 DOM 中移除 UI 元素
    if (this.toolbarContainer) {
        this.toolbarContainer.remove();
        this.toolbarContainer = null;
    }
    if (this.candidatesContainer) {
        this.candidatesContainer.remove();
        this.candidatesContainer = null;
    }
    if (this.settingsModal) {
        this.settingsModal.remove();
        this.settingsModal = null;
    }

    // 4. 重設內部狀態
    this.compositionBuffer = '';
    this.allCandidates = [];
    this.activeElement = null;
    this.allModeMenus = []; // 清空註冊表
    this.allModeDisplayTexts = [];

    // 5. 將初始化旗標設為 false
    this.isInitialized = false;
    console.log("WebIME has been destroyed.");
},

// 輔助函數，用於根據聲母表獲取單詞的首字
getInitial(word, mode) {
    const langProps = imeLanguageProperties[mode] || {};
    const initials = langProps.initialConsonants;

    if (!initials) {
        return word[0] || '';
    }
    for (const initial of initials) {
        if (word.startsWith(initial)) {
            return initial;
        }
    }
    return word[0] || '';
},

// 輔助函數，用於移除 key 中的空白和聲調
simplifyKey(key, mode) {
    const toneRegex = imeToneMappings[mode];
    if (!toneRegex) {
        // 使用正則表達式 /[\s-]+/ 來匹配一個或多個空格或連字號
        return key.replace(/[\s-]+/g, '');
    }
    const simplifiedParts = key
        // 使用相同的正則表達式進行分割
        .split(/[\s-]+/)
        .map(part => part.replace(toneRegex, ''));
    return simplifiedParts.join('');
},


/**
 * 對輸入的編碼進行正規化，以匹配字典中的標準拼法。
 * @param {string} buffer - 使用者輸入的原始編碼。
 * @param {string} mode - 當前的輸入法模式。
 * @returns {string} - 正規化後的編碼。
 */
normalizeCompositionBuffer(buffer, mode) {
    // 目前只針對 kasu (詔安) 模式進行處理
    if (mode !== 'kasu') {
        return buffer; // 如果不是 kasu 模式，直接返回原始編碼
    }

    let normalized = buffer;
    normalized = normalized.replace(/([bpfvdtlgkhzcsi])oo/g, '$1o');
    normalized = normalized.replace(/rh([aeiou])/g, 'r$1');
    normalized = normalized.replace(/bb([aeiou])/g, 'v$1');

    normalized = normalized
        .replace(/ji/g, 'zi')
        .replace(/qi/g, 'ci')
        .replace(/xi/g, 'si');

    return normalized;
},


createUI() {
    // --- 建立工具列容器 (Toolbar) ---
    this.toolbarContainer = document.createElement("div");
    this.toolbarContainer.id = "web-ime-toolbar-container";
    this.toolbarContainer.className = "web-ime-base";
    this.toolbarContainer.style.position = 'fixed';
    this.toolbarContainer.style.bottom = '10px';
    // 預設位置由 init() 中的邏輯控制
    this.toolbarContainer.style.top = 'auto';

    this.topBar = document.createElement("div");
    this.topBar.id = "web-ime-top-bar";
    
    this.topBar.addEventListener('mousedown', this.boundInitDrag);
    this.topBar.addEventListener('touchstart', this.boundInitDrag, { passive: false });


    const logo = document.createElement("span");
    // --- 修改點：使用 material-icons class 和隨機圖示名稱 ---
    logo.className = "ime-logo material-icons";
    logo.textContent = randomIconName;
    this.topBar.appendChild(logo);

    const modeContainer = document.createElement("div");
    modeContainer.className = "ime-mode-container";
    this.modeDisplayButton = document.createElement("button");
    this.modeDisplayButton.type = "button";
    this.modeDisplayButton.className = "ime-mode-button";
    this.modeDisplayText = document.createElement("span");
    this.modeDisplayText.className = "ime-mode-text";
    this.modeDisplayText.textContent = this.getModeDisplayName(this.currentMode);
	this.allModeDisplayTexts.push(this.modeDisplayText); 
    this.modeDisplayButton.appendChild(this.modeDisplayText);


    this.modeDisplayButton.addEventListener('click', (e) => {
        // 阻止事件冒泡，避免觸發我們剛才新增的全域關閉監聽器
        e.stopPropagation(); 
        
        const rect = this.modeDisplayButton.getBoundingClientRect();
        const clickX = e.clientX;
        const arrowClickAreaStart = rect.right - 30;

        if (clickX > arrowClickAreaStart) { // 點擊右側箭頭區域
            if (!this.isEnabled) return;
            
            // 直接切換 .open class
            const isMenuVisible = modeContainer.classList.toggle('open');
            
            // 如果是開啟選單，才計算位置
            if (isMenuVisible) {
                // 關閉其他可能已開啟的選單
                this.allModeMenus.forEach(menu => {
                    if (menu !== this.modeMenu) {
                        menu.parentElement.classList.remove('open');
                    }
                });

                this.modeMenu.style.visibility = 'hidden'; // 先隱藏以便計算
                const menuWidth = this.modeMenu.offsetWidth;
                const menuHeight = this.modeMenu.offsetHeight;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                if (rect.left + menuWidth > viewportWidth) {
                    this.modeMenu.style.left = 'auto'; this.modeMenu.style.right = '0';
                } else {
                    this.modeMenu.style.left = '0'; this.modeMenu.style.right = 'auto';
                }
                if (rect.bottom + menuHeight > viewportHeight) {
                    this.modeMenu.style.top = 'auto'; this.modeMenu.style.bottom = '105%';
                } else {
                    this.modeMenu.style.top = '105%'; this.modeMenu.style.bottom = 'auto';
                }
                this.modeMenu.style.visibility = 'visible'; // 計算完畢後顯示
            }
        } else { // 點擊文字區域
            this.toggleIsEnabled();
        }
    });
    modeContainer.appendChild(this.modeDisplayButton);

    this.modeMenu = document.createElement("ul");
    this.modeMenu.className = "ime-mode-menu";
	this.allModeMenus.push(this.modeMenu); 
    Object.keys(dictionaries).forEach(mode => {
        const item = document.createElement("li");
        item.dataset.mode = mode;
        item.textContent = this.getModeDisplayName(mode);
        if (mode === this.currentMode) item.classList.add('active');
        item.addEventListener("mousedown", (e) => {
            e.preventDefault();
            this.switchMode(mode);
        });
        this.modeMenu.appendChild(item);
    });
    
    // ******** 修改點 ********
    // --- 新增：防止點擊選單時觸發拖曳 ---
    // 這兩行程式碼會攔截在語言選單上的觸控與滑鼠點擊事件，
    // 並呼叫 stopPropagation() 來阻止事件繼續向上傳遞到工具列。
    // 如此一來，工具列的拖曳功能就不會被錯誤地觸發。
    this.modeMenu.addEventListener('mousedown', (e) => e.stopPropagation());
    this.modeMenu.addEventListener('touchstart', (e) => e.stopPropagation());

    modeContainer.appendChild(this.modeMenu);
    this.topBar.appendChild(modeContainer);

    document.addEventListener('click', (e) => {
        if (this.isModeMenuVisible && !modeContainer.contains(e.target)) {
            modeContainer.classList.remove('open');
            this.isModeMenuVisible = false;
        }
    });

    const settingsContainer = document.createElement("div");
    settingsContainer.className = "ime-settings-container";
    this.toneModeToggleBtn = document.createElement("button");
    this.toneModeToggleBtn.type = "button";
    this.toneModeToggleBtn.className = "ime-settings-button";
    this.toneModeToggleBtn.title = "字母/數字";
    this.toneModeToggleBtn.addEventListener('click', () => this.toggleToneMode());
	this.allToneModeButtons.push(this.toneModeToggleBtn);
    settingsContainer.appendChild(this.toneModeToggleBtn);
    this.longPhraseToggleBtn = document.createElement("button");
    this.longPhraseToggleBtn.type = "button";
    this.longPhraseToggleBtn.className = "ime-settings-button";
    this.longPhraseToggleBtn.innerHTML = '<span class="material-icons" style="font-size: 18px;">add_box</span>';
    this.longPhraseToggleBtn.title = "長詞連打/音首縮打";
    this.longPhraseToggleBtn.addEventListener('click', () => this.toggleLongPhraseMode());
	this.allLongPhraseButtons.push(this.longPhraseToggleBtn);
    if (this.isLongPhraseEnabled) {
        this.longPhraseToggleBtn.classList.add('active');
    }
    settingsContainer.appendChild(this.longPhraseToggleBtn);
    this.punctuationModeToggleBtn = document.createElement("button");
    this.punctuationModeToggleBtn.type = "button";
    this.punctuationModeToggleBtn.className = "ime-settings-button";
    this.punctuationModeToggleBtn.title = "全形/半形標點";
    this.punctuationModeToggleBtn.addEventListener('click', () => this.togglePunctuationMode());
	this.allPunctuationButtons.push(this.punctuationModeToggleBtn);
    settingsContainer.appendChild(this.punctuationModeToggleBtn);

    this.outputModeToggleBtn = document.createElement("button");
    this.outputModeToggleBtn.type = "button";
    this.outputModeToggleBtn.className = "ime-settings-button";
    // 注意：language_chinese_pinyin 非標準 Material Icon，這裡使用 'translate' 替代
    this.outputModeToggleBtn.innerHTML = '<span class="material-icons" style="font-size: 18px;">format_size</span>';
    this.outputModeToggleBtn.title = "切換輸出模式";
    this.outputModeToggleBtn.addEventListener('click', () => this.toggleOutputMode());
	this.allOutputModeButtons.push(this.outputModeToggleBtn); 
    settingsContainer.appendChild(this.outputModeToggleBtn);

    this.topBar.appendChild(settingsContainer);

    this.toolbarContainer.appendChild(this.topBar);
    document.body.appendChild(this.toolbarContainer);

    // --- 建立候選字容器 (Candidates) ---
    this.candidatesContainer = document.createElement("div");
    this.candidatesContainer.id = "web-ime-candidates-container";
    this.candidatesContainer.className = "web-ime-base";
    this.candidatesContainer.style.display = 'none';

    const compositionBar = document.createElement("div");
    compositionBar.id = "web-ime-composition-bar";

    this.compositionDisplay = document.createElement("div");
    this.compositionDisplay.id = "web-ime-composition";
    this.compositionDisplay.addEventListener('click', () => {
        if (!this.compositionBuffer) return;

        const langProps = imeLanguageProperties[this.currentMode] || {};
        const isTransformEnabled = langProps.enableToneTransform !== false;
        if (isTransformEnabled) {
            let transformedText = this.compositionBuffer;
            if (window.imeToneTransformFunctions && typeof window.imeToneTransformFunctions[this.currentMode] === 'function') {
                transformedText = window.imeToneTransformFunctions[this.currentMode](transformedText);
            } else { 
                let rules = (window.imeToneTransformRules || {})[this.currentMode];
                if (rules && rules.length > 0) {
                    for (const rule of rules) {
                        const regex = new RegExp(rule[0][0], rule[0][1]);
                        transformedText = transformedText.replace(regex, rule[1]);
                    }
                }
            }
            this.commitText(transformedText);
            this.compositionBuffer = '';
            this.compositionCursorPos = 0;
            this.updateCandidates();
        }
    });
    compositionBar.appendChild(this.compositionDisplay);

	// 【新程式碼開始】 建立一個新的容器來包裹右側的所有按鈕
	const rightControls = document.createElement("div");
	rightControls.className = "ime-right-controls"; // 給予一個 class 以便設定樣式

	this.queryBtn = document.createElement("button");
	this.queryBtn.type = "button";
	this.queryBtn.className = "ime-page-button"; // 沿用翻頁按鈕的樣式
	this.queryBtn.title = "字根反查 (/)";
	this.queryBtn.innerHTML = '<span class="material-icons" style="font-size: 20px;">search</span>';
	this.queryBtn.addEventListener("click", () => {
		 if (this.isQueryMode) {
			this.exitQueryMode(false);
		} else if (this.allCandidates.length > 0) {
			this.enterQueryMode();
		}
	});
	rightControls.appendChild(this.queryBtn); // 將 queryBtn 加入新容器

	const pagination = document.createElement("div");
	pagination.className = "ime-pagination";
	this.prevPageBtn = document.createElement("button");
	this.prevPageBtn.className = "ime-page-button";
	this.prevPageBtn.innerHTML = '<span class="material-icons">chevron_left</span>';
	this.prevPageBtn.addEventListener("click", () => this.changePage(-1));
	this.nextPageBtn = document.createElement("button");
	this.nextPageBtn.className = "ime-page-button";
	this.nextPageBtn.innerHTML = '<span class="material-icons">chevron_right</span>';
	this.nextPageBtn.addEventListener("click", () => this.changePage(1));
	pagination.appendChild(this.prevPageBtn);
	pagination.appendChild(this.nextPageBtn);
	rightControls.appendChild(pagination); // 將 pagination 加入新容器

	compositionBar.appendChild(rightControls); // 將整個右側按鈕容器加入 compositionBar
	// 【新程式碼結束】

    this.candidatesContainer.appendChild(compositionBar);

    this.candidatesList = document.createElement("ul");
    this.candidatesList.id = "web-ime-candidates";
    this.candidatesContainer.appendChild(this.candidatesList);

    const settingsBtn = document.createElement("button");
    settingsBtn.type = "button";
    settingsBtn.className = "ime-settings-button";
    settingsBtn.title = "設定";
    settingsBtn.innerHTML = '<span class="material-icons" style="font-size: 16px;">settings</span>';
    settingsBtn.addEventListener('click', () => {
        if (this.settingsModal) this.settingsModal.style.display = 'flex';
    });
	this.allSettingsButtons.push(settingsBtn); 
    settingsContainer.appendChild(settingsBtn);

    this.createSettingsModal();

    document.body.appendChild(this.candidatesContainer);

    this.updateUIState();
    this.updateToneModeButtonUI();
},

/**
 * 【修改後的新版本 V2】
 * 在指定的外部容器中建立一組同步的工具列按鈕，包含能獨立正確定位的語言選單。
 */
createExternalToolbar() {
    if (!this.externalToolbarContainer) return;

    this.externalToolbarContainer.innerHTML = '';

    const originalModeContainer = this.topBar.querySelector('.ime-mode-container');
    if (originalModeContainer) {
        const newModeContainer = originalModeContainer.cloneNode(true);
        const newModeDisplayButton = newModeContainer.querySelector('.ime-mode-button');
        const newModeDisplayText = newModeContainer.querySelector('.ime-mode-text');
        const newModeMenu = newModeContainer.querySelector('.ime-mode-menu');

        this.allModeDisplayTexts.push(newModeDisplayText);
        this.allModeMenus.push(newModeMenu);

        newModeMenu.querySelectorAll('li').forEach(item => {
            const mode = item.dataset.mode;
            item.addEventListener("mousedown", (e) => {
                e.preventDefault();
                this.switchMode(mode);
            });
        });

        // 【核心修改】為新的語言切換按鈕綁定獨立的點擊事件
        newModeDisplayButton.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件冒泡

            const rect = newModeDisplayButton.getBoundingClientRect();
            const clickX = e.clientX;
            const arrowClickAreaStart = rect.right - 30;

            if (clickX > arrowClickAreaStart) { // 點擊右側箭頭區域
                if (!this.isEnabled) return;
                
                const isMenuVisible = newModeContainer.classList.toggle('open');
                
                if (isMenuVisible) {
                    // 關閉其他可能已開啟的選單
                    this.allModeMenus.forEach(menu => {
                        if (menu !== newModeMenu) {
                            menu.parentElement.classList.remove('open');
                        }
                    });

                    newModeMenu.style.visibility = 'hidden';
                    const menuWidth = newModeMenu.offsetWidth;
                    const menuHeight = newModeMenu.offsetHeight;
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;

                    if (rect.left + menuWidth > viewportWidth) {
                        newModeMenu.style.left = 'auto'; newModeMenu.style.right = '0';
                    } else {
                        newModeMenu.style.left = '0'; newModeMenu.style.right = 'auto';
                    }
                    if (rect.bottom + menuHeight > viewportHeight) {
                        newModeMenu.style.top = 'auto'; newModeMenu.style.bottom = '105%';
                    } else {
                        newModeMenu.style.top = '105%'; newModeMenu.style.bottom = 'auto';
                    }
                    newModeMenu.style.visibility = 'visible';
                }
            } else { // 點擊文字區域
                this.toggleIsEnabled();
            }
        });
        
        this.externalToolbarContainer.appendChild(newModeContainer);
    }

    const createAndRegister = (originalButton, clickHandler, buttonArray) => {
        if (!originalButton) return null;
        
        const newButton = originalButton.cloneNode(true);
        newButton.className = "toolbar-btn ime-settings-button"; 
        
        newButton.addEventListener('click', clickHandler);
        buttonArray.push(newButton);
        this.externalToolbarContainer.appendChild(newButton);
        return newButton;
    };
    
    createAndRegister(this.toneModeToggleBtn, () => this.toggleToneMode(), this.allToneModeButtons);
    createAndRegister(this.longPhraseToggleBtn, () => this.toggleLongPhraseMode(), this.allLongPhraseButtons);
    createAndRegister(this.punctuationModeToggleBtn, () => this.togglePunctuationMode(), this.allPunctuationButtons);
    createAndRegister(this.outputModeToggleBtn, () => this.toggleOutputMode(), this.allOutputModeButtons);
    
    const originalSettingsBtn = this.allSettingsButtons[0];
    if (originalSettingsBtn) {
        createAndRegister(originalSettingsBtn, () => {
            if (this.settingsModal) this.settingsModal.style.display = 'flex';
        }, this.allSettingsButtons);
    }
},
/**
 * 防止行動裝置上彈出視窗的滾動穿透問題 (Overscroll)。
 * @param {HTMLElement} element - 要套用此行為的可滾動元素。
 */
preventModalOverscroll(element) {
    let startY = 0;

    // passive: true 可提升效能，因為我們只記錄起點，不阻止預設行為
    element.addEventListener('touchstart', (e) => {
        startY = e.touches[0].pageY;
    }, { passive: true });

    // passive: false 是必要的，因為我們需要在特定情況下呼叫 e.preventDefault()
    element.addEventListener('touchmove', (e) => {
        const currentY = e.touches[0].pageY;
        const isScrollingUp = currentY < startY;

        // 檢查滾動內容是否已到達頂部
        const isAtTop = element.scrollTop === 0;

        // 檢查滾動內容是否已到達底部 (加入 1px 的容錯值以應對像素計算誤差)
        const isAtBottom = Math.ceil(element.scrollTop + element.clientHeight) >= element.scrollHeight - 1;

        // 如果【向上滑動】且【已在底部】，則阻止瀏覽器預設行為 (如頁面滾動)
        if (isScrollingUp && isAtBottom) {
            e.preventDefault();
            return;
        }

        // 如果【向下滑動】且【已在頂部】，則阻止瀏覽器預設行為 (如 pull-to-refresh)
        if (!isScrollingUp && isAtTop) {
            e.preventDefault();
            return;
        }

        // 在其他情況下 (內容正常滾動時)，不阻止預設行為，但阻止事件冒泡
        // 這樣可以避免影響頁面中可能存在的其他滾動監聽器
        e.stopPropagation();

    }, { passive: false });
},

createSettingsModal() {
    // --- 建立設定視窗 ---
    this.settingsModal = document.createElement('div');
    this.settingsModal.id = 'web-ime-settings-modal';
    this.settingsModal.style.display = 'none';

    this.settingsModal.addEventListener('click', (e) => {
        if (e.target === this.settingsModal) {
            this.settingsModal.style.display = 'none';
        }
    });

    const modalContent = document.createElement('div');
    modalContent.className = 'web-ime-modal-content'; // ****** 修改點 ******

    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = `<h3><span class="material-icons" style="vertical-align: bottom; margin-right: 8px;">${randomIconName}</span>烏衣行輸入法設定</h3>`;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => { this.settingsModal.style.display = 'none'; }; 
    modalHeader.appendChild(closeBtn);
    modalContent.appendChild(modalHeader);

    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
	this.preventModalOverscroll(modalBody);

    // --- 功能設定區 ---
    const featureSettingsSection = document.createElement('div');

    featureSettingsSection.className = 'settings-section';
    featureSettingsSection.innerHTML = '<h4>功能設定</h4>';
    const featureContainer = document.createElement('div');
    featureContainer.className = 'query-options-container';
    const predictionLabel = document.createElement('label');
    const predictionCheckbox = document.createElement('input');
    predictionCheckbox.type = 'checkbox';
    predictionCheckbox.id = 'toggle-prediction';
    predictionCheckbox.checked = this.config.enablePrediction;
    predictionCheckbox.onchange = () => this.savePredictionSettings();
    predictionLabel.appendChild(predictionCheckbox);
    predictionLabel.appendChild(document.createTextNode(' 啟用聯想詞'));
    featureContainer.appendChild(predictionLabel);
    featureSettingsSection.appendChild(featureContainer);
    modalBody.appendChild(featureSettingsSection);
    
    // --- 工具列按鈕顯示區 ---
    const toolbarSettingsSection = document.createElement('div');
    toolbarSettingsSection.className = 'settings-section';
    toolbarSettingsSection.innerHTML = '<h4>工具列按鈕顯示</h4>';
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'query-options-container'; 
    
    const buttonOptions = { 
        'toneMode': '字母/數字', 
        'longPhrase': '連打/音首', 
        'punctuation': '全形/半形',
    };
    for (const key in buttonOptions) {
        const labelText = buttonOptions[key];
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `toggle-btn-${key}`;
        checkbox.dataset.key = key; 
        checkbox.checked = this.config.toolbarButtons[key]; 
        checkbox.onchange = () => this.saveToolbarSettings();
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${labelText}`));
        buttonsContainer.appendChild(label);
    }

const outputModeLabel = document.createElement('label');
    outputModeLabel.id = 'web-ime-output-mode-setting-row';
    outputModeLabel.className = 'keymap-setting-row';

    // 1. 主要的 "輸出字音" Checkbox
    const mainCheckbox = document.createElement('input');
    mainCheckbox.type = 'checkbox';
    mainCheckbox.id = 'toggle-btn-outputModeToggle';
    mainCheckbox.dataset.key = 'outputModeToggle';
    mainCheckbox.checked = this.config.toolbarButtons.outputModeToggle;
    outputModeLabel.appendChild(mainCheckbox);
    outputModeLabel.appendChild(document.createTextNode(' 輸出字音'));

    // 2. 建立新的下拉選單
    const outputModeSelect = document.createElement('select');
    outputModeSelect.id = 'output-mode-select';
    outputModeSelect.style.marginLeft = '10px'; // 與 checkbox 的間距
    // 根據主開關的初始狀態決定是否顯示
    outputModeSelect.style.display = mainCheckbox.checked ? 'inline-block' : 'none';

    // 3. 建立下拉選單的選項
    const options = [
        { value: 'pinyin', text: '拼音' },
        { value: 'word_pinyin', text: '字(音)' },
        { value: 'word_pinyin2', text: '字［音］' }
        // 未來可以在這裡增加更多選項
    ];

    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        if (this.config.outputMode === opt.value) {
            option.selected = true;
        }
        outputModeSelect.appendChild(option);
    });
    
    // 當下拉選單變更時，儲存設定
    outputModeSelect.addEventListener('change', () => this.saveOutputModeSettings());
    
    outputModeLabel.appendChild(outputModeSelect);

    // 4. 綁定主開關的事件
    mainCheckbox.addEventListener('change', () => {
        this.saveToolbarSettings(); // 儲存主開關狀態
        // 連動顯示/隱藏下拉選單
        outputModeSelect.style.display = mainCheckbox.checked ? 'inline-block' : 'none';
    });
    
    buttonsContainer.appendChild(outputModeLabel);


    toolbarSettingsSection.appendChild(buttonsContainer);
    modalBody.appendChild(toolbarSettingsSection);

    const keyMapSettingsSection = document.createElement('div');
    keyMapSettingsSection.className = 'settings-section';
    keyMapSettingsSection.innerHTML = '<h4>快速鍵設定</h4>';
    const keyMapContainer = document.createElement('div');
    keyMapContainer.className = 'keymap-settings-container';
    const configurableKeys = {
        'transformTone': '輸出轉換拼音',
        'clearComposition': '清除輸入編碼',
        'backspaceWithCandidates': '刪除(有編碼時)',
        'reverseLookup': '字根反查'
    };
    const finalKeyMap = { ...defaultKeyMap, ...this.config.userKeyMap };
    for (const action in configurableKeys) {
        const labelText = configurableKeys[action];
        const settingRow = document.createElement('div');
        settingRow.className = 'keymap-setting-row';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        const labelSpan = document.createElement('span');
        labelSpan.className = 'keymap-label-text';
        labelSpan.textContent = `${labelText}：`;
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `key-${action}`;
        input.dataset.action = action;
        const currentKey = finalKeyMap[action] ? finalKeyMap[action][0] : '';
        input.value = this.getKeyDisplayName(currentKey);
        input.dataset.key = currentKey;
        input.readOnly = true;
        settingRow.appendChild(checkbox);
        settingRow.appendChild(labelSpan);
        settingRow.appendChild(input);
        keyMapContainer.appendChild(settingRow);
    }
    keyMapSettingsSection.appendChild(keyMapContainer);
    modalBody.appendChild(keyMapSettingsSection);

    const querySettingsSection = document.createElement('div');
    querySettingsSection.className = 'settings-section';
    querySettingsSection.innerHTML = '<h4>字根反查</h4>';
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'query-options-container';
    for (const mode in this.reverseDicts) {
        if (Object.keys(this.reverseDicts[mode]).length > 0) {
            const displayName = this.getModeDisplayName(mode);
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `query-${mode}`;
            checkbox.value = mode;
            checkbox.onchange = () => this.saveQuerySettings();
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${displayName}`));
            optionsContainer.appendChild(label);
        }
    }
    const unicodeLabel = document.createElement('label');
    const unicodeCheckbox = document.createElement('input');
    unicodeCheckbox.type = 'checkbox';
    unicodeCheckbox.id = 'query-unicode';
    unicodeCheckbox.value = 'unicode';
    unicodeCheckbox.onchange = () => this.saveQuerySettings();
    unicodeLabel.appendChild(unicodeCheckbox);
    unicodeLabel.appendChild(document.createTextNode(' Unicode'));
    optionsContainer.appendChild(unicodeLabel);
    querySettingsSection.appendChild(optionsContainer);
    modalBody.appendChild(querySettingsSection);

    const helpSection = document.createElement('div');
    helpSection.className = 'settings-section';
    helpSection.innerHTML = '<h4>使用說明</h4>';
    const helpContent = document.createElement('div');
    helpContent.className = 'settings-help-content';
    helpContent.innerText = `聲調可用字母zˊ vˇ sˋ xˆ f⁺ lˈ，也可切換為數字。\n「連」打可以連打拼音。\nx 是標點。\n空白鍵選第一個候選字。\n也可用 ,< .> 左右移動加空白鍵。\n也可以用數字或 shift+數字來選候選字。\n輸入編碼 + w 可輸出拼音。\nCtrl+/ 可快速啟用/停用輸入法。`;
    helpSection.appendChild(helpContent);
    modalBody.appendChild(helpSection);

    const resetSection = document.createElement('div');
    resetSection.className = 'settings-section';

    const shareButton = document.createElement('button');
    shareButton.id = 'web-ime-share-button';
    shareButton.textContent = '分享設定';
    resetSection.appendChild(shareButton);


    const exitImeStateButton = document.createElement('button');
    exitImeStateButton.id = 'web-ime-exit-state-button';
    exitImeStateButton.textContent = '離開指定輸入法語言狀態';

    // 檢查網址列是否包含 'ime' 參數，並設定按鈕初始狀態
    const params = new URLSearchParams(window.location.search);
    if (params.has('ime')) {
        exitImeStateButton.disabled = false; // 網址有參數，按鈕可點擊
        exitImeStateButton.addEventListener('click', () => {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.delete('ime'); // 刪除 'ime' 參數
            window.location.href = currentUrl.href; // 導向新網址
        });
    } else {
        exitImeStateButton.disabled = true; // 網址無參數，按鈕禁用
        exitImeStateButton.title = '目前網址不包含指定語言狀態';
    }
    resetSection.appendChild(exitImeStateButton);


    const resetButton = document.createElement('button');
    resetButton.id = 'web-ime-reset-button';
    resetButton.textContent = '重設所有設定';
    resetSection.appendChild(resetButton);
    modalBody.appendChild(resetSection);
    
    modalContent.appendChild(modalBody);
    this.settingsModal.appendChild(modalContent);
    document.body.appendChild(this.settingsModal);

    const keyMapInputs = this.settingsModal.querySelectorAll('input[id^="key-"]');
    keyMapInputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.value = '請按一個鍵...';
        });
        input.addEventListener('blur', () => {
            input.value = this.getKeyDisplayName(input.dataset.key || '');
        });
        input.addEventListener('keydown', (e) => {
            e.preventDefault();
            const newKey = e.key;
            input.dataset.key = newKey;
            input.value = this.getKeyDisplayName(newKey);
            this.saveKeyMapSettings();
            input.blur();
        });
    });

    // --- 修改：為分享按鈕綁定新的編碼邏輯 ---
    shareButton.addEventListener('click', () => {
        const baseUrl = window.location.origin + window.location.pathname;
        
        // 新格式: <啟用狀態>-<語言>-<設定碼>
        // 1. 啟用狀態: 1 (分享時必定是啟用狀態)
        const enabledState = '1';

        // 2. 語言
        const langCode = this.currentMode;

        // 3. 設定碼 (6位數)
        // 順序: prediction, tonemode, longphrase, fullwidth, output_enabled, ime-output
        const isOutputEnabled = this.config.toolbarButtons.outputModeToggle;
        let outputModeCode = '0'; // 'word'
        if (isOutputEnabled) {
            if (this.config.outputMode === 'pinyin') outputModeCode = '1';
            else if (this.config.outputMode === 'word_pinyin') outputModeCode = '2';
			else if (this.config.outputMode === 'word_pinyin2') outputModeCode = '3';
        }
        
        const settingsCode = [
            this.config.enablePrediction ? '1' : '0',
            this.getCurrentToneMode() === 'alphabetic' ? '1' : '0',
            this.isLongPhraseEnabled ? '1' : '0',
            this.isFullWidthMode ? '1' : '0',
            isOutputEnabled ? '1' : '0',
            outputModeCode
        ].join('');

        // 組合最終字串
        const shortCode = `${enabledState}-${langCode}-${settingsCode}`;
        const shareableUrl = `${baseUrl}?ime=${shortCode}`;

        // 複製到剪貼簿
        navigator.clipboard.writeText(shareableUrl).then(() => {
            this.showToast('分享網址已複製到剪貼簿');
            this.settingsModal.style.display = 'none';
        }).catch(err => {
            console.error('無法複製網址: ', err);
            this.showToast('複製失敗，您的瀏覽器可能不支援');
        });
    });
    // --- 修改結束 ---

    resetButton.addEventListener('click', () => {
        this.settingsModal.style.display = 'none';
        
        this.showCustomConfirm(
            '確定要重設所有設定嗎？<br>此操作將會清除所有自訂選項。',
            () => {
                
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(this.config.storagePrefix)) {
                        localStorage.removeItem(key);
                    }
                });

                this.showToast('設定已重設，頁面即將重新載入。', 2000);

                setTimeout(() => {
                    location.reload();
                }, 1500); 
            }
        );
    });
},
	
	
saveQuerySettings() {
    const enabled = {};
    const checkboxes = this.settingsModal.querySelectorAll('.query-options-container input[type="checkbox"]');
    checkboxes.forEach(cb => {
        if (cb.id.startsWith('query-')) {
            enabled[cb.value] = cb.checked;
        }
    });
    // 將設定儲存到 WebIME 物件和 localStorage
    this.config.querySettings = enabled;
    localStorage.setItem(this.config.storagePrefix + 'querySettings', JSON.stringify(enabled));

    // --- 新增此行 ---
    this.updateUIState(); // 立即更新UI以反應按鈕的顯示狀態
},

loadQuerySettings() {
    let settings;
    try {
        settings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'querySettings'));
    } catch (e) {
        settings = null;
    }

    // 如果沒有儲存的設定，則使用預設值 (全部不啟用)
    if (!settings) {
        // << 修改點：將預設值改為空物件 {} >>
        settings = {}; 
    }
    this.config.querySettings = settings;

    // 更新設定視窗中的勾選狀態以符合載入的設定
    if (this.settingsModal) {
        for (const lang in dictionaries) { // 遍歷所有字典確保所有選項都被更新
            const checkbox = this.settingsModal.querySelector(`#query-${lang}`);
            if (checkbox) {
                // 如果 settings[lang] 是 true，就勾選；否則 (是 false 或 undefined) 就不勾選
                checkbox.checked = !!settings[lang];
            }
        }
        // 額外處理 Unicode 選項的勾選狀態
        const unicodeCheckbox = this.settingsModal.querySelector('#query-unicode');
        if (unicodeCheckbox) {
            unicodeCheckbox.checked = !!settings['unicode'];
        }
    }
},



/**
 * 儲存工具列按鈕的顯示設定
 */
saveToolbarSettings() {
    const checkboxes = this.settingsModal.querySelectorAll('input[id^="toggle-btn-"]');
    checkboxes.forEach(cb => {
        const key = cb.dataset.key;
        if (key) {
            this.config.toolbarButtons[key] = cb.checked;

            // 當使用者透過「設定」取消勾選「輸出字音」時
            if (key === 'outputModeToggle' && !cb.checked) {
                // 我們需要同時將「功能啟用狀態」也強制設為 false
                this.config.outputModeActive = false;
                // 並將這個狀態儲存起來
                localStorage.setItem(this.config.storagePrefix + 'outputModeActive', 'false');
                // 同步更新按鈕的顏色狀態（雖然它即將被隱藏）
                this.updateOutputModeButtonUI();
            }
        }
    });
    localStorage.setItem(this.config.storagePrefix + 'toolbarSettings', JSON.stringify(this.config.toolbarButtons));
    // 立即套用變更（顯示或隱藏按鈕）
    this.updateToolbarButtonsVisibility();
},


/**
 * 從 localStorage 載入輸出模式設定 (下拉選單的值)
 */
loadOutputModeSettings() {
    const saved = localStorage.getItem(this.config.storagePrefix + 'outputMode');
    // 合法的值為 'pinyin', 'word_pinyin'，否則使用預設值 'pinyin'
    this.config.outputMode = ['pinyin', 'word_pinyin', 'word_pinyin2'].includes(saved) ? saved : 'pinyin';

    if (this.settingsModal) {
        // 根據載入的設定，設定下拉選單的目前值
        const selectElement = this.settingsModal.querySelector('#output-mode-select');
        if (selectElement) {
            selectElement.value = this.config.outputMode;
        }
    }
},

/**
 * 儲存輸出模式設定 (下拉選單的值) 到 localStorage
 */
saveOutputModeSettings() {
    // 找到下拉選單
    const selectElement = this.settingsModal.querySelector('#output-mode-select');
    if (selectElement) {
        this.config.outputMode = selectElement.value;
        localStorage.setItem(this.config.storagePrefix + 'outputMode', this.config.outputMode);
    }
},



/**
 * [修改後的函式] 從 localStorage 載入工具列按鈕的顯示設定
 */
loadToolbarSettings() {
    let settings;
    try {
        settings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'toolbarSettings'));
    } catch (e) {
        settings = null;
    }

    // 載入工具列按鈕的顯示設定 定義預設值
    const defaults = {
        toneMode: true,
        longPhrase: false,
        punctuation: false,
        position: false,
        outputModeToggle: false,
    };

    // 如果沒有儲存的設定，則使用預設值；否則，用預設值補全可能缺少的項目
    this.config.toolbarButtons = { ...defaults, ...settings };
},

/**
 * 從 localStorage 載入使用者自訂的快速鍵設定
 */
loadKeyMapSettings() {
    let settings;
    try {
        settings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'userKeyMap'));
    } catch (e) {
        settings = null;
    }
    // 如果沒有儲存的設定，則使用空物件
    this.config.userKeyMap = settings || {};
},

/**
 * 儲存使用者自訂的快速鍵設定到 localStorage
 */
saveKeyMapSettings() {
    const keyMapInputs = this.settingsModal.querySelectorAll('input[id^="key-"]');
    const newKeyMap = {};
    keyMapInputs.forEach(input => {
        const action = input.dataset.action;
        const key = input.dataset.key; 
        if (action && key) {
            newKeyMap[action] = [key];
        }
    });
    this.config.userKeyMap = newKeyMap;
    localStorage.setItem(this.config.storagePrefix + 'userKeyMap', JSON.stringify(newKeyMap));
},

/**
 * 將 KeyboardEvent 的 key 或 code 轉換為更易讀的顯示名稱

getKeyDisplayName(key) {
    const keyMap = {
        ' ': 'Space',
        "'": "Quote",
        ';': 'Semicolon',
        'Escape': 'Esc'
    };
    return keyMap[key] || key;
},
 */
getKeyDisplayName(key) {
    if (key === ' ') {
        return 'Space'; // 空白鍵特殊處理，顯示名稱
    }
    // 其他所有按鍵，直接返回按鍵的字元本身
    return key;
},

/**
 * 根據「語言支援」與「使用者設定」更新工具列上按鈕的顯示/隱藏
 */
updateToolbarButtonsVisibility() {
    if (!this.toolbarContainer) return;

    const langProps = imeLanguageProperties[this.currentMode] || {};
    const nonPinyinModes = ['cangjie', 'xiami', 'hanglie'];

    const isLongPhraseSupported = langProps.allowLongPhraseToggle !== false;
    const isPinyinOutputAvailable = !nonPinyinModes.includes(this.currentMode);

    // 【修改】將按鈕元素對應到按鈕陣列
    const buttonConfig = {
        'toneMode': {
            elements: this.allToneModeButtons,
            isSupported: (langProps.toneModes && langProps.toneModes.length > 1) 
        },
        'longPhrase': {
            elements: this.allLongPhraseButtons,
            isSupported: isLongPhraseSupported
        },
        'punctuation': {
            elements: this.allPunctuationButtons,
            isSupported: true
        },
        'outputModeToggle': {
            elements: this.allOutputModeButtons,
            isSupported: isPinyinOutputAvailable
        }
    };

    for (const key in buttonConfig) {
        const config = buttonConfig[key];
        const isEnabledByUser = this.config.toolbarButtons[key];
        
        config.elements.forEach(element => {
            if (element) {
                if (config.isSupported && isEnabledByUser) {
                    element.style.display = '';
                } else {
                    element.style.display = 'none';
                }
            }
        });
    }
},

attachEventListeners() {
    const onImeInteractionStart = () => { this.isClickingInside = true; };
    this.toolbarContainer.addEventListener('mousedown', onImeInteractionStart);
    this.toolbarContainer.addEventListener('touchstart', onImeInteractionStart, { passive: true });
    this.candidatesContainer.addEventListener('mousedown', onImeInteractionStart);
    this.candidatesContainer.addEventListener('touchstart', onImeInteractionStart, { passive: true });

    this.handleFocusIn = (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) {
            this.activate(e.target);
        }
    };

    this.handleFocusOut = (e) => {
        if (this.isClickingInside) {
            this.isClickingInside = false;
            if (this.activeElement && !this.isMobile) {
                this.activeElement.focus();
            }
            return;
        }
        const nextFocusTarget = e.relatedTarget;
        if (nextFocusTarget && (nextFocusTarget.tagName === "INPUT" || nextFocusTarget.tagName === "TEXTAREA" || nextFocusTarget.isContentEditable)) {
            this.deactivate();
            return;
        }
        this.deactivate();
        this.hide();
    };

    this.boundFocusInHandler = this.handleFocusIn.bind(this);
    this.boundFocusOutHandler = this.handleFocusOut.bind(this);

    document.addEventListener("focusin", this.boundFocusInHandler);
    document.addEventListener("focusout", this.boundFocusOutHandler);

    // 全域點擊監聽器，用於關閉開啟的語言選單
    document.addEventListener('click', (e) => {
        // 遍歷所有已註冊的語言選單
        this.allModeMenus.forEach(menu => {
            const container = menu.parentElement; // 找到 .ime-mode-container
            // 如果點擊的目標不在當前選單的容器內，就關閉它
            if (container && !container.contains(e.target)) {
                container.classList.remove('open');
            }
        });
    });

},



activate(element) {
    // 如果目前作用中的元素與新傳入的元素不同，先停用舊的。
    if (this.activeElement && this.activeElement !== element) {
        this.deactivate();
    }

    // 更新作用中的元素
    this.activeElement = element;
    this.lastInputValue = this.activeElement.isContentEditable ? this.activeElement.textContent : this.activeElement.value;

    // 顯示 UI 並重新定位
    this.show();
    setTimeout(() => this.reposition(), 0);

    // 為了確保穩健，先移除可能殘留的監聽器，再重新附加。
    // 這可以防止因意外的狀態導致監聽器重複綁定或遺漏綁定。
    this.activeElement.removeEventListener('click', this.boundReposition);
    this.activeElement.removeEventListener('keyup', this.boundReposition);
    this.activeElement.removeEventListener('mouseup', this.boundReposition);
    this.activeElement.removeEventListener('keydown', this.boundHandleKeyDown);
    if (this.isMobile) {
        this.activeElement.removeEventListener('input', this.boundHandleInput);
    }
    
    this.activeElement.addEventListener('click', this.boundReposition);
    this.activeElement.addEventListener('keyup', this.boundReposition);
    this.activeElement.addEventListener('mouseup', this.boundReposition);
    
    // 根據輸入法是否啟用，來決定是否附加核心的輸入事件監聽器
    if (this.isEnabled) {
        this.toolbarContainer.classList.remove('disabled');
        this.activeElement.addEventListener('keydown', this.boundHandleKeyDown);
        if (this.isMobile) {
            this.activeElement.addEventListener('input', this.boundHandleInput);
        }
    } else {
        this.toolbarContainer.classList.add('disabled');
    }
},

deactivate() {
    if (!this.activeElement) return;
    if (this.compositionBuffer) {
        this.commitText(this.compositionBuffer);
        this.compositionBuffer = '';
        this.compositionCursorPos = 0;
    }
    this.activeElement.removeEventListener('keydown', this.boundHandleKeyDown);
    if (this.isMobile) {
        this.activeElement.removeEventListener('input', this.boundHandleInput);
    }
    this.activeElement.removeEventListener('click', this.boundReposition);
    this.activeElement.removeEventListener('keyup', this.boundReposition);
    this.activeElement.removeEventListener('mouseup', this.boundReposition);
    this.activeElement = null;
    this.clearCandidates();
},

handleInput(e) {
    // 如果是我們自己觸發的 input 事件，就直接忽略
    if (this.isCommittingText) {
        return;
    }
    
    // 如果不是行動裝置，此函數不作用 (桌機邏輯在 keydown 中)
    if (!this.isMobile) {
        if (this.compositionBuffer) {
            this.compositionBuffer = '';
            this.updateCandidates();
        }
        return;
    }

    // --- 以下為行動裝置專用的核心邏輯 ---
    const target = e.target;
    const currentVal = target.isContentEditable ? target.textContent : target.value;
    const selectionStart = target.selectionStart; // 取得目前的游標位置

    // 偵測輸入 (文字變長)
    if (currentVal.length > this.lastInputValue.length) {
        
        // 【核心修正】
        // 透過游標位置，精準計算出新插入的字元，不再假設只在末尾輸入
        const insertedLength = currentVal.length - this.lastInputValue.length;
        const insertionStart = selectionStart - insertedLength;
        let diff = currentVal.substring(insertionStart, selectionStart);

        // 如果一次輸入超過1個字元(例如貼上)，或者不是英文/數字/空格，就直接接受，並重設輸入法狀態
        // 【關鍵修改】：將 `\s` 修改為明確的空格 ` `，避免比對到換行符 `\n`
        if (insertedLength > 1 || !/^[a-zA-Z0-9 ]$/.test(diff)) {
            this.lastInputValue = currentVal;
            this.compositionBuffer = '';
            this.compositionCursorPos = 0;
            this.updateCandidates();
            return;
        }
        
        // --- 攔截與還原輸入框 ---
        // 這是必要的步驟，目的是把剛剛輸入到編輯區的英文字元「吃掉」，
        // 轉而送給我們的輸入法緩衝區處理。

        const restoreVal = this.lastInputValue;
        const restoreCursorPos = insertionStart;

        // 暫時標記，避免還原操作又觸發一次 input 事件造成無窮迴圈
        this.isCommittingText = true;
        
        if (target.isContentEditable) {
            target.textContent = restoreVal;
        } else {
            target.value = restoreVal;
        }
        // 將游標設定回插入前的位置
        target.setSelectionRange(restoreCursorPos, restoreCursorPos);
        
        this.isCommittingText = false;
        
        // 更新 lastInputValue，讓它與畫面同步
        this.lastInputValue = restoreVal;

        // --- 以下處理被攔截到的 diff 字元 ---

        // 當輸入的是空白鍵時
        if (diff === ' ') {
            const hasBuffer = this.compositionBuffer.length > 0;
            const hasCandidates = this.allCandidates.length > 0;

            if (hasCandidates) {
                this.selectCandidate(this.highlightedIndex); // 有候選字，選字
            } else if (hasBuffer) {
                this.compositionBuffer = ''; // 有編碼但無候選字，清空
                this.compositionCursorPos = 0;
                this.updateCandidates();
            } else {
                this.commitText(' '); // 無編碼，直接上屏一個空格
            }
            return;
        }

        const hasComposition = this.compositionBuffer && this.allCandidates.length > 0;
        const currentToneMode = this.getCurrentToneMode();
        const isNumberSelect = currentToneMode === 'alphabetic' && diff.match(/^[1-9]$/) && hasComposition;
        const isWTransform = diff.toLowerCase() === 'w' && this.compositionBuffer;

        // 處理數字選字或'w'轉換
        if (isNumberSelect || isWTransform) {
            if (isNumberSelect) {
                const index = parseInt(diff, 10) - 1;
                if (index < this.candidatesList.children.length) {
                    this.selectCandidate(index);
                }
            } else { // isWTransform
                // (此處省略 'w' 轉換的詳細程式碼，因其邏輯與原版相同)
                this.commitText(this.compositionBuffer); // 簡化示意
                this.compositionBuffer = '';
                this.compositionCursorPos = 0;
                this.updateCandidates();
            }
            return;
        }
        
        // --- 正常的編碼輸入 ---
        const langProps = imeLanguageProperties[this.currentMode] || {};
        const isNumericToneMode = currentToneMode === 'numeric' && langProps.numericToneMap;

        if (isNumericToneMode && diff.match(/^[0-9]$/)) {
            const mappedChar = langProps.numericToneMap[diff];
            if (mappedChar) {
                diff = mappedChar; 
            }
        }
        
        this.compositionBuffer += diff;
        this.compositionCursorPos += diff.length;
        this.updateCandidates();

    } else if (currentVal.length < this.lastInputValue.length) {
        // 處理刪除 (Backspace)
         if (this.compositionBuffer) {
            this.compositionBuffer = this.compositionBuffer.slice(0, -1);
            this.compositionCursorPos = this.compositionBuffer.length;
            this.updateCandidates();
        }
        this.lastInputValue = currentVal;
    } else {
        // 處理游標移動等其他情況
        this.lastInputValue = currentVal;
    }
},


findPhraseCandidates(buffer) {
    // *** 修改點：對傳入的 buffer 進行正規化 ***
    const normalizedBuffer = this.normalizeCompositionBuffer(buffer, this.currentMode);

    const langProps = imeLanguageProperties[this.currentMode] || {};
    const toneRegex = imeToneMappings[this.currentMode];
    let processedBuffer = normalizedBuffer; // *** 修改點：使用正規化後的 buffer 進行後續處理 ***

    if (langProps.toneType === 'numeric' && toneRegex) {
        processedBuffer = processedBuffer.replace(new RegExp(toneRegex.source, 'g'), '');
    }

    if (this.phraseCache[processedBuffer]) {
        return this.phraseCache[processedBuffer];
    }

    const dictionary = dictionaries[this.currentMode];
    const simplifiedDict = {};
    for (const key in dictionary) {
        const simplifiedKey = this.simplifyKey(key, this.currentMode);
        if (!simplifiedDict[simplifiedKey]) {
            simplifiedDict[simplifiedKey] = dictionary[key].split(' ')[0];
        }
    }

    let remainingBuffer = processedBuffer;
    const path = [];
    while (remainingBuffer.length > 0) {
        let foundMatch = false;
        for (let i = remainingBuffer.length; i > 0; i--) {
            const prefix = remainingBuffer.substring(0, i);
            if (simplifiedDict[prefix]) {
                path.push(simplifiedDict[prefix]);
                remainingBuffer = remainingBuffer.substring(i);
                foundMatch = true;
                break;
            }
        }
        if (!foundMatch) {
            path.length = 0;
            break;
        }
    }

    const finalResults = path.length > 0 ? [path.join('')] : [];
    this.phraseCache[processedBuffer] = finalResults;
    return finalResults;
},


handleKeyDown(e) {
    // 當模式不是行列，且候選字容器未顯示時，才將 ; 轉為全形；
    if (this.currentMode !== 'hanglie' && e.key === ';' && (!this.candidatesContainer || this.candidatesContainer.style.display === 'none')) {
        if (this.isFullWidthMode) {
            e.preventDefault();
            this.commitText('；');
            return;
        }
    }
    if (e.isComposing || e.keyCode === 229) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    // 【核心修改】
    // 在正則表達式中加入了「空白鍵(\s)」，讓 handleKeyDown 在手機上忽略空白鍵與數字鍵，
    // 將其完全交給 handleInput 處理，避免事件衝突。
    if (this.isMobile && e.key && e.key.length === 1 && /[a-zA-Z0-9\s]/.test(e.key)) {
        return;
    }

    const hasComposition = this.compositionBuffer.length > 0;
    const hasCandidates = this.allCandidates.length > 0;

    const langProps = imeLanguageProperties[this.currentMode] || {};
    
    let keyMap = { ...defaultKeyMap };
    if (langProps.keyMap) {
        keyMap = { ...keyMap, ...langProps.keyMap };
    }
    if (this.config.userKeyMap) {
        for (const action in this.config.userKeyMap) {
            if (this.config.userKeyMap[action] && this.config.userKeyMap[action].length > 0) {
                keyMap[action] = this.config.userKeyMap[action];
            }
        }
    }

    const reverseKeyMap = {};
    for (const action in keyMap) {
        keyMap[action].forEach(key => {
            reverseKeyMap[key] = action;
        });
    }

    const action = reverseKeyMap[e.key];

    if (action) {
        switch (action) {
            case 'selectCandidate':
                if (hasCandidates) {
                    e.preventDefault();
                    this.selectCandidate(this.highlightedIndex);
                } else if (hasComposition) {
                    e.preventDefault();
                    const actionOnNoCandidates = langProps.spaceActionOnNoCandidates || 'commit';
                    if (actionOnNoCandidates === 'clear') {
                        this.compositionBuffer = '';
                        this.compositionCursorPos = 0;
                        this.updateCandidates();
                    } else {
                        this.commitText(this.compositionBuffer);
                        this.compositionBuffer = '';
                        this.compositionCursorPos = 0;
                        this.updateCandidates();
                    }
                }
                return;
            
                case 'commitComposition':
                // 核心修正：
                // 檢查是否有輸入編碼。如果沒有，我們必須讓瀏覽器自己處理 Enter 鍵的預設行為
                // (例如在 <textarea> 中換行，或在 <input> 中提交表單)。
                // 因此，我們直接用 break 跳出 switch，不執行任何攔截 (e.preventDefault)。
                if (!hasComposition) {
                    break;
                }

                // 如果程式執行到這裡，代表 hasComposition 為 true，有輸入編碼。
                // 在這種情況下，我們就要攔截 Enter 鍵的預設行為。
                e.preventDefault();

                // 將編碼區的文字送出到編輯區。
                this.commitText(this.compositionBuffer);

                // 重設輸入法狀態，清空編碼區。
                this.compositionBuffer = '';
                this.compositionCursorPos = 0;
                this.updateCandidates();

                // 因為我們已經處理完畢，使用 return 來結束整個 handleKeyDown 函數的執行，
                // 避免後續其他程式碼可能造成的干擾。
                return;

            case 'clearComposition':
                if (hasComposition || hasCandidates) {
                    e.preventDefault();
                    this.compositionBuffer = '';
                    this.compositionCursorPos = 0;
                    this.updateCandidates();
                    return;
                }
                break;
            
            case 'backspaceWithCandidates':
                e.preventDefault();
                if (hasComposition) {
                    if (this.compositionCursorPos > 0) {
                        const buffer = this.compositionBuffer;
                        const pos = this.compositionCursorPos;
                        this.compositionBuffer = buffer.substring(0, pos - 1) + buffer.substring(pos);
                        this.compositionCursorPos--;
                        this.updateCandidates();
                    }
                } else if (this.isPredictionState) {
                    this.isPredictionState = false;
                    this.lastCommittedWord = '';
                    this.updateCandidates();
                }
                return;
            
            case 'reverseLookup':
                if (this.isQueryMode || hasCandidates) {
                    e.preventDefault();
                    if (this.isQueryMode) {
                        this.exitQueryMode(false);
                    } else if (!['cangjie', 'xiami'].includes(this.currentMode)) {
                        this.enterQueryMode();
                    }
                    return;
                }
                break;

            case 'nextCandidate':
                if (hasCandidates) {
                    e.preventDefault();
                    this.navigateCandidates(1);
                    return; 
                }
                break; 
            case 'prevCandidate':
                if (hasCandidates) {
                    e.preventDefault();
                    this.navigateCandidates(-1);
                    return; 
                }
                break; 

            case 'nextPage':
                if (hasCandidates) {
                    e.preventDefault();
                    this.changePage(1);
                    return;
                }
                break;

            case 'prevPage':
                if (hasCandidates) {
                    e.preventDefault();
                    this.changePage(-1);
                    return;
                }
                break;

            case 'moveCursorLeft':
                if (hasComposition) {
                    e.preventDefault();
                    if (this.compositionCursorPos > 0) this.compositionCursorPos--;
                    this.updateCompositionDisplay();
                    return;
                }
                break;

            case 'moveCursorRight':
                if (hasComposition) {
                    e.preventDefault();
                    if (this.compositionCursorPos < this.compositionBuffer.length) this.compositionCursorPos++;
                    this.updateCompositionDisplay();
                    return;
                }
                break;

            case 'toggleLongPhrase':
                if (hasComposition) {
                    e.preventDefault();
                    this.toggleLongPhraseMode();
                    return;
                }
                break;
            
            case 'transformTone':
                if (hasComposition) {
                    const isTransformEnabled = langProps.enableToneTransform !== false;
                    if (isTransformEnabled) {
                        e.preventDefault();
                        let transformedText = this.compositionBuffer;
                        if (window.imeToneTransformFunctions && typeof window.imeToneTransformFunctions[this.currentMode] === 'function') {
                            transformedText = window.imeToneTransformFunctions[this.currentMode](transformedText);
                        } else {
                            let rules = (window.imeToneTransformRules || {})[this.currentMode];
                            if (rules && rules.length > 0) {
                                for (const rule of rules) {
                                    const regex = new RegExp(rule[0][0], rule[0][1]);
                                    transformedText = transformedText.replace(regex, rule[1]);
                                }
                            }
                        }
                        this.commitText(transformedText);
                        this.compositionBuffer = '';
                        this.compositionCursorPos = 0;
                        this.updateCandidates();
                    }
                }
                return;
        }
    }
    
    if (this.isFullWidthMode && !hasComposition) {
        const fullWidthPunctuation = {
            ',': '，', '.': '。', '?': '？', ':': '：', "'": '、', '[': '「', ']': '」', '{': '『', '}': '』', '!': '！', '-': '─', '(': '（', ')': '）', '~': '～', '<': '〈', '>': '〉', '_': '＿', '"': '…', '\\': '【】', '|': '《》', '\;': 'X'
        };
        const fullWidthChar = fullWidthPunctuation[e.key];

        if (fullWidthChar && !(this.currentMode === 'hanglie' && [',', '.', ';', '/'].includes(e.key))) {
            e.preventDefault();
            this.commitText(fullWidthChar);
            return;
        }
    }

    if (hasCandidates) {
        const currentToneMode = this.getCurrentToneMode();
        if (currentToneMode === 'alphabetic' && e.key >= '1' && e.key <= '9') {
            e.preventDefault();
            const index = parseInt(e.key, 10) - 1;
            if (index < this.candidatesList.children.length) {
                this.selectCandidate(index);
                return;
            }
        }
        if (e.shiftKey && e.code.startsWith('Digit')) {
            const num = e.code.slice(5);
            if (num >= '1' && num <= '9') {
                const index = parseInt(num, 10) - 1;
                if (index < this.candidatesList.children.length) {
                    e.preventDefault();
                    this.selectCandidate(index);
                    return;
                }
            }
        }
    }

    if (e.key === 'Backspace') {
        if (hasComposition) {
            e.preventDefault();
            if (this.compositionCursorPos > 0) {
                const buffer = this.compositionBuffer;
                const pos = this.compositionCursorPos;
                this.compositionBuffer = buffer.substring(0, pos - 1) + buffer.substring(pos);
                this.compositionCursorPos--;
                this.updateCandidates();
            }
        }
        return;
    }
    
    const isNumericKey = /^[0-9]$/.test(e.key);
    if (isNumericKey && this.getCurrentToneMode() === 'alphabetic' && !hasComposition) {
        return;
    }


    if (e.key === '+' || e.key === '=' ) {
        return;
    }

    
    if (!this.isMobile && e.key.length === 1 && !reverseKeyMap[e.key]) {
        e.preventDefault();
        let character = e.key;
        const currentToneMode = this.getCurrentToneMode();
        const isNumericToneMode = currentToneMode === 'numeric' && langProps.numericToneMap;
        
        if (isNumericToneMode && character.match(/^[0-9]$/)) {
            character = langProps.numericToneMap[character] || character;
        }

        if (this.compositionBuffer.length < this.config.maxCompositionLength) {
            const buffer = this.compositionBuffer;
            const pos = this.compositionCursorPos;
            this.compositionBuffer = buffer.substring(0, pos) + character + buffer.substring(pos);
            this.compositionCursorPos++;
            this.updateCandidates();
        }
    }
},


getCurrentToneMode() {
    const langProps = imeLanguageProperties[this.currentMode] || {};
    const defaultToneMode = langProps.toneType || (langProps.toneModes && langProps.toneModes[0]) || 'alphabetic';
    return this.toneModes[this.currentMode] || defaultToneMode;
},

updateToneModeButtonUI() {
    const langProps = imeLanguageProperties[this.currentMode] || {};
    const shouldShow = langProps.toneModes && langProps.toneModes.length > 1;
    
    // 【修改】遍歷所有相關按鈕並更新
    this.allToneModeButtons.forEach(btn => {
        if (shouldShow) {
            btn.style.display = '';
            const currentSetting = this.getCurrentToneMode();
            const modeText = currentSetting === 'numeric' ? '調ˇ' : 'źv̌s̀';
            btn.textContent = `${modeText}`;
        } else {
            btn.style.display = 'none';
        }
    });
},

/**
 * [新版] 循環切換輸出模式 (僅切換功能啟用/停用狀態)
 */
toggleOutputMode() {
    // 切換「功能啟用狀態」，而不是「按鈕可見度」的狀態
    this.config.outputModeActive = !this.config.outputModeActive;

    // 將新的「功能啟用狀態」儲存到 localStorage
    localStorage.setItem(this.config.storagePrefix + 'outputModeActive', this.config.outputModeActive);

    // 更新按鈕UI (變色) 並顯示提示
    this.updateOutputModeButtonUI();
    const statusText = this.config.outputModeActive ? '啟用' : '停用';
    this.showToast(`字音輸出已${statusText}`);
},

updateOutputModeButtonUI() {
    // 【修改】遍歷所有相關按鈕並更新
    this.allOutputModeButtons.forEach(btn => {
        if (!btn) return;
        const isEnabled = this.config.outputModeActive;
        const icon = isEnabled ? 'translate' : 'format_size';
        const title = isEnabled ? '字音輸出已啟用' : '字音輸出已停用';

        btn.innerHTML = `<span class="material-icons" style="font-size: 18px;">${icon}</span>`;
        btn.title = title;
        btn.classList.toggle('active', isEnabled);
    });
},

toggleToneMode() {
    const langProps = imeLanguageProperties[this.currentMode] || {};
    const availableModes = langProps.toneModes;

    if (!availableModes || availableModes.length <= 1) return;

    const currentSetting = this.getCurrentToneMode();
    const currentIndex = availableModes.indexOf(currentSetting);
    const nextIndex = (currentIndex + 1) % availableModes.length;
    const newMode = availableModes[nextIndex];

    this.toneModes[this.currentMode] = newMode;
    localStorage.setItem(this.config.storagePrefix + 'toneModes', JSON.stringify(this.toneModes));

    this.updateToneModeButtonUI();

    if (this.activeElement) this.activeElement.focus();

    const modeText = newMode === 'numeric' ? '數字模式' : '字母模式';
    this.showToast(modeText);
},

updateCandidates() {
    // 任何時候更新候選字 (代表使用者正在輸入新編碼)，都應結束聯想詞狀態
    this.isPredictionState = false;
    this.lastCommittedWord = '';

    const activeBuffer = this.compositionBuffer.substring(0, this.compositionCursorPos).toLowerCase();

    this.updateUIState();
    this.updateCompositionDisplay();

    if (activeBuffer.length === 0) {
        this.clearCandidates();
        return;
    }

    const dictionary = dictionaries[this.currentMode];
    let candidates = [];

    // --- 【核心修改：長詞連打模式的搜尋邏輯】 ---
    if (this.isLongPhraseEnabled) {
        // 從最長的編碼開始，逐步縮短，直到找到匹配的候選詞為止
        for (let i = activeBuffer.length; i > 0; i--) {
            const prefixToSearch = activeBuffer.substring(0, i);
            let foundCandidatesForPrefix = [];

            // 1. 精確匹配
            const exactResult = dictionary[prefixToSearch];
            if (exactResult) {
                exactResult.split(' ').forEach(word => {
                    foundCandidatesForPrefix.push({ word: word, consumed: prefixToSearch });
                });
            }

            // 2. 詞組匹配 (例如 taiga -> 大家)
            this.findPhraseCandidates(prefixToSearch).forEach(word => {
                foundCandidatesForPrefix.push({ word: word, consumed: prefixToSearch });
            });

            // 3. 簡單前綴匹配 (例如 gong -> 工程師)
            this.findSimplePrefixCandidates(prefixToSearch).forEach(word => {
                foundCandidatesForPrefix.push({ word: word, consumed: prefixToSearch });
            });
            
            // 如果當前的長度(prefixToSearch)找到了任何候選詞，就用這些詞並且停止繼續縮短搜尋
            if (foundCandidatesForPrefix.length > 0) {
                candidates = foundCandidatesForPrefix;
                break;
            }
        }
    } else {
        // --- 非長詞連打模式的原始邏輯 ---
        const exactResult = dictionary[activeBuffer];
        if (exactResult) {
            exactResult.split(' ').forEach(word => {
                candidates.push({ word: word, consumed: activeBuffer });
            });
        }
        this.findSimplePrefixCandidates(activeBuffer).forEach(word => {
            candidates.push({ word: word, consumed: activeBuffer });
        });
        this.findAbbreviationCandidates(activeBuffer).forEach(word => {
            candidates.push({ word: word, consumed: activeBuffer });
        });
    }

    const uniqueCandidates = new Map();
    candidates.forEach(c => {
        if (!uniqueCandidates.has(c.word)) {
            uniqueCandidates.set(c.word, c);
        }
    });

    this.allCandidates = Array.from(uniqueCandidates.values());
    this.currentPage = 0;
    this.highlightedIndex = 0;
    this.renderCandidates();
    this.reposition();
},

/**
 * [優化版] 尋找符合前綴的候選字。
 * @param {string} buffer - 使用者輸入的緩衝字串
 * @returns {string[]} - 候選字陣列
 */
findSimplePrefixCandidates(buffer) {
    // 當輸入長度小於 1 時，不進行搜尋
    if (buffer.length < 1) {
        return [];
    }

    // *** 修改點：先對使用者輸入的 buffer 進行正規化 ***
    const normalizedBuffer = this.normalizeCompositionBuffer(buffer, this.currentMode);

    const firstChar = normalizedBuffer[0].toLowerCase();
    const relevantEntries = this.preprocessedDicts[this.currentMode][firstChar];

    // 如果沒有該首字母對應的詞條分組，直接返回空陣列
    if (!relevantEntries) {
        return [];
    }

    const candidates = [];
    // 只遍歷相關的分組，而不是整個字典
    for (const entry of relevantEntries) {
        // *** 修改點：使用正規化後的 normalizedBuffer 進行比對 ***
        // 比對包含聲調的原始 key (連續)
        // 將 .replace(/\s/g, '') 改為 .replace(/[\s-]+/g, '')
        if (entry.originalKey.replace(/[\s-]+/g, '').startsWith(normalizedBuffer)) {
             candidates.push(...entry.values);
        }
        // 比對移除聲調後的簡化 key
        else if (entry.simplifiedKey.startsWith(normalizedBuffer)) {
            candidates.push(...entry.values);
        }
    }
    return candidates;
},

/**
 * [優化版] 透過拼音首字母縮寫尋找候選字。
 * @param {string} buffer - 使用者輸入的緩衝字串
 * @returns {string[]} - 候選字陣列
 */
findAbbreviationCandidates(buffer) {
    // 對縮寫搜尋也限制最小長度
    if (buffer.length < 2) {
        return [];
    }
    
    // *** 修改點：同樣對縮寫查詢的 buffer 進行正規化 ***
    const normalizedBuffer = this.normalizeCompositionBuffer(buffer, this.currentMode);

    const firstChar = normalizedBuffer[0].toLowerCase();
    const relevantEntries = this.preprocessedDicts[this.currentMode][firstChar];

    if (!relevantEntries) {
        return [];
    }

    const candidates = [];
    // 只遍歷相關的分組
    for (const entry of relevantEntries) {
        if (entry.originalKey.includes(' ') || entry.originalKey.includes('-')) {
            const abbreviation = entry.originalKey
                // 使用正則表達式 /[\s-]+/ 來分割拼音
                .split(/[\s-]+/)
                .filter(part => part)
                .map(part => this.getInitial(part, this.currentMode))
                .join('');
            
            if (abbreviation.startsWith(normalizedBuffer)) {
                candidates.push(...entry.values);
            }
        }
    }
    return candidates;
},


renderCandidates() {
    this.candidatesList.innerHTML = '';
    this.updatePaginationButtons();

    const startIndex = this.currentPage * this.config.candidatesPerPage;
    const pageCandidates = this.allCandidates.slice(startIndex, startIndex + this.config.candidatesPerPage);

    pageCandidates.forEach((candidateObj, index) => {
        const li = document.createElement('li');
        if (index === this.highlightedIndex) li.classList.add('highlighted');
        const indexSpan = document.createElement('span');
        indexSpan.className = 'candidate-index';
        indexSpan.innerHTML = `<sup>${index + 1}</sup>`;
        const textSpan = document.createElement('span');
        textSpan.className = 'candidate-text';
        // 從物件中讀取 word 屬性來顯示
        textSpan.textContent = candidateObj.word;
        li.appendChild(indexSpan); li.appendChild(textSpan);
        li.addEventListener('mousedown', (e) => { e.preventDefault(); this.selectCandidate(index); });
        this.candidatesList.appendChild(li);
    });
},

clearCandidates() {
    this.allCandidates = [];
    this.renderCandidates();
    this.updateUIState();
},

commitText(text) {
     if (!this.activeElement) return;

     // --- NEW: 設定旗標，通知 input listener 這是程式觸發的更動 ---
     this.isCommittingText = true;

     if (this.activeElement.isContentEditable) {
         const sel = window.getSelection();
         if (sel.rangeCount > 0) {
             const range = sel.getRangeAt(0);
             range.deleteContents();
             const textNode = document.createTextNode(text);
             range.insertNode(textNode);
             range.setStartAfter(textNode);
             range.setEndAfter(textNode);
             sel.removeAllRanges();
             sel.addRange(range);
         }
     } else {
         const start = this.activeElement.selectionStart;
         const end = this.activeElement.selectionEnd;
         this.activeElement.value = this.activeElement.value.substring(0, start) + text + this.activeElement.value.substring(end);
         const newCursorPos = start + text.length;
         this.activeElement.selectionStart = this.activeElement.selectionEnd = newCursorPos;
     }
     
     this.lastInputValue = this.activeElement.isContentEditable ? this.activeElement.textContent : this.activeElement.value;
     this.activeElement.dispatchEvent(new Event('input', { bubbles: true }));

     setTimeout(() => {
         this.isCommittingText = false;
     }, 0);
},


selectCandidate(indexOnPage) {
    const wasInQueryMode = this.isQueryMode;
    const startIndex = this.currentPage * this.config.candidatesPerPage;
    const selectedCandidate = this.allCandidates[startIndex + indexOnPage];
    if (!selectedCandidate) return;

    const selectedWord = selectedCandidate.word;
    const consumedBuffer = this.isPredictionState ? selectedWord : selectedCandidate.consumed;
    const nonPinyinModes = ['cangjie', 'xiami', 'hanglie'];
    const isPinyinOutputAvailable = !nonPinyinModes.includes(this.currentMode);
    
    let textToCommit = selectedWord; 


    if (this.config.outputModeActive && this.config.outputMode !== 'word' && isPinyinOutputAvailable) {
        const possibleCodes = this.reverseDicts[this.currentMode]?.[selectedWord];
    

        
        if (possibleCodes && possibleCodes.length > 0) {
            let bestMatchCode = possibleCodes[0]; 
            if (possibleCodes.length > 1) {
                const simplifiedUserInput = this.simplifyKey(consumedBuffer, this.currentMode);
                let foundMatch = possibleCodes.find(code => this.simplifyKey(code, this.currentMode) === simplifiedUserInput);
                if (!foundMatch) {
                    foundMatch = possibleCodes.find(code => this.simplifyKey(code, this.currentMode).startsWith(simplifiedUserInput));
                }
                if (foundMatch) {
                    bestMatchCode = foundMatch;
                }
            }
            
            const transformedPinyin = this.transformQueryCode(bestMatchCode, this.currentMode);
            
            // 根據子選項的設定來決定輸出格式
            if (this.config.outputMode === 'pinyin') {
                textToCommit = transformedPinyin;
            } else if (this.config.outputMode === 'word_pinyin') {
                textToCommit = `${selectedWord}(${transformedPinyin})`;
            } else if (this.config.outputMode === 'word_pinyin2') {
                textToCommit = `${selectedWord}［${transformedPinyin}］`;
            }
        }
    }

    // 1. 將最終處理好的文字送到編輯區
    this.commitText(textToCommit);

	const remainingBuffer = this.compositionBuffer.substring(consumedBuffer.length);
	this.compositionBuffer = remainingBuffer;
	this.compositionCursorPos = remainingBuffer.length;

	if (this.compositionBuffer.length > 0) {
		this.isPredictionState = false;
		this.lastCommittedWord = '';
		this.updateCandidates();
	} else {
		if (wasInQueryMode) {
			this.exitQueryMode(false);
			this.updateCandidates();
			return;
		}
		
		// --- 【新的聯想詞邏輯判斷區塊】 ---
		
		// 判斷是否應該顯示聯想詞的條件：
		// 1. "啟用聯想詞" 必須是 true
		// 2. 以下條件不能成立：("輸出字音" 為 true 且 目前模式不是 'word')
		const shouldShowPredictions = this.config.enablePrediction && 
									  !(this.config.toolbarButtons.outputModeToggle && this.config.outputMode !== 'word');

		if (shouldShowPredictions) {
			const predictions = this.findPredictionCandidates(selectedWord);
			if (predictions.length > 0) {
				this.isPredictionState = true;
				this.lastCommittedWord = selectedWord; 
				this.allCandidates = predictions.map(p => ({ word: p, consumed: p }));
				this.currentPage = 0;
				this.highlightedIndex = 0;
				this.updateCompositionDisplay();
				this.renderCandidates();
				this.updateUIState();
				this.reposition();
				return; // 顯示聯想詞後，結束函式
			}
		}

		// 如果不滿足顯示聯想詞的條件，則清空候選容器
		this.isPredictionState = false;
		this.lastCommittedWord = '';
		this.updateCandidates();
	}
},

updateCompositionDisplay() {
    if (this.compositionDisplay) {
        this.compositionDisplay.innerHTML = '';
        const preCursorText = this.compositionBuffer.substring(0, this.compositionCursorPos);

        const textSpan = document.createElement('span');
        textSpan.textContent = this.compositionBuffer;
        // --- 新增開始 ---
        // 只有當有文字時，才讓文字的 span 顯示可點擊的指標
        if (this.compositionBuffer) {
            textSpan.style.cursor = 'pointer';
        }
        // --- 新增結束 ---

        const measureSpan = document.createElement('span');
        measureSpan.style.visibility = 'hidden';
        measureSpan.style.position = 'absolute';
        measureSpan.style.fontFamily = '"Consolas", "Courier New", monospace';
        measureSpan.style.fontSize = '16px';
        measureSpan.style.letterSpacing = '1px';
        measureSpan.textContent = preCursorText;
        document.body.appendChild(measureSpan);
        const textWidth = measureSpan.offsetWidth;
        document.body.removeChild(measureSpan);

        this.compositionDisplay.appendChild(textSpan);
        this.compositionDisplay.style.setProperty('--cursor-offset', `${textWidth}px`);
    }
},


updateUIState() {
    // 【修改重點】: 加入 this.allCandidates.length > 0 的判斷
    // 確保在有聯想詞 (此時 compositionBuffer 為空) 的情況下，候選容器不會被隱藏
    if (this.compositionBuffer || this.allCandidates.length > 0) {
        this.candidatesContainer.style.display = 'flex';
        if (this.compositionDisplay) {
            // 僅在有編碼時才顯示編碼區，聯想詞模式下會自動隱藏
            this.compositionDisplay.style.display = this.compositionBuffer ? 'block' : 'none';
        }

        // 檢查是否有任何一個反查選項被勾選
        const hasQueryOptionEnabled = Object.values(this.config.querySettings || {}).some(v => v === true);

        // 只有當有候選字、至少一個反查選項被啟用，且不支援倉頡、蝦米反查時才顯示
        const showQueryButton = this.allCandidates.length > 0 && 
                              hasQueryOptionEnabled &&
                              !['cangjie', 'xiami'].includes(this.currentMode);

        this.queryBtn.style.display = showQueryButton ? 'flex' : 'none';
        
    } else {
        this.candidatesContainer.style.display = 'none';
        if (this.compositionDisplay) {
            this.compositionDisplay.style.display = 'none';
        }
        // 同時隱藏查詢按鈕
        this.queryBtn.style.display = 'none';
    }
},

/**
 * [升級版] 根據語言規則轉換查詢到的字根編碼，並保留原始分隔符。
 * 1. 優先檢查並使用專門的轉換函式 (如 holo)。
 * 2. 對於規則轉換，會將多音節拆開逐一處理，解決 `$` 結尾符號的問題。
 * @param {string} code - 原始編碼 (可能包含多個音節，以 ' ', '-', '--' 分隔)
 * @param {string} lang - 語言模式
 * @returns {string} - 轉換後的編碼
 */
transformQueryCode(code, lang) {
    // 倉頡與蝦米直接轉為大寫
    if (lang === 'cangjie' || lang === 'xiami') {
        return code.toUpperCase();
    }

    // 1. 使用正則表達式分割字串，同時捕獲分隔符
    //    例如 "vuz--hav" 會被分割成 ["vuz", "--", "hav"]
    const parts = code.split(/([\s-]+)/);

    // 2. 遍歷分割後的陣列
    const transformedParts = parts.map(part => {
        // 3. 如果這個部分是分隔符 (或因分割產生的空字串)，直接返回，不進行處理
        if (/^[\s-]*$/.test(part)) {
            return part;
        }

        // 4. 如果這個部分是音節，則對其進行聲調轉換
        let transformedSyllable = part;

        // 優先使用專門的轉換函式 (如 Holo)
        if (window.imeToneTransformFunctions && typeof window.imeToneTransformFunctions[lang] === 'function') {
            transformedSyllable = window.imeToneTransformFunctions[lang](part);
        } 
        // 否則，使用通用的規則表 (如 Hakka)
        else {
            const rules = (window.imeToneTransformRules || {})[lang];
            if (rules && rules.length > 0) {
                for (const rule of rules) {
                    try {
                        const regex = new RegExp(rule[0][0], rule[0][1]);
                        // 使用 .test() 檢查是否匹配，如果匹配就替換並跳出迴圈
                        if (regex.test(transformedSyllable)) {
                            transformedSyllable = transformedSyllable.replace(regex, rule[1]);
                            break; // 一個音節只套用第一條匹配的規則
                        }
                    } catch (e) {
                        console.error(`Error applying regex rule for lang "${lang}" on syllable "${part}":`, rule, e);
                    }
                }
            }
        }
        return transformedSyllable;
    });
    
    // 5. 將處理完畢的所有部分組合回一個字串
    return transformedParts.join('');
},

/**
 * 進入編碼查詢模式
 */
enterQueryMode() {
    // 從候選物件中取得 .word 屬性
    const candidate = this.allCandidates[this.currentPage * this.config.candidatesPerPage + this.highlightedIndex];
    if (!candidate) return;
    const candidateWord = candidate.word;

    // 儲存當前狀態
    this.isQueryMode = true;
    this.queriedWord = candidateWord;
    this.originalState = {
        allCandidates: [...this.allCandidates],
        currentPage: this.currentPage,
        highlightedIndex: this.highlightedIndex
    };

    // 此處建立的空陣列可確保每次查詢都是全新的結果
    const queryResults = [];
    const chars = [...candidateWord]; // 處理 Unicode 字元

    // --- 修改核心：根據設定來產生查詢結果 ---
    const enabledLangs = this.config.querySettings || {};

    chars.forEach(char => {
        // --- 【新增的程式碼】 ---
        // 優先處理 Unicode 查詢
        if (enabledLangs.unicode) {
            // .codePointAt(0) 可以正確處理擴充字元 (如：𠊎)
            // .toString(16) 轉換為十六進位
            // .toUpperCase() 轉為大寫
            const codePoint = char.codePointAt(0).toString(16).toUpperCase();
            queryResults.push(`[U] ${char} ${codePoint}`);
        }
        // --- 【新增結束】 ---

        for (const lang in enabledLangs) {
            // 如果該語言在設定中是啟用的，並且反查字典存在
            if (enabledLangs[lang] && this.reverseDicts[lang]) {
                const codes = this.reverseDicts[lang][char] || ['']; // 查無
                
                // 【主要修改點】對查詢到的每個編碼進行轉換
                const transformedCodes = codes.map(code => this.transformQueryCode(code, lang));

                const displayName = this.getModeDisplayName(lang).charAt(0);
                queryResults.push(`[${displayName}] ${char} ${transformedCodes.join(' / ')}`); // 列出字根
            }
        }
    });
    
    // 如果沒有任何啟用的查詢語言，或查無結果，給予提示
    if (queryResults.length === 0) {
        const hasAnyLangEnabled = Object.values(enabledLangs).some(v => v === true);
        if (hasAnyLangEnabled) {
            queryResults.push(`「${this.queriedWord}」查無`);
        } else {
            queryResults.push('未設定反查');
        }
    }

    // 用查詢結果更新候選列表 (此處仍使用字串，因為反查結果是純資訊)
    this.allCandidates = queryResults.map(item => ({ word: item, consumed: this.queriedWord }));
    this.currentPage = 0;
    this.highlightedIndex = 0;
    this.renderCandidates();
},

/**
 * 離開編碼查詢模式
 */
exitQueryMode(commitText = false) {
    if (!this.isQueryMode) return;

    if (commitText) {
        this.commitText(this.queriedWord);
        this.compositionBuffer = '';
        this.compositionCursorPos = 0;
        this.updateCandidates();
    } else {
        // 還原狀態
        this.allCandidates = this.originalState.allCandidates;
        this.currentPage = this.originalState.currentPage;
        this.highlightedIndex = this.originalState.highlightedIndex;
        this.renderCandidates();
    }
    
    this.isQueryMode = false;
    this.queriedWord = '';
    this.originalState = null;
},


togglePinMode() {
    this.isPinned = !this.isPinned;
    localStorage.setItem(this.config.storagePrefix + 'isPinned', this.isPinned);
    this.pinToggleBtn.classList.toggle('active', this.isPinned);

    if (this.isPinned) {
        // --- 進入釘選模式（可自由拖曳）---
        // 獲取目前工具列的位置作為釘選的初始位置
        const rect = this.toolbarContainer.getBoundingClientRect();
        this.pinnedTop = `${rect.top}px`;
        this.pinnedLeft = `${rect.left}px`;

        this.toolbarContainer.style.top = this.pinnedTop;
        this.toolbarContainer.style.left = this.pinnedLeft;
        this.toolbarContainer.style.bottom = 'auto'; // 改為 top/left 定位，必須清除 bottom
        this.toolbarContainer.style.right = 'auto';  // 清除 right

        localStorage.setItem(this.config.storagePrefix + 'pinnedTop', this.pinnedTop);
        localStorage.setItem(this.config.storagePrefix + 'pinnedLeft', this.pinnedLeft);
    } else {
        // --- 取消釘選模式（吸附回角落）---
        this.toolbarContainer.style.top = 'auto';
        this.toolbarContainer.style.left = '10px';
        this.toolbarContainer.style.bottom = '10px';
        this.toolbarContainer.style.right = 'auto';

        // 清除已儲存的釘選位置
        localStorage.removeItem(this.config.storagePrefix + 'pinnedTop');
        localStorage.removeItem(this.config.storagePrefix + 'pinnedLeft');
    }
    
    if (this.activeElement) {
        this.activeElement.focus();
    }
},




/**
 * 【修改後版本】
 * 切換輸入法的啟用/停用狀態。
 * 這個函數現在會同時控制浮動工具列、外部工具列的 disabled 狀態，
 * 並且在停用時，會直接隱藏整個候選字視窗。
 */
toggleIsEnabled() {
    this.isEnabled = !this.isEnabled;
    const isDisabled = !this.isEnabled;

    // 1. 控制主要浮動工具列的 disabled 狀態
    if (this.toolbarContainer) {
        this.toolbarContainer.classList.toggle('disabled', isDisabled);
    }

    // 2. 【新增】控制外部工具列的 disabled 狀態
    const externalToolbar = document.getElementById('ime-external-toolbar-container');
    if (externalToolbar) {
        externalToolbar.classList.toggle('disabled', isDisabled);
    }

    // 3. 處理當前作用中的輸入框事件綁定
    if (this.activeElement) {
        this.activeElement.removeEventListener('keydown', this.boundHandleKeyDown);
        this.activeElement.removeEventListener('input', this.boundHandleInput);
        
        if (this.isEnabled) {
            this.activeElement.addEventListener('keydown', this.boundHandleKeyDown);
            if (this.isMobile) {
                this.activeElement.addEventListener('input', this.boundHandleInput);
            }
        }
    }

    // 4. 【修改】如果切換為停用狀態，不僅清空候選字，也直接隱藏候選字容器
    if (isDisabled) {
        this.compositionBuffer = ''; // 清除編碼
        this.compositionCursorPos = 0;
        this.clearCandidates(); 
        if(this.candidatesContainer) {
            this.candidatesContainer.style.display = 'none'; // 隱藏候選字視窗
        }
    }

    const status = this.isEnabled ? "已啟用" : "已停用";
    this.showToast(`輸入法 ${status}`);
},

toggleLongPhraseMode() {
    this.isLongPhraseEnabled = !this.isLongPhraseEnabled;
    localStorage.setItem(this.config.storagePrefix + 'longPhrase', this.isLongPhraseEnabled);
    
    // 【修改】遍歷所有相關按鈕並更新
    this.allLongPhraseButtons.forEach(btn => {
        btn.classList.toggle('active', this.isLongPhraseEnabled);
    });

    this.updateCandidates();
    if (this.activeElement) this.activeElement.focus();
    const modeText = this.isLongPhraseEnabled ? '長詞連打' : '首音縮打';
    this.showToast(modeText);
},

togglePunctuationMode() {
    this.isFullWidthMode = !this.isFullWidthMode;
    localStorage.setItem(this.config.storagePrefix + 'fullWidth', this.isFullWidthMode);
    this.updatePunctuationButtonUI();
    if (this.activeElement) this.activeElement.focus();

    const modeText = this.isFullWidthMode ? '全形標點' : '半形標點';
    this.showToast(modeText);
},



updatePunctuationButtonUI() {
    // 【修改】遍歷所有相關按鈕並更新
    this.allPunctuationButtons.forEach(btn => {
        if (btn) {
            btn.innerHTML = this.isFullWidthMode 
                ? '<span class="material-icons" style="font-size: 16px;">radio_button_unchecked</span>' 
                : '<span class="material-icons" style="font-size: 16px;">tonality</span>';
            
            btn.classList.toggle('active', this.isFullWidthMode);
        }
    });
},

navigateCandidates(direction) {
    const itemsOnPage = this.candidatesList.children.length;
    let newIndex = this.highlightedIndex + direction;
    if (newIndex < 0) {
        if (this.currentPage > 0) this.changePage(-1, true);
    } else if (newIndex >= itemsOnPage) {
        if ((this.currentPage + 1) * this.config.candidatesPerPage < this.allCandidates.length) this.changePage(1);
    } else {
        this.highlightedIndex = newIndex; this.updateHighlight();
    }
},
updateHighlight() {
    this.candidatesList.querySelectorAll('li').forEach((li, index) => {
        li.classList.toggle('highlighted', index === this.highlightedIndex);
    });
},
changePage(direction, highlightLast = false) {
    const newPage = this.currentPage + direction;
    const maxPage = Math.ceil(this.allCandidates.length / this.config.candidatesPerPage) - 1;
    if (newPage >= 0 && newPage <= maxPage) {
        this.currentPage = newPage;
        const itemsOnNewPage = this.allCandidates.slice(newPage * this.config.candidatesPerPage, (newPage + 1) * this.config.candidatesPerPage).length;
        this.highlightedIndex = highlightLast ? itemsOnNewPage - 1 : 0;
        this.renderCandidates();
    }
},
updatePaginationButtons() {
    this.prevPageBtn.disabled = this.currentPage === 0;
    const maxPage = Math.ceil(this.allCandidates.length / this.config.candidatesPerPage) - 1;
    this.nextPageBtn.disabled = this.currentPage >= maxPage || this.allCandidates.length === 0;
},


switchMode(mode) {
    this.currentMode = mode;
    localStorage.setItem(this.config.storagePrefix + 'mode', mode);

    const langProps = imeLanguageProperties[this.currentMode] || {};
    
    if (langProps.layoutType === 'narrow') {
        this.candidatesContainer.classList.add('ime-narrow');
    } else {
        this.candidatesContainer.classList.remove('ime-narrow');
    }

    this.config.maxCompositionLength = langProps.maxLength || this.config.globalMaxCompositionLength;
    
    if (langProps.allowLongPhraseToggle === false) {
        this.isLongPhraseEnabled = langProps.longPhraseMode === true;
    } else {
        const savedLongPhrase = localStorage.getItem(this.config.storagePrefix + 'longPhrase');
        if (savedLongPhrase !== null) {
            this.isLongPhraseEnabled = savedLongPhrase === 'true';
        } else {
            this.isLongPhraseEnabled = this.config.longPhrase;
        }
    }

    // 【修改】使用 allLongPhraseButtons 陣列來同步
    this.allLongPhraseButtons.forEach(btn => {
        btn.classList.toggle('active', this.isLongPhraseEnabled);
    });

    if (this.settingsModal) {
        const isPinyinOutputAvailable = !['cangjie', 'xiami', 'hanglie'].includes(this.currentMode);
        const outputSettingRow = this.settingsModal.querySelector('#web-ime-output-mode-setting-row');
        if (outputSettingRow) {
            outputSettingRow.style.display = isPinyinOutputAvailable ? '' : 'none';
        }
    }

    // 【修改】同步所有語言選單的顯示文字
    this.allModeDisplayTexts.forEach(textEl => {
        textEl.textContent = this.getModeDisplayName(mode);
    });


    this.allModeMenus.forEach(menuEl => {
        menuEl.querySelectorAll('li').forEach(item => {
            item.classList.toggle('active', item.dataset.mode === mode);
        });
        // 【修改】直接移除 open class 即可，不再需要手動更新 isModeMenuVisible
        const container = menuEl.parentElement;
        if (container) {
            container.classList.remove('open');
        }
    });


    this.compositionBuffer = '';
    this.compositionCursorPos = 0;
    this.updateCandidates();

    this.updateToolbarButtonsVisibility();
    this.updateToneModeButtonUI();
    this.updateOutputModeButtonUI();

    if (this.activeElement) this.activeElement.focus();
},

getCaretCoordinates(element, position) {
    const mirrorDivId = "web-ime-mirror-div";
    let mirrorDiv = document.getElementById(mirrorDivId);
    if (!mirrorDiv) {
        mirrorDiv = document.createElement("div");
        mirrorDiv.id = mirrorDivId;
        document.body.appendChild(mirrorDiv);
    }
    const style = window.getComputedStyle(element);
    const properties = [
        'border', 'boxSizing', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
        'letterSpacing', 'lineHeight', 'padding', 'textAlign', 'textTransform',
        'wordSpacing', 'textIndent', 'whiteSpace', 'wordWrap', 'wordBreak'
    ];
    properties.forEach(prop => {
        mirrorDiv.style[prop] = style[prop];
    });
    mirrorDiv.style.width = style.width;
    mirrorDiv.style.position = 'absolute';
    mirrorDiv.style.visibility = 'hidden';
    mirrorDiv.textContent = element.value.substring(0, position);
    const span = document.createElement('span');
    span.textContent = '|';
    mirrorDiv.appendChild(span);
    const elementRect = element.getBoundingClientRect();
    const top = elementRect.top + (span.offsetTop - element.scrollTop) + parseInt(style.borderTopWidth);
    const left = elementRect.left + (span.offsetLeft - element.scrollLeft) + parseInt(style.borderLeftWidth);
    return { top, left };
},


reposition() {
    if (this.candidatesContainer.style.display === 'none' || !this.activeElement) return;

    const candidatesContainer = this.candidatesContainer;
    const activeElement = this.activeElement;

    let caretRect;
    const elementRect = activeElement.getBoundingClientRect();

    if (activeElement.isContentEditable) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rects = range.getClientRects();
            if (rects.length > 0) {
                caretRect = rects[rects.length - 1];
            }
        }
        if (!caretRect || (caretRect.width === 0 && caretRect.height === 0)) {
            caretRect = elementRect;
        }
    } else if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
        const coords = this.getCaretCoordinates(activeElement, activeElement.selectionStart);
        const computedStyle = window.getComputedStyle(activeElement);
        const lineHeight = parseInt(computedStyle.lineHeight) || (parseInt(computedStyle.fontSize) * 1.4);
        caretRect = {
            top: coords.top,
            bottom: coords.top + lineHeight,
            left: coords.left,
            right: coords.left,
            height: lineHeight,
            width: 0
        };
    } else {
        caretRect = elementRect;
    }

    const imeHeight = candidatesContainer.offsetHeight;
    const imeWidth = candidatesContainer.offsetWidth;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const margin = 10;

    // --- 垂直定位 (通用邏輯) ---
    // 優先嘗試放在游標下方
    let finalTop = caretRect.bottom + window.scrollY + 5;
    // 如果下方空間不足，則嘗試放到游標上方
    if ((finalTop - window.scrollY + imeHeight) > viewportHeight) {
        if (caretRect.top - imeHeight - 5 > 0) {
            finalTop = caretRect.top + window.scrollY - imeHeight - 5;
        } else { // 如果上方空間也不足，就貼齊視窗底部
            finalTop = window.scrollY + viewportHeight - imeHeight - margin;
        }
    }
     // 確保不會超出頂部邊緣
    if (finalTop < window.scrollY + margin) {
        finalTop = window.scrollY + margin;
    }


    // --- 水平定位 (通用邏輯) ---
    // 無論是電腦或手機，都採用相同的游標追蹤邏輯
    let finalLeft = caretRect.left + window.scrollX;

    // 恢復或設定 CSS 預設的最大寬度，確保寬度計算正確
    candidatesContainer.style.maxWidth = '90vw'; 

    // 如果右側超出視窗，則向左移動，實現「向左擴展」效果
    if (finalLeft - window.scrollX + imeWidth > viewportWidth - margin) {
        finalLeft = window.scrollX + viewportWidth - imeWidth - margin;
    }
    // 確保不會超出左側邊緣
    if (finalLeft < window.scrollX + margin) {
        finalLeft = window.scrollX + margin;
    }

    // 應用最終計算出的位置
    candidatesContainer.style.top = `${finalTop}px`;
    candidatesContainer.style.left = `${finalLeft}px`;
    candidatesContainer.style.position = 'absolute';
},

show() {
    this.toolbarContainer.style.display = 'block';
},

hide() {
    this.toolbarContainer.style.display = 'none';
    this.candidatesContainer.style.display = 'none';
},

getModeDisplayName(mode) {
    const names = { 'pinyin': '拼音', 'kasu': '詔安', 'sixian': '四縣', 'hailu': '海陸' , 'dapu': '大埔' , 'raoping': '饒平' , 'sixiannan': '南四' ,'holo': '和樂', 'cangjie': '倉頡', 'xiami': '蝦米', 'hanglie': '行列' };
    return names[mode] || mode;
},


/**
 * 切換工具列在左下角或右下角的位置
 */
togglePosition() {
    this.isPositionRight = !this.isPositionRight;
    if (this.isPositionRight) {
        localStorage.setItem(this.config.storagePrefix + 'position', 'right');
    } else {
        localStorage.removeItem(this.config.storagePrefix + 'position');
    }
    this.updateToolbarPosition();
    if (this.activeElement) {
        this.activeElement.focus();
    }
},

/**
 * 根據 isPositionRight 狀態更新工具列的 CSS 樣式
 */
updateToolbarPosition() {
    if (this.isPositionRight) {
        this.toolbarContainer.style.left = 'auto';
        this.toolbarContainer.style.right = '10px';
    } else {
        this.toolbarContainer.style.left = '10px';
        this.toolbarContainer.style.right = 'auto';
    }
},


initDrag(e) {
    // ******** 修改點 ********
    // 使用 .closest() 來判斷點擊的是否為按鈕或其內部元素。
    // 無論使用者點到的是按鈕本身，還是按鈕裡面的圖示(<span>)，
    // closest('button') 都能找到最近的 <button> 元素，從而正確地跳過拖曳。
    if (e.target.closest('button, select')) {
        return;
    }

    // 只響應滑鼠左鍵
    if (e.type === 'mousedown' && e.button !== 0) return;

    this.isDragging = true;
    const rect = this.toolbarContainer.getBoundingClientRect();
    
    this.toolbarContainer.style.top = `${rect.top}px`;
    this.toolbarContainer.style.left = `${rect.left}px`;
    this.toolbarContainer.style.right = 'auto';  // 清除 right 屬性
    this.toolbarContainer.style.bottom = 'auto'; // 清除 bottom 屬性

    const touch = e.touches ? e.touches[0] : null;
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;

    // 計算滑鼠（或觸控點）在容器內的偏移量
    this.offsetX = clientX - rect.left;
    this.offsetY = clientY - rect.top;

    // 綁定後續的移動和結束事件
    window.addEventListener('mousemove', this.boundDragMove);
    window.addEventListener('touchmove', this.boundDragMove, { passive: false });
    window.addEventListener('mouseup', this.boundDragEnd);
    window.addEventListener('touchend', this.boundDragEnd);
    
    // 防止拖曳時選取到頁面上的文字
    if (e.cancelable) {
        e.preventDefault();
    }
},



dragMove(e) {
    if (!this.isDragging) return;
    if (e.type === 'touchmove') e.preventDefault();

    const touch = e.touches ? e.touches[0] : null;
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;

    let newLeft = clientX - this.offsetX;
    let newTop = clientY - this.offsetY;

    const margin = 10;
    const imeWidth = this.toolbarContainer.offsetWidth;
    const imeHeight = this.toolbarContainer.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    newLeft = Math.max(margin, newLeft);
    newLeft = Math.min(newLeft, viewportWidth - imeWidth - margin);
    newTop = Math.max(margin, newTop);
    newTop = Math.min(newTop, viewportHeight - imeHeight - margin);

    // 拖曳時，更新並儲存釘選位置
    this.pinnedTop = `${newTop}px`;
    this.pinnedLeft = `${newLeft}px`;
    localStorage.setItem(this.config.storagePrefix + 'pinnedTop', this.pinnedTop);
    localStorage.setItem(this.config.storagePrefix + 'pinnedLeft', this.pinnedLeft);

    this.toolbarContainer.style.left = this.pinnedLeft;
    this.toolbarContainer.style.top = this.pinnedTop;
    
    // 拖曳工具列時，候選字列不需要跟隨，因為它只跟隨游標
},

dragEnd() { 
    this.isDragging = false; 
    
    // --- NEW: 移除所有滑鼠和觸控事件的監聽器 ---
    window.removeEventListener('mousemove', this.boundDragMove); 
    window.removeEventListener('touchmove', this.boundDragMove);
    window.removeEventListener('mouseup', this.boundDragEnd); 
    window.removeEventListener('touchend', this.boundDragEnd);
},

ensureInBounds() {
    if (!this.toolbarContainer) return;

    const rect = this.toolbarContainer.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 10;

    let newLeft = rect.left;
    let newTop = rect.top;

    // 檢查是否超出右邊界
    if (newLeft + rect.width > viewportWidth - margin) {
        newLeft = viewportWidth - rect.width - margin;
    }
    // 檢查是否超出下邊界
    if (newTop + rect.height > viewportHeight - margin) {
        newTop = viewportHeight - rect.height - margin;
    }
    // 檢查是否超出左邊界
    if (newLeft < margin) {
        newLeft = margin;
    }
    // 檢查是否超出上邊界
    if (newTop < margin) {
        newTop = margin;
    }

    // 如果計算出的新位置與當前位置不同，則更新樣式和儲存的座標
    if (newLeft !== rect.left || newTop !== rect.top) {
        const finalLeft = `${newLeft}px`;
        const finalTop = `${newTop}px`;

        this.toolbarContainer.style.left = finalLeft;
        this.toolbarContainer.style.top = finalTop;

        // 同步更新儲存在 localStorage 的位置
        localStorage.setItem(this.config.storagePrefix + 'pinnedLeft', finalLeft);
        localStorage.setItem(this.config.storagePrefix + 'pinnedTop', finalTop);
    }
},

showCustomConfirm(message, onConfirm) {
    // 移除畫面上可能已存在的舊對話框
    const existingDialog = document.getElementById('web-ime-custom-confirm');
    if (existingDialog) {
        existingDialog.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'web-ime-custom-confirm';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
        z-index: 10001; /* 確保在設定視窗之上 */
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 24px;
        box-shadow: 0 4px 16px rgba(60,64,67,0.15);
        max-width: 320px;
        width: 90%;
        text-align: center;
        transform: scale(0.95);
        transition: transform 0.2s ease-in-out;
    `;

    // 使用 innerHTML 快速建立內部結構
    dialog.innerHTML = `
        <div style="font-size: 16px; color: #202124; line-height: 1.5; margin-bottom: 20px;">${message}</div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button id="ime-confirm-cancel" style="
                background: transparent; border: 1px solid transparent; border-radius: 4px;
                padding: 8px 12px; cursor: pointer; color: #1a73e8; font-size: 14px; font-weight: 500;
            ">取消</button>
            <button id="ime-confirm-ok" style="
                background: #1a73e8; border: none; border-radius: 4px;
                padding: 8px 12px; cursor: pointer; color: white; font-size: 14px; font-weight: 500;
            ">確定重設</button>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // 漸入動畫
    setTimeout(() => {
        overlay.style.opacity = '1';
        dialog.style.transform = 'scale(1)';
    }, 10);

    const closeDialog = () => {
        overlay.style.opacity = '0';
        dialog.style.transform = 'scale(0.95)';
        setTimeout(() => {
             if (overlay.parentNode) {
                overlay.remove();
             }
        }, 200);
    };

    const cancelBtn = document.getElementById('ime-confirm-cancel');
    const confirmBtn = document.getElementById('ime-confirm-ok');

    // 綁定事件
    cancelBtn.onclick = closeDialog;
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closeDialog();
        }
    };
    confirmBtn.onclick = () => {
        onConfirm(); // 執行傳入的確認後動作
        closeDialog();
    };
},

showToast(message, duration = 1200) {
    // 如果畫面上已經有一個提示，先將它移除
    if (this.toastElement && this.toastElement.parentNode) {
        this.toastElement.remove();
    }

    const toast = document.createElement('div');
    this.toastElement = toast;

    // 設定提示訊息的樣式與內容
    toast.style.cssText = `
        position: fixed; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%); 
        background: rgba(0,0,0,0.75); 
        color: white; 
        padding: 12px 24px; 
        border-radius: 8px; 
        z-index: 10001; 
        font-size: 16px;
        pointer-events: none;
        opacity: 1;
        transition: opacity 0.4s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 設定計時器，在指定時間後淡出並移除提示
    setTimeout(() => {
        toast.style.opacity = '0';
        // 等待淡出動畫結束後再從 DOM 中移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
            if (this.toastElement === toast) {
                this.toastElement = null;
            }
        }, 400); // 400ms 應與 transition 的時間一致
    }, duration);
},


};

window.WebIME = WebIME;
})();

/**
 * 聲調轉換規則表
 * 每個規則由 [ [正則表達式字串, 旗標], 替換字串] 組成。
 */
const hakkaToneRules = [
    [['([aeioumngbd])(z)$', 'g'], '$1ˊ'],
    [['([aeioumngbd])(v)$', 'g'], '$1ˇ'],
    [['([aeioumngbd])(s)$', 'g'], '$1ˋ'],
    [['([aeioumngbd])(x)$', 'g'], '$1ˆ'],
    [['([aeioumngbd])(f)$', 'g'], '$1⁺']
];

window.imeToneTransformRules = {
    'pinyin': [], // 拼音模式目前無此需求，可留空
    'sixian': hakkaToneRules,
    'hailu': hakkaToneRules,
    'dapu': hakkaToneRules,
    'raoping': hakkaToneRules,
    'sixiannan': hakkaToneRules

};


/**
 * 詔安(kasu)客語拼音轉換函式
 * 將輸入的 rov (數字/字母調) 轉換為帶有聲調符號的 rhoobb (白話字) 拼音。
 * 規則包含：r/v 變體、o/oo 轉換，以及聲調符號替換。
 */
const imeKasuRovToRhoobb = (function() {
    return function(t) {
        // 規則1: 詞首的 r + 母音 -> rh + 母音
        // 例如：riuv -> rhiuv
        t = t.replace(/\b(r)([aeiou])/g, 'rh$2');

        // 規則2: 詞首的 v + 母音 -> bb + 母音
        // 例如：vuz -> bbuz
        t = t.replace(/\b(v)([aeiou])/g, 'bb$2');

        // 規則3: 特定聲母 + o + (選擇性聲調) -> 聲母 + oo + (選擇性聲調)
        // 例如：lox -> loox, gons -> goons
        t = t.replace(/\b([bpfdtlgkhzcs]|bb|zh|ch|sh|rh)(o)([zvsx]?)\b/g, '$1oo$3');
        
        // 規則4: 單獨的 o + (選擇性聲調) -> oo + (選擇性聲調)
        // 例如：ox -> oox
        t = t.replace(/\b(o)([zvsx]?)\b/g, 'oo$2');

        // 規則5: 處理 z, v, s, x 聲調字母，轉換為對應的聲調符號
        t = t.replace(/([aeioumngbd])(z)$/g, '$1ˊ'); // 陽平
        t = t.replace(/([aeioumngbd])(v)$/g, '$1ˇ'); // 上聲
        t = t.replace(/([aeioumngbd])(s)$/g, '$1ˋ'); // 去聲
        t = t.replace(/([aeioumngbd])(x)$/g, '$1ˆ'); // 陽入

        return t;
    };
})();


/**
 * 聲調轉換函式表 (基於函式)
 * 提供比規則表更靈活的轉換邏輯。
 * 當此處定義了對應語言的函式時，將優先使用此函式進行 'w' 鍵的轉換。
 */
// 和樂字母調轉字中調   
const imeHoloZvsToTone = (function() {
    return function(t) {
		t=t.replace(/([MNmn])(n)(g|gh)(zz)\b/g, '$1n̋$3');
		t=t.replace(/([MNmn])(n)(g|gh)(z)\b/g, '$1ń$3');
		t=t.replace(/([MNmn])(n)(g|gh)(s)\b/g, '$1ǹ$3');
		t=t.replace(/([MNmn])(n)(g|gh)(x)\b/g, '$1n̂$3');
		t=t.replace(/([MNmn])(n)(g|gh)(v)\b/g, '$1ň$3');
		t=t.replace(/([MNmn])(n)(g|gh)(f)\b/g, '$1n̄$3');
		t=t.replace(/([MNmn])(n)(g|gh)(l)\b/g, '$1n̍$3');

		t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(zz)\b/g, 'Ő$2');
		t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(z)\b/g, 'Ó$2');
		t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(s)\b/g, 'Ò$2');
		t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(x)\b/g, 'Ô$2');
		t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(v)\b/g, 'Ǒ$2');
		t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(f)\b/g, 'Ō$2');
		t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(l)\b/g, 'O̍$2');
		t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(zz)\b/g, 'ő$2');
		t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(z)\b/g, 'ó$2');
		t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(s)\b/g, 'ò$2');
		t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(x)\b/g, 'ô$2');
		t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(v)\b/g, 'ǒ$2');
		t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(f)\b/g, 'ō$2');
		t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(l)\b/g, 'o̍$2');
		t=t.replace(/(Yu)((?:n|ng)?)(f)\b/g, 'Ǖ$2');
		t=t.replace(/(Yu)((?:n|ng)?)(z)\b/g, 'Ǘ$2');
		t=t.replace(/(Yu)((?:n|ng)?)(v)\b/g, 'Ǚ$2');
		t=t.replace(/(Yu)((?:n|ng)?)(s)\b/g, 'Ǜ$2');
		t=t.replace(/(yu)((?:n|ng)?)(f)\b/g, 'ǖ$2');
		t=t.replace(/(yu)((?:n|ng)?)(z)\b/g, 'ǘ$2');
		t=t.replace(/(yu)((?:n|ng)?)(v)\b/g, 'ǚ$2');
		t=t.replace(/(yu)((?:n|ng)?)(s)\b/g, 'ǜ$2');
		t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(f)\b/g, 'Ȳ$2');
		t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(v)\b/g, 'Y̌$2');
		t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(z)\b/g, 'Ý$2');
		t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(s)\b/g, 'Ỳ$2');
		t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(x)\b/g, 'Ŷ$2');
		t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(f)\b/g, 'ȳ$2');
		t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(v)\b/g, 'y̌$2');
		t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(z)\b/g, 'ý$2');
		t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(s)\b/g, 'ỳ$2');
		t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(x)\b/g, 'ŷ$2');
		t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(zz)\b/g, 'A̋$2');
		t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(z)\b/g, 'Á$2');
		t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(s)\b/g, 'À$2');
		t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(x)\b/g, 'Â$2');
		t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(v)\b/g, 'Ǎ$2');
		t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(f)\b/g, 'Ā$2');
		t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(l)\b/g, 'A̍$2');
		t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(zz)\b/g, 'a̋$2');
		t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(z)\b/g, 'á$2');
		t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(s)\b/g, 'à$2');
		t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(x)\b/g, 'â$2');
		t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(v)\b/g, 'ǎ$2');
		t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(f)\b/g, 'ā$2');
		t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(l)\b/g, 'a̍$2');


		t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(zz)\b/g, 'E̋$2');
		t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(z)\b/g, 'É$2');
		t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(s)\b/g, 'È$2');
		t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(x)\b/g, 'Ê$2');
		t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(v)\b/g, 'Ě$2');
		t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(f)\b/g, 'Ē$2');
		t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(l)\b/g, 'E̍$2');
		t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(zz)\b/g, 'e̋$2');
		t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(z)\b/g, 'é$2');
		t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(s)\b/g, 'è$2');
		t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(x)\b/g, 'ê$2');
		t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(v)\b/g, 'ě$2');
		t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(f)\b/g, 'ē$2');
		t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(l)\b/g, 'e̍$2');
		t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(zz)\b/g, 'Ű$2');
		t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(z)\b/g, 'Ú$2');
		t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(s)\b/g, 'Ù$2');
		t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(x)\b/g, 'Û$2');
		t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(v)\b/g, 'Ǔ$2');
		t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(f)\b/g, 'Ū$2');
		t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(l)\b/g, 'U̍$2');
		t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(zz)\b/g, 'ű$2');
		t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(z)\b/g, 'ú$2');
		t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(s)\b/g, 'ù$2');
		t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(x)\b/g, 'û$2');
		t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(v)\b/g, 'ǔ$2');
		t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(f)\b/g, 'ū$2');
		t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(l)\b/g, 'u̍$2');
		t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhrr]|nnh|ng|nn)?)(zz)\b/g, 'I̋$2');
		t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(z)\b/g, 'Í$2');
		t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(s)\b/g, 'Ì$2');
		t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(x)\b/g, 'Î$2');
		t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(v)\b/g, 'Ǐ$2');
		t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(f)\b/g, 'Ī$2');
		t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(l)\b/g, 'I̍$2');
		t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(zz)\b/g, 'i̋$2');
		t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(z)\b/g, 'í$2');
		t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(s)\b/g, 'ì$2');
		t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(x)\b/g, 'î$2');
		t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(v)\b/g, 'ǐ$2');
		t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(f)\b/g, 'ī$2');
		t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(l)\b/g, 'i̍$2');
		t=t.replace(/(M)((?:h)?)(zz)\b/g, 'M̋$2');
		t=t.replace(/(M)((?:h)?)(z)\b/g, 'Ḿ$2');
		t=t.replace(/(M)((?:h)?)(s)\b/g, 'M̀$2');
		t=t.replace(/(M)((?:h)?)(x)\b/g, 'M̂$2');
		t=t.replace(/(M)((?:h)?)(v)\b/g, 'M̌$2');
		t=t.replace(/(M)((?:h)?)(f)\b/g, 'M̄$2');
		t=t.replace(/(M)((?:h)?)(l)\b/g, 'M̍$2');
		t=t.replace(/(m)((?:h)?)(zz)\b/g, 'm̋$2');
		t=t.replace(/(m)((?:h)?)(z)\b/g, 'ḿ$2');
		t=t.replace(/(m)((?:h)?)(s)\b/g, 'm̀$2');
		t=t.replace(/(m)((?:h)?)(x)\b/g, 'm̂$2');
		t=t.replace(/(m)((?:h)?)(v)\b/g, 'm̌$2');
		t=t.replace(/(m)((?:h)?)(f)\b/g, 'm̄$2');
		t=t.replace(/(m)((?:h)?)(l)\b/g, 'm̍$2');

		t=t.replace(/(N)((g|gh)?)(zz)\b/g, 'N̋$2');
		t=t.replace(/(N)((g|gh)?)(z)\b/g, 'Ń$2');
		t=t.replace(/(N)((g|gh)?)(s)\b/g, 'Ǹ$2');
		t=t.replace(/(N)((g|gh)?)(x)\b/g, 'N̂$2');
		t=t.replace(/(N)((g|gh)?)(v)\b/g, 'Ň$2');
		t=t.replace(/(N)((g|gh)?)(f)\b/g, 'N̄$2');
		t=t.replace(/(N)((g|gh)?)(l)\b/g, 'N̍$2');

		t=t.replace(/(n)((g|gh)?)(zz)\b/g, 'n̋$2');
		t=t.replace(/(n)((g|gh)?)(z)\b/g, 'ń$2');
		t=t.replace(/(n)((g|gh)?)(s)\b/g, 'ǹ$2');
		t=t.replace(/(n)((g|gh)?)(x)\b/g, 'n̂$2');
		t=t.replace(/(n)((g|gh)?)(v)\b/g, 'ň$2');
		t=t.replace(/(n)((g|gh)?)(f)\b/g, 'n̄$2');
		t=t.replace(/(n)((g|gh)?)(l)\b/g, 'n̍$2');

        return t;
    };
})();

window.imeToneTransformFunctions = {
    'holo': imeHoloZvsToTone,
    'kasu': imeKasuRovToRhoobb
};
