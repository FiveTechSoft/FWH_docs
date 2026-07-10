# BWCC 64-bit Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `dll/bwcc64.dll` from real C source so it exports all 45 bwcc32.dll functions as working stubs, as a true 64-bit PE, with the 141 resources retained byte-identical.

**Architecture:** A `dll/bwcc64/` source folder holds one C file per subsystem plus a `.def` file that pins the 45 export names to match bwcc32.dll exactly. MSVC amd64 links a code-only DLL; a post-build PowerShell step copies all resources verbatim from bwcc32.dll into it via the `UpdateResource` API. Stub bodies are minimal but valid (control procs chain to `DefWindowProc`, `BWCCMessageBox` forwards to `MessageBoxA`, etc.) so the DLL loads and behaves sanely. Plans 2-5 replace stubs with faithful behavior.

**Tech Stack:** C (MSVC amd64), Win32 API, module-definition (`.def`) file, PowerShell for build orchestration and verification.

**Spec:** `docs/superpowers/specs/2026-05-21-bwcc64-port-design.md`

**Roadmap (this is Plan 1 of 5):**
1. Foundation — this plan (skeleton, exports, resources, build, export-parity gate)
2. Custom controls — BorBtn/BorCheck/BorRadio/BorShade/BorStatic painting
3. Dialog subsystem + message box — gray dialogs, MangleDialog, BWCCMessageBox
4. Editor helpers — 20 Resource Workshop functions
5. Misc + support — EnumTaskWnd, ListClasses, BWCCGetVersion/Pattern/Intl polish

---

## File Structure

All new files under `dll/bwcc64/`:

| File | Responsibility |
|------|----------------|
| `bwcc.h` | internal header: DLL instance handle, class-name macros, control-proc prototypes |
| `bwcc64.def` | 45 export names, two aliased to avoid the user32 name clash |
| `bwccreg.c` | `DllMain`, `BWCCRegister`, `BWCCGetVersion`, `BWCCGetPattern`, `BWCCIntlInit`, `BWCCIntlTerm` |
| `borbtn.c` | `_BWCCButtonWndProc` |
| `borcheck.c` | `_BWCCCheckWndProc`, `_BWCCRadioWndProc` |
| `borshade.c` | `_BWCCPanelWndProc` |
| `borstatic.c` | `_BWCCStaticWndProc` |
| `bwccdlg.c` | `BWCCDefDlgProc`, `BWCCDefWindowProc`, `BWCCDefMDIChildProc`, `BWCCDefGrayDlgProc`, `_BWCCSpecialDialogProc`, `_BWCCASpecialDialogProc`, `bwccCreateDialogParamA`, `bwccDialogBoxParamA`, `MangleDialog`, `SpecialLoadDialog` |
| `bwccmsg.c` | `BWCCMessageBox`, `_BWCCMsgBoxProc` |
| `bwccedit.c` | 20 editor-helper stubs |
| `bwccutil.c` | `EnumTaskWnd`, `ListClasses`, `Dummy` |
| `build_bwcc64.bat` | MSVC amd64 compile + link + resource-copy |
| `copyres.ps1` | copies all resources bwcc32.dll → bwcc64.dll |
| `verify_exports.ps1` | export-parity check (the test gate) |

Output `dll/bwcc64.dll` is the only file that ships; per CLAUDE.md the `dll/bwcc64/` build folder is internal and not distributed.

> Note on the name clash: `CreateDialogParamA` and `DialogBoxParamA` are also names in `user32.lib`. Defining our own functions with those exact names alongside `user32.lib` triggers `LNK2005`. The plan defines them as `bwccCreateDialogParamA` / `bwccDialogBoxParamA` and exports them under the correct public names via `.def` aliasing (`exportname = internalname`).

---

## Task 1: Export-parity verification script

**Files:**
- Create: `dll/bwcc64/verify_exports.ps1`

- [ ] **Step 1: Write the verification script**

```powershell
# verify_exports.ps1 - asserts bwcc64.dll exports the same 45 names as bwcc32.dll
$src = @'
using System;
using System.Collections.Generic;
using System.IO;
public class Exp {
  static uint RVA2Off(byte[] b,uint pe,uint rva){
    ushort nsec=BitConverter.ToUInt16(b,(int)pe+6);
    ushort optsz=BitConverter.ToUInt16(b,(int)pe+20);
    uint sect=pe+24+optsz;
    for(int i=0;i<nsec;i++){
      uint o=sect+(uint)i*40;
      uint va=BitConverter.ToUInt32(b,(int)o+12);
      uint vsz=BitConverter.ToUInt32(b,(int)o+8);
      uint raw=BitConverter.ToUInt32(b,(int)o+20);
      if(rva>=va && rva<va+vsz) return rva-va+raw;
    }
    return 0;
  }
  public static List<string> Names(string path){
    var r=new List<string>();
    byte[] b=File.ReadAllBytes(path);
    uint pe=BitConverter.ToUInt32(b,0x3C);
    ushort magic=BitConverter.ToUInt16(b,(int)pe+24);
    uint ddir = magic==0x20B ? pe+24+112 : pe+24+96;
    uint expRva=BitConverter.ToUInt32(b,(int)ddir);
    if(expRva==0) return r;
    uint eo=RVA2Off(b,pe,expRva);
    uint nNames=BitConverter.ToUInt32(b,(int)eo+24);
    uint namesRva=BitConverter.ToUInt32(b,(int)eo+32);
    uint no=RVA2Off(b,pe,namesRva);
    for(uint i=0;i<nNames;i++){
      uint nameRva=BitConverter.ToUInt32(b,(int)no+(int)i*4);
      uint nofs=RVA2Off(b,pe,nameRva);
      int e=(int)nofs; while(b[e]!=0)e++;
      r.Add(System.Text.Encoding.ASCII.GetString(b,(int)nofs,e-(int)nofs));
    }
    return r;
  }
}
'@
Add-Type -TypeDefinition $src -Language CSharp

$dir = $PSScriptRoot
$e32 = [Exp]::Names((Join-Path $dir '..\bwcc32.dll')) | Sort-Object
$e64 = [Exp]::Names((Join-Path $dir '..\bwcc64.dll')) | Sort-Object

$missing = $e32 | Where-Object { $e64 -notcontains $_ }
$extra   = $e64 | Where-Object { $e32 -notcontains $_ }

Write-Host ("bwcc32 exports: {0}" -f $e32.Count)
Write-Host ("bwcc64 exports: {0}" -f $e64.Count)
if ($missing) { Write-Host ("MISSING in bwcc64: {0}" -f ($missing -join ', ')) }
if ($extra)   { Write-Host ("EXTRA in bwcc64: {0}"   -f ($extra   -join ', ')) }

if (-not $missing -and -not $extra -and $e64.Count -eq 45) {
  Write-Host 'EXPORT PARITY: MATCH'
  exit 0
} else {
  Write-Host 'EXPORT PARITY: MISMATCH'
  exit 1
}
```

- [ ] **Step 2: Run it to verify it fails against the current resource-only DLL**

Run: `powershell -ExecutionPolicy Bypass -File C:\fwteam\dll\bwcc64\verify_exports.ps1`
Expected: FAIL — prints `bwcc64 exports: 0`, `EXPORT PARITY: MISMATCH`, exit code 1. (The current `bwcc64.dll` is resource-only.)

- [ ] **Step 3: Commit**

```bash
git add dll/bwcc64/verify_exports.ps1
git commit -m "Add BWCC export-parity verification script"
```

---

## Task 2: Internal header and module-definition file

**Files:**
- Create: `dll/bwcc64/bwcc.h`
- Create: `dll/bwcc64/bwcc64.def`

- [ ] **Step 1: Write `bwcc.h`**

```c
#ifndef BWCC_H
#define BWCC_H

#define WIN32_LEAN_AND_MEAN
#include <windows.h>

/* Window class names registered by BWCCRegister */
#define BWCC_BUTTON_CLASS  "BorBtn"
#define BWCC_CHECK_CLASS   "BorCheck"
#define BWCC_RADIO_CLASS   "BorRadio"
#define BWCC_SHADE_CLASS   "BorShade"
#define BWCC_STATIC_CLASS  "BorStatic"
#define BWCC_DLG_CLASS     "BorDlg"

/* DLL instance handle, set in DllMain, used by later plans for LoadResource */
extern HINSTANCE g_hInstDll;

/* Exported control window procedures */
LRESULT CALLBACK _BWCCButtonWndProc(HWND, UINT, WPARAM, LPARAM);
LRESULT CALLBACK _BWCCCheckWndProc(HWND, UINT, WPARAM, LPARAM);
LRESULT CALLBACK _BWCCRadioWndProc(HWND, UINT, WPARAM, LPARAM);
LRESULT CALLBACK _BWCCStaticWndProc(HWND, UINT, WPARAM, LPARAM);
LRESULT CALLBACK _BWCCPanelWndProc(HWND, UINT, WPARAM, LPARAM);

#endif /* BWCC_H */
```

- [ ] **Step 2: Write `bwcc64.def` with all 45 exports**

```
LIBRARY bwcc64
EXPORTS
    BWCCDefDlgProc
    BWCCDefGrayDlgProc
    BWCCDefMDIChildProc
    BWCCDefWindowProc
    BWCCGetPattern
    BWCCGetVersion
    BWCCIntlInit
    BWCCIntlTerm
    BWCCMessageBox
    BWCCRegister
    ButtonsFlags
    ButtonsInfo
    ButtonsStyle
    ButtonsStyleDlg
    ChecksFlags
    ChecksInfo
    ChecksStyle
    ChecksStyleDlg
    CreateDialogParamA = bwccCreateDialogParamA
    DialogBoxParamA = bwccDialogBoxParamA
    Dummy
    EnumTaskWnd
    ListClasses
    MangleDialog
    RadiosFlags
    RadiosInfo
    RadiosStyle
    RadiosStyleDlg
    ShadesFlags
    ShadesInfo
    ShadesStyle
    ShadesStyleDlg
    SpecialLoadDialog
    StaticsFlags
    StaticsInfo
    StaticsStyle
    StaticsStyleDlg
    _BWCCASpecialDialogProc
    _BWCCButtonWndProc
    _BWCCCheckWndProc
    _BWCCMsgBoxProc
    _BWCCPanelWndProc
    _BWCCRadioWndProc
    _BWCCSpecialDialogProc
    _BWCCStaticWndProc
```

- [ ] **Step 3: Commit**

```bash
git add dll/bwcc64/bwcc.h dll/bwcc64/bwcc64.def
git commit -m "Add BWCC 64-bit internal header and export definition"
```

---

## Task 3: Registration and support stubs (`bwccreg.c`)

**Files:**
- Create: `dll/bwcc64/bwccreg.c`

- [ ] **Step 1: Write `bwccreg.c`**

```c
/* bwccreg.c - DllMain, class registration, version/pattern/intl support.
   Stub bodies; faithful behavior arrives in Plans 2 and 5. */
#include "bwcc.h"

HINSTANCE g_hInstDll = NULL;

BOOL WINAPI DllMain(HINSTANCE hInst, DWORD reason, LPVOID reserved)
{
    (void)reserved;
    if (reason == DLL_PROCESS_ATTACH)
    {
        g_hInstDll = hInst;
        DisableThreadLibraryCalls(hInst);
    }
    return TRUE;
}

/* Registers the BWCC control window classes so windows of those classes can
   be created. Painting is added in Plan 2. */
BOOL WINAPI BWCCRegister(HINSTANCE hInst)
{
    static const struct { const char *name; WNDPROC proc; } classes[] = {
        { BWCC_BUTTON_CLASS, _BWCCButtonWndProc },
        { BWCC_CHECK_CLASS,  _BWCCCheckWndProc  },
        { BWCC_RADIO_CLASS,  _BWCCRadioWndProc  },
        { BWCC_SHADE_CLASS,  _BWCCPanelWndProc  },
        { BWCC_STATIC_CLASS, _BWCCStaticWndProc },
    };
    WNDCLASSA wc;
    int i;

    (void)hInst;
    for (i = 0; i < 5; i++)
    {
        ZeroMemory(&wc, sizeof(wc));
        wc.lpfnWndProc   = classes[i].proc;
        wc.hInstance     = g_hInstDll;
        wc.hCursor       = LoadCursor(NULL, IDC_ARROW);
        wc.cbWndExtra    = sizeof(LONG_PTR);
        wc.lpszClassName = classes[i].name;
        RegisterClassA(&wc);   /* ignore "already registered" failures */
    }
    return TRUE;
}

/* Real value read from the version resource in Plan 5. */
WORD WINAPI BWCCGetVersion(void)
{
    return 0;
}

/* Real dithered-gray pattern brush in Plan 3; system button face for now. */
HBRUSH WINAPI BWCCGetPattern(void)
{
    return GetSysColorBrush(COLOR_BTNFACE);
}

void WINAPI BWCCIntlInit(void) { }
void WINAPI BWCCIntlTerm(void) { }
```

- [ ] **Step 2: Commit**

```bash
git add dll/bwcc64/bwccreg.c
git commit -m "Add BWCC 64-bit registration and support stubs"
```

---

## Task 4: Control window-procedure stubs

**Files:**
- Create: `dll/bwcc64/borbtn.c`
- Create: `dll/bwcc64/borcheck.c`
- Create: `dll/bwcc64/borshade.c`
- Create: `dll/bwcc64/borstatic.c`

- [ ] **Step 1: Write `borbtn.c`**

```c
/* borbtn.c - BorBtn control. Stub chains to DefWindowProc; Plan 2 adds the
   chiseled-button painting. */
#include "bwcc.h"

LRESULT CALLBACK _BWCCButtonWndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    return DefWindowProc(hWnd, msg, wParam, lParam);
}
```

- [ ] **Step 2: Write `borcheck.c`**

```c
/* borcheck.c - BorCheck and BorRadio controls. Stubs chain to DefWindowProc;
   Plan 2 adds the BWCC glyph painting. */
#include "bwcc.h"

LRESULT CALLBACK _BWCCCheckWndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    return DefWindowProc(hWnd, msg, wParam, lParam);
}

LRESULT CALLBACK _BWCCRadioWndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    return DefWindowProc(hWnd, msg, wParam, lParam);
}
```

- [ ] **Step 3: Write `borshade.c`**

```c
/* borshade.c - BorShade control. Stub chains to DefWindowProc; Plan 2 adds
   the group/frame/box/line painting. */
#include "bwcc.h"

LRESULT CALLBACK _BWCCPanelWndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    return DefWindowProc(hWnd, msg, wParam, lParam);
}
```

- [ ] **Step 4: Write `borstatic.c`**

```c
/* borstatic.c - BorStatic control. Stub chains to DefWindowProc; Plan 2 adds
   the BWCC font/color text painting. */
#include "bwcc.h"

LRESULT CALLBACK _BWCCStaticWndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    return DefWindowProc(hWnd, msg, wParam, lParam);
}
```

- [ ] **Step 5: Commit**

```bash
git add dll/bwcc64/borbtn.c dll/bwcc64/borcheck.c dll/bwcc64/borshade.c dll/bwcc64/borstatic.c
git commit -m "Add BWCC 64-bit control window-procedure stubs"
```

---

## Task 5: Dialog and message-box stubs

**Files:**
- Create: `dll/bwcc64/bwccdlg.c`
- Create: `dll/bwcc64/bwccmsg.c`

- [ ] **Step 1: Write `bwccdlg.c`**

```c
/* bwccdlg.c - dialog default procs and dialog-creation wrappers.
   Stub bodies; faithful behavior arrives in Plan 3.
   bwccCreateDialogParamA / bwccDialogBoxParamA are exported under their public
   names via bwcc64.def aliasing, to avoid colliding with user32.lib. */
#include "bwcc.h"

LRESULT WINAPI BWCCDefDlgProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    return DefDlgProcA(h, m, w, l);
}

LRESULT WINAPI BWCCDefGrayDlgProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    return DefDlgProcA(h, m, w, l);
}

LRESULT WINAPI BWCCDefWindowProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    return DefWindowProcA(h, m, w, l);
}

LRESULT WINAPI BWCCDefMDIChildProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    return DefMDIChildProcA(h, m, w, l);
}

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

/* Plan 3 rewrites the control classes in the template; stub returns it as-is. */
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

- [ ] **Step 2: Write `bwccmsg.c`**

```c
/* bwccmsg.c - BWCC message box. Stub forwards to the system MessageBox;
   Plan 3 replaces it with the Borland-styled dialog. */
#include "bwcc.h"

int WINAPI BWCCMessageBox(HWND hParent, LPCSTR lpText, LPCSTR lpCaption, UINT uType)
{
    return MessageBoxA(hParent, lpText, lpCaption, uType);
}

INT_PTR CALLBACK _BWCCMsgBoxProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    (void)h; (void)m; (void)w; (void)l;
    return FALSE;
}
```

- [ ] **Step 3: Commit**

```bash
git add dll/bwcc64/bwccdlg.c dll/bwcc64/bwccmsg.c
git commit -m "Add BWCC 64-bit dialog and message-box stubs"
```

---

## Task 6: Editor-helper and misc stubs

**Files:**
- Create: `dll/bwcc64/bwccedit.c`
- Create: `dll/bwcc64/bwccutil.c`

- [ ] **Step 1: Write `bwccedit.c`**

```c
/* bwccedit.c - Resource Workshop editor-helper functions.
   Stub bodies return 0; faithful style dialogs arrive in Plan 4. */
#include "bwcc.h"

#define BWCC_EDIT_STUB(name)  LONG WINAPI name(void) { return 0; }

BWCC_EDIT_STUB(ButtonsFlags)
BWCC_EDIT_STUB(ButtonsInfo)
BWCC_EDIT_STUB(ButtonsStyle)
BWCC_EDIT_STUB(ButtonsStyleDlg)
BWCC_EDIT_STUB(ChecksFlags)
BWCC_EDIT_STUB(ChecksInfo)
BWCC_EDIT_STUB(ChecksStyle)
BWCC_EDIT_STUB(ChecksStyleDlg)
BWCC_EDIT_STUB(RadiosFlags)
BWCC_EDIT_STUB(RadiosInfo)
BWCC_EDIT_STUB(RadiosStyle)
BWCC_EDIT_STUB(RadiosStyleDlg)
BWCC_EDIT_STUB(ShadesFlags)
BWCC_EDIT_STUB(ShadesInfo)
BWCC_EDIT_STUB(ShadesStyle)
BWCC_EDIT_STUB(ShadesStyleDlg)
BWCC_EDIT_STUB(StaticsFlags)
BWCC_EDIT_STUB(StaticsInfo)
BWCC_EDIT_STUB(StaticsStyle)
BWCC_EDIT_STUB(StaticsStyleDlg)
```

- [ ] **Step 2: Write `bwccutil.c`**

```c
/* bwccutil.c - misc utility exports. Stub bodies; Plan 5 fills in EnumTaskWnd
   and ListClasses. Dummy is a permanent no-op kept for export-table parity. */
#include "bwcc.h"

LONG WINAPI EnumTaskWnd(void) { return 0; }
LONG WINAPI ListClasses(void) { return 0; }
LONG WINAPI Dummy(void)       { return 0; }
```

- [ ] **Step 3: Commit**

```bash
git add dll/bwcc64/bwccedit.c dll/bwcc64/bwccutil.c
git commit -m "Add BWCC 64-bit editor-helper and misc stubs"
```

---

## Task 7: Build script and resource-copy script

**Files:**
- Create: `dll/bwcc64/copyres.ps1`
- Create: `dll/bwcc64/build_bwcc64.bat`

- [ ] **Step 1: Write `copyres.ps1`**

```powershell
# copyres.ps1 - copy every resource from bwcc32.dll into the freshly built
# bwcc64.dll, verbatim, so the 141 resources stay byte-identical.
$dir = $PSScriptRoot
$src = (Resolve-Path (Join-Path $dir '..\bwcc32.dll')).Path
$dst = (Resolve-Path (Join-Path $dir '..\bwcc64.dll')).Path

$code = @'
using System;
using System.Runtime.InteropServices;
public class ResCopy {
  [DllImport("kernel32",SetLastError=true,CharSet=CharSet.Unicode)] public static extern IntPtr LoadLibraryEx(string n,IntPtr h,uint f);
  [DllImport("kernel32")] public static extern bool FreeLibrary(IntPtr h);
  [DllImport("kernel32")] public static extern bool EnumResourceTypes(IntPtr h,EnumResTypeProc cb,IntPtr p);
  [DllImport("kernel32")] public static extern bool EnumResourceNames(IntPtr h,IntPtr t,EnumResNameProc cb,IntPtr p);
  [DllImport("kernel32")] public static extern bool EnumResourceLanguages(IntPtr h,IntPtr t,IntPtr n,EnumResLangProc cb,IntPtr p);
  [DllImport("kernel32")] public static extern IntPtr FindResourceEx(IntPtr h,IntPtr t,IntPtr n,ushort lang);
  [DllImport("kernel32")] public static extern IntPtr LoadResource(IntPtr h,IntPtr r);
  [DllImport("kernel32")] public static extern IntPtr LockResource(IntPtr r);
  [DllImport("kernel32")] public static extern uint SizeofResource(IntPtr h,IntPtr r);
  [DllImport("kernel32",SetLastError=true,CharSet=CharSet.Unicode)] public static extern IntPtr BeginUpdateResource(string f,bool del);
  [DllImport("kernel32",SetLastError=true)] public static extern bool UpdateResource(IntPtr u,IntPtr t,IntPtr n,ushort lang,byte[] data,uint cb);
  [DllImport("kernel32",SetLastError=true)] public static extern bool EndUpdateResource(IntPtr u,bool discard);
  public delegate bool EnumResTypeProc(IntPtr h,IntPtr t,IntPtr p);
  public delegate bool EnumResNameProc(IntPtr h,IntPtr t,IntPtr n,IntPtr p);
  public delegate bool EnumResLangProc(IntPtr h,IntPtr t,IntPtr n,ushort l,IntPtr p);
  public static int Copy(string src,string dst){
    IntPtr h=LoadLibraryEx(src,IntPtr.Zero,0x2);
    if(h==IntPtr.Zero) throw new Exception("load src failed");
    IntPtr u=BeginUpdateResource(dst,true);
    if(u==IntPtr.Zero) throw new Exception("BeginUpdateResource failed "+Marshal.GetLastWin32Error());
    int n=0;
    EnumResourceTypes(h,(hh,t,p)=>{
      EnumResourceNames(h,t,(h2,t2,nm,p2)=>{
        EnumResourceLanguages(h,t2,nm,(h3,t3,n3,lang,p3)=>{
          IntPtr fr=FindResourceEx(h,t3,n3,lang);
          uint sz=SizeofResource(h,fr);
          IntPtr res=LoadResource(h,fr);
          IntPtr ptr=LockResource(res);
          byte[] data=new byte[sz];
          Marshal.Copy(ptr,data,0,(int)sz);
          if(!UpdateResource(u,t3,n3,lang,data,sz))
            throw new Exception("UpdateResource failed "+Marshal.GetLastWin32Error());
          n++;
          return true;
        },IntPtr.Zero);
        return true;
      },IntPtr.Zero);
      return true;
    },IntPtr.Zero);
    FreeLibrary(h);
    if(!EndUpdateResource(u,false))
      throw new Exception("EndUpdateResource failed "+Marshal.GetLastWin32Error());
    return n;
  }
}
'@
Add-Type -TypeDefinition $code -Language CSharp
$count = [ResCopy]::Copy($src, $dst)
Write-Host ("copied {0} resources into bwcc64.dll" -f $count)
if ($count -ne 141) { Write-Host 'WARNING: expected 141 resources'; exit 1 }
exit 0
```

- [ ] **Step 2: Write `build_bwcc64.bat`**

```bat
@echo off
rem build_bwcc64.bat - build dll\bwcc64.dll from the bwcc64 C sources.
rem Run from C:\fwteam\dll\bwcc64
setlocal
call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvarsall.bat" amd64
if errorlevel 1 ( echo vcvarsall failed & exit /b 1 )

cl /nologo /c /W3 /O2 /D_CRT_SECURE_NO_WARNINGS ^
   bwccreg.c borbtn.c borcheck.c borshade.c borstatic.c ^
   bwccdlg.c bwccmsg.c bwccedit.c bwccutil.c
if errorlevel 1 ( echo compile failed & exit /b 1 )

link /nologo /DLL /SUBSYSTEM:WINDOWS /DEF:bwcc64.def /OUT:..\bwcc64.dll ^
   bwccreg.obj borbtn.obj borcheck.obj borshade.obj borstatic.obj ^
   bwccdlg.obj bwccmsg.obj bwccedit.obj bwccutil.obj ^
   user32.lib gdi32.lib kernel32.lib
if errorlevel 1 ( echo link failed & exit /b 1 )

del *.obj 2>nul
del ..\bwcc64.exp 2>nul
del ..\bwcc64.lib 2>nul

powershell -ExecutionPolicy Bypass -File copyres.ps1
if errorlevel 1 ( echo resource copy failed & exit /b 1 )

echo done!
endlocal
```

- [ ] **Step 3: Commit**

```bash
git add dll/bwcc64/copyres.ps1 dll/bwcc64/build_bwcc64.bat
git commit -m "Add BWCC 64-bit build and resource-copy scripts"
```

---

## Task 8: Build, verify, and commit the rebuilt DLL

**Files:**
- Modify: `dll/bwcc64.dll` (rebuilt binary)

- [ ] **Step 1: Build the DLL**

Run (PowerShell, from `C:\fwteam\dll\bwcc64`):
`cmd /c build_bwcc64.bat`
Expected: compile and link succeed, `copied 141 resources into bwcc64.dll`, `done!`. The `.obj`, `.exp`, `.lib` intermediates are deleted.

- [ ] **Step 2: Run the export-parity gate**

Run: `powershell -ExecutionPolicy Bypass -File C:\fwteam\dll\bwcc64\verify_exports.ps1`
Expected: PASS — `bwcc64 exports: 45`, `EXPORT PARITY: MATCH`, exit code 0.

- [ ] **Step 3: Verify the PE is 64-bit**

Run (PowerShell):
```powershell
$b=[IO.File]::ReadAllBytes('C:\fwteam\dll\bwcc64.dll')
$pe=[BitConverter]::ToInt32($b,0x3C)
'machine=0x{0:X4} magic=0x{1:X4}' -f [BitConverter]::ToUInt16($b,$pe+4),[BitConverter]::ToUInt16($b,$pe+24)
```
Expected: `machine=0x8664 magic=0x020B` (AMD64, PE32+).

- [ ] **Step 4: Verify the 141 resources are byte-identical to bwcc32.dll**

Run the resource-hash check (the `Res2` script used during the original verification, comparing `bwcc32.dll` and `bwcc64.dll`).
Expected: both DLLs report the same MD5 over `141 resources`.

- [ ] **Step 5: Smoke-test that the DLL loads and resolves a symbol**

Run (PowerShell):
```powershell
Add-Type @'
using System;using System.Runtime.InteropServices;
public class L{
 [DllImport("kernel32",SetLastError=true,CharSet=CharSet.Ansi)] public static extern IntPtr LoadLibrary(string n);
 [DllImport("kernel32",CharSet=CharSet.Ansi)] public static extern IntPtr GetProcAddress(IntPtr h,string n);
}
'@
$h=[L]::LoadLibrary('C:\fwteam\dll\bwcc64.dll')
"load=$h  BWCCRegister=$([L]::GetProcAddress($h,'BWCCRegister'))  _BWCCButtonWndProc=$([L]::GetProcAddress($h,'_BWCCButtonWndProc'))"
```
Expected: `load` non-zero, both `GetProcAddress` results non-zero.

- [ ] **Step 6: Commit the rebuilt DLL**

```bash
git add dll/bwcc64.dll
git commit -m "Rebuild bwcc64.dll with all 45 BWCC exports (stub foundation)"
```

---

## Self-Review

- **Spec coverage (Plan 1 portion):** Source layout — Tasks 2-7 create every file in the spec's table. Build — Task 7. Export-parity gate — Tasks 1 and 8. Resource retention — `copyres.ps1` in Task 7, verified in Task 8 Step 4. Behavioral faithfulness of controls/dialogs/msgbox/editor-helpers is explicitly deferred to Plans 2-5 per the roadmap.
- **Placeholder scan:** none — every C file, script, and `.def` is shown complete.
- **Type consistency:** control-proc prototypes in `bwcc.h` (`LRESULT CALLBACK`) match their definitions in `borbtn.c`/`borcheck.c`/`borshade.c`/`borstatic.c` and their use in `BWCCRegister`. The two aliased names (`bwccCreateDialogParamA`, `bwccDialogBoxParamA`) match between `bwccdlg.c` and `bwcc64.def`.
- **Gate ordering:** Task 1 Step 2 confirms the test fails before any implementation; Task 8 Step 2 confirms it passes after.
