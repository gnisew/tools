const { createApp, ref, onMounted, onUnmounted, nextTick } = Vue;

// 整合 RectilinearGame 邏輯物件
const RectilinearGame = {
    setup(width, height) {
        return {
            level: 1,
            score: 0,
            state: 'playing',
            source: { x: 50, y: height / 2, angle: 0 },
            target: { x: width - 80, y: height / 2, emoji: '🐱', size: 50 },
            walls: [],
            raySegments: [],
            isHit: false
        };
    },
    generateLevel(game, width, height) {
        game.state = 'playing';
        game.isHit = false;
        game.target.y = 100 + Math.random() * (height - 200);
        game.target.emoji = ['🐱', '🐰', '🦊', '🐸', '🐼', '🦄', '🦖', '🐥', '🐯', '🦁'][Math.floor(Math.random() * 10)];
        game.source.y = 100 + Math.random() * (height - 200);
        game.source.angle = 0;
        const wallXPositions = [width * 0.25, width * 0.5, width * 0.75];
        game.walls = wallXPositions.map((x, i) => {
            const currentHoleSize = Math.max(30, 80 - (game.level * 10));
            return {
                x: x,
                holeY: 150 + Math.random() * (height - 300),
                holeSize: currentHoleSize,
                id: i
            };
        });
    },
    updateRay(game, width) {
        let currX = game.source.x, currY = game.source.y;
        let angle = game.source.angle;
        let stopX = width;
        let stopY = currY + (width - currX) * Math.tan(angle);

        for (let wall of game.walls) {
            let intersectY = currY + (wall.x - currX) * Math.tan(angle);
            const holeTop = wall.holeY - wall.holeSize / 2;
            const holeBottom = wall.holeY + wall.holeSize / 2;
            if (intersectY < holeTop || intersectY > holeBottom) {
                stopX = wall.x;
                stopY = intersectY;
                break;
            }
        }
        let hitTarget = false;
        if (stopX === width) {
            const targetYAtTargetX = currY + (game.target.x - currX) * Math.tan(angle);
            if (Math.abs(targetYAtTargetX - game.target.y) < game.target.size / 1.5) {
                hitTarget = true;
                stopX = game.target.x;
                stopY = targetYAtTargetX;
            }
        }
        game.raySegments = [{ x1: currX, y1: currY, x2: stopX, y2: stopY }];
        game.isHit = hitTarget;
    },
    draw(ctx, game, width, height) {
        ctx.clearRect(0, 0, width, height);
        game.walls.forEach(wall => {
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 10; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(wall.x, 0); ctx.lineTo(wall.x, wall.holeY - wall.holeSize / 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(wall.x, wall.holeY + wall.holeSize / 2); ctx.lineTo(wall.x, height); ctx.stroke();
            ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.arc(wall.x, wall.holeY, 15, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
        });
        ctx.save();
        ctx.font = `${game.target.size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (game.isHit) { ctx.shadowBlur = 30; ctx.shadowColor = '#fbbf24'; }
        ctx.fillText(game.target.emoji, game.target.x, game.target.y); ctx.restore();
        const seg = game.raySegments[0];
        if (seg) {
            ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = game.isHit ? '#fbbf24' : '#fef08a';
            ctx.shadowBlur = game.isHit ? 20 : 5; ctx.shadowColor = '#facc15';
            ctx.beginPath(); ctx.moveTo(seg.x1, seg.y1); ctx.lineTo(seg.x2, seg.y2); ctx.stroke();
            ctx.beginPath(); ctx.arc(seg.x2, seg.y2, 5, 0, Math.PI * 2); ctx.fillStyle = 'white'; ctx.fill(); ctx.restore();
        }
        ctx.save();
        ctx.translate(game.source.x, game.source.y); ctx.rotate(game.source.angle);
        ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#475569'; ctx.fillRect(-25, -10, 25, 20); ctx.restore();
    }
};

createApp({
    setup() {
        const containerRef = ref(null);
        const canvasRef = ref(null);
        let ctx = null, width = 0, height = 0;
        const rectGame = ref(null);
        const isDragging = ref(false);
        const dragTarget = ref(null);
        let winAnimFrameId = null;

        const resizeCanvas = () => {
            if (!containerRef.value) return;
            width = containerRef.value.clientWidth;
            height = containerRef.value.clientHeight;
            canvasRef.value.width = width;
            canvasRef.value.height = height;
            ctx = canvasRef.value.getContext('2d');
            if (!rectGame.value) {
                rectGame.value = RectilinearGame.setup(width, height);
                RectilinearGame.generateLevel(rectGame.value, width, height);
            }
            RectilinearGame.updateRay(rectGame.value, width);
            RectilinearGame.draw(ctx, rectGame.value, width, height);
        };

        const handleStart = (e) => {
            const r = canvasRef.value.getBoundingClientRect();
            const p = { x: e.clientX - r.left, y: e.clientY - r.top };
            const g = rectGame.value;
            if (Math.hypot(p.x - g.source.x, p.y - g.source.y) < 40) {
                isDragging.value = true; dragTarget.value = { type: 'rect_source' };
            } else {
                for (let wall of g.walls) {
                    if (Math.hypot(p.x - wall.x, p.y - wall.holeY) < 35) {
                        isDragging.value = true; dragTarget.value = { type: 'rect_wall', id: wall.id };
                        break;
                    }
                }
            }
        };

        const handleMove = (e) => {
            if (!isDragging.value) return;
            const r = canvasRef.value.getBoundingClientRect();
            const p = { x: e.clientX - r.left, y: e.clientY - r.top };
            const g = rectGame.value;
            if (g.state === 'win') return;

            if (dragTarget.value.type === 'rect_source') {
                g.source.angle = Math.atan2(p.y - g.source.y, p.x - g.source.x);
            } else if (dragTarget.value.type === 'rect_wall') {
                const wall = g.walls.find(w => w.id === dragTarget.value.id);
                if (wall) wall.holeY = Math.max(50, Math.min(height - 50, p.y));
            }
            RectilinearGame.updateRay(g, width);
            if (g.isHit && g.state === 'playing') {
                g.state = 'win'; g.score += 20;
                setTimeout(() => {
                    g.level++;
                    RectilinearGame.generateLevel(g, width, height);
                    RectilinearGame.updateRay(g, width);
                    RectilinearGame.draw(ctx, g, width, height);
                }, 800);
            }
            RectilinearGame.draw(ctx, g, width, height);
        };

        const handleEnd = () => { isDragging.value = false; dragTarget.value = null; };

        onMounted(() => {
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
        });

        return { containerRef, canvasRef, rectGame, handleStart, handleMove, handleEnd };
    }
}).mount('#app');