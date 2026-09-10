document.getElementById("myhtml").innerHTML = `
        <!-- 標題 -->
        <div class="text-center mb-8 relative min-h-[4rem]" id="headerArea">
			<div class="absolute top-0 left-0 flex items-center space-x-1 md:space-x-2">
				<button id="backFromHistoryBtn" class="hidden btn-tool" title="返回">
					<span class="material-icons-outlined">arrow_back</span>
				</button>

				<button id="exitQuizBtn" class="hidden bg-[var(--color-danger)] hover:bg-[var(--color-danger-dark)] text-white w-8 h-8 md:w-10 md:h-10 rounded-full font-bold transition-colors text-sm md:text-base" title="終止測驗">
					✕
				</button>

				<button id="quizModeToggleBtn" class="hidden px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold transition-all text-xs md:text-sm flex items-center space-x-1 border-2" title="切換測驗/練習模式">
                    <span class="material-icons-outlined text-base">assignment</span>
                    <span>測驗</span>
                </button>

				<button id="backFromEditBtn" class="hidden btn-tool" title="返回">
					<span class="material-icons-outlined">arrow_back</span>
				</button>
					<button id="historyBtn" class="btn-tool" title="查看歷史紀錄" style="display: none;">
						<span class="material-icons-outlined">history</span>
					</button>

                <button id="analysisBtn" class="btn-tool" title="成績分析">
					<span class="material-icons-outlined">analytics</span>
				</button>
			</div>
            <div class="absolute top-0 right-0 flex items-center space-x-1 md:space-x-2 transition-colors max-w-[40%] md:max-w-none" id="userInfo" style="display: none;">
                <span id="userAvatar" class="text-lg md:text-2xl"></span>
                <span id="userName" class="font-medium text-purple-700 text-sm md:text-base truncate"></span>
            </div>
            <div class="px-16 md:px-0">
                <h1 class="text-2xl md:text-4xl font-bold text-purple-800 mb-2 leading-tight" id="mainTitle"></h1>
            </div>
        </div>

        <!-- 學生資訊輸入 -->
        <div id="studentInfo" class="bg-white rounded-2xl shadow-lg p-6 mb-6 relative">
            <h2 class="text-2xl font-bold text-center text-purple-700 mb-4" id="studentInfoTitle">個人資訊設定</h2>
            <div class="max-w-lg mx-auto">
                <div id="avatarExpiryNotice" class="hidden mb-4 text-sm px-4 py-3 rounded-lg flex items-center justify-between gap-2" style="background-color: var(--color-warning-light); color: var(--color-warning-dark);">
                    <span>🕒 你上次兌換的頭像已經到期囉，變回預設頭像 🐛 了</span>
                    <button id="avatarExpiryNoticeClose" class="flex-shrink-0" style="color: var(--color-warning-dark);" title="關閉">
                        <span class="material-icons-outlined text-lg">close</span>
                    </button>
                </div>
                <div class="mb-4 flex items-center">
                    <label for="studentName" class="w-18 text-gray-700 font-bold mr-2 flex-shrink-0">名稱：</label>
                    <input type="text" id="studentName" class="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)] transition-shadow" placeholder="輸入你的姓名">
                </div>
                <div class="mb-4 flex items-center">
                    <label for="studentClass" class="w-18 text-gray-700 font-bold mr-2 flex-shrink-0">班號：</label>
                    <input type="text" id="studentClass" class="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)] transition-shadow" placeholder="如四甲6號「40106」，四乙13號「40213」">
                </div>
                <div class="mb-4 flex items-center">
                    <label for="studentQuizCode" class="w-18 text-gray-700 font-bold mr-2 flex-shrink-0">代碼：</label>
                    <input type="text" id="studentQuizCode" class="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)] transition-shadow" placeholder="輸入老師提供的測驗代碼">
                </div>
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <label class="w-18 text-gray-700 font-bold mr-2 flex-shrink-0">頭像：</label>
                        <div class="flex items-center gap-2 flex-wrap">
                            <span id="studentPointsDisplay" class="text-sm font-bold px-3 py-1 rounded-full" style="background-color: var(--color-warning-light); color: var(--color-warning-dark);">🌟 積分 0 點</span>
                            <span id="avatarExpiryDisplay" class="hidden text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-500"></span>
                        </div>
                    </div>
                    <div class="flex items-center mb-2">
                        <span class="w-18 flex-shrink-0"></span>
                        <div class="flex flex-wrap gap-2 flex-grow" id="avatarTabs">
                            <button class="px-3 py-1 rounded-full text-sm font-medium transition-colors bg-purple-500 text-white" data-category="animals">動物</button>
                            <button class="px-3 py-1 rounded-full text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300" data-category="insects">蟲</button>
                            <button class="px-3 py-1 rounded-full text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300" data-category="plants">植物</button>
                            <button class="px-3 py-1 rounded-full text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300" data-category="people">人</button>
                            <button class="px-3 py-1 rounded-full text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300" data-category="faces">臉</button>
                            <button class="px-3 py-1 rounded-full text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300" data-category="transport">交通</button>
                            <button class="px-3 py-1 rounded-full text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300" data-category="other">其他</button>
                            <button class="px-3 py-1 rounded-full text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300" data-category="treasure">寶物</button>
                            <button class="px-3 py-1 rounded-full text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300" data-category="weapons">武器</button>
                            <button class="px-3 py-1 rounded-full text-sm font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300" data-category="aircraft">飛機</button>
                        </div>
                    </div>
                    <div class="grid grid-cols-8 gap-2 h-32 overflow-y-auto border rounded-lg p-2" id="avatarSelection">
                    </div>
                    <p class="text-xs text-gray-400 mt-1">🔒 標示的頭像還沒解鎖，需要 3 點積分才能兌換</p>
                </div>
                <div class="text-center space-x-4">
                    <button id="confirmStudentInfo" class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed" disabled>
                        開始 🚀
                    </button>
                    <button id="cancelEditBtn" class="hidden bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-full font-medium transition-colors">
                        取消
                    </button>
                    <button id="resetBtn" class="hidden bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-full font-medium transition-colors">
                        重設
                    </button>
                </div>
            </div>
        </div>

        <!-- 課別選單 -->
        <div id="spacedReviewEntry" class="hidden bg-white rounded-2xl shadow-lg p-4 mb-6 flex items-center justify-between gap-3 flex-wrap" style="background-color: var(--color-warning-light);">
            <div class="flex items-center space-x-3">
                <span class="text-3xl">🔁</span>
                <div>
                    <div class="font-bold" style="color: var(--color-warning-dark);">複習錯題</div>
                    <div class="text-sm text-gray-600">有 <span id="spacedReviewCount">0</span> 題該複習囉，趁還記得趕快訂正一下！</div>
                </div>
            </div>
            <button id="startSpacedReviewBtn" class="bg-[var(--color-warning)] hover:bg-[var(--color-warning-dark)] text-white px-5 py-2.5 rounded-full font-bold transition-colors flex-shrink-0">
                開始複習
            </button>
        </div>

        <div id="courseSelection" class="hidden bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="courseButtons">
                <!-- 課別按鈕將動態生成 -->
            </div>
        </div>

        <!-- 測驗區域 -->
        <div id="quizArea" class="hidden">
            <div class="question-card bg-white rounded-2xl shadow-lg p-4 mb-6" id="questionCard">
                <div class="flex justify-between items-center gap-3">
                    <div class="flex items-center gap-3">
                        <span class="text-sm font-medium text-purple-700" id="progressText">0/0</span>
                        <div class="flex flex-wrap gap-1" id="questionNav">
                            </div>
                    </div>
                    <button id="toggleHeaderBtn" class="btn-tool flex-shrink-0" title="收合/展開標題">
                        <span id="toggleHeaderIcon" class="material-icons-outlined">expand_less</span>
                    </button>
                </div>

                <div class="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2 mb-4" aria-hidden="true">
                    <div id="progressBarFill" class="progress-bar h-full rounded-full" style="width: 0%; background: linear-gradient(90deg, var(--color-primary), var(--color-accent));"></div>
                </div>

                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-purple-700" id="questionTitle">題目 1</h3>
                    <div class="flex items-center space-x-2" style="position: relative;">
						<button id="readBtn" class="btn-tool" title="朗讀題目">
							<span class="material-icons-outlined">volume_up</span>
						</button>
                        <button id="zhuyinBtn" class="btn-tool btn-tool-pill" title="切換注音顯示">
                            注音
                        </button>
                        <button id="fontSizeDown" class="btn-tool text-sm" title="縮小字體">
                            A-
                        </button>
                        <button id="fontSizeUp" class="btn-tool text-base" title="放大字體">
                            A+
                        </button>
                        <button id="layoutBtn" class="btn-tool" title="切換選項排版">
                            <span id="layoutBtnIcon" class="material-icons-outlined">view_module</span>
                        </button>

                        <!-- 新手提示：只在第一次進入測驗時出現一次，之後不再顯示 -->
                        <div id="onboardingTip" class="hidden" style="position: absolute; top: calc(100% + 10px); right: 0; z-index: 41; width: 220px; background-color: var(--color-primary); color: white; border-radius: 12px; padding: 12px 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">
                            <div style="position: absolute; top: -6px; right: 18px; width: 12px; height: 12px; background-color: var(--color-primary); transform: rotate(45deg);"></div>
                            <p style="font-size: 13px; line-height: 1.6; margin: 0 0 8px;">👋 看不懂字也沒關係，按這裡可以「朗讀題目」或「切換注音」喔！</p>
                            <button id="onboardingTipDismiss" style="font-size: 12px; font-weight: bold; background-color: rgba(255,255,255,0.2); border-radius: 9999px; padding: 4px 12px; color: white;">知道了</button>
                        </div>
                    </div>
                </div>

                <!-- 新手提示的淡淡遮罩，點擊任何地方都會關閉提示 -->
                <div id="onboardingOverlay" class="hidden" style="position: fixed; inset: 0; background-color: rgba(0,0,0,0.08); z-index: 40;"></div>
                <p class="text-lg text-gray-800 mb-6 leading-relaxed" id="questionText"></p>
                
                <div id="optionsContainer">
                </div>

				<div id="explanationArea" class="hidden bg-blue-50 rounded-xl p-4 mt-6">
				  <p class="text-gray-700 leading-relaxed">
					<span class="inline-flex items-center space-x-1 align-middle">
					  <span class="text-xl font-bold text-blue-700">💡</span>
					  <button id="readExplanationBtn"
						class="btn-tool btn-tool-sm" title="朗讀解析">
						<span class="material-icons-outlined text-base">volume_up</span>
					  </button>
					</span>
					<span id="explanationText"></span>
				  </p>
				</div>

					<div class="mt-8 flex justify-center w-full">
						<button id="nextBtn" class="w-full md:w-2/3 bg-purple-500 hover:bg-purple-600 text-white py-4 rounded-xl font-bold text-xl transition-all shadow-lg transform active:scale-95 flex items-center justify-center space-x-2">
							<span class="material-icons-outlined">arrow_forward</span>
						</button>
					</div>
            </div>

            <div class="text-center">
                <button id="finishBtn" class="hidden bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 rounded-full font-bold text-lg transition-all transform hover:scale-105">
                    🎉 完成
                </button>
            </div>

            <!-- 🙂 小助手提示：只在練習模式出現，測驗模式不顯示 -->
            <div id="hintMascot" class="hidden" style="position: fixed; bottom: 20px; right: 20px; z-index: 45;">
                <div id="hintBubble" class="hidden" style="position: absolute; bottom: 68px; right: 0; width: min(420px, 92vw); background-color: white; border-radius: 12px; padding: 14px 16px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
                    <div style="position: absolute; bottom: -6px; right: 22px; width: 12px; height: 12px; background-color: white; transform: rotate(45deg);"></div>
                    <button id="hintBubbleCloseBtn" title="關閉提示" style="position: absolute; top: 4px; right: 4px; width: 26px; height: 26px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: #94a3b8; background: transparent;">
                        <span class="material-icons-outlined" style="font-size: 18px;">close</span>
                    </button>
                    <p id="hintBubbleText" style="position: relative; margin: 0; padding-right: 20px; line-height: 1.7; color: #334155;"></p>
                </div>
                <button id="hintMascotBtn" title="需要提示嗎？" style="position: relative; width: 56px; height: 56px; border-radius: 9999px; background-color: white; border: 2px solid var(--color-primary-light); box-shadow: 0 4px 14px rgba(0,0,0,0.18); display: flex; align-items: center; justify-content: center; font-size: 28px; transition: transform 0.15s ease;">
                    <span id="hintMascotEmoji">🙂</span>
                    <span id="hintMascotBadge" style="position: absolute; top: -4px; right: -4px; width: 20px; height: 20px; border-radius: 9999px; background-color: var(--color-danger); color: white; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center;">3</span>
                </button>
            </div>
        </div>

        <!-- 成績報告 -->
        <div id="resultArea" class="hidden">
            <div class="bg-white rounded-2xl shadow-lg p-8 text-center">

                <div class="text-6xl mb-4" id="starRating"></div>
                <div class="mb-6">
                    <div class="text-2xl font-bold text-gray-800 mb-2" id="scoreText"></div>
                    <div id="pointsEarnedNotice" class="hidden inline-block text-sm font-bold px-4 py-1.5 rounded-full" style="background-color: var(--color-warning-light); color: var(--color-warning-dark);"></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="rounded-lg p-4" style="background-color: var(--color-accent-light);">
                        <div class="text-2xl font-bold" id="correctCount" style="color: var(--color-accent-dark);">0</div>
                        <div style="color: var(--color-accent-dark);">答對題數</div>
                    </div>
                    <div class="rounded-lg p-4" style="background-color: var(--color-warning-light);">
                        <div class="text-2xl font-bold" id="wrongCount" style="color: var(--color-warning-dark);">0</div>
                        <div style="color: var(--color-warning-dark);">答錯題數</div>
                    </div>
                    <div class="rounded-lg p-4" style="background-color: var(--color-neutral-bg);">
                        <div class="text-2xl font-bold" id="totalCount" style="color: var(--color-neutral-text);">0</div>
                        <div style="color: var(--color-neutral-text);">總題數</div>
                    </div>
                </div>
                <div class="space-y-4">
                    <button id="reviewBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-medium transition-colors mr-4">
                        📝 檢視錯題
                    </button>
                    <button id="restartBtn" class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-full font-medium transition-colors">
                        🏠 返回首頁
                    </button>
                </div>
            </div>
        </div>

        <!-- 錯題檢視 -->
        <div id="reviewArea" class="hidden">
            <div class="bg-white rounded-2xl shadow-lg p-6 relative">
                <button id="backToResultBtnTop" class="absolute top-4 left-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                    ⬅️ 返回成績
                </button>
                <button id="backToHomeFromReviewBtnTop" class="absolute top-4 right-4 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                    🏠 返回首頁
                </button>
                <h2 class="text-2xl font-bold text-red-600 mb-4 pt-16">❌ 錯題檢視與解析</h2>
                <div id="wrongQuestions">
                    <!-- 錯題將動態生成 -->
                </div>
                <div class="flex justify-between mt-6">
                    <button id="backToResultBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-medium transition-colors">
                        ⬅️ 返回成績
                    </button>
                    <button id="backToHomeFromReviewBtn" class="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-full font-medium transition-colors">
                        🏠 返回首頁
                    </button>
                </div>
            </div>
        </div>

        <!-- 歷史紀錄 -->
        <div id="historyArea" class="hidden relative">

            <div class="bg-white rounded-2xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-4 pt-8">
                    <h2 class="text-2xl font-bold text-blue-600">📊 我的學習歷程</h2>
                    <div class="space-x-2">
                        <button id="clearIncompleteBtn" class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                            🗑️ 清除未完成
                        </button>
                        <button id="clearAllHistoryBtn" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors">
                            🗑️ 全部清除
                        </button>
                    </div>
                </div>

                <div id="historyStatsSection" class="hidden mb-6">
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="rounded-lg p-3 text-center" style="background-color: var(--color-primary-light);">
                            <div class="text-2xl font-bold" style="color: var(--color-primary-dark);" id="historyCompletedCount">0</div>
                            <div class="text-sm" style="color: var(--color-primary-dark);">已完成測驗</div>
                        </div>
                        <div class="rounded-lg p-3 text-center" style="background-color: var(--color-accent-light);">
                            <div class="text-2xl font-bold" style="color: var(--color-accent-dark);" id="historyAverageScore">0</div>
                            <div class="text-sm" style="color: var(--color-accent-dark);">平均分數</div>
                        </div>
                    </div>
                    <div id="historyTrendChart" class="bg-gray-50 rounded-lg p-4"></div>
                </div>

                <div id="historyList" class="space-y-2">
                    </div>
            </div>
        </div>

        <div id="exitConfirmDialog" class="hidden fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 opacity-0">
            <div id="exitConfirmDialogContent" class="bg-white rounded-2xl shadow-xl p-8 w-11/12 max-w-md text-center transform transition-all scale-95 opacity-0">
                <h3 class="text-2xl font-bold text-red-600 mb-4">⚠️ 確定要終止測驗嗎？</h3>
                <p class="text-gray-600 mb-8">目前的作答進度將會被記錄為「未完成」，但不會計分。</p>
                <div class="flex justify-center space-x-4">
                    <button id="confirmExitBtn" class="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-medium transition-colors transform hover:scale-105">
                        確定終止
                    </button>
                    <button id="cancelExitBtn" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-full font-medium transition-colors">
                        繼續作答
                    </button>
                </div>
            </div>
        </div>

        <div id="genericConfirmDialog" class="hidden fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 opacity-0">
            <div id="genericConfirmDialogContent" class="bg-white rounded-2xl shadow-xl p-8 w-11/12 max-w-md text-center transform transition-all scale-95 opacity-0">
                <h3 id="genericDialogTitle" class="text-2xl font-bold text-red-600 mb-4">標題</h3>
                <p id="genericDialogMessage" class="text-gray-600 mb-6">訊息</p>
                <div id="genericDialogPasswordWrapper" class="mb-6 hidden">
                    <label class="block text-gray-700 text-sm font-bold mb-2 text-left">請輸入管理密碼：</label>
                    <input type="password" id="genericDialogPasswordInput" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)] transition-shadow" placeholder="Password">
                </div>
                <div class="flex justify-center space-x-4">
                    <button id="genericConfirmBtn" class="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-medium transition-colors transform hover:scale-105">
                        確認
                    </button>
                    <button id="genericCancelBtn" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-full font-medium transition-colors">
                        取消
                    </button>
                </div>
            </div>
        </div>






        <!-- 練習紀錄彈出視窗 (新增) -->
        <div id="statsModal" class="hidden fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <!-- 背景遮罩 -->
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm" aria-hidden="true" onclick="closeStatsModal()"></div>
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <!-- 彈窗本體 -->
                <div class="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm w-full relative">
                    
                    <!-- 裝飾背景頭部 -->
                    <div class="bg-gradient-to-r from-purple-100 to-blue-100 h-24 absolute top-0 left-0 w-full z-0"></div>
                    
                    <!-- 關閉按鈕 -->
                    <button onclick="closeStatsModal()" class="absolute top-3 right-3 bg-white/50 hover:bg-white text-gray-500 hover:text-gray-700 rounded-full p-1 z-50 transition-colors">
                        <span class="material-icons-outlined">close</span>
                    </button>

                    <div class="relative px-6 pt-12 pb-6 z-10">
                        <!-- 標題 -->
                        <div class="text-center mb-6">
                            <h3 class="text-xl font-bold text-gray-800 mb-1" id="statsModalTitle">單元名稱</h3>
                        </div>

                        <!-- 星星評分 -->
                        <div class="flex justify-center mb-6 space-x-1" id="statsModalStars">
                            <!-- 星星將由 JS 動態生成 -->
                        </div>

                        <!-- 數據卡片 -->
						<div class="mb-5 flex space-x-3 items-stretch h-28">
                            <div class="w-1/3 bg-blue-50 rounded-2xl p-2 text-center border border-blue-100 flex flex-col justify-center items-center">
                                <div class="text-blue-500 mb-1"><span class="material-icons-outlined text-3xl">rocket_launch</span></div>
                                <div class="text-4xl font-extrabold text-gray-800 leading-none" id="statsModalCount">0</div>
                                <div class="text-xs text-gray-500 font-medium mt-1">總練習次數</div>
                            </div>

                            <div class="w-2/3 grid grid-cols-2 gap-2">
                                <div class="bg-red-50 rounded-xl p-1 text-center border border-red-100 flex flex-col justify-center">
                                    <div class="text-red-500 text-xs font-bold mb-0.5">100分</div>
                                    <div class="text-xl font-bold text-gray-800 leading-tight" id="statsCount100">0</div>
                                </div>
                                <div class="bg-orange-50 rounded-xl p-1 text-center border border-orange-100 flex flex-col justify-center">
                                    <div class="text-orange-500 text-xs font-bold mb-0.5">90↑</div>
                                    <div class="text-xl font-bold text-gray-800 leading-tight" id="statsCount90">0</div>
                                </div>
                                <div class="bg-green-50 rounded-xl p-1 text-center border border-green-100 flex flex-col justify-center">
                                    <div class="text-green-600 text-xs font-bold mb-0.5">80↑</div>
                                    <div class="text-xl font-bold text-gray-800 leading-tight" id="statsCount80">0</div>
                                </div>
                                <div class="bg-gray-100 rounded-xl p-1 text-center border border-gray-200 flex flex-col justify-center">
                                    <div class="text-gray-500 text-xs font-bold mb-0.5">加油</div>
                                    <div class="text-xl font-bold text-gray-800 leading-tight" id="statsCountOther">0</div>
                                </div>
                            </div>
                        </div>

                        <!-- 分數趨勢折線圖：練習 2 次以上才會顯示 -->
                        <div id="statsTrendChart" class="mb-5 bg-gray-50 rounded-xl p-2"></div>

                        <!-- 鼓勵評語 -->
                        <div class="text-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <span id="statsModalComment" class="text-gray-700 font-medium text-sm"></span>
                        </div>
                        
                        <!-- 按鈕 -->
                        <div class="mt-6">
                            <button type="button" onclick="closeStatsModal()" class="w-full inline-flex justify-center rounded-full border border-transparent shadow-sm px-4 py-3 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none sm:text-sm transition-transform active:scale-95">
                                確定！
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

		<div id="quizModeConfirmDialog" class="hidden fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300 opacity-0">
            <div id="quizModeConfirmDialogContent" class="bg-white rounded-2xl shadow-xl p-8 w-11/12 max-w-md text-center transform transition-all scale-95 opacity-0">
                <div class="mb-4 text-purple-100">
                    <span class="material-icons-outlined text-6xl bg-purple-500 rounded-full p-4">assignment_turned_in</span>
                </div>
                <h3 class="text-2xl font-bold text-gray-800 mb-2">準備好挑戰了嗎？</h3>
                <p class="text-gray-600 mb-8">此模式將<b>隱藏所有的提示與解析</b></p>
                <div class="flex justify-center space-x-4">
                    <button id="confirmQuizModeBtn" class="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-full font-bold text-lg transition-transform transform hover:scale-105 shadow-md">
                        是的，進入測驗
                    </button>
                    <button id="cancelQuizModeBtn" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3 rounded-full font-medium transition-colors">
                        先不要
                    </button>
                </div>
            </div>
        </div>










<div id="analysisModal" class="hidden fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm print:hidden" aria-hidden="true" onclick="closeAnalysisModal()"></div>
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div class="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
                    
                    <div class="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                        <h3 class="text-xl font-bold text-white flex items-center">
                            <span class="material-icons-outlined mr-2">analytics</span> 作答狀況分析
                        </h3>
                        <button onclick="closeAnalysisModal()" class="text-white hover:text-gray-200">
                            <span class="material-icons-outlined">close</span>
                        </button>
                    </div>

                    <div class="p-6">
                        <div class="mb-6 print:hidden">
                            <label class="block text-gray-700 font-bold mb-2">貼上作答數據</label>
                            <textarea id="analysisInput" class="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)] transition-shadow font-mono text-sm" placeholder="(格式：班號 測驗ID 錯題)"></textarea>
                            <div class="mt-2 flex justify-end space-x-2">
                                <button onclick="clearAnalysisInput()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">清除</button>
                                <button onclick="performAnalysis()" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition-transform transform active:scale-95">
                                    開始分析
                                </button>
                            </div>
                        </div>

                        <div id="analysisResultArea" class="hidden space-y-8">

                            <div class="flex justify-end space-x-2 print:hidden">
                                <button onclick="exportAnalysisCSV()" class="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-1 text-sm">
                                    <span class="material-icons-outlined text-base">download</span>
                                    <span>匯出 CSV</span>
                                </button>
                                <button onclick="exportAnalysisText()" class="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-1 text-sm">
                                    <span class="material-icons-outlined text-base">description</span>
                                    <span>匯出純文字</span>
                                </button>
                                <button onclick="printAnalysisResults()" class="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors flex items-center space-x-1 text-sm">
                                    <span class="material-icons-outlined text-base">print</span>
                                    <span>列印</span>
                                </button>
                            </div>

                            <div class="bg-red-50 rounded-xl p-6 border border-red-100">
                                <h4 class="text-lg font-bold text-red-700 mb-4 flex items-center">
                                    <span class="material-icons-outlined mr-2">format_list_numbered</span> 錯題排行榜
                                </h4>
                                <div id="errorRankList" class="space-y-3">
                                    </div>
                            </div>

                            <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h4 class="text-lg font-bold text-gray-700 mb-4 flex items-center">
                                    <span class="material-icons-outlined mr-2">grid_on</span> 學生作答分布表
                                </h4>
                                <div class="overflow-x-auto">
                                    <table class="min-w-full bg-white rounded-lg overflow-hidden shadow-sm">
                                        <thead class="bg-gray-200 text-gray-700">
                                            <tr id="matrixHeader">
                                                </tr>
                                        </thead>
                                        <tbody id="matrixBody" class="text-gray-600">
                                            </tbody>
                                    </table>
                                </div>
                            </div>

                            <div id="trendSection" class="hidden bg-[var(--color-primary-light)] rounded-xl p-6 border border-purple-100">
                                <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
                                    <h4 class="text-lg font-bold text-[var(--color-primary-dark)] flex items-center">
                                        <span class="material-icons-outlined mr-2">show_chart</span> 學生分數趨勢
                                    </h4>
                                    <select id="trendStudentSelect" class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"></select>
                                </div>
                                <p class="text-sm text-gray-500 mb-2">資料裡若包含這位學生在多次不同測驗的作答紀錄，會依課程順序畫出分數變化。</p>
                                <div id="trendChartContainer" class="bg-white rounded-lg p-4"></div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="quickQuestionModal" class="hidden fixed inset-0 z-[80] overflow-y-auto" style="display: none;">
             <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                <div class="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onclick="closeQuickQuestionModal()"></div>
                <div class="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-bold text-purple-700" id="quickQTitle">題目內容</h3>
                        <button onclick="closeQuickQuestionModal()" class="text-gray-400 hover:text-gray-600">
                            <span class="material-icons-outlined">close</span>
                        </button>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-xl mb-4">
                        <p id="quickQContent" class="text-lg font-medium text-gray-800 mb-3"></p>
                        <div id="quickQOptions" class="space-y-2 text-gray-600"></div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-xl border border-green-100">
                        <p class="font-bold text-green-700 mb-1">💡 解析：</p>
                        <p id="quickQExplanation" class="text-gray-700"></p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 🎉 灑花特效按鈕：獨立於測驗區塊之外，顯示/隱藏由 JS 控制 -->
        <div id="confettiButton" class="hidden" style="position: fixed; bottom: 20px; left: 20px; z-index: 45;">
            <button id="confettiButtonBtn" title="灑花特效" style="position: relative; width: 56px; height: 56px; border-radius: 9999px; background-color: white; border: 2px solid var(--color-primary-light); box-shadow: 0 4px 14px rgba(0,0,0,0.18); display: flex; align-items: center; justify-content: center; font-size: 26px; transition: transform 0.15s ease;">
                🎉
                <span id="confettiButtonBadge" style="position: absolute; top: -4px; right: -4px; min-width: 20px; height: 20px; padding: 0 4px; border-radius: 9999px; background-color: var(--color-primary); color: white; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center;">0</span>
            </button>
        </div>
`;
