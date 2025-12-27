
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('waterLevel');
    const waterBody = document.getElementById('water-body');
    const waterSurface = document.getElementById('water-surface');
    const levelText = document.getElementById('levelText');
    const stemsLayer = document.getElementById('stems-layer');
    const creaturesLayer = document.getElementById('creatures-layer');
    
    // --- 新增：天氣元素選取 ---
    const sunGroup = document.getElementById('sun-group');
    const cloudMiddleGroup = document.getElementById('cloud-middle-group'); // 修改變數名稱以利識別
    const rainLayer = document.getElementById('rain-layer');

    const svgHeight = 600;
    let currentWaterY = 0;
    let isAnyCreatureStopped = false;
    let spawnTimer = null;

    // 天氣控制變數
    let weatherInterval = null;
    let rainSpawnInterval = null;

    /* =========================================
       新增功能：隨機雲朵造型
       ========================================= */
const cloudPaths = [
  // 1. 圓潤標準雲
  "M -46 10 Q -56 0 -44 -12 Q -30 -34 0 -30 Q 30 -34 44 -12 Q 56 0 46 10 Q 30 18 0 18 Q -30 18 -46 10 Z",

  // 2. 扁圓療癒雲
  "M -55 8 Q -60 -4 -45 -10 Q -28 -30 -5 -26 Q 20 -36 42 -22 Q 60 -14 55 8 Q 30 16 0 16 Q -30 16 -55 8 Z",

  // 3. 超可愛圓球雲
  "M -40 12 Q -52 4 -38 -12 Q -24 -32 -6 -28 Q 0 -40 18 -32 Q 36 -28 42 -10 Q 52 4 40 12 Q 24 20 0 20 Q -24 20 -40 12 Z"
];



    // 隨機選一個路徑並套用
    const randomCloudPath = cloudPaths[Math.floor(Math.random() * cloudPaths.length)];
    const cloudPathElement = cloudMiddleGroup.querySelector('.cloud-path');
    if (cloudPathElement) {
        cloudPathElement.setAttribute('d', randomCloudPath);
    }

    // 定義植物連接地圖
    const plantMap = [
        { start: {x: 280, y: 510}, end: {x: 220, y: 220}, color: "#558B2F", width: 5, curvature: -25 },
        { start: {x: 285, y: 510}, end: {x: 300, y: 200}, color: "#7CB342", width: 7, curvature: 10 },
        { start: {x: 375, y: 505}, end: {x: 440, y: 300}, color: "#7CB342", width: 5, curvature: 10 },
        { start: {x: 375, y: 505}, end: {x: 400, y: 180}, color: "#558B2F", width: 7, curvature: -15 },
        { start: {x: 450, y: 505}, end: {x: 550, y: 240}, color: "#689F38", width: 4, curvature: -15 }
    ];

    // 初始化
    drawNaturalStems();
    updateSimulation(); 
    scheduleWind();
    scheduleCreatures(); 

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            if (spawnTimer) clearTimeout(spawnTimer);
        } else {
            scheduleCreatures();
        }
    });

    // --- 新增：天氣互動功能 ---

    // 1. 停止天氣效果
    function stopWeather() {
        if (weatherInterval) clearInterval(weatherInterval);
        if (rainSpawnInterval) clearInterval(rainSpawnInterval);
        weatherInterval = null;
        rainSpawnInterval = null;
        
        sunGroup.classList.remove('sun-rotating');
        cloudMiddleGroup.classList.remove('raining-cloud');
        rainLayer.innerHTML = ''; 

        dragonfly.classList.remove('wings-stop');
    }

    // 2. 點擊太陽：水位下降
    function startEvaporation() {
        stopWeather(); 
        sunGroup.classList.add('sun-rotating');
        
        dragonfly.classList.add('wings-stop');

        weatherInterval = setInterval(() => {
            let val = parseFloat(slider.value);
            if (val > 0) {
                slider.value = val - 0.6; 
                updateSimulation();
            } else {
                stopWeather();
            }
        }, 50);
    }

    // 3. 點擊中間雲朵：下雨且水位上升
    function startRain() {
        stopWeather(); 
        cloudMiddleGroup.classList.add('raining-cloud');

        dragonfly.classList.add('wings-stop');
        
        rainSpawnInterval = setInterval(spawnRainDrop, 100);

        weatherInterval = setInterval(() => {
            let val = parseFloat(slider.value);
            if (val < 100) {
                slider.value = val + 0.5; 
                updateSimulation();
            } else {
                stopWeather(); 
            }
        }, 50); 
    }


    // 4. 生成雨滴
    function spawnRainDrop() {
        if (document.hidden) return; 
        const svgNS = "http://www.w3.org/2000/svg";
        const drop = document.createElementNS(svgNS, 'line');
        const startX = 400 + Math.random() * 400;
        const startY = 140;
        
        drop.setAttribute('x1', startX);
        drop.setAttribute('y1', startY);
        drop.setAttribute('x2', startX);
        drop.setAttribute('y2', startY + 15);
        drop.classList.add('rain-drop');
        
        rainLayer.appendChild(drop);
        
        drop.addEventListener('animationend', () => {
            if (drop.parentNode) rainLayer.removeChild(drop);
        });
    }

    // 綁定事件
    sunGroup.addEventListener('click', startEvaporation);
    cloudMiddleGroup.addEventListener('click', startRain);
    
    // 當使用者手動拖拉時，停止自動天氣
    slider.addEventListener('input', () => {
        stopWeather();
        updateSimulation();
    });

    function drawNaturalStems() {
        stemsLayer.innerHTML = '';
        const svgNS = "http://www.w3.org/2000/svg";

        plantMap.forEach(p => {
            const path = document.createElementNS(svgNS, "path");
            
            const mx = (p.start.x + p.end.x) / 2;
            const my = (p.start.y + p.end.y) / 2;
            
            let offset = (p.curvature !== undefined) ? p.curvature : (Math.random() - 0.5) * 20;
            const cx = mx + offset;
            const cy = my;

            const d = `M ${p.start.x} ${p.start.y} Q ${cx} ${cy}, ${p.end.x} ${p.end.y}`;
            
            path.setAttribute('d', d);
            path.setAttribute('stroke', p.color);
            path.setAttribute('stroke-width', p.width);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke-linecap', 'round');
            
            stemsLayer.appendChild(path);
        });
    }

    function updateSimulation() {
        const val = parseInt(slider.value);
        const minWaterY = 300; 
        const maxWaterY = 450; 

        // 數值越小(低水位)，Y越大(往下)
        const newWaterY = maxWaterY - (val / 100) * (maxWaterY - minWaterY);
        currentWaterY = newWaterY;
        
        waterBody.setAttribute('y', currentWaterY);
        waterBody.setAttribute('height', svgHeight - currentWaterY);
        waterSurface.setAttribute('y1', currentWaterY);
        waterSurface.setAttribute('y2', currentWaterY);

        if (val < 20) levelText.innerText = "低水位";
        else if (val > 80) levelText.innerText = "高水位";
        else levelText.innerText = "中水位";

        updateCreaturesDepth(currentWaterY);
    }

    function updateCreaturesDepth(waterY) {
        const creatures = document.querySelectorAll('.creature-wrapper');
        const safeMargin = 25; 

        creatures.forEach(group => {
            let currentY = parseFloat(group.dataset.y);
            if (currentY < waterY + safeMargin) {
                let newY = waterY + safeMargin;
                group.setAttribute('transform', `translate(0, ${newY})`);
                group.dataset.y = newY; 
            }
        });
    }

    function scheduleWind() {
        const delay = Math.random() * 4000 + 3000;
        setTimeout(() => {
            const targets = ['flower-head', 'leaf-1', 'leaf-2', 'leaf-3', 'flower-bud'];
            const randomTarget = targets[Math.floor(Math.random() * targets.length)];
            const el = document.getElementById(randomTarget);
            
            if(el) {
                el.classList.add('swaying');
                setTimeout(() => {
                    el.classList.remove('swaying');
                    scheduleWind(); 
                }, 3000); 
            } else {
                scheduleWind();
            }
        }, delay);
    }

    function scheduleCreatures() {
        if (document.hidden) return;
        let delay = Math.random() * 8000 + 8000;
        if (isAnyCreatureStopped) delay += 8000; 
        spawnTimer = setTimeout(() => {
            spawnCreature();
            scheduleCreatures();
        }, delay);
    }

    function spawnCreature() {
        if (document.hidden) return;
        if (creaturesLayer.childElementCount > 5) return;

        const soilTop = 480; 
        const waterBottom = currentWaterY + 30; 
        if (soilTop - waterBottom < 40) return;

        const type = Math.random() > 0.4 ? 'tadpole' : 'fish';
        const safeMargin = 15; 
        const spawnY = waterBottom + safeMargin + Math.random() * (soilTop - waterBottom - safeMargin * 2);
        const dir = Math.random() > 0.5 ? 'lr' : 'rl';
        const duration = 18 + Math.random() * 10;

        const svgNS = "http://www.w3.org/2000/svg";
        
        const posYGroup = document.createElementNS(svgNS, "g");
        posYGroup.setAttribute('transform', `translate(0, ${spawnY})`);
        posYGroup.classList.add('creature-wrapper');
        posYGroup.dataset.y = spawnY; 
        
        const moveXGroup = document.createElementNS(svgNS, "g");
        moveXGroup.style.animationDuration = `${duration}s`;
        moveXGroup.classList.add(dir === 'lr' ? 'swim-lr' : 'swim-rl');

        const waveGroup = document.createElementNS(svgNS, "g");
        if (Math.random() < 0.3) {
            waveGroup.classList.add('swimming-wave');
            waveGroup.style.animationDuration = `${3 + Math.random() * 3}s`;
        }

        let svgContent = (type === 'tadpole') ? createTadpole() : createFish();
        waveGroup.innerHTML = svgContent;
        
        moveXGroup.appendChild(waveGroup);
        posYGroup.appendChild(moveXGroup);
        creaturesLayer.appendChild(posYGroup);

        if (Math.random() < 0.4) {
            const stopTime = duration * 1000 * (0.2 + Math.random() * 0.5);
            const stopDuration = 2000 + Math.random() * 3000;

            setTimeout(() => {
                if (moveXGroup && document.body.contains(moveXGroup)) {
                    moveXGroup.classList.add('paused');
                    if(waveGroup.classList.contains('swimming-wave')) waveGroup.classList.add('paused');
                    isAnyCreatureStopped = true;

                    setTimeout(() => {
                        if (moveXGroup) {
                            moveXGroup.classList.remove('paused');
                            if(waveGroup.classList.contains('swimming-wave')) waveGroup.classList.remove('paused');
                        }
                        isAnyCreatureStopped = false; 
                    }, stopDuration);
                }
            }, stopTime);
        }

        moveXGroup.addEventListener('animationend', () => {
            if (!moveXGroup.classList.contains('paused')) {
                if (posYGroup.parentNode) {
                    creaturesLayer.removeChild(posYGroup);
                }
            }
        });
    }

    function createTadpole() {
        return `
            <ellipse cx="0" cy="0" rx="8" ry="5" fill="#D7CCC8" opacity="0.9" />
            <path d="M0 0 Q -10 -2 -25 0 Q -10 2 0 0" fill="#EFEBE9" opacity="0.8" />
            <circle cx="3" cy="-2" r="1" fill="#5D4037" />
        `;
    }

    function createFish() {
        const hue = Math.floor(Math.random() * 360);
        const color = `hsl(${hue}, 60%, 75%)`; 
        const tailColor = `hsl(${hue}, 60%, 65%)`;

        return `
            <path d="M-10 0 L-22 -8 L-22 8 Z" fill="${tailColor}" />
            <ellipse cx="0" cy="0" rx="16" ry="10" fill="${color}" stroke="#666" stroke-width="0.5" />
            <circle cx="8" cy="-3" r="2.5" fill="white" />
            <circle cx="9" cy="-3" r="1.2" fill="black" />
            <path d="M-4 4 Q 0 10 6 4" fill="none" stroke="${tailColor}" stroke-width="1.5" />
        `;
    }

    /* =========================================
       新增功能：蜻蜓與互動邏輯
       ========================================= */

    // 1. 初始化蜻蜓圖層與造型
    const dragonflyLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dragonflyLayer.id = "dragonfly-layer";
    // 加在模擬區塊的最後面，確保蜻蜓在最上層
    document.getElementById('simulation').appendChild(dragonflyLayer);

    const dragonfly = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dragonfly.id = "dragonfly";
    
    // --- 修改：隨機顏色邏輯 ---
    // 定義顏色庫：紅、藍、紫、橘、綠
    const dfColors = [
        { name: 'Red', wing: '#EF9A9A', body1: '#E53935', body2: '#C62828', head: '#B71C1C' },
        { name: 'Blue', wing: '#90CAF9', body1: '#2196F3', body2: '#1976D2', head: '#0D47A1' },
        { name: 'Purple', wing: '#CE93D8', body1: '#9C27B0', body2: '#7B1FA2', head: '#4A148C' },
        { name: 'Orange', wing: '#FFCC80', body1: '#FF9800', body2: '#F57C00', head: '#E65100' },
        { name: 'Green', wing: '#A5D6A7', body1: '#8FAFA5', body2: '#5EEE5E', head: '#5E5E80' }
    ];
    
    // 隨機選一組顏色
    const randomColor = dfColors[Math.floor(Math.random() * dfColors.length)];

    // 繪製簡單的蜻蜓 (將變數帶入 SVG)
    dragonfly.innerHTML = `
        <g class="dragonfly-visual">
            <!-- 翅膀 (半透明) -->
            <g class="dragonfly-wings" fill="rgba(255, 255, 255, 0.5)" stroke="${randomColor.wing}" stroke-width="0.5">
                <ellipse cx="-12" cy="-4" rx="16" ry="4" transform="rotate(10)" />
                <ellipse cx="12" cy="-4" rx="16" ry="4" transform="rotate(-10)" />
                <ellipse cx="-10" cy="-2" rx="14" ry="3" transform="rotate(-5)" />
                <ellipse cx="10" cy="-2" rx="14" ry="3" transform="rotate(5)" />
            </g>
            <!-- 身體 -->
            <ellipse cx="0" cy="5" rx="2" ry="14" fill="${randomColor.body1}" /> <!-- 腹部 -->
            <ellipse cx="0" cy="-6" rx="3.5" ry="5" fill="${randomColor.body2}" /> <!-- 胸部 -->
            <circle cx="0" cy="-12" r="4" fill="${randomColor.head}" /> <!-- 頭部 -->
            <!-- 眼睛 -->
            <circle cx="-2" cy="-14" r="1.5" fill="white" opacity="0.9" />
            <circle cx="2" cy="-14" r="1.5" fill="white" opacity="0.9" />
        </g>
    `;

    // 初始位置設定 (在空中)
    let currentDfX = -40;
    let currentDfY = 200;
    dragonfly.setAttribute('transform', `translate(${currentDfX}, ${currentDfY})`);
    dragonflyLayer.appendChild(dragonfly);

    // 2. 定義目標植物與其座標 (修改版：加入 range 隨機範圍參數)
    const targets = [
        // range: 代表以中心點為圓心，向外擴散的隨機半徑 (數值越大，落點越分散)
        { id: 'leaf-1', x: 200, y: 240, offset: {x: 0, y: -25}, range: 35 },
        { id: 'flower-head', x: 300, y: 210, offset: {x: 0, y: -45}, range: 30 }, // 花朵範圍較集中
        { id: 'flower-bud', x: 440, y: 270, offset: {x: 0, y: -25}, range: 10 },  // 花苞很小，範圍設小
        { id: 'leaf-2', x: 400, y: 180, offset: {x: 0, y: -40}, range: 30 }, // 大葉子，範圍最大
        { id: 'leaf-3', x: 550, y: 240, offset: {x: 0, y: -20}, range: 20 }
    ];

    let dfAnimationId = null;

    // 3. 綁定點擊事件 (修改版：點擊時計算隨機落點)
    targets.forEach(t => {
        const el = document.getElementById(t.id);
        if(el) {
            el.style.pointerEvents = "all"; 
            
            el.addEventListener('click', (e) => {
                e.stopPropagation(); 
                
                // --- 修改重點：計算隨機偏移 ---
                // (Math.random() - 0.5) * 2 會產生 -1 到 1 之間的數
                // 再乘上 t.range，就會在設定的範圍內隨機產生座標
                const randomX = (Math.random() - 0.5) * 2 * t.range;
                const randomY = (Math.random() - 0.5) * 2 * t.range;

                // 最終目標 = 基礎位置(x) + 中心修正(offset) + 隨機偏移(random)
                flyTo(t.x + t.offset.x + randomX, t.y + t.offset.y + randomY);
            });
        }
    });
    // 4. 飛行函式 (修正版：移除降落時的隨機跳動，改為平滑停下)
    function flyTo(targetX, targetY) {
		dragonfly.classList.remove('wings-stop');
        if (dfAnimationId) cancelAnimationFrame(dfAnimationId);

        const startX = currentDfX;
        const startY = currentDfY;
        
        // 設定隨機控制點 (讓路徑變彎曲)
        const offsetX = (Math.random() - 0.5) * 400; 
        const offsetY = (Math.random() - 0.5) * 300 - 50;
        const cpX = (startX + targetX) / 2 + offsetX;
        const cpY = (startY + targetY) / 2 + offsetY;

        // 計算距離決定飛行時間
        const dist = Math.sqrt((targetX - startX)**2 + (targetY - startY)**2);
        const duration = Math.min(2000, Math.max(1000, dist * 20)); 
        const startTime = performance.now();

        // 用來記錄最後的角度，避免停止時計算錯誤
        let lastAngle = 0;
        
        // 嘗試讀取當前角度，如果是第一次飛則預設為 0
        const currentTransform = dragonfly.getAttribute('transform');
        if (currentTransform && currentTransform.includes('rotate')) {
            const match = currentTransform.match(/rotate\(([^)]+)\)/);
            if (match) lastAngle = parseFloat(match[1]);
        }

        function step(now) {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            
            // 緩動效果
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            // 二次貝茲曲線公式
            const nextX = (1 - ease) * (1 - ease) * startX + 2 * (1 - ease) * ease * cpX + ease * ease * targetX;
            const nextY = (1 - ease) * (1 - ease) * startY + 2 * (1 - ease) * ease * cpY + ease * ease * targetY;

            // 計算位移向量
            const dx = nextX - currentDfX;
            const dy = nextY - currentDfY;
            
            // 只有當還有在移動時，才更新角度 (避免最後重疊時數值亂跳)
            if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
                // 1. 基礎飛行角度 (+90度修正頭朝上)
                const flightAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
                
                // 2. 搖晃效果 (Wobble)
                // 重點修正：乘以 (1 - ease)，讓搖晃隨著接近目標而慢慢消失，直到變為 0
                const wobble = Math.sin(now / 100) * 10 * (1 - ease); 
                
                lastAngle = flightAngle + wobble;
            }

            // 更新位置與旋轉
            dragonfly.setAttribute('transform', `translate(${nextX}, ${nextY}) rotate(${lastAngle})`);
            
            // 更新當前座標
            currentDfX = nextX;
            currentDfY = nextY;

            if (t < 1) {
                dfAnimationId = requestAnimationFrame(step);
            }
        }
        dfAnimationId = requestAnimationFrame(step);
    }
});

