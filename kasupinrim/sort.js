let link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'sort.css';
document.head.appendChild(link);

const style = document.createElement('style');
style.textContent = `

`;
document.head.appendChild(style);





let htmlSettingsPage = `
<div id="settingsPage">
    <h2>🥷客事100排排排</h2>
    <div>
        <label for="lessonSelect">分類：</label>
        <select id="lessonSelect"></select>
    </div>
    <div>
        <label for="questionSelect">題目：</label>
        <select id="questionSelect"></select>
    </div>
    <div>
        <label for="answerSelect">答案：</label>
        <select id="answerSelect"></select>
    </div>
    <div>
        <label for="orderSelect">次序：</label>
        <select id="orderSelect">
            <option value="random">隨機</option>
            <option value="sequential">依序</option>
        </select>
    </div>
    <div>
        <div>
            <label for="winConditionSelect">過關：</label>
            <select id="winConditionSelect">
                <option value="none">鼓勵</option>
				<option value="heart">五顆心</option>
                <option value="time" selected>限定時間</option>
                <option value="sentences">答對句數</option>
            </select>
        </div>
        <div id="timeConditionDiv">
            <label for="timeConditionSelect">限時：</label>
            <select id="timeConditionSelect">
                <option value="60" selected>60秒</option>
                <option value="90">90秒</option>
                <option value="120">120秒</option>
                <option value="180">180秒</option>
            </select>
        </div>
        <div id="sentencesConditionDiv" style="display: none;">
            <label for="sentencesConditionSelect">句數：</label>
            <select id="sentencesConditionSelect">
                <option value="5">5句</option>
                <option value="10">10句</option>
                <option value="15">15句</option>
                <option value="20">20句</option>
                <option value="30">30句</option>
                <option value="50">50句</option>
                <option value="100">100句</option>
            </select>
        </div>
        <div>
            <label for="playbackTimesSelect">播音：</label>
            <select id="playbackTimesSelect">
                <option value="1" selected>1次</option>
                <option value="2">2次</option>
				<option value="3">3次</option>
            </select>
        </div>
    </div>
	<button id="startButton">開始排排排</button>
</div>

<div id="gameContainer" style="display: none;">
    <div id="gameHeader">
        <button id="closeButton">✕</button>
        <div id="gameStats">            
            <span id="timeDisplay">⌛ 0秒</span>
            <span id="scoreDisplay">✨ 0</span>
            <span id="heartsDisplay" style="display: none;">❤️❤️❤❤❤️</span>
        </div>
    </div>
    <div id="sentenceArea">	 
        <div id="targetSentence">
		<span id="emoji" class="bounce-emoji">👻</span>           
            <span id="sentence-text"></span>
        </div>
        <div id="answerArea"></div>
		<div id="wordBank"></div>
    </div>
    <button id="checkButton" disabled>檢查答案</button>
</div>

<div id="gameEndModal" class="modal" style="display: none;">
    <div class="modal-content">
        <p id="gameEndMessage"></p>
        <div class="modal-buttons">
            <button id="returnButton">返回設定</button>
            <button id="continueButton">繼續遊戲</button>
        </div>
    </div>
</div>
`;

document.body.innerHTML = htmlSettingsPage;

/*
const myData = `
分類	國語	客語	拼音	注音	音檔
一、問好 00百句	ˊ ˆ	對不起	失禮	shidˊ liˆ	k014.k100
一、問好 00百句	ˋ ˆ ˆ	沒關係	無要緊	moˋ rhioˆ ginˆ	k015.k100
一、問好 00百句	ˆ ˋ	謝謝	勞力	looˆ ladˋ	k016.k100
一、問好 00百句	 ˆ ˆ 	不必客氣	毋使細義	m suˆ seˆ ngi	k021.k100
一、問好 00百句	ˇ ˇ ˆ ˆ	老師再見	先生再見	sienˇ senˇ zaiˆ gienˆ	k022.k100
一、問好 00百句	ˆ ˋ 	再見	正來尞	zhangˆ loiˋ leeu	k023.k100
二、紹介 00百句	ˋ ˆ ˆ ˊ ˆ ˋ	你叫什麼名字	你喊做麼个名	henˋ heemˆ zooˆ bbooˊ gaiˆ miangˋ	k027.k100
二、紹介 00百句	ˋ ˆ ˆ ˆ ˇ ˇ	我叫做李東興	𠊎喊做李東興	ngaiˋ heemˆ zooˆ liˆ dungˇ hinˇ	k028.k100
二、紹介 00百句	ˋ ˆ ˇ ˆ	你幾歲	你幾多歲	henˋ giˆ dooˇ seˆ	k036.k100
二、紹介 00百句	ˋ ˊ ˆ	我[七歲]	𠊎[七歲]	ngaiˋ cidˊ seˆ	k037.k100
二、紹介 00百句	ˋ  ˆ ˇ ˋ	你讀幾年級	你讀幾多年	henˋ tu giˆ dooˇ neenˋ	k049.k100
二、紹介 00百句	ˋ  ˊ ˋ	我讀[一年級]	𠊎讀[一年]	ngaiˋ tu rhidˊ neenˋ	k050.k100
`;
*/

const hanziTypes = ["國語", "客語", "客話", "四縣", "海陸", "大埔", "饒平", "詔安", "南四縣", "客家語", "中文", "漢字", "華語", "台語", "閩南語", "福州話", "閩東語", "馬祖", "馬祖話"];
const pinyinTypes = ["拼音", "注音", "台羅"];

/* 題庫解析與選單建立*/
// 解析題庫資料
const parsedData = myData.trim().split('\n').map(line => line.split('\t'));
const headers = parsedData[0];
const dataSlice = parsedData.slice(1);
const data = Array.from(new Set(dataSlice.map(JSON.stringify)), JSON.parse); // 使用 Set 移除重複項目;

// 獲取所有分類
const categories = ['全部', ...new Set(data.map(row => row[0]))];

// 動態生成選項
categories.forEach(category => {
    const option = document.createElement('option');
    option.value = option.textContent = category;
    lessonSelect.appendChild(option);
});

// 在頁面加載時初始化語言選項
document.addEventListener('DOMContentLoaded', initializeLanguageSelects);

// 修改資料準備和遊戲啟動邏輯
let gameData = []; // 儲存當前遊戲的題目資料
let usedQuestions = []; // 用於追踪已使用題目的陣列
let originalFilteredData = []; // 儲存原始篩選後的資料
let timerInterval;
const rightAudio = new Audio('right.mp3');
const wrongAudio = new Audio('wrong.mp3');
let currentAudio = null;


// 分類選擇變更時重置資料
lessonSelect.addEventListener('change', () => {
    // 重置資料追踪
    usedQuestions = [];
    originalFilteredData = [];
});

// 題目或答案類型選擇變更時重置資料
questionSelect.addEventListener('change', () => {
    usedQuestions = [];
    originalFilteredData = [];
});

answerSelect.addEventListener('change', () => {
    usedQuestions = [];
    originalFilteredData = [];
});

// 當遊戲模式改變時重置遊戲狀態
document.getElementById('winConditionSelect').addEventListener('change', function() {
    const timeConditionDiv = document.getElementById('timeConditionDiv');
    const sentencesConditionDiv = document.getElementById('sentencesConditionDiv');
    const timeDisplay = document.getElementById('timeDisplay');

    // 先隱藏所有條件選項
    timeConditionDiv.style.display = 'none';
    sentencesConditionDiv.style.display = 'none';

    // 清除時間警告樣式
    if (timeDisplay) {
        timeDisplay.classList.remove('time-warning');
    }

    // 根據選擇顯示對應選項
    if (this.value === 'time') {
        timeConditionDiv.style.display = 'block';
        gameState.winCondition = 'time';
    } else if (this.value === 'sentences') {
        sentencesConditionDiv.style.display = 'block';
        gameState.winCondition = 'sentences';
    } else {
        gameState.winCondition = 'none';
    }

    // 重置遊戲狀態
    resetGameState();
});

// 初始化時根據預設選項顯示對應的條件選項
document.addEventListener('DOMContentLoaded', function() {
    // 初始化語言選項
    initializeLanguageSelects();

    // 獲取選單元素
    const winConditionSelect = document.getElementById('winConditionSelect');
    const timeConditionDiv = document.getElementById('timeConditionDiv');
    const sentencesConditionDiv = document.getElementById('sentencesConditionDiv');

    // 根據預設值顯示對應的條件選項
    const selectedCondition = winConditionSelect.value;
    timeConditionDiv.style.display = selectedCondition === 'time' ? 'block' : 'none';
    sentencesConditionDiv.style.display = selectedCondition === 'sentences' ? 'block' : 'none';
    gameState.winCondition = selectedCondition;
});


// 修改開始按鈕事件處理
startButton.addEventListener('click', () => {
    // 準備遊戲資料
    if (!prepareGameData()) {
        alert('無法開始遊戲：沒有足夠的題目');
        return;
    }
    // 重置遊戲狀態
    resetGameState();

    // 設定音檔播放次數
    gameState.audioPlaybackTimes = parseInt(playbackTimesSelect.value);

    // 設定倒數時間（如果是限時模式）
    if (gameState.winCondition === 'time') {
        gameState.countdown = parseInt(document.getElementById('timeConditionSelect').value);
    }

    // 隱藏設定頁面，顯示遊戲容器
    document.getElementById('settingsPage').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';

    // 初始化遊戲
    initGame();

    // 開始遊戲和計時
    gameState.isPlaying = true;
    startTimer();
});

// 遊戲狀態管理
const gameState = {
    currentSentence: null,
    shuffledWords: [],
    selectedWords: [],
    wordStates: [],
    correctAnswers: 0, 
    totalAnswers: 0,   
    score: 0,       
    hearts: 5, 
    maxHearts: 5,
    accumulatedScore: 0,
	consecutiveCorrect: 0,
    timer: 0,          
    totalTimer: 0,     
    isPlaying: false,  
    audioPlaybackTimes: 1,
    countdown: 0,      
    winCondition: 'time',
    completedRounds: 0 
};


// 關閉按鈕事件處理
document.getElementById('closeButton').addEventListener('click', () => {
    // 停止遊戲
    gameState.isPlaying = false;
    clearInterval(timerInterval);
    timerInterval = null;
    // 隱藏遊戲容器，顯示設定頁面
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('settingsPage').style.display = 'flex';
    // 重置遊戲狀態
    resetGameState();
    updateTimeDisplay();
});

// 遊戲結束對話框按鈕事件
document.getElementById('returnButton').addEventListener('click', () => {
    document.getElementById('gameEndModal').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('settingsPage').style.display = 'flex';

    // 只有在達成目標配對數時才重置追踪
    if (gameState.winCondition !== 'pairs' ||
        gameState.totalMatchedPairs >= gameState.requiredPairs) {
        usedQuestions = [];
        originalFilteredData = [];
        // 重置遊戲狀態
        gameState.totalMatchedPairs = 0;
        gameState.totalTimer = 0;
        gameState.score = 0;
    }
});

// 繼續按鈕事件處理
document.getElementById('continueButton').addEventListener('click', () => {
    document.getElementById('gameEndModal').style.display = 'none';

    // 重置遊戲數據
    gameState.totalAnswers = 0;
    gameState.score = 0;
    
    // 新增：重置愛心數量（如果是愛心模式）
    if (gameState.winCondition === 'heart') {
        gameState.hearts = gameState.maxHearts;
        updateHeartsDisplay();
    }

    // 重置遊戲狀態
    if (gameState.winCondition === 'time' && gameState.countdown <= 0) {
        // 時間結束後重新開始，重置所有數據
        resetGameState();
    } else if (gameState.winCondition === 'sentences' &&
        gameState.completedRounds >= parseInt(document.getElementById('sentencesConditionSelect').value)) {
        // 達到目標句數時重置
        resetGameState();
    }

    // 準備新的遊戲資料
    if (!prepareGameData()) {
        alert('無法開始遊戲：沒有足夠的題目');
        return;
    }

    // 重新開始遊戲
    gameState.isPlaying = true;
    initGame();
    startTimer();
});

// 答案檢查按鈕處理
document.getElementById('checkButton').addEventListener('click', function() {
    if (!this.disabled) {
        checkAnswer();
    }
});

// 音檔播放按鈕處理
document.getElementById('emoji').addEventListener('click', function() {
    const currentQuestion = gameData[gameState.totalAnswers];
    const audioFile = currentQuestion[headers.indexOf('音檔')];
    if (audioFile) {
        playCurrentAudio(audioFile, gameState.audioPlaybackTimes);
    }
});



// 1. 初始化資料與基本設定
function initializeLanguageSelects() {
    // 取得可用語言並過濾掉 '分類' 和 '音檔'
    const availableLanguages = headers.filter(header => 
        !['分類', '音檔'].includes(header));
    
    // 填充選擇器
    populateSelects(availableLanguages);
    
    // 當 questionSelect 變更時更新 answerSelect
    questionSelect.addEventListener('change', () => {
        updateAnswerSelect(availableLanguages);
    });
}

// 2. 建立選項元素
function createOption(lang) {
    const option = document.createElement('option');
    option.value = option.textContent = lang;
    return option;
}


// 新增：預設答案映射關係
const defaultAnswerMapping = {
    '國語': '客語',
    '客語': '注音',
    '拼音': '客語',
    '注音': '國語'
};
// 3. 填充語言選擇器選項

function populateSelects(languages) {
    // 清空既有選項
    questionSelect.innerHTML = '';
    answerSelect.innerHTML = '';

    // 設定所有語言選項
    languages.forEach(lang => {
        const option = createOption(lang);
        questionSelect.appendChild(option);
    });

    // 設定題目預設值為「國語」
    Array.from(questionSelect.options).forEach((option, index) => {
        if (option.value === '國語') {
            questionSelect.selectedIndex = index;
        }
    });

    // 更新答案選擇器
    updateAnswerSelect(languages);
}


// 4. 更新答案語言選擇器

function updateAnswerSelect(languages) {
    const selectedQuestion = questionSelect.value;
    answerSelect.innerHTML = '';
    
    // 填入除了題目語言外的所有選項
    languages
        .filter(lang => lang !== selectedQuestion)
        .forEach(lang => {
            const option = createOption(lang);
            answerSelect.appendChild(option);
        });

    // 根據映射關係設定預設答案
    const defaultAnswer = defaultAnswerMapping[selectedQuestion];
    if (defaultAnswer) {
        Array.from(answerSelect.options).forEach((option, index) => {
            if (option.value === defaultAnswer) {
                answerSelect.selectedIndex = index;
            }
        });
    }

    // 根據選項數量啟用或禁用開始按鈕
    startButton.disabled = answerSelect.options.length === 0;
}


// 5. 遊戲資料準備
function prepareGameData() {
    const selectedCategory = lessonSelect.value;
    const questionType = questionSelect.value;
    const answerType = answerSelect.value;
    const winCondition = document.getElementById('winConditionSelect').value;
    const orderType = document.getElementById('orderSelect').value; // 新增：取得順序設定

    // 根據遊戲模式決定要選擇的題目數量
    let selectedCount;
    if (winCondition === 'sentences') {
        selectedCount = parseInt(document.getElementById('sentencesConditionSelect').value);
    } else {
        selectedCount = 20;
    }

    // 修改：根據順序設定處理資料
    let allData = [...data];
    if (orderType === 'random') {
        shuffleArray(allData);
    }
    // sequential 模式下保持原始順序

    // 根據分類篩選資料
    let filteredData = selectedCategory === '全部' 
        ? allData 
        : allData.filter(item => item[0] === selectedCategory);

    // 第一次載入時初始化題庫
    if (originalFilteredData.length === 0) {
        originalFilteredData = filteredData;
    }

    // 從未使用的題目中選擇
    let availableQuestions = filteredData.filter(q => 
        !usedQuestions.some(used => 
            used[headers.indexOf(questionType)] === q[headers.indexOf(questionType)] &&
            used[headers.indexOf(answerType)] === q[headers.indexOf(answerType)]
        )
    );

    // 如果可用題目不足，重置已使用題目清單
    if (availableQuestions.length < selectedCount) {
        usedQuestions = [];
        availableQuestions = [...originalFilteredData];
    }

    // 選擇指定數量的題目
    gameData = availableQuestions.slice(0, selectedCount);

    // 將選中的題目加入已使用清單
    gameData.forEach(q => usedQuestions.push(q));

    // 更新遊戲狀態
    gameState.winCondition = winCondition;
    if (winCondition === 'time') {
        gameState.countdown = parseInt(document.getElementById('timeConditionSelect').value);
    }

    return gameData.length > 0;
}

// 6. 陣列隨機排序
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 7. 單字隨機排序
function shuffleWords(words) {
  const shuffled = [...words];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}


// 9. 更新單字選擇區
function updateWordBank() {
    const wordBank = document.getElementById('wordBank');
    wordBank.innerHTML = '';
    
    gameState.shuffledWords.forEach((word, index) => {
        const wordElement = document.createElement('div');
        wordElement.className = `word ${gameState.wordStates[index] ? 'selected' : ''}`;
        wordElement.textContent = word;
        wordElement.draggable = true;
        
        if (!gameState.wordStates[index]) {
            wordElement.addEventListener('click', () => {
                playSingleAudio(yinToKasu(word) + ".kasu"); // here播放單詞音檔，要知道目前是什麼拼音、注音、漢字有無加注音
                selectWord(index);
            });
        }
        
        wordBank.appendChild(wordElement);
    });
}

function yinToKasu(t) {
    t = t.replace(/ˊ/gi, 'z');
    t = t.replace(/ˆ/gi, 'x');
    t = t.replace(/\^/gi, 'x');
    t = t.replace(/ˇ/gi, 'v');
    t = t.replace(/ˋ/gi, 's');
    t = t.replace(/⁺/gi, 'f');
    t = t.replace(/\+/gi, 'f');
    t = t.replace(/bb/gi, 'v');
    t = t.replace(/oo/gi, 'o');
    if (/[\uE100-\uE15F]/.test(t)) { // 取代小注音為拼音
        t = replaceLeftToRight(t, zhuyinSmallPinyin);
	} 
    if (/[\uE166-\uE24B]/.test(t)) { // 取代直注音為拼音，並刪除漢字
		t = t.replace(/[^\uE166-\uE24B]/g, "");
        t = replaceLeftToRight(t, zhuyinMiniPinyin);		
	} 
    return t;
}




// 10. 更新答案區域
function updateAnswerArea() {
    const answerArea = document.getElementById('answerArea');
    answerArea.innerHTML = '';
    
    gameState.selectedWords.forEach((index) => {
        const wordElement = document.createElement('div');
        wordElement.className = 'selected-word';
        wordElement.textContent = gameState.shuffledWords[index];
        wordElement.addEventListener('click', () => removeWord(gameState.selectedWords.indexOf(index)));
        answerArea.appendChild(wordElement);
    });
	updateCheckButton();
}

// 11. 單字選擇處理
function selectWord(index) {
    if (!gameState.wordStates[index]) {
        gameState.wordStates[index] = true;
        gameState.selectedWords.push(index);
        updateWordBank();
        updateAnswerArea();
        updateCheckButton();
    }
}

// 12. 移除已選單字
function removeWord(selectedIndex) {
    if (selectedIndex >= 0) {
        const originalIndex = gameState.selectedWords[selectedIndex];
        gameState.wordStates[originalIndex] = false;
        gameState.selectedWords.splice(selectedIndex, 1);
        updateWordBank();
        updateAnswerArea();
        updateCheckButton();
    }
}

// 14. 檢查答案按鈕狀態更新
function updateCheckButton() {
    const checkButton = document.getElementById('checkButton');
    
    // 取得當前題目的總字詞數
    const totalWords = gameState.shuffledWords.length;
    
    // 只有當選擇的字詞數等於總字詞數時才啟用按鈕
    checkButton.disabled = gameState.selectedWords.length !== totalWords;
}

// 15. 答案檢查
function checkAnswer() {
    const correctAnswer = gameState.currentSentence;
    const userAnswer = gameState.selectedWords
        .map(index => gameState.shuffledWords[index])
        .join(' ');
    const selectedWord = answerArea.querySelectorAll('.selected-word');
    const checkButton = document.getElementById('checkButton');
    

    // 移除多餘空格再比較
    const normalizedCorrect = correctAnswer.replace(/\s+/g, '').trim();
    const normalizedUser = userAnswer.replace(/\s+/g, '').trim();

    if (normalizedCorrect === normalizedUser) {
		checkButton.disabled = true;
        playAudio(rightAudio);
        gameState.correctAnswers++;		
        
        // 逐個延遲跳動效果
        selectedWord.forEach((tile, index) => {
            setTimeout(() => {
                tile.classList.add('jump');
                setTimeout(() => tile.classList.remove('jump'), 300);
            }, index * 100);
        });

        const earnedScore = calculateScore();
        gameState.score += earnedScore;

        if (gameState.winCondition === 'time') {
            gameState.accumulatedScore += earnedScore;
        }

        gameState.completedRounds++;
		gameState.consecutiveCorrect++;

		if (gameState.winCondition === 'none' && gameState.consecutiveCorrect % 5 === 0) {
			// 每連續答對5題就顯示鼓勵訊息
			setTimeout(() => {
				showEncouragement();
			}, 1000);
		} else {
			if (shouldEndGame()) {
				endGame(determineEndReason());
			} else {
				setTimeout(() => {
					nextQuestion();
				}, 1000);
			}
		}
    } else {
		checkButton.disabled = true;
        playAudio(wrongAudio);
        showWrongAnswer();
		gameState.consecutiveCorrect = 0;

        // 錯誤時的抖動效果
        selectedWord.forEach(tile => {
            tile.classList.add('shake');
            setTimeout(() => tile.classList.remove('shake'), 300);
        });

        // 新增：愛心模式的錯誤處理
        if (gameState.winCondition === 'heart') {
            gameState.hearts--;
            updateHeartsDisplay();
            
            // 檢查是否已無愛心
            if (gameState.hearts <= 0) {
                endGame('hearts');
                return;
            }
        }
    }

    updateScoreDisplay();
}

// 鼓勵訊息
const encourageMessages = [
    "你真厲害！",
    "你真𠢕！",
    "你真慶！",
    "你真會！",
    "你足厲害！",
    "你足𠢕！",
    "你足慶！",
    "你足會！",
    "你滿足厲害！",
    "你滿足𠢕！",
    "你滿足慶！",
    "你滿足會！"
];


// 更新愛心
function updateHeartsDisplay() {
    const heartsDisplay = document.getElementById('heartsDisplay');
    if (heartsDisplay) {
        heartsDisplay.textContent = '❤️'.repeat(gameState.hearts);
    }
}
// 顯示鼓勵訊息
function showEncouragement() {
    const sentenceArea = document.getElementById('sentenceArea');
    const checkButton = document.getElementById('checkButton');
    const currentEmoji = document.getElementById('emoji').textContent;
    
    // 隱藏遊戲區域元素
    sentenceArea.style.visibility = 'hidden';
    checkButton.style.visibility = 'hidden';
    
    // 建立鼓勵訊息區域
    const encourageArea = document.createElement('div');
    encourageArea.style.textAlign = 'center';
    encourageArea.style.position = 'absolute';
    encourageArea.style.width = '100%';
    encourageArea.style.left = '0';
    encourageArea.style.top = '50%';
    encourageArea.style.transform = 'translateY(-50%)'; 
    
    // 隨機選擇一句鼓勵的話
    const randomMessage = encourageMessages[Math.floor(Math.random() * encourageMessages.length)];
    
    encourageArea.innerHTML = `
        <div style="font-size: 96px;">${currentEmoji}</div>
        <div style="font-size: 24px; margin-top: 10px;">
            ${randomMessage}<br>
            您連續答對 ${gameState.consecutiveCorrect} 題！
        </div>
    `;
    
    // 插入鼓勵訊息
    document.getElementById('gameContainer').insertBefore(
        encourageArea,
        checkButton
    );
    
    // 2秒後移除鼓勵訊息並顯示下一題
    setTimeout(() => {
        encourageArea.remove();
        sentenceArea.style.visibility = 'visible';
        checkButton.style.visibility = 'visible';
        nextQuestion();
    }, 2000);
}



// 16. 計算得分
function calculateScore() {
    let score = 100; // 基礎分數
/*
    if (gameState.winCondition === 'time') {
        // 限時模式額外加分
        const timeBonus = Math.floor(gameState.countdown / 2);
        score += timeBonus;
    }
	//可思考依長度計分
*/
    return score;
}

// 17. 顯示錯誤提示
function showWrongAnswer() {
    const answerArea = document.getElementById('answerArea');
    answerArea.classList.add('wrong-answer');

    setTimeout(() => {
        answerArea.classList.remove('wrong-answer');
    }, 1000);
}


// 18. 進入下一題
function nextQuestion() {
    // 更新總答題數
    gameState.totalAnswers++;

    // 檢查是否還有下一題
    if (gameState.totalAnswers < gameData.length) {
        initGame();
    } else {
        // 如果題目用完但遊戲還沒結束（例如限時模式），重新準備題目
        if (!shouldEndGame()) {
            if (prepareGameData()) {
                gameState.totalAnswers = 0;
                initGame();
            } else {
                endGame('complete');
            }
        } else {
            endGame(determineEndReason());
        }
    }
}


// 19. 更新顯示資訊
function updateDisplays() {
    updateScoreDisplay();
    updateTimeDisplay();
}

// 20. 更新分數顯示
function updateScoreDisplay() {
    const scoreDisplay = document.getElementById('scoreDisplay');
    if (scoreDisplay) {
        scoreDisplay.textContent = `✨ ${gameState.score}`;
    }
}

// 21. 更新時間顯示
function updateTimeDisplay() {
    const timeDisplay = document.getElementById('timeDisplay');
    if (timeDisplay) {
        if (gameState.winCondition === 'time') {
            // 倒數計時顯示
            const minutes = Math.floor(gameState.countdown / 60);
            const seconds = gameState.countdown % 60;
            timeDisplay.textContent = `⌛ ${minutes}:${seconds.toString().padStart(2, '0')}`;

            // 當時間少於10秒時加入視覺提醒
            if (gameState.countdown <= 10) {
                timeDisplay.className = 'time-warning';
            } else {
                timeDisplay.className = '';
            }
        } else {
            // 一般計時顯示
            const minutes = Math.floor(gameState.totalTimer / 60);
            const seconds = gameState.totalTimer % 60;
            timeDisplay.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
			timeDisplay.classList.remove('time-warning');
        }
    }
}


// 22. 開始計時器
function startTimer() {
    clearInterval(timerInterval);

    // 修改：只在第一次開始遊戲時設定倒數時間
    if (gameState.winCondition === 'time' && !timerInterval) {
        gameState.countdown = parseInt(document.getElementById('timeConditionSelect').value);
        gameState.accumulatedScore = 0;
        gameState.completedRounds = 0;
    }

    timerInterval = setInterval(() => {
        if (gameState.isPlaying) {
            if (gameState.winCondition === 'time') {
                gameState.countdown--;
                updateTimeDisplay();
                // 修改：時間到時立即停止遊戲並顯示結果
                if (gameState.countdown < 0) {
                    gameState.isPlaying = false;  // 新增：立即停止遊戲
                    clearInterval(timerInterval); // 新增：清除計時器
                    endGame('timeout');
                    return;
                }
            } else {
                gameState.timer++;
                gameState.totalTimer++;
                updateTimeDisplay();
            }
        }
    }, 1000);
}

// 23. 格式化時間顯示
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}分${remainingSeconds}秒`;
}


// 24. 遊戲初始化
function initGame() {
    const questionType = questionSelect.value;
    const answerType = answerSelect.value;
    const currentQuestion = gameData[gameState.totalAnswers];
	let words = [];
    const existingEncourageArea = document.querySelector('#gameContainer > div:not(#sentenceArea):not(#gameHeader)');
    if (existingEncourageArea) {
        existingEncourageArea.remove();
    }
    if (!currentQuestion) {
        console.error('No question available');
        endGame('complete');
        return;
    }

    // 設定當前句子
    gameState.currentSentence = currentQuestion[headers.indexOf(answerType)];
	let txt = gameState.currentSentence.trim();

	// 直式注音加空格來分割
    if (txt.split(/\s+/).length === 1 && /[\uE166-\uE24B]/.test(txt)) {
        txt = txt.replace(/([\uE166-\uE24B]+)(?=\S|$)/g, "$1 ");
    } 
	// 一般漢字加空格來分割
	if (txt.split(/\s+/).length === 1 && hanziTypes.includes(answerType)) {
		txt = Array.from(txt).join(" ");
	}
	// 一個拼音
	if (txt.split(/\s+/).length === 1 && pinyinTypes.includes(answerType)) {
		txt = splitWord(txt).join(" ");
		txt = txt.replace(/(\s+)([ˊˇˋˆ⁺^+])/g, "$2");
	}
	// 二個拼音
	if (txt.split(/\s+/).length === 2 && pinyinTypes.includes(answerType)) {
		txt = splitWordTwo(txt).join(" ");
		txt = txt.replace(/(\s+)([ˊˇˋˆ⁺^+])/g, "$2");
	}


    // 以空格分割陣列
   words = txt.split(/\s+/).filter(word => word.trim().length > 0);

	/*
	words = txt.split(/\s+/).filter(word => word.trim().length > 0);

	// 儲存已合併的標記
	let merged = new Array(words.length).fill(false);

	while (words.length > 4) {
	  let availablePairs = [];

	  // 找到所有相鄰且未合併的對
	  for (let i = 0; i < words.length - 1; i++) {
		if (!merged[i] && !merged[i + 1]) {
		  availablePairs.push(i);
		}
	  }
	  // 如果沒有可用對，就退出（避免無窮循環）
	  if (availablePairs.length === 0) break;
	  // 隨機選擇一個可用對來合併
	  let randomIndex = Math.floor(Math.random() * availablePairs.length);
	  let indexToMerge = availablePairs[randomIndex];

	  // 合併選定對
	  words[indexToMerge] = words[indexToMerge] + words[indexToMerge + 1];

	  // 移除被合併的元素
	  words.splice(indexToMerge + 1, 1);

	  // 標記合併位置，避免重複合併
	  merged.splice(indexToMerge + 1, 1); // 移除合併後的標記
	  merged[indexToMerge] = true;
	}
	*/

    gameState.shuffledWords = shuffleWords([...words]);
    gameState.selectedWords = [];
    // 初始化單字狀態陣列
    gameState.wordStates = new Array(gameState.shuffledWords.length).fill(false);

    updateWordBank();
    updateAnswerArea();
    updateCheckButton();
	const emojis = ['😀','😄','🤡','👺','👻','👽','👾','🤖','😺','😸','🧒','👧','🙋','️🙋','️🐵','🐶','🦁','🐯','🦄','🐰','🐹','🐷','🐻','🐻‍❄','️🐨','🐼','🦥','🐔','🐥','🐣','🦉','🦖','🎅','🧌','🧜','🧙','‍🧑‍🚀','👤','🧑‍💻','👩‍💻','👨‍🎤','👩‍🎤','🧑‍🎤','🧑‍🎨','👩‍🚀'];

    // 顯示題目
    const sentenceText = document.getElementById('sentence-text');
    const emoji = document.getElementById('emoji');

    // 自動播放音檔
    const audioFile = currentQuestion[headers.indexOf('音檔')];
    if (audioFile) {
        playCurrentAudio(audioFile, gameState.audioPlaybackTimes);
    }

    // 隨機選擇一個表情符號
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    // 設置文字內容和表情符號
    sentenceText.textContent = currentQuestion[headers.indexOf(questionType)];
    emoji.textContent = randomEmoji;
    
    // 重新觸發表情符號動畫
    emoji.classList.remove('bounce-emoji');
    void emoji.offsetWidth; // 觸發 reflow
    emoji.classList.add('bounce-emoji');
}

// 新增的函數，用於分割單個詞彙
function splitWord(word) {
  const exceptions = ['rh', 'zh', 'ch', 'sh', 'bb', 'ee', 'oo', 'ng', 'ii', 'er', 'ir', 'ere', 'oe', 'nn', 'tsh', 'ph', 'th', 'kh', 'ts', 'M̀', 'm̀', 'M̂', 'N̂', 'm̂', 'n̂', 'M̄', 'N̄', 'm̄', 'n̄', 'M̆', 'm̆', 'N̆', 'n̆', 'Ő͘', 'ő͘', 'A̋', 'E̋', 'I̋', 'M̋', 'N̋', 'a̋', 'e̋', 'i̋', 'm̋', 'n̋', 'M̌', 'Ň', 'm̌', 'ň', 'O̍͘', 'o̍͘', 'A̍', 'E̍', 'I̍', 'M̍', 'N̍', 'O̍', 'U̍', 'a̍', 'e̍', 'i̍', 'm̍', 'n̍', 'o̍', 'u̍', 'Ő͘', 'ő͘', 'O̍͘', 'o̍͘', 'O͘', 'o͘', 'Ò͘', 'Ó͘', 'Ô͘', 'ò͘', 'ó͘', 'ô͘', 'Ō͘', 'ō͘', 'Ǒ͘', 'ǒ͘', 'ỳ', 'ȳ', 'y̌'];
  let result = [];
  let temp = '';
  for (let i = 0; i < word.length; i++) {
    temp += word[i];
    if (i < word.length - 1) {
      const pair = word[i] + word[i + 1];
      if (!exceptions.includes(pair)) {
        result.push(temp);
        temp = '';
      }
    }
  }
  if (temp !== '') {
    result.push(temp);
  }
  return result;
}

function splitWordTwo(word) {
  const exceptions = ['uei', 'ieu', 'ioo', 'eeu', 'iai', 'iau', 'uai', 'iui', 'ioi', 'ai', 'au', 'ao', 'oa', 'ua', 'ia', 'iu', 'ii', 'ui', 'oi', 'io', 'eu', 'ue', 'ie', 'uo', 'rh', 'zh', 'ch', 'sh', 'bb', 'ee', 'oo', 'ng', 'ii', 'er', 'ir', 'ere', 'oe', 'nn', 'tsh', 'ph', 'th', 'kh', 'ts', 'M̀', 'm̀', 'M̂', 'N̂', 'm̂', 'n̂', 'M̄', 'N̄', 'm̄', 'n̄', 'M̆', 'm̆', 'N̆', 'n̆', 'Ő͘', 'ő͘', 'A̋', 'E̋', 'I̋', 'M̋', 'N̋', 'a̋', 'e̋', 'i̋', 'm̋', 'n̋', 'M̌', 'Ň', 'm̌', 'ň', 'O̍͘', 'o̍͘', 'A̍', 'E̍', 'I̍', 'M̍', 'N̍', 'O̍', 'U̍', 'a̍', 'e̍', 'i̍', 'm̍', 'n̍', 'o̍', 'u̍', 'Ő͘', 'ő͘', 'O̍͘', 'o̍͘', 'O͘', 'o͘', 'Ò͘', 'Ó͘', 'Ô͘', 'ò͘', 'ó͘', 'ô͘', 'Ō͘', 'ō͘', 'Ǒ͘', 'ǒ͘', 'ỳ', 'ȳ', 'y̌', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',];
  let result = [];
  let temp = '';
  for (let i = 0; i < word.length; i++) {
    temp += word[i];
    if (i < word.length - 1) {
      const pair = word[i] + word[i + 1];
      if (!exceptions.includes(pair)) {
        result.push(temp);
        temp = '';
      }
    }
  }
  if (temp !== '') {
    result.push(temp);
  }
  return result;
}

// 25. 重置遊戲狀態
function resetGameState() {
    // 重置所有追蹤數據
    usedQuestions = [];
    originalFilteredData = [];
	gameState.hearts = gameState.maxHearts; 

    // 重置遊戲狀態
    gameState.totalAnswers = 0;
    gameState.totalTimer = 0;
    gameState.timer = 0;
    gameState.score = 0;
    gameState.accumulatedScore = 0;
    gameState.completedRounds = 0;
    gameState.isPlaying = false;
	gameState.consecutiveCorrect = 0;

    // 如果是限時模式，重置倒數時間
    if (gameState.winCondition === 'time') {
        gameState.countdown = parseInt(document.getElementById('timeConditionSelect').value);
    }

    // 清除計時器
    clearInterval(timerInterval);
    timerInterval = null;

    // 更新顯示
    updateDisplays();

   // 更新愛心顯示
    const heartsDisplay = document.getElementById('heartsDisplay');
    if (heartsDisplay) {
        heartsDisplay.style.display = gameState.winCondition === 'heart' ? 'inline' : 'none';
    }
    updateHeartsDisplay();
}


// 26. 判斷遊戲是否應該結束
function shouldEndGame() {
    switch (gameState.winCondition) {
        case 'heart':
            return gameState.hearts <= 0;
        case 'time':
            return gameState.countdown <= 0;
        case 'sentences':
            const targetSentences = parseInt(document.getElementById('sentencesConditionSelect').value);
            return gameState.completedRounds >= targetSentences;
        case 'none':
            return false;
        default:
            return false;
    }
}


// 27. 決定遊戲結束原因
function determineEndReason() {
    if (gameState.winCondition === 'heart' && gameState.hearts <= 0) {
        return 'hearts';
    }
    if (gameState.winCondition === 'time' && gameState.countdown <= 0) {
        return 'timeout';
    } else if (gameState.winCondition === 'sentences' &&
               gameState.completedRounds >= parseInt(document.getElementById('sentencesConditionSelect').value)) {
        return 'complete';
    }
    return 'complete';
}


// 28. 建立遊戲結束訊息
function createEndMessage(stats) {
    const messages = [];
    if (stats.score !== undefined) messages.push(`得分：${stats.score}`);
    if (stats.time) messages.push(`時間：${formatTime(stats.time)}`);
    return messages.join('\n');
}

// 29. 遊戲結束處理
function endGame(reason) {
  // 停止遊戲
  gameState.isPlaying = false;
  clearInterval(timerInterval);

  const modal = document.getElementById('gameEndModal');
  const messageElement = document.getElementById('gameEndMessage');

  // 根據不同結束原因準備統計數據
  let endMessage;
  const score = gameState.winCondition === 'time' ?
                gameState.accumulatedScore :
                gameState.score;

    switch (reason) {
        case 'hearts':
            endMessage = [
                '<span class="end-emoji">💔</span>',  // 沒有愛心了！
                createEndMessage({
                    rounds: gameState.completedRounds,
                    score: score
                })
            ].join('\n');
            break;
    case 'timeout':
      endMessage = [
        '<span class="end-emoji">⏰</span>', // 時間到！
        createEndMessage({
          rounds: gameState.completedRounds,
          score: score
        })
      ].join('\n');
      break;

    case 'complete':
      endMessage = [
       '<span class="end-emoji">🎊</span>',//遊戲完成！
        createEndMessage({
          time: gameState.totalTimer,
          score: score
        })
      ].join('\n');
      break;
  }

  // 設置訊息並顯示模態框
  if (messageElement) {
    messageElement.innerHTML = endMessage.replace(/\n/g, '<br>');
  }

	setTimeout(function() {
	  if (modal) {
		modal.style.display = 'block';
	  }
	}, 1000);

  // 紀錄遊戲結果
  const gameResult = {
    endReason: reason,
    finalScore: score,
    totalTime: gameState.totalTimer,
    completedRounds: gameState.completedRounds
  };

  // 可以在這裡添加遊戲結果的其他處理，例如儲存最高分等
  // console.log('Game Result:', gameResult);
}


// 30. 音檔相關函數
function playAudio(audio) {
    audio.currentTime = 0;
    audio.play();
}

// 31. 播放當前句子音檔
function playCurrentAudio(audioFileInfo, times = 1) {
	    const playbackSpeed = audioFileInfo.toLowerCase().endsWith('.k100') ? 1.4 : 1;
        let audioUrl = getAudioUrl(audioFileInfo);
        if (audioUrl) {
            playAudioMultipleTimes(audioUrl, times, playbackSpeed)
                .catch(error => console.error('播放音頻時發生錯誤:', error));
        }
}

// 播放分割單詞音檔
function playSingleAudio(audioFileInfo) {
	    const playbackSpeed = audioFileInfo.toLowerCase().endsWith('.k100') ? 1.4 : 1;
        let audioUrl = getAudioUrl(audioFileInfo);
        if (audioUrl) {
            playAudioMultipleTimes(audioUrl, 1, playbackSpeed)
                .catch(error => console.error('播放音頻時發生錯誤:', error));
        }
}


// 32. 獲取音檔路徑
function getAudioUrl(audioFileInfo) {
    if (audioFileInfo.endsWith('.k100')) {
        return `https://oikasu1.github.io/kasu100/${audioFileInfo.replace('.k100', '.mp3')}`;
    } else if (audioFileInfo.endsWith('.kasu')) {
        return `https://oikasu1.github.io/snd/mp3kasu/${audioFileInfo.replace('.kasu', '.mp3')}`;
    } else if (audioFileInfo.endsWith('.holo')) {
        return `https://oikasu1.github.io/snd/mp3holo/${audioFileInfo.replace('.holo', '.mp3')}`;
    } else if (audioFileInfo.endsWith('.mp3')) {
        return audioFileInfo;
    } else {
        let langCode, text;

        // 新增的 TTS 處理邏輯
        const ttsMatch = audioFileInfo.match(/^tts\s*[:=]?\s*\(?\s*(\w+)\s*\)?$/i);
        if (ttsMatch) {
            langCode = ttsMatch[1].toLowerCase();
            text = gameData[currentQuestionIndex][headers.indexOf(langCode)];
        } else {
            switch (audioFileInfo) {
                case 'zh':
                    langCode = 'zh-TW';
                    text = gameData[currentQuestionIndex][headers.indexOf('國語')];
                    break;
                case 'en':
                case '英':
                    langCode = 'en';
                    text = gameData[currentQuestionIndex][headers.indexOf('英語')] || gameData[currentQuestionIndex][headers.indexOf('美語')];
                    break;
                case 'jp':
                case '日':
                    langCode = 'ja';
                    text = gameData[currentQuestionIndex][headers.indexOf('日語')];
                    break;
                case 'es':
                case '西':
                    langCode = 'es-ES';
                    text = gameData[currentQuestionIndex][headers.indexOf('西班牙語')];
                    break;
                case 'vi':
                case '越':
                    langCode = 'vi';
                    text = gameData[currentQuestionIndex][headers.indexOf('越南語')];
                    break;
                case 'ko':
                case '韓':
                    langCode = 'vi';
                    text = gameData[currentQuestionIndex][headers.indexOf('韓語')];
                    break;
                case 'in':
                case '印':
                    langCode = 'id';
                    text = gameData[currentQuestionIndex][headers.indexOf('印尼語')];
                    break;
                default:
                    console.warn('未知的音頻格式:', audioFileInfo);
                    return null;
            }
        }

        if (langCode && text) {
            return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${langCode}&client=tw-ob&q=${encodeURIComponent(text)}`;
        } else {
            console.warn('無法確定語言或找不到對應的文本');
            return null;
        }
    }
}

// 33. 多次播放音檔

function playAudioMultipleTimes(audioUrl, times, playbackSpeed = 1) {
    return new Promise((resolve, reject) => {
        // 驗證播放速度的範圍
        if (playbackSpeed <= 0) {
            reject(new Error('Playback speed must be greater than 0'));
            return;
        }

        // 如果有正在播放的音頻，停止它
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.removeEventListener('ended', currentAudio.audioEndHandler);
        }

        const audio = new Audio(audioUrl);
        currentAudio = audio; // 保存對當前音頻的引用

        // 設置播放速度
        audio.playbackRate = playbackSpeed;

        let playCount = 0;

        audio.audioEndHandler = function() {
            playCount++;
            if (playCount < times) {
                audio.currentTime = 0;
                audio.play().catch(reject);
            } else {
                audio.removeEventListener('ended', audio.audioEndHandler);
                currentAudio = null; // 清除當前音頻引用
                resolve();
            }
        };

        audio.addEventListener('ended', audio.audioEndHandler);

        audio.addEventListener('error', (e) => {
            currentAudio = null; // 發生錯誤時也要清除引用
            reject(e);
        });

        audio.play().catch((e) => {
            currentAudio = null; // 播放失敗時清除引用
            reject(e);
        });
    });
}
/*
function playAudioMultipleTimes(audioUrl, times, playbackSpeed = 1, volume = 1) {
    return new Promise((resolve, reject) => {
        // 驗證播放速度的範圍
        if (playbackSpeed <= 0) {
            reject(new Error('Playback speed must be greater than 0'));
            return;
        }

        // 驗證音量範圍
        if (volume < 0 || volume > 2) {
            reject(new Error('Volume must be between 0 and 2'));
            return;
        }

        // 如果有正在播放的音頻，停止它
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.removeEventListener('ended', currentAudio.audioEndHandler);
        }

        const audio = new Audio(audioUrl);
        audio.playbackRate = playbackSpeed; // 設置播放速度
        audio.volume = 1;  // 預設為全音量

        // 使用 AudioContext 放大音量
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audio);
        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume;  // 設置增益放大倍數（範圍 0 到 2）
        source.connect(gainNode).connect(audioContext.destination);

        currentAudio = audio;  // 保存對當前音頻的引用

        let playCount = 0;

        audio.audioEndHandler = function() {
            playCount++;
            if (playCount < times) {
                audio.currentTime = 0;
                audio.play().catch(reject);
            } else {
                audio.removeEventListener('ended', audio.audioEndHandler);
                audioContext.close(); // 播放完成後關閉 AudioContext
                currentAudio = null;  // 清除當前音頻引用
                resolve();
            }
        };

        audio.addEventListener('ended', audio.audioEndHandler);

        audio.addEventListener('error', (e) => {
            audioContext.close();  // 發生錯誤時關閉 AudioContext
            currentAudio = null;  // 發生錯誤時也要清除引用
            reject(e);
        });

        audio.play().catch((e) => {
            audioContext.close();  // 播放失敗時關閉 AudioContext
            currentAudio = null;  // 播放失敗時清除引用
            reject(e);
        });
    });
}
*/




// 34. 停止當前音檔播放
function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.removeEventListener('ended', currentAudio.audioEndHandler);
        currentAudio = null;
    }
}












function replaceLeftToRight(text, data) {
    const mappings = data.trim().split('\n');
    mappings.forEach(mapping => {
        const [zhuyin, pinyin] = mapping.split('\t');
        const regex = new RegExp(zhuyin, 'gi');
        text = text.replace(regex, pinyin);
    });
    return text;
}

const zhuyinSmallPinyin = `
	iong
	iung
	iag
	ied
	ien
	iab
	iam
	iog
	ieb
	iem
	ieu
	iug
	iun
	uad
	ued
	uen
	iui
	ioi
	iud
	ion
	iang
	ien
	uang
	ing
	eeu
	een
	eem
	eed
	eeb
	ong
	ung
	iau
	uai
	uan
	ab
	ad
	ag
	am
	ed
	en
	eu
	id
	in
	iu
	od
	og
	oi
	ud
	ug
	un
	em
	on
	ui
	eb
	io
	ia
	ib
	ie
	im
	ua
	ainn
	inn
	enn
	onn
	ang
	am
	ong
	n
	ng
	ai
	an
	au
	ee
	o
	a
	e
	i
	o
	u
	ng
	rh
	zh
	ch
	sh
	b
	p
	m
	f
	d
	t
	n
	l
	g
	k
	h
	j
	q
	x
	z
	c
	s
	v
ˊ	z
ˆ	x
ˇ	v
ˋ	s
⁺	f
`;

const zhuyinMiniPinyin = `
 	ien
	a
	a
	a
	a
	a
	ai
	ai
	ai
	ainn
	ainn
	ainn
	am
	am
	am
	an
	an
	an
	ang
	ang
	ang
	ann
	ann
	ann
	au
	au
	au
	aunn
	aunn
	aunn
	b
	b
	b
	b
	b
	bb
	bb
	c
	c
	c
	c
	c
	ch
	ch
	ch
	d
	d
	d
	d
	d
	e
	e
	e
	e
	e
	ee
	ee
	ee
	ee
	ee
	enn
	enn
	enn
	enn
	enn
	f
	f
	g
	g
	g
	g
	g
	h
	h
	h
	i
	i
	i
	i
	i
	i
	iam
	iem
	iem
	ien
	inn
	inn
	ion
	iong
	iun
	iung
	k
	k
	l
	l
	m
	m
	m
	m
	m
	m
	m
	m
	n
	n
	n
	n
	n
	n
	ng
	ng
	ng
	ng
	ng
	ng
	o
	o
	o
	o
	o
	o
	o
	o
	o
	om
	om
	om
	ong
	ong
	ong
	onn
	onn
	onn
	p
	p
	rh
	rh
	rh
	s
	s
	s
	s
	s
	s
	s
	s
	sh
	sh
	sh
	t
	t
	u
	u
	u
	u
	u
	uen
	v
	v
	v
	v
	v
	x
	x
	x
	z
	z
	z
	z
	z
	z
	z
	zh
	z
	zh
	zh
`;

//-- 初始化和設定相關 (1-4)
//-- 遊戲資料處理 (5-8)
//-- 介面更新和互動 (9-14)
//-- 遊戲核心邏輯 (15-18)
//-- 顯示和計時相關 (19-23)
//-- 遊戲狀態管理 (24-29)
//-- 音檔處理相關 (30-34)


