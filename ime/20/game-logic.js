document.addEventListener('DOMContentLoaded', () => {
    // 遊戲狀態物件
    const game = {
        isRunning: false,
        currentLanguage: '',
        gameMode: 'pinyinToHanzi', // pinyinToHanzi 或 hanziToPinyin
        questions: [],
        currentQuestionIndex: 0,
        correctAnswers: 0,
        totalAttempts: 0,
        timer: 0,
        timerId: null,
        settings: {
            questionCount: 20,
        },
        expectedAnswer: '',
    };

// DOM 元素參考
    const dom = {
        languageSelect: document.getElementById('language-select'),
        gameModeSelect: document.getElementById('game-mode-select'),
        questionCountSelect: document.getElementById('question-count-select'),
        startGameBtn: document.getElementById('start-game-btn'),
        resetGameBtn: document.getElementById('reset-game-btn'),
        shareGameBtn: document.getElementById('share-game-btn'),
        statsDisplay: document.getElementById('stats-display'),
        timerDisplay: document.getElementById('timer-display'),
        progressDisplay: document.getElementById('progress-display'),
        accuracyDisplay: document.getElementById('accuracy-display'),
        questionDisplay: document.getElementById('question-display'),
        answerInput: document.getElementById('answer-input'),
        feedbackIndicator: document.getElementById('feedback-indicator'),
        learningAnswerDisplay: document.getElementById('learning-answer-display'), // <-- 新增此行
    };

/**
 * 初始化遊戲
 */
function init() {
    // 動態填入語言選單，這必須先執行才能讀取 URL 參數
    populateLanguageSelect();

    // 檢查網址中是否有 'game-lang' 參數，若有則自動選定該語言
    const urlParams = new URLSearchParams(window.location.search);
    const langFromUrl = urlParams.get('game-lang');
    if (langFromUrl && dom.languageSelect.querySelector(`option[value="${langFromUrl}"]`)) {
        dom.languageSelect.value = langFromUrl;
        game.currentLanguage = langFromUrl;
    }

    // 設定事件監聽器
    setupEventListeners();
    // 初始化輸入法
    WebIME.imeInit();
}

    /**
     * 動態填入語言選單
     */
    function populateLanguageSelect() {
        const availableLanguages = {
            'kasu': '詔安', 'sixian': '四縣', 'hailu': '海陸', 'dapu': '大埔', 
            'raoping': '饒平', 'sixiannan': '南四', 'holo': '和樂', 'matsu': '馬祖'
        };

        for (const langCode in availableLanguages) {
            if (dictionaries[langCode]) {
                const option = document.createElement('option');
                option.value = langCode;
                option.textContent = availableLanguages[langCode];
                dom.languageSelect.appendChild(option);
            }
        }
        game.currentLanguage = dom.languageSelect.value;
    }

/**
 * 設定所有事件監聽器
 */
function setupEventListeners() {
    dom.startGameBtn.addEventListener('click', startGame);
    dom.resetGameBtn.addEventListener('click', resetGame);
    dom.shareGameBtn.addEventListener('click', shareGameSettings);

    // 當語言選單變更時，更新遊戲狀態並在網址中加入參數
    dom.languageSelect.addEventListener('change', (e) => {
        game.currentLanguage = e.target.value;

        // 更新網址參數，方便分享
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('game-lang', game.currentLanguage);
        // 使用 replaceState 來更新網址，避免在瀏覽紀錄中留下太多項目
        window.history.replaceState({ path: newUrl.href }, '', newUrl.href);
    });

    dom.gameModeSelect.addEventListener('change', (e) => game.gameMode = e.target.value);
    dom.questionCountSelect.addEventListener('change', (e) => game.settings.questionCount = parseInt(e.target.value, 10));

    // --- 【核心修改處】 ---
    // 修改此事件監聽器以同時處理 Enter 和 Spacebar
    dom.answerInput.addEventListener('keydown', (e) => {
        // 如果遊戲不在進行中，則不執行任何動作
        if (!game.isRunning) return;

        // 1. 處理 Enter 鍵送出
        if (e.key === 'Enter') {
            checkAnswer();
        }

        // 2. 處理 Spacebar (空白鍵) 送出
        if (e.key === ' ') {
            // 判斷當前題目答案是否為單一單位
            const isSingleUnitAnswer =
                // 情況A (看拼音打漢字): 預期答案 (漢字) 長度是否為 1
                (game.gameMode === 'pinyinToHanzi' && game.expectedAnswer.length === 1) ||
                // 情況B (看漢字打拼音): 預期答案 (拼音) 是否不包含空格 (代表是單音節)
                (game.gameMode === 'hanziToPinyin' && !game.expectedAnswer.includes(' '));

            // 如果是單一單位的答案，才觸發送出
            if (isSingleUnitAnswer) {
                // 非常重要：阻止空白鍵的預設行為 (也就是輸入一個空格)
                e.preventDefault();
                checkAnswer();
            }
        }
    });
}

/**
     * 開始遊戲
     */
    function startGame() {
        game.isRunning = true;
        resetState();

        // --- 核心修改：根據遊戲模式設定輸入法狀態 ---
        const features = {
            singleCharMode: false,
            prediction: false,
            numericTone: true,
            longPhrase: false,
            fullWidthPunctuation: true,
            outputEnabled: false,
            outputMode: 'pinyin_mode'
        };

        if (game.gameMode === 'hanziToPinyin') {
            // 看漢字打拼音：啟用「字音輸出」和「拼音模式」
            features.outputEnabled = true;
            features.outputMode = 'pinyin_mode';
            WebIME.imeShowToast('已切換為拼音輸入模式', 1500);
        } else {
            // 看拼音打漢字：關閉「字音輸出」，恢復成一般打字模式
            features.outputEnabled = false;
            WebIME.imeShowToast('已切換為漢字輸入模式', 1500);
        }
        
        // 直接呼叫 WebIME 內部函式來同步設定
        if (window.WebIME && WebIME.isInitialized) {
            WebIME._syncFeatureSettings(features);
            WebIME.imeSwitchMode(game.currentLanguage); // 確保語言也同步
        }
        // --- 修改結束 ---
        
        game.questions = generateQuestions();
        if (game.questions.length === 0) {
            alert('在選擇的語言中，找不到符合條件 (2-4個字) 的詞彙來生成題目！');
            resetGame();
            return;
        }

        toggleControls(false);
        dom.statsDisplay.style.visibility = 'visible';
        
        displayNextQuestion();
        startTimer();
    }
    
    /**
     * 重設遊戲狀態
     */
    function resetState() {
        game.currentQuestionIndex = 0;
        game.correctAnswers = 0;
        game.totalAttempts = 0;
        game.timer = 0;
        updateStatsDisplay();
    }

/**
 * 切換設定控制項的啟用狀態
 * @param {boolean} enabled 是否啟用
 */
function toggleControls(enabled) {
    dom.languageSelect.disabled = !enabled;
    dom.gameModeSelect.disabled = !enabled;
    dom.questionCountSelect.disabled = !enabled;
    dom.answerInput.disabled = enabled;

    dom.startGameBtn.style.display = enabled ? 'inline-block' : 'none';
    dom.resetGameBtn.style.display = enabled ? 'none' : 'inline-block';

	// 分享按鈕現在會一直保持可見。

    if(enabled){
        dom.answerInput.value = '';
        dom.questionDisplay.innerHTML = '選語言、題數，開始！';
    } else {
         dom.answerInput.focus();
    }
}

/**
 * 產生題目
 * @returns {Array} 題目陣列
 */
function generateQuestions() {
    const dictionary = dictionaries[game.currentLanguage];
    if (!dictionary) return [];

    // 建立一個臨時的 Map，以漢字詞為鍵 (key)
    const hanziMap = new Map();

    // 遍歷字典，建立題庫資料
    for (const pinyinStr in dictionary) {
        // 略過輸入法用來打標點符號的 'x' 開頭編碼
        if (pinyinStr.length === 1 && pinyinStr.startsWith('x')) continue;

        const words = dictionary[pinyinStr].split(' ');
        const pinyinSyllablesForCheck = pinyinStr.split(/[\s-]+/);

        // 篩選出 2-4 個音節的詞彙
        if (pinyinSyllablesForCheck.length < 2 || pinyinSyllablesForCheck.length > 4) {
            continue;
        }

        // 針對該拼音對應的每一個漢字詞進行處理
        for (const hanziStr of words) {
            const hanziChars = Array.from(hanziStr);

            // 確保漢字長度與拼音音節數相等
            if (pinyinSyllablesForCheck.length !== hanziChars.length) {
                continue;
            }

            // 如果 Map 中還沒有這個漢字詞，就建立一個基礎結構
            if (!hanziMap.has(hanziStr)) {
                hanziMap.set(hanziStr, {
                    hanziChars: hanziChars,
                    allPinyinStrings: new Set(),
                    // 【核心修改】新增一個 Set 來儲存所有來自同一拼音源的「同音詞」
                    allSiblingWords: new Set() 
                });
            }

            const entry = hanziMap.get(hanziStr);
            // 將當前的拼音字串加入
            entry.allPinyinStrings.add(pinyinStr);
            // 【核心修改】將這個拼音源的所有對應詞 (包含自己) 都加入到 allSiblingWords 集合中
            words.forEach(sibling => entry.allSiblingWords.add(sibling));
        }
    }

    // 將 Map 轉換為遊戲所需的題目陣列格式
    const validEntries = Array.from(hanziMap.values()).map(entry => {
        const allOriginalPinyins = Array.from(entry.allPinyinStrings);
        return {
            hanziChars: entry.hanziChars,
            allOriginalPinyins: allOriginalPinyins,
            allPinyinArrays: allOriginalPinyins.map(p => p.split(/[\s-]+/)),
            // 將 Set 轉換為陣列，方便後續使用
            allSiblingWords: Array.from(entry.allSiblingWords) 
        };
    });
    
    console.log(`語言 "${game.currentLanguage}" 產生的有效題庫:`, validEntries);
    
    const shuffledEntries = shuffleArray(validEntries);
    
    return shuffledEntries.slice(0, game.settings.questionCount);
}


/**
 * 顯示下一題
 */
function displayNextQuestion() {
    if (game.currentQuestionIndex >= game.questions.length) {
        endGame();
        return;
    }

    dom.learningAnswerDisplay.innerHTML = ''; // 清除上一題的答案

    const questionData = game.questions[game.currentQuestionIndex];
    
    // 隨機決定要考哪一個字的索引位置
    const targetIndex = Math.floor(Math.random() * questionData.hanziChars.length);
    
    let displayHtml, expectedAnswer;

    if (game.gameMode === 'pinyinToHanzi') {
        // 【核心修改】預期答案不再是單一漢字，而是所有同音詞在目標位置上的漢字陣列
        // 例如：從 ['姓劉', '姓樓'] 中取出 ['劉', '樓']
        expectedAnswer = questionData.allSiblingWords.map(word => Array.from(word)[targetIndex]);
        
        // 為了顯示題目，我們隨機選用其中一種拼音即可
        const displayPinyinStr = questionData.allOriginalPinyins[0];
        const parts = displayPinyinStr.split(/([\s-]+)/);
        let currentSyllableIndex = 0;

        const displayParts = parts.map(part => {
            if (/[\s-]+/.test(part)) {
                return part;
            }
            
            const transformedPinyin = WebIME.imeTransformQueryCode(part, game.currentLanguage);
            let result = (currentSyllableIndex === targetIndex) ? `"${transformedPinyin}"` : transformedPinyin;
            currentSyllableIndex++;
            return result;
        });
        
        displayHtml = displayParts.join('');

    } else { // hanziToPinyin
        // 這部分邏輯不變，維持原樣
        expectedAnswer = [...new Set(questionData.allPinyinArrays.map(pinyinArray => pinyinArray[targetIndex]))];
        
        const displayHanzis = questionData.hanziChars;
        const displayParts = displayHanzis.map((h, index) => {
            return (index === targetIndex) ? `"${h}"` : h;
        });
        displayHtml = displayParts.join('');
    }
    
    game.expectedAnswer = expectedAnswer;

    const formattedQuestion = displayHtml.replace(/"([^"]+)"/g, '<span class="highlight">$1</span>');
    dom.questionDisplay.innerHTML = formattedQuestion;
    
    dom.answerInput.value = '';
    dom.answerInput.focus();
    updateStatsDisplay();
}

/**
 * 檢查答案
 */
function checkAnswer() {
    const userAnswer = dom.answerInput.value.trim();
    if (userAnswer === '') return;

    const userAnswerLower = userAnswer.toLowerCase();
    game.totalAttempts++;
    let isCorrect = false;

    if (game.gameMode === 'pinyinToHanzi') {
        // 【核心修正】檢查使用者的漢字答案是否存在於預期的答案陣列中
        if (Array.isArray(game.expectedAnswer)) {
            isCorrect = game.expectedAnswer.includes(userAnswer);
        }

    } else { // hanziToPinyin
        if (Array.isArray(game.expectedAnswer)) {
            isCorrect = game.expectedAnswer.some(expectedPinyin => {
                const transformedPinyin = WebIME.imeTransformQueryCode(expectedPinyin, game.currentLanguage);
                return userAnswerLower === expectedPinyin.toLowerCase() || userAnswerLower === transformedPinyin.toLowerCase();
            });
        }
    }

    if (isCorrect) {
        game.correctAnswers++;
        showFeedback(true);
        showLearningFeedback();
    } else {
        showFeedback(false);
        dom.answerInput.classList.add('shake');
        // 在震動動畫結束後，同時移除 class 並清空輸入框的值
        setTimeout(() => {
            dom.answerInput.classList.remove('shake');
            dom.answerInput.value = ''; // 清空內容
        }, 1000);
    }
    updateStatsDisplay();
}
    
    /**
     * 顯示答題回饋 (正確/錯誤)
     * @param {boolean} isCorrect 
     */
    function showFeedback(isCorrect){
        dom.feedbackIndicator.classList.remove('correct', 'incorrect');
        const feedbackClass = isCorrect ? 'correct' : 'incorrect';
        dom.feedbackIndicator.classList.add(feedbackClass);
        dom.feedbackIndicator.style.opacity = '1';
        setTimeout(() => {
            dom.feedbackIndicator.style.opacity = '0';
        }, 500);
    }

    /**
     * 結束遊戲
     */
    function endGame() {
        game.isRunning = false;
        clearInterval(game.timerId);
        toggleControls(true);
        const finalTime = formatTime(game.timer);
        dom.questionDisplay.textContent = `遊戲結束！完成時間：${finalTime}`;
    }

/**
     * 重設遊戲
     */
    function resetGame() {
        game.isRunning = false;
        clearInterval(game.timerId);
        resetState();
        toggleControls(true);
        dom.statsDisplay.style.visibility = 'hidden';
        dom.learningAnswerDisplay.innerHTML = ''; // <-- 新增此行
    }

    /**
     * 更新狀態顯示
     */
    function updateStatsDisplay() {
        dom.progressDisplay.textContent = `${game.currentQuestionIndex} / ${game.questions.length}`;
        const accuracy = game.totalAttempts > 0 ? Math.round((game.correctAnswers / game.totalAttempts) * 100) : 100;
        dom.accuracyDisplay.textContent = `${accuracy}%`;
    }

    /**
     * 計時器相關函式
     */
    function startTimer() {
        game.timer = 0;
        dom.timerDisplay.textContent = formatTime(game.timer);
        game.timerId = setInterval(() => {
            game.timer++;
            dom.timerDisplay.textContent = formatTime(game.timer);
        }, 1000);
    }
    
    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    /**
     * 隨機排序陣列 (Fisher-Yates shuffle)
     * @param {Array} array 
     * @returns {Array}
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }


/**
 * 答對後顯示完整詞彙/拼音，用於學習
 */
function showLearningFeedback() {
    const currentQuestion = game.questions[game.currentQuestionIndex];
    let feedbackText = '';

    if (game.gameMode === 'pinyinToHanzi') {
        // 【核心修改】從 allSiblingWords 取得所有可能的完整詞彙，並用 " / " 串聯起來
        feedbackText = currentQuestion.allSiblingWords.join(' / ');
    } else { // hanziToPinyin
        const allFullPinyins = currentQuestion.allOriginalPinyins;
        const transformedFullPinyins = allFullPinyins.map(pinyinStr =>
            WebIME.imeTransformQueryCode(pinyinStr, game.currentLanguage)
        );
        feedbackText = [...new Set(transformedFullPinyins)].join(' / ');
    }
    
    dom.learningAnswerDisplay.innerHTML = `<span class="learning-feedback">${feedbackText}</span>`;
    dom.answerInput.disabled = true;

    setTimeout(() => {
        game.currentQuestionIndex++;
        if (game.isRunning) {
            dom.answerInput.disabled = false;
        }
        displayNextQuestion();
    }, 1500);
}

    /**
     * 產生並複製分享連結
     */
/**
 * 產生並複製分享連結
 */
function shareGameSettings() {
    const baseUrl = window.location.origin + window.location.pathname;
    const langCode = game.currentLanguage;

    // --- 【核心修改處】 ---

    // 1. 建立 URL 查詢參數
    const params = new URLSearchParams();

    // 2. 加入遊戲語言參數
    params.set('game-lang', langCode);

    // 3. 根據遊戲模式決定輸入法設定碼
    // 看漢字打拼音需要 '字音輸出' 和 '拼音模式'，對應碼為 0000011
    const settingsCode = game.gameMode === 'hanziToPinyin' ? '0000011' : '0000000';
    const shortCode = `1-${langCode}-${settingsCode}`; // '1' 代表輸入法啟用狀態

    // 4. 加入輸入法設定參數
    params.set('ime', shortCode);

    // 5. 組合出最終的分享網址
    const shareableUrl = `${baseUrl}?${params.toString()}`;

    // --- 修改結束 ---

    navigator.clipboard.writeText(shareableUrl).then(() => {
        const originalIcon = dom.shareGameBtn.innerHTML;
        dom.shareGameBtn.innerHTML = `<span class="material-icons">check</span> 已複製`;
        setTimeout(() => {
            dom.shareGameBtn.innerHTML = originalIcon;
        }, 2000);
    }).catch(err => {
        alert('複製分享網址失敗！');
        console.error('無法複製網址: ', err);
    });
}












    // 啟動遊戲
    init();
});