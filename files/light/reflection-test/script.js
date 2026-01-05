const { createApp, ref, onMounted, nextTick } = Vue;

createApp({
    setup() {
        const containerRef = ref(null);
        const canvasRef = ref(null);
        let ctx = null, width = 0, height = 0;

        const showGameHint = ref(false);
        const game = ref({
            level: 1,
            score: 0,
            state: 'playing', // playing, result, summary
            lastCorrect: false,
            targets: [],
            rayPath: null,
            source: { x: 0, y: 0 },
            mirrorAngle: 0
        });

        // 數學工具
        const rad = (deg) => deg * Math.PI / 180;
        const deg = (r) => r * 180 / Math.PI;
        const getInterfaceY = () => height * 0.6;

        const calculateRay = (sx, sy, cx, cy, angleDeg) => {
            const mRad = rad(angleDeg || 0);
            const normalRad = mRad - Math.PI / 2;
            const dx = cx - sx, dy = cy - sy;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const ix = dx/dist, iy = dy/dist;
            const nx = Math.cos(normalRad), ny = Math.sin(normalRad);
            const dot = ix*nx + iy*ny;
            const rx = ix - 2*dot*nx, ry = iy - 2*dot*ny;
            const len = Math.max(width, height) * 1.5;
            return { 
                start: {x:sx, y:sy}, 
                hit: {x:cx, y:cy}, 
                end: {x:cx+rx*len, y:cy+ry*len}, 
                normalAngle: normalRad 
            };
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
            drawHead(x1 + (x2-x1)*0.6, y1 + (y2-y1)*0.6); drawHead(x2, y2); ctx.restore();
        };

        const generateLevel = () => {
            game.value.state = 'playing';
            if (game.value.level === 1) {
                showGameHint.value = true;
                setTimeout(() => showGameHint.value = false, 2500);
            }

            const cx = width / 2, cy = getInterfaceY();
            const isLeft = Math.random() > 0.5;
            const sx = isLeft ? (Math.random()*(cx-220)+40) : (Math.random()*(width-40-(cx+180))+(cx+180));
            const sy = 80 + Math.random() * 50;
            const mAngle = (Math.random() * 50 - 25);

            const ray = calculateRay(sx, sy, cx, cy, mAngle);
            game.value.rayPath = ray;
            game.value.source = { x: sx, y: sy };
            game.value.mirrorAngle = mAngle;

            // 生成目標點
            let targets = [];
            const tDist = Math.min(width, height) * 0.35;
            const rVx = ray.end.x - ray.hit.x, rVy = ray.end.y - ray.hit.y;
            const rLen = Math.sqrt(rVx*rVx + rVy*rVy);
            
            // 正確答案
            targets.push({ x: ray.hit.x + (rVx/rLen)*tDist, y: ray.hit.y + (rVy/rLen)*tDist, isCorrect: true });

            // 錯誤答案
            while(targets.length < 3) {
                const ang = Math.atan2(rVy, rVx);
                const off = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.8);
                const p = { 
                    x: ray.hit.x + Math.cos(ang + off) * tDist, 
                    y: ray.hit.y + Math.sin(ang + off) * tDist, 
                    isCorrect: false 
                };
                if (!targets.some(t => Math.hypot(p.x - t.x, p.y - t.y) < 80)) targets.push(p);
            }

            // 洗牌
            targets.sort(() => Math.random() - 0.5);
            const L = ['A', 'B', 'C'], C = ['#f472b6', '#a78bfa', '#4ade80'];
            game.value.targets = targets.map((t, i) => ({ ...t, label: L[i], color: C[i] }));
            draw();
        };

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            const cy = getInterfaceY(), cx = width / 2;

            // 畫鏡子
            const r = rad(game.value.mirrorAngle);
            const dx = 160 * Math.cos(r), dy = 160 * Math.sin(r);
            ctx.save(); ctx.lineWidth = 8; ctx.strokeStyle = '#94a3b8';
            ctx.beginPath(); ctx.moveTo(cx - dx, cy - dy); ctx.lineTo(cx + dx, cy + dy); ctx.stroke();
            ctx.lineWidth = 3; ctx.strokeStyle = '#f8fafc';
            ctx.beginPath(); ctx.moveTo(cx - dx, cy - dy); ctx.lineTo(cx + dx, cy + dy); ctx.stroke();
            ctx.restore();

            // 法線
            ctx.save(); ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            const na = game.value.rayPath.normalAngle;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(na)*200, cy + Math.sin(na)*200); ctx.stroke(); ctx.restore();

            // 光源
            ctx.beginPath(); ctx.arc(game.value.source.x, game.value.source.y, 14, 0, Math.PI*2);
            ctx.fillStyle = '#facc15'; ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();

            // 入射光
            drawDashedArrow(game.value.source.x, game.value.source.y, cx, cy, '#facc15');

            // 如果是結果狀態，顯示反射光
            if (game.value.state === 'result') {
                const ray = game.value.rayPath;
                const color = game.value.lastCorrect ? '#facc15' : '#ef4444';
                drawDashedArrow(ray.hit.x, ray.hit.y, ray.end.x, ray.end.y, color);
            }

            // 畫目標
            game.value.targets.forEach(t => {
                const dim = (game.value.state === 'result' && !t.isCorrect);
                ctx.save(); ctx.globalAlpha = dim ? 0.2 : 1.0;
                ctx.beginPath(); ctx.arc(t.x, t.y, 6, 0, Math.PI*2);
                ctx.fillStyle = t.color; ctx.fill(); ctx.strokeStyle='white'; ctx.lineWidth=2; ctx.stroke();
                ctx.fillStyle = t.color; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center';
                ctx.fillText(t.label, t.x, t.y - 12); ctx.restore();
            });
        };

        const handleStart = (e) => {
            if (game.value.state !== 'playing') return;
            const r = canvasRef.value.getBoundingClientRect();
            const px = e.clientX - r.left, py = e.clientY - r.top;

            let closestIdx = -1, minDist = Infinity;
            game.value.targets.forEach((t, i) => {
                const d = Math.hypot(px - t.x, py - t.y);
                if (d < minDist) { minDist = d; closestIdx = i; }
            });

            if (closestIdx !== -1 && minDist < 80) {
                const t = game.value.targets[closestIdx];
                game.value.lastCorrect = t.isCorrect;
                if (t.isCorrect) game.value.score += 20;
                game.value.state = 'result';
                draw();
            }
        };

        const nextLevel = () => {
            if (game.value.level >= 5) game.value.state = 'summary';
            else { game.value.level++; generateLevel(); }
        };

        const resizeCanvas = () => {
            if (!containerRef.value) return;
            width = containerRef.value.clientWidth;
            height = containerRef.value.clientHeight;
            canvasRef.value.width = width; canvasRef.value.height = height;
            ctx = canvasRef.value.getContext('2d');
            generateLevel();
        };

        onMounted(() => {
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
        });

        return { containerRef, canvasRef, game, showGameHint, handleStart, nextLevel };
    }
}).mount('#app');