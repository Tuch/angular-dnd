module.directive('dndDraggable', ['$timeout', '$parse', '$http', '$compile', '$q', '$templateCache', 'EventEmitter',
function ($timeout, $parse, $http, $compile, $q, $templateCache, EventEmitter) {

    var ElementTarget = (function () {

        function ElementTarget(element, rect) {

            var cssPosition =  element.dndCss('position');

            if (cssPosition !== 'fixed' && cssPosition !== 'absolute' && cssPosition !== 'relative') {
                cssPosition = 'relative';
                element.dndCss('position', cssPosition);
            }

            this.element = element;

            this.rect = rect;
        }

        ElementTarget.prototype = {
            setBorderOffset: function (axis) {
                var crect = this.element.dndClientRect();

                this.borderOffset = {
                    top: axis.y - crect.top,
                    left: axis.x - crect.left,
                    bottom: axis.y - crect.top - crect.height,
                    right: axis.x - crect.left - crect.width
                };
            },

            init: function () {
                delete this.start;
            },

            updatePosition: function ( axis ) {
                if (!this.start) {
                    this.start = new Point(this.element.dndStyleRect()).minus(axis);
                }

                var position = new Point(this.start).plus(axis);

                this.rect ? this.rect.update( position.getAsCss() ) : this.element.dndCss( position.getAsCss() );
            },

            destroy: function () {

            },

        };

        return ElementTarget;
    })();

    var HelperTarget = (function () {

        var wrapper = $('<div class = "angular-dnd-helper"></div>').dndCss({position: 'absolute'});

        function HelperTarget(mainElement, templateUrl, scope) {
            var self = this;

            this.mainElement = mainElement;
            this.scope = scope;
            this._inited = false;
            this.templateUrl = templateUrl;

            function createTemplateByUrl(templateUrl) {
                templateUrl = angular.isFunction (templateUrl) ? templateUrl() : templateUrl;

                return $http.get(templateUrl, {cache: $templateCache}).then(function (result) {
                    self.template = result.data;
                });
            }

            if (templateUrl !== 'clone')  {
                createTemplateByUrl(templateUrl);
            }
        }

        HelperTarget.prototype = {

            init: function () {
                delete this.start;
                delete this.element;

                if (this.templateUrl === 'clone') {
                    this.createElementByClone().wrap().appendTo( this.mainElement.parent());
                } else {
                    this.compile(this.scope).wrap().appendTo( this.mainElement.parent());
                }

                this.scope.$apply();

                return this;
            },

            createElementByClone: function () {
                this.element = this.mainElement.clone();
                this.element.dndCss('position', 'static');

                return this;
            },

            compile: function () {
                this.element = $compile(this.template)(this.scope);

                return this;
            },

            wrap: function () {
                wrapper.html('');
                wrapper.append(this.element);

                return this;
            },

            appendTo: function (element) {
                element.append(wrapper);

                return this;
            },

            setBorderOffset: function () {
                var crect = wrapper.dndClientRect();

                this.borderOffset = {
                    top: 0,
                    left: 0,
                    bottom: -crect.height,
                    right: -crect.width
                };
            },

            updatePosition: function (axis) {
                wrapper.dndCss( axis.getAsCss() );
            },

            destroy: function () {
                this.element.remove();
            },
        };

        return HelperTarget;
    })();

    function link (scope, element, attrs, ctrls) {
        var rect = ctrls[0],
            model = ctrls[1],
            container = ctrls[2];

        var defaults = {
            layer: 'common',
            useAsPoint: false,
            helper: null,
            restrictMovement: true,
            handle: ''
        };

        var getterDraggable = $parse(attrs.dndDraggable);
        var opts = extend({}, defaults, $parse(attrs.dndDraggableOpts)(scope) || {});
        var dragstartCallback = $parse(attrs.dndOnDragstart);
        var dragCallback = $parse(attrs.dndOnDrag);
        var dragendCallback = $parse(attrs.dndOnDragend);
        var draggable = opts.helper ? new HelperTarget(element, opts.helper, scope) : new ElementTarget(element, rect);
        var started,
            handle = opts.handle ? element[0].querySelector(opts.handle) : '';

        function dragstart(api) {
            started = false;

            // определяем включен ли draggable элемент
            var enabled = getterDraggable(scope);
            enabled = enabled === undefined || enabled;

            // если draggable элемент выключен - отмечаем элемент как "не цель курсора"
            if (!enabled || (handle && handle !== api.getEvent().target)) {
                api.unTarget();
            }

            // если элемент не является целью курсора (возможно есть другие draggable элементы внутри) - никак не реагируем на событие
            if (!api.isTarget()) {
                return;
            }

            draggable.init();

            // ставим флаг, что элемент начал двигаться
            started = true;

            // ставим флаг useAsPoint, что бы определить, является ли элемент полноразмерным или точкой.
            // В зависимости от этого флага по разному реагируют droppable зоны на этот элемент
            api.useAsPoint(opts.useAsPoint);

            // задаем модель данному элементу
            api.dragmodel = model ? model.get() : null;

            if (opts.restrictMovement) {
                var $bounder = container ? container.getElement() : angular.element(document.body);

                api.setBounderElement( $bounder );
            }

            // ставим флаг, что процесс перемещения элемента начался
            scope.$dragged = true;

            // задаем смещение границ контейнера
            draggable.setBorderOffset(api.getBorderedAxis());

            // применяем пользовательский callback
            dragstartCallback(scope, {'$dragmodel':api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});

            // запускаем dirty-checking цикл
            scope.$apply();
        }

        function drag(api) {
            if (!started) {
                return;
            }

            draggable.updatePosition( api.getRelBorderedAxis(draggable.borderOffset) );
            dragCallback(scope, {'$dragmodel':api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});

            scope.$apply();
        }

        function dragend(api) {
            if (!started) {
                return;
            }

            draggable.destroy();

            dragendCallback(scope, {'$dragmodel':api.dragmodel, '$dropmodel': api.dropmodel, '$api': api});

            $timeout(function () {
                scope.$dragged = false;
            });
        }

        var bindings = {};

        opts.layer = opts.layer || defaults.layer;

        bindings[opts.layer+'.dragstart'] = dragstart;
        bindings[opts.layer+'.drag'] = drag;
        bindings[opts.layer+'.dragend'] = dragend;

        element.dndBind(bindings);

        scope.$dragged = false;

    }

    return {
        require: ['?dndRect', '?dndModel', '?^dndContainer'],
        scope: true,
        link: link
    };
}]);
