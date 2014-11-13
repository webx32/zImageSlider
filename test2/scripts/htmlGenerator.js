(function($, g) {

    g = g || window;

    // data must be array and not empty
    function genHtml(dataUrl, data, $container, errorCb, successCb) {
        var tpls = [],
            jsFiles = [],
            $tmpWrap = $('<div></div>'),
            tmpData,
            item,
            rendered = 0,
            getData,
            realDataUrl,
            i, len;
        for (i = 0, len = data.length; i < len; i++) {
            item = data[i];
            tpls.push(item.tpl);
            jsFiles.push(item.src || '');
            $tmpWrap.append('<div id="tpl' + i + '"></div>');
            getData = getRemoteData;
            realDataUrl = dataUrl;
            if (item.jsonp) {
                getData = getJsonpData;
                realDataUrl = item.jsonp;
            }
            getData(realDataUrl, item.id, i, function(modelId, order, res) {
                var j, jLen;
                if (!res || res.status !== 1000) {
                    errorCb && errorCb('Failed to load data, modelId is ' + modelId);
                    return;
                }
                tmpData = res.data;
                if (tmpData) {
                    $tmpWrap.find('#tpl' + order).replaceWith(getRenderedHtml(tpls[order], tmpData));
                } else {
                    $tmpWrap.find('#tpl' + order).remove();
                }
                if (++rendered == len) {
                    $container.append($tmpWrap.html());
                    $tmpWrap = null;
                    if (jsFiles.length) {
                        for (j = 0, jLen = jsFiles.length; j < jLen; j++) {
                            jsFiles[j] && scriptLoader(jsFiles[j], function(url) {
                                console.log('load script "' + url + '"');
                            });
                        }
                    }
                    if (successCb) {
                        successCb();
                    }
                }
            });
        };
    };

    function getJsonpData(url, modelId, order, callback) {
        $.ajax({
            url: url,
            dataType: 'jsonp',
            jsonp: "jsonpCallback"
        }).done(function(data) {
            callback && callback(modelId, order, data);
        });
    };

    function getRemoteData(url, modelId, order, callback) {
        $.ajax({
            url: url + modelId,
            dataType: 'json'
        }).done(function(data) {
            callback && callback(modelId, order, data);
        });
    };

    function getRenderedHtml(tpl, data) {
        return $.template(tpl, data);
    };

    // expose a method
    g.generateHtml = function(modelUrl, dataUrl, $container, errorCb, successCb) {
        $.ajax({
            url: modelUrl,
            dataType: 'json'
        }).success(function(res) {
            if (!res || res.status !== 1000) {
                errorCb && errorCb(res.msg || 'Failed to load model template.');
                return;
            }
            var data = res.data;
            if (!data || !data.length) {
                errorCb && errorCb('Tpl is empty.');
                return;
            }
            genHtml(dataUrl, data, $container, errorCb, successCb);
        }).error(function(err) {
            errorCb && errorCb(err);
        });
    };

})($, window);
