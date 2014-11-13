(function($) {
    if(!$) return;

    var $activity = $('.merchant-activity');
    $activity.on('click', '.toggle-btn', function() {
        $activity.toggleClass('shown');
    });

})($);