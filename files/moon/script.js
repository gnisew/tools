// ====== 天文常數 ======
const SYNODIC_MONTH = 29.53058867;
// 基準點：2025-01-29 20:36 (精確朔月)
const KNOWN_NEW_MOON_2025 = new Date('2025-01-29T20:36:00+08:00');

// ====== DOM 元素 ======
const datePicker = document.getElementById('datePicker');
const largeMoonContainer = document.getElementById('largeMoon');
const calendarGrid = document.getElementById('calendarGrid');
const body = document.body;

// 資訊面板元素
const els = {
    mainDate: document.getElementById('displayDateMain'),
    subDate: document.getElementById('displayDateSub'),
    name: document.getElementById('phaseName'),
    age: document.getElementById('moonAge'),
    illum: document.getElementById('illumination'),
    desc: document.getElementById('phaseDesc')
};

// 狀態
let currentView = 'single';
let dateMode = 'both';

// ====== 初始化 ======
function init() {
    setToday();
    datePicker.addEventListener('change', updateView);
}

function setToday() {
    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    datePicker.value = localDate;
    updateView();
}

function changeDay(offset) {
    const d = new Date(datePicker.value);
    d.setDate(d.getDate() + offset);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    datePicker.value = `${year}-${month}-${day}`;
    updateView();
}

function switchView(viewName, btn) {
    currentView = viewName;
    updateButtons(btn, '.toggle-group:nth-child(1) .toggle-btn');
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    
    if (viewName === 'single') {
        document.getElementById('view-single').classList.add('active');
    } else {
        document.getElementById('view-calendar').classList.add('active');
    }
    updateView();
}

function setDateMode(mode, btn) {
    dateMode = mode;
    updateButtons(btn, '.toggle-group:nth-child(2) .toggle-btn');
    body.classList.remove('mode-gregorian', 'mode-lunar', 'mode-both');
    body.classList.add(`mode-${mode}`);
    updateView();
}

function updateButtons(activeBtn, selector) {
    document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
}

// ====== 核心更新邏輯 ======
function updateView() {
    const selectedDate = new Date(datePicker.value);
    selectedDate.setHours(12, 0, 0, 0);

    if (currentView === 'single') {
        renderSingleView(selectedDate);
    } else {
        const days = currentView === 'month' ? 30 : 60;
        renderCalendarView(selectedDate, days);
    }
}

function renderSingleView(date) {
    const data = getMoonData(date);
    const dateStrings = formatDateStrings(date);

    largeMoonContainer.innerHTML = generateMoonSVG(data.phase, 260);

    els.mainDate.textContent = dateStrings.gregorianWithWeek;
    els.subDate.textContent = dateStrings.lunarConcise; // 使用簡潔農曆
    els.name.textContent = data.name;
    els.name.style.color = 'var(--accent-color)'; // 重置顏色
    
    els.age.textContent = `${data.age.toFixed(1)} 天`;
    els.illum.textContent = `${data.illumination}%`;
    els.desc.textContent = data.desc;
}

function renderCalendarView(startDate, daysCount) {
    calendarGrid.innerHTML = '';
    const currentDate = new Date(startDate);
    currentDate.setHours(12,0,0,0);

    for (let i = 0; i < daysCount; i++) {
        const loopDate = new Date(currentDate);
        loopDate.setDate(currentDate.getDate() + i);
        
        const data = getMoonData(loopDate);
        const dateStrings = formatDateStrings(loopDate);
        const isToday = loopDate.toDateString() === new Date().toDateString();

        const cell = document.createElement('div');
        cell.className = `cal-day ${isToday ? 'is-today' : ''}`;
        
        // 使用簡潔的農曆字串
        cell.innerHTML = `
            <div class="cal-gregorian">${loopDate.getMonth()+1}/${loopDate.getDate()} <span class="cal-weekday">${dateStrings.weekdayShort}</span></div>
            <div class="cal-moon">${generateMoonSVG(data.phase, 45)}</div>
            <div class="cal-lunar">${dateStrings.lunarConcise}</div>
        `;
        
        cell.onclick = () => {
            const y = loopDate.getFullYear();
            const m = String(loopDate.getMonth()+1).padStart(2,'0');
            const d = String(loopDate.getDate()).padStart(2,'0');
            datePicker.value = `${y}-${m}-${d}`;
            switchView('single', document.querySelectorAll('.toggle-group:nth-child(1) .toggle-btn')[0]);
        };

        calendarGrid.appendChild(cell);
    }
}

// ====== Helper: 日期處理 (修正農曆顯示) ======
function formatDateStrings(date) {
    const weekday = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' }).format(date);
    const gregorianWithWeek = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} (${weekday})`;

    // 使用 Intl 取得農曆各部分
    const lunarFormatter = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', {
        month: 'numeric',
        day: 'numeric'
    });
    
    // 輸出範例可能為 "11月27日" 或 "十一月27日"
    const parts = lunarFormatter.formatToParts(date);
    let lunarMonth = "";
    let lunarDay = "";

    parts.forEach(p => {
        if (p.type === 'month') lunarMonth = p.value;
        if (p.type === 'day') lunarDay = p.value;
    });

    // 轉換月份為中文數字 (1 -> 正, 2 -> 二 ...)
    const chineseMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    // 簡單判斷：如果 Intl 回傳的是數字字串，就轉換；如果是中文就保留
    if (!isNaN(parseInt(lunarMonth))) {
        lunarMonth = chineseMonths[parseInt(lunarMonth) - 1];
    }
    
    // 移除 "月" 字以免重複，然後手動加上
    lunarMonth = lunarMonth.replace('月', '');

    // 組合簡潔字串： "十月28"
    const lunarConcise = `${lunarMonth}月${lunarDay}`;

    return {
        gregorianWithWeek,
        lunarConcise,
        weekdayShort: weekday
    };
}

// ====== Helper: 月相資料 ======
function getMoonData(date) {
    const diffTime = date.getTime() - KNOWN_NEW_MOON_2025.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    
    let age = diffDays % SYNODIC_MONTH;
    if (age < 0) age += SYNODIC_MONTH;

    const phase = age / SYNODIC_MONTH;
    const illumination = ((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100).toFixed(0);

    let name = "";
    let desc = "";
    
    if (age < 1.0 || age > 28.5) {
        name = "新月"; desc = "農曆初一，月球在地球與太陽之間。";
    } else if (age < 6.5) {
        name = "眉月"; desc = "傍晚可見，亮面在右側。";
    } else if (age < 8.5) {
        name = "上弦月"; desc = "中午升起，午夜落下，右半亮。";
    } else if (age < 13.5) {
        name = "盈凸月"; desc = "整夜可見，接近滿月。";
    } else if (age < 15.5) {
        name = "滿月"; desc = "日落時升起，整夜明亮。";
    } else if (age < 21.5) {
        name = "虧凸月"; desc = "滿月過後，左側開始變暗。";
    } else if (age < 23.5) {
        name = "下弦月"; desc = "午夜升起，中午落下，左半亮。";
    } else {
        name = "殘月"; desc = "黎明前可見，亮面在左側 C 型。";
    }

    return { age, phase, illumination, name, desc };
}

// ====== Helper: SVG 繪圖 (修復版) ======
function generateMoonSVG(phase, size) {
    // 參數設定
    const cx = 50;
    const cy = 50;
    const r = 45;
    
    // 決定月相類型
    const isWaxing = phase <= 0.5;
    // 陰影/亮面邏輯：
    // 我們一律畫「亮面 (Illuminated Part)」
    // 0 = 全黑, 0.5 = 全亮, 1 = 全黑
    
    let d = "";
    
    // 使用 cos 計算亮面邊界弧度的投影長度 (-1 到 1)
    // 0(New) -> -1, 0.25 -> 0, 0.5(Full) -> 1, 0.75 -> 0, 1 -> -1
    // 這裡我們只關注 0~0.5 (Waxing) 和 0.5~1 (Waning) 的對稱性
    
    // 歸一化相角 (0 ~ PI)
    const theta = phase * 2 * Math.PI;
    const rx = r * Math.cos(theta); // 內弧的 X 半徑，會正負變動
    
    if (isWaxing) {
        // === 漸盈 (亮面在右) ===
        // 路徑：從北極(50,5) -> 畫右半圓到南極(50,95) -> 畫內弧回到北極
        
        // 內弧邏輯：
        // 0~0.25 (眉月): rx > 0, 亮面像眉毛。Sweep應設為 0 (內凹)。
        // 0.25~0.5 (凸月): rx < 0, 亮面像凸透鏡。Sweep應設為 1 (外凸)。
        // 其實 SVG Arc 如果 rx 變號，路徑會翻轉，我們用絕對值控制 sweep。
        
        // 簡化邏輯：
        // 右半圓固定：M 50 5 A 45 45 0 0 1 50 95
        // 內弧：A abs(rx) 45 0 0 [sweep] 50 5
        
        // 當 phase < 0.25 (cos > 0), 我們要內凹 -> sweep 0
        // 當 phase > 0.25 (cos < 0), 我們要外凸 -> sweep 1
        // 注意：數學上 cos 在 0.25 (PI/2) 會過零點。
        
        const sweep = (phase < 0.25) ? 0 : 1;
        d = `M 50 5 A 45 45 0 0 1 50 95 A ${Math.abs(rx)} 45 0 0 ${sweep} 50 5`;
        
    } else {
        // === 漸虧 (亮面在左) ===
        // 路徑：從南極(50,95) -> 畫左半圓到北極(50,5) -> 畫內弧回到南極
        
        // 左半圓固定：M 50 95 A 45 45 0 0 1 50 5
        // 內弧：A abs(rx) 45 0 0 [sweep] 50 95
        
        // 當 phase < 0.75 (虧凸, cos < 0): 外凸 -> sweep 1
        // 當 phase > 0.75 (殘月, cos > 0): 內凹 -> sweep 0
        
        const sweep = (phase < 0.75) ? 1 : 0;
        d = `M 50 95 A 45 45 0 0 1 50 5 A ${Math.abs(rx)} 45 0 0 ${sweep} 50 95`;
    }

    // 處理特例：朔月 (全黑) 與 滿月 (全亮) 以避免浮點數繪圖瑕疵
    let fill = "#f4f6f0";
    if (phase < 0.02 || phase > 0.98) {
        fill = "transparent"; // 新月全黑
        d = `M 50 5 A 45 45 0 1 1 50 95 A 45 45 0 1 1 50 5`; // dummy path
    } else if (Math.abs(phase - 0.5) < 0.02) {
        // 滿月畫全圓
        d = `M 50 5 A 45 45 0 1 1 50 95 A 45 45 0 1 1 50 5`;
    }

    return `
        <svg viewBox="0 0 100 100" width="${size}" height="${size}">
            <circle cx="50" cy="50" r="45" fill="#1a1d2e" />
            <path d="${d}" fill="${fill}" />
        </svg>
    `;
}

// 啟動
body.classList.add('mode-both');
init();