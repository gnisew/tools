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
		    display: inline-flex; align-items: center; justify-content: center;
		    cursor: pointer; transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
		    color: #5f6368; outline: none;
		}
		.ime-toggle-button.ime-active { background-color: #e8f0fe; color: #1a73e8; }
		.ime-toggle-button.ime-active:hover { background-color: #d2e3fc; color: #1C73C8; }
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
        return; // 如果頁面上沒有按鈕，就不用繼續執行
    }

    const params = new URLSearchParams(window.location.search);
    const configFromUrl = {};
    let paramsWereUsed = false;
    let shouldAutoEnable = false;

    // --- 【邏輯修正】---
    // 優先處理短參數格式 ?ime=1-kasu-101112
    if (params.has('ime') && params.get('ime').includes('-')) {
        paramsWereUsed = true;
        const imeParam = params.get('ime');
        const parts = imeParam.split('-');
        
        if (parts.length === 3) {
            shouldAutoEnable = parts[0] === '1';
            configFromUrl.defaultMode = parts[1];
            const settingsCode = parts[2];

            if (settingsCode.length >= 1) configFromUrl.enablePrediction = (settingsCode[0] === '1');
            if (settingsCode.length >= 2) configFromUrl.initialToneMode = (settingsCode[1] === '1') ? 'alphabetic' : 'numeric';
            if (settingsCode.length >= 3) configFromUrl.longPhrase = (settingsCode[2] === '1');
            if (settingsCode.length >= 4) configFromUrl.initialFullWidth = (settingsCode[3] === '1');
            
            // 第5位元：決定「輸出字音」功能是否預設為啟用
            if (settingsCode.length >= 5) {
                configFromUrl.outputEnabled = (settingsCode[4] === '1');
                
                // 第6位元：決定「輸出字音」按鈕是否顯示，並設定模式
                if (settingsCode.length >= 6) {
                    const outputModeCode = settingsCode[5];
                    if (!configFromUrl.toolbarButtons) configFromUrl.toolbarButtons = {};

                    if (outputModeCode === '0') {
                        // 若為 0，則強制隱藏按鈕
                        configFromUrl.toolbarButtons.outputModeToggle = false;
                    } else {
                        // 若為 1, 2, 3，則強制顯示按鈕，並設定模式
                        configFromUrl.toolbarButtons.outputModeToggle = true;
                        switch(outputModeCode) {
                            case '1': configFromUrl.outputMode = 'pinyin'; break;
                            case '2': configFromUrl.outputMode = 'word_pinyin'; break;
                            case '3': configFromUrl.outputMode = 'word_pinyin2'; break;
                        }
                    }
                }
            }
        }
    } else {
        // 如果沒有短參數，則處理長參數格式
        if (params.has('ime-enabled')) {
            paramsWereUsed = true;
            shouldAutoEnable = params.get('ime-enabled') === 'true';
        }
        if (params.has('ime')) {
            paramsWereUsed = true;
            configFromUrl.defaultMode = params.get('ime');
            if (!params.has('ime-enabled')) {
                shouldAutoEnable = true;
            }
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
        if (params.has('ime-output')) {
            paramsWereUsed = true;
            configFromUrl.outputEnabled = true;
            const outputMode = params.get('ime-output');
            if (['pinyin', 'word_pinyin', 'word_pinyin2'].includes(outputMode)) {
                 configFromUrl.outputMode = outputMode;
            }
        }
    }

	/**
	 * 負責同步所有相關 UI 的狀態，包含按鈕圖示和外部工具列。
	 */
	function syncAllToggleButtonsUI() {
		const isActive = typeof WebIME !== 'undefined' && WebIME.isInitialized;
		const externalToolbar = document.getElementById('ime-external-toolbar-container');

		toggleButtons.forEach(button => {
			const iconSpan = button.querySelector('.material-icons');
			if (isActive) {
				button.title = '停用輸入法';
				button.classList.add('ime-active');
			} else {
				button.title = '啟用輸入法';
				button.classList.remove('ime-active');
			}
		});

		if (!isActive && externalToolbar) {
			externalToolbar.innerHTML = '';
		}
	}

    if (shouldAutoEnable) {
        WebIME.imeInit(configFromUrl);

        if (paramsWereUsed) {
            const newUrl = new URL(window.location.href);
            const allParams = ['ime', 'ime-enabled', 'prediction', 'tonemode', 'longphrase', 'fullwidth', 'output_enabled', 'ime-output'];
            allParams.forEach(p => newUrl.searchParams.delete(p));
            window.history.replaceState({}, document.title, newUrl.href);
        }
    }
    
    syncAllToggleButtonsUI();

    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (typeof WebIME !== 'undefined') {
                if (WebIME.isInitialized) {
                    WebIME.imeDestroy();
                } else {
                    WebIME.imeInit();
                }
                syncAllToggleButtonsUI();
            }
        });
    });
});

