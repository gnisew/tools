// DOM 元素快取
const elements = {};

// 初始化 DOM 元素快取
function initElements() {
    const ids = [
        'sidebar', 'sidebarOverlay', 'inputText', 'outputText', 'copyBtn', 'editBtn',
        'fontFamily', 'fontSize', 'syncScroll', 'wrapText', 'showLineNumbers', 
        'autoConvert', 'convertBtn', 'leftLangText', 'rightLangText',
        'leftLangOptions', 'rightLangOptions', 'inputLineNumbers', 'outputLineNumbers',
        'rememberInput', 'logoText', 'translateText', 'languageSelect'
    ];
    
    ids.forEach(id => {
        elements[id] = document.getElementById(id);
    });
}

// 解析語言配置 - 修正版本
function parseLanguageConfig() {
    const lines = currentLanguageConfig.trim().split(/\n/).slice(1);
    conversionMap = {};
    exampleMap = {};
    const leftLangArray = [];  // 改用陣列保持順序和重複項目
    const rightLangArray = []; // 改用陣列保持順序和重複項目

    lines.forEach(line => {
        const [left, right, func, leftExample, rightExample] = line.split('\t').map(s => s.trim());
        
        if (left && right && func) {
            const key = `${left}-${right}`;
            conversionMap[key] = func;

            if (leftExample && rightExample) {
                exampleMap[key] = {
                    left: leftExample.replace(/\\n/g, '\n'),
                    right: rightExample.replace(/\\n/g, '\n')
                };
            }

            leftLangArray.push(left);   // 保持所有項目，包括重複的
            rightLangArray.push(right); // 保持所有項目，包括重複的
        }
    });

    // 使用陣列去重但保持順序
    leftLanguages = [...new Set(leftLangArray)];
    rightLanguages = [...new Set(rightLangArray)];

    return { 
        conversionMap, 
        exampleMap, 
        leftLanguages,
        rightLanguages
    };
}

// 全域變數宣告
let conversionMap = {};
let exampleMap = {};
let leftLanguages = [];
let rightLanguages = [];



// 語言記憶功能
function getStorageKey(key) {
    return `${APP_ID}_${key}`;
}

function saveLanguageSettings() {
    try {
        localStorage.setItem(getStorageKey('leftLang'), currentLeftLang);
        localStorage.setItem(getStorageKey('rightLang'), currentRightLang);
    } catch (error) {
        console.log('Unable to save language settings:', error);
    }
}


// 語言記憶功能
function loadLanguageSettings() {
    try {
        const savedLeftLang = localStorage.getItem(getStorageKey('leftLang'));
        const savedRightLang = localStorage.getItem(getStorageKey('rightLang'));
        
        // 檢查保存的語言是否仍然有效
        if (savedLeftLang && leftLanguages.includes(savedLeftLang)) {
            const availableForRight = getAvailableOptions(savedLeftLang);
            if (savedRightLang && availableForRight.includes(savedRightLang)) {
                return { left: savedLeftLang, right: savedRightLang };
            } else if (availableForRight.length > 0) {
                return { left: savedLeftLang, right: availableForRight[0] };
            }
        }
    } catch (error) {
        console.log('Unable to load language settings:', error);
    }
    
    return { left: defaultLeftLang, right: defaultRightLang };
}


// 使用記憶的語言設定
const savedLangs = loadLanguageSettings();
let currentLeftLang = savedLangs.left;
let currentRightLang = savedLangs.right;

// 設定狀態
let fontSettings = loadSetting('fontSettings', { fontFamily: 'default', fontSize: '18' });
let syncScrollEnabled = loadSetting('syncScroll', false);
let wrapTextEnabled = loadSetting('wrapText', true);
let showLineNumbers = loadSetting('showLineNumbers', false);
let autoConvertEnabled = loadSetting('autoConvert', true);
let rememberInputEnabled = loadSetting('rememberInput', false);
let isScrolling = false;
let isEditing = false;


// 通用設定儲存和載入函數
function saveSetting(key, value) {
    try {
        localStorage.setItem(getStorageKey(key), JSON.stringify(value));
    } catch (error) {
        console.log(`Unable to save ${key}:`, error);
    }
}

function loadSetting(key, defaultValue) {
    try {
        const saved = localStorage.getItem(getStorageKey(key));
        return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
        console.log(`Unable to load ${key}:`, error);
        return defaultValue;
    }
}


// 更新 placeholder 和範例
function updatePlaceholders() {
    const key = `${currentLeftLang}-${currentRightLang}`;
    const examples = exampleMap[key];
    const inputValue = elements.inputText.value.trim();

    if (examples) {
        elements.inputText.placeholder = examples.left;
        if (!inputValue) {
            elements.outputText.textContent = examples.right;
            elements.outputText.classList.add('empty');
            elements.copyBtn.disabled = true;
        }
    } else {
        elements.inputText.placeholder = '輸入文字';
        if (!inputValue) {
            elements.outputText.textContent = '翻譯';
            elements.outputText.classList.add('empty');
            elements.copyBtn.disabled = true;
        }
    }
    
    if (!isEditing) {
        elements.outputText.contentEditable = false;
    }
    updateLineNumbers('output');
}

// 取得可用的轉換選項
function getAvailableOptions(sourceLang) {
    return Object.keys(conversionMap)
        .filter(key => key.split('-')[0] === sourceLang)
        .map(key => key.split('-')[1]);
}

// 選擇語言
function selectLanguage(side, language) {
    if (side === 'left') {
        currentLeftLang = language;
        elements.leftLangText.textContent = language;

        // 取得這個左邊語言可以轉換到的右邊語言選項
        const availableForRight = getAvailableOptions(language);
        
        // 如果當前選中的右邊語言不在可用選項中，選擇第一個可用的
        if (!availableForRight.includes(currentRightLang)) {
            currentRightLang = availableForRight[0];
            elements.rightLangText.textContent = currentRightLang;
        }
        
        // 重新生成右邊選項
        updateRightLanguageOptions();
        
    } else {
        currentRightLang = language;
        elements.rightLangText.textContent = language;
    }

    // 保存語言設定
    saveLanguageSettings();
    
    // 更新 URL 參數中的執行函數
    updateFunctionURLParam();

    document.querySelectorAll('.lang-section').forEach(d => d.classList.remove('open'));
    updatePlaceholders();
    convertText();
}


function updateFunctionURLParam() {
    const key = `${currentLeftLang}-${currentRightLang}`;
    const functionName = conversionMap[key];
    
    if (functionName) {
        updateURLParam('fn', functionName.toLowerCase());
    } else {
        updateURLParam('fn', null);
    }
}


// 側邊選單功能
function toggleSidebar() {
    const isOpen = elements.sidebar.classList.contains('open');
    
    if (isOpen) {
        closeSidebar();
    } else {
        elements.sidebar.classList.add('open');
        elements.sidebarOverlay.classList.add('show');
    }
}

function closeSidebar() {
    elements.sidebar.classList.remove('open');
    elements.sidebarOverlay.classList.remove('show');
}

// 字體設定功能
function changeFontFamily() {
    const fontFamily = elements.fontFamily.value;
    const font = fontFamily === 'default' ? '' : fontFamily;
    
    elements.inputText.style.fontFamily = font;
    elements.outputText.style.fontFamily = font;
    
    // 儲存設定
    fontSettings.fontFamily = fontFamily;
    saveSetting('fontSettings', fontSettings);
}

function changeFontSize() {
    const fontSize = elements.fontSize.value + 'px';
    
    [elements.inputText, elements.outputText, elements.inputLineNumbers, elements.outputLineNumbers]
        .forEach(el => el.style.fontSize = fontSize);
    
    // 儲存設定
    fontSettings.fontSize = elements.fontSize.value;
    saveSetting('fontSettings', fontSettings);
}

function saveFontSettings() {
    fontSettings.fontFamily = elements.fontFamily.value;
    fontSettings.fontSize = elements.fontSize.value;
}

function loadAllSettings() {
    // 設定 UI 元素的值
    elements.fontFamily.value = fontSettings.fontFamily;
    elements.fontSize.value = fontSettings.fontSize;
    elements.syncScroll.checked = syncScrollEnabled;
    elements.wrapText.checked = wrapTextEnabled;
    elements.showLineNumbers.checked = showLineNumbers;
    elements.autoConvert.checked = autoConvertEnabled;
    elements.rememberInput.checked = rememberInputEnabled;

    // 應用所有設定
    changeFontFamily();
    changeFontSize();
    toggleWrapText();
    toggleLineNumbers();
    toggleSyncScroll();
    toggleAutoConvert();
    
    // 如果開啟記住輸入，載入文字
    if (rememberInputEnabled) {
        loadInputText();
    }
}

// 換行功能
function toggleWrapText() {
    wrapTextEnabled = elements.wrapText.checked;
    const whiteSpace = wrapTextEnabled ? 'pre-wrap' : 'pre';
    const wordWrap = wrapTextEnabled ? 'break-word' : 'normal';

    [elements.inputText, elements.outputText].forEach(el => {
        el.style.whiteSpace = whiteSpace;
        el.style.wordWrap = wordWrap;
    });

    updateLineNumbers('input');
    updateLineNumbers('output');
    
    // 儲存設定
    saveSetting('wrapText', wrapTextEnabled);
}


// 行號功能

function toggleLineNumbers() {
    showLineNumbers = elements.showLineNumbers.checked;
    const display = showLineNumbers ? 'block' : 'none';

    elements.inputLineNumbers.style.display = display;
    elements.outputLineNumbers.style.display = display;

    if (showLineNumbers) {
        updateLineNumbers('input');
        updateLineNumbers('output');
    } else {
        elements.inputText.style.paddingLeft = '24px';
        elements.outputText.style.paddingLeft = '24px';
    }
    
    // 儲存設定
    saveSetting('showLineNumbers', showLineNumbers);
}


function updateLineNumbers(type) {
    if (!showLineNumbers) return;

    const isInput = type === 'input';
    const textElement = isInput ? elements.inputText : elements.outputText;
    const lineNumbersElement = isInput ? elements.inputLineNumbers : elements.outputLineNumbers;

    const text = textElement.value || textElement.textContent || '';
    const lineCount = Math.max(text.split('\n').length, 1);
    const maxDigits = lineCount.toString().length;
    const newWidth = Math.max(50, maxDigits * 12 + 20);

    lineNumbersElement.style.width = newWidth + 'px';
    textElement.style.paddingLeft = (newWidth + 10) + 'px';

    lineNumbersElement.innerHTML = Array.from({ length: lineCount }, (_, i) => 
        `<div class="line-number">${i + 1}</div>`
    ).join('');
}

function syncLineNumbersScroll(type) {
    if (!showLineNumbers) return;

    const isInput = type === 'input';
    const textElement = isInput ? elements.inputText : elements.outputText;
    const lineNumbersElement = isInput ? elements.inputLineNumbers : elements.outputLineNumbers;

    lineNumbersElement.scrollTop = textElement.scrollTop;

    if (syncScrollEnabled) {
        const otherTextElement = isInput ? elements.outputText : elements.inputText;
        const otherLineNumbersElement = isInput ? elements.outputLineNumbers : elements.inputLineNumbers;
        
        const scrollPercent = textElement.scrollTop / (textElement.scrollHeight - textElement.clientHeight);
        const otherScrollTop = scrollPercent * (otherTextElement.scrollHeight - otherTextElement.clientHeight);
        otherLineNumbersElement.scrollTop = otherScrollTop;
    }
}

// 同步捲動功能
function toggleSyncScroll() {
    syncScrollEnabled = elements.syncScroll.checked;
    const method = syncScrollEnabled ? 'addEventListener' : 'removeEventListener';

    elements.inputText[method]('scroll', syncInputToOutput);
    elements.outputText[method]('scroll', syncOutputToInput);
    
    // 儲存設定
    saveSetting('syncScroll', syncScrollEnabled);
}

function syncInputToOutput() {
    if (isScrolling) return;
    isScrolling = true;

    const inputScrollPercent = elements.inputText.scrollTop / 
        (elements.inputText.scrollHeight - elements.inputText.clientHeight);
    const outputScrollTop = inputScrollPercent * 
        (elements.outputText.scrollHeight - elements.outputText.clientHeight);

    elements.outputText.scrollTop = outputScrollTop;

    if (showLineNumbers) {
        elements.inputLineNumbers.scrollTop = elements.inputText.scrollTop;
        elements.outputLineNumbers.scrollTop = elements.outputText.scrollTop;
    }

    setTimeout(() => isScrolling = false, 50);
}

function syncOutputToInput() {
    if (isScrolling) return;
    isScrolling = true;

    const outputScrollPercent = elements.outputText.scrollTop / 
        (elements.outputText.scrollHeight - elements.outputText.clientHeight);
    const inputScrollTop = outputScrollPercent * 
        (elements.inputText.scrollHeight - elements.inputText.clientHeight);

    elements.inputText.scrollTop = inputScrollTop;

    if (showLineNumbers) {
        elements.inputLineNumbers.scrollTop = elements.inputText.scrollTop;
        elements.outputLineNumbers.scrollTop = elements.outputText.scrollTop;
    }

    setTimeout(() => isScrolling = false, 50);
}

// 初始化語言選項

function initializeLanguage() {
    // 檢查 URL 參數
    const urlLang = getURLParam('lang');
    const urlParam = getURLParam('type');
    const urlFunction = getURLParam('fn');
    let isValidLanguage = false;
    
    // 根據 URL 參數設定語言
    if (urlParam) {
        for (const [key, config] of Object.entries(languageConfigs)) {
            if (config.param.toLowerCase() === urlParam.toLowerCase()) { // 不區分大小寫比較
                currentLanguage = key;
                isValidLanguage = true;
                break;
            }
        }
    } else if (urlLang && languageConfigs[urlLang]) {
        currentLanguage = urlLang;
        isValidLanguage = true;
    } else {
        // 嘗試從儲存中載入
        try {
            const savedLang = localStorage.getItem(getStorageKey('currentLanguage'));
            if (savedLang && languageConfigs[savedLang]) {
                currentLanguage = savedLang;
                isValidLanguage = true;
            }
        } catch (error) {
            console.log('Unable to load language setting:', error);
        }
    }
    
    // 如果語言參數錯誤，跳到無參數首頁
    if (!isValidLanguage && (urlParam || urlLang)) {
        // 清除所有 URL 參數，跳到首頁
        window.location.href = window.location.pathname;
        return;
    }
    
    // 設定當前語言配置
    currentLanguageConfig = languageConfigs[currentLanguage].config;
    
    // 如果 URL 中有函數參數，嘗試恢復對應的語言組合
    if (urlFunction) {
        const functionFound = initializeLanguageFromFunction(urlFunction);
        // 如果函數參數錯誤，initializeLanguageFromFunction 已經處理了跳轉
    }
    
    // 更新 UI
    if (elements.languageSelect) {
        elements.languageSelect.value = currentLanguage;
    }
    
    // 更新 URL - 參數值改為小寫
    updateURLParam('type', languageConfigs[currentLanguage].param.toLowerCase());
    updateFunctionURLParam();
}


// 根據 URL 函數參數初始化語言組合

function initializeLanguageFromFunction(functionName) {
    // 解析當前語言配置
    const config = parseLanguageConfig();
    
    // 尋找對應的語言組合 - 不區分大小寫比較
    for (const [key, func] of Object.entries(config.conversionMap)) {
        if (func.toLowerCase() === functionName.toLowerCase()) {
            const [leftLang, rightLang] = key.split('-');
            currentLeftLang = leftLang;
            currentRightLang = rightLang;
            
            // 清除已保存的語言設定，使用 URL 參數優先
            try {
                localStorage.removeItem(getStorageKey('leftLang'));
                localStorage.removeItem(getStorageKey('rightLang'));
            } catch (error) {
                console.log('Unable to clear language settings:', error);
            }
            return true; // 成功找到對應函數
        }
    }
    
    // 如果找不到對應函數，使用該語言的第一個函數
    const firstKey = Object.keys(config.conversionMap)[0];
    if (firstKey) {
        const [leftLang, rightLang] = firstKey.split('-');
        currentLeftLang = leftLang;
        currentRightLang = rightLang;
        
        // 更新 URL 參數為正確的函數 - 使用小寫
        const correctFunction = config.conversionMap[firstKey];
        updateURLParam('fn', correctFunction.toLowerCase());
        
        console.log(`Function ${functionName} not found, using default: ${correctFunction}`);
        return false; // 表示使用了預設函數
    }
    
    return false;
}


// 更新選項狀態
function updateOptions() {
    const rightOptions = elements.rightLangOptions.querySelectorAll('.lang-option');
    const availableForRight = getAvailableOptions(currentLeftLang);

    // 只對右邊選單的選項進行可用性判斷
    rightOptions.forEach(option => {
        const lang = option.textContent;
        const isAvailable = availableForRight.includes(lang);
        option.classList.toggle('disabled', !isAvailable);
        
        // 如果選項不可用，移除點擊事件
        if (!isAvailable) {
            option.onclick = null;
        } else {
            option.onclick = () => selectLanguage('right', lang);
        }
    });
}

// 切換下拉選單
function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    const isOpen = dropdown.classList.contains('open');

    document.querySelectorAll('.lang-section').forEach(d => d.classList.remove('open'));

    if (!isOpen) {
        dropdown.classList.add('open');
        updateOptions();
    }
}

// 轉換文字
function convertText() {
    const inputText = elements.inputText.value;

    if (!inputText.trim()) {
        const key = `${currentLeftLang}-${currentRightLang}`;
        const examples = exampleMap[key];
        
        elements.outputText.textContent = examples ? examples.right : '翻譯';
        elements.outputText.classList.add('empty');
        elements.copyBtn.disabled = true;
        updateLineNumbers('output');
        return;
    }

    const key = `${currentLeftLang}-${currentRightLang}`;
    const functionName = conversionMap[key];

    try {
        const result = typeof window[functionName] === 'function' 
            ? window[functionName](inputText)
            : `使用 ${functionName} 轉換: ${inputText}`;

        elements.outputText.textContent = result;
        elements.outputText.classList.remove('empty');
        elements.copyBtn.disabled = false;
        updateLineNumbers('output');
    } catch (error) {
        updateLineNumbers('output');
    }
    
    if (isEditing) {
        return;
    }
}

// 清除輸入
function clearInput() {
    elements.inputText.value = '';
    const key = `${currentLeftLang}-${currentRightLang}`;
    const examples = exampleMap[key];

    elements.outputText.textContent = examples ? examples.right : '翻譯';
    elements.outputText.classList.add('empty');
    elements.copyBtn.disabled = true;
    updateLineNumbers('output');
}

// 複製輸出
async function copyOutput() {
    const outputText = elements.outputText.textContent;
    if (outputText === '翻譯' || !outputText.trim()) return;

    try {
        await navigator.clipboard.writeText(outputText);
        
        const icon = elements.copyBtn.querySelector('i');
        icon.className = 'fas fa-check';
        elements.copyBtn.classList.add('success');
        
        setTimeout(() => {
            icon.className = 'fas fa-copy';
            elements.copyBtn.classList.remove('success');
        }, 1500);
    } catch (err) {}
}

// 切換編輯模式
function toggleEdit() {
    const editBtn = document.getElementById('editBtn');
    const editIcon = editBtn.querySelector('i');
    
    isEditing = !isEditing;
    
    if (isEditing) {
        elements.outputText.contentEditable = true;
        elements.outputText.focus();
        editBtn.classList.add('editing');
        editIcon.className = 'fas fa-check';
        editBtn.title = '完成編輯';
        
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(elements.outputText);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        
    } else {
        elements.outputText.contentEditable = false;
        editBtn.classList.remove('editing');
        editIcon.className = 'fas fa-pencil';
        editBtn.title = '編輯';
        
        updateLineNumbers('output');
        
        const hasContent = elements.outputText.textContent.trim() && 
                          elements.outputText.textContent !== '翻譯';
        elements.copyBtn.disabled = !hasContent;
        
        if (hasContent) {
            elements.outputText.classList.remove('empty');
        }
    }
}

// 自動轉換功能
function toggleAutoConvert() {
    autoConvertEnabled = elements.autoConvert.checked;
    elements.convertBtn.style.display = autoConvertEnabled ? 'none' : 'inline-block';
    
    if (autoConvertEnabled) {
        convertText();
    }
    
    // 儲存設定
    saveSetting('autoConvert', autoConvertEnabled);
}


// 記住輸入功能
function toggleRememberInput() {
    rememberInputEnabled = elements.rememberInput.checked;
    
    if (rememberInputEnabled) {
        // 開啟時載入已存的文字
        loadInputText();
    } else {
        // 關閉時清除存儲的文字
        try {
            localStorage.removeItem(getStorageKey('inputText'));
        } catch (error) {
            console.log('Unable to remove saved input text:', error);
        }
    }
    
    // 儲存設定
    saveSetting('rememberInput', rememberInputEnabled);
}

function saveInputText() {
    if (!rememberInputEnabled) return;
    
    try {
        const inputValue = elements.inputText.value;
        localStorage.setItem(getStorageKey('inputText'), inputValue);
    } catch (error) {
        console.log('Unable to save input text:', error);
    }
}


function loadInputText() {
    if (!rememberInputEnabled) return;
    
    try {
        const savedInput = localStorage.getItem(getStorageKey('inputText'));
        if (savedInput) {
            elements.inputText.value = savedInput;
            convertText(); // 載入後自動轉換
        }
    } catch (error) {
        console.log('Unable to load input text:', error);
    }
}

//
function handleInput() {
    if (autoConvertEnabled) {
        convertText();
    }
    // 如果開啟記住輸入，則儲存文字
    saveInputText();
}




// 點擊外部關閉下拉選單
document.addEventListener('click', function(event) {
    if (!event.target.closest('.lang-section')) {
        document.querySelectorAll('.lang-section').forEach(d => d.classList.remove('open'));
    }
});



// URL 參數處理函數
function getURLParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function updateURLParam(param, value) {
    const url = new URL(window.location);
    if (value) {
        url.searchParams.set(param, value);
    } else {
        url.searchParams.delete(param);
    }
    window.history.replaceState({}, '', url);
}

// 初始化語言設定

function initializeLanguage() {
    // 檢查 URL 參數
    const urlLang = getURLParam('lang');
    const urlParam = getURLParam('type');
    const urlFunction = getURLParam('fn');
    let isValidLanguage = false;
    
    // 根據 URL 參數設定語言
    if (urlParam) {
        for (const [key, config] of Object.entries(languageConfigs)) {
            if (config.param === urlParam) {
                currentLanguage = key;
                isValidLanguage = true;
                break;
            }
        }
    } else if (urlLang && languageConfigs[urlLang]) {
        currentLanguage = urlLang;
        isValidLanguage = true;
    } else {
        // 嘗試從儲存中載入
        try {
            const savedLang = localStorage.getItem(getStorageKey('currentLanguage'));
            if (savedLang && languageConfigs[savedLang]) {
                currentLanguage = savedLang;
                isValidLanguage = true;
            }
        } catch (error) {
            console.log('Unable to load language setting:', error);
        }
    }
    
    // 如果語言參數錯誤，跳到無參數首頁
    if (!isValidLanguage && (urlParam || urlLang)) {
        // 清除所有 URL 參數，跳到首頁
        window.location.href = window.location.pathname;
        return;
    }
    
    // 設定當前語言配置
    currentLanguageConfig = languageConfigs[currentLanguage].config;
    
    // 如果 URL 中有函數參數，嘗試恢復對應的語言組合
    if (urlFunction) {
        const functionFound = initializeLanguageFromFunction(urlFunction);
        // 如果函數參數錯誤，initializeLanguageFromFunction 已經處理了跳轉
    }
    
    // 更新 UI
    if (elements.languageSelect) {
        elements.languageSelect.value = currentLanguage;
    }
    
    // 更新 URL
    updateURLParam('type', languageConfigs[currentLanguage].param);
    updateFunctionURLParam();
}

// 更改語言函數
function changeLanguage() {
    const selectedLanguage = elements.languageSelect.value;
    
    if (selectedLanguage === currentLanguage) return;
    
    currentLanguage = selectedLanguage;
    currentLanguageConfig = languageConfigs[currentLanguage].config;
    
    // 儲存語言設定
    try {
        localStorage.setItem(getStorageKey('currentLanguage'), currentLanguage);
    } catch (error) {
        console.log('Unable to save language setting:', error);
    }
    
    // 更新 URL - 參數值改為小寫
    updateURLParam('type', languageConfigs[currentLanguage].param.toLowerCase());
    
    // 重新解析語言配置
    const newConfig = parseLanguageConfig();
    Object.assign(window, newConfig); // 更新全域變數
    
    // **新增：重置為該語言的預設第一個選項**
    if (newConfig.leftLanguages.length > 0 && newConfig.rightLanguages.length > 0) {
        // 取得第一個可用的語言組合
        const firstLeftLang = newConfig.leftLanguages[0];
        const availableRightForFirst = getAvailableOptions(firstLeftLang);
        
        if (availableRightForFirst.length > 0) {
            currentLeftLang = firstLeftLang;
            currentRightLang = availableRightForFirst[0];
            
            // 更新 UI 顯示
            elements.leftLangText.textContent = currentLeftLang;
            elements.rightLangText.textContent = currentRightLang;
            
            // 保存新的語言設定
            saveLanguageSettings();
        }
    }
    
    // 重新初始化語言選項
    initializeLanguageOptions();
    updateOptions();
    updatePlaceholders();
    
    // 更新函數參數
    updateFunctionURLParam();
    
    // 如果有輸入內容，重新轉換
    if (elements.inputText.value.trim()) {
        convertText();
    }
}

// 初始化語言選項

function initializeLanguageOptions() {
    // 重新解析當前語言配置
    const config = parseLanguageConfig();
    Object.assign(window, config); // 更新全域變數
    
    // 清空現有選項
    elements.leftLangOptions.innerHTML = '';
    elements.rightLangOptions.innerHTML = '';
    
    // 建立左側語言選項 - 只顯示左邊選單的項目
    config.leftLanguages.forEach(lang => {
        const option = document.createElement('li');
        option.className = 'lang-option';
        option.textContent = lang;
        option.onclick = () => selectLanguage('left', lang);
        elements.leftLangOptions.appendChild(option);
    });
    
    // 建立右側語言選項 - 根據當前左邊語言動態生成
    updateRightLanguageOptions();
}


// 更新右邊語言選項
function updateRightLanguageOptions() {
    // 清空右邊選項
    elements.rightLangOptions.innerHTML = '';
    
    // 取得當前左邊語言可對應的右邊選項
    const availableRightLangs = getAvailableOptions(currentLeftLang);
    
    // 建立右側語言選項 - 只顯示可對應的選項
    availableRightLangs.forEach(lang => {
        const option = document.createElement('li');
        option.className = 'lang-option';
        option.textContent = lang;
        option.onclick = () => selectLanguage('right', lang);
        elements.rightLangOptions.appendChild(option);
    });
}


// 初始化
function init() {
    initElements();
    
    // 先初始化語言配置
    initializeLanguage();
    
    // 解析語言配置，更新全域變數
    parseLanguageConfig();
    
    // 初始化語言選項
    initializeLanguageOptions();
    
    // 載入設定
    loadAllSettings();
    
    // 如果沒有從 URL 函數參數載入語言設定，則使用記憶的語言設定
    const urlFunction = getURLParam('fn');
    if (!urlFunction) {
        const savedLangs = loadLanguageSettings();
        currentLeftLang = savedLangs.left;
        currentRightLang = savedLangs.right;
    }

    elements.leftLangText.textContent = currentLeftLang;
    elements.rightLangText.textContent = currentRightLang;
    
    updateOptions();
    updatePlaceholders();
    
    // 確保 URL 參數正確
    updateFunctionURLParam();
    
    if (rememberInputEnabled) {
        loadInputText();
    }
}
// 當 DOM 載入完成後執行初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}