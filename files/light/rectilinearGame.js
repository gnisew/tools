// rectilinearGame.js
const RectilinearGame = {
    // 初始化遊戲數據
    setup(width, height) {
        return {
            level: 1,
            score: 0,
            state: 'playing', // 'playing' 或 'win'
            source: { x: 50, y: height / 2, angle: 0 },
            target: { x: width - 80, y: height / 2, emoji: '🐱', size: 50 },
            walls: [],
            raySegments: [],
            isHit: false
        };
    },

    // 生成新關卡：Emoji 位置隨機移動，孔洞變窄
    generateLevel(game, width, height) {
        game.state = 'playing';
        game.isHit = false;
        
        // 1. Emoji 目標隨機位置 (右側區域)
        game.target.y = 100 + Math.random() * (height - 200);
        game.target.emoji = ['🐱', '🐰', '🦊', '🐸', '🐼', '🦄', '🦖', '🐥', '🐯', '🦁'][Math.floor(Math.random() * 10)];

        // 2. 光源隨機高度
        game.source.y = 100 + Math.random() * (height - 200);
        game.source.angle = 0; // 重設角度

        // 3. 生成三道牆與隨機孔洞
        const wallXPositions = [width * 0.25, width * 0.5, width * 0.75];
        game.walls = wallXPositions.map((x, i) => {
            // 隨等級提升，孔洞逐漸縮小 (最窄 30px)
            const baseSize = 80;
            const minSize = 30;
            const currentHoleSize = Math.max(minSize, baseSize - (game.level * 10));
            
            return {
                x: x,
                holeY: 150 + Math.random() * (height - 300),
                holeSize: currentHoleSize,
                id: i
            };
        });
    },

    // 計算光線路徑與碰撞
    updateRay(game, width) {
        let currX = game.source.x;
        let currY = game.source.y;
        let angle = game.source.angle;
        
        let stopX = width;
        let stopY = currY + (width - currX) * Math.tan(angle);

        // 檢查牆壁碰撞
        for (let wall of game.walls) {
            // 計算光線穿過牆壁 X 座標時的 Y 座標
            let intersectY = currY + (wall.x - currX) * Math.tan(angle);
            
            const holeTop = wall.holeY - wall.holeSize / 2;
            const holeBottom = wall.holeY + wall.holeSize / 2;

            // 如果光點不在孔洞範圍內，光線在此截止
            if (intersectY < holeTop || intersectY > holeBottom) {
                stopX = wall.x;
                stopY = intersectY;
                break;
            }
        }

        // 檢查是否擊中目標 (Emoji)
        let hitTarget = false;
        if (stopX === width) {
            const targetYAtTargetX = currY + (game.target.x - currX) * Math.tan(angle);
            const dist = Math.abs(targetYAtTargetX - game.target.y);
            // 判定範圍寬鬆度
            if (dist < game.target.size / 1.5) {
                hitTarget = true;
                stopX = game.target.x;
                stopY = targetYAtTargetX;
            }
        }

        game.raySegments = [{ x1: currX, y1: currY, x2: stopX, y2: stopY }];
        game.isHit = hitTarget;
    },

    // 繪圖功能
    draw(ctx, game, width, height) {
        // 畫牆壁
        game.walls.forEach(wall => {
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            // 上牆
            ctx.beginPath(); ctx.moveTo(wall.x, 0); ctx.lineTo(wall.x, wall.holeY - wall.holeSize / 2); ctx.stroke();
            // 下牆
            ctx.beginPath(); ctx.moveTo(wall.x, wall.holeY + wall.holeSize / 2); ctx.lineTo(wall.x, height); ctx.stroke();
            // 孔洞提示點 (拖動點)
            ctx.fillStyle = '#64748b';
            ctx.beginPath(); ctx.arc(wall.x, wall.holeY, 15, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
        });

        // 畫目標 Emoji
        ctx.save();
        ctx.font = `${game.target.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (game.isHit) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#fbbf24'; // 擊中發光
        }
        ctx.fillText(game.target.emoji, game.target.x, game.target.y);
        ctx.restore();

        // 畫光線
        const seg = game.raySegments[0];
        if (seg) {
            ctx.save();
            ctx.lineWidth = 4;
            ctx.strokeStyle = game.isHit ? '#fbbf24' : '#fef08a';
            ctx.shadowBlur = game.isHit ? 20 : 5;
            ctx.shadowColor = '#facc15';
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.stroke();
            
            // 終點光點
            ctx.beginPath();
            ctx.arc(seg.x2, seg.y2, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.restore();
        }

        // 畫手電筒光源
        ctx.save();
        ctx.translate(game.source.x, game.source.y);
        ctx.rotate(game.source.angle);
        ctx.fillStyle = '#facc15';
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#475569';
        ctx.fillRect(-25, -10, 25, 20); // 燈身
        ctx.restore();
    }
};