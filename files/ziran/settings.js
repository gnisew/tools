        // ========================================
        // 🔧 測驗設定區
        // ========================================
        
        // 測驗識別碼 (用於區分不同測驗的儲存資料)
		const QUIZ_ID = "nature_science_quiz_json_v1";

        // 網頁標題
        document.title ="自然烏衣行";
		
		// 網頁圖示
		const QUIZ_EMOJI = "🐛";
		
        // 內部標題
        const QUIZ_TITLE = "自然";

        // 測驗代碼 (必須輸入此代碼才會傳送分數)
        const QUIZ_CODE = "6962164";
        
        // Google表單設定
        const GOOGLE_FORM_CONFIG = {
            formUrl: "https://docs.google.com/forms/d/e/1FAIpQLSeRIREnnXzmKngg4r54DoPkn8NVhZr3PDwMyrAPdLnFMXOhFg/formResponse",
            nameField: "entry.287735125",    // 姓名
            classField: "entry.1894453414",  // 班號
            scoreField: "entry.774071075",   // 成績
           // quizCodeField: "entry.123456789"  【新增】測驗代碼欄位ID (請替換為您自己的表單欄位ID)
        };
        
        // 管理碼
        const ADMIN_PASSWORD = "kasu";
        
        // Google表單傳送開關 (true: 傳送, false: 不傳送)
        const ENABLE_GOOGLE_FORM_SUBMIT = true;

		// 是否允許跳題作答 (true: 允許自由點選題號, false: 嚴格順序且不可回頭)
        const ALLOW_SKIP_QUESTIONS = false;
        
        // 字體大小設定 (五級)
        const FONT_SIZES = [22, 24, 26, 28, 30];
        const DEFAULT_FONT_SIZE_INDEX = 1; // 預設使用第二級
		const DEFAULT_ZHUYIN_MODE = true; // 注音 (true: 開啟, false: 關閉)
        
        // 歷史紀錄過期設定 (6月30日前的紀錄會被清除)
        const HISTORY_CUTOFF_MONTH = 5; // 6月 (月份從0開始)
        const HISTORY_CUTOFF_DAY = 30;


