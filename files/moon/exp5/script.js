/**
 * 實驗五：日月食模擬 獨立邏輯
 */

const exp5 = {
    state: {
        mode: 'total', // total: 日全食, annular: 日環食, lunar: 月食
        progress: 0,
        isAnimating: false,
        timer: null
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
        
        // 更新按鈕狀態
        document.querySelectorAll('.pill').forEach(btn => {
            btn.classList.toggle('active', btn.id === `btn-eclipse-${mode}`);
        });
        
        this.update();
    },

    update() {
        // 清空並保留基礎標籤
        const labelText = { 'total': '日全食觀測', 'annular': '日環食觀測', 'lunar': '月食觀測' }[this.state.mode];
        this.el.canvas.innerHTML = `
            <div class="view-label">${labelText}</div>
            <div class="dir-label left">東</div>
            <div class="dir-label right">西</div>
        `;
        
        if (this.state.mode === 'lunar') {
            this.renderLunarEclipse();
        } else {
            this.renderSolarEclipse();
        }
    },

    renderSolarEclipse() {
        // 月球移動：由西(右)向東(左)移動
        const moveX = (50 - this.state.progress) * 6; 
        const isAnnular = this.state.mode === 'annular';
        const dist = Math.abs(this.state.progress - 50);
        
        // 背景隨食甚變暗
        const bgBrightness = dist < 10 ? (dist / 10) : 1;
        this.el.canvas.style.background = `radial-gradient(circle, #050a15 0%, #000 ${bgBrightness * 100}%)`;

        // 1. 日冕 (全食且接近 50% 時顯示)
        const corona = document.createElement('div');
        corona.className = 'corona';
        corona.style.opacity = (!isAnnular && dist < 3) ? 1 : 0;
        
        // 2. 太陽
        const sun = document.createElement('div');
        sun.className = 'celestial sun-glow';
        if (isAnnular) sun.style.boxShadow = '0 0 20px #fff, 0 0 40px #ffcc00';
        
        // 3. 月球
        const moon = document.createElement('div');
        moon.className = 'celestial moon-body';
        const moonScale = isAnnular ? 0.93 : 1.06; // 環食時月球較小
        moon.style.transform = `translateX(${moveX}px) scale(${moonScale})`;
        moon.style.background = '#000';

        this.el.canvas.appendChild(corona);
        this.el.canvas.appendChild(sun);
        this.el.canvas.appendChild(moon);

        this.updateInfo(dist);
    },

    renderLunarEclipse() {
        // 月食移動：月球由西向東進入地影
        const moveX = (this.state.progress - 50) * 5;
        const dist = Math.abs(this.state.progress - 50);
        
        const penumbra = document.createElement('div');
        penumbra.className = 'penumbra';
        
        const umbra = document.createElement('div');
        umbra.className = 'celestial earth-shadow';
        
        const moon = document.createElement('div');
        moon.className = 'celestial moon-body';
        moon.style.transform = `translateX(${moveX}px)`;
        
        // 血月變色邏輯
        if (dist < 20) {
            const red = 150 - (dist * 4);
            moon.style.background = `rgb(${red}, 40, 30)`;
            moon.style.boxShadow = `0 0 30px rgba(255,0,0,0.4)`;
        } else {
            moon.style.background = '#666';
        }

        this.el.canvas.appendChild(penumbra);
        this.el.canvas.appendChild(umbra);
        this.el.canvas.appendChild(moon);

        this.updateInfo(dist);
    },

    updateInfo(dist) {
        const p = this.state.progress;
        let stage = "", desc = "";

        if (this.state.mode === 'lunar') {
            this.el.title.textContent = "月食模擬 (Lunar Eclipse)";
            if (p === 50) stage = "蝕甚：月全食";
            else if (dist < 20) stage = "生光 / 蝕既";
            else stage = "初虧 / 復圓";
            desc = "月球進入地球本影時，因大氣折射紅光而呈現古銅色。";
        } else {
            this.el.title.textContent = this.state.mode === 'total' ? "日全食模擬" : "日環食模擬";
            if (p === 50) stage = this.state.mode === 'total' ? "蝕甚：太陽完全被遮蔽" : "蝕甚：形成金環";
            else stage = p < 50 ? "階段：初虧" : "階段：復圓";
            desc = "月球公轉由西向東，遮掩過程從太陽西側(右側)開始。";
        }

        this.el.type.textContent = `狀態: ${stage}`;
        this.el.status.textContent = desc;
        this.el.percent.textContent = `模擬進度: ${p}%`;
    },

    playAnimation() {
        if (this.state.isAnimating) return;
        this.state.isAnimating = true;
        this.state.progress = 0;
        
        const run = () => {
            if (this.state.progress >= 100) {
                this.state.isAnimating = false;
                return;
            }
            this.state.progress++;
            this.el.slider.value = this.state.progress;
            this.update();
            setTimeout(run, 50);
        };
        run();
    }
};

window.onload = () => exp5.init();