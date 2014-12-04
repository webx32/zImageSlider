/**
 * @name zImageSlider
 * @version 4.0.0
 * @author creeper yang (yangcreeper@hotmail.com)
 * @description 原生JS图片轮播插件，支持移动端浏览器和现代浏览器。
*/

!(function() {

    /**
     * 图片轮播
     * @name    Slider
     * @param   {String/DOM}  wrapSelector  wrap选择器，或DOM元素。
     * @param   {String/Array}  itemSelector  item选择器，或DOM元素数组。
     * @param   {Object}  配置项，可选。
     * @return  {Object}  Slider实例
     */
    function Slider(wrapSelector, itemSelector, options) {
        if(!wrapSelector || !itemSelector) {
            return warn('Slider: arguments error.');
        }
        var list, 
            wrap;
        list = typeof itemSelector === 'string' ? document.querySelectorAll(itemSelector) : itemSelector;
        wrap = typeof wrapSelector === 'string' ? document.querySelector(wrapSelector) : wrapSelector;
        // 可以更多检测来提高健壮性，但简单计，默认参数是合法的dom元素（列表）
        if(!list || !list.length || !wrap) {
            return warn('Slider: wrap or item is empty.');
        }

        // 合并默认配置
        options = options || {};
        for (var name in defaults) {
            if (options[name] === undefined) {
                options[name] = defaults[name];
            }
        }

        this.options = options;
        this.list = Array.prototype.slice.call(list); // list is a StaticNodeList rather than a real array
        this.wrap = wrap;
        this.count = list.length;
        this.width = +window.innerWidth;
        this.timer = null;
        this.current = options.current;
        this.compareDistance = 0;

        if(this.count === 1) return;

        this.prepare(options.current);
        this.bindEvents();
        if(options.autoplay) {
            this.interval = Math.max(2000, options.interval * 1000);
            this.autoplay();
        }
        if(options.minPercentToSlide) {
            this.compareDistance = this.width * options.minPercentToSlide;
        }
    };

    Slider.version = '4.0.0';

    Slider.prototype.bindEvents = function() {
        var self = this,
            list = self.list,
            wrap = self.wrap,
            options = self.options;

        var touch,
            action,
            diffX,
            diffY,
            endX,
            endY,
            scroll,
            sort,
            startX,
            startY,
            swipe,
            sortTimer;

        function getCoord(e, c) {
            return /touch/.test(e.type) ? (e.originalEvent || e).changedTouches[0]['page' + c] : e['page' + c];
        }

        function testTouch(e) {
            if (e.type == 'touchstart') {
                touch = true;
            } else if (touch) {
                touch = false;
                return false;
            }
            return true;
        }

        function onStart(ev) {
            if (testTouch(ev) && !action) {
                action = true;

                startX = getCoord(ev, 'X');
                startY = getCoord(ev, 'Y');
                diffX = 0;
                diffY = 0;
                startHandler(ev, self);

                sortTimer = setTimeout(function() {
                    sort = true;
                }, 200);

                if (ev.type === 'mousedown') {
                    ev.preventDefault();
                    document.addEventListener('mousemove', onMove, false);
                    document.addEventListener('mouseup', onEnd, false);
                }
            }
        }

        function onMove(ev) {
            var e;
            if (action) {
                endX = getCoord(ev, 'X');
                endY = getCoord(ev, 'Y');
                diffX = endX - startX;
                diffY = endY - startY;
                if (!sort && !swipe && !scroll) {
                    if (Math.abs(diffY) > 10) { // It's a scroll
                        scroll = true;
                        // Android 4.0 will not fire touchend event
                        e = createEvent('touchend', true, true);
                        this.dispatchEvent(e);
                    } else if (Math.abs(diffX) > 7) { // It's a swipe
                        swipe = true;
                    }
                }

                if (swipe) {
                    ev.preventDefault(); // Kill page scroll
                    moveHandler(ev, self, diffX); // Handle swipe
                }

                if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
                    clearTimeout(sortTimer);
                }
            }
        }

        function onEnd(ev) {
            var e;
            if (action) {
                action = false;

                if (swipe) {
                    // Handle swipe end
                    endHandler(ev, self, diffX);

                    // trigger 'swipeend'
                    e = createEvent('swipeend', true, true);
                    e.slider = self;
                    e.currentItem = list[0];
                    list[0].dispatchEvent(e);
                } else if (sort) {
                    // Handle sort end
                    e = createEvent('sort', true, true);
                    e.slider = self;
                    e.currentItem = list[0];
                    list[0].dispatchEvent(e);
                } else if (!scroll && Math.abs(diffX) < 5 && Math.abs(diffY) < 5) { // Tap
                    if (ev.type === 'touchend') { // Prevent phantom clicks
                        ev.preventDefault();
                    }
                    // Handle tap
                    e = createEvent('tap', true, true);
                    e.slider = self;
                    e.currentItem = list[0];
                    list[0].dispatchEvent(e);
                }

                swipe = false;
                sort = false;
                scroll = false;

                clearTimeout(sortTimer);

                if (ev.type == 'mouseup') {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onEnd);
                }
            }
        }

        wrap.addEventListener('mousedown', onStart, false);
        wrap.addEventListener('touchstart', onStart, false);
        wrap.addEventListener('touchmove', onMove, false);
        wrap.addEventListener('touchend', onEnd, false);
        wrap.addEventListener('touchcancel', onEnd, false);
    };

    Slider.prototype.prepare = function(indexToShow) {
        var list = this.list,
            len = this.count,
            wrap = this.wrap,
            width = this.width,
            lastIndex,
            tmpList,
            item,
            first, last, clone;
        if(len === 2) {
            // clone and insert to dom
            clone = list[0].cloneNode(true);
            wrap.appendChild(clone);
            this.list.push(clone);
            clone = list[1].cloneNode(true);
            wrap.appendChild(clone);
            this.list.push(clone);
            len = this.count = 4;
            this.realCount = 2;
        } 
        lastIndex = len - 1;
        if(indexToShow > lastIndex || indexToShow < 0) indexToShow = 0;
        if(indexToShow !== 0) { 
            tmpList = list.splice(indexToShow, len - indexToShow);
            this.list = tmpList.concat(list);
            list = this.list;
        }
        first = list[0];
        first.uuid = 0;
        setCompatibleStyle(first, 'transform', "translate3d(0, 0, 0)");
        last = list[lastIndex];
        last.uuid = lastIndex;
        setCompatibleStyle(last, 'transform', "translate3d(-" + width + "px, 0, 0)");
        for (var i = 1; i < lastIndex; i++) {
            item = list[i];
            item.uuid = i;
            setCompatibleStyle(item, 'transform', "translate3d(" + width + "px, 0, 0)")
        };
        prepareIndicator(this, this.realCount || len, indexToShow, 'active');
    };

    Slider.prototype.autoplay = function() {
        var self = this,
            direction = self.options.autoplayDirection,
            interval = self.interval;
        self.timer = setInterval(function() {
            self.slide(direction);
        }, interval);
    };

    var prepareIndicator = function(slider, howMany, activeIndex, activeClass) {
        var indicators = [],
            indicatorWrap = document.createElement('div'),
            item,
            tmpWidth,
            i;
        for(i = 0; i < howMany; i++) {
            item = document.createElement('span');
            item.className = 'z-slide-dot';
            indicators.push(item);
            indicatorWrap.appendChild(item);
        }
        indicators[activeIndex].className = 'z-slide-dot ' + activeClass;
        indicatorWrap.className = 'z-slide-indicator';
        slider.wrap.appendChild(indicatorWrap);
        tmpWidth = +window.getComputedStyle(indicatorWrap).width.replace('px', '');
        indicatorWrap.style.left = ((slider.width - tmpWidth) / 2) + 'px';
        slider.indicators = indicators;
    };

    var updateIndicator = function(indicators, pre, cur) {
        indicators[pre].className = 'z-slide-dot';
        indicators[cur].className = 'z-slide-dot active';
    };

    //手指按下的处理事件
    var startHandler = function(ev, slider) {
        var self = slider,
            timer = self.timer,
            autoplay = self.options.autoplay;
        autoplay && clearInterval(timer);
    };

    var moveHandler = function(ev, slider, diffX) {
        var self = slider,
            list = self.list,
            len = self.count,
            width = self.width,
            cur = list[0],
            pre = list[len - 1],
            next = list[1];
        setTransition(pre, cur, next, '');
        move(pre, cur, next, diffX, width);
    };

    var endHandler = function(ev, slider, diffX) {
        var self = slider,
            autoplay = self.options.autoplay,
            transitionDuration = self.options.transitionDuration * 1000,
            direction;
        direction = diffX < 0 ? 'left' : 'right';
        if(Math.abs(diffX) < self.compareDistance) {
            direction = 'restore';
        }
        self.slide(direction, diffX);
        autoplay && self.autoplay();
    };

    Slider.prototype.slide = function(direction, diffX) {
        var self = this,
            list = self.list,
            index = self.current,
            len = self.count,
            width = self.width,
            transitionDuration = self.options.transitionDuration,
            diffX = diffX || 0,
            transitionText,
            cur, pre, next;
        if(direction === 'left') {
            list.push(list.shift());
            self.current = (index + 1) % len;
            transitionDuration *= 1 - Math.abs(diffX) / width;
        } else if(direction === 'right'){
            list.unshift(list.pop());
            self.current = (index - 1 + len) % len;
            transitionDuration *= 1 - Math.abs(diffX) / width;
        } else {
            transitionDuration *= Math.abs(diffX) / width;
        }
        cur = list[0];
        pre = list[len - 1];
        next = list[1];
        transitionText = 'transform ' + transitionDuration + 's linear';
        if(direction === 'left' || (direction === 'restore' && diffX > 0)) {
            setTransition(pre, cur, next, transitionText, transitionText, '');
        } else if(direction === 'right' || (direction === 'restore' && diffX < 0)) {
            setTransition(pre, cur, next, '', transitionText, transitionText);
        } 
        move(pre, cur, next, 0, width);
        if(self.realCount === 2) {
            self.current = self.current % 2;
            updateIndicator(self.indicators, index % 2 , self.current);
        } else {
            updateIndicator(self.indicators, index, self.current);
        }
    };

    var move = function(pre, cur, next, distance, width) {
        setCompatibleStyle(cur, 'transform', 'translate3d(' + distance + 'px, 0, 0)' );
        setCompatibleStyle(pre, 'transform', 'translate3d(' + (distance - width) + 'px, 0, 0)' );
        setCompatibleStyle(next, 'transform', 'translate3d(' + (distance + width) + 'px, 0, 0)' );
    };

    var setTransition = function(pre, cur, next, preTransition, curTransition, nextTransition) {
        if(typeof preTransition === 'undefined') preTransition = '';
        if(typeof curTransition === 'undefined') curTransition = preTransition;
        if(typeof nextTransition === 'undefined') nextTransition = curTransition;
        setCompatibleStyle(pre, 'transition', preTransition);
        setCompatibleStyle(cur, 'transition', curTransition);
        setCompatibleStyle(next, 'transition', nextTransition);
    };

    /**
     * defaults: Slider默认配置项
    */
    var defaults = Slider.defaults = {
        'current': 0, // 初始化时显示项index
        'transitionDuration': 0.8, // 单位：秒
        'minPercentToSlide': null, // swipe至少多少距离时触发slide
        'autoplay': true,
        'autoplayDirection': 'left', // left/right
        'interval': 5 // 单位：秒，最好大于2
    };

    var isArray = Array.isArray || function (obj) {
        return ({}).toString.call(obj) === '[object Array]';
    };

    var warn = console.warn || console.log;

    var upperFirstChar = function(text) {
        var first = text[0],
            left = text.slice(1);
        return first.toUpperCase() + left;
    };

    var setCompatibleStyle = function(el, prop, value) {
        var tmpProp = upperFirstChar(prop),
            moz = 'moz' + tmpProp,
            webkit = 'webkit' + tmpProp;
        el.style[prop] = value;
        el.style[moz] && (el.style[moz] = value);
        el.style[webkit] && (el.style[webkit] = value);
    };

    var createEvent = function(type, bubbles, cancelable) {
        var e;
        if(window.Event) {
            e = new Event(type, {
                bubbles: bubbles,
                cancelable: cancelable
            });
        } else {
            e = document.createEvent('Event');
            e.initEvent(type, bubbles, cancelable);
        }
        return e;
    };


    // RequireJS && SeaJS
    if (typeof define === 'function') {
        define(function() {
            return Slider;
        });
    } else { // default exports to window
        this.Slider = Slider;
    }

})();
