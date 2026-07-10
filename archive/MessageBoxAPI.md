# Funciones de Cuadro de Mensaje (WinAPI)

**Archivo Fuente:** [source/winapi/msgbox.c](..\source\winapi\msgbox.c)

## 1. Propósito y Alcance

El archivo `msgbox.c` proporciona un conjunto de funciones que envuelven la API `MessageBox` de Windows. Estas funciones permiten mostrar de forma sencilla cuadros de diálogo modales con mensajes para el usuario, desde simples notificaciones hasta preguntas de sí/no.

El objetivo es ofrecer una interfaz simple y directa desde el código Harbour para una de las formas más comunes de interacción con el usuario en aplicaciones de escritorio.

## 2. Funciones

### `MSGALERT(cTexto, [cTitulo])`

*   **Propósito:** Muestra un cuadro de mensaje con un icono de exclamación (alerta).
*   **Parámetros:**
    *   `cTexto` (CHARACTER): El mensaje principal a mostrar.
    *   `cTitulo` (CHARACTER, Opcional): El título de la ventana. Por defecto es "Attention".
*   **Retorno:** `NUMERIC` - El ID del botón presionado (ej. `IDOK`).

**Ejemplo:**
```harbour
MSGALERT("El campo no puede estar vacío.")
```

---

### `MSGINFO(cTexto, [cTitulo])`

*   **Propósito:** Muestra un cuadro de mensaje con un icono de información (letra 'i').
*   **Parámetros:**
    *   `cTexto` (CHARACTER): El mensaje principal a mostrar.
    *   `cTitulo` (CHARACTER, Opcional): El título de la ventana. Por defecto es "Information".
*   **Retorno:** `NUMERIC` - El ID del botón presionado (`IDOK`).

**Ejemplo:**
```harbour
MSGINFO("El proceso ha finalizado correctamente.")
```

---

### `MSGSTOP(cTexto, [cTitulo])`

*   **Propósito:** Muestra un cuadro de mensaje con un icono de error/parada (círculo rojo con una 'X').
*   **Parámetros:**
    *   `cTexto` (CHARACTER): El mensaje de error a mostrar.
    *   `cTitulo` (CHARACTER, Opcional): El título de la ventana. Por defecto es "Stop!".
*   **Retorno:** `NUMERIC` - El ID del botón presionado (`IDOK`).

**Ejemplo:**
```harbour
MSGSTOP("No se pudo conectar a la base de datos.")
```

---

### `MSGYESNO(cTexto, [cTitulo])`

*   **Propósito:** Muestra un cuadro de pregunta con botones "Sí" y "No" y un icono de interrogación.
*   **Parámetros:**
    *   `cTexto` (CHARACTER): La pregunta a mostrar.
    *   `cTitulo` (CHARACTER, Opcional): El título de la ventana. Por defecto es "Select an option".
*   **Retorno:** `LOGICAL` - Devuelve `.T.` si el usuario presiona "Sí", y `.F.` si presiona "No".

**Ejemplo:**
```harbour
IF MSGYESNO("¿Desea guardar los cambios?")
   // ... guardar los cambios ...
ENDIF
```

---

### `MSGNOYES(cTexto, [cTitulo])`

*   **Propósito:** Idéntico a `MSGYESNO`, pero el botón "No" está seleccionado por defecto.
*   **Parámetros:** Los mismos que `MSGYESNO`.
*   **Retorno:** `LOGICAL` - Devuelve `.T.` si el usuario presiona "Sí", y `.F.` si presiona "No".

---

### `MSGRETRYCANCEL(cTexto, [cTitulo])`

*   **Propósito:** Muestra un cuadro de pregunta con botones "Reintentar" y "Cancelar".
*   **Parámetros:**
    *   `cTexto` (CHARACTER): La pregunta a mostrar.
    *   `cTitulo` (CHARACTER, Opcional): El título de la ventana. Por defecto es "Select an option".
*   **Retorno:** `LOGICAL` - Devuelve `.T.` si el usuario presiona "Reintentar", y `.F.` si presiona "Cancelar".

---

### `MESSAGEBOX(hWnd, cTexto, cTitulo, nEstilo)`

*   **Propósito:** Es un envoltorio directo de la función `MessageBox()` de la API de Windows, ofreciendo control total sobre su comportamiento.
*   **Parámetros:**
    *   `hWnd` (NUMERIC): El handle de la ventana padre.
    *   `cTexto` (CHARACTER): El mensaje a mostrar.
    *   `cTitulo` (CHARACTER): El título de la ventana.
    *   `nEstilo` (NUMERIC): Una combinación de flags de estilo de `MessageBox` (ej. `MB_OKCANCEL | MB_ICONQUESTION`).
*   **Retorno:** `NUMERIC` - El ID del botón que el usuario presionó (ej. `IDOK`, `IDCANCEL`, `IDYES`, `IDNO`).

**Ejemplo:**
```harbour
#include "Constant.ch" // Necesario para los flags MB_ y los IDs de retorno

nBoton := MESSAGEBOX(GetActiveWindow(), "Elige una opción", "Título", MB_YESNOCANCEL | MB_ICONQUESTION)

DO CASE
   CASE nBoton == IDYES
      // ...
   CASE nBoton == IDNO
      // ...
   CASE nBoton == IDCANCEL
      // ...
ENDCASE
```
