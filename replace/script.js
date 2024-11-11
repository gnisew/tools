let imeCangjie, imeDapu, imeData, imeEnglish, imeHailu, imeHolo, imeKepin, imeKimmng, imeMapin, imeMatsu, imeRaoping, imeSixian, imeTailo;
(async () => {
await new Promise(resolve => {
const imeScript = document.createElement('script');
imeScript.src = 'ime.js';
imeScript.onload = resolve;
document.head.appendChild(imeScript);
});
var imeLink = document.createElement("link");
imeLink.rel = "stylesheet";
imeLink.href = "styles.css";
var imeHead = document.getElementsByTagName("head")[0];
imeHead.appendChild(imeLink);
const imeHtml = `
<div>
<div id="imeDraggableArea">
<div id="imePinyinArea"></div>
<div id="imePinyinAreaShow"></div>
<div id="imeSuggestions"></div>
</div>
<div id="imeSettingsArea">☰
<span id="imeSettingsButton">⚙</span>
<span id="imeTogglePinyinInput">關</span>
</div>
<div id="imeSettingsWindow" class="ime-settings-window">
<h2>烏衣行輸入法</h2>
<div>
<label for="imeInputMethod">輸入法：</label>
<select id="imeInputMethod">
<option>四縣</option>
<option>海陸</option>
<option>大埔</option>
<option>饒平</option>
<option>詔安</option>
<option>客拼</option>
<option>閩南</option>
<option>金門</option>
<option>台羅</option>
<option>馬祖</option>
<option>馬拼</option>
<option>倉頡</option>
<option>英語</option>
</select>
</div>
<div>
<label for="imeInputMode">輸入模式：</label>
<select id="imeInputMode">
<option>數字調</option>
<option>字母調</option>
<option>無聲調</option>
</select>
</div>
<div>
<label for="imeFont">字體：</label>
<select id="imeFont">
<option>楷體</option>
<option>黑體</option>
<option>宋體</option>
</select>
</div>
<div>
<label for="imeFontSize">字體大小：</label>
<select id="imeFontSize">
<option>預設</option>
<option>中</option>
<option>大</option>
</select>
</div>
<div>
<label for="imeDisplayMode">候選方式：</label>
<select id="imeDisplayMode">
<option>橫式</option>
<option>直式</option>
</select>
</div>
<div>
<label for="imePositionMode">候選位置：</label>
<select id="imePositionMode">
<option>游標下方</option>
<option>游標上方</option>
<option>固定在下</option>
<option>自訂位置</option>
</select>
</div>
<div>
<label for="imePageSwitchButtons">換頁按鈕：</label>
<select id="imePageSwitchButtons">
<option>&lt; &gt;</option>
<option>[ ]</option>
<option>- +</option>
</select>
</div>
<button id="imeUpdateSettings">更新</button>
<button id="imeCloseSettings">關閉</button>
<button id="imeApplySettings">確定</button>
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
const imeInputMethodSelect = document.getElementById('imeInputMethod');
const imeDisplayMode = document.getElementById('imeDisplayMode');
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

imeInputMethodSelect.addEventListener('change', function() {
const selectedIme = imeMapping[this.value] || imeMapping['default'];
imePinyinToHanzi = imeParseImeData(selectedIme);
});

imeTogglePinyinInput.addEventListener('click', imeToggleIme);

function imeToggleIme() {
imePinyinInputEnabled = !imePinyinInputEnabled;
imeTogglePinyinInput.textContent = imePinyinInputEnabled ? '關' : '開';
imePinyinArea.innerText = '';
}

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
if (/^[a-v,x,z]$/.test(event.key) && !event.ctrlKey && !event.altKey && !event.shiftKey) {
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
const imePageSwitchButtons = document.getElementById('imePageSwitchButtons').value;
let imeNextPageKey, imePrevPageKey;

if (imePageSwitchButtons === '< >') {
imeNextPageKey = '.';
imePrevPageKey = ',';
} else if (imePageSwitchButtons === '[ ]') {
imeNextPageKey = ']';
imePrevPageKey = '[';
} else if (imePageSwitchButtons === '- +') {
imeNextPageKey = '=';
imePrevPageKey = '-';
}

if (imePinyinInputEnabled && currentPinyin) {
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
} else if ((key === imeNextPageKey || key === imePrevPageKey) && imePinyinToHanzi[currentPinyin]) {
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
}
});

document.getElementById('imeSettingsButton').addEventListener('click', function() {
const imeSettingsWindow = document.getElementById('imeSettingsWindow');
imeSettingsWindow.style.display = (imeSettingsWindow.style.display === 'block') ? 'none' : 'block';
});

document.getElementById('imeCloseSettings').addEventListener('click', function() {
document.getElementById('imeSettingsWindow').style.display = 'none';
});

document.getElementById('imeUpdateSettings').addEventListener('click', function() {});

document.getElementById('imeApplySettings').addEventListener('click', function() {
imeApplySettings();
document.getElementById('imeSettingsWindow').style.display = 'none';
});

function imeApplySettings() {
const imeDisplayModeValue = imeDisplayMode.value;
if (imeDisplayModeValue === '橫式') {
imeDraggableArea.style.flexDirection = 'row';
} else {
imeDraggableArea.style.flexDirection = 'column';
}
}

imeDisplayMode.addEventListener('change', function() {
const imeDisplayModeValue = this.value;
imeSuggestions.innerHTML = '';
if (imeDisplayModeValue === '直式') {
imeSuggestions.style.flexDirection = 'column';
imeSuggestionItems.forEach(item => {
item.style.display = 'block';
item.style.clear = 'both';
});
} else if (imeDisplayModeValue === '橫式') {
imeSuggestions.style.flexDirection = 'row';
imeSuggestionItems.forEach(item => {
item.style.display = 'inline-block';
item.style.clear = 'none';
});
}
});

document.getElementById('imeFontSize').addEventListener('change', function() {
const imeFontSize = this.value;
if (imeFontSize === '大') {
imeDraggableArea.style.fontSize = '22px';
} else if (imeFontSize === '中') {
imeDraggableArea.style.fontSize = '18px';
} else {
imeDraggableArea.style.fontSize = '16px';
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
})();

