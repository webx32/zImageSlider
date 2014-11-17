zImageSlider
============

图片轮播插件，支持移动端和PC端。

###v1.1.0

- 基于`zepto v1.1.3`
- 用css3 `transition`支持动画，`left`属性切换图片
- 支持touch和鼠标切换图片
- 支持传入回调，每次图片切换后执行

###v2.1.1

####Features

- 基于`jQuery`，少量变动后可以支持zepto。
- 用css3 `transition`支持动画，移动端表现较好。
- 支持touch和鼠标切换图片。相比`1.x`版本，对`touch*`支持更好：

    - 不再禁用垂直方向的滚动（scroll）;
    - 对用户触摸分`tap`和`swipe`;
    - 解决与鼠标事件的冲突。

- 增加事件支持（目前为2个）：`tap.zImageSlider`，`slide.zImageSlider`。
- 无限轮播：最后一张图片到第一张时不再遍历所有图片，表现与其它情况一致;反之亦然。

####Usage

```html
<!doctype <!DOCTYPE html>
<html>
<head>
    <title>base usage</title>
    <link rel="stylesheet" type="text/css" href="image-slide.css">
</head>
<body>
<!-- follow this dom structure -->
<!-- you can custom the class by config the plugin -->
<div class="image-slider" data-z-image-slider='true'>
    <div class="image-list">
        <div class="image-item">
            <img class="img-responsive" src="images/1.jpg">
        </div>
        <div class="image-item">
            <img class="img-responsive" src="images/2.jpg">
        </div>
        <div class="image-item">
            <img class="img-responsive" src="images/3.jpg">
        </div>
        <div class="image-item">
            <img class="img-responsive" src="images/4.jpg">
        </div>
        <!-- be free to change what's inside '.image-item' -->
        <!-- more or less image item -->
    </div>
</div>
<script type="text/javascript">
    $(el).zImageSlider({
        slidePercent: 0.3, //拖动超过多少百分比后才翻页
        autoPlay: false, // 是否开启自动轮播
        speed: 6, // 自动轮播间隔， 单位秒
        contentWrap: ".image-list",
        itemWrap: '.image-item',
        enableFixedHeight: true, // 是否固定高度（宽度自适应，但不超过100%）;
        // 如果false，那么宽度为100%，高度不做设定
        fixedHeight: 160, // px, 固定高度时的图片高度
        indicator: ".image-indicator",
        transitionClass: 'z-image-slide-transition',
        afterImageChanged: null
    });
</script>
</body>
</html>
```


###v2.2.1

####What's new?

- 同时支持jQuery和Zepto。
- 修复`2.1.1`中事件错误：只有一张图片时不触发tap事件。
- 增强：暴露已经实例化的`Slider`对象（`window.zImageSliders`），通过`.image-slider`上的data('z-image-slider-instance')获取`index`。