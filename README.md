# FiveWin (FWH) Documentation

This directory contains the documentation for **FiveWin for Harbour/xHarbour (FWH)**.

## Current version

FWH **26.06**. The HTML documentation under `en/`, `es/` and `pt/` is the
published, maintained form.

## How to read the docs

Open **`index.html`** at the root of this folder. It redirects to the
localized documentation:

* English — `en/getting-started/overview.html`
* Español — `es/getting-started/overview.html`
* Português — `pt/getting-started/overview.html`

## Documentation structure

The docs are organized by language and, inside each language, by topic:

| Folder | Contents |
|--------|----------|
| `getting-started/` | Overview, installation, build system, samples, what's new |
| `core/` | Base classes: `TWindow`, `TDialog`, `TControl`, MDI, etc. |
| `ui/` | All visual controls and components |
| `advanced/` | Advanced topics (DLLs, Unicode, diagrams) |
| `ai/` | AI classes: `TAgent`, `TTransformer`/`GPT2Model`, `THFTokenizer`, `TSemanticIndex`, `TWhisperCpp`, ... |
| `reference/` | Full class and function reference (`classes/`, `functions/`, `modules/`) |
| `data/`, `internet/`, `printing/`, `utilities/` | Additional topic areas |

The same tree exists under `en/`, `es/` and `pt/`.

## Adding or updating documentation

1. Author the page using [`TEMPLATE.md`](TEMPLATE.md).
2. Add it to **all three** languages (`en/`, `es/`, `pt/`) — see [`MIGRATION.md`](MIGRATION.md).
3. Keep navigation/landing pages in sync across languages.
4. Run [`check_links.bat`](check_links.bat) to verify internal links.

## Maintenance files

* `STRUCTURE.md` – detailed map of the documentation.
* `STATUS.md` – current state and pending work.
* `check_links.bat` – link checker.
* `archive/` – historical markdown docs superseded by the localized HTML set.

## Build notes (FWH libraries & samples)

See the project root: `mfwh_new.bat <variant>` builds the FWH libraries;
`samples\build_new.bat <prog> <variant>` builds a sample. Variants:
`hb32 hm32 hm64 hg32 hg64 hb64 xb32 xb64 xm64`.
