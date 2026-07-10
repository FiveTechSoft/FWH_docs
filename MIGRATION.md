# Documentation Localization Guide (en / es / pt)

FWH documentation is maintained in **three languages**: English (`en/`),
Spanish (`es/`) and Portuguese (`pt/`). All three trees share the same layout
and must be kept in sync.

## Rules

1. Any new doc page must be added to **all three** languages.
2. Keep file names identical across languages (only the folder prefix differs).
3. Use [`TEMPLATE.md`](TEMPLATE.md) for new pages.
4. Update the per-language landing/index pages together.
5. After editing, run `check_links.bat` to catch broken internal links.

## Translation workflow

1. Author the English (`en/`) page first.
2. Copy it to `es/` and `pt/` and translate, preserving structure and anchors
   so cross-links (`#section`) keep working.
3. Verify links resolve in every language.

## Historical note

An earlier effort translated a set of Spanish markdown files to English and
proposed a `reference/`-centric markdown layout at the docs root. That layout
was superseded by the current localized HTML trees; the old markdown sources
live in `archive/`. The authoritative documentation is now the `en/`/`es/`/`pt/`
HTML set described in `STRUCTURE.md`.
