// ==========================================
// bank.js — 題庫中心、學習模式設定視窗、Arena 的 Firebase 函式
// （由原 script.js 拆分而來；於 index.html 中依序載入）
// ==========================================

// ==========================================
// 學習模式設定視窗邏輯
// ==========================================
const btnStudyMode = document.getElementById('btnStudyMode'); 
const gameSettingsModal = document.getElementById('gameSettingsModal');
const btnCancelGameModal = document.getElementById('btnCancelGameModal');
const btnStartGame = document.getElementById('btnStartGame');
const btnResetGameSettings = document.getElementById('btnResetGameSettings');
const chkHasHeader = document.getElementById('gameHasHeader'); 
const selGameColC = document.getElementById('gameColC');
const bankWrapper = document.getElementById('gameBankWrapper');
const matchPairsContainer = document.getElementById('gameMatchPairsContainer');

// 狀態變數
let gameValidCols = [];       // 含有資料的所有欄位
let gameActiveBankCols = [];  // 被勾選啟用的題庫欄位
let gameMatchPairs = [];      // 匹配形式清單: [{ id, termCol, defCol, customName }]

// ✨ 新增：這 5 種一般模式，遇到「選擇題格式」的題庫時，要改用選擇題的選單樣式
const CHOICE_LAYOUT_MODES = ['flashcard', 'matching', 'quiz', 'sorting', 'typing'];

// ✨ 新增：用標題判斷目前題庫是不是「選擇題格式」（有題目、答案、多個選項欄）
function isChoiceBankFormat() {
    if (!chkHasHeader || !chkHasHeader.checked) return false; // 沒勾「第一列為標題」就無從判斷
    const headers = (window.gameHeaders || []).map(h => h.trim().replace(/"/g, ''));
    const optLike = headers.filter(h => /選項|正確|錯|^[a-d1-4]$/i.test(h)).length;
    const hasAnsCol = headers.some(h => /^(答案|解答|答|正解)$/.test(h));
    return optLike >= 3 || (optLike > 0 && hasAnsCol);
}

// ✨ 新增：目前要不要顯示「題目／答案／選項1~4」的選擇題選單
function shouldUseChoiceLayout(selectedGameType, effectiveConfigMode) {
    if (effectiveConfigMode === 'choice') return true; // 原本的「選擇」與連線的「自訂選項」
    // ✨ 修改：連線的「隨機選項」(arena + match) 遇到選擇題庫時，也用選擇題選單
    const isArenaRandom = selectedGameType === 'arena' && effectiveConfigMode === 'match';
    return (CHOICE_LAYOUT_MODES.includes(selectedGameType) || isArenaRandom) && isChoiceBankFormat();
}

// 💡 修正：綁定到正確的按鈕 btnStudyMode 上
if (btnStudyMode) {
    btnStudyMode.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // ✨ 動態顯示題庫名稱
        const bankInfo = document.getElementById('gameSettingsBankInfo');
        if (window.currentLoadedBank && bankInfo) {
            document.getElementById('gameSettingsBankName').textContent = window.currentLoadedBank.name;
            bankInfo.classList.remove('hidden');
        } else if (bankInfo) {
            bankInfo.classList.add('hidden');
        }
        
        // 點擊後，強制關閉所有已經打開的工具列選單
        document.querySelectorAll('.dropdown-menu, .group\\/submenu').forEach(m => m.classList.remove('show'));
        
        // 載入先前的設定
        if (window.currentGameConfigs) {
            gameActiveBankCols = [...(window.currentGameConfigs.activeBankCols || [])];
            gameMatchPairs = [...(window.currentGameConfigs.matchPairs || [])];
        } else {
            try {
                const saved = JSON.parse(localStorage.getItem('wesing-game-configs'));
                if (saved) {
                    gameActiveBankCols = saved.activeBankCols || [];
                    gameMatchPairs = saved.matchPairs || [];
                    if (chkHasHeader) chkHasHeader.checked = saved.hasHeader;
                }
            } catch(e) {}
        }

        initGameColOptions(); 
        gameSettingsModal.classList.remove('hidden');
        gameSettingsModal.classList.add('flex');
    });
}

const closeGameModal = () => {
    gameSettingsModal.classList.add('hidden');
    gameSettingsModal.classList.remove('flex');
};
if (btnCancelGameModal) btnCancelGameModal.addEventListener('click', closeGameModal);
if (gameSettingsModal) gameSettingsModal.addEventListener('click', (e) => { if (e.target === gameSettingsModal) closeGameModal(); });

// 綁定事件
if (chkHasHeader) chkHasHeader.addEventListener('change', renderGameMatchPairs);
if (selGameColC) selGameColC.addEventListener('change', renderGameMatchPairs);

// 開始遊戲
if (btnStartGame) {
	// 重設遊戲設定
	if (btnResetGameSettings) {
		btnResetGameSettings.addEventListener('click', () => {
			// 1. 清除瀏覽器中儲存的遊戲設定記憶
			localStorage.removeItem('wesing-game-configs');
			window.currentGameConfigs = null;

			// 2. 將陣列狀態清空，讓系統重新抓取預設值
			gameActiveBankCols = [];
			gameMatchPairs = [];
			
			// 3. ✨ 關鍵修復：重設核取方塊與分類下拉選單
			if (chkHasHeader) chkHasHeader.checked = false;
			if (selGameColC) selGameColC.value = '-1'; // 強制把分類選回「(無)」

			// 4. 重新初始化畫面
			initGameColOptions();
			
			// 5. 顯示小提示
			showToast('🔄 設定已恢復預設');
		});
	}
    if (btnStartGame) {
		// ✨ 共用：確認已登入 Google，未登入則先彈出登入視窗；成功回傳 user，失敗/取消回傳 null
		window.ensureGoogleLogin = async function() {
			if (auth.currentUser) return auth.currentUser;
			try {
				showToast('🔐 分享需要先登入 Google，正在開啟登入視窗...');
				const result = await auth.signInWithPopup(googleProvider);
				showToast(`✅ 登入成功！歡迎，${result.user.displayName}`);
				return result.user;
			} catch (error) {
				console.error('Google 登入失敗:', error);
				showToast('❌ 登入失敗或已取消，無法產生分享連結');
				return null;
			}
		};

		// ✨ 遊戲專用分享邏輯 (供學習模式與連線模式呼叫)
    window.generateGameShareLink = async function(targetMode) {
        let shareUrl = new URL(window.location.href);
        shareUrl.searchParams.delete('mode');
        shareUrl.searchParams.delete('bank');
        shareUrl.searchParams.delete('id');
        shareUrl.searchParams.delete('ime');

        shareUrl.searchParams.set('mode', targetMode);

        if (window.currentLoadedBank) {
            // 如果沒改過資料，直接分享 bank ID，網址超短！
            shareUrl.searchParams.set('bank', window.currentLoadedBank.id);
            copyUrlAndToast(shareUrl.href);
        } else {
            // 如果是被編輯過的資料，需要登入後使用 Firebase 儲存並回傳短 ID
            let currentContent = currentMode === 'text' ? editor.value : extractTextFromTable();
            if (!currentContent || currentContent.trim() === '') return showToast('⚠️ 沒有內容可以分享');

            // 未登入 → 先彈出 Google 登入 (需緊接在使用者點擊後執行，避免被瀏覽器擋下彈窗)
            const loggedInUser = await window.ensureGoogleLogin();
            if (!loggedInUser) return;

            try {
                showToast('⏳ 正在產生雲端連結，請稍候...');
                // 相同內容已分享過就沿用原本的 id；否則才新增
                const docId = (await saveOrReuseSharedDoc(currentContent)).id;
                if (!docId) throw new Error('取得 ID 失敗');
                shareUrl.searchParams.set('id', docId);
            } catch (e) {
                console.error('遊戲分享失敗:', e);
                return showToast('❌ 產生網址失敗，請檢查網路連線');
            }
            copyUrlAndToast(shareUrl.href);
        }
    };

    function copyUrlAndToast(url) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url).then(() => showToast('🔗 遊戲直接連結已複製！開啟後將直接進入遊戲。')).catch(() => showPrompt('請手動複製以下網址：', url, () => {}));
        } else {
            showPrompt('請手動複製以下網址：', url, () => {});
        }
    }

    const btnShareGame = document.getElementById('btnShareGame');
    if (btnShareGame) {
        btnShareGame.addEventListener('click', () => {
            const selectedGame = document.querySelector('input[name="gameType"]:checked').value;
            window.generateGameShareLink(selectedGame);
        });
    }
        btnStartGame.addEventListener('click', () => {
            const selectedGame = document.querySelector('input[name="gameType"]:checked').value;
            
            if (selectedGame === 'live') {
                closeGameModal();
                updateUrlModeParam('live');
                if (typeof window.launchLiveMode === 'function') {
                    let currentData = editor.value;
                    if (currentMode === 'table' && typeof extractTextFromTable === 'function') {
                        currentData = extractTextFromTable();
                    }
                    window.launchLiveMode(currentData, window.currentGameConfigs || {});
                }
                return;
            }

            const colCValue = parseInt(selGameColC.value, 10);
            
            // ✨ 新增：判斷要儲存哪一種設定格式
            let effectiveConfigMode = selectedGame;
            if (selectedGame === 'arena') {
                const arenaSourceEl = document.querySelector('input[name="arenaSource"]:checked');
                effectiveConfigMode = arenaSourceEl ? arenaSourceEl.value : 'match';
            }
            
            let currentPairs = [];
            let mcConfig = null;

            // ✨ 修改：原本只判斷 effectiveConfigMode === 'choice'，現在也包含「選擇題庫 + 5 種一般模式」
            const useChoiceLayout = shouldUseChoiceLayout(selectedGame, effectiveConfigMode);

            if (useChoiceLayout) {
                // 抓取選擇題專屬的設定
                const mcArea = document.getElementById('mc-config-area');
                if (mcArea) {
                    mcConfig = {
                        qCol: parseInt(mcArea.querySelector('.mc-q').value, 10),
                        o1Col: parseInt(mcArea.querySelector('.mc-o1').value, 10),
                        o2Col: parseInt(mcArea.querySelector('.mc-o2').value, 10),
                        o3Col: parseInt(mcArea.querySelector('.mc-o3').value, 10),
                        o4Col: parseInt(mcArea.querySelector('.mc-o4').value, 10),
                        ansCol: mcArea.querySelector('.mc-ans').value
                    };
                }
            } else {
                // 抓取一般配對設定
                if (gameMatchPairs.length === 0) return showToast('⚠️ 請至少設定一組題目與答案匹配形式');
                matchPairsContainer.querySelectorAll('.match-pair-row').forEach(row => {
                    const termVal = parseInt(row.querySelector('.sel-term').value, 10);
                    const defVal = parseInt(row.querySelector('.sel-def').value, 10);
                    const pairId = parseInt(row.dataset.id, 10);
                    const existing = gameMatchPairs.find(p => p.id === pairId);
                    if (!isNaN(termVal) && !isNaN(defVal)) {
                        currentPairs.push({ id: pairId, termCol: termVal, defCol: defVal, customName: existing ? existing.customName : '' });
                    }
                });
            }

            window.currentGameConfigs = { 
                activeBankCols: gameActiveBankCols,
                matchPairs: currentPairs,
                mcConfig: mcConfig,
                // ✨ 新增：一般模式使用了選擇題選單時為 true，game.js 會據此改用 mcConfig 解析資料
                // ✨ 修改：連線「隨機選項」也要標記，arena.js 才知道選項要隨機產生、不用題庫的選項欄
                choiceLayout: useChoiceLayout && (CHOICE_LAYOUT_MODES.includes(selectedGame) || (selectedGame === 'arena' && effectiveConfigMode === 'match')),
                hasHeader: chkHasHeader ? chkHasHeader.checked : false,
                hasCategory: colCValue !== -1,
                colC: colCValue,
                filterCategory: 'ALL',
                validColsSignature: window.currentGameConfigs ? window.currentGameConfigs.validColsSignature : '' // ✨ 存檔時保留目前的指紋
            };

        localStorage.setItem('wesing-game-configs', JSON.stringify(window.currentGameConfigs));
        closeGameModal();
        switchMode(selectedGame);
    });
}
}

// 點擊外部自動關閉「題庫選單」的防呆機制
document.addEventListener('click', (e) => {
    const details = document.getElementById('gameBankDetails');
    if (details && details.hasAttribute('open') && !details.contains(e.target)) {
        details.removeAttribute('open');
    }
});

// 把 analyzeTableHeaders 的解析結果套用到目前的學習模式設定視窗
function applyAnalysisToGameUI(analysis) {
    const headers = (window.gameHeaders || []).map(h => h.trim().replace(/"/g, ''));
    if (!window.currentGameConfigs) window.currentGameConfigs = {};

    // 首列為標題
    if (chkHasHeader) chkHasHeader.checked = true;

    // 作為分類的欄位
    if (analysis.catCol !== -1 && selGameColC) {
        selGameColC.innerHTML = `<option value="${analysis.catCol}">自動偵測</option>`;
        selGameColC.value = String(analysis.catCol);
        window.currentGameConfigs.colC = analysis.catCol;
    } else if (selGameColC) {
        selGameColC.innerHTML = '<option value="-1">(無)</option>';
        selGameColC.value = '-1';
        window.currentGameConfigs.colC = -1;
    }

    // 判斷題型：3 個以上選項欄，或「有選項欄又有獨立答案欄」→ 選擇題；否則 → 配對
    const optLike = headers.filter(h => /選項|正確|錯|^[a-d1-4]$/i.test(h)).length;
    const hasAnsCol = headers.some(h => /^(答案|解答|答|正解)$/.test(h));
    const isChoiceMode = optLike >= 3 || (optLike > 0 && hasAnsCol);

    if (isChoiceMode) {
        const choiceRadio = document.querySelector('input[name="arenaSource"][value="choice"]');
        if (choiceRadio) choiceRadio.checked = true;
        const gameTypeChoiceRadio = document.querySelector('input[name="gameType"][value="choice"]');
        if (gameTypeChoiceRadio) gameTypeChoiceRadio.checked = true;
        window.currentGameConfigs.mcConfig = analysis.mcConfig;
    } else {
        const matchRadio = document.querySelector('input[name="arenaSource"][value="match"]');
        if (matchRadio) matchRadio.checked = true;
        const currentGameType = document.querySelector('input[name="gameType"]:checked')?.value;
        if (currentGameType === 'choice') {
            const gameTypeMatchRadio = document.querySelector('input[name="gameType"][value="matching"]');
            if (gameTypeMatchRadio) gameTypeMatchRadio.checked = true;
        }
        gameMatchPairs = [{
            id: Date.now(),
            termCol: analysis.matchConfig.termCol,
            defCol: analysis.matchConfig.defCol,
            customName: ''
        }];
        window.currentGameConfigs.mcConfig = null;
    }
}

// 初始化題庫資料與核取方塊
function initGameColOptions() {
    let rawData = editor.value;
    if (currentMode === 'table' && typeof extractTextFromTable === 'function') rawData = extractTextFromTable();
    
    const lines = rawData.split('\n').filter(l => l.trim() !== '');
    window.gameHeaders = lines.length > 0 ? lines[0].split('\t') : [];
    let maxCols = lines.reduce((max, l) => Math.max(max, l.split('\t').length), 2);

    gameValidCols = [];
    for (let i = 0; i < maxCols; i++) {
        if (lines.some(l => l.split('\t')[i] && l.split('\t')[i].trim() !== '')) gameValidCols.push(i);
    }
    if (gameValidCols.length === 0) gameValidCols.push(0, 1);

        // ✨ 智慧指紋防呆機制：判斷是否換了題庫，或記憶不合法
        const validColsSignature = gameValidCols.join(',');
        const savedSignature = window.currentGameConfigs ? window.currentGameConfigs.validColsSignature : '';
        const isMemoryValid = gameActiveBankCols.length > 0 && gameActiveBankCols.every(col => gameValidCols.includes(col));

        // 如果「有效欄位結構改變了(換題庫)」，或者「記憶體裡的欄位現在是空欄」
        if (!isMemoryValid || validColsSignature !== savedSignature) {
            gameActiveBankCols = [...gameValidCols]; 
            gameMatchPairs = []; 
            
            if (!window.currentGameConfigs) window.currentGameConfigs = {};
            window.currentGameConfigs.validColsSignature = validColsSignature; 

            // ==========================================
            // ✨ 智慧標題偵測引擎 (Smart Header Heuristics)
            // ==========================================
            const headers = window.gameHeaders.map(str => str.trim());
            // 掃描是否有這些關鍵字，若有，高機率第一列就是標題
            const isLikelyHeader = headers.some(str => /題目|題幹|答案|選項|正確|錯誤|分類|單元/.test(str));

            if (isLikelyHeader) {
                if (chkHasHeader) chkHasHeader.checked = true; // 自動勾選「第一列為標題」

                let qCol = -1, ansCol = -1, catCol = -1;
                let optCols = [];
                let isFixedAns = false;

                // 逐欄判定身分
                headers.forEach((name, i) => {
                    if (/分類|單元|類別/.test(name)) {
                        catCol = i;
                    } else if (/題目|題幹|單字/.test(name)) {
                        qCol = i;
                    } else if (name === '正確' || name === '正確答案') {
                        optCols.push(i);
                        isFixedAns = true; // 發現「正確」也是選項之一 (固定答案模式)
                    } else if (/選項|錯誤/.test(name)) {
                        optCols.push(i);
                    } else if (/答案|解答/.test(name)) {
                        ansCol = i;
                    }
                });

                // 自動設定「作為分類」下拉選單
                if (catCol !== -1 && selGameColC) {
                    selGameColC.innerHTML = `<option value="${catCol}">自動偵測</option>`; // 暫存選項供後續抓取
                    selGameColC.value = catCol.toString();
                    window.currentGameConfigs.colC = catCol;
                } else if (selGameColC) {
                    selGameColC.innerHTML = `<option value="-1">(無)</option>`;
                    selGameColC.value = '-1';
                    window.currentGameConfigs.colC = -1;
                }

                // 判斷題型：如果有 3 個以上的選項，或是「有選項又有獨立的答案欄」，即判定為選擇題
                let isChoiceMode = optCols.length >= 3 || (optCols.length > 0 && ansCol !== -1);

                if (isChoiceMode) {
                    // 自動切換為「自訂選項 (Choice)」
                    const choiceRadio = document.querySelector('input[name="arenaSource"][value="choice"]');
                    if (choiceRadio) choiceRadio.checked = true;

                    // 自動幫老師把上方遊戲模式切換到「選擇」
                    const gameTypeChoiceRadio = document.querySelector('input[name="gameType"][value="choice"]');
                    if (gameTypeChoiceRadio) gameTypeChoiceRadio.checked = true;

                    // 自動對號入座選項與答案
                    window.currentGameConfigs.mcConfig = {
                        qCol: qCol !== -1 ? qCol : 0,
                        o1Col: optCols[0] !== undefined ? optCols[0] : -1,
                        o2Col: optCols[1] !== undefined ? optCols[1] : -1,
                        o3Col: optCols[2] !== undefined ? optCols[2] : -1,
                        o4Col: optCols[3] !== undefined ? optCols[3] : -1,
                        ansCol: isFixedAns ? 'fixed_1' : (ansCol !== -1 ? `col_${ansCol}` : 'fixed_1')
                    };
                } else {
                    // 自動切換為「隨機選項 (Match)」
                    const matchRadio = document.querySelector('input[name="arenaSource"][value="match"]');
                    if (matchRadio) matchRadio.checked = true;

                    // 如果原本選到選擇題，切回「配對」
                    const currentGameType = document.querySelector('input[name="gameType"]:checked')?.value;
                    if (currentGameType === 'choice') {
                        const gameTypeMatchRadio = document.querySelector('input[name="gameType"][value="matching"]');
                        if (gameTypeMatchRadio) gameTypeMatchRadio.checked = true;
                    }

                    // 自動填入配對欄位
                    gameMatchPairs = [{
                        id: Date.now(),
                        termCol: qCol !== -1 ? qCol : 0,
                        defCol: ansCol !== -1 ? ansCol : 1,
                        customName: ''
                    }];
                    window.currentGameConfigs.mcConfig = null;
                }
            } else {
                // 內建關鍵字沒抓到標題時，改用較完整的「智慧格式解析引擎」(analyzeTableHeaders) 再試一次
                const fallback = (typeof analyzeTableHeaders === 'function') ? analyzeTableHeaders(rawData) : null;
                if (fallback && fallback.hasHeader) {
                    applyAnalysisToGameUI(fallback);
                } else {
                    // 如果沒有偵測到標題，回歸預設設定
                    if (chkHasHeader) chkHasHeader.checked = false;
                    if (selGameColC) selGameColC.value = '-1';
                    window.currentGameConfigs.mcConfig = null;
                }
            }
        }

        // 更新選單標題數字
    const updateBankSummary = () => {
        const summaryText = document.getElementById('gameBankSummaryText');
        if (summaryText) summaryText.textContent = `已選 ${gameActiveBankCols.length} 欄`;
    };

    // ✨ 產生垂直排列的題庫核取清單
    bankWrapper.innerHTML = '';
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    gameValidCols.forEach(i => {
        const isChecked = gameActiveBankCols.includes(i);
        const letter = alphabet[i % 26];
        let name = (chkHasHeader && chkHasHeader.checked && window.gameHeaders[i]) ? window.gameHeaders[i].trim() : `${letter}欄`;
        
        bankWrapper.innerHTML += `
            <label class="flex items-center gap-2 px-2 py-1.5 bg-transparent hover:bg-indigo-50 rounded cursor-pointer transition-colors w-full">
                <input type="checkbox" class="bank-checkbox rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 flex-shrink-0" value="${i}" ${isChecked ? 'checked' : ''}>
                <span class="text-sm font-bold text-gray-700 truncate select-none" title="${name}">${name}</span>
            </label>
        `;
    });

    updateBankSummary();

    // 監聽題庫勾選改變
    bankWrapper.querySelectorAll('.bank-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const val = parseInt(e.target.value, 10);
            if (e.target.checked) {
                if (!gameActiveBankCols.includes(val)) gameActiveBankCols.push(val);
            } else {
                gameActiveBankCols = gameActiveBankCols.filter(c => c !== val);
            }
            gameActiveBankCols.sort((a, b) => a - b);
            updateBankSummary();
            renderGameMatchPairs(); 
        });
    });

    if (gameMatchPairs.length === 0) {
        gameMatchPairs.push({ id: Date.now(), termCol: gameActiveBankCols[0], defCol: gameActiveBankCols[1] || gameActiveBankCols[0], customName: '' });
    }

    renderGameMatchPairs();
}

// 根據題庫重新渲染分類與匹配清單
function renderGameMatchPairs() {
    const isHeaderChecked = chkHasHeader && chkHasHeader.checked;
    const prevC = selGameColC ? parseInt(selGameColC.value, 10) : -1;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    if (selGameColC) {
        selGameColC.innerHTML = '<option value="-1">(無)</option>';
        gameActiveBankCols.forEach(i => {
            const letter = alphabet[i % 26];
            let name = (isHeaderChecked && window.gameHeaders[i]) ? window.gameHeaders[i].trim() : `${letter}欄`;
            selGameColC.innerHTML += `<option value="${i}">${name}</option>`;
        });
        selGameColC.value = gameActiveBankCols.includes(prevC) ? prevC : -1;
    }

    const currentC = parseInt(selGameColC.value, 10);
    const availableCols = gameActiveBankCols.filter(c => c !== currentC);
    
    let optionsHtml = '';
    availableCols.forEach(i => {
        const letter = alphabet[i % 26];
        let name = (isHeaderChecked && window.gameHeaders[i]) ? window.gameHeaders[i].trim() : `${letter}欄`;
        optionsHtml += `<option value="${i}">${name}</option>`;
    });

    matchPairsContainer.innerHTML = '';
    
    if (availableCols.length === 0) {
        matchPairsContainer.innerHTML = '<div class="text-xs text-red-500 py-2 text-center bg-red-50 rounded-lg">請在題庫中勾選至少一個可用欄位</div>';
        return;
    }

    const selectedGameType = document.querySelector('input[name="gameType"]:checked').value;

	// ✨ Live 模式專屬按鈕變身
    const btnPlay = document.getElementById('btnStartGame');
    if (selectedGameType === 'live') {
        if (btnPlay) {
            btnPlay.innerHTML = '開始';
            btnPlay.className = "px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-lg rounded-xl shadow-md transition-transform hover:-translate-y-1 cursor-pointer flex items-center justify-center gap-2";
        }
    } else {
        if (btnPlay) {
            btnPlay.innerHTML = '開始'; 
            btnPlay.className = "px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-lg rounded-xl shadow-md transition-transform hover:-translate-y-1 cursor-pointer flex items-center justify-center";
        }
    }

    // ✨ 新增：控制連線模式專屬開關的顯示與隱藏
    const arenaSourceSettings = document.getElementById('arenaSourceSettings');
    if (selectedGameType === 'arena') {
        if (arenaSourceSettings) arenaSourceSettings.classList.remove('hidden');
    } else {
        if (arenaSourceSettings) arenaSourceSettings.classList.add('hidden');
    }

    // ✨ 新增：決定目前要渲染哪一種設定介面
    let effectiveConfigMode = selectedGameType;
    if (selectedGameType === 'arena') {
        const arenaSourceEl = document.querySelector('input[name="arenaSource"]:checked');
        effectiveConfigMode = arenaSourceEl ? arenaSourceEl.value : 'match';
    }

    // ✨ 修改：原本是 effectiveConfigMode === 'choice'，現在交給 shouldUseChoiceLayout 統一判斷
    if (shouldUseChoiceLayout(selectedGameType, effectiveConfigMode)) {
        // ========== 選擇題專屬介面（「選擇」模式 與 選擇題庫的閃示/配對/測驗/排序/打字 共用）==========
        let mcConfig = (window.currentGameConfigs && window.currentGameConfigs.mcConfig) || null;

        // ✨ 新增：若還沒有選擇題設定（例如先前用配對存檔），用標題智慧分析出題目/答案/選項欄
        if (!mcConfig || mcConfig.qCol === undefined) {
            let rawForAnalysis = editor.value;
            if (currentMode === 'table' && typeof extractTextFromTable === 'function') rawForAnalysis = extractTextFromTable();
            const analysis = (typeof analyzeTableHeaders === 'function') ? analyzeTableHeaders(rawForAnalysis) : null;
            mcConfig = analysis ? { ...analysis.mcConfig } : {};
            if (!window.currentGameConfigs) window.currentGameConfigs = {};
            window.currentGameConfigs.mcConfig = mcConfig;
        }
        
        // 預設值防呆：若沒有設定，或題目欄位被取消勾選，預設抓第一欄
        if (mcConfig.qCol === undefined || !availableCols.includes(mcConfig.qCol)) {
            mcConfig.qCol = availableCols[0];
        }
        
        // 💡 智慧邏輯：可用選項清單「自動排除」已被選為題目的欄位
        const optAvailableCols = availableCols.filter(c => c !== mcConfig.qCol);
        
        // 預設選項帶入 (若沒資料則帶入 -1 無)
        if (mcConfig.o1Col === undefined) mcConfig.o1Col = optAvailableCols[0] !== undefined ? optAvailableCols[0] : -1;
        if (mcConfig.o2Col === undefined) mcConfig.o2Col = optAvailableCols[1] !== undefined ? optAvailableCols[1] : -1;
        if (mcConfig.o3Col === undefined) mcConfig.o3Col = optAvailableCols[2] !== undefined ? optAvailableCols[2] : -1;
        if (mcConfig.o4Col === undefined) mcConfig.o4Col = optAvailableCols[3] !== undefined ? optAvailableCols[3] : -1;
        if (mcConfig.ansCol === undefined) mcConfig.ansCol = 'fixed_1';

        // 題目下拉選單 (包含所有可用欄位)
        const createSelQ = (cls, val) => `<select class="${cls} w-full bg-gray-50 border border-gray-200 rounded px-1 py-1 text-xs font-bold text-gray-700 outline-none cursor-pointer truncate">${optionsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>`;
        
        // 選項下拉選單 (包含 (無) 且排除題目欄位)
        let optOptionsHtml = '<option value="-1">(無)</option>';
        optAvailableCols.forEach(i => {
            const letter = alphabet[i % 26];
            let name = (isHeaderChecked && window.gameHeaders[i]) ? window.gameHeaders[i].trim() : `${letter}欄`;
            optOptionsHtml += `<option value="${i}">${name}</option>`;
        });
        const createSelOpt = (cls, val) => `<select class="${cls} w-full bg-gray-50 border border-gray-200 rounded px-1 py-1 text-xs font-bold text-gray-700 outline-none cursor-pointer truncate">${optOptionsHtml.replace(`value="${val}"`, `value="${val}" selected`)}</select>`;

        // 答案下拉選單
        let ansOptionsHtml = `
            <option value="fixed_1" ${mcConfig.ansCol === 'fixed_1' ? 'selected' : ''}>固定為 選項1</option>
            <option value="fixed_2" ${mcConfig.ansCol === 'fixed_2' ? 'selected' : ''}>固定為 選項2</option>
            <option value="fixed_3" ${mcConfig.ansCol === 'fixed_3' ? 'selected' : ''}>固定為 選項3</option>
            <option value="fixed_4" ${mcConfig.ansCol === 'fixed_4' ? 'selected' : ''}>固定為 選項4</option>
            <optgroup label="由欄位指定 (內容為1~4或文字)">
        `;
        availableCols.forEach(i => {
            const letter = alphabet[i % 26];
            let name = (isHeaderChecked && window.gameHeaders[i]) ? window.gameHeaders[i].trim() : `${letter}欄`;
            ansOptionsHtml += `<option value="col_${i}" ${mcConfig.ansCol === `col_${i}` ? 'selected' : ''}>${name}</option>`;
        });
        ansOptionsHtml += `</optgroup>`;

        // ✨ 新增：一般模式（非「選擇」/連線）顯示的說明文字
        // ✨ 修改：連線「隨機選項」改顯示「選項由系統隨機產生」
        const modeNoteHtml = (effectiveConfigMode === 'choice')
            ? ''
            : `<div class="text-[11px] text-yellow-700 font-bold px-1">此題庫為選擇題格式：以「題目 → 答案」進行，${selectedGameType === 'arena' ? '選項由系統隨機產生，選項欄不會使用' : '選項欄可不填'}</div>`;

        // UI 排版：題目與答案在第一行，四個選項在第二行
        const mcHtml = `
            <div class="flex flex-col gap-2 bg-yellow-50/50 p-2 rounded-lg border border-yellow-100 shadow-sm" id="mc-config-area">
                ${modeNoteHtml}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-yellow-200/50 pb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-gray-600 w-10 shrink-0 text-right">題目：</span>
                        ${createSelQ('mc-q', mcConfig.qCol)}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-green-600 w-10 shrink-0 text-right">答案：</span>
                        <select class="mc-ans w-full bg-green-50 border border-green-200 rounded px-1 py-1 text-xs font-bold text-green-800 outline-none cursor-pointer truncate">
                            ${ansOptionsHtml}
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 pt-1">
                    <div class="flex items-center gap-1"><span class="text-xs font-bold text-gray-500 w-12 shrink-0 text-right">選項1：</span>${createSelOpt('mc-o1', mcConfig.o1Col)}</div>
                    <div class="flex items-center gap-1"><span class="text-xs font-bold text-gray-500 w-12 shrink-0 text-right">選項2：</span>${createSelOpt('mc-o2', mcConfig.o2Col)}</div>
                    <div class="flex items-center gap-1"><span class="text-xs font-bold text-gray-500 w-12 shrink-0 text-right">選項3：</span>${createSelOpt('mc-o3', mcConfig.o3Col)}</div>
                    <div class="flex items-center gap-1"><span class="text-xs font-bold text-gray-500 w-12 shrink-0 text-right">選項4：</span>${createSelOpt('mc-o4', mcConfig.o4Col)}</div>
                </div>
            </div>
        `;
        matchPairsContainer.insertAdjacentHTML('beforeend', mcHtml);

        // 綁定連動事件：當使用者更改題目時，立即重繪以更新選項清單
        const mcArea = document.getElementById('mc-config-area');
        mcArea.addEventListener('change', (e) => {
            if (!window.currentGameConfigs) window.currentGameConfigs = {};
            
            const newQCol = parseInt(mcArea.querySelector('.mc-q').value, 10);
            
            // 如果更改的是題目，把剛好撞到的選項重設為 -1 (無)
            if (e.target.classList.contains('mc-q')) {
                ['.mc-o1', '.mc-o2', '.mc-o3', '.mc-o4'].forEach(cls => {
                    const optSel = mcArea.querySelector(cls);
                    if (parseInt(optSel.value, 10) === newQCol) optSel.value = "-1";
                });
            }

            window.currentGameConfigs.mcConfig = {
                qCol: newQCol,
                o1Col: parseInt(mcArea.querySelector('.mc-o1').value, 10),
                o2Col: parseInt(mcArea.querySelector('.mc-o2').value, 10),
                o3Col: parseInt(mcArea.querySelector('.mc-o3').value, 10),
                o4Col: parseInt(mcArea.querySelector('.mc-o4').value, 10),
                ansCol: mcArea.querySelector('.mc-ans').value
            };
            
            // 重繪以刷新可用的下拉選項
            if (e.target.classList.contains('mc-q')) renderGameMatchPairs(); 
        });

    } else {
        // ========== 原有的配對介面 ==========
        gameMatchPairs.forEach((pair, index) => {
            if (!availableCols.includes(pair.termCol)) pair.termCol = availableCols[0];
            if (!availableCols.includes(pair.defCol)) pair.defCol = availableCols.length > 1 ? availableCols[1] : availableCols[0];

            const isFirst = index === 0;
            const btnClass = "flex items-center justify-center p-1 rounded transition-colors cursor-pointer";
            const actionBtnHtml = isFirst 
                ? `<button class="${btnClass} text-purple-500 hover:bg-purple-100" data-action="auto" title="自動產生組合"><span class="material-symbols-outlined text-[16px]">library_add</span></button>`
                : `<button class="${btnClass} text-red-400 hover:bg-red-50" data-action="del" title="刪除此組"><span class="material-symbols-outlined text-[16px]">close</span></button>`;
            const numberBadgeHtml = gameMatchPairs.length > 1 
                ? `<div class="flex-shrink-0 w-4 h-4 flex items-center justify-center bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full ml-0.5 select-none">${index + 1}</div>` : '';

            const rowHtml = `
                <div class="match-pair-row flex items-center gap-1 bg-white p-1 rounded border border-gray-200 shadow-sm" data-id="${pair.id}">
                    ${numberBadgeHtml} <div class="flex flex-col flex-1 min-w-0">
                        <select class="sel-term w-full bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer truncate">
                            ${optionsHtml.replace(`value="${pair.termCol}"`, `value="${pair.termCol}" selected`)}
                        </select>
                    </div>
                    <div class="text-gray-300 flex-shrink-0"><span class="material-symbols-outlined text-[14px]">arrow_forward</span></div>
                    <div class="flex flex-col flex-1 min-w-0">
                        <select class="sel-def w-full bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer truncate">
                            ${optionsHtml.replace(`value="${pair.defCol}"`, `value="${pair.defCol}" selected`)}
                        </select>
                    </div>
                    <div class="flex items-center gap-0.5 border-l border-gray-100 pl-1 flex-shrink-0">
                        <button class="${btnClass} text-blue-500 hover:bg-blue-50" data-action="add" title="新增一組"><span class="material-symbols-outlined text-[16px]">add</span></button>
                        <button class="${btnClass} ${pair.customName ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:bg-gray-100'}" data-action="rename" title="${pair.customName ? '已命名: '+pair.customName : '點擊命名'}"><span class="material-symbols-outlined text-[16px]">edit</span></button>
                        ${actionBtnHtml}
                    </div>
                </div>
            `;
            matchPairsContainer.insertAdjacentHTML('beforeend', rowHtml);
        });
    }
}

document.querySelectorAll('input[name="gameType"]').forEach(radio => {
    radio.addEventListener('change', renderGameMatchPairs);
});

// ✨ 新增：當連線模式的「題型來源」改變時，即時重繪下方的欄位設定
document.querySelectorAll('input[name="arenaSource"]').forEach(radio => {
    radio.addEventListener('change', renderGameMatchPairs);
});



// 4. 事件委派：處理匹配列的按鈕操作
matchPairsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    // 同步當下畫面上的選擇到陣列中
    matchPairsContainer.querySelectorAll('.match-pair-row').forEach((row, idx) => {
        gameMatchPairs[idx].termCol = parseInt(row.querySelector('.sel-term').value, 10);
        gameMatchPairs[idx].defCol = parseInt(row.querySelector('.sel-def').value, 10);
    });

    const row = btn.closest('.match-pair-row');
    const pairId = parseInt(row.dataset.id, 10);
    const pairIndex = gameMatchPairs.findIndex(p => p.id === pairId);
    const action = btn.dataset.action;

    if (action === 'add') {
        const currentC = selGameColC ? parseInt(selGameColC.value, 10) : -1;
        const availableCols = gameActiveBankCols.filter(c => c !== currentC);
        
        if (availableCols.length < 1) return;

        // 預設值 (防呆)
        let nextTerm = availableCols[0];
        let nextDef = availableCols.length > 1 ? availableCols[1] : availableCols[0];
        let foundUnique = false;

        // ✨ 智慧尋找：掃描所有可能的組合，找出還沒被加進清單的配對
        for (let i = 0; i < availableCols.length; i++) {
            for (let j = 0; j < availableCols.length; j++) {
                if (i === j) continue; // 略過 A欄➔A欄 這種自己對自己的情況
                
                const tCol = availableCols[i];
                const dCol = availableCols[j];
                
                // 檢查目前的配對清單中，是否已經有這個組合了
                const exists = gameMatchPairs.some(p => p.termCol === tCol && p.defCol === dCol);
                
                if (!exists) {
                    nextTerm = tCol;
                    nextDef = dCol;
                    foundUnique = true;
                    break;
                }
            }
            if (foundUnique) break;
        }

        // 將找到的新鮮組合加入清單 (如果全部組合都被加光了，就會自動帶入預設值)
        gameMatchPairs.push({ id: Date.now(), termCol: nextTerm, defCol: nextDef, customName: '' });
        renderGameMatchPairs();
    }
    else if (action === 'del') {
        gameMatchPairs.splice(pairIndex, 1);
        renderGameMatchPairs();
    } 
    else if (action === 'rename') {
        const currentName = gameMatchPairs[pairIndex].customName;
        showPrompt('為此匹配形式命名 (留空則自動產生)', currentName, (val) => {
            gameMatchPairs[pairIndex].customName = val.trim();
            renderGameMatchPairs();
        });
    } 
    else if (action === 'auto') {
        const currentC = parseInt(selGameColC.value, 10);
        const availableCols = gameActiveBankCols.filter(c => c !== currentC);
        if (availableCols.length < 2) return showToast("⚠️ 可用欄位不足，無法自動產生組合");
        
        gameMatchPairs = [];
        // 產生排列組合 (Permutations) P(n, 2)
        for (let i = 0; i < availableCols.length; i++) {
            for (let j = 0; j < availableCols.length; j++) {
                if (i !== j) {
                    gameMatchPairs.push({ id: Date.now() + i*100 + j, termCol: availableCols[i], defCol: availableCols[j], customName: '' });
                }
            }
        }
        renderGameMatchPairs();
        showToast('✨ 已自動產生所有題目與答案的可能組合！');
    }
});







// ==========================================
// 遊戲連線模式 (Arena) 專用 Firebase 邏輯
// ==========================================

// ✨ 自動偵測環境：如果網址是 localhost 或 127.0.0.1，就加上 'dev_' 前綴
const isLocalhost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
window.DB_PREFIX = isLocalhost ? 'dev_' : '';
window.SPACES_COLLECTION = window.DB_PREFIX + 'spaces'; // 組合出最終的集合名稱

// 1. 老師建立遊戲「空間」
async function createArenaSpace(gameConfigs) {
    const spaceCode = Math.floor(10000 + Math.random() * 90000).toString();
    try {
        // ✨ 改用動態集合名稱 window.SPACES_COLLECTION
        await db.collection(window.SPACES_COLLECTION).doc(spaceCode).set({
            status: 'waiting', 
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            config: gameConfigs,
            currentQuestionIndex: 0
        });
        return spaceCode;
    } catch (e) {
        console.error("建立空間失敗:", e);
        return null;
    }
}

// 2. 學生加入遊戲「空間」
async function joinArenaSpace(spaceCode, playerName) {
    // ✨ 改用動態集合名稱
    const spaceRef = db.collection(window.SPACES_COLLECTION).doc(spaceCode);
    try {
        const doc = await spaceRef.get();
        if (!doc.exists) return "NOT_FOUND"; 
        if (doc.data().status !== 'waiting') return "ALREADY_STARTED"; 

        await spaceRef.collection("players").doc(playerName).set({
            name: playerName,
            score: 0,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return "SUCCESS";
    } catch (e) {
        console.error("加入空間失敗:", e);
        return "ERROR";
    }
}

// 3. 學生送出作答結果 (獨立記錄每一題作答軌跡)
async function submitArenaAnswer(spaceCode, playerName, answerIndex, qIndex, reactionTime = 0) {
    try {
        const updateData = {
            lastAnswer: answerIndex,
            answeredQuestion: qIndex,
            lastReactionTime: reactionTime,
            answeredAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        updateData[`ans_${qIndex}`] = answerIndex;
        updateData[`time_${qIndex}`] = reactionTime;

        // ✨ 改用動態集合名稱
        await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName).update(updateData);
        return "SUCCESS";
    } catch (e) {
        console.error("送出答案失敗:", e);
        return "ERROR";
    }
}

// 4. 老師踢出玩家
async function removeArenaPlayer(spaceCode, playerName) {
    try {
        // ✨ 改用動態集合名稱
        await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName).delete();
        return true;
    } catch (e) {
        console.error("踢出玩家失敗:", e);
        return false;
    }
}











/* ==========================================
   題庫中心模組 (Google Drive 階層版)
   ========================================== */
const bankModeContainer = document.getElementById('bankModeContainer');
const bankSearchInput = document.getElementById('bankSearchInput');
const btnClearBankSearch = document.getElementById('btnClearBankSearch');
const bankTableBody = document.getElementById('bankTableBody');
const bankSidebar = document.getElementById('bankSidebar');
const bankSidebarOverlay = document.getElementById('bankSidebarOverlay');
const bankFoldersGrid = document.getElementById('bankFoldersGrid');
const bankSidebarMenu = document.getElementById('bankSidebarMenu');

// 狀態管理：確保只宣告一次
let bankState = {
    search: '',
    category: 'ALL',
    type: 'ALL',
    sortCol: 'name',
    sortAsc: true
};

// 大分類網址參數對照表
const categoryAliasMap = {
    "國小自然": "el_science",
    "國小英文": "el_english",
    "國中國文": "jh_chinese",
    "班級經營": "class_mgt",
    "課程回饋": "course_fb",
    "互動體驗": "interactive"
};

// 自動反轉對照表，供讀取網址時使用
const reverseCategoryAliasMap = Object.fromEntries(
    Object.entries(categoryAliasMap).map(([key, value]) => [value, key])
);

// 2. 輔助函數：真實且簡短的 UTF-8 Base64 轉換引擎 (Url Safe)
function encodeBase64UrlSafe(str) {
    // 1. 使用 TextEncoder 將中文直接轉為真實的 UTF-8 位元組 (不會暴增長度)
    const bytes = new TextEncoder().encode(str);
    let binaryStr = '';
    for (let i = 0; i < bytes.length; i++) {
        binaryStr += String.fromCharCode(bytes[i]);
    }
    // 2. 轉為 Base64 並替換網址安全符號
    return btoa(binaryStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64UrlSafe(base64Str) {
    try {
        // 1. 還原網址安全符號與長度
        let base64 = base64Str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) { base64 += '='; }
        
        // 2. 解開 Base64 還原為二進位字串
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        
        // 3. 使用 TextDecoder 解碼回中文
        return new TextDecoder().decode(bytes);
    } catch (e) {
        return base64Str; // 解碼失敗退回原字串以防崩潰
    }
}

// 輔助函數：計算題數
function getQCount(dataStr) {
    if (!dataStr) return 0;
    const lines = dataStr.split('\n').filter(l => l.trim() !== '');
    return Math.max(0, lines.length - 1);
}

// 1. 初始化題庫資料與篩選器
function initBankCenter() {
    if (!window.presetBank) return;
    window.presetBank.forEach((p, idx) => p._originalIndex = idx);
    
    // ✨ 補全：從網址讀取分類參數 (自動處理 英文/Base64)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('cat')) {
        const catParam = urlParams.get('cat');
        let realCat = reverseCategoryAliasMap[catParam];
        if (!realCat) {
            realCat = decodeBase64UrlSafe(catParam);
        }
        
        const validCategories = [...new Set(window.presetBank.map(p => p.folder))];
        if (validCategories.includes(realCat)) {
            bankState.category = realCat;
        }
    }

    // 初始化題型下拉選單
    const types = [...new Set(window.presetBank.map(p => p.type))].filter(Boolean);
    const filter = document.getElementById('bankTypeFilter');
    if (filter) {
        filter.innerHTML = '<option value="ALL">所有題型</option>' + 
            types.map(t => `<option value="${t}">${t}</option>`).join('');
    }
    renderBankSidebar();
    renderBankContent();
}

// 2. 側邊欄渲染
function renderBankSidebar() {
    const categories = [...new Set(window.presetBank.map(p => p.folder))].filter(Boolean).sort();
    if (!bankSidebarMenu) return;

    bankSidebarMenu.innerHTML = `
        <button class="w-full text-left px-4 py-2.5 rounded-full flex items-center gap-3 transition-all ${bankState.category === 'ALL' ? 'bg-indigo-100 text-indigo-800 font-bold' : 'text-gray-600 hover:bg-gray-200'}" onclick="setBankCategory('ALL')">
            <span class="material-symbols-outlined text-[20px]">database</span> 總題庫
        </button>
        <div class="text-[11px] font-bold text-gray-400 mt-4 mb-2 px-4 tracking-wider uppercase">分類資料夾</div>
    ` + categories.map(cat => `
        <button class="w-full text-left px-4 py-2 rounded-full flex items-center gap-3 transition-all ${bankState.category === cat ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}" onclick="setBankCategory('${cat}')">
            <span class="material-symbols-outlined text-[18px]">${bankState.category === cat ? 'folder_open' : 'folder'}</span>
            <span class="truncate">${cat}</span>
        </button>
    `).join('');
}

// 3. 設定分類路徑並重新渲染 (包含回到頂端)
window.setBankCategory = function(cat) {
    bankState.category = cat;
    bankState.search = '';
    if (bankSearchInput) bankSearchInput.value = '';
    if (btnClearBankSearch) btnClearBankSearch.classList.add('hidden');
    
    renderBankSidebar();
    renderBankContent();
    
    // ✨ 核心修改：只要使用者點擊分類或標題，就清除題庫載入記憶與網址參數
    window.currentLoadedBank = null; 
    
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('bank'); // 清除 bank 參數
    
    if (cat === 'ALL') {
        newUrl.searchParams.delete('cat'); 
    } else {
        const alias = categoryAliasMap[cat];
        if (alias) {
            newUrl.searchParams.set('cat', alias); 
        } else {
            newUrl.searchParams.set('cat', encodeBase64UrlSafe(cat)); 
        }
    }
    window.history.replaceState({}, '', newUrl);

    // 切換分類時，右側內容捲動回頂端
    const bankRightContent = document.getElementById('bankRightContent');
    if (bankRightContent) bankRightContent.scrollTop = 0;
};

// 4. 側邊欄開關邏輯 (使用 width 切換，防止排版錯亂)
function toggleBankSidebar() {
    if (window.innerWidth >= 768) {
        // 電腦版：縮放寬度
        const isCollapsed = bankSidebar.classList.contains('md:w-0');
        if (!isCollapsed) {
            bankSidebar.classList.replace('w-64', 'md:w-0');
            bankSidebar.classList.add('border-none');
        } else {
            bankSidebar.classList.replace('md:w-0', 'w-64');
            bankSidebar.classList.remove('border-none');
        }
    } else {
        // 手機版：遮罩滑出
        if (bankSidebarOverlay.classList.contains('hidden')) {
            bankSidebarOverlay.classList.remove('hidden');
            setTimeout(() => {
                bankSidebarOverlay.classList.remove('opacity-0');
                bankSidebar.classList.remove('-translate-x-full');
            }, 10);
        } else {
            window.closeBankSidebar();
        }
    }
}

window.closeBankSidebar = function() {
    if (window.innerWidth >= 768) return; // 電腦版點選項不自動收合
    if (bankSidebarOverlay) bankSidebarOverlay.classList.add('opacity-0');
    if (bankSidebar) bankSidebar.classList.add('-translate-x-full');
    setTimeout(() => {
        if (bankSidebarOverlay) bankSidebarOverlay.classList.add('hidden');
    }, 300);
};

// 5. 內容渲染 (麵包屑 + 網格 + 清單)
window.renderBankContent = function() {
    const breadcrumbs = document.getElementById('bankBreadcrumbs');
    const foldersView = document.getElementById('bankFoldersView');
    const filesView = document.getElementById('bankFilesView');

    // 麵包屑導覽 (層次引導)
    if (breadcrumbs) {
        breadcrumbs.innerHTML = bankState.category === 'ALL' 
            ? '<b>總題庫</b>' 
            : `<span class="text-gray-400 cursor-pointer hover:underline" onclick="setBankCategory('ALL')">總題庫</span> <span class="text-gray-300 mx-2">/</span> <b>${bankState.category}</b>`;
    }

    // 過濾邏輯
    let filtered = window.presetBank.filter(p => {
        const mSearch = p.name.toLowerCase().includes(bankState.search.toLowerCase());
        const mCat = bankState.category === 'ALL' || p.folder === bankState.category;
        const mType = bankState.type === 'ALL' || p.type === bankState.type;
        return mSearch && mCat && mType;
    });

    // 排序邏輯
    filtered.sort((a, b) => {
        let valA = a[bankState.sortCol] || '';
        let valB = b[bankState.sortCol] || '';
        if (bankState.sortCol === 'count') { valA = getQCount(a.data); valB = getQCount(b.data); }

        if (valA < valB) return bankState.sortAsc ? -1 : 1;
        if (valA > valB) return bankState.sortAsc ? 1 : -1;
        return 0;
    });

    // 更新表頭排序圖示
    document.querySelectorAll('#bankModeContainer th[data-sort]').forEach(th => {
        const icon = th.querySelector('.sort-icon');
        if (icon) { // 確保有找到圖示元素才去更改它
            if (th.dataset.sort === bankState.sortCol) {
                icon.textContent = bankState.sortAsc ? 'arrow_downward' : 'arrow_upward';
                icon.classList.remove('opacity-0');
            } else {
                icon.classList.add('opacity-0');
            }
        }
    });

    // 在「總題庫」且沒搜尋時，顯示分類資料夾
    if (bankState.category === 'ALL' && !bankState.search) {
        foldersView.classList.remove('hidden');
        const cats = [...new Set(window.presetBank.map(p => p.folder))].filter(Boolean).sort();
        bankFoldersGrid.innerHTML = cats.map(c => `
            <div class="bg-[#f0f4f9] hover:bg-[#e1e5ea] p-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all border border-transparent hover:border-gray-300 group" onclick="setBankCategory('${c}')">
                <span class="material-symbols-outlined text-indigo-500 text-3xl group-hover:scale-110 transition-transform">folder</span>
                <span class="font-bold text-gray-700 truncate">${c}</span>
            </div>
        `).join('');
    } else {
        foldersView.classList.add('hidden');
    }

    // 渲染檔案列表
    filesView.classList.remove('hidden');
    if (filtered.length === 0) {
        bankTableBody.innerHTML = `<tr><td colspan="2" class="text-center py-10 text-gray-400 font-bold bg-white">找不到符合條件的題庫</td></tr>`;
    } else {
        bankTableBody.innerHTML = filtered.map(p => `
            <tr class="hover:bg-blue-50/50 transition-colors border-b border-gray-100 group">
                
                <td class="py-3 px-3 md:px-5 cursor-pointer w-full max-w-0" ondblclick="playPresetBank(${p._originalIndex})">
                    <div class="flex items-center">
                        <span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-600 shrink-0 border border-indigo-100/50 shadow-sm mr-2">${p.type}</span>
                        
                        <div class="flex items-center min-w-0 flex-1 overflow-hidden">
                            <span class="font-bold truncate text-gray-800 text-sm md:text-base">${p.name}</span>
                            
                            <span class="text-xs font-mono text-gray-400 ml-1 whitespace-nowrap group-hover:hidden">(${getQCount(p.data)}題)</span>
                        </div>

                        <div class="hidden group-hover:flex shrink-0 ml-2">
                            <button class="bg-indigo-600 text-white px-3 py-0.5 rounded-full text-[11px] font-bold shadow-sm hover:bg-indigo-700 whitespace-nowrap" 
                                    ontouchstart="this.dataset.valid='1'; setTimeout(() => this.dataset.valid='', 500);"
                                    onclick="event.stopPropagation(); if(Date.now() - window.lastGlobalTouchTime < 500 && !this.dataset.valid) return; playPresetBank(${p._originalIndex})">
                                載入
                            </button>
                        </div>
                    </div>
                </td>
                
                <td class="py-2 px-3 md:px-5 text-right whitespace-nowrap w-[1%]">
                    <div class="relative shrink-0">
                        <button class="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors focus:outline-none" onclick="toggleBankMenu(event, this)">
                            <span class="material-symbols-outlined text-xl block">more_vert</span>
                        </button>
                        
                        <div class="bank-action-menu hidden fixed w-36 bg-white rounded-lg shadow-xl border border-gray-100 z-[9999]">
                            <div class="py-1">
                                <button class="w-full text-left px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-3 transition-colors" onclick="viewPresetBank(${p._originalIndex})">
                                    <span class="material-symbols-outlined text-[18px]">visibility</span>
                                    檢視題庫
                                </button>
                                
                                ${p.type !== '問答' ? `
                                <button class="w-full text-left px-4 py-2.5 text-sm font-bold text-pink-600 hover:bg-pink-50 flex items-center gap-3 transition-colors border-t border-gray-50" onclick="playPresetBank(${p._originalIndex}, 'arena')">
                                    <span class="material-symbols-outlined text-[18px]">sports_esports</span>
                                    連線對戰
                                </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    const countDisplay = document.getElementById('bankCountDisplay');
    if (countDisplay) countDisplay.textContent = `共 ${filtered.length} 筆`;
}
// ==========================================
// 題庫中心：三個點選單控制與智慧定位邏輯 (Fixed 突破邊界版)
// ==========================================
window.toggleBankMenu = function(event, btn) {
    event.stopPropagation(); // 防止點擊事件往上傳遞
    
    const menu = btn.nextElementSibling;
    const isHidden = menu.classList.contains('hidden');
    
    // 1. 先把畫面上所有打開的選單都關閉
    document.querySelectorAll('.bank-action-menu').forEach(m => m.classList.add('hidden'));
    
    // 2. 如果原本是關閉的，就打開並動態計算精準位置
    if (isHidden) {
        // 先顯示選單，才能取得實際寬高
        menu.classList.remove('hidden'); 
        
        // 取得觸發按鈕在視窗中的絕對座標
        const rect = btn.getBoundingClientRect();
        const menuHeight = menu.offsetHeight;
        const menuWidth = menu.offsetWidth;
        const windowHeight = window.innerHeight;
        
        // 預設在按鈕的右下方展開 (往下位移 4px)
        let top = rect.bottom + 4;
        let left = rect.right - menuWidth; 
        
        // 邊界防護：如果下方空間不夠，改為向上展開 (往上位移 4px)
        if (top + menuHeight + 10 > windowHeight) {
            top = rect.top - menuHeight - 4;
        }
        
        // 套用 fixed 座標
        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
    }
};

// 點擊網頁任意空白處時，自動關閉所有打開的選單
document.addEventListener('click', () => {
    document.querySelectorAll('.bank-action-menu').forEach(m => m.classList.add('hidden'));
});

// 加入滾動監聽：當滾動畫面 (表格或整個網頁) 時，自動收起懸浮選單，維持畫面整潔
document.addEventListener('scroll', () => {
    document.querySelectorAll('.bank-action-menu:not(.hidden)').forEach(m => m.classList.add('hidden'));
}, true);

// 點擊網頁任意空白處時，自動關閉所有打開的選單
document.addEventListener('click', () => {
    document.querySelectorAll('.bank-action-menu').forEach(m => {
        m.classList.add('hidden');
        m.classList.remove('bottom-full', 'mb-1');
        m.classList.add('top-full', 'mt-1');
    });
});






// 6. 綁定事件監聽器
if (bankSearchInput) {
    bankSearchInput.addEventListener('input', (e) => {
        bankState.search = e.target.value;
        if (btnClearBankSearch) btnClearBankSearch.classList.toggle('hidden', e.target.value === '');
        renderBankContent();
    });
    if (btnClearBankSearch) {
        btnClearBankSearch.addEventListener('click', () => {
            bankSearchInput.value = '';
            bankState.search = '';
            btnClearBankSearch.classList.add('hidden');
            bankSearchInput.focus();
            renderBankContent();
        });
    }
}

const typeFilter = document.getElementById('bankTypeFilter');
if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
        bankState.type = e.target.value;
        renderBankContent();
    });
}

document.querySelectorAll('#bankModeContainer th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (bankState.sortCol === col) bankState.sortAsc = !bankState.sortAsc; 
        else { bankState.sortCol = col; bankState.sortAsc = true; }
        renderBankContent();
    });
});

document.getElementById('btnOpenBankSidebar')?.addEventListener('click', toggleBankSidebar);
document.getElementById('bankSidebarOverlay')?.addEventListener('click', window.closeBankSidebar);
document.getElementById('btnCloseBankSidebar')?.addEventListener('click', window.closeBankSidebar);

// 7. 攔截 switchMode (加入啟動時初始化題庫功能)
const originalSwitchMode = window.switchMode;
window.switchMode = function(mode, isForce = false) {
    if (mode === 'bank') {
        initBankCenter();
    }
    if (typeof originalSwitchMode === 'function') originalSwitchMode(mode, isForce);
};

// 8. 檢視與載入按鈕邏輯
window.viewPresetBank = function(index) {
    const preset = window.presetBank[index];
    if (!preset) return;
    window.currentLoadedBank = { id: preset.id, name: preset.name };
    editor.value = preset.data;
    sheetTabs[activeSheetIndex].name = preset.name;
    switchMode('table', true); 
    saveAllTabsData();
    renderSheetTabs();
    showToast(`👀 已檢視題庫：${preset.name}`);
};

// ✨ 修正版：支援 forcedMode 網址啟動，並完美支援 Arena 連線捷徑
window.playPresetBank = function(index, forcedMode = null) {
    const preset = window.presetBank[index];
    if (!preset) return;

    // 手動強制標記來源為題庫中心
    window.originModeForGame = 'bank';

    // 1. 備份使用者原本的資料
    const backupText = editor.value;

    // 2. 注入題庫資料並背景渲染表格
    editor.value = preset.data;
    window.currentLoadedBank = { id: preset.id, name: preset.name };
    renderTableFromText(preset.data);

    // 3. 設定遊戲模式 (優先套用網址或捷徑傳入的 forcedMode)
    let targetMode = forcedMode || 'matching'; 
    if (!forcedMode) {
        if (preset.type === '問答') targetMode = 'live';
        else if (preset.type === '選擇') targetMode = 'choice';
    }

    showToast(`🚀 啟動線上題庫：${preset.name}...`);

    setTimeout(() => {
        // 呼叫智慧分析引擎，瞬間破解題庫格式！
        const analysis = analyzeTableHeaders(preset.data);

        // 如果原系統有初始化選項的函數，先呼叫它
        if (typeof initGameColOptions === 'function') initGameColOptions();
        
        // 直接將分析結果寫入系統設定
        window.currentGameConfigs = {
            activeBankCols: analysis.activeCols,
            matchPairs: [{ 
                id: Date.now(), 
                termCol: analysis.matchConfig.termCol, 
                defCol: analysis.matchConfig.defCol, 
                customName: '' 
            }],
            // ✨ 核心修正：不再限制只有 choice 才能存入 mcConfig，讓 arena 也能讀取到選擇題配置
            mcConfig: analysis.mcConfig,
            hasHeader: analysis.hasHeader,
            hasCategory: analysis.catCol !== -1, 
            colC: analysis.catCol, 
            filterCategory: 'ALL',
            validColsSignature: analysis.activeCols.join(',')
        };
        localStorage.setItem('wesing-game-configs', JSON.stringify(window.currentGameConfigs));
        
        // 進入遊戲模式
        switchMode(targetMode, true, preset.data);

        // 4. 恢復編輯器原始文字
        editor.value = backupText;
        
    }, 100); 
};

// 系統啟動進入點
document.addEventListener('DOMContentLoaded', () => {
    init();
});


