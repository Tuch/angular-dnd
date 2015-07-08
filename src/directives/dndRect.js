module.directive('dndRect', ['$parse', function($parse){
    var setStyles = ['top','left','width','height', 'transform'];
    var getStyles = ['top','left','width','height', TRANSFORM];

    setStyles.has = function(val){
        return this.indexOf(val) > -1;
    }

    Controller.$inject = ['$scope', '$attrs', '$element'];
    function Controller( $scope, $attrs, $element ){
        var getter = $parse($attrs.dndRect), setter = getter.assign, lastRect;

        this.update = function(prop, value) {
            var values, rect = getter($scope) || {};

            if(typeof prop != 'object') {
                values = {};
                values[prop] = value;
            } else values = prop;

            for(var i = 0; i < setStyles.length; i++){
                var style = setStyles[i];

                if(values[style] !== undefined) rect[style] = values[style];
            }

            setter($scope, rect);
        };

        this.get = function(){
            return getter($scope);
        };

        this.getClient = function(){
            return $element.dndClientRect();
        };

        function sanitize(rect){
            var css;

            rect = typeof rect == 'object' ? rect : {};

            for(var i = 0; i < setStyles.length; i++){

                var style = setStyles[i];

                if(rect[style] !== undefined) continue;

                if(!css) css = $element.dndCss(getStyles);

                rect[style] = (style === 'transform') ? css[TRANSFORM] : css[style];
            }

            for(var key in rect){
                rect[key.toLowerCase()] = rect[key];
            }

            for(var key in rect) {
                if(setStyles.has(key)) {
                    if(typeof rect[key] === 'number') rect[key] = rect[key]+'px';
                } else delete rect[key];
            }

            return rect;
        };

        $scope.$parent.$watch(function(){
            var rect = getter($scope.$parent);

            if(rect !== lastRect) setter($scope, rect);
        });

        $scope.$watch($attrs.dndRect, function(n, o){
            if(!n || typeof n != 'object') return;
            if(o == undefined) o = {};

            var lastRect = n = sanitize(n);

            var css = {};

            for(var val, i=0; i < setStyles.length; i++ ){
                val = setStyles[i];

                if(n[val] == undefined && o[val] != undefined) {
                    css[val] = '';
                } else if(n[val] != undefined) {
                    css[val] = n[val];
                }
            }

            if(css.transform) {
                css[TRANSFORM] = css.transform;
            }

            $element.dndCss(css);

        }, true);
    }

    return {
        restrict: 'A',
        controller: Controller
    };
}])
