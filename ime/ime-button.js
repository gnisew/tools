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

    // 讀取網址參數，以便在啟用時套用
    const params = new URLSearchParams(window.location.search);
    const configFromUrl = {};
    if (params.has('ime')) configFromUrl.defaultMode = params.get('ime');
    if (params.has('prediction')) configFromUrl.enablePrediction = params.get('prediction') === 'true';
    if (params.has('tonemode')) {
        const toneMode = params.get('tonemode');
        if (toneMode === 'numeric' || toneMode === 'alphabetic') configFromUrl.initialToneMode = toneMode;
    }
    if (params.has('longphrase')) configFromUrl.longPhrase = params.get('longphrase') === 'true';
    if (params.has('fullwidth')) configFromUrl.initialFullWidth = params.get('fullwidth') === 'true';
    if (params.has('ime-output')) {
        const outputMode = params.get('ime-output');
        if (['pinyin', 'word_pinyin', 'word'].includes(outputMode)) {
            configFromUrl.outputMode = outputMode;
            configFromUrl.outputEnabled = true;
        }
    }
    if (params.has('output_enabled')) configFromUrl.outputEnabled = params.get('output_enabled') === 'true';


    function syncAllToggleButtonsUI(isActive) {
        toggleButtons.forEach(button => {
            const iconSpan = button.querySelector('.material-icons');
            if (isActive) {
                iconSpan.textContent = 'keyboard_hide'; // 啟用狀態下的圖示
                button.title = '停用烏衣行輸入法';
                button.classList.add('ime-active'); // 加上啟用狀態的 CSS class
            } else {
                iconSpan.textContent = 'keyboard'; // 停用狀態下的圖示
                button.title = '啟用烏衣行輸入法';
                button.classList.remove('ime-active'); // 移除啟用狀態的 CSS class
            }
        });
    }

    // 1. 判斷是否要在頁面載入時自動啟用 IME
    const shouldAutoEnable = params.get('ime-enabled') === 'true';
    if (shouldAutoEnable) {
        const baseConfig = { 
            defaultMode: 'sixian', 
            candidatesPerPage: 5 
        };
        const finalConfig = { ...baseConfig, ...configFromUrl };
        WebIME.init(finalConfig);
    }


    //    在頁面載入後，不論上面是否啟用了 IME，都立即根據 WebIME 的最終狀態 (`isInitialized`)
    //    同步一次所有按鈕的 UI。這一步會設定好按鈕的正確初始外觀。
    syncAllToggleButtonsUI(WebIME.isInitialized);

    // 3. 為所有切換按鈕綁定點擊事件
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 點擊時，判斷當前狀態來決定要啟用還是銷毀
            if (WebIME.isInitialized) {
                WebIME.destroy();
            } else {
                const baseConfig = { 
                    defaultMode: 'sixian', 
                    candidatesPerPage: 5 
                };
                const finalConfig = { ...baseConfig, ...configFromUrl };
                WebIME.init(finalConfig);
            }
            // 每次點擊操作後，都再次同步所有按鈕的 UI
            syncAllToggleButtonsUI(WebIME.isInitialized);
        });
    });
});