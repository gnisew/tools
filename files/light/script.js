const { createApp, ref, computed, onMounted, onUnmounted, watch, nextTick } = Vue;

createApp({
    setup() {
        const view = ref('menu');
        const containerRef = ref(null);
        const canvasRef = ref(null);
        let ctx = null;
        let width = 0, height = 0;
        let resizeObserver = null;
        let animationFrameId = null;

        const isDragging = ref(false);
        const dragTarget = ref(null); 
        const showGameHint = ref(false);

        // --- 定義介質資料 ---
        const mediaOptions = {
            air:   { n: 1.0,  name: '空氣', color: '#94a3b8' },
            water: { n: 1.33, name: '水',   color: '#22d3ee' },
            glass: { n: 1.5,  name: '玻璃', color: '#c084fc' }
        };

        // --- 透鏡物體選項清單 ---
        const lensObjects = [
            { label: '人偶', emoji: '🧍' },
            { label: '忍者', emoji: '🥷' },
            { label: '蠟燭', emoji: '🕯️' },
            { label: '紅鶴', emoji: '🦩' },
            { label: '手', emoji: '👆' },
            { label: '仙人掌', emoji: '🌵' },
            { label: '衝浪', emoji: '🏄' },
            { label: '便便', emoji: '💩' },
            { label: '鐵塔', emoji: '🗼' }
        ];

        // --- 狀態 ---
        const simParams = ref({ 
            type: 'refraction', 
            sourceX: 300, 
            mirrorAngle: 0,
            activeMedia: ['water'],
            showAngles: false 
        });
        
        // 透鏡模擬參數
        const lensParams = ref({
            type: 'convex',
            f: 150,
            objDist: 250,
            objHeight: 120,
            objEmoji: '🧍'
        });

        // 透鏡計算結果
        const lensData = computed(() => {
            const f = lensParams.value.type === 'convex' ? lensParams.value.f : -lensParams.value.f;
            const do_ = lensParams.value.objDist;
            
            let di = Infinity;
            if (do_ !== f) di = (f * do_) / (do_ - f);
            
            const m = -di / do_; 
            const hi = m * lensParams.value.objHeight;
            let isReal = di > 0;
            
            let desc = '';
            if (Math.abs(do_ - lensParams.value.f) < 2 && lensParams.value.type === 'convex') {
                desc = '不成像 (平行光)';
            } else {
                const nature = isReal ? '實像 (Real)' : '虛像 (Virtual)';
                const orientation = m < 0 ? '倒立 (Inverted)' : '正立 (Upright)';
                let size = '';
                if (Math.abs(m) > 1.05) size = '放大 (Magnified)';
                else if (Math.abs(m) < 0.95) size = '縮小 (Diminished)';
                else size = '相等 (Same Size)';
                
                desc = `${orientation} · ${size} · ${nature}`;
            }
            return { di, m, hi, isReal, desc };
        });
        
        const game = ref({
            type: 'refraction', level: 1, score: 0, state: 'playing', lastCorrect: false,
            targets: [], rayPath: null, source: {x:0, y:0}, mirrorAngle: 0
        });

        const hunter = ref({
            sourceX: 100, mirrorX: 0, score: 0, monster: { x: 0, y: 0, emoji: '👾', dead: false },
            isFiring: false, rayProgress: 0, fullPath: null, hitMonster: false
        });

        const sandbox = ref({
            source: { x: 100, y: 300, angle: 0, isOn: true },
            mirrors: [ { id: 1, x: 400, y: 300, angle: 90, length: 200 } ]
        });

        // --- 文字 ---
        const headerText = computed(() => {
            if (view.value === 'menu') return '';
            if (view.value === 'lens') return '拖曳物體移動，拖曳紅點改變焦距';
            if (view.value === 'sim') return simParams.value.type === 'refraction' ? '比較不同介質的折射差異' : '拖曳光源或鏡子';
            if (view.value === 'game') return game.value.state === 'playing' ? '光線會射向哪裡？' : '測驗結果';
            if (view.value === 'sandbox') return '拖曳物件中心可移動，拖曳邊緣/箭頭可旋轉';
            if (view.value === 'hunter') return '調整光源與鏡子位置，避開障礙，射擊！';
            return '';
        });

        // --- 數學工具 ---
        const getInterfaceY = () => height * 0.6;
        const rad = (deg) => deg * Math.PI / 180;
        const deg = (r) => r * 180 / Math.PI;

        const getMirrorCoords = (cx, cy, angleDeg, len = 320) => {
            const safeAngle = angleDeg || 0;
            const r = rad(safeAngle);
            const dx = (len/2) * Math.cos(r);
            const dy = (len/2) * Math.sin(r);
            return { x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy };
        };

        const calculateSimRay = (type, sx, sy, cx, cy, angleDeg, w, n2 = 1.33) => {
            if (!w) return null;
            if (type === 'refraction') {
                const iAng = Math.atan2(cx - sx, cy - sy); 
                const n1 = 1.0; 
                let sinR = (n1 / n2) * Math.sin(iAng);
                sinR = Math.max(-1, Math.min(1, sinR));
                const rAng = Math.asin(sinR);
                const len = Math.max(w, cy*2) * 1.5;
                const endX = cx + len * Math.sin(rAng);
                const endY = cy + len * Math.cos(rAng);
                return { start: {x:sx, y:sy}, hit: {x:cx, y:cy}, end: {x:endX, y:endY}, normalAngle: 0 };
            } else {
                const safeAngle = angleDeg || 0;
                const mRad = rad(safeAngle);
                const normalRad = mRad - Math.PI/2;
                const idx = cx - sx, idy = cy - sy;
                const dist = Math.sqrt(idx*idx + idy*idy);
                const ix = idx/dist, iy = idy/dist;
                const nx = Math.cos(normalRad), ny = Math.sin(normalRad);
                const dot = ix*nx + iy*ny;
                const rx = ix - 2*dot*nx, ry = iy - 2*dot*ny;
                const len = Math.max(w, cy*2) * 1.5;
                return { start: {x:sx, y:sy}, hit: {x:cx, y:cy}, end: {x:cx+rx*len, y:cy+ry*len}, normalAngle: normalRad };
            }
        };

        // --- 繪圖輔助 ---
        const drawLine = (x1, y1, x2, y2, color, dashed = false) => {
            ctx.save();
            ctx.strokeStyle = color; ctx.lineWidth = 2;
            if(dashed) ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            ctx.restore();
        };

        const drawDashedArrow = (x1, y1, x2, y2, color) => {
            ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 4; ctx.setLineDash([12, 12]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            const angle = Math.atan2(y2-y1, x2-x1);
            const drawHead = (px, py) => { ctx.beginPath(); const s = 14; ctx.moveTo(px, py); ctx.lineTo(px - s * Math.cos(angle-Math.PI/6), py - s * Math.sin(angle-Math.PI/6)); ctx.lineTo(px - s * Math.cos(angle+Math.PI/6), py - s * Math.sin(angle+Math.PI/6)); ctx.setLineDash([]); ctx.fill(); };
            drawHead(x1 + (x2-x1)*0.6, y1 + (y2-y1)*0.6); drawHead(x2, y2); ctx.restore();
        };

        const drawArrowHead = (x, y, angle, color) => {
            ctx.save(); ctx.fillStyle = color; ctx.translate(x, y); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, 6); ctx.lineTo(-6, -6); ctx.closePath(); ctx.fill(); ctx.restore();
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
            ctx.save();
            ctx.fillStyle = 'rgba(200, 230, 255, 0.4)'; 
            ctx.strokeStyle = '#3b82f6'; 
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (type === 'convex') {
                ctx.ellipse(cx, cy, 20, 150, 0, 0, Math.PI * 2);
            } else {
                const wTop = 25; const wMid = 8; const h = 150;      
                ctx.moveTo(cx - wTop, cy - h);
                ctx.lineTo(cx + wTop, cy - h);
                ctx.quadraticCurveTo(cx + wMid, cy, cx + wTop, cy + h);
                ctx.lineTo(cx - wTop, cy + h);
                ctx.quadraticCurveTo(cx - wMid, cy, cx - wTop, cy - h);
            }
            ctx.fill(); ctx.stroke();
            ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1; ctx.setLineDash([5, 3]);
            ctx.beginPath(); ctx.moveTo(cx, cy - 150); ctx.lineTo(cx, cy + 150); ctx.stroke();
            ctx.restore();
        };

        const drawEmojiObject = (x, y, height, emoji, label, isGhost = false) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -height);
            ctx.strokeStyle = isGhost ? 'rgba(168, 85, 247, 0.5)' : '#ef4444';
            ctx.lineWidth = 2; if(isGhost) ctx.setLineDash([5,5]); ctx.stroke();
            ctx.font = `${Math.abs(height)}px serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; 
            if (isGhost) ctx.globalAlpha = 0.5;
            ctx.save();
            if (height < 0) { ctx.scale(-1, -1); ctx.textBaseline = 'bottom'; }
            ctx.fillText(emoji, 0, 0);
            ctx.restore();
            if (label) {
                ctx.fillStyle = isGhost ? '#a855f7' : '#ef4444';
                ctx.font = '14px Arial';
                ctx.fillText(label, 0, height < 0 ? -height + 20 : 20); 
            }
            ctx.restore();
        };

        // --- Hunter 模式 ---
        const monsterEmojis = ['👾', '👽', '👻', '🦇', '🕷️', '🦂', '🛸', '😈', '💀', '☠️', '💩', '🤡', '👹', '👺', '🦟', '🪰', '🦠', '🍩', '🍪', '🎂', '🍰', '🧁', '🍓', '🥝', '🎃', '♥️', '🧑‍🎤', '🛩️', '🚀', '⭐', '☣️'];
        
        const generateMonster = () => {
            const margin = 50; 
            const my = height * 0.8; 
            let mx, my_pos;
            let safe = false;
            while(!safe) {
                mx = margin + Math.random() * (width - 2*margin);
                my_pos = margin + Math.random() * (my - 150);
                safe = true;
            }
            hunter.value.monster = {
                x: mx,
                y: my_pos,
                emoji: monsterEmojis[Math.floor(Math.random() * monsterEmojis.length)],
                dead: false
            };
            hunter.value.hitMonster = false;
            hunter.value.rayProgress = 0;
            draw();
        };

        const calculateHunterPath = () => {
            const sx = hunter.value.sourceX;
            const sy = 60; 
            const cx = hunter.value.mirrorX; 
            const cy = height * 0.8; 
            const dx1 = cx - sx; const dy1 = cy - sy; const len1 = Math.sqrt(dx1*dx1 + dy1*dy1);
            const nx = 0, ny = -1; 
            const ix = dx1 / len1, iy = dy1 / len1; const dot = ix * nx + iy * ny;
            const rx = ix - 2 * dot * nx; const ry = iy - 2 * dot * ny;
            const len2 = Math.max(width, height) * 1.5;
            return {
                start: {x: sx, y: sy}, hit: {x: cx, y: cy}, end: {x: cx + rx * len2, y: cy + ry * len2}, len1: len1, len2: len2
            };
        };

        const hunterLoop = () => {
            if (view.value !== 'hunter' || !hunter.value.isFiring) return;
            hunter.value.rayProgress += 30; 
            const path = hunter.value.fullPath; const totalLen = path.len1 + path.len2;
            
            // 碰撞偵測
            if (!hunter.value.hitMonster && hunter.value.rayProgress > path.len1) {
                const currentReflectLen = hunter.value.rayProgress - path.len1;
                const rx = path.end.x - path.hit.x; const ry = path.end.y - path.hit.y; const rTotal = path.len2;
                const tx = path.hit.x + (rx/rTotal) * currentReflectLen; const ty = path.hit.y + (ry/rTotal) * currentReflectLen;
                const mx = hunter.value.monster.x; const my = hunter.value.monster.y;
                if (Math.hypot(tx - mx, ty - my) < 30) {
                    hunter.value.hitMonster = true; 
                    hunter.value.monster.dead = true; 
                    hunter.value.score++; 
                    hunter.value.isFiring = false; 
                    draw(); 
                    // 延遲1秒讓使用者看清楚角度，然後重置
                    setTimeout(() => { 
                        hunter.value.rayProgress = 0; 
                        generateMonster(); 
                    }, 1000); 
                    return; 
                }
            }
            draw();
            
            if (hunter.value.rayProgress < totalLen && !hunter.value.hitMonster) {
                animationFrameId = requestAnimationFrame(hunterLoop);
            } else {
                // 未擊中，也延遲消失，讓使用者看清楚光路與角度
                hunter.value.isFiring = false; 
                setTimeout(() => {
                    // 確保沒有開始新的發射才清除
                    if(!hunter.value.isFiring) {
                        hunter.value.rayProgress = 0; 
                        draw();
                    }
                }, 1000);
            }
        };

        const fireHunterRay = () => {
            if (hunter.value.isFiring) return;
            hunter.value.isFiring = true; hunter.value.fullPath = calculateHunterPath(); hunter.value.rayProgress = 0; hunter.value.hitMonster = false; hunterLoop();
        };

        // --- 沙盒計算 ---
        const calculateMultiBounce = () => {
             if (!sandbox.value.source.isOn) return [];
            const maxBounces = 50; const segments = []; let currX = sandbox.value.source.x; let currY = sandbox.value.source.y; let currAngle = rad(sandbox.value.source.angle); const epsilon = 0.01;
            for (let i = 0; i < maxBounces; i++) {
                let closestDist = Infinity; let hitRecord = null; const dx = Math.cos(currAngle); const dy = Math.sin(currAngle);
                sandbox.value.mirrors.forEach(mirror => {
                    const mc = getMirrorCoords(mirror.x, mirror.y, mirror.angle, mirror.length);
                    const x1 = currX, y1 = currY; const x2 = currX + dx*10000, y2 = currY + dy*10000;
                    const x3 = mc.x1, y3 = mc.y1; const x4 = mc.x2, y4 = mc.y2;
                    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
                    if (den === 0) return;
                    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
                    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
                    if (t > epsilon && u >= 0 && u <= 1) {
                        const px = x1 + t * (x2 - x1); const py = y1 + t * (y2 - y1);
                        const dist = Math.sqrt((px-x1)**2 + (py-y1)**2);
                        if (dist < closestDist) {
                            closestDist = dist; const mx = x4 - x3, my = y4 - y3; let nx = -my, ny = mx; if (dx*nx + dy*ny > 0) { nx = -nx; ny = -ny; }
                            const nLen = Math.sqrt(nx*nx + ny*ny); nx /= nLen; ny /= nLen; const dot = dx*nx + dy*ny; const rx = dx - 2*dot*nx; const ry = dy - 2*dot*ny;
                            hitRecord = { x: px, y: py, nextAngle: Math.atan2(ry, rx) };
                        }
                    }
                });
                if (!hitRecord) { segments.push({ x1: currX, y1: currY, x2: currX + dx*2000, y2: currY + dy*2000 }); break; } 
                else { segments.push({ x1: currX, y1: currY, x2: hitRecord.x, y2: hitRecord.y }); currX = hitRecord.x; currY = hitRecord.y; currAngle = hitRecord.nextAngle; }
            }
            return segments;
        };

        // --- Lens 繪圖 ---
        const drawLens = () => {
            const cx = width / 2; const cy = height / 2; const lp = lensParams.value; const ld = lensData.value; const fPx = lp.f;
            ctx.save(); ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1; ctx.beginPath(); for(let i=0; i<width; i+=20) { ctx.moveTo(i,0); ctx.lineTo(i,height); } for(let i=0; i<height; i+=20) { ctx.moveTo(0,i); ctx.lineTo(width,i); } ctx.stroke(); ctx.restore();
            drawLine(0, cy, width, cy, '#64748b'); drawLensShape(cx, cy, lp.type);
            drawPoint(cx - fPx, cy, '#ef4444', 'F'); drawPoint(cx + fPx, cy, '#ef4444', 'F'); drawPoint(cx - fPx*2, cy, '#94a3b8', '2F'); drawPoint(cx + fPx*2, cy, '#94a3b8', '2F');
            const objX = cx - lp.objDist; const objTipY = cy - lp.objHeight;
            drawEmojiObject(objX, cy, lp.objHeight, lp.objEmoji, '物體'); drawPoint(objX, objTipY, '#ef4444');
            const imgX = cx + ld.di; const imgTipY = cy - ld.hi; if (Math.abs(ld.di) < 3000) { drawEmojiObject(imgX, cy, ld.hi, lp.objEmoji, '像', !ld.isReal); }
            const tipX = objX; const tipY = objTipY; drawLine(tipX, tipY, cx, tipY, '#ef4444'); 
            if (lp.type === 'convex') { const slope = (cy - tipY) / fPx; const endX = width; const endY = tipY + slope * (width - cx); drawLine(cx, tipY, endX, endY, '#ef4444'); if (!ld.isReal) drawLine(cx, tipY, imgX, imgTipY, '#ef4444', true); } 
            else { const slope = (tipY - cy) / fPx; const endX = width; const endY = tipY - slope * (width - cx); drawLine(cx, tipY, endX, endY, '#ef4444'); drawLine(cx, tipY, cx - fPx, cy, '#ef4444', true); }
            const slope2 = (cy - tipY) / (cx - tipX); const endX2 = width; const endY2 = cy + slope2 * (width - cx); drawLine(tipX, tipY, endX2, endY2, '#10b981'); if(!ld.isReal) drawLine(cx, cy, imgX, imgTipY, '#10b981', true);
        };

        // --- 主繪圖 ---
        const draw = () => {
            if (!ctx || !width) return;
            ctx.clearRect(0, 0, width, height);
            
            if (view.value === 'lens') { drawLens(); return; }

            // Sandbox
            if (view.value === 'sandbox') {
                 sandbox.value.mirrors.forEach(m => { const mc = getMirrorCoords(m.x, m.y, m.angle, m.length); ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(mc.x1, mc.y1); ctx.lineTo(mc.x2, mc.y2); ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = 'white'; ctx.beginPath(); ctx.moveTo(mc.x1, mc.y1); ctx.lineTo(mc.x2, mc.y2); ctx.stroke(); const drawKnob = (kx, ky) => { ctx.beginPath(); ctx.arc(kx, ky, 6, 0, Math.PI*2); ctx.fillStyle = 'white'; ctx.fill(); }; drawKnob(m.x, m.y); drawKnob(mc.x1, mc.y1); drawKnob(mc.x2, mc.y2); ctx.restore(); });
                 const src = sandbox.value.source; ctx.save(); ctx.translate(src.x, src.y); ctx.rotate(rad(src.angle)); ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2); ctx.fillStyle = src.isOn ? '#facc15' : '#475569'; ctx.fill();  ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(35, 0); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.arc(35, 0, 5, 0, Math.PI*2); ctx.fillStyle='white'; ctx.fill(); ctx.restore();
                 if (src.isOn) { const segments = calculateMultiBounce(); ctx.save(); ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.beginPath(); segments.forEach(seg => { ctx.moveTo(seg.x1, seg.y1); ctx.lineTo(seg.x2, seg.y2); }); ctx.stroke(); ctx.restore(); }
                 return;
            }

            // Hunter
            if (view.value === 'hunter') {
                const cx = hunter.value.mirrorX; const cy = height * 0.8; const mc = getMirrorCoords(cx, cy, 0); 
                ctx.save(); ctx.lineWidth = 8; ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(mc.x1, mc.y1); ctx.lineTo(mc.x2, mc.y2); ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = '#f8fafc'; ctx.beginPath(); ctx.moveTo(mc.x1, mc.y1); ctx.lineTo(mc.x2, mc.y2); ctx.stroke();
                ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI*2); ctx.fillStyle = '#64748b'; ctx.fill(); ctx.strokeStyle = 'white'; ctx.stroke(); ctx.restore();
                ctx.save(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 200); ctx.stroke(); ctx.restore();
                const mn = hunter.value.monster;
                if (!mn.dead) { ctx.save(); ctx.font = '48px serif'; ctx.textAlign = 'center';  ctx.textBaseline = 'middle'; ctx.fillText(mn.emoji, mn.x, mn.y); ctx.restore(); } 
                else if (hunter.value.hitMonster) { ctx.save(); ctx.font = '60px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💥', mn.x, mn.y); ctx.restore(); }
                const sx = hunter.value.sourceX; const sy = 60;
                ctx.save(); ctx.setLineDash([2, 8]); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(cx, cy); ctx.stroke(); ctx.restore();
                ctx.beginPath(); ctx.arc(sx, sy, 20, 0, Math.PI*2); ctx.fillStyle = '#ef4444'; ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();
                
                if (hunter.value.isFiring || hunter.value.rayProgress > 0) {
                    const path = hunter.value.fullPath; const prog = hunter.value.rayProgress;
                    ctx.save(); ctx.lineWidth = 4;  ctx.shadowBlur = 10; ctx.shadowColor = '#facc15'; ctx.strokeStyle = '#facc15'; ctx.lineCap = 'round'; ctx.setLineDash([15, 10]); 
                    ctx.beginPath(); let tipX = sx, tipY = sy, tipAngle = 0;
                    if (prog > 0) {
                        ctx.moveTo(path.start.x, path.start.y);
                        if (prog <= path.len1) { const ratio = prog / path.len1; tipX = path.start.x + (path.hit.x - path.start.x) * ratio; tipY = path.start.y + (path.hit.y - path.start.y) * ratio; tipAngle = Math.atan2(path.hit.y - path.start.y, path.hit.x - path.start.x); ctx.lineTo(tipX, tipY); } 
                        else { ctx.lineTo(path.hit.x, path.hit.y); const rLen = prog - path.len1; const rRatio = Math.min(1, rLen / path.len2); tipX = path.hit.x + (path.end.x - path.hit.x) * rRatio; tipY = path.hit.y + (path.end.y - path.hit.y) * rRatio; tipAngle = Math.atan2(path.end.y - path.hit.y, path.end.x - path.hit.x); ctx.lineTo(tipX, tipY); }
                    }
                    ctx.stroke(); ctx.restore(); drawArrowHead(tipX, tipY, tipAngle, '#facc15');

                    // === 新增：繪製入射角與反射角 ===
                    if (prog > path.len1) {
                        const hitX = path.hit.x; const hitY = path.hit.y;
                        const normalAng = -Math.PI / 2;
                        const vecS = { x: sx - hitX, y: sy - hitY };
                        const angS = Math.atan2(vecS.y, vecS.x);
                        let degI = Math.abs(deg(angS - normalAng));
                        if (degI > 180) degI = 360 - degI;
                        const displayDeg = degI.toFixed(1) + '°';
                        
                        const r = 40;
                        ctx.save();
                        ctx.lineWidth = 2; ctx.setLineDash([]);
                        ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

                        const isLeft = sx < hitX; 
                        
                        // 入射角 (黃色)
                        ctx.strokeStyle = '#facc15'; ctx.fillStyle = '#facc15';
                        ctx.beginPath(); ctx.arc(hitX, hitY, r, normalAng, angS, isLeft); ctx.stroke();
                        const txtOffset = 0.5; const txtDist = r + 20;
                        const txtAngI = normalAng + (isLeft ? -txtOffset : txtOffset);
                        ctx.fillText(displayDeg, hitX + txtDist*Math.cos(txtAngI), hitY + txtDist*Math.sin(txtAngI));

                        // 反射角 (紅色)
                        const vecE = { x: path.end.x - hitX, y: path.end.y - hitY };
                        const angE = Math.atan2(vecE.y, vecE.x);
                        ctx.strokeStyle = '#ef4444'; ctx.fillStyle = '#ef4444';
                        ctx.beginPath(); ctx.arc(hitX, hitY, r, normalAng, angE, !isLeft); ctx.stroke();
                        const txtAngR = normalAng + (isLeft ? txtOffset : -txtOffset);
                        ctx.fillText(displayDeg, hitX + txtDist*Math.cos(txtAngR), hitY + txtDist*Math.sin(txtAngR));
                        
                        ctx.restore();
                    }
                }
                return;
            }

            // Sim/Game
            const cy = getInterfaceY();
            const cx = width / 2;
            const type = view.value === 'game' ? game.value.type : simParams.value.type;

            if (type === 'refraction') {
                const isSim = view.value === 'sim';
                ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy);
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.setLineDash([]); ctx.stroke();
                if (isSim) { ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; ctx.fillRect(0, cy, width, height - cy); ctx.font = '16px sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.fillText('空氣', 20, cy - 10); ctx.fillStyle = '#94a3b8'; ctx.fillText('介質 (請選擇)', 20, cy + 25); }
                else { ctx.fillStyle = 'rgba(6, 182, 212, 0.1)'; ctx.fillRect(0, cy, width, height - cy); ctx.font = '16px sans-serif'; ctx.fillStyle = '#94a3b8'; ctx.fillText('空氣', 20, cy - 10); ctx.fillStyle = '#22d3ee'; ctx.fillText('水', 20, cy + 25); }
            } else {
                const ang = view.value === 'game' ? (game.value.mirrorAngle || 0) : simParams.value.mirrorAngle;
                const mc = getMirrorCoords(cx, cy, ang);
                ctx.save(); ctx.lineWidth = 8; ctx.strokeStyle = '#94a3b8'; ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(mc.x1, mc.y1); ctx.lineTo(mc.x2, mc.y2); ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = '#f8fafc'; ctx.beginPath(); ctx.moveTo(mc.x1, mc.y1); ctx.lineTo(mc.x2, mc.y2); ctx.stroke(); ctx.restore();
                if (view.value === 'sim') { ctx.beginPath(); ctx.arc(mc.x2, mc.y2, 12, 0, Math.PI*2); ctx.fillStyle = 'white'; ctx.fill(); ctx.stroke(); }
            }

            if (view.value === 'game' && !game.value.rayPath) return;
            const sx = (view.value === 'game') ? game.value.rayPath.start.x : simParams.value.sourceX;
            const sy = (view.value === 'game') ? game.value.rayPath.start.y : 80;
            const hitX = (view.value === 'game') ? game.value.rayPath.hit.x : cx;
            const hitY = cy; 

            ctx.save(); ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath();
            
            let ray;
            if (view.value === 'game') ray = game.value.rayPath;
            else ray = calculateSimRay(type, sx, sy, cx, cy, simParams.value.mirrorAngle, width);

            if (type === 'refraction') { ctx.moveTo(hitX, hitY - 300); ctx.lineTo(hitX, hitY + 300); }
            else { 
                if (ray) { const na = ray.normalAngle; ctx.moveTo(hitX, hitY); ctx.lineTo(hitX+Math.cos(na)*200, hitY+Math.sin(na)*200); }
            }
            ctx.stroke(); ctx.restore();

            ctx.beginPath(); ctx.arc(sx, sy, 14, 0, Math.PI*2); ctx.fillStyle = '#facc15'; ctx.fill(); ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.setLineDash([]); ctx.stroke();

            // Sim Mode: Angles
            if (view.value === 'sim' && type === 'reflection' && simParams.value.showAngles && ray) {
                const normalAng = ray.normalAngle;
                const vecS = { x: sx - hitX, y: sy - hitY };
                const angS = Math.atan2(vecS.y, vecS.x);
                let degI = Math.abs(deg(angS - normalAng));
                if (degI > 180) degI = 360 - degI;
                const displayDeg = degI.toFixed(1) + '°';
                let isLeft = angS < normalAng; if (Math.abs(angS - normalAng) > Math.PI) isLeft = !isLeft;
                const r = 50; const textOffsetRad = 0.5; const textDist = r + 25;
                ctx.save(); ctx.lineWidth = 2; ctx.setLineDash([]); ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.strokeStyle = '#facc15'; ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(hitX, hitY, r, normalAng, angS, isLeft); ctx.stroke();
                const txtAngI = normalAng + (isLeft ? -textOffsetRad : textOffsetRad);
                ctx.fillText(displayDeg, hitX + textDist * Math.cos(txtAngI), hitY + textDist * Math.sin(txtAngI));
                const vecE = { x: ray.end.x - hitX, y: ray.end.y - hitY }; const angE = Math.atan2(vecE.y, vecE.x);
                ctx.strokeStyle = '#ef4444'; ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(hitX, hitY, r, normalAng, angE, !isLeft); ctx.stroke();
                const txtAngR = normalAng + (isLeft ? textOffsetRad : -textOffsetRad);
                ctx.fillText(displayDeg, hitX + textDist * Math.cos(txtAngR), hitY + textDist * Math.sin(txtAngR));
                ctx.restore();
            }

            if (view.value === 'sim' && type === 'refraction') {
                drawDashedArrow(sx, sy, hitX, hitY, '#facc15');
                if (simParams.value.activeMedia.length === 0) { ctx.font = '20px sans-serif'; ctx.fillStyle = '#ef4444'; ctx.textAlign='center'; ctx.fillText('請勾選下方介質', width/2, height - 50); }
                else { simParams.value.activeMedia.forEach(key => { const m = mediaOptions[key]; const r = calculateSimRay('refraction', sx, sy, cx, cy, 0, width, m.n); if(r) { drawDashedArrow(r.hit.x, r.hit.y, r.end.x, r.end.y, m.color); ctx.fillStyle = m.color; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(m.name, r.end.x + 10, r.end.y); } }); }
            } else {
                drawDashedArrow(sx, sy, ray.hit.x, ray.hit.y, '#facc15');
                if (view.value === 'sim' || game.value.state === 'result') { const color = (view.value === 'sim' || game.value.lastCorrect) ? '#facc15' : '#ef4444'; drawDashedArrow(ray.hit.x, ray.hit.y, ray.end.x, ray.end.y, color); }
            }
            if (view.value === 'game' && game.value.targets.length) { game.value.targets.forEach(t => { const isResult = game.value.state === 'result'; const dim = isResult && !t.isCorrect; ctx.save(); ctx.globalAlpha = dim ? 0.2 : 1.0; ctx.beginPath(); ctx.arc(t.x, t.y, 6, 0, Math.PI*2); ctx.fillStyle = t.color; ctx.fill(); ctx.strokeStyle='white'; ctx.lineWidth=2; ctx.setLineDash([]); ctx.stroke(); ctx.fillStyle = t.color; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(t.label, t.x, t.y - 12); ctx.restore(); }); }
        };

        const getPointerPos = (e) => { const r = canvasRef.value.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
        const handleStart = (e) => { const p = getPointerPos(e); if (e.target.setPointerCapture) { e.target.setPointerCapture(e.pointerId); } if (view.value === 'lens') { const cx = width / 2; const cy = height / 2; const lp = lensParams.value; const objX = cx - lp.objDist; const objY = cy - lp.objHeight; if (Math.hypot(p.x - objX, p.y - objY) < 30) { isDragging.value = true; dragTarget.value = { type: 'lens_obj' }; return; } if (Math.hypot(p.x - (cx - lp.f), p.y - cy) < 30 || Math.hypot(p.x - (cx + lp.f), p.y - cy) < 30) { isDragging.value = true; dragTarget.value = { type: 'lens_focus' }; return; } return; } if (view.value === 'hunter') { const sx = hunter.value.sourceX; const sy = 60; if (Math.hypot(p.x - sx, p.y - sy) < 40) { isDragging.value = true; dragTarget.value = { type: 'hunter_source' }; return; } const mx = hunter.value.mirrorX; const my = height * 0.8; if (Math.hypot(p.x - mx, p.y - my) < 50) { isDragging.value = true; dragTarget.value = { type: 'hunter_mirror' }; return; } return; } if (view.value === 'sandbox') { const src = sandbox.value.source; if (Math.hypot(p.x - src.x, p.y - src.y) < 30) { isDragging.value = true; dragTarget.value = { type: 'source', part: 'center' }; return; } const radAng = rad(src.angle); const hx = src.x + 35 * Math.cos(radAng); const hy = src.y + 35 * Math.sin(radAng); if (Math.hypot(p.x - hx, p.y - hy) < 20) { isDragging.value = true; dragTarget.value = { type: 'source', part: 'handle' }; return; } for (let i = 0; i < sandbox.value.mirrors.length; i++) { const m = sandbox.value.mirrors[i]; const mc = getMirrorCoords(m.x, m.y, m.angle, m.length); if (Math.hypot(p.x - m.x, p.y - m.y) < 25) { isDragging.value = true; dragTarget.value = { type: 'mirror', id: i, part: 'center' }; return; } if (Math.hypot(p.x - mc.x1, p.y - mc.y1) < 25 || Math.hypot(p.x - mc.x2, p.y - mc.y2) < 25) { isDragging.value = true; dragTarget.value = { type: 'mirror', id: i, part: 'end' }; return; } } return; } if (view.value === 'sim') { const sx = simParams.value.sourceX, sy = 80; if (Math.hypot(p.x - sx, p.y - sy) < 50) { isDragging.value = true; dragTarget.value = { type: 'sim_source' }; return; } if (simParams.value.type === 'reflection') { const cx = width/2, cy = getInterfaceY(); const mc = getMirrorCoords(cx, cy, simParams.value.mirrorAngle); if (Math.hypot(p.x - mc.x2, p.y - mc.y2) < 50) { isDragging.value = true; dragTarget.value = { type: 'sim_mirror' }; return; } } } if (view.value === 'game' && game.value.state === 'playing') { let closestIdx = -1; let minDist = Infinity; game.value.targets.forEach((t, i) => { const d = Math.hypot(p.x - t.x, p.y - t.y); if (d < minDist) { minDist = d; closestIdx = i; } }); if (closestIdx !== -1 && minDist < 80) submitAnswer(closestIdx); } };
        const handleMove = (e) => { if (!isDragging.value) return; const p = getPointerPos(e); const dt = dragTarget.value; if (dt.type === 'lens_obj') { const cx = width / 2; const cy = height / 2; const newDist = Math.max(10, cx - p.x); lensParams.value.objDist = newDist; lensParams.value.objHeight = Math.max(-250, Math.min(250, cy - p.y)); } else if (dt.type === 'lens_focus') { const cx = width / 2; lensParams.value.f = Math.max(20, Math.abs(p.x - cx)); } else if (dt.type === 'hunter_source') { hunter.value.sourceX = Math.max(20, Math.min(width - 20, p.x)); if (!hunter.value.isFiring) hunter.value.rayProgress = 0; } else if (dt.type === 'hunter_mirror') { const centerX = width / 2; const limit = 150; hunter.value.mirrorX = Math.max(centerX - limit, Math.min(centerX + limit, p.x)); if (!hunter.value.isFiring) hunter.value.rayProgress = 0; } else if (dt.type === 'source') { if (dt.part === 'center') { sandbox.value.source.x = p.x; sandbox.value.source.y = p.y; } else { const src = sandbox.value.source; sandbox.value.source.angle = deg(Math.atan2(p.y - src.y, p.x - src.x)); } } else if (dt.type === 'mirror') { const m = sandbox.value.mirrors[dt.id]; if (dt.part === 'center') { m.x = p.x; m.y = p.y; } else { m.angle = deg(Math.atan2(p.y - m.y, p.x - m.x)); } } else if (dt.type === 'sim_source') { simParams.value.sourceX = Math.max(20, Math.min(width - 20, p.x)); } else if (dt.type === 'sim_mirror') { const cx = width/2, cy = getInterfaceY(); let ang = deg(Math.atan2(p.y - cy, p.x - cx)); if (ang > 180) ang -= 360; simParams.value.mirrorAngle = Math.max(-45, Math.min(45, ang)); } if (view.value === 'hunter' || (view.value === 'sim' && simParams.value.type === 'refraction') || view.value === 'lens' || (view.value === 'sim' && simParams.value.type === 'reflection')) draw(); };
        const handleEnd = (e) => { isDragging.value = false; dragTarget.value = null; if (e && e.target.releasePointerCapture) { e.target.releasePointerCapture(e.pointerId); } };
        const toggleSandboxLight = () => { sandbox.value.source.isOn = !sandbox.value.source.isOn; };
        const addMirror = () => { if (sandbox.value.mirrors.length >= 6) return; sandbox.value.mirrors.push({ x: width/2 + (Math.random()-0.5)*200, y: height/2 + (Math.random()-0.5)*200, angle: Math.random()*180, length: 200 }); };
        const removeMirror = () => { sandbox.value.mirrors.pop(); };
        const submitAnswer = (idx) => { const t = game.value.targets[idx]; game.value.lastCorrect = t.isCorrect; if (t.isCorrect) game.value.score += 20; game.value.state = 'result'; draw(); };
        const generateLevel = () => { if (!width) return; game.value.state = 'playing'; if (game.value.level === 1) { showGameHint.value = true; setTimeout(() => showGameHint.value = false, 2500); } const cx = width/2, cy = getInterfaceY(); const isLeft = Math.random()>0.5; let sx; if (isLeft) sx = Math.random()*(cx-220)+40; else sx = Math.random()*(width-40-(cx+180))+(cx+180); const sy = 80+Math.random()*50; const mAngle = game.value.type === 'reflection' ? (Math.random()*50-25) : 0; const ray = calculateSimRay(game.value.type, sx, sy, cx, cy, mAngle, width); game.value.rayPath = ray; game.value.source = {x:sx, y:sy}; game.value.mirrorAngle = mAngle; let raw = []; const tDist = Math.min(width, height)*0.35; const rVx = ray.end.x - ray.hit.x, rVy = ray.end.y - ray.hit.y; const rLen = Math.sqrt(rVx*rVx + rVy*rVy); raw.push({ x: ray.hit.x+(rVx/rLen)*tDist, y: ray.hit.y+(rVy/rLen)*tDist, isCorrect: true }); const isTooClose = (p) => raw.some(ex => Math.hypot(p.x - ex.x, p.y - ex.y) < 80); if (game.value.type === 'refraction') { const iVx = ray.hit.x-sx, iVy = ray.hit.y-sy; const iLen = Math.sqrt(iVx*iVx+iVy*iVy); let p1 = { x: ray.hit.x+(iVx/iLen)*tDist, y: ray.hit.y+(iVy/iLen)*tDist, isCorrect: false }; raw.push(p1); let p2; let a=0; while(a<20) { const ang = Math.atan2(rVy, -rVx); const off = (Math.random()-0.5)*0.5; p2 = { x: ray.hit.x+Math.cos(ang+off)*tDist, y: ray.hit.y+Math.sin(ang+off)*tDist, isCorrect: false }; if (!isTooClose(p2) && Math.abs(p2.x-p1.x)>60) break; a++; } raw.push(p2); } else { while(raw.length<3) { const ang = Math.atan2(rVy, rVx); const off = (Math.random()>0.5?1:-1)*(0.5+Math.random()*0.8); let p = { x: ray.hit.x+Math.cos(ang+off)*tDist, y: ray.hit.y+Math.sin(ang+off)*tDist, isCorrect: false }; if (!isTooClose(p)) raw.push(p); } } for(let i=raw.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [raw[i], raw[j]]=[raw[j], raw[i]]; } const L=['A','B','C'], C=['#f472b6','#a78bfa','#4ade80']; game.value.targets = raw.map((t,i)=>({...t, label:L[i], color:C[i]})); draw(); };
        const resizeCanvas = () => { if(!containerRef.value) return; width = containerRef.value.clientWidth; height = containerRef.value.clientHeight; canvasRef.value.width = width; canvasRef.value.height = height; ctx = canvasRef.value.getContext('2d'); if(view.value === 'sim' && simParams.value.sourceX > width) simParams.value.sourceX = width-50; if(hunter.value.mirrorX === 0) hunter.value.mirrorX = width / 2; draw(); };
        const startSim = (t) => { simParams.value.type = t; view.value = 'sim'; nextTick(() => { resizeCanvas(); draw(); }); };
        const startLens = () => { view.value = 'lens'; nextTick(() => { resizeCanvas(); draw(); }); }; 
        const startSandbox = () => { view.value = 'sandbox'; nextTick(() => { resizeCanvas(); draw(); }); };
        const startGame = (t) => { game.value = { type: t, level: 1, score: 0, state: 'playing', targets: [], rayPath: null }; view.value = 'game'; nextTick(() => { resizeCanvas(); setTimeout(generateLevel, 50); }); };
        const startHunter = () => { view.value = 'hunter'; hunter.value = { sourceX: width ? width/2 : 100, mirrorX: width ? width/2 : 0, score: 0, monster: { x:0, y:0, emoji:'👾', dead:false }, isFiring: false, rayProgress: 0, fullPath: null, hitMonster: false }; nextTick(() => { resizeCanvas(); generateMonster(); draw(); }); };
        const nextLevel = () => { if(game.value.level >= 5) game.value.state = 'summary'; else { game.value.level++; generateLevel(); } };
        const goHome = () => { view.value = 'menu'; if (animationFrameId) cancelAnimationFrame(animationFrameId); hunter.value.isFiring = false; };

        onMounted(() => { if(window.ResizeObserver) { resizeObserver = new ResizeObserver(resizeCanvas); resizeObserver.observe(containerRef.value); } else window.addEventListener('resize', resizeCanvas); });
        onUnmounted(() => resizeObserver?.disconnect());
        watch(simParams, () => { if(view.value === 'sim') requestAnimationFrame(draw); }, { deep: true });
        watch(sandbox, () => { if(view.value === 'sandbox') requestAnimationFrame(draw); }, { deep: true });
        watch(lensParams, () => { if(view.value === 'lens') requestAnimationFrame(draw); }, { deep: true });

        return { view, simParams, lensParams, lensData, game, sandbox, hunter, showGameHint, containerRef, canvasRef, headerText, startSim, startLens, startSandbox, startGame, startHunter, nextLevel, goHome, handleStart, handleMove, handleEnd, toggleSandboxLight, addMirror, removeMirror, fireHunterRay, mediaOptions, lensObjects };
    }
}).mount('#app');