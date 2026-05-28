# TWindow Class

The `TWindow` class is the fundamental building block for all windows and dialogs in a FiveWin application. It provides the basic functionality for creating and managing a window, such as setting its title, size, and position, as well as handling events.

**Source File:** `source/classes/window.prg`

## Purpose

The `TWindow` class encapsulates a standard window in the Windows operating system. It provides a high-level, object-oriented interface to the underlying window handle (`hWnd`) and its associated properties and behaviors.

## Main Properties

Here are some of the most important properties of the `TWindow` class:

| Property      | Type      | Description                                             |
|---------------|-----------|---------------------------------------------------------|
| `hWnd`        | `Numeric` | The handle of the window.                               |
| `cTitle`      | `String`  | The title of the window.                                |
| `nTop`        | `Numeric` | The top coordinate of the window.                       |
| `nLeft`       | `Numeric` | The left coordinate of the window.                      |
| `nBottom`     | `Numeric` | The bottom coordinate of the window.                    |
| `nRight`      | `Numeric` | The right coordinate of the window.                     |
| `oBrush`      | `Object`  | A `TBrush` object that defines the background brush.    |
| `oCursor`     | `Object`  | A `TCursor` object that defines the mouse cursor.       |
| `oFont`       | `Object`  | A `TFont` object that defines the default font.         |
| `oMenu`       | `Object`  | A `TMenu` object that defines the window's menu.        |
| `aControls`   | `Array`   | An array of control objects contained in the window.    |

## Main Methods

Here are some of the most important methods of the `TWindow` class:

| Method                                | Description                                                               |
|---------------------------------------|---------------------------------------------------------------------------|
| `New(...)`                            | The class constructor. Creates a new `TWindow` object.                    |
| `Activate(...)`                       | Activates the window and makes it visible.                                |
| `Center()`                            | Centers the window on the screen.                                         |
| `Close()`                             | Closes the window.                                                        |
| `End()`                               | Destroys the window object and releases its resources.                    |
| `SetColor(nClrFore, nClrBack)`        | Sets the foreground and background colors of the window.                  |
| `SetFont(oFont)`                      | Sets the default font for the window and its controls.                    |
| `SetFocus()`                          | Sets the input focus to the window.                                       |
| `Refresh()`                           | Repaints the window.                                                      |

## Usage Patterns

The `TWindow` class is typically used as the main window of an application. It can contain other controls, such as buttons, listboxes, and edit boxes, to create a user interface.

### Creating a Simple Window

Here is an example of how to create a simple window:

```harbour
#include "FiveWin.ch"

function Main()

   local oWnd

   DEFINE WINDOW oWnd TITLE "My First Window" ;
      FROM 10, 10 TO 20, 70

   ACTIVATE WINDOW oWnd

return nil
```

### Handling Events

You can handle events in a window by assigning code blocks to the corresponding event properties. For example, to handle a left-click event, you can assign a code block to the `bLClicked` property:

```harbour
#include "FiveWin.ch"

function Main()

   local oWnd

   DEFINE WINDOW oWnd TITLE "Event Handling" ;
      FROM 10, 10 TO 20, 70

   oWnd:bLClicked = { || MsgInfo( "You clicked the window!" ) }

   ACTIVATE WINDOW oWnd

return nil
```

## Further Reading

*   [`TDialog`](TDialog.md) class
*   [`TControl`](TControl.md) class
*   [Windowing Functions in FiveWin](functions/windowing.md)
*   [Windows API Reference for Windows](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-createwindowexw)
