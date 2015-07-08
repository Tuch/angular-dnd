
/**
* @license AngularJS-DND v0.1.14
* (c) 2014-2015 Alexander Afonin (toafonin@gmail.com, http://github.com/Tuch)
* License: MIT
*/

'use strict';

 /*

 =================
 ANGULAR DND:
 =================

 */

/* ENVIRONMENT VARIABLES */

var version = '0.1.14',
    $ = angular.element, $window = $(window), $document = $(document), body = 'body', TRANSFORM, TRANSFORMORIGIN, MATCHES_SELECTOR,
    debug = {
        mode: false,
        helpers: {}
    },
    forEach = angular.forEach,
    extend = angular.extend;

(function () {
    window.console = window.console || {
        log: noop,
        info: noop,
        warn: noop,
        error: noop
    };
})();

(function() {
    var agent = navigator.userAgent;

    if ( /webkit\//i.test(agent) ) {
        TRANSFORM = '-webkit-transform';
        TRANSFORMORIGIN = '-webkit-transform-origin';
        MATCHES_SELECTOR = 'webkitMatchesSelector';
    } else if (/gecko\//i.test(agent)) {
        TRANSFORM = '-moz-transform';
        TRANSFORMORIGIN = '-moz-transform-origin';
        MATCHES_SELECTOR = 'mozMatchesSelector';
    } else if (/trident\//i.test(agent)) {
        TRANSFORM = '-ms-transform';
        TRANSFORMORIGIN = 'ms-transform-origin';
        MATCHES_SELECTOR = 'msMatchesSelector';
    } else if (/presto\//i.test(agent)) {
        TRANSFORM = '-o-transform';
        TRANSFORMORIGIN = '-o-transform-origin';
        MATCHES_SELECTOR = 'oMatchesSelector';
    } else {
        TRANSFORM = 'transform';
        TRANSFORMORIGIN = 'transform-origin';
        MATCHES_SELECTOR = 'matches';
    }

})();



/* SOME HELPERS */

function noop() {}

function doFalse() {
    return false;
}

function doTrue() {
    return true;
}

function proxy(context, fn) {
    return function() {
        fn.apply(context, arguments);
    };
}

function degToRad(d) {
    return (d * (Math.PI / 180));
}

function radToDeg(r) {
    return (r * (180 / Math.PI));
}

function getNumFromSegment(min, curr, max) {
    return curr<min ? min : curr > max ? max : curr;
}

function findEvents(element) {

    var events = element.data('events');
    if (events !== undefined) {
        return events;
    }

    events = $.data(element, 'events');
    if (events !== undefined) {
        return events;
    }

    events = $._data(element, 'events');
    if (events !== undefined) {
        return events;
    }

    events = $._data(element[0], 'events');
    if (events !== undefined) {
        return events;
    }

    return undefined;
}

function debounce(fn, timeout, invokeAsap, context) {
    if (arguments.length === 3 && typeof invokeAsap !== 'boolean') {
        context = invokeAsap;
        invokeAsap = false;
    }

    var timer;

    return function() {
        var args = arguments;
        context = context || this;

        if (invokeAsap && !timer) {
            fn.apply(context, args);
        }

        clearTimeout(timer);

        timer = setTimeout(function() {
            if (!invokeAsap) {
                fn.apply(context, args);
            }

            timer = null;

        }, timeout);

    };
}

function throttle(fn, timeout, context) {
    var timer, args;

    return function() {
        if (timer) {
            return;
        }

        args = arguments;
        context = context || this;
        fn.apply(context, args);
        timer = setTimeout(function() { timer = null; }, timeout);
    };
}


/* parsing like: ' a = fn1(), b = fn2()' into {a: 'fn1()', b: 'fn2()'} */

function parseStringAsVars(str) {
    if (!str) {
        return undefined;
    }

    var a = str.replace(/\s/g,'').split(','), ret = {};

    for( var i = 0; i < a.length; i++ ) {
        a[i] = a[i].split('=');
        ret[a[i][0]] = a[i][1];
    }

    return ret;
}

function avgPerf (fn1, timeout, context, callback) {
    context = context || this;
    timeout = timeout || 1000;
    callback = callback || function(val) {
        console.log(val);
    };

    var time = [];

    var fn2 = debounce(function() {
        var sum = 0;

        for(var i=0; i < time.length; i++) {
            sum += time[i];
        }

        callback( Math.round(sum / time.length) );

        time = [];

    }, timeout);

    return function() {
        var start = Date.now();

        fn1.apply(context, arguments);

        time.push(Date.now() - start);

        fn2();

    };
}

function roundNumber(number, n) {
    if (isNaN(n)) {
        n=0;
    }

    var m = Math.pow(10,n);
    return Math.round(number * m) / m;
}


/* POINT OBJECT */

var Point = (function() {
    function Point(x, y) {
        if (typeof x === 'object') {
            y = x.y || x.top;
            x = x.x || x.left;
        }

        this.x = x || 0;
        this.y = y || 0;
    }

    Point.prototype = {
        equal: function(other) {
            if (!(other instanceof Point)) {
                other = new Point(other);
            }

            return this.x === other.x && this.y === other.y;
        },
        plus: function(other) {
            if (!(other instanceof Point)) {
                other = new Point(other);
            }

            return new Point(this.x + other.x, this.y + other.y);
        },
        minus: function(other) {
            if (!(other instanceof Point)) {
                other = new Point(other);
            }

            return new Point(this.x - other.x, this.y - other.y);
        },
        scale: function(scalar) {
            return new Point(this.x * scalar, this.y * scalar);
        },
        magnitude: function() {
            return this.distance(new Point(0, 0), this);
        },
        distance: function(other) {
            if (!(other instanceof Point)) {
                other = new Point(other);
            }

            return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
        },
        angle: function (other, isdegree) {
            var ret = Math.atan2(
                other.y - this.y,
                other.x - this.x
            );

            if (isdegree===true) {
                ret *= 180/Math.PI;
            }

            return ret;
        },
        deltaAngle: function(other, aboutPoint, isdegree) {
            aboutPoint = aboutPoint === undefined ? {x:0,y:0} : aboutPoint;
            var ret = this.angle(aboutPoint) - other.angle(aboutPoint);

            if (ret < 0) {
                ret = Math.PI*2 + ret;
            }

            if (isdegree===true) {
                ret *= 180/Math.PI;
            }

            return ret;
        },
        transform: function(matrix) {
            return matrix.transformPoint(this);
        },
        deltaTransform: function(matrix) {
            return matrix.deltaTransformPoint(this);
        },
        rotate: function(rads, aboutPoint) {
            var matrix = (new Matrix()).rotate(rads, aboutPoint);

            return this.transform(matrix);
        },
        getAsCss: function() {
            return {
                top: this.y,
                left: this.x
            };
        }
    };

    return function(x,y) {
        return new Point(x,y);
    };
})();



/* MATRIX OBJECT */

var Matrix = (function() {
    function Matrix(a, b, c, d, tx, ty) {
        this.a = a !== undefined ? a : 1;
        this.b = b || 0;
        this.c = c || 0;
        this.d = d !== undefined ? d : 1;
        this.tx = tx || 0;
        this.ty = ty || 0;
    }

    Matrix.prototype = {
        concat: function(other) {
            return new Matrix(
                this.a * other.a + this.c * other.b,
                this.b * other.a + this.d * other.b,
                this.a * other.c + this.c * other.d,
                this.b * other.c + this.d * other.d,
                this.a * other.tx + this.c * other.ty + this.tx,
                this.b * other.tx + this.d * other.ty + this.ty
            );
        },
        inverse: function() {
            var determinant = this.a * this.d - this.b * this.c;

            return new Matrix(
                this.d / determinant,
                -this.b / determinant,
                -this.c / determinant,
                this.a / determinant,
                (this.c * this.ty - this.d * this.tx) / determinant,
                (this.b * this.tx - this.a * this.ty) / determinant
            );
        },
        rotate: function(theta, aboutPoint) {
            var rotationMatrix = new Matrix(
                Math.cos(theta),
                Math.sin(theta),
                -Math.sin(theta),
                Math.cos(theta)
            );

            if (aboutPoint) {
                rotationMatrix = this.translate(aboutPoint.x, aboutPoint.y).concat(rotationMatrix).translate(-aboutPoint.x, -aboutPoint.y);
            }

            return this.concat(rotationMatrix);
        },
        scale: function(sx, sy, aboutPoint) {
            sy = sy || sx;

            var scaleMatrix = new Matrix(sx, 0, 0, sy);

            if (aboutPoint) {
                scaleMatrix = scaleMatrix.translate(aboutPoint.x, aboutPoint.y).translate(-aboutPoint.x, -aboutPoint.y);
            }

            return scaleMatrix;
        },
        translate: function(tx, ty) {
            var translateMatrix = new Matrix(1, 0, 0, 1, tx, ty);

            return this.concat(translateMatrix);
        },

        transformPoint: function(point) {
            return new Point(
                this.a * point.x + this.c * point.y + this.tx,
                this.b * point.x + this.d * point.y + this.ty
            );
        },
        deltaTransformPoint: function(point) {
            return new Point(
                this.a * point.x + this.c * point.y,
                this.b * point.x + this.d * point.y
            );
        },
        toStyle: function() {
            var a = roundNumber(this.a, 3),
                b = roundNumber(this.b, 3),
                c = roundNumber(this.c, 3),
                d = roundNumber(this.d, 3),
                tx = roundNumber(this.tx, 3),
                ty = roundNumber(this.ty, 3),
                result = 'matrix(' + a + ', ' + b + ', ' + c + ', ' + d + ', ' + tx +', ' + ty + ')';

            return result === 'matrix(1, 0, 0, 1, 0, 0)' ? 'none' : result;
        }
    };

    var fn = function(a, b, c, d, tx, ty) {
        return new Matrix(a, b, c, d, tx, ty);
    };

    fn.IDENTITY = new Matrix();
    fn.HORIZONTAL_FLIP = new Matrix(-1, 0, 0, 1);
    fn.VERTICAL_FLIP = new Matrix(1, 0, 0, -1);

    return fn;
}());

/* RECT OBJECT */

var Rect = (function() {
    function Rect(tl, tr, bl, br) {
        this.tl = tl;
        this.tr = tr;
        this.bl = bl;
        this.br = br;
    }

    Rect.prototype = {
        applyMatrix: function(matrix, aboutPoint) {
            var tl, tr, bl, br,
                translateIn = new Matrix(1,0,0,1,aboutPoint.x,aboutPoint.y),
                translateOut = new Matrix(1,0,0,1,-aboutPoint.x,-aboutPoint.y);

            if (aboutPoint !== undefined) {
                tl = this.tl.transform(translateOut).transform(matrix).transform(translateIn);
                tr = this.tr.transform(translateOut).transform(matrix).transform(translateIn);
                bl = this.bl.transform(translateOut).transform(matrix).transform(translateIn);
                br = this.br.transform(translateOut).transform(matrix).transform(translateIn);
            } else {
                tl = this.tl.transform(matrix);
                tr = this.tr.transform(matrix);
                bl = this.bl.transform(matrix);
                br = this.br.transform(matrix);
            }

            return new Rect(tl, tr, bl, br);
        },
        width: function() {
            var dx = this.tl.x - this.tr.x;
            var dy = this.tl.y - this.tr.y;
            return Math.sqrt(dx*dx+dy*dy);
        },
        height: function() {
            var dx = this.tl.x - this.bl.x;
            var dy = this.tl.y - this.bl.y;
            return Math.sqrt(dx*dx+dy*dy);
        },
        client: function() {
            var top = Math.min(this.tl.y, this.tr.y, this.bl.y, this.br.y);
            var left = Math.min(this.tl.x, this.tr.x, this.bl.x, this.br.x);
            var height = Math.max(this.tl.y, this.tr.y, this.bl.y, this.br.y)-top;
            var width = Math.max(this.tl.x, this.tr.x, this.bl.x, this.br.x)-left;

            return {
                top: roundNumber(top,1),
                left: roundNumber(left,1),
                height: roundNumber(height,1),
                width: roundNumber(width,1),
                bottom: roundNumber(top+height, 1),
                right: roundNumber(left+width, 1)
            };
        },
        getAngle: function(degs) {
            var y = this.tl.y-this.tr.y;
            var x = this.tl.x-this.tr.x;

            return Math.tan(x/y)*180/Math.PI;
        }
    };

    var fn = function(left, top, width, height) {
        var args = arguments;

        if (typeof args[0] === 'object') {
            top = args[0].top;
            left = args[0].left;
            width = args[0].width;
            height = args[0].height;
        }

        return new Rect(
                new Point(left,top),
                new Point(left+width,top),
                new Point(left,top+height),
                new Point(left+width,top+height)
            );
    };

    fn.fromPoints = function(tl,tr,bl,br) {
        return new Rect( tl,tr,bl,br );
    };

    return fn;
})();

/* JQLITE EXTENDING */

extend($.prototype, {

    dndDisableSelection: function() {
        this.on('dragstart selectstart', doFalse ).dndCss({
            '-moz-user-select': 'none',
            '-khtml-user-select': 'none',
            '-webkit-user-select': 'none',
            '-o-user-select': 'none',
            '-ms-user-select': 'none',
            'user-select': 'none'
        });
    },

    dndEnableSelection: function() {
        this.off('dragstart selectstart', doFalse ).dndCss({
            '-moz-user-select': 'auto',
            '-khtml-user-select': 'auto',
            '-webkit-user-select': 'auto',
            '-o-user-select': 'auto',
            '-ms-user-select': 'auto',
            'user-select': 'auto'
        });
    },

    dndClientRect: function() {
        if (!this[0]) {
            return;
        }

        var DOMRect = this[0] === window ? {top:0,bottom:0,left:0,right:0,width:0,height:0} : this[0].getBoundingClientRect();

        return {
            bottom: DOMRect.bottom,
            height: DOMRect.height,
            left: DOMRect.left,
            right: DOMRect.right,
            top: DOMRect.top,
            width: DOMRect.width,
        };
    },

    dndStyleRect: function() {
        var styles = this.dndCss(['width','height','top','left']);

        var width = parseFloat(styles.width);
        var height = parseFloat(styles.height);

        var top = styles.top === 'auto' ? 0 : parseFloat(styles.top);
        var left = styles.left === 'auto' ? 0 : parseFloat(styles.left);

        return {top: top, right: left+width, bottom: top+height, left: left, width: width, height: height};
    },

    dndGetParentScrollArea: function() {
        var ret = [], parents = this.dndClosest(), scrollX, clientX, scrollY, clientY, paddingX, paddingY, paddings, htmlEl = document.documentElement;

        forEach(parents, function(element) {

            paddings = $(element).dndCss(['padding-top', 'padding-right', 'padding-bottom', 'padding-left']);

            scrollX = element.scrollWidth;
            clientX = element.clientWidth;
            scrollY = element.scrollHeight;
            clientY = element.clientHeight;

            paddingY = parseFloat(paddings['padding-top']) + parseFloat(paddings['padding-bottom']);
            paddingX = parseFloat(paddings['padding-left']) + parseFloat(paddings['padding-right']);

            if ( scrollX - paddingX !== clientX || scrollY - paddingY !== clientY ) {
                ret.push(element);
            }
        });

        ret.push(window);

        return $(ret);
    },

    dndGetFirstNotStaticParent: function() {
        var ret, position, parents = this.dndClosest();

        forEach(parents, function(element) {

            position = $(element).dndCss('position');

            if ( position === 'absolute' || position === 'relative' || position === 'fixed' ) {
                ret = element;
                return false;
            }
        });

        if (!ret) {
            ret = document.documentElement;
        }

        return $(ret);
    },

    dndClosest: function(selector) {
        selector = selector || '*';
        var parent = this[0], ret = [];

        while(parent) {
            parent[MATCHES_SELECTOR](selector) && ret.push(parent);
            parent = parent.parentElement;
        }

        return $(ret);
    },
    dndGetAngle: function (degs) {
        var matrix = this.dndCss(TRANSFORM);

        if (matrix === 'none' || matrix === '') {
            return 0;
        }

        var values = matrix.split('(')[1].split(')')[0].split(','),
            a = values[0], b = values[1], rads = Math.atan2(b, a);

        rads = rads < 0 ? rads +=Math.PI*2 : rads;

        return degs ? Math.round(rads * 180/Math.PI) : rads;
    },

    dndCloneByStyles: function () {
        var ret = [];

        for (var i = 0, length = this.length; i < length; i++) {
            var node = this[i].cloneNode();

            angular.element(node).append(angular.element(this[0].childNodes).dndCloneByStyles());

            if (this[i].nodeType === 1) {
                node.style.cssText = window.getComputedStyle(this[i], "").cssText;
            }

            ret.push(node);
        }

        return angular.element(ret);
    },

    dndCss: (function() {
        var SPECIAL_CHARS_REGEXP = /([\:\-\_\.]+(.))/g,
            MOZ_HACK_REGEXP = /^moz([A-Z])/, hooks = {};

        function toCamelCase(string) {
            return string.replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
                return offset ? letter.toUpperCase() : letter;
            }).replace(MOZ_HACK_REGEXP, 'Moz$1');
        }

        (function() {
            var arr = {
                width: ['paddingLeft','paddingRight','borderLeftWidth', 'borderRightWidth'],
                height: ['paddingTop','paddingBottom','borderTopWidth', 'borderBottomWidth']
            };

            forEach(arr, function(styles, prop) {

                hooks[prop] = {
                    get: function(element) {
                        var computed = window.getComputedStyle(element);
                        var ret =  computed[prop];

                        if ( computed.boxSizing !== 'border-box' || ret[ret.length-1] === '%') {
                            return ret;
                        }

                        ret = parseFloat(ret);

                        for(var i = 0; i < styles.length; i++) {
                            ret -= parseFloat(computed[ styles[i] ]);
                        }

                        return ret + 'px';
                    }
                };

            });

        })();

        var cssNumber = {
            'columnCount': true,
            'fillOpacity': true,
            'fontWeight': true,
            'lineHeight': true,
            'opacity': true,
            'order': true,
            'orphans': true,
            'widows': true,
            'zIndex': true,
            'zoom': true
        };

        var setCss = function($element, obj) {
            var styles = {};

            for(var key in obj) {
                var val = obj[key];

                if ( typeof val === 'number' && !cssNumber[key] ) {
                    val += 'px';
                }

                styles[toCamelCase(key)] = val;
            }

            $element.css(styles);

            return $element;
        };

        var getCss = function($element, arg) {
            var ret = {};

            if (!$element[0]) {
                return undefined;
            }

            var style = $element[0].style;
            var computed = window.getComputedStyle( $element[0], null );

            if (typeof arg === 'string') {
                if (style[arg]) {
                    return style[arg];
                } else {
                    return hooks[arg] && 'get' in hooks[arg] ? hooks[arg].get($element[0]) : computed.getPropertyValue( arg );
                }
            }

            for(var i=0; i < arg.length; i++) {
                if (style[arg[i]]) {
                    ret[arg[i]] = style[ arg[i] ];
                } else {
                    ret[arg[i]] = hooks[arg[i]] && 'get' in hooks[arg[i]] ? hooks[arg[i]].get($element[0]) : computed.getPropertyValue( arg[i] );
                }
            }

            return ret;
        };

        function css() {
            var a = arguments;

            if ( (a.length === 1) && ((a[0] instanceof Array) || (typeof a[0] === 'string')) ) {
                return getCss(this, a[0]);
            } else if ( (a.length === 1) && (typeof a[0] === 'object') ) {
                return setCss(this, a[0]);
            } else if ( a.length === 2 ) {
                var obj = {};

                obj[a[0]] = a[1];

                return setCss(this, obj);
            }

            return this;

        }

        return css;
    })()
});

/* INIT ANGULAR MODULE */

var module = angular.module('dnd', []);

/* ANGULAR.ELEMENT DND PLUGIN - CORE OF ANGULAR-DND */

(function() {

    var Regions = (function() {
        var list = {};

        function Regions(layer) {
            if (!list[layer]) {
                list[layer] = [];
            }

            this.layer = function() {
                return layer;
            };
        }

        Regions.prototype = {
            get: function() {
                return list[this.layer()];
            },

            remove: function(el) {
                var index = this.get().indexOf(el);

                if (index > -1) {
                    this.get().splice(index,1);
                }
            },

            has: function(el) {
                return this.get().indexOf(el) > -1;
            },

            add: function(el) {
                if (this.has(el)) {
                    return;
                }

                this.get().push(el);

                var self = this;

                $(el).on('$destroy', function() { self.remove(el); });
            },

        };

        return Regions;
    })();

    var Dnd = (function() {

        var events = [ 'dragstart', 'drag', 'dragend', 'dragenter', 'dragover', 'dragleave', 'drop' ];
        var draggables = [ 'dragstart', 'drag', 'dragend' ];
        var droppables = [ 'dragenter', 'dragover', 'dragleave', 'drop' ];
        var handled = false;

        draggables.has = droppables.has = function(event) {
            return this.indexOf(event) > -1;
        };

        var touchevents;
        if ('ontouchstart' in document.documentElement) {
            touchevents = {start: 'touchstart', move: 'touchmove', end: 'touchend', cancel: 'touchcancel'};
        } else if ('pointerEnabled' in window.navigator) {
            touchevents = {start: 'pointerdown', move: 'pointermove', end: 'pointerup', cancel: 'pointercancel'};
        } else if ('msPointerEnabled' in window.navigator) {
            touchevents = {start: 'MSPointerDown', move: 'MSPointerMove', end: 'MSPointerUp', cancel: 'MSPointerCancel'};
        } else {
            touchevents = {start: 'touchstart', move: 'touchmove', end: 'touchend', cancel: 'touchcancel'};
        }

        function Dnd(el, layer) {
            this.el = el;
            this.$el = $(el);
            this.listeners = { 'dragstart':[], 'drag':[], 'dragend':[], 'dragenter':[], 'dragover':[], 'dragleave':[], 'drop':[] };
            this.regions = new Regions(layer);
            this.layer = function() {
                return layer;
            };
            this.setCurrentManipulator(null);
        }

        Dnd.prototype = {
            _isEmptyListeners: function(event) {
                if (event instanceof Array) {

                    for(var i=0; i < event.length; i++ ) {
                        if (!this._isEmptyListeners(event[i])) {
                            return false;
                        }
                    }

                } else if (this.listeners[event].length > 0) {
                    return false;
                }

                return true;
            },

            addListener: function(event, handler) {
                if (events.indexOf(event) === -1) {
                    console.error('jquery.dnd: invalid event name - ', event);
                    return this;
                }
                this.listeners[event].push( handler);

                if ( droppables.has(event) ) {
                    this.regions.add(this.el);
                } else if (draggables.has(event) && !this.mouse && !this.touch) {
                    if ('onmousedown' in window) {
                        this.mouse = new Mouse(this);
                    }
                    if ( ('ontouchstart' in window) || ('onmsgesturechange' in window) ) {
                        this.touch = new Touch(this, touchevents);
                    }

                }

                return this;
            },

            removeListener: function(event, handler) {
                var args = arguments;

                if (args.length === 0) {
                    for( var key in this.listeners ) {
                        this.listeners[key].length = 0;
                    }
                } else if (args.length === 1) {
                    this.listeners[event].length = 0;
                } else {
                    var listeners = this.listeners[event];

                    for(var i=0; i < listeners.length; i++) {
                        if ( listeners[i] === handler ) listeners[event].splice(i,1);
                    }

                }

                if ( this._isEmptyListeners(droppables) ) this.regions.remove(this.el);
                else if ( this._isEmptyListeners(draggables)) this.destroy();

                return this;
            },

            trigger: function(event, api, el) {
                for(var i=0; i < this.listeners[event].length; i++) {
                    this.listeners[event][i].call(this.$el, api,  el);
                }

                return this;
            },

            destroy: function() {
                if ( this.mouse ) {
                    this.mouse.destroy();
                    delete this.mouse;
                }

                if ( this.touch ) {
                    this.touch.destroy();
                    delete this.touch;
                }

                return this;
            },

            setCurrentManipulator: function (manipulator) {
                this._manipulator = manipulator;

                return this;
            },

            getCurrentManipulator: function () {
                return this._manipulator;
            }
        };


        return Dnd;
    })();

    var Api = (function() {

        function Api(manipulator) {
            this._manipulator = manipulator;
        }

        Api.prototype = {
            getAxis: function() {
                return this._manipulator.getClientAxis.apply(this._manipulator, arguments);
            },
            getBorderedAxis: function() {
                return this._manipulator.getBorderedAxis.apply(this._manipulator, arguments);
            },
            getRelBorderedAxis: function() {
                return this._manipulator.getRelBorderedAxis.apply(this._manipulator, arguments);
            },
            getDragTarget: function() {
                return this._manipulator.dnd.el;
            },
            getDropTarget: function() {
                return this._manipulator.target;
            },
            getEvent: function() {
                return this._manipulator.event;
            },
            isTarget: function() {
                return this._manipulator.isTarget.apply(this._manipulator, arguments);
            },
            unTarget: function() {
                this._manipulator.removeFromTargets();
            },
            useAsPoint: function(value) {
                return this._manipulator.asPoint = !(value === false);
            },
            setBounderElement: function(node) {
                this._manipulator.$bounder = angular.element(node);
                this.clearCache();
            },
            setReferenceElement: function(node) {
                this._manipulator.$reference = angular.element(node);
            },
            getBorders: function() {
                return this._manipulator.getBorders.apply(this._manipulator, arguments);
            },
            getReferencePoint: function() {
                return this._manipulator.getReferencePoint.apply(this._manipulator, arguments);
            },
            clearCache: function() {
                this._manipulator.clearCache.apply(this._manipulator, arguments);
            }
        };

        return Api;

    })();

    var Manipulator = (function() {
        var targets = [];

        function Manipulator(dnd) {
            this.dnd = dnd;
            this.onscroll = proxy(this, this.onscroll);
        }

        Manipulator.prototype = {

            getBorders: function(offset) {
                if (!this.$bounder) {
                    return;
                }

                var borders  = this.getCache('borders');

                if (!borders) {
                    var rect = this.$bounder.dndClientRect();

                    borders = this.setCache('borders', {
                        top: rect.top,
                        left: rect.left,
                        right: rect.right,
                        bottom: rect.bottom
                    });
                }

                return {
                    top: borders.top + (offset ? offset.top : 0),
                    left: borders.left + (offset ? offset.left : 0),
                    right: borders.right + (offset ? offset.right : 0),
                    bottom: borders.bottom + (offset ? offset.bottom : 0)
                };
            },

            getReferencePoint: function() {
                var referencePoint  = this.getCache('referencePoint');

                if (!referencePoint) {
                    var rect = this.$reference.dndClientRect();

                    referencePoint = this.setCache('referencePoint', new Point(rect.left, rect.top));
                }

                return referencePoint;
            },

            getBorderedAxis: function(borderOffset, axisOffset) {
                var axis = this.getClientAxis(axisOffset);
                var borders = this.getBorders(borderOffset);

                var result = borders ? new Point(
                    getNumFromSegment(borders.left, axis.x, borders.right),
                    getNumFromSegment(borders.top, axis.y, borders.bottom)
                ) : axis;

                return result;
            },

            getRelBorderedAxis: function(borderOffset, axisOffset) {
                return this.getBorderedAxis(borderOffset, axisOffset).minus( this.getReferencePoint() );
            },

            addToTargets: function() {
                targets.push(this);
            },

            removeFromTargets: function() {
                var index;

                while(index !== -1) {
                    index = targets.indexOf(this);
                    if (index > -1) {
                        targets.splice(index, 1);
                    }
                }
            },

            getTarget: function() {
                return targets[0];
            },

            isTarget: function() {
                return this.getTarget() === this;
            },

            start: function() {
                this.started = true;
                this.targets = [];
                this.asPoint = false;
                this.api = new Api(this);
                this.$scrollareas = this.dnd.$el.dndGetParentScrollArea();
                this.$reference = this.dnd.$el.dndGetFirstNotStaticParent();
                this.$scrollareas.on('scroll', this.onscroll);
                this.dnd.trigger('dragstart', this.api);
            },

            onscroll: function() {
                this.clearCache();
                this.dnd.trigger('drag', this.api);
            },

            getCache: function(key) {
                return this.cache[key];
            },

            setCache: function(key, value) {
                return this.cache[key] = value;
            },

            clearCache: function() {
                this.cache = {};
            },

            stop: function() {
                this.$scrollareas.off ('scroll', this.onscroll);

                if (this.targets.length) {
                    for(var i = 0, length = this.targets.length; i < length; i++) {
                        $(this.targets[i]).data('dnd')[this.dnd.layer()].trigger('drop', this.api, this.dnd.el);
                    }
                }

                this.dnd.trigger('dragend', this.api, this.targets);
            },


            prepareRegions: function() {
                var regions = this.dnd.regions.get();

                var ret = [];

                for(var key in regions) {
                    var dnd = $( regions[key] ).data('dnd')[this.dnd.layer()];
                    var rect = dnd.$el.dndClientRect();

                    if (this.dnd === dnd) {
                        continue;
                    }

                    ret.push({
                        dnd: dnd,
                        rect: rect
                    });
                }

                return ret;

            },

            begin: function (event) {
                if (this.dnd.getCurrentManipulator() ||
                $(event.target).dndClosest('[dnd-pointer-none]').length) {
                    return false;
                }

                this.dnd.setCurrentManipulator(this);

                this.addToTargets();
                this.event = event;
                this.started = false;
                this.clearCache();
                angular.element(document.body).dndDisableSelection();

                return true;
            },

            _isTriggerByPoint: function (p, r) {
                return (p.x > r.left) && (p.x < r.right) && (p.y > r.top) && (p.y < r.bottom);
            },

            _isTriggerByRect: function (a, b) {
                return a.top <= b.top && b.top <= a.bottom && ( a.left <= b.left && b.left <= a.right || a.left <= b.right && b.right <= a.right ) ||
                a.top <= b.bottom && b.bottom <= a.bottom && ( a.left <= b.left && b.left <= a.right || a.left <= b.right && b.right <= a.right ) ||
                a.left >= b.left && a.right <= b.right && ( b.top <= a.bottom && a.bottom <= b.bottom ||  b.bottom >= a.top && a.top >= b.top || a.top <= b.top && a.bottom >= b.bottom) ||
                a.top >= b.top && a.bottom <= b.bottom && ( b.left <= a.right && a.right <= b.right || b.right >= a.left && a.left >= b.left || a.left <= b.left && a.right >= b.right) ||
                a.top >= b.top && a.right <= b.right && a.bottom <= b.bottom && a.left >= b.left
            },

            progress: function (event) {
                this.event = event;

                if (!this.started) {
                    this.start();
                }

                var regions = this.getCache('regions');

                if (!regions) {
                    regions = this.setCache('regions', this.prepareRegions());
                    if (debug.mode) {
                        this.showRegioins();
                    }
                }

                this.dnd.trigger('drag', this.api);

                var isTrigger = this.asPoint ? this._isTriggerByPoint.bind(this, this.getBorderedAxis()) :
                    this._isTriggerByRect.bind(this, angular.element(this.dnd.el).dndClientRect());
                var dragenter = [];
                var dragover = [];
                var dragleave = [];

                for(var i = 0; i < regions.length; i++) {
                    var region = regions[i],
                        trigger = isTrigger(region.rect),
                        targetIndex = this.targets.indexOf(region.dnd.el);

                    if ( trigger ) {
                        if (targetIndex === -1) {
                            this.targets.push(region.dnd.el);
                            dragenter.push(region.dnd);
                        } else {
                            dragover.push(region.dnd);
                        }
                    } else if (targetIndex !== -1) {
                        dragleave.push($(this.targets[targetIndex]).data('dnd')[this.dnd.layer()]);
                        this.targets.splice(targetIndex, 1);
                    }
                }

                this._triggerArray(dragleave, 'dragleave');
                this._triggerArray(dragenter, 'dragenter');
                this._triggerArray(dragover, 'dragover');
            },

            _triggerArray: function (arr, event) {
                for (var i = 0; i < arr.length; i++) {
                    arr[i].trigger(event, this.api, this.dnd.el);
                }
            },

            end: function (event) {
                this.event = event;

                if (this.started) {
                    this.stop();
                }

                angular.element(document.body).dndEnableSelection();

                this.removeFromTargets();

                debug.mode && this.hideRegions();

                this.dnd.setCurrentManipulator(null);
            },

            showRegioins: function () {
                this.hideRegions();

                var regions = this.getCache('regions'),
                    bodyElement = angular.element(document.body),
                    bodyClientRect = bodyElement.dndClientRect();

                for (var i = 0, length = regions.length; i < length; i++) {
                    var region = regions[i];

                    debug.helpers.renderRect(
                        region.rect.left - bodyClientRect.left,
                        region.rect.top - bodyClientRect.top,
                        region.rect.width,
                        region.rect.height
                    );
                }
            },

            hideRegions: function () {
                var nodes = document.querySelectorAll('.dnd-debug-rect');

                for (var i = 0, length = nodes.length; i < length; i++) {
                    nodes[i].remove();
                }
            }
        };

        return Manipulator;
    })();

    function Mouse(dnd) {
        this.dnd = dnd;
        this.manipulator = new Manipulator(dnd);
        this.mousedown = proxy(this, this.mousedown);
        this.mousemove = proxy(this, this.mousemove);
        this.mouseup = proxy(this, this.mouseup);
        this.manipulator.getClientAxis = this.getClientAxis;

        dnd.$el.on('mousedown', this.mousedown);
    }

    Mouse.prototype = {

        getClientAxis: function(offset) {
            return new Point(this.event.clientX + (offset ? offset.x : 0), this.event.clientY + (offset ? offset.y : 0));
        },

        mousedown: function (event) {
            if (!this.manipulator.begin(event)) {
                return;
            }

            $document.on('mousemove', this.mousemove );
            $document.on('mouseup', this.mouseup );
        },

        mousemove: function(event) {
            this.manipulator.progress(event);
        },

        mouseup: function(event) {
            this.manipulator.end(event);

            $document.off('mousemove', this.mousemove );
            $document.off('mouseup', this.mouseup );

            this.dnd.setCurrentManipulator(null);
        },

        destroy: function() {
            this.dnd.$el.off('mousedown', this.mousedown);
        },
    };


    function Touch(dnd, te) {
        this.dnd = dnd;
        this.te = te;
        this.manipulator = new Manipulator(dnd);
        this.touchstart = proxy(this, this.touchstart);
        this.touchmove = proxy(this, this.touchmove);
        this.touchend = proxy(this, this.touchend);
        this.manipulator.getClientAxis = this.getClientAxis;

        dnd.$el.on(this.te.start, this.touchstart);
    }

    Touch.prototype = {

        getClientAxis: function(offset) {
            var event = this.event.originalEvent || this.event;

            return event.changedTouches ?
                Point(event.changedTouches[0].clientX + (offset ? offset.x : 0), event.changedTouches[0].clientY + (offset ? offset.y : 0)) :
                Point(event.clientX + (offset ? offset.x : 0), event.clientY + (offset ? offset.y : 0));
        },

        touchstart: function (event) {
            if (!this.manipulator.begin(event)) {
                return;
            }

            $document.on(this.te.move, this.touchmove );
            $document.on(this.te.end + ' ' + this.te.cancel, this.touchend );
        },

        touchmove: function(event) {
            event.preventDefault();

            this.manipulator.progress(event);
        },

        touchend: function(event) {
            this.manipulator.end(event);

            $document.off(this.te.move, this.touchmove );
            $document.off(this.te.end + ' ' + this.te.cancel, this.touchend );
            this.dnd.setCurrentManipulator(null);
        },

        destroy: function() {
            this.dnd.$el.off(this.te.start, this.touchstart);
        }
    };

    /**
     * @name angular.element.dndBind
     *
     * @description
     * Аналог jQuery.fn.bind(), только для drag and drop событий
     *
     * События также могут быть в формате <layer.event>,
     * но в отличие от jQuery.fn.bind() в нашем случае layer позволяет не только групировать обработчики,
     * но также и отделять области для droppable и draggable элементов. Поясним.
     * Дело в том, что при определении событий элемент не явным образом приписывается к определенной области видимости (layer),
     * причем один элемент может одновременно находится в нескольких областях.
     * Это означает, что для того, чтобы на элемент срабатывали droppable события, он должен находится в layer draggable элемента.
     * По умолчанию, если layer не задан в наименовании обаботчика события, то эта область именуется 'common',
     * т.е. события drop и common.drop идентичны и находятся в одной и той же области
     *
     * ! Элемент не явным образом считается draggable-элементом, если у него задано одно или несколько событий dragstart, drag или dragend
     * ! Элемент не явным образом считается droppable-элементом, если у него задано одно или несколько событий dragenter, dragover, dragleave или drop
     *
     * @param {object|string} event
     * Если object, то необходимо описать пары <event name>:<callback function>.
     * Если string, то определяется только <event name> причем возможно задать несколько событий через пробел, например <dragstart drag leftside.dragend>
     * @param {function} handler
     * Если arg1 это string, то arg2 это callback, который будет вызван после наступления события.
     * @returns {object} angular.element object.
     */

    $.prototype.dndBind = function ( event, handler ) {

        if (!this.length) {
            return this;
        }

        var opts = [], events, obj, layer, self = this;

        if (typeof event === 'object') {
            obj = event;

            for(var key in obj) {
                events = key.replace(/\s+/g, ' ').split(' ');

                for(var i=0; i < events.length; i++) {
                    opts.push({
                        event: events[i],
                        handler: obj[key]
                    });
                }
            }

        } else if (typeof event === 'string' && typeof handler === 'function') {
            events = event.trim().replace(/\s+/g, ' ').split(' ');

            for(var i=0; i < events.length; i++) {
                opts.push({
                    event: events[i],
                    handler: handler
                });
            }

        } else {
            return this;
        }

        if (!opts.length) {
            return this;
        }

        forEach(this, function(element) {
            var data = $(element).data();

            if (!data.dnd) {
                data.dnd = {};
            }

            for(var i=0; i < opts.length; i++) {
                event = opts[i].event;
                handler = opts[i].handler;

                event = event.split('.');

                if (event[1] === undefined) {
                    event[1] = event[0];
                    event[0] = 'common';
                }

                layer = event[0];
                event = event[1];

                if (!data.dnd[layer]) {
                    data.dnd[layer] = new Dnd(element, layer);
                }

                data.dnd[layer].addListener(event, handler);
            }
        });

        return this;
    };


    /**
     * @name angular.element.dndUnbind
     *
     * @description
     * Аналог jQuery.fn.unbind(), только для drag and drop событий
     *
     * @param {(object=|string=)} arg1 Если не object и не string, то удаляются все обработчики с каждого слоя
     *         Если object, то будут удалены callbacks события которые заданы в виде ключа и
     * @param {(function=|string=)} arg2
     *         Если arg1 это string, то arg2 это callback, который будет вызван после наступления события.
     *         Если arg1 это object, то arg2 это string которая определяет имя используемого слоя.
     * @param {string=} arg3
     *         Если задан arg1 и arg2, то arg3 это string которая определяет имя используемого слоя
     * @returns {object} angular.element object.
     */

    $.prototype.dndUnbind =  function() {

        var args = arguments, events = [], default_layer = 'common';

        if (!this.length) {
            return this;
        }

        if (typeof args[0] === 'string') {

            args[0] = args[0].trim().replace(/\s+/g, ' ').split(' ');

            if (typeof args[1] === 'function') {

                for(var i = 0; i < args[0].length; i++) {
                    events.push({
                        event: args[0][i],
                        handler: args[1]
                    });
                }

            } else {
                for(var i = 0; i < args[0].length; i++) {
                    events.push({
                        event: args[0][i]
                    });
                }
            }

        } else if ( typeof args[0] === 'object') {

            for(var key in args[0]) {
                if (args[0].hasOwnProperty(key)) {

                    events.push({
                        event: key.trim(),
                        handler: args[0][key]
                    });

                }
            }

        } else if (args.length !== 0) {
            return this;
        }

        forEach(this, function(element) {
            var data = $(element).data();

            if (!data.dnd) {
                return;
            }

            if (args.length === 0) {

                for(var key in data.dnd) {
                    data.dnd[key].removeListener();
                }

            } else {

                for(var i = 0; i < events.length; i++) {
                    var obj = events[i];

                    obj.event = obj.event.split('.');

                    if (obj.event[1] === undefined) {
                        obj.event[1] = obj.event[0];
                        obj.event[0] = default_layer;
                    }

                    if (obj.event[0] === '*') {
                        for(var key in data.dnd) {
                            data.dnd[key].removeListener( obj.event[1] );
                        }

                    } else if (data.dnd[ obj.event[0] ]) {
                        obj.handler ? data.dnd[ obj.event[0] ].removeListener( obj.event[1], obj.handler ) : data.dnd[ obj.event[0] ].removeListener( obj.event[1] );
                    }
                }
            }
        });

        return this;
    };

})();

/* DEBUG HELPERS */

debug.helpers.renderPoint = function (point) {
    var element = angular.element(document.createElement('div'));

    element.dndCss({
        position: 'absolute',
        left: point.x,
        top:  point.y,
        height: 3,
        width: 3,
        background: 'rgba(0, 0, 0, 0.5)',
        'pointer-events': 'none',
        'z-index': 100000
    });

    element.addClass('dnd-debug-point');

    angular.element(document.body).append(element);
};

debug.helpers.renderRect = function (left, top, width, height) {
    var element = angular.element(document.createElement('div'));

    element.dndCss({
        position: 'absolute',
        left: left,
        top:  top,
        height: height,
        width: width,
        background: 'rgba(249, 255, 0, 0.1)',
        'pointer-events': 'none',
        'z-index': 100000,
        'box-sizing': 'border-box',
        'border': '2px dotted #000'
    });

    element.addClass('dnd-debug-rect');

    angular.element(document.body).append(element);
};

angular.dnd = {
    version: version,
    noop: noop,
    doTrue: doTrue,
    doFalse: doFalse,
    proxy: proxy,
    radToDeg: radToDeg,
    degToRad: degToRad,
    getNumFromSegment: getNumFromSegment,
    findEvents: findEvents,
    throttle: throttle,
    debounce: debounce,
    debug: debug
};
