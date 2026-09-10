
        // ========================================
        // 🔧 程式變數區 - 一般情況下不需要修改
        // ========================================
        
        // 全域變數
		let currentCourseId = '';
		let currentCourseTitle = '';
        let currentCourse = '';
        let currentQuestions = [];
        let baseQuestionCount = 0; // 正式計分的題目數量，不含附加的間隔複習題
        let currentQuestionIndex = 0;
        let userAnswers = {};
        let showingExplanation = false;
        let startTime = null;
		let zhuyinMode = (typeof DEFAULT_ZHUYIN_MODE !== 'undefined') ? DEFAULT_ZHUYIN_MODE : false;
        let fontSizeIndex = DEFAULT_FONT_SIZE_INDEX; // 使用索引而非直接數值
        let studentName = '';
        let studentClass = '';
        let studentAvatar = '';
		let studentQuizCode = '';
        let layoutMode = 'grid'; // 'grid' 或 'vertical'
        let isReading = false;
        let currentAudio = null;
        let optionsClickable = false; // 新增選項點擊控制
        let currentExplanationAudio = null; // 解析朗讀音頻
		
        let isReviewMode = false;
        let originalQuestionsBackup = []; // 備份原始題目
        let originalAnswersBackup = {};   // 備份原始答案

		let isQuizMode = false; // 預設為練習模式

		// 獨立「複習錯題」模式（跨課程彙整所有到期未訂正的錯題，不算正式測驗）
		let isSpacedReviewSession = false;
		const MAX_SPACED_REVIEW_SESSION_QUESTIONS = 20; // 一次複習最多幾題，避免一次全部跳出來太多

		// 🙂 小助手提示功能的狀態
		let hintTokensRemaining = 0;          // 這次測驗/複習還剩幾點提示額度
		let hintUnlockedQuestions = new Set(); // 已經解鎖提示的題目（同一題重複點擊不再扣點）
		let hintMoodInterval = null;           // 表情自動輪替的計時器
		let hintBubbleTimeout = null;          // 提示泡泡自動淡出的計時器
		const HINT_MOOD_EMOJIS = ['🙂', '🤔', '😊', '😌'];
		const HINT_SLEEP_EMOJI = '😴';
		const HINT_MOOD_CYCLE_MS = 6000; // 每 6 秒自動換一次表情
        
        // 頭像分類
        const avatarCategories = {
            animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦏', '🦛', '🐘', '🦒', '🦘', '🐪', '🐫', '🦙', '🦥', '🦨', '🦡', '🐾'],
            insects: ['🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️', '🦂', '🦟', '🪲', '🪳', '🐚'],
            plants: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🌿', '🍀', '🌱', '🌳', '🌲', '🌴', '🌵', '🌾', '🌿', '☘️', '🍃', '🍂', '🍁', '🌰', '🌱', '🌿', '🌾', '🌻', '🌺', '🌸', '🌼', '🌷', '🌹', '🥀', '🌪️', '🌊'],
            people: ['👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧓', '👴', '👵', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚕️', '👩‍⚕️', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '👨‍🏭', '👩‍🏭', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍🎤', '👩‍🎤', '👨‍🎨', '👩‍🎨', '👨‍✈️', '👩‍✈️', '👨‍🚀', '👩‍🚀', '👨‍🚒', '👩‍🚒', '👮‍♂️', '👮‍♀️', '🕵️‍♂️', '🕵️‍♀️', '💂‍♂️', '💂‍♀️', '👷‍♂️', '👷‍♀️', '🤴', '👸', '👳‍♂️', '👳‍♀️', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸‍♂️', '🦸‍♀️', '🦹‍♂️', '🦹‍♀️', '🧙‍♂️', '🧙‍♀️', '🧚‍♂️', '🧚‍♀️', '🧛‍♂️', '🧛‍♀️', '🧜‍♂️', '🧜‍♀️', '🧝‍♂️', '🧝‍♀️', '🧞‍♂️', '🧞‍♀️', '🧟‍♂️', '🧟‍♀️'],
            faces: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
            transport: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼', '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️', '🚢', '⛵', '🛶', '🚤', '🛥️', '🛳️', '⛴️', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜'],
            other: ['🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🪨', '🪵', '🛖', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🦽', '🦼', '🛴', '🚲', '🛹', '🛼', '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️', '🚢', '⛵', '🛶', '🚤', '🛥️', '🛳️', '⛴️', '⚓', '⛽', '🚧', '🚨', '🚥', '🚦', '🛑', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏛️', '🏟️', '🏞️', '🏜️', '🏝️', '🏖️', '⛱️', '🏔️', '⛰️', '🌋', '🗻'],
            treasure: ['💎', '👑', '💰', '🏆', '🎁', '🔑', '🗝️', '💍', '🪙', '🎖️', '🥇', '🥈', '🥉', '🔮', '💠', '🧿', '📿', '🏺', '🪄', '🧸', '🎗️', '💌', '🧧'],
            weapons: ['⚔️', '🛡️', '🗡️', '🏹', '🪃', '🔱', '🪓', '💣', '🧨', '💥', '🔫'],
            aircraft: ['✈️', '🛩️', '🛫', '🛬', '🚀', '🛸', '🚁', '🪂', '🛰️', '🎈', '🪁']
        };

        // ========================================
        // 🌟 積分與頭像解鎖系統
        // 因為測驗機是共用裝置（同一台電腦/平板可能給不同學生輪流用），
        // 積分跟解鎖紀錄都用「班號_姓名」當 key 分開存，避免大家共用同一包積分
        // ========================================

        function getStudentKey(name, classNum) {
            return `${(classNum || '').trim()}_${(name || '').trim()}`;
        }

        function getPointsData() {
            try {
                const raw = localStorage.getItem(`${QUIZ_ID}_points`);
                const parsed = raw ? JSON.parse(raw) : {};
                return (parsed && typeof parsed === 'object') ? parsed : {};
            } catch (error) {
                return {};
            }
        }

        function savePointsData(data) {
            try {
                localStorage.setItem(`${QUIZ_ID}_points`, JSON.stringify(data));
            } catch (error) {
                console.log('儲存積分時發生錯誤');
            }
        }

        function getPoints(name, classNum) {
            const data = getPointsData();
            return data[getStudentKey(name, classNum)] || 0;
        }

        function addPoints(name, classNum, amount) {
            if (!amount || amount <= 0) return;
            const data = getPointsData();
            const key = getStudentKey(name, classNum);
            data[key] = (data[key] || 0) + amount;
            savePointsData(data);
        }

        // 扣點成功回傳 true；積分不夠回傳 false，不會扣成負數
        function spendPoints(name, classNum, amount) {
            const data = getPointsData();
            const key = getStudentKey(name, classNum);
            const current = data[key] || 0;
            if (current < amount) return false;
            data[key] = current - amount;
            savePointsData(data);
            return true;
        }

        function getUnlockedAvatarsData() {
            try {
                const raw = localStorage.getItem(`${QUIZ_ID}_unlockedAvatars`);
                const parsed = raw ? JSON.parse(raw) : {};
                return (parsed && typeof parsed === 'object') ? parsed : {};
            } catch (error) {
                return {};
            }
        }

        function saveUnlockedAvatarsData(data) {
            try {
                localStorage.setItem(`${QUIZ_ID}_unlockedAvatars`, JSON.stringify(data));
            } catch (error) {
                console.log('儲存頭像解鎖紀錄時發生錯誤');
            }
        }

        // 預設頭像永遠是解鎖的；其餘頭像要看有沒有兌換過，而且兌換時間要在 AVATAR_UNLOCK_DAYS 天內
        // （資料格式：{ [學生key]: { [avatar]: 兌換時的timestamp } }）
        function isAvatarUnlocked(name, classNum, avatar) {
            if (avatar === DEFAULT_AVATAR) return true;
            const data = getUnlockedAvatarsData();
            const record = data[getStudentKey(name, classNum)];
            const unlockedAt = record && record[avatar];
            if (!unlockedAt) return false;
            const durationMs = AVATAR_UNLOCK_DAYS * 24 * 60 * 60 * 1000;
            return (Date.now() - unlockedAt) < durationMs;
        }

        // 這個頭像還剩幾天效期（沒兌換過或已過期回傳 0）
        function getAvatarDaysLeft(name, classNum, avatar) {
            if (avatar === DEFAULT_AVATAR) return null; // 預設頭像沒有效期概念
            const data = getUnlockedAvatarsData();
            const record = data[getStudentKey(name, classNum)];
            const unlockedAt = record && record[avatar];
            if (!unlockedAt) return 0;
            const durationMs = AVATAR_UNLOCK_DAYS * 24 * 60 * 60 * 1000;
            const msLeft = durationMs - (Date.now() - unlockedAt);
            return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
        }

        // 兌換頭像：記錄「現在」這個時間點，效期從這一刻開始算 3 天
        function unlockAvatarForStudent(name, classNum, avatar) {
            const data = getUnlockedAvatarsData();
            const key = getStudentKey(name, classNum);
            if (!data[key]) data[key] = {};
            data[key][avatar] = Date.now();
            saveUnlockedAvatarsData(data);
        }

        // 有沒有一則「頭像剛過期」的通知還沒顯示給學生看
        let avatarExpiryNoticePending = false;

        // 檢查目前使用中的頭像是不是已經過期，過期就自動變回預設頭像
        // 回傳 true 代表有被重置（呼叫端可以視需要更新畫面/提示使用者）
        function checkAndApplyAvatarExpiry() {
            if (studentAvatar && studentAvatar !== DEFAULT_AVATAR && !isAvatarUnlocked(studentName, studentClass, studentAvatar)) {
                studentAvatar = DEFAULT_AVATAR;
                avatarExpiryNoticePending = true; // 記下來，下次打開個人資訊畫面時提醒學生
                try {
                    localStorage.setItem(`${QUIZ_ID}_studentAvatar`, studentAvatar);
                } catch (error) {
                    console.log('更新頭像效期時發生錯誤');
                }
                const avatarEl = document.getElementById('userAvatar');
                if (avatarEl) avatarEl.textContent = studentAvatar;
                return true;
            }
            return false;
        }

        // 如果有「頭像剛過期」的待通知訊息，顯示一次就清掉，不會重複跳出
        function maybeShowAvatarExpiryNotice() {
            const notice = document.getElementById('avatarExpiryNotice');
            if (!notice) return;
            if (avatarExpiryNoticePending) {
                notice.classList.remove('hidden');
                avatarExpiryNoticePending = false;
            } else {
                notice.classList.add('hidden');
            }
        }

        // 依測驗分數換算這次可以拿到幾點積分（依 SCORE_POINTS_RULES 由高到低比對）
        function getPointsForScore(percentage) {
            if (!ENABLE_POINTS_SYSTEM) return 0;
            const rule = SCORE_POINTS_RULES.find(r => percentage >= r.minScore);
            return rule ? rule.points : 0;
        }

        // 更新「個人資訊」區塊裡的積分顯示，依目前輸入框裡的姓名/班號查詢
        function updatePointsDisplay() {
            const display = document.getElementById('studentPointsDisplay');
            if (!display) return;
            const name = (document.getElementById('studentName')?.value || '').trim();
            const classNum = (document.getElementById('studentClass')?.value || '').trim();
            const points = (name && classNum) ? getPoints(name, classNum) : 0;
            display.textContent = `🌟 積分 ${points} 點`;

            // 順便更新目前頭像的效期倒數
            const expiryDisplay = document.getElementById('avatarExpiryDisplay');
            if (expiryDisplay) {
                if (name && classNum && studentAvatar && studentAvatar !== DEFAULT_AVATAR) {
                    const daysLeft = getAvatarDaysLeft(name, classNum, studentAvatar);
                    expiryDisplay.textContent = `⏳ 頭像剩 ${daysLeft} 天`;
                    expiryDisplay.classList.remove('hidden');
                } else {
                    expiryDisplay.classList.add('hidden');
                }
            }
        }

        // ========================================
        // 🎉 灑花特效：用積分兌換的消耗性道具
        // 跟頭像不同，這個是「次數」，用完了要再花積分買，不是買一次就永久擁有
        // ========================================

        function getConfettiUsesData() {
            try {
                const raw = localStorage.getItem(`${QUIZ_ID}_confettiUses`);
                const parsed = raw ? JSON.parse(raw) : {};
                return (parsed && typeof parsed === 'object') ? parsed : {};
            } catch (error) {
                return {};
            }
        }

        function saveConfettiUsesData(data) {
            try {
                localStorage.setItem(`${QUIZ_ID}_confettiUses`, JSON.stringify(data));
            } catch (error) {
                console.log('儲存灑花特效次數時發生錯誤');
            }
        }

        function getConfettiUses(name, classNum) {
            const data = getConfettiUsesData();
            return data[getStudentKey(name, classNum)] || 0;
        }

        function addConfettiUses(name, classNum, amount) {
            if (!amount || amount <= 0) return;
            const data = getConfettiUsesData();
            const key = getStudentKey(name, classNum);
            data[key] = (data[key] || 0) + amount;
            saveConfettiUsesData(data);
        }

        // 用掉 1 次灑花特效額度，成功回傳 true；沒額度回傳 false
        function useConfettiCharge(name, classNum) {
            const data = getConfettiUsesData();
            const key = getStudentKey(name, classNum);
            const current = data[key] || 0;
            if (current <= 0) return false;
            data[key] = current - 1;
            saveConfettiUsesData(data);
            return true;
        }

        // 依目前登入的學生，更新灑花按鈕上的次數徽章
        function updateConfettiButtonUI() {
            const badge = document.getElementById('confettiButtonBadge');
            if (!badge) return;
            const uses = getConfettiUses(studentName, studentClass);
            badge.textContent = uses;
        }

        // 灑花按鈕只在「作答中」或「結果頁」出現，其他畫面（首頁、個人資料）不顯示
        function updateConfettiButtonVisibility(visible) {
            const btn = document.getElementById('confettiButton');
            if (!btn) return;
            if (!ENABLE_CONFETTI_EFFECT) {
                btn.classList.add('hidden');
                return;
            }
            btn.classList.toggle('hidden', !visible);
            if (visible) updateConfettiButtonUI();
        }

        // 點擊灑花按鈕：有額度就直接灑花並扣 1 次；沒額度就跳出兌換視窗
        // 點灑花按鈕：只會顯示目前還有幾次機會、以及不夠的話能不能兌換，
        // 不會直接播放特效——特效只有測驗/練習拿到高分時才會自動播放，這樣才有「值得」的感覺
        function onConfettiButtonClick() {
            const uses = getConfettiUses(studentName, studentClass);
            const points = getPoints(studentName, studentClass);
            const statusLine = `剩餘機會：${uses} 次（90 分以上自動播放）`;

            if (points < CONFETTI_BUNDLE_COST) {
                showGenericAlert(
                    '🎉 灑花特效',
                    `${statusLine}\n兌換 ${CONFETTI_BUNDLE_USES} 次需要 ${CONFETTI_BUNDLE_COST} 點，還差 ${CONFETTI_BUNDLE_COST - points} 點`
                );
                return;
            }

            showGenericConfirm({
                title: '🎉 灑花特效',
                message: `${statusLine}\n\n花 ${CONFETTI_BUNDLE_COST} 點兌換 ${CONFETTI_BUNDLE_USES} 次？兌換後剩 ${points - CONFETTI_BUNDLE_COST} 點`,
                theme: 'default',
                confirmText: '兌換',
                onConfirm: () => {
                    if (spendPoints(studentName, studentClass, CONFETTI_BUNDLE_COST)) {
                        addConfettiUses(studentName, studentClass, CONFETTI_BUNDLE_USES);
                        updatePointsDisplay();
                        updateConfettiButtonUI();
                    }
                    closeGenericDialog();
                }
            });
        }

        // 實際播放灑花特效：一群彩色紙片/表情符號從畫面上方灑落，邊落邊轉邊淡出
        // 實際播放灑花特效：每次觸發都會隨機挑選不同的灑花模式跟主題，
        // 數量拉高到滿版效果，讓學習者覺得這個很值得、每次看到都有新鮮感
        function triggerConfettiEffect() {
            const pieceCount = 100; // 滿版效果，比原本的40片多很多

            const emojiThemes = [
                ['🎉', '🎊', '✨', '⭐', '🌟'],
                ['🎈', '🎇', '🎆', '💫', '🌈'],
                ['🥳', '🏆', '👏', '💯', '🎯']
            ];
            const colorThemes = [
                ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'],
                ['#fb7185', '#facc15', '#4ade80', '#38bdf8', '#c084fc', '#fb923c']
            ];
            const emojis = emojiThemes[Math.floor(Math.random() * emojiThemes.length)];
            const colors = colorThemes[Math.floor(Math.random() * colorThemes.length)];

            // 每次隨機挑一種灑花模式，讓學習者每次看到的效果都不太一樣
            // rain：滿版雨降（一開始就佈滿整個畫面，不用等落下）
            // burst：從畫面中心往四面八方炸開
            // sides：左右兩側往上噴發
            const patterns = ['rain', 'burst', 'sides'];
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];

            for (let i = 0; i < pieceCount; i++) {
                const piece = document.createElement('div');
                const useEmoji = Math.random() < 0.4;

                if (useEmoji) {
                    piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                    piece.style.fontSize = (14 + Math.random() * 16) + 'px';
                } else {
                    const size = 6 + Math.random() * 8;
                    piece.style.width = size + 'px';
                    piece.style.height = size + 'px';
                    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    piece.style.borderRadius = Math.random() < 0.5 ? '50%' : '2px';
                }

                piece.style.position = 'fixed';
                piece.style.zIndex = '9999';
                piece.style.pointerEvents = 'none';

                const duration = 1.6 + Math.random() * 1.4;

                if (pattern === 'rain') {
                    // 滿版雨降：一開始就灑滿整個畫面（不只是上緣），馬上有「滿版」的感覺
                    piece.style.left = Math.random() * 100 + 'vw';
                    piece.style.top = (Math.random() * 60 - 20) + 'vh';
                    const drift = (Math.random() - 0.5) * 220;
                    piece.style.setProperty('--confetti-drift', drift + 'px');
                    piece.style.animation = `confettiFall ${duration}s ease-in forwards`;
                } else if (pattern === 'burst') {
                    // 從畫面中心往四面八方炸開
                    piece.style.left = '50vw';
                    piece.style.top = '45vh';
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 120 + Math.random() * 260;
                    piece.style.setProperty('--confetti-dx', (Math.cos(angle) * distance) + 'px');
                    piece.style.setProperty('--confetti-dy', (Math.sin(angle) * distance - 40) + 'px');
                    piece.style.animation = `confettiBurst ${duration}s ease-out forwards`;
                } else {
                    // 左右兩側往上噴發
                    const fromLeft = Math.random() < 0.5;
                    piece.style.left = (fromLeft ? Math.random() * 15 : 85 + Math.random() * 15) + 'vw';
                    piece.style.top = '95vh';
                    const dx = (fromLeft ? 1 : -1) * (80 + Math.random() * 200);
                    const dy = -(200 + Math.random() * 300);
                    piece.style.setProperty('--confetti-dx', dx + 'px');
                    piece.style.setProperty('--confetti-dy', dy + 'px');
                    piece.style.animation = `confettiBurst ${duration}s ease-out forwards`;
                }

                document.body.appendChild(piece);
                setTimeout(() => piece.remove(), duration * 1000 + 150);
            }
        }


        // 如果 localStorage 裡的資料損毀（非合法 JSON），不會讓整頁程式當機，
        // 而是自動清除壞掉的資料、回傳空陣列，讓功能可以繼續運作
        function getHistory() {
            const raw = localStorage.getItem(`${QUIZ_ID}_history`);
            if (!raw) return [];
            try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch (error) {
                console.log('歷史紀錄資料損毀，已自動清除並重置為空紀錄');
                localStorage.removeItem(`${QUIZ_ID}_history`);
                return [];
            }
        }

function loginUser(name, classNum, avatar, quizCode) {
            studentName = name;
            studentClass = classNum;
            studentAvatar = avatar;
            studentQuizCode = quizCode; // 【新增】

            // 🕒 頭像效期檢查：兌換來的頭像只能維持 AVATAR_UNLOCK_DAYS 天，過期就自動變回預設頭像
            checkAndApplyAvatarExpiry();

            // 儲存使用者資訊到localStorage (加上 QUIZ_ID 前綴)
            localStorage.setItem(`${QUIZ_ID}_studentName`, studentName);
            localStorage.setItem(`${QUIZ_ID}_studentClass`, studentClass);
            localStorage.setItem(`${QUIZ_ID}_studentAvatar`, studentAvatar);
            localStorage.setItem(`${QUIZ_ID}_studentQuizCode`, studentQuizCode); // 【新增】

            // 更新右上角UI
            document.getElementById('userAvatar').textContent = studentAvatar;
            document.getElementById('userName').textContent = studentName;
            document.getElementById('userInfo').style.display = 'flex';
            document.getElementById('userInfo').style.cursor = 'pointer';
            document.getElementById('userInfo').onclick = editStudentInfo;

            // 顯示課程選單
            document.getElementById('studentInfo').classList.add('hidden');
            document.getElementById('courseSelection').classList.remove('hidden');
            updateHeaderButtonsVisibility();
        }

        // 重設為預設使用者
        function resetToDefaultUser() {
            // 使用預設值登入，這也會自動儲存它們
            loginUser('訪客', '10000', '🐛', ''); // 【修改】
        
            // 更新歷史紀錄中名稱為 "訪客" 的頭像
            updateHistoryAvatarsByName('訪客', '🐛');
        
            // 重設表單的顯示狀態
            document.getElementById('studentInfoTitle').textContent = '🦋 個人資訊';
            document.getElementById('confirmStudentInfo').textContent = '開始 🚀';
            document.getElementById('cancelEditBtn').classList.add('hidden');
            document.getElementById('resetBtn').classList.add('hidden'); // 隱藏重設按鈕
			document.getElementById('backFromEditBtn').classList.add('hidden');
        
            // 回到頁面頂端
            window.scrollTo(0, 0);
        }

        // 檢查是否有歷史紀錄
        function hasHistory() {
            const history = getHistory();
            return history.length > 0;
        }

        // 更新紀錄按鈕顯示
        function updateHistoryButtonVisibility() {
            const historyBtn = document.getElementById('historyBtn');
            const isInCourseSelection = !document.getElementById('courseSelection').classList.contains('hidden');
            const isInStudentInfo = !document.getElementById('studentInfo').classList.contains('hidden');
            
            if (isInCourseSelection && hasHistory() && !isInStudentInfo) {
                historyBtn.style.display = 'block';
            } else {
                historyBtn.style.display = 'none';
            }
        }

        // 取得課別列表
		function getCourses() {
			return quizData;
		}

		// 初始化課別選單
		function initCourseSelection() {
			checkAndApplyAvatarExpiry();
			updateSpacedReviewEntry();

			const courseButtonsContainer = document.getElementById('courseButtons');
			courseButtonsContainer.innerHTML = ''; // 清空現有內容

			// 1. 顯示外層容器
			const courseSelectionDiv = document.getElementById('courseSelection');
			courseSelectionDiv.classList.remove('hidden');
			courseSelectionDiv.className = 'mb-6'; // 移除白色卡片背景，改用透明背景

			// 2. 調整容器間距
			courseButtonsContainer.className = 'space-y-4'; // 垂直堆疊各個分類區塊

			// 3. 根據 category 進行分組
			const groupedCourses = quizData.reduce((acc, course) => {
				const cat = course.category || '其他';
				if (!acc[cat]) {
					acc[cat] = [];
				}
				acc[cat].push(course);
				return acc;
			}, {});

			// 4. 渲染每一個分類區塊
			Object.keys(groupedCourses).forEach((category, index) => {
				const coursesInCategory = groupedCourses[category];

				// 建立分類大區塊
				const categoryBlock = document.createElement('div');
				categoryBlock.className = 'bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300'; 

				// 建立分類標題列 (Header)
                // 修改：加入 cursor-pointer, justify-between, hover效果
				const header = document.createElement('div');
				header.className = 'bg-purple-50 px-6 py-4 border-b border-purple-100 flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors select-none';
				
                // 左側標題群組
                const titleGroup = document.createElement('div');
                titleGroup.className = 'flex items-center flex-wrap gap-y-1';

				const titleIcon = document.createElement('span');
				titleIcon.className = 'material-icons-outlined text-purple-600 mr-2';
				titleIcon.textContent = getCategoryIcon(category);
				
				const title = document.createElement('h2');
				title.className = 'text-lg font-bold text-purple-800'; 
				title.textContent = category;

				// 分類進度摘要：N 個測驗・已完成 M 個
				const summary = document.createElement('span');
				summary.className = 'ml-3 text-xs px-2 py-1 rounded-full bg-white text-purple-600';
				const completedInCategory = coursesInCategory.filter(c => getPracticeCount(c.id) > 0).length;
				summary.textContent = `${coursesInCategory.length} 個測驗・已完成 ${completedInCategory} 個`;
				
                titleGroup.appendChild(titleIcon);
                titleGroup.appendChild(title);
                titleGroup.appendChild(summary);

                // 右側折疊圖示 (預設顯示 "展開更多" 的箭頭)
                const toggleIcon = document.createElement('span');
                toggleIcon.className = 'material-icons-outlined text-purple-400 transition-transform duration-300';
                toggleIcon.textContent = 'expand_more'; // 預設向下箭頭

				header.appendChild(titleGroup);
                header.appendChild(toggleIcon);
				categoryBlock.appendChild(header);

				// 建立按鈕網格容器
                // 修改：預設加上 'hidden' 以隱藏內容
				const gridContainer = document.createElement('div');
				gridContainer.className = 'p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 hidden bg-gray-50/50'; 

				// 生成該分類下的所有課程按鈕
				coursesInCategory.forEach((course, idx) => {
					// 這裡要注意：原本的 index 是全域迴圈的，現在我們在內部迴圈
                    // 如果您希望按鈕上的編號是連續的，可能需要調整。
                    // 這裡先維持用該分類下的順序+1顯示，或是使用原本邏輯
					const button = createCourseButton(course, idx);
					gridContainer.appendChild(button);
				});

				categoryBlock.appendChild(gridContainer);

                // 綁定點擊事件：切換顯示/隱藏
                header.onclick = () => {
                    const isHidden = gridContainer.classList.contains('hidden');
                    
                    if (isHidden) {
                        // 展開
                        gridContainer.classList.remove('hidden');
                        toggleIcon.textContent = 'expand_less'; // 換成向上箭頭
                        header.classList.add('bg-purple-100'); // 展開時標題背景加深
                    } else {
                        // 折疊
                        gridContainer.classList.add('hidden');
                        toggleIcon.textContent = 'expand_more'; // 換成向下箭頭
                        header.classList.remove('bg-purple-100');
                    }
                };

				courseButtonsContainer.appendChild(categoryBlock);
			});
		}
		// 依分類名稱挑選一個貼切的圖示，找不到對應關鍵字就用預設的資料夾圖示
		function getCategoryIcon(category) {
			if (/月|太陽|星|天文/.test(category)) return 'nightlight';
			if (/水|海|魚|生物/.test(category)) return 'water_drop';
			if (/物質|化學|變|實驗/.test(category)) return 'science';
			if (/力|運動|磁|電/.test(category)) return 'bolt';
			if (/植物|生態/.test(category)) return 'eco';
			return 'folder';
		}

		// 獨立出來的按鈕建立函數，避免程式碼重複
		// 產生星星 HTML（0~100分對應0~5顆星），供課程卡片跟統計彈窗共用
		function buildStarsHtml(score, sizeClass) {
			const starClass = `${sizeClass} text-yellow-400 material-icons`;
			const emptyStarClass = `${sizeClass} text-gray-200 material-icons`;
			let html = '';

			if (!score || score <= 0) {
				for (let i = 0; i < 5; i++) html += `<span class="${emptyStarClass}">star</span>`;
				return html;
			}

			const starCount = Math.floor(score / 20);
			const hasHalfStar = (score % 20) >= 10;
			for (let i = 0; i < starCount; i++) html += `<span class="${starClass}">star</span>`;
			if (hasHalfStar && starCount < 5) html += `<span class="${starClass}">star_half</span>`;
			const filledStars = starCount + (hasHalfStar ? 1 : 0);
			for (let i = filledStars; i < 5; i++) html += `<span class="${emptyStarClass}">star</span>`;
			return html;
		}

		function createCourseButton(course, index) {
			const button = document.createElement('button');
			button.className = 'bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md text-gray-800 px-4 py-3 rounded-lg font-medium text-base transition-all text-left w-full flex flex-col gap-2';

			const practiceCount = getPracticeCount(course.id);
			const bestScore = getBestScore(course.id);
			const hasDueReview = getAllDueReviewItems().some(item => item.courseId === course.id);
			const smallStarsHtml = buildStarsHtml(bestScore, 'text-xs');

			// 決定狀態標籤：完成N次 / 複習 / 尚未挑戰
			// 用「最高分」而不是「平均分」來鼓勵學生——只要曾經考差一次，平均分就永遠回不去100分，容易讓人洩氣
			let statusBadge, statusDetail;
			if (hasDueReview) {
				statusBadge = `<span class="text-xs px-2 py-0.5 rounded-full" style="background-color: var(--color-warning-light); color: var(--color-warning-dark);">複習</span>`;
				statusDetail = `<span class="text-xs" style="color: var(--color-warning-dark);">最高 ${bestScore} 分・有錯題待複習</span>`;
			} else if (practiceCount > 0) {
				statusBadge = `<button class="text-xs px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity" style="background-color: var(--color-accent-light); color: var(--color-accent-dark);" onclick="event.stopPropagation(); showCourseStats('${course.id}', '${course.title}', ${bestScore})">完成 ${practiceCount} 次</button>`;
				statusDetail = `<span class="text-xs" style="color: var(--color-accent-dark);">最高 ${bestScore} 分</span>`;
			} else {
				statusBadge = `<span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">尚未挑戰</span>`;
				statusDetail = '';
			}

			button.innerHTML = `
				<div class="flex justify-between items-center">
					<div class="flex items-center gap-1.5">
						<span class="text-xs text-gray-400">測驗 ${index + 1}</span>
						<span class="flex items-center">${smallStarsHtml}</span>
					</div>
					${statusBadge}
				</div>
				<div class="text-base text-black">${course.title}</div>
				${statusDetail ? `<div>${statusDetail}</div>` : ''}
			`;
			button.onclick = () => startQuiz(course.id);
			return button;
		}

        // 計算練習次數（只計算完成的）
		function getPracticeCount(courseId) {
			const history = getHistory();
			// 檢查 record.courseId
			return history.filter(record => record.courseId === courseId && record.completed).length;
		}

        // 計算平均成績
		// 計算最高成績（用最高分而不是平均分來鼓勵學生，避免曾經考差一次就永遠看起來很低分）
		function getBestScore(courseId) {
			const history = getHistory();
			const completedRecords = history.filter(record => record.courseId === courseId && record.completed);
			if (completedRecords.length === 0) return 0;
			return Math.max(...completedRecords.map(record => record.score));
		}

		function getAverageScore(courseId) {
			const history = getHistory();
			const completedRecords = history.filter(record => record.courseId === courseId && record.completed);
			if (completedRecords.length === 0) return 0;
			
			const totalScore = completedRecords.reduce((sum, record) => sum + record.score, 0);
			return Math.round(totalScore / completedRecords.length);
		}

        // 根據成績決定星號顏色（供「查看紀錄」彈窗使用）

		// 顯示課程統計 (接收 ID 和 Title)
		function showCourseStats(courseId, courseTitle, bestScore) {
            // 1. 取得該課程的所有歷史紀錄
            const history = getHistory();
            const records = history.filter(record => record.courseId === courseId && record.completed);
            
            // 2. 計算各分數段的次數
            let count100 = 0;
            let count90 = 0; // 90~99
            let count80 = 0; // 80~89
            let countOther = 0; // 79以下

            records.forEach(r => {
                if (r.score === 100) {
                    count100++;
                } else if (r.score >= 90) {
                    count90++;
                } else if (r.score >= 80) {
                    count80++;
                } else {
                    countOther++;
                }
            });

            const practiceCount = records.length;

			// 設定標題與總次數
			document.getElementById('statsModalTitle').textContent = courseTitle;
			document.getElementById('statsModalCount').textContent = practiceCount;
            
            // 設定分數分布次數
            document.getElementById('statsCount100').textContent = count100;
            document.getElementById('statsCount90').textContent = count90;
            document.getElementById('statsCount80').textContent = count80;
            document.getElementById('statsCountOther').textContent = countOther;

			// 生成星星：跟課程卡片用同一份共用邏輯
			document.getElementById('statsModalStars').innerHTML = buildStarsHtml(bestScore, 'text-3xl');

			// 分數趨勢折線圖：依作答時間由舊到新排序，重用學習歷程/跨測驗趨勢用的同一份繪圖邏輯
			const trendContainer = document.getElementById('statsTrendChart');
			if (trendContainer) {
				if (practiceCount === 0) {
					trendContainer.classList.add('hidden');
				} else {
					trendContainer.classList.remove('hidden');
					const chartData = [...records]
						.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
						.map(r => {
							const d = new Date(r.startTime);
							const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
							return { score: r.score, courseTitle: label };
						});
					renderTrendChart(chartData, 'statsTrendChart');
				}
			}

			// 設定評語 (鼓勵文字)
			const commentEl = document.getElementById('statsModalComment');
			if (practiceCount === 0) {
				commentEl.textContent = "還沒有練習紀錄，趕快開始挑戰吧！💪";
				commentEl.className = "text-gray-500 font-medium text-sm";
			} else if (count100 > 0) {
                // 如果有拿過100分，給予最高讚賞
				commentEl.textContent = `太強了！你已經拿過 ${count100} 次滿分囉！👑`;
				commentEl.className = "text-purple-600 font-bold text-sm";
			} else if (count90 > 0) {
				commentEl.textContent = "表現很棒！離滿分只差一點點了！🌟";
				commentEl.className = "text-green-600 font-bold text-sm";
			} else if (count80 > 0) {
				commentEl.textContent = "不錯喔！繼續保持，挑戰更高分！📚";
				commentEl.className = "text-blue-600 font-bold text-sm";
			} else {
				commentEl.textContent = "別灰心，多練習幾次一定會進步的！🌱";
				commentEl.className = "text-orange-500 font-bold text-sm";
			}

			// 顯示彈窗
			const modal = document.getElementById('statsModal');
			modal.classList.remove('hidden');
			const content = modal.querySelector('.inline-block');
			content.classList.remove('opacity-0', 'scale-95');
			content.classList.add('opacity-100', 'scale-100');
		}

        // 關閉統計視窗
        function closeStatsModal() {
            const modal = document.getElementById('statsModal');
            
            // 隱藏彈窗
            modal.classList.add('hidden');
        }



		// ========================================
		// 🔗 網址參數與歷史紀錄管理 (新增區塊)
		// ========================================

		// 根據網址參數自動進入測驗
		function checkUrlAndLoadQuiz() {
			const urlParams = new URLSearchParams(window.location.search);
			const quizId = urlParams.get('id');
			const mode = urlParams.get('mode'); // 讀取 mode 參數

			// 設定模式
			if (mode === 'quiz') {
				isQuizMode = true;
			} else {
				isQuizMode = false;
			}

			if (quizId) {
				const courseExists = quizData.some(c => c.id === quizId);
				if (courseExists) {
					// 傳入 false 代表不要重複 pushState，因為網址已經有了
					startQuiz(quizId, false); 
				} else {
					console.warn("找不到網址指定的測驗 ID:", quizId);
					resetUrlToHome();
				}
			}
		}

		// 更新網址 (不重新整理頁面)
		function updateUrlForQuiz(quizId) {
			const params = new URLSearchParams();
			params.set('id', quizId);
			
			// 如果是測驗模式，要在網址加上 mode=quiz
			if (isQuizMode) {
				params.set('mode', 'quiz');
			}
			// 如果是練習模式，不加參數 (保持網址乾淨)

			const newUrl = `${window.location.pathname}?${params.toString()}`;
			history.pushState({ id: quizId, mode: isQuizMode ? 'quiz' : 'practice' }, '', newUrl);
		}

		// 清除網址參數回到純路徑
		function resetUrlToHome() {
			const newUrl = window.location.pathname;
			history.pushState({ id: null }, '', newUrl);
		}

		// 監聽瀏覽器「上一頁/下一頁」按鈕
		window.addEventListener('popstate', (event) => {
			// 如果 state 有 id，代表要進入測驗
			if (event.state && event.state.id) {
				startQuiz(event.state.id, false); // false = 不要再推一次 history
			} else {
				// 如果沒有 id，代表回到首頁
				returnToHomeUI();
			}
		});



		// ========================================
		// 🔧 以下為新增的篩選功能函式
		// ========================================

		// 從所有題目中，取得可篩選的課別分類
		function getFilterCategories() {
			const categories = new Set();
			// 使用新的 category 欄位
			quizData.forEach(course => {
				if (course.category) {
					categories.add(course.category);
				}
			});
			return ['all', ...categories];
		}


		// 根據網址參數(?n=)來應用篩選
		function applyFilterFromUrl() {
			const urlParams = new URLSearchParams(window.location.search);
			const filterIndex = urlParams.get('n');

			// 檢查 'n' 參數是否存在
			if (filterIndex !== null) {
				const categories = getFilterCategories(); // 取得所有分類 ['all', '月相', ...]
				const index = parseInt(filterIndex, 10);

				// 檢查 'n' 是否為有效數字且在分類範圍內
				if (!isNaN(index) && index >= 0 && index < categories.length) {
					// n=0 對應 'all', n=1 對應第一個分類, 依此類推
					const selectedCategory = categories[index];
					currentFilter = selectedCategory; // 更新全域篩選狀態

					// 更新篩選按鈕上的文字以符合當前篩選
					const filterBtn = document.getElementById('filterBtn');
					const text = selectedCategory === 'all' ? '全部' : selectedCategory;
					document.getElementById('filterBtnText').textContent = text;
				}
			}
		}


		// 初始化篩選器選單
		function initFilterMenu() {
			const filterBtn = document.getElementById('filterBtn');
			const filterMenu = document.getElementById('filterMenu');
			const categories = getFilterCategories();
			
			filterMenu.innerHTML = ''; // 清空現有選項

			// 迭帶所有分類，並加上索引值(index)
			categories.forEach((category, index) => {
				const link = document.createElement('a');
				// 直接設定連結，方便使用者右鍵開新分頁
				link.href = `?n=${index}`; 
				const text = category === 'all' ? '全部' : category;
				link.textContent = text;
				link.dataset.filter = category;
				link.className = 'block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100';
				
				// 點擊選項時的處理
				link.onclick = (e) => {
					e.preventDefault(); // 防止頁面重新載入
					currentFilter = category; // 更新篩選狀態
					document.getElementById('filterBtnText').textContent = text; // 更新按鈕文字
					filterMenu.classList.add('hidden'); // 隱藏選單
					
					// 使用 History API 更新網址，不會觸發頁面刷新
					const newUrl = `${window.location.pathname}?n=${index}`;
					history.pushState({path: newUrl}, '', newUrl);
					
					initCourseSelection(); // 根據新的篩選條件，重新渲染課別列表
				};
				
				filterMenu.appendChild(link);
			});

			// 點擊篩選按鈕時，切換選單的顯示/隱藏
			filterBtn.onclick = () => {
				filterMenu.classList.toggle('hidden');
			};

			// 如果點擊頁面其他地方，則關閉選單
			document.addEventListener('click', (event) => {
				if (!filterBtn.contains(event.target) && !filterMenu.contains(event.target)) {
					filterMenu.classList.add('hidden');
				}
			});
		}


		// 更新頭部按鈕 (篩選器、歷史紀錄) 的可見性
		function updateHeaderButtonsVisibility() {
            const historyBtn = document.getElementById('historyBtn');
            const exitQuizBtn = document.getElementById('exitQuizBtn');
            const quizModeBtn = document.getElementById('quizModeToggleBtn');
            // 取得分析按鈕
            const analysisBtn = document.getElementById('analysisBtn');
            
            const isAtCourseSelectionScreen = !document.getElementById('courseSelection').classList.contains('hidden');
            const isInQuiz = !document.getElementById('quizArea').classList.contains('hidden');
            // 判斷「個人資訊」區塊是否顯示中 (沒有 hidden class 代表顯示中)
            const isStudentInfoVisible = !document.getElementById('studentInfo').classList.contains('hidden');

            // 1. 歷史紀錄按鈕 (維持原邏輯)
            // 邏輯：在課程選單頁 + 有歷史紀錄 + 不是在編輯個人資訊時
            if (isAtCourseSelectionScreen && hasHistory() && !isStudentInfoVisible) {
                historyBtn.style.display = 'block';
            } else {
                historyBtn.style.display = 'none';
            }

            // 2. 【新增】分析按鈕邏輯
            // 邏輯：只在「個人資訊」頁面顯示
            if (analysisBtn) {
                if (isStudentInfoVisible) {
                    analysisBtn.classList.remove('hidden');
                } else {
                    analysisBtn.classList.add('hidden');
                }
            }

            // 3. 測驗模式按鈕 & 終止測驗按鈕 (維持原邏輯)
            // 複習錯題不是正式測驗，不顯示「測驗模式」切換與「終止測驗」
            if (isInQuiz && isSpacedReviewSession) {
                quizModeBtn.classList.add('hidden');
                exitQuizBtn.classList.add('hidden');
            } else if (isInQuiz) {
                quizModeBtn.classList.remove('hidden');
                
                // 檢查是否已經開始作答 (防止作答中途切換模式)
                const hasStartedAnswering = typeof userAnswers !== 'undefined' && Object.keys(userAnswers).length > 0;

                if (isQuizMode) {
                    // ★ 測驗模式下：
                    quizModeBtn.classList.remove('bg-white', 'text-gray-600', 'border-gray-300', 'hover:bg-gray-50');
                    quizModeBtn.classList.add('bg-purple-600', 'text-white', 'border-purple-600');
                    quizModeBtn.innerHTML = '<span class="material-icons-outlined text-base">assignment_turned_in</span><span>測驗中</span>';
                    quizModeBtn.style.pointerEvents = 'none'; // 鎖定

                    exitQuizBtn.classList.add('hidden'); // 隱藏 X
                } else {
                    // ★ 練習模式下：
                    quizModeBtn.classList.remove('bg-purple-600', 'text-white', 'border-purple-600');
                    quizModeBtn.classList.add('bg-white', 'text-gray-600', 'border-gray-300', 'hover:bg-gray-50');
                    quizModeBtn.innerHTML = '<span class="material-icons-outlined text-base">assignment</span><span>進入測驗</span>';
                    
                    if (hasStartedAnswering) {
                        quizModeBtn.style.pointerEvents = 'none'; 
                        quizModeBtn.classList.add('opacity-50', 'cursor-not-allowed'); // 變淡
                        quizModeBtn.title = "作答中無法切換模式";
                    } else {
                        quizModeBtn.style.pointerEvents = 'auto'; 
                        quizModeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                        quizModeBtn.title = "切換至測驗模式";
                    }

                    exitQuizBtn.classList.remove('hidden', 'bg-gray-200', 'text-gray-400', 'hover:bg-gray-300');
                    exitQuizBtn.classList.add('bg-red-500', 'hover:bg-red-600', 'text-white');
                }
            } else {
                quizModeBtn.classList.add('hidden');
                exitQuizBtn.classList.add('hidden');
            }
        }
		// 開始測驗
		// 找出這個課程「間隔複習」該附加的題目（只回傳題目物件陣列，可能是空陣列）
		function getSpacedReviewQuestions(courseObj) {
			const history = getHistory();
			const now = new Date();
			const msPerDay = 24 * 60 * 60 * 1000;

			// 找出這個課程過去「完成」且「有錯題」、且已經超過設定天數的紀錄
			const pastAttempts = history.filter(r =>
				r.courseId === courseObj.id &&
				r.completed &&
				Array.isArray(r.wrongQuestionIndices) &&
				r.wrongQuestionIndices.length > 0 &&
				(now - new Date(r.endTime)) >= SPACED_REVIEW_DAYS * msPerDay
			);

			if (pastAttempts.length === 0) return [];

			// 取最近一次符合條件的紀錄
			pastAttempts.sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
			const wrongIndices = [...new Set(pastAttempts[0].wrongQuestionIndices)]
				.slice(0, MAX_SPACED_REVIEW_QUESTIONS);

			return wrongIndices
				.map(qNum => courseObj.questions[qNum - 1])
				.filter(q => q) // 避免題庫已修改導致索引超出範圍
				.map(q => ({
					course: courseObj.title,
					question: q.question,
					option1: q.options[0] || "",
					option2: q.options[1] || "",
					option3: q.options[2] || "",
					option4: q.options[3] || "",
					correctAnswer: q.answer,
					explanation: q.explanation || "",
					isReviewQuestion: true
				}));
		}

		// ========================================
		// 🔁 獨立「複習錯題」模式
		// 跨所有課程彙整目前「到期未訂正」的錯題，讓學生可以直接訂正，
		// 不需要重新做一次整份測驗
		// ========================================

		// 彙整所有課程裡到期未訂正的錯題
		// 回傳的每個項目都記得自己來自哪一筆歷史紀錄、原本是第幾題，
		// 訂正正確後才能準確地把它從「錯題清單」裡移除
		function getAllDueReviewItems() {
			const history = getHistory();
			const now = new Date();
			const msPerDay = 24 * 60 * 60 * 1000;

			// 每個課程只取「最近一次已完成且有錯題」的紀錄來判斷是否到期，
			// 避免同一題因為好幾次舊紀錄而重複出現
			const latestByCourse = {};
			history.forEach((record, historyIndex) => {
				if (!record.completed || !Array.isArray(record.wrongQuestionIndices) || record.wrongQuestionIndices.length === 0) return;
				const existing = latestByCourse[record.courseId];
				if (!existing || new Date(record.endTime) > new Date(existing.endTime)) {
					latestByCourse[record.courseId] = { ...record, historyIndex };
				}
			});

			const items = [];
			Object.values(latestByCourse).forEach(record => {
				if ((now - new Date(record.endTime)) < SPACED_REVIEW_DAYS * msPerDay) return;

				const course = quizData.find(c => c.id === record.courseId);
				if (!course) return;

				record.wrongQuestionIndices.forEach(qNum => {
					const q = course.questions[qNum - 1];
					if (!q) return; // 題庫已修改導致索引超出範圍，跳過
					items.push({
						historyIndex: record.historyIndex,
						courseId: record.courseId,
						courseTitle: course.title,
						questionNumber: qNum,
						course: course.title,
						question: q.question,
						option1: q.options[0] || "",
						option2: q.options[1] || "",
						option3: q.options[2] || "",
						option4: q.options[3] || "",
						correctAnswer: q.answer,
						explanation: q.explanation || "",
						isReviewQuestion: true
					});
				});
			});

			return items;
		}

		// 更新首頁「複習錯題」入口的顯示狀態與題數
		function updateSpacedReviewEntry() {
			const entry = document.getElementById('spacedReviewEntry');
			if (!entry) return;

			if (!ENABLE_SPACED_REVIEW) {
				entry.classList.add('hidden');
				return;
			}

			const dueCount = getAllDueReviewItems().length;
			if (dueCount === 0) {
				entry.classList.add('hidden');
				return;
			}

			entry.classList.remove('hidden');
			document.getElementById('spacedReviewCount').textContent = dueCount;
		}

		// 開始獨立的複習錯題模式
		function startSpacedReviewSession() {
			const items = getAllDueReviewItems();
			if (items.length === 0) {
				alert('目前沒有需要複習的錯題，太棒了！🎉');
				return;
			}

			isQuizMode = false;
			isReviewMode = false;
			isSpacedReviewSession = true;
			originalQuestionsBackup = [];
			originalAnswersBackup = {};

			currentCourseId = null;
			currentCourseTitle = '複習錯題';
			// 題目順序打散，避免每次都照課程順序出現
			currentQuestions = [...items].sort(() => Math.random() - 0.5)
				.slice(0, MAX_SPACED_REVIEW_SESSION_QUESTIONS);
			baseQuestionCount = currentQuestions.length;

			currentQuestionIndex = 0;
			userAnswers = {};
			showingExplanation = false;
			startTime = new Date();

			document.getElementById('mainTitle').textContent = '🔁 複習錯題';

			const headerArea = document.getElementById('headerArea');
			const mainTitle = document.getElementById('mainTitle');
			headerArea.classList.remove('mb-8');
			headerArea.classList.add('mb-2');
			mainTitle.classList.remove('text-2xl', 'md:text-4xl');
			mainTitle.classList.add('text-xl', 'md:text-2xl');

			document.getElementById('userInfo').style.cursor = 'default';
			document.getElementById('userInfo').onclick = null;

			document.getElementById('courseSelection').classList.add('hidden');
			document.getElementById('quizArea').classList.remove('hidden');
			document.getElementById('resultArea').classList.add('hidden');
			document.getElementById('reviewArea').classList.add('hidden');
			document.getElementById('historyArea').classList.add('hidden');
			// 複習錯題不是正式測驗，不需要「終止測驗」按鈕
			document.getElementById('exitQuizBtn').classList.add('hidden');

			window.scrollTo(0, 0);

			updateHeaderButtonsVisibility();
			initQuestionNavigation();
			showQuestion();
			updateProgress();
			maybeShowOnboardingTip();
			resetHintMascot();
		}

		// 複習錯題session結束：把訂正成功的題目從原始歷史紀錄的錯題清單移除，
		// 這樣下次就不會再被抽到；答錯的題目維持原樣，之後還是會被抽到繼續複習
		function finishSpacedReviewSession() {
			const history = getHistory();
			let correct = 0;

			currentQuestions.forEach((q, index) => {
				const isCorrect = userAnswers[index] === q.correctAnswer;
				if (isCorrect) correct++;

				const record = history[q.historyIndex];
				if (record && Array.isArray(record.wrongQuestionIndices) && isCorrect) {
					record.wrongQuestionIndices = record.wrongQuestionIndices.filter(n => n !== q.questionNumber);
				}
			});

			try {
				localStorage.setItem(`${QUIZ_ID}_history`, JSON.stringify(history));
			} catch (error) {
				console.log('更新複習紀錄時發生錯誤');
			}

			isSpacedReviewSession = false;
			showSpacedReviewResult(correct, currentQuestions.length);
		}

		// 顯示複習錯題的簡易結果畫面（重用結果頁的星星/統計方塊，但不計入正式成績、不送出 Google 表單）
		function showSpacedReviewResult(correct, total) {
			const wrong = total - correct;
			const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

			let stars = '';
			const fullStars = Math.floor(percentage / 20);
			const hasHalfStar = (percentage % 20) >= 10;
			const starClass = 'material-icons text-yellow-400';
			for (let i = 0; i < fullStars; i++) stars += `<span class="${starClass}">star</span>`;
			if (hasHalfStar && fullStars < 5) stars += `<span class="${starClass}">star_half</span>`;
			const totalSymbols = fullStars + (hasHalfStar ? 1 : 0);
			for (let i = totalSymbols; i < 5; i++) stars += `<span class="${starClass}">star_border</span>`;

			document.getElementById('starRating').innerHTML = stars;
			document.getElementById('scoreText').textContent = `這次複習訂正對了 ${correct} / ${total} 題`;
			document.getElementById('correctCount').textContent = correct;
			document.getElementById('wrongCount').textContent = wrong;
			document.getElementById('totalCount').textContent = total;

			document.getElementById('quizArea').classList.add('hidden');
			document.getElementById('exitQuizBtn').classList.add('hidden');
			document.getElementById('resultArea').classList.remove('hidden');

			updateHeaderButtonsVisibility();
			updateConfettiButtonVisibility(true);
		}

		// 新手提示：只在學生「第一次」進入測驗畫面時顯示一次，
		// 提醒他工具列裡的朗讀／注音功能，看過一次後就不再出現
		function maybeShowOnboardingTip() {
			const seenKey = `${QUIZ_ID}_onboardingSeen`;
			let alreadySeen;
			try {
				alreadySeen = localStorage.getItem(seenKey);
			} catch (error) {
				return; // 讀取 localStorage 失敗就乾脆不顯示，避免影響正常作答
			}
			if (alreadySeen) return;

			const tip = document.getElementById('onboardingTip');
			const overlay = document.getElementById('onboardingOverlay');
			const dismissBtn = document.getElementById('onboardingTipDismiss');
			if (!tip || !overlay || !dismissBtn) return;

			overlay.classList.remove('hidden');
			tip.classList.remove('hidden');

			const dismiss = () => {
				overlay.classList.add('hidden');
				tip.classList.add('hidden');
				try {
					localStorage.setItem(seenKey, 'true');
				} catch (error) {
					// 存不進去就算了，下次還會再顯示一次，不影響功能
				}
			};

			overlay.onclick = dismiss;
			dismissBtn.onclick = dismiss;
		}

		// ========================================
		// 🙂 小助手提示功能
		// 只在練習模式（含獨立複習模式）出現，測驗模式完全不顯示
		// ========================================

		// 這次測驗/複習有幾點提示額度可以用
		// 現在固定回傳設定值，之後要接「積分換額度」的話，改這裡就好，其他地方都不用動
		function getHintTokenCount() {
			return HINT_TOKENS_PER_SESSION;
		}

		// 開始一份新的練習/複習時呼叫：重置額度、清空已解鎖題目、開始表情輪替
		function resetHintMascot() {
			if (!ENABLE_HINT_MASCOT) return;
			hintTokensRemaining = getHintTokenCount();
			hintUnlockedQuestions = new Set();
			hideHintBubble();
			updateHintMascotUI();
			startHintMoodCycle();
		}

		// 離開測驗畫面時呼叫：停止表情輪替計時器，避免背景一直空轉
		function stopHintMascot() {
			if (hintMoodInterval) {
				clearInterval(hintMoodInterval);
				hintMoodInterval = null;
			}
			hideHintBubble();
		}

		function startHintMoodCycle() {
			if (hintMoodInterval) clearInterval(hintMoodInterval);
			if (hintTokensRemaining <= 0) return; // 額度用完就不用轉了，直接維持睡臉
			hintMoodInterval = setInterval(() => {
				const emoji = HINT_MOOD_EMOJIS[Math.floor(Math.random() * HINT_MOOD_EMOJIS.length)];
				const emojiEl = document.getElementById('hintMascotEmoji');
				if (emojiEl) emojiEl.textContent = emoji;
			}, HINT_MOOD_CYCLE_MS);
		}

		// 根據目前是不是練習模式，決定小助手要不要出現（呼叫時機：每次 showQuestion）
		function updateHintMascotVisibility() {
			const mascot = document.getElementById('hintMascot');
			if (!mascot) return;
			const shouldShow = ENABLE_HINT_MASCOT && !isQuizMode && !isReviewMode;
			mascot.classList.toggle('hidden', !shouldShow);
			if (!shouldShow) hideHintBubble();
		}

		// 更新徽章數字跟表情（額度用完就固定顯示睡臉、停止輪替）
		function updateHintMascotUI() {
			const badge = document.getElementById('hintMascotBadge');
			const emojiEl = document.getElementById('hintMascotEmoji');
			if (badge) badge.textContent = hintTokensRemaining;

			if (hintTokensRemaining <= 0) {
				if (hintMoodInterval) {
					clearInterval(hintMoodInterval);
					hintMoodInterval = null;
				}
				if (emojiEl) emojiEl.textContent = HINT_SLEEP_EMOJI;
			} else if (!hintMoodInterval) {
				startHintMoodCycle();
			}
		}

		// 點擊小助手：同一題重複點只顯示快取內容不扣點；額度用完就顯示睡著訊息
		function onHintMascotClick() {
			const qIndex = currentQuestionIndex;
			const question = currentQuestions[qIndex];
			if (!question) return;

			if (hintUnlockedQuestions.has(qIndex)) {
				showHintBubble(question.explanation || '這一題沒有提供解析喔！');
				return;
			}

			if (hintTokensRemaining <= 0) {
				showHintBubble('小助手睡著了，這次沒有提示囉，下次再來找我吧！😴');
				return;
			}

			hintTokensRemaining--;
			hintUnlockedQuestions.add(qIndex);
			updateHintMascotUI();
			showHintBubble(question.explanation || '這一題沒有提供解析喔！');
		}

		function showHintBubble(text) {
			const bubble = document.getElementById('hintBubble');
			const bubbleText = document.getElementById('hintBubbleText');
			if (!bubble || !bubbleText) return;

			bubbleText.textContent = text;
			// 跟題目一致：套用目前選擇的字體大小，注音模式開啟時也套用注音字體
			bubbleText.style.fontSize = FONT_SIZES[fontSizeIndex] + 'px';
			bubbleText.classList.toggle('zhuyin-font', zhuyinMode);
			bubble.classList.remove('hidden');

			if (hintBubbleTimeout) clearTimeout(hintBubbleTimeout);
			hintBubbleTimeout = setTimeout(hideHintBubble, 8000); // 8 秒後自動淡出
		}

		function hideHintBubble() {
			const bubble = document.getElementById('hintBubble');
			if (bubble) bubble.classList.add('hidden');
			if (hintBubbleTimeout) {
				clearTimeout(hintBubbleTimeout);
				hintBubbleTimeout = null;
			}
		}

		function startQuiz(courseId, pushHistory = true) {
			isReviewMode = false; 
			originalQuestionsBackup = [];
			originalAnswersBackup = {};

			// 1. 透過 ID 找到對應的課程物件
			const courseObj = quizData.find(c => c.id === courseId);
			
			if (!courseObj) {
				console.error("找不到課程 ID:", courseId);
				return;
			}

			currentCourseId = courseObj.id;
			currentCourseTitle = courseObj.title; 
			
			if (pushHistory) {
				updateUrlForQuiz(courseId);
			}

			// 2. 將 JSON 格式轉換為 UI 需要的扁平格式
			currentQuestions = courseObj.questions.map(q => {
				return {
					course: currentCourseTitle,
					question: q.question,
					option1: q.options[0] || "",
					option2: q.options[1] || "",
					option3: q.options[2] || "",
					option4: q.options[3] || "",
					correctAnswer: q.answer,
					explanation: q.explanation || ""
				};
			});

			baseQuestionCount = currentQuestions.length;

			// 間隔複習：只在「練習模式」附加，測驗模式維持原本標準題目，不受影響
			if (ENABLE_SPACED_REVIEW && !isQuizMode) {
				const reviewQuestions = getSpacedReviewQuestions(courseObj);
				if (reviewQuestions.length > 0) {
					currentQuestions = currentQuestions.concat(reviewQuestions);
				}
			}

			currentQuestionIndex = 0;
			userAnswers = {};
			showingExplanation = false;
			startTime = new Date();
			
			cleanExpiredHistory();
			
			// 更新 UI
			document.getElementById('mainTitle').textContent = `${QUIZ_HEADER_ICON} ${currentCourseTitle}`;
			// 縮小標題區域的樣式 (緊湊模式)
            const headerArea = document.getElementById('headerArea');
            const mainTitle = document.getElementById('mainTitle');

            // 減少底部間距 (原本是 mb-8)
            headerArea.classList.remove('mb-8');
            headerArea.classList.add('mb-2'); 

            // 縮小字體 (原本是 text-2xl md:text-4xl)
            mainTitle.classList.remove('text-2xl', 'md:text-4xl');
            mainTitle.classList.add('text-xl', 'md:text-2xl');
			document.getElementById('userInfo').style.cursor = 'default';
			document.getElementById('userInfo').onclick = null;
			
			document.getElementById('courseSelection').classList.add('hidden');
			document.getElementById('quizArea').classList.remove('hidden');
			document.getElementById('resultArea').classList.add('hidden');
			document.getElementById('reviewArea').classList.add('hidden');
			document.getElementById('historyArea').classList.add('hidden');
			document.getElementById('exitQuizBtn').classList.remove('hidden');

			window.scrollTo(0, 0);		
		
			updateHeaderButtonsVisibility();
			initQuestionNavigation();
			showQuestion();
			updateProgress();
			maybeShowOnboardingTip();
			resetHintMascot();
		}

		// 統一的返回首頁 UI 處理函式
		function returnToHomeUI() {
			isReviewMode = false;
			stopHintMascot();
			updateConfettiButtonVisibility(false);
			// 恢復標題
			document.getElementById('mainTitle').textContent = QUIZ_TITLE;

            const headerArea = document.getElementById('headerArea');
            const mainTitle = document.getElementById('mainTitle');

            // 恢復底部間距
            headerArea.classList.remove('mb-2');
            headerArea.classList.add('mb-8');

            // 恢復字體大小
            mainTitle.classList.remove('text-xl', 'md:text-2xl');
            mainTitle.classList.add('text-2xl', 'md:text-4xl');

			// 恢復右上角個人資訊點擊功能
			document.getElementById('userInfo').style.cursor = 'pointer';
			document.getElementById('userInfo').onclick = editStudentInfo;
			
			hideAllAreas();
			document.getElementById('courseSelection').classList.remove('hidden');
			
			// 重新初始化課別選單以更新練習次數
			initCourseSelection();
			updateHeaderButtonsVisibility();

			// 重設頂部標題區塊
			if (headerArea.classList.contains('hidden')) {
				headerArea.classList.remove('hidden');
				document.getElementById('toggleHeaderIcon').textContent = 'expand_less';
			}
		}

		// 綁定按鈕事件：返回首頁時，同時清除網址參數
		function bindHomeButtons() {
			
			const handleHomeClick = () => {
				resetUrlToHome(); // 清除網址參數 (?id=...)
				returnToHomeUI(); // 更新介面
			};

			// 綁定所有會回到首頁的按鈕
			document.getElementById('restartBtn').onclick = handleHomeClick;
			document.getElementById('backToHomeFromReviewBtn').onclick = handleHomeClick;
			document.getElementById('backToHomeFromReviewBtnTop').onclick = handleHomeClick;
			
			// 修改終止測驗的邏輯
			const confirmExitBtn = document.getElementById('confirmExitBtn');
			// 先移除舊的事件監聽 (如果有的話，或是直接覆蓋 onclick)
			// 這裡我們直接修改 performQuizExit 函式內容比較快
		}

        // 歷史紀錄管理
		function saveHistory(score, completed = true, wrongQuestionIndices = []) {
			const endTime = new Date();
			const history = getHistory();
			
			const record = {
				studentName: studentName,
				studentAvatar: studentAvatar,
				courseId: currentCourseId,
				courseTitle: currentCourseTitle,
				startTime: startTime.toISOString(),
				endTime: endTime.toISOString(),
				score: completed ? score : null,
				completed: completed,
				wrongQuestionIndices: completed ? wrongQuestionIndices : [] // 供「間隔複習」功能使用
			};
			
			history.unshift(record); // 最新的在前面
			localStorage.setItem(`${QUIZ_ID}_history`, JSON.stringify(history));
		}

		function cleanExpiredHistory() {
            const history = getHistory();
            
            const now = new Date();
            // 1. 先取得目前的年份
            let cutoffYear = now.getFullYear();
            
            // 2. 建立「今年」的過期基準日 (依據設定是 6月30日)
            const thisYearCutoff = new Date(cutoffYear, HISTORY_CUTOFF_MONTH, HISTORY_CUTOFF_DAY);

            // 3. 【關鍵修正邏輯】
            // 如果「現在時間」還沒到「今年的過期日」(例如現在是 1月，還沒到 6月)
            // 代表我們還在同一個學年，過期標準應該要往回推一年，算「去年」的 6/30 為界線
            if (now < thisYearCutoff) {
                cutoffYear -= 1;
            }

            // 4. 設定真正的過期日
            const cutoffDate = new Date(cutoffYear, HISTORY_CUTOFF_MONTH, HISTORY_CUTOFF_DAY);
            
            // 5. 過濾：只保留日期「晚於」過期日的紀錄
            const validHistory = history.filter(record => {
                const recordDate = new Date(record.startTime);
                return recordDate > cutoffDate;
            });
            
            localStorage.setItem(`${QUIZ_ID}_history`, JSON.stringify(validHistory));
        }

        // 更新相同姓名的歷史紀錄頭像
        function updateHistoryAvatarsByName(name, newAvatar) {
            const history = getHistory();
            let updated = false;
            
            history.forEach(record => {
                if (record.studentName === name) {
                    record.studentAvatar = newAvatar;
                    updated = true;
                }
            });
            
            if (updated) {
                localStorage.setItem(`${QUIZ_ID}_history`, JSON.stringify(history));
            }
        }

		// 新的 showHistory 函式
		// 計算並呈現「我的學習歷程」整體表現摘要與趨勢圖
		function renderHistoryStats(history) {
			const statsSection = document.getElementById('historyStatsSection');
			const completed = history.filter(r => r.completed && typeof r.score === 'number');

			if (completed.length === 0) {
				statsSection.classList.add('hidden');
				return;
			}

			statsSection.classList.remove('hidden');

			const avgScore = Math.round(completed.reduce((sum, r) => sum + r.score, 0) / completed.length);
			document.getElementById('historyCompletedCount').textContent = completed.length;
			document.getElementById('historyAverageScore').textContent = avgScore;

			// 依作答時間由舊到新排序，畫出分數變化趨勢
			const chartData = [...completed]
				.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
				.map(r => ({ courseTitle: r.courseTitle || r.course || '測驗', score: r.score }));

			renderTrendChart(chartData, 'historyTrendChart');
		}

		function showHistory() {
			const history = getHistory();
			const historyList = document.getElementById('historyList');

			renderHistoryStats(history);
			
			if (history.length === 0) {
				historyList.innerHTML = `
					<div class="flex flex-col items-center justify-center py-10 text-gray-400">
						<span class="material-icons-outlined text-5xl mb-2">inbox</span>
						<p class="text-gray-500">尚無測驗紀錄</p>
					</div>
				`;
			} else {
				historyList.innerHTML = history.map((record, index) => {
					const startTime = new Date(record.startTime);
					const endTime = new Date(record.endTime);
					const startStr = `${startTime.getFullYear()}/${String(startTime.getMonth() + 1).padStart(2, '0')}/${String(startTime.getDate()).padStart(2, '0')} ${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
					const endStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
					
					const displayAvatar = record.studentAvatar || '👤';
					const displayName = record.studentName || '未知';
					// 使用 record.courseTitle
					const displayTitle = record.courseTitle || record.course || '未知課程';
					const statusClass = record.completed ? 'text-[var(--color-accent-dark)]' : 'text-[var(--color-warning-dark)]';
					const statusText = record.completed ? `得分 ${record.score}` : '未完成';
					
					return `
						<div class="bg-gray-50 p-3 rounded-lg flex items-center justify-between gap-2">
							<div class="min-w-0 flex-1">
								<div class="flex items-center space-x-2">
									<span class="text-2xl flex-shrink-0">${displayAvatar}</span>
									<span class="font-medium truncate">${displayName}</span>
									<span class="text-gray-500 truncate">・${displayTitle}</span>
								</div>
								<div class="flex items-center flex-wrap gap-x-3 mt-1 pl-9 text-sm">
									<span class="font-semibold ${statusClass}">${statusText}</span>
									<span class="text-gray-400">${startStr} - ${endStr}</span>
								</div>
							</div>
							<button onclick="deleteHistoryRecord(${index})" class="btn-tool btn-tool-danger flex-shrink-0" title="刪除這筆紀錄">
								<span class="material-icons-outlined text-lg">delete</span>
							</button>
						</div>
					`;
				}).join('');
			}
			
			hideAllAreas();
			document.getElementById('historyArea').classList.remove('hidden');
			document.getElementById('historyBtn').style.display = 'none';
			document.getElementById('backFromHistoryBtn').classList.remove('hidden');
		}

        // 初始化題目導航
		function initQuestionNavigation() {
            const nav = document.getElementById('questionNav');
            nav.innerHTML = '';
            
            currentQuestions.forEach((_, index) => {
                const button = document.createElement('button');
                // 預設樣式，具體的顏色與互動性由 updateNavButton 決定
                button.className = 'w-8 h-8 rounded-full font-medium text-sm transition-all hover:scale-105';
                button.textContent = index + 1;
                button.onclick = () => goToQuestion(index);
                
                // 立即更新狀態
                updateNavButton(button, index);
                
                nav.appendChild(button);
            });
        }

        // 更新導航按鈕狀態
		function updateNavButton(button, index) {
			// 1. 互動性邏輯 (保留您之前的跳題設定)
			let isInteractive = false;
			if (ALLOW_SKIP_QUESTIONS) {
				isInteractive = true;
			} else {
				if (index === currentQuestionIndex) {
					isInteractive = true; 
				} else if (index === currentQuestionIndex + 1 && userAnswers[currentQuestionIndex] !== undefined) {
					isInteractive = true;
				}
			}

			const interactiveClass = isInteractive ? 'hover:scale-105 cursor-pointer' : 'cursor-default';
			let borderClass = 'border-2 border-transparent';

			if (!ALLOW_SKIP_QUESTIONS && index === currentQuestionIndex + 1 && isInteractive) {
				borderClass = 'border-2 border-purple-500 shadow-md bg-purple-50';
			}

			// 2. 顏色邏輯 (加入 isQuizMode 判斷)
			if (index === currentQuestionIndex) {
				// 當前題目：藍色
				button.className = `w-8 h-8 rounded-full font-medium text-sm transition-all ${borderClass} ${interactiveClass} bg-blue-500 text-white select-none`;
			} else if (userAnswers[index] !== undefined) {
				// 已作答
				if (isQuizMode) {
					// ★ 測驗模式：統一是紫色，不分對錯
					button.className = `w-8 h-8 rounded-full font-medium text-sm transition-all select-none ${borderClass} ${interactiveClass} bg-purple-400 text-white`;
				} else {
					// ★ 練習模式：顯示綠色(對) 或 紅色(錯)
					const isCorrect = userAnswers[index] === currentQuestions[index].correctAnswer;
					button.className = `w-8 h-8 rounded-full font-medium text-sm transition-all select-none ${borderClass} ${interactiveClass} ${
						isCorrect ? 'bg-green-400 text-white' : 'bg-red-400 text-white'
					}`;
				}
			} else {
				// 未作答：灰色
				button.className = `w-8 h-8 rounded-full font-medium text-sm transition-all ${borderClass} ${interactiveClass} bg-gray-300 text-gray-700 select-none`;
			}
		}

        
		// 跳到指定題目
        function goToQuestion(index) {
            // 嚴格順序模式下的邏輯檢查
            if (!ALLOW_SKIP_QUESTIONS) {
                // 如果目標題目不是「當前題目」也不是「下一題」，直接阻擋
                // (也就是禁止回頭，也禁止跳級)
                if (index < currentQuestionIndex) return; // 禁止回頭
                if (index > currentQuestionIndex + 1) return; // 禁止跳級

                // 如果想去下一題，必須確認「目前這題」已經作答完畢
                if (index === currentQuestionIndex + 1 && userAnswers[currentQuestionIndex] === undefined) {
                    return; // 當前這題沒寫完，不准去下一題
                }
            }

            // 原本的防呆邏輯 (保留)
            if (userAnswers[0] === undefined && index !== 0) {
                 if (ALLOW_SKIP_QUESTIONS) {
                     // 允許跳題模式下，可以跳
                 } else {
                     return; // 嚴格模式下，第一題沒寫不能跳
                 }
            }

            currentQuestionIndex = index;
            showQuestion();
            updateProgress();
        }


		// 顯示題目
        function showQuestion() {
            if (isReading) stopReading();
            updateHintMascotVisibility();
            updateConfettiButtonVisibility(true);
            hideHintBubble();
            
            const question = currentQuestions[currentQuestionIndex];
            const isTrue = question.option1 === '○' && question.option2 === '╳';
            
            // 標題顯示邏輯
            if (isReviewMode) {
                document.getElementById('questionTitle').textContent = `錯題 ${currentQuestionIndex + 1}`;
            } else if (question.isReviewQuestion) {
                document.getElementById('questionTitle').textContent = `${studentAvatar} ${currentQuestionIndex + 1} 🔁 複習題（不計分，多練習一次）`;
            } else {
                document.getElementById('questionTitle').textContent = `${studentAvatar} ${currentQuestionIndex + 1}`;
            }
            
            // ... (以下保持原本的 showQuestion 程式碼不變) ...
            const questionText = document.getElementById('questionText');
            questionText.textContent = question.question;
            questionText.style.fontSize = FONT_SIZES[fontSizeIndex] + 'px';
            
            if (zhuyinMode) {
                questionText.classList.add('zhuyin-font');
            } else {
                questionText.classList.remove('zhuyin-font');
            }
            
            const container = document.getElementById('optionsContainer');
            container.innerHTML = '';
            
            if (layoutMode === 'grid') {
                container.className = 'grid grid-cols-2 gap-3';
            } else {
                container.className = 'space-y-3';
            }
            
            optionsClickable = false;
            
            if (isTrue) {
                ['○ 正確', '╳ 錯誤'].forEach((option, index) => {
                    const button = createOptionButton(option, index + 1);
                    container.appendChild(button);
                });
            } else {
                const options = [
                    { text: question.option1, value: 1 },
                    { text: question.option2, value: 2 },
                    { text: question.option3, value: 3 },
                    { text: question.option4, value: 4 }
                ].filter(opt => opt.text && opt.text.trim());
                
                let displayOptions;
                // 在複習模式下，userAnswers 必定有值，所以順序會固定，不會隨機亂跳
                if (userAnswers[currentQuestionIndex] !== undefined) {
                    displayOptions = options;
                } else {
                    displayOptions = [...options].sort(() => Math.random() - 0.5);
                }
                
                displayOptions.forEach((option, index) => {
                    const button = createOptionButton(`${String.fromCharCode(65 + index)}. ${option.text}`, option.value);
                    container.appendChild(button);
                });
            }
            
            if (userAnswers[currentQuestionIndex] === undefined) {
                setTimeout(() => { optionsClickable = true; }, 1000);
            } else {
                optionsClickable = true;
            }
            
            // 呼叫 updateNextButton 統一處理按鈕顯示
            updateNextButton();
            
			// ★ 控制解析顯示
			if (isQuizMode) {
				// 測驗模式：永遠隱藏解析
				document.getElementById('explanationArea').classList.add('hidden');
				showingExplanation = false;
			} else {
				// 練習模式：如果有作答或是複習模式，就顯示
				if (userAnswers[currentQuestionIndex] !== undefined || isReviewMode) {
					showExplanation(question.explanation);
				} else {
					document.getElementById('explanationArea').classList.add('hidden');
					showingExplanation = false;
				}
			}
			
			updateQuestionNavigation();
		}

		// 選擇答案
        function selectAnswer(value, buttonElement) {
            if (!optionsClickable || userAnswers[currentQuestionIndex] !== undefined) {
                return;
            }
            
            userAnswers[currentQuestionIndex] = value;
            const question = currentQuestions[currentQuestionIndex];
            const isCorrect = value === question.correctAnswer;
            
            const options = document.querySelectorAll('#optionsContainer button');
            
            // 1. 移除點擊事件
            options.forEach(btn => {
                btn.style.pointerEvents = 'none';
                btn.classList.remove('option-button');
            });

            if (isQuizMode) {
                // 測驗模式：只顯示「已選取 (藍底)」，不顯示對錯
                options.forEach((btn) => {
                    const btnValue = parseInt(btn.dataset.value);
                    // 還原基本邊框
                    btn.classList.remove('bg-purple-100', 'border-purple-400', 'bg-green-100', 'border-green-400', 'bg-red-100', 'border-red-400', 'bg-blue-100', 'border-blue-500', 'text-blue-900');
                    btn.classList.add('border-gray-200');

                    if (btnValue === value) {
                        // 選中的項目：顯示藍色邊框與背景
                        btn.classList.remove('border-gray-200');
                        btn.classList.add('bg-blue-100', 'border-blue-500', 'text-blue-900', 'font-bold');
                    }
                });

                // ★ 測驗模式：不顯示解析
                document.getElementById('explanationArea').classList.add('hidden');
                showingExplanation = false;

            } else {
                // ★ 練習模式：原本的邏輯 (顯示紅綠燈、特效、解析)
                options.forEach(btn => {
                    btn.classList.remove('bg-purple-100', 'border-purple-400', 'bg-green-100', 'border-green-400', 'bg-red-100', 'border-red-400', 'bg-blue-100', 'border-blue-500', 'text-blue-900');
                    btn.classList.add('border-gray-200');
                });

                options.forEach((btn) => {
                    const btnValue = parseInt(btn.dataset.value);
                    if (btnValue === question.correctAnswer) {
                        btn.classList.add('bg-green-100', 'border-green-400');
                        btn.classList.remove('border-gray-200');
                        if (isCorrect) showCorrectEffectOnButton(btn);
                    }
                    if (btnValue === value && !isCorrect) {
                        btn.classList.add('bg-red-100', 'border-red-400');
                        btn.classList.remove('border-gray-200');
                    }
                });
                showExplanation(question.explanation);
            }
            
            updateProgress();
            updateQuestionNavigation();
            updateNextButton();
			updateHeaderButtonsVisibility();
        }

		// 創建選項按鈕
        function createOptionButton(text, value) {
            const button = document.createElement('button');
            button.className = 'option-button w-full text-left p-4 rounded-xl border-2 border-gray-200 transition-all font-medium';
            button.textContent = text;
            button.dataset.value = value; 
            button.onclick = () => selectAnswer(value, button);
            button.style.fontSize = FONT_SIZES[fontSizeIndex] + 'px';
            
            if (zhuyinMode) {
                button.classList.add('zhuyin-font');
            }
            
            // 如果已經回答過
            if (userAnswers[currentQuestionIndex] !== undefined) {
                const question = currentQuestions[currentQuestionIndex];
                button.style.pointerEvents = 'none';
                button.classList.remove('option-button');
                
                if (isQuizMode) {
                    // 測驗模式：回頭看題目時，只標示選了哪個 (藍色)，不標示對錯
                    if (value === userAnswers[currentQuestionIndex]) {
                        // 藍色樣式
                        button.classList.add('bg-blue-100', 'border-blue-500', 'text-blue-900', 'font-bold');
                        button.classList.remove('border-gray-200');
                    }
                } else {
                    // 練習模式：回頭看時，顯示對錯
                    if (value === question.correctAnswer) {
                        button.classList.add('bg-green-100', 'border-green-400');
                        button.classList.remove('border-gray-200');
                    } else if (value === userAnswers[currentQuestionIndex]) {
                        button.classList.add('bg-red-100', 'border-red-400');
                        button.classList.remove('border-gray-200');
                    }
                }
            }
            
            return button;
        }


        
        // 在正確選項按鈕上顯示特效
        function showCorrectEffectOnButton(button) {
            const correctEmojis = ['🥰', '✨', '🌟', '😍', '💖', '🎉', '🎊', '🌈'];
            const buttonRect = button.getBoundingClientRect();
            
            const emoji = correctEmojis[Math.floor(Math.random() * correctEmojis.length)];
            const element = document.createElement('div');
            element.className = 'celebration-icon';
            element.textContent = emoji;
            element.style.position = 'fixed';
            element.style.left = (buttonRect.left + Math.random() * buttonRect.width) + 'px';
            element.style.top = (buttonRect.top + Math.random() * buttonRect.height) + 'px';
            element.style.zIndex = '1000';
            element.style.pointerEvents = 'none';
            
            document.body.appendChild(element);
            
            setTimeout(() => {
                element.remove();
            }, 2000);
        }

        // 顯示特效
        function showEffect(type) {
            if (type === 'correct') {
                showCelebrationIcon();
            }
        }

        // 顯示慶祝圖示
        function showCelebrationIcon() {
            const icons = ['⭐', '🎉', '😊', '✨', '🎊', '👏'];
            const icon = icons[Math.floor(Math.random() * icons.length)];
            
            const element = document.createElement('div');
            element.className = 'celebration-icon';
            element.textContent = icon;
            element.style.left = Math.random() * (window.innerWidth - 50) + 'px';
            element.style.top = Math.random() * (window.innerHeight - 100) + 100 + 'px';
            
            document.body.appendChild(element);
            
            setTimeout(() => {
                element.remove();
            }, 2000);
        }

        // 顯示解析
        function showExplanation(explanation) {
            if (!explanation || explanation.trim() === "") {
                document.getElementById('explanationArea').classList.add('hidden');
                showingExplanation = false;
                return;
            }

            const explanationText = document.getElementById('explanationText');
            explanationText.textContent = explanation;
            explanationText.style.fontSize = FONT_SIZES[fontSizeIndex] + 'px';
            
            if (zhuyinMode) {
                explanationText.classList.add('zhuyin-font');
            } else {
                explanationText.classList.remove('zhuyin-font');
            }
            
            document.getElementById('explanationArea').classList.remove('hidden');
            showingExplanation = true;
        }

        // 更新進度
        function updateProgress() {
            const answered = Object.keys(userAnswers).length;
            const total = currentQuestions.length;
            
            document.getElementById('progressText').textContent = `${answered}/${total}`;

            // 更新視覺進度條
            const progressBarFill = document.getElementById('progressBarFill');
            if (progressBarFill) {
                const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
                progressBarFill.style.width = `${percent}%`;
            }
            
            // 檢查是否所有題目都已完成
            if (answered === total) {
                document.getElementById('finishBtn').classList.remove('hidden');
            } else {
                document.getElementById('finishBtn').classList.add('hidden');
            }
        }

        // 更新題目導航
        function updateQuestionNavigation() {
            const buttons = document.querySelectorAll('#questionNav button');
            buttons.forEach((button, index) => {
                updateNavButton(button, index);
            });
        }

        // 更新下一題按鈕
        function updateNextButton() {
            const nextBtn = document.getElementById('nextBtn');
            // 移除 prevBtn 的變數定義
            
            const isCurrentAnswered = userAnswers[currentQuestionIndex] !== undefined;
            const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1;
            
            // 1. 移除控制「上一題」按鈕的程式碼區塊

            // 2. 控制「下一題」按鈕 (維持原樣)
            if (isCurrentAnswered) {
                nextBtn.style.visibility = 'visible';
                // 增加一個彈出動畫效果，讓使用者知道可以按了
                nextBtn.classList.remove('opacity-0', 'translate-y-4'); 
            } else {
                nextBtn.style.visibility = 'hidden';
                // 隱藏時預備動畫狀態
                nextBtn.classList.add('opacity-0', 'translate-y-4');
            }

            // 3. 設定按鈕文字與邏輯 (微調文字顯示，增加文字說明讓大按鈕更豐富)
            if (isLastQuestion) {
                if (isReviewMode) {
                    nextBtn.innerHTML = `<span class="mr-2">返回成績</span><span class="material-icons-outlined">undo</span>`;
                    nextBtn.className = "w-full md:w-2/3 bg-gray-600 hover:bg-gray-700 text-white py-4 rounded-xl font-bold text-xl transition-all shadow-lg flex items-center justify-center";
                } else {
                    nextBtn.innerHTML = `<span class="mr-2">完成測驗，看成績！</span><span class="material-icons-outlined">check_circle</span>`;
                    // 最後一題時，可以換個顏色強調
                    nextBtn.className = "w-full md:w-2/3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-xl font-bold text-xl transition-all shadow-lg flex items-center justify-center";
                }
            } else {
                // 一般題目
                nextBtn.innerHTML = `<span class="mr-1">下一題</span><span class="material-icons-outlined">arrow_forward</span>`;
                // 恢復標準顏色
                nextBtn.className = "w-full md:w-2/3 bg-purple-500 hover:bg-purple-600 text-white py-4 rounded-xl font-bold text-xl transition-all shadow-lg flex items-center justify-center";
            }
        }

        // 下一題按鈕點擊事件
        document.getElementById('nextBtn').onclick = () => {
            const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1;

            if (isLastQuestion) {
                if (isReviewMode) {
                    exitReviewMode();
                } else {
                    // 一般模式，完成測驗
                    showResult();
                }
            } else {
                // 還有下一題，繼續
                currentQuestionIndex++;
                showQuestion();
                updateProgress();
            }
        };

		// 退出複習模式，還原資料
		function exitReviewMode() {
			isReviewMode = false;
			
			// 還原原本的題目與答案
			currentQuestions = originalQuestionsBackup;
			userAnswers = originalAnswersBackup;
			
			// 使用 currentCourseTitle 還原標題
			document.getElementById('mainTitle').textContent = `${QUIZ_HEADER_ICON} ${currentCourseTitle}`;
			const headerArea = document.getElementById('headerArea');
            const mainTitle = document.getElementById('mainTitle');

			// 減少底部間距 (原本是 mb-8)
            headerArea.classList.remove('mb-8');
            headerArea.classList.add('mb-2'); 

            // 縮小字體 (原本是 text-2xl md:text-4xl)
            mainTitle.classList.remove('text-2xl', 'md:text-4xl');
            mainTitle.classList.add('text-xl', 'md:text-2xl');

			document.getElementById('userInfo').style.cursor = 'default';
			document.getElementById('userInfo').onclick = null;

			// 切換回成績頁面
			document.getElementById('quizArea').classList.add('hidden');
			document.getElementById('resultArea').classList.remove('hidden');
		}

        // 完成測驗
        document.getElementById('finishBtn').onclick = () => {
            if (Object.keys(userAnswers).length < currentQuestions.length) {
                if (!confirm('還有題目未作答，確定要完成測驗嗎？')) {
                    return;
                }
            }
            showResult();
        };

        // 顯示結果
		function showResult() {
            stopHintMascot();

            if (isReviewMode) {
                exitReviewMode();
                return;
            }

            if (isSpacedReviewSession) {
                finishSpacedReviewSession();
                return;
            }

            // 交卷後，自動結束測驗模式
            const wasQuizMode = isQuizMode; // 先記住，因為底下馬上會被重置成 false
            if (isQuizMode) {
                isQuizMode = false;
                updateUrlForQuiz(currentCourseId);
            }

            // 只計算原始題目的分數，最後附加的「複習題」不計分、不影響成績
            const total = baseQuestionCount || currentQuestions.length;
            const scoringQuestions = currentQuestions.slice(0, total);
            const answered = scoringQuestions.filter((q, i) => userAnswers[i] !== undefined).length;
            let correct = 0;
            
            let wrongQuestionsList = [];
            
            scoringQuestions.forEach((question, index) => {
                if (userAnswers[index] === question.correctAnswer) {
                    correct++;
                } else {
                    wrongQuestionsList.push(index + 1);
                }
            });
            
            const wrong = answered - correct;
            const percentage = Math.round((correct / total) * 100);

            // 🌟 只有「測驗模式」交卷才會給積分，練習模式不給（避免無限重練刷積分）
            let earnedPoints = 0;
            if (wasQuizMode) {
                earnedPoints = getPointsForScore(percentage);
                if (earnedPoints > 0) {
                    addPoints(studentName, studentClass, earnedPoints);
                }
            }

            // 🎉 不管測驗或練習，只要分數達標就自動灑花一次（會消耗 1 次灑花額度，沒額度就不會自動觸發）
            let autoConfettiTriggered = false;
            if (ENABLE_CONFETTI_EFFECT && percentage >= CONFETTI_AUTO_TRIGGER_SCORE) {
                autoConfettiTriggered = useConfettiCharge(studentName, studentClass);
            }
            
            // 將錯題陣列轉為字串
            const wrongString = wrongQuestionsList.join(',');

            // 儲存歷史紀錄（含錯題清單，供下次「間隔複習」使用）
            saveHistory(percentage, true, wrongQuestionsList);
            
            // 【修正 2】確保 100 分也能送出
            // 只要啟用開關且代碼正確，無論幾分都要送
            if (ENABLE_GOOGLE_FORM_SUBMIT && studentQuizCode === QUIZ_CODE) {
                // 依題目原始順序打包作答內容（未作答記為 null），
                // 讓伺服器可以用「官方答案」重新計分，避免分數被瀏覽器端偽造
                const answersForVerification = currentQuestions.map((q, idx) =>
                    userAnswers[idx] !== undefined ? userAnswers[idx] : null
                );

                submitScoreForVerification({
                    name: studentName,
                    classNum: studentClass,
                    quizCode: studentQuizCode,
                    courseId: currentCourseId,
                    courseTitle: currentCourseTitle,
                    answers: answersForVerification,
                    clientPercentage: percentage, // 僅供尚未部署驗證 API 時的過渡使用
                    wrongString
                });
                // 提示改為在 submitScoreForVerification 實際知道結果（成功/離線/失敗）後才顯示
            }
            
            // 計算星級 (UI顯示)
            let stars = '';
            const fullStars = Math.floor(percentage / 20);
            const hasHalfStar = (percentage % 20) >= 10;
            const starClass = 'material-icons text-yellow-400'; 

            for (let i = 0; i < fullStars; i++) {
                stars += `<span class="${starClass}">star</span>`;
            }
            if (hasHalfStar && fullStars < 5) {
                stars += `<span class="${starClass}">star_half</span>`;
            }
            const totalSymbols = fullStars + (hasHalfStar ? 1 : 0);
            for (let i = totalSymbols; i < 5; i++) {
                stars += `<span class="${starClass}">star_border</span>`;
            }
            
            document.getElementById('starRating').innerHTML = stars;
            document.getElementById('scoreText').textContent = `得分：${percentage}分`;

            const pointsNotice = document.getElementById('pointsEarnedNotice');
            if (pointsNotice) {
                if (earnedPoints > 0) {
                    pointsNotice.textContent = `🌟 太棒了！獲得 ${earnedPoints} 點積分`;
                    pointsNotice.classList.remove('hidden');
                } else {
                    pointsNotice.classList.add('hidden');
                }
            }

            document.getElementById('correctCount').textContent = correct;
            document.getElementById('wrongCount').textContent = wrong;
            document.getElementById('totalCount').textContent = total;
            
            document.getElementById('quizArea').classList.add('hidden');
            document.getElementById('exitQuizBtn').classList.add('hidden');
            document.getElementById('resultArea').classList.remove('hidden');

            updateHeaderButtonsVisibility();
            updateConfettiButtonVisibility(true);
            if (autoConfettiTriggered) {
                setTimeout(triggerConfettiEffect, 300); // 稍微延遲，等結果頁畫面切換完成再灑花
            }
        }
        
        // 待補送資料的 localStorage 鍵值
        const PENDING_SUBMISSION_KEY = `${QUIZ_ID}_pendingSubmissions`;

        // 將尚未送出的成績暫存起來，之後可自動或手動重新補送
        function savePendingSubmission(payload) {
            try {
                const pending = JSON.parse(localStorage.getItem(PENDING_SUBMISSION_KEY) || '[]');
                pending.push(payload);
                localStorage.setItem(PENDING_SUBMISSION_KEY, JSON.stringify(pending));
            } catch (error) {
                console.log('儲存待補送成績時發生錯誤');
            }
        }

        // 送出成績以供伺服器驗證
        // - 若已設定 SCORE_API_URL：送到會「重新計分」的 Apps Script API，
        //   伺服器會用官方答案重算分數，不採信瀏覽器端算出的分數，可防止分數被偽造。
        // - 若尚未部署（SCORE_API_URL 為空字串）：自動退回舊的 Google表單直接傳送方式，
        //   維持過渡期間網站仍可正常使用（此模式下分數仍是由瀏覽器端計算，未經驗證）。
        function submitScoreForVerification(data) {
            if (!SCORE_API_URL) {
                sendScoreToGoogleForm(
                    data.name,
                    data.classNum,
                    data.clientPercentage,
                    data.quizCode,
                    data.courseId,
                    data.courseTitle,
                    data.wrongString
                );
                return;
            }

            const payload = {
                name: data.name,
                classNum: data.classNum,
                quizCode: data.quizCode,
                courseId: data.courseId,
                courseTitle: data.courseTitle,
                answers: data.answers
            };

            if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                savePendingSubmission(payload);
                showSubmissionFailureAlert();
                return;
            }

            fetch(SCORE_API_URL, {
                method: "POST",
                // 用 text/plain 避免瀏覽器對 Apps Script 發出 CORS 預檢請求而被擋下
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload)
            }).then(res => res.json())
              .then(result => {
                if (result && result.success) {
                    console.log(`成績已由伺服器驗證並記錄: ${result.score}分`);
                    showSubmissionSuccessAlert();
                } else {
                    console.log('伺服器拒絕這筆成績:', result && result.message);
                    savePendingSubmission(payload);
                    showSubmissionFailureAlert();
                }
            }).catch(error => {
                console.log('成績送出失敗 (已存入待補送清單)');
                savePendingSubmission(payload);
                showSubmissionFailureAlert();
            });
        }

        // 傳送成績到Google表單
        // 回傳值僅供內部使用，實際成功/失敗提示會在確定結果後才顯示
        function sendScoreToGoogleForm(name, classNum, score, quizCode, courseId, courseTitle, wrongList) {
            const payload = { name, classNum, score, quizCode, courseId, courseTitle, wrongList };

            // 離線時不必嘗試送出，直接記錄為待補送並提示使用者
            if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                savePendingSubmission(payload);
                showSubmissionFailureAlert();
                return;
            }

            try {
                const formData = new URLSearchParams();
                formData.append(GOOGLE_FORM_CONFIG.nameField, name);
                formData.append(GOOGLE_FORM_CONFIG.classField, classNum);
                formData.append(GOOGLE_FORM_CONFIG.scoreField, score);
                
                // if (GOOGLE_FORM_CONFIG.quizCodeField) formData.append(GOOGLE_FORM_CONFIG.quizCodeField, quizCode);

                if (GOOGLE_FORM_CONFIG.idField) {
                    formData.append(GOOGLE_FORM_CONFIG.idField, courseId);
                }

                if (GOOGLE_FORM_CONFIG.titleField) {
                    formData.append(GOOGLE_FORM_CONFIG.titleField, courseTitle);
                }

                if (GOOGLE_FORM_CONFIG.wrongField) {
                    let finalWrongText = "無";
                    if (wrongList && wrongList.length > 0) {
                        finalWrongText = wrongList;
                    }
                    formData.append(GOOGLE_FORM_CONFIG.wrongField, finalWrongText);
                }

                // 自動送出
                // 注意：mode: "no-cors" 下瀏覽器無法讀取伺服器實際回應狀態，
                // .then() 只代表「請求有送出去」，不代表 Google 表單真的收到資料，
                // 但至少能透過 .catch() 攔截離線、DNS 失敗等網路層級的錯誤。
                fetch(GOOGLE_FORM_CONFIG.formUrl, {
                    method: "POST",
                    mode: "no-cors",
                    body: formData
                }).then(() => {
                    console.log(`成績傳送成功: ${score}分`);
                    showSubmissionSuccessAlert();
                }).catch(error => {
                    console.log('成績傳送發生錯誤 (已存入待補送清單)');
                    savePendingSubmission(payload);
                    showSubmissionFailureAlert();
                });
            } catch (error) {
                console.log('成績傳送過程中發生錯誤 (已存入待補送清單)');
                savePendingSubmission(payload);
                showSubmissionFailureAlert();
            }
        }

        // 嘗試重新補送所有待補送的成績（例如重新連上網路後）
        function resendPendingSubmissions() {
            let pending;
            try {
                pending = JSON.parse(localStorage.getItem(PENDING_SUBMISSION_KEY) || '[]');
            } catch (error) {
                localStorage.removeItem(PENDING_SUBMISSION_KEY);
                return;
            }
            if (!pending.length) return;
            if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

            // 先清空，重送過程中若又失敗，會透過 savePendingSubmission 重新加回去
            localStorage.removeItem(PENDING_SUBMISSION_KEY);
            pending.forEach(p => {
                if (p && p.answers) {
                    // 新格式（驗證 API）：直接用 fetch 重送，避免又被當成新提交重複打包
                    if (!SCORE_API_URL) {
                        savePendingSubmission(p); // 尚未設定 API，先留著等設定好再送
                        return;
                    }
                    fetch(SCORE_API_URL, {
                        method: "POST",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify(p)
                    }).then(res => res.json())
                      .then(result => {
                        if (!(result && result.success)) savePendingSubmission(p);
                    }).catch(() => savePendingSubmission(p));
                } else {
                    // 舊格式（Google表單）
                    sendScoreToGoogleForm(p.name, p.classNum, p.score, p.quizCode, p.courseId, p.courseTitle, p.wrongList);
                }
            });
        }

        // 檢視錯題
        document.getElementById('reviewBtn').onclick = () => {
            showWrongQuestions();
        };

        // 顯示錯題
        function showWrongQuestions() {
            // 1. 篩選出錯誤的題目
            const wrongQs = [];
            const reviewAnswers = {};

            currentQuestions.forEach((q, originalIndex) => {
                const userAns = userAnswers[originalIndex];
                if (userAns !== undefined && userAns !== q.correctAnswer) {
                    wrongQs.push(q);
                    reviewAnswers[wrongQs.length - 1] = userAns;
                }
            });

            if (wrongQs.length === 0) {
                 alert('🎉 太棒了！沒有答錯的題目！');
                 return;
            }

            // 2. 備份當前狀態
			isQuizMode = false;
            isReviewMode = true;
            originalQuestionsBackup = [...currentQuestions];
            originalAnswersBackup = {...userAnswers};

            // 3. 替換為錯題數據
            currentQuestions = wrongQs;
            userAnswers = reviewAnswers;
            currentQuestionIndex = 0;

            // 4. 切換介面顯示
            document.getElementById('resultArea').classList.add('hidden'); 
            document.getElementById('quizArea').classList.remove('hidden'); 
            document.getElementById('exitQuizBtn').classList.add('hidden'); 
            
            document.getElementById('finishBtn').classList.add('hidden');

            // 修改標題
            document.getElementById('mainTitle').textContent = '📝 錯題檢視';

            // 5. 初始化題目介面
            initQuestionNavigation();
            showQuestion();
            
            // 複習模式不需要顯示進度條 (因為會一直跳動)，或是顯示也無妨
            updateProgress();
        }

        // 返回成績
        document.getElementById('backToResultBtn').onclick = () => {
            document.getElementById('reviewArea').classList.add('hidden');
            document.getElementById('resultArea').classList.remove('hidden');
        };

        // 頂端返回成績按鈕
        document.getElementById('backToResultBtnTop').onclick = () => {
            document.getElementById('reviewArea').classList.add('hidden');
            document.getElementById('resultArea').classList.remove('hidden');
        };

        // 頂端返回首頁按鈕
		document.getElementById('backToHomeFromReviewBtnTop').onclick = () => {
			isReviewMode = false;
			// 恢復標題
			document.getElementById('mainTitle').textContent = QUIZ_TITLE;
			
			// 恢復右上角個人資訊點擊功能
			document.getElementById('userInfo').style.cursor = 'pointer';
			document.getElementById('userInfo').onclick = editStudentInfo;
			
			hideAllAreas();
			document.getElementById('courseSelection').classList.remove('hidden');
			// 重新初始化課別選單以更新練習次數
			initCourseSelection();

			// 修改：呼叫更完整的更新函數
			updateHeaderButtonsVisibility();

			// 【新增】重設頂部標題區塊的顯示狀態
			const headerArea = document.getElementById('headerArea');
			if (headerArea.classList.contains('hidden')) {
				headerArea.classList.remove('hidden');
				document.getElementById('toggleHeaderIcon').textContent = '🔼';
			}
		};

        // 重新測驗
		document.getElementById('restartBtn').onclick = () => {
			// 恢復標題
			document.getElementById('mainTitle').textContent = QUIZ_TITLE;
			
			// 恢復右上角個人資訊點擊功能
			document.getElementById('userInfo').style.cursor = 'pointer';
			document.getElementById('userInfo').onclick = editStudentInfo;
			
			hideAllAreas();
			document.getElementById('courseSelection').classList.remove('hidden');
			// 重新初始化課別選單以更新練習次數
			initCourseSelection();

			// 修改：呼叫更完整的更新函數
			updateHeaderButtonsVisibility();

			// 【新增】重設頂部標題區塊的顯示狀態
			const headerArea = document.getElementById('headerArea');
			if (headerArea.classList.contains('hidden')) {
				headerArea.classList.remove('hidden');
				document.getElementById('toggleHeaderIcon').textContent = '🔼';
			}
		};

        // 底部返回首頁按鈕
		document.getElementById('backToHomeFromReviewBtn').onclick = () => {
			isReviewMode = false;
			// 恢復標題
			document.getElementById('mainTitle').textContent = QUIZ_TITLE;
			
			// 恢復右上角個人資訊點擊功能
			document.getElementById('userInfo').style.cursor = 'pointer';
			document.getElementById('userInfo').onclick = editStudentInfo;
			
			hideAllAreas();
			document.getElementById('courseSelection').classList.remove('hidden');
			// 重新初始化課別選單以更新練習次數
			initCourseSelection();

			// 修改：呼叫更完整的更新函數
			updateHeaderButtonsVisibility();

			// 【新增】重設頂部標題區塊的顯示狀態
			const headerArea = document.getElementById('headerArea');
			if (headerArea.classList.contains('hidden')) {
				headerArea.classList.remove('hidden');
				document.getElementById('toggleHeaderIcon').textContent = '🔼';
			}
		};

        // 隱藏所有區域
        function hideAllAreas() {
            document.getElementById('courseSelection').classList.add('hidden');
            document.getElementById('quizArea').classList.add('hidden');
            document.getElementById('resultArea').classList.add('hidden');
            document.getElementById('reviewArea').classList.add('hidden');
            document.getElementById('historyArea').classList.add('hidden');
            document.getElementById('exitQuizBtn').classList.add('hidden');
        }

        // 歷史紀錄按鈕事件
        document.getElementById('historyBtn').onclick = () => {
            showHistory();
        };

        // 複習錯題按鈕事件
        const startSpacedReviewBtnEl = document.getElementById('startSpacedReviewBtn');
        if (startSpacedReviewBtnEl) {
            startSpacedReviewBtnEl.onclick = () => {
                startSpacedReviewSession();
            };
        }

		// 返回歷史紀錄按鈕事件
		document.getElementById('backFromHistoryBtn').onclick = () => {
			hideAllAreas();
			document.getElementById('courseSelection').classList.remove('hidden');

			// 新增下面這一行：重新繪製首頁卡片，以更新練習次數
			initCourseSelection();

			// 隱藏返回按鈕
			document.getElementById('backFromHistoryBtn').classList.add('hidden');

			// 更新並顯示主選單的按鈕
			updateHeaderButtonsVisibility();
		};

        // 終止測驗按鈕事件
        document.getElementById('exitQuizBtn').onclick = () => {
            const dialog = document.getElementById('exitConfirmDialog');
            const dialogContent = document.getElementById('exitConfirmDialogContent');
            dialog.classList.remove('hidden');
            
            // 觸發 CSS 動畫
            setTimeout(() => {
                dialog.classList.remove('opacity-0');
                dialogContent.classList.remove('scale-95', 'opacity-0');
                dialogContent.classList.add('scale-100', 'opacity-100');
            }, 10); // 短延遲確保 CSS transition 生效
        };

// 頁面關閉時儲存未完成紀錄
window.addEventListener('beforeunload', () => {
    // 判斷是否有作答
    const hasAnswered = Object.keys(userAnswers).length > 0;

    // 只有在測驗進行中且「有作答」時才記錄
    if (startTime && document.getElementById('quizArea').classList.contains('hidden') === false && hasAnswered) {
        saveHistory(0, false);
    }
});




		// ========================================
		// 🔧 新增：終止測驗自訂選單功能
		// ========================================
		const exitDialog = document.getElementById('exitConfirmDialog');
		const exitDialogContent = document.getElementById('exitConfirmDialogContent');
		const confirmExitBtn = document.getElementById('confirmExitBtn');
		const cancelExitBtn = document.getElementById('cancelExitBtn');

		// 關閉對話框的通用函式
		function closeExitDialog() {
			exitDialog.classList.add('opacity-0');
			exitDialogContent.classList.remove('scale-100', 'opacity-100');
			exitDialogContent.classList.add('scale-95', 'opacity-0');
			setTimeout(() => {
				exitDialog.classList.add('hidden');
			}, 300); // 等待動畫結束再隱藏
		}
		
		// 實際執行終止測驗的函式

		function performQuizExit() {
			// 檢查是否至少回答了一題
			const hasAnswered = Object.keys(userAnswers).length > 0;

			if (startTime && hasAnswered) {
				saveHistory(0, false);
			}
			
			resetUrlToHome();
			returnToHomeUI();
		}

		// 按下「確定終止」
		confirmExitBtn.addEventListener('click', () => {
			performQuizExit();
			closeExitDialog();
		});

		// 按下「繼續作答」
		cancelExitBtn.addEventListener('click', () => {
			closeExitDialog();
		});

		// 點擊背景遮罩也可以關閉
		exitDialog.addEventListener('click', (e) => {
			if (e.target === exitDialog) {
				closeExitDialog();
			}
		});




        // 朗讀功能
        document.getElementById('readBtn').onclick = () => {
            if (isReading) {
                stopReading();
            } else {
                startReading();
            }
        };
        
        // 解析朗讀功能
        document.getElementById('readExplanationBtn').onclick = () => {
            if (currentExplanationAudio) {
                stopExplanationReading();
            } else {
                startExplanationReading();
            }
        };

		// 通用朗讀函式：優先使用 Google 線上語音（音質較自然），
		// 若朗讀失敗（例如離線、字數過長、暫時被封鎖等），自動改用瀏覽器原生的 Web Speech API 朗讀
		function speakText(text, onEnd) {
			const player = { audio: null, usingNative: false };

			const useNativeSpeech = () => {
				if (!('speechSynthesis' in window)) {
					alert('朗讀功能暫時無法使用');
					if (onEnd) onEnd();
					return;
				}
				player.usingNative = true;
				const utterance = new SpeechSynthesisUtterance(text);
				utterance.lang = 'zh-TW';
				utterance.onend = () => { if (onEnd) onEnd(); };
				utterance.onerror = () => {
					alert('朗讀功能暫時無法使用');
					if (onEnd) onEnd();
				};
				window.speechSynthesis.cancel(); // 避免與前一段語音重疊
				window.speechSynthesis.speak(utterance);
			};

			const encodedText = encodeURIComponent(text);
			const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-tw&client=tw-ob&q=${encodedText}`;
			const audio = new Audio(audioUrl);
			audio.onended = () => { if (onEnd) onEnd(); };
			audio.onerror = () => {
				// Google 朗讀失敗，改用瀏覽器原生語音朗讀
				useNativeSpeech();
			};
			player.audio = audio;
			audio.play().catch(() => useNativeSpeech());

			player.stop = () => {
				if (player.audio) {
					player.audio.onended = null;
					player.audio.onerror = null;
					player.audio.pause();
				}
				if ('speechSynthesis' in window) {
					window.speechSynthesis.cancel();
				}
			};

			return player;
		}

		function startReading() {
			// 如果解析正在朗讀，就先停止它
			if (currentAudio) {
				stopReading();
			}
			if (currentExplanationAudio) {
				stopExplanationReading();
			}

			const question = currentQuestions[currentQuestionIndex];
			const isTrue = question.option1 === '○' && question.option2 === '╳';

			let textToRead = question.question;

			if (isTrue) {
				textToRead += '。選項：正確，錯誤';
			} else {
				const options = [question.option1, question.option2, question.option3, question.option4]
					.filter(opt => opt && opt.trim())
					.map((opt, index) => `${String.fromCharCode(65 + index)}，${opt}`)
					.join('。');
				textToRead += `。選項：${options}`;
			}

			currentAudio = speakText(textToRead, () => stopReading());
			isReading = true;

			const btn = document.getElementById('readBtn');
			btn.innerHTML = '<span class="material-icons-outlined">stop</span>';
			btn.classList.add('is-playing');
		}

        function stopReading() {
            if (currentAudio) {
                currentAudio.stop();
                currentAudio = null;
            }
            isReading = false;
            
            const btn = document.getElementById('readBtn');
            btn.innerHTML = '<span class="material-icons-outlined">volume_up</span>';
            btn.classList.remove('is-playing');
        }
        
        // 開始朗讀解析
		function startExplanationReading() {
			// 如果題目正在朗讀，就先停止它
			if (isReading) {
				stopReading();
			}

			const explanationText = document.getElementById('explanationText').textContent;

			currentExplanationAudio = speakText(explanationText, () => stopExplanationReading());

			const btn = document.getElementById('readExplanationBtn');
			btn.innerHTML = '<span class="material-icons-outlined text-base">stop</span>';
			btn.classList.add('is-playing');
		}
        
        // 停止朗讀解析
        function stopExplanationReading() {
            if (currentExplanationAudio) {
                currentExplanationAudio.stop();
                currentExplanationAudio = null;
            }
            
            const btn = document.getElementById('readExplanationBtn');
            btn.innerHTML = '<span class="material-icons-outlined text-base">volume_up</span>';
            btn.classList.remove('is-playing');
        }

        // 注音模式切換
        document.getElementById('zhuyinBtn').onclick = () => {
            zhuyinMode = !zhuyinMode;
            const btn = document.getElementById('zhuyinBtn');
            btn.classList.toggle('is-active', zhuyinMode);
            showQuestion(); // 重新顯示題目以應用字體
        };

        // 🙂 小助手提示按鈕
        const hintMascotBtnEl = document.getElementById('hintMascotBtn');
        if (hintMascotBtnEl) {
            hintMascotBtnEl.onclick = (e) => {
                e.stopPropagation();
                onHintMascotClick();
            };
        }

        // 🎉 灑花特效按鈕
        const confettiButtonBtnEl = document.getElementById('confettiButtonBtn');
        if (confettiButtonBtnEl) {
            confettiButtonBtnEl.onclick = (e) => {
                e.stopPropagation();
                onConfettiButtonClick();
            };
        }
        // 頭像到期通知的關閉按鈕
        const avatarExpiryNoticeCloseEl = document.getElementById('avatarExpiryNoticeClose');
        if (avatarExpiryNoticeCloseEl) {
            avatarExpiryNoticeCloseEl.onclick = () => {
                document.getElementById('avatarExpiryNotice').classList.add('hidden');
            };
        }
        // 點提示泡泡本身不應該把泡泡關掉（避免點裡面的文字時意外觸發外層關閉邏輯）
        const hintBubbleEl = document.getElementById('hintBubble');
        if (hintBubbleEl) {
            hintBubbleEl.onclick = (e) => e.stopPropagation();
        }
        // 提示泡泡的關閉按鈕
        const hintBubbleCloseBtnEl = document.getElementById('hintBubbleCloseBtn');
        if (hintBubbleCloseBtnEl) {
            hintBubbleCloseBtnEl.onclick = (e) => {
                e.stopPropagation();
                hideHintBubble();
            };
        }
        // 點畫面其他地方時，順便把提示泡泡收起來
        document.addEventListener('click', () => {
            hideHintBubble();
        });

        // 字體大小控制 (五級：18, 20, 22, 24, 26)
        document.getElementById('fontSizeUp').onclick = () => {
            if (fontSizeIndex < FONT_SIZES.length - 1) {
                fontSizeIndex++;
                showQuestion();
                if (showingExplanation) {
                    const explanationText = document.getElementById('explanationText');
                    explanationText.style.fontSize = FONT_SIZES[fontSizeIndex] + 'px';
                }
            }
        };

        document.getElementById('fontSizeDown').onclick = () => {
            if (fontSizeIndex > 0) {
                fontSizeIndex--;
                showQuestion();
                if (showingExplanation) {
                    const explanationText = document.getElementById('explanationText');
                    explanationText.style.fontSize = FONT_SIZES[fontSizeIndex] + 'px';
                }
            }
        };

        // 排版切換按鈕
        document.getElementById('layoutBtn').onclick = () => {
            if (layoutMode === 'grid') {
                layoutMode = 'vertical';
            } else {
                layoutMode = 'grid';
            }
            
            updateLayoutButton();
            showQuestion(); // 重新顯示題目以應用排版
        };

        // 更新排版按鈕顯示
        function updateLayoutButton() {
            const icon = document.getElementById('layoutBtnIcon');
            const btn = document.getElementById('layoutBtn');
            if (layoutMode === 'grid') {
                icon.textContent = 'view_module';
                btn.title = '左右排版';
            } else {
                icon.textContent = 'view_agenda';
                btn.title = '上下排版';
            }
        }


        // 初始化學生資訊
// 初始化學生資訊
        function initStudentInfo() {
            // 初始化頭像分類標籤
            const avatarTabs = document.getElementById('avatarTabs');
            avatarTabs.addEventListener('click', (e) => {
                if (e.target.dataset.category) {
                    // 更新標籤狀態
                    avatarTabs.querySelectorAll('button').forEach(btn => {
                        btn.classList.remove('bg-purple-500', 'text-white');
                        btn.classList.add('bg-gray-200', 'text-gray-700');
                    });
                    e.target.classList.remove('bg-gray-200', 'text-gray-700');
                    e.target.classList.add('bg-purple-500', 'text-white');
                    
                    // 顯示對應分類的頭像
                    showAvatarCategory(e.target.dataset.category);
                }
            });
            
            // 預設顯示動物分類
            showAvatarCategory('animals');
            updatePointsDisplay();

            // 監聽名字和班號輸入
            document.getElementById('studentName').addEventListener('input', () => {
                checkStudentInfo();
                updatePointsDisplay();
                showAvatarCategory(activeAvatarCategory); // 換人時，重新檢查頭像解鎖狀態
            });
            document.getElementById('studentClass').addEventListener('input', () => {
                checkStudentInfo();
                updatePointsDisplay();
                showAvatarCategory(activeAvatarCategory);
            });
            document.getElementById('studentQuizCode').addEventListener('input', checkStudentInfo); // 【新增】
        }
        
        // 顯示指定分類的頭像
        let activeAvatarCategory = 'animals'; // 記住目前顯示哪個頭像分類，方便兌換後重新渲染同一頁

        function showAvatarCategory(category) {
            activeAvatarCategory = category;
            const avatarSelection = document.getElementById('avatarSelection');
            avatarSelection.innerHTML = '';

            const name = document.getElementById('studentName').value.trim();
            const classNum = document.getElementById('studentClass').value.trim();

            const avatars = avatarCategories[category] || [];
            avatars.forEach(avatar => {
                const unlocked = isAvatarUnlocked(name, classNum, avatar) || avatar === studentAvatar;
                const button = document.createElement('button');
                button.className = 'relative text-xl p-1 rounded-lg border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all';
                if (unlocked) {
                    button.textContent = avatar;
                } else {
                    button.innerHTML = `<span style="opacity: 0.35;">${avatar}</span><span style="position: absolute; bottom: -2px; right: -2px; font-size: 10px;">🔒</span>`;
                }
                if (avatar === studentAvatar) {
                    button.classList.remove('border-gray-200');
                    button.classList.add('border-purple-500', 'bg-purple-100');
                }
                button.onclick = () => handleAvatarClick(avatar, button, unlocked);
                avatarSelection.appendChild(button);
            });
        }

        // 點頭像時的分流：已解鎖直接選；沒解鎖就走積分兌換流程
        function handleAvatarClick(avatar, button, unlocked) {
            if (unlocked) {
                selectAvatar(avatar, button);
                return;
            }

            const name = document.getElementById('studentName').value.trim();
            const classNum = document.getElementById('studentClass').value.trim();
            if (!name || !classNum) {
                showGenericAlert('🌟 還不能兌換喔', '請先輸入姓名和班號，才能查詢你的積分喔！');
                return;
            }

            const points = getPoints(name, classNum);
            if (points < AVATAR_UNLOCK_COST) {
                showGenericAlert(
                    '🌟 積分不夠喔',
                    `這個頭像需要 ${AVATAR_UNLOCK_COST} 點，你目前有 ${points} 點，還差 ${AVATAR_UNLOCK_COST - points} 點。多完成幾次測驗就可以了！`
                );
                return;
            }

            showGenericConfirm({
                title: `${avatar} 要兌換這個頭像嗎？`,
                message: `需要花費 ${AVATAR_UNLOCK_COST} 點積分，這個頭像可以用 ${AVATAR_UNLOCK_DAYS} 天，到期後會自動變回預設頭像。\n目前積分：${points} 點，兌換後剩：${points - AVATAR_UNLOCK_COST} 點`,
                theme: 'default',
                confirmText: '兌換',
                onConfirm: () => {
                    if (spendPoints(name, classNum, AVATAR_UNLOCK_COST)) {
                        unlockAvatarForStudent(name, classNum, avatar);
                        showAvatarCategory(activeAvatarCategory); // 重新渲染，把鎖頭打開

                        // 重新渲染後原本的 button 參照已經失效，要找新的按鈕再選取
                        const refreshedButtons = document.querySelectorAll('#avatarSelection button');
                        refreshedButtons.forEach(btn => {
                            if (btn.textContent === avatar) {
                                selectAvatar(avatar, btn);
                            }
                        });
                        updatePointsDisplay(); // 放在 selectAvatar 之後，效期倒數才會抓到新頭像
                    }
                    closeGenericDialog();
                }
            });
        }

        function selectAvatar(avatar, button) {
            // 移除所有頭像的選中狀態
            document.querySelectorAll('#avatarSelection button').forEach(btn => {
                btn.classList.remove('border-purple-500', 'bg-purple-100');
                btn.classList.add('border-gray-200');
            });
            
            // 選中當前頭像
            button.classList.remove('border-gray-200');
            button.classList.add('border-purple-500', 'bg-purple-100');
            
            studentAvatar = avatar;
            checkStudentInfo();
        }

function checkStudentInfo() {
            const name = document.getElementById('studentName').value.trim();
            const classNum = document.getElementById('studentClass').value.trim();
            const quizCode = document.getElementById('studentQuizCode').value.trim();
            const confirmBtn = document.getElementById('confirmStudentInfo');
            const cancelBtn = document.getElementById('cancelEditBtn');

            // 透過「取消修改」按鈕是否可見，來判斷是否為編輯模式
            const isEditMode = !cancelBtn.classList.contains('hidden');

            let isFormValid = false;

            if (isEditMode) {
                // 如果是編輯模式，姓名、班號和頭像是必要的，但測驗代碼可選
                isFormValid = name && classNum && studentAvatar;
            } else {
                // 如果是初始設定模式，所有欄位都是必要的
                isFormValid = name && classNum && studentAvatar && quizCode;
            }

            if (isFormValid) {
                confirmBtn.disabled = false;
            } else {
                confirmBtn.disabled = true;
            }
        }

        // 確認學生資訊
// 確認學生資訊
        document.getElementById('confirmStudentInfo').onclick = () => {
            // 從輸入框讀取最新的值
            const newName = document.getElementById('studentName').value.trim();
            const newClass = document.getElementById('studentClass').value.trim();
            const newQuizCode = document.getElementById('studentQuizCode').value.trim();

            // 再次判斷當前是否為編輯模式
            const isEditMode = !document.getElementById('cancelEditBtn').classList.contains('hidden');

            let canProceed = false;
            if (isEditMode) {
                // 編輯模式下，姓名、班號、頭像為必填，代碼選填
                canProceed = newName && newClass && studentAvatar;
            } else {
                // 初始設定模式下，所有欄位皆為必填
                canProceed = newName && newClass && studentAvatar && newQuizCode;
            }

            if (canProceed) {
                // 更新全域變數 (即使測驗代碼是空的，也會正確儲存)
                studentName = newName;
                studentClass = newClass;
                studentQuizCode = newQuizCode;

                // 呼叫 loginUser 函數，它會處理頁面切換，回到首頁
                loginUser(studentName, studentClass, studentAvatar, studentQuizCode);
                
                // 更新相同姓名的歷史紀錄頭像
                updateHistoryAvatarsByName(studentName, studentAvatar);
                
                // 重置表單與按鈕的狀態
                document.getElementById('studentInfoTitle').textContent = '🦋 個人資訊';
                document.getElementById('confirmStudentInfo').textContent = '開始 🚀';
                document.getElementById('cancelEditBtn').classList.add('hidden');
                document.getElementById('resetBtn').classList.add('hidden');
				document.getElementById('backFromEditBtn').classList.add('hidden');
                
                // 回到頁面頂端
                window.scrollTo(0, 0);
            }
        };


        // 編輯學生資訊
        function editStudentInfo() {
            // 檢查是否在歷史紀錄頁面，如果是則不允許修改
            if (!document.getElementById('historyArea').classList.contains('hidden')) {
                return;
            }
            updateConfettiButtonVisibility(false);
            maybeShowAvatarExpiryNotice();
            
            document.getElementById('studentInfoTitle').textContent = '🦋 個人資訊';
            document.getElementById('studentName').value = studentName;
            document.getElementById('studentClass').value = studentClass;
            document.getElementById('studentQuizCode').value = studentQuizCode;
            document.getElementById('confirmStudentInfo').textContent = '更新';
            document.getElementById('cancelEditBtn').classList.remove('hidden');
            document.getElementById('resetBtn').classList.remove('hidden');
            document.getElementById('backFromEditBtn').classList.remove('hidden'); // 顯示返回按鈕
            updatePointsDisplay();
            
            // 找到當前頭像所在的分類並切換到該分類
            let currentCategory = 'animals';
            for (const [category, avatars] of Object.entries(avatarCategories)) {
                if (avatars.includes(studentAvatar)) {
                    currentCategory = category;
                    break;
                }
            }
            
            // 切換到對應分類標籤
            document.querySelectorAll('#avatarTabs button').forEach(btn => {
                btn.classList.remove('bg-purple-500', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
                if (btn.dataset.category === currentCategory) {
                    btn.classList.remove('bg-gray-200', 'text-gray-700');
                    btn.classList.add('bg-purple-500', 'text-white');
                }
            });
            
            // 顯示對應分類的頭像
            showAvatarCategory(currentCategory);
            
            // 等待頭像載入後選中當前頭像
            setTimeout(() => {
                document.querySelectorAll('#avatarSelection button').forEach(btn => {
                    btn.classList.remove('border-purple-500', 'bg-purple-100');
                    btn.classList.add('border-gray-200');
                    if (btn.textContent === studentAvatar) {
                        btn.classList.remove('border-gray-200');
                        btn.classList.add('border-purple-500', 'bg-purple-100');
                    }
                });
            }, 100);
            
            document.getElementById('courseSelection').classList.add('hidden');
            document.getElementById('studentInfo').classList.remove('hidden');
            
            updateHeaderButtonsVisibility();
        }

        // 取消修改
        document.getElementById('cancelEditBtn').onclick = () => {
            document.getElementById('studentInfoTitle').textContent = '個人資訊設定';
            document.getElementById('confirmStudentInfo').textContent = '開始測驗 🚀';
            document.getElementById('cancelEditBtn').classList.add('hidden');
            document.getElementById('resetBtn').classList.add('hidden'); // 隱藏重設按鈕
			document.getElementById('backFromEditBtn').classList.add('hidden');
            
            document.getElementById('studentInfo').classList.add('hidden');
            document.getElementById('courseSelection').classList.remove('hidden');
			

            // 更新頂部按鈕的可見性（包含篩選選單）
            updateHeaderButtonsVisibility();

            // 新增：回到頁面頂端
            window.scrollTo(0, 0);
        };

        // 載入儲存的使用者資訊
        function loadSavedUserInfo() {
            const savedName = localStorage.getItem(`${QUIZ_ID}_studentName`);
            const savedClass = localStorage.getItem(`${QUIZ_ID}_studentClass`);
            const savedAvatar = localStorage.getItem(`${QUIZ_ID}_studentAvatar`);
            const savedQuizCode = localStorage.getItem(`${QUIZ_ID}_studentQuizCode`); // 【新增】

            if (savedName && savedClass && savedAvatar) {
                // 如果有儲存的紀錄，直接登入
                loginUser(savedName, savedClass, savedAvatar, savedQuizCode || ''); // 【修改】
            } else {
                // 如果是第一次來，設定為預設訪客並登入
                loginUser('訪客', '10000', '🐛', ''); // 【修改】
            }
        }


// ========================================
		// 🔧 新增：歷史紀錄刪除自訂選單功能
		// ========================================

		const genericDialog = document.getElementById('genericConfirmDialog');
		const genericDialogContent = document.getElementById('genericConfirmDialogContent');
		const genericDialogTitle = document.getElementById('genericDialogTitle');
		const genericDialogMessage = document.getElementById('genericDialogMessage');
		const genericDialogPasswordWrapper = document.getElementById('genericDialogPasswordWrapper');
		const genericDialogPasswordInput = document.getElementById('genericDialogPasswordInput');
		const genericConfirmBtn = document.getElementById('genericConfirmBtn');
		const genericCancelBtn = document.getElementById('genericCancelBtn');
		let genericConfirmCallback = null;

		// 顯示通用對話框
		// theme: 'danger'（預設，紅色，用於刪除等危險操作）或 'default'（紫色，用於一般確認，如積分兌換）
		// hideCancel: true 時只顯示一個按鈕，當作單純的提示訊息用（取代原生 alert）
		function showGenericConfirm({ title, message, needsPassword, onConfirm, theme = 'danger', confirmText = '確認', hideCancel = false }) {
			genericDialogTitle.textContent = title;
			genericDialogMessage.textContent = message;

			if (theme === 'default') {
				genericDialogTitle.className = 'text-2xl font-bold mb-4';
				genericDialogTitle.style.color = 'var(--color-primary)';
				genericConfirmBtn.className = 'text-white px-8 py-3 rounded-full font-medium transition-colors transform hover:scale-105';
				genericConfirmBtn.style.backgroundColor = 'var(--color-primary)';
				genericConfirmBtn.onmouseenter = () => { genericConfirmBtn.style.backgroundColor = 'var(--color-primary-dark)'; };
				genericConfirmBtn.onmouseleave = () => { genericConfirmBtn.style.backgroundColor = 'var(--color-primary)'; };
			} else {
				genericDialogTitle.className = 'text-2xl font-bold text-red-600 mb-4';
				genericDialogTitle.style.color = '';
				genericConfirmBtn.className = 'bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-medium transition-colors transform hover:scale-105';
				genericConfirmBtn.style.backgroundColor = '';
				genericConfirmBtn.onmouseenter = null;
				genericConfirmBtn.onmouseleave = null;
			}
			genericConfirmBtn.textContent = confirmText;
			genericCancelBtn.classList.toggle('hidden', hideCancel);

			if (needsPassword) {
				genericDialogPasswordWrapper.classList.remove('hidden');
				genericDialogPasswordInput.value = ''; // 清空密碼
			} else {
				genericDialogPasswordWrapper.classList.add('hidden');
			}
			
			genericConfirmCallback = onConfirm;
			
			genericDialog.classList.remove('hidden');
			setTimeout(() => {
				genericDialog.classList.remove('opacity-0');
				genericDialogContent.classList.remove('scale-95', 'opacity-0');
				genericDialogContent.classList.add('scale-100', 'opacity-100');
				if(needsPassword) genericDialogPasswordInput.focus();
			}, 10);
		}

		// 單純的提示訊息（取代原生 alert，只有一個按鈕可以按）
		function showGenericAlert(title, message, theme = 'default') {
			showGenericConfirm({
				title,
				message,
				theme,
				confirmText: '知道了',
				hideCancel: true,
				onConfirm: () => closeGenericDialog()
			});
		}

		// 關閉通用對話框
		function closeGenericDialog() {
			genericDialog.classList.add('opacity-0');
			genericDialogContent.classList.remove('scale-100', 'opacity-100');
			genericDialogContent.classList.add('scale-95', 'opacity-0');
			setTimeout(() => {
				genericDialog.classList.add('hidden');
				genericConfirmCallback = null;
			}, 300);
		}

		// 通用對話框按鈕事件
		genericConfirmBtn.addEventListener('click', () => {
			if (genericConfirmCallback) {
				const password = genericDialogPasswordInput.value;
				genericConfirmCallback(password);
			}
		});
		genericCancelBtn.addEventListener('click', closeGenericDialog);
		genericDialog.addEventListener('click', (e) => {
			if (e.target === genericDialog) {
				closeGenericDialog();
			}
		});


		// 刪除單筆歷史紀錄
		function deleteHistoryRecord(index) {
			showGenericConfirm({
				title: '🗑️ 刪除此筆紀錄？',
				message: '此操作無法復原，確定要刪除嗎？',
				needsPassword: true,
				onConfirm: (password) => {
					if (password && password.toLowerCase() === ADMIN_PASSWORD) {
						const history = getHistory();
						history.splice(index, 1);
						localStorage.setItem(`${QUIZ_ID}_history`, JSON.stringify(history));
						showHistory();
						closeGenericDialog();
					} else {
						alert('密碼錯誤！');
					}
				}
			});
		}

		// 清除未完成紀錄
		document.getElementById('clearIncompleteBtn').onclick = () => {
			showGenericConfirm({
				title: '🗑️ 清除未完成紀錄？',
				message: '將會刪除所有「未完成」的測驗紀錄，此操作無法復原。',
				needsPassword: false,
				onConfirm: () => {
					const history = getHistory();
					const completedHistory = history.filter(record => record.completed);
					localStorage.setItem(`${QUIZ_ID}_history`, JSON.stringify(completedHistory));
					showHistory();
					updateHistoryButtonVisibility();
					closeGenericDialog();
				}
			});
		};

		// 清除所有歷史紀錄
		document.getElementById('clearAllHistoryBtn').onclick = () => {
			showGenericConfirm({
				title: '🗑️ 清除所有歷史紀錄？',
				message: '這將會永久刪除所有的測驗紀錄，此操作無法復原！',
				needsPassword: true,
				onConfirm: (password) => {
					if (password && password.toLowerCase() === ADMIN_PASSWORD) {
						localStorage.removeItem(`${QUIZ_ID}_history`);
						showHistory();
						updateHistoryButtonVisibility();
						closeGenericDialog();
					} else {
						alert('密碼錯誤！');
					}
				}
			});
		};

		// ========================================
		// 🔧 新增：收合/展開頂部標題區塊功能
		// ========================================
		const toggleHeaderBtn = document.getElementById('toggleHeaderBtn');
		const toggleHeaderIcon = document.getElementById('toggleHeaderIcon');
		const headerArea = document.getElementById('headerArea');

		toggleHeaderBtn.addEventListener('click', () => {
			// 切換 headerArea 的 'hidden' class
			headerArea.classList.toggle('hidden');

			// 根據 headerArea 是否可見，來更新按鈕圖示
			if (headerArea.classList.contains('hidden')) {
				toggleHeaderIcon.textContent = 'expand_more'; // 如果已隱藏，顯示向下箭頭
			} else {
				toggleHeaderIcon.textContent = 'expand_less'; // 如果已顯示，顯示向上箭頭
			}
		});


		// 設定網頁圖示 emoji
		function setFavicon(emoji) {
		  const svg = `
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
			  <text y="0.9em" font-size="90">${emoji}</text>
			</svg>`;
		  const url = 'data:image/svg+xml,' + encodeURIComponent(svg);

		  let link = document.querySelector("link[rel='icon']");
		  if (!link) {
			link = document.createElement("link");
			link.rel = "icon";
			document.head.appendChild(link);
		  }
		  link.href = url;
		}
		

		// 顯示成績傳送成功提示
        function showSubmissionSuccessAlert() {
            // 創建提示框元素
            const alertBox = document.createElement('div');
            alertBox.style.position = 'fixed';
            alertBox.style.top = '20px';
            alertBox.style.left = '50%';
            alertBox.style.transform = 'translateX(-50%)';
            alertBox.style.padding = '12px 24px';
            alertBox.style.backgroundColor = '#28a745'; // 綠色背景
            alertBox.style.color = 'white';
            alertBox.style.borderRadius = '8px';
            alertBox.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            alertBox.style.zIndex = '9999';
            alertBox.style.opacity = '0';
            alertBox.style.transition = 'opacity 0.5s ease, top 0.5s ease';
            alertBox.innerHTML = `
                <span style="font-size: 1.2em; margin-right: 8px;">✔️</span>
                <span style="font-weight: bold;">成績已成功傳送給老師！</span>
            `;
            
            // 將提示框加入到 body
            document.body.appendChild(alertBox);
            
            // 觸發顯示動畫
            setTimeout(() => {
                alertBox.style.opacity = '1';
                alertBox.style.top = '40px';
            }, 100);
            
            // 3秒後自動消失
            setTimeout(() => {
                alertBox.style.opacity = '0';
                alertBox.style.top = '20px';
                // 動畫結束後從DOM中移除
                setTimeout(() => {
                    document.body.removeChild(alertBox);
                }, 500);
            }, 3000);
        }

        // 顯示成績傳送失敗提示（例如離線、網路錯誤）
        function showSubmissionFailureAlert() {
            const alertBox = document.createElement('div');
            alertBox.style.position = 'fixed';
            alertBox.style.top = '20px';
            alertBox.style.left = '50%';
            alertBox.style.transform = 'translateX(-50%)';
            alertBox.style.padding = '12px 24px';
            alertBox.style.backgroundColor = '#dc3545'; // 紅色背景
            alertBox.style.color = 'white';
            alertBox.style.borderRadius = '8px';
            alertBox.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            alertBox.style.zIndex = '9999';
            alertBox.style.opacity = '0';
            alertBox.style.transition = 'opacity 0.5s ease, top 0.5s ease';
            alertBox.innerHTML = `
                <span style="font-size: 1.2em; margin-right: 8px;">⚠️</span>
                <span style="font-weight: bold;">成績尚未送出，請確認網路連線，稍後會自動重試</span>
            `;

            document.body.appendChild(alertBox);

            setTimeout(() => {
                alertBox.style.opacity = '1';
                alertBox.style.top = '40px';
            }, 100);

            setTimeout(() => {
                alertBox.style.opacity = '0';
                alertBox.style.top = '20px';
                setTimeout(() => {
                    document.body.removeChild(alertBox);
                }, 500);
            }, 4000);
        }


		// 初始化區塊
		document.addEventListener('DOMContentLoaded', function() {
			document.getElementById('mainTitle').textContent = QUIZ_TITLE;
			setFavicon(QUIZ_EMOJI);
			initStudentInfo();
			
			initCourseSelection();
			
			// 綁定返回按鈕的邏輯
			bindHomeButtons();

			// 綁定分析按鈕點擊事件
			const analysisBtn = document.getElementById('analysisBtn');
			if (analysisBtn) {
				analysisBtn.onclick = () => {
					const modal = document.getElementById('analysisModal');
					modal.classList.remove('hidden');
					// 開啟後自動聚焦輸入框，方便直接貼上
					setTimeout(() => document.getElementById('analysisInput').focus(), 100);
				};
			}

			document.getElementById('resetBtn').onclick = resetToDefaultUser;
			document.getElementById('backFromEditBtn').onclick = () => {
				document.getElementById('cancelEditBtn').click();
			};
			loadSavedUserInfo();
			updateHeaderButtonsVisibility();

			// 頁面載入時，先嘗試補送之前失敗/離線未送出的成績
			resendPendingSubmissions();
			// 網路恢復連線時，也自動嘗試補送
			window.addEventListener('online', resendPendingSubmissions);

			const zhuyinBtn = document.getElementById('zhuyinBtn');
				if (zhuyinMode) {
					// 如果預設開啟，將按鈕變為「啟用狀態」(深色背景)
					zhuyinBtn.classList.add('is-active');
			}


		// ========================================
		// 🔧 新增：測驗模式切換確認功能
		// ========================================
		const quizModeConfirmDialog = document.getElementById('quizModeConfirmDialog');
		const quizModeConfirmDialogContent = document.getElementById('quizModeConfirmDialogContent');
		const confirmQuizModeBtn = document.getElementById('confirmQuizModeBtn');
		const cancelQuizModeBtn = document.getElementById('cancelQuizModeBtn');

		// 顯示確認視窗
		function showQuizModeConfirm() {
			quizModeConfirmDialog.classList.remove('hidden');
			setTimeout(() => {
				quizModeConfirmDialog.classList.remove('opacity-0');
				quizModeConfirmDialogContent.classList.remove('scale-95', 'opacity-0');
				quizModeConfirmDialogContent.classList.add('scale-100', 'opacity-100');
			}, 10);
		}

		// 關閉確認視窗
		function closeQuizModeConfirm() {
			quizModeConfirmDialog.classList.add('opacity-0');
			quizModeConfirmDialogContent.classList.remove('scale-100', 'opacity-100');
			quizModeConfirmDialogContent.classList.add('scale-95', 'opacity-0');
			setTimeout(() => {
				quizModeConfirmDialog.classList.add('hidden');
			}, 300);
		}

		// 執行模式切換 (獨立出來的函式)
		function performModeSwitch(toQuizMode) {
			isQuizMode = toQuizMode;
			updateUrlForQuiz(currentCourseId);
			updateHeaderButtonsVisibility();
			initQuestionNavigation();
			showQuestion();
		}

		// 【修改】切換按鈕點擊事件
		document.getElementById('quizModeToggleBtn').onclick = () => {
			if (!isQuizMode) {
				// 情況 A：目前是練習模式，想轉去測驗 -> 👮 擋下來問問看
				showQuizModeConfirm();
			} else {
				// 情況 B：目前是測驗模式，想轉回練習 -> 🆗 直接切換 (除非已作答被鎖定)
				performModeSwitch(false);
			}
		};

		// 彈窗按鈕：確定切換
		confirmQuizModeBtn.onclick = () => {
			performModeSwitch(true); 
			closeQuizModeConfirm();
		};

		// 彈窗按鈕：取消
		cancelQuizModeBtn.onclick = () => {
			closeQuizModeConfirm();
		};

		// 點擊背景關閉
		quizModeConfirmDialog.addEventListener('click', (e) => {
			if (e.target === quizModeConfirmDialog) {
				closeQuizModeConfirm();
			}
		});

			checkUrlAndLoadQuiz();
		});











// ========================================
// 📊 分析功能邏輯區
// ========================================

// 開啟分析視窗
document.getElementById('analysisBtn').onclick = () => {
    const modal = document.getElementById('analysisModal');
    modal.classList.remove('hidden');
    // 聚焦輸入框
    setTimeout(() => document.getElementById('analysisInput').focus(), 100);
};

// 關閉分析視窗
function closeAnalysisModal() {
    document.getElementById('analysisModal').classList.add('hidden');
}

// 清除輸入
function clearAnalysisInput() {
    document.getElementById('analysisInput').value = '';
    document.getElementById('analysisResultArea').classList.add('hidden');
}

// 執行分析 (核心功能)
// 暫存最後一次分析的資料，供「匯出 CSV」使用
let lastAnalysisRecords = [];
let lastAnalysisCourse = null;

function performAnalysis() {
    const rawInput = document.getElementById('analysisInput').value.trim();
    if (!rawInput) {
        alert('請先貼上資料喔！');
        return;
    }

    // 1. 解析資料
    const lines = rawInput.split('\n');
    const records = [];
    let detectedQuizId = null; 

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        const parts = line.split(/\s+/);
        
        if (parts.length >= 2) {
            const studentId = parts[0];
            const quizId = parts[1];
            const wrongString = parts[2] || ""; 
            const wrongList = wrongString ? wrongString.split(',').map(n => parseInt(n)) : [];

            records.push({ studentId, quizId, wrongList });

            if (!detectedQuizId && quizId) {
                detectedQuizId = quizId;
            }
        }
    });

    if (records.length === 0) {
        alert('無法解析資料，請確認格式是否正確。\n(班號 測驗ID 錯題)');
        return;
    }

    // 2. 獲取題庫資料
    const targetCourse = quizData.find(c => c.id === detectedQuizId);

    if (!targetCourse) {
        alert(`找不到測驗代號 "${detectedQuizId}" 的題目資料。\n請確認 ID 是否正確 (例如: wz01)。`);
        return;
    }

    // 3. 顯示結果區域
    document.getElementById('analysisResultArea').classList.remove('hidden');

    // 記錄這次分析的原始資料，供「匯出 CSV」使用
    lastAnalysisRecords = records;
    lastAnalysisCourse = targetCourse;

    // --- 分析一：錯題排行榜 ---
    renderErrorRanking(records, targetCourse);

    // --- 分析二：學生作答矩陣 ---
    renderStudentMatrix(records, targetCourse);

    // --- 分析三：學生分數趨勢（若資料裡包含多個不同測驗代號才會顯示）---
    renderScoreTrend(records);
}

// 渲染錯題排行榜
function renderErrorRanking(records, course) {
    const errorCounts = {}; // { 題號索引: 錯誤次數 }
    
    // 初始化計數
    for (let i = 0; i < course.questions.length; i++) {
        errorCounts[i] = 0;
    }

    // 統計錯誤
    records.forEach(record => {
        // 只有 ID 符合的才統計，避免混到別的測驗資料
        if (record.quizId === course.id) {
            record.wrongList.forEach(qNum => {
                // 題號轉索引 (第1題 -> index 0)
                const idx = qNum - 1;
                if (errorCounts[idx] !== undefined) {
                    errorCounts[idx]++;
                }
            });
        }
    });

    // 轉換成陣列並排序 (錯誤多的在前面)
    const ranking = Object.keys(errorCounts).map(idx => ({
        index: parseInt(idx),
        count: errorCounts[idx],
        question: course.questions[idx]
    })).sort((a, b) => b.count - a.count);

    const listContainer = document.getElementById('errorRankList');
    listContainer.innerHTML = '';

    // 過濾掉沒有人錯的題目 (如果不希望顯示全對的題目) -> 需求說要「排到沒有錯」，所以全顯
    ranking.forEach((item, rank) => {
        const qNum = item.index + 1;
        // 錯誤率顏色：高(紅) -> 低(綠)
        let barColor = 'bg-green-500';
        let width = '10%'; // 預設最小寬度
        
        if (item.count > 0) {
            const percentage = Math.min((item.count / records.length) * 100, 100);
            width = `${Math.max(percentage, 10)}%`; // 至少顯示一點長度
            
            if (percentage > 60) barColor = 'bg-red-500';
            else if (percentage > 30) barColor = 'bg-orange-500';
            else barColor = 'bg-yellow-500';
        } else {
            barColor = 'bg-gray-300'; // 無人答錯
            width = '0px';
        }

        const div = document.createElement('div');
        div.className = 'flex items-center space-x-3 p-2 hover:bg-red-100 rounded-lg transition-colors cursor-pointer group';
        div.onclick = () => showSingleQuestionDetail(item.question, qNum); // 點擊查看題目

        div.innerHTML = `
            <div class="w-8 h-8 flex items-center justify-center bg-white rounded-full font-bold shadow-sm text-gray-700 flex-shrink-0">
                ${qNum}
            </div>
            <div class="flex-grow">
                <div class="flex justify-between text-sm mb-1">
                    <span class="font-medium text-gray-800 truncate pr-2">${item.question.question}</span>
                    <span class="font-bold ${item.count > 0 ? 'text-red-600' : 'text-gray-400'} flex-shrink-0">${item.count} ✕</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="${barColor} h-full rounded-full transition-all duration-500" style="width: ${width}"></div>
                </div>
            </div>
            <div class="text-gray-400 group-hover:text-red-500">
                <span class="material-icons-outlined">visibility</span>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

// 渲染學生作答矩陣 (修改：支援點擊表頭題號)
function renderStudentMatrix(records, course) { // 參數改為 course
    const thead = document.getElementById('matrixHeader');
    const tbody = document.getElementById('matrixBody');
    const totalQuestions = course.questions.length; // 從 course 取得總題數
    
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // 1. 建立表頭 (改用 DOM 操作以綁定事件)
    
    // (1) 座號欄
    const thStudent = document.createElement('th');
    thStudent.className = 'px-4 py-2 text-left sticky left-0 bg-gray-200 z-10';
    thStudent.textContent = '座號';
    thead.appendChild(thStudent);

    // (2) 題號欄 1~N
    for (let i = 1; i <= totalQuestions; i++) {
        const th = document.createElement('th');
        // 加入 cursor-pointer 和 hover 效果，提示可點擊
        th.className = 'px-2 py-2 text-center text-xs font-bold text-gray-500 cursor-pointer hover:bg-indigo-100 hover:text-indigo-700 transition-colors';
        th.textContent = i;
        th.title = '點擊查看題目'; // 滑鼠移上去的提示
        
        // 【新增】綁定點擊事件：顯示該題詳細內容
        // 索引值 = i - 1
        th.onclick = () => showSingleQuestionDetail(course.questions[i-1], i);
        
        thead.appendChild(th);
    }

    // 2. 建立內容 (這部分維持字串拼接即可，效能較好)
    // 依座號排序
    records.sort((a, b) => parseInt(a.studentId) - parseInt(b.studentId));

    records.forEach(record => {
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';

        // 座號欄
        let rowHtml = `<td class="px-4 py-2 font-bold text-gray-800 sticky left-0 bg-white shadow-sm border-r">${record.studentId}</td>`;

        // 題目欄 (O 或 X)
        for (let i = 1; i <= totalQuestions; i++) {
            const isWrong = record.wrongList.includes(i);
            
            if (isWrong) {
                // 答錯 X
                rowHtml += `<td class="px-1 py-2 text-center"><span class="text-red-500 font-bold">✕</span></td>`;
            } else {
                // 答對 O
                rowHtml += `<td class="px-1 py-2 text-center"><span class="text-green-300">●</span></td>`;
            }
        }
        tr.innerHTML = rowHtml;
        tbody.appendChild(tr);
    });
}

// 顯示單題詳情 (輕量版彈窗)
function showSingleQuestionDetail(qData, qNum) {
    document.getElementById('quickQuestionModal').style.display = 'block';
    document.getElementById('quickQuestionModal').classList.remove('hidden');
    
    document.getElementById('quickQTitle').textContent = `第 ${qNum} 題詳細內容`;
    document.getElementById('quickQContent').textContent = qData.question;
    document.getElementById('quickQExplanation').textContent = qData.explanation || "無解析";

    const optionsContainer = document.getElementById('quickQOptions');
    optionsContainer.innerHTML = '';

    // 判斷是非題
    const isTrueFalse = qData.options[0] === '○' || qData.options[0] === '正确'; // 簡單判斷
    
    if (isTrueFalse) {
         ['○ 正確', '╳ 錯誤'].forEach((text, idx) => {
             const isAns = (idx + 1) === qData.answer;
             const div = document.createElement('div');
             div.className = `p-2 rounded-lg border ${isAns ? 'bg-green-100 border-green-500 text-green-800 font-bold' : 'border-gray-200'}`;
             div.textContent = text + (isAns ? ' (正解)' : '');
             optionsContainer.appendChild(div);
         });
    } else {
        qData.options.forEach((opt, idx) => {
            if (!opt) return;
            const isAns = (idx + 1) === qData.answer;
            const div = document.createElement('div');
            // 正解標示為綠色
            div.className = `p-2 rounded-lg border ${isAns ? 'bg-green-100 border-green-500 text-green-800 font-bold' : 'border-gray-200'}`;
            div.textContent = `${String.fromCharCode(65 + idx)}. ${opt}` + (isAns ? ' (正解)' : '');
            optionsContainer.appendChild(div);
        });
    }
}

function closeQuickQuestionModal() {
    document.getElementById('quickQuestionModal').style.display = 'none';
}

// ========================================
// 📤 匯出 CSV / 列印
// ========================================

// 把一格內容包成合法的 CSV 欄位（處理逗號、換行、雙引號）
function toCsvField(value) {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

// 產生分析結果的表格資料（二維陣列），CSV 與 TAB 純文字共用同一份資料，
// 避免同一份邏輯要維護兩次
function buildAnalysisRows() {
    const course = lastAnalysisCourse;
    const records = lastAnalysisRecords.filter(r => r.quizId === course.id);
    const rows = [];

    // 區塊一：錯題排行榜
    rows.push([`測驗代號：${course.id}`, `測驗名稱：${course.title}`]);
    rows.push([]);
    rows.push(['題號', '題目', '答錯人次']);
    course.questions.forEach((q, idx) => {
        const count = records.reduce((sum, r) => sum + (r.wrongList.includes(idx + 1) ? 1 : 0), 0);
        rows.push([idx + 1, q.question, count]);
    });

    rows.push([]);

    // 區塊二：學生作答矩陣
    const header = ['座號'];
    for (let i = 1; i <= course.questions.length; i++) header.push(`第${i}題`);
    rows.push(header);

    [...records].sort((a, b) => parseInt(a.studentId) - parseInt(b.studentId)).forEach(record => {
        const row = [record.studentId];
        for (let i = 1; i <= course.questions.length; i++) {
            row.push(record.wrongList.includes(i) ? 'X' : 'O');
        }
        rows.push(row);
    });

    return { course, rows };
}

// 觸發瀏覽器下載檔案的共用小工具
function downloadTextFile(content, filename, mimeType) {
    // 加上 UTF-8 BOM，避免 Excel／記事本開啟中文亂碼
    const blob = new Blob(['\uFEFF' + content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function exportAnalysisCSV() {
    if (!lastAnalysisCourse || lastAnalysisRecords.length === 0) {
        alert('請先按「開始分析」產生結果，才能匯出。');
        return;
    }

    const { course, rows } = buildAnalysisRows();
    const csvContent = rows.map(row => row.map(toCsvField).join(',')).join('\r\n');
    downloadTextFile(csvContent, `${course.title}_作答分析.csv`, 'text/csv');
}

// 匯出成 TAB 分隔的純文字檔（.txt），貼到記事本或 Excel 都能直接對齊欄位
function exportAnalysisText() {
    if (!lastAnalysisCourse || lastAnalysisRecords.length === 0) {
        alert('請先按「開始分析」產生結果，才能匯出。');
        return;
    }

    const { course, rows } = buildAnalysisRows();
    // TAB 分隔不需要像 CSV 一樣處理逗號/引號，但欄位裡如果剛好有 TAB 或換行，
    // 還是要換成空白，避免把欄位對齊撐壞
    const sanitize = (value) => String(value ?? '').replace(/[\t\n\r]+/g, ' ');
    const textContent = rows.map(row => row.map(sanitize).join('\t')).join('\r\n');
    downloadTextFile(textContent, `${course.title}_作答分析.txt`, 'text/plain');
}


function printAnalysisResults() {
    if (!lastAnalysisCourse) {
        alert('請先按「開始分析」產生結果，才能列印。');
        return;
    }
    window.print();
}

// ========================================
// 📈 學生跨測驗分數趨勢
// ========================================

// 依 quizData 裡課程出現的順序，當作測驗的時間先後順序
function getStudentScoreTrends(records) {
    const quizOrder = quizData.map(c => c.id);
    const byStudent = {};

    records.forEach(r => {
        const course = quizData.find(c => c.id === r.quizId);
        if (!course || course.questions.length === 0) return;

        const total = course.questions.length;
        const wrongCount = r.wrongList.length;
        const score = Math.round(((total - wrongCount) / total) * 100);

        if (!byStudent[r.studentId]) byStudent[r.studentId] = [];
        // 避免同一位學生、同一場測驗重複貼上造成重複點
        if (byStudent[r.studentId].some(item => item.quizId === r.quizId)) return;

        byStudent[r.studentId].push({ quizId: r.quizId, courseTitle: course.title, score });
    });

    Object.keys(byStudent).forEach(studentId => {
        byStudent[studentId].sort((a, b) => quizOrder.indexOf(a.quizId) - quizOrder.indexOf(b.quizId));
    });

    return byStudent;
}

function renderScoreTrend(records) {
    const trends = getStudentScoreTrends(records);
    const studentIds = Object.keys(trends)
        // 只保留有 2 次以上測驗紀錄的學生，才有「趨勢」可言
        .filter(id => trends[id].length >= 2)
        .sort((a, b) => parseInt(a) - parseInt(b));

    const section = document.getElementById('trendSection');
    const select = document.getElementById('trendStudentSelect');

    if (studentIds.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    select.innerHTML = studentIds.map(id => `<option value="${id}">${id} 號</option>`).join('');
    select.onchange = () => renderTrendChart(trends[select.value]);

    renderTrendChart(trends[studentIds[0]]);
}

function renderTrendChart(data, containerId = 'trendChartContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!data || data.length < 2) {
        container.innerHTML = '<p class="text-gray-400 text-sm text-center py-6">測驗次數不足，還看不出趨勢</p>';
        return;
    }

    const width = 600, height = 200, padLeft = 36, padRight = 20, padTop = 24, padBottom = 34;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;
    const stepX = data.length > 1 ? plotW / (data.length - 1) : 0;

    const points = data.map((d, i) => ({
        x: padLeft + i * stepX,
        y: padTop + plotH - (d.score / 100) * plotH,
        score: d.score,
        title: d.courseTitle
    }));

    const polyline = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const gridLines = [0, 50, 100].map(v => {
        const y = padTop + plotH - (v / 100) * plotH;
        return `<line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>
                 <text x="${padLeft - 8}" y="${y + 4}" font-size="10" text-anchor="end" fill="#94a3b8">${v}</text>`;
    }).join('');

    const dots = points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--color-primary)"></circle>
        <text x="${p.x}" y="${p.y - 10}" font-size="11" text-anchor="middle" font-weight="bold" fill="var(--color-primary-dark)">${p.score}</text>
    `).join('');

    const labels = points.map(p => {
        const shortTitle = p.title.length > 6 ? p.title.slice(0, 6) + '…' : p.title;
        return `<text x="${p.x}" y="${height - 10}" font-size="10" text-anchor="middle" fill="#64748b">${shortTitle}</text>`;
    }).join('');

    container.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto" style="max-height: 220px;">
            ${gridLines}
            <polyline points="${polyline}" fill="none" stroke="var(--color-primary)" stroke-width="2"/>
            ${dots}
            ${labels}
        </svg>
    `;
}