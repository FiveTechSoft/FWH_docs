# Getting Started with FiveWin

This tutorial will guide you through creating your first FiveWin application - a simple "Hello World" program.

## Prerequisites

Before you begin, ensure you have:

1. Harbour compiler installed
2. FiveWin framework installed
3. A text editor or IDE for writing Harbour code

## Creating Your First Application

Let's create a simple application that displays a window with a button. When the button is clicked, it will show a message.

### Step 1: Create the Main File

Create a new file called `hello.prg` with the following content:

```harbour
#include "FiveWin.ch"

function Main()
   local oWnd

   // Create a new window
   DEFINE WINDOW oWnd TITLE "My First FiveWin App" ;
      FROM 0, 0 TO 200, 300

   // Add a button to the window
   @ 50, 100 BUTTON "Click Me!" OF oWnd ;
      ACTION MsgInfo( "Hello, FiveWin World!" )

   // Activate the window
   ACTIVATE WINDOW oWnd

return nil
```

### Step 2: Compile the Application

To compile your application, use the Harbour compiler with the FiveWin library:

```bash
harbour hello.prg
fcc hello.c
```

Or if you're using the FiveWin build system:

```bash
fbc hello.prg
```

### Step 3: Run the Application

After compiling, you can run the executable:

```bash
hello.exe
```

You should see a window with a button. Clicking the button will display a message box.

## Understanding the Code

Let's break down what each part of the code does:

1. `#include "FiveWin.ch"` - This includes the FiveWin header file, which provides access to all FiveWin classes and functions.

2. `DEFINE WINDOW` - This creates a new window object with the specified title and dimensions.

3. `@ 50, 100 BUTTON` - This creates a button at position (50, 100) within the window.

4. `ACTION` - This specifies what should happen when the button is clicked.

5. `ACTIVATE WINDOW` - This displays the window and starts the message loop.

## Next Steps

Now that you've created your first FiveWin application, try these exercises:

1. Change the window title and size
2. Add more buttons with different messages
3. Add a text label using the `SAY` command
4. Create a dialog instead of a window using `DEFINE DIALOG`

## Further Reading

* [FiveWin Architecture](../architecture.md)
* [TWindow Class](../classes/TWindow.md)
* [TButton Class](../classes/TButton.md)