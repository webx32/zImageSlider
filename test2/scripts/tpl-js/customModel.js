(function($) {
    if(!$) return;

    var $model = $('.merchant-custom-model'),
        $content = $model.find('.content'),
        url = $model.data('url');
    $content.on('click', function() {
        if(url) {
            location = url;
        }
    });

})($);