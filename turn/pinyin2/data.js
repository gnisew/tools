
//字中調檢測
const regexLetter = /Ű|ű|A̋|A̍|E̋|E̍|I̋|I̍|M̀|M̂|M̄|M̋|M̌|M̍|N̂|N̄|N̋|N̍|O̍|U̍|Y̋|Y̌|Y̍|a̋|a̍|e̋|e̍|i̋|i̍|m̀|m̂|m̄|m̋|m̌|m̍|n̂|n̄|n̋|n̍|o̍|u̍|y̋|y̌|y̍|[ỲÝŶȲŇỳýŷȳňÀÁÂÈÉÊÌÍÎÒÓÔÙÚÛàáâèéêìíîòóôùúûĀāĒēĚěĪīŃńŌōŐőŪūǍǎǏǐǑǒǓǔǸǹḾḿ]/i;

//字尾調檢測
const regexTone = /(?<!\w)(tsh|chh|ts|ch|zh|sh|rh|ng|bb|gg|[bpmfvdtnlgkhzcsjqxry])?(?:ng|[aeioumy]){1,3}(?:ng|nn|[mnbdgptkhr])?([ˊˋˇˆ⁺\^\+])(?!\w)/i;

//數字調檢測
const regexNumber = /(?<!\w)(tsh|chh|ts|ch|zh|sh|rh|ng|bb|gg|[bpmfvdtnlgkhzcsjqxry])?(?:ng|[aeioumy]){1,3}(?:ng|nn|[mnbdgptkhr])?([123456789])(?!\w)/i;







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
    const vowelRegex = new RegExp(`\\b(tsh|ph|th|kh|ts|[pmtnlkhjsb])?(${vowelKeys.join('|')})([fvzsx1234578]?)\\b`, 'gi');
    
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
	const bpmData =`ㄘ	tsh_ㄑ	tsh_ㄆ	ph_ㄊ	th_ㄎ	kh_ㄗ	ts_ㄐ	ts_ㄅ	p_ㄇ	m_ㄉ	t_ㄋ	n_ㄌ	l_ㄍ	k_ㄏ	h_ㄖ	j_ㄙ	s_ㄒ	s_勺	b_廿	oe_ㄞ	ai_ㄠ	au_ㄟ	ei_ㄧ	i_ㄡ	ou_ㄛ	o_ㄨ	u_ㄩ	y_ㄤ	ang_ㄚ	a_ㄢ	an_ㄝ	e_兀	ng_`;

    
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
    const basePattern = `\\b(tsh|ph|th|kh|ts|[pmtnlkhjsb])?([aeiouy]{1,3})`;    
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
    const basePattern = `\\b(tsh|ph|th|kh|ts|[pmtnlkhjsb])?([aeiouy]{1,3})`;    
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
    const basePattern = `\\b(tsh|ph|th|kh|ts|[pmtnlkhjsb])?([aeiouy]{1,3})`;
    
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
    const basePattern = `\\b(tsh|ph|th|kh|ts|[pmtnlkhjsb])?([aeiouy]{1,3})`;
    
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
    const completeRegex = new RegExp(`\\b(tsh|ph|th|kh|ts|[pmtnlkhjsb])?([aeiouy]{1,3})(ng|[mnptkh])?([⁺ˇˊˋˆ+^])(?![a-zA-Z])`, 'gi');
    
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
    const basePattern = `\\b(tsh|ph|th|kh|ts|[pmtnlkhjsb])?([aeiouy]{1,3})`;
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
    t=t.replace(/([aeiouymg])([vxz]{0,1})(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'$1f$3$4$5$6$7');
    t=t.replace(/(h)([vxz]{0,1})(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'f$3$4$5$6$7');

    t=t.replace(/([aeiouymgh])([vxz]{0,1})(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([fvxz])(\b)/gi,'$1s$3$4$5$6$7');
    t=t.replace(/(h)([vxz]{0,1})(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([fvxz])(\b)/gi,'s$3$4$5$6$7');

    t=t.replace(/([aeiouymg])([f])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'$1v$3$4$5$6$7');

    t=t.replace(/([aeiouymg])([f])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})(f)(\b)/gi,'$1z$3$4$5$6$7');

    t=t.replace(/([aeiouymg])([f])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([vxz])(\b)/gi,'$1$3$4$5$6$7');

    t=t.replace(/(k)([z])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'hv$3$4$5$6$7');

    t=t.replace(/(k)([z])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})(f)(\b)/gi,'hz$3$4$5$6$7');

    t=t.replace(/(k)([z])(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([vxz])(\b)/gi,'h$3$4$5$6$7');

    t=t.replace(/(k)()(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'hf$3$4$5$6$7');
    t=t.replace(/(h)()(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([s]{0,1})(\b)/gi,'f$3$4$5$6$7');

    t=t.replace(/(h)()(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([fvxz])(\b)/gi,'s$3$4$5$6$7');

    t=t.replace(/(k)()(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([fvxz])(\b)/gi,'h$3$4$5$6$7');




    t=t.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})()(\b)/gi,'$1f$3$4$5$6$7');
    t=t.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})(s)(\b)/gi,'$1v$3$4$5$6$7');
    t=t.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([hk])()(\b)/gi,'$1v$3$4$5$6$7');
    t=t.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouyng]{1,5})(f)(\b)/gi,'$1f$3$4$5$6$7');
    t=t.replace(/([aeiouymg])(s)(--|-| )(tsh|ts|ph|th|kh|ng|p|m|t|n|l|k|h|s{0,1})([aeiouynghk]{1,5})([vxz])(\b)/gi,'$1v$3$4$5$6$7');


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


