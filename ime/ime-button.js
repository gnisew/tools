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

    // 1. 解析 URL 參數，產生一個給 imeInit 使用的設定物件
    const params = new URLSearchParams(window.location.search);
    const configFromUrl = {};
    let shouldAutoEnable = false;
    let paramsWereUsed = false; // 標記是否使用了 URL 參數

    if (params.has('ime')) {
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
            
            if (settingsCode.length >= 5) {
                configFromUrl.outputEnabled = (settingsCode[4] === '1');
                if (settingsCode.length >= 6) {
                    // 無論 outputEnabled 是 true 還是 false，都解析 outputMode 的值
                    switch(settingsCode[5]) {
                        case '1': configFromUrl.outputMode = 'pinyin'; break;
                        case '2': configFromUrl.outputMode = 'word_pinyin'; break;
                        case '3': configFromUrl.outputMode = 'word_pinyin2'; break;
                        default: configFromUrl.outputMode = 'word'; break;
                    }
                }
            }
        } else {
            // 為了相容舊格式或簡單格式，例如 ?ime=sixian
            shouldAutoEnable = true;
            configFromUrl.defaultMode = imeParam;
        }
    }
    
    // 也能接受獨立的啟用參數 ?ime-enabled=true
    if (params.has('ime-enabled')) {
        paramsWereUsed = true;
        shouldAutoEnable = params.get('ime-enabled') === 'true';
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
				iconSpan.textContent = 'keyboard_hide';
				button.title = '完全關閉輸入法';
				button.classList.add('ime-active');
			} else {
				iconSpan.textContent = 'keyboard';
				button.title = '啟用輸入法';
				button.classList.remove('ime-active');
			}
		});

		if (!isActive && externalToolbar) {
			externalToolbar.innerHTML = '';
		}
	}

    // 2. 如果 URL 參數指定要自動啟用，就呼叫初始化
    if (shouldAutoEnable) {
        // [核心] 將解析好的設定物件傳遞給 imeInit，由它來處理設定合併
        WebIME.imeInit(configFromUrl);

        if (paramsWereUsed) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('ime');
            newUrl.searchParams.delete('ime-enabled');
            window.history.replaceState({}, document.title, newUrl.href);
        }
    }
    
    // 3. 同步所有按鈕的初始 UI 狀態
    syncAllToggleButtonsUI();

    // 4. 為所有切換按鈕加上點擊事件
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (typeof WebIME !== 'undefined') {
                if (WebIME.isInitialized) {
                    WebIME.imeDestroy();
                } else {
                    // [核心] 如果未啟用，則用預設值或 LocalStorage 的值來初始化
                    // 注意：這裡不傳入 configFromUrl，因為 URL 參數只在第一次載入時有效
                    WebIME.imeInit();
                }
                syncAllToggleButtonsUI();
            }
        });
    });
});