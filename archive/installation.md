# Installing FiveWin

This guide will walk you through installing FiveWin and setting up your development environment.

## Prerequisites

Before installing FiveWin, you'll need:

1. Harbour compiler (version 3.2 or later recommended)
2. A C compiler compatible with Harbour (MinGW, GCC, MSVC, etc.)
3. Git (for cloning the repository)

## Installation Methods

### Method 1: Download Release (Recommended)

1. Visit the [FiveWin releases page](https://github.com/fivetechsoft/fivewin/releases)
2. Download the latest release for your platform
3. Extract the archive to a directory of your choice

### Method 2: Clone from GitHub

```bash
git clone https://github.com/fivetechsoft/fivewin.git
cd fivewin
```

## Setting Up Your Environment

### Windows

1. Add the Harbour bin directory to your PATH environment variable
2. Set the HB_PATH environment variable to point to your Harbour installation
3. Add the FiveWin directory to your PATH environment variable

### Linux/macOS

1. Add Harbour to your PATH:
   ```bash
   export PATH=$PATH:/path/to/harbour/bin
   ```
2. Set the HB_PATH environment variable:
   ```bash
   export HB_PATH=/path/to/harbour
   ```

## Verifying Your Installation

To verify that FiveWin is properly installed, create a simple test file:

```harbour
#include "FiveWin.ch"

function Main()
   MsgInfo( "FiveWin is installed correctly!" )
return nil
```

Compile and run it:

```bash
harbour test.prg
fcc test.c
./test
```

You should see a message box confirming that FiveWin is installed correctly.

## Troubleshooting

### Common Issues

1. **"FiveWin.ch not found"** - Make sure the FiveWin directory is in your Harbour include path
2. **Linker errors** - Ensure all required libraries are available and properly linked
3. **Runtime errors** - Check that all DLLs are in your PATH or in the same directory as your executable

### Getting Help

If you encounter issues during installation:

1. Check the [FiveWin GitHub issues](https://github.com/fivetechsoft/fivewin/issues)
2. Visit the [FiveWin forums](http://forums.fivetechsupport.com/)
3. Contact the FiveWin support team

## Next Steps

Once you've successfully installed FiveWin, proceed to the [Getting Started](tutorials/getting-started.md) tutorial to create your first application.