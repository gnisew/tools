/**
 * 實驗三：高度角觀測 2025 重製獨立版
 */

// --- 核心天文常數 ---
const OBSERVER_LAT = 23.5; // 台灣緯度
const SYNODIC_MONTH = 29.53058867; 
const KNOWN_NEW_MOON_2025 = new Date('2025-01-29T20:36:00+08:00'); 

/**
 * 根據日期估算真實的最大仰角 (中天高度)
 */
function getRealisticMaxAltitude(date) {
    const diff = date.getTime() - KNOWN_NEW_MOON_2025.getTime();
    const age = (diff / (1000 * 3600 * 24)) % SYNODIC_MONTH;
    const phase = (age < 0 ? age + SYNODIC_MONTH : age) / SYNODIC_MONTH;
    
    // 模擬月球赤緯擺動
    const approxDeclination = Math.sin((phase * 2 * Math.PI) - Math.PI/2) * 20;
    return 90 - Math.abs(OBSERVER_LAT - approxDeclination);
}

function getMoonData(date) {
    const diffTime = date.getTime() - KNOWN_NEW_MOON_2025.getTime();
    let age = (diffTime / (1000 * 3600 * 24)) % SYNODIC_MONTH;
    if (age < 0) age += SYNODIC_MONTH;
    return { age, phase: age / SYNODIC_MONTH };
}

function generateMoonSVG(phase, size) {
    const r = 45; 
    const rx = Math.cos(phase * 2 * Math.PI) * r;
    const bgColor = "#1a1d2e", lightColor = "#f4f6f0";
    const isWaxing = phase <= 0.5;
    const rightHalf = `M 50 5 A 45 45 0 0 1 50 95`, leftHalf = `M 50 95 A 45 45 0 0 1 50 5`;
    let d = isWaxing ? `${rightHalf} A ${Math.abs(rx)} 45 0 0 ${rx > 0 ? 0 : 1} 50 5` : `${leftHalf} A ${Math.abs(rx)} 45 0 0 ${rx < 0 ? 1 : 0} 50 95`;
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><circle cx="50" cy="50" r="45" fill="${bgColor}" /><path d="${d}" fill="${lightColor}" /></svg>`;
}

function getExtendedDate(date) {
    const weekday = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' }).format(date);
    const ymd = `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`;
    const lunarFormatter = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', { month: 'numeric', day: 'numeric' });
    const parts = lunarFormatter.formatToParts(date);
    let lM = "", lD = "";
    parts.forEach(p => { if (p.type === 'month') lM = p.value; if (p.type === 'day') lD = p.value; });
    return { fullGregorian: `${ymd} (${weekday})`, lunar: `農曆${lM}月${lD}` };
}

// --- 實驗邏輯對象 ---
const exp3 = {
    state: { 
        showLines: true, 
        showTexts: true, 
        centerEmojis: ['🧐','🔭','👩‍🚀','👀','🌟','🌈','🌚'] 
    },
    CENTER_X: 300, 
    CENTER_Y: 340, 
    RADIUS: 235, 
    MOON_ORBIT_RADIUS: 300,

    get el() {
        return {
            date: document.getElementById('datePicker3'),
            time: document.getElementById('altTimeSlider'),
            timeLabel: document.getElementById('altTimeLabel'),
            displayMain: document.getElementById('displayDate3'),
            displaySub: document.getElementById('displayLunar3'),
            box: document.getElementById('altitudeObserver'),
            svg: document.getElementById('protractorSvg'),
            moon: document.getElementById('obsMoon'),
            centerIcon: document.getElementById('obsCenterIcon'),
            chkLines: document.getElementById('chkShowLines'),
            chkTexts: document.getElementById('chkShowTexts')
        };
    },

    init() {
        // 設定中心座標
        this.el.centerIcon.style.left = `${this.CENTER_X}px`;
        this.el.centerIcon.style.top = `${this.CENTER_Y}px`;
        
        this.drawProtractor();
        
        // 綁定事件
        this.el.date.onchange = () => { this.calculateData(true); this.update(); };
        this.el.time.oninput = () => this.update();
        
        // 鍵盤控制支援
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.stepTime(-1);
            if (e.key === 'ArrowRight') this.stepTime(1);
            if (e.key === 'ArrowUp') this.stepTime(10);
            if (e.key === 'ArrowDown') this.stepTime(-10);
        });

        // 初始化日期
        this.el.date.value = new Date().toISOString().split('T')[0];
        this.calculateData(true);
        this.update();
    },

    randomizeCenterIcon() {
        const emojis = this.state.centerEmojis;
        this.el.centerIcon.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    },

    toggleView() { 
        this.state.showLines = this.el.chkLines.checked; 
        this.state.showTexts = this.el.chkTexts.checked; 
        this.update(); 
    },

    drawProtractor() {
        let html = '';
        // 基準線 (0, 90)
        html += `<g id="baseLinesGroup">`;
        [0, 90].forEach(a => {
            const rad = a * (Math.PI / 180);
            const x2 = this.CENTER_X + Math.cos(rad) * (this.RADIUS + 20);
            const y2 = this.CENTER_Y - Math.sin(rad) * (this.RADIUS + 20);
            html += `<line x1="${this.CENTER_X}" y1="${this.CENTER_Y}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.6)" stroke-width="2" />`;
        });
        html += `</g>`;

        // 輔助線 (10-80)
        html += `<g id="intermediateLinesGroup">`;
        for (let a = 10; a < 90; a += 10) {
            const rad = a * (Math.PI / 180);
            const x2 = this.CENTER_X + Math.cos(rad) * this.RADIUS;
            const y2 = this.CENTER_Y - Math.sin(rad) * this.RADIUS;
            html += `<line x1="${this.CENTER_X}" y1="${this.CENTER_Y}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.2)" stroke-width="1" />`;
        }
        html += `</g>`;

        // 刻度文字
        html += `<g id="scaleTextsGroup">`;
        for (let a = 0; a <= 90; a += 10) {
            const rad = a * (Math.PI / 180);
            const tx = this.CENTER_X + Math.cos(rad) * (this.RADIUS + 35);
            const ty = this.CENTER_Y - Math.sin(rad) * (this.RADIUS + 35);
            html += `<text x="${tx}" y="${ty}" class="protractor-text flip-fix" text-anchor="middle" dominant-baseline="central">${a}°</text>`;
        }
        html += `</g>`;

        // 地平線方位標記
        html += `
            <text x="${this.CENTER_X + this.RADIUS + 15}" y="${this.CENTER_Y + 28}" class="guide-text flip-fix" text-anchor="end">
                <tspan id="svgAziVal">--</tspan>
                <tspan id="svgDegVal" style="fill: var(--accent-color); font-weight: bold;"></tspan> 地平線
            </text>
        `;
        this.el.svg.innerHTML = html;
    },

    calculateData(reset = false) {
        const date = new Date(this.el.date.value);
        const info = getExtendedDate(date);
        this.el.displayMain.textContent = info.fullGregorian;
        this.el.displaySub.textContent = info.lunar;

        const moon = getMoonData(date);
        let rise = (6 + (moon.age * 0.83)) % 24;
        this.currentData = { riseTime: rise, duration: 12.2 };
        
        // 滑桿範圍設定為分鐘數 (12.2 小時 * 60)
        this.el.time.max = Math.floor(12.2 * 60);
        if (reset) this.el.time.value = Math.floor(this.el.time.max / 8);
    },

    stepTime(mins) { 
        let val = parseInt(this.el.time.value) + mins;
        this.el.time.value = Math.max(0, Math.min(val, this.el.time.max));
        this.update(); 
    },

    update() {
        const date = new Date(this.el.date.value);
        const offsetMins = parseInt(this.el.time.value);
        const offsetHours = offsetMins / 60;
        const progress = offsetHours / this.currentData.duration;
        
        // 科學計算：當日最大仰角
        const maxAltToday = getRealisticMaxAltitude(date);
        const altitude = Math.sin(progress * Math.PI) * maxAltToday;
        
        // 方位判定
        let azi = "南";
        if (progress < 0.1) azi = "東";
        else if (progress < 0.35) azi = "東南";
        else if (progress > 0.65 && progress < 0.9) azi = "西南";
        else if (progress >= 0.9) azi = "西";

        // 更新 UI 狀態
        this.el.box.classList.toggle('east-side', progress < 0.5);
        this.el.timeLabel.textContent = this.formatTime((this.currentData.riseTime + offsetHours) % 24);
        
        // 更新月球位置
        const rad = altitude * (Math.PI / 180);
        this.el.moon.style.left = `${this.CENTER_X + Math.cos(rad) * this.MOON_ORBIT_RADIUS}px`;
        this.el.moon.style.top = `${this.CENTER_Y - Math.sin(rad) * this.MOON_ORBIT_RADIUS}px`;
        this.el.moon.innerHTML = generateMoonSVG(getMoonData(date).phase, 45);
        
        // SVG 內部動態文字更新
        document.getElementById('svgAziVal').textContent = azi;
        document.getElementById('svgDegVal').textContent = this.state.showTexts ? ` (${altitude.toFixed(1)}°)` : "";
        
        // 顯示控制
        document.getElementById('intermediateLinesGroup').style.display = this.state.showLines ? 'block' : 'none';
        document.getElementById('scaleTextsGroup').style.display = this.state.showTexts ? 'block' : 'none';
    },

    formatTime(dec) {
        let h = Math.floor(dec % 24), m = Math.floor((dec % 1) * 60);
        return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
    }
};

window.onload = () => exp3.init();