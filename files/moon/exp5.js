/**
 * 實驗五：月相成因與月蝕 (物理連動與完整月相版)
 * 整合了太空視角(成因)與地面視角(結果)，並包含詳細月相說明與月蝕模擬。
 */
const exp5 = {
    state: {
        angle: 0, // 軌道角度 (0:朔, 90:上弦, 180:滿/蝕, 270:下弦)
        orbitR: 120 // 軌道像素半徑 (配合 CSS 的 width: 300px)
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
        if (!this.el.slider) return;
        // 綁定滑桿事件
        this.el.slider.oninput = (e) => {
            this.state.angle = parseInt(e.target.value);
            this.update();
        };
        // 初始化視圖
        this.update();
    },

    update() {
        const angle = this.state.angle;
        this.el.angleVal.textContent = angle;

        // --- 1. 計算太空視角中的月球位置 ---
        // 角度轉弧度。為了實現逆時針公轉且 0 度在右側太陽方向：
        // 使用負角度進行計算 (Math.cos(-a) = cos(a), Math.sin(-a) = -sin(a))
        const rad = (-angle) * (Math.PI / 180);
        
        // 取得舞台中心點
        const rect = this.el.stage.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;

        // 計算目標位置
        const targetX = cx + Math.cos(rad) * this.state.orbitR;
        const targetY = cy + Math.sin(rad) * this.state.orbitR;

        // 更新 DOM 位置 (減去自身寬度一半以置中)
        this.el.orbitMoon.style.left = `${targetX - 12}px`;
        this.el.orbitMoon.style.top = `${targetY - 12}px`;

        // --- 2. 陰影與光線判定 ---
        // 判斷是否進入地影區 (在 180 度附近)
        const distFromFull = Math.abs(angle - 180);
        let status = "normal"; // 狀態: normal(一般), penumbra(半影), umbra(本影)
        
        if (distFromFull <= 11) status = "umbra";      // 本影區範圍 (較窄)
        else if (distFromFull <= 32) status = "penumbra"; // 半影區範圍 (較寬)

        // 繪製物理光影層 (SVG)
        this.drawPhysics(cx, cy);
        // 更新太空月球的顏色 (模擬進入陰影變暗/變紅)
        this.updateSpaceMoonAppearance(status);

        // --- 3. 更新地面觀測視角 (SVG 月相) ---
        // 計算月相相位 (0.0 ~ 1.0)
        const phase = angle / 360;
        // 呼叫 utils.js 中的函數生成基礎月相 SVG
        let moonHtml = generateMoonSVG(phase, 150);

        // 處理月蝕特殊顏色效果
        if (status === "umbra") {
            // 月全蝕：變為血紅色
            moonHtml = moonHtml.replace(/#f4f6f0/g, "#9a2222"); // 亮部變深紅
            moonHtml = moonHtml.replace(/#1a1d2e/g, "#2a0a0a"); // 暗部變極深紅
        } else if (status === "penumbra") {
            // 半影月蝕：整體變暗淡灰階
            moonHtml = moonHtml.replace(/#f4f6f0/g, "#aaaaaa");
            moonHtml = moonHtml.replace(/#1a1d2e/g, "#111111");
        }
        this.el.groundMoon.innerHTML = moonHtml;

        // --- 4. 更新文字解說資訊 ---
        this.updateInfoText(angle, status);
    },

    // 繪製 SVG 光線與陰影
    drawPhysics(cx, cy) {
        if (!this.el.chkPhysics.checked) {
            this.el.physics.innerHTML = "";
            return;
        }

        const er = 32; // 地球半徑估算值 (用於計算切線)
        
        // 本影路徑 (Umbra): 向左收束的深色三角形區域
        const umbraPath = `M ${cx} ${cy-er+2} L ${cx-520} ${cy-er+35} L ${cx-520} ${cy+er-35} L ${cx} ${cy+er-2} Z`;

        // 半影路徑 (Penumbra): 向左發散的較亮梯形區域
        const penumbraPath = `M ${cx} ${cy-er} L 0 ${cy-120} L 0 ${cy+120} L ${cx} ${cy+er} Z`;

        this.el.physics.innerHTML = `
            <line x1="100%" y1="${cy-er-30}" x2="${cx}" y2="${cy-er+2}" stroke="rgba(255,0,220,0.8)" stroke-width="1.5" stroke-dasharray="5,3"/>
            <line x1="100%" y1="${cy+er+30}" x2="${cx}" y2="${cy+er-2}" stroke="rgba(255,0,220,0.8)" stroke-width="1.5" stroke-dasharray="5,3"/>


            <line x1="100%" y1="${cy-er-30}" x2="${cx}" y2="${cy-er+64}" stroke="rgba(255,220,0,0.6)" stroke-width="1.5" stroke-dasharray="5,3"/>
            <line x1="100%" y1="${cy+er+30}" x2="${cx}" y2="${cy+er-64}" stroke="rgba(255,220,0,0.6)" stroke-width="1.5" stroke-dasharray="5,3"/>
            
            <path d="${penumbraPath}" fill="rgba(200, 200, 200, 0.4)" />
            
            <path d="${umbraPath}" fill="rgba(0,0,0,0.8)" />
        `;
    },

    // 更新太空視圖中月球本體的顏色
    updateSpaceMoonAppearance(status) {
        if (status === "umbra") {
            // 進入本影：變紅 (血月現象)
            this.el.orbitMoon.style.background = "#3a0000"; // 背光面極深紅
            this.el.orbitMoon.style.borderColor = "#500";
            this.el.moonLit.style.background = "#8a2222";   // 受光面暗紅
        } else if (status === "penumbra") {
            // 進入半影：變暗 (亮度下降)
            this.el.orbitMoon.style.background = "#0a0a0a";
            this.el.orbitMoon.style.borderColor = "#333";
            this.el.moonLit.style.background = "#777777";   // 受光面變灰暗
        } else {
            // 正常狀態
            this.el.orbitMoon.style.background = "#111";
            this.el.orbitMoon.style.borderColor = "rgba(255,255,255,0.1)";
            this.el.moonLit.style.background = "#e0e0e0";   // 受光面正常亮
        }
    },

    // 【重點修改】更新詳細月相解說文字
    updateInfoText(angle, status) {
        let name = "", tag = "", desc = "";

        // 優先判斷月蝕狀態 (在滿月附近)
        if (status === "umbra") {
             name = "月全蝕 (Total Lunar Eclipse)"; 
             tag = "農曆十五~十六 (進入本影)"; 
             desc = "月球完全進入地球的本影區。由於地球大氣層散射藍光，只折射紅光照射到月面上，因此月亮呈現黯淡的古銅色或紅色，俗稱「血月」。";
        } else if (status === "penumbra") {
             name = "半影月蝕 (Penumbral Eclipse)"; 
             tag = "農曆十五~十六 (進入半影)"; 
             desc = "月球只進入地球的半影區，並未進入本影。此時月面的亮度只會輕微減弱，變得稍顯昏暗，肉眼不易察覺變化。";
        } else {
            // 非月蝕期間，根據角度判斷 8 種主要月相
            // 使用角度範圍來界定，中心點為 0, 90, 180, 270
            if (angle >= 350 || angle < 10) {
                name = "朔月 / 新月 (New Moon)"; tag = "農曆初一"; 
                desc = "月球運行到太陽與地球之間，受光面完全背對地球，因此在地面上看不見月亮。日月同升同落。";
            } else if (angle >= 10 && angle < 85) {
                name = "眉月 (Waxing Crescent)"; tag = "農曆初三~初六"; 
                desc = "月球逆時針公轉，開始露出右側一小部分受光面，形狀如彎眉。黃昏時見於西方天空，隨後落下。";
            } else if (angle >= 85 && angle < 95) {
                name = "上弦月 (First Quarter)"; tag = "農曆初七~初八"; 
                desc = "日、地、月三者連線大致成直角。我們可以看到月球右半邊明亮。中午月出，黃昏可見於天頂附近，半夜月落。";
            } else if (angle >= 95 && angle < 170) {
                name = "盈凸月 (Waxing Gibbous)"; tag = "農曆十一~十三"; 
                desc = "月球亮面持續擴大，呈現凸起的形狀，已超過半圓。午後月出，整夜大部分時間可見。";
            } else if (angle >= 170 && angle <= 190) {
                 // 注意：這裡的範圍雖然包含 180，但前面的 if(status) 會優先攔截月蝕狀況
                 // 這裡處理的是「沒有發生月蝕的滿月」
                name = "滿月 / 望月 (Full Moon)"; tag = "農曆十五~十六"; 
                desc = "地球位於太陽與月球之間，月球受光面完全朝向地球，看起來是一輪明月。傍晚日落時月出，清晨日出時月落。";
            } else if (angle > 190 && angle < 265) {
                name = "虧凸月 (Waning Gibbous)"; tag = "農曆十八~二十"; 
                desc = "滿月過後，月球受光面開始從右側縮小，左側依然明亮。黃昏後月出，清晨可見於西方。";
            } else if (angle >= 265 && angle < 275) {
                name = "下弦月 (Last Quarter)"; tag = "農曆廿二~廿三"; 
                desc = "日、地、月再次成直角位置。我們看到月球左半邊明亮。半夜月出，清晨日出時位於天頂附近。";
            } else if (angle >= 275 && angle < 350) {
                name = "殘月 (Waning Crescent)"; tag = "農曆廿六~廿八"; 
                desc = "月相接近朔月，只剩下左側一絲彎眉狀的亮面。黎明前升起於東方天空，隨即被太陽光輝掩蓋。";
            }
        }

        this.el.title.textContent = name;
        this.el.tag.textContent = tag;
        this.el.desc.textContent = desc;
        // 更新標籤顏色提示 (月蝕時用特殊色，平時用預設色)
        this.el.tag.style.setProperty('--lunar-color', (status !== 'normal') ? '#ffcccb' : '#e0e0e0');
    }
};