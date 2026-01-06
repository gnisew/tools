/**
 * 實驗六：月蝕成因觀測 - 獨立重製版 (緊湊布局/完整圖說)
 */

// 1. 月相圖形產生器 SVG
function generateMoonSVG(phase, size) {
    // 調整內部圓的大小以適應緊湊布局
    const r = 44; 
    const cx = 50, cy = 50;

    const rx = Math.cos(phase * 2 * Math.PI) * r;
    const isWaxing = phase <= 0.5;
    
    const bgColor = "#1a1d2e";
    const lightColor = "#f4f6f0";
    
    const rightHalf = `M ${cx} ${cy-r} A ${r} ${r} 0 0 1 ${cx} ${cy+r}`;
    const leftHalf = `M ${cx} ${cy+r} A ${r} ${r} 0 0 1 ${cx} ${cy-r}`;
    
    let d = "";
    if (isWaxing) {
        const sweep = rx > 0 ? 0 : 1; 
        d = `${rightHalf} A ${Math.abs(rx)} ${r} 0 0 ${sweep} ${cx} ${cy-r}`;
    } else {
        const sweep = rx < 0 ? 1 : 0;
        d = `${leftHalf} A ${Math.abs(rx)} ${r} 0 0 ${sweep} ${cx} ${cy+r}`;
    }

    if (phase < 0.02 || phase > 0.98) {
        return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${bgColor}" /></svg>`;
    }

    return `
    <svg viewBox="0 0 100 100" width="${size}" height="${size}">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${bgColor}" />
        <path d="${d}" fill="${lightColor}" />
    </svg>`;
}

const exp6 = {
    state: {
        angle: 0,
        orbitR: 110 // 配合緊湊版縮小軌道半徑
    },

    el: {
        slider: document.getElementById('lunarOrbitSliderV2'),
        angleVal: document.getElementById('angleValV2'),
        orbitMoon: document.getElementById('orbitMoonBodyV2'),
        moonLit: document.getElementById('moonLitV2'),
        groundMoon: document.getElementById('groundMoonViewV2'),
        physics: document.getElementById('physicsSvgV2'),
        chkPhysics: document.getElementById('chkShowPhysicsV2'),
        title: document.getElementById('lunarStatusTitleV2'),
        tag: document.getElementById('lunarStatusTagV2'),
        desc: document.getElementById('lunarStatusDescV2'),
        stage: document.getElementById('spaceStageV2')
    },

    init() {
        this.el.slider.oninput = (e) => {
            this.state.angle = parseInt(e.target.value);
            this.update();
        };
        this.el.chkPhysics.onchange = () => this.update();
        
        // 設置初始狀態為望月(滿月)附近，方便使用者直接看到月蝕
        this.state.angle = 180;
        this.el.slider.value = 180;

        this.update();
    },

    update() {
        const angle = this.state.angle;
        this.el.angleVal.textContent = angle;

        // --- 1. 太空視角月球位置計算 ---
        const rad = (-angle) * (Math.PI / 180); // 逆時針
        const rect = this.el.stage.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        const tx = cx + Math.cos(rad) * this.state.orbitR;
        const ty = cy + Math.sin(rad) * this.state.orbitR;

        // 修正月球中心點位移 (月球大小為 28px)
        this.el.orbitMoon.style.left = `${tx - 14}px`;
        this.el.orbitMoon.style.top = `${ty - 14}px`;

        // --- 2. 陰影判定 (角度越接近 180 越深入陰影) ---
        const distFromFull = Math.abs(angle - 180);
        let eclipseStatus = "normal";
        
        if (distFromFull <= 10) eclipseStatus = "umbra"; // 本影區
        else if (distFromFull <= 30) eclipseStatus = "penumbra"; // 半影區

        this.drawPhysicsLines(cx, cy);
        this.updateSpaceMoonColor(eclipseStatus);

        // --- 3. 更新地面望遠鏡視圖 (配合緊湊版尺寸縮小 SVG) ---
        const phase = angle / 360;
        // 望遠鏡視窗大小約 150px，SVG 設為 140px
        let moonHtml = generateMoonSVG(phase, 140);

        // 月蝕顏色濾鏡處理
        if (eclipseStatus === "umbra") {
            // 血月紅
            moonHtml = moonHtml.replace(/#f4f6f0/g, "#c0392b"); 
            moonHtml = moonHtml.replace(/#1a1d2e/g, "#4a1c1c"); 
        } else if (eclipseStatus === "penumbra") {
            // 半影灰暗
            moonHtml = moonHtml.replace(/#f4f6f0/g, "#bdc3c7"); 
        }
        
        this.el.groundMoon.innerHTML = moonHtml;

        // --- 4. 更新詳細文字資訊 ---
        this.updateInfoText(angle, eclipseStatus);
    },

    // 繪製物理光線與陰影區域 (恢復黃色光線)
    drawPhysicsLines(cx, cy) {
        if (!this.el.chkPhysics.checked) {
            this.el.physics.innerHTML = "";
            return;
        }
        // 地球視覺半徑 (CSS .earth-v2 width/2 = 30)
        const er = 30; 
        // 假設太陽右側邊緣的上下 Y 座標 (估算值，用於繪製切線)
        const sunTopY = cy - 65;
        const sunBotY = cy + 65;
        
        // 遠處的收斂點 X 座標
        const farLeft = -150; 

        // A. 本影錐體 (Umbra Cone - 深黑色三角形區域)
        // 從地球上下邊緣向左收斂
        const umbraD = `M ${cx} ${cy-er+1} L ${farLeft} ${cy} L ${cx} ${cy+er-1} Z`;

        // B. 半影區域 (Penumbra Area - 淺灰色梯形區域)
        // 從地球上下邊緣向左發散
        const penumbraD = `M ${cx} ${cy-er} L ${farLeft} ${cy-100} L ${farLeft} ${cy+100} L ${cx} ${cy+er} Z`;

        // C. 黃色太陽光線 (關鍵成因)
        // 1. 外側切線 (形成半影邊界) - 較亮較粗
        const rayOuterTop = `<line x1="100%" y1="${sunTopY-5}" x2="${cx}" y2="${cy-er}" stroke="#ffd700" stroke-width="1.5" opacity="0.7" />`;
        const rayOuterBot = `<line x1="100%" y1="${sunBotY+5}" x2="${cx}" y2="${cy+er}" stroke="#ffd700" stroke-width="1.5" opacity="0.7" />`;
        
        // 2. 內側交叉切線 (形成本影邊界) - 較細較淡
        const rayInnerTop = `<line x1="100%" y1="${sunTopY}" x2="${cx}" y2="${cy+er-1}" stroke="#ffd700" stroke-width="1" opacity="0.4" />`;
        const rayInnerBot = `<line x1="100%" y1="${sunBotY}" x2="${cx}" y2="${cy-er+1}" stroke="#ffd700" stroke-width="1" opacity="0.4" />`;

        // D. 紅色/洋紅色邊界指示線 (虛線延伸)
        const boundaryTop = `<line x1="${cx}" y1="${cy-er}" x2="0" y2="${cy-90}" stroke="rgba(255,0,220,0.5)" stroke-width="1" stroke-dasharray="4,2"/>`;
        const boundaryBot = `<line x1="${cx}" y1="${cy+er}" x2="0" y2="${cy+90}" stroke="rgba(255,0,220,0.5)" stroke-width="1" stroke-dasharray="4,2"/>`;

        // 組合 SVG 內容 (注意圖層順序：半影 > 本影 > 光線 > 指示線)
        this.el.physics.innerHTML = `
            <path d="${penumbraD}" fill="rgba(200, 200, 200, 0.1)" />
            <path d="${umbraD}" fill="rgba(0,0,0,0.85)" />
            ${rayOuterTop} ${rayOuterBot}
            ${rayInnerTop} ${rayInnerBot}
            ${boundaryTop} ${boundaryBot}
        `;
    },

    // 更新太空視角中小月球的顏色
    updateSpaceMoonColor(status) {
        const styles = {
            // 本影中：深紅背景，暗紅亮面
            umbra: { bg: "#3a0505", lit: "#8a1515" },
            // 半影中：深灰背景，灰暗亮面
            penumbra: { bg: "#1a1a1a", lit: "#666666" },
            // 正常：黑色背景，明亮亮面
            normal: { bg: "#111", lit: "#e0e0e0" }
        }[status];
        
        this.el.orbitMoon.style.background = styles.bg;
        this.el.moonLit.style.background = styles.lit;
    },

    // 更新詳細說明文字 (恢復原始的豐富內容)
    updateInfoText(angle, status) {
        let name = "", tag = "", desc = "";
        const tagEl = this.el.tag;

        if (status === "umbra") {
            name = "月全蝕 (Total Eclipse)"; 
            tag = "進入本影 (血月)";
            desc = "月球完全進入地球的本影區。此時陽光被地球阻擋，但地球大氣層會將波長較長的紅光折射到月球表面，使月亮呈現暗紅色，俗稱「血月」。這是觀察地球大氣對光線影響的最佳時機。";
            tagEl.style.background = "var(--danger-color)";
        } else if (status === "penumbra") {
            name = "半影月蝕 (Penumbral)"; 
            tag = "進入半影";
            desc = "月球進入地球的半影區。此時地球只遮擋了部分太陽光，月球表面仍然受到部分陽光照射，因此亮度只會輕微下降，肉眼不易察覺，需要仔細對比才能看出月面變暗。";
            tagEl.style.background = "#f39c12"; // 橙色警告
        } else {
            tagEl.style.background = "var(--lunar-color)"; // 正常青色
            // 詳細的月相解說
            if (angle < 10 || angle > 350) { 
                name="朔月 (新月)"; tag="農曆初一"; 
                desc="月球運行到太陽與地球之間，且三個天體大致在一條直線上。此時月球的暗面面對地球，加上與太陽同升同落，因此在地球上幾乎看不見月亮。"; 
            }
            else if (angle < 90) { 
                name="眉月 (蛾眉月)"; tag="初三~初六"; 
                desc="朔月過後，月球在軌道上逆時針移動，我們開始能看到月球右側邊緣被太陽照亮的一小部分，形狀如彎眉，在傍晚的西方天空可見。"; 
            }
            else if (angle < 100) { 
                name="上弦月 (First Quarter)"; tag="初七~初八"; 
                desc="月球運行到距離太陽東方90度的位置。此時太陽、地球、月球形成一個直角三角形，我們能看到月球右半邊明亮，左半邊黑暗，通常在中午升起，半夜落下。"; 
            }
            else if (angle < 170) { 
                name="盈凸月"; tag="十一~十三"; 
                desc="過了上弦月，月球亮面逐漸擴大，超過一半但尚未滿月。此時月球在太陽落山前就已升起，大半夜都能看見明亮的月光。"; 
            }
            else if (angle <= 190) { 
                name="滿月 (望月)"; tag="十五~十六"; 
                desc="地球位於太陽與月球之間。此時月球被太陽照亮的半球完全面對地球，我們能看到一輪明月。若此時三者精確排成一直線，就會發生月蝕。"; 
            }
            else if (angle < 270) { 
                name="虧凸月"; tag="十八~二十"; 
                desc="滿月過後，月球繼續公轉，亮面開始從右側減少。此時月球在日落後很久才升起，清晨時仍高掛天空。"; 
            }
            else if (angle < 280) { 
                name="下弦月 (Last Quarter)"; tag="廿二~廿三"; 
                desc="月球運行到距離太陽西方90度的位置。我們只能看到月球左半邊明亮。下弦月通常在半夜升起，隔天中午落下。"; 
            }
            else { 
                name="殘月 (晦月前)"; tag="廿六~廿八"; 
                desc="月球即將再次回到朔月位置，亮面只剩下左側邊緣的一彎細線。通常在黎明前的東方天空中短暫可見。"; 
            }
        }

        this.el.title.textContent = name;
        this.el.tag.textContent = tag;
        this.el.desc.textContent = desc;
    }
};

// 啟動實驗
window.onload = () => exp6.init();