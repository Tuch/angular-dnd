module.directive('dndContainment', ['$parse', function($parse){

    Controller.$inject = ['$element', '$attrs', '$scope'];
    function Controller( $element, $attrs, $scope){
        var getterSelector = $parse($attrs.dndContainment);

        this.get = function () {
            return $element.dndParents(getterSelector($scope)).eq(0);
        }
    }

    return {
        restrict: 'EAC',
        controller: Controller,
    }
}])
