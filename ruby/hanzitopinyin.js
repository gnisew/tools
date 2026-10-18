// 全域的異體字轉換
var m = ["－－","－－","﹗","﹙","﹚","﹐","﹑","﹒","﹕","﹔","﹖","︰","了","力","女","不","丹","什","六","令","北","句","立","列","劣","吏","年","老","肋","串","冷","利","卵","吝","呂","尿","弄","更","李","沈","牢","良","車","辰","里","阮","來","例","兩","刺","囹","奈","念","怜","拉","易","杻","林","泌","泥","炙","狀","秊","金","亮","便","咽","契","律","怒","拏","拾","柳","洛","流","玲","省","若","郎","陋","倫","凉","料","旅","朗","栗","浪","烈","烙","狼","珞","琉","留","紐","索","茶","豈","郞","勒","匿","參","崙","捻","掠","敎","梁","梨","殺","淋","淚","淪","率","理","略","異","硫","笠","粒","累","羚","聆","脚","連","陵","陸","鹿","勞","喇","喞","嵐","廊","復","惡","温","痢","菉","菱","裂","量","隆","靓","亂","塞","廉","慄","暈","溜","溺","滑","煉","碌","祿","稜","落","葉","虜","裏","裡","賂","賈","路","酪","鈴","随","零","雷","僚","寧","屢","漏","漣","綠","綾","裸","說","領","凜","劉","寮","履","憐","戮","撚","數","樂","樓","瑩","璉","磊","練","蓮","蓼","諒","論","輦","輪","閭","隣","魯","黎","擄","曆","歷","燎","燐","璘","盧","罹","諾","遼","錄","駱","龍","龜","勵","嶺","殮","濕","濫","療","磻","縷","聯","臨","螺","鍊","隸","壘","濾","獵","禮","糧","藍","離","壟","廬","懶","櫓","簾","羅","臘","識","類","麗","爐","礪","藺","蘆","襤","醴","欄","爛","癩","蘭","蠟","露","籠","聾","讀","轢","戀","蘿","邏","鱗","麟","靈","鷺","戆","驪","鸞","兀","凞","切","嗀","塚","宅","度","﨨","廓","拓","晴","暴","洞","猪","益","礼","神","祥","福","精","糖","羽","﨑","行","見","諸","輻","逸","都","降","靖","飯","飼","館","鶴","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","󿗧","󿕅","󸾯","","岀","没","秃","劵","刴","抝","殁","畁","爲","娱","挟","眞","欵","浄","衆","歳","輰","𧗊","麽","奬","縆","駡","腟","𤖠","𦉛","隷","鲫","櫉","赢","讉","鼹","𤒿","廰","鑚","戅","朏","歩","欅","説","鐡","駡","着","脱","朶","鷄","貍","葱","嗀"];
var n = ["──","──","！","（","）","，","、","。","：","；","？","：","了","力","女","不","丹","什","六","令","北","句","立","列","劣","吏","年","老","肋","串","冷","利","卵","吝","呂","尿","弄","更","李","沈","牢","良","車","辰","里","阮","來","例","兩","刺","囹","奈","念","怜","拉","易","杻","林","泌","泥","炙","狀","秊","金","亮","便","咽","契","律","怒","孥","拾","柳","洛","流","玲","省","若","郎","陋","倫","涼","料","旅","朗","栗","浪","烈","烙","狼","珞","琉","留","紐","索","茶","豈","郎","勒","匿","參","崙","捻","掠","教","梁","梨","殺","淋","淚","淪","率","理","略","異","硫","笠","粒","累","羚","聆","腳","連","陵","陸","鹿","勞","喇","唧","嵐","廊","復","惡","溫","痢","菉","菱","裂","量","隆","靚","亂","塞","廉","慄","暈","溜","溺","滑","煉","碌","祿","稜","落","葉","虜","裏","裡","賂","賈","路","酪","鈴","隨","零","雷","僚","寧","屢","漏","漣","綠","綾","裸","說","領","凜","劉","寮","履","憐","戮","撚","數","樂","樓","瑩","璉","磊","練","蓮","蓼","諒","論","輦","輪","閭","隣","魯","黎","擄","曆","歷","燎","燐","璘","盧","罹","諾","遼","錄","駱","龍","龜","勵","嶺","殮","溼","濫","療","磻","縷","聯","臨","螺","鍊","隸","壘","濾","獵","禮","糧","藍","離","壟","廬","懶","櫓","簾","羅","臘","識","類","麗","爐","礪","藺","蘆","襤","醴","欄","爛","賴","蘭","蠟","露","籠","聾","讀","轢","戀","蘿","邏","鱗","麟","靈","鷺","戇","驪","鸞","兀","凞","切","嗀","塚","宅","度","鋅","廓","拓","晴","暴","洞","猪","益","礼","神","祥","福","精","糖","羽","崎","行","見","諸","輻","逸","都","降","靖","飯","飼","館","鶴","𫝞","𫝛","𫝏","𫝺","𫝻","𫟂","𫝙","𫟊","𪜶","𬦰","𪹚","𫝘","𫝾","𫞭","𫞻","𫞼","𫟧","𫠛","𫣆","𬑎","𬖐","𰹬","𬠖","𫝞","𫝛","𫝏","𫝺","𫝻","𰣻","𫟂","𫝙","𫟊","𱱿","𰣻","𱱿","𰹬","","出","沒","禿","券","剁","拗","歿","畀","為","娛","挾","真","欸","淨","眾","歲","暢","盡","麼","獎","緪","罵","膣","牆","罅","隸","鯽","櫥","贏","譴","鼴","㸐","廳","鑽","戇","胐","步","櫸","說","鐵","罵","著","脫","朵","雞","狸","蔥","殼"];
// 【效能】from/to 陣列不變時，對照表只建一次（逐行比對、命題會對每一行呼叫）
const _charMapCache = new WeakMap();
function replaceChars(inputString, fromChars, toChars) {
    let entry = _charMapCache.get(fromChars);
    if (!entry || entry.to !== toChars) {
        entry = { to: toChars, map: new Map(fromChars.map((char, index) => [char, toChars[index]])) };
        _charMapCache.set(fromChars, entry);
    }
    const charMap = entry.map;
    return Array.from(inputString)
                .map(char => charMap.get(char) || char)
                .join('');
}


// =====================================================================
// 詔安腔拼音寫法轉換（全程式共用，規則只在這兩個函式維護）
//   資料庫格式：零聲母／聲母+o 寫成 o；r、v 開頭不加 h/b；ji/qi/xi 寫成 zi/ci/si
//   顯示格式  ：聲母+o → oo、零聲母 o → oo；r → rh、v → bb
// =====================================================================

/**
 * 資料庫格式 → 顯示格式
 * @param {string} t
 * @param {{consonantO?:boolean, zeroInitialO?:boolean, spelling?:boolean}} [opts]
 *   consonantO  聲母+o → 聲母+oo（co → coo）
 *   zeroInitialO 零聲母 o → oo（oz → ooz，含大寫 O → Oo）
 *   spelling    r→rh、v→bb、ji→zi、qi→ci、xi→si
 *   預設三項皆開；只想補零聲母時傳 { consonantO:false, spelling:false }
 */
function kasuToDisplay(t, opts) {
    const o = Object.assign({ consonantO: true, zeroInitialO: true, spelling: true }, opts || {});
    if (o.consonantO) {
        t = t.replace(/\b([bpfvdtlgkhzcs]|zh|ch|sh|rh|bb)o([zvsx]?)\b/gi, (mt, p1, p2) => p1 + 'oo' + p2);
    }
    if (o.zeroInitialO) {
        // \b 鎖定單獨的 o，並兼容聲調字母或數字
        t = t.replace(/\bo([zvsxf1-9]?)\b/gi, (mt, p1) => (mt[0] === 'O' ? 'Oo' : 'oo') + p1);
    }
    if (o.spelling) {
        t = t
            .replace(/(\b)(r)([aeiou])/g, '$1rh$3')
            .replace(/(\b)(v)([aeiou])/g, '$1bb$3')
            .replace(/(\b)(ji)/g, '$1zi')
            .replace(/(\b)(qi)/g, '$1ci')
            .replace(/(\b)(xi)/g, '$1si');
    }
    return t;
}

/**
 * 顯示格式（或使用者輸入的各種寫法）→ 資料庫格式（已是字母調 zvsx… 的拼音）
 */
function kasuToDb(t) {
    return t
        .replace(/([bpfvdtlgkhzcsi])oo([zvsxfc]?)\b/g, '$1o$2')
        .replace(/\boo([zvsxfc]?)\b/gi, (mt, p1) => (mt[0] === 'O' ? 'O' : 'o') + p1) // 零聲母 oo → o
        .replace(/(\b)(rh)([aeiou])/g, '$1r$3')
        .replace(/(\b)(bb)([aeiou])/g, '$1v$3')
        .replace(/(\b)(ji)/g, '$1zi')
        .replace(/(\b)(qi)/g, '$1ci')
        .replace(/(\b)(xi)/g, '$1si');
}

// 【效能】辭庫查詢：Trie（字典樹）最長詞優先，取代「把全部詞接成一個超大正規表示式」。
// 只有在辭庫已依「詞長由長到短」排序時才啟用（此時與正規表示式「取第一個符合」的結果完全相同）；否則沿用正規表示式。
let pinyinTrie = null;
function buildPinyinTrie(words, map) {
    const root = { next: new Map(), end: false, py: undefined };
    for (const w of words) {
        if (!w) continue;
        let node = root;
        for (const ch of Array.from(w)) {
            let nx = node.next.get(ch);
            if (!nx) { nx = { next: new Map(), end: false, py: undefined }; node.next.set(ch, nx); }
            node = nx;
        }
        node.end = true;
        node.py = map.get(w);
    }
    return root;
}
function convertByTrie(text, trie) {
    const chars = Array.from(text), len = chars.length, out = [];
    let i = 0;
    while (i < len) {
        let node = trie, j = i, lastEnd = -1, lastNode = null;
        while (j < len) {
            node = node.next.get(chars[j]);
            if (!node) break;
            j++;
            if (node.end) { lastEnd = j; lastNode = node; }
        }
        if (lastEnd > 0) {
            out.push(lastNode.py === undefined ? chars.slice(i, lastEnd).join('') : ' ' + lastNode.py + ' ');
            i = lastEnd;
        } else {
            out.push(chars[i]);
            i++;
        }
    }
    return out.join('');
}

let pinyinMap = new Map();
let pinyinMapAll = new Map(); // 【新增】詞 → 該詞所有拼音（陣列，供「逐行比對」使用）
let masterRegex = new RegExp('');
// 【新增】辭庫是否已成功載入並建立。取代過去以 masterRegex.source === '(?:)' 判斷的做法
// （改用 Trie 後 masterRegex 不一定會建立，不能再拿它當「已載入」旗標）
let dbReady = false;

// 在載入語言資料庫後初始化或重新初始化轉換器
function initializeConverter() {
    // 檢查語言資料庫是否已成功載入並定義了 ccc 和 ddd 變數
    if (typeof ccc === 'undefined' || typeof ddd === 'undefined') {
        console.error("語言資料庫尚未載入或格式不正確。");
        // 清空規則，避免使用舊的資料
        pinyinMap = new Map();
        pinyinMapAll = new Map(); // 【新增】
        masterRegex = new RegExp('');
        pinyinTrie = null;
        dbReady = false;
        return;
    }

    // 壓縮轉換邏輯
		let txtAA = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","0","1","2","3","4","5","6","7","8","9"];
		let txtKK = ["一","人","大","不","無","好","來","會","子","有","頭","个","的","到","下","著","得","毋","去","了","這","真","水","心","家","過","做","出","事","上","生","在","天","很","多","個","小","時","要","講","麼","你","起","地","食","用","面","開","三","沒","手","打","愛","日","較","氣","行","年","學","公","想","啊"];
		let txtGG = ["一","人","大","不","無","好","來","會","子","有","頭","个","的","到","下","著","得","毋","去","了","這","真","水","心","家","過","做","出","事","上","生","在","天","很","多","個","小","時","要","講","麼","你","起","地","食","用","面","開","三","沒","手","打","愛","日","較","氣","行","年","學","公","想","啊"];
		let txtEE = ["ⓐ","ⓑ","ⓒ","ⓓ","ⓔ","ⓕ","ⓖ","ⓗ","ⓘ","ⓙ","ⓚ","ⓛ","ⓜ","ⓝ","ⓞ","ⓟ","ⓠ","ⓡ","ⓢ","ⓣ","ⓤ","ⓥ","ⓦ","ⓧ","ⓨ","ⓩ","Ⓐ","Ⓑ","Ⓒ","Ⓓ","Ⓔ","Ⓕ","Ⓖ","Ⓗ","Ⓘ","Ⓙ","Ⓚ","Ⓛ","Ⓜ","Ⓝ","Ⓞ","Ⓟ","Ⓠ","Ⓡ","Ⓢ","Ⓣ","Ⓤ","Ⓥ","Ⓦ","Ⓧ","Ⓨ","Ⓩ","⓪","①","②","③","④","⑤","⑥","⑦","⑧","⑨"];
    
    // 使用從新載入的資料庫檔案中取得的 ccc 和 ddd
    let processed_ccc = replaceChars(ccc, txtAA, txtKK);
    processed_ccc = replaceChars(processed_ccc, txtEE, txtAA);
    let c = processed_ccc.split("_");
    let d = ddd.split("_");

    // 重新建立一個全新的 pinyinMap
    const newPinyinMap = new Map();
    const newPinyinMapAll = new Map(); // 【新增】同一個詞的所有拼音
    const uniqueWords = [];
    const cLen = c.length;
    for (let i = 0; i < cLen; i++) {
        if (!newPinyinMap.has(c[i])) {
            newPinyinMap.set(c[i], d[i]);
            uniqueWords.push(c[i]);
        }
        // 【新增】收集同一個詞的全部拼音（去除重複）
        if (!newPinyinMapAll.has(c[i])) newPinyinMapAll.set(c[i], []);
        const arr = newPinyinMapAll.get(c[i]);
        if (d[i] !== undefined && !arr.includes(d[i])) arr.push(d[i]);
    }
    
    // 將新建立的地圖賦值給全域變數
    pinyinMap = newPinyinMap;
    pinyinMapAll = newPinyinMapAll; // 【新增】

    // 【效能】辭庫已依長度由長到短排序 → 改用 Trie；否則沿用正規表示式（行為不變）
    let sortedByLen = true;
    for (let i = 1; i < uniqueWords.length; i++) {
        if (uniqueWords[i].length > uniqueWords[i - 1].length) { sortedByLen = false; break; }
    }
    pinyinTrie = sortedByLen ? buildPinyinTrie(uniqueWords, newPinyinMap) : null;

    // 【效能】使用 Trie 時完全不會用到 masterRegex，不必 escape 全部詞、join、編譯正規表示式；
    // 只有辭庫未排序、退回正規表示式比對時才建立。
    if (pinyinTrie) {
        masterRegex = new RegExp('');
    } else {
        const escapedWords = uniqueWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        masterRegex = new RegExp(escapedWords.join('|'), 'g');
    }
    dbReady = uniqueWords.some(w => w !== '');   // 全空辭庫視為未載入（與舊行為一致）
    console.info(sortedByLen ? '辭庫查詢：使用 Trie 加速' : '辭庫查詢：辭庫未依詞長排序，沿用正規表示式');
    
    window.pinyinMap = pinyinMap; 
}

// 【新增】從 hanziToPinyin 抽出：依目前語言將拼音轉成顯示格式（原邏輯不變）
function formatPinyinByLanguage(outputText, mode) {
    // 根據當前語言，先將拼音轉換為字母調 (zvs) 格式

    const hakkaLanguages = new Set(['sixian', 'hailu', 'dapu', 'raoping', 'sixiannan']);
    
    if (hakkaLanguages.has(currentLanguageKey)) {
        // outputText = hakkaToneToZvs(outputText); // 原本邏輯不變
    } 
    else if (currentLanguageKey === 'kasu') {
        if (mode === 'raw') {			
            // --- 模式：原始拼音 ---
            if (typeof hakkaToneToZvs === 'function') {
                outputText = hakkaToneToZvs(outputText);
            }
        } else {
            // --- 模式：預設 (變形處理) ---
            outputText = outputText
                .replace(/([a-z]{0,4})([mngbdgaeiou])([zvsxc])([zvsxfc])/g, '$1$2$3')
                .replace(/([a-z]{0,4})([mngbdgaeiou])([cf])/g, '$1$2')
                .replace(/([aeioumngbdzvsxfc])(=)([a-z])/g, '$1 $3')
                .replace(/([aeioumngbdzvsxfc])(--)([a-z])/g, '$1 $3')
                .replace(/([aeioumngbdzvsxfc])(-)([a-z])/g, '$1 $3');
            // 詔安腔拼音寫法（資料庫格式 → 顯示格式）：這裡不含零聲母 o→oo（由後面的流程處理）
            outputText = kasuToDisplay(outputText, { zeroInitialO: false });

            outputText = zxvToTone(outputText);
        }
    } else if (currentLanguageKey === 'holo') {		
		//outputText = holoPojToTailo(outputText);
        //outputText = holoPinyinZvs(outputText);
    } else if (currentLanguageKey === 'jinmen') {		
		//outputText = holoPojToTailo(outputText);
        //outputText = holoPinyinZvs(outputText);
    } else if (currentLanguageKey === 'matsu') {
        //outputText = matsuPinyinZvs(outputText);
    }

    return outputText;
}

function hanziToPinyin(mode) {
    const hanziInput = document.getElementById('hanziInput');
    const pinyinInput = document.getElementById('pinyinInput');
    const sourceText = hanziInput.value;

    // 檢查辭庫是否已載入，以防資料庫載入失敗
    if (!dbReady) {
        pinyinInput.value = "錯誤：請先選擇一個有效的語言。";
        return;
    }

	const normalizedText = replaceChars(sourceText, m, n);


    // -----------------------------------------------------------
    // 1：保護原始空格與 Tab
    // -----------------------------------------------------------
    const spaceMarker = '\u001F';
    const tabMarker = '\u001E'; // 新增 Tab 保護標記
    
    // 同時保護空格與 Tab
    const textToConvert = normalizedText.replace(/ /g, spaceMarker).replace(/\t/g, tabMarker);

    // 注意：這裡改成使用 textToConvert 來進行轉換
    const pinyinText = pinyinTrie
        ? convertByTrie(textToConvert, pinyinTrie)
        : textToConvert.replace(masterRegex, (matchedWord) => {
            const pinyin = pinyinMap.get(matchedWord);
            if (pinyin === undefined) {
                return matchedWord;
            }
            return ' ' + pinyin + ' ';
        });

    const lines = pinyinText.split('\n');
    
    // -----------------------------------------------------------
    // 2：還原空格與 Tab 並處理間距
    // -----------------------------------------------------------
    const processedLines = lines.map(line => {
        // 【修正】將 \s+ 改為 / +/，只壓縮普通空格，避免誤傷 Tab 
        let processed = line.replace(/ +/g, ' ').trim();
        processed = processed.replace(new RegExp(` ${spaceMarker} `, 'g'), '  ');
        processed = processed.replace(new RegExp(spaceMarker, 'g'), ' ');
        processed = processed.replace(new RegExp(tabMarker, 'g'), '\t'); // 還原 Tab
        
        return processed;
    });
    
    
    // 3. 將處理過的各行用換行符重新組合成最終文本
    let outputText = processedLines.join('\n');

    // 移除所有標點符號「前」的空格
    outputText = outputText.replace(/[ \t]+([，。、；：！？（）「」『』《》〈〉—…－‧·﹑,.;:!?()\[\]{}\"\'\-\…])/g, '$1');

    // 移除所有標點符號「後」的空格
    outputText = outputText.replace(/([，。、；：！？（）「」『』《》〈〉—…－‧·﹑,.;:!?()\[\]{}\"\'\-\…])[ \t]+/g, '$1');


    // 【修改】語言專屬的拼音轉換，抽成 formatPinyinByLanguage()，讓「逐行比對」共用
    outputText = formatPinyinByLanguage(outputText, mode);

    // -----------------------------------------------------------
    // 處理「字〔yin〕」模式
    // -----------------------------------------------------------
    if (mode === 'bracket') {
        // 1. 取得原始漢字（按行切割）
        const sourceLines = sourceText.split('\n');
        // 2. 取得剛剛算好的拼音（按行切割）
        const pinyinLines = outputText.split('\n');
        
        const combined = [];
        const len = Math.max(sourceLines.length, pinyinLines.length);

        for (let i = 0; i < len; i++) {
            // 去除頭尾空白，避免對齊問題
            const h = (sourceLines[i] || '').trim(); 
            let p = (pinyinLines[i] || '').trim();

            if (h) {
                // 如果拼音跟漢字一樣（代表沒轉換成功或是標點），或者拼音是空的
                // 就只顯示漢字，不要顯示空的括號
                if (!p || p === h) {
                    combined.push(h);
                } else {
                    // 格式：漢字〔拼音〕
                    combined.push(`${h}〔${p}〕`);
                }
            } else {
                combined.push(''); // 保留空行
            }
        }
        outputText = combined.join('\n');
    }

    pinyinInput.value = outputText;
}



function zxvToTone(t) {
    t = t.replace(/([a-z]{0,4})([mngbdgaeiou])(z)/gi, '$1$2ˊ');
    t = t.replace(/([a-z]{0,4})([mngbdgaeiou])(x)/gi, '$1$2ˆ');
    t = t.replace(/([a-z]{0,4})([mngbdgaeiou])(v)/gi, '$1$2ˇ');
    t = t.replace(/([a-z]{0,4})([mngbdgaeiou])(s)/gi, '$1$2ˋ');
    t = t.replace(/([a-z]{0,4})([mngbdgaeiou])(f)/gi, '$1$2⁺');
    t = t.replace(/([a-z]{0,4})([mngbdgaeiou])(c)/gi, '$1$2');
	return t;
}