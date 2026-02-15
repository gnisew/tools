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



// 定義三種面板：main(簡譜), chord(和弦), snippet(語法)
    const keySets = {
        // --- 1. 主鍵盤 (簡譜與編輯) ---
        main: [
				{ char: '1', display: '1', type: 'num' }, { char: '2', display: '2', type: 'num' }, { char: '3', display: '3', type: 'num' },
				{ char: '4', display: '4', type: 'num' }, { char: '5', display: '5', type: 'num' }, { char: '6', display: '6', type: 'num' },
				{ char: '7', display: '7', type: 'num' }, { char: '0', display: '0', type: 'num' }, { char: ' ', display: '空', type: 'space' },
				{ char: '- ', display: '-', type: 'normal' }, { char: '/', display: '/', type: 'normal' }, { char: '\\', display: '\\', type: 'normal' }, 
				{ char: ' *', display: '*', type: 'normal' },{ char: '.', display: '.', type: 'normal' },
				{ char: ':', display: ':', type: 'normal' }, 
				{ char: '(', display: '(', type: 'normal' }, { char: ') ', display: ')', type: 'normal' }, 
				{ char: '|', display: '|', type: 'normal' },{ char: '[', display: '[', type: 'normal' },{ char: ']', display: ']', type: 'normal' },
				{ char: '<>', display: '<', type: 'normal' }, 
				{ char: '{', display: '{', type: 'normal' },{ char: '} ', display: '}', type: 'normal' },
				{ char: '\'', display: '\'', type: 'normal' },{ char: '$', display: '$', type: 'normal' },
				{ char: '#', display: '#', type: 'normal' }, { char: 'b', display: 'b', type: 'normal' }, 

            
            // [切換鍵]
            { display: '弦', type: 'switch', target: 'chord', class: 'mode-btn' },
            { display: '快', type: 'switch', target: 'snippet', class: 'mode-btn' },

            
            // 功能鍵
            { char: 'backspace', display: '⌫', type: 'func' },
			{ char: '\n', display: '┛', type: 'normal' },
        ],

        // --- 2. 和弦鍵盤 (CDEFG...) ---
        chord: [
            // [切換鍵]
            { display: '數', type: 'switch', target: 'main', class: 'return-btn' },    
			
			{ char: '.', display: '.', type: 'normal' },
            { char: ':', display: ':', type: 'normal' },
            { char: 'r', display: 'r', type: 'normal' },
			{ char: '- ', display: '-', type: 'normal' },


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
            { char: 'maj7', display: 'maj⁷', type: 'chord-quality' }, { char: 'm7', display: 'm⁷', type: 'chord-quality' },
            { char: 'sus4', display: 'sus⁴', type: 'chord-quality' }, { char: 'sus2', display: 'sus²', type: 'chord-quality' },
            { char: 'add9', display: 'add⁹', type: 'chord-quality' }, { char: 'dim', display: 'dim', type: 'chord-quality' },
            
            // 常用符號補強
			{ char: '/', display: '/', type: 'normal' },
		
			{ display: '快', type: 'switch', target: 'snippet', class: 'mode-btn' },
			
			{ char: ' ', display: '空', type: 'space' },
            { char: 'backspace', display: '⌫', type: 'func' },
			{ char: '\n', display: '┛', type: 'normal' },

        ],

        // --- 3. 語法與代碼鍵盤 (Snippets) ---
        snippet: [
            // [切換鍵]
            { display: '數', type: 'switch', target: 'main', class: 'return-btn' },
            { display: '弦', type: 'switch', target: 'chord', class: 'mode-btn' },

            // 播放流程控制
            { label: '[Play]', text: '\n[play: A B A ]\n', offset: 0, type: 'insert', display: '[P]' },
            { label: '[A]{', text: '[A]{', offset: -2, type: 'insert', display: '[A]' },
            { label: '[B]{', text: '[B]{', offset: -2, type: 'insert', display: '[B]' },
			{ label: '[C]{', text: '[C]{', offset: -2, type: 'insert', display: '[C]' },
			{ label: '[D]{', text: '[D]{', offset: -2, type: 'insert', display: '[D]' },
			{ label: '};', text: '};', offset: 0, type: 'insert', display: '};' },
            
            // 自定義節奏樣板
            { label: '[r:]{1:}', text: '[r:]{1: (1.) $1 $1 $1 }', offset: -18, type: 'insert', display: '[r]' },
            
            // 常用樂器切換
            { char: 'p: ', display: 'p:', type: 'normal' },
            { char: 'g: ', display: 'g:', type: 'normal' },
            { char: 'v: ', display: 'v:', type: 'normal' },
            { char: 'd: ', display: 'd:', type: 'normal' },
            
            { char: 'backspace', display: '⌫', type: 'func' },
			{ char: '\n', display: '┛', type: 'normal' },
			

				


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
            try { appData = JSON.parse(stored); } 
            catch (e) { console.error("Data Reset", e); }
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
        renderLibrary();
    }

    // --- 新增：渲染範例曲庫 ---
    function renderLibrary() {
        if (!libraryListEl || typeof exampleSongs === 'undefined') return;
        
        libraryListEl.innerHTML = '';
        exampleSongs.forEach((exSong) => {
            const div = document.createElement('div');
            div.className = 'song-item library-item'; 
            div.innerHTML = `<span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${exSong.title}</span>`;
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

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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
        
        if (typeof window.Soundfont === 'undefined') {
            await loadScript('https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js');
        }

        try {
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

			format: 'mp3';

            // 載入樂器 (指定 URL)
            const inst = await window.Soundfont.instrument(ctx || audioCtx, realInstName, {
                nameToUrl: (name, soundfont, format) => {
                    return `${hqUrl}${name}-${format || 'mp3'}.js`;
                }
            });
            
            if (!targetCtx) {
                loadedInstruments[instName] = inst;
            }
            return inst;
        } catch (e) {
            console.error(`Soundfont load failed for ${instName}`, e);
            // 失敗時不拋出錯誤，而是回傳 null，避免卡死 Promise.all
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

        const instDef = instruments.find(i => i.val === targetInst) || instruments[0];
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


    async function exportAudio() {
        const notes = parseScore(codeInput.value);
        if (notes.length === 0) {
            alert("沒有可匯出的內容");
            return;
        }

        const btn = document.getElementById('export-btn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<div class="icon-loading" style="display:block; width:16px; height:16px; border-color:#555; border-top-color:transparent;"></div>';
        btn.disabled = true;

        try {
            // 1. 計算總長度
            const tempo = parseInt(tempoInput.value) || 100;
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

            // 建立離線錄音室
            const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, duration * sampleRate, sampleRate);

            // 2. 載入樂器
            const usedInstruments = [...new Set(notes.map(n => n.instrument))];
            const offlinePlayers = {};

            await Promise.all(usedInstruments.map(async (instVal) => {
                const instDef = instruments.find(i => i.val === instVal);
                if (instDef && instDef.type === 'soundfont') {
                    offlinePlayers[instVal] = await loadInstrument(instVal, offlineCtx);
                }
            }));

            // 3. 排程播放
            const totalShift = currentBaseKey + currentTranspose;
            const pitchFactor = Math.pow(2, totalShift / 12);

            notes.forEach(note => {
                if (!note.play) return;
                if (note.isRest) return;

                const noteStartTime = note.startTime * beatTime;
                const noteTotalDuration = note.duration * beatTime; // 總時長


                // [修改] 匯出時的和弦處理 (同步 playMusic 邏輯)
                if (note.type === 'chord' && note.chordFreqs) {
                    let patternLib = RHYTHM_BLOCK; 
                    if (note.rhythmType === 'arp') patternLib = RHYTHM_ARP;

                    const pattern = patternLib[note.rhythmId] || patternLib[1];
                    const patternLen = 4;
                    
                    // 輔助：計算特殊音程頻率 (與 playMusic 相同)
                    // 輔助：計算特殊音程頻率 (邏輯分組版)
                    const getFreq = (code, root, noteObj) => {
                        let baseF = 0;
                        const freqs = noteObj.chordFreqs;
                        // 判斷大小調 (影響 7th 的計算)
                        const isMinor = noteObj.chordInfo && noteObj.chordInfo.quality.includes('m') && !noteObj.chordInfo.quality.includes('maj');
                        
                        switch (code) {
                            // === 1. 標準和弦音 (Standard) ===
                            case 0: baseF = freqs[0]; break; // 根音 (1)
                            case 1: baseF = freqs[1] || freqs[0] * 1.2599; break; // 三度 (3)
                            case 2: baseF = freqs[2] || freqs[0] * 1.4983; break; // 五度 (5)
                            case 3: // 七度 (7)
                                if (freqs[3]) baseF = freqs[3];
                                else baseF = freqs[0] * (isMinor ? 1.7817 : 1.8877); 
                                break;

                            // === 2. 特殊裝飾音 (Color Tones) ===
                            case 9: // 九音/二度 (2) -> 讓和弦聽起來夢幻
                                baseF = freqs[0] * 1.12246; 
                                break;

                            // === 3. 低音伴奏區 (Bass / Low Octave) ===
                            case -1: baseF = freqs[0] / 2; break; // 低音根音 (1.)
                            case -2: baseF = (freqs[2] || freqs[0] * 1.4983) / 2; break; // 低音五度 (5.)
                            case -3: // 低音七度 (7.)
                                if (freqs[3]) baseF = freqs[3] / 2;
                                else baseF = (freqs[0] * (isMinor ? 1.7817 : 1.8877)) / 2;
                                break;
                            case -4: // 低音三度 (3.)
                                baseF = (freqs[1] || freqs[0] * 1.2599) / 2;
                                break;

                            default: baseF = freqs[0]; 
                        }
                        return baseF;
                    };
                    
                    for (let loopStart = 0; loopStart < note.duration; loopStart += patternLen) {
                        pattern.steps.forEach(step => {
                            const stepAbsStart = loopStart + step.t;
                            if (stepAbsStart >= note.duration) return;

                            let playDuration = step.len;
                            if (stepAbsStart + playDuration > note.duration) {
                                playDuration = note.duration - stepAbsStart;
                            }

                            const absTime = noteStartTime + (stepAbsStart * beatTime);
                            const absDur = playDuration * beatTime;

                            if (Array.isArray(step.notes)) {
                                step.notes.forEach(code => {
                                    const f = getFreq(code, note.chordFreqs[0], note);
                                    if (f > 0) {
                                        playTone(
                                            f * pitchFactor, 
                                            absTime, 
                                            absDur, 
                                            note.instrument, 
                                            offlineCtx, 
                                            offlinePlayers[note.instrument]
                                        );
                                    }
                                });
                            }
                        });
                    }
                }
                // [維持] 單音處理邏輯
                else if (note.freq > 0) {
                    const finalFreq = note.freq * pitchFactor;
                    playTone(
                        finalFreq, 
                        noteStartTime, 
                        noteTotalDuration, 
                        note.instrument, 
                        offlineCtx, 
                        offlinePlayers[note.instrument]
                    );
                }
            });

            // 4. 開始渲染
            const renderedBuffer = await offlineCtx.startRendering();

            // 5. 轉檔並下載
            const mp3Blob = bufferToMP3(renderedBuffer);
            
            const url = URL.createObjectURL(mp3Blob);
            const a = document.createElement('a');
            const songName = titleInput.value.trim() || "樂譜";
            a.style.display = 'none';
            a.href = url;
            a.download = `${songName}.mp3`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);

        } catch (e) {
            console.error("Export failed", e);
            alert("匯出失敗：" + e.message);
        } finally {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    }

    function bufferToMP3(buffer) {
        if (!window.lamejs) {
            alert("MP3 編碼器尚未載入，請檢查網路連線。");
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
	function parseRhythmString(patternStr) {
		const steps = [];
		let currentTime = 0;
		let groupCache = []; 

		// 支援全形/半形空格切割
		const tokens = patternStr.trim().split(/[\s\u3000]+/);

		// 音高代碼對照表 (確保 regex 抓出來的 key 這裡都有)
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
				if (groupCache[refIdx]) { notes = [...groupCache[refIdx]]; }
			} 
			// B. 休止符 (0)
			else if (cleanToken === '0') { 
				notes = []; 
			}
			// C. 音符解析 (核心修正：同步編輯區的解析邏輯)
			else {
				// 1. 移除括號
				let inner = cleanToken.replace(/[\(\)]/g, '');
				
				// 2. [關鍵升級] 採用混合解析策略
				// 支援: 15 -> 1, 5
				// 支援: 1.15 -> 1., 1, 5
				// 支援: 1'.15 -> 1, .1, 5
				
				let subTokens = [];
				if (inner.includes("'")) {
					// 如果有分隔符，先切割
					let segments = inner.split("'");
					segments.forEach(seg => {
						if (!seg) return;
						// 對每個區段抓取音符 (包含 . 或 :)
						let found = seg.match(/[.:]*[0-7][.:]*/g);
						if (found) subTokens.push(...found);
					});
				} else {
					// 沒有分隔符，直接正則抓取 (會自動將 1. 視為一個單位，1 視為另一個)
					subTokens = inner.match(/[.:]*[0-7][.:]*/g) || [];
				}

				// 3. 映射到代碼
				subTokens.forEach(t => { 
					// 防呆：如果 map 裡有這個 key 才加入
					if (noteMap.hasOwnProperty(t)) {
						notes.push(noteMap[t]); 
					} else {
						// 嘗試處理更複雜的寫法 (如倍低音 :1)，若 map 沒有定義則 fallback 到中音
						// 這裡簡單處理：去掉所有符號只看數字 (僅作備援)
						let simpleNum = t.replace(/[.:]/g, '');
						if (noteMap.hasOwnProperty(simpleNum)) notes.push(noteMap[simpleNum]);
					}
				});
				
				// 4. 存入快取 (若原始 token 有括號)
				if (cleanToken.includes('(')) { groupCache.push(notes); }
			}


			steps.push({ t: currentTime, len: duration, notes: notes });
			
			// 推進時間
			currentTime += duration;
		});

		return { name: "Custom Rhythm", steps: steps };
	}

    // [修正] 樂譜解析核心 (修復三連音與各類符號的優先順序)
    // 樂譜解析核心
    // [修正] 樂譜解析核心 (支援 ignoreFlow 參數)
    function parseScore(text, ignoreFlow = false) {
        // ==========================================
        // 0. 預處理：解析並「挖空」自定義節奏定義
        // ==========================================
        let customRhythms = {}; 
        
        const defRegex = /\[(rhythm|r)\s*(?::\s*([a-zA-Z0-9_]*))?\s*\]\s*\{([^}]+)\}/gi;
        
        let textForParsing = text.replace(defRegex, (match, p1, p2, p3) => {
            let prefix = (p2 || '').trim();
            if (!prefix) prefix = 'r';
            const content = p3;
            
            if (!customRhythms[prefix]) customRhythms[prefix] = {};

            const patternParts = content.split(/(\d+)\s*:/);
            for (let i = 1; i < patternParts.length; i += 2) {
                const id = patternParts[i].trim();
                const patternStr = patternParts[i+1] ? patternParts[i+1].trim() : "";
                if (id && patternStr) {
                    customRhythms[prefix][id] = parseRhythmString(patternStr);
                    customRhythms[prefix][id].name = `Custom ${prefix}-${id}`;
                }
            }
            return ' '.repeat(match.length);
        });

        // ==========================================
        // 1. 預處理：流程管理
        // ==========================================
        let lines = [];
        const flowMatch = textForParsing.match(/^\[\s*play\s*:\s*(.*?)\]/im);

        // [關鍵] 若 ignoreFlow 為 true，強制跳過流程控制，走線性解析
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

            const headerRegex = /^\[([a-zA-Z0-9_-]+)\]\s*$/gm;
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
            // --- Mode B: 線性解析 (選取播放用) ---
            let ptr = 0;
            while (ptr < textForParsing.length) {
                 let endIdx = textForParsing.indexOf('\n', ptr);
                 if (endIdx === -1) endIdx = textForParsing.length;
                 let lineContent = textForParsing.substring(ptr, endIdx);
                 if (lineContent.endsWith('\r')) lineContent = lineContent.slice(0, -1);
                 
                 if (!lineContent.trim().match(/^\[([a-zA-Z0-9_-]+)\]$/)) {
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
                if (currentSimulBlock.length > 0) {
                    blocks.push(currentSimulBlock);
                    currentSimulBlock = [];
                }
                return;
            }
            const match = cleanLine.match(labelRegex);
            if (match) {
                currentSimulBlock.push(lineObj);
            } else {
                if (currentSimulBlock.length > 0) {
                    blocks.push(currentSimulBlock);
                    currentSimulBlock = [];
                }
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

                    if (!cleanStr) {
                        inputIdx += inputLen;
                        return;
                    }

                    let tempToken = cleanStr;
                    
                    const tokenAbsStart = lineObj.startIndex + textOffsetInLine + inputIdx;
                    const tokenAbsEnd = tokenAbsStart + token.length;

                    // --- 優先處理獨立符號 ---
                    if (cleanStr === '<') {
                        rawLineNotes.push({ type: 'groupStart', play: false, duration: 0, visualDuration: 0, inputStart: tokenAbsStart, inputEnd: tokenAbsEnd });
                        inputIdx += inputLen; return;
                    }
                    if (cleanStr === '>') {
                        rawLineNotes.push({ type: 'groupEnd', play: false, duration: 0, visualDuration: 0, inputStart: tokenAbsStart, inputEnd: tokenAbsEnd });
                        inputIdx += inputLen; return;
                    }
                    if (cleanStr === '((') {
                        rawLineNotes.push({ type: 'tieSymbol', play: false, duration: 0, inputStart: tokenAbsStart, inputEnd: tokenAbsEnd });
                        inputIdx += inputLen; return;
                    }
                    if (cleanStr === '||:') { rawLineNotes.push({ type: 'repeatStart' }); inputIdx += inputLen; return; }
                    if (cleanStr === ':||') { rawLineNotes.push({ type: 'repeatEnd' }); inputIdx += inputLen; return; }

                    // --- 緊湊寫法前綴 ---
                    let hasTupletStart = false;
                    let hasTupletEnd = false;
                    let localInputOffset = 0;

                    if (tempToken.startsWith('<')) { 
                        hasTupletStart = true;
                        tempToken = tempToken.substring(1);
                        localInputOffset = 1;
                    } 
                    if (tempToken.endsWith('>')) {
                        hasTupletEnd = true;
                        tempToken = tempToken.slice(0, -1);
                    }
                    if (hasTupletStart) rawLineNotes.push({ type: 'groupStart', play: false, duration: 0, visualDuration: 0 });

                    // --- 和弦 ---
                    const compactMatch = tempToken.match(/^\(([0-7.:'\s]+)\)([\/\\*-]*)$/);
                    if (compactMatch) {
                        const content = compactMatch[1];
                        const suffix = compactMatch[2];
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
                                const char = numMatch[0];
                                let freq = relFreqs[char] || 0;
                                const prefix = tokenStr.substring(0, numMatch.index);
                                const suffixPart = tokenStr.substring(numMatch.index + 1);
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
                    if (tempToken.endsWith(')')) { tempToken = tempToken.slice(0, -1); } // 這裡不設 flag，因為下面 cleanStr 會處理
                    
                    if (cleanStr === '(') { rawLineNotes.push({ type: 'chordStart', play: false, duration: 0, inputStart: tokenAbsStart, inputEnd: tokenAbsEnd }); inputIdx += inputLen; return; }
                    if (cleanStr === ')') { rawLineNotes.push({ type: 'chordEnd', play: false, duration: 0, inputStart: tokenAbsStart, inputEnd: tokenAbsEnd }); inputIdx += inputLen; return; }

                    const absoluteStart = lineObj.startIndex + textOffsetInLine + inputIdx + localInputOffset;
                    const absoluteEnd = absoluteStart + tempToken.length;

                    let note = { token: tempToken, freq: 0, chordFreqs: null, chordInfo: null, rhythmId: 1, rhythmType: '', customSteps: null, duration: 1, inputStart: absoluteStart, inputEnd: absoluteEnd, isRest: false, isExtension: tempToken === '-', isTieStart: false, play: true, visualDuration: 1, type: 'note', instrument: currentLineInstrument, startTime: 0, isMainTrack: (lineIndex === 0) };
                    let isChordParsed = false;

                    if (tempToken.startsWith('.') || tempToken.startsWith(':') || /^[a-zA-Z]/.test(tempToken)) {
                        let rawContent = tempToken; let rType = '';
                        if (tempToken.startsWith('.')) { rType = 'block'; rawContent = tempToken.substring(1); }
                        else if (tempToken.startsWith(':')) { rType = 'arp'; rawContent = tempToken.substring(1); }
                        else { for (const prefix in customRhythms) { if (tempToken.startsWith(prefix)) { rType = 'custom'; rawContent = tempToken.substring(prefix.length); break; } } }
                        if (rType) {
                            let cleanContent = rawContent.replace(/[\/\(\)\\*-]/g, ''); let rhythmMatch = cleanContent.match(/^(\d+)/); let chordNamePart = cleanContent; let rhythmIdTemp = 1;
                            if (rhythmMatch) { rhythmIdTemp = parseInt(rhythmMatch[1]); chordNamePart = cleanContent.substring(rhythmMatch[0].length); }
                            if (checkChord(chordNamePart, note)) {
                                isChordParsed = true; note.type = 'chord'; note.rhythmId = rhythmIdTemp; note.rhythmType = rType;
                                if (rType === 'custom') note.customSteps = customRhythms[Object.keys(customRhythms).find(k=>tempToken.startsWith(k))][rhythmIdTemp]?.steps;
                                parseDurationSuffix(tempToken, note);
                            }
                        }
                    }

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
                    if (cleanStr.endsWith(')')) rawLineNotes.push({ type: 'chordEnd', play: false, duration: 0, inputEnd: tokenAbsEnd }); // 一般和弦結束補強
                    
                    inputIdx += inputLen;
                });

                // --- 4. 後處理 ---
                let expandedNotes = [];
                let repeatStartIdx = 0;
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
                            chordNotes[0].inputStart = finalStart; chordNotes[0].inputEnd = finalEnd;
                            for (let k = 1; k < chordNotes.length; k++) { chordNotes[k].inputStart = undefined; chordNotes[k].inputEnd = undefined; }
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
    // [修正] 播放邏輯 (支援嚴格選取播放、過濾合奏滲漏、404修復)
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
        
        // [修正 1] 如果有選取，傳入 true 給 parseScore，強制其忽略 [Play: A B A]
        // 這樣解析出來的音符就是「線性」對應到文本的，避免因流程控制而產生重複段落
        let notes = parseScore(fullText, hasSelection);

        let hasPlayableNote = notes.some(n => n.play && !n.isRest && (n.type === 'note' || n.type === 'chord'));
        if (!hasPlayableNote) {
            console.warn("No playable notes found.");
            stopMusic(); 
            return;
        }

        isPlaying = true;
        updatePlayButtonUI('loading'); 

        let seekTime = 0;
        
        if (hasSelection) {
            savedSelection = { start: start, end: end };
            
            // [修正 2] 在選取模式下，找出「選取範圍內」最早的音符時間作為起點
            const firstNote = notes.find(n => 
                n.inputStart !== undefined && 
                n.inputEnd !== undefined &&
                // 只要音符的範圍與選取範圍有交集，就視為候選
                Math.max(start, n.inputStart) < Math.min(end, n.inputEnd)
            );
            
            if (firstNote) seekTime = firstNote.startTime;
        } else {
            // 游標播放模式
            savedSelection = null;
            let targetNote = notes.find(n => start >= n.inputStart && start < n.inputEnd);
            if (!targetNote) targetNote = notes.find(n => n.inputStart >= start);
            if (targetNote) seekTime = targetNote.startTime;
        }

        // [修正 3] 過濾無效樂器 (修復 undefined-mp3.js 404 錯誤)
        // 這是導致程式卡死的元兇，務必加入 filter
        const usedInstrumentVals = new Set(
            notes
            .filter(n => n.instrument) // 只保留有定義樂器的音符
            .map(n => n.instrument)
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

            notes.forEach(note => {
                // 過濾結構標記
                if (['chordStart', 'chordEnd', 'groupStart', 'groupEnd', 'tieSymbol', 'repeatStart', 'repeatEnd'].includes(note.type)) return;

                // [修正 4] 嚴格過濾邏輯：確保只播選取到的
                if (hasSelection) {
                    // 如果音符的文字範圍沒有落在選取範圍內，直接跳過
                    // 邏輯：音符結束點 <= 選取開始點 (在左邊) OR 音符開始點 >= 選取結束點 (在右邊)
                    // 這也自然解決了合奏時「選上行播到下行」的問題，因為下行的文字位置完全不同
                    if (note.inputEnd <= start || note.inputStart >= end) return;
                } else {
                    // 游標模式：只過濾時間
                    if (note.startTime < seekTime - 0.01) return;
                }

                // 計算相對時間 (將 seekTime 視為 0)
                const relativeNoteTime = note.startTime - seekTime;
                const noteAbsStart = startTime + relativeNoteTime * beatTime;

                // --- UI 高亮 ---
                if (note.inputStart !== undefined && note.inputEnd !== undefined) {
                    if (note.isMainTrack) {
                        const delayMs = (noteAbsStart - now) * 1000;
                        if (delayMs >= -50) { 
                            const timerId = setTimeout(() => {
                                if (!isPlaying) return;
                                highlightInput(note.inputStart, note.inputEnd);
                                lastPlayedNoteEnd = note.inputEnd; 
                            }, delayMs);
                            activeTimers.push(timerId);
                        }
                    }
                }

                // --- 音訊播放 ---
                if (note.play) {
                    const absDur = note.duration * beatTime;
                    const noteEndTime = noteAbsStart + absDur;
                    // 使用調整後的 noteAbsStart 來計算結束時間，確保進度條長度正確
                    if (noteEndTime > maxEndTime) maxEndTime = noteEndTime;

                    if (note.type === 'chord' && note.chordFreqs) {
                        let patternLib = RHYTHM_BLOCK; 
                        if (note.rhythmType === 'arp') patternLib = RHYTHM_ARP;
                        const pattern = patternLib[note.rhythmId] || patternLib[1];
                        const patternLen = 4;
                        const getFreq = (code, root, noteObj) => {
                             let baseF = 0; const freqs = noteObj.chordFreqs; const isMinor = noteObj.chordInfo && noteObj.chordInfo.quality.includes('m') && !noteObj.chordInfo.quality.includes('maj');
                             switch (code) { case 0: baseF = freqs[0]; break; case 1: baseF = freqs[1] || freqs[0] * 1.2599; break; case 2: baseF = freqs[2] || freqs[0] * 1.4983; break; case 3: if (freqs[3]) baseF = freqs[3]; else baseF = freqs[0] * (isMinor ? 1.7817 : 1.8877); break; case 9: baseF = freqs[0] * 1.12246; break; case -1: baseF = freqs[0] / 2; break; case -2: baseF = (freqs[2] || freqs[0] * 1.4983) / 2; break; case -3: if (freqs[3]) baseF = freqs[3] / 2; else baseF = (freqs[0] * (isMinor ? 1.7817 : 1.8877)) / 2; break; case -4: baseF = (freqs[1] || freqs[0] * 1.2599) / 2; break; case -20: baseF = (freqs[0] * 1.12246) / 2; break; case -21: baseF = (freqs[0] * 1.3348) / 2; break; case -22: baseF = (freqs[0] * 1.6818) / 2; break; case 12: baseF = freqs[0] * 2; break; case 14: baseF = (freqs[0] * 1.12246) * 2; break; case 15: baseF = (freqs[1] || freqs[0] * 1.2599) * 2; break; default: baseF = freqs[0]; } return baseF;
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

            // 設定自動停止計時器 (使用新的 maxEndTime - now)
            // 確保只等待選取範圍播放完畢的時間
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
            alert("載入樂器失敗，請檢查網路連線。");
        });
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
        const raw = codeInput.value;
        const parts = raw.split(/(\s+)/);
        let newParts = [];
        let pendingAcc = 0; 

        for(let i=0; i<parts.length; i++) {
            let token = parts[i];
            let clean = token.trim();
            
            if(!clean) {
                newParts.push(token);
                continue;
            }

            // [關鍵修改] 處理和弦 (以 . 或 : 開頭)
            // 支援格式: .C, :Am, .1C, :12G7 (中間夾帶數字)
            if (clean.startsWith('.') || clean.startsWith(':')) {
                let prefix = clean[0];
                let content = clean.substring(1); // 移除開頭符號
                
                // 1. 先分離尾部的時值斜線
                let slashMatch = content.match(/[\/\\]+$/);
                let slashes = slashMatch ? slashMatch[0] : "";
                let coreContent = slashMatch ? content.substring(0, slashMatch.index) : content;

                // 2. [新增] 分離中間的節奏數字 (如 "12C" -> rhythmDigits="12", chordSymbol="C")
                let rhythmMatch = coreContent.match(/^(\d+)/);
                let rhythmDigits = rhythmMatch ? rhythmMatch[1] : "";
                let chordSymbol = rhythmMatch ? coreContent.substring(rhythmMatch[0].length) : coreContent;

                // 3. 找出根音 (Root)
                // 必須確保剩下的 chordSymbol 是以和弦根音開頭，否則可能是高音簡譜 (如 .1)
                let rootStr = "";
                let rootVal = -1;
                
                // 只有當 chordSymbol 有內容時才嘗試比對和弦
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
                    // === 是和弦，進行移調 ===
                    
                    // 4. 取得後綴 (Quality)
                    let quality = chordSymbol.substring(rootStr.length);
                    
                    // 5. 移調計算
                    let newVal = (rootVal + direction) % 12;
                    if (newVal < 0) newVal += 12;
                    
                    let newRootStr = CHORD_ROOT_NAMES[newVal];
                    
                    // 6. 重組: 前綴 + 節奏數字 + 新根音 + 性質 + 斜線
                    newParts.push(prefix + rhythmDigits + newRootStr + quality + slashes);
                    continue; // 處理完畢，跳過後續邏輯
                } 
                
                // 若 rootVal == -1，表示雖然以 . 或 : 開頭，但不是和弦 (可能是 .1 或 :1 高音簡譜)
                // 讓它繼續往下執行，進入原本的音符處理邏輯
            }


            // --- 以下為原本的簡譜音符移調邏輯 (保持不變) ---

            if((token.match(/^[a-zA-Z]/) && clean !== 'b' && clean !== 'z') || token.includes('|') || token.includes(')') || token.includes('(') || token.includes('-')) {
                newParts.push(token);
                continue;
            }

            if (clean === 'b') { 
                pendingAcc = -1; 
                if (i + 1 < parts.length && /^\s+$/.test(parts[i+1])) { i++; }
                continue; 
            }
            if (clean === '#') { 
                pendingAcc = 1; 
                if (i + 1 < parts.length && /^\s+$/.test(parts[i+1])) { i++; }
                continue; 
            }
            if (clean === 'z') { 
                pendingAcc = 0; 
                if (i + 1 < parts.length && /^\s+$/.test(parts[i+1])) { i++; }
                continue; 
            }

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

                if(newAcc === 1) newParts.push("#");
                if(newAcc === -1) newParts.push("b");
                if(newAcc !== 0) newParts.push(" ");

                let newPrefix = "";
                if(newOctave > 0) {
                    let d2 = Math.floor(newOctave / 2);
                    let d1 = newOctave % 2;
                    newPrefix += ":".repeat(d2) + ".".repeat(d1);
                }
                
                let newSuffix = "";
                let durationChars = token.match(/[\/\\]+/); 
                let durationStr = durationChars ? durationChars[0] : "";
                
                if(newOctave < 0) {
                    let abs = Math.abs(newOctave);
                    let d2 = Math.floor(abs / 2);
                    let d1 = abs % 2;
                    newSuffix += ":".repeat(d2) + ".".repeat(d1);
                }
                newSuffix += durationStr;

                newParts.push(newPrefix + newDigit + newSuffix);
                pendingAcc = 0;
            } else {
                newParts.push(token);
            }
        }
        
        codeInput.value = newParts.join("");
        
        // 更新相關狀態
        currentBaseKey = (currentBaseKey + direction + 12) % 12;
        baseKeySelect.value = currentBaseKey;
        codeInput.dispatchEvent(new Event('input'));
        updateCurrentSongSettings();
        updateTransposeUI();
        updateStatusDisplay();
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
        
        currentTempo = song.tempo || 100;
        currentInstrument = song.instrument || 'acoustic_grand_piano';
        currentBaseKey = song.baseKey || 0;
        currentTranspose = song.transpose || 0;
        
        tempoInput.value = currentTempo;
        baseKeySelect.value = currentBaseKey;
        updateTransposeUI();
        
        const instObj = instruments.find(i => i.val === currentInstrument) || instruments[0];
        document.getElementById('current-inst-icon').textContent = instObj.icon;

        fontOutput.value = convertCodeToFont(song.content);
		updateStatusDisplay();
	}

    function renderSidebar() {
        songListEl.innerHTML = '';
        appData.songs.forEach(song => {
            const div = document.createElement('div');
            div.className = `song-item ${song.id === appData.currentId ? 'active' : ''}`;
            div.innerHTML = `
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">${song.title.trim() || "未命名樂譜"}</span>
                <button class="delete-song-btn" title="刪除">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            `;
            div.onclick = () => switchSong(song.id);
            div.querySelector('.delete-song-btn').onclick = (e) => deleteSong(song.id, e);
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
    // [修改] 範圍取代功能模組 (極簡版)
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
            alert("⚠️ 請先「選取」要修改的範圍！");
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
            alert("⚠️ 請先在編輯區「選取」要取代的範圍！");
            codeInput.focus();
            return;
        }

        const findStr = findInput.value;
        const replaceStr = replaceInput.value;

        if (!findStr) {
            alert("請輸入要尋找的內容");
            findInput.focus();
            return;
        }

        const originalFullText = codeInput.value;
        const selectedText = originalFullText.substring(start, end);

        if (!selectedText.includes(findStr)) {
            alert(`在選取範圍內找不到 "${findStr}"`);
            return;
        }

        // 執行取代
        const newSelectedText = selectedText.split(findStr).join(replaceStr);
        const newFullText = originalFullText.substring(0, start) + newSelectedText + originalFullText.substring(end);

        // 更新內容與存檔
        codeInput.value = newFullText;
        codeInput.dispatchEvent(new Event('input'));

        // 更新選取範圍 (選取剛取代完的區域)
        const newEnd = start + newSelectedText.length;
        codeInput.setSelectionRange(start, newEnd);
        codeInput.focus();
    }
    function replaceSelectedText() {
        const start = codeInput.selectionStart;
        const end = codeInput.selectionEnd;

        // 檢查是否有選取範圍
        if (start === end) {
            alert("⚠️ 請先在編輯區「選取」要進行取代的範圍！\n(此功能僅針對選取範圍有效，以防止誤改)");
            codeInput.focus();
            return;
        }

        const findStr = findInput.value;
        const replaceStr = replaceInput.value;

        if (!findStr) {
            alert("請輸入要尋找的內容");
            findInput.focus();
            return;
        }

        const originalFullText = codeInput.value;
        const selectedText = originalFullText.substring(start, end);

        // 檢查選取範圍內是否有目標
        if (!selectedText.includes(findStr)) {
            alert(`在選取範圍內找不到 "${findStr}"`);
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

    function createKeys() {
        if(!quickToolbar) return;
        quickToolbar.innerHTML = '';
        keys.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.innerHTML = item.display;
            if (item.type === 'num') btn.classList.add('num-key');
            if (item.type === 'func') btn.classList.add('func-key');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleKeyInput(codeInput, item.char);
            });
            quickToolbar.appendChild(btn);
        });
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
    }

    // ==========================================
    // 6. UI Events & Init
    // ==========================================
    
    // Inputs
    codeInput.addEventListener('input', (e) => {
        const song = getCurrentSong();
        if (song) {
            song.content = e.target.value;
            saveData();
            fontOutput.value = convertCodeToFont(song.content);
        }
		updateStatusDisplay();
    });

    fontOutput.addEventListener('input', (e) => {
        const song = getCurrentSong();
        if (song) {
            const convertedCode = convertFontToCode(e.target.value);
            song.content = convertedCode;
            saveData();
            codeInput.value = convertedCode;
        }
    });

    titleInput.addEventListener('input', (e) => {
        const song = getCurrentSong();
        if (song) {
            song.title = e.target.value;
            saveData();
            renderSidebar();
        }
    });

    // Buttons
	document.getElementById('export-btn').addEventListener('click', () => {
        // 使用 bufferToWave 的 offset 參數修正：
        // 上面的 bufferToWave 呼叫時用了錯誤的參數傳遞 (len => {})
        // 修正後的 exportAudio 呼叫方式應為 bufferToWave(renderedBuffer, 0)
        exportAudio();
    });

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
    
    document.getElementById('layout-btn').addEventListener('click', () => {
        const workspace = document.getElementById('workspace');
        workspace.classList.toggle('layout-horizontal');
        workspace.classList.toggle('layout-vertical');
    });

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
        tempoInput.value = Math.max(40, parseInt(tempoInput.value) - 1);
        currentTempo = parseInt(tempoInput.value);
        updateCurrentSongSettings();
		updateStatusDisplay();
    });
    document.getElementById('tempo-plus').addEventListener('click', () => {
        tempoInput.value = Math.min(240, parseInt(tempoInput.value) + 1);
        currentTempo = parseInt(tempoInput.value);
        updateCurrentSongSettings();
		updateStatusDisplay();
    });

	tempoInput.addEventListener('change', () => {
        let val = parseInt(tempoInput.value) || 100;
        if (val < 20) val = 20;
        if (val > 300) val = 300;
        tempoInput.value = val;
        currentTempo = val;
        updateCurrentSongSettings();
        updateStatusDisplay(); // [新增] 同步更新狀態列
    });

    baseKeySelect.addEventListener('change', () => {
        currentBaseKey = parseInt(baseKeySelect.value);
        updateTransposeUI();
        updateCurrentSongSettings();
		updateStatusDisplay();
    });

    document.getElementById('transpose-minus').addEventListener('click', () => {
        currentTranspose = Math.max(-12, currentTranspose - 1);
        updateTransposeUI();
        updateCurrentSongSettings();
		updateStatusDisplay();
    });
    document.getElementById('transpose-plus').addEventListener('click', () => {
        currentTranspose = Math.min(12, currentTranspose + 1);
        updateTransposeUI();
        updateCurrentSongSettings();
		updateStatusDisplay();
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

    if (keyboardToggleBtn) {
        keyboardToggleBtn.addEventListener('click', (e) => {
            // 防止點擊按鈕導致編輯區失焦
            e.preventDefault();

            isSystemKeyboardEnabled = !isSystemKeyboardEnabled;
            const input = document.getElementById('code-input');

            if (isSystemKeyboardEnabled) {
                // --- 開啟系統鍵盤 ---
                input.setAttribute('inputmode', 'text'); // 或 'decimal' 視需求而定
                
                // 更新按鈕樣式 (實心鍵盤圖示)
                keyboardToggleBtn.classList.add('active'); // 可選：加上高亮樣式
                keyboardToggleBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
                    </svg>`;
            } else {
                // --- 關閉系統鍵盤 (只顯示游標) ---
                input.setAttribute('inputmode', 'none');
                
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
        
        // 根據 currentKeyMode 取得對應的按鈕列表
        const activeSet = keySets[currentKeyMode] || keySets['main'];
        
        activeSet.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.innerHTML = item.display;
            
            // 樣式類別處理
            if (item.type === 'num') btn.classList.add('num-key');
            if (item.type === 'func') btn.classList.add('func-key');
            if (item.type === 'chord-root') { btn.style.color = '#d93025'; }
            if (item.type === 'chord-quality') { btn.style.color = '#188038'; fontSize = '0.7rem'; }
            if (item.class) btn.classList.add(item.class); // 加入自訂 class (如 mode-btn)

            // 事件綁定
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // 防止失焦
                
                if (item.type === 'switch') {
                    // --- 切換模式邏輯 ---
                    currentKeyMode = item.target;
                    createKeys(); // 重新渲染所有鍵盤容器
                } 
                else if (item.type === 'insert') {
                    // --- 插入長文字邏輯 (Snippet) ---
                    insertTextAtCursor(codeInput, item.text, item.offset);
                }
                else {
                    // --- 一般字元輸入 ---
                    handleKeyInput(codeInput, item.char);
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
                floatingKeyboard.classList.remove('hidden');
                toggleFloatBtn.classList.add('active');
                
                // [修改] 解開註解並強制清除定位，讓 CSS 的置中生效
                floatingKeyboard.style.top = ''; 
                floatingKeyboard.style.left = '';
                floatingKeyboard.style.transform = ''; // 清除拖曳時可能留下的 transform: none
                
            } else {
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

    // 3. 拖曳功能 (只針對 floating-keyboard 的 .drag-handle)
    const dragHandle = document.querySelector('.drag-handle');
    if (dragHandle && floatingKeyboard) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const startDrag = (e) => {
            // 只允許按住 Header 拖曳
            if (e.target.closest('button')) return; // 避免拖曳到關閉按鈕

            isDragging = true;
            dragHandle.style.cursor = 'grabbing';
            
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
            floatingKeyboard.style.transform = 'none'; // 移除 CSS 的居中 transform
            floatingKeyboard.style.left = `${initialLeft}px`;
            floatingKeyboard.style.top = `${initialTop}px`;
            
            if(e.type === 'touchstart') document.body.style.overflow = 'hidden'; // 防止手機拖曳時畫面捲動
        };

        const onDrag = (e) => {
            if (!isDragging) return;
            e.preventDefault(); // 關鍵：防止手機瀏覽器下拉刷新或捲動

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
            document.body.style.overflow = ''; // 恢復捲動
        };

        dragHandle.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);

        dragHandle.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', onDrag, { passive: false });
        document.addEventListener('touchend', stopDrag);
    }

    // Final Init
    createKeys();
    loadData();
    renderAll();
});