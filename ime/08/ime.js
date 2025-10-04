/**
 * 檢查頁面是否已載入 Google Material Icons，若無則動態載入。
 */
function checkAndLoadMaterialIcons() {
    // 檢查字體是否已經被瀏覽器載入 (更可靠的方法)
    if (document.fonts && document.fonts.check('1em "Material Icons"')) {
        console.log('Material Icons font already loaded.');
        return;
    }

    // 備用檢查：遍歷樣式表連結
    const links = document.getElementsByTagName('link');
    let isLoaded = false;
    for (let i = 0; i < links.length; i++) {
        if (links[i].href.includes('fonts.googleapis.com/icon?family=Material+Icons')) {
            isLoaded = true;
            break;
        }
    }

    // 如果沒有找到，就建立一個 <link> 標籤並插入到 <head>
    if (!isLoaded) {
        console.log('Material Icons not found, loading dynamically...');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
        document.head.appendChild(link);
    }
}

(function() {

    if (window.WebIME) {
        return;
    }

    const WebIME = {
	isInitialized: false,
    defaultKeyMap: window.defaultKeyMap || {},
    activeElement: null,
    boundFocusInHandler: null,
    boundFocusOutHandler: null,
    toolbarContainer: null, 
    candidatesContainer: null, 
    candidatesList: null,
    topBar: null,

    modeDisplayButton: null,
    modeDisplayText: null,
    modeMenu: null,
    compositionDisplay: null,
    longPhraseToggleBtn: null,
    prevPageBtn: null,
    nextPageBtn: null,
	toneModeToggleBtn: null,

    // --- NEW START ---
    // 設定集中管理
    // 外部呼叫 init() 時可以傳入客製化設定來覆寫它們
    config: {
        defaultMode: 'sixian',      // 預設輸入法
        longPhrase: false,           // 預設是否啟用連打模式
        candidatesPerPage: 5,       // 每頁顯示的候選字數量
        maxCompositionLength: 30,   // 編碼區最大字元數
        storagePrefix: 'webime_',   // 用於 localStorage 的前綴
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
    isModeMenuVisible: false,

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
 * 建立反向字典 (字 -> 碼)，用於反查功能。
 */
createReverseDictionaries() {
    console.log("Creating reverse dictionaries for query feature...");
    
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
                    // 使用 Array.from 來正確處理擴充字元 (Surrogate Pairs)
                    if (Array.from(word).length === 1) {
                        if (!this.reverseDicts[mode][word]) {
                            this.reverseDicts[mode][word] = [];
                        }
                        // 避免重複加入相同的碼
                        if (!this.reverseDicts[mode][word].includes(code)) {
                            this.reverseDicts[mode][word].push(code);
                        }
                    }
                });
            }
        }
    });
    console.log("Reverse dictionaries created.");
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
    this.config = { ...this.config, ...userConfig };
    this.config.globalMaxCompositionLength = this.config.maxCompositionLength;

    const savedMode = localStorage.getItem(this.config.storagePrefix + 'mode');
    this.currentMode = (savedMode && dictionaries[savedMode]) ? savedMode : this.config.defaultMode;

    const savedLongPhrase = localStorage.getItem(this.config.storagePrefix + 'longPhrase');
    this.isLongPhraseEnabled = (savedLongPhrase !== null) ? (savedLongPhrase === 'true') : this.config.longPhrase;

    const savedToneModes = localStorage.getItem(this.config.storagePrefix + 'toneModes');
    if (savedToneModes) {
        try { this.toneModes = JSON.parse(savedToneModes); } catch (e) { this.toneModes = {}; }
    }
    
    const savedFullWidth = localStorage.getItem(this.config.storagePrefix + 'fullWidth');
    this.isFullWidthMode = (savedFullWidth !== null) ? (savedFullWidth === 'true') : true;
    
    // << 新增：讀取儲存的位置設定
    const savedPosition = localStorage.getItem(this.config.storagePrefix + 'position');
    this.isPositionRight = savedPosition === 'right';

    this.boundReposition = this.reposition.bind(this);
    this.boundHandleInput = this.handleInput.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);

    this.createUI();
    this.loadQuerySettings();
    
    // << 新增：初始化後更新工具列位置
    this.updateToolbarPosition();

    const initialLangProps = imeLanguageProperties[this.currentMode] || {};
    this.config.maxCompositionLength = initialLangProps.maxLength || this.config.globalMaxCompositionLength;
    this.longPhraseToggleBtn.style.display = initialLangProps.allowLongPhraseToggle === false ? 'none' : '';
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
    this.compositionCursorPos = 0;
    this.allCandidates = [];
    this.activeElement = null;

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
        return key.replace(/\s/g, '');
    }
    const simplifiedParts = key
        .split(' ')
        .map(part => part.replace(toneRegex, ''));
    return simplifiedParts.join('');
},



createUI() {
    // --- 建立工具列容器 (Toolbar) ---
    this.toolbarContainer = document.createElement("div");
    this.toolbarContainer.id = "web-ime-toolbar-container";
    this.toolbarContainer.className = "web-ime-base";
    this.toolbarContainer.style.position = 'fixed';
    this.toolbarContainer.style.bottom = '10px';
    // 預設位置由 updateToolbarPosition() 控制
    // this.toolbarContainer.style.left = '10px';
    // this.toolbarContainer.style.right = 'auto';
    this.toolbarContainer.style.top = 'auto';

    this.topBar = document.createElement("div");
    this.topBar.id = "web-ime-top-bar";

    const logo = document.createElement("span");
    logo.className = "ime-logo";
    logo.textContent = "🥷";
    this.topBar.appendChild(logo);

    const modeContainer = document.createElement("div");
    modeContainer.className = "ime-mode-container";
    this.modeDisplayButton = document.createElement("button");
    this.modeDisplayButton.type = "button";
    this.modeDisplayButton.className = "ime-mode-button";
    this.modeDisplayText = document.createElement("span");
    this.modeDisplayText.className = "ime-mode-text";
    this.modeDisplayText.textContent = this.getModeDisplayName(this.currentMode);
    this.modeDisplayButton.appendChild(this.modeDisplayText);

    this.modeDisplayButton.addEventListener('click', (e) => {
        const rect = this.modeDisplayButton.getBoundingClientRect();
        const clickX = e.clientX;
        const arrowClickAreaStart = rect.right - 30;

        if (clickX > arrowClickAreaStart) {
            if (this.isModeMenuVisible) {
                modeContainer.classList.remove('open');
                this.isModeMenuVisible = false;
            } else {
                this.modeMenu.style.visibility = 'hidden';
                modeContainer.classList.add('open');
                const menuWidth = this.modeMenu.offsetWidth;
                const menuHeight = this.modeMenu.offsetHeight;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                if (rect.left + menuWidth > viewportWidth) {
                    this.modeMenu.style.left = 'auto';
                    this.modeMenu.style.right = '0';
                } else {
                    this.modeMenu.style.left = '0';
                    this.modeMenu.style.right = 'auto';
                }
                if (rect.bottom + menuHeight > viewportHeight) {
                    this.modeMenu.style.top = 'auto';
                    this.modeMenu.style.bottom = '105%';
                } else {
                    this.modeMenu.style.top = '105%';
                    this.modeMenu.style.bottom = 'auto';
                }
                this.modeMenu.style.visibility = 'visible';
                this.isModeMenuVisible = true;
            }
        } else {
            this.toggleIsEnabled();
        }
    });
    modeContainer.appendChild(this.modeDisplayButton);

    this.modeMenu = document.createElement("ul");
    this.modeMenu.className = "ime-mode-menu";
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
    settingsContainer.appendChild(this.toneModeToggleBtn);
    this.longPhraseToggleBtn = document.createElement("button");
    this.longPhraseToggleBtn.type = "button";
    this.longPhraseToggleBtn.className = "ime-settings-button";
    this.longPhraseToggleBtn.innerHTML = '<span class="material-icons" style="font-size: 18px;">add_box</span>';
    this.longPhraseToggleBtn.title = "長詞連打/音首縮打";
    this.longPhraseToggleBtn.addEventListener('click', () => this.toggleLongPhraseMode());
    if (this.isLongPhraseEnabled) {
        this.longPhraseToggleBtn.classList.add('active');
    }
    settingsContainer.appendChild(this.longPhraseToggleBtn);
    this.punctuationModeToggleBtn = document.createElement("button");
    this.punctuationModeToggleBtn.type = "button";
    this.punctuationModeToggleBtn.className = "ime-settings-button";
    this.punctuationModeToggleBtn.title = "全形/半形標點";
    this.punctuationModeToggleBtn.addEventListener('click', () => this.togglePunctuationMode());
    settingsContainer.appendChild(this.punctuationModeToggleBtn);
    this.topBar.appendChild(settingsContainer);

    // << 新增：建立「切換位置」按鈕
    this.positionToggleButton = document.createElement("button");
    this.positionToggleButton.type = "button";
    this.positionToggleButton.className = "ime-settings-button";
    this.positionToggleButton.title = "切換位置";
    this.positionToggleButton.innerHTML = '<span class="material-icons" style="font-size: 18px;">swap_horiz</span>';
    this.positionToggleButton.addEventListener('click', () => this.togglePosition());
    settingsContainer.appendChild(this.positionToggleButton); // 將其加入設定按鈕群組

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

    this.queryBtn = document.createElement("button");
    this.queryBtn.type = "button";
    this.queryBtn.className = "ime-page-button";
    this.queryBtn.title = "字根反查 (/)";
    this.queryBtn.innerHTML = '<span class="material-icons" style="font-size: 20px;">search</span>';
    this.queryBtn.addEventListener("click", () => {
         if (this.isQueryMode) {
            this.exitQueryMode(false);
        } else if (this.allCandidates.length > 0) {
            this.enterQueryMode();
        }
    });
    compositionBar.appendChild(this.queryBtn);

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
    compositionBar.appendChild(pagination);

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
    settingsContainer.appendChild(settingsBtn);

    this.createSettingsModal();

    document.body.appendChild(this.candidatesContainer);

    this.updateUIState();
    this.updateToneModeButtonUI();
},


createSettingsModal() {
    // --- 建立設定視窗 ---
    this.settingsModal = document.createElement('div');
    this.settingsModal.id = 'web-ime-settings-modal';
    this.settingsModal.style.display = 'none';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    // --- 視窗標題與關閉按鈕 ---
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    modalHeader.innerHTML = '<h3>輸入法設定</h3>';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => { this.settingsModal.style.display = 'none'; };
    modalHeader.appendChild(closeBtn);
    modalContent.appendChild(modalHeader);

    // --- 設定項：字根反查 ---
    const querySettingsSection = document.createElement('div');
    querySettingsSection.className = 'settings-section';
    querySettingsSection.innerHTML = '<h4>字根反查</h4>';
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'query-options-container'; 
    for (const mode in dictionaries) {
        // 只為有反向字典的語言建立選項
        if (this.reverseDicts[mode] && Object.keys(this.reverseDicts[mode]).length > 0) {
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
    querySettingsSection.appendChild(optionsContainer);
    modalContent.appendChild(querySettingsSection);

    // --- << 新增：使用說明區塊 >> ---
    const helpSection = document.createElement('div');
    helpSection.className = 'settings-section';
    helpSection.innerHTML = '<h4>使用說明</h4>';
    const helpContent = document.createElement('div');
    helpContent.className = 'settings-help-content';
    // 使用 innerText 或 textContent 來安全地插入純文字並保留換行
    helpContent.innerText = `聲調可用字母zˊ vˇ sˋ xˆ f⁺ lˈ，也可切換為數字。
「連」打可以連打拼音。
x 是標點。
空白鍵選第一個候選字。
也可用 ,< .> 左右移動加空白鍵。
也可以用數字或 shift+數字來選候選字。
輸入編碼 + w 可輸出拼音。`;
    helpSection.appendChild(helpContent);
    modalContent.appendChild(helpSection);
    
    this.settingsModal.appendChild(modalContent);

    // 將設定視窗加入到 body
    document.body.appendChild(this.settingsModal);
},


saveQuerySettings() {
    const enabled = {};
    const checkboxes = this.settingsModal.querySelectorAll('.settings-section input[type="checkbox"]');
    checkboxes.forEach(cb => {
        enabled[cb.value] = cb.checked;
    });
    // 將設定儲存到 WebIME 物件和 localStorage
    this.config.querySettings = enabled;
    localStorage.setItem(this.config.storagePrefix + 'querySettings', JSON.stringify(enabled));
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
    }
},

attachEventListeners() {
    const onImeInteractionStart = () => { this.isClickingInside = true; };
    this.toolbarContainer.addEventListener('mousedown', onImeInteractionStart);
    this.toolbarContainer.addEventListener('touchstart', onImeInteractionStart, { passive: true });
    this.candidatesContainer.addEventListener('mousedown', onImeInteractionStart);
    this.candidatesContainer.addEventListener('touchstart', onImeInteractionStart, { passive: true });

    // << 修改重點：將事件處理邏輯包裝成獨立函數，並儲存綁定後的版本
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
},


activate(element) {
    if (this.activeElement === element && this.toolbarContainer.style.display === 'block') {
        return;
    }
    if (this.activeElement && this.activeElement !== element) {
        this.deactivate();
    }
    this.activeElement = element;
    this.lastInputValue = this.activeElement.isContentEditable ? this.activeElement.textContent : this.activeElement.value;

    this.show();
    setTimeout(() => this.reposition(), 0);
    this.activeElement.addEventListener('click', this.boundReposition);
    this.activeElement.addEventListener('keyup', this.boundReposition);
    this.activeElement.addEventListener('mouseup', this.boundReposition);
    
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
    
    // 偵測輸入
    if (currentVal.length > this.lastInputValue.length) {
        let diff = currentVal.substring(this.lastInputValue.length);

        // 【主要修改點】
        // 當輸入的是空白鍵時，進行特別處理
        if (diff === ' ') {
            const hasBuffer = this.compositionBuffer.length > 0;
            const hasCandidates = this.allCandidates.length > 0;

            // 情況 3: 如果編碼區是空的，這就是一個普通的空白字元。
            // 我們只需更新 lastInputValue，然後結束函數，讓空白留在編輯器中。
            if (!hasBuffer) {
                this.lastInputValue = currentVal;
                return;
            }

            // 如果程式執行到這裡，代表編碼區不是空的，
            // 所以空白鍵是一個「指令」，必須先從編輯區移除。
            const restoreVal = this.lastInputValue;
            if (target.isContentEditable) {
                target.textContent = restoreVal;
                const range = document.createRange();
                const sel = window.getSelection();
                if (target.childNodes.length > 0) {
                    range.setStart(target.childNodes[0], restoreVal.length);
                } else {
                    range.setStart(target, 0);
                }
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                const originalSelectionStart = target.selectionStart;
                target.value = restoreVal;
                target.setSelectionRange(originalSelectionStart - diff.length, originalSelectionStart - diff.length);
            }
            this.lastInputValue = restoreVal;

            // 現在根據情況執行對應的「指令」
            // 情況 1: 有候選字，執行「選字」
            if (hasCandidates) {
                this.selectCandidate(this.highlightedIndex);
            } 
            // 情況 2: 有編碼但無候選字，執行「清除編碼」
            else {
                this.compositionBuffer = '';
                this.compositionCursorPos = 0;
                this.updateCandidates(); // 更新UI以清空編碼區
            }
            
            // 處理完畢，直接返回
            return;
        }


        const hasComposition = this.compositionBuffer && this.allCandidates.length > 0;
        const currentToneMode = this.getCurrentToneMode();
        const isNumberSelect = currentToneMode === 'alphabetic' && diff.match(/^[1-9]$/) && hasComposition;
        const isWTransform = diff.toLowerCase() === 'w' && this.compositionBuffer;

        // 如果觸發了任何其他特殊功能（數字選字、w 轉換）
        if (isNumberSelect || isWTransform) {
            
            // 步驟 1: 立刻還原輸入框的內容，吃掉剛剛輸入的特殊字元
            const restoreVal = this.lastInputValue;
            if (target.isContentEditable) {
                target.textContent = restoreVal;
                const range = document.createRange();
                const sel = window.getSelection();
                if (target.childNodes.length > 0) {
                    range.setStart(target.childNodes[0], restoreVal.length);
                } else {
                    range.setStart(target, 0);
                }
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                const originalSelectionStart = target.selectionStart;
                target.value = restoreVal;
                target.setSelectionRange(originalSelectionStart - diff.length, originalSelectionStart - diff.length);
            }
            this.lastInputValue = restoreVal; // 同步 lastInputValue

            // 步驟 2: 在乾淨的狀態下，執行對應的功能
            if (isNumberSelect) {
                const index = parseInt(diff, 10) - 1;
                if (index < this.candidatesList.children.length) {
                    this.selectCandidate(index);
                }
            } 
            else if (isWTransform) {
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
            }
            return; // 任務完成，結束函數
        }
        
        // (如果不是特殊功能鍵，則執行正常的編碼輸入邏輯)
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
        
        const restoreVal = this.lastInputValue;
        if (target.isContentEditable) {
            target.textContent = restoreVal;
            const range = document.createRange();
            const sel = window.getSelection();
            if (target.childNodes.length > 0) {
                range.setStart(target.childNodes[0], restoreVal.length);
            } else {
                range.setStart(target, 0);
            }
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            const originalSelectionStart = target.selectionStart;
            target.value = restoreVal;
            target.setSelectionRange(originalSelectionStart - diff.length, originalSelectionStart - diff.length);
        }
        
        this.lastInputValue = restoreVal;
        this.updateCandidates();
    }
    else if (currentVal.length < this.lastInputValue.length) {
         if (this.compositionBuffer) {
            this.compositionBuffer = this.compositionBuffer.slice(0, -1);
            this.compositionCursorPos = this.compositionBuffer.length;
            this.updateCandidates();
        }
        this.lastInputValue = currentVal;
    } else {
        this.lastInputValue = currentVal;
    }
},

findPhraseCandidates(buffer) {
    const langProps = imeLanguageProperties[this.currentMode] || {};
    const toneRegex = imeToneMappings[this.currentMode];
    let processedBuffer = buffer;

    if (langProps.toneType === 'numeric' && toneRegex) {
        processedBuffer = buffer.replace(new RegExp(toneRegex.source, 'g'), '');
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
    if (e.isComposing || e.keyCode === 229) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (this.isMobile && e.key && e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        return;
    }

    const hasComposition = this.compositionBuffer.length > 0;


    if (this.isFullWidthMode && !hasComposition) {
        const fullWidthPunctuation = {
            ',': '，', '.': '。', '?': '？', ';': '；', ':': '：', "'": '、', '[': '「', ']': '」', '{': '『', '}': '』', '!': '！', '-': '─', '(': '（', ')': '）', '~': '～', '/': '？', '<': '〈', '>': '〉', '_': '＿', '"': '…', '\\': '【】', '|': '《》'
        };
        const fullWidthChar = fullWidthPunctuation[e.key];
        if (fullWidthChar) {
            e.preventDefault();
            this.commitText(fullWidthChar);
            return;
        }
    }

    const langProps = imeLanguageProperties[this.currentMode] || {};
    const keyMap = langProps.keyMap || this.defaultKeyMap;
    
    const reverseKeyMap = {};
    for (const action in keyMap) {
        keyMap[action].forEach(key => {
            reverseKeyMap[key] = action;
        });
    }

    const action = reverseKeyMap[e.key];
    const hasCandidates = this.allCandidates.length > 0;

    if (e.key === '/') {
        // 無論如何都先阻止瀏覽器預設行為 (例如開啟搜尋)
        e.preventDefault();

        // 如果已在查詢模式中，則退出查詢
        if (this.isQueryMode) {
            this.exitQueryMode(false); // 傳入 false 表示不送出文字，僅返回上一層
        } 
        // 否則，如果條件符合，則進入查詢模式
        else if (hasCandidates && !['cangjie', 'xiami'].includes(this.currentMode)) {
            this.enterQueryMode();
        }
        
        // 處理完畢後返回，避免後續程式碼再次處理到 '/'
        return;
    }

    if (action && hasComposition) {
        e.preventDefault();
        switch (action) {
            case 'selectCandidate':
                if (hasCandidates) {
                    this.selectCandidate(this.highlightedIndex);
                } else {
                    // 從設定檔讀取行為，若未定義則預設為 'commit'
                    const actionOnNoCandidates = langProps.spaceActionOnNoCandidates || 'commit';

                    if (actionOnNoCandidates === 'clear') {
                        // 新行為：清除編碼區
                        this.compositionBuffer = '';
                        this.compositionCursorPos = 0;
                        this.updateCandidates();
                    } else { // 預設 'commit' 行為
                        // 原始行為：送出編碼區文字
                        this.commitText(this.compositionBuffer);
                        this.compositionBuffer = '';
                        this.compositionCursorPos = 0;
                        this.updateCandidates();
                    }
                }
                return;
            
            case 'commitComposition':
                this.commitText(this.compositionBuffer);
                this.compositionBuffer = '';
                this.compositionCursorPos = 0;
                this.updateCandidates();
                return;

            case 'clearComposition':
                this.compositionBuffer = '';
                this.compositionCursorPos = 0;
                this.updateCandidates();
                return;
            case 'nextCandidate':
                if (hasCandidates) this.navigateCandidates(1);
                return;
            case 'prevCandidate':
                if (hasCandidates) this.navigateCandidates(-1);
                return;
            case 'nextPage':
                if (hasCandidates) this.changePage(1);
                return;
            case 'prevPage':
                if (hasCandidates) this.changePage(-1);
                return;
            case 'moveCursorLeft':
                 if (this.compositionCursorPos > 0) this.compositionCursorPos--;
                 this.updateCompositionDisplay();
                 return;
            case 'moveCursorRight':
                 if (this.compositionCursorPos < this.compositionBuffer.length) this.compositionCursorPos++;
                 this.updateCompositionDisplay();
                 return;
            case 'toggleLongPhrase':
                this.toggleLongPhraseMode();
                return;
            case 'transformTone':
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
                return;
        }
    }
    
    if (hasComposition && hasCandidates) {
        const currentToneMode = this.getCurrentToneMode();
        if (currentToneMode === 'alphabetic' && e.key >= '1' && e.key <= '9') {
            const index = parseInt(e.key, 10) - 1;
            if (index < this.candidatesList.children.length) {
                e.preventDefault();
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
        if (hasComposition && this.compositionCursorPos > 0) {
            e.preventDefault();
            const buffer = this.compositionBuffer;
            const pos = this.compositionCursorPos;
            this.compositionBuffer = buffer.substring(0, pos - 1) + buffer.substring(pos);
            this.compositionCursorPos--;
            this.updateCandidates();
        }
        return;
    }
    
    if (!this.isMobile && e.key.length === 1 && !reverseKeyMap[e.key]) {
        let character = e.key;
        const currentToneMode = this.getCurrentToneMode();
        const isNumericToneMode = currentToneMode === 'numeric' && langProps.numericToneMap;
        
        if (isNumericToneMode && character.match(/^[0-9]$/)) {
            character = langProps.numericToneMap[character] || character;
        }

        e.preventDefault();
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
    const defaultToneMode = (langProps.toneModes && langProps.toneModes[0]) || 'alphabetic';
    return this.toneModes[this.currentMode] || defaultToneMode;
},

updateToneModeButtonUI() {
    const langProps = imeLanguageProperties[this.currentMode] || {};
    if (langProps.toneModes && langProps.toneModes.length > 1) {
        this.toneModeToggleBtn.style.display = '';
        const currentSetting = this.getCurrentToneMode();
        const modeText = currentSetting === 'numeric' ? '調ˇ' : 'źv̌s̀';
        this.toneModeToggleBtn.textContent = `${modeText}`;
    } else {
        this.toneModeToggleBtn.style.display = 'none';
    }
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
},

// 請用此新版函數完整取代舊的 updateCandidates 函數
updateCandidates() {
    const activeBuffer = this.compositionBuffer.substring(0, this.compositionCursorPos).toLowerCase();

    this.updateUIState();
    this.updateCompositionDisplay();

    if (activeBuffer.length === 0) {
        this.clearCandidates();
        return;
    }

    const dictionary = dictionaries[this.currentMode];
    let candidates = [];

    // --- 核心邏輯 ---

    // 1. 尋找完全符合當前完整編碼 (activeBuffer) 的候選字
    const exactResult = dictionary[activeBuffer];
    if (exactResult) {
        exactResult.split(' ').forEach(word => {
            candidates.push({ word: word, consumed: activeBuffer });
        });
    }

    // 2. 根據模式尋找其他候選字 (例如：連打、簡拼、前綴)
    if (this.isLongPhraseEnabled) {
        this.findPhraseCandidates(activeBuffer).forEach(word => {
            candidates.push({ word: word, consumed: activeBuffer });
        });
        this.findSimplePrefixCandidates(activeBuffer).forEach(word => {
            candidates.push({ word: word, consumed: activeBuffer });
        });
    } else {
        this.findSimplePrefixCandidates(activeBuffer).forEach(word => {
            candidates.push({ word: word, consumed: activeBuffer });
        });
        this.findAbbreviationCandidates(activeBuffer).forEach(word => {
            candidates.push({ word: word, consumed: activeBuffer });
        });
    }

    // 3. 在長詞模式下，尋找最長有效前綴的候選字作為「後備選項」
    if (this.isLongPhraseEnabled && activeBuffer.length > 1) {
        for (let i = activeBuffer.length - 1; i > 0; i--) {
            const prefix = activeBuffer.substring(0, i);
            // 檢查這個前綴本身是否是一個有效的編碼 (存在於字典中)
            if (dictionary[prefix]) {
                // 【修正點】
                // 直接從字典取用該前綴的候選字，確保精確匹配
                // 而不是使用會包含其他開頭相同編碼的 findSimplePrefixCandidates
                const prefixCandidates = dictionary[prefix].split(' ');
                
                prefixCandidates.forEach(word => {
                    // 標記這些候選字只消耗了前綴的部分
                    candidates.push({ word: word, consumed: prefix });
                });
                
                // 找到最長的前綴後就停止，避免產生過多不相關的結果
                break;
            }
        }
    }

    // 4. 移除重複的候選字 (以 word 為基準)，並保留最先出現的
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
    // 當輸入長度小於 2 時，不進行搜尋，避免返回過多無用結果並提升效能
    if (buffer.length < 1) {
        return [];
    }

    const firstChar = buffer[0].toLowerCase();
    const relevantEntries = this.preprocessedDicts[this.currentMode][firstChar];

    // 如果沒有該首字母對應的詞條分組，直接返回空陣列
    if (!relevantEntries) {
        return [];
    }

    const candidates = [];
    // 只遍歷相關的分組，而不是整個字典
    for (const entry of relevantEntries) {
        // 比對包含聲調的原始 key (連續)
        if (entry.originalKey.replace(/\s/g, '').startsWith(buffer)) {
             candidates.push(...entry.values);
        }
        // 比對移除聲調後的簡化 key
        else if (entry.simplifiedKey.startsWith(buffer)) {
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
    // 同樣，對縮寫搜尋也限制最小長度
    if (buffer.length < 2) {
        return [];
    }
    
    const firstChar = buffer[0].toLowerCase();
    const relevantEntries = this.preprocessedDicts[this.currentMode][firstChar];

    if (!relevantEntries) {
        return [];
    }

    const candidates = [];
    // 只遍歷相關的分組
    for (const entry of relevantEntries) {
        if (entry.originalKey.includes(' ')) {
            const abbreviation = entry.originalKey
                .split(' ')
                .filter(part => part)
                .map(part => this.getInitial(part, this.currentMode))
                .join('');
            
            if (abbreviation.startsWith(buffer)) {
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
    const selectedCandidate = this.allCandidates[this.currentPage * this.config.candidatesPerPage + indexOnPage];
    if (!selectedCandidate) return;

    // 從候選物件中取得要上屏的文字和消耗的編碼
    const selectedWord = selectedCandidate.word;
    const consumedBuffer = selectedCandidate.consumed;

    this.commitText(selectedWord);

    if (wasInQueryMode) {
        this.isQueryMode = false;
        this.queriedWord = '';
        this.originalState = null;
        this.compositionBuffer = '';
        this.compositionCursorPos = 0;
        this.updateCandidates();
    } else {
        // 使用 consumedBuffer 的長度來計算剩餘的編碼
        const remainingBuffer = this.compositionBuffer.substring(consumedBuffer.length);
        this.compositionBuffer = remainingBuffer;
        this.compositionCursorPos = remainingBuffer.length;

        if (this.activeElement && this.activeElement.isContentEditable) {
            setTimeout(() => this.updateCandidates(), 0);
        } else {
            this.updateCandidates();
        }
    }
},

updateCompositionDisplay() {
    if (this.compositionDisplay) {
        this.compositionDisplay.innerHTML = '';
        const preCursorText = this.compositionBuffer.substring(0, this.compositionCursorPos);
        const textSpan = document.createElement('span');
        textSpan.textContent = this.compositionBuffer;
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
    // 如果編碼區有內容，則顯示整個候選字容器
    if (this.compositionBuffer) {
        this.candidatesContainer.style.display = 'flex';
        if (this.compositionDisplay) {
            this.compositionDisplay.style.display = 'block';
        }
        // 【新邏輯】控制查詢按鈕的顯示
        // 只有當有候選字且不支援倉頡、蝦米反查時才顯示
        const showQueryButton = this.allCandidates.length > 0 && !['cangjie', 'xiami'].includes(this.currentMode);
        this.queryBtn.style.display = showQueryButton ? 'flex' : 'none';

    } 
    // 如果編碼區是空的，則隱藏整個候選字容器
    else {
        this.candidatesContainer.style.display = 'none';
        if (this.compositionDisplay) {
            this.compositionDisplay.style.display = 'none';
        }
        // 同時隱藏查詢按鈕
        this.queryBtn.style.display = 'none';
    }
},

/**
 * 根據語言規則轉換查詢到的字根編碼
 * @param {string} code - 原始編碼
 * @param {string} lang - 語言模式
 * @returns {string} - 轉換後的編碼
 */
transformQueryCode(code, lang) {
    // 倉頡與蝦米轉為大寫
    if (lang === 'cangjie' || lang === 'xiami') {
        return code.toUpperCase();
    }

    // 取得該語言的聲調轉換規則
    const rules = (window.imeToneTransformRules || {})[lang];

    // 如果有轉換規則，則套用
    if (rules && rules.length > 0) {
        let transformedCode = code;
        for (const rule of rules) {
            // 規則格式: [ [正則表達式字串, 旗標], 替換字串]
            // 例如: [['([aeiou])(z)$', 'g'], '$1ˊ']
            try {
                const regex = new RegExp(rule[0][0], rule[0][1]);
                // 使用 replace 來處理，但因為可能有多條規則，我們只替換一次
                // 如果需要連續替換，需要調整邏輯，但目前聲調規則通常是單一的
                if (regex.test(transformedCode)) {
                    transformedCode = transformedCode.replace(regex, rule[1]);
                }
            } catch (e) {
                console.error(`Error applying regex rule for lang "${lang}":`, rule, e);
            }
        }
        return transformedCode;
    }

    // 如果沒有任何規則匹配，回傳原編碼
    return code;
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





toggleIsEnabled() {
    this.isEnabled = !this.isEnabled;
    if (this.activeElement) {
        if (this.isEnabled) {
            this.toolbarContainer.classList.remove('disabled');
            this.activeElement.addEventListener('keydown', this.boundHandleKeyDown);
            this.activeElement.addEventListener('input', this.boundHandleInput);
        } else {
            this.toolbarContainer.classList.add('disabled');
            this.activeElement.removeEventListener('keydown', this.boundHandleKeyDown);
            this.activeElement.removeEventListener('input', this.boundHandleInput);
        }
    } else {
        if (this.isEnabled) {
            this.toolbarContainer.classList.remove('disabled');
        } else {
            this.toolbarContainer.classList.add('disabled');
        }
    }
},

toggleLongPhraseMode() {
    this.isLongPhraseEnabled = !this.isLongPhraseEnabled;
    localStorage.setItem(this.config.storagePrefix + 'longPhrase', this.isLongPhraseEnabled);
    this.longPhraseToggleBtn.classList.toggle('active', this.isLongPhraseEnabled);
    this.updateCandidates();
    if (this.activeElement) this.activeElement.focus();
},

toggleLongPhraseMode() {
    this.isLongPhraseEnabled = !this.isLongPhraseEnabled;
    localStorage.setItem(this.config.storagePrefix + 'longPhrase', this.isLongPhraseEnabled);
    this.longPhraseToggleBtn.classList.toggle('active', this.isLongPhraseEnabled);
    this.updateCandidates();
    if (this.activeElement) this.activeElement.focus();
},


togglePunctuationMode() {
    this.isFullWidthMode = !this.isFullWidthMode;
    localStorage.setItem(this.config.storagePrefix + 'fullWidth', this.isFullWidthMode);
    this.updatePunctuationButtonUI();
    if (this.activeElement) this.activeElement.focus();
},



updatePunctuationButtonUI() {
    if (this.punctuationModeToggleBtn) {
        this.punctuationModeToggleBtn.innerHTML = this.isFullWidthMode 
            ? '<span class="material-icons" style="font-size: 16px;">radio_button_unchecked</span>' 
            : '<span class="material-icons" style="font-size: 16px;">tonality</span>';
        
        this.punctuationModeToggleBtn.classList.toggle('active', this.isFullWidthMode);
    }
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

    // 根據寬度類型，切換 class
    if (langProps.layoutType === 'narrow') {
        this.candidatesContainer.classList.add('ime-narrow');
    } else {
        this.candidatesContainer.classList.remove('ime-narrow');
    }

    this.config.maxCompositionLength = langProps.maxLength || this.config.globalMaxCompositionLength;

    if (langProps.allowLongPhraseToggle === false) {
        this.longPhraseToggleBtn.style.display = 'none';
        this.isLongPhraseEnabled = langProps.longPhraseMode === true;
    } else {
        this.longPhraseToggleBtn.style.display = '';
        const savedLongPhrase = localStorage.getItem(this.config.storagePrefix + 'longPhrase');
        if (savedLongPhrase !== null) {
            this.isLongPhraseEnabled = savedLongPhrase === 'true';
        } else {
            this.isLongPhraseEnabled = this.config.longPhrase;
        }
    }
    this.longPhraseToggleBtn.classList.toggle('active', this.isLongPhraseEnabled);

    this.modeDisplayText.textContent = this.getModeDisplayName(mode);
    this.modeMenu.querySelectorAll('li').forEach(item => {
        item.classList.toggle('active', item.dataset.mode === mode);
    });
    if (this.isModeMenuVisible) {
        this.modeMenu.parentElement.classList.remove('open');
        this.isModeMenuVisible = false;
    }

    this.compositionBuffer = '';
    this.compositionCursorPos = 0;
    this.updateCandidates();
    this.updateToneModeButtonUI();
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
    const names = { 'pinyin': '拼音', 'kasu': '詔安', 'sixian': '四縣', 'hailu': '海陸' , 'dapu': '大埔' , 'raoping': '饒平' , 'sixiannan': '南四' ,'holo': '和樂', 'cangjie': '倉頡', 'xiami': '蝦米' };
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
    // 只有在釘選狀態下才允許拖曳
    if (!this.isPinned) return;

    if (e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;
    if (e.type === 'mousedown' && e.button !== 0) return;

    this.isDragging = true;
    const touch = e.touches ? e.touches[0] : null;
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;

    // 因為工具列是 fixed 定位，可以直接用 clientX/Y
    this.offsetX = clientX - this.toolbarContainer.getBoundingClientRect().left;
    this.offsetY = clientY - this.toolbarContainer.getBoundingClientRect().top;

    window.addEventListener('mousemove', this.boundDragMove);
    window.addEventListener('touchmove', this.boundDragMove, { passive: false });
    window.addEventListener('mouseup', this.boundDragEnd);
    window.addEventListener('touchend', this.boundDragEnd);
    
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
    'kasu': hakkaToneRules,
    'sixian': hakkaToneRules,
    'hailu': hakkaToneRules,
    'dapu': hakkaToneRules,
    'raoping': hakkaToneRules,
    'sixiannan': hakkaToneRules

};

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

// 註冊 'holo' 語言使用的轉換函式
window.imeToneTransformFunctions = {
    'holo': imeHoloZvsToTone
};
