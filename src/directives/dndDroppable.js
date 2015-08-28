module.directive('dndDroppable', ['$parse', '$timeout', function( $parse, $timeout ){
    return {
        require: '?dndModel',
        scope: true,
        link: function(scope, $el, attrs, model){

            var defaults = {
                layer: 'common'
            };

            var getterDroppable = $parse(attrs.dndDroppable);
            var opts = extend({}, defaults, $parse(attrs.dndDroppableOpts)(scope) || {});
            var dragenterCallback = $parse(attrs.dndOnDragenter);
            var dragoverCallback = $parse(attrs.dndOnDragover);
            var dragleaveCallback = $parse(attrs.dndOnDragleave);
            var dropCallback = $parse(attrs.dndOnDrop);

            function dragenter(api){
                var local = api.droplocal = {};

                api.dropmodel = model ? model.get() : model;

                local.droppable = getterDroppable(scope, {'$dragmodel': api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});
                local.droppable = local.droppable === undefined ? true : local.droppable;

                if(!local.droppable) {
                    return;
                }

                dragenterCallback(scope, {'$dragmodel':api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});
                scope.$apply();
            }

            function dragover(api){
                var local = api.droplocal;

                if(!local.droppable) {
                    return;
                }

                dragoverCallback(scope, {'$dragmodel':api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});
                scope.$apply();
            }

            function dragleave(api){
                var local = api.droplocal;

                if(!local.droppable) {
                    return;
                }

                dragleaveCallback(scope, {'$dragmodel':api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});
                api.dropmodel = undefined;
                scope.$apply();
            }

            function drop(api){
                dropCallback(scope, {'$dragmodel':api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});
            }


            var bindings = {};

            opts.layer = opts.layer || defaults.layer;

            bindings[opts.layer+'.dragenter'] = dragenter;
            bindings[opts.layer+'.dragover'] = dragover;
            bindings[opts.layer+'.dragleave'] = dragleave;
            bindings[opts.layer+'.drop'] = drop;

            $el.dndBind( bindings );

        }
    };
}]);
