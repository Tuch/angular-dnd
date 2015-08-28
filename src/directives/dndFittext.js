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

module.directive('dndFittext', ['$timeout', '$window', function( $timeout, $window ){
    var $span = $('<span></span>').dndCss({'position':'absolute','left':-99999, 'top':-99999, 'opacity':0, 'z-index': -9999});

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

            function updateSize(opts) {
                opts = opts === undefined ? {} : opts;
                var font = $el.dndCss(
                    ['font-size','font-family','font-weight','text-transform','border-top','border-right','border-bottom','border-left','padding-top','padding-right','padding-bottom','padding-left']
                ), text = opts.text == undefined ? $el.text() || $el.val() : opts.text;

                var sizes = [];
                if(opts.width === undefined) sizes.push('width');
                if(opts.height === undefined) sizes.push('height');

                if(sizes.length) sizes = $el.dndCss(sizes);

                for(var key in sizes){
                    var val = sizes[key];

                    if(val[val.length-1] == '%') return;
                    opts[key] = sizes[key];
                }

                var realSize = getRealSize(text, font), currSize = getCurrSize($el,0,0);
                if(!realSize.width || !realSize.height) {
                    $el.dndCss('font-size', '');
                    return
                }

                currSize.width = parseFloat(opts.width);
                currSize.height = parseFloat(opts.height);

                var kof1 = currSize.height / realSize.height;
                var kof2 = currSize.width / realSize.width;

                var max = scope.$eval(attrs.dndFittextMax);
                var min = scope.$eval(attrs.dndFittextMin);

                if(min == undefined) min = 0;
                if(max == undefined) max = Number.POSITIVE_INFINITY;

                var kof = (kof1 < kof2 ? kof1 : kof2);

                //Корректировка плавности
                kof *= 0.85;
                if((kof > 0.95 && kof <= 1) || (kof >= 1 && kof < 1.05) ) return;

                var n = kof * parseFloat(font['font-size']);

                n = getNumFromSegment(min, n, max);

                $el.dndCss('font-size', n+'px');
            }

            scope.$watch( attrs.dndFittext, throttle(function(opts){
                updateSize(opts);
            }), true);

            $($window).on('resize', function(){
                updateSize();
            });
        }
    };
}])
