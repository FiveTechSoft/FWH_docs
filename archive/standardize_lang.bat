@echo off
echo FiveWin Documentation Language Standardization Helper
echo ====================================================

echo.
echo Spanish files that need to be translated:
dir /b "..\docs\*.md" | findstr /i "TButton TDialog TControl TWindow TEdit TListBox TComboBox TRadio TCheckBox"

echo.
echo Suggested translation commands:
echo.
echo move "..\docs\TButton.md" "..\docs\reference\classes\TButton.md"
echo move "..\docs\TDialog.md" "..\docs\reference\classes\TDialog.md"
echo move "..\docs\TControl.md" "..\docs\reference\classes\TControl.md"
echo move "..\docs\TWindow.md" "..\docs\reference\classes\TWindow.md"
echo move "..\docs\TEdit.md" "..\docs\reference\classes\TEdit.md"
echo move "..\docs\TListBox.md" "..\docs\reference\classes\TListBox.md"
echo move "..\docs\TComboBox.md" "..\docs\reference\classes\TComboBox.md"
echo move "..\docs\TRadio.md" "..\docs\reference\classes\TRadio.md"
echo move "..\docs\TCheckBox.md" "..\docs\reference\classes\TCheckBox.md"

echo.
echo After moving the files, translate them using the TEMPLATE.md as a guide.
echo Update any internal links to point to the new locations.