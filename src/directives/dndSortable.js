module.directive('dndSortable', ['$parse', '$compile', function($parse, $compile) {
    var ngRepeatRegExp = /^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?\s*$/;
    var placeholder;// = angular.element('<div class = "dnd-placeholder"></div>');

    return {
        scope: true,
        transclude: true,
        template: function(element, attrs) {
            var tag = element[0].nodeName.toLowerCase();

            var ngRepeat = attrs.ngRepeat || '';
            var match = ngRepeat.match(ngRepeatRegExp);

            if(!match) {
                throw 'dnd-sortable-item requires ng-repeat as dependence';
            }

            var opts = angular.extend({
                layer: "'common'",
            }, $parse(attrs.dndSortableOpts)());

            return '' +
            '<' + tag + ' ng-transclude ' +
            'dnd-draggable dnd-draggable-opts = "{helper:\'clone\', useAsPoint: true, layer: ' + opts.layer + '}" ' +
            'dnd-droppable dnd-droppable-opts = "{layer: ' + opts.layer + '}"' +
            'dnd-on-dragstart = "$$onDragStart($api, $dropmodel, $dragmodel)"' +
            'dnd-on-dragend = "$$onDragEnd($api, $dropmodel, $dragmodel)"' +
            'dnd-on-dragover = "$$onDragOver($api, $dropmodel, $dragmodel)"' +
            'dnd-model = "{item: '+match[1]+', list: '+match[2]+', index: $index}"' +
            '></' + tag + '>';

        },
        replace: true,
        link: function(scope, element, attrs) {
            var defaults = {
                layer: 'common'
            };

            var parentNode = element[0].parentNode;
            var parentElement = angular.element(parentNode);
            var parentData = parentElement.data('dnd-sortable');
            var getterSortable = $parse(attrs.dndSortable);
            var opts = extend({}, defaults, $parse(attrs.dndSortableOpts)(scope) || {});
            var getter = $parse(attrs.dndModel) || noop;
            var css = element.dndCss(['float', 'display']);
            var floating = /left|right|inline/.test(css.float + css.display);

            if(!parentData || !parentData[opts.layer]) {
                parentData = parentData || {};
                parentData[opts.layer] = true;

                var bindings = {};

                bindings[opts.layer+'.dragover'] = function(api) {
                    if(api.getEvent().target !== parentNode || getter(scope).list.length > 1) {
                        return;
                    }

                    api.$sortable.model = getter(scope);
                    api.$sortable.insertBefore = true;
                    parentElement.append(placeholder[0]);
                };

                parentElement.dndBind(bindings).data('dnd-sortable', parentData);
            }

            function isHalfway(dragTarget, axis, dropmodel) {
                var rect = element.dndClientRect();

                return (floating ? (axis.x - rect.left) / rect.width : (axis.y - rect.top) / rect.height) > 0.5;
            }

            function moveValue(fromIndex, fromList, toIndex, toList) {
                toList = toList || fromList;
                toList.splice(toIndex, 0, fromList.splice(fromIndex, 1)[0]);
            }

            scope.$$onDragStart = function(api) {
                placeholder = element.clone();
                element.addClass('ng-hide');
                placeholder.addClass('angular-dnd-placeholder');
                parentNode.insertBefore(placeholder[0], element[0]);
                api.$sortable = {};
                api.clearCache();
            };

            scope.$$onDragEnd = function(api) {
                element.removeClass('ng-hide');
                placeholder.addClass('ng-hide');

                if(!api.$sortable.model) {
                    return;
                }

                var fromIndex = scope.$index;
                var toIndex = api.$sortable.model.index;
                var fromList = getter(scope).list;
                var toList = api.$sortable.model.list;

                if(toList === fromList) {
                    if(toIndex < fromIndex) {
                        if(!api.$sortable.insertBefore) toIndex++;
                    } else {
                        if(api.$sortable.insertBefore) toIndex--;
                    }
                } else if(!api.$sortable.insertBefore) toIndex++;

                moveValue(fromIndex, fromList, toIndex, toList);

                api.clearCache();

                scope.$apply();
            };

            scope.$$onDragOver = function(api, dropmodel, dragmodel) {
                var halfway = isHalfway(api.getDragTarget(), api.getBorderedAxis());

                halfway ? parentNode.insertBefore(placeholder[0], element[0].nextSibling) : parentNode.insertBefore(placeholder[0], element[0]);

                api.$sortable.model = getter(scope);
                api.$sortable.insertBefore = !halfway;

                api.clearCache();
            };


        }
    };
}]);
