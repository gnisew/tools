// SVG 定義保持原樣（橢圓雞蛋、冰塊、巧克力、奶油）
const SVGs = {
    ice_cold: `<svg viewBox="0 0 100 100">
		<defs>
			<linearGradient id="iceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#E0F7FF" />
				<stop offset="100%" stop-color="#A0E7FF" />
			</linearGradient>
		</defs>
		<rect x="25" y="25" width="50" height="50" rx="8" fill="url(#iceGrad)" stroke="#0984E3" stroke-width="2"/>
		<path d="M32 35 Q 40 30 50 35" stroke="white" stroke-width="4" stroke-linecap="round" opacity="0.8" fill="none"/>
	</svg>`,
    ice_hot: `<svg viewBox="0 0 100 100">
    <defs>
        <radialGradient id="waterGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#A0E7FF" />
            <stop offset="100%" stop-color="#74CFFF" />
        </radialGradient>
    </defs>
    <path d="M10 80 Q 25 70, 50 75 T 90 80 Q 95 90, 50 95 T 10 80 Z" fill="url(#waterGrad)" opacity="0.8" />
    <path d="M25 82 Q 40 78, 60 82" stroke="white" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.6"/>
    <path d="M65 85 Q 70 83, 75 85" stroke="white" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.4"/>
</svg>`,
    choc_cold: `<svg viewBox="0 0 100 100"><rect x="20" y="30" width="60" height="40" fill="#795548" stroke="#4E342E" stroke-width="3" rx="4"/><line x1="40" y1="30" x2="40" y2="70" stroke="#4E342E" stroke-width="2"/><line x1="60" y1="30" x2="60" y2="70" stroke="#4E342E" stroke-width="2"/><line x1="20" y1="50" x2="80" y2="50" stroke="#4E342E" stroke-width="2"/></svg>`,
choc_hot: `<svg viewBox="0 0 100 100">
    <defs>
        <linearGradient id="chocMeltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#795548" />
            <stop offset="100%" stop-color="#4E342E" />
        </linearGradient>
    </defs>
    <path d="M15 75 Q 30 60, 50 65 T 85 75 Q 95 90, 50 95 T 10 85 Z" fill="url(#chocMeltGrad)" />
    
    <path d="M25 78 Q 45 70, 70 78" fill="none" stroke="#8D6E63" stroke-width="4" stroke-linecap="round" opacity="0.4"/>
    
    <path d="M20 82 Q 35 78, 55 82" stroke="white" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.3"/>
</svg>`,
    butter_hot: `<svg viewBox="0 0 100 100"><path d="M10 70 Q 30 60, 50 70 T 90 70 Q 100 80, 95 90 T 50 100 Q 5 100, 5 90 T 10 70 Z" fill="#FFEAA7" stroke="#FDCB6E" stroke-width="2"/></svg>`,
    butter_cold: `<svg viewBox="0 0 100 100"><rect x="25" y="35" width="50" height="30" fill="#FFEAA7" stroke="#FDCB6E" stroke-width="3" rx="3"/><path d="M25 35 L40 25 L90 25 L75 35 Z" fill="#FFF3CD" stroke="#FDCB6E" stroke-width="3"/><path d="M75 35 L90 25 L90 55 L75 65 Z" fill="#FFD54F" stroke="#FDCB6E" stroke-width="3"/></svg>`,
	egg_cold: `<svg viewBox="0 0 100 100">
                <defs>
                    <radialGradient id="eggShine" cx="40%" cy="40%" r="50%" fx="30%" fy="30%">
                        <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#ffeaa7;stop-opacity:1" />
                    </radialGradient>
                </defs>
                <ellipse cx="50" cy="50" rx="32" ry="45" fill="url(#eggShine)" stroke="#e3cca1" stroke-width="2"/>
               </svg>`,
    egg_hot: `<svg viewBox="0 0 100 100"><path d="M20 60 Q 35 45, 60 50 T 90 60 Q 100 80, 80 90 T 40 95 Q 10 90, 20 60 Z" fill="white" stroke="#B2BEC3" stroke-width="2"/><circle cx="55" cy="70" r="15" fill="#FFEB3B" stroke="#FDCB6E" stroke-width="3"/></svg>`
};

const materialData = {
    ice: { name: "冰塊", cold: SVGs.ice_cold, hot: SVGs.ice_hot },
    chocolate: { name: "巧克力", cold: SVGs.choc_cold, hot: SVGs.choc_hot },
    butter: { name: "奶油", cold: SVGs.butter_cold, hot: SVGs.butter_hot },
    egg: { name: "雞蛋", cold: SVGs.egg_cold, hot: SVGs.egg_hot }
};

let currentMaterial = null, currentTemp = "cold", eggIsCooked = false;
let isGameMode = false, gameScore = 0, timeLeft = 20, gameInterval, emojiTimeout;
let nextEmojiType = "cold"; // 遊戲邏輯：記錄下一次要出現的類型

let sessionColdEmoji = "";
let sessionHotEmoji = "";
let lastX = null, lastY = null;

// 頁籤切換
function switchTab(mode) {
    if (isGameMode) stopGame();
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hide'));
    document.getElementById(`tab-${mode}`).classList.add('active');
    document.getElementById(`panel-${mode}`).classList.remove('hide');
}

function selectItem(id) {
    if (isGameMode) stopGame();
    currentMaterial = id;
    currentTemp = "cold";
    eggIsCooked = false;
    document.getElementById('temp-slider').value = 0;
    document.getElementById('temp-slider').disabled = false;
    
    document.querySelectorAll('.item-btn').forEach(b => b.classList.remove('active'));
    
    const targetBtn = (window.event && window.event.currentTarget) ? 
                     window.event.currentTarget : 
                     document.querySelector(`button[onclick*="'${id}'"]`);
    
    if (targetBtn) targetBtn.classList.add('active');
    updateDisplay();
}

function handleSliderChange(val) {
    changeTemp(val === "1" ? "hot" : "cold");
}

function changeTemp(type) {
    currentTemp = type;
    if (currentMaterial === 'egg' && type === 'hot') eggIsCooked = true;
    updateDisplay();
}

function updateDisplay() {
    const data = materialData[currentMaterial];
    const drawingBox = document.getElementById('drawing-container');
    const stageBg = document.getElementById('stage-bg');
    const msg = document.getElementById('observation-msg');
    
    stageBg.style.backgroundColor = currentTemp === 'hot' ? 'var(--hot-bg)' : 'var(--cold-bg)';
    document.getElementById('temp-label').innerText = currentTemp === 'hot' ? "🔥 環境溫度：高溫" : "❄️ 環境溫度：低溫";

    if (currentMaterial === 'egg') {
        drawingBox.innerHTML = eggIsCooked ? data.hot : data.cold;
        msg.innerHTML = eggIsCooked ? "雞蛋受熱煮熟，冷卻也無法恢復原狀。" : "這是一顆生雞蛋。";
    } else {
        drawingBox.innerHTML = currentTemp === 'hot' ? data.hot : data.cold;
        msg.innerHTML = currentTemp === 'hot' ? `${data.name}遇熱融化成液體。` : `${data.name}冷卻後回復成固態。`;
    }
}

function toggleGameMode() {
    if (!currentMaterial) return alert("請先選擇實驗對象！");
    isGameMode ? stopGame() : startGame();
}

function startGame() {
    if (!currentMaterial) return alert("請先選擇實驗對象！");

    const coldList = ["❄️", "☃️", "🧊"];
    const hotList = ["☄️", "🔥", "♨️"];
    sessionColdEmoji = coldList[Math.floor(Math.random() * coldList.length)];
    sessionHotEmoji = hotList[Math.floor(Math.random() * hotList.length)];

    isGameMode = true; 
    gameScore = 0; 
    timeLeft = 20; 
    
    // 重置坐標紀錄
    lastX = null;
    lastY = null;

    // 根據目前溫度決定第一個出現的類型
    nextEmojiType = (currentTemp === "cold") ? "hot" : "cold";
    
    document.getElementById('score-num').innerText = "0";
    document.getElementById('game-ui').classList.remove('hide');
    document.getElementById('timer-wrap').style.visibility = "visible";
    document.getElementById('game-start-btn').innerText = "⏹️ 停止遊戲";
    document.getElementById('temp-slider').disabled = true;
    
    gameInterval = setInterval(() => {
        timeLeft -= 0.1;
        document.getElementById('timer-line').style.width = (timeLeft / 20 * 100) + "%";
        if (timeLeft <= 0) stopGame();
    }, 100);

    spawnEmoji();
}

function stopGame() {
    isGameMode = false;
    clearInterval(gameInterval);
    clearTimeout(emojiTimeout);

    // 隱藏計時線，但保留得分看板
    document.getElementById('timer-wrap').style.visibility = "hidden";
    document.getElementById('game-start-btn').innerText = "🎮 開始遊戲 (20秒挑戰)";
    document.getElementById('temp-slider').disabled = false;
    
    // 清空 Emoji 容器
    document.getElementById('game-emoji-container').innerHTML = "";
}

function spawnEmoji() {
    if (!isGameMode) return;

    const container = document.getElementById('game-emoji-container');
    container.innerHTML = "";
    
    const type = nextEmojiType;
    const emoji = (type === "hot") ? sessionHotEmoji : sessionColdEmoji;
    const el = document.createElement('div');
    el.className = 'floating-temp-emoji';
    el.innerText = emoji;
    
    // --- 隨機位置與距離判斷邏輯 ---
    let newX, newY, distance;
    const minDistance = 50; // 最小距離閾值 (百分比單位)

    do {
        newX = Math.random() * 70 + 15; // 15% ~ 85%
        newY = Math.random() * 60 + 20; // 20% ~ 80%
        
        if (lastX === null || lastY === null) {
            distance = minDistance + 1; // 第一次產生時直接通過
        } else {
            // 使用畢氏定理計算距離: d = sqrt((x2-x1)^2 + (y2-y1)^2)
            distance = Math.sqrt(Math.pow(newX - lastX, 2) + Math.pow(newY - lastY, 2));
        }
    } while (distance < minDistance); // 如果距離太近，就重新跑一次迴圈

    lastX = newX;
    lastY = newY;
    el.style.left = newX + "%";
    el.style.top = newY + "%";
    // ---------------------------

    const stayDuration = 800;
    const nextGap = Math.random() * 1000 + 500;

    el.onclick = () => {
        gameScore++;
        document.getElementById('score-num').innerText = gameScore;
        changeTemp(type);
        document.getElementById('temp-slider').value = (type === "hot" ? 1 : 0);
        nextEmojiType = (type === "cold") ? "hot" : "cold";
        el.remove();
        clearTimeout(emojiTimeout);
        emojiTimeout = setTimeout(spawnEmoji, nextGap);
    };
    
    container.appendChild(el);

    emojiTimeout = setTimeout(() => {
        if (el.parentNode) {
            el.remove();
            emojiTimeout = setTimeout(spawnEmoji, nextGap);
        }
    }, stayDuration);
}

function resetExperiment() { location.reload(); }
selectItem('ice');