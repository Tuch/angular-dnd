module.factory('DndLasso', [function () {
    var $div = $('<div></div>').dndCss({position: 'absolute'});

    var defaults = {
        className: 'angular-dnd-lasso',
        offsetX: 0,
        offsetY: 0
    };

    function Handler(local){

        this.getRect = function(){
            return this.isActive ? local.rect : undefined;
        }

        this.getClientRect = function(){
            return this.isActive ? $div.dndClientRect() : undefined;
        }

        this.isActive = function(){
            return local.active;
        }
    }

    function Local(api){
        var isTarget = api.isTarget(), handler = new Handler(this);

        this.isTarget = function(){
            return isTarget;
        }

        this.handler = function(){
            return handler;
        }

        this.getEvent = function(){
            return api.getEvent();
        }
    }

    function Lasso(opts){

        var self = this;

        opts = extend( {}, defaults, opts );

        function dragstart(api) {
            var local = api.local = new Local(api);

            if( !local.isTarget() ) {
                self.trigger('start', local.handler() );
                return;
            }

            local.active = true;

            self.trigger('start', local.handler() );

            api.setReferenceElement(opts.$el);
            api.setBounderElement(opts.$el);

            local.startAxis = api.getRelBorderedAxis();

            $div.removeAttr('class style').removeClass('ng-hide').addClass(opts.className);

            opts.$el.append( $div );

        };

        function drag(api) {
            var local = api.local;

            if( !local.active )  {
                self.trigger('drag', local.handler());
                return;
            }

            var change = api.getRelBorderedAxis().minus(local.startAxis);

            var rect = {
                top: local.startAxis.y,
                left: local.startAxis.x,
                width: change.x,
                height: change.y
            };

            if(rect.width < 0) {
                rect.width = - rect.width;
                rect.left = rect.left - rect.width;
            }

            if(rect.height < 0) {
                rect.height = - rect.height;
                rect.top = rect.top - rect.height;
            }

            local.rect = rect;

            rect.top += opts.offsetY;
            rect.left += opts.offsetX;

            $div.dndCss(rect);

            self.trigger('drag', local.handler() );
        };

        function dragend(api) {
            var local = api.local;

            if( !local.active ) {
                self.trigger('end', local.handler());
                return;
            }

            $div.addClass('ng-hide');

            $(document.body).append( $div );

            self.trigger('end', local.handler() );
        };

        var bindings = {
            '$$lasso.dragstart': dragstart,
            '$$lasso.drag': drag,
            '$$lasso.dragend': dragend
        };

        opts.$el.dndBind(bindings);

        this.destroy = function(){
            opts.$el.dndUnbind();
        };

        var events = {};

        this.on = function(name, fn) {
            events[name] = events[name] || [];
            events[name].push(fn);
        };

        this.trigger = function(name, args) {
            events[name] = events[name] || [];
            args = args || typeof args === 'string' ? [args] : [];
            events[name].forEach(function(fn) {
                fn.apply(this, args);
            });
        }
    }

    return Lasso;
}])
