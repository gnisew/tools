/**
 * 實驗一：月相觀測核心邏輯 (修正重新整理 null 問題版)
 */
const exp1 = {
    state: {
        date: null,
        view: 'single', 
        predictPhase: null
    },

    get el() {
        return {
            datePicker: document.getElementById('datePicker1'),
            largeMoon: document.getElementById('largeMoon'),
            mainDate: document.getElementById('displayDate1'),
            subDate: document.getElementById('displayDateSub'),
            phaseName: document.getElementById('phaseName'),
            moonAge: document.getElementById('moonAge'),
            illumination: document.getElementById('illumination'),
            phaseDesc: document.getElementById('phaseDesc'),
            phaseView: document.getElementById('view-phase'),
            phaseSelector: document.getElementById('phaseSelector')
        };
    },

    init() {
        // 從 URL 恢復狀態
        this.state.date = router.params.get('date') || new Date().toISOString().split('T')[0];
        this.state.view = router.params.get('mode') || 'single';
        this.state.predictPhase = router.params.get('phase') || null; // 修正：讀取月相名稱
        
        if (this.el.datePicker) {
            this.el.datePicker.value = this.state.date;
            this.el.datePicker.onchange = (e) => this.updateDate(e.target.value);
        }

        // 修正：重新整理時下拉選單也要選對
        if (this.el.phaseSelector && this.state.predictPhase) {
            this.el.phaseSelector.value = this.state.predictPhase;
        }

        this.update();
    },

    // --- 日期控制 ---
    setToday() {
        const today = new Date().toISOString().split('T')[0];
        this.updateDate(today);
    },

    changeMonth(offset) {
        const d = new Date(this.state.date);
        d.setMonth(d.getMonth() + offset);
        this.updateDate(d.toISOString().split('T')[0]);
    },

    changeDay(offset) {
        const d = new Date(this.state.date);
        d.setDate(d.getDate() + offset);
        this.updateDate(d.toISOString().split('T')[0]);
    },

    updateDate(newDate) {
        this.state.date = newDate;
        if (this.el.datePicker) this.el.datePicker.value = newDate;
        this.update();
    },

    // --- 視圖切換 ---
    setView(viewName) {
        this.state.view = viewName;
        this.state.predictPhase = null; // 切換回一般模式時清空預測月相
        if (this.el.phaseSelector) this.el.phaseSelector.value = "";
        this.update();
    },

    predictPhases(phaseName) {
        if (!phaseName) {
            this.setView('single'); // 如果選回 "-- 選擇月相 --"，跳回單日
            return;
        }
        this.state.predictPhase = phaseName;
        this.state.view = 'predict';
        this.update();
    },

    // --- 核心更新函式 ---
    update() {
        // 修正：將 predictPhase 也寫入 URL，防止重新整理消失
        router.updateURL({
            date: this.state.date,
            mode: this.state.view,
            phase: this.state.predictPhase || '' 
        });

        const selectedDate = new Date(this.state.date);
        selectedDate.setHours(12, 0, 0, 0);

        // 更新導覽按鈕狀態
        document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
        const btnMap = { 'single': 'btn-view-single', 'month': 'btn-view-month', 'two-months': 'btn-view-two' };
        if (btnMap[this.state.view]) {
            document.getElementById(btnMap[this.state.view])?.classList.add('active');
        }

        const singleView = document.querySelector('.single-view-layout');
        let calGrid = document.getElementById('calendarGrid');
        let predictGrid = document.getElementById('predict-results');

        // 確保容器存在
        if (!calGrid) {
            calGrid = document.createElement('div');
            calGrid.id = 'calendarGrid';
            calGrid.className = 'calendar-grid';
            this.el.phaseView.appendChild(calGrid);
        }
        if (!predictGrid) {
            predictGrid = document.createElement('div');
            predictGrid.id = 'predict-results';
            predictGrid.className = 'predict-grid';
            this.el.phaseView.appendChild(predictGrid);
        }

        // 切換顯示隱藏
        singleView.style.display = (this.state.view === 'single') ? 'flex' : 'none';
        calGrid.style.display = (this.state.view === 'month' || this.state.view === 'two-months') ? 'grid' : 'none';
        predictGrid.style.display = (this.state.view === 'predict') ? 'grid' : 'none';

        if (this.state.view === 'single') {
            this.renderSingleView(selectedDate);
        } else if (this.state.view === 'predict') {
            this.renderPredictView(this.state.predictPhase);
        } else {
            const days = this.state.view === 'month' ? 30 : 60;
            this.renderCalendarView(selectedDate, days);
        }
    },

    renderSingleView(date) {
        const data = getMoonData(date);
        const dateStrings = this.formatDateStrings(date);

        if (this.el.largeMoon) this.el.largeMoon.innerHTML = generateMoonSVG(data.phase, 260);
        if (this.el.mainDate) this.el.mainDate.textContent = dateStrings.gregorianWithWeek;
        if (this.el.subDate) {
            this.el.subDate.style.display = 'block';
            this.el.subDate.textContent = dateStrings.lunarConcise; 
        }

        if (this.el.phaseName) this.el.phaseName.textContent = data.name;
        if (this.el.moonAge) this.el.moonAge.textContent = `${data.age.toFixed(1)} 天`;
        if (this.el.illumination) this.el.illumination.textContent = `${data.illumination}%`;
        if (this.el.phaseDesc) this.el.phaseDesc.textContent = data.desc;
    },

    renderCalendarView(startDate, daysCount) {
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        for (let i = 0; i < daysCount; i++) {
            const loopDate = new Date(startDate);
            loopDate.setDate(startDate.getDate() + i);
            const data = getMoonData(loopDate);
            const dateStrings = this.formatDateStrings(loopDate);
            const isToday = loopDate.toDateString() === new Date().toDateString();

            const cell = document.createElement('div');
            cell.className = `cal-day ${isToday ? 'is-today' : ''}`;
            cell.innerHTML = `
                <div class="cal-gregorian">${loopDate.getMonth()+1}/${loopDate.getDate()} <span class="cal-weekday">${dateStrings.weekdayShort}</span></div>
                <div class="cal-moon">${generateMoonSVG(data.phase, 45)}</div>
                <div class="cal-lunar">${dateStrings.lunarConcise}</div>
            `;
            cell.onclick = () => {
                this.state.date = loopDate.toISOString().split('T')[0];
                this.setView('single');
            };
            grid.appendChild(cell);
        }
    },

    renderPredictView(targetPhase) {
        const grid = document.getElementById('predict-results');
        
        // 如果沒有 targetPhase (例如剛重新整理尚未載入參數)，顯示提示文字
        if (!targetPhase) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">正在載入預測資料...</p>`;
            return;
        }

        grid.innerHTML = `<h3 style="grid-column: 1/-1; color: var(--accent-color); text-align: center; margin-bottom: 15px;">未來 12 次 ${targetPhase} 發生日期</h3>`;

        let count = 0;
        let checkDate = new Date(this.state.date);
        let lastMatchDateString = "";

        for (let safety = 0; safety < 500 && count < 12; safety++) {
            checkDate.setDate(checkDate.getDate() + 1);
            const data = getMoonData(checkDate);
            const dateStr = checkDate.toDateString();

            if (data.name === targetPhase && dateStr !== lastMatchDateString) {
                const dateStrings = this.formatDateStrings(checkDate);
                const cell = document.createElement('div');
                cell.className = 'cal-day';
                cell.style.minHeight = '100px';
                cell.innerHTML = `
                    <div class="cal-gregorian">${checkDate.getFullYear()}/${checkDate.getMonth()+1}/${checkDate.getDate()}</div>
                    <div class="cal-moon">${generateMoonSVG(data.phase, 45)}</div>
                    <div class="cal-lunar">${dateStrings.lunarConcise}</div>
                `;
                cell.onclick = () => {
                    this.state.date = checkDate.toISOString().split('T')[0];
                    this.setView('single');
                };
                grid.appendChild(cell);
                lastMatchDateString = dateStr;
                count++;
                checkDate.setDate(checkDate.getDate() + 20); // 跳過接近的天數
            }
        }
    },

    formatDateStrings(date) {
        const weekday = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' }).format(date);
        const gregorianWithWeek = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} (${weekday})`;
        const lunarFormatter = new Intl.DateTimeFormat('zh-TW-u-ca-chinese', { month: 'numeric', day: 'numeric' });
        const parts = lunarFormatter.formatToParts(date);
        let lunarMonth = "", lunarDay = "";
        parts.forEach(p => {
            if (p.type === 'month') lunarMonth = p.value;
            if (p.type === 'day') lunarDay = p.value;
        });
        const chineseMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
        if (!isNaN(parseInt(lunarMonth))) lunarMonth = chineseMonths[parseInt(lunarMonth) - 1];
        lunarMonth = lunarMonth.replace('月', '');

        return {
            gregorianWithWeek,
            lunarConcise: `農曆 ${lunarMonth}月${lunarDay}`,
            weekdayShort: weekday
        };
    }
};