var selectMode = false; // 選取模式的狀態
var deletedWordCards = []; // 儲存已刪除的語詞卡及其原始位置;
var lastClickTime = 0; // 在手機上連點兩下的時間計算;
var pressTimer; // 手機上長按的時間計算;

let scale = 1;
let panX = 0;
let panY = 0;
const canvas = document.getElementById('infinite-canvas');
const container = document.getElementById('canvas-container');



// 縮放功能
function setTransform() {
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
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
    scale = 1;
    panX = 0;
    panY = 0;
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
    panX += mouseX * (1 - scale/oldScale);
    panY += mouseY * (1 - scale/oldScale);
    
    setTransform();
});

// 檢查畫布是否有語詞卡的函數
function hasWordCards() {
    return document.querySelectorAll('.wordCard').length > 0;
}
// 平移功能
let isDragging = false;
let lastX, lastY;


container.addEventListener('mousedown', (e) => {
    if (selectMode) return; // 如果是選取模式，直接返回，不執行拖曳
	if (!hasWordCards()) return; // 如果沒有語詞卡，直接返回

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
});

// 防止拖曳超出範圍
container.addEventListener('mouseleave', () => {
    isDragging = false;
    container.style.cursor = 'default';
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
});

container.addEventListener('touchcancel', () => {
    if (isTouchSelecting) {
        isTouchSelecting = false;
        selectBox.style.display = 'none';
    }
    isTouchDragging = false;
});




//J01 建立語詞卡;
function createWordCard(txt) {
    var inputValue;
    inputValue = txt ?? document.getElementById('wordInput').value;
    //如果 txt 不是空值 undefined 或 null，則設為 txt 的值，否則設為 ('wordInput').value的值。;

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
			  // 設定卡片為編輯模式
			  this.setAttribute('contenteditable', 'true');
			  this.setAttribute('draggable', 'x'); // 禁止拖曳
			  this.style.cursor = 'text'; // 改變游標樣式
			  // 儲存原始內容
			  this.setAttribute('data-original-content', this.innerHTML);
			  
			  // 設置焦點
			  setTimeout(() => {
				this.focus();
				
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

				this.addEventListener('mousedown', handleCardClick);

				// 點擊其他地方時結束編輯
				const finishEditing = (e) => {
				  if (!this.contains(e.target)) {
					this.setAttribute('contenteditable', 'false');
					this.setAttribute('draggable', 'o'); // 恢復拖曳
					this.style.cursor = ''; // 恢復預設游標
					
					// 如果內容為空，恢復原始內容
					if (this.innerText.trim() === '') {
					  this.innerHTML = this.getAttribute('data-original-content');
					}
					
					// 移除相關的事件監聽器
					document.removeEventListener('mousedown', finishEditing);
					this.removeEventListener('mousedown', handleCardClick);
				  }
				};

				// 延遲添加點擊監聽，避免立即觸發
				setTimeout(() => {
				  document.addEventListener('mousedown', finishEditing);
				}, 100);
			  }, 0);
			});

			
            wordCard.addEventListener('contextmenu', showContextMenu);

            wordCard.addEventListener('touchstart', function(e) {
                pressTimer = setTimeout(function() {
                    this.addEventListener('contextmenu', showContextMenu);
                }.bind(this), 500); // 長按觸發時間設定為 500 毫秒;
            });
            canvas.appendChild(wordCard);
        });
    }
    // 如果語詞卡超出視窗寬度，排到下一行;
    rearrangeWordCards("top", ".cardAdd");
    // 重排新建的語詞卡;
    var cardAdd = document.querySelectorAll('.cardAdd');
    cardAdd.forEach(function(card) {
        card.classList.remove('cardAdd');
    });
    // 移除新建語詞卡的class;
    preloadAudios()
    // 預載音檔;
}


// 函式：清空輸入框文字
function clearInput() {
    document.getElementById('wordInput').value = '';
}

// 監聽輸入框的按鍵事件
document.getElementById('wordInput').addEventListener('keypress', function(e) {
    // 如果按下 Enter 鍵 (keyCode 13)
    if (e.key === 'Enter') {
        e.preventDefault(); // 防止預設的 enter 行為
        createWordCard(); // 呼叫建立卡片函式
    }
});

// 事件：監聽 input 輸入框的雙擊事件
var inputDoubleClickCount = 0; // 計數器，用於記錄連續點擊次數
var inputDoubleClickTimeout; // 計時器，用於清除計數器
document.getElementById('wordInput').addEventListener('dblclick', function() {
    inputDoubleClickCount++;
    if (inputDoubleClickCount == 1) {
        clearInput();
        inputDoubleClickCount = 0;
    } else {
        clearTimeout(inputDoubleClickTimeout);
        inputDoubleClickTimeout = setTimeout(function() {
            inputDoubleClickCount = 0;
        }, 300);
    }
});

let moveDistance = 0;
let startDragX = 0;
let startDragY = 0;

// 使元素可拖曳;
function makeDraggable(element) {
    var pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
    let isDragging = false;

    // 增加：儲存所有選取卡片的初始位置差值
    let selectedCardsOffsets = [];

    element.addEventListener('mousedown', dragMouseDown);
    element.addEventListener('touchstart', dragMouseDown);

    function dragMouseDown(e) {
        e = e || window.event;
        if (e.type === 'mousedown') {
            e.preventDefault();
        }

        var isDraggable = element.getAttribute('draggable');
        if (isDraggable == "x") return;

        // 記錄起始位置
        startDragX = e.clientX || e.touches[0].clientX;
        startDragY = e.clientY || e.touches[0].clientY;
        moveDistance = 0;

        // 修改：如果是選取模式，計算所有選取卡片與當前拖曳卡片的位置差值
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
    
    // 修改：計算新位置
    const newLeft = element.offsetLeft - pos1;
    const newTop = element.offsetTop - pos2;
    
    // 修改：如果是選取模式且當前卡片被選取
    if (selectMode && element.classList.contains('selected')) {
        // 移動所有選取的卡片
        selectedCardsOffsets.forEach(({card, offsetX, offsetY}) => {
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

        // 修改：只在非拖曳時切換選取狀態
        if (selectMode && moveDistance < 5) {
            element.classList.toggle('selected');
        }

        isDragging = false;
        moveDistance = 0;
        selectedCardsOffsets = []; // 清空暫存的位置差值
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
    //用 who 限定對象，如新建的或是全部;    
    //var positionSelect = document.getElementById('positionSelect');
    //var selectedPosition = positionSelect.value;
    var wordCards = Array.from(document.querySelectorAll(who));
    // 將「類陣列」對像轉換為陣列;
    var windowWidth 