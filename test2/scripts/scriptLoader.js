(function() {
    var pathCache = {};

    function loadScript(url, callback){
        var path = encodeURIComponent(url);
        if(path in pathCache) {
            return callback();
        }

        var script = document.createElement("script");
        script.type = "text/javascript";

        if (script.readyState){  //IE
            script.onreadystatechange = function(){
                if (script.readyState == "loaded" ||
                        script.readyState == "complete"){
                    script.onreadystatechange = null;
                    pathCache[path] = true;
                    callback(url);
                }
            };
        } else {  //Others
            script.onload = function(){
                pathCache[path] = true;
                callback(url);
            };
        }
        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
    };

    window.scriptLoader = loadScript;

})();