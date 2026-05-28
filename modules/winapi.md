# WinAPI Module

The `WinAPI` module in FiveWin provides a set of low-level wrappers around the Windows API. These wrappers allow developers to access the full power of the Windows operating system directly from their Harbour applications.

## Overview

The `WinAPI` module is designed for advanced scenarios where the high-level abstractions provided by the `Classes` and `Functions` modules are not sufficient. It provides a one-to-one mapping to many of the functions in the Windows API, allowing for fine-grained control over the application's behavior.

The functions in this module are typically used to:

*   Perform advanced window manipulation.
*   Interact with the system registry.
*   Work with low-level graphics and drawing functions.
*   Access other system services that are not exposed through the high-level FiveWin API.

## Main Function Categories

The `WinAPI` module is organized into several files, each corresponding to a different area of the Windows API. Some of the main categories include:

*   **`accelera.c`:** Accelerator functions.
*   **`animate.c`:** Animation control functions.
*   **`color.c`:** Color management functions.
*   **`cursors.c`:** Cursor functions.
*   **`dc.c`:** Device context functions.
*   **`fonts.c`:** Font functions.
*   **`gdiplus.cpp`:** GDI+ functions.
*   **`shellapi.c`:** Shell API functions.

For a complete list of all the wrapped functions, please refer to the `source/winapi` directory.

## Example

Here is an example of how to use the `GetSysColor()` function from the `WinAPI` module to get the system color for the window background:

```harbour
#include "FiveWin.ch"

function Main()

   local nColor

   // Get the system color for the window background
   nColor = GetSysColor( COLOR_WINDOW )

   MsgInfo( "The system window color is: " + LTrim( Str( nColor ) ) )

return nil
```

## Further Reading

*   [Windows API Reference](https://docs.microsoft.com/en-us/windows/win32/api/)
*   [FiveWin Source Code (`source/winapi`)](source/winapi/)
