/*
 * name: zImage slider
 * version: 2.1.1
 * author: creeper yang
 * description: a jQuery image slider plugin.
*/

;(function($){

    $.fn.zImageSlider = function(options){
        var opts = $.extend({}, $.fn.zImageSlider.defaults, options);
        
        return this.each(function() {
            var $self = $(this);
            if(!$self.data('z-image-slider-instance')) {
                $self.data('z-image-slider-instance', new Slider($self, opts));
            }
        });
    };

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
        } else {
            this.init(options);
        }
    };

    Slider.prototype.init = function(options) {
        var $dotWrap = $('<div class="slider-indicator"></div>');
        var self = this,
            count = self.count,
            $slider = self.$wrap,
            $items = self.$items,
            $stage = self.$stage,
            index = self.index;

        self.startPos = 0;
        self.endPos = 0;
        self.touching = false;
        self.distance = options.slidePercent * self.width;
        self.transitionClass = options.transitionClass;
        self.afterImageChanged = options.afterImageChanged;
        self.speed = options.speed;
        self.autoPlay = options.autoPlay;

        // init items
        /*$items.css('width', self.width);
        $stage.css('height', $items.height());*/
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
    
        // event handler
        $stage.on("touchstart", function(ev) {
            var touch = ev.touches || ev.originalEvent.touches;
            self.touching = true;
            self.startY = touch[0].pageY;
            moveStart.call(this, ev, touch[0].pageX, self);
        }).on("touchmove", function(ev){
            var touch = ev.changedTouches || ev.originalEvent.changedTouches;
            self.endY = touch[0].pageY;
            move.call(this, ev, touch[0].pageX, self);
        });
        $(window).on("touchend", function(ev) {
            self.touching = false;
            moveEnd.call(this, ev, self);
        });

        $stage.on("mousedown", function(ev) {
            ev.preventDefault();

            moveStart.call(this, ev, ev.pageX, self);
        }).on("mousemove", function(ev){
            move.call(this, ev, ev.pageX, self);
        });
        $(window).on("mouseup", function(ev) {
            moveEnd.call(this, ev, self);
        });

        // autoplay
        if(self.autoPlay) {
            if(self.timer) {
                clearInterval(self.timer);
            }
            toAutoplay(self);
        }
    };

    function toAutoplay(self) {
        self.timer = setInterval(function() {
            self.next();
        }, self.speed * 1000);
    };

    function moveStart(ev, startX, slider) {
        var left = slider.$stage.css("left");
        if(left.indexOf('px') > 0) {
            left = left.replace('px', '');
        }
        slider.leftPercent = Math.ceil(+left) / slider.width;
        slider.startX = startX;
        slider.action = true;
        slider.endX = 0;
        if(slider.timer) { // stop autoplay
            clearInterval(slider.timer);
        }
    };
    function move(ev, endX, slider) {
        if(!slider.action) return;
        var diffY, 
            diffX,
            scroll = false;
        slider.endX = endX;
        diffY = slider.endY - slider.startY;
        diffX = slider.endX - slider.startX;
        if(slider.touching) {
            if(Math.abs(diffY) > 10) {
                scroll = true;
            } else {
                ev.preventDefault();
            }
        }
        var percent = (slider.leftPercent + diffX / slider.width) * 100 + '%';
        slider.$stage.css({
            'left': percent
        });
        if(scroll) {
            // Android 4.0 will not fire touchend event
            $(this).trigger('touchend');
        }
    };
    function moveEnd(ev, slider) {
        if(!slider.action){
            return;
        }
        slider.action = false;
        var diffX = slider.endX - slider.startX;
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
        }, 500);
    };

    // expose defaults
    $.fn.zImageSlider.defaults = {
        slidePercent: 0.3, //拖动超过多少百分比后才翻页
        autoPlay: true, // 是否开启自动轮播
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

})(jQuery);
