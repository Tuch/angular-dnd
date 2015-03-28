module.directive('dndModel', ['$parse', function($parse){

    Controller.$inject = ['$scope', '$attrs'];
    function Controller( $scope, $attrs ){
        var getter = $parse($attrs.dndModel), setter = getter.assign

        this.set = function(value){
            setter($scope, value);
        };

        this.get = function(){
            return getter($scope);
        };
    }

    return {
        restrict: 'A',
        controller: Controller
    }
}])
