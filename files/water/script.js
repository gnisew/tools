const app = {
    // --- 應用程式狀態 ---
    state: {
        currentView: 'menu',
        exp1: { angle: 0, draggingTarget: null, lineTopPx: 0 },
        exp2: { angle: 0, waterLevelY: 350, draggingTarget: null, lineTopPx: 0, isPouring: false },
        
        // 修改：實驗三加入 currentWaterY 變數以實現緩慢流動
        exp3: { 
            leftY: 250, 
            rightY: 250, 
            currentWaterY: 250, // 當前水位（動畫用）
            draggingTarget: null, 
            lineTopPx: 0 
        },
        
        exp4: {
            sourceGroupY: 200, outletX: 425, outletY: 350,
            sourceWaterH: 100, destWaterH: 20,
            isPrimed: false, isBlocked: false, isBreaking: false,
            breakRadius: 0, cupHeight: 160
        },
        drag: { lastX: 0, lastY: 0, startLineTop: 0, startObjY: 0, startObjX: 0 }
    },

    dom: {},

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.handleInitialRoute();

        setTimeout(() => {
             this.handleResize();
             
             // 啟動所有實驗的物理迴圈
             this.exp3PhysicsLoop(); 
             this.exp4PhysicsLoop();
             
             if (window.innerWidth < 600) {
                 if(this.dom.infoPanel) this.dom.infoPanel.classList.add('collapsed');
             }
        }, 100);
    },

    cacheDOM() {
        this.dom.menu = document.getElementById('menu-view');
        this.dom.exp1View = document.getElementById('experiment-1-view');
        this.dom.exp2View = document.getElementById('experiment-2-view');
        this.dom.exp3View = document.getElementById('experiment-3-view');
        this.dom.exp4View = document.getElementById('experiment-4-view');

        // Exp 1
        this.dom.labArea1 = document.getElementById('labArea1');
        this.dom.rotateGroup1 = document.getElementById('rotateGroup1');
        this.dom.waterRect1 = document.getElementById('waterRect1');
        this.dom.angleSlider1 = document.getElementById('angleSlider1');
        this.dom.angleDisplay1 = document.getElementById('angleDisplay1');
        this.dom.maskUse1 = document.getElementById('mask-use1');
        this.dom.borderUse1 = document.getElementById('border-use1');
        this.dom.dragLine1 = document.getElementById('dragLine1');
        this.dom.lineToggle1 = document.getElementById('lineToggle1');
        this.dom.shapeBtns = document.querySelectorAll('.shape-btn');

        // Exp 2
        this.dom.labArea2 = document.getElementById('labArea2');
        this.dom.rotateGroup2 = document.getElementById('rotateGroup2');
        this.dom.waterRect2 = document.getElementById('waterRect2');
        this.dom.angleSlider2 = document.getElementById('angleSlider2');
        this.dom.angleDisplay2 = document.getElementById('angleDisplay2');
        this.dom.dragLine2 = document.getElementById('dragLine2');
        this.dom.lineToggle2 = document.getElementById('lineToggle2');
        this.dom.btnAddWater = document.getElementById('btnAddWater');
        this.dom.btnResetWater = document.getElementById('btnResetWater'); 
        this.dom.pourZones = document.querySelectorAll('.pour-zone');

        // Exp 3
        this.dom.labArea3 = document.getElementById('labArea3');
        this.dom.dragLine3 = document.getElementById('dragLine3');
        this.dom.lineToggle3 = document.getElementById('lineToggle3');
        this.dom.bottleLeft = document.getElementById('bottleLeftGroup');
        this.dom.bottleRight = document.getElementById('bottleRightGroup');
        this.dom.waterLeft = document.getElementById('waterLeft');
        this.dom.waterRight = document.getElementById('waterRight');
        this.dom.tubeBg = document.getElementById('tube-bg');
        this.dom.tubeWater = document.getElementById('tube-water');

        // Exp 4
        this.dom.labArea4 = document.getElementById('labArea4');
        this.dom.sourceGroup4 = document.getElementById('exp4-source-group');
        this.dom.sourceWater4 = document.getElementById('exp4-source-water');
        this.dom.destWater4 = document.getElementById('exp4-dest-water');
        this.dom.outletHandle4 = document.getElementById('exp4-outlet-handle');
        this.dom.outletIndicator = document.getElementById('outlet-indicator');
        this.dom.tubeBg4 = document.getElementById('siphon-tube-bg');
        this.dom.tubeWater4 = document.getElementById('siphon-tube-water');
        this.dom.outflowStream = document.getElementById('outflow-stream');
        this.dom.breakAirBubble = document.getElementById('break-air-bubble');
        this.dom.btnPrime = document.getElementById('btnPrimeTube');
        this.dom.blockToggle = document.getElementById('blockToggle4');
        this.dom.blockLabel = document.getElementById('blockLabel4');
        this.dom.btnReset4 = document.getElementById('btnResetExp4');
        this.dom.status4 = document.getElementById('exp4-status');
        this.dom.hint4 = document.getElementById('exp4-hint');
        this.dom.infoPanel = document.getElementById('exp4-floating-info');
    },

    bindEvents() {
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('popstate', () => this.handleInitialRoute());

        this.dom.btnPrime.addEventListener('click', () => this.primeExp4Tube());
        this.dom.blockToggle.addEventListener('change', (e) => this.toggleExp4Block(e.target.checked));
        this.dom.btnReset4.addEventListener('click', () => this.resetExp4());
        this.setupDraggable(this.dom.labArea4, 'exp4');

        // Exp 1
        this.dom.angleSlider1.addEventListener('input', (e) => this.updateExp1Angle(parseInt(e.target.value)));
        this.dom.lineToggle1.addEventListener('change', (e) => this.dom.dragLine1.classList.toggle('hidden', !e.target.checked));
        this.dom.shapeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.dom.shapeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setExp1Shape(btn.dataset.type);
            });
        });
        this.setupDraggable(this.dom.labArea1, 'exp1');

        // Exp 2
        this.dom.angleSlider2.addEventListener('input', (e) => this.updateExp2State(parseInt(e.target.value), null));
        this.dom.lineToggle2.addEventListener('change', (e) => this.dom.dragLine2.classList.toggle('hidden', !e.target.checked));
        const startPour = (e) => { 
            if(e.cancelable && e.type !== 'mousedown') e.preventDefault(); 
            this.state.exp2.isPouring = true; 
            this.pourWaterLoop(); 
        };
        const stopPour = () => { this.state.exp2.isPouring = false; };
        this.dom.btnAddWater.addEventListener('mousedown', startPour);
        this.dom.btnAddWater.addEventListener('touchstart', startPour, {passive: false});
        this.dom.pourZones.forEach(zone => {
            zone.addEventListener('mousedown', startPour);
            zone.addEventListener('touchstart', startPour, {passive: false});
        });
        window.addEventListener('mouseup', stopPour);
        window.addEventListener('touchend', stopPour);
        this.dom.btnResetWater.addEventListener('click', () => this.updateExp2State(null, 350));
        this.setupDraggable(this.dom.labArea2, 'exp2');

        // Exp 3
        this.dom.lineToggle3.addEventListener('change', (e) => this.dom.dragLine3.classList.toggle('hidden', !e.target.checked));
        this.setupDraggable(this.dom.labArea3, 'exp3');
    },

    toggleInfoPanel() {
        if(this.dom.infoPanel) this.dom.infoPanel.classList.toggle('collapsed');
    },

    handleInitialRoute() {
        const params = new URLSearchParams(window.location.search);
        const exp = params.get('exp');
        if (exp === '1') this.switchView('exp1', false);
        else if (exp === '2') this.switchView('exp2', false);
        else if (exp === '3') this.switchView('exp3', false);
        else if (exp === '4') this.switchView('exp4', false);
        else this.switchView('menu', false);
    },

    startExp1() { this.switchView('exp1'); this.updateExp1Angle(0); this.handleResize(); },
    startExp2() { this.switchView('exp2'); this.updateExp2State(0, 350); this.handleResize(); },
    startExp3() { this.switchView('exp3'); this.state.exp3.leftY = 250; this.state.exp3.rightY = 250; this.updateExp3Render(); this.handleResize(); },
    startExp4() { this.switchView('exp4'); this.resetExp4(); },
    
    goHome() { this.switchView('menu'); this.state.exp2.isPouring = false; },
    
    switchView(view, updateHistory = true) {
        this.state.currentView = view;
        ['menu', 'exp1', 'exp2', 'exp3', 'exp4'].forEach(v => {
            const el = document.getElementById(v === 'menu' ? 'menu-view' : `experiment-${v.slice(3)}-view`);
            if(el) el.classList.add('hidden');
        });
        const target = document.getElementById(view === 'menu' ? 'menu-view' : `experiment-${view.slice(3)}-view`);
        if(target) target.classList.remove('hidden');

        if (updateHistory) {
            let url = window.location.pathname;
            if (view.startsWith('exp')) {
                const num = view.replace('exp', '');
                url += `?exp=${num}`;
            }
            window.history.pushState(null, '', url);
        }
        
        if (view === 'exp4') this.resetExp4();
    },
    
    handleResize() {
        if(this.state.currentView === 'exp1') this.dom.dragLine1.style.top = `${this.state.exp1.lineTopPx}px`;
        if(this.state.currentView === 'exp2') this.dom.dragLine2.style.top = `${this.state.exp2.lineTopPx}px`;
        if(this.state.currentView === 'exp3') this.dom.dragLine3.style.top = `${this.state.exp3.lineTopPx}px`;
    },

    setupDraggable(labArea, expKey) {
        if(!labArea) return;
        const start = (e) => this.handleDragStart(e, expKey);
        const move = (e) => this.handleDragMove(e, expKey);
        const end = () => this.handleDragEnd(expKey);
        labArea.addEventListener('mousedown', start);
        labArea.addEventListener('touchstart', start, {passive: false});
        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move, {passive: false});
        window.addEventListener('mouseup', end);
        window.addEventListener('touchend', end);
    },

    handleDragStart(e, expKey) {
        const target = e.target;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        
        if (expKey === 'exp4') {
            const sourceGroup = target.closest('#exp4-source-group');
            if (sourceGroup) {
                this.state.exp4.draggingTarget = 'source';
                this.state.drag.lastY = clientY;
                this.state.drag.startObjY = this.state.exp4.sourceGroupY;
                this.dom.labArea4.style.cursor = 'grabbing';
                if(e.cancelable) e.preventDefault();
                return;
            }
            const handle = target.closest('#exp4-outlet-handle');
            if (handle) {
                this.state.exp4.draggingTarget = 'outlet';
                this.state.drag.lastX = clientX;
                this.state.drag.lastY = clientY;
                this.state.drag.startObjX = this.state.exp4.outletX;
                this.state.drag.startObjY = this.state.exp4.outletY;
                this.dom.labArea4.style.cursor = 'grabbing';
                if(this.dom.outletIndicator) this.dom.outletIndicator.classList.add('hidden');
                if(e.cancelable) e.preventDefault();
                return;
            }
        }
        
        const dragLineId = `dragLine${expKey.slice(3)}`;
        if (target.closest(`#${dragLineId}`)) {
             this.state[expKey].draggingTarget = 'line';
             this.state.drag.lastY = clientY;
             this.state.drag.startLineTop = this.dom[dragLineId].offsetTop;
             if(e.cancelable) e.preventDefault();
             return;
        }

        if (expKey === 'exp3') {
             const bottleGroup = target.closest('.bottle-draggable');
             if (bottleGroup) {
                const side = bottleGroup.dataset.side; 
                this.state.exp3.draggingTarget = side === 'left' ? 'leftBottle' : 'rightBottle';
                this.state.drag.lastY = clientY;
                this.state.drag.startObjY = (side === 'left') ? this.state.exp3.leftY : this.state.exp3.rightY;
                this.dom.labArea3.style.cursor = 'grabbing';
                if(e.cancelable) e.preventDefault();
             }
        } else if ((expKey === 'exp1' || expKey === 'exp2') && target.closest('.lab-stage')) {
             if (target.classList.contains('pour-zone')) return;
             this.state[expKey].draggingTarget = 'rotate';
             this.state.drag.lastX = clientX;
             this.dom[`labArea${expKey.slice(3)}`].style.cursor = 'grabbing';
             if(e.cancelable) e.preventDefault();
        }
    },

    handleDragMove(e, expKey) {
        const state = this.state[expKey];
        if (!state.draggingTarget) return;

        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;

        if (expKey === 'exp4') {
            if(e.cancelable) e.preventDefault();
            if (state.draggingTarget === 'source') {
                const deltaY = clientY - this.state.drag.lastY;
                let newY = this.state.drag.startObjY + deltaY;
                newY = Math.max(50, Math.min(300, newY));
                state.sourceGroupY = newY;
            } else if (state.draggingTarget === 'outlet') {
                const deltaX = clientX - this.state.drag.lastX;
                const deltaY = clientY - this.state.drag.lastY;
                let newX = this.state.drag.startObjX + deltaX;
                let newY = this.state.drag.startObjY + deltaY;
                newX = Math.max(360, Math.min(490, newX));
                newY = Math.max(50, Math.min(450, newY));
                state.outletX = newX;
                state.outletY = newY;
            }
            this.updateExp4Render();
        } 
        else if (state.draggingTarget === 'line') {
             const deltaY = clientY - this.state.drag.lastY;
             let newTop = this.state.drag.startLineTop + deltaY;
             let area = this.dom[`labArea${expKey.slice(3)}`];
             newTop = Math.max(0, Math.min(area.clientHeight, newTop));
             this.dom[`dragLine${expKey.slice(3)}`].style.top = `${newTop}px`;
        }
        else if (state.draggingTarget === 'rotate') {
             const deltaX = clientX - this.state.drag.lastX;
             let newAngle = state.angle + (deltaX / 3);
             const limit = expKey === 'exp1' ? 90 : 45;
             newAngle = Math.max(-limit, Math.min(limit, newAngle));
             if(expKey === 'exp1') this.updateExp1Angle(Math.round(newAngle));
             else this.updateExp2State(Math.round(newAngle), null);
             this.state.drag.lastX = clientX; 
        }
        else if (expKey === 'exp3') {
             const deltaY = clientY - this.state.drag.lastY;
             let newObjY = this.state.drag.startObjY + deltaY;
             newObjY = Math.max(50, Math.min(380, newObjY));
             if (state.draggingTarget === 'leftBottle') state.leftY = newObjY;
             else state.rightY = newObjY;
             this.updateExp3Render();
        }
    },

    handleDragEnd(expKey) {
        this.state[expKey].draggingTarget = null;
        if(this.dom[`labArea${expKey.slice(3)}`]) this.dom[`labArea${expKey.slice(3)}`].style.cursor = 'default';
        if (expKey === 'exp4' && this.dom.outletIndicator) {
            this.dom.outletIndicator.classList.remove('hidden');
        }
    },

    // --- Exp 1 Logic ---
    updateExp1Angle(deg) {
        this.state.exp1.angle = deg;
        this.dom.angleSlider1.value = deg;
        this.dom.angleDisplay1.textContent = `${deg}°`;
        this.dom.rotateGroup1.setAttribute('transform', `rotate(${deg}, 200, 200)`);
        this.dom.waterRect1.setAttribute('transform', `rotate(${-deg}, 200, 200)`);
    },
    setExp1Shape(type) {
        const id = `#path-${type}`;
        this.dom.maskUse1.setAttribute('href', id);
        this.dom.borderUse1.setAttribute('href', id);
        this.updateExp1Angle(0);
    },

    // --- Exp 2 Logic ---
    pourWaterLoop() {
        if (!this.state.exp2.isPouring) return;
        let newLevel = this.state.exp2.waterLevelY - 2.5; 
        newLevel = Math.max(70, newLevel); 
        this.updateExp2State(null, newLevel);
        if (newLevel > 70) requestAnimationFrame(() => this.pourWaterLoop());
    },
    updateExp2State(newAngle, newLevelY) {
        const state = this.state.exp2;
        if (newAngle !== null) state.angle = newAngle;
        if (newLevelY !== null) state.waterLevelY = newLevelY;
        this.dom.angleSlider2.value = state.angle;
        this.dom.angleDisplay2.textContent = `${state.angle}°`;
        this.dom.waterRect2.setAttribute('y', state.waterLevelY);
        this.dom.rotateGroup2.setAttribute('transform', `rotate(${state.angle}, 300, 200)`);
        this.dom.waterRect2.setAttribute('transform', `rotate(${-state.angle}, 300, 200)`);
    },

    // --- Exp 3 Logic (加入物理迴圈) ---
    exp3PhysicsLoop() {
        if (this.state.currentView !== 'exp3') {
            requestAnimationFrame(() => this.exp3PhysicsLoop());
            return;
        }

        const s = this.state.exp3;
        // 計算目標平衡高度
        const targetY = (s.leftY + s.rightY) / 2;
        
        // 算出差距
        const diff = targetY - s.currentWaterY;
        
        // 緩慢逼近 (速度係數 0.03)
        if (Math.abs(diff) > 0.1) {
            s.currentWaterY += diff * 0.03;
            this.updateExp3Render();
        } else {
            s.currentWaterY = targetY; // 幾乎達到就直接設為目標
            this.updateExp3Render();
        }

        requestAnimationFrame(() => this.exp3PhysicsLoop());
    },

    updateExp3Render() {
        const { leftY, rightY, currentWaterY } = this.state.exp3;
        
        // 移動瓶子 (即時)
        this.dom.bottleLeft.setAttribute('transform', `translate(150, ${leftY})`);
        this.dom.bottleRight.setAttribute('transform', `translate(450, ${rightY})`);
        
        // 移動水位 (緩慢)
        this.dom.waterLeft.setAttribute('y', currentWaterY - leftY);
        this.dom.waterRight.setAttribute('y', currentWaterY - rightY);
        
        // 繪製連接管
        const startX = 150, startY = leftY + 100, endX = 450, endY = rightY + 100;
        const lowestY = Math.max(startY, endY);
        const pathData = `M ${startX},${startY} C ${startX},${lowestY+80} ${endX},${lowestY+80} ${endX},${endY}`;
        this.dom.tubeBg.setAttribute('d', pathData);
        this.dom.tubeWater.setAttribute('d', pathData);
    },

    // --- Exp 4 Logic ---
    resetExp4() {
        const s = this.state.exp4;
        s.sourceGroupY = 200; s.outletX = 425; s.outletY = 350;
        s.sourceWaterH = 100; s.destWaterH = 20;
        s.isPrimed = false; s.isBlocked = false; s.isBreaking = false; s.breakRadius = 0;
        this.dom.blockToggle.checked = false;
        this.updateExp4UI();
        this.updateExp4Render();
    },
    primeExp4Tube() {
        const s = this.state.exp4;
        if (s.sourceWaterH > 0) {
            s.isPrimed = true; s.isBreaking = false; s.breakRadius = 0;
            this.updateExp4Render();
        }
    },
    toggleExp4Block(isChecked) {
        const s = this.state.exp4;
        s.isBlocked = isChecked;
        this.updateExp4UI();
        this.updateExp4Render();
    },
    updateExp4UI() {
        const s = this.state.exp4;
        this.dom.blockLabel.textContent = s.isBlocked ? "管口已堵住" : "堵住管口";
        this.dom.outletIndicator.setAttribute('fill', s.isBlocked ? '#ff3b30' : '#28cd41');
    },
    exp4PhysicsLoop() {
        if (this.state.currentView !== 'exp4') {
            requestAnimationFrame(() => this.exp4PhysicsLoop());
            return;
        }
        const s = this.state.exp4;
        const sourceSurf = s.sourceGroupY + (s.cupHeight - s.sourceWaterH);
        const destSurf = 320 + (s.cupHeight - s.destWaterH);
        const isSubmerged = (s.outletX > 350 && s.outletX < 500 && s.outletY > destSurf);
        
        let statusText = "狀態: 準備就緒";
        let statusColor = "#333";
        let showStream = false;
        let flowClass = "";

        if (s.isBreaking) {
            s.breakRadius += 15; 
            if(s.breakRadius < 400) s.sourceWaterH = Math.max(0, s.sourceWaterH + 0.05);
            else { s.isPrimed = false; s.isBreaking = false; s.breakRadius = 0; }
            statusText = "狀態: ⚠️ 管口懸空，虹吸失效！"; statusColor = "orange";
        } else if (s.sourceWaterH <= 0 && s.isPrimed) {
            s.isPrimed = false;
            statusText = "狀態: 來源水已抽乾";
        } else if (s.isPrimed) {
            if (s.isBlocked) {
                statusText = "狀態: ⛔ 管口堵住"; statusColor = "#ff3b30";
            } else {
                let headDiff = 0;
                if (isSubmerged) headDiff = destSurf - sourceSurf;
                else headDiff = s.outletY - sourceSurf;

                if (Math.abs(headDiff) < 5) {
                    if (isSubmerged) {
                        statusText = "狀態: ⚖️ 連通管平衡"; statusColor = "#888";
                    } else {
                        s.isBreaking = true; s.breakRadius = 10;
                    }
                } else if (headDiff > 0) {
                    statusText = "狀態: 🌊 虹吸流動中..."; statusColor = "#007aff";
                    flowClass = "flow-anim";
                    if (!isSubmerged) showStream = true;
                    const flowRate = Math.min(headDiff * 0.005, 0.5);
                    if (s.sourceWaterH > 0) {
                        s.sourceWaterH -= flowRate;
                        if (s.outletX > 350 && s.outletX < 500) {
                             s.destWaterH += flowRate;
                             if(s.destWaterH > 150) s.destWaterH = 150;
                        }
                    }
                } else {
                    if (isSubmerged) {
                         statusText = "狀態: 🔄 逆向虹吸"; statusColor = "#0099cc";
                         flowClass = "flow-anim"; 
                         const reverseFlow = Math.abs(headDiff) * 0.01;
                         if (s.destWaterH > 0) {
                             s.destWaterH -= reverseFlow; s.sourceWaterH += reverseFlow;
                             if(s.sourceWaterH > 150) s.sourceWaterH = 150;
                         }
                    } else {
                        s.isBreaking = true; s.breakRadius = 10;
                    }
                }
            }
        } else {
            statusText = "狀態: ⚪ 管內無水"; statusColor = "#666";
        }

        this.dom.status4.textContent = statusText;
        this.dom.status4.style.color = statusColor;
        if (this.dom.tubeWater4) this.dom.tubeWater4.setAttribute('class', flowClass);
        
        if (showStream && !s.isBreaking) {
            this.dom.outflowStream.classList.remove('hidden');
            let streamEndY = s.outletY + 120;
            if (s.outletX > 350 && s.outletX < 500) {
                 const currentDestSurf = 320 + (160 - s.destWaterH);
                 if (s.outletY < currentDestSurf) streamEndY = currentDestSurf;
            }
            this.dom.outflowStream.setAttribute('d', `M ${s.outletX},${s.outletY} L ${s.outletX},${streamEndY}`);
        } else {
            this.dom.outflowStream.classList.add('hidden');
        }
        this.updateExp4Render();
        requestAnimationFrame(() => this.exp4PhysicsLoop());
    },
    updateExp4Render() {
        const s = this.state.exp4;
        this.dom.sourceGroup4.setAttribute('transform', `translate(50, ${s.sourceGroupY})`);
        this.dom.outletHandle4.setAttribute('transform', `translate(${s.outletX}, ${s.outletY})`);
        this.dom.sourceWater4.setAttribute('y', s.cupHeight - s.sourceWaterH);
        this.dom.sourceWater4.setAttribute('height', Math.max(0, s.sourceWaterH + 10));
        this.dom.destWater4.setAttribute('y', s.cupHeight - s.destWaterH);
        this.dom.destWater4.setAttribute('height', Math.max(0, s.destWaterH + 10));
        const startX = 125, startY = s.sourceGroupY + 140; 
        const cp1X = 125, cp1Y = s.sourceGroupY - 80; 
        const endX = s.outletX, endY = s.outletY;
        const cp2Y = Math.min(endY - 100, cp1Y);
        const pathData = `M ${startX},${startY} C ${cp1X},${cp1Y} ${endX},${cp2Y} ${endX},${endY}`;
        this.dom.tubeBg4.setAttribute('d', pathData);
        this.dom.tubeWater4.setAttribute('d', pathData);
        
        const peakX = (125 + endX) / 2; const peakY = Math.min(cp1Y, cp2Y) + 20;
        this.dom.breakAirBubble.setAttribute('cx', peakX); this.dom.breakAirBubble.setAttribute('cy', peakY);
        this.dom.breakAirBubble.setAttribute('r', s.breakRadius);

        if (s.isPrimed || s.isBreaking) {
             this.dom.tubeWater4.setAttribute('stroke', 'url(#waterGradient4)');
             this.dom.tubeWater4.setAttribute('stroke-dasharray', '10,10');
        } else {
             this.dom.tubeWater4.setAttribute('stroke', 'transparent');
             this.dom.tubeWater4.removeAttribute('stroke-dasharray');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => { app.init(); });