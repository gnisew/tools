const { createApp, ref, onMounted, watch } = Vue;

createApp({
    setup() {
        const containerRef = ref(null);
        const canvasRef = ref(null);
        let ctx = null, width = 0, height = 0;

        const mediaOptions = {
            air:   { n: 1.0,  name: '空氣', color: '#94a3b8' },
            water: { n: 1.33, name: '水',   color: '#22d3ee' },
            glass: { n: 1.5,  name: '玻璃', color: '#c084fc' }
        };

        const simParams = ref({
            sourceX: 180,
            sourceY: 150, 
            selectedMedia: 'glass'
        });

        const isDragging = ref(false);
        const getInterfaceY = () => height * 0.5;
        const toDeg = (rad) => Math.round((rad * 180) / Math.PI);

        // 計算光路 (保持不變)
        const calculateLightPath = (sx, sy, cx, cy, mKey) => {
            const iy = getInterfaceY();
            const mediaN = mediaOptions[mKey].n;
            const n1 = sy < iy ? 1.0 : mediaN;
            const n2 = sy < iy ? mediaN : 1.0;
            const isFromTop = sy < iy;

            const dx = cx - sx;
            const dy = cy - sy;
            const theta1 = Math.atan2(Math.abs(dx), Math.abs(dy));
            const sinTheta2 = (n1 / n2) * Math.sin(theta1);
            let criticalAngle = n1 > n2 ? Math.asin(n2 / n1) : null;

            if (sinTheta2 > 1) {
                return { 
                    type: 'TIR', theta1, theta2: theta1, criticalAngle,
                    hit: {x:cx, y:cy}, 
                    end: {
                        x: cx + 1000 * Math.sin(theta1) * (dx >= 0 ? 1 : -1),
                        y: cy - Math.abs(1000 * Math.cos(theta1)) * (isFromTop ? 1 : -1)
                    }
                };
            } else {
                const theta2 = Math.asin(sinTheta2);
                return { 
                    type: 'Refraction', theta1, theta2, criticalAngle,
                    hit: {x:cx, y:cy}, 
                    end: {
                        x: cx + 1000 * Math.sin(theta2) * (dx >= 0 ? 1 : -1),
                        y: cy + Math.abs(1000 * Math.cos(theta2)) * (isFromTop ? 1 : -1)
                    }
                };
            }
        };

        // 繪製虛線光束 (保持不變)
        const drawDashedLine = (x1, y1, x2, y2, color) => {
            ctx.save();
            ctx.strokeStyle = color; ctx.lineWidth = 3;
            ctx.setLineDash([10, 6]);
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.setLineDash([]); ctx.fillStyle = color;
            const angle = Math.atan2(y2 - y1, x2 - x1);
            ctx.beginPath();
            ctx.translate(x1 + (x2 - x1) * 0.5, y1 + (y2 - y1) * 0.5);
            ctx.rotate(angle);
            ctx.moveTo(0, 0); ctx.lineTo(-12, -7); ctx.lineTo(-12, 7);
            ctx.fill(); ctx.restore();
        };

        // 【新增】繪製角度弧線與中文標籤的輔助函式
        const drawAngleArcWithLabel = (cx, cy, isTopQuadrant, isLeftQuadrant, thetaRad, color, labelText) => {
            const radius = 40; // 弧線半徑
            ctx.save();
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            
            // Canvas 角度：上方是 -PI/2，下方是 +PI/2
            const baseNormalAngle = isTopQuadrant ? -Math.PI / 2 : Math.PI / 2;
            let startAngle, endAngle, counterClockwise;

            // 根據象限決定弧線的畫法 (確保從法線畫到光線)
            if (isTopQuadrant) {
                if (isLeftQuadrant) { // 左上
                    startAngle = baseNormalAngle; endAngle = baseNormalAngle - thetaRad; counterClockwise = true;
                } else { // 右上
                    startAngle = baseNormalAngle; endAngle = baseNormalAngle + thetaRad; counterClockwise = false;
                }
            } else {
                if (isLeftQuadrant) { // 左下
                    startAngle = baseNormalAngle; endAngle = baseNormalAngle + thetaRad; counterClockwise = false;
                } else { // 右下
                    startAngle = baseNormalAngle; endAngle = baseNormalAngle - thetaRad; counterClockwise = true;
                }
            }
            
            // 畫弧線
            ctx.arc(cx, cy, radius, startAngle, endAngle, counterClockwise);
            ctx.stroke();

            // 畫中文標籤
            ctx.fillStyle = color;
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = isLeftQuadrant ? 'right' : 'left';
            ctx.textBaseline = 'middle';
            
            // 計算文字位置 (在弧線外側)
            const textOffsetX = isLeftQuadrant ? -radius - 10 : radius + 10;
            const textOffsetY = isTopQuadrant ? -radius/2 : radius/2;
            
            ctx.fillText(`${labelText}: ${toDeg(thetaRad)}°`, cx + textOffsetX, cy + textOffsetY);
            ctx.restore();
        };

const draw = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const iy = getInterfaceY();
    const cx = width / 2;
    const m = mediaOptions[simParams.value.selectedMedia];

    // 1. 介質與法線背景 (保持不變)
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, width, iy);
    ctx.fillStyle = m.color + '15'; ctx.fillRect(0, iy, width, height - iy);
    ctx.beginPath(); ctx.moveTo(0, iy); ctx.lineTo(width, iy);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, height); ctx.stroke(); ctx.restore();

    // 2. 計算光路
    const sx = simParams.value.sourceX; const sy = simParams.value.sourceY;
    const res = calculateLightPath(sx, sy, cx, iy, simParams.value.selectedMedia);
    const isTIR = res.type === 'TIR';

    // 3. 繪製光束 (保持不變)
    drawDashedLine(sx, sy, cx, iy, '#facc15');
    drawDashedLine(res.hit.x, res.hit.y, res.end.x, res.end.y, isTIR ? '#f87171' : '#fbbf24');

    // 4. 繪製角度弧線與中文標籤
    const isTopSource = sy < iy;
    const isLeftSource = sx < cx;

    // A. 入射角：在光源那一側
    drawAngleArcWithLabel(cx, iy, isTopSource, isLeftSource, res.theta1, '#facc15', '入射角');

    // B. 出射角 (反射或折射)
    if (isTIR) {
        // 全反射：在光源同側(上下)，但水平對稱(左右相反)
        drawAngleArcWithLabel(cx, iy, isTopSource, !isLeftSource, res.theta2, '#f87171', '反射角');
    } else {
        // 【關鍵修正】：折射光線在光源的對面側(上下相反)，且水平也是對面側(左右相反)
        // 原本是 isLeftSource，應改為 !isLeftSource
        drawAngleArcWithLabel(cx, iy, !isTopSource, !isLeftSource, res.theta2, '#fbbf24', '折射角');
    }

    // 5. 頂部提示文字 (移除英文)
    if (isTIR) {
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        const critMsg = res.criticalAngle ? ` (臨界角: ${toDeg(res.criticalAngle)}°)` : '';
        ctx.fillText(`發生全反射${critMsg}`, width/2, iy - 60);
    }
};

        const handleStart = (e) => { isDragging.value = true; };
        
        onMounted(() => {
            ctx = canvasRef.value.getContext('2d');
            const handleMove = (e) => {
                if (!isDragging.value) return;
                const r = containerRef.value.getBoundingClientRect();
                simParams.value.sourceX = e.clientX - r.left;
                simParams.value.sourceY = e.clientY - r.top;
            };
            const handleEnd = () => { isDragging.value = false; };
            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleEnd);
            const resize = () => {
                width = containerRef.value.clientWidth;
                height = containerRef.value.clientHeight;
                canvasRef.value.width = width; canvasRef.value.height = height;
                draw();
            };
            resize();
            window.addEventListener('resize', resize);
        });

        watch(simParams, draw, { deep: true });
        return { containerRef, canvasRef, simParams, mediaOptions, handleStart };
    }
}).mount('#app');