/*!
 * wavesurfer.js 2.0.5 (Thu Jun 28 2018 18:37:22 GMT-0700 (Pacific Daylight Time))
 * https://github.com/katspaugh/wavesurfer.js
 * @license BSD-3-Clause
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("regions", [], factory);
	else if(typeof exports === 'object')
		exports["regions"] = factory();
	else
		root["WaveSurfer"] = root["WaveSurfer"] || {}, root["WaveSurfer"]["regions"] = factory();
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

  	return __webpack_require__(__webpack_require__.s = "./src/plugin/regions.js");
  })

  ({

  "./src/plugin/regions.js":

  (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Region = function () {
    function Region(params, ws) {
        var _this = this;

        _classCallCheck(this, Region);

        this.wavesurfer = ws;
        this.wrapper = ws.drawer.wrapper;
        this.util = ws.util;
        this.style = this.util.style;

        this.id = params.id == null ? ws.util.getId() : params.id;
        this.start = Number(params.start) || 0;
        this.end = params.end == null ?
        this.start + 4 / this.wrapper.scrollWidth * this.wavesurfer.getDuration() : Number(params.end);
        this.resize = params.resize === undefined ? true : Boolean(params.resize);
        this.drag = params.drag === undefined ? true : Boolean(params.drag);
        this.loop = Boolean(params.loop);
        this.color = params.color || 'rgba(30, 30, 162, 0.51)';
        this.data = params.data || {};
        this.attributes = params.attributes || {};

        this.direction = params.direction || 2;
        this.maxLength = params.maxLength;
        this.minLength = params.minLength;
        this._onRedraw = function () {
            return _this.updateRender();
        };

        this.scroll = params.scroll !== false && ws.params.scrollParent;
        this.scrollSpeed = params.scrollSpeed || 1;
        this.scrollThreshold = params.scrollThreshold || 28;

        this.bindInOut();
        this.render();
        this.wavesurfer.on('zoom', this._onRedraw);
        this.wavesurfer.on('redraw', this._onRedraw);
    }

    _createClass(Region, [{
        key: 'update',
        value: function update(params) {
            if (null != params.start) {
                this.start = Number(params.start);
            }
            if (null != params.end) {
                this.end = Number(params.end);
            }
            if (null != params.loop) {
                this.loop = Boolean(params.loop);
            }
            if (null != params.color) {
                this.color = params.color;
            }
            if (null != params.data) {
                this.data = params.data;
            }
            if (null != params.resize) {
                this.resize = Boolean(params.resize);
            }
            if (null != params.drag) {
                this.drag = Boolean(params.drag);
            }
            if (null != params.maxLength) {
                this.maxLength = Number(params.maxLength);
            }
            if (null != params.minLength) {
                this.minLength = Number(params.minLength);
            }
            if (null != params.attributes) {
                this.attributes = params.attributes;
            }

            this.updateRender();
            this.fireEvent('update');
            this.wavesurfer.fireEvent('region-updated', this);
        }

    }, {
        key: 'remove',
        value: function remove() {
            if (this.element) {
                this.wrapper.removeChild(this.element);
                this.element = null;
                this.fireEvent('remove');
                this.wavesurfer.un('zoom', this._onRedraw);
                this.wavesurfer.un('redraw', this._onRedraw);
                this.wavesurfer.fireEvent('region-removed', this);
            }
        }

    }, {
        key: 'render',
        value: function render() {
            var regionEl = document.createElement('region');
            regionEl.className = 'wavesurfer-region';
            regionEl.setAttribute('data-id', this.id);

            for (var attrname in this.attributes) {
                regionEl.setAttribute('data-region-' + attrname, this.attributes[attrname]);
            }

            var width = this.wrapper.scrollWidth;
            this.style(regionEl, {
                position: 'absolute',
                zIndex: 2,
                height: '100%',
                top: '0px'
            });

            if (this.resize) {
                var handleLeft = regionEl.appendChild(document.createElement('handle'));
                var handleRight = regionEl.appendChild(document.createElement('handle'));
                handleLeft.className = 'wavesurfer-handle wavesurfer-handle-start';
                handleRight.className = 'wavesurfer-handle wavesurfer-handle-end';
                var css = {
                    cursor: 'col-resize',
                    position: 'absolute',
                    left: '0px',
                    top: '0px',
                    width: '1%',
                    maxWidth: '4px',
                    height: '100%'
                };
                this.style(handleLeft, css);
                this.style(handleRight, css);
                this.style(handleRight, {
                    left: '100%'
                });
            }

            this.element = this.wrapper.appendChild(regionEl);
            this.updateRender();
            this.bindEvents(regionEl);
        }
    }, {
        key: 'getWidth',
        value: function getWidth() {
            return this.wavesurfer.drawer.width / this.wavesurfer.params.pixelRatio;
        }

    }, {
        key: 'updateRender',
        value: function updateRender() {
            var dur = this.wavesurfer.getDuration();
            var width = this.getWidth();

            if (this.start < 0) {
                this.start = 0;
                this.end = this.end - this.start;
            }
            if (this.end > dur) {
                this.end = dur;
                this.start = dur - (this.end - this.start);
            }

            if (this.minLength != null) {
                this.end = Math.max(this.start + this.minLength, this.end);
            }

            if (this.maxLength != null) {
                this.end = Math.min(this.start + this.maxLength, this.end);
            }

            if (this.element != null) {

                var left = this.start / dur * width;
                var regionWidth = this.end / dur * width - left;

                this.style(this.element, {
                    left: this.wavesurfer.UnzoomifyPixelValue(left) + 'px',
                    width: regionWidth * this.wavesurfer.ZoomFactor + 'px',

                    cursor: this.drag ? 'move' : 'default'
                });

                for (var attrname in this.attributes) {
                    this.element.setAttribute('data-region-' + attrname, this.attributes[attrname]);
                }
            }
        }

    }, {
        key: 'bindInOut',
        value: function bindInOut() {
            var _this3 = this;

            this.firedIn = false;
            this.firedOut = false;

            var onProcess = function onProcess(time) {

                if (!_this3.firedOut && _this3.firedIn && (_this3.start >= Math.round(time * 1000) / 1000 || _this3.end <= (time + 0.0028)  ) ) {

                    _this3.firedOut = true;
                    _this3.firedIn = false;
                    _this3.fireEvent('out');
                }
                if (!_this3.firedIn && _this3.start <= time && _this3.end > time) {
                    _this3.firedIn = true;
                    _this3.firedOut = false;
                    _this3.fireEvent('in');
                }
            };

            this.wavesurfer.backend.on('audioprocess', onProcess);

            this.on('remove', function () {
                _this3.wavesurfer.backend.un('audioprocess', onProcess);
            });

            this.on('out', function () {

                if (_this3.loop) {
                    if (_this3.wavesurfer.backend.source && _this3.wavesurfer.backend.source.loop) return;
                    _this3.wavesurfer.backend.playLoop ? _this3.wavesurfer.backend.playLoop(_this3.start, _this3.end) : _this3.wavesurfer.play(_this3.start);
                } else {

                    _this3.wavesurfer.seekTo(_this3.start / _this3.wavesurfer.getDuration());
                    _this3.wavesurfer.stop();
                }
            });
        }

    }, {
        key: 'bindEvents',
        value: function bindEvents() {
            var _this4 = this;

            this.element.addEventListener('mouseenter', function (e) {
                _this4.fireEvent('mouseenter', e);
            });

            this.element.addEventListener('mouseleave', function (e) {
                _this4.fireEvent('mouseleave', e);
            });

            this.element.addEventListener('click', function (e) {
                e.preventDefault();
                _this4.fireEvent('click', e);
            });

            this.element.addEventListener('dblclick', function (e) {
                e.stopPropagation();
                e.preventDefault();
                _this4.fireEvent('dblclick', e);
            });

            (this.drag || this.resize) && function () {
                var container = _this4.wavesurfer.drawer.container;
                var duration = _this4.wavesurfer.getDuration();
                var scrollSpeed = _this4.scrollSpeed;
                var scrollThreshold = _this4.scrollThreshold;
                var startTime = void 0;
                var touchId = void 0;
                var drag = void 0;
                var maxScroll = void 0;
                var resize = void 0;
                var updated = false;
                var scrollDirection = void 0;
                var wrapperRect = void 0;

                var edgeScroll = function edgeScroll(e, direction) {
                    if (!scrollDirection || !drag && !resize) {
                        return;
                    }

                    var scroll_speed = scrollSpeed;
                    var rect = _this4.wavesurfer.drawer.wrapper.getBoundingClientRect();
                    if (direction === -1) {
                        var multiplier = Math.abs(rect.left - e.clientX) - 10;
                        if (multiplier > 0) scroll_speed *= multiplier / 2;
                    } else if (direction === 1) {

                        var multiplier = Math.abs(e.clientX - rect.right) - 10;
                        if (multiplier > 0) scroll_speed *= multiplier / 2;
                    }

                    var scrollLeft = scroll_speed * scrollDirection / _this4.wavesurfer.getDuration();
                    _this4.wavesurfer.LeftProgress += scrollLeft;
                    if (_this4.wavesurfer.LeftProgress < 0) _this4.wavesurfer.LeftProgress = 0;else if (_this4.wavesurfer.LeftProgress + _this4.wavesurfer.VisibleDuration > _this4.wavesurfer.getDuration()) {
                        _this4.wavesurfer.LeftProgress = _this4.wavesurfer.getDuration() - _this4.wavesurfer.VisibleDuration;
                    }
                    _this4.wavesurfer.ForceDraw();

                    var time = _this4.wavesurfer.ZoomifyValue(_this4.wavesurfer.drawer.handleEvent(e)) * duration;
                    var delta = time - startTime;
                    startTime = time;

                    drag ? _this4.onDrag(delta) : _this4.onResize(delta, resize);

                    _this4.wavesurfer.fireEvent ('DidZoom');

                    window.requestAnimationFrame(function () {
                        edgeScroll(e, direction);
                    });
                };

                var onDown = function onDown(e) {
                    if (e.touches && e.touches.length > 1) {
                        return;
                    }
                    if (e.which === 3) {
                        return;
                    }
                    touchId = e.targetTouches ? e.targetTouches[0].identifier : null;

                    _this4.wavesurfer.Interacting |= 1 << 0;

                    e.stopPropagation();

                    var event = new Event ('killCTX', {bubbles: true});
                    document.body.dispatchEvent (event);

                    startTime = _this4.wavesurfer.ZoomifyValue(_this4.wavesurfer.drawer.handleEvent(e, true)) * duration;

                    maxScroll = _this4.wrapper.scrollWidth - _this4.wrapper.clientWidth;
                    wrapperRect = _this4.wrapper.getBoundingClientRect();

                    if (e.target.tagName.toLowerCase() == 'handle') {
                        if (e.target.classList.contains('wavesurfer-handle-start')) {
                            resize = 'start';
                        } else if (e.target.classList.contains('wavesurfer-handle-end')) {
                            resize = 'end';
                        }
                    } else if (PKAudioEditor.ui.KeyHandler.keyMap[16]) {
                        if (_this4.direction === 2) {
                            resize = 'end';

                            _this4.update({
                                start: _this4.start,
                                end: startTime
                            });
                        } else {
                            resize = 'start';
                            _this4.update({
                                start: startTime,
                                end: _this4.end
                            });
                        }
                    } else {
                        drag = true;
                        resize = false;
                    }
                };
                var onUp = function onUp(e) {
                    if (e.touches && e.touches.length > 1) {
                        return;
                    }
                    if (e.which === 3) {
                        return;
                    }

                    _this4.wavesurfer.Interacting &= ~(1 << 0);

                    if (drag || resize) {
                        drag = false;
                        scrollDirection = null;
                        resize = false;
                    }

                    if (updated) {
                        updated = false;
                        _this4.util.preventClick();
                        _this4.fireEvent('update-end', e);
                        _this4.wavesurfer.fireEvent('region-update-end', _this4, e);
                    }
                };
                var onMove = function onMove(e) {

                    if (e.touches && e.touches.length > 1) {
                        return;
                    }
                    if (e.which === 3) {
                        return;
                    }
                    if (e.targetTouches && e.targetTouches[0].identifier != touchId) {
                        return;
                    }

                    if (drag || resize) {
                        var oldTime = startTime;
                        var time = _this4.wavesurfer.ZoomifyValue(_this4.wavesurfer.drawer.handleEvent(e)) * duration;
                        var delta = time - startTime;
                        startTime = time;

                        if (_this4.drag && drag) {
                            updated = updated || !!delta;
                            _this4.onDrag(delta);
                        }

                        if (_this4.resize && resize) {
                            updated = updated || !!delta;
                            resize = _this4.onResize(delta, resize);
                        }

                        if (_this4.wavesurfer.ZoomFactor > 1) {
                            if (drag) {

                                var regionRect = _this4.element.getBoundingClientRect();
                                var x = regionRect.left - wrapperRect.left;

                                if (time < oldTime && x >= 0) {
                                    scrollDirection = -1;
                                } else if (time > oldTime && x + regionRect.width <= wrapperRect.right) {
                                    scrollDirection = 1;
                                }

                                if (scrollDirection === -1 && x > scrollThreshold || scrollDirection === 1 && x + regionRect.width < wrapperRect.right - scrollThreshold) {
                                    scrollDirection = null;
                                }
                            } else {

                                var _x = e.clientX - wrapperRect.left;

                                if (_x <= scrollThreshold) {
                                    scrollDirection = -1;
                                } else if (_x >= wrapperRect.right - wrapperRect.left - scrollThreshold) {
                                    scrollDirection = 1;
                                } else {
                                    scrollDirection = null;
                                }
                            }

                            scrollDirection && edgeScroll(e, scrollDirection);
                        }
                    }
                };

                _this4.element.addEventListener('mousedown', onDown);
                _this4.element.addEventListener('touchstart', onDown);

                _this4.wrapper.addEventListener('mousemove', onMove);
                _this4.wrapper.addEventListener('touchmove', onMove);

                document.body.addEventListener('mouseup', onUp);
                document.body.addEventListener('touchend', onUp);

                _this4.on('remove', function () {
                    document.body.removeEventListener('mouseup', onUp);
                    document.body.removeEventListener('touchend', onUp);
                    _this4.wrapper.removeEventListener('mousemove', onMove);
                    _this4.wrapper.removeEventListener('touchmove', onMove);

                    document.body.removeEventListener('pointerup', onUp);
                    _this4.wrapper.removeEventListener('pointermove', onMove);
                });

                _this4.wavesurfer.on('destroy', function () {
                    document.body.removeEventListener('pointerup', onUp);
                    document.body.removeEventListener('mouseup', onUp);
                    document.body.removeEventListener('touchend', onUp);
                });
            }();
        }
    }, {
        key: 'onDrag',
        value: function onDrag(delta) {
            var maxEnd = this.wavesurfer.getDuration();
            if (this.end + delta > maxEnd || this.start + delta < 0) {
                return;
            }

            this.update({
                start: this.start + delta,
                end: this.end + delta
            });
        }
    }, {
        key: 'onResize',
        value: function onResize(delta, direction) {
            var snap = this.wavesurfer.SnapTime;
            if (snap) {
                var edge = direction == 'start' ? this.start + delta : this.end + delta;
                delta = snap(edge) - (direction == 'start' ? this.start : this.end);
            }

            if (direction == 'start') {
                if (this.start + delta > this.end)
                {
                    direction = 'end';

                    this.update({
                        start: this.end,
                        end: this.start + delta
                    });
                }
                else
                {
                    this.update({
                        start: Math.min(this.start + delta, this.end),
                        end: Math.max(this.start + delta, this.end)
                    });
                }
            } else {
                if (this.start > this.end + delta)
                {
                    direction = 'start';

                    this.update({
                        start: this.start + delta,
                        end: this.start
                    });
                }
                else
                {
                    this.update({
                        start: Math.min(this.end + delta, this.start),
                        end: Math.max(this.end + delta, this.start)
                    });
                }
            }

            return direction;
        }
    }]);

    return Region;
}();

var RegionsPlugin = function () {
    _createClass(RegionsPlugin, null, [{
        key: 'create',

        value: function create(params) {
            return {
                name: 'regions',
                deferInit: params && params.deferInit ? params.deferInit : false,
                params: params,
                instance: RegionsPlugin
            };
        }
    }]);

    function RegionsPlugin(params, ws) {
        var _this5 = this;

        _classCallCheck(this, RegionsPlugin);

        this.params = params;
        this.wavesurfer = ws;
        this.util = ws.util;

        var observerPrototypeKeys = Object.getOwnPropertyNames(this.util.Observer.prototype);
        observerPrototypeKeys.forEach(function (key) {
            Region.prototype[key] = _this5.util.Observer.prototype[key];
        });
        this.wavesurfer.Region = Region;

        this.list = {};
        this._onReady = function () {
            _this5.wrapper = _this5.wavesurfer.drawer.wrapper;
            if (_this5.params.regions) {
                _this5.params.regions.forEach(function (region) {
                    _this5.add(region);
                });
            }
            if (_this5.params.dragSelection) {
                _this5.disableDragSelection();
                _this5.enableDragSelection(_this5.params);
            }
        };
    }

    _createClass(RegionsPlugin, [{
        key: 'init',
        value: function init() {

            if (this.wavesurfer.isReady) {
                this._onReady();
            }
            this.wavesurfer.on('ready', this._onReady);
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            this.wavesurfer.un('ready', this._onReady);
            this.disableDragSelection();
            this.clear();
        }

    }, {
        key: 'add',
        value: function add(params) {
            var _this6 = this;

            if (this.list[0]) {
                this.clear();
            }

            var region = new this.wavesurfer.Region(params, this.wavesurfer);

            this.list[0] = region;

            region.on('remove', function () {
                delete _this6.list[0];
            });

            if (params.id === 't')
            {
                this.wavesurfer.fireEvent('region-update-end', region, null);
            }

            return region;
        }

    }, {
        key: 'clear',
        value: function clear() {
            var _this7 = this;

            Object.keys(this.list).forEach(function (id) {
                _this7.list[id].remove();
            });
        }
    }, {
        key: 'enableDragSelection',
        value: function enableDragSelection(params) {
            var _this8 = this;

            var slop = params.slop || 2;
            var container = this.wavesurfer.drawer.container;
            var scroll = params.scroll !== false && this.wavesurfer.params.scrollParent;
            var scrollSpeed = params.scrollSpeed || 1;
            var scrollThreshold = params.scrollThreshold || 28;
            var drag = void 0;
            var duration = this.wavesurfer.getDuration();
            var maxScroll = void 0;
            var start = void 0;
            var region = void 0;
            var touchId = void 0;
            var pxMove = 0;
            var scrollDirection = void 0;
            var wrapperRect = void 0;

            var edgeScroll = function edgeScroll(e, direction) {
                if (!region || !scrollDirection) {
                    return;
                }

                var scroll_speed = scrollSpeed;
                var rect = _this8.wavesurfer.drawer.wrapper.getBoundingClientRect();
                if (direction === -1) {
                    var multiplier = Math.abs(rect.left - e.clientX) - 10;
                    if (multiplier > 0) scroll_speed *= multiplier / 2;
                } else if (direction === 1) {

                    var multiplier = Math.abs(e.clientX - rect.right) - 10;
                    if (multiplier > 0) scroll_speed *= multiplier / 2;
                }

                var scrollLeft = scroll_speed * scrollDirection / _this8.wavesurfer.getDuration();
                _this8.wavesurfer.LeftProgress += scrollLeft;

                if (_this8.wavesurfer.LeftProgress < 0) _this8.wavesurfer.LeftProgress = 0;else if (_this8.wavesurfer.LeftProgress + _this8.wavesurfer.VisibleDuration > _this8.wavesurfer.getDuration()) {
                    _this8.wavesurfer.LeftProgress = _this8.wavesurfer.getDuration() - _this8.wavesurfer.VisibleDuration;
                }

                _this8.wavesurfer.ForceDraw();

                var end = _this8.wavesurfer.ZoomifyValue(_this8.wavesurfer.drawer.handleEvent(e));
                if (_this8.wavesurfer.SnapTime) end = _this8.wavesurfer.SnapTime(end * duration) / duration;
                region.update({
                    start: Math.min(end * duration, start * duration),
                    end: Math.max(end * duration, start * duration)
                });

                _this8.wavesurfer.fireEvent ('DidZoom');

                if (Math.abs(scrollLeft) > 0) {
                    window.requestAnimationFrame(function () {
                        edgeScroll(e, direction);
                    });
                }
            };

            var right_mouse = null;

            var eventDown = function eventDown(e) {
                right_mouse = null;
                if (e.touches)
                {
                    e.preventDefault ();
                    if (e.touches.length > 1) {
                        return;
                    }
                }
                if (e.which === 3) {
                    right_mouse = {x:e.pageX, y:e.pageY};
                    return;
                }

                _this8.wavesurfer.Interacting |= 1 << 0;
                duration = _this8.wavesurfer.getDuration();
                touchId = e.targetTouches ? e.targetTouches[0].identifier : null;

                maxScroll = _this8.wrapper.scrollWidth - _this8.wrapper.clientWidth;
                wrapperRect = _this8.wrapper.getBoundingClientRect();

                drag = true;
                start = _this8.wavesurfer.ZoomifyValue(_this8.wavesurfer.drawer.handleEvent(e, true));
                if (_this8.wavesurfer.SnapTime) start = _this8.wavesurfer.SnapTime(start * duration) / duration;

                region = null;
                scrollDirection = null;

                document.body.addEventListener('mousemove', eventMove);
                document.body.addEventListener('touchmove', eventMove);

                if (PKAudioEditor.ui.KeyHandler.keyMap[16]) {
                    var orig_marker = _this8.wavesurfer.ActiveMarker;
                    e.stopPropagation();e.preventDefault();

                    region = _this8.wavesurfer.regions.list[0];
                    var direction = 2;

                    var durr = _this8.wavesurfer.getDuration();
                    var _end = _this8.wavesurfer.drawer.handleEvent(e);
                    _end = _this8.wavesurfer.ZoomifyValue(_end);

                    if (_end < orig_marker) {
                        if (region && region.start) {
                            orig_marker = _end;
                            _end = region.end / durr;
                        } else {
                            var tmp = orig_marker;
                            orig_marker = _end;
                            _end = tmp;
                        }
                        direction = 1;
                    }

                    var snap = _this8.wavesurfer.SnapTime;
                    if (snap) {
                        orig_marker = snap(orig_marker * durr) / durr;
                        _end = snap(_end * durr) / durr;
                    }

                    if (region) {
                        region.update({
                            start: Math.min(orig_marker, _end) * durr,
                            end: Math.max(orig_marker, _end) * durr
                        });
                        region.direction = direction;
                        start = direction === 1 ? _end : orig_marker;

                    } else {
                        _this8.wavesurfer.regions.add({
                            start: Math.min(orig_marker, _end) * durr,
                            end: Math.max(orig_marker, _end) * durr,
                            id: 't',
                            direction: direction
                        });
                        region = _this8.wavesurfer.regions.list[0];
                        region.direction = direction;

                        start = direction === 1 ? _end : orig_marker;

                        setTimeout(function () {
                            PKAudioEditor.fireEvent('RequestSeekTo', orig_marker);
                        }, 20);
                    }

                }

            };

                this.wrapper.addEventListener('mousedown', eventDown);
                this.wrapper.addEventListener('touchstart', eventDown);

            this.on('disable-drag-selection', function () {
                _this8.wrapper.removeEventListener('touchstart', eventDown);
                _this8.wrapper.removeEventListener('mousedown', eventDown);
                _this8.wrapper.removeEventListener('pointerdown', eventDown);
            });

            var eventUp = function eventUp(e) {
                if (e.touches && e.touches.length > 1) {
                    return;
                }

                if (e.which === 3)
                {

                    if (right_mouse)
                    {
                        if (Math.abs (right_mouse.x - e.pageX) < 3 &&  Math.abs (right_mouse.y - e.pageY) < 7)
                        {
                            var event = document.createEvent('Event');
                            event.initEvent('pk_ctxmn', true, true);
                            event.pageX = e.pageX;
                            event.pageY = e.pageY;

                            e.target.dispatchEvent(event);
                        }

                        right_mouse = null;
                    }

                    return;
                }

                _this8.wavesurfer.Interacting &= ~(1 << 0);

                if (drag)
                {
                    document.body.removeEventListener('mousemove', eventMove);
                    document.body.removeEventListener('touchmove', eventMove);
                }

                drag = false;
                pxMove = 0;
                scrollDirection = null;

                if (region) {
                    _this8.util.preventClick();
                    region.fireEvent('update-end', e);
                    _this8.wavesurfer.fireEvent('region-update-end', region, e);
                }

                region = null;
            };
            this.wrapper.addEventListener('mouseup', eventUp);
            this.wrapper.addEventListener('touchend', eventUp);

            document.body.addEventListener('mouseup', eventUp);
            document.body.addEventListener('touchend', eventUp);
            this.on('disable-drag-selection', function () {
                document.body.removeEventListener('mouseup', eventUp);
                document.body.removeEventListener('touchend', eventUp);
                _this8.wrapper.removeEventListener('touchend', eventUp);
                _this8.wrapper.removeEventListener('mouseup', eventUp);
            });

            var eventMove = function eventMove(e) {
                if (!drag) {
                    return;
                }
                if (e.which === 3) {
                    return;
                }
                if (++pxMove <= slop) {
                    return;
                }

                if (e.touches && e.touches.length > 1) {
                    return;
                }
                if (e.targetTouches && e.targetTouches[0].identifier != touchId) {
                    return;
                }

                if (!region) {
                    region = _this8.add(params || {});
                }

                var end = _this8.wavesurfer.ZoomifyValue(_this8.wavesurfer.drawer.handleEvent(e));
                if (_this8.wavesurfer.SnapTime) end = _this8.wavesurfer.SnapTime(end * duration) / duration;
                region.update({
                    start: Math.min(end * duration, start * duration),
                    end: Math.max(end * duration, start * duration)
                });

                if (_this8.wavesurfer.ZoomFactor > 1) {

                    var x = e.clientX - wrapperRect.left;
                    if (x <= scrollThreshold) {
                        scrollDirection = -1;
                    } else if (x >= wrapperRect.right - wrapperRect.left - scrollThreshold) {
                        scrollDirection = 1;
                    } else {
                        scrollDirection = null;
                    }
                    scrollDirection && edgeScroll(e, scrollDirection);
                }
            };

            this.on('disable-drag-selection', function () {

                    document.body.removeEventListener('mousemove', eventMove);
                    document.body.removeEventListener('touchmove', eventMove);

            });
        }
    }, {
        key: 'disableDragSelection',
        value: function disableDragSelection() {
            this.fireEvent('disable-drag-selection');
        }

    }]);

    return RegionsPlugin;
}();

exports.default = RegionsPlugin;
module.exports = exports['default'];

  })

  });
});
