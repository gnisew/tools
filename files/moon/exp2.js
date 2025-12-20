
const exp2 = {
    state: {
        mode: 'single', 
        multiMoons: [],
        showGuide: true,
        // 新增：顯示數值氣泡 (單日模式)
        showInfoBubble: true,
        // 新增：景物相關狀態
        showScenery: false,
        sceneryTypeIndex: 0,
        labels: {        
            date: true,
            week: true, 
            time: true,
            lunar: true,
            alt: true,
            azi: false
        }
    },
    
    // 定義抽象幾何景物資料 (SVG Paths & Shapes)
    // viewBox="0 0 100 100"，座標系為 0-100 (Y=100為底部)
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

    el: {
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
        
        // 新增 element 參照
        groundScenery: document.getElementById('groundScenery'),
        sceneryControls: document.getElementById('sceneryControls'),
        btnSceneryToggle: document.getElementById('btn-scenery-toggle'),
        btnInfoToggle: document.getElementById('btn-info-toggle') // 新增
    },

    currentData: { riseTime: 0, setTime: 0, duration: 12 },
    MAX_DISPLAY_ANGLE: 105, 

    init() {
        const gridBox = document.getElementById('skyGrids10');
        if(gridBox) {
            gridBox.innerHTML = '';
            for (let a = 0; a <= 90; a += 10) {
                const line = document.createElement('div');
                line.className = 'grid-line';
                line.style.bottom = `${(a / this.MAX_DISPLAY_ANGLE) * 100}%`;
                line.innerHTML = `<span class="grid-label">${a}°</span>`;
                gridBox.appendChild(line);
            }
        }

        this.el.date.onchange = () => {
            this.calculateRiseSet(true); 
            this.update(true); 
        };

        this.el.time.oninput = () => this.update(false);
        this.el.time.onchange = () => this.update(true);
        
        if (!this.el.date.value) this.setToday(true);
        else {
            this.calculateRiseSet(true);
            this.update(true);
        }

        // 初始化景物
        this.renderScenery();
    },

    setMode(mode) {
        this.state.mode = mode;
        
        document.getElementById('btn-pos-single').classList.toggle('active', mode === 'single');
        document.getElementById('btn-pos-path').classList.toggle('active', mode === 'path');
        document.getElementById('btn-pos-multi').classList.toggle('active', mode === 'multi');
        
        this.el.multiPanel.style.display = (mode === 'multi') ? 'block' : 'none';
        
        // 修正：不再隱藏 sceneryControls，而是由 update 統一管理內部按鈕
        
        this.update(true);
    },

    setToday(shouldUpdate = true) {
        this.el.date.value = new Date().toISOString().split('T')[0];
        if (shouldUpdate) { 
            this.calculateRiseSet(true);
            this.update(true);
        }
    },

    stepTime(mins) {
        let newValue = parseFloat(this.el.time.value) + (mins / 60);
        this.el.time.value = Math.max(0, Math.min(newValue, this.currentData.duration));
        this.update(true);
    },

    toggleGuide(show) {
        this.state.showGuide = show;
        this.update(false); 
    },

    toggleLabel(key, show) {
        this.state.labels[key] = show;
        this.update(false); 
    },
    
    // ====== 新增：景物與資訊控制函式 ======
    toggleScenery() {
        this.state.showScenery = !this.state.showScenery;
        this.renderScenery();
    },
    
    toggleInfoBubble() {
        this.state.showInfoBubble = !this.state.showInfoBubble;
        this.update(false);
    },

    switchSceneryType() {
        this.state.sceneryTypeIndex = (this.state.sceneryTypeIndex + 1) % this.sceneryData.length;
        // 如果目前是關閉的，切換類型時自動打開
        if (!this.state.showScenery) this.state.showScenery = true;
        this.renderScenery();
    },

    renderScenery() {
        const layer = this.el.groundScenery;
        const btn = this.el.btnSceneryToggle;
        
        if (this.state.showScenery) {
            layer.classList.add('visible');
            btn.classList.add('active');
            btn.innerHTML = '⛰️'; 
            
            const currentScene = this.sceneryData[this.state.sceneryTypeIndex];
            
            layer.innerHTML = `
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%; height:100%;">
                    ${currentScene.svgContent}
                </svg>
                <div style="position:absolute; bottom:5px; right:5px; color:rgba(255,255,255,0.3); font-size:0.6rem; pointer-events:none; text-shadow: 0 0 2px #000;">
                    ${currentScene.name}
                </div>
            `;
        } else {
            layer.classList.remove('visible');
            btn.classList.remove('active');
            btn.innerHTML = '<span style="opacity:0.5; filter:grayscale(1)">⛰️</span>'; 
        }
    },

    calculateRiseSet(resetToCenter = false) {
        const date = new Date(this.el.date.value);
        const dateInfo = getExtendedDate(date);
        if (this.el.displayMain) this.el.displayMain.textContent = dateInfo.fullGregorian;
        if (this.el.displaySub) this.el.displaySub.textContent = dateInfo.lunar;

        const moon = getMoonData(date);
        let rise = (6 + (moon.age * 0.83)) % 24;
        let duration = 12.2; 
        let set = (rise + duration) % 24;

        this.currentData = { riseTime: rise, setTime: set, duration: duration };
        this.el.time.max = duration;
        this.el.time.step = 0.001; 
        
        this.el.riseVal.textContent = this.formatTime(rise);
        this.el.setVal.textContent = this.formatTime(set);

        if (resetToCenter) this.el.time.value = duration / 5;
    },

    update(isFinalUpdate = false) {
        router.updateURL({ date: this.el.date.value, mode: this.state.mode });

        document.querySelectorAll('.path-point').forEach(p => p.remove());
        this.el.multiContainer.innerHTML = '';

        // ====== 修改：統一管理控制列顯示狀態 ======
        // 1. 景物控制列 (容器) 永遠顯示
        if(this.el.sceneryControls) {
            this.el.sceneryControls.style.display = 'flex';
            
            // 2. 數值按鈕：僅單日模式顯示
            const btnInfo = document.getElementById('btn-info-toggle');
            const divider = this.el.sceneryControls.querySelector('.divider-v');
            
            if (btnInfo) {
                if (this.state.mode === 'single') {
                    btnInfo.style.display = 'inline-block';
                    btnInfo.classList.toggle('active', this.state.showInfoBubble);
                    if(divider) divider.style.display = 'block';
                } else {
                    btnInfo.style.display = 'none';
                    if(divider) divider.style.display = 'none';
                }
            }
        }

        if (this.state.mode === 'multi') {
            this.el.moon.style.display = this.state.showGuide ? 'flex' : 'none';
            this.el.moon.style.opacity = '0.5'; 
            this.el.moon.querySelector('.moon-info-bubble').style.display = 'none';
            
            this.renderSingleMoon(isFinalUpdate);
            this.renderMultiMoons(); 
            this.updateMultiListUI();
        } else if (this.state.mode === 'path') {
            this.el.moon.style.display = 'none';
            this.renderTrajectory();
        } else {
            // Single Mode
            this.el.moon.style.display = 'flex';
            this.el.moon.style.opacity = '1';
            
            // 修改：根據 state 決定是否顯示數值
            const bubble = this.el.moon.querySelector('.moon-info-bubble');
            if (bubble) {
                bubble.style.display = this.state.showInfoBubble ? 'block' : 'none';
            }
            
            this.renderSingleMoon(isFinalUpdate);
        }
    },

    addMultiMoon() {
        if (this.state.multiMoons.length >= 5) {
            alert("最多只能新增 5 個月亮觀測點。");
            return;
        }

        const dateVal = this.el.date.value;
        const timeOffset = parseFloat(this.el.time.value);
        const date = new Date(dateVal);
        const moonData = getMoonData(date);
        const dateInfo = getExtendedDate(date); 
        
        const currentClockTime = (this.currentData.riseTime + timeOffset) % 24;
        const progress = timeOffset / this.currentData.duration;
        const pos = this.calculatePosition(progress);
        const aziText = progress < 0.4 ? "東南" : (progress > 0.6 ? "西南" : "正南");

        const weekShort = dateInfo.week.replace('週', '');

        this.state.multiMoons.push({
            id: Date.now(),
            snapshot: {
                ymd: dateInfo.ymd,
                weekRaw: dateInfo.week,
                weekFormatted: `(${weekShort})`,
                timeStr: this.formatTime(currentClockTime),
                lunar: dateInfo.lunar,
                phase: moonData.phase,
                altitude: pos.altitude.toFixed(1),
                azi: aziText,
                pos: pos 
            }
        });

        this.update(true);
    },

    removeMultiMoon(id) {
        this.state.multiMoons = this.state.multiMoons.filter(m => m.id !== id);
        this.update(true);
    },

    renderMultiMoons() {
        const s = this.state.labels; 

        this.state.multiMoons.forEach((m) => {
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
            
            if (s.time) labelHtml += `<div class="row-time">${m.snapshot.timeStr}</div>`;
            if (s.lunar) labelHtml += `<div class="row-lunar">${m.snapshot.lunar}</div>`;
            
            let posInfo = [];
            if (s.alt) posInfo.push(`H:${m.snapshot.altitude}°`);
            if (s.azi) posInfo.push(m.snapshot.azi);
            if (posInfo.length > 0) labelHtml += `<div class="row-pos">${posInfo.join(' | ')}</div>`;

            el.innerHTML = `
                <div class="moon-visual" style="transform: translate(-50%, -50%) rotate(${m.snapshot.pos.rotation}deg)">
                    ${generateMoonSVG(m.snapshot.phase, 40)}
                </div>
                <div class="multi-moon-label">
                    ${labelHtml}
                </div>
            `;
            
            this.el.multiContainer.appendChild(el);
        });
    },

    updateMultiListUI() {
        this.el.multiList.innerHTML = '';
        this.el.multiCount.textContent = this.state.multiMoons.length;
        this.el.btnAdd.disabled = this.state.multiMoons.length >= 5;

        this.state.multiMoons.forEach(m => {
            const item = document.createElement('div');
            item.className = 'multi-list-item';
            item.innerHTML = `
                <div class="info">
                    <span class="date">${m.snapshot.ymd}</span>
                    <span class="time">${m.snapshot.timeStr}</span>
                </div>
                <button class="btn-del" onclick="exp2.removeMultiMoon(${m.id})">×</button>
            `;
            this.el.multiList.appendChild(item);
        });
    },

    renderSingleMoon(isFinalUpdate) {
        const offsetHours = parseFloat(this.el.time.value);
        let currentClockTime = (this.currentData.riseTime + offsetHours) % 24;
        this.el.timeLabel.textContent = this.formatTime(currentClockTime);

        const progress = offsetHours / this.currentData.duration; 
        const pos = this.calculatePosition(progress);

        this.el.moon.style.bottom = `${pos.bottom}%`;
        this.el.moon.style.left = `${pos.left}%`;
        this.el.moonGraphic.style.transform = `translate(-50%, -50%) rotate(${pos.rotation}deg)`;

        this.el.alt.textContent = pos.altitude.toFixed(1);
        this.el.azi.textContent = progress < 0.4 ? "東南" : (progress > 0.6 ? "西南" : "正南");

        if (isFinalUpdate) {
            const moonData = getMoonData(new Date(this.el.date.value));
            this.el.moonGraphic.innerHTML = generateMoonSVG(moonData.phase, 45);
        }
    },

    renderTrajectory() {
        const moonData = getMoonData(new Date(this.el.date.value));
        const totalDuration = this.currentData.duration;
        let firstHour = Math.ceil(this.currentData.riseTime);
        
        for (let h = 0; h <= Math.floor(totalDuration); h++) {
            const hourAt = (firstHour + h);
            const offset = (hourAt - this.currentData.riseTime);
            if (offset < 0 || offset > totalDuration) continue;

            const progress = offset / totalDuration;
            const pos = this.calculatePosition(progress);

            const point = document.createElement('div');
            point.className = 'sky-moon path-point';
            point.style.bottom = `${pos.bottom}%`;
            point.style.left = `${pos.left}%`;
            
            const displayHour = Math.floor(hourAt % 24);
            point.innerHTML = `
                <div style="transform: rotate(${pos.rotation}deg)">
                    ${generateMoonSVG(moonData.phase, 35)}
                </div>
                <div class="path-label">${displayHour}時</div>
            `;
            this.el.skyBg.appendChild(point);
        }
    },

    calculatePosition(progress) {
        const altitude = Math.sin(progress * Math.PI) * 75; 
        const horizontal = -45 + (progress * 90);
        const rotation = (progress * 120) - 60;
        return {
            altitude,
            bottom: (altitude / this.MAX_DISPLAY_ANGLE) * 100,
            left: 50 + horizontal,
            rotation,
            progress
        };
    },

    formatTime(dec) {
        return `${Math.floor(dec % 24).toString().padStart(2,'0')}:${Math.floor((dec % 1) * 60).toString().padStart(2,'0')}`;
    }
};

