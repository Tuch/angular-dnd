module.factory('EventEmitter', [function () {

    function EventEmitter() {
        var events = {};

        this.on = function(name, fn) {
            events[name] = events[name] || [];
            events[name].push(fn);
        };

        this.off = function(name, fn) {
            if(!events[name]) return;

            for(var i = 0, length = events[name].length; i < length; i++){
                if(events[name][i] === fn) events[name].splice(i, 1);
            }
        };

        this.trigger = function(name, args) {
            events[name] = events[name] || [];
            args = args || typeof args === 'string' ? [args] : [];
            events[name].forEach(function(fn) {
                fn.apply(this, args);
            });
        }
    }

    return EventEmitter;
}])
