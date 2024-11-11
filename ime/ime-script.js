const imeStyle = document.createElement('style');
imeStyle.textContent = `

`;
document.head.appendChild(imeStyle);



















let imeCangjie, imeDapu, imeData, imeEnglish, imeHailu, imeHolo, imeKepin, imeKimmng, imeMapin, imeMatsu, imeRaoping, imeSixian, imeTailo;


(async () => {




await new Promise(resolve => {
    const imeScript = document.createElement('script');
    imeScript.src = 'ime-data.js';
    imeScript.onload = resolve;
    document.head.appendChild(imeScript);
});




const imeHtml = `
<div>
<div id="imeDraggableArea">
<div id="imePinyinArea"></div>
<div id="imePinyinAreaShow"></div>
<div id="imeSuggestions"></div>
</div>
<div id="imeSettingsArea">🥷
<label class="ime-checkbox-container">
  <input type="checkbox" id="imeTogglePinyinInput" checked>
  <span class="ime-checkbox-custom"></span>
</label>
<span class="ime-dropdown">
  <span class="ime-dropbtn">詔安</span>
  <div class="ime-dropdown-content">
    <a href="#" data-method="四縣">四縣</a>
    <a href="#" data-method="海陸">海陸</a>
    <a href="#" data-method="大埔">大埔</a>
    <a href="#" data-method="饒平">饒平</a>
    <a href="#" data-method="詔安">詔安</a>
    <a href="#" data-method="客拼">客拼</a>
    <a href="#" data-method="閩南">閩南</a>
    <a href="#" data-method="金門">金門</a>
    <a href="#" data-method="台羅">台羅</a>
    <a href="#" data-method="馬祖">馬祖</a>
    <a href="#" data-method="馬拼">馬拼</a>
    <a href="#" data-method="倉頡">倉頡</a>
    <a href="#" data-method="英語">英語</a>
  </div>
</span>
<span id="imeFontSizeToggle">小</span>
<span id="imeDisplayModeToggle">橫</span>
</div>
</div>
`;
document.body.innerHTML = document.body.innerHTML + imeHtml;
const imePinyinArea = document.getElementById('imePinyinArea');
const imeSuggestions = document.getElementById('imeSuggestions');
const imeSuggestionItems = document.querySelectorAll('.ime-suggestion');
const imeDraggableArea = document.getElementById('imeDraggableArea');
const imeSettingsArea = document.getElementById('imeSettingsArea');
const imeTogglePinyinInput = document.getElementById('imeTogglePinyinInput');
const imeDisplayMode = document.getElementById('imeDisplayMode');

const imeDropbtn = document.querySelector('.ime-dropbtn');
const imeFontSizeToggle = document.getElementById('imeFontSizeToggle');
const imeDisplayModeToggle = document.getElementById('imeDisplayModeToggle');
const imeDropdownContent = document.querySelector('.ime-dropdown-content');


let imeActiveInputElement = null;
let imePinyinInputEnabled = true;
let imeCurrentIndex = 0;

function imeParseImeData(imeData) {
    const imePinyinToHanzi = {};
    const imeLines = imeData.trim().split('\n');
    imeLines.forEach(line => {
        const [pinyin, characters] = line.split(':');
        if (imePinyinToHanzi[pinyin]) {
            imePinyinToHanzi[pinyin] = [...new Set([...imePinyinToHanzi[pinyin], ...characters.split(',')])];
        } else {
            imePinyinToHanzi[pinyin] = characters.split(',');
        }
    });
    return imePinyinToHanzi;
}

let imePinyinToHanzi = imeParseImeData(imeData);

const imeMapping = {
    '四縣': imeSixian,
    '海陸': imeHailu,
    '大埔': imeDapu,
    '饒平': imeRaoping,
    '詔安': imeKasu,
    '客拼': imeKepin,
    '閩南': imeHolo,
    '金門': imeKimmng,
    '台羅': imeTailo,
    '馬祖': imeMatsu,
    '馬拼': imeMapin,
    '倉頡': imeCangjie,
    '英語': imeEnglish,
    'default': imeData
};




document.querySelectorAll('input, textarea, [contenteditable="true"]').forEach(imeInputElement => {
    imeInputElement.addEventListener('focus', function() {
        imeActiveInputElement = this;
    });
    imeInputElement.addEventListener('keydown', function(event) {
        if (imePinyinInputEnabled) {
            imeInterceptKeyInput(event);
        }
    });
});

function imeUpdateSuggestions(currentPinyin) {
    imeSuggestions.innerHTML = '';
    if (imePinyinToHanzi[currentPinyin]) {
        const characters = imePinyinToHanzi[currentPinyin];
        const maxIndex = Math.min(imeCurrentIndex + 9, characters.length);
        for (let i = imeCurrentIndex; i < maxIndex; i++) {
            const character = characters[i];
            const imeSuggestionSpan = document.createElement('span');
            const imeNumberSpan = document.createElement('span');
            imeNumberSpan.innerText = `${i - imeCurrentIndex + 1}`;
            imeNumberSpan.className = 'ime-number-span';
            imeSuggestionSpan.appendChild(imeNumberSpan);
            imeSuggestionSpan.innerHTML += `${character}`;
            imeSuggestionSpan.className = 'ime-suggestion';
            imeSuggestionSpan.addEventListener('click', () => {
                imeInsertCharacterAtCursor(character);
            });
            imeSuggestions.appendChild(imeSuggestionSpan);
        }
    }
}

function imeInterceptKeyInput(event) {
    if (!imePinyinInputEnabled) return;
    // 如果按下的是字母 a-z，且沒有按下其他修飾鍵
    if (/^[a-vxz]$/.test(event.key) && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault(); // 防止編碼出現在輸入框
        imePinyinArea.innerText += event.key;
        imeUpdateSuggestions(imePinyinArea.innerText);
    }
}

function imeInsertCharacterAtCursor(character) {
    if (!imeActiveInputElement) return;
    if (imeActiveInputElement.isContentEditable) {
        // 處理 contenteditable 元素
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const textNode = document.createTextNode(character);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        // 處理一般input和textarea
        const start = imeActiveInputElement.selectionStart;
        const end = imeActiveInputElement.selectionEnd;
        const text = imeActiveInputElement.value;
        // 使用 substr() 而非 slice() 來正確處理擴充漢字
        imeActiveInputElement.value = text.substr(0, start) + character + text.substr(end);
        // 設定正確的游標位置
        imeActiveInputElement.setSelectionRange(start + character.length, start + character.length);
    }
    // 清空編碼區
    imePinyinArea.innerText = '';
    imeSuggestions.innerHTML = '';
}

// 更新按鍵事件處理
document.addEventListener('keydown', function(event) {
    const key = event.key;
    const currentPinyin = imePinyinArea.innerText;

    let imeNextPageKey = '.';
    let imePrevPageKey = ',';


	if ((key === imeNextPageKey || key === imePrevPageKey) && imePinyinToHanzi[currentPinyin] ) {
            const characters = imePinyinToHanzi[currentPinyin];
            if (key === imeNextPageKey) {
                if (imeCurrentIndex + 9 < characters.length) {
                    imeCurrentIndex += 9;
                } else {
                    imeCurrentIndex = characters.length - (characters.length % 9);
                }
            } else if (key === imePrevPageKey) {
                imeCurrentIndex = Math.max(0, imeCurrentIndex - 9);
            }
            imeUpdateSuggestions(currentPinyin);
            event.preventDefault();
        }
       else if (imePinyinInputEnabled && currentPinyin) {
        // Enter鍵處理 - 直接輸入編碼
        if (key === 'Enter') {
            imeInsertCharacterAtCursor(currentPinyin);
            event.preventDefault();
        } else if (key === 'w') {
            let pinyin = zvsxflToTailuo(currentPinyin);
            imeInsertCharacterAtCursor(pinyin);
            event.preventDefault();
        }
        // 空白鍵處理 - 選擇第一個候選字
        else if (key === ' ' && document.getElementsByClassName('ime-suggestion').length > 0) {
            const firstSuggestion = document.getElementsByClassName('ime-suggestion')[0];
            if (firstSuggestion) {
                firstSuggestion.click();
                event.preventDefault();
                imeCurrentIndex = 0;
            }
        }
        // 數字鍵處理 - 選擇對應候選字
        else if (key >= '1' && key <= '9' && document.getElementsByClassName('ime-suggestion').length > 0) {
            const index = parseInt(key) - 1;
            const suggestion = document.getElementsByClassName('ime-suggestion')[index];
            if (suggestion) {
                suggestion.click();
                event.preventDefault();
                imeCurrentIndex = 0;
            }
        }


        // 繼續前一部分的按鍵事件處理
        else if (key === 'Escape' && currentPinyin) {
            imePinyinArea.innerText = '';
            imeSuggestions.innerHTML = '';
            event.preventDefault();
        }
        // Backspace處理 - 刪除最後一個編碼字元
        else if (key === 'Backspace' && currentPinyin) {
            imePinyinArea.innerText = currentPinyin.slice(0, -1);
            imeUpdateSuggestions(imePinyinArea.innerText);
            event.preventDefault();
        }
    }
});






function imeMakeDraggable(element) {
    let imeActive = false,
        imeCurrentX = 0,
        imeCurrentY = 0,
        imeInitialX = 0,
        imeInitialY = 0,
        imeXOffset = 0,
        imeYOffset = 0;

    element.addEventListener('mousedown', imeDragStart, false);
    document.addEventListener('mouseup', imeDragEnd, false);
    document.addEventListener('mousemove', imeDrag, false);

    function imeDragStart(e) {
        imeInitialX = e.clientX - imeXOffset;
        imeInitialY = e.clientY - imeYOffset;
        if (e.target === element || element.contains(e.target)) {
            imeActive = true;
        }
    }

    function imeDragEnd() {
        imeInitialX = imeCurrentX;
        imeInitialY = imeCurrentY;
        imeActive = false;
    }

    function imeDrag(e) {
        if (imeActive) {
            e.preventDefault();
            imeCurrentX = e.clientX - imeInitialX;
            imeCurrentY = e.clientY - imeInitialY;
            imeXOffset = imeCurrentX;
            imeYOffset = imeCurrentY;
            imeSetTranslate(imeCurrentX, imeCurrentY, element);
        }
    }

    function imeSetTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
}

imeMakeDraggable(imeDraggableArea);
imeMakeDraggable(imeSettingsArea);





// 點擊按鈕切換下拉選單顯示狀態
imeDropbtn.addEventListener('click', function(e) {
  e.stopPropagation(); // 防止事件冒泡
  imeDropdownContent.classList.toggle('show');
});

// 點擊下拉選項後選取並收合選單
imeDropdownContent.addEventListener('click', function(e) {
  if (e.target.tagName === 'A') {
    e.preventDefault();
    const method = e.target.dataset.method;
    imeDropbtn.textContent = method;
    imeDropdownContent.classList.remove('show');
    const selectedIme = imeMapping[method] || imeMapping['default'];
    imePinyinToHanzi = imeParseImeData(selectedIme);
  }
});

// 點擊網頁其他地方時收合選單
document.addEventListener('click', function(e) {
  if (!e.target.matches('.ime-dropbtn')) {
    if (imeDropdownContent.classList.contains('show')) {
      imeDropdownContent.classList.remove('show');
    }
  }
});

// 點擊跳出選單時防止選單立即消失
imeDropdownContent.addEventListener('click', function(e) {
  e.stopPropagation();
});

// 輸入法選擇事件處理
document.querySelector('.ime-dropdown-content').addEventListener('click', function(e) {
  if (e.target.tagName === 'A') {
    e.preventDefault();
    const method = e.target.dataset.method;
    imeDropbtn.textContent = method;
    const selectedIme = imeMapping[method] || imeMapping['default'];
    imePinyinToHanzi = imeParseImeData(selectedIme);
  }
});

// 字體大小循環切換
const fontSizes = ['小', '中', '大'];
let currentFontSizeIndex = 0;

imeFontSizeToggle.addEventListener('click', function() {
  currentFontSizeIndex = (currentFontSizeIndex + 1) % fontSizes.length;
  const newSize = fontSizes[currentFontSizeIndex];
  this.textContent = newSize;
  
  if (newSize === '大') {
    imeDraggableArea.style.fontSize = '22px';
  } else if (newSize === '中') {
    imeDraggableArea.style.fontSize = '18px';
  } else {
    imeDraggableArea.style.fontSize = '16px';
  }
});

// 顯示模式循環切換
let isHorizontal = true;
imeDisplayModeToggle.addEventListener('click', function() {
  isHorizontal = !isHorizontal;
  this.textContent = isHorizontal ? '橫' : '直';
  
  if (!isHorizontal) {
    imeSuggestions.style.flexDirection = 'column';
    imeDraggableArea.style.flexDirection = 'column';
    document.querySelectorAll('.ime-suggestion').forEach(item => {
      item.style.display = 'block';
      item.style.clear = 'both';
    });
  } else {
    imeSuggestions.style.flexDirection = 'row';
    imeDraggableArea.style.flexDirection = 'row';
    document.querySelectorAll('.ime-suggestion').forEach(item => {
      item.style.display = 'inline-block';
      item.style.clear = 'none';
    });
  }
});



// 新增 change 事件監聽器
imeTogglePinyinInput.addEventListener('change', function() {
  imePinyinInputEnabled = this.checked;
  if (!imePinyinInputEnabled) {
    imePinyinArea.innerText = '';
    imeSuggestions.innerHTML = '';
  }
});

// 初始化狀態
imePinyinInputEnabled = imeTogglePinyinInput.checked;



})();

