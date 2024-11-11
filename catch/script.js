function c(x){
 console.log("" + x);
}
let numWordsToDrop = 3; // 設定每次掉下來的語詞數量
let passNumber = 2; // 過關條件
let dropSpeed = 2; // 設定掉落的速度，數字越大速度越快
let settingCondition = 0; //可以自訂
let customTitle = "烏衣行接接樂";
let dataSeparatorText = "\\t|=|\\\\";
let dataSeparatorTxt = "\t";


const dataString = `
ho:lai5>來	B01lai5
ho:gaux	B02gaux
ho:ho2	B03ho2
`;
let wordPairsString = dataString.trim();
let words = parseWordPairs(wordPairsString);
let wrongWordPairs = '';
let dropMonkey = "https://www.animatedimages.org/data/media/50/animated-flower-image-0163.gif";
let dropBackground = "";

const htmlTemplate = `
	<div id="container">
		<div id="game">
			<div id="progressBarContainer">
				<div id="progressBar"></div>
			</div>
			<div id="settingsButton">&#9776;</div>
			<div id="gameTitle" class="game-title">烏衣行接接樂</div>
			<div id="snd">snd</div>
			<div id="word-word"></div>
			<div id="monkey"><img id="monkeyImage" src="${dropMonkey}" /></div>
			<div id="score">分數: 0</div>
			<div id="timer" class="timer">0:00</div>

			<div id="settingsPage" style="display: none;">
				<h2 id="wesing">烏衣行接接接</h2>
				<div class="input-group">
					<label for="titleLabel">標　題：</label>
					<input type="text" id="titleInput" />
				</div>
				<div class="input-group">
					<label for="numWordsToDrop">每次數：</label>
					<select id="numWordsToDrop">
						<option value="2">2</option>
						<option value="3" selected>3</option>
						<option value="4">4</option>
					</select>
				</div>
				<div class="input-group">
					<label for="passNumber">過關數：</label>
					<input type="number" id="passNumber" value="2" />
				</div>
				<div class="input-group">
					<label for="dropSpeed">速　度：</label>
					<select id="dropSpeed">
						<option value="1">慢速</option>
						<option value="1.5" selected>中速</option>
						<option value="2">快速</option>
						<option value="2.5">火速</option>
						<option value="3">神速</option>
					</select>
				</div>

				<div class="input-group">
					<label for="dropSound">音　檔：</label>
					<select id="dropSound">
						<option value="play" selected>有音檔就播</option>
						<option value="stop">禁止播放音檔</option>
						<option value="mute">停止所有音效</option>
					</select>
				</div>

				<div class="input-group">
					<label for="dropMonkey">角　色：</label>
					<div class="input-container">
						<input type="text" id="dropMonkey" placeholder="填1~10是預設角色，或填圖片網址" />
						<div class="tooltip" id="tooltipMonkey">填1~10是預設角色，或填圖片網址</div>
					</div>
				</div>

				<div class="input-group">
					<label for="dropBackground">背　景：</label>
					<div class="input-container">
						<input type="text" id="dropBackground" placeholder="填1~10是預設背景，或填圖片網址" />
						<div class="tooltip" id="tooltipackground">填1~10是預設背景，或填圖片網址</div>
					</div>
				</div>

				<label for="wordPairsString" style="display: inline-block;">題　庫：</label>
				<textarea id="wordPairsStringInput" style="display: none;"></textarea>
				<div id="wordTableContainer"></div>
				<div id="dataSeparatorGroup" class="input-group" style="display: none;">
					<label for="dataSeparator" style="display: inline-block;">分割符：</label>
					<select id="dataSeparator">
						<option value="預設" selected>\\t \\ =</option>
						<option value="\t">TAB \\t</option>
						<option value="=">等號 =</option>
						<option value="_">底線 _</option>
						<option value=">">大於 ></option>
						<option value=",">逗號</option>
						<option value=" ">空格</option>
						<option value="  ">兩個空格</option>
					</select>
				</div>

				<button id="editWordPairsButton">編輯</button>
				<button id="swapButton">交換</button>

				<button id="resetButton">重設</button>
				<button id="shareButton">分享</button>
				<button id="applyButton">套用</button>
				<g id="closeSettingsButton"></g>
			</div>
		</div>
		<button id="startButton">開始遊戲</button>
		<audio id="audio" hidden></audio>
	</div>

	<div id="resultWindow">
		<p id="starRating"></p>
		<p id="accuracyText"></p>
		<p id="missedText"></p>
		<p id="scoreText"></p>
		<button class="restartButton">重新開始</button>
		<g id="closeResultButton"></g>
	</div>
`;



// 將 HTML 模板插入到文檔中
document.body.innerHTML += htmlTemplate;

//載入 holowav 與 kasuMp3
loadCssJs('snd.js');

//載入字體CSS
loadCssJs('styles.css');
loadCssJs('https://fonts.googleapis.com/icon?family=Material+Icons');
//loadCssJs('https://oikasu.com/file/code2/css/style.css');

function loadCssJs(url) {
    const extension = url.split('.').pop().toLowerCase();
    if (extension === 'js') {
        const scriptElement = document.createElement('script');
        scriptElement.src = url;
        document.body.appendChild(scriptElement);
    } else if (extension === 'css' || url.includes('fonts.googleapis.com')) {
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = url;
        document.head.appendChild(linkElement);
    } else {
        console.error('Unsupported file type or URL.');
    }
}






const game = document.getElementById('game');
const monkey = document.getElementById('monkey');
const container = document.getElementById('container');
const chineseWordDiv = document.getElementById('word-word');
const scoreDiv = document.getElementById('score');
const audioElement = document.getElementById('audio');
const startButton = document.getElementById('startButton');
const timerDisplay = document.getElementById('timer'); // 時間
const gameTitle = document.getElementById('gameTitle'); // 標題
let snd = document.getElementById('snd');
let dropSound;


let score = 0;
let correctAnswers = 0;
let totalQuestions = 0;
let missedCorrect = 0;
let seconds = 0; // 初始化秒數
let timerInterval;
let gameStarted = false;
let canMove = true;


const titleInput = document.getElementById('titleInput');
const numWordsToDropInput = document.getElementById('numWordsToDrop');
const passNumberInput = document.getElementById('passNumber');
const dropSpeedInput = document.getElementById('dropSpeed');
const dropSoundInput = document.getElementById('dropSound');
const dropMonkeyInput = document.getElementById('dropMonkey');
const dropBackgroundInput = document.getElementById('dropBackground');
const dataSeparator = document.getElementById('dataSeparator');
const wordPairsStringInput = document.getElementById('wordPairsStringInput');
const dataSeparatorGroup = document.getElementById('dataSeparatorGroup');
const resetButton = document.getElementById('resetButton');
const applyButton = document.getElementById('applyButton');
const editWordPairsButton = document.getElementById('editWordPairsButton');
const swapButton = document.getElementById('swapButton');
 


titleInput.addEventListener('change', () => {
    gameTitle.innerText = titleInput.value.trim();
});

numWordsToDropInput.addEventListener('change', () => {
    numWordsToDrop = parseInt(numWordsToDropInput.value);
});

passNumberInput.addEventListener('change', () => {
    passNumber = parseInt(passNumberInput.value);
});


dropSpeedInput.addEventListener('change', () => {
    dropSpeed = parseInt(dropSpeedInput.value);
});

dropSoundInput.addEventListener('change', () => {
    dropSound = dropSoundInput.value;
});



const monkeyImagesArr = `
https://www.animatedimages.org/data/media/50/animated-flower-image-0163.gif
https://www.animatedimages.org/data/media/481/animated-duck-image-0020.gif
https://www.animatedimages.org/data/media/154/animated-clown-image-0178.gif
https://www.animatedimages.org/data/media/187/animated-dinosaur-image-0073.gif
https://www.animatedimages.org/data/media/194/animated-fish-image-0185.gif
https://www.animatedimages.org/data/media/1240/animated-hamtaro-image-0119.gif
https://www.animatedimages.org/data/media/1240/animated-hamtaro-image-0121.gif
https://www.animatedimages.org/data/media/1240/animated-hamtaro-image-0107.gif
https://www.animatedimages.org/data/media/1657/animated-wind-image-0008.gif
https://www.animatedimages.org/data/media/702/animated-whale-image-0024.gif
https://www.animatedimages.org/data/media/34/animated-ufo-image-0027.gif
https://www.animatedimages.org/data/media/129/animated-teddy-image-0109.gif
https://www.animatedimages.org/data/media/129/animated-teddy-image-0039.gif
https://www.animatedimages.org/data/media/982/animated-the-beatles-image-0022.gif
https://www.animatedimages.org/data/media/982/animated-the-beatles-image-0060.gif
https://www.animatedimages.org/data/media/982/animated-the-beatles-image-0056.gif
https://www.animatedimages.org/data/media/982/animated-the-beatles-image-0071.gif
https://www.animatedimages.org/data/media/1607/animated-tintin-image-0048.gif
https://www.animatedimages.org/data/media/600/animated-rocket-and-space-shuttle-image-0032.gif
https://www.animatedimages.org/data/media/118/animated-robot-image-0030.gif
https://www.animatedimages.org/data/media/118/animated-robot-image-0020.gif
https://www.animatedimages.org/data/media/1403/animated-orchestra-and-band-image-0010.gif
`.trim().split('\n');

const dropBackgroundImagesArr = `
bg/1.jpg
bg/2.jpg
bg/3.jpg
bg/4.jpg
bg/5.jpg
bg/6.jpg
bg/7.jpg
bg/8.jpg
bg/9.jpg
bg/20.gif
`.trim().split('\n');

function handleImageChange(input, imagesArr, element, isBackground = false) {
    let url = input.value.trim();
    const isImageURL = /\.(gif|jpg|jpeg)$/i.test(url);
    
    if (!isImageURL) {
        const index = parseInt(url, 10) - 1;
        url = (index >= 0 && index < imagesArr.length) ? imagesArr[index] : imagesArr[0];
    }

    if (isBackground) {
        element.style.backgroundImage = `url(${url})`;
    } else {
        element.src = url;
    }
}

dropMonkeyInput.addEventListener('change', () => handleImageChange(dropMonkeyInput, monkeyImagesArr, monkeyImage));
dropBackgroundInput.addEventListener('change', () => handleImageChange(dropBackgroundInput, dropBackgroundImagesArr, game, true));





dataSeparator.addEventListener('change', () => {
    if (dataSeparator.value === "預設") {
        dataSeparatorText = "\\t|=|\\\\";
		dataSeparatorTxt = "\t";
    } else {
        dataSeparatorText = dataSeparator.value;
		dataSeparatorTxt = dataSeparatorText;
    }
});

resetButton.addEventListener('click', () => {
    // 將題庫重設為預設值
    wordPairsStringInput.value = dataString.trim();

});

wesing.addEventListener('click', () => {
    window.open('https://sites.google.com/view/oikasu', '_blank');
});
/*
applyButton.addEventListener('click', () => {
	wordPairsString = wordPairsStringInput.value; 
	words = parseWordPairs(wordPairsString);
	renderWordTable(words);
	//closeSettingsPage();
    //startGame();
});
*/


// 轉換自訂的資料為題庫格式
function parseWordPairs(txt) {

    if (!checkWordPairsString(txt)) {
        console.log("字串格式不正確，無法解析。");
        return[];
    }

    // 先將每一行拆分成詞對，然後過濾掉空行
	const pairs = wordPairsString.trim().split('\n')
         .filter(pair => pair.trim() !== '')
         .map(pair => pair.split(new RegExp(dataSeparatorText)));
    return pairs.map(pair => ({
        word: pair[0],
        translation: pair[1]
    }));
}

function checkWordPairsString(txt) {
  // 將輸入字串以換行符號 '\n' 分割成多行
  let lines = txt.split('\n');
  
  // 檢查每行是否可以被正則分割
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.split(new RegExp(dataSeparatorText)).length < 2) {
      console.log(`錯誤：第 ${i + 1} 行不能被正確分割。內容：'${line}'`);
      // 從 lines 中移除該行
      lines.splice(i, 1);
      i--; // 因為刪除了一行，需要將迴圈索引減一
    }
  }

  // 檢查剩餘行數是否至少有3行
  if (lines.length < 1) {
    console.log("錯誤：字串行數少於1行。");
    return false;
  }else{
    wordPairsString = lines.join('\n');	
	return wordPairsString
  }
}


editWordPairsButton.addEventListener('click', () => {

    if (wordPairsStringInput.style.display === "block") {
	    if (!checkWordPairsString(wordPairsStringInput.value)) {
			var dataSeparator = document.getElementById('dataSeparator');
			dataSeparator.classList.add('red-border');  //here
            console.log("字串格式不正確，無法解析。");	
            return[];
        }else{
			wordPairsString = wordPairsStringInput.value.split('\n').filter(line => line.trim() !== '').join('\n');
			wordPairsStringInput.value = wordPairsString;
			words = parseWordPairs(wordPairsString);
			renderWordTable(words);

			wordPairsStringInput.style.display = "none";
			dataSeparatorGroup.style.display = "none";
			wordTableContainer.style.display = "block";
			swapButton.style.display = "inline-block";
			resetButton.style.display = "inline-block";
			applyButton.style.display = "inline-block";
			editWordPairsButton.innerText = "編輯";		
		}
    } else {

			wordPairsStringInput.style.display = "block";
			dataSeparatorGroup.style.display = "block";
			wordTableContainer.style.display = "none";
			swapButton.style.display = "none";
			resetButton.style.display = "none";
			applyButton.style.display = "none";
			editWordPairsButton.innerText = "確定";
			updateWordPairsString();
    }
});




let fallingWords = [];
let currentWord;
let wordDropTimeout;
let nextWordTimeout;

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
document.addEventListener('touchstart', handleTouchStart);
document.addEventListener('touchmove', handleTouchMove);

let touchStartX = 0;

let isMovingLeft = false;
let isMovingRight = false;
let step = 8;


function handleKeyDown(event) {
    if (!canMove) return; // 禁止移動
    if (event.key === 'ArrowLeft') {
        isMovingLeft = true;
    } else if (event.key === 'ArrowRight') {
        isMovingRight = true;
    }
}

function handleKeyUp(event) {
    if (event.key === 'ArrowLeft') {
        isMovingLeft = false;
    } else if (event.key === 'ArrowRight') {
        isMovingRight = false;
    }
}

function updateMonkeyPosition() {

    if (isMovingLeft && canMove && monkey.offsetLeft-monkey.clientWidth/3 > 0) {
		
        monkey.style.left = `${monkey.offsetLeft - step}px`;
    }
    if (isMovingRight && canMove && monkey.offsetLeft < game.clientWidth-monkey.clientWidth/3 ) {
		c(monkey.style.left)
        monkey.style.left = `${monkey.offsetLeft + step}px`;
    }
    requestAnimationFrame(updateMonkeyPosition);
}

// 開始更新猴子的位移
updateMonkeyPosition();

function handleTouchStart(event) {
    touchStartX = event.tTouches[0].clientX;
}

function handleTouchMove(event) {
    if (!canMove) return; // 禁止移動
    const touchEndX = event.touches[0].clientX;
    const moveDistance = touchEndX - touchStartX;

    if (moveDistance < 0 && monkey.offsetLeft > 0) {
        monkey.style.left = `${monkey.offsetLeft + moveDistance}px`;
    } else if (moveDistance > 0 && monkey.offsetLeft < (game.clientWidth - monkey.clientWidth)) {
        monkey.style.left = `${monkey.offsetLeft + moveDistance}px`;
    }

    touchStartX = touchEndX; // 更新起點為新的位置
}

function disableMovement(duration) {
    canMove = false;
    setTimeout(() => {
        monkey.classList.remove('blink');
        canMove = true;
    }, duration);
}


// 播放正確與錯誤音效
function playRightWrongSound(x) {
    if (dropSound != "mute") {
        let audio;
        if (x == "right") {
            audio = new Audio('right.mp3');
        } else if (x == "wrong") {
            audio = new Audio('wrong.mp3');
        }
        if (audio) {
            audio.play();
        }
    }
}



function dropWord(word, correct, leftPosition) {
    const wordDiv = document.createElement('div');
    wordDiv.classList.add('word');
    wordDiv.textContent = removePrefixes(word);

    // 設定詞語位置
    wordDiv.style.left = `${leftPosition}px`;
    game.appendChild(wordDiv);

    fallingWords.push({ element: wordDiv, correct });

    function fall() {
        if (!gameStarted) return;
        wordDiv.style.top = `${wordDiv.offsetTop + dropSpeed}px`;

        // 碰撞檢測
        const wordRect = wordDiv.getBoundingClientRect();
        const monkeyRect = monkey.getBoundingClientRect();

        if (
            wordRect.bottom >= monkeyRect.top &&
            wordRect.top <= monkeyRect.bottom &&
            wordRect.left <= monkeyRect.right &&
            wordRect.right >= monkeyRect.left
        ) {
            if (correct) {
				playRightWrongSound("right");
				showSparkle(wordDiv, true);
                score += 100;
                correctAnswers++;
                wordDiv.style.animation = 'hitEffect 0.5s forwards';
            } else {
				playRightWrongSound("wrong");
				showSparkle(wordDiv, false);
                score = Math.max(0, score - 100);
                wordDiv.style.animation = 'hitEffectWrong 0.5s forwards';
                monkey.classList.add('blink');
                disableMovement(1000); // 閃爍並停止移動1秒
            }
            setTimeout(() => {
                if (game.contains(wordDiv)) {
                    game.removeChild(wordDiv);
                }
                fallingWords = fallingWords.filter(w => w.element !== wordDiv);
                updateScore();
                nextWord();
            }, 500);
        } else if (wordDiv.offsetTop + wordDiv.clientHeight >= game.clientHeight) {
            if (correct) {
                score = Math.max(0, score - 50);
                missedCorrect++;
            }
            if (game.contains(wordDiv)) {
                game.removeChild(wordDiv); // 語詞到達底部時，該語詞消失
            }
            fallingWords = fallingWords.filter(w => w.element !== wordDiv);
            updateScore();
            nextWord();
        } else {
            requestAnimationFrame(fall);
        }
    }

    fall();
}




function startGame() {
    if (!gameStarted) {
		gameStarted = true; // 開始遊戲時將 gameStarted 設為 true
		startButton.style.display = 'none'; // 隱藏開始按鈕
		gameTitle.style.display = 'none';
		totalQuestions = 0;
		correctAnswers = 0;
		missedCorrect = 0;
		score = 0;
		timerDisplay.textContent = '0:00'; // 重置計時器顯示
		clearInterval(timerInterval); // 清除之前的計時器
		timerInterval = setInterval(updateTimer, 1000); // 重新啟動計時器

		game.style.display = 'block'; // 顯示遊戲區域
		scoreDiv.style.display = 'block';
		chineseWordDiv.display = 'block';

    shuffleWords();
    nextWord();
    }
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

let shuffledWords = [];
let currentWordIndex = 0;

function shuffleWords() {
    shuffledWords = shuffle([...words]);
    currentWordIndex = 0;
}




// here
function nextWord() {
    if (fallingWords.length === 0 && gameStarted) {


    if (currentWordIndex >= shuffledWords.length) {
        shuffleWords();
    }
    currentWord = shuffledWords[currentWordIndex];
    currentWordIndex++;

		//檢查語音檔
		startsWithPrefixes(currentWord);        

        totalQuestions++;
        updateScore();
		c(currentWord.word)
			c(removePrefixes(currentWord.word))


		

		chineseWordDiv.textContent = removePrefixes(currentWord.word);  //題目
        const allWords = words.map(w => w.translation);		
        const correctWord = removePrefixes(currentWord.translation); //正確答案
        let wrongWords = shuffle(allWords.filter(w => w !== correctWord)).slice(0, numWordsToDrop - 1); //錯誤答案


        // 隨機排列正確和錯誤的詞語
        const wordsToDrop = shuffle([...wrongWords, correctWord]);

        const usedPositions = [];

        let randomNum = 1 + Math.random() * 0.5; // 生成一個介於 1 到 1.5 之間的隨機數字
        let dropInterval = (1000 / dropSpeed) * randomNum; // 根據 dropSpeed 設定掉落的時間間隔

        for (let i = 0; i < numWordsToDrop; i++) {
            let leftPosition;
            do {
                leftPosition = Math.random() * (game.clientWidth - 50);
            } while (usedPositions.some(pos => Math.abs(pos - leftPosition) < 50)); // 確保位置之間的距離大於50
            usedPositions.push(leftPosition);

            wordDropTimeout = setTimeout(() => dropWord(wordsToDrop[i], wordsToDrop[i] === correctWord, leftPosition), dropInterval * (i + 1));
        }
    }
}

// 移除前綴記號;
//ka:;pinv-rim>漢字   這返回漢字
//ka:;pinv-rim      這返回pinv-rim
//aaa.mp3漢字
function removePrefixes(txt){	
	const pattern1 = /^\<?(ka|ho|tp|hl)\s*(;|:|!)([^>]+)\>\s*(.*)/;
	const pattern2 = /^\<?(ka|ho|tp|hl)\s*(;|:|!)([^>]+)\>?/;
	const pattern3 = /(\S+\.(mp3|wav|ogg))\s*(.*)/;
	const pattern4 = /(\S+\.(mp3|wav|ogg))\s*$/;
	const pattern5 = /(\S+\.(jpg|gif|jpeg))\s*(.*)/;
	const pattern6 = /(\S+\.(jpg|gif|jpeg))\s*$/;

	let m; //符合的陣列;

	if (m = txt.match(pattern1)) {
		return m[4].trim();
	}else if (m = txt.match(pattern2)) {
		return m[3];
	}else if (m = txt.match(pattern3)) {
		return m[3].trim();
	}else if (m = txt.match(pattern4)) {
		return m[1];
	}else if (m = txt.match(pattern5)) {
		return m[3].trim();
	}else if (m = txt.match(pattern6)) {
		return m[1];
	}else{
		return txt;	
	}
}



// 處理前綴符號與播放音檔
function startsWithPrefixes(e) {
    let txt = "";
    let matchArray; // 符合的陣列

    if (dropSound !== "mute" && dropSound !== "stop") {
        // 檢查是否包含語音標記
        let pattern = /^(ka|ho|tp|hl)(;|:)/;

        if (pattern.test(e.word)) { // 檢查 e.word 是否以指定前綴開頭
            console.log("A");
            txt = e.word;
        } else if (pattern.test(e.translation)) { // 檢查 e.translation 是否以指定前綴開頭
            console.log("B");
            txt = e.translation;
        } else { // 如果都不是，則返回 false
            console.log("C");
            // playWord(e.word); // 使用 Google 語音播放題目
            return; // 直接返回以避免後續無效操作
        }

        pattern = /^\<?(ho)\s*(;|:|!)([^>]+)\>?/;
        if ((matchArray = txt.match(pattern))) {
            let zvsxf = tailuoToZvsxfl(matchArray[3]);
            let tone = zvsxflToTailuo(matchArray[3]);
            p(snd, "ho", zvsxf);
        }

        pattern = /^\<?(kasu|ka|k|詔安|詔|安)\s*(;|:|!)([^>]+)\>?/;
        if ((matchArray = txt.match(pattern))) {
            let zvsxf = replaceToneToZvsxf(matchArray[3]);
            let tone = replaceZvsxfToTone(matchArray[3]);
            p(snd, "ka", zvsxf);
        }
    }
}








function updateScore() {
    scoreDiv.textContent = `分數: ${score}`;
    if (correctAnswers >= passNumber) {
        stopGame();
        showResultWindow(); // 顯示結果視窗
    }
    updateProgressBar();
}


function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    const progress = (correctAnswers / passNumber) * 100; // 基於正確答案數的進度
    progressBar.style.width = `${Math.min(progress, 100)}%`;
    //progressBar.textContent = `${Math.floor(Math.min(progress, 100))}%`;
}


function stopGame() {
    gameStarted = false; // 停止遊戲時將 gameStarted 設為 false
	clearInterval(timerInterval); // 停止計時器
    startButton.style.display = 'block';
	gameTitle.style.display = 'block';
	chineseWordDiv.innerText = '';

    // 停止掉落的字詞
    fallingWords.forEach(({ element }) => {
        if (game.contains(element)) {
            game.removeChild(element);
        }
    });
    fallingWords = [];

    clearTimeout(wordDropTimeout);
    clearTimeout(nextWordTimeout);
	
}


function playWord(word) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-TW&client=tw-ob&q=${encodeURIComponent(word)}`;
    audioElement.src = url;
    //audioElement.play();
}

// Fisher-Yates 洗牌算法
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 開始遊戲按鈕點擊事件
startButton.addEventListener('click', () => {
        startGame();
});


function showResultWindow() {
    const resultWindow = document.getElementById('resultWindow');
    const scoreText = document.getElementById('scoreText');
    const accuracyText = document.getElementById('accuracyText');
    const missedText = document.getElementById('missedText');
	accuracy = correctAnswers / totalQuestions;
	
	starRatingFn();

    
    scoreText.textContent = `得　分：${score}`;
    accuracyText.textContent = `正確率：${(accuracy * 100).toFixed(0)}%`;
    missedText.textContent = `漏接數：${missedCorrect} / ${totalQuestions}`;
    
    resultWindow.style.display = 'block'; // 這行需要移到最後

    // 重新開始按鈕的點擊事件
    const restartButton = document.querySelector('.restartButton');
    restartButton.addEventListener('click', () => {
        resultWindow.style.display = 'none'; // 隱藏結果視窗
		chineseWordDiv.display = 'block';
        startGame(); // 重新開始遊戲
    });
}



function showSparkle(wordDiv, condition) {
    const sparkle = document.createElement('div');
    if (condition == true) {
        sparkle.textContent = '+100';
        sparkle.classList.add('sparkle');
    } else {
        if (score > 0) {
            sparkle.textContent = '-50';
            sparkle.classList.add('sparkleX');
        }
    }

    sparkle.style.position = 'absolute';
    sparkle.style.top = '-30px';

    wordDiv.appendChild(sparkle);
    setTimeout(() => {
        sparkle.remove();
    }, 1000);
}








const settingsButton = document.getElementById('settingsButton');
const settingsPage = document.getElementById('settingsPage');
const closeSettingsButton = document.getElementById('closeSettingsButton');
const closeResultButton = document.getElementById('closeResultButton');

settingsButton.addEventListener('click', () => {
	startButton.style.display = 'none';
	closeResultPage();
    if (settingsPage.style.display === 'none' ) {
        settingsPage.style.display = 'block';
        requestAnimationFrame(() => {
            settingsPage.style.left = '0';
        });
        settingsButton.innerHTML = '';
    } else {
        closeSettingsPage();
		
    }
});

// 設定按鈕的點擊事件
closeSettingsButton.addEventListener('click', closeSettingsPage);


// 點擊其他區域關閉設定頁面的事件
document.addEventListener('click', (event) => {
    const target = event.target;
    if (settingsPage.style.display === 'block' && !settingsPage.contains(target) && target !== settingsButton) {
        closeSettingsPage();		
    }
});

// 關閉設定頁面的函數
function closeSettingsPage() {
    settingsPage.style.left = '-300px';
    setTimeout(() => {
        settingsPage.style.display = 'none';
		settingsButton.innerHTML = '&#9776;';
		if(!gameStarted){
		    startButton.style.display = 'block';
		}
    }, 300); // 確保動畫完成後再隱藏
    
}

closeResultButton.addEventListener('click', closeResultPage);
// 關閉設定頁面的函數
function closeResultPage() {
    setTimeout(() => {
        resultWindow.style.display = 'none';
    }, 200);    
}


// 初始化表格
renderWordTable(words);

function renderWordTable(wordPairs) {
    const wordTableContainer = document.getElementById('wordTableContainer');
    const table = document.createElement('table');
    table.classList.add('word-table');

    // 表格頂端的標題列
    const headerRow = document.createElement('tr');
    const wordHeader = document.createElement('th');
    const translationHeader = document.createElement('th');

    wordHeader.textContent = '題目';
    translationHeader.textContent = '答案';

    headerRow.appendChild(wordHeader);
    headerRow.appendChild(translationHeader);
    table.appendChild(headerRow);

    // 添加每一個詞對到表格中
    wordPairs.forEach(pair => {
        const row = document.createElement('tr');
        const wordCell = document.createElement('td');
        const translationCell = document.createElement('td');

        // 將單元格設置為可編輯的
        wordCell.setAttribute('contenteditable', 'true');
        translationCell.setAttribute('contenteditable', 'true');

        wordCell.textContent = pair.word;
        translationCell.textContent = pair.translation;

		// 監聽單元格失去焦點事件
		wordCell.addEventListener('blur', updateWordPairsString);
		translationCell.addEventListener('blur', updateWordPairsString);


        row.appendChild(wordCell);
        row.appendChild(translationCell);
        table.appendChild(row);
    });

    // 清空原來的容器並添加新的表格
    wordTableContainer.innerHTML = '';
    wordTableContainer.appendChild(table);
}

// 更新 wordPairsStringInput 的值
function updateWordPairsString() {
    const tableRows = document.querySelectorAll('#wordTableContainer .word-table tr:not(:first-child)');
    let txt = '';
	console.log("A" + dataSeparatorTxt + "B")
	
    tableRows.forEach(row => {
        const word = row.cells[0].textContent.trim();
        const translation = row.cells[1].textContent.trim();
        if (word && translation) {
            txt += `${word}${dataSeparatorTxt}${translation}\n`;
        }
    });

	wordPairsString = txt.split('\n').filter(line => line.trim() !== '').join('\n');

	wordPairsStringInput.value = wordPairsString;
	words = parseWordPairs(wordPairsString);
	renderWordTable(words);
}


// 交換左右兩欄
function swapColumns() {
    const wordTableContainer = document.getElementById('wordTableContainer');
    const rows = wordTableContainer.querySelectorAll('table tr');

    rows.forEach((row, index) => {
        if (index > 0) { // 跳過標題行
            const cells = row.querySelectorAll('td');
            const temp = cells[0].textContent;
            cells[0].textContent = cells[1].textContent;
            cells[1].textContent = temp;
        }
    });

	updateWordPairsString();
}

// 綁定交換按鈕的點擊事件
swapButton.addEventListener('click', swapColumns);


//全螢幕

chineseWordDiv.addEventListener('click', () => {
    toggleFullScreen();
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








let accuracy;
function starRatingFn(){
let starCount = Math.round(accuracy * 5); // 計算應顯示的星號數量

// 生成星號
let starRatingHTML = '';
for (let i = 0; i < 5; i++) {
    if (i < starCount) {
        starRatingHTML += '<span class="material-icons star">star</span>';
    } else {
        starRatingHTML += '<span class="material-icons star">star_border</span>';
    }
}
starRatingHTML += ` (${(accuracy * 100).toFixed(2)}%)`; // 加上百分比

// 更新 starRating 元素
document.getElementById('starRating').innerHTML = starRatingHTML;
}



function starRatingFn() {
    let starCount = Math.round(accuracy * 10); // 計算應顯示的半星數量
    let starRatingHTML = '';
    
    for (let i = 0; i < 5; i++) {
        if (starCount >= (i + 1) * 2) {
            // 滿星
            starRatingHTML += '<span class="material-icons star yellow">star</span>';
        } else if (starCount >= (i * 2) + 1) {
            // 半星
            starRatingHTML += '<span class="material-icons star yellow">star_half</span>';
        } else {
            // 白色星星
            starRatingHTML += '<span class="material-icons star white">star</span>';
        }
    }
   
    // 更新 starRating 元素
    document.getElementById('starRating').innerHTML = starRatingHTML;
}









//< 音檔播放 ===============================;
var currentElement = null;
var currentAudio = null;
var audioRate = 1; // 播放速率
var audioCurrentTime = 0.2; // 略過前幾秒
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

/*
        audioUrls = audioUrls.map(function(element) {
            if (regexDuoyinjie.test(element)) {
                if (dictionaryHolo[element] == undefined) {
                    let arr1 = element.split(/-+/);
                    let arr2 = element.split(/-+/).map(replaceHoloToneToChange);

                    arr2 = replaceUndefined(arr1, arr2, dictionaryHolo);

                    function replaceUndefined(arr1, arr2, dictionaryHolo) {
                        for (let i = 0; i < arr2.length; i++) {
                            if (dictionaryHolo[arr2[i]] == undefined) {
                                arr2[i] = arr1[i];
                            }
                        }
                        return arr2;
                    }
                    return arr2; // 如果符合條件，則返回分割後的陣列元素
                }
            }
            return element; // 否則返回原始的元素
        }).flat(); // 使用 flat 方法將結果扁平化成一個陣列
		*/
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
            audioRate = 1.2;
            audioCurrentTime = 0.1;
            audioLeftTime = 0.5;
			
            return `https://sutian.moe.edu.tw/media/subak/${holoNoNo}.wav`;
        } else if (/\bkasu|ka|k\b/.test(lang)) {
            audioRate = 1.2;
            audioCurrentTime = 0.05;
            audioLeftTime = 0.05;
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
        //element.textContent = "🔊";
    } else {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            //currentElement.textContent = "🔊";
        }
        playNextAudio(element, lang, audioUrls);
    }
}

// 播放下一個音訊
function playNextAudio(element, lang, audioUrls) {

    if (audioUrls.length === 0) {
        // 所有音訊都已經播放完畢
        //element.textContent = "🔊";
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
            //element.textContent = "🔉";

            currentAudio.addEventListener('ended', function() {
                // 當前音訊播放完畢，繼續播放下一個音訊
                playNextAudio(element, lang, audioUrls);
            });
        })
        .catch(error => {
            // 音訊播放失敗，改播放預設音檔
            //currentAudio = new Audio('https://oikasu.com/file/mp3/no-snd.mp3');
			playNextAudio(element, lang, audioUrls);
			/*			
            currentAudio.play()
                .then(() => {
                    // 預設音檔播放成功
                    /currentElement = element;
                    //element.textContent = "🔉";

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
				*/
        });
}




// 批次預先載入音檔
function preloadAudio(audioUrls) {
    audioUrls.forEach(function(url) {
        var audio = new Audio(url);
        audio.preload = 'auto'; // 設置為 "auto" 以啟用預載;
    });
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







function addTooltipBehavior(inputId, tooltipId) {
    const input = document.getElementById(inputId);
    const tooltip = document.getElementById(tooltipId);

    input.addEventListener('focus', function() {
        tooltip.style.display = 'block';
    });

    input.addEventListener('blur', function() {
        tooltip.style.display = 'none';
    });
}

// 使用示例：
//addTooltipBehavior('dropMonkey', 'tooltipMonkey');
//addTooltipBehavior('dropMonkey', 'tooltipMonkey');












// 載入時檢測
window.addEventListener('load', () => {
	checkURLParameter(); // 檢查網址是否包含某參數

    const savedWordPairs = localStorage.getItem('wordPairs');
    if (savedWordPairs) {
        textInput.value = savedWordPairs;
    }
    wordPairs = parseWordPairsFromURL(urlFull); // 解析網址參數與資料

	basicSettings();
	titleInput.value = gameTitle.textContent;	
});


// 檢查網址是否包含某參數
function checkURLParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const wordParams = ['w', 'word', 'words'];
    const titleParams = ['t', 'title', 'piaoti'];

	const numWordsToDropParams = ['n'];
	const passNumberParams = ['p'];
	const settingConditionParams = ['s', 'setting'];
	const dropSpeedParams = ['sp', 'speed'];
	const dropSoundParams = ['sd', 'sound'];
	const dropMonkeyParams = ['m', 'monkey'];


let siteName = window.location.origin; //原始網址，無路徑
let pathName = window.location.pathname; // 取得當前網頁的路徑（例如：/path/to/page）
let urlWithoutParams = siteName + pathName; // 組合出無參數的完整網址

longUrl = urlWithoutParams + "?n=" + numWordsToDrop + "&p=" + passNumber + "&t=" + customTitle + "&w=" +  + "&s=" + settingCondition + "速度=" + dropSpeed.value + "音檔=" + dropSound.value + "角色=" + dropMonkey.value ;

locationHref();


    for (const param of wordParams) {
        if (urlParams.has(param) && param[0] !== '' && param[0] !== 'undefined') {
            //showInputButton.style.display = 'none';
            break;
        } else {
            showInputButton.style.display = 'block';
        }
    }
    for (const param of titleParams) {
        if (urlParams.has(param) && param[0] !== '' && param[0] !== 'undefined') {
            customTitle = urlParams.get(param);
			titleInput.value = customTitle;
            gameTitle.textContent = decodeURIComponent(customTitle);
            break;
        }
    }
    for (const param of dockParams) {
        if (urlParams.has(param) && param[0] !== '' && param[0] !== 'undefined') {
			let value = urlParams.get(param)	
            if(value == 1 || value == "true"){
				showInputButton.style.display = 'none';
			}else{
				showInputButton.style.display = 'block';	
			}
            break;
        }
    }
}