# BWCC 64-bit Custom Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stub control window procedures in `bwcc64.dll` with faithful BWCC rendering — bitmap-faithful predefined buttons, procedural chiseled generic buttons, and the BWCC check/radio/static/shade controls.

**Architecture:** A shared paint module (`bwccpaint.c`) provides a cached bitmap loader, a masked transparent blit, a chiseled-frame drawer, and per-window state. Each control's WndProc (`borbtn.c`, `borcheck.c`, `borstatic.c`, `borshade.c`) is rewritten from its Plan-1 stub to paint and handle input. Predefined buttons blit BWCC's own pre-rendered bitmaps verbatim; generic buttons and the shade control are drawn procedurally with GDI.

**Tech Stack:** C (MSVC amd64), Win32 GDI, the 108 RT_BITMAP resources already embedded in `bwcc64.dll`.

**Spec:** `docs/superpowers/specs/2026-05-21-bwcc64-port-design.md` — "Custom control subsystem".
**Prior plan:** `docs/superpowers/plans/2026-05-21-bwcc64-foundation.md` (Plan 1, complete).

**Roadmap position:** This is the controls subsystem (Plan 2 of the 5-plan roadmap). Dialog subsystem, message box, editor helpers, and misc are later plans.

---

## BWCC bitmap reference (established by investigation)

The 108 RT_BITMAP resources, decoded:

**Predefined button faces** — fully pre-rendered (glyph + English caption baked in), 4bpp.
- ID = `stateBase + unit`.
- `unit`: `1`=OK, `2`=Cancel, `3`=Abort, `4`=Retry, `5`=Ignore, `6`=Yes, `7`=No, `9`=Help. (Equal to the standard control IDs `IDOK..IDNO`, `IDHELP`.)
- `stateBase`: `1000` = normal (gray dialog bg, 63x39); `3000` = focused (63x39); `5000` = pressed (63x39). The `2000/4000/6000` groups are the white-background variants (63x30); this plan uses the gray-background groups since BWCC dialogs are gray. `x998`/`x999` are alternate Help / blank faces — not used here.

**Checkbox glyphs** — 13x13 4bpp colour + 13x13 1bpp AND-mask:
- `#110`/`#116` = unchecked; `#111`/`#117` = checked; `#114`/`#120` = unchecked disabled; `#115`/`#121` = checked disabled. (`#112/#113/#118/#119` are white-bg variants, unused here.)

**Radio glyphs** — 13x13 4bpp colour + 13x13 1bpp AND-mask (diamond shape):
- `#130`/`#134` = unselected; `#131`/`#135` = selected. (`#132/#133/#136/#137` white-bg variants, unused.)

The `13x9` bitmaps (`#122-#127`, `#140-#143`) and the `24x24` set (`#201-#208`) are not used by this plan.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `dll/bwcc64/bwccpaint.h` | Create | shared types + paint-helper prototypes |
| `dll/bwcc64/bwccpaint.c` | Create | bitmap cache, masked blit, chiseled frame, per-window state |
| `dll/bwcc64/borbtn.c` | Rewrite | `_BWCCButtonWndProc` — full BorBtn |
| `dll/bwcc64/borcheck.c` | Rewrite | `_BWCCCheckWndProc`, `_BWCCRadioWndProc` |
| `dll/bwcc64/borstatic.c` | Rewrite | `_BWCCStaticWndProc` |
| `dll/bwcc64/borshade.c` | Rewrite | `_BWCCPanelWndProc` — BorShade |
| `dll/bwcc64/bwccreg.c` | Modify | give control classes `CS_*` styles + background brush |
| `dll/bwcc64/build_bwcc64.bat` | Modify | add `bwccpaint.c` to the compile/link line |

Per-window state lives in the `cbWndExtra` slot already reserved by `BWCCRegister` (`sizeof(LONG_PTR)`), accessed via `GetWindowLongPtr(hWnd, 0)`.

---

## Task 1: Shared paint module

**Files:**
- Create: `dll/bwcc64/bwccpaint.h`
- Create: `dll/bwcc64/bwccpaint.c`

- [ ] **Step 1: Write `bwccpaint.h`**

```c
#ifndef BWCCPAINT_H
#define BWCCPAINT_H

#include "bwcc.h"

/* Per-control state, heap-allocated, pointer kept in window word 0. */
typedef struct {
    int checked;   /* BorCheck/BorRadio: 0 or 1 */
    int pressed;   /* mouse/space currently pressing the control */
    int focused;   /* control has keyboard focus */
    int capture;   /* mouse is captured by the control */
} BWCCSTATE;

/* Returns the per-window state, allocating it on first use. NULL on OOM. */
BWCCSTATE *bwcc_State(HWND hWnd);
/* Frees the per-window state (call on WM_NCDESTROY). */
void       bwcc_FreeState(HWND hWnd);

/* Loads an RT_BITMAP from the DLL by integer id; results are cached for the
   process lifetime. Returns NULL if the id is absent. */
HBITMAP    bwcc_LoadBmp(int id);

/* Blits a colour bitmap through a 1bpp AND-mask so mask-white pixels are
   transparent. hbmColor and hbmMask must be the same size (w x h). */
void       bwcc_BlitMasked(HDC hdc, int x, int y, int w, int h,
                           HBITMAP hbmColor, HBITMAP hbmMask);

/* Draws the BWCC chiseled 3D frame for a generic (non-predefined) button into
   rc, filled with COLOR_BTNFACE. pressed inverts the bevel. */
void       bwcc_ChiselFrame(HDC hdc, const RECT *rc, int pressed);

/* If hWnd is a predefined BWCC button, returns its unit (1..7 or 9);
   otherwise 0. Determined from the control id (IDOK..IDNO, IDHELP). */
int        bwcc_PredefUnit(HWND hWnd);

#endif /* BWCCPAINT_H */
```

- [ ] **Step 2: Write `bwccpaint.c`**

```c
/* bwccpaint.c - shared painting helpers for the BWCC controls. */
#include "bwccpaint.h"

/* ---- per-window state ------------------------------------------------ */

BWCCSTATE *bwcc_State(HWND hWnd)
{
    BWCCSTATE *st = (BWCCSTATE *)GetWindowLongPtr(hWnd, 0);
    if (st == NULL)
    {
        st = (BWCCSTATE *)calloc(1, sizeof(BWCCSTATE));
        SetWindowLongPtr(hWnd, 0, (LONG_PTR)st);
    }
    return st;
}

void bwcc_FreeState(HWND hWnd)
{
    BWCCSTATE *st = (BWCCSTATE *)GetWindowLongPtr(hWnd, 0);
    if (st != NULL)
    {
        free(st);
        SetWindowLongPtr(hWnd, 0, 0);
    }
}

/* ---- bitmap cache ---------------------------------------------------- */

#define BWCC_CACHE_MAX 64

static struct { int id; HBITMAP hbm; } s_cache[BWCC_CACHE_MAX];
static int s_cacheCount = 0;

HBITMAP bwcc_LoadBmp(int id)
{
    int i;
    HBITMAP hbm;

    for (i = 0; i < s_cacheCount; i++)
        if (s_cache[i].id == id)
            return s_cache[i].hbm;

    hbm = (HBITMAP)LoadImage(g_hInstDll, MAKEINTRESOURCE(id), IMAGE_BITMAP,
                             0, 0, LR_CREATEDIBSECTION);
    if (hbm != NULL && s_cacheCount < BWCC_CACHE_MAX)
    {
        s_cache[s_cacheCount].id  = id;
        s_cache[s_cacheCount].hbm = hbm;
        s_cacheCount++;
    }
    return hbm;
}

/* ---- masked blit ----------------------------------------------------- */

void bwcc_BlitMasked(HDC hdc, int x, int y, int w, int h,
                     HBITMAP hbmColor, HBITMAP hbmMask)
{
    HDC hdcMem = CreateCompatibleDC(hdc);
    HBITMAP hbmOld;

    if (hbmMask != NULL)
    {
        /* AND the mask (white=1 keeps dest, black=0 clears), then OR... use
           the classic two-blt transparent draw: mask AND, colour XOR/SRCPAINT. */
        hbmOld = (HBITMAP)SelectObject(hdcMem, hbmMask);
        BitBlt(hdc, x, y, w, h, hdcMem, 0, 0, SRCAND);
        SelectObject(hdcMem, hbmColor);
        BitBlt(hdc, x, y, w, h, hdcMem, 0, 0, SRCPAINT);
        SelectObject(hdcMem, hbmOld);
    }
    else
    {
        hbmOld = (HBITMAP)SelectObject(hdcMem, hbmColor);
        BitBlt(hdc, x, y, w, h, hdcMem, 0, 0, SRCCOPY);
        SelectObject(hdcMem, hbmOld);
    }
    DeleteDC(hdcMem);
}

/* ---- chiseled frame -------------------------------------------------- */

void bwcc_ChiselFrame(HDC hdc, const RECT *rc, int pressed)
{
    RECT r = *rc;
    HBRUSH hFace = GetSysColorBrush(COLOR_BTNFACE);
    HPEN hHi  = CreatePen(PS_SOLID, 1, GetSysColor(COLOR_BTNHIGHLIGHT));
    HPEN hSh  = CreatePen(PS_SOLID, 1, GetSysColor(COLOR_BTNSHADOW));
    HPEN hFr  = CreatePen(PS_SOLID, 1, GetSysColor(COLOR_WINDOWFRAME));
    HPEN hOld;
    int  right  = r.right  - 1;
    int  bottom = r.bottom - 1;

    FillRect(hdc, &r, hFace);

    /* outer 1px window-frame border */
    hOld = (HPEN)SelectObject(hdc, hFr);
    MoveToEx(hdc, r.left, r.top, NULL);
    LineTo(hdc, right, r.top);
    LineTo(hdc, right, bottom);
    LineTo(hdc, r.left, bottom);
    LineTo(hdc, r.left, r.top);

    /* inner bevel: highlight top-left, shadow bottom-right (inverted if pressed) */
    SelectObject(hdc, pressed ? hSh : hHi);
    MoveToEx(hdc, r.left + 1, bottom - 1, NULL);
    LineTo(hdc, r.left + 1, r.top + 1);
    LineTo(hdc, right - 1, r.top + 1);

    SelectObject(hdc, pressed ? hHi : hSh);
    MoveToEx(hdc, right - 1, r.top + 1, NULL);
    LineTo(hdc, right - 1, bottom - 1);
    LineTo(hdc, r.left + 1, bottom - 1);

    SelectObject(hdc, hOld);
    DeleteObject(hHi);
    DeleteObject(hSh);
    DeleteObject(hFr);
}

/* ---- predefined-button detection ------------------------------------- */

int bwcc_PredefUnit(HWND hWnd)
{
    int id = GetDlgCtrlID(hWnd);
    if (id >= IDOK && id <= IDNO)   /* 1..7 */
        return id;
    if (id == IDHELP)               /* 9 */
        return id;
    return 0;
}
```

- [ ] **Step 3: Add `bwccpaint.c` to the build**

In `dll/bwcc64/build_bwcc64.bat`, change the `cl` line and the `link` line to include `bwccpaint`:

`cl` line — add `bwccpaint.c`:
```bat
cl /nologo /c /W3 /O2 /D_CRT_SECURE_NO_WARNINGS ^
   bwccpaint.c bwccreg.c borbtn.c borcheck.c borshade.c borstatic.c ^
   bwccdlg.c bwccmsg.c bwccedit.c bwccutil.c
```
`link` line — add `bwccpaint.obj`:
```bat
link /nologo /DLL /SUBSYSTEM:WINDOWS /DEF:bwcc64.def /OUT:..\bwcc64.dll ^
   bwccpaint.obj bwccreg.obj borbtn.obj borcheck.obj borshade.obj borstatic.obj ^
   bwccdlg.obj bwccmsg.obj bwccedit.obj bwccutil.obj ^
   user32.lib gdi32.lib kernel32.lib
```

- [ ] **Step 4: Build to verify the module compiles**

Run from `C:\fwteam\dll\bwcc64`: `cmd /c build_bwcc64.bat`
Expected: compile and link succeed, `copied 141 resources`, `done!`. (The controls still behave as stubs — only `bwccpaint.c` is new code so far.)

- [ ] **Step 5: Commit**

```
git add dll/bwcc64/bwccpaint.h dll/bwcc64/bwccpaint.c dll/bwcc64/build_bwcc64.bat
git commit -m "Add BWCC shared paint module (bitmap cache, masked blit, chiseled frame)"
```
Run git from `c:\fwteam`, `git -c commit.gpgsign=false commit`, end message with a blank line then `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`. Never `--no-verify`.

---

## Task 2: BorBtn control

**Files:**
- Rewrite: `dll/bwcc64/borbtn.c`

- [ ] **Step 1: Rewrite `borbtn.c`**

Replace the entire file with:

```c
/* borbtn.c - BorBtn control. Predefined buttons (OK/Cancel/Abort/Retry/
   Ignore/Yes/No/Help) blit BWCC's pre-rendered bitmaps; generic buttons get
   the procedural chiseled frame plus their caption text. */
#include "bwccpaint.h"

/* gray-background button bitmap state bases (see plan bitmap reference) */
#define BWCC_BTN_NORMAL   1000
#define BWCC_BTN_FOCUSED  3000
#define BWCC_BTN_PRESSED  5000

static void BtnPaint(HWND hWnd)
{
    PAINTSTRUCT ps;
    HDC         hdc;
    RECT        rc;
    BWCCSTATE  *st = bwcc_State(hWnd);
    int         unit = bwcc_PredefUnit(hWnd);
    int         enabled = IsWindowEnabled(hWnd);

    hdc = BeginPaint(hWnd, &ps);
    GetClientRect(hWnd, &rc);

    if (unit != 0)
    {
        int base = (st && st->pressed) ? BWCC_BTN_PRESSED
                 : (st && st->focused) ? BWCC_BTN_FOCUSED
                 :                       BWCC_BTN_NORMAL;
        HBITMAP hbm = bwcc_LoadBmp(base + unit);
        if (hbm != NULL)
        {
            BITMAP bm;
            HDC    hdcMem = CreateCompatibleDC(hdc);
            HBITMAP hbmOld = (HBITMAP)SelectObject(hdcMem, hbm);
            GetObject(hbm, sizeof(bm), &bm);
            /* faithful when the control is the bitmap's native size; stretch
               otherwise so a mis-sized template still shows the button */
            if (rc.right == bm.bmWidth && rc.bottom == bm.bmHeight)
                BitBlt(hdc, 0, 0, bm.bmWidth, bm.bmHeight, hdcMem, 0, 0, SRCCOPY);
            else
                StretchBlt(hdc, 0, 0, rc.right, rc.bottom,
                           hdcMem, 0, 0, bm.bmWidth, bm.bmHeight, SRCCOPY);
            SelectObject(hdcMem, hbmOld);
            DeleteDC(hdcMem);
        }
    }
    else
    {
        char  caption[256];
        int   pressed = (st && st->pressed) ? 1 : 0;
        UINT  fmt = DT_CENTER | DT_VCENTER | DT_SINGLELINE;
        HFONT hFont = (HFONT)SendMessage(hWnd, WM_GETFONT, 0, 0);
        HFONT hOldFont = NULL;

        bwcc_ChiselFrame(hdc, &rc, pressed);

        GetWindowTextA(hWnd, caption, sizeof(caption));
        if (hFont != NULL)
            hOldFont = (HFONT)SelectObject(hdc, hFont);
        SetBkMode(hdc, TRANSPARENT);
        SetTextColor(hdc, GetSysColor(enabled ? COLOR_BTNTEXT
                                              : COLOR_GRAYTEXT));
        if (pressed)            /* pressed text shifts down-right by 1px */
            OffsetRect(&rc, 1, 1);
        DrawTextA(hdc, caption, -1, &rc, fmt);

        if (st && st->focused)
        {
            RECT rf;
            GetClientRect(hWnd, &rf);
            InflateRect(&rf, -3, -3);
            DrawFocusRect(hdc, &rf);
        }
        if (hOldFont != NULL)
            SelectObject(hdc, hOldFont);
    }
    EndPaint(hWnd, &ps);
}

static void BtnClick(HWND hWnd)
{
    HWND hParent = GetParent(hWnd);
    if (hParent != NULL)
        SendMessage(hParent, WM_COMMAND,
                    MAKEWPARAM(GetDlgCtrlID(hWnd), BN_CLICKED),
                    (LPARAM)hWnd);
}

LRESULT CALLBACK _BWCCButtonWndProc(HWND hWnd, UINT msg,
                                    WPARAM wParam, LPARAM lParam)
{
    BWCCSTATE *st;

    switch (msg)
    {
    case WM_PAINT:
        BtnPaint(hWnd);
        return 0;

    case WM_ERASEBKGND:
        return 1;                       /* WM_PAINT fills the whole client */

    case WM_GETDLGCODE:
        return DLGC_BUTTON | DLGC_UNDEFPUSHBUTTON;

    case WM_LBUTTONDOWN:
        st = bwcc_State(hWnd);
        if (st != NULL)
        {
            st->pressed = st->capture = 1;
            SetCapture(hWnd);
            SetFocus(hWnd);
            InvalidateRect(hWnd, NULL, FALSE);
        }
        return 0;

    case WM_MOUSEMOVE:
        st = bwcc_State(hWnd);
        if (st != NULL && st->capture)
        {
            RECT rc;
            POINT pt;
            int inside;
            pt.x = (short)LOWORD(lParam);
            pt.y = (short)HIWORD(lParam);
            GetClientRect(hWnd, &rc);
            inside = PtInRect(&rc, pt) ? 1 : 0;
            if (inside != st->pressed)
            {
                st->pressed = inside;
                InvalidateRect(hWnd, NULL, FALSE);
            }
        }
        return 0;

    case WM_LBUTTONUP:
        st = bwcc_State(hWnd);
        if (st != NULL && st->capture)
        {
            int doClick = st->pressed;
            st->pressed = st->capture = 0;
            ReleaseCapture();
            InvalidateRect(hWnd, NULL, FALSE);
            if (doClick)
                BtnClick(hWnd);
        }
        return 0;

    case WM_KEYDOWN:
        if (wParam == VK_SPACE)
        {
            st = bwcc_State(hWnd);
            if (st != NULL && !st->pressed)
            {
                st->pressed = 1;
                InvalidateRect(hWnd, NULL, FALSE);
            }
        }
        return 0;

    case WM_KEYUP:
        if (wParam == VK_SPACE)
        {
            st = bwcc_State(hWnd);
            if (st != NULL && st->pressed)
            {
                st->pressed = 0;
                InvalidateRect(hWnd, NULL, FALSE);
                BtnClick(hWnd);
            }
        }
        return 0;

    case WM_SETFOCUS:
    case WM_KILLFOCUS:
        st = bwcc_State(hWnd);
        if (st != NULL)
        {
            st->focused = (msg == WM_SETFOCUS) ? 1 : 0;
            InvalidateRect(hWnd, NULL, FALSE);
        }
        return 0;

    case WM_ENABLE:
        InvalidateRect(hWnd, NULL, FALSE);
        return 0;

    case WM_NCDESTROY:
        bwcc_FreeState(hWnd);
        return DefWindowProc(hWnd, msg, wParam, lParam);

    default:
        return DefWindowProc(hWnd, msg, wParam, lParam);
    }
}
```

- [ ] **Step 2: Build**

Run from `C:\fwteam\dll\bwcc64`: `cmd /c build_bwcc64.bat`
Expected: compile + link succeed, `done!`.

- [ ] **Step 3: Run the export-parity gate**

Run: `powershell -ExecutionPolicy Bypass -File C:\fwteam\dll\bwcc64\verify_exports.ps1`
Expected: `EXPORT PARITY: MATCH`, exit 0. (Rewriting a WndProc body must not change the export set.)

- [ ] **Step 4: Commit**

```
git add dll/bwcc64/borbtn.c
git commit -m "Implement BWCC BorBtn control (bitmap-faithful + chiseled generic)"
```
(Same git conventions as Task 1 Step 5.)

---

## Task 3: BorCheck and BorRadio controls

**Files:**
- Rewrite: `dll/bwcc64/borcheck.c`

- [ ] **Step 1: Rewrite `borcheck.c`**

Replace the entire file with:

```c
/* borcheck.c - BorCheck (square) and BorRadio (diamond) controls.
   The 13x13 glyph is blitted through its 1bpp mask; the caption is drawn to
   the right. Clicking toggles the checked state and notifies the parent. */
#include "bwccpaint.h"

#define BWCC_GLYPH_W   13
#define BWCC_GLYPH_H   13

/* glyph colour/mask bitmap ids: {unchecked,checked,unchecked-dis,checked-dis} */
static const int s_checkColor[4] = { 110, 111, 114, 115 };
static const int s_checkMask [4] = { 116, 117, 120, 121 };
static const int s_radioColor[2] = { 130, 131 };
static const int s_radioMask [2] = { 134, 135 };

static void GlyphPaint(HWND hWnd, int isRadio)
{
    PAINTSTRUCT ps;
    HDC         hdc;
    RECT        rc;
    BWCCSTATE  *st = bwcc_State(hWnd);
    int         checked = (st && st->checked) ? 1 : 0;
    int         enabled = IsWindowEnabled(hWnd);
    int         gy, idx;
    HBITMAP     hbmC, hbmM;
    char        caption[256];
    HFONT       hFont, hOldFont = NULL;

    hdc = BeginPaint(hWnd, &ps);
    GetClientRect(hWnd, &rc);
    FillRect(hdc, &rc, GetSysColorBrush(COLOR_BTNFACE));

    if (isRadio)
    {
        idx  = checked ? 1 : 0;
        hbmC = bwcc_LoadBmp(s_radioColor[idx]);
        hbmM = bwcc_LoadBmp(s_radioMask[idx]);
    }
    else
    {
        idx  = (enabled ? 0 : 2) + (checked ? 1 : 0);
        hbmC = bwcc_LoadBmp(s_checkColor[idx]);
        hbmM = bwcc_LoadBmp(s_checkMask[idx]);
    }

    gy = (rc.bottom - BWCC_GLYPH_H) / 2;
    if (gy < 0) gy = 0;
    if (hbmC != NULL)
        bwcc_BlitMasked(hdc, 0, gy, BWCC_GLYPH_W, BWCC_GLYPH_H, hbmC, hbmM);

    GetWindowTextA(hWnd, caption, sizeof(caption));
    if (caption[0] != '\0')
    {
        RECT rt = rc;
        rt.left = BWCC_GLYPH_W + 4;
        hFont = (HFONT)SendMessage(hWnd, WM_GETFONT, 0, 0);
        if (hFont != NULL)
            hOldFont = (HFONT)SelectObject(hdc, hFont);
        SetBkMode(hdc, TRANSPARENT);
        SetTextColor(hdc, GetSysColor(enabled ? COLOR_BTNTEXT
                                              : COLOR_GRAYTEXT));
        DrawTextA(hdc, caption, -1, &rt,
                  DT_LEFT | DT_VCENTER | DT_SINGLELINE);
        if (st && st->focused)
        {
            SIZE sz;
            GetTextExtentPoint32A(hdc, caption, (int)strlen(caption), &sz);
            rt.right = rt.left + sz.cx + 2;
            rt.left -= 1;
            DrawFocusRect(hdc, &rt);
        }
        if (hOldFont != NULL)
            SelectObject(hdc, hOldFont);
    }
    EndPaint(hWnd, &ps);
}

static void GlyphClick(HWND hWnd, int isRadio)
{
    BWCCSTATE *st = bwcc_State(hWnd);
    HWND hParent;
    if (st == NULL)
        return;
    if (isRadio)
        st->checked = 1;            /* radios select; group-clear is the
                                       dialog manager's job via WM_COMMAND */
    else
        st->checked = !st->checked;
    InvalidateRect(hWnd, NULL, FALSE);
    hParent = GetParent(hWnd);
    if (hParent != NULL)
        SendMessage(hParent, WM_COMMAND,
                    MAKEWPARAM(GetDlgCtrlID(hWnd), BN_CLICKED),
                    (LPARAM)hWnd);
}

static LRESULT GlyphProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam,
                         int isRadio)
{
    BWCCSTATE *st;

    switch (msg)
    {
    case WM_PAINT:
        GlyphPaint(hWnd, isRadio);
        return 0;

    case WM_ERASEBKGND:
        return 1;

    case WM_GETDLGCODE:
        return DLGC_BUTTON | DLGC_WANTCHARS;

    case BM_GETCHECK:
        st = bwcc_State(hWnd);
        return (st != NULL && st->checked) ? BST_CHECKED : BST_UNCHECKED;

    case BM_SETCHECK:
        st = bwcc_State(hWnd);
        if (st != NULL)
        {
            st->checked = (wParam != BST_UNCHECKED) ? 1 : 0;
            InvalidateRect(hWnd, NULL, FALSE);
        }
        return 0;

    case WM_LBUTTONDOWN:
        SetFocus(hWnd);
        GlyphClick(hWnd, isRadio);
        return 0;

    case WM_KEYUP:
        if (wParam == VK_SPACE)
            GlyphClick(hWnd, isRadio);
        return 0;

    case WM_SETFOCUS:
    case WM_KILLFOCUS:
        st = bwcc_State(hWnd);
        if (st != NULL)
        {
            st->focused = (msg == WM_SETFOCUS) ? 1 : 0;
            InvalidateRect(hWnd, NULL, FALSE);
        }
        return 0;

    case WM_ENABLE:
        InvalidateRect(hWnd, NULL, FALSE);
        return 0;

    case WM_NCDESTROY:
        bwcc_FreeState(hWnd);
        return DefWindowProc(hWnd, msg, wParam, lParam);

    default:
        return DefWindowProc(hWnd, msg, wParam, lParam);
    }
}

LRESULT CALLBACK _BWCCCheckWndProc(HWND hWnd, UINT msg,
                                   WPARAM wParam, LPARAM lParam)
{
    return GlyphProc(hWnd, msg, wParam, lParam, 0);
}

LRESULT CALLBACK _BWCCRadioWndProc(HWND hWnd, UINT msg,
                                   WPARAM wParam, LPARAM lParam)
{
    return GlyphProc(hWnd, msg, wParam, lParam, 1);
}
```

- [ ] **Step 2: Build, verify exports, commit**

Run from `C:\fwteam\dll\bwcc64`: `cmd /c build_bwcc64.bat` — expect `done!`.
Run `powershell -ExecutionPolicy Bypass -File C:\fwteam\dll\bwcc64\verify_exports.ps1` — expect `EXPORT PARITY: MATCH`.
```
git add dll/bwcc64/borcheck.c
git commit -m "Implement BWCC BorCheck and BorRadio controls"
```

---

## Task 4: BorStatic control

**Files:**
- Rewrite: `dll/bwcc64/borstatic.c`

- [ ] **Step 1: Rewrite `borstatic.c`**

Replace the entire file with:

```c
/* borstatic.c - BorStatic control. Draws its caption text with the BWCC
   look: transparent background, button-face fill, control font. */
#include "bwccpaint.h"

LRESULT CALLBACK _BWCCStaticWndProc(HWND hWnd, UINT msg,
                                    WPARAM wParam, LPARAM lParam)
{
    switch (msg)
    {
    case WM_PAINT:
        {
            PAINTSTRUCT ps;
            HDC   hdc;
            RECT  rc;
            char  caption[256];
            HFONT hFont, hOldFont = NULL;

            hdc = BeginPaint(hWnd, &ps);
            GetClientRect(hWnd, &rc);
            FillRect(hdc, &rc, GetSysColorBrush(COLOR_BTNFACE));

            GetWindowTextA(hWnd, caption, sizeof(caption));
            hFont = (HFONT)SendMessage(hWnd, WM_GETFONT, 0, 0);
            if (hFont != NULL)
                hOldFont = (HFONT)SelectObject(hdc, hFont);
            SetBkMode(hdc, TRANSPARENT);
            SetTextColor(hdc, GetSysColor(IsWindowEnabled(hWnd)
                                          ? COLOR_BTNTEXT : COLOR_GRAYTEXT));
            DrawTextA(hdc, caption, -1, &rc,
                      DT_LEFT | DT_VCENTER | DT_SINGLELINE);
            if (hOldFont != NULL)
                SelectObject(hdc, hOldFont);
            EndPaint(hWnd, &ps);
        }
        return 0;

    case WM_ERASEBKGND:
        return 1;

    case WM_SETTEXT:
        {
            LRESULT r = DefWindowProc(hWnd, msg, wParam, lParam);
            InvalidateRect(hWnd, NULL, FALSE);
            return r;
        }

    case WM_GETDLGCODE:
        return DLGC_STATIC;

    default:
        return DefWindowProc(hWnd, msg, wParam, lParam);
    }
}
```

- [ ] **Step 2: Build, verify exports, commit**

`cmd /c build_bwcc64.bat` — expect `done!`. `verify_exports.ps1` — expect `MATCH`.
```
git add dll/bwcc64/borstatic.c
git commit -m "Implement BWCC BorStatic control"
```

---

## Task 5: BorShade control

**Files:**
- Rewrite: `dll/bwcc64/borshade.c`

BorShade draws a recessed/raised 3D region. BWCC shade style is carried in the
low bits of the control's window style; this plan supports the four common
shades selected by those bits: `0`=group box, `1`=raised box, `2`=horizontal
line, `3`=vertical line.

- [ ] **Step 1: Rewrite `borshade.c`**

Replace the entire file with:

```c
/* borshade.c - BorShade control. Draws a 3D-edged region: group box, raised
   box, horizontal divider, or vertical divider, chosen by the low 2 bits of
   the window style. */
#include "bwccpaint.h"

#define BWCC_SHADE_GROUP   0
#define BWCC_SHADE_BOX     1
#define BWCC_SHADE_HLINE   2
#define BWCC_SHADE_VLINE   3

static void Edge(HDC hdc, int x1, int y1, int x2, int y2, int sysColor)
{
    HPEN hPen = CreatePen(PS_SOLID, 1, GetSysColor(sysColor));
    HPEN hOld = (HPEN)SelectObject(hdc, hPen);
    MoveToEx(hdc, x1, y1, NULL);
    LineTo(hdc, x2, y2);
    SelectObject(hdc, hOld);
    DeleteObject(hPen);
}

LRESULT CALLBACK _BWCCPanelWndProc(HWND hWnd, UINT msg,
                                   WPARAM wParam, LPARAM lParam)
{
    switch (msg)
    {
    case WM_PAINT:
        {
            PAINTSTRUCT ps;
            HDC  hdc;
            RECT rc;
            int  shade = (int)(GetWindowLongPtr(hWnd, GWL_STYLE) & 0x3);
            int  r, b, mid;

            hdc = BeginPaint(hWnd, &ps);
            GetClientRect(hWnd, &rc);
            FillRect(hdc, &rc, GetSysColorBrush(COLOR_BTNFACE));
            r = rc.right - 1;
            b = rc.bottom - 1;

            switch (shade)
            {
            case BWCC_SHADE_HLINE:
                mid = rc.bottom / 2;
                Edge(hdc, rc.left, mid,     r, mid,     COLOR_BTNSHADOW);
                Edge(hdc, rc.left, mid + 1, r, mid + 1, COLOR_BTNHIGHLIGHT);
                break;

            case BWCC_SHADE_VLINE:
                mid = rc.right / 2;
                Edge(hdc, mid,     rc.top, mid,     b, COLOR_BTNSHADOW);
                Edge(hdc, mid + 1, rc.top, mid + 1, b, COLOR_BTNHIGHLIGHT);
                break;

            case BWCC_SHADE_BOX:
                /* raised box: highlight top-left, shadow bottom-right */
                Edge(hdc, rc.left, rc.top, r,       rc.top, COLOR_BTNHIGHLIGHT);
                Edge(hdc, rc.left, rc.top, rc.left, b,      COLOR_BTNHIGHLIGHT);
                Edge(hdc, rc.left, b,      r,       b,      COLOR_BTNSHADOW);
                Edge(hdc, r,       rc.top, r,       b,      COLOR_BTNSHADOW);
                break;

            case BWCC_SHADE_GROUP:
            default:
                /* recessed group frame: shadow top-left, highlight bot-right */
                Edge(hdc, rc.left, rc.top, r,       rc.top, COLOR_BTNSHADOW);
                Edge(hdc, rc.left, rc.top, rc.left, b,      COLOR_BTNSHADOW);
                Edge(hdc, rc.left, b,      r,       b,      COLOR_BTNHIGHLIGHT);
                Edge(hdc, r,       rc.top, r,       b,      COLOR_BTNHIGHLIGHT);
                break;
            }
            EndPaint(hWnd, &ps);
        }
        return 0;

    case WM_ERASEBKGND:
        return 1;

    default:
        return DefWindowProc(hWnd, msg, wParam, lParam);
    }
}
```

- [ ] **Step 2: Build, verify exports, commit**

`cmd /c build_bwcc64.bat` — expect `done!`. `verify_exports.ps1` — expect `MATCH`.
```
git add dll/bwcc64/borshade.c
git commit -m "Implement BWCC BorShade control"
```

---

## Task 6: Class styles for the controls

**Files:**
- Modify: `dll/bwcc64/bwccreg.c`

The Plan-1 `BWCCRegister` registers the classes without `CS_*` styles. Controls
that paint per-pixel need `CS_HREDRAW | CS_VREDRAW` so a resize repaints, and
`CS_DBLCLKS` so rapid clicks are not lost. The window-frame `cbWndExtra` slot is
already reserved (`sizeof(LONG_PTR)`); no change there.

- [ ] **Step 1: Edit `bwccreg.c`**

In `BWCCRegister`, locate the `ZeroMemory(&wc, sizeof(wc));` block and add a
`wc.style` assignment. The block becomes:

```c
        ZeroMemory(&wc, sizeof(wc));
        wc.style         = CS_HREDRAW | CS_VREDRAW | CS_DBLCLKS;
        wc.lpfnWndProc   = classes[i].proc;
        wc.hInstance     = g_hInstDll;
        wc.hCursor       = LoadCursor(NULL, IDC_ARROW);
        wc.cbWndExtra    = sizeof(LONG_PTR);
        wc.lpszClassName = classes[i].name;
        RegisterClassA(&wc);   /* ignore "already registered" failures */
```

- [ ] **Step 2: Build, verify exports, commit**

`cmd /c build_bwcc64.bat` — expect `done!`. `verify_exports.ps1` — expect `MATCH`.
```
git add dll/bwcc64/bwccreg.c
git commit -m "Add repaint and double-click class styles to BWCC controls"
```

---

## Task 7: Visual smoke-test sample

**Files:**
- Create: `dll/bwcc64/test/bwcctest.prg`
- Create: `dll/bwcc64/test/bwcctest.rc`

A FiveWin sample that loads `bwcc64.dll`, calls `BWCCRegister`, and shows a
dialog containing predefined buttons, a generic button, a checkbox, two radios,
a static, and a shade — for side-by-side visual comparison with bwcc32.dll.

- [ ] **Step 1: Write `dll/bwcc64/test/bwcctest.rc`**

```rc
#include <windows.h>

TESTDLG DIALOG 20, 20, 220, 150
STYLE DS_MODALFRAME | WS_POPUP | WS_CAPTION | WS_SYSMENU
CAPTION "BWCC 64 control test"
FONT 8, "MS Sans Serif"
BEGIN
    CONTROL "OK",      1, "BorBtn",    WS_TABSTOP | WS_VISIBLE,  10,  10, 63, 39
    CONTROL "Cancel",  2, "BorBtn",    WS_TABSTOP | WS_VISIBLE,  80,  10, 63, 39
    CONTROL "Help",    9, "BorBtn",    WS_TABSTOP | WS_VISIBLE, 150,  10, 63, 39
    CONTROL "Custom", 100, "BorBtn",   WS_TABSTOP | WS_VISIBLE,  10,  55, 63, 30
    CONTROL "Check me",101,"BorCheck", WS_TABSTOP | WS_VISIBLE,  10,  95, 90, 14
    CONTROL "Radio A",102,"BorRadio",  WS_TABSTOP | WS_VISIBLE,  10, 112, 90, 14
    CONTROL "Radio B",103,"BorRadio",  WS_VISIBLE,               10, 128, 90, 14
    CONTROL "Static text",104,"BorStatic", WS_VISIBLE,          110,  95,100, 14
    CONTROL "",       105, "BorShade",  WS_VISIBLE,             110, 112,100,  2
END
```

- [ ] **Step 2: Write `dll/bwcc64/test/bwcctest.prg`**

```harbour
// bwcctest.prg - visual smoke test for bwcc64.dll BWCC controls.
#include "FiveWin.ch"

function Main()

   local hLib := LoadLibrary( "bwcc64.dll" )

   if hLib == 0
      MsgStop( "bwcc64.dll failed to load" )
      return nil
   endif

   BWCCRegister( hLib )

   DialogBoxParam( GetResources(), "TESTDLG", 0, 0, 0 )

   FreeLibrary( hLib )

   return nil

#pragma BEGINDUMP
#include <windows.h>
#include <hbapi.h>

HB_FUNC( BWCCREGISTER )
{
   typedef BOOL ( WINAPI * REGFN )( HINSTANCE );
   HINSTANCE h = ( HINSTANCE ) ( HB_PTRUINT ) hb_parnint( 1 );
   REGFN fn = ( REGFN ) GetProcAddress( h, "BWCCRegister" );
   hb_retl( fn != NULL && fn( h ) );
}
#pragma ENDDUMP
```

> Note: `LoadLibrary`, `FreeLibrary`, `GetResources`, `DialogBoxParam` and
> `MsgStop` are FiveWin/Harbour built-ins. `BWCCRegister` is the small C bridge
> in the `BEGINDUMP` block; it resolves the export from the loaded module and
> calls it. The dialog is modal — closing it (Esc / system menu) ends the test.

- [ ] **Step 3: Build the sample**

Copy `dll/bwcc64.dll` next to the build, then build with the project tool.
Run from `C:\fwteam\dll\bwcc64\test`:
```
copy ..\..\bwcc64.dll .
C:\fwteam\samples\build_new.bat bwcctest xm64
```
Expected: `bwcctest.exe` is produced. `build_new.bat` auto-runs it (set
`FW_NORUN=1` to skip). The dialog appears with three predefined buttons
(OK/Cancel/Help showing BWCC bitmaps), one chiseled "Custom" button, a
checkbox, two radios, a static, and a horizontal shade line.

- [ ] **Step 4: Verify behavior**

With the test dialog open, confirm:
- OK / Cancel / Help show the BWCC pre-rendered bitmap faces.
- The bitmap face changes when the button has focus (Tab) and while pressed.
- "Custom" draws the chiseled frame with its caption, and the caption shifts
  when pressed.
- The checkbox toggles its glyph on click; radios show the diamond glyph.
- Clicking OK or Cancel closes the dialog (the dialog manager acts on the
  `WM_COMMAND`/`BN_CLICKED` the controls send).

Capture a screenshot for the side-by-side comparison noted in the spec's
testing section.

- [ ] **Step 5: Commit**

```
git add dll/bwcc64/test/bwcctest.prg dll/bwcc64/test/bwcctest.rc
git commit -m "Add BWCC 64-bit control visual smoke-test sample"
```
Do NOT commit the copied `bwcc64.dll`, the built `bwcctest.exe`, or any
`.obj`/`.map`/`.ppo` build intermediates in `dll/bwcc64/test/`.

---

## Self-Review

- **Spec coverage:** The spec's "Custom control subsystem" lists BorBtn (bitmap
  blit of `#x001-#x009` + chisel frame from the generic path), BorCheck/BorRadio
  (glyphs `#110-#137`), BorShade (group/frame/box/line), BorStatic (text). Tasks
  2-5 implement each; Task 1 supplies the shared blit/cache/state; Task 6 wires
  the class styles; Task 7 is the spec's visual-parity test.
- **Placeholder scan:** none — every file is shown complete; every step has its
  exact command and expected output.
- **Type consistency:** `BWCCSTATE`, `bwcc_State`, `bwcc_FreeState`,
  `bwcc_LoadBmp`, `bwcc_BlitMasked`, `bwcc_ChiselFrame`, `bwcc_PredefUnit` are
  declared in `bwccpaint.h` (Task 1) and used with matching signatures in Tasks
  2-5. `g_hInstDll` comes from `bwcc.h` (Plan 1). The window-word index `0`
  matches the `cbWndExtra = sizeof(LONG_PTR)` reserved by `BWCCRegister`.
- **Known approximations (faithful-look, not byte-exact):** the generic-button
  chiseled frame and the BorShade edges are procedural reconstructions of the
  BWCC look — BWCC's exact internal frame algorithm is not recoverable without
  the original source. Predefined buttons and check/radio glyphs ARE byte-exact
  (BWCC's own bitmaps). The Task 7 visual comparison is the acceptance check.
- **Carried-forward note (from Plan 1 review):** `BWCCRegister` registers
  classes against `g_hInstDll`, not the caller's `hInst`. Task 6 keeps that
  choice; it is correct here because the control window procedures live in the
  DLL and the cached bitmaps load from `g_hInstDll`.
