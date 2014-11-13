;
(function($) {

    var $window = $(window);

    // make sure this must be image(list);
    $.fn.zScrollPin = function(options) {
        var opts = $.extend({}, $.fn.zScrollPin.defaults, options);
        var instance = this.data('z-scroll-pin-instance');
        if (!instance) {
            this.data('z-scroll-pin-instance', new ScrollPin(this, opts));
        } 
        return this;
    };

    function ScrollPin($el, options) {
        var self = this;
        self.top = $el.offset().top;
        self.fixClass = options.fixClass || 'fixed-to-top';
        self.afterScroll = options.afterScroll;
        self.$el = $el;

        var scroll = throttle(function() {
            var scrollTop = $window.scrollTop();
            if(self.top <= scrollTop) {
                self.$el.addClass(self.fixClass);
                if(typeof self.afterScroll === 'function') {
                    self.afterScroll('success', scrollTop);
                }
            } else {
                self.$el.removeClass(self.fixClass);
                if(typeof self.afterScroll === 'function') {
                    self.afterScroll('fail', scrollTop);
                }
            }
        }, 150);
        $window.on('scroll', scroll);
    };

    // 函数节流， 规定时间内只执行一次
    function throttle(func, wait) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        var later = function() {
            previous = current();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        };
        return function() {
            var now = current();
            if (!previous) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
                clearTimeout(timeout);
                timeout = null;
                previous = now;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            } else if (!timeout) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    };

    function current() {
        return Date.now() || new Date().getTime();
    };


    // expose defaults
    $.fn.zScrollPin.defaults = {
        fixClass: 'fixed-to-top'
    };

})(jQuery);
