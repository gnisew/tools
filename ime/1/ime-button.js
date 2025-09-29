/**
 * 動態注入 IME 切換按鈕所需的 CSS 樣式到 <head>。
 */
function injectImeButtonStyles() {
    // 定義一個 ID，用來識別我們注入的 style 標籤，避免重複添加
    const styleId = 'ime-toggle-button-styles';

    // 如果這個 ID 的 style 標籤已經存在，就直接返回
    if (document.getElementById(styleId)) {
        return;
    }

    // 使用反引號 (`) 建立多行 CSS 字串
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
		    color: #1a73e8;
		}
		.ime-toggle-button.ime-active:hover {
		    color: #1C73C8;
		}
    `;

    // 建立 <style> 元素
    const styleElement = document.createElement('style');
    styleElement.id = styleId; // 賦予 ID
    styleElement.innerHTML = css; // 將 CSS 字串放入

    // 將 <style> 元素附加到 <head>
    document.head.appendChild(styleElement);
}


document.addEventListener('DOMContentLoaded', () => {
    checkAndLoadMaterialIcons();
	injectImeButtonStyles();

    // 1. 選取所有 class 為 'ime-toggle-button' 的按鈕
    const toggleButtons = document.querySelectorAll('.ime-toggle-button');
    
    // 如果頁面上沒有任何切換按鈕，就直接結束
    if (toggleButtons.length === 0) {
        return;
    }

    /**
     * 2. 建立一個函式，專門用來同步所有切換按鈕的 UI 狀態
     * @param {boolean} isActive - 輸入法是否為啟用狀態
     */
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

    // 3. 遍歷所有按鈕，為每一個都綁定點擊事件
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 點擊後，切換 WebIME 的狀態
            if (WebIME.isInitialized) {
                WebIME.destroy();
            } else {
                WebIME.init({ defaultMode: 'sixian' });
            }
            // 關鍵：呼叫同步函式，根據最新的 WebIME 狀態來更新所有按鈕的 UI
            syncAllToggleButtonsUI(WebIME.isInitialized);
        });
    });

    // (可選) 初始化時，也同步一次UI狀態，以防頁面重整時狀態不一致
    syncAllToggleButtonsUI(WebIME.isInitialized);
});