const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        const containerRef = ref(null);
        const canvasRef = ref(null);
        let ctx = null, width = 0, height = 0;
        let animationFrameId = null;

        const hunter = ref({
            sourceX: 100, mirrorX: 0, score: 0,
            monster: { x: 0, y: 0, emoji: '👾', dead: false },
            isFiring: false, rayProgress: 0, fullPath: null, hitMonster: false
        });

        const isDragging = ref(false);
        const dragTarget = ref(null);

        const monsterEmojis = ['👾', '👽', '👻', '🦇', '🕷️', '🦂', '🛸', '😈', '💀', '☠️', '🤡', '👹', '👺', '🚀', '⭐', '🐙', '🦖'];

        // --- 數學工具 ---
        const rad = (deg) => deg * Math.PI / 180;
        const deg = (r) => r * 180 / Math.PI;
        
        const getMirrorCoords = (cx, cy, angleDeg) => {
            const r = rad(angleDeg || 0);
            const dx = 160 * Math.cos(r), dy = 160 * Math.sin(r);
            return { x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy };
        };

        const generateMonster = () => {
            const margin = 50;
            const myLimit = height * 0.8;
            hunter.value.monster = {
                x: margin + Math.random() * (width - 2 * margin),
                y: margin + Math.random() * (myLimit - 180),
                emoji: monsterEmojis[Math.floor(Math.random() * monsterEmojis.length)],
                dead: false
            };
            hunter.value.hitMonster = false;
            hunter.value.rayProgress = 0;
            draw();
        };

        const calculateHunterPath = () => {
            const sx = hunter.value.sourceX, sy = 60;
            const cx = hunter.value.mirrorX, cy = height * 0.8;
            const dx1 = cx - sx, dy1 = cy - sy, len1 = Math.sqrt(dx1*dx1 + dy1*dy1);
            
            // 法線向量 (垂直向上)
            const nx = 0, ny = -1; 
            const ix = dx1/len1, iy = dy1/len1, dot = ix*nx + iy*ny;
            // 反射向量計算
            const rx = ix - 2*dot*nx, ry = iy - 2*dot*ny;
            const len2 = Math.max(width, height) * 1.5;
            
            return {
                start: {x: sx, y: sy}, 
                hit: {x: cx, y: cy},
                end: {x: cx + rx*len2, y: cy + ry*len2},
                len1: len1, len2: len2
            };
        };

        const hunterLoop = () => {
            if (!hunter.value.isFiring) return;
            hunter.value.rayProgress += 25; // 調整飛行速度
            const path = hunter.value.fullPath;
            const totalLen = path.len1 + path.len2;

            // 碰撞偵測 (擊中怪物判定)
            if (!hunter.value.hitMonster && hunter.value.rayProgress > path.len1) {
                const rLen = hunter.value.rayProgress - path.len1;
                const rx = path.end.x - path.hit.x, ry = path.end.y - path.hit.y;
                const tx = path.hit.x + (rx/path.len2) * rLen;
                const ty = path.hit.y + (ry/path.len2) * rLen;
                const mn = hunter.value.monster;
                
                if (Math.hypot(tx - mn.x, ty - mn.y) < 35) {
                    hunter.value.hitMonster = true;
                    hunter.value.monster.dead = true;
                    hunter.value.score++;
                    hunter.value.isFiring = false;
                    draw();
                    setTimeout(generateMonster, 1200);
                    return;
                }
            }

            draw();
            if (hunter.value.rayProgress < totalLen && !hunter.value.hitMonster) {
                animationFrameId = requestAnimationFrame(hunterLoop);
            } else {
                hunter.value.isFiring = false;
                setTimeout(() => { 
                    if(!hunter.value.isFiring) { hunter.value.rayProgress = 0; draw(); } 
                }, 1500); // 讓玩家看清楚路徑後再消失
            }
        };

        const fireHunterRay = () => {
            if (hunter.value.isFiring) return;
            hunter.value.isFiring = true;
            hunter.value.fullPath = calculateHunterPath();
            hunter.value.rayProgress = 0;
            hunterLoop();
        };

        const drawArrowHead = (x, y, angle, color) => {
            ctx.save(); ctx.fillStyle = color; ctx.translate(x, y); ctx.rotate(angle);
            ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, 8); ctx.lineTo(-8, -8); ctx.fill(); ctx.restore();
        };

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            const cx = hunter.value.mirrorX, cy = height * 0.8;
            const mc = getMirrorCoords(cx, cy, 0);

            // 1. 繪製鏡面 (反射面)
            ctx.save(); 
            ctx.lineWidth = 10; ctx.strokeStyle = '#94a3b8';
            ctx.beginPath(); ctx.moveTo(mc.x1, mc.y1); ctx.lineTo(mc.x2, mc.y2); ctx.stroke();
            ctx.lineWidth = 3; ctx.strokeStyle = '#f8fafc';
            ctx.beginPath(); ctx.moveTo(mc.x1, mc.y1); ctx.lineTo(mc.x2, mc.y2); ctx.stroke();
            ctx.restore();

            // 2. 繪製法線 (Normal Line)
            ctx.save();
            ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 200); ctx.stroke();
            ctx.restore();

            // 3. 繪製入射點 (入射點/中間點)
            ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#64748b'; ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();

            // 4. 繪製怪物
            const mn = hunter.value.monster;
            if (!mn.dead) {
                ctx.font = '48px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(mn.emoji, mn.x, mn.y);
            } else if (hunter.value.hitMonster) {
                ctx.font = '60px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('💥', mn.x, mn.y);
            }

            // 5. 繪製光源
            const sx = hunter.value.sourceX, sy = 60;
            ctx.beginPath(); ctx.arc(sx, sy, 22, 0, Math.PI*2);
            ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();

            // 6. 繪製光線與角度弧線
            if (hunter.value.isFiring || hunter.value.rayProgress > 0) {
                const path = hunter.value.fullPath, prog = hunter.value.rayProgress;
                ctx.save(); 
                ctx.lineWidth = 4; ctx.shadowBlur = 10; ctx.shadowColor = '#facc15'; ctx.strokeStyle = '#facc15';
                ctx.lineCap = 'round'; ctx.setLineDash([15, 8]);
                
                ctx.beginPath(); ctx.moveTo(sx, sy);
                let tipX = sx, tipY = sy, tipAngle = 0;
                
                if (prog <= path.len1) {
                    const r = prog/path.len1; 
                    tipX = sx + (cx-sx)*r; tipY = sy + (cy-sy)*r;
                    tipAngle = Math.atan2(cy-sy, cx-sx); 
                    ctx.lineTo(tipX, tipY);
                } else {
                    ctx.lineTo(cx, cy);
                    const rLen = Math.min(prog - path.len1, path.len2);
                    const rx = path.end.x - cx, ry = path.end.y - cy;
                    tipX = cx + (rx/path.len2)*rLen; tipY = cy + (ry/path.len2)*rLen;
                    tipAngle = Math.atan2(ry, rx); 
                    ctx.lineTo(tipX, tipY);
                }
                ctx.stroke(); ctx.restore(); 
                drawArrowHead(tipX, tipY, tipAngle, '#facc15');

                // --- 補足：繪製角度標示 (當光線碰到鏡子後顯示) ---
                if (prog > path.len1) {
                    const normalAng = -Math.PI/2, arcRadius = 50;
                    const incidentVecAng = Math.atan2(sy - cy, sx - cx);
                    const reflectedVecAng = Math.atan2(path.end.y - cy, path.end.x - cx);
                    
                    let degValue = Math.abs(deg(incidentVecAng - normalAng));
                    if (degValue > 180) degValue = 360 - degValue;

                    ctx.save();
                    ctx.lineWidth = 2; ctx.setLineDash([]);
                    ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center';

                    // 入射角弧線與數值 (黃色)
                    ctx.strokeStyle = '#facc15'; ctx.fillStyle = '#facc15';
                    ctx.beginPath();
                    ctx.arc(cx, cy, arcRadius, normalAng, incidentVecAng, (sx < cx));
                    ctx.stroke();
                    const textAngleI = normalAng + (incidentVecAng - normalAng) / 2;
                    ctx.fillText(degValue.toFixed(1) + '°', cx + Math.cos(textAngleI) * 80, cy + Math.sin(textAngleI) * 80);

                    // 反射角弧線與數值 (紅色)
                    ctx.strokeStyle = '#ef4444'; ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(cx, cy, arcRadius, normalAng, reflectedVecAng, (path.end.x < cx));
                    ctx.stroke();
                    const textAngleR = normalAng + (reflectedVecAng - normalAng) / 2;
                    ctx.fillText(degValue.toFixed(1) + '°', cx + Math.cos(textAngleR) * 80, cy + Math.sin(textAngleR) * 80);
                    
                    ctx.restore();
                }
            }
        };

        const handleStart = (e) => {
            const r = canvasRef.value.getBoundingClientRect();
            const px = e.clientX - r.left, py = e.clientY - r.top;
            if (Math.hypot(px - hunter.value.sourceX, py - 60) < 40) {
                isDragging.value = true; dragTarget.value = 'source';
            } else if (Math.hypot(px - hunter.value.mirrorX, py - height*0.8) < 60) {
                isDragging.value = true; dragTarget.value = 'mirror';
            }
        };

        const handleMove = (e) => {
            if (!isDragging.value) return;
            const r = canvasRef.value.getBoundingClientRect();
            const px = e.clientX - r.left;
            
            if (dragTarget.value === 'source') {
                hunter.value.sourceX = Math.max(30, Math.min(width - 30, px));
            } else if (dragTarget.value === 'mirror') {
                const limit = width * 0.4;
                hunter.value.mirrorX = Math.max(width/2 - limit, Math.min(width/2 + limit, px));
            }
            
            // 如果不在發射中，重置光線進度
            if (!hunter.value.isFiring) hunter.value.rayProgress = 0;
            draw();
        };

        onMounted(() => {
            width = containerRef.value.clientWidth; height = containerRef.value.clientHeight;
            canvasRef.value.width = width; canvasRef.value.height = height;
            ctx = canvasRef.value.getContext('2d');
            hunter.value.mirrorX = width / 2;
            generateMonster();
            window.addEventListener('resize', () => {
                width = containerRef.value.clientWidth; height = containerRef.value.clientHeight;
                canvasRef.value.width = width; canvasRef.value.height = height;
                draw();
            });
        });

        return { containerRef, canvasRef, hunter, fireHunterRay, handleStart, handleMove, handleEnd: () => { isDragging.value = false; } };
    }
}).mount('#app');