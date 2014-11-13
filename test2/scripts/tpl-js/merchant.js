(function($) {
    $('.merchant-access').on('click', function() {
        var url = $(this).data('url');
        if(url) {
            location = url;
        }
    });
})($);