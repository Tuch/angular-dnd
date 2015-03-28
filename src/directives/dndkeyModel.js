module.directive('dndKeyModel', ['$parse', 'dndKey', function($parse, dndKey){
    return {
        restrict: 'A',
        link: function(scope, $el, attrs) {
            var getter = $parse(attrs.dndKeyModel), setter = getter.assign;

            scope.$watch(function(){ return dndKey.get() }, function(n,o){
                if(n === undefined) return;
                setter(scope, n);
            });
        }
    }
}])
