const router = {
    // 定義所有頁面的標題設定
    config: {
        'home': { title: '🥷烏衣行-月亮觀測實驗室' },
        'phase': { title: '實驗一：月相觀測' },
        'position': { title: '實驗二：軌跡觀測' },
		'altitude': { title: '實驗三：高度角觀測' },
		'eclipse': { title: '實驗四：日月食模擬' },
		'lunar-eclipse': { title: '實驗五：月蝕成因觀測' },
		'altitude-tool': { title: '實驗六：高度角觀測器' },
        // 未來新增： 'distance': { title: '實驗三：地月距離' }
    },

    get params() {
        return new URLSearchParams(window.location.search);
    },
    
    init() {
        const exp = this.params.get('exp') || 'home';
        // 第一次載入不需 pushState，但需要執行 UI 切換與參數檢查
        this.navigate(exp, false);
        
        window.onpopstate = () => {
            const currentExp = new URLSearchParams(window.location.search).get('exp') || 'home';
            this.navigate(currentExp, false);
        };
    },

    navigate(exp, pushState = true) {
        // 防呆：如果網址打錯 (例如 ?exp=xyz)，導回 home
        if (!this.config[exp]) exp = 'home';

        // 1. 處理網址參數 (核心修改)
        if (pushState) {
            if (exp === 'home') {
                // 若回首頁：清洗所有參數，只留 ?exp=home
                const cleanParams = new URLSearchParams();
                cleanParams.set('exp', 'home');
                const newUrl = window.location.pathname + '?' + cleanParams.toString();
                history.pushState(null, '', newUrl);
            } else {
                // 若進實驗：僅設定 ?exp=xxx，後續由各實驗的 init() 負責補上 date 等參數
                // 這樣可以確保每次從首頁進去都是「乾淨的預設狀態」
                const expParams = new URLSearchParams();
                expParams.set('exp', exp);
                const newUrl = window.location.pathname + '?' + expParams.toString();
                history.pushState(null, '', newUrl);
            }
        }

        // 2. 切換中間的內容視圖
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`view-${exp}`)?.classList.add('active');
        
        // 3. 更新導覽列 UI (標題 & 返回按鈕)
        this.updateNavUI(exp);

        // 4. 初始化各別實驗
        if (exp === 'phase') {
            // 如果是從首頁點進來，exp1.init 會讀取現在網址參數
            // 因為上面我們把它清乾淨了，所以 exp1 會自動用「今天」作為預設值，符合預期
            if (typeof exp1 !== 'undefined') exp1.init(); 
        }
        if (exp === 'position') {
            if (typeof exp2 !== 'undefined') exp2.init();
        }
		if (exp === 'altitude') {
			if (typeof exp3 !== 'undefined') exp3.init();
		}
		if (exp === 'eclipse') {
			if (typeof exp4 !== 'undefined') exp4.init();
		}
		if (exp === 'lunar-eclipse') {
			if (typeof exp5 !== 'undefined') exp5.init();
		}
		if (exp === 'altitude-tool') {
			if (typeof exp6 !== 'undefined') exp6.init();
		}
    },

    updateNavUI(exp) {
        const titleEl = document.getElementById('nav-title');
        const backBtn = document.getElementById('btn-back-home');
        
        // 設定標題
        titleEl.textContent = this.config[exp].title;

        // 控制返回按鈕顯示
        if (exp === 'home') {
            backBtn.classList.remove('visible');
        } else {
            backBtn.classList.add('visible');
        }
    },

    // 這是給各實驗內部使用的 (例如切換日期時更新 URL)
    updateURL(newParams) {
        // 取得目前的參數
        const currentParams = this.params;
        
        // 合併新參數
        for (let key in newParams) {
            if (newParams[key] !== null && newParams[key] !== undefined && newParams[key] !== '') {
                currentParams.set(key, newParams[key]);
            } else {
                // 如果傳入 null/empty 字串，則移除該參數 (保持網址乾淨)
                currentParams.delete(key);
            }
        }
        
        const newUrl = window.location.pathname + '?' + currentParams.toString();
        history.pushState(null, '', newUrl);
    }
};

window.onload = () => router.init();
