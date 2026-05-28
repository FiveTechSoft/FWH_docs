# FiveWin Documentation Structure

This document outlines the complete structure of the FiveWin documentation.

## Root Level

* `index.md` - Main documentation entry point
* `architecture.md` - High-level architecture overview
* `installation.md` - Installation guide
* `README.md` - Documentation directory README
* `TEMPLATE.md` - Standard documentation template
* `MIGRATION.md` - Guide for migrating Spanish docs to English
* `standardize_lang.bat` - Script to help with language standardization

## Modules Directory

* `modules/`
  * `classes.md` - Overview of the classes module
  * `functions.md` - Overview of the functions module
  * `winapi.md` - Overview of Windows API wrappers

## Reference Directory

* `reference/`
  * `index.md` - Reference section entry point
  * `classes/`
    * `index.md` - Class reference overview
    * `TButton.md` - Button control documentation
    * `TControl.md` - Base control documentation
    * `TDialog.md` - Dialog documentation
    * *(Additional class documentation to be added)*
  * `functions/`
    * `index.md` - Function reference overview
    * `alerts.md` - Alert and message functions
    * `database.md` - Database functions
    * *(Additional function documentation to be added)*
  * `winapi/`
    * `index.md` - Windows API wrappers overview
    * *(Windows API wrapper documentation to be added)*

## Tutorials Directory

* `tutorials/`
  * `index.md` - Tutorials section entry point
  * `getting-started.md` - Getting started tutorial
  * *(Additional tutorials to be added)*

## Original Directories (to be reorganized)

* `classes/` - Original class documentation (to be moved to reference/classes/)
* `functions/` - Original function documentation (to be moved to reference/functions/)
* *(Other directories to be reorganized as needed)*

## File Migration Process

1. Move files from original directories to their proper locations in the reference structure
2. Translate Spanish content to English
3. Standardize formatting using the TEMPLATE.md
4. Update internal links to reflect new locations
5. Delete original files after successful migration