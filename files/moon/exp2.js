const exp2 = {
    state: {
        mode: 'single', // 'single' 或 'path'
    },
    el: {
        date: document.getElementById('datePicker2'),
        time: document.getElementById('timeSlider'),
        timeLabel: document.getElementById('timeLabel'),
        moon: document.getElementById('skyMoon'),
        moonGraphic: document.getElementById('skyMoonGraphic'), 
        alt: document.getElementById('altVal'),
        azi: document.getElementById('azimuthVal'),
        riseVal: document.getElementById('riseTimeVal'),
        setVal: document.getElementById('setTimeVal'),
        skyBg: document.querySelector('.sky-bg')
    },

    currentData: { riseTime: 0, setTime: 0, duration: 12 },
    MAX_DISPLAY_ANGLE: 105, 

    init() {
        // 初始化格線
        const gridBox = document.getElementById('skyGrids10');
        gridBox.innerHTML = '';
        for (let a = 0; a <= 90; a += 10) {
            const line = document.createElement('div');
            line.className = 'grid-line';
            line.style.bottom = `${(a / this.MAX_DISPLAY_ANGLE) * 100}%`;
            line.innerHTML = `<span class="grid-label">${a}°</span>`;
            gridBox.appendChild(line);
        }

        this.setToday(false); 
        this.el.date.onchange = () => {
            this.calculateRiseSet();
            this.update(true); 
        };

        this.el.time.oninput = () => this.update(false);
        this.el.time.onchange = () => this.update(true);
        
        this.calculateRiseSet();
        this.update(true);
    },

    setMode(mode) {
        this.state.mode = mode;
        // 更新按鈕樣式
        document.getElementById('btn-pos-single').classList.toggle('active', mode === 'single');
        document.getElementById('btn-pos-path').classList.toggle('active', mode === 'path');
        this.update(true);
    },

    setToday(shouldUpdate = true) {
        this.el.date.value = new Date().toISOString().split('T')[0];
        if (shouldUpdate) { 
            this.calculateRiseSet();
            this.update(true);
        }
    },

    changeDate(offset) {
        const d = new Date(this.el.date.value);
        d.setDate(d.getDate() + offset);
        this.el.date.value = d.toISOString().split('T')[0];
        this.calculateRiseSet();
        this.update(true);
    },

    stepTime(mins) {
        let newValue = parseFloat(this.el.time.value) + (mins / 60);
        this.el.time.value = Math.max(0, Math.min(newValue, this.currentData.duration));
        this.update(true);
    },

    calculateRiseSet() {
        const date = new Date(this.el.date.value);
        const moon = getMoonData(date);
        let rise = (6 + (moon.age * 0.83)) % 24;
        let duration = 12.2; 
        let set = (rise + duration) % 24;

        this.currentData = { riseTime: rise, setTime: set, duration: duration };
        this.el.time.max = duration;
        this.el.time.step = 0.001; 
        
        this.el.riseVal.textContent = this.formatTime(rise);
        this.el.setVal.textContent = this.formatTime(set);
    },

    update(isFinalUpdate = false) {
        // 清除舊的軌跡點
        document.querySelectorAll('.path-point').forEach(p => p.remove());

        if (this.state.mode === 'path') {
            this.el.moon.style.display = 'none';
            this.renderTrajectory();
        } else {
            this.el.moon.style.display = 'flex';
            this.renderSingleMoon(isFinalUpdate);
        }
    },

    /**
     * 渲染單一時間點的月亮
     */
    renderSingleMoon(isFinalUpdate) {
        const offsetHours = parseFloat(this.el.time.value);
        let currentClockTime = (this.currentData.riseTime + offsetHours) % 24;
        this.el.timeLabel.textContent = this.formatTime(currentClockTime);

        const progress = offsetHours / this.currentData.duration; 
        const pos = this.calculatePosition(progress);

        this.el.moon.style.bottom = `${pos.bottom}%`;
        this.el.moon.style.left = `${pos.left}%`;
        this.el.moonGraphic.style.transform = `rotate(${pos.rotation}deg)`;

        this.el.alt.textContent = pos.altitude.toFixed(1);
        this.el.azi.textContent = progress < 0.4 ? "東南" : (progress > 0.6 ? "西南" : "正南");

        if (isFinalUpdate) {
            const moonData = getMoonData(new Date(this.el.date.value));
            this.el.moonGraphic.innerHTML = generateMoonSVG(moonData.phase, 45);
            this.el.moonGraphic.style.transform = `rotate(${pos.rotation}deg)`;
        }
    },

    /**
     * 渲染完整整點軌跡
     */
    renderTrajectory() {
        const moonData = getMoonData(new Date(this.el.date.value));
        const totalDuration = this.currentData.duration;
        
        // 找出第一個整點小時
        let firstHour = Math.ceil(this.currentData.riseTime);
        
        for (let h = 0; h <= Math.floor(totalDuration); h++) {
            // 計算該點相對於月出的時間偏移量
            // 例如月出 18:30，第一個整點是 19:00 (偏移 0.5hr)
            const hourAt = (firstHour + h);
            const offset = (hourAt - this.currentData.riseTime);
            
            if (offset < 0 || offset > totalDuration) continue;

            const progress = offset / totalDuration;
            const pos = this.calculatePosition(progress);

            // 創建軌跡點元素
            const point = document.createElement('div');
            point.className = 'sky-moon path-point';
            point.style.bottom = `${pos.bottom}%`;
            point.style.left = `${pos.left}%`;
            
            // 簡化顯示：僅顯示 SVG 與小時文字
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

    /**
     * 通用的位置與角度計算公式
     */
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