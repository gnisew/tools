/* =====================================================================
   touchScroll.js — 手機版「好拖曳」捲動條（表格模式／文字模式）
   ---------------------------------------------------------------------
   問題：列數、欄數很多時，原生捲動條的滑塊會縮得很小、很細，手指幾乎抓不到。
   做法：在手機／觸控裝置上，隱藏原生捲動條，改畫一組自製捲動條：
     1. 滑塊有最小長度（48px），不會因為內容很長就縮成一條線
     2. 觸控感應區加寬（約 36px），視覺上仍是細條，手指容易抓
     3. 拖曳時顯示氣泡（表格：第 N 列／欄；文字：第 N 行），方便定位
     4. 不影響原本的手指滑動、慣性捲動與其他程式（只讀寫 scrollTop / scrollLeft）
   桌機（滑鼠）完全不啟用，沿用原生捲動條。
   ===================================================================== */
(function () {
    'use strict';

    var MQ = '(pointer: coarse), (max-width: 768px)';
    var MIN_THUMB = 48;      // 滑塊最短長度 (px)
    var HIT = 36;            // 觸控感應區寬度 (px)
    var VIS = 6;             // 平常可見寬度 (px)
    var VIS_ACTIVE = 10;     // 拖曳中可見寬度 (px)
    var EDGE = 4;            // 距離邊緣 (px)

    var mql = window.matchMedia ? window.matchMedia(MQ) : { matches: false, addEventListener: function () {} };

    /* ---------- 樣式 ---------- */
    var css = [
        '.ts-bar{position:fixed;z-index:40;display:none;pointer-events:none;touch-action:none;}',
        '.ts-bar.ts-show{display:block;}',
        '.ts-thumb{position:absolute;pointer-events:auto;touch-action:none;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;}',
        '.ts-thumb::after{content:"";position:absolute;background:#94a3b8;border-radius:999px;opacity:.55;transition:opacity .15s,width .15s,height .15s;}',
        '.ts-v .ts-thumb{width:' + HIT + 'px;right:0;}',
        '.ts-v .ts-thumb::after{width:' + VIS + 'px;top:0;bottom:0;right:' + EDGE + 'px;}',
        '.ts-h .ts-thumb{height:' + HIT + 'px;bottom:0;}',
        '.ts-h .ts-thumb::after{height:' + VIS + 'px;left:0;right:0;bottom:' + EDGE + 'px;}',
        '.ts-thumb.ts-drag::after{opacity:.95;background:#3b82f6;}',
        '.ts-v .ts-thumb.ts-drag::after{width:' + VIS_ACTIVE + 'px;}',
        '.ts-h .ts-thumb.ts-drag::after{height:' + VIS_ACTIVE + 'px;}',
        '.ts-tip{position:fixed;z-index:41;display:none;pointer-events:none;background:rgba(30,41,59,.92);color:#fff;',
        'font-size:13px;line-height:1;padding:7px 10px;border-radius:8px;white-space:nowrap;}',
        '.ts-tip.ts-show{display:block;}',
        '@media (pointer: coarse), (max-width: 768px){',
        '  #tableModeContainer.ts-hide-native,textarea#editor.ts-hide-native{scrollbar-width:none;}',
        '  #tableModeContainer.ts-hide-native::-webkit-scrollbar,textarea#editor.ts-hide-native::-webkit-scrollbar{display:none;width:0;height:0;}',
        '}'
    ].join('\n');
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    /* ---------- 建立一組捲動條 ---------- */
    function attach(scroller, opts) {
        if (!scroller) return;
        opts = opts || {};
        scroller.classList.add('ts-hide-native');

        var tip = document.createElement('div');
        tip.className = 'ts-tip';
        document.body.appendChild(tip);

        function makeBar(axis) {
            var bar = document.createElement('div');
            bar.className = 'ts-bar ts-' + axis;
            var thumb = document.createElement('div');
            thumb.className = 'ts-thumb';
            bar.appendChild(thumb);
            document.body.appendChild(bar);
            return { axis: axis, bar: bar, thumb: thumb, track: 0, len: 0, pos: 0, can: false };
        }
        var V = makeBar('v');
        var H = makeBar('h');
        var dragging = null;
        var raf = 0;

        function metrics(b) {
            var isV = b.axis === 'v';
            var client = isV ? scroller.clientHeight : scroller.clientWidth;
            var size = isV ? scroller.scrollHeight : scroller.scrollWidth;
            return { client: client, size: size, range: size - client };
        }

        function layout() {
            raf = 0;
            if (!mql.matches) { V.bar.classList.remove('ts-show'); H.bar.classList.remove('ts-show'); return; }
            var r = scroller.getBoundingClientRect();
            var visible = r.width > 0 && r.height > 0 && getComputedStyle(scroller).visibility !== 'hidden';
            var mv = metrics(V), mh = metrics(H);
            var canV = visible && mv.range > 2;
            var canH = visible && mh.range > 2;
            V.can = canV; H.can = canH;

            var topInset = typeof opts.topInset === 'function' ? (opts.topInset() || 0) : 0;
            var leftInset = typeof opts.leftInset === 'function' ? (opts.leftInset() || 0) : 0;

            // 垂直
            if (canV) {
                var vTop = r.top + topInset;
                var vH = r.height - topInset - (canH ? HIT * 0.5 : 0);
                if (vH < MIN_THUMB + 8) vH = MIN_THUMB + 8;
                V.bar.style.left = (r.right - HIT) + 'px';
                V.bar.style.top = vTop + 'px';
                V.bar.style.width = HIT + 'px';
                V.bar.style.height = vH + 'px';
                V.track = vH;
                V.len = Math.max(MIN_THUMB, vH * mv.client / mv.size);
                if (V.len > vH) V.len = vH;
                var vRatio = mv.range > 0 ? scroller.scrollTop / mv.range : 0;
                vRatio = Math.max(0, Math.min(1, vRatio));
                V.pos = (vH - V.len) * vRatio;
                V.thumb.style.height = V.len + 'px';
                V.thumb.style.top = V.pos + 'px';
            }
            V.bar.classList.toggle('ts-show', canV);

            // 水平
            if (canH) {
                var hLeft = r.left + leftInset;
                var hW = r.width - leftInset - (canV ? HIT * 0.5 : 0);
                if (hW < MIN_THUMB + 8) hW = MIN_THUMB + 8;
                H.bar.style.left = hLeft + 'px';
                H.bar.style.top = (r.bottom - HIT) + 'px';
                H.bar.style.width = hW + 'px';
                H.bar.style.height = HIT + 'px';
                H.track = hW;
                H.len = Math.max(MIN_THUMB, hW * mh.client / mh.size);
                if (H.len > hW) H.len = hW;
                var hRatio = mh.range > 0 ? scroller.scrollLeft / mh.range : 0;
                hRatio = Math.max(0, Math.min(1, hRatio));
                H.pos = (hW - H.len) * hRatio;
                H.thumb.style.width = H.len + 'px';
                H.thumb.style.left = H.pos + 'px';
            }
            H.bar.classList.toggle('ts-show', canH);

            if (dragging) showTip(dragging);
        }
        function schedule() { if (!raf) raf = requestAnimationFrame(layout); }

        /* ---------- 氣泡 ---------- */
        function showTip(b) {
            if (!opts.label) { tip.classList.remove('ts-show'); return; }
            var m = metrics(b);
            var ratio = m.range > 0 ? (b.axis === 'v' ? scroller.scrollTop : scroller.scrollLeft) / m.range : 0;
            var text = opts.label(b.axis, Math.max(0, Math.min(1, ratio)));
            if (!text) { tip.classList.remove('ts-show'); return; }
            tip.textContent = text;
            tip.classList.add('ts-show');
            var br = b.bar.getBoundingClientRect();
            if (b.axis === 'v') {
                tip.style.left = Math.max(8, br.left - tip.offsetWidth - 6) + 'px';
                tip.style.top = Math.max(8, br.top + b.pos + b.len / 2 - tip.offsetHeight / 2) + 'px';
            } else {
                tip.style.left = Math.max(8, Math.min(window.innerWidth - tip.offsetWidth - 8, br.left + b.pos + b.len / 2 - tip.offsetWidth / 2)) + 'px';
                tip.style.top = Math.max(8, br.top - tip.offsetHeight - 6) + 'px';
            }
        }

        /* ---------- 拖曳 ---------- */
        function bindDrag(b) {
            var startPt = 0, startScroll = 0, pid = null;
            b.thumb.addEventListener('pointerdown', function (e) {
                e.preventDefault();
                e.stopPropagation();
                pid = e.pointerId;
                try { b.thumb.setPointerCapture(pid); } catch (_) {}
                startPt = b.axis === 'v' ? e.clientY : e.clientX;
                startScroll = b.axis === 'v' ? scroller.scrollTop : scroller.scrollLeft;
                dragging = b;
                b.thumb.classList.add('ts-drag');
                showTip(b);
            });
            b.thumb.addEventListener('pointermove', function (e) {
                if (dragging !== b || e.pointerId !== pid) return;
                e.preventDefault();
                var m = metrics(b);
                var travel = b.track - b.len;
                if (travel <= 0 || m.range <= 0) return;
                var cur = b.axis === 'v' ? e.clientY : e.clientX;
                var target = startScroll + (cur - startPt) / travel * m.range;
                target = Math.max(0, Math.min(m.range, target));
                if (b.axis === 'v') scroller.scrollTop = target; else scroller.scrollLeft = target;
                layout();
            });
            function end(e) {
                if (dragging !== b || (e && e.pointerId !== pid)) return;
                dragging = null;
                b.thumb.classList.remove('ts-drag');
                tip.classList.remove('ts-show');
                try { b.thumb.releasePointerCapture(pid); } catch (_) {}
                pid = null;
            }
            b.thumb.addEventListener('pointerup', end);
            b.thumb.addEventListener('pointercancel', end);
            b.thumb.addEventListener('lostpointercapture', end);
            // 避免長按跳出選單
            b.thumb.addEventListener('contextmenu', function (e) { e.preventDefault(); });
        }
        bindDrag(V);
        bindDrag(H);

        /* ---------- 更新時機 ---------- */
        scroller.addEventListener('scroll', schedule, { passive: true });
        scroller.addEventListener('input', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        window.addEventListener('orientationchange', schedule);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', schedule);
            window.visualViewport.addEventListener('scroll', schedule);
        }
        if (window.ResizeObserver) {
            var ro = new ResizeObserver(schedule);
            ro.observe(scroller);
            Array.prototype.forEach.call(scroller.children, function (c) { ro.observe(c); });
        }
        if (mql.addEventListener) mql.addEventListener('change', schedule);
        else if (mql.addListener) mql.addListener(schedule);

        // 保險：偶爾輪詢一次（例如分頁切換、字型載入後尺寸變化）
        setInterval(function () { if (!dragging) schedule(); }, 1000);
        schedule();
    }

    /* ---------- 套用到表格模式／文字模式 ---------- */
    function init() {
        // 表格模式
        var box = document.getElementById('tableModeContainer');
        attach(box, {
            topInset: function () {
                var th = box.querySelector('thead');
                return th ? th.getBoundingClientRect().height : 0;
            },
            leftInset: function () {
                var c = box.querySelector('th.sticky-corner');
                return c ? c.getBoundingClientRect().width : 0;
            },
            label: function (axis, ratio) {
                var tbody = box.querySelector('tbody');
                var thead = box.querySelector('thead tr');
                if (axis === 'v') {
                    var rows = tbody ? tbody.children.length : 0;
                    return rows ? '第 ' + (Math.round(ratio * (rows - 1)) + 1) + ' / ' + rows + ' 列' : '';
                }
                var cols = thead ? thead.children.length - 1 : 0;
                return cols > 0 ? '第 ' + (Math.round(ratio * (cols - 1)) + 1) + ' / ' + cols + ' 欄' : '';
            }
        });

        // 文字模式
        var ed = document.getElementById('editor');
        attach(ed, {
            label: function (axis, ratio) {
                if (axis !== 'v') return '';
                var lines = ed.value ? ed.value.split('\n').length : 1;
                return '第 ' + (Math.round(ratio * (lines - 1)) + 1) + ' / ' + lines + ' 行';
            }
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
