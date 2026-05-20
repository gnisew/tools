window.addEventListener('focus', () => {
    const pInput = document.getElementById('pinyinInput');
    if (document.activeElement === pInput) {
        pInput.blur();
        setTimeout(() => pInput.focus(), 10);
    }
});

// === 1. 使用者設定與狀態 ===
let userConfig = {
    dialect: 'sixian',
    kasuSpelling: 'mixed',
    fontSize: 'text-2xl', pageSize: 10, layoutMode: 'single', clearAction: 'esc',
    reqToneSingle: true, reqToneMulti: false, allowAbbrMulti: true,
    showRuby: true, singleCharMode: false, continuousMode: false,
    allowToneInContinuous: false,
    enablePredictiveText: false,
    predCangjie: 'none',
    predXiami: 'none',
    predHanglie: 'none',
    saveEditorContent: true 
};

const savedUserConfig = localStorage.getItem('hakka_user_config');
if (savedUserConfig) {
    userConfig = { ...userConfig, ...JSON.parse(savedUserConfig) };
}

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('lang')) {
    userConfig.dialect = urlParams.get('lang');
} else {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('lang', userConfig.dialect);
    window.history.replaceState({}, '', newUrl);
}

// === 【核心合併】：動態載入雲端「中文對應檔」並建立翻譯辭典 ===
let chineseToHakkaMap = new Map();
let currentTranslationEngine = null;

function buildChineseTranslationMap() {
    chineseToHakkaMap.clear();
    currentTranslationEngine = null;
    
    if (typeof ww !== 'undefined') {
        try {
            if (typeof replaceChars === 'function') {
                let formattedArray = ww.split("\t").map(item => {
                    let [count, stringA, stringB] = item.split("=");
                    count = count ? parseInt(count) : 0;
                    stringB = stringB ? stringB : stringA;
                    stringA = stringA || '';
                    
                    stringA = replaceChars(stringA, txtAA, txtKK);
                    stringB = replaceChars(stringB, txtAA, txtGG);
                    stringA = replaceChars(stringA, txtEE, txtAA);
                    stringB = replaceChars(stringB, txtEE, txtAA);
                    
                    return { count, hakka: stringA, chinese: stringB };
                });

                formattedArray.forEach(item => {
                    if (!item.chinese) return;
                    if (!chineseToHakkaMap.has(item.chinese)) {
                        chineseToHakkaMap.set(item.chinese, []);
                    }
                    chineseToHakkaMap.get(item.chinese).push(item);
                });

                chineseToHakkaMap.forEach((list, key) => {
                    list.sort((a, b) => b.count - a.count);
                    let uniqueHakka = [...new Set(list.map(x => x.hakka))];
                    chineseToHakkaMap.set(key, uniqueHakka);
                });

                if (typeof setupDictionaries === 'function') {
                    currentTranslationEngine = setupDictionaries(ww);
                }
            } 
            else {
                const entries = ww.split('\t');
                entries.forEach(entry => {
                    const parts = entry.split('=');
                    if (parts.length >= 2) {
                        let hakka = parts[1].replace(/[a-zA-Z]/g, ''); 
                        let chinese = (parts.length >= 3 && parts[2]) ? parts[2] : parts[1];
                        chinese = chinese.replace(/[a-zA-Z]/g, '');

                        if (chinese && hakka) {
                            if (!chineseToHakkaMap.has(chinese)) chineseToHakkaMap.set(chinese, []);
                            if (!chineseToHakkaMap.get(chinese).includes(hakka)) {
                                chineseToHakkaMap.get(chinese).push(hakka);
                            }
                        }
                    }
                });
            }
        } catch (e) {
            console.error("解析翻譯字典檔失敗", e);
        }
    }
}

function loadChineseTranslationDict(dialect) {
    const dictNameMap = { 'sixian': 'sixian', 'sixiannan': 'sixiannan', 'hailu': 'hailu', 'dapu': 'dapu', 'raoping': 'raoping', 'kasu': 'kasu', 'holo': 'holo' };
    const dialectKey = dictNameMap[dialect];
    
    chineseToHakkaMap.clear();
    currentTranslationEngine = null;
    
    if (!dialectKey) return; 

    const scriptId = 'dict-chinese-bridge';
    const oldScript = document.getElementById(scriptId);
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://gnisew.github.io/tools/translate/data-${dialectKey}-chinese.js`;
    script.onload = () => {
        buildChineseTranslationMap();
    };
    script.onerror = () => console.warn(`無法載入 ${dialectKey} 的中文對應檔`);
    document.head.appendChild(script);
}

loadChineseTranslationDict(userConfig.dialect);

// === DOM: 編輯區 & 🥷特效 & 自動存檔機制 ===
const editor = document.getElementById('editor');
const ninjaBtn = document.getElementById('ninjaBtn');

if (ninjaBtn) {
    ninjaBtn.addEventListener('click', () => {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
            });
        }
    });
}

if (editor && userConfig.saveEditorContent) {
    const savedEditorContent = localStorage.getItem('hakka_editor_content');
    if (savedEditorContent !== null) {
        editor.value = savedEditorContent;
    }
}

if (editor) {
    editor.addEventListener('input', () => {
        if (userConfig.saveEditorContent) {
            localStorage.setItem('hakka_editor_content', editor.value);
        }
    });
}

// === 2. 核心字典引擎與聲調/聯想詞轉換系統 ===
let dictionaryData = [];
let dictionaryMap = new Map();

function formatRelated(rawStr) {
    if (!rawStr) return '';
    let s = rawStr.replace(/\d+\s*\./g, ''); 
    s = s.replace(/[　,，、\s]+/g, ';'); 
    return s.replace(/^;+|;+$/g, ''); 
}

function formatPinyin(rawPy) {
    if (!rawPy) return '';
    return rawPy.replace(/[\u4e00-\u9fa5\(\)\[\]（）【】<>《》]|\p{Script=Han}/gu, ' ').replace(/\s+/g, ' ').trim();
}

function cleanRelatedWords(rawStr) {
    if (!rawStr) return [];
    let cleaned = formatRelated(rawStr);
    if (!cleaned) return [];
    return cleaned.split(';');
}


const toneMappings = {
    'sixian': { '24': { mark: 'ˊ', letter: 'z' }, '11': { mark: 'ˇ', letter: 'v' }, '31': { mark: 'ˋ', letter: 's' }, '55': { mark: '', letter: '' }, '2': { mark: 'ˋ', letter: 's' }, '5': { mark: '', letter: '' }, '33': { mark: '⁺', letter: 'f' } },
    'sixiannan': { '24': { mark: 'ˊ', letter: 'z' }, '11': { mark: 'ˇ', letter: 'v' }, '31': { mark: 'ˋ', letter: 's' }, '55': { mark: '', letter: '' }, '2': { mark: 'ˋ', letter: 's' }, '5': { mark: '', letter: '' }, '33': { mark: '⁺', letter: 'f' } },
    'hailu': { '53': { mark: 'ˋ', letter: 's' }, '55': { mark: '', letter: '' }, '24': { mark: 'ˊ', letter: 'z' }, '11': { mark: 'ˇ', letter: 'v' }, '33': { mark: '⁺', letter: 'f' }, '5': { mark: '', letter: '' }, '2': { mark: 'ˋ', letter: 's' } },
    'dapu': { '33': { mark: '⁺', letter: 'f' }, '35': { mark: 'ˊ', letter: 'z' }, '113':{ mark: 'ˇ', letter: 'v' }, '31': { mark: 'ˆ', letter: 'x' }, '53': { mark: 'ˋ', letter: 's' }, '21': { mark: 'ˆ', letter: 'x' }, '54': { mark: 'ˋ', letter: 's' } },
    'raoping': { '11': { mark: 'ˇ', letter: 'v' }, '55': { mark: '', letter: '' }, '53': { mark: 'ˋ', letter: 's' }, '24': { mark: 'ˊ', letter: 'z' }, '2': { mark: 'ˋ', letter: 's' }, '5': { mark: '', letter: '' } },
    'kasu': { '11': { mark: 'ˇ', letter: 'v' }, '53': { mark: 'ˋ', letter: 's' }, '31': { mark: 'ˆ', letter: 'x' }, '55': { mark: '', letter: '' }, '24': { mark: 'ˊ', letter: 'z' }, '43': { mark: 'ˋ', letter: 's' } },
    'holo': { '1': { mark: '', letter: '' }, '2': { mark: 'ˊ', letter: 'z' }, '3': { mark: 'ˋ', letter: 's' }, '5': { mark: 'ˆ', letter: 'x' }, '7': { mark: '⁺', letter: 'f' }, '8': { mark: '̍', letter: 'l' } },
    'jinmen': { '1': { mark: '', letter: '' }, '2': { mark: 'ˊ', letter: 'z' }, '3': { mark: 'ˋ', letter: 's' }, '5': { mark: 'ˆ', letter: 'x' }, '7': { mark: '⁺', letter: 'f' }, '8': { mark: '̍', letter: 'l' } },
    'matsu': { '1': { mark: '', letter: '' }, '2': { mark: '⁺', letter: 'f' }, '3': { mark: 'ˇ', letter: 'v' }, '4': { mark: 'ˊ', letter: 'z' }, '5': { mark: 'ˋ', letter: 's' }, '7': { mark: 'ˆ', letter: 'x' }, '8': { mark: '', letter: '' } },
    'cangjie': {}, 'xiami': {}, 'hanglie': {} 
};

function normalizeHakkaPinyin(raw, targetDialect = userConfig.dialect) {
    if (!raw) return '';
    let cleaned = raw.replace(/[-=　]+/g, ' ').trim();
    const dictNameMap = { 'sixian': 'sixian', 'sixiannan': 'sixiannan', 'hailu': 'hailu', 'dapu': 'dapu', 'raoping': 'raoping', 'kasu': 'kasu', 'holo': 'holo', 'jinmen': 'jinmen', 'matsu': 'matsu', 'cangjie': 'cangjie', 'xiami': 'xiami', 'hanglie': 'hanglie' };
    const dialectKey = dictNameMap[targetDialect] || 'sixian';
    if (['cangjie', 'xiami', 'hanglie'].includes(dialectKey)) return cleaned.toLowerCase();

    const currentToneMap = toneMappings[dialectKey] || toneMappings['sixian'];
    const reverseMap = {};
    for (let num in currentToneMap) {
        const { mark, letter } = currentToneMap[num];
        if (mark) { reverseMap[mark] = num; if (mark === 'ˆ') reverseMap['^'] = num; }
        if (letter) reverseMap[letter] = num;
    }

    return cleaned.split(/\s+/).map(syllable => {
        const match = syllable.match(/^([a-zA-Z]+?)(ˊ|ˇ|ˋ|⁺|ˆ|\^|z|v|s|f|x|l|\d+)?$/i);
        if (match) {
            let py = match[1].toLowerCase();
            let tone = match[2] ? match[2].toLowerCase() : '';
            let numTone = '';
            
            if (reverseMap[tone]) numTone = reverseMap[tone];
            else if (/^\d+$/.test(tone)) numTone = tone;
            else if (tone === '') {
                let defaultTone = Object.keys(currentToneMap).find(k => currentToneMap[k].mark === '');
                numTone = defaultTone || '55'; 
            } else return syllable; 
            
            return py + numTone;
        }
        return syllable;
    }).join(' ');
}

function convertRawPinyinToMarked(rawPy, targetDialect = userConfig.dialect) {
    if (!rawPy) return '';
    const dictNameMap = { 'sixian': 'sixian', 'sixiannan': 'sixiannan', 'hailu': 'hailu', 'dapu': 'dapu', 'raoping': 'raoping', 'kasu': 'kasu', 'holo': 'holo', 'jinmen': 'jinmen', 'matsu': 'matsu', 'cangjie': 'cangjie', 'xiami': 'xiami', 'hanglie': 'hanglie' };
    const dialectKey = dictNameMap[targetDialect] || 'sixian';
    if (['cangjie', 'xiami', 'hanglie'].includes(dialectKey)) return rawPy.toUpperCase();

    let processPy = rawPy;
    if (dialectKey === 'kasu') {
        processPy = normalizeKasuToTraditional(rawPy);
    }

    const currentToneMap = toneMappings[dialectKey] || toneMappings['sixian'];
    let syllables = processPy.split(/\s+/);
    let marked = syllables.map(s => {
        let match = s.match(/^([a-zA-Z]+)(\d+)$/);
        if (match) {
            let py = match[1]; let tone = match[2];
            let mark = currentToneMap[tone] ? currentToneMap[tone].mark : tone;
            return py + mark;
        }
        return s;
    });
    return marked.join(' ');
}

// === 🟢 新增：詔安客語 (Kasu) 拼音轉換工具 ===
function normalizeKasuToSimplified(rawPy) {
    if (!rawPy) return '';
    return rawPy.split(/\s+/).map(s => {
        let match = s.match(/^([a-zA-Z]+)(\d*)$/);
        if (match) {
            let py = match[1]; let tone = match[2];
            if (py.startsWith('rh')) py = 'r' + py.slice(2);
            if (py.startsWith('bb')) py = 'v' + py.slice(2);
            if (py.endsWith('oo')) py = py.slice(0, -1);
            return py + tone;
        }
        return s;
    }).join(' ');
}

function normalizeKasuToTraditional(rawPy) {
    if (!rawPy) return '';
    return rawPy.split(/\s+/).map(s => {
        let match = s.match(/^([a-zA-Z]+)(\d*)$/);
        if (match) {
            let py = match[1]; let tone = match[2];
            
            // r 開頭轉 rh，v 開頭轉 bb
            if (py.startsWith('r') && !py.startsWith('rh')) py = 'rh' + py.slice(1);
            if (py.startsWith('v') && !py.startsWith('bb')) py = 'bb' + py.slice(1);
            
            // 🟢 修改：當結尾是 o 時的例外處理
            if (py.endsWith('o') && !py.endsWith('oo')) {
                // 檢查是否為 n, ng, m 接 o (也就是 no, ngo, mo)。加上 i 確保大小寫都支援
                if (!/^(n|ng|m)o$/i.test(py)) {
                    py = py + 'o'; // 如果不是這三個，才轉為 oo
                }
            }
            return py + tone;
        }
        return s;
    }).join(' ');
}
// ===========================================



function getPinyinOfWord(word) {
    const found = dictionaryData.find(d => d.w === word && !d.isPunctuation);
    return found ? convertRawPinyinToMarked(found.rawPy) : word;
}

function addWordToDict(word, rawPinyin, saveToCustom = false, rawSynonyms = '', rawAntonyms = '', isPunctuation = false, targetDialect = userConfig.dialect) {
    let pyT = ''; let pyN = ''; let pyA = ''; 
    let cleanedRawPy = rawPinyin;
    let pyRegexExact = null; let pyRegexPartial = null; // 🟢 新增：儲存正則表達式

    if (targetDialect === 'kasu' && !isPunctuation) {
        cleanedRawPy = normalizeKasuToSimplified(cleanedRawPy);
    }

    if (isPunctuation) {
        pyT = cleanedRawPy; pyN = cleanedRawPy; pyA = cleanedRawPy;
        // 🟢 針對標點符號的跳脫處理
        let escaped = pyT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pyRegexExact = new RegExp('^' + escaped + '$');
        pyRegexPartial = new RegExp('^' + escaped);
    } else {

        let normalizedPy = normalizeHakkaPinyin(rawPinyin, targetDialect);
        let cleaned = normalizedPy.replace(/[^a-zA-Z0-9\s]/g, '');
        cleaned = cleaned.replace(/(\d)([a-zA-Z])/g, '$1 $2');
        cleanedRawPy = cleaned.trim().replace(/\s+/g, ' ');

        pyT = cleaned;
        let pyRegexStr = cleaned; // 🟢 新增：用來建立彈性聲調比對字串

        const dictNameMap = { 'sixian': 'sixian', 'sixiannan': 'sixiannan', 'hailu': 'hailu', 'dapu': 'dapu', 'raoping': 'raoping', 'kasu': 'kasu', 'holo': 'holo', 'jinmen': 'jinmen', 'matsu': 'matsu', 'cangjie': 'cangjie', 'xiami': 'xiami', 'hanglie': 'hanglie' };
        const dialectKey = dictNameMap[targetDialect] || 'sixian';
        const currentToneMap = toneMappings[dialectKey] || toneMappings['sixian'];
        
        const sortedNums = Object.keys(currentToneMap).sort((a,b) => b.length - a.length);
        sortedNums.forEach(num => {
            const regex = new RegExp(num, 'g');
            const letter = currentToneMap[num].letter;
            pyT = pyT.replace(regex, letter);
            pyRegexStr = pyRegexStr.replace(regex, letter ? `(?:${letter})?` : ''); 
        });
        
        pyT = pyT.replace(/\s+/g, '').toLowerCase();
        pyRegexStr = pyRegexStr.replace(/\s+/g, '').toLowerCase(); 

        if (!window.globalRegexCache) window.globalRegexCache = new Map();
        
        let exactKey = 'E_' + pyRegexStr;
        let partialKey = 'P_' + pyRegexStr;

        if (window.globalRegexCache.has(exactKey)) {
            pyRegexExact = window.globalRegexCache.get(exactKey);
            pyRegexPartial = window.globalRegexCache.get(partialKey);
        } else {
            pyRegexExact = new RegExp('^' + pyRegexStr + '$');
            pyRegexPartial = new RegExp('^' + pyRegexStr);
            window.globalRegexCache.set(exactKey, pyRegexExact);
            window.globalRegexCache.set(partialKey, pyRegexPartial);
        }
            
        let pyNWithSpace = cleaned.replace(/[0-9]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
        pyN = pyNWithSpace.replace(/\s+/g, '');
        
        const initialsRegex = /^(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r|[aeiou])/;
        pyNWithSpace.split(' ').forEach(syllable => {
            if (!syllable) return;
            const match = syllable.match(initialsRegex);
            if (match) pyA += match[1]; else pyA += syllable[0];
        });
    }

    if (!pyN) return false; 
    const finalRawPyToSave = isPunctuation ? rawPinyin : cleanedRawPy;

    if (targetDialect !== userConfig.dialect) {
        if (saveToCustom) {
            let existingCustom = customDictionaryRaw.find(item => (item.dialect || 'sixian') === targetDialect && item.w === word && item.rawPy === finalRawPyToSave);
            if (existingCustom) {
                const newSyns = cleanRelatedWords(rawSynonyms);
                const newAnts = cleanRelatedWords(rawAntonyms);
                let isNew = false;
                if (rawSynonyms.trim() !== '' || rawAntonyms.trim() !== '') {
                    if (newSyns.length > 0) {
                        const merged = [...new Set([...cleanRelatedWords(existingCustom.rawSyn), ...newSyns])].join(';');
                        if (merged !== existingCustom.rawSyn) { existingCustom.rawSyn = merged; isNew = true; }
                    }
                    if (newAnts.length > 0) {
                        const merged = [...new Set([...cleanRelatedWords(existingCustom.rawAnt), ...newAnts])].join(';');
                        if (merged !== existingCustom.rawAnt) { existingCustom.rawAnt = merged; isNew = true; }
                    }
                }
                return isNew;
            } else {
                if (typeof isRedundantWord === 'function' && isRedundantWord(word, finalRawPyToSave, rawSynonyms, rawAntonyms, targetDialect)) {
                    return false; 
                }
                customDictionaryRaw.push({ dialect: targetDialect, w: word, rawPy: finalRawPyToSave, rawSyn: rawSynonyms, rawAnt: rawAntonyms });
                return true;
            }
        }
        return false;
    }

    const uniqueKey = `${word}|${pyT}|${pyN}`; 

    if (!dictionaryMap.has(uniqueKey)) {
        const newItem = { 
            w: word, pyT: pyT, pyN: pyN, pyA: pyA, len: word.length,
            synonyms: cleanRelatedWords(rawSynonyms), antonyms: cleanRelatedWords(rawAntonyms),
            rawPy: finalRawPyToSave, isPunctuation: isPunctuation,
            pyRegexExact: pyRegexExact, pyRegexPartial: pyRegexPartial
        };
        dictionaryData.push(newItem);
        dictionaryMap.set(uniqueKey, newItem);
        
        if (saveToCustom) {
            if (typeof isRedundantWord === 'function' && isRedundantWord(word, finalRawPyToSave, rawSynonyms, rawAntonyms, userConfig.dialect)) {
            } else {
                customDictionaryRaw.push({ dialect: userConfig.dialect, w: word, rawPy: finalRawPyToSave, rawSyn: rawSynonyms, rawAnt: rawAntonyms });
            }
        }
        return true;
    } else {
        const existingItem = dictionaryMap.get(uniqueKey);
        const newSyns = cleanRelatedWords(rawSynonyms);
        const newAnts = cleanRelatedWords(rawAntonyms);
        
        if (newSyns.length > 0) existingItem.synonyms = [...new Set([...existingItem.synonyms, ...newSyns])];
        if (newAnts.length > 0) existingItem.antonyms = [...new Set([...existingItem.antonyms, ...newAnts])];
        
        if (saveToCustom) {
            if (rawSynonyms.trim() !== '' || rawAntonyms.trim() !== '') {
                const customExists = customDictionaryRaw.some(item => (item.dialect || 'sixian') === userConfig.dialect && item.w === word && item.rawPy === finalRawPyToSave && item.rawSyn === rawSynonyms && item.rawAnt === rawAntonyms);
                if (!customExists) {
                    if (typeof isRedundantWord === 'function' && isRedundantWord(word, finalRawPyToSave, rawSynonyms, rawAntonyms, userConfig.dialect)) {
                        return false; 
                    }
                    customDictionaryRaw.push({ dialect: userConfig.dialect, w: word, rawPy: finalRawPyToSave, rawSyn: rawSynonyms, rawAnt: rawAntonyms });
                    return true; 
                }
            }
        }
        return false;
    }
}

const punctuationMap = {
    ',': ['，'], '.': ['。'], '?': ['？'], ';': ['；'], ':': ['：'], "'": ['、'], '!': ['！'],
    '[': ['「'], ']': ['」'], '{': ['『'], '}': ['』'], '(': ['（'], ')': ['）'],
    '-': ['──'], '_': ['＿＿'], '~': ['～'], '"': ['……'], '<': ['《', '〈'], '>': ['》', '〉'],
    '/': ['／'], '`': ['．']
};

function loadDefaultDictionary() {
    const dictNameMap = { 'sixian': 'sixian', 'sixiannan': 'sixiannan', 'hailu': 'hailu', 'dapu': 'dapu', 'raoping': 'raoping', 'kasu': 'kasu', 'holo': 'holo', 'jinmen': 'jinmen', 'matsu': 'matsu', 'cangjie': 'cangjie', 'xiami': 'xiami', 'hanglie': 'hanglie' };
    const targetDictName = dictNameMap[userConfig.dialect] || 'sixian';
    
    if (typeof dictionaries !== 'undefined' && dictionaries[targetDictName]) {
        const targetDict = dictionaries[targetDictName];
        for (let py in targetDict) {
            const words = targetDict[py].split(' ');
            words.forEach(w => { if (w.trim()) addWordToDict(w, py, false); });
        }
    }

    addWordToDict('包山塞海', 'bau55 san24 sed2 hoi11', false, '1.包山包海 2.掖蔴掖米 3.弛崗打陣', '小家子氣');
    
    const isShapeWithPunc = userConfig.dialect === 'xiami' || userConfig.dialect === 'hanglie';
    if (isShapeWithPunc) {
        const specialPuncs = ['，', '。', '？', '！', '……', '、', '；', '：', '「', '」', '『', '』', '（', '）', '──', '＿＿', '～', '《', '〈', '》', '〉', '／', '．'];
        specialPuncs.forEach(char => addWordToDict(char, "'", false, '', '', true));
    } else {
        for (let key in punctuationMap) {
            punctuationMap[key].forEach(char => addWordToDict(char, key, false, '', '', true));
        }
    }

    if (typeof window.customExtDicts !== 'undefined' && Array.isArray(window.customExtDicts)) {
        const wordToPinyinCache = {};
        dictionaryData.forEach(d => {
            if (!d.isPunctuation) {
                if (!wordToPinyinCache[d.w]) wordToPinyinCache[d.w] = [];
                wordToPinyinCache[d.w].push(d.rawPy); 
            }
        });

        window.customExtDicts.forEach(item => {
            const itemDialect = item.d || item.dialect || 'sixian'; 
            if (itemDialect === userConfig.dialect && Array.isArray(item.matrix)) {
                item.matrix.forEach(row => {
                    let word = row[0]; let pinyin = row[1]; let syn = row[2] || ''; let ant = row[3] || '';
                    if (!pinyin && wordToPinyinCache[word] && wordToPinyinCache[word].length === 1) {
                        pinyin = wordToPinyinCache[word][0];
                    }
                    if (word && pinyin) addWordToDict(word, pinyin, false, syn, ant);
                });
            }
        });
    }
}
loadDefaultDictionary();

let customDictionaryRaw = [];
function loadCustomDictionary() {
    const saved = localStorage.getItem('hakka_custom_dict_v3');
    if (saved) {
        customDictionaryRaw = JSON.parse(saved);
        customDictionaryRaw.forEach(item => {
            const itemDialect = item.dialect || 'sixian'; 
            if (itemDialect === userConfig.dialect) {
                addWordToDict(item.w, item.rawPy, false, item.rawSyn, item.rawAnt);
            }
        });
    }
}
loadCustomDictionary();

// === 3. DOM Elements & UI ===
const customDialogModal = document.getElementById('customDialogModal');
const customDialogBox = document.getElementById('customDialogBox');
const customDialogTitle = document.getElementById('customDialogTitle');
const customDialogMessage = document.getElementById('customDialogMessage');
const customDialogIcon = document.getElementById('customDialogIcon');
const customDialogCancelBtn = document.getElementById('customDialogCancelBtn');
const customDialogConfirmBtn = document.getElementById('customDialogConfirmBtn');
let dialogConfirmCallback = null; let dialogCancelCallback = null;

function showDialog({ type = 'alert', title = '提示', message, icon = 'ℹ️', confirmText = '確定', cancelText = '取消', confirmColor = 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20', onConfirm, onCancel }) {
    if(!customDialogTitle) return; 
    customDialogTitle.textContent = title;
    customDialogMessage.innerHTML = message.replace(/\n/g, '<br>'); 
    customDialogIcon.textContent = icon;
    customDialogConfirmBtn.textContent = confirmText; customDialogCancelBtn.textContent = cancelText;
    customDialogConfirmBtn.className = `px-5 py-2 text-white rounded-lg transition font-medium shadow-md text-sm ${confirmColor}`;
    if (type === 'confirm') customDialogCancelBtn.classList.remove('hidden'); else customDialogCancelBtn.classList.add('hidden');
    dialogConfirmCallback = onConfirm; dialogCancelCallback = onCancel;
    customDialogModal.classList.remove('hidden');
    setTimeout(() => { customDialogModal.classList.remove('opacity-0'); customDialogBox.classList.remove('scale-95'); }, 10);
}
function closeDialog() {
    if(!customDialogModal) return;
    customDialogModal.classList.add('opacity-0'); customDialogBox.classList.add('scale-95');
    setTimeout(() => { customDialogModal.classList.add('hidden'); }, 200);
}
if(customDialogConfirmBtn) customDialogConfirmBtn.addEventListener('click', () => { closeDialog(); if (dialogConfirmCallback) dialogConfirmCallback(); });
if(customDialogCancelBtn) customDialogCancelBtn.addEventListener('click', () => { closeDialog(); if (dialogCancelCallback) dialogCancelCallback(); });

const pinyinInput = document.getElementById('pinyinInput');
const candidateArea = document.getElementById('candidateArea');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const csvUpload = document.getElementById('csvUpload');
const editorLabel = document.getElementById('editorLabel');
const modeToggleBtn = document.getElementById('modeToggleBtn');
let currentInputMode = 'Han'; 

if(modeToggleBtn) modeToggleBtn.addEventListener('click', () => {
    if (currentInputMode === 'Han') {
        currentInputMode = 'Yin'; modeToggleBtn.textContent = '音';
        modeToggleBtn.className = 'h-12 px-2.5 sm:px-4 shrink-0 text-emerald-600 font-bold hover:bg-emerald-50 transition outline-none whitespace-nowrap';
    } else {
        currentInputMode = 'Han'; modeToggleBtn.textContent = '漢';
        updateModeToggleBtnColor();
    }
    if (pinyinInput && pinyinInput.value) pinyinInput.dispatchEvent(new Event('input'));
});

const langToggleBtn = document.getElementById('langToggleBtn');
const langMenu = document.getElementById('langMenu');
const displayNames = {
    'sixian': '四縣', 'sixiannan': '南四縣', 'hailu': '海陸', 'dapu': '大埔',
    'raoping': '饒平', 'kasu': '詔安', 'holo': '台語', 'jinmen': '金門',
    'matsu': '馬祖', 'cangjie': '倉頡', 'xiami': '蝦米', 'hanglie': '行列'
};
const shortNames = {
    'sixian': '四', 'sixiannan': '南', 'hailu': '海', 'dapu': '大',
    'raoping': '平', 'kasu': '安', 'holo': '台', 'jinmen': '金',
    'matsu': '馬', 'cangjie': '倉', 'xiami': '蝦', 'hanglie': '行'
};

function updateLangBtnText(dialect) {
    if (langToggleBtn) {
        langToggleBtn.innerHTML = `
            <span class="sm:hidden">${shortNames[dialect]}</span>
            <span class="hidden sm:inline">${displayNames[dialect]}</span>
            <span class="text-[10px] opacity-60 ml-0.5">▼</span>
        `;
    }
}

function updateModeToggleBtnColor() {
    if (!modeToggleBtn || currentInputMode !== 'Han') return;
    
    const baseClass = 'h-12 px-2.5 sm:px-4 shrink-0 font-bold transition outline-none whitespace-nowrap';
    
    if (userConfig.continuousMode) {
        modeToggleBtn.className = `${baseClass} text-purple-600 hover:bg-purple-50`;
    } else if (userConfig.singleCharMode) {
        modeToggleBtn.className = `${baseClass} text-rose-600 hover:bg-rose-50`;
    } else if (userConfig.reqToneSingle) {
        modeToggleBtn.className = `${baseClass} text-blue-700 hover:bg-blue-50`;
    } else {
        modeToggleBtn.className = `${baseClass} text-emerald-600 hover:bg-emerald-50`;
    }
}

updateLangBtnText(userConfig.dialect);
updateModeToggleBtnColor();

if(langToggleBtn) langToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if(langMenu) { langMenu.classList.toggle('hidden'); langMenu.classList.toggle('flex'); }
});

document.addEventListener('click', (e) => {
    if (langToggleBtn && !langToggleBtn.contains(e.target) && langMenu && !langMenu.contains(e.target)) {
        langMenu.classList.add('hidden'); langMenu.classList.remove('flex');
    }
});

document.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const newLang = e.target.dataset.lang;
        if(langMenu) { langMenu.classList.add('hidden'); langMenu.classList.remove('flex'); }
        
        if (userConfig.dialect !== newLang) {
            userConfig.dialect = newLang;
            localStorage.setItem('hakka_user_config', JSON.stringify(userConfig));
            
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('lang', newLang);
            window.history.replaceState({}, '', newUrl);

            updateLangBtnText(newLang);
            loadChineseTranslationDict(newLang);
            
            dictionaryData = []; dictionaryMap.clear();
            loadDefaultDictionary();
            customDictionaryRaw.forEach(item => {
                const itemDialect = item.dialect || 'sixian';
                if (itemDialect === userConfig.dialect) addWordToDict(item.w, item.rawPy, false, item.rawSyn, item.rawAnt);
            });
            updateDictCount(); 
            if(pinyinInput) { pinyinInput.value = ''; pinyinInput.focus(); }
            currentCandidates = []; renderCandidates();
        }
    });
});

// === 3. 處理拼音輸入與狀態 ===
let currentCandidates = []; let currentPage = 0; let isExpanded = false;     
let savedPinyin = ''; let numberFilter = ''; let isSemicolonMode = false; 
let isSubListMode = false; let subListCandidates = []; let subListTitle = '';

function selectCandidate(char) {
    let textToInsert = char;
    
    if (char.startsWith('*')) {
        textToInsert = char.replace(/\*/g, '');
    }

    if (currentInputMode === 'Yin' && !char.startsWith('*')) {
        const isPinyinWord = /[a-zA-Z]/.test(char);
        if (isPinyinWord && editor) {
            const startPos = editor.selectionStart;
            if (startPos > 0) {
                const lastChar = editor.value.substring(startPos - 1, startPos);
                if (/[a-zA-Z0-9ˊˇˋˆ⁺^+]/.test(lastChar)) { textToInsert = ' ' + char; }
            }
        }
    }
    insertTextAtCursor(editor, textToInsert);
    
    if(pinyinInput) {
        pinyinInput.value = ''; isExpanded = false; numberFilter = ''; savedPinyin = '';   
        isSemicolonMode = false; isSubListMode = false; subListCandidates = [];
        
        if (userConfig.enablePredictiveText) {
            setTimeout(showPredictiveCandidates, 50);
        } else {
            pinyinInput.dispatchEvent(new Event('input')); pinyinInput.focus();
        }
    }
}

if(pinyinInput) pinyinInput.addEventListener('input', function(e) {
    let rawInputVal = e.target.value;
    let triggeredSpace = false;
    
    if (rawInputVal.includes(' ') || rawInputVal.includes('　')) {
        triggeredSpace = true;
        rawInputVal = rawInputVal.replace(/[\s　]/g, '');
        e.target.value = rawInputVal;
    }

    rawInputVal = rawInputVal.trim();
    let inputVal = rawInputVal.toLowerCase();
    
    currentCandidates = []; currentPage = 0; isExpanded = false; numberFilter = '';  
    savedPinyin = ''; isSemicolonMode = false; isSubListMode = false; subListCandidates = [];
    
    if (rawInputVal === '') {
        if(candidateArea) candidateArea.innerHTML = ''; 
        if(candidateWindow) candidateWindow.classList.add('hidden');
        if(inlineControls) inlineControls.classList.add('hidden');
        const setBtn = document.getElementById('openSettingsBtn');
        if(setBtn) setBtn.classList.remove('hidden'); 
        
        // 如果全空狀態下按了空白鍵，維持清空即可
        if (triggeredSpace) e.target.dispatchEvent(new Event('input'));
        return;
    }

    const isChinese = /[\u4e00-\u9fa5]|\p{Script=Han}/u.test(rawInputVal);
    
    if (isChinese) {
        let exactMatches = [];
        
        if (currentInputMode === 'Han') {
            if (chineseToHakkaMap.has(rawInputVal)) {
                exactMatches = chineseToHakkaMap.get(rawInputVal);
            }

            if (exactMatches.length > 0) {
                currentCandidates = exactMatches;
            } else {
                let resultStr = "";
                let i = 0;
                while (i < rawInputVal.length) {
                    let matched = false;
                    for (let len = 6; len > 0; len--) {
                        if (i + len <= rawInputVal.length) {
                            let subStr = rawInputVal.substring(i, i + len);
                            if (chineseToHakkaMap.has(subStr)) {
                                resultStr += chineseToHakkaMap.get(subStr)[0]; 
                                i += len;
                                matched = true;
                                break;
                            }
                        }
                    }
                    if (!matched) {
                        resultStr += rawInputVal[i];
                        i++;
                    }
                }
                currentCandidates = [resultStr];
            }
        } else {
            dictionaryData.forEach(d => {
                if (d.w === rawInputVal && !d.isPunctuation) {
                    let py = convertRawPinyinToMarked(d.rawPy);
                    if (!exactMatches.includes(py)) exactMatches.push(py);
                }
            });
            
            if (exactMatches.length === 0 && chineseToHakkaMap.has(rawInputVal)) {
                let translatedHakkaList = chineseToHakkaMap.get(rawInputVal) || [];
                translatedHakkaList.forEach(hw => {
                    let py = getPinyinOfWord(hw);
                    if (py && py !== hw && !exactMatches.includes(py)) {
                        exactMatches.push(py);
                    }
                });
            }

            if (exactMatches.length > 0) {
                currentCandidates = exactMatches;
            } else {
                currentCandidates = ['(無對應拼音)'];
            }
        }

        renderCandidates();
        
        if (triggeredSpace) {
            const firstBtn = candidateArea ? candidateArea.querySelector('button') : null;
            if (firstBtn) firstBtn.click();
        }
        return; 
    }

    let exactFullSet = new Set();   
    let exactAbbrSet = new Set();   
    let partialFullSet = new Set(); 
    let partialAbbrSet = new Set();

    const isContinuous = userConfig.continuousMode && currentInputMode === 'Han';

    // 連打模式下，保留引號讓 Tokenizer 進行強制分詞；單字模式才把引號濾掉
    const isQuoteAbbr = inputVal.includes("'") && inputVal.length > 1;
    let cleanInputVal = (isQuoteAbbr && !isContinuous) ? inputVal.replace(/'/g, '') : inputVal;

    if (userConfig.dialect === 'kasu') {
        const mode = userConfig.kasuSpelling || 'mixed';
        if (mode === 'mixed' || mode === 'traditional') {
            inputVal = inputVal.replace(/rh/g, 'r').replace(/bb/g, 'v').replace(/oo/g, 'o');
            cleanInputVal = cleanInputVal.replace(/rh/g, 'r').replace(/bb/g, 'v').replace(/oo/g, 'o');
        }
    }

    dictionaryData.forEach(item => {
        // 🟢 加入 pyRegexExact, pyRegexPartial 解構
        const { w, pyT, pyN, pyA, len, isPunctuation, pyRegexExact, pyRegexPartial } = item;
        
        if (userConfig.singleCharMode && len > 1 && !isPunctuation) return;

        let allowToneless = (len === 1 && !userConfig.reqToneSingle) || (len >= 2 && !userConfig.reqToneMulti);
        let allowAbbr = (len >= 2 && userConfig.allowAbbrMulti); 

        // 🟢 智慧混打比對：如果允許免調，只要符合我們剛剛建立的彈性 Regex 就算過關！
        let isFullExact = !isQuoteAbbr && (
            (pyT === inputVal) || 
            (allowToneless && (pyN === inputVal || (pyRegexExact && pyRegexExact.test(inputVal))))
        );
        let isAbbrExact = !isFullExact && (allowAbbr && cleanInputVal.length > 0 && pyA === cleanInputVal);
        let isFullPartial = !isFullExact && !isAbbrExact && !isQuoteAbbr && (
            pyT.startsWith(inputVal) || 
            (allowToneless && (pyN.startsWith(inputVal) || (pyRegexPartial && pyRegexPartial.test(inputVal))))
        );
        let isAbbrPartial = !isFullExact && !isAbbrExact && !isFullPartial && (allowAbbr && cleanInputVal.length > 0 && pyA && pyA.startsWith(cleanInputVal));

        if (isFullExact || isAbbrExact || isFullPartial || isAbbrPartial) {
            let targetOutput = (currentInputMode === 'Yin' && !isPunctuation) ? convertRawPinyinToMarked(item.rawPy) : w;
            
            if (isFullExact) {
                exactFullSet.add(targetOutput);
            } else if (isAbbrExact) {
                exactAbbrSet.add(targetOutput);
            } else if (isFullPartial) {
                partialFullSet.add(targetOutput);
            } else if (isAbbrPartial) {
                partialAbbrSet.add(targetOutput);
            }
        }
    });

    let exactFull = Array.from(exactFullSet);
    
    if (currentInputMode === 'Han' && window.tonelessPriority && window.tonelessPriority[userConfig.dialect]) {
        const inputRegex = (typeof getInputToneRegex === 'function') ? getInputToneRegex(isContinuous) : /[zvsfxl0-9^⁺ˆˇˋˊ]+$/i;
        const priorityStr = window.tonelessPriority[userConfig.dialect][cleanInputVal.replace(inputRegex, '')];
        if (priorityStr) {
            exactFull.sort((a, b) => {
                let idxA = priorityStr.indexOf(a); let idxB = priorityStr.indexOf(b);
                if (idxA === -1) idxA = 9999; if (idxB === -1) idxB = 9999;
                return idxA - idxB;
            });
        }
    }

    if (isContinuous && cleanInputVal.length > 2) {
        exactAbbrSet.clear(); partialAbbrSet.clear();
    }

    currentCandidates = Array.from(new Set([
        ...exactFull, 
        ...exactAbbrSet, 
        ...partialFullSet, 
        ...partialAbbrSet
    ]));

    if (isContinuous && cleanInputVal.length > 1) {
        const predictedSentence = smartContinuousMatch(inputVal, userConfig.dialect);
        // 如果推測結果不是全英文 (代表有轉換成功)
        if (predictedSentence && !/^[a-zA-Z0-9']+$/.test(predictedSentence)) {
            currentCandidates = currentCandidates.filter(c => c !== predictedSentence);
            currentCandidates.unshift(predictedSentence); // 強制置頂
        }
    }

    const isShapeWithPunc = userConfig.dialect === 'xiami' || userConfig.dialect === 'hanglie';
    if (!isShapeWithPunc && inputVal.length === 1 && punctuationMap[inputVal] && currentCandidates.length === 1) {
        selectCandidate(currentCandidates[0]); return;
    }
    
    renderCandidates();
    
    if (triggeredSpace) {
        const firstBtn = candidateArea ? candidateArea.querySelector('button') : null;
        if (firstBtn) firstBtn.click();
    }
});

const candidateWindow = document.getElementById('candidateWindow');
const inlineControls = document.getElementById('inlineControls');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const toggleExpandBtn = document.getElementById('toggleExpandBtn');

// 關閉候選窗功能 
const closeCandidateBtn = document.getElementById('closeCandidateBtn');
if (closeCandidateBtn) {
    closeCandidateBtn.addEventListener('click', () => {
        if (candidateWindow) candidateWindow.classList.add('hidden');
        if (inlineControls) inlineControls.classList.add('hidden');
        const setBtn = document.getElementById('openSettingsBtn');
        if (setBtn) setBtn.classList.remove('hidden');
        
        // 清空拼音輸入框，完美還原初始狀態
        if (pinyinInput) {
            pinyinInput.value = '';
            currentCandidates = [];
            isSubListMode = false;
            pinyinInput.dispatchEvent(new Event('input'));
            pinyinInput.focus();
        }
    });
}


function renderCandidates() {
    if(!candidateArea) return;
    candidateArea.innerHTML = '';
    const activeList = isSubListMode ? subListCandidates : currentCandidates;
    const setBtn = document.getElementById('openSettingsBtn'); 
    
    const isPredictive = activeList.length > 0 && typeof activeList[0] === 'string' && activeList[0].startsWith('*');

    if (activeList.length === 0 || (pinyinInput.value.trim() === '' && !isPredictive)) { 
        if(candidateWindow) candidateWindow.classList.add('hidden');
        if(inlineControls) inlineControls.classList.add('hidden');
        if(setBtn) setBtn.classList.remove('hidden'); 
        return; 
    }

    if(candidateWindow) candidateWindow.classList.remove('hidden');
    if(inlineControls) inlineControls.classList.remove('hidden');
    if(setBtn) setBtn.classList.add('hidden');
    if(inlineControls) inlineControls.classList.remove('hidden');
    if(setBtn) setBtn.classList.add('hidden');

    let displayCandidates = [];
    let renderPageSize = isExpanded ? 100 : userConfig.pageSize;
    let totalPages = 1;

    if (isExpanded && !isSubListMode) {
        let filteredList = [];
        activeList.forEach((char, i) => {
            const absIdxStr = (i + 1).toString();
            if (numberFilter === '' || absIdxStr.startsWith(numberFilter)) {
                filteredList.push({ char, displayIndex: absIdxStr });
            }
        });
        
        totalPages = Math.ceil(filteredList.length / renderPageSize) || 1;
        if (currentPage >= totalPages) currentPage = Math.max(0, totalPages - 1);
        
        const startIndex = currentPage * renderPageSize;
        displayCandidates = filteredList.slice(startIndex, startIndex + renderPageSize);
    } else {
        totalPages = Math.ceil(activeList.length / renderPageSize) || 1;
        if (currentPage >= totalPages) currentPage = Math.max(0, totalPages - 1);
        
        const startIndex = currentPage * renderPageSize;
        const pageItems = activeList.slice(startIndex, startIndex + renderPageSize);
        const tenthLabel = (userConfig.dialect === 'xiami' || userConfig.dialect === 'hanglie') ? ':' : ';';

        pageItems.forEach((char, i) => {
            let displayLabel = (isSubListMode || !isSemicolonMode || i >= 10) ? (i === 9 ? 0 : i + 1).toString() : ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', tenthLabel][i];
            displayCandidates.push({ char, displayIndex: displayLabel });
        });
    }

    if (isSubListMode) {
        const titleTag = document.createElement('div');
        titleTag.className = 'w-full text-xs font-bold text-blue-700 px-2 py-1 bg-blue-50 border border-blue-200/60 rounded-md mb-1';
        titleTag.textContent = subListTitle; candidateArea.appendChild(titleTag);
    }

    if(toggleExpandBtn) {
        toggleExpandBtn.textContent = `${currentPage + 1}/${totalPages}`;
        if (isExpanded) {
            toggleExpandBtn.className = 'text-xs font-mono font-bold text-white bg-blue-500 hover:bg-blue-600 px-1.5 sm:px-2 h-7 mx-0.5 rounded transition tracking-wider flex items-center justify-center shadow-sm';
            if(candidateWindow) candidateWindow.classList.add('expanded-view'); 
        } else {
            toggleExpandBtn.className = 'text-xs font-mono font-bold text-slate-400 hover:text-slate-800 hover:bg-slate-100 px-1.5 sm:px-2 h-7 mx-0.5 rounded transition tracking-wider flex items-center justify-center';
            if(candidateWindow) candidateWindow.classList.remove('expanded-view'); 
            if (isSubListMode) { toggleExpandBtn.classList.add('hidden'); }
        }
    }
    
    if(prevPageBtn) prevPageBtn.disabled = currentPage === 0;
    if(nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages - 1;

    candidateArea.classList.remove('gap-2', 'gap-1', 'gap-0.5'); candidateArea.classList.add('gap-x-0', 'gap-y-1');
    const synKeys  = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
    const antLabels = ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?'];

    const fragment = document.createDocumentFragment();

    displayCandidates.forEach((item, i) => {
        let isGrayGroup = false; let isFirstInGroup = false; let isLastInGroup = false;
        if (isExpanded && !isSubListMode) {
            const groupIndex = Math.floor(i / 10); isGrayGroup = (groupIndex % 2 !== 0);
            isFirstInGroup = (i % 10 === 0); isLastInGroup = (i % 10 === 9 || i === displayCandidates.length - 1);
        } else {
            const groupIndex = Math.floor(i / 5); isGrayGroup = (groupIndex === 1);
            isFirstInGroup = (i % 5 === 0); isLastInGroup = (i % 5 === 4 || i === displayCandidates.length - 1);
            if (!isSubListMode && userConfig.layoutMode === 'double' && i === 5) {
                const flexBreak = document.createElement('div'); flexBreak.className = 'w-full h-0'; candidateArea.appendChild(flexBreak);
            }
        }

        const rawInputVal = pinyinInput ? pinyinInput.value.trim() : '';
        const currentInput = rawInputVal.toLowerCase();
        const isChineseInput = /[\u4e00-\u9fa5]|\p{Script=Han}/u.test(rawInputVal);

        let dictItem = null;
        let targetHanzi = item.char;

        if (isChineseInput && currentInputMode === 'Yin') {
            dictItem = dictionaryData.find(d => {
                let pyMatch = convertRawPinyinToMarked(d.rawPy) === item.char;
                if (!pyMatch) return false;
                let isDirectMatch = d.w === rawInputVal;
                let isTranslationMatch = (chineseToHakkaMap.get(rawInputVal) || []).includes(d.w);
                return isDirectMatch || isTranslationMatch;
            });
            if (dictItem) targetHanzi = dictItem.w; 
        } else {
            dictItem = dictionaryData.find(d => {
                if (currentInputMode === 'Han') return d.w === item.char && d.len > 0 && (d.pyT.startsWith(currentInput) || d.pyN.startsWith(currentInput) || (d.pyA && d.pyA.startsWith(currentInput)));
                else return (!d.isPunctuation && convertRawPinyinToMarked(d.rawPy) === item.char);
            });
            if (!dictItem) {
                dictItem = dictionaryData.find(d => {
                    if (currentInputMode === 'Han') return d.w === item.char && d.len > 0;
                    else return (!d.isPunctuation && convertRawPinyinToMarked(d.rawPy) === item.char);
                });
            }
        }

        const isYinRubyAllowed = (currentInputMode === 'Yin' && isChineseInput);
        
        // 【修改】：拆分邏輯。isRubyMode 決定版面高度，hasRubyData 決定有沒有字
        const isRubyMode = userConfig.showRuby && (currentInputMode === 'Han' || isYinRubyAllowed);
        const hasRubyData = dictItem && !dictItem.isPunctuation;
        
        // 版面一律看 isRubyMode
        const paddingClass = isRubyMode ? 'pt-3 pb-1' : 'pt-2 pb-1.5';
        const btn = document.createElement('button');
        const bgClass = isGrayGroup ? 'bg-slate-200/90 hover:bg-slate-300' : 'bg-transparent hover:bg-slate-200/50';

        let roundedClass = '';
        if (isFirstInGroup && isLastInGroup) roundedClass = 'rounded-xl';
        else if (isFirstInGroup) roundedClass = 'rounded-l-xl';
        else if (isLastInGroup) roundedClass = 'rounded-r-xl';
        btn.className = `relative ${paddingClass} px-3 ${bgClass} ${roundedClass} ${userConfig.fontSize} text-slate-800 transition min-w-[3.5rem] flex flex-col items-center`;

        let extraLabels = '';
        if (!isExpanded && !isSubListMode && dictItem) {
            const relIdx = i % 10;
            if (dictItem.synonyms && dictItem.synonyms.length > 0) extraLabels += `<span class="text-green-600 font-extrabold ml-1">${synKeys[relIdx]}</span>`;
            if (dictItem.antonyms && dictItem.antonyms.length > 0) extraLabels += `<span class="text-red-600 font-extrabold ml-1">${antLabels[relIdx]}</span>`;
        }

        let finalChar = item.char;
        if (isRubyMode) {
            if (hasRubyData) {
                // 如果有拼音，正常顯示
                const pinyinMarked = convertRawPinyinToMarked(dictItem.rawPy);
                const charsArray = Array.from(targetHanzi);
                const pinyinArray = pinyinMarked.split(' '); 
                if (charsArray.length === pinyinArray.length) {
                    finalChar = charsArray.map((c, idx) => `<ruby class="ruby-auto">${c}<rt class="text-[12px] text-gray-600 font-mono tracking-tighter text-center leading-none">${pinyinArray[idx]}</rt></ruby>`).join('');
                } else {
                    finalChar = `<ruby class="ruby-auto">${targetHanzi}<rt class="text-[12px] text-gray-600 font-mono tracking-tighter text-center leading-none">${pinyinMarked}</rt></ruby>`;
                }
            } else {
                // 【新增】：如果沒有拼音，塞入「透明的空白符號 (text-transparent select-none)」來撐住高度
                const charsArray = Array.from(targetHanzi);
                finalChar = charsArray.map(c => `<ruby class="ruby-auto">${c}<rt class="text-[12px] text-transparent select-none font-mono tracking-tighter text-center leading-none">&nbsp;</rt></ruby>`).join('');
            }
        }

        const mtClass = isRubyMode ? 'mt-2' : 'mt-1.5';
        btn.innerHTML = `<span class="absolute top-1 left-1.5 text-slate-500 text-[11px] font-bold font-mono leading-none">${item.displayIndex}${extraLabels}</span><span class="${mtClass} leading-none">${finalChar}</span>`;
        btn.onclick = () => selectCandidate(item.char); 
        
        fragment.appendChild(btn); 
    });

    candidateArea.appendChild(fragment);
}

if(pinyinInput) pinyinInput.addEventListener('keydown', function(e) {
    const isEsc = e.key === 'Escape'; const isQuote = e.key === "\\";
    if (isEsc || (userConfig.clearAction === 'esc_quote' && isQuote && pinyinInput.value !== '')) {
        e.preventDefault(); pinyinInput.value = ''; pinyinInput.dispatchEvent(new Event('input')); 
        setTimeout(() => { pinyinInput.value = ''; }, 0); return;
    }

    if (isSubListMode) {
        if (/^[0-9]$/.test(e.key) || (e.shiftKey && /^Digit[0-9]$/.test(e.code))) {
            e.preventDefault(); e.stopPropagation();
            const numStr = e.shiftKey ? e.code.replace('Digit', '') : e.key;
            const num = parseInt(numStr); 
            const indexOnPage = num === 0 ? 9 : num - 1; 
            const targetIndex = (currentPage * userConfig.pageSize) + indexOnPage;
            if (subListCandidates[targetIndex]) {
                selectCandidate(subListCandidates[targetIndex]);
                setTimeout(() => { if (/^[!@#$%^&*()]+$/.test(pinyinInput.value)) { pinyinInput.value = ''; pinyinInput.dispatchEvent(new Event('input')); } }, 10);
            }
            return;
        }
        if (e.key === 'Backspace' || e.key === 'Escape' || (e.shiftKey && (e.key === 'J' || e.key === 'j'))) {
            e.preventDefault(); isSubListMode = false; subListCandidates = []; renderCandidates(); return;
        }
    }

    if (e.shiftKey && (e.key === 'Y' || e.key === 'H' || e.key === 'y' || e.key === 'h')) {
        e.preventDefault(); if(modeToggleBtn) modeToggleBtn.click(); return;
    }

    if (e.shiftKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault(); if(editor) { editor.focus(); const textLength = editor.value.length; editor.selectionStart = textLength; editor.selectionEnd = textLength; } return;
    }

    if (e.shiftKey && (e.key === 'J' || e.key === 'j')) {
        if (pinyinInput.value.length > 0) {
            e.preventDefault();
            if (isExpanded && numberFilter.length > 0) {
                numberFilter = numberFilter.slice(0, -1);
                pinyinInput.value = numberFilter.length > 0 ? numberFilter : savedPinyin;
                currentPage = 0;
                renderCandidates();
            } else {
                pinyinInput.value = pinyinInput.value.slice(0, -1);
                pinyinInput.dispatchEvent(new Event('input'));
            }
            return;
        }
    }

    if (currentCandidates.length === 0) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pinyinInput.value = ''; pinyinInput.dispatchEvent(new Event('input')); }
        return; 
    }

    const isShapeWithPunc = userConfig.dialect === 'xiami' || userConfig.dialect === 'hanglie';
    const activeList = isSubListMode ? subListCandidates : currentCandidates;
    const renderPageSize = isExpanded ? 100 : userConfig.pageSize;

    let activeCount = activeList.length;
    if (isExpanded && !isSubListMode) {
         activeCount = activeList.filter((char, i) => {
             const absIdxStr = (i + 1).toString();
             return numberFilter === '' || absIdxStr.startsWith(numberFilter);
         }).length;
    }
    const totalPages = Math.ceil(activeCount / renderPageSize) || 1;

    if (e.key === ' ' || e.key === 'Enter') { 
        e.preventDefault(); 
        const firstCandidateBtn = candidateArea ? candidateArea.querySelector('button') : null; 
        if (firstCandidateBtn) firstCandidateBtn.click(); 
        return; 
    }
    
    if ((!isShapeWithPunc && e.key === '/') || e.key === '?') { e.preventDefault(); if(toggleExpandBtn) toggleExpandBtn.click(); return; }

    if (isExpanded) {
        if ((!isShapeWithPunc && e.key === ',') || e.key === '<' || e.key === '-') { e.preventDefault(); if (currentPage > 0) { currentPage--; renderCandidates(); } return; }
        if ((!isShapeWithPunc && e.key === '.') || e.key === '>' || e.key === '=' || e.key === '+') { e.preventDefault(); if (currentPage < totalPages - 1) { currentPage++; renderCandidates(); } return; }
        
        if (/^[0-9]$/.test(e.key)) { 
            e.preventDefault(); numberFilter += e.key; pinyinInput.value = numberFilter; 
            currentPage = 0; 
            renderCandidates(); return; 
        }
        if (e.key === 'Backspace' && numberFilter.length > 0) { 
            e.preventDefault(); numberFilter = numberFilter.slice(0, -1); pinyinInput.value = numberFilter.length > 0 ? numberFilter : savedPinyin; 
            currentPage = 0;
            renderCandidates(); return; 
        }
        if (/^[a-z]$/i.test(e.key)) { if(toggleExpandBtn) toggleExpandBtn.click(); }
    } else {
        if ((!isShapeWithPunc && e.key === ';') || e.key === ':') {
            e.preventDefault();
            if (!isSemicolonMode) { isSemicolonMode = true; renderCandidates(); } 
            else { 
                const targetIndex = (currentPage * userConfig.pageSize) + 9; 
                if (activeList[targetIndex]) selectCandidate(activeList[targetIndex]); 
            }
            return;
        }

        if ((!isShapeWithPunc && e.key === ',') || e.key === '<' || e.key === '-') { e.preventDefault(); if (currentPage > 0) { currentPage--; renderCandidates(); } return; }
        if ((!isShapeWithPunc && e.key === '.') || e.key === '>' || e.key === '=' || e.key === '+') { e.preventDefault(); if (currentPage < totalPages - 1) { currentPage++; renderCandidates(); } return; }

        const semiKeys = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'];
        const synKeys  = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
        const antKeys  = ['z', 'x', 'c', 'v', 'b', 'n', 'm', '<', '>', '?']; 

        if (isSemicolonMode) {
            const keyLower = e.key.toLowerCase(); const synIdx = synKeys.indexOf(keyLower);
            if (synIdx !== -1) {
                e.preventDefault(); const targetIndex = (currentPage * userConfig.pageSize) + synIdx;
                const targetWord = activeList[targetIndex];
                if (targetWord && !isSubListMode) {
                    const dictItem = dictionaryData.find(d => {
                        if (currentInputMode === 'Han') return d.w === targetWord && d.len > 0;
                        else return (!d.isPunctuation && convertRawPinyinToMarked(d.rawPy) === targetWord);
                    });
                    if (dictItem && dictItem.synonyms && dictItem.synonyms.length > 0) {
                        isSubListMode = true; subListCandidates = dictItem.synonyms.map(syn => currentInputMode === 'Han' ? syn : getPinyinOfWord(syn));
                        subListTitle = `「${targetWord}」的相似詞：`; currentPage = 0; isSemicolonMode = false; renderCandidates();
                    }
                }
                return;
            }

            const antIdx = antKeys.indexOf(keyLower);
            if (antIdx !== -1) {
                e.preventDefault(); const targetIndex = (currentPage * userConfig.pageSize) + antIdx;
                const targetWord = activeList[targetIndex];
                if (targetWord && !isSubListMode) {
                    const dictItem = dictionaryData.find(d => {
                        if (currentInputMode === 'Han') return d.w === targetWord && d.len > 0;
                        else return (!d.isPunctuation && convertRawPinyinToMarked(d.rawPy) === targetWord);
                    });
                    if (dictItem && dictItem.antonyms && dictItem.antonyms.length > 0) {
                        isSubListMode = true; subListCandidates = dictItem.antonyms.map(ant => currentInputMode === 'Han' ? ant : getPinyinOfWord(ant));
                        subListTitle = `「${targetWord}」的相反詞：`; currentPage = 0; isSemicolonMode = false; renderCandidates();
                    }
                }
                return;
            }

            const semiIdx = semiKeys.indexOf(keyLower);
            if (semiIdx !== -1 || e.key === ':') {
                e.preventDefault(); 
                const targetIndex = (currentPage * userConfig.pageSize) + (e.key === ':' ? 9 : semiIdx);
                if (activeList[targetIndex]) selectCandidate(activeList[targetIndex]);
                return;
            }
        }

        if (e.shiftKey && !isSubListMode) {
            const shiftSynKeys = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
            const shiftAntKeys = ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?'];

            const synIdx = shiftSynKeys.indexOf(e.key);
            if (synIdx !== -1) {
                e.preventDefault(); const targetIndex = (currentPage * userConfig.pageSize) + synIdx;
                const targetWord = activeList[targetIndex];
                if (targetWord) {
                    const dictItem = dictionaryData.find(d => {
                        if (currentInputMode === 'Han') return d.w === targetWord && d.len > 0;
                        else return (!d.isPunctuation && convertRawPinyinToMarked(d.rawPy) === targetWord);
                    });
                    if (dictItem && dictItem.synonyms && dictItem.synonyms.length > 0) {
                        isSubListMode = true; subListCandidates = dictItem.synonyms.map(syn => currentInputMode === 'Han' ? syn : getPinyinOfWord(syn));
                        subListTitle = `「${targetWord}」的相似詞：`; currentPage = 0; isSemicolonMode = false; renderCandidates();
                    }
                }
                return;
            }

            const antIdx = shiftAntKeys.indexOf(e.key);
            if (antIdx !== -1) {
                e.preventDefault(); const targetIndex = (currentPage * userConfig.pageSize) + antIdx;
                const targetWord = activeList[targetIndex];
                if (targetWord) {
                    const dictItem = dictionaryData.find(d => {
                        if (currentInputMode === 'Han') return d.w === targetWord && d.len > 0;
                        else return (!d.isPunctuation && convertRawPinyinToMarked(d.rawPy) === targetWord);
                    });
                    if (dictItem && dictItem.antonyms && dictItem.antonyms.length > 0) {
                        isSubListMode = true; subListCandidates = dictItem.antonyms.map(ant => currentInputMode === 'Han' ? ant : getPinyinOfWord(ant));
                        subListTitle = `「${targetWord}」的相反詞：`; currentPage = 0; isSemicolonMode = false; renderCandidates();
                    }
                }
                return;
            }
        }

        if (/^[0-9]$/.test(e.key) || (e.shiftKey && /^Digit[0-9]$/.test(e.code))) {
            e.preventDefault(); e.stopPropagation();
            const numStr = e.shiftKey ? e.code.replace('Digit', '') : e.key;
            const num = parseInt(numStr); 
            const indexOnPage = num === 0 ? 9 : num - 1; 
            const targetIndex = (currentPage * userConfig.pageSize) + indexOnPage;
            if (activeList[targetIndex]) {
                selectCandidate(activeList[targetIndex]);
                setTimeout(() => { if (/^[!@#$%^&*()]+$/.test(pinyinInput.value)) { pinyinInput.value = ''; pinyinInput.dispatchEvent(new Event('input')); } }, 10);
            }
        }
    }
});

if(prevPageBtn) prevPageBtn.addEventListener('click', () => { 
    if (currentPage > 0) { currentPage--; renderCandidates(); if(pinyinInput) pinyinInput.focus(); } 
});

if(nextPageBtn) nextPageBtn.addEventListener('click', () => {
    const activeList = isSubListMode ? subListCandidates : currentCandidates;
    const renderPageSize = isExpanded ? 100 : userConfig.pageSize;
    
    let activeCount = activeList.length;
    if (isExpanded && !isSubListMode) {
         activeCount = activeList.filter((char, i) => {
             const absIdxStr = (i + 1).toString();
             return numberFilter === '' || absIdxStr.startsWith(numberFilter);
         }).length;
    }
    const totalPages = Math.ceil(activeCount / renderPageSize) || 1;
    if (currentPage < totalPages - 1) { currentPage++; renderCandidates(); if(pinyinInput) pinyinInput.focus(); }
});

if(toggleExpandBtn) toggleExpandBtn.addEventListener('click', () => {
    if (isSubListMode) return; 
    isExpanded = !isExpanded;
    if (isExpanded) { 
        savedPinyin = pinyinInput ? pinyinInput.value : ''; numberFilter = ''; 
    } else { 
        if(pinyinInput) pinyinInput.value = savedPinyin; 
    }
    currentPage = 0; 
    renderCandidates(); 
    if(pinyinInput) pinyinInput.focus();
});

function insertTextAtCursor(textarea, text) {
    if(!textarea) return;
    const startPos = textarea.selectionStart; const endPos = textarea.selectionEnd; const currentVal = textarea.value;
    textarea.value = currentVal.substring(0, startPos) + text + currentVal.substring(endPos);
    textarea.selectionStart = startPos + text.length; textarea.selectionEnd = startPos + text.length;
    textarea.dispatchEvent(new Event('input'));
}


if(copyBtn) copyBtn.addEventListener('click', () => {
    if (!editor || editor.value.trim() === '') { showDialog({ type: 'alert', title: '無法複製', icon: '⚠️', message: '編輯區是空的，沒有文字可以複製！' }); return; }
    navigator.clipboard.writeText(editor.value).then(() => {
        const originalHTML = copyBtn.innerHTML;
        const originalClasses = copyBtn.className;
        
        copyBtn.className = 'px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md transition whitespace-nowrap outline-none';
        copyBtn.textContent = '已複製！';
        
        setTimeout(() => { 
            copyBtn.className = originalClasses;
            copyBtn.innerHTML = originalHTML; 
        }, 2000);
    }).catch(err => { editor.select(); document.execCommand('copy'); showDialog({ type: 'alert', title: '提示', icon: 'ℹ️', message: '已透過備用方式嘗試複製。' }); });
});

if(clearBtn) clearBtn.addEventListener('click', () => { 
    showDialog({
        type: 'confirm', title: '清除文字確認', icon: '🗑️', confirmText: '確定清除', confirmColor: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
        message: '確定要清除編輯區內的所有文字嗎？此動作無法復原。',
        onConfirm: () => { 
            if(editor) { 
                editor.value = ''; 
                editor.focus(); 
                editor.dispatchEvent(new Event('input')); 
            } 
        }
    });
});

const openSettingsBtn = document.getElementById('openSettingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const set_fontSize = document.getElementById('set_fontSize');
const set_dialect = document.getElementById('set_dialect');
const set_pageSize = document.getElementById('set_pageSize');
const set_layoutMode = document.getElementById('set_layoutMode');
const set_clearAction = document.getElementById('set_clearAction'); 
const set_saveEditorContent = document.getElementById('set_saveEditorContent');
const set_singleCharMode = document.getElementById('set_singleCharMode');
const set_continuousMode = document.getElementById('set_continuousMode');
const set_reqToneSingle = document.getElementById('set_reqToneSingle'); 
const set_reqToneMulti = document.getElementById('set_reqToneMulti');
const set_allowAbbrMulti = document.getElementById('set_allowAbbrMulti');
const set_showRuby = document.getElementById('set_showRuby');

if(openSettingsBtn) openSettingsBtn.addEventListener('click', () => {
	const set_enablePredictiveText = document.getElementById('set_enablePredictiveText');
	if(set_enablePredictiveText) set_enablePredictiveText.checked = userConfig.enablePredictiveText || false;
    const set_predCangjie = document.getElementById('set_predCangjie');
    const set_predXiami = document.getElementById('set_predXiami');
    const set_predHanglie = document.getElementById('set_predHanglie');
    if (set_predCangjie) set_predCangjie.value = userConfig.predCangjie || 'none';
    if (set_predXiami) set_predXiami.value = userConfig.predXiami || 'none';
    if (set_predHanglie) set_predHanglie.value = userConfig.predHanglie || 'none';
	const set_allowToneInContinuous = document.getElementById('set_allowToneInContinuous');
    if(set_allowToneInContinuous) set_allowToneInContinuous.checked = userConfig.allowToneInContinuous || false;
	const set_kasuSpelling = document.getElementById('set_kasuSpelling');
	if(set_kasuSpelling) set_kasuSpelling.value = userConfig.kasuSpelling || 'mixed';
    if(set_dialect) set_dialect.value = userConfig.dialect; 
    if(set_fontSize) set_fontSize.value = userConfig.fontSize; 
    if(set_pageSize) set_pageSize.value = userConfig.pageSize.toString();
    if(set_layoutMode) set_layoutMode.value = userConfig.layoutMode; 
    if(set_clearAction) set_clearAction.value = userConfig.clearAction; 
    
    if(set_saveEditorContent) set_saveEditorContent.checked = userConfig.saveEditorContent;
    if(set_continuousMode) set_continuousMode.checked = userConfig.continuousMode;

    if(set_reqToneSingle) set_reqToneSingle.checked = userConfig.reqToneSingle; 
    if(set_singleCharMode) set_singleCharMode.checked = userConfig.singleCharMode;
    const isSingle = userConfig.singleCharMode;
    
    if(set_reqToneMulti) { set_reqToneMulti.checked = userConfig.reqToneMulti; set_reqToneMulti.disabled = isSingle; }   
    if(set_allowAbbrMulti) { set_allowAbbrMulti.checked = userConfig.allowAbbrMulti; set_allowAbbrMulti.disabled = isSingle; } 
    if(set_showRuby) set_showRuby.checked = userConfig.showRuby; 
    
    const l1 = document.getElementById('label_reqToneMulti');
    const l2 = document.getElementById('label_allowAbbrMulti');
    if(l1) l1.className = isSingle ? 'text-sm text-gray-400 transition-colors' : 'text-sm text-gray-700 transition-colors';
    if(l2) l2.className = isSingle ? 'text-sm text-gray-400 transition-colors' : 'text-sm text-gray-700 transition-colors';

    updateBackendDictCount();
    if(settingsModal) { settingsModal.classList.remove('hidden'); settingsModal.style.display = ''; }
});

if (set_singleCharMode) {
    set_singleCharMode.addEventListener('change', (e) => {
        const isSingle = e.target.checked;
        if(set_reqToneMulti) set_reqToneMulti.disabled = isSingle;
        if(set_allowAbbrMulti) set_allowAbbrMulti.disabled = isSingle;
        
        const l1 = document.getElementById('label_reqToneMulti');
        const l2 = document.getElementById('label_allowAbbrMulti');
        if(l1) l1.className = isSingle ? 'text-sm text-gray-400 transition-colors' : 'text-sm text-gray-700 transition-colors';
        if(l2) l2.className = isSingle ? 'text-sm text-gray-400 transition-colors' : 'text-sm text-gray-700 transition-colors';
    });
}

if(closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => { 
    if(settingsModal) { settingsModal.classList.add('hidden'); settingsModal.style.display = 'none'; }
    if(pinyinInput) pinyinInput.focus(); 
});

if(saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => {
	if(set_enablePredictiveText) userConfig.enablePredictiveText = set_enablePredictiveText.checked;
	if(set_predCangjie) userConfig.predCangjie = set_predCangjie.value;
    if(set_predXiami) userConfig.predXiami = set_predXiami.value;
    if(set_predHanglie) userConfig.predHanglie = set_predHanglie.value;
	if(set_allowToneInContinuous) userConfig.allowToneInContinuous = set_allowToneInContinuous.checked;
	if(set_kasuSpelling) userConfig.kasuSpelling = set_kasuSpelling.value;
    if(set_fontSize) userConfig.fontSize = set_fontSize.value; 
    if(set_pageSize) userConfig.pageSize = parseInt(set_pageSize.value); 
    if(set_layoutMode) userConfig.layoutMode = set_layoutMode.value; 
    if(set_clearAction) userConfig.clearAction = set_clearAction.value; 
    if(set_saveEditorContent) userConfig.saveEditorContent = set_saveEditorContent.checked;
    if(set_continuousMode) userConfig.continuousMode = set_continuousMode.checked;
    if(set_singleCharMode) userConfig.singleCharMode = set_singleCharMode.checked;
    if(set_reqToneSingle) userConfig.reqToneSingle = set_reqToneSingle.checked; 
    if(set_reqToneMulti) userConfig.reqToneMulti = set_reqToneMulti.checked; 
    if(set_allowAbbrMulti) userConfig.allowAbbrMulti = set_allowAbbrMulti.checked;
    if(set_showRuby) userConfig.showRuby = set_showRuby.checked;

    localStorage.setItem('hakka_user_config', JSON.stringify(userConfig));
    
    const allDetails = document.querySelectorAll('#settingsModal details');
    allDetails.forEach(d => d.removeAttribute('open'));

    currentPage = 0; 
    if(settingsModal) { settingsModal.classList.add('hidden'); settingsModal.style.display = 'none'; }
    
    updateModeToggleBtnColor();
    
    renderCandidates();
    if(pinyinInput) pinyinInput.focus();
});

// === 🟢 新增：設定面板的手風琴 (Accordion) 展開收合邏輯 ===
const settingsDetails = document.querySelectorAll('#settingsModal details');
settingsDetails.forEach(targetDetail => {
    targetDetail.addEventListener('toggle', (e) => {
        // 當這個 details 被展開時
        if (targetDetail.open) {
            // 1. 先把其他已經展開的 details 收合
            settingsDetails.forEach(otherDetail => {
                if (otherDetail !== targetDetail && otherDetail.open) {
                    otherDetail.removeAttribute('open');
                }
            });

            // 2. 🟢 升級：自動平滑捲動
            setTimeout(() => {
                // 如果是「進階輸入規則」被打開，就改為捲動它外層的「快捷模式容器」
                if (targetDetail.id === 'advRulesDetails') {
                    const container = document.getElementById('quickModeContainer');
                    if (container) {
                        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } 
                // 其他的 details 就照常捲動自己
                else {
                    targetDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 50);
        }
    });
});

// === 4. 字典進階管理中心 (全新匯入匯出架構) ===
const langOptionsList = [
    {v: 'sixian', n: '四縣'}, {v: 'sixiannan', n: '南四縣'}, {v: 'hailu', n: '海陸'}, 
    {v: 'dapu', n: '大埔'}, {v: 'raoping', n: '饒平'}, {v: 'kasu', n: '詔安'}, 
    {v: 'holo', n: '台語'}, {v: 'jinmen', n: '金門'}, {v: 'matsu', n: '馬祖'}, 
    {v: 'cangjie', n: '倉頡'}, {v: 'xiami', n: '蝦米'}, {v: 'hanglie', n: '行列'}
];

// 🟢 修改：換成 function 宣告，確保整份檔案任何地方都能呼叫
function convertNumToLetterPinyin(rawPy, currentDialect) {
    if (!rawPy) return '';
    const cleanedPy = rawPy.replace(/[-=　]+/g, ' ').trim();
    if (['cangjie', 'xiami', 'hanglie'].includes(currentDialect)) return cleanedPy;
    const currentToneMap = toneMappings[currentDialect] || toneMappings['sixian'];
    return cleanedPy.split(/\s+/).map(s => {
        let match = s.match(/^([a-zA-Z]+)(\d+)$/);
        if (match) {
            let py = match[1]; let tone = match[2];
            let letter = currentToneMap[tone] ? currentToneMap[tone].letter : '';
            return py + letter; 
        }
        return s;
    }).join(' ');
}

function isRedundantWord(word, rawPy, syn, ant, dialect) {
    const letterPinyin = convertNumToLetterPinyin(rawPy, dialect);
    const formatSyn = formatRelated(syn);
    const formatAnt = formatRelated(ant);
    const hasSyn = formatSyn.length > 0;
    const hasAnt = formatAnt.length > 0;

    const langBuiltin = (typeof dictionaries !== 'undefined') ? (dictionaries[dialect] || {}) : {};
    const existsInBase = langBuiltin[letterPinyin] && langBuiltin[letterPinyin].split(' ').includes(word);

    // 1. 優先檢查擴充詞庫 (Ext)
    if (typeof window.customExtDicts !== 'undefined') {
        for (let group of window.customExtDicts) {
            const lang = group.d || group.dialect || 'sixian';
            if (lang === dialect && Array.isArray(group.matrix)) {
                for (let row of group.matrix) {
                    let extWord = row[0];
                    let extPinyin = row[1];
                    let extSyn = formatRelated(row[2] || '');
                    let extAnt = formatRelated(row[3] || '');

                    if (extWord === word) {
                        let pinyinMatch = false;
                        if (extPinyin === letterPinyin) pinyinMatch = true;
                        // 還原被壓縮的空字串拼音比對
                        else if (extPinyin === "" && existsInBase) pinyinMatch = true;

                        if (pinyinMatch) {
                            // 檢查匯入的相似/相反詞，是否都「完全包含」在擴充包中
                            const checkSubset = (customStr, extStr) => {
                                if (!customStr) return true;
                                const customArr = customStr.split(';');
                                const extArr = extStr.split(';');
                                return customArr.every(v => extArr.includes(v));
                            };
                            
                            if (checkSubset(formatSyn, extSyn) && checkSubset(formatAnt, extAnt)) {
                                return true; // 確認完全重複，不需新增
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. 檢查基本詞庫 (Base) - 若匯入的詞「沒有」聯想詞且存在於基本庫，也是重複
    if (!hasSyn && !hasAnt && existsInBase) {
        return true;
    }

    return false;
}

function getRealCustomDictCount(dialect) {
    const langWords = customDictionaryRaw.filter(item => (item.dialect || 'sixian') === dialect);
    return langWords.filter(item => {
        return !isRedundantWord(item.w, item.rawPy, item.rawSyn, item.rawAnt, dialect);
    }).length;
}

function updateBackendDictCount() {
    const dialectSelect = document.getElementById('importTargetLang');
    const totalDictCount = document.getElementById('totalDictCount');
    const singleLangDictCount = document.getElementById('singleLangDictCount');
    
    if (totalDictCount) {
        let totalAdded = 0;
        const dialects = new Set(customDictionaryRaw.map(item => item.dialect || 'sixian'));
        dialects.forEach(lang => { totalAdded += getRealCustomDictCount(lang); });
        totalDictCount.textContent = `全語系共新增 ${totalAdded} 筆`;
    }

    if (!dialectSelect || !singleLangDictCount) return;
    const targetLang = dialectSelect.value;
    
    const builtinDict = (typeof dictionaries !== 'undefined') ? (dictionaries[targetLang] || {}) : {};
    let builtinCount = 0;
    for (let py in builtinDict) {
        builtinCount += builtinDict[py].split(' ').filter(w => w.trim() !== '').length;
    }
    if (typeof window.customExtDicts !== 'undefined') {
        window.customExtDicts.forEach(group => {
            const lang = group.d || group.dialect || 'sixian';
            if (lang === targetLang && Array.isArray(group.matrix)) {
                builtinCount += group.matrix.length;
            }
        });
    }
    
    const addedCount = getRealCustomDictCount(targetLang);
    singleLangDictCount.textContent = `內建 ${builtinCount} 筆，新增 ${addedCount} 筆`;
}
function updateDictCount() { updateBackendDictCount(); }
updateDictCount();

document.addEventListener('DOMContentLoaded', () => {
    const importTargetLangElement = document.getElementById('importTargetLang');
    if (importTargetLangElement) importTargetLangElement.addEventListener('change', updateBackendDictCount);
});

const importSourceType = document.getElementById('importSourceType');
const importTargetLang = document.getElementById('importTargetLang');
const importLangContainer = document.getElementById('importLangContainer');
const importJsLangSelector = document.getElementById('importJsLangSelector');
const dictPasteArea = document.getElementById('dictPasteArea');
const dictFileInput = document.getElementById('dictFileInput');
const pasteDelimiter = document.getElementById('pasteDelimiter');
const executeImportBtn = document.getElementById('executeImportBtn');

const exportFormatType = document.getElementById('exportFormatType');
const exportTargetLang = document.getElementById('exportTargetLang');
const exportJsLangSelector = document.getElementById('exportJsLangSelector');
const executeExportBtn = document.getElementById('executeExportBtn');

// 【新增】全新清空按鈕
const executeClearBtn = document.getElementById('executeClearBtn');

function renderLangCheckboxes(containerId, prefix) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = `<div class="col-span-full flex gap-2 mb-1 border-b border-gray-200/60 pb-2">
        <button type="button" class="px-2 py-1 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition shadow-sm select-all-btn">✅ 全選</button>
        <button type="button" class="px-2 py-1 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 transition shadow-sm deselect-all-btn">❌ 全不選</button>
    </div>`;
    
    langOptionsList.forEach(l => {
        html += `
        <label class="flex items-center gap-2 cursor-pointer p-1.5 bg-white border border-gray-200 rounded-md hover:border-blue-400 hover:bg-blue-50 transition shadow-sm group">
            <input type="checkbox" value="${l.v}" class="${prefix}-lang-chk w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" checked>
            <span class="text-xs font-medium text-gray-700 group-hover:text-blue-800">${l.n}</span>
        </label>`;
    });
    
    container.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm mt-1";
    container.innerHTML = html;

    container.querySelector('.select-all-btn').addEventListener('click', () => {
        container.querySelectorAll(`.${prefix}-lang-chk`).forEach(chk => chk.checked = true);
    });
    container.querySelector('.deselect-all-btn').addEventListener('click', () => {
        container.querySelectorAll(`.${prefix}-lang-chk`).forEach(chk => chk.checked = false);
    });
}
renderLangCheckboxes('importJsCheckboxes', 'import');
renderLangCheckboxes('exportJsCheckboxes', 'export');
// 【新增】渲染清除區塊的勾選框
renderLangCheckboxes('clearJsCheckboxes', 'clear');

if (exportTargetLang && importTargetLang) {
    exportTargetLang.innerHTML = importTargetLang.innerHTML;
}

if (importSourceType) {
    importSourceType.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'paste') {
            dictPasteArea.classList.remove('hidden');
            dictFileInput.classList.add('hidden');
            if(pasteDelimiter && pasteDelimiter.parentElement) pasteDelimiter.parentElement.classList.remove('hidden');
            if(importLangContainer) importLangContainer.classList.remove('hidden');
            importJsLangSelector.classList.add('hidden');
        } else if (val === 'csv') {
            dictPasteArea.classList.add('hidden');
            dictFileInput.classList.remove('hidden');
            dictFileInput.accept = '.csv,.ods,.xlsx,.xls';
            if(pasteDelimiter && pasteDelimiter.parentElement) pasteDelimiter.parentElement.classList.add('hidden');
            if(importLangContainer) importLangContainer.classList.remove('hidden');
            importJsLangSelector.classList.add('hidden');
        } else if (val === 'js') {
            dictPasteArea.classList.add('hidden');
            dictFileInput.classList.remove('hidden');
            dictFileInput.accept = '.js';
            if(pasteDelimiter && pasteDelimiter.parentElement) pasteDelimiter.parentElement.classList.add('hidden');
            if(importLangContainer) importLangContainer.classList.add('hidden');
            importJsLangSelector.classList.remove('hidden');
        }
    });
}

if (exportFormatType) {
    exportFormatType.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'js') {
            exportTargetLang.classList.add('hidden');
            exportJsLangSelector.classList.remove('hidden');
        } else if (val === 'csv') {
            exportTargetLang.classList.remove('hidden');
            exportJsLangSelector.classList.add('hidden');
        }
    });
}

if (executeImportBtn) {
    executeImportBtn.addEventListener('click', () => {
        const type = importSourceType.value;
        
        if (type === 'paste') {
            const text = dictPasteArea.value.trim();
            if (!text) return showDialog({ type: 'alert', title: '提示', icon: '⚠️', message: '請先在文字框內貼上內容！' });
            parsePastedDictionary(text, importTargetLang.value);
        } else if (type === 'csv' || type === 'js') {
            const file = dictFileInput.files[0];
            if (!file) return showDialog({ type: 'alert', title: '提示', icon: '⚠️', message: '請先選擇要上傳的檔案！' });

            // 🟢 取得檔案的副檔名
            const fileExt = file.name.split('.').pop().toLowerCase();

            // 🟢 如果是 ODS 或 Excel 試算表，交給 SheetJS 處理
            if (type === 'csv' && ['ods', 'xlsx', 'xls'].includes(fileExt)) {
                if (typeof XLSX === 'undefined') {
                    return showDialog({ type: 'alert', title: '缺少套件', icon: '❌', message: '無法解析試算表，請確認是否有載入 SheetJS。' });
                }
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, {type: 'array'});
                        const firstSheetName = workbook.SheetNames[0]; // 只讀取第一個工作表
                        const worksheet = workbook.Sheets[firstSheetName];

                        // 將試算表無縫轉換為 CSV 字串，再丟給我們原本寫好的 CSV 處理函數！
                        const csvText = XLSX.utils.sheet_to_csv(worksheet);
                        parseCSVToDictionary(csvText, importTargetLang.value);
                        dictFileInput.value = ''; 
                    } catch (err) {
                        showDialog({ type: 'alert', title: '解析失敗', icon: '❌', message: '無法讀取該試算表，請確認檔案是否損毀或加密。' });
                    }
                };
                reader.readAsArrayBuffer(file); // 注意：試算表必須用二進位方式讀取
            } 
            // 🟢 原本的文字檔處理邏輯 (處理 .csv 或 .js)
            else {
                const reader = new FileReader();
                reader.onload = function(event) {
                    if (type === 'csv') {
                        parseCSVToDictionary(event.target.result, importTargetLang.value);
                    } else {
                        const checkedLangs = Array.from(document.querySelectorAll('.import-lang-chk:checked')).map(chk => chk.value);
                        if (checkedLangs.length === 0) return showDialog({ type: 'alert', title: '提示', icon: '⚠️', message: '請至少勾選一種要匯入的語言！' });
                        parseJSToDictionary(event.target.result, checkedLangs);
                    }
                    dictFileInput.value = ''; 
                };
                reader.readAsText(file);
            }
        }
    });
}

function processAndSaveImport(lines, delimiter, targetDialect, isCSV = false) {
    const parseLine = (line, delim) => {
        let cols = []; let inQuotes = false; let currentStr = '';
        for (let char of line) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === delim && !inQuotes) { cols.push(currentStr.trim()); currentStr = ''; }
            else currentStr += char;
        }
        cols.push(currentStr.trim()); return cols;
    };

    const firstRow = parseLine(lines[0], delimiter);
    let wordIdx = -1; let pinyinIdx = -1; let synIdx = -1; let antIdx = -1; let startIndex = 0; 
    firstRow.forEach((header, idx) => {
        if (['詞目', '漢字', '客語', '語詞'].includes(header)) wordIdx = idx;
        else if (['音讀', '拼音', '標音'].includes(header)) pinyinIdx = idx;
        else if (['相似詞', '相似'].includes(header)) synIdx = idx;
        else if (['相反詞', '相反'].includes(header)) antIdx = idx;
    });

    if (isCSV && (wordIdx === -1 || pinyinIdx === -1)) {
        return showDialog({ type: 'alert', title: '匯入失敗', icon: '❌', message: '找不到必要的標題欄位！請確認第一行包含「詞目/漢字」與「音讀/拼音」。' });
    }

    if (wordIdx === -1 || pinyinIdx === -1) { wordIdx = 0; pinyinIdx = 1; synIdx = 2; antIdx = 3; startIndex = 0; } 
    else startIndex = 1; 

    let parsedCount = 0; let addedCount = 0;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i]; if (!line.trim()) continue;
        const columns = parseLine(line, delimiter);
        const word = columns[wordIdx] ? columns[wordIdx].trim() : '';
        const pinyinRaw = columns[pinyinIdx] ? formatPinyin(columns[pinyinIdx]) : '';
        const synonymsRaw = (synIdx !== -1 && columns[synIdx]) ? formatRelated(columns[synIdx]) : '';
        const antonymsRaw = (antIdx !== -1 && columns[antIdx]) ? formatRelated(columns[antIdx]) : '';
        
        if (word && pinyinRaw) {
            const pinyinSegments = pinyinRaw.split(/　+/);
            pinyinSegments.forEach(segment => { 
                if (segment.trim()) {
                    parsedCount++; 
                    const isNew = addWordToDict(word, segment, true, synonymsRaw, antonymsRaw, false, targetDialect); 
                    if (isNew) addedCount++;
                }
            });
        }
    }

    if (parsedCount > 0) {
        localStorage.setItem('hakka_custom_dict_v3', JSON.stringify(customDictionaryRaw)); 
        
        // 匯入後也採用無刷新立即重建
        dictionaryData = []; 
        dictionaryMap.clear();
        loadDefaultDictionary();
        customDictionaryRaw.forEach(item => {
            const itemDialect = item.dialect || 'sixian';
            if (itemDialect === userConfig.dialect) addWordToDict(item.w, item.rawPy, false, item.rawSyn, item.rawAnt);
        });
        updateDictCount();
        if(pinyinInput) { pinyinInput.value = ''; pinyinInput.focus(); }
        currentCandidates = []; renderCandidates();

        showDialog({ type: 'alert', title: '匯入成功', icon: '✅', confirmColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20', message: `【${targetDialect}】已解析 ${parsedCount} 筆，實際新增了 ${addedCount} 筆與內建不同的詞彙。` });
        if(dictPasteArea) dictPasteArea.value = ''; 
    } else {
        showDialog({ type: 'alert', title: '匯入失敗', icon: '❌', confirmColor: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20', message: '無法解析：資料格式錯誤。' });
    }
}

function parsePastedDictionary(pastedText, targetDialect) {
    const lines = pastedText.split('\n'); if (lines.length === 0) return;
    let delimiter = pasteDelimiter ? pasteDelimiter.value : 'tab'; if (delimiter === 'tab') delimiter = '\t';
    processAndSaveImport(lines, delimiter, targetDialect, false);
}

function parseCSVToDictionary(csvText, targetDialect) {
    const lines = csvText.split('\n'); if (lines.length === 0) return;
    processAndSaveImport(lines, ',', targetDialect, true);
}

function parseJSToDictionary(jsText, selectedLangs) {
    try {
        let tempWindow = { customExtDicts: [] };
        const executor = new Function('window', jsText);
        executor(tempWindow);
        
        let parsedCount = 0; let addedCount = 0;
        let importedLangs = new Set();

        // 🟢 新增：建立「內建字典」的拼音快取，用來還原被壓縮的空字串拼音
        const allBuiltinCache = {};
        if (typeof dictionaries !== 'undefined') {
            for (let dictLang in dictionaries) {
                allBuiltinCache[dictLang] = {};
                for (let py in dictionaries[dictLang]) {
                    dictionaries[dictLang][py].split(' ').forEach(w => {
                        if (!w) return;
                        if (!allBuiltinCache[dictLang][w]) allBuiltinCache[dictLang][w] = [];
                        allBuiltinCache[dictLang][w].push(py);
                    });
                }
            }
        }

        tempWindow.customExtDicts.forEach(group => {
            const lang = group.d || group.dialect;
            if (!selectedLangs.includes(lang)) return; 
            
            const langCache = allBuiltinCache[lang] || {}; // 取得該語言的快取
            
            if (Array.isArray(group.matrix)) {
                importedLangs.add(lang);
                group.matrix.forEach(row => {
                    let word = row[0]; 
                    let pinyin = row[1]; 
                    
                    // 🟢 修改：強制將全形空白、逗號等轉為分號 (;) 作為分隔
                    let syn = (row[2] || '').replace(/[　,，、\s]+/g, ';').replace(/^;+|;+$/g, ''); 
                    let ant = (row[3] || '').replace(/[　,，、\s]+/g, ';').replace(/^;+|;+$/g, '');

                    // 🟢 新增：如果拼音是空的(被壓縮)，嘗試從內建字典中還原
                    if (!pinyin && langCache[word] && langCache[word].length === 1) {
                        pinyin = langCache[word][0];
                    }

                    if (word && pinyin) { // 現在還原後的拼音就能順利通過判斷了！
                        parsedCount++;
                        const isNew = addWordToDict(word, pinyin, true, syn, ant, false, lang);
                        if (isNew) addedCount++;
                    }
                });
            }
        });

        if (parsedCount > 0) {
            localStorage.setItem('hakka_custom_dict_v3', JSON.stringify(customDictionaryRaw)); 
            
            dictionaryData = []; 
            dictionaryMap.clear();
            loadDefaultDictionary();
            customDictionaryRaw.forEach(item => {
                const itemDialect = item.dialect || 'sixian';
                if (itemDialect === userConfig.dialect) addWordToDict(item.w, item.rawPy, false, item.rawSyn, item.rawAnt);
            });
            updateDictCount();
            if(pinyinInput) { pinyinInput.value = ''; pinyinInput.focus(); }
            currentCandidates = []; renderCandidates();

            const langNames = Array.from(importedLangs).join(', ');
            showDialog({ type: 'alert', title: 'JS 匯入成功', icon: '✅', confirmColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20', message: `成功匯入了：${langNames}\n解析 ${parsedCount} 筆，實際新增了 ${addedCount} 筆不重複詞彙。` });
        } else {
            showDialog({ type: 'alert', title: '無資料匯入', icon: 'ℹ️', message: '在檔案中找不到符合你勾選的語言資料，或資料格式有誤。' });
        }
    } catch (e) {
        showDialog({ type: 'alert', title: '匯入失敗', icon: '❌', confirmColor: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20', message: '無法解析該 JS 檔案，格式可能已損毀。' });
    }
}

if(executeClearBtn) executeClearBtn.addEventListener('click', () => {
    const checkedLangs = Array.from(document.querySelectorAll('.clear-lang-chk:checked')).map(chk => chk.value);
    if (checkedLangs.length === 0) return showDialog({ type: 'alert', title: '提示', icon: '⚠️', message: '請至少勾選一種要清空的語言！' });

    const langNames = langOptionsList.filter(l => checkedLangs.includes(l.v)).map(l => l.n).join('、');

    showDialog({
        type: 'confirm', title: '清空自訂語詞', icon: '⚠️', confirmText: '確定清空', confirmColor: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
        message: `確定要清空「${langNames}」自訂語詞嗎？\n此動作無法復原。`,
        onConfirm: () => {
            customDictionaryRaw = customDictionaryRaw.filter(item => !checkedLangs.includes(item.dialect || 'sixian'));
            localStorage.setItem('hakka_custom_dict_v3', JSON.stringify(customDictionaryRaw)); 
            
            // 無刷新重建字典與數據
            dictionaryData = []; 
            dictionaryMap.clear();
            loadDefaultDictionary();
            customDictionaryRaw.forEach(item => {
                const itemDialect = item.dialect || 'sixian';
                if (itemDialect === userConfig.dialect) addWordToDict(item.w, item.rawPy, false, item.rawSyn, item.rawAnt);
            });
            updateDictCount();
            if(pinyinInput) { pinyinInput.value = ''; pinyinInput.focus(); }
            currentCandidates = []; renderCandidates();

            showDialog({ type: 'alert', title: '清空完畢', icon: '✅', confirmColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20', message: '勾選的語言字典已成功清空，系統數據已即時更新。' });
        }
    });
});

// === 🟢 新增：取得準備匯出的合併詞庫 (擴充詞庫 + 自訂詞庫，並排除基本詞庫) ===
function getMergedExportData(targetLang) {
    let mergedMap = new Map();
    const langBuiltin = (typeof dictionaries !== 'undefined') ? (dictionaries[targetLang] || {}) : {};

    // 建立基本詞庫的反查快取 (用來還原被壓縮的空字串拼音)
    const baseCache = {};
    for (let py in langBuiltin) {
        langBuiltin[py].split(' ').forEach(w => {
            if (!w) return;
            if (!baseCache[w]) baseCache[w] = [];
            baseCache[w].push(py);
        });
    }

    // 1. 載入擴充詞庫 (Ext)
    if (typeof window.customExtDicts !== 'undefined') {
        window.customExtDicts.forEach(group => {
            const lang = group.d || group.dialect || 'sixian';
            if (lang === targetLang && Array.isArray(group.matrix)) {
                group.matrix.forEach(row => {
                    let word = row[0];
                    let pinyin = row[1];
                    // 還原空字串拼音
                    if (!pinyin && baseCache[word] && baseCache[word].length === 1) {
                        pinyin = baseCache[word][0];
                    }
                    let syn = row[2] || '';
                    let ant = row[3] || '';
                    let key = `${word}|${pinyin}`;
                    mergedMap.set(key, { dialect: lang, w: word, rawPy: pinyin, rawSyn: syn, rawAnt: ant });
                });
            }
        });
    }

    // 2. 載入自訂詞庫 (Custom) - 如果有重複，以使用者的自訂修改為主
    customDictionaryRaw.forEach(item => {
        const lang = item.dialect || 'sixian';
        if (lang === targetLang) {
            let letterPinyin = convertNumToLetterPinyin(item.rawPy, lang);
            let key = `${item.w}|${letterPinyin}`;
            mergedMap.set(key, { ...item, letterPy: letterPinyin }); // 保留原始 rawPy 以便 CSV 匯出使用
        }
    });

    // 3. 過濾掉與「基本詞庫 (ime-dict.js)」完全相同的詞彙 (無聯想詞且存在於 Base)
    let finalExportList = [];
    mergedMap.forEach((item) => {
        const letterPinyin = item.letterPy || convertNumToLetterPinyin(item.rawPy, targetLang);
        const hasSyn = (item.rawSyn || '').trim().length > 0;
        const hasAnt = (item.rawAnt || '').trim().length > 0;

        // 如果沒有自訂聯想詞，且基本詞庫已經有這個字+拼音，就不需要匯出
        if (!hasSyn && !hasAnt && langBuiltin[letterPinyin]) {
            const builtinWords = langBuiltin[letterPinyin].split(' ');
            if (builtinWords.includes(item.w)) return; 
        }
        finalExportList.push(item);
    });

    return finalExportList;
}

if(executeExportBtn) executeExportBtn.addEventListener('click', () => {
    // 檢查是否有擴充或自訂詞庫
    const hasExt = typeof window.customExtDicts !== 'undefined' && window.customExtDicts.length > 0;
    const hasCustom = customDictionaryRaw.length > 0;
    if (!hasExt && !hasCustom) return showDialog({ type: 'alert', title: '無法匯出', icon: '⚠️', message: '目前沒有任何擴充或自訂詞彙可以匯出！' });

    const format = exportFormatType.value;

    if (format === 'csv') {
        const targetLang = exportTargetLang.value;
        const targetName = exportTargetLang.options[exportTargetLang.selectedIndex].text;
        
        // 🟢 呼叫合併函數取得資料
        const words = getMergedExportData(targetLang);
        
        if (words.length === 0) return showDialog({ type: 'alert', title: '無法匯出', icon: '⚠️', message: `【${targetName}】的擴充與自訂詞彙皆與基本詞庫重複，已被過濾，無須匯出。` });

        let csvContent = "\uFEFF詞目,拼音,相似詞,相反詞\n";
        words.forEach(w => {
            let syn = formatRelated(w.rawSyn);
            let ant = formatRelated(w.rawAnt);
            csvContent += `"${w.w}","${w.rawPy}","${syn}","${ant}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, `hakka-ext-${targetLang}.csv`);
        showDialog({ type: 'alert', title: 'CSV 匯出成功', icon: '📄', confirmColor: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20', message: `已成功匯出 (擴充 + 自訂) 共 ${words.length} 筆資料至 CSV。` });

    } else if (format === 'js') {
        const checkedLangs = Array.from(document.querySelectorAll('.export-lang-chk:checked')).map(chk => chk.value);
        if (checkedLangs.length === 0) return showDialog({ type: 'alert', title: '提示', icon: '⚠️', message: '請至少勾選一種要匯出的語言！' });

        const allBuiltinCache = {};
        if (typeof dictionaries !== 'undefined') {
            for (let lang in dictionaries) {
                allBuiltinCache[lang] = {};
                for (let py in dictionaries[lang]) {
                    dictionaries[lang][py].split(' ').forEach(w => {
                        if (!w) return;
                        if (!allBuiltinCache[lang][w]) allBuiltinCache[lang][w] = [];
                        allBuiltinCache[lang][w].push(py);
                    });
                }
            }
        }

        let jsContent = `/**\n* 烏衣行客語輸入法 - 擴充與自訂詞庫 (合併備份檔)\n* 匯出時間: ${new Date().toLocaleString()}\n*/\n`;
        jsContent += `if(!window.customExtDicts)window.customExtDicts=[];\n`;

        let totalExported = 0;

        checkedLangs.forEach(lang => {
            // 🟢 呼叫合併函數取得該語言的資料
            const filteredWords = getMergedExportData(lang);
            
            if (filteredWords.length === 0) return; 
            totalExported += filteredWords.length;

            jsContent += `window.customExtDicts.push({\nd:'${lang}',\nmatrix:[\n`;
            
            const langCache = allBuiltinCache[lang] || {};

            filteredWords.forEach((item, idx) => {
                const letterPinyin = convertNumToLetterPinyin(item.rawPy, lang);
                let exportPinyin = letterPinyin;
                
                // 極致壓縮：如果在基本詞庫中有唯一對應，則留空
                if (langCache[item.w] && langCache[item.w].length === 1 && langCache[item.w][0] === letterPinyin) {
                    exportPinyin = ""; 
                }

                let syn = formatRelated(item.rawSyn);
                let ant = formatRelated(item.rawAnt);
                const rowData = [item.w, exportPinyin, syn, ant];
                
                while (rowData.length > 0 && rowData[rowData.length - 1] === '') rowData.pop();
                jsContent += `${JSON.stringify(rowData)}${idx === filteredWords.length - 1 ? '' : ','}\n`;
            });
            jsContent += `]\n});\n`;
        });

        if (totalExported === 0) return showDialog({ type: 'alert', title: '無法匯出', icon: '⚠️', message: '您勾選的語言皆與基本詞庫重複，已被過濾，無須匯出。' });

        const blob = new Blob([jsContent], { type: 'text/javascript;charset=utf-8;' });
        triggerDownload(blob, `ext-phrase.js`);
        showDialog({ type: 'alert', title: 'JS 備份檔匯出成功', icon: '📦', confirmColor: 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20', message: `已成功將 (擴充 + 自訂) 詞庫完美合併匯出！\n共匯出 ${totalExported} 筆不重複詞彙。` });
    }
});

function triggerDownload(blob, filename) {
    if (navigator.msSaveBlob) navigator.msSaveBlob(blob, filename);
    else {
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob); link.setAttribute("href", url);
            link.setAttribute("download", filename); link.style.visibility = 'hidden';
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
        }
    }
}


// === 5. 無聲調字頻擴充產生器工具 (升級版：支援下載與純程式碼複製) ===

function processFreqTextToObj(text, targetLang) {
    const lines = text.split('\n');
    const map = {};
    let parsedCount = 0;

    lines.forEach(line => {
        const parts = line.split('\t');
        if (parts.length < 3) return;
        
        const freq = parseInt(parts[0], 10);
        if (isNaN(freq)) return;
        
        const char = parts[1].trim();
        if (Array.from(char).length !== 1) return; // 自動剔除多字詞，僅留單字
        
        let pyWithTone = parts[2].trim().toLowerCase();
        let pyToneless = pyWithTone.replace(/[zvsfxl0-9^⁺ˆˇˋˊ]+$/i, '');
        
        if (targetLang === 'kasu') {
            pyToneless = pyToneless.replace(/^rh/, 'r').replace(/^bb/, 'v').replace(/oo$/, 'o');
        }

        if (!map[pyToneless]) map[pyToneless] = [];
        if (!map[pyToneless].some(item => item.char === char)) {
            map[pyToneless].push({ char, freq });
            parsedCount++;
        }
    });

    const result = {};
    let validGroups = 0;

    for (let py in map) {
        if (map[py].length > 1) {
            map[py].sort((a, b) => b.freq - a.freq);
            result[py] = map[py].map(item => item.char).join('');
            validGroups++;
        }
    }

    return { result, parsedCount, validGroups };
}

const generateFreqBtn = document.getElementById('generateFreqBtn');
if (generateFreqBtn) {
    generateFreqBtn.addEventListener('click', () => {
        const text = document.getElementById('freqInputArea').value;
        const targetLang = document.getElementById('freqGenLang').value;
        const langName = document.getElementById('freqGenLang').options[document.getElementById('freqGenLang').selectedIndex].text;

        if (!text.trim()) return showDialog({ type: 'alert', title: '提示', icon: '⚠️', message: '請先在文字框內貼上次數表資料！' });

        const { result, parsedCount, validGroups } = processFreqTextToObj(text, targetLang);

        if (validGroups === 0) return showDialog({ type: 'alert', title: '產生失敗', icon: '❌', message: '解析完畢，但沒有發現任何需要排序的同音字資料。' });

        const jsContent = `/**\n* 烏衣行客語輸入法 - 無聲調同音字頻索引 (${langName})\n* 產生時間: ${new Date().toLocaleString()}\n*/\nwindow.tonelessPriority = window.tonelessPriority || {};\nwindow.tonelessPriority['${targetLang}'] = ${JSON.stringify(result)};`;
        
        const blob = new Blob([jsContent], { type: 'text/javascript;charset=utf-8;' });
        triggerDownload(blob, `ext-toneless-${targetLang}.js`);
        
        showDialog({ type: 'alert', title: '產生成功', icon: '✅', confirmColor: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20', message: `已成功產生【${langName}】的字頻擴充檔！\n共解析 ${parsedCount} 個單字，建立 ${validGroups} 組同音字排序索引。` });
    });
}

const copyFreqBtn = document.getElementById('copyFreqBtn');
if (copyFreqBtn) {
    copyFreqBtn.addEventListener('click', () => {
        const text = document.getElementById('freqInputArea').value;
        const targetLang = document.getElementById('freqGenLang').value;

        if (!text.trim()) return showDialog({ type: 'alert', title: '提示', icon: '⚠️', message: '請先在文字框內貼上次數表資料！' });

        const { result, validGroups } = processFreqTextToObj(text, targetLang);

        if (validGroups === 0) return showDialog({ type: 'alert', title: '複製失敗', icon: '❌', message: '解析完畢，但沒有發現任何需要排序的同音字資料。' });

        // 僅精準生成指定的核心指派程式碼部分
        const copyContent = `window.tonelessPriority = window.tonelessPriority || {};\nwindow.tonelessPriority['${targetLang}'] = ${JSON.stringify(result)};`;

        navigator.clipboard.writeText(copyContent).then(() => {
            // 複製成功後的綠色動態視覺反饋
            const originalHTML = copyFreqBtn.innerHTML;
            copyFreqBtn.className = copyFreqBtn.className.replace('bg-slate-600', 'bg-emerald-600').replace('hover:bg-slate-700', 'hover:bg-emerald-700');
            copyFreqBtn.textContent = '✅ 已複製！';
            
            setTimeout(() => {
                copyFreqBtn.className = copyFreqBtn.className.replace('bg-emerald-600', 'bg-slate-600').replace('hover:bg-emerald-700', 'hover:bg-slate-700');
                copyFreqBtn.innerHTML = originalHTML;
            }, 2000);
        }).catch(err => {
            showDialog({ type: 'alert', title: '複製失敗', icon: '❌', message: '瀏覽器拒絕了剪貼簿寫入請求，請嘗試手動複製。' });
        });
    });
}

// === 🟢 新增：貼上區塊的「一鍵清除」按鈕邏輯 ===
const clearPasteAreaBtn = document.getElementById('clearPasteAreaBtn');
if (clearPasteAreaBtn) {
    clearPasteAreaBtn.addEventListener('click', () => {
        const dictPasteArea = document.getElementById('dictPasteArea');
        if (dictPasteArea) {
            dictPasteArea.value = '';
            dictPasteArea.focus();
        }
    });
}

const clearFreqInputBtn = document.getElementById('clearFreqInputBtn');
if (clearFreqInputBtn) {
    clearFreqInputBtn.addEventListener('click', () => {
        const freqInputArea = document.getElementById('freqInputArea');
        if (freqInputArea) {
            freqInputArea.value = '';
            freqInputArea.focus();
        }
    });
}








// === 6. 🟢 自訂詞庫管理中心 (CRUD) ===
const openDictManagerBtn = document.getElementById('openDictManagerBtn');
const closeDictManagerBtn = document.getElementById('closeDictManagerBtn');
const dictManagerModal = document.getElementById('dictManagerModal');
const dictManagerList = document.getElementById('dictManagerList');
const dictManagerSearch = document.getElementById('dictManagerSearch');
const dictManagerLangFilter = document.getElementById('dictManagerLangFilter');

// 編輯表單元素
const dictEditModal = document.getElementById('dictEditModal');
const closeDictEditBtn = document.getElementById('closeDictEditBtn');
const cancelDictEditBtn = document.getElementById('cancelDictEditBtn');
const saveDictEditBtn = document.getElementById('saveDictEditBtn');
const addNewDictEntryBtn = document.getElementById('addNewDictEntryBtn');

// 載入語言選項到管理器
function initManagerLangs() {
    if (!dictManagerLangFilter) return;
    dictManagerLangFilter.innerHTML = '<option value="all">🌍 全語系</option>';
    const editEntryLang = document.getElementById('editEntryLang');
    if (editEntryLang) editEntryLang.innerHTML = '';

    langOptionsList.forEach(l => {
        dictManagerLangFilter.innerHTML += `<option value="${l.v}">${l.n}</option>`;
        if (editEntryLang) editEntryLang.innerHTML += `<option value="${l.v}">${l.n}</option>`;
    });
}
initManagerLangs();

// 🟢 新增分頁狀態變數
let currentDictPage = 1;
const dictItemsPerPage = 50; // 每頁顯示 50 筆，效能與閱讀體驗的最佳平衡點

// 渲染管理列表 (支援分頁與 DocumentFragment 效能優化)
function renderDictManager(resetPage = false) {
    if (!dictManagerList) return;
    
    // 如果有重新搜尋或切換語言，就強制回到第一頁
    if (resetPage) currentDictPage = 1;

    const searchTerm = dictManagerSearch.value.trim().toLowerCase();
    const filterLang = dictManagerLangFilter.value;

    // 1. 先把符合條件的資料過濾出來，並「打包」它們的原始索引 (Original Index)
    let filteredList = [];
    customDictionaryRaw.forEach((item, originalIndex) => {
        const lang = item.dialect || 'sixian';
        if (filterLang !== 'all' && lang !== filterLang) return;
        
        if (searchTerm) {
            if (!item.w.toLowerCase().includes(searchTerm) && !item.rawPy.toLowerCase().includes(searchTerm)) return;
        }
        filteredList.push({ item, originalIndex });
    });

    // 2. 計算分頁數據
    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / dictItemsPerPage) || 1;
    if (currentDictPage > totalPages) currentDictPage = totalPages;

    // 更新介面上的頁碼與按鈕狀態
    const pageInfo = document.getElementById('dictManagerPageInfo');
    const prevBtn = document.getElementById('dictPrevPageBtn');
    const nextBtn = document.getElementById('dictNextPageBtn');
    
    if (pageInfo) pageInfo.textContent = `共 ${totalItems} 筆，第 ${currentDictPage} / ${totalPages} 頁`;
    if (prevBtn) prevBtn.disabled = currentDictPage === 1;
    if (nextBtn) nextBtn.disabled = currentDictPage === totalPages;

    // 3. 裁切出「當前頁面」需要的資料範圍
    const startIndex = (currentDictPage - 1) * dictItemsPerPage;
    const endIndex = startIndex + dictItemsPerPage;
    const pageData = filteredList.slice(startIndex, endIndex);

    dictManagerList.innerHTML = '';
    
    if (totalItems === 0) {
        dictManagerList.innerHTML = `<div class="text-center py-8 text-gray-400 font-medium text-sm">找不到符合的詞彙 🕵️</div>`;
        return;
    }

    // 4. 建立 DocumentFragment (虛擬 DOM 節點，提升大量渲染時的效能)
    const fragment = document.createDocumentFragment();

    pageData.forEach(data => {
        const { item, originalIndex } = data; // 取出真正的索引，確保編輯刪除不會錯亂
        const lang = item.dialect || 'sixian';
        const langName = displayNames[lang] || lang;
        const synText = item.rawSyn ? `<span class="text-green-600 text-xs px-1.5 py-0.5 bg-green-50 rounded border border-green-100">似: ${item.rawSyn}</span>` : '';
        const antText = item.rawAnt ? `<span class="text-red-600 text-xs px-1.5 py-0.5 bg-red-50 rounded border border-red-100">反: ${item.rawAnt}</span>` : '';

        const row = document.createElement('div');
        row.className = 'flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-3.5 bg-white hover:bg-slate-50 transition-colors gap-2 group';
        row.innerHTML = `
            <div class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold text-white bg-slate-400 px-1.5 py-0.5 rounded">${langName}</span>
                    <span class="text-lg font-bold text-gray-800">${item.w}</span>
                    <span class="text-sm font-mono text-blue-600 bg-blue-50 px-1.5 rounded">${item.rawPy}</span>
                </div>
                <div class="flex flex-wrap gap-1 mt-0.5">
                    ${synText} ${antText}
                </div>
            </div>
            <div class="flex gap-1.5 w-full sm:w-auto justify-end">
                <button onclick="openDictEditModal(${originalIndex})" class="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition">編輯</button>
                <button onclick="deleteDictEntry(${originalIndex})" class="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition">刪除</button>
            </div>
        `;
        fragment.appendChild(row);
    });

    // 將打包好的節點一次性塞入畫面，效能最佳化！
    dictManagerList.appendChild(fragment);
    
    // 換頁後，自動將滾動條捲回最上方
    const listContainer = dictManagerList.parentElement;
    if (listContainer) listContainer.scrollTop = 0;
}

// 綁定搜尋與過濾事件 (觸發時傳入 true，讓分頁強制回到第一頁)
if (dictManagerSearch) dictManagerSearch.addEventListener('input', () => renderDictManager(true));
if (dictManagerLangFilter) dictManagerLangFilter.addEventListener('change', () => renderDictManager(true));

// 開關主管理視窗 (打開時也強制回到第一頁)
if (openDictManagerBtn) openDictManagerBtn.addEventListener('click', () => {
    dictManagerModal.classList.remove('hidden');
    renderDictManager(true);
});
if (closeDictManagerBtn) closeDictManagerBtn.addEventListener('click', () => {
    dictManagerModal.classList.add('hidden');
});

// 🟢 綁定上下頁按鈕的點擊事件
const dictPrevPageBtn = document.getElementById('dictPrevPageBtn');
const dictNextPageBtn = document.getElementById('dictNextPageBtn');

if (dictPrevPageBtn) {
    dictPrevPageBtn.addEventListener('click', () => {
        if (currentDictPage > 1) { 
            currentDictPage--; 
            renderDictManager(); 
        }
    });
}

if (dictNextPageBtn) {
    dictNextPageBtn.addEventListener('click', () => {
        currentDictPage++; 
        renderDictManager();
    });
}
// 綁定搜尋與過濾事件
if (dictManagerSearch) dictManagerSearch.addEventListener('input', renderDictManager);
if (dictManagerLangFilter) dictManagerLangFilter.addEventListener('change', renderDictManager);

// 開關主管理視窗
if (openDictManagerBtn) openDictManagerBtn.addEventListener('click', () => {
    dictManagerModal.classList.remove('hidden');
    renderDictManager();
});
if (closeDictManagerBtn) closeDictManagerBtn.addEventListener('click', () => {
    dictManagerModal.classList.add('hidden');
});

// 打開新增/編輯視窗
window.openDictEditModal = function(index) {
    const title = document.getElementById('dictEditTitle');
    const idxInput = document.getElementById('editEntryIndex');
    const wInput = document.getElementById('editEntryWord');
    const pyInput = document.getElementById('editEntryPinyin');
    const synInput = document.getElementById('editEntrySyn');
    const antInput = document.getElementById('editEntryAnt');
    const langInput = document.getElementById('editEntryLang');

    if (index === -1) {
        title.textContent = '新增自訂詞彙';
        idxInput.value = '-1';
        wInput.value = ''; pyInput.value = ''; synInput.value = ''; antInput.value = '';
        langInput.value = userConfig.dialect;
    } else {
        const item = customDictionaryRaw[index];
        title.textContent = '編輯詞彙';
        idxInput.value = index.toString();
        wInput.value = item.w; pyInput.value = item.rawPy; 
        synInput.value = item.rawSyn || ''; antInput.value = item.rawAnt || '';
        langInput.value = item.dialect || 'sixian';
    }

    dictEditModal.classList.remove('hidden');
    setTimeout(() => { dictEditModal.classList.remove('opacity-0', 'scale-95'); }, 10);
};

if (addNewDictEntryBtn) addNewDictEntryBtn.addEventListener('click', () => openDictEditModal(-1));

function closeEditModal() {
    dictEditModal.classList.add('opacity-0', 'scale-95');
    setTimeout(() => { dictEditModal.classList.add('hidden'); }, 200);
}
if (closeDictEditBtn) closeDictEditBtn.addEventListener('click', closeEditModal);
if (cancelDictEditBtn) cancelDictEditBtn.addEventListener('click', closeEditModal);

// 儲存編輯或新增
if (saveDictEditBtn) saveDictEditBtn.addEventListener('click', () => {
    const index = parseInt(document.getElementById('editEntryIndex').value);
    const lang = document.getElementById('editEntryLang').value;
    const w = document.getElementById('editEntryWord').value.trim();
    const rawPy = document.getElementById('editEntryPinyin').value.trim();
    const rawSyn = document.getElementById('editEntrySyn').value.trim();
    const rawAnt = document.getElementById('editEntryAnt').value.trim();

    if (!w || !rawPy) return showDialog({ type: 'alert', title: '錯誤', icon: '⚠️', message: '詞目與拼音為必填欄位！' });

    if (index === -1) {
        customDictionaryRaw.push({ dialect: lang, w, rawPy, rawSyn, rawAnt });
    } else {
        customDictionaryRaw[index] = { dialect: lang, w, rawPy, rawSyn, rawAnt };
    }

    rebuildCoreDictionariesAndSave();
    closeEditModal();
    renderDictManager();
});

// 刪除詞彙
window.deleteDictEntry = function(index) {
    const item = customDictionaryRaw[index];
    showDialog({
        type: 'confirm', title: '確認刪除', icon: '🗑️', confirmColor: 'bg-rose-600 hover:bg-rose-700',
        message: `確定要刪除「${item.w}」嗎？`,
        onConfirm: () => {
            customDictionaryRaw.splice(index, 1);
            rebuildCoreDictionariesAndSave();
            renderDictManager();
        }
    });
};

function rebuildCoreDictionariesAndSave() {
    if (typeof crossDialectPredCache !== 'undefined') crossDialectPredCache.lang = '';
    localStorage.setItem('hakka_custom_dict_v3', JSON.stringify(customDictionaryRaw));
    dictionaryData = []; 
    dictionaryMap.clear();
    loadDefaultDictionary();
    customDictionaryRaw.forEach(item => {
        const itemDialect = item.dialect || 'sixian';
        if (itemDialect === userConfig.dialect) addWordToDict(item.w, item.rawPy, false, item.rawSyn, item.rawAnt);
    });
    updateDictCount();
    if(pinyinInput) { pinyinInput.value = ''; pinyinInput.focus(); }
    currentCandidates = []; renderCandidates();
}

const convertToneBtn = document.getElementById('convertToneBtn');
if (convertToneBtn) {
    convertToneBtn.addEventListener('click', (e) => {
        e.preventDefault(); // 避免點擊時觸發其他表單送出
        const pyInput = document.getElementById('editEntryPinyin');
        const langInput = document.getElementById('editEntryLang');
        if (!pyInput || !langInput) return;

        const rawVal = pyInput.value.trim();
        if (!rawVal) return;

        const targetLang = langInput.value;
        // 取得該腔調的聲調設定 (若找不到則預設用四縣腔)
        const currentToneMap = (typeof toneMappings !== 'undefined' && toneMappings[targetLang]) 
                                ? toneMappings[targetLang] 
                                : (typeof toneMappings !== 'undefined' ? toneMappings['sixian'] : null);
        
        if (!currentToneMap) return;

        // 1. 建立反向對照表： { 's': '31', 'v': '11', 'z': '24', ... }
        const reverseMap = {};
        for (let num in currentToneMap) {
            const letter = currentToneMap[num].letter;
            if (letter) reverseMap[letter.toLowerCase()] = num;
        }

        // 2. 將所有聲調字母依長度由大到小排序 (確保比對精確)
        const toneLetters = Object.keys(reverseMap).sort((a, b) => b.length - a.length);

        // 3. 拆解拼音並進行轉換
        const converted = rawVal.split(/\s+/).map(s => {
            let lowerS = s.toLowerCase();
            for (let t of toneLetters) {
                if (lowerS.endsWith(t)) {
                    // 切掉聲調字母，取得基礎拼音 (例如 fis -> fi)
                    const basePy = s.slice(0, -t.length);
                    // 確保前面還有純英文字母才轉換，避免誤傷
                    if (basePy.length > 0 && /^[a-zA-Z]+$/.test(basePy)) {
                        return basePy + reverseMap[t]; // fi + 31 -> fi31
                    }
                }
            }
            return s; // 若沒找到對應的聲調字母 (或者已經是數字了)，維持原樣
        }).join(' ');

        // 4. 寫回輸入框並給予視覺反饋
        pyInput.value = converted;
        pyInput.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-300');
        
        setTimeout(() => {
            pyInput.classList.remove('bg-emerald-50', 'text-emerald-700', 'border-emerald-300');
        }, 500);
    });
}




// === 7. 🟢 智慧連打引擎 (Forward Maximum Matching) ===

// 🟢 新增：全域快取引擎，將 10 萬次運算降為 0 次
let continuousCache = null;

function getContinuousCache(dialect) {
    // 智慧判斷：如果字典數量沒變，且腔調沒變，就直接拿「背好的小抄」！
    if (continuousCache && continuousCache.dialect === dialect && continuousCache.dictLength === dictionaryData.length) {
        return continuousCache;
    }
    
    // 如果是第一次載入，或字典有更新，就花 0.05 秒重新整理小抄
    continuousCache = {
        dialect: dialect,
        dictLength: dictionaryData.length,
        multi: [], 
        singleMap: new Map(),
        validSyllables: new Set()
    };
    
    const dictToneRegex = /[zvsfxl0-9^⁺ˆˇˋˊ]+$/i;
    
    // 1. 快取：合法音節表 (用於 Tokenizer 快速切詞)
    if (window.tonelessPriority && window.tonelessPriority[dialect]) {
        Object.keys(window.tonelessPriority[dialect]).forEach(py => continuousCache.validSyllables.add(py));
    } else if (typeof dictionaries !== 'undefined' && dictionaries[dialect]) {
        Object.keys(dictionaries[dialect]).forEach(py => continuousCache.validSyllables.add(py.replace(dictToneRegex, '').toLowerCase()));
    }

    // 2. 快取：將所有詞庫字串先處理好，打字時就不必算
    for (let item of dictionaryData) {
        const charLen = Array.from(item.w).length;
        // 直接使用系統建置時已經算好的 pyN (字母拼音)
        let itemLetterPy = item.pyN || convertNumToLetterPinyin(item.rawPy, dialect).toLowerCase();
        if (!itemLetterPy) continue;
        
        let itemPyArray = itemLetterPy.split(/\s+/);
        let originalPy = itemPyArray.join('');
        let tonelessPy = itemPyArray.map(t => t.replace(dictToneRegex, '')).join('');
        
        if (charLen > 1) {
            continuousCache.multi.push({ w: item.w, originalPy, tonelessPy, len: itemPyArray.length });
        } else {
            if (!continuousCache.singleMap.has(tonelessPy)) {
                continuousCache.singleMap.set(tonelessPy, item.w);
            }
        }
    }
    return continuousCache;
}

// 動態取得使用者的聲調剝除規則
function getInputToneRegex(isContinuous) {
    if (isContinuous && !userConfig.allowToneInContinuous) {
        return /[0-9^⁺ˆˇˋˊ]+$/i;
    }
    return /[zvsfxl0-9^⁺ˆˇˋˊ]+$/i;
}

// 1. 自動拼音分詞器 (升級：直接套用快取的 validSyllables)
function tokenizePinyin(inputVal, dialect) {
    let rawParts = inputVal.toLowerCase().split(/['\s]+/);
    let tokens = [];
    
    const cache = getContinuousCache(dialect);
    const validSyllables = cache.validSyllables;
    const inputToneRegex = getInputToneRegex(userConfig.continuousMode);

    rawParts.forEach(part => {
        let s = part;
        while (s.length > 0) {
            let matched = false;
            for (let len = Math.min(8, s.length); len > 0; len--) {
                let chunk = s.substring(0, len);
                let tonelessChunk = chunk.replace(inputToneRegex, ''); 
                
                if (dialect === 'kasu') {
                    tonelessChunk = tonelessChunk.replace(/^rh/, 'r').replace(/^bb/, 'v').replace(/oo$/, 'o');
                }

                if (validSyllables.has(tonelessChunk)) {
                    tokens.push(chunk);
                    s = s.substring(len);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                tokens.push(s.substring(0, 1));
                s = s.substring(1);
            }
        }
    });
    return tokens;
}

// 2. 尋找最佳多字詞 (升級：無迴圈算繪，直接比對快取)
function findBestMultiSyllableWord(pyTokens, dialect) {
    const cache = getContinuousCache(dialect);
    const inputToneRegex = getInputToneRegex(true);
    
    const queryOriginal = pyTokens.join(''); 
    const queryToneless = pyTokens.map(t => t.replace(inputToneRegex, '')).join('');
    const queryLen = pyTokens.length;

    let bestWord = null;
    
    // 只在快取的陣列中進行簡單的字串比對，效能極高
    for (let item of cache.multi) {
        if (item.len !== queryLen) continue;
        if (item.originalPy === queryOriginal) return item.w; 
        if (item.tonelessPy === queryToneless && !bestWord) bestWord = item.w; 
    }
    return bestWord;
}

// 3. 尋找最佳單字 (升級：無迴圈算繪，直接查找 Map)
function findBestSingleChar(pyToken, dialect) {
    const inputToneRegex = getInputToneRegex(true);
    let tonelessToken = pyToken.replace(inputToneRegex, '').toLowerCase();
    
    if (dialect === 'kasu') {
        tonelessToken = tonelessToken.replace(/^rh/, 'r').replace(/^bb/, 'v').replace(/oo$/, 'o');
    }

    // 優先：次數最多的字頻表
    if (window.tonelessPriority && window.tonelessPriority[dialect]) {
        let priorityStr = window.tonelessPriority[dialect][tonelessToken];
        if (priorityStr && priorityStr.length > 0) return Array.from(priorityStr)[0]; 
    }
    
    // 備案：從快取 Map 直接 O(1) 讀取
    const cache = getContinuousCache(dialect);
    if (cache.singleMap.has(tonelessToken)) {
        return cache.singleMap.get(tonelessToken);
    }
    
    return pyToken; 
}

// 4. 連打引擎主函數
function smartContinuousMatch(inputVal, dialect) {
    const tokens = tokenizePinyin(inputVal, dialect);
    let result = "";
    let i = 0;

    while (i < tokens.length) {
        let matched = false;
        for (let len = Math.min(5, tokens.length - i); len >= 2; len--) {
            let chunkTokens = tokens.slice(i, i + len);
            let word = findBestMultiSyllableWord(chunkTokens, dialect);
            if (word) {
                result += word;
                i += len;
                matched = true;
                break;
            }
        }
        if (!matched) {
            result += findBestSingleChar(tokens[i], dialect);
            i += 1;
        }
    }
    return result;
}



// === 🟢 新增：常用模式快捷切換邏輯 ===
const modeBasicBtn = document.getElementById('modeBasicBtn');
const modeSingleBtn = document.getElementById('modeSingleBtn');
const modeContinuousBtn = document.getElementById('modeContinuousBtn');

function applyQuickMode(mode) {
    const reqSingle = document.getElementById('set_reqToneSingle');
    const reqMulti = document.getElementById('set_reqToneMulti');
    const allowAbbr = document.getElementById('set_allowAbbrMulti');
    const singleMode = document.getElementById('set_singleCharMode');
    const contMode = document.getElementById('set_continuousMode');
    const allowToneCont = document.getElementById('set_allowToneInContinuous');

    if (!reqSingle) return;

    if (mode === 'basic') {
        reqSingle.checked = true;
        reqMulti.checked = false;
        allowAbbr.checked = true;
        singleMode.checked = false;
        contMode.checked = false;
        allowToneCont.checked = false;
    } else if (mode === 'single') {
        reqSingle.checked = true;
        reqMulti.checked = false;
        allowAbbr.checked = false;
        singleMode.checked = true;
        contMode.checked = false;
        allowToneCont.checked = false;
    } else if (mode === 'continuous') {
        reqSingle.checked = false;
        reqMulti.checked = false;
        allowAbbr.checked = false;
        singleMode.checked = false;
        contMode.checked = true;
        allowToneCont.checked = false;
    }

    // 視覺反饋特效：點擊瞬間變色
    const activeBtn = mode === 'basic' ? modeBasicBtn : (mode === 'single' ? modeSingleBtn : modeContinuousBtn);
    if (activeBtn) {
        const originalClass = activeBtn.className;
        activeBtn.classList.add('bg-blue-100', 'border-blue-400', 'ring-2', 'ring-blue-200', 'text-blue-800');
        setTimeout(() => {
            activeBtn.className = originalClass;
        }, 300);
    }
}

if (modeBasicBtn) modeBasicBtn.addEventListener('click', () => applyQuickMode('basic'));
if (modeSingleBtn) modeSingleBtn.addEventListener('click', () => applyQuickMode('single'));
if (modeContinuousBtn) modeContinuousBtn.addEventListener('click', () => applyQuickMode('continuous'));


// === 8. 🟢 關聯詞 (聯想詞) 預測引擎 ===
let crossDialectPredCache = { lang: '', words: [] }; // 跨語言關聯詞快取池

function showPredictiveCandidates() {
    if (!editor || !userConfig.enablePredictiveText) return;
    
    // 1. 判斷當前語言與應使用的關聯詞庫
    let targetPredLang = userConfig.dialect;
    if (userConfig.dialect === 'cangjie') targetPredLang = userConfig.predCangjie || 'none';
    else if (userConfig.dialect === 'xiami') targetPredLang = userConfig.predXiami || 'none';
    else if (userConfig.dialect === 'hanglie') targetPredLang = userConfig.predHanglie || 'none';

    if (targetPredLang === 'none') {
        pinyinInput.dispatchEvent(new Event('input')); pinyinInput.focus();
        return;
    }

    let textBeforeCursor = editor.value.substring(0, editor.selectionStart);
    if (!textBeforeCursor) {
        pinyinInput.dispatchEvent(new Event('input')); pinyinInput.focus();
        return;
    }

    let charsBeforeCursor = Array.from(textBeforeCursor);
    let maxContextLen = Math.min(4, charsBeforeCursor.length);
    let preds = [];
    
    // 2. 準備搜尋池 (Search Pool)
    let isCrossDialect = targetPredLang !== userConfig.dialect;
    let searchPool = [];
    
    if (isCrossDialect) {
        if (crossDialectPredCache.lang !== targetPredLang) {
            let tempSet = new Set();
            if (typeof dictionaries !== 'undefined' && dictionaries[targetPredLang]) {
                for (let py in dictionaries[targetPredLang]) {
                    // 🟢 加入 String() 強制轉型，保護擴充漢字不出錯
                    dictionaries[targetPredLang][py].split(' ').forEach(w => { if (w) tempSet.add(String(w)); });
                }
            }
            if (typeof window.customExtDicts !== 'undefined') {
                window.customExtDicts.forEach(group => {
                    const lang = group.d || group.dialect || 'sixian';
                    if (lang === targetPredLang && Array.isArray(group.matrix)) {
                        group.matrix.forEach(row => { if (row[0]) tempSet.add(String(row[0])); });
                    }
                });
            }
            customDictionaryRaw.forEach(item => {
                const lang = item.dialect || 'sixian';
                if (lang === targetPredLang) tempSet.add(String(item.w));
            });
            
            crossDialectPredCache.lang = targetPredLang;
            crossDialectPredCache.words = Array.from(tempSet);
        }
        searchPool = crossDialectPredCache.words;
    }

    // 3. 執行聯想詞比對
    for (let len = maxContextLen; len >= 1; len--) {
        let contextChars = charsBeforeCursor.slice(-len);
        let context = contextChars.join('');
        
        // 🟢 終極修正：放棄 \p{Script=Han}，改用絕對安全的 Unicode 區塊硬編碼 (涵蓋基本至 Ext-I 所有漢字)
        const hanRegex = /^[\u4E00-\u9FFF\u3400-\u4DBF\u{20000}-\u{2FA1F}]+$/u;
        if (!hanRegex.test(context)) continue;

        if (!isCrossDialect) {
            for (let item of dictionaryData) {
                if (item.w.startsWith(context) && item.w !== context) {
                    let remainder = item.w.substring(context.length);
                    let displayStr = '*'.repeat(len) + remainder;
                    if (!preds.includes(displayStr)) preds.push(displayStr);
                }
                if (preds.length >= 25) break; 
            }
        } else {
            for (let w of searchPool) {
                if (w.startsWith(context) && w !== context) {
                    let remainder = w.substring(context.length);
                    let displayStr = '*'.repeat(len) + remainder;
                    if (!preds.includes(displayStr)) preds.push(displayStr);
                }
                if (preds.length >= 25) break;
            }
        }
        
        if (preds.length > 0) break;
    }

    if (preds.length > 0) {
        currentCandidates = preds;
        currentPage = 0;
        renderCandidates();
        pinyinInput.focus();
    } else {
        pinyinInput.dispatchEvent(new Event('input')); 
        pinyinInput.focus();
    }
}