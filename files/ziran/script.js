        // ========================================
        // 📚 測驗資料區 - 修改題目內容時請修改此區域
        // ========================================

        // 解析資料
        function parseData(data) {
            const lines = data.trim().split('\n');
            const questions = [];
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim(); // 清除行首行尾空白
                if (!line) continue; // 跳過空行
                
                const parts = line.split('\t');
                if (parts.length >= 7) {
                    const question = {
                        course: parts[0].trim(),
                        question: parts[1].trim(),
                        option1: parts[2].trim(),
                        option2: parts[3].trim(),
                        option3: parts[4].trim(),
                        option4: parts[5].trim(),
                        correctAnswer: parseInt(parts[6]),
                        explanation: (parts[7] || "").trim() // 【修改】避免 undefined 錯誤
                    };
                    questions.push(question);
                }
            }
            return questions;
        }

        // ========================================
        // 🔧 程式變數區 - 一般情況下不需要修改
        // ========================================
        
        // 全域變數
        let allQuestions = parseData(myData);
        let currentCourse = '';
        let currentQuestions = [];
        let currentQuestionIndex = 0;
        let userAnswers = {};
        let showingExplanation = false;
        let startTime = null;
        let zhuyinMode = false;
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
		let currentFilter = 'all';  // 用於儲存當前的篩選條件
		
        let isReviewMode = false;
        let originalQuestionsBackup = []; // 備份原始題目
        let originalAnswersBackup = {};   // 備份原始答案
        
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
            const courses = [...new Set(allQuestions.map(q => q.course))];
            return courses;
        }

		// 初始化課別選單
		function initCourseSelection() {
			const allCourses = getCourses();
			let filteredCourses;

			// 根據 currentFilter 變數篩選課程
			if (currentFilter === 'all') {
				filteredCourses = allCourses;
			} else {
				filteredCourses = allCourses.filter(course => course.startsWith(currentFilter));
			}

			const courseSelectionDiv = document.getElementById('courseSelection');
			const courseButtonsContainer = document.getElementById('courseButtons');
			courseButtonsContainer.innerHTML = ''; // 清空現有內容

			// 當篩選為「全部」時，將課程分組到不同的大區塊
			if (currentFilter === 'all') {
				// 移除外層容器的白色卡片樣式，因為每個分類區塊將自帶樣式
				courseSelectionDiv.className = 'mb-6';
				// 如果 courseSelectionDiv 之前是隱藏的，保持隱藏狀態
				if (!document.querySelector('#studentInfo').classList.contains('hidden') || !document.querySelector('#quizArea').classList.contains('hidden')) {
    				if (!courseSelectionDiv.classList.contains('hidden')) {
        				courseSelectionDiv.classList.add('hidden');
    				}
				}


				// 讓容器改為垂直堆疊各個分類區塊
				courseButtonsContainer.className = 'space-y-4'; // 調整分類區塊間距

				// 將課程按分類進行分組
				const groupedCourses = filteredCourses.reduce((acc, course) => {
					const category = course.split(' ')[0];
					if (!acc[category]) {
						acc[category] = [];
					}
					acc[category].push(course);
					return acc;
				}, {});

				// 為每個分類建立一個獨立的、帶樣式的大區塊
				Object.keys(groupedCourses).forEach(category => {
					const categoryBlock = document.createElement('div');
					// 調整大區塊的陰影和內邊距
					categoryBlock.className = 'bg-white rounded-xl shadow p-4'; 

					const title = document.createElement('h2');
					// 調整標題文字大小
					title.className = 'text-xl font-bold text-purple-700 mb-3'; 
					title.textContent = category;
					categoryBlock.appendChild(title);

					const gridContainer = document.createElement('div');
					// 調整網格佈局，小螢幕 1 欄，中螢幕 2 欄，大螢幕 3 欄
					gridContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'; 

					groupedCourses[category].forEach((course, index) => {
						const button = document.createElement('button');
						// 調整卡片按鈕的內邊距和陰影
						button.className = 'bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 text-gray-800 px-4 py-4 rounded-lg font-medium text-base transition-all text-left w-full shadow hover:shadow-md transform hover:scale-102'; 
						
						const practiceCount = getPracticeCount(course);
						const avgScore = getAverageScore(course);
						const starColor = getStarColor(avgScore);
						
						button.innerHTML = `
							<div class="flex justify-between items-center">
								<div class="text-lg text-black">${index + 1}. ${course}</div>
								<div class="flex items-center space-x-2">
									<button class="text-xl ${starColor} hover:scale-110 transition-transform" onclick="event.stopPropagation(); showCourseStats('${course}', ${avgScore})" title="點擊查看練習紀錄">${practiceCount > 0 ? '★' : '☆'}</button>
									<span class="text-base font-medium text-black">${practiceCount}</span>
								</div>
							</div>
						`;
						button.onclick = () => startQuiz(course);
						gridContainer.appendChild(button);
					});

					categoryBlock.appendChild(gridContainer);
					courseButtonsContainer.appendChild(categoryBlock);
				});

			} else {
				// 如果是特定篩選，則恢復成原本的單一大區塊佈局
				// 恢復外層容器的樣式
				// 調整大區塊的陰影和內邊距
				courseSelectionDiv.className = 'bg-white rounded-xl shadow p-4 mb-6'; 
				// 如果 courseSelectionDiv 之前是隱藏的，保持隱藏狀態
				if (!document.querySelector('#studentInfo').classList.contains('hidden') || !document.querySelector('#quizArea').classList.contains('hidden')) {
    				if (!courseSelectionDiv.classList.contains('hidden')) {
        				courseSelectionDiv.classList.add('hidden');
    				}
				}


				// 調整網格佈局，小螢幕 1 欄，中螢幕 2 欄，大螢幕 3 欄
				courseButtonsContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'; 

				filteredCourses.forEach((course, index) => {
					const button = document.createElement('button');
					// 調整卡片按鈕的內邊距和陰影
					button.className = 'bg-gradient-to-r from-purple-100 to-blue-100 hover:from-purple-200 hover:to-blue-200 text-gray-800 px-4 py-4 rounded-lg font-medium text-base transition-all text-left w-full shadow hover:shadow-md transform hover:scale-102'; 
					
					const practiceCount = getPracticeCount(course);
					const avgScore = getAverageScore(course);
					const starColor = getStarColor(avgScore);
					
					button.innerHTML = `
						<div class="flex justify-between items-center">
							<div class="text-lg text-black">${index + 1}. ${course}</div>
							<div class="flex items-center space-x-2">
								<button class="text-xl ${starColor} hover:scale-110 transition-transform" onclick="event.stopPropagation(); showCourseStats('${course}', ${avgScore})" title="點擊查看練習紀錄">${practiceCount > 0 ? '★' : '☆'}</button>
								<span class="text-base font-medium text-black">${practiceCount}</span>
							</div>
						</div>
					`;
					button.onclick = () => startQuiz(course);
					courseButtonsContainer.appendChild(button);
				});
			}
		}


        // 計算練習次數（只計算完成的）
        function getPracticeCount(course) {
            const history = JSON.parse(localStorage.getItem(`${QUIZ_ID}_history`) || '[]');
            return history.filter(record => record.course === course && record.completed).length;
        }

        // 計算平均成績
        function getAverageScore(course) {
            const history = JSON.parse(localStorage.getItem(`${QUIZ_ID}_history`) || '[]');
            const completedRecords = history.filter(record => record.course === course && record.completed);
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

        // 顯示課程統計
        function showCourseStats(course, avgScore) {
            const practiceCount = getPracticeCount(course);
            
            // 設定標題
            document.getElementById('statsModalTitle').textContent = course;
            document.getElementById('statsModalScore').textContent = avgScore;
            document.getElementById('statsModalCount').textContent = practiceCount;

            // 生成星星
            let starsHtml = '';
            const starClass = 'text-3xl text-yellow-400 drop-shadow-sm material-icons'; // 星星樣式
            const emptyStarClass = 'text-3xl text-gray-200 material-icons'; // 空星星樣式
            
            // 計算星星數量 (每20分一顆星)
            const starCount = Math.floor(avgScore / 20);
            const hasHalfStar = (avgScore % 20) >= 10;

            if (practiceCount === 0) {
                // 如果沒練習過，顯示5顆灰星星
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

            // 設定評語
            const commentEl = document.getElementById('statsModalComment');
            if (practiceCount === 0) {
                commentEl.textContent = "還沒有練習紀錄，趕快開始挑戰吧！💪";
                commentEl.className = "text-gray-500 font-medium text-sm";
            } else if (avgScore >= 95) {
                commentEl.textContent = "太神了！你是這個單元的專家！👑";
                commentEl.className = "text-purple-600 font-bold text-sm";
            } else if (avgScore >= 80) {
                commentEl.textContent = "表現很棒喔！繼續保持！🌟";
                commentEl.className = "text-green-600 font-bold text-sm";
            } else if (avgScore >= 60) {
                commentEl.textContent = "通過了！再多練習幾次會更強喔！📚";
                commentEl.className = "text-blue-600 font-bold text-sm";
            } else {
                commentEl.textContent = "別灰心，多練習幾次一定會進步的！🌱";
                commentEl.className = "text-orange-500 font-bold text-sm";
            }

            // 顯示彈窗 (移除 hidden)
            const modal = document.getElementById('statsModal');
            modal.classList.remove('hidden');
            
            // 簡單的進場動畫
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
		// 🔧 以下為新增的篩選功能函式
		// ========================================

		// 從所有題目中，取得可篩選的課別分類
		function getFilterCategories() {
			const categories = new Set();
			allQuestions.forEach(q => {
				// 依照空格分割課別，並取第一部分作為分類詞
				const category = q.course.split(' ')[0];
				categories.add(category);
			});
			// 回傳一個陣列，包含 'all' (全部) 以及所有分類詞
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
			const filterContainer = document.getElementById('filterContainer');
			
			// 判斷當前是否在主選單頁面
			const isAtCourseSelectionScreen = 
				!document.getElementById('courseSelection').classList.contains('hidden') && 
				 document.getElementById('quizArea').classList.contains('hidden');
			
			// 判斷是否已登入 (避免在輸入姓名時就顯示)
			const isSignedIn = !document.getElementById('studentInfo').classList.contains('hidden');

			// 歷史紀錄按鈕邏輯
			if (isAtCourseSelectionScreen && hasHistory() && !isSignedIn) {
				historyBtn.style.display = 'block';
			} else {
				historyBtn.style.display = 'none';
			}

			// 篩選按鈕邏輯：只在主選單頁面顯示
			if (isAtCourseSelectionScreen && !isSignedIn) {
				filterContainer.classList.remove('hidden');
			} else {
				filterContainer.classList.add('hidden');
			}
		}


		// 開始測驗
		function startQuiz(course) {
			currentCourse = course;
			currentQuestions = allQuestions.filter(q => q.course === course);
			currentQuestionIndex = 0;
			userAnswers = {};
			showingExplanation = false;
			startTime = new Date();
			
			// 清理過期紀錄
			cleanExpiredHistory();
			
			// 更新標題為單元名稱
			document.getElementById('mainTitle').textContent = `📚 ${course}`;
			
			// 禁用右上角個人資訊點擊
			document.getElementById('userInfo').style.cursor = 'default';
			document.getElementById('userInfo').onclick = null;
			
			// --- 修改重點：先切換頁面，再更新按鈕 ---
			// 1. 先隱藏課程選單，並顯示測驗區域
			document.getElementById('courseSelection').classList.add('hidden');
			document.getElementById('quizArea').classList.remove('hidden');
			document.getElementById('resultArea').classList.add('hidden');
			document.getElementById('reviewArea').classList.add('hidden');
			document.getElementById('historyArea').classList.add('hidden');
			document.getElementById('exitQuizBtn').classList.remove('hidden');
			
			// 2. 然後才根據新的頁面狀態，更新頂部按鈕的可見性
			updateHeaderButtonsVisibility();
			// --- 修改結束 ---
			
			initQuestionNavigation();
			showQuestion();
			updateProgress();
		}



        // 歷史紀錄管理
        function saveHistory(score, completed = true) {
            const endTime = new Date();
            const history = JSON.parse(localStorage.getItem(`${QUIZ_ID}_history`) || '[]');
            
            const record = {
                studentName: studentName,
                studentAvatar: studentAvatar,
                course: currentCourse,
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
            const currentYear = new Date().getFullYear();
            const cutoffDate = new Date(currentYear, HISTORY_CUTOFF_MONTH, HISTORY_CUTOFF_DAY);
            
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
					
					// 使用紀錄當時的頭像和名稱
					const displayAvatar = record.studentAvatar || '👤';
					const displayName = record.studentName || '未知';
					
					return `
						<div class="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
							<div class="flex items-center space-x-3 flex-1">
								<span class="text-2xl">${displayAvatar}</span>
								<span class="font-medium">${displayName}</span>
								<span class="text-gray-600">${record.course}</span>
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
			
			// 控制頂部按鈕的顯示/隱藏
			document.getElementById('filterContainer').classList.add('hidden');
			document.getElementById('historyBtn').style.display = 'none';
			document.getElementById('backFromHistoryBtn').classList.remove('hidden');
		}

        // 初始化題目導航
        function initQuestionNavigation() {
            const nav = document.getElementById('questionNav');
            nav.innerHTML = '';
            
            currentQuestions.forEach((_, index) => {
                const button = document.createElement('button');
                button.className = 'w-8 h-8 rounded-full font-medium text-sm transition-all hover:scale-105';
                button.textContent = index + 1;
                button.onclick = () => goToQuestion(index);
                updateNavButton(button, index);
                nav.appendChild(button);
            });
        }

        // 更新導航按鈕狀態
        function updateNavButton(button, index) {
            if (index === currentQuestionIndex) {
                // 當前題目用藍色
                button.className = 'w-8 h-8 rounded-full font-medium text-sm transition-all hover:scale-105 bg-blue-500 text-white select-none';
            } else if (userAnswers[index] !== undefined) {
                const isCorrect = userAnswers[index] === currentQuestions[index].correctAnswer;
                button.className = `w-8 h-8 rounded-full font-medium text-sm transition-all hover:scale-105 select-none ${
                    isCorrect ? 'bg-green-400 text-white' : 'bg-red-400 text-white'
                }`;
            } else {
                button.className = 'w-8 h-8 rounded-full font-medium text-sm transition-all hover:scale-105 bg-gray-300 text-gray-700 select-none';
            }
        }

        
// 跳到指定題目
function goToQuestion(index) {
    if (userAnswers[0] === undefined && index !== 0) {
        return;
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
            
            // 【修改】標題顯示邏輯
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
            
            if (userAnswers[currentQuestionIndex] !== undefined) {
                showExplanation(question.explanation);
            } else {
                document.getElementById('explanationArea').classList.add('hidden');
                showingExplanation = false;
            }
            
            updateQuestionNavigation();
        }


        // 選擇答案
        function selectAnswer(value, buttonElement) {
            // 如果選項不可點擊或已經作答，不允許點擊
            if (!optionsClickable || userAnswers[currentQuestionIndex] !== undefined) {
                return;
            }
            
            userAnswers[currentQuestionIndex] = value;
            const question = currentQuestions[currentQuestionIndex];
            const isCorrect = value === question.correctAnswer;
            
            // 移除所有選項的選中狀態和hover效果
            const options = document.querySelectorAll('#optionsContainer button');
            options.forEach(btn => {
                btn.classList.remove('bg-purple-100', 'border-purple-400', 'bg-green-100', 'border-green-400', 'bg-red-100', 'border-red-400');
                btn.classList.add('border-gray-200');
                btn.style.pointerEvents = 'none'; // 禁用點擊
                btn.classList.remove('option-button'); // 移除hover效果
            });
            
            // 顯示正確答案和用戶選擇
            options.forEach((btn) => {
                const btnValue = parseInt(btn.dataset.value);
                
                if (btnValue === question.correctAnswer) {
                    btn.classList.add('bg-green-100', 'border-green-400');
                    btn.classList.remove('border-gray-200');
                    
                    if (isCorrect) {
                        showCorrectEffectOnButton(btn);
                    }
                }
                if (btnValue === value && !isCorrect) {
                    btn.classList.add('bg-red-100', 'border-red-400');
                    btn.classList.remove('border-gray-200');
                }
            });
            
            // 顯示解析
            showExplanation(question.explanation);
            
            // 更新進度和導航
            updateProgress();
            updateQuestionNavigation();
            updateNextButton();

            document.getElementById('nextBtn').style.visibility = 'visible';
        }

        // 創建選項按鈕
        function createOptionButton(text, value) {
            const button = document.createElement('button');
            button.className = 'option-button w-full text-left p-4 rounded-xl border-2 border-gray-200 transition-all font-medium';
            button.textContent = text;
            button.dataset.value = value; // 儲存實際選項值到 data 屬性
            button.onclick = () => selectAnswer(value, button);
            button.style.fontSize = FONT_SIZES[fontSizeIndex] + 'px';
            
            if (zhuyinMode) {
                button.classList.add('zhuyin-font');
            }
            
            // 如果已經回答過，顯示正確的狀態
            if (userAnswers[currentQuestionIndex] !== undefined) {
                const question = currentQuestions[currentQuestionIndex];
                button.style.pointerEvents = 'none';
                button.classList.remove('option-button');
                
                if (value === question.correctAnswer) {
                    button.classList.add('bg-green-100', 'border-green-400');
                    button.classList.remove('border-gray-200');
                } else if (value === userAnswers[currentQuestionIndex]) {
                    button.classList.add('bg-red-100', 'border-red-400');
                    button.classList.remove('border-gray-200');
                }
            }
            
            return button;
        }

        // 選擇答案
        function selectAnswer(value, buttonElement) {
            // 如果選項不可點擊或已經作答，不允許點擊
            if (!optionsClickable || userAnswers[currentQuestionIndex] !== undefined) {
                return;
            }
            
            userAnswers[currentQuestionIndex] = value;
            const question = currentQuestions[currentQuestionIndex];
            const isCorrect = value === question.correctAnswer;
            
            // 移除所有選項的選中狀態和hover效果
            const options = document.querySelectorAll('#optionsContainer button');
            options.forEach(btn => {
                btn.classList.remove('bg-purple-100', 'border-purple-400', 'bg-green-100', 'border-green-400', 'bg-red-100', 'border-red-400');
                btn.classList.add('border-gray-200');
                btn.style.pointerEvents = 'none'; // 禁用點擊
                btn.classList.remove('option-button'); // 移除hover效果
            });
            
            // 顯示正確答案和用戶選擇
            options.forEach((btn) => {
                // 從按鈕的 data-value 屬性取得實際選項值
                const btnValue = parseInt(btn.dataset.value);
                
                if (btnValue === question.correctAnswer) {
                    btn.classList.add('bg-green-100', 'border-green-400');
                    btn.classList.remove('border-gray-200');
                    
                    // 在正確選項上顯示特效
                    if (isCorrect) {
                        showCorrectEffectOnButton(btn);
                    }
                }
                if (btnValue === value && !isCorrect) {
                    btn.classList.add('bg-red-100', 'border-red-400');
                    btn.classList.remove('border-gray-200');
                }
            });
            
            // 顯示解析
            showExplanation(question.explanation);
            
            // 更新進度和導航
            updateProgress();
            updateQuestionNavigation();
            updateNextButton();
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
            const prevBtn = document.getElementById('prevBtn');
            
            const isCurrentAnswered = userAnswers[currentQuestionIndex] !== undefined;
            const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1;
            
            // 1. 控制「上一題」按鈕
            if (currentQuestionIndex === 0) {
                prevBtn.style.visibility = 'hidden';
            } else if (isCurrentAnswered) {
                prevBtn.style.visibility = 'visible';
            } else {
                prevBtn.style.visibility = 'hidden';
            }

            // 2. 控制「下一題」按鈕
            if (isCurrentAnswered) {
                nextBtn.style.visibility = 'visible';
            } else {
                nextBtn.style.visibility = 'hidden';
            }

            // 3. 設定按鈕文字與邏輯
            if (isLastQuestion) {
                // 如果是最後一題
                if (isReviewMode) {
                    // 【新增】複習模式：顯示「返回成績」
                    nextBtn.innerHTML = `<span>返回成績</span><span class="material-icons-outlined">undo</span>`;
                } else {
                    // 一般模式：顯示「完成測驗」
                    nextBtn.innerHTML = `<span>完成測驗</span><span class="material-icons-outlined">check_circle</span>`;
                }
                nextBtn.disabled = false;
            } else {
                // 非最後一題
                nextBtn.innerHTML = `<span class="material-icons-outlined">arrow_forward</span>`;
                nextBtn.disabled = false;
            }
        }

        // 上一題
        document.getElementById('prevBtn').onclick = () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                showQuestion();
                updateProgress();
            }
        };

        // 下一題按鈕點擊事件
        document.getElementById('nextBtn').onclick = () => {
            const isLastQuestion = currentQuestionIndex === currentQuestions.length - 1;

            if (isLastQuestion) {
                if (isReviewMode) {
                    // 【新增】如果是複習模式，最後一題點擊後回到成績單
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
            
            // 還原標題
            document.getElementById('mainTitle').textContent = `📚 ${currentCourse}`;
            
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
// 顯示結果
        function showResult() {
            const total = currentQuestions.length;
            const answered = Object.keys(userAnswers).length;
            let correct = 0;
            
            currentQuestions.forEach((question, index) => {
                if (userAnswers[index] === question.correctAnswer) {
                    correct++;
                }
            });
            
            const wrong = answered - correct;
            const percentage = Math.round((correct / total) * 100);
            
            // 儲存歷史紀錄
            saveHistory(percentage, true);
            
            // 【修改】自動傳送成績到Google表單 (如果啟用且測驗代碼正確)
            if (ENABLE_GOOGLE_FORM_SUBMIT && studentQuizCode === QUIZ_CODE) {
                sendScoreToGoogleForm(studentName, studentClass, percentage, studentQuizCode);
                showSubmissionSuccessAlert(); // 顯示成功訊息
            }
            
			// 計算星級 (使用 Google Material Icons)
			let stars = '';
			const fullStars = Math.floor(percentage / 20);
			const hasHalfStar = (percentage % 20) >= 10;
			const starClass = 'material-icons text-yellow-400'; // 定義星星的樣式

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
        }
        
        // 傳送成績到Google表單
// 傳送成績到Google表單
        function sendScoreToGoogleForm(name, classNum, score, quizCode) {
            try {
                // 要送的資料
                const formData = new URLSearchParams();
                formData.append(GOOGLE_FORM_CONFIG.nameField, name);
                formData.append(GOOGLE_FORM_CONFIG.classField, classNum);
                formData.append(GOOGLE_FORM_CONFIG.scoreField, score);
                //formData.append(GOOGLE_FORM_CONFIG.quizCodeField, quizCode); // 【新增】

                // 自動送出
                fetch(GOOGLE_FORM_CONFIG.formUrl, {
                    method: "POST",
                    mode: "no-cors",
                    body: formData
                }).catch(error => {
                    console.log('成績傳送完成');
                });
            } catch (error) {
                console.log('成績傳送過程中發生錯誤，但不影響測驗結果');
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

    // 只有在開始計時且「有作答」的情況下，才儲存為未完成
    if (startTime && hasAnswered) {
        saveHistory(0, false);
    }
    
    // 恢復標題
    document.getElementById('mainTitle').textContent = QUIZ_TITLE;
    
    // 恢復右上角個人資訊點擊功能
    document.getElementById('userInfo').style.cursor = 'pointer';
    document.getElementById('userInfo').onclick = editStudentInfo;
    
    hideAllAreas();
    document.getElementById('courseSelection').classList.remove('hidden');
    
    updateHeaderButtonsVisibility();
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

		// 初始化
		document.addEventListener('DOMContentLoaded', function() {
			document.getElementById('mainTitle').textContent = QUIZ_TITLE;
			setFavicon(QUIZ_EMOJI);
			initStudentInfo();
			initFilterMenu(); 
			applyFilterFromUrl(); 
			initCourseSelection();
            document.getElementById('resetBtn').onclick = resetToDefaultUser;
            document.getElementById('backFromEditBtn').onclick = () => {
                document.getElementById('cancelEditBtn').click();
            };
			loadSavedUserInfo();
			updateHeaderButtonsVisibility();
		});
