// =================================================================
// 互動問答模式模組 (live.js)
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
        if (window.innerWidth <= 768 && window.isLiveSidebarOpen) {
            const mobileBackdrop = document.getElementById('live-mobile-sidebar-backdrop');
            if (mobileBackdrop) mobileBackdrop.click();
        }

        const modalId = "live-confirm-modal";
        if (document.getElementById(modalId)) document.getElementById(modalId).remove();
        
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = "fixed inset-0 bg-transparent pointer-events-none flex items-center justify-center p-4 transition-opacity duration-200";
        modal.style.zIndex = '6000';
        modal.innerHTML = `
            <div class="dialog-box relative bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-gray-200 animate-fade-in-up pointer-events-auto" style="will-change: transform;">
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
        const container = document.getElementById('arenaModeContainer');
        (container && container.style.display !== 'none' ? container : document.body).appendChild(modal);
        setTimeout(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); }, 10);

        // 🌟 新增：專屬的鍵盤監聽器，支援 Enter 確認與 Esc 取消
        const handleModalKeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // 阻擋預設行為（避免觸發底下其他元素的點擊）
                close();
                onConfirm();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                close();
            }
        };
        document.addEventListener('keydown', handleModalKeydown);

        const close = () => {
            document.removeEventListener('keydown', handleModalKeydown);
            modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => modal.remove(), 200);
        };
        
        modal.querySelector('#btn-confirm-close-x').addEventListener('click', close);
        modal.querySelector('#btn-confirm-cancel').addEventListener('click', close);
        modal.querySelector('#btn-confirm-ok').addEventListener('click', () => { close(); onConfirm(); });
    }


    function showBoardPrompt(title, defaultText, defaultColor = 'yellow', onConfirm, extraOptions = null) {
        const modalId = "live-board-prompt";
        if (document.getElementById(modalId)) document.getElementById(modalId).remove();
        
        const colorMap = { 
            'yellow': 'bg-[#FFF9B1]', 'pink': 'bg-[#FFD4DF]', 'blue': 'bg-[#D4E8FF]', 
            'green': 'bg-[#D5F6D3]', 'white': 'bg-white', 'gray': 'bg-[#F2F2F2]',
            'text': 'bg-transparent border border-dashed border-gray-400', // ✨ 新增文字專屬的透明選項
            'random': 'bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-yellow-200 via-pink-200 to-blue-200' 
        };
        let selectedColor = defaultColor;

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 transition-opacity duration-200 pointer-events-none";

        modal.style.zIndex = '5000'; 
        modal.innerHTML = `
            <div class="dialog-box relative bg-white rounded-2xl w-full min-w-[320px] max-w-sm p-5 shadow-2xl border border-gray-200 animate-fade-in-up pointer-events-auto" style="will-change: transform;">
                
                <div class="drag-handle flex items-center justify-between mb-3 cursor-move -mx-5 -mt-5 p-4 border-b border-gray-100 rounded-t-2xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                    <h3 class="text-lg font-extrabold text-gray-800 select-none pl-1">${title}</h3>
                    <div class="flex items-center gap-2">
                        <div class="flex gap-1.5" id="prompt-color-picker">
                            ${Object.keys(colorMap).map(c => `
                                <div class="color-opt w-6 h-6 rounded-full cursor-pointer border-2 ${c === selectedColor ? 'border-blue-500 scale-110' : 'border-black/5'} ${colorMap[c]} transition-all shadow-sm flex items-center justify-center" data-color="${c}" title="${c === 'random' ? '隨機配色' : (c === 'text' ? '純文字' : '')}">
                                    ${c === 'random' ? '<span class="material-symbols-outlined text-[14px] text-white/90 pointer-events-none drop-shadow-sm font-bold">shuffle</span>' : ''}
                                    ${c === 'text' ? '<span class="material-symbols-outlined text-[14px] text-gray-500 pointer-events-none font-bold">title</span>' : ''}
                                </div>
                            `).join('')}
                        </div>
                        <div class="w-px h-5 bg-gray-200 mx-1"></div>
                        <button id="btn-prompt-close-x" class="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-0.5 flex items-center" title="關閉"><span class="material-symbols-outlined text-[20px]">close</span></button>
                    </div>
                </div>

                <textarea id="prompt-input" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base font-normal text-gray-700 focus:border-blue-400 outline-none transition-colors mb-3 resize-none" rows="3">${escapeHtml(defaultText)}</textarea>
                
                <div class="flex justify-between items-center mt-1">
                    <label class="flex items-center gap-1.5 cursor-pointer text-gray-500 hover:text-teal-600 transition-colors pl-1 select-none">
                        <input type="checkbox" id="prompt-batch-toggle" class="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500 cursor-pointer">
                        <span class="text-[13px] font-normal">分行新增</span>
                    </label>
                    
                    <div class="flex gap-2 items-center">
                        <div id="prompt-extra-actions" class="hidden flex items-center gap-1 mr-1 border-r border-gray-200 pr-2">
                            <div class="relative">
                                <button id="btn-prompt-layer" class="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-md transition-colors" title="圖層順序"><span class="material-symbols-outlined text-[18px]">layers</span></button>
                                <div id="prompt-layer-submenu" class="hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-gray-200 shadow-lg rounded-lg p-1.5 flex-col gap-1 z-[5100] min-w-[90px]">
                                    <button class="prompt-layer-btn flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 text-gray-700 rounded-md text-sm w-full transition-colors font-bold" data-action="top"><span class="material-symbols-outlined text-[16px]">vertical_align_top</span> 置頂</button>
                                    <button class="prompt-layer-btn flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 text-gray-700 rounded-md text-sm w-full transition-colors font-bold" data-action="up"><span class="material-symbols-outlined text-[16px]">arrow_upward</span> 上移</button>
                                    <button class="prompt-layer-btn flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 text-gray-700 rounded-md text-sm w-full transition-colors font-bold" data-action="down"><span class="material-symbols-outlined text-[16px]">arrow_downward</span> 下移</button>
                                    <button class="prompt-layer-btn flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 text-gray-700 rounded-md text-sm w-full transition-colors font-bold" data-action="bottom"><span class="material-symbols-outlined text-[16px]">vertical_align_bottom</span> 置底</button>
                                </div>
                            </div>
                            <button id="btn-prompt-delete" class="w-8 h-8 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-md transition-colors" title="刪除"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                        </div>
                        
                        <button id="btn-prompt-cancel" class="px-4 py-2 rounded-lg font-bold text-gray-500 hover:bg-gray-100 text-sm transition-colors cursor-pointer">取消</button>
                        <button id="btn-prompt-ok" class="px-5 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md text-sm transition-colors cursor-pointer">儲存</button>
                    </div>
                </div>
            </div>
        `;
        const container = document.getElementById('arenaModeContainer');
        (container && container.style.display !== 'none' ? container : document.body).appendChild(modal);
        
        const dialog = modal.querySelector('.dialog-box');
        const handle = modal.querySelector('.drag-handle');
        let isDragging = false, startX, startY, currentX = 0, currentY = 0;

        handle.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.color-opt') || e.target.closest('button')) return;
            isDragging = true;
            startX = e.clientX - currentX;
            startY = e.clientY - currentY;
            handle.setPointerCapture(e.pointerId);
            dialog.classList.remove('animate-fade-in-up'); 
        });

        handle.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            currentX = e.clientX - startX;
            currentY = e.clientY - startY;
            dialog.style.transform = `translate(${currentX}px, ${currentY}px)`;
        });

        handle.addEventListener('pointerup', (e) => {
            isDragging = false;
            handle.releasePointerCapture(e.pointerId);
        });

        const input = modal.querySelector('#prompt-input');
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);

        if (typeof defaultText === 'string' && defaultText.includes('\n')) {
            const batchToggle = modal.querySelector('#prompt-batch-toggle');
            if (batchToggle) batchToggle.checked = true;
        }

        modal.querySelectorAll('.color-opt').forEach(opt => {
            opt.addEventListener('click', (e) => {
                selectedColor = e.currentTarget.dataset.color;
                modal.querySelectorAll('.color-opt').forEach(o => o.classList.remove('border-blue-500', 'scale-110'));
                e.currentTarget.classList.add('border-blue-500', 'scale-110');
            });
        });

        const close = () => modal.remove();
        modal.querySelector('#btn-prompt-close-x').addEventListener('click', close);
        modal.querySelector('#btn-prompt-cancel').addEventListener('click', close);
        
        // 🌟 新增：綁定 Extra Options 的事件 (如果有傳入)
        if (extraOptions) {
            modal.querySelector('#prompt-extra-actions').classList.remove('hidden');
            
            // 綁定刪除按鈕
            modal.querySelector('#btn-prompt-delete').addEventListener('click', () => {
                close();
                if (extraOptions.onDelete) extraOptions.onDelete();
            });

            // 綁定圖層按鈕與選單
            const layerToggle = modal.querySelector('#btn-prompt-layer');
            const layerMenu = modal.querySelector('#prompt-layer-submenu');
            layerToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                layerMenu.classList.toggle('hidden');
                layerMenu.classList.toggle('flex');
            });

            modal.querySelectorAll('.prompt-layer-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    close();
                    if (extraOptions.onLayer) extraOptions.onLayer(e.currentTarget.dataset.action);
                });
            });

            // 點擊選單外關閉子選單
            modal.addEventListener('click', (e) => {
                if (!layerMenu.contains(e.target) && e.target !== layerToggle) {
                    layerMenu.classList.add('hidden');
                    layerMenu.classList.remove('flex');
                }
            });
        }

        modal.querySelector('#btn-prompt-ok').addEventListener('click', () => {
            const val = input.value.trim();
            const isBatch = modal.querySelector('#prompt-batch-toggle').checked;
            close();
            if (val) onConfirm({ text: val, color: selectedColor, isBatch });
        });
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
            #live-sidebar-wrapper.animate-width { transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
            #live-sidebar-wrapper.collapsed { width: 0 !important; border: none; pointer-events: none; }
            @media (max-width: 768px) {
                #live-sidebar-wrapper { position: absolute; height: 100%; z-index: 6010; box-shadow: 4px 0 25px rgba(0,0,0,0.15); width: 280px !important; left: 0; top: 0; transform: translateX(0); opacity: 1; }
                #live-sidebar-wrapper.collapsed { transform: translateX(-100%); opacity: 0; }
                #live-sidebar-resizer { display: none !important; }
            }
            [data-font-size="base"] .scalable-text { font-size: 100% !important; }
            [data-font-size="md"] .scalable-text { font-size: 125% !important; line-height: 1.3; }
            [data-font-size="lg"] .scalable-text { font-size: 155% !important; line-height: 1.4; }
            [data-font-size="xl"] .scalable-text { font-size: 185% !important; line-height: 1.45; }
            [data-font-size="base"] .scalable-q-text { font-size: 1.25rem !important; line-height: 1.35 !important; }
            [data-font-size="md"] .scalable-q-text { font-size: 1.5rem !important; line-height: 1.35 !important; }
            [data-font-size="lg"] .scalable-q-text { font-size: 1.875rem !important; line-height: 1.35 !important; }
            [data-font-size="xl"] .scalable-q-text { font-size: 2.25rem !important; line-height: 1.35 !important; }

            .note-scroll { 
                overflow-y: auto; 
                overscroll-behavior: contain; 
                touch-action: none;
                scrollbar-width: thin;
                scrollbar-color: transparent transparent;
            }
            .sticky-note:hover .note-scroll {
                scrollbar-color: rgba(0,0,0,0.15) transparent;
            }
            .note-scroll::-webkit-scrollbar { width: 4px; }
            .note-scroll::-webkit-scrollbar-track { background: transparent; }
            .note-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; }
            .sticky-note:hover .note-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); }

            /* ✨ 便利貼尺寸模式引擎 */
            /* 固定模式 (預設) */
            .sticky-note[data-size="fixed"] .note-body { width: 140px; height: 140px; }
            
            /* 自動貼合模式 (緊湊) */
            .sticky-note[data-size="auto"] { 
                width: fit-content !important; height: fit-content !important; 
            }
            .sticky-note[data-size="auto"] .note-body { 
                width: fit-content; height: fit-content; 
                min-width: 50px; min-height: 40px; 
                max-width: 200px; /* 超過 200px 強制換行 */
            }
            /* ✨ 關鍵修正：解除內容層的 absolute 定位，讓文字的真實寬度能撐開父元素 */
            .sticky-note[data-size="auto"] .note-scroll {
                position: relative !important;
            }
            .sticky-note[data-size="auto"] .note-text-content {
                display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
                overflow: hidden; 
                max-height: 4.5rem;
            }
            .sticky-note[data-size="auto"]:hover .note-text-content {
                display: block; max-height: 150px; overflow-y: auto; 
            }

            /* 手動調整模式 */
            .sticky-note[data-size="resize"] .note-body {
                width: 140px; height: 140px; 
                min-width: 60px; min-height: 60px;
            }
            .sticky-note[data-size="resize"] .resize-handle { display: block; }
            
            .resize-handle {
                display: none; position: absolute !important; 
                bottom: 2px !important; right: 2px !important; 
                top: auto !important; left: auto !important;
                width: 16px; height: 16px; cursor: nwse-resize; z-index: 50;
            }
            
            .resize-handle::after {
                content: ''; position: absolute; bottom: 6px; right: 6px;
                width: 6px; height: 6px; 
                border-right: 2px solid rgba(0,0,0,0.25); border-bottom: 2px solid rgba(0,0,0,0.25);
            }

            /* ✨ 便利貼摺疊模式引擎 */
            .sticky-note.is-collapsed .note-body {
                width: 44px !important; height: 44px !important;
                min-width: 44px !important; min-height: 44px !important;
                overflow: hidden !important; border-radius: 8px;
                display: flex; align-items: center; justify-content: center; /* 為了讓字置中 */
            }
            .sticky-note.is-collapsed .note-text-content,
            .sticky-note.is-collapsed .resize-handle,
            .sticky-note.is-collapsed .note-author-container,
            .sticky-note.is-collapsed .note-scroll { display: none !important; }
            
            /* ✨ 摺疊時顯示第一個字 */
            .sticky-note.is-collapsed .note-body::after {
                content: attr(data-first-char);
                font-size: 20px; font-weight: 900; color: inherit;
                pointer-events: none;
            }
            
            .btn-fold-note {
                position: absolute; top: 0; left: 0; width: 16px; height: 16px;
                clip-path: polygon(0 0, 100% 0, 0 100%);
                cursor: pointer; z-index: 110; opacity: 0; transition: opacity 0.2s;
            }
            .sticky-note:hover .btn-fold-note { opacity: 1; }
            
            .btn-fold-note::before {
                content: ''; position: absolute; top: 0; left: 0;
                border-top: 14px solid rgba(0,0,0,0.08); border-right: 14px solid transparent;
                transition: border-color 0.2s;
            }
            .sticky-note:hover .btn-fold-note::before { border-top-color: rgba(0,0,0,0.05); }

            .sticky-note.is-collapsed .btn-fold-note {
                opacity: 1; width: 100%; height: 100%;
                clip-path: none;
            }
            .sticky-note.is-collapsed .btn-fold-note::before { border-top-color: rgba(0,0,0,0.15); }

            .sticky-note[data-show-author="none"] .note-author-container { display: none !important; }
            .sticky-note[data-show-author="always"] .note-author-container { display: block !important; opacity: 1 !important; }
            .sticky-note[data-show-author="hover"] .note-author-container { display: block !important; opacity: 0; }
            .sticky-note[data-show-author="hover"]:hover .note-author-container,
            .sticky-note[data-show-author="hover"].ring-2 .note-author-container { opacity: 1; }

            /* ✨ 純文字專屬排版引擎 */
            .sticky-note.is-text-mode .note-body {
                height: auto !important;
                min-height: 20px !important;
                padding: 4px 6px;
            }
            .sticky-note.is-text-mode .note-scroll {
                position: relative !important;
                height: auto !important;
                overflow: visible !important;
                padding: 0 !important;
                align-items: flex-start !important;
            }
            .sticky-note.is-text-mode .note-text-content {
                max-height: none !important;
                display: block !important;
                -webkit-line-clamp: unset !important;
                overflow: visible !important;
            }
            .sticky-note.is-text-mode .resize-handle { display: none !important; } /* 隱藏原本的右下角縮放把手 */
            
            /* ✨ 右側寬度調整拉柄 */
            .resize-handle-right {
                display: none; position: absolute;
                top: 10%; right: -6px; bottom: 10%; width: 12px;
                cursor: ew-resize; z-index: 50;
            }
            .resize-handle-right::after {
                content: ''; position: absolute; top: 50%; left: 4px; transform: translateY(-50%);
                width: 4px; height: 24px; background: rgba(59, 130, 246, 0.8); border-radius: 4px;
                opacity: 0; transition: opacity 0.2s;
            }
            .sticky-note.is-text-mode.ring-2 .resize-handle-right { display: block; }
            .sticky-note.is-text-mode.ring-2 .resize-handle-right:hover::after,
            .sticky-note.is-text-mode.ring-2 .resize-handle-right:active::after { opacity: 1; }

            .sticky-note:not(.is-text-mode) .note-scroll::before,
            .sticky-note:not(.is-text-mode) .note-scroll::after {
                content: '';
                margin: auto;
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
            // ✨ 修正：至少要有類型與題目兩欄才會處理
            if (cols.length < 2) continue; 

            let type = null;
            let rawType = cols[0].toUpperCase();
            let question = cols[1];
            let options = [];

            // ✨ 嚴謹判定：只有符合關鍵字才賦予題型
            if (rawType.includes('單選') || rawType.includes('選擇')) type = '單選';
            else if (rawType.includes('多選')) type = '多選';
            else if (rawType.includes('文字')) type = '文字';
            else if (rawType.includes('問答') || rawType.includes('QA')) type = '問答';
            else if (rawType.includes('評分') || rawType.includes('星')) type = '評分';
            else if (rawType.includes('排序')) type = '排序';
            else if (rawType.includes('公告')) {
                type = '公告';
                options = [cols.slice(2).join('\t')];
            }
            else if (rawType.includes('白板') || rawType.includes('便條')) type = '白板';

            // ✨ 如果 type 不為空且有題目文字，才加入 liveData
            if (type && question) {
                if (type !== '公告') options = cols.slice(2).filter(opt => opt !== '');
                parsed.push({ id: generateUniqueId(), type, question, options });
            }
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
            <!-- 將 z-[10000] 改為 z-[5000] -->
            <div id="live-qr-modal" class="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[5000] hidden flex-col items-center justify-center cursor-pointer transition-opacity overflow-y-auto py-10 px-4" onclick="this.classList.add('hidden')">
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
        if (window.innerWidth <= 768 && window.isLiveSidebarOpen) {
            const mobileBackdrop = document.getElementById('live-mobile-sidebar-backdrop');
            if (mobileBackdrop) mobileBackdrop.click();
        }

        const modalId = "live-add-q-modal";
        if (document.getElementById(modalId)) return;

        const isEdit = editIdx >= 0;
        const qData = isEdit ? liveData[editIdx] : null;

        // 解析安全次數限制，防呆預設為 0
        const rawLimitVal = isEdit ? parseQuestionLimit(qData).toString() : '1';

        const modal = document.createElement('div');
        modal.id = modalId;
        // 將 z-[100000] 改為 z-[5000]，讓出空間給語言工具
        modal.className = "fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[5000] flex items-center justify-center p-4 opacity-0 transition-opacity duration-200";
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
        const container = document.getElementById('arenaModeContainer');
        (container && container.style.display !== 'none' ? container : document.body).appendChild(modal);
        
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

        if (qData.type === '白板') {
            contentArea.className = "w-full flex-1 flex flex-col min-h-0 z-20 transition-all duration-300 select-text";
        } else {
            contentArea.className = "w-full max-w-[1000px] mx-auto px-4 sm:px-6 flex-1 flex flex-col min-h-0 z-20 transition-all duration-300 pb-4 sm:pb-6 mt-2 select-text";
        }

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
                                <span class="mt-3 font-bold text-gray-700 text-sm md:text-lg text-center w-full break-words leading-tight px-1 select-text scalable-text">${escapeHtml(opt)}</span>
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
                                    <span class="font-extrabold text-gray-800 text-lg select-text scalable-text">${escapeHtml(r.opt)}</span>
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
                            <span class="text-sm font-bold text-gray-800 leading-snug select-text scalable-text">${escapeHtml(q.text)}</span>
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
            
            if (typeof window.boardZoom === 'undefined') window.boardZoom = 1;
            if (typeof window.boardPan === 'undefined') window.boardPan = { x: 0, y: 0 };
            
            const colorMap = { 
                'yellow': 'bg-[#FFF9B1] border-[#EAE49C] text-gray-800', 
                'pink': 'bg-[#FFD4DF] border-[#E8BAC6] text-gray-800', 
                'blue': 'bg-[#D4E8FF] border-[#BACEE8] text-gray-800', 
                'green': 'bg-[#D5F6D3] border-[#B9DBB7] text-gray-800',
                'white': 'bg-[#FFFFFF] border-gray-200 text-gray-800', 
                'gray': 'bg-[#F5F6F8] border-[#E0E0E0] text-gray-800',
                'text': 'bg-transparent border-transparent text-gray-800'
            };

            const boardMods = window.currentSpaceData[`board_mods_${qId}`] || {};
            let allNotes = [];
            
            globalPlayers.forEach(p => {
                const notes = p[`board_${qId}`] || [];
                notes.forEach(n => {
                    if (!boardMods[n.id]?.deleted) {
                        const mod = boardMods[n.id] || {};
                        allNotes.push({ ...n, author: p.name, text: mod.text || n.text, color: mod.color || n.color });
                        activeResponsesCount++;
                    }
                });
            });
            Object.keys(boardMods).forEach(k => {
                const mod = boardMods[k];
                if (mod.isTeacher && !mod.deleted) {
                    allNotes.push({ id: k, author: mod.author || '老師', text: mod.text, color: mod.color || 'yellow' });
                }
            });

            if (countDisplay) countDisplay.textContent = activeResponsesCount;

            let canvas = document.getElementById('whiteboard-canvas');
            if (!canvas) {
                contentArea.innerHTML = `
                    <div id="board-wrapper-main" class="flex-1 w-full relative h-full transition-all duration-300 flex flex-col z-10">
                        
                        <!-- 🌟 拔除所有靜態背景設定，統一交給 updateBoardView 引擎處理 -->
                        <div class="w-full flex-1 relative bg-[#F4F4F4] overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]" id="whiteboard-canvas" style="cursor: grab; touch-action: none;">
                            
                            <div class="absolute top-4 left-4 sm:left-6 z-[110] select-none">
                                <div id="board-floating-header" onclick="window.toggleBoardHeader()" class="bg-white/95 backdrop-blur-sm border border-gray-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 max-w-[300px] sm:max-w-[500px] transition-all cursor-pointer pointer-events-auto hover:bg-gray-50">
                                    <span class="material-symbols-outlined text-teal-500 text-[20px] flex-shrink-0">sticky_note_2</span>
                                    <div id="board-header-text" class="font-extrabold text-teal-900 truncate text-sm sm:text-base ${window.isBoardHeaderCollapsed ? 'hidden' : ''} scalable-q-text">
                                        ${escapeHtml(qData.question)}
                                    </div>
                                    <div class="p-0.5 text-gray-400 flex items-center">
                                        <span id="board-header-toggle-icon" class="material-symbols-outlined text-[18px]">
                                            ${window.isBoardHeaderCollapsed ? 'keyboard_arrow_right' : 'keyboard_arrow_left'}
                                        </span>
                                    </div>
                                </div>
                            </div>

							<div id="board-left-toolbar" class="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 flex flex-col p-1.5 gap-1.5 z-[120] select-none">
								<button id="btn-board-multiselect" class="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg cursor-pointer transition-colors" title="啟用框選與多選模式"><span class="material-symbols-outlined text-[20px] block">tab_unselected</span></button>
                                <button id="btn-board-panmode" class="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg cursor-pointer transition-colors" title="純檢視/平移模式 (防誤觸)"><span class="material-symbols-outlined text-[20px] block">pan_tool</span></button>

								<button class="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg cursor-pointer transition-colors" title="新增文字" onclick="window.addTeacherText()"><span class="material-symbols-outlined text-[20px] block">title</span></button>
								<button class="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg cursor-pointer transition-colors" title="新增老師便利貼" onclick="window.addTeacherNote()"><span class="material-symbols-outlined text-[20px] block">add_box</span></button>
								<button class="p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg cursor-pointer transition-colors" title="清空畫布" onclick="window.clearBoardNotes()"><span class="material-symbols-outlined text-[20px] block">delete_sweep</span></button>
							</div>

                            <!-- ✨ 加上明確的 ID，並提高行動版的 bottom (bottom-28) 避免被手機網址列遮蔽 -->
                            <div id="board-zoom-toolbar" class="absolute bottom-28 sm:bottom-6 right-4 sm:right-6 z-[120] flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-1 shadow-md select-none pointer-events-auto">
                                <button onclick="window.updateBoardZoom(-0.1)" class="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer transition-colors"><span class="material-symbols-outlined text-[20px]">remove</span></button>
                                <span id="board-zoom-val" class="text-xs font-black text-gray-600 min-w-[45px] text-center">${Math.round(window.boardZoom * 100)}%</span>
                                <button onclick="window.updateBoardZoom(0.1)" class="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer transition-colors"><span class="material-symbols-outlined text-[20px]">add</span></button>
                                <div class="w-px h-4 bg-gray-200 mx-1"></div>
                                <button onclick="window.resetBoardView()" class="p-1.5 hover:bg-teal-50 rounded-lg text-teal-600 cursor-pointer" title="重置視角"><span class="material-symbols-outlined text-[20px]">fit_screen</span></button>
                                <button onclick="window.toggleBoardMaximize()" class="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500 cursor-pointer ml-1 transition-colors" title="最大化畫布">
                                    <span id="board-max-icon" class="material-symbols-outlined text-[20px]">fullscreen</span>
                                </button>
                            </div>

                            <div id="board-content-layer" class="absolute inset-0 origin-top-left">
								<div id="board-selection-box" class="absolute border border-blue-500 bg-blue-500/20 z-[9999] hidden pointer-events-none"></div>
                                
                                <div id="board-note-menu" class="hidden absolute z-[5000] flex-row items-center justify-center shadow-xl border border-gray-200 bg-white rounded-lg cursor-default transition-opacity duration-150 px-2 py-1.5 select-none h-12 gap-1 flex-nowrap whitespace-nowrap min-w-max">
                                    <button id="btn-bm-edit" class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" title="編輯內容"><span class="material-symbols-outlined text-[20px]">edit</span></button>
                                    
                                    <!-- 🌟 新增：對齊與均分工具 (預設隱藏，多選時才顯示) -->
                                    <div class="relative hidden" id="btn-bm-align-wrapper">
                                        <button id="btn-bm-align-toggle" class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" title="排版與對齊"><span class="material-symbols-outlined text-[20px]">format_align_left</span></button>
                                        <div id="bm-align-submenu" class="align-submenu-container hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-gray-200 shadow-lg rounded-lg p-1.5 grid grid-cols-4 gap-1 z-50 w-max">
                                            <button class="bm-align-btn w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" data-action="left" title="靠左對齊"><span class="material-symbols-outlined text-[20px]">align_horizontal_left</span></button>
                                            <button class="bm-align-btn w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" data-action="center" title="水平置中"><span class="material-symbols-outlined text-[20px]">align_horizontal_center</span></button>
                                            <button class="bm-align-btn w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" data-action="right" title="靠右對齊"><span class="material-symbols-outlined text-[20px]">align_horizontal_right</span></button>
                                            <button class="bm-align-btn w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" data-action="dist-h" title="水平均分"><span class="material-symbols-outlined text-[20px]">horizontal_distribute</span></button>
                                            
                                            <button class="bm-align-btn w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" data-action="top" title="靠上對齊"><span class="material-symbols-outlined text-[20px]">align_vertical_top</span></button>
                                            <button class="bm-align-btn w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" data-action="middle" title="垂直置中"><span class="material-symbols-outlined text-[20px]">align_vertical_center</span></button>
                                            <button class="bm-align-btn w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" data-action="bottom" title="靠下對齊"><span class="material-symbols-outlined text-[20px]">align_vertical_bottom</span></button>
                                            <button class="bm-align-btn w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" data-action="dist-v" title="垂直均分"><span class="material-symbols-outlined text-[20px]">vertical_distribute</span></button>
                                        </div>
                                    </div>

                                    <div class="relative">
                                        <button id="btn-bm-color-toggle" class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" title="修改顏色"><span class="material-symbols-outlined text-[20px]">palette</span></button>
                                        <div id="bm-color-submenu" class="color-submenu-container hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-gray-200 shadow-lg rounded-lg p-2 gap-2 z-50 w-max">
                                            ${['yellow','pink','blue','green','white','gray','text'].map(c => `<div class="w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform ${c === 'text' ? 'bg-transparent border border-dashed border-gray-400' : colorMap[c].split(' ')[0]} border ${c === 'text' ? '' : 'border-black/10'} bm-color-dot shadow-sm flex items-center justify-center flex-shrink-0" data-color="${c}">${c === 'text' ? '<span class="material-symbols-outlined text-[14px] text-gray-500 pointer-events-none font-bold">title</span>' : ''}</div>`).join('')}
                                        </div>
                                    </div>
                                    
                                    <div class="relative">
                                        <button id="btn-bm-layer-toggle" class="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" title="圖層順序"><span class="material-symbols-outlined text-[20px]">layers</span></button>
                                        <div id="bm-layer-submenu" class="layer-submenu-container hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-gray-200 shadow-lg rounded-lg p-1.5 grid grid-cols-4 gap-1 z-50 w-max">
                                            <button class="bm-layer-btn w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" data-action="top" title="置頂"><span class="material-symbols-outlined text-[20px]">vertical_align_top</span></button>
                                            <button class="bm-layer-btn w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" data-action="up" title="上移"><span class="material-symbols-outlined text-[20px]">arrow_upward</span></button>
                                            <button class="bm-layer-btn w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" data-action="down" title="下移"><span class="material-symbols-outlined text-[20px]">arrow_downward</span></button>
                                            <button class="bm-layer-btn w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 rounded-md transition-colors" data-action="bottom" title="置底"><span class="material-symbols-outlined text-[20px]">vertical_align_bottom</span></button>
                                        </div>
                                    </div>
                                    
                                    
                                    <button id="btn-bm-delete" class="w-8 h-8 flex items-center justify-center hover:bg-rose-50 text-rose-600 rounded-md transition-colors" title="刪除"><span class="material-symbols-outlined text-[20px]">delete</span></button>
                                </div>

                            </div>
                            
                            <div id="board-scrollbar-x" class="absolute bottom-2 left-6 right-6 h-1.5 bg-gray-200/30 rounded-full z-[150] opacity-0 transition-opacity duration-300 pointer-events-none">
                                <div id="board-scrollthumb-x" class="absolute top-0 h-full bg-gray-300/60 rounded-full"></div>
                            </div>
                            <div id="board-scrollbar-y" class="absolute right-2 top-6 bottom-6 w-1.5 bg-gray-200/30 rounded-full z-[150] opacity-0 transition-opacity duration-300 pointer-events-none">
                                <div id="board-scrollthumb-y" class="absolute left-0 w-full bg-gray-300/60 rounded-full"></div>
                            </div>
                            
                        </div>
                    </div>
                `;
                canvas = document.getElementById('whiteboard-canvas');
                const contentLayer = document.getElementById('board-content-layer');

				window.isBoardHeaderCollapsed = false;
                window.toggleBoardHeader = () => {
                    window.isBoardHeaderCollapsed = !window.isBoardHeaderCollapsed;
                    const textEl = document.getElementById('board-header-text');
                    const iconEl = document.getElementById('board-header-toggle-icon');
                    if (window.isBoardHeaderCollapsed) {
                        textEl.classList.add('hidden');
                        iconEl.textContent = 'keyboard_arrow_right';
                    } else {
                        textEl.classList.remove('hidden');
                        iconEl.textContent = 'keyboard_arrow_left';
                    }
                };

                window.isBoardMaximized = false;
                // ✨ 智慧全螢幕引擎：自動收合與恢復側邊欄
                window.toggleBoardMaximize = () => {
                    window.isBoardMaximized = !window.isBoardMaximized;
                    const canvasEl = document.getElementById('whiteboard-canvas');
                    const icon = document.getElementById('board-max-icon');
                    const sidebar = document.getElementById('live-sidebar-wrapper');
                    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
                    const contentArea = document.getElementById('live-content-area'); // 🌟 新增：取得外層容器
                    
                    if (window.isBoardMaximized) {
                        window.tempHadSidebarOpen = window.isLiveSidebarOpen;
                        if (window.isLiveSidebarOpen && sidebar && btnToggleSidebar) {
                            sidebar.classList.add('collapsed');
                            sidebar.style.width = '0px';
                            btnToggleSidebar.classList.remove('bg-teal-50', 'text-teal-600');
                        }
                        
                        // 拔除相對定位，直接套用固定滿版
                        canvasEl.classList.remove('relative', 'flex-1');
                        canvasEl.classList.add('fixed', 'inset-0', 'w-full', 'h-[100dvh]');
                        canvasEl.style.zIndex = '5200';
                        
                        // 🌟 核心修正：將外層容器的 z-index 也提高，打破原本 z-[20] 被頂部工具列 z-[5100] 壓制的限制
                        if (contentArea) contentArea.style.zIndex = '5200';
                        
                        icon.textContent = 'fullscreen_exit';
                    } else {
                        // 恢復相對定位
                        canvasEl.classList.remove('fixed', 'inset-0', 'w-full', 'h-[100dvh]', 'w-screen', 'h-screen');
                        canvasEl.classList.add('relative', 'flex-1');
                        canvasEl.style.zIndex = ''; 
                        
                        // 🌟 恢復外層容器的預設 z-index
                        if (contentArea) contentArea.style.zIndex = '';
                        
                        icon.textContent = 'fullscreen';
                        
                        if (window.tempHadSidebarOpen && sidebar && btnToggleSidebar) {
                            sidebar.classList.remove('collapsed');
                            sidebar.style.width = window.liveSidebarWidth + 'px';
                            btnToggleSidebar.classList.add('bg-teal-50', 'text-teal-600');
                        }
                    }
                };

                window.addTeacherNote = (defaultText = "", defaultColor = "random") => {
                    if (typeof showBoardPrompt === 'function') {
                        const initText = typeof defaultText === 'string' ? defaultText : "";
                        const title = defaultColor === 'text' ? "新增文字" : "新增點子";
                        showBoardPrompt(title, initText, defaultColor, async (result) => {
                            if (result && result.text) {
                                const currentMods = window.currentSpaceData[`board_mods_${qId}`] || {};
                                
                                // 依據是否勾選批次新增來切分陣列
                                const texts = result.isBatch ? result.text.split('\n').map(t => t.trim()).filter(t => t) : [result.text];

                                // 智慧隨機色引擎 (像抽籤一樣，抽完一輪紅黃藍綠再補滿重抽)
                                let colorBag = [];
                                const getRandomColor = () => {
                                    if (colorBag.length === 0) {
                                        colorBag = ['yellow', 'pink', 'blue', 'green'].sort(() => Math.random() - 0.5);
                                    }
                                    return colorBag.pop();
                                };

                                const newNoteIds = []; // ✨ 收集新建立的 ID
                                texts.forEach((text, i) => {
                                    const noteId = 'teacher_' + Date.now() + '_' + i;
                                    newNoteIds.push(noteId);
                                    
                                    // ✨ 修正：精準計算出當前「可見視窗的左上角」座標 (加入 80px 的安全距離避免被介面擋住)
                                    const startX = (80 - window.boardPan.x) / window.boardZoom;
                                    const startY = (80 - window.boardPan.y) / window.boardZoom;
                                    
                                    // 加上批次新增的排版位移 (每張向右下錯開 30px)
                                    let x = startX + (i % 5) * 30;
                                    let y = startY + Math.floor(i / 5) * 30;

                                    // 🌟 如果老師開啟了「貼齊格線」，讓新產生的便利貼/文字直接對齊好！
                                    if (qData.options?.[7] === 'true') {
                                        const snapSize = 12;
                                        x = Math.round(x / snapSize) * snapSize;
                                        y = Math.round(y / snapSize) * snapSize;
                                    }
                                    
                                    // 如果選擇隨機，則調用智慧引擎，否則使用指定色
                                    const c = result.color === 'random' ? getRandomColor() : result.color;

                                    currentMods[noteId] = { 
                                        isTeacher: true, 
                                        text: text, 
                                        color: c, 
                                        x: x, 
                                        y: y, 
                                        author: '老師',
                                        z: 1000 + i // 確保新生成的會在最上層
                                    };
                                });

                                // ✨ 自動選取新產生的便利貼/文字
                                if (window.selectedNotes) {
                                    window.selectedNotes.clear(); // 清除舊選取
                                    newNoteIds.forEach(id => window.selectedNotes.add(id)); // 加入新選取
                                    if (newNoteIds.length > 0) window.currentActiveNoteId = newNoteIds[0];
                                    
                                    // 隱藏工具列並清除舊藍框，新的藍框會在資料庫更新後由渲染引擎自動補上
                                    document.getElementById('board-note-menu')?.classList.add('hidden');
                                    document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1'));
                                }

                                await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${qId}`]: currentMods });
                            }
                        });
                    }
                };
				window.addTeacherText = (defaultText = "") => {
                    if (typeof window.addTeacherNote === 'function') window.addTeacherNote(defaultText, "text");
                };

                window.clearBoardNotes = () => {
                    showCustomConfirm("清除畫布", "確定要清空白板上所有的便利貼嗎？", "全部清除", "bg-rose-500", async () => {
                        const currentMods = window.currentSpaceData[`board_mods_${qId}`] || {};
                        
                        document.querySelectorAll('.sticky-note').forEach(noteEl => {
                            const nId = noteEl.dataset.id;
                            if (nId) {
                                currentMods[nId] = { ...(currentMods[nId] || {}), deleted: true };
                            }
                            noteEl.remove(); // 拔除畫面元素
                        });
                        
                        // 隱藏可能還浮在畫面上的工具列
                        const menu = document.getElementById('board-note-menu');
                        if (menu) {
                            menu.classList.add('hidden');
                            menu.classList.remove('flex');
                        }

                        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${qId}`]: currentMods });
                    });
                };

                window.updateBoardView = () => {
                    contentLayer.style.transformOrigin = "0 0";
                    contentLayer.style.transform = `translate(${window.boardPan.x}px, ${window.boardPan.y}px) scale(${window.boardZoom})`;
                    const zoomVal = document.getElementById('board-zoom-val');
                    if (zoomVal) zoomVal.textContent = Math.round(window.boardZoom * 100) + '%';

                    if (canvas) {
                        // ✨ 智慧網格引擎 (LOD: Level of Detail)
                        // 1. 動態計算格線間距，當縮小時自動合併格子，避免密集恐懼症
                        let baseStep = 24;
                        while (baseStep * window.boardZoom < 16) {
                            baseStep *= 2; // 若視覺間距小於 16px，將格子放大兩倍 (24 -> 48 -> 96...)
                        }
                        const bgSize = baseStep * window.boardZoom;
                        
                        // 2. 取得目前的背景模式
                        const currentBgMode = qData.options?.[6] || 'dots';
                        
                        // 3. 專業白板色彩風格
                        if (currentBgMode === 'dots') {
                            canvas.style.backgroundImage = `radial-gradient(circle, rgba(9, 30, 66, 0.12) 1.2px, transparent 2px)`;
                        } else if (currentBgMode === 'grid') {
                            canvas.style.backgroundImage = `linear-gradient(rgba(9, 30, 66, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(9, 30, 66, 0.05) 1px, transparent 1px)`;
                        } else {
                            canvas.style.backgroundImage = 'none';
                        }

                        canvas.style.backgroundSize = `${bgSize}px ${bgSize}px`;
                        canvas.style.backgroundPosition = `${window.boardPan.x}px ${window.boardPan.y}px`;
                    }
                    
                    const scrollX = document.getElementById('board-scrollbar-x');
                    const scrollY = document.getElementById('board-scrollbar-y');
                    const thumbX = document.getElementById('board-scrollthumb-x');
                    const thumbY = document.getElementById('board-scrollthumb-y');
                    
                    if (scrollX && scrollY && thumbX && thumbY) {
                        const vw = canvas.clientWidth / window.boardZoom;
                        const vh = canvas.clientHeight / window.boardZoom;
                        const vx = -window.boardPan.x / window.boardZoom;
                        const vy = -window.boardPan.y / window.boardZoom;

                        let minContentX = vx, maxContentX = vx + vw;
                        let minContentY = vy, maxContentY = vy + vh;
                        
                        const notes = contentLayer.querySelectorAll('.sticky-note');
                        if (notes.length > 0) {
                            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                            notes.forEach(note => {
                                const x = parseFloat(note.style.left) || 0;
                                const y = parseFloat(note.style.top) || 0;
                                const body = note.querySelector('.note-body');
                                const w = body ? body.offsetWidth : 140;
                                const h = body ? body.offsetHeight : 140;
                                if (x < minX) minX = x;
                                if (x + w > maxX) maxX = x + w;
                                if (y < minY) minY = y;
                                if (y + h > maxY) maxY = y + h;
                            });
                            minContentX = Math.min(vx, minX - 500);
                            maxContentX = Math.max(vx + vw, maxX + 500);
                            minContentY = Math.min(vy, minY - 500);
                            maxContentY = Math.max(vy + vh, maxY + 500);
                        }

                        const totalW = maxContentX - minContentX;
                        const totalH = maxContentY - minContentY;
                        
                        const thumbW = Math.max(5, (vw / totalW) * 100);
                        let thumbLeft = ((vx - minContentX) / totalW) * 100;
                        thumbLeft = Math.max(0, Math.min(100 - thumbW, thumbLeft)); 
                        
                        const thumbH = Math.max(5, (vh / totalH) * 100);
                        let thumbTop = ((vy - minContentY) / totalH) * 100;
                        thumbTop = Math.max(0, Math.min(100 - thumbH, thumbTop));

                        thumbX.style.width = `${thumbW}%`;
                        thumbX.style.left = `${thumbLeft}%`;
                        thumbY.style.height = `${thumbH}%`;
                        thumbY.style.top = `${thumbTop}%`;

                        scrollX.style.opacity = '1';
                        scrollY.style.opacity = '1';
                        
                        clearTimeout(window.boardScrollbarTimeout);
                        window.boardScrollbarTimeout = setTimeout(() => {
                            scrollX.style.opacity = '0';
                            scrollY.style.opacity = '0';
                        }, 1000); 
                    }
                };

                // ✨ 升級：按鈕縮放引擎 (加入 0.2 秒平滑動畫，消除視覺延遲感)
                window.updateBoardZoom = (delta) => { 
                    const oldZoom = window.boardZoom;
                    window.boardZoom = Math.max(0.2, Math.min(3, window.boardZoom + delta)); 
                    const newZoom = window.boardZoom;
                    
                    const canvas = document.getElementById('whiteboard-canvas');
                    if (canvas) {
                        const cRect = canvas.getBoundingClientRect();
                        const centerX = cRect.width / 2;
                        const centerY = cRect.height / 2;
                        window.boardPan.x = centerX - (centerX - window.boardPan.x) * (newZoom / oldZoom);
                        window.boardPan.y = centerY - (centerY - window.boardPan.y) * (newZoom / oldZoom);
                    }
                    
                    const contentLayer = document.getElementById('board-content-layer');
                    if (contentLayer && canvas) {
                        // 讓便利貼圖層與背景網格「同步」平滑縮放
                        contentLayer.style.transition = 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)';
                        canvas.style.transition = 'background-size 0.2s cubic-bezier(0.25, 1, 0.5, 1), background-position 0.2s cubic-bezier(0.25, 1, 0.5, 1)';
                        
                        window.updateBoardView(); 
                        
                        clearTimeout(window.boardZoomAnimTimeout);
                        window.boardZoomAnimTimeout = setTimeout(() => {
                            contentLayer.style.transition = 'none';
                            canvas.style.transition = 'none';
                        }, 200);
                    } else {
                        window.updateBoardView(); 
                    }
                };

                // ✨ 升級「重置視角」(Zoom to Fit)
                window.resetBoardView = () => {
                    const notes = document.querySelectorAll('.sticky-note');
                    const canvas = document.getElementById('whiteboard-canvas');
                    if (!canvas || notes.length === 0) {
                        window.boardZoom = 1; window.boardPan = { x: 0, y: 0 }; window.updateBoardView();
                        return;
                    }

                    // 1. 找出所有便利貼的極限邊界 (Bounding Box)
                    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                    notes.forEach(note => {
                        const x = parseFloat(note.style.left) || 0;
                        const y = parseFloat(note.style.top) || 0;
                        const body = note.querySelector('.note-body');
                        const w = body ? body.offsetWidth : 140;
                        const h = body ? body.offsetHeight : 140;
                        if (x < minX) minX = x;
                        if (x + w > maxX) maxX = x + w;
                        if (y < minY) minY = y;
                        if (y + h > maxY) maxY = y + h;
                    });

                    // 2. 計算內容的總寬高與中心點
                    const contentWidth = maxX - minX;
                    const contentHeight = maxY - minY;
                    const contentCenterX = minX + contentWidth / 2;
                    const contentCenterY = minY + contentHeight / 2;

                    // 3. 計算最佳縮放比例 (保留 60px 的安全邊距)
                    const padding = 60;
                    const canvasW = canvas.clientWidth;
                    const canvasH = canvas.clientHeight;
                    
                    let targetZoom = 1;
                    if (contentWidth > 0 && contentHeight > 0) {
                        const zoomX = (canvasW - padding * 2) / contentWidth;
                        const zoomY = (canvasH - padding * 2) / contentHeight;
                        targetZoom = Math.min(zoomX, zoomY, 1.0);
                        targetZoom = Math.max(targetZoom, 0.2);
                    }

                    // 4. 計算並設定置中的平移座標
                    window.boardZoom = targetZoom;
                    window.boardPan.x = (canvasW / 2) - (contentCenterX * targetZoom);
                    window.boardPan.y = (canvasH / 2) - (contentCenterY * targetZoom);

                    // 5. 加上平滑動畫 (確保背景與內容同步飛行)
                    const contentLayer = document.getElementById('board-content-layer');
                    if (contentLayer && canvas) {
                        contentLayer.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                        canvas.style.transition = 'background-size 0.4s cubic-bezier(0.25, 1, 0.5, 1), background-position 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                        
                        window.updateBoardView();
                        
                        clearTimeout(window.boardResetTimeout);
                        window.boardResetTimeout = setTimeout(() => {
                            contentLayer.style.transition = 'none';
                            canvas.style.transition = 'none';
                        }, 400);
                    } else {
                        window.updateBoardView();
                    }
                };

                let isPanning = false;
                let draggedNote = null;
                let isDraggingNote = false;
                let stuckNote = null; 
                let isResizingNote = false; 
                let resizedNote = null;
                let startWidth = 0, startHeight = 0;
                
                let startPos = { x: 0, y: 0 };
                let initialPan = { x: 0, y: 0 };
                let noteOffset = { x: 0, y: 0 };
                let dragStartX = 0, dragStartY = 0;

                window.currentResizedNote = null;

                window.selectedNotes = new Set(); 
                let isMarquee = false; 
                let marqueeStart = { x: 0, y: 0 };
                // ✨ 新增：虛擬 Shift 狀態 (多選/框選模式)
                window.isBoardMultiSelectMode = false;
                // 🌟 新增：純檢視/平移模式狀態
                window.isBoardPanMode = false;

                // ✨ 綁定切換按鈕事件
                document.getElementById('btn-board-multiselect')?.addEventListener('click', function(e) {
                    e.stopPropagation();
                    window.isBoardMultiSelectMode = !window.isBoardMultiSelectMode;
                    
                    if (window.isBoardMultiSelectMode) {
                        this.className = 'p-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer transition-colors';
                        
                        // 🌟 手動安全關閉純檢視模式，避免迴圈衝突
                        if (window.isBoardPanMode) {
                            window.isBoardPanMode = false;
                            const panBtn = document.getElementById('btn-board-panmode');
                            if (panBtn) panBtn.className = 'p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg cursor-pointer transition-colors';
                        }
                        if (typeof showToast === 'function') showToast('✅ 已啟用「框選/多選」模式');
                    } else {
                        this.className = 'p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg cursor-pointer transition-colors';
                        if (typeof showToast === 'function') showToast('❌ 已關閉多選 (恢復一般選取)');
                    }
                });

                // 🌟 綁定純檢視/平移按鈕事件
                document.getElementById('btn-board-panmode')?.addEventListener('click', function(e) {
                    e.stopPropagation();
                    window.isBoardPanMode = !window.isBoardPanMode;
                    
                    if (window.isBoardPanMode) {
                        this.className = 'p-2 bg-amber-50 text-amber-600 rounded-lg cursor-pointer transition-colors';
                        
                        // 🌟 手動安全關閉多選模式，避免迴圈衝突
                        if (window.isBoardMultiSelectMode) {
                            window.isBoardMultiSelectMode = false;
                            const multiBtn = document.getElementById('btn-board-multiselect');
                            if (multiBtn) multiBtn.className = 'p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg cursor-pointer transition-colors';
                        }
                        
                        // 強制取消所有現有的選取
                        document.getElementById('board-note-menu')?.classList.add('hidden');
                        document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1'));
                        window.selectedNotes.clear();
                        window.currentActiveNoteId = null;
                        
                        if (typeof showToast === 'function') showToast('✋ 已啟用純檢視 (僅能平移與縮放)');
                    } else {
                        this.className = 'p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg cursor-pointer transition-colors';
                        if (typeof showToast === 'function') showToast('👆 已恢復一般選取與編輯模式');
                    }
                });

                canvas.style.touchAction = 'none';

                canvas.addEventListener('pointerdown', (e) => {
                    // 0. 防呆：點擊 UI 介面不處理 (✨ 加入翻譯工具的防呆排除)
                    if (e.target.closest('button') || e.target.closest('#board-left-toolbar') || e.target.closest('#board-floating-header') || e.target.closest('#board-zoom-toolbar') || e.target.closest('#board-note-menu') || e.target.closest('.draggable-translator')) {
                        return;
                    }
                    
                    // 🌟 新增：如果啟用純檢視/平移模式，強制全部轉為平移，不執行後續選取與拖曳判斷
                    if (window.isBoardPanMode) {
                        isPanning = true;
                        if (typeof canvas.setPointerCapture === 'function') canvas.setPointerCapture(e.pointerId);
                        canvas.style.cursor = 'grabbing';
                        startPos = { x: e.clientX, y: e.clientY };
                        initialPan = { ...window.boardPan };
                        document.getElementById('board-note-menu')?.classList.add('hidden');
                        return; // 直接中斷
                    }

                    // ✨ 統整判斷：保留 Shift 或是啟用了介面上的多選按鈕 (將 Ctrl/Cmd 拔除)
                    const isMultiSelectIntent = e.shiftKey || window.isBoardMultiSelectMode;

                    // 1. 中鍵/右鍵，或是按住 Ctrl / Cmd 鍵，永遠強制轉為平移畫布
                    if (e.button === 1 || e.button === 2 || e.ctrlKey || e.metaKey) {
                        isPanning = true;
                        if (typeof canvas.setPointerCapture === 'function') canvas.setPointerCapture(e.pointerId);
                        canvas.style.cursor = 'grabbing';
                        startPos = { x: e.clientX, y: e.clientY };
                        initialPan = { ...window.boardPan };
                        document.getElementById('board-note-menu')?.classList.add('hidden');
                        return; // 提早結束，不觸發選取或拖曳便利貼
                    }

                    // 2. 點擊改變尺寸把手 (支援一般右下角把手 & 文字專屬右側邊緣把手)
                    const rHandle = e.target.closest('.resize-handle');
                    const rHandleRight = e.target.closest('.resize-handle-right');
                    if (rHandle || rHandleRight) {
                        e.stopPropagation();
                        resizedNote = e.target.closest('.sticky-note');
                        window.currentResizedNote = resizedNote;
                        isResizingNote = true;
                        window.resizeDir = rHandleRight ? 'right' : 'both'; // ✨ 記錄拉伸方向
                        dragStartX = e.clientX;
                        dragStartY = e.clientY;
                        
                        const bodyEl = resizedNote.querySelector('.note-body');
                        startWidth = bodyEl.offsetWidth;
                        startHeight = bodyEl.offsetHeight;
                        
                        resizedNote.dataset.origZ = resizedNote.style.zIndex || 10;
                        resizedNote.style.zIndex = '99999'; 
                        
                        document.getElementById('board-note-menu')?.classList.add('hidden');
                        return;
                    }

                    // 3. 處理隨游標黏貼
                    if (stuckNote) {
                        // ... 原有邏輯保持不變 ...
                        const noteId = stuckNote.dataset.id;
                        const activeQId = window.currentSpaceData?.currentQuestionData?.id || qId;
                        const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                        
                        currentMods[noteId] = { 
                            ...currentMods[noteId], 
                            x: parseFloat(stuckNote.style.left), 
                            y: parseFloat(stuckNote.style.top)
                        };
                        
                        stuckNote.style.zIndex = stuckNote.dataset.origZ || 10;
                        stuckNote.style.cursor = '';
                        stuckNote.style.pointerEvents = ''; // 恢復可點擊
                        
                        window.currentActiveNoteId = noteId;
                        document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1'));
                        stuckNote.classList.add('ring-2', 'ring-blue-500', 'ring-offset-1');
                        
                        stuckNote = null;
                        db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods }).catch(()=>{});
                        return; 
                    }

                    // ✨ 4. 點擊到便利貼
                    const note = e.target.closest('.sticky-note');
                    if (note && !e.target.closest('#board-note-menu')) {
                        draggedNote = note;
                        isDraggingNote = false;
                        dragStartX = e.clientX;
                        dragStartY = e.clientY;
                        draggedNote._clickedFoldBtn = !!e.target.closest('.btn-fold-note');

                        if (typeof note.setPointerCapture === 'function') note.setPointerCapture(e.pointerId);

                        const rect = note.getBoundingClientRect();
                        noteOffset.x = (e.clientX - rect.left) / window.boardZoom;
                        noteOffset.y = (e.clientY - rect.top) / window.boardZoom;
                        
                        note.dataset.origZ = note.style.zIndex || 10;
                        note.style.zIndex = '99999';
                        note.style.cursor = 'grabbing';
                        
                        // ✨ 點擊選取邏輯 (支援 Shift 或 Ctrl 多選)
                        if (isMultiSelectIntent) {
                            if (window.selectedNotes.has(note.dataset.id)) {
                                window.selectedNotes.delete(note.dataset.id);
                                note.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1');
                            } else {
                                window.selectedNotes.add(note.dataset.id);
                                note.classList.add('ring-2', 'ring-blue-500', 'ring-offset-1');
                            }
                        } else {
                            // 如果點到的便利貼已經在多選群組內，不要清除群組 (這樣才能拖曳整個群組)
                            if (!window.selectedNotes.has(note.dataset.id)) {
                                window.selectedNotes.clear();
                                document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1'));
                                window.selectedNotes.add(note.dataset.id);
                                note.classList.add('ring-2', 'ring-blue-500', 'ring-offset-1');
                            }
                        }
                        window.currentActiveNoteId = note.dataset.id;

                    } else if (e.target === canvas || e.target === contentLayer) {
                        // ✨ 5. 點擊空白畫布
                        if (isMultiSelectIntent) {
                            // 按住 Shift 點空白處 ➡️ 拉框選取
                            isMarquee = true;
                            if (typeof canvas.setPointerCapture === 'function') canvas.setPointerCapture(e.pointerId);
                            
                            const cRect = canvas.getBoundingClientRect();
                            marqueeStart.x = (e.clientX - cRect.left - window.boardPan.x) / window.boardZoom;
                            marqueeStart.y = (e.clientY - cRect.top - window.boardPan.y) / window.boardZoom;
                            
                            const selBox = document.getElementById('board-selection-box');
                            if (selBox) {
                                selBox.style.left = marqueeStart.x + 'px';
                                selBox.style.top = marqueeStart.y + 'px';
                                selBox.style.width = '0px';
                                selBox.style.height = '0px';
                                selBox.classList.remove('hidden');
                            }
                            document.getElementById('board-note-menu')?.classList.add('hidden');
                        } else {
                            // 單純點空白處 ➡️ 平移畫布
                            isPanning = true;
                            if (typeof canvas.setPointerCapture === 'function') canvas.setPointerCapture(e.pointerId);
                            canvas.style.cursor = 'grabbing';
                            startPos = { x: e.clientX, y: e.clientY };
                            initialPan = { ...window.boardPan };
                            document.getElementById('board-note-menu')?.classList.add('hidden');
                        }
                    }
                });

                document.addEventListener('pointermove', (e) => {
                    if (isResizingNote && resizedNote) {
                        const dx = (e.clientX - dragStartX) / window.boardZoom;
                        const dy = (e.clientY - dragStartY) / window.boardZoom;
                        const bodyEl = resizedNote.querySelector('.note-body');
                        
                        // ✨ 依照方向決定調整邏輯
                        if (window.resizeDir === 'right') {
                            let newW = Math.max(50, startWidth + dx);
                            bodyEl.style.width = newW + 'px';
                            bodyEl.style.maxWidth = 'none'; // 移除預設最大寬度限制
                        } else {
                            let newW = Math.max(60, startWidth + dx);
                            let newH = Math.max(60, startHeight + dy);
                            bodyEl.style.width = newW + 'px';
                            bodyEl.style.height = newH + 'px';
                        }
                        return;
                    }

                    if (stuckNote) {
                        const cRect = canvas.getBoundingClientRect();
                        let x = (e.clientX - cRect.left - window.boardPan.x) / window.boardZoom - noteOffset.x;
                        let y = (e.clientY - cRect.top - window.boardPan.y) / window.boardZoom - noteOffset.y;
                        stuckNote.style.left = x + 'px';
                        stuckNote.style.top = y + 'px';
                        return;
                    }

                    // ✨ 加入框選 (Marquee) 繪製與即時碰撞偵測
                    if (isMarquee) {
                        const cRect = canvas.getBoundingClientRect();
                        const curX = (e.clientX - cRect.left - window.boardPan.x) / window.boardZoom;
                        const curY = (e.clientY - cRect.top - window.boardPan.y) / window.boardZoom;

                        const left = Math.min(marqueeStart.x, curX);
                        const top = Math.min(marqueeStart.y, curY);
                        const width = Math.abs(curX - marqueeStart.x);
                        const height = Math.abs(curY - marqueeStart.y);

                        const selBox = document.getElementById('board-selection-box');
                        if (selBox) {
                            selBox.style.left = left + 'px';
                            selBox.style.top = top + 'px';
                            selBox.style.width = width + 'px';
                            selBox.style.height = height + 'px';
                            selBox.classList.remove('hidden');
                        }

                        // 即時計算碰撞與選取
                        document.querySelectorAll('.sticky-note').forEach(note => {
                            const nx = parseFloat(note.style.left);
                            const ny = parseFloat(note.style.top);
                            const bodyEl = note.querySelector('.note-body');
                            const nw = bodyEl ? bodyEl.offsetWidth : 140; 
                            const nh = bodyEl ? bodyEl.offsetHeight : 140;

                            if (nx < left + width && nx + nw > left && ny < top + height && ny + nh > top) {
                                window.selectedNotes.add(note.dataset.id);
                                note.classList.add('ring-2', 'ring-blue-500', 'ring-offset-1');
                            } else if (!e.shiftKey && !window.isBoardMultiSelectMode) { 
                                window.selectedNotes.delete(note.dataset.id);
                                note.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1');
                            }
                        });
                    } else if (draggedNote) {
                        if (Math.abs(e.clientX - dragStartX) > 3 || Math.abs(e.clientY - dragStartY) > 3) {
                            isDraggingNote = true;
                            document.getElementById('board-note-menu')?.classList.add('hidden'); 
                        }
                        const cRect = canvas.getBoundingClientRect();
                        let newX = (e.clientX - cRect.left - window.boardPan.x) / window.boardZoom - noteOffset.x;
                        let newY = (e.clientY - cRect.top - window.boardPan.y) / window.boardZoom - noteOffset.y;
                        
                        if (qData.options?.[7] === 'true') {
                            const snapSize = 12; // ✨ 改為 12px，允許貼齊點與點的正中間
                            newX = Math.round(newX / snapSize) * snapSize;
                            newY = Math.round(newY / snapSize) * snapSize;
                        }

                        // ✨ 群組拖曳引擎
                        const dx = newX - parseFloat(draggedNote.style.left);
                        const dy = newY - parseFloat(draggedNote.style.top);

                        if (window.selectedNotes.has(draggedNote.dataset.id)) {
                            window.selectedNotes.forEach(id => {
                                const n = document.getElementById('note-' + id);
                                if (n) {
                                    n.style.left = (parseFloat(n.style.left) + dx) + 'px';
                                    n.style.top = (parseFloat(n.style.top) + dy) + 'px';
                                }
                            });
                        } else {
                            draggedNote.style.left = newX + 'px';
                            draggedNote.style.top = newY + 'px';
                        }
                    } else if (isPanning) {
                        window.boardPan.x = initialPan.x + (e.clientX - startPos.x);
                        window.boardPan.y = initialPan.y + (e.clientY - startPos.y);
                        window.updateBoardView();
                    }
                });

                // ✨ 綁定滑鼠滾輪事件 (完美實作：以游標為中心縮放)
                canvas.addEventListener('wheel', (e) => {
                    e.preventDefault(); // 阻止網頁預設的上下滾動

                    // 取得游標在畫布上的真實座標
                    const rect = canvas.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;

                    const oldZoom = window.boardZoom;

                    // 判斷縮放幅度：觸控板捏合(含 Ctrl) 或是 一般滑鼠滾輪
                    let zoomDelta = 0;
                    if (e.ctrlKey) {
                        zoomDelta = -e.deltaY * 0.01; // 觸控板平滑縮放
                    } else {
                        zoomDelta = e.deltaY > 0 ? -0.1 : 0.1; // 滑鼠滾輪階段性縮放
                    }

                    window.boardZoom = Math.max(0.2, Math.min(3, window.boardZoom + zoomDelta));
                    const newZoom = window.boardZoom;

                    // ✨ 核心數學：讓滑鼠游標指著的點，在縮放後依然維持在原地 (Zoom to Pointer)
                    window.boardPan.x = mouseX - (mouseX - window.boardPan.x) * (newZoom / oldZoom);
                    window.boardPan.y = mouseY - (mouseY - window.boardPan.y) * (newZoom / oldZoom);

                    window.updateBoardView();
                }, { passive: false });

                canvas.addEventListener('dblclick', (e) => {
                    // 🌟 新增：純檢視模式下禁止雙擊編輯
                    if (window.isBoardPanMode) return;

                    const note = e.target.closest('.sticky-note');
                    if (note && !e.target.closest('#board-note-menu')) {
                        if (note.classList.contains('is-collapsed')) return;
                        
                        const activeQId = window.currentSpaceData?.currentQuestionData?.id || qId;
                        const action = window.currentSpaceData?.currentQuestionData?.options?.[4] || 'edit';
                        
                        if (action === 'edit') {
                            // 執行：快速編輯
                            const noteId = note.dataset.id;
                            const currentText = note.querySelector('.note-text-content').textContent;
                            const currentColor = note.dataset.color || 'yellow';
                            document.getElementById('board-note-menu')?.classList.add('hidden');
                            
                            if (typeof showBoardPrompt === 'function') {
                                // 🌟 新增：將刪除與圖層邏輯打包傳入
                                const extraOpts = {
                                    onDelete: () => {
                                        showCustomConfirm("刪除點子", "確定要永久刪除？", "確認刪除", "bg-rose-500", async () => {
                                            const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                                            currentMods[noteId] = { ...currentMods[noteId], deleted: true };
                                            document.getElementById('note-' + noteId)?.remove();
                                            await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods });
                                        });
                                    },
                                    onLayer: async (action) => {
                                        const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                                        const currentZ = currentMods[noteId]?.z !== undefined ? currentMods[noteId].z : 10;
                                        let newZ = currentZ;
                                        let allZs = allNotes.map(n => {
                                            const m = currentMods[n.id] || {};
                                            return m.z !== undefined ? m.z : 10;
                                        });
                                        if (action === 'top') newZ = Math.max(...allZs, 10) + 1;
                                        else if (action === 'bottom') newZ = Math.min(...allZs, 10) - 1;
                                        else if (action === 'up') newZ = currentZ + 1;
                                        else if (action === 'down') newZ = currentZ - 1;
                                        currentMods[noteId] = { ...currentMods[noteId], z: newZ };
                                        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods });
                                    }
                                };

                                showBoardPrompt("編輯", currentText, currentColor, async (result) => {
                                    if (result && result.text) {
                                        const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                                        
                                        // ✨ 依據是否勾選批次新增來切分陣列
                                        const texts = result.isBatch ? result.text.split('\n').map(t => t.trim()).filter(t => t) : [result.text];
                                        if (texts.length === 0) return;

                                        let colorBag = [];
                                        const getRandomColor = () => {
                                            if (colorBag.length === 0) colorBag = ['yellow', 'pink', 'blue', 'green'].sort(() => Math.random() - 0.5);
                                            return colorBag.pop();
                                        };

                                        // 1. 更新原本的第一張便利貼
                                        const firstColor = result.color === 'random' ? getRandomColor() : result.color;
                                        currentMods[noteId] = { ...currentMods[noteId], text: texts[0], color: firstColor };
                                        
                                        // 樂觀更新 UI
                                        note.querySelector('.note-text-content').textContent = texts[0];
                                        note.dataset.color = firstColor;
                                        const bodyEl = note.querySelector('.note-body');
                                        if (bodyEl) {
                                            bodyEl.className = `note-body relative shadow-sm rounded-sm border transition-shadow group-hover:shadow-lg ${colorMap[firstColor] || colorMap['yellow']}`;
                                            bodyEl.setAttribute('data-first-char', (texts[0] || '').trim().charAt(0) || '');
                                        }

                                        // 2. 如果有換行拆解出多張，產生新的便利貼
                                        if (texts.length > 1) {
                                            const origX = parseFloat(note.style.left) || 100;
                                            const origY = parseFloat(note.style.top) || 100;
                                            const origAuthor = note.dataset.author || '老師';
                                            const baseZ = currentMods[noteId].z !== undefined ? currentMods[noteId].z : 10;

                                            for (let i = 1; i < texts.length; i++) {
                                                const newNoteId = 'split_' + Date.now() + '_' + i;
                                                const c = result.color === 'random' ? getRandomColor() : result.color;
                                                
                                                currentMods[newNoteId] = { 
                                                    isTeacher: true, 
                                                    text: texts[i], 
                                                    color: c, 
                                                    x: origX + (i % 5) * 30, 
                                                    y: origY + Math.floor(i / 5) * 30 + 30, 
                                                    author: origAuthor,
                                                    z: baseZ + i
                                                };
                                            }
                                        }

                                        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods });
                                    }
                                }, extraOpts);
                            }
                        } else if (action === 'stick') {
                            // 執行：隨游標黏貼
                            if (draggedNote) {
                                draggedNote.style.cursor = ''; // 取消原本點擊時賦予的拖曳狀態
                                draggedNote = null;
                            }
                            stuckNote = note;
                            
                            document.getElementById('board-note-menu')?.classList.add('hidden');
                            document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1'));
                            
                            const rect = note.getBoundingClientRect();
                            noteOffset.x = (e.clientX - rect.left) / window.boardZoom;
                            noteOffset.y = (e.clientY - rect.top) / window.boardZoom;
                            
                            note.dataset.origZ = note.style.zIndex || 10;
                            note.style.zIndex = '99999';
                            note.style.cursor = 'none'; // 隱藏原本滑鼠，製造卡片黏在手上的錯覺
                            note.style.pointerEvents = 'none'; // 讓下次點擊能穿透卡片點到畫布
                        }
                    }
                });

				// ✨ 點擊展開子選單與排版邏輯 (乾淨去重複版)
                const colorToggle = document.getElementById('btn-bm-color-toggle');
                const colorMenu = document.getElementById('bm-color-submenu');
                const layerToggle = document.getElementById('btn-bm-layer-toggle');
                const layerMenu = document.getElementById('bm-layer-submenu');
                const alignToggle = document.getElementById('btn-bm-align-toggle');
                const alignMenu = document.getElementById('bm-align-submenu');

                const hideAllSubmenus = () => {
                    if (colorMenu) { colorMenu.classList.add('hidden'); colorMenu.classList.remove('flex'); }
                    if (layerMenu) { layerMenu.classList.add('hidden'); layerMenu.classList.remove('flex'); }
                    if (alignMenu) { alignMenu.classList.add('hidden'); alignMenu.classList.remove('flex'); }
                };

                if (colorToggle && colorMenu) {
                    colorToggle.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const isHidden = colorMenu.classList.contains('hidden');
                        hideAllSubmenus();
                        if (isHidden) { colorMenu.classList.remove('hidden'); colorMenu.classList.add('flex'); }
                    });
                }
                
                if (layerToggle && layerMenu) {
                    layerToggle.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const isHidden = layerMenu.classList.contains('hidden');
                        hideAllSubmenus();
                        if (isHidden) { layerMenu.classList.remove('hidden'); layerMenu.classList.add('flex'); }
                    });
                }

                if (alignToggle && alignMenu) {
                    alignToggle.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const isHidden = alignMenu.classList.contains('hidden');
                        hideAllSubmenus();
                        if (isHidden) { alignMenu.classList.remove('hidden'); alignMenu.classList.add('flex'); }
                    });
                }

                // 🌟 對齊與均分演算引擎 (升級：樂觀 UI 瞬間移動)
                document.querySelectorAll('.bm-align-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation(); // ✨ 必須阻止冒泡，避免點擊穿透觸發畫布的取消選取！
                        const action = e.currentTarget.dataset.action;
                        const activeQId = window.currentSpaceData?.currentQuestionData?.id || qId;
                        const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                        
                        if (window.selectedNotes.size < 2) return;

                        // 1. 取得所有選取的便利貼座標與尺寸
                        const notesData = [];
                        window.selectedNotes.forEach(id => {
                            const n = document.getElementById('note-' + id);
                            if (n) {
                                const body = n.querySelector('.note-body');
                                notesData.push({
                                    id: id,
                                    x: parseFloat(n.style.left) || 0,
                                    y: parseFloat(n.style.top) || 0,
                                    w: body ? body.offsetWidth : 140,
                                    h: body ? body.offsetHeight : 140
                                });
                            }
                        });

                        // 2. 尋找極值 (Bounding Box)
                        const minX = Math.min(...notesData.map(n => n.x));
                        const maxX = Math.max(...notesData.map(n => n.x + n.w));
                        const minY = Math.min(...notesData.map(n => n.y));
                        const maxY = Math.max(...notesData.map(n => n.y + n.h));
                        const centerX = (minX + maxX) / 2;
                        const centerY = (minY + maxY) / 2;

                        // 3. 執行對齊數學運算 (並同步進行樂觀 UI 更新)
                        const applyAlign = (id, newX, newY) => {
                            const mod = currentMods[id] || {};
                            if (newX !== undefined) mod.x = newX;
                            if (newY !== undefined) mod.y = newY;
                            currentMods[id] = { ...currentMods[id], ...mod };
                            
                            // ✨ 樂觀更新：立刻移動 DOM 元素，不等待資料庫回傳，保證視覺瞬間對齊！
                            const nEl = document.getElementById('note-' + id);
                            if (nEl) {
                                if (newX !== undefined) nEl.style.left = newX + 'px';
                                if (newY !== undefined) nEl.style.top = newY + 'px';
                            }
                        };

                        if (action === 'left') {
                            notesData.forEach(n => applyAlign(n.id, minX, undefined));
                        } else if (action === 'center') {
                            notesData.forEach(n => applyAlign(n.id, centerX - (n.w / 2), undefined));
                        } else if (action === 'right') {
                            notesData.forEach(n => applyAlign(n.id, maxX - n.w, undefined));
                        } else if (action === 'top') {
                            notesData.forEach(n => applyAlign(n.id, undefined, minY));
                        } else if (action === 'middle') {
                            notesData.forEach(n => applyAlign(n.id, undefined, centerY - (n.h / 2)));
                        } else if (action === 'bottom') {
                            notesData.forEach(n => applyAlign(n.id, undefined, maxY - n.h));
                        } else if (action === 'dist-h' && notesData.length > 2) {
                            notesData.sort((a, b) => a.x - b.x); 
                            const first = notesData[0];
                            const last = notesData[notesData.length - 1];
                            const step = (last.x - first.x) / (notesData.length - 1);
                            notesData.forEach((n, idx) => applyAlign(n.id, first.x + (step * idx), undefined));
                        } else if (action === 'dist-v' && notesData.length > 2) {
                            notesData.sort((a, b) => a.y - b.y); 
                            const first = notesData[0];
                            const last = notesData[notesData.length - 1];
                            const step = (last.y - first.y) / (notesData.length - 1);
                            notesData.forEach((n, idx) => applyAlign(n.id, undefined, first.y + (step * idx)));
                        }

                        // 4. 更新畫面與資料庫 (✨ 不關閉選單，方便連續操作)
                        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods });
                    });
                });

                // ✨ 圖層順序控制引擎 (升級支援多選一鍵移至頂層)
                document.querySelectorAll('.bm-layer-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation(); // ✨ 同樣防止穿透
                        const action = e.currentTarget.dataset.action;
                        const activeQId = window.currentSpaceData?.currentQuestionData?.id || qId;
                        const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                        
                        if (window.selectedNotes.size === 0) return;

                        let allZs = allNotes.map(n => {
                            const m = currentMods[n.id] || {};
                            return m.z !== undefined ? m.z : 10;
                        });
                        
                        window.selectedNotes.forEach(noteId => {
                            const currentZ = currentMods[noteId]?.z !== undefined ? currentMods[noteId].z : 10;
                            let newZ = currentZ;
                            
                            if (action === 'top') newZ = Math.max(...allZs, 10) + 1;
                            else if (action === 'bottom') newZ = Math.min(...allZs, 10) - 1;
                            else if (action === 'up') newZ = currentZ + 1;
                            else if (action === 'down') newZ = currentZ - 1;
                            
                            currentMods[noteId] = { ...currentMods[noteId], z: newZ };
                            allZs.push(newZ); // 讓下一張卡片可以疊在上面
                            
                            // 樂觀更新 UI
                            const nEl = document.getElementById('note-' + noteId);
                            if (nEl) nEl.style.zIndex = newZ;
                        });
                        
                        // ✨ 不關閉選單，方便連續點擊上移/下移
                        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods });
                    });
                });

                // ===== 🌟 統一的選單渲染引擎 =====
                window.renderBoardSelectionMenu = () => {
                    const menu = document.getElementById('board-note-menu');
                    const activeQId = window.currentSpaceData?.currentQuestionData?.id || qId;
                    const showToolbar = window.currentSpaceData?.currentQuestionData?.options?.[3] === 'true';
                    if (!menu) return;

                    if (window.selectedNotes && window.selectedNotes.size > 0) {
                        let currentNoteId = window.currentActiveNoteId;
                        if (!currentNoteId || !window.selectedNotes.has(currentNoteId)) {
                            currentNoteId = Array.from(window.selectedNotes)[0];
                            window.currentActiveNoteId = currentNoteId;
                        }
                        
                        const currentNote = document.getElementById('note-' + currentNoteId);
                        if (!currentNote) return;

                        const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                        const isCollapsed = currentMods[currentNoteId]?.collapsed;

                        const editBtn = document.getElementById('btn-bm-edit');
                        const alignWrapper = document.getElementById('btn-bm-align-wrapper');
                        
                        if (window.selectedNotes.size > 1) {
                            if (editBtn) editBtn.classList.add('hidden'); 
                            if (alignWrapper) alignWrapper.classList.remove('hidden'); 
                        } else {
                            if (editBtn) editBtn.classList.remove('hidden'); 
                            if (alignWrapper) alignWrapper.classList.add('hidden'); 
                        }

                        document.querySelectorAll('.sticky-note').forEach(n => {
                            if (window.selectedNotes.has(n.dataset.id)) {
                                n.classList.add('ring-2', 'ring-blue-500', 'ring-offset-1');
                            } else {
                                n.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1');
                            }
                        });

                        // ✨ 觸發 selectionchange，強制喚醒翻譯工具更新按鈕狀態！
                        document.dispatchEvent(new Event('selectionchange'));

                        const colorSub = menu.querySelector('.color-submenu-container');
                        const layerSub = menu.querySelector('.layer-submenu-container');
                        const alignSub = menu.querySelector('.align-submenu-container');

                        if (showToolbar && !isCollapsed) {
                            menu.classList.remove('hidden');
                            menu.classList.add('flex');
                            
                            const canvas = document.getElementById('whiteboard-canvas');
                            const cRect = canvas.getBoundingClientRect();
                            
                            if (window.selectedNotes.size > 1) {
                                // ✨ 多選時：固定在畫布可視視窗的右上角
                                const viewRight = (-window.boardPan.x + cRect.width) / window.boardZoom;
                                const viewTop = -window.boardPan.y / window.boardZoom;
                                
                                menu.style.left = viewRight + 'px';
                                menu.style.top = viewTop + 'px';
                                // 距離視窗邊緣保留 20px 安全距離 (需隨縮放比例反向計算確保視覺大小一致)
                                menu.style.transform = `translate(calc(-100% - ${20/window.boardZoom}px), ${20/window.boardZoom}px)`;
                                
                                // 子選單向左下展開，避免超出螢幕
                                const subClass = "hidden absolute top-full right-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-lg z-50 w-max";
                                if(colorSub) colorSub.className = "color-submenu-container " + subClass + " p-2 gap-2";
                                if(layerSub) layerSub.className = "layer-submenu-container " + subClass + " p-1.5 grid grid-cols-4 gap-1";
                                if(alignSub) alignSub.className = "align-submenu-container " + subClass + " p-1.5 grid grid-cols-4 gap-1"; 
                            } else {
                                // 單選時：跟隨便利貼
                                const nRect = currentNote.getBoundingClientRect(); 
                                const spaceAboveScreen = nRect.top - cRect.top;
                                
                                const bodyEl = currentNote.querySelector('.note-body');
                                const noteW = bodyEl ? bodyEl.offsetWidth : 140;
                                const noteH = bodyEl ? bodyEl.offsetHeight : 140;
                                
                                let menuLeft = parseFloat(currentNote.style.left) + (noteW / 2); 
                                const menuWidth = 210; 
                                const canvasRealWidth = cRect.width / window.boardZoom;
                                if (menuLeft - menuWidth / 2 < 10) menuLeft = menuWidth / 2 + 10;
                                if (menuLeft + menuWidth / 2 > canvasRealWidth - 10) menuLeft = canvasRealWidth - menuWidth / 2 - 10;

                                if (spaceAboveScreen < 180) {
                                    menu.style.left = menuLeft + 'px';
                                    menu.style.top = (parseFloat(currentNote.style.top) + noteH + 8) + 'px';
                                    menu.style.transform = 'translate(-50%, 0)';
                                    if(colorSub) colorSub.className = "color-submenu-container hidden absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-gray-200 shadow-lg rounded-lg p-2 gap-2 z-50 w-max";
                                    if(layerSub) layerSub.className = "layer-submenu-container hidden absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-gray-200 shadow-lg rounded-lg p-1.5 grid grid-cols-4 gap-1 z-50 w-max";
                                    if(alignSub) alignSub.className = "align-submenu-container hidden absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border border-gray-200 shadow-lg rounded-lg p-1.5 grid grid-cols-4 gap-1 z-50 w-max"; 
                                } else {
                                    menu.style.left = menuLeft + 'px';
                                    menu.style.top = (parseFloat(currentNote.style.top) - 8) + 'px';
                                    menu.style.transform = 'translate(-50%, -100%)';
                                    if(colorSub) colorSub.className = "color-submenu-container hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-gray-200 shadow-lg rounded-lg p-2 gap-2 z-50 w-max";
                                    if(layerSub) layerSub.className = "layer-submenu-container hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-gray-200 shadow-lg rounded-lg p-1.5 grid grid-cols-4 gap-1 z-50 w-max";
                                    if(alignSub) alignSub.className = "align-submenu-container hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-gray-200 shadow-lg rounded-lg p-1.5 grid grid-cols-4 gap-1 z-50 w-max"; 
                                }
                            }
                        } else {
                            menu.classList.add('hidden');
                            menu.classList.remove('flex');
                        }
                    } else {
                        menu.classList.add('hidden');
                        menu.classList.remove('flex');
                    }
                };

                document.addEventListener('pointerup', async (e) => {
                    if (isResizingNote && resizedNote) {
                        const noteId = resizedNote.dataset.id;
                        const bodyEl = resizedNote.querySelector('.note-body');
                        resizedNote.style.zIndex = resizedNote.dataset.origZ || 10;
                        
                        const activeQId = window.currentSpaceData?.currentQuestionData?.id || qId;
                        const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                        
                        // ✨ 依照拖曳方向儲存屬性
                        if (window.resizeDir === 'right') {
                            currentMods[noteId] = { ...currentMods[noteId], w: bodyEl.offsetWidth };
                        } else {
                            currentMods[noteId] = { ...currentMods[noteId], w: bodyEl.offsetWidth, h: bodyEl.offsetHeight };
                        }
                        
                        isResizingNote = false;
                        resizedNote = null;
                        window.currentResizedNote = null;
                        window.resizeDir = null; // 清除狀態
                        db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods }).catch(()=>{});
                        return;
                    }

                    if (draggedNote) {
                        const currentNote = draggedNote;
                        if (typeof currentNote.releasePointerCapture === 'function') {
                            currentNote.releasePointerCapture(e.pointerId);
                        }

                        const activeQId = window.currentSpaceData?.currentQuestionData?.id || qId;
                        const noteId = currentNote.dataset.id;
                        const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                        const isCollapsed = currentMods[noteId]?.collapsed;
                        
                        const originalZ = currentMods[noteId]?.z !== undefined ? currentMods[noteId].z : 10;
                        currentNote.style.zIndex = originalZ;
                        draggedNote = null;
                        
                        if (!isDraggingNote) {
                            const fBtnClicked = currentNote._clickedFoldBtn;
                            if (fBtnClicked || isCollapsed) {
                                currentMods[noteId] = { ...currentMods[noteId], collapsed: !isCollapsed };
                                if (!isCollapsed) currentNote.classList.add('is-collapsed');
                                else currentNote.classList.remove('is-collapsed');
                                
                                document.getElementById('board-note-menu')?.classList.add('hidden');
                                document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1'));
                                try { await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods }); } catch (err) {}
                                return;
                            }
                        }
                        
                        window.currentActiveNoteId = noteId;
                        if (typeof window.renderBoardSelectionMenu === 'function') window.renderBoardSelectionMenu();

                        // ✨ 將拖曳後的最新群組座標寫回資料庫
                        if (isDraggingNote) {
                            const modsToUpdate = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                            if (window.selectedNotes.has(noteId)) {
                                window.selectedNotes.forEach(id => {
                                    const n = document.getElementById('note-' + id);
                                    if (n) {
                                        modsToUpdate[id] = { 
                                            ...modsToUpdate[id], 
                                            x: parseFloat(n.style.left), 
                                            y: parseFloat(n.style.top)
                                        };
                                    }
                                });
                            } else {
                                modsToUpdate[noteId] = { 
                                    ...modsToUpdate[noteId], 
                                    x: parseFloat(currentNote.style.left), 
                                    y: parseFloat(currentNote.style.top)
                                };
                            }
                            try { await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: modsToUpdate }); } catch (err) {}
                        }
                        return; // 結束拖曳便利貼流程
                    } 
                    
                    // ✨ 處理框選與平移的釋放邏輯
                    let wasMarquee = isMarquee;
                    if (isMarquee) {
                        isMarquee = false;
                        if (typeof canvas.releasePointerCapture === 'function') canvas.releasePointerCapture(e.pointerId);
                        
                        const selBox = document.getElementById('board-selection-box');
                        if (selBox) selBox.classList.add('hidden');
                        
                        if (window.selectedNotes.size === 1) {
                            window.currentActiveNoteId = Array.from(window.selectedNotes)[0];
                        }
                        
                        // ✨ 框選結束後，自動顯示工具列
                        if (typeof window.renderBoardSelectionMenu === 'function') window.renderBoardSelectionMenu();
                    }
                    
                    if (isPanning) {
                        isPanning = false;
                        if (typeof canvas.releasePointerCapture === 'function') {
                            canvas.releasePointerCapture(e.pointerId);
                        }
                        canvas.style.cursor = 'default'; 

                        // ✨ 智慧判定：如果滑鼠放開時，位置跟按下去時幾乎一樣 (單純點擊而非拖曳平移)
                        if (Math.abs(e.clientX - startPos.x) < 5 && Math.abs(e.clientY - startPos.y) < 5) {
                            // 點擊空白處，取消所有選取！
                            document.getElementById('board-note-menu')?.classList.add('hidden');
                            document.getElementById('board-note-menu')?.classList.remove('flex');
                            document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1'));
                            window.selectedNotes.clear();
                            window.currentActiveNoteId = null;
                        }
                    } else if (!wasMarquee && !e.target.closest('.sticky-note') && !e.target.closest('#board-note-menu') && !e.target.closest('#board-left-toolbar') && !e.target.closest('.draggable-translator') && !e.target.closest('#global-lang-submenu') && !e.target.closest('#btn-global-lang-toggle')) {
                        // 防呆底線：其他情況下的空白處點擊清除選取
                        document.getElementById('board-note-menu')?.classList.add('hidden');
                        document.getElementById('board-note-menu')?.classList.remove('flex');
                        document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1'));
                        window.selectedNotes.clear();
                        window.currentActiveNoteId = null;

                        // ✨ 觸發 selectionchange，通知翻譯工具取消選取狀態
                        document.dispatchEvent(new Event('selectionchange'));

                    }
                });

                window.updateBoardView(); 

                // ✨ 獨立出刪除邏輯，讓按鈕與鍵盤 Delete 鍵共用，並完美支援「多選刪除」
                const deleteSelectedNotes = () => {
                    if (!window.selectedNotes || window.selectedNotes.size === 0) return;
                    
                    const count = window.selectedNotes.size;
                    const msg = count > 1 ? `確定要永久刪除這 ${count} 個點子嗎？` : "確定要永久刪除？";

                    // 🌟 關鍵修復：先將要刪除的 ID 存下來，避免點擊確認視窗時觸發「點擊空白處取消選取」的防呆機制，導致名單被清空
                    const notesToDelete = Array.from(window.selectedNotes);

                    showCustomConfirm("刪除點子", msg, "確認刪除", "bg-rose-500", async () => {
                        const activeQId = window.currentSpaceData?.currentQuestionData?.id || qId;
                        const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                        
                        // 批次標記刪除並移除 DOM，使用剛才備份的名單
                        notesToDelete.forEach(noteId => {
                            currentMods[noteId] = { ...currentMods[noteId], deleted: true };
                            document.getElementById('note-' + noteId)?.remove();
                        });
                        
                        document.getElementById('board-note-menu')?.classList.add('hidden');
                        window.selectedNotes.clear();
                        window.currentActiveNoteId = null;
                        
                        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods });
                    });
                };

                // 1. 綁定原本的垃圾桶按鈕
                document.getElementById('btn-bm-delete').addEventListener('click', deleteSelectedNotes);

                // 2. ✨ 新增：鍵盤 Delete / Backspace 刪除支援
                if (window.boardKeydownHandler) {
                    document.removeEventListener('keydown', window.boardKeydownHandler);
                }
                window.boardKeydownHandler = (e) => {
                    // 若按下的不是 Delete 或 Backspace，不處理
                    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
                    
                    // 確保白板正在畫面上
                    if (!document.getElementById('board-wrapper-main')) return;

                    // 防呆 1：若焦點在輸入框內，讓使用者正常刪除文字，不觸發便利貼刪除
                    const activeEl = document.activeElement;
                    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;
                    
                    // 防呆 2：若有跳出的對話框 (如確認刪除視窗、編輯視窗)，避免誤觸連刪
                    if (document.getElementById('live-confirm-modal') || document.getElementById('live-board-prompt')) return;

                    deleteSelectedNotes();
                };
                document.addEventListener('keydown', window.boardKeydownHandler);

                // 3. ✨ 新增：白板的專屬 Copy (複製) 事件
                if (window.boardCopyHandler) document.removeEventListener('copy', window.boardCopyHandler);
                window.boardCopyHandler = (e) => {
                    if (!document.getElementById('board-wrapper-main')) return;
                    
                    // 若焦點在輸入框內，或有反白文字，交給瀏覽器原生處理
                    const activeEl = document.activeElement;
                    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;
                    if (window.getSelection().toString().length > 0) return; 

                    if (window.selectedNotes && window.selectedNotes.size > 0) {
                        e.preventDefault(); // 攔截預設複製
                        const texts = Array.from(window.selectedNotes).map(id => {
                            const note = document.getElementById('note-' + id);
                            return note ? note.querySelector('.note-text-content').textContent : '';
                        }).filter(t => t);
                        
                        if (texts.length > 0) {
                            e.clipboardData.setData('text/plain', texts.join('\n'));
                            if (typeof showToast === 'function') showToast(`✅ 已複製 ${texts.length} 個點子`);
                        }
                    }
                };
                document.addEventListener('copy', window.boardCopyHandler);

                // 4. ✨ 新增：白板的專屬 Paste (智慧貼上) 事件
                if (window.boardPasteHandler) document.removeEventListener('paste', window.boardPasteHandler);
                window.boardPasteHandler = async (e) => {
                    if (!document.getElementById('board-wrapper-main')) return;
                    
                    // 若焦點在輸入框內，交給瀏覽器原生處理
                    const activeEl = document.activeElement;
                    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;

                    const rawText = (e.originalEvent || e).clipboardData.getData('text/plain');
                    if (!rawText) return;

                    e.preventDefault(); // 攔截預設貼上
                    
                    // 消除跨平台與 Excel 複製帶來的雜訊與尾部空行
                    let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd();
                    if (text.includes('\n\n') && text.split('\n\n').join('').indexOf('\n') === -1) {
                        text = text.replace(/\n\n/g, '\n');
                    }

                    if (text.includes('\n')) {
                        // 🌟 情境 A：包含多行 -> 開啟新增視窗，讓使用者有機會編修
                        if (typeof window.addTeacherNote === 'function') window.addTeacherNote(text);
                    } else {
                        // 🌟 情境 B：單行文字 -> 直接在畫面正中央建立一張便利貼
                        const activeQId = window.currentSpaceData?.currentQuestionData?.id || qId;
                        const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                        
                        const colors = ['yellow', 'pink', 'blue', 'green'];
                        const c = colors[Math.floor(Math.random() * colors.length)];
                        
                        // 計算出目前畫布視野的正中央
                        const canvas = document.getElementById('whiteboard-canvas');
                        const cRect = canvas.getBoundingClientRect();
                        const centerX = (cRect.width / 2 - window.boardPan.x) / window.boardZoom;
                        const centerY = (cRect.height / 2 - window.boardPan.y) / window.boardZoom;
                        
                        const noteId = 'teacher_' + Date.now() + '_0';
                        
                        let allZs = Object.values(currentMods).map(m => m.z || 10);
                        let maxZ = allZs.length > 0 ? Math.max(...allZs) : 10;
                        
                        currentMods[noteId] = { 
                            isTeacher: true, 
                            text: text, 
                            color: c, 
                            x: centerX - 70, 
                            y: centerY - 70, 
                            author: '老師',
                            z: maxZ + 1
                        };

                        // ✨ 自動選取新貼上的物件
                        if (window.selectedNotes) {
                            window.selectedNotes.clear();
                            window.selectedNotes.add(noteId);
                            window.currentActiveNoteId = noteId;
                            document.getElementById('board-note-menu')?.classList.add('hidden');
                            document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1'));
                        }
                        
                        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods });
                        if (typeof showToast === 'function') showToast('✅ 已貼上新點子');
                    }
                };
                document.addEventListener('paste', window.boardPasteHandler);

                document.getElementById('btn-bm-edit').addEventListener('click', () => {
                    const noteId = window.currentActiveNoteId;
                    const noteEl = document.getElementById('note-' + noteId);
                    if (!noteEl) return;
                    
                    const currentText = noteEl.querySelector('.note-text-content').textContent;
                    const currentColor = noteEl.dataset.color || 'yellow';

                    document.getElementById('board-note-menu').classList.add('hidden');
                    
                    if (typeof showBoardPrompt === 'function') {
                        // 🌟 新增：將刪除與圖層邏輯打包傳入
                        const activeQId = window.currentSpaceData?.currentQuestionData?.id || qId;
                        const extraOpts = {
                            onDelete: () => {
                                showCustomConfirm("刪除點子", "確定要永久刪除？", "確認刪除", "bg-rose-500", async () => {
                                    const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                                    currentMods[noteId] = { ...currentMods[noteId], deleted: true };
                                    document.getElementById('note-' + noteId)?.remove();
                                    await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods });
                                });
                            },
                            onLayer: async (action) => {
                                const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                                const currentZ = currentMods[noteId]?.z !== undefined ? currentMods[noteId].z : 10;
                                let newZ = currentZ;
                                let allZs = allNotes.map(n => {
                                    const m = currentMods[n.id] || {};
                                    return m.z !== undefined ? m.z : 10;
                                });
                                if (action === 'top') newZ = Math.max(...allZs, 10) + 1;
                                else if (action === 'bottom') newZ = Math.min(...allZs, 10) - 1;
                                else if (action === 'up') newZ = currentZ + 1;
                                else if (action === 'down') newZ = currentZ - 1;
                                currentMods[noteId] = { ...currentMods[noteId], z: newZ };
                                await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods });
                            }
                        };

                        showBoardPrompt("編輯", currentText, currentColor, async (result) => {
                            if (result && result.text) {
                                const activeQId = window.currentSpaceData?.currentQuestionData?.id || qId;
                                const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                                
                                // ✨ 依據是否勾選批次新增來切分陣列
                                const texts = result.isBatch ? result.text.split('\n').map(t => t.trim()).filter(t => t) : [result.text];
                                if (texts.length === 0) return;

                                let colorBag = [];
                                const getRandomColor = () => {
                                    if (colorBag.length === 0) colorBag = ['yellow', 'pink', 'blue', 'green'].sort(() => Math.random() - 0.5);
                                    return colorBag.pop();
                                };

                                // 1. 更新原本的第一張便利貼
                                const firstColor = result.color === 'random' ? getRandomColor() : result.color;
                                currentMods[noteId] = { ...currentMods[noteId], text: texts[0], color: firstColor };
                                
                                // 樂觀更新 UI
                                noteEl.querySelector('.note-text-content').textContent = texts[0];
                                noteEl.dataset.color = firstColor;
                                const bodyEl = noteEl.querySelector('.note-body');
                                if (bodyEl) {
                                    bodyEl.className = `note-body relative shadow-sm rounded-sm border transition-shadow group-hover:shadow-lg ${colorMap[firstColor] || colorMap['yellow']}`;
                                    bodyEl.setAttribute('data-first-char', (texts[0] || '').trim().charAt(0) || '');
                                }

                                // 2. 如果有換行拆解出多張，產生新的便利貼
                                if (texts.length > 1) {
                                    const origX = parseFloat(noteEl.style.left) || 100;
                                    const origY = parseFloat(noteEl.style.top) || 100;
                                    const origAuthor = noteEl.dataset.author || '老師';
                                    const baseZ = currentMods[noteId].z !== undefined ? currentMods[noteId].z : 10;

                                    for (let i = 1; i < texts.length; i++) {
                                        const newNoteId = 'split_' + Date.now() + '_' + i;
                                        const c = result.color === 'random' ? getRandomColor() : result.color;
                                        
                                        currentMods[newNoteId] = { 
                                            isTeacher: true, 
                                            text: texts[i], 
                                            color: c, 
                                            x: origX + (i % 5) * 30, 
                                            y: origY + Math.floor(i / 5) * 30 + 30, 
                                            author: origAuthor,
                                            z: baseZ + i
                                        };
                                    }
                                }

                                await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods });
                            }
                        }, extraOpts);
                    }
                });

                // ✨ 升級：支援多選批次改色與轉文字
                document.querySelectorAll('.bm-color-dot').forEach(dot => {
                    dot.addEventListener('click', async (e) => {
                        e.stopPropagation(); // 防止點擊穿透導致選單關閉
                        const newColor = e.currentTarget.dataset.color;
                        const activeQId = window.currentSpaceData?.currentQuestionData?.id || qId;
                        const currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};
                        
                        if (!window.selectedNotes || window.selectedNotes.size === 0) return;

                        window.selectedNotes.forEach(noteId => {
                            currentMods[noteId] = { ...currentMods[noteId], color: newColor };
                            
                            const noteEl = document.getElementById('note-' + noteId);
                            if (noteEl) {
                                noteEl.dataset.color = newColor;
                                const bodyEl = noteEl.querySelector('.note-body');
                                if (bodyEl) {
                                    const isText = newColor === 'text';
                                    noteEl.classList.toggle('is-text-mode', isText);
                                    const shadowCls = isText ? '' : 'shadow-sm rounded-sm border group-hover:shadow-lg';
                                    bodyEl.className = `note-body relative transition-shadow ${shadowCls} ${colorMap[newColor] || colorMap['yellow']}`;
                                    
                                    const textContent = noteEl.querySelector('.note-text-content');
                                    if (textContent) {
                                        if (isText) { textContent.classList.add('text-left', 'font-extrabold', 'text-lg'); textContent.classList.remove('text-center'); }
                                        else { textContent.classList.remove('text-left', 'font-extrabold', 'text-lg'); textContent.classList.add('text-center'); }
                                    }
                                    const foldBtn = noteEl.querySelector('.btn-fold-note');
                                    if (foldBtn) foldBtn.style.display = isText ? 'none' : '';

                                    if (isText) {
                                        bodyEl.style.height = 'auto';
                                        if (!bodyEl.style.width || bodyEl.style.width === '140px') {
                                            bodyEl.style.width = 'max-content';
                                            bodyEl.style.maxWidth = '300px';
                                        }
                                    } else {
                                        const sizeMode = noteEl.getAttribute('data-size') || 'fixed';
                                        if (sizeMode !== 'resize') {
                                            bodyEl.style.width = '';
                                            bodyEl.style.height = '';
                                            bodyEl.style.maxWidth = '';
                                        }
                                    }
                                }
                            }
                        });

                        await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods });
                    });
                });

            }

            const contentLayer = document.getElementById('board-content-layer');
            if (!contentLayer) return;

            allNotes.forEach((note, index) => {
                let noteEl = document.getElementById('note-' + note.id);
                const mod = boardMods[note.id] || {};
                const startX = mod.x !== undefined ? mod.x : 100 + ((index % 6) * 160);
                const startY = mod.y !== undefined ? mod.y : 100 + (Math.floor(index / 6) * 160);

                if (!noteEl) {
                    noteEl = document.createElement('div');
                    noteEl.id = 'note-' + note.id;
                    
                    const sizeMode = qData.options?.[5] || 'fixed';
                    // 為了向下相容舊資料 (true/false) 所做的轉換
                    const rawShowAuthor = qData.options?.[2] || 'none';
                    const mappedShowAuthor = rawShowAuthor === 'true' ? 'always' : (rawShowAuthor === 'false' ? 'none' : rawShowAuthor);
                    
                    noteEl.setAttribute('data-size', sizeMode);
                    noteEl.setAttribute('data-show-author', mappedShowAuthor);
                    
                    const isCollapsedInit = mod.collapsed ? 'is-collapsed' : '';
                    noteEl.className = `sticky-note absolute cursor-pointer group ${isCollapsedInit}`;
                    noteEl.dataset.id = note.id;
                    noteEl.dataset.author = note.author;
                    
                    const isText = note.color === 'text';
                    const shadowCls = isText ? '' : 'shadow-sm rounded-sm border group-hover:shadow-lg';
                    
                    noteEl.innerHTML = `
                        <div class="note-body relative transition-shadow ${shadowCls} ${colorMap[note.color] || colorMap['yellow']}">
                            <div class="absolute inset-0 note-scroll flex flex-col p-2 cursor-grab active:cursor-grabbing">
                                <div class="text-sm font-normal break-words select-none leading-relaxed note-text-content ${isText ? 'text-left font-extrabold text-lg' : 'text-center'} w-full scalable-text whitespace-pre-wrap pb-1 shrink-0"></div>
                            </div>
                            <div class="resize-handle"></div>
                            <div class="resize-handle-right" title="調整寬度"></div>
                            <div class="btn-fold-note" title="收合/展開" style="${isText ? 'display:none;' : ''}"></div>
                        </div>
                        
                        <div class="absolute -bottom-2 -left-2 px-2 py-0.5 bg-slate-500 text-white text-[10px] font-normal rounded shadow-sm transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[100] note-author-container">
                            <span class="note-author-content"></span>
                        </div>
                    `;
                    contentLayer.appendChild(noteEl);
                }
                
                if (noteEl.style.cursor !== 'grabbing' && noteEl !== window.currentResizedNote) {
                    noteEl.style.left = startX + 'px';
                    noteEl.style.top = startY + 'px';
                    noteEl.dataset.author = note.author;
                    noteEl.dataset.color = note.color;
                    
                    const isText = note.color === 'text';
                    noteEl.classList.toggle('is-text-mode', isText); // 同步給外層標記

                    const sizeMode = qData.options?.[5] || 'fixed';
                    noteEl.setAttribute('data-size', sizeMode);
                    
                    const z = mod.z !== undefined ? mod.z : 10;
                    noteEl.style.zIndex = z;
                    
                    const isSelected = window.selectedNotes && window.selectedNotes.has(note.id);
                    const isCollapsedInit = mod.collapsed ? 'is-collapsed' : '';
                    
                    // ✨ 修復：確保摺疊狀態 (is-collapsed) 被正確保留
                    noteEl.className = `sticky-note absolute cursor-pointer group ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1 rounded-sm' : ''} ${isText ? 'is-text-mode' : ''} ${isCollapsedInit}`;
                    
                    const bodyEl = noteEl.querySelector('.note-body');
                    if (bodyEl) {
                        const shadowCls = isText ? '' : 'shadow-sm rounded-sm border group-hover:shadow-lg';
                        bodyEl.className = `note-body relative transition-shadow ${shadowCls} ${colorMap[note.color] || colorMap['yellow']}`;
                        const firstChar = (note.text || '').trim().charAt(0) || '';
                        bodyEl.setAttribute('data-first-char', firstChar);

                        // 動態切換文字對齊與樣式
                        const textContent = noteEl.querySelector('.note-text-content');
                        if (textContent) {
                            if (isText) {
                                textContent.classList.add('text-left', 'font-extrabold', 'text-lg');
                                textContent.classList.remove('text-center');
                            } else {
                                textContent.classList.remove('text-left', 'font-extrabold', 'text-lg');
                                textContent.classList.add('text-center');
                            }
                        }
                        const foldBtn = noteEl.querySelector('.btn-fold-note');
                        if (foldBtn) foldBtn.style.display = isText ? 'none' : '';

                        // ✨ 尺寸模式與純文字的動態尺寸引擎
                        if (isText) {
                            bodyEl.style.height = 'auto'; // 高度自適應
                            if (mod.w) {
                                bodyEl.style.width = mod.w + 'px';
                                bodyEl.style.maxWidth = 'none';
                            } else {
                                bodyEl.style.width = 'max-content';
                                bodyEl.style.maxWidth = '300px'; // 預設最大寬度 300px
                            }
                        } else {
                            if (sizeMode === 'resize') {
                                if (mod.w) bodyEl.style.width = mod.w + 'px';
                                if (mod.h) bodyEl.style.height = mod.h + 'px';
                                bodyEl.style.maxWidth = 'none';
                            } else {
                                bodyEl.style.width = '';
                                bodyEl.style.height = '';
                                bodyEl.style.maxWidth = '';
                            }
                        }
                    }

                    noteEl.querySelector('.note-text-content').textContent = note.text;
                    noteEl.querySelector('.note-author-content').textContent = note.author;
                }
            });

            const activeNoteIds = allNotes.map(n => n.id);
            if (contentLayer) {
                contentLayer.querySelectorAll('.sticky-note').forEach(noteEl => {
                    if (!activeNoteIds.includes(noteEl.dataset.id)) {
                        noteEl.remove();
                    }
                });
            }

            if (!window.boardHasInitiallyFocused) {
                window.boardHasInitiallyFocused = true;
                setTimeout(() => {
                    if (typeof window.resetBoardView === 'function') {
                        window.resetBoardView();
                    }
                }, 100);
            }

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

        if(typeof window.applyLiveDisplayPrefs === 'function') window.applyLiveDisplayPrefs();
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
        window.boardHasInitiallyFocused = false;

        const displayCode = spaceCode.substring(0, 2) + ' ' + spaceCode.substring(2);
        let isResultsHidden = false; 

        liveContainer.innerHTML = getLiveQrModalHtml(spaceCode) + `
            <div class="w-full h-full flex bg-[#f8f9fa] font-sans select-none overflow-hidden relative">
                
                <div id="live-mobile-sidebar-backdrop" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[6000] opacity-0 pointer-events-none transition-opacity duration-300 md:hidden"></div>

                <div id="live-sidebar-wrapper" class="bg-gray-50 border-r border-gray-200 flex flex-col h-full flex-shrink-0 z-[6010] animate-width relative overflow-hidden" style="width: ${window.isLiveSidebarOpen && window.innerWidth > 768 ? window.liveSidebarWidth + 'px' : '0px'}">
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
                    

                    <div class="w-full px-2 sm:px-3 py-1.5 sm:py-2 flex justify-between items-center bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] z-[5100] gap-2 border-b border-gray-200 flex-shrink-0 flex-wrap relative">
                        
                        <div class="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            <button id="btn-toggle-sidebar" class="text-gray-500 hover:text-teal-600 hover:bg-teal-50 p-1.5 rounded-lg transition-colors cursor-pointer ${window.isLiveSidebarOpen ? 'bg-teal-50 text-teal-600' : ''}" title="收合/展開側欄">
                                <span class="material-symbols-outlined text-[20px] sm:text-[24px]">menu</span>
                            </button>
                            
                            <div class="flex items-stretch bg-gray-50 border border-gray-200 rounded-md transition hover:bg-gray-100">
                                <div class="text-gray-700 font-bold text-xs sm:text-sm flex items-center gap-1 px-1.5 sm:px-2 py-1 cursor-pointer border-r border-gray-200" onclick="document.getElementById('live-qr-modal')?.classList.remove('hidden')" title="顯示 QR Code">
                                    <span class="hidden sm:inline text-gray-500">代碼:</span>
                                    <span class="text-[14px] sm:text-lg tracking-widest font-black text-teal-700">${displayCode}</span>
                                </div>
                                <button id="btn-copy-code-link" class="text-gray-400 hover:text-teal-600 px-1.5 flex items-center justify-center cursor-pointer transition-colors" title="複製邀請網址">
                                    <span class="material-symbols-outlined text-[16px] sm:text-[18px]">content_copy</span>
                                </button>
                            </div>

                            <div class="font-bold text-teal-700 text-[11px] sm:text-sm flex items-center bg-teal-50 border border-teal-100 px-2 py-1 rounded-full whitespace-nowrap">
                                <span class="hidden sm:inline">已收</span><span class="sm:hidden">收</span> <span id="response-count-display" class="font-black ml-1">0</span>
                            </div>
                            
                            <!-- ✨ 新增：置頂的語文工具按鈕 (點擊觸發) -->
                            <div class="relative flex-shrink-0 z-[200] ml-1 sm:ml-2">
                                <button id="btn-global-lang-toggle" onmousedown="event.preventDefault();" class="bg-gray-50 hover:bg-teal-50 text-gray-400 hover:text-teal-600 p-1 sm:p-1.5 rounded-lg transition-colors cursor-pointer flex items-center border border-gray-200" title="語文工具">
                                    <span class="material-symbols-outlined text-[18px] sm:text-[20px]">language</span>
                                </button>
                                <div id="global-lang-submenu" class="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden flex-col gap-1 bg-white border border-gray-200 shadow-xl rounded-xl p-1.5 w-max">
                                    <button onclick="event.preventDefault(); event.stopPropagation(); document.getElementById('btn-toggle-translator').click(); document.getElementById('global-lang-submenu').classList.add('hidden');" class="flex items-center gap-2 px-3 py-2 hover:bg-teal-50 text-teal-700 rounded-lg text-sm transition-colors font-bold" title="開啟翻譯系統視窗">
                                        <span class="material-symbols-outlined text-[18px]">translate</span> 翻譯系統
                                    </button>
                                    <button onclick="event.preventDefault(); event.stopPropagation(); document.getElementById('btnOpenPinyinTool').click(); document.getElementById('global-lang-submenu').classList.add('hidden');" class="flex items-center gap-2 px-3 py-2 hover:bg-teal-50 text-teal-700 rounded-lg text-sm transition-colors font-bold" title="開啟拼音轉換視窗">
                                        <span class="material-symbols-outlined text-[18px]">rotate_auto</span> 拼音轉換
                                    </button>
                                    <button class="ime-toggle-button flex items-center gap-2 px-3 py-2 hover:bg-teal-50 text-gray-700 hover:text-teal-700 rounded-lg text-sm transition-colors font-bold !justify-start" title="啟用或關閉烏衣行輸入法">
                                        <span class="material-symbols-outlined text-[18px] pointer-events-none" style="font-variation-settings: 'FILL' 0;">keyboard</span> <span class="pointer-events-none">烏衣行輸入法</span>
                                    </button>
                                    
                                    <div class="h-px bg-gray-100 my-0.5 mx-2 md:hidden"></div>
                                    <button onclick="event.preventDefault(); event.stopPropagation(); document.getElementById('btnToggleKeyboardMobile').click(); document.getElementById('global-lang-submenu').classList.add('hidden');" class="flex items-center justify-between gap-2 px-3 py-2 hover:bg-teal-50 text-teal-700 rounded-lg text-sm transition-colors font-bold md:hidden" title="開啟或關閉手機系統鍵盤">
                                        <div class="flex items-center gap-2"><span class="material-symbols-outlined text-[18px]">keyboard_off</span> 開關手機鍵盤</div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        ${currentQIndex >= 0 ? `
                        <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">                        

                            <button id="btn-toggle-pause" class="bg-gray-50 hover:bg-amber-50 text-gray-600 hover:text-amber-700 p-1.5 sm:px-3 sm:py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-gray-200 hover:border-amber-200" onclick="window.toggleLivePause()" title="暫停/開放">
                                <span class="material-symbols-outlined text-[18px]">pause</span> <span class="hidden lg:inline text-sm font-bold">暫停收件</span>
                            </button>
                            <button id="btn-toggle-results" class="bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 p-1.5 sm:px-3 sm:py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-gray-200 hover:border-indigo-200" title="隱藏/顯示結果">
                                <span class="material-symbols-outlined text-[18px]">visibility_off</span> <span class="hidden lg:inline text-sm font-bold">隱藏結果</span>
                            </button>
                            
                            <div class="flex items-center gap-0.5 sm:gap-1 bg-gray-50 rounded-lg p-0.5 border border-gray-200 ml-1 sm:ml-0">
                                <button id="btn-prev-live" class="text-gray-500 hover:text-teal-600 hover:bg-teal-50 p-1 rounded transition-colors cursor-pointer disabled:opacity-30" ${currentQIndex === 0 ? 'disabled' : ''}>
                                    <span class="material-symbols-outlined text-[18px] sm:text-[20px]">chevron_left</span>
                                </button>
                                <span class="text-gray-600 font-bold text-[11px] sm:text-sm min-w-[2rem] text-center select-none">${currentQIndex + 1}/${liveData.length}</span>
                                <button id="btn-next-live" class="text-gray-500 hover:text-teal-600 hover:bg-teal-50 p-1 rounded transition-colors cursor-pointer disabled:opacity-30" ${currentQIndex === liveData.length - 1 ? 'disabled' : ''}>
                                    <span class="material-symbols-outlined text-[18px] sm:text-[20px]">chevron_right</span>
                                </button>
                            </div>
							<button id="btn-live-settings" class="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-2 py-1.5 transition-colors cursor-pointer mr-0 sm:mr-1 shrink-0" title="互動設定">
                                <span class="material-symbols-outlined text-[18px] text-gray-500">settings</span>
                            </button>
                        </div>
                        ` : `<div></div>`}
                    </div>

                    ${currentQIndex >= 0 ? (() => {
                        const prefs = JSON.parse(localStorage.getItem('live_display_prefs') || '{"q":"base", "c":"base"}');
                        return `
                        <div id="live-settings-menu" class="hidden absolute top-14 right-2 sm:right-10 w-72 max-h-[85vh] bg-white border border-gray-200 rounded-xl shadow-2xl z-[5100] flex-col overflow-hidden">
                            
                            <div class="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
                                <div class="p-4 bg-gray-50/50 flex-shrink-0">
                                    <span class="text-xs font-extrabold text-teal-800 mb-3 flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">text_fields</span> 顯示設定 (僅限本機)</span>
                                    
                                    <div class="flex items-center justify-between mb-2.5">
                                        <span class="text-[11px] font-bold text-gray-500">題目大小</span>
                                        <div class="flex bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                                            <button class="btn-font-scale px-3 py-1 hover:bg-gray-50 text-gray-600 font-bold text-xs border-r border-gray-200 ${prefs.q === 'base' ? 'bg-teal-50 text-teal-700' : ''}" data-target="q" data-val="base">本</button>
                                            <button class="btn-font-scale px-3 py-1 hover:bg-gray-50 text-gray-600 font-bold text-xs border-r border-gray-200 ${prefs.q === 'md' ? 'bg-teal-50 text-teal-700' : ''}" data-target="q" data-val="md">中</button>
                                            <button class="btn-font-scale px-3 py-1 hover:bg-gray-50 text-gray-600 font-bold text-xs border-r border-gray-200 ${prefs.q === 'lg' ? 'bg-teal-50 text-teal-700' : ''}" data-target="q" data-val="lg">大</button>
                                            <button class="btn-font-scale px-3 py-1 hover:bg-gray-50 text-gray-600 font-bold text-xs ${prefs.q === 'xl' ? 'bg-teal-50 text-teal-700' : ''}" data-target="q" data-val="xl">巨</button>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center justify-between">
                                        <span class="text-[11px] font-bold text-gray-500">內容大小</span>
                                        <div class="flex bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                                            <button class="btn-font-scale px-3 py-1 hover:bg-gray-50 text-gray-600 font-bold text-xs border-r border-gray-200 ${prefs.c === 'base' ? 'bg-teal-50 text-teal-700' : ''}" data-target="c" data-val="base">本</button>
                                            <button class="btn-font-scale px-3 py-1 hover:bg-gray-50 text-gray-600 font-bold text-xs border-r border-gray-200 ${prefs.c === 'md' ? 'bg-teal-50 text-teal-700' : ''}" data-target="c" data-val="md">中</button>
                                            <button class="btn-font-scale px-3 py-1 hover:bg-gray-50 text-gray-600 font-bold text-xs border-r border-gray-200 ${prefs.c === 'lg' ? 'bg-teal-50 text-teal-700' : ''}" data-target="c" data-val="lg">大</button>
                                            <button class="btn-font-scale px-3 py-1 hover:bg-gray-50 text-gray-600 font-bold text-xs ${prefs.c === 'xl' ? 'bg-teal-50 text-teal-700' : ''}" data-target="c" data-val="xl">巨</button>
                                        </div>
                                    </div>
                                </div>

                                ${['文字', '問答', '白板'].includes(qData.type) ? `
                                <div class="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                                    <span class="text-xs font-extrabold text-teal-800 mb-3 flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">rule</span> 參與規則 (針對此題)</span>
                                    
                                    <div>
                                        <span class="text-[11px] font-bold text-gray-400 mb-1.5 block">每人次數上限</span>
                                        <div class="flex gap-1" id="live-limit-btns">
                                            ${[1, 2, 3, 0].map(v => `<button class="flex-1 py-1.5 rounded text-xs font-bold border transition-colors ${parseQuestionLimit(qData)===v ? 'bg-teal-50 border-teal-500 text-teal-700 active-limit' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}" data-val="${v}">${v===0?'不限':v}</button>`).join('')}
                                        </div>
                                    </div>
                                    ${qData.type === '文字' ? `
                                    <div class="flex items-center justify-between pt-3 mt-2 border-t border-gray-100">
                                        <span class="text-[11px] font-bold text-gray-400">允許重複詞</span>
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id="live-allow-dup" class="sr-only peer" ${qData.options && qData.options[1] === 'true' ? 'checked' : ''}>
                                            <div class="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-500"></div>
                                        </label>
                                    </div>
                                    ` : ''}
                                    ${qData.type === '白板' ? `
                                    <div class="flex flex-col gap-3 pt-3 mt-2 border-t border-gray-100">
                                        <div class="flex items-center justify-between pt-1">
                                            <span class="text-[11px] font-bold text-gray-400">顯示便利貼作者</span>
                                            <select id="live-show-author" class="bg-gray-50 border border-gray-200 text-gray-700 text-[11px] rounded px-2 py-1 outline-none focus:border-teal-400">
                                                <option value="none" ${(!qData.options || qData.options[2] === 'none' || qData.options[2] === 'false') ? 'selected' : ''}>不顯示 (預設)</option>
                                                <option value="hover" ${qData.options && qData.options[2] === 'hover' ? 'selected' : ''}>選取顯示</option>
                                                <option value="always" ${qData.options && (qData.options[2] === 'always' || qData.options[2] === 'true') ? 'selected' : ''}>一律顯示</option>
                                            </select>
                                        </div>
                                        <div class="flex items-center justify-between pt-1">
                                            <span class="text-[11px] font-bold text-gray-400">顯示便利貼工具</span>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" id="live-show-toolbar" class="sr-only peer" ${qData.options && qData.options[3] === 'true' ? 'checked' : ''}>
                                                <div class="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-500"></div>
                                            </label>
                                        </div>
                                        <div class="flex items-center justify-between pt-1">
                                            <span class="text-[11px] font-bold text-gray-400">雙擊便利貼動作</span>
                                            <select id="live-dblclick-action" class="bg-gray-50 border border-gray-200 text-gray-700 text-[11px] rounded px-2 py-1 outline-none focus:border-teal-400">
                                                <option value="edit" ${(!qData.options || qData.options[4] !== 'stick') ? 'selected' : ''}>編輯內容 (預設)</option>
                                                <option value="stick" ${qData.options && qData.options[4] === 'stick' ? 'selected' : ''}>隨游標黏貼</option>
                                            </select>
                                        </div>
                                        <div class="flex items-center justify-between pt-1">
                                            <span class="text-[11px] font-bold text-gray-400">便利貼尺寸模式</span>
                                            <select id="live-size-mode" class="bg-gray-50 border border-gray-200 text-gray-700 text-[11px] rounded px-2 py-1 outline-none focus:border-teal-400">
                                                <option value="fixed" ${(!qData.options || qData.options[5] === 'fixed') ? 'selected' : ''}>固定尺寸 (140x140)</option>
                                                <option value="auto" ${qData.options && qData.options[5] === 'auto' ? 'selected' : ''}>自動貼合 (緊湊)</option>
                                                <option value="resize" ${qData.options && qData.options[5] === 'resize' ? 'selected' : ''}>手動調整 (自由拉伸)</option>
                                            </select>
                                        </div>
                                        <div class="flex items-center justify-between pt-1">
                                            <span class="text-[11px] font-bold text-gray-400">畫布背景</span>
                                            <select id="live-board-bg" class="bg-gray-50 border border-gray-200 text-gray-700 text-[11px] rounded px-2 py-1 outline-none focus:border-teal-400">
                                                <option value="dots" ${(!qData.options || qData.options[6] === 'dots' || !['solid', 'grid'].includes(qData.options[6])) ? 'selected' : ''}>點狀網格 (預設)</option>
                                                <option value="grid" ${qData.options && qData.options[6] === 'grid' ? 'selected' : ''}>線條網格 (Miro風)</option>
                                                <option value="solid" ${qData.options && qData.options[6] === 'solid' ? 'selected' : ''}>純色背景</option>
                                            </select>
                                        </div>
                                        <!-- ✨ 新增：貼齊格線選項 -->
                                        <div class="flex items-center justify-between pt-1">
                                            <span class="text-[11px] font-bold text-gray-400">貼齊格線 (Snap to Grid)</span>
                                            <label class="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" id="live-snap-grid" class="sr-only peer" ${qData.options && qData.options[7] === 'true' ? 'checked' : ''}>
                                                <div class="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-500"></div>
                                            </label>
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>
                                ` : ''}
                            </div>
                            
                            <!-- 底部按鈕區 (固定在最下方不跟隨滾動) -->
                            <div class="p-3 border-t border-gray-100 bg-gray-50/50 mt-auto flex-shrink-0 z-10">
                                <button id="btn-clear-results" class="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-rose-50 text-rose-500 font-bold border border-rose-200 rounded-lg px-3 py-2 transition-colors cursor-pointer text-xs shadow-sm">
                                    <span class="material-symbols-outlined text-[16px]">delete_sweep</span> 清除所有作答紀錄
                                </button>
                            </div>
                            
                        </div>
                        `;
                    })() : ''}
                    
                    ${currentQIndex >= 0 ? `
                        <div class="w-full max-w-[1000px] mx-auto px-4 sm:px-6 mt-3 sm:mt-4 flex-shrink-0 select-text" id="live-question-header">
                             <div class="w-full bg-white px-4 py-3 sm:py-4 rounded-[1rem] shadow-sm text-center border-t-4 border-teal-500 flex flex-col items-center justify-center min-h-[6vh]">
                                 <h2 class="text-lg md:text-xl font-extrabold text-gray-800 leading-snug break-words max-w-full select-text scalable-q-text">
                                    <span class="inline-block align-middle text-[11px] font-black bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full mr-2 border border-teal-100 transform -translate-y-0.5 select-none">${qData.type}</span>
                                    ${escapeHtml(qData.question)}
                                 </h2>
                             </div>
                        </div>
                        <div class="w-full max-w-[1000px] mx-auto px-4 sm:px-6 flex-1 flex flex-col min-h-0 z-20 transition-opacity duration-300 pb-4 sm:pb-6 mt-2 select-text" id="live-content-area"></div>
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
        const mobileBackdrop = document.getElementById('live-mobile-sidebar-backdrop');

        // ✨ 3. 智慧側邊欄狀態切換引擎
        const applySidebarState = () => {
            if (window.isLiveSidebarOpen) {
                sidebar.classList.remove('collapsed');
                sidebar.style.width = window.innerWidth > 768 ? window.liveSidebarWidth + 'px' : '280px';
                btnToggleSidebar?.classList.add('bg-teal-50', 'text-teal-600');
                if (window.innerWidth <= 768 && mobileBackdrop) {
                    mobileBackdrop.classList.remove('opacity-0', 'pointer-events-none');
                }
            } else {
                sidebar.classList.add('collapsed');
                sidebar.style.width = '0px';
                btnToggleSidebar?.classList.remove('bg-teal-50', 'text-teal-600');
                if (mobileBackdrop) {
                    mobileBackdrop.classList.add('opacity-0', 'pointer-events-none');
                }
            }
        };

        if (btnToggleSidebar && sidebar) {
            btnToggleSidebar.addEventListener('click', () => {
                window.isLiveSidebarOpen = !window.isLiveSidebarOpen;
                applySidebarState();
            });
        }
        
        // 點擊暗色遮罩自動收合 (僅限手機)
        if (mobileBackdrop) {
            mobileBackdrop.addEventListener('click', () => {
                window.isLiveSidebarOpen = false;
                applySidebarState();
            });
        }

        // 偵測螢幕翻轉或調整大小時，重置遮罩狀態
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && mobileBackdrop) {
                 mobileBackdrop.classList.add('opacity-0', 'pointer-events-none');
                 if (window.isLiveSidebarOpen && sidebar) {
                     sidebar.style.width = window.liveSidebarWidth + 'px';
                 }
            }
        });

        // 初始化狀態
        if (window.innerWidth <= 768) window.isLiveSidebarOpen = false;
        applySidebarState();

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

        // ✨ 全域套用顯示設定的函數
        window.applyLiveDisplayPrefs = () => {
            const prefs = JSON.parse(localStorage.getItem('live_display_prefs') || '{"q":"base", "c":"base"}');
            const qHeader = document.getElementById('live-question-header');
            const cArea = document.getElementById('live-content-area');
            const boardHeader = document.getElementById('board-floating-header');
            
            if (qHeader) qHeader.setAttribute('data-font-size', prefs.q);
            if (boardHeader) boardHeader.parentElement.setAttribute('data-font-size', prefs.q);
            if (cArea) cArea.setAttribute('data-font-size', prefs.c);
        };

        // 【新的程式碼】
        // ✨ 語文工具選單開關邏輯 (修復事件重複綁定問題)
        const btnLangToggle = document.getElementById('btn-global-lang-toggle');
        const langSubmenu = document.getElementById('global-lang-submenu');
        if (btnLangToggle && langSubmenu) {
            btnLangToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                langSubmenu.classList.toggle('hidden');
                langSubmenu.classList.toggle('flex');
            });
            
            // 使用全域標記，確保這個監聽器在整個生命週期中只綁定一次
            if (!window._liveLangMenuHandler) {
                window._liveLangMenuHandler = (e) => {
                    // 動態重新抓取 DOM，確保切換題目後仍能抓到最新的選單元素
                    const currentSubmenu = document.getElementById('global-lang-submenu');
                    const currentBtn = document.getElementById('btn-global-lang-toggle');
                    if (currentSubmenu && currentBtn && !currentSubmenu.contains(e.target) && e.target !== currentBtn) {
                        currentSubmenu.classList.add('hidden');
                        currentSubmenu.classList.remove('flex');
                    }
                };
                document.addEventListener('click', window._liveLangMenuHandler);
            }
        }

        // ✨ 確保上方工具列的新按鈕能順利綁定輸入法功能
        if (typeof bindImeToggles === 'function') 
		setTimeout(bindImeToggles, 100);

        const btnSettings = document.getElementById('btn-live-settings');
        const settingsMenu = document.getElementById('live-settings-menu');
        if (btnSettings && settingsMenu) {
            btnSettings.addEventListener('click', (e) => {
                e.stopPropagation();
                settingsMenu.classList.toggle('hidden');
                settingsMenu.classList.toggle('flex');
            });
            document.addEventListener('click', (e) => {
                if (!settingsMenu.contains(e.target) && e.target !== btnSettings) {
                    settingsMenu.classList.add('hidden');
                    settingsMenu.classList.remove('flex');
                }
            });

            // 引擎 A：處理字體大小切換 (即時預覽)
            settingsMenu.querySelectorAll('.btn-font-scale').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const target = e.target.dataset.target; 
                    const val = e.target.dataset.val; 
                    
                    let prefs = JSON.parse(localStorage.getItem('live_display_prefs') || '{"q":"base", "c":"base"}');
                    prefs[target] = val;
                    localStorage.setItem('live_display_prefs', JSON.stringify(prefs));
                    
                    settingsMenu.querySelectorAll(`.btn-font-scale[data-target="${target}"]`).forEach(b => b.classList.remove('bg-teal-50', 'text-teal-700'));
                    e.target.classList.add('bg-teal-50', 'text-teal-700');
                    
                    window.applyLiveDisplayPrefs();
                });
            });

            // 引擎 B：處理作答限制設定 (同步回 Firebase)
            const updateSettings = async () => {
                const newLimit = settingsMenu.querySelector('.active-limit')?.dataset.val || '1';
                const allowDup = settingsMenu.querySelector('#live-allow-dup')?.checked ? 'true' : 'false';
                
                // ✨ 抓取所有最新設定
                const showAuthor = settingsMenu.querySelector('#live-show-author') ? settingsMenu.querySelector('#live-show-author').value : (qData.options?.[2] || 'none');
                const showToolbar = settingsMenu.querySelector('#live-show-toolbar') ? (settingsMenu.querySelector('#live-show-toolbar').checked ? 'true' : 'false') : (qData.options?.[3] || 'false');
                const dblClickAction = settingsMenu.querySelector('#live-dblclick-action') ? settingsMenu.querySelector('#live-dblclick-action').value : (qData.options?.[4] || 'edit');
                const sizeMode = settingsMenu.querySelector('#live-size-mode') ? settingsMenu.querySelector('#live-size-mode').value : (qData.options?.[5] || 'fixed');
                const bgMode = settingsMenu.querySelector('#live-board-bg') ? settingsMenu.querySelector('#live-board-bg').value : (qData.options?.[6] || 'dots');
                // 🌟 新增抓取「貼齊格線」狀態
                const snapGrid = settingsMenu.querySelector('#live-snap-grid') ? (settingsMenu.querySelector('#live-snap-grid').checked ? 'true' : 'false') : (qData.options?.[7] || 'false');

                const newOptions = [newLimit, allowDup, showAuthor, showToolbar, dblClickAction, sizeMode, bgMode, snapGrid];
                
                // 1. 更新本機變數
                qData.options = newOptions;
                if (currentQIndex >= 0) liveData[currentQIndex].options = newOptions;

                // 2. ✨ 樂觀更新：立即套用到所有畫面上已存在的便利貼 (尺寸與作者顯示)
                document.querySelectorAll('.sticky-note').forEach(el => {
                    el.setAttribute('data-size', sizeMode);
                    el.setAttribute('data-show-author', showAuthor);
                });
                
                // ✨ 樂觀更新背景：移除舊有靜態賦值，直接呼叫 updateBoardView
                const canvasEl = document.getElementById('whiteboard-canvas');
                if (canvasEl) {
                    canvasEl.classList.remove('bg-[radial-gradient(#D5D5D5_1px,transparent_1px)]'); // 相容清理舊版樣式
                }
                window.updateBoardView();
                
                // 3. 強制執行一次渲染更新，確保其他細節 (如工具列狀態) 同步
                updateTeacherCharts(); 

                syncLiveDataToEditor(); 
                
                // 4. 非同步同步到資料庫
                await db.collection(window.SPACES_COLLECTION).doc(spaceCode).update({ currentQuestionData: qData });
                showToast('✅ 規則已即時更新');
            };

            settingsMenu.querySelectorAll('#live-limit-btns button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    settingsMenu.querySelectorAll('#live-limit-btns button').forEach(b => b.className = 'flex-1 py-1.5 rounded text-xs font-bold border bg-white border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors');
                    e.target.className = 'flex-1 py-1.5 rounded text-xs font-bold border bg-teal-50 border-teal-500 text-teal-700 active-limit transition-colors';
                    updateSettings();
                });
            });
            document.getElementById('live-allow-dup')?.addEventListener('change', updateSettings);
            document.getElementById('live-show-author')?.addEventListener('change', updateSettings);
            document.getElementById('live-show-toolbar')?.addEventListener('change', updateSettings);
            document.getElementById('live-dblclick-action')?.addEventListener('change', updateSettings);
            document.getElementById('live-size-mode')?.addEventListener('change', updateSettings);
			document.getElementById('live-board-bg')?.addEventListener('change', updateSettings);
            document.getElementById('live-snap-grid')?.addEventListener('change', updateSettings);
        }

        // 初始化套用文字大小
        window.applyLiveDisplayPrefs();

        if (typeof bindImeToggles === 'function') setTimeout(bindImeToggles, 100);

        document.getElementById('btn-clear-results')?.addEventListener('click', async () => {
            const settingsMenu = document.getElementById('live-settings-menu');
            if (settingsMenu) {
                settingsMenu.classList.add('hidden');
                settingsMenu.classList.remove('flex');
            }
            
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
                        [`qa_upvotes_${qId}`]: firebase.firestore.FieldValue.delete(),
                        [`board_${qId}`]: firebase.firestore.FieldValue.delete()
                    });
                    count++;
                    if (count % 400 === 0) { batch.commit(); batch = db.batch(); }
                });

                const spaceRef = db.collection(window.SPACES_COLLECTION).doc(spaceCode);
                batch.update(spaceRef, { 
                    focusedQ: null, 
                    archivedQs: [], 
                    visitedQs: firebase.firestore.FieldValue.arrayRemove(qId),
                    [`board_mods_${qId}`]: firebase.firestore.FieldValue.delete()
                }); 
                
                if (qData.type === '白板') {
                    document.querySelectorAll('.sticky-note').forEach(el => el.remove());
                    const menu = document.getElementById('board-note-menu');
                    if (menu) {
                        menu.classList.add('hidden');
                        menu.classList.remove('flex');
                    }
                }

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
                        <textarea id="live-board-input" class="w-full bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 text-base font-normal text-gray-700 outline-none focus:border-yellow-400 transition-colors resize-none" rows="2" placeholder="寫下你的點子..."></textarea>
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
                                    <span class="text-sm font-bold text-gray-700 whitespace-pre-wrap block">${escapeHtml(n.text)}</span>
                                </div>
                            `).join('') : '<div class="text-center text-gray-300 py-4 font-bold">尚未貼出</div>'}
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
                        <span class="text-sm font-bold text-gray-800 leading-snug select-text scalable-text">${escapeHtml(q.text)}</span>
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
                    <span class="text-sm font-bold text-gray-700 whitespace-pre-wrap block">${escapeHtml(n.text)}</span>
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
                    <p class="text-lg text-teal-200 font-bold">謝謝你參與！</p>
                </div>
            </div>
            ${getFloatingReactionHtml()}
            ${getStudentProfileBadge()}
        `;
        bindFloatingReactionBar(spaceCode, playerName);
    }

    initLiveRouter();
};