// ==========================================
// translate.js — 翻譯與對話模式：對話轉 TSV、浮動翻譯工具、複製貼上選單、手機鍵盤
// （由原 script.js 拆分而來；於 index.html 中依序載入）
// ==========================================

// ==========================================
// 將對話模式的氣泡內容轉換為 TSV 表格格式
// A欄: 使用者輸入 | B欄: 翻譯結果 | C欄: 拼音 | D欄以後: 隱形背包完整還原
// ==========================================
function extractTextFromChat() {
    const wrappers = document.querySelectorAll('#chatMessagesArea .chat-message-wrapper');
    // 如果對話區是空的，就保留原本編輯器裡的內容
    if (wrappers.length === 0) return editor.value; 

    let tsvData = [];
    let pendingUser = null; // 🌟 改用物件暫存使用者發言與它的隱形背包

    // 處理 TSV 儲存格安全跳脫 (包含換行、引號或Tab時加上雙引號)
    const escapeTSV = (text) => {
        if (typeof text !== 'string') text = String(text);
        if (!text) return "";
        if (text.includes('"') || text.includes('\n') || text.includes('\t')) {
            return '"' + text.replace(/"/g, '""') + '"';
        }
        return text;
    };


    wrappers.forEach(wrapper => {
        const userBubble = wrapper.querySelector('.chat-bubble-user');
        const systemBubble = wrapper.querySelector('.chat-bubble-system');
        
        // 打開隱形背包：讀取藏在 DOM 裡的 D 欄以後資料
        let extraCols = [];
        try {
            if (wrapper.dataset.extra) extraCols = JSON.parse(wrapper.dataset.extra);
        } catch(e) {}

        if (userBubble) {
            // 如果上一個使用者發言還沒被系統回覆配對，就先把它推入陣列
            if (pendingUser) {
                const rowData = [escapeTSV(pendingUser.text), "", "", ...pendingUser.extra.map(escapeTSV)];
                tsvData.push(rowData.join('\t'));
            }
            pendingUser = { text: userBubble.innerText.trim(), extra: extraCols };
        } else if (systemBubble) {
            
            let translation = "";
            let pinyin = "";

            // 利用 DOM 結構來精準分離「翻譯」與「拼音」
            const pinyinSpan = systemBubble.querySelector('span.text-slate-500');

            if (pinyinSpan) {
                pinyin = pinyinSpan.innerText.trim();
                const cloneBubble = systemBubble.cloneNode(true);
                const cloneSpan = cloneBubble.querySelector('span.text-slate-500');
                if (cloneSpan) cloneSpan.remove();
                translation = cloneBubble.innerText.trim();
            } else {
                translation = systemBubble.innerText.trim();
            }

            if (pendingUser) {
                // 湊齊一組：使用者 -> 翻譯 -> 拼音 -> 額外欄位
                const rowData = [escapeTSV(pendingUser.text), escapeTSV(translation), escapeTSV(pinyin), ...extraCols.map(escapeTSV)];
                tsvData.push(rowData.join('\t'));
                pendingUser = null; // 重置
            } else {
                // 只有系統發言
                const rowData = ["", escapeTSV(translation), escapeTSV(pinyin), ...extraCols.map(escapeTSV)];
                tsvData.push(rowData.join('\t'));
            }
        }
    });

    // 處理最後可能遺留的使用者訊息 (還沒等到系統回覆就切換模式)
    if (pendingUser) {
        const rowData = [escapeTSV(pendingUser.text), "", "", ...pendingUser.extra.map(escapeTSV)];
        tsvData.push(rowData.join('\t'));
    }

    return tsvData.join('\n');
}

function updateTableHeaders() {
    const theadThs = dataTable.querySelectorAll('thead th');
    for (let i = 1; i < theadThs.length; i++) {
        theadThs[i].dataset.col = i - 1;
        const lbl = theadThs[i].querySelector('.col-label');
        const colName = theadThs[i].dataset.colName;
        if (lbl) {
            lbl.textContent = colName ? `${getColLabel(i - 1)} ${colName}` : getColLabel(i - 1);
        }
    }
    dataTable.querySelectorAll('tbody tr').forEach((tr, index) => {
        const lbl = tr.querySelector('.row-label');
        if (lbl) lbl.textContent = index + 1;
    });
}

/* 凍結列設定 */
document.getElementById('dd-freeze').addEventListener('change', (e) => {
    frozenRowsCount = parseInt(e.detail.value);
    localStorage.setItem(FREEZE_ROWS_KEY, e.detail.value);
    applyFreeze();
});

function applyFreeze() {
    dataTable.querySelectorAll('tbody th, tbody td').forEach(cell => {
        cell.style.position = ''; cell.style.top = ''; cell.style.zIndex = '';
        cell.style.backgroundColor = ''; cell.style.borderBottom = '';
    });

    if (currentMode !== 'table' || frozenRowsCount === 0) return;

    const thead = dataTable.querySelector('thead');
    let currentTop = thead ? thead.getBoundingClientRect().height : 36;

    for (let i = 0; i < frozenRowsCount; i++) {
        const tr = dataTable.querySelectorAll('tbody tr')[i];
        if (!tr) break;

        const th = tr.querySelector('th');
        const tds = tr.querySelectorAll('td');
        const isLastFrozen = (i === frozenRowsCount - 1);
        const borderStyle = isLastFrozen ? '2px solid #94a3b8' : '';

        if (th) {
            th.style.position = 'sticky'; th.style.top = `${currentTop}px`;
            th.style.zIndex = '35'; 
            if(isLastFrozen) th.style.borderBottom = borderStyle;
        }

        tds.forEach(td => {
            td.style.position = 'sticky'; td.style.top = `${currentTop}px`;
            td.style.zIndex = '25'; td.style.backgroundColor = '#f1f5f9';
            if(isLastFrozen) td.style.borderBottom = borderStyle;
        });
        currentTop += tr.getBoundingClientRect().height;
    }
}






// ==========================================
// 編輯器專屬：浮動翻譯工具整合模組
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
        window.lastFocusedInput = null;
        document.addEventListener('focusin', (e) => {
            const isTextInput = e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && ['text', 'search', 'number', 'password', 'url', 'tel'].includes(e.target.type));
            if (isTextInput) {
                window.lastFocusedInput = e.target;
            }
        });
        // --- 1. 防止焦點轉移，保持編輯區反白 ---
        document.addEventListener('mousedown', (e) => {
            const isTranslator = e.target.closest('#floating-translator') || e.target.closest('#floating-pinyin-tool');
            
            // 擴大保護範圍：包含主工具列 (.mb-1.flex.flex-wrap)、所有下拉選單與操作按鈕
            const isToolbar = e.target.closest('.mb-1.flex.flex-wrap') || 
                              e.target.closest('.mb-3.flex') || 
                              e.target.closest('.dropdown-container') || 
                              e.target.closest('.dropdown-menu') || 
                              e.target.closest('.action-menu') || 
                              e.target.closest('.action-dropdown') || 
                              e.target.closest('.icon-btn') || 
                              e.target.closest('#chatControls') ||
                              e.target.closest('#global-lang-submenu') || 
                              e.target.closest('#btn-global-lang-toggle');
                              
            // 嚴格判定文字輸入區域 (排除 Checkbox/Radio，避免它們被誤當作輸入框而導致編輯器失焦)
            const isTextInput = (e.target.tagName === 'INPUT' && (e.target.type === 'text' || e.target.type === 'number' || e.target.type === 'search')) || e.target.tagName === 'TEXTAREA';
            
            if ((isTranslator || isToolbar) && !isTextInput) {
                // 手機版保留原有的點擊順暢度
                if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
                    return;
                }
                
                // 強制阻擋失去焦點
                e.preventDefault(); 
                
                // 手動修復 Label + Checkbox/Radio 的點擊事件 (因為 preventDefault 會吃掉預設的狀態切換)
                const label = e.target.closest('label');
                if (label) {
                    const input = label.querySelector('input');
                    if (input) {
                        if (input.type === 'radio' && input.checked) return;
                        input.checked = input.type === 'radio' ? true : !input.checked;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }
        });


	/*
    if (typeof setupDictionaries === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://gnisew.github.io/tools/translate/translate.js';
        document.head.appendChild(script);
    }
	*/

	/**
	 * 動態載入烏衣行翻譯系統的核心模組（延遲載入：第一次使用翻譯系統時才載入）
	 * 回傳同一個 Promise（只會載入一次）；載入失敗時會清除快取，下次點擊可重試
	 */
	let _translatorModulesPromise = null;
	function ensureTranslatorModules() {
		if (_translatorModulesPromise) return _translatorModulesPromise;

		const baseUrl = "https://gnisew.github.io/tools/translate/";
		// 需要載入的檔案（請依照必須執行的先後順序排列）
		const scriptsToLoad = ["translate.js", "grammar-engine.js"];

		_translatorModulesPromise = (async () => {
			console.log("🔄 開始載入翻譯系統模組...");
			for (const filename of scriptsToLoad) {
				const fullUrl = baseUrl + filename;
				await new Promise((resolve, reject) => {
					// 已經有這個腳本就跳過，避免重複載入
					if (document.querySelector(`script[src="${fullUrl}"]`)) return resolve();
					const script = document.createElement('script');
					script.src = fullUrl;
					script.async = false; // 依序執行
					script.onload = () => { console.log(`✅ 載入成功: ${filename}`); resolve(); };
					script.onerror = () => { script.remove(); reject(new Error(`❌ 載入失敗: ${filename}`)); };
					document.head.appendChild(script);
				});
			}
			console.log("🚀 所有翻譯模組載入完畢，系統已就緒！");
		})().catch((err) => {
			_translatorModulesPromise = null; // 失敗後允許重試
			console.error("翻譯系統載入失敗，請檢查網路。", err);
			throw err;
		});

		return _translatorModulesPromise;
	}

    // 準備全域變數，供拼音字典腳本使用
    window.ccc = ''; window.ddd = ''; window.c = []; window.d = [];
    window.currentLanguageKey = 'kasu';

    const BASE_URL_TRANS = 'https://gnisew.github.io/tools/translate/';
    const BASE_URL_RUBY = 'https://gnisew.github.io/tools/ruby/';
    
    const STORE_KEY_SOURCE = 'translate_source_lang';
    const STORE_KEY_TARGET = 'translate_target_lang';
    
    const LANGUAGES = {
        'chinese': { name: '華語' },
        'sixian': { name: '四縣', file: 'data-sixian-chinese.js', pyFile: 'hanzitopinyin-sixian.js' },
        'sixiannan': { name: '南四縣', file: '', pyFile: 'hanzitopinyin-sixiannan.js' },
        'hailu': { name: '海陸', file: 'data-hailu-chinese.js', pyFile: 'hanzitopinyin-hailu.js' },
        'dapu': { name: '大埔', file: 'data-dapu-chinese.js', pyFile: 'hanzitopinyin-dapu.js' },
        'raoping': { name: '饒平', file: '', pyFile: 'hanzitopinyin-raoping.js' },
        'kasu': { name: '詔安', file: 'data-kasu-chinese.js', pyFile: 'hanzitopinyin-kasu.js' },
        'holo': { name: '和樂', file: 'data-holo-chinese.js', pyFile: 'hanzitopinyin-holo.js' },
        'jinmen': { name: '金門', file: '', pyFile: 'hanzitopinyin-jinmen.js' }, 
        'matsu': { name: '馬祖', file: 'data-matsu-chinese.js' },
        'segment': { name: '分詞', file: '' },
        'pinyin': { name: '拼音', file: '' } 
    };

    const SHORT_NAMES = {
        'chinese': '華', 'sixian': '四', 'sixiannan': '南',
        'hailu': '海', 'dapu': '埔', 'raoping': '饒',
        'kasu': '詔', 'holo': '台', 'jinmen': '金',
        'matsu': '福', 'pinyin': '拼', 'segment': '詞'
    };

    const DIRECT_PAIRS = {
        'sixian-hailu': 'data-sixian-hailu.js',
        'sixian-dapu': 'data-sixian-dapu.js',
        'sixian-raoping': 'data-sixian-raoping.js',
        'sixian-kasu': 'data-sixian-kasu.js',
        'sixian-sixiannan': 'data-sixian-sixiannan.js',
        'hailu-dapu': 'data-hailu-dapu.js',
        'hailu-kasu': 'data-hailu-kasu.js',
        'dapu-kasu': 'data-dapu-kasu.js',
        'holo-kasu': 'data-holo-kasu.js',
        'holo-jinmen': 'data-holo-jinmen.js'
    };

    const DEFAULT_PIVOT = 'chinese';
    let dictCache = {};

    const proxyMap = new Map();
    for (const langKey in LANGUAGES) {
        if (langKey !== 'segment' && langKey !== 'pinyin' && langKey !== 'chinese' && !LANGUAGES[langKey].file) {
            let proxyTarget = null, pairCount = 0;
            for (const pairKey in DIRECT_PAIRS) {
                const [langA, langB] = pairKey.split('-');
                if (langA === langKey) { proxyTarget = langB; pairCount++; }
                else if (langB === langKey) { proxyTarget = langA; pairCount++; }
            }
            if (pairCount === 1) proxyMap.set(langKey, proxyTarget);
        }
    }
    function getProxyTarget(lang) { return proxyMap.get(lang); }

    let transState = {
        source: localStorage.getItem(STORE_KEY_SOURCE) || 'chinese',
        target: localStorage.getItem(STORE_KEY_TARGET) || 'kasu',
        pivot: 'direct' 
    };

    const transPanel = document.getElementById('floating-translator');
    const dragHandle = document.getElementById('translator-drag-handle');
    const btnExecute = document.getElementById('btn-execute-translate');
    const btnOptionsToggle = document.getElementById('btn-trans-options-toggle');
    const optionsMenu = document.getElementById('trans-options-menu');
    const btnClose = document.getElementById('btn-close-translator');
    const btnToggle = document.getElementById('btn-toggle-translator');
    const sourceBtn = document.querySelector('[data-id="source-btn"]');
    const targetBtn = document.querySelector('[data-id="target-btn"]');
    const pivotLabel = document.getElementById('pivot-label');
    const pivotList = document.getElementById('pivot-list');
    const pivotWrapper = document.getElementById('dropdown-pivot');

    // --- 2. UI 邏輯與膠囊按鈕 ---
    function initDropdowns() {
        sourceBtn.textContent = SHORT_NAMES[transState.source] || '華';
        targetBtn.textContent = SHORT_NAMES[transState.target] || '詔';

        document.querySelectorAll('.dropdown-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const list = btn.nextElementSibling;
                document.querySelectorAll('.dropdown-list, #trans-options-menu').forEach(l => {
                    if (l !== list) l.classList.remove('show', 'hidden');
                    if (l.id === 'trans-options-menu' && l !== list) l.classList.add('hidden');
                });
                list.classList.toggle('show');

                if (list.classList.contains('show')) {
                    const btnRect = btn.getBoundingClientRect();
                    const windowHeight = window.innerHeight;
                    const spaceBelow = windowHeight - btnRect.bottom;
                    const spaceAbove = btnRect.top;
                    const listMaxHeight = 260; 

                    if (spaceBelow < listMaxHeight && spaceAbove > spaceBelow) {
                        list.style.bottom = 'calc(100% + 5px)';
                        list.style.top = 'auto';
                    } else {
                        list.style.bottom = 'auto';
                        list.style.top = 'calc(100% + 5px)';
                    }
                }
            });
        });

        btnOptionsToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.dropdown-list').forEach(l => l.classList.remove('show'));
            optionsMenu.classList.toggle('hidden');

            if (!optionsMenu.classList.contains('hidden')) {
                const btnRect = btnOptionsToggle.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const spaceBelow = windowHeight - btnRect.bottom;
                const spaceAbove = btnRect.top;
                const menuMaxHeight = 180; 

                if (spaceBelow < menuMaxHeight && spaceAbove > spaceBelow) {
                    optionsMenu.style.bottom = 'calc(100% + 5px)';
                    optionsMenu.style.top = 'auto';
                    optionsMenu.classList.remove('origin-top-right');
                    optionsMenu.classList.add('origin-bottom-right');
                } else {
                    optionsMenu.style.bottom = 'auto';
                    optionsMenu.style.top = 'calc(100% + 5px)';
                    optionsMenu.classList.remove('origin-bottom-right');
                    optionsMenu.classList.add('origin-top-right');
                }
            }
        });

        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-list').forEach(l => l.classList.remove('show'));
            optionsMenu.classList.add('hidden');
        });

        document.querySelectorAll('#dropdown-source .dropdown-item').forEach(item => {
            item.addEventListener('click', () => { setLanguage('source', item.dataset.value); item.closest('.dropdown-list').classList.remove('show'); });
        });
        document.querySelectorAll('#dropdown-target .dropdown-item').forEach(item => {
            item.addEventListener('click', () => { setLanguage('target', item.dataset.value); item.closest('.dropdown-list').classList.remove('show'); });
        });
    }

	function setLanguage(type, value) {
        transState[type] = value;
        if (type === 'source') {
            sourceBtn.textContent = SHORT_NAMES[value] || '華';
            localStorage.setItem(STORE_KEY_SOURCE, value);
        } else if (type === 'target') {
            targetBtn.textContent = SHORT_NAMES[value] || '詔';
            localStorage.setItem(STORE_KEY_TARGET, value);
        }
        updatePivotOptions(); 
        updateCapsuleButtonUI();
    }

    function updateCapsuleButtonUI() {
        const isTargetPinyin = transState.target === 'pinyin';
        const isTargetSegment = transState.target === 'segment';
        
        // 嚴格判斷：是否為直達且擁有直接對應的檔案
        const isDirect = (transState.pivot === 'direct' || !transState.pivot) && getFileForPair(transState.source, transState.target);

        btnExecute.innerHTML = '轉換';
        let menuHTML = '';

        if (isTargetPinyin) {
            menuHTML = `
                <button class="menu-action-btn" data-action="default"><span class="material-symbols-outlined text-[16px] text-blue-600">arrow_downward</span> 字轉音 (預設)</button>
                <button class="menu-action-btn" data-action="raw"><span class="material-symbols-outlined text-[16px] text-teal-600">raw_on</span> Bunxc-bienx</button>
                <button class="menu-action-btn" data-action="bracket"><span class="material-symbols-outlined text-[16px] text-purple-600">data_object</span> 字〔yin〕</button>
                <button class="menu-action-btn" data-action="bracket_trans"><span class="material-symbols-outlined text-[16px] text-indigo-600">translate</span> 字〔yin〕華</button>
                <button class="menu-action-btn" data-action="segment"><span class="material-symbols-outlined text-[16px] text-orange-500">space_bar</span> 空格分詞</button>
                <button class="menu-action-btn" data-action="segment_underscore"><span class="material-symbols-outlined text-[16px] text-orange-600">horizontal_rule</span> 底線分詞</button>
            `;
            btnOptionsToggle.style.display = 'flex';
            optionsMenu.innerHTML = menuHTML;
            btnExecute.classList.remove('rounded-full', 'pr-3');
            btnExecute.classList.add('rounded-l-full', 'border-r', 'border-blue-200', 'pr-2');
        } else if (isTargetSegment) {
            menuHTML = `
                <button class="menu-action-btn" data-action="default"><span class="material-symbols-outlined text-[16px] text-orange-600">horizontal_rule</span> 底線分詞 (預設)</button>
                <button class="menu-action-btn" data-action="segment_space"><span class="material-symbols-outlined text-[16px] text-orange-500">space_bar</span> 空格分詞</button>
            `;
            btnOptionsToggle.style.display = 'flex';
            optionsMenu.innerHTML = menuHTML;
            btnExecute.classList.remove('rounded-full', 'pr-3');
            btnExecute.classList.add('rounded-l-full', 'border-r', 'border-blue-200', 'pr-2');
        } else {
            menuHTML = `
                <button class="menu-action-btn" data-action="default"><span class="material-symbols-outlined text-[16px] text-blue-600">translate</span> 預設轉換</button>
                <button class="menu-action-btn ${!isDirect ? 'opacity-40 cursor-not-allowed' : ''}" data-action="exact" ${!isDirect ? 'disabled' : ''}><span class="material-symbols-outlined text-[16px] text-green-600">done_all</span> 完全符合</button>
                <button class="menu-action-btn ${!isDirect ? 'opacity-40 cursor-not-allowed' : ''}" data-action="all" ${!isDirect ? 'disabled' : ''}><span class="material-symbols-outlined text-[16px] text-purple-600">format_list_bulleted</span> 所有符合</button>
                <button class="menu-action-btn ${!isDirect ? 'opacity-40 cursor-not-allowed' : ''}" data-action="fuzzy" ${!isDirect ? 'disabled' : ''}><span class="material-symbols-outlined text-[16px] text-orange-600">blur_on</span> 模糊符合</button>
            `;
            btnOptionsToggle.style.display = 'flex';
            optionsMenu.innerHTML = menuHTML;
            btnExecute.classList.remove('rounded-full', 'pr-3');
            btnExecute.classList.add('rounded-l-full', 'border-r', 'border-blue-200', 'pr-2');
        }

        optionsMenu.querySelectorAll('.menu-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                optionsMenu.classList.add('hidden');
                performConversion(btn.dataset.action); 
            });
        });
        
        checkButtonState();
    }

    function checkButtonState() {
        if (!btnExecute) return;
        const source = transState.source;
        const target = transState.target;
        
        const isSame = source === target;
        const isBothPinyin = source === 'pinyin' && target === 'pinyin';
        const isSegmentPinyin = source === 'pinyin' && target === 'segment'; 
        
        let isMissingPinyinDict = false;
        if (target === 'pinyin' && source !== 'pinyin') {
            if (!LANGUAGES[source].pyFile) isMissingPinyinDict = true;
        } else if (source === 'pinyin' && target !== 'pinyin') {
            if (!LANGUAGES[target].pyFile) isMissingPinyinDict = true;
        }

        // 檢查路徑是否真實存在
        let isPathValid = true;
        if (source !== 'pinyin' && target !== 'pinyin' && source !== target) {
            let canDirect = target === 'segment' ? (source === 'chinese' || LANGUAGES[source].file) : hasDirectPath(source, target);
            const possiblePivots = findPossiblePivots(source, target);
            if (!canDirect && possiblePivots.length === 0) isPathValid = false;
        }

        let hasSelection = false;
        if (typeof currentMode !== 'undefined') {
            if (currentMode === 'text') {
                const editor = document.getElementById('editor');
                if (editor) hasSelection = editor.selectionStart !== editor.selectionEnd;
            } else if (currentMode === 'table') {
                const sel = window.getSelection();
                if (sel && sel.toString().trim().length > 0) {
                    hasSelection = true;
                } else {
                    const hasMultiCells = document.querySelectorAll('#data-table td.sel-bg').length > 0;
                    const hasSingleCellOutline = document.querySelectorAll('#data-table td[style*="inset"]').length > 0;
                    const isEditing = document.activeElement && document.activeElement.classList.contains('td-inner');
                    if (hasMultiCells || hasSingleCellOutline || isEditing) hasSelection = true;
                }
            } else {
                // 💡 加入便利貼的選取判定
                const selectedNotes = document.querySelectorAll('.sticky-note.ring-2');
                const sel = window.getSelection();
                const hasDivSelection = sel && sel.toString().trim().length > 0;
                
                let activeEl = document.activeElement;
                let isInputTarget = activeEl && (activeEl.tagName === 'TEXTAREA' || (activeEl.tagName === 'INPUT' && ['text', 'search', 'number', 'password', 'url', 'tel'].includes(activeEl.type)));

                if (selectedNotes.length > 0) {
                    hasSelection = true; // 只要有選取便利貼，直接判定為有選取
                } else if (hasDivSelection) {
                    hasSelection = true;
                } else if (isInputTarget) {
                    try { hasSelection = activeEl.selectionStart !== activeEl.selectionEnd; } catch(e) {}
                } else if (window.lastFocusedInput && document.body.contains(window.lastFocusedInput)) {
                    try { hasSelection = window.lastFocusedInput.selectionStart !== window.lastFocusedInput.selectionEnd; } catch(e) {}
                }
            }
        }

        if (isSame || isBothPinyin || isMissingPinyinDict || isSegmentPinyin || !hasSelection || !isPathValid) {
            btnExecute.disabled = true; 
            btnOptionsToggle.disabled = true;
            
            if (!hasSelection) btnExecute.title = "請先選取要轉換的文字或儲存格";
            else if (isSame) btnExecute.title = "來源與結果語言相同";
            else if (!isPathValid) btnExecute.title = "無可用的翻譯路徑或中介語言";
            else if (isBothPinyin) btnExecute.title = "無法執行拼音轉拼音";
            else if (isSegmentPinyin) btnExecute.title = "不支援拼音直接分詞";
            else btnExecute.title = `未配置 ${LANGUAGES[source === 'pinyin' ? target : source].name} 的拼音字典，無法轉換`;
            
        } else {
            btnExecute.disabled = false; 
            btnOptionsToggle.disabled = false;
            btnExecute.title = "";
        }
    }

    // 監聽選取變化，即時更新按鈕狀態
    document.addEventListener('selectionchange', checkButtonState);
    document.addEventListener('mouseup', () => setTimeout(checkButtonState, 50));
    document.addEventListener('keyup', () => setTimeout(checkButtonState, 50));

    // --- 3. 動態中介語言與拼音鎖定 ---
    function hasDirectPath(langA, langB) {
        if (!langA || !langB || langA === langB) return false;
        if (DIRECT_PAIRS[`${langA}-${langB}`] || DIRECT_PAIRS[`${langB}-${langA}`]) return true;
        if (langA === 'chinese' && LANGUAGES[langB]?.file) return true;
        if (langB === 'chinese' && LANGUAGES[langA]?.file) return true;
        return false;
    }

    function findPossiblePivots(from, to) {
        if (from === 'pinyin' || to === 'pinyin') return []; 

        const pivots = [];

        if (to === 'segment') {
            if (from === 'chinese') {
                for (const key in LANGUAGES) if (LANGUAGES[key].file) pivots.push(key);
            } else if (!LANGUAGES[from].file) {
                for (const key in LANGUAGES) {
                    if (key !== from && hasDirectPath(from, key) && LANGUAGES[key].file) {
                        pivots.push(key);
                    }
                }
            } else {
                pivots.push('chinese');
            }
            return pivots;
        }

        // 階段一：嚴格檢查只允許「一層」直達傳遞 (Source -> Pivot -> Target)
        for (const pivotKey in LANGUAGES) {
            if (pivotKey === from || pivotKey === to || pivotKey === 'segment' || pivotKey === 'pinyin') continue;

            if (hasDirectPath(from, pivotKey) && hasDirectPath(pivotKey, to)) {
                pivots.push(pivotKey);
            }
        }

        // 如果第一層有找到，優先將華語排在第一順位並回傳 (不再找第二層)
        if (pivots.length > 0) {
            if (pivots.includes('chinese')) {
                return ['chinese', ...pivots.filter(p => p !== 'chinese')];
            }
            return pivots;
        }

        // 階段二：如果第一層找不到，啟動「兩層」中介搜索 (Source -> P1 -> P2 -> Target)
        for (const p1 in LANGUAGES) {
            if (p1 === from || p1 === to || p1 === 'segment' || p1 === 'pinyin') continue;
            
            // 如果來源能到 P1
            if (hasDirectPath(from, p1)) {
                for (const p2 in LANGUAGES) {
                    if (p2 === from || p2 === to || p2 === 'segment' || p2 === 'pinyin' || p2 === p1) continue;
                    
                    // 且 P1 能到 P2，P2 能到目標
                    if (hasDirectPath(p1, p2) && hasDirectPath(p2, to)) {
                        // 以逗號分隔字串儲存這條兩層路徑
                        pivots.push(`${p1},${p2}`);
                    }
                }
            }
        }

        // 兩層路徑中，優先顯示包含華語的路徑
        if (pivots.length > 0) {
            const withChinese = pivots.filter(p => p.includes('chinese'));
            const withoutChinese = pivots.filter(p => !p.includes('chinese'));
            return [...withChinese, ...withoutChinese];
        }

        return pivots;
    }

    function updatePivotOptions() {
        const source = transState.source;
        const target = transState.target;

        if (source === 'pinyin' || target === 'pinyin' || source === target) {
            pivotWrapper.style.opacity = '0.4';
            pivotWrapper.style.pointerEvents = 'none';
            transState.pivot = 'direct';
            updatePivotLabel();
            checkButtonState();
            return;
        } else {
            pivotWrapper.style.opacity = '1';
            pivotWrapper.style.pointerEvents = 'auto';
        }
        
        let canDirect = false;
        if (target === 'segment') {
            canDirect = (source === 'chinese' || LANGUAGES[source].file) ? true : false;
        } else {
            canDirect = hasDirectPath(source, target);
        }

        const possiblePivots = findPossiblePivots(source, target);
        pivotList.innerHTML = '';
        
        // 建立選單項目的輔助函數 (加入打勾圖示)
        const createPivotItem = (value, text, isSelected) => {
            const item = document.createElement('div');
            item.className = 'dropdown-item flex items-center justify-between gap-3'; 
            item.dataset.value = value;
            
            item.innerHTML = `
                <span>${text}</span>
                <span class="material-symbols-outlined text-[18px] text-blue-600 font-bold" style="opacity: ${isSelected ? '1' : '0'};">check</span>
            `;
            
            item.onclick = (e) => {
                transState.pivot = value; 
                updatePivotLabel(); 
                e.target.closest('.dropdown-list').classList.remove('show');
                updatePivotOptions(); // 重新渲染選單以更新打勾狀態
            };
            return item;
        };

        if (canDirect) {
            pivotList.appendChild(createPivotItem('direct', '直達', transState.pivot === 'direct'));
        }

        // 處理選項文字的渲染
        possiblePivots.forEach(pivotKey => {
            const names = pivotKey.split(',').map(p => LANGUAGES[p].name);
            const isSelected = transState.pivot === pivotKey;
            pivotList.appendChild(createPivotItem(pivotKey, names.join(' > '), isSelected));
        });

        pivotList.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                transState.pivot = item.dataset.value; 
                updatePivotLabel(); 
                item.closest('.dropdown-list').classList.remove('show');
            });
        });

        if (canDirect) {
            if (transState.pivot !== 'direct' && !possiblePivots.includes(transState.pivot)) {
                transState.pivot = 'direct';
            }
            if (!transState.pivot) transState.pivot = 'direct';
        } else {
            if (possiblePivots.length > 0) {
                if (!possiblePivots.includes(transState.pivot)) {
                    transState.pivot = possiblePivots[0]; 
                }
            } else {
                transState.pivot = '';
            }
        }

        updatePivotLabel(); checkButtonState();
    }

    function updatePivotLabel() {
        if (!pivotLabel) return;
        
        // 🌟 永遠隱藏文字，讓按鈕只顯示箭頭
        pivotLabel.style.display = 'none'; 
        
        // 將目前的狀態寫入 title，滑鼠懸浮時可以看
        if (transState.pivot === 'direct' || !transState.pivot) {
            pivotWrapper.title = "設定中介語言 (目前：直達)";
        } else {
            const names = transState.pivot.split(',').map(p => LANGUAGES[p].name);
            pivotWrapper.title = "設定中介語言 (目前：" + names.join(' > ') + ")";
        }
    }

    // --- 4. 拖曳面板 ---
    function closeTranslatorPanel() {
        transPanel.style.display = 'none';
        if (btnToggle) btnToggle.classList.remove('active'); // 移除按鈕變色狀態
    }

    function openTranslatorPanel() {
        transPanel.style.display = 'flex';
        ensureTranslatorModules().catch(() => {}); // 第一次開啟時才開始載入（背景進行，不擋面板）
        if (btnToggle) btnToggle.classList.add('active'); // 加上按鈕變色狀態
    }

    // 工具列按鈕：點擊時進行「開關切換」
    if(btnToggle) {
        btnToggle.addEventListener('click', () => {
            if (transPanel.style.display === 'none' || transPanel.style.display === '') {
                openTranslatorPanel();
            } else {
                closeTranslatorPanel();
            }
        });
    }

    // 面板上的關閉按鈕 (✖)
    if(btnClose) {
        btnClose.addEventListener('click', closeTranslatorPanel);
    }
    
    let isDragging = false, startX, startY, initialX, initialY;
    function startDrag(clientX, clientY) {
        isDragging = true; startX = clientX; startY = clientY;
        const rect = transPanel.getBoundingClientRect(); initialX = rect.left; initialY = rect.top;
        transPanel.style.transform = 'none'; transPanel.style.left = `${initialX}px`; transPanel.style.top = `${initialY}px`;
        transPanel.style.bottom = 'auto'; transPanel.style.right = 'auto';
        document.body.style.userSelect = 'none';
    }
    function drag(clientX, clientY) { if (isDragging) { transPanel.style.left = `${initialX + (clientX - startX)}px`; transPanel.style.top = `${initialY + (clientY - startY)}px`; } }
    function stopDrag() { isDragging = false; document.body.style.userSelect = ''; }

    if (dragHandle) {
        dragHandle.addEventListener('mousedown', (e) => { startDrag(e.clientX, e.clientY); document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp); });
        dragHandle.addEventListener('touchstart', (e) => { startDrag(e.touches[0].clientX, e.touches[0].clientY); document.addEventListener('touchmove', onTouchMove, { passive: false }); document.addEventListener('touchend', onTouchEnd); }, { passive: false });
    }
    function onMouseMove(e) { drag(e.clientX, e.clientY); }
    function onMouseUp() { stopDrag(); document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); }
    function onTouchMove(e) { if (!isDragging) return; e.preventDefault(); drag(e.touches[0].clientX, e.touches[0].clientY); }
    function onTouchEnd() { stopDrag(); document.removeEventListener('touchmove', onTouchMove); document.removeEventListener('touchend', onTouchEnd); }

    // --- 5. 核心輔助工具 (腳本載入與解析引擎) ---
    function loadScript(url) {
        return new Promise((resolve) => {
            if (document.querySelector(`script[src="${url}"]`)) return resolve();
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = () => { console.warn(`腳本載入失敗: ${url}`); resolve(); };
            document.head.appendChild(script);
        });
    }

    let PROCESSED_IME_DICTS = {};
    function initializeImeDicts() {
        if (typeof dictionaries === 'undefined') return;
        for (const lang in dictionaries) {
            const dict = dictionaries[lang];
            const map = new Map();
            for (const pinyin in dict) {
                const hanziOptions = dict[pinyin].split(' ');
                map.set(pinyin, hanziOptions[0]);
            }
            PROCESSED_IME_DICTS[lang] = map;
        }
    }

    function tokenizePinyinWithHyphens(raw) {
        const tokens = [];
        let currentToken = '';
        const toCharArray = (str) => Array.from(str || '');
        const PUNCTS = new Set(['，', '。', '、', '；', '：', '！', '？', '（', '）', '「', '」', '『', '』', '《', '》', '〈', '〉', '—', '…', '－', '‧', '·', '﹑', ',', '.', ';', ':', '!', '?', '(', ')', '[', ']', '{', '}', '"', "'", '-', '…']);
        const WHITESPACES = new Set([' ', '\t', '\u3000']);
        const isPunct = (ch) => PUNCTS.has(ch);
        const isWhitespace = (ch) => WHITESPACES.has(ch);
        
        for (const ch of toCharArray(raw || '')) {
            const isDelimiter = isWhitespace(ch) || (isPunct(ch) && ch !== '-');
            if (isDelimiter) {
                if (currentToken.length > 0) { tokens.push(currentToken); currentToken = ''; }
                tokens.push(ch);
            } else { currentToken += ch; }
        }
        if (currentToken.length > 0) tokens.push(currentToken);
        return tokens;
    }

    function pinyinToHanziEngine(pinyinText, langKey) {
        const hakkaLanguages = new Set(['sixian', 'hailu', 'dapu', 'raoping', 'sixiannan']);
        if (hakkaLanguages.has(langKey) && typeof hakkaToneToZvs === 'function') {
            pinyinText = hakkaToneToZvs(pinyinText);
        } else if (langKey === 'kasu' && typeof hakkaToneToZvs === 'function') {
            pinyinText = hakkaToneToZvs(pinyinText);
            pinyinText = pinyinText
                .replace(/([bpfvdtlgkhzcsi])oo([zvsx]?)\b/g, '$1o$2')
                .replace(/(\b)(rh)([aeiou])/g, '$1r$3')
                .replace(/(\b)(bb)([aeiou])/g, '$1v$3')
                .replace(/(\b)(ji)/g, '$1zi')
                .replace(/(\b)(qi)/g, '$1ci')
                .replace(/(\b)(xi)/g, '$1si');
        }
        
        pinyinText = pinyinText
          .replace(/(?<![A-Za-z\s-])([A-Za-z]+)/g, ' $1')
          .replace(/([A-Za-z]+)(?![A-Za-z\s-])/g, '$1 ')
          .replace(/([A-Za-z])\n/g, '$1 \n')
          .replace(/\n([A-Za-z])/g, '\n $1')
          .trim();

        let dict = PROCESSED_IME_DICTS[langKey];
        if (!dict || dict.size === 0) return pinyinText;

        const lowerDict = new Map();
        for (const [key, value] of dict.entries()) {
            lowerDict.set(key.toLowerCase(), value);
        }
        dict = lowerDict;

        const tokens = tokenizePinyinWithHyphens(pinyinText);
        const WHITESPACES = new Set([' ', '\t', '\u3000']);
        const PUNCTS = new Set(['，', '。', '、', '；', '：', '！', '？', '（', '）', '「', '」', '『', '』', '《', '》', '〈', '〉', '—', '…', '－', '‧', '·', '﹑', ',', '.', ';', ':', '!', '?', '(', ')', '[', ']', '{', '}', '"', "'", '-', '…']);
        const isActualSyllable = (token) => !WHITESPACES.has(token) && !PUNCTS.has(token);
        const syllables = tokens.filter(isActualSyllable);

        const convertedUnits = [];
        let i = 0;
        while (i < syllables.length) {
            let matchFound = false;
            for (let n = Math.min(5, syllables.length - i); n > 1; n--) {
                const phrase = syllables.slice(i, i + n).join(' ').toLowerCase();
                if (dict.has(phrase)) {
                    convertedUnits.push({ hanzi: dict.get(phrase), sourceCount: n });
                    i += n;
                    matchFound = true;
                    break;
                }
            }
            if (matchFound) continue;

            const currentSyl = syllables[i].toLowerCase();
            if (dict.has(currentSyl)) {
                convertedUnits.push({ hanzi: dict.get(currentSyl), sourceCount: 1 });
            } else if (currentSyl.includes('-')) {
                const subPinyins = currentSyl.split(/-+/);
                const translatedSubs = subPinyins.map(sub => dict.get(sub.toLowerCase()) || sub);
                convertedUnits.push({ hanzi: translatedSubs.join(''), sourceCount: 1 });
            } else {
                convertedUnits.push({ hanzi: syllables[i], sourceCount: 1 });
            }
            i++;
        }

        let unitIndex = 0;
        let syllablesToSkip = 0;
        let finalText = "";
        tokens.forEach(token => {
            if (!isActualSyllable(token)) {
                if (!WHITESPACES.has(token)) finalText += token;
                return;
            }
            if (syllablesToSkip > 0) { syllablesToSkip--; return; }
            if (unitIndex < convertedUnits.length) {
                const unit = convertedUnits[unitIndex];
                finalText += unit.hanzi;
                syllablesToSkip = unit.sourceCount - 1;
                unitIndex++;
            } else {
                finalText += token;
            }
        });

        finalText = finalText.replace(/\s+([，。、；：！？.,;:!?])/g, '$1').trim();
        finalText = finalText
            .replace(/,/g, '，').replace(/(?<!\.)\.(?!\.)/g, '。') 
            .replace(/\?/g, '？').replace(/!/g, '！').replace(/;/g, '；')
            .replace(/:/g, '：').replace(/\(/g, '（').replace(/\)/g, '）');

        return finalText;
    }

    function prepareDummyDOM() {
        let dummyContainer = document.getElementById('dummy-ruby-container');
        if (dummyContainer) return;
        dummyContainer = document.createElement('div');
        dummyContainer.id = 'dummy-ruby-container';
        dummyContainer.style.display = 'none'; 
        ['hanziInput', 'pinyinInput'].forEach(id => {
            let el = document.createElement('textarea');
            el.id = id; 
            el.readOnly = true; 
            el.setAttribute('inputmode', 'none'); 
            dummyContainer.appendChild(el);
        });
        document.body.appendChild(dummyContainer);
    }

    function loadRubyDictionary(langCode) {
        return new Promise((resolve, reject) => {
            const pyFile = LANGUAGES[langCode].pyFile;
            if (!pyFile) return resolve();

            if (dictCache[pyFile]) {
                window.pinyinMap = dictCache[pyFile].pinyinMap;
                window.masterRegex = dictCache[pyFile].masterRegex;
                return resolve();
            }

            const SCRIPT_ID = 'ruby-lang-db-script';
            const existingScript = document.getElementById(SCRIPT_ID);
            if (existingScript) existingScript.remove();

            const script = document.createElement('script');
            script.id = SCRIPT_ID;
            script.src = BASE_URL_RUBY + pyFile;
            script.onload = () => {
                if (typeof initializeConverter === 'function') {
                    initializeConverter();
                    dictCache[pyFile] = { pinyinMap: window.pinyinMap, masterRegex: window.masterRegex };
                }
                resolve();
            };
            script.onerror = () => reject('拼音字典載入失敗: ' + pyFile);
            document.head.appendChild(script);
        });
    }

    function getFileForPair(langA, langB) {
        const pair1 = `${langA}-${langB}`, pair2 = `${langB}-${langA}`;
        // 檢查是否有直接對應的資料庫檔案
        if (DIRECT_PAIRS[pair1]) return DIRECT_PAIRS[pair1];
        if (DIRECT_PAIRS[pair2]) return DIRECT_PAIRS[pair2];
        
        // 如果沒有彼此的直接對應，檢查是否有與華語的對應
        if (langA === 'chinese') return LANGUAGES[langB]?.file;
        if (langB === 'chinese') return LANGUAGES[langA]?.file;
        
        return null;
    }

    async function fetchDictionaryByFile(fileName) {
        if (!fileName) return null;
        if (dictCache[fileName]) return dictCache[fileName];
        await ensureTranslatorModules(); // 確保 setupDictionaries 等遠端模組已載入
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = BASE_URL_TRANS + fileName;
            script.onload = () => {
                if (typeof ww !== 'undefined') { dictCache[fileName] = setupDictionaries(ww); ww = undefined; } 
                else { dictCache[fileName] = true; }
                resolve(dictCache[fileName]); 
                script.remove();
            };
            script.onerror = () => reject(`網路連線失敗: ${fileName}`);
            document.body.appendChild(script);
        });
    }

    async function executeTranslation(from, to, text) {
        if (from === to || !text) return text;
        const file = getFileForPair(from, to);
        if (!file) return text;
        const dicts = await fetchDictionaryByFile(file);
        if (!dicts) return text;

        let direction = 'KG';
        if (DIRECT_PAIRS[`${to}-${from}`]) direction = 'GK';
        else if (from === 'chinese') direction = 'GK';
        
        const re = direction === 'GK' ? dicts.reGK : dicts.reKG;
        const map = direction === 'GK' ? dicts.mapGK : dicts.mapKG;
        return GoixBasic(text, re, map, dicts.reVariant, dicts.mapVariant, "");
    }

    function doSegmentText(text, dicts, isSourceChinese, separator = ' ') {
        if (!text || !dicts) return text;
        
        // 1. 替換異體字
        let result = text.replace(dicts.reVariant, (match) => dicts.mapVariant.get(match));
        const re = isSourceChinese ? dicts.reTonv : dicts.reKG;
        
        // 2. 從正則表達式中還原已經完美排序（長度 > 次數）的詞彙表
        const sortedWords = re.source.split('|').map(s => s.replace(/\\(.)/g, '$1'));

        // 3. 陣列分塊切割法 (全域最長詞優先)
        let chunks = [{ text: result, isWord: false }];
        
        for (let word of sortedWords) {
            let hasMatch = false;
            for (let chunk of chunks) {
                if (!chunk.isWord && chunk.text.includes(word)) {
                    hasMatch = true;
                    break;
                }
            }
            if (!hasMatch) continue;

            let newChunks = [];
            for (let chunk of chunks) {
                if (chunk.isWord) {
                    newChunks.push(chunk); 
                    continue;
                }
                
                let parts = chunk.text.split(word);
                for (let j = 0; j < parts.length; j++) {
                    if (parts[j].length > 0) {
                        newChunks.push({ text: parts[j], isWord: false });
                    }
                    if (j < parts.length - 1) {
                        newChunks.push({ text: word, isWord: true });
                    }
                }
            }
            chunks = newChunks;
        }
        
        // 4. 重組字串並加上標記
        const marker = "";
        result = chunks.map(c => c.isWord ? marker + c.text + marker : c.text).join('');
        
        // 5. 將標記符替換為外部傳入的分隔符號 (separator)
        result = result.replace(new RegExp(marker + '{1,2}', 'g'), separator);
        
        // 6. 清理頭尾多餘的分隔符號
        // 為了防止 separator 是正則特殊符號 (如 . 或 *)，先進行逸脫處理
        const escapeSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result.replace(new RegExp('^' + escapeSeparator + '|' + escapeSeparator + '$', 'g'), '');

        return result.trim();
    }

    // --- 6. 抽出轉換核心執行器 ---
    async function performConversion(actionMode) {
        const source = transState.source;
        const target = transState.target;
        const pivot = transState.pivot;

        const originalBtnText = btnExecute.innerHTML;
        btnExecute.innerHTML = "🥷...";
        btnExecute.disabled = true;

		try {
            await ensureTranslatorModules();
            // 攔截進階資料庫比對邏輯 (完全符合、所有符合、模糊符合)
            // 在 performConversion 頂部攔截進階資料庫的部分：
            if (['exact', 'all', 'fuzzy'].includes(actionMode)) {
                const source = transState.source;
                const target = transState.target;
                
                // 真實尋找檔案，不再偽裝
                const file = getFileForPair(source, target);
                
                if (!file) { alert("此語言組合沒有直接對應的資料庫"); return; }
                const dicts = await fetchDictionaryByFile(file);
                if (!dicts) { alert("資料庫載入失敗"); return; }

                let direction = 'KG';
                if (DIRECT_PAIRS[`${target}-${source}`]) direction = 'GK';
                else if (source === 'chinese') direction = 'GK';
                
                const mapForward = direction === 'GK' ? dicts.mapGK : dicts.mapKG;
                const mapBackward = direction === 'GK' ? dicts.mapKG : dicts.mapGK;

                // 核心比對邏輯 (雙向掃描，保留原始優先次序)
                const getMatches = (word) => {
                    let results = [];
                    
                    if (actionMode === 'exact') {
                        // 完全符合：優先從反向字典(保留原始排序)中找第一筆
                        for (let [k, v] of mapBackward.entries()) {
                            if (v === word || v.split(/[\s、，,]+/).includes(word)) {
                                results.push(k.split(/[\s、，,]+/)[0]);
                                break;
                            }
                        }
                        // 若找不到，再從正向字典找
                        if (results.length === 0 && mapForward.has(word)) {
                            results.push(mapForward.get(word).split(/[\s、，,]+/)[0]);
                        }


					} else if (actionMode === 'all') {
						for (let [k, v] of mapBackward.entries()) {
							if (v === word || (v.includes(word) && v.split(/[\s、，,]+/).includes(word))) {
								results.push(...k.split(/[\s、，,]+/));
							}
						}
						if (mapForward.has(word)) {
							results.push(...mapForward.get(word).split(/[\s、，,]+/));
						}
					} else if (actionMode === 'fuzzy') {
                        // 模糊符合
                        for (let [k, v] of mapBackward.entries()) {
                            if (v.includes(word) || word.includes(v)) {
                                results.push(...k.split(/[\s、，,]+/));
                            }
                        }
                        for (let [k, v] of mapForward.entries()) {
                            if (k.includes(word) || word.includes(k)) {
                                results.push(...v.split(/[\s、，,]+/));
                            }
                        }
                    }
                    
                    // 去除重複項目並過濾空值，完美輸出！
                    return [...new Set(results)].filter(Boolean);
                };

                const editor = document.getElementById('editor');
                const tableContainer = document.getElementById('tableModeContainer');
                const isTableMode = tableContainer && window.getComputedStyle(tableContainer).display !== 'none';

                // 文字模式處理：行後加 TAB
                if (!isTableMode && editor && currentMode === 'text') { // 🌟 修正：確保只有文字模式才寫入 editor
                    const start = editor.selectionStart, end = editor.selectionEnd;
                    let text = (start !== end) ? editor.value.substring(start, end) : editor.value;
                    let lines = text.split('\n');
                    let newLines = lines.map(line => {
                        let word = line.trim();
                        if (!word) return line;
                        let matches = getMatches(word);
                        if (matches.length > 0) {
                            return line + '\t' + matches.join('、');
                        }
                        return line;
                    });
                    let newText = newLines.join('\n');
                    
                    if (start !== end) editor.setRangeText(newText, start, end, 'select');
                    else editor.value = newText;
                    
                    debouncedSaveHistory();
                    showToast('✅ 比對完成');
                } 
                // 表格模式處理：右側新增一欄
                else if (isTableMode) {
                    let selectedCells = Array.from(document.querySelectorAll('table#data-table td.sel-bg .td-inner'));
                    if (selectedCells.length === 0) {
                        let activeCell = document.activeElement.closest('.td-inner') || (document.activeElement.classList && document.activeElement.classList.contains('td-inner') ? document.activeElement : null);
                        if (!activeCell) {
                            const allTds = document.querySelectorAll('table#data-table td');
                            const singleSelectedTd = Array.from(allTds).find(td => td.style.boxShadow && td.style.boxShadow.includes('inset'));
                            if (singleSelectedTd) activeCell = singleSelectedTd.querySelector('.td-inner');
                        }
                        if (activeCell) selectedCells.push(activeCell);
                    }
                    if (selectedCells.length === 0) { alert("請先選取要比對的儲存格範圍！"); return; }

                    // 找出所有被選取的欄位索引
                    let colIndices = new Set();
                    selectedCells.forEach(cell => {
                        let td = cell.closest('td');
                        let cIdx = Array.from(td.parentNode.children).indexOf(td) - 1;
                        colIndices.add(cIdx);
                    });
                    
                    // 由右至左處理，避免新增欄位時擠壓到原始索引
                    let cols = Array.from(colIndices).sort((a,b) => b - a);

                    for (let cIdx of cols) {
                        insertColumnRightOf(cIdx);
                        
                        let tbodyRows = dataTable.querySelectorAll('tbody tr');
                        for (let r = 0; r < tbodyRows.length; r++) {
                            let tr = tbodyRows[r];
                            let origInner = tr.children[cIdx + 1]?.querySelector('.td-inner');
                            let newInner = tr.children[cIdx + 2]?.querySelector('.td-inner');
                            
                            if (origInner && newInner) {
                                let word = origInner.innerText.trim();
                                if (word) {
                                    let matches = getMatches(word);
                                    if (matches.length > 0) {
                                        newInner.innerText = matches.join('、');
                                    }
                                }
                            }
                        }
                    }
                    updateTableHeaders();
                    saveColNames(); saveColWidths();
                    debouncedSaveHistory();
                    showToast('✅ 比對完成，已在右側新增比對結果');
                }
                // 🌟 新增：支援 Live、Arena、Chat 模式下的進階比對與便利貼
                else if (currentMode !== 'text' && currentMode !== 'table') {
                    
                    // 1. 優先處理白板便利貼的「多選」轉換
                    let selectedNotes = document.querySelectorAll('.sticky-note.ring-2');
                    if (selectedNotes.length > 0) {
                        const activeQId = window.currentSpaceData?.currentQuestionData?.id;
                        let currentMods = {};
                        if (activeQId) currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};

                        for (const note of selectedNotes) {
                            const contentEl = note.querySelector('.note-text-content');
                            if (contentEl) {
                                let originalText = contentEl.innerText || contentEl.textContent;
                                let newText = await processText(originalText);
                                contentEl.innerText = newText; // 畫面更新
                                
                                // 更新便利貼摺疊時顯示的第一個字
                                const bodyEl = note.querySelector('.note-body');
                                if (bodyEl) bodyEl.setAttribute('data-first-char', (newText || '').trim().charAt(0) || '');

                                // 準備寫入資料庫
                                const noteId = note.dataset.id;
                                if (activeQId && noteId) {
                                    currentMods[noteId] = { ...currentMods[noteId], text: newText };
                                }
                            }
                        }

                        // 同步到 Firebase
                        if (activeQId && window.currentSpaceCode) {
                            await db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods });
                        }
                        if (typeof debouncedSaveHistory === 'function') debouncedSaveHistory();
                        showToast('✅ 便利貼轉換完成');
                        return; // 結束執行
                    }

                    // 2. 以下保留原本處理輸入框與純文字反白的邏輯
                    let activeEl = document.activeElement;
                    let isInputTarget = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
                    // 引用追蹤器找回輸入框
                    if (!isInputTarget && window.lastFocusedInput && document.body.contains(window.lastFocusedInput)) {
                        activeEl = window.lastFocusedInput;
                        isInputTarget = true;
                    }
                    if (isInputTarget) {
                        const start = activeEl.selectionStart, end = activeEl.selectionEnd;
                        let text = (start !== end) ? activeEl.value.substring(start, end) : activeEl.value;
                        let lines = text.split('\n');
                        let newLines = lines.map(line => {
                            let word = line.trim();
                            if (!word) return line;
                            let matches = getMatches(word);
                            return matches.length > 0 ? line + '\t' + matches.join('、') : line;
                        });
                        let newText = newLines.join('\n');
                        if (start !== end) activeEl.setRangeText(newText, start, end, 'select');
                        else activeEl.value = newText;
                        
                        activeEl.dispatchEvent(new Event('input', { bubbles: true }));
                        showToast('✅ 比對完成');
                    }
                }
                return; // 結束執行
            }

            const processText = async (text) => {
                // A. 處理拼音相關
                if (source === 'pinyin' || target === 'pinyin') {
                    const langCode = source === 'pinyin' ? target : source;
                    const pyFile = LANGUAGES[langCode].pyFile;
                    
                    if (pyFile) {
                        prepareDummyDOM();
                        await loadScript('https://gnisew.github.io/tools/turn/pinyin2/data-pinyin2pinyin.js');
                        await loadScript('https://gnisew.github.io/tools/ruby/hanzitopinyin.js');

                        if (target === 'pinyin') {
                            window.currentLanguageKey = langCode;
                            await loadRubyDictionary(langCode);

                            // 關鍵修改：支援 segment 與 segment_underscore
                            if (actionMode === 'segment' || actionMode === 'segment_underscore') {
                                // --- FMM 空格斷詞演算法 ---
                                const map = window.pinyinMap;
                                if (!map || map.size === 0) return text;

                                let maxLen = 0;
                                for (const key of map.keys()) {
                                    if (key.length > maxLen) maxLen = key.length;
                                }

                                const resultTokens = [];
                                let i = 0;
                                const len = text.length;

                                while (i < len) {
                                    let matched = false;
                                    let currentMax = Math.min(maxLen, len - i);
                                    for (let l = currentMax; l >= 1; l--) {
                                        const sub = text.substr(i, l);
                                        if (map.has(sub)) {
                                            resultTokens.push(sub);
                                            i += l;
                                            matched = true;
                                            break;
                                        }
                                    }
                                    if (!matched) {
                                        resultTokens.push(text[i]);
                                        i++;
                                    }
                                }

                                // 依照選項套用對應的連接符號
                                const separator = (actionMode === 'segment_underscore') ? '_' : ' ';
                                let raw = resultTokens.join(separator);
                                
                                let lines = raw.split('\n').map(line => {
                                    // 使用正則動態清除多餘的分隔符號
                                    let processed = line.replace(new RegExp('\\' + separator + '+', 'g'), separator);
                                    processed = processed.replace(new RegExp('^\\' + separator + '|\\' + separator + '$', 'g'), '');
                                    return processed.length > 0 ? separator + processed + separator : processed;
                                });
                                return lines.join('\n').trim();
                            } else if (actionMode === 'bracket_trans') {
                                // --- 字〔yin〕華 複合翻譯演算法 ---
                                
                                // 第一步：取得華語翻譯
                                let chineseTrans = text;
                                if (source !== 'chinese') {
                                    let currentSrc = source;
                                    if (pivot !== 'direct' && pivot !== '') {
                                        chineseTrans = await executeTranslation(currentSrc, pivot, chineseTrans);
                                        currentSrc = pivot;
                                    }
                                    if (currentSrc !== 'chinese') {
                                        chineseTrans = await executeTranslation(currentSrc, 'chinese', chineseTrans);
                                    }
                                }

                                // 第二步：取得 字〔yin〕格式
                                let hiddenHanzi = document.getElementById('hanziInput');
                                let hiddenPinyin = document.getElementById('pinyinInput');
                                hiddenHanzi.value = text;
                                hiddenPinyin.value = ''; 
                                
                                if (typeof hanziToPinyin === 'function') {
                                    hanziToPinyin('bracket');
                                }
                                
                                let bracketResult = hiddenPinyin.value || text;

                                // 第三步：逐行合併排版
                                let origLines = text.split('\n');
                                let bLines = bracketResult.split('\n');
                                let cLines = chineseTrans.split('\n');
                                let combined = [];
                                
                                for (let i = 0; i < Math.max(bLines.length, cLines.length); i++) {
                                    let orig = (origLines[i] || '').trim();
                                    let b = (bLines[i] || '').trim();
                                    let c = (cLines[i] || '').trim();
                                    
                                    // 只有當翻譯結果不同於原文時，才加上華語翻譯 (防呆，避免：朋友〔pen giu〕：朋友)
                                    if (b && c && c !== orig) {
                                        let line = `${b}：${c}`;
                                        // 智慧標點：如果沒有以標點符號結尾，幫它補上句號
                                        if (!/[。！？.!?]$/.test(line)) line += '。';
                                        combined.push(line);
                                    } else if (b) {
                                        combined.push(b);
                                    } else if (c) {
                                        combined.push(c);
                                    } else {
                                        combined.push('');
                                    }
                                }
                                return combined.join('\n');

                            } else {
                                // --- 一般字轉音 ---
                                let hiddenHanzi = document.getElementById('hanziInput');
                                let hiddenPinyin = document.getElementById('pinyinInput');
                                hiddenHanzi.value = text;
                                hiddenPinyin.value = ''; 
                                
                                if (typeof hanziToPinyin === 'function') {
                                    hanziToPinyin(actionMode === 'default' ? undefined : actionMode);
                                }
                                
                                const result = hiddenPinyin.value;
                                return result && result.trim() !== '' ? result : text; 
                            }
                        } 
                        else {
                            window.currentLanguageKey = langCode;
                            await loadScript('https://gnisew.github.io/tools/ime/ime-dict.js');
                            initializeImeDicts(); 
                            
                            const result = pinyinToHanziEngine(text, langCode);
                            return result && result.trim() !== '' ? result : text; 
                        }
                    }
                    return text;
                }

                // B. 一般翻譯流程 
                let currentText = text;
                let currentFrom = source;
                const proxyFrom = getProxyTarget(currentFrom);
                if (proxyFrom && target !== proxyFrom) {
                    currentText = await executeTranslation(currentFrom, proxyFrom, currentText);
                    currentFrom = proxyFrom;
                }
                const proxyTo = getProxyTarget(target);
                const effectiveTo = (proxyTo && currentFrom !== proxyTo) ? proxyTo : target;


                if (target === 'segment') {
                    let segLang = currentFrom;
                    // 若是多層路徑，抓最後一個中介當作分詞參考語
                    if (currentFrom === 'chinese' || !LANGUAGES[currentFrom].file) {
                        segLang = transState.pivot.split(',').pop(); 
                    }
                    if (!segLang || segLang === 'direct') segLang = 'kasu';

                    // 支援多層陣列的接力翻譯
                    if (pivot !== 'direct' && pivot !== '') {
                        const pivotSteps = pivot.split(',');
                        for (const p of pivotSteps) {
                            if (currentFrom !== p) {
                                currentText = await executeTranslation(currentFrom, p, currentText);
                                currentFrom = p;
                            }
                        }
                    }

                    const segFile = getFileForPair('chinese', segLang);
                    const dictsSeg = await fetchDictionaryByFile(segFile);
                    
                    const separator = (actionMode === 'segment_space') ? ' ' : '_';
                    currentText = doSegmentText(currentText, dictsSeg, currentFrom === 'chinese', separator);
                } else {
                    // 支援多層陣列的接力翻譯
                    if (pivot !== 'direct' && pivot !== '') {
                        const pivotSteps = pivot.split(',');
                        for (const p of pivotSteps) {
                            if (currentFrom !== p) {
                                currentText = await executeTranslation(currentFrom, p, currentText);
                                currentFrom = p;
                            }
                        }
                    }
                    
                    if (currentFrom !== target) {
                        currentText = await executeTranslation(currentFrom, target, currentText);
                    }
                }
                return currentText;
			};

            const editor = document.getElementById('editor');
            const isTableMode = currentMode === 'table';

            // =======================================================
            // ✨ 核心修正：嚴格依據模式隔離執行邏輯，防止焦點互相綁架
            // =======================================================
            if (isTableMode) {
                // --- 表格模式專屬處理 ---
                const tableContainer = document.getElementById('tableModeContainer');
                const sel = window.getSelection();
                const hasDivSelection = sel && sel.toString().trim().length > 0;

                if (hasDivSelection && tableContainer && tableContainer.contains(sel.anchorNode)) {
                    // 處理儲存格內的「純文字反白」
                    let text = await processText(sel.toString());
                    const range = sel.getRangeAt(0); 
                    range.deleteContents(); 
                    range.insertNode(document.createTextNode(text));
                } else {
                    // 處理單一或多個「儲存格選取」
                    let selectedCells = Array.from(document.querySelectorAll('table#data-table td.sel-bg .td-inner'));
                    if (selectedCells.length === 0) {
                        let activeCell = document.activeElement.closest('.td-inner') || (document.activeElement.classList && document.activeElement.classList.contains('td-inner') ? document.activeElement : null);
                        if (!activeCell) {
                            const allTds = document.querySelectorAll('table#data-table td');
                            const singleSelectedTd = Array.from(allTds).find(td => td.style.boxShadow && td.style.boxShadow.includes('inset'));
                            if (singleSelectedTd) activeCell = singleSelectedTd.querySelector('.td-inner');
                        }
                        if (activeCell) selectedCells.push(activeCell);
                    }
                    if (selectedCells.length === 0) { alert("請先選取要處理的文字或儲存格！"); return; }
                    
                    const SAFE_SEP = '\n\uFDD0\n';
                    const DUMMY_PREFIX = '\uFDD1';
                    const DUMMY_SUFFIX = '\uFDD2';         
                    const originalTexts = selectedCells.map(cell => cell.innerText || cell.textContent);
                    const combinedText = DUMMY_PREFIX + originalTexts.join(SAFE_SEP) + DUMMY_SUFFIX;
                    
                    let processedCombined = await processText(combinedText);
                    
                    if (processedCombined.startsWith(DUMMY_PREFIX)) processedCombined = processedCombined.substring(DUMMY_PREFIX.length);
                    if (processedCombined.endsWith(DUMMY_SUFFIX)) processedCombined = processedCombined.substring(0, processedCombined.length - DUMMY_SUFFIX.length);
                    
                    const processedTexts = processedCombined.split(SAFE_SEP);
                    
                    for (let i = 0; i < selectedCells.length; i++) {
                        const cell = selectedCells[i];
                        const newText = processedTexts[i] !== undefined ? processedTexts[i] : await processText(originalTexts[i]);
                        cell.innerText = newText;
                        if (cell.hasAttribute('data-formula')) cell.removeAttribute('data-formula');
                    }
                }
            } 
            else if (currentMode === 'text' && editor) {
                // --- 文字模式專屬處理 ---
                let start = 0, end = 0;
                try { start = editor.selectionStart; end = editor.selectionEnd; } catch(e) {}
                let text = (start !== end) ? editor.value.substring(start, end) : editor.value;
                text = await processText(text);
                
                if (start !== end) {
                    try { editor.setRangeText(text, start, end, 'select'); } catch(e) { editor.value = text; }
                } else {
                    editor.value = text;
                }
            } 
            else {
                // --- 其他模式處理 (Live / Chat / 便利貼) ---
                let selectedNotes = document.querySelectorAll('.sticky-note.ring-2');
                if (selectedNotes.length > 0) {
                    const activeQId = window.currentSpaceData?.currentQuestionData?.id;
                    let currentMods = {};
                    if (activeQId) currentMods = window.currentSpaceData[`board_mods_${activeQId}`] || {};

                    const SAFE_SEP = '\n\uFDD0\n';
                    const DUMMY_PREFIX = '\uFDD1';
                    const DUMMY_SUFFIX = '\uFDD2';

                    const notesArray = Array.from(selectedNotes);
                    const originalTexts = notesArray.map(note => {
                        const contentEl = note.querySelector('.note-text-content');
                        return contentEl ? (contentEl.innerText || contentEl.textContent) : '';
                    });

                    const combinedText = DUMMY_PREFIX + originalTexts.join(SAFE_SEP) + DUMMY_SUFFIX;
                    let processedCombined = await processText(combinedText);

                    if (processedCombined.startsWith(DUMMY_PREFIX)) processedCombined = processedCombined.substring(DUMMY_PREFIX.length);
                    if (processedCombined.endsWith(DUMMY_SUFFIX)) processedCombined = processedCombined.substring(0, processedCombined.length - DUMMY_SUFFIX.length);

                    const processedTexts = processedCombined.split(SAFE_SEP);

                    for (let i = 0; i < notesArray.length; i++) {
                        const note = notesArray[i];
                        const contentEl = note.querySelector('.note-text-content');
                        if (contentEl) {
                            let newText = processedTexts[i] !== undefined ? processedTexts[i] : await processText(originalTexts[i]);
                            contentEl.innerText = newText; 
                            
                            const bodyEl = note.querySelector('.note-body');
                            if (bodyEl) bodyEl.setAttribute('data-first-char', (newText || '').trim().charAt(0) || '');

                            const noteId = note.dataset.id;
                            if (activeQId && noteId) {
                                currentMods[noteId] = { ...currentMods[noteId], text: newText };
                            }
                        }
                    }
                    if (activeQId && window.currentSpaceCode && typeof db !== 'undefined') {
                        db.collection(window.SPACES_COLLECTION).doc(window.currentSpaceCode).update({ [`board_mods_${activeQId}`]: currentMods }).catch(()=>{});
                    }
                    if (typeof debouncedSaveHistory === 'function') debouncedSaveHistory();
                    showToast('✅ 便利貼翻譯完成');
                    return; 
                }

                const sel = window.getSelection();
                const hasDivSelection = sel && sel.toString().trim().length > 0;

                let activeEl = document.activeElement; 
                let isInputTarget = activeEl && (activeEl.tagName === 'TEXTAREA' || (activeEl.tagName === 'INPUT' && ['text', 'search', 'number', 'password', 'url', 'tel'].includes(activeEl.type)));

                if (!hasDivSelection && !isInputTarget && window.lastFocusedInput && document.body.contains(window.lastFocusedInput)) {
                    activeEl = window.lastFocusedInput;
                    isInputTarget = true;
                }

                if (isInputTarget && activeEl !== editor) {
                    let start = 0, end = 0;
                    try { start = activeEl.selectionStart; end = activeEl.selectionEnd; } catch(e) {}
                    let text = (start !== end) ? activeEl.value.substring(start, end) : activeEl.value;
                    text = await processText(text);
                    
                    if (start !== end) {
                        try { activeEl.setRangeText(text, start, end, 'select'); } catch(e) { activeEl.value = text; }
                    } else {
                        activeEl.value = text;
                    }
                    activeEl.dispatchEvent(new Event('input', { bubbles: true }));
                } 
                else if (hasDivSelection) {
                    const originalText = sel.toString();
                    let text = await processText(originalText);
                    const range = sel.getRangeAt(0); 
                    range.deleteContents(); 
                    range.insertNode(document.createTextNode(text));
                }
            }
            
            debouncedSaveHistory();
        } catch (err) {
            console.error("轉換發生錯誤:", err); 
            alert("轉換發生錯誤，詳細請查看主控台 (Console)。");
        } finally {
            btnExecute.innerHTML = originalBtnText; 
            checkButtonState();
        }
    }

    if (btnExecute) {
        btnExecute.addEventListener('click', () => {
            performConversion('default');
        });
    }

    initDropdowns();
    updateCapsuleButtonUI();
    updatePivotOptions();




// ========== 以下是對話模式與翻譯系統的共用邏輯 ==========
    const chatInput = document.getElementById('chatInput');
    const btnSendChat = document.getElementById('btnSendChat');
    const chatMessagesArea = document.getElementById('chatMessagesArea');
    const chatConvertToPinyin = document.getElementById('chatConvertToPinyin');
    
    // 對話模式設定開關
    const chatModeContainer = document.getElementById('chatModeContainer');
    const chatToggleNumber = document.getElementById('chatToggleNumber');
    const chatToggleEmoji = document.getElementById('chatToggleEmoji');
    const chatToggleDelete = document.getElementById('chatToggleDelete');
    const chatToggleLangName = document.getElementById('chatToggleLangName'); // 補回語言開關

    function updateChatDisplaySettings() {
        if (chatToggleNumber && chatToggleNumber.checked) chatModeContainer.classList.add('show-numbers');
        else chatModeContainer.classList.remove('show-numbers');
        
        if (chatToggleEmoji && chatToggleEmoji.checked) chatModeContainer.classList.add('show-emojis');
        else chatModeContainer.classList.remove('show-emojis');

        if (chatToggleDelete && chatToggleDelete.checked) chatModeContainer.classList.add('show-delete');
        else chatModeContainer.classList.remove('show-delete');
        
        if(chatToggleNumber) localStorage.setItem('wesing-chat-show-number', chatToggleNumber.checked);
        if(chatToggleEmoji) localStorage.setItem('wesing-chat-show-emoji', chatToggleEmoji.checked);
        if(chatToggleDelete) localStorage.setItem('wesing-chat-show-delete', chatToggleDelete.checked);
        if(chatToggleLangName) localStorage.setItem('wesing-chat-show-lang-name', chatToggleLangName.checked); // 記憶語言開關
    }

    if (chatToggleNumber && chatToggleEmoji) {
        // 讀取記憶
        const savedShowNum = localStorage.getItem('wesing-chat-show-number');
        if (savedShowNum !== null) chatToggleNumber.checked = (savedShowNum === 'true');
        
        const savedShowEmoji = localStorage.getItem('wesing-chat-show-emoji');
        if (savedShowEmoji !== null) chatToggleEmoji.checked = (savedShowEmoji === 'true');

        const savedShowDelete = localStorage.getItem('wesing-chat-show-delete');
        if (savedShowDelete !== null && chatToggleDelete) chatToggleDelete.checked = (savedShowDelete === 'true');

        // 讀取語言開關的記憶
        const savedShowLangName = localStorage.getItem('wesing-chat-show-lang-name');
        if (savedShowLangName !== null && chatToggleLangName) chatToggleLangName.checked = (savedShowLangName === 'true');

        chatToggleNumber.addEventListener('change', updateChatDisplaySettings);
        chatToggleEmoji.addEventListener('change', updateChatDisplaySettings);
        if (chatToggleDelete) chatToggleDelete.addEventListener('change', updateChatDisplaySettings);
        if (chatToggleLangName) chatToggleLangName.addEventListener('change', updateChatDisplaySettings); // 綁定事件

        updateChatDisplaySettings(); // 執行初始套用

        document.querySelector('#dd-chatSettings .dropdown-menu')?.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // 建立對話模式獨立的狀態，預設讀取原本的記憶
    let chatTransState = {
        source: localStorage.getItem('translate_source_lang') || 'chinese',
        target: localStorage.getItem('translate_target_lang') || 'kasu',
        pivot: 'direct'
    };

    if (chatInput && btnSendChat) {
        
        // 更新：預先載入翻譯字典與拼音引擎 (加入拼音轉文字的 IME 字典)
        async function preloadChatDictionaries() {
            const { source, target, pivot } = chatTransState;
            const needPinyin = chatConvertToPinyin.checked;
            
            // A. 預載翻譯字典
            const loadTrans = async (from, to) => {
                if (from === to) return;
                const file = getFileForPair(from, to);
                if (file) await fetchDictionaryByFile(file);
            };

            if (source !== target && source !== 'pinyin' && target !== 'pinyin') {
                let currentFrom = source;
                const proxyFrom = getProxyTarget(currentFrom);
                if (proxyFrom && target !== proxyFrom) {
                    await loadTrans(currentFrom, proxyFrom);
                    currentFrom = proxyFrom;
                }
                const proxyTo = getProxyTarget(target);
                const effectiveTo = (proxyTo && currentFrom !== proxyTo) ? proxyTo : target;

                if (pivot && pivot !== 'direct') {
                    for (const p of pivot.split(',')) {
                        if (currentFrom !== p) {
                            await loadTrans(currentFrom, p);
                            currentFrom = p;
                        }
                    }
                }
                if (currentFrom !== effectiveTo) {
                    await loadTrans(currentFrom, effectiveTo);
                }
            }

            // B. 預載拼音轉文字引擎 (IME Dictionary)
            if (source === 'pinyin') {
                await loadScript('https://gnisew.github.io/tools/ime/ime-dict.js');
                if (typeof initializeImeDicts === 'function') {
                    initializeImeDicts();
                }
            }

            // C. 預載標音引擎與字典 (純轉拼音 或 翻譯後附帶拼音)
            if (target === 'pinyin' || (needPinyin && target !== 'pinyin')) {
                const langToLoad = target === 'pinyin' ? source : target; 
                await loadScript('https://gnisew.github.io/tools/turn/pinyin2/data-pinyin2pinyin.js');
                await loadScript('https://gnisew.github.io/tools/ruby/hanzitopinyin.js');
                window.currentLanguageKey = langToLoad;
                await loadRubyDictionary(langToLoad);
            }
        }

        // 動態管理介面狀態
        function updateChatUIState() {
            const source = chatTransState.source;
            const target = chatTransState.target;
            
            // 1. 動態隱藏/顯示「拼音」目標選項 (判斷來源是否有拼音)
            const targetPinyinOption = document.querySelector('#chat-dropdown-target .dropdown-item[data-value="pinyin"]');
            const sourceHasPinyin = LANGUAGES[source] && LANGUAGES[source].pyFile;
            
            if (targetPinyinOption) {
                if (sourceHasPinyin) {
                    targetPinyinOption.style.display = 'block'; 
                } else {
                    targetPinyinOption.style.display = 'none';  
                    
                    if (target === 'pinyin') {
                        chatTransState.target = (source === 'chinese' ? 'kasu' : 'chinese');
                        document.getElementById('chat-target-btn').textContent = LANGUAGES[chatTransState.target].name;
                        localStorage.setItem('translate_target_lang', chatTransState.target);
                        showToast(`⚠️ ${LANGUAGES[source].name} 無拼音對應，已自動切換目標`);
                    }
                }
            }

            // 2. 動態控制「附帶拼音」核取方塊 (判斷目標是否有拼音)
            const checkboxLabel = chatConvertToPinyin.closest('label');
            const targetHasPinyin = LANGUAGES[chatTransState.target] && LANGUAGES[chatTransState.target].pyFile;

            if (chatTransState.target === 'pinyin') {
                // 情境 A：目標就是拼音 ➔ 強制打勾並鎖定
                chatConvertToPinyin.checked = true;
                chatConvertToPinyin.disabled = true;
                if (checkboxLabel) {
                    checkboxLabel.style.opacity = '0.5';
                    checkboxLabel.title = '';
                }
            } else if (!targetHasPinyin) {
                // 情境 B：目標語言沒有拼音資料庫 (如華語、馬祖) ➔ 強制取消打勾並鎖定
                chatConvertToPinyin.checked = false;
                chatConvertToPinyin.disabled = true;
                if (checkboxLabel) {
                    checkboxLabel.style.opacity = '0.5';
                    checkboxLabel.title = `⚠️ ${LANGUAGES[chatTransState.target]?.name || ''} 尚無拼音資料庫`;
                }
            } else {
                // 情境 C：恢復正常 ➔ 讀取使用者原本的記憶
                chatConvertToPinyin.disabled = false;
                if (checkboxLabel) {
                    checkboxLabel.style.opacity = '1';
                    checkboxLabel.title = '';
                }
                const savedPinyinCheck = localStorage.getItem('wesing-chat-pinyin-checked');
                if (savedPinyinCheck !== null) {
                    chatConvertToPinyin.checked = (savedPinyinCheck === 'true');
                }
            }
        }

        // 1. 初始化對話模式的下拉選單
        function initChatDropdowns() {
            // 👇 修改：預設讀取 SHORT_NAMES 單字
            document.getElementById('chat-source-btn').textContent = SHORT_NAMES[chatTransState.source] || '華';
            document.getElementById('chat-target-btn').textContent = SHORT_NAMES[chatTransState.target] || '詔';

            document.querySelectorAll('#chat-dropdown-source .dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    chatTransState.source = item.dataset.value;
                    // 👇 修改：按鈕顯示單字
                    document.getElementById('chat-source-btn').textContent = SHORT_NAMES[item.dataset.value] || '華';
                    localStorage.setItem('translate_source_lang', item.dataset.value);
                    
                    updateChatPivotOptions();
                    updateChatUIState(); 
                    e.target.closest('.dropdown-list').classList.remove('show');
                    preloadChatDictionaries(); 
                });
            });

            document.querySelectorAll('#chat-dropdown-target .dropdown-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    chatTransState.target = item.dataset.value;
                    
                    document.getElementById('chat-target-btn').textContent = SHORT_NAMES[item.dataset.value] || '詔'; 
                    
                    localStorage.setItem('translate_target_lang', item.dataset.value);
                    
                    updateChatPivotOptions();
                    updateChatUIState(); 
                    
                    e.target.closest('.dropdown-list').classList.remove('show');
                    preloadChatDictionaries(); 
                });
            });

            if (chatConvertToPinyin) {
                const savedPinyinCheck = localStorage.getItem('wesing-chat-pinyin-checked');
                if (savedPinyinCheck !== null) {
                    chatConvertToPinyin.checked = (savedPinyinCheck === 'true');
                }
                chatConvertToPinyin.addEventListener('change', (e) => {
                    localStorage.setItem('wesing-chat-pinyin-checked', e.target.checked);
                    preloadChatDictionaries();
                });
            }
        }

        // 共用 findPossiblePivots 來更新中介語言選單
        function updateChatPivotOptions() {
            const { source, target } = chatTransState;
            const pivotList = document.getElementById('chat-pivot-list');
            const pivotWrapper = document.getElementById('chat-dropdown-pivot');
            const pivotLabel = document.getElementById('chat-pivot-label');

            if (source === 'pinyin' || target === 'pinyin' || source === target) {
                pivotWrapper.style.opacity = '0.4';
                chatTransState.pivot = 'direct';
                pivotLabel.style.display = 'none';
                return;
            }
            
            pivotWrapper.style.opacity = '1';
            
            let canDirect = false;
            if (target === 'segment') {
                canDirect = (source === 'chinese' || LANGUAGES[source].file) ? true : false;
            } else {
                canDirect = hasDirectPath(source, target);
            }

            const possiblePivots = findPossiblePivots(source, target); 
            pivotList.innerHTML = '';
            
            // 建立選單項目的輔助函數 (加入打勾圖示)
            const createChatPivotItem = (value, text, isSelected) => {
                const item = document.createElement('div');
                item.className = 'dropdown-item flex items-center justify-between gap-3'; 
                item.dataset.value = value;
                
                item.innerHTML = `
                    <span>${text}</span>
                    <span class="material-symbols-outlined text-[18px] text-blue-600 font-bold" style="opacity: ${isSelected ? '1' : '0'};">check</span>
                `;
                
                item.onclick = (e) => {
                    chatTransState.pivot = value; 
                    pivotLabel.style.display = 'none'; // 按鈕永遠不顯示文字
                    e.target.closest('.dropdown-list').classList.remove('show');
                    preloadChatDictionaries();
                    updateChatPivotOptions(); // 重新渲染選單以更新打勾狀態
                };
                return item;
            };

            if (canDirect) {
                pivotList.appendChild(createChatPivotItem('direct', '直達', chatTransState.pivot === 'direct'));
            }

            possiblePivots.forEach(pKey => {
                const names = pKey.split(',').map(p => LANGUAGES[p].name);
                const isSelected = chatTransState.pivot === pKey;
                pivotList.appendChild(createChatPivotItem(pKey, names.join(' > '), isSelected));
            });

            // 設定預設值
            if (canDirect) {
                if (chatTransState.pivot !== 'direct' && !possiblePivots.includes(chatTransState.pivot)) {
                    chatTransState.pivot = 'direct';
                }
                if (!chatTransState.pivot) chatTransState.pivot = 'direct';
            } else {
                if (possiblePivots.length > 0) {
                    if (chatTransState.pivot === 'direct' || !possiblePivots.includes(chatTransState.pivot)) {
                        chatTransState.pivot = possiblePivots[0]; 
                    }
                } else {
                    chatTransState.pivot = '';
                }
            }

            // 🌟 永遠隱藏文字，讓按鈕只顯示箭頭
            pivotLabel.style.display = 'none'; 
            
            // 將目前的狀態寫入 title，滑鼠懸浮時可以看
            if (chatTransState.pivot === 'direct' || !chatTransState.pivot) {
                pivotWrapper.title = "設定中介語言 (目前：直達)";
            } else {
                const names = chatTransState.pivot.split(',').map(p => LANGUAGES[p].name);
                pivotWrapper.title = "設定中介語言 (目前：" + names.join(' > ') + ")";
            }
        }

        // 2. 聊天互動與發送
        const btnClearChatInput = document.getElementById('btnClearChatInput'); // 取得清除按鈕

        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            
            // 👇 動態顯示/隱藏清除按鈕
            if (btnClearChatInput) {
                if (this.value.length > 0) {
                    btnClearChatInput.classList.remove('hidden');
                } else {
                    btnClearChatInput.classList.add('hidden');
                }
            }
        });

        // 👇 綁定清除按鈕點擊事件
        if (btnClearChatInput) {
            btnClearChatInput.addEventListener('click', () => {
                chatInput.value = '';
                chatInput.style.height = 'auto';
                btnClearChatInput.classList.add('hidden');
                chatInput.focus(); // 清除後保持游標在輸入框
            });
        }

        // 判斷是否為手機等觸控裝置
        const isMobileDevice = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        
        // 依據裝置動態改變輸入框的提示文字，體驗更好
        if (isMobileDevice) {
            chatInput.placeholder = "輸入文字...";
        }

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                // 情境 1：如果按住 Shift 或 Alt，我們強制手動換行 (確保跨瀏覽器與系統皆有效)
                if (e.shiftKey || e.altKey) {
                    e.preventDefault(); // 阻擋預設行為
                    const start = chatInput.selectionStart;
                    const end = chatInput.selectionEnd;
                    // 在游標處插入換行符號
                    chatInput.value = chatInput.value.substring(0, start) + "\n" + chatInput.value.substring(end);
                    // 將游標移到換行符號的後面
                    chatInput.selectionStart = chatInput.selectionEnd = start + 1;
                    
                    // 手動觸發 input 事件，讓輸入框可以觸發原本寫好的自動長高邏輯
                    chatInput.dispatchEvent(new Event('input'));
                    return;
                }
                
                // 情境 2：單純按 Enter (沒有 Shift 也沒有 Alt)
                if (isMobileDevice) {
                    // 手機版：什麼都不攔截，讓原生 Enter 繼續發揮換行功能 (送出須按紙飛機)
                    return;
                } else {
                    // 電腦版：攔截預設換行，改為直接送出
                    e.preventDefault(); 
                    handleSendChat(); 
                }
            }
        });

        btnSendChat.addEventListener('click', handleSendChat);

        async function handleSendChat() {
            const text = chatInput.value.trim();
            if (!text) return;

            const { source, target, pivot } = chatTransState;
            const needPinyin = chatConvertToPinyin.checked;

            if (source === target && !needPinyin) {
                showToast('⚠️ 來源與目標語言相同，無需轉換');
                return;
            }

            chatInput.value = ''; chatInput.style.height = 'auto';
            appendChatMessage(text, true);

            const loadingWrapper = appendChatMessage('處理中...', false);
            const loadingBubble = loadingWrapper.querySelector('.chat-bubble');

            try {
                // 確保送出前資源皆已就緒
                await preloadChatDictionaries();

                let currentText = text;
                let pinyinText = "";
                const { source, target, pivot } = chatTransState;
                const needPinyin = chatConvertToPinyin.checked;

                if (source === 'pinyin') {
                    // 情境 A：拼音轉文字 (Pinyin to Hanzi)
                    window.currentLanguageKey = target; // 告訴引擎目標語言
                    if (typeof pinyinToHanziEngine === 'function') {
                        currentText = pinyinToHanziEngine(currentText, target);
                    }
                } else if (target === 'pinyin') {
                    // 情境 B：純文字轉拼音 (不經過翻譯)
                    prepareDummyDOM(); 
                    let hiddenHanzi = document.getElementById('hanziInput');
                    let hiddenPinyin = document.getElementById('pinyinInput');
                    
                    if (hiddenHanzi && hiddenPinyin) {
                        hiddenHanzi.value = currentText;
                        hiddenPinyin.value = '';
                        window.currentLanguageKey = source; 
                        
                        if (typeof hanziToPinyin === 'function') {
                            hanziToPinyin();
                            // 直接覆蓋，只輸出拼音
                            currentText = hiddenPinyin.value || currentText; 
                        }
                    }
                } else {
                    // 情境 C：一般雙向翻譯
                    if (source !== target) {
                        let currentFrom = source;
                        const proxyFrom = getProxyTarget(currentFrom);
                        if (proxyFrom && target !== proxyFrom) {
                            currentText = await executeTranslation(currentFrom, proxyFrom, currentText);
                            currentFrom = proxyFrom;
                        }
                        const proxyTo = getProxyTarget(target);
                        const effectiveTo = (proxyTo && currentFrom !== proxyTo) ? proxyTo : target;

                        if (pivot && pivot !== 'direct') {
                            for (const p of pivot.split(',')) {
                                if (currentFrom !== p) {
                                    currentText = await executeTranslation(currentFrom, p, currentText);
                                    currentFrom = p;
                                }
                            }
                        }
                        if (currentFrom !== effectiveTo) {
                            currentText = await executeTranslation(currentFrom, effectiveTo, currentText);
                        }
                    }
                }

                // 共同流程：一般翻譯 或 拼音轉文字後，若需「附帶拼音」，則產出標準拼音字串
                if (needPinyin && target !== 'pinyin') {
                    prepareDummyDOM(); 
                    let hiddenHanzi = document.getElementById('hanziInput');
                    let hiddenPinyin = document.getElementById('pinyinInput');
                    
                    if (hiddenHanzi && hiddenPinyin) {
                        hiddenHanzi.value = currentText;
                        hiddenPinyin.value = '';
                        window.currentLanguageKey = target;
                        
                        if (typeof hanziToPinyin === 'function') {
                            hanziToPinyin();
                            pinyinText = hiddenPinyin.value;
                        }
                    }
                }

                let effectiveOutputLang = target;
                if (effectiveOutputLang === 'pinyin' || effectiveOutputLang === 'segment') {
                    effectiveOutputLang = source;
                }
                const langName = LANGUAGES[effectiveOutputLang] ? LANGUAGES[effectiveOutputLang].name : '';
                const showLangName = document.getElementById('chatToggleLangName') && document.getElementById('chatToggleLangName').checked;

                // 如果有開啟，且有文字、有語言名稱，就組合在一起
                if (showLangName && currentText && langName) {
                    currentText = `${langName}：${currentText}`;
                }
				// 組合結果：如果是純轉拼音，pinyinText 為空，只會輸出 currentText
                const finalResult = pinyinText ? `${currentText}\n${pinyinText}` : currentText;
                const safeCurrent = currentText ? currentText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
                if (pinyinText) {
                    const safePinyin = pinyinText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    loadingBubble.innerHTML = safeCurrent ? `${safeCurrent}\n<span class="text-slate-500">${safePinyin}</span>` : `<span class="text-slate-500">${safePinyin}</span>`;
                } else {
                    loadingBubble.innerText = currentText;
                }
            } catch (err) {
                loadingBubble.innerText = '❌ 轉換發生錯誤';
                loadingBubble.classList.add('text-red-500');
                console.error(err);
            }
            chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
			debouncedSaveHistory();
        }

        // 新增第三個參數 pinyinText
        function appendChatMessage(text, isUser, pinyinText = '') {
            const msgCount = chatMessagesArea.querySelectorAll('.chat-message-wrapper').length + 1;
            
            // 最外層容器：讓系統與使用者的元素都沿著底部對齊 (items-end)
            const wrapper = document.createElement('div');
			wrapper.className = `chat-message-wrapper flex w-full mb-1 group ${isUser ? 'justify-end items-end' : 'justify-start items-end'}`;

            // 1. 頭像區塊 (僅系統回覆顯示，放在最左側)
            let avatarArea = null;
            if (!isUser) {
                avatarArea = document.createElement('div');
                avatarArea.className = 'chat-avatar-area flex-shrink-0 mr-2 flex flex-col items-center self-start mt-0.5';
                
                // 新增：設定各語言的專屬 Emoji
                const langEmojis = {
                    'sixian': '🦖',     // 四縣
                    'hailu': '🐳',      // 海陸
                    'dapu': '🐘',       // 大埔
                    'raoping': '🪅',    // 饒平
                    'kasu': '🐣',       // 詔安
                    'sixiannan': '🐦',  // 南四縣
                    'jinmen': '🦔',     // 金門
                    'holo': '🐿️',       // 和樂
                    'chinese': '🦜',    // 華語
                    'matsu': '🦄',       // 馬祖
                };
                
                // 動態判斷實際的「輸出語言」
                let effectiveLang = chatTransState.target;
                // 當轉為拼音或分詞時，輸出語言視為「來源語言」(A 語言)
                if (effectiveLang === 'pinyin' || effectiveLang === 'segment') {
                    effectiveLang = chatTransState.source;
                }

                let matchedLangKey = null;
                if (text) {
                    // 掃描所有語言，看看文字是否以「語言名稱：」開頭
                    for (const key in LANGUAGES) {
                        const langName = LANGUAGES[key].name;
                        // 同時支援全形與半形的冒號
                        if (text.startsWith(langName + '：') || text.startsWith(langName + ':')) {
                            matchedLangKey = key;
                            break; // 找到就停止掃描
                        }
                    }
                }
                
                // 如果文字自帶語言名稱前綴，優先使用該語言的 Emoji；否則使用系統當前的輸出語言
                const finalEmojiLang = matchedLangKey || effectiveLang;
                const sysEmoji = langEmojis[finalEmojiLang] || '🤖';

                // 加上 display: inline-block 與 transform: scaleX(-1) 讓 Emoji 完美轉向右邊！
                avatarArea.innerHTML = `<span class="chat-emoji text-[28px] leading-none" style="display: inline-block; transform: scaleX(-1);">${sysEmoji}</span>`;
            }

            // 2. 氣泡區塊
            const bubbleContainer = document.createElement('div');
            bubbleContainer.className = `chat-bubble-container relative max-w-[75%] md:max-w-[65%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`;
            
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble code-text ${isUser ? 'chat-bubble-user' : 'chat-bubble-system'}`;
            bubble.style.whiteSpace = 'pre-wrap';

			// 拼音色彩 text-slate-500
            const safeText = text ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
            if (pinyinText) {
                const safePinyin = pinyinText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                bubble.innerHTML = safeText ? `${safeText}\n<span class="text-slate-500">${safePinyin}</span>` : `<span class="text-slate-500">${safePinyin}</span>`;
            } else {
                bubble.innerText = text;
            }
            
            bubbleContainer.appendChild(bubble);

            // 3. 資訊區塊 (包含上方的動作按鈕與下方的編號，放在氣泡外側)
            const infoArea = document.createElement('div');
            infoArea.className = `chat-info-area flex flex-col pb-0.5 select-none ${isUser ? 'mr-2 items-end' : 'ml-2 items-start'}`;

            // 動作按鈕容器
            // 動作按鈕容器 (手機版常駐顯示並加大間距，電腦版維持 hover 顯示)
            const actions = document.createElement('div');
            actions.className = 'chat-actions flex gap-2 md:gap-0.5 mb-1 opacity-0 md:group-hover:opacity-100 transition-opacity duration-200';
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'text-gray-400 hover:text-blue-500 flex items-center justify-center p-1.5 md:p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer';
            copyBtn.title = "複製內容";
            copyBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">content_copy</span>';
            copyBtn.onclick = (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(bubble.innerText).then(() => {
                    const toast = document.getElementById('toast');
                    if(toast) { 
                        toast.textContent = '✅ 已複製'; 
                        toast.classList.remove('opacity-0'); 
                        if(toast.timer) clearTimeout(toast.timer);
                        toast.timer = setTimeout(() => { toast.classList.add('opacity-0'); toast.timer = null; }, 2000);
                    }
                });
            };

            const delBtn = document.createElement('button');
            delBtn.className = 'chat-btn-delete text-gray-400 hover:text-red-500 flex items-center justify-center p-1.5 md:p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer';
            delBtn.title = "刪除對話";
            delBtn.innerHTML = '<span class="material-symbols-outlined text-[16px]">delete</span>';
            delBtn.onclick = (e) => { 
                e.stopPropagation(); // 防止點擊範圍誤判冒泡
                
                // 先強制儲存當下(刪除前)的狀態，確保使用者可以隨時復原
                saveHistoryState(); 
                
                wrapper.remove(); 
                
                // 刪除後再次儲存新狀態
                saveHistoryState(); 
                showToast('🗑️ 對話已刪除 (可按 Ctrl+Z 復原)');
            };

            // 根據系統或使用者，改變按鈕的插入順序
            if (isUser) {
                actions.appendChild(delBtn);  // 左：刪除
                actions.appendChild(copyBtn); // 右：複製
            } else {
                actions.appendChild(copyBtn); // 左：複製
                actions.appendChild(delBtn);  // 右：刪除
            }

            const numSpan = document.createElement('span');
            numSpan.className = 'chat-number text-[12px] text-gray-400 leading-none px-1 pt-0.5';
            numSpan.innerText = `#${msgCount}`;

            infoArea.appendChild(actions);
            infoArea.appendChild(numSpan);

            // 4. 組裝 DOM 結構 (根據使用者或系統調整左右順序)
            if (isUser) {
                // 使用者：[資訊區(按鈕+編號)] -> [氣泡區]
                wrapper.appendChild(infoArea);
                wrapper.appendChild(bubbleContainer);
            } else {
                // 系統：[頭像區] -> [氣泡區] -> [資訊區(按鈕+編號)]
                if (avatarArea) wrapper.appendChild(avatarArea);
                wrapper.appendChild(bubbleContainer);
                wrapper.appendChild(infoArea);
            }
            
            wrapper.addEventListener('click', (e) => {
                // 判斷是否為觸控裝置 (手機/平板)
                if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
                    e.stopPropagation(); // 阻止事件冒泡到背景
                    
                    // 1. 先把其他已展開的按鈕全部隱藏
                    document.querySelectorAll('.chat-actions').forEach(act => {
                        if (act !== actions) {
                            act.classList.remove('opacity-100');
                            act.classList.add('opacity-0');
                        }
                    });
                    
                    // 2. 切換目前點擊的這個氣泡按鈕顯示狀態
                    actions.classList.toggle('opacity-0');
                    actions.classList.toggle('opacity-100');
                }
            });

			chatMessagesArea.appendChild(wrapper);
            chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
            return wrapper;
        }

		// 讀取編輯器或表格的文字，重新生成對話氣泡
        window.renderChatFromText = function(text) {
            // 1. 先清空目前的對話區
            chatMessagesArea.innerHTML = '';
            if (!text || text.trim() === '') return;

            // 2. 利用現成的 TSV 解析器將文字轉為陣列
            const rows = parseTSV(text);
            let isFirstRow = true;
            window.chatOriginalHeaderExtra = [];

            rows.forEach(row => {
                // 跳過我們自動產生的標題列 (A欄="原文")
                if (isFirstRow && (row[0] === '原文' || row[1] === '翻譯' || row[2] === '拼音')) {
                    isFirstRow = false;
                    window.chatOriginalHeaderExtra = row.slice(3);
                    return; 
                }
                isFirstRow = false;

                const userText = row[0] || '';
                const transText = row[1] || '';
                const pinyinText = row[2] || '';
                const extraCols = row.slice(3);

                // 如果這行全空，就跳過
                if (userText.trim() === '' && transText.trim() === '' && pinyinText.trim() === '') return;

                // 3. 根據內容建立氣泡，並將額外欄位資料綁定在產生的氣泡上
                if (userText && !transText && !pinyinText) {
                    const w = appendChatMessage(userText, true);
                    w.dataset.extra = JSON.stringify(extraCols); // 掛上背包
                } else if (!userText && (transText || pinyinText)) {
                    const w = appendChatMessage(transText, false, pinyinText);
                    w.dataset.extra = JSON.stringify(extraCols); // 掛上背包
                } else if (userText && (transText || pinyinText)) {
                    appendChatMessage(userText, true);
                    const w = appendChatMessage(transText, false, pinyinText);
                    w.dataset.extra = JSON.stringify(extraCols); // 雙向對話時，把背包掛在系統回覆上最安全
                }
            });
            
            // 捲動到最底部
            chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
        };

        initChatDropdowns();
        updateChatPivotOptions();
        
        // ✨ 新增：開放給 script.js 在「切換到對話模式」時呼叫預載
        window.preloadChatDictionaries = preloadChatDictionaries;
        
        // ✨ 修改：初次載入時，只有一開始就在對話模式才預載（其他模式等切換或第一次使用時才載入）
        if (currentMode === 'chat') {
            preloadChatDictionaries();
        }
		if (currentMode === 'chat') {
            window.renderChatFromText(editor.value);
        }
    }





});

// ==========================================
// 複製與貼上選單控制與執行邏輯
// ==========================================
const pasteGroup = document.getElementById('dd-clipboard-group');
if (pasteGroup) {
    const pasteActionBtn = pasteGroup.querySelector('.action-btn');
    pasteActionBtn.addEventListener('click', () => {
        const btnPasteValue = document.getElementById('btn-paste-value');
        if (!btnPasteValue) return;
        if (currentMode === 'table') {
            btnPasteValue.disabled = false;
            btnPasteValue.title = "貼上純文字並清除公式";
        } else {
            btnPasteValue.disabled = true;
            btnPasteValue.title = "僅在表格模式可用";
        }
    });
}

// 綁定複製選單動作
document.querySelectorAll('#dd-clipboard-group button[data-action^="copy"], #dd-clipboard-group button[data-action="select-all"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = btn.closest('.action-menu');
        if (menu) menu.classList.remove('show');
        
        const action = btn.dataset.action;
        if (action === 'select-all') {
            if (currentMode === 'table') selectAllTable();
            else { editor.focus(); editor.select(); }
        } else if (action === 'copy-all') {
            if (currentMode === 'table') selectAllTable();
            else { editor.focus(); editor.select(); }
            
            setTimeout(() => {
                if (currentMode === 'table') copySelectedTableData();
                else document.execCommand('copy');
            }, 50);
        } else if (action === 'copy-selected') {
            if (currentMode === 'table' && (selectedRows.length > 0 || selectedCols.length > 0 || selectedCellBlocks.length > 0)) {
                copySelectedTableData();
            } else {
                document.execCommand('copy');
                showToast('✅ 文字已複製！');
            }
        }
    });
});


// ==========================================
// 手機版：關閉鍵盤功能 (使用 inputmode="none")
// ==========================================
let isMobileKeyboardDisabled = false;

document.addEventListener('DOMContentLoaded', () => {
    // index.html 內有兩組相同 id，getElementById 只抓得到第一組，所以改用屬性選擇器全部綁定
    const btnToggleKeyboards = document.querySelectorAll('[id="btnToggleKeyboardMobile"]');
    const iconKeyboardChecks = document.querySelectorAll('[id="iconKeyboardCheck"]');

    btnToggleKeyboards.forEach(btnToggleKeyboard => {
        btnToggleKeyboard.addEventListener('click', (e) => {
            e.stopPropagation();
            isMobileKeyboardDisabled = !isMobileKeyboardDisabled;
            
            if (isMobileKeyboardDisabled) {
                iconKeyboardChecks.forEach(i => i.style.opacity = '1');
                if (typeof showToast === 'function') showToast('✅ 已啟用「關閉鍵盤」');
            } else {
                iconKeyboardChecks.forEach(i => i.style.opacity = '0');
                if (typeof showToast === 'function') showToast('❌ 已取消「關閉鍵盤」');
            }
            
            applyKeyboardState();
            
            // 點擊後自動關閉選單
            const menu = btnToggleKeyboard.closest('.dropdown-menu');
            if (menu) menu.classList.remove('show');
        });
    });

    // 自動監聽表格變化，確保未來「新增的列或欄」也一併套用關閉鍵盤狀態
    const dataTable = document.getElementById('data-table');
    if (dataTable) {
        const tableObserver = new MutationObserver((mutations) => {
            if (isMobileKeyboardDisabled) {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // 確保是元素節點
                            if (node.classList && node.classList.contains('td-inner')) {
                                node.setAttribute('inputmode', 'none');
                            }
                            node.querySelectorAll('.td-inner').forEach(inner => inner.setAttribute('inputmode', 'none'));
                        }
                    });
                });
            }
        });
        tableObserver.observe(dataTable, { childList: true, subtree: true });
    }
});

// 套用狀態到所有輸入區塊
function applyKeyboardState() {
    const editor = document.getElementById('editor');
    const cellEditor = document.getElementById('cellEditor');
    const tdInners = document.querySelectorAll('.td-inner');
    
    // 收集所有需要防護的輸入元素 (包含主編輯區、獨立儲存格編輯器、各類對話框)
    const inputs = [
        editor, cellEditor, 
        document.getElementById('findInput'), document.getElementById('replaceInput'), 
        document.getElementById('promptInput'), document.getElementById('autoFillPrefix'), 
        document.getElementById('autoFillSuffix'), document.getElementById('autoFillStartNum'), 
        document.getElementById('autoFillDigits'), document.getElementById('autoFormulaInput'),
        document.getElementById('autoSplitDelimiter'), document.getElementById('autoMergeDelimiter')
    ];
                    
    if (isMobileKeyboardDisabled) {
        inputs.forEach(el => { if (el) el.setAttribute('inputmode', 'none'); });
        tdInners.forEach(td => td.setAttribute('inputmode', 'none'));
    } else {
        inputs.forEach(el => { if (el) el.removeAttribute('inputmode'); });
        tdInners.forEach(td => td.removeAttribute('inputmode'));
    }
    
    // 智慧焦點處理：如果當前游標停在任何輸入框上，強制讓它失去焦點再重新聚焦，讓 OS 鍵盤狀態立刻生效
    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT' || active.classList.contains('td-inner'))) {
        active.blur();
        if (!isMobileKeyboardDisabled) {
            setTimeout(() => active.focus(), 50); 
        }
    }
}





