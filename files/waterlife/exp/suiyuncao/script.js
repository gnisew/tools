document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('waterLevel');
    const waterBody = document.getElementById('water-body');
    const waterSurface = document.getElementById('water-surface');
    const levelText = document.getElementById('levelText');
    const plantsContainer = document.getElementById('plants-container');
    const creaturesLayer = document.getElementById('creatures-layer');

    const svgHeight = 600;
    const soilY = 480; 
    let currentWaterY = 200;
    let spawnTimer = null;
    let isAnyCreatureStopped = false; // 追蹤是否有生物正在停頓

    const plantConfigs = [
        { x: 240, maxHeight: 220, bendDir: -1 },
        { x: 360, maxHeight: 260, bendDir: 1 },
        { x: 500, maxHeight: 240, bendDir: 1 },
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

    function updateSimulation() {
        const val = parseInt(slider.value);
        currentWaterY = 460 - (val / 100) * 320;
        
        waterBody.setAttribute('y', currentWaterY);
        waterBody.setAttribute('height', svgHeight - currentWaterY);
        waterSurface.setAttribute('y1', currentWaterY);
        waterSurface.setAttribute('y2', currentWaterY);

        levelText.innerText = val < 30 ? "低水位" : val > 70 ? "高水位" : "中水位";
        
        plantConfigs.forEach((config, i) => updatePlant(i, currentWaterY, config));
        updateCreaturesDepth(currentWaterY);
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

    // --- 生物邏輯修正：參考 scriptlotus.js ---

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

    function scheduleCreatures() {
        if (document.hidden) return;
        // 降低頻率：8 ~ 16 秒才產生一隻
        let delay = Math.random() * 8000 + 8000;
        if (isAnyCreatureStopped) delay += 5000; // 如果有人停下來，下一隻更晚出現

        spawnTimer = setTimeout(() => {
            spawnCreature();
            scheduleCreatures();
        }, delay);
    }

    function spawnCreature() {
        if (document.hidden || creaturesLayer.childElementCount >= 4) return;

        const waterBottom = currentWaterY + 30; 
        if (soilY - waterBottom < 40) return;

        const type = Math.random() > 0.4 ? 'tadpole' : 'fish';
        const safeMargin = 20; 
        const spawnY = waterBottom + safeMargin + Math.random() * (soilY - waterBottom - safeMargin * 2);
        const dir = Math.random() > 0.5 ? 'lr' : 'rl';
        const duration = 30 + Math.random() * 10;
        const svgNS = "http://www.w3.org/2000/svg";
        
        // 1. 垂直位置群組
        const posYGroup = document.createElementNS(svgNS, "g");
        posYGroup.setAttribute('transform', `translate(0, ${spawnY})`);
        posYGroup.classList.add('creature-wrapper');
        posYGroup.dataset.y = spawnY; 
        
        // 2. 水平移動群組
        const moveXGroup = document.createElementNS(svgNS, "g");
        moveXGroup.style.animationDuration = `${duration}s`;
        moveXGroup.classList.add(dir === 'lr' ? 'swim-lr' : 'swim-rl');

        // 3. 波浪晃動群組
        const waveGroup = document.createElementNS(svgNS, "g");
        if (Math.random() < 0.4) {
            waveGroup.classList.add('swimming-wave');
            waveGroup.style.animationDuration = `${3 + Math.random() * 3}s`;
        }

        // 視覺外觀
        waveGroup.innerHTML = (type === 'tadpole') ? createTadpoleSVG() : createFishSVG();
        
        moveXGroup.appendChild(waveGroup);
        posYGroup.appendChild(moveXGroup);
        creaturesLayer.appendChild(posYGroup);

        // 隨機停頓邏輯
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
        const hue = Math.floor(Math.random() * 40) + 10; // 偏向橘紅色系
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

    slider.addEventListener('input', updateSimulation);
    updateSimulation();
    scheduleCreatures();
});