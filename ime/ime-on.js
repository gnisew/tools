document.addEventListener('DOMContentLoaded', () => {
    // --- 【全新修改】---
    // 1. 全面解析 URL 參數，產生一個給 imeInit 使用的設定物件
    const params = new URLSearchParams(window.location.search);
    const configFromUrl = {};
    let paramsWereUsed = false;
    let shouldAutoEnable = true; // ime-on.js 預設為自動啟用

    // 優先處理短參數格式 ?ime=1-kasu-101112
    if (params.has('ime') && params.get('ime').includes('-')) {
        paramsWereUsed = true;
        const imeParam = params.get('ime');
        const parts = imeParam.split('-');

        if (parts.length === 3) {
            // 短參數中的 '0' 仍然可以關閉自動啟用
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
        }
    } else {
        // 如果沒有短參數，則處理長參數格式
        // 獨立的啟用參數仍可覆寫預設值
        if (params.has('ime-enabled')) {
            paramsWereUsed = true;
            shouldAutoEnable = params.get('ime-enabled') === 'true';
        }
        if (params.has('ime')) {
            paramsWereUsed = true;
            configFromUrl.defaultMode = params.get('ime');
        }
        if (params.has('prediction')) {
            paramsWereUsed = true;
            configFromUrl.enablePrediction = params.get('prediction') === 'true';
        }
        if (params.has('tonemode')) {
            paramsWereUsed = true;
            const toneMode = params.get('tonemode');
            if (toneMode === 'numeric' || toneMode === 'alphabetic') {
                configFromUrl.initialToneMode = toneMode;
            }
        }
        if (params.has('longphrase')) {
            paramsWereUsed = true;
            configFromUrl.longPhrase = params.get('longphrase') === 'true';
        }
        if (params.has('fullwidth')) {
            paramsWereUsed = true;
            configFromUrl.initialFullWidth = params.get('fullwidth') === 'true';
        }
        if (params.has('output_enabled')) {
            paramsWereUsed = true;
            configFromUrl.outputEnabled = params.get('output_enabled') === 'true';
        }
        // ime-output 同時設定 outputMode 並啟用輸出功能
        if (params.has('ime-output')) {
            paramsWereUsed = true;
            configFromUrl.outputEnabled = true;
            const outputMode = params.get('ime-output');
            if (['pinyin', 'word_pinyin', 'word_pinyin2'].includes(outputMode)) {
                 configFromUrl.outputMode = outputMode;
            }
        }
    }

    // 2. 根據判斷結果，呼叫初始化
    if (shouldAutoEnable) {
        // [核心] 將從 URL 解析出來的設定物件傳遞給 imeInit
        // imeInit 內部會處理優先級
        WebIME.imeInit(configFromUrl);

        if (paramsWereUsed) {
            const newUrl = new URL(window.location.href);
            // 刪除所有已處理過的參數，避免重新整理時重複套用
            const allParams = ['ime', 'ime-enabled', 'prediction', 'tonemode', 'longphrase', 'fullwidth', 'output_enabled', 'ime-output'];
            allParams.forEach(p => newUrl.searchParams.delete(p));
            window.history.replaceState({}, document.title, newUrl.href);
        }
    }
});
