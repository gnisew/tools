const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvas-wrapper');
const list = document.getElementById('functions-list');
const controlsContainer = document.getElementById('controls-container');
const toggleBtn = document.getElementById('toggle-panel-btn');
const floatControls = document.getElementById('float-controls');

const HELP_DATA = {
    LINEAR: {
        formula: 'y = ax + b',
        feature: '最簡單的圖形，斜率固定，是一條筆直的線。',
        example: '計程車跳表計費、等速前進的車子、儲蓄累積。'
    },
    QUADRATIC: {
        formula: 'y = ax² + bx + c',
        feature: '對稱的 U 型或倒 U 型曲線，有最高點或最低點。',
        example: '丟球的飛行軌跡、噴水池的水柱、衛星天線盤。'
    },
    CUBIC: {
        formula: 'y = a(x-b)³ + c',
        feature: '像閃電或 S 形的曲線，成長速度比平方更快，有轉折。',
        example: '雲霄飛車軌道、溜滑梯側面、風力發電功率曲線。'
    },
    ABS: {
        formula: 'y = a|x-b| + c',
        feature: '尖銳的 V 字形，在某一點發生急劇轉折，完全對稱。',
        example: '撞球的反彈路徑、光線射到鏡子的反射、股票觸底反彈。'
    },
    INVERSE: {
        formula: 'y = a/x',
        feature: '一個變大、另一個就變小。曲線永遠不會碰到軸線（漸近線）。',
        example: '蹺蹺板的平衡（距離與重量）、固定距離下的速度與時間。'
    },
    EXP: {
        formula: 'y = a · b^x',
        feature: '剛開始很慢，後來會爆炸性地快速增加（或減少）。',
        example: '細菌繁殖、複利投資、病毒傳播、放射性衰變。'
    },
    LOG: {
        formula: 'y = a · ln(x)',
        feature: '剛開始衝很快，但後來增加的速度會越來越慢。',
        example: '地震規模 (芮氏)、聲音分貝、人類的感知能力。'
    },
    SINE: {
        formula: 'y = a · sin(bx)',
        feature: '上下起伏，週而復始，有規律的波浪形狀。',
        example: '海浪、心電圖、交流電、琴弦的振動。'
    },
    GAUSS: {
        formula: 'y = a · e^-(x-b)²',
        feature: '中間高、兩邊低，像一口鐘。大部分數據集中在中間。',
        example: '全班考試成績分佈、人類身高分佈、常態分佈。'
    },
    SQRT: {
        formula: 'y = a · √x',
        feature: '像拋物線倒過來的一半，起跑很快，後來變平緩。',
        example: '拱門的一半、短跑選手起跑的加速曲線。'
    },
    CIRCLE: {
        formula: '(x-a)² + (y-b)² = r²',
        feature: '完美的圓形，每一點到圓心的距離都相等。',
        example: '車輪、披薩、時鐘、摩天輪。'
    }
};

let width, height;
let scale = 40; 
let offsetX = 0, offsetY = 0; 
const INPUT_MAX = 10000;

let isDragging = false;
let lastX = 0, lastY = 0;

let functions = [];
const colors = ['#4361ee', '#e63946', '#2a9d8f', '#f77f00', '#7209b7', '#00b4d8', '#ff006e', '#3a86ff', '#8338ec', '#fb5607'];

// 定義支援的函數類型
const FUNC_TYPES = {
    LINEAR: { 
        id: 'LINEAR', 
        name: '線性 (直線)', 
        formulaDisplay: 'y = ax + b',
        params: ['a', 'b'],
        defaultParams: { a: 1, b: 0 } 
    },
    QUADRATIC: { 
        id: 'QUADRATIC', 
        name: '拋物線 (二次)', 
        formulaDisplay: 'y = ax² + bx + c', 
        params: ['a', 'b', 'c'],
        defaultParams: { a: 1, b: 0, c: 0 }
    },
    CUBIC: {
        id: 'CUBIC',
        name: 'S形 (三次)',
        formulaDisplay: 'y = a(x-b)³ + c',
        params: ['a', 'b', 'c'],
        defaultParams: { a: 0.5, b: 0, c: 0 }
    },
    ABS: {
        id: 'ABS',
        name: 'V形 (絕對值)',
        formulaDisplay: 'y = a|x-b| + c',
        params: ['a', 'b', 'c'],
        defaultParams: { a: 1, b: 0, c: 0 }
    },
    INVERSE: { 
        id: 'INVERSE', 
        name: '反比 (雙曲線)', 
        formulaDisplay: 'y = a/x', 
        params: ['a'],
        defaultParams: { a: 1 }
    },
    EXP: { 
        id: 'EXP', 
        name: '指數 (成長)', 
        formulaDisplay: 'y = a · b^x', 
        params: ['a', 'b'],
        defaultParams: { a: 1, b: 2 }
    },
    LOG: { 
        id: 'LOG', 
        name: '對數 (Log)', 
        formulaDisplay: 'y = a · ln(x)', 
        params: ['a'],
        defaultParams: { a: 1 }
    },
    SINE: {
        id: 'SINE',
        name: '波浪 (正弦)',
        formulaDisplay: 'y = a · sin(bx)',
        params: ['a', 'b'],
        defaultParams: { a: 2, b: 1 } 
    },
    GAUSS: {
        id: 'GAUSS',
        name: '鐘形 (常態分佈)',
        formulaDisplay: 'y = a · e^-(x-b)²',
        params: ['a', 'b'],
        defaultParams: { a: 5, b: 0 } // a=高度, b=中心位置
    },
    SQRT: {
        id: 'SQRT',
        name: '弧形 (根號)',
        formulaDisplay: 'y = a · √x',
        params: ['a'],
        defaultParams: { a: 1 }
    },
    CIRCLE: {
        id: 'CIRCLE',
        name: '圓形',
        formulaDisplay: '(x-a)² + (y-b)² = r²',
        params: ['a', 'b', 'r'],
        defaultParams: { a: 0, b: 0, r: 4 }
    }
};

// --- 初始化 ---
function init() {
    resize();
    window.addEventListener('resize', () => {
        resize();
        updateToggleIcon();
    });
    
    // 預設新增一個鐘形曲線，展示新功能
    addNewFunction('GAUSS');

	generateHelpContent(); // 產生說明文字
    addNewFunction('GAUSS'); // 預設範例
    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        zoom(delta);
    }, { passive: false });

    canvas.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', endDrag);
    canvas.addEventListener('touchstart', startDrag, {passive: false});
    window.addEventListener('touchmove', drag, {passive: false});
    window.addEventListener('touchend', endDrag);

    updateToggleIcon();
    adjustFloatControls();
    draw();
}

function toggleHelp() {
    const modal = document.getElementById('help-modal');
    modal.classList.toggle('hidden');
}

function closeHelp(e) {
    if (e.target.id === 'help-modal') {
        toggleHelp();
    }
}

function generateHelpContent() {
    const body = document.getElementById('help-body');
    let html = '';
    
    // 遍歷 FUNC_TYPES 來確保順序和名稱一致
    Object.values(FUNC_TYPES).forEach(type => {
        const info = HELP_DATA[type.id];
        if (!info) return;

        html += `
            <div class="help-item">
                <div class="help-title">
                    ${type.name}
                    <span class="help-tag">${info.formula}</span>
                </div>
                <div class="help-desc">
                    <span class="help-label">✨ 特點：</span>${info.feature}
                </div>
                <div class="help-desc">
                    <span class="help-label">💡 生活例子：</span>${info.example}
                </div>
            </div>
        `;
    });
    body.innerHTML = html;
}

// --- 介面控制 ---
function togglePanel() {
    controlsContainer.classList.toggle('collapsed');
    updateToggleIcon();
    adjustFloatControls();
    setTimeout(() => {
        resize();
        if (window.innerWidth > 768) {
            offsetX = width / 2;
            offsetY = height / 2;
        }
        draw();
    }, 320);
}

function updateToggleIcon() {
    const isCollapsed = controlsContainer.classList.contains('collapsed');
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        toggleBtn.innerText = isCollapsed ? '▲' : '▼';
    } else {
        toggleBtn.innerText = isCollapsed ? '◀' : '➤';
    }
}

function adjustFloatControls() {
    const isMobile = window.innerWidth <= 768;
    const isCollapsed = controlsContainer.classList.contains('collapsed');
    if (isMobile) {
        floatControls.style.bottom = isCollapsed ? '20px' : '58%'; 
    } else {
        floatControls.style.bottom = '20px';
    }
}

// --- 拖曳與縮放 ---
function startDrag(e) {
    isDragging = true;
    const pos = getEventPos(e);
    lastX = pos.x;
    lastY = pos.y;
    container.style.cursor = 'grabbing';
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault(); 
    const pos = getEventPos(e);
    const dx = pos.x - lastX;
    const dy = pos.y - lastY;
    offsetX += dx;
    offsetY += dy;
    lastX = pos.x;
    lastY = pos.y;
    draw();
}

function endDrag() {
    isDragging = false;
    container.style.cursor = 'grab';
}

function getEventPos(e) {
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
}

function resetView() {
    resize();
    offsetX = width / 2;
    offsetY = height / 2;
    scale = 40;
    draw();
}

function resize() {
    width = container.clientWidth;
    height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;
    if (offsetX === 0 && offsetY === 0) {
        offsetX = width / 2;
        offsetY = height / 2;
    }
}

// --- 數學核心邏輯 ---

function isValidNum(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// 計算 Y
function calculateY(type, p, x) {
    switch (type) {
        case 'LINEAR': return p.a * x + p.b;
        case 'QUADRATIC': return p.a * x * x + p.b * x + p.c;
        case 'CUBIC': return p.a * Math.pow((x - p.b), 3) + p.c;
        case 'ABS': return p.a * Math.abs(x - p.b) + p.c;
        case 'INVERSE': return (Math.abs(x) < 1e-7) ? NaN : p.a / x;
        case 'EXP': return p.a * Math.pow(p.b, x);
        case 'LOG': return (x <= 0) ? NaN : p.a * Math.log(x);
        case 'SINE': return p.a * Math.sin(p.b * x);
        case 'GAUSS': return p.a * Math.exp(-Math.pow(x - p.b, 2));
        case 'SQRT': return (x < 0) ? NaN : p.a * Math.sqrt(x);
        case 'CIRCLE':
            const term = p.r * p.r - (x - p.a) * (x - p.a);
            return (term < 0) ? NaN : p.b + Math.sqrt(term);
        default: return 0;
    }
}

// 計算 X (反推)
function calculateX(type, p, y) {
    switch (type) {
        case 'LINEAR':
            if (p.a === 0) return NaN;
            return (y - p.b) / p.a;
        case 'QUADRATIC':
            if (p.a === 0) return (y - p.c) / p.b; // 降階
            const C = p.c - y;
            const delta = p.b * p.b - 4 * p.a * C;
            if (delta < 0) return NaN;
            return (-p.b + Math.sqrt(delta)) / (2 * p.a); // 回傳右解
        case 'CUBIC':
            // y = a(x-b)^3 + c => (y-c)/a = (x-b)^3
            if (p.a === 0) return NaN;
            const valCubic = (y - p.c) / p.a;
            // 處理立方根 (Math.pow 對負數支援不佳，需手動處理符號)
            const cbrt = (Math.abs(valCubic) ** (1/3)) * (valCubic < 0 ? -1 : 1);
            return cbrt + p.b;
        case 'ABS':
            // y = a|x-b| + c => |x-b| = (y-c)/a
            if (p.a === 0) return NaN;
            const valAbs = (y - p.c) / p.a;
            if (valAbs < 0) return NaN;
            return valAbs + p.b; // 回傳右側解
        case 'INVERSE': return (y === 0) ? NaN : p.a / y;
        case 'EXP':
            if (p.a === 0 || p.b <= 0 || p.b === 1) return NaN;
            const valExp = y / p.a;
            return (valExp <= 0) ? NaN : Math.log(valExp) / Math.log(p.b);
        case 'LOG': return (p.a === 0) ? NaN : Math.exp(y / p.a);
        case 'SINE':
            if (p.a === 0) return NaN;
            const ratio = y / p.a;
            if (ratio < -1 || ratio > 1) return NaN;
            return (p.b === 0) ? NaN : Math.asin(ratio) / p.b;
        case 'GAUSS':
            // y = a * e^-(x-b)^2 => ln(y/a) = -(x-b)^2 => -ln(y/a) = (x-b)^2
            if (p.a === 0) return NaN;
            const valGauss = y / p.a;
            if (valGauss <= 0 || valGauss > 1) return NaN; // Gauss max is at x=b, y=a
            const inner = -Math.log(valGauss);
            return p.b + Math.sqrt(inner); // 回傳右側解
        case 'SQRT':
            if (p.a === 0) return NaN;
            const valSqrt = y / p.a;
            return (valSqrt < 0) ? NaN : valSqrt * valSqrt;
        case 'CIRCLE':
            const termY = p.r * p.r - (y - p.b) * (y - p.b);
            return (termY < 0) ? NaN : p.a + Math.sqrt(termY);
        default: return NaN;
    }
}

function addNewFunction(typeKey = 'LINEAR') {
    const id = Date.now() + Math.random();
    const color = colors[functions.length % colors.length];
    const typeConfig = FUNC_TYPES[typeKey] || FUNC_TYPES.LINEAR;
    
    functions.push({ 
        id, 
        type: typeConfig.id, 
        params: { ...typeConfig.defaultParams },
        color, 
        userPoint: null 
    });
    renderList();
    draw();
}

function removeFunction(id) {
    functions = functions.filter(f => f.id !== id);
    renderList();
    draw();
}

function changeFunctionType(id, newType) {
    const f = functions.find(func => func.id === id);
    if (f) {
        f.type = newType;
        f.params = { ...FUNC_TYPES[newType].defaultParams };
        f.userPoint = null;
        renderList();
        draw();
    }
}

function updateParams(id, paramKey, val) {
    const f = functions.find(func => func.id === id);
    if (f) {
        if (val === '' || val === '-' || val === '.') return;
        let num = parseFloat(val);
        if(isNaN(num)) num = 0;
        f.params[paramKey] = num;
        recalcUserPoint(id);
        draw();
    }
}

function onInputX(id, val) {
    const f = functions.find(func => func.id === id);
    const yInput = document.getElementById(`in-y-${id}`);
    yInput.className = ''; 

    if (val === '' || val === '-') {
        yInput.value = '';
        f.userPoint = null;
    } else {
        if (!isValidNum(val)) return;
        let x = parseFloat(val);
        const y = calculateY(f.type, f.params, x);
        
        if (!isNaN(y) && isFinite(y)) {
            yInput.value = Number.isInteger(y) ? y : parseFloat(y.toFixed(2));
            f.userPoint = { x, y };
        } else {
            yInput.value = "無定義";
            yInput.className = "status-text";
            f.userPoint = null;
        }
    }
    draw();
}

function onInputY(id, val) {
    const f = functions.find(func => func.id === id);
    const xInput = document.getElementById(`in-x-${id}`);
    xInput.className = '';

    if (val === '' || val === '-') {
        xInput.value = '';
        f.userPoint = null;
    } else {
        if (!isValidNum(val)) return;
        let y = parseFloat(val);
        const x = calculateX(f.type, f.params, y);

        if (!isNaN(x) && isFinite(x)) {
            xInput.value = Number.isInteger(x) ? x : parseFloat(x.toFixed(2));
            f.userPoint = { x, y };
        } else {
            xInput.value = "無解";
            xInput.className = "status-text";
            f.userPoint = null;
        }
    }
    draw();
}

function recalcUserPoint(id) {
    const xInput = document.getElementById(`in-x-${id}`);
    if (xInput && xInput.value !== '' && isValidNum(xInput.value)) {
        onInputX(id, xInput.value);
    }
}

// --- 渲染介面 ---
function renderList() {
    list.innerHTML = '';
    functions.forEach((f) => {
        const typeConfig = FUNC_TYPES[f.type];
        const card = document.createElement('div');
        card.className = 'function-card';
        card.style.borderLeftColor = f.color;

        let optionsHtml = '';
        Object.values(FUNC_TYPES).forEach(t => {
            optionsHtml += `<option value="${t.id}" ${t.id === f.type ? 'selected' : ''}>${t.name}</option>`;
        });

        let paramsHtml = '';
        typeConfig.params.forEach(p => {
            paramsHtml += `
                <div class="input-group">
                    <label>${p}</label>
                    <input type="number" value="${f.params[p]}" oninput="updateParams(${f.id}, '${p}', this.value)">
                </div>
            `;
        });
        
        card.innerHTML = `
            <div class="card-header" style="color:${f.color}">
                <div class="card-title-row">
                    <span class="formula-text">${typeConfig.formulaDisplay}</span>
                    <button class="btn-del" onclick="removeFunction(${f.id})">✕</button>
                </div>
                <select class="type-select" onchange="changeFunctionType(${f.id}, this.value)">
                    ${optionsHtml}
                </select>
            </div>
            
            <div class="input-row">
                ${paramsHtml}
                <div class="divider-vertical"></div>
                <div class="input-group calc-group">
                    <label>x</label>
                    <input type="text" inputmode="decimal" id="in-x-${f.id}" placeholder="?" oninput="onInputX(${f.id}, this.value)">
                </div>
                <div class="input-group calc-group">
                    <label>y</label>
                    <input type="text" inputmode="decimal" id="in-y-${f.id}" placeholder="?" oninput="onInputY(${f.id}, this.value)">
                </div>
            </div>
        `;
        list.appendChild(card);
        
        if (f.userPoint) {
            document.getElementById(`in-x-${f.id}`).value = parseFloat(f.userPoint.x.toFixed(2));
            document.getElementById(`in-y-${f.id}`).value = parseFloat(f.userPoint.y.toFixed(2));
        }
    });
}

// --- 繪圖區 ---
function toScreenX(x) { return offsetX + (x * scale); }
function toScreenY(y) { return offsetY - (y * scale); }
function toLogicX(sx) { return (sx - offsetX) / scale; }
function toLogicY(sy) { return (offsetY - sy) / scale; }

function draw() {
    ctx.clearRect(0, 0, width, height);
    drawGridAndAxes();
    functions.forEach(f => {
        if (f.type === 'CIRCLE') {
            drawCircleShape(f);
        } else {
            drawCurve(f);
        }
        drawUserPoint(f);
    });
}

function drawGridAndAxes() {
    let step = 1;
    if (scale < 10) step = 10;
    else if (scale < 20) step = 5;
    else if (scale < 40) step = 2;

    const left = Math.floor(toLogicX(0) / step) * step;
    const right = Math.ceil(toLogicX(width) / step) * step;
    const bottom = Math.floor(toLogicY(height) / step) * step;
    const top = Math.ceil(toLogicY(0) / step) * step;

    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = left; x <= right; x += step) {
        const sx = toScreenX(x);
        ctx.moveTo(sx, 0); ctx.lineTo(sx, height);
    }
    for (let y = bottom; y <= top; y += step) {
        const sy = toScreenY(y);
        ctx.moveTo(0, sy); ctx.lineTo(width, sy);
    }
    ctx.stroke();

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, offsetY); ctx.lineTo(width, offsetY);
    ctx.moveTo(offsetX, 0); ctx.lineTo(offsetX, height);
    ctx.stroke();

    ctx.fillStyle = '#888';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    let c = 0;
    for (let x = left; x <= right; x += step) {
        if (c++ > 200) break;
        if (Math.abs(x) < 0.0001) continue;
        ctx.fillText(parseFloat(x.toFixed(2)), toScreenX(x), offsetY + 12);
    }
    c = 0;
    ctx.textAlign = 'right';
    for (let y = bottom; y <= top; y += step) {
        if (c++ > 200) break;
        if (Math.abs(y) < 0.0001) continue;
        ctx.fillText(parseFloat(y.toFixed(2)), offsetX - 6, toScreenY(y) + 3);
    }
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Times New Roman';
    ctx.fillText("x", width - 10, offsetY - 10);
    ctx.fillText("y", offsetX + 15, 15);
}

function drawCurve(f) {
    ctx.beginPath();
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 2.5;

    let started = false;
    const pixelStep = 2; 
    
    for (let sx = 0; sx <= width; sx += pixelStep) {
        const x = toLogicX(sx);
        const y = calculateY(f.type, f.params, x);
        
        if (isNaN(y) || !isFinite(y)) {
            started = false; 
            continue;
        }

        const sy = toScreenY(y);

        if (started) {
             const prevY = calculateY(f.type, f.params, toLogicX(sx - pixelStep));
             const prevSY = toScreenY(prevY);
             if (Math.abs(sy - prevSY) > height) { 
                 started = false;
                 ctx.stroke();
                 ctx.beginPath();
                 continue;
             }
        }

        if (!started) {
            ctx.moveTo(sx, sy);
            started = true;
        } else {
            ctx.lineTo(sx, sy);
        }
    }
    ctx.stroke();
}

function drawCircleShape(f) {
    const { a, b, r } = f.params;
    if (r <= 0) return;

    const centerX = toScreenX(a);
    const centerY = toScreenY(b);
    const radius = r * scale;

    ctx.beginPath();
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 2.5;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
}

function drawUserPoint(f) {
    if (!f.userPoint) return;
    const { x, y } = f.userPoint;
    const sx = toScreenX(x);
    const sy = toScreenY(y);
    
    if (sx < -50 || sx > width + 50 || sy < -50 || sy > height + 50) return;

    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = f.color;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fillStyle = f.color;
    ctx.fill();
    
    const text = `(${parseFloat(x.toFixed(2))}, ${parseFloat(y.toFixed(2))})`;
    ctx.font = 'bold 12px Arial';
    const textW = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(sx + 8, sy - 20, textW + 4, 16);
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText(text, sx + 10, sy - 8);
}

function zoom(factor) {
    const newScale = scale * factor;
    if (newScale > 0.5 && newScale < 500) {
        scale = newScale;
        draw();
    }
}

init();