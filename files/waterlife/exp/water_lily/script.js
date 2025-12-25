document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('waterLevel');
    const waterBody = document.getElementById('water-body');
    const waterSurface = document.getElementById('water-surface');
    const levelText = document.getElementById('levelText');
    const flowerStem = document.getElementById('flower-stem');
    const flowerHead = document.getElementById('flower-head');
    const creaturesLayer = document.getElementById('creatures-layer');

    // 參數設定
    const svgHeight = 600;
    const rootX = 400;
    const rootY = 485; 
    const flowerY = 150; 
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

        const newWaterY = maxWaterY - (val / 100) * (maxWaterY - minWaterY);
        currentWaterY = newWaterY;
        
        waterBody.setAttribute('y', currentWaterY);
        waterBody.setAttribute('height', svgHeight - currentWaterY);
        waterSurface.setAttribute('y1', currentWaterY);
        waterSurface.setAttribute('y2', currentWaterY);

        if (val < 20) levelText.innerText = "低水位";
        else if (val > 80) levelText.innerText = "高水位";
        else levelText.innerText = "中水位";

        leafData.forEach(leaf => updateLeafAndStem(leaf, currentWaterY));
        updateCreaturesDepth(currentWaterY);
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
        const tension = verticalDist / (rootY - 150);
        
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

    slider.addEventListener('input', updateSimulation);
});
