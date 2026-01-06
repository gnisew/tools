/**
 * 實驗一：月相觀測獨立完整版 (完全重製)
 */

// --- 工具函數 ---
const SYNODIC_MONTH = 29.53058867; 
const KNOWN_NEW_MOON_2025 = new Date('2025-01-29T20:36:00+08:00'); 

function getMoonData(date) {
    const diffTime = date.getTime() - KNOWN_NEW_MOON_2025.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    let age = diffDays % SYNODIC_MONTH;
    if (age < 0) age += SYNODIC_MONTH;
    const phase = age / SYNODIC_MONTH;
    const illumination = ((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100).toFixed(0);

    let name = "", desc = "";
    if (age < 1.2 || age > 28.3) { name = "朔月"; desc = "農曆初一，月球在地球與太陽之間，亮面背對地球。"; }
    else if (age < 6.5) { name = "眉月"; desc = "黃昏可見於西方低空，亮面朝右。"; }
    else if (age < 8.5) { name = "上弦月"; desc = "中午升起，半夜落下，亮面在右側半圓。"; }
    else if (age < 13.5) { name = "盈凸月"; desc = "接近滿月，大部分亮面可見。"; }
    else if (age < 16.0) { name = "滿月"; desc = "日落升起，整夜可見，亮面完全朝向地球。"; }
    else if (age < 21.0) { name = "虧凸月"; desc = "滿月過後，右側開始虧損。"; }
    else if (age < 23.5) { name = "下弦月"; desc = "半夜升起，中午落下，亮面在左側半圓。"; }
    else { name = "殘月"; desc = "黎明前可見於東方低空，亮面朝左。"; }
    return { age, phase, illumination, name, desc };
}

function generateMoonSVG(phase, size) {
    const r = 45; 
    const rx = Math.cos(phase * 2 * Math.PI) * r;
    const bgColor = "#1a1d2e", lightColor = "#f4f6f0";
    const isWaxing = phase <= 0.5;
    const rightHalf = `M 50 5 A 45 45 0 0 1 50 95`, leftHalf = `M 50 95 A 45 45 0 0 1 50 5`;
    let d = isWaxing ? `${rightHalf} A ${Math.abs(rx)} 45 0 0 ${rx > 0 ? 0 : 1} 50 5` 
                     : `${leftHalf} A ${Math.abs(rx)} 45 0 0 ${rx < 0 ? 1 : 0} 50 95`;

    if (phase < 0.015 || phase > 0.985) return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><circle cx="50" cy="50" r="45" fill="${bgColor}" /></svg>`;
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><circle cx="50" cy="50" r="45" fill="${bgColor}" /><path d="${d}" fill="${lightColor}" /></svg>`;
}

function getExtendedDate(date) {
    const weekday = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' }).format(date);
    const lunarFormatter = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', { month: 'numeric', day: 'numeric' });
    const parts = lunarFormatter.formatToParts(date);
    let lMonth = parts.find(p => p.type === 'month').value;
    let lDay = parts.find(p => p.type === 'day').value;
    return { 
        fullGregorian: `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} (${weekday})`, 
        lunar: `農曆 ${lMonth}月${lDay}`
    };
}

// --- 實驗一核心邏輯 ---
const exp1 = {
    state: {
        date: new Date().toISOString().split('T')[0],
        view: 'single', 
        predictPhase: null,
        isClockwise: false, // 是否切換視角 (影響軌道起始點)
        showSunlight: false // 顯示太陽光方向
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
            viewContainer: document.getElementById('phase-view-container')
        };
    },

    init() {
        const params = new URLSearchParams(window.location.search);
        this.state.date = params.get('date') || this.state.date;
        this.state.view = params.get('mode') || 'single';
        
        if (this.el.datePicker) {
            this.el.datePicker.value = this.state.date;
            this.el.datePicker.onchange = (e) => this.updateDate(e.target.value);
        }
        this.update();
    },

    updateDate(newDate) {
        this.state.date = newDate;
        this.update();
    },

    changeDay(offset) {
        const d = new Date(this.state.date);
        d.setDate(d.getDate() + offset);
        this.updateDate(d.toISOString().split('T')[0]);
    },

    changeMonth(offset) {
        const d = new Date(this.state.date);
        d.setMonth(d.getMonth() + offset);
        this.updateDate(d.toISOString().split('T')[0]);
    },

    setToday() {
        this.updateDate(new Date().toISOString().split('T')[0]);
    },

    setView(viewName) {
        this.state.view = viewName;
        this.state.predictPhase = null;
        this.update();
    },

    predictPhases(phaseName) {
        if (!phaseName) return;
        this.state.predictPhase = phaseName;
        this.state.view = 'predict';
        this.update();
    },

    update() {
        const url = new URL(window.location);
        url.searchParams.set('date', this.state.date);
        url.searchParams.set('mode', this.state.view);
        window.history.replaceState({}, '', url);

        const selectedDate = new Date(this.state.date);
        selectedDate.setHours(12, 0, 0, 0);

        // 隱藏所有視圖
        ['single-view', 'calendarGrid', 'predict-results', 'cycle-grid'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        // 按鈕狀態
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-view-${this.state.view === 'two-months' ? 'two' : this.state.view}`);
        if (activeBtn) activeBtn.classList.add('active');

        if (this.state.view === 'single') {
            document.getElementById('single-view').style.display = 'flex';
            this.renderSingleView(selectedDate);
        } else if (this.state.view === 'predict') {
            document.getElementById('predict-results').style.display = 'grid';
            this.renderPredictView(this.state.predictPhase);
        } else if (this.state.view === 'cycle') {
            document.getElementById('cycle-grid').style.display = 'block';
            this.renderCycleView(selectedDate);
        } else {
            document.getElementById('calendarGrid').style.display = 'grid';
            this.renderCalendarView(selectedDate, this.state.view === 'month' ? 30 : 60);
        }
    },

    renderSingleView(date) {
        const data = getMoonData(date);
        const dateStr = getExtendedDate(date);
        this.el.largeMoon.innerHTML = generateMoonSVG(data.phase, 260);
        this.el.mainDate.textContent = dateStr.fullGregorian;
        this.el.subDate.textContent = dateStr.lunar;
        this.el.phaseName.textContent = data.name;
        this.el.moonAge.textContent = `${data.age.toFixed(1)} 天`;
        this.el.illumination.textContent = `${data.illumination}%`;
        this.el.phaseDesc.textContent = data.desc;
    },

    renderCalendarView(startDate, daysCount) {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';
        for (let i = 0; i < daysCount; i++) {
            const loopDate = new Date(startDate);
            loopDate.setDate(startDate.getDate() + i);
            const data = getMoonData(loopDate);
            const dateStr = getExtendedDate(loopDate);
            const cell = document.createElement('div');
            cell.className = 'cal-day';
            cell.innerHTML = `
                <div class="cal-gregorian">${loopDate.getMonth()+1}/${loopDate.getDate()}</div>
                ${generateMoonSVG(data.phase, 50)}
                <div class="cal-lunar">${dateStr.lunar}</div>
            `;
            cell.onclick = () => { this.state.date = loopDate.toISOString().split('T')[0]; this.setView('single'); };
            grid.appendChild(cell);
        }
    },

    renderCycleView(selectedDate) {
        const grid = document.getElementById('cycle-grid');
        grid.innerHTML = '';

        // 中央控制按鈕組
        const ctrlGroup = document.createElement('div');
        ctrlGroup.className = 'cycle-center-mark';
        ctrlGroup.style.flexDirection = 'column';
        ctrlGroup.style.gap = '5px';
        ctrlGroup.innerHTML = `
            <div id="btn-toggle-origin" style="cursor:pointer;">地球<br>看月相</div>
            <button id="btn-toggle-sun" style="font-size:0.7rem; padding:2px 8px; background:${this.state.showSunlight ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)'}; color:${this.state.showSunlight ? '#000' : '#fff'}; border-radius:10px;">☀ 陽光</button>
        `;
        
        ctrlGroup.querySelector('#btn-toggle-origin').onclick = (e) => {
            e.stopPropagation();
            this.state.isClockwise = !this.state.isClockwise;
            this.renderCycleView(selectedDate);
        };
        ctrlGroup.querySelector('#btn-toggle-sun').onclick = (e) => {
            e.stopPropagation();
            this.state.showSunlight = !this.state.showSunlight;
            this.renderCycleView(selectedDate);
        };
        grid.appendChild(ctrlGroup);

        // SVG 軌道
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("class", "cycle-direction-svg");
        svg.setAttribute("viewBox", "-400 -250 800 500");

        // 太陽光線繪製
		if (this.state.showSunlight) {
			const isLeft = this.state.isClockwise;
			const sunX = isLeft ? -450 : 450;
			const lightDir = isLeft ? 1 : -1;

			// 太陽發光弧形
			const sunPath = document.createElementNS(svgNS, "path");
			sunPath.setAttribute("d", `M ${sunX} -200 A 200 250 0 0 ${isLeft ? 1 : 0} ${sunX} 200 Z`);
			sunPath.setAttribute("fill", "#cc0000");
			sunPath.setAttribute("opacity", "0.4");
			svg.appendChild(sunPath);

			// 繪製 5 條帶箭頭的光線
			[-150, -75, 0, 75, 150].forEach(y => {
				const x1 = isLeft ? -400 : 400; // 起點
				const x2 = isLeft ? -320 : 320; // 終點

				// 1. 虛線主體
				const line = document.createElementNS(svgNS, "line");
				line.setAttribute("x1", x1); line.setAttribute("y1", y);
				line.setAttribute("x2", x2); line.setAttribute("y2", y);
				line.setAttribute("stroke", "#cc0000");
				line.setAttribute("stroke-width", "3");
				line.setAttribute("stroke-dasharray", "10,5");
				svg.appendChild(line);

				// 2. 箭頭尖端
				const arrow = document.createElementNS(svgNS, "path");
				const headSize = 10;
				arrow.setAttribute("d", `M ${x2} ${y} L ${x2 - lightDir*headSize} ${y-headSize} M ${x2} ${y} L ${x2 - lightDir*headSize} ${y+headSize}`);
				arrow.setAttribute("stroke", "#cc0000");
				arrow.setAttribute("stroke-width", "3");
				arrow.setAttribute("fill", "none");
				svg.appendChild(arrow);
			});
		}

        const rx = 240, ry = 160;
        const orbit = document.createElementNS(svgNS, "ellipse");
        orbit.setAttribute("cx", "0"); orbit.setAttribute("cy", "0");
        orbit.setAttribute("rx", rx); orbit.setAttribute("ry", ry);
        orbit.setAttribute("class", "orbit-path");
        svg.appendChild(orbit);
        grid.appendChild(svg);

        // 計算 8 個月相位置
        const baseAngle = this.state.isClockwise ? 180 : 0;
        const moon = getMoonData(selectedDate);
        const startDate = new Date(selectedDate);
        startDate.setDate(selectedDate.getDate() - Math.floor(moon.age));

        const stages = [
            { label: "朔月", age: 0 },    { label: "眉月", age: 3.8 },
            { label: "上弦月", age: 7.4 }, { label: "盈凸月", age: 11.2 },
            { label: "滿月", age: 14.8 },  { label: "虧凸月", age: 18.6 },
            { label: "下弦月", age: 22.2 }, { label: "殘月", age: 26.0 }
        ];

        stages.forEach((s, i) => {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + s.age);
            const data = getMoonData(d);
            const angle = (baseAngle + (-i * 45)) * (Math.PI / 180);
            const tx = Math.cos(angle) * rx;
            const ty = Math.sin(angle) * ry;

            const isSelected = d.toDateString() === selectedDate.toDateString();
            const cell = document.createElement('div');
            cell.className = `cycle-card-absolute ${isSelected ? 'is-selected' : ''}`;
            cell.style.setProperty('--tx', `${tx}px`);
            cell.style.setProperty('--ty', `${ty}px`);
            
            cell.innerHTML = `
                <div style="color:var(--accent-color); font-weight:bold; font-size:0.8rem;">${s.label}</div>
                ${generateMoonSVG(data.phase, 55)}
                <div style="font-size:0.7rem; color:var(--lunar-color);">${getExtendedDate(d).lunar}</div>
                <div style="font-size:0.6rem; color:var(--text-muted);">${d.getMonth()+1}/${d.getDate()}</div>
            `;
            cell.onclick = () => this.updateDate(d.toISOString().split('T')[0]);
            grid.appendChild(cell);
        });
    },

    renderPredictView(targetPhase) {
        const grid = document.getElementById('predict-results');
        grid.innerHTML = `<h3 style="grid-column: 1/-1; text-align: center; color: var(--accent-color); margin-bottom:15px;">未來 12 次 ${targetPhase} 預測</h3>`;
        
        // 針對不同月相設定典型的偏移天數，使圖形看起來正確
        const phaseOffsets = { "眉月": 3, "盈凸月": 3, "虧凸月": 3, "殘月": 3 };
        const offset = phaseOffsets[targetPhase] || 0;

        let count = 0, checkDate = new Date(this.state.date);
        while(count < 12) {
            checkDate.setDate(checkDate.getDate() + 1);
            const data = getMoonData(checkDate);
            if (data.name === targetPhase) {
                const typicalDate = new Date(checkDate);
                typicalDate.setDate(checkDate.getDate() + offset);
                const typicalData = getMoonData(typicalDate);

                const cell = document.createElement('div');
                cell.className = 'cal-day';
                cell.innerHTML = `
                    <div class="cal-gregorian">${checkDate.toLocaleDateString()}</div>
                    ${generateMoonSVG(typicalData.phase, 50)}
                    <div class="cal-lunar">${getExtendedDate(checkDate).lunar}</div>
                `;
                cell.onclick = () => { this.state.date = checkDate.toISOString().split('T')[0]; this.setView('single'); };
                grid.appendChild(cell);
                count++; 
                checkDate.setDate(checkDate.getDate() + 20); // 跳到下個週期
            }
        }
    }
};

window.onload = () => exp1.init();