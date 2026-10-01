// ==========================================
// 輕量提示訊息 (Toast)：取代原生 alert()，不會阻斷操作
// 掛在 window 上，讓 staff_extension.js 等其他檔案也能呼叫
// ==========================================
(function() {
    let toastContainer = null;
    function getToastContainer() {
        if (!toastContainer || !document.body.contains(toastContainer)) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        return toastContainer;
    }

    window.showToast = function(message, type = 'info', duration = 3200) {
        const container = getToastContainer();
        const toast = document.createElement('div');
        toast.className = `app-toast app-toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));

        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
            setTimeout(() => toast.remove(), 500); // 保險：避免 transitionend 未觸發導致殘留
        }, duration);
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. 全域變數與 DOM 元素
    // ==========================================
    const STORAGE_KEY = 'wesing_music_data_v36';
    let appData = { currentId: null, songs: [] };
    let currentInstrument = 'acoustic_grand_piano';
    let currentTempo = 100;
    let currentBaseKey = 0; 
    let currentTranspose = 0;
    let activeSoundfontInst = null;
    let loadedInstruments = {};
    let failedInstruments = new Set(); // 記錄已提示過失敗的音色，避免重複跳出提示
    let isExportingAudio = false; // 防止匯出音檔按鈕被連續點擊，重複觸發匯出

    // Font Mapping Arrays
    const codeToFontRules = [];
    const fontToCodeRules = [];
    let allPairs = [];

    // DOM Elements
    const codeInput = document.getElementById('code-input');
    const fontOutput = document.getElementById('font-output');
    const titleInput = document.getElementById('doc-title');
    const songListEl = document.getElementById('song-list');
    const libraryListEl = document.getElementById('library-list'); // 新增：範例清單容器
    
    // Toolbar & Controls
    const playToggleBtn = document.getElementById('play-toggle-btn');
    const toggleToolbarBtn = document.getElementById('toggle-toolbar-btn');
    const quickToolbar = document.getElementById('quick-toolbar');
	// 全域變數：紀錄當前鍵盤模式 (預設 main)
    let currentKeyMode = 'main';
	let isShiftEnabled = false; // 控制 Shift 狀態
    
    // Settings UI
    const settingsBtn = document.getElementById('settings-trigger-btn');
    const settingsPopover = document.getElementById('settings-popover');
    const tempoInput = document.getElementById('tempo-input');
    const baseKeySelect = document.getElementById('base-key-select');
    const transposeValueEl = document.getElementById('transpose-value');
    const keyNameEl = document.getElementById('key-name-display');

    // Modal UI
    const modalOverlay = document.getElementById('confirm-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    let currentConfirmCallback = null;

    // Audio Context
    let audioCtx;
    let isPlaying = false;
    let activeOscillators = []; 
    let activeTimers = []; 
	let savedSelection = null;
	let lastPlayedNoteStart = -1;
	let lastPlayedNoteEnd = -1;
	let playbackTimer = null;
    let highlightEvents = []; // [新增] 取代大量 setTimeout：存放 {time, start, end}，用單一 rAF 迴圈輪詢
    let highlightPointer = 0; // [新增] 目前輪詢到第幾個高亮事件
    let highlightRafId = null; // [新增] requestAnimationFrame 的 id，方便停止播放時取消

	// ==========================================
    // 歷史紀錄與還原 (Undo System)
    // ==========================================
    let historyStack = [];
    let historyIndex = -1;
    let isUndoing = false;      // 防止還原時觸發儲存
    let historyTimer = null;    // 打字防抖計時器

    // 1. 記錄當前狀態 (儲存到堆疊)
    function recordHistory(immediate = false) {
        if (isUndoing) return; // 如果正在執行還原，不要重複紀錄

        const saveAction = () => {
            const content = codeInput.value;
            // [修改] 快照除了文字，也記錄原調與轉調設定
            const snapshot = { content: content, baseKey: currentBaseKey, transpose: currentTranspose };
            
            // 如果跟上一步一樣 (文字與設定都相同)，就不存 (避免重複)
            const last = historyStack[historyIndex];
            if (historyIndex >= 0 && last && last.content === content &&
                last.baseKey === currentBaseKey && last.transpose === currentTranspose) return;

            // 如果目前不在最新的位置 (曾經 Undo 過)，則捨棄後面的紀錄 (Redo path)
            if (historyIndex < historyStack.length - 1) {
                historyStack = historyStack.slice(0, historyIndex + 1);
            }

            historyStack.push(snapshot); // [修改] 原本是 push(content)
            historyIndex++;

            // 限制紀錄筆數 (例如只保留最近 50 步)
            if (historyStack.length > 50) {
                historyStack.shift();
                historyIndex--;
            }
        };

        if (immediate) {
            clearTimeout(historyTimer);
            saveAction();
        } else {
            // 防抖：打字時不會每個字都存，停頓 0.5 秒才存
            clearTimeout(historyTimer);
            historyTimer = setTimeout(saveAction, 500);
        }
    }

    // 2. 執行還原
    function performUndo() {
        if (historyIndex > 0) {
            isUndoing = true; // 鎖定：告訴系統這次改變是「還原」，不要當作新輸入存起來
            
            historyIndex--;
            const prev = historyStack[historyIndex]; // [修改] 改為快照物件
            
            codeInput.value = prev.content;
            // [新增] 同步還原原調與轉調設定
            currentBaseKey = prev.baseKey;
            currentTranspose = prev.transpose;
            baseKeySelect.value = currentBaseKey;
            
            // 觸發 input 事件以更新畫面 (樂譜字型、localStorage)
            // 這裡會觸發 codeInput 的 'input' listener，
            // 但因為 isUndoing = true，所以不會再次呼叫 recordHistory
            codeInput.dispatchEvent(new Event('input'));
            
            // [新增] 更新歌曲設定、轉調顯示與狀態列
            updateCurrentSongSettings();
            updateTransposeUI();
            updateStatusDisplay();
            
            isUndoing = false; // 解鎖
        }
    }

    // 3. 初始化歷史紀錄 (載入歌曲時呼叫)
    function initHistory() {
        historyStack = [];
        historyIndex = -1;
        recordHistory(true); // 存入初始狀態
    }
    // ==========================================
    // 2. 資料常數
    // ==========================================
    const keyNames = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
    const relFreqs = { '1': 261.63, '2': 293.66, '3': 329.63, '4': 349.23, '5': 392.00, '6': 440.00, '7': 493.88 };
    
    const instruments = [
        // --- 鍵盤與撥弦 ---
        { id: 'piano', name: '🎹 鋼琴 p:', type: 'soundfont', val: 'acoustic_grand_piano', icon: '🎹', alias: 'p' },
        { id: 'guitar', name: '🎸 吉他 g:', type: 'soundfont', val: 'acoustic_guitar_nylon', icon: '🎸', alias: 'g' },
        { id: 'harp', name: '🎼 豎琴 h:', type: 'soundfont', val: 'orchestral_harp', icon: '🎼', alias: 'h' },
        
        // --- 弦樂 ---
        { id: 'violin', name: '🎻 小提琴 v:', type: 'soundfont', val: 'violin', icon: '🎻', alias: 'v' },
        { id: 'cello', name: '🎻 大提琴 V:', type: 'soundfont', val: 'cello', icon: '🎻', alias: 'V' },
        
        // --- 木管 ---
        { id: 'flute', name: '🎵 長笛 f:', type: 'soundfont', val: 'flute', icon: '🎵', alias: 'f' },
        { id: 'clarinet', name: '🎵 單簧管 c:', type: 'soundfont', val: 'clarinet', icon: '🎵', alias: 'c' },
        { id: 'oboe', name: '🎵 雙簧管 o:', type: 'soundfont', val: 'oboe', icon: '🎵', alias: 'o' },
        { id: 'sax', name: '🎷 薩克斯風 s:', type: 'soundfont', val: 'alto_sax', icon: '🎷', alias: 's' },
        
        // --- 銅管 ---
        { id: 'trumpet', name: '🎺 小號 t:', type: 'soundfont', val: 'trumpet', icon: '🎺', alias: 't' },


        // --- 打擊與其他 ---
        { id: 'xylophone', name: '🪵 木琴 x:', type: 'soundfont', val: 'xylophone', icon: '🪵', alias: 'x' },
        { id: 'glockenspiel', name: '🔔 鐵琴 q:', type: 'soundfont', val: 'glockenspiel', icon: '🔔', alias: 'q' },
        { id: 'marimba', name: '🎹 馬林巴 m:', type: 'soundfont', val: 'marimba', icon: '🎹', alias: 'm' },
        { id: 'accordion', name: '🪗 手風琴 a:', type: 'soundfont', val: 'accordion', icon: '🪗', alias: 'a' },
        { id: 'harmonica', name: '🎼 口琴 k:', type: 'soundfont', val: 'harmonica', icon: '🎼', alias: 'k' },

        // --- 合成器 (名稱改為內建) ---
        { id: 'synth-sine', name: '🎹 鋼琴 (內建) P:', type: 'synth', val: 'sine', icon: '🎹', alias: 'P' },
        { id: 'synth-tri', name: '🎵 長笛 (內建) F:', type: 'synth', val: 'triangle', icon: '🎵', alias: 'F' },
        { id: 'synth-square', name: '🕹️ 8-Bit B:', type: 'synth', val: 'square', icon: '🕹️', alias: 'B' },

		// --- 節奏與打擊樂 (爵士鼓組) ---
        { id: 'drum-kick', name: '🥁 大鼓 (Kick) jD:', type: 'soundfont', val: 'drum_kick', icon: '🥁', alias: 'jD' },
        { id: 'drum-snare', name: '🥁 小鼓 (Snare) jd:', type: 'soundfont', val: 'drum_snare', icon: '🥁', alias: 'jd' },
        { id: 'drum-hihat-c', name: '🥢 閉鈸 (Hi-hat Cls) jb:', type: 'soundfont', val: 'drum_hihat_close', icon: '🥢', alias: 'jb' },
        { id: 'drum-hihat-o', name: '🥢 開鈸 (Hi-hat Opn) jB:', type: 'soundfont', val: 'drum_hihat_open', icon: '🥢', alias: 'jB' },
        { id: 'drum-tom-h', name: '🥁 高中鼓 (Tom Hi) jh:', type: 'soundfont', val: 'drum_tom_hi', icon: '🥁', alias: 'jh' },
        { id: 'drum-tom-l', name: '🥁 落地鼓 (Tom Lo) jl:', type: 'soundfont', val: 'drum_tom_lo', icon: '🥁', alias: 'jl' },
        { id: 'drum-crash', name: '💥 碎音鈸 (Crash) jc:', type: 'soundfont', val: 'drum_crash', icon: '💥', alias: 'jc' },
        { id: 'drum-ride', name: '🔔 疊音鈸 (Ride) jr:', type: 'soundfont', val: 'drum_ride', icon: '🔔', alias: 'jr' },


        // --- 節奏與打擊樂 ---
        { id: 'woodblock', name: '🪵 木魚 w:', type: 'soundfont', val: 'woodblock', icon: '🪵', alias: 'w' },
        { id: 'bass-drum', name: '🥁 大鼓 D:', type: 'soundfont', val: 'taiko_drum', icon: '🥁', alias: 'D' },
        { id: 'snare-drum', name: '🥁 小鼓 d:', type: 'soundfont', val: 'synth_drum', icon: '🥁', alias: 'd' },
        { id: 'triangle', name: '🔺 三角鐵 T:', type: 'soundfont', val: 'tinkle_bell', icon: '🔺', alias: 'T' }, 
        { id: 'cowbell', name: '🔔 銅鈴 b:', type: 'soundfont', val: 'agogo', icon: '🔔', alias: 'b' },
    ];

    // [優化] 用 Map 依 val 建立索引，playTone() 每個音符都要查一次樂器定義，
    // 音符一多時線性 .find() 會疊加成明顯的效能負擔，改成 O(1) 查表
    const instrumentByVal = new Map(instruments.map(i => [i.val, i]));
    function getInstrumentDef(val) {
        return instrumentByVal.get(val) || instruments[0];
    }


	// 和弦根音對照表 (用於解析)
    const CHORD_ROOTS = {
        'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
        'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
        'bB': 10, 'bb': 10, // 容錯 user 的 bB 寫法
        'Cb': 11, 'B#': 0, 'E#': 5, 'Fb': 4
    };

    // 移調後的顯示名稱 (混合升降記號的常用標示)
    const CHORD_ROOT_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

    // 和弦組成音 (半音距離)
    const CHORD_QUALITIES = {
        '': [0, 4, 7],         // Major (大三和弦)
        'm': [0, 3, 7],        // Minor (小三和弦)
        '7': [0, 4, 7, 10],    // Dominant 7 (屬七)
        'm7': [0, 3, 7, 10],   // Minor 7
        'maj7': [0, 4, 7, 11], // Major 7
        'dim': [0, 3, 6],      // Diminished
        'dim7': [0, 3, 6, 9],  // Diminished 7
        'aug': [0, 4, 8],      // Augmented
        'sus4': [0, 5, 7],     // Suspended 4
        'sus2': [0, 2, 7],     // Suspended 2
        'add9': [0, 4, 7, 14], // Add 9
        '9': [0, 4, 7, 10, 14] // Dominant 9
    };



	// 定義四種面板：main(簡譜), chord(和弦), snippet(語法), qwerty(英數)
    const keySets = {
        // --- 1. 主鍵盤 (簡譜與編輯) ---
        main: [

				{ char: '[', display: '[', type: 'normal' },
				{ char: ']', display: ']', type: 'normal' },
				
				{ char: '{', display: '{', type: 'normal' },
				{ char: '} ', display: '}', type: 'normal' },


				{ char: '* ', display: '*', type: 'normal' },
				{ char: '|', display: '|', type: 'normal' },
				{ char: '7', display: '7', type: 'num' },
				{ char: '8', display: '8', type: 'num' },	 

				{ char: '9', display: '9', type: 'num' }, 
				{ char: '- ', display: '-', type: 'normal' }, 


				{ char: '<', display: '<', type: 'normal' }, 
				{ char: '>', display: '>', type: 'normal' }, 

				{ char: '(', display: '(', type: 'normal' }, 
				{ char: ') ', display: ')', type: 'normal' }, 
				{ char: '\'', display: '\'', type: 'normal' },
				{ char: '\\', display: '\\', type: 'normal' }, 

				{ char: '4', display: '4', type: 'num' },	 
				{ char: '5', display: '5', type: 'num' }, 
				{ char: '6', display: '6', type: 'num' },	 

				{ char: '/', display: '/', type: 'normal' }, 




			    { char: ' ', display: '空', type: 'space', class: 'space-btn span-4'},


				{ char: '#', display: '#', type: 'normal' }, 
				{ char: 'b', display: 'b', type: 'normal' }, 

				{ char: '1', display: '1', type: 'num' }, 
				{ char: '2', display: '2', type: 'num' }, 
				{ char: '3', display: '3', type: 'num' },
				
				
				{ char: 'backspace', display: '⌫', type: 'func' },

				// [切換鍵]
				{ display: '英', type: 'switch', target: 'qwerty', class: 'mode-btn' },
				{ display: '弦', type: 'switch', target: 'chord', class: 'mode-btn' },
				{ display: '快', type: 'switch', target: 'snippet', class: 'mode-btn' },
				{ char: ';', display: ';', type: 'normal' },	
				{ char: '$', display: '$', type: 'normal' },
				{ char: 'r', display: 'r', type: 'normal' },	
				{ char: '0', display: '0', type: 'num' }, 
				{ char: '.', display: '.', type: 'normal' },
				{ char: ':', display: ':', type: 'normal' },

				{ 
					char: '\n', 
					display: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>', 
					type: 'func', 
					class: 'span-1 enter-btn'
				},
            
            // 功能鍵
            
			
        ],

        // --- 2. 和弦鍵盤 (CDEFG...) ---
        chord: [
            // [切換鍵]
               
				{ char: '0', display: '0', type: 'num' }, { char: '1', display: '1', type: 'num' }, 
				{ char: '2', display: '2', type: 'num' }, { char: '3', display: '3', type: 'num' },
				{ char: '4', display: '4', type: 'num' },	 { char: '5', display: '5', type: 'num' }, 
				{ char: '6', display: '6', type: 'num' },	 { char: '7', display: '7', type: 'num' },
				{ char: '8', display: '8', type: 'num' },	 { char: '9', display: '9', type: 'num' }, 
			    { char: ' ', display: '空', type: 'space' }, { char: '- ', display: '-', type: 'normal' },
				{ char: '/', display: '/', type: 'normal' },

			{ char: '.', display: '.', type: 'normal' },
            { char: ':', display: ':', type: 'normal' },
            { char: 'r', display: 'r', type: 'normal' },
			


            // 根音列
            { char: 'C', display: 'C', type: 'chord-root' }, { char: 'Dm', display: 'Dm', type: 'chord-root' }, 
            { char: 'Em', display: 'Em', type: 'chord-root' }, { char: 'F', display: 'F', type: 'chord-root' }, 
            { char: 'G', display: 'G', type: 'chord-root' }, { char: 'Am', display: 'Am', type: 'chord-root' }, 
            { char: 'bB', display: 'bB', type: 'chord-root' },

            // 根音列
            { char: 'D', display: 'D', type: 'chord-root' }, 
            { char: 'E', display: 'E', type: 'chord-root' },  
            { char: 'A', display: 'A', type: 'chord-root' }, 
            { char: 'B', display: 'B', type: 'chord-root' },
            
            // 性質列 (Qualities)
            { char: 'm', display: 'm', type: 'chord-quality' }, { char: '7', display: '7', type: 'chord-quality' },
			{ char: 'backspace', display: '⌫', type: 'func' },
            

			{ display: '英', type: 'switch', target: 'qwerty', class: 'mode-btn' },
			{ display: '數', type: 'switch', target: 'main', class: 'return-btn' }, 
			{ display: '快', type: 'switch', target: 'snippet', class: 'mode-btn' },

			{ char: 'maj7', display: 'maj⁷', type: 'chord-quality' }, 
			{ char: 'm7', display: 'm⁷', type: 'chord-quality' },

            { char: 'sus4', display: 'sus⁴', type: 'chord-quality' }, { char: 'sus2', display: 'sus²', type: 'chord-quality' },
            { char: 'add9', display: 'add⁹', type: 'chord-quality' }, { char: 'dim', display: 'dim', type: 'chord-quality' },
            
            
				{ 
					char: '\n', 
					display: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>', 
					type: 'func', 
					class: 'span-1 enter-btn'
				},
			

        ],

        // --- 3. 語法與代碼鍵盤 (Snippets) ---
        snippet: [
				{ char: '0', display: '0', type: 'num' }, { char: '1', display: '1', type: 'num' }, 
				{ char: '2', display: '2', type: 'num' }, { char: '3', display: '3', type: 'num' },
				{ char: '4', display: '4', type: 'num' },	 { char: '5', display: '5', type: 'num' }, 
				{ char: '6', display: '6', type: 'num' },	 { char: '7', display: '7', type: 'num' },
				{ char: '8', display: '8', type: 'num' },	 { char: '9', display: '9', type: 'num' }, 
			    { char: ' ', display: '空', type: 'space' }, 
				{ char: '- ', display: '-', type: 'normal' },
				{ char: ':', display: ':', type: 'normal' },

            // 播放流程控制
            { label: '[Play]', text: '[Play: A B C D ]', offset: 0, type: 'insert', display: '[P]', class: 'snippet-key' },
            { label: '[A]{', text: '[A]{', offset: -2, type: 'insert', display: '[A]{', class: 'snippet-key' },
            { label: '[B]{', text: '[B]{', offset: -2, type: 'insert', display: '[B]{', class: 'snippet-key' },
			{ label: '[C]{', text: '[C]{', offset: -2, type: 'insert', display: '[C]{', class: 'snippet-key' },
			{ label: '[D]{', text: '[D]{', offset: -2, type: 'insert', display: '[D]{', class: 'snippet-key' },
			{ label: '};', text: '};', offset: 0, type: 'insert', display: '};', class: 'snippet-key' },
			
			{ char: 'backspace', display: '⌫', type: 'func' },

			{ display: '英', type: 'switch', target: 'qwerty', class: 'mode-btn' },
			{ display: '數', type: 'switch', target: 'main', class: 'return-btn' }, 
            { display: '弦', type: 'switch', target: 'chord', class: 'mode-btn' },

            { label: '[r1:]', text: '[r1: (1.135) $1 $1/ $1/ $1 ]', offset: -1, type: 'insert', display: '[r1]', class: 'snippet-key' },


            // 常用樂器切換
            { char: 'p: ', display: 'p:', type: 'normal' },
            { char: 'g: ', display: 'g:', type: 'normal' },
            { char: 'v: ', display: 'v:', type: 'normal' },
            { char: 'd: ', display: 'd:', type: 'normal' },

				{ 
					char: '\n', 
					display: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>', 
					type: 'func', 
					class: 'span-1 enter-btn'
				},

        ],
		// --- 4. [新增] QWERTY 英數鍵盤 ---
		qwerty: [
			// Row 1: 數字
			{ char: '1', display: '1', type: 'num' }, { char: '2', display: '2', type: 'num' }, { char: '3', display: '3', type: 'num' },
			{ char: '4', display: '4', type: 'num' }, { char: '5', display: '5', type: 'num' }, { char: '6', display: '6', type: 'num' },
			{ char: '7', display: '7', type: 'num' }, { char: '8', display: '8', type: 'num' }, { char: '9', display: '9', type: 'num' },
			{ char: '0', display: '0', type: 'num' },

			// Row 2: Q-P (type: 'letter' 會受 Shift 影響)
			{ char: 'q', display: 'q', type: 'letter' }, { char: 'w', display: 'w', type: 'letter' }, { char: 'e', display: 'e', type: 'letter' },
			{ char: 'r', display: 'r', type: 'letter' }, { char: 't', display: 't', type: 'letter' }, { char: 'y', display: 'y', type: 'letter' },
			{ char: 'u', display: 'u', type: 'letter' }, { char: 'i', display: 'i', type: 'letter' }, { char: 'o', display: 'o', type: 'letter' },
			{ char: 'p', display: 'p', type: 'letter' },

			// Row 3: A-L + 符號
			{ char: 'a', display: 'a', type: 'letter' }, { char: 's', display: 's', type: 'letter' }, { char: 'd', display: 'd', type: 'letter' },
			{ char: 'f', display: 'f', type: 'letter' }, { char: 'g', display: 'g', type: 'letter' }, { char: 'h', display: 'h', type: 'letter' },
			{ char: 'j', display: 'j', type: 'letter' }, { char: 'k', display: 'k', type: 'letter' }, { char: 'l', display: 'l', type: 'letter' },
			{ char: '-', display: '-', type: 'normal' },

			// Row 4: Shift, Z-M, Backspace
			{ display: '⇧', type: 'shift', class: 'shift-btn' }, // Shift 鍵
			{ char: 'z', display: 'z', type: 'letter' }, { char: 'x', display: 'x', type: 'letter' }, { char: 'c', display: 'c', type: 'letter' },
			{ char: 'v', display: 'v', type: 'letter' }, { char: 'b', display: 'b', type: 'letter' }, { char: 'n', display: 'n', type: 'letter' },
			{ char: 'm', display: 'm', type: 'letter' },
			{ char: ':', display: ':', type: 'normal'},
			
			
			{ char: 'backspace', display: '⌫', type: 'func' },
			

			// Row 5: 導覽與空白鍵 (使用 CSS span 跨欄)
			{ display: '數', type: 'switch', target: 'main', class: 'return-btn' }, 
            { display: '弦', type: 'switch', target: 'chord', class: 'mode-btn' },
            { display: '快', type: 'switch', target: 'snippet', class: 'mode-btn' },
			{ char: ' ', display: 'Space', type: 'space', class: 'space-btn span-3' },
			{ char: '.', display: '.', type: 'normal'},
			{ char: '/', display: '/', type: 'normal' },

				{ 
					char: '\n', 
					display: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>', 
					type: 'func', 
					class: 'span-1 enter-btn'
				},
		]
	};




    const mappingData = [
        { font: "", code: "* " }, { font: "", code: "0 " }, { font: "", code: "1 " }, { font: "", code: "2 " },
        { font: "", code: "3 " }, { font: "", code: "4 " }, { font: "", code: "5 " }, { font: "", code: "6 " },
        { font: "", code: "7 " }, { font: "", code: "0/ " }, { font: "", code: "1/ " }, { font: "", code: "2/ " },
        { font: "", code: "3/ " }, { font: "", code: "4/ " }, { font: "", code: "5/ " }, { font: "", code: "6/ " },
        { font: "", code: "7/ " }, { font: "", code: "*/ " }, { font: "", code: "0// " }, { font: "", code: "1// " },
        { font: "", code: "2// " }, { font: "", code: "3// " }, { font: "", code: "4// " }, { font: "", code: "5// " },
        { font: "", code: "6// " }, { font: "", code: "7// " }, { font: "", code: "*// " }, { font: "", code: "0/// " },
        { font: "", code: "1/// " }, { font: "", code: "2/// " }, { font: "", code: "3/// " }, { font: "", code: "4/// " },
        { font: "", code: "5/// " }, { font: "", code: "6/// " }, { font: "", code: "7/// " }, { font: "", code: "*/// " },
        { font: "", code: "1. " }, { font: "", code: "2. " }, { font: "", code: "3. " }, { font: "", code: "4. " },
        { font: "", code: "5. " }, { font: "", code: "6. " }, { font: "", code: "7. " }, { font: "", code: ".1 " },
        { font: "", code: ".2 " }, { font: "", code: ".3 " }, { font: "", code: ".4 " }, { font: "", code: ".5 " },
        { font: "", code: ".6 " }, { font: "", code: ".7 " }, 
        { font: "", codes: ["1./ ", "1/. "] }, { font: "", codes: ["2./ ", "2/. "] }, { font: "", codes: ["3./ ", "3/. "] },
        { font: "", codes: ["4./ ", "4/. "] }, { font: "", codes: ["5./ ", "5/. "] }, { font: "", codes: ["6./ ", "6/. "] },
        { font: "", codes: ["7./ ", "7/. "] }, { font: "", code: ".1/ " }, { font: "", code: ".2/ " }, { font: "", code: ".3/ " },
        { font: "", code: ".4/ " }, { font: "", code: ".5/ " }, { font: "", code: ".6/ " }, { font: "", code: ".7/ " },
        { font: "", codes: ["1.// ", "1//. "] }, { font: "", codes: ["2.// ", "2//. "] }, { font: "", codes: ["3.// ", "3//. "] },
        { font: "", codes: ["4.// ", "4//. "] }, { font: "", codes: ["5.// ", "5//. "] }, { font: "", codes: ["6.// ", "6//. "] },
        { font: "", codes: ["7.// ", "7//. "] }, { font: "", code: ".1// " }, { font: "", code: ".2// " }, { font: "", code: ".3// " },
        { font: "", code: ".4// " }, { font: "", code: ".5// " }, { font: "", code: ".6// " }, { font: "", code: ".7// " },
        { font: "", codes: ["1./// ", "1///. "] }, { font: "", codes: ["2./// ", "2///. "] }, { font: "", codes: ["3./// ", "3///. "] },
        { font: "", codes: ["4./// ", "4///. "] }, { font: "", codes: ["5./// ", "5///. "] }, { font: "", codes: ["6./// ", "6///. "] },
        { font: "", codes: ["7./// ", "7///. "] }, { font: "", code: ".1/// " }, { font: "", code: ".2/// " }, { font: "", code: ".3/// " },
        { font: "", code: ".4/// " }, { font: "", code: ".5/// " }, { font: "", code: ".6/// " }, { font: "", code: ".7/// " },
        { font: "", code: "1: " }, { font: "", code: "2: " }, { font: "", code: "3: " }, { font: "", code: "4: " },
        { font: "", code: "5: " }, { font: "", code: "6: " }, { font: "", code: "7: " },
        { font: "", code: ":1 " }, { font: "", code: ":2 " }, { font: "", code: ":3 " }, { font: "", code: ":4 " },
        { font: "", code: ":5 " }, { font: "", code: ":6 " }, { font: "", code: ":7 " },
        { font: "", codes: ["1/: ", "1:/ "] }, { font: "", codes: ["2/: ", "2:/ "] }, { font: "", codes: ["3/: ", "3:/ "] },
        { font: "", codes: ["4/: ", "4:/ "] }, { font: "", codes: ["5/: ", "5:/ "] }, { font: "", codes: ["6/: ", "6:/ "] },
        { font: "", codes: ["7/: ", "7:/ "] }, { font: "", code: ":1/ " }, { font: "", code: ":2/ " }, { font: "", code: ":3/ " },
        { font: "", code: ":4/ " }, { font: "", code: ":5/ " }, { font: "", code: ":6/ " }, { font: "", code: ":7/ " },
        { font: "", codes: ["1//: ", "1:// "] }, { font: "", codes: ["2//: ", "2:// "] }, { font: "", codes: ["3//: ", "3:// "] },
        { font: "", codes: ["4//: ", "4:// "] }, { font: "", codes: ["5//: ", "5:// "] }, { font: "", codes: ["6//: ", "6:// "] },
        { font: "", codes: ["7//: ", "7:// "] }, { font: "", code: ":1// " }, { font: "", code: ":2// " }, { font: "", code: ":3// " },
        { font: "", code: ":4// " }, { font: "", code: ":5// " }, { font: "", code: ":6// " }, { font: "", code: ":7// " },
        { font: "", code: ":1/// " }, { font: "", code: ":2/// " }, { font: "", code: ":4/// " }, { font: "", code: ":5/// " },
        { font: "", code: ":6/// " }, { font: "", code: ":7/// " },
        { font: "", code: "- " }, { font: "", code: "b " }, { font: "", code: "z " }, { font: "", code: "# " },
        { font: "", code: "(( " }, { font: "", code: "(. " }, { font: "", code: "2/2) " }, { font: "", code: "3/4) " },
        { font: "", code: "4/4) " }, { font: "", code: "| " }, { font: "", code: "|| " }, { font: "", code: "||| " },
        { font: "", code: "||: " }, { font: "", code: ":|| " },



		// 注意：程式碼中 "\\" 代表一個反斜線
        { font: "", code: "0\\ " }, { font: "", code: "1\\ " }, { font: "", code: "2\\ " }, 
        { font: "", code: "3\\ " }, { font: "", code: "4\\ " }, { font: "", code: "5\\ " }, 
        { font: "", code: "6\\ " }, { font: "", code: "7\\ " }, { font: "", code: "*\\ " },
        
        { font: "", code: "0\\\\ " }, { font: "", code: "1\\\\ " }, { font: "", code: "2\\\\ " }, 
        { font: "", code: "3\\\\ " }, { font: "", code: "4\\\\ " }, { font: "", code: "5\\\\ " }, 
        { font: "", code: "6\\\\ " }, { font: "", code: "7\\\\ " }, { font: "", code: "*\\\\ " },
        
        { font: "", code: "0\\\\\\ " }, { font: "", code: "1\\\\\\ " }, { font: "", code: "2\\\\\\ " }, 
        { font: "", code: "3\\\\\\ " }, { font: "", code: "4\\\\\\ " }, { font: "", code: "5\\\\\\ " }, 
        { font: "", code: "6\\\\\\ " }, { font: "", code: "7\\\\\\ " }, { font: "", code: "*\\\\\\ " },

        { font: "", codes: ["1.\\ ", "1\\. "] }, { font: "", codes: ["2.\\ ", "2\\. "] }, 
        { font: "", codes: ["3.\\ ", "3\\. "] }, { font: "", codes: ["4.\\ ", "4\\. "] }, 
        { font: "", codes: ["5.\\ ", "5\\. "] }, { font: "", codes: ["6.\\ ", "6\\. "] }, 
        { font: "", codes: ["7.\\ ", "7\\. "] }, 
        { font: "", code: ".1\\ " }, { font: "", code: ".2\\ " }, { font: "", code: ".3\\ " }, 
        { font: "", code: ".4\\ " }, { font: "", code: ".5\\ " }, { font: "", code: ".6\\ " }, { font: "", code: ".7\\ " },

        { font: "", codes: ["1.\\\\ ", "1\\\\. "] }, { font: "", codes: ["2.\\\\ ", "2\\\\. "] }, 
        { font: "", codes: ["3.\\\\ ", "3\\\\. "] }, { font: "", codes: ["4.\\\\ ", "4\\\\. "] }, 
        { font: "", codes: ["5.\\\\ ", "5\\\\. "] }, { font: "", codes: ["6.\\\\ ", "6\\\\. "] }, 
        { font: "", codes: ["7.\\\\ ", "7\\\\. "] },
        { font: "", code: ".1\\\\ " }, { font: "", code: ".2\\\\ " }, { font: "", code: ".3\\\\ " }, 
        { font: "", code: ".4\\\\ " }, { font: "", code: ".5\\\\ " }, { font: "", code: ".6\\\\ " }, { font: "", code: ".7\\\\ " },

        { font: "", codes: ["1.\\\\\\ ", "1\\\\\\. "] }, { font: "", codes: ["2.\\\\\\ ", "2\\\\\\. "] },
        { font: "", codes: ["3.\\\\\\ ", "3\\\\\\. "] }, { font: "", codes: ["4.\\\\\\ ", "4\\\\\\. "] },
        { font: "", codes: ["5.\\\\\\ ", "5\\\\\\. "] }, { font: "", codes: ["6.\\\\\\ ", "6\\\\\\. "] },
        { font: "", codes: ["7.\\\\\\ ", "7\\\\\\. "] },

        { font: "", codes: ["1:\\ ", "1:\\ "] }, { font: "", codes: ["2:\\ ", "2:\\ "] },
        { font: "", codes: ["3:\\ ", "3:\\ "] }, { font: "", codes: ["4:\\ ", "4:\\ "] },
        { font: "", codes: ["5:\\ ", "5:\\ "] }, { font: "", codes: ["6:\\ ", "6:\\ "] },
        { font: "", codes: ["7:\\ ", "7:\\ "] },
        
        { font: "", code: ":1\\ " }, { font: "", code: ":2\\ " }, { font: "", code: ":3\\ " }, 
        { font: "", code: ":4\\ " }, { font: "", code: ":5\\ " }, { font: "", code: ":6\\ " }, { font: "", code: ":7\\ " },

        { font: "", codes: ["1:\\\\ ", "1:\\\\ "] }, { font: "", codes: ["2:\\\\ ", "2:\\\\ "] },
        { font: "", codes: ["3:\\\\ ", "3:\\\\ "] }, { font: "", codes: ["4:\\\\ ", "4:\\\\ "] },
        { font: "", codes: ["5:\\\\ ", "5:\\\\ "] }, { font: "", codes: ["6:\\\\ ", "6:\\\\ "] },
        { font: "", codes: ["7:\\\\ ", "7:\\\\ "] },

        { font: "", code: ":1\\\\ " }, { font: "", code: ":2\\\\ " }, { font: "", code: ":3\\\\ " }, 
        { font: "", code: ":4\\\\ " }, { font: "", code: ":5\\\\ " }, { font: "", code: ":6\\\\ " }, { font: "", code: ":7\\\\ " },

        { font: "", code: ":1\\\\\\ " }, { font: "", code: ":2\\\\\\ " }, { font: "", code: ":3\\\\\\ " }, 
        { font: "", code: ":4\\\\\\ " }, { font: "", code: ":5\\\\\\ " }, { font: "", code: ":6\\\\\\ " }, { font: "", code: ":7\\\\\\ " },
    ];

    function escapeRegExp(string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    // Init Font Rules Immediately
    mappingData.forEach(item => {
        if (item.codes) {
            item.codes.forEach(c => allPairs.push({ code: c, font: item.font }));
            fontToCodeRules.push({ regex: new RegExp(escapeRegExp(item.font), 'g'), replacement: item.codes[0] });
        } else {
            allPairs.push({ code: item.code, font: item.font });
            fontToCodeRules.push({ regex: new RegExp(escapeRegExp(item.font), 'g'), replacement: item.code });
        }
    });
    
    // 確保長代碼先被處理 (例如 .1 先於 1)
    allPairs.sort((a, b) => b.code.length - a.code.length);
    
    allPairs.forEach(pair => {
        // [修正] 正則表達式：負向後行斷言 (Negative Lookbehind)
        // 排除前方是：英文字母、數字(\d)、錢字號(\$)、左大括號(\{)
        // 這樣 $1, {1:, r1C 裡面的 1 都不會被當作音符轉換
        codeToFontRules.push({
            regex: new RegExp("(?<![a-zA-Z\\d\\$\\{])" + escapeRegExp(pair.code), 'g'),
            replacement: pair.font
        });
    });

    // ==========================================
    // 3. 核心函式定義
    // ==========================================

    function showConfirm(title, message, onConfirm) {
        if(!modalOverlay) return;
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        currentConfirmCallback = onConfirm;
        modalOverlay.classList.add('show');
    }

    function closeConfirm() {
        if(!modalOverlay) return;
        modalOverlay.classList.remove('show');
        currentConfirmCallback = null;
    }

    function loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                appData = JSON.parse(stored);
            } catch (e) {
                console.error("Data Reset", e);
                // 讀取失敗前，先把壞掉的原始資料備份到另一個 key，避免真的救不回來
                // (使用者可以請人協助從瀏覽器開發者工具的 localStorage 裡取出這個 key 手動搶救)
                try {
                    localStorage.setItem(STORAGE_KEY + '_corrupted_backup_' + Date.now(), stored);
                } catch (backupErr) {
                    console.error("備份壞資料也失敗", backupErr);
                }
                showToast("⚠️ 儲存的樂譜資料讀取失敗，已重新建立空白樂譜。原始資料已盡量保留在瀏覽器儲存空間中，若有需要復原請聯繫技術協助。", 'error', 8000);
            }
        }
        
        // 如果沒有任何歌曲，創建一首空的
        if (appData.songs.length === 0) {
            createNewSong("未命名樂譜", "");
        } else {
            // 確保 currentId 有效
            if (!appData.songs.find(s => s.id === appData.currentId)) {
                appData.currentId = appData.songs[0].id;
            }
        }

        // 渲染使用者清單
        renderSidebar(); 
        
        // 渲染範例曲庫 (若 data.js 存在)
        renderLibraryCategoryChips();
        renderLibrary();
    }

    // --- 分類搜尋：目前篩選狀態 ---
    let libraryFilterText = '';
    let libraryFilterCategory = 'all';

    // --- 新增：依 exampleSongs 的 tags 動態產生分類標籤列 ---
    function renderLibraryCategoryChips() {
        const container = document.getElementById('library-category-filters');
        if (!container || typeof exampleSongs === 'undefined') return;

        // 從所有範例曲目的 tags 收集出現過的分類 (沒有 tags 的曲目歸類為「其他」)
        const categorySet = new Set();
        exampleSongs.forEach(song => {
            const tags = (song.tags && song.tags.length > 0) ? song.tags : ['其他'];
            tags.forEach(t => categorySet.add(t));
        });
        const categories = ['all', ...Array.from(categorySet)];

        container.innerHTML = '';
        categories.forEach(cat => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = `library-category-chip ${cat === libraryFilterCategory ? 'active' : ''}`;
            chip.textContent = cat === 'all' ? '全部' : cat;
            chip.addEventListener('click', () => {
                libraryFilterCategory = cat;
                renderLibraryCategoryChips();
                renderLibrary();
            });
            container.appendChild(chip);
        });
    }

    // --- 渲染範例曲庫 (支援關鍵字搜尋 + 分類篩選) ---
    function renderLibrary() {
        if (!libraryListEl || typeof exampleSongs === 'undefined') return;

        const keyword = libraryFilterText.trim().toLowerCase();

        const filtered = exampleSongs.filter(song => {
            const tags = (song.tags && song.tags.length > 0) ? song.tags : ['其他'];

            // 分類篩選
            if (libraryFilterCategory !== 'all' && !tags.includes(libraryFilterCategory)) {
                return false;
            }

            // 關鍵字搜尋：比對標題、分類標籤、樂器名稱
            if (keyword) {
                const haystack = [
                    song.title || '',
                    ...tags,
                    song.instrument || ''
                ].join(' ').toLowerCase();
                if (!haystack.includes(keyword)) return false;
            }

            return true;
        });

        libraryListEl.innerHTML = '';

        if (filtered.length === 0) {
            const hint = document.createElement('div');
            hint.className = 'library-empty-hint';
            hint.textContent = '沒有符合條件的範例曲目';
            libraryListEl.appendChild(hint);
            return;
        }

        filtered.forEach((exSong) => {
            const div = document.createElement('div');
            div.className = 'song-item library-item';

            const titleSpan = document.createElement('span');
            titleSpan.style.cssText = 'overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
            titleSpan.textContent = exSong.title; // 用 textContent 安全插入

            div.appendChild(titleSpan);
            div.onclick = () => importExampleSong(exSong);
            libraryListEl.appendChild(div);
        });
    }

    // --- 新增：匯入範例歌曲 (覆蓋模式) ---
    function importExampleSong(exSong) {
        const currentSong = getCurrentSong();
        if (!currentSong) return;

        // 檢查編輯區是否為空 (視為安全可直接載入)
        const contentIsEmpty = !codeInput.value || codeInput.value.trim() === "";

        const doUpdate = () => {
            // 處理預設值
            // currentSong.title = exSong.title; // <--- 這一行註解掉或刪除，保留原標題
            currentSong.content = exSong.content.trim();
            currentSong.tempo = exSong.tempo || 100;
            currentSong.instrument = exSong.instrument || 'acoustic_grand_piano';
            currentSong.baseKey = (exSong.baseKey !== undefined) ? exSong.baseKey : 0;
            currentSong.transpose = 0;
            currentSong.lastModified = Date.now();

            // 存檔與渲染
            saveData();
            renderAll();
            
            // 手機版自動收合側邊欄
            if (window.innerWidth <= 768) toggleSidebar(false);
        };

        if (contentIsEmpty) {
            doUpdate();
        } else {
            showConfirm(
                "覆蓋確認",
                "編輯區已有內容，確定要載入範例歌曲並覆蓋目前內容嗎？(此動作無法復原)",
                doUpdate
            );
        }
    }

    let hasWarnedSaveFailure = false; // 避免儲存空間爆滿時，每次防抖存檔失敗都重複跳出提示

    function saveData() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
            hasWarnedSaveFailure = false; // 這次存成功了，重置旗標，下次若又失敗會再提示一次
        } catch (e) {
            console.error("儲存失敗", e);
            if (!hasWarnedSaveFailure) {
                hasWarnedSaveFailure = true;
                showToast("⚠️ 儲存失敗！瀏覽器儲存空間可能已滿，最新變更未存檔。建議立即匯出備份，並刪除不需要的舊樂譜。", 'error', 6000);
            }
        }
    }

    // --- 新增：通用防抖工具，用法與既有的 recordHistory 打字防抖一致 ---
    function debounce(fn, delay) {
        let timer = null;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }
    // 停頓 400 毫秒才真正寫入 localStorage / 重繪側邊欄，避免每個字都觸發
    const debouncedSaveData = debounce(saveData, 400);
    const debouncedRenderSidebar = debounce(() => renderSidebar(), 400);

    // 保險：分頁即將關閉或切走時，立刻把還沒寫入的變更存檔，避免遺失
    window.addEventListener('beforeunload', () => {
        saveData();
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') saveData();
    });

    // --- 新增：匯出所有樂譜為 JSON 備份檔 ---
    function exportBackup() {
        try {
            const dataStr = JSON.stringify(appData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const dateStr = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `wesing_backup_${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            showToast('匯出失敗，請稍後再試', 'error');
        }
    }

    // --- 新增：從 JSON 備份檔匯入樂譜 (加入到現有清單，不覆蓋) ---
    function importBackup(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            let imported;
            try {
                imported = JSON.parse(e.target.result);
            } catch (err) {
                showToast('檔案格式錯誤，無法解析 JSON', 'error');
                return;
            }
            if (!imported || !Array.isArray(imported.songs) || imported.songs.length === 0) {
                showToast('檔案內容不是有效的樂譜備份，或備份內沒有樂譜', 'error');
                return;
            }
            showConfirm(
                "匯入備份",
                `即將匯入 ${imported.songs.length} 首樂譜，加入到目前的樂譜清單中，確定繼續嗎？`,
                () => {
                    let importedCount = 0;
                    imported.songs.forEach(song => {
                        if (!song || typeof song !== 'object') return; // 跳過壞掉的項目
                        appData.songs.push({
                            id: generateId(), // 避免與現有 id 衝突
                            title: typeof song.title === 'string' ? song.title : '未命名樂譜',
                            content: typeof song.content === 'string' ? song.content : '',
                            tempo: clampTempo(song.tempo),
                            instrument: typeof song.instrument === 'string' ? song.instrument : 'acoustic_grand_piano',
                            baseKey: Number.isFinite(song.baseKey) ? song.baseKey : 0,
                            transpose: Number.isFinite(song.transpose) ? song.transpose : 0,
                            lastModified: Date.now()
                        });
                        importedCount++;
                    });
                    saveData();
                    renderSidebar();
                    showToast(`成功匯入 ${importedCount} 首樂譜！`, 'success');
                }
            );
        };
        reader.onerror = () => showToast('讀取檔案失敗', 'error');
        reader.readAsText(file);
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // --- 新增：統一的拍速驗證/校正，避免 0、負數、超大值等不合法輸入 ---
    function clampTempo(value) {
        let v = parseInt(value);
        if (!Number.isFinite(v)) v = 100;
        if (v < 20) v = 20;
        if (v > 300) v = 300;
        return v;
    }

    function getCurrentSong() {
        return appData.songs.find(s => s.id === appData.currentId);
    }

    function createNewSong(title = "未命名樂譜", content = "") {
        const existingEmpty = appData.songs.find(s => s.title === title && s.content === "");
        if (existingEmpty) {
            switchSong(existingEmpty.id);
            return existingEmpty;
        }

        const newSong = { 
            id: generateId(), 
            title: title, 
            content: content, 
            lastModified: Date.now(),
            tempo: 100,
            instrument: 'acoustic_grand_piano',
            baseKey: 0,
            transpose: 0
        };
        appData.songs.unshift(newSong);
        appData.currentId = newSong.id;
        saveData();
        renderAll();
        return newSong;
    }

    function updateCurrentSongSettings() {
        const song = getCurrentSong();
        if (song) {
            song.tempo = currentTempo;
            song.instrument = currentInstrument;
            song.baseKey = currentBaseKey;
            song.transpose = currentTranspose;
            saveData();
        }
    }

    function deleteSong(id, event) {
        event.stopPropagation();
        showConfirm("刪除樂譜", "確定要刪除這首樂譜嗎？刪除後無法復原。", () => {
            appData.songs = appData.songs.filter(s => s.id !== id);
            if (appData.songs.length === 0) createNewSong();
            else if (id === appData.currentId) appData.currentId = appData.songs[0].id;
            saveData();
            renderAll();
        });
    }

    async function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }
    }

    function freqToMidi(freq) {
        return Math.round(69 + 12 * Math.log2(freq / 440));
    }

    // --- Dynamic Script Loader ---
    async function loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.crossOrigin = "anonymous";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }

    async function loadInstrument(instName, targetCtx) {
        // 1. 第一道防呆：若無名稱直接回傳 null
        if (!instName) return null;

        const ctx = targetCtx || audioCtx;
        
        // 2. 檢查快取
        // 注意：這裡使用 instName 作為 key，確保別名 (如 drum_kick) 能被正確快取
        if (!targetCtx && loadedInstruments[instName]) {
            return loadedInstruments[instName];
        }
        
        try {
            // 將載入 soundfont-player 函式庫也納入 try/catch，避免 CDN 失敗時變成未捕捉的 rejection
            if (typeof window.Soundfont === 'undefined') {
                await loadScript('https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js');
            }

            if (!ctx && !targetCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }

            // 3. [關鍵修改] 設定高品質音源庫 (FluidR3_GM)
            const hqUrl = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/';
            
            // 處理鼓組映射 (如果有的話)
            const DRUM_MAP = {
                'drum_kick': 'taiko_drum', 'drum_snare': 'synth_drum', 
                'drum_hihat_close': 'woodblock', 'drum_hihat_open': 'agogo',
                'drum_tom_hi': 'melodic_tom', 'drum_tom_lo': 'melodic_tom',
                'drum_crash': 'agogo', 'drum_ride': 'tinkle_bell'
            };
            const realInstName = DRUM_MAP[instName] || instName;

            // 載入樂器 (指定 URL)
            const inst = await window.Soundfont.instrument(ctx || audioCtx, realInstName, {
                nameToUrl: (name, soundfont, format) => {
                    return `${hqUrl}${name}-${format || 'mp3'}.js`;
                }
            });
            
            if (!targetCtx) {
                loadedInstruments[instName] = inst;
            }
            failedInstruments.delete(instName); // 若之前失敗過，這次成功了就清除記錄
            return inst;
        } catch (e) {
            console.error(`Soundfont load failed for ${instName}`, e);
            // 失敗時不拋出錯誤，而是回傳 null，避免卡死 Promise.all
            // 每個音色只提示一次，避免播放時重複跳出同樣的提示
            if (!failedInstruments.has(instName)) {
                failedInstruments.add(instName);
                showToast(`⚠️ 音色「${instName}」載入失敗，該音軌將被略過`, 'warning');
            }
            return null;
        }
    }

    function playTone(freq, startTime, duration, instVal, targetCtx, targetPlayer) {
        const ctx = targetCtx || audioCtx;
        
        // 如果是匯出模式，targetPlayer 會被傳入；否則使用全域 activeSoundfontInst
        // 但注意：節奏樂器在匯出時也需要正確的 Player 實例
        
        let volumeBoost = 1.0; 
        const targetInst = instVal || currentInstrument;

		// 爵士鼓組與打擊樂頻率映射
        if (targetInst === 'drum_kick') { 
            freq = 60; volumeBoost = 6.0; 
            duration = Math.min(duration, 0.3); 
        }        
        else if (targetInst === 'drum_snare') { 
            freq = 180;       // 稍微降低頻率，讓聲音更厚實
            volumeBoost = 3.0; 
            duration = 0.02;
        }
        else if (targetInst === 'drum_tom_hi') { freq = 400; volumeBoost = 5.0; }
        else if (targetInst === 'drum_tom_lo') { freq = 150; volumeBoost = 5.0; }
        else if (targetInst === 'drum_hihat_close') { freq = 1200; volumeBoost = 3.0; duration = 0.1; } // 極短促
        else if (targetInst === 'drum_hihat_open') { freq = 800; volumeBoost = 3.0; }
        else if (targetInst === 'drum_crash') { freq = 900; volumeBoost = 4.0; } // 高音金屬
        else if (targetInst === 'drum_ride') { freq = 1500; volumeBoost = 2.5; } // 清脆點擊
        
        // 原有的打擊樂
        else if (targetInst === 'taiko_drum') { freq = 100; volumeBoost = 5.0; }
        else if (targetInst === 'synth_drum') { freq = 250; volumeBoost = 4.0; }
        else if (targetInst === 'woodblock') { freq = 800; volumeBoost = 6.0; }

        const instDef = getInstrumentDef(targetInst);
        if (instDef.type === 'soundfont') {
            // 優先使用傳入的 Player (匯出用)，否則嘗試從快取抓 (播放用)
            let player = targetPlayer;
            if (!player && !targetCtx) {
                player = loadedInstruments[targetInst]; 
            }

            if (player) {
                const midi = freqToMidi(freq);
                try {
                    const node = player.play(midi, startTime, { 
                        duration: duration,
                        gain: volumeBoost 
                    });

                    // 如果是即時播放 (非匯出)，將聲音節點存入清單，以便可以被停止
                    if (!targetCtx) {
                        activeOscillators.push({ stop: () => {
                            try { node.stop(); } catch(e){} 
                        }});
                    }

                } catch(e) { console.warn("Play error", e); }
            }
        } else {
            // 合成器邏輯
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = instDef.val; 
            osc.frequency.value = freq;
            
            const now = startTime;
            gain.gain.setValueAtTime(0, now);
            
            if (instDef.val === 'square') { 
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.setValueAtTime(0.1, now + duration - 0.01);
                gain.gain.linearRampToValueAtTime(0, now + duration);
            } else { 
                gain.gain.linearRampToValueAtTime(0.5, now + 0.02); 
                gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
            }
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + duration);

            if (!targetCtx) {
                activeOscillators.push({ 
                    stop: () => {
                        try {
                            gain.gain.cancelScheduledValues(ctx.currentTime);
                            gain.gain.setValueAtTime(0, ctx.currentTime);
                            osc.stop();
                        } catch(e){}
                    }
                });
            }
        }
    }


    // [修正] 匯出功能 (同步最新的頻率計算邏輯)
    async function exportAudio() {
        // 防連點：若正在匯出中，直接忽略這次點擊
        if (isExportingAudio) {
            showToast("匯出中，請稍候…", 'info');
            return;
        }

        const notes = parseScore(codeInput.value);
        if (notes.length === 0) {
            showToast("沒有可匯出的內容", 'warning');
            return;
        }

        isExportingAudio = true;
        const btn = document.getElementById('export-btn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<div class="icon-loading" style="display:block; width:16px; height:16px; border-color:#555; border-top-color:transparent;"></div>';
        btn.disabled = true;

        try {
            const tempo = clampTempo(tempoInput.value);
            const beatTime = 60 / tempo;
            let maxTime = 0;
            
            notes.forEach(n => {
                if (n.play) {
                    const end = n.startTime * beatTime + n.duration * beatTime;
                    if (end > maxTime) maxTime = end;
                }
            });
            
            const duration = maxTime + 2; 
            const sampleRate = 44100; 
            const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, duration * sampleRate, sampleRate);

            const usedInstruments = [...new Set(notes.map(n => n.instrument))];
            const offlinePlayers = {};

            await Promise.all(usedInstruments.map(async (instVal) => {
                const instDef = getInstrumentDef(instVal);
                if (instDef && instDef.type === 'soundfont') {
                    offlinePlayers[instVal] = await loadInstrument(instVal, offlineCtx);
                }
            }));

            const totalShift = currentBaseKey + currentTranspose;
            const pitchFactor = Math.pow(2, totalShift / 12);

            notes.forEach(note => {
                if (!note.play || note.isRest) return;

                const noteStartTime = note.startTime * beatTime;
                const noteTotalDuration = note.duration * beatTime; 

                if (note.type === 'chord' && note.chordFreqs) {
                    let patternLib = RHYTHM_BLOCK; 
                    if (note.rhythmType === 'arp') patternLib = RHYTHM_ARP;

                    let pattern = null;
                    if (note.rhythmType === 'custom' && note.customSteps) {
                        pattern = { steps: note.customSteps };
                    } else {
                        pattern = patternLib[note.rhythmId] || patternLib[1];
                    }
                    const patternLen = 4;
                    
                    // [修正] 與 playMusic 同步的完整頻率表
                    const getFreq = (code, root, noteObj) => {
                        let baseF = 0; const freqs = noteObj.chordFreqs;
                        const isMinor = noteObj.chordInfo && noteObj.chordInfo.quality.includes('m') && !noteObj.chordInfo.quality.includes('maj');
                        switch (code) {
                            case 0: baseF = freqs[0]; break;
                            case 1: baseF = freqs[1] || freqs[0] * 1.2599; break;
                            case 2: baseF = freqs[2] || freqs[0] * 1.4983; break;
                            case 3: if (freqs[3]) baseF = freqs[3]; else baseF = freqs[0] * (isMinor ? 1.7817 : 1.8877); break;
                            case 9: baseF = freqs[0] * 1.12246; break;
                            
                            case 11: baseF = freqs[0] * 1.3348; break; // 4
                            case 13: baseF = freqs[0] * 1.6818; break; // 6

                            case -1: baseF = freqs[0] / 2; break;
                            case -2: baseF = (freqs[2] || freqs[0] * 1.4983) / 2; break;
                            case -3: if (freqs[3]) baseF = freqs[3] / 2; else baseF = (freqs[0] * (isMinor ? 1.7817 : 1.8877)) / 2; break;
                            case -4: baseF = (freqs[1] || freqs[0] * 1.2599) / 2; break;
                            case -20: baseF = (freqs[0] * 1.12246) / 2; break;
                            case -21: baseF = (freqs[0] * 1.3348) / 2; break;
                            case -22: baseF = (freqs[0] * 1.6818) / 2; break;

                            case 12: baseF = freqs[0] * 2; break;
                            case 14: baseF = (freqs[0] * 1.12246) * 2; break;
                            case 15: baseF = (freqs[1] || freqs[0] * 1.2599) * 2; break;
                            case 16: baseF = (freqs[0] * 1.3348) * 2; break;
                            case 17: baseF = (freqs[2] || freqs[0] * 1.4983) * 2; break;
                            case 18: baseF = (freqs[0] * 1.6818) * 2; break;
                            case 19: if(freqs[3]) baseF=freqs[3]*2; else baseF = (freqs[0] * (isMinor ? 1.7817 : 1.8877)) * 2; break;

                            default: baseF = freqs[0]; 
                        }
                        return baseF;
                    };
                    
                    for (let loopStart = 0; loopStart < note.duration; loopStart += patternLen) {
                        pattern.steps.forEach(step => {
                            const stepAbsStart = loopStart + step.t;
                            if (stepAbsStart >= note.duration) return;
                            let playDuration = step.len;
                            if (stepAbsStart + playDuration > note.duration) playDuration = note.duration - stepAbsStart;
                            const absTime = noteStartTime + (stepAbsStart * beatTime);
                            const absDur = playDuration * beatTime;
                            if (Array.isArray(step.notes)) {
                                step.notes.forEach(code => {
                                    const f = getFreq(code, note.chordFreqs[0], note);
                                    if (f > 0) {
                                        playTone(f * pitchFactor, absTime, absDur, note.instrument, offlineCtx, offlinePlayers[note.instrument]);
                                    }
                                });
                            }
                        });
                    }
                }
                else if (note.freq > 0) {
                    const finalFreq = note.freq * pitchFactor;
                    playTone(finalFreq, noteStartTime, noteTotalDuration, note.instrument, offlineCtx, offlinePlayers[note.instrument]);
                }
            });

            const renderedBuffer = await offlineCtx.startRendering();
            const mp3Blob = bufferToMP3(renderedBuffer);
            const url = URL.createObjectURL(mp3Blob);
            const a = document.createElement('a');
            const songName = titleInput.value.trim() || "樂譜";
            a.style.display = 'none';
            a.href = url;
            a.download = `${songName}.mp3`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);

        } catch (e) {
            console.error("Export failed", e);
            showToast("匯出失敗：" + e.message, 'error');
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            isExportingAudio = false;
        }
    }

    function bufferToMP3(buffer) {
        if (!window.lamejs) {
            showToast("MP3 編碼器尚未載入，請檢查網路連線。", 'warning');
            throw new Error("lamejs not loaded");
        }

        const channels = 1; // 單聲道
        const sampleRate = buffer.sampleRate; // 44100
        const kbps = 128; // 128kbps 是標準 MP3 音質，檔案小且品質好
        
        const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
        const mp3Data = [];
        
        // 取得左聲道資料 (因為我們設定為單聲道)
        const samples = buffer.getChannelData(0);
        
        // 轉換 Float32 (-1.0 ~ 1.0) 為 Int16 (-32768 ~ 32767)
        // lamejs 需要整數輸入
        const sampleBlockSize = 1152; // MP3 的處理區塊大小
        const samplesInt16 = new Int16Array(samples.length);
        
        for (let i = 0; i < samples.length; i++) {
            // 簡單的放大並轉整數，限制範圍在 -1 ~ 1 之間以防爆音
            let s = Math.max(-1, Math.min(1, samples[i]));
            samplesInt16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // 分塊編碼
        for (let i = 0; i < samplesInt16.length; i += sampleBlockSize) {
            const chunk = samplesInt16.subarray(i, i + sampleBlockSize);
            const mp3buf = mp3encoder.encodeBuffer(chunk);
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        }

        // 結束編碼，取得最後一段數據
        const mp3buf = mp3encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }

        return new Blob(mp3Data, { type: 'audio/mp3' });
    }



	// 將簡譜節奏字串解析為 steps 物件
	// 將簡譜節奏字串解析為 steps 物件
	function parseRhythmString(patternStr) {
		const steps = [];
		let currentTime = 0;
		let groupCache = []; 

		// 支援全形/半形空格切割
		const tokens = patternStr.trim().split(/[\s\u3000]+/);

		// 音高代碼對照表
		const noteMap = {
			'1.': -1, '2.': -20, '3.': -4, '4.': -21, '5.': -2, '6.': -22, '7.': -3, 
			'1': 0, '2': 9, '3': 1, '4': 11, '5': 2, '6': 13, '7': 3, 
			'.1': 12, '.2': 14, '.3': 15, '.4': 16, '.5': 17, '.6': 18, '.7': 19
		};

		tokens.forEach(token => {
			if (!token) return;
			let duration = 1; 
			let cleanToken = token;
			
			// 處理時值後綴
			if (token.endsWith('---')) { duration = 4; cleanToken = token.slice(0, -3); }
			else if (token.endsWith('--')) { duration = 3; cleanToken = token.slice(0, -2); }
			else if (token.endsWith('-/')) { duration = 2.5; cleanToken = token.slice(0, -2); }
			else if (token.endsWith('-')) { duration = 2; cleanToken = token.slice(0, -1); }
			else if (token.endsWith('/*')) { duration = 0.75; cleanToken = token.slice(0, -2); } 
			else if (token.endsWith('*')) { duration = 1.5; cleanToken = token.slice(0, -1); }   
			else if (token.endsWith('//')) { duration = 0.25; cleanToken = token.slice(0, -2); }
			else if (token.endsWith('/')) { duration = 0.5; cleanToken = token.slice(0, -1); }

			let notes = [];
			
			// A. 引用群組 ($1)
			if (cleanToken.startsWith('$')) {
				const refIdx = parseInt(cleanToken.substring(1)) - 1;
				// [修正] 確保引用時使用的是複製的陣列，避免傳參考問題
				if (groupCache[refIdx]) { notes = [...groupCache[refIdx]]; }
			} 
			// B. 休止符 (0)
			else if (cleanToken === '0') { 
				notes = []; 
			}
			// C. 音符解析
			else {
				// 1. 移除括號
				let inner = cleanToken.replace(/[\(\)]/g, '');
				
				// 2. 混合解析策略 (支援 1.135 或 1'3'5)
				let subTokens = [];
				if (inner.includes("'")) {
					let segments = inner.split("'");
					segments.forEach(seg => {
						if (!seg) return;
						let found = seg.match(/[.:]*[0-7][.:]*/g);
						if (found) subTokens.push(...found);
					});
				} else {
					// 自動拆解 1.135 -> 1. , 1 , 3 , 5
					subTokens = inner.match(/[.:]*[0-7][.:]*/g) || [];
				}

				// 3. 映射到代碼
				subTokens.forEach(t => { 
					if (noteMap.hasOwnProperty(t)) {
						notes.push(noteMap[t]); 
					} else {
						// 容錯處理：移除所有符號只取數字
						let simpleNum = t.replace(/[.:]/g, '');
						if (noteMap.hasOwnProperty(simpleNum)) notes.push(noteMap[simpleNum]);
					}
				});
				
				// 4. [修正] 只要原始 token 有括號，就視為定義新群組並快取
				if (token.includes('(')) { 
                    groupCache.push([...notes]); // 存入副本
                }
			}

			steps.push({ t: currentTime, len: duration, notes: notes });
			currentTime += duration;
		});

		return { name: "Custom Rhythm", steps: steps };
	}

    // [修正] 樂譜解析核心 (支援 ignoreFlow 參數)
    // [修正] 樂譜解析核心 (支援扁平化 [r1: ...] 語法)
    function parseScore(text, ignoreFlow = false) {
        // ==========================================
        // 0. 預處理：解析並「挖空」自定義節奏定義
        // ==========================================
        let customRhythms = { 'r': {} }; 
        
        // [關鍵修正] 匹配 [r1: 內容] 或 [rhythm2: 內容]
        // Group 1: r 或 rhythm
        // Group 2: 數字 ID (1, 2...)
        // Group 3: 內容 (不含右括號)
        const defRegex = /\[(rhythm|r)\s*(\d+)\s*[:：]\s*([^\]]+)\]/gi;
        
        let textForParsing = text.replace(defRegex, (match, pType, pId, pContent) => {
            const prefix = 'r'; 
            const id = parseInt(pId, 10);
            const content = pContent.trim();
            
            if (content) {
                const patternObj = parseRhythmString(content);
                patternObj.name = `Custom r${id}`;
                customRhythms[prefix][id] = patternObj;
            }
            
            // 將標籤替換為等長的空白，避免被當成音符解析，且確保游標高亮位置正確
            return ' '.repeat(match.length);
        });

        // ==========================================
        // 1. 預處理：流程管理
        // ==========================================
        let lines = [];
        const flowMatch = textForParsing.match(/^\[\s*play\s*:\s*(.*?)\]/im);

        if (flowMatch && !ignoreFlow) {
            const flowIds = flowMatch[1].trim().split(/\s+/); 
            const sectionMap = {};
            
            const braceRegex = /\[([a-zA-Z0-9_-]+)\]\s*\{([^}]*)\}/g;
            let bMatch;
            while ((bMatch = braceRegex.exec(textForParsing)) !== null) {
                const label = bMatch[1];
                const content = bMatch[2];
                const openBraceIndex = textForParsing.indexOf('{', bMatch.index);
                const realStartOffset = openBraceIndex + 1; 
                sectionMap[label] = { content: content, startOffset: realStartOffset };
            }

            const headerRegex = /^\[([a-zA-Z0-9_-]+)\].*$/gm;
            let hMatch;
            let headers = [];
            while ((hMatch = headerRegex.exec(textForParsing)) !== null) {
                 if (hMatch[1].toLowerCase() === 'play' || hMatch[1].toLowerCase() === 'rhythm') continue;
                 headers.push({ label: hMatch[1], idx: hMatch.index, len: hMatch[0].length });
            }
            headers.forEach((h, i) => {
                if (sectionMap[h.label]) return;
                const start = h.idx + h.len;
                const end = (i + 1 < headers.length) ? headers[i+1].idx : textForParsing.length;
                const content = textForParsing.substring(start, end);
                sectionMap[h.label] = { content: content, startOffset: start };
            });

            flowIds.forEach(id => {
                const section = sectionMap[id];
                if (section) {
                    let ptr = 0;
                    const secText = section.content;
                    while (ptr < secText.length) {
                        let endIdx = secText.indexOf('\n', ptr);
                        if (endIdx === -1) endIdx = secText.length;
                        let lineContent = secText.substring(ptr, endIdx);
                        if (lineContent.endsWith('\r')) lineContent = lineContent.slice(0, -1);
                        if (lineContent.trim()) {
                            lines.push({ text: lineContent, startIndex: section.startOffset + ptr });
                        }
                        ptr = endIdx + 1;
                    }
                    lines.push({ text: "", startIndex: -1 });
                }
            });
        } else {
            let ptr = 0;
            while (ptr < textForParsing.length) {
                 let endIdx = textForParsing.indexOf('\n', ptr);
                 if (endIdx === -1) endIdx = textForParsing.length;
                 let lineContent = textForParsing.substring(ptr, endIdx);
                 if (lineContent.endsWith('\r')) lineContent = lineContent.slice(0, -1);
                 
                 if (!lineContent.trim().match(/^\[([a-zA-Z0-9_-]+)\].*$/)) {
                     lines.push({ text: lineContent, startIndex: ptr });
                 }
                 ptr = endIdx + 1; 
            }
        }

        // ==========================================
        // 2. 分組邏輯
        // ==========================================
        const blocks = [];
        let currentSimulBlock = [];
        const labelRegex = /^\s*([a-zA-Z0-9_-]+):\s*(.*)/;

        lines.forEach(lineObj => {
            const cleanLine = lineObj.text.trim();
            if (!cleanLine) {
                if (currentSimulBlock.length > 0) { blocks.push(currentSimulBlock); currentSimulBlock = []; }
                return;
            }
            if (cleanLine.match(labelRegex)) currentSimulBlock.push(lineObj);
            else {
                if (currentSimulBlock.length > 0) { blocks.push(currentSimulBlock); currentSimulBlock = []; }
                blocks.push([lineObj]);
            }
        });
        if (currentSimulBlock.length > 0) blocks.push(currentSimulBlock);

        // ==========================================
        // 3. 解析音符
        // ==========================================
        let allNotes = [];
        let globalTimeOffset = 0; 

        blocks.forEach(block => {
            let blockMaxDuration = 0; 

            block.forEach((lineObj, lineIndex) => {
                const lineText = lineObj.text;
                let currentLineInstrument = currentInstrument; 
                let parseText = lineText;
                let textOffsetInLine = 0; 

                const match = lineText.match(labelRegex);
                if (match) {
                    const instId = match[1]; 
                    const instDef = instruments.find(i => i.id === instId || i.alias === instId);
                    if (instDef) currentLineInstrument = instDef.val; 
                    parseText = match[2]; 
                    textOffsetInLine = lineText.indexOf(parseText); 
                }

                const parts = parseText.split(/(\s+)/);
                let rawLineNotes = []; 
                let inputIdx = 0; 
                let pendingAccidental = 0;

                parts.forEach(part => {
                    const token = part;
                    const inputLen = token.length;
                    const cleanStr = token.trim();

                    if (!cleanStr) { inputIdx += inputLen; return; }

                    let tempToken = cleanStr;
                    const tokenAbsStart = lineObj.startIndex + textOffsetInLine + inputIdx;
                    const tokenAbsEnd = tokenAbsStart + token.length;

                    // [關鍵修正] 忽略 [A1], [B] 等段落標記，避免裡面的數字被誤認為音符
                    if (/^\[.*\]$/.test(cleanStr)) { 
                        inputIdx += inputLen; 
                        return; 
                    }

                    if (cleanStr === '<') { rawLineNotes.push({ type: 'groupStart', play: false, duration: 0, visualDuration: 0, inputStart: tokenAbsStart, inputEnd: tokenAbsEnd }); inputIdx += inputLen; return; }
                    if (cleanStr === '>') { rawLineNotes.push({ type: 'groupEnd', play: false, duration: 0, visualDuration: 0, inputStart: tokenAbsStart, inputEnd: tokenAbsEnd }); inputIdx += inputLen; return; }
                    if (cleanStr === '((') { rawLineNotes.push({ type: 'tieSymbol', play: false, duration: 0, inputStart: tokenAbsStart, inputEnd: tokenAbsEnd }); inputIdx += inputLen; return; }
                    if (cleanStr === '||:') { rawLineNotes.push({ type: 'repeatStart' }); inputIdx += inputLen; return; }
                    if (cleanStr === ':||') { rawLineNotes.push({ type: 'repeatEnd' }); inputIdx += inputLen; return; }

                    let hasTupletStart = false; let hasTupletEnd = false; let localInputOffset = 0;
                    if (tempToken.startsWith('<')) { hasTupletStart = true; tempToken = tempToken.substring(1); localInputOffset = 1; } 
                    if (tempToken.endsWith('>')) { hasTupletEnd = true; tempToken = tempToken.slice(0, -1); }
                    if (hasTupletStart) rawLineNotes.push({ type: 'groupStart', play: false, duration: 0, visualDuration: 0 });

                    const compactMatch = tempToken.match(/^\(([0-7.:'\s]+)\)([\/\\*-]*)$/);
                    if (compactMatch) {
                        const content = compactMatch[1]; const suffix = compactMatch[2];
                        rawLineNotes.push({ type: 'chordStart', play: false, duration: 0, inputStart: tokenAbsStart });
                        let tokens = [];
                        if (content.includes(' ')) tokens = content.split(/\s+/);
                        else {
                            let segments = content.split("'");
                            segments.forEach(seg => { if(seg) { let found = seg.match(/[.:]*[0-7][.:]*/g); if(found) tokens.push(...found); }});
                        }
                        for (let tokenStr of tokens) {
                            const numMatch = tokenStr.match(/[0-7]/);
                            if (numMatch) {
                                const char = numMatch[0]; let freq = relFreqs[char] || 0;
                                const prefix = tokenStr.substring(0, numMatch.index); const suffixPart = tokenStr.substring(numMatch.index + 1);
                                if (prefix.includes(':')) freq *= 4; else if (prefix.includes('.')) freq *= 2;
                                if (suffixPart.includes(':')) freq /= 4; else if (suffixPart.includes('.')) freq /= 2;
                                let noteDuration = 1;
                                if (suffix.includes('//')) noteDuration = 0.25; else if (suffix.includes('/')) noteDuration = 0.5; else if (suffix.includes('\\')) noteDuration = 0.5; else if (suffix.includes('*')) noteDuration = 1.5; else if (suffix.includes('-')) noteDuration = 1 + suffix.length;
                                rawLineNotes.push({ type: 'note', freq: freq, duration: noteDuration, visualDuration: noteDuration, play: true, isRest: (char === '0'), instrument: currentLineInstrument, inputStart: tokenAbsStart, inputEnd: tokenAbsEnd, isMainTrack: (lineIndex === 0) });
                            }
                        }
                        rawLineNotes.push({ type: 'chordEnd', play: false, duration: 0, inputEnd: tokenAbsEnd });
                        if (hasTupletEnd) rawLineNotes.push({ type: 'groupEnd', play: false, duration: 0, visualDuration: 0 });
                        inputIdx += inputLen; return; 
                    }

                    if (tempToken.startsWith('(')) { rawLineNotes.push({ type: 'chordStart', play: false, duration: 0, inputStart: tokenAbsStart }); tempToken = tempToken.substring(1); localInputOffset = 1; }
                    if (tempToken.endsWith(')')) { tempToken = tempToken.slice(0, -1); } 
                    
                    if (cleanStr === '(') { rawLineNotes.push({ type: 'chordStart', play: false, duration: 0, inputStart: tokenAbsStart, inputEnd: tokenAbsEnd }); inputIdx += inputLen; return; }
                    if (cleanStr === ')') { rawLineNotes.push({ type: 'chordEnd', play: false, duration: 0, inputStart: tokenAbsStart, inputEnd: tokenAbsEnd }); inputIdx += inputLen; return; }

                    const absoluteStart = lineObj.startIndex + textOffsetInLine + inputIdx + localInputOffset;
                    const absoluteEnd = absoluteStart + tempToken.length;

                    let note = { token: tempToken, freq: 0, chordFreqs: null, chordInfo: null, rhythmId: 1, rhythmType: '', customSteps: null, customPattern: null, duration: 1, inputStart: absoluteStart, inputEnd: absoluteEnd, isRest: false, isExtension: tempToken === '-', isTieStart: false, play: true, visualDuration: 1, type: 'note', instrument: currentLineInstrument, startTime: 0, isMainTrack: (lineIndex === 0) };
                    let isChordParsed = false;

                    // [關鍵修正] 偵測 r1C 或 rhythm2Am 等自定義和弦
                    const customRhythmMatch = tempToken.match(/^(r|rhythm)(\d+)([A-G][b#]?.*)/i);
                    if (customRhythmMatch) {
                        const rId = parseInt(customRhythmMatch[2], 10);
                        const chordPart = customRhythmMatch[3];
                        
                        if (checkChord(chordPart, note)) {
                            isChordParsed = true; 
                            note.type = 'chord'; 
                            note.rhythmId = rId; 
                            note.rhythmType = 'custom';
                            
                            // 直接從 'r' 取值
                            if (customRhythms['r'] && customRhythms['r'][rId]) {
                                note.customPattern = customRhythms['r'][rId]; 
                                note.customSteps = customRhythms['r'][rId].steps;
                            }
                            parseDurationSuffix(tempToken, note);
                        }
                    }

                    // 既有的 .C 與 :C 解析
                    if (!isChordParsed && (tempToken.startsWith('.') || tempToken.startsWith(':'))) {
                        let rawContent = tempToken.substring(1); 
                        let rType = tempToken.startsWith('.') ? 'block' : 'arp';
                        let cleanContent = rawContent.replace(/[\/\(\)\\*-]/g, ''); 
                        let rhythmMatch = cleanContent.match(/^(\d+)/); 
                        let chordNamePart = cleanContent; 
                        let rhythmIdTemp = 1;
                        if (rhythmMatch) { rhythmIdTemp = parseInt(rhythmMatch[1], 10); chordNamePart = cleanContent.substring(rhythmMatch[0].length); }
                        if (checkChord(chordNamePart, note)) {
                            isChordParsed = true; note.type = 'chord'; note.rhythmId = rhythmIdTemp; note.rhythmType = rType;
                            parseDurationSuffix(tempToken, note);
                        }
                    }

                    // 一般音符解析
                    if (!isChordParsed) {
                         if (tempToken.startsWith('*')) { note.type = 'dotted'; note.play = false; note.duration = 0; }
                         else if ((token.match(/^[a-zA-Z]/) && !['b','z'].includes(tempToken)) || tempToken.includes('|') || tempToken === ':') { /* ignore */ }
                         else if (tempToken === 'b') { pendingAccidental = -1; }
                         else if (tempToken === '#') { pendingAccidental = 1; }
                         else if (tempToken === 'z') { pendingAccidental = 0; }
                         else if (note.isExtension) { note.play = false; note.duration = 1; note.visualDuration = note.duration; }
                         else {
                            const cleanToken = tempToken.replace(/[\(\/\*\\-]/g, '').trim(); 
                            const numMatch = cleanToken.match(/[0-7]/);
                            if (numMatch) {
                                const num = numMatch[0];
                                if (num === '0') { note.isRest = true; pendingAccidental = 0; } 
                                else {
                                    let freq = relFreqs[num]; const prefix = cleanToken.substring(0, numMatch.index); const suffix = cleanToken.substring(numMatch.index + 1);
                                    if (pendingAccidental === -1) freq *= Math.pow(2, -1/12); if (pendingAccidental === 1) freq *= Math.pow(2, 1/12); pendingAccidental = 0;
                                    if (prefix.includes('b')) freq *= Math.pow(2, -1/12); if (prefix.includes('#')) freq *= Math.pow(2, 1/12);
                                    if (prefix.includes(':')) freq *= 4; else if (prefix.includes('.')) freq *= 2; if (suffix.includes(':')) freq /= 4; else if (suffix.includes('.')) freq /= 2;
                                    note.freq = freq;
                                }
                            }
                            parseDurationSuffix(tempToken, note);
                         }
                    }

                    if (note.freq > 0 || note.isRest || note.isExtension || note.type === 'chord' || note.type === 'dotted') {
                        note.visualDuration = note.duration; rawLineNotes.push(note);
                    }
                    if (hasTupletEnd) rawLineNotes.push({ type: 'groupEnd', play: false, duration: 0, visualDuration: 0 });
                    if (cleanStr.endsWith(')')) rawLineNotes.push({ type: 'chordEnd', play: false, duration: 0, inputEnd: tokenAbsEnd });
                    
                    inputIdx += inputLen;
                });

                // --- 4. 後處理 ---
                let expandedNotes = []; let repeatStartIdx = 0;
                for (let i = 0; i < rawLineNotes.length; i++) {
                    const item = rawLineNotes[i];
                    if (item.type === 'repeatStart') { repeatStartIdx = expandedNotes.length; } 
                    else if (item.type === 'repeatEnd') {
                        const section = expandedNotes.slice(repeatStartIdx);
                        section.forEach(n => expandedNotes.push(Object.assign({}, n)));
                        repeatStartIdx = expandedNotes.length;
                    } else { expandedNotes.push(item); }
                }
                let processedLineNotesRaw = expandedNotes;

                for (let i = 0; i < processedLineNotesRaw.length; i++) {
                    if (processedLineNotesRaw[i].type === 'groupStart') {
                        let endIndex = -1; let depth = 1;
                        for (let j = i + 1; j < processedLineNotesRaw.length; j++) {
                            if (processedLineNotesRaw[j].type === 'groupStart') depth++;
                            if (processedLineNotesRaw[j].type === 'groupEnd') depth--;
                            if (depth === 0) { endIndex = j; break; }
                        }
                        if (endIndex !== -1) {
                            const scaleFactor = 2 / 3;
                            for (let k = i + 1; k < endIndex; k++) {
                                let n = processedLineNotesRaw[k];
                                if (n.duration > 0) { n.duration *= scaleFactor; n.visualDuration *= scaleFactor; }
                            }
                            processedLineNotesRaw[i].play = false; processedLineNotesRaw[endIndex].play = false;
                        }
                    }
                }

                let processedLineNotes = [];
                const findLastPlayable = (list) => { for (let k = list.length - 1; k >= 0; k--) { let p = list[k]; if (p.play && !p.isRest && (p.type === 'note' || p.type === 'chord')) return p; } return null; };

                for (let i = 0; i < processedLineNotesRaw.length; i++) {
                    let curr = processedLineNotesRaw[i];
                    if (['groupStart', 'groupEnd', 'chordStart', 'chordEnd'].includes(curr.type)) { processedLineNotes.push(curr); continue; }
                    if (curr.type === 'tieSymbol') { let prev = findLastPlayable(processedLineNotes); if (prev) prev.isTieStart = true; continue; }
                    if (curr.isExtension) { let prev = findLastPlayable(processedLineNotes); if (prev) prev.duration += curr.duration; curr.play = false; processedLineNotes.push(curr); continue; }
                    if (curr.type === 'dotted') { let prev = findLastPlayable(processedLineNotes); if (prev) { const added = prev.duration * 0.5; prev.duration += added; curr.visualDuration = added; } else { curr.visualDuration = 0; } curr.play = false; processedLineNotes.push(curr); continue; }
                    let prev = findLastPlayable(processedLineNotes);
                    if (prev && prev.isTieStart && !curr.isRest && (curr.type === 'note' || curr.type === 'chord')) {
                        let match = false;
                        if (prev.type === 'chord' && curr.type === 'chord') match = JSON.stringify(prev.chordFreqs) === JSON.stringify(curr.chordFreqs);
                        else if (prev.type === 'note' && curr.type === 'note') match = Math.abs(prev.freq - curr.freq) < 0.1;
                        if (match) { prev.duration += curr.duration; curr.play = false; prev.isTieStart = false; } else { prev.isTieStart = false; }
                    }
                    processedLineNotes.push(curr);
                }

                for (let i = 0; i < processedLineNotes.length; i++) {
                    if (processedLineNotes[i].type === 'chordStart') {
                        let cStart = processedLineNotes[i].inputStart; let chordNotes = []; let cEnd = -1; let foundEnd = false;
                        for (let j = i + 1; j < processedLineNotes.length; j++) {
                            if (processedLineNotes[j].type === 'chordEnd') { cEnd = processedLineNotes[j].inputEnd; foundEnd = true; break; }
                            if (processedLineNotes[j].type === 'note' || processedLineNotes[j].type === 'chord') chordNotes.push(processedLineNotes[j]);
                        }
							if (foundEnd && chordNotes.length > 0) {
                            const finalStart = (cStart !== undefined) ? cStart : chordNotes[0].inputStart;
                            const finalEnd = (cEnd !== undefined) ? cEnd : chordNotes[chordNotes.length-1].inputEnd;
                            
                            // [關鍵修正] 讓所有和弦內音都保有座標，才能被「選取範圍」正確過濾
                            for (let k = 0; k < chordNotes.length; k++) { 
                                chordNotes[k].inputStart = finalStart; 
                                chordNotes[k].inputEnd = finalEnd; 
                                // 加入標記，避免 UI 重複閃爍高亮
                                if (k > 0) chordNotes[k].skipHighlight = true; 
                            }
                        }
                    }
                }

                // 5. 計算時間
                let lineTime = 0; let inChord = false; let chordStartTime = 0; let chordTimeAdvance = 0; let isFirstNoteInChord = false;
                processedLineNotes.forEach(note => {
                    if (note.type === 'chordStart') { inChord = true; chordStartTime = lineTime; chordTimeAdvance = 0; isFirstNoteInChord = true; return; }
                    if (note.type === 'chordEnd') { inChord = false; lineTime = chordStartTime + chordTimeAdvance; return; }
                    if (inChord) {
                        note.startTime = globalTimeOffset + chordStartTime;
                        if (isFirstNoteInChord && note.play && !note.isRest) { chordTimeAdvance = note.visualDuration || 0; isFirstNoteInChord = false; }
                    } else {
                        note.startTime = globalTimeOffset + lineTime;
                        lineTime += (note.visualDuration || 0); 
                    }
                    allNotes.push(note);
                });
                if (lineTime > blockMaxDuration) blockMaxDuration = lineTime;
            });
            globalTimeOffset += blockMaxDuration;
        });

        return allNotes;
    }



    // 輔助：提取的共用函數
    function checkChord(chordName, note) {
        if (!chordName) return false;
        const sortedRoots = Object.keys(CHORD_ROOTS).sort((a, b) => b.length - a.length);
        let rootVal = -1;
        let quality = "";

        for (let r of sortedRoots) {
            if (chordName.startsWith(r)) {
                rootVal = CHORD_ROOTS[r];
                quality = chordName.substring(r.length);
                break;
            }
        }

        if (rootVal !== -1) {
            note.chordInfo = { root: rootVal, quality: quality };
            note.chordFreqs = [];
            const intervals = CHORD_QUALITIES[quality] || [0, 4, 7];
            const baseC4 = 261.63;
            intervals.forEach(interval => {
                const semitone = rootVal + interval;
                const freq = baseC4 * Math.pow(2, semitone / 12);
                note.chordFreqs.push(freq);
            });
            return true;
        }
        return false;
    }

    function parseDurationSuffix(token, note) {
        let slashMatch = token.match(/[\/\\]+/); 
        if (slashMatch) {
            note.duration = 1 / Math.pow(2, slashMatch[0].length);
        }
    }


    // 播放邏輯
    async function playMusic() {
        if (isPlaying) {
            stopMusic();
            return;
        }

        await initAudio();

        const fullText = codeInput.value;
        const start = codeInput.selectionStart;
        const end = codeInput.selectionEnd;
        const hasSelection = start !== end;

        // [關鍵修正 1] 動態決定解析文本與播放模式
        let textToParse = fullText;
        let ignoreFlow = hasSelection;

        if (!hasSelection) {
            const playRegex = /^\[\s*play\s*:\s*(.*?)\]/im;
            const flowMatch = playRegex.exec(fullText);

            if (flowMatch) {
                const playBlockStart = flowMatch.index;
                const playBlockEnd = playBlockStart + flowMatch[0].length;

                if (start > playBlockEnd) {
                    // 游標在 [Play: ...] 區塊之後 (例如點在 [A1] 定義內)
                    // 使用者預期從此處開始聽，因此忽略流程，改為線性播放
                    ignoreFlow = true;
                } else if (start > playBlockStart && start <= playBlockEnd) {
                    // 游標在 [Play: ...] 區塊之內
                    // 動態將游標「前面」的段落 ID 替換為空白，讓系統只跑後面的流程
                    let tokenStart = start;
                    
                    // 往回找，直到遇到空白或冒號，定位當前單字的開頭
                    while (tokenStart > playBlockStart && !/[\s:]/.test(fullText[tokenStart - 1])) {
                        tokenStart--;
                    }

                    const prefixLength = fullText.indexOf(':', playBlockStart) + 1;
                    if (tokenStart > prefixLength) {
                        // 產生等長的空白來填補，確保文字長度不變，不破壞後續音符的游標高亮座標
                        const spaces = " ".repeat(tokenStart - prefixLength);
                        const originalArgsAfter = fullText.substring(tokenStart, playBlockEnd);
                        const newPlayBlock = fullText.substring(playBlockStart, prefixLength) + spaces + originalArgsAfter;
                        
                        textToParse = fullText.substring(0, playBlockStart) + newPlayBlock + fullText.substring(playBlockEnd);
                    }
                }
            }
        }

        // 使用動態調整後的文字進行解析
        let notes = parseScore(textToParse, ignoreFlow);

        let hasPlayableNote = notes.some(n => n.play && !n.isRest && (n.type === 'note' || n.type === 'chord'));
        if (!hasPlayableNote) {
            console.warn("No playable notes found.");
            stopMusic(); 
            return;
        }

        isPlaying = true;
        updatePlayButtonUI('loading'); 

        let seekTime = 0;
        
        // [關鍵修正 2] 尋找起始播放時間 (seekTime)
        if (hasSelection) {
            savedSelection = { start: start, end: end };
            const firstNote = notes.find(n => 
                n.inputStart !== undefined && n.inputEnd !== undefined &&
                Math.max(start, n.inputStart) < Math.min(end, n.inputEnd)
            );
            if (firstNote) seekTime = firstNote.startTime;
        } else {
            savedSelection = null;
            let targetNote = notes.find(n => start >= n.inputStart && start < n.inputEnd);
            if (!targetNote) targetNote = notes.find(n => n.inputStart >= start);
            if (targetNote) seekTime = targetNote.startTime;
        }

        const usedInstrumentVals = new Set(
            notes.filter(n => n.instrument).map(n => n.instrument)
        );
        usedInstrumentVals.add(currentInstrument);

        const loadPromises = Array.from(usedInstrumentVals).map(val => loadInstrument(val));

        Promise.all(loadPromises).then(() => {
            if (!isPlaying) return;

            updatePlayButtonUI('play');

            const tempo = currentTempo;
            const beatTime = 60 / tempo;
            const now = audioCtx.currentTime;
            const startTime = now + 0.1; 
            const pitchFactor = Math.pow(2, (currentTranspose + currentBaseKey) / 12);

            activeSoundfontInst = loadedInstruments[currentInstrument]; 

            let maxEndTime = 0;
            highlightEvents = []; // 每次播放重新收集
            highlightPointer = 0;

            notes.forEach(note => {
                if (['chordStart', 'chordEnd', 'groupStart', 'groupEnd', 'tieSymbol', 'repeatStart', 'repeatEnd'].includes(note.type)) return;

                if (hasSelection) {
                    if (note.inputEnd <= start || note.inputStart >= end) return;
                } else {
                    if (note.startTime < seekTime - 0.01) return;
                }

                const relativeNoteTime = note.startTime - seekTime;
                const noteAbsStart = startTime + relativeNoteTime * beatTime;

                if (note.inputStart !== undefined && note.inputEnd !== undefined) {
                    if (note.isMainTrack) {
                        // [優化] 不再對每個音符各自建立 setTimeout，改成先收集起來，
                        // 播放時用單一 requestAnimationFrame 迴圈輪詢，避免音符密集時計時器過多造成卡頓
                        highlightEvents.push({ time: noteAbsStart, start: note.inputStart, end: note.inputEnd });
                    }
                }

                if (note.play) {
                    const absDur = note.duration * beatTime;
                    const noteEndTime = noteAbsStart + absDur;
                    if (noteEndTime > maxEndTime) maxEndTime = noteEndTime;

                    if (note.type === 'chord' && note.chordFreqs) {
                        let patternLib = RHYTHM_BLOCK; 
                        if (note.rhythmType === 'arp') patternLib = RHYTHM_ARP;
                        
                        let pattern = null;
                        // [修正] 確保優先使用自定義節奏
                        if (note.rhythmType === 'custom' && note.customSteps) {
                            pattern = { steps: note.customSteps };
                        } else {
                            pattern = patternLib[note.rhythmId] || patternLib[1];
                        }
                        
                        const patternLen = 4;

                        // [關鍵修正] 完整的頻率對照表 (補全 4, 6, 高音)
                        const getFreq = (code, root, noteObj) => {
                             let baseF = 0; const freqs = noteObj.chordFreqs; 
                             const isMinor = noteObj.chordInfo && noteObj.chordInfo.quality.includes('m') && !noteObj.chordInfo.quality.includes('maj');
                             
                             switch (code) { 
                                 case 0: baseF = freqs[0]; break; // 1
                                 case 1: baseF = freqs[1] || freqs[0] * 1.2599; break; // 3
                                 case 2: baseF = freqs[2] || freqs[0] * 1.4983; break; // 5
                                 case 3: // 7
                                     if (freqs[3]) baseF = freqs[3]; 
                                     else baseF = freqs[0] * (isMinor ? 1.7817 : 1.8877); 
                                     break; 
                                 case 9: baseF = freqs[0] * 1.12246; break; // 2
                                 
                                 // [新增] 4 (Fa) 與 6 (La)
                                 case 11: baseF = freqs[0] * 1.3348; break; // 4
                                 case 13: baseF = freqs[0] * 1.6818; break; // 6

                                 // 低音區
                                 case -1: baseF = freqs[0] / 2; break; 
                                 case -2: baseF = (freqs[2] || freqs[0] * 1.4983) / 2; break; 
                                 case -3: if (freqs[3]) baseF = freqs[3] / 2; else baseF = (freqs[0] * (isMinor ? 1.7817 : 1.8877)) / 2; break; 
                                 case -4: baseF = (freqs[1] || freqs[0] * 1.2599) / 2; break; 
                                 case -20: baseF = (freqs[0] * 1.12246) / 2; break; 
                                 case -21: baseF = (freqs[0] * 1.3348) / 2; break; // 低音 4
                                 case -22: baseF = (freqs[0] * 1.6818) / 2; break; // 低音 6
                                 
                                 // 高音區
                                 case 12: baseF = freqs[0] * 2; break; // .1
                                 case 14: baseF = (freqs[0] * 1.12246) * 2; break; // .2
                                 case 15: baseF = (freqs[1] || freqs[0] * 1.2599) * 2; break; // .3
                                 // [新增] 高音 4, 5, 6, 7
                                 case 16: baseF = (freqs[0] * 1.3348) * 2; break; // .4
                                 case 17: baseF = (freqs[2] || freqs[0] * 1.4983) * 2; break; // .5
                                 case 18: baseF = (freqs[0] * 1.6818) * 2; break; // .6
                                 case 19: if(freqs[3]) baseF=freqs[3]*2; else baseF = (freqs[0] * (isMinor ? 1.7817 : 1.8877)) * 2; break; // .7

                                 default: baseF = freqs[0]; 
                             } 
                             return baseF;
                        };

                        for (let loopStart = 0; loopStart < note.duration; loopStart += patternLen) {
                            pattern.steps.forEach(step => {
                                const stepAbsStart = loopStart + step.t;
                                if (stepAbsStart >= note.duration) return;
                                let playDuration = step.len;
                                if (stepAbsStart + playDuration > note.duration) playDuration = note.duration - stepAbsStart;
                                const absTime = noteAbsStart + (stepAbsStart * beatTime); 
                                const absDur = playDuration * beatTime;
                                if (Array.isArray(step.notes)) {
                                    step.notes.forEach(code => {
                                        const f = getFreq(code, note.chordFreqs[0], note);
                                        if (f > 0) playTone(f * pitchFactor, absTime, absDur, note.instrument);
                                    });
                                }
                            });
                        }
                    } else {
                        if (!note.isRest && note.freq > 0) {
                            playTone(note.freq * pitchFactor, noteAbsStart, absDur, note.instrument);
                        }
                    }
                }
            });

            // [優化] 依時間排序後，啟動單一 requestAnimationFrame 迴圈輪詢高亮，取代大量 setTimeout
            highlightEvents.sort((a, b) => a.time - b.time);
            startHighlightLoop();

            const totalDurationSec = maxEndTime - now;
            if (totalDurationSec > 0) {
                playbackTimer = setTimeout(() => {
                    stopMusic();
                }, totalDurationSec * 1000 + 100); 
            } else {
                stopMusic();
            }
        }).catch(err => {
            console.error("Playback failed:", err);
            stopMusic();
            showToast("載入樂器失敗，請檢查網路連線。", 'error');
        });
    }

    // [新增] 單一 rAF 迴圈：跟著音訊時間走，只在真的換到下一個音符時才更新一次反白
    // 取代原本「每個音符各自一個 setTimeout」的作法，大幅減少音符密集時的 DOM 操作次數
    function startHighlightLoop() {
        if (highlightRafId) cancelAnimationFrame(highlightRafId);

        function tick() {
            if (!isPlaying) return;
            const nowT = audioCtx.currentTime;

            // 一次 tick 可能同時經過好幾個很密集的音符事件，只套用「最後一個」即可 (前面的反正馬上被蓋掉，沒必要都畫)
            let lastEvent = null;
            while (highlightPointer < highlightEvents.length && highlightEvents[highlightPointer].time <= nowT) {
                lastEvent = highlightEvents[highlightPointer];
                highlightPointer++;
            }
            if (lastEvent) {
                highlightInput(lastEvent.start, lastEvent.end);
                lastPlayedNoteEnd = lastEvent.end;
            }

            if (highlightPointer < highlightEvents.length) {
                highlightRafId = requestAnimationFrame(tick);
            } else {
                highlightRafId = null;
            }
        }
        highlightRafId = requestAnimationFrame(tick);
    }

    function stopHighlightLoop() {
        if (highlightRafId) {
            cancelAnimationFrame(highlightRafId);
            highlightRafId = null;
        }
        highlightEvents = [];
        highlightPointer = 0;
    }

    function highlightInput(start, end) {
        if (document.activeElement !== codeInput) {
            codeInput.focus();
        }
        
        codeInput.setSelectionRange(start, end, 'forward');
        
        const fullText = codeInput.value;
        const subText = fullText.substring(0, start);
        const lines = subText.split('\n').length;
    }

    // 停止播放
    // 停止播放
    function stopMusic() {
        isPlaying = false;
        
        // [修正] 改用統一的 UI 管理函數，傳入 'stop' (或任意非 loading/play 的字串)
        updatePlayButtonUI('stop'); 

        if (activeSoundfontInst) {
            activeSoundfontInst.stop();
        }

        if (activeOscillators) {
            activeOscillators.forEach(o => o.stop());
            activeOscillators = [];
        }

        if (activeTimers) {
            activeTimers.forEach(t => clearTimeout(t));
            activeTimers = [];
        }

        stopHighlightLoop(); // [新增] 停止播放時，同步取消 rAF 高亮輪詢迴圈

        if (playbackTimer) {
            clearTimeout(playbackTimer);
            playbackTimer = null;
        }

        // [關鍵修正] 游標/選取行為
        if (savedSelection) {
            codeInput.setSelectionRange(savedSelection.start, savedSelection.end);
            codeInput.focus();
            savedSelection = null; 
        } 
        else if (lastPlayedNoteEnd !== -1) {
            let targetPos = lastPlayedNoteEnd;
            
            const val = codeInput.value;
            while (targetPos < val.length && val[targetPos] === ' ') {
                targetPos++;
            }

            codeInput.setSelectionRange(targetPos, targetPos);
            codeInput.focus();
            lastPlayedNoteEnd = -1; 
        }
    }

    function updatePlayButtonUI(state) {
        if (!playToggleBtn) return;
        const iconPlay = playToggleBtn.querySelector('.icon-play');
        const iconStop = playToggleBtn.querySelector('.icon-stop');
        const iconLoading = playToggleBtn.querySelector('.icon-loading');
        
        if(iconPlay) iconPlay.style.display = 'none';
        if(iconStop) iconStop.style.display = 'none';
        if(iconLoading) iconLoading.style.display = 'none';

        if (state === 'loading') {
            playToggleBtn.classList.add('playing');
            if(iconLoading) iconLoading.style.display = 'block';
        } else if (state === 'play') {
            playToggleBtn.classList.add('playing');
            if(iconStop) iconStop.style.display = 'block';
        } else {
            playToggleBtn.classList.remove('playing');
            if(iconPlay) iconPlay.style.display = 'block';
        }
    }

    function updateTransposeUI() {
        if(transposeValueEl) transposeValueEl.textContent = (currentTranspose > 0 ? '+' : '') + currentTranspose;
        if(keyNameEl) {
            let idx = (currentBaseKey + currentTranspose) % 12;
            if(idx < 0) idx += 12;
            keyNameEl.textContent = keyNames[idx];
        }
    }

    function transposeText(direction) {
        recordHistory(true); // [新增] 轉調前先存目前狀態，避免與待存的打字合併
        let raw = codeInput.value;
        const protectedMap = [];
        
        // ========================================================
        // 1. 保護不可移調的區塊 (如 [r1:...], [A] 等標籤)
        // ========================================================
        const protectionRegex = /((?:\[(?:r|rhythm)\s*\d+\s*[:：][^\]]+\])|(?:\[[^\]]+\]))/gi;
        
        let protectedText = raw.replace(protectionRegex, (match) => {
            protectedMap.push(match);
            return `___P${protectedMap.length - 1}___`; 
        });

        // ========================================================
        // 2. 展開緊湊的同時演奏括號，並分配外部修飾符
        // ========================================================
        protectedText = protectedText.replace(/\(\(/g, '___TIE___');

        // [關鍵修正] 捕捉右括號後方緊接著的時值修飾符 (如 /、*、-)
        protectedText = protectedText.replace(/\(([^)\r\n]+)\)([\/\\*-]*)/g, (match, content, groupSuffix) => {
            let tokens = [];
            let parts = content.trim().split(/\s+/);
            
            parts.forEach(part => {
                // 如果是獨立的時值、升降號、英文字母，或是三連音符號，直接保留，不附加 groupSuffix
                if (/^[\/\\*-]+$/.test(part) || /^[b#z]$/.test(part) || /^[a-zA-Z]$/.test(part) || part.includes('<') || part.includes('>')) {
                    tokens.push(part);
                } else {
                    let segments = part.split("'");
                    segments.forEach(seg => {
                        if (seg) {
                            // 捕捉音高與其自帶的修飾符
                            let found = seg.match(/[b#z]*[.:]*[0-7][.:]*[\/\\*-]*/g);
                            if (found) {
                                found.forEach(n => {
                                    // 將括號外的時值修飾符 (groupSuffix) 分配給每一個音符
                                    tokens.push(n + groupSuffix);
                                });
                            }
                        }
                    });
                }
            });
            // 強制加上空格，讓每個音符獨立
            return '( ' + tokens.join(' ') + ' )';
        });

        // 還原連結線
        protectedText = protectedText.replace(/___TIE___/g, '((');

        // ========================================================
        // 3. 執行移調邏輯
        // ========================================================
        const parts = protectedText.split(/(\s+)/);
        let newParts = [];
        let pendingAcc = 0; 

        for(let i=0; i<parts.length; i++) {
            let token = parts[i];
            let clean = token.trim();
            
            if(!clean) { newParts.push(token); continue; }

            if (clean.startsWith('___P') && clean.endsWith('___')) {
                newParts.push(token);
                continue;
            }

            // [和弦處理]
            const chordMatch = clean.match(/^([.:]|(?:r|rhythm)\d+)(.+)/i);

            if (chordMatch) {
                let prefix = chordMatch[1];
                let content = chordMatch[2]; 
                
                let slashMatch = content.match(/[\/\\]+$/);
                let slashes = slashMatch ? slashMatch[0] : "";
                let coreContent = slashMatch ? content.substring(0, slashMatch.index) : content;

                let rhythmMatch = coreContent.match(/^(\d+)/);
                let rhythmDigits = rhythmMatch ? rhythmMatch[1] : "";
                let chordSymbol = rhythmMatch ? coreContent.substring(rhythmMatch[0].length) : coreContent;

                let rootStr = "";
                let rootVal = -1;
                
                if (chordSymbol.length > 0) {
                    const sortedRoots = Object.keys(CHORD_ROOTS).sort((a, b) => b.length - a.length);
                    for (let r of sortedRoots) {
                        if (chordSymbol.startsWith(r)) {
                            rootStr = r;
                            rootVal = CHORD_ROOTS[r];
                            break;
                        }
                    }
                }

                if (rootVal !== -1) {
                    let quality = chordSymbol.substring(rootStr.length);
                    let newVal = (rootVal + direction) % 12;
                    if (newVal < 0) newVal += 12;
                    let newRootStr = CHORD_ROOT_NAMES[newVal];
                    
                    newParts.push(prefix + rhythmDigits + newRootStr + quality + slashes);
                    continue; 
                } 
            }

            // [單音處理] 排除標籤、小節線、各種括號、三連音、純延音/時值符號
            if ((token.match(/^[a-zA-Z]/) && clean !== 'b' && clean !== 'z') || 
                token.includes('|') || 
                clean === '(' || 
                clean === ')' || 
                clean === '((' ||
                clean === '<' || 
                clean === '>' || 
                /^[-]+$/.test(clean) || 
                clean === '*' || 
                clean === '/' || 
                clean === '\\') {
                newParts.push(token);
                continue;
            }

            // 獨立升降記號處理 (如: # 1)
            if (clean === 'b') { pendingAcc = -1; if (i + 1 < parts.length && /^\s+$/.test(parts[i+1])) { i++; } continue; }
            if (clean === '#') { pendingAcc = 1; if (i + 1 < parts.length && /^\s+$/.test(parts[i+1])) { i++; } continue; }
            if (clean === 'z') { pendingAcc = 0; if (i + 1 < parts.length && /^\s+$/.test(parts[i+1])) { i++; } continue; }

            const numMatch = clean.match(/[0-7]/);
            if(numMatch) {
                const digit = parseInt(numMatch[0]);
                if(digit === 0) { 
                    newParts.push(token); 
                    pendingAcc = 0;
                    continue;
                }

                let prefix = clean.substring(0, numMatch.index);
                let suffix = clean.substring(numMatch.index + 1);
                
                let octave = 0;
                const count = (str, char) => str.split(char).length - 1;
                octave += count(prefix, '.') * 1;
                octave += count(prefix, ':') * 2;
                octave -= count(suffix, '.') * 1;
                octave -= count(suffix, ':') * 2;

                let acc = pendingAcc;
                if(prefix.includes('b')) acc = -1;
                if(prefix.includes('#')) acc = 1;
                
                const noteToSemi = [null, 0, 2, 4, 5, 7, 9, 11];
                let semi = noteToSemi[digit];
                
                semi += acc;
                semi += direction; 
                
                let newOctave = octave + Math.floor(semi / 12);
                let newSemi = (semi % 12 + 12) % 12;
                
                const semiToNote = [
                    {n:1, a:0}, {n:1, a:1}, {n:2, a:0}, {n:3, a:-1}, {n:3, a:0},
                    {n:4, a:0}, {n:4, a:1}, {n:5, a:0}, {n:6, a:-1}, {n:6, a:0},
                    {n:7, a:-1}, {n:7, a:0}
                ];
                
                let mapped = semiToNote[newSemi];
                let newDigit = mapped.n;
                let newAcc = mapped.a; 

                let resParts = [];
                // 產生新的升降記號時，後方強制補上空格
                if(newAcc === 1) resParts.push("# ");
                if(newAcc === -1) resParts.push("b ");

                let newPrefix = "";
                if(newOctave > 0) {
                    let d2 = Math.floor(newOctave / 2);
                    let d1 = newOctave % 2;
                    newPrefix += ":".repeat(d2) + ".".repeat(d1);
                }
                
                let newSuffix = "";
                let durationChars = token.match(/[\/\\*-]+/); 
                let durationStr = durationChars ? durationChars[0] : "";
                
                if(newOctave < 0) {
                    let abs = Math.abs(newOctave);
                    let d2 = Math.floor(abs / 2);
                    let d1 = abs % 2;
                    newSuffix += ":".repeat(d2) + ".".repeat(d1);
                }
                newSuffix += durationStr;

                newParts.push(resParts.join("") + newPrefix + newDigit + newSuffix);
                pendingAcc = 0;
            } else {
                newParts.push(token);
            }
        }
        
        let result = newParts.join("");

        // ========================================================
        // 4. 還原保護區塊
        // ========================================================
        result = result.replace(/___P(\d+)___/g, (match, index) => {
            return protectedMap[parseInt(index)]; 
        });
        
        codeInput.value = result;
        
        // 更新狀態
        currentBaseKey = (currentBaseKey + direction + 12) % 12;
        baseKeySelect.value = currentBaseKey;
        codeInput.dispatchEvent(new Event('input'));
        updateCurrentSongSettings();
        updateTransposeUI();
        updateStatusDisplay();
        recordHistory(true); // [新增] 轉調後立即存快照 (文字 + 新原調)，連按兩次也各算一步
    }

    // 代碼轉字型
    function convertCodeToFont(input) {
        if (!input) return "";
        let result = input;

        // 1. 和弦預處理
        result = result.replace(/\(([0-7.:'\s]+)\)([\/\\*-]*)/g, (match, content, suffix) => {
            let inner = content.trim();
            let tokens = [];

            if (inner.includes(' ')) {
                tokens = inner.split(/\s+/);
            } else {
                let segments = inner.split("'");
                segments.forEach(seg => {
                    if (!seg) return;
                    let found = seg.match(/[.:]*[0-7][.:]*/g);
                    if (found) tokens.push(...found);
                });
            }

            let expanded = "";
            tokens.forEach(t => {
                if(t) expanded += t + suffix + " ";
            });
            
            return `(${expanded})`; 
        });

        // 2. 處理特殊符號
        const hwLookahead = "(?=[0-7.:<]*\\\\[0-7.:\\\\<]*)";
        result = result.replace(new RegExp("b " + hwLookahead, "g"), "");
        result = result.replace(new RegExp("# " + hwLookahead, "g"), "");
        
        // 3. 通用規則取代
        for (const rule of codeToFontRules) {
            result = result.replace(rule.regex, rule.replacement);
        }
        
        // [還原] 不執行 HTML escape，保留 < > 原始字元
        return result;
    }
    // 字型轉代碼
    function convertFontToCode(input) {
        if (!input) return "";
        let result = input;
        
        result = result.replace(//g, "b ");
        result = result.replace(//g, "# ");

        // 1. 通用規則還原
        for (const rule of fontToCodeRules) {
            result = result.replace(rule.regex, rule.replacement);
        }

        // 2. 後處理：智慧壓縮
        result = result.replace(/\(([^)]+)\)/g, (match, content) => {
            const tokens = content.trim().split(/\s+/);
            if (tokens.length < 2) return match; 

            const firstMatch = tokens[0].match(/^([0-7.:]+)(.*)$/); // 允許 . :
            if (!firstMatch) return match;
            
            const commonSuffix = firstMatch[2]; 
            let notesList = [firstMatch[1]];
            let hasComplexNote = /[.:]/.test(firstMatch[1]); // 檢查是否有特殊符號

            for (let i = 1; i < tokens.length; i++) {
                const m = tokens[i].match(/^([0-7.:]+)(.*)$/);
                if (!m || m[2] !== commonSuffix) {
                    return match; // 後綴不一致，不壓縮
                }
                notesList.push(m[1]);
                if (/[.:]/.test(m[1])) hasComplexNote = true;
            }

            // 決定連接符號
            // 如果音符中有 . 或 :，強制使用 ' 分隔，避免歧義
            // 否則直接連在一起
            let joinedNotes = "";
            if (hasComplexNote) {
                joinedNotes = notesList.join("'");
            } else {
                joinedNotes = notesList.join("");
            }

            return `(${joinedNotes})${commonSuffix}`;
        });

        return result;
    }

    function renderInstrumentList() {
        const list = document.getElementById('instrument-list');
        if(!list) return;
        list.innerHTML = '';
        instruments.forEach(inst => {
            const div = document.createElement('div');
            const isSelected = currentInstrument === inst.val;
            div.className = `inst-option ${isSelected ? 'selected' : ''}`;
            div.innerHTML = `
                <span class="inst-check" style="${isSelected ? 'opacity:1' : 'opacity:0'}">✓</span>
                <span class="inst-name">${inst.name}</span> 
            `;
            
            div.onclick = () => {
                currentInstrument = inst.val;
                document.getElementById('current-inst-icon').textContent = inst.icon;
                updateCurrentSongSettings();
                renderInstrumentList();
            };
            list.appendChild(div);
        });
    }

    function renderEditor() {
        const song = getCurrentSong();
        if (!song) return;
        
        titleInput.value = song.title;
        codeInput.value = song.content;
        
        currentTempo = clampTempo(song.tempo);
        currentInstrument = song.instrument || 'acoustic_grand_piano';
        currentBaseKey = song.baseKey || 0;
        currentTranspose = song.transpose || 0;
        
        tempoInput.value = currentTempo;
        baseKeySelect.value = currentBaseKey;
        updateTransposeUI();
        
        const instObj = getInstrumentDef(currentInstrument);
        document.getElementById('current-inst-icon').textContent = instObj.icon;

        fontOutput.value = convertCodeToFont(song.content);
		updateStatusDisplay();
		initHistory();
	}

    function renderSidebar() {
        songListEl.innerHTML = '';
        appData.songs.forEach(song => {
            const div = document.createElement('div');
            div.className = `song-item ${song.id === appData.currentId ? 'active' : ''}`;

            const titleSpan = document.createElement('span');
            titleSpan.style.cssText = 'overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;';
            titleSpan.textContent = song.title.trim() || "未命名樂譜"; // 用 textContent 安全插入，避免匯入的樂譜標題含有惡意 HTML/腳本

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-song-btn';
            delBtn.title = '刪除';
            delBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

            div.appendChild(titleSpan);
            div.appendChild(delBtn);
            div.onclick = () => switchSong(song.id);
            delBtn.onclick = (e) => deleteSong(song.id, e);
            songListEl.appendChild(div);
        });
    }

    function renderAll() {
        renderSidebar();
        renderEditor();
        if(typeof renderLibrary === 'function') renderLibrary();
    }

    function switchSong(id) {
        appData.currentId = id;
        saveData();
        renderAll();
        if (window.innerWidth <= 768) toggleSidebar(false);
    }

    function togglePanel(panelId) {
        const panel = document.getElementById(panelId);
        const otherPanelId = panelId === 'panel-input' ? 'panel-output' : 'panel-input';
        const otherPanel = document.getElementById(otherPanelId);
        if (otherPanel.classList.contains('collapsed')) {
            otherPanel.classList.remove('collapsed');
            panel.classList.add('collapsed');
        } else {
            panel.classList.toggle('collapsed');
        }
    }

    function toggleSidebar(forceState) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            const isOpen = typeof forceState === 'boolean' ? forceState : !sidebar.classList.contains('open');
            sidebar.classList.toggle('open', isOpen);
            overlay.classList.toggle('show', isOpen);
        } else {
            const isCollapsed = typeof forceState === 'boolean' ? !forceState : !sidebar.classList.contains('collapsed');
            sidebar.classList.toggle('collapsed', isCollapsed);
        }
    }


	// ==========================================
    // 範圍取代功能模組
    // ==========================================
    const toggleReplaceBtn = document.getElementById('toggle-replace-btn');
    const replaceBar = document.getElementById('replace-bar');
    const doReplaceBtn = document.getElementById('do-replace-btn');
    const findInput = document.getElementById('find-text');
    const replaceInput = document.getElementById('replace-text');

    if (toggleReplaceBtn && replaceBar) {
        // 1. 切換顯示與啟動狀態
        toggleReplaceBtn.addEventListener('click', () => {
            const isHidden = replaceBar.style.display === 'none';
            
            // 切換顯示
            replaceBar.style.display = isHidden ? 'flex' : 'none';
            
            // 切換按鈕樣式 (Active 狀態)
            toggleReplaceBtn.classList.toggle('active', isHidden);

            if (isHidden) {
                // 開啟時：嘗試自動填入選取文字
                const selText = codeInput.value.substring(codeInput.selectionStart, codeInput.selectionEnd);
                if (selText && selText.length < 10 && !selText.includes('\n')) {
                    findInput.value = selText;
                }
                findInput.focus();
            } else {
                // 關閉時：焦點回到編輯區
                codeInput.focus();
            }
        });

        // 2. 執行取代
        doReplaceBtn.addEventListener('click', () => {
            replaceSelectedText();
        });

        // 支援 Enter 鍵 (在取代框按 Enter 直接執行)
        replaceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') replaceSelectedText();
        });
        
        // 支援 Enter 鍵 (在尋找框按 Enter 跳至取代框)
        findInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') replaceInput.focus();
        });
    // 4. [新增] 綁定快速取代按鈕
        document.querySelectorAll('.quick-replace-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                performQuickReplace(action);
            });
        });
    }


    // 執行快速取代邏輯
    function performQuickReplace(action) {
        const start = codeInput.selectionStart;
        const end = codeInput.selectionEnd;

        if (start === end) {
            showToast("⚠️ 請先「選取」要修改的範圍！", 'warning');
            codeInput.focus();
            return;
        }

        const originalFullText = codeInput.value;
        const selectedText = originalFullText.substring(start, end);
        let newSelectedText = selectedText;

        // 根據動作執行轉換
        switch (action) {
            case 'slash': // \ -> /
                newSelectedText = selectedText.split('\\').join('/');
                break;
            case 'backslash': // / -> \
                newSelectedText = selectedText.split('/').join('\\');
                break;
            case 'reduce': // \\ -> \  且  // -> /
                // 先處理反斜線，再處理斜線
                newSelectedText = selectedText.split('\\\\').join('\\').split('//').join('/');
                break;
                
            case 'double': // \ -> \\  且  / -> // (但不影響原本就是雙線的)
                // 使用 Regex: (?<!\) 表示前面沒有斜線，(?!/) 表示後面沒有斜線
                // 這樣只會抓出「落單」的斜線進行加倍
                
                // 1. 處理反斜線 \ -> \\
                // (?<!\\) 確保前面不是 \，(?!\\) 確保後面不是 \
                newSelectedText = newSelectedText.replace(/(?<!\\)\\(?!\\)/g, '\\\\');
                
                // 2. 處理斜線 / -> //
                // (?<!\/) 確保前面不是 /，(?!\/) 確保後面不是 /
                newSelectedText = newSelectedText.replace(/(?<!\/)\/(?!\/)/g, '//');
                break;
                
            case 'dot': // : -> .
                newSelectedText = selectedText.split(':').join('.');
                break;
            case 'colon': // . -> :
                newSelectedText = selectedText.split('.').join(':');
                break;
        }

        // 如果內容沒有變動，就不執行後續更新
        if (newSelectedText === selectedText) {
            codeInput.focus();
            return;
        }

        // 更新內容
        const newFullText = originalFullText.substring(0, start) + newSelectedText + originalFullText.substring(end);
        codeInput.value = newFullText;
        codeInput.dispatchEvent(new Event('input'));

        // 保持選取狀態
        const newEnd = start + newSelectedText.length;
        codeInput.setSelectionRange(start, newEnd);
        codeInput.focus();
        
        // 更新顯示狀態
        if (typeof updateSelectionDisplay === 'function') updateSelectionDisplay();
        if (typeof updateHighlight === 'function') updateHighlight();
    }

    function replaceSelectedText() {
        const start = codeInput.selectionStart;
        const end = codeInput.selectionEnd;

        // 檢查是否有選取範圍
        if (start === end) {
            showToast("⚠️ 請先在編輯區「選取」要進行取代的範圍！\n(此功能僅針對選取範圍有效，以防止誤改)", 'warning');
            codeInput.focus();
            return;
        }

        const findStr = findInput.value;
        const replaceStr = replaceInput.value;

        if (!findStr) {
            showToast("請輸入要尋找的內容", 'warning');
            findInput.focus();
            return;
        }

        const originalFullText = codeInput.value;
        const selectedText = originalFullText.substring(start, end);

        // 檢查選取範圍內是否有目標
        if (!selectedText.includes(findStr)) {
            showToast(`在選取範圍內找不到 "${findStr}"`, 'warning');
            return;
        }

        // 執行取代 (replaceAll 為現代瀏覽器標準，若需相容極舊版可用 split+join)
        const newSelectedText = selectedText.split(findStr).join(replaceStr);

        // 組合新文本
        const newFullText = originalFullText.substring(0, start) + newSelectedText + originalFullText.substring(end);

        // 更新內容
        codeInput.value = newFullText;

        // 觸發 input 事件以更新樂譜與存檔
        codeInput.dispatchEvent(new Event('input'));

        // 更新選取範圍 (選取剛取代完的區域，方便使用者確認或連續操作)
        const newEnd = start + newSelectedText.length;
        codeInput.setSelectionRange(start, newEnd);
        codeInput.focus();
    }

    function handleKeyInput(inputElement, char) {
        inputElement.focus();
        const start = inputElement.selectionStart;
        const end = inputElement.selectionEnd;
        const val = inputElement.value;
        let newVal = val;
        let newCursorPos = start;

        if (char === 'backspace') {
            if (start !== end) {
                newVal = val.slice(0, start) + val.slice(end);
                newCursorPos = start;
            } else if (start > 0) {
                newVal = val.slice(0, start - 1) + val.slice(end);
                newCursorPos = start - 1;
            }
        } else if (char === 'delete') {
            if (start !== end) {
                newVal = val.slice(0, start) + val.slice(end);
                newCursorPos = start;
            } else if (start < val.length) {
                newVal = val.slice(0, start) + val.slice(end + 1);
                newCursorPos = start;
            }
        } else {
            newVal = val.slice(0, start) + char + val.slice(end);
            newCursorPos = start + char.length;
        }

        inputElement.value = newVal;
        inputElement.dispatchEvent(new Event('input'));
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
		recordHistory(true);
    }

    // ==========================================
    // 6. UI Events & Init
    // ==========================================
    
    // Inputs
    codeInput.addEventListener('input', (e) => {
        const song = getCurrentSong();
        if (song) {
            song.content = e.target.value;
            debouncedSaveData(); // 防抖：停頓後才寫入 localStorage，避免每個字都存檔造成卡頓
            fontOutput.value = convertCodeToFont(song.content);
        }
		updateStatusDisplay();
		recordHistory(false);
    });

    fontOutput.addEventListener('input', (e) => {
        const song = getCurrentSong();
        if (song) {
            const convertedCode = convertFontToCode(e.target.value);
            song.content = convertedCode;
            debouncedSaveData();
            codeInput.value = convertedCode;
        }
    });

    titleInput.addEventListener('input', (e) => {
        const song = getCurrentSong();
        if (song) {
            song.title = e.target.value;
            debouncedSaveData();
            debouncedRenderSidebar(); // 防抖：停頓後才重繪側邊欄清單，避免每個字都整份重繪
        }
    });

    // Buttons
	document.getElementById('export-btn').addEventListener('click', () => {
        // 使用 bufferToWave 的 offset 參數修正：
        // 上面的 bufferToWave 呼叫時用了錯誤的參數傳遞 (len => {})
        // 修正後的 exportAudio 呼叫方式應為 bufferToWave(renderedBuffer, 0)
        exportAudio();
    });

    document.getElementById('export-backup-btn').addEventListener('click', () => {
        exportBackup();
    });

    document.getElementById('import-backup-btn').addEventListener('click', () => {
        document.getElementById('import-backup-input').click();
    });

    document.getElementById('import-backup-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        importBackup(file);
        e.target.value = ''; // 重置，允許重複選同一個檔案
    });

    // 範例曲庫搜尋框：用防抖避免每個字都重繪清單
    const debouncedLibraryRender = debounce(() => renderLibrary(), 200);
    const librarySearchInput = document.getElementById('library-search-input');
    if (librarySearchInput) {
        librarySearchInput.addEventListener('input', (e) => {
            libraryFilterText = e.target.value;
            debouncedLibraryRender();
        });
    }

    document.getElementById('new-song-btn').addEventListener('click', () => {
        createNewSong();
        if (window.innerWidth <= 768) toggleSidebar(false);
        setTimeout(() => titleInput.focus(), 100);
    });


    document.getElementById('clear-output-btn').addEventListener('click', () => {
        if (!fontOutput.value) return;
        showConfirm("清除內容", "確定清空？", () => {
            const song = getCurrentSong();
            song.content = ''; codeInput.value = ''; fontOutput.value = ''; saveData();
        });
    });

    document.getElementById('copy-input-btn').addEventListener('click', () => {
        codeInput.select(); navigator.clipboard.writeText(codeInput.value);
    });
    
    document.getElementById('copy-output-btn').addEventListener('click', () => {
        fontOutput.select(); navigator.clipboard.writeText(fontOutput.value);
    });

    if (playToggleBtn) {
        playToggleBtn.addEventListener('click', () => {
            if (isPlaying) stopMusic();
            else playMusic();
        });
    }

    if (settingsBtn && settingsPopover) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPopover.classList.toggle('show');
            if (window.innerWidth <= 768) {
                const actionPanel = settingsBtn.closest('.panel-actions');
                if(actionPanel) {
                    if (settingsPopover.classList.contains('show')) actionPanel.style.overflowX = 'visible';
                    else actionPanel.style.overflowX = 'auto';
                }
            }
            renderInstrumentList();
            updateTransposeUI();
        });
        document.addEventListener('click', (e) => {
            if (!settingsPopover.contains(e.target) && !settingsBtn.contains(e.target)) {
                settingsPopover.classList.remove('show');
                if (window.innerWidth <= 768) {
                    const actionPanel = settingsBtn.closest('.panel-actions');
                    if(actionPanel) actionPanel.style.overflowX = 'auto';
                }
            }
        });
    }

    // Tabs Logic
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const targetId = tab.dataset.tab;
                const targetContent = document.getElementById(targetId);
                if(targetContent) targetContent.classList.add('active');
            });
        });
    }

    document.querySelectorAll('.toggle-panel-btn').forEach(btn => {
        btn.addEventListener('click', () => togglePanel(btn.dataset.target));
    });

    document.getElementById('menu-btn').addEventListener('click', () => toggleSidebar());
    document.getElementById('overlay').addEventListener('click', () => toggleSidebar(false));
    
    if(toggleToolbarBtn) {
        toggleToolbarBtn.addEventListener('click', () => {
            quickToolbar.classList.toggle('hidden');
            if (quickToolbar.classList.contains('hidden')) {
                toggleToolbarBtn.classList.remove('active');
            } else {
                toggleToolbarBtn.classList.add('active');
            }
        });
    }

    if(modalCancelBtn) modalCancelBtn.addEventListener('click', closeConfirm);
    if(modalConfirmBtn) modalConfirmBtn.addEventListener('click', () => {
        if (currentConfirmCallback) currentConfirmCallback();
        closeConfirm();
    });



function updateStatusDisplay() {
        // 1. 樂譜調 (Base Key)
        const baseKeyName = keyNames[currentBaseKey];
        
        // 2. 播放調 (Play Key = Base + Transpose)
        let playKeyIdx = (currentBaseKey + currentTranspose) % 12;
        if (playKeyIdx < 0) playKeyIdx += 12;
        const playKeyName = keyNames[playKeyIdx];

        // 3. 拍速
        const tempo = currentTempo;

        // 4. 計算樂曲時間 (需解析樂譜)
        // 注意：這會頻繁呼叫，parseScore 效能尚可，但若樂譜極長可能需優化
        const notes = parseScore(codeInput.value);
        let maxBeats = 0;
        
        notes.forEach(n => {
            // 找出最後結束的拍數 (startTime + duration)
            // 注意 startTime 是「拍數」不是秒數
            if (n.play) {
                const endBeat = n.startTime + n.duration;
                if (endBeat > maxBeats) maxBeats = endBeat;
            }
        });

        // 加上 2 秒尾音緩衝 (或是直接顯示樂譜長度)
        // 這裡顯示「樂譜長度」，不含額外尾音緩衝
        const totalSeconds = maxBeats * (60 / tempo); 
        
        const mm = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const ss = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
        const timeStr = `${mm}:${ss}`;

        // 更新 DOM
        const elBase = document.getElementById('stat-base');
        const elPlay = document.getElementById('stat-play');
        const elTempo = document.getElementById('stat-tempo');
        const elTime = document.getElementById('stat-time');

        if(elBase) elBase.textContent = baseKeyName;
        if(elPlay) elPlay.textContent = playKeyName;
        if(elTempo) elTempo.textContent = tempo;
        if(elTime) elTime.textContent = timeStr;
    }






    // Settings Controls
    document.getElementById('tempo-minus').addEventListener('click', () => {
        currentTempo = clampTempo(parseInt(tempoInput.value) - 1);
        tempoInput.value = currentTempo;
        updateCurrentSongSettings();
		updateStatusDisplay();
    });
    document.getElementById('tempo-plus').addEventListener('click', () => {
        currentTempo = clampTempo(parseInt(tempoInput.value) + 1);
        tempoInput.value = currentTempo;
        updateCurrentSongSettings();
		updateStatusDisplay();
    });

	tempoInput.addEventListener('change', () => {
        currentTempo = clampTempo(tempoInput.value);
        tempoInput.value = currentTempo;
        updateCurrentSongSettings();
        updateStatusDisplay(); // [新增] 同步更新狀態列
    });

    baseKeySelect.addEventListener('change', () => {
        currentBaseKey = parseInt(baseKeySelect.value);
        updateTransposeUI();
        updateCurrentSongSettings();
		updateStatusDisplay();
        recordHistory(true); // [新增]
    });

    document.getElementById('transpose-minus').addEventListener('click', () => {
        currentTranspose = Math.max(-12, currentTranspose - 1);
        updateTransposeUI();
        updateCurrentSongSettings();
		updateStatusDisplay();
        recordHistory(true); // [新增]
    });
    document.getElementById('transpose-plus').addEventListener('click', () => {
        currentTranspose = Math.min(12, currentTranspose + 1);
        updateTransposeUI();
        updateCurrentSongSettings();
		updateStatusDisplay();
        recordHistory(true); // [新增]
    });

    document.getElementById('score-transpose-down').addEventListener('click', () => transposeText(-1));
    document.getElementById('score-transpose-up').addEventListener('click', () => transposeText(1));

	// --- Sidebar Tabs Logic (側邊欄頁籤切換) ---
    const sideTabs = document.querySelectorAll('.side-tab-btn');
    const sideViews = document.querySelectorAll('.side-list-view');

    sideTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有 active 狀態
            sideTabs.forEach(t => t.classList.remove('active'));
            sideViews.forEach(v => v.classList.remove('active'));

            // 啟用當前點擊的頁籤
            tab.classList.add('active');
            const targetId = tab.dataset.target;
            const targetView = document.getElementById(targetId);
            if (targetView) targetView.classList.add('active');
        });
    });



	// ==========================================
    // [新增] 節奏字典邏輯 (Rhythm Dictionary)
    // ==========================================
    const rhythmModal = document.getElementById('rhythm-modal');
    const openDictBtn = document.getElementById('open-rhythm-dict-btn');
    const closeDictBtn = document.getElementById('close-rhythm-modal');
    const dictTableBody = document.getElementById('rhythm-table-body');
    const dictChordSelect = document.getElementById('dict-chord-root');
    const dictFilterTabs = document.querySelectorAll('.filter-tab');
    
    let currentDictType = 'block'; // 'block' or 'arp'

    if (openDictBtn && rhythmModal) {
        openDictBtn.addEventListener('click', () => {
            rhythmModal.classList.add('show');
            renderRhythmDictionary();
        });
        
        closeDictBtn.addEventListener('click', () => {
            rhythmModal.classList.remove('show');
            stopMusic(); // 關閉視窗時停止試聽
        });

        // 點擊遮罩層也可關閉
        rhythmModal.addEventListener('click', (e) => {
            if (e.target === rhythmModal) {
                rhythmModal.classList.remove('show');
                stopMusic();
            }
        });

        dictChordSelect.addEventListener('change', () => {
            // 切換和弦時不需重繪表格，試聽時會自動抓新值
        });

        dictFilterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                dictFilterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentDictType = tab.dataset.type;
                renderRhythmDictionary();
            });
        });
    }

    function renderRhythmDictionary() {
        if (!dictTableBody) return;
        dictTableBody.innerHTML = '';

        // 根據 rhythm.js 載入的資料決定顯示哪種
        const lib = currentDictType === 'block' ? RHYTHM_BLOCK : RHYTHM_ARP;
        const prefix = currentDictType === 'block' ? '.' : ':';

        Object.keys(lib).forEach(id => {
            const item = lib[id];
            const tr = document.createElement('tr');
            
            // 生成可讀的音符檢視字串
            const noteView = generateRhythmView(item.steps);
            
            tr.innerHTML = `
                <td><code>${prefix}${id}</code></td>
                <td>${item.name}</td>
                <td><div class="note-view">${noteView}</div></td>
                <td>
                    <button class="play-sample-btn" data-id="${id}" title="試聽">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </button>
                </td>
            `;

            // 綁定試聽按鈕
            const btn = tr.querySelector('.play-sample-btn');
            btn.addEventListener('click', () => playRhythmSample(id, currentDictType));

            dictTableBody.appendChild(tr);
        });
    }

    // --- 將節奏數據轉為可讀的音符字串 ---
    function generateRhythmView(steps) {
        // 代碼對照表
        const map = {
            '-1': '1.', '-2': '5.', '-3': '7.', '-4': '3.',
            '0': '1', '1': '3', '2': '5', '3': '7', '9': '2'
        };

        let resultParts = [];
        let groupCache = []; // 用來存已經出現過的群組，以便用 $1, $2 簡化
        let lastTime = 0;    // [新增] 追蹤時間軸，用來抓出休止符

        // 必須先對 steps 依照時間排序 (雖然通常已經排好，但保險起見)
        const sortedSteps = [...steps].sort((a, b) => a.t - b.t);

        sortedSteps.forEach(step => {
            // 1. [新增] 自動偵測並填補休止符
            // 如果當前音符的開始時間 (step.t) 大於 上一個音符的結束時間 (lastTime)
            const gap = step.t - lastTime;
            if (gap > 0.01) { // 容許微小浮點數誤差
                resultParts.push(formatDurationSymbol('0', gap));
            }

            // 2. 轉換音符 (代碼轉簡譜)
            let noteStr = "";
            if (Array.isArray(step.notes)) {
                if (step.notes.length === 1) {
                    noteStr = map[step.notes[0]] || '?';
                } else {
                    const mapped = step.notes.map(n => map[n] || '?').join('');
                    noteStr = `(${mapped})`;
                }
            }

            // 3. 檢查重複群組 ($1 logic)
            if (noteStr.startsWith('(')) {
                const existingIdx = groupCache.indexOf(noteStr);
                if (existingIdx !== -1) {
                    noteStr = `$${existingIdx + 1}`;
                } else {
                    groupCache.push(noteStr);
                }
            }

            // 4. 處理音符時值 (將 noteStr 加上 - 或 / 或 . 等符號)
            resultParts.push(formatDurationSymbol(noteStr, step.len));

            // 更新時間指針
            lastTime = step.t + step.len;
        });

        return resultParts.join(' ');
    }

    // 將 "符號" + "長度" 轉為視覺化簡譜
    function formatDurationSymbol(symbol, len) {
        // 處理微小誤差
        len = Math.round(len * 100) / 100;

        if (len === 4) return `${symbol} - - -`;
        if (len === 3) return `${symbol} - -`;
        if (len === 2.5) return `${symbol} - /`; // 2.5拍 = 2拍 + 半拍
        if (len === 2) return `${symbol} -`;
        if (len === 1.5) return `${symbol} *`;   // [修正] 附點四分音符 (加空格)
        if (len === 1) return `${symbol}`;
        
        if (len === 0.75) return `${symbol}/ *`; // [修正] 附點八分音符 (加空格，如 0/ .)
        
        if (len === 0.5) return `${symbol}/`;
        if (len === 0.25) return `${symbol}//`;
        
        return `${symbol}?`; // 例外狀況
    }
    // --- 試聽功能 ---
    function playRhythmSample(id, type) {
        const root = dictChordSelect.value || 'C';
        const prefix = type === 'block' ? '.' : ':';
        const testCode = `${prefix}${id}${root}`; // 例如 .1C 或 :6G
        
        // 1. 建立樂譜字串 (保持乾淨，不加 - - -)
        const mockScore = `[Audition]{ ${testCode} }`; 
        
        // 2. 解析
        // 傳入 true 忽略流程控制，確保單純解析
        const notes = parseScore(mockScore, true);
        
        // [關鍵修正] 手動將所有可播放音符的長度設為 4 拍
        // 這能確保節奏樣式 (Pattern) 有足夠的時間完整播放
        notes.forEach(n => {
            if (n.play && (n.type === 'note' || n.type === 'chord')) {
                n.duration = 4;
                n.visualDuration = 4;
            }
        });
        
        // 3. 播放
        stopMusic(); 
        initAudio().then(() => {
            // 試聽速度固定為 100 BPM，方便確認節奏感
            const beatTime = 60 / 100; 
            const now = audioCtx.currentTime + 0.1;
            
            // 確保樂器載入 (試聽通常只用鋼琴，或依當前樂器)
            loadInstrument(currentInstrument).then(() => {
                notes.forEach(note => {
                    if (!note.play) return;
                    
                    if (note.type === 'chord' && note.chordFreqs) {
                        let pattern = null;
                        let patternLen = 4; // 預設節奏長度

                        if (note.rhythmType === 'custom' && note.customSteps) {
                            pattern = { steps: note.customSteps };
                        } else {
                            let patternLib = RHYTHM_BLOCK; 
                            if (note.rhythmType === 'arp') patternLib = RHYTHM_ARP; 
                            pattern = patternLib[note.rhythmId] || patternLib[1];
                        }

                        const getFreq = (code, root, noteObj) => {
                            let baseF = 0;
                            const freqs = noteObj.chordFreqs;
                            const isMinor = noteObj.chordInfo && noteObj.chordInfo.quality.includes('m') && !noteObj.chordInfo.quality.includes('maj');
                            
                            switch (code) {
                                case 0: baseF = freqs[0]; break;
                                case 1: baseF = freqs[1] || freqs[0] * 1.2599; break;
                                case 2: baseF = freqs[2] || freqs[0] * 1.4983; break;
                                case 3: if (freqs[3]) baseF = freqs[3]; else baseF = freqs[0] * (isMinor ? 1.7817 : 1.8877); break;
                                case 9: baseF = freqs[0] * 1.12246; break;
                                case -1: baseF = freqs[0] / 2; break;
                                case -2: baseF = (freqs[2] || freqs[0] * 1.4983) / 2; break;
                                case -3: if (freqs[3]) baseF = freqs[3] / 2; else baseF = (freqs[0] * (isMinor ? 1.7817 : 1.8877)) / 2; break;
                                case -4: baseF = (freqs[1] || freqs[0] * 1.2599) / 2; break;
                                case -20: baseF = (freqs[0] * 1.12246) / 2; break; 
                                case -21: baseF = (freqs[0] * 1.3348) / 2; break; 
                                case -22: baseF = (freqs[0] * 1.6818) / 2; break; 
                                case 12: baseF = freqs[0] * 2; break; 
                                case 14: baseF = (freqs[0] * 1.12246) * 2; break; 
                                case 15: baseF = (freqs[1] || freqs[0] * 1.2599) * 2; break; 
                                default: baseF = freqs[0]; 
                            }
                            return baseF;
                        };

                        // [修正] 這裡使用 note.duration (現在是 4)，可以完整執行迴圈
                        for (let loopStart = 0; loopStart < note.duration; loopStart += patternLen) {
                            pattern.steps.forEach(step => {
                                const stepAbsStart = loopStart + step.t;
                                if (stepAbsStart >= note.duration) return;

                                let playDuration = step.len;
                                if (stepAbsStart + playDuration > note.duration) {
                                    playDuration = note.duration - stepAbsStart;
                                }

                                const absTime = now + (note.startTime * beatTime) + (stepAbsStart * beatTime);
                                const absDur = playDuration * beatTime;

                                if (Array.isArray(step.notes)) {
                                    step.notes.forEach(code => {
                                        const f = getFreq(code, note.chordFreqs[0], note);
                                        if (f > 0) playTone(f, absTime, absDur, note.instrument);
                                    });
                                }
                            });
                        }
                    }
                });
            });
        });
    }

	// ==========================================
    // [新增] 手機版系統鍵盤切換邏輯
    // ==========================================
    const keyboardToggleBtn = document.getElementById('keyboard-toggle-btn');
    // 預設開啟系統鍵盤 (true)
    let isSystemKeyboardEnabled = true;

    // [新增] 判斷「浮動鍵盤 / 虛擬鋼琴鍵盤」是否正在顯示
    function isVirtualKeyboardOpen() {
        const fk = document.getElementById('floating-keyboard');
        const vk = document.getElementById('vk-container');
        const floatOpen = !!fk && !fk.classList.contains('hidden');
        const pianoOpen = !!vk && vk.classList.contains('vk-show');
        return floatOpen || pianoOpen;
    }

    // [新增] 統一決定編輯區的 inputmode (Android / iOS 皆支援 inputmode="none")
    // 規則：虛擬鍵盤開啟時一律 none (不彈出系統鍵盤)；否則依「系統鍵盤切換鈕」狀態
    function applyInputMode(allowRefocus = true) {
        const input = document.getElementById('code-input');
        if (!input) return;
        const mode = (isSystemKeyboardEnabled && !isVirtualKeyboardOpen()) ? 'text' : 'none';
        if (input.getAttribute('inputmode') === mode) return;
        input.setAttribute('inputmode', mode);

        // 行動裝置需 blur 再 focus 才會重新讀取 inputmode (並保留游標位置)
        if (allowRefocus && document.activeElement === input) {
            const s = input.selectionStart, e = input.selectionEnd;
            input.blur();
            setTimeout(() => {
                input.focus({ preventScroll: true });
                try { input.setSelectionRange(s, e); } catch (err) {}
            }, 50);
        }
    }

    if (keyboardToggleBtn) {
        keyboardToggleBtn.addEventListener('click', (e) => {
            // 防止點擊按鈕導致編輯區失焦
            e.preventDefault();

            isSystemKeyboardEnabled = !isSystemKeyboardEnabled;
            const input = document.getElementById('code-input');

            if (isSystemKeyboardEnabled) {
                // --- 開啟系統鍵盤 ---
                applyInputMode(false); // [修改] 改由統一函式決定 (下方原本的 blur/focus 會負責刷新)
                
                // 更新按鈕樣式 (實心鍵盤圖示)
                keyboardToggleBtn.classList.add('active'); // 可選：加上高亮樣式
                keyboardToggleBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
                    </svg>`;
            } else {
                // --- 關閉系統鍵盤 (只顯示游標) ---
                applyInputMode(false); // [修改] 改由統一函式決定
                
                // 更新按鈕樣式 (鍵盤打叉或空心圖示)
                keyboardToggleBtn.classList.remove('active');
                keyboardToggleBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                         <path d="M19 7h2v2h-2V7zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zM7 7h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zM3 7h2v2H3V7zm0 4h2v2H3v-2zm0 4h2v2H3v-2zm4 4h10v2H7v-2zm-5 4V5c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2zm2-16v14h16V5H4z"/>
                         <path d="M0 0h24v24H0z" fill="none"/>
                         <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" stroke-width="2" />
                    </svg>`;
            }

            // [關鍵] 強制刷新鍵盤狀態
            // 行動裝置通常需要 blur 再 focus 才會重新讀取 inputmode 設定
            if (document.activeElement === input) {
                input.blur();
                setTimeout(() => {
                    input.focus();
                }, 50); // 稍微延遲以確保瀏覽器反應
            } else {
                input.focus();
            }
        });
    }



// ==========================================
    // 鍵盤生成與邏輯 (Fixed & Floating)
    // ==========================================
    const fixedToolbar = document.getElementById('quick-toolbar');
    const floatingContainer = document.getElementById('floating-keys-container');
    const floatingKeyboard = document.getElementById('floating-keyboard');
    
    // 按鈕元素
    const toggleFixedBtn = document.getElementById('toggle-fixed-kb-btn'); // 舊的 toggle-toolbar-btn 改名或重綁
    const toggleFloatBtn = document.getElementById('toggle-float-kb-btn'); // 新按鈕
    const closeFloatBtn = document.getElementById('close-float-kb');

    // 1. 通用生成按鈕函數
	function renderKeysTo(container) {
		if (!container) return;
		container.innerHTML = '';
		
		const activeSet = keySets[currentKeyMode] || keySets['main'];
		
		// 如果是 QWERTY 模式，加入特定 class 以便 CSS 做特殊排版 (如需要)
		if (currentKeyMode === 'qwerty') {
			container.classList.add('layout-qwerty');
		} else {
			container.classList.remove('layout-qwerty');
		}
		
		activeSet.forEach(item => {
			const btn = document.createElement('button');
			btn.className = 'key-btn';
			
			// --- 處理顯示文字與大小寫 ---
			let displayText = item.display;
			let inputChar = item.char;

			if (item.type === 'letter' && isShiftEnabled) {
				displayText = displayText.toUpperCase();
				inputChar = inputChar.toUpperCase();
			}

			btn.innerHTML = displayText;
			
			// --- 樣式類別處理 ---
			if (item.type === 'num') btn.classList.add('num-key');
			if (item.type === 'func') btn.classList.add('func-key');
			if (item.type === 'chord-root') { btn.style.color = '#d93025'; }
			if (item.type === 'chord-quality') { 
				btn.classList.add('chord-quality');
				btn.style.color = '#188038'; 
			}
			if (item.type === 'shift') {
				 if (isShiftEnabled) btn.classList.add('active'); // Shift 啟用時亮燈
			}
			if (item.class) {
				// 支援多個 class (例如 'return-btn span-2')
				const classes = item.class.split(' ');
				classes.forEach(c => btn.classList.add(c));
			}

			// --- 事件綁定 ---
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				
				if (item.type === 'switch') {
					currentKeyMode = item.target;
					// 切換模式時，通常重置 Shift 狀態
					isShiftEnabled = false; 
					createKeys(); 
				} 
				else if (item.type === 'shift') {
					// --- Shift 切換邏輯 ---
					isShiftEnabled = !isShiftEnabled;
					createKeys(); // 重新渲染以更新字母顯示
				}
				else if (item.type === 'insert') {
					insertTextAtCursor(codeInput, item.text, item.offset);
				}
				else {
					// 一般輸入 (包含經過大小寫轉換的 inputChar)
					handleKeyInput(codeInput, inputChar);
					
					// 選項：如果是手機習慣，打完一個大寫字母後自動切回小寫
					// if (isShiftEnabled) { isShiftEnabled = false; createKeys(); }
				}
			});
			
			container.appendChild(btn);
		});
	}

    function createKeys() {
        renderKeysTo(document.getElementById('quick-toolbar'));
        renderKeysTo(document.getElementById('floating-keys-container'));
    }

	function insertTextAtCursor(input, text, cursorOffset = 0) {
        input.focus();
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const val = input.value;
        
        const newVal = val.slice(0, start) + text + val.slice(end);
        input.value = newVal;
        
        // 觸發更新
        input.dispatchEvent(new Event('input'));
        
        // 設定新游標位置 (加上位移量，方便輸入括號內容)
        const newPos = start + text.length + cursorOffset;
        input.setSelectionRange(newPos, newPos);
    }

    // 2. 切換邏輯
    if (toggleFixedBtn) {
        toggleFixedBtn.addEventListener('click', () => {
            fixedToolbar.classList.toggle('hidden');
            toggleFixedBtn.classList.toggle('active', !fixedToolbar.classList.contains('hidden'));
        });
    }

	if (toggleFloatBtn && floatingKeyboard) {
        toggleFloatBtn.addEventListener('click', () => {
            const isHidden = floatingKeyboard.classList.contains('hidden');
            if (isHidden) {
                // --- 開啟鍵盤 ---
                floatingKeyboard.classList.remove('hidden');
                toggleFloatBtn.classList.add('active');
                
                floatingKeyboard.style.top = ''; 
                floatingKeyboard.style.left = '';
                floatingKeyboard.style.bottom = ''; 
                floatingKeyboard.style.right = ''; 
                floatingKeyboard.style.transform = ''; 
                
            } else {
                // --- 關閉鍵盤 ---
                floatingKeyboard.classList.add('hidden');
                toggleFloatBtn.classList.remove('active');
            }
        });
    }

    if (closeFloatBtn) {
        closeFloatBtn.addEventListener('click', () => {
            floatingKeyboard.classList.add('hidden');
            if (toggleFloatBtn) toggleFloatBtn.classList.remove('active');
        });
    }

    // [新增] 浮動鍵盤 / 虛擬鋼琴開關時，自動切換系統鍵盤顯示
    // 用 MutationObserver 監聽 class 變化，不論從哪裡開關都會同步
    const kbPanelObserver = new MutationObserver(() => applyInputMode());
    function observeKeyboardPanel(id) {
        const el = document.getElementById(id);
        if (el && !el.dataset.imObserved) {
            el.dataset.imObserved = '1';
            kbPanelObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
        }
    }
    observeKeyboardPanel('floating-keyboard');
    // vk-container 由 virtual_keyboard.js 動態建立 (defer)，等頁面載入完再綁定
    window.addEventListener('load', () => {
        observeKeyboardPanel('vk-container');
        applyInputMode();
    });

    // 3. 拖曳功能 (只針對 floating-keyboard 的 .drag-handle)
    const dragHandle = document.querySelector('.drag-handle');
    if (dragHandle && floatingKeyboard) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const startDrag = (e) => {
            // 只允許按住 Header 拖曳
            if (e.target.closest('button')) return;

            isDragging = true;
            dragHandle.style.cursor = 'grabbing';
            
            // [新增] 開始拖曳時，暫時關閉動畫，避免移除 transform 時產生位移晃動
            floatingKeyboard.style.transition = 'none';

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            startX = clientX;
            startY = clientY;

            const rect = floatingKeyboard.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            // 轉為絕對定位計算
            floatingKeyboard.style.bottom = 'auto';
            floatingKeyboard.style.right = 'auto';
            floatingKeyboard.style.transform = 'none'; 
            floatingKeyboard.style.left = `${initialLeft}px`;
            floatingKeyboard.style.top = `${initialTop}px`;
            
            if(e.type === 'touchstart') document.body.style.overflow = 'hidden'; 
        };

        const onDrag = (e) => {
            if (!isDragging) return;
            e.preventDefault(); 

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            floatingKeyboard.style.left = `${initialLeft + dx}px`;
            floatingKeyboard.style.top = `${initialTop + dy}px`;
        };

        const stopDrag = () => {
            isDragging = false;
            dragHandle.style.cursor = 'move';
            document.body.style.overflow = ''; 
            
            floatingKeyboard.style.transition = ''; 
        };

        dragHandle.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);

        dragHandle.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', onDrag, { passive: false });
        document.addEventListener('touchend', stopDrag);
    }

	// 綁定還原按鈕
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
        undoBtn.addEventListener('click', performUndo);
    }



    // 字體大小控制邏輯
    const fontSizeBtn = document.getElementById('font-size-btn');
    const textAreas = [codeInput, fontOutput]; // 同時控制這兩個區域
    
    // 定義等級: 0=小(預設), 1=中, 2=大, 3=特大
    const MAX_FONT_LEVEL = 3;
    let currentFontLevel = 0;

    // 1. 應用字體等級
    function applyFontLevel(level) {
        textAreas.forEach(el => {
            if (!el) return;
            // 移除所有相關 class
            for (let i = 0; i <= MAX_FONT_LEVEL; i++) {
                el.classList.remove(`fs-level-${i}`);
            }
            // 加入當前等級 class
            el.classList.add(`fs-level-${level}`);
        });
        
        // 記憶設定 (Better Way: 記住使用者的偏好)
        localStorage.setItem('wesing_font_pref', level);
    }

    // 2. 初始化 (讀取記憶)
    const savedFontLevel = localStorage.getItem('wesing_font_pref');
    if (savedFontLevel !== null) {
        currentFontLevel = parseInt(savedFontLevel);
        applyFontLevel(currentFontLevel);
    }

    // 3. 綁定按鈕點擊事件
    if (fontSizeBtn) {
        fontSizeBtn.addEventListener('click', () => {
			console.log("A")
            // 循環邏輯: 0 -> 1 -> 2 -> 3 -> 0
            currentFontLevel = (currentFontLevel + 1) % (MAX_FONT_LEVEL + 1);
            applyFontLevel(currentFontLevel);
        });
    }

    // Final Init
    createKeys();
    loadData();
    renderAll();
});