// ====== 天文常數與共用工具 ======
// 觀測設定
const OBSERVER_LAT = 23.5; // 預設觀測緯度：台灣 (北緯 23.5°)

const SYNODIC_MONTH = 29.53058867; 
const KNOWN_NEW_MOON_2025 = new Date('2025-01-29T20:36:00+08:00'); 

/**
 * 估算該日期的月球最大仰角 (中天高度)
 * 符合事實：根據緯度與月球赤緯估算
 */
function getRealisticMaxAltitude(date) {
    const moon = getMoonData(date); //
    // 模擬月球赤緯隨農曆週期在 ±20 度之間擺動
    const approxDeclination = Math.sin((moon.phase * 2 * Math.PI) - Math.PI/2) * 20;
    
    // 公式：90 - |觀測者緯度 - 月球赤緯|
    const maxAlt = 90 - Math.abs(OBSERVER_LAT - approxDeclination);
    return maxAlt;
}


function getMoonData(date) {
    // ... (保留原本的 getMoonData 內容不變) ...
    const diffTime = date.getTime() - KNOWN_NEW_MOON_2025.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    
    let age = diffDays % SYNODIC_MONTH;
    if (age < 0) age += SYNODIC_MONTH;

    const phase = age / SYNODIC_MONTH;
    const illumination = ((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100).toFixed(0);

    let name = "";
    let desc = "";
    
    if (age < 1.0 || age > 28.5) { name = "新月"; desc = "農曆初一，月球在地球與太陽之間。"; }
    else if (age < 6.5) { name = "眉月"; desc = "傍晚可見，亮面在右側。"; }
    else if (age < 8.5) { name = "上弦月"; desc = "中午升起，午夜落下，右半亮。"; }
    else if (age < 13.5) { name = "盈凸月"; desc = "整夜可見，接近滿月。"; }
    else if (age < 15.5) { name = "滿月"; desc = "日落時升起，整夜明亮。"; }
    else if (age < 21.5) { name = "虧凸月"; desc = "滿月過後，左側開始變暗。"; }
    else if (age < 23.5) { name = "下弦月"; desc = "午夜升起，中午落下，左半亮。"; }
    else { name = "殘月"; desc = "黎明前可見，亮面在左側 C 型。"; }

    return { age, phase, illumination, name, desc };
}

function generateMoonSVG(phase, size) {
    // ... (保留原本的 generateMoonSVG 內容不變) ...
    const r = 45;
    const isWaxing = phase <= 0.5;
    const theta = phase * 2 * Math.PI;
    const rx = r * Math.cos(theta);
    let d = "";

    if (isWaxing) {
        const sweep = (phase < 0.25) ? 0 : 1;
        d = `M 50 5 A 45 45 0 0 1 50 95 A ${Math.abs(rx)} 45 0 0 ${sweep} 50 5`;
    } else {
        const sweep = (phase < 0.75) ? 1 : 0;
        d = `M 50 95 A 45 45 0 0 1 50 5 A ${Math.abs(rx)} 45 0 0 ${sweep} 50 95`;
    }

    let fill = "#f4f6f0";
    if (phase < 0.02 || phase > 0.98) { fill = "transparent"; d = `M 50 5 A 45 45 0 1 1 50 95 A 45 45 0 1 1 50 5`; }
    else if (Math.abs(phase - 0.5) < 0.02) { d = `M 50 5 A 45 45 0 1 1 50 95 A 45 45 0 1 1 50 5`; }

    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}"><circle cx="50" cy="50" r="45" fill="#1a1d2e" /><path d="${d}" fill="${fill}" /></svg>`;
}

// === 新增：共用的日期格式化工具 ===
function getExtendedDate(date) {
    const weekday = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' }).format(date);
    const ymd = `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`;
    
    // 農曆計算
    const lunarFormatter = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', { month: 'numeric', day: 'numeric' });
    const parts = lunarFormatter.formatToParts(date);
    let lunarMonth = "", lunarDay = "";
    parts.forEach(p => {
        if (p.type === 'month') lunarMonth = p.value;
        if (p.type === 'day') lunarDay = p.value;
    });
    
    // 數字轉中文月份 (選用)
    const chineseMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    if (!isNaN(parseInt(lunarMonth))) lunarMonth = chineseMonths[parseInt(lunarMonth) - 1];
    lunarMonth = lunarMonth.replace('月', '');

    return {
        iso: date.toISOString().split('T')[0],
        ymd: ymd,
        week: weekday,
        fullGregorian: `${ymd} (${weekday})`,
        lunar: `農曆${lunarMonth}月${lunarDay}`,
        combined: `${ymd} (${weekday}) | ${lunarMonth}月${lunarDay}`
    };
}

