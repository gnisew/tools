
//字中調檢測
const regexLetter = /Ű|ű|A̋|A̍|E̋|E̍|I̋|I̍|M̀|M̂|M̄|M̋|M̌|M̍|N̂|N̄|N̋|N̍|O̍|U̍|Y̋|Y̌|Y̍|a̋|a̍|e̋|e̍|i̋|i̍|m̀|m̂|m̄|m̋|m̌|m̍|n̂|n̄|n̋|n̍|o̍|u̍|y̋|y̌|y̍|[ỲÝŶȲŇỳýŷȳňÀÁÂÈÉÊÌÍÎÒÓÔÙÚÛàáâèéêìíîòóôùúûĀāĒēĚěĪīŃńŌōŐőŪūǍǎǏǐǑǒǓǔǸǹḾḿ]/i;

//字尾調檢測
const regexTone = /(?<!\w)(tsh|chh|th|ph|kh|ts|ch|zh|sh|rh|ng|bb|gg|[bpmfvdtnlgkhzcsjqxry])?(?:ng|[aeioumy]){1,3}(?:nnh|nnd|ng|nn|[mnbdgptkhr])?([ˊˋˇˆ⁺\^\+])(?!\w)/i;

//數字調檢測
const regexNumber = /(?<!\w)(tsh|chh|th|ph|kh|ts|ch|zh|sh|rh|ng|bb|gg|[bpmfvdtnlgkhzcsjqxry])?(?:ng|[aeioumy]){1,3}(?:nnh|nnd|ng|nn|[mnbdgptkhr])?([123456789])(?!\w)/i;

//字母調檢測
const regexZvs = /(?<!\w)(tsh|chh|th|ph|kh|ts|ch|zh|sh|rh|ng|bb|gg|[bpmfvdtnlgkhzcsjqxry])?(?:ng|[aeioumy]){1,3}(?:nnh|nnd|ng|nn|[mnbdgptkhr])?([zvsxfl])(?!\w)/i;


//小注音檢測
const regexBpmSmall =/[-]/i;
//大注音檢測
const regexBpmBig =/[ㄅ-ㆷ,兀,万,勺,廿]/i;
//直注音檢測
const regexBpmTiny =/[-]/i;

/*
// 和樂字母調轉數字調
const holoZvsToNumber = (function() {
    const toneMap = { zz: '9', z: '2', s: '3', x: '5', v: '6', f: '7', l: '8' };
    
    // 基本模式
    const basePattern = `\\b(tsh|ph|th|kh|ts|ng|[pmtnlkhjsbg])?([aeiour]{1,3})`;    
    // 鼻音結尾正則
    const nasalRegex = new RegExp(`${basePattern}(ng|nn|[mn]?)(zz|[zsxvf])?\\b`, 'gi');    
    // 塞音結尾正則
    const stopRegex = new RegExp(`${basePattern}([ptkh])([l]?)\\b`, 'gi');
    
    return function(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        let result = text;
        
        // 處理鼻音結尾
        result = result.replace(nasalRegex, (match, initial, vowel, nasal, tone) => {
            const base = `${initial || ''}${vowel}${nasal}`;
            return base + (toneMap[tone] || '1');
        });
        
        // 處理塞音結尾
        result = result.replace(stopRegex, (match, initial, vowel, stop, tone) => {
            const base = `${initial || ''}${vowel}${stop}`;
            return base + (toneMap[tone] || '4');
        });
        
        return result;
    };
})();
*/

// 和樂字母調轉數字調
const holoZvsToNumber = (function() {
    // 1. 聲調對應表
    const toneMap = { zz: '9', z: '2', s: '3', x: '5', v: '6', f: '7', l: '8' };
    
    // 定義聲母 Pattern (抽取出來共用)
    // 包含雙字母聲母 (tsh, ph...) 和單字母 (p, m, t...)
    const initialPatternStr = '(tsh|ph|th|kh|ts|ng|[pmtnlkhjsbg])?';

    // 2. 姆音成韻正則 (修正版：加入聲母支援)
    // 結構：邊界 + (聲母) + (韻母 m/n/ng) + (入聲或舒聲調) + 邊界
    const syllabicRegex = new RegExp(
        `\\b${initialPatternStr}(ng|m|n)(?:(h)(l?)|(zz|[zsxvf]))?\\b`, 
        'gi'
    );

    // 3. 一般帶母音的正則 (維持原樣，但使用變數組合更整潔)
    const basePattern = `${initialPatternStr}([aeiour]{1,3})`; 
    const nasalRegex = new RegExp(`\\b${basePattern}(ng|nn|[mn]?)(zz|[zsxvf])?\\b`, 'gi');    
    const stopRegex = new RegExp(`\\b${basePattern}([ptkh])([l]?)\\b`, 'gi');

    return function(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        let result = text;
        
        // --- 優先處理：姆音成韻 (含聲母) ---
        // 例如: sngz, tng, mng, hngh ...
        result = result.replace(syllabicRegex, (match, initial, nucleus, stopH, stopL, toneChar) => {

            const outputInitial = initial || '';

            // 情況 A: 入聲 (結尾有 h)
            if (stopH) {
                const tone = stopL ? '8' : '4'; 
                return `${outputInitial}${nucleus}h${tone}`;
            }
            
            // 情況 B: 舒聲
            const tone = toneMap[toneChar] || '1';
            return `${outputInitial}${nucleus}${tone}`;
        });
        
       
        // 一般舒聲/鼻音
        result = result.replace(nasalRegex, (match, initial, vowel, nasal, tone) => {
            const base = `${initial || ''}${vowel}${nasal}`;
            return base + (toneMap[tone] || '1');
        });
        
        // 一般入聲 (ptk 結尾)
        result = result.replace(stopRegex, (match, initial, vowel, stop, tone) => {
            const base = `${initial || ''}${vowel}${stop}`;
            // 這裡 tone 對應的是 stopRegex 的第4個 group ([l]?)
            const toneNum = (tone === 'l') ? '8' : '4'; 
            return base + toneNum;
        });
        
        return result;
    };
})();


// 和樂數字調轉字母調
const holoNumberToZvs = (function() {

    const numberToToneMap = { '9': 'zz', '2': 'z', '3': 's', '5': 'x', '6': 'v', '7': 'f', '8': 'l' };
    // 1 和 4 會被刪除 (對應到空字串)
    
    // 基本模式
	const basePattern = `\\b(tsh|ph|th|kh|ts|ng|[pmtnlkhjsbg])?([aeiour]{0,3})`;   
    
    // 鼻音結尾 + 數字
    const nasalRegex = new RegExp(`${basePattern}(ng|nn|[mn]?)([1235679])\\b`, 'gi');
    
    // 塞音結尾 + 數字
    const stopRegex = new RegExp(`${basePattern}([ptkh]|nnh|ngh|mh)([48])\\b`, 'gi');
    
    return function(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        let result = text;
        
        // 處理鼻音結尾
        result = result.replace(nasalRegex, (match, initial, vowel, nasal, number) => {
            const base = `${initial || ''}${vowel}${nasal}`;
            const tone = numberToToneMap[number] || ''; // 1和4會變成空字串(被刪除)
            return base + tone;
        });
        
        // 處理塞音結尾
        result = result.replace(stopRegex, (match, initial, vowel, stop, number) => {
            const base = `${initial || ''}${vowel}${stop}`;
            const tone = numberToToneMap[number] || ''; // 1和4會變成空字串(被刪除)
            return base + tone;
        });
        
        return result;
    };
})();



// 和樂教羅轉台羅 
const holoPojToTailo = (function() {
  function holoPojToTailo(text) {
    const replacements = [
		[/oe/g, "ue"],
		[/őe/g, "űe"],
		[/óe/g, "ué"],
		[/òe/g, "uè"],
		[/ôe/g, "uê"],
		[/ǒe/g, "uě"],
		[/ōe/g, "uē"],
		[/o̍e/g, "ue̍"],
		[/oé/g, "ué"],
		[/oè/g, "uè"],
		[/oê/g, "uê"],
		[/oě/g, "uě"],
		[/oē/g, "uē"],
		[/oe̍/g, "ue̍"],
		[/Oé/g, "Ué"],
		[/Oè/g, "Uè"],
		[/Oê/g, "Uê"],
		[/O/g, "Uě"],
		[/Oē/g, "Uē"],
		[/Oe̍/g, "Ue̍"],
		[/oa/g, "ua"],
		[/őa/g, "űa"],
		[/óa/g, "uá"],
		[/òa/g, "uà"],
		[/ôa/g, "uâ"],
		[/ǒa/g, "uǎ"],
		[/ōa/g, "uā"],
		[/o̍a/g, "u̍a"],
		[/oá/g, "uá"],
		[/oà/g, "uà"],
		[/oâ/g, "uâ"],
		[/oǎ/g, "uǎ"],
		[/oā/g, "uā"],
		[/oa̍/g, "ua̍"],
		[/oa̋/g, "ua̋"],
		[/ek\b/g, "ik"],
		[/e̋k\b/g, "i̋k"],
		[/ék\b/g, "ík"],
		[/èk\b/g, "ìk"],
		[/êk\b/g, "îk"],
		[/ěk\b/g, "ǐk"],
		[/ēk\b/g, "īk"],
		[/e̍k\b/g, "i̍k"],
		[/eng\b/g, "ing"],
		[/e̋ng\b/g, "i̋ng"],
		[/éng\b/g, "íng"],
		[/èng\b/g, "ìng"],
		[/êng\b/g, "îng"],
		[/ěng\b/g, "ǐng"],
		[/ēng\b/g, "īng"],
		[/e̍ng\b/g, "i̍ng"],
		[/Oe/g, "Ue"],
		[/Őe/g, "Űe"],
		[/Óe/g, "Ué"],
		[/Òe/g, "Uè"],
		[/Ôe/g, "Uê"],
		[/Ǒe/g, "Uě"],
		[/Ōe/g, "Uē"],
		[/O̍e/g, "U̍e"],
		[/Oa/g, "Ua"],
		[/Őa/g, "Űa"],
		[/Óa/g, "Uá"],
		[/Òa/g, "Uà"],
		[/Ôa/g, "Uâ"],
		[/Ǒa/g, "Uǎ"],
		[/Ōa/g, "Uā"],
		[/O̍a/g, "U̍a"],
		[/Oá/g, "Uá"],
		[/Oà/g, "Uà"],
		[/Oâ/g, "Uâ"],
		[/Oǎ/g, "Uǎ"],
		[/Oā/g, "Uā"],
		[/Oa̍/g, "Ua̍"],
		[/Oa̋/g, "Ua̋"],
		[/Ek\b/g, "I̍k"],
		[/E̋k\b/g, "I̋k"],
		[/Ék\b/g, "Ík"],
		[/Èk\b/g, "Ìk"],
		[/Êk\b/g, "Îk"],
		[/Ěk\b/g, "Ǐk"],
		[/Ēk\b/g, "Īk"],
		[/E̍k\b/g, "I̍k"],
		[/Eng\b/g, "I̍ng"],
		[/E̋ng\b/g, "I̋ng"],
		[/Éng\b/g, "Íng"],
		[/Èng\b/g, "Ìng"],
		[/Êng\b/g, "Îng"],
		[/Ěng\b/g, "Ǐng"],
		[/Ēng\b/g, "Īng"],
		[/E̍ng\b/g, "I̍ng"],
		[/Ő\u0358/g, "Őo"],
		[/Ó\u0358/g, "Óo"],
		[/Ò\u0358/g, "Òo"],
		[/Ô\u0358/g, "Ôo"],
		[/Ǒ\u0358/g, "Ǒo"],
		[/Ō\u0358/g, "Ōo"],
		[/O̍\u0358/g, "O̍o"],
		[/Ő\u00B7/g, "Őo"],
		[/Ó\u00B7/g, "Óo"],
		[/Ò\u00B7/g, "Òo"],
		[/Ô\u00B7/g, "Ôo"],
		[/Ǒ\u00B7/g, "Ǒo"],
		[/Ō\u00B7/g, "Ōo"],
		[/O̍\u00B7/g, "O̍o"],
		[/o\u0358/g, "oo"],
		[/ő\u0358/g, "őo"],
		[/ó\u0358/g, "óo"],
		[/ò\u0358/g, "òo"],
		[/ô\u0358/g, "ôo"],
		[/ǒ\u0358/g, "ǒo"],
		[/ō\u0358/g, "ōo"],
		[/o̍\u0358/g, "o̍o"],
		[/o\u00B7/g, "oo"],
		[/ő\u00B7/g, "őo"],
		[/ó\u00B7/g, "óo"],
		[/ò\u00B7/g, "òo"],
		[/ô\u00B7/g, "ôo"],
		[/ǒ\u00B7/g, "ǒo"],
		[/ō\u00B7/g, "ōo"],
		[/o̍\u00B7/g, "o̍o"],
		[/ⁿ/g, "nn"],
    ]
    for (const [pattern, replacement] of replacements) {
      text = text.replace(pattern, replacement)
    }


	const vowelsAndDiacritics = 'Ű|ű|A̋|A̍|E̋|E̍|I̋|I̍|M̀|M̂|M̄|M̋|M̌|M̍|N̂|N̄|N̋|N̍|O̍|U̍|a̋|a̍|e̋|e̍|i̋|i̍|m̀|m̂|m̄|m̋|m̌|m̍|n̂|n̄|n̋|n̍|o̍|u̍|[ŇňÀÁÂÈÉÊÌÍÎÒÓÔÙÚÛàáâèéêìíîòóôùúûĀāĒēĚěĪīŃńŌōŐőŪūǍǎǏǐǑǒǓǔǸǹḾḿaeioumnrAEIOUMNR]{1,3}';
	const consonants = 'NG|NN|ng|nn|[ptkhgPTKHG]';
	const numbers = '[123456789]?';

	const replacementsCh = [
		{ from: 'CHH', to: 'TSH' },
		{ from: 'CH', to: 'TS' },
		{ from: 'Chh', to: 'Tsh' },
		{ from: 'Ch', to: 'Ts' },
		{ from: 'chh', to: 'tsh' },
		{ from: 'ch', to: 'ts' }
	];

	// 執行替換
	replacementsCh.forEach(rule => {
		const pattern = new RegExp(
			`\\b${rule.from}(${vowelsAndDiacritics})(${consonants})?(${numbers})(?!\\w)`,
			'g'
		);
		text = text.replace(pattern, `${rule.to}$1$2$3`);
	});

    return text
  }
  
  return holoPojToTailo
})()

// 和樂數字調轉字中調   
const holoNumberToTone = (function() {
    return function(t) {     
		t = t.replace(/([aeiourmn]|nn|ng)(1)/gi, '$1')
		t = t.replace(/([aeiourmn]|nn|ng)([ptkh])(4)/gi, '$1$2')

		t=t.replace(/([MNmn])(n)(g|gh)(9)\b/g, '$1n̋$3');
		t=t.replace(/([MNmn])(n)(g|gh)(2)\b/g, '$1ń$3');
		t=t.replace(/([MNmn])(n)(g|gh)(3)\b/g, '$1ǹ$3');
		t=t.replace(/([MNmn])(n)(g|gh)(5)\b/g, '$1n̂$3');
		t=t.replace(/([MNmn])(n)(g|gh)(6)\b/g, '$1ň$3');
		t=t.replace(/([MNmn])(n)(g|gh)(7)\b/g, '$1n̄$3');
		t=t.replace(/([MNmn])(n)(g|gh)(8)\b/g, '$1n̍$3');

		t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'Ő$2');
		t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'Ó$2');
		t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'Ò$2');
		t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'Ô$2');
		t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'Ǒ$2');
		t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'Ō$2');
		t=t.replace(/(O)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'O̍$2');
		t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'ő$2');
		t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'ó$2');
		t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'ò$2');
		t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'ô$2');
		t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'ǒ$2');
		t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'ō$2');
		t=t.replace(/(o)([eiouy]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'o̍$2');
		t=t.replace(/(Yu)((?:n|ng)?)(7)\b/g, 'Ǖ$2');
		t=t.replace(/(Yu)((?:n|ng)?)(2)\b/g, 'Ǘ$2');
		t=t.replace(/(Yu)((?:n|ng)?)(6)\b/g, 'Ǚ$2');
		t=t.replace(/(Yu)((?:n|ng)?)(3)\b/g, 'Ǜ$2');
		t=t.replace(/(yu)((?:n|ng)?)(7)\b/g, 'ǖ$2');
		t=t.replace(/(yu)((?:n|ng)?)(2)\b/g, 'ǘ$2');
		t=t.replace(/(yu)((?:n|ng)?)(6)\b/g, 'ǚ$2');
		t=t.replace(/(yu)((?:n|ng)?)(3)\b/g, 'ǜ$2');
		t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'Ȳ$2');
		t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'Y̌$2');
		t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'Ý$2');
		t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'Ỳ$2');
		t=t.replace(/(Y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'Ŷ$2');
		t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'ȳ$2');
		t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'y̌$2');
		t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'ý$2');
		t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'ỳ$2');
		t=t.replace(/(y)([iu]{0,1}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'ŷ$2');
		t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'A̋$2');
		t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'Á$2');
		t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'À$2');
		t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'Â$2');
		t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'Ǎ$2');
		t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'Ā$2');
		t=t.replace(/(A)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'A̍$2');
		t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'a̋$2');
		t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'á$2');
		t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'à$2');
		t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'â$2');
		t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'ǎ$2');
		t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'ā$2');
		t=t.replace(/(a)([eiou]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'a̍$2');


		t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'E̋$2');
		t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'É$2');
		t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'È$2');
		t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'Ê$2');
		t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'Ě$2');
		t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'Ē$2');
		t=t.replace(/(E)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'E̍$2');
		t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'e̋$2');
		t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'é$2');
		t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'è$2');
		t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'ê$2');
		t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'ě$2');
		t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'ē$2');
		t=t.replace(/(e)([eiur]{0,2}(?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'e̍$2');
		t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'Ű$2');
		t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'Ú$2');
		t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'Ù$2');
		t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'Û$2');
		t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'Ǔ$2');
		t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'Ū$2');
		t=t.replace(/(U)((?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'U̍$2');
		t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(9)\b/g, 'ű$2');
		t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(2)\b/g, 'ú$2');
		t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(3)\b/g, 'ù$2');
		t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(5)\b/g, 'û$2');
		t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(6)\b/g, 'ǔ$2');
		t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(7)\b/g, 'ū$2');
		t=t.replace(/(u)((?:[mngbdptkh]|nnh|ng|nn)?)(8)\b/g, 'u̍$2');
		t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhrr]|nnh|ng|nn)?)(9)\b/g, 'I̋$2');
		t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(2)\b/g, 'Í$2');
		t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(3)\b/g, 'Ì$2');
		t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(5)\b/g, 'Î$2');
		t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(6)\b/g, 'Ǐ$2');
		t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(7)\b/g, 'Ī$2');
		t=t.replace(/(I)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(8)\b/g, 'I̍$2');
		t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(9)\b/g, 'i̋$2');
		t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(2)\b/g, 'í$2');
		t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(3)\b/g, 'ì$2');
		t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(5)\b/g, 'î$2');
		t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(6)\b/g, 'ǐ$2');
		t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(7)\b/g, 'ī$2');
		t=t.replace(/(i)([i]{0,1}(?:[mngbdptkhr]|nnh|ng|nn)?)(8)\b/g, 'i̍$2');
		t=t.replace(/(M)((?:h)?)(9)\b/g, 'M̋$2');
		t=t.replace(/(M)((?:h)?)(2)\b/g, 'Ḿ$2');
		t=t.replace(/(M)((?:h)?)(3)\b/g, 'M̀$2');
		t=t.replace(/(M)((?:h)?)(5)\b/g, 'M̂$2');
		t=t.replace(/(M)((?:h)?)(6)\b/g, 'M̌$2');
		t=t.replace(/(M)((?:h)?)(7)\b/g, 'M̄$2');
		t=t.replace(/(M)((?:h)?)(8)\b/g, 'M̍$2');
		t=t.replace(/(m)((?:h)?)(9)\b/g, 'm̋$2');
		t=t.replace(/(m)((?:h)?)(2)\b/g, 'ḿ$2');
		t=t.replace(/(m)((?:h)?)(3)\b/g, 'm̀$2');
		t=t.replace(/(m)((?:h)?)(5)\b/g, 'm̂$2');
		t=t.replace(/(m)((?:h)?)(6)\b/g, 'm̌$2');
		t=t.replace(/(m)((?:h)?)(7)\b/g, 'm̄$2');
		t=t.replace(/(m)((?:h)?)(8)\b/g, 'm̍$2');

		t=t.replace(/(N)((g|gh)?)(9)\b/g, 'N̋$2');
		t=t.replace(/(N)((g|gh)?)(2)\b/g, 'Ń$2');
		t=t.replace(/(N)((g|gh)?)(3)\b/g, 'Ǹ$2');
		t=t.replace(/(N)((g|gh)?)(5)\b/g, 'N̂$2');
		t=t.replace(/(N)((g|gh)?)(6)\b/g, 'Ň$2');
		t=t.replace(/(N)((g|gh)?)(7)\b/g, 'N̄$2');
		t=t.replace(/(N)((g|gh)?)(8)\b/g, 'N̍$2');

		t=t.replace(/(n)((g|gh)?)(9)\b/g, 'n̋$2');
		t=t.replace(/(n)((g|gh)?)(2)\b/g, 'ń$2');
		t=t.replace(/(n)((g|gh)?)(3)\b/g, 'ǹ$2');
		t=t.replace(/(n)((g|gh)?)(5)\b/g, 'n̂$2');
		t=t.replace(/(n)((g|gh)?)(6)\b/g, 'ň$2');
		t=t.replace(/(n)((g|gh)?)(7)\b/g, 'n̄$2');
		t=t.replace(/(n)((g|gh)?)(8)\b/g, 'n̍$2');

        return t;
    };
})();


// 和樂字母調轉字中調   
const holoZvsToTone = (function() {
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

// 和樂國際音標轉台羅數字
const holoIpaToNumber = (function() {
    const ipaToTailoMap = {
        'iauʔ': 'iauh',
        'uãiʔ': 'uainnh',
        'ãuʔ': 'aunnh',
        'ɔ̃ʔ': 'onnh',
        'iaʔ': 'iah',
        'iãʔ': 'iannh',
        'iɔʔ': 'iooh',
        'iɣʔ': 'iorh',
        'ioʔ': 'ioh',
        'iuʔ': 'iuh',
        'tsʰ': 'tsh',
        'uaʔ': 'uah',
        'ueʔ': 'ueh',
        'uiʔ': 'uih',
        'æʔ': 'ereh',
        'aiʔ': 'aih',
        'auʔ': 'auh',
        'ngʔ': 'ngh',
        'ãi': 'ainn',
        'ãu': 'aunn',
        'aʔ': 'ah',
        'ãʔ': 'annh',
        'ɔ̃': 'onn',
        'ɔk': 'ok',
        'ɔŋ': 'ong',
        'ɔp': 'op',
        'ɔʔ': 'ooh',
        'dz': 'j',
        'eʔ': 'eh',
        'ẽʔ': 'ennh',
        'əʔ': 'erh',
        'ɣʔ': 'orh',
        'iʔ': 'ih',
        'ĩʔ': 'innh',
        'ɨʔ': 'irh',
        'kʰ': 'kh',
        'mʔ': 'mh',
        'oʔ': 'oh',
        'pʰ': 'ph',
        'tʰ': 'th',
        'uʔ': 'uh',
        'ã': 'ann',
        'æ': 'ere',
        'ɔ': 'oo',
        'ʣ': 'j',
        'ẽ': 'enn',
        'ɛ': 'ee',
        'ə': 'er',
        'ɣ': 'or',
        'ĩ': 'inn',
        'ɨ': 'ir',
        'ŋ': 'ng',
        'ʦ': 'ts',
        'ũ': 'unn'
    };

    // 創建按長度排序的鍵值陣列，確保長的音標先被匹配
    const sortedKeys = Object.keys(ipaToTailoMap).sort((a, b) => b.length - a.length);

    return function(ipaText) {
        if (!ipaText || typeof ipaText !== 'string') {
            return '';
        }

        let result = ipaText.toLowerCase();
        
        // 依序替換每個國際音標
        sortedKeys.forEach(ipaSymbol => {
            const tailoSymbol = ipaToTailoMap[ipaSymbol];
            // 使用全域替換
            result = result.replace(new RegExp(escapeRegExp(ipaSymbol), 'gi'), tailoSymbol);
        });

        return result;
    };

    // 輔助函數：轉義正則表達式特殊字符
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
})();

// 和樂台羅轉國際音標
const holoTailoToIpa = (function() {
    const tailoToIPAMap = {
        'uainnh': 'uãiʔ',
        'iannh': 'iãʔ',
        'ereh': 'æʔ',
        'iauh': 'iauʔ',
        'aunnh': 'ãuʔ',
        'onnh': 'ɔ̃ʔ',
        'iooh': 'iɔʔ',
        'iorh': 'iɣʔ',
        'ennh': 'ẽʔ',
        'innh': 'ĩʔ',
        'annh': 'ãʔ',
        'ainn': 'ãi',
        'aunn': 'ãu',
        'tsh': 'tsʰ',
        'iah': 'iaʔ',
        'ioh': 'ioʔ',
        'iuh': 'iuʔ',
        'uah': 'uaʔ',
        'ueh': 'ueʔ',
        'uih': 'uiʔ',
        'aih': 'aiʔ',
        'auh': 'auʔ',
        'ngh': 'ngʔ',
        'ooh': 'ɔʔ',
        'erh': 'əʔ',
        'orh': 'ɣʔ',
        'irh': 'ɨʔ',
        'ann': 'ã',
        'enn': 'ẽ',
        'inn': 'ĩ',
        'unn': 'ũ',
        'onn': 'ɔ̃',
        'ere': 'æ',
        'kh': 'kʰ',
        'ph': 'pʰ',
        'th': 'tʰ',
        'ah': 'aʔ',
        'eh': 'eʔ',
        'ih': 'iʔ',
        'oh': 'oʔ',
        'uh': 'uʔ',
        'mh': 'mʔ',
        'ok': 'ɔk',
        'ong': 'ɔŋ',
        'op': 'ɔp',
        'oo': 'ɔ',
        'ee': 'ɛ',
        'er': 'ə',
        'or': 'ɣ',
        'ir': 'ɨ',
        'ng': 'ŋ',
        'ts': 'ʦ',
        'j': 'ʣ'
    };

    // 創建按長度排序的鍵值陣列，確保長的音標先被匹配
    const sortedKeys = Object.keys(tailoToIPAMap).sort((a, b) => b.length - a.length);

    return function(tailoText) {
        if (!tailoText || typeof tailoText !== 'string') {
            return '';
        }

        let result = tailoText.toLowerCase();
        
        // 依序替換每個台羅拼音
        sortedKeys.forEach(tailoSymbol => {
            const ipaSymbol = tailoToIPAMap[tailoSymbol];
            // 使用全域替換
            result = result.replace(new RegExp(escapeRegExp(tailoSymbol), 'gi'), ipaSymbol);
        });

        return result;
    };

    // 輔助函數：轉義正則表達式特殊字符
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
})();


// Taiwanese Serif 舊字型編碼 轉 Unicode 台羅
const holoTaiwaneseToTailuo = (function() {
    // 定義靜態對應表 (只會初始化一次)
    const charMap = {
        // A 系列
        "Ä": "Ā", "ä": "ā",
        "Ā": "Ā", "ā": "ā",
        "Ã": "A̍", "ã": "a̍",
        "": "a̍", "": "A̍", // Private Use Area
        "À": "À", "à": "à",
        "Â": "Â", "â": "â",
        "Á": "Á", "á": "á",
        
        // E 系列
        "Ë": "Ē", "ë": "ē",
        "Ē": "Ē", "ē": "ē",
        "Ç": "E̍", "ç": "e̍",
        "": "E̍", "": "e̍",
        "È": "È", "è": "è",
        "Ê": "Ê", "ê": "ê",
        "É": "É", "é": "é",
        
        // I 系列
        "‚": "Ī", "„": "ī", // 特殊符號對應
        "Ī": "Ī", "ī": "ī",
        "…": "i̍", "ƒ": "I̍",
        "": "i̍", "": "I̍",
        "Ì": "Ì", "ì": "ì",
        "Î": "Î", "î": "î",
        "Í": "Í", "í": "í",
        
        // M 系列
        "˜": "m̄", "‹": "M̄",
        "": "M̄", "": "m̄", "": "m̄",
        "Œ": "M̍", "™": "m̍",
        "": "M̍", "": "m̍", "": "M̍",
        "–": "m̀", "‰": "M̀",
        "": "M̀", "": "m̀",
        "—": "m̂", "Š": "M̂",
        "": "M̂", "": "m̂",
        "ˆ": "Ḿ", "•": "ḿ",
        "Ḿ": "Ḿ", "ḿ": "ḿ",
        
        // N 系列
        "¤": "n̄", "Ÿ": "N̄",
        "": "N̄", "": "n̄",
        "Ñ": "N̍", "ñ": "n̍",
        "": "N̍", "": "n̍", "": "n̍",
        "›": "Ǹ", "¢": "ǹ",
        "Ǹ": "Ǹ", "ǹ": "ǹ",
        "£": "n̂", "œ": "N̂",
        "": "N̂", "": "n̂",
        "¡": "ń", "Ń": "Ń",
        "ń": "ń", "š": "Ń",
        
        // O 系列
        "Ö": "Ō", "ö": "ō",
        "Ō": "Ō", "ō": "ō",
        "Õ": "O̍", "õ": "o̍",
        "": "O̍", "": "o̍", "": "O̍", "": "o̍",
        "Ò": "Ò", "ò": "ò",
        "Ô": "Ô", "ô": "ô",
        "Ó": "Ó", "ó": "ó",
        
        // U 系列
        "Ü": "Ū", "ü": "ū",
        "Ū": "Ū", "ū": "ū",
        "Ý": "U̍", "ý": "u̍",
        "": "U̍", "": "u̍",
        "Ù": "Ù", "ù": "ù",
        "Û": "Û", "û": "û",
        "Ú": "Ú", "ú": "ú"
    };

    // 返回實際執行的轉換函數
    return function(text) {
        if (!text) return "";
        
        let result = "";
        // 遍歷字串中的每個字元
        for (const char of text) {
            // 如果在表中找到對應字元則替換，否則保持原樣
            const mapped = charMap[char];
            result += (mapped !== undefined) ? mapped : char;
        }
        return result;
    };
})();



function convertToFullMark(t) {
  // 標點符號轉換對照（含可能的後續空格）
  t = t.replace(/!( )?/g, "！");
  t = t.replace(/\(( )?/g, "（");
  t = t.replace(/\)( )?/g, "）");
  t = t.replace(/,( )?/g, "，");
  t = t.replace(/\.( )?/g, "。");
  t = t.replace(/:( )?/g, "：");
  t = t.replace(/;( )?/g, "；");
  t = t.replace(/\?( )?/g, "？");
  t = t.replace(/~( )?/g, "～");
  t = t.replace(/"( )?/g, "「");
  t = t.replace(/"( )?/g, "」");
  t = t.replace(/'( )?/g, "『");
  t = t.replace(/'( )?/g, "』");

  t = t.replace(/“( )?/g, "「");
  t = t.replace(/”( )?/g, "」");
  t = t.replace(/‘( )?/g, "『");
  t = t.replace(/’( )?/g, "』");

  return t;
}






























// 馬祖拼音轉注音
const matsuPinyinToBpm = (function() {
    const consonantData = `tsh	ㄘ_ph	ㄆ_th	ㄊ_kh	ㄎ_ts	ㄗ_p	ㄅ_m	ㄇ_t	ㄉ_n	ㄋ_l	ㄌ_k	ㄍ_h	ㄏ_j	ㄖ_s	ㄙ_b	勺`;
    const vowelData = `oeyng	廿ㄩㄥ_aing	ㄞㄥ_aung	ㄠㄥ_eing	ㄟㄥ_iang	ㄧㄤ_ieng	ㄧㄝㄥ_oeyh	廿ㄩㄏ_oeyk	廿ㄩㄍ_oeym	廿ㄩㄇ_oeyn	廿ㄩㄣ_oeyp	廿ㄩㄅ_oeyt	廿ㄩㄉ_oung	ㄡㄥ_oyng	ㄛㄩㄥ_uang	ㄨㄤ_uong	ㄨㄛㄥ_yong	ㄩㄛㄥ_aih	ㄞㄏ_aik	ㄞㄍ_aim	ㄞㄇ_ain	ㄞㄣ_aip	ㄞㄅ_ait	ㄞㄉ_ang	ㄤ_auh	ㄠㄏ_auk	ㄠㄍ_aum	ㄠㄇ_aun	ㄠㄣ_aup	ㄠㄅ_aut	ㄠㄉ_eih	ㄟㄏ_eik	ㄟㄍ_eim	ㄟㄇ_ein	ㄟㄣ_eip	ㄟㄅ_eit	ㄟㄉ_iah	ㄧㄚㄏ_iak	ㄧㄚㄍ_iam	ㄧㄚㄇ_ian	ㄧㄢ_iap	ㄧㄚㄅ_iat	ㄧㄚㄉ_iau	ㄧㄠ_ieh	ㄧㄝㄏ_iek	ㄧㄝㄍ_iem	ㄧㄝㄇ_ien	ㄧㄝㄣ_iep	ㄧㄝㄅ_iet	ㄧㄝㄉ_ieu	ㄧㄝㄨ_ing	ㄧㄥ_oeh	廿ㄏ_oek	廿ㄍ_oep	廿ㄅ_oet	廿ㄉ_oey	廿ㄩ_ong	ㄛㄥ_ouh	ㄡㄏ_ouk	ㄡㄍ_oum	ㄡㄇ_oun	ㄡㄣ_oup	ㄡㄅ_out	ㄡㄉ_oyh	ㄛㄩㄏ_oyk	ㄛㄩㄍ_oym	ㄛㄩㄇ_oyn	ㄛㄩㄣ_oyp	ㄛㄩㄅ_oyt	ㄛㄩㄉ_uah	ㄨㄚㄏ_uai	ㄨㄞ_uak	ㄨㄚㄍ_uam	ㄨㄚㄇ_uan	ㄨㄢ_uap	ㄨㄚㄅ_uat	ㄨㄚㄉ_ung	ㄨㄥ_uoh	ㄨㄛㄏ_uok	ㄨㄛㄍ_uom	ㄨㄛㄇ_uon	ㄨㄛㄣ_uop	ㄨㄛㄅ_uot	ㄨㄛㄉ_yng	ㄩㄥ_yoh	ㄩㄛㄏ_yok	ㄩㄛㄍ_yom	ㄩㄛㄇ_yon	ㄩㄛㄣ_yop	ㄩㄛㄅ_yot	ㄩㄛㄉ_ah	ㄚㄏ_ai	ㄞ_ak	ㄚㄍ_am	ㄚㄇ_an	ㄢ_ap	ㄚㄅ_at	ㄚㄉ_au	ㄠ_eh	ㄝㄏ_ei	ㄟ_ek	ㄝㄍ_ep	ㄝㄅ_et	ㄝㄉ_ia	ㄧㄚ_ie	ㄧㄝ_ih	ㄧㄏ_ik	ㄧㄍ_im	ㄧㄇ_in	ㄧㄣ_ip	ㄧㄅ_it	ㄧㄉ_iu	ㄧㄨ_oe	廿_oh	ㄛㄏ_ok	ㄛㄍ_om	ㄛㄇ_on	ㄛㄣ_op	ㄛㄅ_ot	ㄛㄉ_ou	ㄡ_oy	ㄛㄩ_ua	ㄨㄚ_uh	ㄨㄏ_ui	ㄨㄧ_uk	ㄨㄍ_um	ㄨㄇ_un	ㄨㄣ_uo	ㄨㄛ_up	ㄨㄅ_ut	ㄨㄉ_yh	ㄩㄏ_yk	ㄩㄍ_ym	ㄩㄇ_yn	ㄩㄣ_yo	ㄩㄛ_yp	ㄩㄅ_yt	ㄩㄉ_ng	兀_a	ㄚ_e	ㄝ_i	ㄧ_o	ㄛ_u	ㄨ_y	ㄩ_`;

    // 聲調對應表
    const toneData = `f	⁺_v	ˇ_z	ˊ_s	ˋ_x	ˆ`;

    // 解析資料成 Map
    function parseData(dataString) {
        const map = new Map();
        dataString.trim().split('_').forEach(line => {
            if (line.trim()) {
                const [key, value] = line.split('\t');
                if (key) {
                    map.set(key.trim(), value ? value.trim() : '');
                }
            }
        });
        return map;
    }

    const consonantMap = parseData(consonantData);
    const vowelMap = parseData(vowelData);
    const toneMap = parseData(toneData);


    // 預編譯正則表達式以提高效率
    const vowelKeys = Array.from(vowelMap.keys()).sort((a, b) => b.length - a.length);
    const consonantKeys = Array.from(consonantMap.keys()).sort((a, b) => b.length - a.length);
    
    // 韻母匹配正則（按長度從長到短）
    const vowelRegex = new RegExp(`\\b(tsh|ph|th|kh|ts|ng|[pmtnlkhjsb])?(${vowelKeys.join('|')})([fvzsx1234578]?)\\b`, 'gi');
    
    // 聲母匹配正則
    const consonantRegex = new RegExp(`\\b(${consonantKeys.join('|')})(?=[廿ㄞㄠㄟㄧㄡㄛㄨㄩㄤㄚㄢㄝ兀])`, 'gi');

    return function(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        let result = text;

        // 第一步：轉換韻母和聲調
        result = result.replace(vowelRegex, (match, consonant, vowel, tone) => {
            const zhuyin_vowel = vowelMap.get(vowel.toLowerCase()) || vowel;
            const zhuyin_tone = tone ? toneMap.get(tone) : '';

		// 保留聲母部分，稍後處理
            const consonantPart = consonant ? consonant : '';
            return consonantPart + zhuyin_vowel + zhuyin_tone;
        });

        // 第二步：轉換聲母
        result = result.replace(consonantRegex, (match, consonant) => {
            return consonantMap.get(consonant.toLowerCase()) || consonant;
        });

        return result;
    };
})();

// 馬祖注音轉拼音
const matsuBpmToPinyin = (function() {
	const bpmData =`ㄘ	tsh_ㄑ	tsh_ㄆ	ph_ㄊ	th_ㄎ	kh_ㄗ	ts_ㄐ	ts_ㄅ	p_ㄇ	m_ㄉ	t_ㄋ	n_ㄌ	l_ㄍ	k_ㄏ	h_ㄖ	j_ㄙ	s_ㄒ	s_勺	b_廿	oe_ㄞ	ai_ㄠ	au_ㄟ	ei_ㄧ	i_ㄡ	ou_ㄛ	o_ㄨ	u_ㄩ	y_ㄤ	ang_ㄚ	a_ㄢ	an_ㄝ	e_兀	ng_ㄥ	ng_`;

    
    // 解析資料成 Map
    function parseData(dataString) {
        const map = new Map();
        dataString.trim().split('_').forEach(line => {
            if (line.trim()) {
                const [key, value] = line.split('\t');
                if (key !== undefined) {
                    map.set(key ? key.trim() : '', value ? value.trim() : '');
                }
            }
        });
        return map;
    }
    
    const bpmMap = parseData(bpmData);
    
    // 預編譯正則表達式以提高效率
    const bpmKeys = Array.from(bpmMap.keys()).sort((a, b) => b.length - a.length);
    
    // 注音轉拼音正則
    const zhuyinRegex = new RegExp(`(${bpmKeys.join('|')})`, 'g');
    
    return function(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        // 轉換注音為拼音
        return text.replace(zhuyinRegex, (match, bpm) => {
            return bpmMap.get(bpm) || bpm;
        });
    };
})();

// 馬祖字母調轉尾調形
const matsuZvsToTone = (function() {
    const toneMap = { f: '⁺', v: 'ˇ', z: 'ˊ', s: 'ˋ', x: 'ˆ' };
    
    // 基本模式
    const basePattern = `\\b(tsh|ph|th|kh|ts|ng|[pmtnlkhjsb])?([aeiouy]{1,3})`;    
    // 鼻音結尾正則
    const nasalRegex = new RegExp(`${basePattern}(ng|[mn]?)([fvzsx]?)\\b`, 'gi');    
    // 塞音結尾正則
    const stopRegex = new RegExp(`${basePattern}([ptkh])([fvzsx]?)\\b`, 'gi');
    
    return function(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        let result = text;
        
        // 處理鼻音結尾
        result = result.replace(nasalRegex, (match, initial, vowel, nasal, tone) => {
            const base = `${initial || ''}${vowel}${nasal}`;
            return base + (toneMap[tone] || '');
        });
        
        // 處理塞音結尾
        result = result.replace(stopRegex, (match, initial, vowel, stop, tone) => {
            const base = `${initial || ''}${vowel}${stop}`;
            return base + (toneMap[tone] || '');
        });
        
        return result;
    };
})();

// 馬祖字母調轉數字調
const matsuZvsToNumber = (function() {

    const toneMap = { f: '2', v: '3', z: '4', s: '5', x: '7' };
    
    // 基本模式
    const basePattern = `\\b(tsh|ph|th|kh|ts|ng|[pmtnlkhjsb])?([aeiouy]{1,3})`;    
    // 鼻音結尾正則
    const nasalRegex = new RegExp(`${basePattern}(ng|[mn]?)([fvzsx]?)\\b`, 'gi');    
    // 塞音結尾正則
    const stopRegex = new RegExp(`${basePattern}([ptkh])([fvzsx]?)\\b`, 'gi');
    
    return function(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        let result = text;
        
        // 處理鼻音結尾
        result = result.replace(nasalRegex, (match, initial, vowel, nasal, tone) => {
            const base = `${initial || ''}${vowel}${nasal}`;
            return base + (toneMap[tone] || '1');
        });
        
        // 處理塞音結尾
        result = result.replace(stopRegex, (match, initial, vowel, stop, tone) => {
            const base = `${initial || ''}${vowel}${stop}`;
            return base + (toneMap[tone] || '8');
        });
        
        return result;
    };
})();


// 馬祖數字調轉字母調
const matsuNumberToZvs = (function() {

    const numberToToneMap = { '2': 'f', '3': 'v', '4': 'z', '5': 's', '7': 'x' };
    // 1 和 8 會被刪除 (對應到空字串)
    
    // 基本模式
    const basePattern = `\\b(tsh|ph|th|kh|ts|ng|[pmtnlkhjsb])?([aeiouy]{1,3})`;
    
    // 鼻音結尾 + 數字
    const nasalRegex = new RegExp(`${basePattern}(ng|[mn]?)([1234578])\\b`, 'gi');
    
    // 塞音結尾 + 數字
    const stopRegex = new RegExp(`${basePattern}([ptkh])([1234578])\\b`, 'gi');
    
    return function(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        let result = text;
        
        // 處理鼻音結尾
        result = result.replace(nasalRegex, (match, initial, vowel, nasal, number) => {
            const base = `${initial || ''}${vowel}${nasal}`;
            const tone = numberToToneMap[number] || ''; // 1和8會變成空字串(被刪除)
            return base + tone;
        });
        
        // 處理塞音結尾
        result = result.replace(stopRegex, (match, initial, vowel, stop, number) => {
            const base = `${initial || ''}${vowel}${stop}`;
            const tone = numberToToneMap[number] || ''; // 1和8會變成空字串(被刪除)
            return base + tone;
        });
        
        return result;
    };
})();

// 馬祖數字調轉尾調形
const matsuNumberToTone = (function() {

    const numberToToneMap = { '2': '⁺', '3': 'ˇ', '4': 'ˊ', '5': 'ˋ', '7': 'ˆ' };
    // 1 和 8 會被刪除 (對應到空字串)
    
    // 基本模式
    const basePattern = `\\b(tsh|ph|th|kh|ts|ng|[pmtnlkhjsb])?([aeiouy]{1,3})`;
    
    // 鼻音結尾 + 數字
    const nasalRegex = new RegExp(`${basePattern}(ng|[mn]?)([1234578])\\b`, 'gi');
    
    // 塞音結尾 + 數字
    const stopRegex = new RegExp(`${basePattern}([ptkh])([1234578])\\b`, 'gi');
    
    return function(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        let result = text;
        
        // 處理鼻音結尾
        result = result.replace(nasalRegex, (match, initial, vowel, nasal, number) => {
            const base = `${initial || ''}${vowel}${nasal}`;
            const tone = numberToToneMap[number] || ''; // 1和8會變成空字串(被刪除)
            return base + tone;
        });
        
        // 處理塞音結尾
        result = result.replace(stopRegex, (match, initial, vowel, stop, number) => {
            const base = `${initial || ''}${vowel}${stop}`;
            const tone = numberToToneMap[number] || ''; // 1和8會變成空字串(被刪除)
            return base + tone;
        });
        
        return result;
    };
})();


// 馬祖尾調形轉字母調
const matsuToneToZvs = (function() {
    // 尾調形到字母調的對應關係
    const toneMap = { 
        '⁺': 'f', 
        'ˇ': 'v', 
        'ˊ': 'z', 
        'ˋ': 's', 
        'ˆ': 'x',
        '+': 'f',
        '^': 'x'
    };
    
    // 完整模式：字元邊界 + 聲母 + 韻母 + 韻尾 + 尾調形（後面不能接字母）
    const completeRegex = new RegExp(`\\b(tsh|ph|th|kh|ts|ng|[pmtnlkhjsb])?([aeiouy]{1,3})(ng|[mnptkh])?([⁺ˇˊˋˆ+^])(?![a-zA-Z])`, 'gi');
    
    return function(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        let result = text;
        
        // 處理完整音節結構
        result = result.replace(completeRegex, (match, initial, vowel, final, tone) => {
            const base = `${initial || ''}${vowel}${final || ''}`;
            return base + (toneMap[tone] || '');
        });
        
        return result;
    };
})();

// 馬祖尾調形轉數字調
const matsuToneToNumber = (function() {
    const toneMap = { 
        '⁺': '2', 
        'ˇ': '3', 
        'ˊ': '4', 
        'ˋ': '5', 
        'ˆ': '7',
        '+': '2',
        '^': '7'
    };
    
    // 基本模式
    const basePattern = `\\b(tsh|ph|th|kh|ts|ng|[pmtnlkhjsb])?([aeiouy]{1,3})`;
    // 有調號的音節（調號必須在音節最後）
    const withToneRegex = new RegExp(`${basePattern}(ng|[mnptkh])?([⁺ˇˊˋˆ+^])(?![a-zA-Z])`, 'gi');
    // 無調號但有韻尾的音節（加 8 調）- 確保後面沒有數字
    const noToneWithFinalRegex = new RegExp(`(?<![⁺ˇˊˋˆ+^*-])${basePattern}([ptkh])(?![a-zA-Z⁺ˇˊˋˆ+^0-9])`, 'gi');
    // 無調號也無韻尾的音節（加 1 調）- 確保後面沒有數字
    const noToneNoFinalRegex = new RegExp(`(?<![⁺ˇˊˋˆ+^*-])${basePattern}(?![a-zA-Z⁺ˇˊˋˆ+^0-9])`, 'gi');
    
    return function(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        let result = text;
        
        // 先處理有調號的音節（最高優先級）
        result = result.replace(withToneRegex, (match, initial, vowel, final, tone) => {
            const base = `${initial || ''}${vowel}${final || ''}`;
            return base + toneMap[tone];
        });
        
        // 再處理無調號但有韻尾的音節（加 8 調）
        result = result.replace(noToneWithFinalRegex, (match, initial, vowel, final) => {
            const base = `${initial || ''}${vowel}${final}`;
            return base + '8';
        });
        
        // 最後處理無調號也無韻尾的音節（加 1 調）
        result = result.replace(noToneNoFinalRegex, (match, initial, vowel) => {
            const base = `${initial || ''}${vowel}`;
            return base + '1';
        });
        
        return result;
    };
})();


// 馬祖調號中平低降轉正確符號
const mstsuToneToFX = (text) => {
   const toneMap = {'+':'⁺', '^':'ˆ'};
   
   return text?.replace(/(?<!\w)(?:tsh|ph|th|kh|ts|ng|[pmtnlkhjsb])?[aeiouy]{1,3}(?:ng|[mnptkh])?([ˆ+^])(?!\w)/gi, 
       (match, tone) => {
           const toneSymbol = toneMap[tone];
           return match.replace(new RegExp(tone.replace(/[+^]/g, '\\$&') + '$'), toneSymbol);
       }) || '';
};



















// ==F馬祖福州話詞彙變調=========================================
	function matsuOriginalToChange(t) {  

	//變韻(順序不能動)
    t=t.replace(/(a)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'e$2$3$4$5');
    t=t.replace(/(ei)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'i$2$3$4$5');
    t=t.replace(/(oey)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'y$2$3$4$5');
    t=t.replace(/(ai)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'ei$2$3$4$5');
    t=t.replace(/(iau)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'ieu$2$3$4$5');
    t=t.replace(/(ou)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'u$2$3$4$5');
    t=t.replace(/(au)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'ou$2$3$4$5');
    t=t.replace(/(o)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'oe$2$3$4$5');
    t=t.replace(/(oy)(ng|h|k{0,1})([vxz])(--|-| )([a-z])/gi,'oey$2$3$4$5');


	//變調
    t=t.replace(/([aeiouymg])([vx]{0,1})(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'$1⁺$3$4$5$6$7');
    t=t.replace(/(h)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'⁺$2$3$4$5$6');
    t=t.replace(/([aeiouymg])([vx]{0,1})(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([fvzx]{0,1})(\b)/gi,'$1ˋ$3$4$5$6$7');
    t=t.replace(/(h)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([fvzx]{0,1})(\b)/gi,'ˋ$2$3$4$5$6');

    t=t.replace(/([aeiouymg])(f)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'$1ˇ$3$4$5$6$7');
    t=t.replace(/(h)(z)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'ˇ$3$4$5$6$7');
    t=t.replace(/([aeiouymg])(f)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([vzx])(\b)/gi,'$1$3$4$5$6$7');
    t=t.replace(/(h)(z)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([vzx])(\b)/gi,'$3$4$5$6$7');
    t=t.replace(/([aeiouymg])(f)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([f])(\b)/gi,'$1ˊ$3$4$5$6$7');
    t=t.replace(/(h)(z)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([f])(\b)/gi,'ˊ$3$4$5$6$7');

    t=t.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})(\b)/gi,'$1⁺$3$4$5$6$7');
    t=t.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})([fvzsx])(\b)/gi,'$1ˇ$3$4$5$6$7');
    t=t.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})([hk])(\b)/gi,'$1ˇ$3$4$5$6$7');


    t=t.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})()(\b)/gi,'$1⁺$3$4$5$6$7');
    t=t.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})(s)(\b)/gi,'$1ˇ$3$4$5$6$7');
    t=t.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([hk])()(\b)/gi,'$1ˇ$3$4$5$6$7');
    t=t.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})(f)(\b)/gi,'$1⁺$3$4$5$6$7');
    t=t.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([vxz])(\b)/gi,'$1ˇ$3$4$5$6$7');


	//變聲
	t=t.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ph|p)/gi,'$1$2$3b');
	t=t.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(tsh|ts)/gi,'$1$2$3j');
	t=t.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(th|t|s)/gi,'$1$2$3l');
	t=t.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(n)([aeiouy])/gi,'$1$2$3l$5');
	t=t.replace(/([aeiouy])([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(kh|k|h)/gi,'$1$2$3');


	t=t.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(ph|p)/gi,'$1$2$3m');
	t=t.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(tsh|ts)/gi,'$1$2$3j');
	t=t.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(th|t|s|l)/gi,'$1$2$3n');
	t=t.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )(kh|k|h)/gi,'$1$2$3ng');
	t=t.replace(/(ng)([ˊˇˋˆ⁺ˉ]{0,1})(--|-| )([aeiouy])/gi,'$1$2$3ng$4');

	
	t=t.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(ph|p)/gi,'$1$2$3b');
	t=t.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(tsh|ts)/gi,'$1$2$3j');
	t=t.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(th|t|s)/gi,'$1$2$3l');
	t=t.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(n)([aeiouy])/gi,'$1$2$3l$5');
	t=t.replace(/([aeiouy])([zvsxfc]{0,1})(--|-| )(kh|k|h)/gi,'$1$2$3');


	t=t.replace(/(ng)([zvsxfc]{0,1})(--|-| )(ph|p)/gi,'$1$2$3m');
	t=t.replace(/(ng)([zvsxfc]{0,1})(--|-| )(tsh|ts)/gi,'$1$2$3j');
	t=t.replace(/(ng)([zvsxfc]{0,1})(--|-| )(th|t|s|l)/gi,'$1$2$3n');
	t=t.replace(/(ng)([zvsxfc]{0,1})(--|-| )(kh|k|h)/gi,'$1$2$3ng');

	return t;
}
// ===========================================================;








function zvsToLetter(t) {
	t = t.replace(/(Er|er)(e)(zz)(?!\w)/g, '$1e̋');
	t = t.replace(/(Er|er)(e)(z)(?!\w)/g, '$1é');
	t = t.replace(/(Er|er)(e)(s)(?!\w)/g, '$1è');
	t = t.replace(/(Er|er)(e)(x)(?!\w)/g, '$1ê');
	t = t.replace(/(Er|er)(e)(v)(?!\w)/g, '$1ě');
	t = t.replace(/(Er|er)(e)(f)(?!\w)/g, '$1ē');
	t = t.replace(/(E)(re)([ptkh])(l)(?!\w)/g, 'E̍$2$3');
	t = t.replace(/(e)(re)([ptkh])(l)(?!\w)/g, 'e̍$2$3');

	t = t.replace(/(A)([eioumngr]{0,4})([ptkhbdg]{0,1})(zz)(?!\w)/g, 'A̋$2$3');
	t = t.replace(/(A)([eioumngr]{0,4})([ptkhbdg]{0,1})(z)(?!\w)/g, 'Á$2$3');
	t = t.replace(/(A)([eioumngr]{0,4})([ptkhbdg]{0,1})(s)(?!\w)/g, 'À$2$3');
	t = t.replace(/(A)([eioumngr]{0,4})([ptkhbdg]{0,1})(x)(?!\w)/g, 'Â$2$3');
	t = t.replace(/(A)([eioumngr]{0,4})([ptkhbdg]{0,1})(v)(?!\w)/g, 'Ǎ$2$3');
	t = t.replace(/(A)([eioumngr]{0,4})([ptkhbdg]{0,1})(f)(?!\w)/g, 'Ā$2$3');
	t = t.replace(/(A)([eioumngr]{0,4})([ptkhbdg]{0,1})(l)(?!\w)/g, 'A̍$2$3');
	t = t.replace(/(a)([eioumngr]{0,4})([ptkhbdg]{0,1})(zz)(?!\w)/g, 'a̋$2$3');
	t = t.replace(/(a)([eioumngr]{0,4})([ptkhbdg]{0,1})(z)(?!\w)/g, 'á$2$3');
	t = t.replace(/(a)([eioumngr]{0,4})([ptkhbdg]{0,1})(s)(?!\w)/g, 'à$2$3');
	t = t.replace(/(a)([eioumngr]{0,4})([ptkhbdg]{0,1})(x)(?!\w)/g, 'â$2$3');
	t = t.replace(/(a)([eioumngr]{0,4})([ptkhbdg]{0,1})(v)(?!\w)/g, 'ǎ$2$3');
	t = t.replace(/(a)([eioumngr]{0,4})([ptkhbdg]{0,1})(f)(?!\w)/g, 'ā$2$3');
	t = t.replace(/(a)([eioumngr]{0,4})([ptkhbdg]{0,1})(l)(?!\w)/g, 'a̍$2$3');

	t = t.replace(/(O)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(zz)(?!\w)/g, '$1e̋$3$4');
	t = t.replace(/(O)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(z)(?!\w)/g, '$1é$3$4');
	t = t.replace(/(O)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(s)(?!\w)/g, '$1è$3$4');
	t = t.replace(/(O)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(x)(?!\w)/g, '$1ê$3$4');
	t = t.replace(/(O)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(v)(?!\w)/g, '$1ě$3$4');
	t = t.replace(/(O)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(f)(?!\w)/g, '$1ē$3$4');
	t = t.replace(/(O)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(l)(?!\w)/g, '$1e̍$3$4');
	t = t.replace(/(o)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(zz)(?!\w)/g, '$1e̋$3$4');
	t = t.replace(/(o)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(z)(?!\w)/g, '$1é$3$4');
	t = t.replace(/(o)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(s)(?!\w)/g, '$1è$3$4');
	t = t.replace(/(o)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(x)(?!\w)/g, '$1ê$3$4');
	t = t.replace(/(o)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(v)(?!\w)/g, '$1ě$3$4');
	t = t.replace(/(o)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(f)(?!\w)/g, '$1ē$3$4');
	t = t.replace(/(o)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(l)(?!\w)/g, '$1e̍$3$4');

	t = t.replace(/(O)([eioumngry]{0,4})([ptkhbdg]{0,1})(zz)(?!\w)/g, 'Ő$2$3');
	t = t.replace(/(O)([eioumngry]{0,4})([ptkhbdg]{0,1})(z)(?!\w)/g, 'Ó$2$3');
	t = t.replace(/(O)([eioumngry]{0,4})([ptkhbdg]{0,1})(s)(?!\w)/g, 'Ò$2$3');
	t = t.replace(/(O)([eioumngry]{0,4})([ptkhbdg]{0,1})(x)(?!\w)/g, 'Ô$2$3');
	t = t.replace(/(O)([eioumngry]{0,4})([ptkhbdg]{0,1})(v)(?!\w)/g, 'Ǒ$2$3');
	t = t.replace(/(O)([eioumngry]{0,4})([ptkhbdg]{0,1})(f)(?!\w)/g, 'Ō$2$3');
	t = t.replace(/(O)([eioumngry]{0,4})([ptkhbdg]{0,1})(l)(?!\w)/g, 'O̍$2$3');
	t = t.replace(/(o)([eioumngry]{0,4})([ptkhbdg]{0,1})(zz)(?!\w)/g, 'ő$2$3');
	t = t.replace(/(o)([eioumngry]{0,4})([ptkhbdg]{0,1})(z)(?!\w)/g, 'ó$2$3');
	t = t.replace(/(o)([eioumngry]{0,4})([ptkhbdg]{0,1})(s)(?!\w)/g, 'ò$2$3');
	t = t.replace(/(o)([eioumngry]{0,4})([ptkhbdg]{0,1})(x)(?!\w)/g, 'ô$2$3');
	t = t.replace(/(o)([eioumngry]{0,4})([ptkhbdg]{0,1})(v)(?!\w)/g, 'ǒ$2$3');
	t = t.replace(/(o)([eioumngry]{0,4})([ptkhbdg]{0,1})(f)(?!\w)/g, 'ō$2$3');
	t = t.replace(/(o)([eioumngry]{0,4})([ptkhbdg]{0,1})(l)(?!\w)/g, 'o̍$2$3');

	t = t.replace(/(E)(eu)(zz)(?!\w)/g, 'E̋$2');
	t = t.replace(/(E)(eu)(z)(?!\w)/g, 'É$2');
	t = t.replace(/(E)(eu)(s)(?!\w)/g, 'È$2');
	t = t.replace(/(E)(eu)(x)(?!\w)/g, 'Ê$2');
	t = t.replace(/(E)(eu)(v)(?!\w)/g, 'Ě$2');
	t = t.replace(/(E)(eu)(f)(?!\w)/g, 'Ē$2');
	t = t.replace(/(E)(eu)(l)(?!\w)/g, 'E̍$2');
	t = t.replace(/(e)(eu)(zz)(?!\w)/g, 'e̋$2');
	t = t.replace(/(e)(eu)(z)(?!\w)/g, 'é$2');
	t = t.replace(/(e)(eu)(s)(?!\w)/g, 'è$2');
	t = t.replace(/(e)(eu)(x)(?!\w)/g, 'ê$2');
	t = t.replace(/(e)(eu)(v)(?!\w)/g, 'ě$2');
	t = t.replace(/(e)(eu)(f)(?!\w)/g, 'ē$2');
	t = t.replace(/(e)(eu)(l)(?!\w)/g, 'e̍$2');

	t = t.replace(/(E)([iumngr]{0,4})([ptkhbdg]{0,1})(zz)(?!\w)/g, 'E̋$2$3');
	t = t.replace(/(E)([iumngr]{0,4})([ptkhbdg]{0,1})(z)(?!\w)/g, 'É$2$3');
	t = t.replace(/(E)([iumngr]{0,4})([ptkhbdg]{0,1})(s)(?!\w)/g, 'È$2$3');
	t = t.replace(/(E)([iumngr]{0,4})([ptkhbdg]{0,1})(x)(?!\w)/g, 'Ê$2$3');
	t = t.replace(/(E)([iumngr]{0,4})([ptkhbdg]{0,1})(v)(?!\w)/g, 'Ě$2$3');
	t = t.replace(/(E)([iumngr]{0,4})([ptkhbdg]{0,1})(f)(?!\w)/g, 'Ē$2$3');
	t = t.replace(/(E)([iumngr]{0,4})([ptkhbdg]{0,1})(l)(?!\w)/g, 'E̍$2$3');
	t = t.replace(/(e)([iumngr]{0,4})([ptkhbdg]{0,1})(zz)(?!\w)/g, 'e̋$2$3');
	t = t.replace(/(e)([iumngr]{0,4})([ptkhbdg]{0,1})(z)(?!\w)/g, 'é$2$3');
	t = t.replace(/(e)([iumngr]{0,4})([ptkhbdg]{0,1})(s)(?!\w)/g, 'è$2$3');
	t = t.replace(/(e)([iumngr]{0,4})([ptkhbdg]{0,1})(x)(?!\w)/g, 'ê$2$3');
	t = t.replace(/(e)([iumngr]{0,4})([ptkhbdg]{0,1})(v)(?!\w)/g, 'ě$2$3');
	t = t.replace(/(e)([iumngr]{0,4})([ptkhbdg]{0,1})(f)(?!\w)/g, 'ē$2$3');
	t = t.replace(/(e)([iumngr]{0,4})([ptkhbdg]{0,1})(l)(?!\w)/g, 'e̍$2$3');

	t = t.replace(/(U)([mngr]{0,4})([ptkhbdg]{0,1})(zz)(?!\w)/g, 'Ű$2$3');
	t = t.replace(/(U)([mngr]{0,4})([ptkhbdg]{0,1})(z)(?!\w)/g, 'Ú$2$3');
	t = t.replace(/(U)([mngr]{0,4})([ptkhbdg]{0,1})(s)(?!\w)/g, 'Ù$2$3');
	t = t.replace(/(U)([mngr]{0,4})([ptkhbdg]{0,1})(x)(?!\w)/g, 'Û$2$3');
	t = t.replace(/(U)([mngr]{0,4})([ptkhbdg]{0,1})(v)(?!\w)/g, 'Ǔ$2$3');
	t = t.replace(/(U)([mngr]{0,4})([ptkhbdg]{0,1})(f)(?!\w)/g, 'Ū$2$3');
	t = t.replace(/(U)([mngr]{0,4})([ptkhbdg]{0,1})(l)(?!\w)/g, 'U̍$2$3');
	t = t.replace(/(u)([mngr]{0,4})([ptkhbdg]{0,1})(zz)(?!\w)/g, 'ű$2$3');
	t = t.replace(/(u)([mngr]{0,4})([ptkhbdg]{0,1})(z)(?!\w)/g, 'ú$2$3');
	t = t.replace(/(u)([mngr]{0,4})([ptkhbdg]{0,1})(s)(?!\w)/g, 'ù$2$3');
	t = t.replace(/(u)([mngr]{0,4})([ptkhbdg]{0,1})(x)(?!\w)/g, 'û$2$3');
	t = t.replace(/(u)([mngr]{0,4})([ptkhbdg]{0,1})(v)(?!\w)/g, 'ǔ$2$3');
	t = t.replace(/(u)([mngr]{0,4})([ptkhbdg]{0,1})(f)(?!\w)/g, 'ū$2$3');
	t = t.replace(/(u)([mngr]{0,4})([ptkhbdg]{0,1})(l)(?!\w)/g, 'u̍$2$3');

	t = t.replace(/(I)([mngr]{0,4})([ptkhbdg]{0,1})(zz)(?!\w)/g, 'I̋$2$3');
	t = t.replace(/(I)([mngr]{0,4})([ptkhbdg]{0,1})(z)(?!\w)/g, 'Í$2$3');
	t = t.replace(/(I)([mngr]{0,4})([ptkhbdg]{0,1})(s)(?!\w)/g, 'Ì$2$3');
	t = t.replace(/(I)([mngr]{0,4})([ptkhbdg]{0,1})(x)(?!\w)/g, 'Î$2$3');
	t = t.replace(/(I)([mngr]{0,4})([ptkhbdg]{0,1})(v)(?!\w)/g, 'Ǐ$2$3');
	t = t.replace(/(I)([mngr]{0,4})([ptkhbdg]{0,1})(f)(?!\w)/g, 'Ī$2$3');
	t = t.replace(/(I)([mngr]{0,4})([ptkhbdg]{0,1})(l)(?!\w)/g, 'I̍$2$3');
	t = t.replace(/(i)([mngr]{0,4})([ptkhbdg]{0,1})(zz)(?!\w)/g, 'i̋$2$3');
	t = t.replace(/(i)([mngr]{0,4})([ptkhbdg]{0,1})(z)(?!\w)/g, 'í$2$3');
	t = t.replace(/(i)([mngr]{0,4})([ptkhbdg]{0,1})(s)(?!\w)/g, 'ì$2$3');
	t = t.replace(/(i)([mngr]{0,4})([ptkhbdg]{0,1})(x)(?!\w)/g, 'î$2$3');
	t = t.replace(/(i)([mngr]{0,4})([ptkhbdg]{0,1})(v)(?!\w)/g, 'ǐ$2$3');
	t = t.replace(/(i)([mngr]{0,4})([ptkhbdg]{0,1})(f)(?!\w)/g, 'ī$2$3');
	t = t.replace(/(i)([mngr]{0,4})([ptkhbdg]{0,1})(l)(?!\w)/g, 'i̍$2$3');

	t = t.replace(/(Y)(ng{0,1}|[mnptkhbdg]{0,1})(zz)(?!\w)/g, 'Y̋$2');
	t = t.replace(/(Y)(ng{0,1}|[mnptkhbdg]{0,1})(z)(?!\w)/g, 'Ý$2');
	t = t.replace(/(Y)(ng{0,1}|[mnptkhbdg]{0,1})(s)(?!\w)/g, 'Ỳ$2');
	t = t.replace(/(Y)(ng{0,1}|[mnptkhbdg]{0,1})(x)(?!\w)/g, 'Ŷ$2');
	t = t.replace(/(Y)(ng{0,1}|[mnptkhbdg]{0,1})(v)(?!\w)/g, 'Y̌$2');
	t = t.replace(/(Y)(ng{0,1}|[mnptkhbdg]{0,1})(f)(?!\w)/g, 'Ȳ$2');
	t = t.replace(/(Y)(ng{0,1}|[mnptkhbdg]{0,1})(l)(?!\w)/g, 'Y̍$2');
	t = t.replace(/(y)(ng{0,1}|[mnptkhbdg]{0,1})(zz)(?!\w)/g, 'y̋$2');
	t = t.replace(/(y)(ng{0,1}|[mnptkhbdg]{0,1})(z)(?!\w)/g, 'ý$2');
	t = t.replace(/(y)(ng{0,1}|[mnptkhbdg]{0,1})(s)(?!\w)/g, 'ỳ$2');
	t = t.replace(/(y)(ng{0,1}|[mnptkhbdg]{0,1})(x)(?!\w)/g, 'ŷ$2');
	t = t.replace(/(y)(ng{0,1}|[mnptkhbdg]{0,1})(v)(?!\w)/g, 'y̌$2');
	t = t.replace(/(y)(ng{0,1}|[mnptkhbdg]{0,1})(f)(?!\w)/g, 'ȳ$2');
	t = t.replace(/(y)(ng{0,1}|[mnptkhbdg]{0,1})(l)(?!\w)/g, 'y̍$2');

	t = t.replace(/(M)(zz)(?!\w)/g, 'M̋');
	t = t.replace(/(M)(z)(?!\w)/g, 'Ḿ');
	t = t.replace(/(M)(s)(?!\w)/g, 'M̀');
	t = t.replace(/(M)(x)(?!\w)/g, 'M̂');
	t = t.replace(/(M)(v)(?!\w)/g, 'M̌');
	t = t.replace(/(M)(f)(?!\w)/g, 'M̄');
	t = t.replace(/(M)(h{0,1})(l)(?!\w)/g, 'M̍$2');
	t = t.replace(/(m)(zz)(?!\w)/g, 'm̋');
	t = t.replace(/(m)(z)(?!\w)/g, 'ḿ');
	t = t.replace(/(m)(s)(?!\w)/g, 'm̀');
	t = t.replace(/(m)(x)(?!\w)/g, 'm̂');
	t = t.replace(/(m)(v)(?!\w)/g, 'm̌');
	t = t.replace(/(m)(f)(?!\w)/g, 'm̄');
	t = t.replace(/(m)(h{0,1})(l)(?!\w)/g, 'm̍$2');

	t = t.replace(/(N)(g{0,1})(zz)(?!\w)/g, 'N̋$2');
	t = t.replace(/(N)(g{0,1})(z)(?!\w)/g, 'Ń$2');
	t = t.replace(/(N)(g{0,1})(s)(?!\w)/g, 'Ǹ$2');
	t = t.replace(/(N)(g{0,1})(x)(?!\w)/g, 'N̂$2');
	t = t.replace(/(N)(g{0,1})(v)(?!\w)/g, 'Ň$2');
	t = t.replace(/(N)(g{0,1})(f)(?!\w)/g, 'N̄$2');
	t = t.replace(/(N)(g{0,1})(h{0,1})(l)(?!\w)/g, 'N̍$2$3');
	t = t.replace(/(n)(g{0,1})(zz)(?!\w)/g, 'n̋$2');
	t = t.replace(/(n)(g{0,1})(z)(?!\w)/g, 'ń$2');
	t = t.replace(/(n)(g{0,1})(s)(?!\w)/g, 'ǹ$2');
	t = t.replace(/(n)(g{0,1})(x)(?!\w)/g, 'n̂$2');
	t = t.replace(/(n)(g{0,1})(v)(?!\w)/g, 'ň$2');
	t = t.replace(/(n)(g{0,1})(f)(?!\w)/g, 'n̄$2');
	t = t.replace(/(n)(g{0,1})(h{0,1})(l)(?!\w)/g, 'n̍$2$3');

	return t;
}


// 字中調轉字母調
function letterToZvs(t) {
	t = t.replace(/űn(?!\w)/g, 'unzz');
	t = t.replace(/Űn(?!\w)/g, 'Unzz');
	t = t.replace(/ű(?!\w)/g, 'uzz');
	t = t.replace(/Ű(?!\w)/g, 'Uzz');

	t = t.replace(/(A̍)([aeioumngptkhry]{0,5})(?!\w)/g, 'A$2l');
	t = t.replace(/(a̍)([aeioumngptkhry]{0,5})(?!\w)/g, 'a$2l');
	t = t.replace(/(Á)([aeioumngptkhry]{0,5})(?!\w)/g, 'A$2z');
	t = t.replace(/(á)([aeioumngptkhry]{0,5})(?!\w)/g, 'a$2z');
	t = t.replace(/(À)([aeioumngptkhry]{0,5})(?!\w)/g, 'A$2s');
	t = t.replace(/(à)([aeioumngptkhry]{0,5})(?!\w)/g, 'a$2s');
	t = t.replace(/(Â)([aeioumngptkhry]{0,5})(?!\w)/g, 'A$2x');
	t = t.replace(/(â)([aeioumngptkhry]{0,5})(?!\w)/g, 'a$2x');
	t = t.replace(/(Ǎ)([aeioumngptkhry]{0,5})(?!\w)/g, 'A$2v');
	t = t.replace(/(ǎ)([aeioumngptkhry]{0,5})(?!\w)/g, 'a$2v');
	t = t.replace(/(Ā)([aeioumngptkhry]{0,5})(?!\w)/g, 'A$2f');
	t = t.replace(/(ā)([aeioumngptkhry]{0,5})(?!\w)/g, 'a$2f');
	t = t.replace(/(A̋)([aeioumngptkhry]{0,5})(?!\w)/g, 'A$2zz');
	t = t.replace(/(a̋)([aeioumngptkhry]{0,5})(?!\w)/g, 'a$2zz');

	t = t.replace(/(O̍)([aeioumngptkhry]{0,5})(?!\w)/g, 'O$2l');
	t = t.replace(/(o̍)([aeioumngptkhry]{0,5})(?!\w)/g, 'o$2l');
	t = t.replace(/(Ó)([aeioumngptkhry]{0,5})(?!\w)/g, 'O$2z');
	t = t.replace(/(ó)([aeioumngptkhry]{0,5})(?!\w)/g, 'o$2z');
	t = t.replace(/(Ò)([aeioumngptkhry]{0,5})(?!\w)/g, 'O$2s');
	t = t.replace(/(ò)([aeioumngptkhry]{0,5})(?!\w)/g, 'o$2s');
	t = t.replace(/(Ô)([aeioumngptkhry]{0,5})(?!\w)/g, 'O$2x');
	t = t.replace(/(ô)([aeioumngptkhry]{0,5})(?!\w)/g, 'o$2x');
	t = t.replace(/(Ǒ)([aeioumngptkhry]{0,5})(?!\w)/g, 'O$2v');
	t = t.replace(/(ǒ)([aeioumngptkhry]{0,5})(?!\w)/g, 'o$2v');
	t = t.replace(/(Ō)([aeioumngptkhry]{0,5})(?!\w)/g, 'O$2f');
	t = t.replace(/(ō)([aeioumngptkhry]{0,5})(?!\w)/g, 'o$2f');
	t = t.replace(/(Ő)([aeioumngptkhry]{0,5})(?!\w)/g, 'O$2zz');
	t = t.replace(/(ő)([aeioumngptkhry]{0,5})(?!\w)/g, 'o$2zz');

	t = t.replace(/(E̍)([aeioumngptkhry]{0,5})(?!\w)/g, 'E$2l');
	t = t.replace(/(e̍)([aeioumngptkhry]{0,5})(?!\w)/g, 'e$2l');
	t = t.replace(/(é)([aeioumngptkhry]{0,5})(?!\w)/g, 'e$2z');
	t = t.replace(/(É)([aeioumngptkhry]{0,5})(?!\w)/g, 'E$2z');
	t = t.replace(/(é)([aeioumngptkhry]{0,5})(?!\w)/g, 'e$2z');
	t = t.replace(/(è)([aeioumngptkhry]{0,5})(?!\w)/g, 'e$2s');
	t = t.replace(/(È)([aeioumngptkhry]{0,5})(?!\w)/g, 'E$2s');
	t = t.replace(/(ê)([aeioumngptkhry]{0,5})(?!\w)/g, 'e$2x');
	t = t.replace(/(Ê)([aeioumngptkhry]{0,5})(?!\w)/g, 'E$2x');
	t = t.replace(/(ê)([aeioumngptkhry]{0,5})(?!\w)/g, 'e$2x');
	t = t.replace(/(ě)([aeioumngptkhry]{0,5})(?!\w)/g, 'e$2v');
	t = t.replace(/(Ě)([aeioumngptkhry]{0,5})(?!\w)/g, 'E$2v');
	t = t.replace(/(ě)([aeioumngptkhry]{0,5})(?!\w)/g, 'e$2v');
	t = t.replace(/(ē)([aeioumngptkhry]{0,5})(?!\w)/g, 'e$2f');
	t = t.replace(/(Ē)([aeioumngptkhry]{0,5})(?!\w)/g, 'E$2f');
	t = t.replace(/(ē)([aeioumngptkhry]{0,5})(?!\w)/g, 'e$2f');
	t = t.replace(/(e̋)([aeioumngptkhry]{0,5})(?!\w)/g, 'e$2zz');
	t = t.replace(/(E̋)([aeioumngptkhry]{0,5})(?!\w)/g, 'E$2zz');
	t = t.replace(/(e̋)([aeioumngptkhry]{0,5})(?!\w)/g, 'e$2zz');

	t = t.replace(/(U̍)([aeioumngptkhr]{0,5})(?!\w)/g, 'U$2l');
	t = t.replace(/(u̍)([aeioumngptkhr]{0,5})(?!\w)/g, 'u$2l');
	t = t.replace(/(Ú)([aeioumngptkhr]{0,5})(?!\w)/g, 'U$2z');
	t = t.replace(/(ú)([aeioumngptkhr]{0,5})(?!\w)/g, 'u$2z');
	t = t.replace(/(Ù)([aeioumngptkhr]{0,5})(?!\w)/g, 'U$2s');
	t = t.replace(/(ù)([aeioumngptkhr]{0,5})(?!\w)/g, 'u$2s');
	t = t.replace(/(Û)([aeioumngptkhr]{0,5})(?!\w)/g, 'U$2x');
	t = t.replace(/(û)([aeioumngptkhr]{0,5})(?!\w)/g, 'u$2x');
	t = t.replace(/(Ǔ)([aeioumngptkhr]{0,5})(?!\w)/g, 'U$2v');
	t = t.replace(/(ǔ)([aeioumngptkhr]{0,5})(?!\w)/g, 'u$2v');
	t = t.replace(/(Ū)([aeioumngptkhr]{0,5})(?!\w)/g, 'U$2f');
	t = t.replace(/(ū)([aeioumngptkhr]{0,5})(?!\w)/g, 'u$2f');
	t = t.replace(/(Ű)([aeioumngptkhr]{0,5})(?!\w)/g, 'U$2zz');
	t = t.replace(/(ű)([aeioumngptkhr]{0,5})(?!\w)/g, 'u$2zz');

	t = t.replace(/(I̍)([aeioumngptkhr]{0,5})(?!\w)/g, 'I$2l');
	t = t.replace(/(i̍)([aeioumngptkhr]{0,5})(?!\w)/g, 'i$2l');
	t = t.replace(/(Í)([aeioumngptkhr]{0,5})(?!\w)/g, 'I$2z');
	t = t.replace(/(í)([aeioumngptkhr]{0,5})(?!\w)/g, 'i$2z');
	t = t.replace(/(Ì)([aeioumngptkhr]{0,5})(?!\w)/g, 'I$2s');
	t = t.replace(/(ì)([aeioumngptkhr]{0,5})(?!\w)/g, 'i$2s');
	t = t.replace(/(Î)([aeioumngptkhr]{0,5})(?!\w)/g, 'I$2x');
	t = t.replace(/(î)([aeioumngptkhr]{0,5})(?!\w)/g, 'i$2x');
	t = t.replace(/(Ǐ)([aeioumngptkhr]{0,5})(?!\w)/g, 'I$2v');
	t = t.replace(/(ǐ)([aeioumngptkhr]{0,5})(?!\w)/g, 'i$2v');
	t = t.replace(/(Ī)([aeioumngptkhr]{0,5})(?!\w)/g, 'I$2f');
	t = t.replace(/(ī)([aeioumngptkhr]{0,5})(?!\w)/g, 'i$2f');
	t = t.replace(/(I̋)([aeioumngptkhr]{0,5})(?!\w)/g, 'I$2zz');
	t = t.replace(/(i̋)([aeioumngptkhr]{0,5})(?!\w)/g, 'i$2zz');

	t = t.replace(/(M̍)([aeioumngptkhr]{0,5})(?!\w)/g, 'M$2l');
	t = t.replace(/(m̍)([aeioumngptkhr]{0,5})(?!\w)/g, 'm$2l');
	t = t.replace(/(M̋)([aeioumngptkhr]{0,5})(?!\w)/g, 'M$2zz');
	t = t.replace(/(m̋)([aeioumngptkhr]{0,5})(?!\w)/g, 'm$2zz');
	t = t.replace(/(Ḿ)([aeioumngptkhr]{0,5})(?!\w)/g, 'M$2z');
	t = t.replace(/(ḿ)([aeioumngptkhr]{0,5})(?!\w)/g, 'm$2z');
	t = t.replace(/(M̀)([aeioumngptkhr]{0,5})(?!\w)/g, 'M$2s');
	t = t.replace(/(m̀)([aeioumngptkhr]{0,5})(?!\w)/g, 'm$2s');
	t = t.replace(/(M̂)([aeioumngptkhr]{0,5})(?!\w)/g, 'M$2x');
	t = t.replace(/(m̂)([aeioumngptkhr]{0,5})(?!\w)/g, 'm$2x');
	t = t.replace(/(M̌)([aeioumngptkhr]{0,5})(?!\w)/g, 'M$2v');
	t = t.replace(/(m̌)([aeioumngptkhr]{0,5})(?!\w)/g, 'm$2v');
	t = t.replace(/(M̄)([aeioumngptkhr]{0,5})(?!\w)/g, 'M$2f');
	t = t.replace(/(m̄)([aeioumngptkhr]{0,5})(?!\w)/g, 'm$2f');
	t = t.replace(/(N̍)([aeioumngptkhr]{0,5})(?!\w)/g, 'N$2l');
	t = t.replace(/(n̍)([aeioumngptkhr]{0,5})(?!\w)/g, 'n$2l');
	t = t.replace(/(N̂)([aeioumngptkhr]{0,5})(?!\w)/g, 'N$2x');
	t = t.replace(/(n̂)([aeioumngptkhr]{0,5})(?!\w)/g, 'n$2x');
	t = t.replace(/(Ň)([aeioumngptkhr]{0,5})(?!\w)/g, 'N$2v');
	t = t.replace(/(ň)([aeioumngptkhr]{0,5})(?!\w)/g, 'n$2v');
	t = t.replace(/(Ň)([aeioumngptkhr]{0,5})(?!\w)/g, 'N$2v');
	t = t.replace(/(ň)([aeioumngptkhr]{0,5})(?!\w)/g, 'n$2v');

	t = t.replace(/(N̄)([aeioumngptkhr]{0,5})(?!\w)/g, 'N$2f');
	t = t.replace(/(n̄)([aeioumngptkhr]{0,5})(?!\w)/g, 'n$2f');
	t = t.replace(/(N̋)([aeioumngptkhr]{0,5})(?!\w)/g, 'N$2zz');
	t = t.replace(/(n̋)([aeioumngptkhr]{0,5})(?!\w)/g, 'n$2zz');
	t = t.replace(/(Ń)([aeioumngptkhr]{0,5})(?!\w)/g, 'N$2z');
	t = t.replace(/(ń)([aeioumngptkhr]{0,5})(?!\w)/g, 'n$2z');
	t = t.replace(/(Ǹ)([aeioumngptkhr]{0,5})(?!\w)/g, 'N$2s');
	t = t.replace(/(ǹ)([aeioumngptkhr]{0,5})(?!\w)/g, 'n$2s');

	t = t.replace(/(y̋)([aeioumngptkhr]{0,5})(?!\w)/g, 'y$2zz');
	t = t.replace(/(ý)([aeioumngptkhr]{0,5})(?!\w)/g, 'y$2z');
	t = t.replace(/(y̌)([aeioumngptkhr]{0,5})(?!\w)/g, 'y$2v');
	t = t.replace(/(ỳ)([aeioumngptkhr]{0,5})(?!\w)/g, 'y$2s');
	t = t.replace(/(ŷ)([aeioumngptkhr]{0,5})(?!\w)/g, 'y$2x');
	t = t.replace(/(ȳ)([aeioumngptkhr]{0,5})(?!\w)/g, 'y$2f');
	t = t.replace(/(y̍)([aeioumngptkhr]{0,5})(?!\w)/g, 'y$2l');

	t = t.replace(/(Y̋)([aeioumngptkhr]{0,5})(?!\w)/g, 'y$2zz');
	t = t.replace(/(Ý)([aeioumngptkhr]{0,5})(?!\w)/g, 'y$2z');
	t = t.replace(/(Y̌)([aeioumngptkhr]{0,5})(?!\w)/g, 'y$2v');
	t = t.replace(/(Ỳ)([aeioumngptkhr]{0,5})(?!\w)/g, 'y$2s');
	t = t.replace(/(Ŷ)([aeioumngptkhr]{0,5})(?!\w)/g, 'y$2x');
	t = t.replace(/(Ȳ)([aeioumngptkhr]{0,5})(?!\w)/g, 'y$2f');
	t = t.replace(/(Y̍)([aeioumngptkhr]{0,5})(?!\w)/g, 'y$2l');
	return t;
}











//================================;

// 四縣羅馬字韻母轉教育部
const sixianPojVowelToEdu = (function() {
    // 轉換對照表
const vowelData =`
正	拼	客	調
n̂g	n̂g	ng	z
N̂g	N̂g	Ng	z
ǹg	ǹg	ng	v
Ǹg	Ǹg	Ng	v
ńg	ńg	ng	s
Ńg	Ńg	Ng	s
â	â	a	z
ê	ê	e	z
î	î	i	z
ô	ô	o	z
û	û	u	z
ṳ̂	ṳ̂	ii	z
Â	Â	A	z
Ê	Ê	E	z
Î	Î	I	z
Ô	Ô	O	z
Û	Û	U	z
Ṳ̂	Ṳ̂	Ii	z
ṳ̂	ṳ̂	ii	z
Ṳ̂	Ṳ̂	Ii	z
à	à	a	v
è	è	e	v
ì	ì	i	v
ò	ò	o	v
ù	ù	u	v
ṳ̀	ṳ̀	ii	v
À	À	A	v
È	È	E	v
Ì	Ì	I	v
Ò	Ò	O	v
Ù	Ù	U	v
Ṳ̀	Ṳ̀	Ii	v
ṳ̀	ṳ̀	ii	v
Ṳ̀	Ṳ̀	Ii	v
á	á	a	s
é	é	e	s
í	í	i	s
ó	ó	o	s
ú	ú	u	s
ṳ́	ṳ́	ii	s
Á	Á	A	s
É	É	E	s
Í	Í	I	s
Ó	Ó	O	s
Ú	Ú	U	s
Ṳ́	Ṳ́	Ii	s
ṳ́	ṳ́	ii	s
Ṳ́	Ṳ́	Ii	s
a̍	a̍	a	l
e̍	e̍	e	l
i̍	i̍	i	l
o̍	o̍	o	l
u̍	u̍	u	l
ṳ̍	ṳ̍	ii	l
A̍	A̍	A	l
E̍	E̍	E	l
I̍	I̍	I	l
O̍	O̍	O	l
U̍	U̍	U	l
Ṳ̍	Ṳ̍	Ii	l
ṳ̍	ṳ̍	ii	l
Ṳ̍	Ṳ̍	Ii	l
ṳ	ṳ	ii	
Ṳ	Ṳ	Ii	
ṳ	ṳ	ii	
Ṳ	Ṳ	Ii	
n̂	n̂	n	z
N̂	N̂	N	z
m̂	m̂	m	z
M̂	M̂	M	z
ǹ	ǹ	n	v
Ǹ	Ǹ	N	v
m̀	m̀	m	v
M̀	M̀	M	v
ń	ń	n	s
Ń	Ń	N	s
ḿ	ḿ	m	s
Ḿ	Ḿ	M	s
`;

    // 預建立分離的轉換映射表（客、調分開儲存）
    const conversionMap = new Map();
    
    // 預編譯正則表達式
    let compiledRegex;
    
    // 初始化預編譯
    (function initialize() {
        const lines = vowelData.trim().split('\n');
		const len = lines.length;
        
        // 收集所有轉換字符並按長度排序（長的優先）
        const conversionChars = [];
        
        // 處理資料行
        for (let i = 1; i < len; i++) {
            const parts = lines[i].split('\t');
            if (parts.length >= 3) { // 至少要有「正」「拼」「客」三欄
                const [zheng, pin, ke, diao = ''] = parts; // diao 預設為空字串
                
                // 跳過重複的轉換規則（相同「正」「拼」對應相同「客」「調」）
                if (conversionMap.has(zheng)) {
                    const existing = conversionMap.get(zheng);
                    if (existing.ke === ke && existing.diao === diao) {
                        continue; // 跳過重複項目
                    }
                }
                
                // 分離儲存「客」和「調」
                conversionMap.set(zheng, { ke, diao });
                conversionMap.set(pin, { ke, diao });
                
                // 收集字符用於正則表達式
                conversionChars.push(zheng, pin);
            }
        }
        
        // 預編譯正則表達式，單一正則完成所有匹配
        const pattern = `(${conversionChars.join('|')})([aeiou]{0,2}(?:ng|[mnptk])?)`;
        compiledRegex = new RegExp(pattern, 'g');
    })();
    
    // 返回轉換函數
    return function(inputText) {
        // 輸入驗證
        if (typeof inputText !== 'string' || !inputText.trim()) {
            return '';
        }
        
        // 單次 replace() 呼叫完成轉換
        return inputText.replace(compiledRegex, function(match, p1, p2) {
            const conversion = conversionMap.get(p1);
            if (!conversion) return match;
            
            // 分離取得「客」和「調」
            const { ke: keChar, diao: diaoChar } = conversion;
            return keChar + p2 + diaoChar;
        });
    };
})();




// 四縣羅馬字聲母轉教育部（嚴苛匹配版）
const sixianPojConsonantToEdu = (function() {
    // 聲母轉換對照（基本對照表）
    const initialMap = new Map([
        ['chh', 'c'],
        ['tsh', 'c'],
        ['ts', 'z'],
        ['ch', 'z'],
        ['ph', 'p'],
        ['th', 't'],
        ['kh', 'k'],
        ['p', 'b'],
        ['t', 'd'],
        ['k', 'g']
    ]);

    // 常用子模式（嚴格：前後必須不是英文字母 -> 確保音節邊界）
    const suffix = '(?:ng|[mnptk])?[zvsl]?';          // 常見韻尾＋可能的聲調字母
    const iNucleus = 'i(?!i)(?:[aeou]{0,2})?';        // i 為核心（但非 ii），後面可接 0–2 個輔助元音
    const vowelStrict = '[aeiou]{1,3}';               // 基本母音群（1~3 個）

    // 幫助：轉換時保留大小寫格式
    function preserveCase(original, converted) {
        if (!original) return converted;
        if (original === original.toUpperCase()) return converted.toUpperCase();
        if (original[0] === original[0].toUpperCase()) return converted[0].toUpperCase() + converted.slice(1).toLowerCase();
        return converted.toLowerCase();
    }

    // 預編譯與規則清單（順序很重要：特殊規則先於一般規則）
    let compiled = (function init() {
        const sortedInitials = Array.from(initialMap.keys())
            .sort((a, b) => b.length - a.length) // 長的先比對（避免 chh 被 ch 搶走）
            .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const initialsPattern = sortedInitials.join('|');

        // 嚴格邊界：(?<![A-Za-z]) ... (?![A-Za-z])
        return {
            // 特殊：chh / tshi -> q （僅當母音核心為 i，但非 ii）
            chhi: new RegExp(`(?<![A-Za-z])(chh)(${iNucleus}${suffix})(?![A-Za-z])`, 'gi'),
            tshi: new RegExp(`(?<![A-Za-z])(tsh)(${iNucleus}${suffix})(?![A-Za-z])`, 'gi'),

            // 特殊：ch / ts -> j （僅當母音核心為 i，但非 ii）
            chi: new RegExp(`(?<![A-Za-z])(ch)(${iNucleus}${suffix})(?![A-Za-z])`, 'gi'),
            tsi: new RegExp(`(?<![A-Za-z])(ts)(${iNucleus}${suffix})(?![A-Za-z])`, 'gi'),

            // 特殊：s -> x （僅當母音核心為 i，但非 ii）
            si: new RegExp(`(?<![A-Za-z])(s)(${iNucleus}${suffix})(?![A-Za-z])`, 'gi'),

            // yi, y 嚴格處理（前後非英文字母）
            yi: new RegExp(`(?<![A-Za-z])yi(${suffix})(?![A-Za-z])`, 'gi'),
            y:  new RegExp(`(?<![A-Za-z])y([aeou]{0,2}${suffix})(?![A-Za-z])`, 'gi'),

            // 基本聲母（只在剩下沒被特殊規則處理時再處理）
            basicInitials: new RegExp(`(?<![A-Za-z])(${initialsPattern})(${vowelStrict}${suffix})(?![A-Za-z])`, 'gi'),

            // 韻尾轉換（嚴格邊界）
            pToB: new RegExp(`(?<![A-Za-z])(?:ng|[bpmfdtnlgkhzcsjqxv])?[aeiou]{0,3}(p)l?(?![A-Za-z])`, 'gi'),
            tToD: new RegExp(`(?<![A-Za-z])(?:ng|[bpmfdtnlgkhzcsjqxv])?[aeiou]{0,3}(t)l?(?![A-Za-z])`, 'gi'),
            kToG: new RegExp(`(?<![A-Za-z])(?:ng|[bpmfdtnlgkhzcsjqxv])?[aeiou]{0,3}(k)l?(?![A-Za-z])`, 'gi'),

            // 在 bdg 後加 s / 刪除 bdg 後的 l（嚴格邊界）
            addS: new RegExp(`(?<![A-Za-z])(?:ng|[bpmfdtnlgkhzcsjqxv])?[aeiou]{1,3}([bdg])(?![A-Za-z])`, 'gi'),
            removeL: new RegExp(`(?<![A-Za-z])(?:ng|[bpmfdtnlgkhzcsjqxv])?[aeiou]{1,3}[bdg](l)(?![A-Za-z])`, 'gi')
        };
    })();

    // 主轉換函數
    return function(inputText) {
        if (typeof inputText !== 'string' || !inputText.trim()) return '';

        let result = inputText;

        // ========== 1. 特殊規則（嚴格版）先行 ==========
        result = result.replace(compiled.chhi, function(match, initial, rest) {
            return preserveCase(initial, 'q') + rest;
        });
        result = result.replace(compiled.tshi, function(match, initial, rest) {
            return preserveCase(initial, 'q') + rest;
        });

        result = result.replace(compiled.chi, function(match, initial, rest) {
            return preserveCase(initial, 'j') + rest;
        });
        result = result.replace(compiled.tsi, function(match, initial, rest) {
            return preserveCase(initial, 'j') + rest;
        });

        result = result.replace(compiled.si, function(match, initial, rest) {
            return preserveCase(initial, 'x') + rest;
        });

        // ========== 2. yi / y（嚴格） ==========
        result = result.replace(compiled.yi, function(match, suffix) {
            return preserveCase('yi', 'i') + suffix;
        });
        result = result.replace(compiled.y, function(match, suffix) {
            return preserveCase('y', 'i') + suffix;
        });

        // ========== 3. 基本聲母（嚴格邊界） ==========
        result = result.replace(compiled.basicInitials, function(match, initial, rest) {
            const converted = initialMap.get(initial.toLowerCase());
            if (converted) {
                return match.replace(initial, preserveCase(initial, converted));
            }
            return match;
        });

        // ========== 4. 韻尾變換與其他 ==========
        result = result.replace(compiled.pToB, function(match, p1) {
            return match.replace(p1, 'b');
        });
        result = result.replace(compiled.tToD, function(match, t1) {
            return match.replace(t1, 'd');
        });
        result = result.replace(compiled.kToG, function(match, k1) {
            return match.replace(k1, 'g');
        });

        result = result.replace(compiled.addS, function(match, bdg) {
            return match + 's';
        });
        result = result.replace(compiled.removeL, function(match, l) {
            return match.replace(l, '');
        });

        return result;
    };
})();


// 客語聲調字母轉調號
const hakkaZvsToTone = (text) => {
   const toneMap = {z:'ˊ', v:'ˇ', s:'ˋ', f:'⁺', x:'ˆ'};
   
   return text?.replace(/\b(?:ng|zh|ch|sh|rh|gg|bb|[bpmfdtnlgkhzcsjqxvr])?[aeiou]{0,3}(?:nnd|ng|nn|[mnbdgr])?([zvsfx])\b/gi, 
       (match, tone) => {
           const toneSymbol = toneMap[tone.toLowerCase()];
           return match.replace(new RegExp(tone + '$', 'i'), toneSymbol);
       }) || '';
};


// 客語調號轉聲調字母
const hakkaToneToZvs = (text) => {
   const toneMap = {'ˊ':'z', 'ˇ':'v', 'ˋ':'s', '⁺':'f', 'ˆ':'x', '+':'f', '^':'x'};
   
   return text?.replace(/(?<!\w)(?:ng|zh|ch|sh|rh|gg|bb|[bpmfdtnlgkhzcsjqxvr])?[aeiou]{0,3}(?:nnd|ng|nn|[mnbdgr])?([ˊˇˋ⁺ˆ+^])(?!\w)/gi, 
       (match, tone) => {
           const toneSymbol = toneMap[tone];
           return match.replace(new RegExp(tone.replace(/[+^]/g, '\\$&') + '$'), toneSymbol);
       }) || '';
};


// 客語調號中平低降轉正確符號
const hakkaToneToFX = (text) => {
   const toneMap = {'+':'⁺', '^':'ˆ'};
   
   return text?.replace(/(?<!\w)(?:ng|zh|ch|sh|rh|gg|bb|[bpmfdtnlgkhzcsjqxvr])?[aeiou]{0,3}(?:nnd|ng|nn|[mnbdgr])?([+^])(?!\w)/gi, 
       (match, tone) => {
           const toneSymbol = toneMap[tone];
           return match.replace(new RegExp(tone.replace(/[+^]/g, '\\$&') + '$'), toneSymbol);
       }) || '';
};



// 客語聲調字母轉上面
const hakkaZvsToLetter = (function() {
// 將拼音尾的[zvs]標示在字母上
    // 建立三個分離的聲調對應表
    const toneZMap = new Map([
        // 二聲 z
        ['a', 'á'], ['e', 'é'], ['i', 'í'], ['o', 'ó'], ['u', 'ú'], ['n', 'ń'], ['m', 'ḿ'],
        ['A', 'Á'], ['E', 'É'], ['I', 'Í'], ['O', 'Ó'], ['U', 'Ú'], ['N', 'Ń'], ['M', 'Ḿ']
    ]);
    
    const toneVMap = new Map([
        // 三聲 v
        ['a', 'ǎ'], ['e', 'ě'], ['i', 'ǐ'], ['o', 'ǒ'], ['u', 'ǔ'], ['n', 'ň'], ['m', 'm̌'],
        ['A', 'Ǎ'], ['E', 'Ě'], ['I', 'Ǐ'], ['O', 'Ǒ'], ['U', 'Ǔ'], ['N', 'Ň'], ['M', 'M̌']
    ]);
    
    const toneSMap = new Map([
        // 四聲 s
        ['a', 'à'], ['e', 'è'], ['i', 'ì'], ['o', 'ò'], ['u', 'ù'], ['n', 'ǹ'], ['m', 'm̀'],
        ['A', 'À'], ['E', 'È'], ['I', 'Ì'], ['O', 'Ò'], ['U', 'Ù'], ['N', 'Ǹ'], ['M', 'M̀']
    ]);
    
    const toneFMap = new Map([
        ['a', 'ā'], ['e', 'ē'], ['i', 'ī'], ['o', 'ō'], ['u', 'ū'], ['n', 'n̄'], ['m', 'm̄'],
        ['A', 'Ā'], ['E', 'Ē'], ['I', 'Ī'], ['O', 'Ō'], ['U', 'Ū'], ['N', 'N̄'], ['M', 'M̄']
    ]);

    const toneXMap = new Map([
        ['a', 'â'], ['e', 'ê'], ['i', 'î'], ['o', 'ô'], ['u', 'û'], ['n', 'n̂'], ['m', 'm̂'],
        ['A', 'Â'], ['E', 'Ê'], ['I', 'Î'], ['O', 'Ô'], ['U', 'Û'], ['N', 'N̂'], ['M', 'M̂']
    ]);

    // 韻母優先順序
    const vowelPriority = [
        'iau', 'uai', 'iai', 'au', 'ai', 'ua', 'ia',  'ee',  'eeu', 
        'iui', 'ioi', 'iei', 'io', 'oi', 'eu', 'ue', 'ie', 'iu', 'ui', 'oo', 'er', 'ii'
    ];
    
    // 找到應該標調的字母位置
    function findTonePosition(vowels) {
        const lowerVowels = vowels.toLowerCase();
        
        // 按優先順序檢查
        for (const pattern of vowelPriority) {
            if (lowerVowels.includes(pattern)) {
                const index = lowerVowels.indexOf(pattern);
                // 返回標調字母在pattern中的位置
                if (pattern === 'iau' || pattern === 'uai' || pattern === 'iai' || 
                    pattern === 'au' || pattern === 'ai' || pattern === 'ua' || pattern === 'ia') {
                    return index + pattern.indexOf('a');
                } else if (pattern === 'iui' || pattern === 'iu') {
                    return index + pattern.indexOf('u');
                } else if (pattern === 'ui' || pattern === 'ii') {
                    return index + pattern.indexOf('i');
                } else if (pattern === 'ee') {
                    return index + pattern.indexOf('e');
                } else if (pattern === 'ioo' || pattern === 'oo') {
                    return index + pattern.indexOf('o');
                } else if (pattern === 'ioi' || pattern === 'io' || pattern === 'oi') {
                    return index + pattern.indexOf('o');
                } else if (pattern === 'eu' || pattern === 'ue' || pattern === 'iei' || pattern === 'ie' || pattern === 'er') {
                    return index + pattern.indexOf('e');
                }
            }
        }
        
        // 如果沒有匹配到優先規則，標在第一個元音
        return 0;
    }
    
    // 應用聲調符號 - 保持大小寫
    function applyTone(char, tone) {
        let toneMapToUse;
        switch (tone.toLowerCase()) {
            case 'z': toneMapToUse = toneZMap; break;
            case 'v': toneMapToUse = toneVMap; break;
            case 's': toneMapToUse = toneSMap; break;
            case 'f': toneMapToUse = toneFMap; break;
            case 'x': toneMapToUse = toneXMap; break;
            default: return char;
        }
        return toneMapToUse.get(char) || char;
    }
    
    // 主要轉換正則表達式
    const mainRegex = /\b(ng|zh|ch|sh|rh|gg|bb|[bpmfdtnlgkhzcsjqxvr])?([aeiou]{0,3})(nnd|ng|nn|[mnbdgr])?([zvsfx])\b/gi;
    
    // 特殊情況：ng + 聲調
    const ngToneRegex = /\bng([zvsfx])\b/gi;
    
    // 特殊情況：m + 聲調
    const mToneRegex = /\bm([zvsfx])\b/gi;

    // 特殊情況：n + 聲調
    const nToneRegex = /\bn([zvsfx])\b/gi;

    return function(inputText) {
        if (typeof inputText !== 'string' || !inputText.trim()) {
            return '';
        }
        
        let result = inputText;
        
        // 處理特殊情況：ng + 聲調
        result = result.replace(ngToneRegex, function(match, tone) {
            const isUpperCase = match[0] === match[0].toUpperCase();
            const baseChar = isUpperCase ? 'N' : 'n';
            return applyTone(baseChar, tone) + 'g';
        });
        
        // 處理特殊情況：m + 聲調
        result = result.replace(mToneRegex, function(match, tone) {
            const isUpperCase = match[0] === match[0].toUpperCase();
            const baseChar = isUpperCase ? 'M' : 'm';
            return applyTone(baseChar, tone);
        });

        // 處理特殊情況：n + 聲調
        result = result.replace(nToneRegex, function(match, tone) {
            const isUpperCase = match[0] === match[0].toUpperCase();
            const baseChar = isUpperCase ? 'N' : 'n';
            return applyTone(baseChar, tone);
        });

        // 處理一般情況
        result = result.replace(mainRegex, function(match, initial, vowels, final, tone) {
            if (!vowels) return match; // 沒有元音則不處理
            
            const initialPart = initial || '';
            const finalPart = final || '';
            
            // 找到應該標調的位置
            const tonePosition = findTonePosition(vowels);
            
            // 將聲調標在指定位置的字母上
            let modifiedVowels = '';
			let len = vowels.length

            for (let i = 0; i < len; i++) {
                if (i === tonePosition) {
                    modifiedVowels += applyTone(vowels[i], tone);
                } else {
                    modifiedVowels += vowels[i];
                }
            }
            
            return initialPart + modifiedVowels + finalPart;
        });
        
        return result;
    };
})();






// 四縣變調
const sixianPinyinToChange = (function() {
    return function(t) {  
	// 四字變調;
	//用分隔成x-xx-x;
	t=t.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi,'$1$2$3$4$5$6$7$8');

	// 三疊字z不變調;
	t=t.replace(/([a-z]{1,6})(z)(-|_| )(\1)(z)(-|_| )(\1)(z)(\b)/gi,'$1ˊ$3$4ˊ$6$7ˊ$9');
	// 三疊字v變調;
	t=t.replace(/([a-z]{1,6})(v)(-|_| )(\1)(v)(-|_| )(\1)(v)(\b)/gi,'$1ˊ$3$4$5$6$7$8$9');
	// z二字變調;
	t=t.replace(/([aeiouymng])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbd]{1,5})([z]{0,1})(\b)/gi,'$1ˇ$3$4$5$6$7');

	// e變調;
	t=t.replace(/([aeiouymngbd])(s)(-|_| )()(e)(s)(\b)/gi,'$1$2$3$4$5ˇ$7');
        return t;
    };
})();

// 海陸變調
const hailuPinyinToChange = (function() {
    return function(t) { 	
	// 四字變調;
	//用分隔成x-xx-x;
	t=t.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi,'$1$2$3$4$5$6$7$8');

	// 三疊字z不變調;
	t=t.replace(/([a-z]{1,6})(z)(-|_| )(\1)(z)(-|_| )(\1)(z)(\b)/gi,'$1ˊ$3$4ˊ$6$7ˊ$9');
	// 三疊字vsfc變調;
	t=t.replace(/([a-z]{1,6})([vsf]{0,1})(-|_| )(\1)(\2)(-|_| )(\1)(\2)(\b)/gi,'$1ˊ$3$4$5$6$7$8$9');


	// 二字變調;
	t=t.replace(/([aeiouymng])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvsf]{0,1})(\b)/gi,'$1$3$4$5$6$7');
	t=t.replace(/([aeiou])([bdg])(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvsf]{0,1})(\b)/gi,'$1$2ˋ$3$4$5$6$7');

	// 移除;
	t=t.replace(//gi,'');
        return t;
    };
})();

// 大埔變調
const dapuPinyinToChange = (function() {
    return function(t) {  
	// 四字變調;
	//用分隔成x-xx-x;
	t=t.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi,'$1$2$3$4$5$6$7$8');

	// 三疊字vsfc變調;
	t=t.replace(/([a-z]{1,6})([vxsf])(-|_| )(\1)([fs])(-|_| )(\1)(\2)(\b)/gi,'$1ˊ$3$4ˇ$6$7$8$9');
	t=t.replace(/([a-z]{1,6})([vxsf])(-|_| )(\1)([v])(-|_| )(\1)(\2)(\b)/gi,'$1ˊ$3$4⁺$6$7$8$9');

	// 二字變調;
	t=t.replace(/([aeiouymng])(f)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([vx])(\b)/gi,'$1ˊ$3$4$5$6$7');
	t=t.replace(/([aeiouymng])(v)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngr]{1,5})([v])(\b)/gi,'$1⁺$3$4$5$6$7');
	t=t.replace(/([aeiouymng])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([xs])(\b)/gi,'$1$3$4$5$6$7');

	// 移除;
	t=t.replace(//gi,'');
        return t;
    };
})();

// 饒平變調
const raopingPinyinToChange = (function() {
    return function(t) {  
	// 四字變調;
	//用分隔成x-xx-x;
	t=t.replace(/([a-z])(-|_| )([a-z])(-|_| )([a-z])(-|_| )([a-z])(\b)/gi,'$1$2$3$4$5$6$7$8');


	// 二字變調;
	t=t.replace(/([aeiouymng])()(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([vs])(\b)/gi,'$1ˋ$3$4$5$6$7');
	t=t.replace(/([aeiouymng])()(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([z]{0,1})(\b)/gi,'$1⁺$3$4$5$6$7');

	t=t.replace(/([aeiouymng])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})(ng|a|e|i|o|u|m|n|r{1,5})([vs])(\b)/gi,'$1⁺$3$4$5$6$7');
	t=t.replace(/([aeiouymng])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdrr]{1,5})([zs]{0,1})(\b)/gi,'$1ˇ$3$4$5$6$7');

	t=t.replace(/([aeiouymng])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvs]{0,1})(\b)/gi,'$1⁺$3$4$5$6$7');

	t=t.replace(/(ag|eg|ig|og|ug|b|d)(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeioumngbdr]{1,5})([zvs]{0,1})(\b)/gi,'$1$3$4$5$6$7');

	// 移除;
	t=t.replace(//gi,'');
        return t;
    };
})();

// 詔安變調
const kasuPinyinToChange = (function() {
    return function(t) {  
	// 四字變調;
	//x-x-x-x 用分隔成x-xx-x;
	t=t.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi,'$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15');
	//w-x-x-x 用分隔成w-xx-x;
	t=t.replace(/([aeiouymng])([zvs]{0,1})(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi,'$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15');
	//x-x-x-w 用分隔成x-xx-w;
	t=t.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvs]{0,1})(\b)/gi,'$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15');

	//w-x-x-w 用分隔成w-xx-w;
	t=t.replace(/([aeiouymng])([zvs]{0,1})(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvs]{0,1})(\b)/gi,'$1$2$3$4$5$6$7$8$9$10$11$12$13$14$15');

	// 三疊字vsfc變調;
	t=t.replace(/([a-z]{1,6})([zvsx])(-|_| )(\1)(\2)(-|_| )(\1)(\2)(\b)/gi,'$1$3$4⁺$6$7$8$9');
	t=t.replace(/([a-z]{1,6})()(-|_| )(\1)(\2)(-|_| )(\1)(\2)(\b)/gi,'$1$3$4⁺$6$7$8$9');

	// 三字變調 x-x-x;
	//x-x-x;
	t=t.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi,'$1ˇ$3$4$5$7$8$9$10$11');

	// 再處理輕聲;
	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(go)(x)(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4ˆ$6$7ˇ$9');
	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(go)(x)(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4ˆ$6$7ˇ$9');

	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ki)(x)(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4ˆ$6$7ˇ$9');
	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ki)(x)(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4ˆ$6$7ˇ$9');

	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ngib)(s)(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4⁺$6$7ˇ$9');
	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(ngib)(s)(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4⁺$6$7ˇ$9');

	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(chid)(z)(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4ˊ$6$7ˇ$9');
	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(chid)(z)(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4ˊ$6$7ˇ$9');

	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(loo|lo)()(-|_| )(loi)(s)(\b)/gi,'$1$2$3$4⁺$6$7ˇ$9');
	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(loo|lo)()(-|_| )(kui)(x)(\b)/gi,'$1$2$3$4⁺$6$7ˇ$9');

	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(rhid|rid)(z)(-|_| )(ha)()(\b)/gi,'$1$2$3$4⁺$6$7⁺$9');
	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(rhid|rid)(z)(-|_| )(baix)()(\b)/gi,'$1$2$3$4⁺$6$7$8$9');
	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--|-|_| )(rhid|rid)(z)(-|_| )(fue)(s)(\b)/gi,'$1$2$3$4⁺$6$7ˆ$9');


	// 二字輕聲--;
	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--)(loo|lo)()(\b)/gi,'$1$2$3$4⁺$6');
	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--)(choo|cho)()(\b)/gi,'$1$2$3$4⁺$6');
	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--)(loi)(s)(\b)/gi,'$1$2$3$4ˇ$6');
	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--)(ngib)(s)(\b)/gi,'$1$2$3$4⁺$6');
	t=t.replace(/([aeiouymng])([zvsx]{0,1})(--)(kui)(x)(\b)/gi,'$1$2$3$4ˇ$6');
	// 人變調
	t=t.replace(/(ngai|hen|gui)(s)(--|-| )(ngin)(s)(\b)/gi,'$1$2$3$4⁺$6');
	t=t.replace(/(een)(v)(--|-| )(ngin)(s)(\b)/gi,'$1$2$3$4⁺$6');

	// 月份變調;
	//c-zvsx;
	t=t.replace(/(zhangx|beedz|samv|rhidz|liuz|cidz|qidz|giux|shibs|ridz|xix|ngi|six|mx)(--|-|_| )(ngied)(s)(\b)/gi,'$1$2$3ˇ$5');

	// 二疊字變調;
	t=t.replace(/([a-z]{1,6})([zvsx])(-|_| )(\1)(\2)(\b)/gi,'$1$3$4$5$6');
	t=t.replace(/([a-z]{1,6})()(-|_| )(\1)(\2)(\b)/gi,'$1$3$4$5$6');

	// 二字變調;
	//c-zvsx;
	t=t.replace(/([aeiouymng])()(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvxs]{0,1})(\b)/gi,'$1⁺$3$4$5$6$7');
	//x-zvs;
	t=t.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymngbd]{1,5})([zvs]{0,1})(\b)/gi,'$1ˇ$3$4$5$6$7');
	//x-x;
	t=t.replace(/([aeiouymng])(x)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})(x)(\b)/gi,'$1$3$4$5$6$7');
	//z-zvsx;
	t=t.replace(/([aeiouymngbd])(z)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvxs]{0,1})(\b)/gi,'$1$3$4$5$6$7');   
	//s-zvsx;
	t=t.replace(/([aeiouymngbd])(s)(-|_| )(zh|ch|sh|rh|ng|b|p|m|f|v|d|t|n|l|g|k|h|z|c|s|j|q|x|r{0,1})([aeiouymng]{1,5})([zvxs]{0,1})(\b)/gi,'$1⁺$3$4$5$6$7');   


	// 移除;
	t=t.replace(//gi,'');
        return t;
    };
})();



//四縣 調型轉調值;
const sixianToneToNumbers = (function() {
    return function(t) {  
		t = t.replace(/([aeioumn])(z)/gi, '$124');
		t = t.replace(/(ng)(z)/gi, '$124');
		t = t.replace(/([aeioumn])(ˇ|v)/gi, '$111');
		t = t.replace(/(ng)(ˇ|v)/gi, '$111');
		t = t.replace(/([aeioumn])(ˋ|s)/gi, '$131');
		t = t.replace(/(ng)(ˋ|s)/gi, '$131');
		t = t.replace(/([aeiou])([bdg])(ˋ|s)/gi, '$1$22');
		t = t.replace(/([aeiou])([bdg])(\b)/gi, '$1$2$35');
		t = t.replace(/([aeioumn])(\b)/gi, '$1$255');
		t = t.replace(/(ng)(\b)/gi, '$1$255');
        return t;
    };
})();

//海陸 調型轉調值;
const hailuToneToNumbers = (function() {
    return function(t) {  		
		t = t.replace(/([aeioumnr])(ˋ|s)/gi, '$153');
		t = t.replace(/(ng)(ˋ|s)/gi, '$153');
		t = t.replace(/([aeioumnr])(ˊ|z)/gi, '$124');
		t = t.replace(/(ng)(ˊ|z)/gi, '$124');
		t = t.replace(/([aeioumnr])(ˇ|v)/gi, '$111');
		t = t.replace(/(ng)(ˇ|v)/gi, '$111');
		t = t.replace(/([aeioumnr])(\+|⁺|f)/gi, '$133');
		t = t.replace(/(ng)(\+|⁺|f)/gi, '$133');
		t = t.replace(/([aeiou])([bdg])(ˋ|s)/gi, '$1$22');
		t = t.replace(/([aeiou])([bdg])(\b)/gi, '$1$2$35');
		t = t.replace(/([aeioumnr])(\b)/gi, '$1$255');
		t = t.replace(/(ng)(\b)/gi, '$1$255');
        return t;
    };
})();

//大埔 調型轉調值;
const dapuToneToNumbers = (function() {
    return function(t) {  		
		t = t.replace(/([aeioumnr])(ˇ|v)/gi, '$1113');
		t = t.replace(/(ng)(ˇ|v)/gi, '$1113');
		t = t.replace(/([aeioumnr])(\+|⁺|f)/gi, '$133');
		t = t.replace(/(ng)(\+|⁺|f)/gi, '$133');
		t = t.replace(/([aeioumnr])(\^|ˆ|x)/gi, '$131');
		t = t.replace(/(ng)(\^|ˆ|x)/gi, '$131');
		t = t.replace(/([aeioumnr])(ˋ|s)/gi, '$153');
		t = t.replace(/(ng)(ˋ|s)/gi, '$153');
		t = t.replace(/([aeiou])([bdg])(\^|ˆ|x)/gi, '$1$221');
		t = t.replace(/([aeiou])([bdg])(ˋ|s)/gi, '$1$254');
        return t;
    };
})();

//饒平 調型轉調值;
const raopingToneToNumbers = (function() {
    return function(t) { 		
		t = t.replace(/([aeioumnr])(ˇ|v)/gi, '$111');
		t = t.replace(/(ng)(ˇ|v)/gi, '$111');
		t = t.replace(/([aeioumnr])(ˋ|s)/gi, '$153');
		t = t.replace(/(ng)(ˋ|s)/gi, '$153');
		t = t.replace(/([aeioumnr])(ˊ|z)/gi, '$124');
		t = t.replace(/(ng)(ˊ|z)/gi, '$124');
		t = t.replace(/([aeioumnr])(\^|ˆ|x)/gi, '$131');
		t = t.replace(/(ng)(\^|ˆ|x)/gi, '$131');
		t = t.replace(/([aeiou])([bdg])(ˋ|s)/gi, '$1$22');
		t = t.replace(/([aeiou])([bdg])(\b)/gi, '$1$2$35');
		t = t.replace(/([aeioumnr])(\b)/gi, '$1$255');
		t = t.replace(/(ng)(\b)/gi, '$1$255');
        return t;
    };
})();

//詔安 調型轉調值;
const kasuToneToNumbers = (function() {
    return function(t) { 		
		t = t.replace(/([aeioumnbdg])(ˇ|v)/gi, '$111');
		t = t.replace(/([aeioumn])(ˋ|s)/gi, '$153');
		t = t.replace(/(ng)(ˋ|s)/gi, '$153');
		t = t.replace(/([aeioumnbdg])(\^|ˆ|x)/gi, '$131');
		t = t.replace(/([aeioumngbd])(ˊ|z)/gi, '$124');
		t = t.replace(/([aeiou])([bdg])(ˋ|s)/gi, '$1$243');
		t = t.replace(/(nnd)(ˋ|s)/gi, '$143');
		t = t.replace(/([aeioumn])(\+|⁺|f)/gi, '$133');
		t = t.replace(/(ng)(\+|⁺|f)/gi, '$133');
		t = t.replace(/([aeiou])([bdg])(\+|⁺|f)/gi, '$1$23');
		t = t.replace(/(nnd)(\+|⁺|f)/gi, '$13');
		t = t.replace(/([aeioumn])(\b)/gi, '$1$255');
		t = t.replace(/(ng)(\b)/gi, '$1$255');
        return t;
    };
})();






//四縣 調值轉調型;
const sixianNumbersToTone = (function() {
    return function(t) {  		
		t = t.replace(/([aeioumn])(24)/gi, '$1ˊ');
		t = t.replace(/(ng)(24)/gi, '$1ˊ');
		t = t.replace(/([aeioumn])(11)/gi, '$1ˇ');
		t = t.replace(/(ng)(11)/gi, '$1ˇ');
		t = t.replace(/([aeioumn])(31)/gi, '$1ˋ');
		t = t.replace(/(ng)(31)/gi, '$1ˋ');
		t = t.replace(/([aeiou])([bdg])(2)/gi, '$1$2ˋ');
		t = t.replace(/([aeiou])([bdg])(5)/gi, '$1$2');
		t = t.replace(/([aeioumn])(55)/gi, '$1');
		t = t.replace(/(ng)(55)/gi, '$1');
        return t;
    };
})();

//海陸 調值轉調型;
const hailuNumbersToTone = (function() {
    return function(t) {  		
		t = t.replace(/([aeioumnr])(53)/gi, '$1ˋ');
		t = t.replace(/(ng)(53)/gi, '$1ˋ');
		t = t.replace(/([aeioumnr])(24)/gi, '$1ˊ');
		t = t.replace(/(ng)(24)/gi, '$1ˊ');
		t = t.replace(/([aeioumnr])(11)/gi, '$1ˇ');
		t = t.replace(/(ng)(11)/gi, '$1ˇ');
		t = t.replace(/([aeioumnr])(33)/gi, '$1⁺');
		t = t.replace(/(ng)(33)/gi, '$1⁺');
		t = t.replace(/([aeiou])([bdg])(2)/gi, '$1$2ˋ');
		t = t.replace(/([aeiou])([bdg])(5)/gi, '$1$2');
		t = t.replace(/([aeioumnr])(55)/gi, '$1');
		t = t.replace(/(ng)(55)/gi, '$1');
        return t;
    };
})();


//大埔 調值轉調型;
const dapuNumbersToTone = (function() {
    return function(t) { 		
		t = t.replace(/(ng)(113)/gi, '$1ˇ');
		t = t.replace(/([aeioumnr])(31)/gi, '$1ˆ');
		t = t.replace(/([aeioumnr])(33)/gi, '$1⁺');
		t = t.replace(/(ng)(33)/gi, '$1⁺');
		t = t.replace(/([aeioumnr])(113)/gi, '$1ˇ');
		t = t.replace(/(ng)(31)/gi, '$1ˆ');
		t = t.replace(/([aeioumnr])(53)/gi, '$1ˋ');
		t = t.replace(/(ng)(53)/gi, '$1ˋ');
		t = t.replace(/([aeiou])([bdg])(21)/gi, '$1$2ˆ');
		t = t.replace(/([aeiou])([bdg])(54)/gi, '$1$2ˋ');
        return t;
    };
})();

//饒平 調值轉調型;
const raopingNumbersToTone = (function() {
    return function(t) { 		
		t = t.replace(/([aeioumnr])(11)/gi, '$1ˇ');
		t = t.replace(/(ng)(11)/gi, '$1ˇ');
		t = t.replace(/([aeioumnr])(53)/gi, '$1ˋ');
		t = t.replace(/(ng)(53)/gi, '$1ˋ');
		t = t.replace(/([aeioumnr])(31)/gi, '$1ˆ');
		t = t.replace(/(ng)(31)/gi, '$1ˆ');
		t = t.replace(/([aeioumnr])(24)/gi, '$1ˊ');
		t = t.replace(/(ng)(24)/gi, '$1ˊ');
		t = t.replace(/([aeiou])([bdg])(2)/gi, '$1$2ˋ');
		t = t.replace(/([aeiou])([bdg])(5)/gi, '$1$2');
		t = t.replace(/([aeioumnr])(55)/gi, '$1');
		t = t.replace(/(ng)(55)/gi, '$1');
        return t;
    };
})();

//詔安 調值轉調型;
const kasuNumbersToTone = (function() {
    return function(t) {  		
		t = t.replace(/([aeioumnbdg])(11)/gi, '$1ˇ');
		t = t.replace(/([aeioumn]|ng)(53)/gi, '$1ˋ');
		t = t.replace(/([aeioumnbdg])(31)/gi, '$1ˆ');
		t = t.replace(/([aeioumngbd])(24)/gi, '$1ˊ');
		t = t.replace(/([aeiou])([bdg])(53|43)/gi, '$1$2ˋ');
		t = t.replace(/(nnd)(53|43)/gi, '$1ˋ');
		t = t.replace(/([aeioumn]|ng)(55)/gi, '$1');
		t = t.replace(/([aeioumn]|ng)(33)/gi, '$1⁺');
		t = t.replace(/([aeiou])([bdg])(3)/gi, '$1$2⁺');
		t = t.replace(/([aeiou])([bdg])(5)/gi, '$1$2');
		t = t.replace(/(nnd)(3)/gi, '$1⁺');
		t = t.replace(/(nnd)(5)/gi, '$1');
        return t;
    };
})();







// 客語拼音轉注音
const hakkaPinyinToBpm = (function() {
    // 聲母對應表 (直接定義物件，易於閱讀與維護)
    const consonantMap = {
        "bb": "万", "ng": "兀", "rh": "ㄖ", "r": "ㄖ", "zh": "ㄓ", 
        "ch": "ㄔ", "sh": "ㄕ", "b": "ㄅ", "p": "ㄆ", "m": "ㄇ", 
        "f": "ㄈ", "d": "ㄉ", "t": "ㄊ", "n": "ㄋ", "l": "ㄌ", 
        "g": "ㄍ", "k": "ㄎ", "h": "ㄏ", "j": "ㄐ", "q": "ㄑ", 
        "x": "ㄒ", "z": "ㄗ", "c": "ㄘ", "s": "ㄙ", "v": "万"
    };

    // 韻母對應表
    // 特別注意：ii 對應空字串，但在處理時會暫時標記，以利聲母識別
    const vowelMap = {
        "iang": "ㄧㄤ", "iong": "ㄧㄛㄥ", "iung": "ㄧㄨㄥ", "uang": "ㄨㄤ", "ang": "ㄤ", 
        "iag": "ㄧㄚㄍ", "ied": "ㄧㄝㄉ", "ien": "ㄧㄝㄣ", "ong": "ㄛㄥ", "ung": "ㄨㄥ", 
        "iid": "ㄉ", "iim": "ㄇ", "iin": "ㄣ", "iab": "ㄧㄚㄅ", "iam": "ㄧㄚㄇ", "iau": "ㄧㄠ", 
        "iog": "ㄧㄛㄍ", "ieb": "ㄧㄝㄅ", "iem": "ㄧㄝㄇ", "ieu": "ㄧㄝㄨ", "iug": "ㄧㄨㄍ", 
        "iun": "ㄧㄨㄣ", "uad": "ㄨㄚㄉ", "uai": "ㄨㄞ", "uan": "ㄨㄢ", "ued": "ㄨㄝㄉ", 
        "uen": "ㄨㄝㄣ", "iui": "ㄧㄨㄧ", "ioi": "ㄧㄛㄧ", "iud": "ㄧㄨㄉ", "ion": "ㄧㄛㄣ", 
        "iib": "ㄅ", "ab": "ㄚㄅ", "ad": "ㄚㄉ", "ag": "ㄚㄍ", "ai": "ㄞ", "am": "ㄚㄇ", 
        "an": "ㄢ", "au": "ㄠ", "ed": "ㄝㄉ", "en": "ㄝㄣ", "eu": "ㄝㄨ", "er": "ㄜ", 
        "id": "ㄧㄉ", "in": "ㄧㄣ", "iu": "ㄧㄨ", "od": "ㄛㄉ", "og": "ㄛㄍ", "oi": "ㄛㄧ", 
        "ud": "ㄨㄉ", "ug": "ㄨㄍ", "un": "ㄨㄣ", "em": "ㄝㄇ", "ii": "\u200B", // 使用零寬空格作為標記
        "on": "ㄛㄣ", "ui": "ㄨㄧ", "eb": "ㄝㄅ", "io": "ㄧㄛ", "ia": "ㄧㄚ", "ib": "ㄧㄅ", 
        "ie": "ㄧㄝ", "im": "ㄧㄇ", "ua": "ㄨㄚ", "ng": "ㄥ", "a": "ㄚ", "e": "ㄝ", 
        "i": "ㄧ", "o": "ㄛ", "u": "ㄨ", "inn": "ㆳ", "uannd": "ㄨㆩㄉ", "ann": "ㆩ", 
        "ainn": "ㆮ", "uainn": "ㄨㆮ", "ee": "乜", "eem": "乜ㄇ", "m": "ㄇ"
    };

    // 聲調對應表
    const toneMap = {
        "f": "⁺", "v": "ˇ", "z": "ˊ", "s": "ˋ", "x": "ˆ"
    };

    // 預編譯正則表達式
    const vowelKeys = Object.keys(vowelMap).sort((a, b) => b.length - a.length);
    const consonantKeys = Object.keys(consonantMap).sort((a, b) => b.length - a.length);

    // 動態生成 Lookahead 字符集：包含所有轉換後韻母的第一個字元，以及我們的特殊標記 \u200B
    // 這確保聲母轉換時，後面確實跟著已轉換的韻母
    const validFollowChars = new Set(Object.values(vowelMap).map(v => v ? v[0] : '').filter(Boolean));
    const lookaheadPattern = '[' + Array.from(validFollowChars).join('') + '\u200B' + ']';

    // 韻母匹配正則：(聲母)?(韻母)(聲調)?
    // 使用 consonantKeys 確保聲母列表與數據一致
    const vowelRegex = new RegExp(`\\b(${consonantKeys.join('|')})?(${vowelKeys.join('|')})([fvzsx]?)\\b`, 'gi');
    
    // 聲母匹配正則：聲母 + (Lookahead: 注音符號或標記)
    const consonantRegex = new RegExp(`\\b(${consonantKeys.join('|')})(?=${lookaheadPattern})`, 'gi');

    return function(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        let result = text;

        // 第一步：轉換韻母和聲調
        // 如果有捕捉到聲母，先保留原樣，待第二步處理
        result = result.replace(vowelRegex, (match, consonant, vowel, tone) => {
            const zhuyin_vowel = vowelMap[vowel.toLowerCase()] || vowel;
            const zhuyin_tone = tone ? toneMap[tone] : '';
            const consonantPart = consonant ? consonant : '';
            return consonantPart + zhuyin_vowel + zhuyin_tone;
        });

        // 第二步：轉換聲母
        // 這裡會匹配 "聲母" 後面跟著 "注音" 的情況
        result = result.replace(consonantRegex, (match, consonant) => {
            return consonantMap[consonant.toLowerCase()] || consonant;
        });

        // 第三步：移除 ii 產生的臨時標記
        result = result.replace(/\u200B/g, '');

        return result;
    };
})();


// 客語注音轉拼音
const hakkaBpmToPinyin = (function() {
    // 注音轉拼音對應表
    const bpmMap = {
        "ㄧㄛㄥ": "iong", "ㄧㄨㄥ": "iung", "ㄧㄚㄍ": "iag", "ㄧㄝㄉ": "ied", "ㄧㄝㄣ": "ien", 
        "ㄧㄚㄅ": "iab", "ㄧㄚㄇ": "iam", "ㄧㄛㄍ": "iog", "ㄧㄝㄅ": "ieb", "ㄧㄝㄇ": "iem", 
        "ㄧㄝㄨ": "ieu", "ㄧㄨㄍ": "iug", "ㄧㄨㄣ": "iun", "ㄨㄚㄉ": "uad", "ㄨㄝㄉ": "ued", 
        "ㄨㄝㄣ": "uen", "ㄧㄨㄧ": "iui", "ㄧㄛㄧ": "ioi", "ㄧㄨㄉ": "iud", "ㄧㄛㄣ": "ion", 
        "ㄧㄤ": "iang", "ㄨㄤ": "uang", "ㄛㄥ": "ong", "ㄨㄥ": "ung", "ㄧㄠ": "iau", 
        "ㄨㄞ": "uai", "ㄨㄢ": "uan", "ㄚㄅ": "ab", "ㄚㄉ": "ad", "ㄚㄍ": "ag", 
        "ㄚㄇ": "am", "ㄝㄉ": "ed", "ㄝㄣ": "en", "ㄝㄨ": "eu", "ㄧㄉ": "id", 
        "ㄧㄣ": "in", "ㄧㄨ": "iu", "ㄛㄉ": "od", "ㄛㄍ": "og", "ㄛㄧ": "oi", 
        "ㄨㄉ": "ud", "ㄨㄍ": "ug", "ㄨㄣ": "un", "ㄝㄇ": "em", "ㄛㄣ": "on", 
        "ㄝㄅ": "eb", "ㄧㄛ": "io", "ㄧㄚ": "ia", "ㄧㄅ": "ib", "ㄧㄝ": "ie", 
        "ㄧㄇ": "im", "ㄨㄚ": "ua", "ㄨㄧ": "ui", "ㄘㄉ": "ciid", "ㄘㄇ": "ciim", 
        "ㄘㄣ": "ciin", "ㄙㄅ": "siib", "ㄙㄉ": "siid", "ㄙㄇ": "siim", "ㄙㄣ": "siin", 
        "ㄗㄅ": "ziib", "ㄗㄉ": "ziid", "ㄗㄇ": "ziim", "ㄗㄣ": "ziin", "ㄤ": "ang", 
        "ㄞ": "ai", "ㄢ": "an", "ㄠ": "au", "ㄜ": "er", "ㄚ": "a", 
        "ㄝ": "e", "ㄧ": "i", "ㄛ": "o", "ㄨ": "u", "兀": "ng", 
        "ㄖ": "rh", "ㄓ": "zh", "ㄔ": "ch", "ㄕ": "sh", "ㄅ": "b", 
        "ㄆ": "p", "ㄇ": "m", "ㄈ": "f", "ㄉ": "d", "ㄊ": "t", 
        "ㄋ": "n", "ㄌ": "l", "ㄍ": "g", "ㄎ": "k", "ㄏ": "h", 
        "ㄐ": "j", "ㄑ": "q", "ㄒ": "x", "万": "v", "ㄘ": "cii", 
        "ㄙ": "sii", "ㄗ": "zii", "乜": "ee", "乜ㄇ": "eem", "ㄨㆮ": "uainn", 
        "ㆮ": "ainn", "ㆩ": "ann", "ㄨㆩㄉ": "uannd", "ㆳ": "inn", "ㆲ": "ong"
    };

    // 預編譯正則表達式 (按長度排序，確保最長匹配優先)
    const bpmKeys = Object.keys(bpmMap).sort((a, b) => b.length - a.length);
    const zhuyinRegex = new RegExp(`(${bpmKeys.join('|')})`, 'g');
    
    return function(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        
        return text.replace(zhuyinRegex, (match, bpm) => {
            return bpmMap[bpm] || bpm;
        });
    };
})();






const [bpmBigToSmall, bpmSmallToBig] = (function() {
    const rawData = [
        "ㄅ","","ㄆ","","ㄇ","","ㄈ","","ㄉ","","ㄊ","","ㄋ","","ㄌ","",
        "ㄍ","","ㄎ","","ㄏ","","ㄐ","","ㄑ","","ㄒ","","ㄓ","","ㄔ","",
        "ㄕ","","ㄖ","","ㄗ","","ㄘ","","ㄙ","","ㄧ","","ㄨ","","ㄩ","",
        "ㄚ","","ㄛ","","ㄜ","","ㄝ","","ㄞ","","ㄟ","","ㄠ","","ㄡ","",
        "ㄢ","","ㄣ","","ㄤ","","ㄥ","","ㄦ","","ㄪ","","ㄫ","","ㄬ","",
        "ㆠ","","ㆣ","","ㆢ","","ㆡ","","ㆳ","","ㆫ","","ㆩ","","ㆦ","",
        "ㆧ","","ㆤ","","ㆥ","","ㆮ","","ㆯ","","ㆬ","","ㆰ","","ㆱ","",
        "ㆲ","","ㆭ","","勺","","廿","","工","","万","","兀",""
    ];

    const b2s = new Map();
    const s2b = new Map();

    // 建構映射表
    for (let i = 0; i < rawData.length; i += 2) {
        const big = rawData[i];
        const small = rawData[i + 1];
        if (!b2s.has(big)) {
            b2s.set(big, small);
        }
        s2b.set(small, big);
    }

    // 轉換函數：大 -> 小
    function toSmall(text) {
        if (!text) return "";
        let result = "";
        for (const char of text) {
            result += b2s.get(char) || char;
        }
        return result;
    }

    // 轉換函數：小 -> 大
    function toBig(text) {
        if (!text) return "";
        let result = "";
        for (const char of text) {
            result += s2b.get(char) || char;
        }
        return result;
    }

    return [toSmall, toBig];
})();



const [kasuPinyinToBpmSmall, kasuBpmSmallToPinyin] = (function() {

    const rawData = [
        // === 1. 程式邏輯專用的特殊映射 ===
        "__o", "",         // 特殊 o (用於 m/n/ng 後)
        "__ng_intro", "",  // 特殊 ng (聲母專用)
        
        // === 2. 補全資料 ===
        "ing", "", 
        "ng", "",  

        // === 3. 原有資料 (移除 ngo，交由邏輯處理) ===
        "uannd","","iaunn","","uainn","","ainn","","aunn","","iann","","iang","","iong","","iong","","iung","","uang","",
        "eeu","","een","","eem","","eed","","eeb","","ann","","inn","","enn","","onn","",
        "ang","","iag","","ied","","ien","","ong","","ong","","ung","",
        "iid","","iim","","iin","","iab","","iam","","iam","","iau","","iog","",
        "ieb","","iem","","ieu","","iug","","iun","","uad","","ien","",
        "uai","","uan","","ued","","uen","","iui","","ioi","",
        "iud","","ion","","iib",
        "no","","","ab","","ad","","ag","","ai","",
        "am","","am","","an","","au","","ed","","en","","eu","","ee","","oo","",
        "er","","id","","in","","iu","","io","","ob","","od","","og","","oi","","ud","",
        "ug","","un","","om","","om","","em","","ii","","on","","ui","","eb","","io","",
        "ia","","ib","","ie","","im","","ua","","bb","","a","","e","",
        "i","","o","","u","","rh","","r","","zh","","ch","","sh","",
        "b","","p","","m","","f","","d","","t","","n","","l","","g","",
        "k","","h","","j","","q","","x","","z","","c","","s","","v",""
    ];

    const p2s = new Map();
    const s2p = new Map();

    for (let i = 0; i < rawData.length; i += 2) {
        const pinyin = rawData[i];
        const small = rawData[i + 1];
        p2s.set(pinyin, small);
        if (small) s2p.set(small, pinyin);
    }

    // === 4. 優先權與反查設定 ===
    s2p.set("", "oo");
    s2p.set("", "rh");
	s2p.set("", "bb");
    s2p.set("", "z");
    s2p.set("", "c");
    s2p.set("", "s");
    
    // 【反查修正】
    //  (聲母) 顯示為 ng
    //  (韻母) 顯示為 ng
    //  (ngo) 顯示為 ngo
    s2p.set("", "ng"); 
    s2p.set("", "ng");
    s2p.set("", "ngo");
    s2p.delete(""); 

    const pKeys = Array.from(p2s.keys()).sort((a, b) => b.length - a.length);
    const sKeys = Array.from(s2p.keys()).sort((a, b) => b.length - a.length);
    const pRegex = new RegExp(pKeys.join('|'), 'g');
    const sRegex = new RegExp(sKeys.join('|'), 'g');

    // 拼音 -> 小注音
    function toSmall(text) {
        if (!text) return "";

        // 步驟 1: 處理 z/c/s 接 i
        let processed = text.replace(/([zcs])(?=i)/g, (match) => {
            if (match === 'z') return 'j';
            if (match === 'c') return 'q';
            if (match === 's') return 'x';
            return match;
        });

        // 步驟 2: 處理 m/n/ng 接 o (o 轉為 __o)
        // 這會讓 ngo 變成 ng__o
        processed = processed.replace(/(ng|m|n)(i?o)(?![ngdib])/g, (match, p1, p2) => {
            return p1 + p2.replace('o', '__o');
        });

        // 步驟 3: 【核心修正】處理 ng 的聲母/韻母歧義
        // 規則：
        // 1. 如果 ng 後面接了字母或底線 (代表後面有韻母，例如 nga, ng__o) -> 視為聲母 ()
        // 2. 但如果 ng 前面是母音 (a,e,i,o,u) -> 代表它是 ang, ong, ing 的一部分 -> 保持不變 ()
        // 3. 這裡使用 regex capturing group ($1) 來檢查前面是否有母音
        processed = processed.replace(/([aeiou])?ng(?=[a-zA-Z_])/g, (match, p1) => {
            if (p1) return match; // 捕捉到前面有母音 (如 ang)，保持原樣，交給後續 pRegex 處理
            return "__ng_intro";  // 前面無母音且後面有字 (如 nga)，改為聲母代碼
        });

        // 步驟 4: 標準查表
        // 這裡會處理:
        // __ng_intro -> 
        // __o -> 
        // ang ->  (因為 ang 長度優先)
        // ng ->  (沒被上面規則抓到的單獨 ng)
        return processed.replace(pRegex, (match) => p2s.get(match));
    }

    // 小注音 -> 拼音
    function toPinyin(text) {
        if (!text) return "";
        return text.replace(sRegex, (match) => s2p.get(match));
    }

    return [toSmall, toPinyin];
})();





/**
 * 小注音與迷你注音的雙向轉換
 */

// ==========================================
// 1. 規則數據定義 (Data Definitions)
// ==========================================

const bpmRules = {
    // Group 3-2: Base(1) + ComplexFinal(3) + Tone(1)
    "S3_2": [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", ""],
        ["ˊ", "ˇ", "ˋ", "ˆ", "⁺"]
    ],
    "M3_2": [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", ""],
        ["", "", "", "", ""]
    ],

    // Group 3-1: Base(1) + Medial(1) + Final(1 or 2) + Filler(1) + Tone(1)
    "S3_1": [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", ""],
        ["ˊ", "ˇ", "ˋ", "ˆ", "⁺"]
    ],
    "M3_1": [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", ""],
        ["", "", "", "", ""]
    ],

    // Group 2: Base(1) + Final(1 or 2) + Filler(1) + Tone(1)
    "S2": [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", ""],
        ["ˊ", "ˇ", "ˋ", "ˆ", "⁺"]
    ],
    "M2": [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", ""],
        ["", "", "", "", ""]
    ],

    // Group 1: Base(1) + Medial(1) + Tone(1)
    "S1": [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", ""],
        ["ˊ", "ˇ", "ˋ", "ˆ", "⁺"]
    ],
    "M1": [
        ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", ""],
        ["", "", "", "", ""]
    ]
};

const miniToSmallMap = {
    "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "",
    "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "ˊ", "": "ˇ", "": "ˋ", "": "ˆ", "": "⁺",
    "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "",
    "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "",
    "": "", "": "", "": "", "": "", "": "ˊ", "": "ˇ", "": "ˋ", "": "ˆ", "": "⁺",
    "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "",
    "": "", "": "", "": "",
    "": "", "": "", "": "", "": "", "": "", "": "",
    "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "",
    "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "", "": "",
    "": "", "": "", "": "", "": "",
    "": "ˊ", "": "ˇ", "": "ˋ", "": "ˆ", "": "⁺"
};



// ==========================================
// 2. 轉換函數 (Conversion Functions)
// ==========================================

/**
 * 輔助函數：在列表中尋找最長的匹配字串
 */
const findBestMatch = (text, startIdx, candidateList) => {
    const MAX_LEN = 3;
    for (let len = MAX_LEN; len >= 1; len--) {
        if (startIdx + len > text.length) continue;
        let sub = text.substr(startIdx, len);
        let idx = candidateList.indexOf(sub);
        if (idx !== -1) {
            return { index: idx, length: len, match: sub };
        }
    }
    return null;
};

/**
 * 迷你注音 轉為 小注音
 */
const bpmTinyToSmall = (text) => {
    const sortedKeys = Object.keys(miniToSmallMap).sort((a, b) => b.length - a.length);
    let result = "";
    let i = 0;
    const len = text.length;

    while (i < len) {
        let matched = false;
        for (const key of sortedKeys) {
            if (text.substr(i, key.length) === key) {
                result += miniToSmallMap[key];
                i += key.length;
                matched = true;
                break;
            }
        }
        if (!matched) {
            result += text[i];
            i++;
        }
    }
    return result;
};

/**
 * 小注音 轉為 迷你注音
 */
const bpmSmallToTiny = (text) => {
    let result = "";
    let i = 0;
    const len = text.length;
    const findIdx = (char, list) => list.indexOf(char);

    while (i < len) {
        let c1 = text[i];

        // --- Priority 0: bpmRulesExceptions (Special Combinations) ---


        // --- Priority 1: Group 3-2 (Base + Complex Final) ---
        if (i + 4 <= len) { 
            let s2 = text.substr(i + 1, 3);
            let idx1 = findIdx(c1, bpmRules.S3_2[0]);
            let idx2 = findIdx(s2, bpmRules.S3_2[1]);

            if (idx1 !== -1 && idx2 !== -1) {
                let out = bpmRules.M3_2[0][idx1] + bpmRules.M3_2[1][idx2];
                let consumed = 4;
                if (i + 4 < len) {
                    let idx3 = findIdx(text[i + 4], bpmRules.S3_2[2]);
                    if (idx3 !== -1) {
                        out += bpmRules.M3_2[2][idx3];
                        consumed = 5;
                    }
                }
                result += out;
                i += consumed;
                continue;
            }
        }

        // --- Candidate Competition (S3_1 vs S2 vs S1) ---
        let candidates = [];

        // A. Check S3_1 (Base + Medial + Final)
        if (i + 2 <= len) {
            let idx1 = findIdx(c1, bpmRules.S3_1[0]);
            if (idx1 !== -1) {
                let c2 = text[i+1];
                let idx2 = findIdx(c2, bpmRules.S3_1[1]);
                if (idx2 !== -1) {
                    let finalMatch = findBestMatch(text, i+2, bpmRules.S3_1[2]);
                    if (finalMatch) {
                        candidates.push({
                            type: 'S3_1',
                            coreLen: 2 + finalMatch.length,
                            data: { idx1, idx2, idx3: finalMatch.index }
                        });
                    }
                }
            }
        }

        // B. Check S2 (Base + Final)
        if (i + 1 <= len) {
            let idx1 = findIdx(c1, bpmRules.S2[0]);
            if (idx1 !== -1) {
                let finalMatch = findBestMatch(text, i+1, bpmRules.S2[1]);
                if (finalMatch) {
                    candidates.push({
                        type: 'S2',
                        coreLen: 1 + finalMatch.length,
                        data: { idx1, idx2: finalMatch.index }
                    });
                }
            }
        }

        // C. Check S1 Multi (Ligature Base)
        let s1Match = findBestMatch(text, i, bpmRules.S1[0]);
        if (s1Match && s1Match.length > 1) {
            candidates.push({
                type: 'S1',
                coreLen: s1Match.length,
                data: { idx1: s1Match.index }
            });
        }

        // D. Select Best Candidate
        if (candidates.length > 0) {
            // Sort by Core Length DESC, then Priority (S1 > S2 > S3_1)
            candidates.sort((a, b) => {
                if (b.coreLen !== a.coreLen) return b.coreLen - a.coreLen;
                const p = { 'S1': 3, 'S2': 2, 'S3_1': 1 };
                return p[b.type] - p[a.type];
            });
            
            let best = candidates[0];
            let out = "";
            let consumed = best.coreLen;
            
            if (best.type === 'S3_1') {
                out = bpmRules.M3_1[0][best.data.idx1] + bpmRules.M3_1[1][best.data.idx2] + bpmRules.M3_1[2][best.data.idx3];
                if (i + consumed < len) { // Filler
                    let idx = findIdx(text[i + consumed], bpmRules.S3_1[3]);
                    if (idx !== -1) { out += bpmRules.M3_1[3][idx]; consumed++; }
                }
                if (i + consumed < len) { // Tone
                    let idx = findIdx(text[i + consumed], bpmRules.S3_1[4]);
                    if (idx !== -1) { out += bpmRules.M3_1[4][idx]; consumed++; }
                }
            } else if (best.type === 'S2') {
                out = bpmRules.M2[0][best.data.idx1] + bpmRules.M2[1][best.data.idx2];
                if (i + consumed < len) { // Filler
                    let idx = findIdx(text[i + consumed], bpmRules.S2[2]);
                    if (idx !== -1) { out += bpmRules.M2[2][idx]; consumed++; }
                }
                if (i + consumed < len) { // Tone
                    let idx = findIdx(text[i + consumed], bpmRules.S2[3]);
                    if (idx !== -1) { out += bpmRules.M2[3][idx]; consumed++; }
                }
            } else if (best.type === 'S1') {
                out = bpmRules.M1[0][best.data.idx1];
                if (i + consumed < len) { // Filler
                    let idx = findIdx(text[i + consumed], bpmRules.S1[1]);
                    if (idx !== -1) { out += bpmRules.M1[1][idx]; consumed++; }
                }
                if (i + consumed < len) { // Tone
                    let idx = findIdx(text[i + consumed], bpmRules.S1[2]);
                    if (idx !== -1) { out += bpmRules.M1[2][idx]; consumed++; }
                }
            }
            
            result += out;
            i += consumed;
            continue;
        }

        // --- Priority 4: Group 1 (Single Char Base) ---
        let idx1 = findIdx(c1, bpmRules.S1[0]);
        if (idx1 !== -1) {
            let out = bpmRules.M1[0][idx1];
            let consumed = 1;

            if (i + consumed < len) {
                let idx2 = findIdx(text[i + consumed], bpmRules.S1[1]);
                if (idx2 !== -1) { out += bpmRules.M1[1][idx2]; consumed++; }
            }
            if (i + consumed < len) {
                let idx3 = findIdx(text[i + consumed], bpmRules.S1[2]);
                if (idx3 !== -1) { out += bpmRules.M1[2][idx3]; consumed++; }
            }
            
            result += out;
            i += consumed;
            continue;
        }

        // No Match Found
        result += c1;
        i++;
    }
    return result;
};


//-----------------------------------//

// ==========================================
// 詔安客語拼音 <-> 國際音標 (IPA) 轉換功能
// ==========================================

// 1. 聲調與數字對照表 (獨立定義，用於特殊處理)
const hakkaIpaToneData = [
    ["11", "¹¹"], ["55", "⁵⁵"], ["53", "⁵³"], ["24", "²⁴"], 
    ["31", "³¹"], ["43", "⁴³"], ["5", "⁵"], ["3", "³"],
    ["0", "⁰"], ["1", "¹"], ["2", "²"], ["4", "⁴"], 
    ["6", "⁶"], ["7", "⁷"], ["8", "⁸"], ["9", "⁹"]
];

// 2. 主對照表 (僅包含拼音與 IPA 符號，不含數字)
// 格式：[拼音, IPA]
const hakkaIpaMasterData = [
    // === 特殊韻母 & 複合韻母 ===
    ["iaunn", "iãu"], ["uainn", "uãi"], 
    ["iang", "iaŋ"], ["uang", "uaŋ"], ["iung", "iuŋ"], ["iong", "iɔŋ"], 
    ["ainn", "ãi"], ["uai", "uãi"], ["eeu", "ɛu"], ["iau", "iau"],
    ["iam", "iam"], ["uan", "uan"], ["ien", "ien"], ["uen", "uen"], 
    ["ang", "aŋ"], ["ing", "iŋ"], ["ung", "uŋ"], ["ong", "ɔŋ"], 
    ["ann", "ã"], ["inn", "ĩ"], ["enn", "ẽ"], 
    ["iab", "iap"], ["eeb", "ɛp"], ["ied", "iet"], ["uad", "uat"],
    ["eed", "ɛt"], ["uag", "uak"], ["iag", "iak"], 
    
    // === 聲母 (Digraphs) ===
    ["zh", "ʧ"], ["ch", "ʧʰ"], ["sh", "ʃ"], ["rh", "ʒ"], 
    ["bb", "b"], ["ng", "ŋ"],
    
    // === 母音 ===
    ["oo", "o"], ["ee", "ɛ"], ["ii", "ɨ"], ["er", "ɤ"],
    ["ai", "ai"], ["au", "au"], ["io", "io"], ["iu", "iu"], ["ue", "ue"],
    ["ia", "ia"], ["ua", "ua"], ["oi", "ɔi"], ["ui", "ui"], ["eu", "eu"],
    
    // === 韻尾組合 ===
    ["am", "am"], ["im", "im"], ["em", "em"], ["an", "an"], ["iim", "ɨm"],
    ["in", "in"], ["en", "en"], ["on", "ɔn"],  ["un", "un"], ["iin", "ɨn"],
    ["ab", "ap"], ["ib", "ip"], ["eb", "ep"], ["ob", "ɔp"], ["iib", "ɨp"],
    ["ad", "at"], ["id", "it"], ["ud", "ut"], ["ed", "et"], ["od", "ɔt"], ["iid", "ɨt"],
    ["ag", "ak"], ["ig", "ik"], ["ug", "uk"], ["eg", "ek"], ["og", "ɔk"], 
    
    // === 單聲母 ===
    ["b", "p"], ["p", "pʰ"], ["m", "m"], ["f", "f"], ["d", "t"],
    ["t", "tʰ"], ["n", "n"], ["l", "l"], ["g", "k"], ["k", "kʰ"],
    ["h", "h"], ["z", "ʦ"], ["c", "ʦʰ"], ["s", "s"], ["v", "v"],
    ["j", "ʨ"], ["q", "ʨʰ"], ["x", "ɕ"], 
    
    // === 單母音 ===
    ["a", "a"], ["i", "i"], ["u", "u"], ["e", "e"], ["o", "ɔ"]
];

// 3. 初始化轉換引擎
const { pinyinToIpaRegex, pinyinToIpaMap, ipaToPinyinRegex, ipaToPinyinMap, numberToSuperMap } = (function() {
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Pinyin -> IPA (僅包含主表，不含數字)
    // 這樣 "123" 在此階段不會被轉換，只有文字會被轉換
    const p2iList = [...hakkaIpaMasterData].sort((a, b) => b[0].length - a[0].length);
    
    // IPA -> Pinyin (主表 + 數字表)
    // 這樣 "¹²³" 可以轉回 "123"
    const i2pList = [...hakkaIpaMasterData, ...hakkaIpaToneData]
        .map(([k, v]) => [v, k])
        .sort((a, b) => b[0].length - a[0].length);

    // 數字轉上標 Map (用於後處理)
    const numMap = new Map(hakkaIpaToneData);

    return {
        pinyinToIpaRegex: new RegExp(p2iList.map(x => escapeRegExp(x[0])).join('|'), 'g'),
        pinyinToIpaMap: new Map(p2iList),
        ipaToPinyinRegex: new RegExp(i2pList.map(x => escapeRegExp(x[0])).join('|'), 'g'),
        ipaToPinyinMap: new Map(i2pList),
        numberToSuperMap: numMap
    };
})();

// 4. 輔助函數：數字轉上標 (僅轉換緊接在 IPA 字符後的數字)
function convertNumbersToSuperscript(text) {
    // 正則：匹配前面的字符是否為有效的 IPA/拉丁字符或組合符號
    // [a-z]: 基本拉丁字母
    // \u00C0-\u02FF: 包含拉丁補充、IPA 擴展 (如 ɛ, ɔ, ɨ, ɤ, ŋ, ʰ)
    // \u0300-\u036F: 組合變音符號 (如成節鼻音的下方豎線 ̩ )
    const validPredecessor = /[a-z\u00C0-\u02FF\u0300-\u036F]/i;
    
    return text.replace(/([0-9]+)/g, (match, number, offset) => {
        // 檢查數字的前一個字符
        if (offset > 0 && validPredecessor.test(text[offset - 1])) {
            // 是 IPA 字符接續的數字 -> 進行轉換
            let converted = "";
            for (let char of number) {
                converted += numberToSuperMap.get(char) || char;
            }
            return converted;
        }
        // 前面是空白、標點或其他符號 -> 保持原樣 (如 "123" 或 "No.1")
        return match;
    });
}

// 5. 客語拼音轉國際音標 (底層函數)
function hakkaPinyinIpa(t) {
    if (!t) return "";
    
    // 處理成節鼻音 (在數字調轉換後，IPA 替換前)
    // 這裡同樣只在後面跟著數字時才轉換，避免誤判
    t = t.replace(/\bng(?=[0-9])/gi, 'ŋ̍');
    t = t.replace(/\bm(?=[0-9])/gi, 'm̩');
    t = t.replace(/\bn(?=[0-9])/gi, 'n̩');

    // 執行主要替換 (文字部分)
    t = t.replace(pinyinToIpaRegex, (match) => pinyinToIpaMap.get(match) || match);
    
    // 執行數字上標轉換 (僅當緊接在 IPA 字符後)
    t = convertNumbersToSuperscript(t);
    
    return t;
}

// 6. 國際音標轉客語拼音 (底層函數)
function hakkaIpaPinyin(t) {
    if (!t) return "";

    // 還原成節鼻音
    t = t.replace(/ŋ̍/g, 'ng');
    t = t.replace(/m̩/g, 'm');
    t = t.replace(/n̩/g, 'n');

    // 執行替換 (包含文字與上標數字還原)
    t = t.replace(ipaToPinyinRegex, (match) => ipaToPinyinMap.get(match) || match);    

    // 將數字調轉回聲調符號
    return kasuNumbersToTone(t);
}

// 7. 詔安拼音轉國際音標 (公開接口)
function kasuPinyinIpa(t) {
    // 預處理：統一轉為字尾調
    if (regexLetter.test(t)) { t = hakkaLetterZvs(t); }
    if (regexTone.test(t)) { t = hakkaToneToZvs(t); }
    // 轉為數字調 (此時文字仍為拼音)
    t = kasuToneToNumbers(t);
    // 轉為 IPA
	t = hakkaPinyinIpa(t)
	return t;
}

// 8. 國際音標轉詔安拼音 (公開接口)
function kasuIpaPinyin(t) {
    t = hakkaIpaPinyin(t) 
    return kasuNumbersToTone(t);
}

// 9. 其他腔調的 IPA 支援 (沿用相同邏輯)
function sixianPinyinIpa(t) {
    if (regexLetter.test(t)) { t = hakkaLetterZvs(t); }
    if (regexTone.test(t)) { t = hakkaToneToZvs(t); }
    t = sixianToneToNumbers(t);
	t = hakkaPinyinIpa(t)
	return t;
}
function sixianIpaPinyin(t) {
    t = hakkaIpaPinyin(t) 
    return sixianNumbersToTone(t);
}

function hailuPinyinIpa(t) {
    if (regexLetter.test(t)) { t = hakkaLetterZvs(t); }
    if (regexTone.test(t)) { t = hakkaToneToZvs(t); }
    t = hailuToneToNumbers(t);
	t = hakkaPinyinIpa(t)
	return t;
}
function hailuIpaPinyin(t) {
    t = hakkaIpaPinyin(t) 
    return hailuNumbersToTone(t);
}

function dapuPinyinIpa(t) {
    if (regexLetter.test(t)) { t = hakkaLetterZvs(t); }
    if (regexTone.test(t)) { t = hakkaToneToZvs(t); }
    t = dapuToneToNumbers(t);
	t = hakkaPinyinIpa(t)
	return t;
}
function dapuIpaPinyin(t) {
    t = hakkaIpaPinyin(t) 
    return dapuNumbersToTone(t);
}

function raopingPinyinIpa(t) {
    if (regexLetter.test(t)) { t = hakkaLetterZvs(t); }
    if (regexTone.test(t)) { t = hakkaToneToZvs(t); }
    t = raopingToneToNumbers(t);
	t = hakkaPinyinIpa(t)
	return t;
}
function raopingIpaPinyin(t) {
    t = hakkaIpaPinyin(t) 
    return raopingNumbersToTone(t);
}



//-----------------------------------//

	
	
// 客語拼音轉注音
function hakkaPinyinBpm(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
		t = hakkaPinyinToBpm(t)
	return t;
}

// 客語拼音轉小注音
function hakkaPinyinBpmSmall(t){ 
	if (regexBpmBig.test(t)) {t = bpmBigToSmall(t) }	
	t = hakkaPinyinBpm(t);
	t = bpmBigToSmall(t);
	return t;
}

// 客語注音轉拼音字尾調
function hakkaBpmPinyinTone(t){ 
	if (regexBpmSmall.test(t)) {t = bpmSmallToBig(t) }
	t = hakkaBpmToPinyin(t);
	return hakkaToneToFX(t);	
}

// 客語拼音轉字尾調
function hakkaPinyinTone(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterTone(t) }
	if (regexZvs.test(t)) {t = hakkaZvsTone(t) }
	t = hakkaToneToFX(t);
	return t;
}

// 客語拼音轉字中調
function hakkaPinyinLetter(t){ 
	if (regexTone.test(t)) {t = hakkaToneLetter(t) }
	if (regexZvs.test(t)) {t = hakkaZvsLetter(t) }
	return t;
}

// 客語拼音轉字母調
function hakkaPinyinZvs(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	return t;
}



// 客語字母調轉字尾調
function hakkaZvsTone(t){ 
	t = hakkaToneToFX(t)	
	return hakkaZvsToTone(t);	}
// 客語字母調轉字中調
function hakkaZvsLetter(t){ return hakkaZvsToLetter(t);}
// 客語字中調轉字母調
function hakkaLetterZvs(t){ 	return letterToZvs(t);}
// 客語字中調轉字尾調
function hakkaLetterTone(t){ 
	t = hakkaToneToFX(t)
	t = letterToZvs(t)
	return hakkaZvsToTone(t);
}
// 客語字尾調轉字母調
function hakkaToneZvs(t){ return hakkaToneToZvs(t);}

// 客語字尾調轉字中調
function hakkaToneLetter(t){ 
	t = hakkaToneToZvs(t);
	return hakkaZvsToLetter(t);
}


// 四縣教羅轉客拼字尾調
function sixianPojEduTone(t){
	t = sixianPojVowelToEdu(t);
	t = sixianPojConsonantToEdu(t);
	t = hakkaZvsToTone(t);
	return t;
}

// 四縣教羅轉客拼字中調
function sixianPojEduLetter(t){
	t = sixianPojVowelToEdu(t);
	t = sixianPojConsonantToEdu(t);
	t = hakkaZvsToLetter(t);
	return t;
}

// 四縣教羅轉客拼字母調
function sixianPojEduZvs(t){
	t = sixianPojVowelToEdu(t);
	t = sixianPojConsonantToEdu(t);
	return t;
}

// 四縣拼音轉變調
function sixianPinyinChange(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = sixianPinyinToChange(t);
	t = hakkaZvsToTone(t)
	return t;
}


// 四縣聲調轉調值
function sixianToneNumbers(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = sixianToneToNumbers(t);
	return t;
}
// 四縣調值轉字尾調
function sixianNumbersTone(t){ return sixianNumbersToTone(t);}




// 海陸拼音轉變調
function hailuPinyinChange(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = hailuPinyinToChange(t);
	t = hakkaZvsToTone(t)
	return t;
}

// 海陸聲調轉調值
function hailuToneNumbers(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = hailuToneToNumbers(t);
	return t;
}
// 海陸調值轉字尾調
function hailuNumbersTone(t){ return hailuNumbersToTone(t);}

// 大埔拼音轉變調
function dapuPinyinChange(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = dapuPinyinToChange(t);
	t = hakkaZvsToTone(t)
	return t;
}

// 大埔聲調轉調值
function dapuToneNumbers(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = dapuToneToNumbers(t);
	return t;
}
// 大埔調值轉字尾調
function dapuNumbersTone(t){ return dapuNumbersToTone(t);}

// 饒平拼音轉變調
function raopingPinyinChange(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = raopingPinyinToChange(t);
	t = hakkaZvsToTone(t)
	return t;
}

// 饒平聲調轉調值
function raopingToneNumbers(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = raopingToneToNumbers(t);
	return t;
}
// 饒平調值轉字尾調
function raopingNumbersTone(t){ return raopingNumbersToTone(t);}

// 詔安拼音轉變調
function kasuPinyinChange(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = kasuPinyinToChange(t);
	t = hakkaZvsToTone(t)
	return t;
}

// 詔安聲調轉調值
function kasuToneNumbers(t){ 
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	if (regexTone.test(t)) {t = hakkaToneToZvs(t) }
	t = kasuToneToNumbers(t);
	return t;
}
// 詔安調值轉字尾調
function kasuNumbersTone(t){ return kasuNumbersToTone(t);}

function kasuNumbersZvs(t){
	t = kasuNumbersToTone(t)
	t = hakkaToneZvs(t);
	return t;
}











function holoPinyinLetter(t){
	if (regexNumber.test(t)) {t = holoNumberToTone(t) }
	if (regexZvs.test(t)) {t = holoZvsToTone(t) }
	return t;
}

function holoPinyinNumber(t){
	if (regexLetter.test(t)) {t = letterToZvs(t) }
	return holoZvsToNumber(t);
}

function holoPinyinZvs(t){ 
	if (regexLetter.test(t)) {t = letterToZvs(t) }
	if (regexNumber.test(t)) {t = holoNumberToZvs(t) }
	return t;
}

function holoPinyinIpa(t){
	if (regexLetter.test(t)) {t = letterToZvs(t) }
	if (regexZvs.test(t)) {t = holoZvsToNumber(t) }
	return holoTailoToIpa(t);
}

function holoTailoIpa(t){
	if (regexLetter.test(t)) {t = letterToZvs(t) }
	if (regexZvs.test(t)) {t = holoZvsToNumber(t) }
	return holoTailoToIpa(t);
}

function holoIpaNumber(t){
	return holoIpaToNumber(t);
}

function holoIpaTailo(t){
	t = holoIpaToNumber(t);
	return holoNumberToTone(t);
}


function holoToneNumber(t){ 
	t = letterToZvs(t)
	return holoZvsToNumber(t); }
function holoToneZvs(t){ return letterToZvs(t); }
function holoNumberTone(t){ return holoNumberToTone(t); }
function holoNumberZvs(t){ return holoNumberToZvs(t); }
function holoZvsTone(t){ return holoZvsToTone(t); }
function holoZvsNumber(t){ return holoZvsToNumber(t); }
function holoPojTailo(t){ return holoPojToTailo(t); }
function holoIpaTailo(t){ return holoIpaToTailo(t); }


function holoTaiwaneseTailuo(t){
	t = holoTaiwaneseToTailuo(t);
	return t;
}









function matsuPinyinBpm(t){
	 if (regexLetter.test(t)) {t = letterToZvs(t) }
	 if (regexTone.test(t)) {t = matsuToneToZvs(t) }
	 if (regexNumber.test(t)) {t = matsuNumberToZvs(t) }
	 t = matsuPinyinToBpm(t);
	return t;
}

function matsuPinyinBpmSmall(t){
	 t = matsuPinyinBpm(t);
	 t = bpmBigSmall(t);
	return t;
}


function matsuPinyinTone(t){
	 if (regexLetter.test(t)) {t = letterToZvs(t) }
	 if (regexTone.test(t)) {t = matsuToneToZvs(t) }
	 if (regexNumber.test(t)) {t = matsuNumberToZvs(t) }
	 t = mstsuToneToFX(t);
	return matsuZvsToTone(t);
}

function matsuPinyinNumber(t){
	 if (regexLetter.test(t)) {t = letterToZvs(t) }
	 if (regexTone.test(t)) {t = matsuToneToZvs(t) }
	 //if (regexNumber.test(t)) {t = matsuNumberToZvs(t) }
	return matsuZvsToNumber(t);
}

function matsuPinyinLetter(t){
	 //if (regexLetter.test(t)) {t = letterToZvs(t) }
	 if (regexTone.test(t)) {t = matsuToneToZvs(t) }
	 if (regexNumber.test(t)) {t = matsuNumberToZvs(t) }
	return zvsToLetter(t);
}

function matsuPinyinZvs(t){
	 if (regexLetter.test(t)) {t = letterToZvs(t) }
	 if (regexTone.test(t)) {t = matsuToneToZvs(t) }
	 if (regexNumber.test(t)) {t = matsuNumberToZvs(t) }
	return t;
}

function matsuBpmPinyinTone(t){ 
	 if (regexBpmSmall.test(t)) {t = bpmSmallToBig(t) }
	 t = mstsuToneToFX(t);
	return matsuBpmToPinyin(t); }

function matsuBpmPinyinNumber(t){ 
	if (regexBpmSmall.test(t)) {t = bpmSmallToBig(t) }
	t=matsuBpmToPinyin(t);
	t=matsuToneToNumber(t);
	return t; 
}
function matsuBpmPinyinZvs(t){ 
	if (regexBpmSmall.test(t)) {t = bpmSmallToBig(t) }
	t = matsuBpmToPinyin(t);
	t = matsuToneToZvs(t);
	return t; 
}

function matsuBpmPinyinLetter(t){ 
	t=matsuBpmToPinyin(t);
	t=matsuToneToZvs(t);
	return zvsToLetter(t); 
}

function matsuNumberTone(t){ 
	 t = mstsuToneToFX(t);
	return matsuNumberToTone(t); }
function matsuNumberZvs(t){ return matsuNumberToZvs(t); }
function matsuToneNumber(t){ return matsuToneToNumber(t); }
function matsuToneZvs(t){ return matsuToneToZvs(t); }
function matsuZvsTone(t){ 
	 t = mstsuToneToFX(t);
	return matsuZvsToTone(t); }
function matsuZvsNumber(t){ return matsuZvsToNumber(t); }
function matsuPinyinOriginalChangeZvs(t){
	 if (regexLetter.test(t)) {t = letterToZvs(t) }
	 if (regexTone.test(t)) {t = matsuToneToZvs(t) }
	 if (regexNumber.test(t)) {t = matsuNumberToZvs(t) }
    return matsuOriginalToChange(t); 
}
function matsuPinyinOriginalChangeTone(t){
	t = matsuPinyinOriginalChangeZvs(t);
	return matsuZvsToTone(t);
}
function matsuBpmOriginalChangeTone(t){
	t = matsuBpmPinyinZvs(t);
	t = matsuPinyinOriginalChangeZvs(t);
	t = matsuPinyinBpm(t);
	return t;
}

function matsuBpmSmallOriginalChangeTone(t){
	t = matsuBpmPinyinZvs(t);
	t = matsuPinyinOriginalChangeZvs(t);
	t = matsuPinyinBpm(t);
	if (regexBpmBig.test(t)) {t = bpmBigToSmall(t) }	
	return t;
}


function matsuToneLetter(t){
	t = matsuToneToZvs(t)
	return zvsToLetter(t);
}
function matsuNumberLetter(t){
	t = matsuNumberToZvs(t)
	return zvsToLetter(t);
}


function bpmBigSmall(t){
	if (regexBpmTiny.test(t)) {t = bpmTinyToSmall(t) }
	t = bpmBigToSmall(t)
	return t;
}

function bpmSmallBig(t){
	t = bpmSmallToBig(t)
	return t;
}



function bpmSmallTiny(t){
	if (regexBpmBig.test(t)) {t = bpmBigToSmall(t) }	
	t = bpmSmallToTiny(t)
	return t;
}

function kasuBpmSmallPinyin(t){
	if (regexBpmBig.test(t)) {t = bpmBigToSmall(t) }	
	if (regexBpmTiny.test(t)) {t = bpmTinyToSmall(t) }	
	t = kasuBpmSmallToPinyin(t)	
	return t;
}

function kasuBpmSmallZvs(t){
	if (regexBpmBig.test(t)) {t = bpmBigToSmall(t) }	
	if (regexBpmTiny.test(t)) {t = bpmTinyToSmall(t) }	
	t = kasuBpmSmallToPinyin(t)
	t = hakkaPinyinZvs(t)
	return t;
}

function kasuPinyinBpmSmall(t){
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	t = hakkaZvsToTone(t);
	if (regexBpmBig.test(t)) {t = bpmBigToSmall(t) }
	t = kasuPinyinToBpmSmall(t)
	return t;
}


function kasuPinyinBpmTiny(t){
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	t = hakkaZvsToTone(t);
	if (regexBpmBig.test(t)) {t = bpmBigToSmall(t) }
	t = kasuPinyinToBpmSmall(t);
    t = bpmSmallToTiny(t);
	return t;
}


function hakkaPinyinBpmTiny(t){
	if (regexLetter.test(t)) {t = hakkaLetterZvs(t) }
	t = hakkaZvsToTone(t);
	if (regexBpmBig.test(t)) {t = bpmBigToSmall(t) }
	t = hakkaPinyinBpmSmall(t);
    t = bpmSmallToTiny(t);
	return t;
}
