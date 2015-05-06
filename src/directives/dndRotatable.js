module.directive('dndRotatable', ['$parse', '$timeout', function($parse, $timeout){

    function link (scope, element, attrs, ctrls) {
        var rect = ctrls[0],
            containment = ctrls[1];

        var defaults = {
            step: 5
        };

        var getterRotatable = $parse(attrs.dndRotatable);
        var opts = extend({}, defaults, $parse(attrs.dndRotatableOpts)(scope) || {});
        var dragstartCallback = $parse(attrs.dndOnRotatestart);
        var dragCallback = $parse(attrs.dndOnRotate);
        var dragendCallback = $parse(attrs.dndOnRotateend);

        var cssPosition = element.dndCss('position');

        if(cssPosition != 'fixed' && cssPosition != 'absolute' && cssPosition != 'relative') {
            cssPosition = 'relative';
            element.dndCss('position', cssPosition);
        }

        var handle = angular.element('<div class = "angular-dnd-rotatable-handle"></div>');

        element.append(handle);

        function dragstart(api) {
            var local = api.local = {};

            local.rotatable = getterRotatable(scope);
            local.rotatable = local.rotatable === undefined ? true : local.rotatable;

            if( !local.rotatable ) {
                api.unTarget();
            }

            if(!api.isTarget()) {
                return;
            }

            local.started = true;

            api.setBounderElement( containment ? containment.get() : angular.element(document.body) );

            var axis = api.getRelBorderedAxis();

            local.srect = element.dndStyleRect();

            local.currAngle = element.dndGetAngle();

            local.startPoint = Point(axis);

            local.borders = api.getBorders();

            local.center = Point(local.srect).plus(Point(local.srect.width / 2, local.srect.height / 2));

            scope.$rotated = true;

            dragstartCallback(scope);

            scope.$apply();
        }

        function drag(api){
            var local = api.local;

            if(!local.started) {
                return;
            }

            var axis = api.getRelBorderedAxis();
            var angle = Point(axis).deltaAngle(local.startPoint, local.center);
            var degs = radToDeg(local.currAngle+angle);

            degs = Math.round(degs/opts.step)*opts.step;
            var rads = degToRad(degs);
            var matrix = Matrix().rotate(rads);

            var compute = Rect( local.center.x - local.srect.width/2, local.center.y - local.srect.height/2, local.srect.width, local.srect.height).applyMatrix( matrix, local.center ).client();
            var rPoint = api.getReferencePoint();

            if(local.borders && (compute.left + rPoint.x < local.borders.left-1 || compute.top + rPoint.y < local.borders.top-1 || (compute.left + rPoint.x + compute.width) > local.borders.right+1 || (compute.top + rPoint.y + compute.height) > local.borders.bottom+1)) {
                return;
            }

            if(rect) {
                rect.update('transform', matrix.toStyle());
            } else {
                element.dndCss('transform',  matrix.toStyle());
            }

            dragCallback(scope);

            scope.$apply();
        }

        function dragend(api){
            var local = api.local;

            if(!local.started) {
                return;
            }

            dragendCallback(scope);

            $timeout(function(){
                scope.$rotated = false;
            });
        }

        scope.$rotated = false;

        var bindings = {
            '$$rotatable.dragstart': dragstart,
            '$$rotatable.drag': drag,
            '$$rotatable.dragend': dragend
        };

        handle.dndBind( bindings );

    }

    return {
        require: ['?dndRect', '?dndContainment'],
        scope: true,
        link: link
    };
}])
