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



    // 柱式/齊奏類節奏 (Block Chords) - 對應語法 .C
    const RHYTHM_BLOCK = {
        // --- 基礎類 ---
        1: { name: "全音符 (Pad)", steps: [
            { t: 0, len: 4, notes: [0, 1, 2] } 
        ]},
        2: { name: "四分音符 (進行曲)", steps: [
            { t: 0, len: 1, notes: [0, 1, 2] }, { t: 1, len: 1, notes: [0, 1, 2] },
            { t: 2, len: 1, notes: [0, 1, 2] }, { t: 3, len: 1, notes: [0, 1, 2] }
        ]},
        3: { name: "八分音符 (直球搖滾)", steps: [
            { t: 0, len: 0.5, notes: [0, 1, 2] }, { t: 0.5, len: 0.5, notes: [0, 1, 2] },
            { t: 1, len: 0.5, notes: [0, 1, 2] }, { t: 1.5, len: 0.5, notes: [0, 1, 2] },
            { t: 2, len: 0.5, notes: [0, 1, 2] }, { t: 2.5, len: 0.5, notes: [0, 1, 2] },
            { t: 3, len: 0.5, notes: [0, 1, 2] }, { t: 3.5, len: 0.5, notes: [0, 1, 2] }
        ]},
        
        // --- 吉他刷法類 (Strumming) ---
        // 模擬吉他：[0] 代表低音弦先刷，[1,2] 代表高音弦，[0,1,2] 代表全刷
        
        4: { name: "民謠吉他 (Folk) - 下_下上_上下", steps: [
            // 常見的 "D - D U - U D U" 刷法 (島嶼風格)
            { t: 0, len: 1, notes: [0, 1, 2] },    // 下 (1拍)
            { t: 1, len: 0.5, notes: [0, 1, 2] },  // 下
            { t: 1.5, len: 1, notes: [1, 2] },     // 上 (延音跨過第3拍)
            { t: 2.5, len: 0.5, notes: [1, 2] },   // 上
            { t: 3, len: 0.5, notes: [0, 1, 2] },  // 下
            { t: 3.5, len: 0.5, notes: [1, 2] }    // 上
        ]},
        5: { name: "鄉村吉他 (Country) - 根_刷_五_刷", steps: [
            // 經典的 Bass-Chord 伴奏
            { t: 0, len: 1, notes: [0] },      // 根音
            { t: 1, len: 1, notes: [1, 2] },   // 和弦
            { t: 2, len: 1, notes: [2] },      // 五度音 (Alternating Bass)
            { t: 3, len: 1, notes: [1, 2] }    // 和弦
        ]},
        6: { name: "慢搖滾 (Slow Rock) - 三連音感", steps: [
            // 12/8 拍感覺的刷法 (強 弱 弱 強 弱 弱)
            { t: 0, len: 1, notes: [0, 1, 2] },
            { t: 1, len: 0.5, notes: [1, 2] }, // 弱
            { t: 1.5, len: 0.5, notes: [1, 2] }, // 弱
            { t: 2, len: 1, notes: [0, 1, 2] },
            { t: 3, len: 0.5, notes: [1, 2] }, // 弱
            { t: 3.5, len: 0.5, notes: [1, 2] }  // 弱
        ]},
        7: { name: "抒情刷法 (Ballad) - 分散式", steps: [
            // 類似鋼琴柱式，但帶有一點分解感
            { t: 0, len: 2, notes: [0] },         // 根音長音
            { t: 0.5, len: 1.5, notes: [1, 2] },  // 和弦慢半拍進來
            { t: 2, len: 1, notes: [0] },         // 根音
            { t: 3, len: 1, notes: [1, 2] }       // 和弦
        ]},
        8: { name: "切分節奏 (Syncopated)", steps: [
            // 強調反拍，帶有律動感 (3-3-2 結構)
            { t: 0, len: 1.5, notes: [0, 1, 2] },  // 1.5拍
            { t: 1.5, len: 1.5, notes: [0, 1, 2] },// 1.5拍 (切分)
            { t: 3, len: 1, notes: [0, 1, 2] }     // 1拍
        ]},
        
        // --- 特殊風格 ---
        9: { name: "雷鬼/斯卡 (Reggae/Ska) - 反拍", steps: [
            // 只在反拍出聲 (嗯-恰-嗯-恰)
            { t: 0.5, len: 0.25, notes: [1, 2] }, 
            { t: 1.5, len: 0.25, notes: [1, 2] }, 
            { t: 2.5, len: 0.25, notes: [1, 2] }, 
            { t: 3.5, len: 0.25, notes: [1, 2] } 
        ]},
        10: { name: "放克 (Funk 16 Beat)", steps: [
            // 16分音符切分
            { t: 0, len: 0.25, notes: [0,1,2] },
            { t: 0.75, len: 0.25, notes: [1,2] }, // e & "a"
            { t: 1.5, len: 0.5, notes: [1,2] },   // &
            { t: 2.5, len: 0.25, notes: [1,2] },  // &
            { t: 3, len: 0.25, notes: [0,1,2] },  // 4
            { t: 3.5, len: 0.25, notes: [1,2] }   // &
        ]},
        11: { name: "華爾滋 (Waltz 3/4)", steps: [
            // 雖然是 4 拍定義，但在這裡模擬 3 拍子的重音 (重-輕-輕)
            { t: 0, len: 1, notes: [0] }, 
            { t: 1, len: 1, notes: [1, 2] }, 
            { t: 2, len: 1, notes: [1, 2] },
            { t: 3, len: 1, notes: [0] } // 第4拍填補(或留空)
        ]},
        12: { name: "急板 (Galop) - 騎馬節奏", steps: [
            // 噠噠-噠噠-噠噠-噠噠
            { t: 0, len: 0.5, notes: [0] }, { t: 0.5, len: 0.5, notes: [1, 2] },
            { t: 1, len: 0.5, notes: [0] }, { t: 1.5, len: 0.5, notes: [1, 2] },
            { t: 2, len: 0.5, notes: [0] }, { t: 2.5, len: 0.5, notes: [1, 2] },
            { t: 3, len: 0.5, notes: [0] }, { t: 3.5, len: 0.5, notes: [1, 2] }
        ]}
    };

    // 分解和弦類節奏 (Arpeggios) - 對應語法 :C
    // 分解和弦類節奏 (Arpeggios) - 對應語法 :C
    const RHYTHM_ARP = {
        // --- 基礎類 ---
        1: { name: "上行琶音 (1-3-5-3)", steps: [
            { t: 0, len: 1, notes: [0] }, { t: 1, len: 1, notes: [1] },
            { t: 2, len: 1, notes: [2] }, { t: 3, len: 1, notes: [1] }
        ]},
        2: { name: "流動 (16分)", steps: [
            { t: 0, len: 0.5, notes: [0] }, { t: 0.5, len: 0.5, notes: [2] }, 
            { t: 1, len: 0.5, notes: [1] }, { t: 1.5, len: 0.5, notes: [2] },
            { t: 2, len: 0.5, notes: [0] }, { t: 2.5, len: 0.5, notes: [2] }, 
            { t: 3, len: 0.5, notes: [1] }, { t: 3.5, len: 0.5, notes: [2] }
        ]},
        3: { name: "阿爾貝蒂 (古典)", steps: [
            { t: 0, len: 0.5, notes: [0] }, { t: 0.5, len: 0.5, notes: [2] }, 
            { t: 1, len: 0.5, notes: [1] }, { t: 1.5, len: 0.5, notes: [2] },
            { t: 2, len: 0.5, notes: [0] }, { t: 2.5, len: 0.5, notes: [2] }, 
            { t: 3, len: 0.5, notes: [1] }, { t: 3.5, len: 0.5, notes: [2] }
        ]},
        4: { name: "抒情分解 (慢)", steps: [
            { t: 0, len: 0.5, notes: [0] }, { t: 0.5, len: 0.5, notes: [2] },
            { t: 1, len: 1, notes: [1] }, 
            { t: 2, len: 0.5, notes: [0] }, { t: 2.5, len: 0.5, notes: [2] },
            { t: 3, len: 1, notes: [1] }
        ]},
        5: { name: "根五 (Bass)", steps: [
            { t: 0, len: 2, notes: [0] }, { t: 2, len: 2, notes: [2] }
        ]},

        // --- 鋼琴抒情系列 (Piano Ballad 12 Types) ---
        // 代碼表: -1=1.(低根), -2=5.(低五), -3=7.(低七)
        //         0=1(根), 9=2(九音), 1=3(三度), 2=5(五度), 3=7(七度)
        
        // 1./ 5./ 2/ 3 ( 3 -
        6: { name: "鋼琴抒情 1 (Add9)", steps: [
            { t: 0, len: 0.5, notes: [-1] },   // 1.
            { t: 0.5, len: 0.5, notes: [-2] }, // 5.
            { t: 1.0, len: 0.5, notes: [9] },  // 2 (九音)
            { t: 1.5, len: 2.5, notes: [1] }   // 3 (延音)
        ]},
        
        // 1./ 5./ 2/ 3/ 5 -
        7: { name: "鋼琴抒情 2 (Add9)", steps: [
            { t: 0, len: 0.5, notes: [-1] },   // 1.
            { t: 0.5, len: 0.5, notes: [-2] }, // 5.
            { t: 1.0, len: 0.5, notes: [9] },  // 2 (九音)
            { t: 1.5, len: 0.5, notes: [1] },  // 3
            { t: 2.0, len: 2.0, notes: [2] }   // 5
        ]},
        
        // 1./ 5./ 2/ 3/ 7 -
        8: { name: "鋼琴抒情 3 (Add9+7)", steps: [
            { t: 0, len: 0.5, notes: [-1] },   // 1.
            { t: 0.5, len: 0.5, notes: [-2] }, // 5.
            { t: 1.0, len: 0.5, notes: [9] },  // 2 (九音)
            { t: 1.5, len: 0.5, notes: [1] },  // 3
            { t: 2.0, len: 2.0, notes: [3] }   // 7
        ]},
        
        // 1./ 5./ 3/ 2 ( 2 -
        9: { name: "鋼琴抒情 4 (Sus2)", steps: [
            { t: 0, len: 0.5, notes: [-1] },   // 1.
            { t: 0.5, len: 0.5, notes: [-2] }, // 5.
            { t: 1.0, len: 0.5, notes: [1] },  // 3
            { t: 1.5, len: 2.5, notes: [9] }   // 2 (九音/Sus2)
        ]},
        
        // 1./ 5./ 1/ 2 ( 2 -
        10: { name: "鋼琴抒情 5 (Standard)", steps: [
            { t: 0, len: 0.5, notes: [-1] },   // 1.
            { t: 0.5, len: 0.5, notes: [-2] }, // 5.
            { t: 1.0, len: 0.5, notes: [0] },  // 1 (根)
            { t: 1.5, len: 2.5, notes: [9] }   // 2 (九音)
        ]},
        
        // 1./ 5./ 1/ 2/ 3 -
        11: { name: "鋼琴抒情 6", steps: [
            { t: 0, len: 0.5, notes: [-1] },   // 1.
            { t: 0.5, len: 0.5, notes: [-2] }, // 5.
            { t: 1.0, len: 0.5, notes: [0] },  // 1 (根)
            { t: 1.5, len: 0.5, notes: [9] },  // 2 (九音)
            { t: 2.0, len: 2.0, notes: [1] }   // 3
        ]},
        
        // 1./ 5./ 1/ 2/ 5 -
        12: { name: "鋼琴抒情 7", steps: [
            { t: 0, len: 0.5, notes: [-1] },   // 1.
            { t: 0.5, len: 0.5, notes: [-2] }, // 5.
            { t: 1.0, len: 0.5, notes: [0] },  // 1 (根)
            { t: 1.5, len: 0.5, notes: [9] },  // 2 (九音)
            { t: 2.0, len: 2.0, notes: [2] }   // 5
        ]},
        
        // 1./ 5./ 1/ 2/ 7 -
        13: { name: "鋼琴抒情 8", steps: [
            { t: 0, len: 0.5, notes: [-1] },   // 1.
            { t: 0.5, len: 0.5, notes: [-2] }, // 5.
            { t: 1.0, len: 0.5, notes: [0] },  // 1 (根)
            { t: 1.5, len: 0.5, notes: [9] },  // 2 (九音)
            { t: 2.0, len: 2.0, notes: [3] }   // 7
        ]},
        
        // 1./ 5./ 7./ 1 ( 1 -
        14: { name: "鋼琴抒情 9 (Bass Line)", steps: [
            { t: 0, len: 0.5, notes: [-1] },   // 1.
            { t: 0.5, len: 0.5, notes: [-2] }, // 5.
            { t: 1.0, len: 0.5, notes: [-3] }, // 7. (低七)
            { t: 1.5, len: 2.5, notes: [0] }   // 1 (根)
        ]},
        
        // 1./ 5./ 7./ 1 3 -
        15: { name: "鋼琴抒情 10 (Bass Line)", steps: [
            { t: 0, len: 0.5, notes: [-1] },   // 1.
            { t: 0.5, len: 0.5, notes: [-2] }, // 5.
            { t: 1.0, len: 0.5, notes: [-3] }, // 7. (低七)
            { t: 1.5, len: 0.5, notes: [0] },  // 1 (根)
            { t: 2.0, len: 2.0, notes: [1] }   // 3
        ]},
        
        // 1./ 5./ 7./ 1 5 -
        16: { name: "鋼琴抒情 11 (Bass Line)", steps: [
            { t: 0, len: 0.5, notes: [-1] },   // 1.
            { t: 0.5, len: 0.5, notes: [-2] }, // 5.
            { t: 1.0, len: 0.5, notes: [-3] }, // 7. (低七)
            { t: 1.5, len: 0.5, notes: [0] },  // 1 (根)
            { t: 2.0, len: 2.0, notes: [2] }   // 5
        ]},
        
        // 1./ 5./ 1/ 7. -
        17: { name: "鋼琴抒情 12 (Bass Turn)", steps: [
            { t: 0, len: 0.5, notes: [-1] },   // 1.
            { t: 0.5, len: 0.5, notes: [-2] }, // 5.
            { t: 1.0, len: 0.5, notes: [0] },  // 1 (根)
            { t: 1.5, len: 2.5, notes: [-3] }  // 7. (低七)
        ]}
    };

    const keys = [
        { char: '1', display: '1', type: 'num' }, { char: '2', display: '2', type: 'num' }, { char: '3', display: '3', type: 'num' },
        { char: '4', display: '4', type: 'num' }, { char: '5', display: '5', type: 'num' }, { char: '6', display: '6', type: 'num' },
        { char: '7', display: '7', type: 'num' }, { char: '0', display: '0', type: 'num' }, { char: ' ', display: '空', type: 'space' },
        { char: '-', display: '-', type: 'normal' }, { char: '/', display: '/', type: 'normal' }, { char: '.', display: '.', type: 'normal' },
        { char: ':', display: ':', type: 'normal' }, { char: '|', display: '|', type: 'normal' }, { char: '(', display: '(', type: 'normal' },
        { char: '#', display: '#', type: 'normal' }, { char: 'b', display: 'b', type: 'normal' }, { char: 'z', display: 'z', type: 'normal' },
        { char: 'backspace', display: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>', type: 'func' },
        { char: 'delete', display: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>', type: 'func' }
    ];

    const mappingData = [
        { font: "", code: ". " }, { font: "", code: "0 " }, { font: "", code: "1 " }, { font: "", code: "2 " },
        { font: "", code: "3 " }, { font: "", code: "4 " }, { font: "", code: "5 " }, { font: "", code: "6 " },
        { font: "", code: "7 " }, { font: "", code: "0/ " }, { font: "", code: "1/ " }, { font: "", code: "2/ " },
        { font: "", code: "3/ " }, { font: "", code: "4/ " }, { font: "", code: "5/ " }, { font: "", code: "6/ " },
        { font: "", code: "7/ " }, { font: "", code: "./ " }, { font: "", code: "0// " }, { font: "", code: "1// " },
        { font: "", code: "2// " }, { font: "", code: "3// " }, { font: "", code: "4// " }, { font: "", code: "5// " },
        { font: "", code: "6// " }, { font: "", code: "7// " }, { font: "", code: ".// " }, { font: "", code: "0/// " },
        { font: "", code: "1/// " }, { font: "", code: "2/// " }, { font: "", code: "3/// " }, { font: "", code: "4/// " },
        { font: "", code: "5/// " }, { font: "", code: "6/// " }, { font: "", code: "7/// " }, { font: "", code: "./// " },
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
        { font: "", code: "( " }, { font: "", code: "(. " }, { font: "", code: "2/2) " }, { font: "", code: "3/4) " },
        { font: "", code: "4/4) " }, { font: "", code: "| " }, { font: "", code: "|| " }, { font: "", code: "||| " },
        { font: "", code: "||: " }, { font: "", code: ":|| " },



		// 注意：程式碼中 "\\" 代表一個反斜線
        { font: "", code: "0\\ " }, { font: "", code: "1\\ " }, { font: "", code: "2\\ " }, 
        { font: "", code: "3\\ " }, { font: "", code: "4\\ " }, { font: "", code: "5\\ " }, 
        { font: "", code: "6\\ " }, { font: "", code: "7\\ " }, { font: "", code: ".\\ " },
        
        { font: "", code: "0\\\\ " }, { font: "", code: "1\\\\ " }, { font: "", code: "2\\\\ " }, 
        { font: "", code: "3\\\\ " }, { font: "", code: "4\\\\ " }, { font: "", code: "5\\\\ " }, 
        { font: "", code: "6\\\\ " }, { font: "", code: "7\\\\ " }, { font: "", code: ".\\\\ " },
        
        { font: "", code: "0\\\\\\ " }, { font: "", code: "1\\\\\\ " }, { font: "", code: "2\\\\\\ " }, 
        { font: "", code: "3\\\\\\ " }, { font: "", code: "4\\\\\\ " }, { font: "", code: "5\\\\\\ " }, 
        { font: "", code: "6\\\\\\ " }, { font: "", code: "7\\\\\\ " }, { font: "", code: ".\\\\\\ " },

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
    allPairs.sort((a, b) => b.code.length - a.code.length);
    allPairs.forEach(pair => {
        codeToFontRules.push({
            regex: new RegExp("(?<![a-zA-Z])" + escapeRegExp(pair.code), 'g'),
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
        // 如果沒有指定 targetCtx，就使用全域 audioCtx (一般播放用)
        const ctx = targetCtx || audioCtx;
        
        // 只有在「一般播放」且「已經載入過」時，才使用快取
        // 匯出時因為 Context 不同，必須重新建立實例 (瀏覽器會快取檔案，不用擔心流量)
        if (!targetCtx && loadedInstruments[instName]) {
            return loadedInstruments[instName];
        }
        
        if (typeof window.Soundfont === 'undefined') {
            // ... (原本的載入 Library 邏輯保持不變) ...
            await loadScript('https://cdn.jsdelivr.net/npm/soundfont-player@0.12.0/dist/soundfont-player.min.js');
        }

        try {
            // 確保有 Context
            if (!ctx && !targetCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // 使用指定的 ctx 載入樂器
            const inst = await window.Soundfont.instrument(ctx || audioCtx, instName);
            
            // 只有一般播放才存入全域快取
            if (!targetCtx) {
                loadedInstruments[instName] = inst;
            }
            return inst;
        } catch (e) {
            console.error("Soundfont load failed", e);
            throw e;
        }
    }

    function playTone(freq, startTime, duration, instVal, targetCtx, targetPlayer) {
        const ctx = targetCtx || audioCtx;
        
        // 如果是匯出模式，targetPlayer 會被傳入；否則使用全域 activeSoundfontInst
        // 但注意：節奏樂器在匯出時也需要正確的 Player 實例
        
        let volumeBoost = 1.0; 
        const targetInst = instVal || currentInstrument;

        if (targetInst === 'taiko_drum') { freq = 100; volumeBoost = 5.0; }
        else if (targetInst === 'synth_drum') { freq = 250; volumeBoost = 4.0; }
        else if (targetInst === 'tinkle_bell') { freq = 2000; volumeBoost = 6.0; }
        else if (targetInst === 'agogo') { freq = 600; volumeBoost = 4.0; }
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

                    // [關鍵修復]：如果是即時播放 (非匯出)，將聲音節點存入清單，以便可以被停止
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

                // [新增] 匯出時的和弦處理邏輯 (與 playMusic 同步)
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


function parseScore(text) {
        // ==========================================
        // 1. 預處理：流程管理 (Play Flow) 與 行讀取
        // ==========================================
        let lines = [];
        const flowMatch = text.match(/^\[\s*play\s*:\s*(.*?)\]/im);

        if (flowMatch) {
            const flowIds = flowMatch[1].trim().split(/\s+/); 
            const sectionMap = {};
            const sectionRegex = /\[([a-zA-Z0-9_-]+)\]\s*\{\s*([^}]*)\s*\}/g;
            let match;
            while ((match = sectionRegex.exec(text)) !== null) {
                const label = match[1];
                const content = match[2];
                const fullMatchStr = match[0];
                const contentStartOffset = match.index + fullMatchStr.indexOf(content);
                sectionMap[label] = { content: content, startOffset: contentStartOffset };
            }
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
                        lines.push({ text: lineContent, startIndex: section.startOffset + ptr });
                        ptr = endIdx + 1;
                    }
                    lines.push({ text: "", startIndex: -1 });
                }
            });
        } else {
            let ptr = 0;
            while (ptr < text.length) {
                 let endIdx = text.indexOf('\n', ptr);
                 if (endIdx === -1) endIdx = text.length;
                 let lineContent = text.substring(ptr, endIdx);
                 if (lineContent.endsWith('\r')) lineContent = lineContent.slice(0, -1);
                 lines.push({ text: lineContent, startIndex: ptr });
                 ptr = endIdx + 1; 
            }
        }

        // ==========================================
        // 2. 分組邏輯 (Grouping)
        // ==========================================
        const blocks = [];
        let currentSimulBlock = [];
        const labelRegex = /^([a-zA-Z0-9_-]+):\s*(.*)/;

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
        // 3. 解析音符 (Parsing)
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

                    // 1. 處理三連音括號 ( 與 )
                    let tempToken = cleanStr;
                    let hasGroupStart = false;
                    let hasGroupEnd = false;
                    let localInputOffset = 0;

                    if (tempToken.startsWith('(') && tempToken !== '(') { 
                        hasGroupStart = true;
                        tempToken = tempToken.substring(1);
                        localInputOffset = 1;
                    } else if (tempToken === '(') {
                        rawLineNotes.push({ 
                            type: 'groupStart',
                            play: false, duration: 0, visualDuration: 0,
                            inputStart: lineObj.startIndex + textOffsetInLine + inputIdx,
                            inputEnd: lineObj.startIndex + textOffsetInLine + inputIdx + 1
                        });
                        inputIdx += inputLen;
                        return;
                    }

                    if (tempToken.endsWith(')') && tempToken !== ')') {
                        hasGroupEnd = true;
                        tempToken = tempToken.slice(0, -1);
                    } else if (tempToken === ')') {
                        rawLineNotes.push({ 
                            type: 'groupEnd',
                            play: false, duration: 0, visualDuration: 0,
                            inputStart: lineObj.startIndex + textOffsetInLine + inputIdx,
                            inputEnd: lineObj.startIndex + textOffsetInLine + inputIdx + 1
                        });
                        inputIdx += inputLen;
                        return;
                    }

                    if (hasGroupStart) {
                        rawLineNotes.push({ 
                            type: 'groupStart',
                            play: false, duration: 0, visualDuration: 0,
                            inputStart: lineObj.startIndex + textOffsetInLine + inputIdx,
                            inputEnd: lineObj.startIndex + textOffsetInLine + inputIdx + 1
                        });
                    }

                    if (cleanStr === '||:') { rawLineNotes.push({ type: 'repeatStart' }); inputIdx += inputLen; return; }
                    if (cleanStr === ':||') { rawLineNotes.push({ type: 'repeatEnd' }); inputIdx += inputLen; return; }

                    const absoluteStart = lineObj.startIndex + textOffsetInLine + inputIdx + localInputOffset;
                    const absoluteEnd = absoluteStart + tempToken.length;

                    let note = {
                        token: tempToken,
                        freq: 0,
                        chordFreqs: null,
                        chordInfo: null,
                        rhythmId: 1,    
                        rhythmType: '', 
                        duration: 1,
                        inputStart: absoluteStart,
                        inputEnd: absoluteEnd,
                        isRest: false,
                        isExtension: tempToken === '-',
                        isTieStart: tempToken.includes('('), 
                        play: true,
                        visualDuration: 1,
                        type: 'note',
                        instrument: currentLineInstrument,
                        startTime: 0, 
                        isMainTrack: (lineIndex === 0) 
                    };

                    let isChordParsed = false;
                    let prefixChar = '';

                    if (tempToken.startsWith('.') || tempToken.startsWith(':')) {
                        prefixChar = tempToken[0];
                        let rawContent = tempToken.substring(1).replace(/[\/\(\\]/g, '');
                        let rhythmMatch = rawContent.match(/^(\d+)/);
                        let chordNamePart = rawContent;
                        let rhythmIdTemp = 1;

                        if (rhythmMatch) {
                            rhythmIdTemp = parseInt(rhythmMatch[1]);
                            chordNamePart = rawContent.substring(rhythmMatch[0].length);
                        }

                        if (chordNamePart.length > 0) {
                            const sortedRoots = Object.keys(CHORD_ROOTS).sort((a, b) => b.length - a.length);
                            let rootVal = -1;
                            let quality = "";
                            for (let r of sortedRoots) {
                                if (chordNamePart.startsWith(r)) {
                                    rootVal = CHORD_ROOTS[r];
                                    quality = chordNamePart.substring(r.length);
                                    break;
                                }
                            }
                            if (rootVal !== -1) {
                                isChordParsed = true;
                                note.type = 'chord';
                                note.rhythmId = rhythmIdTemp;
                                if (prefixChar === '.') note.rhythmType = 'block'; 
                                else if (prefixChar === ':') note.rhythmType = 'arp'; 

                                let slashMatch = tempToken.match(/[\/\\]+/); 
                                if (slashMatch) {
                                    note.duration = 1 / Math.pow(2, slashMatch[0].length);
                                }
                                note.chordInfo = { root: rootVal, quality: quality };
                                note.chordFreqs = [];
                                const intervals = CHORD_QUALITIES[quality] || [0, 4, 7];
                                const baseC4 = 261.63;
                                intervals.forEach(interval => {
                                    const semitone = rootVal + interval;
                                    const freq = baseC4 * Math.pow(2, semitone / 12);
                                    note.chordFreqs.push(freq);
                                });
                            }
                        }
                    }

                    if (isChordParsed) {
                        // Done
                    } 
                    else if (tempToken.startsWith('.') && !/\d/.test(tempToken)) {
                        note.type = 'dotted';
                        note.play = false; 
                        note.duration = 0; 
                    }
                    else if ((token.match(/^[a-zA-Z]/) && !['b','z'].includes(tempToken)) || tempToken.includes('|') || (tempToken.includes(')') && !hasGroupEnd) || tempToken === ':') {
                        if (tempToken === ':' && token.length === 1) { /* ignore */ }
                    } 
                    else if (tempToken === 'b') { pendingAccidental = -1; }
                    else if (tempToken === '#') { pendingAccidental = 1; }
                    else if (tempToken === 'z') { pendingAccidental = 0; }
                    else if (note.isExtension || note.isTieStart) {
                        if (note.isExtension) {
                            note.play = false; note.duration = 1;
                        }
                        note.visualDuration = note.duration;
                    } 
                    else {
                        const cleanToken = tempToken.replace(/[\(\/\\]/g, '').trim(); 
                        const numMatch = cleanToken.match(/[0-7]/);
                        if (numMatch) {
                            const num = numMatch[0];
                            if (num === '0') {
                                note.isRest = true;
                                pendingAccidental = 0;
                            } else {
                                let freq = relFreqs[num];
                                const prefix = cleanToken.substring(0, numMatch.index);
                                const suffix = cleanToken.substring(numMatch.index + 1);

                                if (pendingAccidental === -1) freq *= Math.pow(2, -1/12);
                                if (pendingAccidental === 1) freq *= Math.pow(2, 1/12);
                                pendingAccidental = 0;

                                if (prefix.includes('b')) freq *= Math.pow(2, -1/12);
                                if (prefix.includes('#')) freq *= Math.pow(2, 1/12);
                                if (prefix.includes(':')) freq *= 4;
                                else if (prefix.includes('.')) freq *= 2;
                                if (suffix.includes(':')) freq /= 4;
                                else if (suffix.includes('.')) freq /= 2;

                                note.freq = freq;
                            }
                        }
                        const slashCount = (tempToken.match(/[\/\\]/g) || []).length;
                        if (slashCount > 0) note.duration = 1 / Math.pow(2, slashCount);
                    }

                    if (note.freq > 0 || note.isRest || note.isExtension || note.isTieStart || note.type === 'chord' || note.type === 'dotted') {
                        note.visualDuration = note.duration; 
                        rawLineNotes.push(note);
                    }

                    if (hasGroupEnd) {
                        rawLineNotes.push({ 
                            type: 'groupEnd',
                            play: false, duration: 0, visualDuration: 0,
                            inputStart: lineObj.startIndex + textOffsetInLine + inputIdx + inputLen - 1,
                            inputEnd: lineObj.startIndex + textOffsetInLine + inputIdx + inputLen
                        });
                    }
                    
                    inputIdx += inputLen;
                });

                // Unroll Repeats
                let expandedNotes = [];
                let repeatStartIdx = 0;
                for (let i = 0; i < rawLineNotes.length; i++) {
                    const item = rawLineNotes[i];
                    if (item.type === 'repeatStart') {
                        repeatStartIdx = expandedNotes.length;
                    } else if (item.type === 'repeatEnd') {
                        const section = expandedNotes.slice(repeatStartIdx);
                        section.forEach(n => expandedNotes.push(Object.assign({}, n)));
                        repeatStartIdx = expandedNotes.length;
                    } else {
                        expandedNotes.push(item);
                    }
                }
                let processedLineNotesRaw = expandedNotes;

                // ===============================================
                // 三連音 (Tuplet) 邏輯處理
                // ===============================================
                for (let i = 0; i < processedLineNotesRaw.length; i++) {
                    if (processedLineNotesRaw[i].type === 'groupStart') {
                        let endIndex = -1;
                        for (let j = i + 1; j < processedLineNotesRaw.length; j++) {
                            if (processedLineNotesRaw[j].type === 'groupEnd') {
                                endIndex = j;
                                break;
                            }
                            if (processedLineNotesRaw[j].type === 'groupStart') break;
                        }

                        if (endIndex !== -1) {
                            const scaleFactor = 2 / 3;
                            for (let k = i + 1; k < endIndex; k++) {
                                let n = processedLineNotesRaw[k];
                                if (n.type === 'note' || n.type === 'chord' || n.isRest || n.isExtension) {
                                    n.duration *= scaleFactor;
                                    n.visualDuration *= scaleFactor;
                                }
                            }
                            processedLineNotesRaw[i].play = false;
                            processedLineNotesRaw[endIndex].play = false;
                        } else {
                            processedLineNotesRaw[i].type = 'tie';
                        }
                    }
                }

                // Tie & Extension logic & Dotted Logic
                let processedLineNotes = [];
                const findLastPlayable = (list) => {
                    for (let k = list.length - 1; k >= 0; k--) {
                        let p = list[k];
                        if (p.play && !p.isRest && (p.type === 'note' || p.type === 'chord')) return p;
                    }
                    return null;
                };

                for (let i = 0; i < processedLineNotesRaw.length; i++) {
                    let curr = processedLineNotesRaw[i];
                    
                    if (curr.type === 'groupStart' || curr.type === 'groupEnd') continue;

                    // 1. [修正] 處理延音線 (-)
                    if (curr.isExtension) {
                        let prev = findLastPlayable(processedLineNotes);
                        if (prev) {
                            // 這裡只加 curr.duration
                            // 如果是普通延音，curr.duration 為 1
                            // 如果在三連音內，curr.duration 已被縮放為 0.66
                            prev.duration += curr.duration;
                        }
                        
                        curr.play = false;
                        processedLineNotes.push(curr);
                        continue;
                    }

                    // 2. 處理獨立附點 (Dotted)
                    if (curr.type === 'dotted') {
                        let prev = findLastPlayable(processedLineNotes);
                        if (prev) {
                            const addedDuration = prev.duration * 0.5;
                            prev.duration += addedDuration;
                            curr.visualDuration = addedDuration;
                        } else {
                            curr.visualDuration = 0;
                        }
                        curr.play = false; 
                        processedLineNotes.push(curr);
                        continue;
                    }

                    // 3. 處理獨立連結線 (Tie)
                    if (curr.type === 'tie') {
                        let prev = findLastPlayable(processedLineNotes);
                        let nextIndex = -1;
                        for (let k = i + 1; k < processedLineNotesRaw.length; k++) {
                            let n = processedLineNotesRaw[k];
                            if (!n.isExtension && n.type !== 'tie' && n.type !== 'dotted' && !n.isRest && n.type !== 'groupEnd') {
                                nextIndex = k;
                                break;
                            }
                        }
                        if (prev && nextIndex !== -1) {
                            let next = processedLineNotesRaw[nextIndex];
                            let match = false;
                            if (prev.type === 'chord' && next.type === 'chord') {
                                if (prev.chordInfo && next.chordInfo) {
                                    match = (prev.chordInfo.root === next.chordInfo.root) && 
                                            (prev.chordInfo.quality === next.chordInfo.quality);
                                } else {
                                    match = JSON.stringify(prev.chordFreqs) === JSON.stringify(next.chordFreqs);
                                }
                            } else if (prev.type === 'note' && next.type === 'note') {
                                match = Math.abs(prev.freq - next.freq) < 0.1;
                            }
                            if (match) {
                                prev.duration += next.duration;
                                next.play = false;
                            }
                        }
                        continue;
                    }

                    // 4. 處理附著連結線
                    if (curr.isTieStart) {
                        let nextIndex = -1;
                        for (let k = i + 1; k < processedLineNotesRaw.length; k++) {
                            let n = processedLineNotesRaw[k];
                            if (!n.isExtension && n.type !== 'tie' && n.type !== 'dotted' && !n.isRest && n.type !== 'groupEnd') {
                                nextIndex = k;
                                break;
                            }
                        }
                        if (nextIndex !== -1) {
                            let next = processedLineNotesRaw[nextIndex];
                            let match = false;
                            if (curr.type === 'chord' && next.type === 'chord') {
                                if (curr.chordInfo && next.chordInfo) {
                                    match = (curr.chordInfo.root === next.chordInfo.root) && 
                                            (curr.chordInfo.quality === next.chordInfo.quality);
                                } else {
                                    match = JSON.stringify(curr.chordFreqs) === JSON.stringify(next.chordFreqs);
                                }
                            } else if (curr.type === 'note' && next.type === 'note') {
                                match = Math.abs(curr.freq - next.freq) < 0.1;
                            }
                            if (match) {
                                curr.duration += next.duration;
                                next.play = false;
                            }
                        }
                    }
                    processedLineNotes.push(curr);
                }

                // C. 計算絕對時間
                let lineTime = 0;
                processedLineNotes.forEach(note => {
                    note.startTime = globalTimeOffset + lineTime;
                    lineTime += note.visualDuration; 
                    allNotes.push(note);
                });

                if (lineTime > blockMaxDuration) blockMaxDuration = lineTime;
            });

            globalTimeOffset += blockMaxDuration;
        });

        return allNotes;
    }

    async function playMusic() {
        stopMusic();
        await initAudio();
        updatePlayButtonUI('loading');
        
        const notes = parseScore(codeInput.value);
        if (notes.length === 0) { isPlaying = false; updatePlayButtonUI('stop'); return; }

        const selStart = codeInput.selectionStart;
        const selEnd = codeInput.selectionEnd;
        const isRangeSelection = (selEnd - selStart) > 0;
        let notesToPlay = [];
        let timeOffset = 0;
        lastPlayedNoteStart = -1;

        if (isRangeSelection) {
            savedSelection = { start: selStart, end: selEnd };
            notesToPlay = notes.filter(n => n.inputStart >= selStart && n.inputEnd <= selEnd);
            if (notesToPlay.length > 0) timeOffset = Math.min(...notesToPlay.map(n => n.startTime));
        } else {
            savedSelection = null;
            const sortedByText = [...notes].sort((a, b) => a.inputStart - b.inputStart);
            let targetNote = sortedByText.find(n => n.inputEnd > selStart);
            if (targetNote) {
                const startBeat = targetNote.startTime;
                timeOffset = startBeat;
                notesToPlay = notes.filter(n => n.startTime >= startBeat);
            } else { notesToPlay = notes; timeOffset = 0; }
        }

        if (notesToPlay.length === 0) { isPlaying = false; updatePlayButtonUI('stop'); return; }

        const usedInstruments = [...new Set(notesToPlay.map(n => n.instrument))];
        try {
            await Promise.all(usedInstruments.map(async (instVal) => {
                const instDef = instruments.find(i => i.val === instVal);
                if (instDef && instDef.type === 'soundfont') await loadInstrument(instVal);
            }));
        } catch (e) { console.error("Instrument load error", e); }
        
        isPlaying = true;
        updatePlayButtonUI('play');

        const tempo = parseInt(tempoInput.value) || 100;
        const beatTime = 60 / tempo;
        const totalShift = currentBaseKey + currentTranspose;
        const pitchFactor = Math.pow(2, totalShift / 12);
        const now = audioCtx.currentTime + 0.1;
        let endTime = 0;
        let finalNoteEndPos = 0;

        notesToPlay.forEach((note) => {
            if (note.inputEnd > finalNoteEndPos) finalNoteEndPos = note.inputEnd;
            if (!note.play) return; 

            const noteStartTime = now + (note.startTime - timeOffset) * beatTime;
            const noteTotalDuration = note.duration * beatTime;

            if (noteStartTime < now) return; 
            if (note.isRest) return;
            
            // [修改] 和弦播放邏輯：區分 Block 與 Arp
            // [修改] 和弦播放邏輯：區分 Block 與 Arp，並支援特殊音程 (9th, Low Bass)
            if (note.type === 'chord' && note.chordFreqs) {
                let patternLib = RHYTHM_BLOCK; 
                if (note.rhythmType === 'arp') patternLib = RHYTHM_ARP; 

                const pattern = patternLib[note.rhythmId] || patternLib[1];
                const patternLen = 4; 
                
                // 輔助：計算特殊音程頻率
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
                                if (f > 0) playTone(f * pitchFactor, absTime, absDur, note.instrument);
                            });
                        }
                    });
                }
            }
            else if (note.freq > 0) {
                const finalFreq = note.freq * pitchFactor;
                playTone(finalFreq, noteStartTime, noteTotalDuration, note.instrument);
            } else {
                return; 
            }

            if (noteStartTime + noteTotalDuration > endTime) endTime = noteStartTime + noteTotalDuration;

            if (note.isMainTrack) {
                const timer = setTimeout(() => {
                    if (!isPlaying) return;
                    lastPlayedNoteStart = note.inputStart;
                    highlightInput(note.inputStart, note.inputEnd);
                }, (noteStartTime - audioCtx.currentTime) * 1000);
                activeTimers.push(timer);
            }
        });

        const endTimer = setTimeout(() => {
            lastPlayedNoteStart = -1; 
            stopMusic(); 
            if (!isRangeSelection && finalNoteEndPos > 0) {
                const rawText = codeInput.value;
                let targetPos = finalNoteEndPos;
                while (targetPos < rawText.length && /[ \t]/.test(rawText[targetPos])) {
                    targetPos++;
                }
                codeInput.setSelectionRange(targetPos, targetPos);
                codeInput.focus();
            }
        }, (endTime - audioCtx.currentTime) * 1000 + 500);
        activeTimers.push(endTimer);
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

    function stopMusic() {
        isPlaying = false;
        updatePlayButtonUI('stop');
        
        if (activeSoundfontInst) activeSoundfontInst.stop();
        activeOscillators.forEach(o => o.stop());
        activeOscillators = [];
        activeTimers.forEach(t => clearTimeout(t));
        activeTimers = [];
        
        if (savedSelection) {
            codeInput.setSelectionRange(savedSelection.start, savedSelection.end);
            codeInput.focus();
            savedSelection = null; 
        }
        else if (lastPlayedNoteStart !== -1) {
            codeInput.setSelectionRange(lastPlayedNoteStart, lastPlayedNoteStart);
            codeInput.focus();
            lastPlayedNoteStart = -1; // 使用後重置
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

    function convertCodeToFont(input) {
        if (!input) return "";
        let result = input;
        const hwLookahead = "(?=[0-7.:]*\\\\[0-7.:\\\\]*)";

        result = result.replace(new RegExp("b " + hwLookahead, "g"), "");
        result = result.replace(new RegExp("# " + hwLookahead, "g"), "");
        result = result.replace(new RegExp("\\( " + hwLookahead, "g"), "");

        // 執行原本的通用規則 (處理剩下的 b, #, (, 以及其他所有音符)
        for (const rule of codeToFontRules) {
            result = result.replace(rule.regex, rule.replacement);
        }
        return result;
    }
    function convertFontToCode(input) {
        if (!input) return "";
        let result = input;
        result = result.replace(//g, "b "); // 特殊降記號 -> b
        result = result.replace(//g, "# "); // 特殊升記號 -> #
        result = result.replace(//g, "( "); // 特殊連音線 -> (

        // 執行原本的通用規則
        for (const rule of fontToCodeRules) {
            result = result.replace(rule.regex, rule.replacement);
        }
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
    // Final Init
    createKeys();
    loadData();
    renderAll();
});