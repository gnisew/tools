/**
 * 實驗二：軌跡觀測 - 2025 獨立完全重製版
 */

// === 1. 天文常數與工具 (合併自 utils.js) ===
const SYNODIC_MONTH = 29.53058867; 
const KNOWN_NEW_MOON_2025 = new Date('2025-01-29T20:36:00+08:00'); 

function getMoonData(date) {
    const diffTime = date.getTime() - KNOWN_NEW_MOON_2025.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    let age = diffDays % SYNODIC_MONTH;
    if (age < 0) age += SYNODIC_MONTH;
    const phase = age / SYNODIC_MONTH;
    const illumination = ((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100).toFixed(0);
    return { age, phase, illumination };
}

function generateMoonSVG(phase, size) {
    const r = 45; 
    const rx = Math.cos(phase * 2 * Math.PI) * r;
    const bgColor = "#1a1d2e", lightColor = "#f4f6f0";
    const isWaxing = phase <= 0.5;
    const rightHalf = `M 50 5 A 45 45 0 0 1 50 95`;
    const leftHalf = `M 50 95 A 45 45 0 0 1 50 5`;
    let d = isWaxing ? `${rightHalf} A ${Math.abs(rx)} 45 0 0 ${rx > 0 ? 0 : 1} 50 5` 
                     : `${leftHalf} A ${Math.abs(rx)} 45 0 0 ${rx < 0 ? 1 : 0} 50 95`;
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><circle cx="50" cy="50" r="45" fill="${bgColor}" /><path d="${d}" fill="${lightColor}" /></svg>`;
}

function getExtendedDate(date) {
    const weekday = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' }).format(date);
    const ymd = `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`;
    const lunarFormatter = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', { month: 'numeric', day: 'numeric' });
    const parts = lunarFormatter.formatToParts(date);
    let lM = "", lD = "";
    parts.forEach(p => { if(p.type==='month') lM=p.value; if(p.type==='day') lD=p.value; });
    return { ymd, week: weekday, lunar: `農曆${lM}月${lD}`, fullGregorian: `${ymd} (${weekday})` };
}

// === 2. 實驗二核心邏輯 (完全同步自 exp.js) ===
const exp2 = {
    state: {
        mode: 'single', 
        multiMoons: [],
        showGuide: true,
        showInfoBubble: true,
        showScenery: false,
        sceneryTypeIndex: 0,
        labels: { date: true, week: true, time: true, lunar: true, alt: true, azi: false }
    },
    
    // 完整的 5 組幾何景物
    sceneryData: [
        {
            name: "幾何-公園 (原始)",
            // 地板 + 圓樹 + 方樹 + 幾何塊
            svgContent: `
                <!-- 地平線 -->
                <rect x="0" y="98" width="100" height="2" class="geo-shape" />
                
                <!-- 左側：雲狀樹叢 -->
                <circle cx="12" cy="90" r="5" class="geo-shape" />
                <circle cx="18" cy="92" r="4" class="geo-shape" />

                <!-- 左中：圓樹 + 方塊 -->
                <rect x="28" y="85" width="2" height="15" class="geo-shape" /> 
                <circle cx="29" cy="80" r="7" class="geo-shape" /> 
                <rect x="35" y="82" width="10" height="18" class="geo-shape" /> 

                <!-- 中間：雙圓樹 -->
                <rect x="52" y="88" width="2" height="12" class="geo-shape" />
                <rect x="58" y="88" width="2" height="12" class="geo-shape" />
                <circle cx="53" cy="82" r="6" class="geo-shape" />
                <circle cx="59" cy="80" r="7" class="geo-shape" />

                <!-- 右側：大方塊建築 -->
                <rect x="70" y="65" width="18" height="35" class="geo-shape" />
                
                <!-- 最右：小樹 -->
                <rect x="92" y="88" width="2" height="12" class="geo-shape" />
                <circle cx="93" cy="85" r="4" class="geo-shape" />
            `
        },
        {
            name: "幾何-村莊 (斜屋頂)",
            // 特色：三角形屋頂、矮房
            svgContent: `
                <!-- 地平線 -->
                <rect x="0" y="98" width="100" height="2" class="geo-shape" />

                <!-- 小屋 A (左) -->
                <rect x="5" y="85" width="12" height="15" class="geo-shape" />
                <path d="M 3 85 L 11 75 L 19 85 Z" class="geo-shape" /> <!-- 三角屋頂 -->

                <!-- 樹 -->
                <rect x="22" y="88" width="2" height="12" class="geo-shape" />
                <circle cx="23" cy="84" r="5" class="geo-shape" />

                <!-- 寬屋 B (中) -->
                <rect x="35" y="82" width="20" height="18" class="geo-shape" />
                <path d="M 33 82 L 45 70 L 57 82 Z" class="geo-shape" /> <!-- 大斜頂 -->
                
                <!-- 雙連屋 C (右) -->
                <rect x="65" y="80" width="10" height="20" class="geo-shape" />
                <rect x="75" y="85" width="10" height="15" class="geo-shape" />
                <!-- 梯形/斜屋頂 -->
                <path d="M 63 80 L 70 70 L 77 80 Z" class="geo-shape" />
                <path d="M 75 85 L 88 85 L 88 80 Z" class="geo-shape" /> <!-- 單斜邊 -->

                <!-- 遠處的小樹 -->
                <circle cx="92" cy="92" r="6" class="geo-shape" opacity="0.8"/>
            `
        },
        {
            name: "幾何-丘陵 (圓角山)",
            // 特色：使用 Q (Quadratic Bezier) 繪製圓潤山丘
            svgContent: `
                <!-- 後方大山 (較淡) -->
                <path d="M -10 100 Q 30 50 70 100 Z" class="geo-shape" opacity="0.6" />
                
                <!-- 側邊山丘 -->
                <path d="M 60 100 Q 85 60 110 100 Z" class="geo-shape" opacity="0.7" />

                <!-- 前方小丘與樹林 -->
                <path d="M 20 100 Q 50 75 80 100 Z" class="geo-shape" />
                
                <!-- 點綴樹木 (讓山不單調) -->
                <rect x="10" y="90" width="2" height="10" class="geo-shape" />
                <circle cx="11" cy="88" r="4" class="geo-shape" />

                <rect x="85" y="85" width="2" height="15" class="geo-shape" />
                <circle cx="86" cy="80" r="6" class="geo-shape" />
                
                <!-- 地平線 -->
                <rect x="0" y="98" width="100" height="2" class="geo-shape" />
            `
        },
        {
            name: "幾何-都會 (高樓)",
            // 特色：錯落的高長方體，無斜頂
            svgContent: `
                <!-- 遠景樓群 -->
                <rect x="2" y="65" width="8" height="35" class="geo-shape" opacity="0.6"/>
                <rect x="12" y="75" width="6" height="25" class="geo-shape" opacity="0.6"/>
                <rect x="85" y="70" width="10" height="30" class="geo-shape" opacity="0.6"/>

                <!-- 中景樓群 -->
                <rect x="25" y="55" width="12" height="45" class="geo-shape" />
                <rect x="40" y="70" width="10" height="30" class="geo-shape" opacity="0.9"/>
                
                <!-- 特色地標 -->
                <rect x="55" y="45" width="15" height="55" class="geo-shape" />
                <rect x="60" y="40" width="5" height="5" class="geo-shape" /> <!-- 頂部小屋 -->
                <rect x="62" y="30" width="1" height="10" class="geo-shape" /> <!-- 天線 -->

                <!-- 近景矮樓 -->
                <rect x="75" y="80" width="8" height="20" class="geo-shape" />
                <rect x="90" y="85" width="8" height="15" class="geo-shape" />

                <!-- 地平線 -->
                <rect x="0" y="98" width="100" height="2" class="geo-shape" />
            `
        },
        {
            name: "幾何-複合 (教堂與山)",
            // 特色：結合圓角山與尖頂建築
            svgContent: `
                <!-- 圓潤遠山 -->
                <path d="M 40 100 Q 70 65 100 100 Z" class="geo-shape" opacity="0.7" />

                <!-- 尖塔建築 (教堂/學校) -->
                <rect x="15" y="75" width="15" height="25" class="geo-shape" />
                <path d="M 12 75 L 22.5 55 L 33 75 Z" class="geo-shape" /> <!-- 高尖頂 -->
                <rect x="30" y="85" width="20" height="15" class="geo-shape" />
                
                <!-- 樹叢群 -->
                <circle cx="60" cy="92" r="8" class="geo-shape" />
                <circle cx="70" cy="90" r="10" class="geo-shape" />
                <rect x="68" y="95" width="4" height="5" class="geo-shape" />

                <!-- 右側小屋 -->
                <rect x="85" y="88" width="10" height="12" class="geo-shape" />
                <path d="M 83 88 L 90 82 L 97 88 Z" class="geo-shape" />

                <!-- 地平線 -->
                <rect x="0" y="98" width="100" height="2" class="geo-shape" />
            `
        }
    ],

    get el() {
        return {
            date: document.getElementById('datePicker2'),
            displayMain: document.getElementById('displayDate2'),
            displaySub: document.getElementById('displayLunar2'),
            time: document.getElementById('timeSlider'),
            timeLabel: document.getElementById('timeLabel'),
            moon: document.getElementById('skyMoon'),
            moonGraphic: document.getElementById('skyMoonGraphic'),
            alt: document.getElementById('altVal'),
            azi: document.getElementById('azimuthVal'),
            riseVal: document.getElementById('riseTimeVal'),
            setVal: document.getElementById('setTimeVal'),
            skyBg: document.querySelector('.sky-bg'),
            multiContainer: document.getElementById('multiMoonContainer'),
            multiPanel: document.getElementById('multi-controls-panel'),
            multiList: document.getElementById('multiList'),
            btnAdd: document.getElementById('btnAddMoon'),
            multiCount: document.getElementById('multiCount'),
            groundScenery: document.getElementById('groundScenery'),
            btnInfo: document.getElementById('btn-info-toggle'),
            btnScenery: document.getElementById('btn-scenery-toggle'),
            sceneryControls: document.getElementById('sceneryControls')
        };
    },

    currentData: { riseTime: 0, setTime: 0, duration: 12.2 },
    MAX_DISPLAY_ANGLE: 105,

    init() {
        const gridBox = document.getElementById('skyGrids10');
        gridBox.innerHTML = '';
        for (let a = 0; a <= 90; a += 10) {
            const line = document.createElement('div');
            line.className = 'grid-line';
            line.style.bottom = `${(a / this.MAX_DISPLAY_ANGLE) * 100}%`;
            line.innerHTML = `<span class="grid-label">${a}°</span>`;
            gridBox.appendChild(line);
        }

        this.el.date.onchange = () => { this.calculateRiseSet(true); this.update(); };
        this.el.time.oninput = () => this.update();
        
        if (!this.el.date.value) this.el.date.value = new Date().toISOString().split('T')[0];
        this.calculateRiseSet(true);
        this.update();
    },

    calculateRiseSet(resetToCenter = false) {
        const date = new Date(this.el.date.value);
        const info = getExtendedDate(date);
        this.el.displayMain.textContent = info.fullGregorian;
        this.el.displaySub.textContent = info.lunar;

        const moon = getMoonData(date);
        let rise = (6 + (moon.age * 0.83)) % 24;
        this.currentData = { riseTime: rise, setTime: (rise + 12.2) % 24, duration: 12.2 };
        
        this.el.time.max = 12.2; 
        this.el.time.step = 0.001;
        this.el.riseVal.textContent = this.formatTime(rise);
        this.el.setVal.textContent = this.formatTime(this.currentData.setTime);
        
        if (resetToCenter) this.el.time.value = 12.2 / 4; 
    },

    setMode(mode) {
        this.state.mode = mode;
        document.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.id === `btn-pos-${mode}`));
        this.el.multiPanel.style.display = (mode === 'multi') ? 'block' : 'none';
        this.update();
    },

    stepTime(mins) {
        let newValue = parseFloat(this.el.time.value) + (mins / 60);
        this.el.time.value = Math.max(0, Math.min(newValue, 12.2));
        this.update();
    },

    toggleScenery() { 
        this.state.showScenery = !this.state.showScenery; 
        this.renderScenery(); 
    },

    toggleInfoBubble() { 
        this.state.showInfoBubble = !this.state.showInfoBubble; 
        this.update(); 
    },

    toggleLabel(key, show) { 
        this.state.labels[key] = show; 
        this.update(); 
    },

    toggleGuide(show) { 
        this.state.showGuide = show; 
        this.update(); 
    },

    switchSceneryType() {
        this.state.sceneryTypeIndex = (this.state.sceneryTypeIndex + 1) % this.sceneryData.length;
        if (!this.state.showScenery) this.state.showScenery = true;
        this.renderScenery();
    },

    renderScenery() {
        this.el.btnScenery.classList.toggle('active', this.state.showScenery);
        this.el.groundScenery.classList.toggle('visible', this.state.showScenery);
        if (this.state.showScenery) {
            const scene = this.sceneryData[this.state.sceneryTypeIndex];
            this.el.groundScenery.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:100%">${scene.svgContent}</svg>`;
        }
    },

    update() {
        document.querySelectorAll('.path-point').forEach(p => p.remove());
        this.el.multiContainer.innerHTML = '';
        
        if (this.el.btnInfo) {
            this.el.btnInfo.classList.toggle('active', this.state.showInfoBubble);
            this.el.btnInfo.style.display = (this.state.mode === 'single') ? 'inline-block' : 'none';
        }

        if (this.state.mode === 'multi') {
            this.el.moon.style.display = this.state.showGuide ? 'flex' : 'none';
            this.el.moon.style.opacity = '0.5';
            this.renderSingleMoon(); 
            this.renderMultiMoons(); 
            this.updateMultiListUI();
        } else if (this.state.mode === 'path') {
            this.el.moon.style.display = 'none';
            this.renderTrajectory();
        } else {
            this.el.moon.style.display = 'flex'; 
            this.el.moon.style.opacity = '1';
            const bubble = this.el.moon.querySelector('.moon-info-bubble');
            if(bubble) bubble.style.display = this.state.showInfoBubble ? 'block' : 'none';
            this.renderSingleMoon();
        }
    },

    renderSingleMoon() {
        const offset = parseFloat(this.el.time.value);
        const progress = offset / 12.2;
        const pos = this.calculatePosition(progress);
        
        this.el.moon.style.bottom = `${pos.bottom}%`; 
        this.el.moon.style.left = `${pos.left}%`;
        this.el.moonGraphic.style.transform = `translate(-50%, -50%) rotate(${pos.rotation}deg)`;
        this.el.alt.textContent = pos.altitude.toFixed(1);
        this.el.azi.textContent = pos.azi;
        this.el.timeLabel.textContent = this.formatTime((this.currentData.riseTime + offset) % 24);
        
        const moonData = getMoonData(new Date(this.el.date.value));
        this.el.moonGraphic.innerHTML = generateMoonSVG(moonData.phase, 45);
    },

    renderTrajectory() {
        const moonData = getMoonData(new Date(this.el.date.value));
        const rise = this.currentData.riseTime;
        for (let h = 0; h <= 12; h++) {
            const hourAt = Math.ceil(rise) + h;
            const offset = hourAt - rise;
            if (offset < 0 || offset > 12.2) continue;
            
            const progress = offset / 12.2;
            const pos = this.calculatePosition(progress);
            const p = document.createElement('div');
            p.className = 'sky-moon path-point';
            p.style.bottom = `${pos.bottom}%`; 
            p.style.left = `${pos.left}%`;
            p.innerHTML = `
                <div style="transform:rotate(${pos.rotation}deg)">${generateMoonSVG(moonData.phase, 35)}</div>
                <div class="path-label">${Math.floor(hourAt % 24)}時</div>
            `;
            this.el.skyBg.appendChild(p);
        }
    },

    addMultiMoon() {
        if (this.state.multiMoons.length >= 5) return alert("最多只能新增 5 個觀測點");
        const date = new Date(this.el.date.value);
        const moon = getMoonData(date);
        const info = getExtendedDate(date);
        const offset = parseFloat(this.el.time.value);
        const progress = offset / 12.2;
        const pos = this.calculatePosition(progress);
        
        // 取得簡化星期
        const weekShort = info.week.replace('週', '');

        this.state.multiMoons.push({
            id: Date.now(),
            snapshot: {
                ymd: info.ymd, 
                weekFormatted: `(${weekShort})`, 
                lunar: info.lunar,
                time: this.formatTime((this.currentData.riseTime + offset) % 24),
                alt: pos.altitude.toFixed(1), azi: pos.azi, phase: moon.phase, pos: pos
            }
        });
        this.update();
    },

    removeMultiMoon(id) { 
        this.state.multiMoons = this.state.multiMoons.filter(m => m.id !== id); 
        this.update(); 
    },

    renderMultiMoons() {
        const s = this.state.labels;
        this.state.multiMoons.forEach(m => {
            const el = document.createElement('div');
            el.className = 'sky-moon';
            el.style.bottom = `${m.snapshot.pos.bottom}%`; 
            el.style.left = `${m.snapshot.pos.left}%`;
            
            let labelHtml = '';
            if (s.date) {
                const weekStr = s.week ? ` <span class="row-week">${m.snapshot.weekFormatted}</span>` : '';
                labelHtml += `<div class="row-date">${m.snapshot.ymd}${weekStr}</div>`;
            } else if (s.week) {
                labelHtml += `<div class="row-date">${m.snapshot.weekFormatted}</div>`;
            }
            
            if (s.time) labelHtml += `<div class="row-time">${m.snapshot.time}</div>`;
            if (s.lunar) labelHtml += `<div class="row-lunar">${m.snapshot.lunar}</div>`;
            
            let posInfo = [];
            if (s.alt) posInfo.push(`H:${m.snapshot.alt}°`);
            if (s.azi) posInfo.push(m.snapshot.azi);
            if (posInfo.length > 0) labelHtml += `<div class="row-pos">${posInfo.join(' | ')}</div>`;

            el.innerHTML = `
                <div class="moon-visual" style="transform:translate(-50%,-50%) rotate(${m.snapshot.pos.rotation}deg)">
                    ${generateMoonSVG(m.snapshot.phase, 40)}
                </div>
                <div class="multi-moon-label">${labelHtml}</div>
            `;
            this.el.multiContainer.appendChild(el);
        });
    },

    updateMultiListUI() {
        this.el.multiList.innerHTML = '';
        this.el.multiCount.textContent = this.state.multiMoons.length;
        this.state.multiMoons.forEach(m => {
            const item = document.createElement('div');
            item.className = 'multi-list-item';
            item.innerHTML = `
                <span>${m.snapshot.ymd} ${m.snapshot.time}</span>
                <button onclick="exp2.removeMultiMoon(${m.id})" style="background:none;border:none;color:#ff6b6b;cursor:pointer;font-weight:bold;font-size:1.2rem;">×</button>
            `;
            this.el.multiList.appendChild(item);
        });
    },

    calculatePosition(progress) {
        // 完全遵照 exp.js 原始計算公式
        const altitude = Math.sin(progress * Math.PI) * 75; 
        const horizontal = -45 + (progress * 90);
        const rotation = (progress * 120) - 60;
        
        return {
            altitude, 
            bottom: (altitude / this.MAX_DISPLAY_ANGLE) * 100,
            left: 50 + horizontal,
            rotation,
            azi: progress < 0.4 ? "東南" : (progress > 0.6 ? "西南" : "正南")
        };
    },

    formatTime(dec) {
        let h = Math.floor(dec % 24), m = Math.floor((dec % 1) * 60);
        return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
    }
};

window.onload = () => exp2.init();