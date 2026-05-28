# BWCC 64-bit Dialog Mangling & Message Box Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the remaining BWCC dialog functions in `bwcc64.dll`: `MangleDialog`, the `CreateDialogParamA`/`DialogBoxParamA` wrappers, `SpecialLoadDialog`, the two special dialog procs, and `BWCCMessageBox` with `_BWCCMsgBoxProc`.

**Architecture:** `MangleDialog` walks a classic `DLGTEMPLATE` and rewrites it into a fresh buffer, swapping the dialog class to `BorDlg` and the `BUTTON`/`STATIC` control classes to `BorBtn`/`BorStatic`. The `CreateDialogParamA`/`DialogBoxParamA` wrappers load a dialog resource, mangle it, and create it via the Win32 `*IndirectParam` calls. `BWCCMessageBox` builds an in-memory `BorDlg` template with a `BorStatic` and `BorBtn` buttons, then `DialogBoxIndirectParamA` runs it; `_BWCCMsgBoxProc` lays the controls out in pixels and draws the BWCC icon.

**Tech Stack:** C (MSVC amd64), Win32 dialog API, `DLGTEMPLATE` binary format, the `#1901-1904` icon bitmaps embedded in `bwcc64.dll`.

**Spec:** `docs/superpowers/specs/2026-05-21-bwcc64-port-design.md` — "Dialog subsystem", "Message box".
**Prior plans:** foundation (1), controls (2), gray dialogs (3) — all complete.

**Roadmap position:** dialog subsystem part 2 of 2. Editor helpers and misc follow.

---

## Background

- A classic `DLGTEMPLATE` is: `DWORD style; DWORD dwExtendedStyle; WORD cdit;
  short x,y,cx,cy;` (18 bytes) then three variable fields — menu, class, title
  — each encoded as `0x0000` (1 WORD, empty), `0xFFFF`+ordinal (2 WORDs), or a
  null-terminated UTF-16 string. If `style & DS_SETFONT`: a WORD point size then
  a UTF-16 typeface string. Then `cdit` items, each `DWORD`-aligned from the
  template start: `DWORD style; DWORD dwExtendedStyle; short x,y,cx,cy;
  WORD id;` (18 bytes), then class and title (same encoding; class may be
  `0xFFFF`+atom — `0x0080` BUTTON, `0x0082` STATIC), then a `WORD` creation-data
  byte count and that many bytes.
- A `DLGTEMPLATEEX` resource begins `WORD dlgVer(1); WORD signature(0xFFFF)`.
  Modern `DIALOGEX` resources produce it; legacy BWCC `.rc` use plain `DIALOG`
  (classic). `MangleDialog` passes `DLGTEMPLATEEX` through unchanged.
- Message-box icons: `#1901` red hand, `#1902` green question, `#1903` yellow
  exclamation, `#1904` blue information — 48x64, gray background.

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `dll/bwcc64/bwccdlg.c` | Rewrite | keep the Plan-3 gray procs; implement `MangleDialog`, the wrappers, `SpecialLoadDialog`, the special procs |
| `dll/bwcc64/bwccmsg.c` | Rewrite | `BWCCMessageBox`, `_BWCCMsgBoxProc` |
| `dll/bwcc64/test/bwccmsgtest.c` | Create | standalone visual test for `BWCCMessageBox` |
| `dll/bwcc64/test/build_test.bat` | Modify | also build `bwccmsgtest.exe` |

---

## Task 1: MangleDialog and the dialog wrappers

**Files:**
- Rewrite: `dll/bwcc64/bwccdlg.c`

- [ ] **Step 1: Rewrite `bwccdlg.c`**

Replace the entire file with:

```c
/* bwccdlg.c - BWCC dialog subsystem: gray default procedures, dialog-template
   mangling, and the dialog-creation wrappers.
   bwccCreateDialogParamA / bwccDialogBoxParamA are exported under their public
   names via bwcc64.def aliasing, to avoid colliding with user32.lib. */
#include "bwccdlg.h"
#include <stdlib.h>
#include <string.h>

/* ===================== gray default procedures ====================== */

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

/* ===================== template mangling ============================ */

/* Growable byte buffer. */
typedef struct { BYTE *b; size_t cap; size_t len; } GBUF;

static int gb_need(GBUF *g, size_t n)
{
    if (g->len + n > g->cap)
    {
        size_t nc = (g->cap != 0) ? g->cap : 256;
        BYTE  *nb;
        while (nc < g->len + n)
            nc *= 2;
        nb = (BYTE *)realloc(g->b, nc);
        if (nb == NULL)
            return 0;
        g->b = nb;
        g->cap = nc;
    }
    return 1;
}

static void gb_put(GBUF *g, const void *p, size_t n)
{
    if (gb_need(g, n))
    {
        memcpy(g->b + g->len, p, n);
        g->len += n;
    }
}

static void gb_align(GBUF *g)
{
    BYTE zero = 0;
    while ((g->len & 3) != 0)
        gb_put(g, &zero, 1);
}

/* Append an ASCII string as a null-terminated UTF-16 string. */
static void gb_wstr(GBUF *g, const char *s)
{
    WORD w;
    while (*s != '\0')
    {
        w = (WORD)(BYTE)*s++;
        gb_put(g, &w, 2);
    }
    w = 0;
    gb_put(g, &w, 2);
}

/* Copy a menu/class/title sz-field verbatim; return the advanced input ptr. */
static const BYTE *copy_sz(GBUF *g, const BYTE *p)
{
    const WORD *w = (const WORD *)p;
    if (w[0] == 0x0000)
    {
        gb_put(g, p, 2);
        return p + 2;
    }
    if (w[0] == 0xFFFF)
    {
        gb_put(g, p, 4);
        return p + 4;
    }
    {
        const WORD *e = w;
        while (*e != 0)
            e++;
        e++;                                   /* include terminator */
        gb_put(g, p, (size_t)((const BYTE *)e - p));
        return (const BYTE *)e;
    }
}

/* Advance past an sz-field without copying; return the advanced input ptr. */
static const BYTE *skip_sz(const BYTE *p)
{
    const WORD *w = (const WORD *)p;
    if (w[0] == 0x0000)
        return p + 2;
    if (w[0] == 0xFFFF)
        return p + 4;
    {
        const WORD *e = w;
        while (*e != 0)
            e++;
        return (const BYTE *)(e + 1);
    }
}

/* Copy an item class field, substituting BWCC classes for BUTTON/STATIC. */
static const BYTE *mangle_class(GBUF *g, const BYTE *p)
{
    const WORD *w = (const WORD *)p;

    if (w[0] == 0xFFFF)                         /* class atom */
    {
        if (w[1] == 0x0080) { gb_wstr(g, "BorBtn");    return p + 4; }
        if (w[1] == 0x0082) { gb_wstr(g, "BorStatic"); return p + 4; }
        gb_put(g, p, 4);
        return p + 4;
    }
    {                                           /* class string */
        char  name[32];
        int   n = 0;
        const WORD *q = w;
        const WORD *e;
        while (*q != 0 && n < 31)
            name[n++] = (char)*q++;
        name[n] = '\0';
        e = w;
        while (*e != 0)
            e++;
        e++;
        if (_stricmp(name, "button") == 0) { gb_wstr(g, "BorBtn");    return (const BYTE *)e; }
        if (_stricmp(name, "static") == 0) { gb_wstr(g, "BorStatic"); return (const BYTE *)e; }
        gb_put(g, p, (size_t)((const BYTE *)e - p));
        return (const BYTE *)e;
    }
}

/* Rewrites a classic DLGTEMPLATE so the dialog uses the BorDlg class and the
   standard BUTTON/STATIC controls use BorBtn/BorStatic. Returns a malloc'd
   buffer the caller must free. A DLGTEMPLATEEX template is returned unchanged
   (the caller must NOT free that pointer). NULL on allocation failure. */
LPVOID WINAPI MangleDialog(LPVOID lpTemplate, LPVOID lpReserved)
{
    const BYTE *ip = (const BYTE *)lpTemplate;
    const WORD *probe = (const WORD *)lpTemplate;
    const BYTE *base;
    GBUF  g;
    DWORD style;
    WORD  cdit;
    UINT  i;

    (void)lpReserved;
    if (lpTemplate == NULL)
        return NULL;
    if (probe[0] == 1 && probe[1] == 0xFFFF)    /* DLGTEMPLATEEX: pass through */
        return lpTemplate;

    g.b = NULL; g.cap = 0; g.len = 0;
    base = ip;
    style = *(const DWORD *)ip;
    cdit  = *(const WORD *)(ip + 8);

    gb_put(&g, ip, 18);                         /* fixed header */
    ip += 18;
    ip = copy_sz(&g, ip);                       /* menu */

    {                                           /* class -> BorDlg */
        const BYTE *after = skip_sz(ip);
        gb_wstr(&g, "BorDlg");
        ip = after;
    }
    ip = copy_sz(&g, ip);                       /* title */

    if ((style & DS_SETFONT) != 0)
    {
        gb_put(&g, ip, 2);                      /* point size */
        ip += 2;
        ip = copy_sz(&g, ip);                   /* typeface */
    }

    for (i = 0; i < cdit; i++)
    {
        WORD cnt;
        gb_align(&g);
        ip = base + ((size_t)(ip - base) + 3 & ~(size_t)3);
        gb_put(&g, ip, 18);                     /* item fixed part */
        ip += 18;
        ip = mangle_class(&g, ip);              /* class (substituted) */
        ip = copy_sz(&g, ip);                   /* title */
        cnt = *(const WORD *)ip;                /* creation data */
        gb_put(&g, ip, 2);
        ip += 2;
        if (cnt != 0)
        {
            gb_put(&g, ip, cnt);
            ip += cnt;
        }
    }
    return g.b;
}

/* ===================== dialog-creation wrappers ===================== */

/* Loads a dialog resource and returns its (locked, read-only) template. */
static const BYTE *LoadDlgTemplate(HINSTANCE hInst, LPCSTR lpName)
{
    HRSRC   hr = FindResourceA(hInst, lpName, (LPCSTR)RT_DIALOG);
    HGLOBAL hg;
    if (hr == NULL)
        return NULL;
    hg = LoadResource(hInst, hr);
    if (hg == NULL)
        return NULL;
    return (const BYTE *)LockResource(hg);
}

HWND WINAPI bwccCreateDialogParamA(HINSTANCE hInst, LPCSTR lpName, HWND hParent,
                                   DLGPROC lpProc, LPARAM lParam)
{
    const BYTE *tpl = LoadDlgTemplate(hInst, lpName);
    LPVOID      mangled;
    HWND        hwnd;
    if (tpl == NULL)
        return NULL;
    mangled = MangleDialog((LPVOID)tpl, NULL);
    if (mangled == NULL)
        return NULL;
    hwnd = CreateDialogIndirectParamA(hInst, (LPCDLGTEMPLATEA)mangled,
                                      hParent, lpProc, lParam);
    if (mangled != (LPVOID)tpl)
        free(mangled);
    return hwnd;
}

INT_PTR WINAPI bwccDialogBoxParamA(HINSTANCE hInst, LPCSTR lpName, HWND hParent,
                                   DLGPROC lpProc, LPARAM lParam)
{
    const BYTE *tpl = LoadDlgTemplate(hInst, lpName);
    LPVOID      mangled;
    INT_PTR     ret;
    if (tpl == NULL)
        return -1;
    mangled = MangleDialog((LPVOID)tpl, NULL);
    if (mangled == NULL)
        return -1;
    ret = DialogBoxIndirectParamA(hInst, (LPCDLGTEMPLATEA)mangled,
                                  hParent, lpProc, lParam);
    if (mangled != (LPVOID)tpl)
        free(mangled);
    return ret;
}

/* Loads a dialog resource and returns its mangled template; the caller frees
   the returned buffer (unless it is the unchanged DLGTEMPLATEEX input). */
LPVOID WINAPI SpecialLoadDialog(HINSTANCE hInst, LPCSTR lpName)
{
    const BYTE *tpl = LoadDlgTemplate(hInst, lpName);
    if (tpl == NULL)
        return NULL;
    return MangleDialog((LPVOID)tpl, NULL);
}

/* Default dialog procedures: dismiss on OK/Cancel, otherwise unhandled. */
INT_PTR CALLBACK _BWCCSpecialDialogProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    (void)l;
    if (m == WM_COMMAND)
    {
        WORD id = LOWORD(w);
        if (id == IDOK || id == IDCANCEL)
        {
            EndDialog(h, id);
            return TRUE;
        }
    }
    return FALSE;
}

INT_PTR CALLBACK _BWCCASpecialDialogProc(HWND h, UINT m, WPARAM w, LPARAM l)
{
    return _BWCCSpecialDialogProc(h, m, w, l);
}
```

> Note: `(size_t)(ip - base) + 3 & ~(size_t)3` — `+` binds tighter than `&`,
> so this is `((size_t)(ip-base)+3) & ~3`, the DWORD-align of the input offset.

- [ ] **Step 2: Build, verify exports**

`cmd /c "cd /d C:\fwteam\dll\bwcc64 & C:\fwteam\dll\bwcc64\build_bwcc64.bat"` — expect `done!`.
`powershell -ExecutionPolicy Bypass -File C:\fwteam\dll\bwcc64\verify_exports.ps1` — expect `EXPORT PARITY: MATCH`.

- [ ] **Step 3: Commit**

Run git from `c:\fwteam`, `git -c commit.gpgsign=false commit`, end message with a blank line then `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`. Never `--no-verify`.
```
git add dll/bwcc64/bwccdlg.c
git commit -m "Implement BWCC dialog mangling and creation wrappers"
```

---

## Task 2: BWCCMessageBox

**Files:**
- Rewrite: `dll/bwcc64/bwccmsg.c`

- [ ] **Step 1: Rewrite `bwccmsg.c`**

Replace the entire file with:

```c
/* bwccmsg.c - BWCC message box: a gray BorDlg holding a BorStatic message and
   BorBtn buttons, with a BWCC icon drawn by the dialog procedure. */
#include "bwccpaint.h"
#include <stdlib.h>
#include <string.h>

#define MSG_ICON_W     48
#define MSG_ICON_H     64
#define MSG_BTN_W      64
#define MSG_BTN_H      40
#define MSG_MARGIN     16
#define MSG_GAP        12
#define MSG_STATIC_ID  200

/* Per-message-box context, reached from _BWCCMsgBoxProc via DWLP_USER. */
typedef struct
{
    int iconId;        /* RT_BITMAP id of the icon, or 0 for none */
    int nButtons;
    int btnId[3];      /* control ids of the buttons, left to right */
} MSGCTX;

/* ---- in-memory template builder ------------------------------------- */

typedef struct { BYTE *b; size_t cap; size_t len; } MBUF;

static void mb_put(MBUF *m, const void *p, size_t n)
{
    if (m->len + n > m->cap)
    {
        size_t nc = (m->cap != 0) ? m->cap : 256;
        while (nc < m->len + n)
            nc *= 2;
        m->b = (BYTE *)realloc(m->b, nc);
        m->cap = nc;
    }
    memcpy(m->b + m->len, p, n);
    m->len += n;
}

static void mb_w(MBUF *m, WORD w)            { mb_put(m, &w, 2); }
static void mb_dw(MBUF *m, DWORD d)          { mb_put(m, &d, 4); }

static void mb_align(MBUF *m)
{
    WORD z = 0;
    while ((m->len & 3) != 0)
        mb_put(m, &z, 1);
}

static void mb_str(MBUF *m, const char *s)
{
    while (*s != '\0')
        mb_w(m, (WORD)(BYTE)*s++);
    mb_w(m, 0);
}

/* Appends one DLGITEMTEMPLATE: a control of class cls with id and caption. */
static void mb_item(MBUF *m, DWORD style, const char *cls, WORD id,
                     const char *caption)
{
    mb_align(m);
    mb_dw(m, style);
    mb_dw(m, 0);                              /* dwExtendedStyle */
    mb_w(m, 0); mb_w(m, 0); mb_w(m, 0); mb_w(m, 0);  /* x,y,cx,cy set later */
    mb_w(m, id);
    mb_str(m, cls);
    mb_str(m, caption);
    mb_w(m, 0);                               /* no creation data */
}

/* ---- icon + button mapping ------------------------------------------ */

static int IconForType(UINT uType)
{
    switch (uType & 0xF0)
    {
    case MB_ICONHAND:        return 1901;     /* also STOP / ERROR */
    case MB_ICONQUESTION:    return 1902;
    case MB_ICONEXCLAMATION: return 1903;     /* also WARNING */
    case MB_ICONASTERISK:    return 1904;     /* also INFORMATION */
    default:                 return 0;
    }
}

static void ButtonsForType(UINT uType, MSGCTX *ctx)
{
    switch (uType & 0x0F)
    {
    case MB_OKCANCEL:
        ctx->nButtons = 2; ctx->btnId[0] = IDOK; ctx->btnId[1] = IDCANCEL;
        break;
    case MB_ABORTRETRYIGNORE:
        ctx->nButtons = 3; ctx->btnId[0] = IDABORT; ctx->btnId[1] = IDRETRY;
        ctx->btnId[2] = IDIGNORE;
        break;
    case MB_YESNOCANCEL:
        ctx->nButtons = 3; ctx->btnId[0] = IDYES; ctx->btnId[1] = IDNO;
        ctx->btnId[2] = IDCANCEL;
        break;
    case MB_YESNO:
        ctx->nButtons = 2; ctx->btnId[0] = IDYES; ctx->btnId[1] = IDNO;
        break;
    case MB_RETRYCANCEL:
        ctx->nButtons = 2; ctx->btnId[0] = IDRETRY; ctx->btnId[1] = IDCANCEL;
        break;
    case MB_OK:
    default:
        ctx->nButtons = 1; ctx->btnId[0] = IDOK;
        break;
    }
}

/* ---- layout + dialog procedure -------------------------------------- */

/* Lays the message box out in pixels and centres it on its owner. */
static void MsgLayout(HWND hDlg, MSGCTX *ctx)
{
    HWND  hStatic = GetDlgItem(hDlg, MSG_STATIC_ID);
    HDC   hdc;
    HFONT hFont;
    RECT  rcText;
    char  text[1024];
    int   iconW, textX, textW, contentH, totalW, totalH, i;
    int   btnRowW, btnX, btnY;
    RECT  rcDlg, rcParent;
    HWND  hParent;

    iconW = (ctx->iconId != 0) ? MSG_ICON_W : 0;

    GetWindowTextA(hStatic, text, sizeof(text));
    hdc = GetDC(hDlg);
    hFont = (HFONT)SendMessage(hDlg, WM_GETFONT, 0, 0);
    if (hFont != NULL)
        SelectObject(hdc, hFont);
    rcText.left = 0; rcText.top = 0; rcText.right = 360; rcText.bottom = 0;
    DrawTextA(hdc, text, -1, &rcText, DT_CALCRECT | DT_LEFT | DT_WORDBREAK);
    ReleaseDC(hDlg, hdc);
    textW = rcText.right - rcText.left;

    textX    = MSG_MARGIN + iconW + (iconW != 0 ? MSG_GAP : 0);
    contentH = rcText.bottom - rcText.top;
    if (ctx->iconId != 0 && contentH < MSG_ICON_H)
        contentH = MSG_ICON_H;

    btnRowW = ctx->nButtons * MSG_BTN_W + (ctx->nButtons - 1) * MSG_GAP;
    totalW  = textX + textW + MSG_MARGIN;
    if (totalW < MSG_MARGIN + btnRowW + MSG_MARGIN)
        totalW = MSG_MARGIN + btnRowW + MSG_MARGIN;
    totalH = MSG_MARGIN + contentH + MSG_GAP + MSG_BTN_H + MSG_MARGIN;

    MoveWindow(hStatic, textX, MSG_MARGIN, textW,
               rcText.bottom - rcText.top, TRUE);

    btnY = MSG_MARGIN + contentH + MSG_GAP;
    btnX = (totalW - btnRowW) / 2;
    for (i = 0; i < ctx->nButtons; i++)
    {
        HWND hBtn = GetDlgItem(hDlg, (int)(WORD)ctx->btnId[i]);
        if (hBtn != NULL)
            MoveWindow(hBtn, btnX, btnY, MSG_BTN_W, MSG_BTN_H, TRUE);
        btnX += MSG_BTN_W + MSG_GAP;
    }

    /* size the dialog to the computed client area, then centre it */
    rcDlg.left = 0; rcDlg.top = 0; rcDlg.right = totalW; rcDlg.bottom = totalH;
    AdjustWindowRect(&rcDlg, (DWORD)GetWindowLongPtr(hDlg, GWL_STYLE), FALSE);
    totalW = rcDlg.right - rcDlg.left;
    totalH = rcDlg.bottom - rcDlg.top;

    hParent = GetWindow(hDlg, GW_OWNER);
    if (hParent != NULL && IsWindowVisible(hParent))
        GetWindowRect(hParent, &rcParent);
    else
        SystemParametersInfo(SPI_GETWORKAREA, 0, &rcParent, 0);
    MoveWindow(hDlg,
               rcParent.left + (rcParent.right - rcParent.left - totalW) / 2,
               rcParent.top + (rcParent.bottom - rcParent.top - totalH) / 2,
               totalW, totalH, TRUE);
}

INT_PTR CALLBACK _BWCCMsgBoxProc(HWND hDlg, UINT msg, WPARAM wParam,
                                 LPARAM lParam)
{
    MSGCTX *ctx;

    switch (msg)
    {
    case WM_INITDIALOG:
        SetWindowLongPtr(hDlg, DWLP_USER, (LONG_PTR)lParam);
        MsgLayout(hDlg, (MSGCTX *)lParam);
        return TRUE;

    case WM_PAINT:
        ctx = (MSGCTX *)GetWindowLongPtr(hDlg, DWLP_USER);
        if (ctx != NULL && ctx->iconId != 0)
        {
            PAINTSTRUCT ps;
            HDC     hdc = BeginPaint(hDlg, &ps);
            HBITMAP hbm = bwcc_LoadBmp(ctx->iconId);
            if (hbm != NULL)
            {
                HDC     mem = CreateCompatibleDC(hdc);
                HBITMAP old = (HBITMAP)SelectObject(mem, hbm);
                BitBlt(hdc, MSG_MARGIN, MSG_MARGIN, MSG_ICON_W, MSG_ICON_H,
                       mem, 0, 0, SRCCOPY);
                SelectObject(mem, old);
                DeleteDC(mem);
            }
            EndPaint(hDlg, &ps);
            return TRUE;
        }
        return FALSE;

    case WM_COMMAND:
        EndDialog(hDlg, (INT_PTR)(WORD)LOWORD(wParam));
        return TRUE;

    case WM_CLOSE:
        EndDialog(hDlg, IDCANCEL);
        return TRUE;

    default:
        return FALSE;
    }
}

/* ---- BWCCMessageBox -------------------------------------------------- */

int WINAPI BWCCMessageBox(HWND hParent, LPCSTR lpText, LPCSTR lpCaption,
                          UINT uType)
{
    MSGCTX  ctx;
    MBUF    m;
    INT_PTR result;
    int     i;

    ctx.iconId = IconForType(uType);
    ButtonsForType(uType, &ctx);

    /* build the in-memory BorDlg template */
    m.b = NULL; m.cap = 0; m.len = 0;
    mb_dw(&m, DS_MODALFRAME | DS_SETFONT | WS_POPUP | WS_CAPTION | WS_SYSMENU);
    mb_dw(&m, 0);                                       /* dwExtendedStyle */
    mb_w(&m, (WORD)(1 + ctx.nButtons));                 /* cdit */
    mb_w(&m, 0); mb_w(&m, 0); mb_w(&m, 200); mb_w(&m, 120); /* x,y,cx,cy */
    mb_w(&m, 0);                                        /* menu: none */
    mb_str(&m, "BorDlg");                               /* class */
    mb_str(&m, (lpCaption != NULL) ? lpCaption : "");   /* title */
    mb_w(&m, 8);                                        /* font point size */
    mb_str(&m, "MS Sans Serif");                        /* typeface */

    mb_item(&m, WS_CHILD | WS_VISIBLE | SS_LEFT,
            "BorStatic", MSG_STATIC_ID,
            (lpText != NULL) ? lpText : "");
    for (i = 0; i < ctx.nButtons; i++)
        mb_item(&m, WS_CHILD | WS_VISIBLE | WS_TABSTOP,
                "BorBtn", (WORD)ctx.btnId[i], "");

    result = DialogBoxIndirectParamA(g_hInstDll, (LPCDLGTEMPLATEA)m.b,
                                     hParent, _BWCCMsgBoxProc, (LPARAM)&ctx);
    free(m.b);
    return (int)result;
}
```

- [ ] **Step 2: Build, verify exports**

`cmd /c "cd /d C:\fwteam\dll\bwcc64 & C:\fwteam\dll\bwcc64\build_bwcc64.bat"` — expect `done!`.
`powershell -ExecutionPolicy Bypass -File C:\fwteam\dll\bwcc64\verify_exports.ps1` — expect `EXPORT PARITY: MATCH`.

- [ ] **Step 3: Commit**

```
git add dll/bwcc64/bwccmsg.c
git commit -m "Implement BWCC message box with BWCC icons and BorBtn buttons"
```

---

## Task 3: Message box visual test

**Files:**
- Create: `dll/bwcc64/test/bwccmsgtest.c`
- Modify: `dll/bwcc64/test/build_test.bat`

- [ ] **Step 1: Write `dll/bwcc64/test/bwccmsgtest.c`**

```c
/* bwccmsgtest.c - visual test for BWCCMessageBox. Loads bwcc64.dll, registers
   the BWCC classes, shows one message box, captures it to bwccmsg_shot.bmp,
   and exits. The capture is driven by a WH_CBT hook that fires when the
   message box window is created. */
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <stdlib.h>

typedef BOOL (WINAPI *BWCCREGFN)(HINSTANCE);
typedef int  (WINAPI *BWCCMSGFN)(HWND, LPCSTR, LPCSTR, UINT);

static HHOOK g_hook;

static void SaveShot(HWND hWnd, const char *path)
{
    RECT rc;
    int  w, h, rowsz, imgsz;
    HDC  hdcWin, hdcMem;
    HBITMAP hbm, hbmOld;
    BITMAPINFOHEADER bi;
    BITMAPFILEHEADER bf;
    unsigned char *bits;
    FILE *f;

    GetWindowRect(hWnd, &rc);
    w = rc.right - rc.left;
    h = rc.bottom - rc.top;
    hdcWin = GetDC(hWnd);
    hdcMem = CreateCompatibleDC(hdcWin);
    hbm    = CreateCompatibleBitmap(hdcWin, w, h);
    hbmOld = (HBITMAP)SelectObject(hdcMem, hbm);
    PrintWindow(hWnd, hdcMem, 0);
    SelectObject(hdcMem, hbmOld);

    ZeroMemory(&bi, sizeof(bi));
    bi.biSize = sizeof(bi); bi.biWidth = w; bi.biHeight = h;
    bi.biPlanes = 1; bi.biBitCount = 24; bi.biCompression = BI_RGB;
    rowsz = (w * 3 + 3) & ~3;
    imgsz = rowsz * h;
    bits = (unsigned char *)malloc(imgsz);
    GetDIBits(hdcMem, hbm, 0, h, bits, (BITMAPINFO *)&bi, DIB_RGB_COLORS);

    ZeroMemory(&bf, sizeof(bf));
    bf.bfType = 0x4D42; bf.bfOffBits = 14 + 40;
    bf.bfSize = bf.bfOffBits + imgsz;
    f = fopen(path, "wb");
    if (f != NULL)
    {
        fwrite(&bf, 14, 1, f);
        fwrite(&bi, 40, 1, f);
        fwrite(bits, imgsz, 1, f);
        fclose(f);
    }
    free(bits);
    DeleteObject(hbm);
    DeleteDC(hdcMem);
    ReleaseDC(hWnd, hdcWin);
}

/* Fires on window activation; captures the message box then closes it. */
static LRESULT CALLBACK CbtProc(int code, WPARAM wParam, LPARAM lParam)
{
    if (code == HCBT_ACTIVATE)
    {
        HWND hMsg = (HWND)wParam;
        Sleep(250);                       /* let the controls paint */
        SaveShot(hMsg, "bwccmsg_shot.bmp");
        PostMessage(hMsg, WM_COMMAND, IDOK, 0);
    }
    return CallNextHookEx(g_hook, code, wParam, lParam);
}

int WINAPI WinMain(HINSTANCE hInst, HINSTANCE hPrev, LPSTR lpCmd, int nShow)
{
    HMODULE   hLib;
    BWCCREGFN pRegister;
    BWCCMSGFN pMsgBox;

    (void)hPrev; (void)lpCmd; (void)nShow;

    hLib = LoadLibraryA("bwcc64.dll");
    if (hLib == NULL)
        return 1;
    pRegister = (BWCCREGFN)GetProcAddress(hLib, "BWCCRegister");
    pMsgBox   = (BWCCMSGFN)GetProcAddress(hLib, "BWCCMessageBox");
    if (pRegister == NULL || pMsgBox == NULL)
        return 1;
    pRegister(hLib);

    g_hook = SetWindowsHookExA(WH_CBT, CbtProc, NULL, GetCurrentThreadId());
    pMsgBox(NULL, "The 64-bit BWCC message box is working.\n"
                  "Icons and buttons use the BWCC controls.",
            "BWCC 64 MessageBox", MB_OKCANCEL | MB_ICONEXCLAMATION);
    if (g_hook != NULL)
        UnhookWindowsHookEx(g_hook);

    FreeLibrary(hLib);
    return 0;
}
```

- [ ] **Step 2: Append a `bwccmsgtest` build line to `build_test.bat`**

`build_test.bat` currently builds `bwcctest.c`. After its `cl ... bwcctest.c ...`
line and the following `if errorlevel` check, add a second compile:

```bat
cl /nologo /W3 /D_CRT_SECURE_NO_WARNINGS bwccmsgtest.c /Fe:bwccmsgtest.exe ^
   user32.lib gdi32.lib /link /SUBSYSTEM:WINDOWS
if errorlevel 1 ( echo msgtest build failed & exit /b 1 )
```
Place these two lines immediately before the existing `del *.obj 2>nul` line so
both test executables are built and both `.obj` files are cleaned.

- [ ] **Step 3: Build and run the message-box test**

Run from `C:\fwteam\dll\bwcc64\test`:
```
cmd /c "cd /d C:\fwteam\dll\bwcc64\test & C:\fwteam\dll\bwcc64\test\build_test.bat"
```
Then run `bwccmsgtest.exe`. It shows the message box, captures
`bwccmsg_shot.bmp`, and exits within ~1s. Confirm `bwccmsg_shot.bmp` exists and
is non-empty. Leave it in place for inspection.

- [ ] **Step 4: Commit**

```
git add dll/bwcc64/test/bwccmsgtest.c dll/bwcc64/test/build_test.bat
git commit -m "Add BWCC message box visual test"
```
Do NOT commit `bwccmsgtest.exe`, the copied `bwcc64.dll`, `bwccmsg_shot.bmp`,
`bwcctest_shot.bmp`, or any `.obj`.

---

## Task 4: Rebuild and commit the DLL

**Files:**
- Modify: `dll/bwcc64.dll`

- [ ] **Step 1: Rebuild and verify**

`cmd /c "cd /d C:\fwteam\dll\bwcc64 & C:\fwteam\dll\bwcc64\build_bwcc64.bat"` — expect `done!`.
`powershell -ExecutionPolicy Bypass -File C:\fwteam\dll\bwcc64\verify_exports.ps1` — expect `EXPORT PARITY: MATCH`.
PE check:
```powershell
$b=[IO.File]::ReadAllBytes('C:\fwteam\dll\bwcc64.dll'); $pe=[BitConverter]::ToInt32($b,0x3C)
'machine=0x{0:X4} magic=0x{1:X4}' -f [BitConverter]::ToUInt16($b,$pe+4),[BitConverter]::ToUInt16($b,$pe+24)
```
Expected: `machine=0x8664 magic=0x020B`.

- [ ] **Step 2: Commit the rebuilt binary**

```
git add dll/bwcc64.dll
git commit -m "Rebuild bwcc64.dll with dialog mangling and message box"
```
Stage only `dll/bwcc64.dll`. Do not commit build intermediates.

---

## Self-Review

- **Spec coverage:** the spec's "Dialog subsystem" lists `MangleDialog`
  (rewrites control classes — Task 1), `CreateDialogParamA` / `DialogBoxParamA`
  / `SpecialLoadDialog` (wrap Win32 through `MangleDialog` — Task 1), and the
  two special procs (Task 1). "Message box" — `BWCCMessageBox` and
  `_BWCCMsgBoxProc` (Task 2). The gray default procs from Plan 3 are preserved
  verbatim in the `bwccdlg.c` rewrite.
- **Placeholder scan:** none — every file is shown complete or with exact edits.
- **Type consistency:** `BorDlgProc` and `BWCCGetPattern` are reached through
  `bwccdlg.h` / `bwcc.h`. `bwcc_LoadBmp` comes from `bwccpaint.h`. `g_hInstDll`
  from `bwcc.h`. `MSGCTX` is defined and used only within `bwccmsg.c`. Button
  control ids reuse `IDOK..IDNO`/`IDHELP`, which `bwcc_PredefUnit` (Plan 2)
  already maps so the message-box `BorBtn` buttons show the BWCC bitmaps.
- **Lifetime:** `MangleDialog` returns a `malloc`'d buffer; both wrappers free
  it after the `*IndirectParam` call (which copies the template). `SpecialLoadDialog`
  hands ownership to its caller. `BWCCMessageBox` frees its own `MBUF`.
- **Known limitation:** `MangleDialog` handles the classic `DLGTEMPLATE` only;
  a `DLGTEMPLATEEX` template is returned unchanged. Legacy BWCC `.rc` use plain
  `DIALOG` (classic), so this covers the real cases; documented in the function
  comment and the Background section.
- **Window-word check:** the message box dialog is the `BorDlg` class
  (`cbWndExtra = DLGWINDOWEXTRA`); `_BWCCMsgBoxProc` stores its context in
  `DWLP_USER`, which lies inside `DLGWINDOWEXTRA` — no conflict with the control
  classes' state word.
