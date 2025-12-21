/**
 * 實驗一：月相觀測核心邏輯 - 2025 圓形週期整合版
 */
const exp1 = {
    state: {
        date: null,
        view: 'single', 
        predictPhase: null,
		isClockwise: false,
		showSunlight: false
    },

    get el() {
        return {
            datePicker: document.getElementById('datePicker1'),
            largeMoon: document.getElementById('largeMoon'),
            mainDate: document.getElementById('displayDate1'),
            subDate: document.getElementById('displayDateSub'),
            phaseName: document.getElementById('phaseName'),
            moonAge: document.getElementById('moonAge'),
            illumination: document.getElementById('illumination'),
            phaseDesc: document.getElementById('phaseDesc'),
            phaseView: document.getElementById('view-phase'),
            phaseSelector: document.getElementById('phaseSelector')
        };
    },

    init() {
        // 從 URL 恢復狀態
        this.state.date = router.params.get('date') || new Date().toISOString().split('T')[0];
        this.state.view = router.params.get('mode') || 'single';
        this.state.predictPhase = router.params.get('phase') || null;
        
        if (this.el.datePicker) {
            this.el.datePicker.value = this.state.date;
            this.el.datePicker.onchange = (e) => this.updateDate(e.target.value);
        }

        if (this.el.phaseSelector && this.state.predictPhase) {
            this.el.phaseSelector.value = this.state.predictPhase;
        }

        this.update();
    },

    // --- 日期控制 ---
    setToday() {
        this.updateDate(new Date().toISOString().split('T')[0]);
    },

    changeMonth(offset) {
        const d = new Date(this.state.date);
        d.setMonth(d.getMonth() + offset);
        this.updateDate(d.toISOString().split('T')[0]);
    },

    changeDay(offset) {
        const d = new Date(this.state.date);
        d.setDate(d.getDate() + offset);
        this.updateDate(d.toISOString().split('T')[0]);
    },

    updateDate(newDate) {
        this.state.date = newDate;
        if (this.el.datePicker) this.el.datePicker.value = newDate;
        this.update();
    },

    // --- 視圖切換 ---
    setView(viewName) {
        this.state.view = viewName;
        this.state.predictPhase = null;
        if (this.el.phaseSelector) this.el.phaseSelector.value = "";
        this.update();
    },

    predictPhases(phaseName) {
        if (!phaseName) {
            this.setView('single');
            return;
        }
        this.state.predictPhase = phaseName;
        this.state.view = 'predict';
        this.update();
    },

    // --- 核心更新函式 (整合所有視圖開關) ---
    update() {
        router.updateURL({
            date: this.state.date,
            mode: this.state.view,
            phase: this.state.predictPhase || '' 
        });

        const selectedDate = new Date(this.state.date);
        selectedDate.setHours(12, 0, 0, 0);

        // 1. 更新按鈕狀態
        document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
        const btnMap = { 
            'single': 'btn-view-single', 
            'month': 'btn-view-month', 
            'two-months': 'btn-view-two',
            'cycle': 'btn-view-cycle'
        };
        if (btnMap[this.state.view]) {
            document.getElementById(btnMap[this.state.view])?.classList.add('active');
        }

        // 2. 獲取或建立容器
        const singleView = document.querySelector('.single-view-layout');
        let calGrid = document.getElementById('calendarGrid');
        let predictGrid = document.getElementById('predict-results');
        let cycleGrid = document.getElementById('cycle-grid');

        if (!calGrid) {
            calGrid = document.createElement('div');
            calGrid.id = 'calendarGrid';
            calGrid.className = 'calendar-grid';
            this.el.phaseView.appendChild(calGrid);
        }
        if (!predictGrid) {
            predictGrid = document.createElement('div');
            predictGrid.id = 'predict-results';
            predictGrid.className = 'predict-grid';
            this.el.phaseView.appendChild(predictGrid);
        }
        if (!cycleGrid) {
            cycleGrid = document.createElement('div');
            cycleGrid.id = 'cycle-grid';
            cycleGrid.className = 'cycle-grid-container';
            this.el.phaseView.appendChild(cycleGrid);
        }

        // 3. 顯示/隱藏控制 (確保切換時不衝突)
        singleView.style.display = (this.state.view === 'single') ? 'flex' : 'none';
        calGrid.style.display = (this.state.view === 'month' || this.state.view === 'two-months') ? 'grid' : 'none';
        predictGrid.style.display = (this.state.view === 'predict') ? 'grid' : 'none';
        cycleGrid.style.display = (this.state.view === 'cycle') ? 'block' : 'none';

        // 4. 執行渲染
        if (this.state.view === 'single') {
            this.renderSingleView(selectedDate);
        } else if (this.state.view === 'predict') {
            this.renderPredictView(this.state.predictPhase);
        } else if (this.state.view === 'cycle') {
            this.renderCycleView(selectedDate);
        } else {
            const days = this.state.view === 'month' ? 30 : 60;
            this.renderCalendarView(selectedDate, days);
        }
    },

    renderSingleView(date) {
        const data = getMoonData(date);
        const dateStrings = this.formatDateStrings(date);
        if (this.el.largeMoon) this.el.largeMoon.innerHTML = generateMoonSVG(data.phase, 260);
        if (this.el.mainDate) this.el.mainDate.textContent = dateStrings.gregorianWithWeek;
        if (this.el.subDate) {
            this.el.subDate.style.display = 'block';
            this.el.subDate.textContent = dateStrings.lunarConcise; 
        }
        if (this.el.phaseName) this.el.phaseName.textContent = data.name;
        if (this.el.moonAge) this.el.moonAge.textContent = `${data.age.toFixed(1)} 天`;
        if (this.el.illumination) this.el.illumination.textContent = `${data.illumination}%`;
        if (this.el.phaseDesc) this.el.phaseDesc.textContent = data.desc;
    },

    renderCalendarView(startDate, daysCount) {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        for (let i = 0; i < daysCount; i++) {
            const loopDate = new Date(startDate);
            loopDate.setDate(startDate.getDate() + i);
            const data = getMoonData(loopDate);
            const dateStrings = this.formatDateStrings(loopDate);
            const cell = document.createElement('div');
            cell.className = 'cal-day';
            cell.innerHTML = `
                <div class="cal-gregorian">${loopDate.getMonth()+1}/${loopDate.getDate()} <span class="cal-weekday">${dateStrings.weekdayShort}</span></div>
                <div class="cal-moon">${generateMoonSVG(data.phase, 45)}</div>
                <div class="cal-lunar">${dateStrings.lunarConcise}</div>
            `;
            cell.onclick = () => {
                this.state.date = loopDate.toISOString().split('T')[0];
                this.setView('single');
            };
            grid.appendChild(cell);
        }
    },

    renderCycleView(selectedDate) {
        const grid = document.getElementById('cycle-grid');
        grid.innerHTML = '';

        // 1. 中央控制區：包含「起點切換」與「太陽光開關」
        const ctrlGroup = document.createElement('div');
        ctrlGroup.className = 'cycle-center-mark';
        ctrlGroup.style.flexDirection = 'column';
        ctrlGroup.style.gap = '8px';
        ctrlGroup.style.zIndex = '10'; 
        
        ctrlGroup.innerHTML = `
            <div id="btn-toggle-origin" style="cursor:pointer; user-select:none;">地球<br>看月相</div>
            <button id="btn-toggle-sun" style="font-size:0.7rem; padding:4px 10px; cursor:pointer; background:rgba(255,255,255,0.1); color:var(--accent-color); border:0px solid var(--accent-color); border-radius:12px; transition:all 0.3s;">
                ☀ ${this.state.showSunlight ? '' : ''}
            </button>
        `;
        
        ctrlGroup.querySelector('#btn-toggle-origin').onclick = (e) => {
            e.stopPropagation();
            this.state.isClockwise = !this.state.isClockwise;
            this.renderCycleView(selectedDate);
        };

        const sunBtn = ctrlGroup.querySelector('#btn-toggle-sun');
        if(this.state.showSunlight) {
            sunBtn.style.background = 'var(--accent-color)';
            sunBtn.style.color = '#000';
        }
        sunBtn.onclick = (e) => {
            e.stopPropagation();
            this.state.showSunlight = !this.state.showSunlight;
            this.renderCycleView(selectedDate);
        };
        grid.appendChild(ctrlGroup);

        // 2. SVG 畫布設定
        const isWide = window.innerWidth > 768;
        const rx = isWide ? 240 : 130; 
        const ry = isWide ? 180 : 130; 
        const orX = rx + (isWide ? 50 : 45);
        const orY = ry + (isWide ? 50 : 45);
        
        const baseAngle = this.state.isClockwise ? 180 : 0;
        const stepDir = -1; // 始終逆時針

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("class", "cycle-direction-svg");
        svg.setAttribute("viewBox", "-500 -350 1000 700"); 

        // --- 3. 繪製太陽與光線 (依據 isClockwise 切換左右) ---
        if (this.state.showSunlight) {
            const sunGroup = document.createElementNS(svgNS, "g");
            const isLeft = this.state.isClockwise; // true 為朔月在左，太陽在左
            const sunSideX = isLeft ? -700 : 700;
            const lightDir = isLeft ? 1 : -1; // 光線方向：1 向右，-1 向左

            // 太陽弧形 (邊緣巨大的半圓)
            const sunPath = document.createElementNS(svgNS, "path");
            const d = `M ${sunSideX} -300 A 300 400 0 0 ${isLeft ? 1 : 0} ${sunSideX} 300 Z`;
            sunPath.setAttribute("d", d);
            sunPath.setAttribute("fill", "#cc0000"); // 深紅色
            sunPath.setAttribute("opacity", "0.9");
            sunGroup.appendChild(sunPath);

            // 太陽光束 (紅色平行虛線)
            const yPositions = [-260, -140, 0, 140, 260];
            yPositions.forEach(y => {
                const lineGroup = document.createElementNS(svgNS, "g");
                
                // 虛線
                const line = document.createElementNS(svgNS, "line");
                const startX = isLeft ? -600 : 600;
                const endX = isLeft ? -500 : 500;
                line.setAttribute("x1", startX);
                line.setAttribute("y1", y);
                line.setAttribute("x2", endX);
                line.setAttribute("y2", y);
                line.setAttribute("stroke", "#cc0000");
                line.setAttribute("stroke-width", "4");
                line.setAttribute("stroke-dasharray", "15,10");
                lineGroup.appendChild(line);

                // 箭頭
                const arrow = document.createElementNS(svgNS, "path");
                const arrowX = endX;
                const headSize = 10;
                arrow.setAttribute("d", `M ${arrowX} ${y} L ${arrowX - lightDir*headSize} ${y-headSize} M ${arrowX} ${y} L ${arrowX - lightDir*headSize} ${y+headSize}`);
                arrow.setAttribute("stroke", "#cc0000");
                arrow.setAttribute("stroke-width", "4");
                arrow.setAttribute("fill", "none");
                lineGroup.appendChild(arrow);
                
                sunGroup.appendChild(lineGroup);
            });

            svg.appendChild(sunGroup);
        }

        // --- 4. 繪製軌道與卡片 (其餘邏輯不變) ---
        const getXY = (deg) => {
            const rad = deg * (Math.PI / 180);
            return { x: Math.cos(rad) * orX, y: Math.sin(rad) * orY };
        };

        const startPt = getXY(baseAngle);
        const endAngle = baseAngle + (stepDir * 340);
        const endPt = getXY(endAngle);
        const pathD = `M ${startPt.x} ${startPt.y} A ${orX} ${orY} 0 1 0 ${endPt.x} ${endPt.y}`;
        
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", pathD);
        path.setAttribute("class", "orbit-path");
        const arrowAngle = endAngle + (stepDir * 90);
        const trackArrow = document.createElementNS(svgNS, "path");
        trackArrow.setAttribute("class", "orbit-arrow");
        trackArrow.setAttribute("d", `M 0 -12 L 18 0 L 0 12 Z`);
        trackArrow.setAttribute("transform", `translate(${endPt.x}, ${endPt.y}) rotate(${arrowAngle})`);

        svg.appendChild(path);
        svg.appendChild(trackArrow);
        grid.appendChild(svg);

        const moon = getMoonData(selectedDate);
        const startDate = new Date(selectedDate);
        startDate.setDate(selectedDate.getDate() - Math.floor(moon.age));
        const stages = [
            { age: 0, label: "朔月" },    { age: 3.8, label: "眉月" },
            { age: 7.4, label: "上弦月" }, { age: 11.2, label: "盈凸月" },
            { age: 14.8, label: "滿月" },  { age: 18.6, label: "虧凸月" },
            { age: 22.2, label: "下弦月" }, { age: 26.0, label: "殘月" }
        ];

        stages.forEach((s, i) => {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + s.age);
            const data = getMoonData(d);
            const dateStr = this.formatDateStrings(d);
            const isSelected = d.toDateString() === selectedDate.toDateString();
            const angle = (baseAngle + (stepDir * i * 45)) * (Math.PI / 180);
            const tx = Math.cos(angle) * rx;
            const ty = Math.sin(angle) * ry;

            const cell = document.createElement('div');
            cell.className = `cycle-card-absolute ${isSelected ? 'is-selected' : ''}`;
            cell.style.setProperty('--tx', `${tx}px`);
            cell.style.setProperty('--ty', `${ty}px`);
            cell.style.zIndex = '5';

            const iconSize = isWide ? 55 : 38;
            cell.innerHTML = `
                <div style="color:var(--accent-color); font-weight:bold; font-size:0.8rem;">${s.label}</div>
                <div style="margin:4px 0;">${generateMoonSVG(data.phase, iconSize)}</div>
                <div style="text-align:center;">
                    <div style="color:var(--lunar-color); font-size:0.75rem;">${dateStr.lunarConcise}</div>
                    <div style="color:var(--text-muted); font-size:0.65rem;">${d.getMonth()+1}/${d.getDate()}</div>
                </div>
            `;
            cell.onclick = () => this.updateDate(d.toISOString().split('T')[0]);
            grid.appendChild(cell);
        });
    },

renderPredictView(targetPhase) {
        const grid = document.getElementById('predict-results');
        grid.innerHTML = `<h3 style="grid-column: 1/-1; color: var(--accent-color); text-align: center; margin-bottom: 15px;">未來 12 次 ${targetPhase} 預測</h3>`;
        
        let count = 0;
        let checkDate = new Date(this.state.date);
        
        // 針對不同月相設定「偏移天數」，使其顯示在該月相最典型的日期
        const phaseOffsets = { "虧凸月": 3, "盈凸月": 3, "眉月": 3, "殘月": 3, "朔月": 0, "滿月": 0, "上弦月": 0, "下弦月": 0 };
        const offset = phaseOffsets[targetPhase] || 0;

        for (let s = 0; s < 500 && count < 12; s++) {
            checkDate.setDate(checkDate.getDate() + 1);
            const data = getMoonData(checkDate);
            
            if (data.name === targetPhase) {
                // 找到第一天後，加上偏移天數來取得典型的月相圖形
                const typicalDate = new Date(checkDate);
                typicalDate.setDate(checkDate.getDate() + offset);
                const typicalData = getMoonData(typicalDate);
                
                const dateStr = this.formatDateStrings(checkDate);
                const cardDateStr = checkDate.toISOString().split('T')[0];

                const cell = document.createElement('div');
                cell.className = 'cal-day';
                cell.innerHTML = `
                    <div class="cal-gregorian">${checkDate.getFullYear()}/${checkDate.getMonth()+1}/${checkDate.getDate()}</div>
                    <div class="cal-moon">${generateMoonSVG(typicalData.phase, 45)}</div>
                    <div class="cal-lunar">${dateStr.lunarConcise}</div>
                `;
                cell.onclick = () => { 
                    this.updateDate(cardDateStr); 
                    this.setView('single'); 
                };
                grid.appendChild(cell);
                count++; 
                checkDate.setDate(checkDate.getDate() + 20); // 跳到下一個週期
            }
        }
    },

    formatDateStrings(date) {
        const weekday = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' }).format(date);
        const gregorianWithWeek = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} (${weekday})`;
        const lunar = getExtendedDate(date).lunar;
        return { gregorianWithWeek, lunarConcise: lunar, weekdayShort: weekday };
    }
};

//================================;
















/**
 * 實驗二
 */
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

















//================================
/**
 * 實驗三：高度角觀測
 * 支援：幾何中心對齊、基準線保留、鍵盤方向鍵控制
 */
const exp3 = {
    state: {
        centerEmojis: ['🧐','🔭','👩‍🚀','👀','🌟','🌈','🌚'],
        showLines: true,
        showTexts: true
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
        chkLines: document.getElementById('chkShowLines'),
        chkTexts: document.getElementById('chkShowTexts')
    },

    CENTER_X: 300, 
    CENTER_Y: 340,   
    RADIUS: 235,     
    MOON_ORBIT_RADIUS: 300, 

    init() {
        this.el.svg.setAttribute('viewBox', '0 0 600 400');
        this.el.centerIcon.style.left = `${this.CENTER_X}px`;
        this.el.centerIcon.style.top = `${this.CENTER_Y}px`;

        this.drawProtractor();
        this.el.date.onchange = () => { this.calculateData(true); this.update(); };
        this.el.time.oninput = () => this.update();
        this.el.centerIcon.onclick = () => this.randomizeCenterIcon();
        
        const initDate = router.params.get('date') || new Date().toISOString().split('T')[0];
        this.el.date.value = initDate;

        // 加入鍵盤監聽器
        window.addEventListener('keydown', (e) => {
            if (router.params.get('exp') !== 'altitude') return;
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.stepTime(-1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); this.stepTime(1); }
            if (e.key === 'ArrowUp') { e.preventDefault(); this.stepTime(10); }
            if (e.key === 'ArrowDown') { e.preventDefault(); this.stepTime(-10); }
        });
        
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
            const textR = this.RADIUS + 35;
            const tx = this.CENTER_X + Math.cos(rad) * textR;
            const ty = this.CENTER_Y - Math.sin(rad) * textR;
            html += `<text x="${tx}" y="${ty}" class="protractor-text flip-fix" text-anchor="middle" dominant-baseline="middle">${a}°</text>`;
        }
        html += `</g>`;

        html += `
            <g class="side-label-group">
                <text x="${this.CENTER_X + this.RADIUS + 15}" y="${this.CENTER_Y + 28}" class="guide-text flip-fix" text-anchor="end">
                    <tspan id="svgAziVal">--</tspan>
                    <tspan id="svgDegVal" style="fill: var(--accent-color); font-weight: bold;"></tspan> 地平線
                </text>
            </g>
        `;
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
        this.el.time.max = Math.floor(this.currentData.duration * 60);
        if (resetToCenter) this.el.time.value = Math.floor(this.el.time.max / 8);
    },

    stepTime(mins) {
        let newValue = parseInt(this.el.time.value) + mins;
        this.el.time.value = Math.max(0, Math.min(newValue, this.el.time.max));
        this.update();
    },

    update() {
        const date = new Date(this.el.date.value);
        const offsetMins = parseInt(this.el.time.value);
        const offsetHours = offsetMins / 60;
        const progress = offsetHours / this.currentData.duration;
        const maxAltToday = getRealisticMaxAltitude(date);
        const altitude = Math.sin(progress * Math.PI) * maxAltToday;

        let aziLabel = "";
        if (progress < 0.1) aziLabel = "東";
        else if (progress < 0.35) aziLabel = "東南";
        else if (progress <= 0.65) aziLabel = "南";
        else if (progress < 0.9) aziLabel = "西南";
        else aziLabel = "西";

        document.getElementById('intermediateLinesGroup').style.display = this.state.showLines ? 'block' : 'none';
        document.getElementById('scaleTextsGroup').style.display = this.state.showTexts ? 'block' : 'none';

        const svgAzi = document.getElementById('svgAziVal');
        const svgDeg = document.getElementById('svgDegVal');
        if (svgAzi) svgAzi.textContent = aziLabel;
        if (svgDeg) svgDeg.textContent = this.state.showTexts ? `(${altitude.toFixed(1)}°)` : "";

        const isEast = progress < 0.5;
        this.el.box.classList.toggle('east-side', isEast);
        const clockTime = (this.currentData.riseTime + offsetHours) % 24;
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













//=============================

/**
 * 實驗四：日月食模擬邏輯 (優化版 - 參考教學圖檔)
 */
const exp4 = {
    state: {
        mode: 'total', // 'total', 'annular', 'lunar'
        progress: 0,   // 0 ~ 100
        isAnimating: false
    },

    el: {
        canvas: document.getElementById('eclipseCanvas'),
        slider: document.getElementById('eclipseSlider'),
        title: document.getElementById('eclipseTitle'),
        status: document.getElementById('eclipseStatus'),
        percent: document.getElementById('eclipsePercent'),
        type: document.getElementById('eclipseType')
    },

    init() {
        this.el.slider.oninput = (e) => {
            this.state.progress = parseInt(e.target.value);
            this.update();
        };
        this.update();
    },

    setMode(mode) {
        this.state.mode = mode;
        this.state.progress = 0;
        this.el.slider.value = 0;
        
        // 更新 UI 狀態
        document.getElementById('btn-eclipse-total').classList.toggle('active', mode === 'total');
        document.getElementById('btn-eclipse-annular').classList.toggle('active', mode === 'annular');
        document.getElementById('btn-eclipse-lunar').classList.toggle('active', mode === 'lunar');
        
        this.update();
    },

    update() {
        // 清空並繪製背景與標籤
        const label = { 'total': '日全食觀測', 'annular': '日環食觀測', 'lunar': '月食觀測' }[this.state.mode];
        this.el.canvas.innerHTML = `<div class="view-label">${label}</div>
                                   <div class="dir-label left">東</div>
                                   <div class="dir-label right">西</div>`;
        
        if (this.state.mode === 'total' || this.state.mode === 'annular') {
            this.renderSolarEclipse();
        } else {
            this.renderLunarEclipse();
        }
    },

    renderSolarEclipse() {
        // 月球移動：由右(西)向左(東)移動，符合圖 3 邏輯
        const moveX = (50 - this.state.progress) * 5; 
        const isAnnular = this.state.mode === 'annular';
        
        // 1. 太陽
        const sun = document.createElement('div');
        sun.className = 'celestial sun-glow';
        
        // 2. 日冕 (僅全食且接近 50% 時顯示)
        const corona = document.createElement('div');
        corona.className = 'corona';
        const dist = Math.abs(this.state.progress - 50);
        corona.style.opacity = (!isAnnular && dist < 3) ? 1 : 0;
        
        // 3. 月球
        const moon = document.createElement('div');
        moon.className = 'celestial moon-body';
        // 若為環食，月球看起來較小 (對應圖 2 本影未接觸地面)
        const moonScale = isAnnular ? 0.92 : 1.05;
        moon.style.transform = `translateX(${moveX}px) scale(${moonScale})`;
        moon.style.background = '#000';
        moon.style.boxShadow = 'none';

        this.el.canvas.appendChild(corona);
        this.el.canvas.appendChild(sun);
        this.el.canvas.appendChild(moon);

        // 4. 更新階段標籤 (參考圖 3)
        this.updateEclipseInfo(dist);
    },

    updateEclipseInfo(dist) {
        const p = this.state.progress;
        let stage = "";
        let desc = "";

        if (p === 0) stage = "準備觀測";
        else if (p < 48) stage = "階段一：初虧 (First Contact)";
        else if (p >= 48 && p < 50) stage = "階段二：蝕既 (Second Contact)";
        else if (p === 50) stage = "階段三：蝕甚 (Totality / Maximum)";
        else if (p > 50 && p <= 52) stage = "階段四：生光 (Third Contact)";
        else stage = "階段五：復圓 (Fourth Contact)";

        if (this.state.mode === 'annular' && p === 50) {
            stage = "階段三：環食始/終 (Annular Maximum)";
            desc = "月球位於遠地點，視覺直徑小於太陽，形成金環。";
        } else if (this.state.mode === 'total') {
            desc = "月球位於近地點，完全遮蔽太陽光球，可見日冕。";
        }

        this.el.title.textContent = this.state.mode === 'total' ? "日全食模擬" : "日環食模擬";
        this.el.type.textContent = stage;
        this.el.status.textContent = desc + " (月球由西向東公轉，故從太陽西側開始遮掩)";
        this.el.percent.textContent = `模擬進度: ${p}%`;
    },

    renderLunarEclipse() {
        const moveX = (this.state.progress - 50) * 4;
        
        // 建立地球影區
        const penumbra = document.createElement('div');
        penumbra.className = 'penumbra';
        
        const umbra = document.createElement('div');
        umbra.className = 'celestial earth-shadow';
        
        // 建立月球
        const moon = document.createElement('div');
        moon.className = 'celestial moon-body moon-lunar-eclipse';
        moon.style.transform = `translateX(${moveX}px)`;
        
        // 月食變色邏輯 (進入本影變紅)
        const dist = Math.abs(this.state.progress - 50);
        if (dist < 20) {
            // 血月色
            const redAmount = 100 - (dist * 3);
            moon.style.background = `rgb(${redAmount + 50}, 30, 30)`;
            moon.style.boxShadow = `0 0 20px rgba(255,0,0,0.3)`;
        } else {
            moon.style.background = '#666';
            moon.style.boxShadow = 'inset -10px -10px 20px #000';
        }

        this.el.canvas.appendChild(penumbra);
        this.el.canvas.appendChild(umbra);
        this.el.canvas.appendChild(moon);

        // 更新資訊
        this.el.title.textContent = "月食 (Lunar Eclipse)";
        this.el.percent.textContent = dist < 25 ? "狀態: 進入本影" : "狀態: 進入半影";
        
        if (dist > 45) this.el.type.textContent = "狀態: 半影食";
        else if (dist > 20) this.el.type.textContent = "狀態: 偏食";
        else this.el.type.textContent = "狀態: 全食 (血月)";
        
        this.el.status.textContent = "當月球進入地球的陰影，太陽光被地球遮擋。紅光經大氣折射使月亮呈現暗紅色。";
    }
};