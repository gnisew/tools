        // ========================================
        // 🔧 測驗設定區
        // ========================================
        
        // 測驗識別碼 (用於區分不同測驗的儲存資料)
		const QUIZ_ID = "nature_science_quiz_json_v1";

        // 網頁標題
        document.title ="自然烏衣行";
		
		// 網頁圖示
		const QUIZ_EMOJI = "🐛";
		const QUIZ_HEADER_ICON = "🧪";
		
        // 內部標題
        const QUIZ_TITLE = "🥷烏衣行 - 自然而然";

        // 測驗代碼 (必須輸入此代碼才會傳送分數)
        const QUIZ_CODE = "6962164";
        
        // Google表單設定
        const GOOGLE_FORM_CONFIG = {
            formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeRIREnnXzmKngg4r54DoPkn8NVhZr3PDwMyrAPdLnFMXOhFg/formResponse",
            nameField: "entry.287735125",    // 姓名            
			scoreField: "entry.1894453414",   // 成績
			classField: "entry.774071075",  // 班號
			idField: "entry.1692942949",   // id            		
			wrongField: "entry.1649280184",   // 錯題
			titleField: "entry.1837856764",   // 課名	
           // quizCodeField: "entry.123456789"  【新增】測驗代碼欄位ID (請替換為您自己的表單欄位ID)
        };





        
        // 管理碼
        const ADMIN_PASSWORD = "kasu";
        
        // Google表單傳送開關 (true: 傳送, false: 不傳送)
        const ENABLE_GOOGLE_FORM_SUBMIT = true;

        // ========================================
        // 🔒 成績驗證 API（防止分數被瀏覽器端偽造）
        // ========================================
        // 部署好 Google Apps Script 網頁應用程式後，把「網頁應用程式網址」貼在這裡（雙引號中間）。
        // 部署方式請見「Apps Script 部署說明」。
        // 這裡若留空字串 ""：會自動退回舊的 Google表單直接傳送方式（分數不會被伺服器驗證，僅供過渡期使用）。
        const SCORE_API_URL = "";

		// 是否允許跳題作答 (true: 允許自由點選題號, false: 嚴格順序且不可回頭)
        const ALLOW_SKIP_QUESTIONS = false;
        
        // 字體大小設定 (五級)
        const FONT_SIZES = [22, 24, 26, 28, 30];
        const DEFAULT_FONT_SIZE_INDEX = 1; // 預設使用第二級
		const DEFAULT_ZHUYIN_MODE = true; // 注音 (true: 開啟, false: 關閉)
        
        // 歷史紀錄過期設定 (6月30日前的紀錄會被清除)
        const HISTORY_CUTOFF_MONTH = 5; // 6月 (月份從0開始)
        const HISTORY_CUTOFF_DAY = 30;

        // 間隔複習設定 (只在「練習模式」生效，測驗模式不受影響)
        // 開啟後，若學生上次練習某課程時有錯題，超過間隔天數後再次練習該課程，
        // 會在題目最後自動附加這些錯題讓學生複習——這些複習題不計分、不影響成績、也不會送出
        const ENABLE_SPACED_REVIEW = true;
        const SPACED_REVIEW_DAYS = 3;        // 至少間隔幾天才會出現複習題
        const MAX_SPACED_REVIEW_QUESTIONS = 5; // 一次最多附加幾題複習題

        // ========================================
        // 🙂 小助手提示功能設定（只在練習模式出現，測驗模式不會顯示）
        // ========================================
        const ENABLE_HINT_MASCOT = true;   // 總開關
        const HINT_TOKENS_PER_SESSION = 3; // 每次開始測驗/複習時，小助手預設有幾點提示額度

        // ========================================
        // 🌟 積分系統設定
        // 只有「測驗模式」（不是練習模式）交卷後才會依分數給積分
        // ========================================
        const ENABLE_POINTS_SYSTEM = true;
        // 分數門檻與對應積分，由高到低寫，第一個符合的門檻就套用
        const SCORE_POINTS_RULES = [
            { minScore: 100, points: 3 },
            { minScore: 90,  points: 2 },
            { minScore: 80,  points: 1 }
        ];
        const AVATAR_UNLOCK_COST = 3; // 兌換一個頭像需要幾點積分
        const DEFAULT_AVATAR = '🐛'; // 大家一開始預設、永遠免費的頭像


