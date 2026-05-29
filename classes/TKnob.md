# TKnob Class

The `TKnob` class implements a modern rotary knob control for audio, MIDI, and synthesizer-style applications. It is derived from `TControl` and renders entirely with Harbour/FiveWin GDI drawing — no external DLLs required.

**Source File:** `source/classes/tknob.prg`
**Include File:** `include/tknob.ch` (provides the `@ ROW,COL KNOB ...` command)

## Purpose

`TKnob` provides a visually rich rotary knob that the user can rotate by dragging with the mouse (polar/angular tracking around the knob center) or by using the mouse wheel. It supports two modes of operation and multiple visual styles.

## Main Properties

| Property     | Type       | Description                                              |
|-------------|------------|----------------------------------------------------------|
| `nMin`       | `Numeric`  | Minimum value (default 0 for UNIPOLAR, -30 for BIPOLAR)  |
| `nMax`       | `Numeric`  | Maximum value (default 127 for UNIPOLAR, 30 for BIPOLAR) |
| `nValue`     | `Numeric`  | Current value                                               |
| `nDefault`   | `Numeric`  | Default value (reset on double-click)                       |
| `cIndicator` | `String`   | Indicator style: `"LED"` (dot) or `"LINE"` (line)           |
| `cMode`      | `String`   | `"UNIPOLAR"` (0..127) or `"BIPOLAR"` (-30..+30)            |
| `lTicks`     | `Logical`  | Show external tick marks around the ring                     |
| `lActive`    | `Logical`  | Active/enabled state (toggle on click, `.F.` = grayed out)   |
| `oFont`      | `TFont`    | Font for the label text below the knob                       |
| `oFontInner` | `TFont`    | Font for the value text inside the knob                       |
| `bSetGet`    | `Block`    | Get/Set codeblock for the value                                |
| `bChanged`   | `Block`    | Codeblock evaluated when the value changes                     |
| `bAction`    | `Block`    | Codeblock evaluated on toggle (click without drag)              |
| `nClrLed`    | `Numeric`  | Color of the LED indicator (default orange)                   |
| `nClrLine`   | `Numeric`  | Color of the LINE indicator (default white)                   |
| `nClrRingOn` | `Numeric`  | Color of the illuminated ring arc (default green)              |

## Main Methods

| Method        | Description                                    |
|---------------|------------------------------------------------|
| `New(...)`    | Constructor. Creates a new TKnob control.      |
| `SetValue(n)` | Sets the knob value (clamped to `[nMin,nMax]`). |
| `GetValue()`  | Returns `::nValue`.                            |
| `Toggle()`    | Toggles the active/enabled state.              |
| `SetMode(c)`  | Switches between `"UNIPOLAR"` and `"BIPOLAR"`. |
| `Paint()`     | Full custom paint: ring, arc, body, indicator. |

## Usage Patterns

### Manual Construction (TKnob():New)

```harbour
#include "FiveWin.ch"

function Main()

   local oDlg, oKnob
   local nVol := 0
   local oFont, oFontInner

   DEFINE FONT oFont      NAME "Segoe UI" SIZE 0, -11 BOLD
   DEFINE FONT oFontInner NAME "Segoe UI" SIZE 0, -24 BOLD

   DEFINE DIALOG oDlg TITLE "TKnob Test" SIZE 400, 300 PIXEL

   oKnob := TKnob():New( 35, 40, ;
      { | u | If( u == nil, nVol, nVol := u ) }, ;
      oDlg, 76, 86, "VOL", -30, 30, "LED", "BIPOLAR", .F., ;
      NIL, .F., oFont, oFontInner )

   oKnob:bChanged := { | o, n | oDlg:SetText( Str( n, 4 ) ) }

   ACTIVATE DIALOG oDlg CENTERED ;
      VALID ( oFont:End(), oFontInner:End(), .T. )

return nil
```

### Command Syntax (include/tknob.ch)

```harbour
#include "FiveWin.ch"
#include "tknob.ch"

function Main()

   local oDlg, oKnob
   local nMod := 64
   local oFont, oFontInner

   DEFINE FONT oFont      NAME "Segoe UI" SIZE 0, -11 BOLD
   DEFINE FONT oFontInner NAME "Segoe UI" SIZE 0, -14 BOLD

   DEFINE DIALOG oDlg TITLE "TKnob Command" SIZE 500, 280 PIXEL

   @ 35, 40 KNOB oKnob ;
      VAR nMod ;
      OF oDlg ;
      SIZE 76, 86 ;
      LABEL "MOD" ;
      MIN 0 MAX 127 ;
      LINE UNIPOLAR ;
      FONT oFont ;
      FONTINNER oFontInner ;
      TICKS ;
      ON CHANGE { | o, n | oDlg:SetText( Str( n, 4 ) ) }

   ACTIVATE DIALOG oDlg CENTERED ;
      VALID ( oFont:End(), oFontInner:End(), .T. )

return nil
```

### KNOB Command Parameters

| Parameter    | Values                    | Description                                   |
|-------------|---------------------------|-----------------------------------------------|
| `VAR`        | `<nVar>`                  | Numeric variable to bind                       |
| `LABEL`      | `<cLabel>`                | Label text displayed below the knob            |
| `MIN` / `MAX`| `<nMin>` / `<nMax>`       | Value range                                    |
| `LED` / `LINE` | —                       | Indicator style                                |
| `UNIPOLAR` / `BIPOLAR` | —               | Operating mode (BIPOLAR: -30..+30 default)      |
| `TICKS` / `NOTICKS` | —                   | Show/hide external tick marks                   |
| `FONT`       | `<oFont>`                 | Font for label text                             |
| `FONTINNER`  | `<oFont>`                 | Font for value text inside the knob             |
| `ON CHANGE`  | `<bBlock>`                | Codeblock evaluated on value change             |

## Interaction

| Action              | Result                           |
|---------------------|----------------------------------|
| Drag mouse          | Rotates knob (polar tracking)    |
| Mouse wheel          | Increment/decrement by 1         |
| Ctrl + mouse wheel   | Fine step (`::nCtrlStep`)         |
| Click (no drag)      | Toggle active/enabled state       |
| Double-click         | Reset to `::nDefault`            |

## Modes

**UNIPOLAR** (default): Range 0..127. Minimum at 12 o'clock, values increase clockwise through the full 360° circle.

**BIPOLAR**: Range -30..+30. Zero at 6 o'clock (bottom). Negative values on the right half of the knob, positive values on the left half. The green ring arc always takes the shortest path from zero to the indicator.

## Related Components

* [`TControl` Class](TControl.md)
* [`TDialog` Class](TDialog.md)
* [samples/knobtst1.prg](../../samples/knobtst1.prg) — direct `TKnob():New()` example
* [samples/knobtst2.prg](../../samples/knobtst2.prg) — command syntax example
