module.directive('dndContainer', ['$parse', function($parse){

	Controller.$inject = ['$element'];
	function Controller( $element ){
		this.getElement = function(){
			return $element;
		}
	}

	return {
		restrict: 'EAC',
		controller: Controller,
	}
}])