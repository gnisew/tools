document.addEventListener('DOMContentLoaded', () => {
    // 建立一個 URLSearchParams 物件來解析網址後面的參數
    const params = new URLSearchParams(window.location.search);

    // 檢查 'ime-enabled' 參數。如果設為 'false'，則完全不初始化輸入法
    if (params.get('ime-enabled') === 'false') {
        console.log("WebIME initialization skipped due to URL parameter 'ime-enabled=false'.");
        return; // 直接結束，不執行後續的 init
    }

    // 建立一個設定物件，用來收集 URL 中的所有參數
    const configFromUrl = {};

    // 1. 語言設定 (ime)
    if (params.has('ime')) {
        configFromUrl.defaultMode = params.get('ime');
    }

    // 2. 聯想詞功能 (prediction)
    if (params.has('prediction')) {
        configFromUrl.enablePrediction = params.get('prediction') === 'true';
    }

    // 3. 聲調輸入模式 (tonemode)
    if (params.has('tonemode')) {
        // 只能是 'numeric' 或 'alphabetic'
        const toneMode = params.get('tonemode');
        if (toneMode === 'numeric' || toneMode === 'alphabetic') {
            configFromUrl.initialToneMode = toneMode;
        }
    }

    // 4. 長詞連打 (longphrase)
    if (params.has('longphrase')) {
        configFromUrl.longPhrase = params.get('longphrase') === 'true';
    }

    // 5. 全形/半形標點 (fullwidth)
    if (params.has('fullwidth')) {
        configFromUrl.initialFullWidth = params.get('fullwidth') === 'true';
    }

    // 6. 輸出字音模式 (ime-output)
    // 範例: ?ime-output=pinyin 或 ?ime-output=word_pinyin
    if (params.has('ime-output')) {
        const outputMode = params.get('ime-output');
        // 檢查是否為合法的值
        if (['pinyin', 'word_pinyin', 'word'].includes(outputMode)) {
            configFromUrl.outputMode = outputMode;
            // 如果設定了輸出模式，代表此功能也應該要啟用
            configFromUrl.outputEnabled = true; 
        }
    }
    
    // 7. 是否啟用輸出字音功能 (output_enabled)
    // 此參數可獨立控制功能開關，即使沒有指定 ime-output 模式
    // 範例: ?output_enabled=true
    if (params.has('output_enabled')) {
         configFromUrl.outputEnabled = params.get('output_enabled') === 'true';
    }


    // 最後，呼叫 WebIME.init() 並傳入我們從 URL 收集到的設定
    WebIME.init({
        // 傳入從 URL 解析而來的設定
        ...configFromUrl,

        // 保留不想被 URL 覆蓋的預設值
        candidatesPerPage: 5
    });
});