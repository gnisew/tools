document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('waterLevel');
    const hyacinthPos = document.getElementById('hyacinth-position');
    const hyacinthLeanWrapper = document.getElementById('hyacinth-lean-wrapper');
    const hyacinthBody = document.getElementById('hyacinth-body');
    const waterBody = document.getElementById('water-body');
    const waterSurface = document.getElementById('water-surface');
    const levelText = document.getElementById('levelText');
    const creaturesLayer = document.getElementById('creatures-layer');
    
    // 雲朵與風元素
    const cloudLeft = document.getElementById('cloud-left-group');
    const cloudRight = document.getElementById('cloud-right-group');
    const windLeft = document.getElementById('wind-left');
    const windRight = document.getElementById('wind-right');

    // 新增元素
    const sunGroup = document.getElementById('sun-group');
    const cloudMiddle = document.getElementById('cloud-middle-group');
    const rainLayer = document.getElementById('rain-layer');

let isFlyingActive = false; 
const flyingLayer = document.getElementById('flying-layer');

    const svgHeight = 500;
    const soilTop = 450;
    
    // 物理模擬變數
    let currentWaterY = 300;
    let currentPlantX = 400; 
    let targetPlantX = 400;  
    
    // 傾斜相關變數
    let currentLean = 0;     
    let windForce = 0;       

    // 天氣控制變數
    let weatherInterval = null;
    let rainSpawnInterval = null;

    // --- 核心動畫循環 ---
    function animationLoop() {
        // 1. 位置移動平滑化
        if (Math.abs(targetPlantX - currentPlantX) > 0.1) {
            currentPlantX += (targetPlantX - currentPlantX) * 0.02;
        } else {
            currentPlantX = targetPlantX;
        }

        // 2. 傾斜角度平滑化
        currentLean += (windForce - currentLean) * 0.03;

        // 3. 風壓自然衰退
        windForce *= 0.96; 
        
        if (Math.abs(windForce) < 0.1) windForce = 0;

        // 更新畫面
        updatePlantTransform();
        
        requestAnimationFrame(animationLoop);
    }
    
    requestAnimationFrame(animationLoop);

    function updatePlantTransform() {
        hyacinthPos.setAttribute('transform', `translate(${currentPlantX}, ${currentWaterY})`);
        hyacinthLeanWrapper.setAttribute('transform', `rotate(${currentLean})`);
    }

    function updateSimulation() {
        const val = parseInt(slider.value);
        const minWaterY = 200; 
        const maxWaterY = 430; 



        currentWaterY = maxWaterY - (val / 100) * (maxWaterY - minWaterY);

        waterBody.setAttribute('y', currentWaterY);
        waterBody.setAttribute('height', svgHeight - currentWaterY);
        waterSurface.setAttribute('y1', currentWaterY);
        waterSurface.setAttribute('y2', currentWaterY);
        updateCreaturesDepth(currentWaterY);
        levelText.innerText = val < 20 ? "低水位" : (val > 80 ? "高水位" : "中水位");
// 水位高於 0 時，蝸牛走掉
        if (val > 0 && snailData.active) {
            dismissSnail();
        }
		if (val < 100 && turtleData.active) {
            dismissTurtle();
        }
    }

    // --- 風吹互動邏輯 ---
    function applyWind(direction) {
        stopWeather(); // 風吹時停止自動天氣
        
        const windElement = direction === 1 ? windLeft : windRight;
        windElement.classList.remove('blowing');
        void windElement.getBoundingClientRect(); 
        windElement.classList.add('blowing');

        let newX = targetPlantX + (120 * direction);
        if (newX < 100) newX = 100;
        if (newX > 700) newX = 700;
        targetPlantX = newX;

        windForce = direction * 25; 
    }

    function updateCreaturesDepth(waterY) {
        const creatures = document.querySelectorAll('.creature-wrapper');
        creatures.forEach(group => {
            let currentY = parseFloat(group.dataset.y);
            if (currentY < waterY + 20) {
                let newY = waterY + 30 + Math.random() * 60;
                group.setAttribute('transform', `translate(0, ${newY})`);
                group.dataset.y = newY; 
            }
        });
    }

    // --- 新增：天氣互動邏輯 ---
    function stopWeather() {
        if (weatherInterval) clearInterval(weatherInterval);
        if (rainSpawnInterval) clearInterval(rainSpawnInterval);
        weatherInterval = null;
        rainSpawnInterval = null;
        
        // 移除視覺效果
        sunGroup.classList.remove('sun-rotating');
        cloudMiddle.classList.remove('raining-cloud');
        rainLayer.innerHTML = ''; // 清除雨滴
    }

    // 點擊太陽：水位下降
function startEvaporation() {
    stopWeather(); // 先停止其他天氣效果（如停止下雨）
    sunGroup.classList.add('sun-rotating'); // 加入太陽旋轉動畫 class
    
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

    // 點擊中間雲朵：下雨且水位上升
function startRain() {
    stopWeather(); // 先停止其他天氣效果
    cloudMiddle.classList.add('raining-cloud'); // 雲朵變色
    
    // 啟動雨滴生成動畫
    rainSpawnInterval = setInterval(spawnRainDrop, 100);

    // 啟動水位上升邏輯
    weatherInterval = setInterval(() => {
        let val = parseFloat(slider.value);
        if (val < 100) {
            slider.value = val + 0.5;
            updateSimulation();
        } else {
            stopWeather(); // 如果水位到頂 (100)，就停止
        }
    }, 50); 
}

    function spawnRainDrop() {
		if (document.hidden) return; 
        const svgNS = "http://www.w3.org/2000/svg";
        const drop = document.createElementNS(svgNS, 'line');
        // 在雲朵範圍內隨機生成
        const startX = 200 + Math.random() * 400;
        // Y 起始點約在雲朵下方 (160)
        const startY = 100;
        
        drop.setAttribute('x1', startX);
        drop.setAttribute('y1', startY);
        drop.setAttribute('x2', startX);
        drop.setAttribute('y2', startY + 15); // 雨滴長度
        drop.classList.add('rain-drop');
        
        rainLayer.appendChild(drop);
        
        // 動畫結束後移除元素
        drop.addEventListener('animationend', () => {
            if (drop.parentNode) rainLayer.removeChild(drop);
        });
    }

// 烏龜相關變數
    let turtleData = {
        el: null,
        active: false,
        x: 0,
        y: 420, // 泥土位置
        targetX: 0,
        state: 'IDLE', // IDLE, WALKING, LEAVING
        speed: 0.8
};
const turtleLayer = document.getElementById('turtle-layer');

	// 點擊布袋蓮
hyacinthPos.addEventListener('click', () => {
    const val = Math.round(slider.value);
    
    // 1. 觸發下沉動畫 (原本的邏輯)
    hyacinthBody.classList.remove('clicked-sink'); 
    void hyacinthBody.offsetWidth; 
    hyacinthBody.classList.add('clicked-sink');
    setTimeout(() => hyacinthBody.classList.remove('clicked-sink'), 800);

    // 2. 中水位觸發飛行物
    // 根據程式碼邏輯，中水位定義為 20 <= val <= 80
    if (val >= 60 && val <= 90 && !isFlyingActive) {
        spawnFlyingObject();
    }

    // 3. 判斷水位生成生物 (原本的邏輯)
    if (val >= 100 && !turtleData.active) {
        spawnTurtle();
    } else if (val <= 0 && !snailData.active) {
        spawnSnail();
    }
});

// 飛行物生成函式
function spawnFlyingObject() {
    isFlyingActive = true; // 鎖定，防止重複產生

    const emojis = ['🚀', '🛸', '🪂'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const isLeftToRight = Math.random() > 0.5;
    const randomY = 40 + Math.random() * 80; // 隨機高度在天空區域

    const svgNS = "http://www.w3.org/2000/svg";
    const text = document.createElementNS(svgNS, "text");
    
    text.innerHTML = randomEmoji;
    text.setAttribute('class', 'flying-emoji');
    text.setAttribute('y', randomY);
    
    // 設定方向動畫
    if (isLeftToRight) {
        text.classList.add('fly-animation-lr');
    } else {
        text.classList.add('fly-animation-rl');
    }

    flyingLayer.appendChild(text);

    // 當動畫結束時移除元素並解除鎖定
    text.addEventListener('animationend', () => {
        if (text.parentNode) {
            flyingLayer.removeChild(text);
        }
        isFlyingActive = false; // 釋放鎖定
    });
}

function spawnTurtle() {
        turtleData.active = true;
        turtleData.state = 'WALKING';
        
        // 隨機從左邊 (-50) 或右邊 (850) 出現
        const side = Math.random() > 0.5 ? -50 : 850;
        turtleData.x = side;
        turtleData.targetX = side === -50 ? 150 : 650; // 進入畫面的一個初始目標

        const svgNS = "http://www.w3.org/2000/svg";
        const g = document.createElementNS(svgNS, "g");
        g.setAttribute('transform', `translate(${turtleData.x}, ${turtleData.y})`);
        
        const text = document.createElementNS(svgNS, "text");
        text.innerHTML = "🐢";
        text.setAttribute('class', 'turtle-text');
        text.classList.add('turtle');
        if (side === -50) text.classList.add('facing-right'); // 修正朝向

        g.appendChild(text);
        turtleLayer.appendChild(g);
        turtleData.el = g;

        requestAnimationFrame(updateTurtleAI);
    }

    function updateTurtleAI() {
        if (!turtleData.active) return;

        // 1. 處理移動邏輯
        if (turtleData.state === 'WALKING' || turtleData.state === 'LEAVING') {
            const dx = turtleData.targetX - turtleData.x;
            if (Math.abs(dx) > 2) {
                turtleData.x += Math.sign(dx) * turtleData.speed;
                // 更新方向視覺
                const emoji = turtleData.el.querySelector('.turtle');
                if (dx > 0) emoji.classList.add('facing-right');
                else emoji.classList.remove('facing-right');
            } else {
                if (turtleData.state === 'LEAVING') {
                    removeTurtle();
                    return;
                }
                // 到達隨機點後，停下來休息一下
                turtleData.state = 'IDLE';
                setTimeout(() => {
                    if (turtleData.state === 'IDLE') {
                        turtleData.state = 'WALKING';
                        turtleData.targetX = 100 + Math.random() * 600; // 隨機新目標
                    }
                }, 2000 + Math.random() * 3000);
            }
        }

        // 更新 DOM 位置
        turtleData.el.setAttribute('transform', `translate(${turtleData.x}, ${turtleData.y})`);
        
        if (turtleData.active) requestAnimationFrame(updateTurtleAI);
    }

    function dismissTurtle() {
        if (!turtleData.active || turtleData.state === 'LEAVING') return;
        
        turtleData.state = 'LEAVING';
        turtleData.speed = 2.0; // 逃跑快一點
        // 往最近的邊緣逃跑
        turtleData.targetX = turtleData.x > 400 ? 900 : -100;
    }

    function removeTurtle() {
        turtleData.active = false;
        if (turtleData.el && turtleData.el.parentNode) {
            turtleLayer.removeChild(turtleData.el);
        }
        turtleData.el = null;
    }



// 蝸牛相關變數
    let snailData = {
        el: null,
        active: false,
        x: 0,
        y: 450, // 蝸牛走在更底部
        targetX: 0,
        state: 'IDLE',
        speed: 0.4 // 蝸牛走得比烏龜慢
    };
    const snailLayer = document.getElementById('snail-layer');

function spawnSnail() {
        snailData.active = true;
        snailData.state = 'WALKING';
        const side = Math.random() > 0.5 ? -30 : 830;
        snailData.x = side;
        snailData.targetX = side < 400 ? 100 : 700;

        const svgNS = "http://www.w3.org/2000/svg";
        const g = document.createElementNS(svgNS, "g");
        g.setAttribute('transform', `translate(${snailData.x}, ${snailData.y})`);
        
        const text = document.createElementNS(svgNS, "text");
        text.innerHTML = "🐌";
        text.setAttribute('class', 'turtle-text snail'); // 借用 turtle-text 的置中樣式
        if (side === -30) text.classList.add('facing-right');

        g.appendChild(text);
        snailLayer.appendChild(g);
        snailData.el = g;
        requestAnimationFrame(updateSnailAI);
    }

    function updateSnailAI() {
        if (!snailData.active) return;

        if (snailData.state === 'WALKING' || snailData.state === 'LEAVING') {
            const dx = snailData.targetX - snailData.x;
            if (Math.abs(dx) > 1) {
                snailData.x += Math.sign(dx) * snailData.speed;
                const emoji = snailData.el.querySelector('.snail');
                if (dx > 0) emoji.classList.add('facing-right');
                else emoji.classList.remove('facing-right');
            } else {
                if (snailData.state === 'LEAVING') {
                    removeSnail(); return;
                }
                snailData.state = 'IDLE';
                setTimeout(() => {
                    if (snailData.state === 'IDLE') {
                        snailData.state = 'WALKING';
                        snailData.targetX = 50 + Math.random() * 700;
                    }
                }, 3000);
            }
        }
        snailData.el.setAttribute('transform', `translate(${snailData.x}, ${snailData.y})`);
        if (snailData.active) requestAnimationFrame(updateSnailAI);
    }

    function dismissSnail() {
        if (!snailData.active || snailData.state === 'LEAVING') return;
        snailData.state = 'LEAVING';
        snailData.speed = 1.2; // 逃跑稍微快一點
        snailData.targetX = snailData.x > 400 ? 850 : -50; // 往最近邊緣
    }

    function removeSnail() {
        snailData.active = false;
        if (snailData.el && snailData.el.parentNode) {
            snailLayer.removeChild(snailData.el);
        }
        snailData.el = null;
    }





    // 生物生成
    function spawnCreature() {
        if (document.hidden || creaturesLayer.childElementCount > 3) return;
        const waterBottom = currentWaterY + 30; 
        if (soilTop - waterBottom < 40) return;

        const type = Math.random() > 0.4 ? 'tadpole' : 'fish';
        const spawnY = waterBottom + 15 + Math.random() * (soilTop - waterBottom - 30);
        const dir = Math.random() > 0.5 ? 'lr' : 'rl';
        const duration = 30 + Math.random() * 8;

        const svgNS = "http://www.w3.org/2000/svg";
        const posYGroup = document.createElementNS(svgNS, "g");
        posYGroup.setAttribute('transform', `translate(0, ${spawnY})`);
        posYGroup.classList.add('creature-wrapper');
        posYGroup.dataset.y = spawnY; 
        
        const moveXGroup = document.createElementNS(svgNS, "g");
        moveXGroup.style.animationDuration = `${duration}s`;
        moveXGroup.classList.add(dir === 'lr' ? 'swim-lr' : 'swim-rl');

        const waveGroup = document.createElementNS(svgNS, "g");
        waveGroup.classList.add('creature-wave');
        waveGroup.style.animationDuration = `${3 + Math.random() * 2}s`;
        waveGroup.innerHTML = (type === 'tadpole') ? createTadpole() : createFish();
        
        moveXGroup.appendChild(waveGroup);
        posYGroup.appendChild(moveXGroup);
        creaturesLayer.appendChild(posYGroup);

        if (Math.random() < 0.3) {
            setTimeout(() => {
                if (moveXGroup && document.body.contains(moveXGroup)) {
                    moveXGroup.classList.add('paused');
                    waveGroup.classList.add('paused');
                    setTimeout(() => {
                        moveXGroup.classList.remove('paused');
                        waveGroup.classList.remove('paused');
                    }, 3000);
                }
            }, duration * 400);
        }
        moveXGroup.addEventListener('animationend', () => {
            if (posYGroup.parentNode) creaturesLayer.removeChild(posYGroup);
        });
    }

    function createTadpole() {
        return `<ellipse cx="0" cy="0" rx="6" ry="3.5" fill="#37474F" /><path d="M0 0 Q -10 -3 -16 0 Q -10 3 0 0" fill="#37474F" opacity="0.7" />`;
    }
    function createFish() {
        const hue = Math.floor(Math.random() * 30) + 15;
        return `<path d="M-6 0 L-15 -5 L-15 5 Z" fill="hsl(${hue}, 80%, 50%)" /><ellipse cx="0" cy="0" rx="10" ry="6" fill="hsl(${hue}, 90%, 65%)" />`;
    }

    function triggerSway() {
        const delay = Math.random() * 5000 + 5000;
        setTimeout(() => {
            hyacinthBody.classList.add('swaying-now');
            setTimeout(() => {
                hyacinthBody.classList.remove('swaying-now');
                triggerSway();
            }, 4000);
        }, delay);
    }

    // 事件監聽
    slider.addEventListener('input', () => {
        stopWeather(); // 使用者手動拖拉時，停止自動天氣
        updateSimulation();
    });
    
    cloudLeft.addEventListener('click', () => applyWind(1));
    cloudRight.addEventListener('click', () => applyWind(-1));

    // 新增事件
    sunGroup.addEventListener('click', startEvaporation);
cloudMiddle.addEventListener('click', startRain);

    setInterval(spawnCreature, 6000);
    updateSimulation();
    triggerSway();
});
