
/**
 * @license AngularJS-DND v0.1.1
 * (c) 2014-2015 Alexander Afonin (toafonin@gmail.com, http://github.com/Tuch)
 * License: MIT
 */
 
//window.onerror = function(){
//	alert(arguments[0]);
//}

;(function(angular, undefined){'use strict'

	 /*

	 =================
	 ANGULAR DND:
	 =================

	 */

	angular.dnd = {};

	/* ENVIRONMENT VARIABLES */

	var $ = angular.element, $window = $(window), $document = $(document), body = 'body', TRANSFORM, TRANSFORMORIGIN,

		forEach = angular.forEach,
		extend = angular.extend;
	
	(function(){
		var agent = navigator.userAgent;
		
		if( /webkit\//i.test(agent) ) {
			TRANSFORM = '-webkit-transform';
			TRANSFORMORIGIN = '-webkit-transform-origin';
		} else if (/gecko\//i.test(agent)) {
			TRANSFORM = '-moz-transform';
			TRANSFORMORIGIN = '-moz-transform-origin';
		} else if (/trident\//i.test(agent)) {
			TRANSFORM = '-ms-transform';
			TRANSFORMORIGIN = 'ms-transform-origin';
		} else if (/presto\//i.test(agent)) {
			TRANSFORM = '-o-transform';
			TRANSFORMORIGIN = '-o-transform-origin';
		} else {
			TRANSFORM = 'transform';
			TRANSFORMORIGIN = 'transform-origin';
		};
	})();



	/* SOME HELPERS */

	function noop(){}

	function doFalse(){return false}

	function doTrue(){return true}

	function proxy(context, fn){
		return function(){
			fn.apply(context, arguments);
		};
	}

	function degToRad(d) {
		return (d * (Math.PI / 180));
	}

	function radToDeg(r) {
		return (r * (180 / Math.PI));
	}

	function getNumFromSegment(min, curr, max){
		return curr<min ? min : curr > max ? max : curr;
	}
	
	/* EXTEND NUMBER PROTOTYPE BY round */
	
	if(Number.prototype.round != undefined) console.warning('Number.prototype.round is defined');
	Number.prototype.round = function(n){	
		if(isNaN(n)) n=0;
		var m = Math.pow(10,n);
		return Math.round(this*m)/m;
	};


	/* POINT OBJECT */
	
	var Point = (function() {
		function Point(x, y) {
			if(typeof x === 'object') {
				y = x.y || x.top;
				x = x.x || x.left;
			}
		
			this.x = x || 0;
			this.y = y || 0;
		}
	  
		Point.prototype = {
			equal: function(other) {
				return this.x === other.x && this.y === other.y;
			},
			add: function(other) {
				return new Point(this.x + other.x, this.y + other.y);
			},
			subtract: function(other) {
				return new Point(this.x - other.x, this.y - other.y);
			},
			scale: function(scalar) {
				return new Point(this.x * scalar, this.y * scalar);
			},
			magnitude: function() {
				return this.distance(new Point(0, 0), this);
			},
			distance: function(other) {
				return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
			},
			angle: function (other, isdegree) {
				var ret = Math.atan2(
					other.y - this.y,
					other.x - this.x
				);
				
				if(isdegree===true) ret *= 180/Math.PI;	
				
				return ret;
			},
			deltaAngle: function(other, aboutPoint, isdegree){
				aboutPoint = aboutPoint == undefined ? {x:0,y:0} : aboutPoint;
				
				var ret = this.angle(aboutPoint) - other.angle(aboutPoint);
				
				if(ret < 0) ret = Math.PI*2 + ret;
				
				if(isdegree===true) ret *= 180/Math.PI;		
				
				return ret;
			},
			transform: function(matrix){
				return matrix.transformPoint(this);
			},
			deltaTransform: function(matrix){
				return matrix.deltaTransformPoint(this);
			},
			rotate: function(rads, aboutPoint){
				var matrix = (new Matrix()).rotate(rads, aboutPoint);

				return this.transform(matrix);
			},
		};
	  
		return function(x,y){
			return new Point(x,y)
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

				if(aboutPoint) 
					rotationMatrix = this.translate(aboutPoint.x, aboutPoint.y).concat(rotationMatrix).translate(-aboutPoint.x, -aboutPoint.y);

				return this.concat(rotationMatrix);
			},
			scale: function(sx, sy, aboutPoint) {
				sy = sy || sx;

				var scaleMatrix = Matrix(sx, 0, 0, sy);

				if(aboutPoint) 
					scaleMatrix = scaleMatrix.translate(aboutPoint.x, aboutPoint.y).translate(-aboutPoint.x, -aboutPoint.y);

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
			toStyle: function(){
				return 'matrix('+this.a.round(3)+', '+this.b.round(3)+', '+this.c.round(3)+', '+this.d.round(3)+', '+this.tx.round(3)+', '+this.ty.round(3)+')';
			},
			
		};
		
		var fn = function(a, b, c, d, tx, ty){
			return new Matrix(a, b, c, d, tx, ty);
		};
		
		fn.IDENTITY = new Matrix();
		fn.HORIZONTAL_FLIP = new Matrix(-1, 0, 0, 1);
		fn.VERTICAL_FLIP = new Matrix(1, 0, 0, -1);
		
		return fn;
	}());
	
	/* RECT OBJECT */
	
	var Rect = (function(){
		function Rect(tl, tr, bl, br){
			this.tl = tl;
			this.tr = tr;
			this.bl = bl;
			this.br = br;
		}
		
		Rect.prototype = {
			applyMatrix: function(matrix, aboutPoint){
				var tl, tr, bl, br, translateIn = Matrix(1,0,0,1,aboutPoint.x,aboutPoint.y), translateOut = Matrix(1,0,0,1,-aboutPoint.x,-aboutPoint.y);
				
				if(aboutPoint != undefined) {					
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
				
				return new Rect(tl,tr,bl,br);
			},
			width: function(){
				var dx = this.tl.x - this.tr.x;
				var dy = this.tl.y - this.tr.y;
				return Math.sqrt(dx*dx+dy*dy);
			},
			height: function(){
				var dx = this.tl.x - this.bl.x;
				var dy = this.tl.y - this.bl.y;
				return Math.sqrt(dx*dx+dy*dy);
			},
			client: function(){
				var top = Math.min(this.tl.y, this.tr.y, this.bl.y, this.br.y);
				var left = Math.min(this.tl.x, this.tr.x, this.bl.x, this.br.x);
				var height = Math.max(this.tl.y, this.tr.y, this.bl.y, this.br.y)-top;
				var width = Math.max(this.tl.x, this.tr.x, this.bl.x, this.br.x)-left;
				
				return {top:top.round(1),left:left.round(1),height:height.round(1),width:width.round(1),bottom:(top+height).round(1),right:(left+width).round(1)};
			},
			getAngle: function(degs){
				var y = this.tl.y-this.tr.y;
				var x = this.tl.x-this.tr.x;

				return Math.tan(x/y)*180/Math.PI;
			}
		};
		
		var fn = function(left, top, width, height){
			var args = arguments;
			
			if(typeof args[0] == 'object') {
				top = args[0].top;
				left = args[0].left;
				width = args[0].width;
				height = args[0].height;
			};
		
			return new Rect( Point(left,top), Point(left+width,top), Point(left,top+height), Point(left+width,top+height) );
		};
	
		fn.fromPoints = function(tl,tr,bl,br){
			return new Rect( tl,tr,bl,br );
		};
	
		return fn;
	})();

	/* JQLITE EXTENDING */

	extend($.prototype, {

		dndDisableSelection: function() {
			this.on('dragstart selectstart', doFalse ).dndCss({ '-moz-user-select':'none', '-khtml-user-select':'none', '-webkit-user-select':'none' })
		},

		dndEnableSelection: function() {
			this.off('dragstart selectstart', doFalse ).dndCss({ '-moz-user-select':'auto', '-khtml-user-select':'auto', '-webkit-user-select':'auto' });
		},

		dndClientRect: function(){
			return extend({}, this[0].getBoundingClientRect());
		},

		dndStyleRect: function(){
			var styles = this.dndCss(['width','height','top','left']);
			
			var width = parseFloat(styles.width);
			var height = parseFloat(styles.height);

			var top = styles.top == 'auto' ? 0 : parseFloat(styles.top);
			var left = styles.left == 'auto' ? 0 : parseFloat(styles.left);

			return {top: top, right: left+width, bottom: top+height, left: left, width: width, height: height};
		},

		dndGetParentScrollArea: function(){
			var ret, parent = this.parent()[0], parents = [];

			while(parent){
				parents.push(parent);
				parent = parent.parentElement;
			}

			forEach($(parents), function(element) {
				if(element.scrollHeight !== element.clientHeight) {
					ret = element;
					return false;
				}
			});

			return $(ret);
		},

		dndGetAngle: function (degs){

			var matrix = this.dndCss(TRANSFORM);

			if(matrix == 'none' || matrix == '') return 0;

			var values = matrix.split('(')[1].split(')')[0].split(',');

			var a = values[0];

			var b = values[1];

			var rads = Math.atan2(b, a);

			rads = rads < 0 ? rads +=Math.PI*2 : rads;

			return degs ? Math.round(rads * 180/Math.PI) : rads;

		},
		
		dndCss: (function(){
			var SPECIAL_CHARS_REGEXP = /([\:\-\_\.]+(.))/g;
			var MOZ_HACK_REGEXP = /^moz([A-Z])/;

			function toCamelCase(string){
				return string.replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
					return offset ? letter.toUpperCase() : letter;
				}).replace(MOZ_HACK_REGEXP, 'Moz$1');
			}

			var setCss = function($element, obj){
				var styles = {};

				for(var key in obj) {
					styles[toCamelCase(key)] = obj[key];
				}

				for(var key in styles) {
					if(typeof styles[key] == 'number') styles[key] = styles[key] + 'px';
				}

				$element.css(styles);

				return $element;
			};
			
			var getCss = function($element, arg){

				var style = $element[0].style;
				var computed = window.getComputedStyle( $element[0], null );
			
				if(typeof arg == 'string') {
					if(style[arg]) return style[arg];
					else return computed.getPropertyValue( arg );
				}
				
				var ret = {};
				
				for(var i=0; i < arg.length; i++){
					if(style[arg[i]]) ret[arg[i]] = style[ arg[i] ];
					else ret[arg[i]] = computed.getPropertyValue( arg[i] );
				}
				
				return ret;
			};
			
			function css(){
				var a = arguments;
				
				if( (a.length == 1) && ((a[0] instanceof Array) || (typeof a[0] == 'string')) ) return getCss(this, a[0]);
				else if( (a.length == 1) && (typeof a[0] == 'object') ) return setCss(this, a[0]);
				else if( a.length == 2 ) {
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

	(function(){

		var Regions = (function(){
			var list= {};

			function Regions(namespace){
				if(!list[namespace]) list[namespace] = [];

				this.namespace = function(){
					return namespace;
				}
			}

			Regions.prototype = {
				get: function(){
					return list[this.namespace()];
				},

				remove: function(el){
					var index = this.get().indexOf(el);

					if(index  > -1) this.get().splice(index,1)
				},

				has: function(el){
					return this.get().indexOf(el) > -1;
				},

				add: function(el){
					if(this.has(el)) return;

					this.get().push(el);
				},

			}

			return Regions;
		})();
		
		var Dnd = (function(){

			var events = [ 'dragstart', 'drag', 'dragend', 'dragenter', 'dragover', 'dragleave', 'drop' ];
			var draggables = [ 'dragstart', 'drag', 'dragend' ];
			var droppables = [ 'dragenter', 'dragover', 'dragleave', 'drop' ];
			var handled = false;
	
			draggables.has = droppables.has = function(event){
				return this.indexOf(event) > -1;
			};
			
	
			function Dnd(el, namespace){
				this.el = el;
				this.$el = $(el);
				this.listeners = { 'dragstart':[], 'drag':[], 'dragend':[], 'dragenter':[], 'dragover':[], 'dragleave':[], 'drop':[] };
				this.regions = new Regions(namespace);
				this.namespace = function(){ return namespace };
				this.propagation = true;
			}
	
			Dnd.prototype = {
				_isEmptyListeners: function(event){
					if(event instanceof Array) {
	
						for(var i=0; i < event.length; i++ ) {
							if(!this._isEmptyListeners(event[i])) return false;
						}
	
					} else if(this.listeners[event].length > 0) return false;
	
					return true;
				},
	
				addListener: function(event, handler){
					if(events.indexOf(event) == -1) {
						console.log('jquery.dnd: invalid event name - ', event);
						return;
					}
					this.listeners[event].push( handler);
	
					if( droppables.has(event) ) this.regions.add(this.el);
					else if(draggables.has(event) && !this.mouse && !this.touch) {
						if('onmousedown' in document) this.mouse = new Mouse(this);
						if('ontouchstart' in document) this.touch = new Touch(this);
					}
				},
	
				removeListener: function(event, handler){
				
					var args = arguments;
					
					if(args.length === 0) for( var key in this.listeners ) this.listeners[key].length = 0;
					else if(args.length === 1) this.listeners[event].length = 0;
					else {
						var listeners = this.listeners[event];
					
						for(var i=0; i < listeners.length; i++) {
							if( listeners[i] === handler ) listeners[event].splice(i,1);
						} 
						
					} 
	
					if( this._isEmptyListeners(droppables) ) this.regions.remove(this.el);
					else if( this._isEmptyListeners(draggables)) this.destroy();
					
				},
	
				trigger: function(event, api, el){
					for(var i=0; i < this.listeners[event].length; i++) {
						this.listeners[event][i].call(this.$el, api,  el);
					}
				},
	
				destroy: function(){
	
					if( this.mouse ) {
						this.mouse.destroy();
						delete this.mouse;
					}
	
					if( this.touch ) {
						this.touch.destroy();
						delete this.touch;
					}
				},
				
				setHandledState: function(state){
					handled = state;
				},
				
				getHandledState: function(){
					return handled;
				}
				
			};

		
			return Dnd;
		})();

		var Api = (function(){

			function Api(manipulator){
				var offset = { top:0, right:0, bottom:0, left:0 }, container;

				this.offset = function(top,right,bottom,left){
					if(!arguments.length) return offset;
					if(typeof top === 'object') {
						right = top.right;
						bottom = top.bottom;
						left = top.left;
						top = top.top;
					}

					offset.top = top;
					offset.right = right;
					offset.bottom = bottom;
					offset.left = left;
				};

				this.container = function(rect){
					if(!arguments.length) {
						if(!container) container = angular.element(document.body).dndClientRect();
						
						return container;
					}
					
					container.top = rect.top;
					container.left = rect.left;
					container.width = rect.width;
					container.height = rect.height;
					container.right = rect.right ? rect.right : rect.left + rect.width;
					container.bottom = rect.bottom ? rect.bottom : rect.top + rect.height;
				};

				this.getBorders = function(){
					var container = this.container();
				
					return {
						top: container.top + offset.top,
						right: container.right + offset.right,
						bottom: container.bottom + offset.bottom,
						left: container.left + offset.left
					}
				};

				this.getAxis = function(){
					var axis = manipulator.getClientAxis();
					var borders = this.getBorders();

					return {
						top: getNumFromSegment(borders.top, axis.top, borders.bottom),
						left: getNumFromSegment(borders.left, axis.left, borders.right)
					};
				};

				this.getDragTarget = function(){
					return manipulator.dnd.el;
				};

				this.getDropTarget = function(){
					return manipulator.target;
				};

				this.getEvent = function(){
					return manipulator.event;
				}
			}

			return Api;

		})();
		
		function Manipulator(dnd){
			this.dnd = dnd;
			
			this.onscroll = proxy(this, this.onscroll);
		}

		var sens = 2;

		Manipulator.prototype = {

			start: function(){
				this.started = true;

				this.target = false;

				this.api = new Api(this);

				this.regions = this.prepare();
				
				this.$scrollarea = this.dnd.$el.dndGetParentScrollArea();
				
				this.$scrollarea.on('scroll', this.onscroll);

				this.dnd.trigger('dragstart', this.api);

			},
			
			onscroll: function(){
				this.regions = this.prepare();
			},

			stop: function(){
			
				this.$scrollarea.off('scroll', this.onscroll);

				if(this.target) $(this.target).data('dnd')[this.dnd.namespace()].trigger('drop', this.api, this.dnd.el);

				this.dnd.trigger('dragend', this.api, this.target);
			},
			
			
			prepare: function(){
				var regions = this.dnd.regions.get();

				var ret = [];

				for(var key in regions) {
					var dnd = $( regions[key] ).data('dnd')[this.dnd.namespace()];

					if(this.dnd === dnd) continue;

					ret.push({
						dnd: dnd,
						rect: dnd.$el.dndClientRect()
					});
				}

				return ret;

			},
			
			begin: function (event){
				event.preventDefault();

				this.event = event;

				this.started = false;

				angular.element(document.body).dndDisableSelection();
			},
				
			progress: function (event){

				var self = this;
				if(this.moving) return false;
				this.moving = setTimeout(function(){ self.moving = undefined; }, 10);
				
				
				this.event = event;

				if(!this.started) this.start();


				this.dnd.trigger('drag', this.api);

				var axis = this.api.getAxis(), x = axis.left, y = axis.top;

				for(var i = 0; i < this.regions.length; i++) {
					var region = this.regions[i];

					if( (x > region.rect.left) && (x < region.rect.left + region.rect.width) && (y > region.rect.top) && (y < region.rect.top + region.rect.height) ){

						if(this.target !== region.dnd.el) {
							this.target = region.dnd.el;
							region.dnd.trigger('dragenter', this.api, this.dnd.el);
						} else region.dnd.trigger('dragover', this.api, this.dnd.el);

					} else if(this.target) {
						$(this.target).data('dnd')[this.dnd.namespace()].trigger('dragleave', this.api, this.dnd.el);
						this.target = false;
					}
				}
			},
			
			end: function (event){
				this.event = event;

				if(this.started) this.stop();

				angular.element(document.body).dndEnableSelection();
			},	
		};

		function Mouse(dnd){
			this.manipulator = new Manipulator(dnd);
			this.mousedown = proxy(this, this.mousedown);
			this.mousemove = proxy(this, this.mousemove);
			this.mouseup = proxy(this, this.mouseup);
			this.manipulator.getClientAxis = this.getClientAxis;

			dnd.$el.on('mousedown', this.mousedown);
		}

		Mouse.prototype = {

			getClientAxis: function(event,s) {
				event = event ? event : this.event;
				s = s != undefined ? s : sens;

				return {
					top: event.clientY-s,
					left: event.clientX-s
				};
			},

			mousedown: function (event){
				if( this.manipulator.dnd.getHandledState() ) return;
								
				this.manipulator.dnd.setHandledState(true);
			
				this.manipulator.begin(event)
			
				this._startAxis = this.getClientAxis(event,0);
				this._moved = false;

				$document.on('mousemove', this.mousemove );
				$document.on('mouseup', this.mouseup );
			},

			mousemove: function(event){
				if(!this._moved) {
					var currAxis = this.getClientAxis(event,0);
					if( this._startAxis.top-sens >= currAxis.top || currAxis.top >= this._startAxis.top+sens || this._startAxis.left-sens >= currAxis.left || currAxis.left >= this._startAxis.left+sens ) this._moved = true;
					else return;
				}

				this.manipulator.progress(event);
			},
			
			mouseup: function(event){
				this.manipulator.dnd.setHandledState(false);
				
				this.manipulator.end(event);

				$document.off('mousemove', this.mousemove );
				$document.off('mouseup', this.mouseup );
			},

			destroy: function(){
				this.dnd.$el.off('mousedown', this.mousedown);
			},
		};


		function Touch(dnd){
			this.manipulator = new Manipulator(dnd);
			this.touchstart = proxy(this, this.touchstart);
			this.touchmove = proxy(this, this.touchmove);
			this.touchend = proxy(this, this.touchend);
			this.manipulator.getClientAxis = this.getClientAxis;

			dnd.$el.on('touchstart', this.touchstart);
		}

		Touch.prototype = {

			getClientAxis: function(event,s) {
				event = event ? event : this.event;
				s = s != undefined ? s : sens;
				event = event.originalEvent ? event.originalEvent : event;
				
				return {
					top: event.changedTouches[0].clientY-s,
					left: event.changedTouches[0].clientX-s
				};
			},
			
			touchstart: function (event){
				if( this.manipulator.dnd.getHandledState() ) return;
				
				this.manipulator.dnd.setHandledState(true);
						
				this._startAxis = this.getClientAxis(event);
				this._moved = false;

				this.manipulator.begin(event);

				$document.on('touchmove', this.touchmove );
				$document.on('touchend', this.touchend );
				
			},
			
			touchmove: function(event){
				if(!this._moved) {
					var currAxis = this.getClientAxis(event, 0);
					if( this._startAxis.top-sens >= currAxis.top || currAxis.top >= this._startAxis.top+sens || this._startAxis.left-sens >= currAxis.left || currAxis.left >= this._startAxis.left+sens ) this._moved = true;
					else return;
				}

				this.manipulator.progress(event);
			},
			
			touchend: function(event){
				this.manipulator.dnd.setHandledState(false);
				
				this.manipulator.end(event);

				$document.off('touchmove', this.touchmove );
				$document.off('touchend', this.touchend );
			},

			destroy: function(){
				this.dnd.$el.off('touchstart', this.touchstart);
			}
		};

		/**
		 * @name angular.element.dndBind
		 *
		 * @description
		 * Аналог jQuery.fn.bind(), только для drag and drop событий
		 *
		 * События также могут быть в формате <namespace.event>,
		 * но в отличие от jQuery.fn.bind() в нашем случае namespace позволяет не только групировать обработчики,
		 * но также и отделять области для droppable и draggable элементов. Поясним.
		 * Дело в том, что при определении событий элемент не явным образом приписывается к определенной области видимости (namespace),
		 * причем один элемент может одновременно находится в нескольких областях.
		 * Это означает, что для того, чтобы на элемент срабатывали droppable события, он должен находится в namespace draggable элемента.
		 * По умолчанию, если namespace не задан в наименовании обаботчика события, то эта область именуется 'common',
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

		angular.element.prototype.dndBind = function ( event, handler ) {
		
			if(!this.length) return this;

			var opts = [], events, obj, namespace, self = this;

			if(typeof event === 'object') {
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

			} else if(typeof event === 'string' && typeof handler === 'function') {
				events = event.trim().replace(/\s+/g, ' ').split(' ');

				for(var i=0; i < events.length; i++) {
					opts.push({
						event: events[i],
						handler: handler
					});
				}

			} else return this;

			if(!opts.length) return this;

			forEach(this, function(element){
				var data = $(element).data();

				if(!data.dnd) data.dnd = {};
				for(var i=0; i < opts.length; i++){
					event = opts[i].event
					handler = opts[i].handler;

					event = event.split('.');

					if(event[1] === undefined) {
						event[1] = event[0];
						event[0] = 'common';
					}

					namespace = event[0];
					event = event[1];

					if(!data.dnd[namespace]) data.dnd[namespace] = new Dnd(element, namespace);
					data.dnd[namespace].addListener(event, handler);
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
		 * 		Если object, то будут удалены callbacks события которые заданы в виде ключа и
		 * @param {(function=|string=)} arg2
		 * 		Если arg1 это string, то arg2 это callback, который будет вызван после наступления события.
		 * 		Если arg1 это object, то arg2 это string которая определяет имя используемого слоя.
		 * @param {string=} arg3
		 * 		Если задан arg1 и arg2, то arg3 это string которая определяет имя используемого слоя
		 * @returns {object} angular.element object.
		 */

		angular.element.prototype.dndUnbind =  function(){
			
			var args = arguments, events = [], default_ns = 'common';

			if(!this.length) return this;
			
			if(typeof args[0] == 'string') {
				args[0] = args[0].trim().replace(/\s+/g, ' ').split(' ');
			
				if(typeof args[1] == 'function') {
					
					for(var i = 0; i < args[0].length; i++){
						events.push({
							event: args[0][i],
							handler: args[1]
						});
					}
					
				} else {
					for(var i = 0; i < args[0].length; i++){
						events.push({
							event: args[0][i]
						});
					}
				}
				
			} else if( typeof args[0] == 'object') {
				
				for(var key in args[0]){
					if(args[0].hasOwnProperty(key)) {
						
						events.push({
							event: key.trim(),
							handler: args[0][key]
						});
						
					}
				}
				
			} else if(args.length !== 0) return this;

			forEach(this, function(element){
				var data = $(element).data();

				if(!data.dnd) return;
				
				if (args.length === 0) {
				
					for(var key in data.dnd){
						data.dnd[key].removeListener();
					}
					
				} else {
				
					for(var i = 0; i < events.length; i++) {
						var obj = events[i];
						
						obj.event = event.split('.');
						
						if(obj.event[1] == undefined) {
							obj.event[1] = obj.event[0];
							obj.event[0] = default_ns;
						}
						
						if(obj.event[0] == '*') {
							for(var key in data.dnd){
								data.dnd[key].removeListener( obj.event[1] );
							}
							
						} else data.dnd[ obj.event[0] ].removeListener( obj.event[1], obj.handler );
						
					}
					
				}
			});

			return this;
		}

	})();
	
	/* parsing like: ' a = fn1(), b = fn2()' into {a: 'fn1()', b: 'fn2()'} */
	
	function parseStringAsVars(str){
		if(!str) return undefined;
	
		var a = str.replace(/\s/g,'').split(','), ret = {};
		
		for( var i = 0; i < a.length; i++ ){
			a[i] = a[i].split('=');
			ret[a[i][0]] = a[i][1];
		}
		
		return ret;
	};


	/* DRAGGABLE DIRECTIVE: */

	module.directive('dndDraggable', function($timeout, $parse){
		return {
			require: ['?dndRect', '?dndModel', '?^dndContainer'],
			link: function(scope, $el, attrs, ctrls){
				var local, rect = ctrls[0], model = ctrls[1], container = ctrls[2];

				var opts = $parse(attrs.dndDraggable)() || {};
				var dragstartCallback = $parse(opts.onstart);
				var dragCallback = $parse(opts.ondrag);
				var dragendCallback = $parse(opts.onend);
				
				var namespace = opts.ns;

				if(!namespace) namespace = 'common';

				function dragstart(api){
					local = {};

					local.pos = $el.dndStyleRect();

					var axis = api.getAxis(), offset = {}, crect = $el.dndClientRect();
					offset.top = axis.top - crect.top;
					offset.left = axis.left - crect.left;
					offset.bottom = offset.top - crect.height;
					offset.right = offset.left - crect.width;
					api.offset( offset );
					
					local.onscroll = function(){
						api.container(container.getRect());
					}
					
					if(container) {
						api.container(container.getRect());
						
						local.$scrollarea = $el.dndGetParentScrollArea();
						
						local.$scrollarea.on('scroll',local.onscroll);
					}
					
					local.startBorders = api.getBorders();
					
					local.startAxis = Point(axis.left - local.startBorders.left, axis.top - local.startBorders.top);

					api.dragtarget = model ? model.get() : model;
					local.dragged = false;

					dragstartCallback(scope);

					scope.$apply();
				}

				function drag(api){
					if(!local.dragged) local.dragged = true;
				
					var axis = api.getAxis();
					
					var borders = api.getBorders();
					
					var subtract = Point(axis.left - borders.left, axis.top - borders.top).subtract(local.startAxis);
					
					var position = { top: local.pos.top + subtract.y, left: local.pos.left + subtract.x };

					// если draggable элемент имеет абсолютное позиционирование, то есть возможность расчитывать его координаты в процентах.
					// Что чаще всего намного удобнее. При относительном позиционировании функция $el.dndCss(['top','left'])
					// не верно расчитывает значение в некоторых мобильных браузерах. В частности Safari 7.0.4.

					//if(cssPosition == 'absolute') {
					//	position.top = position.top / parseFloat( local.parent.height() ) * 100 + '%';
					//	position.left = position.left / parseFloat( local.parent.width() ) * 100 + '%';
					//}

					if(rect) rect.update(position);
					else $el.dndCss(position);

					dragCallback(scope, {$droptarget: api.droptarget});

					scope.$apply();
				}

				function dragend(api){
					if(container) local.$scrollarea.off('scroll', local.onscroll); 

					dragendCallback(scope, {$droptarget: api.droptarget, $dragged: local.dragged});

					scope.$apply();
				}

				function getBindings(){

					var binding = {};

					binding[namespace+'.dragstart'] = dragstart;
					binding[namespace+'.drag'] = drag;
					binding[namespace+'.dragend'] = dragend;

					return binding;
				}

				var cssPosition =  $el.dndCss('position');

				if(cssPosition != 'fixed' && cssPosition != 'absolute' && cssPosition != 'relative') {
					cssPosition = 'relative';
					$el.dndCss('position', cssPosition);
				}

				$el.dndBind( getBindings() );
			}
		};
	});


	/* DROPPABLE DIRECTIVE: */

	module.directive('dndDroppable', function( $parse ){
		return {
			require: '?dndModel',
			link: function(scope, $el, attrs, model){
				
				var opts = $parse(attrs.dndDroppable)() || {};
				var dragenterCallback = $parse(opts.onenter);
				var dragoverCallback = $parse(opts.onover);
				var dragleaveCallback = $parse(opts.onleave);
				var dropCallback = $parse(opts.ondrop);
				var namespace = opts.ns;

				if(!namespace) namespace = 'common';
				

				function dragenter(api){
					api.droptarget = model ? model.get() : model;
					dragenterCallback(scope, { $dragtarget: api.dragtarget });
				
					scope.$apply();
				}

				function dragover(api){
					dragoverCallback(scope, { $dragtarget: api.dragtarget });

					scope.$apply();
				}

				function dragleave(api){
					dragleaveCallback(scope, { $dragtarget: api.dragtarget });
					api.droptarget = undefined;

					scope.$apply();
				}

				function drop(api){
					dropCallback(scope, { $dragtarget: api.dragtarget });

					scope.$apply();
				}

				function getBinding(){

					var binding = {};

					binding[namespace+'.dragenter'] = dragenter;
					binding[namespace+'.dragover'] = dragover;
					binding[namespace+'.dragleave'] = dragleave;
					binding[namespace+'.drop'] = drop;

					return binding;

				}

				$el.dndBind( getBinding() );

			}
		};
	});


	/* RESIZABLE DIRECTIVE: */

	module.directive('dndResizable', function($parse){
	
		function createHandleElement(side){
			return angular.element('<div></div>').addClass('angular-dnd-resizable-handle angular-dnd-resizable-handle-' + side);
		};
		
		function getCenterPoint(rect, scale){
			scale = typeof scale == 'object' ? scale : {x:1,y:1};

			return Point(rect.left + rect.width*scale.x/2, rect.top + rect.height*scale.y/2);
		};
	
		return {
			require: ['?dndRect', '?^dndContainer'],
			link: function(scope, $el, attrs, ctrls){
				var rect = ctrls[0], container = ctrls[1];

				var defaults = {
					handles: 'ne, se, sw, nw, n, e, s, w',
					minWidth: 20,
					minHeight: 20,
					maxWidth: 10000,
					maxHeight: 10000
				};

				var opts = extend({}, defaults, $parse(attrs.dndResizable)() || {});
				
				var dragstartCallback = $parse(opts.onstart);
				var dragCallback = $parse(opts.ondrag);
				var dragendCallback = $parse(opts.onend);

				function getBindings(side){
					var local;
					
					function dragstart(api){
					
						local = {};
		
						local.started = true;
						local.$parent = $el.parent();
						local.rads = $el.dndGetAngle();
						local.rotateMatrix = Matrix.IDENTITY.rotate(local.rads);
						local.inverseRotateMatrix = local.rotateMatrix.inverse();
						local.parentRect = local.$parent.dndClientRect();
		
						var axis = api.getAxis(), crect = $el.dndClientRect(), srect = local.rect = $el.dndStyleRect();
						
					
						local.onscroll = function(){
							api.container(container.getRect());
						}
					
						
						if(container) {
							api.container(container.getRect());
						
							local.$scrollarea = $el.dndGetParentScrollArea();
							
							local.$scrollarea.on('scroll',local.onscroll);
						}
						
						local.startBorders = api.getBorders();
						local.startAxis = Point(axis.left - local.startBorders.left, axis.top - local.startBorders.top);

						local.minScaleX = opts.minWidth / srect.width;
						local.minScaleY = opts.minHeight / srect.height;
						local.maxScaleX = opts.maxWidth / srect.width;
						local.maxScaleY = opts.maxHeight / srect.height;
						
						local.deltaX = crect.left - srect.left + crect.width / 2 - srect.width / 2;
						local.deltaY = crect.top - srect.top + crect.height / 2 - srect.height / 2;
						
				
						dragstartCallback(scope);
	
						scope.$apply();
					}
	
					function drag(api){
						if(!local.started) return;
						
						var axis = api.getAxis();
						var borders = api.getBorders();
						var vector = Point(axis.left - borders.left, axis.top - borders.top).subtract(local.startAxis).transform(local.inverseRotateMatrix);
						
						var scale = {x:1,y:1};
						
						var width = local.rect.width,
							height = local.rect.height,
							top = local.rect.top,
							left = local.rect.left
						
						switch(side){
							case 'n': scale.y = (height - vector.y) / height; break;
							case 'e': scale.x = (width + vector.x) / width; break;
							case 's': scale.y = (height + vector.y) / height; break;
							case 'w': scale.x = (width - vector.x) / width; break;
							case 'ne': scale.x = (width + vector.x) / width; scale.y = (height - vector.y) / height; break;
							case 'se': scale.x = (width + vector.x) / width; scale.y = (height + vector.y) / height; break;
							case 'sw': scale.x = (width - vector.x) / width; scale.y = (height + vector.y) / height; break;
							case 'nw': scale.x = (width - vector.x) / width; scale.y = (height - vector.y) / height; break;
						};
						
						scale.x = getNumFromSegment(local.minScaleX, scale.x, local.maxScaleX);
						scale.y = getNumFromSegment(local.minScaleY, scale.y, local.maxScaleY);
						
						var offset;
						var center = getCenterPoint(local.rect);
						var scaledCenter = getCenterPoint(local.rect, scale);
		
						switch(side){
							case 'n': offset = Point(left,top+height*scale.y).rotate(local.rads, scaledCenter).subtract( Point(left,top+height).rotate(local.rads, center) ); break;
							case 'e': offset = Point(left,top).rotate(local.rads, scaledCenter).subtract( Point(left,top).rotate(local.rads, center) ); break;
							case 's': offset = Point(left,top).rotate(local.rads, scaledCenter).subtract( Point(left,top).rotate(local.rads, center) ); break;
							case 'w': offset = Point(left+width*scale.x,top).rotate(local.rads, scaledCenter).subtract( Point(left+width,top).rotate(local.rads, center) ); break;
							case 'ne': offset = Point(left,top+height*scale.y).rotate(local.rads, scaledCenter).subtract( Point(left,top+height).rotate(local.rads, center) ); break;
							case 'se': offset = Point(left,top).rotate(local.rads, scaledCenter).subtract( Point(left,top).rotate(local.rads, center) ); break;
							case 'sw': offset = Point(left+width*scale.x,top).rotate(local.rads, scaledCenter).subtract( Point(left+width,top).rotate(local.rads, center) ); break;
							case 'nw': offset = Point(left+width*scale.x,top+height*scale.y).rotate(local.rads, scaledCenter).subtract( Point(left+width,top+height).rotate(local.rads, center) ); break;
						};
		
						var styles = {};
						styles.width = width * scale.x;
						styles.height = height * scale.y;
						styles.left = left - offset.x;
						styles.top = top - offset.y;
		
						var realCenter = Point(styles.left+local.deltaX+styles.width/2, styles.top+local.deltaY+styles.height/2);
						var boundedRect = Rect(styles.left+local.deltaX, styles.top+local.deltaY, styles.width, styles.height).applyMatrix( local.rotateMatrix, realCenter ).client();

						if(boundedRect.left+1 < local.startBorders.left || boundedRect.top+1 < local.startBorders.top || boundedRect.right-1 > local.startBorders.right || boundedRect.bottom-1 > local.startBorders.bottom) return;
						
						// если resizable элемент имеет абсолютное позиционирование, то есть возможность расчитывать его координаты в процентах.
						// Что чаще всего намного удобнее. При относительном позиционировании функция $el.css(['top','left'])
						// не верно расчитывает значение в некоторых мобильных браузерах. В частности Safari 7.0.4.
	
						//if(cssPosition == 'absolute') {
						//	styles.width = styles.width / parseFloat(local.parentRect.width) * 100 + '%';
						//	styles.height = styles.height / parseFloat(local.parentRect.height) * 100 + '%';
						//	styles.left = styles.left / parseFloat(local.parentRect.width) * 100 + '%';
						//	styles.top = styles.top / parseFloat(local.parentRect.height) * 100 + '%';
						//}
						
						if(rect) rect.update(styles);
						else $el.dndCss(styles);
					
						dragCallback(scope);
	
						scope.$apply();
					}
	
					function dragend(api){
						if(!local.started) return;
						
						if(container) local.$scrollarea.off('scroll', local.onscroll); 
						
						dragendCallback(scope);
	
						scope.$apply();
					}
					
					
					return {
						'$$resizable.dragstart': dragstart,
						'$$resizable.drag': drag,
						'$$resizable.dragend': dragend
					};

				}
				
				var cssPosition = $el.dndCss('position');

				if(cssPosition != 'fixed' && cssPosition != 'absolute' && cssPosition != 'relative') {
					cssPosition = 'relative';
					$el.dndCss('position', cssPosition);
				}
				
				var sides = opts.handles.replace(/\s/g,'').split(',');
				
				
				for(var i=0; i < sides.length; i++) {
					$el.append( createHandleElement( sides[i] ).dndBind( getBindings( sides[i] ) ) );
				}

			}
		};
	});	

	/* ROTATABLE DIRECTIVE*/
	
	module.directive('dndRotatable', function($parse){
		return {
			require: ['?dndRect', '?^dndContainer'],
			link: function(scope, $el, attrs, ctrls){
				var rect = ctrls[0], container = ctrls[1];
				
				var defaults = {

				};


				var opts = extend({}, defaults, $parse(attrs.dndRotatable)() || {});
				
				var dragstartCallback = $parse(opts.onstart);
				var dragCallback = $parse(opts.ondrag);
				var dragendCallback = $parse(opts.onend);
				var step = opts.step ? opts.step : 5; //degs
				
				var cssPosition = $el.dndCss('position');

				if(cssPosition != 'fixed' && cssPosition != 'absolute' && cssPosition != 'relative') {
					cssPosition = 'relative';
					$el.dndCss('position', cssPosition);
				}
				
				var handle = angular.element('<div class = "angular-dnd-rotatable-handle"></div>');
				
				$el.append(handle);
				
				function getBindings(){
					var local;
				
					return {
						dragstart: function(api, target){
							local = {};		
							
							var axis = api.getAxis(), crect = $el.dndClientRect();
							
							local.srect = $el.dndStyleRect();
							
							local.currAngle = $el.dndGetAngle();
							local.startPoint = Point(axis);
							
							if(container) api.container(container.getRect());
							
							local.borders = api.getBorders();
							
							local.center = Point(crect.left + crect.width / 2, crect.top + crect.height / 2);
							
							dragstartCallback(scope);
							
							scope.$apply();
						},
			
						drag: function(api, target){
							var axis = api.getAxis();
							var angle = Point(axis).deltaAngle(local.startPoint, local.center);
							var degs = radToDeg(local.currAngle+angle);
							
							
							degs = Math.round(degs/step)*step;
							var rads = degToRad(degs);
							var matrix = Matrix().rotate(rads);	
							
							var compute = Rect( local.center.x - local.srect.width/2, local.center.y - local.srect.height/2, local.srect.width, local.srect.height).applyMatrix( matrix, local.center ).client();
							
							if(compute.left < local.borders.left-1 || compute.top < local.borders.top-1 || (compute.left+compute.width) > local.borders.right+1 || (compute.top+compute.height) > local.borders.bottom+1) return;
		
							if(rect) rect.update('transform', matrix.toStyle());
							else $el.dndCss('transform',  matrix.toStyle());
							
							dragCallback(scope);
							
							scope.$apply();
						},
						
						dragend: function (api){
							if(!local.started) return;
							
							dragendCallback(scope);
		
							scope.$apply();
						}
					};
				}
				
				handle.dndBind( getBindings() );
			}
		};
	});
	




	/* LASSO CLASS: */

	module.factory('DndLasso', function () {

		var local, handler, $div = $('<div></div>').dndCss({position: 'absolute'});

		var defaults = {
			className: 'angular-dnd-lasso',
			container: 'body',
			offsetX: -1,
			offsetY: -1
		};
		


		function Handler(){

			this.getRect = function(){
				return local.rect;
			}

			this.getClientRect = function(){
				return $div.dndClientRect();
			}
			
		}

		function Lasso(options){

			var self = this;

			options = extend( {}, defaults, options );

			options.$el.dndBind({

				dragstart: function(api) {
					local = {}, handler = new Handler();
					handler.event = api.getEvent()
						
					local.start = {};
					local.startAxis = api.getAxis();

					$div.removeAttr('class style').removeClass('ng-hide').addClass(options.className);

					options.$el.append( $div );

					var $container = options.$el, crect = $container.dndClientRect(); 

					api.container(crect);

					self.onstart(handler);

				},

				drag: function(api) {
					handler.event = api.getEvent()

					var axis = api.getAxis();
					var areaRect = options.$el.dndClientRect();

					var changeTop = axis.top - local.startAxis.top;
					var changeLeft = axis.left - local.startAxis.left;

					var rect = {
						top: local.startAxis.top - areaRect.top,
						left: local.startAxis.left - areaRect.left,
						width: changeLeft,
						height: changeTop
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

					rect.top = rect.top+options.offsetY;
					rect.left = rect.left+options.offsetX;

					$div.dndCss(local.rect);

					self.ondrag(handler);
				},

				dragend: function(api) {
					handler.event = api.getEvent();
				
					self.onend(handler);
					
					$div.addClass('ng-hide');

					$(document.body).append( $div );
				}
			});

			this.destroy = function(){
				options.$el.dndUnbind();
			};
		}

		Lasso.prototype = {
			onstart: function(){},
			ondrag: function(){},
			onend: function(){},
		}

		return Lasso;
	});



	/* LASSO AREA DIRECTIVE: */

	module.directive('dndLassoArea', function(DndLasso, $parse){

		function Controller(){
			var ctrls = [], data = {};

			this.data = function(){
				return data;
			};

			this.unselecting = function(ctrl){
				for(var i = 0; i < ctrls.length; i++){
					if(ctrls[i] != ctrl) ctrls[i].unselecting();
				}
			};

			this.unselected = function(ctrl){
				for(var i = 0; i < ctrls.length; i++){
					if(ctrls[i] != ctrl) ctrls[i].unselected();
				}
			};

			this.complete = function(){
				for(var i = 0; i < ctrls.length; i++){
				
					if(ctrls[i].isSelecting()) {
						ctrls[i].unselecting();

						if(ctrls[i].isSelected()) ctrls[i].unselected();
						else ctrls[i].selected();
					}
				}
			};

			this.progress = function(rect){
				for(var i = 0; i < ctrls.length; i++) {
					if( ctrls[i].hit(rect)) {
						if(!ctrls[i].isSelecting()) ctrls[i].selecting();
					} else ctrls[i].unselecting();
				}
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

			this.selectable = function(element){
				for(var i = 0; i < ctrls.length; i++){
					if(ctrls[i].getElement()[0] == element) return ctrls[i];
				}

				return false;
			};

			this.empty = function(){
				return !ctrls.length;
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
			link: function(scope, $el, attrs, ctrl){
				var callback = $parse(attrs.dndLassoArea), lasso = new DndLasso({ $el:$el }), dragged, initiatedCtrl;

				ctrls.push(ctrl);

				lasso.onstart = function(handler) {
					dragged = true;
				}
				
				lasso.ondrag = function(handler) {

					if(ctrl.empty()) return;

					ctrl.progress( handler.getClientRect() );

					scope.$apply();
				}

				lasso.onend = function(handler) {
					if(!ctrl.empty()) ctrl.complete();
					
					callback(scope, { $rect: handler.getRect() });
					
					scope.$apply();
				}

				$el.on('mousedown touchstart', function(event){

					if(ctrl.empty()) return;

					ctrl.unselecting();

					if(!event.metaKey && !event.ctrlKey && !event.shiftKey) ctrl.unselected();
					
					initiatedCtrl = ctrl.selectable(event.target);
						
					if(initiatedCtrl) initiatedCtrl.selecting();

					scope.$apply();

				});
				
				$el.on('mouseup touchend', function(event){
					if(ctrl.empty()) return;
					
					if(!dragged && initiatedCtrl && initiatedCtrl === ctrl.selectable(event.target)) {
					
						initiatedCtrl.unselecting().toggleSelected();
						
						callback(scope, { $rect: false });
						
						scope.$apply();
					} else dragged = false;
				});

				$el.on('$destroy', function(){
					ctrls.remove(ctrl);

					scope.$apply();
				});
			}
		};
	});



	/* SELECTABLE DIRECTIVE: */

	module.directive('dndSelectable', function($parse){

		var defaults = {};

		function Controller($element, $attrs, $scope){
			var selected = false, selecting = false;
			var opts = extend({}, defaults, $parse($attrs.dndSelectable)() || {});

			var selectedCallback = $parse(opts.selected);
			var unselectedCallback = $parse(opts.unselected);
			var selectingCallback = $parse(opts.selecting);
			var unselectingCallback = $parse(opts.unselecting);

			this.getElement = function(){
				return $element;
			};

			this.isSelected = function(){
				return selected;
			};

			this.isSelecting = function(){
				return selecting;
			};

			this.toggleSelecting = function(){
				return selecting ? !!this.unselecting() : !this.selecting();
			};

			this.toggleSelected = function(){
				return selected ? !!this.unselected() : !this.selected();
			};

			this.selecting = function(){
				if(selecting) return;

				selecting = true;

				selectingCallback($scope);

				return this;
			};

			this.unselecting = function(){
				if(!selecting) return;

				selecting = false;

				unselectingCallback($scope);

				return this;
			};

			this.selected = function(){
				if(selected) return;
				
				selected = true;

				selectedCallback($scope);

				return this;
			};
			
			this.unselected = function(){
				if(!selected) return;

				selected = false;

				unselectedCallback($scope);

				return this;
			};

			this.hit = function(a){
				var b = this.rectCtrl.getClient();

				for(var key in b) {
					b[key] = parseFloat(b[key]);
				}

				b.bottom = b.bottom == undefined ? b.top + b.height : b.bottom;
				b.right = b.right == undefined ? b.left + b.width : b.right;
				a.bottom = a.bottom == undefined ? a.top + a.height : a.bottom;
				a.right = a.right == undefined ? a.left + a.width : a.right;

				return (
					a.top <= b.top && b.top <= a.bottom && ( a.left <= b.left && b.left <= a.right || a.left <= b.right && b.right <= a.right ) ||
					a.top <= b.bottom && b.bottom <= a.bottom && ( a.left <= b.left && b.left <= a.right || a.left <= b.right && b.right <= a.right ) ||
					a.left >= b.left && a.right <= b.right && ( b.top <= a.bottom && a.bottom <= b.bottom ||  b.bottom >= a.top && a.top >= b.top || a.top <= b.top && a.bottom >= b.bottom) ||
					a.top >= b.top && a.bottom <= b.bottom && ( b.left <= a.right && a.right <= b.right || b.right >= a.left && a.left >= b.left || a.left <= b.left && a.right >= b.right) ||
					a.top >= b.top && a.right <= b.right && a.bottom <= b.bottom && a.left >= b.left
				);
			};
		}

		return {
			restrict: 'A',
			require: ['dndSelectable', '^dndLassoArea', 'dndRect', '?dndDraggable'],
			controller: Controller,
			link: function(scope, $el, attrs, ctrls) {
				var startPos, rectCtrl = ctrls[2];

				ctrls[0].rectCtrl = rectCtrl;

				ctrls[1].add(ctrls[0]);

				function ondestroy() {
					ctrls[1].remove(ctrls[0]);

					scope.$apply();
				}

				$el.on('$destroy', ondestroy);

			}
		};
	});

	/* DND-MODEL */

	module.directive('dndModel', function($parse){

		function Controller( $scope, $attrs ){
			var getter = $parse($attrs.dndModel), setter = getter.assign

			this.set = function(value){
				setter($scope, value);
			};

			this.get = function(){
				return getter($scope);
			};
		}

		return {
			restrict: 'A',
			controller: Controller
		}
	});

	/* DND-CONTAINER */

	module.directive('dndContainer', function($parse){

		function Controller( $element ){
			this.getRect = function(){
				return extend({}, $element.dndClientRect());
			};
			
		}

		return {
			restrict: 'CA',
			controller: Controller,
		}
	});


	/* RECTANGLE DIRECTIVE: */

	module.directive('dndRect', function($parse){
		var styles = ['top','right','bottom','left','width','height','transform'], base = ['left','top','width','height'];

		styles.has = function(val){
			return this.indexOf(val) > -1;
		}

		function Controller( $scope, $attrs, $element ){

			var getter = $parse($attrs.dndRect), setter = getter.assign, rect = getter($scope);

			this.update = function(prop, value) {
				var values;
				
				if(typeof prop != 'object') {
					values = {};
					values[prop] = value;	
				} else values = prop;

				for(var key in values){
					if( styles.has(key) ) {
						if(typeof values[key] === 'number') values[key] = values[key]+'px';

						rect[key] = values[key];
					}
				} 

				setter($scope, rect);
			}

			this.get = function(){
				return extend({},rect);
			}

			this.getClient = function(){
				return $element.dndClientRect();
			}

			rect = typeof rect == 'object' ? rect : {};

			for(var key in rect){
				if(key !== key.toLowerCase()) {
					rect[key.toLowerCase()] = rect[key];
					delete rect[key];
				}
			}

			for(var key in rect) if(!styles.has(key)) delete rect[key];

			var css = $element.dndCss(base);

			if(rect.top == undefined) rect.top = css.top;
			if(rect.left == undefined) rect.left = css.left;
			if(rect.width == undefined) rect.width = css.width;
			if(rect.height == undefined) rect.height = css.height;

			this.update(rect);
		}

		return {
			restrict: 'A',
			controller: Controller,
			link: function(scope, $el, attrs) {

				scope.$watch(attrs.dndRect, function (n, o) {

					if(!n || typeof n != 'object') return;
					if(o == undefined) o = {};

					var css = {};

					for(var val, i=0; i < styles.length; i++ ){
						val = styles[i];
	
						if(n[val] == undefined && o[val] != undefined) css[val] = '';
						else if(n[val] != undefined) css[val] = n[val];
					}
					
					if(css['transform']) css[TRANSFORM] = css['transform'];

					$el.dndCss(css);

			   }, true);

			}
		};
	});

	/* FITTEXT DIRECTIVE: */

	/**
	 * @name dnd.fittext
	 *
	 * @description
	 * Отличная функция для подгонки текста под размер блока, в котором этот текст находится.
	 * за единственный аргумент функция принимает объект rect, содержащий в себе ширину (width) и высоту (height) элемента.
	 * На основе этих параметров идет расчет высоты шрифта.
	 * Также у директвы есть дополнительные атрибуты-настройки: dnd-fittext-max и dnd-fittext-min,
	 * которые позволяют задать максимальное и минимальное соответственно значение шрифта.
	 *
	 */

	module.directive('dndFittext', function( $timeout, $window ){
		var $span = $('<span></span>').dndCss({'position':'absolute','left':-10000, 'top':-10000, 'opacity':0, 'z-index': -9999});

		$(document.body).append( $span );

		function encodeStr(val) {
			var val = $span.text(val).html().replace(/\s+/g, ' ')
			if($span[0].tagName == 'INPUT' || $span[0].tagName == 'TEXTAREA') val = val.replace(/\s/g,'&nbsp;');

			return val;
		}

		function getRealSize(text, font) {
			$span.html( encodeStr(text) ).dndCss(font);

			var rect = $span[0].getBoundingClientRect();

			return {
				width: parseFloat(rect.width),
				height: parseFloat(rect.height)
			}
		}

		function getCurrSize($el, offsetWidthPrct, offsetHeightPrct){
			var rect = $el[0].getBoundingClientRect();

			return {
				width: parseFloat(rect.width)*(100-offsetWidthPrct)/100,
				height: parseFloat(rect.height)*(100-offsetHeightPrct)/100
			}
		}

		return {
			restrict: 'A',
			link: function(scope, $el, attrs) {

				function updateSize(size) {
					$timeout(function(){
						var font = $el.dndCss(
							['font-size','font-family','font-weight','text-transform','border-top','border-right','border-bottom','border-left','padding-top','padding-right','padding-bottom','padding-left']
						), text = $el.text();

						var realSize = getRealSize(text, font), currSize = getCurrSize($el,0,0);

						currSize.width = parseFloat(size.width);
						currSize.height = parseFloat(size.height);

						var kof1 = currSize.height / realSize.height;
						var kof2 = currSize.width / realSize.width;

						var max = scope.$eval(attrs.dndFittextMax);
						var min = scope.$eval(attrs.dndFittextMin);

						if(min == undefined) min = 0;
						if(max == undefined) max = Number.POSITIVE_INFINITY;

						var kof = (kof1 < kof2 ? kof1 : kof2);

						//Корректировка плавности
						kof *= 0.75;
						if((kof > 0.95 && kof <= 1) || (kof >= 1 && kof < 1.05) ) return;

						var n = kof * parseFloat(font['font-size']);

						n = getNumFromSegment(min, n, max);

						$el.dndCss('font-size', n+'px');
					})
				}

				scope.$watch( attrs.dndFittext, updateSize, true);

				$($window).on('resize', updateSize);
			}
		};
	});


})(angular, undefined);