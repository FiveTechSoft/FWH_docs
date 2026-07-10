# FWH Documentation — Status

**Version:** FWH 26.06
**Form:** Localized HTML under `en/`, `es/`, `pt/` (entry point: `index.html`).

## Current / up to date

* Getting-started guides (installation, build system, samples, what's new 26.06).
* Core class docs (`TWindow`, `TDialog`, `TControl`, MDI).
* Full UI control reference (`ui/`).
* AI classes: `TAgent`, `TTransformer`/`GPT2Model`, `THFTask`, `TSemanticIndex`,
  `TWhisperCpp`, `TFWLanguageModel`, `HFTokenizer`, plus the PyTorch-lite roadmap.
* Full function & class reference under `reference/`.

## Known gaps

* `en/` is missing the `classes/` topic folder that `es/` and `pt/` have.
* Some `es/`/`pt/` pages may lag behind `en/` (keep in sync per `MIGRATION.md`).

## Maintenance

* `check_links.bat` verifies internal links across the docs.
* New pages use `TEMPLATE.md` and are added to all three languages.
* Historical markdown sources are preserved in `archive/`.

## Restructure notes (2026)

The docs root previously mixed an obsolete markdown mirror (root-level
`classes/`, `modules/`, `tutorials/`, stale `index.md`/`architecture.md`/
`installation.md`, plus standalone topic `.md` files and AI auxiliary material)
with the real localized HTML trees. That markdown layer described a
`reference/`-centric structure that was never built and contained broken links.

The markdown mirror and auxiliary files were moved to `archive/`; the root now
holds only the accurate meta-docs (`README.md`, `STRUCTURE.md`, `MIGRATION.md`,
`STATUS.md`, `TEMPLATE.md`, `check_links.bat`) and the HTML trees. The
`en/`/`es/`/`pt/` HTML set is the single source of truth.
