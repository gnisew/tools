/**
 * 動態注入 IME 切換按鈕所需的 CSS 樣式到 <head>。
 */
function injectImeButtonStyles() {
    const styleId = 'ime-toggle-button-styles';
    if (document.getElementById(styleId)) {
        return;
    }
    const css = `
		.ime-toggle-button {
		    display: inline-flex;
		    align-items: center;
		    justify-content: center;
		    cursor: pointer;
		    transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
		    color: #5f6368;
		    outline: none;
		}
		.ime-toggle-button.ime-active {
		    background-color: #e8f0fe;
		    color: #1a73e8;
		}
		.ime-toggle-button.ime-active:hover {
		    background-color: #d2e3fc;
		    color: #1C73C8;
		}
    `;
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.innerHTML = css;
    document.head.appendChild(styleElement);
}


document.addEventListener('DOMContentLoaded', () => {
	injectImeButtonStyles();

    const toggleButtons = document.querySelectorAll('.ime-toggle-button');
    if (toggleButtons.length === 0) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const configFromUrl = {};
    let shouldAutoEnable = false;

    // --- 更新：與 ime-on.js 相同的解碼邏輯 ---
    if (params.has('ime')) {
        const imeParam = params.get('ime');
        const parts = imeParam.split('-');

        if (parts.length === 3) {
            shouldAutoEnable = parts[0] === '1';
            configFromUrl.defaultMode = parts[1];
            const settingsCode = parts[2];
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
        } else if (parts.length > 3) {
            shouldAutoEnable = true;
            configFromUrl.defaultMode = parts[0];
        } else {
            configFromUrl.defaultMode = imeParam;
        }
    }
    
    if (params.get('ime-enabled') === 'true') {
        shouldAutoEnable = true;
    } else if (params.get('ime-enabled') === 'false') {
        shouldAutoEnable = false;
    }

    // (向下相容的長格式參數讀取)
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
        configFromUrl.outputMode = params.get('ime-output');
        configFromUrl.outputEnabled = true;
    }
    if (!configFromUrl.hasOwnProperty('outputEnabled') && params.has('output_enabled')) {
         configFromUrl.outputEnabled = params.get('output_enabled') === 'true';
    }


    function syncAllToggleButtonsUI(isActive) {
        toggleButtons.forEach(button => {
            const iconSpan = button.querySelector('.material-icons');
            if (isActive) {
                iconSpan.textContent = 'keyboard_hide';
                button.title = '停用烏衣行輸入法';
                button.classList.add('ime-active');
            } else {
                iconSpan.textContent = 'keyboard';
                button.title = '啟用烏衣行輸入法';
                button.classList.remove('ime-active');
            }
        });
    }

    if (shouldAutoEnable) {
        const baseConfig = { defaultMode: 'sixian', candidatesPerPage: 5 };
        const finalConfig = { ...baseConfig, ...configFromUrl };
        WebIME.init(finalConfig);
    }

    syncAllToggleButtonsUI(WebIME.isInitialized);

    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (WebIME.isInitialized) {
                WebIME.destroy();
            } else {
                const baseConfig = { defaultMode: 'sixian', candidatesPerPage: 5 };
                const finalConfig = { ...baseConfig, ...configFromUrl };
                WebIME.init(finalConfig);
            }
            syncAllToggleButtonsUI(WebIME.isInitialized);
        });
    });
});