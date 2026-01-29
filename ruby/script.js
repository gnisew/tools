// ==================================================================
//  START: 語言設定
// ==================================================================
const LANGUAGES = {
  'kasu': { name: '詔安', file: 'hanzitopinyin-kasu.js', url: 'https://sites.google.com/view/oikasu/' },
  'sixian': { name: '四縣', file: 'hanzitopinyin-sixian.js', url: 'https://sites.google.com/view/oikasu/hoka' },
  'hailu': { name: '海陸', file: 'hanzitopinyin-hailu.js', url: 'https://sites.google.com/view/oikasu/hoka' },
  'dapu': { name: '大埔', file: 'hanzitopinyin-dapu.js', url: 'https://sites.google.com/view/oikasu/hoka' },
  'raoping': { name: '饒平', file: 'hanzitopinyin-raoping.js', url: 'https://sites.google.com/view/oikasu/hoka' },
  'sixiannan': { name: '南四', file: 'hanzitopinyin-sixiannan.js', url: 'https://sites.google.com/view/oikasu/hoka' },
  'holo': { name: '和樂', file: 'hanzitopinyin-holo.js', url: 'https://sites.google.com/view/oikasu/holo' },
  'jinmen': { name: '金門', file: 'hanzitopinyin-jinmen.js', url: 'https://sites.google.com/view/oikasu/holo' },
  'cangjie': { name: '倉頡', file: 'hanzitopinyin-cangjie.js', url: 'https://sites.google.com/view/oikasu/' },
};
// ==================================================================
//  END: 語言設定
// ==================================================================

// ==================================================================
//  START: 應用程式設定與 Local Storage
// ==================================================================
const AppConfig = {
    STORAGE_PREFIX: 'OIKASU_HAKKA_ANNOTATOR_V2_',
    storageKeys: {
        TONE_CONVERSION_DEFAULT: 'toneConversionDefault',
        SELECTED_LANGUAGE: 'selectedLanguage',
		INPUT_MODE: 'inputMode'
    }
};

/**
 * 將設定儲存到 Local Storage (會自動加上前綴)
 * @param {string} key - AppConfig.storageKeys 中的鍵名
 * @param {any} value - 要儲存的值
 */
function saveSetting(key, value) {
    try {
        const fullKey = AppConfig.STORAGE_PREFIX + key;
        localStorage.setItem(fullKey, JSON.stringify(value));
    } catch (error) {
        console.error("無法儲存設定到 Local Storage:", error);
    }
}

/**
 * 從 Local Storage 讀取設定 (會自動加上前綴)
 * @param {string} key - AppConfig.storageKeys 中的鍵名
 * @param {any} defaultValue - 如果找不到設定時的預設值
 * @returns {any} 儲存的值或預設值
 */
function loadSetting(key, defaultValue) {
    try {
        const fullKey = AppConfig.STORAGE_PREFIX + key;
        const value = localStorage.getItem(fullKey);
        return value !== null ? JSON.parse(value) : defaultValue;
    } catch (error) {
        console.error("無法從 Local Storage 讀取設定:", error);
        return defaultValue;
    }
}
// ==================================================================
//  END: 應用程式設定與 Local Storage
// ==================================================================


// 符號集合
    const PUNCTS = new Set(['，', '。', '、', '；', '：', '！', '？', '（', '）', '「', '」', '『', '』', '《', '》', '〈', '〉', '—', '…', '－', '‧', '·', '﹑', ',', '.', ';', ':', '!', '?', '(', ')', '[', ']', '{', '}', '"', "'", '-', '…']);
    
    const ENDERS = new Set(['。', '！', '？', '?', '!', '．', '.']);

    const WHITESPACES = new Set([' ', '\\t', '\\u3000']);

// DOM 快捷
const $ = (sel) => document.querySelector(sel);
const hanziInput = $('#hanziInput');

const btnModeHanziToPinyin = $('#btnModeHanziToPinyin');
const btnModePinyinToHanzi = $('#btnModePinyinToHanzi');
const textareasContainer = $('#textareasContainer');
const btnHanziToPinyin = $('#btnHanziToPinyin');
const btnPinyinToHanzi = $('#btnPinyinToHanzi');
const btnCopy = $('#btnCopy');

const pinyinInput = $('#pinyinInput');
const btnProcess = $('#btnProcess');
const btnClear = $('#btnClear');
const btnSample = $('#btnSample');
const resultArea = $('#resultArea');
const btnPlayAudio = document.getElementById('btnPlayAudio');
const phoneticsContainer = $('#phoneticsContainer');
const btnPhonetics = $('#btnPhonetics');
const phoneticsMenu = $('#phoneticsMenu');

const btnConvertLetterTone = $('#btnConvertLetterTone');
const btnConvertNumberTone = $('#btnConvertNumberTone');
const btnFontFamily = $('#btnFontFamily');
const fontFamilyPopover = $('#fontFamilyPopover');

const btnLanguage = $('#btnLanguage');
const currentLanguageName = $('#currentLanguageName');
const languageMenu = $('#languageMenu');
const mainTitle = $('#mainTitle');
const btnHanziToPinyinContainer = $('#btnHanziToPinyinContainer');

// 模式切換
const btnModeView = document.getElementById('btnModeView');
const btnModeEdit = document.getElementById('btnModeEdit');
const btnModeChar = document.getElementById('btnModeChar');
const btnModeWord = document.getElementById('btnModeWord');
const charWordToggleContainer = document.getElementById('charWordToggleContainer');

// 問題導覽
const issueBar = document.getElementById('issueBar');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const issueIndexText = document.getElementById('issueIndex');

// 複製/下載主按鈕
const btnPrimary = document.getElementById('btnPrimary');
const btnPrimaryToggle = document.getElementById('btnPrimaryToggle');
const btnPrimaryContainer = document.getElementById('btnPrimaryContainer');
const menuMore = document.getElementById('menuMore');
const actCopy = document.getElementById('actCopy');
const actDownload = document.getElementById('actDownload');

// 字級
const btnTypography = document.getElementById('btnTypography');
const typoPopover = document.getElementById('typoPopover');
const btnResetFont = document.getElementById('btnResetFont');
const fontVal = document.getElementById('fontVal');
const fontShow = document.getElementById('fontShow');
const rtShow = document.getElementById('rtShow');



// ==================================================================
//  START: 拼音轉漢字所需變數與輔助函數
// ==================================================================
let PROCESSED_IME_DICTS = {};

/**
 * 將 ime-dict.js 的資料轉換為更高效的 Map 結構以便查詢。
 * 此函數應在程式初始化時執行一次。
 */
function initializeImeDicts() {
    // 'dictionaries' 物件來自外部載入的 ime-dict.js
    if (typeof dictionaries === 'undefined') {
        console.error("ime-dict.js 尚未載入或不存在。");
        return;
    }
    for (const lang in dictionaries) {
        const dict = dictionaries[lang];
        const map = new Map();
        for (const pinyin in dict) {
            // 字典中的漢字選項以空白分隔，依據需求，我們只取第一個最常用的
            const hanziOptions = dict[pinyin].split(' ');
            map.set(pinyin, hanziOptions[0]);
        }
        PROCESSED_IME_DICTS[lang] = map;
    }
}

/**
 * 將拼音字串斷詞，同時保留標點符號，並將以連字號(-)連接的音節視為一個單位。
 * @param {string} raw - 原始拼音字串
 * @returns {string[]} 斷詞後的 token 陣列
 */
function tokenizePinyinWithHyphens(raw) {
    const tokens = [];
    let currentToken = '';
    
    for (const ch of toCharArray(raw || '')) {
        // 分隔符號是空白或標點符號（但連字號'-'除外）
        const isDelimiter = isWhitespace(ch) || (isPunct(ch) && ch !== '-');
        
        if (isDelimiter) {
            // 遇到分隔符號時，先將當前累積的 token 推入陣列
            if (currentToken.length > 0) {
                tokens.push(currentToken);
                currentToken = '';
            }
            // 然後將分隔符號本身也推入陣列
            tokens.push(ch);
        } else {
            // 若非分隔符號，則累加到當前的 token
            currentToken += ch;
        }
    }
    
    // 迴圈結束後，若還有剩餘的 token，則推入陣列
    if (currentToken.length > 0) {
        tokens.push(currentToken);
    }
    
    return tokens;
}
// ==================================================================
//  END: 拼音轉漢字所需變數與輔助函數
// ==================================================================


// 狀態
let CC_SEG = {
    hSegs: [],
    pSegRaws: [],
    map: []
};
let inputMode = 'hanzi-to-pinyin'; // 'hanzi-to-pinyin' | 'pinyin-to-hanzi'
let PROBLEMS = [];
let problemIdx = -1;
let mode = 'view'; // 'view' | 'edit'
let annotationMode = 'char'; // 'char' | 'word'
let isAudioMode = false;
let phoneticDisplayMode = 'pinyin'; // 'pinyin' | 'zhuyin'
let currentFont = 'hei'; // 'hei' | 'kai'
const DEFAULT_FONT = 18;
const DEFAULT_RT = 0.68;
let fontSize = DEFAULT_FONT;
let rtScale = DEFAULT_RT;

let defaultToneConversionType = loadSetting(AppConfig.storageKeys.TONE_CONVERSION_DEFAULT, 'letter');
let currentLanguageKey = loadSetting(AppConfig.storageKeys.SELECTED_LANGUAGE, 'kasu'); // 預設為詔安 'kasu'

// 工具
const toCharArray = (str) => Array.from(str || '');
const isPunct = (ch) => PUNCTS.has(ch);
const isWhitespace = (ch) => WHITESPACES.has(ch);
const isLineBreak = (ch) => ch === '\r' || ch === '\n';



const actBracket = $('#actHanziPinyinBracket');

actBracket?.addEventListener('click', () => {
    hanziToPinyin('bracket'); 
    menuHanzi.classList.add('hidden');
});

// 切分：漢字（依句末/逗號/換行）
function segmentHanziByClauses(str) {
    const segs = [];
    let buf = '';
    for (const ch of toCharArray(str || '')) {
        if (isLineBreak(ch)) {
            if (buf) {
                segs.push({
                    type: 'seg',
                    text: buf
                });
                buf = '';
            }
            segs.push({
                type: 'br'
            });
            continue;
        }
        buf += ch;
        if (isPunct(ch) && ENDERS.has(ch)) {
            segs.push({
                type: 'seg',
                text: buf
            });
            buf = '';
        }
    }
    if (buf) segs.push({
        type: 'seg',
        text: buf
    });
    return segs;
}

// 切分：拼音 RAW（依句末/逗號/換行，保留原標點與空白）
function segmentPinyinRawByClauses(str) {
    const segs = [];
    let buf = '';
    for (const ch of toCharArray(str || '')) {
        if (isLineBreak(ch)) {
            if (buf.length) {
                segs.push({
                    type: 'seg',
                    text: buf.trim()
                });
                buf = '';
            }
            segs.push({
                type: 'br'
            });
            continue;
        }
        buf += ch;
        if (isPunct(ch) && ENDERS.has(ch)) {
            segs.push({
                type: 'seg',
                text: buf.trim()
            });
            buf = '';
        }
    }
    if (buf.length) segs.push({
        type: 'seg',
        text: buf.trim()
    });
    return segs;
}

// 斷詞：拼音音節（不含標點/換行）
function tokenizeSyls(raw) {
    const syls = [];
    let token = '';
    for (const ch of toCharArray(raw || '')) {
        // 【核心修正】在判斷是否為標點時，排除連字號 '-' 和兩種中間點 '·', '‧'
        if (isLineBreak(ch) || isWhitespace(ch) || (isPunct(ch) && ch !== '-' && ch !== '·' && ch !== '‧')) {
            if (token.trim()) {
                syls.push(token.trim());
                token = '';
            }
            continue;
        }
        token += ch;
    }
    if (token.trim()) syls.push(token.trim());
    return syls;
}

/**
 * 切分漢字字串，將連續的非漢字、非空白字元視為一個詞
 * e.g., "臺灣#1客語AI" -> ["臺", "灣", "#1", "客", "語", "AI"]
 * @param {string} text - 原始漢字字串
 * @returns {string[]} 包含漢字、英數字詞、標點的陣列
 */
function tokenizeHanziWithAlphanum(text) {
    if (!text) return [];
    
    // 修正寫法：加入 \p{P}，排除標點符號被黏合
    // 意思為：抓取連續的「非空白、非漢字、且"非標點"」字串，否則抓取單一字元
	// 必須加上 u 旗標 (Unicode) 才能讓 \p{Script=Han} 生效
    const regex = /([^\s\p{Script=Han}\p{P}]+|.)/gu;
    
    return text.match(regex) || [];
}
/**
 * 帶分隔符號的拼音斷詞：將字串切分為音節和分隔符號的陣列
 * e.g., "kon giˇ, maˇ voi." -> ["kon", " ", "giˇ", ", ", "maˇ", " ", "voi", "."]
 * @param {string} raw - 原始拼音字串
 * @returns {string[]} 包含音節和分隔符號的陣列
 */
function tokenizePinyinWithDelimiters(raw) {
    if (!raw) return [];
    // 分割規則：在 (音節字元) 和 (非音節字元) 的邊界切開
    const tokens = raw.match(/([a-zA-Z0-9\u0300-\u036f]+|[^a-zA-Z0-9\u0300-\u036f]+)/g);
    return tokens || [];
}

/**
 * 判斷一個 token 是否為音節 (而不是純粹的空格或標點)
 * @param {string} token
 * @returns {boolean}
 */
function isSyllableToken(token) {
    // 規則：只要包含任何一個字母或數字，就視為音節
    return /[a-zA-Z0-9]/.test(token);
}



// 主渲染邏輯：依據模式生成不同結構

function alignByClauses({
    hanzi,
    pinyin,
    showWarnings = false,
    allowEdit = false,
    mode = 'view',
    annotationMode = 'char',
    phoneticDisplayMode = 'pinyin'
}) {
    const container = document.createElement('div');
    container.className = 'line-wrap';

    // --- 取得拼音/注音/雙顯 顯示文字的輔助函式 ---
    const getDisplayText = (py) => {
        // 針對 詔安 (kasu) 語言的特殊處理
        if (currentLanguageKey === 'kasu') {
            if (phoneticDisplayMode === 'zhuyin' && typeof kasuPinyinToBpmSmall === 'function') {
                return kasuPinyinToBpmSmall(py);
            }
            // 【修改】顯示拼音 OR 拼音+注音 OR 直注音 (三者 RT 都生成拼音)
            if ((phoneticDisplayMode === 'pinyin' || phoneticDisplayMode === 'pinyin-zhuyin' || phoneticDisplayMode === 'vertical-zhuyin') && typeof kasuBpmSmallToPinyin === 'function') {
                return kasuBpmSmallToPinyin(py);
            }
        } else if (currentLanguageKey === 'matsu') { 
            if (phoneticDisplayMode === 'zhuyin' && py) {
                return matsuPinyinToBpm(py);
            }
            // 【修改】包含 vertical-zhuyin
            if ((phoneticDisplayMode === 'pinyin' || phoneticDisplayMode === 'pinyin-zhuyin' || phoneticDisplayMode === 'vertical-zhuyin') && py) {
                return matsuBpmToPinyin(py);
            }
        }

        // 其他語言
        if (phoneticDisplayMode === 'zhuyin' && py) {
            return convertPinyinToZhuyin(py);
        }
        
        return py;
    };

    // --- 取得 RB 內容 ---
    const getRbText = (hToken, pToken) => {
        // 【修改】如果是「拼音+注音」或「直注音」模式，都在漢字旁附加微型注音
        if ((phoneticDisplayMode === 'pinyin-zhuyin' || phoneticDisplayMode === 'vertical-zhuyin') && typeof kasuPinyinBpmTiny === 'function') {
			if (currentLanguageKey === 'kasu') {
				const tiny = kasuPinyinBpmTiny(pToken) || '';
				return `${hToken}${tiny}`;
			} else {
				const tiny = hakkaPinyinBpmTiny(pToken) || '';
				return `${hToken}${tiny}`;			
			}
        }
        return hToken;
    };

    // ... (保留原函數 processClause 及後續所有代碼) ...
    // (為節省篇幅，請直接保留原函數下方其餘程式碼)
    
    const processClause = (hTokens, pSegSyls) => {
        const fragment = document.createDocumentFragment();
        let h_idx = 0;
        let p_idx = 0;

        while (h_idx < hTokens.length) {
            const hToken = hTokens[h_idx];

            if (hToken.length === 1 && (isWhitespace(hToken) || isPunct(hToken))) {
                const span = document.createElement('span');
                span.className = 'glyph punct';
                span.textContent = hToken;
                fragment.appendChild(span);
                h_idx++;
                continue;
            }

            if (p_idx >= pSegSyls.length) {
                const ruby = document.createElement('ruby');
                ruby.className = 'glyph missing';
                ruby.innerHTML = `<rt></rt><rb>${hToken}</rb>`;
                fragment.appendChild(ruby);
                h_idx++;
                continue;
            }

            const pToken = pSegSyls[p_idx];
            const pSubSyls = pToken.split(/--?|=/); 

            if (pSubSyls.length > 1) {
                const wordLen = pSubSyls.length;
                const hWordTokens = hTokens.slice(h_idx, h_idx + wordLen);
                const hWord = hWordTokens.join('');

                if (hWordTokens.length === wordLen) {
                    if (annotationMode === 'word') {
                        const ruby = document.createElement('ruby');
                        ruby.className = 'glyph glyph-word';
                        ruby.dataset.hanzi = hWord;
                        ruby.dataset.pinyin = pToken;
                        
                        let rbContent = hWord;
                        if ((phoneticDisplayMode === 'pinyin-zhuyin' || phoneticDisplayMode === 'vertical-zhuyin') && typeof kasuPinyinBpmTiny === 'function') {
                            rbContent = '';
                            for(let k=0; k<wordLen; k++) {
                                rbContent += hWordTokens[k] + kasuPinyinBpmTiny(pSubSyls[k]);
                            }
                        }

                        ruby.innerHTML = `<rt>${getDisplayText(pToken)}</rt><rb>${rbContent}</rb>`;
                        fragment.appendChild(ruby);
                    } 
                    else {
                         for (let i = 0; i < wordLen; i++) {
                            const ruby = document.createElement('ruby');
                            ruby.className = 'glyph';
                            ruby.dataset.hanzi = hTokens[h_idx + i];
                            ruby.dataset.pinyin = pSubSyls[i];
                            const rbContent = getRbText(hTokens[h_idx + i], pSubSyls[i]);
                            ruby.innerHTML = `<rt>${getDisplayText(pSubSyls[i])}</rt><rb>${rbContent}</rb>`;
                            fragment.appendChild(ruby);
                        }
                    }
                    h_idx += wordLen;
                    p_idx++;
                } else { 
                    const ruby = document.createElement('ruby');
                    ruby.className = 'glyph missing';
                    ruby.innerHTML = `<rt>${getDisplayText(pToken)}</rt><rb>${hToken}</rb>`;
                    fragment.appendChild(ruby);
                    h_idx++;
                    p_idx++;
                }
            } 
            else {
                if (hToken === pToken) {
                    const span = document.createElement('span');
                    span.className = 'glyph punct'; 
                    span.textContent = hToken;
                    fragment.appendChild(span);
                } else {
                    const ruby = document.createElement('ruby');
                    ruby.className = 'glyph';
                    ruby.dataset.hanzi = hToken;
                    ruby.dataset.pinyin = pToken;
                    const rbContent = getRbText(hToken, pToken);
                    ruby.innerHTML = `<rt>${getDisplayText(pToken)}</rt><rb>${rbContent}</rb>`;
                    fragment.appendChild(ruby);
                }
                h_idx++;
                p_idx++;
            }
        }
        return fragment;
    };

    const hSegs = segmentHanziByClauses(hanzi || '');
    const pSegRaws = segmentPinyinRawByClauses(pinyin || '');
    CC_SEG.map = []; 

    const processAndAppend = (hText, pText, index) => {
        const clause = document.createElement('span');
        clause.className = 'clause';
        clause.dataset.index = String(index);

        if (allowEdit) {
            clause.innerHTML = `<button type="button" class="edit-btn"><span class="material-symbols-outlined" style="font-size:18px;color:#334155">edit</span></button>`;
        }

        const hTokens = tokenizeHanziWithAlphanum(hText);
        const pSegSyls = tokenizeSyls(pText);
        clause.appendChild(processClause(hTokens, pSegSyls));

        const finalHanCount = hTokens.filter(t => !(isPunct(t) || isWhitespace(t))).length;
        const finalPyCount = pSegSyls.reduce((acc, syl) => acc + syl.split(/--?|=/).length, 0);

        if (showWarnings && finalHanCount !== finalPyCount) {
            clause.classList.add('clause-warn');
            if (mode === 'edit') clause.title = `片段配對異常：字數 ${finalHanCount} ≠ 拼音 ${finalPyCount}`;
        }
        container.appendChild(clause);
    };

    let hSegIndex = 0;
    let pSegIndex = 0;
    while (hSegIndex < hSegs.length || pSegIndex < pSegRaws.length) {
        const hSeg = hSegs[hSegIndex];
        const pSeg = pSegRaws[pSegIndex];

        if (hSeg && hSeg.type === 'br') {
            container.appendChild(document.createElement('br'));
            hSegIndex++;
            if (pSeg && pSeg.type === 'br') pSegIndex++;
            continue;
        }

        const currentHSegText = hSeg?.text || '';
        const currentPSegText = pSeg?.text || '';

        CC_SEG.map.push({ hIndex: hSegIndex, pIndex: pSegIndex });
        processAndAppend(currentHSegText, currentPSegText, CC_SEG.map.length -1);

        hSegIndex++;
        pSegIndex++;
        if (hSegIndex >= hSegs.length && pSegIndex >= pSegRaws.length) break;
    }

    return { node: container };
}


/**
 * 附加點擊播放聲音的事件處理器
 */
function attachAudioHandlers() {
    resultArea.classList.add('mode-audio');
    resultArea.querySelectorAll('ruby.glyph').forEach(rubyEl => {
        const pinyin = rubyEl.querySelector('rt')?.textContent?.trim();
        // 確保有拼音內容才附加事件
        if (pinyin) {
            // 使用 setAttribute 來新增 onclick 事件
            const safePinyin = pinyin.replace(/'/g, "\\'"); // 處理拼音中可能包含的單引號
            rubyEl.setAttribute('onclick', `window.PinyinAudio.kasu(this, '${safePinyin}')`);
        }
    });
}

/**
 * 核心功能：將拼音輸入框的內容轉換為漢字。
 */
function pinyinToHanzi() {
    let pinyinText = pinyinInput.value;

    // 根據當前語言，先將拼音轉換為字母調 (zvs) 格式
    const hakkaLanguages = new Set(['sixian', 'hailu', 'dapu', 'raoping', 'sixiannan']);
    if (hakkaLanguages.has(currentLanguageKey)) {
        pinyinText = hakkaToneToZvs(pinyinText);
    } else if (currentLanguageKey === 'kasu') {
        pinyinText = hakkaToneToZvs(pinyinText);
		pinyinText = pinyinText
			.replace(/([bpfvdtlgkhzcsi])oo([zvsx]?)\b/g, '$1o$2')
			.replace(/(\b)(rh)([aeiou])/g, '$1r$3')
			.replace(/(\b)(bb)([aeiou])/g, '$1v$3')
			.replace(/(\b)(ji)/g, '$1zi')
			.replace(/(\b)(qi)/g, '$1ci')
			.replace(/(\b)(xi)/g, '$1si');
    } else if (currentLanguageKey === 'holo') {		
		pinyinText = holoPojToTailo(pinyinText);
        pinyinText = holoPinyinZvs(pinyinText);
    } else if (currentLanguageKey === 'jinmen') {		
		pinyinText = holoPojToTailo(pinyinText);
        pinyinText = holoPinyinZvs(pinyinText);
    } else if (currentLanguageKey === 'matsu') {
        pinyinText = matsuPinyinZvs(pinyinText);
    } 

	
    // 拼音前後要有空格
	pinyinText = pinyinText
	  .replace(/(?<![A-Za-z\s-])([A-Za-z]+)/g, ' $1')
	  .replace(/([A-Za-z]+)(?![A-Za-z\s-])/g, '$1 ')
	  .replace(/([A-Za-z])\n/g, '$1 \n')
	  .replace(/\n([A-Za-z])/g, '\n $1')
	  .trim();

    const lang = currentLanguageKey;
    let dict = PROCESSED_IME_DICTS[lang];

    if (!dict || dict.size === 0) {
        console.error(`Dictionary for language "${lang}" not found or is empty.`);
        return;
    }

    // 🧠 效能優化：建立一份 key 全部轉小寫的新辭典
    const lowerDict = new Map();
    for (const [key, value] of dict.entries()) {
        lowerDict.set(key.toLowerCase(), value);
    }
    dict = lowerDict;

    // 步驟 1: 斷詞，保留所有原始 token
    const tokens = tokenizePinyinWithHyphens(pinyinText);
    const isActualSyllable = (token) => !isWhitespace(token) && !isPunct(token);
    const syllables = tokens.filter(isActualSyllable);

    // 步驟 2: 轉換
    const convertedUnits = [];
    let i = 0;
    while (i < syllables.length) {
        let matchFound = false;

        // 策略 1: 優先匹配多音節長詞
        for (let n = Math.min(5, syllables.length - i); n > 1; n--) {
            const phrase = syllables.slice(i, i + n).join(' ').toLowerCase();
            if (dict.has(phrase)) {
                convertedUnits.push({ hanzi: dict.get(phrase), sourceCount: n });
                i += n;
                matchFound = true;
                break;
            }
        }
        if (matchFound) continue;

        // 策略 2: 處理單一音節單位
        const currentSyl = syllables[i].toLowerCase();

        if (dict.has(currentSyl)) {
            convertedUnits.push({ hanzi: dict.get(currentSyl), sourceCount: 1 });
            matchFound = true;
        } else if (currentSyl.includes('-')) {
            const subPinyins = currentSyl.split(/-+/);
            const translatedSubs = subPinyins.map(sub => dict.get(sub.toLowerCase()) || sub);
            convertedUnits.push({ hanzi: translatedSubs.join(''), sourceCount: 1 });
            matchFound = true;
        }

        // 策略 3: 若無任何匹配，保留原樣
        if (!matchFound) {
            convertedUnits.push({ hanzi: syllables[i], sourceCount: 1 });
        }
        
        i++;
    }

    // 步驟 3: 重組文本
    let unitIndex = 0;
    let syllablesToSkip = 0;
    let finalText = "";

    tokens.forEach(token => {
        if (!isActualSyllable(token)) {
            if (!isWhitespace(token)) {
                finalText += token; // 保留標點
            }
            return;
        }
        
        if (syllablesToSkip > 0) {
            syllablesToSkip--;
            return;
        }


        if (unitIndex < convertedUnits.length) {
            const unit = convertedUnits[unitIndex];
            finalText += unit.hanzi;
            syllablesToSkip = unit.sourceCount - 1;
            unitIndex++;
        } else {
            finalText += token;
        }
    });

    finalText = finalText.replace(/\s+([，。、；：！？.,;:!?])/g, '$1').trim();

    finalText = finalText
        .replace(/,/g, '，')
        .replace(/(?<!\.)\.(?!\.)/g, '。') 
        .replace(/\?/g, '？')
        .replace(/!/g, '！')
        .replace(/;/g, '；')
        .replace(/:/g, '：')
        .replace(/\(/g, '（')
        .replace(/\)/g, '）');

    hanziInput.value = finalText;
}


/**
 * 設定輸入區的模式（字轉音 / 音轉字）
 * @param {'hanzi-to-pinyin'|'pinyin-to-hanzi'} newMode - 要切換到的新模式
 * @param {boolean} [isInitialLoad=false] - 是否為初始載入，若是則不更新 URL
 */
function setInputMode(newMode, isInitialLoad = false) {
    // 只有當模式實際改變時才更新，除非是強制設定初始狀態
    if (newMode === inputMode && !isInitialLoad) return;
    inputMode = newMode;

    // 將新的模式選擇儲存到 Local Storage
    saveSetting(AppConfig.storageKeys.INPUT_MODE, newMode);

    if (inputMode === 'hanzi-to-pinyin') {
        // 更新分頁按鈕樣式
        btnModeHanziToPinyin.classList.add('active');
        btnModePinyinToHanzi.classList.remove('active');

        // 調整輸入框順序
        textareasContainer.classList.remove('flex-col-reverse');

        // 【修改重點】顯示「漢字轉拼音」的整組容器，隱藏「拼音轉漢字」按鈕
        if (btnHanziToPinyinContainer) {
            btnHanziToPinyinContainer.classList.remove('hidden');
        } else {
            // 相容舊代碼：如果還沒改 HTML ID，至少隱藏舊按鈕
            btnHanziToPinyin.classList.remove('hidden');
        }
        btnPinyinToHanzi.classList.add('hidden');

    } else { // 'pinyin-to-hanzi'
        // 更新分頁按鈕樣式
        btnModePinyinToHanzi.classList.add('active');
        btnModeHanziToPinyin.classList.remove('active');

        // 調整輸入框順序
        textareasContainer.classList.add('flex-col-reverse');

        // 【修改重點】隱藏「漢字轉拼音」的整組容器，顯示「拼音轉漢字」按鈕
        if (btnHanziToPinyinContainer) {
            btnHanziToPinyinContainer.classList.add('hidden');
        } else {
             // 相容舊代碼
            btnHanziToPinyin.classList.add('hidden');
        }
        btnPinyinToHanzi.classList.remove('hidden');
    }

    // 更新網址參數 (如果不是初始載入)
    if (!isInitialLoad) {
        const url = new URL(window.location);
        const modeParam = (newMode === 'pinyin-to-hanzi') ? 'p2h' : 'h2p';
        url.searchParams.set('mode', modeParam);
        // 使用 history.pushState 更新網址，不重新載入頁面
        window.history.pushState({}, '', url);
    }
}


function render() {
    preprocessAndSplitInput();
    CC_SEG = {
        hSegs: segmentHanziByClauses(hanziInput.value || ''),
        pSegRaws: segmentPinyinRawByClauses(pinyinInput.value || ''),
        map: [] 
    };

    const hanzi = hanziInput.value;
    const pinyin = pinyinInput.value;
    const isEdit = mode === 'edit';

    const {
        node
    } = alignByClauses({
        hanzi,
        pinyin,
        showWarnings: true,
        allowEdit: isEdit,
        mode: mode,
        annotationMode: annotationMode,
        phoneticDisplayMode: phoneticDisplayMode
    });

    resultArea.innerHTML = '';
    resultArea.appendChild(node);

    // --- 模式與樣式管理 ---
    resultArea.classList.toggle('mode-view', !isEdit);
    resultArea.classList.toggle('mode-edit', isEdit);
    resultArea.classList.remove('mode-audio');
    
    // 【新增】如果是直注音模式，加入 class 以隱藏 RT (display: none)
    resultArea.classList.toggle('mode-vertical-zhuyin', phoneticDisplayMode === 'vertical-zhuyin');

    // ... (後續代碼保持不變) ...
    btnPlayAudio.classList.toggle('hidden', isEdit);
    phoneticsContainer.classList.toggle('hidden', isEdit);

    if (isEdit) {
        phoneticsMenu.classList.add('hidden'); 
        if (isAudioMode) {
            isAudioMode = false;
            btnPlayAudio.classList.remove('active');
        }
        attachEditHandlers();
    } else {
        if (isAudioMode) {
            attachAudioHandlers();
        }
    }

    phoneticsMenu.querySelectorAll('.phonetic-choice').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === phoneticDisplayMode);
    });

    PROBLEMS = Array.from(resultArea.querySelectorAll('.clause.clause-warn'));
    problemIdx = PROBLEMS.length ? 0 : -1;

    PROBLEMS.forEach(el => el.classList.remove('dimmed'));
    
    if (isEdit) {
        PROBLEMS.forEach((problemClause, index) => {
            problemClause.style.cursor = 'pointer'; 
            problemClause.addEventListener('click', (e) => {
                if (e.target.closest('.edit-btn') || e.target.closest('.inline-editor')) {
                    return;
                }
                problemIdx = index;
                updateIssueBar();
                PROBLEMS.forEach((el, i) => {
                    el.classList.toggle('dimmed', i !== problemIdx);
                });
            });
        });
    }

    const hasProblems = PROBLEMS.length > 0;
    const segControl = $('#modeToggleContainer');

    if (issueBar) {
        issueBar.classList.toggle('hidden', !hasProblems || !isEdit);
    }

    if (segControl) {
        segControl.classList.toggle('bg-rose-100', hasProblems);
        segControl.classList.toggle('bg-slate-100', !hasProblems);
    }

    updateIssueBar();

    if (problemIdx >= 0) {
        if (isEdit) {
            focusProblem(problemIdx);
            PROBLEMS.forEach((el, i) => el.classList.toggle('dimmed', i !== problemIdx));
        } else {
            PROBLEMS.forEach((el) => el.classList.add('dimmed'));
        }
    }

    applyTypography();
}





/**
 * 將組合用聲調符號 (Combining Marks) 正規化為獨立的聲調符號，
 * 並移除其前面的空格。
 * 例如：將 "gi \u030C" 轉換為 "giˇ"。
 * @param {string} text - 原始輸入字串
 * @returns {string} - 經過正規化處理後的字串
 */
function normalizeToneMarks(text) {
    if (!text) return '';
    return text
        // 處理 acute accent (ˊ), e.g., á
        .replace(/\s*\u0301/g, 'ˊ')
        // 處理 caron (ˇ), e.g., ǎ
        .replace(/\s*\u030C/g, 'ˇ')
        // 處理 grave accent (ˋ), e.g., à
        .replace(/\s*\u0300/g, 'ˋ');
}

/**
 * 預處理輸入框內容。如果拼音區為空，且漢字區包含 "字(pinyin)" 格式，
 * 或為「拼音\n漢字」的交錯格式，則自動解析並將內容拆分到兩個輸入框中。
 */
function preprocessAndSplitInput() {
    // 1. 先對漢字區的內容進行聲調正規化 (e.g., "gi \u030C" -> "giˇ")
    const normalizedHanzi = normalizeToneMarks(hanziInput.value);
    const pinyinText = pinyinInput.value;

    // 如果拼音區已經有內容，則不進行任何自動解析
    if (pinyinText.trim() !== '') {
        // 僅更新漢字區為正規化後的版本，以防使用者輸入了組合聲調符號
        hanziInput.value = normalizedHanzi;
        return;
    }

    // --- 解析模式一：處理 "漢字(pinyin)" 格式 ---
    if (normalizedHanzi.includes('(') && normalizedHanzi.includes(')')) {
        const hanziParts = [];
        const pinyinParts = [];
        // 【修正】加上 u 旗標，讓 . 能正確匹配擴充漢字
        const regex = /(.)\s*\(([^)]+)\)|([^()\s])/gu;
        
        let match;
        while ((match = regex.exec(normalizedHanzi)) !== null) {
            if (match[1] && match[2]) { // 匹配 "字(音)"
                hanziParts.push(match[1]);
                pinyinParts.push(match[2].trim());
            } else if (match[3]) { // 匹配獨立字元 (如標點)
                const char = match[3];
                hanziParts.push(char);
                if (PUNCTS.has(char)) {
                    pinyinParts.push(char);
                }
            }
        }

        // 如果成功解析，則更新輸入框
        if (hanziParts.length > 0) {
            hanziInput.value = hanziParts.join('');
            let formattedPinyin = pinyinParts.join(' ');
            formattedPinyin = formattedPinyin.replace(/\s+([，。、；：！？.,;:!?])/g, '$1');
            pinyinInput.value = formattedPinyin;
        } else {
            hanziInput.value = normalizedHanzi; // 解析失敗，還原為正規化內容
        }
        return; // 完成模式一，退出
    }

    // --- 解析模式二：處理「拼音\n漢字」交錯格式 ---
    if (normalizedHanzi.includes('\n')) {
        const lines = normalizedHanzi.split('\n')
                                    .map(line => line.trim())
                                    .filter(line => line.length > 0);

        const hanziParts = [];
        const pinyinParts = [];
        let i = 0;
        
        // --- START: 已修復的解析迴圈 ---
        while (i < lines.length) {
            const currentLine = lines[i];

            // 情況 1: 目前這一行是獨立的標點符號。
            if (currentLine.length === 1 && PUNCTS.has(currentLine)) {
                hanziParts.push(currentLine);
                pinyinParts.push(currentLine);
                i++;
                continue;
            }
            
            // 情況 2: 還沒到最後一行。
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                
                // 情況 2a: 下一行是標點符號。
                // 這代表目前這行是一個沒有對應漢字的拼音。
                if (nextLine.length === 1 && PUNCTS.has(nextLine)) {
                    pinyinParts.push(currentLine); // 只加入拼音
                    i++; // 指標前進 1，讓下一次迴圈處理標點符號
                } 
                // 情況 2b: 下一行不是標點符號。
                // 將兩行視為一組「拼音-漢字」。
                else {
                    pinyinParts.push(currentLine); // 拼音
                    hanziParts.push(nextLine);   // 漢字
                    i += 2; // 指標前進 2
                }
            } 
            // 情況 3: 已經是最後一行了。
            // 這代表它是一個結尾多出來的拼音。
            else {
                pinyinParts.push(currentLine);
                i++;
            }
        }
        // --- END: 已修復的解析迴圈 ---

        // 如果成功解析，則更新輸入框
        if (hanziParts.length > 0) {
            hanziInput.value = hanziParts.join('');
            
            let formattedPinyin = pinyinParts.join(' ');
            // 清理標點前的多餘空格
            formattedPinyin = formattedPinyin.replace(/\s+([，。、；：！？.,;:!?])/g, '$1');
            // 將常見的全形標點轉為半形，以符合期望的輸出格式
            formattedPinyin = formattedPinyin.replace(/，/g, ',').replace(/？/g, '?').replace(/。/g, '.').replace(/！/g, '!').replace(/；/g, ';').replace(/：/g, ':').replace(/、/g, ',');

            pinyinInput.value = formattedPinyin;
        } else {
            hanziInput.value = normalizedHanzi; // 解析失敗，還原
        }
        return; // 完成模式二，退出
    }

    // 如果所有解析模式都不匹配，僅更新漢字區為正規化後的版本
    hanziInput.value = normalizedHanzi;
}


function updateIssueBar() {
    const total = PROBLEMS.length;
    const current = problemIdx >= 0 ? problemIdx + 1 : 0;

    if (issueIndexText) {
        issueIndexText.textContent = `${current}/${total}`;
    }

    const disabled = total === 0 || mode === 'view';

    [btnPrev, btnNext].forEach(b => {
        if (b) {
            b.disabled = disabled;
            b.classList.toggle('opacity-40', disabled);
            b.classList.toggle('cursor-not-allowed', disabled);
        }
    });
}

function focusProblem(idx) {
    if (idx < 0 || idx >= PROBLEMS.length) return;
    PROBLEMS.forEach(n => n.classList.remove('focus-ring'));
    const el = PROBLEMS[idx];
    el.classList.add('focus-ring');
    el.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
    setTimeout(() => el.classList.remove('focus-ring'), 700);
}

btnPrev?.addEventListener('click', () => {
    if (!PROBLEMS.length || mode === 'view') return;
    problemIdx = (problemIdx - 1 + PROBLEMS.length) % PROBLEMS.length;
    updateIssueBar();
    focusProblem(problemIdx);
    PROBLEMS.forEach((el, i) => el.classList.toggle('dimmed', i !== problemIdx));
});
btnNext?.addEventListener('click', () => {
    if (!PROBLEMS.length || mode === 'view') return;
    problemIdx = (problemIdx + 1) % PROBLEMS.length;
    updateIssueBar();
    focusProblem(problemIdx);
    PROBLEMS.forEach((el, i) => el.classList.toggle('dimmed', i !== problemIdx));
});


// 「檢視模式」按鈕事件監聽函式
btnModeView.addEventListener('click', () => {
    mode = 'view';
    btnModeView.classList.add('active');
    btnModeEdit.classList.remove('active');
    
    // 在檢視模式下，顯示「字/詞」切換容器
    if (charWordToggleContainer) {
        charWordToggleContainer.classList.remove('hidden');
    }
    
    render();
});

// 「編輯模式」按鈕事件監聽函式
btnModeEdit.addEventListener('click', () => {
    mode = 'edit';
    btnModeEdit.classList.add('active');
    btnModeView.classList.remove('active');
    
    // 編輯模式強制切換回「字」模式，以利單字編輯
    if (annotationMode === 'word') {
        annotationMode = 'char';
        btnModeChar.classList.add('active');
        btnModeWord.classList.remove('active');
    }
    
    // 在編輯模式下，隱藏「字/詞」切換容器
    if (charWordToggleContainer) {
        charWordToggleContainer.classList.add('hidden');
    }
    
    render();
});

btnModeChar.addEventListener('click', () => {
    if (annotationMode === 'word') {
        annotationMode = 'char';
        btnModeChar.classList.add('active');
        btnModeWord.classList.remove('active');
        render(); 
    }
});

btnModeWord.addEventListener('click', () => {
    if (annotationMode === 'char') {
        annotationMode = 'word';
        btnModeWord.classList.add('active');
        btnModeChar.classList.remove('active');
        render();
    }
});


function attachEditHandlers() {
    // 功能1：編輯整個子句
    resultArea.querySelectorAll('.clause .edit-btn').forEach(btn => {
         btn.addEventListener('click', (e) => {
            if (mode !== 'edit') return;
            e.stopPropagation();
            closeWordEditor();
            const clause = btn.closest('.clause');
            if (!clause) return;

            const existing = clause.querySelector('.inline-editor');
            if (existing) {
                existing.remove();
                return;
            }

            const hIndex = Number(clause.dataset.index || 0);
            const mapItem = CC_SEG.map.find(m => m.hIndex === hIndex);
            const pIndex = mapItem ? mapItem.pIndex : hIndex;

            // 1. 取得漢字 (過濾掉微型注音)
            let curH = CC_SEG.hSegs.filter(s => s.type === 'seg')[hIndex]?.text || '';
            const cleanerRegex = window.regexBpmTiny || /[-]/g;
            curH = curH.replace(new RegExp(cleanerRegex, 'g'), '');

            // 2. 取得拼音 (CC_SEG 源自輸入框，本身就是拼音，不受顯示模式影響)
            const curP = CC_SEG.pSegRaws.filter(s => s.type === 'seg')[pIndex]?.text || '';

            const editor = document.createElement('div');
            editor.className = 'inline-editor';
            editor.innerHTML = `
            <input type="text" class="ed-h" placeholder="漢字" value="${escapeAttr(curH)}" spellcheck="false" autocorrect="off" autocapitalize="off">
            <input type="text" class="ed-p" placeholder="拼音（空白分隔）" value="${escapeAttr(curP)}" spellcheck="false" autocorrect="off" autocapitalize="off">
            <div class="actions">
                ${createToneConverterHTML()}
              <button type="button" class="btn cancel">取消</button>
              <button type="button" class="btn save">儲存</button>
            </div>
          `;
            clause.appendChild(editor);
            updateAllToneConverterUIs();

            editor.querySelector('.cancel').addEventListener('click', () => editor.remove());

            editor.querySelector('.save').addEventListener('click', () => {
                const newH = editor.querySelector('.ed-h').value || '';
                const newP = editor.querySelector('.ed-p').value || '';
                const hIndex = Number(clause.dataset.index || 0);
                const mapItem = CC_SEG.map.find(m => m.hIndex === hIndex);
                const pIndex = mapItem ? mapItem.pIndex : hIndex;
                const finalHanziText = rebuildHanziWithReplace(hIndex, newH);
                const finalPinyinText = rebuildPinyinWithReplace(pIndex, newP);
                hanziInput.value = finalHanziText;
                pinyinInput.value = finalPinyinText;
                
                // render() 會根據當前模式 (例如顯示注音) 重新生成畫面
                render();
                toast('已更新本段，並同步輸入區');
            });
        });
    });

    // 功能2：為所有可編輯的 <ruby> 綁定編輯器
    resultArea.querySelectorAll('.clause ruby.glyph').forEach(rubyEl => {
        rubyEl.style.cursor = 'pointer';
        rubyEl.addEventListener('click', (e) => {
            if (mode !== 'edit' || e.target.closest('.word-editor')) return;
            showWordEditor(rubyEl);
        });
    });
}



// 關閉單詞編輯器
function closeWordEditor() {
    const existingEditor = document.querySelector('.word-editor');
    if (existingEditor) {
        existingEditor.remove();
    }
}


/**
 * 「詞彙」編輯器
 * @param {HTMLElement} wordUnitEl - 被點擊的 .word-unit <span> 元素
 */
function showWordUnitEditor(wordUnitEl) {
    closeWordEditor(); // 先關閉其他已開啟的編輯器

    const originalHanzi = wordUnitEl.dataset.hanzi || '';
    const originalPinyin = wordUnitEl.dataset.pinyin || '';

    const editor = document.createElement('div');
    editor.className = 'word-editor';
    editor.style.position = 'absolute';
    editor.style.zIndex = '10';

    editor.innerHTML = `
        <div class="space-y-2">
            <input type="text" class="ed-h-word" value="${escapeAttr(originalHanzi)}" placeholder="詞彙" spellcheck="false" autocorrect="off" autocapitalize="off">
            <input type="text" class="ed-p-word" value="${escapeAttr(originalPinyin)}" placeholder="拼音" spellcheck="false" autocorrect="off" autocapitalize="off">
        </div>
        <div class="actions">
            ${createToneConverterHTML()} 
            <button type="button" class="btn cancel">取消</button>
            <button type="button" class="btn save">儲存</button>
        </div>
    `;

    document.body.appendChild(editor);
    updateAllToneConverterUIs();

    const rect = wordUnitEl.getBoundingClientRect();
    editor.style.left = `${window.scrollX + rect.left}px`;
    editor.style.top = `${window.scrollY + rect.bottom + 8}px`;

    const pinyinField = editor.querySelector('.ed-p-word');
    pinyinField.focus();

    editor.querySelector('.cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        closeWordEditor();
    });

    // 儲存邏輯

    // 儲存邏輯
    editor.querySelector('.save').addEventListener('click', (e) => {
        e.stopPropagation();
        const newHanzi = editor.querySelector('.ed-h-word').value;
        const newPinyin = pinyinField.value.trim();

        // 1. 更新 word-unit 元素的 dataset
        wordUnitEl.dataset.hanzi = newHanzi;
        wordUnitEl.dataset.pinyin = newPinyin;

        // 2. 重新生成內部 HTML
        const hanziChars = toCharArray(newHanzi);
        const pinyinSyls = newPinyin.split(/--?|=/);
        let newInnerHTML = '';
        const len = Math.max(hanziChars.length, pinyinSyls.length);

        for (let i = 0; i < len; i++) {
            const h = hanziChars[i] || '';
            const p = pinyinSyls[i] || '';
            
            // 【關鍵修改】：若在雙顯模式，要在這裡生成 rb 內容
            let rbContent = h;
            if (phoneticDisplayMode === 'pinyin-zhuyin' && typeof kasuPinyinBpmTiny === 'function') {
                rbContent += kasuPinyinBpmTiny(p);
            }
            
            // 注意：rt 的顯示也要符合當前模式
            // 由於 getDisplayText 是在 alignByClauses 內部定義的，這裡無法直接呼叫
            // 但我們可以簡單判斷：如果是 kasu，詞彙編輯器通常是輸入拼音，所以顯示拼音即可
            // 若需要嚴謹，可以把 getDisplayText 移到全域，或在這裡複製一份邏輯
            // 這裡假設直接顯示拼音 (符合使用者編輯時的需求)
            newInnerHTML += `
                <ruby class="glyph">
                    <rt>${p}</rt>
                    <rb>${rbContent}</rb>
                </ruby>
            `;
        }
        wordUnitEl.innerHTML = newInnerHTML;

        // 3. 從結果回寫 (Logic Copy from showWordEditor with Cleaner)
        const hanziParts = [];
        const pinyinParts = [];
        const lineWrap = resultArea.querySelector('.line-wrap');
        const cleanerRegex = window.regexBpmTiny || /[-]/g; // 清除器

        if (lineWrap) {
            lineWrap.childNodes.forEach(node => {
                if (node.nodeName === 'BR') {
                    hanziParts.push('\n');
                    pinyinParts.push('\n');
                } else if (node.classList && node.classList.contains('clause')) {
                    node.childNodes.forEach(glyphNode => {
                        // 處理 word-unit
                        if (glyphNode.classList && glyphNode.classList.contains('word-unit')) {
                            // word-unit 的 dataset 應該是乾淨的，直接用 dataset 比較安全
                            hanziParts.push(glyphNode.dataset.hanzi);
                            pinyinParts.push(glyphNode.dataset.pinyin);
                        } 
                        // 處理普通 ruby
                        else if (glyphNode.nodeName === 'RUBY') {
                            let hanzi = glyphNode.querySelector('rb')?.textContent || '';
                            const pinyin = glyphNode.querySelector('rt')?.textContent || '';
                            
                            // 【關鍵清除】
                            hanzi = hanzi.replace(new RegExp(cleanerRegex, 'g'), '');

                            if (hanzi) hanziParts.push(hanzi);
                            if (pinyin) pinyinParts.push(pinyin);
                        } 
                        // ... 其他類型 (span, punct) 處理同上 ...
                        else if (glyphNode.classList && glyphNode.classList.contains('punct')) {
                            const punct = glyphNode.textContent || '';
                            hanziParts.push(punct);
                            pinyinParts.push(punct);
                        } else if (glyphNode.nodeName === 'SPAN' && glyphNode.classList.contains('glyph')) {
                            const token = glyphNode.textContent || '';
                            if (token) {
                                hanziParts.push(token);
                                pinyinParts.push(token);
                            }
                        }
                    });
                }
            });
        }
        
        // ... (後續回填 input 與 render 邏輯不變) ...
        const finalHanziText = hanziParts.join('');
        const finalPinyinText = pinyinParts.join(' ').replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
        
        hanziInput.value = finalHanziText;
        pinyinInput.value = finalPinyinText;

        closeWordEditor();
        render();
        toast('詞彙內容已更新');
    });
}


function showWordEditor(rubyEl, hIndex, wordIndex) {
    closeWordEditor(); 

    // 1. 取得乾淨的漢字
    let originalHanzi = rubyEl.querySelector('rb')?.textContent || '';
    const cleanerRegex = window.regexBpmTiny || /[-]/g;
    originalHanzi = originalHanzi.replace(new RegExp(cleanerRegex, 'g'), '');

    // 2. 取得拼音 (dataset 或 rt 內容)
    const originalPinyin = rubyEl.dataset.pinyin || rubyEl.querySelector('rt')?.textContent || '';

    const editor = document.createElement('div');
    editor.className = 'word-editor';
    editor.style.position = 'absolute';
    editor.style.zIndex = '10';

    editor.innerHTML = `
        <div class="space-y-2">
            <input type="text" class="ed-h-word" value="${escapeAttr(originalHanzi)}" placeholder="字" spellcheck="false" autocorrect="off" autocapitalize="off">
            <input type="text" class="ed-p-word" value="${escapeAttr(originalPinyin)}" placeholder="音" spellcheck="false" autocorrect="off" autocapitalize="off">
        </div>
        <div class="actions">
            ${createToneConverterHTML()} 
            <button type="button" class="btn cancel">取消</button>
            <button type="button" class="btn save">儲存</button>
        </div>
    `;

    document.body.appendChild(editor);
    updateAllToneConverterUIs();

    const rect = rubyEl.getBoundingClientRect();
    editor.style.left = `${window.scrollX + rect.left}px`;
    editor.style.top = `${window.scrollY + rect.bottom + 8}px`;

    const pinyinField = editor.querySelector('.ed-p-word');
    pinyinField.focus();

    editor.querySelector('.cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        closeWordEditor();
    });

    // 儲存邏輯
    editor.querySelector('.save').addEventListener('click', (e) => {
        e.stopPropagation();
        const newHanzi = editor.querySelector('.ed-h-word').value;
        const newPinyin = pinyinField.value.trim();

        // 1. 更新 dataset
        rubyEl.dataset.hanzi = newHanzi;
        rubyEl.dataset.pinyin = newPinyin;

        // 2. 視覺更新
        // 處理 RB (若在需要微型注音的模式，則附加注音)
        let displayRbContent = newHanzi;
        if ((phoneticDisplayMode === 'pinyin-zhuyin' || phoneticDisplayMode === 'vertical-zhuyin') && typeof kasuPinyinBpmTiny === 'function') {
            displayRbContent = newHanzi + kasuPinyinBpmTiny(newPinyin);
        }

        const targetRb = rubyEl.querySelector('rb');
        const targetRt = rubyEl.querySelector('rt');
        
        if (targetRb) targetRb.textContent = displayRbContent;
        
        // 【關鍵】這裡一律更新為拼音，CSS 會負責隱藏它
        if (targetRt) targetRt.textContent = newPinyin;

        // 3. 回寫 Input (略，保持原樣)
        const hanziParts = [];
        const pinyinParts = [];
        const lineWrap = resultArea.querySelector('.line-wrap');
        const cleanerRegexLoop = window.regexBpmTiny || /[-]/g;

        if (lineWrap) {
            lineWrap.childNodes.forEach(node => {
                if (node.nodeName === 'BR') {
                    hanziParts.push('\n');
                    pinyinParts.push('\n');
                } else if (node.classList && node.classList.contains('clause')) {
                    node.childNodes.forEach(glyph => {
                        if (glyph.nodeName === 'RUBY') {
                            let hanzi = glyph.querySelector('rb')?.textContent || '';
                            const pinyin = glyph.dataset.pinyin || glyph.querySelector('rt')?.textContent || '';
                            
                            hanzi = hanzi.replace(new RegExp(cleanerRegexLoop, 'g'), '');

                            if (hanzi) hanziParts.push(hanzi);
                            if (pinyin) pinyinParts.push(pinyin);

                        } else if (glyph.classList && glyph.classList.contains('punct')) {
                            const punct = glyph.textContent || '';
                            hanziParts.push(punct);
                            pinyinParts.push(punct);
                        } else if (glyph.nodeName === 'SPAN' && glyph.classList.contains('glyph')) {
                             const token = glyph.textContent || '';
                             if (token) {
                                 hanziParts.push(token);
                                 pinyinParts.push(token);
                             }
                        }
                    });
                }
            });
        }

        const finalHanziText = hanziParts.join('').replace(/\n /g, '\n').trim();
        const puncMap = { '，':' ,', '。':' .', '、':' ,', '；':' ;', '：':' :', '！':' !', '？':' ?' };
        let finalPinyinText = '';
        for (let i = 0; i < pinyinParts.length; i++) {
            let part = pinyinParts[i];
            if (part === '\n') {
                finalPinyinText += '\n';
                continue;
            }
            if (puncMap[part]) part = puncMap[part];
            finalPinyinText += part;
            const nextPart = pinyinParts[i + 1];
            if (nextPart && nextPart !== '\n' && !puncMap[nextPart]) {
                 finalPinyinText += ' ';
            }
        }
        finalPinyinText = finalPinyinText.replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').trim();
        
        hanziInput.value = finalHanziText;
        pinyinInput.value = finalPinyinText;

        closeWordEditor();
        render(); 
        toast('內容已更新');
    });
}




// 監聽全局點擊，若點擊編輯器以外區域則關閉
document.addEventListener('click', (e) => {
    const editor = document.querySelector('.word-editor');
    if (editor && !editor.contains(e.target) && !e.target.closest('ruby.glyph')) {
        closeWordEditor();
    }
}, true);

// 重新組裝：用新的片段替換（保留原本換行）
function rebuildHanziWithReplace(hIndex, newText) {
    const parts = [];
    let idx = 0;
    for (const seg of CC_SEG.hSegs) {
        if (seg.type === 'br') {
            parts.push('\n');
            continue;
        }
        if (seg.type === 'seg') {
            parts.push(idx === hIndex ? newText : seg.text);
            idx++;
        }
    }
    return parts.join('');
}

function rebuildPinyinWithReplace(pIndex, newRaw) {
    const parts = [];
    let idx = 0;
    for (const seg of CC_SEG.pSegRaws) {
        if (seg.type === 'br') {
            parts.push('\n');
            continue;
        }
        if (seg.type === 'seg') {
            parts.push(idx === pIndex ? newRaw : seg.text);
            idx++;
        }
    }
    return parts.join('').replace(/\s+\n/g, '\n');
}


/**
 * 根據目前的預設模式，更新所有「轉調號」按鈕的 UI 顯示
 */
function updateAllToneConverterUIs() {
    const defaultText = defaultToneConversionType === 'letter' ? 'zˊ' : '2ˊ';
    const typeName = defaultToneConversionType === 'letter' ? '字母' : '數字';
    const title = `預設轉換模式為：「${typeName} > 調號」，點此直接轉換`;

    // 更新所有主要按鈕的文字與提示
    document.querySelectorAll('.btn-convert-default-tone').forEach(btn => {
        btn.title = title;
        const textEl = btn.querySelector('.default-tone-action-text');
        if (textEl) textEl.textContent = defaultText;
    });

    // 更新所有選單中的高亮選項
    document.querySelectorAll('.tone-converter-menu').forEach(menu => {
        menu.querySelectorAll('.btn-set-tone-default').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === defaultToneConversionType);
        });
    });
}

/**
 * 產生「轉調號」複合按鈕的 HTML 字串，方便在各個編輯器中重複使用
 * @returns {string} HTML 字串
 */
function createToneConverterHTML() {
    return `
      <div class="relative mr-auto">
        <div class="inline-flex rounded-md shadow-sm">
          <button type="button" title="預設轉換" class="btn-convert-default-tone inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 rounded-l-md px-3 py-1.5 text-xs hover:bg-slate-200 transition-colors focus:outline-none">
            <span class="default-tone-action-text">zˊ</span>
          </button>
          <button type="button" title="變更預設模式" class="btn-toggle-tone-converter inline-flex items-center bg-slate-100 text-slate-700 rounded-r-md px-1.5 py-1.5 border-l border-slate-300 hover:bg-slate-200 transition-colors focus:outline-none">
            <span class="material-symbols-outlined text-[18px]">auto_fix</span>
          </button>
        </div>
        <div class="tone-converter-menu popover hidden">
          <button data-type="letter" class="btn-set-tone-default w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-50">zˊ</button>
          <button data-type="number" class="btn-set-tone-default w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-50">2ˊ</button>
        </div>
      </div>
    `;
}



// 安全注入 input 值
function escapeAttr(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 調號轉寫（結果區）
function convertTonesInResult() {
    const rts = resultArea.querySelectorAll('rt');
    if (!rts.length) render();
    resultArea.querySelectorAll('rt').forEach(rt => {
        rt.textContent = convertToneMarks(rt.textContent);
    });
}

function convertToneMarks(str) {
    return (str || '')
        .replace(/([aeioumngbd,-])(ˊ)/g, '$1 \u0301')
        .replace(/([aeioumngbd,-])(ˇ)/g, '$1 \u030C')
        .replace(/([aeioumngbd,-])(ˋ)/g, '$1 \u0300')
        .replace(/([aeioumngbd,-])\^/g, '$1ˆ')
        .replace(/([aeioumngbd,-])\+/g, '$1⁺');
}

// 僅轉寫指定節點內的 rt，不影響畫面上的結果區
function convertTonesInNode(root) {
    if (!root) return;
    root.querySelectorAll('rt').forEach(rt => {
        rt.textContent = convertToneMarks(rt.textContent);
    });
}

// 字級調整
function applyTypography() {
    resultArea.style.fontSize = fontSize + 'px';
    resultArea.style.setProperty('--rt-scale', String(rtScale));
    if (fontVal) fontVal.textContent = String(fontSize);
    if (fontShow) fontShow.textContent = String(fontSize);
    if (rtShow) rtShow.textContent = String(rtScale.toFixed(2)).replace(/\.?0+$/, '');
}

function clamp(v, min, max, step = 1) {
    const n = Math.round(v / step) * step;
    return Math.min(max, Math.max(min, n));
}

// 字級彈窗
btnTypography.addEventListener('click', (e) => {
    e.stopPropagation();
    typoPopover.classList.remove('drop-up');
    typoPopover.classList.toggle('hidden');
    if (!typoPopover.classList.contains('hidden')) {
        const rect = typoPopover.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
            typoPopover.classList.add('drop-up');
        }
    }
});
document.addEventListener('click', (e) => {
    if (!typoPopover.classList.contains('hidden')) {
        const inside = typoPopover.contains(e.target) || btnTypography.contains(e.target);
        if (!inside) typoPopover.classList.add('hidden');
    }
});
typoPopover.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.hasAttribute('data-inc')) {
        const type = t.getAttribute('data-inc');
        if (type === 'font') {
            fontSize = clamp(fontSize + 1, 12, 32);
            applyTypography();
        }
        if (type === 'rt') {
            rtScale = clamp(rtScale + 0.02, 0.50, 1.00, 0.01);
            applyTypography();
        }
    }
    if (t.hasAttribute('data-dec')) {
        const type = t.getAttribute('data-dec');
        if (type === 'font') {
            fontSize = clamp(fontSize - 1, 12, 32);
            applyTypography();
        }
        if (type === 'rt') {
            rtScale = clamp(rtScale - 0.02, 0.50, 1.00, 0.01);
            applyTypography();
        }
    }
});
btnResetFont.addEventListener('click', () => {
    fontSize = DEFAULT_FONT;
    rtScale = DEFAULT_RT;
    applyTypography();
});

// 綁定模式切換與提示（集中一次綁定，避免重複宣告）
(function bindModeControls() {
    const btnModeView = $('#btnModeView');
    const btnModeEdit = $('#btnModeEdit');
    const issueHint = $('#issueHint');
    btnModeView?.addEventListener('click', () => {
        mode = 'view';
        btnModeView.classList.add('active');
        btnModeEdit?.classList.remove('active');
        render();
    });
    btnModeEdit?.addEventListener('click', () => {
        mode = 'edit';
        btnModeEdit.classList.add('active');
        btnModeView?.classList.remove('active');
        render();
    });
    // 檢視模式提示：有錯誤 → 切到編輯並定位第一個
    issueHint?.addEventListener('click', () => {
        mode = 'edit';
        btnModeEdit?.classList.add('active');
        btnModeView?.classList.remove('active');
        render();
        if (PROBLEMS.length) {
            problemIdx = 0;
            updateIssueBar();
            focusProblem(problemIdx);
            PROBLEMS.forEach((el, i) => el.classList.toggle('dimmed', i !== problemIdx));
        }
    });
})();

// 事件
btnProcess.addEventListener('click', render);

btnPhonetics.addEventListener('click', (e) => {
    e.stopPropagation();
    phoneticsMenu.classList.toggle('hidden');
});

$('#actWordTones').addEventListener('click', () => {
    convertTonesInResult();
    toast('已轉寫結果區的調號為 Word 適用格式');
    phoneticsMenu.classList.add('hidden');
});

phoneticsMenu.querySelectorAll('.phonetic-choice').forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        if (type && type !== phoneticDisplayMode) {
            phoneticDisplayMode = type;
            render(); // 重新渲染以更新顯示
        }
        phoneticsMenu.classList.add('hidden');
    });
});



btnClear.addEventListener('click', () => {
    hanziInput.value = '';
    pinyinInput.value = '';
    resultArea.innerHTML = '<div class="text-slate-400 text-sm">標註結果會出現在這裡…</div>';
    PROBLEMS = [];
    problemIdx = -1;
    issueBar.classList.add('hidden');
    updateIssueBar();

    const segControl = $('#modeToggleContainer');
    if (segControl) {
        segControl.classList.remove('bg-rose-100');
        segControl.classList.add('bg-slate-100');
    }
});


// 主按鈕：點擊左側「複製標註」執行主要動作
btnPrimary.addEventListener('click', async () => {
    await copyAnnotated();
});

// 主按鈕：點擊右側小三角展開選單
btnPrimaryToggle.addEventListener('click', (e) => {
    e.preventDefault();
    toggleMenuMore();
});

function toggleMenuMore() {
    // 重置方向
    menuMore.style.bottom = 'auto';
    menuMore.style.top = '100%';
    menuMore.style.marginTop = '8px';
    menuMore.style.marginBottom = '0';
    menuMore.classList.toggle('hidden');
    if (!menuMore.classList.contains('hidden')) {
        const rect = menuMore.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
            // 往上展開
            menuMore.style.top = 'auto';
            menuMore.style.bottom = '100%';
            menuMore.style.marginTop = '0';
            menuMore.style.marginBottom = '8px';
        }
    }
}

document.addEventListener('click', (e) => {
    const within = e.target.closest('#menuMore') || e.target.closest('#btnPrimaryContainer');
    if (!within) menuMore.classList.add('hidden');
});

// 新選單：複製標註（預設）
const actCopyAnnotated = document.getElementById('actCopyAnnotated');
actCopyAnnotated.addEventListener('click', async () => {
    await copyAnnotated();
    menuMore.classList.add('hidden');
});


// 複製HTML
actCopy.addEventListener('click', async () => {
    const {
        node
    } = alignByClauses({
        hanzi: hanziInput.value,
        pinyin: pinyinInput.value,
        showWarnings: false,
        allowEdit: false,
        annotationMode: annotationMode,
        phoneticDisplayMode: phoneticDisplayMode 
    });
    const wrap = document.createElement('div');
    wrap.appendChild(node);    const html = wrap.innerHTML;
    try {
        await navigator.clipboard.writeText(html);
        toast('已複製檢視模式的 HTML！');
    } catch {
        fallbackDownload('result.html', html);
    }
    menuMore.classList.add('hidden');
});

// 下載HTML
actDownload.addEventListener('click', () => {
    const exportHtml = buildExportHtml({
        hanzi: hanziInput.value,
        pinyin: pinyinInput.value,
        fontSize: '14pt',
        rtScale: getComputedStyle(resultArea).getPropertyValue('--rt-scale') || '0.68',
        annotationMode: annotationMode,
        phoneticDisplayMode: phoneticDisplayMode
    });
    fallbackDownload('hakka-annotated.html', exportHtml);
    menuMore.classList.add('hidden');
});



// 複製標註
async function copyAnnotated() {
    // 以重新渲染的檢視模式內容為輸出來源
    const hanzi = hanziInput.value;
    const pinyin = pinyinInput.value;
    const { node } = alignByClauses({
        hanzi,
        pinyin,
        showWarnings: false,
        allowEdit: false,
        annotationMode: annotationMode,
        phoneticDisplayMode: phoneticDisplayMode 
    });

    const outputContainer = document.createElement('div');
    let currentP = document.createElement('p');
    
    // 清除段落 margin
    currentP.style.cssText = 'margin: 0;'; 
    
    while (node.firstChild) {
        const child = node.firstChild;
        if (child.nodeName === 'BR') {
            outputContainer.appendChild(currentP);
            currentP = document.createElement('p');
            currentP.style.cssText = 'margin: 0;'; 
            child.remove(); 
        } else {
            currentP.appendChild(child);
        }
    }
    outputContainer.appendChild(currentP);

    const tempWrap = document.createElement('div');
    tempWrap.appendChild(outputContainer);
    
    // 定義變數
    let rtStyle = '';
    let bodyLineHeight = '1.5';
    let rbLineHeight = '1.5'; // 新增：控制漢字區的行高
    
    if (phoneticDisplayMode === 'vertical-zhuyin') {
        // 直注音模式：
        // 1. RT 隱藏
        tempWrap.querySelectorAll('rt').forEach(rt => {
            rt.textContent = '\u200B'; 
        });
        rtStyle = `font-size: 1pt; line-height: 0; color: transparent; display: block; height: 0; overflow: hidden;`;

        bodyLineHeight = '18pt'; 
        rbLineHeight = '1.0';    
    } else {
        // 一般模式：正常顯示
        rtStyle = `font-size: 0.68em; color: #334155; letter-spacing: .02em; display: block; margin-bottom: .06em; text-align: center; font-family: "台灣楷體", twkai;`;
        bodyLineHeight = '1.5';
        rbLineHeight = '1.5';
    }

    convertTonesInNode(tempWrap);

    if (phoneticDisplayMode !== 'vertical-zhuyin') {
        const rubies = tempWrap.querySelectorAll('ruby');
        rubies.forEach((ruby, i) => {
            const next = ruby.nextSibling;
            if (next && next.nodeType === Node.ELEMENT_NODE && next.tagName === 'RUBY') {
                ruby.parentNode.insertBefore(document.createTextNode('\u00A0'), next);
            }
        });
    }

    const body = tempWrap.innerHTML.trim();

    // 在 HTML 中帶入變數
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{font-family:"台灣楷體", twkai;box-shadow:none!important;outline:none!important;border:none!important;background:transparent!important}
ruby{ruby-position:over;ruby-align:center;font-family:"台灣楷體", twkai;}
/* 使用 rbLineHeight 變數 */
rb{display:inline;font-family:"台灣楷體", twkai; line-height: ${rbLineHeight};}
rt{${rtStyle}}
${phoneticDisplayMode === 'vertical-zhuyin' ? 'ruby{margin:0!important;}' : ''}
p { margin: 0; padding: 0; }
/* 使用 bodyLineHeight 變數 */
body{font-size:14pt;line-height:${bodyLineHeight};font-family:"台灣楷體", twkai;}
</style></head><body>${body}</body></html>`;

    try {
        const blob = new Blob([html], {
            type: 'text/html'
        });
        const data = [new ClipboardItem({
            'text/html': blob
        })];
        await navigator.clipboard.write(data);
        toast('已複製標註（富文本）');
    } catch (err) {
        await navigator.clipboard.writeText(html);
        toast('已複製標註（HTML文字）');
    }
}



function buildExportHtml({ hanzi, pinyin, fontSize, rtScale, annotationMode, phoneticDisplayMode }) {
    const escapedHanzi = hanzi.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    const escapedPinyin = pinyin.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
    const escapedAnnotationMode = annotationMode;
    const escapedDisplayMode = phoneticDisplayMode || 'pinyin'; // 預設值
	const cssRtStyle = (phoneticDisplayMode === 'vertical-zhuyin') 
    ? 'display: none;' // 網頁下載版直接隱藏最乾淨
    : 'font-size: calc(var(--rt-scale) * 1em); color: var(--pinyin-color); display: block;';


    // 返回一個包含完整邏輯的 HTML 字串
    return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>客語標註結果</title>
    <link href="https://oikasu1.github.io/kasuexam/kasu/fonts/twhei.css" rel="stylesheet">
    <style>
        /* --- CSS 樣式區 (未來可獨立為 style.css) --- */
        :root {
            --rt-scale: ${String(rtScale).trim() || 0.68};
            --text-color: #333;
            --pinyin-color: #555;
            --bg-color: #fdfdfd;
            --border-color: #e5e7eb;
            --button-bg: #f1f5f9;
            --button-hover-bg: #e2e8f0;
        }
        body {
            font-family: twhei-s, TWHEI, "台灣黑體", system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, "PingFang TC", "Microsoft JhengHei", sans-serif;
            margin: 0;
            padding: 1.5rem;
            background-color: var(--bg-color);
            color: var(--text-color);
            font-size: ${fontSize || '18px'};
            line-height: 2.2;
            -webkit-text-size-adjust: 100%; /* 防止手機旋轉時字體大小改變 */
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .controls {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
            text-align: center;
        }
        #togglePinyinBtn {
            font-size: 1rem;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            background-color: var(--button-bg);
            cursor: pointer;
            transition: background-color 0.2s;
        }
        #togglePinyinBtn:hover {
            background-color: var(--button-hover-bg);
        }
        #content {
            text-align: justify;
            word-break: break-all;
        }
        .pinyin-hidden rt {
            visibility: hidden; /* 使用 visibility 以維持排版高度 */
        }
        ruby {
            ruby-position: over;
            text-align: center;
            display: inline-flex;
            flex-direction: column-reverse; /* 讓 rb 在 rt 下方 */
            vertical-align: middle;
            margin: 0 0.05em;
        }
        rb {
            display: inline;
            line-height: 1.1;
        }
        rt {
            ${cssRtStyle}
        }
        .punct, .alphanum {
            display: inline-block;
            vertical-align: middle;
        }
        /* 行動裝置優化 */
        @media (max-width: 600px) {
            body {
                padding: 1rem;
                font-size: 16px;
                line-height: 2.3;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="controls">
            <button id="togglePinyinBtn">隱藏拼音</button>
        </header>
        <main id="content">
            <p>正在生成內容...</p>
        </main>
    </div>

    <script>
    // --- JavaScript 邏輯區 (未來可獨立為 script.js) ---


    // --- 步驟 1: 資料定義 ---
    const hanzi = \`${escapedHanzi}\`;
    const pinyin = \`${escapedPinyin}\`;
    const annotationMode = \`${escapedAnnotationMode}\`;
    const phoneticDisplayMode = \`${escapedDisplayMode}\`;


    // --- 步驟 2: 標註工具的核心函式 (從原工具複製而來) ---
	const PUNCTS = new Set([
		'，', '。', '、', '；', '：', '！', '？', '（', '）', '「', '」', '『', '』', '《', '》', '〈', '〉', '—', '…', '－', '‧', '·', '﹑',
		',', '.', ';', ':', '!', '?', '(', ')', '[', ']', '{', '}', '"', "'", '-', '…'
	]);

	const ENDERS = new Set(['。', '！', '？', '?', '!', '．', '.']); 

	const WHITESPACES = new Set([' ', '\t', '\u3000']);
    const toCharArray = (str) => Array.from(str || '');
    const isPunct = (ch) => PUNCTS.has(ch);
    const isWhitespace = (ch) => WHITESPACES.has(ch);
    const isLineBreak = (ch) => ch === '\\r' || ch === '\\n';

    function segmentHanziByClauses(str) {
        const segs = []; let buf = '';
        for (const ch of toCharArray(str || '')) {
            if (isLineBreak(ch)) {
                if (buf) { segs.push({ type: 'seg', text: buf }); buf = ''; }
                segs.push({ type: 'br' }); continue;
            }
            buf += ch;
            if (isPunct(ch) && ENDERS.has(ch)) {
                segs.push({ type: 'seg', text: buf }); buf = '';
            }
        }
        if (buf) segs.push({ type: 'seg', text: buf });
        return segs;
    }

    function segmentPinyinRawByClauses(str) {
        const segs = []; let buf = '';
        for (const ch of toCharArray(str || '')) {
            if (isLineBreak(ch)) {
                if (buf.length) { segs.push({ type: 'seg', text: buf.trim() }); buf = ''; }
                segs.push({ type: 'br' }); continue;
            }
            buf += ch;
            if (isPunct(ch) && ENDERS.has(ch)) {
                segs.push({ type: 'seg', text: buf.trim() }); buf = '';
            }
        }
        if (buf.length) segs.push({ type: 'seg', text: buf.trim() });
        return segs;
    }

	// 斷詞：拼音音節（不含標點/換行）
	function tokenizeSyls(raw) {
		const syls = [];
		let token = '';
		for (const ch of toCharArray(raw || '')) {
			// 【核心修正】在判斷是否為標點時，排除連字號 '-' 和兩種中間點 '·', '‧'
			if (isLineBreak(ch) || isWhitespace(ch) || (isPunct(ch) && ch !== '-' && ch !== '·' && ch !== '‧')) {
				if (token.trim()) {
					syls.push(token.trim());
					token = '';
				}
				continue;
			}
			token += ch;
		}
		if (token.trim()) syls.push(token.trim());
		return syls;
	}  
	
	function tokenizeHanziWithAlphanum(text) {
		if (!text) return [];
		const regex = /([^\s\p{Script=Han}\p{P}]+|.)/gu;
		return text.match(regex) || [];
	}


    // --- 步驟 3: 動態內容生成函式 ---

    function renderContent() {
        const contentDiv = document.getElementById('content');
        if (!contentDiv) return;

        // 【新增】取得目前的顯示模式 (從後端傳入的變數)
        // 注意：這裡需要您在 buildExportHtml 的開頭變數定義區加入 phoneticDisplayMode
        // 但因為這裡是字串模板，我們直接在生成 HTML 時判斷即可
        
        const processClause = (hTokens, pSegSyls) => {
            let clauseHtml = '';
            let h_idx = 0;
            let p_idx = 0;

            // 【輔助】取得 RT 內容
            // 這裡讀取外部變數 phoneticDisplayMode
            const getRtContent = (pText) => {
                if (phoneticDisplayMode === 'vertical-zhuyin') return '';
                return pText;
            };

            while (h_idx < hTokens.length) {
                const hToken = hTokens[h_idx];

                if (hToken.length === 1 && (isWhitespace(hToken) || isPunct(hToken))) {
                    clauseHtml += \`<span class="punct">\${hToken}</span>\`;
                    h_idx++;
                    continue;
                }

                if (p_idx >= pSegSyls.length) {
                    clauseHtml += \`<ruby><rb>\${hToken}</rb><rt>&nbsp;</rt></ruby>\`;
                    h_idx++;
                    continue;
                }

                const pToken = pSegSyls[p_idx];
                const pSubSyls = pToken.split(/--?|=/);

                if (pSubSyls.length > 1) {
                    const wordLen = pSubSyls.length;
                    const hWordTokens = hTokens.slice(h_idx, h_idx + wordLen);
                    const hWord = hWordTokens.join('');

                    if (hWordTokens.length === wordLen) {
                        if (annotationMode === 'word') {
                            // 【修改】使用 getRtContent
                            clauseHtml += \`<ruby><rb>\${hWord}</rb><rt>\${getRtContent(pToken)}</rt></ruby>\`;
                        } else {
                            for (let i = 0; i < wordLen; i++) {
                                // 【修改】使用 getRtContent
                                clauseHtml += \`<ruby><rb>\${hTokens[h_idx + i]}</rb><rt>\${getRtContent(pSubSyls[i])}</rt></ruby>\`;
                            }
                        }
                        h_idx += wordLen;
                        p_idx++;
                    } else {
                        // 【修改】使用 getRtContent
                        clauseHtml += \`<ruby><rb>\${hToken}</rb><rt>\${getRtContent(pToken)}</rt></ruby>\`;
                        h_idx++;
                        p_idx++;
                    }
                } else {
                    if (hToken === pToken && /[a-zA-Z0-9]/.test(hToken)) {
                       clauseHtml += \`<span class="alphanum">\${hToken}</span>\`;
                    } else {
                       // 【修改】使用 getRtContent
                       clauseHtml += \`<ruby><rb>\${hToken}</rb><rt>\${getRtContent(pToken) || '&nbsp;'}</rt></ruby>\`;
                    }
                    h_idx++;
                    p_idx++;
                }
            }

            if (p_idx < pSegSyls.length) {
                const extraPinyin = pSegSyls.slice(p_idx).join(' ');
                clauseHtml += \`<ruby><rb>&nbsp;</rb><rt>\${extraPinyin}</rt></ruby>\`;
            }
            return clauseHtml;
        };
        
        let html = '';
        const hSegs = segmentHanziByClauses(hanzi || '');
        const pSegRaws = segmentPinyinRawByClauses(pinyin || '');
        
        let hSegIndex = 0;
        let pSegIndex = 0;
        while (hSegIndex < hSegs.length || pSegIndex < pSegRaws.length) {
            const hSeg = hSegs[hSegIndex];
            const pSeg = pSegRaws[pSegIndex];

            if (hSeg && hSeg.type === 'br') {
                html += '<br>';
                hSegIndex++;
                if (pSeg && pSeg.type === 'br') pSegIndex++;
                continue;
            }

            const currentHSegText = hSeg?.text || '';
            const currentPSegText = pSeg?.text || '';

            html += processClause(tokenizeHanziWithAlphanum(currentHSegText), tokenizeSyls(currentPSegText));

            hSegIndex++;
            pSegIndex++;
        }

        contentDiv.innerHTML = html;
    }

    // --- 步驟 4: 頁面載入後執行 ---
    document.addEventListener('DOMContentLoaded', () => {
        // 渲染內容
        renderContent();

        // 設定按鈕功能
        const toggleBtn = document.getElementById('togglePinyinBtn');
        const contentDiv = document.getElementById('content');
        if (toggleBtn && contentDiv) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = contentDiv.classList.toggle('pinyin-hidden');
                toggleBtn.textContent = isHidden ? '顯示拼音' : '隱藏拼音';
            });
        }
    });
    <\/script>
</body>
</html>`;
}


function fallbackDownload(filename, content) {
    const blob = new Blob([content], {
        type: 'text/html;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function toast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm rounded-full px-4 py-2 shadow z-50';
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transition = 'opacity .3s';
    }, 1400);
    setTimeout(() => {
        t.remove();
    }, 1800);
}

// 範例
btnSample?.addEventListener('click', () => {
    const sampleH = `看佢包包㘝㘝，毋知偷拿麼个？狗子一養啊出，狗嫲會煞煞摎厥胞衣舐淨來。`;
    const sampleP = `kon giˇ bauˊ bauˊ ngiabˋ ngiabˋ, mˇ diˊ teuˊ naˊ maˋ ge? ziiˋ idˋ iongˊ a cudˋ, gieuˋ maˇ voi sadˋ sadˋ lauˊ giaˊ bauˊ iˊ seˊ qiang loiˇ.`;
    hanziInput.value = sampleH;
    pinyinInput.value = sampleP;
    render();
});



// ==================================================================
// START: 全域點擊事件統一處理器
// ==================================================================

document.addEventListener('click', (e) => {
    const target = e.target;

    // --- 1. 處理「轉調號」與「字體」相關的所有點擊 ---
    const toggleBtn = target.closest('.btn-toggle-tone-converter');
    const setDefaultBtn = target.closest('.btn-set-tone-default');
    const convertBtn = target.closest('.btn-convert-default-tone');
    const fontBtn = target.closest('#btnFontFamily'); // 新增：偵測字體按鈕

    if (toggleBtn) { // 點擊「變更預設模式」
        e.stopPropagation();
        const menu = toggleBtn.closest('.relative').querySelector('.tone-converter-menu');
        if (menu) {
            menu.classList.remove('drop-up');
            const isHidden = menu.classList.contains('hidden');
            document.querySelectorAll('.popover').forEach(p => {
                if (p !== menu) p.classList.add('hidden');
            });
            menu.classList.toggle('hidden', !isHidden);
            if (!menu.classList.contains('hidden')) {
                const rect = menu.getBoundingClientRect();
                if (rect.bottom > window.innerHeight && rect.top > rect.height) {
                    menu.classList.add('drop-up');
                }
            }
        }
    } else if (fontBtn) { // 新增：點擊「字體」按鈕
        e.stopPropagation();
        const menu = document.getElementById('fontFamilyPopover');
        if (menu) {
            menu.classList.remove('drop-up');
            const isHidden = menu.classList.contains('hidden');
            // 關閉所有其他的 popover
            document.querySelectorAll('.popover').forEach(p => {
                if (p !== menu) p.classList.add('hidden');
            });
            menu.classList.toggle('hidden', !isHidden);
            // 檢查是否需要向上彈出
            if (!menu.classList.contains('hidden')) {
                const rect = menu.getBoundingClientRect();
                if (rect.bottom > window.innerHeight && rect.top > rect.height) {
                    menu.classList.add('drop-up');
                }
            }
        }
    } else if (setDefaultBtn) { // 點擊設定預設模式的按鈕
        const newType = setDefaultBtn.dataset.type;
        if (newType && (newType === 'letter' || newType === 'number')) {
            defaultToneConversionType = newType;
            saveSetting(AppConfig.storageKeys.TONE_CONVERSION_DEFAULT, newType);
            updateAllToneConverterUIs();
            const menu = setDefaultBtn.closest('.tone-converter-menu');
            if (menu) menu.classList.add('hidden');
        }
    } else if (convertBtn) { // 點擊「預設轉換」按鈕
        const editor = convertBtn.closest('#inputSection, .inline-editor, .word-editor');
        if (editor) {
            const pinyinField = editor.querySelector('#pinyinInput, .ed-p, .ed-p-word');
            if (pinyinField) {
                pinyinField.value = convertPinyinTones(pinyinField.value, defaultToneConversionType);
                pinyinField.focus();
            }
        }
    }

    // --- 2. 處理頁面其他地方的點擊 ---

    // a) 如果點擊的不是任何彈出選單的觸發區域，則關閉所有開啟的選單
    if (!target.closest('.relative') && !target.closest('#languageSwitcher')) {
        document.querySelectorAll('.popover, #menuMore').forEach(menu => {
            menu.classList.add('hidden');
        });
    }

    // b) 關閉單詞編輯器 (如果點擊在外部)
    const wordEditor = document.querySelector('.word-editor');
    if (wordEditor && !wordEditor.contains(target) && !target.closest('ruby.glyph')) {
        closeWordEditor();
    }
}, true);
// ==================================================================
// END: 全域點擊事件統一處理器
// ==================================================================



/**
 * 轉換拼音中的聲調字母/數字為調號
 * @param {string} text - 輸入的拼音字串
 * @param {'letter'|'number'} type - 轉換類型
 * @returns {string} 轉換後的字串
 */
function convertPinyinTones(text, type) {
    const letterMap = { 'z': 'ˊ', 'v': 'ˇ', 's': 'ˋ', 'x': 'ˆ', 'f': '⁺' };
    const numberMap = { '2': 'ˊ', '3': 'ˇ', '4': 'ˋ', '5': 'ˆ', '6': '⁺', '7': '⁺' };
    const baseChars = '[aeioumngbdr]';
    let regex;
    let currentMap;

    // 使用 'u' 旗標來支援 Unicode 屬性 \p{P} (標點)
    // 新規則：(母音/鼻音) + (聲調字/數) + (斷點：空白、標點或結尾)
    const lookahead = '(?=\\s|\\p{P}|$)';

    if (type === 'letter') {
        regex = new RegExp(`(${baseChars})([zvsxf])${lookahead}`, 'giu');
        currentMap = letterMap;
    } else { // number
        regex = new RegExp(`(${baseChars})([234567])${lookahead}`, 'giu');
        currentMap = numberMap;
    }

    return text.replace(regex, (match, p1, p2) => {
        const tone = currentMap[p2.toLowerCase()];
        return tone ? p1 + tone : match;
    });
}

// 點播按鈕事件
btnPlayAudio?.addEventListener('click', () => {
    isAudioMode = !isAudioMode; // 切換點播模式狀態
    btnPlayAudio.classList.toggle('active', isAudioMode);
    
    // 直接重新渲染，render() 函式會根據 isAudioMode 的最新狀態來決定是否附加聲音事件
    // 這樣可以確保在任何情況下都能正確地開啟或關閉點播功能
    if (mode === 'view') {
        render();
    }
});

// ==================================================================
// START: 語言切換核心功能
// ==================================================================

/**
 * 動態載入指定語言的 JS 資料庫檔案
 * @param {string} langKey - LANGUAGES 物件中的鍵 (例如 'kasu')
 */
function loadLanguageDatabase(langKey) {
  const SCRIPT_ID = 'language-db-script';
  const existingScript = document.getElementById(SCRIPT_ID);
  if (existingScript) {
    existingScript.remove(); // 移除舊的語言資料庫 script
  }

  const langConfig = LANGUAGES[langKey];
  if (!langConfig) {
    console.error(`找不到語言設定: ${langKey}`);
    return;
  }

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = langConfig.file;
  script.onload = () => {
    //console.log(`${langConfig.name} (${langConfig.file}) 資料庫載入成功。`);
    // 載入成功後，呼叫 hanzitopinyin.js 中的函數來初始化轉換器
    initializeConverter();
  };
  script.onerror = () => {
    console.error(`${langConfig.file} 資料庫載入失敗。`);
    // 即使失敗也要呼叫初始化，讓它清空舊規則
    initializeConverter(); 
  };
  
  document.head.appendChild(script);
}

/**
 * 根據當前選擇的語言來更新 UI (按鈕文字和選單高亮)
 */
function updateLanguageUI() {
  if (!languageMenu || !currentLanguageName) return;
  
  // 1. 更新主按鈕顯示的語言名稱
  currentLanguageName.textContent = LANGUAGES[currentLanguageKey]?.name || '未知語言';
  
  // 2. 重新產生語言選單
  languageMenu.innerHTML = ''; // 清空舊選單
  Object.keys(LANGUAGES).forEach(key => {
    const button = document.createElement('button');
    button.dataset.lang = key;
    button.className = 'lang-choice w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-50';
    button.textContent = LANGUAGES[key].name;
    if (key === currentLanguageKey) {
      button.classList.add('active'); // 高亮當前語言
    }
    languageMenu.appendChild(button);
  });
}

/**
 * 根據當前選擇的語言更新網頁標題和主標題
 */
function updateTitles() {
    const langConfig = LANGUAGES[currentLanguageKey];
    if (!langConfig || !mainTitle) return;

    const newPageTitle = `烏衣行 ${langConfig.name} × 拼音`;
    const newMainTitle = `烏衣行 ${langConfig.name} × 拼音`;

    // 更新瀏覽器分頁的標題
    document.title = newPageTitle;
    
    // 更新頁面上的 H1 主標題
    mainTitle.textContent = newMainTitle;

    // 讓標題變成可點擊的連結
    mainTitle.style.cursor = 'pointer';
    mainTitle.onclick = () => {
        if (langConfig.url) {
            window.open(langConfig.url, '_blank');
        }
    };
}

// ==========================================
// 控制「原始拼音」按鈕的可見性 (全域函數)
// ==========================================
function updateRawButtonVisibility() {
    // 每次執行時重新抓取按鈕，確保一定抓得到
    const actRaw = document.getElementById('actHanziToPinyinRaw');
    if (!actRaw) return;
    
    // 檢查全域變數 currentLanguageKey
    if (typeof currentLanguageKey !== 'undefined' && currentLanguageKey === 'kasu') {
        actRaw.classList.remove('hidden'); 
    } else {
        actRaw.classList.add('hidden');
    }
}

/**
 * 處理語言切換的邏輯
 * @param {string} newLangKey - 使用者選擇的新語言鍵
 */
function switchLanguage(newLangKey) {
    if (newLangKey === currentLanguageKey || !LANGUAGES[newLangKey]) {
        languageMenu.classList.add('hidden');
        return; 
    }

    currentLanguageKey = newLangKey;
    saveSetting(AppConfig.storageKeys.SELECTED_LANGUAGE, newLangKey);
    
    // --- START: 修改的 URL 處理邏輯 ---
    // 1. 取得目前的模式，並決定對應的 URL 參數值
    const modeParam = (inputMode === 'pinyin-to-hanzi') ? 'p2h' : 'h2p';

    // 2. 使用 URLSearchParams 來安全地建立新的查詢字串
    const url = new URL(window.location);
    url.searchParams.set('lang', newLangKey);
    url.searchParams.set('mode', modeParam);

    // 3. 使用 history.pushState 來更新網址，這樣不會觸發頁面重整
    window.history.pushState({path: url.href}, '', url.href);
    // --- END: 修改的 URL 處理邏輯 ---

    updateLanguageUI();
    updateTitles();
    loadLanguageDatabase(newLangKey); 
	updateRawButtonVisibility();
    
    btnClear.click();
    toast(`已切換至 ${LANGUAGES[newLangKey].name}`);
    languageMenu.classList.add('hidden');
}

// ==================================================================
// END: 語言切換核心功能
// ==================================================================


(function init() {
    const btnPinyinToHanzi = document.getElementById('btnPinyinToHanzi');

    // --- START: 網站啟動邏輯修改 ---
    const urlParams = new URLSearchParams(window.location.search);
    
    // 1. 讀取語言設定 (優先順序: URL > Local Storage > 預設值)
    const langFromUrl = urlParams.get('lang');
    if (langFromUrl && LANGUAGES[langFromUrl]) {
        currentLanguageKey = langFromUrl;
    } else {
        currentLanguageKey = loadSetting(AppConfig.storageKeys.SELECTED_LANGUAGE, 'kasu');
    }

    // 2. 讀取模式設定 (優先順序: URL > Local Storage > 預設值)
    const modeFromUrl = urlParams.get('mode');
    let initialMode;

    if (modeFromUrl === 'p2h') {
        initialMode = 'pinyin-to-hanzi';
        // 當網址參數存在時，更新 Local Storage 以保持同步
        saveSetting(AppConfig.storageKeys.INPUT_MODE, initialMode); 
    } else if (modeFromUrl === 'h2p') {
        initialMode = 'hanzi-to-pinyin';
        // 當網址參數存在時，更新 Local Storage 以保持同步
        saveSetting(AppConfig.storageKeys.INPUT_MODE, initialMode);
    } else {
        // 若 URL 沒有指定模式，才從 Local Storage 讀取舊設定
        initialMode = loadSetting(AppConfig.storageKeys.INPUT_MODE, 'hanzi-to-pinyin');
    }
    // --- END: 網站啟動邏輯修改 ---

    updateLanguageUI();
	updateTitles();
    loadLanguageDatabase(currentLanguageKey);


    // 監聽分頁按鈕點擊
    btnModeHanziToPinyin.addEventListener('click', () => setInputMode('hanzi-to-pinyin'));
    btnModePinyinToHanzi.addEventListener('click', () => setInputMode('pinyin-to-hanzi'));


    // 監聽新的複製按鈕點擊
    btnCopy.addEventListener('click', async () => {
        let contentToCopy = '';
        // 根據目前模式，決定要複製哪個欄位的內容
        if (inputMode === 'hanzi-to-pinyin') {
            contentToCopy = pinyinInput.value;
        } else { // pinyin-to-hanzi
            contentToCopy = hanziInput.value;
        }

        if (contentToCopy) {
            try {
                await navigator.clipboard.writeText(contentToCopy);
                toast('已複製下方欄位的內容！');
            } catch (err) {
                console.error('無法複製文字: ', err);
                toast('複製失敗！');
            }
        } else {
            toast('下方欄位沒有內容可複製。');
        }
    });

    btnLanguage?.addEventListener('click', (e) => {
        e.stopPropagation();
        languageMenu?.classList.toggle('hidden');
    });

    languageMenu?.addEventListener('click', (e) => {
        const target = e.target.closest('.lang-choice');
        if (target && target.dataset.lang) {
            switchLanguage(target.dataset.lang);
        }
    });

    mode = 'view';
    fontSize = DEFAULT_FONT;
    applyTypography();
    updateAllToneConverterUIs();

	setInputMode(initialMode, true);

    // --- 可收合面板功能 (維持不變) ---
    const mainGrid = document.getElementById('mainGrid');
    const inputSection = document.getElementById('inputSection');
    const resultSection = document.getElementById('resultSection');
    const inputHeader = document.getElementById('inputHeader');
    const resultHeader = document.getElementById('resultHeader');
    const resetToDefault = () => {
        inputSection.classList.remove('is-collapsed');
        resultSection.classList.remove('is-collapsed');
        mainGrid.classList.remove('lg:grid-cols-[68px,1fr]', 'lg:grid-cols-[1fr,68px]');
        mainGrid.classList.add('lg:grid-cols-2');
        inputModeToggle.classList.remove('hidden');
    };
    const collapseInput = () => {
        inputSection.classList.add('is-collapsed');
        resultSection.classList.remove('is-collapsed');
        mainGrid.classList.remove('lg:grid-cols-2', 'lg:grid-cols-[1fr,68px]');
        mainGrid.classList.add('lg:grid-cols-[68px,1fr]');
        inputModeToggle.classList.add('hidden');
    };
    const collapseResult = () => {
        resultSection.classList.add('is-collapsed');
        inputSection.classList.remove('is-collapsed');
        mainGrid.classList.remove('lg:grid-cols-2', 'lg:grid-cols-[68px,1fr]');
        mainGrid.classList.add('lg:grid-cols-[1fr,68px]');
        inputModeToggle.classList.remove('hidden');
    };
    const inputIcon = inputHeader.querySelector('.material-symbols-outlined');
    const resultIcon = resultHeader.querySelector('.material-symbols-outlined');
    if (inputIcon && resultIcon) {
        const originalInputIcon = inputIcon.textContent;
        const originalResultIcon = resultIcon.textContent;
        inputHeader.addEventListener('mouseover', () => { inputIcon.textContent = inputSection.classList.contains('is-collapsed') ? 'add' : 'remove'; });
        inputHeader.addEventListener('mouseout', () => { inputIcon.textContent = originalInputIcon; });
        resultHeader.addEventListener('mouseover', () => { resultIcon.textContent = resultSection.classList.contains('is-collapsed') ? 'add' : 'remove'; });
        resultHeader.addEventListener('mouseout', () => { resultIcon.textContent = originalResultIcon; });
    }
    inputHeader.addEventListener('click', () => { (inputSection.classList.contains('is-collapsed') || resultSection.classList.contains('is-collapsed')) ? resetToDefault() : collapseInput(); });
    resultHeader.addEventListener('click', () => { (resultSection.classList.contains('is-collapsed') || inputSection.classList.contains('is-collapsed')) ? resetToDefault() : collapseResult(); });





 

    // --- START: 字體切換功能 (最終修復版) ---
    if (btnFontFamily && fontFamilyPopover) {

        // 步驟 1: 處理「字體」按鈕的點擊，直接切換選單的顯示狀態
        btnFontFamily.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止事件向上傳播，避免干擾
            fontFamilyPopover.classList.toggle('hidden');
        });

        // 步驟 2: 處理選單內「黑體/楷體」選項的點擊
        fontFamilyPopover.querySelectorAll('.font-choice').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // 同樣阻止事件傳播
                const selectedFont = btn.dataset.font;

                // 移除所有選項的 'active' 樣式，再為被點擊的選項加上
                fontFamilyPopover.querySelectorAll('.font-choice').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 根據選擇來新增或移除 'font-kai' class
                if (selectedFont === 'kai') {
                    resultArea.classList.add('font-kai');
                } else {
                    resultArea.classList.remove('font-kai'); // 選擇黑體時，移除楷體樣式，恢復預設
                }

                // 選擇後，自動關閉選單
                fontFamilyPopover.classList.add('hidden');
            });
        });

        // 步驟 3: 監聽整個頁面的點擊，如果點在選單和按鈕以外的區域，就關閉選單
        document.addEventListener('click', (e) => {
            // 檢查選單是否可見，以及點擊事件是否發生在選單或按鈕之外
            const isMenuOpen = !fontFamilyPopover.classList.contains('hidden');
            const clickedOutside = !btnFontFamily.contains(e.target) && !fontFamilyPopover.contains(e.target);

            if (isMenuOpen && clickedOutside) {
                fontFamilyPopover.classList.add('hidden');
            }
        });
    }
    // --- END: 字體切換功能 ---


	// ==========================================
	// 下拉選單與空格斷詞 (FMM演算法)
	// ==========================================

	// 1. 選單控制邏輯
	const btnMenuToggle = document.getElementById('btnHanziToPinyinMenuToggle');
	const menuHanzi = document.getElementById('menuHanziToPinyin');
	const actSpaceSeg = document.getElementById('actSpaceSegmentation');
	const actDefault = document.getElementById('actHanziToPinyin');

	// 點擊小三角形切換選單顯示
	btnMenuToggle?.addEventListener('click', (e) => {
		e.stopPropagation();
		// 關閉其他可能開啟的選單
		document.querySelectorAll('.popover').forEach(p => p.classList.add('hidden'));
		menuHanzi.classList.toggle('hidden');
	});

	// 點擊「漢字轉拼音」選項 (執行預設功能並關閉選單)
	actDefault?.addEventListener('click', () => {
		hanziToPinyin();
		menuHanzi.classList.add('hidden');
	});

	// 點擊「空格斷詞」選項
	actSpaceSeg?.addEventListener('click', () => {
		segmentHanzi(); // 執行斷詞函數
		menuHanzi.classList.add('hidden');
	});

	// 點擊頁面其他地方關閉選單
	document.addEventListener('click', (e) => {
		if (menuHanzi && !menuHanzi.contains(e.target) && !btnMenuToggle.contains(e.target)) {
			menuHanzi.classList.add('hidden');
		}
	});

	// 取得新按鈕
	const actRaw = document.getElementById('actHanziToPinyinRaw');

	// 1. 綁定點擊事件
	actRaw?.addEventListener('click', () => {
		hanziToPinyin('raw'); // 呼叫時帶入 'raw' 參數
		menuHanzi.classList.add('hidden');
	});

	// 2. 核心函數：空格斷詞 (使用正向最大匹配法 FMM)
	function segmentHanzi() {
		const text = hanziInput.value;
		const pinyinOutput = document.getElementById('pinyinInput');
		const btn = document.getElementById('actSpaceSegmentation'); // 這是選單裡的按鈕 ID

		// 1. 安全地獲取資料庫 (同時支援 window.pinyinMap 和全域 pinyinMap)
		// 這是為了防止 "語言資料庫尚未載入" 的錯誤
		const map = window.pinyinMap || (typeof pinyinMap !== 'undefined' ? pinyinMap : null);

		// 2. 基本檢查
		if (!text) {
			toast('請先在漢字區輸入文字');
			return;
		}

		if (!map || map.size === 0) {
			toast('錯誤：語言資料庫尚未載入。請確認 hanzitopinyin.js 中已加入 "window.pinyinMap = pinyinMap;"');
			console.error("無法讀取 pinyinMap。請檢查 hanzitopinyin.js 是否已修改。");
			return;
		}

		// 3. UI 狀態：顯示「處理中」並鎖定按鈕
		// 保存原始按鈕內容以便稍後還原
		let originalBtnContent = '';
		if (btn) {
			originalBtnContent = btn.innerHTML;
			// 使用 Tailwind 的 animate-spin 讓圖示旋轉
			btn.innerHTML = `
				<span class="material-symbols-outlined text-[18px] text-orange-500 animate-spin">progress_activity</span> 
				<span>處理中...</span>
			`;
			btn.disabled = true;
		}

		// 4. 使用 setTimeout 延遲執行，讓瀏覽器有時間先渲染 UI (防凍結)
		setTimeout(() => {
			const startTime = performance.now(); // 計時開始

			// --- 核心演算法：正向最大匹配法 (FMM) ---
			
			// A. 計算資料庫中最長詞彙的長度
			let maxLen = 0;
			for (const key of map.keys()) {
				if (key.length > maxLen) maxLen = key.length;
			}

			// B. 開始掃描
			let i = 0;
			const len = text.length;
			const resultTokens = [];

			while (i < len) {
				let matched = false;
				
				// 從最大可能長度開始嘗試匹配，不能超過剩餘字串長度
				let currentMax = Math.min(maxLen, len - i);
				
				for (let l = currentMax; l >= 1; l--) {
					const sub = text.substr(i, l);
					
					// 檢查是否在資料庫中
					if (map.has(sub)) {
						resultTokens.push(sub);
						i += l; // 跳過已匹配的長度
						matched = true;
						break; // 找到最長匹配，跳出內部迴圈
					}
				}
				
				// 如果都沒有匹配 (例如標點符號、或不在字典裡的罕用字)
				if (!matched) {
					resultTokens.push(text[i]); // 將單字作為一個 token
					i++;
				}
			}

			// --- 演算法結束 ---

			// 5. 輸出結果
			if (pinyinOutput) {
				let raw = resultTokens.join(' ');
				let lines = raw.split('\n').map(line => {
					let processed = line.replace(/ +/g, ' ');
					processed = processed.replace(/^ +| +$/g, '');
					if (processed.length > 0) {
						return ' ' + processed + ' ';
					}
					return processed;
				});
				pinyinOutput.value = lines.join('\n');
			}

			// 6. 恢復 UI 狀態
			if (btn) {
				btn.innerHTML = originalBtnContent;
				btn.disabled = false;
			}

			// 7. 顯示完成訊息
			const endTime = performance.now();
			const duration = ((endTime - startTime) / 1000).toFixed(2);
			//toast(`斷詞完成！(耗時 ${duration} 秒)`);

		}, 20); // 延遲 20ms 啟動，確保 UI 不會卡死
	}

    // 加入拼音轉漢字的初始化與事件綁定
    initializeImeDicts();
    // 將事件綁定到正確的按鈕上 (因為 HTML 中有兩個同功能按鈕)
    document.querySelector('#btnPinyinToHanzi').addEventListener('click', pinyinToHanzi);
	updateRawButtonVisibility();
})();


// =================================================================
// 拼音注音轉換工具 (Phonetic Conversion Utility)
// =================================================================
let pinyinToZhuyinMap = null;

/**
 * 建立一個從拼音到注音的映射表，並依拼音長度排序以確保轉換正確性。
 * @returns {Array<[string, string]>} 排序後的轉換陣列。
 */
function buildPinyinToZhuyinMap() {
    if (pinyinToZhuyinMap) return pinyinToZhuyinMap;

    const conversionPairs = [];
    // 從 arr_pz 全域變數中每兩個元素建立一個配對
    for (let i = 0; i < arr_pz.length; i += 2) {
        if (arr_pz[i] && arr_pz[i + 1] !== undefined) {
            conversionPairs.push([arr_pz[i], arr_pz[i + 1]]);
        }
    }

    // 關鍵步驟：依拼音長度從長到短排序，避免 "iang" 被 "ang" 錯誤地先轉換
    conversionPairs.sort((a, b) => b[0].length - a[0].length);

    pinyinToZhuyinMap = conversionPairs;
    return pinyinToZhuyinMap;
}

/**
 * 將拼音字串轉換為注音字串。
 * @param {string} pinyinString - 原始的拼音字串。
 * @returns {string} 轉換後的注音字串。
 */
function convertPinyinToZhuyin(pinyinString) {
    if (!pinyinString) return "";

    const map = buildPinyinToZhuyinMap();
    let result = pinyinString;

    // 規則：一個或多個連字號 (-) 取代為一個空格
    result = result.replace(/-+/g, ' ');

    // 依據預先排序好的映射表進行批次取代
    for (const [pinyin, zhuyin] of map) {
        // 使用 RegExp 的 'g' 旗標來取代所有出現的實例
        result = result.replace(new RegExp(pinyin, 'g'), zhuyin);
    }

    return result;
}

const arr_pz = ["ainn","","iang","","iong","","iung","","uang","","inn","","eeu","","een","","eem","","eed","","eeb","","enn","","onn","","ang","","iag","","ied","","ien","","ong","","ung","","iid","","iim","","iin","","iab","","iam","","iau","","iog","","ieb","","iem","","ieu","","iug","","iun","","uad","","uai","","uan","","ued","","uen","","iui","","ioi","","iud","","ion","","iib","","ab","","ad","","ag","","ai","","am","","an","","au","","ed","","en","","eu","","ee","","oo","","er","","id","","in","","iu","","od","","og","","oi","","ud","","ug","","un","","em","","ii","","on","","ui","","eb","","io","","ia","","ib","","ie","","im","","ua","","bb","","a","","e","","i","","o","","u","","ng","","rh","","r","","zh","","ch","","sh","","b","","p","","m","","f","","d","","t","","n","","l","","g","","k","","h","","j","","q","","x","","z","","c","","s","","v",""];


document.getElementById('btnHanziToPinyin').addEventListener('click', () => {
  hanziToPinyin();
});


// ==========================================
// 新增：拼音區工具選單 (全半形、大小寫)
// ==========================================

(function setupPunctuationTools() {
    const container = document.getElementById('btnPunctuationContainer');
    const btnMain = document.getElementById('btnTogglePunctuation');
    const btnToggle = document.getElementById('btnPunctuationMenuToggle');
    const menu = document.getElementById('menuPunctuation');
    
    const actToggle = document.getElementById('actTogglePunctuation');
    const actCapitalize = document.getElementById('actCapitalize');
    const actLowercase = document.getElementById('actLowercase');

    if (!container) return;

    // 1. 選單開關邏輯
    btnToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        // 關閉其他選單
        document.querySelectorAll('.popover').forEach(p => {
             if(p.id !== 'menuPunctuation') p.classList.add('hidden');
        });
        // 切換自己
        menu.classList.toggle('hidden');
    });

    // 點擊外部關閉
    document.addEventListener('click', (e) => {
        if (menu && !menu.contains(e.target) && !btnToggle.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });

    // --------------------------------------
    // 功能 A: 全/半形切換 (主按鈕 & 選單項目)
    // --------------------------------------
    const doTogglePunctuation = () => {
        const pinyinInput = document.getElementById('pinyinInput');
        const currentText = pinyinInput.value;
        if (!currentText) {
            toast('拼音區沒有內容可轉換。');
            return;
        }

        const fullToHalf = {
            '，': ',', '。': '.', '？': '?', '！': '!', '；': ';', 
            '：': ':', '（': '(', '）': ')', '、': ','
        };
        const halfToFull = {
            ',': '，', '.': '。', '?': '？', '!': '！', ';': '；', 
            ':': '：', '(': '（', ')': '）'
        };
        const fullWidthRegex = new RegExp(Object.keys(fullToHalf).join('|'), 'g');
        const halfWidthRegex = /(?<!\.)\.(?!\.)|[\,\?\!\;\:\(\)]/g;
        const fullWidthPattern = /[，。？！；：（）、]/;

        if (fullWidthPattern.test(currentText)) {
            // 全形轉半形
            let newText = currentText.replace(fullWidthRegex, match => fullToHalf[match]);
            newText = newText.replace(/([,\.\?!;\:\(\)])([a-zA-Z0-9])/g, '$1 $2');
            pinyinInput.value = newText;
            toast('標點轉為半形');
        } else {
            // 半形轉全形
            let newText = currentText.replace(halfWidthRegex, match => halfToFull[match] || match);
            newText = newText.replace(/\s*([，。？！；：（）、])\s*/g, '$1');
            pinyinInput.value = newText;
            toast('標點轉為全形');
        }
    };

    btnMain.addEventListener('click', doTogglePunctuation);
    actToggle.addEventListener('click', () => {
        doTogglePunctuation();
        menu.classList.add('hidden');
    });

    // --------------------------------------
    // 功能 B: 句首大寫
    // --------------------------------------

    actCapitalize.addEventListener('click', () => {
        const pinyinInput = document.getElementById('pinyinInput');
        let text = pinyinInput.value;
        if (!text) return;

        // 修正說明：
        // 1. 使用 'u' 旗標：開啟 Unicode 模式。
        // 2. 使用 \p{Ll} ：代表 "Lowercase Letter" (任何 Unicode 小寫字母)。
        
        text = text.replace(/(^|[.?!。？！\n]\s*)([\p{Ll}])/gu, (match) => {
            return match.toUpperCase();
        });

        pinyinInput.value = text;
        toast('已句首大寫');
        menu.classList.add('hidden');
    });
    // --------------------------------------
    // 功能 C: 全部小寫
    // --------------------------------------
    actLowercase.addEventListener('click', () => {
        const pinyinInput = document.getElementById('pinyinInput');
        if (!pinyinInput.value) return;
        
        pinyinInput.value = pinyinInput.value.toLowerCase();
        
        toast('已轉換為小寫字母');
        menu.classList.add('hidden');
    });


	// --------------------------------------
	// 功能 D: 全部大寫
	// --------------------------------------
	actUppercase?.addEventListener('click', () => {
		const pinyinInput = document.getElementById('pinyinInput');
		if (!pinyinInput.value) return;

		pinyinInput.value = pinyinInput.value.toUpperCase();
		
		toast('已轉換為大寫字母');
		menu.classList.add('hidden');
	});
})();