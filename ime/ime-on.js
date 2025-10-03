document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const configFromUrl = {};
    let shouldAutoEnable = false;

    // 優先檢查 'ime' 參數是否存在
    if (params.has('ime')) {
        const imeParam = params.get('ime');
        const parts = imeParam.split('-');

        // --- 新格式解析: 1-kasu-110112 (parts.length === 3) ---
        if (parts.length === 3) {
            shouldAutoEnable = parts[0] === '1';
            configFromUrl.defaultMode = parts[1];
            
            const settingsCode = parts[2];
            // 順序: prediction, tonemode, longphrase, fullwidth, output_enabled, ime-output
            if (settingsCode.length >= 1) configFromUrl.enablePrediction = settingsCode[0] === '1';
            if (settingsCode.length >= 2) configFromUrl.initialToneMode = settingsCode[1] === '1' ? 'alphabetic' : 'numeric';
            if (settingsCode.length >= 3) configFromUrl.longPhrase = settingsCode[2] === '1';
            if (settingsCode.length >= 4) configFromUrl.initialFullWidth = settingsCode[3] === '1';
            if (settingsCode.length >= 5) {
                const isOutputEnabled = settingsCode[4] === '1';
                configFromUrl.outputEnabled = isOutputEnabled;
                if (isOutputEnabled && settingsCode.length >= 6) {
                    if (settingsCode[5] === '1') configFromUrl.outputMode = 'pinyin';
                    else if (settingsCode[5] === '2') configFromUrl.outputMode = 'word_pinyin';
                }
            }
        } 
        // --- 上一版短格式解析 (向下相容) ---
        else if (parts.length > 3) {
            shouldAutoEnable = true; // 舊格式預設為啟用
            configFromUrl.defaultMode = parts[0];
            if (parts.length > 1) configFromUrl.enablePrediction = parts[1] === '1';
            if (parts.length > 2) configFromUrl.initialToneMode = parts[2] === '1' ? 'alphabetic' : 'numeric';
            // ... 可繼續擴充對舊格式的支援
        }
        // --- 僅語言的長格式 ---
        else {
            configFromUrl.defaultMode = imeParam;
        }
    }

    // 為了完全向下相容，檢查舊的 'ime-enabled' 參數
    // 如果 'ime' 參數不存在，或 'ime' 參數中未指定啟用狀態 (如舊格式)
    if (params.get('ime-enabled') === 'true') {
        shouldAutoEnable = true;
    } else if (params.get('ime-enabled') === 'false') {
        shouldAutoEnable = false;
    }
    
    // 如果確定不啟用，則直接結束
    if (!shouldAutoEnable) {
        console.log("WebIME initialization skipped.");
        return;
    }

    // 為了向下相容，仍然讀取舊的長格式參數 (如果短格式中未設定的話)
    if (!configFromUrl.hasOwnProperty('enablePrediction') && params.has('prediction')) {
        configFromUrl.enablePrediction = params.get('prediction') === 'true';
    }
    if (!configFromUrl.hasOwnProperty('initialToneMode') && params.has('tonemode')) {
        configFromUrl.initialToneMode = params.get('tonemode');
    }
    if (!configFromUrl.hasOwnProperty('longPhrase') && params.has('longphrase')) {
        configFromUrl.longPhrase = params.get('longphrase') === 'true';
    }
    if (!configFromUrl.hasOwnProperty('initialFullWidth') && params.has('fullwidth')) {
        configFromUrl.initialFullWidth = params.get('fullwidth') === 'true';
    }
    if (!configFromUrl.hasOwnProperty('outputMode') && params.has('ime-output')) {
        const outputMode = params.get('ime-output');
        if (['pinyin', 'word_pinyin', 'word'].includes(outputMode)) {
            configFromUrl.outputMode = outputMode;
            configFromUrl.outputEnabled = true; 
        }
    }
    if (!configFromUrl.hasOwnProperty('outputEnabled') && params.has('output_enabled')) {
         configFromUrl.outputEnabled = params.get('output_enabled') === 'true';
    }

    WebIME.init({
        ...configFromUrl,
        candidatesPerPage: 5
    });
});