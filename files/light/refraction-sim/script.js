const { createApp, ref, onMounted, watch } = Vue;

createApp({
    setup() {
        const containerRef = ref(null);
        const canvasRef = ref(null);
        let ctx = null, width = 0, height = 0;

        // 介質資料定義
        const mediaOptions = {
            air:   { n: 1.0,  name: '空氣', color: '#94a3b8' },
            water: { n: 1.33, name: '水',   color: '#22d3ee' },
            glass: { n: 1.5,  name: '玻璃', color: '#c084fc' }
        };

        const simParams = ref({
            sourceX: 300,
            activeMedia: ['water']
        });

        const isDragging = ref(false);

        const getInterfaceY = () => height * 0.6;

        // 計算折射路徑的核心函數
        const calculateRefraction = (sx, sy, cx, cy, n2 = 1.33) => {
            const iAng = Math.atan2(cx - sx, cy - sy); 
            const n1 = 1.0; // 空氣折射率
            let sinR = (n1 / n2) * Math.sin(iAng);
            sinR = Math.max(-1, Math.min(1, sinR)); // 防止數值溢出
            const rAng = Math.asin(sinR);
            const len = Math.max(width, height) * 1.5;
            const endX = cx + len * Math.sin(rAng);
            const endY = cy + len * Math.cos(rAng);
            return { hit: {x:cx, y:cy}, end: {x:endX, y:endY} };
        };

        const drawDashedArrow = (x1, y1, x2, y2, color) => {
            ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 4;
            ctx.setLineDash([12, 12]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            const angle = Math.atan2(y2-y1, x2-x1);
            const drawHead = (px, py) => {
                ctx.beginPath(); const s = 14; ctx.moveTo(px, py);
                ctx.lineTo(px - s * Math.cos(angle-Math.PI/6), py - s * Math.sin(angle-Math.PI/6));
                ctx.lineTo(px - s * Math.cos(angle+Math.PI/6), py - s * Math.sin(angle+Math.PI/6));
                ctx.setLineDash([]); ctx.fill();
            };
            drawHead(x1 + (x2-x1)*0.6, y1 + (y2-y1)*0.6); drawHead(x2, y2);
            ctx.restore();
        };

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            const cy = getInterfaceY();
            const cx = width / 2;

            // 畫背景與介質區域
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fillRect(0, cy, width, height - cy);
            ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

            // 標籤文字
            ctx.font = '16px sans-serif'; ctx.fillStyle = '#94a3b8';
            ctx.fillText('空氣 (n=1.0)', 20, cy - 10);
            ctx.fillText('', 20, cy + 25);

            // 畫法線
            ctx.save(); ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath(); ctx.moveTo(cx, cy - 300); ctx.lineTo(cx, cy + 300); ctx.stroke(); ctx.restore();

            const sx = simParams.value.sourceX, sy = 80;
            // 畫光源
            ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI*2);
            ctx.fillStyle = '#facc15'; ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();

            // 畫入射光
            drawDashedArrow(sx, sy, cx, cy, '#facc15');

            // 畫各介質折射光
            if (simParams.value.activeMedia.length === 0) {
                ctx.font = '20px sans-serif'; ctx.fillStyle = '#ef4444'; ctx.textAlign='center';
                ctx.fillText('請勾選下方介質', width/2, height - 50);
            } else {
                simParams.value.activeMedia.forEach(key => {
                    const m = mediaOptions[key];
                    const r = calculateRefraction(sx, sy, cx, cy, m.n);
                    drawDashedArrow(r.hit.x, r.hit.y, r.end.x, r.end.y, m.color);
                    ctx.fillStyle = m.color; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left';
                    ctx.fillText(`${m.name}`, r.end.x + 10, r.end.y);
                });
            }
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
            if (Math.hypot(px - simParams.value.sourceX, py - 80) < 50) {
                isDragging.value = true;
            }
        };

        const handleMove = (e) => {
            if (!isDragging.value) return;
            const r = canvasRef.value.getBoundingClientRect();
            const px = e.clientX - r.left;
            simParams.value.sourceX = Math.max(20, Math.min(width - 20, px));
            draw();
        };

        const handleEnd = () => { isDragging.value = false; };

        onMounted(() => {
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
        });

        watch(simParams, draw, { deep: true });

        return { containerRef, canvasRef, simParams, mediaOptions, handleStart, handleMove, handleEnd };
    }
}).mount('#app');