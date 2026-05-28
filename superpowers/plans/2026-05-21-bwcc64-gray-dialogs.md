# BWCC 64-bit Gray Dialog Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `bwcc64.dll` the BWCC dithered-gray dialog look — a real `BWCCGetPattern` brush, the four `BWCCDef*Proc` default-procedure replacements, and a registered `BorDlg` dialog class.

**Architecture:** `BWCCGetPattern` builds a pattern brush from the embedded 8x8 `#998` bitmap. A shared `GrayMsg` helper handles the gray-paint messages (`WM_ERASEBKGND`, `WM_CTLCOLOR*`); the four `BWCCDef*Proc` functions call it then chain to the matching Win32 default proc. `BWCCRegister` additionally registers the `BorDlg` dialog class, whose window procedure routes through `BWCCDefDlgProc`.

**Tech Stack:** C (MSVC amd64), Win32 GDI, the `#998` pattern bitmap embedded in `bwcc64.dll`.

**Spec:** `docs/superpowers/specs/2026-05-21-bwcc64-port-design.md` — "Dialog subsystem".
**Prior plans:** foundation (Plan 1), custom controls (Plan 2) — both complete.

**Roadmap position:** dialog subsystem, part 1 of 2. Part 2 (`MangleDialog`,
`CreateDialogParamA`, `DialogBoxParamA`, `SpecialLoadDialog`, `BWCCMessageBox`,
`_BWCCMsgBoxProc`) is the next plan. Editor helpers and misc follow.

This plan touches only `BWCCGetPattern` and the four `BWCCDef*Proc` exports;
`MangleDialog`, `SpecialLoadDialog`, `bwccCreateDialogParamA`,
`bwccDialogBoxParamA`, `_BWCCSpecialDialogProc`, `_BWCCASpecialDialogProc`,
`BWCCMessageBox`, `_BWCCMsgBoxProc` stay as their Plan-1 stubs and are
implemented in the next plan.

---

## Background — established by investigation

- `#998` is an 8x8 4bpp bitmap: a dithered gray/white checker. It is BWCC's
  dialog-background pattern. `CreatePatternBrush(#998)` yields the gray brush.
- `#999` is 8x8 solid white — not used here.
- BWCC dialogs carry the class name `"BorDlg"`; the dialog manager routes the
  app's `DLGPROC` then the class window procedure (the "DefDlgProc").

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `dll/bwcc64/bwccdlg.h` | Create | declares `BorDlgProc` (shared by `bwccreg.c`) |
| `dll/bwcc64/bwccreg.c` | Modify | real `BWCCGetPattern`; register the `BorDlg` class |
| `dll/bwcc64/bwccdlg.c` | Rewrite | gray helper + four `BWCCDef*Proc` + `BorDlgProc`; the other 6 functions stay stubbed |
| `dll/bwcc64/test/bwcctest.c` | Modify | window uses `BWCCDefWindowProc` so the capture shows the gray pattern |

---

## Task 1: Pattern brush and dialog header

**Files:**
- Create: `dll/bwcc64/bwccdlg.h`
- Modify: `dll/bwcc64/bwccreg.c`

- [ ] **Step 1: Create `bwccdlg.h`**

```c
#ifndef BWCCDLG_H
#define BWCCDLG_H

#include "bwcc.h"

/* Window procedure for the registered BorDlg dialog class. Defined in
   bwccdlg.c, referenced by BWCCRegister in bwccreg.c. */
LRESULT CALLBACK BorDlgProc(HWND, UINT, WPARAM, LPARAM);

#endif /* BWCCDLG_H */
```

- [ ] **Step 2: Rewrite `BWCCGetPattern` in `bwccreg.c`**

`bwccreg.c` currently has `BWCCGetPattern` returning `GetSysColorBrush(COLOR_BTNFACE)`. Two edits:

(a) Add the paint-module include. The file starts `#include "bwcc.h"`. Change that line to:
```c
#include "bwcc.h"
#include "bwccpaint.h"
```

(b) Replace the whole `BWCCGetPattern` function. The current text is:
```c
/* Real dithered-gray pattern brush in Plan 3; system button face for now. */
HBRUSH WINAPI BWCCGetPattern(void)
{
    return GetSysColorBrush(COLOR_BTNFACE);
}
```
Replace it with:
```c
/* Returns the BWCC dithered-gray dialog-background brush, built once from the
   embedded 8x8 #998 pattern bitmap. Falls back to the system button-face
   colour if the bitmap is unavailable. */
HBRUSH WINAPI BWCCGetPattern(void)
{
    static HBRUSH s_brush = NULL;

    if (s_brush == NULL)
    {
        HBITMAP hbm = bwcc_LoadBmp(998);
        if (hbm != NULL)
            s_brush = CreatePatternBrush(hbm);
    }
    return (s_brush != NULL) ? s_brush : GetSysColorBrush(COLOR_BTNFACE);
}
```

- [ ] **Step 3: Build**

Run from `C:\fwteam\dll\bwcc64`:
```
cmd /c "cd /d C:\fwteam\dll\bwcc64 & C:\fwteam\dll\bwcc64\build_bwcc64.bat"
```
Expected: compile + link succeed, `copied 141 resources into bwcc64.dll`, `done!`.

- [ ] **Step 4: Commit**

Run git from `c:\fwteam`, `git -c commit.gpgsign=false commit`, end message with a blank line then `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`. Never `--no-verify`.
```
git add dll/bwcc64/bwccdlg.h dll/bwcc64/bwccreg.c
git commit -m "Build the BWCC gray dialog pattern brush from bitmap #998"
```

---

## Task 2: Gray default procedures

**Files:**
- Rewrite: `dll/bwcc64/bwccdlg.c`

The Plan-1 `bwccdlg.c` has all 10 dialog functions stubbed. This task makes the
four `BWCCDef*Proc` real and adds `BorDlgProc`; the other six functions keep
their exact Plan-1 stub bodies (the next plan implements them).

- [ ] **Step 1: Rewrite `bwccdlg.c`**

Replace the entire file with:

```c
/* bwccdlg.c - BWCC dialog subsystem.
   This plan implements the gray-background default procedures and the BorDlg
   class procedure. MangleDialog, SpecialLoadDialog, the CreateDialog/DialogBox
   wrappers and the special dialog procs remain stubbed for the next plan.
   bwccCreateDialogParamA / bwccDialogBoxParamA are exported under their public
   names via bwcc64.def aliasing, to avoid colliding with user32.lib. */
#include "bwccdlg.h"

/* Handles the BWCC gray-paint messages. Returns 1 and sets *result when msg
   was consumed; 0 to let the caller chain to the system default proc. */
static int GrayMsg(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam,
                   LRESULT *result)
{
    (void)lParam;
    switch (msg)
    {
    case WM_ERASEBKGND:
        {
            HDC    hdc = (HDC)wParam;
            HBRUSH hbr = BWCCGetPattern();
            RECT   rc;
            GetClientRect(hWnd, &rc);
            SetBrushOrgEx(hdc, 0, 0, NULL);
            FillRect(hdc, &rc, hbr);
            *result = 1;
            return 1;
        }

    case WM_CTLCOLORDLG:
    case WM_CTLCOLORSTATIC:
    case WM_CTLCOLORBTN:
        {
            HDC hdc = (HDC)wParam;
            SetBkMode(hdc, TRANSPARENT);
            *result = (LRESULT)BWCCGetPattern();
            return 1;
        }

    default:
        return 0;
    }
}

LRESULT WINAPI BWCCDefDlgProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    LRESULT res;
    if (GrayMsg(h, m, w, l, &res))
        return res;
    return DefDlgProcA(h, m, w, l);
}

LRESULT WINAPI BWCCDefGrayDlgProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    LRESULT res;
    if (GrayMsg(h, m, w, l, &res))
        return res;
    return DefDlgProcA(h, m, w, l);
}

LRESULT WINAPI BWCCDefWindowProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    LRESULT res;
    if (GrayMsg(h, m, w, l, &res))
        return res;
    return DefWindowProcA(h, m, w, l);
}

LRESULT WINAPI BWCCDefMDIChildProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    LRESULT res;
    if (GrayMsg(h, m, w, l, &res))
        return res;
    return DefMDIChildProcA(h, m, w, l);
}

/* Window procedure for the registered BorDlg dialog class: a gray dialog. */
LRESULT CALLBACK BorDlgProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    return BWCCDefDlgProc(h, m, w, l);
}

/* ---- stubbed: implemented in the dialog-mangling plan ---------------- */

INT_PTR CALLBACK _BWCCSpecialDialogProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    (void)h; (void)m; (void)w; (void)l;
    return FALSE;
}

INT_PTR CALLBACK _BWCCASpecialDialogProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    (void)h; (void)m; (void)w; (void)l;
    return FALSE;
}

LPVOID WINAPI MangleDialog(LPVOID lpTemplate, LPVOID lpReserved)
{
    (void)lpReserved;
    return lpTemplate;
}

HWND WINAPI SpecialLoadDialog(HINSTANCE hInst, LPCSTR lpName)
{
    (void)hInst; (void)lpName;
    return NULL;
}

HWND WINAPI bwccCreateDialogParamA(HINSTANCE hInst, LPCSTR lpName, HWND hParent,
                                   DLGPROC lpProc, LPARAM lParam)
{
    (void)hInst; (void)lpName; (void)hParent; (void)lpProc; (void)lParam;
    return NULL;
}

INT_PTR WINAPI bwccDialogBoxParamA(HINSTANCE hInst, LPCSTR lpName, HWND hParent,
                                   DLGPROC lpProc, LPARAM lParam)
{
    (void)hInst; (void)lpName; (void)hParent; (void)lpProc; (void)lParam;
    return -1;
}
```

- [ ] **Step 2: Build, verify exports**

`cmd /c "cd /d C:\fwteam\dll\bwcc64 & C:\fwteam\dll\bwcc64\build_bwcc64.bat"` — expect `done!`.
`powershell -ExecutionPolicy Bypass -File C:\fwteam\dll\bwcc64\verify_exports.ps1` — expect `EXPORT PARITY: MATCH`.

- [ ] **Step 3: Commit**

```
git add dll/bwcc64/bwccdlg.c
git commit -m "Implement BWCC gray-background default dialog procedures"
```

---

## Task 3: Register the BorDlg class

**Files:**
- Modify: `dll/bwcc64/bwccreg.c`

`BWCCRegister` registers the 5 control classes in a loop. `BorDlg` is a dialog
class — it needs `cbWndExtra = DLGWINDOWEXTRA` (the dialog manager's window
words) rather than the control state word, and its own window procedure
`BorDlgProc`. It is registered separately, after the loop.

- [ ] **Step 1: Edit `bwccreg.c`**

(a) Add the dialog header include. The top of the file (after Task 1) reads:
```c
#include "bwcc.h"
#include "bwccpaint.h"
```
Change it to:
```c
#include "bwcc.h"
#include "bwccpaint.h"
#include "bwccdlg.h"
```

(b) In `BWCCRegister`, the control-registration `for` loop ends with a closing
`}` and is followed by `return TRUE;`. Insert the `BorDlg` registration
between the loop's closing `}` and `return TRUE;` so that section reads:

```c
    for (i = 0; i < 5; i++)
    {
        ZeroMemory(&wc, sizeof(wc));
        /* CS_GLOBALCLASS: the classes are registered by the DLL but created
           by the host app / dialog manager under a different hInstance, so
           they must be process-global to be found by name. */
        wc.style         = CS_GLOBALCLASS | CS_HREDRAW | CS_VREDRAW | CS_DBLCLKS;
        wc.lpfnWndProc   = classes[i].proc;
        wc.hInstance     = g_hInstDll;
        wc.hCursor       = LoadCursor(NULL, IDC_ARROW);
        wc.cbWndExtra    = sizeof(LONG_PTR);
        wc.lpszClassName = classes[i].name;
        RegisterClassA(&wc);   /* ignore "already registered" failures */
    }

    /* BorDlg: the BWCC dialog class. As a dialog class it must reserve
       DLGWINDOWEXTRA window words for the dialog manager. */
    ZeroMemory(&wc, sizeof(wc));
    wc.style         = CS_GLOBALCLASS;
    wc.lpfnWndProc   = BorDlgProc;
    wc.hInstance     = g_hInstDll;
    wc.hCursor       = LoadCursor(NULL, IDC_ARROW);
    wc.cbWndExtra    = DLGWINDOWEXTRA;
    wc.lpszClassName = BWCC_DLG_CLASS;
    RegisterClassA(&wc);

    return TRUE;
```

Make only those two edits; leave the rest of `bwccreg.c` unchanged.

- [ ] **Step 2: Build, verify exports**

`cmd /c "cd /d C:\fwteam\dll\bwcc64 & C:\fwteam\dll\bwcc64\build_bwcc64.bat"` — expect `done!`.
`powershell -ExecutionPolicy Bypass -File C:\fwteam\dll\bwcc64\verify_exports.ps1` — expect `EXPORT PARITY: MATCH`.

- [ ] **Step 3: Commit**

```
git add dll/bwcc64/bwccreg.c
git commit -m "Register the BWCC BorDlg gray-dialog window class"
```

---

## Task 4: Visual smoke test for the gray background

**Files:**
- Modify: `dll/bwcc64/test/bwcctest.c`

The Plan-2 test window uses a plain `WndProc` chaining to `DefWindowProc`. Route
its default handling through `BWCCDefWindowProc` so the captured window shows
the BWCC dithered-gray pattern behind the controls.

- [ ] **Step 1: Edit `bwcctest.c`**

(a) Add a typedef and a global for the resolved `BWCCDefWindowProc`. After the
existing line `typedef BOOL (WINAPI *BWCCREGFN)(HINSTANCE);` add:
```c
typedef LRESULT (WINAPI *BWCCDEFWPFN)(HWND, UINT, WPARAM, LPARAM);

static BWCCDEFWPFN g_pDefWnd = NULL;
```

(b) In `WndProc`, change the `default` case. It currently reads:
```c
    default:
        return DefWindowProc(hWnd, msg, wParam, lParam);
    }
```
Change it to:
```c
    default:
        if (g_pDefWnd != NULL)
            return g_pDefWnd(hWnd, msg, wParam, lParam);
        return DefWindowProc(hWnd, msg, wParam, lParam);
    }
```

(c) In `WinMain`, immediately after the existing `pRegister(hLib);` line, add:
```c
    g_pDefWnd = (BWCCDEFWPFN)GetProcAddress(hLib, "BWCCDefWindowProc");
```

(d) The window class sets `wc.hbrBackground = GetSysColorBrush(COLOR_BTNFACE);`.
Change that line to:
```c
    wc.hbrBackground = NULL;   /* BWCCDefWindowProc paints the gray pattern */
```

Make only those four edits.

- [ ] **Step 2: Build and run the test**

Run from `C:\fwteam\dll\bwcc64\test`:
```
cmd /c "cd /d C:\fwteam\dll\bwcc64\test & C:\fwteam\dll\bwcc64\test\build_test.bat"
```
Then run `bwcctest.exe` (it captures `bwcctest_shot.bmp` and exits within ~1s).
Expected: the capture shows the BWCC controls on a **dithered light-gray
background** (the `#998` pattern), not a flat system-gray fill.

- [ ] **Step 3: Commit**

```
git add dll/bwcc64/test/bwcctest.c
git commit -m "Route the BWCC test window through BWCCDefWindowProc for gray bg"
```
Do NOT commit `bwcctest.exe`, the copied `bwcc64.dll`, `bwcctest_shot.bmp`, or
any `.obj` in `dll/bwcc64/test/`.

---

## Task 5: Rebuild and commit the DLL

**Files:**
- Modify: `dll/bwcc64.dll`

- [ ] **Step 1: Rebuild and verify**

`cmd /c "cd /d C:\fwteam\dll\bwcc64 & C:\fwteam\dll\bwcc64\build_bwcc64.bat"` — expect `done!`.
`powershell -ExecutionPolicy Bypass -File C:\fwteam\dll\bwcc64\verify_exports.ps1` — expect `EXPORT PARITY: MATCH`.
Confirm the PE is still 64-bit:
```powershell
$b=[IO.File]::ReadAllBytes('C:\fwteam\dll\bwcc64.dll'); $pe=[BitConverter]::ToInt32($b,0x3C)
'machine=0x{0:X4} magic=0x{1:X4}' -f [BitConverter]::ToUInt16($b,$pe+4),[BitConverter]::ToUInt16($b,$pe+24)
```
Expected: `machine=0x8664 magic=0x020B`.

- [ ] **Step 2: Commit the rebuilt binary**

```
git add dll/bwcc64.dll
git commit -m "Rebuild bwcc64.dll with gray dialog rendering"
```
Stage only `dll/bwcc64.dll`. Do not commit build intermediates.

---

## Self-Review

- **Spec coverage:** the spec's "Dialog subsystem" lists `BWCCDefDlgProc`,
  `BWCCDefWindowProc`, `BWCCDefMDIChildProc`, `BWCCDefGrayDlgProc` (gray
  background via `WM_CTLCOLOR*` / `WM_ERASEBKGND` then chain to the Win32
  default proc) — Task 2 implements all four. `BWCCGetPattern` — Task 1. The
  `BorDlg` class — Task 3. `MangleDialog`, the dialog-creation wrappers and
  `BWCCMessageBox` are explicitly the next plan's scope, kept stubbed here.
- **Placeholder scan:** none — every file shown complete or with exact edits.
- **Type consistency:** `BorDlgProc` is declared in `bwccdlg.h` (Task 1) and
  defined in `bwccdlg.c` (Task 2); `bwccreg.c` includes `bwccdlg.h` to reference
  it (Task 3). `bwcc_LoadBmp` comes from `bwccpaint.h` (Plan 2). `BWCC_DLG_CLASS`
  is the `"BorDlg"` macro from `bwcc.h` (Plan 1).
- **Window-word check (Plan 2 carry-forward):** `BorDlg` reserves
  `cbWndExtra = DLGWINDOWEXTRA` for the dialog manager — a separate class from
  the 5 control classes, which keep `cbWndExtra = sizeof(LONG_PTR)` for their
  state word. No contention: the control state word and the dialog words belong
  to different window classes.
- **Known approximation:** the pattern-brush origin is set to `(0,0)` per DC;
  the dither may not be perfectly phase-aligned between the dialog and child
  areas. This matches BWCC's own behaviour closely enough; the Task 4 capture
  is the visual check.
