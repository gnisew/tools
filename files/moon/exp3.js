/**
 * 實驗三：高度角觀測核心邏輯
 * 修正：零維點對齊技術，確保 Emoji 絕對鎖定圓心
 */
const exp3 = {
    state: {
		centerEmojis: ['🪅','🔭','🐈','🦄','🐗','🐐','🐫','🦙','🦣','🐇','🐿️','🐓','🐔', 
		  '👩‍🚀','🐤','🐦','🦤','🦩','🦜','🐲','🦖','🐛','👀','🤺','🌈','💩'],		
        currentEmoji: '👀'
    },


    el: {
        date: document.getElementById('datePicker3'),
        time: document.getElementById('altTimeSlider'),
        timeLabel: document.getElementById('altTimeLabel'),
        displayMain: document.getElementById('displayDate3'),
        displaySub: document.getElementById('displayLunar3'),
        box: document.getElementById('altitudeObserver'),
        svg: document.getElementById('protractorSvg'),
        moon: document.getElementById('obsMoon'),
        centerIcon: document.getElementById('obsCenterIcon'),
        altVal: document.getElementById('altAngleVal'),
        sideVal: document.getElementById('altSideVal')
    },

    // 核心座標：與 CSS 的 transform-origin 保持絕對一致 (300, 340)
    CENTER_X: 300, 
    CENTER_Y: 340,   
    RADIUS: 235,     // 修正半徑以防止數字裁切
    MOON_ORBIT_RADIUS: 300, 

    init() {
        this.el.svg.setAttribute('viewBox', '0 0 600 400');
        // 設定中心點位置
        this.el.centerIcon.style.left = `${this.CENTER_X}px`;
        this.el.centerIcon.style.top = `${this.CENTER_Y}px`;

        this.drawProtractor();
        
        this.el.date.onchange = () => { this.calculateData(true); this.update(); };
        this.el.time.oninput = () => this.update();
        this.el.centerIcon.onclick = () => this.randomizeCenterIcon();
        
        const initDate = router.params.get('date') || new Date().toISOString().split('T')[0];
        this.el.date.value = initDate;
        
        this.calculateData(true);
        this.update();
    },

    randomizeCenterIcon() {
        const list = this.state.centerEmojis;
        this.state.currentEmoji = list[Math.floor(Math.random() * list.length)];
        this.el.centerIcon.textContent = this.state.currentEmoji;
    },

    drawProtractor() {
        let html = '';
        
        // 1. 繪製刻度線
        for (let a = 0; a <= 90; a += 10) {
            const rad = a * (Math.PI / 180);
            const x2 = this.CENTER_X + Math.cos(rad) * this.RADIUS;
            const y2 = this.CENTER_Y - Math.sin(rad) * this.RADIUS;
            
            html += `<line x1="${this.CENTER_X}" y1="${this.CENTER_Y}" x2="${x2}" y2="${y2}" 
                      stroke="rgba(255,255,255,0.3)" stroke-width="1" />`;
            
            // 刻度數字：微調半徑避免裁切
            const textR = this.RADIUS + 25;
            const tx = this.CENTER_X + Math.cos(rad) * textR;
            const ty = this.CENTER_Y - Math.sin(rad) * textR;
            html += `<text x="${tx}" y="${ty}" class="protractor-text" 
                      text-anchor="middle" dominant-baseline="middle">${a}°</text>`;
        }

        // 2. 文字標註
        html += `<text x="${this.CENTER_X}" y="${this.CENTER_Y - this.RADIUS - 50}" class="guide-text" text-anchor="middle">天頂 (90°)</text>`;
        // 地平線文字內縮，確保 600px 寬度不切掉
        html += `<text x="${this.CENTER_X + this.RADIUS - 20}" y="${this.CENTER_Y + 25}" class="guide-text" text-anchor="end">地平線</text>`;
        
        // 3. 地平基準線
        html += `<line x1="${this.CENTER_X - this.RADIUS - 10}" y1="${this.CENTER_Y}" x2="${this.CENTER_X + this.RADIUS + 10}" y2="${this.CENTER_Y}" stroke="rgba(255,255,255,0.5)" stroke-width="1" />`;

        this.el.svg.innerHTML = html;
    },

    calculateData(resetToCenter = false) {
        const date = new Date(this.el.date.value);
        const dateInfo = getExtendedDate(date);
        this.el.displayMain.textContent = dateInfo.fullGregorian;
        this.el.displaySub.textContent = dateInfo.lunar;

        const moon = getMoonData(date);
        let rise = (6 + (moon.age * 0.83)) % 24;
        this.currentData = { riseTime: rise, duration: 12.2 };
        
        this.el.time.max = this.currentData.duration;
        this.el.time.step = 0.01;
        
        if (resetToCenter) this.el.time.value = this.currentData.duration / 5;
    },

    stepTime(mins) {
        let newValue = parseFloat(this.el.time.value) + (mins / 60);
        this.el.time.value = Math.max(0, Math.min(newValue, this.currentData.duration));
        this.update();
    },

    update() {
        const date = new Date(this.el.date.value);
        const offset = parseFloat(this.el.time.value);
        const progress = offset / this.currentData.duration;

        const maxAltToday = getRealisticMaxAltitude(date);
        const altitude = Math.sin(progress * Math.PI) * maxAltToday;
        this.el.altVal.textContent = altitude.toFixed(1);
        
        let aziLabel = "";
        if (progress < 0.1) aziLabel = "東";
        else if (progress < 0.35) aziLabel = "東南";
        else if (progress <= 0.65) aziLabel = "南";
        else if (progress < 0.9) aziLabel = "西南";
        else aziLabel = "西";
        this.el.sideVal.textContent = aziLabel;

        // 方位鏡像翻轉
        const isEast = progress < 0.5;
        this.el.box.classList.toggle('east-side', isEast);

        const clockTime = (this.currentData.riseTime + offset) % 24;
        this.el.timeLabel.textContent = this.formatTime(clockTime);

        const rad = altitude * (Math.PI / 180);
        const mx = this.CENTER_X + Math.cos(rad) * this.MOON_ORBIT_RADIUS;
        const my = this.CENTER_Y - Math.sin(rad) * this.MOON_ORBIT_RADIUS;
        
        const moonData = getMoonData(date);
        this.el.moon.innerHTML = generateMoonSVG(moonData.phase, 45);
        this.el.moon.style.left = `${mx}px`;
        this.el.moon.style.top = `${my}px`;

        router.updateURL({ date: this.el.date.value, mode: 'altitude' });
    },

    formatTime(dec) {
        let h = Math.floor(dec % 24);
        let m = Math.floor((dec % 1) * 60);
        return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
    }
};