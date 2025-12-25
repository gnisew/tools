document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('waterLevel');
    const waterBody = document.getElementById('water-body');
    const waterSurface = document.getElementById('water-surface');
    const levelText = document.getElementById('levelText');
    const stemsLayer = document.getElementById('stems-layer');
    const creaturesLayer = document.getElementById('creatures-layer');
    
    const svgHeight = 600;
    let currentWaterY = 0;
    let isAnyCreatureStopped = false;
    let spawnTimer = null;

    // 定義植物連接地圖
    const plantMap = [
        // 1. 葉1 (左): Joint 1 -> 新位置 (220, 220)
        // 向左延伸
        { start: {x: 280, y: 510}, end: {x: 220, y: 220}, color: "#558B2F", width: 5, curvature: -25 },
        
        // 2. 主花: Joint 1 -> Flower (300, 200)
        // 挺直
        { start: {x: 285, y: 510}, end: {x: 300, y: 200}, color: "#7CB342", width: 7, curvature: 10 },
        
        // 3. 花苞: Joint 2 -> Bud (440, 300)
        // 挺直
        { start: {x: 375, y: 505}, end: {x: 440, y: 300}, color: "#7CB342", width: 5, curvature: 10 },
        
        // 4. 葉2 (大葉): Joint 2 -> 新位置 (400, 180)
        // 向左上方延伸
        { start: {x: 375, y: 505}, end: {x: 400, y: 180}, color: "#558B2F", width: 7, curvature: -15 },
        
        // 5. 葉3 (小葉): Joint 3 -> 新位置 (550, 240)
        // 向左上方延伸
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

    slider.addEventListener('input', updateSimulation);
});
