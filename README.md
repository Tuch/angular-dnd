[![Join the chat at https://gitter.im/Tuch/angular-dnd](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Tuch/angular-dnd?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Angular-DND 0.1.22
=========

Features:
---------
- Not jQueryUI wrapper
- Support touch events

Directives:
---------

### dnd-draggable [expression]
Provides movement ability to the element. Parameter 'false' disables the directive.

#### dnd-draggable-opts [object] - directive options:
- layer[string]: What would droppable elements react to draggable elements, they must be in a single layer. By default, layer = 'common'
- useAsPoint[boolean]: Droppable area will interact with the item only if the manipulator cursor will be within the droppable element
- helper[string]: 'clone' or templateUrl - allow to move to use helper, instead of the element
- handle[string]: Selector of handle element to be used for pulling element

#### watching attributes:
- dnd-on-dragstart [function()]: Triggered at the start of drag element
- dnd-on-drag [function()]: Triggered at the process of drag element
- dnd-on-dragend [function()]: Triggered at the end of drag element

#### scope:
- $dragged [boolean] - Register that lets you know whether the movement element during the last cycle of events (the last ~ 5ms). Convenient to use for example in ng-click (see. Example).
- $dropmodel [string] - Droppable element model defined in the dnd-model directive

### dnd-pointer-none
Attribute operates similar to the pointer-events: none - ignoring the event, but in relation to dnd- directives (see Example 2 sortable directive - the text field)




### dnd-droppable [expression]
Create targets for draggable elements. Parameter 'false' disables the directive.

#### dnd-droppable-opts [object]:
- layer[string]: What would droppable elements react to draggable elements, they must be in a single layer. By default, layer = 'common'

#### watching attributes:
- dnd-on-dragenter [function()]: Triggered when hit draggable within the droppable
- dnd-on-dragover [function()]: Triggered when an accepted draggable is dragged over the droppable
- dnd-on-dragleave [function()]: Triggered when leave draggable within the droppable
- dnd-on-drop [function()]: Triggered when an accepted draggable is dropped on the droppable

#### scope:
- $dragmodel [string] Draggable element model defined in the dnd-model directive





### dnd-rotatable [expression]
Provides rotate ability to the element. Parameter 'false' disables the directive.

#### watching attributes:
- dnd-on-dragstart [function()]: Triggered at the start of element rotation
- dnd-on-drag [function()]: Triggered at the process of element rotation
- dnd-on-dragend [function()]: Triggered at the end of element rotation

#### scope:
- $rotated [boolean] - Register that lets you know whether the element rotation during the last cycle of events (the last ~ 5ms). Convenient to use for example in ng-click (see. Example).





### dnd-resizable [expression]
Provides resize ability to the element. Parameter 'false' disables the directive.

#### watching attributes:
- dnd-on-dragstart [function()]: Triggered at the start of resizing element
- dnd-on-drag [function()]: Triggered at the process of resizing element
- dnd-on-dragend [function()]: Triggered at the end of resizing element

#### scope:
- $resized [boolean] - Register that lets you know whether the element resizing during the last cycle of events (the last ~ 5ms). Convenient to use for example in ng-click (see. Example).


### dnd-sortable-list [expression]
List of sortable items

### dnd-sortable [expression]
Reorder elements in a list or grid.

#### watching attributes:
- dnd-on-sortstart [function()]: Triggered at the start of sorting element
- dnd-on-sort [function()]: Triggered at the process of sorting element
- dnd-on-sortchange [function()]: This event is triggered during sorting, but only when the DOM position has changed
- dnd-on-sortend [function()]: Triggered at the end of sorting element



### dnd-lasso-area [expression]
This Directive is to create rect models with lasso tool. Also, this directive can work with a selectable directive (as a container) (see. Example). Parameter 'false' disables the directive.

#### watching attributes:
 - dnd-on-lassostart [function()]: Triggered at the start of lasso change size
 - dnd-on-lasso [function([rect])]: Triggered at process of lasso change size
 - dnd-on-lassoend [function([rect])]: Triggered at end of lasso change size

#### scope:
- $dragged [boolean] - Register that lets you know whether the movement leasso during the last cycle of events (the last ~ 5ms). Convenient to use for example in ng-click (see. Example).





### dnd-selectable [expression]
Use manipulator to select elements, individually or in a group.

#### Requirements:
 - dnd-lasso-area как родительский элемент

#### watching attributes:
 - dnd-on-selected [function([$keyPressed])]: interrupt after changing selected value (dnd-model-selected) from false to true.
 - dnd-on-unselected [function([$keyPressed])]: interrupt after changing selected value (dnd-model-selected) from true на false.
 - dnd-on-selecting [function([$keyPressed])]: interrupt after changing  selecting value (dnd-model-selecting) from false на true.
 - dnd-on-unselecting [function([$keyPressed])]: interrupt after changing selecting value (dnd-model-selecting) from true на false.

#### model attributes:
 - dnd-model-selected: varibale name of selected state
 - dnd-model-selecting: varibale name of selecting state

#### scope:
- $keypressed - Register that indicates whether the button is pressed ctrl, shift or cmd during the event

#### Sequence of events:
- if click - selected(true/false).
- If not click - selecting(true) -> selected(true/false) -> selecting(false)




### dnd-rect (string)
Model of element rectangle (top, left, width, height, transform). Core directive.
Use with dnd-draggable, dnd-resizable, dnd-rotatable, dnd-fittext, dnd-sortable, and also dnd-selectable(optional) work with dnd-rect.





### dnd-containment(string, selector)
Containment work area of draggable/resizable/rotatable elements. By default containment is body.





### dnd-fittext (mix)
Directive for text fitting under element sizes.

#### dnd-fittext parameter:
- Value, change which triggers resizing text. (ex: {width: rect.width, height: rect.height, text: rect.text}. see example)

- dnd-fittext-min - min font size in px
- dnd-fittext-max - max font size in px






Services:
---------

### DndLasso
Service-Class to provide directives interface of the rectangular lasso tool





### dndKey
Service for control key pressing

#### Methods
 - get(): get array of pressed keys
 - isset(code): check key state by key code





Examples
---------

- All examples inside demo folder
- Also available [link](http://tuch.github.io/angular-dnd/demo)





Plunkers
---------
- [many drop zones](http://embed.plnkr.co/tdBHyg032OEK3Kn8ZQZw/preview)
- [custom sortables](http://embed.plnkr.co/ElwZjFIQh3N2HHe18Gse/preview)
- [useAsPointExample](http://plnkr.co/edit/sQqhYVlZwd2VxGTGoEA8?p=preview)


TODO:
---------

- **more options**
	- ensure rapid expandability options
- **supporting touch specific events (rotate, resize)**
- **supporting dynamic options**
- **supporting ng-animate**
- **supporting HTML5 dnd events**


PS:
--------
Sorry for bad translation.
Waiting for your pull requests.

[![Join the chat at https://gitter.im/Tuch/angular-dnd](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Tuch/angular-dnd?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
