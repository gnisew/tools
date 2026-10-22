// =================================================================
// 白板引擎模組 (board.js)
// 提供 Live 互動問答與「烏衣行 白板」共用的便利貼白板。
// 資料存取一律透過 ctx (adapter)，引擎本身不直接碰 Firestore。
//
// ctx = {
//   qData, qId,                 // 題目資料 (options 控制外觀與行為) 與 id
//   contentArea, headerArea, countDisplay,   // 掛載點 (headerArea / countDisplay 可為 null)
//   getPlayers(),               // 回傳學生清單 (本機白板回傳 [])
//   getMods(id),                // 取得該白板的便利貼修改表 {noteId: {x,y,z,w,h,text,color,collapsed,deleted,isTeacher...}}
//   saveMods(id, mods),         // 儲存修改表，須回傳 Promise
//   getCurrentQ()               // 目前題目資料 (讀取即時設定用)
// }
// =================================================================
(function () {
    if (window.WB) return;

    function escapeHtml(unsafe) {
        return (unsafe || '').toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
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
                    <h3 class="text-lg font-extrabold text-gray-800 select-none pl-1 whitespace-nowrap shrink-0 mr-2">${title}</h3>
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

    // ---- 白板 / 便利貼共用樣式 ----
    if (!document.getElementById('wb-styles')) {
        const style = document.createElement('style');
        style.id = 'wb-styles';
        style.innerHTML = `
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }

            /* 📱 [新增] 手機版：左側工具列 / 比例工具列 收合成圖示 (桌面版完全不受影響) */
            #board-left-fab, #board-zoom-fab { display: none; }
            /* 🍎 [新增] iOS：避免長按跳出選單、點擊出現灰色閃爍 */
            #whiteboard-canvas { -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
            @media (max-width: 768px) {
                #whiteboard-canvas { --wb-fab-bottom: calc(env(safe-area-inset-bottom, 0px) + 12px); } /* 圖示離底部的距離，想調高低改這裡 */
                #board-left-fab, #board-zoom-fab {
                    display: flex; align-items: center; justify-content: center;
                    position: absolute; bottom: var(--wb-fab-bottom);
                    width: 40px; height: 40px; border-radius: 9999px;
                    background: rgba(255,255,255,0.95); color: #6b7280;
                    border: 1px solid #e5e7eb; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    z-index: 121; cursor: pointer; user-select: none;
                }
                #board-left-fab { left: 12px; }
                #board-zoom-fab { right: 12px; }
                #board-left-fab.wb-open, #board-zoom-fab.wb-open { background: #f0fdfa; color: #0d9488; }
                /* 收合時若啟用了「多選 / 純檢視」模式，圖示右上角顯示小圓點提醒 */
                #board-left-fab.wb-has-mode::after {
                    content: ''; position: absolute; top: 5px; right: 5px; width: 9px; height: 9px;
                    border-radius: 9999px; background: #f59e0b; border: 1.5px solid #fff;
                }
                /* 展開後：左側工具列改貼在左下角圖示的上方；比例工具列貼在右下角圖示的左側 */
                #board-left-toolbar { top: auto !important; bottom: calc(var(--wb-fab-bottom) + 48px) !important; left: 12px !important; transform: none !important; }
                #board-zoom-toolbar { bottom: calc(var(--wb-fab-bottom) + 2px) !important; right: 60px !important; }
                #board-left-toolbar.wb-collapsed, #board-zoom-toolbar.wb-collapsed { display: none !important; }
                #board-settings-panel { max-width: calc(100vw - 6rem); }
            }

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

    // ---- 白板引擎：建立畫布(僅第一次)並渲染所有便利貼 ----
    function renderBoard(ctx) {
        const { qData, qId, contentArea, headerArea, countDisplay } = ctx;
        let activeResponsesCount = 0;

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

            const boardMods = ctx.getMods(qId);
            let allNotes = [];
            
            ctx.getPlayers().forEach(p => {
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

                            <!-- 📱 [新增] 手機版收合圖示 (桌面版以 CSS 隱藏) -->
                            <button id="board-left-fab" type="button" title="工具列" onclick="window.toggleBoardLeftToolbar()"><span class="material-symbols-outlined text-[22px]">dashboard_customize</span></button>
                            <button id="board-zoom-fab" type="button" title="縮放" onclick="window.toggleBoardZoomBar()"><span class="material-symbols-outlined text-[22px]">zoom_in</span></button>

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

                // 📱 [新增] 手機版：工具列收合 / 展開 (預設收合)
                window.isBoardLeftToolbarOpen = false;
                window.isBoardZoomBarOpen = false;
                window.applyBoardToolbarState = () => {
                    const lt = document.getElementById('board-left-toolbar');
                    const zt = document.getElementById('board-zoom-toolbar');
                    const lf = document.getElementById('board-left-fab');
                    const zf = document.getElementById('board-zoom-fab');
                    if (lt) lt.classList.toggle('wb-collapsed', !window.isBoardLeftToolbarOpen);
                    if (zt) zt.classList.toggle('wb-collapsed', !window.isBoardZoomBarOpen);
                    if (lf) {
                        lf.classList.toggle('wb-open', window.isBoardLeftToolbarOpen);
                        lf.classList.toggle('wb-has-mode', !window.isBoardLeftToolbarOpen && !!(window.isBoardPanMode || window.isBoardMultiSelectMode));
                        lf.firstElementChild.textContent = window.isBoardLeftToolbarOpen ? 'close' : 'dashboard_customize';
                    }
                    if (zf) {
                        zf.classList.toggle('wb-open', window.isBoardZoomBarOpen);
                        zf.firstElementChild.textContent = window.isBoardZoomBarOpen ? 'close' : 'zoom_in';
                    }
                };
                window.toggleBoardLeftToolbar = (force) => {
                    window.isBoardLeftToolbarOpen = (typeof force === 'boolean') ? force : !window.isBoardLeftToolbarOpen;
                    if (!window.isBoardLeftToolbarOpen) document.dispatchEvent(new Event('board-left-toolbar-closed')); // 通知白板設定面板一起關閉
                    window.applyBoardToolbarState();
                };
                window.toggleBoardZoomBar = (force) => {
                    window.isBoardZoomBarOpen = (typeof force === 'boolean') ? force : !window.isBoardZoomBarOpen;
                    window.applyBoardToolbarState();
                };
                // 點工具列按鈕後：同步「模式小圓點」；手機版按下「新增文字 / 新增便利貼 / 清空」這類一次性動作就自動收合
                document.getElementById('board-left-toolbar')?.addEventListener('click', (e) => {
                    setTimeout(() => window.applyBoardToolbarState(), 0);
                    const btn = e.target.closest('button');
                    if (!btn || !window.matchMedia('(max-width: 768px)').matches) return;
                    if (/addTeacher|clearBoardNotes/.test(btn.getAttribute('onclick') || '')) window.toggleBoardLeftToolbar(false);
                }, true);
                window.applyBoardToolbarState();

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
                        const title = "新增";
                        showBoardPrompt(title, initText, defaultColor, async (result) => {
                            if (result && result.text) {
                                const currentMods = ctx.getMods(qId);
                                
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

                                await ctx.saveMods(qId, currentMods);
                            }
                        });
                    }
                };
				window.addTeacherText = (defaultText = "") => {
                    if (typeof window.addTeacherNote === 'function') window.addTeacherNote(defaultText, "text");
                };

                window.clearBoardNotes = () => {
                    showCustomConfirm("清除畫布", "確定要清空白板上所有的便利貼嗎？", "全部清除", "bg-rose-500", async () => {
                        const currentMods = ctx.getMods(qId);
                        
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

                        await ctx.saveMods(qId, currentMods);
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
                        
                        // ✨ 新增：自訂背景圖片（固定鋪滿畫布，不隨平移/縮放移動）
                        const wbBg = window.WB && window.WB.bg;
                        const imgBg = wbBg ? wbBg.resolve(currentBgMode) : null;
                        if (imgBg) {
                            if (canvas._bgCss !== imgBg) { canvas.style.backgroundImage = imgBg; canvas._bgCss = imgBg; }
                            canvas.style.backgroundRepeat = 'no-repeat';
                            // ✨ 新增：設定「背景圖跟著白板移動」時，圖片以原始尺寸放在白板原點，隨平移/縮放移動
                            const dim = qData.options?.[9] === 'true' ? wbBg.getSize(wbBg.resolveSrc(currentBgMode)) : null;
                            if (dim) {
                                canvas.style.backgroundSize = `${dim.w * window.boardZoom}px ${dim.h * window.boardZoom}px`;
                                canvas.style.backgroundPosition = `${window.boardPan.x}px ${window.boardPan.y}px`;
                            } else {
                                canvas.style.backgroundSize = 'cover';
                                canvas.style.backgroundPosition = 'center';
                            }
                        } else {
                        canvas._bgCss = null;
                        canvas.style.backgroundRepeat = 'repeat'; // ✨ 新增：從圖片切回網格時還原重複

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

                    // 🛠️ [新增] 新的按下代表上一次拖曳必定已結束 (pointerup 可能遺失)，先強制收尾，避免狀態殘留
                    forceEndBoardDrag();
                    
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
                        const activeQId = ctx.getCurrentQ()?.id || qId;
                        const currentMods = ctx.getMods(activeQId);
                        
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
                        ctx.saveMods(activeQId, currentMods).catch(()=>{});
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

                // 🛠️ [新增] 目前是否有任何「按住滑鼠才會進行」的互動 (平移 / 框選 / 拖曳便利貼 / 調整尺寸)
                const isBoardBusy = () => isPanning || isMarquee || !!draggedNote || isResizingNote;

                // 🛠️ [新增] 強制結束所有拖曳狀態 (pointerup 遺失時的保險)
                const forceEndBoardDrag = () => {
                    if (!isBoardBusy()) return;
                    onDocPointerUp({ type: 'pointercancel', pointerId: undefined, clientX: startPos.x, clientY: startPos.y, target: canvas });
                };

                // 🛠️ [新增] 畫布已被換掉 (renderBoard 重新執行) 且閒置時，自動移除舊的全域監聽，避免累積
                const detachIfStale = () => {
                    if (canvas.isConnected || isBoardBusy()) return false;
                    document.removeEventListener('pointermove', onDocPointerMove);
                    document.removeEventListener('pointerup', onDocPointerUp);
                    document.removeEventListener('pointercancel', onDocPointerUp);
                    window.removeEventListener('blur', forceEndBoardDrag);
                    return true;
                };

                const onDocPointerMove = (e) => {
                    if (detachIfStale()) return;
                    // 🛠️ [新增] 滑鼠/手寫筆已沒有按住任何鍵，卻仍在拖曳狀態 → pointerup 遺失，立刻收尾
                    if ((e.pointerType === 'mouse' || e.pointerType === 'pen') && e.buttons === 0 && isBoardBusy()) {
                        forceEndBoardDrag();
                        return;
                    }
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
                };
                document.addEventListener('pointermove', onDocPointerMove);

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

                // 📱 [新增] 觸控：雙指捏合縮放 (同時支援雙指拖曳平移)
                // 做法：在 window 捕獲階段先攔截觸控事件，雙指期間不讓下方的拖曳 / 框選 / 平移邏輯收到事件
                if (window.boardPinchHandlers) {
                    const h = window.boardPinchHandlers;
                    window.removeEventListener('pointerdown', h.down, true);
                    window.removeEventListener('pointermove', h.move, true);
                    window.removeEventListener('pointerup', h.up, true);
                    window.removeEventListener('pointercancel', h.up, true);
                }
                {
                    const pinchPts = new Map();      // 目前參與捏合的手指 id -> 座標
                    const suppressed = new Set();    // 已被捏合接管、後續事件都要攔截的手指 id
                    let pinch = null;                // 捏合起始狀態
                    let synthetic = false;           // 避免攔截到自己送出的假事件
                    const tapStart = new Map();      // 🍎 單指點擊起點 (用來自行偵測雙擊)
                    let lastTap = null;
                    const isUi = (t) => !!(t.closest && t.closest('button, #board-left-toolbar, #board-zoom-toolbar, #board-floating-header, #board-note-menu, .draggable-translator, #board-settings-panel'));

                    const startPinch = () => {
                        const [a, b] = Array.from(pinchPts.values());
                        const rect = canvas.getBoundingClientRect();
                        pinch = {
                            dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
                            midX: (a.x + b.x) / 2 - rect.left,
                            midY: (a.y + b.y) / 2 - rect.top,
                            zoom: window.boardZoom,
                            panX: window.boardPan.x,
                            panY: window.boardPan.y
                        };
                        // 關掉縮放動畫，手指才會跟手
                        const layer = document.getElementById('board-content-layer');
                        if (layer) layer.style.transition = 'none';
                        canvas.style.transition = 'none';
                        document.getElementById('board-note-menu')?.classList.add('hidden');
                    };

                    const doPinch = () => {
                        if (!pinch || pinchPts.size < 2) return;
                        const [a, b] = Array.from(pinchPts.values());
                        const rect = canvas.getBoundingClientRect();
                        const dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
                        const midX = (a.x + b.x) / 2 - rect.left;
                        const midY = (a.y + b.y) / 2 - rect.top;
                        const newZoom = Math.max(0.2, Math.min(3, pinch.zoom * dist / pinch.dist));
                        // 起始中點下的畫布座標，縮放後要跟著目前中點走 (縮放 + 雙指平移)
                        const wx = (pinch.midX - pinch.panX) / pinch.zoom;
                        const wy = (pinch.midY - pinch.panY) / pinch.zoom;
                        window.boardZoom = newZoom;
                        window.boardPan.x = midX - wx * newZoom;
                        window.boardPan.y = midY - wy * newZoom;
                        window.updateBoardView();
                    };

                    const down = (e) => {
                        if (synthetic || e.pointerType !== 'touch' || !canvas.contains(e.target) || isUi(e.target)) return;
                        if (pinchPts.size >= 2) { e.stopPropagation(); return; }   // 第三指以後一律忽略
                        if (pinchPts.size === 0) tapStart.set(e.pointerId, { x: e.clientX, y: e.clientY, t: Date.now() });
                        const firstId = pinchPts.size === 1 ? pinchPts.keys().next().value : null;
                        pinchPts.set(e.pointerId, { x: e.clientX, y: e.clientY });
                        if (pinchPts.size < 2) return;                              // 單指：照原本流程
                        // 第二指落下：先替第一指「結束」原本進行中的拖曳 / 框選 / 平移，再進入捏合
                        if (firstId !== null && !suppressed.has(firstId)) {
                            const p = pinchPts.get(firstId);
                            synthetic = true;
                            canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: firstId, pointerType: 'touch', clientX: p.x, clientY: p.y, bubbles: true }));
                            synthetic = false;
                        }
                        suppressed.add(firstId);
                        suppressed.add(e.pointerId);
                        startPinch();
                        e.stopPropagation();
                    };

                    const move = (e) => {
                        if (synthetic || e.pointerType !== 'touch') return;
                        if (pinchPts.has(e.pointerId)) {
                            pinchPts.set(e.pointerId, { x: e.clientX, y: e.clientY });
                            if (pinchPts.size === 2) doPinch();
                        }
                        if (suppressed.has(e.pointerId)) e.stopPropagation();       // 捏合期間(含鬆開一指後)不讓拖曳邏輯處理
                    };

                    const up = (e) => {
                        if (synthetic || e.pointerType !== 'touch') return;
                        const last = pinchPts.get(e.pointerId);
                        const st = tapStart.get(e.pointerId);
                        tapStart.delete(e.pointerId);
                        pinchPts.delete(e.pointerId);
                        if (pinchPts.size < 2) pinch = null;
                        if (suppressed.delete(e.pointerId)) { e.stopPropagation(); return; }   // 原本流程的狀態早已結束，這個放開事件不必再處理

                        // 🍎 iOS 可能送 pointercancel (例如系統手勢)，原本程式只處理 pointerup，會卡在拖曳中 → 補送一個 pointerup 收尾
                        if (e.type === 'pointercancel' && last) {
                            synthetic = true;
                            canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: e.pointerId, pointerType: 'touch', clientX: last.x, clientY: last.y, bubbles: true }));
                            synthetic = false;
                            return;
                        }

                        // 🍎 iOS 雙擊不一定會觸發 dblclick：自行偵測「兩次短點擊」，補送 dblclick (編輯便利貼用)
                        if (e.type === 'pointerup' && st && Date.now() - st.t < 300 && Math.hypot(e.clientX - st.x, e.clientY - st.y) < 10) {
                            const now = Date.now();
                            if (lastTap && now - lastTap.t < 400 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
                                lastTap = null;
                                window._wbFakeDblAt = now;
                                const x = e.clientX, y = e.clientY;
                                setTimeout(() => {   // 稍微延遲，避免 iOS 隨後補送的 click 點到剛彈出的視窗
                                    const target = document.elementFromPoint(x, y);
                                    if (target && canvas.contains(target)) target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
                                }, 80);
                            } else {
                                lastTap = { x: e.clientX, y: e.clientY, t: now };
                            }
                        }
                    };

                    // 🍎 iOS：封鎖 Safari 專有的 gesture 事件，避免整個網頁被捏合縮放
                    ['gesturestart', 'gesturechange', 'gestureend'].forEach(t => canvas.addEventListener(t, (ev) => ev.preventDefault()));
                    // 🍎 已自行補送過雙擊時，擋掉瀏覽器原生的 dblclick，避免同一次雙擊跳出兩次編輯視窗
                    canvas.addEventListener('dblclick', (ev) => {
                        if (ev.isTrusted && Date.now() - (window._wbFakeDblAt || 0) < 700) ev.stopImmediatePropagation();
                    }, true);

                    window.boardPinchHandlers = { down, move, up };
                    window.addEventListener('pointerdown', down, true);
                    window.addEventListener('pointermove', move, true);
                    window.addEventListener('pointerup', up, true);
                    window.addEventListener('pointercancel', up, true);
                }

                canvas.addEventListener('dblclick', (e) => {
                    // 🌟 新增：純檢視模式下禁止雙擊編輯
                    if (window.isBoardPanMode) return;

                    const note = e.target.closest('.sticky-note');
                    if (note && !e.target.closest('#board-note-menu')) {
                        if (note.classList.contains('is-collapsed')) return;
                        
                        const activeQId = ctx.getCurrentQ()?.id || qId;
                        const action = ctx.getCurrentQ()?.options?.[4] || 'edit';
                        
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
                                            const currentMods = ctx.getMods(activeQId);
                                            currentMods[noteId] = { ...currentMods[noteId], deleted: true };
                                            document.getElementById('note-' + noteId)?.remove();
                                            await ctx.saveMods(activeQId, currentMods);
                                        });
                                    },
                                    onLayer: async (action) => {
                                        const currentMods = ctx.getMods(activeQId);
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
                                        await ctx.saveMods(activeQId, currentMods);
                                    }
                                };

                                showBoardPrompt("編輯", currentText, currentColor, async (result) => {
                                    if (result && result.text) {
                                        const currentMods = ctx.getMods(activeQId);
                                        
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

                                        await ctx.saveMods(activeQId, currentMods);
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
                        const activeQId = ctx.getCurrentQ()?.id || qId;
                        const currentMods = ctx.getMods(activeQId);
                        
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
                        await ctx.saveMods(activeQId, currentMods);
                    });
                });

                // ✨ 圖層順序控制引擎 (升級支援多選一鍵移至頂層)
                document.querySelectorAll('.bm-layer-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation(); // ✨ 同樣防止穿透
                        const action = e.currentTarget.dataset.action;
                        const activeQId = ctx.getCurrentQ()?.id || qId;
                        const currentMods = ctx.getMods(activeQId);
                        
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
                        await ctx.saveMods(activeQId, currentMods);
                    });
                });

                // ===== 🌟 統一的選單渲染引擎 =====
                window.renderBoardSelectionMenu = () => {
                    const menu = document.getElementById('board-note-menu');
                    const activeQId = ctx.getCurrentQ()?.id || qId;
                    const showToolbar = ctx.getCurrentQ()?.options?.[3] === 'true';
                    if (!menu) return;

                    if (window.selectedNotes && window.selectedNotes.size > 0) {
                        let currentNoteId = window.currentActiveNoteId;
                        if (!currentNoteId || !window.selectedNotes.has(currentNoteId)) {
                            currentNoteId = Array.from(window.selectedNotes)[0];
                            window.currentActiveNoteId = currentNoteId;
                        }
                        
                        const currentNote = document.getElementById('note-' + currentNoteId);
                        if (!currentNote) return;

                        const currentMods = ctx.getMods(activeQId);
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

                const onDocPointerUp = async (e) => {
                    if (detachIfStale()) return;
                    const cancelled = e.type === 'pointercancel';                 // 🛠️ [新增] 取消 / 強制結束 (不是使用者真的「點一下」)
                    if (cancelled && !isBoardBusy()) return;                      // 🛠️ [新增] 沒在拖曳就不處理
                    // 🛠️ [新增] 安全釋放 pointer capture (pointerId 失效時不丟錯，避免狀態沒被清掉)
                    const safeRelease = (el) => {
                        try { if (el && e.pointerId !== undefined && typeof el.releasePointerCapture === 'function') el.releasePointerCapture(e.pointerId); } catch (_) {}
                    };
                    if (isResizingNote && resizedNote) {
                        const noteId = resizedNote.dataset.id;
                        const bodyEl = resizedNote.querySelector('.note-body');
                        resizedNote.style.zIndex = resizedNote.dataset.origZ || 10;
                        
                        const activeQId = ctx.getCurrentQ()?.id || qId;
                        const currentMods = ctx.getMods(activeQId);
                        
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
                        ctx.saveMods(activeQId, currentMods).catch(()=>{});
                        return;
                    }

                    if (draggedNote) {
                        const currentNote = draggedNote;
                        draggedNote = null;          // 🛠️ [修改] 先清除狀態，再做可能出錯的釋放
                        safeRelease(currentNote);    // 🛠️ [修改] 原本直接 releasePointerCapture，出錯會讓便利貼一直黏著游標

                        const activeQId = ctx.getCurrentQ()?.id || qId;
                        const noteId = currentNote.dataset.id;
                        const currentMods = ctx.getMods(activeQId);
                        const isCollapsed = currentMods[noteId]?.collapsed;
                        
                        const originalZ = currentMods[noteId]?.z !== undefined ? currentMods[noteId].z : 10;
                        currentNote.style.zIndex = originalZ;
                        draggedNote = null;
                        
                        if (!isDraggingNote && !cancelled) {   // 🛠️ [修改] 取消時不觸發摺疊
                            const fBtnClicked = currentNote._clickedFoldBtn;
                            if (fBtnClicked || isCollapsed) {
                                currentMods[noteId] = { ...currentMods[noteId], collapsed: !isCollapsed };
                                if (!isCollapsed) currentNote.classList.add('is-collapsed');
                                else currentNote.classList.remove('is-collapsed');
                                
                                document.getElementById('board-note-menu')?.classList.add('hidden');
                                document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1'));
                                try { await ctx.saveMods(activeQId, currentMods); } catch (err) {}
                                return;
                            }
                        }
                        
                        window.currentActiveNoteId = noteId;
                        if (typeof window.renderBoardSelectionMenu === 'function') window.renderBoardSelectionMenu();

                        // ✨ 將拖曳後的最新群組座標寫回資料庫
                        if (isDraggingNote) {
                            const modsToUpdate = ctx.getMods(activeQId);
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
                            try { await ctx.saveMods(activeQId, modsToUpdate); } catch (err) {}
                        }
                        return; // 結束拖曳便利貼流程
                    } 
                    
                    // ✨ 處理框選與平移的釋放邏輯
                    let wasMarquee = isMarquee;
                    if (isMarquee) {
                        isMarquee = false;
                        safeRelease(canvas);   // 🛠️ [修改] 改用安全釋放
                        
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
                        safeRelease(canvas);   // 🛠️ [修改] 改用安全釋放
                        canvas.style.cursor = 'default'; 

                        // ✨ 智慧判定：如果滑鼠放開時，位置跟按下去時幾乎一樣 (單純點擊而非拖曳平移)
                        if (!cancelled && Math.abs(e.clientX - startPos.x) < 5 && Math.abs(e.clientY - startPos.y) < 5) {   // 🛠️ [修改] 取消時不當成點擊
                            // 點擊空白處，取消所有選取！
                            document.getElementById('board-note-menu')?.classList.add('hidden');
                            document.getElementById('board-note-menu')?.classList.remove('flex');
                            document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1'));
                            window.selectedNotes.clear();
                            window.currentActiveNoteId = null;
                        }
                    } else if (!cancelled && !wasMarquee && !e.target.closest('.sticky-note') && !e.target.closest('#board-note-menu') && !e.target.closest('#board-left-toolbar') && !e.target.closest('#board-left-fab') && !e.target.closest('#board-zoom-fab') && !e.target.closest('.draggable-translator') && !e.target.closest('#global-lang-submenu') && !e.target.closest('#btn-global-lang-toggle')) {
                        // 防呆底線：其他情況下的空白處點擊清除選取
                        document.getElementById('board-note-menu')?.classList.add('hidden');
                        document.getElementById('board-note-menu')?.classList.remove('flex');
                        document.querySelectorAll('.sticky-note').forEach(n => n.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-1'));
                        window.selectedNotes.clear();
                        window.currentActiveNoteId = null;

                        // ✨ 觸發 selectionchange，通知翻譯工具取消選取狀態
                        document.dispatchEvent(new Event('selectionchange'));

                    }
                };
                document.addEventListener('pointerup', onDocPointerUp);
                // 🛠️ [新增] 以下事件都可能讓 pointerup 遺失，一律當成「放開」處理
                document.addEventListener('pointercancel', onDocPointerUp);        // 瀏覽器取消 (原生拖曳、系統手勢…)
                window.addEventListener('blur', forceEndBoardDrag);                // 切換視窗 / 分頁
                canvas.addEventListener('contextmenu', (e) => {                    // Mac Ctrl+點擊會在按下時跳出右鍵選單
                    if (isBoardBusy()) { e.preventDefault(); forceEndBoardDrag(); }
                });
                canvas.addEventListener('dragstart', (e) => {                      // 避免文字/圖片的原生拖曳打斷平移
                    if (isBoardBusy()) e.preventDefault();
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
                        const activeQId = ctx.getCurrentQ()?.id || qId;
                        const currentMods = ctx.getMods(activeQId);
                        
                        // 批次標記刪除並移除 DOM，使用剛才備份的名單
                        notesToDelete.forEach(noteId => {
                            currentMods[noteId] = { ...currentMods[noteId], deleted: true };
                            document.getElementById('note-' + noteId)?.remove();
                        });
                        
                        document.getElementById('board-note-menu')?.classList.add('hidden');
                        window.selectedNotes.clear();
                        window.currentActiveNoteId = null;
                        
                        await ctx.saveMods(activeQId, currentMods);
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
                        const activeQId = ctx.getCurrentQ()?.id || qId;
                        const currentMods = ctx.getMods(activeQId);
                        
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
                        
                        await ctx.saveMods(activeQId, currentMods);
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
                        const activeQId = ctx.getCurrentQ()?.id || qId;
                        const extraOpts = {
                            onDelete: () => {
                                showCustomConfirm("刪除點子", "確定要永久刪除？", "確認刪除", "bg-rose-500", async () => {
                                    const currentMods = ctx.getMods(activeQId);
                                    currentMods[noteId] = { ...currentMods[noteId], deleted: true };
                                    document.getElementById('note-' + noteId)?.remove();
                                    await ctx.saveMods(activeQId, currentMods);
                                });
                            },
                            onLayer: async (action) => {
                                const currentMods = ctx.getMods(activeQId);
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
                                await ctx.saveMods(activeQId, currentMods);
                            }
                        };

                        showBoardPrompt("編輯", currentText, currentColor, async (result) => {
                            if (result && result.text) {
                                const activeQId = ctx.getCurrentQ()?.id || qId;
                                const currentMods = ctx.getMods(activeQId);
                                
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

                                await ctx.saveMods(activeQId, currentMods);
                            }
                        }, extraOpts);
                    }
                });

                // ✨ 升級：支援多選批次改色與轉文字
                document.querySelectorAll('.bm-color-dot').forEach(dot => {
                    dot.addEventListener('click', async (e) => {
                        e.stopPropagation(); // 防止點擊穿透導致選單關閉
                        const newColor = e.currentTarget.dataset.color;
                        const activeQId = ctx.getCurrentQ()?.id || qId;
                        const currentMods = ctx.getMods(activeQId);
                        
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

                        await ctx.saveMods(activeQId, currentMods);
                    });
                });

            }

            const contentLayer = document.getElementById('board-content-layer');
            if (!contentLayer) return activeResponsesCount;

            allNotes.forEach((note, index) => {
                let noteEl = document.getElementById('note-' + note.id);
                const mod = boardMods[note.id] || {};
                const startX = mod.x !== undefined ? mod.x : (note.x !== undefined ? note.x : 100 + ((index % 6) * 160));
                const startY = mod.y !== undefined ? mod.y : (note.y !== undefined ? note.y : 100 + (Math.floor(index / 6) * 160));

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

        return activeResponsesCount;
    }

    window.WB = { escapeHtml, showCustomConfirm, showBoardPrompt, renderBoard };

    // ✨ 新增：白板自訂背景圖片
    //   PRESETS：在程式裡指定的背景圖，格式 ['代號', '選單顯示名稱', '圖片網址']
    //   上傳的圖片會縮小後以 dataURL 存在瀏覽器 localStorage（所有白板共用一張）
    window.WB.bg = {
        PRESETS: [
            // ['sky',   '藍天',   'images/bg-sky.jpg'],
            // ['paper', '紙張',   'https://example.com/paper.png'],
        ],
        UPLOAD_KEY: 'wesing-board-bg-upload',
        _up: undefined,
        _dims: {},
        getUpload() {
            if (this._up === undefined) {
                try { this._up = localStorage.getItem(this.UPLOAD_KEY) || ''; } catch (e) { this._up = ''; }
            }
            return this._up;
        },
        setUpload(dataUrl) {              // 回傳是否儲存成功
            try {
                if (dataUrl) localStorage.setItem(this.UPLOAD_KEY, dataUrl);
                else localStorage.removeItem(this.UPLOAD_KEY);
                this._up = dataUrl || '';
                this._dims = {};
                return true;
            } catch (e) { return false; }   // 容量不足
        },
        // 背景模式 → 圖片來源（網址或 dataURL）；不是圖片模式就回傳 ''
        resolveSrc(mode) {
            let src = '';
            if (mode === 'upload') src = this.getUpload();
            else if (typeof mode === 'string' && mode.startsWith('img:')) {
                const hit = this.PRESETS.find(p => 'img:' + p[0] === mode);
                if (hit) src = hit[2];
            }
            return src;
        },
        // 背景模式 → CSS 的 url(...)；不是圖片模式就回傳 null
        resolve(mode) {
            const src = this.resolveSrc(mode);
            return src ? 'url("' + src.replace(/"/g, '%22') + '")' : null;
        },
        // ✨ 新增：取得圖片原始尺寸（「跟著白板移動」模式用）；尚未載入完成回傳 null，載入後會自動重繪
        getSize(src) {
            if (!src) return null;
            if (this._dims[src]) return this._dims[src];
            if (this._dims[src] === undefined) {
                this._dims[src] = null;
                const im = new Image();
                im.onload = () => {
                    this._dims[src] = { w: im.naturalWidth || 1, h: im.naturalHeight || 1 };
                    if (typeof window.updateBoardView === 'function') window.updateBoardView();
                };
                im.onerror = () => { delete this._dims[src]; };
                im.src = src;
            }
            return null;
        }
    };
})();

// =================================================================
// 「烏衣行 白板」模式：工作表 ↔ 白板 (本機、不連線)
// 一張便利貼 = 工作表的一列。欄位以「欄位名稱」辨識，附加在原資料右側：
//   文字(原資料欄) | X | Y | 顏色 | 寬 | 高 | 圖層 | 收合
// 對外提供 (給 script.js 呼叫)：
//   renderBoardFromText(text)  工作表文字 → 白板
//   extractTextFromBoard()     白板 → 工作表文字
//   unmountBoardMode()         離開白板模式時卸載畫布
//   enterBoardMode()           選「白板」時的入口 (詢問用現有工作表或新空白工作表)
// =================================================================
(function () {
    const COLOR_LABEL = { yellow: '黃', pink: '粉', blue: '藍', green: '綠', white: '白', gray: '灰', text: '文字' };
    const COLOR_FROM = {};
    Object.entries(COLOR_LABEL).forEach(([key, label]) => { COLOR_FROM[key] = key; COLOR_FROM[label] = key; });

    const FIELD_NAME = { x: 'X', y: 'Y', color: '顏色', w: '寬', h: '高', z: '圖層', collapsed: '收合' };
    // 對應 Live 白板題的 options：[限制,允許重複,顯示作者,顯示工具列,雙擊動作,尺寸模式,背景,貼齊格線,學生畫布]
    const DEFAULT_OPTIONS = ['0', 'false', 'none', 'true', 'edit', 'resize', 'dots', 'false', 'true'];

    const S = { mounted: false, tab: null, cols: null, notes: {}, rows: {}, order: [], extra: [], seq: 0, qData: null, ctx: null };

    const currentTab = () => (typeof sheetTabs !== 'undefined' ? sheetTabs[activeSheetIndex] : null);
    const num = v => { const n = parseFloat(v); return isFinite(n) ? n : undefined; };
    const hasText = v => v != null && String(v).trim() !== '';

    // 找出(或補上)各欄位的位置；新增的欄位附加在資料最右側，並寫入欄位名稱
    function resolveCols(tab, width) {
        let names = Array.isArray(tab.colNames) ? tab.colNames.slice()
            : (typeof loadColNames === 'function' ? (loadColNames() || []).slice() : []);
        const meta = tab.board = tab.board || {};
        if (!Array.isArray(meta.options)) meta.options = DEFAULT_OPTIONS.slice();

        let text = meta.textName ? names.indexOf(meta.textName) : -1;
        if (text < 0) text = names.indexOf('文字');
        if (text < 0) text = 0;
        if (!names[text]) names[text] = '文字';
        meta.textName = names[text];

        const cols = { text };
        let next = Math.max(width, names.length, text + 1);
        Object.keys(FIELD_NAME).forEach(key => {
            let i = names.indexOf(FIELD_NAME[key]);
            if (i < 0) { i = next++; names[i] = FIELD_NAME[key]; }
            cols[key] = i;
        });
        for (let i = 0; i < names.length; i++) if (names[i] == null) names[i] = '';
        tab.colNames = names;
        return cols;
    }

    // 工作表文字 → 內部便利貼資料 (S.notes 的格式與 Live 的 board_mods 相同)
    function parseSheet(text) {
        const tab = currentTab();
        const grid = parseTSV(text || '');
        const width = grid.reduce((m, r) => Math.max(m, r.length), 1);
        const cols = resolveCols(tab, width);

        const headerRows = Math.min(tab.board.headerRows || 0, grid.length);
        Object.assign(S, { tab, cols, notes: {}, rows: {}, order: [], extra: [], seq: 0, head: grid.slice(0, headerRows).map(r => r.slice()) });
        let missing = 0;   // 沒有座標的便利貼，依序排成格狀
        grid.slice(headerRows).forEach(row => {
            if (!hasText(row[cols.text])) {
                if (row.some(hasText)) S.extra.push(row.slice());   // 沒有文字但有其他資料：原樣保留，不遺失
                return;
            }
            const id = 'row_' + (S.seq++);
            const mod = { isTeacher: true, author: '', text: String(row[cols.text]), color: COLOR_FROM[String(row[cols.color] || '').trim()] || 'yellow' };
            const x = num(row[cols.x]), y = num(row[cols.y]);
            if (x !== undefined && y !== undefined) { mod.x = x; mod.y = y; }
            else { mod.x = 100 + (missing % 6) * 160; mod.y = 100 + Math.floor(missing / 6) * 160; missing++; }
            const w = num(row[cols.w]), h = num(row[cols.h]), z = num(row[cols.z]);
            if (w !== undefined) mod.w = w;
            if (h !== undefined) mod.h = h;
            if (z !== undefined) mod.z = z;
            if (/^(1|true|是|y|yes)$/i.test(String(row[cols.collapsed] || '').trim())) mod.collapsed = true;
            S.notes[id] = mod;
            S.rows[id] = row.slice();
            S.order.push(id);
        });
        S.qData = { id: 'sheetboard', type: '白板', question: tab.name || '白板', options: tab.board.options };
    }

    // 內部便利貼資料 → 工作表文字
    function extractSheet() {
        if (!S.mounted || !S.tab) return null;
        const c = S.cols;
        const width = Math.max(...Object.values(c)) + 1;
        const seen = new Set(S.order);
        const ids = S.order.slice();
        Object.keys(S.notes).forEach(id => { if (!seen.has(id)) ids.push(id); });   // 在白板上新建的便利貼

        // 標題列原樣放在最上面；白板用的欄位若沒有標題就補上欄位名稱
        const out = (S.head || []).map(r => {
            const row = r.slice(); while (row.length < width) row.push('');
            Object.keys(FIELD_NAME).forEach(k => { if (!hasText(row[c[k]])) row[c[k]] = FIELD_NAME[k]; });
            return row;
        });
        S.order = [];
        ids.forEach(id => {
            const m = S.notes[id];
            if (!m || m.deleted || !m.isTeacher) return;
            S.order.push(id);
            const row = (S.rows[id] || []).slice();
            while (row.length < width) row.push('');
            row[c.text] = m.text || '';
            row[c.x] = m.x !== undefined ? String(Math.round(m.x)) : '';
            row[c.y] = m.y !== undefined ? String(Math.round(m.y)) : '';
            row[c.color] = COLOR_LABEL[m.color] || '黃';
            row[c.w] = m.w ? String(Math.round(m.w)) : '';
            row[c.h] = m.h ? String(Math.round(m.h)) : '';
            row[c.z] = m.z !== undefined ? String(Math.round(m.z)) : '';
            row[c.collapsed] = m.collapsed ? '1' : '';
            out.push(row);
        });
        S.extra.forEach(r => { const row = r.slice(); while (row.length < width) row.push(''); out.push(row); });
        return gridToTSV(out);
    }

    function render() {
        if (S.mounted && S.ctx) window.WB.renderBoard(S.ctx);
    }

    function markDirty() {
        if (typeof debouncedSaveHistory === 'function') debouncedSaveHistory();
    }

    function unmount() {
        const host = document.getElementById('boardModeContainer');
        if (host) host.innerHTML = '';
        document.getElementById('live-board-prompt')?.remove();
        document.getElementById('live-confirm-modal')?.remove();
        if (typeof closeSettings === 'function') closeSettings();
        document.body.classList.remove('board-mode-active');
        if (window.selectedNotes) window.selectedNotes.clear();
        S.mounted = false;
        S.ctx = null;
    }

    function mount(text) {
        const host = document.getElementById('boardModeContainer');
        if (!host) return;
        unmount();
        parseSheet(text);

        // 清掉別處(例如 Live)殘留的同 id 畫布，避免 getElementById 抓錯
        document.querySelectorAll('#whiteboard-canvas').forEach(el => { if (!host.contains(el)) el.closest('#board-wrapper-main')?.remove(); });

        host.innerHTML = '<div id="board-sheet-area" class="w-full flex-1 flex flex-col min-h-0 h-full relative"></div>';
        S.ctx = {
            qData: S.qData,
            qId: 'sheetboard',
            contentArea: host.firstElementChild,
            headerArea: null,
            countDisplay: null,
            getPlayers: () => [],
            getMods: () => S.notes,
            // 引擎改動便利貼後呼叫：更新資料、重繪、並交給既有的存檔/復原流程寫回工作表
            saveMods: async (id, mods) => {
                S.notes = mods;
                setTimeout(render, 0);
                markDirty();
            },
            getCurrentQ: () => S.qData
        };
        S.mounted = true;
        document.body.classList.add('board-mode-active');
        window.boardHasInitiallyFocused = false;   // 進入時自動縮放到看得到全部便利貼
        if (window.selectedNotes) window.selectedNotes.clear();
        render();
        decorateToolbar();
    }


    // ---- 白板專屬收尾：隱藏 Live 才有的橫幅，工具列加上「白板設定」 ----
    if (!document.getElementById('wb-sheet-styles')) {
        const st = document.createElement('style');
        st.id = 'wb-sheet-styles';
        st.textContent = [
            '#boardModeContainer #board-floating-header{display:none !important;}',
            // 白板模式：頂端工具列只留「模式切換」按鈕，浮在畫布左上角，其餘一律隱藏
            'body.board-mode-active #mainContainer{position:relative;}',
            // ✨ 新增：白板模式滿版——移除 body 內距，以及外層編輯區的圓角/邊框/陰影
            'body.board-mode-active{padding:0 !important;}',
            'body.board-mode-active .editor-wrapper{border-radius:0 !important;border:none !important;box-shadow:none !important;margin:0 !important;}',
            // 沿用原工具列的內距，所以按鈕左右位置和其他模式一致；上方再多留 0.5rem，不要貼著上緣
            'body.board-mode-active #mainToolbar{position:absolute !important;top:0.5rem;left:0;z-index:5100;background:transparent !important;margin:0 !important;width:auto;pointer-events:none;}',
            'body.board-mode-active #mainToolbar > #dd-viewMode{pointer-events:auto;}',
            'body.board-mode-active #mainToolbar > #dd-viewMode > .dropdown-btn{box-shadow:0 1px 5px rgba(0,0,0,0.15);}',
            'body.board-mode-active #mainToolbar > :not(#dd-viewMode){display:none !important;}'
        ].join('\n');
        document.head.appendChild(st);
    }

    const BG_OPTIONS   = [['dots', '點狀網格'], ['grid', '線條網格'], ['solid', '純色背景']];
    const SIZE_OPTIONS = [['fixed', '固定尺寸 (140x140)'], ['auto', '自動貼合 (緊湊)'], ['resize', '手動調整 (自由拉伸)']];
    const DBL_OPTIONS  = [['edit', '編輯內容'], ['stick', '隨游標黏貼']];

    // 改 options 後：立即套用到畫面、重繪、存進分頁資料 (options 與 tab.board.options 是同一個陣列)
    function applySetting(index, value) {
        S.qData.options[index] = value;
        if (index === 5) document.querySelectorAll('#boardModeContainer .sticky-note').forEach(el => el.setAttribute('data-size', value));
        if (typeof window.updateBoardView === 'function') window.updateBoardView();
        render();
        if (typeof saveAllTabsData === 'function') saveAllTabsData();
    }

    // 「第一列是標題」要重新解析：先用舊設定取出目前文字，再用新設定重新載入
    function setHeaderRow(on) {
        const text = extractSheet();
        S.tab.board.headerRows = on ? 1 : 0;
        mount(text);
        markDirty();
        toggleSettings();
    }

    let closeSettingsHandlers = null;
    function closeSettings() {
        document.getElementById('board-settings-panel')?.remove();
        if (closeSettingsHandlers) {
            document.removeEventListener('mousedown', closeSettingsHandlers.down, true);
            document.removeEventListener('keydown', closeSettingsHandlers.key);
            closeSettingsHandlers = null;
        }
    }

    // 📱 [新增] 左側工具列收合時，白板設定面板一併關閉
    document.addEventListener('board-left-toolbar-closed', closeSettings);

    function toggleSettings() {
        if (document.getElementById('board-settings-panel')) { closeSettings(); return; }
        const area = document.getElementById('board-sheet-area');
        if (!area || !S.mounted) return;
        const o = S.qData.options;
        const select = (id, list, cur) => `<select id="${id}" class="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded px-2 py-1 outline-none focus:border-amber-400">${list.map(([v, t]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
        const row = (label, ctrl) => `<div class="flex items-center justify-between gap-3"><span class="text-xs font-bold text-gray-600">${label}</span>${ctrl}</div>`;
        const check = (id, on) => `<input type="checkbox" id="${id}" class="w-4 h-4 cursor-pointer" ${on ? 'checked' : ''}>`;

        const panel = document.createElement('div');
        panel.id = 'board-settings-panel';
        panel.className = 'absolute left-20 sm:left-24 top-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-72 flex flex-col gap-2.5 select-none';
        panel.style.zIndex = '130';
        panel.innerHTML = `
            <div class="flex items-center gap-1.5 pb-1.5 border-b border-gray-100">
                <span class="material-symbols-outlined text-[18px] text-amber-500">tune</span>
                <span class="text-sm font-extrabold text-gray-800">白板設定</span>
            </div>
            ${row('畫布背景', select('wbs-bg', [...BG_OPTIONS, ...window.WB.bg.PRESETS.map(p => ['img:' + p[0], p[1]]), ['upload', '我的上傳圖片']], o[6] || 'dots'))}
            <div class="flex items-center justify-end gap-2 -mt-1.5">
                <button type="button" id="wbs-bg-upload" class="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded px-2 py-1 cursor-pointer">上傳背景圖片…</button>
                <button type="button" id="wbs-bg-clear" class="text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded px-2 py-1 cursor-pointer">清除上傳</button>
                <input type="file" id="wbs-bg-file" accept="image/*" class="hidden">
            </div>
            ${row('背景圖跟著白板移動 / 縮放', check('wbs-bg-follow', o[9] === 'true'))}
            ${row('便利貼尺寸', select('wbs-size', SIZE_OPTIONS, o[5] || 'resize'))}
            <div class="text-[11px] font-bold text-gray-400 -mt-1.5 leading-snug">「寬、高」欄位只在「手動調整」時使用</div>
            ${row('貼齊格線', check('wbs-snap', o[7] === 'true'))}
            ${row('便利貼點兩下', select('wbs-dbl', DBL_OPTIONS, o[4] === 'stick' ? 'stick' : 'edit'))}
            ${row('第一列是標題 (不顯示為便利貼)', check('wbs-header', (S.tab.board.headerRows || 0) > 0))}`;
        area.appendChild(panel);

        panel.querySelector('#wbs-bg').addEventListener('change', e => applySetting(6, e.target.value));

        // ✨ 新增：上傳背景圖片（縮小到最長邊 1920px、轉 JPEG，避免超出 localStorage 容量）
        const bgFile = panel.querySelector('#wbs-bg-file');
        const bgSelect = panel.querySelector('#wbs-bg');
        const toast = msg => { if (typeof showToast === 'function') showToast(msg); };
        panel.querySelector('#wbs-bg-upload').addEventListener('click', () => bgFile.click());
        bgFile.addEventListener('change', () => {
            const file = bgFile.files && bgFile.files[0];
            bgFile.value = '';
            if (!file) return;
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, 1920 / Math.max(img.width, img.height));
                const cv = document.createElement('canvas');
                cv.width = Math.round(img.width * scale);
                cv.height = Math.round(img.height * scale);
                cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                URL.revokeObjectURL(url);
                if (window.WB.bg.setUpload(cv.toDataURL('image/jpeg', 0.82))) {
                    bgSelect.value = 'upload';
                    applySetting(6, 'upload');
                    toast('✅ 已套用背景圖片');
                } else {
                    toast('⚠️ 圖片太大，瀏覽器儲存空間不足');
                }
            };
            img.onerror = () => { URL.revokeObjectURL(url); toast('⚠️ 無法讀取這個圖片'); };
            img.src = url;
        });
        panel.querySelector('#wbs-bg-clear').addEventListener('click', () => {
            window.WB.bg.setUpload('');
            if ((S.qData.options[6] || 'dots') === 'upload') { bgSelect.value = 'dots'; applySetting(6, 'dots'); }
            toast('已清除上傳的背景圖片');
        });
        panel.querySelector('#wbs-bg-follow').addEventListener('change', e => applySetting(9, e.target.checked ? 'true' : 'false'));
        panel.querySelector('#wbs-size').addEventListener('change', e => applySetting(5, e.target.value));
        panel.querySelector('#wbs-snap').addEventListener('change', e => applySetting(7, e.target.checked ? 'true' : 'false'));
        panel.querySelector('#wbs-dbl').addEventListener('change', e => applySetting(4, e.target.value));
        panel.querySelector('#wbs-header').addEventListener('change', e => setHeaderRow(e.target.checked));

        closeSettingsHandlers = {
            down: e => { if (!panel.contains(e.target) && !e.target.closest('#btn-board-settings')) closeSettings(); },
            key: e => { if (e.key === 'Escape') closeSettings(); }
        };
        document.addEventListener('mousedown', closeSettingsHandlers.down, true);
        document.addEventListener('keydown', closeSettingsHandlers.key);
    }

    // 引擎建好左側工具列後：改掉 Live 的措辭，加上「白板設定」按鈕 (放在「清空畫布」前面)
    function decorateToolbar() {
        const tb = document.getElementById('board-left-toolbar');
        if (!tb) return;
        tb.querySelectorAll('[title="新增老師便利貼"]').forEach(btn => { btn.title = '新增便利貼'; });
        // 復原：頂端工具列已隱藏，改放在左側工具列 (放在「白板設定」之前)
        if (!document.getElementById('btn-board-undo')) {
            const undo = document.createElement('button');
            undo.id = 'btn-board-undo';
            undo.className = 'p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 rounded-lg cursor-pointer transition-colors';
            undo.title = '復原 (Ctrl+Z)';
            undo.innerHTML = '<span class="material-symbols-outlined text-[20px] block">undo</span>';
            undo.addEventListener('click', () => { if (typeof triggerUndo === 'function') triggerUndo(); });
            tb.insertBefore(undo, tb.lastElementChild);
        }
        if (document.getElementById('btn-board-settings')) return;
        const btn = document.createElement('button');
        btn.id = 'btn-board-settings';
        btn.className = 'p-2 text-gray-500 hover:bg-amber-50 hover:text-amber-700 rounded-lg cursor-pointer transition-colors';
        btn.title = '白板設定';
        btn.innerHTML = '<span class="material-symbols-outlined text-[20px] block">tune</span>';
        btn.addEventListener('click', toggleSettings);
        tb.insertBefore(btn, tb.lastElementChild);
    }

    // ---- 進入白板模式的入口：詢問要用目前工作表資料，或新空白工作表 ----
    function showEntryDialog(opts) {
        document.getElementById('board-entry-modal')?.remove();
        const esc = window.WB.escapeHtml;
        const modal = document.createElement('div');
        modal.id = 'board-entry-modal';
        modal.className = 'fixed inset-0 flex items-center justify-center p-4';
        modal.style.cssText = 'z-index:6000;background:rgba(0,0,0,0.35);';
        modal.innerHTML = `
            <div class="relative bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl border border-gray-200 animate-fade-in-up">
                <button id="wb-entry-close" class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1" title="取消"><span class="material-symbols-outlined text-xl block">close</span></button>
                <div class="flex flex-col items-center gap-1 mb-4">
                    <span class="material-symbols-outlined text-4xl text-amber-500">sticky_note_2</span>
                    <h3 class="text-lg font-extrabold text-gray-800">烏衣行 白板</h3>
                    <p class="text-sm font-bold text-gray-400">要用哪份資料開始？</p>
                </div>
                <button id="wb-entry-use" class="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-colors cursor-pointer">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-3xl text-amber-600">table_chart</span>
                        <div>
                            <div class="font-extrabold text-gray-800">用目前工作表的資料</div>
                            <div class="text-xs font-bold text-gray-500 mt-0.5">「${esc(opts.sheetName)}」共 ${opts.rows} 列，每列變成一張便利貼</div>
                        </div>
                    </div>
                </button>
                <label class="flex items-center gap-2 mt-2 mb-3 pl-1 text-sm font-bold text-gray-600 cursor-pointer select-none">
                    <input type="checkbox" id="wb-entry-header" class="w-4 h-4 cursor-pointer"> 第一列是標題（不顯示為便利貼）
                </label>
                <button id="wb-entry-new" class="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 transition-colors cursor-pointer">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-3xl text-amber-600">note_add</span>
                        <div>
                            <div class="font-extrabold text-gray-800">新空白工作表</div>
                            <div class="text-xs font-bold text-gray-500 mt-0.5">另開一張空白工作表，從頭開始</div>
                        </div>
                    </div>
                </button>
            </div>`;
        document.body.appendChild(modal);

        const onKey = e => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
        const close = () => { document.removeEventListener('keydown', onKey); modal.remove(); };
        document.addEventListener('keydown', onKey);
        modal.addEventListener('mousedown', e => { if (e.target === modal) close(); });
        modal.querySelector('#wb-entry-close').addEventListener('click', close);
        modal.querySelector('#wb-entry-use').addEventListener('click', () => { const h = modal.querySelector('#wb-entry-header').checked; close(); opts.onUse(h); });
        modal.querySelector('#wb-entry-new').addEventListener('click', () => { close(); opts.onNew(); });
    }

    function enterBoardMode() {
        if (typeof currentMode !== 'undefined' && currentMode === 'board') return;
        if (typeof saveAllTabsData === 'function') saveAllTabsData();   // 先把畫面上的內容同步進分頁資料
        const tab = currentTab();
        const content = tab ? (tab.content || '') : '';
        // 已經是白板用過的工作表，或內容是空的：不必再問，直接進入
        if (!tab || tab.board || content.trim() === '') {
            switchMode('board');
            if (typeof saveAllTabsData === 'function') saveAllTabsData();
            return;
        }
        const rows = parseTSV(content).filter(r => r.some(hasText)).length;
        showEntryDialog({
            sheetName: tab.name || '工作表',
            rows,
            onUse(headerRow) {
                tab.board = tab.board || {};
                tab.board.headerRows = headerRow ? 1 : 0;
                switchMode('board');
                saveAllTabsData();
            },
            onNew() {
                sheetTabs.push({ name: `工作表${sheetTabs.length + 1}`, content: '', history: [''], mode: 'board' });
                switchSheet(sheetTabs.length - 1);
            }
        });
    }

    window.enterBoardMode = enterBoardMode;

    window.renderBoardFromText = mount;
    window.unmountBoardMode = unmount;
    window.extractTextFromBoard = function () {
        const t = extractSheet();
        return t === null ? (document.getElementById('editor')?.value || '') : t;
    };
    window.WB.sheet = { S, parseSheet, extractSheet, resolveCols, enterBoardMode };
})();
