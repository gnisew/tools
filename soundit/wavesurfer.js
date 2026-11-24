/*!
 * wavesurfer.js 2.0.5 (Thu Jun 28 2018 18:36:40 GMT-0700 (Pacific Daylight Time))
 * https://github.com/katspaugh/wavesurfer.js
 * @license BSD-3-Clause
 */

/* 波形畫布色票：跟著 theme.js 的主題（PKPal）；沒有 theme.js 時用原本的深色 */
function pk_wpal () {
	return (window.PKPal && window.PKPal ()) || {bg:'#000', wave:'#99c2c6', off:'#505253', limit:'#fff', rulerBg:'#111', rulerFg:'#aaa'};
}

(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("WaveSurfer", [], factory);
	else if(typeof exports === 'object')
		exports["WaveSurfer"] = factory();
	else
		root["WaveSurfer"] = factory();
})(window, function() {
return   (function(modules) {

  	var installedModules = {};

  	function __webpack_require__(moduleId) {

  		if(installedModules[moduleId]) {
  			return installedModules[moduleId].exports;
  		}

  		var module = installedModules[moduleId] = {
  			i: moduleId,
  			l: false,
  			exports: {}
  		};

  		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

  		module.l = true;

  		return module.exports;
  	}

  	__webpack_require__.m = modules;

  	__webpack_require__.c = installedModules;

  	__webpack_require__.d = function(exports, name, getter) {
  		if(!__webpack_require__.o(exports, name)) {
  			Object.defineProperty(exports, name, { enumerable: true, get: getter });
  		}
  	};

  	__webpack_require__.r = function(exports) {
  		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
  			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
  		}
  		Object.defineProperty(exports, '__esModule', { value: true });
  	};

  	__webpack_require__.t = function(value, mode) {
  		if(mode & 1) value = __webpack_require__(value);
  		if(mode & 8) return value;
  		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
  		var ns = Object.create(null);
  		__webpack_require__.r(ns);
  		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
  		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
  		return ns;
  	};

  	__webpack_require__.n = function(module) {
  		var getter = module && module.__esModule ?
  			function getDefault() { return module['default']; } :
  			function getModuleExports() { return module; };
  		__webpack_require__.d(getter, 'a', getter);
  		return getter;
  	};

  	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

  	__webpack_require__.p = "";

  	return __webpack_require__(__webpack_require__.s = "./src/wavesurfer.js");
  })

  ({

  "./src/drawer.js":

  (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = __webpack_require__(  "./src/util/index.js");

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Drawer = function (_util$Observer) {
    _inherits(Drawer, _util$Observer);

    function Drawer(container, params) {
        _classCallCheck(this, Drawer);

        var _this = _possibleConstructorReturn(this, (Drawer.__proto__ || Object.getPrototypeOf(Drawer)).call(this));

        _this.container = container;

        _this.params = params;

        _this.width = 0;

        _this.height = params.height * _this.params.pixelRatio;

        _this.lastPos = 0;

        _this.wrapper = null;
        return _this;
    }

    _createClass(Drawer, [{
        key: 'style',
        value: function style(el, styles) {

            return util.style(el, styles);
        }

    }, {
        key: 'createWrapper',
        value: function createWrapper() {
            this.wrapper = this.container.appendChild(document.createElement('wave'));

            this.style(this.wrapper, {
                display: 'block',
                position: 'relative',
                userSelect: 'none',
                webkitUserSelect: 'none',
                height: this.params.height + 'px'
            });

            if (this.params.fillParent || this.params.scrollParent) {
                this.style(this.wrapper, {
                    width: '100%',
                    overflowX: this.params.hideScrollbar ? 'hidden' : 'auto',
                    overflowY: 'hidden'
                });
            }

            this.setupWrapperEvents();
        }

    }, {
        key: 'handleEvent',
        value: function handleEvent(e, noPrevent) {
            !noPrevent && e.preventDefault();

            var clientX = (e.targetTouches && e.targetTouches[0]) ? e.targetTouches[0].clientX : e.clientX;

            var bbox = this.wrapper.getBoundingClientRect();
            this._bbox = bbox;
            var nominalWidth = Math.max(1, bbox.width);

            var progress = (clientX - bbox.left) / nominalWidth;
            return Math.max(0, Math.min(1, progress || 0));
        }

    }, {
        key: 'setupWrapperEvents',
        value: function setupWrapperEvents() {
            var _this2 = this;

            this.wrapper.addEventListener('click', function (e) {

                if (_this2.params.interact) {
                    _this2.fireEvent('click', e, _this2.handleEvent(e));
                }
            });

            this.wrapper.addEventListener('touchstart', function (e) {
                if (_this2.params.interact) {
                    _this2.fireEvent('touchstart', e);
                }
            });
            this.wrapper.addEventListener('touchmove', function (e) {
                if (_this2.params.interact) {
                    _this2.fireEvent('touchmove', e);
                }
            });
            this.wrapper.addEventListener('touchend', function (e) {
                if (_this2.params.interact) {
                    _this2.fireEvent('touchend', e);
                }
            });

            this.wrapper.addEventListener('scroll', function (e) {
                return _this2.fireEvent('scroll', e);
            });
            this.wrapper.addEventListener('wheel', function (e) {
                return _this2.fireEvent('wheel', e);
            });
        }

    }, {
        key: 'drawPeaks',
        value: function drawPeaks(peaks, length, start, end, totalChannels, shift) {
            var _this3 = this;

            requestAnimationFrame(function () {
                _this3.shift = shift;

                if (!_this3.setWidth(length)) {
                    _this3.clearWave();
                }

                _this3.drawWave(peaks, 0, start, end, totalChannels);
            });
        }

    }, {
        key: 'resetScroll',
        value: function resetScroll() {
            if (this.wrapper !== null) {
                this.wrapper.scrollLeft = 0;
            }
        }

    }, {
        key: 'recenter',
        value: function recenter(percent) {
            var position = this.wrapper.scrollWidth * percent;
            this.recenterOnPosition(position, true);
        }

    }, {
        key: 'recenterOnPosition',
        value: function recenterOnPosition(position, immediate) {
            var scrollLeft = this.wrapper.scrollLeft;
            var half = ~~(this.wrapper.clientWidth / 2);
            var maxScroll = this.wrapper.scrollWidth - this.wrapper.clientWidth;
            var target = position - half;
            var offset = target - scrollLeft;

            if (maxScroll == 0) {

                return;
            }

            if (!immediate && -half <= offset && offset < half) {

                var rate = 5;
                offset = Math.max(-rate, Math.min(rate, offset));
                target = scrollLeft + offset;
            }

            target = Math.max(0, Math.min(maxScroll, target));

            if (target != scrollLeft) {
                this.wrapper.scrollLeft = target;
            }
        }

    }, {
        key: 'getScrollX',
        value: function getScrollX() {
            var pixelRatio = this.params.pixelRatio;
            var x = Math.round(this.wrapper.scrollLeft * pixelRatio);

            if (this.params.scrollParent) {
                var maxScroll = ~~(this.wrapper.scrollWidth * pixelRatio - this.getWidth());
                x = Math.min(maxScroll, Math.max(0, x));
            }

            return x;
        }

    }, {
        key: 'getWidth',
        value: function getWidth() {

            return this._width;

        }

    }, {
        key: 'setWidth',
        value: function setWidth(width) {
            if (this.width == width) {
                return false;
            }

            this.width = width;

            if (this.params.fillParent || this.params.scrollParent) {
                this.style(this.wrapper, {
                    width: ''
                });
            } else {
                this.style(this.wrapper, {
                    width: ~~(this.width / this.params.pixelRatio) + 'px'
                });
            }

            this.updateSize();
            return true;
        }

    }, {
        key: 'setHeight',
        value: function setHeight(height) {
            if (height == this.height) {
                return false;
            }
            this.height = height;

            this.style(this.wrapper, {
                height: ~~(this.height / this.params.pixelRatio) + 'px'
            });

            this.updateSize();
            return true;
        }

    }, {
        key: 'progress',
        value: function progress(_progress, left_offset, zoom_factor) {

            if (_progress == 0) {
                this.updateProgress(-1);
                return;
            }

            _progress = (_progress - left_offset) * zoom_factor;

            var minPxDelta = 1 / this.params.pixelRatio;
            var pos = Math.round(_progress * this.width) * minPxDelta;

            this.updateProgress(pos);

        }

    }, {
        key: 'destroy',
        value: function destroy() {
            this.unAll();
            if (this.wrapper) {
                if (this.wrapper.parentNode == this.container) {
                    this.container.removeChild(this.wrapper);
                }
                this.wrapper = null;
            }
        }

    }, {
        key: 'updateCursor',
        value: function updateCursor() {}

    }, {
        key: 'updateSize',
        value: function updateSize() {}

    }, {
        key: 'drawBars',
        value: function drawBars(peaks, channelIndex, start, end) {}

    }, {
        key: 'drawWave',
        value: function drawWave(peaks, channelIndex, start, end) {}

    }, {
        key: 'clearWave',
        value: function clearWave() {}

    }, {
        key: 'updateProgress',
        value: function updateProgress(position) {}
    }]);

    return Drawer;
}(util.Observer);

exports.default = Drawer;
module.exports = exports['default'];

  }),

  "./src/drawer.multicanvas.js":

  (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _drawer = __webpack_require__(  "./src/drawer.js");

var _drawer2 = _interopRequireDefault(_drawer);

var _util = __webpack_require__(  "./src/util/index.js");

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

        function formatTime( time, format ) {
            var time_s = time >> 0;
            var miliseconds = time - time_s;

            if (time_s < 10)
                time_s = '00:0' + time_s;
            else if (time_s < 60)
                time_s = '00:' + time_s;
            else
            {
                var m = time_s / 60;
                m = m >> 0;
                var s = (time_s % 60);
                time_s = ((m<10)?'0':'') + m + ':' + (s < 10 ? '0'+s : s);
            }

            if (format === 1) {
                return time_s + ':' + (miliseconds+'').substr(2, 2);

            }

            return time_s;
        }

var MultiCanvas = function (_Drawer) {
    _inherits(MultiCanvas, _Drawer);

    function MultiCanvas(container, params) {
        _classCallCheck(this, MultiCanvas);

        var _this = _possibleConstructorReturn(this, (MultiCanvas.__proto__ || Object.getPrototypeOf(MultiCanvas)).call(this, container, params));

        _this.maxCanvasWidth = params.maxCanvasWidth;

        _this.maxCanvasElementWidth = Math.round(params.maxCanvasWidth / params.pixelRatio);

        _this.hasProgressCanvas = false;

        _this.halfPixel = 0.5 / params.pixelRatio;

        _this.canvases = [];

        _this.progressWave = null;
        _this.CursorMarker = null;
        return _this;
    }

    _createClass(MultiCanvas, [{
        key: 'init',
        value: function init() {
            this.createWrapper();
            this.createElements();
        }

    }, {
        key: 'createElements',
        value: function createElements() {
            this.progressWave = this.wrapper.appendChild(this.style(document.createElement('wave'), {

            }));
            this.progressWave.id = 'pk_prgwv';

            this.addCanvas();

            this.CursorMarker = document.createElement('div');
            this.CursorMarker.className = 'pk_wave_cursor';
            this.wrapper.appendChild(this.CursorMarker);

        }

    }, {
        key: 'updateCursor',
        value: function updateCursor() {
            this.style(this.progressWave, {
                borderRightWidth: this.params.cursorWidth + 'px',
                borderRightColor: this.params.cursorColor
            });
        }

    }, {
        key: 'updateSize',
        value: function updateSize() {
            var _this2 = this;

            var totalWidth = Math.round(this.width / this.params.pixelRatio);
            var requiredCanvases = 1;

            while (this.canvases.length < requiredCanvases) {
                this.addCanvas();
            }

            while (this.canvases.length > requiredCanvases) {
                this.removeCanvas();
            }

            this.canvases.forEach(function (entry, i) {

                var canvasWidth = _this2.maxCanvasWidth + 2 * Math.ceil(_this2.params.pixelRatio / 2);

                if (i == _this2.canvases.length - 1) {
                    canvasWidth = _this2.width - _this2.maxCanvasWidth * (_this2.canvases.length - 1);
                }

                _this2.updateDimensions(entry, canvasWidth, _this2.height);
                _this2.clearWaveForEntry(entry);
            });
        }

    }, {
        key: 'addCanvas',
        value: function addCanvas() {
            var entry = {};
            var leftOffset = this.maxCanvasElementWidth * this.canvases.length;

            entry.wave = this.wrapper.appendChild(this.style(document.createElement('canvas'), {
                position: 'absolute',
                zIndex: 2,
                left: leftOffset + 'px',
                top: 0,
                bottom: 0,
                height: '100%',
                pointerEvents: 'none'
            }));
            entry.waveCtx = entry.wave.getContext('2d', {alpha:false, antialias:false});

            entry.waveCtx.font = "12px Arial lighter";

            if (this.hasProgressCanvas) {
                entry.progress = this.progressWave.appendChild(this.style(document.createElement('canvas'), {
                    position: 'absolute',
                    left: leftOffset + 'px',
                    top: 0,
                    bottom: 0,
                    height: '100%'
                }));
                entry.progressCtx = entry.progress.getContext('2d', {alpha:false, antialias:false});
            }

            this.canvases.push(entry);
        }

    }, {
        key: 'removeCanvas',
        value: function removeCanvas() {
            var lastEntry = this.canvases.pop();
            lastEntry.wave.parentElement.removeChild(lastEntry.wave);
            if (this.hasProgressCanvas) {
                lastEntry.progress.parentElement.removeChild(lastEntry.progress);
            }
        }

    }, {
        key: 'updateDimensions',
        value: function updateDimensions(entry, width, height) {
            var elementWidth = Math.round(width / this.params.pixelRatio);
            var totalWidth = Math.round(this.width / this.params.pixelRatio);

            entry.start = entry.waveCtx.canvas.offsetLeft / totalWidth || 0;
            entry.end = entry.start + elementWidth / totalWidth;

            entry.waveCtx.canvas.width = width;
            entry.waveCtx.canvas.height = height;
            this.style(entry.waveCtx.canvas, { width: elementWidth + 'px' });

            this.style(this.progressWave, { display: 'block' });

            if (this.hasProgressCanvas) {
                entry.progressCtx.canvas.width = width;
                entry.progressCtx.canvas.height = height;
                this.style(entry.progressCtx.canvas, {
                    width: elementWidth + 'px'
                });
            }
        }

    }, {
        key: 'clearWave',
        value: function clearWave() {
            var _this3 = this;

            this.canvases.forEach(function (entry) {
                return _this3.clearWaveForEntry(entry);
            });
        }

    }, {
        key: 'clearWaveForEntry',
        value: function clearWaveForEntry(entry) {

            this.shiftClear = true;

            var P = pk_wpal ();
            entry.waveCtx.fillStyle = P.bg;
            entry.waveCtx.fillRect(0, 0, entry.waveCtx.canvas.width, entry.waveCtx.canvas.height);
            entry.waveCtx.fillStyle = P.wave;

        }

    }, {
        key: 'drawBars',
        value: function drawBars(peaks, channelIndex, start, end) {
        }

    }, {
        key: 'drawWave',
        value: function drawWave(peaks, channelIndex, start, end, totalChannels) {
            var _this5 = this;

            return this.prepareDraw (peaks, channelIndex, start, end, function (_ref2) {

                var absmax = _ref2.absmax,
                    hasMinVals = _ref2.hasMinVals,
                    height = _ref2.height,
                    offsetY = _ref2.offsetY,
                    halfH = _ref2.halfH,
                    peaks = _ref2.peaks;

                    if (_this5.params.timeline)
                    {
                        offsetY += 20;
                        halfH -= 10;
                    }

                if (!hasMinVals) {
                    var reflectedPeaks = [];
                    var len = peaks.length;
                    var i = void 0;
                    for (i = 0; i < len; i++) {
                        reflectedPeaks[2 * i] = peaks[i];
                        reflectedPeaks[2 * i + 1] = -peaks[i];
                    }
                    peaks = reflectedPeaks;
                }

                if (start !== undefined) {
                    _this5.drawLine(_this5.params.limits, _this5.params.timeline, peaks, absmax, halfH, offsetY, start, end);
                }

                _this5.fillRect(0, halfH + offsetY - _this5.halfPixel, _this5.width, _this5.halfPixel, _this5.params.timeline ? 10 : 0);
            }, totalChannels);
        }

    }, {
        key: 'drawLine',
        value: function drawLine(lim, timeline, peaks, absmax, halfH, offsetY, start, end) {
            var _this6 = this;

            this.canvases.forEach(function (entry) {

                _this6.drawLineToContext(lim, timeline, entry, entry.waveCtx, peaks, absmax, halfH, offsetY, start, end);

            });
        }

    }, {
        key: 'drawLineToContext',
        value: function drawLineToContext (lim, timeline, entry, ctx, peaks, absmax, halfH, offsetY, start, end) {
            if (!ctx) {
                return;
            }

            var P = pk_wpal ();
            var length = peaks.length / 2;
            var scale = this.params.fillParent && this.width != length ? this.width / length : 1;

            var first = Math.round(length * entry.start);

            var last = Math.round(length * entry.end) + 1;
            if (first > end || last < start) {
                return;
            }
            var canvasStart = Math.min(first, start);
            var canvasEnd = Math.max(last, end);
            var i = void 0;
            var j = void 0;

            ctx.beginPath();

            ctx.moveTo((canvasStart - first) * scale + this.halfPixel, halfH + offsetY);

            var chan_index = 0;
            if (offsetY > 30) {
                chan_index = 1;
            }

            if (!this.params.ActiveChannels [ chan_index ])
            {
                ctx.fillStyle = P.off;
            }
            else
            {
                ctx.fillStyle = P.wave;
            }

            var temp_end = canvasEnd;
            if (peaks.length <= temp_end * 2)
            {
                temp_end = (peaks.length / 2) >> 0;
            }

            for (i = canvasStart; i < temp_end;  ++i) {
                var peak = peaks[2 * i];
                var h = Math.round (peak / absmax * halfH);

                h = Math.min (h, halfH);
                ctx.lineTo((i - first) * scale + this.halfPixel, halfH - h + offsetY);
            }

            for (j = temp_end - 1; j >= canvasStart; --j) {
                var _peak = peaks[2 * j + 1];
                var _h = Math.round (_peak / absmax * halfH);

                _h = Math.max (_h, -halfH);
                ctx.lineTo((j - first) * scale + this.halfPixel, halfH - _h + offsetY);
            }

            ctx.closePath();
            ctx.fill();

            if (lim)
            {

                ctx.fillStyle = P.limit;
                var margin = (halfH * 10) / 100 >> 0;

                var diff = (1.0 / absmax * halfH) - halfH;
                var val = (margin + offsetY) - diff;

                if (val > offsetY)
                    ctx.fillRect (0, val, this.width, 0.5);

                val = (halfH * 2 - margin + offsetY) + diff;
                if (val < (halfH * 2 + offsetY))
                    ctx.fillRect (0, val, this.width, 0.5);

                ctx.fillStyle = P.wave;
            }

            if (timeline)
            {
                ctx.fillStyle = '#fff';

                var durr = PKAudioEditor.engine.wavesurfer.VisibleDuration;
                var offs = PKAudioEditor.engine.wavesurfer.LeftProgress;
                var total = PKAudioEditor.engine.wavesurfer.getDuration();
                var zoom = PKAudioEditor.engine.wavesurfer.ZoomFactor;
                var width = PKAudioEditor.engine.wavesurfer.drawer.width;

                if (zoom >= 1)
                {
                        width *= zoom;

                        var percentage = offs / total;
                        var left_offset = (percentage * width);

                        var x = 0;
                        var pixel_distance = (width / total);

                        ctx.textAlign = 'center';

                        ctx.fillStyle = P.rulerBg;
                        ctx.fillRect(0, 0, this.width, 24);
                        ctx.fillStyle = P.rulerFg;
                        ctx.strokeStyle = P.rulerFg;

                        if (pixel_distance < 60) {
                            pixel_distance = 60;
                        }
                        else if (pixel_distance > 160)
                        {
                            pixel_distance /= ((pixel_distance / 160) >> 0) + 1;
                        }

                        var elements = width / pixel_distance;
                        var previous_time = 0;

                        for (var i = 0; i < (total*10); ++i)
                        {
                            if (x - left_offset > width - 2)
                            {
                                break;
                            }

                            if (x - left_offset >= -2 && x - left_offset < width - 2)
                            {
                                var prc = x / width;
                                var timespot = prc * total;

                                var format = 3;

                                var diff = timespot - previous_time;
                                if (diff < 1.0)
                                {
                                    format = 1;
                                }
                                else if (diff < 60)
                                {
                                    format = 2;
                                }

                                previous_time = timespot;

                                ctx.fillText( formatTime (timespot, format), x - left_offset, 12);
                            }

                            x += pixel_distance;
                        }

                        ctx.beginPath();

                        x = 0;

                        for (var i = 0; i < (total*10); ++i)
                        {
                            if (x - left_offset > width - 2)
                            {
                                break;
                            }

                            if (x - left_offset >= -2 && x - left_offset < width - 2)
                            {
                                ctx.moveTo(x - left_offset, 16);
                                ctx.lineTo(x - left_offset, 24);
                            }

                            x += pixel_distance;
                        }

                        x = pixel_distance / 2;
                        for (var i = 0; i < (total*10); ++i)
                        {
                            if (x - left_offset > width - 2)
                            {
                                break;
                            }

                            if (x - left_offset >= -2 && x - left_offset < width - 2)
                            {
                                ctx.moveTo(x - left_offset, 19);
                                ctx.lineTo(x - left_offset, 24);
                            }

                            x += pixel_distance;
                        }

                        ctx.stroke();
                    }
                }

                this.RCB && this.RCB();
                ctx.fillStyle = P.wave;

        }

    }, {
        key: 'fillRect',
        value: function fillRect(x, y, width, height, extra) {
            var startCanvas = Math.floor(x / this.maxCanvasWidth);
            var endCanvas = Math.min(Math.ceil((x + width) / this.maxCanvasWidth) + 1, this.canvases.length);
            var i = void 0;
            var once = false;
            for (i = startCanvas; i < endCanvas; i++) {
                var entry = this.canvases[i];
                var leftOffset = i * this.maxCanvasWidth;

                var intersection = {
                    x1: Math.max(x, i * this.maxCanvasWidth),
                    y1: y,
                    x2: Math.min(x + width, i * this.maxCanvasWidth + entry.waveCtx.canvas.width),
                    y2: y + height
                };

                if (intersection.x1 < intersection.x2) {
                    this.setFillStyles(entry);

                    if (!once) {
                        this.fillRectToContext(entry.waveCtx, 0, this.height / 2 + extra, this.width, 0.25);
                        once = true;
                    }

                    this.fillRectToContext(entry.waveCtx, intersection.x1 - leftOffset, intersection.y1, intersection.x2 - intersection.x1, intersection.y2 - intersection.y1);

                }
            }
        }

    }, {
        key: 'prepareDraw',
        value: function prepareDraw (peaks, channelIndex, start, end, fn, totalChannels) {
            var _this7 = this;

            return function () {

                if (peaks[0] instanceof Array || ArrayBuffer.isView(peaks[0])) {
                    var channels = peaks;
                    if (_this7.params.splitChannels) {

                        _this7.setHeight(

                        _this7.params.height * _this7.params.pixelRatio);
                        return channels.forEach(function (channelPeaks, i) {
                            return _this7.prepareDraw(channelPeaks, i, start, end, fn, totalChannels);
                        });
                    }
                    peaks = channels[0];
                }
                var absmax = _this7.params.verticalZoom;

                var hasMinVals = [].some.call(peaks, function (val) {
                    return val < 0;
                });
                var height = _this7.params.height / 2 * _this7.params.pixelRatio;
                var offsetY = height * channelIndex || 0;

                var halfH = height / 2;
                if (totalChannels === 1)
                    halfH = height;

                return fn({
                    absmax: absmax,
                    hasMinVals: hasMinVals,
                    height: height,
                    offsetY: offsetY,
                    halfH: halfH,
                    peaks: peaks
                });
            }();
        }

    }, {
        key: 'fillRectToContext',
        value: function fillRectToContext(ctx, x, y, width, height) {
            if (!ctx) {
                return;
            }
            ctx.fillRect(x, y, width, height);
        }

    }, {
        key: 'setFillStyles',
        value: function setFillStyles(entry) {
            entry.waveCtx.fillStyle = pk_wpal ().wave;
            if (this.hasProgressCanvas) {
                entry.progressCtx.fillStyle = this.params.progressColor;
            }
        }

    }, {
        key: 'updateProgress',
        value: function updateProgress(position) {

            this.progressWave.style.transform = 'translate3d(' + position + 'px,0,0)';

        }
    }]);

    return MultiCanvas;
}(_drawer2.default);

exports.default = MultiCanvas;
module.exports = exports['default'];

  }),

  "./src/util/extend.js":

  (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = extend;

function extend(dest) {
    for (var _len = arguments.length, sources = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        sources[_key - 1] = arguments[_key];
    }

    sources.forEach(function (source) {
        Object.keys(source).forEach(function (key) {
            dest[key] = source[key];
        });
    });
    return dest;
}
module.exports = exports["default"];

  }),

  "./src/util/get-id.js":

  (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = getId;

function getId() {
    return 'wavesurfer_' + Math.random().toString(32).substring(2);
}
module.exports = exports['default'];

  }),

  "./src/util/index.js":

  (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getId = __webpack_require__(  "./src/util/get-id.js");

Object.defineProperty(exports, 'getId', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_getId).default;
  }
});

var _observer = __webpack_require__(  "./src/util/observer.js");

Object.defineProperty(exports, 'Observer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_observer).default;
  }
});

var _extend = __webpack_require__(  "./src/util/extend.js");

Object.defineProperty(exports, 'extend', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_extend).default;
  }
});

var _style = __webpack_require__(  "./src/util/style.js");

Object.defineProperty(exports, 'style', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_style).default;
  }
});

var _preventClick = __webpack_require__(  "./src/util/prevent-click.js");

Object.defineProperty(exports, 'preventClick', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_preventClick).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  }),

  "./src/util/observer.js":

  (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Observer = function () {

    function Observer() {
        _classCallCheck(this, Observer);

        this.handlers = null;
    }

    _createClass(Observer, [{
        key: "on",
        value: function on(event, fn) {
            var _this = this;

            if (!this.handlers) {
                this.handlers = {};
            }

            var handlers = this.handlers[event];
            if (!handlers) {
                handlers = this.handlers[event] = [];
            }
            handlers.push(fn);

            return {
                name: event,
                callback: fn,
                un: function un(e, fn) {
                    return _this.un(e, fn);
                }
            };
        }

    }, {
        key: "un",
        value: function un(event, fn) {
            if (!this.handlers) {
                return;
            }

            var handlers = this.handlers[event];
            var i = void 0;
            if (handlers) {
                if (fn) {
                    for (i = handlers.length - 1; i >= 0; i--) {
                        if (handlers[i] == fn) {
                            handlers.splice(i, 1);
                        }
                    }
                } else {
                    handlers.length = 0;
                }
            }
        }

    }, {
        key: "unAll",
        value: function unAll() {
            this.handlers = null;
        }

    }, {
        key: "once",
        value: function once(event, handler) {
            var _this2 = this;

            var fn = function fn() {
                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                handler.apply(_this2, args);

                setTimeout(function () {
                    _this2.un(event, fn);
                }, 0);
            };
            return this.on(event, fn);
        }

    }, {
        key: "fireEvent",
        value: function fireEvent(event, a, s) {

            if (!this.handlers) {
                return;
            }
            var handlers = this.handlers[event];
            handlers && handlers.forEach(function (fn) {

                fn(a, s);
            });
        }
    }]);

    return Observer;
}();

exports.default = Observer;
module.exports = exports["default"];

  }),

  "./src/util/prevent-click.js":

  (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = preventClick;
function preventClickHandler(e) {
    e.stopPropagation();
    document.body.removeEventListener('click', preventClickHandler, true);
}

function preventClick(values) {
    document.body.addEventListener('click', preventClickHandler, true);
}
module.exports = exports['default'];

  }),

  "./src/util/style.js":

  (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = style;

function style(el, styles) {
    Object.keys(styles).forEach(function (prop) {
        if (el.style[prop] !== styles[prop]) {
            el.style[prop] = styles[prop];
        }
    });
    return el;
}
module.exports = exports["default"];

  }),

  "./src/wavesurfer.js":

  (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = __webpack_require__(  "./src/util/index.js");

var util = _interopRequireWildcard(_util);

var _drawer = __webpack_require__(  "./src/drawer.multicanvas.js");

var _drawer2 = _interopRequireDefault(_drawer);

var _webaudio = __webpack_require__(  "./src/webaudio.js");

var _webaudio2 = _interopRequireDefault(_webaudio);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * This work is licensed under a BSD-3-Clause License.
 */

var WaveSurfer = function (_util$Observer) {
    _inherits(WaveSurfer, _util$Observer);

    _createClass(WaveSurfer, null, [{
        key: 'create',

        value: function create(params) {
            var wavesurfer = new WaveSurfer(params);
            return wavesurfer.init();
        }

    }]);

    function WaveSurfer(params) {
        var _ret;

        _classCallCheck(this, WaveSurfer);

        var _this = _possibleConstructorReturn(this, (WaveSurfer.__proto__ || Object.getPrototypeOf(WaveSurfer)).call(this));

        _this.defaultParams = {
            audioContext: null,
            audioRate: 1,
            autoCenter: true,
            backend: 'WebAudio',
            container: null,
            cursorColor: '#ff8c35',
            cursorWidth: 1,
            dragSelection: true,
            fillParent: true,
            height: 128,
            hideScrollbar: false,
            interact: true,
            maxCanvasWidth: 4000,
            pixelRatio: window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI,
            plugins: [],
            progressColor: 'rgba(201,199,229,0.24)',
            renderer: _drawer2.default,
            scrollParent: false,
            splitChannels: false,
            waveColor: '#99c2c6',
            waveDisabledColor: '#505253',
            limits:1,
            timeline:1,
            verticalZoom:1
        };
        _this.backends = {
            WebAudio: _webaudio2.default
        };
        _this.util = util;
        _this.params = util.extend({}, _this.defaultParams, params);

        _this.container = 'string' == typeof params.container ? document.querySelector(_this.params.container) : _this.params.container;

        if (!_this.container) {
            throw new Error('Container element not found');
        }

        if (_this.params.maxCanvasWidth <= 1) {
            throw new Error('maxCanvasWidth must be greater than 1');
        } else if (_this.params.maxCanvasWidth % 2 == 1) {
            throw new Error('maxCanvasWidth must be an even number');
        }

        _this.savedVolume = 0;

        _this.isMuted = false;

        _this.currentAjax = null;
        _this.bid = {};

        _this.arraybuffer = null;

        _this.drawer = null;

        _this.backend = null;

        if (typeof _this.params.renderer !== 'function') {
            throw new Error('Renderer parameter is invalid');
        }

        _this.Drawer = _this.params.renderer;

        _this.Backend = _this.backends[_this.params.backend];

        _this.initialisedPluginList = {};

        _this.isDestroyed = false;

        _this.isReady = false;

        _this.ActiveMarker = 0;
        _this.FollowCursor = 1;
        _this.Interacting = 0;

        _this.ActiveChannels = [1, 1];
        _this.SelectedChannelsLen = 2;

        _this.LeftProgress = 0;

        _this.ZoomFactor = 1;

        _this.VisibleDuration = 0;

        return _ret = _this, _possibleConstructorReturn(_this, _ret);
    }

    _createClass(WaveSurfer, [{
        key: 'init',
        value: function init() {
            this.registerPlugins(this.params.plugins);
            this.createDrawer();
            this.createBackend();
            return this;
        }

    }, {
        key: 'registerPlugins',
        value: function registerPlugins(plugins) {
            var _this2 = this;

            plugins.forEach(function (plugin) {
                return _this2.addPlugin(plugin);
            });

            plugins.forEach(function (plugin) {

                if (!plugin.deferInit) {
                    _this2.initPlugin(plugin.name);
                }
            });
            this.fireEvent('plugins-registered', plugins);
            return this;
        }

    }, {
        key: 'addPlugin',
        value: function addPlugin(plugin) {
            var _this3 = this;

            if (!plugin.name) {
                throw new Error('Plugin does not have a name!');
            }
            if (!plugin.instance) {
                throw new Error('Plugin ' + plugin.name + ' does not have an instance property!');
            }

            if (plugin.staticProps) {
                Object.keys(plugin.staticProps).forEach(function (pluginStaticProp) {

                    _this3[pluginStaticProp] = plugin.staticProps[pluginStaticProp];
                });
            }

            var Instance = plugin.instance;

            var observerPrototypeKeys = Object.getOwnPropertyNames(util.Observer.prototype);
            observerPrototypeKeys.forEach(function (key) {
                Instance.prototype[key] = util.Observer.prototype[key];
            });

            this[plugin.name] = new Instance(plugin.params || {}, this);
            this.fireEvent('plugin-added', plugin.name);
            return this;
        }

    }, {
        key: 'initPlugin',
        value: function initPlugin(name) {
            if (!this[name]) {
                throw new Error('Plugin ' + name + ' has not been added yet!');
            }
            if (this.initialisedPluginList[name]) {

                this.destroyPlugin(name);
            }
            this[name].init();
            this.initialisedPluginList[name] = true;
            this.fireEvent('plugin-initialised', name);
            return this;
        }

    }, {
        key: 'destroyPlugin',
        value: function destroyPlugin(name) {
            if (!this[name]) {
                throw new Error('Plugin ' + name + ' has not been added yet and cannot be destroyed!');
            }
            if (!this.initialisedPluginList[name]) {
                throw new Error('Plugin ' + name + ' is not active and cannot be destroyed!');
            }
            if (typeof this[name].destroy !== 'function') {
                throw new Error('Plugin ' + name + ' does not have a destroy function!');
            }

            this[name].destroy();
            delete this.initialisedPluginList[name];
            this.fireEvent('plugin-destroyed', name);
            return this;
        }

    }, {
        key: 'destroyAllPlugins',
        value: function destroyAllPlugins() {
            var _this4 = this;

            Object.keys(this.initialisedPluginList).forEach(function (name) {
                return _this4.destroyPlugin(name);
            });
        }

    }, {
        key: 'createDrawer',
        value: function createDrawer() {
            var _this5 = this;

            this.params.ActiveChannels = this.ActiveChannels;
            this.drawer = new this.Drawer(this.container, this.params);
            this.drawer.init();
            this.fireEvent('drawer-created', this.drawer);

            this.drawer.on('resize', function() {

                _this5.drawer._width = Math.round(_this5.drawer.container.clientWidth * _this5.drawer.params.pixelRatio);
                _this5.drawer._bbox = _this5.drawer.wrapper.getBoundingClientRect();

            });
            this.on ('resize', function (){
                _this5.drawer.fireEvent('resize');
            });

            this.drawer.on('redraw', function () {
                _this5.drawBuffer();
                _this5.drawer.progress(_this5.backend.getPlayedPercents(), _this5.LeftProgress / _this5.getDuration(), _this5.ZoomFactor);
            });

            if ('ontouchstart' in document.documentElement)
            {
                var touch_pos = {x:0,y:0};
                var last_touch_pos = {x:0,y:0};

                this.drawer.on('touchstart', function (e) {
                    if (e.touches && e.touches.length === 1)
                    {
                        touch_pos = {
                            x: e.touches[0].pageX,
                            y: e.touches[0].pageY
                        };
                    }
                });
                this.drawer.on('touchmove', function (e) {
                    if (e.touches && e.touches.length === 1)
                    {
                        last_touch_pos = {
                            x: e.touches[0].pageX,
                            y: e.touches[0].pageY
                        };
                    }
                });
                this.drawer.on('touchend', function (e) {
                    if (touch_pos.x !== 0 && touch_pos.y !== 0)
                    {
                        if ( (last_touch_pos.x === 0 && last_touch_pos.y === 0)
                             || (Math.abs (last_touch_pos.x - touch_pos.x) < 20 &&  Math.abs (last_touch_pos.y - touch_pos.y) < 20) )
                        {
                            setTimeout(function () {
                                var bbox = _this5.drawer.wrapper.getBoundingClientRect();
                                _this5.drawer._bbox = bbox;
                                var nominalWidth = Math.max(1, bbox.width);

                                var progress = 0;
                                var xx = touch_pos.x - (window.pageXOffset || document.documentElement.scrollLeft);

                                progress = (xx - bbox.left) / nominalWidth;
                                progress = Math.max(0, Math.min(1, progress || 0));

                                var new_progress = (progress * _this5.VisibleDuration + _this5.LeftProgress) / _this5.getDuration();

                                if (new_progress >= 0 && new_progress <= 1)
                                    _this5.seekTo (new_progress);

                                touch_pos = {x:0,y:0};
                                last_touch_pos = {x:0,y:0};

                                _this5.regions && _this5.regions.clear();
                            }, 24);
                        }
                        else
                        {
                            touch_pos = {x:0,y:0};
                            last_touch_pos = {x:0,y:0};
                        }
                    }
                });
            }

            this.drawer.on('click', function (e, progress) {
                var stamp = e.timeStamp;

                setTimeout(function () {
                    var new_progress = (progress * _this5.VisibleDuration + _this5.LeftProgress) / _this5.getDuration();
                    if (new_progress >= 0 && new_progress <= 1)
                        _this5.seekTo (new_progress, stamp);
                }, 36);
            });

            this.ResetZoom = function () {
                _this5.ZoomFactor = 1;
                _this5.LeftProgress = 0;
                _this5.params.verticalZoom = 1;

                _this5.ForceDraw ();
                _this5.fireEvent ('DidZoom');
            };

            this.SetZoomVertical = function ( val, event ) {

                var prev_v_zoom = _this5.params.verticalZoom;

                if (_this5.params.verticalZoom < 0.1)
                {
                    _this5.params.verticalZoom += val / 24;
                }
                else if (_this5.params.verticalZoom < 0.3)
                {
                    _this5.params.verticalZoom += val / 20;
                }
                else if (_this5.params.verticalZoom < 0.5)
                {
                    _this5.params.verticalZoom += val / 16;
                }
                else if (_this5.params.verticalZoom < 0.8)
                {
                    _this5.params.verticalZoom += val / 12;
                }
                else if (_this5.params.verticalZoom < 1.0)
                {
                    _this5.params.verticalZoom += val / 8;
                }
                else
                {
                    _this5.params.verticalZoom += val / 4;
                }

                if (_this5.params.verticalZoom <= 0.1)
                    _this5.params.verticalZoom = 0.1;

                if (prev_v_zoom < 1 && _this5.params.verticalZoom > 1)
                {
                    _this5.params.verticalZoom = 1;
                }
                else if (prev_v_zoom > 1 && _this5.params.verticalZoom < 1)
                {
                    _this5.params.verticalZoom = 1;
                }

                _this5.ForceDraw ();
                _this5.fireEvent ('DidZoom', event);
            };
            this.SetZoom = function ( where, step, event, is_redo ) {
                var redo = false;
                var width = _this5.drawer.width;
                var duration = _this5.VisibleDuration;

                var last_ = width * (_this5.ZoomFactor - (step/Math.abs(step))) >> 0;
                var sampleSize_ = _this5.backend.buffer.length / last_;
                if (sampleSize_ < 1.0) {
                    return ;
                }

                if (!where) where = 0.5;

                if (step < 0) {

                    if (_this5.ZoomFactor != _this5.ZoomFactor >> 0) {
                        _this5.ZoomFactor = (_this5.ZoomFactor >> 0) + 1;
                    } else {
                        if (_this5.ZoomFactor > 6) _this5.ZoomFactor += 1;else _this5.ZoomFactor += 1;
                    }

                    _this5.LeftProgress = _this5.LeftProgress + where * (duration / _this5.ZoomFactor);
                } else if (_this5.ZoomFactor > 1) {
                    if (_this5.ZoomFactor != _this5.ZoomFactor >> 0) {
                        _this5.ZoomFactor = _this5.ZoomFactor >> 0;
                    } else {
                        if (_this5.ZoomFactor > 6) {
                            if (!is_redo) redo = true;

                            _this5.ZoomFactor -= 1;

                        } else _this5.ZoomFactor -= 1;
                    }
                    if (_this5.ZoomFactor === 1) _this5.LeftProgress = 0;else _this5.LeftProgress = _this5.LeftProgress - where * (duration / _this5.ZoomFactor);
                }

                _this5.ForceDraw ();
                _this5.fireEvent ('DidZoom', event);

                if (redo)
                {
                    this.SetZoom ( where, step, event, true );
                }
            };

            var throttle_wheel = 0;
            this.drawer.on('wheel', function (e) {
                e.preventDefault();
                e.stopPropagation();

                if (!_this5.isReady || e.deltaY == 0) return;

                var perf = e.timeStamp;
                if (perf - throttle_wheel < 46) {
                    return;
                }

                throttle_wheel = perf;
                var width = _this5.drawer.width;

                var rect = _this5.drawer._bbox;
                var where = (e.clientX - rect.left) / width;

                _this5.SetZoom ( where, e.deltaY, e );
            });

            this.drawer.on('scroll', function (e) {
                _this5.fireEvent('scroll', e);
            });
        }
    }, {
        key: 'ZoomifyValue',
        value: function ZoomifyValue(progress) {
            return (progress * this.VisibleDuration + this.LeftProgress) / this.getDuration();
        }
    }, {
        key: 'UnZoomifyValue',
        value: function UnZoomifyValue(progress) {
            return (progress - this.LeftProgress) * this.ZoomFactor;
        }
    }, {
        key: 'UnzoomifyPixelValue',
        value: function UnzoomifyPixelValue(progress) {
            return (progress - this.LeftProgress / this.getDuration() * this.drawer.width) * this.ZoomFactor;
        }
    }, {
        key: 'DrawTemp',
        value: function DrawTemp ( _offset, _arrays ) {
            this.backend.extraPeaks = _arrays;
            this.backend.extraOffset = _offset;

            this.drawBuffer(1);
            var percent = this.backend.getPlayedPercents();
            var dur = this.getDuration();
            var left_offset = this.LeftProgress / dur;

            var ppp = (this.ActiveMarker - left_offset) * this.ZoomFactor;
            var minPxDelta = 1 / this.drawer.params.pixelRatio;
            var pos = Math.round(ppp * this.drawer.width) * minPxDelta;

                this.drawer.CursorMarker.style.transform = 'translate(' + pos + 'px,0)';

            this.drawer.progress(percent, left_offset, this.ZoomFactor);
        }
    },

     {
        key: 'ForceDraw',
        value: function ForceDraw() {

            this.drawBuffer();
            var percent = this.backend.getPlayedPercents();
            var dur = this.getDuration();
            var left_offset = this.LeftProgress / dur;

            var ppp = (this.ActiveMarker - left_offset) * this.ZoomFactor;
            var minPxDelta = 1 / this.drawer.params.pixelRatio;
            var pos = Math.round(ppp * this.drawer.width) * minPxDelta;

                this.drawer.CursorMarker.style.transform = 'translate(' + pos + 'px,0)';

            this.drawer.progress(percent, left_offset, this.ZoomFactor);
        }

    }, {
        key: 'getWaveEl',
        value: function getWaveEl() {
            return (this.drawer.canvases[0].wave);
        }
    }, {
        key: 'createBackend',
        value: function createBackend() {
            var _this6 = this;

            if (this.backend) {
                this.backend.destroy();
            }

            this.backend = new this.Backend(this.params);
            this.backend.init();
            this.fireEvent('backend-created', this.backend);

            this.backend.on('finish', function () {
                return _this6.fireEvent('finish');
            });
            this.backend.on('play', function () {
                return _this6.fireEvent('play');
            });
            this.backend.on('pause', function ( e ) {
                if (e === 'end')
                {
                    _this6.stop ();
                }

                return _this6.fireEvent('pause');
            });

            var q = this;
            this.CursorCenter = function () {
                var durr = q.getDuration();
                var percentage = q.backend.getPlayedPercents();
                var maxScroll = q.drawer.width * q.ZoomFactor;
                var half = ~~(q.drawer.width / 2);
                var real = percentage * maxScroll;
                var target = real - half;
                var left_middle = q.LeftProgress / durr * maxScroll + half >> 0;

                if (left_middle + half > real && left_middle + half < maxScroll) {
                    var cursor = (percentage - q.LeftProgress / durr) * q.ZoomFactor * 100 >> 0;
                    if (cursor > 50) {
                        var x = target - left_middle + half;
                        target -= Math.max(0, x - 4 * q.ZoomFactor / 2);
                    } else target = Math.max(0, Math.min(maxScroll - half * 2, target));
                } else target = Math.max(0, Math.min(maxScroll - half * 2, target));

                var t = target / maxScroll;
                q.LeftProgress = t * durr;
                q.fireEvent ('cursorcenter', t);

                if (!document.hidden) q.ForceDraw();
            };

            var db = 0;
            var timing_gap = 50;
            q.backend.on('audioprocess', function (time, stamp) {
                var percentage = q.backend.getPlayedPercents();

                if (q.ZoomFactor > 1 && q.FollowCursor && !q.Interacting)
                {
                    var new_db = stamp;
                    if (new_db - db > timing_gap)
                    {
                        db = new_db;

                        var durr = q.getDuration();
                        var maxScroll = q.drawer.width * q.ZoomFactor;
                        var half = ~~(q.drawer.width / 2);
                        var real = percentage * maxScroll;
                        var target = real - half;
                        var left_middle = q.LeftProgress / durr * maxScroll + half >> 0;

                        if (left_middle <= real && real <= left_middle + half)
                        {
                            if (left_middle + half > real && left_middle + half < maxScroll) {
                                var cursor = (percentage - q.LeftProgress / durr) * q.ZoomFactor * 100 >> 0;

                                if (cursor > 99)
                                {
                                    var x = target - left_middle + half;
                                    target -= Math.max(0, x - 4 * q.ZoomFactor / 2);
                                } else target = Math.max(0, Math.min(maxScroll - half * 2, target));
                            } else target = Math.max(0, Math.min(maxScroll - half * 2, target));

                            var t = target / maxScroll;
                            q.LeftProgress = t * durr;
                            q.fireEvent('cursorcenter', t);

                            if (!document.hidden) q.ForceDraw();
                        }
                        else
                        {
                            q.drawer.progress(percentage, q.LeftProgress / q.getDuration(), q.ZoomFactor);
                        }
                    }

                }
                else
                {
                    q.drawer.progress(percentage, q.LeftProgress / q.getDuration(), q.ZoomFactor);
                }

                q.fireEvent ('audioprocess', time, stamp);
            });
        }

    }, {
        key: 'getDuration',
        value: function getDuration() {
            return this.backend.getDuration();
        }

    }, {
        key: 'getCurrentTime',
        value: function getCurrentTime() {
            return this.backend.getCurrentTime();
        }

    }, {
        key: 'setCurrentTime',
        value: function setCurrentTime(seconds) {
            if (seconds >= this.getDuration()) {
                this.seekTo(1);
            } else {
                this.seekTo(seconds / this.getDuration());
            }
        }

    }, {
        key: 'play',
        value: function play(start, end) {
            var _this7 = this;

            this.fireEvent('interaction', function () {
                return _this7.play(start, end);
            });
            return this.backend.play(start, end);
        }

    }, {
        key: 'pause',
        value: function pause() {
            if (!this.backend.isPaused()) {
                return this.backend.pause();
            }
        }

    }, {
        key: 'playPause',
        value: function playPause() {
            return this.backend.isPaused() ? this.play() : this.pause();
        }

    }, {
        key: 'isPlaying',
        value: function isPlaying() {
            return !this.backend.isPaused();
        }

    }, {
        key: 'skipBackward',
        value: function skipBackward(seconds) {
            this.skip(-seconds || -2);
        }

    }, {
        key: 'skipForward',
        value: function skipForward(seconds) {
            this.skip(seconds || 2);
        }

    }, {
        key: 'skip',
        value: function skip(offset) {
            var duration = this.getDuration() || 1;
            var position = this.getCurrentTime() || 0;
            position = Math.max(0, Math.min(duration, position + (offset || 0)));
            this.seekAndCenter(position / duration);
        }

    }, {
        key: 'seekAndCenter',
        value: function seekAndCenter(progress) {
            this.seekTo(progress);
            /* [修改] 原本呼叫 drawer.recenter（捲動原生 scrollLeft，現在的畫法已不用，zoom 後完全沒效果）→ 改用 CursorCenter 把波形移到游標位置 */
            if (this.CursorCenter && this.ZoomFactor > 1) this.CursorCenter();
        }

    }, {
        key: 'seekTo',
        value: function seekTo(progress, stamp) {
            var _this8 = this;

            if (typeof progress !== 'number' || !isFinite(progress) || progress < 0 || progress > 1) {
                progress = 0;

            }
            this.ActiveMarker = progress;

            this.fireEvent('interaction', function () {
                return _this8.seekTo(progress);
            });

            var paused = this.backend.isPaused();

            if (!paused) {
                this.backend.pause();
            }

            var duration = this.getDuration();
            var out_of_view = false;	/* [新增] 目標位置在目前畫面外（|<、>|、跳轉…）→ 放大時畫面要跟過去 */
            if (this.VisibleDuration / duration + this.LeftProgress / duration > progress && progress > this.LeftProgress / duration) {
                var left_offset = this.LeftProgress / duration;

                var ppp = (progress - left_offset) * this.ZoomFactor;
                var minPxDelta = 1 / this.drawer.params.pixelRatio;
                var pos = Math.round(ppp * this.drawer.width) * minPxDelta;
                this.drawer.CursorMarker.style.transform = 'translate(' + pos + 'px,0)';

                this.drawer.progress(progress, left_offset, this.ZoomFactor);
            } else {
                out_of_view = true;

                var left_offset = this.LeftProgress / duration;
                var rend_progress = (progress - left_offset) * (duration / this.VisibleDuration);

                if (rend_progress == 0)
                {
                    this.drawer.CursorMarker.style.transform = 'translate(1px,0)';

                }
                else
                {
                    var ppp = (progress - left_offset) * this.ZoomFactor;
                    var minPxDelta = 1 / this.drawer.params.pixelRatio;
                    var pos = Math.round(ppp * this.drawer.width) * minPxDelta;
                    this.drawer.CursorMarker.style.transform = 'translate(' + pos + 'px,0)';

                }

                this.drawer.progress(0);
            }

            this.backend.seekTo(progress * this.getDuration());

            /* [新增] 要在 backend.seekTo 之後才呼叫：CursorCenter 是讀 backend 目前的播放位置 */
            if (out_of_view && this.ZoomFactor > 1 && this.CursorCenter) this.CursorCenter();

            if (!paused) {
                this.backend.play();
            }

            this.fireEvent('seek', progress, stamp);
        }

    }, {
        key: 'stop',
        value: function stop() {
            this.pause();
            this.seekTo(this.ActiveMarker, window.performance.now() + 100);

            this.drawer.progress(this.ActiveMarker, this.LeftProgress / this.getDuration(), this.ZoomFactor);
        }

    }, {
        key: 'getLoudness',
        value: function getLoudness() {
            return this.backend.getLoudness();
        }

    }, {
        key: 'setHeight',
        value: function setHeight(height) {
            this.params.height = height;

            this.drawer.setHeight(height * this.params.pixelRatio);
            if (this.isReady) {
                this.drawBuffer();
            }
        }

    }, {
        key: 'drawBuffer',
        value: function drawBuffer(force) {

            if (this.ZoomFactor === 1) this.VisibleDuration = this.getDuration();else this.VisibleDuration = this.getDuration() / this.ZoomFactor;

            var parentWidth = this.drawer.getWidth();
            var width = parentWidth;

            var start = this.LeftProgress;
            var end = width * this.ZoomFactor >> 0;
            var peaks = void 0;

            peaks = this.backend.getPeaks(width, start, end, force);
            this.drawer.drawPeaks(peaks, width, 0, end, peaks.length, this.backend.shift);

            if (this.backend.extraPeakStart >= 0)
            {

                var q = this;
                requestAnimationFrame(function () {
                    q.drawer.canvases[0].waveCtx.fillStyle = 'rgba(255,60,40,0.2)';
                    q.drawer.canvases[0].waveCtx.fillRect (q.backend.extraPeakStart, 0, q.backend.extraPeakEnd-q.backend.extraPeakStart, q.drawer.canvases[0].wave.height);
                });
            }

            this.fireEvent('redraw', peaks, width);
        }

    }, {
        key: 'zoom',
        value: function zoom() {}

    }, {
        key: 'loadArrayBuffer',
        value: function loadArrayBuffer(arraybuffer) {
            var _this9 = this;

            this.decodeArrayBuffer(arraybuffer, function (data) {
                if (!_this9.isDestroyed) {
                    _this9.loadDecodedBuffer(data);
                }
            });
        }

    }, {
        key: 'loadDecodedBuffer',
        value: function loadDecodedBuffer(buffer) {

            this.backend.splitPeaks = [];
            this.backend.mergedPeaks = [];

            this.backend.load(buffer);
            this.drawBuffer(1);
            this.fireEvent('ready');
            this.isReady = true;
        }

    }, {
        key: 'loadBlob',
        value: function loadBlob(blob) {
            var _this10 = this;

            var reader = new FileReader();
            reader.addEventListener('progress', function (e) {
                return _this10.onProgress(e);
            });
            reader.addEventListener('load', function (e) {
                return _this10.loadArrayBuffer(e.target.result);
            });
            reader.addEventListener('error', function () {
                return _this10.fireEvent('error', 'Error reading file');
            });
            reader.readAsArrayBuffer(blob);
            this.empty();
        }

    }, {
        key: 'load',
        value: function load(url) {
            this.empty();
            return this.loadBuffer(url);
        }

    }, {
        key: 'loadBuffer',
        value: function loadBuffer(url) {
            var _this11 = this;

            return _this11.getArrayBuffer(url, function (data) {
                return _this11.loadArrayBuffer(data);
            });
        }

    }, {
        key: 'decodeArrayBuffer',
        value: function decodeArrayBuffer(arraybuffer, callback) {
            var _this13 = this;
            var _id = 'q'+((Math.random() * 999999) >> 0);

            this.bid[_id] = 1;
            this.bid['curr'] = _id;

            var old_duration = this.getDuration ();

            this.backend.decodeArrayBuffer (arraybuffer, function (data) {

                if (!_this13.isDestroyed)
                {
                    if (_this13.bid[_id])
                    {
                        var go = false;
                        if (_this13.backend.buffer && _this13.backend._add)
                        {
                            go = true;
                        }

                        callback(data);
                        _this13.arraybuffer = arraybuffer;

                        if (go)
                        {
                            setTimeout(function () {
                                _this13.regions.add({
                                    start:old_duration,
                                    end:_this13.getDuration () - 0.01,
                                    id:'t'
                                });
                            },48);
                        }

                    }
                }
            }, function () {
                return _this13.fireEvent('error', 'Error decoding audiobuffer. Did you make sure to supply a valid audio file? ');
            });
        }

    }, {
        key: 'getArrayBuffer',
        value: function getArrayBuffer(url, callback) {
            var _this14 = this;
            var xhr = new XMLHttpRequest();
            var fired100 = false;

            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onprogress = function (e) {
                _this14.onProgress(e);
                if (e.lengthComputable && e.loaded == e.total) {
                    fired100 = true;
                }
            };
            xhr.onload = function (e) {
                if (!fired100) {
                    _this14.onProgress(e);
                }
                if (200 == xhr.status || 206 == xhr.status) {
                    callback(xhr.response);
                } else {
                    _this14.fireEvent('error', 'Could not load remote URL. Make sure the url exists, is a valid audio file,<br /> ' +
                        ' or that is supports Cross Origin requests (Access-Control-Allow-Origin header) <br />' + xhr.statusText);
                    PKAudioEditor.fireEvent('RequestResize');
                }
                _this14.currentAjax = null;
            };
            xhr.onerror = function () {
                _this14.fireEvent('error', 'Could not load remote URL. Make sure the url exists, is a valid audio file,<br /> ' +
                    ' or that is supports Cross Origin requests (Access-Control-Allow-Origin header) <br />' + xhr.statusText);
                _this14.currentAjax = null;
                PKAudioEditor.fireEvent('RequestResize');
            };

            this.currentAjax = xhr;
            xhr.send();
            return xhr;
        }

    }, {
        key: 'onProgress',
        value: function onProgress(e) {
            var percentComplete = void 0;
            if (e.lengthComputable) {
                percentComplete = e.loaded / e.total;
            } else {

                percentComplete = e.loaded / (e.loaded + 1000000);
            }
            this.fireEvent('loading', Math.round(percentComplete * 100), e.target);
        }

    }, {
        key: 'cancelBufferLoad',
        value: function cancelBufferLoad() {
            if (this.bid && this.bid.curr) {
                this.bid[ this.bid['curr'] ] = null;
                return (true);
            }
            return (false);
        }

    }, {
        key: 'cancelAjax',
        value: function cancelAjax() {
            if (this.currentAjax) {
                this.currentAjax.abort();
                this.currentAjax = null;

                return (true);
            }
            return (false);
        }

    }, {
        key: 'empty',
        value: function empty() {
            if (!this.backend.isPaused()) {
                this.stop();
                this.backend.disconnectSource();
            }
            this.cancelAjax();
            this.drawer.progress(0);
            this.drawer.setWidth(0);

            this.drawer.drawPeaks({ length: this.drawer.getWidth() }, 0, 2);
        }

    }, {
        key: 'destroy',
        value: function destroy() {
            this.destroyAllPlugins();
            this.fireEvent('destroy');
            this.cancelAjax();
            this.unAll();
            this.backend.destroy();
            this.drawer.destroy();
            this.isDestroyed = true;
            this.arraybuffer = null;
        }
    }]);

    return WaveSurfer;
}(util.Observer);

WaveSurfer.util = util;
exports.default = WaveSurfer;

module.exports = exports['default'];

  }),

  "./src/webaudio.js":

  (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = __webpack_require__(  "./src/util/index.js");

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PLAYING = 'playing';
var PAUSED = 'paused';
var FINISHED = 'finished';

  var is_safari = navigator.userAgent.toLowerCase().indexOf('safari/') > -1;

var WebAudio = function (_util$Observer) {
    _inherits(WebAudio, _util$Observer);

    _createClass(WebAudio, [{
        key: 'supportsWebAudio',

        value: function supportsWebAudio() {
            return !!(window.AudioContext || window.webkitAudioContext);
        }

    }, {
        key: 'getAudioContext',
        value: function getAudioContext() {
            if (!window.WaveSurferAudioContext) {

                    window.WaveSurferAudioContext = new (window.AudioContext || window.webkitAudioContext)();

            }
            return window.WaveSurferAudioContext;
        }

    }, {
        key: 'getOfflineAudioContext',
        value: function getOfflineAudioContext(sampleRate) {
            if (!window.WaveSurferOfflineAudioContext) {
                window.WaveSurferOfflineAudioContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 2, sampleRate);
            }
            return window.WaveSurferOfflineAudioContext;
        }

    }]);

    function WebAudio(params) {
        _classCallCheck(this, WebAudio);

        var _this = _possibleConstructorReturn(this, (WebAudio.__proto__ || Object.getPrototypeOf(WebAudio)).call(this));

        _this.audioContext = null;
        _this.offlineAudioContext = null;
        _this.params = params;

        _this.ac = params.audioContext || _this.getAudioContext();

        _this.lastPlay = _this.ac.currentTime;

        _this.startPosition = 0;

        _this.scheduledPause = null;

        _this.analyser = null;

        _this.buffer = null;
        _this.gainNode1 = null;
        _this.gainNode2 = null;
        _this.splitterNode = null;

        _this.mergedPeaks = null;

        _this.offlineAc = null;

        _this.peaks = null;

        _this.playbackRate = 1;

        _this.analyser = null;

        _this.scriptNode = null;

        _this.source = null;

        _this.splitPeaks = [];

        _this.state = null;

        _this.explicitDuration = null;

        _this.peakPyramid = null;
        _this.peakPyramidStep = 128;
        _this.peakPyramidMinDuration = 300;
        _this.peakPyramidToken = 0;
        _this.peakPyramidTimer = 0;
        _this.peakPyramidTimerType = 0;
        _this.peakPyramidJob = null;
        _this.peakPyramidBytes = 0;

        _this.FreqArr = new Uint8Array(512);
        if (_this.ac.addEventListener) {
            _this.ac.addEventListener('statechange', function () {
                if (_this.state === PLAYING && _this.ac.state !== 'running') {
                    _this.pause();
                }
            });
        }
        return _this;
    }

    _createClass(WebAudio, [{
        key: 'init',
        value: function init() {

            this.createVolumeNode();
            this.createScriptNode();
            this.createAnalyserNode();

            this.setState(PAUSED);
            this.playbackRate = this.params.audioRate || 1;
            this.setLength(0);
        }

    }, {
        key: 'setState',
        value: function setState(state) {
            if (this.state === state) {
                return;
            }
            this.state = state;
            if (state === PLAYING) {
                this.addOnAudioProcess();
            } else {
                this.removeOnAudioProcess();
                if (state === FINISHED) {
                    this.fireEvent('finish');
                }
            }
        }

    }, {
        key: 'createScriptNode',
        value: function createScriptNode() {
            var ac = this.ac;
            var size = WebAudio.scriptBufferSize;
            var legacy = function () {
                var n = ac.createScriptProcessor ? ac.createScriptProcessor(size) : ac.createJavaScriptNode(size);
                n.connect(ac.destination);
                return n;
            };

            if (!(ac.audioWorklet && window.btoa)) {
                this.scriptNode = legacy();
                return;
            }

            // AudioWorklet clock: ticks every 256 frames (same cadence as the old
            // ScriptProcessor). The stub keeps the old `onaudioprocess` interface.
            var stub = {
                _h: null,
                _n: null,
                _kind: 0,
                disconnect: function () {
                    try { stub._n && stub._n.disconnect(); } catch (e) {}
                }
            };
            Object.defineProperty(stub, 'onaudioprocess', {
                get: function () { return stub._h; },
                set: function (f) {
                    stub._h = f;
                    if (stub._kind === 1) stub._n.port.postMessage(f ? 1 : 0);
                    else if (stub._kind === 2) stub._n.onaudioprocess = f;
                }
            });

            var code = "class T extends AudioWorkletProcessor{constructor(){super();this.on=0;this.c=0;" +
                "this.port.onmessage=e=>{this.on=e.data}}" +
                "process(){if(this.on&&(++this.c&1)===0)this.port.postMessage(0);return true}}" +
                "registerProcessor('pk-tick',T)";
            var url = 'data:application/javascript;base64,' + btoa(code);

            ac.audioWorklet.addModule(url).then(function () {
                var n = new AudioWorkletNode(ac, 'pk-tick', {
                    numberOfInputs: 0,
                    numberOfOutputs: 1,
                    outputChannelCount: [1]
                });
                n.port.onmessage = function (e) {
                    stub._h && stub._h({timeStamp: e.timeStamp});
                };
                n.connect(ac.destination);
                stub._n = n;
                stub._kind = 1;
                n.port.postMessage(stub._h ? 1 : 0);
            }).catch(function () {
                var n = legacy();
                stub._n = n;
                stub._kind = 2;
                n.onaudioprocess = stub._h;
            });

            this.scriptNode = stub;
        }

    }, {
        key: 'addOnAudioProcess',
        value: function addOnAudioProcess() {
            var _this2 = this;

            this.scriptNode.onaudioprocess = function ( ee ) {

                if (_this2.state !== PLAYING)
                    return ;

                var time = _this2.getCurrentTime();

                var buffer = _this2.buffer;
                var sample_rate = buffer.sampleRate;
                var offset = time * sample_rate >> 0;
                var jump = 4;
                var clip_level = 1.0;
                var loudness = [0, 0];
                var sr = 512;
                var band_amp = 0;
                var temp = 0;

                for (var i = 0; i < buffer.numberOfChannels; ++i) {
                    temp = 0;
                    var chan_data = buffer.getChannelData(i);

                    for (var j = 0; j < sr; j += jump) {
                        var x = Math.abs(chan_data[offset + j]);
                        if (x > temp) {
                            temp = x;
                        }
                    }

                    loudness[i] = 20 * Math.log10(temp) + 0.001;
                }

                _this2.peak_frequency = loudness;

                if (_this2.logFrequencies) {

                    _this2.analyser.getByteFrequencyData(_this2.FreqArr);
                }

                if (time >= _this2.getDuration()) {
                    _this2.setState(FINISHED);

                    _this2.fireEvent('pause', 'end');
                } else if (time >= _this2.scheduledPause) {
                    _this2.pause();
                } else if (_this2.state === PLAYING) {
                    _this2.fireEvent('audioprocess', time, ee.timeStamp);
                }

                _this2.peak_frequency = null;
            };
        }

    }, {
        key: 'removeOnAudioProcess',
        value: function removeOnAudioProcess() {

            if (!is_safari)
                this.scriptNode.onaudioprocess = null;

        }

    }, {
        key: 'createAnalyserNode',
        value: function createAnalyserNode() {
            this.analyser = this.ac.createAnalyser();

            this.analyser.fftSize = 1024;

            this.analyser.connect(this.splitterNode);

        }

    }, {
        key: 'SetNumberOfChannels',
        value: function SetNumberOfChannels( num ) {
            this.splitterNode.disconnect (0);
            this.splitterNode.disconnect (1);

            if (num === 1)
            {
                this.splitterNode.connect (this.gainNode1, 0);
                this.splitterNode.connect (this.gainNode2, 0);
            }
            else if ( num === 2)
            {
                this.splitterNode.connect (this.gainNode1, 1);
                this.splitterNode.connect (this.gainNode2, 0);
            }
        }
    }, {
        key: 'createVolumeNode',
        value: function createVolumeNode() {

            this.splitterNode = this.ac.createChannelSplitter ( 2 );
            this.mergerNode = this.ac.createChannelMerger ( 2 );

            if (this.ac.createGain) {
                this.gainNode1 = this.ac.createGain();
                this.gainNode2 = this.ac.createGain();
            } else {
                this.gainNode1 = this.ac.createGainNode();
                this.gainNode2 = this.ac.createGainNode();
            }

            this.splitterNode.connect (this.gainNode1, 1);
            this.splitterNode.connect (this.gainNode2, 0);

            this.gainNode1.connect (this.mergerNode, 0, 1);
            this.gainNode2.connect (this.mergerNode, 0, 0);

            this.mergerNode.connect (this.ac.destination);
        }

    }, {
        key: 'getLoudness',
        value: function getLoudness() {
            return this.peak_frequency;
        }

    }, {
        key: 'decodeArrayBuffer',
        value: function decodeArrayBuffer(arraybuffer, callback, errback) {

            PKAudioEditor.engine.ID3 (arraybuffer);

            if (!this.offlineAc) {
                this.offlineAc = this.getOfflineAudioContext(44100);
            }

            var promise = this.offlineAc.decodeAudioData(arraybuffer, function (data) {

                return callback(data);
            }, errback);

            if (promise)
            {
                promise.catch(function( error ) {
                    console.log("couldn't load audio");

                });
            }
        }

    }, {
        key: 'setPeaks',
        value: function setPeaks(peaks, duration) {
            this.explicitDuration = duration;
            this.peaks = peaks;
        }

    }, {
        key: 'setLength',
        value: function setLength(length) {
            var peakLength = length > 0 ? Math.floor(length * 2) : 0;
            var channels = this.buffer ? this.buffer.numberOfChannels : 1;

            if (this.mergedPeaks &&
                peakLength == this.mergedPeaks.length &&
                this.splitPeaks &&
                this.splitPeaks.length === channels &&
                this.splitPeaks[channels - 1] &&
                this.splitPeaks[channels - 1].length == peakLength) {
                return;
            }

            this.splitPeaks = [];
            this.mergedPeaks = new Float32Array(peakLength);
            var c = void 0;
            for (c = 0; c < channels; c++) {
                this.splitPeaks[c] = new Float32Array(peakLength);
            }
        }

    }, {
        key: 'resetPeakPyramid',
        value: function resetPeakPyramid() {
            this.peakPyramidToken++;
            this.peakPyramid = null;
            this.peakPyramidBytes = 0;

            if (this.peakPyramidTimer) {
                if (this.peakPyramidTimerType === 1 &&
                    typeof window !== 'undefined' &&
                    window.cancelIdleCallback) {
                    window.cancelIdleCallback(this.peakPyramidTimer);
                }
                else {
                    clearTimeout(this.peakPyramidTimer);
                }
            }

            this.peakPyramidTimer = 0;
            this.peakPyramidTimerType = 0;
            this.peakPyramidJob = null;
        }
    }, {
        key: 'schedulePeakPyramid',
        value: function schedulePeakPyramid() {
            var q = this;
            var token = void 0;
            var run = void 0;

            this.resetPeakPyramid();

            if (!this.buffer || this.buffer.duration < this.peakPyramidMinDuration) {
                return;
            }

            token = this.peakPyramidToken;
            run = function () {
                q.peakPyramidTimer = 0;
                q.peakPyramidTimerType = 0;
                q.buildPeakPyramid(token);
            };

            if (typeof window !== 'undefined' && window.requestIdleCallback) {
                this.peakPyramidTimerType = 1;
                this.peakPyramidTimer = window.requestIdleCallback(run, {
                    timeout: 1600
                });
            }
            else {
                this.peakPyramidTimerType = 2;
                this.peakPyramidTimer = setTimeout(run, 0);
            }
        }
    }, {
        key: 'buildPeakPyramid',
        value: function buildPeakPyramid(token) {
            var buffer = this.buffer;

            if (token !== this.peakPyramidToken ||
                !buffer ||
                buffer.duration < this.peakPyramidMinDuration) {
                return;
            }

            this.peakPyramidJob = {
                token: token,
                buffer: buffer,
                baseStep: this.peakPyramidStep,
                channels: buffer.numberOfChannels,
                channel: 0,
                pyramid: [],
                bytes: 0,
                phase: 0
            };
            this.continuePeakPyramidBuild(this.peakPyramidJob);
        }
    }, {
        key: 'schedulePeakPyramidStep',
        value: function schedulePeakPyramidStep(job) {
            var q = this;
            var run = function (deadline) {
                q.peakPyramidTimer = 0;
                q.peakPyramidTimerType = 0;
                q.continuePeakPyramidBuild(job, deadline);
            };

            if (typeof window !== 'undefined' && window.requestIdleCallback) {
                this.peakPyramidTimerType = 1;
                this.peakPyramidTimer = window.requestIdleCallback(run, {
                    timeout: 1000
                });
            }
            else {
                this.peakPyramidTimerType = 2;
                this.peakPyramidTimer = setTimeout(run, 0);
            }
        }
    }, {
        key: 'continuePeakPyramidBuild',
        value: function continuePeakPyramidBuild(job, deadline) {
            var now = typeof performance !== 'undefined' && performance.now ?
                function () { return performance.now(); } :
                function () { return Date.now(); };
            var started = now();
            var budget = deadline && deadline.timeRemaining ?
                Math.max(4, Math.min(10, deadline.timeRemaining())) :
                6;

            if (!job ||
                job.token !== this.peakPyramidToken ||
                job.buffer !== this.buffer) {
                return;
            }

            while (job.channel < job.channels) {
                if (!job.levels) {
                    var data = job.buffer.getChannelData(job.channel);
                    var size = Math.ceil(data.length / job.baseStep);

                    job.data = data;
                    job.levels = [];
                    job.size = size;
                    job.min = new Float32Array(size);
                    job.max = new Float32Array(size);
                    job.index = 0;
                    job.phase = 1;
                }

                if (job.phase === 1) {
                    while (job.index < job.size) {
                        var from = job.index * job.baseStep;
                        var to = Math.min(job.data.length, from + job.baseStep);
                        var mn = 0;
                        var mx = 0;
                        var j = void 0;

                        for (j = from; j < to; ++j) {
                            var value = job.data[j];
                            if (value > mx) mx = value;
                            else if (value < mn) mn = value;
                        }

                        job.min[job.index] = mn;
                        job.max[job.index] = mx;
                        job.index++;

                        if ((job.index & 63) === 0 && now() - started >= budget) {
                            this.schedulePeakPyramidStep(job);
                            return;
                        }
                    }

                    job.levels.push({
                        step: job.baseStep,
                        min: job.min,
                        max: job.max
                    });
                    job.bytes += job.min.byteLength + job.max.byteLength;
                    job.prev = job.levels[job.levels.length - 1];
                    job.min = null;
                    job.max = null;
                    job.phase = 2;
                }

                while (job.phase === 2) {
                    if (job.prev.min.length <= 1) {
                        job.pyramid[job.channel] = job.levels;
                        job.channel++;
                        job.data = null;
                        job.levels = null;
                        job.prev = null;
                        job.min = null;
                        job.max = null;
                        job.phase = 0;
                        break;
                    }

                    if (!job.min) {
                        job.size = Math.ceil(job.prev.min.length / 2);
                        job.min = new Float32Array(job.size);
                        job.max = new Float32Array(job.size);
                        job.index = 0;
                    }

                    while (job.index < job.size) {
                        var p0 = job.index * 2;
                        var p1 = p0 + 1;
                        var mn2 = job.prev.min[p0];
                        var mx2 = job.prev.max[p0];

                        if (p1 < job.prev.min.length) {
                            if (job.prev.min[p1] < mn2) mn2 = job.prev.min[p1];
                            if (job.prev.max[p1] > mx2) mx2 = job.prev.max[p1];
                        }

                        job.min[job.index] = mn2;
                        job.max[job.index] = mx2;
                        job.index++;

                        if ((job.index & 1023) === 0 && now() - started >= budget) {
                            this.schedulePeakPyramidStep(job);
                            return;
                        }
                    }

                    job.levels.push({
                        step: job.prev.step * 2,
                        min: job.min,
                        max: job.max
                    });
                    job.bytes += job.min.byteLength + job.max.byteLength;
                    job.prev = job.levels[job.levels.length - 1];
                    job.min = null;
                    job.max = null;
                }

                if (now() - started >= budget) {
                    this.schedulePeakPyramidStep(job);
                    return;
                }
            }

            if (job.token !== this.peakPyramidToken || job.buffer !== this.buffer) {
                return;
            }

            this.peakPyramid = {
                buffer: job.buffer,
                length: job.buffer.length,
                sampleRate: job.buffer.sampleRate,
                channels: job.channels,
                step: job.baseStep,
                levels: job.pyramid,
                bytes: job.bytes
            };
            this.peakPyramidBytes = job.bytes;
            this.peakPyramidJob = null;
        }
    }, {
        key: 'getPeakPyramidLevel',
        value: function getPeakPyramidLevel(levels, sampleSize) {
            var target = Math.max(this.peakPyramidStep, sampleSize / 4);
            var level = levels[0];
            var i = void 0;

            for (i = 0; i < levels.length; ++i) {
                if (levels[i].step <= target) level = levels[i];
                else break;
            }

            return level;
        }
    }, {
        key: 'getPeaksFromPyramid',
        value: function getPeaksFromPyramid(length, first, sampleSize, init) {
            var cache = this.peakPyramid;
            var channels = this.buffer ? this.buffer.numberOfChannels : 0;
            var c = void 0;
            init = init || 0;

            if (!cache ||
                cache.buffer !== this.buffer ||
                cache.channels !== channels ||
                this.extraPeaks ||
                sampleSize < cache.step) {
                return false;
            }

            for (c = 0; c < channels; ++c) {
                var levels = cache.levels[c];
                var level = this.getPeakPyramidLevel(levels, sampleSize);
                var min_arr = level.min;
                var max_arr = level.max;
                var step = level.step;
                var peak_last = min_arr.length - 1;
                var peaks = this.splitPeaks[c];
                var i = void 0;

                for (i = init; i <= length; ++i) {
                    var from = first + i * sampleSize;
                    var to = from + sampleSize;
                    var min = 0;
                    var max = 0;
                    var p0 = void 0;
                    var p1 = void 0;
                    var p = void 0;

                    if (from >= cache.length || to <= 0) {
                        peaks[2 * i] = 0;
                        peaks[2 * i + 1] = 0;
                        continue;
                    }

                    p0 = Math.max(0, Math.min(peak_last, (from / step) >> 0));
                    p1 = Math.max(0, Math.min(peak_last, ((to - 1) / step) >> 0));

                    for (p = p0; p <= p1; ++p) {
                        if (max_arr[p] > max) max = max_arr[p];
                        if (min_arr[p] < min) min = min_arr[p];
                    }

                    peaks[2 * i] = max;
                    peaks[2 * i + 1] = min;
                }
            }

            return true;
        }

    }, {
        key: 'getPeaks',
        value: function getPeaks(length, first, last, force) {

            first = first * this.buffer.sampleRate;
            last = last || length - 1;

            this.setLength(length);

            if (!this.buffer.length) {
                var newBuffer = this.createBuffer (1, 4096, this.sampleRate);
                this.buffer = newBuffer.buffer;
            }

            var sampleSize = this.buffer.length / last;
            var sampleStep = ~~(sampleSize / 10) || 1;

            if (sampleStep > 32) sampleStep = 32;
            else if (sampleStep < 6) sampleStep = 6;

            var channels = this.buffer.numberOfChannels;
            var c = void 0;
            var init = 0;

            this.shift = 0;

            if (this.splitPeaks && !force) {

                if (last == this.peaksEnd)
                {

                    var shift = (this.peaksStart - first) / sampleSize;

                    if (shift === 0) {
                        this.shift = 999999999;

                        return this.splitPeaks;
                    }

                        shift = Math.round ( shift );
                        first = this.peaksStart - (shift * sampleSize);
                        shift = (shift * 2);

                        this.shift = shift;

                        for (c = 0; c < channels; ++c) {
                            var peaks = this.splitPeaks[c];

                            if (shift < 0) {

                                peaks.copyWithin(0, -shift);

                                init = length + shift;
                            } else if (shift > 0) {
                                peaks.copyWithin(shift, 0, peaks.length - shift);
                                length = shift / 2 >> 0;
                            } else {
                                return this.splitPeaks;
                            }
                        }

                }
            }

            if (this.peakPyramid && this.getPeaksFromPyramid(length, first, sampleSize, init)) {
                this.extraPeakStart = -1;
                this.extraPeakEnd = -1;
                this.peaksStart = first;
                this.peaksEnd = last;
                return this.splitPeaks;
            }

            for (c = 0; c < channels; ++c) {
                var peaks = this.splitPeaks[c];
                var chan = this.buffer.getChannelData(c);
                var i = void 0;

                for (i = init; i <= length; ++i) {
                    var start = first + (i * sampleSize) >> 0;
                    var end = (start + sampleSize) >> 0;
                    var min = 0;
                    var max = 0;
                    var j = void 0;

                    for (j = start; j < end; j += sampleStep) {
                        var value = chan[j];

                        if (value > max) {
                            max = value;
                        }

                        else if (value < min) {
                            min = value;

                        }
                    }

                    peaks[2 * i] = max;
                    peaks[2 * i + 1] = min;
                }
            }

            this.extraPeakStart = -1;
            this.extraPeakEnd = -1;

            if (this.extraPeaks)
            {

                var extraoffset = (this.extraOffset / sampleSize) >> 0;

                if (first <= this.extraOffset && last > extraoffset)
                {
                    extraoffset = ((this.extraOffset - first) / sampleSize) >> 0;

                    var extra_len = this.extraPeaks.length;
                    var extra_arr_len = this.extraPeaks[0].length;
                    var templength = extraoffset + ((extra_arr_len * extra_len) / sampleSize) >> 0;

                    this.extraPeakStart = extraoffset;
                    this.extraPeakEnd = templength;

                    for (c = 0; c < channels; ++c)
                    {
                        var peaks = this.splitPeaks[c];
                        // var chan = this.buffer.getChannelData(c);
                        var i = void 0;

                        var k = 0;
                        for (i = extraoffset; i <= templength; ++i)
                        {

                            var start = k * sampleSize >> 0;
                            var end = start + sampleSize >> 0;
                            var min = 0;
                            var max = 0;
                            var j = void 0;

                            ++k;

                            for (j = start; j < end; j += sampleStep)
                            {
                                var val = j / extra_arr_len;

                                if (val >= extra_len) {
                                    break;
                                }

                                var value = this.extraPeaks[val >> 0][ j % extra_arr_len ];

                                if (value > max) {
                                    max = value;
                                }

                                if (value < min) {
                                    min = value;
                                }
                            }

                            peaks[2 * i] = max;
                            peaks[2 * i + 1] = min;
                        }

                    }

                }
            }

            this.peaksStart = first;
            this.peaksEnd = last;

            return this.splitPeaks;
        }

    }, {
        key: 'getPlayedPercents',
        value: function getPlayedPercents() {
            var duration = this.getDuration();
            return this.state === FINISHED ? 1 : this.getCurrentTime() / duration || 0;
        }

    }, {
        key: 'disconnectSource',
        value: function disconnectSource() {
            if (this.source) {
                this.source.disconnect();
            }
        }

    }, {
        key: 'destroy',
        value: function destroy() {
            if (!this.isPaused()) {
                this.pause();
            }
            this.unAll();
            this.resetPeakPyramid();
            this.buffer = null;
            this.disconnectSource();
            this.gainNode1.disconnect();
            this.gainNode2.disconnect();
            this.mergerNode.disconnect();
            this.splitterNode.disconnect();

            this.scriptNode.disconnect();
            this.analyser.disconnect();

            if (this.params.closeAudioContext) {

                if (typeof this.ac.close === 'function' && this.ac.state != 'closed') {
                    this.ac.close();
                }

                this.ac = null;

                if (!this.params.audioContext) {
                    window.WaveSurferAudioContext = null;
                } else {
                    this.params.audioContext = null;
                }

                window.WaveSurferOfflineAudioContext = null;
            }
        }

    }, {
        key: 'load',
        value: function load ( buffer ) {

            if (!this.buffer || !this._add)
            {

                this.lastPlay = this.ac.currentTime;
                this.buffer = buffer;

                this.peaks = null;
                this.createSource();

                this.source.start (0,0,0);

                this.source.stop (0);
                this.createSource();
            }
            else
            {

                    var originalBuffer   = this.buffer;
                    var originalDuration = this.buffer.duration;
                    var originalOffset   = originalDuration;

                    var newDuration = buffer.duration;
                    var newLen      = (originalDuration + newDuration) * this.buffer.sampleRate;

                    var uberSegment = this.ac.createBuffer (
                        this.buffer.numberOfChannels,
                        this.buffer.length + buffer.length,
                        this.buffer.sampleRate
                    );

                    var offset = ((originalDuration / 1) * originalBuffer.sampleRate) >> 0;

                    for (var i = 0; i < originalBuffer.numberOfChannels; ++i)
                    {
                        var chan_data     = originalBuffer.getChannelData ( i );
                        var uberChanData  = uberSegment.getChannelData ( i );
                        var segment_chan_data = null;

                        if (buffer.numberOfChannels === 1)
                            segment_chan_data = buffer.getChannelData ( 0 );
                        else
                            segment_chan_data = buffer.getChannelData ( i );

                        if (offset > 0)
                        {
                            uberChanData.set (
                                chan_data.slice ( 0, offset )
                            );
                        }

                        uberChanData.set (
                            segment_chan_data, offset
                        );

                        if (offset < (originalBuffer.length + buffer.length) )
                        {
                            uberChanData.set (
                                chan_data.slice ( offset ), offset + segment_chan_data.length
                            );
                        }

                    }

                    this.lastPlay = this.ac.currentTime;
                    this.buffer = uberSegment;

                    this.peaks = null;
                    this.createSource();

                    this.source.start (0,0,0);

                    this.source.stop (0);
                    this.createSource();

            }

            this.schedulePeakPyramid();
        }

    }, {
        key: 'createSource',
        value: function createSource() {
            this.disconnectSource();
            this.source = this.ac.createBufferSource();

            this.source.start = this.source.start || this.source.noteGrainOn;
            this.source.stop = this.source.stop || this.source.noteOff;

            this.source.playbackRate.setValueAtTime(this.playbackRate, this.ac.currentTime);
            this.source.buffer = this.buffer;
            this.source.connect(this.analyser);
        }

    }, {
        key: 'isPaused',
        value: function isPaused() {
            return this.state !== PLAYING;
        }

    }, {
        key: 'getDuration',
        value: function getDuration() {
            if (!this.buffer) {
                if (this.explicitDuration) {
                    return this.explicitDuration;
                }
                return 0;
            }
            return this.buffer.duration;
        }

    }, {
        key: 'seekTo',
        value: function seekTo(start, end) {
            if (!this.buffer) {
                return;
            }

            this.scheduledPause = null;

            if (start == null) {
                start = this.getCurrentTime();
                if (start >= this.getDuration()) {
                    start = 0;
                }
            }
            if (end == null) {
                end = this.getDuration();
            }

            this.startPosition = start;
            this.lastPlay = this.ac.currentTime;

            if (this.state === FINISHED) {
                this.setState(PAUSED);
            }

            return {
                start: start,
                end: end
            };
        }

    }, {
        key: 'getPlayedTime',
        value: function getPlayedTime() {
            return (this.ac.currentTime - this.lastPlay) * this.playbackRate;
        }

    }, {
        key: 'play',
        value: function play(start, end) {
            var _this5 = this;

            if (!this.buffer) {
                return;
            }
            if (this.ac.state && this.ac.state !== 'running') {
                if (this.ac.resume && this.ac.state !== 'closed') {
                    this.ac.resume().then(function () {
                        return _this5.play(start, end);
                    }, function () {});
                }
                return;
            }

            this.createSource();

            var adjustedTime = this.seekTo(start, end);

            start = adjustedTime.start;
            end = adjustedTime.end;

            this.scheduledPause = end;

            this.source.start(0, start, end - start);

            this.setState(PLAYING);

            this.fireEvent('play');
        }

    }, {
        key: 'playLoop',
        value: function playLoop(start, end, at) {
            var _this6 = this;

            if (!this.buffer) {
                return;
            }

            if (end <= start) {
                return this.play(start, end);
            }
            if (this.ac.state && this.ac.state !== 'running') {
                if (this.ac.resume && this.ac.state !== 'closed') {
                    this.ac.resume().then(function () {
                        return _this6.playLoop(start, end, at);
                    }, function () {});
                }
                return;
            }

            this.createSource();

            var adjustedTime = this.seekTo(at == null ? start : at, end);
            at = adjustedTime.start;
            end = adjustedTime.end;

            this.loopStart = start;
            this.loopEnd = end;
            this.scheduledPause = Infinity;
            this.source.loop = true;
            this.source.loopStart = start;
            this.source.loopEnd = end;
            this.source.start(0, at);

            this.setState(PLAYING);

            this.fireEvent('play');
        }

    }, {
        key: 'pause',
        value: function pause() {
            if (this.state === PAUSED) return ;

            this.scheduledPause = null;

            this.startPosition = this.getCurrentTime();
            if (this.source) {
                try {
                    this.source.stop(0);
                } catch (e) {}
            }

            this.setState(PAUSED);

            this.fireEvent('pause');
        }

    }, {
        key: 'getCurrentTime',
        value: function getCurrentTime() {
            if (this.state === PLAYING) {
                var time = this.startPosition + this.getPlayedTime();
                if (this.source && this.source.loop) {
                    var len = this.loopEnd - this.loopStart;
                    return len > 0 ? this.loopStart + ((time - this.loopStart) % len) : this.loopStart;
                }
                return time;
            }
            return this.state === FINISHED ? this.getDuration() : this.startPosition;
        }

    }]);

    return WebAudio;
}(util.Observer);

WebAudio.scriptBufferSize = 256;
exports.default = WebAudio;
module.exports = exports['default'];

  })

  });
});
