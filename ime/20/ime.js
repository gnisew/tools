const imeDefaultKeyMap = {
    imeSelectCandidate: [' '],
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
    reverseLookup: ['\\'] 
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

// 動態將標點符號對應表，只加入到 imeTargetLanguages 列表指定的字典中
const imeTargetLanguages = ['kasu', 'sixian', 'hailu', 'dapu', 'raoping', 'sixiannan', 'holo', 'matsu', 'cangjie', 'xiami'];
imeTargetLanguages.forEach(lang => {
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
            ...imeDefaultKeyMap,
            imeSelectCandidate: [' '],
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
            ...imeDefaultKeyMap,
            imeSelectCandidate: [' '],
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
            ...imeDefaultKeyMap,
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
		keyMap: imeDefaultKeyMap
    },
    'kasu': { 
        toneType: 'alphabetic',
        toneModes: ['alphabetic', 'numeric'],
		keyMap: imeDefaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'zh', 'ch', 'sh', 'rh', 'ng', 'bb', 'b', 'p', 'm', 'f', 'v', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'z', 'c', 's' ],
        numericToneMap: {
            '1': '',
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
		keyMap: imeDefaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'ng', 'b', 'p', 'm', 'f', 'v', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'z', 'c', 's' ],
        numericToneMap: {
            '1': '',
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
		keyMap: imeDefaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'zh', 'ch', 'sh', 'rh', 'ng', 'b', 'p', 'm', 'f', 'v', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'z', 'c', 's' ],
        numericToneMap: {
            '1': '',
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
		keyMap: imeDefaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'zh', 'ch', 'sh', 'rh', 'ng', 'b', 'p', 'm', 'f', 'v', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'z', 'c', 's' ],
        numericToneMap: {
            '1': '',
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
		keyMap: imeDefaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'zh', 'ch', 'sh', 'rh', 'ng', 'b', 'p', 'm', 'f', 'v', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'z', 'c', 's' ],
        numericToneMap: {
            '1': '',
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
		keyMap: imeDefaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'ng', 'b', 'p', 'm', 'f', 'v', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'z', 'c', 's' ],
        numericToneMap: {
            '1': '',
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
		keyMap: imeDefaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'tsh', 'kh', 'ng', 'ph', 'th', 'ts', 'b', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 's', 't'],
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
    'matsu': { 
        toneType: 'numeric',
        // 定義可用的聲調模式
        toneModes: ['alphabetic', 'numeric'],  //toneModes: ['alphabetic', 'numeric'],
        // 定義數字到字母聲調的映射表
		keyMap: imeDefaultKeyMap,
		spaceActionOnNoCandidates: 'clear', 
		initialConsonants: [ 'tsh', 'kh', 'ng', 'ph', 'th', 'ts', 'b', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 's', 't', 'y'  ],
        numericToneMap: {
            '1': '',
            '2': 'f',
            '3': 'v',
            '4': 'z',
            '5': 's',
            '7': 'x',
            '8': ''
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
    'matsu': /[zvsfx]$/,
};



(function() {

    /**
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
    imeDefaultKeyMap: window.imeDefaultKeyMap || {},
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
	allEnableToggles: [],


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

    // 設定集中管理
    // 外部呼叫 imeInit() 時可以傳入客製化設定來覆寫它們
    config: {
        defaultMode: 'sixian',      // 預設輸入法
        longPhrase: false,           // 預設是否啟用連打模式
        candidatesPerPage: 5,       // 每頁顯示的候選字數量
        maxCompositionLength: 30,   // 編碼區最大字元數
        storagePrefix: 'webime_5_',   // 用於 localStorage 的前綴
		enablePrediction: false,
		outputMode: 'pinyin', 
    },
    
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isCommittingText: false, // 用於防止 input 事件的遞迴觸發
    lastInputValue: '',      // 用於在行動裝置上比對輸入差異
    isEnabled: true,
    isLongPhraseEnabled: true,
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
imePreprocessDictionaries() {
    console.log("Preprocessing dictionaries for performance optimization...");
    for (const mode in dictionaries) {
        if (Object.hasOwnProperty.call(dictionaries, mode)) {
            this.preprocessedDicts[mode] = {};
            const dictionary = dictionaries[mode];
            for (const key in dictionary) {
                if (Object.hasOwnProperty.call(dictionary, key)) {
                    // 簡化 key，移除聲調與空白，用於後續比對
                    const simplifiedKey = this.imeSimplifyKey(key, mode);
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
 * 建立反向字典 (字 -> 碼)，用於反查與拼音輸出功能。
 * 移除了只處理單一漢字的限制，現在會為所有詞彙建立索引。
 */
imeCreateReverseDictionaries() {
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
imeCreatePredictionMap() {
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
 * 建立拼音聯想詞地圖。
 * 遍歷字典中所有多音節的詞彙，建立 "前一個拼音" -> "後續拼音" 的映射。
 * 例如：詞條 'cins fungs' -> { 'cins': ['fungs'] }
 */
imeCreatePinyinPredictionMap() {
    console.log("Creating Pinyin prediction maps...");
    this.pinyinPredictionMap = {}; // 初始化新的 map 屬性
    for (const mode in dictionaries) {
        this.pinyinPredictionMap[mode] = {};
        const dictionary = dictionaries[mode];
        for (const key in dictionary) {
            // 只處理代表多音節詞彙的 key (包含空格或連字號)
            if (key.includes(' ') || key.includes('-')) {
                const syllables = key.split(/[\s-]+/);
                if (syllables.length > 1) {
                    // 簡化處理：目前只建立 "第一音節 -> 第二音節" 的聯想
                    const prefix = syllables[0];
                    const suffix = syllables[1];
                    if (!this.pinyinPredictionMap[mode][prefix]) {
                        this.pinyinPredictionMap[mode][prefix] = new Set();
                    }
                    this.pinyinPredictionMap[mode][prefix].add(suffix);
                }
            }
        }
        // 將 Set 轉換為 Array
        for (const prefix in this.pinyinPredictionMap[mode]) {
            this.pinyinPredictionMap[mode][prefix] = Array.from(this.pinyinPredictionMap[mode][prefix]);
        }
    }
    console.log("Pinyin prediction maps created.");
},


/**
 * 根據給定的前綴詞，從預處理的地圖中尋找聯想詞。
 * @param {string} prefix - 已送出的文字 (例如 "大" 或 "鴨嫲")
 * @returns {string[]} - 聯想詞陣列 (例如 ["方", "紅", "風"])
 */
imeFindPredictionCandidates(prefix) {
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
 * 根據給定的前綴拼音，從拼音聯想詞地圖中尋找聯想詞。
 * @param {string} prefix - 已送出的拼音 (例如 "cins")
 * @returns {string[]} - 聯想拼音的陣列 (例如 ["fungs"])
 */
imeFindPinyinPredictionCandidates(prefix) {
    if (!prefix || !this.pinyinPredictionMap[this.currentMode]) {
        return [];
    }
    // 直接從新的 map 中查詢
    return this.pinyinPredictionMap[this.currentMode][prefix] || [];
},


/**
 * 從 localStorage 載入聯想詞設定
 */
imeLoadPredictionSettings() {
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
imeSavePredictionSettings() {
    const checkbox = this.settingsModal.querySelector('#toggle-prediction');
    if (checkbox) {
        this.config.enablePrediction = checkbox.checked;
        localStorage.setItem(this.config.storagePrefix + 'prediction', this.config.enablePrediction);
    }
},






/**
 * 從 localStorage 載入聯想詞來源的對應設定
 */
imeLoadPredictionMappingSettings() {
    let settings;
    try {
        // 從 localStorage 讀取設定字串並解析為物件
        settings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'predictionMapping'));
    } catch (e) {
        // 如果解析失敗（例如資料不存在或格式錯誤），則設定為 null
        settings = null;
    }
    // 如果沒有儲存的設定，則使用空物件 {} 作為預設值，避免後續程式碼出錯
    this.config.predictionMapping = settings || {};
},


/**
 * 儲存聯想詞來源的對應設定到 localStorage
 */
imeSavePredictionMappingSettings() {
    // 檢查設定視窗是否存在，避免錯誤
    if (!this.settingsModal) return;

    const newMapping = {};
    // 透過 class name 找到所有我們新增的下拉選單
    const selectElements = this.settingsModal.querySelectorAll('.prediction-source-select');

    selectElements.forEach(select => {
        // 從 data-* 屬性中讀取這是為哪個輸入法設定的 (例如 'cangjie')
        const imeMode = select.dataset.ime;
        // 只儲存有被明確設定的值（不是"無"）
        if (imeMode && select.value) { 
            newMapping[imeMode] = select.value;
        }
    });

    // 更新到 WebIME 物件的 config 中
    this.config.predictionMapping = newMapping;
    // 將設定物件轉換為 JSON 字串後儲存到 localStorage
    localStorage.setItem(this.config.storagePrefix + 'predictionMapping', JSON.stringify(newMapping));
},


/**
 * 確保在呼叫任何依賴設定的函式前，所有設定都已載入。
 * @param {object} userConfig - 從 URL 參數解析而來的設定物件
 */
imeInit(userConfig = {}) {
    if (this.isInitialized) {
        this.imeDestroy();
    }
    this.isEnabled = true;

    this.boundReposition = this.imeReposition.bind(this);
    this.boundHandleInput = this.imeHandleInput.bind(this);
    this.boundHandleKeyDown = this.imeHandleKeyDown.bind(this);
    this.boundInitDrag = this.imeInitDrag.bind(this);
    this.boundDragMove = this.imeDragMove.bind(this);
    this.boundDragEnd = this.imeDragEnd.bind(this);
    this.boundEnsureInBounds = this.imeEnsureInBounds.bind(this);
    this.boundHandleClearCompositionClick = this.imeHandleClearCompositionClick.bind(this);

    // --- 1. 預處理字典 ---
    this.imePreprocessDictionaries();
    this.imeCreateReverseDictionaries();
    this.imeCreatePredictionMap();
	this.imeCreatePinyinPredictionMap(); 
    
    // --- 2. 載入各種設定 ---
    this.imeLoadPredictionMappingSettings();
    this.imeLoadQuerySettings();
    this.imeLoadKeyMapSettings();
    
    // --- 3. 建立主要UI和設定視窗 ---
    this.imeCreateUI();
    this.imeCreateSettingsModal();

    // 步驟 4.A: 提前載入並同步所有功能設定
    const defaults = {
        prediction: false, numericTone: true, longPhrase: false,
        fullWidthPunctuation: true, outputEnabled: false, outputMode: 'pinyin'
    };
    let fromStorage = {};
    try {
        fromStorage = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'featureSettings')) || {};
    } catch (e) { /* 若解析失敗則使用空物件 */ }

    const mergedFeatures = { ...defaults, ...fromStorage, ...(userConfig.features || {}) };
    this._syncFeatureSettings(mergedFeatures); 

    // 步驟 4.B: 現在才決定並切換模式，因為 imeSwitchMode 會用到 features 設定
    let finalMode = 'sixian'; 
    const fromStorageMode = localStorage.getItem(this.config.storagePrefix + 'mode');
    if (fromStorageMode && dictionaries[fromStorageMode]) {
        finalMode = fromStorageMode;
    }
    if (userConfig.defaultMode && dictionaries[userConfig.defaultMode]) {
        finalMode = userConfig.defaultMode;
    }
    this.currentMode = finalMode;
    localStorage.setItem(this.config.storagePrefix + 'mode', this.currentMode);
    
    // 此時呼叫 imeSwitchMode 是安全的
    this.imeSwitchMode(this.currentMode);
    
    this.externalToolbarContainer = document.getElementById('ime-external-toolbar-container');
    if (this.externalToolbarContainer) {
        this.imeCreateExternalToolbar();
        if (this.toolbarContainer) {
            this.toolbarContainer.style.display = 'none';
        }
    }
    
    this.imeAttachEventListeners();
    window.addEventListener('resize', this.boundEnsureInBounds);

    this.boundGlobalKeyDownHandler = (e) => {
        if (!e.ctrlKey) return;
        switch (e.key) {
            case '/':
                e.preventDefault();
                this.imeToggleIsEnabled();
                break;
            case '\\': {
                e.preventDefault();
                const newSettings = { ...this.config.features };
                newSettings.prediction = !newSettings.prediction;
                this._syncFeatureSettings(newSettings);
                const status = newSettings.prediction ? '已啟用' : '已停用';
                this.imeShowToast(`聯想詞：${status}`);
                break;
            }
			case '<': {
				if (!e.shiftKey) return;
				e.preventDefault();
				const newSettings = { ...this.config.features };
				newSettings.outputEnabled = !newSettings.outputEnabled;
				this._syncFeatureSettings(newSettings);
				const status = newSettings.outputEnabled ? '已啟用' : '已停用';
				this.imeShowToast(`字音輸出：${status}`);
				break;
			}
			case '>': {
				if (!e.shiftKey) return;
				e.preventDefault();
				const newSettings = { ...this.config.features };
				newSettings.fullWidthPunctuation = !newSettings.fullWidthPunctuation;
				this._syncFeatureSettings(newSettings);
				const status = newSettings.fullWidthPunctuation ? '全形' : '半形';
				this.imeShowToast(`標點符號：${status}`);
				break;
			}
            // 【核心修改】 在此處增加新的快捷鍵邏輯
            case '"': {
                if (!e.shiftKey) return; // 確保 Shift 鍵也被按下
                e.preventDefault();
                const newSettings = { ...this.config.features };
                // 切換 numericTone 的布林值
                newSettings.numericTone = !newSettings.numericTone;
                // 呼叫同步函數以套用變更
                this._syncFeatureSettings(newSettings);
                // 顯示提示訊息
                const status = newSettings.numericTone ? '數字鍵調' : '字母鍵調';
                this.imeShowToast(`聲調模式：${status}`);
                break;
            }
        }
    };
    document.addEventListener('keydown', this.boundGlobalKeyDownHandler);
    
    this.isInitialized = true;
    console.log("WebIME 初始化完成，目前語言:", this.currentMode);
},



imeDestroy() {
    if (!this.isInitialized) {
        return; // 如果尚未初始化，則不執行任何操作
    }

    // 1. 停用目前作用中的輸入框
    this.imeDeactivate();

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
imeGetInitial(word, mode) {
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
imeSimplifyKey(key, mode) {
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
imeNormalizeCompositionBuffer(buffer, mode) {
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

/**
 * 從 localStorage 載入並套用儲存的工具列位置。
 * 如果有儲存的位置，則使用 top/left 定位；否則使用預設的 top/right 定位。
 */
imeLoadPosition() {
    if (!this.toolbarContainer) return;

    const pinnedTop = localStorage.getItem(this.config.storagePrefix + 'pinnedTop');
    const pinnedLeft = localStorage.getItem(this.config.storagePrefix + 'pinnedLeft');

    // 檢查是否有儲存過的位置
    if (pinnedTop && pinnedLeft) {
        // 如果有，就使用儲存的 top/left 絕對定位
        this.toolbarContainer.style.top = pinnedTop;
        this.toolbarContainer.style.left = pinnedLeft;
        this.toolbarContainer.style.right = 'auto'; // 清除 right 定位，避免衝突
        this.toolbarContainer.style.bottom = 'auto'; // 清除 bottom 定位
    } else {
        // 如果從未儲存過位置，則設定預設值在右上角
        this.toolbarContainer.style.top = '20px';
        this.toolbarContainer.style.right = '20px';
        this.toolbarContainer.style.left = 'auto'; // 必須清除 left 屬性
        this.toolbarContainer.style.bottom = 'auto'; // 清除 bottom 屬性
    }
},


imeCreateUI() {
    this.toolbarContainer = document.createElement("div");
    this.toolbarContainer.id = "web-ime-toolbar-container";
    this.toolbarContainer.className = "web-ime-base";
    this.toolbarContainer.style.position = 'fixed';

    // 改為呼叫新的函式來動態決定初始位置。
    this.imeLoadPosition();

    this.topBar = document.createElement("div");
    this.topBar.id = "web-ime-top-bar";
    
    this.topBar.addEventListener('mousedown', this.boundInitDrag);
    this.topBar.addEventListener('touchstart', this.boundInitDrag, { passive: false });

    const logo = document.createElement("span");
    logo.className = "ime-logo material-icons";
    logo.textContent = randomIconName;
    this.topBar.appendChild(logo);

    const enableContainer = document.createElement('div');
    enableContainer.className = 'ime-enable-container';
    
    const enableToggle = document.createElement('input');
    enableToggle.type = 'checkbox';
    enableToggle.className = 'ime-enable-toggle';
    enableToggle.id = 'web-ime-enable-toggle-main';
    enableToggle.checked = this.isEnabled; // 根據目前狀態設定
    
    enableToggle.addEventListener('change', (e) => {
        this.imeSetIsEnabled(e.target.checked);
        const status = this.isEnabled ? "已啟用" : "已停用";
        this.imeShowToast(`輸入法 ${status}`);
    });
    this.allEnableToggles.push(enableToggle); // 註冊到同步陣列

    const enableLabel = document.createElement('label');
    enableLabel.className = 'ime-enable-label';
    enableLabel.htmlFor = 'web-ime-enable-toggle-main';
    enableLabel.innerHTML = '<span></span>';
    
    enableContainer.appendChild(enableToggle);
    enableContainer.appendChild(enableLabel);
    this.topBar.appendChild(enableContainer);

    const modeContainer = document.createElement("div");
    modeContainer.className = "ime-mode-container";
    this.modeDisplayButton = document.createElement("button");
    this.modeDisplayButton.type = "button";
    this.modeDisplayButton.className = "ime-mode-button";
    this.modeDisplayText = document.createElement("span");
    this.modeDisplayText.className = "ime-mode-text";
    this.modeDisplayText.textContent = this.imeGetModeDisplayName(this.currentMode);
    this.allModeDisplayTexts.push(this.modeDisplayText); 
    this.modeDisplayButton.appendChild(this.modeDisplayText);

    this.modeDisplayButton.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (!this.isEnabled) return; // 停用時不可操作
        
        const isMenuVisible = modeContainer.classList.toggle('open');
        
        if (isMenuVisible) {
            this.allModeMenus.forEach(menu => {
                if (menu !== this.modeMenu) {
                    menu.parentElement.classList.remove('open');
                }
            });
            const rect = this.modeDisplayButton.getBoundingClientRect();
            this.modeMenu.style.visibility = 'hidden';
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
            this.modeMenu.style.visibility = 'visible';
        }
    });
    modeContainer.appendChild(this.modeDisplayButton);

    this.modeMenu = document.createElement("ul");
    this.modeMenu.className = "ime-mode-menu";
	this.allModeMenus.push(this.modeMenu); 
    Object.keys(dictionaries).forEach(mode => {
        const item = document.createElement("li");
        item.dataset.mode = mode;
        item.textContent = this.imeGetModeDisplayName(mode);
        if (mode === this.currentMode) item.classList.add('active');
        item.addEventListener("mousedown", (e) => {
            e.preventDefault();
            this.imeSwitchMode(mode);
        });
        this.modeMenu.appendChild(item);
    });
    
    this.modeMenu.addEventListener('mousedown', (e) => e.stopPropagation());
    this.modeMenu.addEventListener('touchstart', (e) => e.stopPropagation());
    modeContainer.appendChild(this.modeMenu);
    this.topBar.appendChild(modeContainer);

    document.addEventListener('click', (e) => {
        if (!modeContainer.contains(e.target)) {
            modeContainer.classList.remove('open');
        }
    });

    const settingsContainer = document.createElement("div");
    settingsContainer.className = "ime-settings-container";

	this.topBar.appendChild(settingsContainer);
    this.toolbarContainer.appendChild(this.topBar);
    document.body.appendChild(this.toolbarContainer);

    this.candidatesContainer = document.createElement("div");
    this.candidatesContainer.id = "web-ime-candidates-container";
    this.candidatesContainer.className = "web-ime-base";
    this.candidatesContainer.style.display = 'none';

    const compositionBar = document.createElement("div");
    compositionBar.id = "web-ime-composition-bar";

    this.compositionDisplay = document.createElement("div");
    this.compositionDisplay.id = "web-ime-composition";
    compositionBar.appendChild(this.compositionDisplay);

	const rightControls = document.createElement("div");
	rightControls.className = "ime-right-controls";

	this.queryBtn = document.createElement("button");
	this.queryBtn.type = "button";
	this.queryBtn.className = "ime-page-button";
	this.queryBtn.title = "字根反查 (/)";
	this.queryBtn.innerHTML = '<span class="material-icons" style="font-size: 20px;">search</span>';
	this.queryBtn.addEventListener("click", () => {
		 if (this.isQueryMode) {
			this.imeExitQueryMode(false);
		} else if (this.allCandidates.length > 0) {
			this.imeEnterQueryMode();
		}
	});
	rightControls.appendChild(this.queryBtn);

	const pagination = document.createElement("div");
	pagination.className = "ime-pagination";
	this.prevPageBtn = document.createElement("button");
	this.prevPageBtn.className = "ime-page-button";
	this.prevPageBtn.innerHTML = '<span class="material-icons">chevron_left</span>';
	this.prevPageBtn.addEventListener("click", () => this.imeChangePage(-1));
	this.nextPageBtn = document.createElement("button");
	this.nextPageBtn.className = "ime-page-button";
	this.nextPageBtn.innerHTML = '<span class="material-icons">chevron_right</span>';
	this.nextPageBtn.addEventListener("click", () => this.imeChangePage(1));
	pagination.appendChild(this.prevPageBtn);
	pagination.appendChild(this.nextPageBtn);
	rightControls.appendChild(pagination);

	compositionBar.appendChild(rightControls);

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

    this.imeCreateSettingsModal();
    document.body.appendChild(this.candidatesContainer);
    this.imeUpdateUIState();
},

/**
 * 在指定的外部容器中建立一組同步的工具列按鈕，包含能獨立正確定位的語言選單。
 */
imeCreateExternalToolbar() {
    if (!this.externalToolbarContainer) return;

    this.externalToolbarContainer.innerHTML = '';
    
    // 複製並設定啟用開關
    const originalEnableContainer = this.topBar.querySelector('.ime-enable-container');
    if (originalEnableContainer) {
        const newEnableContainer = originalEnableContainer.cloneNode(true);
        const newToggle = newEnableContainer.querySelector('.ime-enable-toggle');
        const newLabel = newEnableContainer.querySelector('.ime-enable-label');
        
        const newId = 'web-ime-enable-toggle-external-' + Date.now();
        newToggle.id = newId;
        newLabel.htmlFor = newId;

        newToggle.addEventListener('change', (e) => {
            this.imeSetIsEnabled(e.target.checked);
            const status = this.isEnabled ? "已啟用" : "已停用";
            this.imeShowToast(`輸入法 ${status}`);
        });

        this.allEnableToggles.push(newToggle);
        this.externalToolbarContainer.appendChild(newEnableContainer);
    }

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
                this.imeSwitchMode(mode);
            });
        });

        newModeDisplayButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.isEnabled) return;
            
            const isMenuVisible = newModeContainer.classList.toggle('open');
            
            if (isMenuVisible) {
                this.allModeMenus.forEach(menu => {
                    if (menu !== newModeMenu) {
                        menu.parentElement.classList.remove('open');
                    }
                });
                const rect = newModeDisplayButton.getBoundingClientRect();
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
imePreventModalOverscroll(element) {
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

imeCreateSettingsModal() {
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
    modalContent.className = 'web-ime-modal-content';

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
    this.imePreventModalOverscroll(modalBody);

    // --- 【功能設定區塊】 ---
    const featureSettingsSection = document.createElement('div');
    featureSettingsSection.className = 'settings-section';
    featureSettingsSection.innerHTML = '<h4>功能設定</h4>';
    const featureContainer = document.createElement('div');
    featureContainer.className = 'keymap-settings-container';

    // 移除 features 陣列中的 pinyinOnlyMode
    const features = [
        { id: 'singleCharMode', text: '單字模式', default: false },
        { id: 'prediction', text: '聯想詞 (Ctrl \\)', default: false },
        { id: 'numericTone', text: '數字鍵調(Ctrl Shiht ") (預設zvs)', default: true },
        { id: 'longPhrase', text: '長詞連打', default: false },
        { id: 'fullWidthPunctuation', text: '全形標點 (Ctrl Shiht >)', default: true },
        { id: 'outputEnabled', text: '字音輸出 (Ctrl Shiht <)', default: false, hasSelect: true }
    ];

    features.forEach(feature => {
        const settingRow = document.createElement('div');
        settingRow.className = 'keymap-setting-row';
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `feature-${feature.id}`;
        checkbox.dataset.key = feature.id;
        checkbox.checked = feature.default;
        checkbox.onchange = () => this.imeSaveFeatureSettings();
        
        if (feature.id === 'singleCharMode' || feature.id === 'outputEnabled') {
            checkbox.addEventListener('change', () => {
                this._syncFeatureSettings(this.config.features);
                this.imeSaveFeatureSettings();
            });
        }

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${feature.text}`));
        settingRow.appendChild(label);
        if (feature.hasSelect) {
            const outputModeSelect = document.createElement('select');
            outputModeSelect.id = 'feature-outputMode-select';
            outputModeSelect.style.marginLeft = '10px';
            outputModeSelect.style.display = checkbox.checked ? 'inline-block' : 'none';

            const options = [
                { value: 'pinyin_mode', text: '拼音模式' },
                { value: 'pinyin', text: '看字出音' },
                { value: 'word_pinyin', text: '字(拼音)' },
                { value: 'word_pinyin2', text: '字［拼音］' }
            ];
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                outputModeSelect.appendChild(option);
            });
            outputModeSelect.onchange = () => this.imeSaveFeatureSettings();
            checkbox.addEventListener('change', () => {
                outputModeSelect.style.display = checkbox.checked ? 'inline-block' : 'none';
            });
            settingRow.appendChild(outputModeSelect);
        }
        featureContainer.appendChild(settingRow);
    });
    featureSettingsSection.appendChild(featureContainer);
    modalBody.appendChild(featureSettingsSection);
    
	// --- 【聯想詞來源設定區塊】 ---
    const predictionMappingSection = document.createElement('div');
    predictionMappingSection.className = 'settings-section';
    predictionMappingSection.innerHTML = '<h4>聯想詞來源設定</h4><p style="font-size:13px; color:#666; margin-top:-8px; margin-bottom:10px;">為形碼輸入法指定一個拼音詞庫作為聯想詞來源。</p>';
    
    const mappingContainer = document.createElement('div');
    mappingContainer.className = 'keymap-settings-container';

    const shapeBasedIMEs = {
        'cangjie': '倉頡',
        'hanglie': '行列',
        'xiami': '蝦米'
    };

    for (const mode in shapeBasedIMEs) {
        if (dictionaries[mode]) {
            const settingRow = document.createElement('div');
            settingRow.className = 'keymap-setting-row';
            const labelSpan = document.createElement('span');
            labelSpan.className = 'keymap-label-text';
            labelSpan.textContent = `${shapeBasedIMEs[mode]} 來源：`;
            const select = document.createElement('select');
            select.className = 'prediction-source-select';
            select.dataset.ime = mode;
            select.style.cssText = 'width: 150px; border: 1px solid #ccc; border-radius: 4px; padding: 4px 8px; background-color: #f8f9fa;';
            select.onchange = () => this.imeSavePredictionMappingSettings();
            
            const noneOption = document.createElement('option');
            noneOption.value = '';
            noneOption.textContent = '無 (預設)';
            select.appendChild(noneOption);
            
            for (const langKey in dictionaries) {
                if (!shapeBasedIMEs[langKey]) {
                    const option = document.createElement('option');
                    option.value = langKey;
                    option.textContent = this.imeGetModeDisplayName(langKey);
                    select.appendChild(option);
                }
            }
            settingRow.appendChild(labelSpan);
            settingRow.appendChild(select);
            mappingContainer.appendChild(settingRow);
        }
    }
    
    if (mappingContainer.children.length > 0) {
        predictionMappingSection.appendChild(mappingContainer);
        modalBody.appendChild(predictionMappingSection);

        const loadedMapping = this.config.predictionMapping || {};
        const selectElements = predictionMappingSection.querySelectorAll('.prediction-source-select');
        selectElements.forEach(select => {
            const imeMode = select.dataset.ime;
            if (loadedMapping[imeMode]) {
                select.value = loadedMapping[imeMode];
            }
        });
    }

    // --- 【字根反查、快速鍵、說明、重設等後續區塊】 ---
    const querySettingsSection = document.createElement('div');
    querySettingsSection.className = 'settings-section';
    querySettingsSection.innerHTML = '<h4>字根反查</h4>';
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'query-options-container';
    for (const mode in this.reverseDicts) {
        if (Object.keys(this.reverseDicts[mode]).length > 0) {
            const displayName = this.imeGetModeDisplayName(mode);
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `query-${mode}`;
            checkbox.value = mode;
            checkbox.onchange = () => this.imeSaveQuerySettings();
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
    unicodeCheckbox.onchange = () => this.imeSaveQuerySettings();
    unicodeLabel.appendChild(unicodeCheckbox);
    unicodeLabel.appendChild(document.createTextNode(' Unicode'));
    optionsContainer.appendChild(unicodeLabel);
    querySettingsSection.appendChild(optionsContainer);
    modalBody.appendChild(querySettingsSection);

    // --- 【快速鍵設定區塊 - 修改開始】 ---
    const keyMapSettingsSection = document.createElement('div');
    keyMapSettingsSection.className = 'settings-section';
    keyMapSettingsSection.innerHTML = '<h4>快速鍵設定</h4>';
    const keyMapContainer = document.createElement('div');
    keyMapContainer.className = 'keymap-settings-container';
    const configurableKeys = {
        'backspaceWithCandidates': '左刪編碼',
        'clearComposition': '清除編碼',
        'transformTone': '輸出拼音',
        'reverseLookup': '字根反查'
    };
    const finalKeyMap = { ...imeDefaultKeyMap, ...this.config.userKeyMap };

    for (const action in configurableKeys) {
        const labelText = configurableKeys[action];
        const settingRow = document.createElement('div');
        settingRow.className = 'keymap-setting-row';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `key-${action}`;
        input.dataset.action = action;

        // 判斷是否啟用：先檢查已儲存的設定，若無則套用新的預設值
        const isEnabled = this.config.userKeyMapStates?.[action] ?? !(action === 'transformTone' || action === 'reverseLookup');
        
        checkbox.checked = isEnabled;
        input.disabled = !isEnabled;

        // 監聽核取方塊的變更，連動輸入框並儲存狀態
        checkbox.addEventListener('change', () => {
            input.disabled = !checkbox.checked;
            this.imeSaveKeyMapStates(); // 呼叫新的儲存函式
        });

        const labelSpan = document.createElement('span');
        labelSpan.className = 'keymap-label-text';
        labelSpan.textContent = `${labelText}：`;
        
        const currentKey = finalKeyMap[action] ? finalKeyMap[action][0] : '';
        input.value = this.imeGetKeyDisplayName(currentKey);
        input.dataset.key = currentKey;
        input.readOnly = true;

        settingRow.appendChild(checkbox);
        settingRow.appendChild(labelSpan);
        settingRow.appendChild(input);
        keyMapContainer.appendChild(settingRow);
    }
    keyMapSettingsSection.appendChild(keyMapContainer);
    modalBody.appendChild(keyMapSettingsSection);
    
    const helpSection = document.createElement('div');
    helpSection.className = 'settings-section';
    helpSection.innerHTML = '<h4>使用說明</h4>';
    const helpContent = document.createElement('div');
    helpContent.className = 'settings-help-content';
    helpContent.innerText = `聲調預設為數字，可至設定調整為字母。\nx 是標點。\n空白鍵選第一個候選字。\n也可用 ,< .> 左右移動加空白鍵。\n也可以用數字或 shift+數字來選候選字。\n輸入編碼 + w 可輸出拼音。\nCtrl+/ 可快速啟用/停用輸入法。`;
    helpSection.appendChild(helpContent);
    modalBody.appendChild(helpSection);

    const resetSection = document.createElement('div');
    resetSection.className = 'settings-section';
    const shareButton = document.createElement('button');
    shareButton.id = 'web-ime-share-button';
    shareButton.textContent = '分享設定';
    resetSection.appendChild(shareButton);
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
        input.addEventListener('focus', () => { input.value = '請按一個鍵...'; });
        input.addEventListener('blur', () => { input.value = this.imeGetKeyDisplayName(input.dataset.key || ''); });
        input.addEventListener('keydown', (e) => {
            e.preventDefault();
            const newKey = e.key;
            input.dataset.key = newKey;
            input.value = this.imeGetKeyDisplayName(newKey);
            this.imeSaveKeyMapSettings();
            input.blur();
        });
    });

    shareButton.addEventListener('click', () => {
        const baseUrl = window.location.origin + window.location.pathname;
        const enabledState = '1';
        const langCode = this.currentMode;
        let outputModeCode = '0';
        if (this.config.features.outputEnabled) {

            switch (this.config.features.outputMode) {
                case 'pinyin_mode': outputModeCode = '1'; break;
                case 'pinyin': outputModeCode = '2'; break;
                case 'word_pinyin': outputModeCode = '3'; break;
                case 'word_pinyin2': outputModeCode = '4'; break;

            }
        }
        const settingsCode = [
            this.config.features.singleCharMode ? '1' : '0',
            this.config.features.prediction ? '1' : '0',
            this.config.features.numericTone ? '1' : '0',
            this.config.features.longPhrase ? '1' : '0',
            this.config.features.fullWidthPunctuation ? '1' : '0',
            this.config.features.outputEnabled ? '1' : '0',
            // 不再有 pinyinOnlyMode
            outputModeCode
        ].join('');
        // 調整參數順序，將 outputModeCode 放在最後
        const finalSettingsCode = settingsCode.slice(0, 6) + outputModeCode;
        const shortCode = `${enabledState}-${langCode}-${finalSettingsCode}`;
        const shareableUrl = `${baseUrl}?ime=${shortCode}`;
        navigator.clipboard.writeText(shareableUrl).then(() => {
            this.imeShowToast('分享網址已複製到剪貼簿');
            this.settingsModal.style.display = 'none';
        }).catch(err => {
            console.error('無法複製網址: ', err);
            this.imeShowToast('複製失敗');
        });
    });

    resetButton.addEventListener('click', () => {
        this.settingsModal.style.display = 'none';
        this.imeShowCustomConfirm(
            '確定要重設所有設定嗎？<br>此操作將會清除所有自訂選項。',
            () => {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(this.config.storagePrefix)) {
                        localStorage.removeItem(key);
                    }
                });
                this.imeShowToast('設定已重設，頁面即將重新載入。', 2000);
                setTimeout(() => { location.reload(); }, 1500);
            }
        );
    });

    // **新增呼叫**: 根據初始載入的模式，設定UI的初始狀態
    this._updateSettingsUIForCurrentMode();
},
	
/**
 * 儲存到 localStorage，並同步 UI 介面。
 * [新版本] 新增了單字模式與聯想詞之間的互斥邏輯。
 * @param {object} features - 要套用的功能設定物件。
 */
_syncFeatureSettings(features) {
    // 1. 更新核心設定物件
    this.config.features = features;

    // 2. 更新即時狀態變數
    this.isLongPhraseEnabled = this.config.features.longPhrase;
    this.isFullWidthMode = this.config.features.fullWidthPunctuation;
    this.config.enablePrediction = this.config.features.prediction;
    this.config.outputModeActive = this.config.features.outputEnabled;
    this.config.outputMode = this.config.features.outputMode;

    const isOutputActive = this.config.features.outputEnabled;
    const isSingleCharActive = this.config.features.singleCharMode;
    const outputClass = 'output-mode-active';
    const singleCharClass = 'single-char-mode-active';

    // 將浮動工具列與外部工具列的容器一起處理
    const toolbars = [this.toolbarContainer, document.getElementById('ime-external-toolbar-container')].filter(Boolean);

    toolbars.forEach(bar => {
        // 獨立切換單字模式的 class (綠色)
        bar.classList.toggle(singleCharClass, isSingleCharActive);
        // 獨立切換字音輸出的 class (紅色)
        bar.classList.toggle(outputClass, isOutputActive);
    });

    // 3. 儲存到 localStorage
    localStorage.setItem(this.config.storagePrefix + 'featureSettings', JSON.stringify(this.config.features));

    // 4. 同步設定視窗的 UI
    if (this.settingsModal) {
        for (const key in this.config.features) {
            const checkbox = this.settingsModal.querySelector(`#feature-${key}`);
            if (checkbox) {
                checkbox.checked = this.config.features[key];
            }
        }
        const select = this.settingsModal.querySelector('#feature-outputMode-select');
        if (select) {
            select.value = this.config.features.outputMode;
            // 當「字音輸出」未勾選時，隱藏下拉選單
            select.style.display = this.config.features.outputEnabled ? 'inline-block' : 'none';
        }

        const singleCharCheckbox = this.settingsModal.querySelector('#feature-singleCharMode');
        const longPhraseCheckbox = this.settingsModal.querySelector('#feature-longPhrase');
        const predictionCheckbox = this.settingsModal.querySelector('#feature-prediction'); // 取得聯想詞的 checkbox

        if (singleCharCheckbox && longPhraseCheckbox && predictionCheckbox) {
            if (singleCharCheckbox.checked) {
                // 如果單字模式被勾選：
                // a. 強制關閉「長詞連打」並禁用其選項
                longPhraseCheckbox.checked = false;
                longPhraseCheckbox.disabled = true;
                this.config.features.longPhrase = false;
                
                // b. 強制關閉「聯想詞」並禁用其選項
                predictionCheckbox.checked = false;
                predictionCheckbox.disabled = true;
                this.config.features.prediction = false; // 同步更新內部狀態
                this.config.enablePrediction = false;

            } else {
                // 如果單字模式未被勾選，則恢復「長詞連打」和「聯想詞」選項為可操作狀態
                longPhraseCheckbox.disabled = false;
                predictionCheckbox.disabled = false;
            }
        }
    }
},

/**
 * 從 localStorage 載入功能設定並同步應用程式狀態。
 */
imeLoadFeatureSettings() {
    const defaults = {
        singleCharMode: false,
        prediction: false,
        numericTone: true,
        longPhrase: false,
        fullWidthPunctuation: true,
        outputEnabled: false,
        outputMode: 'pinyin_mode' // 將預設值改為 'pinyin_mode'
    };

    let savedSettings = {};
    try {
        savedSettings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'featureSettings')) || {};
    } catch (e) {
        savedSettings = {};
    }
    
    const finalSettings = { ...defaults, ...savedSettings };
    this._syncFeatureSettings(finalSettings);
},

/**
 * 從設定視窗的 UI 讀取目前狀態，然後套用並儲存它們。
 */
imeSaveFeatureSettings() {
    if (!this.settingsModal) return;

    const newSettings = {};
    const checkboxes = this.settingsModal.querySelectorAll('input[id^="feature-"]');
    checkboxes.forEach(cb => {
        newSettings[cb.dataset.key] = cb.checked;
    });

    const select = this.settingsModal.querySelector('#feature-outputMode-select');
    if (select) {
        newSettings.outputMode = select.value;
    }

    // 呼叫輔助函式來統一處理套用與儲存
    this._syncFeatureSettings(newSettings);
},

imeSaveQuerySettings() {
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

    this.imeUpdateUIState(); // 立即更新UI以反應按鈕的顯示狀態
},

imeLoadQuerySettings() {
    let settings;
    try {
        settings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'querySettings'));
    } catch (e) {
        settings = null;
    }

    // 如果沒有儲存的設定，則使用預設值 (全部不啟用)
    if (!settings) {
        // 將預設值改為空物件
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
 * 此版本會根據 UI 重新建立一個設定物件，確保儲存的資料完全正確。
 */
imeSaveToolbarSettings() {
    // 建立一個全新的空物件，用來存放從 UI 讀取到的最新設定
    const newToolbarSettings = {};
    const checkboxes = this.settingsModal.querySelectorAll('input[id^="toggle-btn-"]');

    // 遍歷所有相關的勾選框
    checkboxes.forEach(cb => {
        const key = cb.dataset.key;
        if (key) {
            // 將每個勾選框的狀態存入新的設定物件中
            newToolbarSettings[key] = cb.checked;
        }
    });

    // 用這個全新的、乾淨的物件來更新輸入法的當前設定
    this.config.toolbarButtons = newToolbarSettings;

    // 將這個乾淨的設定物件完整地存到 localStorage
    localStorage.setItem(this.config.storagePrefix + 'toolbarSettings', JSON.stringify(this.config.toolbarButtons));

    // 當使用者在設定中取消勾選「輸出字音」時，需要連帶處理
    if (newToolbarSettings.outputModeToggle === false) {
        // 我們需要同時將「功能啟用狀態」也強制設為 false
        this.config.outputModeActive = false;
        // 並將這個狀態儲存起來
        localStorage.setItem(this.config.storagePrefix + 'outputModeActive', 'false');
    }
},


/**
 * 從 localStorage 載入輸出模式設定 (下拉選單的值)
 */
imeLoadOutputModeSettings() {
    const saved = localStorage.getItem(this.config.storagePrefix + 'outputMode');
    // 合法的值為 'pinyin', 'word_pinyin'，否則使用預設值 'pinyin'
    this.config.outputMode = ['pinyin_mode', 'pinyin', 'word_pinyin', 'word_pinyin2'].includes(saved) ? saved : 'pinyin';

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
imeSaveOutputModeSettings() {
    // 找到下拉選單
    const selectElement = this.settingsModal.querySelector('#output-mode-select');
    if (selectElement) {
        this.config.outputMode = selectElement.value;
        localStorage.setItem(this.config.storagePrefix + 'outputMode', this.config.outputMode);
    }
},



/**
 * 儲存使用者自訂快速鍵的「啟用/停用」狀態。
 * 此函式只處理勾選框的狀態，不處理按鍵的值。
 */
imeSaveKeyMapStates() {
    const newKeyMapStates = this.config.userKeyMapStates || {};
    const keyMapRows = this.settingsModal.querySelectorAll('.keymap-settings-container .keymap-setting-row');
    
    keyMapRows.forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"]');
        const input = row.querySelector('input[type="text"]');
        if (checkbox && input) {
            const action = input.dataset.action;
            if (action) {
                newKeyMapStates[action] = checkbox.checked;
            }
        }
    });

    this.config.userKeyMapStates = newKeyMapStates;
    localStorage.setItem(this.config.storagePrefix + 'userKeyMapStates', JSON.stringify(newKeyMapStates));
},

/**
 * 從 localStorage 載入使用者自訂的快速鍵設定及其啟用狀態。
 */
imeLoadKeyMapSettings() {
    let settings, states;
    try {
        settings = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'userKeyMap'));
        states = JSON.parse(localStorage.getItem(this.config.storagePrefix + 'userKeyMapStates'));
    } catch (e) {
        settings = null;
        states = null;
    }
    // 如果沒有儲存的設定，則使用空物件
    this.config.userKeyMap = settings || {};
    this.config.userKeyMapStates = states || {};
},

/**
 * 儲存使用者自訂的快速鍵設定到 localStorage
 */
imeSaveKeyMapSettings() {
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


imeGetKeyDisplayName(key) {
    if (key === ' ') {
        return 'Space'; // 空白鍵特殊處理，顯示名稱
    }
    // 其他所有按鍵，直接返回按鍵的字元本身
    return key;
},


/**
 * 【新增的函式】
 * 處理在編輯區的點擊事件，若候選字容器可見，則清除輸入狀態。
 * 這讓點擊編輯區的行為等同於按下 ESC 鍵。
 * @param {MouseEvent} e - 滑鼠事件物件
 */
imeHandleClearCompositionClick(e) {
    // 檢查候選字容器是否可見，以及點擊的目標是否就是當前啟用的編輯區
    if (this.candidatesContainer && this.candidatesContainer.style.display !== 'none' && e.target === this.activeElement) {
        
        // 清空輸入緩衝區，重設游標位置
        this.compositionBuffer = '';
        this.compositionCursorPos = 0;
        
        // 更新候選字（此操作會自動清空並隱藏候選字視窗）
        this.imeUpdateCandidates();
    }
},


imeAttachEventListeners() {
    const onImeInteractionStart = () => { this.isClickingInside = true; };
    this.toolbarContainer.addEventListener('mousedown', onImeInteractionStart);
    this.toolbarContainer.addEventListener('touchstart', onImeInteractionStart, { passive: true });
    this.candidatesContainer.addEventListener('mousedown', onImeInteractionStart);
    this.candidatesContainer.addEventListener('touchstart', onImeInteractionStart, { passive: true });

    this.handleFocusIn = (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) {
            this.imeActivate(e.target);
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
            this.imeDeactivate();
            return;
        }
        this.imeDeactivate();
        this.imeHide();
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



imeActivate(element) {
    // 如果目前作用中的元素與新傳入的元素不同，先停用舊的。
    if (this.activeElement && this.activeElement !== element) {
        this.imeDeactivate();
    }

    // 更新作用中的元素
    this.activeElement = element;
    this.lastInputValue = this.activeElement.isContentEditable ? this.activeElement.textContent : this.activeElement.value;

    // 顯示 UI 並重新定位
    this.imeShow();
    setTimeout(() => this.imeReposition(), 0);

    // 為了確保穩健，先移除可能殘留的監聽器，再重新附加。
    // 這可以防止因意外的狀態導致監聽器重複綁定或遺漏綁定。
    this.activeElement.removeEventListener('click', this.boundReposition);
    this.activeElement.removeEventListener('keyup', this.boundReposition);
    this.activeElement.removeEventListener('mouseup', this.boundReposition);
    this.activeElement.removeEventListener('keydown', this.boundHandleKeyDown);
    this.activeElement.removeEventListener('mousedown', this.boundHandleClearCompositionClick); // 【在此加入此行】
    if (this.isMobile) {
        this.activeElement.removeEventListener('input', this.boundHandleInput);
    }
    
    this.activeElement.addEventListener('click', this.boundReposition);
    this.activeElement.addEventListener('keyup', this.boundReposition);
    this.activeElement.addEventListener('mouseup', this.boundReposition);
    this.activeElement.addEventListener('mousedown', this.boundHandleClearCompositionClick); // 【在此加入此行】
    
    // 在這個區塊中，我們同時更新浮動工具列和外部工具列的狀態
    const externalToolbar = document.getElementById('ime-external-toolbar-container');

    // 根據輸入法是否啟用，來決定是否附加核心的輸入事件監聽器
    if (this.isEnabled) {
        this.toolbarContainer.classList.remove('disabled');
        if (externalToolbar) {
            externalToolbar.classList.remove('disabled');
        }
        this.activeElement.addEventListener('keydown', this.boundHandleKeyDown);
        if (this.isMobile) {
            this.activeElement.addEventListener('input', this.boundHandleInput);
        }
    } else {
        this.toolbarContainer.classList.add('disabled');
        if (externalToolbar) {
            externalToolbar.classList.add('disabled');
        }
    }
},

imeDeactivate() {
    if (!this.activeElement) return;
    if (this.compositionBuffer) {
        this.imeCommitText(this.compositionBuffer);
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
    this.activeElement.removeEventListener('mousedown', this.boundHandleClearCompositionClick); // 【在此加入此行】
    this.activeElement = null;
    this.imeClearCandidates();
},

imeHandleInput(e) {
    // 如果是我們自己觸發的 input 事件，就直接忽略
    if (this.isCommittingText) {
        return;
    }
    
    // 如果不是行動裝置，此函數不作用 (桌機邏輯在 keydown 中)
    if (!this.isMobile) {
        if (this.compositionBuffer) {
            this.compositionBuffer = '';
            this.imeUpdateCandidates();
        }
        return;
    }

    const target = e.target;
    const currentVal = target.isContentEditable ? target.textContent : target.value;
    const selectionStart = target.selectionStart; // 取得目前的游標位置

    // 偵測輸入 (文字變長)
    if (currentVal.length > this.lastInputValue.length) {
        
        // 透過游標位置，精準計算出新插入的字元，不再假設只在末尾輸入
        const insertedLength = currentVal.length - this.lastInputValue.length;
        const insertionStart = selectionStart - insertedLength;
        let diff = currentVal.substring(insertionStart, selectionStart);

        // 如果一次輸入超過1個字元(例如貼上)，或者不是英文/數字/空格，就直接接受，並重設輸入法狀態
        // 將 `\s` 修改為明確的空格 ` `，避免比對到換行符 `\n`
        if (insertedLength > 1 || !/^[a-zA-Z0-9 ]$/.test(diff)) {
            this.lastInputValue = currentVal;
            this.compositionBuffer = '';
            this.compositionCursorPos = 0;
            this.imeUpdateCandidates();
            return;
        }
        
        // --- 攔截與還原輸入框 ---
        const restoreVal = this.lastInputValue;
        const restoreCursorPos = insertionStart;
        this.isCommittingText = true;
        
        if (target.isContentEditable) {
            target.textContent = restoreVal;
        } else {
            target.value = restoreVal;
        }
        target.setSelectionRange(restoreCursorPos, restoreCursorPos);
        this.isCommittingText = false;
        this.lastInputValue = restoreVal;

        // 當輸入的是空白鍵時
        if (diff === ' ') {
            const hasBuffer = this.compositionBuffer.length > 0;
            const hasCandidates = this.allCandidates.length > 0;

            if (hasCandidates) {
                this.imeSelectCandidate(this.highlightedIndex);
            } else if (hasBuffer) {
                this.compositionBuffer = '';
                this.compositionCursorPos = 0;
                this.imeUpdateCandidates();
            } else {
                this.imeCommitText(' ');
            }
            return;
        }
        
        const hasComposition = this.compositionBuffer && this.allCandidates.length > 0;
        const currentToneMode = this.imeGetCurrentToneMode();
        const isNumberSelect = currentToneMode === 'alphabetic' && diff.match(/^[1-9]$/) && hasComposition;
        const langProps = imeLanguageProperties[this.currentMode] || {};
        const isTransformEnabled = langProps.enableToneTransform !== false;
        const isWTransform = diff.toLowerCase() === 'w' && this.compositionBuffer && isTransformEnabled;

        if (isNumberSelect || isWTransform) {
            if (isNumberSelect) {
                const index = parseInt(diff, 10) - 1;
                if (index < this.candidatesList.children.length) {
                    this.imeSelectCandidate(index);
                }
            } else { // isWTransform
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
                this.imeCommitText(transformedText);
                this.compositionBuffer = '';
                this.compositionCursorPos = 0;
                this.imeUpdateCandidates();
            }
            return;
        }
        
        // --- 正常的編碼輸入 ---
        const isNumericToneMode = currentToneMode === 'numeric' && langProps.numericToneMap;

        if (isNumericToneMode && diff.match(/^[0-9]$/)) {
            const mappedChar = langProps.numericToneMap[diff];
            if (mappedChar) {
                diff = mappedChar; 
            }
        }
        
        // 只有在完全滿足所有指定條件時，才在開始輸入新編碼前補上空格。
        if (this.isPredictionState && this.compositionBuffer === '' && this.config.features.outputEnabled && this.config.outputMode === 'pinyin_mode') {
            this.imeCommitText(' ');
        }
        
        this.compositionBuffer += diff;
        this.compositionCursorPos += diff.length;
        this.imeUpdateCandidates();

    } else if (currentVal.length < this.lastInputValue.length) {
        // 處理刪除 (Backspace)
         if (this.compositionBuffer) {
            this.compositionBuffer = this.compositionBuffer.slice(0, -1);
            this.compositionCursorPos = this.compositionBuffer.length;
            this.imeUpdateCandidates();
        }
        this.lastInputValue = currentVal;
    } else {
        // 處理游標移動等其他情況
        this.lastInputValue = currentVal;
    }
},

imeFindPhraseCandidates(buffer) {
    const normalizedBuffer = this.imeNormalizeCompositionBuffer(buffer, this.currentMode);

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
        const simplifiedKey = this.imeSimplifyKey(key, this.currentMode);
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


imeHandleKeyDown(e) {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (this.isMobile && e.key && e.key.length === 1 && /[a-zA-Z0-9\s]/.test(e.key)) {
        return;
    }

    const hasComposition = this.compositionBuffer.length > 0;
    const hasCandidates = this.allCandidates.length > 0;

    if (!hasComposition && this.currentMode !== 'hanglie') {
        const key = e.key;
        // 1. 處理 / 鍵：無論全形半形，都直接輸出半形 /
        if (key === '/') {
            e.preventDefault();
            this.imeCommitText('/');
            return;
        }
        // 2. 處理 - ; : " 鍵：僅在半形模式下直接輸出
        if (['-', ';', ':', '"'].includes(key) && !this.isFullWidthMode) {
            e.preventDefault();
            this.imeCommitText(key);
            return;
        }
    }

    if (e.key === '/' && hasCandidates) {
        e.preventDefault();
        return;
    }

    const langProps = imeLanguageProperties[this.currentMode] || {};
    
    let keyMap = { ...imeDefaultKeyMap };
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

    // 根據使用者設定移除被停用的快速鍵
    const configurableKeys = ['backspaceWithCandidates', 'clearComposition', 'transformTone', 'reverseLookup'];
    configurableKeys.forEach(action => {
        const isEnabled = this.config.userKeyMapStates?.[action] ?? !(action === 'transformTone' || action === 'reverseLookup');
        if (!isEnabled) {
            delete keyMap[action];
        }
    });

    const reverseKeyMap = {};
    for (const action in keyMap) {
        keyMap[action].forEach(key => {
            reverseKeyMap[key] = action;
        });
    }

    const action = reverseKeyMap[e.key];

    if (action) {
        switch (action) {
            case 'imeSelectCandidate':
                if (hasCandidates) {
                    e.preventDefault();
                    this.imeSelectCandidate(this.highlightedIndex);
                } else if (hasComposition) {
                    e.preventDefault();
                    const actionOnNoCandidates = langProps.spaceActionOnNoCandidates || 'commit';
                    if (actionOnNoCandidates === 'clear') {
                        this.compositionBuffer = '';
                        this.compositionCursorPos = 0;
                        this.imeUpdateCandidates();
                    } else {
                        this.imeCommitText(this.compositionBuffer);
                        this.compositionBuffer = '';
                        this.compositionCursorPos = 0;
                        this.imeUpdateCandidates();
                    }
                }
                return;
            
                case 'commitComposition':
                if (!hasComposition) {
                    break;
                }
                e.preventDefault();
                this.imeCommitText(this.compositionBuffer);
                this.compositionBuffer = '';
                this.compositionCursorPos = 0;
                this.imeUpdateCandidates();
                return;

            case 'clearComposition':
                if (hasComposition || hasCandidates) {
                    e.preventDefault();
                    this.compositionBuffer = '';
                    this.compositionCursorPos = 0;
                    this.imeUpdateCandidates();
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
                        this.imeUpdateCandidates();
                    }
                } else if (this.isPredictionState) {
                    this.isPredictionState = false;
                    this.lastCommittedWord = '';
                    this.imeUpdateCandidates();
                }
                return;
            
            case 'reverseLookup':
                if (this.isQueryMode || hasCandidates) {
                    e.preventDefault();
                    if (this.isQueryMode) {
                        this.imeExitQueryMode(false);
                    } else if (!['cangjie', 'xiami'].includes(this.currentMode)) {
                        this.imeEnterQueryMode();
                    }
                    return;
                }
                break;

            case 'nextCandidate':
                if (hasCandidates) {
                    e.preventDefault();
                    this.imeNavigateCandidates(1);
                    return; 
                }
                break; 
            case 'prevCandidate':
                if (hasCandidates) {
                    e.preventDefault();
                    this.imeNavigateCandidates(-1);
                    return; 
                }
                break; 

            case 'nextPage':
                if (hasCandidates) {
                    e.preventDefault();
                    this.imeChangePage(1);
                    return;
                }
                break;

            case 'prevPage':
                if (hasCandidates) {
                    e.preventDefault();
                    this.imeChangePage(-1);
                    return;
                }
                break;

            case 'moveCursorLeft':
                if (hasComposition) {
                    e.preventDefault();
                    if (this.compositionCursorPos > 0) this.compositionCursorPos--;
                    this.imeUpdateCompositionDisplay();
                    return;
                }
                break;

            case 'moveCursorRight':
                if (hasComposition) {
                    e.preventDefault();
                    if (this.compositionCursorPos < this.compositionBuffer.length) this.compositionCursorPos++;
                    this.imeUpdateCompositionDisplay();
                    return;
                }
                break;

            case 'toggleLongPhrase':
                if (hasComposition) {
                    e.preventDefault();
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
                        this.imeCommitText(transformedText);
                        this.compositionBuffer = '';
                        this.compositionCursorPos = 0;
                        this.imeUpdateCandidates();
                    }
                }
                return;
        }
    }
    
    if (this.isFullWidthMode && !hasComposition) {
        const fullWidthPunctuation = {
            ',': '，', '.': '。', '?': '？', ':': '：', "'": '、', '[': '「', ']': '」', '{': '『', '}': '』', '!': '！', '-': '─', '(': '（', ')': '）', '~': '～', '<': '〈', '>': '〉', '_': '＿', '"': '…', '\\': '【】', '|': '《》', ';': '；'
        };
        const fullWidthChar = fullWidthPunctuation[e.key];

        if (fullWidthChar && !(this.currentMode === 'hanglie' && [',', '.', ';', '/'].includes(e.key))) {
            e.preventDefault();
            this.imeCommitText(fullWidthChar);
            return;
        }
    }

    if (hasCandidates) {
        const currentToneMode = this.imeGetCurrentToneMode();
        if (currentToneMode === 'alphabetic' && e.key >= '1' && e.key <= '9') {
            e.preventDefault();
            const index = parseInt(e.key, 10) - 1;
            if (index < this.candidatesList.children.length) {
                this.imeSelectCandidate(index);
                return;
            }
        }
        if (e.shiftKey && e.code.startsWith('Digit')) {
            const num = e.code.slice(5);
            if (num >= '1' && num <= '9') {
                const index = parseInt(num, 10) - 1;
                if (index < this.candidatesList.children.length) {
                    e.preventDefault();
                    this.imeSelectCandidate(index);
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
                this.imeUpdateCandidates();
            }
        }
        return;
    }
    
    const isNumericKey = /^[0-9]$/.test(e.key);
    if (isNumericKey && this.imeGetCurrentToneMode() === 'alphabetic' && !hasComposition) {
        return;
    }

    if (e.key === '+' || e.key === '=' ) {
        return;
    }
    
    if (!this.isMobile && e.key.length === 1 && !reverseKeyMap[e.key]) {
        e.preventDefault();
        
        // --- 【*** 關鍵修改處 ***】 ---
        // 只有在完全滿足所有指定條件時，才在開始輸入新編碼前補上空格。
        if (this.isPredictionState && this.compositionBuffer === '' && this.config.features.outputEnabled && this.config.outputMode === 'pinyin_mode') {
            this.imeCommitText(' ');
        }
        
        let character = e.key;
        const currentToneMode = this.imeGetCurrentToneMode();
        const isNumericToneMode = currentToneMode === 'numeric' && langProps.numericToneMap;
        
        if (isNumericToneMode && character.match(/^[0-9]$/)) {
            if (character in langProps.numericToneMap) {
                character = langProps.numericToneMap[character];
            }
        }

        if (this.compositionBuffer.length < this.config.maxCompositionLength) {
            const buffer = this.compositionBuffer;
            const pos = this.compositionCursorPos;
            this.compositionBuffer = buffer.substring(0, pos) + character + buffer.substring(pos);
            this.compositionCursorPos++;
            this.imeUpdateCandidates();
        }
    }
},

imeGetCurrentToneMode() {
    // 直接從新的功能設定中讀取聲調模式
    const isNumeric = (this.config.features && this.config.features.numericTone);

    const langProps = imeLanguageProperties[this.currentMode] || {};
    const availableModes = langProps.toneModes || ['alphabetic', 'numeric'];

    if (isNumeric && availableModes.includes('numeric')) {
        return 'numeric';
    }
    if (!isNumeric && availableModes.includes('alphabetic')) {
        return 'alphabetic';
    }
    // 如果設定與語言能力不符，回退到該語言支援的第一個模式
    return availableModes[0];
},


/**
 * 更新候選字列表。
 * - 在一般模式下，搜尋符合的漢字詞彙。
 * - 在「拼音模式」下，直接搜尋拼音碼本身作為候選字，並支援縮寫。
 */
imeUpdateCandidates() {
    this.isPredictionState = false;
    this.lastCommittedWord = '';

    const activeBuffer = this.compositionBuffer.substring(0, this.compositionCursorPos).toLowerCase();

    this.imeUpdateUIState();
    this.imeUpdateCompositionDisplay();

    if (activeBuffer.length === 0) {
        this.imeClearCandidates();
        return;
    }

    // 判斷是否為「拼音模式」，若是，則執行全新的直接搜尋拼音邏輯
    if (this.config.features.outputEnabled && this.config.outputMode === 'pinyin_mode') {
        
        // 步驟 1: 執行完整的拼音前綴搜尋
        const directPinyinResults = this.imeFindDirectPinyinCandidates(activeBuffer);
        
        // 步驟 2: 執行拼音首字母縮寫搜尋
        const abbreviationResults = this.imeFindPinyinAbbreviationCandidates(activeBuffer);

        // 步驟 3: 合併兩種搜尋結果，並用 Set 去除重複項
        const combinedResults = new Set([...directPinyinResults, ...abbreviationResults]);

        // 步驟 4: 將結果轉換為候選字物件
        this.allCandidates = Array.from(combinedResults).map(pinyinCode => ({
            word: this.imeTransformQueryCode(pinyinCode, this.currentMode),
            originalWord: pinyinCode,
            consumed: activeBuffer
        }));

    } else {
        // --- 如果不是拼音模式，則維持原有的「搜尋漢字」邏輯 ---
        let candidates = [];
        const dictionary = dictionaries[this.currentMode];

        if (this.config.features.singleCharMode) {
            const exactResult = dictionary[activeBuffer];
            if (exactResult) {
                const singleCharWords = exactResult.split(' ').filter(word => [...word].length === 1);
                candidates = singleCharWords.map(word => ({ word: word, consumed: activeBuffer }));
            }
        } else {
            if (this.isLongPhraseEnabled) {
                for (let i = activeBuffer.length; i > 0; i--) {
                    const prefixToSearch = activeBuffer.substring(0, i);
                    let foundCandidatesForPrefix = [];
                    const exactResult = dictionary[prefixToSearch];
                    if (exactResult) {
                        exactResult.split(' ').forEach(word => {
                            foundCandidatesForPrefix.push({ word: word, consumed: prefixToSearch });
                        });
                    }
                    this.imeFindPhraseCandidates(prefixToSearch).forEach(word => {
                        foundCandidatesForPrefix.push({ word: word, consumed: prefixToSearch });
                    });
                    this.imeFindSimplePrefixCandidates(prefixToSearch).forEach(word => {
                        foundCandidatesForPrefix.push({ word: word, consumed: prefixToSearch });
                    });
                    if (foundCandidatesForPrefix.length > 0) {
                        candidates = foundCandidatesForPrefix;
                        break;
                    }
                }
            } else {
                const exactResult = dictionary[activeBuffer];
                if (exactResult) {
                    exactResult.split(' ').forEach(word => {
                        candidates.push({ word: word, consumed: activeBuffer });
                    });
                }
                this.imeFindSimplePrefixCandidates(activeBuffer).forEach(word => {
                    candidates.push({ word: word, consumed: activeBuffer });
                });
                this.imeFindAbbreviationCandidates(activeBuffer).forEach(word => {
                    candidates.push({ word: word, consumed: activeBuffer });
                });
            }
        }

        const uniqueCandidates = new Map();
        candidates.forEach(c => {
            if (!uniqueCandidates.has(c.word)) {
                uniqueCandidates.set(c.word, c);
            }
        });
        
        this.allCandidates = Array.from(uniqueCandidates.values());
    }

    // --- 統一的結尾處理 ---
    this.currentPage = 0;
    this.highlightedIndex = 0;
    this.imeRenderCandidates();
    this.imeReposition();
},

/**
 * 已整合單字模式過濾與排序邏輯
 * 直接搜尋字典的 "key" (拼音碼)，找出所有符合前綴的拼音碼，並進行排序。
 * 在單字模式下，會自動過濾掉多音節的候選字。
 * @param {string} buffer - 使用者輸入的原始編碼。
 * @returns {string[]} - 符合的原始拼音碼陣列 (e.g., ["hens", "henz"])
 */
imeFindDirectPinyinCandidates(buffer) {
    if (buffer.length < 1) {
        return [];
    }

    const normalizedBuffer = this.imeNormalizeCompositionBuffer(buffer, this.currentMode);
    const simplifiedBuffer = this.imeSimplifyKey(normalizedBuffer, this.currentMode);
    const firstChar = normalizedBuffer[0].toLowerCase();
    const relevantEntries = this.preprocessedDicts[this.currentMode][firstChar];

    if (!relevantEntries) {
        return [];
    }

    const candidates = new Set();
    const isSingleCharMode = this.config.features.singleCharMode; // 先取得單字模式狀態

    for (const entry of relevantEntries) {
        let isMatch = false;
        if (entry.originalKey.replace(/[\s-]+/g, '').startsWith(normalizedBuffer)) {
            isMatch = true;
        } else if (entry.simplifiedKey.startsWith(simplifiedBuffer)) {
            isMatch = true;
        }

        if (isMatch) {
            const keyToAdd = entry.originalKey;
            
            // --- 【核心修改】 ---
            // 如果啟用了單字模式，則只加入不包含多音節分隔符的拼音碼。
            if (isSingleCharMode) {
                if (!keyToAdd.includes(' ') && !keyToAdd.includes('-')) {
                    candidates.add(keyToAdd);
                }
            } else {
                // 如果未啟用單字模式，則維持原有行為，全部加入。
                candidates.add(keyToAdd);
            }
        }
    }

    // 排序邏輯 (維持不變)
    const sortedCandidates = Array.from(candidates).sort((a, b) => {
        const aMatchesExactly = a === normalizedBuffer;
        const bMatchesExactly = b === normalizedBuffer;

        if (aMatchesExactly && !bMatchesExactly) return -1;
        if (!aMatchesExactly && bMatchesExactly) return 1;

        if (a.length !== b.length) {
            return a.length - b.length;
        }

        return a.localeCompare(b);
    });

    return sortedCandidates;
},

/**
 * [修正版] 尋找符合前綴的候選字。
 * 此版本修正了先前會錯誤簡化使用者輸入碼(Buffer)的問題，
 * 現在它會直接使用使用者輸入的原始碼來進行比對，從而解決縮寫碼被誤判為聲調的問題。
 */
imeFindSimplePrefixCandidates(buffer) {
    if (buffer.length < 1) {
        return [];
    }

    const normalizedBuffer = this.imeNormalizeCompositionBuffer(buffer, this.currentMode);

    // 取得輸入碼的第一個字母，以縮小搜尋範圍
    const firstChar = normalizedBuffer[0].toLowerCase();
    const relevantEntries = this.preprocessedDicts[this.currentMode][firstChar];

    if (!relevantEntries) {
        return [];
    }

    const candidates = [];
    for (const entry of relevantEntries) {
        // 比對 1: 使用者輸入碼 vs. 字典原始拼音 (e.g., 輸入 'ngins' 比對 'ngins')
        // 這能確保包含聲調的精準輸入能被找到
        if (entry.originalKey.replace(/[\s-]+/g, '').startsWith(normalizedBuffer)) {
             candidates.push(...entry.values);
        }
        // 比對 2: 使用者輸入碼 vs. 字典簡化後拼音 (e.g., 輸入 'ngin' 比對 'ngin')
        // 這讓使用者在不輸入聲調時也能找到詞
        else if (entry.simplifiedKey.startsWith(normalizedBuffer)) {
            candidates.push(...entry.values);
        }
    }
    return candidates;
},

/**
 * [新增的函式] 透過拼音首字母縮寫尋找候選「拼音碼」。
 * @param {string} buffer - 使用者輸入的緩衝字串 (如 'cf')
 * @returns {string[]} - 符合的原始拼音碼陣列 (如 ['cins fungs'])
 */
imeFindPinyinAbbreviationCandidates(buffer) {
    if (buffer.length < 2) {
        return [];
    }

    const normalizedBuffer = this.imeNormalizeCompositionBuffer(buffer, this.currentMode);
    const firstChar = normalizedBuffer[0].toLowerCase();
    const relevantEntries = this.preprocessedDicts[this.currentMode][firstChar];

    if (!relevantEntries) {
        return [];
    }

    const candidates = new Set(); // 使用 Set 自動處理重複的結果
    for (const entry of relevantEntries) {
        // 只處理多音節的詞彙 (包含空格或連字號)
        if (entry.originalKey.includes(' ') || entry.originalKey.includes('-')) {
            const abbreviation = entry.originalKey
                .split(/[\s-]+/)
                .filter(part => part)
                .map(part => this.imeGetInitial(part, this.currentMode))
                .join('');
            
            if (abbreviation.startsWith(normalizedBuffer)) {
                // 直接將原始拼音碼加入候選清單
                candidates.add(entry.originalKey);
            }
        }
    }
    return Array.from(candidates);
},

/**
 * [優化版] 透過拼音首字母縮寫尋找候選字。
 * @param {string} buffer - 使用者輸入的緩衝字串
 * @returns {string[]} - 候選字陣列
 */
imeFindAbbreviationCandidates(buffer) {
    // 對縮寫搜尋也限制最小長度
    if (buffer.length < 2) {
        return [];
    }
    
    // *** 修改點：同樣對縮寫查詢的 buffer 進行正規化 ***
    const normalizedBuffer = this.imeNormalizeCompositionBuffer(buffer, this.currentMode);

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
                .map(part => this.imeGetInitial(part, this.currentMode))
                .join('');
            
            if (abbreviation.startsWith(normalizedBuffer)) {
                candidates.push(...entry.values);
            }
        }
    }
    return candidates;
},


imeRenderCandidates() {
    this.candidatesList.innerHTML = '';
    this.imeUpdatePaginationButtons();

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
        li.addEventListener('mousedown', (e) => { e.preventDefault(); this.imeSelectCandidate(index); });
        this.candidatesList.appendChild(li);
    });
},

imeClearCandidates() {
    this.allCandidates = [];
    this.imeRenderCandidates();
    this.imeUpdateUIState();
},

imeCommitText(text) {
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


/**
 * 已整合對形碼輸入法的聯想詞修正
 * 處理使用者選擇候選字的邏輯。
 * 修正了原先會錯誤判斷聯想模式的問題，現在會根據當前輸入法類型決定使用漢字聯想或拼音聯想。
 */
imeSelectCandidate(indexOnPage) {
    const wasInQueryMode = this.isQueryMode;
    const startIndex = this.currentPage * this.config.candidatesPerPage;
    const selectedCandidate = this.allCandidates[startIndex + indexOnPage];
    if (!selectedCandidate) return;

    let textToCommit;

    // --- 拼音模式優先處理 ---
    if (this.config.outputMode === 'pinyin_mode') {
        textToCommit = selectedCandidate.word;
    } else {
        // --- 非拼音模式的漢字與字音輸出處理 ---
        const selectedWord = selectedCandidate.originalWord || selectedCandidate.word;
        textToCommit = selectedWord; // 預設提交整個詞

        if (this.config.outputModeActive) {
            const nonPinyinModes = ['cangjie', 'xiami', 'hanglie'];
            const isPinyinOutputAvailable = !nonPinyinModes.includes(this.currentMode);

            if (isPinyinOutputAvailable) {
                const isSingleCharForced = this.config.features.singleCharMode;
                const wordForProcessing = isSingleCharForced ? [...selectedWord][0] : selectedWord;

                const possibleCodes = this.reverseDicts[this.currentMode]?.[wordForProcessing];
                if (possibleCodes && possibleCodes.length > 0) {
                    let bestMatchCode = possibleCodes[0];
                    if (possibleCodes.length > 1) {
                        const consumedBuffer = this.isPredictionState ? selectedWord : selectedCandidate.consumed;
                        const simplifiedUserInput = this.imeSimplifyKey(consumedBuffer, this.currentMode);
                        let foundMatch = possibleCodes.find(code => this.imeSimplifyKey(code, this.currentMode) === simplifiedUserInput);
                        if (!foundMatch) {
                            foundMatch = possibleCodes.find(code => this.imeSimplifyKey(code, this.currentMode).startsWith(simplifiedUserInput));
                        }
                        if (foundMatch) {
                            bestMatchCode = foundMatch;
                        }
                    }
                    
                    const transformedPinyin = this.imeTransformQueryCode(bestMatchCode, this.currentMode);
                    
                    switch (this.config.outputMode) {
                        case 'pinyin':
                            textToCommit = transformedPinyin;
                            break;
                        case 'word_pinyin':
                            textToCommit = `${wordForProcessing}(${transformedPinyin})`;
                            break;
                        case 'word_pinyin2':
                            textToCommit = `${wordForProcessing}［${transformedPinyin}］`;
                            break;
                    }
                }
            }
        }
    }

    // --- 【*** 核心修正邏輯：精簡判斷條件 ***】 ---
    // 只有當處於「聯想詞狀態」、且「字音輸出已啟用」、且模式為「拼音模式」時，才在前面補上空格。
    if (this.isPredictionState && this.config.features.outputEnabled && this.config.outputMode === 'pinyin_mode') {
        textToCommit = ' ' + textToCommit;
    }

    this.imeCommitText(textToCommit);

    const consumedBuffer = this.isPredictionState ? selectedCandidate.word : selectedCandidate.consumed;
    const remainingBuffer = this.compositionBuffer.substring(consumedBuffer.length);
    this.compositionBuffer = remainingBuffer;
    this.compositionCursorPos = remainingBuffer.length;

    if (this.compositionBuffer.length > 0) {
        this.isPredictionState = false;
        this.lastCommittedWord = '';
        this.imeUpdateCandidates();
    } else {
        if (wasInQueryMode) {
            this.imeExitQueryMode(false);
            this.imeUpdateCandidates();
            return;
        }
        
        const shouldShowPredictions = this.config.enablePrediction;

        if (shouldShowPredictions) {
            const nonPinyinModes = ['cangjie', 'xiami', 'hanglie'];
            const isCurrentModePinyinBased = !nonPinyinModes.includes(this.currentMode);

            // 情況 A: 只有在「啟用字音輸出」功能 **且** 模式為「拼音模式」時，才執行「拼音對拼音」的聯想。
            if (isCurrentModePinyinBased && this.config.features.outputEnabled && this.config.outputMode === 'pinyin_mode') {
                const lastCommittedPinyin = selectedCandidate.originalWord;
                const predictions = this.imeFindPinyinPredictionCandidates(lastCommittedPinyin);

                if (predictions.length > 0) {
                    this.isPredictionState = true;
                    this.lastCommittedWord = lastCommittedPinyin;
                    this.allCandidates = predictions.map(p => ({ 
                        word: this.imeTransformQueryCode(p, this.currentMode),
                        originalWord: p,
                        consumed: p 
                    }));
                    this.currentPage = 0;
                    this.highlightedIndex = 0;
                    this.imeUpdateCompositionDisplay();
                    this.imeRenderCandidates();
                    this.imeUpdateUIState();
                    this.imeReposition();
                    return; // 找到聯想詞後，結束函式
                }
            } 
            // 情況 B: 其他所有情況（包括所有形碼輸入法，以及未啟用字音輸出的拼音輸入法），
            // 都執行標準的「漢字對漢字」聯想。
            else {
                const wordForPredictionLookup = selectedCandidate.originalWord || selectedCandidate.word;
                const predictions = this.imeFindPredictionCandidates(wordForPredictionLookup);
                
                if (predictions.length > 0) {
                    this.isPredictionState = true;
                    this.lastCommittedWord = wordForPredictionLookup;
                    this.allCandidates = predictions.map(p => ({ word: p, consumed: p }));
                    this.currentPage = 0;
                    this.highlightedIndex = 0;
                    this.imeUpdateCompositionDisplay();
                    this.imeRenderCandidates();
                    this.imeUpdateUIState();
                    this.imeReposition();
                    return; // 找到聯想詞後，結束函式
                }
            }
        }

        // 如果沒有任何聯想詞，則清空狀態
        this.isPredictionState = false;
        this.lastCommittedWord = '';
        this.imeUpdateCandidates();
    }
},

/**
 * [新增的輔助函數] 根據當前的輸入法模式，更新設定介面的狀態。
 * 主要用於禁用不適用於當前模式的選項，例如在形碼模式下禁用「字音輸出」。
 */
_updateSettingsUIForCurrentMode() {
    if (!this.settingsModal) return;

    const shapeBasedModes = ['cangjie', 'xiami', 'hanglie'];
    const isShapeBasedMode = shapeBasedModes.includes(this.currentMode);

    const outputEnabledCheckbox = this.settingsModal.querySelector('#feature-outputEnabled');
    // 使用 .closest() 來找到整個設定選項的容器(DOM元素)，以便一起調整樣式
    const outputEnabledRow = outputEnabledCheckbox ? outputEnabledCheckbox.closest('.keymap-setting-row') : null;

    if (outputEnabledCheckbox && outputEnabledRow) {
        if (isShapeBasedMode) {
            // 如果是形碼模式，則禁用該選項
            outputEnabledCheckbox.disabled = true;
            outputEnabledRow.style.opacity = '0.5';
            outputEnabledRow.style.cursor = 'not-allowed';
            outputEnabledRow.title = '此功能不適用於倉頡、蝦米、行列等形碼輸入法';
        } else {
            // 否則，恢復該選項為可用狀態
            outputEnabledCheckbox.disabled = false;
            outputEnabledRow.style.opacity = '1';
            outputEnabledRow.style.cursor = 'default';
            outputEnabledRow.title = '';
        }
    }
},

imeUpdateCompositionDisplay() {
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


imeUpdateUIState() {
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
imeTransformQueryCode(code, lang) {
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
imeEnterQueryMode() {
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
                const transformedCodes = codes.map(code => this.imeTransformQueryCode(code, lang));

                const displayName = this.imeGetModeDisplayName(lang).charAt(0);
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
    this.imeRenderCandidates();
},

/**
 * 離開編碼查詢模式
 */
imeExitQueryMode(imeCommitText = false) {
    if (!this.isQueryMode) return;

    if (imeCommitText) {
        this.imeCommitText(this.queriedWord);
        this.compositionBuffer = '';
        this.compositionCursorPos = 0;
        this.imeUpdateCandidates();
    } else {
        // 還原狀態
        this.allCandidates = this.originalState.allCandidates;
        this.currentPage = this.originalState.currentPage;
        this.highlightedIndex = this.originalState.highlightedIndex;
        this.imeRenderCandidates();
    }
    
    this.isQueryMode = false;
    this.queriedWord = '';
    this.originalState = null;
},

/*
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
*/



/**
 * 【修改後版本】
 * 切換輸入法的啟用/停用狀態。
 * 這個函數現在會同時控制浮動工具列、外部工具列的 disabled 狀態，
 * 並且在停用時，會直接隱藏整個候選字視窗。
 */
/**
 * 【新函數】
 * 直接設定輸入法的啟用或停用狀態，並同步所有相關的 UI 元素。
 * @param {boolean} enabled - true 為啟用, false 為停用
 */
imeSetIsEnabled(enabled) {
    this.isEnabled = enabled;
    const isDisabled = !this.isEnabled;

    // 1. 同步所有 UI 上的啟用開關
    this.allEnableToggles.forEach(toggle => {
        toggle.checked = this.isEnabled;
    });

    // 2. 更新浮動工具列和外部工具列的樣式
    if (this.toolbarContainer) {
        this.toolbarContainer.classList.toggle('disabled', isDisabled);
    }
    const externalToolbar = document.getElementById('ime-external-toolbar-container');
    if (externalToolbar) {
        externalToolbar.classList.toggle('disabled', isDisabled);
    }

    // 3. 綁定或移除對作用中輸入框的事件監聽
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

    // 4. 如果是停用，則清空輸入狀態並隱藏候選字視窗
    if (isDisabled) {
        this.compositionBuffer = '';
        this.compositionCursorPos = 0;
        this.imeClearCandidates(); 
        if(this.candidatesContainer) {
            this.candidatesContainer.style.display = 'none';
        }
    }
},

/**
 * 【修改後的函數】
 * 切換輸入法的啟用/停用狀態 (主要由快速鍵 Ctrl+/ 觸發)。
 */
imeToggleIsEnabled() {
    this.imeSetIsEnabled(!this.isEnabled);
    const status = this.isEnabled ? "已啟用" : "已停用";
    this.imeShowToast(`輸入法 ${status}`);
},







imeNavigateCandidates(direction) {
    const itemsOnPage = this.candidatesList.children.length;
    let newIndex = this.highlightedIndex + direction;
    if (newIndex < 0) {
        if (this.currentPage > 0) this.imeChangePage(-1, true);
    } else if (newIndex >= itemsOnPage) {
        if ((this.currentPage + 1) * this.config.candidatesPerPage < this.allCandidates.length) this.imeChangePage(1);
    } else {
        this.highlightedIndex = newIndex; this.imeUpdateHighlight();
    }
},
imeUpdateHighlight() {
    this.candidatesList.querySelectorAll('li').forEach((li, index) => {
        li.classList.toggle('highlighted', index === this.highlightedIndex);
    });
},
imeChangePage(direction, highlightLast = false) {
    const newPage = this.currentPage + direction;
    const maxPage = Math.ceil(this.allCandidates.length / this.config.candidatesPerPage) - 1;
    if (newPage >= 0 && newPage <= maxPage) {
        this.currentPage = newPage;
        const itemsOnNewPage = this.allCandidates.slice(newPage * this.config.candidatesPerPage, (newPage + 1) * this.config.candidatesPerPage).length;
        this.highlightedIndex = highlightLast ? itemsOnNewPage - 1 : 0;
        this.imeRenderCandidates();
    }
},
imeUpdatePaginationButtons() {
    this.prevPageBtn.disabled = this.currentPage === 0;
    const maxPage = Math.ceil(this.allCandidates.length / this.config.candidatesPerPage) - 1;
    this.nextPageBtn.disabled = this.currentPage >= maxPage || this.allCandidates.length === 0;
},


/**
 * 已整合對形碼輸入法的字音輸出自動停用功能
 * 切換輸入法模式。
 * 當切換到倉頡、蝦米、行列等形碼輸入法時，會自動停用「字音輸出」功能。
 */
imeSwitchMode(mode) {
    // 檢查要切換的模式是否存在於字典中，避免切換到無效的語言
    if (!dictionaries[mode]) {
        console.error(`嘗試切換到無效的模式: ${mode}`);
        return;
    }

    this.currentMode = mode;
    localStorage.setItem(this.config.storagePrefix + 'mode', mode);

    // --- 【*** 核心修正邏輯開始 ***】 ---
    const shapeBasedModes = ['cangjie', 'xiami', 'hanglie'];
    // 檢查是否切換到了形碼輸入法，並且當前的「字音輸出」功能是開啟的
    if (shapeBasedModes.includes(mode) && this.config.features.outputEnabled) {
        // 複製一份當前的功能設定
        const newFeatures = { ...this.config.features };
        // 將「字音輸出」強制設為 false (關閉)
        newFeatures.outputEnabled = false;
        
        // 呼叫同步函式來套用這個變更。
        // 這個函式會同時更新內部狀態、儲存設定並更新設定介面(UI)
        this._syncFeatureSettings(newFeatures);
    }


    const langProps = imeLanguageProperties[this.currentMode] || {};
    
    if (langProps.layoutType === 'narrow') {
        this.candidatesContainer.classList.add('ime-narrow');
    } else {
        this.candidatesContainer.classList.remove('ime-narrow');
    }

    this.config.maxCompositionLength = langProps.maxLength || 30;
    
    if (langProps.allowLongPhraseToggle === false) {
        this.isLongPhraseEnabled = langProps.longPhraseMode === true;
    } else {
        // 從新的設定物件讀取狀態
        this.isLongPhraseEnabled = (this.config.features && this.config.features.longPhrase) || false;
    }
    
    // 更新所有註冊的顯示文字
    this.allModeDisplayTexts.forEach(textEl => {
        textEl.textContent = this.imeGetModeDisplayName(mode);
    });

    // 更新所有註冊的選單
    this.allModeMenus.forEach(menuEl => {
        menuEl.querySelectorAll('li').forEach(item => {
            item.classList.toggle('active', item.dataset.mode === mode);
        });
        const container = menuEl.parentElement;
        if (container) {
            container.classList.remove('open');
        }
    });

    // 清空當前的輸入狀態
    this.compositionBuffer = '';
    this.compositionCursorPos = 0;
    this.imeUpdateCandidates();

    // **新增呼叫**: 更新設定介面以反映新模式的限制
    this._updateSettingsUIForCurrentMode();
},



imeGetCaretCoordinates(element, position) {
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


imeReposition() {
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
        const coords = this.imeGetCaretCoordinates(activeElement, activeElement.selectionStart);
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

imeShow() {
    if (this.externalToolbarContainer) {
        return;
    }
    this.toolbarContainer.style.display = 'block';
},

imeHide() {
    this.toolbarContainer.style.display = 'none';
    this.candidatesContainer.style.display = 'none';
},

imeGetModeDisplayName(mode) {
    const names = { 'pinyin': '拼音', 'kasu': '詔安', 'sixian': '四縣', 'hailu': '海陸' , 'dapu': '大埔' , 'raoping': '饒平' , 'sixiannan': '南四' ,'holo': '和樂','matsu': '馬祖', 'cangjie': '倉頡', 'xiami': '蝦米', 'hanglie': '行列' };
    return names[mode] || mode;
},





imeInitDrag(e) {
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



imeDragMove(e) {
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

imeDragEnd() { 
    this.isDragging = false; 
    
    // --- NEW: 移除所有滑鼠和觸控事件的監聽器 ---
    window.removeEventListener('mousemove', this.boundDragMove); 
    window.removeEventListener('touchmove', this.boundDragMove);
    window.removeEventListener('mouseup', this.boundDragEnd); 
    window.removeEventListener('touchend', this.boundDragEnd);
},

imeEnsureInBounds() {
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

imeShowCustomConfirm(message, onConfirm) {
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

imeShowToast(message, duration = 1200) {
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
const imeHakkaToneRules = [
    [['([aeioumngbd])(z)$', 'g'], '$1ˊ'],
    [['([aeioumngbd])(v)$', 'g'], '$1ˇ'],
    [['([aeioumngbd])(s)$', 'g'], '$1ˋ'],
    [['([aeioumngbd])(x)$', 'g'], '$1ˆ'],
    [['([aeioumngbd])(f)$', 'g'], '$1⁺']
];

window.imeToneTransformRules = {
    'pinyin': [], // 拼音模式目前無此需求，可留空
    'sixian': imeHakkaToneRules,
    'hailu': imeHakkaToneRules,
    'dapu': imeHakkaToneRules,
    'raoping': imeHakkaToneRules,
    'matsu': imeHakkaToneRules,
    'sixiannan': imeHakkaToneRules

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
