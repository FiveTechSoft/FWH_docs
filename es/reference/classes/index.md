# FiveWin Class Reference

This section provides detailed reference documentation for all FiveWin classes.

## Core Classes

* [TWindow](TWindow.md) - Base window class
* [TDialog](TDialog.md) - Dialog window class
* [TControl](TControl.md) - Base control class

## Control Classes

* [TButton](TButton.md) - Button control
* [TEdit](TEdit.md) - Edit control
* [TListBox](TListBox.md) - List box control
* [TComboBox](TComboBox.md) - Combo box control
* [TRadio](TRadio.md) - Radio button control
* [TCheckBox](TCheckBox.md) - Check box control
* [TGet](TGet.md) - Data entry control
* [TBrowse](TBrowse.md) - Data browsing control

## Specialized Classes

* [TMenu](TMenu.md) - Menu system
* [TPrinter](TPrinter.md) - Printing functionality
* [TImage](TImage.md) - Image handling
* [TRichEdit](TRichEdit.md) - Rich text editing

## Creating Custom Classes

To create a custom control class, inherit from `TControl`:

```harbour
#include "FiveWin.ch"

CLASS TMyControl FROM TControl
   DATA cCustomProperty

   METHOD New(...)
   METHOD CustomMethod()

END CLASS

METHOD New(...) CLASS TMyControl
   ::Super:New(...)
   ::cCustomProperty := ""
return Self

METHOD CustomMethod() CLASS TMyControl
   // Custom implementation
return Self
```

## Further Reading

*   [Object-Oriented Programming in Harbour](https://harbour.github.io/doc/oop.html)