module.directive('dndResizable', ['$parse', '$timeout', function($parse, $timeout) {

    function createHandleElement(side) {
        return angular.element('<div></div>').addClass('angular-dnd-resizable-handle angular-dnd-resizable-handle-' + side);
    }

    function getCenterPoint(rect, scale) {
        scale = typeof scale === 'object' ? scale : {x:1,y:1};

        return new Point(rect.left + rect.width*scale.x/2, rect.top + rect.height*scale.y/2);
    }

    function link (scope, $el, attrs, ctrls) {
        var rect = ctrls[0],
            containment = ctrls[1];

        var defaults = {
            handles: 'ne, se, sw, nw, n, e, s, w',
            minWidth: 20,
            minHeight: 20,
            maxWidth: 10000,
            maxHeight: 10000
        };

        var getterResizable = $parse(attrs.dndResizable);
        var opts = extend({}, defaults, $parse(attrs.dndResizableOpts)(scope) || {});
        var dragstartCallback = $parse(attrs.dndOnResizestart);
        var dragCallback = $parse(attrs.dndOnResize);
        var dragendCallback = $parse(attrs.dndOnResizeend);

        function getBindings(side) {

            function dragstart(api) {
                var local = api.local = {};

                local.resizable = getterResizable(scope);
                local.resizable = local.resizable === undefined ? true : local.resizable;

                if ( !local.resizable ) {
                    api.unTarget();
                }

                if ( !api.isTarget() ) {
                    return;
                }

                api.setBounderElement( containment ? containment.get() : angular.element(document.body) );
                local.started = true;
                local.$parent = $el.parent();
                local.rads = $el.dndGetAngle();
                local.rotateMatrix = Matrix.IDENTITY.rotate(local.rads);
                local.inverseRotateMatrix = local.rotateMatrix.inverse();
                local.parentRect = local.$parent.dndClientRect();

                var axis = api.getBorderedAxis(), crect = $el.dndClientRect(), srect = local.rect = $el.dndStyleRect();

                local.borders = api.getBorders();
                local.startAxis = axis;

                local.minScaleX = opts.minWidth / srect.width;
                local.minScaleY = opts.minHeight / srect.height;
                local.maxScaleX = opts.maxWidth / srect.width;
                local.maxScaleY = opts.maxHeight / srect.height;

                local.deltaX = crect.left - srect.left + crect.width / 2 - srect.width / 2;
                local.deltaY = crect.top - srect.top + crect.height / 2 - srect.height / 2;

                scope.$resized = true;

                dragstartCallback(scope);

                scope.$apply();
            }

            function drag(api) {
                var local = api.local;

                if (!local.started) return;

                var axis = api.getBorderedAxis();
                var vector = Point(axis).minus(local.startAxis).transform(local.inverseRotateMatrix);

                var scale = {x:1,y:1};

                var width = local.rect.width,
                    height = local.rect.height,
                    top = local.rect.top,
                    left = local.rect.left;

                switch(side) {
                    case 'n': scale.y = (height - vector.y) / height; break;
                    case 'e': scale.x = (width + vector.x) / width; break;
                    case 's': scale.y = (height + vector.y) / height; break;
                    case 'w': scale.x = (width - vector.x) / width; break;
                    case 'ne': scale.x = (width + vector.x) / width; scale.y = (height - vector.y) / height; break;
                    case 'se': scale.x = (width + vector.x) / width; scale.y = (height + vector.y) / height; break;
                    case 'sw': scale.x = (width - vector.x) / width; scale.y = (height + vector.y) / height; break;
                    case 'nw': scale.x = (width - vector.x) / width; scale.y = (height - vector.y) / height; break;
                }

                scale.x = getNumFromSegment(local.minScaleX, scale.x, local.maxScaleX);
                scale.y = getNumFromSegment(local.minScaleY, scale.y, local.maxScaleY);

                var offset;
                var center = getCenterPoint(local.rect);
                var scaledCenter = getCenterPoint(local.rect, scale);

                switch(side) {
                    case 'n': offset = Point(left,top+height*scale.y).rotate(local.rads, scaledCenter).minus( Point(left,top+height).rotate(local.rads, center) ); break;
                    case 'e': offset = Point(left,top).rotate(local.rads, scaledCenter).minus( Point(left,top).rotate(local.rads, center) ); break;
                    case 's': offset = Point(left,top).rotate(local.rads, scaledCenter).minus( Point(left,top).rotate(local.rads, center) ); break;
                    case 'w': offset = Point(left+width*scale.x,top).rotate(local.rads, scaledCenter).minus( Point(left+width,top).rotate(local.rads, center) ); break;
                    case 'ne': offset = Point(left,top+height*scale.y).rotate(local.rads, scaledCenter).minus( Point(left,top+height).rotate(local.rads, center) ); break;
                    case 'se': offset = Point(left,top).rotate(local.rads, scaledCenter).minus( Point(left,top).rotate(local.rads, center) ); break;
                    case 'sw': offset = Point(left+width*scale.x,top).rotate(local.rads, scaledCenter).minus( Point(left+width,top).rotate(local.rads, center) ); break;
                    case 'nw': offset = Point(left+width*scale.x,top+height*scale.y).rotate(local.rads, scaledCenter).minus( Point(left+width,top+height).rotate(local.rads, center) ); break;
                };

                var styles = {};
                styles.width = width * scale.x;
                styles.height = height * scale.y;
                styles.left = left - offset.x;
                styles.top = top - offset.y;

                var realCenter = Point(styles.left+local.deltaX+styles.width/2, styles.top+local.deltaY+styles.height/2);
                var boundedRect = Rect(styles.left+local.deltaX, styles.top+local.deltaY, styles.width, styles.height).applyMatrix( local.rotateMatrix, realCenter ).client();

                if (local.borders && (boundedRect.left+1 < local.borders.left || boundedRect.top+1 < local.borders.top || boundedRect.right-1 > local.borders.right || boundedRect.bottom-1 > local.borders.bottom)) {
                    return;
                }

                if (rect) {
                    rect.update(styles);
                } else {
                    $el.dndCss(styles);
                }

                dragCallback(scope);

                scope.$apply();
            }

            function dragend(api) {
                var local = api.local;

                if (!local.started) {
                    return;
                }

                dragendCallback(scope);


                $timeout(function() { scope.$resized = false; });
            }

            return {
                '$$resizable.dragstart': dragstart,
                '$$resizable.drag': drag,
                '$$resizable.dragend': dragend
            };

        }

        var cssPosition = $el.dndCss('position');

        if (cssPosition !== 'fixed' && cssPosition !== 'absolute' && cssPosition !== 'relative') {
            cssPosition = 'relative';
            $el.dndCss('position', cssPosition);
        }

        var sides = opts.handles.replace(/\s/g,'').split(',');

        for(var i=0; i < sides.length; i++) {
            $el.append( createHandleElement( sides[i] ).dndBind( getBindings( sides[i] ) ) );
        }

        scope.$resized = false;
    }

    return {
        require: ['?dndRect', '?dndContainment'],
        scope: true,
        link: link
    };
}]);
