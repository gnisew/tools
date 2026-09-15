/**
 * 實驗三：高度角觀測 2025 重製獨立版
 */

// --- 核心天文常數 ---
const OBSERVER_LAT = 23.5; // 觀測緯度，預設台灣 (23.5°N)
const OBSERVER_LON = 121.0; // 觀測經度，預設台灣 (121°E，可依實際地點微調，如台北121.5、台中120.7)
const RAD = Math.PI / 180;
const SYNODIC_MONTH = 29.53058867; 
const KNOWN_NEW_MOON_2025 = new Date('2025-01-29T20:36:00+08:00'); 

/**
 * 將日期轉為 J2000.0 起算的天數 (供天文公式使用)
 */
function toDaysSinceJ2000(date) {
    return date.getTime() / 86400000 - 0.5 + 2440588 - 2451545;
}

/**
 * 月球地心黃道座標 (經度 l、緯度 b)，低精度近似公式
 * 出自 Jean Meeus《Astronomical Algorithms》簡化式，誤差約在 0.3° 以內
 */
function getMoonEclipticCoords(d) {
    const L = RAD * (218.316 + 13.176396 * d); // 平黃經
    const M = RAD * (134.963 + 13.064993 * d); // 平近點角
    const F = RAD * (93.272 + 13.229350 * d);  // 到升交點的平距角
    const l = L + RAD * 6.289 * Math.sin(M);   // 修正後黃經
    const b = RAD * 5.128 * Math.sin(F);       // 修正後黃緯
    return { l, b };
}

/**
 * 黃道座標轉換為赤道座標 (赤經 ra、赤緯 dec)
 */
function eclipticToEquatorial(l, b) {
    const e = RAD * 23.4397; // 黃赤交角
    const ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
    const dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
    return { ra, dec };
}

/**
 * 套用真實球面三角公式，計算指定日期時間、觀測緯度/經度下的月球高度角與方位角
 * 高度角公式：sin(h) = sin(φ)sin(δ) + cos(φ)cos(δ)cos(H)
 * 方位角公式：atan2(sin(H), cos(H)sin(φ) − tan(δ)cos(φ))，再轉換為北=0°、順時針的羅盤方位
 * @param {Date} date - 觀測的實際日期時間 (需含時區)
 * @param {number} latDeg - 觀測緯度，預設 OBSERVER_LAT (台灣 23.5°N)
 * @param {number} lonDeg - 觀測經度，預設 OBSERVER_LON (台灣 121°E)
 * @returns {{altitude:number, azimuth:number}} 高度角、方位角 (皆為角度制)
 */
function calculatePosition(date, latDeg = OBSERVER_LAT, lonDeg = OBSERVER_LON) {
    const lw = RAD * -lonDeg;  // 西經為正的座標慣例 (供恆星時公式使用)
    const phi = RAD * latDeg;  // 觀測緯度 (徑度)
    const d = toDaysSinceJ2000(date);

    const { l, b } = getMoonEclipticCoords(d);
    const { ra, dec } = eclipticToEquatorial(l, b);

    // 格林威治恆星時 → 當地時角
    const H = RAD * (280.16 + 360.9856235 * d) - lw - ra;

    const altRad = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
    const azRad = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));

    return {
        altitude: altRad / RAD,
        azimuth: ((azRad / RAD + 180) % 360 + 360) % 360 // 轉為北=0°、順時針的標準羅盤方位
    };
}

/**
 * 將方位角(度)轉換為中文八方位文字
 */
function azimuthToText(azDeg) {
    const dirs = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'];
    return dirs[Math.round(azDeg / 45) % 8];
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

    // 部分瀏覽器（常見於某些平板的 Safari/內建瀏覽器）不支援農曆曆法(zh-TW-u-ca-chinese)，
    // 呼叫時會直接拋出例外。用 try/catch 包起來，失敗時僅略過農曆顯示，
    // 避免整個 calculateData()/update() 流程被中斷，導致高度角度數文字不出現。
    let lunar = '農曆 --';
    try {
        const lunarFormatter = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', { month: 'numeric', day: 'numeric' });
        const parts = lunarFormatter.formatToParts(date);
        let lM = "", lD = "";
        parts.forEach(p => { if (p.type === 'month') lM = p.value; if (p.type === 'day') lD = p.value; });
        if (lM && lD) lunar = `農曆${lM}月${lD}`;
    } catch (e) {
        console.warn('此瀏覽器不支援農曆日期格式化，已略過農曆顯示:', e);
    }

    return { fullGregorian: `${ymd} (${weekday})`, lunar };
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

        // 先計算高度角觀測所需的核心資料 (月出時間、滑桿範圍)，
        // 確保即使下方的日期/農曆文字格式化失敗，觀測功能與度數顯示仍正常運作
        const moon = getMoonData(date);
        let rise = (6 + (moon.age * 0.83)) % 24;
        this.currentData = { riseTime: rise, duration: 12.2 };

        // 滑桿範圍設定為分鐘數 (12.2 小時 * 60)
        this.el.time.max = Math.floor(12.2 * 60);
        if (reset) this.el.time.value = Math.floor(this.el.time.max / 8);

        const info = getExtendedDate(date);
        this.el.displayMain.textContent = info.fullGregorian;
        this.el.displaySub.textContent = info.lunar;
    },

    stepTime(mins) { 
        let val = parseInt(this.el.time.value) + mins;
        this.el.time.value = Math.max(0, Math.min(val, this.el.time.max));
        this.update(); 
    },

    update() {
        const dateStr = this.el.date.value;
        const offsetMins = parseInt(this.el.time.value);
        const offsetHours = offsetMins / 60;

        // 計算實際時刻 (當地時間)
        const currentTimeDecimal = (this.currentData.riseTime + offsetHours) % 24;
        const hh = String(Math.floor(currentTimeDecimal)).padStart(2, '0');
        const mm = String(Math.floor((currentTimeDecimal % 1) * 60)).padStart(2, '0');
        // 組成含時區的完整日期時間，供球面三角公式計算實際天體位置
        const fullDateTime = new Date(`${dateStr}T${hh}:${mm}:00+08:00`);

        // 套用真實球面三角公式，取得該時刻的實際高度角與方位角
        const { altitude: rawAltitude, azimuth } = calculatePosition(fullDateTime, OBSERVER_LAT, OBSERVER_LON);
        // 月亮在地平線以下時，畫面上以 0° 呈現（避免圖示跑到框外）
        const altitude = Math.max(rawAltitude, 0);
        const azi = azimuthToText(azimuth);

        // 更新 UI 狀態（依實際方位角判斷月亮在天空的東側或西側）
        this.el.box.classList.toggle('east-side', azimuth < 180);
        this.el.timeLabel.textContent = this.formatTime(currentTimeDecimal);
        
        // 更新月球位置
        const rad = altitude * (Math.PI / 180);
        this.el.moon.style.left = `${this.CENTER_X + Math.cos(rad) * this.MOON_ORBIT_RADIUS}px`;
        this.el.moon.style.top = `${this.CENTER_Y - Math.sin(rad) * this.MOON_ORBIT_RADIUS}px`;
        this.el.moon.innerHTML = generateMoonSVG(getMoonData(fullDateTime).phase, 45);
        
        // SVG 內部動態文字更新
        document.getElementById('svgAziVal').textContent = azi;
        document.getElementById('svgDegVal').textContent = this.state.showTexts ? ` (${rawAltitude.toFixed(1)}°)` : "";
        
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