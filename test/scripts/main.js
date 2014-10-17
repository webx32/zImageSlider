$(document).ready(function() {
    var rPhoneNumber = /^1\d{10}$/,
        rMsgCode = /^\d{5}$/,
        $phoneNumber = $('#phone-number-input'),
        $checkBtn = $('#phone-check-btn'),
        $checkBtnText = $('#phone-check-btn-txt'),
        $msgCodeZone = $('.msg-code-zone'),
        $msgCode = $('#msg-code-input'),
        $waitingZone = $('.waiting-zone'),
        $loginZone = $('.login-zone'),
        $loginBtn = $('#login-btn');
    var g_duration = 60;
    var search, isNewUser, action;

    /*parse url*/
    function parseSearchUrl(url) {
        if (!(new RegExp(String.fromCharCode(92) + '?' + String.fromCharCode(92) + 'S+')).test(url)) {
            return null;
        }
        var url = '&' + url.substring(1);
        var parseReg = new RegExp('(?:&)([^=]+)=([^&]+)', 'g');
        var map = {},
            keyValue;
        while ((keyValue = parseReg.exec(url))) {
            var val = keyValue[2];
            val === "true" && (val = true);
            val === "false" && (val = false);
            map[keyValue[1]] = val;
        }
        return map;
    }

    function listenTime() {
        var duration = Math.floor((Date.now() - getLastSendTime()) / 1000),
            waitDuration = g_duration - duration;
        if(waitDuration <= 0) {
            toggleBtnStatus($checkBtn, false); // enable the btn
            $checkBtnText.text('获取验证码');
        } else {
            $checkBtnText.text('重发验证码（' + waitDuration + '）');
            setTimeout(function() {
                listenTime();
            }, 1000);
        }
    };

    function getLastSendTime() {
        return parseInt(sessionStorage.getItem('sendTime') || 0);
    };

    function displayMsgCodeZone() {
        $msgCodeZone.removeClass('hidden').addClass('ani-top-to-bottom');
    };

    function toggleZone(show) {
        if(show) {
            $loginZone.addClass('hidden');
            $waitingZone.removeClass('hidden').addClass('ani-top-to-bottom');
        } else {
            $loginZone.removeClass('hidden');
            $waitingZone.addClass('hidden').removeClass('ani-top-to-bottom');
        }
    };

    // 验证手机号码
    function isPhoneNumberValid() {
        var number = $phoneNumber.val(),
            valid = rPhoneNumber.test(number);
        return valid;
    };

    function toggleBtnStatus($btn, disabled) {
        if(!$btn) {
            return false;
        }
        disabled = !!disabled;
        if(disabled) {
            $btn.addClass('disabled').prop('disabled', true);
        } else {
            $btn.removeClass('disabled').prop('disabled', false);
        }
        return true;
    };

    // slider
    var $slider = $(".cy-photo-slider").cySlider({
        count: 'auto',
        afterImgChanged: function(preIndex, curIndex) {
            // do something
        }
    });


    $checkBtn.on('click', function(e) {
        e.preventDefault(); // disable default action (browser may reload the page)
        if($checkBtn.hasClass('disabled') || $checkBtn.prop('disabled')) {
            return;
        }

        var valid = isPhoneNumberValid();
        if(!valid) {
            //toggleBtnStatus($checkBtn, false);
            $('[data-for="' + $checkBtn.attr('id') + '"]').show();
            return;
        }
        // valid phone number
        $('[data-for="' + $checkBtn.attr('id') + '"]').hide();
        toggleBtnStatus($checkBtn, true); // disable the btn
        $checkBtnText.text('重发验证码（' + g_duration + '）');
        sessionStorage.setItem('sendTime', Date.now());
        setTimeout(function() {
            listenTime();
        }, 1000);
        displayMsgCodeZone();
        $.ajax({
            url: 'sms.php',
            dataType: 'text/plain',
            data: {
                phone: $phoneNumber.val()
            },
            success: function(response) {
                if (response == '1') {} else {}
            },
            failure: function() {
            }
        });
    });

    $loginBtn.on('click', function(e) {
        e.preventDefault(); // disable default action (browser may reload the page)
        if($loginBtn.hasClass('disabled') || $loginBtn.prop('disabled')) {
            return;
        }

        var code = $msgCode.val(),
            valid = rMsgCode.test(code);
        if(!valid) {
            $('[data-for="' + $loginBtn.attr('id') + '"]').show();
            return;
        }
        // valid msg code number
        $('[data-for="' + $loginBtn.attr('id') + '"]').hide();
        toggleBtnStatus($loginBtn, true); // disable the btn
        toggleZone(true);
        $.ajax({
            url: 'sms.php?check=1',
            data: {
                code: code
            },
            success: function (response) {
                if (response == '1') {
                    // get params
                    search = parseSearchUrl(location.search);
                    action = search.action;
                    setTimeout(function() {
                        location = 'http://m.com/Main/index?action=' + action + 
                            '&isLoggedIn=true';
                    }, 3000); // waiting for at least.
                } else {
                    $('[data-for="' + $loginBtn.attr('id') + '"]').show();
                    toggleBtnStatus($loginBtn, false);
                    toggleZone(false);
                }
            },
            failure: function () {
                toggleBtnStatus($loginBtn, false);
                toggleZone(false);
            }
        });
    });

});
