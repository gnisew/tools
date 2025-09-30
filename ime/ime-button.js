/**
 * 動態注入 IME 切換按鈕所需的 CSS 樣式到 <head>。
 */
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
		    background-color: #e8f0fe;
		    color: #1a73e8;
		}
		.ime-toggle-button.ime-active:hover {
		    background-color: #d2e3fc;
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
	injectImeButtonStyles();

    // 在此呼叫新加入的函數，來禁止下拉更新
    disablePullToRefresh();

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


/**
 * 禁止行動裝置上的下拉更新頁面功能。
 * 透過監聽 touch 事件，判斷使用者是否在頁面頂端進行下拉手勢，
 * 若是，則取消瀏覽器的預設行為。
 */
function disablePullToRefresh() {
    let startY = 0;      // 紀錄觸控起始點的 Y 軸座標
    let isPulling = false; // 標記是否正在進行下拉操作

    // 監聽觸控開始事件
    document.body.addEventListener('touchstart', (e) => {
        // 只有當頁面完全捲動到最頂端時，才可能是下拉更新手勢
        if (document.documentElement.scrollTop === 0 && document.body.scrollTop === 0) {
            startY = e.touches[0].pageY; // 記錄起始 Y 座標
            isPulling = true;            // 標記為可能正在下拉
        } else {
            isPulling = false;
        }
    }, { passive: false }); // passive: false 是必要的，才能呼叫 e.preventDefault()

    // 監聽觸控移動事件
    document.body.addEventListener('touchmove', (e) => {
        // 如果不是從頂端開始的下拉操作，則不進行任何處理
        if (!isPulling) {
            return;
        }

        const currentY = e.touches[0].pageY;
        // 判斷是否為向下滑動（當前 Y 座標大於起始 Y 座標）
        if (currentY > startY) {
            // 是向下滑動，阻止瀏覽器的預設行為（例如：頁面刷新）
            e.preventDefault();
        } else {
            // 如果使用者轉為向上滑動，則取消標記，恢復正常捲動
            isPulling = false;
        }
    }, { passive: false }); // passive: false 是必要的
}