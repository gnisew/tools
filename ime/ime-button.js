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

    // (這一段解析 URL 參數的程式碼保持不變)
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


	/**
	 * 【新的同步函數】
	 * 負責同步所有相關 UI 的狀態，包含按鈕圖示和外部工具列。
	 */
	function syncAllToggleButtonsUI() {
		const isActive = typeof WebIME !== 'undefined' && WebIME.isInitialized;
		const externalToolbar = document.getElementById('ime-external-toolbar-container');

		toggleButtons.forEach(button => {
			const iconSpan = button.querySelector('.material-icons');
			if (isActive) {
				iconSpan.textContent = 'keyboard_hide';
				button.title = '完全關閉烏衣行輸入法';
				button.classList.add('ime-active');
			} else {
				iconSpan.textContent = 'keyboard';
				button.title = '啟用烏衣行輸入法';
				button.classList.remove('ime-active');
			}
		});

		// 【核心修正】
		// 如果輸入法不是啟用狀態 (已被 destroy)，就找到外部容器並清空它。
		if (!isActive && externalToolbar) {
			externalToolbar.innerHTML = '';
		}
	}

    /**
	 * 【新的初始化邏輯】
	 * 這段程式碼修正了 URL 參數被 Local Storage 覆蓋的問題。
	 */
    if (shouldAutoEnable) {
        // 1. 從 URL 參數中暫存要切換的目標語言
        const urlDefaultMode = configFromUrl.defaultMode;

        // 2. 從傳給 imeInit 的設定中移除 defaultMode，避免 imeInit 邏輯混淆。
        //    讓 WebIME 核心先用它自己的預設或 Local Storage 邏輯完成初始化。
        delete configFromUrl.defaultMode;

        // 3. 組合最終的初始化設定 (現在不包含 URL 的 defaultMode)
		const baseConfig = { candidatesPerPage: 5 };
        const finalConfig = { ...baseConfig, ...configFromUrl };
        
        // 4. 呼叫核心初始化
        WebIME.imeInit(finalConfig);
        
        // 5. 【關鍵修正】: 在初始化完成後，強制切換到 URL 參數指定的語言模式。
        //    這一步會覆蓋 Local Storage 或任何預設值，確保 URL 參數優先。
        if (urlDefaultMode && typeof WebIME.switchMode === 'function') {
            WebIME.switchMode(urlDefaultMode);
        }

		const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('ime');
        newUrl.searchParams.delete('ime-enabled'); // 順便清理舊的參數以防萬一
        window.history.replaceState({}, document.title, newUrl.href);
    }
    
    // 使用新的同步函式來設定初始狀態
    syncAllToggleButtonsUI();

    // 為所有切換按鈕綁定新的點擊邏輯
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (typeof WebIME !== 'undefined') {
                if (WebIME.isInitialized) {
                    WebIME.destroy();
                } else {
                    const baseConfig = { defaultMode: 'sixian', candidatesPerPage: 5 };
                    const finalConfig = { ...baseConfig, ...configFromUrl };
                    WebIME.imeInit(finalConfig);
                }
                // 無論是啟用還是停用，都呼叫同步函式來更新所有按鈕的 UI
                syncAllToggleButtonsUI();
            }
        });
    });
});