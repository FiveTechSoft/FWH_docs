# TButton Class

The `TButton` class represents a standard push button control. Buttons are used to trigger actions when clicked by the user.

**Source File:** `source/classes/button.prg`

## Purpose

The `TButton` class provides an easy way to create and manage push buttons in a dialog or window. It encapsulates the properties and behavior of a button, such as its caption, size, and position, as well as its click event.

## Main Properties

The `TButton` class inherits from the `TControl` class and has the following main properties:

| Property    | Type      | Description                                       |
|-------------|-----------|---------------------------------------------------|
| `cCaption`  | `String`  | The text displayed on the button.                 |
| `bAction`   | `Block`   | A code block that is executed when the button is clicked. |
| `lDefault`  | `Logical` | If `.T.`, the button is the default button.       |
| `lCancel`   | `Logical` | If `.T.`, the button is the cancel button.        |

## Main Methods

The `TButton` class inherits methods from `TControl` and `TWindow`. Its primary method is its constructor.

| Method      | Description                                 |
|-------------|---------------------------------------------|
| `New(...)`  | The class constructor. Creates a new `TButton`. |

## Usage Patterns

Buttons are typically used in dialogs and windows to allow the user to perform actions.

### Creating a Simple Button

Here is an example of how to create a simple button that displays a message when clicked:

```harbour
#include "FiveWin.ch"

function Main()

   local oDlg, oBtn

   DEFINE DIALOG oDlg TITLE "Button Example"

   @ 2, 5 BUTTON oBtn PROMPT "Click Me" OF oDlg ;
      ACTION MsgInfo( "You clicked the button!" )

   ACTIVATE DIALOG oDlg CENTERED

return nil
```

### Creating Default and Cancel Buttons

You can create default and cancel buttons by setting the `lDefault` and `lCancel` properties to `.T.`.

*   The **default button** is automatically "clicked" when the user presses the `Enter` key.
*   The **cancel button** is automatically "clicked" when the user presses the `Esc` key.

```harbour
#include "FiveWin.ch"

function Main()

   local oDlg

   DEFINE DIALOG oDlg TITLE "Default and Cancel Buttons"

   @ 2, 5 BUTTON "OK" OF oDlg ACTION oDlg:End() DEFAULT
   @ 2, 15 BUTTON "Cancel" OF oDlg ACTION oDlg:End() CANCEL

   ACTIVATE DIALOG oDlg CENTERED

return nil
```

## Further Reading

*   [`TControl` Class](TControl.md)
*   [`TDialog` Class](TDialog.md)
*   [Button Control](https://docs.microsoft.com/en-us/windows/win32/controls/buttons)
