// =========================================================================
// 🥷 烏衣行翻譯系統 - 核心語法引擎 (Grammar Engine)
// 包含：語法規則庫、AI 句法分析器、語句重組器
// =========================================================================

// =========================================================================
// 🟢 【第一區：經常修改的資料與規則設定】 (開放給語言專家編輯)
// =========================================================================

// 1. 語法轉換規則表 (TSV 格式，可直接從 Excel 貼上)
const rawRulesData = `
語言群組 (langGroup)	規則代碼 (id)	規則名稱 (name)	觸發關鍵字 (trigger)	例外排除 (exceptions)	AI任務 (aiTask)	重組範本 (template)
all	rule_tell	告訴句型 (客語共用)	告訴	告訴乃論	DITRANSITIVE	{主詞}把{受詞1}講{受詞2}
all	rule_compare	比較句型	比	比較, 比例, 比賽, 相比, 評比, 無比	COMPARATIVE	{主體}比{比較對象}較{狀態}
all	rule_passive	被動句補足對象	被	被單, 被子, 棉被, 植被	PASSIVE_AGENT_FIX	{受動者}被{補字}{主動者}{動作}
`;

// 2. 句法冗詞清理字典 (自動處理重組後產生的華語疊字或冗詞)
const cleanupDict = {
    "較還要": "更加",
    "較比較": "較",
    "較還": "較",
    "較更": "較"
};

// =========================================================================
// 🟡 【第二區：核心邏輯與演算法】 (如非架構升級，請勿隨意修改)
// =========================================================================

/**
 * [模組 A] AI 分析器：負責將句子切割成具有意義的語塊 (Components)
 */
function analyzeSentence(sentence, aiTask, triggerWord) {
    let components = {};
    const punctuation = sentence.match(/[。！？\n，、]+$/)?.[0] || "";
    const cleanSentence = sentence.replace(/[。！？\n，、]+$/, '');

    // 1. 雙賓語 / 單受詞句型
    if (aiTask === 'DITRANSITIVE' || aiTask === 'SVO_CHUNKER') { 
        const idx = cleanSentence.indexOf(triggerWord);
        if (idx !== -1) {
            components.subject = cleanSentence.substring(0, idx); 
            components.verb = triggerWord; 
            
            const remainder = cleanSentence.substring(idx + triggerWord.length); 
            const splitIdx = remainder.search(/(這|那|一|什)/);
            
            if (aiTask === 'DITRANSITIVE' && splitIdx > 0) {
                components.object1 = remainder.substring(0, splitIdx); 
                components.object2 = remainder.substring(splitIdx);    
            } else {
                components.object1 = remainder; 
                components.object2 = "";        
            }
        }
    } 
    // 2. 處置與被動句型 (保留備用)
    else if (aiTask === 'DISPOSAL_PASSIVE') {
        const idx = cleanSentence.indexOf(triggerWord);
        if (idx !== -1) {
            components.agent = cleanSentence.substring(0, idx);
            const tailLen = 2; 
            if (cleanSentence.length - tailLen > idx + triggerWord.length) {
                components.patient = cleanSentence.substring(idx + triggerWord.length, cleanSentence.length - tailLen);
                components.action = cleanSentence.substring(cleanSentence.length - tailLen);
            } else {
                components.patient = cleanSentence.substring(idx + triggerWord.length);
                components.action = "";
            }
        }
    }
    // 3. 比較句型
    else if (aiTask === 'COMPARATIVE') {
        const idx = cleanSentence.indexOf(triggerWord);
        if (idx !== -1) {
            components.subject = cleanSentence.substring(0, idx);
            const remainder = cleanSentence.substring(idx + triggerWord.length); 
            const stateStartIdx = remainder.search(/(還要|更|還|非常|特別|真|極)/);
            
            if (stateStartIdx > 0) {
                components.target = remainder.substring(0, stateStartIdx); 
                components.state = remainder.substring(stateStartIdx);     
            } else {
                const compareMatch = remainder.match(/^(我|你|妳|您|他|她|大家|別人|小明|很多人|所有人|某些人|這[個件台本張顆群]|那[個件台本張顆群]|昨天|以前|今日|今天|現在)(.*)$/);
                if (compareMatch) {
                    components.target = compareMatch[1];
                    components.state = compareMatch[2];
                } else {
                    components.target = remainder.substring(0, 2); 
                    components.state = remainder.substring(2);
                }
            }
        }
    }
    // 4. 【新增】被動句型 (採用動作攔截邏輯：只有遇到「動作」才補人，其餘不放行！)
    else if (aiTask === 'PASSIVE_AGENT_FIX') {
        const idx = cleanSentence.indexOf(triggerWord);
        if (idx !== -1) {
            components.patient = cleanSentence.substring(0, idx);
            const remainder = cleanSentence.substring(idx + triggerWord.length); 

            // 💡 您的反向神邏輯：只抓「動作」！
            // Group 1: 容忍前面帶有副詞 (如：狠狠地、無情地、已經、就)
            // Group 2: 常見的省略對象動詞 (您隨時可以在這裡新增動作)
            const isActionMatch = remainder.match(/^([^，。、]*(地|的)|很|非常|都|就|還|已經|又|剛|才|快)?(欺負|騙|打|罵|抓|發現|逼|迫|笑|取笑|揍|殺|咬|看見|打倒|當成|拒絕|開除|退學|罰|坑)(.*)$/);

            if (isActionMatch) {
                // 情境 A：被 + 動作 (例如 "被[狠狠地][打倒]") -> 缺對象，強制補「人」！
                components.inserted = "人";
                components.agent = "";
                components.action = remainder; 
            } else {
                // -> 視為已有主動者，不補字，原封不動送出！
                components.inserted = "";
                components.agent = remainder; 
                components.action = "";
            }
        }
    }


    components.punctuation = punctuation;
    return components;
}

/**
 * [模組 B] 語法重組器：負責將 AI 切割的語塊，填入客語範本中
 */
const ReorderStrategies = {
    "DITRANSITIVE": (template, aiResult) => {
        let result = template.replace("{主詞}", aiResult.subject || "")
                             .replace("{動詞}", aiResult.verb || "")
                             .replace("{受詞1}", aiResult.object1 || "");
        if (result.includes("{受詞2}")) result = result.replace("{受詞2}", aiResult.object2 || "");
        return result;
    },
    "SVO_CHUNKER": function(template, aiResult) { return ReorderStrategies["DITRANSITIVE"](template, aiResult); },
    "DISPOSAL_PASSIVE": (template, aiResult) => {
        return template.replace("{主動者}", aiResult.agent || "")
                       .replace("{受動者}", aiResult.patient || "")
                       .replace("{動作}", aiResult.action || "");
    },
    "COMPARATIVE": (template, aiResult) => {
        return template.replace("{主體}", aiResult.subject || "")
                       .replace("{比較對象}", aiResult.target || "")
                       .replace("{狀態}", aiResult.state || "");
    },
    // 【新增】被動句補足範本替換
    "PASSIVE_AGENT_FIX": (template, aiResult) => {
        return template.replace("{受動者}", aiResult.patient || "")
                       .replace("{補字}", aiResult.inserted || "")
                       .replace("{主動者}", aiResult.agent || "")
                       .replace("{動作}", aiResult.action || "");
    }
};

function executeReorder(template, aiTask, aiResult) {
    if (!aiResult) return template;
    const strategy = ReorderStrategies[aiTask];
    let processedString = template;

    if (typeof strategy === 'function') {
        processedString = strategy(template, aiResult);
    } else {
        console.warn(`[引擎警告] 尚未定義此 AI 任務的處理邏輯: ${aiTask}`);
        return template;
    }

    // 執行全域冗詞清理 (依字數長度安全替換)
    const sortedKeys = Object.keys(cleanupDict).sort((a, b) => b.length - a.length);
    sortedKeys.forEach(key => {
        processedString = processedString.replace(new RegExp(key, 'g'), cleanupDict[key]);
    });

    return processedString.trim().replace(/\s+/g, '');
}

// =========================================================================
// 🔵 【第三區：系統初始化與對外接口】 (供主程式 script.js 呼叫)
// =========================================================================

let grammarRules = {}; 

function initializeGrammarRules() {
    const lines = rawRulesData.trim().split(/\r?\n/);
    if (lines.length <= 1) return;

    const headers = lines[0].split('\t').map(h => h.trim());
    
    for (let i = 1; i < lines.length; i++) {
        const rowStr = lines[i].trim();
        if (!rowStr) continue;

        const values = rowStr.split('\t');
        let rowData = {};
        headers.forEach((header, index) => {
            rowData[header] = values[index] ? values[index].trim() : "";
        });

        const langGroup = rowData['語言群組 (langGroup)'];
        if (!langGroup) continue; 

        if (!grammarRules[langGroup]) grammarRules[langGroup] = [];

        const exceptionStr = rowData['例外排除 (exceptions)'];
        const exceptions = exceptionStr ? exceptionStr.split(',').map(s => s.trim()).filter(s => s) : [];

        grammarRules[langGroup].push({
            id: rowData['規則代碼 (id)'],
            name: rowData['規則名稱 (name)'],
            triggerRegex: new RegExp(rowData['觸發關鍵字 (trigger)'], 'g'),
            exceptions: exceptions,
            aiTask: rowData['AI任務 (aiTask)'],
            template: rowData['重組範本 (template)']
        });
    }
    console.log("[語法引擎] 資料解析就緒！", grammarRules);
}

function getActiveRulesForLanguage(targetLang) {
    let activeRules = [];
    if (grammarRules['all']) {
        activeRules = activeRules.concat(grammarRules['all']);
    }
    if (grammarRules[targetLang]) {
        activeRules = activeRules.concat(grammarRules[targetLang]);
    }
    return activeRules;
}

initializeGrammarRules();
window.getActiveRulesForLanguage = getActiveRulesForLanguage;
window.analyzeSentence = analyzeSentence;
window.executeReorder = executeReorder;