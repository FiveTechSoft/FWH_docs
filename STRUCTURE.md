# FWH Documentation Structure

The FWH documentation is delivered as localized HTML under `en/`, `es/` and `pt/`.
`index.html` redirects to `en/getting-started/overview.html`. This document maps
the structure (the three languages share the same layout).

## Root of `docs/`

* `index.html` – entry point (redirect)
* `README.md`, `STRUCTURE.md`, `MIGRATION.md`, `STATUS.md`, `TEMPLATE.md`
* `check_links.bat`
* `css/`, `js/` – assets for the HTML pages
* `archive/` – historical / superseded markdown docs

## Per-language tree (`en/`, `es/`, `pt/`)

```
getting-started/
  overview.html, installation.html, build-system.html, samples-guide.html,
  examples.html, tglossary.html, tlocalization.html,
  whatsnew.html, whatsnew-26.06.html
core/        TWindow, TDialog, TControl, TMDI*, TObjFile, TSymTable, TInier
ui/          All controls (TButton, TGet, TListBox, xBrowse, Ribbon, ...)
advanced/    dll.html, unicode.html, advanced-diagrams.md
ai/          agent, agenticai, gpt2model, hftokenizer, mcp-server,
             tai_glossary, tfwlanguagemodel, thftask, tsemanticindex,
             ttransformer, tensorlogic, tensorlogic-tutorial,
             pytorch-lite-roadmap (HTML)
reference/
  index.md, classes.html, functions.html, modules/
  classes/   – one page per class
  functions/ – one page per function group
  modules/   – module overviews
data/ internet/ printing/ utilities/ – topic areas
```

## Notes

* The HTML trees under `en/`, `es/` and `pt/` are the **single source of truth**.
* An earlier effort kept an incomplete markdown mirror at the docs root
  (`classes/`, `modules/`, `tutorials/`, plus `index.md`/`architecture.md`/
  `installation.md` and other standalone `.md` files). Those files have been
  moved to `archive/`; they are kept for historical reference only and are no
  longer the maintained documentation.
* `index.html` must remain at the docs root and redirect to
  `en/getting-started/overview.html`.
