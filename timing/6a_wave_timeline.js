// 6a_wave_timeline.js: 聲波時間軸（尺規）
// 在聲波上方顯示隨縮放、捲動連動的時間刻度；設定側邊欄「顯示時間軸」開關，預設關閉。
// 做法：自己用 canvas 畫，不使用 WaveSurfer 的 Timeline 外掛——不必再多載一支 CDN 腳本、不受外掛版本影響，
//       也不會跟句子標記（Regions）疊在同一層。刻度依目前縮放自動換成合適的間隔（0.1 秒～1 小時），
//       時間單位與句子標記相同（媒體時間），所以刻度和標記邊界是對齊的。
// 流程：6_wave_controller.js 的 initWaveSurfer() 每次重建聲波後會呼叫 toggleTimeline()，本檔重新綁定事件。
// 相依：index.html 的 #wave-timeline（放在 #waveform 上方）、#showTimelineCheck；6_wave_controller.js 之後載入。

(function () {
    const KEY = 'tagger_showTimeline';
    const container = document.getElementById('wave-timeline');
    if (!container) return;

    const HEIGHT = 22;
    const MIN_MAJOR_PX = 70; // 兩個「有數字的刻度」至少相隔幾像素
    // [主刻度間隔（秒）, 主刻度之間切成幾格小刻度]
    const STEPS = [
        [0.01, 5], [0.02, 4], [0.05, 5], [0.1, 5], [0.2, 4], [0.5, 5],
        [1, 5], [2, 4], [5, 5], [10, 5], [15, 3], [30, 6],
        [60, 6], [120, 4], [300, 5], [600, 5], [900, 3], [1800, 6], [3600, 6], [7200, 4]
    ];

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    container.style.height = HEIGHT + 'px';
    container.appendChild(canvas);

    let enabled = false;
    let unsubs = [];
    let rafId = 0;

    // 秒 → 刻度文字：m:ss；超過 1 小時為 h:mm:ss；間隔小於 1 秒時帶小數
    function fmt(t, step) {
        const dec = step >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(step) - 1e-9));
        const p = Math.pow(10, dec);
        const total = Math.round(t * p) / p;
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total - h * 3600 - m * 60;
        const sStr = dec ? s.toFixed(dec).padStart(3 + dec, '0') : String(Math.floor(s + 1e-9)).padStart(2, '0');
        return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sStr}` : `${m}:${sStr}`;
    }

    // 目前聲波的捲動容器與每秒像素數
    function getView() {
        const ws = (typeof wavesurfer !== 'undefined') ? wavesurfer : null;
        if (!ws || !ws.getWrapper) return null;
        const dur = ws.getDuration();
        const wrapper = ws.getWrapper();
        const sc = wrapper && wrapper.parentElement;
        if (!dur || !isFinite(dur) || !sc || !sc.scrollWidth) return null;
        return { dur, scrollLeft: sc.scrollLeft, pps: sc.scrollWidth / dur };
    }

    function draw() {
        rafId = 0;
        const v = enabled ? getView() : null;
        container.style.display = v ? 'block' : 'none'; // 還沒有聲波（或剛重建、尚未解碼）時整條隱藏
        if (!v) return;

        const dpr = window.devicePixelRatio || 1;
        const w = container.clientWidth;
        if (!w) return;
        const pw = Math.round(w * dpr), ph = Math.round(HEIGHT * dpr);
        if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }

        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, HEIGHT);

        const { dur, scrollLeft, pps } = v;
        let step = STEPS[STEPS.length - 1];
        for (const s of STEPS) { if (s[0] * pps >= MIN_MAJOR_PX) { step = s; break; } }
        const major = step[0], div = step[1], minor = major / div;
        const drawMinor = minor * pps >= 4;

        const k0 = Math.floor((scrollLeft / pps) / minor);
        const k1 = Math.ceil(((scrollLeft + w) / pps) / minor);

        ctx.lineWidth = 1;
        ctx.font = '11px sans-serif';
        ctx.textBaseline = 'top';
        for (let k = k0; k <= k1; k++) {
            const t = k * minor;
            if (t < 0 || t > dur + 1e-9) continue;
            const isMajor = k % div === 0;
            if (!isMajor && !drawMinor) continue;
            const x = Math.round(t * pps - scrollLeft) + 0.5;
            ctx.strokeStyle = isMajor ? '#78909C' : '#B0BEC5';
            ctx.beginPath();
            ctx.moveTo(x, HEIGHT);
            ctx.lineTo(x, HEIGHT - (isMajor ? 9 : 5));
            ctx.stroke();
            if (isMajor) {
                ctx.fillStyle = '#546E7A';
                ctx.fillText(fmt(t, major), x + 3, 2);
            }
        }
    }

    function schedule() {
        if (!rafId) rafId = requestAnimationFrame(draw);
    }

    function unbind() {
        unsubs.forEach(off => { try { off(); } catch (e) { /* 聲波已被摧毀 */ } });
        unsubs = [];
    }

    function bind() {
        unbind();
        const ws = (typeof wavesurfer !== 'undefined') ? wavesurfer : null;
        if (!ws) return;
        ['scroll', 'zoom', 'redraw', 'decode', 'ready'].forEach(ev => {
            const off = ws.on(ev, schedule);
            if (typeof off === 'function') unsubs.push(off);
        });
    }

    // 開關時間軸；聲波每次重建後也會由 initWaveSurfer() 呼叫，用來重新綁定事件
    window.toggleTimeline = function (on) {
        enabled = !!on;
        if (enabled) bind(); else unbind();
        schedule();
    };

    window.addEventListener('resize', schedule);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(schedule).observe(container);

    // 設定側邊欄的開關
    const check = document.getElementById('showTimelineCheck');
    const saved = localStorage.getItem(KEY) === 'true';
    if (check) {
        check.checked = saved;
        check.addEventListener('change', () => {
            localStorage.setItem(KEY, check.checked ? 'true' : 'false');
            window.toggleTimeline(check.checked);
        });
    }
    window.toggleTimeline(saved);
})();
