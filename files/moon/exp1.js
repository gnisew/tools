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