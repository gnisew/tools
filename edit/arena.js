// =================================================================
// 連線對戰模式模組 (arena.js) - 雙榜單與正向鼓勵系統
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
    let isRevealing = false; 

    function cleanupArena() {
        if (unsubscribePlayers) unsubscribePlayers();
        if (unsubscribeSpace) unsubscribeSpace();
        if (unsubscribeStudentSelf) unsubscribeStudentSelf();
        if (questionTimer) clearInterval(questionTimer);
        if (window.currentStudentTimer) clearInterval(window.currentStudentTimer);
        
        document.body.classList.remove('is-playing-game');
        if (typeof toggleMaximizeMode === 'function') toggleMaximizeMode(false);
        arenaContainer.classList.add('hidden');
        arenaContainer.style.display = 'none';
        
        const url = new URL(window.location.href);
        if (url.searchParams.has('arena')) {
            url.searchParams.delete('arena');
            window.history.replaceState({}, document.title, url.href);
        }
        if (typeof switchMode === 'function') switchMode('table');
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
    // 畫面 1：身分選擇大廳
    // ----------------------------------------------------
    function renderRoleSelection() {
        const urlParams = new URLSearchParams(window.location.search);
        const autoJoinCode = urlParams.get('arena');
        if (autoJoinCode) return renderStudentJoinForm(autoJoinCode);

        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-4 relative font-sans">
                <div class="absolute top-4 left-4 sm:top-6 sm:left-6 z-50">
                    <button id="btn-exit-arena" class="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-full flex items-center gap-2 transition-all font-bold shadow-sm border border-gray-200 cursor-pointer"><span class="material-symbols-outlined text-xl">arrow_back</span> 返回</button>
                </div>
                <div class="text-center mb-12 mt-8">
                    <h1 class="text-5xl md:text-7xl font-extrabold mb-4 text-indigo-900 tracking-wide drop-shadow-sm">烏衣行 ARENA</h1>
                    <p class="text-lg md:text-xl text-gray-500 font-bold tracking-widest">互動連線學習平台</p>
                </div>
                <div class="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-4xl px-4">
                    <div class="flex-1 bg-white border border-gray-200 p-8 md:p-12 rounded-3xl flex flex-col items-center hover:border-indigo-400 transition-all cursor-pointer shadow-lg group" id="btn-host-settings">
                        <div class="w-24 h-24 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors"><span class="material-symbols-outlined text-6xl text-indigo-600">co_present</span></div>
                        <h2 class="text-3xl font-extrabold mb-3 text-gray-800">老師開課</h2>
                        <p class="text-gray-500 text-center font-bold">設定遊戲條件<br>並在大螢幕投影空間代碼</p>
                    </div>
                    <div class="flex-1 bg-white border border-gray-200 p-8 md:p-12 rounded-3xl flex flex-col items-center hover:border-pink-400 transition-all cursor-pointer shadow-lg group" id="btn-join-game">
                        <div class="w-24 h-24 bg-pink-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-pink-100 transition-colors"><span class="material-symbols-outlined text-6xl text-pink-500">sports_esports</span></div>
                        <h2 class="text-3xl font-extrabold mb-3 text-gray-800">學生加入</h2>
                        <p class="text-gray-500 text-center font-bold">輸入老師提供的代碼<br>與全班一起同樂</p>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('btn-exit-arena').addEventListener('click', cleanupArena);
        document.getElementById('btn-host-settings').addEventListener('click', renderHostSettings);
        document.getElementById('btn-join-game').addEventListener('click', () => renderStudentJoinForm(''));
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
                <div class="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <label class="block text-sm font-bold text-indigo-900 mb-2 flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">category</span> 題庫分類篩選</label>
                    <select id="host-category" class="w-full bg-white border border-indigo-200 rounded-lg px-4 py-3 outline-none focus:border-indigo-400 font-bold cursor-pointer text-gray-700 shadow-sm">
                        <option value="ALL" ${configs.filterCategory === 'ALL' ? 'selected' : ''}>全部題目 (混和出題)</option>
                        ${uniqueCategories.map(c => `<option value="${c}" ${configs.filterCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
            `;
        }

        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col items-center bg-slate-50 p-4 relative font-sans overflow-y-auto">
                <div class="absolute top-4 left-4 sm:top-6 sm:left-6 z-50">
                    <button id="btn-back-role" class="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-full flex items-center gap-1 font-bold shadow-sm border border-gray-200 cursor-pointer"><span class="material-symbols-outlined text-lg">arrow_back</span> 返回</button>
                </div>
                <div class="w-full max-w-4xl mt-12 mb-8 flex flex-col items-center">
                    <h2 class="text-4xl font-extrabold text-slate-800 mb-2">空間設定</h2>
                    <p class="text-slate-500 font-bold">調整你的課堂遊戲體驗</p>
                </div>
                <div class="w-full max-w-4xl bg-white p-8 rounded-[2rem] shadow-xl border border-gray-200 flex flex-col md:flex-row gap-8">
                    <div class="flex-1 flex flex-col">
                        ${categoryHtml}
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">出題順序</label>
                                <select id="host-q-order" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-indigo-400 font-bold cursor-pointer text-gray-700">
                                    <option value="random">🎲 隨機出題</option>
                                    <option value="sequential">📋 依序出題</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">出題數量 (目前共 <span id="max-q-display">${maxQ}</span> 題)</label>
                                <input type="number" id="host-q-count" value="${Math.min(10, maxQ)}" max="${maxQ}" min="1" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-indigo-400 font-bold text-gray-700">
                            </div>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">每題作答秒數</label>
                                <select id="host-q-time" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-indigo-400 font-bold cursor-pointer text-gray-700">
                                    <option value="5">5 秒 (極速)</option>
                                    <option value="10">10 秒</option>
                                    <option value="15" selected>15 秒 (預設)</option>
                                    <option value="20">20 秒</option>
                                    <option value="30">30 秒</option>
                                    <option value="60">60 秒</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">排行榜顯示人數</label>
                                <select id="host-top-count" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-indigo-400 font-bold cursor-pointer text-gray-700">
                                    <option value="3">3 人</option>
                                    <option value="5" selected>5 人 (預設)</option>
                                    <option value="10">10 人</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="flex-1 flex flex-col gap-4">
                        <div class="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-indigo-200 transition-colors">
                            <div class="flex flex-col pr-2">
                                <span class="font-bold text-gray-800 text-base">課堂讀題時間</span>
                                <span class="text-xs text-gray-500 mt-1 leading-relaxed">作答前先全螢幕顯示題目。</span>
                            </div>
                            <select id="host-pre-read" class="bg-white border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-indigo-400 font-bold text-gray-700 shrink-0">
                                <option value="0">關閉</option>
                                <option value="3">3 秒</option>
                                <option value="4" selected>4 秒 (預設)</option>
                                <option value="5">5 秒</option>
                                <option value="7">7 秒</option>
                                <option value="10">10 秒</option>
                            </select>
                        </div>

                        <div class="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-indigo-200 transition-colors">
                            <div class="flex flex-col pr-4">
                                <span class="font-bold text-gray-800 text-base">顯示即時排行榜</span>
                                <span class="text-xs text-gray-500 mt-1 leading-relaxed">每題答完後，顯示答對者的神速排行。</span>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer shrink-0">
                                <input type="checkbox" id="host-show-scoreboard" class="sr-only peer" checked>
                                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                            </label>
                        </div>

                        <div class="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-indigo-200 transition-colors">
                            <div class="flex flex-col pr-4">
                                <span class="font-bold text-gray-800 text-base">顯示選項文字</span>
                                <span class="text-xs text-gray-500 mt-1 leading-relaxed">讓學生的手機直接顯示選項。</span>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer shrink-0">
                                <input type="checkbox" id="host-show-text" class="sr-only peer" checked>
                                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                            </label>
                        </div>
                        <div class="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-indigo-200 transition-colors hidden">
                            <div class="flex flex-col pr-4">
                                <span class="font-bold text-gray-800 text-base">允許選擇頭像 (Emoji)</span>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer shrink-0">
                                <input type="checkbox" id="host-allow-emoji" class="sr-only peer" checked>
                                <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                            </label>
                        </div>
                        <div class="mt-auto pt-4">
                            <button id="btn-create-space" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xl py-4 rounded-xl shadow-md transition-transform hover:-translate-y-1 cursor-pointer flex justify-center items-center gap-2"><span class="material-symbols-outlined">rocket_launch</span> 建立空間</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-back-role').addEventListener('click', renderRoleSelection);
        
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
        
        document.getElementById('btn-create-space').addEventListener('click', async () => {
            const hostSettings = {
                filterCategory: catSelect ? catSelect.value : 'ALL',
                qOrder: document.getElementById('host-q-order').value,
                qCount: parseInt(document.getElementById('host-q-count').value, 10),
                qTime: parseInt(document.getElementById('host-q-time').value, 10),
                topCount: parseInt(document.getElementById('host-top-count').value, 10), // ✨ 記錄排行榜顯示人數
                preReadTime: parseInt(document.getElementById('host-pre-read').value, 10),
                showScoreboard: document.getElementById('host-show-scoreboard').checked,
                showText: document.getElementById('host-show-text').checked,
                allowEmoji: document.getElementById('host-allow-emoji').checked
            };
            const finalConfigs = { ...configs, arenaSettings: hostSettings };

            if (typeof showToast === 'function') showToast('⏳ 正在建立空間...');
            const spaceCode = await createArenaSpace(finalConfigs); 
            if (spaceCode) renderTeacherLobby(spaceCode, finalConfigs);
        });
    }

    // ----------------------------------------------------
    // 畫面 2：老師專屬大廳
    // ----------------------------------------------------
    function renderTeacherLobby(spaceCode, finalConfigs) {
        const displayCode = spaceCode.substring(0, 2) + ' ' + spaceCode.substring(2);
        const joinUrl = window.location.origin + window.location.pathname + '?arena=' + spaceCode;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(joinUrl)}&bgcolor=ffffff&color=312e81`;

        const qrModalHtml = `
            <div id="qr-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[10000] hidden flex items-center justify-center cursor-pointer transition-opacity" onclick="this.classList.add('hidden')">
                <div class="bg-white p-6 md:p-10 rounded-[2rem] flex flex-col items-center gap-4 shadow-2xl transform transition-transform hover:scale-105 w-[90%] max-w-sm max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                    <h2 class="text-4xl md:text-5xl font-black text-indigo-950 tracking-[0.2em] text-center">${displayCode}</h2>
                    <div class="bg-white p-2 rounded-xl shadow-inner border-2 border-indigo-50 w-full aspect-square flex items-center justify-center">
                        <img src="${qrUrl}" alt="QR Code" class="max-w-full max-h-full object-contain">
                    </div>
                    <p class="text-indigo-600 font-bold text-lg md:text-xl mt-2 flex items-center gap-2">
                        <span class="material-symbols-outlined">qr_code_scanner</span> 掃描以加入空間
                    </p>
                    <button class="mt-2 bg-indigo-100 text-indigo-700 px-8 py-3 rounded-full font-bold hover:bg-indigo-200 transition-colors w-full cursor-pointer" onclick="document.getElementById('qr-modal').classList.add('hidden')">關閉</button>
                </div>
            </div>
        `;

        arenaContainer.innerHTML = qrModalHtml + `
            <div class="w-full h-full flex flex-col bg-indigo-900 relative font-sans overflow-hidden">
                <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(circle at 20px 20px, white 2%, transparent 0%), radial-gradient(circle at 100px 100px, white 2%, transparent 0%); background-size: 120px 120px;"></div>
                <div class="absolute top-6 left-6 z-50">
                    <button id="btn-back-home" class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full flex items-center gap-1 font-bold border border-white/20 cursor-pointer backdrop-blur-sm transition-colors"><span class="material-symbols-outlined text-lg">close</span> 關閉空間</button>
                </div>

                <div class="w-full flex justify-center mt-6 sm:mt-12 z-10 px-4">
                    <div class="bg-white rounded-xl shadow-2xl flex overflow-hidden border-b-4 border-indigo-200 hover:scale-[1.02] transition-transform" id="btn-copy-link">
                        <div class="flex flex-col justify-center px-6 py-3 bg-gray-50 border-r border-gray-200 cursor-pointer" title="點擊複製加入網址">
                            <span class="text-xs text-gray-500 font-bold tracking-wider mb-1">網址加入</span>
                            <span class="text-sm text-gray-800 font-extrabold">${window.location.host}</span>
                        </div>
                        <div class="flex flex-col justify-center px-8 py-3 bg-white cursor-pointer" title="點擊複製加入網址">
                            <span class="text-xs text-gray-500 font-bold tracking-wider mb-1">空間代碼 PIN</span>
                            <span class="text-5xl font-black text-indigo-950 tracking-widest">${displayCode}</span>
                        </div>
                        <div class="p-2 bg-white border-l border-gray-200 flex items-center justify-center">
                            <img src="${qrUrl}" alt="QR Code" class="w-20 h-20 rounded-lg cursor-pointer hover:scale-110 transition-transform" onclick="document.getElementById('qr-modal').classList.remove('hidden')">
                        </div>
                    </div>
                </div>
                
                <div class="flex-1 flex flex-col items-center mt-8 w-full max-w-6xl px-6 pb-6 z-10">
                    <div class="flex justify-between items-center w-full mb-6 bg-black/20 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/10">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-3xl text-white">group</span>
                            <span class="text-2xl font-bold text-white"><span id="player-count">0</span> 人加入</span>
                        </div>
                        <button id="btn-start-battle" class="bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold py-3 px-8 rounded-xl shadow-lg transition-colors opacity-50 cursor-not-allowed text-xl" disabled>開始遊戲</button>
                    </div>
                    
                    <div id="players-grid" class="flex flex-wrap gap-3 w-full content-start justify-center overflow-y-auto scrollbar-thin max-h-[50vh]">
                        <div class="text-indigo-300 font-bold text-xl mt-10 animate-pulse">正在等待玩家加入...</div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-back-home').addEventListener('click', () => {
            if (unsubscribePlayers) unsubscribePlayers(); 
            renderRoleSelection();
        });

        document.getElementById('btn-copy-link').addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') return;
            navigator.clipboard.writeText(joinUrl).then(() => showToast('🔗 已複製邀請網址！'));
        });

        const playersGrid = document.getElementById('players-grid');
        playersGrid.addEventListener('click', async (e) => {
            const playerCard = e.target.closest('.player-card');
            if (!playerCard) return;
            const pName = playerCard.dataset.name;
            if (confirm(`確定要踢出玩家「${pName}」嗎？`)) {
                await removeArenaPlayer(spaceCode, pName);
                showToast(`🚷 已踢出 ${pName}`);
            }
        });

        unsubscribePlayers = db.collection("spaces").doc(spaceCode).collection("players").onSnapshot((snapshot) => {
            globalPlayers = [];
            snapshot.forEach(doc => globalPlayers.push(doc.data()));
            
            const countEl = document.getElementById('player-count');
            const btnStart = document.getElementById('btn-start-battle');
            
            if (countEl && btnStart) {
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
                    btnStart.disabled = false; btnStart.classList.remove('opacity-50', 'cursor-not-allowed');
                } else {
                    playersGrid.innerHTML = '<div class="text-indigo-300 font-bold text-xl mt-10 animate-pulse">正在等待玩家加入...</div>';
                    btnStart.disabled = true; btnStart.classList.add('opacity-50', 'cursor-not-allowed');
                }
            }
        });

        document.getElementById('btn-start-battle').addEventListener('click', () => {
            gameData = prepareQuizData(false, finalConfigs.arenaSettings);
            currentQIndex = 0;
            if (gameData.length === 0) return showToast('⚠️ 題庫解析失敗');
            triggerNextQuestion(spaceCode, finalConfigs.arenaSettings);
        });
    }

    // ----------------------------------------------------
    // ✨ 核心：題目狀態切換器
    // ----------------------------------------------------
    async function triggerNextQuestion(spaceCode, arenaSettings) {
        const qData = gameData[currentQIndex];
        const preReadTime = arenaSettings.preReadTime || 0;
        isRevealing = false; 

        if (preReadTime > 0) {
            await db.collection("spaces").doc(spaceCode).update({ 
                status: 'reading', 
                currentQuestion: currentQIndex,
                currentQuestionData: qData 
            });
            renderTeacherReadingView(spaceCode, arenaSettings, preReadTime);
        } else {
            await db.collection("spaces").doc(spaceCode).update({ 
                status: 'playing', 
                currentQuestion: currentQIndex,
                currentQuestionData: qData 
            });
            renderTeacherGameView(spaceCode, arenaSettings);
        }
    }

    // ----------------------------------------------------
    // 畫面 2-A：老師大螢幕 (讀題階段 - 巨大顯示)
    // ----------------------------------------------------
    function renderTeacherReadingView(spaceCode, arenaSettings, preReadTime) {
        const qData = gameData[currentQIndex];
        let timeLeft = preReadTime;
        
        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col bg-[#f2f2f2] relative font-sans items-center justify-center p-8">
                <div class="absolute top-4 right-6 z-50">
                    <button id="btn-skip-reading" class="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-2 px-6 rounded shadow-sm transition-colors cursor-pointer text-sm md:text-base">略過</button>
                </div>
                
                <div class="absolute top-4 right-[120px] text-lg font-bold text-gray-500 bg-white px-4 py-1 rounded-md shadow-sm border border-gray-200">
                    第 ${currentQIndex + 1} / ${gameData.length} 題
                </div>
                
                <div class="bg-white px-10 py-12 rounded-lg shadow-sm border-b-[3px] border-gray-200 w-full max-w-4xl text-center mb-12">
                    <h2 class="text-4xl md:text-6xl font-extrabold text-gray-800 leading-tight">${qData.term}</h2>
                </div>
                
                <div class="text-4xl font-black text-gray-400" id="read-timer-display">
                    ${timeLeft}
                </div>
            </div>
        `;

        const gotoPlaying = async () => {
            clearInterval(questionTimer);
            await db.collection("spaces").doc(spaceCode).update({ status: 'playing' });
            renderTeacherGameView(spaceCode, arenaSettings);
        };

        document.getElementById('btn-skip-reading').addEventListener('click', gotoPlaying);

        questionTimer = setInterval(() => {
            timeLeft--;
            const timerEl = document.getElementById('read-timer-display');
            if (timerEl) timerEl.textContent = timeLeft;
            if (timeLeft <= 0) gotoPlaying();
        }, 1000);
    }

    // ----------------------------------------------------
    // 畫面 2-B：老師大螢幕 (遊戲作答中 - Kahoot 版面)
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
            
            const btn = document.getElementById('btn-reveal-answer');
            if (btn) btn.disabled = true;

            const correctText = qData.definition;
            const correctIdx = qData.options.indexOf(correctText);

            const batch = db.batch();
            globalPlayers.forEach(p => {
                if (p.answeredQuestion === currentQIndex && p.lastAnswer === correctIdx) {
                    const pRef = db.collection("spaces").doc(spaceCode).collection("players").doc(p.name);
                    batch.update(pRef, { score: (p.score || 0) + 100 });
                }
            });
            await batch.commit();

            await db.collection("spaces").doc(spaceCode).update({
                status: 'revealed',
                correctIndex: correctIdx
            });
            
            renderTeacherRevealedView(spaceCode, correctIdx, arenaSettings);
        };

        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col bg-[#f2f2f2] relative font-sans">
                <div class="flex justify-between items-start w-full p-4 relative z-10 min-h-[120px]">
                    <div class="w-20 md:w-24">
                        <div class="bg-purple-800 text-white w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shadow-md">
                            <span class="text-2xl md:text-4xl font-black" id="timer-display">${timeLeft}</span>
                        </div>
                    </div> 
                    <div class="bg-white px-6 py-4 md:py-8 rounded shadow-sm text-center max-w-4xl flex-1 mx-2 md:mx-6 flex items-center justify-center border-b-[3px] border-gray-200">
                        <h2 class="text-2xl md:text-4xl font-extrabold text-gray-800 leading-tight">${qData.term}</h2>
                    </div>
                    <div class="w-20 md:w-24 flex justify-end">
                        <button id="btn-reveal-answer" class="bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm md:text-base font-bold py-2 px-4 rounded shadow-sm transition-colors cursor-pointer">略過</button>
                    </div>
                </div>

                <div class="flex-1 flex items-center justify-end px-8 relative">
                    <div class="bg-purple-800 text-white w-16 h-16 md:w-20 md:h-20 rounded-full flex flex-col items-center justify-center shadow-md mb-8">
                        <span class="text-xl md:text-2xl font-black mt-1" id="answer-count-display">${initialAnswered}<span class="text-sm md:text-base mx-1">/</span>${globalPlayers.length}</span>
                        <span class="text-[10px] md:text-xs font-bold mb-1 opacity-80">已答/總數</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2 w-full p-2 h-[35%] min-h-[180px]">
                    ${qData.options.map((opt, i) => `
                        <div class="${colorStyles[i]} rounded flex items-center px-4 py-2 shadow-sm text-white border-b-[4px]">
                            <span class="material-symbols-outlined text-4xl md:text-5xl mr-3 md:mr-4 drop-shadow-md">${shapeIcons[i]}</span>
                            <span class="text-xl md:text-3xl font-bold break-words flex-1 leading-tight drop-shadow-md">${opt}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="w-full bg-white flex justify-between items-center px-4 py-1.5 border-t border-gray-200">
                    <div class="text-gray-800 font-bold text-sm flex items-center gap-2">
                        <span class="text-gray-500">PIN:</span> 
                        <span class="text-xl tracking-widest font-black">${displayCode}</span>
                    </div>
                    <div class="text-gray-500 font-bold text-sm">
                        第 ${currentQIndex + 1} / ${gameData.length} 題
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-reveal-answer').addEventListener('click', triggerReveal);

        questionTimer = setInterval(() => {
            timeLeft--;
            const timerDisplay = document.getElementById('timer-display');
            if (timerDisplay) timerDisplay.textContent = Math.max(0, timeLeft);
            if (timeLeft <= 0) {
                triggerReveal();
            }
        }, 1000);

        if (unsubscribePlayers) unsubscribePlayers(); 
        unsubscribePlayers = db.collection("spaces").doc(spaceCode).collection("players").onSnapshot((snapshot) => {
            globalPlayers = [];
            snapshot.forEach(doc => globalPlayers.push(doc.data()));
            const answerCountEl = document.getElementById('answer-count-display');
            if (answerCountEl) {
                const answered = globalPlayers.filter(p => p.answeredQuestion === currentQIndex).length;
                answerCountEl.innerHTML = `${answered}<span class="text-sm md:text-base mx-1">/</span>${globalPlayers.length}`;

                if (globalPlayers.length > 0 && answered === globalPlayers.length) {
                    triggerReveal();
                }
            }
        });
    }

    // ----------------------------------------------------
    // 畫面 2-C：老師大螢幕 (公佈長條圖與正確答案)
    // ----------------------------------------------------
    function renderTeacherRevealedView(spaceCode, correctIdx, arenaSettings) {
        const qData = gameData[currentQIndex];
        const ansCounts = [0, 0, 0, 0];
        
        globalPlayers.forEach(p => {
            if (p.answeredQuestion === currentQIndex && p.lastAnswer >= 0 && p.lastAnswer <= 3) {
                ansCounts[p.lastAnswer]++;
            }
        });
        const maxCount = Math.max(...ansCounts, 1);
        const displayCode = spaceCode.substring(0, 2) + ' ' + spaceCode.substring(2);

        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col bg-[#f2f2f2] relative font-sans">
                <div class="flex justify-between items-start w-full p-4 relative z-10 min-h-[120px]">
                    <div class="w-20 md:w-24"></div> 
                    <div class="bg-white px-6 py-4 md:py-8 rounded shadow-sm text-center max-w-4xl flex-1 mx-2 md:mx-6 flex items-center justify-center border-b-[3px] border-gray-200">
                        <h2 class="text-2xl md:text-4xl font-extrabold text-gray-800 leading-tight">${qData.term}</h2>
                    </div>
                    <div class="w-20 md:w-24 flex justify-end">
                        <button id="btn-next-question" class="bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-lg font-bold py-2 px-4 rounded shadow transition-colors cursor-pointer border-b-[3px] border-blue-800 active:border-b-0 active:translate-y-[3px]">
                            下一頁
                        </button>
                    </div>
                </div>

                <div class="flex-1 flex items-end justify-center px-8 pb-4 relative z-10">
                    <div class="flex items-end justify-center gap-4 sm:gap-8 h-[80%] w-full max-w-2xl">
                        ${[0, 1, 2, 3].map(i => {
                            const heightPct = maxCount === 0 ? 0 : (ansCounts[i] / maxCount) * 100;
                            const isCorrect = (i === correctIdx);
                            return `
                            <div class="flex flex-col items-center justify-end h-full w-16 sm:w-24 relative">
                                <span class="text-2xl font-black mb-1 ${isCorrect ? 'text-gray-800' : 'text-gray-500'} z-10">${ansCounts[i]}</span>
                                <div class="w-full ${colorStyles[i].split(' ')[0]} rounded-t-sm transition-all duration-1000 ease-out flex items-start justify-center pt-2 shadow-sm" style="height: ${Math.max(heightPct, 2)}%; opacity: ${isCorrect ? '1' : '0.4'}">
                                    ${isCorrect ? '<span class="material-symbols-outlined text-white text-2xl font-bold">check</span>' : ''}
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2 w-full p-2 h-[30%] min-h-[160px]">
                    ${qData.options.map((opt, i) => {
                        const isCorrect = (i === correctIdx);
                        return `
                        <div class="${colorStyles[i]} rounded flex items-center px-4 py-2 shadow-sm text-white border-b-[4px]" style="opacity: ${isCorrect ? '1' : '0.3'}">
                            <span class="material-symbols-outlined text-3xl md:text-4xl mr-3 drop-shadow-md">${shapeIcons[i]}</span>
                            <span class="text-lg md:text-2xl font-bold break-words flex-1 leading-tight drop-shadow-md">${opt}</span>
                            ${isCorrect ? '<span class="material-symbols-outlined text-3xl drop-shadow-md">check_circle</span>' : ''}
                        </div>
                    `}).join('')}
                </div>

                <div class="w-full bg-white flex justify-between items-center px-4 py-2 border-t border-gray-200">
                    <div class="text-gray-800 font-bold text-sm md:text-base flex items-center gap-2">
                        <span class="text-xs md:text-sm text-gray-500">PIN:</span> 
                        <span class="text-xl md:text-2xl tracking-widest font-black text-gray-900">${displayCode}</span>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-next-question').addEventListener('click', async () => {
            if (arenaSettings.showScoreboard) {
                await db.collection("spaces").doc(spaceCode).update({ status: 'scoreboard' });
                renderTeacherScoreboardView(spaceCode, correctIdx, arenaSettings);
            } else {
                currentQIndex++;
                if (currentQIndex >= gameData.length) {
                    await db.collection("spaces").doc(spaceCode).update({ status: 'finished' });
                    renderTeacherLeaderboard(spaceCode);
                } else {
                    triggerNextQuestion(spaceCode, arenaSettings);
                }
            }
        });
    }

    // ----------------------------------------------------
    // ✨ 畫面 2-S：老師大螢幕 (答對神速記分板 - 雙榜單)
    // ----------------------------------------------------
    function renderTeacherScoreboardView(spaceCode, correctIdx, arenaSettings) {
        const topN = arenaSettings.topCount || 5;

        // 1. 左側：本題神速榜 (只看當前這題答對的人，依秒數排序)
        const currentCorrectPlayers = globalPlayers.filter(p => p.answeredQuestion === currentQIndex && p.lastAnswer === correctIdx);
        currentCorrectPlayers.sort((a, b) => (a.lastReactionTime || 999) - (b.lastReactionTime || 999));
        const topCurrent = currentCorrectPlayers.slice(0, topN);

        // 2. 右側：連三題霸榜 (從第 3 題開始解鎖)
        let topStreak = [];
        if (currentQIndex >= 2) {
            const streakPlayers = globalPlayers.filter(p => {
                let allCorrect = true;
                let totalTime = 0;
                // 檢查最近的三題是否全對
                for (let i = currentQIndex - 2; i <= currentQIndex; i++) {
                    const q = gameData[i];
                    const cIdx = q.options.indexOf(q.definition); // 取得歷史正確答案的 index
                    const pAns = p[`ans_${i}`];
                    const pTime = p[`time_${i}`] || 999;
                    if (pAns !== cIdx) {
                        allCorrect = false;
                        break;
                    }
                    totalTime += pTime;
                }
                if (allCorrect) {
                    p.streakTime = totalTime; // 暫存總秒數供排序使用
                    return true;
                }
                return false;
            });
            streakPlayers.sort((a, b) => a.streakTime - b.streakTime);
            topStreak = streakPlayers.slice(0, topN);
        }
        
        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col bg-indigo-900 relative font-sans overflow-hidden">
                <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(circle at 20px 20px, white 2%, transparent 0%), radial-gradient(circle at 100px 100px, white 2%, transparent 0%); background-size: 120px 120px;"></div>
                
                <div class="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 w-full">
                    <span class="material-symbols-outlined text-6xl md:text-7xl text-yellow-400 mb-2 drop-shadow-md">stars</span>
                    <h2 class="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-widest drop-shadow-md">英雄榜</h2>
                    
                    <div class="w-full max-w-5xl flex flex-col md:flex-row gap-6 max-h-[60vh]">
                        
                        <div class="flex-1 bg-white/10 backdrop-blur-md rounded-3xl p-4 md:p-6 border border-white/20 shadow-2xl flex flex-col">
                            <div class="flex items-center justify-center gap-2 mb-4">
                                <span class="material-symbols-outlined text-yellow-300 text-3xl">bolt</span>
                                <h3 class="text-2xl font-bold text-white text-center">本題神速榜</h3>
                            </div>
                            <div class="flex flex-col gap-2 overflow-y-auto scrollbar-thin pr-2">
                                ${topCurrent.length > 0 ? topCurrent.map((p, i) => `
                                    <div class="flex items-center bg-white px-4 py-3 rounded-xl shadow-sm transform hover:scale-[1.02] transition-transform">
                                        <span class="text-xl font-black text-gray-400 w-8">#${i+1}</span>
                                        <span class="text-2xl mr-3">${p.emoji || '😎'}</span>
                                        <span class="text-xl font-bold text-gray-800 truncate flex-1">${p.name}</span>
                                    </div>
                                `).join('') : '<div class="text-center text-white/80 text-lg font-bold py-6">這題還沒有人上榜哦，大家繼續加油！💪</div>'}
                            </div>
                        </div>

                        ${currentQIndex >= 2 ? `
                        <div class="flex-1 bg-white/10 backdrop-blur-md rounded-3xl p-4 md:p-6 border border-white/20 shadow-2xl flex flex-col">
                            <div class="flex items-center justify-center gap-2 mb-4">
                                <span class="material-symbols-outlined text-orange-400 text-3xl">local_fire_department</span>
                                <h3 class="text-2xl font-bold text-white text-center">連三題霸榜</h3>
                            </div>
                            <div class="flex flex-col gap-2 overflow-y-auto scrollbar-thin pr-2">
                                ${topStreak.length > 0 ? topStreak.map((p, i) => `
                                    <div class="flex items-center bg-white px-4 py-3 rounded-xl shadow-sm transform hover:scale-[1.02] transition-transform">
                                        <span class="text-xl font-black text-orange-400 w-8">#${i+1}</span>
                                        <span class="text-2xl mr-3">${p.emoji || '🔥'}</span>
                                        <span class="text-xl font-bold text-gray-800 truncate flex-1">${p.name}</span>
                                    </div>
                                `).join('') : '<div class="text-center text-white/80 text-lg font-bold py-6">目前還沒有人連續答對三題，加把勁！🚀</div>'}
                            </div>
                        </div>
                        ` : `
                        <div class="flex-1 flex flex-col items-center justify-center opacity-60 border-2 border-dashed border-white/30 rounded-3xl p-6 bg-white/5">
                            <span class="material-symbols-outlined text-5xl text-white mb-3">lock</span>
                            <p class="text-white text-lg font-bold text-center">「連三題霸榜」<br>將於第 3 題解鎖 🔓</p>
                        </div>
                        `}
                    </div>

                    <div class="mt-8 md:mt-10">
                        <button id="btn-next-from-scoreboard" class="bg-blue-500 hover:bg-blue-400 text-white text-lg md:text-xl font-extrabold py-3 px-10 rounded-full shadow-lg transition-transform hover:-translate-y-1 cursor-pointer flex items-center gap-2">
                            ${currentQIndex === gameData.length - 1 ? '顯示最終排行榜 <span class="material-symbols-outlined text-2xl">emoji_events</span>' : '下一題 <span class="material-symbols-outlined text-2xl">arrow_forward</span>'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-next-from-scoreboard').addEventListener('click', async () => {
            currentQIndex++;
            if (currentQIndex >= gameData.length) {
                await db.collection("spaces").doc(spaceCode).update({ status: 'finished' });
                renderTeacherLeaderboard(spaceCode);
            } else {
                triggerNextQuestion(spaceCode, arenaSettings);
            }
        });
    }

    // ----------------------------------------------------
    // 畫面 2-D：老師最終排行榜畫面
    // ----------------------------------------------------
    function renderTeacherLeaderboard(spaceCode) {
        const sortedPlayers = [...globalPlayers].sort((a, b) => b.score - a.score);
        const top3 = sortedPlayers.slice(0, 3);

        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-indigo-900 to-purple-900 p-4 relative font-sans">
                <div class="absolute top-6 left-6 z-50">
                    <button id="btn-finish-home" class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full flex items-center gap-1 font-bold border border-white/30 cursor-pointer backdrop-blur-sm"><span class="material-symbols-outlined text-lg">close</span> 結束遊戲</button>
                </div>
                
                <span class="material-symbols-outlined text-9xl text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]">emoji_events</span>
                <h1 class="text-6xl font-extrabold text-white mb-12 tracking-widest drop-shadow-md">最終排行榜</h1>
                
                <div class="w-full max-w-2xl flex flex-col gap-4">
                    ${top3.map((p, i) => {
                        let rankStyle = "bg-white text-gray-800";
                        let badgeStyle = "text-gray-500";
                        if (i === 0) { rankStyle = "bg-gradient-to-r from-yellow-300 to-yellow-500 text-white scale-110 z-10 shadow-2xl"; badgeStyle = "text-white"; }
                        else if (i === 1) { rankStyle = "bg-gray-200 text-gray-800"; badgeStyle = "text-gray-600"; }
                        else if (i === 2) { rankStyle = "bg-orange-300 text-orange-900"; badgeStyle = "text-orange-800"; }

                        return `
                        <div class="flex items-center justify-between px-8 py-5 rounded-2xl shadow-lg transition-transform ${rankStyle}">
                            <div class="flex items-center gap-6">
                                <span class="text-4xl font-black ${badgeStyle}">#${i+1}</span>
                                <span class="text-4xl font-bold">${p.emoji ? p.emoji + ' ' : ''}${p.name}</span>
                            </div>
                            <span class="text-4xl font-extrabold">${p.score} 分</span>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        if (typeof triggerConfetti === 'function') {
            setInterval(triggerConfetti, 2000); 
        }

        document.getElementById('btn-finish-home').addEventListener('click', () => {
            if (unsubscribePlayers) unsubscribePlayers(); 
            renderRoleSelection();
        });
    }

    // ----------------------------------------------------
    // 畫面 3：學生輸入代碼表單 (無返回鍵)
    // ----------------------------------------------------
    function renderStudentJoinForm(prefillCode = '') {
        const emojiList = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔'];
        const randomEmojis = emojiList.sort(() => Math.random() - 0.5).slice(0, 10);
        let selectedEmoji = randomEmojis[0];

        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center bg-indigo-50 p-4 relative font-sans">
                <div class="bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl border border-gray-100 w-full max-w-md flex flex-col items-center">
                    <h2 class="text-3xl font-extrabold text-indigo-900 mb-6 tracking-wide">加入遊戲空間</h2>
                    
                    <div class="w-full mb-4">
                        <label class="block text-sm font-bold text-gray-500 mb-1 pl-2">空間代碼 PIN</label>
                        <input type="number" id="input-space-code" value="${prefillCode}" class="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-5 py-4 text-center text-3xl font-black text-indigo-900 focus:border-indigo-400 outline-none transition-colors tracking-widest" placeholder="輸入 5 碼代碼">
                    </div>

                    <div class="w-full mb-6">
                        <label class="block text-sm font-bold text-gray-500 mb-1 pl-2">你的暱稱</label>
                        <input type="text" id="input-player-name" class="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-5 py-4 text-center text-xl font-bold text-gray-700 focus:border-indigo-400 outline-none transition-colors" placeholder="輸入暱稱" maxlength="10">
                    </div>

                    <div class="w-full mb-8">
                        <label class="block text-sm font-bold text-gray-500 mb-2 pl-2 text-center">選擇你的代表圖示</label>
                        <div class="flex flex-wrap justify-center gap-2" id="emoji-selector">
                            ${randomEmojis.map((e, i) => `
                                <div class="emoji-btn w-12 h-12 flex items-center justify-center text-2xl rounded-xl cursor-pointer transition-all ${i===0 ? 'bg-indigo-100 border-2 border-indigo-400 scale-110' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'}" data-emoji="${e}">
                                    ${e}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <button id="btn-submit-join" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xl py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 cursor-pointer">進入空間！</button>
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
            
            const spaceRef = db.collection("spaces").doc(code);
            try {
                const doc = await spaceRef.get();
                if (!doc.exists) throw "NOT_FOUND";
                const data = doc.data();
                if (data.status !== 'waiting') throw "ALREADY_STARTED";

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
        
        unsubscribeStudentSelf = db.collection("spaces").doc(spaceCode).collection("players").doc(playerName)
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

        unsubscribeSpace = db.collection("spaces").doc(spaceCode).onSnapshot((doc) => {
            if (!doc.exists) return;
            const data = doc.data();
            const arenaSettings = data.config.arenaSettings || {};
            
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
                renderStudentResultScreen(data.correctIndex);
            } else if (data.status === 'scoreboard') {
                renderStudentScoreboardScreen();
            } else if (data.status === 'finished') {
                renderStudentFinalScreen(playerName);
            }
        });
    }

    function renderStudentWaitingLobby(playerName) {
        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center bg-[#f3f4f6] p-4 font-sans text-center">
                <h2 class="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6">準備好了嗎，${playerName}！</h2>
                <p class="text-xl md:text-2xl text-gray-500 font-bold mb-12">你已在名單上，請看著大螢幕<br>等待老師開始遊戲...</p>
                <div class="flex justify-center gap-3">
                    <div class="w-6 h-6 bg-blue-500 rounded-full animate-bounce shadow-sm" style="animation-delay: 0s;"></div>
                    <div class="w-6 h-6 bg-red-500 rounded-full animate-bounce shadow-sm" style="animation-delay: 0.1s;"></div>
                    <div class="w-6 h-6 bg-yellow-500 rounded-full animate-bounce shadow-sm" style="animation-delay: 0.2s;"></div>
                </div>
            </div>
        `;
    }

    function renderStudentReadingScreen(qData) {
        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center bg-[#f2f2f2] p-4 font-sans text-center">
                <div class="w-full bg-white px-6 py-8 rounded-xl shadow-sm mb-4 border border-gray-200 max-w-3xl">
                    <h2 class="text-3xl md:text-5xl font-extrabold text-gray-800 leading-tight">${qData.term}</h2>
                </div>
                <p class="text-xl text-gray-500 font-bold mt-4 animate-pulse">請準備作答...</p>
            </div>
        `;
    }

    function renderStudentScoreboardScreen() {
        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center bg-indigo-600 p-4 font-sans text-center transition-colors duration-500">
                <span class="material-symbols-outlined text-8xl text-yellow-300 mb-6 drop-shadow-lg">stars</span>
                <h2 class="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-md tracking-wider">請看大螢幕</h2>
                <p class="text-xl md:text-2xl text-indigo-100 font-bold">目前顯示英雄榜...</p>
            </div>
        `;
    }

    // ----------------------------------------------------
    // 畫面 5：學生作答遙控器
    // ----------------------------------------------------
    function renderStudentController(spaceCode, playerName, qIndex, qData, arenaSettings) {
        const showText = arenaSettings && arenaSettings.showText;
        const qTime = arenaSettings.qTime || 15;
        let timeLeft = qTime;

        const renderTime = Date.now();
        const myData = globalPlayers.find(p => p.name === playerName) || {};
        const myEmoji = myData.emoji || '';

        if (window.currentStudentTimer) clearInterval(window.currentStudentTimer);
        window.currentStudentTimer = setInterval(() => {
            timeLeft--;
            const timerEl = document.getElementById('student-timer-display');
            if (timerEl) timerEl.textContent = Math.max(0, timeLeft);
            if (timeLeft <= 0) clearInterval(window.currentStudentTimer);
        }, 1000);

        let questionHtml = '';
        if (showText && qData) {
            questionHtml = `<div class="w-full bg-white px-4 py-4 rounded shadow-sm mb-3 text-center font-extrabold text-gray-800 text-xl md:text-3xl border border-gray-200 flex-shrink-0">${qData.term}</div>`;
        }

        arenaContainer.innerHTML = `
            <div class="w-full h-full bg-[#f2f2f2] p-2 sm:p-4 font-sans flex flex-col">
                ${questionHtml}
                
                <div class="w-full flex justify-between items-center mb-3 px-2 flex-shrink-0">
                    <div class="bg-purple-800 text-white w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-md">
                        <span class="text-xl md:text-2xl font-black" id="student-timer-display">${timeLeft}</span>
                    </div>
                    <div class="bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
                        ${myEmoji ? `<span class="text-xl">${myEmoji}</span>` : ''}
                        <span class="text-lg font-bold text-gray-700">${playerName}</span>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2 sm:gap-3 flex-1">
                    ${[0, 1, 2, 3].map(i => `
                        <button class="student-ans-btn w-full h-full ${colorStyles[i]} border-b-[6px] active:border-b-0 active:translate-y-[6px] rounded flex flex-col sm:flex-row items-center justify-center sm:justify-start shadow-sm transition-all cursor-pointer p-3 md:p-4 group" data-idx="${i}">
                            <span class="material-symbols-outlined ${showText ? 'text-4xl md:text-5xl sm:mr-3 mb-2 sm:mb-0' : 'text-[80px] sm:text-[100px] mx-auto'} text-white pointer-events-none group-active:scale-95 transition-transform drop-shadow-md">${shapeIcons[i]}</span>
                            ${showText && qData ? `<span class="text-white font-bold text-lg md:text-2xl pointer-events-none text-center sm:text-left break-words flex-1 leading-tight drop-shadow-md">${qData.options[i]}</span>` : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        arenaContainer.querySelectorAll('.student-ans-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const ansIdx = parseInt(e.currentTarget.dataset.idx, 10);
                window.myLastAnswer = ansIdx; 
                if (window.currentStudentTimer) clearInterval(window.currentStudentTimer);
                
                const reactionTime = Number(((Date.now() - renderTime) / 1000).toFixed(2));
                
                arenaContainer.innerHTML = `
                    <div class="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4 font-sans text-center">
                        <span class="material-symbols-outlined text-8xl text-gray-400 mb-8 animate-pulse drop-shadow-sm">send</span>
                        <h2 class="text-4xl md:text-5xl font-extrabold text-gray-700 mb-6">答案已送出！</h2>
                        <p class="text-2xl text-gray-500 font-bold">請看大螢幕，等待公佈結果...</p>
                    </div>
                `;
                await submitArenaAnswer(spaceCode, playerName, ansIdx, qIndex, reactionTime);
            });
        });
    }

    // ✨ 畫面 6：學生對錯結算畫面
    function renderStudentResultScreen(correctIdx) {
        const isCorrect = (window.myLastAnswer === correctIdx);
        const bgColor = isCorrect ? 'bg-green-500' : 'bg-orange-500';
        const icon = isCorrect ? 'sentiment_very_satisfied' : 'trending_up';
        
        const title = isCorrect ? '太棒了！答對了！' : (window.myLastAnswer === null ? '時間到囉！' : '繼續加油！');
        const subtitle = isCorrect ? '繼續保持這個好節奏！' : '沒關係，下一題會更好！';

        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center ${bgColor} p-4 font-sans text-center transition-colors duration-500">
                <span class="material-symbols-outlined text-9xl text-white mb-6 drop-shadow-lg scale-110">${icon}</span>
                <h2 class="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-md tracking-wider">${title}</h2>
                <p class="text-xl md:text-2xl text-white/90 font-bold">${subtitle}</p>
            </div>
        `;
    }

    function renderStudentFinalScreen(playerName) {
        const myData = globalPlayers.find(p => p.name === playerName);
        const myScore = myData ? myData.score : 0;

        arenaContainer.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-4 font-sans text-center">
                <span class="material-symbols-outlined text-9xl text-yellow-400 mb-6 drop-shadow-lg">emoji_events</span>
                <h2 class="text-5xl font-extrabold text-white mb-2 drop-shadow-md">遊戲結束！</h2>
                <p class="text-4xl text-indigo-400 font-black mb-8 border-b-2 border-indigo-500/30 pb-4 inline-block">獲得 ${myScore} 分</p>
                <p class="text-xl text-slate-400 font-bold">請看大螢幕的最終排行榜</p>
            </div>
        `;
    }

    renderRoleSelection();
};