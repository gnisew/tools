document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('waterLevel');
    const waterBody = document.getElementById('water-body');
    const waterSurface = document.getElementById('water-surface');
    const levelText = document.getElementById('levelText');
    const plantsContainer = document.getElementById('plants-container');
    const creaturesLayer = document.getElementById('creatures-layer');

    // --- 新增：天氣元素選取 ---
    const sunGroup = document.getElementById('sun-group');
    const cloudMiddle = document.getElementById('cloud-middle-group');
    const rainLayer = document.getElementById('rain-layer');

    const svgHeight = 580;
    const soilY = 480; 
    let currentWaterY = 200;
    let spawnTimer = null;
    let isAnyCreatureStopped = false; // 追蹤是否有生物正在停頓

    // 天氣控制變數
    let weatherInterval = null;
    let rainSpawnInterval = null;

// 鴨子相關變數
    let duckData = {
        el: null,
        active: false,
        x: 0,
        spawnTimeout: null,
        state: 'IDLE', // IDLE, SWIMMING, LEAVING
        speed: 1.2
    };
    const duckLayer = document.getElementById('duck-layer');



    const plantConfigs = [
        { x: 240, maxHeight: 220, bendDir: -1 },
        { x: 360, maxHeight: 250, bendDir: 1 },
        { x: 500, maxHeight: 230, bendDir: 1 },
        { x: 600, maxHeight: 200, bendDir: 1 }
    ];

    // 初始化植物
    plantConfigs.forEach((config, i) => {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.id = `plant-cluster-${i}`;
        
        const root = document.createElementNS("http://www.w3.org/2000/svg", "use");
        root.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#plant-root");
        root.setAttribute('x', config.x);
        root.setAttribute('y', soilY);
        
        const rootScale = 0.8 + Math.random() * 0.4;
        const rootRotate = (Math.random() - 0.5) * 30;
        root.style.transformOrigin = `${config.x}px ${soilY}px`;
        root.style.transform = `scale(${rootScale}) rotate(${rootRotate}deg)`;
        
        group.appendChild(root);

        const stem = document.createElementNS("http://www.w3.org/2000/svg", "path");
        stem.classList.add('main-stem');
        stem.setAttribute('fill', 'none');
        stem.setAttribute('stroke', '#388E3C');
        stem.setAttribute('stroke-width', '5');
        stem.setAttribute('stroke-linecap', 'round');
        
        const leaves = document.createElementNS("http://www.w3.org/2000/svg", "g");
        leaves.classList.add('leaves-group');

        group.appendChild(stem);
        group.appendChild(leaves);
        plantsContainer.appendChild(group);
    });

    // --- 新增：天氣互動功能 ---

    // 1. 停止天氣效果
    function stopWeather() {
        if (weatherInterval) clearInterval(weatherInterval);
        if (rainSpawnInterval) clearInterval(rainSpawnInterval);
        weatherInterval = null;
        rainSpawnInterval = null;
        
        // 移除視覺效果
        sunGroup.classList.remove('sun-rotating');
        cloudMiddle.classList.remove('raining-cloud');
        rainLayer.innerHTML = ''; 
    }

    // 2. 點擊太陽：水位下降
    function startEvaporation() {
        stopWeather(); 
        sunGroup.classList.add('sun-rotating');
        
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

    // 3. 點擊雲朵：下雨且水位上升
    function startRain() {
        stopWeather(); 
        cloudMiddle.classList.add('raining-cloud');
        
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
        // 在雲朵下方隨機生成 (約 x: 620~740)
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

    // 綁定天氣事件
    sunGroup.addEventListener('click', startEvaporation);
    cloudMiddle.addEventListener('click', startRain);


let landCreatureData = {
    el: null,
    active: false,
    x: 0,
    spawnTimeout: null,
    state: 'IDLE', 
    speed: 1.0
};

function updateSimulation() {
    const val = parseInt(slider.value);
    currentWaterY = 460 - (val / 100) * 280;
    
    waterBody.setAttribute('y', currentWaterY);
    waterBody.setAttribute('height', svgHeight - currentWaterY);
    waterSurface.setAttribute('y1', currentWaterY);
    waterSurface.setAttribute('y2', currentWaterY);

    levelText.innerText = val < 30 ? "低水位" : val > 70 ? "高水位" : "中水位";
    
    // --- 高水位邏輯 (原本的) ---
    if (val >= 100) {
        if (!duckData.active && !duckData.spawnTimeout) {
            duckData.spawnTimeout = setTimeout(() => spawnDuck(), 2000);
        }
    } else {
        if (duckData.spawnTimeout) { clearTimeout(duckData.spawnTimeout); duckData.spawnTimeout = null; }
        if (duckData.active && duckData.state !== 'LEAVING') dismissDuck();
    }

    if (val <= 0) {
        if (!landCreatureData.active && !landCreatureData.spawnTimeout) {
            landCreatureData.spawnTimeout = setTimeout(() => spawnLandCreature(), 1500);
        }
    } else {
        if (landCreatureData.spawnTimeout) { 
            clearTimeout(landCreatureData.spawnTimeout); 
            landCreatureData.spawnTimeout = null; 
        }
        if (landCreatureData.active && landCreatureData.state !== 'LEAVING') dismissLandCreature();
    }

    plantConfigs.forEach((config, i) => updatePlant(i, currentWaterY, config));
    updateCreaturesDepth(currentWaterY);
}


function spawnLandCreature() {
    if (landCreatureData.active) return;
    landCreatureData.active = true;
    landCreatureData.state = 'ENTERING'; // 初始狀態：進入中

    const landEmojis = ['🐌', '🦕', '🦖', '🪿', '🦤'];
    const randomEmoji = landEmojis[Math.floor(Math.random() * landEmojis.length)];

    // 蝸牛特別慢，其他動物正常
    landCreatureData.speed = (randomEmoji === '🐌') ? 0.3 : (0.8 + Math.random() * 0.5);

    // 決定從哪邊出現
    const side = Math.random() > 0.5 ? -80 : 880;
    landCreatureData.x = side;
    // 進入畫面的目標點 (約在畫面中間 200~600 之間)
    landCreatureData.targetX = 200 + Math.random() * 400;

    const svgNS = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(svgNS, "g");
    
    // 【修正點 1】在加入圖層前，先設定好初始位置，防止在 (0,0) 閃現
    g.setAttribute('transform', `translate(${side}, 475)`);
    
    const text = document.createElementNS(svgNS, "text");
    text.innerHTML = randomEmoji;
    text.setAttribute('class', 'duck-emoji land-creature-clickable');

    if (side < 400) text.classList.add('duck-facing-right');

    g.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!text.classList.contains('jumping')) {
            text.classList.add('jumping');
            setTimeout(() => text.classList.remove('jumping'), 500);
        }
    });

    g.appendChild(text);
    duckLayer.appendChild(g); 
    landCreatureData.el = g;

    // 開始跑 AI 邏輯
    requestAnimationFrame(updateLandCreatureAI);
}

function updateLandCreatureAI() {
    if (!landCreatureData.active) return;
    
    // 如果目前是「停留等待」狀態，不執行位移更新，直到計時器結束切換狀態
    if (landCreatureData.state === 'WAITING') return;

    const emoji = landCreatureData.el.querySelector('.duck-emoji');
    const dx = landCreatureData.targetX - landCreatureData.x;

    // 位移邏輯
    if (Math.abs(dx) > 5) {
        landCreatureData.x += Math.sign(dx) * landCreatureData.speed;
        if (dx > 0) emoji.classList.add('duck-facing-right');
        else emoji.classList.remove('duck-facing-right');
    } else {
        // 到達目標後的動作
        if (landCreatureData.state === 'ENTERING') {
            landCreatureData.state = 'WAITING';
            const stayTime = 2000 + Math.random() * 3000; // 2~5 秒
            
            setTimeout(() => {
                if (landCreatureData.active) {
                    dismissLandCreature(); // 切換為 LEAVING 狀態
                    requestAnimationFrame(updateLandCreatureAI); // 重新啟動動畫循環
                }
            }, stayTime);
            return; // 暫時跳出，不執行下面的 setAttribute
        } else if (landCreatureData.state === 'LEAVING') {
            removeLandCreature(); // 走出畫面後移除
            return;
        }
    }

    landCreatureData.el.setAttribute('transform', `translate(${landCreatureData.x}, 475)`);
    
    if (landCreatureData.active) {
        requestAnimationFrame(updateLandCreatureAI);
    }
}

function dismissLandCreature() {
    if (!landCreatureData.active) return;
    landCreatureData.state = 'LEAVING';
    landCreatureData.speed = 8; // 走出去時稍微快一點點
    // 離場目標：如果是左半邊就往左走，右半邊就往右走
    landCreatureData.targetX = landCreatureData.x > 400 ? 900 : -100;
}

function removeLandCreature() {
    landCreatureData.active = false;
    landCreatureData.spawnTimeout = null;
    if (landCreatureData.el && landCreatureData.el.parentNode) {
        duckLayer.removeChild(landCreatureData.el);
    }
    landCreatureData.el = null;
}

    function updatePlant(id, waterY, config) {
        const group = document.getElementById(`plant-cluster-${id}`);
        const stem = group.querySelector('.main-stem');
        const leavesGroup = group.querySelector('.leaves-group');
        leavesGroup.innerHTML = ''; 

        const absolutePlantTopY = soilY - config.maxHeight;
        const surfaceContactY = waterY + 6;

        let pathD = '';
        if (surfaceContactY > absolutePlantTopY) {
            const excessHeight = surfaceContactY - absolutePlantTopY;
            const bendOffset = excessHeight * 0.7 * config.bendDir; 
            const targetX = config.x + bendOffset;
            const cp1y = soilY - (config.maxHeight * 0.5); 
            const cp2x = config.x + bendOffset * 0.8; 
            const cp2y = surfaceContactY + 2; 
            pathD = `M ${config.x} ${soilY} C ${config.x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${surfaceContactY}`;
        } else {
            const naturalSway = config.bendDir * 5; 
            pathD = `M ${config.x} ${soilY} Q ${config.x + naturalSway} ${(soilY + absolutePlantTopY)/2}, ${config.x} ${absolutePlantTopY}`;
        }

        stem.setAttribute('d', pathD);

        const pathLength = stem.getTotalLength();
        const step = 22; 
        const leafCount = Math.floor(pathLength / step);

        for(let j=1; j <= leafCount; j++) {
            const t = j / Math.max(1, leafCount); 
            const point = stem.getPointAtLength(pathLength * t);
            const whorl = document.createElementNS("http://www.w3.org/2000/svg", "use");
            whorl.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#leaf-whorl");
            whorl.setAttribute('x', point.x);
            whorl.setAttribute('y', point.y);
            const scale = 0.8 - (t * 0.2);
            whorl.setAttribute('transform', `scale(${scale})`);
            whorl.style.transformOrigin = `${point.x}px ${point.y}px`;
            leavesGroup.appendChild(whorl);
        }
    }

    function updateCreaturesDepth(waterY) {
        const creatures = document.querySelectorAll('.creature-wrapper');
        const safeMargin = 35; 
        creatures.forEach(group => {
            let currentY = parseFloat(group.dataset.y);
            if (currentY < waterY + safeMargin) {
                let newY = Math.min(waterY + safeMargin + (Math.random() * 20), soilY - 20);
                group.setAttribute('transform', `translate(0, ${newY})`);
                group.dataset.y = newY; 
            }
        });
    }
function spawnDuck() {
    if (duckData.active) return;
    duckData.active = true;
    duckData.state = 'SWIMMING';
    // 稍微調整速度，讓天鵝或小雞游動速度有差異
    duckData.speed = 0.8 + Math.random() * 0.5;

    // 1. 新增：隨機選擇 Emoji
    const duckEmojis = ['🐣', '🦢', '🦆'];
    const randomEmoji = duckEmojis[Math.floor(Math.random() * duckEmojis.length)];

    // 2. 確定起始位置：-80 (左側外) 或 880 (右側外)，確保不會在中間直接出現
    const side = Math.random() > 0.5 ? -80 : 880;
    duckData.x = side;
    
    // 設定第一個目標點（游進畫面中心區域）
    duckData.targetX = 200 + Math.random() * 400;

    const svgNS = "http://www.w3.org/2000/svg";
    const g = document.createElementNS(svgNS, "g");
    g.classList.add('duck-group');
    
    const text = document.createElementNS(svgNS, "text");
    // 使用隨機選取的 Emoji
    text.innerHTML = randomEmoji;
    text.setAttribute('class', 'duck-emoji');

    // 判斷初始朝向：如果是從左邊 (-80) 出來，就要面向右邊
    if (side < 400) {
        text.classList.add('duck-facing-right');
    } else {
        text.classList.remove('duck-facing-right');
    }

    g.appendChild(text);
    duckLayer.appendChild(g);
    duckData.el = g;

    requestAnimationFrame(updateDuckAI);
}

    function updateDuckAI() {
        if (!duckData.active) return;

        const emoji = duckData.el.querySelector('.duck-emoji');
        const dx = duckData.targetX - duckData.x;

        // 1. 移動邏輯
        if (Math.abs(dx) > 5) {
            duckData.x += Math.sign(dx) * duckData.speed;
            // 更新朝向
            if (dx > 0) emoji.classList.add('duck-facing-right');
            else emoji.classList.remove('duck-facing-right');
        } else {
            if (duckData.state === 'LEAVING') {
                removeDuck();
                return;
            }
            // 到達隨機點，換下一個目標
            duckData.targetX = 100 + Math.random() * 600;
        }

        // 2. 更新位置 (Y 座標永遠跟隨當前水面高度，鴨子浮在水面上約 15px)
        const duckY = currentWaterY - 15;
        duckData.el.setAttribute('transform', `translate(${duckData.x}, ${duckY})`);

        if (duckData.active) requestAnimationFrame(updateDuckAI);
    }

    function dismissDuck() {
        if (!duckData.active) return;
        duckData.state = 'LEAVING';
        duckData.speed = 1.5; // 逃跑游快一點
        // 最短路徑：判斷目前在左半邊還是右半邊
        duckData.targetX = duckData.x > 400 ? 900 : -100;
    }

    function removeDuck() {
        duckData.active = false;
        duckData.spawnTimeout = null;
        if (duckData.el && duckData.el.parentNode) {
            duckLayer.removeChild(duckData.el);
        }
        duckData.el = null;
    }

    function scheduleCreatures() {
        if (document.hidden) return;
        let delay = Math.random() * 8000 + 8000;
        if (isAnyCreatureStopped) delay += 5000; 

        spawnTimer = setTimeout(() => {
            spawnCreature();
            scheduleCreatures();
        }, delay);
    }

    function spawnCreature() {
        if (document.hidden || creaturesLayer.childElementCount >5) return;

        const waterBottom = currentWaterY + 30; 
        if (soilY - waterBottom < 40) return;

        const type = Math.random() > 0.4 ? 'tadpole' : 'fish';
        const safeMargin = 20; 
        const spawnY = waterBottom + safeMargin + Math.random() * (soilY - waterBottom - safeMargin * 2);
        const dir = Math.random() > 0.5 ? 'lr' : 'rl';
        const duration = 20 + Math.random() * 10;
        const svgNS = "http://www.w3.org/2000/svg";
        
        const posYGroup = document.createElementNS(svgNS, "g");
        posYGroup.setAttribute('transform', `translate(0, ${spawnY})`);
        posYGroup.classList.add('creature-wrapper');
        posYGroup.dataset.y = spawnY; 
        
        const moveXGroup = document.createElementNS(svgNS, "g");
        moveXGroup.style.animationDuration = `${duration}s`;
        moveXGroup.classList.add(dir === 'lr' ? 'swim-lr' : 'swim-rl');

        const waveGroup = document.createElementNS(svgNS, "g");
        if (Math.random() < 0.4) {
            waveGroup.classList.add('swimming-wave');
            waveGroup.style.animationDuration = `${3 + Math.random() * 3}s`;
        }

        waveGroup.innerHTML = (type === 'tadpole') ? createTadpoleSVG() : createFishSVG();
        
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
                        if (moveXGroup && document.body.contains(moveXGroup)) {
                            moveXGroup.classList.remove('paused');
                            if(waveGroup.classList.contains('swimming-wave')) waveGroup.classList.remove('paused');
                        }
                        isAnyCreatureStopped = false; 
                    }, stopDuration);
                }
            }, stopTime);
        }

        moveXGroup.addEventListener('animationend', () => posYGroup.remove());
    }

    function createTadpoleSVG() {
        return `
            <ellipse cx="0" cy="0" rx="8" ry="5" fill="#455A64" opacity="0.9" />
            <path d="M0 0 Q -10 -2 -25 0 Q -10 2 0 0" fill="#455A64" opacity="0.8" />
            <circle cx="3" cy="-2" r="1" fill="white" opacity="0.5" />
        `;
    }

    function createFishSVG() {
        const hue = Math.floor(Math.random() * 40) + 10; 
        const color = `hsl(${hue}, 80%, 75%)`; 
        const tailColor = `hsl(${hue}, 80%, 65%)`;
        return `
            <path d="M-10 0 L-22 -8 L-22 8 Z" fill="${tailColor}" />
            <ellipse cx="0" cy="0" rx="16" ry="10" fill="${color}" stroke="#666" stroke-width="0.5" />
            <circle cx="8" cy="-3" r="2.5" fill="white" />
            <circle cx="9" cy="-3" r="1.2" fill="black" />
            <path d="M-4 4 Q 0 10 6 4" fill="none" stroke="${tailColor}" stroke-width="1.5" />
        `;
    }

    // 綁定手動控制事件，停止自動天氣
    slider.addEventListener('input', () => {
        stopWeather();
        updateSimulation();
    });

    updateSimulation();
    scheduleCreatures();







});
