# Functions Module

The `Functions` module in FiveWin provides a wide range of global functions that simplify common programming tasks and provide access to various system-level features.

## Overview

These functions are designed to be used alongside the FiveWin class library. They cover a variety of areas, including:

*   **Alerts and Messages:** Functions for displaying message boxes and alerts.
*   **Database Operations:** Functions for working with databases.
*   **File System:** Functions for file and directory manipulation.
*   **String Manipulation:** Utility functions for working with strings.
*   **System Information:** Functions for retrieving information about the system.
*   **Windowing:** Functions for managing windows and dialogs.

## Main Function Categories

The functions in this module can be grouped into the following categories:

*   **[Alerts and Messages](functions/alerts.md):** Functions like `MsgInfo()`, `MsgAlert()`, and `MsgYesNo()` for displaying simple message boxes.
*   **[Database](functions/database.md):** Functions for interacting with databases, such as `DbUseArea()` and `DbGoTop()`.
*   **[File System](functions/filesystem.md):** Functions for working with files and directories, such as `File()`, `Directory()`, and `MakeDir()`.
*   **[String Manipulation](functions/string.md):** A collection of utility functions for string manipulation, such as `StrToken()` and `StrTran()`.
*   **[System Information](functions/sysinfo.md):** Functions for getting information about the system, such as `GetSysColor()` and `GetSysMetrics()`.
*   **[Windowing](functions/windowing.md):** Functions for managing windows, such as `GetWndDefault()` and `SetWndDefault()`.

For a complete list of all functions, please refer to the `source/function` directory.

## Example

Here is an example of how to use the `MsgInfo()` function to display a simple message box:

```harbour
#include "FiveWin.ch"

function Main()

   MsgInfo( "Hello, World!" )

return nil
```

## Further Reading

*   [FiveWin Function Reference](../fwfun.chm) (if available)
*   [Harbour Language Reference](https://harbour.github.io/doc/)
