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
    const hasToggleButtons = toggleButtons.length > 0;
    const params = new URLSearchParams(window.location.search);

    function syncAllToggleButtonsUI() {
        // ... (此函式保持不變)
		const isActive = typeof WebIME !== 'undefined' && WebIME.isInitialized;
		const externalToolbar = document.getElementById('ime-external-toolbar-container');

		toggleButtons.forEach(button => {
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

// --- 【全新的 URL 參數處理邏輯】 ---
    if (params.has('ime')) {
        const imeParam = params.get('ime');
        const parts = imeParam.split('-');
        const imeState = parts[0]; // 狀態碼：0, 1, 或 2

        if (imeState === '0') {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('ime');
            window.history.replaceState({}, document.title, newUrl.href);
            return;
        }

        const configFromUrl = {};
        const features = {};

        if (parts.length === 3) {
            configFromUrl.defaultMode = parts[1];
            const settingsCode = parts[2];

            // 根據更新後的設定碼格式解析
            if (settingsCode.length >= 1) features.singleCharMode = (settingsCode[0] === '1');
            if (settingsCode.length >= 2) features.prediction = (settingsCode[1] === '1');
            if (settingsCode.length >= 3) features.numericTone = (settingsCode[2] === '1');
            if (settingsCode.length >= 4) features.longPhrase = (settingsCode[3] === '1');
            if (settingsCode.length >= 5) features.fullWidthPunctuation = (settingsCode[4] === '1');
            
            if (settingsCode.length >= 6) {
                features.outputEnabled = (settingsCode[5] === '1');
            }
            // --- 修改 outputMode 的解析邏輯 ---
            if (settingsCode.length >= 7) {
                switch(settingsCode[6]) { // 注意索引值
                    case '1': features.outputMode = 'pinyin_mode'; break;
                    case '2': features.outputMode = 'pinyin'; break;
                    case '3': features.outputMode = 'word_pinyin'; break;
                    case '4': features.outputMode = 'word_pinyin2'; break;
                }
            }
        }
        
        configFromUrl.features = features;

        WebIME.imeInit(configFromUrl);

        if (imeState === '1') {
            WebIME.imeSetIsEnabled(true);
        } else if (imeState === '2') {
            WebIME.imeSetIsEnabled(false);
        }

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('ime');
        window.history.replaceState({}, document.title, newUrl.href);

    } else {
        if (hasToggleButtons) {
            // 有按鈕，不動作
        } else {
            WebIME.imeInit();
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