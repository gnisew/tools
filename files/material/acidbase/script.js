const solutions = {
    lemon: { name: "檸檬汁", init: "#FEFDFA", target: "#D32F2F", type: "酸性", result: "變為紅色系" },
    vinegar: { name: "食醋", init: "rgba(255,255,255,0.3)", target: "#F06292", type: "酸性", result: "變為粉紅色系" },
    hcl: { name: "鹽酸", init: "#FFFFFF", target: "#B71C1C", type: "強酸性", result: "呈現鮮豔的深紅色" },
    sparkling: { name: "氣泡水", init: "#FFFFFF", target: "#F8B3CB", type: "弱酸性", result: "呈現淡淡的粉紫色" },
    water: { name: "純水", init: "#F5F8FF", target: "#BB8AD0", type: "中性", result: "維持原本的紫色" },
    soda: { name: "小蘇打", init: "#FDFEFE", target: "#2980B9", type: "鹼性", result: "變為藍紫色系" },
    soap: { name: "肥皂水", init: "#F2F4F4", target: "#27AE60", type: "鹼性", result: "變為綠色系" },
    bleach: { name: "漂白水", init: "#FFFEFE", target: "#F1C40F", type: "強鹼性", result: "變綠後快速轉黃，最後可能褪色" },
    sodium_per: { name: "過碳酸鈉", init: "#FFFFFF", target: "#1B5E20", type: "鹼性", result: "呈現深綠色系" }
};

// 新增 Emoji 列表
const floatingEmojis = ["🏄", "🦆", "🐣", "🧜‍♂️", "🧜‍♀️", "🚣","💧","⛵","🕳️","🦭","🐟","🐠","🐡","🐳","🐢","🛸","👻","🛀","🐸","❄️","☃️","🔥","🔍","🛁","🧪","⚗️","🧬","🔬"];

let currentState = { id: null, drops: 0, isBusy: false, isFilled: false };
const MAX_DROPS = 5;

let driftInterval = null;

async function selectLiquid(id) {
    if (currentState.isBusy) return;
    
    // 停止之前的隨機移動計時器
    if (driftInterval) {
        clearInterval(driftInterval);
        driftInterval = null;
    }

    currentState.isBusy = true;

    const juice = document.getElementById('dropper-liquid');
    const dropper = document.getElementById('dropper');
    const addBtn = document.getElementById('add-juice-btn');
    const emojiBox = document.getElementById('beaker-emoji');
    
    // 重置滴管與按鈕狀態
    juice.style.height = "0%";
    dropper.classList.remove('active-mode', 'stop-animation');
    dropper.classList.add('disabled');
    currentState.isFilled = false;
    addBtn.classList.remove('disabled', 'used');

    // 切換按鈕亮顯
    document.querySelectorAll('.liquid-btn').forEach(b => b.classList.remove('active'));
    if (event && event.target.classList.contains('liquid-btn')) {
        event.target.classList.add('active');
    }

    // 切換小百科內容
    const placeholder = document.getElementById('intro-placeholder');
    if (placeholder) placeholder.classList.add('hide');
    document.querySelectorAll('.intro-item').forEach(item => item.classList.add('hide'));

    const targetIntro = document.getElementById(`intro-${id}`);
    if (targetIntro) targetIntro.classList.remove('hide');

    const base = document.getElementById('base-liquid');
    const overlay = document.getElementById('color-overlay');
    const label = document.getElementById('inner-label');

    // 重置燒杯與 Emoji
    base.style.height = "0%";
    overlay.style.height = "0%";
    overlay.style.opacity = "0";
    label.style.opacity = "0";
    
    // 重置 Emoji 位置：回到中央並移除停止動畫的 Class
    emojiBox.classList.remove('stop-animation');
    emojiBox.style.bottom = "0%"; 
    const randomStart = Math.floor(Math.random() * 60) + 20; // 產生 20% 到 80% 之間的隨機數
	emojiBox.style.left = `${randomStart}%`;
    
    // 隨機選一個新的 Emoji
    const randomEmoji = floatingEmojis[Math.floor(Math.random() * floatingEmojis.length)];
    emojiBox.innerHTML = `<span class="emoji-inner">${randomEmoji}</span>`;

    await new Promise(resolve => setTimeout(resolve, 800));

    const s = solutions[id];
    currentState.id = id;
    currentState.drops = 0;

    // 設定液體初始顏色與 Emoji 高度
    base.style.backgroundColor = s.init;
    base.style.height = "60%";
    overlay.style.backgroundColor = s.target;
    overlay.style.height = "60%";
    
    emojiBox.style.bottom = "60%"; // 隨水位上升

    label.innerText = s.name;
    document.getElementById('status-msg').innerHTML = `正在倒入 <b>${s.name}</b>...`;

    await new Promise(resolve => setTimeout(resolve, 800));
    document.getElementById('status-msg').innerHTML = `溶液已就緒，請點擊按鈕「裝填指示劑」。`;
    currentState.isBusy = false;
}


async function fillDropper() {
    if (currentState.isBusy || !currentState.id || currentState.isFilled) return;
    currentState.isBusy = true;

    const addBtn = document.getElementById('add-juice-btn');
    const juice = document.getElementById('dropper-liquid');
    const dropper = document.getElementById('dropper');

    addBtn.classList.add('used');
    document.getElementById('status-msg').innerHTML = `正在裝填紫色高麗菜汁...`;
    juice.style.height = "100%";
    
    await new Promise(resolve => setTimeout(resolve, 800));

    // --- 關鍵修正：裝填完成後，開啟 Emoji 隨機大範圍漂浮 ---
    startEmojiDrift();

    document.getElementById('status-msg').innerHTML = `裝填完成，請點擊「滴管膠頭」進行實驗。`;
    document.getElementById('drop-counter').classList.remove('hide');
    updateDropsDisplay();
    
    currentState.isFilled = true;
    dropper.classList.remove('disabled');
    dropper.classList.add('active-mode');
    currentState.isBusy = false;
}

// 輔助函式：處理隨機移動邏輯
function startEmojiDrift() {
    const emojiBox = document.getElementById('beaker-emoji');
    if (!emojiBox) return;

    const move = () => {
        // 隨機產生 10% 到 90% 之間的位置
        const randomLeft = Math.floor(Math.random() * 80) + 10; 
        emojiBox.style.left = `${randomLeft}%`;
    };

    move(); // 立即移動一次

    // 將 3000 (3秒) 改為 1200 (1.2秒)，達到每 1~1.5 秒換點的效果
    driftInterval = setInterval(move, 1200); 
}

function triggerDrip() {
    if (!currentState.isFilled || currentState.drops >= MAX_DROPS || currentState.isBusy) return;

    const drop = document.getElementById('drop-particle');
    const emojiBox = document.getElementById('beaker-emoji');
    const emojiInner = emojiBox.querySelector('.emoji-inner'); // 抓取內層
    const beaker = document.querySelector('.beaker');

    // 1. 播放滴水動畫
    drop.classList.remove('drop-fall');
    void drop.offsetWidth;
    drop.classList.add('drop-fall');

    currentState.drops++;
    document.getElementById('dropper-liquid').style.height = `${100 - (currentState.drops * 20)}%`;

    // 2. 當水滴到達水面時
    setTimeout(() => {
        const overlay = document.getElementById('color-overlay');
        overlay.style.opacity = currentState.drops / MAX_DROPS;
        updateDropsDisplay();
        
        if (!emojiInner) return;

        // 計算距離
        const emojiLeft = emojiBox.offsetLeft;
        const beakerWidth = beaker.offsetWidth;
        const emojiCenter = emojiLeft + (emojiBox.offsetWidth / 2);
        const dropCenter = beakerWidth / 2; 

        const distance = Math.abs(emojiCenter - dropCenter);

        // 對「內層」施加彈跳動畫，外層的 drift 動畫就不會被打斷
        emojiInner.classList.remove('bounce-big', 'bounce-small');
        void emojiInner.offsetWidth; 

        if (distance < 30) {
            emojiInner.classList.add('bounce-big');
        } else {
            emojiInner.classList.add('bounce-small');
        }

        if (currentState.drops === MAX_DROPS) {
            finishLab();
        }
    }, 450);
}

function updateDropsDisplay() {
    document.getElementById('drop-counter').innerText = `已滴入：${currentState.drops} / ${MAX_DROPS} 滴`;
}


function finishLab() {
    // 1. 停止 JS 隨機移動計時器
    if (driftInterval) {
        clearInterval(driftInterval);
        driftInterval = null;
    }

    const s = solutions[currentState.id];
    document.getElementById('status-msg').innerHTML = 
        `<b>${s.name}</b> 實驗完成！<br>性質：<span style="color:red">${s.type}</span><br>結果：${s.result}`;
    
    document.getElementById('inner-label').style.opacity = "1";
    document.getElementById('dropper').classList.remove('active-mode');

    // 2. 停止 CSS 動畫 (包含正在進行的過渡與彈跳)
    const emojiBox = document.getElementById('beaker-emoji');
    const emojiInner = emojiBox.querySelector('.emoji-inner');

    if (emojiBox) {
        emojiBox.classList.add('stop-animation');
    }
    if (emojiInner) {
        emojiInner.classList.add('stop-animation');
    }
}

function resetLab() {
    location.reload();
}