const { createApp, ref, onMounted, watch } = Vue;

createApp({
    setup() {
        const containerRef = ref(null);
        const canvasRef = ref(null);
        let ctx = null, width = 0, height = 0;

        const simParams = ref({
            sourceX: 200,
            mirrorAngle: 0,
            showAngles: false,
            showLabels: false
        });

        const isDragging = ref(false);
        const dragTarget = ref(null);

        // 工具函數
        const rad = (deg) => deg * Math.PI / 180;
        const deg = (r) => r * 180 / Math.PI;
        const getInterfaceY = () => height * 0.7;
        
        const getMirrorCoords = (cx, cy, angleDeg, len = 320) => {
            const r = rad(angleDeg || 0);
            const dx = (len / 2) * Math.cos(r);
            const dy = (len / 2) * Math.sin(r);
            return { x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy };
        };

        const calculateRay = (sx, sy, cx, cy, angleDeg) => {
            const mRad = rad(angleDeg || 0);
            const normalRad = mRad - Math.PI / 2;
            const dx = cx - sx, dy = cy - sy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const ix = dx / dist, iy = dy / dist;
            const nx = Math.cos(normalRad), ny = Math.sin(normalRad);
            const dot = ix * nx + iy * ny;
            const rx = ix - 2 * dot * nx, ry = iy - 2 * dot * ny;
            const len = Math.max(width, height) * 1.5;
            return { 
                start: { x: sx, y: sy }, 
                hit: { x: cx, y: cy }, 
                end: { x: cx + rx * len, y: cy + ry * len }, 
                normalAngle: normalRad 
            };
        };

        const drawDashedArrow = (x1, y1, x2, y2, color) => {
            ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 4;
            ctx.setLineDash([12, 12]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const drawHead = (px, py) => {
                ctx.beginPath(); const s = 14; ctx.moveTo(px, py);
                ctx.lineTo(px - s * Math.cos(angle - Math.PI / 6), py - s * Math.sin(angle - Math.PI / 6));
                ctx.lineTo(px - s * Math.cos(angle + Math.PI / 6), py - s * Math.sin(angle + Math.PI / 6));
                ctx.setLineDash([]); ctx.fill();
            };
            drawHead(x1 + (x2 - x1) * 0.6, y1 + (y2 - y1) * 0.6);
            drawHead(x2, y2); ctx.restore();
        };

        // --- 主繪圖 ---
const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            const cy = getInterfaceY();
            const cx = width / 2;
            const mc = getMirrorCoords(cx, cy, simParams.value.mirrorAngle);

            // 1. 畫背景格線 (略，保持原樣)
            ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
            ctx.beginPath();
            for(let i=0; i<width; i+=40) { ctx.moveTo(i,0); ctx.lineTo(i,height); }
            for(let i=0; i<height; i+=40) { ctx.moveTo(0,i); ctx.lineTo(width,i); }
            ctx.stroke();

            // 2. 畫反射面 (鏡子)
            ctx.save(); 
            ctx.lineWidth = 8; ctx.strokeStyle = '#94a3b8';
            ctx.beginPath(); ctx.moveTo(mc.x1, mc.y1); ctx.lineTo(mc.x2, mc.y2); ctx.stroke();
            ctx.lineWidth = 3; ctx.strokeStyle = '#f8fafc';
            ctx.beginPath(); ctx.moveTo(mc.x1, mc.y1); ctx.lineTo(mc.x2, mc.y2); ctx.stroke();
            // 鏡子拖拽點
            ctx.beginPath(); ctx.arc(mc.x2, mc.y2, 12, 0, Math.PI * 2); ctx.fillStyle = 'white'; ctx.fill(); ctx.stroke();
            ctx.restore();

            const ray = calculateRay(simParams.value.sourceX, 80, cx, cy, simParams.value.mirrorAngle);

            // 3. 畫法線
            ctx.save(); ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath(); ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(ray.normalAngle) * 300, cy + Math.sin(ray.normalAngle) * 300);
            ctx.stroke(); ctx.restore();

            // 4. 畫光線 (入射線與反射線)
            drawDashedArrow(ray.start.x, ray.start.y, ray.hit.x, ray.hit.y, '#facc15');
            drawDashedArrow(ray.hit.x, ray.hit.y, ray.end.x, ray.end.y, '#facc15');

            // 5. 角度弧度與標籤 (入射角、反射角)
            if (simParams.value.showAngles) {
                const nAng = ray.normalAngle;
                const sAng = Math.atan2(ray.start.y - cy, ray.start.x - cx);
                const eAng = Math.atan2(ray.end.y - cy, ray.end.x - cx);
                let degVal = Math.abs(deg(sAng - nAng));
                if (degVal > 180) degVal = 360 - degVal;
                const display = degVal.toFixed(1) + '°';

                ctx.save();
                ctx.font = 'bold 15px Arial';
                ctx.textAlign = 'center';
                
                // 繪製弧線
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#facc15'; // 入射弧
                ctx.beginPath(); ctx.arc(cx, cy, 60, nAng, sAng, sAng < nAng); ctx.stroke();
                ctx.strokeStyle = '#ef4444'; // 反射弧
                ctx.beginPath(); ctx.arc(cx, cy, 60, nAng, eAng, eAng < nAng); ctx.stroke();

                // 標註「入射角」與度數
                const midIn = (nAng + sAng) / 2;
                ctx.fillStyle = '#facc15';
                ctx.fillText('入射角', cx + Math.cos(midIn) * 100, cy + Math.sin(midIn) * 100 - 15);
                ctx.fillText(display, cx + Math.cos(midIn) * 100, cy + Math.sin(midIn) * 100 + 5);

                // 標註「反射角」與度數
                const midRef = (nAng + eAng) / 2;
                ctx.fillStyle = '#ef4444';
                ctx.fillText('反射角', cx + Math.cos(midRef) * 100, cy + Math.sin(midRef) * 100 - 15);
                ctx.fillText(display, cx + Math.cos(midRef) * 100, cy + Math.sin(midRef) * 100 + 5);
                ctx.restore();
            }

            // 6. 核心文字標籤 (入射點、反射面、法線)
			if (simParams.value.showLabels) {
                ctx.save();
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'white';
                // 增加文字陰影，確保在黃色光線上也清晰可見
                ctx.shadowBlur = 4;
                ctx.shadowColor = 'black';

                // 【標籤：光源】 - 置於黃色圓球上方
                ctx.fillText('光源', simParams.value.sourceX, 80 - 30);

                // 【標籤：入射線】 - 置於入射光線路徑的中點
                const midInX = (ray.start.x + ray.hit.x) / 2;
                const midInY = (ray.start.y + ray.hit.y) / 2;
                ctx.fillStyle = '#facc15'; // 入射線文字設為黃色
                ctx.fillText('入射線', midInX - 45, midInY - 40);

                // 【標籤：反射線】 - 置於反射光線固定距離的位置
                const refDist = 150; // 標籤距離入射點的長度
                const refAng = Math.atan2(ray.end.y - ray.hit.y, ray.end.x - ray.hit.x);
                const midRefX = ray.hit.x + Math.cos(refAng) * refDist;
                const midRefY = ray.hit.y + Math.sin(refAng) * refDist;
                ctx.fillStyle = '#ef4444'; // 反射線文字設為紅色
                ctx.fillText('反射線', midRefX + 45, midInY - 40);

                // 【標籤：法線】 - 置於虛線的最頂端
                ctx.fillStyle = 'white';
                const normalLen = 250;
                ctx.fillText('法線', cx + Math.cos(ray.normalAngle) * (normalLen + 20), cy + Math.sin(ray.normalAngle) * (normalLen + 20));

                // 【標籤：入射點】 - 置於碰撞點下方
                ctx.fillText('入射點', cx, cy + 40);

                // 【標籤：反射面】 - 置於鏡子邊緣
                ctx.textAlign = 'left';
                ctx.fillText('反射面', mc.x2 + 15, mc.y2);

                ctx.restore();
            }
            // 7. 畫光源球體
            ctx.beginPath(); ctx.arc(simParams.value.sourceX, 80, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#facc15'; ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();
        };

        const resizeCanvas = () => {
            if (!containerRef.value) return;
            width = containerRef.value.clientWidth;
            height = containerRef.value.clientHeight;
            canvasRef.value.width = width;
            canvasRef.value.height = height;
            ctx = canvasRef.value.getContext('2d');
            draw();
        };

        const handleStart = (e) => {
            const r = canvasRef.value.getBoundingClientRect();
            const px = e.clientX - r.left, py = e.clientY - r.top;
            const cx = width / 2, cy = getInterfaceY();
            const mc = getMirrorCoords(cx, cy, simParams.value.mirrorAngle);

            if (Math.hypot(px - simParams.value.sourceX, py - 80) < 40) {
                isDragging.value = true; dragTarget.value = 'source';
            } else if (Math.hypot(px - mc.x2, py - mc.y2) < 40) {
                isDragging.value = true; dragTarget.value = 'mirror';
            }
        };

        const handleMove = (e) => {
            if (!isDragging.value) return;
            const r = canvasRef.value.getBoundingClientRect();
            const px = e.clientX - r.left, py = e.clientY - r.top;

            if (dragTarget.value === 'source') {
                simParams.value.sourceX = Math.max(20, Math.min(width - 20, px));
            } else if (dragTarget.value === 'mirror') {
                const cx = width / 2, cy = getInterfaceY();
                let ang = deg(Math.atan2(py - cy, px - cx));
                if (ang > 180) ang -= 360;
                simParams.value.mirrorAngle = Math.max(-45, Math.min(45, ang));
            }
            draw();
        };

        const handleEnd = () => { isDragging.value = false; dragTarget.value = null; };

        onMounted(() => {
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
        });

        watch(simParams, draw, { deep: true });

        return { containerRef, canvasRef, simParams, handleStart, handleMove, handleEnd };
    }
}).mount('#app');