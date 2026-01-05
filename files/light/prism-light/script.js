const { createApp, ref, onMounted, watch, computed } = Vue;

createApp({
    setup() {
        const containerRef = ref(null);
        const canvasRef = ref(null);
        let ctx = null, width = 0, height = 0;

        const mode = ref('single'); // 預設改為單稜鏡
        const dragTarget = ref(null);

        // 1. 物理參數：使用 Math.sqrt(3)/3 確保幾何上的完美無縫
        const prismSide = 240; 
        const prismSafetyRadius = prismSide * (Math.sqrt(3) / 3); 
        
        // 2. 狀態管理
        const sourceX = ref(100), sourceY = ref(300), sourceAngle = ref(0);
        const prism1 = ref({ x: 350, y: 300, rotation: 0 });
        const prism2 = ref({ x: 600, y: 300, rotation: Math.PI });

        const selectedPrism = ref('flint');
        const activeColorIndices = ref([0, 1, 2, 3, 4, 5, 6]);

        // 角度與弳度雙向綁定 (用於頂端滑桿)
        const prism1Deg = computed({
            get: () => Math.round((prism1.value.rotation * 180 / Math.PI) % 360),
            set: (val) => { prism1.value.rotation = (val * Math.PI / 180); }
        });
        const prism2Deg = computed({
            get: () => Math.round((prism2.value.rotation * 180 / Math.PI) % 360),
            set: (val) => { prism2.value.rotation = (val * Math.PI / 180); }
        });

        // 【關鍵修正】自動貼合邏輯：計算旋轉後的相對向量，達成平行四邊形組合
        const autoFit = () => {
            // 1. 設定稜鏡2為反向角度
            prism2.value.rotation = prism1.value.rotation + Math.PI;
            
            // 2. 計算貼合向量：
            // 在 0 度時，右側面的法線方向是 -30 度 (即 -PI/6)
            // 我們根據 prism1 的當前旋轉 theta 加上這個偏移
            const theta = prism1.value.rotation;
            const fitAngle = theta - Math.PI / 6;
            
            // 3. 根據向量移動 prism2 中心點
            prism2.value.x = prism1.value.x + prismSafetyRadius * Math.cos(fitAngle);
            prism2.value.y = prism1.value.y + prismSafetyRadius * Math.sin(fitAngle);
            
            draw();
        };

        const prismOptions = {
            crown: { name: '冕牌玻璃', baseN: 1.52, dispersion: 0.04, uiColor: '#cbd5e1' },
            flint: { name: '火石玻璃', baseN: 1.66, dispersion: 0.07, uiColor: '#94a3b8' },
            diamond: { name: '鑽石', baseN: 2.42, dispersion: 0.15, uiColor: '#bae6fd' }
        };

        const spectrum = [
            { color: '#FF3D3D', offset: -0.6 }, { color: '#FF913D', offset: -0.4 },
            { color: '#FFD700', offset: -0.2 }, { color: '#3DFF3D', offset: 0.1 },
            { color: '#3D72FF', offset: 0.4 }, { color: '#663DFF', offset: 0.7 },
            { color: '#B03DFF', offset: 1.0 }
        ];

        const angleHandleRadius = 80;
        const angleHandleX = computed(() => sourceX.value + angleHandleRadius * Math.cos(sourceAngle.value));
        const angleHandleY = computed(() => sourceY.value + angleHandleRadius * Math.sin(sourceAngle.value));

        // 3. 幾何運算 (完全移除圓角以消除物理誤差)
        const getBasePoints = (p) => {
            const h = (Math.sqrt(3) / 2) * prismSide;
            const pts = [{ x: 0, y: -h * 2/3 }, { x: -prismSide/2, y: h * 1/3 }, { x: prismSide/2, y: h * 1/3 }];
            return pts.map(pt => ({
                x: p.x + pt.x * Math.cos(p.rotation) - pt.y * Math.sin(p.rotation),
                y: p.y + pt.x * Math.sin(p.rotation) + pt.y * Math.cos(p.rotation)
            }));
        };

        const intersect = (x1, y1, x2, y2, x3, y3, x4, y4) => {
            const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (den === 0) return null;
            const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
            const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
            return (t >= 0 && t <= 1 && u >= 0 && u <= 1) ? { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) } : null;
        };

        const refract = (iX, iY, nX, nY, n1, n2) => {
            const cosI = -(nX * iX + nY * iY);
            const sinT2 = (n1/n2)**2 * (1 - cosI**2);
            if (sinT2 > 1) return null; 
            const cosT = Math.sqrt(1 - sinT2);
            return { x: (n1/n2)*iX + ((n1/n2)*cosI - cosT)*nX, y: (n1/n2)*iY + ((n1/n2)*cosI - cosT)*nY };
        };

        const traceRayMulti = (sx, sy, angle, nBase, dispersion, offset) => {
            const n = nBase + (offset * dispersion);
            let currX = sx, currY = sy, dirX = Math.cos(angle), dirY = Math.sin(angle);
            const segments = [];
            const rayLen = 2500;
            const activePrisms = [getBasePoints(prism1.value)];
            if(mode.value === 'newton') activePrisms.push(getBasePoints(prism2.value));

            // 【修正】確保光線穿過順序的邏輯變數正確
            activePrisms.sort((a, b) => {
                const centerAX = (a[0].x + a[1].x + a[2].x) / 3;
                const centerBX = (b[0].x + b[1].x + b[2].x) / 3;
                return centerAX - centerBX;
            });

            activePrisms.forEach(tri => {
                let hit1 = null, edge1 = -1, minDist = Infinity;
                for(let i=0; i<3; i++) {
                    const p = intersect(currX, currY, currX + dirX*rayLen, currY + dirY*rayLen, tri[i].x, tri[i].y, tri[(i+1)%3].x, tri[(i+1)%3].y);
                    if(p) {
                        const d = Math.hypot(p.x - currX, p.y - currY);
                        if (d < minDist) { minDist = d; hit1 = p; edge1 = i; }
                    }
                }
                if(!hit1) return;
                segments.push({x1: currX, y1: currY, x2: hit1.x, y2: hit1.y});
                const p1 = tri[edge1], p2 = tri[(edge1+1)%3];
                let norm1 = { x: -(p2.y - p1.y), y: p2.x - p1.x };
                const m1 = Math.sqrt(norm1.x**2 + norm1.y**2);
                norm1.x /= m1; norm1.y /= m1;
                if (dirX * norm1.x + dirY * norm1.y > 0) { norm1.x *= -1; norm1.y *= -1; }
                const dirIn = refract(dirX, dirY, norm1.x, norm1.y, 1.0, n);
                if(!dirIn) return;
                let hit2 = null, edge2 = -1, minExitDist = Infinity;
                for(let i=0; i<3; i++) {
                    if(i === edge1) continue;
                    const p = intersect(hit1.x + dirIn.x*0.1, hit1.y + dirIn.y*0.1, hit1.x + dirIn.x*rayLen, hit1.y + dirIn.y*rayLen, tri[i].x, tri[i].y, tri[(i+1)%3].x, tri[(i+1)%3].y);
                    if(p) {
                        const d = Math.hypot(p.x - hit1.x, p.y - hit1.y);
                        if (d < minExitDist) { minExitDist = d; hit2 = p; edge2 = i; }
                    }
                }
                if(!hit2) return;
                segments.push({x1: hit1.x, y1: hit1.y, x2: hit2.x, y2: hit2.y});
                const ep1 = tri[edge2], ep2 = tri[(edge2+1)%3];
                let norm2 = { x: -(ep2.y - ep1.y), y: ep2.x - ep1.x };
                const m2 = Math.sqrt(norm2.x**2 + norm2.y**2);
                norm2.x /= m2; norm2.y /= m2;
                if (dirIn.x * norm2.x + dirIn.y * norm2.y > 0) { norm2.x *= -1; norm2.y *= -1; }
                const dirOut = refract(dirIn.x, dirIn.y, norm2.x, norm2.y, n, 1.0);
                if(!dirOut) return;
                currX = hit2.x; currY = hit2.y; dirX = dirOut.x; dirY = dirOut.y;
            });
            segments.push({x1: currX, y1: currY, x2: currX + dirX*rayLen, y2: currY + dirY*rayLen});
            return segments;
        };

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            const prismConf = prismOptions[selectedPrism.value];
            [prism1, prism2].forEach((p, idx) => {
                if(idx === 1 && mode.value !== 'newton') return;
                const pts = getBasePoints(p.value);
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.lineTo(pts[2].x, pts[2].y);
                ctx.closePath();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 2; ctx.stroke();
                // 畫出頂尖標記點 (紅點)
                ctx.fillStyle = idx === 0 ? 'rgba(255, 50, 50, 0.6)' : 'rgba(50, 150, 255, 0.6)';
                ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, 5, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            });
            ctx.globalCompositeOperation = 'lighter';
            activeColorIndices.value.forEach(idx => {
                const s = spectrum[idx];
                const segs = traceRayMulti(sourceX.value, sourceY.value, sourceAngle.value, prismConf.baseN, prismConf.dispersion, s.offset);
                ctx.save(); ctx.lineWidth = 3; ctx.shadowBlur = 4; ctx.shadowColor = s.color;
                segs.forEach((seg, i) => {
                    ctx.beginPath();
                    ctx.strokeStyle = (i === 0) ? 'rgba(255,255,255,0.6)' : s.color;
                    ctx.moveTo(seg.x1, seg.y1); ctx.lineTo(seg.x2, seg.y2);
                    ctx.stroke();
                });
                ctx.restore();
            });
            ctx.globalCompositeOperation = 'source-over';
        };

        const handleStart = (target) => { dragTarget.value = target; };
        const rotateHandleStyle = (rot) => ({
            left: (50 + 75 * Math.cos(rot - Math.PI/2)) + '%',
            top: (50 + 75 * Math.sin(rot - Math.PI/2)) + '%'
        });

        onMounted(() => {
            ctx = canvasRef.value.getContext('2d');
            window.addEventListener('pointermove', (e) => {
                if (!dragTarget.value) return;
                const r = containerRef.value.getBoundingClientRect();
                const mx = e.clientX - r.left, my = e.clientY - r.top;
                if (dragTarget.value === 'source') { sourceX.value = mx; sourceY.value = my; }
                else if (dragTarget.value === 'angle') { sourceAngle.value = Math.atan2(my - sourceY.value, mx - sourceX.value); }
                else if (dragTarget.value === 'p1_move') {
                    if (mode.value === 'newton' && Math.hypot(mx-prism2.value.x, my-prism2.value.y) < prismSafetyRadius - 1) return;
                    prism1.value.x = mx; prism1.value.y = my;
                }
                else if (dragTarget.value === 'p2_move') {
                    if (Math.hypot(mx-prism1.value.x, my-prism1.value.y) < prismSafetyRadius - 1) return;
                    prism2.value.x = mx; prism2.value.y = my;
                }
                else if (dragTarget.value === 'p1_rot') { prism1.value.rotation = Math.atan2(my - prism1.value.y, mx - prism1.value.x) + Math.PI/2; }
                else if (dragTarget.value === 'p2_rot') { prism2.value.rotation = Math.atan2(my - prism2.value.y, mx - prism2.value.x) + Math.PI/2; }
            });
            window.addEventListener('pointerup', () => dragTarget.value = null);
            const resize = () => {
                width = containerRef.value.clientWidth; height = containerRef.value.clientHeight;
                canvasRef.value.width = width; canvasRef.value.height = height; draw();
            };
            window.addEventListener('resize', resize); resize();
        });

        watch([sourceX, sourceY, sourceAngle, prism1, prism2, mode, selectedPrism, activeColorIndices], draw, { deep: true });
        
        return { 
            containerRef, canvasRef, sourceX, sourceY, angleHandleX, angleHandleY, 
            prism1, prism2, mode, handleStart, rotateHandleStyle, prism1Deg, prism2Deg, autoFit,
            prismOptions, selectedPrism, spectrum, activeColorIndices,
            toggleAllColors: () => { activeColorIndices.value = activeColorIndices.value.length ? [] : [0,1,2,3,4,5,6]; }
        };
    }
}).mount('#app');