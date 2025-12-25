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

    const svgHeight = 600;
    const soilTop = 480;
    
    // 物理模擬變數
    let currentWaterY = 300;
    let currentPlantX = 400; 
    let targetPlantX = 400;  
    
    // 傾斜相關變數
    let currentLean = 0;     
    let windForce = 0;       

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
        const minWaterY = 250; 
        const maxWaterY = 400; 
        currentWaterY = maxWaterY - (val / 100) * (maxWaterY - minWaterY);

        waterBody.setAttribute('y', currentWaterY);
        waterBody.setAttribute('height', svgHeight - currentWaterY);
        waterSurface.setAttribute('y1', currentWaterY);
        waterSurface.setAttribute('y2', currentWaterY);
        updateCreaturesDepth(currentWaterY);
        levelText.innerText = val < 20 ? "低水位" : (val > 80 ? "高水位" : "中水位");
    }

    // --- 風吹互動邏輯 (修正版) ---
    function applyWind(direction) {
        // direction: 1 = 向右吹, -1 = 向左吹
        
        const windElement = direction === 1 ? windLeft : windRight;

        // 1. 移除 class
        windElement.classList.remove('blowing');

        // 2. 強制瀏覽器重繪 (Force Reflow)
        // 修正點：SVG 元素必須使用 getBoundingClientRect() 才能有效觸發重繪，offsetWidth 有時會失效
        void windElement.getBoundingClientRect(); 

        // 3. 重新加入 class，動畫就會重頭播放
        windElement.classList.add('blowing');

        // 設定移動目標
        let newX = targetPlantX + (120 * direction);
        if (newX < 100) newX = 100;
        if (newX > 700) newX = 700;
        targetPlantX = newX;

        // 設定風壓目標
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

    slider.addEventListener('input', updateSimulation);
    cloudLeft.addEventListener('click', () => applyWind(1));
    cloudRight.addEventListener('click', () => applyWind(-1));

    setInterval(spawnCreature, 6000);
    updateSimulation();
    triggerSway();
});