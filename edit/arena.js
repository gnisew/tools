// =================================================================
// 連線對戰模式模組 (arena.js) - 終極響應式與防破版設計
// =================================================================

window.launchArenaMode = function(rawData, configs) {
    document.body.classList.add('is-playing-game');
    if (typeof toggleMaximizeMode === 'function') toggleMaximizeMode(true);

    const arenaContainer = document.getElementById('arenaModeContainer');
    if (!arenaContainer) return;

    let unsubscribePlayers = null; 
    let unsubscribeSpace = null;
    let unsubscribeStudentSelf = null; 
    let globalPlayers = []; 
    let gameData = [];      
    let currentQIndex = 0;  
    
    let questionTimer = null; 
    let autoNextTimer = null; // ✨ 新增：自動翻頁計時器
    let isRevealing = false; 
    let currentSpaceCode = '';

    window.currentArenaState = ''; 
    window.lastEmojiTs = {}; 

    if (!document.getElementById('arena-styles')) {
        const style = document.createElement('style');
        style.id = 'arena-styles';
        style.innerHTML = `
            @keyframes floatUpEmoji {
                0% { transform: translateY(0) scale(0.5); opacity: 0; }
                10% { transform: translateY(-20px) scale(1.2); opacity: 1; }
                80% { transform: translateY(-150px) scale(1.5); opacity: 1; }
                100% { transform: translateY(-200px) scale(1); opacity: 0; }
            }
            .animate-float-emoji { animation: floatUpEmoji 1.5s ease-out forwards; }
        `;
        document.head.appendChild(style);
    }

    function spawnFloatingEmoji(char) {
        const el = document.createElement('div');
        el.className = 'fixed z-[99999] text-6xl md:text-7xl drop-shadow-xl pointer-events-none animate-float-emoji';
        el.textContent = char;
        el.style.left = `${20 + Math.random() * 60}%`; 
        el.style.bottom = '10%'; 
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1500);
    }

    // ✨ QR 碼視窗
    function getQrModalHtml(spaceCode) {
        if (!spaceCode) return '';
        const displayCode = spaceCode.substring(0, 2) + ' ' + spaceCode.substring(2);
        const joinUrl = window.location.origin + window.location.pathname + '?arena=' + spaceCode;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(joinUrl)}&bgcolor=ffffff&color=312e81`;
        return `
            <div id="qr-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[10000] hidden flex-col items-center justify-center cursor-pointer transition-opacity overflow-y-auto py-10 px-4" onclick="this.classList.add('hidden')">
                <div class="bg-white p-6 md:p-8 rounded-[2rem] flex flex-col items-center gap-4 shadow-2xl transform transition-transform hover:scale-105 w-full max-w-sm m-auto cursor-default" onclick="event.stopPropagation()">
                    <h2 class="text-4xl md:text-5xl font-black text-indigo-950 tracking-[0.2em] text-center w-full break-words">${displayCode}</h2>
                    <div class="bg-white p-2 rounded-xl shadow-inner border-2 border-indigo-50 w-full max-w-[250px] aspect-square flex items-center justify-center">
                        <img src="${qrUrl}" alt="QR Code" class="w-full h-full object-contain">
                    </div>
                    <p class="text-indigo-600 font-bold text-lg md:text-xl mt-2 flex items-center gap-2 text-center">
                        <span class="material-symbols-outlined flex-shrink-0">qr_code_scanner</span> 掃描以加入空間
                    </p>
                    <button class="mt-2 bg-indigo-100 text-indigo-700 px-8 py-3 rounded-full font-bold hover:bg-indigo-200 transition-colors w-full cursor-pointer" onclick="document.getElementById('qr-modal').classList.add('hidden')">關閉</button>
                </div>
            </div>
        `;
    }

    // ✨ 點擊暫停功能更新
    window.toggleArenaPause = async function() {
        if (!currentSpaceCode) return;
        window.arenaIsPaused = !window.arenaIsPaused; 
        
        const pauseOverlay = document.getElementById('pause-overlay');
        if (pauseOverlay) {
            if (window.arenaIsPaused) pauseOverlay.classList.remove('opacity-0');
            else pauseOverlay.classList.add('opacity-0');
        }
        
        const spaceRef = db.collection(window.SPACES_COLLECTION).doc(currentSpaceCode);
        await spaceRef.update({ isPaused: window.arenaIsPaused });
    };

    function cleanupArena() {
        if (unsubscribePlayers) unsubscribePlayers();
        if (unsubscribeSpace) unsubscribeSpace();
        if (unsubscribeStudentSelf) unsubscribeStudentSelf();
        if (questionTimer) clearInterval(questionTimer);
        if (autoNextTimer) clearInterval(autoNextTimer); // ✨ 新增：清除自動計時
        if (window.currentStudentTimer) clearInterval(window.currentStudentTimer);
        
        window.arenaIsPaused = false;
        window.currentArenaState = '';
        window.lastEmojiTs = {};
        window.myMaxStreak = 0;
        window.myCurrentStreak = 0;
        window.myTotalCorrect = 0;
        window.lastEvaluatedQ = -1;
        
        document.body.classList.remove('is-playing-game');
        if (typeof toggleMaximizeMode === 'function') toggleMaximizeMode(false);
        arenaContainer.classList.add('hidden');
        arenaContainer.style.display = 'none';
        
        const url = new URL(window.location.href);
        if (url.searchParams.has('arena')) {
            url.searchParams.delete('arena');
            window.history.replaceState({}, document.title, url.href);
        }
        if (typeof switchMode === 'function') {
			const urlParams = new URLSearchParams(window.location.search);
			// ✨ 簡單規則：有 bank 就回題庫
			if (urlParams.has('bank')) {
				switchMode('bank');
			} else {
				const targetMode = window.originModeForGame || 'table';
				switchMode(targetMode);
			}
		}
    }

    function prepareQuizData(isJustCounting = false, hostSettings = null) {
        let parsed = [];
        if (configs.mcConfig) {
            parsed = parseMultipleChoiceData(rawData, configs.mcConfig, configs.hasHeader, configs.hasCategory, configs.colC);
        } else {
            const activePair = configs.matchPairs && configs.matchPairs[configs.currentMatchIndex] ? configs.matchPairs[configs.currentMatchIndex] : (configs.matchPairs ? configs.matchPairs[0] : {termCol:0, defCol:1});
            parsed = parseGameData(rawData, activePair.termCol, activePair.defCol, configs.hasHeader, configs.hasCategory, configs.colC);
        }

        if (hostSettings && hostSettings.filterCategory && hostSettings.filterCategory !== 'ALL') {
            parsed = parsed.filter(d => d.category === hostSettings.filterCategory);
        } else if (configs.hasCategory && configs.filterCategory && configs.filterCategory !== 'ALL') {
            parsed = parsed.filter(d => d.category === configs.filterCategory);
        }
        if (isJustCounting) return parsed; 

        if (hostSettings && hostSettings.qOrder === 'random') parsed.sort(() => Math.random() - 0.5);
        if (hostSettings && hostSettings.qCount) parsed = parsed.slice(0, hostSettings.qCount);
        
        parsed.forEach(q => {
            if (!q.options || q.options.length < 4) {
                let opts = [q.definition];
                let wrongOpts = parsed.filter(d => d.definition !== q.definition).map(d => d.definition);
                wrongOpts = [...new Set(wrongOpts)].sort(() => Math.random() - 0.5); 
                opts.push(...wrongOpts.slice(0, 3)); 
                while(opts.length < 4) opts.push("無選項"); 
                q.options = opts.sort(() => Math.random() - 0.5); 
            } else {
                q.options.sort(() => Math.random() - 0.5);
            }
        });
        return parsed;
    }

    const colorStyles = ['bg-[#e21b3c] border-[#b0152f]', 'bg-[#1368ce] border-[#0e4e9b]', 'bg-[#d89e00] border-[#a67a00]', 'bg-[#26890c] border-[#1d6b0a]'];
    const shapeIcons = ['change_history', 'diamond', 'circle', 'square'];

    // ----------------------------------------------------
    // 隱形路由中心：自動判斷是學生加入還是老師開課
    // ----------------------------------------------------
    function renderRoleSelection() {
        const urlParams = new URLSearchParams(window.location.search);
        const autoJoinCode = urlParams.get('arena');
        
        if (autoJoinCode) {
            return renderStudentJoinForm(autoJoinCode);
        }
        renderHostSettings();
    }

    // ----------------------------------------------------
    // 畫面 1-B：老師開房進階設定
    // ----------------------------------------------------
    function renderHostSettings() {
        const allDataForCategories = prepareQuizData(true, { filterCategory: 'ALL' });
        let uniqueCategories = [];
        if (configs.hasCategory) {
            uniqueCategories = [...new Set(allDataForCategories.map(d => d.category))].filter(c => c && c !== '(無名)');
        }
        const currentData = prepareQuizData(true);
        let maxQ = currentData.length;

        if (allDataForCategories.length === 0) {
            showToast('⚠️ 題庫中沒有題目可供出題');
            return renderRoleSelection();
        }

        let categoryHtml = '';
        if (uniqueCategories.length > 0) {
            categoryHtml = `
                <div class="mb-5 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
                    <div class="bg-[#eef2ff] px-4 py-3 border-b border-[#e0e7ff] flex items-center gap-2">
                        <span class="material-symbols-outlined text-indigo-600">category</span>
                        <h3 class="font-bold text-indigo-900">題庫分類篩選</h3>
                    </div>
                    <div class="p-4">
                        <select id="host-category" class="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-400 font-bold cursor-pointer text-gray-800">
                            <option value="ALL" ${configs.filterCategory === 'ALL' ? 'selected' : ''}>全部題目 (混和出題)</option>
                            ${uniqueCategories.map(c => `<option value="${c}" ${configs.filterCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
                        </select>
                    </div>
                </div>
            `;
        }

        arenaContainer.innerHTML = `
            <div class="w-full h-full bg-[#f4f4f5] font-sans select-none overflow-y-auto pb-12">
                <div class="w-full max-w-5xl mx-auto flex flex-col px-4 sm:px-8 mt-6 sm:mt-8">
                    
                    <div class="w-full flex justify-between items-center mb-2 z-10 relative">
                        <button id="btn-back-role" class="bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-full flex items-center gap-1 font-bold shadow-sm border border-gray-200 cursor-pointer transition-colors flex-shrink-0">
                            <span class="material-symbols-outlined text-xl">arrow_back</span> 返回
                        </button>
                        
                        <div class="flex items-center gap-3">
                            <button id="btn-share-arena" class="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 w-11 h-11 rounded-full shadow-sm transition-transform hover:-translate-y-1 cursor-pointer flex items-center justify-center" title="分享此設定">
                                <span class="material-symbols-outlined text-[20px]">share</span>
                            </button>
                            <button id="btn-create-space-top" class="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-lg py-2.5 px-8 rounded-full shadow-md transition-transform hover:-translate-y-1 cursor-pointer flex items-center gap-2">
                                <span class="material-symbols-outlined">rocket_launch</span> 建立空間
                            </button>
                        </div>
                    </div>

                    <div class="w-full flex flex-col items-center justify-center mb-10 z-10 relative text-center">
                        <h2 class="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-wide">空間設定</h2>
                        
                        <div id="arenaSettingsBankInfo" class="hidden text-indigo-600 font-bold text-sm md:text-base bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100 shadow-sm items-center justify-center gap-1"></div>
                        <p class="text-slate-500 font-bold arena-default-subtitle">調整你的課堂遊戲體驗</p>
                    </div>

                    <div class="w-full flex flex-col md:flex-row gap-6 flex-shrink-0">
                        <div class="flex-1 flex flex-col">
                            ${categoryHtml}
                            <div class="bg-white rounded-xl shadow-sm border border-gray-200 mb-5 overflow-hidden flex-shrink-0">
                                <div class="bg-[#eef2ff] px-4 py-3 border-b border-[#e0e7ff] flex items-center gap-2">
                                    <span class="material-symbols-outlined text-indigo-600">timer</span>
                                    <h3 class="font-bold text-indigo-900">題目與時間</h3>
                                </div>
                                <div class="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label class="block text-xs font-bold text-gray-500 mb-2">出題順序</label>
                                        <select id="host-q-order" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-400 font-bold cursor-pointer text-gray-800">
                                            <option value="random">🎲 隨機出題</option>
                                            <option value="sequential">📋 依序出題</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-gray-500 mb-2">出題數量 (共 <span id="max-q-display">${maxQ}</span> 題)</label>
                                        <input type="number" id="host-q-count" value="${Math.min(10, maxQ)}" max="${maxQ}" min="1" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-400 font-bold text-gray-800">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-gray-500 mb-2">讀題時間</label>
                                        <select id="host-pre-read" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-400 font-bold cursor-pointer text-gray-800">
                                            <option value="0">不讀題</option>
                                            <option value="3">3 秒</option>
                                            <option value="4" selected>4 秒 (預設)</option>
                                            <option value="5">5 秒</option>
                                            <option value="7">7 秒</option>
                                            <option value="10">10 秒</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-xs font-bold text-gray-500 mb-2">作答秒數</label>
                                        <select id="host-q-time" class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-400 font-bold cursor-pointer text-gray-800">
                                            <option value="5">5 秒</option>
                                            <option value="10">10 秒</option>
                                            <option value="15" selected>15 秒 (預設)</option>
                                            <option value="20">20 秒</option>
                                            <option value="30">30 秒</option>
                                            <option value="60">60 秒</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex-1 flex flex-col gap-5 flex-shrink-0">
                            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
                                <div class="bg-[#eef2ff] px-4 py-3 border-b border-[#e0e7ff] flex items-center gap-2">
                                    <span class="material-symbols-outlined text-indigo-600">desktop_windows</span>
                                    <h3 class="font-bold text-indigo-900">大螢幕顯示與自動化</h3>
                                </div>
                                <div class="p-5 flex flex-col gap-5">
                                    <div class="flex items-center justify-between">
                                        <div class="flex flex-col pr-4">
                                            <span class="font-bold text-gray-800 text-sm">顯示即時英雄榜</span>
                                            <span class="text-xs text-gray-500 mt-1">每題答完顯示神速排行</span>
                                        </div>
                                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                                            <input type="checkbox" id="host-show-scoreboard" class="sr-only peer" checked>
                                            <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                        </label>
                                    </div>
                                    <hr class="border-gray-100">
                                    <div class="flex items-center justify-between">
                                        <div class="flex flex-col pr-4">
                                            <span class="font-bold text-gray-800 text-sm">英雄榜顯示人數</span>
                                        </div>
                                        <select id="host-top-count" class="bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 font-bold text-gray-800 shrink-0 cursor-pointer">
                                            <option value="3">3 人</option>
                                            <option value="5" selected>5 人</option>
                                            <option value="10">10 人</option>
                                        </select>
                                    </div>
                                    <hr class="border-gray-100">
                                    <div class="flex items-center justify-between">
                                        <div class="flex flex-col pr-4">
                                            <span class="font-bold text-gray-800 text-sm">自動翻頁 (公佈答案)</span>
                                            <span class="text-xs text-gray-500 mt-1">公佈長條圖後自動前往下一頁</span>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" id="host-auto-reveal" class="sr-only peer">
                                                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                            </label>
                                            <input type="number" id="host-auto-reveal-time" value="10" min="3" class="w-14 border border-gray-300 rounded px-2 py-1 text-center text-sm font-bold outline-none focus:border-teal-400">
                                            <span class="text-xs font-bold text-gray-400">秒</span>
                                        </div>
                                    </div>
                                    <hr class="border-gray-100">
                                    <div class="flex items-center justify-between">
                                        <div class="flex flex-col pr-4">
                                            <span class="font-bold text-gray-800 text-sm">自動下一題 (英雄榜)</span>
                                            <span class="text-xs text-gray-500 mt-1">顯示排行後自動進入下一題</span>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" id="host-auto-board" class="sr-only peer">
                                                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                            </label>
                                            <input type="number" id="host-auto-board-time" value="5" min="3" class="w-14 border border-gray-300 rounded px-2 py-1 text-center text-sm font-bold outline-none focus:border-teal-400">
                                            <span class="text-xs font-bold text-gray-400">秒</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
                                <div class="bg-[#eef2ff] px-4 py-3 border-b border-[#e0e7ff] flex items-center gap-2">
                                    <span class="material-symbols-outlined text-indigo-600">smartphone</span>
                                    <h3 class="font-bold text-indigo-900">學生端設定</h3>
                                </div>
                                <div class="p-5 flex flex-col gap-5">
                                    <div class="flex items-center justify-between">
                                        <div class="flex flex-col pr-4">
                                            <span class="font-bold text-gray-800 text-sm">暱稱字數限制</span>
                                        </div>
                                        <select id="host-name-limit" class="bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 font-bold text-gray-800 shrink-0 cursor-pointer">
                                            <option value="5">5 字</option>
                                            <option value="8">8 字</option>
                                            <option value="10" selected>10 字 (預設)</option>
                                            <option value="15">15 字</option>
                                            <option value="20">20 字</option>
                                        </select>
                                    </div>
                                    <hr class="border-gray-100">
                                    <div class="flex items-center justify-between">
                                        <div class="flex flex-col pr-4">
                                            <span class="font-bold text-gray-800 text-sm">顯示選項文字</span>
                                            <span class="text-xs text-gray-500 mt-1">讓學生的手機直接顯示選項</span>
                                        </div>
                                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                                            <input type="checkbox" id="host-show-text" class="sr-only peer" checked>
                                            <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                        </label>
                                    </div>
                                    <hr class="border-gray-100">
                                    <div class="flex items-center justify-between">
                                        <div class="flex flex-col pr-4">
                                            <span class="font-bold text-gray-800 text-sm">允許選擇頭像 (Emoji)</span>
                                        </div>
                                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                                            <input type="checkbox" id="host-allow-emoji" class="sr-only peer" checked>
                                            <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                        </label>
                                    </div>
                                    <hr class="border-gray-100">
                                    <div class="flex items-center justify-between">
                                        <div class="flex flex-col pr-4">
                                            <span class="font-bold text-gray-800 text-sm">允許答對撒花 (互動 Emoji)</span>
                                            <span class="text-xs text-gray-500 mt-1">學生答對時可點擊表情飄浮至大螢幕</span>
                                        </div>
                                        <label class="relative inline-flex items-center cursor-pointer shrink-0">
                                            <input type="checkbox" id="host-allow-interactive-emoji" class="sr-only peer" checked>
                                            <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-back-role').addEventListener('click', cleanupArena);
        
        const catSelect = document.getElementById('host-category');
        if (catSelect) {
            catSelect.addEventListener('change', (e) => {
                const tempSettings = { filterCategory: e.target.value };
                const tempParsed = prepareQuizData(true, tempSettings);
                const newMax = tempParsed.length;
                document.getElementById('max-q-display').textContent = newMax;
                const countInput = document.getElementById('host-q-count');
                countInput.max = newMax;
                if (parseInt(countInput.value) > newMax) countInput.value = newMax;
            });
        }

        const bankInfo = document.getElementById('arenaSettingsBankInfo');
        const defaultSubtitle = arenaContainer.querySelector('.arena-default-subtitle');
        if (window.currentLoadedBank && bankInfo) {
            bankInfo.innerHTML = `<span class="material-symbols-outlined align-middle text-[18px] mr-1">library_books</span>目前題庫：${window.currentLoadedBank.name}`;
            bankInfo.classList.remove('hidden');
            if (defaultSubtitle) defaultSubtitle.classList.add('hidden');
        }

        const btnShareArena = document.getElementById('btn-share-arena');
        if (btnShareArena) {
            btnShareArena.addEventListener('click', () => {
                if (typeof window.generateGameShareLink === 'function') {
                    window.generateGameShareLink('arena');
                }
            });
        }
        
        document.getElementById('btn-create-space-top').addEventListener('click', async () => {
            // ✨ 收集包含自動化設定的所有變數
            const hostSettings = {
                filterCategory: catSelect ? catSelect.value : 'ALL',
                qOrder: document.getElementById('host-q-order').value,
                qCount: parseInt(document.getElementById('host-q-count').value, 10),
                qTime: parseInt(document.getElementById('host-q-time').value, 10),
                nameLimit: parseInt(document.getElementById('host-name-limit').value, 10),
                topCount: parseInt(document.getElementById('host-top-count').value, 10), 
                preReadTime: parseInt(document.getElementById('host-pre-read').value, 10),
                showScoreboard: document.getElementById('host-show-scoreboard').checked,
                autoNextReveal: document.getElementById('host-auto-reveal').checked,
                autoNextRevealTime: parseInt(document.getElementById('host-auto-reveal-time').value, 10),
                autoNextBoard: document.getElementById('host-auto-board').checked,
                autoNextBoardTime: parseInt(document.getElementById('host-auto-board-time').value, 10),
                showText: document.getElementById('host-show-text').checked,
                allowEmoji: document.getElementById('host-allow-emoji').checked,
                allowInteractiveEmoji: document.getElementById('host-allow-interactive-emoji').checked
            };
            const finalConfigs = { ...configs, arenaSettings: hostSettings };

            if (typeof showToast === 'function') showToast('⏳ 正在建立空間...');
            const spaceCode = await createArenaSpace(finalConfigs); 
            if (spaceCode) {
                currentSpaceCode = spaceCode; 
                renderTeacherLobby(spaceCode, finalConfigs);
            }
        });
    }

    // ✨ 老師端全域監聽器 
    function startGlobalPlayerListener(spaceCode) {
        if (unsubscribePlayers) unsubscribePlayers(); 
        
        unsubscribePlayers = db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").onSnapshot((snapshot) => {
            globalPlayers = [];
            snapshot.forEach(doc => {
                const pData = doc.data();
                globalPlayers.push(pData);
                
                if (window.currentArenaState === 'revealed' && pData.flyEmoji && pData.flyEmoji.ts > (window.lastEmojiTs[pData.name] || 0)) {
                    window.lastEmojiTs[pData.name] = pData.flyEmoji.ts;
                    spawnFloatingEmoji(pData.flyEmoji.e);
                }
            });
            
            const countEl = document.getElementById('player-count');
            const playersGrid = document.getElementById('players-grid');
            const btnStart = document.getElementById('btn-start-battle');
            if (countEl && playersGrid && window.currentArenaState === 'lobby') {
                countEl.textContent = globalPlayers.length;
                if (globalPlayers.length > 0) {
                    playersGrid.innerHTML = globalPlayers.map(p => `
                        <div class="player-card relative group cursor-pointer" data-name="${p.name}" title="點擊踢出">
                            <div class="bg-white/90 text-indigo-900 font-extrabold px-5 py-2.5 rounded-xl group-hover:line-through group-hover:bg-red-100 group-hover:text-red-600 transition-all flex items-center gap-2 shadow-lg text-lg border-2 border-transparent group-hover:border-red-300">
                                ${p.emoji ? `<span class="text-2xl">${p.emoji}</span>` : ''}
                                ${p.name}
                            </div>
                        </div>
                    `).join('');
                    if(btnStart) { btnStart.disabled = false; btnStart.classList.remove('opacity-50', 'cursor-not-allowed'); }
                } else {
                    playersGrid.innerHTML = '<div class="text-indigo-300 font-bold text-xl mt-10 animate-pulse">正在等待玩家加入...</div>';
                    if(btnStart) { btnStart.disabled = true; btnStart.classList.add('opacity-50', 'cursor-not-allowed'); }
                }
            }

            const answerCountEl = document.getElementById('answer-count-display');
            if (answerCountEl && window.currentArenaState === 'playing') {
                const answered = globalPlayers.filter(p => p.answeredQuestion === currentQIndex).length;
                
                answerCountEl.innerHTML = `${answered} <span class="text-gray-500 mx-0.5">/</span> ${globalPlayers.length}`;

                if (globalPlayers.length > 0 && answered === globalPlayers.length && !isRevealing) {
                    const btn = document.getElementById('btn-reveal-answer');
                    if (btn) btn.click();
                }
            }
        });
    }

    // ----------------------------------------------------
    // 畫面 2：老師專屬大廳
    // ----------------------------------------------------
    function renderTeacherLobby(spaceCode, finalConfigs) {
        const displayCode = spaceCode.substring(0, 2) + ' ' + spaceCode.substring(2);
        const joinUrl = window.location.origin + window.location.pathname + '?arena=' + spaceCode;
        
        window.currentArenaState = 'lobby';
        startGlobalPlayerListener(spaceCode);

        arenaContainer.innerHTML = getQrModalHtml(spaceCode) + `
            <div class="w-full h-full flex flex-col bg-indigo-900 relative font-sans overflow-y-auto select-none">
                <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(circle at 20px 20px, white 2%, transparent 0%), radial-gradient(circle at 100px 100px, white 2%, transparent 0%); background-size: 120px 120px;"></div>
                
                <div class="w-full p-4 sm:p-6 flex justify-start z-50 flex-shrink-0 relative">
                    <button id="btn-back-home" class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full flex items-center gap-1 font-bold border border-white/20 cursor-pointer backdrop-blur-sm transition-colors"><span class="material-symbols-outlined text-lg">close</span> 關閉空間</button>
                </div>

                <div class="w-full flex justify-center mt-2 sm:mt-4 z-10 px-4 flex-shrink-0 relative">
                    <div class="bg-white rounded-xl shadow-2xl flex flex-wrap sm:flex-nowrap overflow-hidden border-b-4 border-indigo-200 hover:scale-[1.02] transition-transform w-full max-w-sm sm:max-w-max" id="btn-copy-link">
                        
                        <div class="flex items-center justify-center px-6 py-4 bg-indigo-50 border-b sm:border-b-0 sm:border-r border-indigo-100 cursor-pointer w-full sm:w-auto transition-colors hover:bg-indigo-100" title="點擊複製加入網址">
                            <span class="material-symbols-outlined text-3xl text-indigo-600">link</span>
                        </div>
                        
                        <div class="flex flex-col justify-center px-10 py-3 bg-white cursor-pointer w-full sm:w-auto text-center" title="點擊複製加入網址">
                            <span class="text-xs text-gray-400 font-bold tracking-wider mb-1">空間代碼 PIN</span>
                            <span class="text-6xl font-black text-indigo-950 tracking-widest drop-shadow-sm">${displayCode}</span>
                        </div>
                        
                        <div class="p-2 bg-white border-t sm:border-t-0 sm:border-l border-gray-100 flex items-center justify-center w-full sm:w-auto">
                            <span class="material-symbols-outlined text-4xl text-indigo-600 px-5 cursor-pointer hover:scale-110 transition-transform" onclick="document.getElementById('qr-modal').classList.remove('hidden')">qr_code_2</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex-1 flex flex-col items-center mt-6 w-full max-w-6xl mx-auto px-6 pb-6 z-10 relative">
                    <div class="flex justify-between items-center w-full mb-6 bg-black/20 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/10 flex-wrap gap-4">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-3xl text-white">group</span>
                            <span class="text-2xl font-bold text-white"><span id="player-count">0</span> 人加入</span>
                        </div>
                        <button id="btn-start-battle" class="bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold py-3 px-8 rounded-xl shadow-lg transition-colors opacity-50 cursor-not-allowed text-xl flex-shrink-0" disabled>開始遊戲</button>
                    </div>
                    <div id="players-grid" class="flex flex-wrap gap-3 w-full content-start justify-center overflow-y-auto scrollbar-thin pb-4">
                        <div class="text-indigo-300 font-bold text-xl mt-10 animate-pulse">正在等待玩家加入...</div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-back-home').addEventListener('click', cleanupArena);

        document.getElementById('btn-copy-link').addEventListener('click', (e) => {
            if (e.target.tagName === 'SPAN' && e.target.textContent === 'qr_code_2') return;
            navigator.clipboard.writeText(joinUrl).then(() => showToast('🔗 已複製邀請網址！'));
        });

        document.getElementById('players-grid').addEventListener('click', async (e) => {
            const playerCard = e.target.closest('.player-card');
            if (!playerCard) return;
            const pName = playerCard.dataset.name;
            if (confirm(`確定要踢出玩家「${pName}」嗎？`)) {
                await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(pName).delete();
                showToast(`🚷 已踢出 ${pName}`);
            }
        });

        document.getElementById('btn-start-battle').addEventListener('click', () => {
            gameData = prepareQuizData(false, finalConfigs.arenaSettings);
            currentQIndex = 0;
            if (gameData.length === 0) return showToast('⚠️ 題庫解析失敗');
            triggerNextQuestion(spaceCode, finalConfigs.arenaSettings);
        });
    }

    async function triggerNextQuestion(spaceCode, arenaSettings) {
        const qData = gameData[currentQIndex];
        const preReadTime = arenaSettings.preReadTime || 0;
        isRevealing = false; 

        window.arenaIsPaused = false; 
        await db.collection(window.SPACES_COLLECTION).doc(spaceCode).update({ isPaused: false });

        if (preReadTime > 0) {
            window.currentArenaState = 'reading';
            await db.collection(window.SPACES_COLLECTION).doc(spaceCode).update({ 
                status: 'reading', 
                currentQuestion: currentQIndex,
                currentQuestionData: qData 
            });
            renderTeacherReadingView(spaceCode, arenaSettings, preReadTime);
        } else {
            window.currentArenaState = 'playing';
            await db.collection(window.SPACES_COLLECTION).doc(spaceCode).update({ 
                status: 'playing', 
                currentQuestion: currentQIndex,
                currentQuestionData: qData 
            });
            renderTeacherGameView(spaceCode, arenaSettings);
        }
    }

    // ----------------------------------------------------
    // 畫面 2-A：老師大螢幕 (讀題階段 - 支援暫停)
    // ----------------------------------------------------
    function renderTeacherReadingView(spaceCode, arenaSettings, preReadTime) {
        const qData = gameData[currentQIndex];
        let timeLeft = preReadTime;
        const displayCode = spaceCode.substring(0, 2) + ' ' + spaceCode.substring(2);
        
        arenaContainer.innerHTML = getQrModalHtml(spaceCode) + `
            <div class="w-full h-full flex flex-col bg-[#f2f2f2] relative font-sans select-none overflow-hidden">
                <div class="w-full max-w-[98%] mx-auto px-2 mt-3 sm:mt-4 flex-1 flex flex-col min-h-0">
                     <div class="w-full h-full bg-white px-8 py-8 rounded-[1.5rem] shadow-sm text-center border-b-[3px] border-gray-200 flex flex-col items-center justify-center">
                         <h2 class="text-4xl md:text-6xl lg:text-7xl font-extrabold text-[#111827] leading-tight break-words max-w-full">${qData.term}</h2>
                     </div>
                </div>

                <div class="w-full max-w-[98%] mx-auto px-2 my-2 sm:my-3 flex justify-between items-end flex-shrink-0">
                     <div class="w-16"></div> 
                     <div onclick="window.toggleArenaPause()" class="text-[6rem] md:text-[8rem] font-medium text-gray-400/80 leading-none cursor-pointer hover:text-indigo-400 transition-colors relative group" style="transform: translateY(15%);">
                         <span id="reading-countdown">${timeLeft}</span>
                         <div id="pause-overlay" class="absolute inset-0 flex items-center justify-center bg-black/10 rounded-full opacity-0 transition-opacity">
                             <span class="material-symbols-outlined text-gray-600 text-6xl">pause</span>
                         </div>
                     </div>
                     <button id="btn-skip-reading" class="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-1.5 px-5 rounded shadow-sm transition-colors cursor-pointer text-sm md:text-base">略過</button>
                </div>

                <div class="w-full bg-slate-200 flex justify-between items-center px-4 py-1 border-t border-gray-300 flex-shrink-0 mt-auto z-20">
                    <div class="text-gray-700 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-300 px-2 py-0.5 rounded transition" onclick="document.getElementById('qr-modal')?.classList.remove('hidden')">
                        <span class="text-xs text-gray-500">PIN:</span> 
                        <span class="text-base sm:text-lg tracking-widest font-black">${displayCode}</span>
                    </div>
                    <div class="text-gray-500 font-bold text-xs sm:text-sm">
                        第 ${currentQIndex + 1} / ${gameData.length} 題
                    </div>
                </div>
            </div>
        `;

        const gotoPlaying = async () => {
            clearInterval(questionTimer);
            window.currentArenaState = 'playing';
            await db.collection(window.SPACES_COLLECTION).doc(spaceCode).update({ status: 'playing', isPaused: false });
            renderTeacherGameView(spaceCode, arenaSettings);
        };

        document.getElementById('btn-skip-reading').addEventListener('click', gotoPlaying);

        questionTimer = setInterval(() => {
            // ✨ 檢查暫停狀態
            const pauseOverlay = document.getElementById('pause-overlay');
            if (window.arenaIsPaused) {
                if (pauseOverlay) pauseOverlay.classList.remove('opacity-0');
                return; 
            } else {
                if (pauseOverlay) pauseOverlay.classList.add('opacity-0');
            }

            timeLeft--;
            const timerEl = document.getElementById('reading-countdown');
            if (timerEl) timerEl.textContent = timeLeft;
            if (timeLeft <= 0) gotoPlaying();
        }, 1000);
    }

    // ----------------------------------------------------
    // 畫面 2-B：老師大螢幕 (遊戲作答中 - 完美滿版排版)
    // ----------------------------------------------------
    function renderTeacherGameView(spaceCode, arenaSettings) {
        const qData = gameData[currentQIndex];
        let timeLeft = arenaSettings.qTime || 15;
        const displayCode = spaceCode.substring(0, 2) + ' ' + spaceCode.substring(2);
        
        isRevealing = false; 
        const initialAnswered = globalPlayers.filter(p => p.answeredQuestion === currentQIndex).length;

        const triggerReveal = async () => {
            if (isRevealing) return; 
            isRevealing = true;
            clearInterval(questionTimer); 
            window.currentArenaState = 'revealed';
            
            const btn = document.getElementById('btn-reveal-answer');
            if (btn) btn.disabled = true;

            const correctText = qData.definition;
            const correctIdx = qData.options.indexOf(correctText);

            const batch = db.batch();
            globalPlayers.forEach(p => {
                if (p.answeredQuestion === currentQIndex && p.lastAnswer === correctIdx) {
                    const pRef = db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(p.name);
                    batch.update(pRef, { score: (p.score || 0) + 100 });
                }
            });
            await batch.commit();

            await db.collection(window.SPACES_COLLECTION).doc(spaceCode).update({
                status: 'revealed',
                correctIndex: correctIdx,
                isPaused: false
            });
            
            renderTeacherRevealedView(spaceCode, correctIdx, arenaSettings);
        };

        arenaContainer.innerHTML = getQrModalHtml(spaceCode) + `
            <div class="w-full h-full flex flex-col bg-[#f2f2f2] relative font-sans select-none overflow-hidden">
                
                <div class="w-full max-w-[98%] mx-auto px-2 mt-3 sm:mt-4 flex-1 flex flex-col min-h-0">
                     <div class="w-full h-full bg-white px-6 py-6 rounded-[1.5rem] shadow-sm text-center border-b-[3px] border-gray-200 flex items-center justify-center">
                         <h2 class="text-3xl md:text-5xl lg:text-6xl font-extrabold text-[#111827] leading-tight break-words max-w-full">${qData.term}</h2>
                     </div>
                </div>

                <div class="w-full max-w-[98%] mx-auto px-2 my-2 sm:my-3 flex justify-between items-end flex-shrink-0">
                     <div onclick="window.toggleArenaPause()" class="bg-[#5a2a82] text-white w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform relative overflow-hidden group" title="點擊暫停/繼續">
                         <span class="text-2xl md:text-3xl font-black text-white transition-opacity" id="timer-display">${timeLeft}</span>
                         <div id="pause-overlay" class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity">
                             <span class="material-symbols-outlined text-white text-3xl">pause</span>
                         </div>
                     </div>

                     <button id="btn-reveal-answer" class="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm md:text-base font-bold py-1.5 px-5 rounded shadow-sm transition-colors cursor-pointer">略過</button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-[98%] mx-auto px-2 flex-shrink-0 min-h-[140px] mb-3 relative z-20">
                    ${qData.options.map((opt, i) => `
                        <div class="${colorStyles[i]} rounded flex items-center px-4 py-3 md:py-4 shadow-sm text-white border-b-[4px]">
                            <span class="material-symbols-outlined text-4xl md:text-5xl mr-3 md:mr-4 drop-shadow-md flex-shrink-0">${shapeIcons[i]}</span>
                            <span class="text-xl md:text-3xl font-bold break-words flex-1 leading-tight drop-shadow-lg">${opt}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="w-full bg-slate-200 flex justify-between items-center px-4 py-1 border-t border-gray-300 flex-shrink-0 mt-auto z-20">
                    <div class="text-gray-700 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-300 px-2 py-0.5 rounded transition" onclick="document.getElementById('qr-modal')?.classList.remove('hidden')">
                        <span class="text-xs text-gray-500">PIN:</span> 
                        <span class="text-base sm:text-lg tracking-widest font-black">${displayCode}</span>
                    </div>
                    
                    <div class="font-bold text-gray-600 text-xs sm:text-sm flex items-center">
                        已答：<span id="answer-count-display" class="text-gray-800 font-black ml-1">${initialAnswered} <span class="text-gray-500 mx-0.5">/</span> ${globalPlayers.length}</span>
                    </div>

                    <div class="text-gray-500 font-bold text-xs sm:text-sm">
                        第 ${currentQIndex + 1} / ${gameData.length} 題
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-reveal-answer').addEventListener('click', triggerReveal);

        questionTimer = setInterval(() => {
            const pauseOverlay = document.getElementById('pause-overlay');
            if (window.arenaIsPaused) {
                if (pauseOverlay) pauseOverlay.classList.remove('opacity-0');
                return; 
            } else {
                if (pauseOverlay) pauseOverlay.classList.add('opacity-0');
            }

            timeLeft--;
            const timerDisplay = document.getElementById('timer-display');
            if (timerDisplay) timerDisplay.textContent = Math.max(0, timeLeft);
            if (timeLeft <= 0) triggerReveal();
        }, 1000);
    }

    // ----------------------------------------------------
    // 畫面 2-C：老師大螢幕 (公佈答案 - 支援自動下一頁)
    // ----------------------------------------------------
    function renderTeacherRevealedView(spaceCode, correctIdx, arenaSettings) {
        if (autoNextTimer) clearInterval(autoNextTimer); // 確保沒有殘留的計時器
        
        const qData = gameData[currentQIndex];
        const ansCounts = [0, 0, 0, 0];
        
        globalPlayers.forEach(p => {
            if (p.answeredQuestion === currentQIndex && p.lastAnswer >= 0 && p.lastAnswer <= 3) {
                ansCounts[p.lastAnswer]++;
            }
        });
        const maxCount = Math.max(...ansCounts, 1);
        const displayCode = spaceCode.substring(0, 2) + ' ' + spaceCode.substring(2);

        // ✨ 讀取自動翻頁設定
        let autoTime = arenaSettings.autoNextRevealTime || 10;
        const isAuto = arenaSettings.autoNextReveal === true;

        // 將前往下一頁的動作封裝，供按鈕與計時器共用
        const goToNextAction = async () => {
            clearInterval(autoNextTimer);
            if (arenaSettings.showScoreboard) {
                window.currentArenaState = 'scoreboard';
                await db.collection(window.SPACES_COLLECTION).doc(spaceCode).update({ status: 'scoreboard' });
                renderTeacherScoreboardView(spaceCode, correctIdx, arenaSettings);
            } else {
                currentQIndex++;
                if (currentQIndex >= gameData.length) {
                    window.currentArenaState = 'finished';
                    await db.collection(window.SPACES_COLLECTION).doc(spaceCode).update({ status: 'finished' });
                    renderTeacherLeaderboard(spaceCode);
                } else {
                    triggerNextQuestion(spaceCode, arenaSettings);
                }
            }
        };

        arenaContainer.innerHTML = getQrModalHtml(spaceCode) + `
            <div class="w-full h-full flex flex-col bg-[#f2f2f2] relative font-sans select-none overflow-hidden">
                
                <div class="w-full max-w-[98%] mx-auto px-2 mt-3 sm:mt-4 flex-shrink-0">
                     <div class="w-full bg-white px-6 py-4 md:py-6 rounded-[1.5rem] shadow-sm text-center border-b-[3px] border-gray-200 flex items-center justify-center min-h-[10vh]">
                         <h2 class="text-2xl md:text-4xl font-extrabold text-[#111827] leading-tight break-words max-w-full">${qData.term}</h2>
                     </div>
                </div>

                <div class="w-full max-w-[98%] mx-auto px-2 my-2 flex-1 flex justify-between items-end min-h-0 z-20">
                    <div class="w-20 sm:w-24">
                        ${isAuto ? `
                        <div onclick="window.toggleArenaPause()" class="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform relative group">
                            <span class="text-xs font-bold text-gray-400">自動翻頁</span>
                            <span class="text-3xl font-black text-teal-600 transition-opacity" id="auto-reveal-timer">${autoTime}</span>
                            <div id="pause-overlay" class="absolute inset-0 bg-white/50 opacity-0 flex items-center justify-center rounded-lg transition-opacity"><span class="material-symbols-outlined text-gray-600">pause</span></div>
                        </div>
                        ` : ''}
                    </div>

                    <div class="flex-1 flex items-end justify-center gap-4 sm:gap-12 h-full py-2 z-20">
                        ${[0, 1, 2, 3].map(i => {
                            const heightPct = maxCount === 0 ? 0 : (ansCounts[i] / maxCount) * 80;
                            const isCorrect = (i === correctIdx);
                            const count = ansCounts[i];
                            
                            const checkColorClass = colorStyles[i].split(' ')[0].replace('bg-', 'text-');
                            const checkAbove = (isCorrect && count === 0) 
                                ? `<span class="material-symbols-outlined ${checkColorClass} text-4xl md:text-5xl mb-2 drop-shadow-md z-20">check_circle</span>` 
                                : '';
                            const checkInside = (isCorrect && count > 0)
                                ? `<span class="material-symbols-outlined text-white text-xl md:text-2xl font-bold drop-shadow-md">check</span>`
                                : '';
                            
                            return `
                            <div class="flex flex-col items-center justify-end h-full w-12 sm:w-20 md:w-24 relative">
                                ${checkAbove}
                                <span class="text-xl md:text-2xl font-black mb-1 ${isCorrect ? 'text-gray-800' : 'text-gray-500'} z-10">${count}</span>
                                <div class="w-full ${colorStyles[i].split(' ')[0]} rounded-t-sm transition-all duration-1000 ease-out flex items-start justify-center pt-2 shadow-sm" style="height: ${Math.max(heightPct, 2)}%; opacity: ${isCorrect ? '1' : '0.4'}">
                                    ${checkInside}
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                    <button id="btn-next-question" class="bg-[#3b82f6] hover:bg-blue-500 text-white text-sm md:text-base font-bold py-1.5 px-5 rounded shadow transition-colors cursor-pointer border-b-[3px] border-blue-700 active:border-b-0 active:translate-y-[3px] mb-1">下一頁</button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-[98%] mx-auto px-2 flex-shrink-0 min-h-[140px] mb-3 relative z-20">
                    ${qData.options.map((opt, i) => {
                        const isCorrect = (i === correctIdx);
                        return `
                        <div class="${colorStyles[i]} rounded flex items-center px-4 py-3 md:py-4 shadow-sm text-white border-b-[4px]" style="opacity: ${isCorrect ? '1' : '0.3'}">
                            <span class="material-symbols-outlined text-4xl md:text-5xl mr-3 md:mr-4 drop-shadow-md flex-shrink-0">${shapeIcons[i]}</span>
                            <span class="text-xl md:text-3xl font-bold break-words flex-1 leading-tight drop-shadow-lg">${opt}</span>
                            ${isCorrect ? '<span class="material-symbols-outlined text-3xl md:text-4xl drop-shadow-md">check_circle</span>' : ''}
                        </div>
                    `}).join('')}
                </div>

                <div class="w-full bg-slate-200 flex justify-between items-center px-4 py-1 border-t border-gray-300 flex-shrink-0 mt-auto z-20">
                    <div class="text-gray-700 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer hover:bg-gray-300 px-2 py-0.5 rounded transition" onclick="document.getElementById('qr-modal')?.classList.remove('hidden')">
                        <span class="text-xs text-gray-500">PIN:</span> 
                        <span class="text-base sm:text-lg tracking-widest font-black">${displayCode}</span>
                    </div>
                    <div class="text-gray-500 font-bold text-xs sm:text-sm">
                        第 ${currentQIndex + 1} / ${gameData.length} 題
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-next-question').addEventListener('click', goToNextAction);

        // ✨ 啟動自動翻頁計時
        if (isAuto) {
            autoNextTimer = setInterval(() => {
                const pauseOverlay = document.getElementById('pause-overlay');
                if (window.arenaIsPaused) {
                    if (pauseOverlay) pauseOverlay.classList.remove('opacity-0');
                    return; 
                } else {
                    if (pauseOverlay) pauseOverlay.classList.add('opacity-0');
                }

                autoTime--;
                const el = document.getElementById('auto-reveal-timer');
                if (el) el.textContent = autoTime;
                if (autoTime <= 0) goToNextAction();
            }, 1000);
        }
    }

    // ----------------------------------------------------
    // 畫面 2-S：老師大螢幕 (英雄榜 - 支援自動下一題)
    // ----------------------------------------------------
    function renderTeacherScoreboardView(spaceCode, correctIdx, arenaSettings) {
        if (autoNextTimer) clearInterval(autoNextTimer); // 確保沒有殘留的計時器
        
        const topN = arenaSettings.topCount || 5;

        const currentCorrectPlayers = globalPlayers.filter(p => p.answeredQuestion === currentQIndex && p.lastAnswer === correctIdx);
        currentCorrectPlayers.sort((a, b) => (a.lastReactionTime || 999) - (b.lastReactionTime || 999));
        const topCurrent = currentCorrectPlayers.slice(0, topN);

        let topStreak = [];
        if (currentQIndex >= 2) {
            const streakPlayers = globalPlayers.filter(p => {
                let allCorrect = true;
                let totalTime = 0;
                for (let i = currentQIndex - 2; i <= currentQIndex; i++) {
                    const q = gameData[i];
                    const cIdx = q.options.indexOf(q.definition); 
                    if (p[`ans_${i}`] !== cIdx) {
                        allCorrect = false;
                        break;
                    }
                    totalTime += (p[`time_${i}`] || 999);
                }
                if (allCorrect) {
                    p.streakTime = totalTime; 
                    return true;
                }
                return false;
            });
            streakPlayers.sort((a, b) => a.streakTime - b.streakTime);
            topStreak = streakPlayers.slice(0, topN);
        }
        
        const currentGridClass = topCurrent.length > 5 ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3';
        const streakGridClass = topStreak.length > 5 ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3';
        
        // ✨ 讀取自動下一題設定
        let autoTime = arenaSettings.autoNextBoardTime || 5;
        const isAuto = arenaSettings.autoNextBoard === true;

        const goToNextQuestionAction = async () => {
            clearInterval(autoNextTimer);
            currentQIndex++;
            if (currentQIndex >= gameData.length) {
                window.currentArenaState = 'finished';
                await db.collection(window.SPACES_COLLECTION).doc(spaceCode).update({ status: 'finished' });
                renderTeacherLeaderboard(spaceCode);
            } else {
                triggerNextQuestion(spaceCode, arenaSettings);
            }
        };

        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col bg-[#2d2a6b] relative font-sans overflow-y-auto select-none pb-8">
                <div class="absolute inset-0 opacity-30 pointer-events-none" style="background-image: radial-gradient(circle at 15px 15px, #ffffff 1px, transparent 0); background-size: 50px 50px;"></div>
                
                <div class="w-full p-4 flex justify-between items-center z-50 flex-shrink-0 relative">
                    <div class="w-32">
                        ${isAuto ? `
                        <div onclick="window.toggleArenaPause()" class="flex flex-col items-center bg-white/10 px-4 py-2 rounded-xl cursor-pointer hover:bg-white/20 transition-all relative group">
                            <span class="text-xs font-bold text-indigo-200">下一題倒數</span>
                            <span class="text-3xl font-black text-yellow-300 transition-opacity" id="auto-board-timer">${autoTime}</span>
                            <div id="pause-overlay" class="absolute inset-0 bg-black/40 opacity-0 flex items-center justify-center rounded-xl transition-opacity"><span class="material-symbols-outlined text-white">pause</span></div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <button id="btn-next-from-scoreboard" class="bg-[#3b82f6] hover:bg-blue-400 text-white text-sm md:text-base font-bold py-2.5 px-6 rounded shadow transition-colors cursor-pointer flex items-center gap-1">
                        ${currentQIndex === gameData.length - 1 ? '最終英雄榜' : '下一題'} <span class="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                </div>

                <div class="flex-1 flex flex-col items-center p-4 md:p-8 z-10 w-full mt-4">
                    <div class="flex items-center justify-center gap-3 mb-8">
                        <div class="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center border-[3px] border-yellow-200 shadow-lg">
                            <span class="material-symbols-outlined text-4xl text-[#2d2a6b]">star</span>
                        </div>
                        <h2 class="text-4xl md:text-5xl font-extrabold text-white tracking-widest drop-shadow-md">英雄榜</h2>
                    </div>
                    
                    <div class="w-full max-w-6xl flex flex-col lg:flex-row gap-6">
                        <div class="flex-1 bg-[#423f85] rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col border border-white/10">
                            <div class="flex items-center justify-center gap-2 mb-8">
                                <span class="material-symbols-outlined text-yellow-300 text-3xl">bolt</span>
                                <h3 class="text-2xl font-bold text-white text-center">本題神速榜</h3>
                            </div>
                            <div class="${currentGridClass} overflow-y-auto scrollbar-thin pr-2 pb-2">
                                ${topCurrent.length > 0 ? topCurrent.map((p, i) => `
                                    <div class="flex items-center bg-white px-5 py-3 rounded-xl shadow-sm transform hover:scale-[1.02] transition-transform">
                                        <span class="text-lg font-black text-gray-400 w-8">#${i+1}</span>
                                        <span class="text-2xl mr-4">${p.emoji || '😎'}</span>
                                        <span class="text-lg md:text-xl font-bold text-gray-800 truncate flex-1">${p.name}</span>
                                    </div>
                                `).join('') : '<div class="text-center text-white/80 text-lg font-bold py-10 w-full col-span-full">這題沒有人答對哦，大家再接再厲！💪</div>'}
                            </div>
                        </div>

                        <div class="flex-1 bg-[#423f85] rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col border border-white/10 relative min-h-[250px]">
                            ${currentQIndex >= 2 ? `
                                <div class="flex items-center justify-center gap-2 mb-8">
                                    <span class="material-symbols-outlined text-orange-400 text-3xl">local_fire_department</span>
                                    <h3 class="text-2xl font-bold text-white text-center">連三題霸榜</h3>
                                </div>
                                <div class="${streakGridClass} overflow-y-auto scrollbar-thin pr-2 pb-2">
                                    ${topStreak.length > 0 ? topStreak.map((p, i) => `
                                        <div class="flex items-center bg-white px-5 py-3 rounded-xl shadow-sm transform hover:scale-[1.02] transition-transform">
                                            <span class="text-lg font-black text-orange-400 w-8">#${i+1}</span>
                                            <span class="text-2xl mr-4">${p.emoji || '🔥'}</span>
                                            <span class="text-lg md:text-xl font-bold text-gray-800 truncate flex-1">${p.name}</span>
                                        </div>
                                    `).join('') : '<div class="text-center text-white/80 text-lg font-bold py-10 w-full col-span-full">目前還沒有人連續答對三題，加把勁！🚀</div>'}
                                </div>
                            ` : `
                                <div class="absolute inset-0 flex flex-col items-center justify-center bg-transparent z-10 border-2 border-dashed border-white/20 rounded-2xl m-4">
                                    <span class="material-symbols-outlined text-5xl text-white/50 mb-4">lock</span>
                                    <p class="text-white/70 text-lg font-bold text-center">「連三題霸榜」<br>將於第 3 題解鎖 🔓</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-next-from-scoreboard').addEventListener('click', goToNextQuestionAction);

        // ✨ 啟動自動下一題計時
        if (isAuto) {
            autoNextTimer = setInterval(() => {
                const pauseOverlay = document.getElementById('pause-overlay');
                if (window.arenaIsPaused) {
                    if (pauseOverlay) pauseOverlay.classList.remove('opacity-0');
                    return; 
                } else {
                    if (pauseOverlay) pauseOverlay.classList.add('opacity-0');
                }

                autoTime--;
                const el = document.getElementById('auto-board-timer');
                if (el) el.textContent = autoTime;
                if (autoTime <= 0) goToNextQuestionAction();
            }, 1000);
        }
    }

    // ----------------------------------------------------
    // 畫面 2-D：老師最終排行榜畫面
    // ----------------------------------------------------
    function renderTeacherLeaderboard(spaceCode) {
        const sortedPlayers = [...globalPlayers].sort((a, b) => b.score - a.score);
        const p1 = sortedPlayers[0];
        const p2 = sortedPlayers[1];
        const p3 = sortedPlayers[2];
        
        const restPlayers = sortedPlayers.slice(3).map(p => {
            let maxS = 0; let curS = 0;
            for (let i = 0; i < gameData.length; i++) {
                const cIdx = gameData[i].options.indexOf(gameData[i].definition);
                if (p[`ans_${i}`] === cIdx) { curS++; maxS = Math.max(maxS, curS); }
                else { curS = 0; }
            }
            p.finalMaxStreak = maxS;
            return p;
        }).sort((a, b) => b.finalMaxStreak - a.finalMaxStreak).slice(0, 10); 

        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col items-center bg-gradient-to-b from-[#1b1947] to-[#3b276b] p-4 relative font-sans select-none overflow-y-auto">
                <div class="w-full flex justify-start z-50 flex-shrink-0">
                    <button id="btn-finish-home" class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full flex items-center gap-1 font-bold border border-white/30 cursor-pointer backdrop-blur-sm transition-colors"><span class="material-symbols-outlined text-lg">close</span> 結束遊戲</button>
                </div>
                
                <h1 class="text-5xl md:text-6xl font-extrabold text-white mb-6 mt-4 tracking-widest drop-shadow-md z-10 flex-shrink-0 text-center">最終頒獎台</h1>
                
                <div class="flex items-end justify-center gap-4 md:gap-8 h-[35vh] min-h-[250px] w-full max-w-4xl z-10 mt-2 flex-shrink-0">
                    <div id="podium-2" class="flex flex-col items-center opacity-0 transform translate-y-20 transition-all duration-700 w-1/3">
                        ${p2 ? `
                            <span class="text-5xl md:text-6xl mb-2 drop-shadow-lg">${p2.emoji || '😎'}</span>
                            <span class="text-xl md:text-2xl font-bold text-white mb-1 truncate max-w-[140px] px-2 text-center">${p2.name}</span>
                            <span class="text-lg text-indigo-200 font-bold mb-3">${p2.score} 分</span>
                            <div class="w-full bg-[#d1d5db] h-28 md:h-32 rounded-t-2xl shadow-lg flex justify-center pt-4 border-t-4 border-white/50 relative overflow-hidden">
                                <span class="text-5xl font-black text-gray-600">2</span>
                            </div>
                        ` : ''}
                    </div>
                    <div id="podium-1" class="flex flex-col items-center opacity-0 transform translate-y-20 transition-all duration-700 w-1/3 z-20">
                        ${p1 ? `
                            <span class="text-6xl md:text-[6rem] mb-2 drop-shadow-lg animate-bounce">${p1.emoji || '👑'}</span>
                            <span class="text-2xl md:text-4xl font-black text-yellow-300 mb-1 truncate max-w-[160px] px-2 text-center">${p1.name}</span>
                            <span class="text-xl text-yellow-100 font-bold mb-3">${p1.score} 分</span>
                            <div class="w-full bg-[#eab308] h-40 md:h-44 rounded-t-2xl shadow-2xl flex justify-center pt-4 border-t-4 border-yellow-200 relative overflow-hidden">
                                <span class="text-6xl font-black text-yellow-800">1</span>
                            </div>
                        ` : ''}
                    </div>
                    <div id="podium-3" class="flex flex-col items-center opacity-0 transform translate-y-20 transition-all duration-700 w-1/3">
                        ${p3 ? `
                            <span class="text-5xl md:text-6xl mb-2 drop-shadow-lg">${p3.emoji || '😎'}</span>
                            <span class="text-xl md:text-2xl font-bold text-white mb-1 truncate max-w-[140px] px-2 text-center">${p3.name}</span>
                            <span class="text-lg text-indigo-200 font-bold mb-3">${p3.score} 分</span>
                            <div class="w-full bg-[#f97316] h-20 md:h-24 rounded-t-2xl shadow-lg flex justify-center pt-4 border-t-4 border-orange-300 relative overflow-hidden">
                                <span class="text-5xl font-black text-orange-800">3</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div id="podium-rest" class="w-full max-w-4xl flex flex-col items-center mt-8 pb-10 opacity-0 transition-opacity duration-1000 z-10 flex-shrink-0">
                    ${restPlayers.length > 0 ? `<h3 class="text-xl text-indigo-200 font-bold mb-4 border-b border-indigo-400/30 pb-2">最佳連續答對榜</h3>` : ''}
                    <div class="flex flex-wrap justify-center gap-3">
                        ${restPlayers.map(p => `
                            <div class="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/20 text-white font-bold text-base flex items-center gap-2">
                                ${p.emoji || ''} ${p.name} <span class="text-yellow-300 ml-2">🔥 ${p.finalMaxStreak} 題</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        setTimeout(() => document.getElementById('podium-3')?.classList.remove('opacity-0', 'translate-y-20'), 500);
        setTimeout(() => document.getElementById('podium-2')?.classList.remove('opacity-0', 'translate-y-20'), 1500);
        setTimeout(() => {
            document.getElementById('podium-1')?.classList.remove('opacity-0', 'translate-y-20');
            if (typeof triggerConfetti === 'function') {
                triggerConfetti();
                setInterval(triggerConfetti, 3000); 
            }
        }, 3000);
        setTimeout(() => document.getElementById('podium-rest')?.classList.remove('opacity-0'), 4500);

        document.getElementById('btn-finish-home').addEventListener('click', cleanupArena);
    }

    // ----------------------------------------------------
    // 畫面 3：學生輸入代碼表單
    // ----------------------------------------------------
    function renderStudentJoinForm(prefillCode = '') {
        const emojiList = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔'];
        const randomEmojis = emojiList.sort(() => Math.random() - 0.5).slice(0, 10);
        let selectedEmoji = randomEmojis[0];

        arenaContainer.innerHTML = `
            <div class="w-full h-full bg-[#f2f2f2] relative font-sans select-none overflow-y-auto">
                <div class="min-h-full flex flex-col items-center justify-center p-4 py-10 w-full max-w-md mx-auto">
                    <div class="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-gray-200 w-full flex flex-col items-center">
                        <h2 class="text-3xl font-extrabold text-indigo-900 mb-6 tracking-wide">加入遊戲空間</h2>
                        
                        <div class="w-full mb-4">
                            <label class="block text-sm font-bold text-gray-500 mb-1 pl-2">空間代碼 PIN</label>
                            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="5" id="input-space-code" value="${prefillCode}" class="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-5 py-4 text-center text-3xl font-black text-indigo-900 focus:border-indigo-400 outline-none transition-colors tracking-widest" placeholder="輸入 5 碼代碼">
                        </div>

                        <div class="w-full mb-6">
                            <label class="block text-sm font-bold text-gray-500 mb-1 pl-2">你的暱稱</label>
                            <input type="text" id="input-player-name" class="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-5 py-4 text-center text-xl font-bold text-gray-700 focus:border-indigo-400 outline-none transition-colors" placeholder="輸入暱稱" maxlength="20">
                        </div>

                        <button id="btn-submit-join" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xl py-4 rounded-xl shadow-md transition-transform hover:-translate-y-1 cursor-pointer mb-8">進入空間！</button>

                        <div class="w-full">
                            <label class="block text-sm font-bold text-gray-500 mb-3 text-center">選擇你的代表圖示</label>
                            <div class="flex flex-wrap justify-center gap-2" id="emoji-selector">
                                ${randomEmojis.map((e, i) => `
                                    <div class="emoji-btn w-12 h-12 flex items-center justify-center text-2xl rounded-xl cursor-pointer transition-all ${i===0 ? 'bg-indigo-100 border-2 border-indigo-400 scale-110' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'}" data-emoji="${e}">
                                        ${e}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        `;

        document.getElementById('emoji-selector').addEventListener('click', (e) => {
            const btn = e.target.closest('.emoji-btn');
            if (!btn) return;
            selectedEmoji = btn.dataset.emoji;
            document.querySelectorAll('.emoji-btn').forEach(b => {
                b.className = 'emoji-btn w-12 h-12 flex items-center justify-center text-2xl rounded-xl cursor-pointer transition-all bg-gray-50 border border-gray-200 hover:bg-gray-100';
            });
            btn.className = 'emoji-btn w-12 h-12 flex items-center justify-center text-2xl rounded-xl cursor-pointer transition-all bg-indigo-100 border-2 border-indigo-400 scale-110';
        });

        document.getElementById('btn-submit-join').addEventListener('click', async () => {
            const code = document.getElementById('input-space-code').value.trim();
            const name = document.getElementById('input-player-name').value.trim();
            if (code.length !== 5 || !name) return showToast('⚠️ 格式錯誤');
            
            const btn = document.getElementById('btn-submit-join');
            btn.textContent = "連線中..."; btn.disabled = true;
            
            const spaceRef = db.collection(window.SPACES_COLLECTION).doc(code);
            try {
                const doc = await spaceRef.get();
                if (!doc.exists) throw "NOT_FOUND";
                const data = doc.data();
                if (data.status !== 'waiting') throw "ALREADY_STARTED";

                const nameLimit = (data.config && data.config.arenaSettings && data.config.arenaSettings.nameLimit) || 10;
                if (name.length > nameLimit) {
                    btn.textContent = "進入空間！"; btn.disabled = false;
                    return showToast(`⚠️ 老師設定暱稱不能超過 ${nameLimit} 個字`);
                }

                const finalEmoji = (data.config && data.config.arenaSettings && data.config.arenaSettings.allowEmoji === false) ? '' : selectedEmoji;

                await spaceRef.collection("players").doc(name).set({
                    name: name,
                    emoji: finalEmoji,
                    score: 0,
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                startStudentListener(code, name);
            } catch (err) {
                if (err === "NOT_FOUND") showToast('❌ 找不到該空間');
                else if (err === "ALREADY_STARTED") showToast('❌ 無法加入，遊戲可能已開始');
                else showToast('❌ 連線失敗');
                btn.textContent = "進入空間！"; btn.disabled = false;
            }
        });
    }

    // ----------------------------------------------------
    // 畫面 4：學生狀態監聽器
    // ----------------------------------------------------
    function startStudentListener(spaceCode, playerName) {
        window.myArenaName = playerName;
        window.myMaxStreak = 0;
        window.myCurrentStreak = 0;
        window.myTotalCorrect = 0;
        window.lastEvaluatedQ = -1; 
        
        unsubscribeStudentSelf = db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName)
            .onSnapshot((doc) => {
                if (!doc.exists) {
                    showToast('🚷 你已被老師從空間中移除');
                    if (unsubscribeSpace) unsubscribeSpace();
                    if (unsubscribeStudentSelf) unsubscribeStudentSelf();
                    renderStudentJoinForm(spaceCode); 
                } else {
                    const myDataIndex = globalPlayers.findIndex(p => p.name === playerName);
                    if (myDataIndex === -1) globalPlayers.push(doc.data());
                    else globalPlayers[myDataIndex] = doc.data();
                }
            });

        unsubscribeSpace = db.collection(window.SPACES_COLLECTION).doc(spaceCode).onSnapshot((doc) => {
            if (!doc.exists) return;
            const data = doc.data();
            const arenaSettings = data.config.arenaSettings || {};
            
            window.arenaIsPaused = data.isPaused || false;

            if (data.status === 'waiting') {
                renderStudentWaitingLobby(playerName);
            } else if (data.status === 'reading') {
                renderStudentReadingScreen(data.currentQuestionData);
            } else if (data.status === 'playing') {
                if (window.currentStudentQ !== data.currentQuestion) {
                    window.currentStudentQ = data.currentQuestion;
                    window.myLastAnswer = null; 
                    renderStudentController(spaceCode, playerName, data.currentQuestion, data.currentQuestionData, arenaSettings);
                }
            } else if (data.status === 'revealed') {
                if (window.lastEvaluatedQ !== data.currentQuestion) {
                    window.lastEvaluatedQ = data.currentQuestion;
                    if (window.myLastAnswer === data.correctIndex) {
                        window.myCurrentStreak++;
                        window.myMaxStreak = Math.max(window.myMaxStreak, window.myCurrentStreak);
                        window.myTotalCorrect++;
                    } else {
                        window.myCurrentStreak = 0;
                    }
                }
                renderStudentResultScreen(spaceCode, playerName, data.correctIndex, arenaSettings);
            } else if (data.status === 'scoreboard') {
                renderStudentScoreboardScreen();
            } else if (data.status === 'finished') {
                renderStudentFinalScreen(playerName);
            }
        });
    }

    function renderStudentWaitingLobby(playerName) {
        arenaContainer.innerHTML = `
            <div class="w-full h-full bg-[#f3f4f6] font-sans select-none overflow-y-auto">
                <div class="min-h-full flex flex-col items-center justify-center p-4 text-center">
                    <h2 class="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6 drop-shadow-sm">準備好了嗎，${playerName}！</h2>
                    <p class="text-xl md:text-2xl text-gray-500 font-bold mb-12">你已在名單上，請看著大螢幕<br>等待老師開始遊戲...</p>
                    <div class="flex justify-center gap-3">
                        <div class="w-6 h-6 bg-[#e21b3c] rounded-full animate-bounce shadow-sm" style="animation-delay: 0s;"></div>
                        <div class="w-6 h-6 bg-[#1368ce] rounded-full animate-bounce shadow-sm" style="animation-delay: 0.1s;"></div>
                        <div class="w-6 h-6 bg-[#d89e00] rounded-full animate-bounce shadow-sm" style="animation-delay: 0.2s;"></div>
                        <div class="w-6 h-6 bg-[#26890c] rounded-full animate-bounce shadow-sm" style="animation-delay: 0.3s;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderStudentReadingScreen(qData) {
        arenaContainer.innerHTML = `
            <div class="w-full h-full bg-[#f2f2f2] font-sans select-none overflow-y-auto">
                <div class="min-h-full flex flex-col items-center justify-center p-4 text-center">
                    <div class="w-full bg-white px-6 py-10 md:py-16 rounded-[2rem] shadow-sm mb-4 border-b-[4px] border-gray-200 max-w-4xl flex items-center justify-center min-h-[30vh]">
                        <h2 class="text-3xl md:text-5xl font-extrabold text-gray-800 leading-tight break-words max-w-full">${qData.term}</h2>
                    </div>
                    <p class="text-2xl text-gray-500 font-bold mt-4 animate-pulse tracking-widest">請準備作答...</p>
                </div>
            </div>
        `;
    }

    function renderStudentScoreboardScreen() {
        arenaContainer.innerHTML = `
            <div class="w-full h-full bg-[#312e81] font-sans transition-colors duration-500 select-none overflow-y-auto">
                <div class="min-h-full flex flex-col items-center justify-center p-4 text-center">
                    <div class="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-indigo-900 mb-6 shadow-lg animate-bounce">
                        <span class="material-symbols-outlined text-6xl text-indigo-900">star</span>
                    </div>
                    <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-md tracking-wider">請看大螢幕</h2>
                    <p class="text-xl md:text-2xl text-indigo-200 font-bold">目前顯示英雄榜...</p>
                </div>
            </div>
        `;
    }

    // ----------------------------------------------------
    // 畫面 5：學生作答遙控器 
    // ----------------------------------------------------
    function renderStudentController(spaceCode, playerName, qIndex, qData, arenaSettings) {
        const showText = arenaSettings && arenaSettings.showText;
        const qTime = arenaSettings.qTime || 15;
        let localTimeLeft = qTime;
        let activeMs = 0; 
        let lastTick = Date.now();

        const myData = globalPlayers.find(p => p.name === playerName) || {};
        const myEmoji = myData.emoji || '';

        if (window.currentStudentTimer) clearInterval(window.currentStudentTimer);
        
        window.currentStudentTimer = setInterval(() => {
            let now = Date.now();
            let delta = now - lastTick;
            lastTick = now;
            
            if (!window.arenaIsPaused) {
                activeMs += delta;
                localTimeLeft = Math.ceil(qTime - (activeMs / 1000));
                const timerEl = document.getElementById('student-timer-display');
                if (timerEl) timerEl.textContent = Math.max(0, localTimeLeft);
                if (localTimeLeft <= 0) clearInterval(window.currentStudentTimer);
            }
        }, 100);

        let questionHtml = '';
        if (showText && qData) {
            questionHtml = `<div class="w-full bg-white px-4 py-8 rounded-[1.5rem] shadow-sm mb-3 text-center font-extrabold text-gray-800 text-2xl md:text-4xl border-b-[3px] border-gray-200 flex-1 flex items-center justify-center break-words min-h-[25vh]">${qData.term}</div>`;
        } else {
            questionHtml = `<div class="flex-1"></div>`; 
        }

        arenaContainer.innerHTML = `
            <div class="w-full h-full bg-[#f2f2f2] font-sans select-none overflow-y-auto">
                <div class="min-h-full flex flex-col p-2 sm:p-4">
                    ${questionHtml}
                    
                    <div class="w-full flex justify-between items-center mb-3 px-2 flex-shrink-0 mt-auto">
                        <div class="bg-[#5a2a82] text-white w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-md">
                            <span class="text-2xl md:text-3xl font-black" id="student-timer-display">${localTimeLeft}</span>
                        </div>
                        <div class="bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2">
                            ${myEmoji ? `<span class="text-2xl drop-shadow-sm">${myEmoji}</span>` : ''}
                            <span class="text-xl font-bold text-gray-700">${playerName}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2 sm:gap-3 flex-shrink-0 min-h-[30vh]">
                        ${[0, 1, 2, 3].map(i => `
                            <button class="student-ans-btn w-full h-full ${colorStyles[i]} border-b-[8px] active:border-b-0 active:translate-y-[8px] rounded-xl flex flex-col sm:flex-row items-center justify-center sm:justify-start shadow-sm transition-all cursor-pointer p-4 group" data-idx="${i}">
                                <span class="material-symbols-outlined ${showText ? 'text-5xl md:text-6xl sm:mr-4 mb-2 sm:mb-0' : 'text-[90px] sm:text-[110px] mx-auto'} text-white pointer-events-none group-active:scale-95 transition-transform drop-shadow-md">${shapeIcons[i]}</span>
                                ${showText && qData ? `<span class="text-white font-bold text-xl md:text-2xl pointer-events-none text-center sm:text-left break-words flex-1 leading-tight drop-shadow-md">${qData.options[i]}</span>` : ''}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        arenaContainer.querySelectorAll('.student-ans-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (window.arenaIsPaused) return; 
                
                const ansIdx = parseInt(e.currentTarget.dataset.idx, 10);
                window.myLastAnswer = ansIdx; 
                if (window.currentStudentTimer) clearInterval(window.currentStudentTimer);
                
                const reactionTime = Number((activeMs / 1000).toFixed(2));
                
                arenaContainer.innerHTML = `
                    <div class="w-full h-full bg-gray-100 font-sans select-none overflow-y-auto">
                        <div class="min-h-full flex flex-col items-center justify-center p-4 text-center">
                            <span class="material-symbols-outlined text-8xl text-gray-400 mb-8 animate-pulse drop-shadow-sm">send</span>
                            <h2 class="text-4xl md:text-5xl font-extrabold text-gray-700 mb-6">答案已送出！</h2>
                            <p class="text-2xl text-gray-500 font-bold">請看大螢幕，等待公佈結果...</p>
                        </div>
                    </div>
                `;
                await submitArenaAnswer(spaceCode, playerName, ansIdx, qIndex, reactionTime);
            });
        });
    }

    function renderStudentResultScreen(spaceCode, playerName, correctIdx, arenaSettings) {
        const isCorrect = (window.myLastAnswer === correctIdx);
        const bgColor = isCorrect ? 'bg-green-500' : 'bg-orange-500';
        const icon = isCorrect ? 'sentiment_very_satisfied' : 'trending_up';
        const title = isCorrect ? '太棒了！答對了！' : (window.myLastAnswer === null ? '時間到囉！' : '繼續加油！');
        const subtitle = isCorrect ? '繼續保持這個好節奏！' : '沒關係，下一題會更好！';

        const allowInteractive = arenaSettings && arenaSettings.allowInteractiveEmoji !== false;

        let interactiveHtml = '';
        if (isCorrect && allowInteractive) {
            const EMOJI_BANK = Array.from("✨🎊🏋️👻😀😄😁😅😉😊🥰😍🤩🫣🤫🥳🤠😎😺😸😹😼🎉🪄⚡☄️🌟💡🗿🎂🍰🍦");
            let count = Math.min(window.myTotalCorrect || 1, 15); 
            let randomEmojis = [];
            for(let i=0; i<count; i++) randomEmojis.push(EMOJI_BANK[Math.floor(Math.random() * EMOJI_BANK.length)]);
            
            interactiveHtml = `
                <div class="mt-8 flex flex-wrap justify-center gap-3 w-full max-w-xs" id="interactive-emojis">
                    ${randomEmojis.map(e => `
                        <button class="fly-emoji-btn text-4xl md:text-5xl hover:scale-125 transition-transform bg-white/20 p-2 rounded-full cursor-pointer shadow-sm" data-char="${e}">${e}</button>
                    `).join('')}
                </div>
                <p class="text-white/60 text-sm font-bold mt-4 animate-pulse">點擊表情送至大螢幕！</p>
            `;
        }

        arenaContainer.innerHTML = `
            <div class="w-full h-full ${bgColor} font-sans transition-colors duration-500 select-none overflow-y-auto">
                <div class="min-h-full flex flex-col items-center justify-center p-4 text-center">
                    <span class="material-symbols-outlined text-9xl text-white mb-6 drop-shadow-lg scale-110">${icon}</span>
                    <h2 class="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-md tracking-wider">${title}</h2>
                    <p class="text-xl md:text-2xl text-white/90 font-bold">${subtitle}</p>
                    ${interactiveHtml}
                </div>
            </div>
        `;

        if (isCorrect && allowInteractive) {
            setTimeout(() => {
                const box = document.getElementById('interactive-emojis');
                if (!box) return;
                box.querySelectorAll('.fly-emoji-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        box.querySelectorAll('.fly-emoji-btn').forEach(b => { b.disabled = true; b.classList.add('opacity-30', 'cursor-not-allowed'); });
                        const char = e.currentTarget.dataset.char;
                        await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName).update({
                            flyEmoji: { e: char, ts: Date.now() }
                        });
                    });
                });
            }, 100);
        }
    }

    function renderStudentFinalScreen(playerName) {
        const myData = globalPlayers.find(p => p.name === playerName) || {};
        const myScore = myData.score || 0;
        const myEmoji = myData.emoji || '😎';

        arenaContainer.innerHTML = `
            <div class="w-full h-full bg-[#0f172a] font-sans select-none text-white overflow-y-auto">
                <div class="min-h-full flex flex-col items-center justify-center p-4 text-center">
                    <span class="material-symbols-outlined text-yellow-400 text-7xl mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">emoji_events</span>
                    <h2 class="text-4xl md:text-5xl font-extrabold mb-8 tracking-wide drop-shadow-md">遊戲結束！</h2>
                    
                    <div class="bg-[#1e293b] rounded-3xl p-8 border border-white/10 flex flex-col items-center w-full max-w-sm shadow-2xl mb-8">
                        <div class="flex items-center gap-3 mb-6">
                            <span class="text-5xl drop-shadow-lg">${myEmoji}</span>
                            <span class="text-3xl font-bold">${playerName}</span>
                        </div>
                        
                        <p class="text-gray-400 font-bold mb-2">總成績</p>
                        <p class="text-6xl text-yellow-400 font-black mb-8 drop-shadow-md">${myScore} <span class="text-2xl text-yellow-600 font-bold">分</span></p>
                        
                        <div class="w-full border-t border-white/10 pt-6 flex flex-col gap-3 text-gray-300 text-lg">
                            <div class="flex justify-between items-center">
                                <span class="font-bold">最高連續答對</span> 
                                <span class="font-black text-white text-xl">${window.myMaxStreak || 0} 題</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="font-bold">答對總數</span> 
                                <span class="font-black text-white text-xl">${window.myTotalCorrect || 0} / ${gameData.length}</span>
                            </div>
                        </div>
                    </div>
                    
                    <p class="text-lg text-slate-500 font-bold animate-pulse">請看大螢幕的最終排行榜</p>
                </div>
            </div>
        `;
    }

    renderRoleSelection();
};