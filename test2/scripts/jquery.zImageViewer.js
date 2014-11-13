/*
 * name: zImage viewer
 * version: 1.1.1
 * author: creeper yang
 * description: a jQuery image viewer plugin.
 */

;
(function($) {

    var $window = $(window),
        $body = $(document.body),
        winWidth = $window.width(),
        winHeight = $window.height();

    function calcImageSize(StageWidth, StageHeight) {
        return function(width, height) {
            var ratio1 = width / height,
                ratio2 = StageWidth / StageHeight,
                w, h;
            if (ratio1 > ratio2) {
                w = StageWidth;
                h = w / ratio1;
            } else {
                h = StageHeight;
                w = ratio1 * h;
            }
            return {
                width: w,
                height: h
            };
        }
    };

    var calcGoodImageSize = calcImageSize(winWidth, winHeight);

    // make sure this must be image(list);
    $.fn.zImageViewer = function(options) {
        var opts = $.extend({}, $.fn.zImageViewer.defaults, options);
        var instance = $body.data('z-image-viewer-instance');
        if (!instance) {
            $body.data('z-image-viewer-instance', new Viewer(this, opts));
        }
        return this;
    };

    function Viewer(images, options) {
        var self = this,
            $backdrop = $body.find('.z-image-viewer-backdrop');
        self.$images = images; // jquery object
        self.count = images.length;
        self.cloneList = [];
        self.distance = (options.percent || 0.05) * winWidth;
        self.duration = options.duration;
        if(options.enableUseItemContainer) {
            self.itemContainerClass = options.itemContainerClass;
            self.enableUseItemContainer = true;
        }

        // init backdrop
        if (!$backdrop.length) {
            self.$backdrop = $('<div class="z-image-viewer-backdrop"></div>');
            $body.append(self.$backdrop);
        } else {
            self.$backdrop = $backdrop;
        }

        images.each(function(i, item) {
            $(item).data('z-image-viewer-index', i);
        });

        self.bindEvents();
    };

    Viewer.prototype.bindEvents = function() {
        var self = this,
            $images = self.$images;

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
                    console.log('swipe moving')
                }

                if (sort) {
                    ev.preventDefault(); // Kill page scroll
                    // Handle sort
                    console.log('sort moving')
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
                    console.log('swipe')
                    self.slide(endX - startX);
                } else if (sort) {
                    // Handle sort end
                    
                } else if (!scroll && Math.abs(diffX) < 5 && Math.abs(diffY) < 5) { // Tap
                    if (ev.type === 'touchend') { // Prevent phantom clicks
                        ev.preventDefault();
                    }
                    // Handle tap
                    if(self.status !== 'running') {
                        var $img = $(ev.target),
                            index,
                            pos;
                        if(self.enableUseItemContainer && ev.target.tagName.toLowerCase() !== 'img') {
                            $img = $img.find('img');
                        }
                        index = $img.data('z-image-viewer-index'),
                        pos = $img.offset();
                        self.prepare(index, pos);
                        self.show();
                    } else {
                        self.hide();
                    }
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

        if(self.enableUseItemContainer) {
            $images.parent(self.itemContainerClass).on('touchstart mousedown', onStart)
                .on('touchmove', onMove)
                .on('touchend touchcancel', onEnd);
        } else {
            $images.on('touchstart mousedown', onStart)
                .on('touchmove', onMove)
                .on('touchend touchcancel', onEnd);
        }

        self.$backdrop.on('touchstart mousedown', 'img', onStart)
            .on('touchmove', 'img', onMove)
            .on('touchend touchcancel', 'img', onEnd);

        self.status = 'ready'; // 1. ready--ready to work; 2. running--working
    };

    function moveStart(ev, startX, viewer) {
        viewer.action = true;
        viewer.startX = startX;
        viewer.endX = startX; //prevent if tap but not swipe
    };

    function move(ev, endX, viewer) {
        if (!viewer.action) {
            return;
        }
        viewer.endX = endX;
    };

    function moveEnd(ev, viewer) {
        if (!viewer.action) {
            return;
        }
        viewer.action = false;
        var gap = viewer.endX - viewer.startX;
        if (Math.abs(gap) > viewer.distance) {
            viewer.slide(gap);
        } else {
            viewer.hide();
        }
    };

    Viewer.prototype.prepare = function(index, position) {
        var self = this,
            clone;
        self.scrollTop = $window.scrollTop(),
            self.scrollLeft = $window.scrollLeft();
        self.index = index;

        clone = self.cloneImage(index);
        clone.$el.css({
            'left': clone.left + 'px',
            'top': clone.top + 'px',
            'width': clone.width + 'px',
            'height': clone.height + 'px'
        });
        self.status = 'running';
    };

    // when slide, if next/pre image hasn't cloned, clone it
    Viewer.prototype.cloneImage = function(index) {
        var self = this,
            $backdrop = self.$backdrop,
            $originalImg = self.$images.eq(index),
            $img = $originalImg.clone().addClass('z-image-clone'),
            cloneList = self.cloneList,
            position = $originalImg.offset();
        var clone = cloneList[index] = {};
        clone.$el = $img;
        clone.left = position.left - self.scrollLeft;
        clone.top = position.top - self.scrollTop;
        clone.width = $originalImg.width();
        clone.height = $originalImg.height();
        $backdrop.append($img);
        return clone;
    };

    // direction: < 0---next    > 0---pre
    Viewer.prototype.slide = function(direction) {
        var self = this,
            index = self.index,
            count = self.count,
            cloneList = self.cloneList,
            currentItem = cloneList[index],
            step = direction < 0 ? 1 : -1,
            clone, size, next, leftPercent;
        next = (step + index) % count;
        clone = self.cloneList[next];
        if (!clone) {
            clone = self.cloneImage(next);
            size = calcGoodImageSize(clone.width, clone.height);
            clone.$el.css({
                'top': Math.abs(winHeight - size.height) / 2 + 'px',
                'width': size.width + 'px',
                'height': size.height + 'px'
            });
        } else {
            size = calcGoodImageSize(clone.width, clone.height);
        }
        if (direction < 0) {
            clone.$el.css('left', '100%');
            leftPercent = '-100%';
        } else {
            clone.$el.css('left', '-100%');
            leftPercent = '100%';
        }

        currentItem.$el.removeClass('z-image-viewer-transition').animate({
            'left': leftPercent
        }, {
            duration: self.duration,
            queue: false
        });
        clone.$el.animate({
            'left': Math.abs(winWidth - size.width) / 2 + 'px'
        }, {
            duration: self.duration,
            queue: false
        });
        self.index = next;
    };

    Viewer.prototype.show = function() {
        var self = this,
            index = self.index,
            clone = self.cloneList[index],
            size,
            style;
        self.$backdrop.show().addClass('in');
        size = calcGoodImageSize(clone.width, clone.height);
        style = {
            'left': Math.abs(winWidth - size.width) / 2 + 'px',
            'top': Math.abs(winHeight - size.height) / 2 + 'px',
            'width': size.width + 'px',
            'height': size.height + 'px'
        };
        clone.$el.addClass('z-image-viewer-transition')
            .css(style);
    };

    Viewer.prototype.hide = function() {
        var self = this,
            index = self.index,
            clone = self.cloneList[index];

        clone.$el.addClass('z-image-viewer-transition').css({
            'left': clone.left + 'px',
            'top': clone.top + 'px',
            'width': clone.width + 'px',
            'height': clone.height + 'px'
        });

        setTimeout(function() {
            self.$backdrop.hide()
                .removeClass('in');
            self.status = 'ready';
            self.cloneList = [];
            self.$backdrop.empty();
        }, 300);
    };

    // expose defaults
    $.fn.zImageViewer.defaults = {
        duration: 300,
        enableUseItemContainer: true,
        itemContainerClass: '.fake-cover',
        percent: 0.1 // ratio to start change img
    };

})(jQuery);
