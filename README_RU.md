[![Join the chat at https://gitter.im/Tuch/angular-dnd](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Tuch/angular-dnd?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Angular-DND 0.1.22
=========

Особенности:
---------
- Не jQueryUI обертка
- Поддержка touch событий

Директивы:
---------

### dnd-draggable [expression]
Обеспечивает возможность перемещения элемент. Параметр 'false' отключает директиву.

#### dnd-draggable-opts [object] - опции директивы:
- layer[string]: Имя layer. Что бы droppable-элементы реагировали на draggable-элементы они должны находиться на одном layer. По умолчанию layer = 'common'
- useAsPoint[boolean]: Droppable область будет взаимодействовать с элементом, только если курсор манипулятора окажется в пределах droppable элемента
- helper[string]: 'clone' или templateUrl - позволяют для перемещения использовать helper, а не сам элемент
- handle[string]: селектор хэндла, который будет использован для перетягивания элемента

#### watching attributes:
- dnd-on-dragstart [function()]: срабатывающая в начале движения элемента
- dnd-on-drag [function()]: срабатывающая при движении элемента
- dnd-on-dragend [function()]: срабатывающая в конце движения элемента

#### scope:
- $dragged [boolean] - флаг, который позволяют узнать было ли движение элемента в течении последнего цикла событий (последние ~5мс). Удобно использовать например в ng-click (см. пример).
- $dropmodel [string] - модель droppable элемента, заданная в директиве dnd-model

### dnd-pointer-none
Атрибут работает по аналогии с pointer-events: none - игнорирование событий, но по отношению к dnd- директивам (см.пример 2 sortable директивы - поле для ввода текста)




### dnd-droppable [expression]
Позволяет определить droppable-элемент, который будет реагировать на draggable-элементы. Параметр 'false' отключает директиву.

#### dnd-droppable-opts [object]:
- layer[string]: Имя layer. Что бы droppable-элементы реагировали на draggable-элементы они должны находитья на одном layer. По умолчанию layer = 'common'

#### watching attributes:
- dnd-on-dragenter [function()]: срабатывающая при попадании draggable-элемента в пределы droppable-элемента
- dnd-on-dragover [function()]: срабатывающая при движении draggable-элемента внутри droppable-элемента
- dnd-on-dragleave [function()]: срабатывающая при выходе draggable-элемента за пределы droppable-элемента
- dnd-on-drop [function()]: срабатывающая если отпустить draggable-элемент внутри границ droppable-элемента

#### scope:
- $dragmodel [string] модель draggable элемента, заданая в директиве dnd-model





### dnd-rotatable [expression]
Обеспечивает возможность вращения элемента. Параметр 'false' отключает директиву.

#### watching attributes:
- dnd-on-dragstart [function()]: срабатывает в начале вращения элемента
- dnd-on-drag [function()]: срабатывает при вращении элемента
- dnd-on-dragend [function()]: срабатывает в конце вращения элемента

#### scope:
- $rotated [boolean] - флаг, который позволяют узнать вращался ли элемент в течении последнего цикла событий (последние ~5мс). Удобно использовать например в ng-click (см. пример).





### dnd-resizable [expression]
Обеспечивает возможность изменения размеров элемента. Параметр 'false' отключает директиву.

#### watching attributes:
- dnd-on-dragstart [function()]: срабатывает в начале изменения размеров элемента
- dnd-on-drag [function()]: срабатывает при изменении размеров элемента
- dnd-on-dragend [function()]: срабатывает в конце изменения размеров элемента

#### scope:
- $resized [boolean] - флаг, который позволяют узнать было ли изменение размеров элемента в течении последнего цикла событий (последние ~5мс). Удобно использовать например в ng-click (см. пример).




### dnd-sortable-list [expression]
Список элементов для сортировки (он же может быть указан в ng-repeat)




### dnd-sortable [expression]
Позволяет организовать сортировку списка

#### watching attributes:
- dnd-on-dragstart [function()]: срабатывает в начале изменения размеров элемента
- dnd-on-drag [function()]: срабатывает при изменении размеров элемента
- dnd-on-dragchange [function()]: срабатывает при изменении позиции элемента
- dnd-on-dragend [function()]: срабатывает в конце изменения размеров элемента





### dnd-lasso-area [expression]
Директива, предназначенная для создания rect моделей с помощью инструмента lasso. Также эта директива работает в паре с selectable директивой (в роли контейнера) (см. пример). Параметр 'false' отключает директиву.

#### watching attributes:
 - dnd-on-lassostart [function()]: срабатывает в начале изменения размеров lasso.
 - dnd-on-lasso [function([rect])]: срабатывает при изменении размеров lasso
 - dnd-on-lassoend [function([rect])]: срабатывает при окончании изменения размеров lasso

#### scope:
- $dragged [boolean] - флаг, который позволяют узнать было ли движение lasso в течении последнего цикла событий (последние ~5мс). Удобно использовать например в ng-click (см. пример).





### dnd-selectable [expression]
Директива, позволяющая выделять объекты. Как инструмент выделения используется lasso (см. пример). Параметр 'false' отключает директиву.

#### Требования:
 - dnd-lasso-area как родительский элемент

#### watching attributes:
 - dnd-on-selected [function([$keyPressed])]: срабатывает после изменением значения selected (dnd-model-selected) c false на true.
 - dnd-on-unselected [function([$keyPressed])]: срабатывает после изменениеми значения selected (dnd-model-selected) c true на false.
 - dnd-on-selecting [function([$keyPressed])]: срабатывает после изменением значения selecting (dnd-model-selecting) c false на true.
 - dnd-on-unselecting [function([$keyPressed])]: срабатывает после изменением значения selecting (dnd-model-selecting) c true на false.

#### model attributes:
 - dnd-model-selected: указывается име переменной в scope, в которой хранится состояние selected
 - dnd-model-selecting:  указывается име переменной в scope, в которой хранится состояние selecting

#### scope:
- $keypressed - флаг, который указывает, была ли нажата клавиша ctrl, shift или cmd во время события

#### Последовательность событий:
- Если click - selected(true/false).
- Если не click - selecting(true) -> selected(true/false) -> selecting(false)





### dnd-rect (string)
Директива, которая представляет собой модель элемента, описывающую его координаты относительно верхнего левого угла, размеры и матрицу преобразования (top, left, width, height, transform).
Директивы dnd-draggable, dnd-resizable, dnd-rotatable, dnd-fittext, а также dnd-selectable(опционально) работают в связке с dnd-rect.





### dnd-containment(string, selector)
Ограничивает область действия draggable/resizable/rotatable элементов. По умолчанию контейнером служит body.





### dnd-fittext
Отличная директива для подгонки текста под размер блока (удобно с resizable элементами), в котором этот текст находится.
за единственный аргумент функция принимает объект rect, содержащий в себе
На основе этих параметров идет расчет высоты шрифта.
Также директва поддерживает дополнительные атрибуты-настройки: dnd-fittext-max и dnd-fittext-min, которые позволяют задать максимальное и минимальное соответственно значения шрифта в пикселях.

#### Параметр:
- имя переменной scope изменение величины которой служит тригером (может быть объектом, например {width: rect.width, height: rect.height} или строкой, например rect.height, где rect это модель, определенная в атрибуте dnd-rect , см. пример).







Сервисы:
---------

### DndLasso
Сервис-класс, предназначенный для обеспечения директивам интерфейса к одноименному инструменту прямоугольного lasso





### dndKey
Сервис для отслеживания нажатых на клавиатуре клавиш

#### Методы
 - get(): Получить массив нажатых клавиш
 - isset(code): Проверить состояние клавиши по коду клавиши





Примеры
---------

Все примеры внутри в папке Demo.
Также доступна [ссылка](http://tuch.github.io/angular-dnd/demo)


TODO:
---------

- **more options**
	- ensure rapid expandability options
- **supporting touch specific events (rotate, resize)**
- **supporting dynamic options**
- **supporting ng-animate**
- **supporting HTML5 dnd events**

[![Join the chat at https://gitter.im/Tuch/angular-dnd](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Tuch/angular-dnd?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
