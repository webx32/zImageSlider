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

```javascript
$(el).zImageSlider({
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
});
```

另外，记住要加入css文件`image-slider.css`。