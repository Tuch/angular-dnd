module.factory('dndKey', ['$rootScope', function ($rootScope) {
    var keys = [];

    function DndKey(){

    };

    DndKey.prototype = {
        get: function(){
            return keys;
        },
        isset: function(code){
            var index = keys.indexOf(code);
            return (index !== -1);
        }
    };

    function keydown(event){
        var code = event.keyCode;
        debounceKeyup(event);
        if(keys.indexOf(code) > -1) return;

        keys.push(code);
        $rootScope.$digest();
    }

    function keyup(event){
        var code = event.keyCode, index = keys.indexOf(code);
        if(index === -1) return;

        keys.splice(index,1);
        $rootScope.$digest();
    };



    var debounceKeyup = debounce(keyup, 1000);
    $document.on('keydown', keydown);
    $document.on('keyup', keyup);

    return new DndKey;
}])
