// version: 1.1.0
;(function($){
	
	$.fn.cySlider = function(options){
		var opts = $.extend({}, $.fn.cySlider.defaults, options);
		var $slider = $(this),
			$indicator = $slider.find(opts.indicator),
			$content = $slider.find(opts.imgWrapper);
		if($slider.length > 1){
			throw new Error("only one slider per page");
		}
		if(opts.count === 'auto') {
			opts.count = $content.find('img').length;
		}
		$content.addClass("item-sum" + opts.count);
		initIndicator($slider, $indicator, opts.count, opts.initIndex);

		var startPos = 0,
			endPos = 0,
			leftPercent = 0,
			curIndex = opts.initIndex,
			originalIndex = 0,
			count = opts.count,
			touchStart = false,
			autoPlaying = false,
			timeout = null,
			width = $("body").width(),
			distance = opts.slidePercent * width;

		$content.on("touchstart", function(ev) {
			var touch = ev.touches[0];
			moveStart(ev, touch.pageX);
		}).on("touchmove", function(ev){
			var touch = ev.touches[0];
			move(ev, touch.pageX);
		});
		$(window).on("touchend", function(ev) {
			moveEnd(ev);
		});

		$content.on("mousedown", function(ev) {
			moveStart(ev, ev.pageX);
		}).on("mousemove", function(ev){
			move(ev, ev.pageX);
		});
		$(window).on("mouseup", function(ev) {
			moveEnd(ev);
		});

		setTimeout(autoPlay, opts.autoPlayInterval);

		function displayItem(index){
			$content.css({
				'left': -index * 100 + '%'
			});
			$indicator.find(".cy-photo-indicator-dot").removeClass("active");
			$indicator.find(".cy-photo-indicator-dot:nth-child(" + (index + 1) + ")").addClass("active");
		};

		function moveStart(ev, startX) {
			ev.preventDefault();
			if(autoPlaying) {
				return;
			}
			originalIndex = curIndex;
			leftPercent = convertPercentage(parseInt($content.css("left")));
			startPos = startX;
			touchStart = true;
			$content.removeClass("cy-slider-animation");
			if(opts.touchStart && typeof opts.touchStart === "function") {
				opts.touchStart();
			}
		};
		function move(ev, endX) {
			if(!touchStart) return;
			endPos = endX;
			var delta = endPos - startPos,
				percent = (leftPercent + delta / width) * 100 + '%';
			$content.css({
				'left': percent
			});
		};
		function moveEnd(ev) {
			if(!touchStart){
				return;
			}
			touchStart = false;
			var gap = endPos - startPos;
			$content.addClass("cy-slider-animation");
			if(Math.abs(gap) > distance){
				if(gap < 0){
					if(++curIndex >= count){
						curIndex = count - 1;
					}
				}else {
					if(--curIndex < 0){
						curIndex = 0;
					}
				}
				displayItem(curIndex);
				if(opts.afterImgChanged && typeof opts.afterImgChanged === "function") {
					opts.afterImgChanged(originalIndex, curIndex);
				}
			}else{
				displayItem(originalIndex);
			}
		};

		function play(cancel) {
			if(cancel && timeout) {
				return clearTimeout(timeout);
			}
			if(touchStart || autoPlaying) {
				return;
			}

			autoPlaying = true;
			if(opts.touchStart && typeof opts.touchStart === "function") {
				opts.touchStart();
			}
			curIndex++;
			if(curIndex >= count){
				curIndex = 0;
			}
			$content.addClass("cy-slider-animation");
			displayItem(curIndex);
			if(opts.afterImgChanged && typeof opts.afterImgChanged === "function") {
				opts.afterImgChanged(originalIndex, curIndex);
			}
			autoPlaying = false;
		};
		function autoPlay() {
			play();
			timeout = setTimeout(autoPlay, opts.autoPlayInterval);
		};

		return this;
	};

	function initIndicator($slider, $indicator, count, initIndex) {
		if(count > 1) {
			var $wrap = $('<div></div>');
			for(var i=0; i < count; i++) {
				$wrap.append('<span class="cy-photo-indicator-dot"></span>');
			}
			$indicator.html($wrap.html());
		}
		var width = $indicator.width(),
			tWidth = $slider.width();
		$indicator.css({
			left: (tWidth - width) / 2 + 'px'
		});
		$indicator.find('span:nth-child(' + (initIndex+1) + ')').addClass('active');
	};

	function convertPercentage(percent) {
		if(!isNaN(+percent)){
			return +percent / 100;
		}
		var reg = /^\s*([-+]?)(\d*)(\.?\d*)%\s*$/;
		var result = reg.exec(percent);
		if (result) {
			var tmp = result[2]? result[2]/100 : 0;
			if (result[3]) {
				tmp += (+result[3]) / 100;
			}
			if (result[1] === '-' && tmp) {
				tmp = -tmp;
			}
			return tmp;
		} else {
			throw 'invalid parameter: ' + percent;
		}
	};

	// expose defaults
	$.fn.cySlider.defaults = {
		slidePercent: 0.3, //拖动超过多少百分比后才翻页
		initIndex: 0,
		count: 'auto',
		autoPlay: true, // 自动轮播
		autoPlayInterval: 6400, // 自动轮播间隔
		imgWrapper: ".cy-photo-item-list",
		indicator: ".cy-photo-indicator",
		touchStart: null,
		afterImgChanged: null
	};

})(Zepto || jQuery);
