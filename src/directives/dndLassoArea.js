module.directive('dndLassoArea', ['DndLasso', '$parse', '$timeout', 'dndKey', function(DndLasso, $parse, $timeout, dndKey){

    Controller.$inject = [];
    function Controller(){
        var ctrls = [], data = {};

        this.data = function(){
            return data;
        };

        this.add = function(ctrl){
            ctrls.push(ctrl);
        };

        this.remove = function(ctrl){
            for(var i = 0; i < ctrls.length; i++){
                if(ctrls[i] === ctrl) {
                    ctrls.splice(i,1);
                    return true;
                }
            }

            return false;
        };

        this.getSelectable = function(element){
            for(var i = 0; i < ctrls.length; i++){
                if(ctrls[i].getElement()[0] == element) return ctrls[i];
            }

            return undefined;
        };

        this.empty = function(){
            return !ctrls.length;
        };

        this.get = function(i){
            return i === undefined ? ctrls : ctrls[i];
        }
    }

    var ctrls = [];

    ctrls.remove = function (ctrl){
        for(var i = 0; i < this.length; i++){
            if(this[i] === ctrl) {
                this.splice(i,1);
                return true;
            }
        }

        return false;
    }

    return {
        restrict: 'A',
        controller: Controller,
        require: 'dndLassoArea',
        /* отрицательный приоритет необходим для того, что бы post link function dnd-lasso-area запускался раньше post link function ng-click */
        priority: -1,
        link: function(scope, $el, attrs, ctrl){
            var defaults = {
                selectAdditionals: true
            };

            var getterLassoArea = $parse(attrs.dndLassoArea);
            var opts = extend({}, defaults, $parse(attrs.dndLassoAreaOpts)(scope) || {});
            var dragstartCallback = $parse(attrs.dndOnLassostart);
            var dragCallback = $parse(attrs.dndOnLasso);
            var dragendCallback = $parse(attrs.dndOnLassoend);
            var clickCallback = $parse(attrs.dndLassoOnclick);
            var lasso = new DndLasso({ $el:$el }), selectable, keyPressed;

            ctrls.push(ctrl);

            function onClick(event){
                if(!ctrl.empty()) {

                    if(keyPressed) {
                        selectable.toggleSelected();
                        return
                    }

                    var s = ctrl.get();

                    for(var i = 0; i < s.length; i++){
                        s[i].unselected().unselecting();
                    }

                    if(selectable) selectable.selected();

                }

                clickCallback( scope, {$event: event});

                scope.$apply();
            }

            function onStart(handler) {
                scope.$dragged = true;

                if(!handler.isActive()) return;

                dragstartCallback( scope );

                if(!ctrl.empty() && !keyPressed) {

                    var s = ctrl.get();

                    for(var i = 0; i < s.length; i++){
                        s[i].unselected().unselecting();
                    }

                }


                scope.$apply();
            }

            function onDrag(handler) {

                scope.$dragged = true;

                if(!handler.isActive()) return;

                if(!ctrl.empty()) {
                    var s = ctrl.get(), rect = handler.getClientRect();

                    for(var i = 0; i < s.length; i++) {
                        s[i].hit(rect) ? s[i].selecting() : s[i].unselecting();
                    }
                }

                dragCallback(scope, { $rect: handler.getRect() });

                scope.$apply();

            }

            function onEnd(handler) {

                if(!handler.isActive()) return;

                var s = ctrl.get();

                if(!ctrl.empty()) {

                    for(var i = 0; i < s.length; i++){
                        if(s[i].isSelecting()) s[i].toggleSelected();
                    }

                    scope.$apply();
                }

                dragendCallback(scope, { $rect: handler.getRect() });

                if(!ctrl.empty()) {

                    for(var i = 0; i < s.length; i++){
                        s[i].unselecting();
                    }

                    scope.$apply();
                }

                /* что бы события click/dblclick получили флаг $dragged === true, переключение флага происходит после их выполнения */
                $timeout(function(){ scope.$dragged = false; });
            }

            $el.on('mousedown touchstart', throttle(function (event){

                scope.$dragged = false;

                //scope.$keypressed = keyPressed = ( dndKey.isset(16) || dndKey.isset(17) || dndKey.isset(18) );
                scope.$keypressed = keyPressed = opts.selectAdditionals ? ( event.shiftKey || event.ctrlKey || event.metaKey ) : false;

                if(!ctrl.empty()) {
                    selectable = ctrl.getSelectable(event.target);
                }

                scope.$apply();

            }, 300) );

            $el.on('click', function(event){

                if(!scope.$dragged) onClick(event);

                /* что бы события dnd-on-* получили флаг $keypressed, переключение флага происходит после их выполнения */
                if(scope.$keypressed) $timeout(function(){ scope.$keypressed = false; });
            } );

            lasso.on('start', onStart);
            lasso.on('drag', onDrag);
            lasso.on('end', onEnd);

            $el.on('$destroy', function(){
                ctrls.remove(ctrl);

                scope.$apply();
            });

            scope.$dragged = false;
        }
    };
}])
