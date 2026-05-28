# BWCC 64-bit Port — Design

Date: 2026-05-21
Status: Approved

## Goal

Rebuild `dll/bwcc64.dll` from real C source so it exports all 45 functions of
`dll/bwcc32.dll` and is behaviorally equivalent. The current `bwcc64.dll`
(commit 215db39bf) is a resource-only container exporting 0 functions; this
project adds a faithful 64-bit reimplementation of the BWCC runtime.

A 64-bit process cannot load the 32-bit `bwcc32.dll`, so 64-bit apps that use
Borland Windows Custom Controls (BWCC) currently have no working DLL. This port
provides one.

## Constraints

- No Borland source exists. This is a clean-room reimplementation (Approach B):
  rebuild each function from documented BWCC behavior plus the resources already
  embedded in the DLL. No disassembled Borland code is copied.
- True 64-bit PE (machine 0x8664, PE32+). Built with MSVC amd64, the same
  toolchain `dll/rc2dll64.bat` already uses.
- The 141 resources stay byte-identical to bwcc32.dll (108 bitmaps, 11 dialog
  templates, 8 cursors, 8 group cursors, 5 string tables, 1 version).
- Export names must match bwcc32.dll exactly: undecorated, no `@N` suffix; the
  7 names that genuinely begin with `_` are kept verbatim. All `WINAPI`.

## The 45 exported functions

Runtime controls and registration:
`BWCCRegister`, `BWCCGetVersion`, `BWCCGetPattern`, `BWCCIntlInit`,
`BWCCIntlTerm`, `_BWCCButtonWndProc`, `_BWCCCheckWndProc`, `_BWCCRadioWndProc`,
`_BWCCStaticWndProc`, `_BWCCPanelWndProc`.

Dialog subsystem:
`BWCCDefDlgProc`, `BWCCDefWindowProc`, `BWCCDefMDIChildProc`,
`BWCCDefGrayDlgProc`, `_BWCCSpecialDialogProc`, `_BWCCASpecialDialogProc`,
`CreateDialogParamA`, `DialogBoxParamA`, `MangleDialog`, `SpecialLoadDialog`.

Message box: `BWCCMessageBox`, `_BWCCMsgBoxProc`.

Editor helpers (Resource Workshop integration):
`ButtonsFlags`, `ButtonsInfo`, `ButtonsStyle`, `ButtonsStyleDlg`,
`ChecksFlags`, `ChecksInfo`, `ChecksStyle`, `ChecksStyleDlg`,
`RadiosFlags`, `RadiosInfo`, `RadiosStyle`, `RadiosStyleDlg`,
`ShadesFlags`, `ShadesInfo`, `ShadesStyle`, `ShadesStyleDlg`,
`StaticsFlags`, `StaticsInfo`, `StaticsStyle`, `StaticsStyleDlg`.

Misc: `EnumTaskWnd`, `ListClasses`, `Dummy`.

## Source layout — new folder `dll/bwcc64/`

| File | Contents |
|------|----------|
| `bwcc.h` | internal header: class names, bitmap-ID macros, control structs |
| `bwccreg.c` | `DllMain`, `BWCCRegister`, `BWCCGetVersion`, `BWCCGetPattern`, `BWCCIntlInit`, `BWCCIntlTerm` |
| `borbtn.c` | `_BWCCButtonWndProc` (BorBtn class) |
| `borcheck.c` | `_BWCCCheckWndProc`, `_BWCCRadioWndProc` |
| `borshade.c` | `_BWCCPanelWndProc` (BorShade class) |
| `borstatic.c` | `_BWCCStaticWndProc` |
| `bwccdlg.c` | `BWCCDefDlgProc`, `BWCCDefWindowProc`, `BWCCDefMDIChildProc`, `BWCCDefGrayDlgProc`, `_BWCCSpecialDialogProc`, `_BWCCASpecialDialogProc`, `CreateDialogParamA`, `DialogBoxParamA`, `MangleDialog`, `SpecialLoadDialog` |
| `bwccmsg.c` | `BWCCMessageBox`, `_BWCCMsgBoxProc` |
| `bwccedit.c` | the 20 editor helpers |
| `bwccutil.c` | `EnumTaskWnd`, `ListClasses`, `Dummy` |
| `bwcc64.def` | 45 exact export names |
| `bwcc.res` | 141 resources extracted verbatim from bwcc32.dll |
| `build_bwcc64.bat` | MSVC amd64 build script |

This is an internal build folder; per CLAUDE.md, build scripts and generated
artifacts are not distributed — only `dll/bwcc64.dll` ships.

## Custom control subsystem

`BWCCRegister(HINSTANCE)` registers the BWCC window classes: **BorBtn**,
**BorCheck**, **BorRadio**, **BorShade**, **BorStatic**, and the **BorDlg**
dialog class. Each WndProc owner-draws using the embedded bitmaps.

- **BorBtn** (`_BWCCButtonWndProc`) — chiseled 3D button. Predefined glyph
  buttons (OK/Cancel/Yes/No/Help/Abort/Retry/Ignore) blit the bitmap from the
  `#x001-#x009` groups matching button id and state (up/down/focus/disabled).
  Generic text buttons draw the chisel frame from `#110-#143` plus caption.
  Handles default-button border, focus rect, mouse capture, `BM_*` messages,
  `WM_ENABLE`.
- **BorCheck** (`_BWCCCheckWndProc`) / **BorRadio** (`_BWCCRadioWndProc`) — BWCC
  check and radio glyphs from `#201-#208`, with focus and 3-state handling.
- **BorShade** (`_BWCCPanelWndProc`) — group, frame, box, and line styles.
- **BorStatic** (`_BWCCStaticWndProc`) — static text in BWCC font and colors.

## Dialog subsystem

- `BWCCDefDlgProc`, `BWCCDefWindowProc`, `BWCCDefMDIChildProc`,
  `BWCCDefGrayDlgProc` — drop-in replacements for the Win32 `DefDlgProc` /
  `DefWindowProc` family. They add the BWCC dithered-gray background (handle
  `WM_CTLCOLOR*` / `WM_ERASEBKGND` with the `BWCCGetPattern` brush) then chain
  to the real Win32 default proc. `BWCCDefGrayDlgProc` always paints gray;
  `BWCCDefDlgProc` paints gray for BorDlg dialogs.
- `MangleDialog` — rewrites a dialog template in memory, swapping standard
  control classes (`BUTTON`→`BorBtn`, `STATIC`→`BorStatic`, etc.) so a plain
  dialog acquires the BWCC look.
- `CreateDialogParamA`, `DialogBoxParamA`, `SpecialLoadDialog` — wrap the Win32
  calls, routing the template through `MangleDialog` first.
- `_BWCCSpecialDialogProc`, `_BWCCASpecialDialogProc` — internal dialog procs
  used by the wrappers.

## Message box

`BWCCMessageBox(hwndParent, lpText, lpCaption, uType)` — Borland-styled message
box with the same signature and `IDOK`/`IDCANCEL`/`IDYES`/`IDNO`/... return
values as the Win32 `MessageBox`. Built from a BWCC dialog template plus BorBtn
buttons and an icon bitmap. `_BWCCMsgBoxProc` is its dialog procedure.

## Editor helpers

`bwccedit.c` reimplements 4 functions for each of the 5 control families
(Buttons, Checks, Radios, Shades, Statics):

- `XxxStyle` — return the control's default/style bits.
- `XxxStyleDlg` — show a modal style-editor dialog driven by the embedded
  dialog templates `#3-#15`; user toggles style bits; returns the updated value.
- `XxxInfo` — fill a Resource Workshop `CONTROLINFO`-style struct (class name,
  default size, flags).
- `XxxFlags` — return the textual style-flag table for the property editor.

These are reachable only from a host resource editor. Faithful here means the
style dialogs render from the embedded templates and toggle the documented BWCC
style bits.

## Misc functions

- `EnumTaskWnd` — enumerate the top-level windows of a task; thin wrapper over
  `EnumThreadWindows`.
- `ListClasses` — diagnostic listing of the registered BWCC classes.
- `Dummy` — exported no-op placeholder, kept for export-table parity.

## Support functions

- `BWCCGetVersion` — returns the BWCC version word; value taken from the
  embedded version resource so it matches bwcc32.dll.
- `BWCCGetPattern` — returns the `HBRUSH` for the gray dithered dialog
  background.
- `BWCCIntlInit` / `BWCCIntlTerm` — load and free the localized string tables
  (the 5 embedded string tables) used for predefined button captions.

## Build

`build_bwcc64.bat`:

1. `call vcvarsall.bat amd64` (MSVC, path per CLAUDE.md).
2. `cl -c` the C source set.
3. `rc` / link the extracted `bwcc.res`.
4. `link /DLL /SUBSYSTEM:WINDOWS /DEF:bwcc64.def` the objects + resources,
   output `dll/bwcc64.dll`.

Resources are sourced as a `.res` extracted from bwcc32.dll so the 141 stay
byte-identical.

## Testing — three gates

1. **Export parity** — PE export-table check: bwcc64.dll exports exactly the
   same 45 names as bwcc32.dll (re-run the PowerShell export dump used during
   verification).
2. **Visual parity** — a small FiveWin sample built `xm64`/`hm64` with
   `build_new.bat` that `LoadLibrary`s bwcc64.dll, calls `BWCCRegister`, opens a
   BorDlg dialog with BorBtn/BorCheck/BorRadio/BorShade controls, and shows a
   `BWCCMessageBox`. Screenshot side-by-side against the same app built 32-bit
   on bwcc32.dll.
3. **Behavior** — buttons click/focus/default correctly, checks and radios
   toggle, the gray background paints, `BWCCMessageBox` returns the correct
   button id.

## Out of scope (YAGNI)

- 16-bit `bwcc.dll` / `bwccesn.dll` compatibility.
- Unicode (`W`) entry points beyond what bwcc32.dll exports (it exports only
  the `A` variants).
- Resource Workshop process integration — only the style dialogs themselves are
  reproduced, not the editor host protocol.
