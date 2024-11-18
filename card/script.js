var selectMode = false;
var viewMode = false;
var isAltViewMode = false;  // 追蹤是否為 Alt 觸發的檢視模式
var deletedWordCards = []; // 儲存已刪除的語詞卡及其原始位置;
var lastClickTime = 0; // 在手機上連點兩下的時間計算;
var pressTimer; // 手機上長按的時間計算;
let tempInput = null;

let scale = 1;
let panX = 0;
let panY = 0;
const canvas = document.getElementById('infinite-canvas');
const container = document.getElementById('canvas-container');

// 監聽 Alt 鍵
document.addEventListener('keydown', function(e) {
    if (e.key === 'Alt') {
        // 只有在非按鈕觸發的檢視模式下才允許 Alt 切換
        if (!document.getElementById('viewModeButton').classList.contains('active')) {
            isAltViewMode = true;
            viewMode = true;
            updateViewMode();
        }
    }
});
document.addEventListener('keyup', function(e) {
    if (e.key === 'Alt') {
        // 只有在 Alt 觸發的檢視模式下才允許退出
        if (isAltViewMode) {
            isAltViewMode = false;
            viewMode = false;
            updateViewMode();
        }
    }
});

// 縮放功能
function setTransform() {
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    updateTempInputPosition();
}

function zoomIn() {
    scale *= 1.2;
    if (scale > 20) scale = 20; // 最大縮放限制
    setTransform();

}

function zoomOut() {
    scale /= 1.2;
    if (scale < 0.2) scale = 0.2; // 最小縮放限制
    setTransform();

}

function resetZoom() {
    scale = nowScale;
    panX = nowX;
    panY = nowY;
    setTransform();
}

// 滾輪縮放
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY;

    // 計算滑鼠相對於畫布的位置
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 儲存舊的縮放值
    const oldScale = scale;

    // 縮放
    if (delta > 0) {
        scale /= 1.1;
        if (scale < 0.2) scale = 0.2;
    } else {
        scale *= 1.1;
        if (scale > 20) scale = 20;
    }

    // 計算縮放後的位置補償
    // 這是關鍵修改：確保滑鼠指標位置在縮放前後保持不變
    panX += mouseX * (1 - scale / oldScale);
    panY += mouseY * (1 - scale / oldScale);

    setTransform();
	updateTempInputPosition();
});



// 為 infinite-canvas 添加雙擊事件監聽
container.addEventListener('dblclick', function(e) {
    // 計算相對於容器的位置
    const containerRect = container.getBoundingClientRect();
    // 計算實際位置，考慮平移和縮放效果
    const actualX = (e.clientX - containerRect.left - panX) / scale;
    const actualY = (e.clientY - containerRect.top - panY) / scale;

    // 使用滑鼠點擊的實際螢幕位置
    createTempInput(e.clientX, e.clientY, actualX, actualY);
});

// 修改臨時輸入框的建立函數
function createTempInput(screenX, screenY, actualX, actualY) {
    if (tempInput) {
        tempInput.remove();
    }
    
    tempInput = document.createElement('input');
    tempInput.type = 'text';
    tempInput.className = 'temp-input';
    
    // 儲存原始位置
    tempInput.setAttribute('data-original-x', screenX);
    tempInput.setAttribute('data-original-y', screenY);
    
    // 設置位置
    tempInput.style.left = `${screenX}px`;
    tempInput.style.top = `${screenY}px`;
    
   
    document.body.appendChild(tempInput);
    
    tempInput.focus();
    
    tempInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (this.value.trim()) {
                createWordCard(this.value, actualX, actualY);
                this.blur();
            }
        }
    });
    
    tempInput.addEventListener('blur', function() {
		            if (this.value.trim()) {
                createWordCard(this.value, actualX, actualY);
				}
        this.remove();
        tempInput = null;
    });
}

// 檢查畫布是否有語詞卡的函數
function hasWordCards() {
    return document.querySelectorAll('.wordCard').length > 0;
}
// 平移功能
let isDragging = false;
let lastX, lastY;

container.addEventListener('mousedown', (e) => {
    if (viewMode) {
        // 在檢視模式下，任何位置都可以拖曳整個畫布
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        container.style.cursor = 'grab';
        return;
    }

    if (selectMode) return;
    if (!hasWordCards()) return;
    if (e.target === container || e.target === canvas) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        container.style.cursor = 'grab';
    }
});

container.addEventListener('mousemove', (e) => {
    if (selectMode) return; // 如果是選取模式，直接返回，不執行拖曳
    if (!hasWordCards()) return; // 如果沒有語詞卡，直接返回

    if (isDragging) {
        const dx = (e.clientX - lastX);
        const dy = (e.clientY - lastY);
        panX += dx;
        panY += dy;
        lastX = e.clientX;
        lastY = e.clientY;
        setTransform();
        container.style.cursor = 'grabbing';
    }

});

container.addEventListener('mouseup', () => {
    isDragging = false;
    container.style.cursor = 'default';
	updateTempInputPosition();
});

// 防止拖曳超出範圍
container.addEventListener('mouseleave', () => {
    isDragging = false;
    container.style.cursor = 'default';
	updateTempInputPosition();
});


// 新增：觸控事件相關變數
let lastTouchX = 0;
let lastTouchY = 0;
let touchStartX = 0;
let touchStartY = 0;
let isTouchDragging = false;
let isTouchSelecting = false;

// 觸控事件支援
container.addEventListener('touchstart', (e) => {
    if (selectMode) {
        // 如果點擊的是語詞卡或控制元件，不啟動框選
        if (e.target.classList.contains('wordCard') ||
            e.target.closest('.inputContainer') ||
            e.target.closest('#ox2')) {
            return;
        }
        isTouchSelecting = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        selectBox.style.left = touchStartX + 'px';
        selectBox.style.top = touchStartY + 'px';
        selectBox.style.width = '0';
        selectBox.style.height = '0';
        selectBox.style.display = 'block';
    } else if ((e.target === container || e.target === canvas) && hasWordCards()) { // 加入檢查
        isTouchDragging = true;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
    }
});

container.addEventListener('touchmove', (e) => {
    e.preventDefault(); // 防止畫面滾動
    if (!hasWordCards() && !isTouchSelecting) return; // 如果沒有語詞卡且不是選取模式，直接返回

    if (isTouchSelecting) {
        // 框選邏輯
        const touch = e.touches[0];
        const width = Math.abs(touch.clientX - touchStartX);
        const height = Math.abs(touch.clientY - touchStartY);
        const left = Math.min(touch.clientX, touchStartX);
        const top = Math.min(touch.clientY, touchStartY);

        selectBox.style.width = width + 'px';
        selectBox.style.height = height + 'px';
        selectBox.style.left = left + 'px';
        selectBox.style.top = top + 'px';

        // 檢查語詞卡是否在選擇框內
        const cards = document.querySelectorAll('.wordCard');
        const selectRect = selectBox.getBoundingClientRect();
        cards.forEach(card => {
            const cardRect = card.getBoundingClientRect();
            const overlap = !(
                selectRect.right < cardRect.left ||
                selectRect.left > cardRect.right ||
                selectRect.bottom < cardRect.top ||
                selectRect.top > cardRect.bottom
            );
            if (overlap) {
                card.classList.add('selected');
            }
        });
    } else if (isTouchDragging) {
        // 拖曳畫布邏輯
        const touch = e.touches[0];
        const dx = (touch.clientX - lastTouchX) / scale;
        const dy = (touch.clientY - lastTouchY) / scale;
        panX += dx;
        panY += dy;
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
        setTransform();
    }
});

container.addEventListener('touchend', () => {
    if (isTouchSelecting) {
        isTouchSelecting = false;
        selectBox.style.display = 'none';
    }
    isTouchDragging = false;
	updateTempInputPosition();
});

container.addEventListener('touchcancel', () => {
    if (isTouchSelecting) {
        isTouchSelecting = false;
        selectBox.style.display = 'none';
    }
    isTouchDragging = false;
});




//J01 建立語詞卡;
function createWordCard(txt, posX, posY) {
	
    var inputValue;
    inputValue = txt ?? document.getElementById('wordInput').value;
    
    if (inputValue.trim() == '') {
        document.getElementById('wordInput').value = "";
        return;
    }

    var colorSelect = document.getElementById('colorSelect');
    var selectedColor = colorSelect.value;

    try {
        inputValue = decodeURIComponent(inputValue);
    } catch (error) {
        // 如果 decodeURIComponent 出錯，則將 inputValue 設定回原值;
        inputValue = inputValue;
    }

    if (inputValue !== '') {
        // 輸入的第一個字元 | \ / ; , 就是分割符號;
        var firstChar = inputValue.charAt(0);
        var regex = /[ \t|\;,\\\/]/;
        var myRegex = /^\[.*?\]/;
        var regexBiaodian = /[，：；、？！]/;
        var regexBiaodianAll = /[。，：；、？！「」『』〔〕【】──……《》〈〉（）～]/g;
        var words;

        inputValue = txtToSelectOption(inputValue); //下拉選單;
        inputValue = textToRuby(inputValue); // ruby注音標示;

        if (/^\[.*?\]/.test(inputValue)) {
            //開頭用正則自訂分割符號;
            var myRegexMatch = inputValue.match(/^\[.*?\]/)[0];
            var myRegex = new RegExp(myRegexMatch);
            inputValue = inputValue.replace(/^\[.*?\]/, '');
            words = inputValue.split(myRegex).filter(Boolean);
            words = words.filter(word => word.trim() !== ''); //刪除為空格的元素;
        } else if (inputValue.length > 2 && regex.test(firstChar)) {
            var occurrences = inputValue.split(firstChar).length - 1;
            if (occurrences >= 2) {
                words = inputValue.split(firstChar).filter(Boolean);
                // 字串陣列 = 輸入值.分割(首字元).篩選(布林);
                // 篩選(布林) 可以移除陣列裡的空元素;
            } else {
                splitBiaodian();
            }
        } else {
            // 非特殊符號的分割;
            splitBiaodian();
        }

        function splitBiaodian() {
            // 用標點符號來分割字串，只要第一個字元是標點符號;
            if (inputValue.length > 2 && regexBiaodian.test(firstChar)) {
                //若第一個字元是標點;
                var myBiaodian = inputValue.split(firstChar).length - 1;
                if (myBiaodian >= 2) {
                    //如果這個標點有使用兩次以上，表示要用來分割;
                    words = inputValue.split(regexBiaodianAll).filter(Boolean);
                } else {
                    if (firstChar === "。" || firstChar === "；" || firstChar === "：") {
                        //若用句號開頭，用標點分割時則保留右邊的標點;
                        inputValue = inputValue.replace(/([。，：；、？！「」『』〔〕【】──……《》〈〉（）～])/g, "$1\t").slice(1);
                    }
                    words = inputValue.split(/\t+/).filter(Boolean);
                    //預設使用 tab 來分割;
                }
            } else {
                //預設使用 TAB 來分割;
                words = inputValue.split(/\t+/).filter(Boolean);
            }
        }
        // 替換輸入的字串================;
        let w = words.join("	");
		w = urlConverter(w);	
        //w = w.replace(/([A-Za-z0-9\-_]+)(.)(holo|ka|kasu)/g, "<k onclick=\"p(this, '<$1$3>')\">🔊</k>");
        w = w.replace(/([A-Za-z0-9\-_]+)(;|:)(ho|holo|kasu|ka|minnan|min)/g, "<k onclick=\"p(this, '$1:$3')\">🔊</k>$1");

        w = w.replace(/<([a-zA-Z]*):([^>]*)>/g, "<k onclick=\"p(this, '<$1:$2>')\">🔊</k>");

        w = w.replace(/<([a-zA-Z]*);([^>]*)>/g, "<k onclick=\"p(this, '<$1;$2>')\">🔊</k>$2");

        w = w.replace(/([A-Za-z0-9\-_]+)\.holo/g, "https://oikasu.com/file/mp3holo/$1.mp3");
		
        w = w.replace(/([A-Za-z0-9\-_]+)\.kasu/g, "https://oikasu.com/file/mp3/$1.mp3");
		
        w = w.replace(/([A-Za-z0-9\-_]+)\.ka/g, function(match, p1) {
            let x = p1.replace(/([a-z])z\b/g, "$1ˊ")
                .replace(/([a-z])v\b/g, "$1ˇ")
                .replace(/([a-z])x\b/g, "$1ˆ")
                .replace(/([a-z])f\b/g, "$1⁺")
                .replace(/([a-z])s\b/g, "$1ˋ");
            return "https://oikasu.com/file/mp3/" + p1 + ".mp3" + x + " ";
        });

        w = w.replace(/(https?:\/\/[\w\-\.\/]+\.(mp3|wav))/g, "<k onclick=\"p(this, '$1')\">🔊</k>"); //here;

        w = imageToHTML(w);
        w = vocarooToIframe(w);
        w = youtubeToIframe(w);

		
		

        w = w.replace(/\\n/g, "<br />");
        //==============================;
        words = w.split("	");

        var wordCards = document.querySelectorAll('.wordCard');

        var idNumber = wordCards.length + deletedWordCards.length + 1;
        //計數器，用於 id 初始值;

        var windowWidth = window.innerWidth;
        var rowWidth = 0;
        var rowHeight = 0;
        var maxHeight = 0;
        var currentTop = 100;
        var currentLeft = 20;

        words.forEach(function(word) {
            var wordCard = document.createElement('div');
            wordCard.className = 'wordCard';
            wordCard.classList.add('cardAdd');

            if (selectedColor == 0) {
                let c = mathRandom(1, 6);
                wordCard.classList.add('cardColor-' + c);
            } else if (selectedColor) {
                wordCard.classList.add('cardColor-' + selectedColor);
            }

            wordCard.id = 'wordCard-' + idNumber;
            word = word.replace(/&nbsp;/g, ' '); // 取代空格「&nbsp;」代號;
            wordCard.innerHTML = word;
            makeDraggable(wordCard);
            wordCard.setAttribute('draggable', "o"); // 拖曳屬性預設 o 可以;  

            // 雙擊事件處理器
			wordCard.addEventListener('dblclick', function(e) {
				makeCardEditable(this);
			});

            wordCard.addEventListener('contextmenu', showContextMenu);

            wordCard.addEventListener('touchstart', function(e) {
                pressTimer = setTimeout(function() {
                    this.addEventListener('contextmenu', showContextMenu);
                }.bind(this), 500); // 長按觸發時間設定為 500 毫秒;
            });

            // 如果有指定位置，就使用指定位置
        if (posX !== undefined && posY !== undefined) {
            wordCard.style.position = 'absolute';  // 改為absolute定位
            wordCard.style.left = posX + 'px';
            wordCard.style.top = posY + 'px';
        }
            canvas.appendChild(wordCard);
        });
    }

        // 只在沒有指定位置時執行重排
        if (posX === undefined || posY === undefined) {
            rearrangeWordCards("top", ".cardAdd");
        }

    // 重排新建的語詞卡;
    var cardAdd = document.querySelectorAll('.cardAdd');
    cardAdd.forEach(function(card) {
        card.classList.remove('cardAdd');
    });
    // 移除新建語詞卡的class;
    preloadAudios()
    // 預載音檔;
}


// 監聽縮放和平移事件以更新臨時輸入框 ===
function updateTempInputPosition() {
    // 如果沒有臨時輸入框，直接返回
    if (!tempInput) return;

    // 獲取臨時輸入框的原始位置數據
    const left = parseFloat(tempInput.getAttribute('data-original-x') || 0);
    const top = parseFloat(tempInput.getAttribute('data-original-y') || 0);

    // 計算新的位置
    tempInput.style.left = `${left}px`;
    tempInput.style.top = `${top}px`;
}



function handleSubmitClick() {
  const container = document.querySelector('.inputContainer');
  const input = document.getElementById('wordInput');
  
  if (!container.classList.contains('expanded')) {
    // 如果輸入框未展開，則展開並聚焦
    container.classList.add('expanded');
    input.focus();
    return;
  }
  
  // 如果已展開且有輸入內容，則創建單字卡
  if (input.value.trim()) {
    createWordCard();
    //input.value = '';
    container.classList.remove('expanded');
  }
}


// 新的事件監聽設置
document.getElementById('submitBtn').addEventListener('click', function() {
  const container = document.querySelector('.inputContainer');
  const input = document.getElementById('wordInput');
  
  if (!container.classList.contains('expanded')) {
    // 如果輸入框未展開，則展開並聚焦
    container.classList.add('expanded');
    input.focus();
    return;
  }
  
  // 如果已展開且有輸入內容，則創建單字卡
  if (input.value.trim()) {
    createWordCard();
    input.value = '';
	input.focus();
  }
});

document.getElementById('wordInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const input = this;
    
    if (input.value.trim()) {
      createWordCard();
      input.value = '';
    }
  }
});

// 點擊外部時收合輸入框
document.addEventListener('click', function(e) {
  const container = document.querySelector('.inputContainer');
  const input = document.getElementById('wordInput');
  
  if (!container.contains(e.target)) {  // 如果點擊的不是輸入框區域
    if (!input.value.trim()) {  // 如果輸入框內容為空
      container.classList.remove('expanded');  // 收合輸入框
    }
  }
});

let moveDistance = 0;
let startDragX = 0;
let startDragY = 0;
let isRightClick = false; // 新增：標記是否為右鍵點擊

// 使元素可拖曳;
function makeDraggable(element) {
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    let isDragging = false;

    // 儲存所有選取卡片的初始位置差值
    let selectedCardsOffsets = [];

    element.addEventListener('mousedown', dragMouseDown);
    element.addEventListener('touchstart', dragMouseDown);

    function dragMouseDown(e) {
		if (viewMode) return; 

        e = e || window.event;
        if (e.type === 'mousedown') {
            e.preventDefault();
        }
		isRightClick = e.button === 2;

        var isDraggable = element.getAttribute('draggable');
        if (isDraggable == "x") return;

        // 記錄起始位置
        startDragX = e.clientX || e.touches[0].clientX;
        startDragY = e.clientY || e.touches[0].clientY;
        moveDistance = 0;

        // 如果是選取模式，計算所有選取卡片與當前拖曳卡片的位置差值
        if (selectMode && element.classList.contains('selected')) {
            const selectedCards = document.querySelectorAll('.wordCard.selected');
            selectedCardsOffsets = Array.from(selectedCards).map(card => ({
                card: card,
                offsetX: card.offsetLeft - element.offsetLeft,
                offsetY: card.offsetTop - element.offsetTop
            }));
        }

        pos3 = e.clientX || e.touches[0].clientX;
        pos4 = e.clientY || e.touches[0].clientY;

        document.addEventListener('mousemove', elementDrag);
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('touchmove', elementDrag);
        document.addEventListener('touchend', closeDragElement);
    }

    function elementDrag(e) {
        e = e || window.event;
        if (e.type === 'mousemove') {
            e.preventDefault();
        }
        isDragging = true;
        const currentX = e.clientX || e.touches[0].clientX;
        const currentY = e.clientY || e.touches[0].clientY;

        // 計算移動距離
        moveDistance = Math.sqrt(
            Math.pow(currentX - startDragX, 2) +
            Math.pow(currentY - startDragY, 2)
        );

        // 考慮縮放比例調整位移量
        pos1 = (pos3 - currentX) / scale;
        pos2 = (pos4 - currentY) / scale;
        pos3 = currentX;
        pos4 = currentY;

        // 計算新位置
        const newLeft = element.offsetLeft - pos1;
        const newTop = element.offsetTop - pos2;

        // 如果是選取模式且當前卡片被選取
        if (selectMode && element.classList.contains('selected')) {
            // 移動所有選取的卡片
            selectedCardsOffsets.forEach(({
                card,
                offsetX,
                offsetY
            }) => {
                card.style.left = (newLeft + offsetX) + "px";
                card.style.top = (newTop + offsetY) + "px";
            });
        } else {
            // 單獨移動當前卡片
            element.style.left = newLeft + "px";
            element.style.top = newTop + "px";
        }
    }

    function closeDragElement() {
        document.removeEventListener('mousemove', elementDrag);
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('touchmove', elementDrag);
        document.removeEventListener('touchend', closeDragElement);
		

        // 只在非拖曳時切換選取狀態
        if (selectMode && moveDistance < 5 && !isRightClick) {
            element.classList.toggle('selected');
        }

        isDragging = false;
        moveDistance = 0;
        selectedCardsOffsets = []; // 清空暫存的位置差值
    }

    // 右鍵選單事件
    element.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showContextMenu.call(this, e);
    });

    // 長按事件處理
    let pressTimer;
    element.addEventListener('touchstart', function(e) {
        pressTimer = setTimeout(() => {
            showContextMenu.call(this, e);
        }, 500);
    });
    element.addEventListener('touchend', function() {
        clearTimeout(pressTimer);
    });
    element.addEventListener('touchmove', function() {
        clearTimeout(pressTimer);
    });
}


// 檢視模式按鈕的事件處理器
document.getElementById('viewModeButton').addEventListener('click', function() {
    isAltViewMode = false;  // 重設 Alt 觸發標記
    viewMode = !viewMode;
    this.classList.toggle('active');
    updateViewMode();
});
// 統一處理檢視模式更新的函數
function updateViewMode() {
    const cards = document.querySelectorAll('.wordCard');
    cards.forEach(card => {
        if (viewMode) {
            card.style.pointerEvents = 'none';
        } else {
            card.style.pointerEvents = 'auto';
        }
    });
    
    container.style.cursor = viewMode ? 'grab' : 'default';
    
    // 更新按鈕狀態
    const viewModeButton = document.getElementById('viewModeButton');
    if (viewMode && !isAltViewMode) {
        viewModeButton.classList.add('active');
    } else if (!viewMode) {
        viewModeButton.classList.remove('active');
    }
}

function touch(idA, idB) {
    // 判斷是否碰觸到位置;
    var e = document.getElementById(idA);
    var x = document.getElementById(idB);
    var xRect = x.getBoundingClientRect();
    var eRect = e.getBoundingClientRect();

    if (
        eRect.right >= xRect.left &&
        eRect.left <= xRect.right &&
        eRect.bottom >= xRect.top &&
        eRect.top <= xRect.bottom
    ) {
        ca()
        return true;
    }
}




// 切換是否可被拖曳的屬性;
function toggleDraggable(card) {
    var isDraggable = card.getAttribute('draggable');
    if (isDraggable == "o") {
        card.setAttribute('draggable', "x");
    } else {
        card.setAttribute('draggable', "o");
    }
}



// 函式：還原語詞卡
function restoreWordCard() {
    if (deletedWordCards.length > 0) {
        var deletedWordCard = deletedWordCards.pop();
        var wordCard = deletedWordCard.element;
        wordCard.style.top = deletedWordCard.top + 'px';
        wordCard.style.left = deletedWordCard.left + 'px';
        //wordCard.style.zIndex = deletedWordCard.zIndex; //here;
        wordCard.setAttribute('menuAgain', 'o');
        // 可以顯示選單;
        canvas.appendChild(wordCard);
        // 將語詞卡重新加入網頁
        preloadAudios()
        // 預載音檔;
    }
}

// 切換按鈕顯隱;
function toggleButtons(id) {
    x = document.getElementById(id);
    x.style.display = (x.style.display == "none") ? "block" : "none";
}

var selectedPosition; // 所選取的位置;
var positionSelect;
// 重新排序語詞卡;
function rearrangeWordCards(x, who) {
    var wordCards = Array.from(document.querySelectorAll(who));
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var rowWidth = 0;
    var rowHeight = 0;
    var maxHeight = 0;
    
    // 修改：計算可視區域的相對位置
    var containerRect = container.getBoundingClientRect();
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // 修改：計算初始左邊距離，考慮平移和縮放
    var currentLeft = (20 - panX) / scale;
    
    // 修改：根據不同位置計算初始頂部距離
    var currentTop;
    if (x === 'top') {
        // 修改：改為可視區域頂部位置加上一個固定偏移
        currentTop = (scrollTop + 80 - panY) / scale;
    } else if (x === 'middle') {
        // 修改：改為可視區域中間位置
        currentTop = (scrollTop + (windowHeight / 2) - panY) / scale;
    } else if (x === 'bottom') {
        // 修改：改為可視區域底部位置減去固定偏移
        currentTop = (scrollTop + windowHeight - 100 - panY) / scale;
    }

    // 其餘排序邏輯保持不變
    wordCards.sort(function(a, b) {
        var idA = parseInt(a.id.replace('wordCard-', ''));
        var idB = parseInt(b.id.replace('wordCard-', ''));
        return idA - idB;
    });

    if (x === 'lines-left') {
        // 左側垂直排列的邏輯...（保持不變）
    } else {
        wordCards.forEach(function(wordCard) {
            var cardWidth = wordCard.offsetWidth;
            var cardHeight = wordCard.offsetHeight;

            // 修改：考慮縮放比例進行寬度計算
            if (rowWidth + (cardWidth / scale) > (windowWidth - 100) / scale) {
                currentTop += maxHeight + 2;
                currentLeft = (60 - panX) / scale;
                rowWidth = 0;
                rowHeight = 0;
                maxHeight = 0;
            }

            // 修改：設置位置時考慮縮放和平移
            wordCard.style.top = currentTop + 'px';
            wordCard.style.left = currentLeft + 'px';

            rowWidth += (cardWidth + 2) / scale;
            rowHeight = Math.max(rowHeight, cardHeight / scale);
            maxHeight = Math.max(maxHeight, cardHeight / scale);
            currentLeft += (cardWidth + 2) / scale;
        });
    }
}
/*
function rearrangeWordCards(x, who) {
    //用 who 限定對象，如新建的或是全部;    
    //var positionSelect = document.getElementById('positionSelect');
    //var selectedPosition = positionSelect.value;
    var wordCards = Array.from(document.querySelectorAll(who));
    // 將「類陣列」對像轉換為陣列;
    var windowWidth = window.innerWidth;
    var rowWidth = 0;
    var rowHeight = 0;
    var maxHeight = 0;
    var currentTop = 100;
    var currentLeft = 20; // 初始左邊距離;

    if (x === 'top') {
        currentTop = 80; // 離 top 40px
    } else if (x === 'middle') {
        currentTop = window.innerHeight / 2; // 離 top 50%;
    } else if (x === 'bottom') {
        currentTop = window.innerHeight - 100; // 離 bottom 100px;
    } else if (selectedPosition === 'top') {
        currentTop = 80; // 離 top 40px
    } else if (selectedPosition === 'middle') {
        currentTop = window.innerHeight / 2; // 離 top 50%;
    } else if (selectedPosition === 'bottom') {
        currentTop = window.innerHeight - 100; // 離 bottom 100px;
    } else if (selectedPosition === 'newOrder') {
        currentTop = 80; // 離 top 40px
        renameWordCardIds(); // 由上到下重排;
    }

    wordCards.sort(function(a, b) {
        // 獲取語詞卡的id屬性並按照數字大小進行排序;
        var idA = parseInt(a.id.replace('wordCard-', ''));
        var idB = parseInt(b.id.replace('wordCard-', ''));
        return idA - idB;
    });
    if (selectedPosition === 'lines-left') {
        wordCards.forEach(function(wordCard) {
            var cardHeight = wordCard.offsetHeight;
            // 語詞卡依序排列，靠左對齊
            wordCard.style.top = currentTop + 'px';
            wordCard.style.left = '20px'; // 靠左對齊;

            // 更新下一個語詞卡的上邊距;
            currentTop += cardHeight + 2; // 語詞卡與間隔合計高度 + 2px 間隔;
            // 更新行的高度;
            rowHeight = Math.max(rowHeight, cardHeight);
        });
    } else {
        wordCards.forEach(function(wordCard) {
            var cardWidth = wordCard.offsetWidth;
            var cardHeight = wordCard.offsetHeight;

            // 如果語詞卡超出視窗寬度，排到下一行;
            if (rowWidth + cardWidth > windowWidth - 100) {
                currentTop += maxHeight + 2; // 語詞卡與間隔合計高度 + 2px 間隔;
                currentLeft = 60; // 初始左邊距離為 40px;
                rowWidth = 0;
                rowHeight = 0;
                maxHeight = 0;
            }

            wordCard.style.top = currentTop + 'px';
            wordCard.style.left = currentLeft + 'px';

            // 更新行的寬度和高度;
            rowWidth += cardWidth + 2; // 語詞卡與間隔合計寬度 + 2px 間隔;
            rowHeight = Math.max(rowHeight, cardHeight);
            maxHeight = Math.max(maxHeight, cardHeight);
            currentLeft += cardWidth + 2;
        });
    }
}
*/
// 全域變數，追蹤目前開啟的選單
let currentMenu = null;

// 關閉選單的函數
function closeMenu() {
    if (currentMenu) {
        currentMenu.remove();
        currentMenu = null;
    }
}


var cardContextMenu = 0;
var menu = null; // 新增變數 menu 來儲存選單;

// 顯示選單，語詞卡選單
function showContextMenu(event) {
    if (viewMode) return;  // 檢視模式不顯示選單
    
    event.preventDefault();  // 阻止預設右鍵選單
    
    // 如果有選單已開啟，先關閉它
    closeMenu();
    
    const card = this;

    // 建立自訂的選單
    var menu = document.createElement('div');
    menu.id = 'contextMenu';
    menu.style.position = 'absolute';

    const pos = calculateMenuPosition(event.clientX, event.clientY);
    menu.style.left = pos.x + 'px';
    menu.style.top = pos.y + 'px';
    
    menu.style.backgroundColor = 'white';
    menu.style.border = '0.8px solid gray';
    menu.style.padding = '8px';
    menu.style.cursor = 'pointer';
    menu.style.userSelect = 'none';

    // 綁定 contextmenu 事件並阻止預設行為
    menu.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });


	// 獲取所有被選中的語詞卡
	function getSelectedCards(card) {
		if (selectMode && document.querySelectorAll('.wordCard.selected').length > 0) {
			return document.querySelectorAll('.wordCard.selected');
		}
		return [card];
	}

	// 建立下拉選單：底色
	var colorSelect = document.createElement('select');
	colorSelect.style.width = '100%';
	colorSelect.id = 'colorSelectMenu';

	// 處理點擊選單的事件
	colorSelect.addEventListener('mousedown', function(event) {
		event.stopPropagation();
	});

	colorSelect.addEventListener('click', function(event) {
		event.stopPropagation();
	});

	// 處理選單展開的事件
	colorSelect.addEventListener('focus', function(event) {
		event.stopPropagation();
	});

	colorSelect.onchange = function(event) {
		event.stopPropagation();
		let selectedColor = this.value;
		getSelectedCards(card).forEach(selectedCard => {
			if (selectedColor == 0) {
				selectedColor = mathRandom(1, 6);
			}
			selectedCard.className = selectedCard.className.replace(/cardColor-\d+/, "cardColor-" + selectedColor);
		});
	};

	// 確保下拉選單在 selectMode 時可以操作
	colorSelect.style.pointerEvents = 'auto';

	// 建立選單項目
	var defaultOption = document.createElement('option');
	defaultOption.value = '';
	defaultOption.textContent = '底色';
	colorSelect.appendChild(defaultOption);

	var colorOptions = document.getElementById('colorSelect').options;
	for (var i = 1; i < colorOptions.length; i++) {
		var option = document.createElement('option');
		option.value = colorOptions[i].value;
		option.textContent = colorOptions[i].textContent;
		option.style.pointerEvents = 'auto';
		colorSelect.appendChild(option);
	}
	menu.appendChild(colorSelect);


    // 建立選單項目：放大
    var zoomInItem = document.createElement('div');
    zoomInItem.textContent = '➕ 加大';
    zoomInItem.onclick = function() {
        getSelectedCards(card).forEach(selectedCard => {
            zoom(1.2, selectedCard);
        });
    };
    menu.appendChild(zoomInItem);

    // 建立選單項目：縮小
    var zoomOutItem = document.createElement('div');
    zoomOutItem.textContent = '➖ 縮小';
    zoomOutItem.onclick = function() {
        getSelectedCards(card).forEach(selectedCard => {
            zoom(0.8, selectedCard);
        });
    };
    menu.appendChild(zoomOutItem);

    // 修改 showContextMenu 函式中的編輯選項程式碼
    var editItem = document.createElement('div');
    editItem.textContent = '✏️ 編輯';
	editItem.onclick = function() {
		makeCardEditable(card);
		// 關閉右鍵選單
		card.setAttribute('menuAgain', 'o');
		document.removeEventListener('click', hideContextMenu);
		menu.parentNode.removeChild(menu);
		cardContextMenu = 0;
	};
    menu.appendChild(editItem);



    // 建立選單項目：釘住
    var dragItem = document.createElement('div');
    dragItem.textContent = (card.getAttribute('draggable') == 'o') ? '📌 釘住' : '📌 不釘';
    dragItem.onclick = function() {
        getSelectedCards(card).forEach(selectedCard => {
            toggleDraggable(selectedCard);
        });
        card.setAttribute('menuAgain', 'o');
        document.removeEventListener('click', hideContextMenu);
        menu.parentNode.removeChild(menu);
        cardContextMenu = 0;
    };
    menu.appendChild(dragItem);

    // 建立選單項目：取字
    var copyOutItem = document.createElement('div');
    copyOutItem.textContent = '📋 取字';
    copyOutItem.onclick = function() {
        let textToCopy = Array.from(getSelectedCards(card))
            .map(selectedCard => selectedCard.innerHTML)
            .join('\n');
        copyThat(textToCopy);
        card.setAttribute('menuAgain', 'o');
        document.removeEventListener('click', hideContextMenu);
        menu.parentNode.removeChild(menu);
        cardContextMenu = 0;
    };
    menu.appendChild(copyOutItem);

    // 建立選單項目：隱藏;
    var hideItem = document.createElement('div');
    hideItem.textContent = '👻 隱藏';
    hideItem.onclick = function() {
        getSelectedCards(card).forEach(selectedCard => {
            selectedCard.style.display = 'none';
        });
        card.setAttribute('menuAgain', 'o');
        document.removeEventListener('click', hideContextMenu);
        menu.parentNode.removeChild(menu);
        cardContextMenu = 0;
    };
    menu.appendChild(hideItem);


    // 建立選單項目：刪除
    var deleteItem = document.createElement('div');
    deleteItem.textContent = '🗑️ 刪除';
    deleteItem.onclick = function() {
        // 刪除被點擊的語詞卡
        getSelectedCards(card).forEach(selectedCard => {
            selectedCard.classList.remove('selected');
            deletedWordCards.push({
                element: selectedCard,
                top: selectedCard.offsetTop,
                left: selectedCard.offsetLeft
            });
            selectedCard.parentNode.removeChild(selectedCard);
        });
        document.removeEventListener('click', hideContextMenu);
        menu.parentNode.removeChild(menu);
        cardContextMenu = 0;
    };
    menu.appendChild(deleteItem);



	// 建立選單項目：克隆
	var cloneOutItem = document.createElement('div');
	cloneOutItem.textContent = '👀 克隆';
	cloneOutItem.onclick = function() {
		getSelectedCards(card).forEach(selectedCard => {
			var cloneCard = selectedCard.cloneNode(true);
			var wordCards = document.querySelectorAll('.wordCard');
			var idNumber = wordCards.length + deletedWordCards.length + 1;
			cloneCard.id = 'wordCard-' + idNumber;
			
			// 重新綁定雙擊編輯事件
			cloneCard.addEventListener('dblclick', function(e) {
				makeCardEditable(this);
			});

			var offsetX = 20;
			var offsetY = 20;
			cloneCard.style.left = (parseInt(selectedCard.style.left) + offsetX) + 'px';
			cloneCard.style.top = (parseInt(selectedCard.style.top) + offsetY) + 'px';
			makeDraggable(cloneCard);
			cloneCard.addEventListener('contextmenu', showContextMenu);
			cloneCard.setAttribute('menuAgain', 'o');
			canvas.appendChild(cloneCard);
		});
		
		card.setAttribute('menuAgain', 'o');
		document.removeEventListener('click', hideContextMenu);
		menu.parentNode.removeChild(menu);
		cardContextMenu = 0;
	};
    menu.appendChild(cloneOutItem);




    // 置頂選項
    var moveUpItem = document.createElement('div');
    moveUpItem.className = 'contextMenuItem';
    moveUpItem.innerHTML = '☁️ 置頂';
    moveUpItem.addEventListener('click', function() {
        var c = document.getElementsByClassName("wordCard");
        var arr = Array.from(c);
        var len = arr.length;
        for (var i = 0; i < len; i++) {
            let x = arr[i].style.zIndex;
            arr[i].style.zIndex = x - 1;
        }
        getSelectedCards(card).forEach(selectedCard => {
            selectedCard.style.zIndex = len;
        });
    });
    menu.appendChild(moveUpItem);


    // 置底選項
    var moveDownItem = document.createElement('div');
    moveDownItem.className = 'contextMenuItem';
    moveDownItem.innerHTML = '🕳️ 置底';
    moveDownItem.addEventListener('click', function() {
        var c = document.getElementsByClassName("wordCard");
        var arr = Array.from(c);
        var len = arr.length;
        arr.sort(function(a, b) {
            return a.style.zIndex - b.style.zIndex;
        });
        for (var i = 0; i < len; i++) {
            arr[i].style.zIndex = i + 1;
        }
        getSelectedCards(card).forEach(selectedCard => {
            selectedCard.style.zIndex = -1;
        });
    });
    menu.appendChild(moveDownItem);



    // 旋轉相關選項
    var rotateItem = document.createElement('div');
    rotateItem.textContent = '旋轉方式▾';
    rotateItem.onclick = function() {
        rotateContainer = document.getElementById('rotateContainer');
        rotateContainer.classList.toggle('show');
    };
    menu.appendChild(rotateItem);

    var rotateContainer = document.createElement('div');
    rotateContainer.id = 'rotateContainer';
    rotateContainer.className = 'menuContainer';
    rotateContainer.style.display = 'none';
    menu.appendChild(rotateContainer);

    // 右轉15度選項
    var rotateRightItem = document.createElement('div');
    rotateRightItem.textContent = '右轉15';
    rotateRightItem.onclick = function() {
        getSelectedCards(card).forEach(selectedCard => {
            rotateSelectedCard([selectedCard], 15);
        });
    };
    rotateContainer.appendChild(rotateRightItem);

    // 左轉15度選項
    var rotateLeftItem = document.createElement('div');
    rotateLeftItem.textContent = '左轉15';
    rotateLeftItem.onclick = function() {
        getSelectedCards(card).forEach(selectedCard => {
            rotateSelectedCard([selectedCard], -15);
        });
    };
    rotateContainer.appendChild(rotateLeftItem);

    // 右轉90度選項
    var rotateRight90Item = document.createElement('div');
    rotateRight90Item.textContent = '右轉90';
    rotateRight90Item.onclick = function() {
        getSelectedCards(card).forEach(selectedCard => {
            rotateSelectedCard([selectedCard], 90);
        });
    };
    rotateContainer.appendChild(rotateRight90Item);

    // 水平翻轉選項
    var flipHorizontalItem = document.createElement('div');
    flipHorizontalItem.textContent = '水平翻轉';
    flipHorizontalItem.onclick = function() {
        getSelectedCards(card).forEach(selectedCard => {
            flipSelectedCardHorizontal([selectedCard]);
        });
    };
    rotateContainer.appendChild(flipHorizontalItem);


    // 將選單加入到頁面中
    document.body.appendChild(menu);
	currentMenu = menu;
}
function calculateMenuPosition(x, y) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const menuWidth = 120;  // 選單寬度
    const menuHeight = 300; // 選單高度
    const windowCenterY = windowHeight / 2;  // 視窗垂直中心點
    
    // 如果點擊位置太靠右，選單往左開
    if (x > windowWidth - menuWidth) {
        x = x - menuWidth;
    }
    
    // 根據點擊位置是否高於視窗中心來決定選單開啟方向
    if (y > windowCenterY) {
        y = y - menuHeight;  // 低於中心，選單往上開
    }
    // 高於中心，選單往下開，y 維持原值（選單頂部對齊滑鼠位置）
    
    return { x, y };
}
// 共用函數：處理語詞卡編輯功能
function makeCardEditable(card) {
    // 設定卡片為編輯模式
    card.setAttribute('contenteditable', 'true');
    card.setAttribute('draggable', 'x'); // 禁止拖曳
    card.style.cursor = 'text'; // 改變游標樣式
    
    // 儲存原始內容
    card.setAttribute('data-original-content', card.innerHTML);
    
    // 設置焦點並處理游標位置
    setTimeout(() => {
        card.focus();
        
        // 處理卡片點擊，設置游標位置
        const handleCardClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const selection = window.getSelection();
            const range = document.createRange();
            
            try {
                if (document.caretPositionFromPoint) {
                    const position = document.caretPositionFromPoint(e.clientX, e.clientY);
                    if (position) {
                        range.setStart(position.offsetNode, position.offset);
                        range.collapse(true);
                    }
                } else if (document.caretRangeFromPoint) {
                    range.setStart(document.caretRangeFromPoint(e.clientX, e.clientY).startContainer,
                        document.caretRangeFromPoint(e.clientX, e.clientY).startOffset);
                    range.collapse(true);
                }
                selection.removeAllRanges();
                selection.addRange(range);
            } catch (err) {
                console.log('游標位置設定失敗，使用預設行為');
            }
        };
        
        // 添加點擊事件監聽器
        card.addEventListener('mousedown', handleCardClick);
        
        // 點擊其他地方時結束編輯
        const finishEditing = (e) => {
            if (!card.contains(e.target)) {
                card.setAttribute('contenteditable', 'false');
                card.setAttribute('draggable', 'o'); // 恢復拖曳
                card.style.cursor = ''; // 恢復預設游標
                
                // 如果內容為空，恢復原始內容
                if (card.innerText.trim() === '') {
                    card.innerHTML = card.getAttribute('data-original-content');
                }
                
                // 移除相關的事件監聽器
                document.removeEventListener('mousedown', finishEditing);
                card.removeEventListener('mousedown', handleCardClick);
            }
        };
        
        // 延遲添加點擊監聽，避免立即觸發
        setTimeout(() => {
            document.addEventListener('mousedown', finishEditing);
        }, 100);
    }, 0);
}






const wordInput = document.getElementById('wordInput');

const colorSelect = document.getElementById('colorSelect');

wordInput.addEventListener('input', function() {
    if (wordInput.value !== '') {
        colorSelect.style.display = 'block';
    } else {
        colorSelect.style.display = 'none';
    }
});

// 函式：刪除特定顏色的語詞卡
function deleteWordCardsByColor() {
    var colorSelect = document.getElementById('colorSelect');
    var selectedColor = colorSelect.value;
    var wordCards = document.querySelectorAll('.wordCard');

    wordCards.forEach(function(wordCard) {
        if (wordCard.classList.contains('cardColor-' + selectedColor)) {
            deletedWordCards.push({
                element: wordCard,
                top: wordCard.offsetTop,
                left: wordCard.offsetLeft
            }); // 將語詞卡及其原始位置加入已刪除的語詞卡陣列
            wordCard.parentNode.removeChild(wordCard); // 刪除特定顏色的語詞卡
        }
    });
}

// 壓縮相同字串，aaaa = aₓ4 ;
function compressString(str) {
    return str.replace(/(.)\1{3,}/g, (match, char) => {
        return `${char}ₓ${match.length}`;
    });
}

function decompressString(str) {
    return str.replace(/(.)\ₓ(\d+)/g, (match, char, count) => {
        return char.repeat(parseInt(count));
    });
}


let nowX = 0;
let nowY = 0;
let nowScale = 1;

// 分享目前網址內的語詞卡;
function shareWordCards(how) {
    // 若 how = line 則輸出文字;
    var wordCards = document.querySelectorAll('.wordCard');
    var sharedData = [];
    var shareTxt = "";
    var shareTxtB = "";
    var shareHtml = [];
    var shareText = [];
	nowX = panX;
	nowY = panY;
	nowScale = scale;

    // 刪除所有語詞卡的 .selected 屬性
    wordCards.forEach(card => card.classList.remove('selected'));
    selectMode = false; // 取消選取模式;

    wordCards.forEach(function(wordCard) {
        var cardData = {
            id: wordCard.id,
            class: wordCard.className,
            content: wordCard.innerHTML,
            top: wordCard.offsetTop,
            left: wordCard.offsetLeft
        };
        sharedData.push(cardData);

        // 獲取 style.transform 字串
        function transformValue(obj) {
            var currentTransform = obj.style.transform;
            // 使用正則表達式來匹配 scaleX 和 rotate 的值
            var scaleXRegex = /scaleX\((-?\d+)\)/;
            var rotateRegex = /rotate\((-?\d+)deg\)/;
            var scaleXMatch = currentTransform.match(scaleXRegex);
            var rotateMatch = currentTransform.match(rotateRegex);

            // 檢查是否有匹配成功且找到了 scaleX 和 rotate 的值
            var scaleXValue, rotateValue;
            if (scaleXMatch && scaleXMatch[1]) {
                // 將 scaleX 的值轉換為浮點數
                scaleXValue = parseFloat(scaleXMatch[1]);
            } else {
                scaleXValue = ""; //無翻轉;
            }

            if (rotateMatch && rotateMatch[1]) {
                // 將 rotate 的值轉換為浮點數
                rotateValue = parseFloat(rotateMatch[1]);
            } else {
                rotateValue = ""; //無轉動;
            }
            return "," + scaleXValue + "," + rotateValue;
        }
        let transformTxt = transformValue(wordCard);
        //-------------------;

        shareTxt = shareTxt + wordCard.id.split("-")[1] + "," +
            wordCard.className.split("-")[1] + "," +
            wordCard.offsetTop + "," +
            wordCard.offsetLeft + "," +
            wordCard.getAttribute('draggable') + "," +
            wordCard.style.zIndex + "," +
            (parseFloat(wordCard.style.fontSize) || "") +
            // 字體大小 || 或無值 ;
            transformTxt + "¡"; // ,轉動與,翻轉;
        //----------;
        let wordCardHtml = selectOptionToTxt(wordCard.innerHTML); //下拉選單轉{{}};
        wordCardHtml = rubyToText(wordCardHtml); // 注音標示;			
        wordCardHtml = htmlToImage(wordCardHtml);
        wordCardHtml = iframeToVocaroo(wordCardHtml);
        wordCardHtml = iframeToYoutube(wordCardHtml);

        shareTxtB = shareTxtB + wordCardHtml + "¦";
        shareHtml.push(wordCard.innerHTML);
        shareText.push(wordCard.textContent);
        //id,色彩,top,left,zIndex,可否移動;字體|文字;
    });
    if (how == "shareHtml") {
        let out = shareHtml.join("\n");
        copyThat(out);
        alert('已複製Html到剪貼簿');
        return;
    } else if (how == "shareText") {
        let out = shareText.join("\n");
        copyThat(out);
        alert('已複製shareText到剪貼簿');
        return;
    } else if (how == "txt-tab") {
        let out = shareHtml.join("\t");
        copyThat(out);
        alert('已複製txt-tab到剪貼簿');
        return;
    }


    //params.set('wordCards', JSON.stringify(sharedData));
    var params = new URLSearchParams();
    shareTxtB = shareTxtB.replace(/ /g, '　');
    shareTxtB = shareTxtB.replace(/&amp;/g, '＆');
    shareTxtB = shareTxtB.replace(/\#/g, '＃');
    shareTxtB = shareTxtB.replace(/\+/g, '＋');
    shareTxtB = shareTxtB.replace(/&lt;/g, '＜');
    shareTxtB = shareTxtB.replace(/&gt;/g, '＞');

    shareTxtB = compressString(shareTxtB);


    //params.set('txtCards', shareTxt + "¦" + encodeURIComponent(shareTxtB));
    //params.set('txtCards', shareTxt + "¦" + shareTxtB);
	params.set('txtCards', shareTxt + "¦" + shareTxtB + "¡¦" + 
		Number(Number(nowX).toFixed(2)) + "," + 
		Number(Number(nowY).toFixed(2)) + "," + 
		Number(Number(nowScale).toFixed(2))
	);

    var urlWithoutParams = new URL(location.href);
    urlWithoutParams.search = '';

    var longURL = urlWithoutParams.href + '?' + params.toString();

    //var longURL = urlWithoutParams.href + '?' + decodeURIComponent(params.toString());




    if (longURL.startsWith("http")) {
        // 偵測是否以http開頭;
        const originalUrl = longURL;

        shortenUrl(originalUrl)
            .then((shortenedUrl) => {
                console.log("縮短後的網址:", shortenedUrl);
                // 在這裡處理縮短後的網址
                copyThat(shortenedUrl);
                alert('🥷已複製 短網址 到剪貼簿');
            })
            .catch((error) => {
                copyThat(longURL);
                alert('🥷已複製 長網址 到剪貼簿');
                console.error("無法縮短網址:", error);
            });
    } else {
        // 如果不是以http開頭的離線檔，則不縮短網址;
        //copyThat(longURL);
        copyThat(decodeURIComponent(longURL));
        alert('🥷已複製 長網址 到剪貼簿');
    }
}


// 縮短網址，用 Tinyurl;
async function shortenUrl(originalUrl) {
    const apiUrl = "https://tinyurl.com/api-create.php?url=";
    const encodedUrl = encodeURIComponent(originalUrl);
    const shortenApiUrl = apiUrl + encodedUrl;

    try {
        const response = await fetch(shortenApiUrl);
        const shortenedUrl = await response.text();
        return shortenedUrl;
    } catch (error) {
        console.error("🥷無法縮短網址:", error);
        return originalUrl;
    }
}

// 複製到剪貼簿;
function copyThat(x) {
    var dummyTextArea = document.createElement('textarea');
    dummyTextArea.value = x;
    document.body.appendChild(dummyTextArea);
    dummyTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(dummyTextArea);
}

// 返回無參數的原始網址;
function redirectToUrl() {
    var result = confirm("🥷這將會清除，並無法復原。\n確定要一切重來，建立新檔嗎？");
    if (result) {
        var urlWithoutParams = new URL(location.href);
        urlWithoutParams.search = '';
        var redirectTo = urlWithoutParams.href;
        window.location.href = redirectTo;
    } else {
        return;
    }
}

restoreWordCardsFromURL();
// 解析分享網址並恢復語詞卡;
function restoreWordCardsFromURL() {
    var params = new URLSearchParams(location.search);
    var sharedData = params.get('wordCards');
    var txtData = params.get('txtCards');
    var newData = params.get('new');

    if (sharedData) {
        var parsedData = JSON.parse(sharedData);
        parsedData.forEach(function(cardData) {
            var wordCard = document.createElement('div');
            wordCard.id = cardData.id;
            wordCard.className = cardData.class;
            wordCard.innerHTML = cardData.content;
            wordCard.style.position = 'absolute';
            wordCard.style.top = cardData.top + 'px';
            wordCard.style.left = cardData.left + 'px';
            makeDraggable(wordCard);
            wordCard.addEventListener('dblclick', function(e) {
                makeCardEditable(this);
            });
            canvas.appendChild(wordCard);
        });
    }
    if (txtData) {
        txtData = decompressString(txtData);
        txtData = txtData.replace(/　/g, " ");
        txtData = txtData.replace(/＆/g, "&");
        txtData = txtData.replace(/＃/g, "#");
        txtData = txtData.replace(/＋/g, "+");
        txtData = txtData.replace(/＜/g, "<");
        txtData = txtData.replace(/＞/g, ">");


        var data = txtData.split("¡¦").filter(Boolean);
        let arrA = data[0].split("¡").filter(Boolean);
        let arrB = data[1].split("¦").filter(Boolean);


       if (data.length >= 3) {
            let positionData = data[2].split(",");
            nowX = parseFloat(positionData[0]);
            nowY = parseFloat(positionData[1]);
            nowScale = parseFloat(positionData[2]);
            
            // 立即套用位置和縮放
            resetZoom();
        }

        let len = arrA.length;
        //id,色彩,top,left|文字︴;
        for (let i = 0; i < len; i++) {
            let x = arrA[i].split(",");
            let wordCard = document.createElement('div');
            wordCard.id = "wordCard-" + x[0];
            wordCard.className = "wordCard " + "cardColor-" + x[1];
            wordCard.style.top = x[2] + 'px';
            wordCard.style.left = x[3] + 'px';
            wordCard.setAttribute('draggable', x[4]); // 拖曳屬性;
            wordCard.style.zIndex = x[5];
            wordCard.style.fontSize = x[6] + 'px';
            wordCard.style.transform = 'scaleX(' + x[7] + ') rotate(' + x[8] + 'deg)';

            //--------;
            let wordCardHtml = txtToSelectOption(arrB[i]); //{{}}轉下拉選單;
            wordCardHtml = textToRuby(wordCardHtml); // [\]轉 ruby;
            wordCardHtml = youtubeToIframe(wordCardHtml);
            wordCardHtml = vocarooToIframe(wordCardHtml);
            wordCardHtml = imageToHTML(wordCardHtml);

            wordCard.innerHTML = wordCardHtml;
            wordCard.style.position = 'absolute';
            makeDraggable(wordCard);
            wordCard.addEventListener('contextmenu', showContextMenu);
            wordCard.addEventListener('dblclick', function(e) {
                makeCardEditable(this);
            });
            canvas.appendChild(wordCard);
        }
    }
    if (newData) {
        let newTxt = decodeURIComponent(newData);
        createWordCard(newTxt);
    }
    const wordCards = document.querySelectorAll('.wordCard');
    // 語詞卡點擊事件
    wordCards.forEach(card => {
        card.addEventListener('click', () => {

        });
    });
}




// 範圍內隨機數字;
function mathRandom(n, m) {
    // 隨機0~3的整數 mathRandom(0, 3);
    // 隨機4~9以內的數 mathRandom(4, 9)
    var num = Math.floor(Math.random() * (m - n + 1) + n)
    return num
}

// 切換字串;
function toggleTxt(element, txtA, txtB) {
    // onclick = "toggleTxt(this, '🔍', '🔎')"
    element.textContent = (element.textContent === txtA) ? txtB : txtA;
}

function renameWordCardIds() {
    var wordCards = document.getElementsByClassName("wordCard");

    // 將語詞卡元素轉為陣列
    var wordCardsArray = Array.from(wordCards);

    // 依照語詞卡的位置排序
    wordCardsArray.sort(function(a, b) {
        var rectA = a.getBoundingClientRect();
        var rectB = b.getBoundingClientRect();

        if (rectA.top === rectB.top) {
            return rectA.left - rectB.left;
        } else {
            return rectA.top - rectB.top;
        }
    });

    // 重新命名id
    for (var i = 0; i < wordCardsArray.length; i++) {
        var newId = "wordCard-" + (i + 1);
        wordCardsArray[i].id = newId;
        //wordCardsArray[i].style.zIndex = i + 1; // 並設置z-index;
    }
}

// 縮放;
function zoom(scaleFactor, card) {
    //var card = document.getElementById(id);

    var elements = card.querySelectorAll("img, iframe");

    elements.forEach(function(element) {
        var currentWidth = parseFloat(element.getAttribute("width")) || parseFloat(getComputedStyle(element).width);
        var currentHeight = parseFloat(element.getAttribute("height")) || parseFloat(getComputedStyle(element).height);

        var newWidth = currentWidth * scaleFactor;
        var newHeight = currentHeight * scaleFactor;

        element.setAttribute("width", newWidth);
        element.setAttribute("height", newHeight);
        element.style.width = newWidth + "px";
        element.style.height = newHeight + "px";
    });
    let newSize = (parseFloat(getComputedStyle(card).fontSize) * scaleFactor) + "px";
    var elements = card.querySelectorAll("select, span, p, div, label");
    elements.forEach(function(e) {
        e.style.fontSize = newSize;
    });
    card.style.fontSize = newSize;
}

var documentContextMenu = 0;
// 顯示選單，桌面選單
document.addEventListener('contextmenu', function(event) {
    // 如果點擊的是語詞卡或其子元素，不顯示桌面選單
    if (event.target.closest('.wordCard')) return;
    
    if (viewMode) return;  // 檢視模式不顯示選單
    
    event.preventDefault();  // 阻止預設右鍵選單
    
    // 如果有選單已開啟，先關閉它
    closeMenu();

    // 建立自訂的選單
	var menu = document.createElement('div');
	menu.id = 'contextMenu';

	// 只保留需要動態設定的位置屬性
    const pos = calculateMenuPosition(event.clientX, event.clientY);
    menu.style.left = pos.x + 'px';
    menu.style.top = pos.y + 'px';

    // 綁定 contextmenu 事件並阻止預設行為
    menu.addEventListener('contextmenu', function(event) {
        event.preventDefault();
    });

    // 建立下拉選單：字體
    var fontSelect = document.createElement('select');
    fontSelect.style.width = '100%';
    fontSelect.id = 'fontSelectMenu';
    fontSelect.innerHTML = `
		<optgroup label="">
			<option value="" disabled selected>字體</option>
			<option value="台灣楷體">台灣楷</option>
			<option value="台灣宋體">台灣宋</option>
			<option value="台灣黑體">台灣黑</option>
			<option value="台灣萌體">台灣萌</option>
			<option value="微軟正黑體">微軟黑</option>
			<option value="ㄅ字嗨注音標楷">注音楷</option>
		</optgroup>
	`;
    menu.appendChild(fontSelect);

    // 監聽字體下拉選單的變動事件
    fontSelect.addEventListener("change", function() {
        var selectedValue = this.value;
        wordCards.forEach(function(card) {
            card.style.fontFamily = selectedValue;
        });
    });

    // 建立下拉選單：尺寸
    var fontSizeSelect = document.createElement('select');
    fontSizeSelect.style.width = '100%';
    fontSizeSelect.id = 'fontSizeSelectMenu';
    fontSizeSelect.innerHTML = `
		<optgroup label="">
			<option value="" disabled selected>尺寸</option>
			<option value="16px">16</option>
			<option value="24px">24</option>
			<option value="32px">32</option>
			<option value="48px">48</option>
			<option value="64px">64</option>
		</optgroup>
	`;
    menu.appendChild(fontSizeSelect);

    // 監聽尺寸下拉選單的變動事件
    fontSizeSelect.addEventListener("change", function() {
        var selectedValue = this.value;
        wordCards.forEach(function(card) {
            card.style.fontSize = selectedValue;
        });
    });


    // 建立下拉選單：底色;
    var colorSelect = document.createElement('select');
    colorSelect.style.width = '100%';
    colorSelect.id = 'colorSelectMenu';
    colorSelect.onchange = function() {
        let selectedColor = this.value;
        wordCards.forEach(function(card) {
            if (selectedColor == 0) {
                let myColor = mathRandom(1, 6);
                card.className = card.className.replace(/cardColor-\d+/, "cardColor-" + myColor);
            } else {
                card.className = card.className.replace(/cardColor-\d+/, "cardColor-" + selectedColor);
            }
        });
    };


    // 建立選單項目
    var defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '底色';
    colorSelect.appendChild(defaultOption);

    var colorOptions = document.getElementById('colorSelect').options;
    for (var i = 1; i < colorOptions.length; i++) {
        var option = document.createElement('option');
        option.value = colorOptions[i].value;
        option.textContent = colorOptions[i].textContent;
        colorSelect.appendChild(option);
    }
    menu.appendChild(colorSelect);


    // 建立下拉選單：位在
    positionSelect = document.createElement('select');
    //positionSelect.style.width = '100%';
    positionSelect.id = 'positionSelect';
    positionSelect.innerHTML = `
        <option value="" disabled>位在</option>
        <option value="top" selected>上</option>
        <option value="middle">中</option>
        <option value="bottom">下</option>
        <option value="lines-left">左</option>
		<option value="newOrder">新序</option>
    `;
    menu.appendChild(positionSelect);

    // 將選單加入到頁面中
    document.body.appendChild(menu);


    // 建立按鈕：重排
    var rearrangeButton = document.createElement('button');
    rearrangeButton.textContent = '重排';
    rearrangeButton.onclick = function() {
        positionSelect = document.getElementById('positionSelect');
        selectedPosition = positionSelect.value;

        //定義重排的對象;
        var selectedCards = document.querySelectorAll('.selected');
        if (selectedCards.length < 1) {
            rearrangeWordCards(selectedPosition, '.wordCard');
        } else {
            rearrangeWordCards(selectedPosition, '.selected');
        }

        document.removeEventListener('click', hideContextMenu);
        menu.parentNode.removeChild(menu);
        documentContextMenu = 0;
    };
    menu.appendChild(rearrangeButton);


    // 建立選單項目：放大
    var zoomInItem = document.createElement('div');
    zoomInItem.textContent = '➕ 加大';
    zoomInItem.onclick = function() {
        wordCards.forEach(function(card) {
            zoom(1.2, card);
        });
    };
    menu.appendChild(zoomInItem);

    // 建立選單項目：縮小
    var zoomOutItem = document.createElement('div');
    zoomOutItem.textContent = '➖ 縮小';
    zoomOutItem.onclick = function() {
        wordCards.forEach(function(card) {
            zoom(0.8, card);
        });
    };
    menu.appendChild(zoomOutItem);


    var alignItem = document.createElement('div');
    alignItem.textContent = '對齊方式▾';
    alignItem.onclick = function() {
        alignContainer = document.getElementById('alignContainer');
        alignContainer.classList.toggle('show');
    };
    menu.appendChild(alignItem);


    var alignContainer = document.createElement('span');
    alignContainer.id = 'alignContainer';
    alignContainer.className = 'menuContainer';
    alignContainer.style.display = 'none'; // 預設隱藏
    menu.appendChild(alignContainer);


    // 靠上對齊;
    var newItem = document.createElement('span');
    newItem.textContent = '上';
    newItem.onclick = function() {
        alignWordCards(wordCards, 'top')
    };
    alignContainer.appendChild(newItem);

    // 靠下對齊;
    var newItem = document.createElement('span');
    newItem.textContent = '下';
    newItem.onclick = function() {
        alignWordCards(wordCards, 'bottom')
    };
    alignContainer.appendChild(newItem);

    // 靠左對齊;
    var newItem = document.createElement('span');
    newItem.textContent = '左';
    newItem.onclick = function() {
        alignWordCards(wordCards, 'left')
    };
    alignContainer.appendChild(newItem);

    // 靠右對齊;
    var newItem = document.createElement('span');
    newItem.textContent = '右';
    newItem.onclick = function() {
        alignWordCards(wordCards, 'right')
    };
    alignContainer.appendChild(newItem);

    // 靠丰對齊;
    var newItem = document.createElement('span');
    newItem.textContent = '丰';
    newItem.onclick = function() {
        alignWordCards(wordCards, 'middle')
    };
    alignContainer.appendChild(newItem);

    // 靠卅對齊;
    var newItem = document.createElement('span');
    newItem.textContent = '卅';
    newItem.onclick = function() {
        alignWordCards(wordCards, 'center')
    };
    alignContainer.appendChild(newItem);


    var shareTypeItem = document.createElement('div');
    shareTypeItem.textContent = '分享方式▾';
    shareTypeItem.onclick = function() {
        shareTypeContainer = document.getElementById('shareTypeContainer');
        shareTypeContainer.classList.toggle('show');
    };
    menu.appendChild(shareTypeItem);


    var shareTypeContainer = document.createElement('div');
    shareTypeContainer.id = 'shareTypeContainer';
    shareTypeContainer.className = 'menuContainer';
    shareTypeContainer.style.display = 'none'; // 預設隱藏
    menu.appendChild(shareTypeContainer);

    // 建立選單項目：分享此頁;
    var shareAllItem = document.createElement('div');
    shareAllItem.textContent = '分享此頁';
    shareAllItem.onclick = function() {
        shareWordCards();
        document.removeEventListener('click', hideContextMenu);
        menu.parentNode.removeChild(menu);
        documentContextMenu = 0;
    };
    shareTypeContainer.appendChild(shareAllItem);

    // 建立選單項目：匯出文字;
    var shareHtmlItem = document.createElement('div');
    shareHtmlItem.textContent = '匯出文本';
    shareHtmlItem.onclick = function() {
        shareWordCards('shareHtml');
        document.removeEventListener('click', hideContextMenu);
        menu.parentNode.removeChild(menu);
        documentContextMenu = 0;
    };
    shareTypeContainer.appendChild(shareHtmlItem);

    // 建立選單項目：匯出文字;
    var shareTextItem = document.createElement('div');
    shareTextItem.textContent = '匯出純文字';
    shareTextItem.onclick = function() {
        shareWordCards('shareText');
        document.removeEventListener('click', hideContextMenu);
        menu.parentNode.removeChild(menu);
        documentContextMenu = 0;
    };
    shareTypeContainer.appendChild(shareTextItem);

    var pinPinItem = document.createElement('div');
    pinPinItem.textContent = '釘住選項▾';
    pinPinItem.onclick = function() {
        pinPinContainer = document.getElementById('pinPinContainer');
        pinPinContainer.classList.toggle('show');
    };
    menu.appendChild(pinPinItem);


    var pinPinContainer = document.createElement('div');
    pinPinContainer.id = 'pinPinContainer';
    pinPinContainer.className = 'menuContainer';
    pinPinContainer.style.display = 'none'; // 預設隱藏
    menu.appendChild(pinPinContainer);


    // 建立選單項目：全部釘住;
    var notDaggableWordCardsItem = document.createElement('div');
    notDaggableWordCardsItem.textContent = '釘住全部';
    notDaggableWordCardsItem.onclick = function() {
        wordCards.forEach(function(wordCard) {
            wordCard.setAttribute('draggable', "x");
        });
        document.removeEventListener('click', hideContextMenu);
        menu.parentNode.removeChild(menu);
        documentContextMenu = 0;
    };
    pinPinContainer.appendChild(notDaggableWordCardsItem);

    // 建立選單項目：全部不釘;
    var canDraggableWordCardsItem = document.createElement('div');
    canDraggableWordCardsItem.textContent = '全部不釘';
    canDraggableWordCardsItem.onclick = function() {
        wordCards.forEach(function(wordCard) {
            wordCard.setAttribute('draggable', "o");
        });
        document.removeEventListener('click', hideContextMenu);
        menu.parentNode.removeChild(menu);
        documentContextMenu = 0;
    };
    pinPinContainer.appendChild(canDraggableWordCardsItem);

    // 建立選單項目：反轉釘住;
    var toggleDraggableWordCardsItem = document.createElement('div');
    toggleDraggableWordCardsItem.textContent = '反轉釘住';
    toggleDraggableWordCardsItem.onclick = function() {
        wordCards.forEach(function(wordCard) {
            toggleDraggable(wordCard);
        });
        document.removeEventListener('click', hideContextMenu);
        menu.parentNode.removeChild(menu);
        documentContextMenu = 0;
    };
    pinPinContainer.appendChild(toggleDraggableWordCardsItem);


    var showHideItem = document.createElement('div');
    showHideItem.textContent = '顯隱選項▾';
    showHideItem.onclick = function() {
        showHideContainer = document.getElementById('showHideContainer');
        showHideContainer.classList.toggle('show');
    };
    menu.appendChild(showHideItem);


    var showHideContainer = document.createElement('div');
    showHideContainer.id = 'showHideContainer';
    showHideContainer.className = 'menuContainer';
    showHideContainer.style.display = 'none'; // 預設隱藏
    menu.appendChild(showHideContainer);

    // 顯示所有語詞卡;
    var showAllCardsItem = document.createElement('div');
    showAllCardsItem.textContent = '顯示全部';
    showAllCardsItem.onclick = function() {
        toggleAllCards(wordCards, 1);
    };
    showHideContainer.appendChild(showAllCardsItem);

    // 隱藏所有語詞卡;
    var hideAllCardsItem = document.createElement('div');
    hideAllCardsItem.textContent = '全部隱藏';
    hideAllCardsItem.onclick = function() {
        toggleAllCards(wordCards, 0);
    };
    showHideContainer.appendChild(hideAllCardsItem);

    // 反轉顯隱所有語詞卡;
    var toggleAllCardsItem = document.createElement('div');
    toggleAllCardsItem.textContent = '反轉顯隱';
    toggleAllCardsItem.onclick = function() {
        toggleAllCards(wordCards, );
    };
    showHideContainer.appendChild(toggleAllCardsItem);


    var rotateItem = document.createElement('div');
    rotateItem.textContent = '旋轉方式▾';
    rotateItem.onclick = function() {
        rotateContainer = document.getElementById('rotateContainer');
        rotateContainer.classList.toggle('show');
    };
    menu.appendChild(rotateItem);


    var rotateContainer = document.createElement('div');
    rotateContainer.id = 'rotateContainer';
    rotateContainer.className = 'menuContainer';
    rotateContainer.style.display = 'none'; // 預設隱藏
    menu.appendChild(rotateContainer);

    // 顯示右轉選項
    var rotateRightItem = document.createElement('div');
    rotateRightItem.textContent = '右轉15';
    rotateRightItem.onclick = function() {
        rotateSelectedCard(wordCards, 15);
    };
    rotateContainer.appendChild(rotateRightItem);

    // 顯示左轉選項
    var rotateLeftItem = document.createElement('div');
    rotateLeftItem.textContent = '左轉15';
    rotateLeftItem.onclick = function() {
        //var wordCards = document.querySelectorAll('.wordCard'); 
        rotateSelectedCard(wordCards, -15);
    };
    rotateContainer.appendChild(rotateLeftItem);

    // 顯示右轉90選項
    var rotateRight90Item = document.createElement('div');
    rotateRight90Item.textContent = '右轉90';
    rotateRight90Item.onclick = function() {
        //var wordCards = document.querySelectorAll('.wordCard'); 
        rotateSelectedCard(wordCards, 90);
    };
    rotateContainer.appendChild(rotateRight90Item);

    // 顯示水平翻轉選項
    var flipHorizontalItem = document.createElement('div');
    flipHorizontalItem.textContent = '水平翻轉';
    flipHorizontalItem.onclick = function() {
        //var wordCards = document.querySelectorAll('.wordCard'); 
        flipSelectedCardHorizontal(wordCards);
    };
    rotateContainer.appendChild(flipHorizontalItem);

    // 建立選單項目：全部清除;
    var clearWordCardsItem = document.createElement('div');
    clearWordCardsItem.textContent = '全部回收';
    clearWordCardsItem.onclick = function() {

        wordCards.forEach(function(wordCard) {
            wordCard.classList.remove('selected'); //刪除所有語詞卡的 .selected 屬性;
            deletedWordCards.push({
                element: wordCard,
                top: wordCard.offsetTop,
                left: wordCard.offsetLeft
            }); // 將語詞卡及其原始位置加入已刪除的語詞卡陣列
            wordCard.parentNode.removeChild(wordCard);
        });

        document.removeEventListener('click', hideContextMenu);
        menu.parentNode.removeChild(menu);
        documentContextMenu = 0;
    };
    menu.appendChild(clearWordCardsItem);

    // 建立選單項目：取回刪除;
    var restoreCardsItem = document.createElement('div');
    restoreCardsItem.textContent = '撿回刪除';
    restoreCardsItem.onclick = function() {
        restoreWordCard();
    };
    menu.appendChild(restoreCardsItem);



    // 建立選單項目：一切重來;
    var clearWordCardsItem = document.createElement('div');
    clearWordCardsItem.textContent = '一切重來';
    clearWordCardsItem.onclick = function() {
        redirectToUrl();
        document.removeEventListener('click', hideContextMenu);
        menu.parentNode.removeChild(menu);
        documentContextMenu = 0;
    };
    menu.appendChild(clearWordCardsItem);

    // 建立選單項目：全螢幕;
    var fullScreenItem = document.createElement('div');
    fullScreenItem.textContent = '全螢幕';
    fullScreenItem.onclick = function() {
        toggleFullScreen();
    };
    menu.appendChild(fullScreenItem);
	document.body.appendChild(menu);
	currentMenu = menu;
});

// 點擊其他區域時關閉選單
document.addEventListener('click', function(event) {
    if (!event.target.closest('#contextMenu')) {
        closeMenu();
    }
});
// 切換所有語詞卡的顯示狀態;
function toggleAllCards(wordCards, how) {
    if (how == "none" || how == 0) {
        wordCards.forEach(function(card) {
            card.style.display = 'none';
        });
    } else if (how == "block" || how == 1) {
        wordCards.forEach(function(card) {
            card.style.display = 'block';
        });
    } else {
        wordCards.forEach(function(card) {
            if (card.style.display === 'none') {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
}
var cardOptionsContainer;

// 旋轉;
function rotateSelectedCard(wordCards, deg) {
    wordCards.forEach(function(wordCard) {
        var currentTransform = wordCard.style.transform;
        var currentRotateDeg = 0;
        var currentScaleX = 1;
        if (currentTransform) {
            var rotateRegex = /rotate\((-?\d+)deg\)/;
            var scaleXRegex = /scaleX\((-?\d+)\)/;
            var rotateMatch = currentTransform.match(rotateRegex);
            var scaleXMatch = currentTransform.match(scaleXRegex);
            if (rotateMatch && rotateMatch[1]) {
                currentRotateDeg = parseFloat(rotateMatch[1]);
            }
            if (scaleXMatch && scaleXMatch[1]) {
                currentScaleX = parseFloat(scaleXMatch[1]);
            }
        }

        // 修正逆時針旋轉邏輯
        if (currentScaleX < 0) {
            currentRotateDeg -= deg;
        } else {
            currentRotateDeg += deg;
        }

        var newRotateDeg;

        if (deg == 90) {
            // 計算新的旋轉角度，使其以90度的倍數進行旋轉
            newRotateDeg = Math.round(currentRotateDeg / 90) * 90;
        } else {
            newRotateDeg = currentRotateDeg;
        }

        wordCard.style.transform = 'scaleX(' + currentScaleX + ') rotate(' + newRotateDeg + 'deg)';
    });
}

// 翻轉;
function flipSelectedCardHorizontal(wordCards) {
    wordCards.forEach(function(wordCard) {
        var currentTransform = wordCard.style.transform;
        var currentRotateDeg = 0;
        var currentScaleX = 1;
        if (currentTransform) {
            var rotateRegex = /rotate\((-?\d+)deg\)/;
            var scaleXRegex = /scaleX\((-?\d+)\)/;
            var rotateMatch = currentTransform.match(rotateRegex);
            var scaleXMatch = currentTransform.match(scaleXRegex);
            if (rotateMatch && rotateMatch[1]) {
                currentRotateDeg = parseFloat(rotateMatch[1]);
            }
            if (scaleXMatch && scaleXMatch[1]) {
                currentScaleX = parseFloat(scaleXMatch[1]);
            }
        }
        var newScaleX = currentScaleX * -1;
        wordCard.style.transform = 'scaleX(' + newScaleX + ') rotate(' + currentRotateDeg + 'deg)';
    });
}

// 檢查網址參數並顯示按鈕;
checkUrlParams();

function checkUrlParams() {
    var urlParams = new URLSearchParams(window.location.search);
    var hasTxtCards = urlParams.has('txtCards');
    var hasNew = urlParams.has('new');
    var hasWordCards = urlParams.has('wordCards');

    if (hasTxtCards || hasNew || hasWordCards) {
        document.getElementById('updateFiles').style.display = 'inline';
    }
}
//================================;
// 獲取按鈕和所有語詞卡
document.getElementById('selectModeButton').addEventListener('click', function() {
    selectMode = !selectMode;
    this.classList.toggle('active');
    document.body.classList.toggle('selecting', selectMode);

    // 新增：當關閉選取模式時，清除所有已選取的語詞卡
    if (!selectMode) {
        const selectedCards = document.querySelectorAll('.wordCard.selected');
        selectedCards.forEach(card => {
            card.classList.remove('selected');
        });
        // 確保選擇框也隱藏
        if (selectBox) {
            selectBox.style.display = 'none';
        }
    }
});



// 框選相關的程式碼
let isSelecting = false;
let startX = 0;
let startY = 0;
const selectBox = document.getElementById('selectBox') || createSelectBox();

// 創建 selectBox 如果不存在
function createSelectBox() {
    const box = document.createElement('div');
    box.id = 'selectBox';
    document.body.appendChild(box);
    return box;
}

// 監聽滑鼠按下事件
document.addEventListener('mousedown', function(e) {
    if (selectMode) {
        // 如果點擊的是語詞卡或其他控制元件，不啟動框選
        if (e.target.classList.contains('wordCard') ||
            e.target.closest('.inputContainer') ||
            e.target.closest('#ox2')) {
            return;
        }
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;
        selectBox.style.left = startX + 'px';
        selectBox.style.top = startY + 'px';
        selectBox.style.width = '0';
        selectBox.style.height = '0';
        selectBox.style.display = 'block';
        e.preventDefault();
    }
});

// 監聽滑鼠移動事件
document.addEventListener('mousemove', function(e) {
    if (!isSelecting) return;

    // 計算選擇框的尺寸和位置
    const width = Math.abs(e.clientX - startX);
    const height = Math.abs(e.clientY - startY);
    const left = Math.min(e.clientX, startX);
    const top = Math.min(e.clientY, startY);

    // 更新選擇框的樣式
    selectBox.style.width = width + 'px';
    selectBox.style.height = height + 'px';
    selectBox.style.left = left + 'px';
    selectBox.style.top = top + 'px';

    // 檢查每個語詞卡是否在選擇框內
    const cards = document.querySelectorAll('.wordCard');
    const selectRect = selectBox.getBoundingClientRect();

    cards.forEach(card => {
        const cardRect = card.getBoundingClientRect();

        // 檢查是否有重疊
        const overlap = !(
            selectRect.right < cardRect.left ||
            selectRect.left > cardRect.right ||
            selectRect.bottom < cardRect.top ||
            selectRect.top > cardRect.bottom
        );

        // 如果有重疊，添加 selected 類別
        if (overlap) {
            card.classList.add('selected');
        }
    });
});

// 監聽滑鼠放開事件
document.addEventListener('mouseup', function() {
    if (isSelecting) {
        isSelecting = false;
        selectBox.style.display = 'none';
    }
});

// 防止滑鼠移出視窗時選擇框仍然顯示
document.addEventListener('mouseleave', function() {
    if (isSelecting) {
        isSelecting = false;
        selectBox.style.display = 'none';
    }
});

function alignWordCards(wordCards, direction) {
    // 取得所有語詞卡的元素集合
    var len = wordCards.length;

    // 初始化變數，用於記錄對齊的位置
    var alignPositionX = 0;
    var alignPositionY = 0;

    // 找出對齊的位置，根據不同的對齊方向
    switch (direction) {
        case "top":
            for (var i = 0; i < len; i++) {
                var rect = wordCards[i].getBoundingClientRect();
                if (rect.top < alignPositionY || alignPositionY === 0) {
                    alignPositionY = rect.top;
                }
            }
            break;

        case "bottom":
            for (var i = 0; i < len; i++) {
                var rect = wordCards[i].getBoundingClientRect();
                var bottom = rect.top + rect.height;
                if (bottom > alignPositionY) {
                    alignPositionY = bottom;
                }
            }
            break;

        case "left":
            for (var i = 0; i < len; i++) {
                var rect = wordCards[i].getBoundingClientRect();
                if (rect.left < alignPositionX || alignPositionX === 0) {
                    alignPositionX = rect.left;
                }
            }
            break;

        case "right":
            for (var i = 0; i < len; i++) {
                var rect = wordCards[i].getBoundingClientRect();
                var right = rect.left + rect.width;
                if (right > alignPositionX) {
                    alignPositionX = right;
                }
            }
            break;

        case "middle":
            for (var i = 0; i < len; i++) {
                var rect = wordCards[i].getBoundingClientRect();
                alignPositionX += rect.left + rect.width / 2;
            }
            alignPositionX /= len; // 計算水平方向上的平均值，以實現水平置中
            break;

        case "center":
            for (var i = 0; i < len; i++) {
                var rect = wordCards[i].getBoundingClientRect();
                alignPositionY += rect.top + rect.height / 2;
            }
            alignPositionY /= len; // 計算垂直方向上的平均值，以實現垂直置中
            break;

        default:
            break;
    }

    // 將所有語詞卡進行對齊
    for (var j = 0; j < wordCards.length; j++) {
        switch (direction) {
            case "top":
                wordCards[j].style.top = alignPositionY + "px";
                break;

            case "bottom":
                var rect = wordCards[j].getBoundingClientRect();
                var top = alignPositionY - rect.height;
                wordCards[j].style.top = top + "px";
                break;

            case "left":
                wordCards[j].style.left = alignPositionX + "px";
                break;

            case "right":
                var rect = wordCards[j].getBoundingClientRect();
                var left = alignPositionX - rect.width;
                wordCards[j].style.left = left + "px";
                break;

            case "middle":
                var rect = wordCards[j].getBoundingClientRect();
                var left = alignPositionX - rect.width / 2;
                wordCards[j].style.left = left + "px";
                break;

            case "center":
                var rect = wordCards[j].getBoundingClientRect();
                var top = alignPositionY - rect.height / 2;
                wordCards[j].style.top = top + "px";
                break;

            default:
                break;
        }
    }
}

function txtToSelectOption(txt) {
    const pattern = /{{(.*?)}}/g;
    const hasMatches = txt.match(pattern); // 檢查是否有符合的模式;

    if (hasMatches) {
        const outputTxt = txt.replace(pattern, function(match, p1) {
            const options = p1
                .trim()
                .split(' ')
                .map(option => `<option>${option}</option>`)
                .join('');
            return `<select>${options}</select>`;
        });
        return outputTxt;
    } else {
        return txt; // 沒有符合的模式，直接返回原始的 txt;
    }
}

function selectOptionToTxt(inputStr) {
    const pattern = /<select>(.*?)<\/select>/g;
    const hasMatches = inputStr.match(pattern); // 檢查是否有符合的模式

    if (hasMatches) {
        const outputStr = inputStr.replace(pattern, function(match, p1) {
            const options = p1
                .match(/<option>(.*?)<\/option>/g)
                .map(option => option.replace(/<option>|<\/option>/g, ''))
                .join(' ');

            return `{{${options}}}`;
        });

        return outputStr;
    } else {
        return inputStr; // 沒有符合的模式，直接返回原始的 inputStr
    }
}

function textToRuby(inputStr) {
    const pattern = /\[\s*([^[\]]+)\s*\\\s*([^[\]]+)\s*\]/g;
    const hasMatches = inputStr.match(pattern); // 檢查是否有符合的模式

    if (hasMatches) {
        const outputStr = inputStr.replace(pattern, function(match, p1, p2) {
            p1 = p1.trim().replace(/\s/g, '&nbsp;');
            p2 = p2.trim().replace(/\s/g, '&nbsp;');
            return `<ruby>${p2}<rt>${p1}</rt></ruby>`;
        });

        return outputStr;
    } else {
        return inputStr; // 沒有符合的模式，直接返回原始的 inputStr
    }
}

function rubyToText(inputStr) {
    const pattern = /<ruby>(.*?)<rt>(.*?)<\/rt><\/ruby>/g;
    const hasMatches = inputStr.match(pattern); // 檢查是否有符合的模式

    if (hasMatches) {
        const outputStr = inputStr.replace(pattern, function(match, p1, p2) {
            return `[${p2}\\${p1}]`;
        });
        return outputStr;
    } else {
        return inputStr; // 沒有符合的模式，直接返回原始的 inputStr
    }
}

function youtubeToIframe(inputStr) {
    const pattern = /https:\/\/(www\.)?youtu\.be\/([\w-]+)(\?[^?&]+)?(&[^?&]+)*|https:\/\/(www\.)?youtube\.com\/watch\?v=([\w-]+)(\&[^?&]+)*(.)*|https:\/\/(www\.)?youtube\.com\/shorts\/([\w-]+)(\&[^?&]+)*(.)*/g;
    const outputStr = inputStr.replace(pattern, '<iframe width="300" src="https://www.youtube.com/embed/$2$6$10" allowfullscreen></iframe>');
    return outputStr;
}

function iframeToYoutube(inputStr) {
    const pattern = /<iframe[^>]*src=["']https:\/\/www\.youtube\.com\/embed\/([\w-]+)[^>]*>[^<]*<\/iframe>/g;
    const outputStr = String(inputStr).replace(pattern, 'https://youtu.be/$1');
    return outputStr;
}

function vocarooToIframe(inputStr) {
    const pattern = /https:\/\/voc(aroo.com|a.ro)\/([\w-]+)/g;
    const outputStr = inputStr.replace(pattern, '<iframe src="https://vocaroo.com/embed/$2?autoplay=0" frameborder="0" scrolling="no" width="80" height="30"></iframe>');
    return outputStr;
}

function iframeToVocaroo(inputStr) {
    const pattern = /<iframe[^>]*src=["']https:\/\/vocaroo\.com\/embed\/([\w-]+)[^>]*>.*?<\/iframe>/g;
    const outputStr = String(inputStr).replace(pattern, 'https://voca.ro/$1');
    return outputStr;
}

function imageToHTML(inputStr) {
    const pattern = /(https?:\/\/[\w\-\.\/]+\.(jpg|png|gif|svg))/g;
    const outputStr = inputStr.replace(pattern, '<img src="$1" width="100">');
    return outputStr;
}

function htmlToImage(inputStr) {
    const pattern = /<img\s+src="([^"]+)"\s+width="(\d+)"\s*\/?>/g;
    const outputStr = String(inputStr).replace(pattern, '$1');
    return outputStr;
}

function audioToHTML(inputStr) {
    const pattern = /(https?:\/\/[\w\-\.\/]+\.(mp3|wav))/g;
    const outputStr = inputStr.replace(pattern, '<k onclick="p(this, \'$1\')">🔊</k>');
    return outputStr;
}

function htmlToAudio(inputStr) {
    const pattern = /<k\s+onclick="p\(this,\s+'([^']+)'\)">\🔊<\/k>/g;
    const outputStr = String(inputStr).replace(pattern, '$1');
    return outputStr;
}

function urlConverter(inputStr) {
    // 匹配不同格式的正則表達式
    const patterns = [
        // 格式3: <網址 連結名稱 title文字>
        {
            pattern: /^<(https?:\/\/[^>\s]+)\s+([^>\s]+)\s+([^>]+)>$/g,
            replacement: '$2 <a href="$1" title="$3">🔗</a>'
        },
        // 格式2: <網址 連結名稱>
        {
            pattern: /^<(https?:\/\/[^>\s]+)\s+([^>]+)>$/g,
            replacement: '$2 <a href="$1">🔗</a>'
        },
        // 格式1: <網址>
        {
            pattern: /^<(https?:\/\/[^>\s]+)>$/g,
            replacement: '⋮⋮<a href="$1">🔗</a>'
        },
        // 格式4: [連結名稱](網址 "title文字")
        {
            pattern: /^\[([^\]]+)\]\((https?:\/\/[^\s)"]+)(?:\s+"([^"]+)")?\)$/g,
            replacement: (match, text, url, title) => 
                title 
                    ? `${text} <a href="${url}" title="${title}">🔗</a>`
                    : `${text} <a href="${url}">🔗</a>`
        },
        // 格式5: 網址 連結名稱
        {
            pattern: /^(https?:\/\/[^>\s]+)\s+([^>\s]+)(?:\s+([^\s]+))?$/g,
            replacement: (match, url, text, title) =>
                title
                    ? `${text} <a href="${url}" title="${title}">🔗</a>`
                    : `${text} <a href="${url}">🔗</a>`
        },
        // 格式6: 純網址（以 http:// 或 https:// 開頭且後面無空格）
        {
            pattern: /^(https?:\/\/[^\s]+)$/g,
            replacement: '⋮⋮<a href="$1">🔗</a>'
        }
    ];
    
    // 移除首尾空白
    let outputStr = String(inputStr).trim();
    
    // 尋找匹配的格式並轉換
    for (const { pattern, replacement } of patterns) {
        if (pattern.test(outputStr)) {
            // 重置 lastIndex，因為我們使用了 g 標誌
            pattern.lastIndex = 0;
            return outputStr.replace(pattern, replacement);
        }
    }
    return outputStr;
}

function urlConverter(inputStr) {
    // 匹配不同格式的正則表達式
    const patterns = [
        // 格式3: <網址 連結名稱 title文字>
        {
            pattern: /^<(https?:\/\/[^>\s]+)\s+([^>\s]+)\s+([^>]+)>$/g,
            replacement: '$2 <a href="$1" title="$3">🔗</a>'
        },
        // 格式2: <網址 連結名稱>
        {
            pattern: /^<(https?:\/\/[^>\s]+)\s+([^>]+)>$/g,
            replacement: '$2 <a href="$1">🔗</a>'
        },
        // 格式1: <網址>
        {
            pattern: /^<(https?:\/\/[^>\s]+)>$/g,
            replacement: ':::<a href="$1">🔗</a>'
        },
        // 格式4: [連結名稱](網址 "title文字")
        {
            pattern: /^\[([^\]]+)\]\((https?:\/\/[^\s)"]+)(?:\s+"([^"]+)")?\)$/g,
            replacement: (match, text, url, title) => 
                title 
                    ? `${text} <a href="${url}" title="${title}">🔗</a>`
                    : `${text} <a href="${url}">🔗</a>`
        },
        // 格式5: 網址 連結名稱 [可選的title文字]
        {
            pattern: /^(https?:\/\/[^>\s]+)\s+([^>\s]+)(?:\s+([^\s]+))?$/g,
            replacement: (match, url, text, title) =>
                title
                    ? `${text} <a href="${url}"  title="${title}">🔗</a>`
                    : `${text} <a href="${url}" >🔗</a>`
        },
        // 格式6: 純網址
        {
            pattern: /^(https?:\/\/[^\s]+)$/g,
            replacement: ':::<a href="$1">🔗</a>'
        }
    ];
    
    // 移除首尾空白
    let outputStr = String(inputStr).trim();
    
    // 尋找匹配的格式並轉換
    for (const { pattern, replacement } of patterns) {
        if (pattern.test(outputStr)) {
            pattern.lastIndex = 0;
            return outputStr.replace(pattern, replacement);
        }
    }
    return outputStr;
}

function urlConverterReverse(htmlStr) {
    // 移除首尾空白
    let inputStr = String(htmlStr).trim();
    
    // 匹配不同的 HTML 格式並還原
    const patterns = [
        // 帶有 title 的鏈接
        {
            pattern: /^([^<]+)\s+<a href="(https?:\/\/[^"]+)" target="_blank" title="([^"]+)">🔗<\/a>$/,
            getOriginal: (match, text, url, title) => {
                // 如果文字和 URL 完全相同，返回純 URL 格式
                if (text === url) {
                    return url;
                }
                // 否則返回 URL + 文字 + title 格式
                return `${url} ${text} ${title}`;
            }
        },
        // 不帶 title 的鏈接
        {
            pattern: /^([^<]+)\s+<a href="(https?:\/\/[^"]+)" target="_blank">🔗<\/a>$/,
            getOriginal: (match, text, url) => {
                // 如果文字和 URL 完全相同，返回純 URL 格式
                if (text === url) {
                    return url;
                }
                // 否則返回 URL + 文字格式
                return `${url} ${text}`;
            }
        },
        // 純 URL 鏈接
        {
            pattern: /^<a href="(https?:\/\/[^"]+)" target="_blank">🔗<\/a>$/,
            getOriginal: (match, url) => url
        }
    ];
    
    // 尋找匹配的格式並還原
    for (const { pattern, getOriginal } of patterns) {
        const match = inputStr.match(pattern);
        if (match) {
            return getOriginal(...match);
        }
    }
    
    return inputStr;
}


// 全螢幕切換;
function toggleFullScreen() {
    if (document.fullscreenElement) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
}

// 全螢幕進入;
function enterFullscreen() {
    var element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

// 全螢幕退出;
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}


var currentElement = null;
var currentAudio = null;

function p(e, url) {
    toggleAudio(e, url);
}
// 播放音訊;
function toggleAudio(element, audioUrl) {
    var buttonText = element.textContent.trim();

    audioUrl = audioUrl.replace(/\<(zh)(;|:)(.*?)\>/, (match, p1, p2, p3) => {
        return `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh_tw&client=tw-ob&ttsspeed=1&q=${encodeURIComponent(p3)}`;
    });

    audioUrl = audioUrl.replace(/<([a-zA-Z]*)(:|;)([^>]*)>/g, (match, p1, p2, p3) => {
        return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${p1}&client=tw-ob&ttsspeed=0.3&q=${encodeURIComponent(p3)}`;
    });

    audioUrl = audioUrl.replace(/([A-Za-z0-9\-_]+)(;|:)(holo|ho|minnan|min)/g, (match, p1) => {
        return `https://oikasu.com/file/mp3holo/${p1}.mp3`;
    });
    audioUrl = audioUrl.replace(/([A-Za-z0-9\-_]+)(;|:)(kasu|ka)/g, (match, p1) => {
        return `https://oikasu.com/file/mp3/${p1}.mp3`;
    });
    console.log(audioUrl)
    /*
            w = w.replace(/([A-Za-z0-9\-_]+)\.holo/g, "https://oikasu.com/file/mp3holo/$1.mp3");
            w = w.replace(/([A-Za-z0-9\-_]+)\.kasu/g, "https://oikasu.com/file/mp3/$1.mp3");
            w = w.replace(/([A-Za-z0-9\-_]+)\.ka/g, function(match, p1) {
                let x = p1.replace(/([a-z])z\b/g, "$1ˊ")
                    .replace(/([a-z])v\b/g, "$1ˇ")
                    .replace(/([a-z])x\b/g, "$1ˆ")
                    .replace(/([a-z])f\b/g, "$1⁺")
                    .replace(/([a-z])s\b/g, "$1ˋ");
                return "https://oikasu.com/file/mp3/" + p1 + ".mp3" + x + " ";
            });
    */

    if (currentElement === element && currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        element.textContent = "🔊";
    } else {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentElement.textContent = "🔊";
        }
        currentAudio = new Audio(audioUrl);
        currentAudio.play();
        currentElement = element;
        element.textContent = "🔉";

        currentAudio.addEventListener('ended', function() {
            // 如果已經播完了;
            element.textContent = "🔊";
        });
    }
}


/*
var currentElement = null;
var currentAudio = null;
// 播放音訊;
function p(e, url) {
	toggleAudio(e, url);
}
// 播放音訊;
function toggleAudio(element, audioUrl) {
  if (currentElement === element && currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  } else {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    currentAudio = new Audio(audioUrl);
    currentAudio.play();
    currentElement = element;
  }
}
*/


// 預載音訊;
function preloadAudios() {
    var audioUrls = findElementsWithOnClickAndURL();
    audioUrls.forEach(function(url) {
        var audio = new Audio();
        audio.src = url;
    });
}

function findElementsWithOnClickAndURL() {
    var selector = "[onclick]";
    var matchedElements = document.querySelectorAll(selector);
    var audioUrls = [];

    matchedElements.forEach(function(element) {
        var onclickValue = element.getAttribute("onclick");
        var urls = onclickValue.match(/http.*\.(?:mp3|wav)/g);
        if (urls) {
            audioUrls = audioUrls.concat(urls);
        }
    });
    return audioUrls;
}

// 尋找所有含有 {{}} 的元素，並進行取代
//const elementsWithBrackets = document.querySelectorAll(':contains("{{")');
//elementsWithBrackets.forEach(element => replaceWithSelect(element));



/*
// 假設你有一個按鈕元素，並且給它一個 id 為 "moveButton"
const moveButton = document.getElementById('moveButton');

// 假設你有一個全域變數用來表示是否處於移動模式
let isMovingMode = false;

// 按鈕點擊事件
moveButton.addEventListener('click', () => {
    moveButtonClick();
    moveGhostCardsGame();
});

function moveButtonClick() {
    isMovingMode = !isMovingMode; // 切換移動模式

    // 設定對象是全部語詞卡，或是被選取的語詞卡;
    var wordCards;
    wordCards = document.querySelectorAll('.selected');
    if (wordCards.length < 1) {
        wordCards = document.querySelectorAll('.wordCard');
    }


    if (isMovingMode) {
        // 處於移動模式，添加鍵盤事件監聽器
        document.addEventListener('keydown', handleKeyPress);
    } else {
        // 不在移動模式，移除鍵盤事件監聽器
        document.removeEventListener('keydown', handleKeyPress);
    }
}
*/

/*
// 鍵盤事件處理函式
function handleKeyPress(event) {
    if (!isMovingMode) return; // 如果不在移動模式，則不處理鍵盤事件

    const key = event.key;
    // 設定對象是全部語詞卡，或是被選取的語詞卡;
    var wordCards;
    wordCards = document.querySelectorAll('.selected');
    if (wordCards.length < 1) {
        wordCards = document.querySelectorAll('.wordCard');
    }

    // 根據按下的方向鍵進行移動
    switch (key) {
        case 'ArrowUp':
            moveWordCards(wordCards, 0, -10); // 在垂直方向上向上移動
            break;
        case 'ArrowDown':
            moveWordCards(wordCards, 0, 10); // 在垂直方向上向下移動
            break;
        case 'ArrowLeft':
            moveWordCards(wordCards, -10, 0); // 在水平方向上向左移動
            break;
        case 'ArrowRight':
            moveWordCards(wordCards, 10, 0); // 在水平方向上向右移動
            break;
        default:
            break;
    }
}


// 移動語詞卡的函式
function moveWordCards(wordCards, dx, dy) {
    wordCards.forEach(function(card) {
        // 獲取目前的位置
        const currentX = parseFloat(card.style.left) || 0;
        const currentY = parseFloat(card.style.top) || 0;

        // 計算新的位置
        const newX = currentX + dx;
        const newY = currentY + dy;

        // 設定新的位置
        card.style.left = newX + 'px';
        card.style.top = newY + 'px';
    });
}


//-----------------------------------;


// 全域變數用於儲存定時器的 ID
let ghostCardsTimer;

function moveGhostCardsGame() {

    // 清除先前的定時器，以防止速度累加
    if (ghostCardsTimer) {
        clearInterval(ghostCardsTimer);
    }

    // 獲取視窗的寬度和高度
    function getWindowSize() {
        return {
            width: window.innerWidth - 10,
            height: window.innerHeight - 10
        };
    }

    // 移動語詞卡的函式（包含隨機移動和碰撞檢測）
    function moveGhostCards() {
        const wordCards = document.querySelectorAll('.selected');

        wordCards.forEach(function(card) {
            if (!card.hasOwnProperty('moveDirection')) {
                // 如果語詞卡還未指定移動方向，則隨機選擇一個方向
                card.moveDirection = Math.random() * 360; // 使用角度表示方向（0到359度）
            }

            const windowSize = getWindowSize();
            const cardRect = card.getBoundingClientRect();

            // 獲取語詞卡的目前位置
            const currentX = parseFloat(card.style.left) || 0;
            const currentY = parseFloat(card.style.top) || 0;

            // 計算移動方向的向量（使用三角函數）
            const moveDistance = 5; // 移動的距離
            const dx = moveDistance * Math.cos(card.moveDirection * (Math.PI / 180));
            const dy = moveDistance * Math.sin(card.moveDirection * (Math.PI / 180));

            // 計算新的位置
            const newX = currentX + dx;
            const newY = currentY + dy;

            // 碰撞檢測
            if (newX < 10 || newX + cardRect.width > windowSize.width) {
                // 如果語詞卡碰到左右邊界，則反彈（改變水平方向）
                card.moveDirection = 180 - card.moveDirection;
            }

            if (newY < 10 || newY + cardRect.height > windowSize.height) {
                // 如果語詞卡碰到上下邊界，則反彈（改變垂直方向）
                card.moveDirection = 360 - card.moveDirection;
            }

            // 更新語詞卡的位置
            card.style.left = newX + 'px';
            card.style.top = newY + 'px';
        });
    }

    // 使用定時器每隔一段時間移動語詞卡（例如每隔 10 毫秒）
    ghostCardsTimer = setInterval(moveGhostCards, 20);
}

*/


document.addEventListener('DOMContentLoaded', function() {
    const currentColorBtn = document.querySelector('.current-color');
    const bgColorMenu = document.getElementById('bgColorMenu');
    const canvasContainer = document.getElementById('canvas-container');

    // 設定初始背景色
    const initialColor = localStorage.getItem('canvasBackgroundColor') || 'white';
    canvasContainer.style.backgroundColor = initialColor;
    currentColorBtn.style.backgroundColor = initialColor;

    // 修改：點擊目前色彩按鈕時切換選單顯示狀態
    currentColorBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        bgColorMenu.classList.toggle('show');  // 改用 show 類別
    });

    // 修改：點擊色彩圈圈時更改背景色
    bgColorMenu.addEventListener('click', function(e) {
        const colorCircle = e.target.closest('.color-circle');
        if (colorCircle && colorCircle.hasAttribute('data-color')) {
            const color = colorCircle.getAttribute('data-color');
            
            // 更新背景色和目前色彩按鈕
            canvasContainer.style.backgroundColor = color;
            currentColorBtn.style.backgroundColor = color;
            
            // 收合選單
            bgColorMenu.classList.remove('show');
            
            // 更新文字顏色
            //canvasContainer.style.color = (color === 'rgb(30,30,30)') ? 'white' : 'black';
            
            localStorage.setItem('canvasBackgroundColor', color);
        }
    });

    // 修改：點擊其他地方時關閉選單
    document.addEventListener('click', function(e) {
        if (!currentColorBtn.contains(e.target) && !bgColorMenu.contains(e.target)) {
            bgColorMenu.classList.remove('show');
        }
    });
});


        // 當頁面載入完成時執行
        window.onload = function() {
            const urlParams = new URLSearchParams(window.location.search);
            const encodedUrl = urlParams.get('txtCards');
            if (encodedUrl) {
                decodeAndNavigate(encodedUrl);
            }
        };
        function decodeAndNavigate(encodedUrl) {
            try {
                const decodedUrl = decodeURIComponent(encodedUrl);
                if (isValidUrl(decodedUrl)) {
                    window.location.href = decodedUrl;
                }
            } catch (error) {
                console.error('解碼錯誤:', error);
            }
        }
        function isValidUrl(url) {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        }
