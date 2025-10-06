document.addEventListener('DOMContentLoaded', () => {
    // 1. 解析 URL 參數，產生一個給 imeInit 使用的設定物件
    const params = new URLSearchParams(window.location.search);
    const configFromUrl = {};
    let shouldAutoEnable = true; // 此檔案預設就是要啟用
    let paramsWereUsed = false;  // 標記是否使用了 URL 參數

    if (params.has('ime')) {
        paramsWereUsed = true;
        const imeParam = params.get('ime');
        const parts = imeParam.split('-');

        if (parts.length === 3) {
            // 即使此檔案預設啟用，URL 參數中的 '0' 仍可將其關閉
            shouldAutoEnable = parts[0] === '1';
            configFromUrl.defaultMode = parts[1];
            const settingsCode = parts[2];

            if (settingsCode.length >= 1) configFromUrl.enablePrediction = (settingsCode[0] === '1');
            if (settingsCode.length >= 2) configFromUrl.initialToneMode = (settingsCode[1] === '1') ? 'alphabetic' : 'numeric';
            if (settingsCode.length >= 3) configFromUrl.longPhrase = (settingsCode[2] === '1');
            if (settingsCode.length >= 4) configFromUrl.initialFullWidth = (settingsCode[3] === '1');
            
            if (settingsCode.length >= 5) {
                configFromUrl.outputEnabled = (settingsCode[4] === '1');
                if (settingsCode.length >= 6) {
                    switch(settingsCode[5]) {
                        case '1': configFromUrl.outputMode = 'pinyin'; break;
                        case '2': configFromUrl.outputMode = 'word_pinyin'; break;
                        case '3': configFromUrl.outputMode = 'word_pinyin2'; break;
                        default: configFromUrl.outputMode = 'word'; break;
                    }
                }
            }
        } else {
            // 相容舊格式或簡單格式
            shouldAutoEnable = true;
            configFromUrl.defaultMode = imeParam;
        }
    }

    // 獨立的啟用參數仍可覆寫
    if (params.has('ime-enabled')) {
        paramsWereUsed = true;
        shouldAutoEnable = params.get('ime-enabled') === 'true';
    }

    // 2. 根據判斷結果，呼叫初始化
    if (shouldAutoEnable) {
        // [核心] 將從 URL 解析出來的設定物件傳遞給 imeInit
        // imeInit 內部會處理優先級
        WebIME.imeInit(configFromUrl);

        if (paramsWereUsed) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('ime');
            newUrl.searchParams.delete('ime-enabled');
            window.history.replaceState({}, document.title, newUrl.href);
        }
    }
});