document.addEventListener('DOMContentLoaded', () => {
    // 遊戲狀態物件
const game = {
        isRunning: false,
        isCustomGame: false,
        currentLanguage: '',
        gameMode: 'pinyinToHanzi',
        questions: [],
        customQuestions: [],
        currentQuestionIndex: 0,
        correctAnswers: 0,
        totalAttempts: 0,
        timer: 0,
        timerId: null,
        settings: {
            questionCount: 20,
        },
        expectedAnswer: '',
        isAwaitingCorrectedAnswer: false, // 追蹤是否答錯並等待修正
    };

    // DOM 元素參考 (對應最新的 game.html)
    const dom = {
        gameContainer: document.getElementById('game-container'),
        gameActiveHeader: document.querySelector('.game-active-header'),
        languageSelect: document.getElementById('language-select'),
        gameModeSelect: document.getElementById('game-mode-select'),
        questionCountSelect: document.getElementById('question-count-select'),
        startGameBtn: document.getElementById('start-game-btn'),
        resetGameBtn: document.getElementById('reset-game-btn'),
        shareGameBtn: document.getElementById('share-game-btn'),
        
        currentLangDisplay: document.getElementById('current-lang-display'),
        statsDisplay: document.getElementById('stats-display'),
        timerDisplay: document.getElementById('timer-display'),
        progressDisplay: document.getElementById('progress-display'),
        accuracyDisplay: document.getElementById('accuracy-display'),
        
        questionDisplay: document.getElementById('question-display'),
        answerInput: document.getElementById('answer-input'),
        feedbackIndicator: document.getElementById('feedback-indicator'),
        learningAnswerDisplay: document.getElementById('learning-answer-display'),
        
        customQuizBtn: document.getElementById('custom-quiz-btn'),
        customModal: document.getElementById('custom-modal'),
        closeCustomBtn: document.getElementById('close-custom-btn'),
        customQuestionsInput: document.getElementById('custom-questions-input'),
        loadCustomBtn: document.getElementById('load-custom-btn'),
        customStatusDisplay: document.getElementById('custom-status-display'),
        clearCustomBtn: document.getElementById('clear-custom-btn'), 
    };

    /**
     * 從 localStorage 載入自訂題庫
     */
    function loadCustomQuestionsFromStorage() {
        const lang = dom.languageSelect.value;
        if (!lang) return;

        const savedText = localStorage.getItem(`custom_questions_${lang}`);
        dom.customQuestionsInput.value = savedText || '';
        
        dom.customStatusDisplay.textContent = '';
        game.isCustomGame = false;
        game.customQuestions = [];
    }

    /**
     * 從 localStorage 清除自訂題庫
     */
    function clearCustomQuestionsFromStorage() {
        const lang = dom.languageSelect.value;
        const langName = dom.languageSelect.options[dom.languageSelect.selectedIndex].text;
        
        if (confirm(`確定要清除已儲存的「${langName}」語言題庫嗎？\n此操作無法復原。`)) {
            localStorage.removeItem(`custom_questions_${lang}`);
            dom.customQuestionsInput.value = '';
            dom.customStatusDisplay.textContent = '已清除儲存的題庫。';
            game.isCustomGame = false;
            game.customQuestions = [];
            alert(`已清除「${langName}」的題庫。`);
        }
    }

    /**
     * 初始化遊戲
     */
    function init() {
        populateLanguageSelect(); // 填入語言選單

        const urlParams = new URLSearchParams(window.location.search);
        const langFromUrl = urlParams.get('game-lang');
        if (langFromUrl && dom.languageSelect.querySelector(`option[value="${langFromUrl}"]`)) {
            dom.languageSelect.value = langFromUrl;
            game.currentLanguage = langFromUrl;
        }

        setupEventListeners(); // 設定監聽器
        WebIME.imeInit(); // 初始化輸入法
        loadCustomQuestionsFromStorage(); // 載入題庫
    }

    /**
     * 動態填入語言選單
     */
    function populateLanguageSelect() {
        const availableLanguages = {
            'kasu': '詔安', 'sixian': '四縣', 'hailu': '海陸', 'dapu': '大埔', 
            'raoping': '饒平', 'sixiannan': '南四', 'holo': '和樂', 'jinmen': '金門', 'matsu': '馬祖'
        };

        for (const langCode in availableLanguages) {
            if (dictionaries[langCode]) {
                const option = document.createElement('option');
                option.value = langCode;
                option.textContent = availableLanguages[langCode];
                // 這裡就是出錯的地方，確保 dom.languageSelect 不是 null
                if (dom.languageSelect) {
                    dom.languageSelect.appendChild(option);
                }
            }
        }
        if (dom.languageSelect) {
            game.currentLanguage = dom.languageSelect.value;
        }
    }

    /**
     * 解析使用者自訂的題庫
     */
    function parseCustomQuestions() {
        const text = dom.customQuestionsInput.value.trim();
        if (!text) {
            alert('請先在文字區塊中貼上您的題庫！');
            return;
        }
        
        const currentLang = dom.languageSelect.value;
        if (!currentLang) {
            alert('請先選擇一個語言！');
            return;
        }

        const lines = text.split('\n');
        const parsedQuestions = [];

        for (const line of lines) {
            if (!line.trim()) continue;
            const parts = line.split(/\s+/);
            if (parts.length < 3) continue;

            const [indexStr, hanzi, pinyin] = parts;
            const targetIndex = parseInt(indexStr, 10) - 1;
            if (isNaN(targetIndex) || !hanzi || !pinyin || targetIndex < 0) continue;

            const hanziChars = Array.from(hanzi);
            const pinyinSyllables = pinyin.split(/[\s-]+/);
            if (targetIndex >= hanziChars.length || hanziChars.length !== pinyinSyllables.length) {
                console.warn(`跳過格式錯誤的題目: ${line}`);
                continue;
            }

            parsedQuestions.push({
                hanziChars: hanziChars,
                allOriginalPinyins: [pinyin],
                allPinyinArrays: [pinyinSyllables],
                allSiblingWords: [hanzi],
                targetIndex: targetIndex
            });
        }

        if (parsedQuestions.length > 0) {
            try {
                localStorage.setItem(`custom_questions_${currentLang}`, text);
                game.customQuestions = parsedQuestions;
                game.isCustomGame = true;
                dom.customStatusDisplay.textContent = `已成功載入並儲存 ${parsedQuestions.length} 題。`;
                dom.customStatusDisplay.style.color = 'var(--correct-color)';
                alert(`成功載入並為「${dom.languageSelect.options[dom.languageSelect.selectedIndex].text}」儲存了 ${parsedQuestions.length} 題！`);
                dom.customModal.style.display = 'none'; // 載入成功後關閉彈窗
            } catch (e) {
                console.error('儲存題庫失敗:', e);
                alert('儲存題庫失敗！可能是瀏覽器儲存空間已滿。');
            }
        } else {
            game.isCustomGame = false;
            dom.customStatusDisplay.textContent = '載入失敗，請檢查格式。';
            dom.customStatusDisplay.style.color = 'var(--incorrect-color)';
            alert('載入失敗！\n請檢查您的題庫格式是否正確，至少需有一行有效資料。');
        }
    }

    /**
     * 設定所有事件監聽器
     */
    function setupEventListeners() {
        dom.startGameBtn.addEventListener('click', startGame);
        dom.resetGameBtn.addEventListener('click', resetGame);
        dom.shareGameBtn.addEventListener('click', shareGameSettings);

        // 自訂題庫彈窗的控制
        dom.customQuizBtn.addEventListener('click', () => dom.customModal.style.display = 'flex');
        dom.closeCustomBtn.addEventListener('click', () => dom.customModal.style.display = 'none');
        dom.customModal.addEventListener('click', (e) => {
            if (e.target === dom.customModal) dom.customModal.style.display = 'none';
        });

        // 彈窗內的按鈕
        dom.loadCustomBtn.addEventListener('click', parseCustomQuestions);
        dom.clearCustomBtn.addEventListener('click', clearCustomQuestionsFromStorage);

        // 語言選單
        dom.languageSelect.addEventListener('change', (e) => {
            game.currentLanguage = e.target.value;
            loadCustomQuestionsFromStorage();
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('game-lang', game.currentLanguage);
            window.history.replaceState({ path: newUrl.href }, '', newUrl.href);
        });

        dom.gameModeSelect.addEventListener('change', (e) => game.gameMode = e.target.value);
        dom.questionCountSelect.addEventListener('change', (e) => game.settings.questionCount = parseInt(e.target.value, 10));

        // 答案輸入框
        dom.answerInput.addEventListener('keydown', (e) => {
            if (!game.isRunning) return;
            if (e.key === 'Enter') checkAnswer();
            if (e.key === ' ') {
                const isSingleUnitAnswer =
                    (game.gameMode === 'pinyinToHanzi' && game.expectedAnswer.length === 1) ||
                    (game.gameMode === 'hanziToPinyin' && !game.expectedAnswer.includes(' '));
                if (isSingleUnitAnswer) {
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

        const features = {
            singleCharMode: false, prediction: false, numericTone: true,
            longPhrase: false, fullWidthPunctuation: true, outputEnabled: false,
            outputMode: 'pinyin_mode'
        };

        if (game.gameMode === 'hanziToPinyin') {
            features.outputEnabled = true;
            features.outputMode = 'pinyin_mode';
            WebIME.imeShowToast('已切換為拼音輸入模式', 1500);
        } else {
            features.outputEnabled = false;
            WebIME.imeShowToast('已切換為漢字輸入模式', 1500);
        }
        
        if (window.WebIME && WebIME.isInitialized) {
            WebIME._syncFeatureSettings(features);
            WebIME.imeSwitchMode(game.currentLanguage);
        }
        
        // 顯示目前語言
        const languageName = dom.languageSelect.options[dom.languageSelect.selectedIndex].text;
        dom.currentLangDisplay.textContent = languageName;
        
        if (game.isCustomGame && game.customQuestions.length > 0) {
            game.questions = shuffleArray([...game.customQuestions]).slice(0, game.settings.questionCount);
        } else {
            game.questions = generateQuestions();
        }

        if (game.questions.length === 0) {
            const message = game.isCustomGame 
                ? '自訂題庫中沒有有效的題目可供遊戲！' 
                : '在選擇的語言中，找不到符合條件 (2-4個字) 的詞彙來生成題目！';
            alert(message);
            resetGame();
            return;
        }

        toggleControls(false); // 切換為「遊戲中」介面
        displayNextQuestion();
        startTimer();
    }
    
    /**
     * 重設遊戲狀態 (供內部呼叫)
     */
    function resetState() {
        game.currentQuestionIndex = 0;
        game.correctAnswers = 0;
        game.totalAttempts = 0;
        game.timer = 0;
        updateStatsDisplay();
    }

    /**
     * 切換遊戲介面狀態 (遊戲前/遊戲中)
     */
    function toggleControls(enabled) {
        if (enabled) {
            // 遊戲結束或重設
            dom.gameContainer.classList.remove('game-running');
            dom.answerInput.disabled = true;
            dom.answerInput.value = '';
            dom.questionDisplay.innerHTML = '';
            dom.currentLangDisplay.textContent = '';
        } else {
            // 遊戲開始
            dom.gameContainer.classList.add('game-running');
            dom.answerInput.disabled = false;
            dom.answerInput.focus();
        }
    }

/**
     * 輔助函式：清除狀態並前進到下一題
     */
    function proceedToNextQuestion() {
        game.isAwaitingCorrectedAnswer = false; // 重設狀態
        game.currentQuestionIndex++;
        if (game.isRunning) {
            dom.answerInput.disabled = false; // 解鎖輸入框
        }
        displayNextQuestion(); // 顯示新題目
    }

    /**
     * 產生題目
     */
    function generateQuestions() {
        const dictionary = dictionaries[game.currentLanguage];
        if (!dictionary) return [];
        const hanziMap = new Map();
        for (const pinyinStr in dictionary) {
            if (pinyinStr.length === 1 && pinyinStr.startsWith('x')) continue;
            const words = dictionary[pinyinStr].split(' ');
            const pinyinSyllablesForCheck = pinyinStr.split(/[\s-]+/);
            if (pinyinSyllablesForCheck.length < 2 || pinyinSyllablesForCheck.length > 4) continue;
            for (const hanziStr of words) {
                const hanziChars = Array.from(hanziStr);
                if (pinyinSyllablesForCheck.length !== hanziChars.length) continue;
                if (!hanziMap.has(hanziStr)) {
                    hanziMap.set(hanziStr, {
                        hanziChars: hanziChars,
                        allPinyinStrings: new Set(),
                        allSiblingWords: new Set() 
                    });
                }
                const entry = hanziMap.get(hanziStr);
                entry.allPinyinStrings.add(pinyinStr);
                words.forEach(sibling => entry.allSiblingWords.add(sibling));
            }
        }
        const validEntries = Array.from(hanziMap.values()).map(entry => {
            const allOriginalPinyins = Array.from(entry.allPinyinStrings);
            return {
                hanziChars: entry.hanziChars,
                allOriginalPinyins: allOriginalPinyins,
                allPinyinArrays: allOriginalPinyins.map(p => p.split(/[\s-]+/)),
                allSiblingWords: Array.from(entry.allSiblingWords) 
            };
        });
        const shuffledEntries = shuffleArray(validEntries);
        return shuffledEntries.slice(0, game.settings.questionCount);
    }

/**
     * 顯示下一題
     */
    function displayNextQuestion() {
        // 確保重設答題狀態
        game.isAwaitingCorrectedAnswer = false;
        dom.learningAnswerDisplay.innerHTML = ''; // 清除上一題的答案

        if (game.currentQuestionIndex >= game.questions.length) {
            endGame();
            return;
        }

        const questionData = game.questions[game.currentQuestionIndex];
        
        const targetIndex = (questionData.targetIndex !== undefined)
            ? questionData.targetIndex
            : Math.floor(Math.random() * questionData.hanziChars.length);
        
        let displayHtml, expectedAnswer;

        if (game.gameMode === 'pinyinToHanzi') {
            expectedAnswer = questionData.allSiblingWords.map(word => Array.from(word)[targetIndex]);
            
            // --- ▼▼▼ 修正點在此 ▼▼▼ ---
            const allPinyinStrings = questionData.allOriginalPinyins; // (原為 allOriginalPins)
            // --- ▲▲▲ 修正結束 ▲▲▲ ---

            const processedPinyinDisplays = allPinyinStrings.map(pinyinStr => {
                const parts = pinyinStr.split(/([\s-]+)/);
                let currentSyllableIndex = 0;
                const displayParts = parts.map(part => {
                    if (/[\s-]+/.test(part)) return part;
                    const transformedPinyin = WebIME.imeTransformQueryCode(part, game.currentLanguage);
                    let result;
                    if (currentSyllableIndex === targetIndex) {
                        result = `<span class="highlight">${transformedPinyin}</span>`;
                    } else {
                        result = transformedPinyin;
                    }
                    currentSyllableIndex++;
                    return result;
                });
                return displayParts.join('');
            });
            displayHtml = processedPinyinDisplays.join('、');
        } else { // hanziToPinyin
            expectedAnswer = [...new Set(questionData.allPinyinArrays.map(pinyinArray => pinyinArray[targetIndex]))];
            const displayHanzis = questionData.hanziChars;
            const displayParts = displayHanzis.map((h, index) => (index === targetIndex) ? `"${h}"` : h);
            displayHtml = displayParts.join('').replace(/"([^"]+)"/g, '<span class="highlight">$1</span>');
        }
        
        game.expectedAnswer = expectedAnswer;
        dom.questionDisplay.innerHTML = displayHtml;
        dom.answerInput.value = '';
        dom.answerInput.focus();
        updateStatsDisplay();
    }

/**
     * 輔助函式：前進到下一題
     */
    function proceedToNextQuestion() {
        game.currentQuestionIndex++;
        if (game.isRunning) {
            dom.answerInput.disabled = false; // 解鎖輸入框
        }
        displayNextQuestion(); // 顯示新題目
    }
/**
     * 檢查答案 (重構版 - 包含訂正邏輯)
     */
    function checkAnswer() {
        const userAnswer = dom.answerInput.value.trim();
        if (userAnswer === '') return;

        const userAnswerLower = userAnswer.toLowerCase();
        let isCorrect = false;

        // 檢查答案是否正確
        if (game.gameMode === 'pinyinToHanzi') {
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

        // --- 新的答題流程 ---

        // 情況 1：使用者正在「訂正錯誤」
        if (game.isAwaitingCorrectedAnswer) {
            if (isCorrect) {
                // 訂正正確
                game.isAwaitingCorrectedAnswer = false;
                showFeedback(true); // 顯示綠色勾勾
                dom.learningAnswerDisplay.innerHTML = ''; // 清除紅色答案
                
                // 訂正正確後，延遲短一點時間進入下一題
                dom.answerInput.disabled = true;
                setTimeout(proceedToNextQuestion, 500); 
            } else {
                // 訂正錯誤
                dom.answerInput.classList.add('shake');
                setTimeout(() => {
                    dom.answerInput.classList.remove('shake');
                    dom.answerInput.value = '';
                }, 1000);
            }
            return; // 結束函式，不重複計算分數
        }

        // 情況 2：使用者是「首次嘗試」
        game.totalAttempts++; // 只有首次嘗試才計入總次數

        if (isCorrect) {
            // 首次嘗試就答對
            game.correctAnswers++;
            showFeedback(true);
            showLearningFeedback(true); // 顯示綠色答案，並延遲 1.5 秒後進入下一題
        } else {
            // 首次嘗試答錯
            game.isAwaitingCorrectedAnswer = true; // 標記為等待訂正
            showFeedback(false);
            dom.answerInput.classList.add('shake');
            setTimeout(() => {
                dom.answerInput.classList.remove('shake');
                dom.answerInput.value = '';
            }, 1000);
            
            // 顯示紅色答案，但不自動進入下一題
            showLearningFeedback(false); 
        }
        
        updateStatsDisplay(); // 更新分數顯示
    }
        
    /**
     * 顯示答題回饋
     */
    function showFeedback(isCorrect){
        dom.feedbackIndicator.classList.remove('correct', 'incorrect');
        const feedbackClass = isCorrect ? 'correct' : 'incorrect';
        dom.feedbackIndicator.classList.add(feedbackClass);
        dom.feedbackIndicator.style.opacity = '1';
        setTimeout(() => dom.feedbackIndicator.style.opacity = '0', 500);
    }

    /**
     * 結束遊戲
     */
    function endGame() {
        game.isRunning = false;
        clearInterval(game.timerId);
        toggleControls(true); // 切換回「遊戲前」介面
        const finalTime = formatTime(game.timer);
        dom.questionDisplay.textContent = `遊戲結束！完成時間：${finalTime}`;
    }

    /**
     * 重設遊戲 (供 X 按鈕呼叫)
     */
    function resetGame() {
        game.isRunning = false;
        clearInterval(game.timerId);
        resetState();
        toggleControls(true); // 切換回「遊戲前」介F
        dom.learningAnswerDisplay.innerHTML = '';
    }

    /**
     * 更新狀態顯示
     */
    function updateStatsDisplay() {
        dom.progressDisplay.textContent = `${game.currentQuestionIndex} / ${game.questions.length}`;
        const accuracy = game.totalAttempts > 0 ? Math.round((game.correctAnswers / game.totalAttempts) * 100) : 100;
        dom.accuracyDisplay.textContent = `${accuracy}`;
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
     * 隨機排序陣列
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

/**
     * 顯示完整詞彙/拼音 (可顯示正確或錯誤)
     * @param {boolean} isCorrect - true 顯示綠色答案並準備下一題, false 顯示紅色答案並等待修正
     */
    function showLearningFeedback(isCorrect) {
        const currentQuestion = game.questions[game.currentQuestionIndex];
        let feedbackText = '';

        if (game.gameMode === 'pinyinToHanzi') {
            feedbackText = currentQuestion.allSiblingWords.join(' / ');
        } else { // hanziToPinyin
            
            const allFullPinyins = currentQuestion.allOriginalPinyins; // (原為 allOriginalPins)

            const transformedFullPinyins = allFullPinyins.map(pinyinStr =>
                WebIME.imeTransformQueryCode(pinyinStr, game.currentLanguage)
            );
            feedbackText = [...new Set(transformedFullPinyins)].join(' / ');
        }
        
        // 根據 isCorrect 決定CSS class
        const feedbackClass = isCorrect ? '' : 'incorrect'; // 答對用預設綠色，答錯用 .incorrect
        dom.learningAnswerDisplay.innerHTML = `<span class="learning-feedback ${feedbackClass}">${feedbackText}</span>`;

        if (isCorrect) {
            // 答對了：鎖定輸入框，並在 1.5 秒後進入下一題
            dom.answerInput.disabled = true;
            setTimeout(proceedToNextQuestion, 1500);
        } else {
            // 答錯了：不鎖定輸入框，讓使用者可以立刻輸入正確答案
            dom.answerInput.focus();
        }
    }


    /**
     * 產生並複製分享連結
     */
    function shareGameSettings() {
        const baseUrl = window.location.origin + window.location.pathname;
        const langCode = game.currentLanguage;
        const params = new URLSearchParams();
        params.set('game-lang', langCode);
        const settingsCode = game.gameMode === 'hanziToPinyin' ? '0000011' : '0000000';
        const shortCode = `1-${langCode}-${settingsCode}`;
        params.set('ime', shortCode);
        const shareableUrl = `${baseUrl}?${params.toString()}`;

        navigator.clipboard.writeText(shareableUrl).then(() => {
            const originalIcon = dom.shareGameBtn.innerHTML;
            dom.shareGameBtn.innerHTML = `<span class="material-icons">check</span>`;
            dom.shareGameBtn.title = '已複製！';
            setTimeout(() => {
                dom.shareGameBtn.innerHTML = originalIcon;
                dom.shareGameBtn.title = '分享目前設定';
            }, 2000);
        }).catch(err => {
            alert('複製分享網址失敗！');
            console.error('無法複製網址: ', err);
        });
    }

    // 啟動遊戲
    init();
});

