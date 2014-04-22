## Angular-DND 0.1.2

## Особенности:
- Не jQueryUI обертка
- Поддержка touch событий


## Директивы:

### dnd-draggable [expression]
Обеспечивает возможность перемещения элемент. Параметр 'false' отключает директиву.

#### dnd-draggable-opts [expression]
- ns[string]: Имя namespace. Что бы droppable-элементы реагировали на draggable-элементы они должны иметь общий namespace. По умолчанию namespace = 'common'
	
#### directive watchers:
- dnd-on-dragstart [function]: срабатывающая в начале движения элемента 
- dnd-on-drag [function]: срабатывающая при движении элемента 
- dnd-on-dragend [function]: срабатывающая в конце движения элемента

#### scope:
- $dragged [boolean] - флаг, который позволяют узнать было ли движение элемента в течении последнего цикла событий (последние ~5мс). Удобно использовать например в ng-click (см. пример).
- $dropmodel [string] - модель droppable элемента, заданная в директиве dnd-model



### dnd-droppable [expression]
Позволяет определить droppable-элемент, который будет реагировать на draggable-элементы. Параметр 'false' отключает директиву.

#### dnd-droppable-opts [expression]
- ns[string]: Имя namespace. Что бы droppable-элементы реагировали на draggable-элементы они должны иметь общий namespace. По умолчанию namespace = 'common'
	
#### directive watchers:
- dnd-on-dragenter [function]: срабатывающая при попадании draggable-элемента в пределы droppable-элемента  
- dnd-on-dragover [function]: срабатывающая при движении draggable-элемента внутри droppable-элемента  
- dnd-on-dragleave [function]: срабатывающая при выходе draggable-элемента за пределы droppable-элемента  
- dnd-on-drop [function]: срабатывающая если отпустить draggable-элемент внутри границ droppable-элемента 

#### scope:
- $dragmodel [string] модель draggable элемента, заданая в директиве dnd-model





### dnd-rotatable [expression]
Обеспечивает возможность вращения элемента. Параметр 'false' отключает директиву.

#### directive watchers:
- dnd-on-dragstart [function]: срабатывает в начале вращения элемента  
- dnd-on-drag [function]: срабатывает при вращении элемента
- dnd-on-dragend [function]: срабатывает в конце вращения элемента 

#### scope:
- $rotated [expression] - флаг, который позволяют узнать вращался ли элемент в течении последнего цикла событий (последние ~5мс). Удобно использовать например в ng-click (см. пример).




### dnd-resizable [expression]
Обеспечивает возможность изменения размеров элемента. Параметр 'false' отключает директиву.

#### directive watchers:
- dnd-on-dragstart [function]: срабатывает в начале изменения размеров элемента  
- dnd-on-drag [function]: срабатывает при изменении размеров элемента
- dnd-on-dragend [function]: срабатывает в конце изменения размеров элемента 

#### scope:
- $resized [expression] - флаг, который позволяют узнать было ли изменение размеров элемента в течении последнего цикла событий (последние ~5мс). Удобно использовать например в ng-click (см. пример).




### dnd-rect
Директива, которая представляет собой модель элемента, описывающую его координаты относительно верхнего левого угла, размеры и матрицу преобразования (top, left, width, height, transform).
Директивы dnd-draggable, dnd-resizable, dnd-rotatable, dnd-fittext, а также dnd-selectable(опционально) работают в связке с dnd-rect.

#### Параметр (строка): 
 - имя переменной в scope



### dnd-container 
Ограничивает область действия draggable/resizable/rotatable элементов. По умолчанию контейнером служит body.



### dnd-lasso-area
Директива, предназначенная для создания rect моделей с помощью инструмента lasso. Также эта директива работает в паре с selectable директивой (в роли контейнера) (см. пример)

Параметр (задаются в виде объекта, callbacks задаются в кавычках):
- onstart() - функция, срабатывающая в начале изменения размеров элемента. В отличии от dragable, resizable и rotatable директив, где start событие срабатывет после начала движения манипулятора (mousemove/touchmove) здесь началом считаются события mousedown/touchstart
- ondrag() - функция, срабатывающая при изменении размеров элемента 
- onend() - функция, срабатывающая в конце изменения размеров элемента 

#### scope:
- $dragged [expression] - флаг, который позволяют узнать было ли движение lasso в течении последнего цикла событий (последние ~5мс). Удобно использовать например в ng-click (см. пример).



### dnd-selectable [expression]
Директива, позволяющая выделять объекты. Как инструмент выделения используется lasso (см. пример). Параметр 'false' отключает директиву.
Последователбность событий: если click - selected(true/false). Если не click - selecting(true) -> selected(true/false) -> selecting(false)

Требование:
- dnd-lasso-area как родительский элемент

#### Параметр (задается в виде объекта, callbacks задаются в кавычках):
- selected(): срабатывает при изменении значения scope.$selected c false на true
- unselected(): срабатывает при изменении значения scope.$selected c true на false
- selecting(): срабатывает при изменении значения scope.$selecting c false на true
- unselecting(): срабатывает при изменении значения scope.$selecting c true на false

#### scope:
- $selected [boolean]
- $selecting [boolean]
- $select [function] функция для управления флагом selected (см. пример)
- $unselect [function] функция для управления флагом selected (см. пример)


 dnd-selectable = "model.selectable"
 dnd-model-selected = "model.selected"
 dnd-model-selecting = "model.selecting"
 dnd-on-selected = "onSelected(model, $keypressed)"
 dnd-on-unselected = "onUnselected(model)"
 dnd-on-selecting = "onSelecting(model)"
 dnd-on-unselecting = "onUnselecting(model)"






### dnd-fittext 
Отличная директива для подгонки текста под размер блока (удобно с resizable элементами), в котором этот текст находится.
за единственный аргумент функция принимает объект rect, содержащий в себе 
На основе этих параметров идет расчет высоты шрифта.
Также директва поддерживает дополнительные атрибуты-настройки: dnd-fittext-max и dnd-fittext-min, которые позволяют задать максимальное и минимальное соответственно значения шрифта в пикселях. 

#### Параметр:
- имя переменной scope изменение величины которой служит тригером (может быть объектом, например {width: rect.width, height: rect.height} или строкой, например rect.height, где rect это модель, определенная в атрибуте dnd-rect , см. пример). 




## Сервисы:

### DndLasso
Сервис-класс, предназначенный для обеспечения директивам интерфейса к одноименному инструменту прямоугольного lasso


## Примеры
 все примеры внутри в папке Demo.


## TODO:
 - fixing bugs and optimize code
 - more options
 - new directive - sortable
 - touch specific events (rotate, resize)
 - supporting ng-animate
 - supporting HTML5
 - translate to english