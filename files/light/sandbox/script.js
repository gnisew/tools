const { createApp, ref, onMounted, watch } = Vue;

createApp({
    setup() {
        const containerRef = ref(null);
        const canvasRef = ref(null);
        let ctx = null, width = 0, height = 0;

        const sandbox = ref({
            source: { x: 100, y: 300, angle: 0, isOn: true },
            mirrors: [ { x: 400, y: 300, angle: 90, length: 200 } ]
        });

        const isDragging = ref(false);
        const dragTarget = ref(null);

        const rad = (deg) => deg * Math.PI / 180;
        const deg = (r) => r * 180 / Math.PI;

        const getMirrorCoords = (cx, cy, angleDeg, len = 200) => {
            const r = rad(angleDeg || 0);
            const dx = (len/2) * Math.cos(r), dy = (len/2) * Math.sin(r);
            return { x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy };
        };

        const calculateMultiBounce = () => {
            if (!sandbox.value.source.isOn) return [];
            const maxBounces = 50, segments = [];
            let currX = sandbox.value.source.x, currY = sandbox.value.source.y;
            let currAngle = rad(sandbox.value.source.angle);
            const epsilon = 0.01;

            for (let i = 0; i < maxBounces; i++) {
                let closestDist = Infinity, hitRecord = null;
                const dx = Math.cos(currAngle), dy = Math.sin(currAngle);

                sandbox.value.mirrors.forEach(mirror => {
                    const mc = getMirrorCoords(mirror.x, mirror.y, mirror.angle, mirror.length);
                    const x1 = currX, y1 = currY, x2 = currX + dx*10000, y2 = currY + dy*10000;
                    const x3 = mc.x1, y3 = mc.y1, x4 = mc.x2, y4 = mc.y2;
                    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
                    if (den === 0) return;
                    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
                    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
                    if (t > epsilon && u >= 0 && u <= 1) {
                        const px = x1 + t * (x2 - x1), py = y1 + t * (y2 - y1);
                        const dist = Math.sqrt((px-x1)**2 + (py-y1)**2);
                        if (dist < closestDist) {
                            closestDist = dist;
                            const mx = x4 - x3, my = y4 - y3;
                            let nx = -my, ny = mx;
                            if (dx*nx + dy*ny > 0) { nx = -nx; ny = -ny; }
                            const nLen = Math.sqrt(nx*nx + ny*ny);
                            nx /= nLen; ny /= nLen;
                            const dot = dx*nx + dy*ny;
                            const rx = dx - 2*dot*nx, ry = dy - 2*dot*ny;
                            hitRecord = { x: px, y: py, nextAngle: Math.atan2(ry, rx) };
                        }
                    }
                });

                if (!hitRecord) {
                    segments.push({ x1: currX, y1: currY, x2: currX + dx*2000, y2: currY + dy*2000 });
                    break;
                } else {
                    segments.push({ x1: currX, y1: currY, x2: hitRecord.x, y2: hitRecord.y });
                    currX = hitRecord.x; currY = hitRecord.y; currAngle = hitRecord.nextAngle;
                }
            }
            return segments;
        };

        const draw = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            // 畫鏡子
            sandbox.value.mirrors.forEach(m => {
                const mc = getMirrorCoords(m.x, m.y, m.angle, m.length);
                ctx.save(); ctx.lineWidth = 6; ctx.strokeStyle = '#94a3b8';
                ctx.beginPath(); ctx.moveTo(mc.x1, mc.y1); ctx.lineTo(mc.x2, mc.y2); ctx.stroke();
                ctx.lineWidth = 2; ctx.strokeStyle = 'white';
                ctx.beginPath(); ctx.moveTo(mc.x1, mc.y1); ctx.lineTo(mc.x2, mc.y2); ctx.stroke();
                const drawKnob = (kx, ky) => { ctx.beginPath(); ctx.arc(kx, ky, 6, 0, Math.PI*2); ctx.fillStyle = 'white'; ctx.fill(); };
                drawKnob(m.x, m.y); drawKnob(mc.x1, mc.y1); drawKnob(mc.x2, mc.y2);
                ctx.restore();
            });

            // 畫光源
            const src = sandbox.value.source;
            ctx.save(); ctx.translate(src.x, src.y); ctx.rotate(rad(src.angle));
            ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI*2);
            ctx.fillStyle = src.isOn ? '#facc15' : '#475569'; ctx.fill();
            ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(35, 0);
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();
            ctx.beginPath(); ctx.arc(35, 0, 5, 0, Math.PI*2); ctx.fillStyle='white'; ctx.fill();
            ctx.restore();

            // 畫光線
            if (src.isOn) {
                const segments = calculateMultiBounce();
                ctx.save(); ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]); ctx.beginPath();
                segments.forEach(seg => { ctx.moveTo(seg.x1, seg.y1); ctx.lineTo(seg.x2, seg.y2); });
                ctx.stroke(); ctx.restore();
            }
        };

        const handleStart = (e) => {
            const r = canvasRef.value.getBoundingClientRect();
            const px = e.clientX - r.left, py = e.clientY - r.top;
            const src = sandbox.value.source;
            
            if (Math.hypot(px - src.x, py - src.y) < 30) {
                isDragging.value = true; dragTarget.value = { type: 'source', part: 'center' };
            } else if (Math.hypot(px - (src.x + 35*Math.cos(rad(src.angle))), py - (src.y + 35*Math.sin(rad(src.angle)))) < 25) {
                isDragging.value = true; dragTarget.value = { type: 'source', part: 'handle' };
            } else {
                for (let i = 0; i < sandbox.value.mirrors.length; i++) {
                    const m = sandbox.value.mirrors[i];
                    const mc = getMirrorCoords(m.x, m.y, m.angle, m.length);
                    if (Math.hypot(px - m.x, py - m.y) < 30) {
                        isDragging.value = true; dragTarget.value = { type: 'mirror', id: i, part: 'center' }; break;
                    }
                    if (Math.hypot(px - mc.x1, py - mc.y1) < 30 || Math.hypot(px - mc.x2, py - mc.y2) < 30) {
                        isDragging.value = true; dragTarget.value = { type: 'mirror', id: i, part: 'end' }; break;
                    }
                }
            }
        };

        const handleMove = (e) => {
            if (!isDragging.value) return;
            const r = canvasRef.value.getBoundingClientRect();
            const px = e.clientX - r.left, py = e.clientY - r.top;
            const dt = dragTarget.value;

            if (dt.type === 'source') {
                if (dt.part === 'center') { sandbox.value.source.x = px; sandbox.value.source.y = py; }
                else { sandbox.value.source.angle = deg(Math.atan2(py - sandbox.value.source.y, px - sandbox.value.source.x)); }
            } else if (dt.type === 'mirror') {
                const m = sandbox.value.mirrors[dt.id];
                if (dt.part === 'center') { m.x = px; m.y = py; }
                else { m.angle = deg(Math.atan2(py - m.y, px - m.x)); }
            }
            draw();
        };

        const handleEnd = () => { isDragging.value = false; dragTarget.value = null; };
        const toggleSandboxLight = () => { sandbox.value.source.isOn = !sandbox.value.source.isOn; draw(); };
        const addMirror = () => { if (sandbox.value.mirrors.length < 6) { sandbox.value.mirrors.push({ x: width/2, y: height/2, angle: 90, length: 200 }); draw(); } };
        const removeMirror = () => { sandbox.value.mirrors.pop(); draw(); };

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

        return { containerRef, canvasRef, sandbox, handleStart, handleMove, handleEnd, toggleSandboxLight, addMirror, removeMirror };
    }
}).mount('#app');