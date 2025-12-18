const router = {
    params: new URLSearchParams(window.location.search),
    
    init() {
        const exp = this.params.get('exp') || 'phase';
        this.navigate(exp, false);
        
        // 監聽返回鍵
        window.onpopstate = () => location.reload();
    },

    navigate(exp, pushState = true) {
        // 切換 UI
        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`view-${exp}`).classList.add('active');
        
        // 更新按鈕樣式
        document.querySelectorAll('.nav-links button').forEach(b => b.classList.remove('active'));
        document.getElementById(`nav-${exp}`).classList.add('active');

        if (pushState) {
            this.updateURL({ exp: exp });
        }

        // 初始化各別實驗
        if (exp === 'phase') exp1.init();
        if (exp === 'position') exp2.init();
    },

    updateURL(newParams) {
        for (let key in newParams) {
            this.params.set(key, newParams[key]);
        }
        const newRelativePathQuery = window.location.pathname + '?' + this.params.toString();
        history.pushState(null, '', newRelativePathQuery);
    }
};

window.onload = () => router.init();