/*
 * @name: zImage slider
 * @version: 2.2.1
 * @author: creeper yang
 * @description: a zepto/jQuery image slider plugin.
*/

;(function($){

    var isJQuery = window.jQuery === $,
        EventNamespaceSplitor = isJQuery ? '.' : ':';

    function Slider($slider, options) {
        this.$wrap = $slider;
        this.$stage = $slider.find(options.contentWrap);
        this.$items = $slider.find(options.itemWrap);
        this.index = 0;
        this.count = this.$items.length;
        this.status = 'ready';
        this.width = $slider.width();
        this.enableFixedHeight = options.enableFixedHeight;
        this.fixedHeight = options.fixedHeight;
        this.$items.css('width', this.width);
        if(this.enableFixedHeight) {
            this.$stage.css({
                'height': this.fixedHeight + 'px'
            }).addClass('height-fixed');
            this.$items.children('img').css('height', '100%');
        } else {
            this.$stage.css('height', this.$items.height());
        }
        if(this.count < 1) {
            throw new Error('Error: no image item!');
        } else if(this.count === 1) {
            this.$stage.css('left', 0);
            // only trigger tap, no slide
            var action = false,
                initX = 0;
            this.$items.eq(0).on('touchstart', function(ev) {
                action = true;
                initX = getCoord(ev, 'X');
            }).on('touchend', function(ev) {
                if(action) {
                    action = false;
                    if(Math.abs(getCoord(ev, 'X') - initX) < 5) {
                        $(this).trigger('tap' + EventNamespaceSplitor +'zImageSlider');
                    }
                }
            });
        } else {
            this.init(options);
        }
    }

    function getCoord(e, c) {
        return /touch/.test(e.type) ? (e.originalEvent || e).changedTouches[0]['page' + c] : e['page' + c];
    }

    function toAutoplay(self) {
        self.timer = setInterval(function() {
            self.next();
        }, self.speed * 1000);
    };

    function moveStart(ev, slider) {
        var left = slider.$stage.css("left");
        if(left.indexOf('px') > 0) {
            left = left.replace('px', '');
        }
        slider.leftPercent = Math.ceil(+left) / slider.width;
        if(slider.timer) { // stop autoplay
            clearInterval(slider.timer);
        }
    };
    function move(ev, slider, diffX) {
        var percent = (slider.leftPercent + diffX / slider.width) * 100 + '%';
        slider.$stage.css({
            'left': percent
        });
    };
    function moveEnd(ev, slider, diffX) {
        if(Math.abs(diffX) > slider.distance){
            diffX < 0 ? slider.next() : slider.previous();
        } else {
            slider.current();
        }

        if(slider.autoPlay) {
            toAutoplay(slider);
        }
    };

    function reset($stage, $items, index, count) {
        $items.removeClass('z-item-show')
            .removeClass('z-item-current')
            .removeClass('z-item-next')
            .removeClass('z-item-previous');
        if(count === 2) {
            $stage.find('.z-item-del').remove();
            if(index === 0) {
                $stage.prepend($items.eq(1).clone().addClass('z-item-show z-item-previous z-item-del'));
                $items.eq(1).addClass('z-item-show z-item-next');
            } else {
                $stage.append($items.eq(0).clone().addClass('z-item-show z-item-next z-item-del'));
                $items.eq(0).addClass('z-item-show z-item-previous');
            }
        } else {
            $items.eq((index + 1) % count).addClass('z-item-show z-item-next');
            $items.eq((index + count - 1) % count).addClass('z-item-show z-item-previous');
        }
        $items.eq(index).addClass('z-item-show z-item-current');
        $items.not('.z-item-show').hide();
        $items.filter('.z-item-show').show();
        $stage.css('left', '-100%');
    }

    function display(slider, direction, cb) {
        var self = slider,
            count = self.count,
            index = self.index,
            $stage = self.$stage,
            $indicator = self.$indicator,
            transitionClass = self.transitionClass,
            cur, pre, next, distance;
        if(direction === 0) {
            cur = index;
            distance = 0;
        } else if(direction < 0) {
            pre = index;
            cur = (index + 1) % count;
            next = (index + 2) % count;
            distance = 1;
        } else {
            pre = (index + count - 2) % count;
            cur = (index + count - 1) % count;
            next = index;
            distance = -1;
        }
        //alert(-(distance + 1) * 100)
        $stage.addClass(transitionClass).css({
            'left': -(distance + 1) * 100 + '%'
        });
        $indicator.find(".slider-indicator-dot").removeClass("active");
        $indicator.find(".slider-indicator-dot:nth-child(" + (cur + 1) + ")").addClass("active");
        var timeout = setTimeout(function() {
            $stage.removeClass(transitionClass);
            clearTimeout(timeout);
            if(cb) cb(pre, cur, next);
            if(typeof self.afterImageChanged === 'function') {
                self.afterImageChanged(pre, cur, next, self);
            }
            self.$items.eq(cur).trigger('slide' + EventNamespaceSplitor + 'zImageSlider');
        }, 500);
    }

    Slider.prototype.init = function(options) {
        var $dotWrap = $('<div class="slider-indicator"></div>');
        var self = this,
            count = self.count,
            $slider = self.$wrap,
            $items = self.$items,
            $stage = self.$stage,
            index = self.index;

        self.distance = options.slidePercent * self.width;
        self.transitionClass = options.transitionClass;
        self.afterImageChanged = options.afterImageChanged;
        self.speed = options.speed;
        self.autoPlay = options.autoPlay;

        // init items
        reset($stage, $items, index, count);
        

        // init indicator
        for(var i = 0; i < count; i++) {
            $dotWrap.append('<span class="slider-indicator-dot"></span>');
        }
        self.$indicator = $dotWrap;
        $slider.append($dotWrap);
        $dotWrap.css({
            left: ($slider.width() - $dotWrap.width()) / 2 + 'px'
        }).find('span:nth-child(' + (index + 1) + ')').addClass('active');
    
        self.bindEvents();

        // autoplay
        if(self.autoPlay) {
            if(self.timer) {
                clearInterval(self.timer);
            }
            toAutoplay(self);
        }
    };

    Slider.prototype.bindEvents = function() {
        var self = this,
            $stage = self.$stage;

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
            swipe;

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
                moveStart(ev, self);

                sortTimer = setTimeout(function() {
                    sort = true;
                }, 200);

                if (ev.type == 'mousedown') {
                    ev.preventDefault();
                    $(document).on('mousemove', onMove).on('mouseup', onEnd);
                }
            }
        }

        function onMove(ev) {
            if (action) {
                endX = getCoord(ev, 'X');
                endY = getCoord(ev, 'Y');
                diffX = endX - startX;
                diffY = endY - startY;

                if (!sort && !swipe && !scroll) {
                    if (Math.abs(diffY) > 10) { // It's a scroll
                        scroll = true;
                        // Android 4.0 will not fire touchend event
                        $(this).trigger('touchend');
                    } else if (Math.abs(diffX) > 7) { // It's a swipe
                        swipe = true;
                    }
                }

                if (swipe) {
                    ev.preventDefault(); // Kill page scroll
                    // Handle swipe
                    move(ev, self, diffX);
                }

                if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
                    clearTimeout(sortTimer);
                }
            }
        }

        function onEnd(ev) {
            if (action) {
                action = false;

                if (swipe) {
                    // Handle swipe end
                    moveEnd(ev, self, diffX);
                } else if (sort) {
                    // Handle sort end
                    
                } else if (!scroll && Math.abs(diffX) < 5 && Math.abs(diffY) < 5) { // Tap
                    if (ev.type === 'touchend') { // Prevent phantom clicks
                        ev.preventDefault();
                    }
                    // Handle tap
                    self.$items.eq(self.index).trigger('tap' + EventNamespaceSplitor +'zImageSlider');
                }

                swipe = false;
                sort = false;
                scroll = false;

                clearTimeout(sortTimer);

                if (ev.type == 'mouseup') {
                    $(document).off('mousemove', onMove).off('mouseup', onEnd);
                }
            }
        }

        $stage.on('touchstart mousedown', onStart)
            .on('touchmove', onMove)
            .on('touchend touchcancel', onEnd);
    };

    Slider.prototype.next = function() {
        var self = this;
        display(self, -1, function(pre, cur, next) {
            self.index = cur;
            reset(self.$stage, self.$items, cur, self.count);
        });
    };

    Slider.prototype.previous = function() {
        var self = this;
        display(self, 1, function(pre, cur, next) {
            self.index = cur;
            reset(self.$stage, self.$items, cur, self.count);
        });
    };

    Slider.prototype.current = function() {
        display(this, 0);
    };

    $.fn.zImageSlider = function(options){
        var opts = $.extend({}, $.fn.zImageSlider.defaults, options);
        
        return this.each(function() {
            var $self = $(this);
            if($self.data('z-image-slider-instance') === undefined) {
                var instance, index;
                if(!window.zImageSliders) {
                    window.zImageSliders = [];
                    index = 0;
                } else {
                    index = window.zImageSliders.length - 1;
                }
                $self.data('z-image-slider-instance', index);
                window.zImageSliders.push(new Slider($self, opts));
            }
        });
    };

    // expose defaults
    $.fn.zImageSlider.defaults = {
        slidePercent: 0.3, //拖动超过多少百分比后才翻页
        autoPlay: false, // 是否开启自动轮播
        speed: 6, // 自动轮播间隔， 单位秒
        contentWrap: ".image-list",
        itemWrap: '.image-item',
        enableFixedHeight: true, // if want to fix height, set to true
        fixedHeight: 160, // px, image height, will be used if `enableFixedHeight` is true.
        indicator: ".image-indicator",
        transitionClass: 'z-image-slide-transition',
        afterImageChanged: null
    };

    // auto discover
    var $autoSliders = $('.image-slider[data-z-image-slider="true"]');
    $autoSliders.zImageSlider();

})(window.Zepto || window.jQuery);
