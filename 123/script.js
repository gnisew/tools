// DOM 元素快取
const elements = {};

// 初始化 DOM 元素快取
function initElements() {
    const ids = [
        'sidebar', 'sidebarOverlay', 'inputText', 'outputText', 'copyBtn', 'editBtn',
        'fontFamily', 'fontSize', 'syncScroll', 'wrapText', 'showLineNumbers', 
        'autoConvert', 'convertBtn', 'leftLangText', 'rightLangText',
        'leftLangOptions', 'rightLangOptions', 'inputLineNumbers', 'outputLineNumbers','rememberInput', 'logoText', 'translateText'
    ];
    
    ids.forEach(id => {
        elements[id] = document.getElementById(id);
    });
}

// 解析語言配置
function parseLanguageConfig() {
    const lines = myLang.trim().split(/\n|#/).slice(1);
    const conversionMap = {};
    const exampleMap = {};
    const allLanguages = new Set();

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

            allLanguages.add(left);
            allLanguages.add(right);
        }
    });

    return { conversionMap, exampleMap, languages: Array.from(allLanguages) };
}

const { conversionMap, exampleMap, languages } = parseLanguageConfig();

// 初始化語言設定
const firstLine = myLang.trim().split('\n')[1];
const [defaultLeftLang, defaultRightLang] = firstLine.split('\t').map(s => s.trim());

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

function loadLanguageSettings() {
    try {
        const savedLeftLang = localStorage.getItem(getStorageKey('leftLang'));
        const savedRightLang = localStorage.getItem(getStorageKey('rightLang'));
        
        // 檢查保存的語言是否仍然有效
        if (savedLeftLang && languages.includes(savedLeftLang)) {
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
let debounceTimer = null;
const DEBOUNCE_THRESHOLD = 100;


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

// 選擇語言 - 修改此函數以保存設定
function selectLanguage(side, language) {
    if (side === 'left') {
        currentLeftLang = language;
        elements.leftLangText.textContent = language;

        const availableForRight = getAvailableOptions(language);
        if (!availableForRight.includes(currentRightLang)) {
            currentRightLang = availableForRight[0] || languages.find(l => l !== language);
            elements.rightLangText.textContent = currentRightLang;
        }
    } else {
        currentRightLang = language;
        elements.rightLangText.textContent = language;
    }

    // 保存語言設定
    saveLanguageSettings();

    document.querySelectorAll('.lang-section').forEach(d => d.classList.remove('open'));
    updatePlaceholders();
    convertText();
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
function initializeLanguageOptions() {
    const leftLanguages = [...new Set(Object.keys(conversionMap).map(key => key.split('-')[0]))];
    const rightLanguages = [...new Set(Object.keys(conversionMap).map(key => key.split('-')[1]))];

    function createOptions(container, languages, side) {
        container.innerHTML = '';
        languages.forEach(lang => {
            const option = document.createElement('div');
            option.className = 'lang-option';
            option.textContent = lang;
            option.onclick = () => selectLanguage(side, lang);
            container.appendChild(option);
        });
    }

    createOptions(elements.leftLangOptions, leftLanguages, 'left');
    createOptions(elements.rightLangOptions, rightLanguages, 'right');
}

// 更新選項狀態
function updateOptions() {
    const rightOptions = elements.rightLangOptions.querySelectorAll('.lang-option');
    const availableForRight = getAvailableOptions(currentLeftLang);

    rightOptions.forEach(option => {
        const lang = option.textContent;
        option.classList.toggle('disabled', !availableForRight.includes(lang));
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

function handleInput() {
    const inputLength = elements.inputText.value.length;
    
    // 清除之前的計時器
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    
    // 如果字元數超過門檻值，使用防抖；否則立即執行
    if (inputLength > DEBOUNCE_THRESHOLD) {
        // 大量字元時使用防抖
        debounceTimer = setTimeout(() => {
            if (autoConvertEnabled) {
                convertText();
            }
            saveInputText();
        }, 300); // 300毫秒延遲
    } else {
        // 字元數少時立即執行
        if (autoConvertEnabled) {
            convertText();
        }
        saveInputText();
    }
}


// 點擊外部關閉下拉選單
document.addEventListener('click', function(event) {
    if (!event.target.closest('.lang-section')) {
        document.querySelectorAll('.lang-section').forEach(d => d.classList.remove('open'));
    }
});

// 初始化
// 初始化
function init() {
    initElements();
    initializeLanguageOptions();
    updateOptions();
    loadAllSettings();
    updatePlaceholders();

    elements.leftLangText.textContent = currentLeftLang;
    elements.rightLangText.textContent = currentRightLang;
    
    // 確保行號功能正確初始化
    if (showLineNumbers) {
        setTimeout(() => {
            updateLineNumbers('input');
            updateLineNumbers('output');
        }, 0);
    }
    
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