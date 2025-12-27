document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('waterLevel');
    const waterBody = document.getElementById('water-body');
    const waterSurface = document.getElementById('water-surface');
    const levelText = document.getElementById('levelText');
    const flowerStem = document.getElementById('flower-stem');
    const flowerHead = document.getElementById('flower-head');
    const creaturesLayer = document.getElementById('creatures-layer');

	const sunGroup = document.getElementById('sun-group');
    const cloudGroup = document.getElementById('cloud-middle-group');
    const rainLayer = document.getElementById('rain-layer');
    const dragonflyLayer = document.getElementById('dragonfly-layer');

	let weatherInterval = null;
    let rainSpawnInterval = null;
	let landedTargetId = null;
	let landedRandomX = 0;
	let landedRandomY = 0;
	let landedAngle = 0;

	let isHovering = false;      // 是否正在盤旋
	let hoverFrameId = null;     // 盤旋動畫的 ID
	let pendingTargetId = null;  // 待命結束後要降落的目標
	let hoverCenterX = 400;      // 盤旋中心 X
	let hoverCenterY = 120;      // 盤旋中心 Y (空中)
	let hoverAngleOffset = 0;    // 盤旋轉動的角度
    // 參數設定
    const svgHeight = 600;
    const rootX = 400;
    const rootY = 485; 
    const flowerY = 180; 
    let currentWaterY = 0;
    
    // 狀態控制
    let isAnyCreatureStopped = false;
    let spawnTimer = null; // 用來儲存計時器 ID，以便取消

    const leafData = [
        { id: 'leaf-1', stemId: 'stem-1', dist: -280, scale: 1 },    
        { id: 'leaf-2', stemId: 'stem-2', dist: 300, scale: 1 },     
        { id: 'leaf-3', stemId: 'stem-3', dist: -160, scale: 0.8 },  
        { id: 'leaf-4', stemId: 'stem-4', dist: 180, scale: 0.8 }    
    ];

    // 初始化
    drawNaturalFlowerStem(rootX, rootY, flowerY);
    updateSimulation(); 
    scheduleWind();
    scheduleCreatures(); // 啟動生物生成

    // --- 修正分頁切換累積問題 ---
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            // 頁面隱藏時：清除計時器，停止生成新生物
            if (spawnTimer) clearTimeout(spawnTimer);
        } else {
            // 頁面回來時：重新啟動生成循環
            scheduleCreatures();
        }
    });

function updateSimulation() {
    const val = parseInt(slider.value);
    const minWaterY = 180;
    const maxWaterY = 420; 

    // 計算新水位 Y 座標
    const newWaterY = maxWaterY - (val / 100) * (maxWaterY - minWaterY);
    currentWaterY = newWaterY;
    
    // 更新水體顯示
    waterBody.setAttribute('y', currentWaterY);
    waterBody.setAttribute('height', svgHeight - currentWaterY);
    waterSurface.setAttribute('y1', currentWaterY);
    waterSurface.setAttribute('y2', currentWaterY);

    // 更新水位標籤
    if (val < 20) levelText.innerText = "低水位";
    else if (val > 80) levelText.innerText = "高水位";
    else levelText.innerText = "中水位";

    // 1. 更新所有葉片與莖
    leafData.forEach(leaf => updateLeafAndStem(leaf, currentWaterY));
    
    // 2. 更新水中生物深度
    updateCreaturesDepth(currentWaterY);

    // 3. 同步蜻蜓位置 (如果蜻蜓已降落)
    if (landedTargetId) {
        if (landedTargetId.startsWith('leaf')) {
            // 取得對應葉片的原始數據與配置
            const leafObj = leafData.find(l => l.id === landedTargetId);
            const targetConfig = targets.find(t => t.id === landedTargetId);
            
            // 重新計算與葉片同步的 X 座標公式
            const verticalDist = rootY - currentWaterY;
            const tension = verticalDist / (rootY - 180);
            const currentDist = leafObj.dist * (1.1 - tension * 0.2);
            
            // 更新蜻蜓全域座標 (基點 + 位移 + 降落時的隨機偏移)
            currentDfX = rootX + currentDist + landedRandomX;
            currentDfY = currentWaterY + targetConfig.offset.y + landedRandomY;
            
            // 即時反應在畫面上
            dragonfly.setAttribute('transform', `translate(${currentDfX}, ${currentDfY}) rotate(${landedAngle})`);
        } else if (landedTargetId === 'flower-head') {
            // 睡蓮花頭高度固定在 180，通常不需隨水位移動
            // 但如果未來花頭也隨水位變動，可在此加入公式
            const targetConfig = targets.find(t => t.id === landedTargetId);
            currentDfX = rootX + targetConfig.offset.x + landedRandomX;
            currentDfY = flowerY + targetConfig.offset.y + landedRandomY;
            dragonfly.setAttribute('transform', `translate(${currentDfX}, ${currentDfY}) rotate(${landedAngle})`);
        }
    }
}


    function updateCreaturesDepth(waterY) {
        const creatures = document.querySelectorAll('.creature-wrapper');
        const safeMargin = 25; 

        creatures.forEach(group => {
            let currentY = parseFloat(group.dataset.y);
            // 強制跟隨水位下降，但不跟隨上升
            if (currentY < waterY + safeMargin) {
                let newY = waterY + safeMargin;
                group.setAttribute('transform', `translate(0, ${newY})`);
                group.dataset.y = newY; 
            }
        });
    }

    function updateLeafAndStem(leafObj, waterY) {
        const leafEl = document.getElementById(leafObj.id);
        const stemEl = document.getElementById(leafObj.stemId);
        
        const verticalDist = rootY - waterY;
        const tension = verticalDist / (rootY - 180);
        
        let currentDist = leafObj.dist * (1.1 - tension * 0.2);
        let targetX = rootX + currentDist;
        
        leafEl.setAttribute('transform', `translate(${targetX}, ${waterY}) scale(${leafObj.scale})`);

        const startX = rootX;
        const startY = rootY;
        const endX = targetX;
        const endY = waterY;

        const spreadFactor = (1 - tension) * 1.5 + 0.5;
        const cp1x = rootX + (currentDist * 0.6 * spreadFactor); 
        const cp1y = rootY - (verticalDist * 0.1);
        const cp2x = targetX - (currentDist * 0.05); 
        const cp2y = endY + (verticalDist * 0.6); 

        const pathData = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
        stemEl.setAttribute('d', pathData);
    }

    function drawNaturalFlowerStem(x, startY, endY) {
        const cp1x = x - 10;
        const cp1y = startY - 120;
        const cp2x = x + 8;
        const cp2y = endY + 120;
        const d = `M ${x} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${endY}`;
        flowerStem.setAttribute('d', d);
    }

    function scheduleWind() {
        const delay = Math.random() * 5000 + 3000;
        setTimeout(() => {
            flowerHead.classList.add('swaying');
            setTimeout(() => {
                flowerHead.classList.remove('swaying');
                scheduleWind(); 
            }, 2500);
        }, delay);
    }

    // --- 生物生成系統 ---

    function scheduleCreatures() {
        // 如果頁面是隱藏的，直接退出，不要安排下一次
        if (document.hidden) return;

        let delay = Math.random() * 8000 + 8000;
        
        if (isAnyCreatureStopped) {
            delay += 8000; 
        }

        // 使用全域變數 spawnTimer，這樣可以在 visibilitychange 時取消它
        spawnTimer = setTimeout(() => {
            spawnCreature();
            scheduleCreatures();
        }, delay);
    }

    function spawnCreature() {
        // 雙重保險：如果頁面隱藏中，不執行生成
        if (document.hidden) return;

        // 三重保險：總量管制 (防止任何意外堆積)
        // 如果畫面上已經超過 5 隻生物，這次就跳過
        if (creaturesLayer.childElementCount > 5) return;

        const soilTop = 470; 
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
                // 檢查元素是否還存在 (可能因切換分頁被清空或水位變化)
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

// --- 天氣功能 ---
    function stopWeather() {
        clearInterval(weatherInterval);
        clearInterval(rainSpawnInterval);
        sunGroup.classList.remove('sun-rotating');
        cloudGroup.classList.remove('raining-cloud');
        rainLayer.innerHTML = '';
        if(dragonfly) dragonfly.classList.remove('wings-stop');
    }

    function startEvaporation() {
        stopWeather();
        sunGroup.classList.add('sun-rotating');
        weatherInterval = setInterval(() => {
            let val = parseFloat(slider.value);
            if (val > 0) { slider.value = val - 0.6; updateSimulation(); }
            else stopWeather();
        }, 50);
    }

    function startRain() {
        stopWeather();
        cloudGroup.classList.add('raining-cloud');
        rainSpawnInterval = setInterval(() => {
            const drop = document.createElementNS("http://www.w3.org/2000/svg", 'line');
            let x = 500 + Math.random() * 250;
            drop.setAttribute('x1', x); drop.setAttribute('y1', 100);
            drop.setAttribute('x2', x); drop.setAttribute('y2', 115);
            drop.classList.add('rain-drop');
            rainLayer.appendChild(drop);
            drop.addEventListener('animationend', () => drop.remove());
        }, 100);
        weatherInterval = setInterval(() => {
            let val = parseFloat(slider.value);
            if (val < 100) { slider.value = val + 0.5; updateSimulation(); }
            else stopWeather();
        }, 50);
    }

    sunGroup.addEventListener('click', startEvaporation);
    cloudGroup.addEventListener('click', startRain);
    slider.addEventListener('input', stopWeather);

    // --- 蜻蜓系統 ---

// --- 蜻蜓系統初始化 ---
    const dragonfly = document.createElementNS("http://www.w3.org/2000/svg", "g");
    dragonfly.id = "dragonfly";
    
    // 隨機顏色庫
    const dfColors = [
        { wing: '#90CAF9', body1: '#2196F3', body2: '#1976D2', head: '#0D47A1' }, // 藍
        { wing: '#EF9A9A', body1: '#E53935', body2: '#C62828', head: '#B71C1C' }, // 紅
        { wing: '#CE93D8', body1: '#9C27B0', body2: '#7B1FA2', head: '#4A148C' }, // 紫
        { wing: '#A5D6A7', body1: '#4CAF50', body2: '#388E3C', head: '#1B5E20' }  // 綠
    ];
    const rc = dfColors[Math.floor(Math.random() * dfColors.length)];

    dragonfly.innerHTML = `
        <g class="dragonfly-visual">
            <g class="dragonfly-wings" fill="rgba(255,255,255,0.6)" stroke="${rc.wing}" stroke-width="0.5">
                <ellipse cx="-12" cy="-4" rx="16" ry="4" transform="rotate(10)" />
                <ellipse cx="12" cy="-4" rx="16" ry="4" transform="rotate(-10)" />
                <ellipse cx="-10" cy="-2" rx="14" ry="3" transform="rotate(-5)" />
                <ellipse cx="10" cy="-2" rx="14" ry="3" transform="rotate(5)" />
            </g>
            <ellipse cx="0" cy="5" rx="2" ry="12" fill="${rc.body1}" />
            <ellipse cx="0" cy="-6" rx="3.5" ry="5" fill="${rc.body2}" />
            <circle cx="0" cy="-12" r="4" fill="${rc.head}" />
        </g>`;
    
    let currentDfX = -50, currentDfY = 150;
    dragonfly.setAttribute('transform', `translate(${currentDfX}, ${currentDfY})`);
    dragonflyLayer.appendChild(dragonfly);

    // 睡蓮的目標位置 (x, y 與 offset 需要微調以符合浮葉位置)
	const targets = [
        { id: 'flower-head', offset: {x: 0, y: -60}, range: 25 },
        { id: 'leaf-1', offset: {x: 0, y: -10}, range: 40 },
        { id: 'leaf-2', offset: {x: 0, y: -10}, range: 40 },
        { id: 'leaf-3', offset: {x: 0, y: -10}, range: 30 },
        { id: 'leaf-4', offset: {x: 0, y: -10}, range: 30 }
    ];

	let dfAnimationId = null;

	function flyTo(targetX, targetY, targetId) {
        dragonfly.classList.remove('wings-stop');
        if (dfAnimationId) cancelAnimationFrame(dfAnimationId);

        const startX = currentDfX;
        const startY = currentDfY;
        
        // 增加飛行路徑的動態感
        const offsetX = (Math.random() - 0.5) * 300; 
        const offsetY = -100; // 待命飛行稍微偏上
        const cpX = (startX + targetX) / 2 + offsetX;
        const cpY = (startY + targetY) / 2 + offsetY;

        const dist = Math.sqrt((targetX - startX)**2 + (targetY - startY)**2);
        const duration = Math.min(1500, Math.max(800, dist * 5)); 
        const startTime = performance.now();

        let lastAngle = 0;

        function step(now) {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            const nextX = (1 - ease) * (1 - ease) * startX + 2 * (1 - ease) * ease * cpX + ease * ease * targetX;
            const nextY = (1 - ease) * (1 - ease) * startY + 2 * (1 - ease) * ease * cpY + ease * ease * targetY;

            const dx = nextX - currentDfX;
            const dy = nextY - currentDfY;
            
            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                const flightAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
                const wobble = Math.sin(now / 100) * 10 * (1 - ease); 
                lastAngle = flightAngle + wobble;
            }

            dragonfly.setAttribute('transform', `translate(${nextX}, ${nextY}) rotate(${lastAngle})`);
            currentDfX = nextX;
            currentDfY = nextY;

            if (t < 1) {
                dfAnimationId = requestAnimationFrame(step);
            } else {
                // 如果有傳入 targetId，代表是要著陸鎖定
                if (targetId) {
                    dragonfly.classList.add('wings-stop');
                    landedTargetId = targetId;
                    landedAngle = lastAngle; 
                } 
                // 如果沒有 targetId (null)，蜻蜓會停在該位置但翅膀繼續動 (空中待命)
            }
        }
        dfAnimationId = requestAnimationFrame(step);
    }

function stopWeather() {
    clearInterval(weatherInterval);
    clearInterval(rainSpawnInterval);
    weatherInterval = null; // 重要：確保設為 null 以供狀態檢查
    rainSpawnInterval = null;
    
    sunGroup.classList.remove('sun-rotating');
    cloudGroup.classList.remove('raining-cloud');
    rainLayer.innerHTML = '';
    
    // --- 新增：水位停止後，如果正在盤旋，執行降落 ---
    if (isHovering && pendingTargetId) {
        cancelAnimationFrame(hoverFrameId); // 停止盤旋動畫
        isHovering = false;
        
        // 觸發降落：這會重新抓取葉片移動後的最新座標
        const targetConfig = targets.find(t => t.id === pendingTargetId);
        executeLanding(targetConfig); 
    }
}
// 執行盤旋動畫
function startHovering() {
    isHovering = true;
    function hoverStep() {
        if (!isHovering) return;
        
        hoverAngleOffset += 0.03; // 控制盤旋速度
        const radius = 60;        // 盤旋半徑
        
        const nextX = hoverCenterX + Math.cos(hoverAngleOffset) * radius;
        const nextY = hoverCenterY + Math.sin(hoverAngleOffset) * radius;
        
        // 計算旋轉角度 (切線方向 + 90度)
        const angle = (Math.atan2(Math.sin(hoverAngleOffset), Math.cos(hoverAngleOffset)) * 180 / Math.PI) + 180;
        
        dragonfly.setAttribute('transform', `translate(${nextX}, ${nextY}) rotate(${angle})`);
        currentDfX = nextX;
        currentDfY = nextY;
        
        hoverFrameId = requestAnimationFrame(hoverStep);
    }
    hoverFrameId = requestAnimationFrame(hoverStep);
}

// 執行最終降落 (抓取最新座標)
function executeLanding(t) {
    let targetX, targetY;
    // 降落前重新生成偏移值
    landedRandomX = (Math.random() - 0.5) * t.range;
    landedRandomY = (Math.random() - 0.5) * (t.range / 2);

    if (t.id === 'flower-head') {
        targetX = rootX + t.offset.x + landedRandomX;
        targetY = flowerY + t.offset.y + landedRandomY;
    } else {
        const leafObj = leafData.find(l => l.id === t.id);
        const verticalDist = rootY - currentWaterY;
        const tension = verticalDist / (rootY - 180);
        const currentDist = leafObj.dist * (1.1 - tension * 0.2);
        
        targetX = rootX + currentDist + landedRandomX;
        targetY = currentWaterY + t.offset.y + landedRandomY;
    }
    flyTo(targetX, targetY, t.id);
}
targets.forEach(t => {
    const el = document.getElementById(t.id);
    if (el) {
        el.style.pointerEvents = "all";
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            landedTargetId = null;
            pendingTargetId = t.id; // 記錄想降落的目標

            if (weatherInterval) {
                // 如果水位在動：飛到空中盤旋中心，隨後開啟盤旋
                const dist = Math.sqrt((hoverCenterX - currentDfX)**2 + (hoverCenterY - currentDfY)**2);
                flyTo(hoverCenterX, hoverCenterY, null); 
                
                // 延時啟動盤旋動畫（等飛到空中）
                setTimeout(() => {
                    if (!landedTargetId && !isHovering) startHovering();
                }, 1000);
            } else {
                // 如果水位靜止：直接降落
                isHovering = false;
                cancelAnimationFrame(hoverFrameId);
                executeLanding(t);
            }
        });
    }
});

    slider.addEventListener('input', updateSimulation);
});
