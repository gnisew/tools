const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
    setup() {
        const containerRef = ref(null);
        const canvasRef = ref(null);
        let ctx = null, width = 0, height = 0;

        // 透鏡物體清單
        const lensObjects = [
            { label: '人偶', emoji: '🧍' }, { label: '忍者', emoji: '🥷' },
            { label: '蠟燭', emoji: '🕯️' }, { label: '紅鶴', emoji: '🦩' },
            { label: '手', emoji: '👆' }, { label: '仙人掌', emoji: '🌵' },
            { label: '衝浪', emoji: '🏄' }, { label: '便便', emoji: '💩' },
            { label: '鐵塔', emoji: '🗼' }
        ];

        const lensParams = ref({
            type: 'convex',
            f: 150,
            objDist: 250,
            objHeight: 120,
            objEmoji: '🧍'
        });

        const isDragging = ref(false);
        const dragTarget = ref(null);

        // 透鏡運算邏輯
        const lensData = computed(() => {
            const f = lensParams.value.type === 'convex' ? lensParams.value.f : -lensParams.value.f;
            const do_ = lensParams.value.objDist;
            
            let di = Infinity;
            if (Math.abs(do_ - f) > 0.1) di = (f * do_) / (do_ - f);
            
            const m = -di / do_; 
            const hi = m * lensParams.value.objHeight;
            const isReal = di > 0;
            
            let desc = '';
            if (Math.abs(do_ - lensParams.value.f) < 2 && lensParams.value.type === 'convex') {
                desc = '不成像 (平行光)';
            } else {
                const nature = isReal ? '實像' : '虛像';
                const orientation = m < 0 ? '倒立' : '正立';
                let size = (Math.abs(m) > 1.05) ? '放大' : (Math.abs(m) < 0.95 ? '縮小' : '相等');
                desc = `${orientation} · ${size} · ${nature}`;
            }
            return { di, m, hi, isReal, desc };
        });

        // 繪圖工具
        const drawLine = (x1, y1, x2, y2, color, dashed = false) => {
            ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2;
            if(dashed) ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
        };

        const drawPoint = (x, y, color, label) => {
            ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2);
            ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
            if(label) {
                ctx.fillStyle = color; ctx.font = '12px Arial'; ctx.textAlign = 'center'; 
                ctx.fillText(label, x, y + 20);
            }
        };

        const drawLensShape = (cx, cy, type) => {
            ctx.save(); ctx.fillStyle = 'rgba(200, 230, 255, 0.4)'; ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
            ctx.beginPath();
            if (type === 'convex') { ctx.ellipse(cx, cy, 20, 150, 0, 0, Math.PI * 2); } 
            else {
                const wTop = 25, wMid = 8, h = 150;      
                ctx.moveTo(cx - wTop, cy - h); ctx.lineTo(cx + wTop, cy - h);
                ctx.quadraticCurveTo(cx + wMid, cy, cx + wTop, cy + h); ctx.lineTo(cx - wTop, cy + h);
                ctx.quadraticCurveTo(cx - wMid, cy, cx - wTop, cy - h);
            }
            ctx.fill(); ctx.stroke(); ctx.restore();
        };

        const drawEmojiObject = (x, y, h, emoji, label, isGhost = false) => {
            ctx.save(); ctx.translate(x, y);
            ctx.font = `${Math.abs(h)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            if (isGhost) ctx.globalAlpha = 0.5;
            if (h < 0) { ctx.scale(1, -1); }
            ctx.fillText(emoji, 0, 0);
            if (label) {
                ctx.scale(1, h < 0 ? -1 : 1);
                ctx.fillStyle = isGhost ? '#a855f7' : '#ef4444'; ctx.font = '14px Arial';
                ctx.fillText(label, 0, h < 0 ? -h + 20 : 20);
            }
            ctx.restore();
        };

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            const cx = width / 2, cy = height / 2, lp = lensParams.value, ld = lensData.value;
            
            // 背景格線
            ctx.strokeStyle = '#1e293b'; ctx.beginPath();
            for(let i=0; i<width; i+=20) { ctx.moveTo(i,0); ctx.lineTo(i,height); }
            for(let i=0; i<height; i+=20) { ctx.moveTo(0,i); ctx.lineTo(width,i); }
            ctx.stroke();

            // 主軸與透鏡
            drawLine(0, cy, width, cy, '#64748b');
            drawLensShape(cx, cy, lp.type);
            
            // 焦點與兩倍焦距點
            drawPoint(cx - lp.f, cy, '#ef4444', 'F'); drawPoint(cx + lp.f, cy, '#ef4444', 'F');
            drawPoint(cx - lp.f*2, cy, '#94a3b8', '2F'); drawPoint(cx + lp.f*2, cy, '#94a3b8', '2F');

            // 物體與像
            const objX = cx - lp.objDist, objTipY = cy - lp.objHeight;
            drawEmojiObject(objX, cy, lp.objHeight, lp.objEmoji, '物體');
            drawPoint(objX, objTipY, '#ef4444');
            
            if (isFinite(ld.di) && Math.abs(ld.di) < 3000) {
                const imgX = cx + ld.di, imgTipY = cy - ld.hi;
                drawEmojiObject(imgX, cy, ld.hi, lp.objEmoji, '像', !ld.isReal);
            }

            // 繪製三條主要光線
            drawLine(objX, objTipY, cx, objTipY, '#ef4444'); // 平行光
            if (lp.type === 'convex') {
                const slope = (cy - objTipY) / lp.f;
                drawLine(cx, objTipY, width, objTipY + slope * (width - cx), '#ef4444');
                if (!ld.isReal) drawLine(cx, objTipY, cx + ld.di, cy - ld.hi, '#ef4444', true);
            } else {
                const slope = (objTipY - cy) / lp.f;
                drawLine(cx, objTipY, width, objTipY - slope * (width - cx), '#ef4444');
                drawLine(cx, objTipY, cx - lp.f, cy, '#ef4444', true);
            }
            // 通過光心的光
            const slopeC = (cy - objTipY) / (cx - objX);
            drawLine(objX, objTipY, width, cy + slopeC * (width - cx), '#10b981');
            if(!ld.isReal) drawLine(cx, cy, cx + ld.di, cy - ld.hi, '#10b981', true);
        };

        const handleStart = (e) => {
            const r = canvasRef.value.getBoundingClientRect();
            const px = e.clientX - r.left, py = e.clientY - r.top;
            const cx = width / 2, cy = height / 2, lp = lensParams.value;
            if (Math.hypot(px - (cx - lp.objDist), py - (cy - lp.objHeight)) < 40) {
                isDragging.value = true; dragTarget.value = 'obj';
            } else if (Math.hypot(px - (cx - lp.f), py - cy) < 30 || Math.hypot(px - (cx + lp.f), py - cy) < 30) {
                isDragging.value = true; dragTarget.value = 'focus';
            }
        };

        const handleMove = (e) => {
            if (!isDragging.value) return;
            const r = canvasRef.value.getBoundingClientRect();
            const px = e.clientX - r.left, py = e.clientY - r.top;
            const cx = width / 2, cy = height / 2;
            if (dragTarget.value === 'obj') {
                lensParams.value.objDist = Math.max(10, cx - px);
                lensParams.value.objHeight = Math.max(-250, Math.min(250, cy - py));
            } else if (dragTarget.value === 'focus') {
                lensParams.value.f = Math.max(20, Math.abs(px - cx));
            }
            draw();
        };

        onMounted(() => {
            width = containerRef.value.clientWidth; height = containerRef.value.clientHeight;
            canvasRef.value.width = width; canvasRef.value.height = height;
            ctx = canvasRef.value.getContext('2d');
            draw();
            window.addEventListener('resize', () => {
                width = containerRef.value.clientWidth; height = containerRef.value.clientHeight;
                canvasRef.value.width = width; canvasRef.value.height = height;
                draw();
            });
        });

        watch(lensParams, draw, { deep: true });

        return { containerRef, canvasRef, lensParams, lensData, lensObjects, handleStart, handleMove, handleEnd: () => { isDragging.value = false; } };
    }
}).mount('#app');