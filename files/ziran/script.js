
        // ========================================
        // 🔧 程式變數區 - 一般情況下不需要修改
        // ========================================
        
        // 全域變數
		let currentCourseId = '';
		let currentCourseTitle = '';
        let currentCourse = '';
        let currentQuestions = [];
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
        
        // 頭像分類
        const avatarCategories = {
            animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦏', '🦛', '🐘', '🦒', '🦘', '🐪', '🐫', '🦙', '🦥', '🦨', '🦡', '🐾'],
            insects: ['🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️', '🦂', '🦟', '🪲', '🪳', '🐚'],
            plants: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🌿', '🍀', '🌱', '🌳', '🌲', '🌴', '🌵', '🌾', '🌿', '☘️', '🍃', '🍂', '🍁', '🌰', '🌱', '🌿', '🌾', '🌻', '🌺', '🌸', '🌼', '🌷', '🌹', '🥀', '🌪️', '🌊'],
            people: ['👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧓', '👴', '👵', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚕️', '👩‍⚕️', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '👨‍🏭', '👩‍🏭', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍🎤', '👩‍🎤', '👨‍🎨', '👩‍🎨', '👨‍✈️', '👩‍✈️', '👨‍🚀', '👩‍🚀', '👨‍🚒', '👩‍🚒', '👮‍♂️', '👮‍♀️', '🕵️‍♂️', '🕵️‍♀️', '💂‍♂️', '💂‍♀️', '👷‍♂️', '👷‍♀️', '🤴', '👸', '👳‍♂️', '👳‍♀️', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅', '🤶', '🦸‍♂️', '🦸‍♀️', '🦹‍♂️', '🦹‍♀️', '🧙‍♂️', '🧙‍♀️', '🧚‍♂️', '🧚‍♀️', '🧛‍♂️', '🧛‍♀️', '🧜‍♂️', '🧜‍♀️', '🧝‍♂️', '🧝‍♀️', '🧞‍♂️', '🧞‍♀️', '🧟‍♂️', '🧟‍♀️'],
            faces: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
            transport: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼', '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️', '🚢', '⛵', '🛶', '🚤', '🛥️', '🛳️', '⛴️', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜'],
            other: ['🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🪨', '🪵', '🛖', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🦽', '🦼', '🛴', '🚲', '🛹', '🛼', '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️', '🚢', '⛵', '🛶', '🚤', '🛥️', '🛳️', '⛴️', '⚓', '⛽', '🚧', '🚨', '🚥', '🚦', '🛑', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏛️', '🏟️', '🏞️', '🏜️', '🏝️', '🏖️', '⛱️', '🏔️', '⛰️', '🌋', '🗻']
        };


function loginUser(name, classNum, avatar, quizCode) {
            studentName = name;
            studentClass = classNum;
            studentAvatar = avatar;
            studentQuizCode = quizCode; // 【新增】

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
            const history = JSON.parse(localStorage.getItem(`${QUIZ_ID}_history`) || '[]');
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
				// 建立分類大區塊
				const categoryBlock = document.createElement('div');
				categoryBlock.className = 'bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300'; 

				// 建立分類標題列 (Header)
                // 修改：加入 cursor-pointer, justify-between, hover效果
				const header = document.createElement('div');
				header.className = 'bg-purple-50 px-6 py-4 border-b border-purple-100 flex items-center justify-between cursor-pointer hover:bg-purple-100 transition-colors select-none';
				
                // 左側標題群組
                const titleGroup = document.createElement('div');
                titleGroup.className = 'flex items-center';

				const titleIcon = document.createElement('span');
				titleIcon.className = 'material-icons-outlined text-purple-600 mr-2';
				titleIcon.textContent = 'folder'; // 資料夾圖示
				
				const title = document.createElement('h2');
				title.className = 'text-lg font-bold text-purple-800'; 
				title.textContent = category;
				
                titleGroup.appendChild(titleIcon);
                titleGroup.appendChild(title);

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
				groupedCourses[category].forEach((course, idx) => {
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
		// 獨立出來的按鈕建立函數，避免程式碼重複
		function createCourseButton(course, index) {
			const button = document.createElement('button');
			button.className = 'bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 text-gray-800 px-4 py-4 rounded-lg font-medium text-base transition-all text-left w-full shadow hover:shadow-md transform hover:scale-102'; 
			
			// 傳入 course.id 來取得數據
			const practiceCount = getPracticeCount(course.id);
			const avgScore = getAverageScore(course.id);
			const starColor = getStarColor(avgScore);
			
			button.innerHTML = `
				<div class="flex justify-between items-center">
					<div class="text-lg text-black">${index + 1}. ${course.title}</div>
					<div class="flex items-center space-x-2">
						<button class="text-xl ${starColor} hover:scale-110 transition-transform" onclick="event.stopPropagation(); showCourseStats('${course.id}', '${course.title}', ${avgScore})" title="點擊查看練習紀錄">${practiceCount > 0 ? '★' : '☆'}</button>
						<span class="text-base font-medium text-black">${practiceCount}</span>
					</div>
				</div>
			`;
			button.onclick = () => startQuiz(course.id);
			return button;
		}

        // 計算練習次數（只計算完成的）
		function getPracticeCount(courseId) {
			const history = JSON.parse(localStorage.getItem(`${QUIZ_ID}_history`) || '[]');
			// 檢查 record.courseId
			return history.filter(record => record.courseId === courseId && record.completed).length;
		}

        // 計算平均成績
		function getAverageScore(courseId) {
			const history = JSON.parse(localStorage.getItem(`${QUIZ_ID}_history`) || '[]');
			const completedRecords = history.filter(record => record.courseId === courseId && record.completed);
			if (completedRecords.length === 0) return 0;
			
			const totalScore = completedRecords.reduce((sum, record) => sum + record.score, 0);
			return Math.round(totalScore / completedRecords.length);
		}

        // 根據成績決定星號顏色
        function getStarColor(score) {
            if (score >= 90) return 'text-yellow-500'; // 黃色
            if (score >= 80) return 'text-blue-500';   // 藍色
            if (score >= 70) return 'text-green-500';  // 綠色
            if (score >= 60) return 'text-gray-500';   // 灰色
            return 'text-black';                       // 黑色
        }

		// 顯示課程統計 (接收 ID 和 Title)
		function showCourseStats(courseId, courseTitle, avgScore) {
            // 1. 取得該課程的所有歷史紀錄
            const history = JSON.parse(localStorage.getItem(`${QUIZ_ID}_history`) || '[]');
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

			// 生成星星 (邏輯保持不變，依照傳入的平均分 avgScore 繪製)
            // 這樣雖然不顯示平均分數字，但星星依然代表整體實力
			let starsHtml = '';
			const starClass = 'text-3xl text-yellow-400 drop-shadow-sm material-icons'; 
			const emptyStarClass = 'text-3xl text-gray-200 material-icons'; 
			
			const starCount = Math.floor(avgScore / 20);
			const hasHalfStar = (avgScore % 20) >= 10;

			if (practiceCount === 0) {
				for(let i=0; i<5; i++) starsHtml += `<span class="${emptyStarClass}">star</span>`;
			} else {
				for (let i = 0; i < starCount; i++) {
					starsHtml += `<span class="${starClass}">star</span>`;
				}
				if (hasHalfStar && starCount < 5) {
					starsHtml += `<span class="${starClass}">star_half</span>`;
				}
				const filledStars = starCount + (hasHalfStar ? 1 : 0);
				for (let i = filledStars; i < 5; i++) {
					starsHtml += `<span class="${emptyStarClass}">star</span>`;
				}
			}
			document.getElementById('statsModalStars').innerHTML = starsHtml;

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
            
            const isAtCourseSelectionScreen = !document.getElementById('courseSelection').classList.contains('hidden');
            const isInQuiz = !document.getElementById('quizArea').classList.contains('hidden');
            const isSignedIn = !document.getElementById('studentInfo').classList.contains('hidden');

            // 1. 歷史紀錄按鈕
            if (isAtCourseSelectionScreen && hasHistory() && !isSignedIn) {
                historyBtn.style.display = 'block';
            } else {
                historyBtn.style.display = 'none';
            }

            // 2. 測驗模式按鈕 & 終止測驗按鈕
            if (isInQuiz) {
                quizModeBtn.classList.remove('hidden');
                
                // 檢查是否已經開始作答
                const hasStartedAnswering = Object.keys(userAnswers).length > 0;

                if (isQuizMode) {
                    // ★ 測驗模式下：
                    quizModeBtn.classList.remove('bg-white', 'text-gray-600', 'border-gray-300', 'hover:bg-gray-50');
                    quizModeBtn.classList.add('bg-purple-600', 'text-white', 'border-purple-600');
                    quizModeBtn.innerHTML = '<span class="material-icons-outlined text-base">assignment_turned_in</span><span>測驗中</span>';
                    // 測驗模式原本就鎖定，這裡維持不變
                    quizModeBtn.style.pointerEvents = 'none'; 

                    // X 按鈕：【隱藏】
                    exitQuizBtn.classList.add('hidden');
                } else {
                    // ★ 練習模式下：
                    quizModeBtn.classList.remove('bg-purple-600', 'text-white', 'border-purple-600');
                    quizModeBtn.classList.add('bg-white', 'text-gray-600', 'border-gray-300', 'hover:bg-gray-50');
                    quizModeBtn.innerHTML = '<span class="material-icons-outlined text-base">assignment</span><span>練習</span>';
                    
                    // 【修改重點】：如果已經開始作答，就鎖定按鈕；否則允許點擊
                    if (hasStartedAnswering) {
                        quizModeBtn.style.pointerEvents = 'none'; // 禁止點擊
                        quizModeBtn.classList.add('opacity-50', 'cursor-not-allowed'); // 變淡、滑鼠變禁止符號
                        quizModeBtn.title = "作答中無法切換模式";
                    } else {
                        quizModeBtn.style.pointerEvents = 'auto'; // 允許點擊
                        quizModeBtn.classList.remove('opacity-50', 'cursor-not-allowed'); // 恢復原狀
                        quizModeBtn.title = "切換至測驗模式";
                    }

                    // X 按鈕：顯示
                    exitQuizBtn.classList.remove('hidden', 'bg-gray-200', 'text-gray-400', 'hover:bg-gray-300');
                    exitQuizBtn.classList.add('bg-red-500', 'hover:bg-red-600', 'text-white');
                }
            } else {
                quizModeBtn.classList.add('hidden');
                exitQuizBtn.classList.add('hidden');
            }
        }
		// 開始測驗
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
		}

		// 統一的返回首頁 UI 處理函式
		function returnToHomeUI() {
			isReviewMode = false;
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
		function saveHistory(score, completed = true) {
			const endTime = new Date();
			const history = JSON.parse(localStorage.getItem(`${QUIZ_ID}_history`) || '[]');
			
			const record = {
				studentName: studentName,
				studentAvatar: studentAvatar,
				courseId: currentCourseId,
				courseTitle: currentCourseTitle,
				startTime: startTime.toISOString(),
				endTime: endTime.toISOString(),
				score: completed ? score : null,
				completed: completed
			};
			
			history.unshift(record); // 最新的在前面
			localStorage.setItem(`${QUIZ_ID}_history`, JSON.stringify(history));
		}

		function cleanExpiredHistory() {
            const history = JSON.parse(localStorage.getItem(`${QUIZ_ID}_history`) || '[]');
            
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
            const history = JSON.parse(localStorage.getItem(`${QUIZ_ID}_history`) || '[]');
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
		function showHistory() {
			const history = JSON.parse(localStorage.getItem(`${QUIZ_ID}_history`) || '[]');
			const historyList = document.getElementById('historyList');
			
			if (history.length === 0) {
				historyList.innerHTML = '<p class="text-center text-gray-600">尚無測驗紀錄</p>';
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
					
					return `
						<div class="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
							<div class="flex items-center space-x-3 flex-1">
								<span class="text-2xl">${displayAvatar}</span>
								<span class="font-medium">${displayName}</span>
								<span class="text-gray-600">${displayTitle}</span>
								<span class="text-sm ${record.completed ? 'text-green-600' : 'text-red-600'}">
									${record.completed ? `得分 ${record.score}` : '未完成'}
								</span>
								<span class="text-sm text-gray-500">${startStr} - ${endStr}</span>
							</div>
							<button onclick="deleteHistoryRecord(${index})" class="bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full text-xs font-bold transition-colors">
								✕
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
            
            const question = currentQuestions[currentQuestionIndex];
            const isTrue = question.option1 === '○' && question.option2 === '╳';
            
            // 標題顯示邏輯
            if (isReviewMode) {
                document.getElementById('questionTitle').textContent = `錯題 ${currentQuestionIndex + 1}`;
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
            // 交卷後，自動結束測驗模式
            if (isQuizMode) {
                isQuizMode = false;
                // 更新網址，移除 ?mode=quiz 參數，變回一般狀態
                updateUrlForQuiz(currentCourseId);
            }

            const total = currentQuestions.length;
            const answered = Object.keys(userAnswers).length;
            let correct = 0;
            
            // 【新增】收集錯題題號的陣列
            let wrongQuestionsList = [];
            
            currentQuestions.forEach((question, index) => {
                if (userAnswers[index] === question.correctAnswer) {
                    correct++;
                } else {
                    // 【新增】答錯或未作答，將「題號」(index+1) 加入陣列
                    wrongQuestionsList.push(index + 1);
                }
            });
            
            const wrong = answered - correct;
            const percentage = Math.round((correct / total) * 100);
            
            // 【新增】將錯題陣列轉為字串 (例如 "2,5,8")
            const wrongString = wrongQuestionsList.join(',');

            // 儲存歷史紀錄
            saveHistory(percentage, true);
            
            // 自動傳送成績到Google表單 (如果啟用且測驗代碼正確)
            if (ENABLE_GOOGLE_FORM_SUBMIT && studentQuizCode === QUIZ_CODE) {
                // 【修改】傳入新增的參數：ID, 標題, 錯題字串
                sendScoreToGoogleForm(
                    studentName, 
                    studentClass, 
                    percentage, 
                    studentQuizCode,
                    currentCourseId,     // 新增
                    currentCourseTitle,  // 新增
                    wrongString          // 新增
                );
                showSubmissionSuccessAlert(); 
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
            document.getElementById('correctCount').textContent = correct;
            document.getElementById('wrongCount').textContent = wrong;
            document.getElementById('totalCount').textContent = total;
            
            document.getElementById('quizArea').classList.add('hidden');
            document.getElementById('exitQuizBtn').classList.add('hidden');
            document.getElementById('resultArea').classList.remove('hidden');

            // 重新更新頂部按鈕狀態
            updateHeaderButtonsVisibility();
        }
        
        // 傳送成績到Google表單
        function sendScoreToGoogleForm(name, classNum, score, quizCode, courseId, courseTitle, wrongList) {
            try {
                // 要送的資料
                const formData = new URLSearchParams();
                formData.append(GOOGLE_FORM_CONFIG.nameField, name);
                formData.append(GOOGLE_FORM_CONFIG.classField, classNum);
                formData.append(GOOGLE_FORM_CONFIG.scoreField, score);
                
                // 如果您 settings.js 有設定 quizCodeField，請解開下面這行
                // if (GOOGLE_FORM_CONFIG.quizCodeField) formData.append(GOOGLE_FORM_CONFIG.quizCodeField, quizCode);

                // 傳送 測驗ID
                if (GOOGLE_FORM_CONFIG.idField) {
                    formData.append(GOOGLE_FORM_CONFIG.idField, courseId);
                }

                // 傳送 測驗標題
                if (GOOGLE_FORM_CONFIG.titleField) {
                    formData.append(GOOGLE_FORM_CONFIG.titleField, courseTitle);
                }

                // 傳送 錯題列表
                if (GOOGLE_FORM_CONFIG.wrongField) {
                    // 如果沒有錯題 (空字串)，傳送 "無" 以便閱讀
                    const finalWrongText = wrongList === "" ? "" : wrongList;
                    formData.append(GOOGLE_FORM_CONFIG.wrongField, finalWrongText);
                }

                // 自動送出
                fetch(GOOGLE_FORM_CONFIG.formUrl, {
                    method: "POST",
                    mode: "no-cors",
                    body: formData
                }).then(() => {
                    console.log('成績傳送完成');
                }).catch(error => {
                    console.log('成績傳送發生錯誤 (但不影響作答結果)');
                });
            } catch (error) {
                console.log('成績傳送過程中發生錯誤');
            }
        }

        // 檢視錯題
        document.getElementById('reviewBtn').onclick = () => {
            showWrongQuestions();
        };

        // 顯示錯題

        function showWrongQuestions() {
            // 1. 篩選出錯誤的題目
            const wrongQs = [];
            const reviewAnswers = {}; // 建立一個新的答案對應表，讓介面顯示紅/綠框

            currentQuestions.forEach((q, originalIndex) => {
                const userAns = userAnswers[originalIndex];
                // 判斷是否答錯 (有作答且答案不正確)
                if (userAns !== undefined && userAns !== q.correctAnswer) {
                    wrongQs.push(q);
                    // 在新的錯題列表中，這題是第幾題 (索引)，並填入使用者原本的錯誤答案
                    // 這樣 showQuestion 就會以為這題已經作答過，直接顯示解析與紅框
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
            document.getElementById('resultArea').classList.add('hidden'); // 隱藏成績單
            document.getElementById('quizArea').classList.remove('hidden'); // 顯示測驗區
            document.getElementById('exitQuizBtn').classList.add('hidden'); // 複習時不顯示右上角叉叉，避免誤觸

            // 修改標題
            document.getElementById('mainTitle').textContent = '📝 錯題檢視';

            // 5. 初始化題目介面
            initQuestionNavigation();
            showQuestion();
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

		function startReading() {
			// 如果解析正在朗讀，就先停止它
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

			const encodedText = encodeURIComponent(textToRead);
			const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-tw&client=tw-ob&q=${encodedText}`;

			currentAudio = new Audio(audioUrl);
			currentAudio.onended = () => {
				stopReading();
			};
			currentAudio.onerror = () => {
				stopReading();
				alert('朗讀功能暫時無法使用');
			};

			currentAudio.play();
			isReading = true;

			const btn = document.getElementById('readBtn');
			btn.innerHTML = '<span class="material-icons-outlined">stop</span>';
			btn.classList.remove('bg-green-100', 'text-green-700');
			btn.classList.add('bg-red-100', 'text-red-700');
		}

        function stopReading() {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }
            isReading = false;
            
            const btn = document.getElementById('readBtn');
            btn.innerHTML = '<span class="material-icons-outlined">volume_up</span>';
            btn.classList.remove('bg-red-100', 'text-red-700');
            btn.classList.add('bg-green-100', 'text-green-700');
        }
        
        // 開始朗讀解析
		function startExplanationReading() {
			// 如果題目正在朗讀，就先停止它
			if (isReading) {
				stopReading();
			}

			const explanationText = document.getElementById('explanationText').textContent;

			const encodedText = encodeURIComponent(explanationText);
			const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-tw&client=tw-ob&q=${encodedText}`;

			currentExplanationAudio = new Audio(audioUrl);
			currentExplanationAudio.onended = () => {
				stopExplanationReading();
			};
			currentExplanationAudio.onerror = () => {
				stopExplanationReading();
				alert('朗讀功能暫時無法使用');
			};

			currentExplanationAudio.play();

			const btn = document.getElementById('readExplanationBtn');
			btn.innerHTML = '<span class="material-icons-outlined">stop</span>';
			btn.classList.remove('bg-green-100', 'text-green-700');
			btn.classList.add('bg-red-100', 'text-red-700');
		}
        
        // 停止朗讀解析
        function stopExplanationReading() {
            if (currentExplanationAudio) {
                currentExplanationAudio.pause();
                currentExplanationAudio = null;
            }
            
            const btn = document.getElementById('readExplanationBtn');
            btn.innerHTML = '<span class="material-icons-outlined">volume_up</span>';
            btn.classList.remove('bg-red-100', 'text-red-700');
            btn.classList.add('bg-green-100', 'text-green-700');
        }

        // 注音模式切換
        document.getElementById('zhuyinBtn').onclick = () => {
            zhuyinMode = !zhuyinMode;
            const btn = document.getElementById('zhuyinBtn');
            if (zhuyinMode) {
                btn.classList.remove('bg-blue-100', 'text-blue-700');
                btn.classList.add('bg-blue-500', 'text-white');
            } else {
                btn.classList.remove('bg-blue-500', 'text-white');
                btn.classList.add('bg-blue-100', 'text-blue-700');
            }
            showQuestion(); // 重新顯示題目以應用字體
        };

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
            const btn = document.getElementById('layoutBtn');
            if (layoutMode === 'grid') {
                btn.textContent = '⚏';
                btn.title = '左右排版';
            } else {
                btn.textContent = '☰';
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
            
            // 監聽名字和班號輸入
            document.getElementById('studentName').addEventListener('input', checkStudentInfo);
            document.getElementById('studentClass').addEventListener('input', checkStudentInfo);
            document.getElementById('studentQuizCode').addEventListener('input', checkStudentInfo); // 【新增】
        }
        
        // 顯示指定分類的頭像
        function showAvatarCategory(category) {
            const avatarSelection = document.getElementById('avatarSelection');
            avatarSelection.innerHTML = '';
            
            const avatars = avatarCategories[category] || [];
            avatars.forEach(avatar => {
                const button = document.createElement('button');
                button.className = 'text-xl p-1 rounded-lg border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all';
                button.textContent = avatar;
                button.onclick = () => selectAvatar(avatar, button);
                avatarSelection.appendChild(button);
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
            
            document.getElementById('studentInfoTitle').textContent = '🦋 個人資訊';
            document.getElementById('studentName').value = studentName;
            document.getElementById('studentClass').value = studentClass;
            document.getElementById('studentQuizCode').value = studentQuizCode;
            document.getElementById('confirmStudentInfo').textContent = '更新';
            document.getElementById('cancelEditBtn').classList.remove('hidden');
            document.getElementById('resetBtn').classList.remove('hidden');
            document.getElementById('backFromEditBtn').classList.remove('hidden'); // 顯示返回按鈕
            
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
		function showGenericConfirm({ title, message, needsPassword, onConfirm }) {
			genericDialogTitle.textContent = title;
			genericDialogMessage.textContent = message;
			
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
						const history = JSON.parse(localStorage.getItem(`${QUIZ_ID}_history`) || '[]');
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
					const history = JSON.parse(localStorage.getItem(`${QUIZ_ID}_history`) || '[]');
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

			const zhuyinBtn = document.getElementById('zhuyinBtn');
				if (zhuyinMode) {
					// 如果預設開啟，將按鈕變為「啟用狀態」(深色背景)
					zhuyinBtn.classList.remove('bg-blue-100', 'text-blue-700');
					zhuyinBtn.classList.add('bg-blue-500', 'text-white');
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
function performAnalysis() {
    const rawInput = document.getElementById('analysisInput').value.trim();
    if (!rawInput) {
        alert('請先貼上資料喔！');
        return;
    }

    // 1. 解析資料
    const lines = rawInput.split('\n');
    const records = [];
    let detectedQuizId = null; // 自動偵測測驗ID

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        // 使用正則表達式分割，支援 Tab 或 空格
        const parts = line.split(/\s+/);
        
        // 格式：班號(0) ID(1) 錯題(2,可選)
        if (parts.length >= 2) {
            const studentId = parts[0];
            const quizId = parts[1];
            // 如果 parts[2] 存在，則分割逗號；如果不存在(全對)，則是空陣列
            const wrongString = parts[2] || ""; 
            const wrongList = wrongString ? wrongString.split(',').map(n => parseInt(n)) : [];

            records.push({ studentId, quizId, wrongList });

            // 抓取第一個有效的 Quiz ID
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
    // 假設所有資料都是針對同一個測驗 (取第一個偵測到的 ID)
    const targetCourse = quizData.find(c => c.id === detectedQuizId);

    if (!targetCourse) {
        alert(`找不到測驗代號 "${detectedQuizId}" 的題目資料。\n請確認 ID 是否正確 (例如: wz01)。`);
        return;
    }

    const totalQuestions = targetCourse.questions.length;

    // 3. 顯示結果區域
    document.getElementById('analysisResultArea').classList.remove('hidden');

    // --- 分析一：錯題排行榜 ---
    renderErrorRanking(records, targetCourse);

    // --- 分析二：學生作答矩陣 ---
    renderStudentMatrix(records, totalQuestions);
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
                    <span class="font-bold ${item.count > 0 ? 'text-red-600' : 'text-gray-400'} flex-shrink-0">${item.count} 人錯</span>
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

// 渲染學生作答矩陣
function renderStudentMatrix(records, totalQuestions) {
    const thead = document.getElementById('matrixHeader');
    const tbody = document.getElementById('matrixBody');
    
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // 1. 建立表頭 (座號 + 題號 1~N)
    let headerHtml = '<th class="px-4 py-2 text-left sticky left-0 bg-gray-200 z-10">座號</th>';
    for (let i = 1; i <= totalQuestions; i++) {
        headerHtml += `<th class="px-2 py-2 text-center text-xs font-bold text-gray-500">${i}</th>`;
    }
    thead.innerHTML = headerHtml;

    // 2. 建立內容
    // 依座號排序 (假設座號是數字)
    records.sort((a, b) => parseInt(a.studentId) - parseInt(b.studentId));

    records.forEach(record => {
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-gray-50';

        // 座號欄
        let rowHtml = `<td class="px-4 py-2 font-bold text-gray-800 sticky left-0 bg-white shadow-sm border-r">${record.studentId}</td>`;

        // 題目欄 (O 或 X)
        for (let i = 1; i <= totalQuestions; i++) {
            // 檢查該題號是否在錯題列表中
            const isWrong = record.wrongList.includes(i);
            
            if (isWrong) {
                // 答錯 X (紅色)
                rowHtml += `<td class="px-1 py-2 text-center"><span class="text-red-500 font-bold">✕</span></td>`;
            } else {
                // 答對 O (綠色點點，視覺比較不雜亂)
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