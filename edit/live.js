// =================================================================
// 互動問答模式模組 (live.js) - Phase 20: 次數防呆與極簡隱藏版
// =================================================================

window.launchLiveMode = function(rawData, configs) {
    document.body.classList.add('is-playing-game');
    if (typeof toggleMaximizeMode === 'function') toggleMaximizeMode(true);

    const liveContainer = document.getElementById('arenaModeContainer');
    if (!liveContainer) return;
    liveContainer.style.display = 'block';
    liveContainer.classList.remove('hidden');

    let currentSpaceCode = '';
    let unsubscribeSpace = null;
    let unsubscribePlayers = null;
    let unsubscribeStudentSelf = null;
    
    let globalPlayers = [];
    let liveData = [];      
    let currentQIndex = -1; 
    window.currentSpaceData = null; 
    window.currentStudentData = null; 
    window.lastEmojiTs = {}; 
    window.liveImeActive = false; 
    
    window.isLiveSidebarOpen = window.innerWidth > 768; 
    window.liveSidebarWidth = 280; 

    const optionColors = ['bg-teal-500', 'bg-orange-500', 'bg-blue-500', 'bg-rose-500', 'bg-indigo-500', 'bg-amber-500'];
    const standbyEmojis = ['😀','😄','😁','😅','🤣','😂','🙂','🙃','🫠','😉','😊','🥰','😍','🤩','☺️','😋','😛','😜','🤗','🤭','🫣','🤫','🤔','😶‍🌫️','😏','🙄','😴','🤯','🤠','🥳','🤓','🧐','😱','😺','😸','😹','😼','😽'];

    function escapeHtml(unsafe) {
        return (unsafe || '').toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

	function generateUniqueId() {
        return 'q_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    }

    // ✨ 共用的安全次數解析器 (不是 0,1,2,3 就預設為 0)
    function parseQuestionLimit(qData) {
        let rawLimit = qData && qData.options && qData.options[0] !== undefined ? String(qData.options[0]).trim() : '0';
        if (!['0', '1', '2', '3'].includes(rawLimit)) rawLimit = '0';
        return parseInt(rawLimit, 10);
    }

    function getAnsweredQIds() {
        const answered = new Set();
        globalPlayers.forEach(p => {
            liveData.forEach(q => {
                const qId = q.id;
                if (p[`ans_${qId}`] !== undefined || p[`text_${qId}`] !== undefined || (p[`qa_${qId}`] && p[`qa_${qId}`].length > 0)) {
                    answered.add(qId);
                }
            });
        });
        return Array.from(answered);
    }

    function showCustomConfirm(title, message, confirmText, confirmClass, onConfirm) {
        const modalId = "live-confirm-modal";
        if (document.getElementById(modalId)) document.getElementById(modalId).remove();
        
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = "fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[100000] flex items-center justify-center p-4 opacity-0 transition-opacity duration-200";
        modal.innerHTML = `
            <div class="relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl transform transition-transform scale-95 origin-center text-center border border-gray-200">
                <button id="btn-confirm-close-x" class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1"><span class="material-symbols-outlined text-[20px]">close</span></button>
                <div class="flex flex-col items-center gap-2 mb-3">
                    <span class="material-symbols-outlined text-4xl text-gray-400">help</span>
                    <h3 class="text-lg font-extrabold text-gray-800">${title}</h3>
                </div>
                <p class="text-gray-500 font-bold text-sm mb-6 leading-relaxed px-2">${message}</p>
                <div class="flex justify-center gap-2">
                    <button id="btn-confirm-cancel" class="px-4 py-2 rounded-lg font-bold text-gray-500 hover:bg-gray-100 transition-colors w-1/2 text-sm border border-gray-200">取消</button>
                    <button id="btn-confirm-ok" class="px-4 py-2 rounded-lg font-bold text-white ${confirmClass} transition-colors shadow-sm w-1/2 text-sm">${confirmText}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);

        const close = () => {
            modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => modal.remove(), 200);
        };
        modal.querySelector('#btn-confirm-close-x').addEventListener('click', close);
        modal.querySelector('#btn-confirm-cancel').addEventListener('click', close);
        modal.querySelector('#btn-confirm-ok').addEventListener('click', () => { close(); onConfirm(); });
    }

    function showDeleteQuestionConfirm(qText, onConfirm) {
        const truncatedText = qText.length > 10 ? qText.substring(0, 10) + '...' : qText;
        showCustomConfirm(
            "刪除題目", 
            `確認刪除「<span class="text-gray-900">${escapeHtml(truncatedText)}</span>」？`, 
            "確認刪除", 
            "bg-rose-500 hover:bg-rose-600", 
            onConfirm
        );
    }

    if (!document.getElementById('live-styles')) {
        const style = document.createElement('style');
        style.id = 'live-styles';
        style.innerHTML = `
            @keyframes floatUpEmoji { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 10% { transform: translateY(-20px) scale(1.2); opacity: 1; } 80% { transform: translateY(-150px) scale(1.5); opacity: 1; } 100% { transform: translateY(-200px) scale(1); opacity: 0; } }
            .animate-float-emoji { animation: floatUpEmoji 1.5s ease-out forwards; }
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
            @keyframes periodicWiggle { 0%, 90% { transform: rotate(0deg) scale(1); } 93% { transform: rotate(-10deg) scale(1.1); } 96% { transform: rotate(10deg) scale(1.1); } 100% { transform: rotate(0deg) scale(1); } }
            .animate-periodic-wiggle { animation: periodicWiggle 3s infinite; }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            #live-sidebar-wrapper.animate-width { transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease; }
            #live-sidebar-wrapper.collapsed { width: 0 !important; opacity: 0; border: none; pointer-events: none; }
            @media (max-width: 768px) {
                #live-sidebar-wrapper { position: absolute; height: 100%; z-index: 50; box-shadow: 4px 0 25px rgba(0,0,0,0.1); width: 260px !important; }
                #live-sidebar-wrapper.collapsed { width: 0 !important; opacity: 0; }
                #live-sidebar-resizer { display: none !important; }
            }
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

    function getLatestRawData(fallbackData) {
        const tableContainer = document.getElementById('tableModeContainer');
        if (tableContainer && tableContainer.style.display !== 'none' && typeof extractTextFromTable === 'function') {
            const tData = extractTextFromTable();
            if (tData && tData.trim()) return tData;
        }
        const editor = document.getElementById('editor');
        if (editor && editor.value && editor.value.trim()) return editor.value;
        if (typeof sheetTabs !== 'undefined' && typeof activeSheetIndex !== 'undefined' && sheetTabs[activeSheetIndex]) {
            const sData = sheetTabs[activeSheetIndex].content;
            if (sData && sData.trim()) return sData;
        }
        return fallbackData;
    }

    function parseLiveData(text, hasHeader) {
        if (!text) return [];
        const lines = text.split('\n').filter(l => l.trim() !== '');
        const startIndex = hasHeader ? 1 : 0;
        const parsed = [];
        const actualStart = (startIndex >= lines.length) ? 0 : startIndex;

        for (let i = actualStart; i < lines.length; i++) {
            const cols = lines[i].split('\t').map(c => {
                if (c.startsWith('"') && c.endsWith('"')) return c.slice(1, -1).replace(/""/g, '"');
                return c.trim();
            });
            if (cols.length === 0 || (cols.length === 1 && cols[0] === '')) continue;

            let type = '單選', question = '', options = [];

            if (cols.length >= 3) {
                type = cols[0]; question = cols[1]; 
                if (type.includes('公告')) options = [cols.slice(2).join('\t')]; 
                else options = cols.slice(2).filter(opt => opt !== ''); 
            } else if (cols.length === 2) {
                if (['單選', '文字', '問答', '選擇', 'QA', '多選', '評分', '排序', '公告'].some(t => cols[0].toUpperCase().includes(t))) {
                    type = cols[0]; question = cols[1];
                } else {
                    type = '單選'; question = cols[0]; options = [cols[1]];
                }
            } else if (cols.length === 1) {
                type = '文字'; question = cols[0];
            }

            if (type.includes('單選') || type.includes('選擇')) type = '單選';
            else if (type.includes('多選')) type = '多選';
            else if (type.includes('文字')) type = '文字';
            else if (type.includes('問答') || type.toUpperCase().includes('QA')) type = '問答';
            else if (type.includes('評分') || type.includes('星')) type = '評分';
            else if (type.includes('排序')) type = '排序';
            else if (type.includes('公告')) type = '公告'; 
            else if (type.includes('白板') || type.includes('便條')) type = '白板';
            else type = '單選';
			const qId = generateUniqueId(i); // i 是目前的迴圈索引
			if (question) parsed.push({ id: qId, type, question, options });
        }
        return parsed;
    }

    function syncLiveDataToEditor() {
        const text = liveData.map(q => {
            if(q.type === '公告') return `${q.type}\t${q.question}\t${(q.options[0] || '').replace(/\n/g, '\\n')}`;
            return `${q.type}\t${q.question}\t${(q.options || []).join('\t')}`;
        }).join('\n');
        
        const editor = document.getElementById('editor');
        if (editor) {
            editor.value = text;
            if (typeof window.parseTextToTable === 'function' && document.getElementById('tableModeContainer').style.display !== 'none') {
                window.parseTextToTable();
            }
            if (typeof sheetTabs !== 'undefined' && typeof activeSheetIndex !== 'undefined' && sheetTabs[activeSheetIndex]) {
                sheetTabs[activeSheetIndex].content = text;
                if(typeof saveAllTabsData === 'function') saveAllTabsData();
            }
        }

		if (currentSpaceCode) {
			sessionStorage.setItem(`live_data_cache_${currentSpaceCode}`, JSON.stringify(liveData));
		}
	}

    function getLiveQrModalHtml(spaceCode) {
        if (!spaceCode) return '';
        const displayCode = spaceCode.substring(0, 2) + ' ' + spaceCode.substring(2);
        const joinUrl = window.location.origin + window.location.pathname + '?live=' + spaceCode;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(joinUrl)}&bgcolor=ffffff&color=0f766e`;
        return `
            <div id="live-qr-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[10000] hidden flex-col items-center justify-center cursor-pointer transition-opacity overflow-y-auto py-10 px-4" onclick="this.classList.add('hidden')">
                <div class="bg-white p-6 md:p-8 rounded-[2rem] flex flex-col items-center gap-4 shadow-2xl transform transition-transform hover:scale-105 w-full max-w-sm m-auto cursor-default" onclick="event.stopPropagation()">
                    <h2 class="text-4xl md:text-5xl font-black text-teal-900 tracking-[0.2em] text-center w-full break-words">${displayCode}</h2>
                    <div class="bg-white p-2 rounded-xl shadow-inner border-2 border-teal-50 w-full max-w-[250px] aspect-square flex items-center justify-center">
                        <img src="${qrUrl}" alt="QR Code" class="w-full h-full object-contain">
                    </div>
                    <p class="text-teal-700 font-bold text-lg md:text-xl mt-2 flex items-center gap-2 text-center">
                        <span class="material-symbols-outlined flex-shrink-0">qr_code_scanner</span> 掃描以加入問答
                    </p>
                    <button class="mt-2 bg-teal-50 text-teal-700 px-8 py-3 rounded-full font-bold hover:bg-teal-100 transition-colors w-full cursor-pointer" onclick="document.getElementById('live-qr-modal').classList.add('hidden')">關閉</button>
                </div>
            </div>
        `;
    }

    function getFloatingReactionHtml() {
        return `
            <div class="fixed bottom-5 right-5 z-[100] flex flex-col items-center gap-3">
                <div id="reaction-picker" class="bg-white/95 backdrop-blur-md border border-gray-200 rounded-full p-1.5 flex flex-col-reverse gap-1 shadow-[0_5px_20px_rgba(0,0,0,0.15)] transform transition-all duration-300 origin-bottom scale-0 opacity-0 pointer-events-none">
                    ${['👍', '❤️', '😂', '😮', '👏', '🎉'].reverse().map(e => `
                        <button class="live-reaction-btn text-3xl hover:scale-125 transition-transform active:scale-90 p-1.5 cursor-pointer" data-emoji="${e}">${e}</button>
                    `).join('')}
                </div>
                <button id="btn-toggle-reaction" class="w-14 h-14 bg-white border border-gray-200 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.1)] flex items-center justify-center text-teal-600 hover:bg-teal-50 transition-colors active:scale-95 cursor-pointer">
                    <span class="material-symbols-outlined text-[32px]">add_reaction</span>
                </button>
            </div>
        `;
    }

	// ✨ 學生專屬：右上角懸浮身分膠囊
    function getStudentProfileBadge() {
        const data = window.currentStudentData;
        if (!data) return '';
        return `
            <div class="fixed top-3 right-3 sm:top-5 sm:right-5 z-[90] flex items-center gap-1.5 bg-white/70 backdrop-blur-md border border-teal-100/50 shadow-[0_2px_10px_rgba(0,0,0,0.05)] px-3 py-1.5 rounded-full select-none pointer-events-none transition-all">
                <span class="text-[16px] leading-none drop-shadow-sm">${data.emoji || ''}</span>
                <span class="text-xs font-extrabold text-teal-800 max-w-[100px] truncate drop-shadow-sm">${escapeHtml(data.name || '')}</span>
            </div>
        `;
    }

    function bindFloatingReactionBar(spaceCode, playerName) {
        const picker = document.getElementById('reaction-picker');
        const btnToggle = document.getElementById('btn-toggle-reaction');
        
        if (btnToggle && picker) {
            btnToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                picker.classList.toggle('scale-0'); picker.classList.toggle('opacity-0'); picker.classList.toggle('pointer-events-none');
            });
            document.addEventListener('click', (e) => {
                if (!picker.contains(e.target) && e.target !== btnToggle) {
                    picker.classList.add('scale-0', 'opacity-0', 'pointer-events-none');
                }
            });
        }

        document.querySelectorAll('.live-reaction-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation(); 
                const emoji = e.currentTarget.dataset.emoji;
                const el = e.currentTarget;
                el.style.transform = 'scale(1.4)';
                setTimeout(() => el.style.transform = '', 150);
                picker.classList.add('scale-0', 'opacity-0', 'pointer-events-none');

                try {
                    await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName).update({ flyEmoji: { e: emoji, ts: Date.now() } });
                } catch(err) {}
            });
        });
    }

    function bindImeToggles() {
        const btns = liveContainer.querySelectorAll('.ime-toggle-button');
        btns.forEach(btn => {
            if (btn.dataset.boundIme) return;
            btn.dataset.boundIme = "true";
            
            const icon = btn.querySelector('span.material-symbols-outlined');
            if (window.liveImeActive) {
                btn.classList.add('is-ime-active', 'bg-teal-100', 'text-teal-700', 'shadow-inner');
                btn.classList.remove('text-gray-400');
                if (icon) icon.style.fontVariationSettings = "'FILL' 1"; 
            }
            
            btn.addEventListener('click', function(e) {
                const isActive = this.classList.toggle('is-ime-active');
                window.liveImeActive = isActive; 
                
                if (isActive) {
                    this.classList.remove('text-gray-400');
                    this.classList.add('bg-teal-100', 'text-teal-700', 'shadow-inner');
                    if (icon) icon.style.fontVariationSettings = "'FILL' 1"; 
                } else {
                    this.classList.remove('bg-teal-100', 'text-teal-700', 'shadow-inner');
                    this.classList.add('text-gray-400');
                    if (icon) icon.style.fontVariationSettings = "'FILL' 0"; 
                }
            });
        });
    }

    function cleanupLive() {
        if (unsubscribeSpace) unsubscribeSpace();
        if (unsubscribePlayers) unsubscribePlayers();
        if (unsubscribeStudentSelf) unsubscribeStudentSelf();

		sessionStorage.removeItem('live_host_code');
        if (currentSpaceCode) sessionStorage.removeItem(`live_data_cache_${currentSpaceCode}`); 

        window.arenaIsPaused = false; 
        window.lastEmojiTs = {};
        document.body.classList.remove('is-playing-game');
        if (typeof toggleMaximizeMode === 'function') toggleMaximizeMode(false);
        liveContainer.classList.add('hidden');
        liveContainer.style.display = 'none';
        
        const url = new URL(window.location.href);
        if (url.searchParams.has('live')) {
            url.searchParams.delete('live');
            window.history.replaceState({}, document.title, url.href);
        }

        if (typeof window.switchMode === 'function') {
            window.switchMode('table');
        } else {
            url.searchParams.delete('mode');
            window.history.replaceState({}, document.title, url.href);
        }

		if (currentSpaceCode) {
			sessionStorage.removeItem(`live_data_cache_${currentSpaceCode}`);
		}
	}

    window.toggleLiveGlobalPause = async function() {
        if (!window.currentSpaceCode) return;
        const newGlobalPauseState = !(window.currentSpaceData?.isGlobalPaused || false);
        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ isGlobalPaused: newGlobalPauseState });
    };

    window.toggleLivePause = async function() {
        if (!window.currentSpaceCode) return;
        window.arenaIsPaused = !window.arenaIsPaused; 
        
        const pauseBtn = document.getElementById('btn-toggle-pause');
        if (pauseBtn) {
            if (window.arenaIsPaused) {
                pauseBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">play_arrow</span> <span class="hidden xl:inline">開放收件</span>';
                pauseBtn.classList.replace('bg-gray-50', 'bg-amber-50');
                pauseBtn.classList.replace('hover:bg-gray-100', 'hover:bg-amber-100');
                pauseBtn.classList.replace('text-gray-600', 'text-amber-700');
                pauseBtn.classList.replace('border-gray-200', 'border-amber-300');
            } else {
                pauseBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">pause</span> <span class="hidden xl:inline">暫停收件</span>';
                pauseBtn.classList.replace('bg-amber-50', 'bg-gray-50');
                pauseBtn.classList.replace('hover:bg-amber-100', 'hover:bg-gray-100');
                pauseBtn.classList.replace('text-amber-700', 'text-gray-600');
                pauseBtn.classList.replace('border-amber-300', 'border-gray-200');
            }
        }
        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ isPaused: window.arenaIsPaused });
    };

    // ✨ 補回完整且正確指向 window.currentSpaceCode 的 Q&A 管理函數
    window.deleteLiveQA = async function(qId) {
        if (!window.currentSpaceCode) return;
        showCustomConfirm("刪除提問", "確定要永久刪除這筆提問嗎？", "確認刪除", "bg-rose-500 hover:bg-rose-600", async () => {
            await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ 
                deletedQs: firebase.firestore.FieldValue.arrayUnion(qId) 
            });
            showToast('🗑️ 提問已刪除');
        });
    };
    window.archiveLiveQA = async function(qId) {
        if (!window.currentSpaceCode) return;
        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ 
            focusedQ: null, archivedQs: firebase.firestore.FieldValue.arrayUnion(qId) 
        });
        showToast('📦 提問已封存');
    };
    window.restoreLiveQA = async function(qId) {
        if (!window.currentSpaceCode) return;
        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ 
            archivedQs: firebase.firestore.FieldValue.arrayRemove(qId) 
        });
        showToast('✅ 提問已恢復');
    };
    window.focusLiveQA = async function(qId) {
        if (!window.currentSpaceCode) return;
        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ focusedQ: qId });
    };
    window.unfocusLiveQA = async function() {
        if (!window.currentSpaceCode) return;
        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ focusedQ: null });
    };

    function showQuestionModal(spaceCode, liveSettings, editIdx = -1) {
        const modalId = "live-add-q-modal";
        if (document.getElementById(modalId)) return;

        const isEdit = editIdx >= 0;
        const qData = isEdit ? liveData[editIdx] : null;

        // 解析安全次數限制，防呆預設為 0
        const rawLimitVal = isEdit ? parseQuestionLimit(qData).toString() : '1';

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = "fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[100000] flex items-center justify-center p-4 opacity-0 transition-opacity duration-200";
        modal.innerHTML = `
            <div class="relative bg-white rounded-2xl w-full max-w-lg p-5 shadow-xl transform transition-transform scale-95 origin-center flex flex-col max-h-[85vh] border border-gray-200">
                <button id="btn-close-modal-icon" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"><span class="material-symbols-outlined text-[20px]">close</span></button>
                
                <div class="flex items-center gap-2 mb-4 flex-shrink-0">
                    <span class="material-symbols-outlined text-teal-600 text-2xl">${isEdit ? 'edit_square' : 'add_circle'}</span> 
                    <h3 class="text-xl font-extrabold text-gray-800">${isEdit ? '編輯題目' : '新增題目'}</h3>
                </div>
                
                <div class="overflow-y-auto flex-1 px-1 hide-scrollbar">
                    <div class="mb-4">
                        <label class="block text-xs font-bold text-gray-500 mb-1.5">題型選擇</label>
                        <div class="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                            ${['單選', '多選', '排序', '評分', '文字', '問答', '白板', '公告'].map(t => `
                                <label class="cursor-pointer">
                                    <input type="radio" name="newQType" value="${t}" class="peer sr-only" ${(!isEdit && t === '單選') || (isEdit && qData.type === t) ? 'checked' : ''}>
                                    <div class="text-center py-1.5 border border-gray-200 rounded-lg peer-checked:border-teal-500 peer-checked:bg-teal-50 peer-checked:text-teal-700 font-bold transition-all text-[11px]">${t === '文字' ? '文字雲' : t === '問答' ? 'Q&A' : t === '白板' ? '白板' : t === '公告' ? '公告' : t}</div>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="block text-xs font-bold text-gray-500 mb-1.5">題目內容 / 公告標題</label>
                        <input type="text" id="new-q-text" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 focus:border-teal-400 outline-none transition-colors" placeholder="輸入內容..." value="${isEdit ? escapeHtml(qData.question) : ''}">
                    </div>

                    <div id="new-q-limit-container" class="mb-4" style="display: ${isEdit && ['文字', '問答'].includes(qData.type) ? 'block' : 'none'};">
                        <label class="block text-xs font-bold text-gray-500 mb-1.5">回答次數限制 (每位學生)</label>
                        <select id="new-q-limit" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:border-teal-400">
                            <option value="1" ${rawLimitVal === '1' ? 'selected' : ''}>1 次</option>
                            <option value="2" ${rawLimitVal === '2' ? 'selected' : ''}>2 次</option>
                            <option value="3" ${rawLimitVal === '3' ? 'selected' : ''}>3 次</option>
                            <option value="0" ${rawLimitVal === '0' ? 'selected' : ''}>不限次數 (預設)</option>
                        </select>
                    </div>

                    <div id="new-q-options-container" class="mb-2" style="display: ${!isEdit || ['單選', '多選', '排序', '公告'].includes(qData.type) ? 'block' : 'none'};">
                        <label class="block text-xs font-bold text-gray-500 mb-1.5">選項 / 公告內容 (用逗號或換行分隔)</label>
                        <textarea id="new-q-options" class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 focus:border-teal-400 outline-none transition-colors resize-none" rows="4" placeholder="例如：選項A, 選項B, 選項C">${isEdit && qData.options && qData.type !== '文字' && qData.type !== '問答' ? qData.options.join('\n') : ''}</textarea>
                    </div>
                </div>

                <div class="flex justify-end gap-2 pt-4 border-t border-gray-100 flex-shrink-0 flex-wrap">
                    <button id="btn-cancel-add-q" class="px-4 py-2 rounded-lg font-bold text-gray-500 hover:bg-gray-100 transition-colors text-sm border border-gray-200">取消</button>
                    ${!isEdit ? `<button id="btn-save-only-q" class="px-4 py-2 rounded-lg font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-sm">儲存 (不發布)</button>` : ''}
                    <button id="btn-confirm-add-q" class="px-5 py-2 rounded-lg font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm text-sm">${isEdit ? '儲存變更' : '儲存並發布'}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('.transform').classList.remove('scale-95'); }, 10);

        const closeModal = () => { modal.classList.add('opacity-0'); modal.querySelector('.transform').classList.add('scale-95'); setTimeout(() => modal.remove(), 200); };

        modal.querySelector('#btn-close-modal-icon').addEventListener('click', closeModal);
        modal.querySelector('#btn-cancel-add-q').addEventListener('click', closeModal);

        const optContainer = modal.querySelector('#new-q-options-container');
        modal.querySelectorAll('input[name="newQType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const t = e.target.value;
                if (['單選', '多選', '排序', '公告'].includes(t)) optContainer.style.display = 'block';
                else optContainer.style.display = 'none';
                
                if (['文字', '問答', '白板'].includes(t)) {
                    modal.querySelector('#new-q-limit-container').style.display = 'block';
                    
                    if (!isEdit) {
                        const limitSelect = modal.querySelector('#new-q-limit');
                        if (t === '白板') {
                            limitSelect.value = '0';
                        } else {
                            limitSelect.value = '1'; // 切換回文字或問答時，預設回 1 次
                        }
                    }
                } else {
                    modal.querySelector('#new-q-limit-container').style.display = 'none';
                }
            });
        });

        const saveQuestionData = () => {
            const type = modal.querySelector('input[name="newQType"]:checked').value;
            const text = modal.querySelector('#new-q-text').value.trim();
            let options = [];
            
            if (!text) { showToast('⚠️ 請輸入內容'); return false; }
            if (['單選', '多選', '排序'].includes(type)) {
                const rawOpts = modal.querySelector('#new-q-options').value;
                options = rawOpts.split(/[,\n]+/).map(o => o.trim()).filter(o => o);
                if (options.length < 2) { showToast('⚠️ 此題型至少需要 2 個選項'); return false; }
            } else if (type === '公告') {
                const rawOpts = modal.querySelector('#new-q-options').value;
                options = [rawOpts]; 
            } else if (['文字', '問答', '白板'].includes(type)) {
                options = [modal.querySelector('#new-q-limit').value];
            }

            if (isEdit) {
                liveData[editIdx].type = type;
                liveData[editIdx].question = text;
                liveData[editIdx].options = options;
            } else {
                liveData.push({ id: generateUniqueId(), type: type, question: text, options: options });
            }
            
            syncLiveDataToEditor();
            updateSidebarUI(spaceCode, liveSettings);
            return true;
        };

        if (!isEdit) {
            modal.querySelector('#btn-save-only-q').addEventListener('click', () => {
                if (saveQuestionData()) {
                    showToast('✅ 題目已儲存');
                    modal.querySelector('#new-q-text').value = '';
                    modal.querySelector('#new-q-options').value = '';
                }
            });
        }

        modal.querySelector('#btn-confirm-add-q').addEventListener('click', () => {
            if (saveQuestionData()) {
                if (!isEdit) currentQIndex = liveData.length - 1;                
                modal.remove();                 
                if (currentQIndex >= 0) triggerLiveQuestion(spaceCode, liveSettings);
                showToast(`✅ 已${isEdit ? '儲存變更' : '發布新題目'}！`);
            }
        });
    }

    async function initLiveRouter() {
        const urlParams = new URLSearchParams(window.location.search);
        const autoJoinCode = urlParams.get('live');
        
        // ✨ 新增：房主恢復機制
        const savedHostCode = sessionStorage.getItem('live_host_code');
        
        // 如果沒有學生加入代碼，但有房主代碼，嘗試恢復
        if (!autoJoinCode && savedHostCode) {
    try {
        const doc = await db.collection(window.SPACES_COLLECTION).doc(savedHostCode).get();
        if (doc.exists && doc.data().status !== 'finished') {
            currentSpaceCode = savedHostCode;
            window.currentSpaceCode = savedHostCode;

            // ✨ 修改：優先從暫存恢復完整題庫，解決動態題目在重新整理後消失的問題
            const cachedLiveData = sessionStorage.getItem(`live_data_cache_${savedHostCode}`);
            if (cachedLiveData) {
                liveData = JSON.parse(cachedLiveData);
            } else {
                const latestRawData = getLatestRawData(rawData);
                liveData = parseLiveData(latestRawData, configs.hasHeader);
            }
            
            const data = doc.data();
            window.currentSpaceData = data;
            startGlobalPlayerListener(savedHostCode);
            
            if (data.status === 'playing') {
                currentQIndex = data.currentQuestion;
                // 確保優先使用資料庫備份的題目數據
                const restoredQData = data.currentQuestionData || liveData[currentQIndex]; 
                renderTeacherLiveQuestion(savedHostCode, restoredQData, configs.liveSettings);
            }
            return;
		 }
		} catch (err) {
                sessionStorage.removeItem('live_host_code');
            }
        }

        // --- 以下為原本的學生端或進入設定頁邏輯 ---
        if (autoJoinCode) {
            const savedSessionName = sessionStorage.getItem(`live_session_${autoJoinCode}`);
            if (savedSessionName) {
                const playerDoc = await db.collection(window.SPACES_COLLECTION).doc(autoJoinCode).collection("players").doc(savedSessionName).get();
                if (playerDoc.exists) {
                    startLiveStudentListener(autoJoinCode, savedSessionName);
                    return; 
                }
            }
            renderStudentJoinForm(autoJoinCode, false);
        } else {
            renderHostSettings(); 
        }
    }

    function renderHostSettings() {
        liveContainer.innerHTML = `
            <div class="w-full h-full bg-[#f4f4f5] font-sans select-none overflow-y-auto pb-12">
                <div class="w-full max-w-4xl mx-auto flex flex-col px-4 sm:px-8 mt-6 sm:mt-8">
                    <div class="w-full flex justify-between items-center mb-2 z-10 relative">
                        <button id="btn-back-to-editor" class="bg-white hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-full flex items-center gap-1 font-bold shadow-sm border border-gray-200 cursor-pointer transition-colors flex-shrink-0">
                            <span class="material-symbols-outlined text-xl">arrow_back</span> 返回
                        </button>
                        <div class="flex items-center gap-3">
                            <button id="btn-create-live-space" class="bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-lg py-2.5 px-8 rounded-full shadow-md transition-transform hover:-translate-y-1 cursor-pointer flex items-center gap-2">
                                <span class="material-symbols-outlined">rocket_launch</span> 建立問答空間
                            </button>
                        </div>
                    </div>

                    <div class="w-full flex flex-col items-center justify-center mb-10 z-10 relative text-center">
                        <h2 class="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-wide">互動問答設定</h2>
                        <p class="text-slate-500 font-bold">設定你的課堂 Q&A 與即時投票</p>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div class="bg-teal-50 px-4 py-3 border-b border-teal-100 flex items-center gap-2">
                            <span class="material-symbols-outlined text-teal-600">tune</span>
                            <h3 class="font-bold text-teal-900">問答與發言權限</h3>
                        </div>
                        <div class="p-6 flex flex-col gap-5">
                            <div class="flex items-center justify-between">
                                <div class="flex flex-col pr-4">
                                    <span class="font-bold text-gray-800 text-sm">強制匿名參與</span>
                                    <span class="text-xs text-gray-500 mt-1">學生進入時將無法輸入暱稱，一律匿名參與</span>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input type="checkbox" id="live-force-anonymous" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-back-to-editor').addEventListener('click', cleanupLive);
        
        document.getElementById('btn-create-live-space').addEventListener('click', async () => {
            const forceAnonymous = document.getElementById('live-force-anonymous').checked;
            if (typeof showToast === 'function') showToast('⏳ 正在建立問答空間...');
            
            const finalConfigs = { ...configs, liveSettings: { forceAnonymous } };
            const spaceCode = await window.createArenaSpace(finalConfigs); 
            if (spaceCode) {
                currentSpaceCode = spaceCode; 
                
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('live');
                newUrl.searchParams.set('mode', 'live');
                window.history.replaceState({}, document.title, newUrl.href);

                const latestRawData = getLatestRawData(rawData);
                liveData = parseLiveData(latestRawData, finalConfigs.hasHeader);
                
                renderTeacherLiveLobby(spaceCode, finalConfigs);
            }
        });
    }

    function updateSidebarUI(spaceCode, liveSettings) {
        const sidebarList = document.getElementById('live-sidebar-list');
        if (!sidebarList) return;

        const answeredQs = getAnsweredQIds();

        sidebarList.innerHTML = liveData.map((q, idx) => {
            const isActive = idx === currentQIndex;
            const hasAnswers = answeredQs.includes(q.id);

            let typeIcon = 'poll';
            if (q.type === '文字') typeIcon = 'cloud';
            else if (q.type === '問答') typeIcon = 'forum';
            else if (q.type === '多選') typeIcon = 'checklist';
            else if (q.type === '排序') typeIcon = 'sort';
            else if (q.type === '評分') typeIcon = 'star';
            else if (q.type === '公告') typeIcon = 'campaign';
            else if (q.type === '白板') typeIcon = 'sticky_note_2';

            return `
                <div class="sidebar-item group relative flex flex-col p-2.5 mx-2 my-1.5 rounded-xl cursor-pointer transition-all border-2 ${isActive ? 'bg-teal-50 border-teal-500 shadow-sm' : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50 shadow-sm'}" data-idx="${idx}">
                    <div class="flex justify-between items-start mb-1.5">
                        <div class="text-[10px] font-bold ${isActive ? 'text-teal-700 bg-teal-100/50' : 'text-gray-500 bg-gray-100'} px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">${typeIcon}</span> 
                            ${q.type} ${hasAnswers ? '<span class="material-symbols-outlined text-[12px] font-black text-teal-500 ml-0.5" title="有作答紀錄">check</span>' : ''}
                        </div>
                        <button class="btn-more-options text-gray-400 hover:text-teal-600 p-0.5 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity" data-idx="${idx}">
                            <span class="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                        
                        <div id="q-menu-${idx}" class="q-menu-dropdown hidden absolute right-2 top-8 w-32 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1 font-bold text-sm">
                            <div class="px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-teal-600 cursor-pointer flex items-center gap-2 menu-edit" data-idx="${idx}"><span class="material-symbols-outlined text-[16px]">edit</span> 編輯</div>
                            <div class="px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-teal-600 cursor-pointer flex items-center gap-2 menu-duplicate" data-idx="${idx}"><span class="material-symbols-outlined text-[16px]">content_copy</span> 重製</div>
                            <div class="px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-teal-600 cursor-pointer flex items-center gap-2 menu-up" data-idx="${idx}"><span class="material-symbols-outlined text-[16px]">arrow_upward</span> 上移</div>
                            <div class="px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-teal-600 cursor-pointer flex items-center gap-2 menu-down" data-idx="${idx}"><span class="material-symbols-outlined text-[16px]">arrow_downward</span> 下移</div>
                            <div class="border-t border-gray-100 my-1"></div>
                            <div class="px-3 py-2 text-rose-500 hover:bg-rose-50 cursor-pointer flex items-center gap-2 menu-delete" data-idx="${idx}"><span class="material-symbols-outlined text-[16px]">delete</span> 刪除</div>
                        </div>
                    </div>
                    <div class="text-sm font-extrabold text-gray-800 line-clamp-2 leading-relaxed flex items-start gap-1">
                        <span class="text-gray-300 select-none flex-shrink-0">${idx + 1}.</span> 
                        <span class="select-none">${escapeHtml(q.question)}</span>
                    </div>
                </div>
            `;
        }).join('');

        sidebarList.querySelectorAll('.btn-more-options').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = btn.dataset.idx;
                const menu = document.getElementById(`q-menu-${idx}`);
                
                document.querySelectorAll('.q-menu-dropdown').forEach(m => { 
                    if (m.id !== `q-menu-${idx}`) m.classList.add('hidden'); 
                });
                
                if (menu.classList.contains('hidden')) {
                    menu.classList.remove('hidden');
                    
                    menu.style.top = '2rem'; 
                    menu.style.bottom = 'auto';
                    
                    const rect = menu.getBoundingClientRect();
                    
                    if (rect.bottom > window.innerHeight - 20) {
                        menu.style.top = 'auto';
                        menu.style.bottom = '100%'; 
                        menu.style.marginBottom = '5px'; 
                    }
                } else {
                    menu.classList.add('hidden');
                }
            });
        });

        document.addEventListener('click', () => { document.querySelectorAll('.q-menu-dropdown').forEach(m => m.classList.add('hidden')); }, { once: false });

        sidebarList.querySelectorAll('.sidebar-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('.q-menu-dropdown')) return; 
                const idx = parseInt(el.dataset.idx, 10);
                if (idx !== currentQIndex) {
                    currentQIndex = idx;
                    triggerLiveQuestion(spaceCode, liveSettings);
                }
            });
        });

        sidebarList.querySelectorAll('.menu-edit').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); showQuestionModal(spaceCode, liveSettings, parseInt(btn.dataset.idx, 10)); document.querySelectorAll('.q-menu-dropdown').forEach(m => m.classList.add('hidden'));});
        });
        sidebarList.querySelectorAll('.menu-duplicate').forEach(btn => {
            btn.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                const idx = parseInt(btn.dataset.idx, 10);
                const q = liveData[idx];
                liveData.splice(idx + 1, 0, { id: generateUniqueId(), type: q.type, question: q.question + " (複製)", options: [...(q.options||[])] });
                syncLiveDataToEditor();
                updateSidebarUI(spaceCode, liveSettings);
            });
        });
        sidebarList.querySelectorAll('.menu-up').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); const idx = parseInt(btn.dataset.idx, 10); if (idx > 0) moveQuestion(idx, -1, spaceCode, liveSettings); });
        });
        sidebarList.querySelectorAll('.menu-down').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); const idx = parseInt(btn.dataset.idx, 10); if (idx < liveData.length - 1) moveQuestion(idx, 1, spaceCode, liveSettings); });
        });
        sidebarList.querySelectorAll('.menu-delete').forEach(btn => {
            btn.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                document.querySelectorAll('.q-menu-dropdown').forEach(m => m.classList.add('hidden'));
                const idx = parseInt(btn.dataset.idx, 10);
                showDeleteQuestionConfirm(liveData[idx].question, () => {
                    liveData.splice(idx, 1);
                    syncLiveDataToEditor();
                    if (currentQIndex === idx) {
                        currentQIndex = -1; 
                        triggerLiveQuestion(spaceCode, liveSettings);
                    } else {
                        if (currentQIndex > idx) currentQIndex--;
                        updateSidebarUI(spaceCode, liveSettings);
                    }
                });
            });
        });
    }

    function moveQuestion(idx, dir, spaceCode, liveSettings) {
        const temp = liveData[idx];
        liveData[idx] = liveData[idx + dir];
        liveData[idx + dir] = temp;

        if (currentQIndex === idx) currentQIndex = idx + dir;
        else if (currentQIndex === idx + dir) currentQIndex = idx;

        syncLiveDataToEditor(); 
        triggerLiveQuestion(spaceCode, liveSettings);
    }

    function updateTeacherCharts() {
        const contentArea = document.getElementById('live-content-area');
        const countDisplay = document.getElementById('response-count-display');
        const headerArea = document.getElementById('live-question-header');
        if (!contentArea || !window.currentSpaceData) return;

        if (currentQIndex === -1) return; 

        const qData = liveData[currentQIndex] || window.currentSpaceData.currentQuestionData;
        if (!qData) return;

        const qId = qData.id; 
        let activeResponsesCount = 0;

        if (qData.type === '單選' || qData.type === '多選') {
            const counts = new Array(qData.options.length).fill(0);
            globalPlayers.forEach(p => {
                const ans = p[`ans_${qId}`];
                if (ans !== undefined) {
                    if (Array.isArray(ans)) {
                        ans.forEach(aIdx => { if (aIdx >= 0 && aIdx < counts.length) counts[aIdx]++; });
                        activeResponsesCount++;
                    } else if (ans >= 0 && ans < counts.length) {
                        counts[ans]++;
                        activeResponsesCount++;
                    }
                }
            });
            
            if (countDisplay) countDisplay.textContent = activeResponsesCount;

            if (!contentArea.querySelector('#live-chart-area')) {
                contentArea.innerHTML = `
                    <div class="flex-1 flex items-end justify-center gap-4 sm:gap-10 w-full pt-4 pb-2" id="live-chart-area">
                        ${qData.options.map((opt, i) => `
                            <div class="flex flex-col items-center justify-end h-full w-16 md:w-28 relative group">
                                <span class="text-2xl md:text-3xl font-black mb-2 text-gray-500 z-10 response-count select-text" data-opt="${i}">0</span>
                                <div class="w-full ${optionColors[i % optionColors.length]} rounded-t-lg transition-all duration-700 ease-out shadow-sm flex flex-col justify-end overflow-hidden response-bar" data-opt="${i}" style="height: 2%; min-height: 2%;"></div>
                                <span class="mt-3 font-bold text-gray-700 text-sm md:text-lg text-center w-full break-words leading-tight px-1 select-text">${escapeHtml(opt)}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            const maxCount = Math.max(...counts, 1); 
            counts.forEach((c, i) => {
                const bar = contentArea.querySelector(`.response-bar[data-opt="${i}"]`);
                const text = contentArea.querySelector(`.response-count[data-opt="${i}"]`);
                if (bar && text) {
                    text.textContent = c;
                    text.classList.toggle('text-teal-700', c > 0);
                    const pct = (c / maxCount) * 90; 
                    bar.style.height = `${Math.max(pct, 2)}%`;
                }
            });

        } else if (qData.type === '評分') {
            let totalStars = 0;
            const starCounts = [0, 0, 0, 0, 0]; 
            
            globalPlayers.forEach(p => {
                const ans = p[`ans_${qId}`]; 
                if (ans >= 1 && ans <= 5) {
                    totalStars += ans;
                    starCounts[ans - 1]++;
                    activeResponsesCount++;
                }
            });
            if (countDisplay) countDisplay.textContent = activeResponsesCount;

            const avg = activeResponsesCount > 0 ? (totalStars / activeResponsesCount).toFixed(1) : "0.0";
            const maxCount = Math.max(...starCounts, 1);

            contentArea.innerHTML = `
                <div class="flex-1 flex flex-col sm:flex-row items-center justify-center gap-10 w-full p-4 h-full">
                    <div class="flex flex-col items-center justify-center bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 min-w-[250px]">
                        <span class="text-[5rem] font-black text-amber-500 leading-none select-text">${avg}</span>
                        <div class="flex gap-1 text-amber-400 text-3xl mt-2 mb-4">
                            ${[1,2,3,4,5].map(s => `<span class="material-symbols-outlined font-bold select-none" style="font-variation-settings: 'FILL' ${Math.round(avg) >= s ? 1 : 0}">${Math.round(avg) >= s ? 'star' : 'star_border'}</span>`).join('')}
                        </div>
                        <div class="text-gray-400 font-bold select-text"><span class="material-symbols-outlined text-sm align-middle select-none">person</span> ${activeResponsesCount} 則評分</div>
                    </div>
                    <div class="flex flex-col justify-center gap-3 w-full max-w-sm">
                        ${[5,4,3,2,1].map(stars => `
                            <div class="flex items-center gap-3">
                                <span class="font-bold text-gray-600 w-4 select-text">${stars}</span>
                                <span class="material-symbols-outlined text-amber-400 text-lg select-none" style="font-variation-settings: 'FILL' 1">star</span>
                                <div class="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden relative">
                                    <div class="bg-amber-400 h-full rounded-full transition-all duration-700" style="width: ${Math.max((starCounts[stars-1]/maxCount)*100, 0)}%"></div>
                                </div>
                                <span class="text-sm font-bold text-gray-400 w-6 text-right select-text">${starCounts[stars-1]}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

        } else if (qData.type === '排序') {
            const N = qData.options.length;
            const scores = new Array(N).fill(0);
            
            globalPlayers.forEach(p => {
                const rankArray = p[`ans_${qId}`]; 
                if (Array.isArray(rankArray) && rankArray.length === N) {
                    activeResponsesCount++;
                    rankArray.forEach((optIdx, rankPos) => {
                        const points = N - rankPos;
                        scores[optIdx] += points;
                    });
                }
            });
            if (countDisplay) countDisplay.textContent = activeResponsesCount;

            let results = qData.options.map((opt, i) => ({ opt, score: scores[i], index: i }));
            results.sort((a, b) => b.score - a.score);
            const maxScore = Math.max(...scores, 1);

            contentArea.innerHTML = `
                <div class="flex-1 flex flex-col justify-center gap-4 w-full max-w-3xl mx-auto p-4">
                    ${results.map((r, rank) => `
                        <div class="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 transition-transform hover:scale-[1.01]">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-xl select-none ${rank === 0 ? 'bg-yellow-100 text-yellow-600' : rank === 1 ? 'bg-gray-200 text-gray-600' : rank === 2 ? 'bg-orange-100 text-orange-700' : 'bg-teal-50 text-teal-600'}">
                                ${rank + 1}
                            </div>
                            <div class="flex-1 flex flex-col justify-center">
                                <div class="flex justify-between items-end mb-1">
                                    <span class="font-extrabold text-gray-800 text-lg select-text">${escapeHtml(r.opt)}</span>
                                    <span class="font-bold text-gray-400 text-sm select-text">${r.score} 分</span>
                                </div>
                                <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div class="${optionColors[r.index % optionColors.length]} h-full rounded-full transition-all duration-700" style="width: ${Math.max((r.score/maxScore)*100, 2)}%"></div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

        } else if (qData.type === '文字') {
            const allTexts = [];
            globalPlayers.forEach(p => {
                const txtData = p[`text_${qId}`];
                if (Array.isArray(txtData)) {
                    txtData.forEach(t => {
                        if (t) { allTexts.push({ playerName: p.name, text: t, ts: p[`ts_${qId}`] }); activeResponsesCount++; }
                    });
                } else if (typeof txtData === 'string' && txtData) {
                    allTexts.push({ playerName: p.name, text: txtData, ts: p[`ts_${qId}`] }); activeResponsesCount++;
                }
            });
            if (countDisplay) countDisplay.textContent = activeResponsesCount;

            if (activeResponsesCount === 0) {
                contentArea.innerHTML = '<div class="w-full bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col items-center justify-center h-full"><span class="text-gray-400 font-bold text-xl animate-pulse select-none">等待參與者輸入...</span></div>';
                return;
            }
            
            const mods = window.currentSpaceData[`wc_mods_${qId}`] || {};
            const rawWordCounts = {};
            allTexts.forEach(t => {
                const word = (t.text || '').trim();
                if (word) rawWordCounts[word] = (rawWordCounts[word] || 0) + 1;
            });
            
            const wordCounts = {};
            Object.keys(rawWordCounts).forEach(w => {
                const mod = mods[w] || {};
                if (mod.hidden) return; 
                const displayWord = mod.text || w;
                wordCounts[displayWord] = (wordCounts[displayWord] || 0) + rawWordCounts[w];
            });
            
            let cloudHtml = '';
            const words = Object.keys(rawWordCounts).filter(w => !(mods[w] || {}).hidden); 
            
            if (words.length > 0) {
                const maxWCount = Math.max(...Object.values(wordCounts));
                const styleList = [
                    'bg-blue-100 text-blue-900', 'bg-teal-100 text-teal-900', 
                    'bg-gray-200 text-gray-800', 'bg-sky-100 text-sky-900', 
                    'bg-slate-200 text-slate-800'
                ];
                
                words.sort((a, b) => {
                    const countA = wordCounts[(mods[a] || {}).text || a] || 0;
                    const countB = wordCounts[(mods[b] || {}).text || b] || 0;
                    return countB - countA;
                });
                
                const arrangedWords = [];
                words.forEach((w, i) => {
                    if (i % 2 === 0) arrangedWords.push(w);
                    else arrangedWords.unshift(w);
                });

                cloudHtml = arrangedWords.map(word => {
                    const mod = mods[word] || {};
                    const displayWord = mod.text || word;
                    const count = wordCounts[displayWord];
                    const ratio = maxWCount > 1 ? count / maxWCount : 0.5;
                    const baseSize = maxWCount > 1 ? 1.2 + (ratio * 2.8) : 2.5; 
                    const finalSize = baseSize * (mod.zoom || 1); 
                    
                    const px = 0.8 + (ratio * 0.4);   
                    const py = 0.2 + (ratio * 0.3);   
                    const styleClass = styleList[Math.abs(displayWord.length + count) % styleList.length]; 
                    
                    return `
                        <div class="relative group inline-block m-1">
                            <span class="inline-block font-black ${styleClass} rounded-2xl transition-all duration-300 ease-out shadow-sm cursor-pointer hover:ring-2 hover:ring-teal-400 select-text" style="font-size: ${finalSize}rem; padding: ${py}rem ${px}rem; line-height: 1;" onclick="document.querySelectorAll('.wc-menu').forEach(m=>m.classList.add('hidden')); document.getElementById('wc-menu-${escapeHtml(word)}').classList.remove('hidden'); event.stopPropagation();">
                                ${escapeHtml(displayWord)}
                            </span>
                            
                            <div id="wc-menu-${escapeHtml(word)}" class="wc-menu hidden absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 flex overflow-hidden select-none">
                                <button class="px-3 py-2 hover:bg-gray-100 text-gray-600 font-bold border-r border-gray-100 flex items-center justify-center btn-wc-action" data-action="zoomin" data-word="${escapeHtml(word)}" title="放大"><span class="material-symbols-outlined text-[18px]">add</span></button>
                                <button class="px-3 py-2 hover:bg-gray-100 text-gray-600 font-bold border-r border-gray-100 flex items-center justify-center btn-wc-action" data-action="zoomout" data-word="${escapeHtml(word)}" title="縮小"><span class="material-symbols-outlined text-[18px]">remove</span></button>
                                <button class="px-3 py-2 hover:bg-gray-100 text-blue-500 font-bold border-r border-gray-100 flex items-center justify-center btn-wc-action" data-action="edit" data-word="${escapeHtml(word)}" title="編輯"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                                <button class="px-3 py-2 hover:bg-red-50 text-red-500 font-bold flex items-center justify-center btn-wc-action" data-action="delete" data-word="${escapeHtml(word)}" title="隱藏"><span class="material-symbols-outlined text-[18px]">visibility_off</span></button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
            allTexts.sort((a, b) => b.ts - a.ts); 
            
            if(typeof window.isWordCloudListOpen === 'undefined') window.isWordCloudListOpen = false;
            
            contentArea.innerHTML = `
                <div class="flex flex-col w-full h-full gap-2 mt-1 overflow-hidden" onclick="document.querySelectorAll('.wc-menu').forEach(m=>m.classList.add('hidden'));">
                    <div class="flex-1 w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-wrap justify-center items-center content-center text-center relative overflow-y-auto gap-2 sm:gap-3 select-text">
                        <div class="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-teal-500 to-transparent pointer-events-none"></div>
                        ${cloudHtml}
                    </div>
                    
                    <div class="w-full flex flex-col flex-shrink-0 mt-1 select-text">
                        <button onclick="window.isWordCloudListOpen = !window.isWordCloudListOpen; this.nextElementSibling.classList.toggle('hidden'); this.querySelector('.icon').textContent = window.isWordCloudListOpen ? 'expand_less' : 'expand_more';" class="mx-auto text-xs font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-5 py-2 rounded-full mb-1 transition-colors flex items-center gap-1 shadow-sm cursor-pointer select-none">
                            <span class="material-symbols-outlined text-[16px] icon">${window.isWordCloudListOpen ? 'expand_less' : 'expand_more'}</span> 
                            <span>個別回覆清單 (${allTexts.length})</span>
                        </button>
                        
                        <div class="${window.isWordCloudListOpen ? 'flex' : 'hidden'} w-full bg-white border border-gray-100 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] p-4 overflow-y-auto flex-wrap gap-2 content-start scrollbar-thin max-h-[30vh]">
                            ${allTexts.map(t => `
                                <div class="group relative bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm flex flex-col max-w-full break-words animate-fade-in-up pr-7">
                                    <span class="text-[10px] font-bold text-teal-600 select-text">${escapeHtml(t.playerName)}</span>
                                    <span class="text-sm font-bold text-gray-800 select-text">${escapeHtml(t.text)}</span>
                                    <button class="absolute right-1 top-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded btn-delete-text select-none" data-pname="${escapeHtml(t.playerName)}" data-text="${encodeURIComponent(t.text)}" title="刪除此留言"><span class="material-symbols-outlined text-[16px]">delete</span></button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            contentArea.querySelectorAll('.btn-wc-action').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    const word = btn.dataset.word;
                    const spaceRef = db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode);
                    const currentMods = window.currentSpaceData[`wc_mods_${qId}`] || {};
                    const mod = currentMods[word] || { zoom: 1, hidden: false, text: word };

                    if (action === 'zoomin') mod.zoom = (mod.zoom || 1) + 0.3;
                    else if (action === 'zoomout') mod.zoom = Math.max(0.4, (mod.zoom || 1) - 0.3);
                    else if (action === 'edit') {
                        document.querySelectorAll('.wc-menu').forEach(m=>m.classList.add('hidden'));
                        showPrompt("編輯文字", mod.text, async (newText) => {
                            if (newText) {
                                mod.text = newText.trim();
                                currentMods[word] = mod;
                                await spaceRef.update({ [`wc_mods_${qId}`]: currentMods });
                            }
                        });
                        return; 
                    }
                    else if (action === 'delete') {
                        document.querySelectorAll('.wc-menu').forEach(m=>m.classList.add('hidden'));
                        showCustomConfirm("隱藏氣泡", `確定要在畫面上隱藏「${word}」嗎？`, "隱藏", "bg-rose-500 hover:bg-rose-600", async () => {
                            mod.hidden = true;
                            currentMods[word] = mod;
                            await spaceRef.update({ [`wc_mods_${qId}`]: currentMods });
                        });
                        return;
                    }
                    
                    currentMods[word] = mod;
                    await spaceRef.update({ [`wc_mods_${qId}`]: currentMods });
                });
            });

            contentArea.querySelectorAll('.btn-delete-text').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const pName = e.currentTarget.dataset.pname;
                    const pText = decodeURIComponent(e.currentTarget.dataset.text);
                    showCustomConfirm("刪除留言", "確定要刪除這筆留言嗎？", "確認刪除", "bg-rose-500 hover:bg-rose-600", async () => {
                        try {
                            const pData = globalPlayers.find(p => p.name === pName) || {};
                            let texts = pData[`text_${qId}`] || [];
                            if (!Array.isArray(texts)) texts = [texts];
                            
                            const idx = texts.indexOf(pText);
                            if (idx > -1) {
                                texts.splice(idx, 1);
                                await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).collection("players").doc(pName).update({
                                    [`text_${qId}`]: texts
                                });
                            }
                        } catch(err) {}
                    });
                });
            });

        } else if (qData.type === '問答') {
            const archivedQs = window.currentSpaceData.archivedQs || [];
            const deletedQs = window.currentSpaceData.deletedQs || [];
            const focusedQId = window.currentSpaceData.focusedQ;

            let allQuestions = [];
            globalPlayers.forEach(p => {
                const qs = p[`qa_${qId}`] || [];
                qs.forEach(q => {
                    if (!deletedQs.includes(q.id)) {
                        allQuestions.push({ id: q.id, author: p.name, text: q.text, ts: q.ts, upvoteCount: 0 });
                        if (!archivedQs.includes(q.id)) {
                            activeResponsesCount++;
                        }
                    }
                });
            });
            if (countDisplay) countDisplay.textContent = activeResponsesCount;

            globalPlayers.forEach(p => {
                const upvotes = p[`qa_upvotes_${qId}`] || [];
                upvotes.forEach(upvId => {
                    const q = allQuestions.find(x => x.id === upvId);
                    if (q) q.upvoteCount++;
                });
            });

            const focusedQ = allQuestions.find(q => q.id === focusedQId);
            if (focusedQ) {
                if (headerArea) headerArea.classList.add('hidden');
                contentArea.innerHTML = `
                    <div class="relative flex flex-col items-center justify-center h-full w-full p-6 text-center animate-fade-in-up bg-white rounded-2xl shadow-sm border border-gray-100">
                        <button class="absolute top-4 left-4 text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl font-bold flex items-center gap-1 transition-colors border border-gray-200 select-none" onclick="window.unfocusLiveQA()">
                            <span class="material-symbols-outlined text-[20px]">arrow_back</span> 返回
                        </button>
                        <span class="material-symbols-outlined text-4xl text-teal-500 mb-3 drop-shadow-sm mt-8 select-none">campaign</span>
                        <span class="text-lg font-bold text-gray-500 mb-2 bg-gray-50 px-4 py-1 rounded-full border border-gray-200 select-none">${escapeHtml(focusedQ.author)} 的提問：</span>
                        <h1 class="text-3xl md:text-4xl font-extrabold text-teal-900 leading-tight mb-6 select-text">${escapeHtml(focusedQ.text)}</h1>
                    </div>
                `;
                return;
            } else {
                if (headerArea) headerArea.classList.remove('hidden');
            }

            const activeQuestions = allQuestions.filter(q => !archivedQs.includes(q.id)).sort((a, b) => b.upvoteCount - a.upvoteCount || b.ts - a.ts);
            const archivedQuestions = allQuestions.filter(q => archivedQs.includes(q.id)).sort((a, b) => b.ts - a.ts);

            if (typeof window.isQaArchiveOpen === 'undefined') window.isQaArchiveOpen = false;

            let html = `
                <div class="flex-1 w-full bg-white border border-gray-100 rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] p-4 sm:p-5 overflow-y-auto mt-1 flex flex-col gap-3 scrollbar-thin select-text">
            `;

            if (activeQuestions.length === 0 && archivedQuestions.length === 0) {
                html += `<div class="text-center text-gray-400 font-bold text-xl animate-pulse my-auto select-none">等待參與者提問...</div>`;
            } else {
                html += activeQuestions.map(q => `
                    <div class="bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm flex gap-3 items-start animate-fade-in-up transition-transform hover:-translate-y-0.5 group">
                        <div class="flex items-center justify-center bg-teal-50 border border-teal-100 text-teal-700 rounded-md px-2 py-1 min-w-[3.5rem] shrink-0 select-none">
                            <span class="material-symbols-outlined text-[16px] leading-none">thumb_up</span>
                            <span class="font-black text-sm ml-1.5 leading-none">${q.upvoteCount}</span>
                        </div>
                        <div class="flex flex-col flex-1 break-words">
                            <span class="text-[11px] font-bold text-gray-400 mb-0.5 select-text">${escapeHtml(q.author)} • ${new Date(q.ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span class="text-sm font-bold text-gray-800 leading-snug select-text">${escapeHtml(q.text)}</span>
                        </div>
                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity select-none shrink-0">
                            <button class="bg-white border border-gray-200 hover:bg-blue-50 text-gray-500 hover:text-blue-600 p-1.5 rounded-lg shadow-sm transition-colors cursor-pointer flex flex-col items-center gap-0.5" onclick="window.focusLiveQA('${q.id}')" title="在大螢幕聚焦顯示">
                                <span class="material-symbols-outlined text-[16px]">center_focus_strong</span>
                            </button>
                            <button class="bg-white border border-gray-200 hover:bg-amber-50 text-gray-500 hover:text-amber-600 p-1.5 rounded-lg shadow-sm transition-colors cursor-pointer flex flex-col items-center gap-0.5" onclick="window.archiveLiveQA('${q.id}')" title="標記為已回答並移至封存區">
                                <span class="material-symbols-outlined text-[16px]">inventory_2</span>
                            </button>
                            <button class="bg-white border border-gray-200 hover:bg-rose-50 text-gray-500 hover:text-rose-600 p-1.5 rounded-lg shadow-sm transition-colors cursor-pointer flex flex-col items-center gap-0.5" onclick="window.deleteLiveQA('${q.id}')" title="永久刪除提問">
                                <span class="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                        </div>
                    </div>
                `).join('');

                if (archivedQuestions.length > 0) {
                    html += `
                        <div class="w-full flex flex-col flex-shrink-0 mt-4 border-t border-gray-200 pt-4 select-none">
                            <button onclick="window.isQaArchiveOpen = !window.isQaArchiveOpen; this.nextElementSibling.classList.toggle('hidden'); this.querySelector('.icon').textContent = window.isQaArchiveOpen ? 'expand_less' : 'expand_more';" class="mr-auto text-xs font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-full mb-3 transition-colors flex items-center gap-1 shadow-sm cursor-pointer">
                                <span class="material-symbols-outlined text-[16px] icon">${window.isQaArchiveOpen ? 'expand_less' : 'expand_more'}</span> 
                                <span>已封存的提問 (${archivedQuestions.length})</span>
                            </button>
                            <div class="${window.isQaArchiveOpen ? 'flex' : 'hidden'} flex-col gap-2 w-full select-text">
                                ${archivedQuestions.map(q => `
                                    <div class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 shadow-sm flex gap-3 items-start opacity-70 hover:opacity-100 transition-opacity group">
                                        <div class="flex items-center justify-center bg-gray-200 text-gray-500 rounded-md px-2 py-1 shrink-0 select-none">
                                            <span class="material-symbols-outlined text-[14px] leading-none">thumb_up</span>
                                            <span class="font-black text-xs ml-1 leading-none">${q.upvoteCount}</span>
                                        </div>
                                        <div class="flex flex-col flex-1 break-words mt-0.5">
                                            <span class="text-[10px] font-bold text-gray-400 mb-0.5 select-text">${escapeHtml(q.author)} • ${new Date(q.ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            <span class="text-sm font-bold text-gray-600 leading-snug line-through select-text">${escapeHtml(q.text)}</span>
                                        </div>
                                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity select-none shrink-0">
                                            <button class="bg-white border border-gray-200 hover:bg-teal-50 text-gray-500 hover:text-teal-600 p-1.5 rounded-lg shadow-sm transition-colors cursor-pointer flex flex-col items-center gap-0.5" onclick="window.restoreLiveQA('${q.id}')" title="恢復提問至問答區">
                                                <span class="material-symbols-outlined text-[16px]">unarchive</span>
                                            </button>
                                            <button class="bg-white border border-gray-200 hover:bg-rose-50 text-gray-500 hover:text-rose-600 p-1.5 rounded-lg shadow-sm transition-colors cursor-pointer flex flex-col items-center gap-0.5" onclick="window.deleteLiveQA('${q.id}')" title="永久刪除提問">
                                                <span class="material-symbols-outlined text-[16px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }
            }
            html += `</div>`;
            contentArea.innerHTML = html;
		} else if (qData.type === '白板') {
            if (headerArea) headerArea.classList.add('hidden');
            
            // 初始化畫布狀態 (平移與縮放)
            if (typeof window.boardZoom === 'undefined') window.boardZoom = 1;
            if (typeof window.boardPan === 'undefined') window.boardPan = { x: 0, y: 0 };
            
            const boardMods = window.currentSpaceData[`board_mods_${qId}`] || {};
            let allNotes = [];
            globalPlayers.forEach(p => {
                const notes = p[`board_${qId}`] || [];
                notes.forEach(n => {
                    if (!boardMods[n.id]?.deleted) {
                        const mod = boardMods[n.id] || {};
                        allNotes.push({ ...n, author: p.name, text: mod.text || n.text });
                        activeResponsesCount++;
                    }
                });
            });
            if (countDisplay) countDisplay.textContent = activeResponsesCount;

            let canvas = document.getElementById('whiteboard-canvas');
            if (!canvas) {
                contentArea.innerHTML = `
                    <div class="w-full flex justify-between items-center mb-2 px-2 mt-2 select-none">
                        <div class="font-extrabold text-teal-800 text-xl flex items-center gap-2 min-w-0">
                            <span class="material-symbols-outlined text-teal-500 flex-shrink-0">sticky_note_2</span> 
                            <span class="truncate">${escapeHtml(qData.question)}</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm flex-shrink-0 ml-2">
                            <button onclick="window.updateBoardZoom(-0.1)" class="p-1 hover:bg-gray-100 rounded text-gray-500 cursor-pointer"><span class="material-symbols-outlined text-[18px]">remove</span></button>
                            <span id="board-zoom-val" class="text-xs font-black text-gray-400 min-w-[40px] text-center">${Math.round(window.boardZoom * 100)}%</span>
                            <button onclick="window.updateBoardZoom(0.1)" class="p-1 hover:bg-gray-100 rounded text-gray-500 cursor-pointer"><span class="material-symbols-outlined text-[18px]">add</span></button>
                            <button onclick="window.resetBoardView()" class="p-1 hover:bg-gray-100 rounded text-teal-600 border-l border-gray-100 ml-1 cursor-pointer" title="重置視角"><span class="material-symbols-outlined text-[18px]">restart_alt</span></button>
                        </div>
                    </div>
                    <div class="w-full flex-1 relative bg-slate-100 rounded-2xl shadow-[inset_0_2px_15px_rgba(0,0,0,0.05)] overflow-hidden border border-gray-200 min-w-0" id="whiteboard-canvas" style="cursor: grab;">
                        <div id="board-content-layer" class="absolute inset-0 origin-top-left bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px]"></div>
                    </div>
                `;
                canvas = document.getElementById('whiteboard-canvas');
                const contentLayer = document.getElementById('board-content-layer');

                // 視角控制函數
                window.updateBoardView = () => {
                    contentLayer.style.transform = `translate(${window.boardPan.x}px, ${window.boardPan.y}px) scale(${window.boardZoom})`;
                    const zoomVal = document.getElementById('board-zoom-val');
                    if (zoomVal) zoomVal.textContent = Math.round(window.boardZoom * 100) + '%';
                };

                window.updateBoardZoom = (delta) => {
                    window.boardZoom = Math.max(0.2, Math.min(3, window.boardZoom + delta));
                    window.updateBoardView();
                };

                window.resetBoardView = () => {
                    window.boardZoom = 1; window.boardPan = { x: 0, y: 0 };
                    window.updateBoardView();
                };

                // ✨ 核心拖曳與畫布平移引擎
                let isPanning = false;
                let draggedNote = null;
                let startPos = { x: 0, y: 0 };
                let initialPan = { x: 0, y: 0 };
                let noteOffset = { x: 0, y: 0 };

                canvas.addEventListener('mousedown', (e) => {
                    const note = e.target.closest('.sticky-note');
                    if (note && !e.target.closest('button')) {
                        // 拖曳便利貼
                        draggedNote = note;
                        const rect = note.getBoundingClientRect();
                        // 考慮縮放修正偏移量
                        noteOffset.x = (e.clientX - rect.left) / window.boardZoom;
                        noteOffset.y = (e.clientY - rect.top) / window.boardZoom;
                        note.style.zIndex = 1000;
                    } else if (e.target === canvas || e.target === contentLayer) {
                        // 平移畫布
                        isPanning = true;
                        canvas.style.cursor = 'grabbing';
                        startPos = { x: e.clientX, y: e.clientY };
                        initialPan = { ...window.boardPan };
                    }
                });

                document.addEventListener('mousemove', (e) => {
                    if (draggedNote) {
                        const cRect = canvas.getBoundingClientRect();
                        // ✨ 精確公式：(滑鼠位置 - 畫布起點 - 目前畫布平移量) / 縮放倍率 - 滑鼠在便利貼內的相對位移
                        let x = (e.clientX - cRect.left - window.boardPan.x) / window.boardZoom - noteOffset.x;
                        let y = (e.clientY - cRect.top - window.boardPan.y) / window.boardZoom - noteOffset.y;
                        draggedNote.style.left = x + 'px';
                        draggedNote.style.top = y + 'px';
                    } else if (isPanning) {
                        window.boardPan.x = initialPan.x + (e.clientX - startPos.x);
                        window.boardPan.y = initialPan.y + (e.clientY - startPos.y);
                        window.updateBoardView();
                    }
                });

                document.addEventListener('mouseup', async () => {
                    if (draggedNote) {
                        const noteId = draggedNote.dataset.id;
                        const currentMods = window.currentSpaceData[`board_mods_${qId}`] || {};
                        currentMods[noteId] = { 
                            ...currentMods[noteId], 
                            x: parseFloat(draggedNote.style.left), 
                            y: parseFloat(draggedNote.style.top) 
                        };
                        draggedNote.style.zIndex = 10;
                        draggedNote = null;
                        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${qId}`]: currentMods });
                    }
                    if (isPanning) {
                        isPanning = false;
                        canvas.style.cursor = 'grab';
                    }
                });

                window.updateBoardView(); // 初始套用
            }


            

            // ✨ 擴充顏色映射表：加入白色與灰色
            const colorMap = { 
                'yellow': 'bg-yellow-100 border-yellow-200', 
                'pink': 'bg-pink-100 border-pink-200', 
                'blue': 'bg-blue-100 border-blue-200', 
                'green': 'bg-green-100 border-green-200',
                'white': 'bg-white border-gray-200 shadow-sm', 
                'gray': 'bg-gray-200 border-gray-300' 
            };
            const contentLayer = document.getElementById('board-content-layer');
			if (!contentLayer) return;

            allNotes.forEach((note, index) => {
                let noteEl = document.getElementById('note-' + note.id);
                const mod = boardMods[note.id] || {};
                const startX = mod.x !== undefined ? mod.x : 20 + ((index % 8) * 170);
                const startY = mod.y !== undefined ? mod.y : 20 + (Math.floor(index / 8) * 110);

                if (!noteEl) {
                    noteEl = document.createElement('div');
                    noteEl.id = 'note-' + note.id;
                    noteEl.className = `sticky-note absolute p-3 shadow-sm rounded-lg border w-40 cursor-grab group transition-shadow hover:shadow-lg ${colorMap[note.color] || colorMap['yellow']}`;
                    noteEl.dataset.id = note.id;
                    noteEl.innerHTML = `
                        <div class="flex justify-end gap-1 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="edit-btn p-0.5 hover:text-blue-600 cursor-pointer"><span class="material-symbols-outlined text-[14px]">edit</span></button>
                            <button class="delete-btn p-0.5 hover:text-red-600 cursor-pointer"><span class="material-symbols-outlined text-[14px]">close</span></button>
                        </div>
                        <div class="text-sm font-bold text-gray-800 break-words pointer-events-none select-text">${escapeHtml(note.text)}</div>
                        <div class="mt-2 text-[10px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">${escapeHtml(note.author)}</div>
                    `;
                    contentLayer.appendChild(noteEl);

                    // 綁定編輯與刪除
                    noteEl.querySelector('.delete-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        showCustomConfirm("刪除點子", "確定要永久刪除此點子嗎？", "確認刪除", "bg-rose-500", async () => {
                            const currentMods = window.currentSpaceData[`board_mods_${qId}`] || {};
                            currentMods[note.id] = { ...currentMods[note.id], deleted: true };
                            noteEl.remove();
                            await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${qId}`]: currentMods });
                        });
                    });
                    noteEl.querySelector('.edit-btn').addEventListener('click', (e) => {
                        e.stopPropagation();
                        showPrompt("編輯點子內容", note.text, async (newVal) => {
                            if (newVal) {
                                const currentMods = window.currentSpaceData[`board_mods_${qId}`] || {};
                                currentMods[note.id] = { ...currentMods[note.id], text: newVal };
                                await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${qId}`]: currentMods });
                            }
                        });
                    });
                }
                
                if (noteEl.style.cursor !== 'grabbing') {
                    noteEl.style.left = startX + 'px';
                    noteEl.style.top = startY + 'px';
                    noteEl.querySelector('.text-sm').textContent = note.text;
                }
            });
        } else if (qData.type === '公告') {
            if (headerArea) headerArea.classList.add('hidden'); 
            
            let flashcardHtml = `<div class="flex flex-col gap-4 w-full max-w-3xl mx-auto overflow-hidden mt-4 pb-12 h-full justify-center">`;
            const content = qData.options[0] || '';
            const formattedPage = escapeHtml(content).replace(/\\n|\n/g, '<br>');
            flashcardHtml += `
                <div class="bg-white rounded-[2rem] shadow-sm border border-teal-100 p-8 md:p-12 flex items-center justify-center text-center border-l-8 border-l-teal-400 min-h-[30vh]">
                    <span class="text-2xl md:text-4xl font-bold text-gray-800 leading-relaxed select-text">${formattedPage}</span>
                </div>
            `;
            flashcardHtml += `</div>`;
            contentArea.innerHTML = flashcardHtml;
        }
    }

    function startGlobalPlayerListener(spaceCode) {
        window.currentSpaceCode = spaceCode; 

        if (unsubscribeSpace) unsubscribeSpace();
        unsubscribeSpace = db.collection(window.SPACES_COLLECTION).doc(spaceCode).onSnapshot((doc) => {
            if (doc.exists) {
                window.currentSpaceData = doc.data();
                if (window.currentSpaceData.status === 'playing') updateTeacherCharts();
                
                const gPauseBtn = document.getElementById('btn-sidebar-global-pause');
                if (gPauseBtn) {
                    if (window.currentSpaceData.isGlobalPaused) {
                        gPauseBtn.className = 'px-2 py-1 rounded text-xs font-bold transition-colors bg-amber-100 text-amber-700';
                        gPauseBtn.textContent = '繼續';
                    } else {
                        gPauseBtn.className = 'px-2 py-1 rounded text-xs font-bold transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200';
                        gPauseBtn.textContent = '暫停';
                    }
                }
            }
        });

        if (unsubscribePlayers) unsubscribePlayers(); 
        unsubscribePlayers = db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").onSnapshot((snapshot) => {
            globalPlayers = [];
            snapshot.forEach(doc => {
                const pData = doc.data();
                globalPlayers.push(pData);

                if (pData.flyEmoji && pData.flyEmoji.ts > (window.lastEmojiTs[pData.name] || 0)) {
                    window.lastEmojiTs[pData.name] = pData.flyEmoji.ts;
                    spawnFloatingEmoji(pData.flyEmoji.e);
                }
            });
            
            const countEl = document.getElementById('live-player-count');
            const playersGrid = document.getElementById('live-players-grid');
            if (countEl && playersGrid) {
                countEl.textContent = globalPlayers.length;
                if (globalPlayers.length > 0) {
                    playersGrid.innerHTML = globalPlayers.map(p => `
                        <div class="player-card relative group cursor-pointer" data-name="${p.name}" title="點擊踢出">
                            <div class="bg-white/90 text-teal-900 font-extrabold px-5 py-2.5 rounded-xl group-hover:line-through group-hover:bg-red-100 group-hover:text-red-600 transition-all flex items-center gap-2 shadow-lg text-lg border-2 border-transparent group-hover:border-red-300">
                                ${p.emoji ? `<span class="text-2xl">${p.emoji}</span>` : ''}
                                ${escapeHtml(p.name)}
                            </div>
                        </div>
                    `).join('');
                } else {
                    playersGrid.innerHTML = '<div class="text-teal-300/70 font-bold text-xl mt-10 animate-pulse select-none">等待參與者加入...</div>';
                }
            }

            if (window.currentSpaceData && window.currentSpaceData.status === 'playing') {
                const liveSettings = window.currentSpaceData.config?.liveSettings;
                updateSidebarUI(spaceCode, liveSettings); 
                updateTeacherCharts();
            }
        });
    }

    function renderTeacherLiveLobby(spaceCode, finalConfigs) {
        const displayCode = spaceCode.substring(0, 2) + ' ' + spaceCode.substring(2);
        window.currentSpaceCode = spaceCode;
		sessionStorage.setItem('live_host_code', spaceCode);
        startGlobalPlayerListener(spaceCode);

        liveContainer.innerHTML = getLiveQrModalHtml(spaceCode) + `
            <div class="w-full h-full flex flex-col bg-teal-900 relative font-sans overflow-y-auto select-none">
                <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(circle at 20px 20px, white 2%, transparent 0%), radial-gradient(circle at 100px 100px, white 2%, transparent 0%); background-size: 120px 120px;"></div>
                
                <div class="w-full p-4 flex justify-start z-50 flex-shrink-0 relative">
                    <button id="btn-back-home" class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full flex items-center gap-1 font-bold border border-white/20 cursor-pointer backdrop-blur-sm transition-colors"><span class="material-symbols-outlined text-lg">close</span> 結束問答</button>
                </div>

                <div class="w-full flex justify-center mt-2 sm:mt-4 z-10 px-4 flex-shrink-0 relative">
                    <div class="bg-white rounded-xl shadow-2xl flex flex-wrap sm:flex-nowrap overflow-hidden border-b-4 border-teal-200 hover:scale-[1.02] transition-transform w-full max-w-sm sm:max-w-max" id="btn-copy-live-link">
                        <div class="flex items-center justify-center px-6 py-4 bg-teal-50 border-b sm:border-b-0 sm:border-r border-teal-100 cursor-pointer w-full sm:w-auto transition-colors hover:bg-teal-100" title="點擊複製加入網址">
                            <span class="material-symbols-outlined text-3xl text-teal-600 pointer-events-none">link</span>
                        </div>
                        <div class="flex flex-col justify-center px-10 py-3 bg-white cursor-pointer w-full sm:w-auto text-center" title="點擊複製加入網址">
                            <span class="text-xs text-gray-400 font-bold tracking-wider mb-1 pointer-events-none">空間代碼 PIN</span>
                            <span class="text-6xl font-black text-teal-900 tracking-widest drop-shadow-sm pointer-events-none">${displayCode}</span>
                        </div>
                        <div class="p-2 bg-white border-t sm:border-t-0 sm:border-l border-gray-100 flex items-center justify-center w-full sm:w-auto">
                            <span class="material-symbols-outlined text-4xl text-teal-600 px-5 cursor-pointer hover:scale-110 transition-transform" onclick="document.getElementById('live-qr-modal').classList.remove('hidden')">qr_code_2</span>
                        </div>
                    </div>
                </div>

                <div class="flex-1 flex flex-col items-center mt-6 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-6 z-10 relative">
                    <div class="flex justify-between items-center w-full mb-6 bg-black/20 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/10 flex-wrap gap-4 shadow-inner">
                        <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined text-3xl text-teal-300">group</span>
                            <span class="text-2xl font-bold text-white"><span id="live-player-count">0</span> 人加入</span>
                        </div>
                        <button id="btn-start-live" class="bg-teal-500 hover:bg-teal-400 text-white font-extrabold py-3 px-8 rounded-xl shadow-lg transition-colors text-xl flex-shrink-0 cursor-pointer">開始互動</button>
                    </div>
                    <div id="live-players-grid" class="flex flex-wrap gap-3 w-full content-start justify-center overflow-y-auto scrollbar-thin pb-4">
                        <div class="text-teal-300/70 font-bold text-xl mt-10 animate-pulse">等待參與者加入...</div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-back-home').addEventListener('click', cleanupLive);

        document.getElementById('btn-copy-live-link').addEventListener('click', (e) => {
            if (e.target.tagName === 'SPAN' && e.target.textContent === 'qr_code_2') return;
            const joinUrl = window.location.origin + window.location.pathname + '?live=' + spaceCode;
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(joinUrl).then(() => showToast('🔗 已複製問答邀請網址！'));
            } else {
                if (typeof showPrompt === 'function') showPrompt('請手動複製以下網址：', joinUrl, () => {});
            }
        });

        document.getElementById('live-players-grid').addEventListener('click', async (e) => {
            const playerCard = e.target.closest('.player-card');
            if (!playerCard) return;
            const pName = playerCard.dataset.name;
            showCustomConfirm("踢出參與者", `確定要踢出「${pName}」嗎？`, "踢出", "bg-rose-500 hover:bg-rose-600", async () => {
                await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(pName).delete();
                showToast(`🚷 已踢出 ${pName}`);
            });
        });

        document.getElementById('btn-start-live').addEventListener('click', () => {
            if (liveData.length === 0) {
                const currentRawData = getLatestRawData(rawData);
                liveData = parseLiveData(currentRawData, finalConfigs.hasHeader);
            }
            if (liveData.length === 0) return showToast('⚠️ 題庫解析失敗或無資料，請檢查表格！');
            
            sessionStorage.setItem(`live_data_cache_${spaceCode}`, JSON.stringify(liveData));
            
            currentQIndex = -1; 
            window.arenaIsPaused = false; 
            triggerLiveQuestion(spaceCode, finalConfigs.liveSettings);
        });
    }

    async function triggerLiveQuestion(spaceCode, liveSettings) {
        const qData = currentQIndex >= 0 ? liveData[currentQIndex] : null;
        window.arenaIsPaused = false; 
        
        const updateData = { 
            status: 'playing', 
            currentQuestion: currentQIndex,
            currentQuestionData: qData,
            isPaused: false,
            focusedQ: null 
        };
        
        if (qData && qData.id) {
            updateData.visitedQs = firebase.firestore.FieldValue.arrayUnion(qData.id);
        }
        
        await db.collection(window.SPACES_COLLECTION).doc(spaceCode).update(updateData);
        renderTeacherLiveQuestion(spaceCode, qData, liveSettings);
    }

    function renderTeacherLiveQuestion(spaceCode, qData, liveSettings) {
        const displayCode = spaceCode.substring(0, 2) + ' ' + spaceCode.substring(2);
        let isResultsHidden = false; 

        liveContainer.innerHTML = getLiveQrModalHtml(spaceCode) + `
            <div class="w-full h-full flex bg-[#f8f9fa] font-sans select-none overflow-hidden relative">
                
                <div id="live-sidebar-wrapper" class="bg-gray-50 border-r border-gray-200 flex flex-col h-full flex-shrink-0 z-30 animate-width relative" style="width: ${window.isLiveSidebarOpen ? window.liveSidebarWidth + 'px' : '0px'}">
                    <div class="flex items-center justify-between px-3 py-2.5 bg-white border-b border-gray-200 flex-shrink-0 shadow-[0_2px_4px_rgba(0,0,0,0.02)] z-20">
                        <div class="font-extrabold text-gray-800 text-sm">總覽</div>
                        <div class="flex items-center gap-1">
                            <button id="btn-sidebar-global-pause" class="px-2 py-1 rounded text-xs font-bold transition-colors ${window.currentSpaceData?.isGlobalPaused ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}">${window.currentSpaceData?.isGlobalPaused ? '繼續' : '暫停'}</button>
                            <button id="btn-sidebar-finish" class="px-2 py-1 rounded text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">結束</button>
                            <button id="btn-sidebar-add-q" class="px-2 py-1 rounded text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors">新增</button>
                        </div>
                    </div>

                    <div id="live-sidebar-list" class="flex-1 overflow-y-auto scrollbar-thin py-2"></div>
                    
                    <div id="live-sidebar-resizer" class="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-teal-400 z-50 group transition-colors">
                        <div class="absolute inset-y-0 right-0 w-1 bg-gray-200 group-hover:bg-teal-400"></div>
                    </div>
                </div>

                <div class="flex-1 flex flex-col h-full relative min-w-0 bg-white shadow-[-5px_0_15px_rgba(0,0,0,0.02)]">
                    <div class="w-full px-3 py-1.5 sm:py-2 flex flex-wrap justify-between items-center bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] z-20 gap-y-2 border-b border-gray-200 flex-shrink-0">
                        <div class="flex items-center gap-2 sm:gap-3">
                            <button id="btn-toggle-sidebar" class="text-gray-500 hover:text-teal-600 hover:bg-teal-50 p-1.5 rounded-lg transition-colors cursor-pointer ${window.isLiveSidebarOpen ? 'bg-teal-50 text-teal-600' : ''}" title="收合側欄">
                                <span class="material-symbols-outlined">menu</span>
                            </button>
                            <div class="text-gray-700 font-bold text-sm flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-200 transition bg-gray-50">
                                <span class="text-gray-400 hidden sm:inline cursor-pointer hover:text-gray-600" onclick="document.getElementById('live-qr-modal')?.classList.remove('hidden')" title="顯示 QR Code">代碼:</span>
                                <span class="text-lg tracking-widest font-black text-teal-700 cursor-pointer hover:text-teal-900" onclick="document.getElementById('live-qr-modal')?.classList.remove('hidden')" title="顯示 QR Code">${displayCode}</span>
                                <button id="btn-copy-code-link" class="text-gray-400 hover:text-teal-600 p-1 rounded hover:bg-gray-200 transition-colors ml-1" title="複製邀請網址"><span class="material-symbols-outlined text-[16px]">content_copy</span></button>
                            </div>
                            <div class="font-bold text-teal-700 text-sm flex items-center bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">
                                已收 <span id="response-count-display" class="font-black ml-1">0</span>
                            </div>
                        </div>

                        ${currentQIndex >= 0 ? `
                        <div class="flex items-center gap-1 sm:gap-2">
                            ${['文字', '問答'].includes(qData.type) ? `
                            <div class="relative mr-1 sm:mr-2">
                                <button id="btn-limit-settings" class="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer" title="作答限制設定">
                                    <span class="material-symbols-outlined text-[16px] text-gray-500">tune</span>
                                </button>
                                <div id="limit-settings-menu" class="hidden absolute top-full mt-1 right-0 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-3 flex flex-col gap-3">
                                    <div>
                                        <span class="text-[11px] font-bold text-gray-400 mb-1.5 block">每人次數上限</span>
                                        <div class="flex gap-1" id="live-limit-btns">
                                            ${[1, 2, 3, 0].map(v => `<button class="flex-1 py-1 rounded text-xs font-bold border ${parseQuestionLimit(qData)===v ? 'bg-teal-50 border-teal-500 text-teal-700 active-limit' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}" data-val="${v}">${v===0?'不限':v}</button>`).join('')}
                                        </div>
                                    </div>
                                    ${qData.type === '文字' ? `
                                    <div class="flex items-center justify-between border-t border-gray-100 pt-2 mt-1">
                                        <span class="text-[11px] font-bold text-gray-400">允許輸入重複詞</span>
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id="live-allow-dup" class="sr-only peer" ${qData.options && qData.options[1] === 'true' ? 'checked' : ''}>
                                            <div class="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-500"></div>
                                        </label>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                            ` : ''}
                            <button id="btn-clear-results" class="bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 text-xs sm:text-sm font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-gray-200 hover:border-red-200" title="清除此題作答紀錄">
                                <span class="material-symbols-outlined text-[16px]">refresh</span> <span class="hidden xl:inline">重新作答</span>
                            </button>
                            <button id="btn-toggle-pause" class="bg-gray-50 hover:bg-amber-50 text-gray-600 hover:text-amber-700 text-xs sm:text-sm font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-gray-200 hover:border-amber-200" onclick="window.toggleLivePause()">
                                <span class="material-symbols-outlined text-[16px]">pause</span> <span class="hidden xl:inline">暫停收件</span>
                            </button>
                            <button id="btn-toggle-results" class="bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 text-xs sm:text-sm font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-gray-200 hover:border-indigo-200">
                                <span class="material-symbols-outlined text-[16px]">visibility_off</span> <span class="hidden xl:inline">隱藏結果</span>
                            </button>
                        </div>
                        <div class="flex items-center gap-1">
                            <button id="btn-prev-live" class="text-gray-500 hover:text-teal-600 hover:bg-teal-50 p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30" ${currentQIndex === 0 ? 'disabled' : ''}>
                                <span class="material-symbols-outlined">chevron_left</span>
                            </button>
                            <span class="text-gray-600 font-bold text-sm min-w-[2.5rem] text-center select-none">${currentQIndex + 1} / ${liveData.length}</span>
                            <button id="btn-next-live" class="text-gray-500 hover:text-teal-600 hover:bg-teal-50 p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30" ${currentQIndex === liveData.length - 1 ? 'disabled' : ''}>
                                <span class="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                        ` : `<div></div>`}
                    </div>

                    ${currentQIndex >= 0 ? `
                        <div class="w-full max-w-[1000px] mx-auto px-4 sm:px-6 mt-3 sm:mt-4 flex-shrink-0 select-text" id="live-question-header">
                             <div class="w-full bg-white px-4 py-3 sm:py-4 rounded-[1rem] shadow-sm text-center border-t-4 border-teal-500 flex flex-col items-center justify-center min-h-[6vh]">
                                 <h2 class="text-lg md:text-xl font-extrabold text-gray-800 leading-snug break-words max-w-full select-text">
                                    <span class="inline-block align-middle text-[11px] font-black bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full mr-2 border border-teal-100 transform -translate-y-0.5 select-none">${qData.type}</span>
                                    ${escapeHtml(qData.question)}
                                 </h2>
                             </div>
                        </div>
                        <div class="w-full max-w-[1000px] mx-auto px-4 sm:px-6 flex-1 flex flex-col min-h-0 z-20 transition-opacity duration-300 pb-4 sm:pb-6 mt-2 select-text" id="live-content-area"></div>
                        <div class="sm:hidden w-full bg-white border-t border-gray-200 flex justify-between p-3 flex-shrink-0 z-20">
                            <button id="btn-prev-mobile" class="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold" ${currentQIndex === 0 ? 'disabled style="opacity:0.5"' : ''}>上一題</button>
                            <span class="font-bold text-gray-500 my-auto">${currentQIndex + 1} / ${liveData.length}</span>
                            <button id="btn-next-mobile" class="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold" ${currentQIndex === liveData.length - 1 ? 'disabled style="opacity:0.5"' : ''}>下一題</button>
                        </div>
                    ` : `
                        <div class="flex-1 flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in-up bg-gray-50/50">
                            <div class="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                                <span class="material-symbols-outlined text-teal-500 animate-periodic-wiggle origin-bottom" style="font-size: 4.5rem;">co_present</span>
                            </div>
                            <h2 class="text-3xl sm:text-4xl font-black text-gray-800 mb-3 tracking-wide">準備好開始了嗎？</h2>
                            <p class="text-gray-500 font-bold text-lg max-w-md mx-auto leading-relaxed">請從左側面板點選一題開始，或是點擊上方「新增」建立臨時調查！</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        updateSidebarUI(spaceCode, liveSettings);

        document.getElementById('btn-sidebar-global-pause')?.addEventListener('click', window.toggleLiveGlobalPause);
        document.getElementById('btn-sidebar-finish')?.addEventListener('click', () => {
            showCustomConfirm("結束問答", "確定要結束這場問答嗎？結束後將無法繼續收集回覆。", "結束並查看報告", "bg-rose-500 hover:bg-rose-600", async () => {
                await db.collection(window.SPACES_COLLECTION).doc(spaceCode).update({ status: 'finished' });
                renderTeacherSummaryScreen(spaceCode);
            });
        });
        document.getElementById('btn-sidebar-add-q')?.addEventListener('click', () => { showQuestionModal(spaceCode, liveSettings); });

        let isResizing = false;
        const resizer = document.getElementById('live-sidebar-resizer');
        const sidebar = document.getElementById('live-sidebar-wrapper');
        if (resizer && sidebar) {
            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                document.body.style.cursor = 'col-resize';
                sidebar.classList.remove('animate-width'); 
            });
            document.addEventListener('mousemove', (e) => {
                if (!isResizing || !window.isLiveSidebarOpen) return;
                let newWidth = e.clientX;
                if (newWidth < 200) newWidth = 200;
                if (newWidth > 600) newWidth = 600;
                sidebar.style.width = newWidth + 'px';
                window.liveSidebarWidth = newWidth;
            });
            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.cursor = '';
                    sidebar.classList.add('animate-width');
                }
            });
        }

        const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
        if (btnToggleSidebar && sidebar) {
            btnToggleSidebar.addEventListener('click', () => {
                window.isLiveSidebarOpen = !window.isLiveSidebarOpen;
                if (window.isLiveSidebarOpen) {
                    sidebar.classList.remove('collapsed');
                    sidebar.style.width = window.liveSidebarWidth + 'px';
                    btnToggleSidebar.classList.add('bg-teal-50', 'text-teal-600');
                } else {
                    sidebar.classList.add('collapsed');
                    sidebar.style.width = '0px';
                    btnToggleSidebar.classList.remove('bg-teal-50', 'text-teal-600');
                }
            });
        }
        
        document.getElementById('btn-close-sidebar-mobile')?.addEventListener('click', () => {
            window.isLiveSidebarOpen = false;
            sidebar.classList.add('collapsed');
            sidebar.style.width = '0px';
            btnToggleSidebar?.classList.remove('bg-teal-50', 'text-teal-600');
        });

        document.getElementById('btn-copy-code-link')?.addEventListener('click', () => {
            const joinUrl = window.location.origin + window.location.pathname + '?live=' + spaceCode;
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(joinUrl).then(() => showToast('🔗 已複製邀請網址！'));
            } else {
                if (typeof showPrompt === 'function') showPrompt('請手動複製以下網址：', joinUrl, () => {});
            }
        });

        if (window.arenaIsPaused) {
            const pauseBtn = document.getElementById('btn-toggle-pause');
            if(pauseBtn) {
                pauseBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">play_arrow</span> <span class="hidden xl:inline">開放收件</span>';
                pauseBtn.classList.replace('bg-gray-50', 'bg-amber-50');
                pauseBtn.classList.replace('hover:bg-amber-50', 'hover:bg-amber-100');
                pauseBtn.classList.replace('text-gray-600', 'text-amber-700');
                pauseBtn.classList.replace('border-gray-200', 'border-amber-300');
            }
        }

        const btnToggleResults = document.getElementById('btn-toggle-results');
        const contentArea = document.getElementById('live-content-area');

        if (btnToggleResults) {
            btnToggleResults.addEventListener('click', () => {
                isResultsHidden = !isResultsHidden;
                if (isResultsHidden) {
                    btnToggleResults.innerHTML = '<span class="material-symbols-outlined text-[16px]">visibility</span> <span class="hidden xl:inline">顯示結果</span>';
                    btnToggleResults.classList.replace('bg-gray-50', 'bg-indigo-50');
                    btnToggleResults.classList.replace('hover:bg-indigo-50', 'hover:bg-indigo-100');
                    btnToggleResults.classList.replace('text-gray-600', 'text-indigo-700');
                    btnToggleResults.classList.replace('border-gray-200', 'border-indigo-300');
                    if (contentArea) contentArea.style.opacity = '0';
                } else {
                    btnToggleResults.innerHTML = '<span class="material-symbols-outlined text-[16px]">visibility_off</span> <span class="hidden xl:inline">隱藏結果</span>';
                    btnToggleResults.classList.replace('bg-indigo-50', 'bg-gray-50');
                    btnToggleResults.classList.replace('hover:bg-indigo-100', 'hover:bg-indigo-50');
                    btnToggleResults.classList.replace('text-indigo-700', 'text-gray-600');
                    btnToggleResults.classList.replace('border-indigo-300', 'border-gray-200');
                    if (contentArea) contentArea.style.opacity = '1';
                }
            });
        }

        const btnLimitSettings = document.getElementById('btn-limit-settings');
        const limitMenu = document.getElementById('limit-settings-menu');
        if (btnLimitSettings && limitMenu) {
            btnLimitSettings.addEventListener('click', (e) => {
                e.stopPropagation();
                limitMenu.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!limitMenu.contains(e.target) && e.target !== btnLimitSettings) limitMenu.classList.add('hidden');
            });

            const updateSettings = async () => {
                const newLimit = limitMenu.querySelector('.active-limit')?.dataset.val || '1';
                const allowDup = limitMenu.querySelector('#live-allow-dup')?.checked ? 'true' : 'false';
                qData.options = [newLimit, allowDup];
                liveData[currentQIndex].options = [newLimit, allowDup];
                syncLiveDataToEditor(); 
                await db.collection(window.SPACES_COLLECTION).doc(spaceCode).update({ currentQuestionData: qData });
                showToast('✅ 設定已即時更新');
            };

            limitMenu.querySelectorAll('#live-limit-btns button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    limitMenu.querySelectorAll('#live-limit-btns button').forEach(b => b.className = 'flex-1 py-1 rounded text-xs font-bold border bg-white border-gray-200 text-gray-500 hover:bg-gray-50');
                    e.target.className = 'flex-1 py-1 rounded text-xs font-bold border bg-teal-50 border-teal-500 text-teal-700 active-limit';
                    updateSettings();
                });
            });
            document.getElementById('live-allow-dup')?.addEventListener('change', updateSettings);
        }

        document.getElementById('btn-clear-results')?.addEventListener('click', async () => {
            showCustomConfirm("重新作答", "確定要清除「此題」的所有作答紀錄並重新開始嗎？", "確認清除", "bg-red-500 hover:bg-red-600", async () => {
                const qId = qData.id;
                showToast("⏳ 正在清除紀錄...");
                let batch = db.batch();
                let count = 0;
                
                globalPlayers.forEach(p => {
                    const ref = db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(p.name);
                    batch.update(ref, {
                        [`ans_${qId}`]: firebase.firestore.FieldValue.delete(),
                        [`text_${qId}`]: firebase.firestore.FieldValue.delete(),
                        [`ts_${qId}`]: firebase.firestore.FieldValue.delete(),
                        [`qa_${qId}`]: firebase.firestore.FieldValue.delete(),
                        [`qa_upvotes_${qId}`]: firebase.firestore.FieldValue.delete()
                    });
                    count++;
                    if (count % 400 === 0) { batch.commit(); batch = db.batch(); }
                });

                const spaceRef = db.collection(window.SPACES_COLLECTION).doc(spaceCode);
                batch.update(spaceRef, { focusedQ: null, archivedQs: [], visitedQs: firebase.firestore.FieldValue.arrayRemove(qId) }); 

                try {
                    await batch.commit();
                    showToast("✅ 紀錄已清除，可重新作答");
                } catch (e) { showToast("❌ 清除失敗"); }
            });
        });

        document.getElementById('btn-prev-live')?.addEventListener('click', () => { if (currentQIndex > 0) { currentQIndex--; triggerLiveQuestion(spaceCode, liveSettings); }});
        document.getElementById('btn-next-live')?.addEventListener('click', () => { if (currentQIndex < liveData.length - 1) { currentQIndex++; triggerLiveQuestion(spaceCode, liveSettings); }});
        
        document.getElementById('btn-prev-mobile')?.addEventListener('click', () => { if (currentQIndex > 0) { currentQIndex--; triggerLiveQuestion(spaceCode, liveSettings); }});
        document.getElementById('btn-next-mobile')?.addEventListener('click', () => { if (currentQIndex < liveData.length - 1) { currentQIndex++; triggerLiveQuestion(spaceCode, liveSettings); }});

        if (currentQIndex >= 0) updateTeacherCharts();
    }

    function renderTeacherSummaryScreen(spaceCode) {
        liveContainer.innerHTML = `
            <div class="w-full h-full flex flex-col bg-teal-900 relative font-sans overflow-y-auto select-none pb-10">
                <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(circle at 20px 20px, white 2%, transparent 0%), radial-gradient(circle at 100px 100px, white 2%, transparent 0%); background-size: 120px 120px;"></div>
                
                <div class="w-full flex justify-center mt-12 z-10 px-4 relative animate-fade-in-up">
                    <span class="material-symbols-outlined text-teal-400 text-[80px] drop-shadow-lg mb-4">celebration</span>
                </div>
                <h1 class="text-4xl sm:text-6xl font-black text-white mb-12 tracking-widest drop-shadow-md text-center z-10 relative animate-fade-in-up">互動圓滿結束</h1>

                <div class="w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 px-6 z-10 relative animate-fade-in-up" style="animation-delay: 0.2s">
                    <div class="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 flex flex-col items-center justify-center text-white shadow-xl hover:scale-105 transition-transform">
                        <span class="material-symbols-outlined text-5xl mb-2 text-teal-300">groups</span>
                        <span class="text-xl font-bold text-teal-100 mb-2">總參與人數</span>
                        <span class="text-7xl font-black">${globalPlayers.length}</span>
                    </div>
                    <div class="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 flex flex-col items-center justify-center text-white shadow-xl hover:scale-105 transition-transform">
                        <span class="material-symbols-outlined text-5xl mb-2 text-teal-300">task_alt</span>
                        <span class="text-xl font-bold text-teal-100 mb-2">完成互動題數</span>
                        <span class="text-7xl font-black">${liveData.length}</span>
                    </div>
                </div>

                <div class="w-full flex justify-center mt-16 z-10 relative animate-fade-in-up" style="animation-delay: 0.4s">
                    <button id="btn-close-summary" class="bg-white text-teal-900 hover:bg-teal-50 font-extrabold py-4 px-12 rounded-full shadow-2xl transition-transform hover:-translate-y-1 text-2xl flex items-center gap-2 cursor-pointer">
                        <span class="material-symbols-outlined text-3xl">logout</span> 關閉並返回編輯器
                    </button>
                </div>
            </div>
        `;

        document.getElementById('btn-close-summary').addEventListener('click', cleanupLive);
    }

    // ----------------------------------------------------
    // 4. 學生端：加入畫面
    // ----------------------------------------------------
    function renderStudentJoinForm(prefillCode = '', forceAnonymous = false) {
        const emojiList = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔'];
        const randomEmojis = emojiList.sort(() => Math.random() - 0.5).slice(0, 10);
        let selectedEmoji = randomEmojis[0];

        let nameInputHtml = forceAnonymous 
            ? `
                <div class="w-full mb-6 bg-teal-50 p-4 rounded-xl border border-teal-200 flex flex-col items-center justify-center gap-2 shadow-sm">
                    <span class="material-symbols-outlined text-teal-600 text-3xl">visibility_off</span>
                    <span class="text-teal-800 font-bold text-lg">此空間為強制匿名參與</span>
                    <span class="text-teal-600 text-sm">老師將無法看見你的真實身分</span>
                    <input type="hidden" id="input-player-name" value="">
                </div>
            `
            : `
                <div class="w-full mb-6">
                    <label class="block text-sm font-bold text-gray-500 mb-1 pl-2">你的暱稱 (選填)</label>
                    <div class="relative flex items-center bg-gray-50 border-2 border-gray-200 rounded-xl p-1 focus-within:border-teal-400 transition-colors">
                        <button class="ime-toggle-button text-gray-400 p-2 rounded-full cursor-pointer flex-shrink-0 transition-all" title="切換烏衣行輸入法">
                            <span class="material-symbols-outlined text-[24px] transition-all" style="font-variation-settings: 'FILL' 0;">keyboard</span>
                        </button>
                        <input type="text" id="input-player-name" class="w-full bg-transparent px-2 py-3 text-xl font-bold text-gray-700 outline-none placeholder-gray-400 text-center" placeholder="匿名參與" maxlength="20">
                        <div class="w-[38px] flex-shrink-0"></div>
                    </div>
                </div>
            `;

        liveContainer.innerHTML = `
            <div class="w-full h-full bg-[#f2f2f2] relative font-sans select-none overflow-y-auto flex flex-col">
                <div class="min-h-full flex flex-col items-center justify-center p-4 py-10 w-full max-w-md mx-auto">
                    <div class="bg-white p-8 md:p-10 rounded-[2rem] shadow-sm border border-gray-200 w-full flex flex-col items-center">
                        <h2 class="text-3xl font-extrabold text-teal-800 mb-6 tracking-wide text-center">參與互動問答</h2>
                        <div class="w-full mb-4">
                            <label class="block text-sm font-bold text-gray-500 mb-1 pl-2">空間代碼 PIN</label>
                            <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="5" id="input-space-code" value="${prefillCode}" class="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-5 py-4 text-center text-3xl font-black text-teal-900 focus:border-teal-400 outline-none transition-colors tracking-widest" placeholder="輸入 5 碼代碼" ${prefillCode ? 'readonly' : ''}>
                        </div>
                        ${nameInputHtml}
                        <button id="btn-submit-join" class="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xl py-4 rounded-xl shadow-md transition-transform hover:-translate-y-1 cursor-pointer mb-8">進入問答！</button>
                        <div class="w-full">
                            <label class="block text-sm font-bold text-gray-500 mb-3 text-center">選擇你的代表圖示</label>
                            <div class="flex flex-wrap justify-center gap-2" id="emoji-selector">
                                ${randomEmojis.map((e, i) => `<div class="emoji-btn w-12 h-12 flex items-center justify-center text-2xl rounded-xl cursor-pointer transition-all ${i===0 ? 'bg-teal-100 border-2 border-teal-400 scale-110' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'}" data-emoji="${e}">${e}</div>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        bindImeToggles();

        document.getElementById('emoji-selector').addEventListener('click', (e) => {
            const btn = e.target.closest('.emoji-btn');
            if (!btn) return;
            selectedEmoji = btn.dataset.emoji;
            document.querySelectorAll('.emoji-btn').forEach(b => b.className = 'emoji-btn w-12 h-12 flex items-center justify-center text-2xl rounded-xl cursor-pointer transition-all bg-gray-50 border border-gray-200 hover:bg-gray-100');
            btn.className = 'emoji-btn w-12 h-12 flex items-center justify-center text-2xl rounded-xl cursor-pointer transition-all bg-teal-100 border-2 border-teal-400 scale-110';
        });

        document.getElementById('btn-submit-join').addEventListener('click', async () => {
            const code = document.getElementById('input-space-code').value.trim();
            const nameField = document.getElementById('input-player-name');
            let name = nameField ? nameField.value.trim() : '';

            if (forceAnonymous) name = `匿名_${Math.floor(1000 + Math.random() * 9000)}`;
            else if (!name) name = `訪客_${Math.floor(1000 + Math.random() * 9000)}`;

            if (code.length !== 5) return showToast('⚠️ 格式錯誤');
            
            const btn = document.getElementById('btn-submit-join');
            btn.textContent = "連線中..."; btn.disabled = true;
            
            const spaceRef = db.collection(window.SPACES_COLLECTION).doc(code);
            try {
                const doc = await spaceRef.get();
                if (!doc.exists) throw "NOT_FOUND";
                if (doc.data().status === 'finished') throw "FINISHED";

                // ✨ 檢查名稱是否已被其他人使用
                const playerRef = spaceRef.collection("players").doc(name);
                const playerDoc = await playerRef.get();
                
                if (playerDoc.exists) {
                    // 如果是系統自動產生的亂數剛好重複，再疊加亂數
                    if (forceAnonymous || (nameField && !nameField.value.trim())) {
                        name = name + "_" + Math.floor(Math.random() * 100);
                    } else {
                        // 如果是用戶自己手動打的名字，擋下來並丟出錯誤
                        throw "NAME_TAKEN"; 
                    }
                }

                await spaceRef.collection("players").doc(name).set({
                    name: name, emoji: selectedEmoji, lastJoinedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
                // ✨ 成功登入，發放瀏覽器暫存通行證
                sessionStorage.setItem(`live_session_${code}`, name);

                startLiveStudentListener(code, name);
            } catch (err) {
                if (err === "NOT_FOUND") showToast('❌ 找不到該空間');
                else if (err === "FINISHED") showToast('❌ 互動問答已經結束');
                else if (err === "NAME_TAKEN") showToast('⚠️ 此暱稱已有人使用，請換一個！');
                else showToast('❌ 連線失敗');
                
                btn.textContent = "進入問答！"; btn.disabled = false;
            }
        });
    }

    // ----------------------------------------------------
    // 5. 學生端：狀態監聽與作答遙控器
    // ----------------------------------------------------
    function startLiveStudentListener(spaceCode, playerName) {
        window.currentSpaceCode = spaceCode; 

        if (unsubscribeStudentSelf) unsubscribeStudentSelf();
        unsubscribeStudentSelf = db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName)
            .onSnapshot((doc) => {
                if (!doc.exists) { 
                    // ✨ 老師踢人或空間關閉時，強制刪除瀏覽器通行證
                    sessionStorage.removeItem(`live_session_${spaceCode}`);
                    showToast('🚷 你已被老師移除'); 
                    cleanupLive(); 
                }
                else {
                    window.currentStudentData = doc.data(); 
                    if (window.currentSpaceData && window.currentSpaceData.status === 'playing' && !window.currentSpaceData.isGlobalPaused) {
                        const qType = window.currentSpaceData.currentQuestionData?.type;
                        if (qType === '文字') {
                            updateStudentTextUI(playerName);
                        } else if (qType === '問答') {
                            updateStudentQAUI(playerName);
                        } else if (qType === '白板') {
                            updateStudentBoardUI(playerName);
                        }
                    }
                }
            });

        if (unsubscribeSpace) unsubscribeSpace();
        window.currentLiveStudentQ = -1;

        unsubscribeSpace = db.collection(window.SPACES_COLLECTION).doc(spaceCode).onSnapshot((doc) => {
            if (!doc.exists) return;
            const data = doc.data();
            window.currentSpaceData = data;
            
            window.arenaIsPaused = data.isPaused || false;
            const pauseOverlay = document.getElementById('student-pause-overlay');
            if (pauseOverlay) {
                if (window.arenaIsPaused) {
                    pauseOverlay.classList.remove('hidden'); pauseOverlay.classList.add('flex');
                } else {
                    pauseOverlay.classList.add('hidden'); pauseOverlay.classList.remove('flex');
                }
            }

            if (data.status === 'waiting') {
                renderStudentStandbyLobby(spaceCode, playerName);
                window.currentLiveStudentQ = -1;
            } else if (data.status === 'playing') {
                if (data.isGlobalPaused || data.currentQuestion === -1) {
                    renderStudentStandbyLobby(spaceCode, playerName);
                    window.currentLiveStudentQ = -1; 
                } else {
                    if (window.currentLiveStudentQ !== data.currentQuestion) {
                        window.currentLiveStudentQ = data.currentQuestion;
                        renderStudentController(spaceCode, playerName, data.currentQuestionData);
                    }
                }
            } else if (data.status === 'finished') {
                renderStudentFinished(spaceCode, playerName);
            }
            
            if (data.status === 'playing' && !data.isGlobalPaused) {
                if (data.currentQuestionData?.type === '問答') {
                    updateStudentQAUI(playerName);
				} else if (data.currentQuestionData?.type === '文字') {
						updateStudentTextUI(playerName);
					} else if (data.currentQuestionData?.type === '白板') {
						updateStudentBoardUI(playerName);
					}
            }
        });

        if (unsubscribePlayers) unsubscribePlayers(); 
        unsubscribePlayers = db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").onSnapshot((snapshot) => {
            globalPlayers = [];
            snapshot.forEach(doc => globalPlayers.push(doc.data()));
            
            if (window.currentSpaceData && window.currentSpaceData.status === 'playing' && !window.currentSpaceData.isGlobalPaused) {
                const qType = window.currentSpaceData.currentQuestionData?.type;
                if (qType === '問答') {
                    updateStudentQAUI(playerName);
                } else if (qType === '文字') {
                    updateStudentTextUI(playerName);
                } else if (qType === '白板') {
                    updateStudentBoardUI(playerName);
                }
            }
        });
    }

    function renderStudentStandbyLobby(spaceCode, playerName) {
        const randomEmoji = standbyEmojis[Math.floor(Math.random() * standbyEmojis.length)];
        liveContainer.innerHTML = `
            <div class="w-full h-full bg-[#f3f4f6] font-sans select-none overflow-y-auto pb-6 relative flex flex-col">
                <div class="min-h-full flex flex-col items-center justify-center p-4 text-center">
                    <div class="text-[5rem] mb-6 animate-periodic-wiggle inline-block origin-bottom">${randomEmoji}</div>
                    <h2 class="text-3xl md:text-4xl font-extrabold text-gray-700 mb-4 drop-shadow-sm">老師正在準備中...</h2>
                    <p class="text-lg md:text-xl text-gray-500 font-bold mb-12">請留意大螢幕，下一階段馬上開始！</p>
                </div>
            </div>
            ${getFloatingReactionHtml()}
            ${getStudentProfileBadge()}
        `;
        bindFloatingReactionBar(spaceCode, playerName);
    }

    function renderStudentController(spaceCode, playerName, qData) {
        let controlsHtml = '';
        const qId = qData.id;

        window.currentStudentSelections = []; 
        window.currentStudentRanking = qData.type === '排序' ? qData.options.map((_, i) => i) : [];

        if (qData.type === '單選') {
            controlsHtml = `
                <div class="flex flex-col gap-3 w-full max-w-md mx-auto">
                    ${qData.options.map((opt, i) => `
                        <button class="live-ans-btn w-full ${optionColors[i % optionColors.length]} text-white font-bold text-xl py-4 rounded-xl shadow-sm hover:opacity-90 transition-transform active:scale-95 border-b-[4px] border-black/20" data-idx="${i}">
                            ${escapeHtml(opt)}
                        </button>
                    `).join('')}
                </div>
            `;
        } else if (qData.type === '多選') {
            controlsHtml = `
                <div class="flex flex-col gap-3 w-full max-w-md mx-auto">
                    ${qData.options.map((opt, i) => `
                        <div class="live-multi-btn flex items-center justify-between w-full bg-white border-2 border-gray-200 text-gray-700 font-bold text-xl py-4 px-6 rounded-xl shadow-sm cursor-pointer transition-all active:scale-[0.98]" data-idx="${i}">
                            <span>${escapeHtml(opt)}</span>
                            <span class="material-symbols-outlined text-gray-300 check-icon text-2xl transition-colors">check_circle</span>
                        </div>
                    `).join('')}
                    <button id="btn-submit-multi" class="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-4 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer mt-2 text-xl">送出選擇</button>
                </div>
            `;
        } else if (qData.type === '評分') {
            controlsHtml = `
                <div class="flex flex-col items-center gap-6 w-full max-w-md mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                    <p class="text-gray-500 font-bold">請點擊星星給予評分</p>
                    <div class="flex justify-center gap-2 text-5xl text-gray-200" id="star-rating-container">
                        ${[1, 2, 3, 4, 5].map(s => `
                            <span class="material-symbols-outlined star-btn cursor-pointer transition-colors hover:text-amber-300" data-val="${s}" style="font-variation-settings: 'FILL' 1; font-size: 3.5rem;">star</span>
                        `).join('')}
                    </div>
                    <button id="btn-submit-rating" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-3.5 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer text-xl mt-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled>送出評分</button>
                </div>
            `;
        } else if (qData.type === '排序') {
            controlsHtml = `
                <div class="flex flex-col gap-2 w-full max-w-md mx-auto" id="rank-list-container">
                    <p class="text-gray-500 font-bold text-center text-sm mb-2">點擊箭頭調整順序，第一名放最上面</p>
                    ${window.currentStudentRanking.map((optIdx) => `
                        <div class="rank-item flex items-center justify-between w-full bg-white border border-gray-200 p-3 rounded-xl shadow-sm transition-all" data-idx="${optIdx}">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-black rank-num"></div>
                                <span class="font-bold text-gray-800 text-lg">${escapeHtml(qData.options[optIdx])}</span>
                            </div>
                            <div class="flex flex-col gap-1">
                                <button class="btn-rank-up bg-gray-50 hover:bg-gray-200 p-1 rounded transition-colors text-gray-500"><span class="material-symbols-outlined text-lg leading-none">expand_less</span></button>
                                <button class="btn-rank-down bg-gray-50 hover:bg-gray-200 p-1 rounded transition-colors text-gray-500"><span class="material-symbols-outlined text-lg leading-none">expand_more</span></button>
                            </div>
                        </div>
                    `).join('')}
                    <button id="btn-submit-ranking" class="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-4 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer mt-4 text-xl">確認送出排序</button>
                </div>
            `;
        } else if (qData.type === '文字') {
            controlsHtml = `
                <div id="student-text-input-area" class="flex-col gap-3 w-full max-w-md mx-auto bg-white p-5 rounded-3xl shadow-sm border border-gray-200" style="display: none;">
                    <div class="flex justify-between items-center px-1">
                        <span class="text-xs font-bold text-teal-600">請輸入文字</span>
                        <span id="student-text-limit-status" class="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full" style="display: none;"></span>
                    </div>
                    <div class="relative flex items-center gap-2 bg-gray-50 border-2 border-gray-200 rounded-xl p-1.5 focus-within:border-teal-400 transition-colors">
                        <button class="ime-toggle-button text-gray-400 p-1.5 rounded-full transition-all flex-shrink-0 cursor-pointer" title="切換烏衣行輸入法">
                            <span class="material-symbols-outlined text-[22px] transition-all" style="font-variation-settings: 'FILL' 0;">keyboard</span>
                        </button>
                        <input type="text" id="live-text-input" class="w-full bg-transparent text-base font-bold text-gray-700 outline-none pt-1 pb-1 pr-2" placeholder="你的回答...">
                    </div>
                    <button id="btn-submit-live-text" class="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold py-3.5 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer mt-1">送出回覆</button>
                    
                    <div class="mt-3 w-full border-t border-gray-100 pt-3 text-left">
                        <p class="text-xs text-gray-400 font-bold mb-2">你的回覆：</p>
                        <div id="student-text-past-answers" class="flex flex-wrap gap-1.5 min-h-[2rem]"></div>
                    </div>
                </div>

                <div id="student-text-limit-reached" class="flex-col gap-3 w-full max-w-md mx-auto bg-white p-6 rounded-3xl shadow-sm border border-gray-200 text-center" style="display: none;">
                    <span class="material-symbols-outlined text-4xl text-teal-400 mb-2">task_alt</span>
                    <p class="text-teal-800 font-bold text-lg">回覆已送出</p>
                    <p class="text-gray-500 font-bold text-sm">你已達到本題回覆上限</p>
                    <div class="mt-4 w-full border-t border-gray-100 pt-4 text-left">
                        <p class="text-xs text-gray-400 font-bold mb-2">你的回覆：</p>
                        <div id="student-text-past-answers-reached" class="flex flex-wrap gap-1.5 min-h-[2rem] justify-center"></div>
                    </div>
                </div>
            `;
        } else if (qData.type === '問答') { 
            controlsHtml = `
                <div class="flex flex-col gap-4 w-full max-w-md mx-auto h-full flex-1">
                    <div id="student-qa-input-area" class="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-200 flex-shrink-0 flex flex-col gap-2 transition-all">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-xs font-bold text-teal-600">提出問題</span>
                            <span id="student-qa-limit-status" class="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full" style="display: none;"></span>
                        </div>
                        <div class="flex gap-2 items-center w-full focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 rounded-xl">
                            <button class="ime-toggle-button text-gray-400 p-1.5 rounded-full transition-all cursor-pointer flex-shrink-0" title="切換烏衣行輸入法">
                                <span class="material-symbols-outlined text-[22px] transition-all" style="font-variation-settings: 'FILL' 0;">keyboard</span>
                            </button>
                            <input type="text" id="live-qa-input" class="flex-1 bg-transparent text-base font-bold text-gray-700 outline-none" placeholder="輸入你想問的問題...">
                            <button id="btn-submit-live-qa" class="bg-teal-600 hover:bg-teal-700 text-white font-extrabold p-2.5 rounded-xl shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center justify-center"><span class="material-symbols-outlined text-[20px]">send</span></button>
                        </div>
                    </div>
                    <div id="student-qa-limit-reached" class="bg-rose-50 text-rose-500 font-bold text-sm py-2 rounded-xl border border-rose-100 text-center" style="display: none;">
                        已達提問次數上限
                    </div>
                    <div id="student-focus-banner" class="w-full"></div>
                    <div id="student-qa-list" class="flex-1 overflow-y-auto flex flex-col gap-3 pb-4 scrollbar-thin select-text">
                        <div class="text-center text-gray-400 font-bold mt-4 animate-pulse select-none">載入中...</div>
                    </div>
                </div>
            `;
		} else if (qData.type === '白板') {
            const myData = window.currentStudentData || {};
            const myNotes = myData[`board_${qId}`] || [];
            
            controlsHtml = `
                <div class="flex flex-col gap-4 w-full max-w-md mx-auto h-full flex-1 overflow-hidden">
                    <div id="student-board-input-area" class="bg-white p-4 rounded-3xl shadow-sm border border-gray-200 flex-shrink-0 flex flex-col gap-3 transition-all">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-xs font-bold text-teal-600">新增便利貼</span>
                            <span id="student-board-limit-status" class="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full" style="display: none;"></span>
                        </div>
                        <textarea id="live-board-input" class="w-full bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 text-base font-bold text-gray-700 outline-none focus:border-yellow-400 transition-colors resize-none" rows="2" placeholder="寫下你的點子..."></textarea>
                        <div class="flex justify-between items-center mt-1">
                            <div class="flex flex-wrap gap-2" id="board-color-picker">
                                <button class="board-color-btn active w-8 h-8 rounded-full bg-yellow-200 border-2 border-yellow-400 transform transition-transform scale-110 shadow-sm" data-color="yellow"></button>
                                <button class="board-color-btn w-8 h-8 rounded-full bg-pink-200 border-2 border-transparent hover:border-pink-400 transform transition-transform" data-color="pink"></button>
                                <button class="board-color-btn w-8 h-8 rounded-full bg-blue-200 border-2 border-transparent hover:border-blue-400 transform transition-transform" data-color="blue"></button>
                                <button class="board-color-btn w-8 h-8 rounded-full bg-green-200 border-2 border-transparent hover:border-green-400 transform transition-transform" data-color="green"></button>
                                <button class="board-color-btn w-8 h-8 rounded-full bg-white border-2 border-gray-200 hover:border-gray-400 transform transition-transform shadow-inner" data-color="white"></button>
                                <button class="board-color-btn w-8 h-8 rounded-full bg-gray-200 border-2 border-transparent hover:border-gray-400 transform transition-transform" data-color="gray"></button>
                            </div>
                            <button id="btn-submit-live-board" class="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-4 py-2 rounded-xl shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1">貼上 <span class="material-symbols-outlined text-[18px]">send</span></button>
                        </div>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto pr-1">
                        <p class="text-xs font-bold text-gray-400 mb-2 pl-2">我已貼出的內容：</p>
                        <div class="flex flex-col gap-2">
                            ${myNotes.length ? myNotes.slice().reverse().map(n => `
                                <div class="bg-white border-l-4 border-l-${n.color === 'yellow' ? 'yellow-400' : n.color === 'pink' ? 'pink-400' : n.color === 'blue' ? 'blue-400' : 'green-400'} p-3 rounded-lg shadow-sm">
                                    <span class="text-sm font-bold text-gray-700">${escapeHtml(n.text)}</span>
                                </div>
                            `).join('') : '<div class="text-center text-gray-300 py-4 font-bold">尚未貼出點子</div>'}
                        </div>
                    </div>
                </div>
            `;
        } else if (qData.type === '公告') {
            let flashcardHtml = `<div class="flex flex-col gap-4 w-full max-w-lg mx-auto overflow-hidden">`;
            const formattedPage = escapeHtml(qData.options[0] || '').replace(/\\n|\n/g, '<br>');
            flashcardHtml += `
                <div class="bg-white rounded-3xl shadow-sm border border-teal-100 p-8 flex items-center justify-center min-h-[150px] text-center border-l-8 border-l-teal-400">
                    <span class="text-xl font-bold text-gray-800 leading-relaxed select-text">${formattedPage}</span>
                </div>
            `;
            flashcardHtml += `</div>`;
            controlsHtml = flashcardHtml;
        }

        liveContainer.innerHTML = `
            <div class="w-full h-full bg-[#f2f2f2] font-sans select-none overflow-y-auto flex flex-col relative pb-20">
                <div id="student-pause-overlay" class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex-col items-center justify-center text-white ${window.arenaIsPaused ? 'flex' : 'hidden'}">
                    <span class="material-symbols-outlined text-6xl mb-4 text-amber-400 animate-bounce">front_hand</span>
                    <h2 class="text-3xl font-bold tracking-widest">老師已暫停收件</h2>
                </div>

                <div class="flex flex-col p-4 sm:p-6 flex-1">
                    ${qData.type !== '公告' ? `
                    <div class="w-full bg-white px-4 py-5 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-5 text-center border-l-4 border-teal-500 flex-shrink-0 select-text">
                        <h2 class="text-xl sm:text-2xl font-extrabold text-gray-800 leading-snug break-words max-w-full select-text">
                            <span class="inline-block align-middle text-[11px] font-black bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full mr-2 border border-teal-100 transform -translate-y-0.5 select-none">${qData.type}</span>
                            ${escapeHtml(qData.question)}
                        </h2>
                    </div>` : ''}
                    
                    <div class="flex-1 w-full flex flex-col select-text">
                        ${controlsHtml}
                    </div>
                </div>
            </div>
            ${getFloatingReactionHtml()}
            ${getStudentProfileBadge()}
        `;

        bindFloatingReactionBar(spaceCode, playerName);
        bindImeToggles();

        liveContainer.querySelectorAll('.live-ans-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (window.arenaIsPaused) return; 
                const ansIdx = parseInt(e.currentTarget.dataset.idx, 10);
                try {
                    await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName).update({
                        [`ans_${qId}`]: ansIdx, [`ts_${qId}`]: Date.now()
                    });
                    showStudentSubmittedScreen(spaceCode, playerName);
                } catch(err) {}
            });
        });

        liveContainer.querySelectorAll('.live-multi-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (window.arenaIsPaused) return;
                const idx = parseInt(e.currentTarget.dataset.idx, 10);
                const checkIcon = btn.querySelector('.check-icon');
                if (window.currentStudentSelections.includes(idx)) {
                    window.currentStudentSelections = window.currentStudentSelections.filter(i => i !== idx);
                    btn.classList.remove('border-teal-500', 'bg-teal-50');
                    btn.classList.add('border-gray-200', 'bg-white');
                    checkIcon.classList.replace('text-teal-600', 'text-gray-300');
                } else {
                    window.currentStudentSelections.push(idx);
                    btn.classList.remove('border-gray-200', 'bg-white');
                    btn.classList.add('border-teal-500', 'bg-teal-50');
                    checkIcon.classList.replace('text-gray-300', 'text-teal-600');
                }
            });
        });

        const btnSubmitMulti = document.getElementById('btn-submit-multi');
        if (btnSubmitMulti) {
            btnSubmitMulti.addEventListener('click', async () => {
                if (window.arenaIsPaused) return;
                if (window.currentStudentSelections.length === 0) return showToast('⚠️ 請至少選擇一個選項');
                try {
                    await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName).update({
                        [`ans_${qId}`]: window.currentStudentSelections, [`ts_${qId}`]: Date.now()
                    });
                    showStudentSubmittedScreen(spaceCode, playerName);
                } catch(err) {}
            });
        }

        let currentRating = 0;
        const starBtns = liveContainer.querySelectorAll('.star-btn');
        starBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (window.arenaIsPaused) return;
                currentRating = parseInt(e.currentTarget.dataset.val, 10);
                starBtns.forEach(s => {
                    const val = parseInt(s.dataset.val, 10);
                    s.classList.remove('text-gray-200', 'text-amber-400');
                    s.classList.add(val <= currentRating ? 'text-amber-400' : 'text-gray-200');
                });
                document.getElementById('btn-submit-rating').disabled = false;
            });
        });

        const btnSubmitRating = document.getElementById('btn-submit-rating');
        if (btnSubmitRating) {
            btnSubmitRating.addEventListener('click', async () => {
                if (window.arenaIsPaused) return;
                if (currentRating === 0) return;
                try {
                    await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName).update({
                        [`ans_${qId}`]: currentRating, [`ts_${qId}`]: Date.now()
                    });
                    showStudentSubmittedScreen(spaceCode, playerName);
                } catch(err) {}
            });
        }

        function updateRankNumbers() {
            liveContainer.querySelectorAll('.rank-item').forEach((item, idx) => {
                item.querySelector('.rank-num').textContent = idx + 1;
            });
        }
        if (qData.type === '排序') updateRankNumbers();

        liveContainer.querySelectorAll('.btn-rank-up').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (window.arenaIsPaused) return;
                const item = btn.closest('.rank-item');
                const prev = item.previousElementSibling;
                if (prev && prev.classList.contains('rank-item')) {
                    item.parentNode.insertBefore(item, prev);
                    updateRankNumbers();
                }
            });
        });
        liveContainer.querySelectorAll('.btn-rank-down').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (window.arenaIsPaused) return;
                const item = btn.closest('.rank-item');
                const next = item.nextElementSibling;
                if (next && next.classList.contains('rank-item')) {
                    item.parentNode.insertBefore(next, item);
                    updateRankNumbers();
                }
            });
        });

        const btnSubmitRanking = document.getElementById('btn-submit-ranking');
        if (btnSubmitRanking) {
            btnSubmitRanking.addEventListener('click', async () => {
                if (window.arenaIsPaused) return;
                const finalRank = [];
                liveContainer.querySelectorAll('.rank-item').forEach(item => {
                    finalRank.push(parseInt(item.dataset.idx, 10));
                });
                try {
                    await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName).update({
                        [`ans_${qId}`]: finalRank, [`ts_${qId}`]: Date.now()
                    });
                    showStudentSubmittedScreen(spaceCode, playerName);
                } catch(err) {}
            });
        }

        const btnTextSubmit = document.getElementById('btn-submit-live-text');
        if (btnTextSubmit) {
            btnTextSubmit.addEventListener('click', async () => {
                if (window.arenaIsPaused) return; 
                const textVal = document.getElementById('live-text-input').value.trim();
                if (!textVal) return showToast('⚠️ 請輸入文字');
                
                // ✨ 即時抓取最新設定：從全域 window.currentSpaceData 中取得最新的 qData
                const latestQData = window.currentSpaceData?.currentQuestionData || qData;
                const limit = parseQuestionLimit(latestQData);
                const allowDup = latestQData.options && latestQData.options[1] === 'true';
                
                const myData = window.currentStudentData || {};
                let myTexts = myData[`text_${qId}`] || [];
                if (!Array.isArray(myTexts)) myTexts = myTexts ? [myTexts] : [];
                
                if (limit !== 0 && myTexts.length >= limit) return showToast('⚠️ 已達回覆上限！');

                if (!allowDup && myTexts.includes(textVal)) {
                    return showToast('⚠️ 已經輸入過相同的文字囉！');
                }

                try {
                    myTexts.push(textVal); 
                    await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName).update({
                        [`text_${qId}`]: myTexts, 
                        [`ts_${qId}`]: Date.now()
                    });
                    document.getElementById('live-text-input').value = '';
                    showToast('✅ 回覆已送出');
                } catch(err) {}
            });
        }

        if (qData.type === '問答') {
            const btnSubmitQA = document.getElementById('btn-submit-live-qa');
            if (btnSubmitQA) {
                btnSubmitQA.addEventListener('click', async () => {
                    if (window.arenaIsPaused) return; 
                    const inputEl = document.getElementById('live-qa-input');
                    const textVal = inputEl.value.trim();
                    if (!textVal) return showToast('⚠️ 請輸入問題');
                    
                    const limit = parseQuestionLimit(qData);
                    const myData = window.currentStudentData || {};
                    let myQAs = myData[`qa_${qId}`] || [];
                    if (limit !== 0 && myQAs.length >= limit) return showToast('⚠️ 已達提問上限！');
                    
                    inputEl.value = ''; 
                    const newQId = playerName + '_' + Date.now();
                    try {
                        await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName).update({
                            [`qa_${qId}`]: firebase.firestore.FieldValue.arrayUnion({
                                id: newQId, text: textVal, ts: Date.now()
                            }),
                            [`qa_upvotes_${qId}`]: firebase.firestore.FieldValue.arrayUnion(newQId) 
                        });
                        showToast('✅ 提問已送出！');
                    } catch(e) {}
                });
            }
            updateStudentQAUI(playerName);
        }

        if (qData.type === '文字') {
            updateStudentTextUI(playerName);
        }
		// ✨ 白板便利貼送出與顏色選擇邏輯
        if (qData.type === '白板') {
            liveContainer.querySelectorAll('.board-color-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // 重置所有按鈕狀態
                    liveContainer.querySelectorAll('.board-color-btn').forEach(b => {
                        b.classList.remove('active', 'border-yellow-400', 'border-pink-400', 'border-blue-400', 'border-green-400', 'border-gray-400', 'scale-110', 'shadow-sm');
                        b.classList.add('border-transparent');
                        if(b.dataset.color === 'white') b.classList.replace('border-transparent', 'border-gray-200'); // 白色保留預設邊框
                    });
                    
                    // 設定選中狀態
                    const color = e.target.dataset.color;
                    const isWhite = color === 'white';
                    const isGray = color === 'gray';
                    
                    const activeBorder = isWhite || isGray ? 'border-gray-400' : `border-${color}-400`;
                    e.target.classList.add('active', activeBorder, 'scale-110', 'shadow-sm');
                    e.target.classList.remove('border-transparent');

                    // 改變輸入框樣式
                    const inputEl = document.getElementById('live-board-input');
                    if (isWhite) {
                        inputEl.className = 'w-full bg-white border-2 border-gray-200 rounded-xl p-3 text-base font-bold text-gray-700 outline-none focus:border-gray-400 transition-colors resize-none';
                    } else if (isGray) {
                        inputEl.className = 'w-full bg-gray-50 border-2 border-gray-300 rounded-xl p-3 text-base font-bold text-gray-700 outline-none focus:border-gray-400 transition-colors resize-none';
                    } else {
                        inputEl.className = `w-full bg-${color}-50 border-2 border-${color}-200 rounded-xl p-3 text-base font-bold text-gray-700 outline-none focus:border-${color}-400 transition-colors resize-none`;
                    }
                });
            });

            const btnBoardSubmit = document.getElementById('btn-submit-live-board');
            if (btnBoardSubmit) {
                btnBoardSubmit.addEventListener('click', async () => {
                    if (window.arenaIsPaused) return; 
                    const inputEl = document.getElementById('live-board-input');
                    const textVal = inputEl.value.trim();
                    if (!textVal) return showToast('⚠️ 請輸入內容');
                    
                    const limit = parseQuestionLimit(qData);
                    const myData = window.currentStudentData || {};
                    let myNotes = myData[`board_${qId}`] || [];
                    if (limit !== 0 && myNotes.length >= limit) return showToast('⚠️ 已達便利貼上限！');
                    
                    const color = document.querySelector('.board-color-btn.active')?.dataset.color || 'yellow';
                    const newNote = { id: playerName + '_' + Date.now(), text: textVal, color: color, ts: Date.now() };

                    inputEl.value = ''; 
                    try {
                        await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName).update({
                            [`board_${qId}`]: firebase.firestore.FieldValue.arrayUnion(newNote)
                        });
                        showToast('✅ 便利貼已貼上大螢幕！');
                    } catch(e) {}
                });
            }
        }
    }

    function updateStudentTextUI(playerName) {
        const qData = window.currentSpaceData?.currentQuestionData;
        if (!qData || qData.type !== '文字') return;
        
        const qId = qData.id;
        const myData = window.currentStudentData || {};
        let myTexts = [];
        if (Array.isArray(myData[`text_${qId}`])) {
            myTexts = myData[`text_${qId}`];
        } else if (typeof myData[`text_${qId}`] === 'string' && myData[`text_${qId}`]) {
            myTexts = [myData[`text_${qId}`]];
        }
        
        const limit = parseQuestionLimit(qData);
        const canAnswer = limit === 0 || myTexts.length < limit;

        const tagsHtml = myTexts.map(t => `<span class="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm border border-teal-100 select-text">${escapeHtml(t)}</span>`).join('');

        const pastArea1 = document.getElementById('student-text-past-answers');
        const pastArea2 = document.getElementById('student-text-past-answers-reached');
        if (pastArea1) pastArea1.innerHTML = tagsHtml;
        if (pastArea2) pastArea2.innerHTML = tagsHtml;

        const statusArea = document.getElementById('student-text-limit-status');
        if (statusArea) {
            if (limit === 0) {
                statusArea.style.display = 'none';
            } else {
                statusArea.style.display = 'inline-block';
                statusArea.textContent = `已答 ${myTexts.length}/${limit}`;
                statusArea.className = canAnswer ? 'text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full select-none' : 'text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full select-none';
            }
        }

        const inputArea = document.getElementById('student-text-input-area');
        const limitReachedArea = document.getElementById('student-text-limit-reached');
        
        if (canAnswer) {
            if (inputArea) inputArea.style.display = 'flex';
            if (limitReachedArea) limitReachedArea.style.display = 'none';
        } else {
            if (inputArea) inputArea.style.display = 'none';
            if (limitReachedArea) limitReachedArea.style.display = 'flex';
        }
    }

    function updateStudentQAUI(playerName) {
        const qaList = document.getElementById('student-qa-list');
        const focusBanner = document.getElementById('student-focus-banner');
        if (!qaList || !focusBanner || !window.currentSpaceData) return;

        const qData = window.currentSpaceData.currentQuestionData;
        if (!qData) return;
        const qId = qData.id;

        // ✨ Q&A 防呆次數顯示
        const limit = parseQuestionLimit(qData);
        const myData = window.currentStudentData || {};
        let myQAs = myData[`qa_${qId}`] || [];
        const canAnswer = limit === 0 || myQAs.length < limit;

        const inputArea = document.getElementById('student-qa-input-area');
        const limitReachedArea = document.getElementById('student-qa-limit-reached');
        const statusArea = document.getElementById('student-qa-limit-status');

        if (statusArea) {
            if (limit === 0) {
                statusArea.style.display = 'none';
            } else {
                statusArea.style.display = 'inline-block';
                statusArea.textContent = `已提問 ${myQAs.length}/${limit}`;
                statusArea.className = canAnswer ? 'text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full select-none' : 'text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full select-none';
            }
        }

        if (inputArea && limitReachedArea) {
            if (canAnswer) {
                inputArea.style.display = 'flex';
                limitReachedArea.style.display = 'none';
            } else {
                inputArea.style.display = 'none';
                limitReachedArea.style.display = 'block';
            }
        }

        const archivedQs = window.currentSpaceData.archivedQs || [];
        const deletedQs = window.currentSpaceData.deletedQs || [];
        const focusedQId = window.currentSpaceData.focusedQ;

        let allQuestions = [];
        globalPlayers.forEach(p => {
            const qs = p[`qa_${qId}`] || [];
            qs.forEach(q => {
                if (!deletedQs.includes(q.id)) {
                    allQuestions.push({
                        id: q.id, author: p.name, text: q.text, ts: q.ts, upvoteCount: 0, hasVoted: false
                    });
                }
            });
        });

        globalPlayers.forEach(p => {
            const upvotes = p[`qa_upvotes_${qId}`] || [];
            upvotes.forEach(upvId => {
                const q = allQuestions.find(x => x.id === upvId);
                if (q) {
                    q.upvoteCount++;
                    if (p.name === playerName) q.hasVoted = true;
                }
            });
        });

        const focusedQ = allQuestions.find(q => q.id === focusedQId);
        if (focusedQ) {
            focusBanner.innerHTML = `
                <div class="bg-teal-500 text-white rounded-xl p-3 shadow-md mb-3 border border-teal-400 animate-pulse">
                    <div class="flex items-center gap-1.5 mb-1.5 opacity-90 select-none">
                        <span class="material-symbols-outlined text-[14px]">campaign</span>
                        <span class="text-xs font-bold">老師正在回答</span>
                    </div>
                    <div class="text-base font-extrabold break-words select-text">${escapeHtml(focusedQ.text)}</div>
                </div>
            `;
        } else {
            focusBanner.innerHTML = '';
        }

        allQuestions.sort((a, b) => b.upvoteCount - a.upvoteCount || b.ts - a.ts);

        if (allQuestions.length === 0 && !focusedQ) {
            qaList.innerHTML = '<div class="text-center text-gray-400 font-bold mt-4 select-none">目前還沒有人提問，搶頭香！</div>';
        } else {
            qaList.innerHTML = allQuestions.map(q => `
                <div class="bg-white border ${q.hasVoted ? 'border-teal-300 bg-teal-50/30' : 'border-gray-200'} rounded-xl px-3 py-2.5 shadow-sm flex gap-3 items-start transition-colors group">
                    <button class="qa-upvote-btn flex items-center justify-center rounded-md px-2 py-1 shrink-0 transition-colors cursor-pointer select-none ${q.hasVoted ? 'bg-teal-500 text-white shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'}" data-id="${q.id}" data-voted="${q.hasVoted}">
                        <span class="material-symbols-outlined text-[16px] leading-none ${q.hasVoted ? 'font-bold' : ''}">thumb_up</span>
                        <span class="font-black text-sm ml-1.5 leading-none">${q.upvoteCount}</span>
                    </button>
                    <div class="flex flex-col flex-1 break-words">
                        <span class="text-[10px] font-bold text-gray-400 mb-0.5 select-none">${escapeHtml(q.author)}</span>
                        <span class="text-sm font-bold text-gray-800 leading-snug select-text">${escapeHtml(q.text)}</span>
                    </div>
                </div>
            `).join('');
        }

        qaList.querySelectorAll('.qa-upvote-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (window.arenaIsPaused) return; 
                const spaceCode = window.currentSpaceCode;
                if(!spaceCode) return;

                const clickId = e.currentTarget.dataset.id;
                const hasVoted = e.currentTarget.dataset.voted === "true";
                
                try {
                    if (hasVoted) {
                        await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName).update({
                            [`qa_upvotes_${qId}`]: firebase.firestore.FieldValue.arrayRemove(clickId)
                        });
                    } else {
                        await db.collection(window.SPACES_COLLECTION).doc(spaceCode).collection("players").doc(playerName).update({
                            [`qa_upvotes_${qId}`]: firebase.firestore.FieldValue.arrayUnion(clickId)
                        });
                    }
                } catch (err) {}
            });
        });
    }

	// ✨ 專門處理白板學生介面的即時更新
    function updateStudentBoardUI(playerName) {
        const qData = window.currentSpaceData?.currentQuestionData;
        if (!qData || qData.type !== '白板') return;
        
        const qId = qData.id;
        const myData = window.currentStudentData || {};
        const myNotes = myData[`board_${qId}`] || [];
        
        // 找到輸入框下方的歷史紀錄容器
        const listArea = document.querySelector('#student-board-input-area + div'); 
        if (listArea) {
            const colorBorderMap = { 'yellow': 'yellow-400', 'pink': 'pink-400', 'blue': 'blue-400', 'green': 'green-400', 'white': 'gray-300', 'gray': 'gray-500' };
            
            const historyHtml = myNotes.length ? myNotes.slice().reverse().map(n => `
                <div class="bg-white border-l-4 border-l-${colorBorderMap[n.color] || 'yellow-400'} p-3 rounded-lg shadow-sm animate-fade-in-up">
                    <span class="text-sm font-bold text-gray-700">${escapeHtml(n.text)}</span>
                </div>
            `).join('') : '<div class="text-center text-gray-300 py-4 font-bold">尚未貼出點子</div>';
            
            listArea.innerHTML = `<p class="text-xs font-bold text-gray-400 mb-2 pl-2">我已貼出的內容：</p><div class="flex flex-col gap-2">${historyHtml}</div>`;
        }

        // 更新張貼數量進度 (防呆次數顯示)
        const limit = parseQuestionLimit(qData);
        const statusArea = document.getElementById('student-board-limit-status');
        if (statusArea) {
            if (limit === 0) {
                statusArea.style.display = 'none';
            } else {
                statusArea.style.display = 'inline-block';
                statusArea.textContent = `已貼 ${myNotes.length}/${limit}`;
                statusArea.className = myNotes.length < limit ? 'text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full select-none' : 'text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full select-none';
            }
        }
    }

    function showStudentSubmittedScreen(spaceCode, playerName, submittedText = null) {
        let submissionHtml = '';
        if (submittedText) {
            submissionHtml = `
                <div class="mt-6 w-full max-w-xs bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left select-text">
                    <span class="text-xs font-bold text-gray-400 block mb-1 select-none">你的回覆：</span>
                    <span class="text-base font-bold text-teal-800 break-words">${escapeHtml(submittedText)}</span>
                </div>
            `;
        }

        liveContainer.innerHTML = `
            <div class="w-full h-full bg-teal-50 font-sans select-none overflow-y-auto flex flex-col relative pb-6">
                <div id="student-pause-overlay" class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex-col items-center justify-center text-white ${window.arenaIsPaused ? 'flex' : 'hidden'}">
                    <span class="material-symbols-outlined text-6xl mb-4 text-amber-400 animate-bounce">front_hand</span>
                    <h2 class="text-3xl font-bold tracking-widest">老師已暫停收件</h2>
                </div>
                <div class="min-h-full flex flex-col items-center justify-center p-4 text-center">
                    <span class="material-symbols-outlined text-8xl text-teal-400 mb-6 drop-shadow-sm">check_circle</span>
                    <h2 class="text-3xl md:text-4xl font-extrabold text-teal-800 mb-4">回覆已送出！</h2>
                    <p class="text-xl text-teal-600 font-bold">請看大螢幕，等待老師下一題...</p>
                    ${submissionHtml}
                </div>
            </div>
            ${getFloatingReactionHtml()}
            ${getStudentProfileBadge()}
        `;
        bindFloatingReactionBar(spaceCode, playerName);
    }

    function renderStudentFinished(spaceCode, playerName) {
        liveContainer.innerHTML = `
            <div class="w-full h-full bg-teal-900 font-sans select-none text-white overflow-y-auto pb-6">
                <div class="min-h-full flex flex-col items-center justify-center p-4 text-center">
                    <span class="material-symbols-outlined text-teal-400 text-7xl mb-4">forum</span>
                    <h2 class="text-4xl md:text-5xl font-extrabold mb-4 tracking-wide drop-shadow-md">互動問答結束</h2>
                    <p class="text-lg text-teal-200 font-bold">謝謝你的參與！</p>
                </div>
            </div>
            ${getFloatingReactionHtml()}
            ${getStudentProfileBadge()}
        `;
        bindFloatingReactionBar(spaceCode, playerName);
    }

    initLiveRouter();
};