let pairsNumber = 6; //頁面配對組數
let passCondition = 6; //預設過關條件的配對組數
let customTitle = "烏衣行對對碰";

let wordPairsString = `
貓	gif:209/animated-cat-image-0072.gift
狗	gif:202/animated-dog-image-0712.gif
ka;ngais	𠊎
ka:he	係
ka;kaz	客
ka;ngins	人
ka:vue	會
ka;gongˆ	講
ka:su	事
`;


const htmlTemplate = `
<div id="gameTitle" class="game-title">${customTitle}</div>

<div id="gameContainer" class="game-container"></div>
<div id="result" class="result"></div>
<div id="timer" class="timer">0:00</div>
<div id="score" class="score"></div>
<button id="startButton" class="start-button"></button>

<div id="inputContainer" class="input-container">  

  <div id="buttonContainer2" class="button-container2">
  <div id="numberSetting">
        <label id="pairsNumberLabel" for="pairsNumberSelect">配對</label>
		<select id="pairsNumberSelect">
		  <option value="2">2</option>
		  <option value="3">3</option>
		  <option value="4">4</option>
		  <option value="5">5</option>
		  <option value="6" selected>6</option>
		  <option value="7">7</option>
		  <option value="8">8</option>
		  <option value="9">9</option>
		  <option value="10">10</option>
		  <option value="11">11</option>
		  <option value="12">12</option>
		</select>

		<label id="passConditionLabel" for="passConditionSelect">過關</label>
		<select id="passConditionSelect">
		  <option value="2">2</option>
		  <option value="3">3</option>
		  <option value="4">4</option>
		  <option value="5">5</option>
		  <option value="6" selected>6</option>
		  <option value="7">7</option>
		  <option value="8">8</option>
		  <option value="9">9</option>
		  <option value="10">10</option>
		  <option value="11">11</option>
		  <option value="12">12</option>
		</select>
	</div>

	<button id="concelInputButton" class="concel-input-button">╳</button> 
	</div>
</div>



<div id="dock" class="dock">
  <button id="dockToggle" class="dock-toggle">↑</button>
  <div id="dock-content" class="dock-content">
    <button id="showInputButton" class="show-input-button">自訂</button>
	<div id="wesing" class="wesing">烏衣行</div>
  </div>
</div>
`;


// 將 HTML 模板插入到文檔中
document.body.innerHTML = htmlTemplate;

//載入 holowav 與 kasuMp3
loadCssJs('snd.js');

//載入字體CSS
loadCssJs('styles.css');
loadCssJs('https://oikasu.com/file/code2/css/style.css');

function loadCssJs(url) {
    const extension = url.split('.').pop().toLowerCase();
    if (extension === 'js') {
        const scriptElement = document.createElement('script');
        scriptElement.src = url;
        document.body.appendChild(scriptElement);
    } else if (extension === 'css') {
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = url;
        document.head.appendChild(linkElement);
    } else {
        console.error('Unsupported file type.');
    }
}

const gameContainer = document.getElementById('gameContainer'); //卡片容器
const resultDisplay = document.getElementById('result'); // 通知
const startButton = document.getElementById('startButton'); // 開始按紐
const timerDisplay = document.getElementById('timer'); // 時間
const scoreDisplay = document.getElementById('score'); // 分數
const gameTitle = document.getElementById('gameTitle'); // 標題
const wesing = document.getElementById('wesing'); // 標題
const pairsNumberSelect = document.getElementById('pairsNumberSelect');
const passConditionSelect = document.getElementById('passConditionSelect');
const concelInputButton = document.getElementById('concelInputButton'); // 取消按鈕
const inputContainer = document.getElementById('inputContainer'); // 輸入框容器
const dockToggle = document.getElementById('dockToggle'); // 伸縮台按鈕
const dock = document.getElementById('dock'); // 伸縮台按鈕

let selectedCards = []; // 點選的卡片被放置的陣列
let matchedPairs = 0; // 配對數
let gameStarted = false; // 初始化 gameStarted 變量為 false
let seconds = 0; // 初始化秒數
let score = 0; // 初始化分數
let timerInterval; // 計時器的 interval
let fullWordPairs = [];
let totalMatches = 0; // 配對的總次數
let correctMatches = 0; // 答對的次數
let wrongMatches = 0; // 答錯的次數
let accuracy = 0; //正確率

var wordPairs = "";



// 偵聽取消按鈕
concelInputButton.addEventListener('click', () => {
    inputContainer.style.display = 'none';
    gameContainer.style.visibility = 'visible';
});

pairsNumberSelect.addEventListener('change', function(event) {
  pairsNumber = parseInt(event.target.value, 10);
  basicSettings();
});

passConditionSelect.addEventListener('change', function(event) {
  passCondition = parseInt(event.target.value, 10);
  basicSettings();
});

// 偵聽開始按鈕
startButton.addEventListener('click', () => {
    startGame();
	scaleElement(gameContainer);
});

// 偵聽伸縮台按鈕
showInputButton.addEventListener('click', () => {
    inputContainer.style.display = 'block';
    dock.classList.toggle('open');
    dockToggle.textContent = dock.classList.contains('open') ? '↓' : '↑';
    gameContainer.style.visibility = 'hidden';
});


// 偵聽伸縮台按鈕開合
dockToggle.addEventListener('click', () => {
    dock.classList.toggle('open');
    dockToggle.textContent = dock.classList.contains('open') ? '↓' : '↑';
});

// 載入時檢測
window.addEventListener('load', () => {
	startButton.textContent = '開始 🚀'; // 更改按鈕文字為「開始」
    wordPairs = parseWordPairs(wordPairsString);
	basicSettings();
	titleInput.value = gameTitle.textContent;	
});

function basicSettings(){    
	pairsNumber = Math.min(wordPairs.length, pairsNumber); // 題目數少於預定遊戲組數，則遊戲組數等於題目數
	passCondition = Math.min(wordPairs.length, passCondition); // 題目數少於預定過關組數，則過關組數等於題目數
	passCondition = passCondition || pairsNumber; // 檢查過關條件，passCondition 若為none、未定義、0、空等，則等同pairsNumber

}

// 轉換自訂的資料為題庫格式
function parseWordPairs(wordPairsString) {
    const pairs = wordPairsString.trim().split('\n').map(pair => pair.split(/\t|=/));
    return pairs.map(pair => ({
        word: pair[0],
        translation: pair[1]
    }));
}


// 更新牌卡組
function updateWordPairs(pairsNumber) {
    // 移除 wordPairsString 中的重複
    let wordPairsArr = Array.from(new Set(wordPairs.map(pair => JSON.stringify(pair)))).map(str => JSON.parse(str));

    if (wordPairsArr.length < pairsNumber) {
        pairsNumber = wordPairsArr.length;
    }
    if (wordPairsArr.length < passCondition) {
        passCondition = wordPairsArr.length;
    }

    randomPairs = getRandomWordPairs(wordPairsArr, pairsNumber); // 重新取得隨機語詞對
    // 分別加入中文和英文的語詞配對
    const newChineseWordPairs = randomPairs.map(pair => ({
        word: pair.word,
        translation: pair.word + ";" + pair.translation,
		lang: "pair-left"
    }));
    const newEnglishWordPairs = randomPairs.map(pair => ({
        word: pair.translation,
        translation: pair.word + ";" + pair.translation,
		lang: "pair-right"
    }));
    // 合併語詞配對
    fullWordPairs = [...newChineseWordPairs, ...newEnglishWordPairs];
    // 隨機排序
    fullWordPairs.sort(() => Math.random() - 0.5);
}

// 隨機排序，並取指定數量
function getRandomWordPairs(wordPairsString, count) {
    const shuffledPairs = wordPairsString.sort(() => Math.random() - 0.5);
    return shuffledPairs.slice(0, count);
}

// 開始遊戲
function startGame() { 
    if (!gameStarted) {
		updateWordPairs(pairsNumber); // 重新生成語詞對
        gameStarted = true;
        seconds = 0; // 重置秒數
        score = 0; // 重置分數
        accuracy = 0; //重置正確率
        timerDisplay.textContent = '0:00'; // 重置計時器顯示
        scoreDisplay.style.display = 'none'; // 隱藏分數
        startButton.style.display = 'none'; // 隱藏開始按鈕
        clearInterval(timerInterval); // 清除之前的計時器
        timerInterval = setInterval(updateTimer, 1000); // 重新啟動計時器
        matchedPairs = 0; // 重置匹配對數
        selectedCards = []; // 清空已選取的陣列
        totalMatches = 0; // 重新計算配對次數
        correctMatches = 0; // 重新計算答對次數
        wrongMatches = 0; // 重新計算答錯次數
        resultDisplay.textContent = ''; // 清空遊戲結果訊息
        generateCards(); // 生成牌卡
        updateAccuracyDisplay(); // 重新計算正確率	
		var gifImages = document.querySelectorAll('img.stop[src$=".gif"]'); //具有 stop 屬性的 gif
		gifImages.forEach(stopGifAnimation); // 有stop屬性的gif 停止動畫
		setGridColumns(pairsNumber); // 依照配對組數調整card編排
		dockToggle.style.visibility = 'hidden';
    }
}

// 生成牌卡
function generateCards() {
    gameContainer.innerHTML = ''; // 清空遊戲容器
    fullWordPairs.forEach(pair => { // 加入新的卡片
        const card = document.createElement('div');
        card.classList.add('card');
        const content = pair.word.match(/\.(jpg|jpeg|webp|svg)$/) ? `<img src="${pair.word}" alt="card image" class="card-image">` :
            pair.word.match(/\.(kasu)$/) ? `<audio class="audio-player" controls><source src="${pair.word}" type="audio/mpeg"></audio>` : pair.word;
		
        card.innerHTML = replaceThis(content); // 取代文字內容
        card.setAttribute('check-match', pair.translation);
		
		card.classList.add(pair.lang);
        card.addEventListener('click', selectCard); // 點牌卡;
        gameContainer.appendChild(card);		
    });	
}


// 已點選的排卡
function selectCard() {
    if (gameStarted && selectedCards.length < 2 && !this.classList.contains('matched')) {
        const selected = this.classList.toggle('selected');
        if ((selected && selectedCards.push(this) === 2)) {
            setTimeout(checkMatch, 200);
        } else if (!selected) {
            selectedCards.splice(selectedCards.indexOf(this), 1);
        }
    }
}

// 檢查是否過關
function checkWinCondition() {
    if (passCondition && correctMatches >= passCondition) {
        updateAccuracyDisplay();
        scoreDisplay.innerHTML = "得分: " + score + "<br />" + "正確: " + accuracy + "%";
        scoreDisplay.style.display = 'block';
        clearInterval(timerInterval); // 停止計時器
        resultDisplay.textContent = '🎉過關！'; // 顯示過關訊息
        resultDisplay.style.display = 'block'; // 顯示過關訊息
        startButton.textContent = '重新開始'; // 將按鈕文字設置為重新開始
        gameStarted = false; // 將遊戲狀態設置為未開始
        correctMatches = 0; // 重置答對次數
        let audioPass  = new Audio('pass.mp3');
        audioPass.play()

        setTimeout(() => {
            resultDisplay.style.display = 'none'; // 隱藏完成訊息
	        startButton.disabled = false; // 啟用重新開始按鈕
            updateWordPairs(pairsNumber); // 重新生成語詞配對
            startButton.style.display = 'block'; // 顯示重新開始按鈕
            shareButton.style.display = 'block';
			dockToggle.style.visibility = 'visible';

        }, 1500);
    } else {
        if (correctMatches % pairsNumber === 0 && correctMatches < passCondition) {
            updateWordPairs(pairsNumber); // 重新生成語詞對
            generateCards(); // 重新載入新的卡片
        }
    }
}

// 在檢查配對成功後，檢查是否滿足過關條件
function checkMatch() {
    totalMatches++; // 更新配對的總次數
    const card1 = selectedCards[0];
    const card2 = selectedCards[1];
    const checkMatch1 = card1.getAttribute('check-match');
    const checkMatch2 = card2.getAttribute('check-match');

    if (checkMatch1 == checkMatch2) {
        correctMatches++; // 更新答對的次數
        card1.classList.remove('selected');
        card2.classList.remove('selected');
        card1.classList.remove('pair-right');
        card2.classList.remove('pair-right');

        card1.classList.add('matched');
        card2.classList.add('matched');
        showSparkle(card1, true);
        showSparkle(card2, true);
        selectedCards = [];
        matchedPairs++;
        score += 100; // 配對成功加 100 分
        let audioRight = new Audio('right.mp3');
        audioRight.play()
        checkWinCondition(); // 檢查是否滿足過關條件

    } else {
        wrongMatches++; // 更新答錯的次數
        showSparkle(card1, false);
        showSparkle(card2, false);
        card1.classList.remove('selected');
        card2.classList.remove('selected');
        card1.classList.add('not-match');
        card2.classList.add('not-match');
        let audioWrong  = new Audio('wrong.mp3');
        audioWrong.play()
        setTimeout(() => {
            card1.classList.remove('not-match');
            card2.classList.remove('not-match');
            selectedCards = [];
            score -= 50; // 配對失敗減 50 分
            if (score < 0) score = 0;
        }, 300);
    }
    // 更新正確率
    updateAccuracyDisplay();
}

// 更新正確率
function updateAccuracyDisplay() {
    accuracy = ((correctMatches / totalMatches) * 100).toFixed(0);
}

// 顯示配對正確特效
function showSparkle(container, condition) {
    const sparkle = document.createElement('div');
	if(condition == true){
		sparkle.textContent = '+100';
		sparkle.classList.add('sparkle');
	}else{
		if(score > 0){
		  sparkle.textContent = '-50';
		  sparkle.classList.add('sparkleX');
		}
	}
    container.appendChild(sparkle);
    setTimeout(() => {
        sparkle.remove();
    }, 800);
}

// 時間更新
function updateTimer() {
    seconds++;
    timerDisplay.textContent = formatTime(seconds);
}

// 時間格式為 0:00
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes < 10 ? '' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}



























/*


wordPairsString 要改為如下項目。
不過不一定會有這麼多，但這少會有兩個來配對，順序也不一定是這樣，所以要依照標題。

我要在首頁一開始增加選單：

選單第一個是選課別，依據wordPairsString 自動生成。
第二區塊是選擇要配對的項目
內部有兩個可選：
選項有漢字、拼音、注音、華語、音檔、圖檔
要注意，當選漢字，另一個要配的選單項目就不可以出現漢字這選項。

let wordPairsString = `
[k]課別	[ka]漢字	[py]拼音	[zy]注音	[hy]華語	[snd]音檔	[pic]圖檔
第1課	𠊎	ngaiˋ	兀ㄞˋ	我	a001	b001
第1課	佢	guiˋ	ㄍㄨㄧˋ	他	a002	b002
第1課	你	henˋ	ㄏㄝㄣˋ	你	a003	b003
第1課	䀴	ngiangˆ	兀ㄧㄤˆ	看	a004	b004
第1課	吂	mangˇ	ㄇㄤˇ	還沒	a005	b005
第1課	講	gongˆ	ㄍㄛㄥˆ	說	a006	b006
第1課	想	siong	ㄙㄧㄛㄥ	想	a007	b007
第2課	有	rhiuˇ	ㄖㄧㄨˇ	有	a008	b008
第2課	無	moˋ	ㄇㄛˋ	沒	a009	b009
第2課	真	zhinˇ	ㄓㄧㄣˇ	很	a010	b010
第2課	假	gaˆ	ㄍㄚˆ	假	a011	b011
第2課	天	teenˇ	ㄊㄝㄝㄣˇ	天	a012	b012
第2課	第	ti	ㄊㄧ	第	a013	b013
`;


const htmlTemplate = `
<div id="gameTitle" class="game-title">${customTitle}</div>

<div id="menuContainer" class="menu-container">
  <div id="lessonSelectContainer" class="lesson-select-container">
    <label for="lessonSelect">選擇課別</label>
    <select id="lessonSelect">
      <!-- 動態生成課別選項 -->
    </select>
  </div>
  <div id="matchTypeContainer" class="match-type-container">
    <label for="matchType1">選擇配對項目</label>
    <select id="matchType1">
      <!-- 動態生成配對選項 -->
    </select>
    <label for="matchType2">配對至</label>
    <select id="matchType2">
      <!-- 動態生成配對選項 -->
    </select>
  </div>
  <button id="startButton" class="start-button">開始</button>
</div>

<div id="gameContainer" class="game-container"></div>
<div id="result" class="result"></div>
<div id="timer" class="timer">0:00</div>
<div id="score" class="score"></div>

<div id="dock" class="dock">
  <button id="dockToggle" class="dock-toggle">↑</button>
  <div id="dock-content" class="dock-content">
    <div id="wesing" class="wesing">烏衣行</div>
  </div>
</div>
`;

請注意，原有的功能，如：計算成績、播放音效、配對組數、過關組數等都要保留，只要協助達成以上題庫、選單的修改。
為了避免遺漏，請依照原來的JS方式，提供完整JS

*/






















// 取代牌卡內容
function replaceThis(myAll){
    // <ho:{漢字/拼音}> 轉成 <ho:拼音>{漢字/拼音};
    pattern = /<(ho|holo|minnan|min|m|kasu|ka|k|詔安|安|詔|閩|閩南)\s*(;|:|!)\s*\{\s*([^\/}]+)\s*\/\s*([^\/}]+)\s*\}>/g;
    if (myAll.match(pattern)) {
        myAll = myAll.replace(pattern, function(match, p1, p2, p3, p4) {
            return "<" + p1 + p2 + p4 + "> " + "{" + p3 + "/" + p4 + "}";
        });
    }

    // 檢查訊息中是否包含 {漢字/拼音}，並轉換成 Ruby 
    //pattern = /\{\s*([^\/}]+)\s*\/\s*([^\/}]+)\s*\}/g; // 匹配 {漢字/拼音} 格式的正則表達式
	pattern = /\{\s*(?:ruby\s*:)?\s*([^\/}]+)\s*\/\s*([^\/}]+)\s*\}/g;

    if (myAll.match(pattern)) {
        myAll = myAll.replace(pattern, function(match, p1, p2) {

            var chineseCharacters = Array.from(p1.trim()); // 移除逗號並轉為陣列
            var pinyinWithSpaces = p2.replace(/,/g, ' , '); // 在逗號前後加空格

			 //pinyinWithSpaces = replaceArr12(pinyinWithSpaces, kasuPinyinBpmArr);
			// kasuPinyinToBpm(w)
            var pinyinArray = pinyinWithSpaces.trim().split(/\s+/);
            let rubyText = '';
            let chineseIndex = 0;
            for (let i = 0; i < pinyinArray.length; i++) {
                // 如果 pinyin 是 - 或 -- ，則跳過，不處理
                if (pinyinArray[i] === '-' || pinyinArray[i] === '--') continue;
                const chinesePart = chineseCharacters.slice(chineseIndex, chineseIndex + pinyinArray[i].split(/[-]+/).length);
                rubyText += `<ruby>${chinesePart.join('')}<rt>${pinyinArray[i]}</rt></ruby>`;
                chineseIndex += chinesePart.length;
            }
            return rubyText;
        });
    }


    // 檢查訊息中是否包含閩南語音檔
    //pattern = /\<(ho|holo|minnan|min|m|閩|閩南)\s*(;|:|!)([^>]+)\>/g;
	pattern = /\<?(ho|holo|minnan|min|m|閩|閩南)\s*(;|:|!)([^>]+)\>?/g;
    if (myAll.match(pattern)) {
        myAll = myAll.replace(pattern, function(match, p1, p2, p3) {
            let zvsxf = tailuoToZvsxfl(p3);
            let tone = zvsxflToTailuo(p3);

            if (p2 === ":") {
                return `<k onclick="p(this, 'holo', '${zvsxf}')" class="k-audio-big">🔊</k>`;
            } else if (p2 === ";") {
                return `<k class="k-audio-small" onclick="p(this, 'holo', '${zvsxf}')">🔊</k>${tone}`;
            } else if (p2 === "!") {
                return `<k onclick="p(this, 'holo', '${zvsxf}')">🔊</k>${tone}`;
            } else {
                return match;
            }
        });
    }

    // 檢查訊息中是否包含詔安客語音檔
    //pattern = /\<(kasu|ka|k|詔安|詔|安)\s*(;|:|!)([^>]+)\>/g;
	pattern = /\<?(kasu|ka|k|詔安|詔|安)\s*(;|:|!)([^>]+)\>?/g;
    if (myAll.match(pattern)) {
        myAll = myAll.replace(pattern, function(match, p1, p2, p3) {
            let zvsxf = replaceToneToZvsxf(p3);
            let tone = replaceZvsxfToTone(p3);
            if (p2 === ":") {
                return `<k onclick="p(this, 'ka', '${zvsxf}')" class="k-audio-big">🔊</k>`;
            } else if (p2 === ";") {
                return `<k onclick="p(this, 'ka', '${zvsxf}')" class="k-audio-small">🔊</k>${tone}`;
            } else if (p2 === "!") {
                return `<k onclick="p(this, 'ka', '${zvsxf}')">🔊</k>${tone}`;
            } else {
                return match;
            }
        });
    }
    // 檢查訊息中是否包含英語語音檔
    //pattern = /\<(english|eng|en|e|英語|英)\s*(;|:|!)([^>]+)\>/g;
	pattern = /\<?(english|eng|en|e|英語|英)\s*(;|:|!)([^>]+)\>?/g;
    if (myAll.match(pattern)) {
        myAll = myAll.replace(pattern, function(match, p1, p2, p3) {
            let zvsxf = p3;
            let tone = p3;
            if (p2 === ":") {
                return `<k onclick="p(this, 'en', '${zvsxf}')" class="k-audio-big">🔊</k>`;
            } else if (p2 === ";") {
                return `<k onclick="p(this, 'en', '${zvsxf}')" class="k-audio-small">🔊</k>${tone}`;
            } else if (p2 === "!") {
                return `<k onclick="p(this, 'en', '${zvsxf}')">🔊</k>${tone}`;
            } else {
                return match;
            }
        });
    }

    // 檢查純音檔，以.mp3結尾
	pattern = /(\.mp3|\.wav|\.ogg)$/g;
	if (myAll.match(pattern)) {
		myAll = `<k onclick="p(this, 'no', '${myAll}')" class="k-audio-big">🔊</k>`;
	}

	// 檢查 GIF 圖片，以 gif/ 開頭，以 .gif 或 .gift 結尾
	pattern = /^gif:\s*(.*)(\.gif|\.gift)$/g;
	if (myAll.match(pattern)) {
		myAll = myAll.replace(pattern, function(match, p1, p2) {
			// 使用捕獲組 p1 作為文件名，p2 作為副檔名
			return `https://www.animatedimages.org/data/media/${p1}${p2}`;
		});
	}

	// 當網址以 .gift 結尾，將 .gift 取代為 .gif
	pattern = /\.gif$/g;
	if (myAll.match(pattern)) {
		myAll = `<img src="${myAll}" class="card-image">`;
	}

	// 當網址以 .gift 結尾，將 .gift 取代為 .gif
	pattern = /\.gift$/g;
	if (myAll.match(pattern)) {
		myAll = myAll.replace(pattern, '.gif');
		myAll = `<img src="${myAll}" class="card-image stop">`;
	}

	return myAll;
}

// 使Gif 停止動畫
function stopGifAnimation(image) {
	image.onload= function() {	
    if ('getContext' in document.createElement('canvas')) {
        var canvas = document.createElement('canvas');
        var width = image.width, height = image.height;
        if (width && height) {
            if (!image.storeUrl) {
                image.storeUrl = image.src;
            }
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(image, 0, 0, width, height);
            try {
                image.src = canvas.toDataURL("image/gif");
            } catch(e) {
                image.removeAttribute('src');
                canvas.style.position = 'absolute';
                image.parentElement.insertBefore(canvas, image);
                image.style.opacity = '0';
                image.storeCanvas = canvas;
            }
        }
    }
	}
}




wesing.addEventListener('click', () => {
    window.open('https://sites.google.com/view/oikasu', '_blank');
});
gameTitle.addEventListener('click', () => {
    toggleFullScreen();
});


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


















//< 音檔播放 ===============================;
var currentElement = null;
var currentAudio = null;
var audioRate = 1; // 播放速率
var audioCurrentTime = 0; // 略過前幾秒
var audioLeftTime = 0; // 略過剩餘幾秒

function p(e, lang, url) {
    var audioUrls = url.trim().split(/\s+/);

    //修正 閩南語 audioUrls 音檔是否存在以及變調;
    if (/\bholo|ho|minnan|min|m\b/.test(lang)) {
        //處理單音節;
        var regexDanyinjie = /\w+/; // 定義正則表達式
        audioUrls = audioUrls.map(function(element, index, array) {
            if (regexDanyinjie.test(element)) { // 檢查元素是否符合正則表達式	
                let txtA = element;
                let txtB = replaceHoloToneToBian(element);

                if (index === array.length - 1) {
                    return txtA;
                } else {
                    if (dictionaryHolo[txtB] === undefined) {
                        return txtA;
                    } else {
                        return txtB;
                    }
                }
            }
        });
        //處理多音節;
        var regexDuoyinjie = /\w+(?:-+\w+)+/;
		//var regexDuoyinjie = /\w+([-_]+|\-{2})\w+/;

		audioUrls = audioUrls.flatMap(function(element) {
			if (regexDuoyinjie.test(element) && dictionaryHolo[element] === undefined) {
				let arr = element.split(/-+/).map(replaceHoloToneToChange);

				for (let i = 0; i < arr.length; i++) {
					if (dictionaryHolo[arr[i]] === undefined) {
						arr[i] = element.split(/-+/)[i];
					}
				}
				return arr; // 如果符合條件，則返回替換後的陣列元素
			}
			return element; // 否則返回原始的元素
		});

    }


        //修正 詔安客語 audioUrls 音檔是否存在以及變調;
        if (/\bkasu|ka|k\b/.test(lang)) {
            //處理多音節;
            var regexDuoyinjie = /\w+(?:-+\w+)+/;
			audioUrls = audioUrls.map(w => w.replace(/_/g, "-").replace(/--/g, "-"));
            /*
			audioUrls = audioUrls.map(function(element) {
                if (regexDuoyinjie.test(element)) {	
    				//檢測的資料庫
                    if (dictionaryKasu[element] == undefined) {
                        let arr = element.split(/-+/);
						return arr; // 如果符合條件，則返回分割後的陣列元素
                    }      
                }
                return element; // 否則返回原始的元素
            }).flat(); // 使用 flat 方法將結果扁平化成一個陣列
			*/
			audioUrls = audioUrls.flatMap(function(element) {
				if (regexDuoyinjie.test(element)) {	
					//檢測的資料庫
					if (dictionaryKasu[element] == undefined) {
						return element.split(/-+/); // 直接返回分割後的陣列元素
					}      
				}
				return element; // 否則返回原始的元素
			});
			
        }


    audioUrls = audioUrls.map(function(txt) {
        if (/\bholo|ho|minnan|min|m\b/.test(lang)) {
            let holoNo = dictionaryHolo[txt];
            let holoNoNo = convertNumber(holoNo);
            audioRate = 1;
            audioCurrentTime = 0;
            audioLeftTime = 0;
			
            return `https://sutian.moe.edu.tw/media/subak/${holoNoNo}.wav`;
        } else if (/\bkasu|ka|k\b/.test(lang)) {
            audioRate = 1;
            audioCurrentTime = 0;
            audioLeftTime = 0;
			if (/\w+(?:-+\w+)+/.test(txt)) {
			  return `https://oikasu.com/file/mp3kasu/${txt}.mp3`;
			}else{
              return `https://oikasu.com/file/mp3/${txt}.mp3`;
			}
        } else if (/\benglish|eng|en|e\b/.test(lang)) {
            audioRate = 1;
            audioCurrentTime = 0.01;
            audioLeftTime = 0.01;
            //return `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-TW&client=tw-ob&q=${encodeURIComponent(txt)}`;
			return `https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=${encodeURIComponent(txt)}`;
        } else if (/\bno\b/.test(lang)) {
            audioRate = 1;
            audioCurrentTime = 0.1;
            audioLeftTime = 0.1;
			return txt;
        } else {
            return txt;
        }
    });

    preloadAudio(audioUrls); //預先載入音檔;
    playAudioSequence(e, lang, audioUrls);
}



// 連續播放音訊序列
function playAudioSequence(element, lang, audioUrls) {
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
        playNextAudio(element, lang, audioUrls);
    }
}

// 播放下一個音訊
function playNextAudio(element, lang, audioUrls) {

    if (audioUrls.length === 0) {
        // 所有音訊都已經播放完畢
        element.textContent = "🔊";
        return;
    }

    var audioUrl = audioUrls.shift(); // 取出下一個音訊的 URL

    currentAudio = new Audio(audioUrl);

    // 播放速率
    currentAudio.playbackRate = audioRate;
    // 略過前x秒
    currentAudio.currentTime = audioCurrentTime;

    currentAudio.play()
        .then(() => {
            // 音訊播放成功
            currentElement = element;
            element.textContent = "🔉";

            currentAudio.addEventListener('ended', function() {
                // 當前音訊播放完畢，繼續播放下一個音訊
                playNextAudio(element, lang, audioUrls);
            });
        })
        .catch(error => {
            // 音訊播放失敗，改播放預設音檔
            currentAudio = new Audio('https://oikasu.com/file/mp3/no-snd.mp3');
            currentAudio.play()
                .then(() => {
                    // 預設音檔播放成功
                    currentElement = element;
                    element.textContent = "🔉";

                    currentAudio.addEventListener('timeupdate', function() {
                        // 獲取音檔的總時長
                        var duration = currentAudio.duration;
                        // 獲取目前播放的時間
                        var currentTime = currentAudio.currentTime;
                        // 當剩餘時間小於等於 0.5 秒時，開始播放下一個音檔
                        if (duration - currentTime <= audioLeftTime) {
                            playNextAudio(element, lang, audioUrls);
                        }
                    });

                })
                .catch(error => {
                    // 預設音檔播放失敗
                    console.error('無法播放預設音檔：', error);
                    playNextAudio(element, lang, audioUrls);
                });
        });
}




// 批次預先載入音檔
function preloadAudio(audioUrls) {
    audioUrls.forEach(function(url) {
        var audio = new Audio(url);
        audio.preload = 'auto'; // 設置為 "auto" 以啟用預載;
    });
}


//=================================
// 洗牌函數
function shuffleArray(array) {
    let leng = array.length;
    for (let i = leng - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // 交換元素位置
    }
    return array;
}









//====================================
function replaceToneToZvsxf(t) {
    //聲調統一轉為字母調;
    t = t.replace(/([ˉˊˇˋˆ^⁺])([a-z])/g, "$1 $2");
    t = t.replace(/([aeioumngbdr])(ˉ)/g, "$1 ");
    t = t.replace(/([aeioumngbdr])(ˊ)/g, "$1z");
    t = t.replace(/([aeioumngbdr])(ˇ)/g, "$1v");
    t = t.replace(/([aeioumngbdr])(ˋ)/g, "$1s");
    t = t.replace(/([aeioumngbdr])(ˆ)/g, "$1x");
    t = t.replace(/([aeioumngbdr])(\^)/g, "$1x");
    t = t.replace(/([aeioumngbdr])(\+)/g, "$1f");
    t = t.replace(/([aeioumngbdr])(⁺)/g, "$1f");

    //標音符合音檔格式;
    //t = t.replace(/(rh)([aeioumn])/g,"r$2");
    t = t.replace(/oo/g, "o");
    t = t.replace(/(bb)([aeioumn])/g, "v$2");
    t = t.replace(/ji/g, "zi");
    t = t.replace(/qi/g, "ci");
    t = t.replace(/xi/g, "si");

    //合音字;
    t = t.replace(/(shixcd)/g, "shid");
    t = t.replace(/(vuzcd)/g, "vud");
    t = t.replace(/(gixy ha)/g, "gia");
    t = t.replace(/(gixcy dov)/g, "giof");
    t = t.replace(/(gixy dov)/g, "giof");
    t = t.replace(/(gavy hensf)/g, "genf");
    t = t.replace(/(gavy nginsf)/g, "ginf");
    t = t.replace(/(gavy ngaisf)/g, "gaif");
    t = t.replace(/(dedzcy hensz)/g, "denz");
    t = t.replace(/(dedzcy hensf)/g, "denf");
    t = t.replace(/(dedzcy guisz)/g, "duiz");
    t = t.replace(/(dedzcy guisf)/g, "duif");
    t = t.replace(/(dedzcy ngaisz)/g, "daiz");
    t = t.replace(/(dedzcy ngaisf)/g, "daif");
    t = t.replace(/(dedzcy nginsz)/g, "dinz");
    t = t.replace(/(dedzcy nginsf)/g, "dinf");
    //變聲字;
    t = t.replace(/(vmoi)/g, "moi");
    t = t.replace(/(hmo)/g, "mo");
    t = t.replace(/(hmo)/g, "mo");
    //若以字母本變調標示，留變調;
    t = t.replace(/([aeioumngbdr])([czvsxf])([czvsxf])(\b)/g, "$1$3$4");
    t = t.replace(/([aeioumngbdr])(c)(\b)/g, "$1$3");
    return t;
}

function replaceZvsxfToTone(w) {
    return w.replace(/([aeioumngbdr])([czvsxf])([czvsxf])(\b)/g, "$1$2$4")
        .replace(/([aeioumngbdr])(c)(\b)/g, "$1$3")
		.replace(/([aeioumngbd])z/gi, "$1ˊ")
        .replace(/([aeioumngbd])v/gi, "$1ˇ")
        .replace(/([aeioumngbd])s/gi, "$1ˋ")
        .replace(/([aeioumngbd])x/gi, "$1ˆ")
        .replace(/([aeioumngbd])f/gi, "$1⁺")
        .replace(/(r)([aeiou])/gi, "rh$2")
        .replace(/(v)([aeiou])/gi, "bb$2")
        .replace(/o/gi, "oo")
        .replace(/oooo/gi, "oo")
        .replace(/moo/gi, "mo")
        .replace(/ngoo/gi, "ngo")
        .replace(/noo/gi, "no")
        .replace(/(oo)([bdgmni])/gi, "o$2");
}



// 閩南語最後一個音節不變調;
function replaceHoloToneToChange(item, index, array) {
    if (index === array.length - 1) {
        return item; // 不執行替換
    } else {
        // 執行替換
        return replaceHoloToneToBian(item);
    }
}

// 閩南語音節變調; here
function replaceHoloToneToBian(w) {
    return w.replace(/([aeiourmng])\b/gi, "$17")
        .replace(/([aeiourmng])(z)\b/gi, "$11")
        .replace(/([aeiourmng])(s)\b/gi, "$12")
        .replace(/([ptk])\b/gi, "$18")
        .replace(/(h)\b/gi, "1")
        .replace(/([aeiourmng])(x)\b/gi, "$17")
        .replace(/([aeiourmng])(f)\b/gi, "$13")
        .replace(/([ptk])l\b/gi, "$14")
        .replace(/(h)l\b/gi, "3")
        .replace(/([aeioumngptkhr])(1)/gi, '$1')
        .replace(/([aeioumngptkhr])(2)/gi, '$1z')
        .replace(/([aeioumngptkhr])(3)/gi, '$1s')
        .replace(/([aeioumngptkhr])(4)/gi, '$1')
        .replace(/([aeioumngptkhr])(5)/gi, '$1x')
        .replace(/([aeioumngptkhr])(6)/gi, '$1v')
        .replace(/([aeioumngptkhr])(7)/gi, '$1f')
        .replace(/([aeioumngptkhr])(8)/gi, '$1l');
}



//===holo audio ==============

// 音檔數字轉為資料夾結構加數字;
function convertNumber(num) {
    if (num < 1000) {
        return `0/${num}`;
    } else {
        let thousands = Math.floor(num / 1000);
        return `${thousands}/${num}`;
    }
}


function zvsxflToTailuo(w) {
	//ő
	//ň

    return w = w.replace(/(Er|er)(e)(9|zz)/g, '$1e̋')
        .replace(/(Er|er)(e)(2|z)/g, '$1é')
        .replace(/(Er|er)(e)(3|s)/g, '$1è')
        .replace(/(Er|er)(e)(5|x)/g, '$1ê')
        .replace(/(Er|er)(e)(6|v)/g, '$1ě')
        .replace(/(Er|er)(e)(7|f)/g, '$1ē')
        .replace(/(E)(re)([ptkh])(8|l)/g, 'E̍$2$3')
        .replace(/(e)(re)([ptkh])(8|l)/g, 'e̍$2$3')

        .replace(/([aeioumngptkhbd])(1|4)/g, '$1')

        .replace(/(A)([eioumngr]{0,4})([ptkhbdg]{0,1})(9|zz)/g, 'A̋$2$3')
        .replace(/(A)([eioumngr]{0,4})([ptkhbdg]{0,1})(2|z)/g, 'Á$2$3')
        .replace(/(A)([eioumngr]{0,4})([ptkhbdg]{0,1})(3|s)/g, 'À$2$3')
        .replace(/(A)([eioumngr]{0,4})([ptkhbdg]{0,1})(5|x)/g, 'Â$2$3')
        .replace(/(A)([eioumngr]{0,4})([ptkhbdg]{0,1})(6|v)/g, 'Ǎ$2$3')
        .replace(/(A)([eioumngr]{0,4})([ptkhbdg]{0,1})(7|f)/g, 'Ā$2$3')
        .replace(/(A)([eioumngr]{0,4})([ptkhbdg]{0,1})(8|l)/g, 'A̍$2$3')
        .replace(/(a)([eioumngr]{0,4})([ptkhbdg]{0,1})(9|zz)/g, 'a̋$2$3')
        .replace(/(a)([eioumngr]{0,4})([ptkhbdg]{0,1})(2|z)/g, 'á$2$3')
        .replace(/(a)([eioumngr]{0,4})([ptkhbdg]{0,1})(3|s)/g, 'à$2$3')
        .replace(/(a)([eioumngr]{0,4})([ptkhbdg]{0,1})(5|x)/g, 'â$2$3')
        .replace(/(a)([eioumngr]{0,4})([ptkhbdg]{0,1})(6|v)/g, 'ǎ$2$3')
        .replace(/(a)([eioumngr]{0,4})([ptkhbdg]{0,1})(7|f)/g, 'ā$2$3')
        .replace(/(a)([eioumngr]{0,4})([ptkhbdg]{0,1})(8|l)/g, 'a̍$2$3')

        .replace(/(O)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(9|zz)/g, '$1e̋$3$4')
        .replace(/(O)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(2|z)/g, '$1é$3$4')
        .replace(/(O)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(3|s)/g, '$1è$3$4')
        .replace(/(O)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(5|x)/g, '$1ê$3$4')
        .replace(/(O)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(6|v)/g, '$1ě$3$4')
        .replace(/(O)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(7|f)/g, '$1ē$3$4')
        .replace(/(O)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(8|l)/g, '$1e̍$3$4')
        .replace(/(o)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(9|zz)/g, '$1e̋$3$4')
        .replace(/(o)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(2|z)/g, '$1é$3$4')
        .replace(/(o)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(3|s)/g, '$1è$3$4')
        .replace(/(o)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(5|x)/g, '$1ê$3$4')
        .replace(/(o)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(6|v)/g, '$1ě$3$4')
        .replace(/(o)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(7|f)/g, '$1ē$3$4')
        .replace(/(o)(e)(y{0,1})(ng{0,1}|[ptkh]{0,1})(8|l)/g, '$1e̍$3$4')

        .replace(/(O)([eioumngry]{0,4})([ptkhbdg]{0,1})(9|zz)/g, 'Ő$2$3')
        .replace(/(O)([eioumngry]{0,4})([ptkhbdg]{0,1})(2|z)/g, 'Ó$2$3')
        .replace(/(O)([eioumngry]{0,4})([ptkhbdg]{0,1})(3|s)/g, 'Ò$2$3')
        .replace(/(O)([eioumngry]{0,4})([ptkhbdg]{0,1})(5|x)/g, 'Ô$2$3')
        .replace(/(O)([eioumngry]{0,4})([ptkhbdg]{0,1})(6|v)/g, 'Ǒ$2$3')
        .replace(/(O)([eioumngry]{0,4})([ptkhbdg]{0,1})(7|f)/g, 'Ō$2$3')
        .replace(/(O)([eioumngry]{0,4})([ptkhbdg]{0,1})(8|l)/g, 'O̍$2$3')
        .replace(/(o)([eioumngry]{0,4})([ptkhbdg]{0,1})(9|zz)/g, 'ő$2$3')
        .replace(/(o)([eioumngry]{0,4})([ptkhbdg]{0,1})(2|z)/g, 'ó$2$3')
        .replace(/(o)([eioumngry]{0,4})([ptkhbdg]{0,1})(3|s)/g, 'ò$2$3')
        .replace(/(o)([eioumngry]{0,4})([ptkhbdg]{0,1})(5|x)/g, 'ô$2$3')
        .replace(/(o)([eioumngry]{0,4})([ptkhbdg]{0,1})(6|v)/g, 'ǒ$2$3')
        .replace(/(o)([eioumngry]{0,4})([ptkhbdg]{0,1})(7|f)/g, 'ō$2$3')
        .replace(/(o)([eioumngry]{0,4})([ptkhbdg]{0,1})(8|l)/g, 'o̍$2$3')

        .replace(/(E)(eu)(9|zz)/g, 'E̋$2')
        .replace(/(E)(eu)(2|z)/g, 'É$2')
        .replace(/(E)(eu)(3|s)/g, 'È$2')
        .replace(/(E)(eu)(5|x)/g, 'Ê$2')
        .replace(/(E)(eu)(6|v)/g, 'Ě$2')
        .replace(/(E)(eu)(7|f)/g, 'Ē$2')
        .replace(/(E)(eu)(8|l)/g, 'E̍$2')
        .replace(/(e)(eu)(9|zz)/g, 'e̋$2')
        .replace(/(e)(eu)(2|z)/g, 'é$2')
        .replace(/(e)(eu)(3|s)/g, 'è$2')
        .replace(/(e)(eu)(5|x)/g, 'ê$2')
        .replace(/(e)(eu)(6|v)/g, 'ě$2')
        .replace(/(e)(eu)(7|f)/g, 'ē$2')
        .replace(/(e)(eu)(8|l)/g, 'e̍$2')

        .replace(/(E)([iumngr]{0,4})([ptkhbdg]{0,1})(9|zz)/g, 'E̋$2$3')
        .replace(/(E)([iumngr]{0,4})([ptkhbdg]{0,1})(2|z)/g, 'É$2$3')
        .replace(/(E)([iumngr]{0,4})([ptkhbdg]{0,1})(3|s)/g, 'È$2$3')
        .replace(/(E)([iumngr]{0,4})([ptkhbdg]{0,1})(5|x)/g, 'Ê$2$3')
        .replace(/(E)([iumngr]{0,4})([ptkhbdg]{0,1})(6|v)/g, 'Ě$2$3')
        .replace(/(E)([iumngr]{0,4})([ptkhbdg]{0,1})(7|f)/g, 'Ē$2$3')
        .replace(/(E)([iumngr]{0,4})([ptkhbdg]{0,1})(8|l)/g, 'E̍$2$3')
        .replace(/(e)([iumngr]{0,4})([ptkhbdg]{0,1})(9|zz)/g, 'e̋$2$3')
        .replace(/(e)([iumngr]{0,4})([ptkhbdg]{0,1})(2|z)/g, 'é$2$3')
        .replace(/(e)([iumngr]{0,4})([ptkhbdg]{0,1})(3|s)/g, 'è$2$3')
        .replace(/(e)([iumngr]{0,4})([ptkhbdg]{0,1})(5|x)/g, 'ê$2$3')
        .replace(/(e)([iumngr]{0,4})([ptkhbdg]{0,1})(6|v)/g, 'ě$2$3')
        .replace(/(e)([iumngr]{0,4})([ptkhbdg]{0,1})(7|f)/g, 'ē$2$3')
        .replace(/(e)([iumngr]{0,4})([ptkhbdg]{0,1})(8|l)/g, 'e̍$2$3')

        .replace(/(U)([mngr]{0,4})([ptkhbdg]{0,1})(9|zz)/g, 'Ű$2$3')
        .replace(/(U)([mngr]{0,4})([ptkhbdg]{0,1})(2|z)/g, 'Ú$2$3')
        .replace(/(U)([mngr]{0,4})([ptkhbdg]{0,1})(3|s)/g, 'Ù$2$3')
        .replace(/(U)([mngr]{0,4})([ptkhbdg]{0,1})(5|x)/g, 'Û$2$3')
        .replace(/(U)([mngr]{0,4})([ptkhbdg]{0,1})(6|v)/g, 'Ǔ$2$3')
        .replace(/(U)([mngr]{0,4})([ptkhbdg]{0,1})(7|f)/g, 'Ū$2$3')
        .replace(/(U)([mngr]{0,4})([ptkhbdg]{0,1})(8|l)/g, 'U̍$2$3')
        .replace(/(u)([mngr]{0,4})([ptkhbdg]{0,1})(9|zz)/g, 'ű$2$3')
        .replace(/(u)([mngr]{0,4})([ptkhbdg]{0,1})(2|z)/g, 'ú$2$3')
        .replace(/(u)([mngr]{0,4})([ptkhbdg]{0,1})(3|s)/g, 'ù$2$3')
        .replace(/(u)([mngr]{0,4})([ptkhbdg]{0,1})(5|x)/g, 'û$2$3')
        .replace(/(u)([mngr]{0,4})([ptkhbdg]{0,1})(6|v)/g, 'ǔ$2$3')
        .replace(/(u)([mngr]{0,4})([ptkhbdg]{0,1})(7|f)/g, 'ū$2$3')
        .replace(/(u)([mngr]{0,4})([ptkhbdg]{0,1})(8|l)/g, 'u̍$2$3')

        .replace(/(I)([mngr]{0,4})([ptkhbdg]{0,1})(9|zz)/g, 'I̋$2$3')
        .replace(/(I)([mngr]{0,4})([ptkhbdg]{0,1})(2|z)/g, 'Í$2$3')
        .replace(/(I)([mngr]{0,4})([ptkhbdg]{0,1})(3|s)/g, 'Ì$2$3')
        .replace(/(I)([mngr]{0,4})([ptkhbdg]{0,1})(5|x)/g, 'Î$2$3')
        .replace(/(I)([mngr]{0,4})([ptkhbdg]{0,1})(6|v)/g, 'Ǐ$2$3')
        .replace(/(I)([mngr]{0,4})([ptkhbdg]{0,1})(7|f)/g, 'Ī$2$3')
        .replace(/(I)([mngr]{0,4})([ptkhbdg]{0,1})(8|l)/g, 'I̍$2$3')
        .replace(/(i)([mngr]{0,4})([ptkhbdg]{0,1})(9|zz)/g, 'i̋$2$3')
        .replace(/(i)([mngr]{0,4})([ptkhbdg]{0,1})(2|z)/g, 'í$2$3')
        .replace(/(i)([mngr]{0,4})([ptkhbdg]{0,1})(3|s)/g, 'ì$2$3')
        .replace(/(i)([mngr]{0,4})([ptkhbdg]{0,1})(5|x)/g, 'î$2$3')
        .replace(/(i)([mngr]{0,4})([ptkhbdg]{0,1})(6|v)/g, 'ǐ$2$3')
        .replace(/(i)([mngr]{0,4})([ptkhbdg]{0,1})(7|f)/g, 'ī$2$3')
        .replace(/(i)([mngr]{0,4})([ptkhbdg]{0,1})(8|l)/g, 'i̍$2$3')

        .replace(/(M)(9|zz)/g, 'M̋')
        .replace(/(M)(2|z)/g, 'Ḿ')
        .replace(/(M)(3|s)/g, 'M̀')
        .replace(/(M)(5|x)/g, 'M̂')
        .replace(/(M)(6|v)/g, 'M̌')
        .replace(/(M)(7|f)/g, 'M̄')
        .replace(/(M)(h{0,1})(8|l)/g, 'M̍$2')
        .replace(/(m)(9|zz)/g, 'm̋')
        .replace(/(m)(2|z)/g, 'ḿ')
        .replace(/(m)(3|s)/g, 'm̀')
        .replace(/(m)(5|x)/g, 'm̂')
        .replace(/(m)(6|v)/g, 'm̌')
        .replace(/(m)(7|f)/g, 'm̄')
        .replace(/(m)(h{0,1})(8|l)/g, 'm̍$2')

        .replace(/(N)(g{0,1})(9|zz)/g, 'N̋$2')
        .replace(/(N)(g{0,1})(2|z)/g, 'Ń$2')
        .replace(/(N)(g{0,1})(3|s)/g, 'Ǹ$2')
        .replace(/(N)(g{0,1})(5|x)/g, 'N̂$2')
        .replace(/(N)(g{0,1})(6|v)/g, 'Ň$2')
        .replace(/(N)(g{0,1})(7|f)/g, 'N̄$2')
        .replace(/(N)(g{0,1})(h{0,1})(8|l)/g, 'N̍$2$3')
        .replace(/(n)(g{0,1})(9|zz)/g, 'n̋$2')
        .replace(/(n)(g{0,1})(2|z)/g, 'ń$2')
        .replace(/(n)(g{0,1})(3|s)/g, 'ǹ$2')
        .replace(/(n)(g{0,1})(5|x)/g, 'n̂$2')
        .replace(/(n)(g{0,1})(6|v)/g, 'ň$2')
        .replace(/(n)(g{0,1})(7|f)/g, 'n̄$2')
        .replace(/(n)(g{0,1})(h{0,1})(8|l)/g, 'n̍$2$3');

}


// 台羅調號轉字母調
function tailuoToZvsxfl(w) {
    w = w.replace(/űn/gi, 'unzz')
        .replace(/ű/gi, 'uzz')

        .replace(/(a̍)([aeioumngptkhr]{0,5})/gi, 'a$2l')
        .replace(/(á)([aeioumngptkhr]{0,5})/g, 'a$2z')
        .replace(/(à)([aeioumngptkhr]{0,5})/gi, 'a$2s')
        .replace(/(â)([aeioumngptkhr]{0,5})/gi, 'a$2x')
        .replace(/(ǎ)([aeioumngptkhr]{0,5})/gi, 'a$2v')
        .replace(/(ā)([aeioumngptkhr]{0,5})/gi, 'a$2f')
        .replace(/(a̋)([aeioumngptkhr]{0,5})/gi, 'a$2zz')

        .replace(/(o̍)([aeioumngptkhr]{0,5})/gi, 'o$2l')
        .replace(/(ó)([aeioumngptkhr]{0,5})/gi, 'o$2z')
        .replace(/(ò)([aeioumngptkhr]{0,5})/gi, 'o$2s')
        .replace(/(ô)([aeioumngptkhr]{0,5})/gi, 'o$2x')
        .replace(/(ǒ)([aeioumngptkhr]{0,5})/gi, 'o$2v')
        .replace(/(ō)([aeioumngptkhr]{0,5})/gi, 'o$2f')

        .replace(/(e̍)([aeioumngptkhr]{0,5})/gi, 'e$2l')
        .replace(/(é)([aeioumngptkhr]{0,5})/gi, 'e$2z')
        .replace(/(é)([aeioumngptkhr]{0,5})/gi, 'e$2z')
        .replace(/(è)([aeioumngptkhr]{0,5})/gi, 'e$2s')
        .replace(/(ê)([aeioumngptkhr]{0,5})/gi, 'e$2x')
        .replace(/(ê)([aeioumngptkhr]{0,5})/gi, 'e$2x')
        .replace(/(ě)([aeioumngptkhr]{0,5})/gi, 'e$2v')
        .replace(/(ě)([aeioumngptkhr]{0,5})/gi, 'e$2v')
        .replace(/(ē)([aeioumngptkhr]{0,5})/gi, 'e$2f')
        .replace(/(ē)([aeioumngptkhr]{0,5})/gi, 'e$2f')
        .replace(/(e̋)([aeioumngptkhr]{0,5})/gi, 'e$2zz')
        .replace(/(e̋)([aeioumngptkhr]{0,5})/gi, 'e$2zz')


        .replace(/(u̍)([aeioumngptkhr]{0,5})/gi, 'u$2l')
        .replace(/(ú)([aeioumngptkhr]{0,5})/gi, 'u$2z')
        .replace(/(ù)([aeioumngptkhr]{0,5})/gi, 'u$2s')
        .replace(/(û)([aeioumngptkhr]{0,5})/gi, 'u$2x')
        .replace(/(ǔ)([aeioumngptkhr]{0,5})/gi, 'u$2v')
        .replace(/(ū)([aeioumngptkhr]{0,5})/gi, 'u$2f')
        .replace(/(ű)([aeioumngptkhr]{0,5})/gi, 'u$2zz')

        .replace(/(i̍)([aeioumngptkhr]{0,5})/gi, 'i$2l')
        .replace(/(í)([aeioumngptkhr]{0,5})/gi, 'i$2z')
        .replace(/(ì)([aeioumngptkhr]{0,5})/gi, 'i$2s')
        .replace(/(î)([aeioumngptkhr]{0,5})/gi, 'i$2x')
        .replace(/(ǐ)([aeioumngptkhr]{0,5})/gi, 'i$2v')
        .replace(/(ī)([aeioumngptkhr]{0,5})/gi, 'i$2f')
        .replace(/(i̋)([aeioumngptkhr]{0,5})/gi, 'i$2zz')

        .replace(/(m̍)([aeioumngptkhr]{0,5})/gi, 'm$2l')
        .replace(/(m̋)([aeioumngptkhr]{0,5})/gi, 'm$2zz')
        .replace(/(ḿ)([aeioumngptkhr]{0,5})/gi, 'm$2z')
        .replace(/(m̀)([aeioumngptkhr]{0,5})/gi, 'm$2s')
        .replace(/(m̂)([aeioumngptkhr]{0,5})/gi, 'm$2x')
        .replace(/(m̌)([aeioumngptkhr]{0,5})/gi, 'm$2v')
        .replace(/(m̄)([aeioumngptkhr]{0,5})/gi, 'm$2f')
        .replace(/(n̍)([aeioumngptkhr]{0,5})/gi, 'n$2l')
        .replace(/(n̂)([aeioumngptkhr]{0,5})/gi, 'n$2x')
        .replace(/(ň)([aeioumngptkhr]{0,5})/gi, 'n$2v')
        .replace(/(n̄)([aeioumngptkhr]{0,5})/gi, 'n$2f')
        .replace(/(n̋)([aeioumngptkhr]{0,5})/gi, 'n$2zz')
        .replace(/(ń)([aeioumngptkhr]{0,5})/gi, 'n$2z')
        .replace(/(ǹ)([aeioumngptkhr]{0,5})/gi, 'n$2s')

        .replace(/([aeioumngptkhr]{0,5})(1)/gi, '$1')
        .replace(/([aeioumngptkhr]{0,5})(2)/gi, '$1z')
        .replace(/([aeioumngptkhr]{0,5})(3)/gi, '$1s')
        .replace(/([aeioumngptkhr]{0,5})(4)/gi, '$1')
        .replace(/([aeioumngptkhr]{0,5})(5)/gi, '$1x')
        .replace(/([aeioumngptkhr]{0,5})(6)/gi, '$1v')
        .replace(/([aeioumngptkhr]{0,5})(7)/gi, '$1f')
        .replace(/([aeioumngptkhr]{0,5})(8)/gi, '$1l')

        //.replace(/ /gi, '-')
        //處理聲調;
        .replace(/[,?:;!'"\.]/gi, '');

    w = w.toLowerCase()

    return w;
}



function checkWordExistence(word, dict) {
    return dict[word] === true;
}

function checkKasuExistence(word) {
    return dictionaryKasu[word] === true;
}



function kasuPinyinToBpm(w) {
	return replaceArr12(w, kasuPinyinBpmArr);
}

function replaceArr12(w, arr) {
	let len = arr.length;
	for (let i = 0; i < len; i += 2) {
		reg = new RegExp(arr[i], 'gi');
		w = w.replace(reg, arr[i+1]);
	}
	return w;
} 

// 等比例放大
function scaleElement(e) {
// 如果不是手機裝置，執行 scaleElement 函式
if (!isMobileDevice()) {


  const w = e.offsetWidth;
  const h = e.offsetHeight;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let scaleX;
  let scaleY;
  let t = gameTitle.textContent.trim();

  if(t == ''){
    scaleX = windowWidth / w * 0.9;
    scaleY = windowHeight / h * 0.9;
	gameContainer.style.marginTop = "10px";
  }else{
    scaleX = windowWidth / w * 0.9;
    scaleY = windowHeight / h * 0.85;
	gameContainer.style.marginTop = "70px";
  }

  const scale = Math.min(scaleX, scaleY);

  // 設定最小縮放比例
  const minScale = 1;
  if (scale < minScale) {
    scale = minScale;
  }

  e.style.transform = `scale(${scale})`;
}
}

// 視窗變動時，等比例放大
window.addEventListener('resize', function() {
    scaleElement(gameContainer);
});

// 檢查是否為手機裝置
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 依照pairsNumber數改變卡片編排
function setGridColumns(n) {
  let columns;
  if (n === 1) {
    columns = 'repeat(1, 1fr)';
  } else if (n === 2) {
    columns = 'repeat(2, 1fr)';
  } else if (n === 3) {
    columns = 'repeat(3, 1fr)';
  } else if (n === 4) {
    columns = 'repeat(4, 1fr)';
  } else if (n === 5) {
    columns = 'repeat(4, 1fr)';
  } else if (n === 6) {
    columns = 'repeat(4, 1fr)';
  } else if (n === 7) {
    columns = 'repeat(4, 1fr)';
  } else if (n === 8) {
    columns = 'repeat(5, 1fr)';
  } else if (n === 9) {
    columns = 'repeat(5, 1fr)';
  } else if (n === 10) {
    columns = 'repeat(5, 1fr)';
  } else if (n === 11) {
    columns = 'repeat(6, 1fr)';
  } else if (n === 12) {
    columns = 'repeat(6, 1fr)';
  } else {
    columns = 'repeat(4, 1fr)';
  }
  document.documentElement.style.setProperty('--grid-columns', columns);
}




/*
.gif 動畫圖片
.gift 把gif 變靜態圖片
{人生很苦/ren-sen hen ku}

taif-gav hox.k         >  純音檔
zhangxv-loisf-leeu:k         >  顯示拼音，且有音檔
大家好/taif-gav hox.k   >  顯示漢字，且有音檔
大家好/taif-gav hox:k   >  顯示漢字/拼音，且有音檔

zhangxv-loisf-leeu:k
zhangxv-loisf-leeu.k#taif-gav hox
zhangxv-loisf-leeu.k#
zhangxv-loisf-leeu.k#
.k#正來料
taif-gav hox.kasu#文字

fa.mp3#文字         >  顯示拼音，且有音檔

大家好/taif-gav           >  顯示漢字/拼音

*/
