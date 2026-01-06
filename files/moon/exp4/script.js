/**
 * 實驗四：高度角觀測器 核心邏輯
 */

// 基礎工具：生成月亮圖形
function generateMoonSVG(phase, size) {
    const r = 45; const rx = Math.cos(phase * 2 * Math.PI) * r;
    const bgColor = "#1a1d2e", lightColor = "#f4f6f0";
    const isWaxing = phase <= 0.5;
    const rightHalf = `M 50 5 A 45 45 0 0 1 50 95`, leftHalf = `M 50 95 A 45 45 0 0 1 50 5`;
    let d = isWaxing ? `${rightHalf} A ${Math.abs(rx)} 45 0 0 ${rx > 0 ? 0 : 1} 50 5` : `${leftHalf} A ${Math.abs(rx)} 45 0 0 ${rx < 0 ? 1 : 0} 50 95`;
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><circle cx="50" cy="50" r="45" fill="${bgColor}" /><path d="${d}" fill="${lightColor}" /></svg>`;
}

const exp6 = {
    state: {
        mode: 'learn',
        toolAngle: 0,
        moonAltitude: 30,
        pivotX: 0,
        pivotY: 0,
        orbitRadius: 240, // 增加半徑使弧度更明顯
        gameScore: 0,
        gameLevel: 1,
        isMatched: false
    },

    el: {
        container: document.getElementById('exp6ToolContainer'),
        tool: document.getElementById('clinometerTool'),
        plumb: document.getElementById('plumbLineExp6'),
        moon: document.getElementById('exp6Moon'),
        sky: document.getElementById('exp6SkyZone'),
        orbitPath: document.getElementById('exp6OrbitPath'),
        scaleGroup: document.getElementById('exp6ScaleGroup'),
        
        sliderTool: document.getElementById('toolRotateSlider'),
        sliderMoon: document.getElementById('moonPosSlider'),
        moonRow: document.getElementById('moon-slider-row'),
        
        btnCheck: document.getElementById('btn-check-align'),
        btnNext: document.getElementById('btn-next-level'),
        hint: document.getElementById('exp6Feedback'),
        
        valTool: document.getElementById('displayToolAngle'),
        statsDisplay: document.getElementById('game-stats'),
        lvlDisplay: document.getElementById('game-level'),
        scoreDisplay: document.getElementById('game-score')
    },

    init() {
        this.renderScales();
        // 確保佈局穩定後再計算
        setTimeout(() => {
             this.calculatePivot();
             this.update();
        }, 400);
        
        this.el.sliderTool.oninput = (e) => {
            this.state.toolAngle = parseInt(e.target.value);
            this.update();
        };

        this.el.sliderMoon.oninput = (e) => {
            if (this.state.mode === 'learn') {
                this.state.moonAltitude = parseInt(e.target.value);
                this.update();
            }
        };

        window.addEventListener('resize', () => {
            this.calculatePivot();
            this.update();
        });
    },

    setMode(mode) {
        this.state.mode = mode;
        this.state.isMatched = false;
        this.el.sliderTool.disabled = false;
        
        document.getElementById('btn-tool-learn').classList.toggle('active', mode === 'learn');
        document.getElementById('btn-tool-game').classList.toggle('active', mode === 'game');
        
        this.el.moonRow.style.display = (mode === 'learn') ? 'block' : 'none';
        this.el.statsDisplay.style.display = (mode === 'game') ? 'block' : 'none';
        this.el.btnCheck.style.display = (mode === 'game') ? 'block' : 'none';
        this.el.btnNext.style.display = 'none';
        this.el.hint.innerHTML = "";

        if (mode === 'game') {
            this.state.gameLevel = 1;
            this.state.gameScore = 0;
            this.updateStats();
            this.randomizeMoon();
        } else {
            this.state.moonAltitude = parseInt(this.el.sliderMoon.value);
            this.update();
        }
    },

    randomizeMoon() {
        // 生成 15~80 度的隨機仰角
        this.state.moonAltitude = Math.floor(Math.random() * 65) + 15;
        this.update();
    },

    checkAlignment() {
        const diff = Math.abs(this.state.toolAngle - this.state.moonAltitude);
        if (diff <= 5) {
            this.state.isMatched = true;
            this.state.gameScore++;
            this.updateStats();
            this.el.hint.innerHTML = `<span class="feedback-text success">🎯 準確對準！誤差 ${diff}°</span>`;
            this.el.sliderTool.disabled = true;
            this.el.btnCheck.style.display = "none";
            this.el.btnNext.style.display = "block";
        } else if (diff <= 20){
            this.el.hint.innerHTML = `<span class="feedback-text fail">❌ 誤差很小了°，再微調一下</span>`;
        } else {
            this.el.hint.innerHTML = `<span class="feedback-text fail">❌ 誤差太大了°，再微調一下</span>`;
        }
    },

    nextLevel() {
        this.state.gameLevel++;
        this.state.isMatched = false;
        this.updateStats();
        this.el.hint.innerHTML = "";
        this.el.btnNext.style.display = "none";
        this.el.btnCheck.style.display = "block";
        this.el.sliderTool.disabled = false;
        this.randomizeMoon();
    },

    updateStats() {
        this.el.lvlDisplay.textContent = this.state.gameLevel;
        this.el.scoreDisplay.textContent = this.state.gameScore;
    },

    calculatePivot() {
        const skyRect = this.el.sky.getBoundingClientRect();
        const toolRect = this.el.container.getBoundingClientRect();
        // pivotX 是工具軸心相對於天空容器左邊的距離
        this.state.pivotX = (toolRect.left - skyRect.left) + 10;
        this.state.pivotY = (toolRect.top - skyRect.top) + 10;
        this.drawOrbitLine();
    },

    drawOrbitLine() {
        const r = this.state.orbitRadius;
        const cx = this.state.pivotX;
        const cy = this.state.pivotY;
        // 繪製觀測軌道虛線
        const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r}`;
        this.el.orbitPath.setAttribute('d', d);
    },

    renderScales() {
        let l = ""; let t = ""; const cx = 10, cy = 10; const r = 80;
        for (let i = 0; i <= 90; i += 10) {
            const rad = (90 - i) * (Math.PI / 180);
            const x1 = cx + Math.cos(rad) * r, y1 = cy + Math.sin(rad) * r;
            const x2 = cx + Math.cos(rad) * (r - 10), y2 = cy + Math.sin(rad) * (r - 10);
            l += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#333" stroke-width="1" />`;
            const tx = cx + Math.cos(rad) * (r - 20), ty = cy + Math.sin(rad) * (r - 20);
            t += `<text x="${tx}" y="${ty}" font-size="7" font-weight="bold" text-anchor="middle" dominant-baseline="middle" transform="rotate(${90-i}, ${tx}, ${ty})">${i}</text>`;
        }
        this.el.scaleGroup.innerHTML = l + t;
    },

    update() {
        const angle = this.state.toolAngle;
        const target = this.state.moonAltitude;
        const r = this.state.orbitRadius;

        const moonRad = (180 + target) * (Math.PI / 180);
        this.el.moon.style.left = `${this.state.pivotX + Math.cos(moonRad) * r}px`;
        this.el.moon.style.top = `${this.state.pivotY + Math.sin(moonRad) * r}px`;
        
        if (typeof generateMoonSVG === 'function') {
            this.el.moon.innerHTML = generateMoonSVG(0.5, 32); 
        }

        this.el.tool.style.transform = `rotate(${angle}deg)`;
        this.el.plumb.style.transform = `rotate(${-angle}deg)`;
        this.el.valTool.textContent = angle;

        if (this.state.mode === 'learn') {
            const diff = Math.abs(angle - target);
            if (diff <= 5) {
                this.el.hint.innerHTML = `<span class="feedback-text success">🎯 對準圓心了！</span>`;
            } else { this.el.hint.innerHTML = ""; }
        }
    }
};

window.onload = () => exp6.init();