# TDialog Class

The `TDialog` class is a specialized `TWindow` designed for creating dialog boxes. Dialog boxes are commonly used to interact with the user, such_ as prompting for input, displaying information, or confirming an action.

**Source File:** `source/classes/dialog.prg`

## Purpose

The `TDialog` class simplifies the creation of modal and modeless dialog boxes. It provides features like automatic control management, default button handling, and a simplified event model.

## Main Properties

The `TDialog` class inherits all the properties of the `TWindow` class and adds a few of its own:

| Property    | Type      | Description                                       |
|-------------|-----------|---------------------------------------------------|
| `lModal`    | `Logical` | If `.T.`, the dialog is modal.                    |
| `nResult`   | `Numeric` | The result code of the dialog when it is closed.  |
| `oDefault`  | `Object`  | The default button control.                       |
| `oCancel`   | `Object`  | The cancel button control.                        |

## Main Methods

The `TDialog` class inherits all the methods of the `TWindow` class and adds a few of its own:

| Method        | Description                                       |
|---------------|---------------------------------------------------|
| `New(...)`    | The class constructor. Creates a new `TDialog`.   |
| `Activate()`  | Activates the dialog.                             |
| `End()`       | Closes the dialog and returns a result code.      |

## Usage Patterns

The `TDialog` class is used to create dialog boxes that contain controls for user interaction.

### Creating a Modal Dialog

Here is an example of how to create a simple modal dialog with an "OK" button:

```harbour
#include "FiveWin.ch"

function Main()

   local oDlg, oBtn

   DEFINE DIALOG oDlg TITLE "My Dialog" FROM 10, 10 TO 15, 40

   @ 2, 5 BUTTON oBtn PROMPT "OK" OF oDlg ACTION oDlg:End()

   ACTIVATE DIALOG oDlg CENTERED

return nil
```

In this example, the `ACTIVATE DIALOG` command with the `CENTERED` option displays the dialog as a modal window. The program execution will pause until the dialog is closed.

### Getting a Result from a Dialog

You can get a result from a dialog by setting the `nResult` property before closing it.

```harbour
#include "FiveWin.ch"

function Main()

   local oDlg, nResult

   DEFINE DIALOG oDlg TITLE "Question" FROM 10, 10 TO 15, 50

   @ 2, 5 BUTTON "Yes" OF oDlg ACTION oDlg:End( ID_YES )
   @ 2, 15 BUTTON "No" OF oDlg ACTION oDlg:End( ID_NO )
   @ 2, 25 BUTTON "Cancel" OF oDlg ACTION oDlg:End( ID_CANCEL )

   ACTIVATE DIALOG oDlg CENTERED ON INIT ( nResult := 0 )

   do case
      case nResult == ID_YES
           MsgInfo( "You clicked Yes" )
      case nResult == ID_NO
           MsgInfo( "You clicked No" )
      case nResult == ID_CANCEL
           MsgInfo( "You clicked Cancel" )
   endcase

return nil
```

## Further Reading

*   [`TWindow` Class](TWindow.md)
*   [`TControl` Class](TControl.md)
*   [Dialog Boxes](https://docs.microsoft.com/en-us/windows/win32/dlgbox/dialog-boxes)
