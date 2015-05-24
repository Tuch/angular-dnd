module.directive('dndContainment', ['$parse', function($parse){

    Controller.$inject = ['$element', '$attrs', '$scope'];
    function Controller( $element, $attrs, $scope){
        var getterSelector = $parse($attrs.dndContainment);

        this.get = function () {
            var selector = getterSelector($scope);

            return selector ? $element.dndClosest(selector).eq(0) : $element.parent();
        }
    }

    return {
        restrict: 'EAC',
        controller: Controller,
    }
}])
