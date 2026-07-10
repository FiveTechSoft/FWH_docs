# Funciones de la API del Shell de Windows

**Archivo Fuente:** [source/winapi/shellapi.prg](..\source\winapi\shellapi.prg)

## 1. Propósito y Alcance

Este archivo proporciona un conjunto de funciones que envuelven partes de la API del Shell de Windows y otras utilidades del sistema. La funcionalidad principal se centra en la gestión de iconos en el área de notificación de la barra de tareas (comúnmente conocida como la "bandeja del sistema" o "system tray").

También se incluyen declaraciones directas de funciones de la API de Windows para la copia de archivos y la salida de depuración.

## 2. Funciones de Gestión de la Barra de Tareas

Estas funciones permiten añadir, modificar y eliminar un icono de la aplicación en la barra de tareas.

### `TaskAddIcon(oWnd, oIcon, cToolTip)`

*   **Propósito:** Añade un icono al área de notificación de la barra de tareas.
*   **Parámetros:**
    *   `oWnd` (OBJECT): El objeto ventana que recibirá los mensajes de notificación del icono (por ejemplo, clics del ratón). Debe definir un método para manejar el mensaje `WM_TASKBAR`.
    *   `oIcon` (OBJECT): Un objeto `TIcon` que contiene el icono a mostrar.
    *   `cToolTip` (CHARACTER): El texto que aparecerá como "tooltip" cuando el usuario pase el ratón sobre el icono.
*   **Retorno:** `OBJECT` - Un objeto de estructura (`oNotifyIconData`) que contiene los datos de la notificación. **Es crucial guardar este objeto**, ya que es necesario para eliminar o modificar el icono posteriormente.

**Ejemplo:**

```harbour
#include "FiveWin.ch"

FUNCTION Main()
   LOCAL oWnd, oIcon, oNotifyData

   DEFINE WINDOW oWnd TITLE "Mi App"
   DEFINE ICON oIcon RESOURCE "MAINICON"

   // Añadir el icono a la barra de tareas
   oNotifyData := TaskAddIcon(oWnd, oIcon, "Mi Aplicación v1.0")

   // El método OnTaskbar se llamará cuando haya eventos en el icono
   oWnd:OnTaskbar = { |nMsg| IF(nMsg == WM_LBUTTONDOWN, MsgInfo("Clic!"), NIL) }

   ACTIVATE WINDOW oWnd ON END ( TaskDelIcon(oNotifyData), oIcon:End() ) // Limpiar al salir

RETURN NIL
```

---

### `TaskDelIcon(oNotifyIconData)`

*   **Propósito:** Elimina un icono del área de notificación que fue añadido previamente.
*   **Parámetros:**
    *   `oNotifyIconData` (OBJECT): El objeto de estructura que fue devuelto por `TaskAddIcon()`.
*   **Retorno:** `NIL`.

---

### `TaskChangeIcon(oNotifyIconData, oNewIcon)`

*   **Propósito:** Cambia el icono de una notificación existente en la barra de tareas.
*   **Parámetros:**
    *   `oNotifyIconData` (OBJECT): El objeto de estructura devuelto por `TaskAddIcon()`.
    *   `oNewIcon` (OBJECT): El nuevo objeto `TIcon` a mostrar.
*   **Retorno:** `OBJECT` - El objeto de estructura actualizado.

## 3. Otras Funciones de la API

Este archivo también declara las siguientes funciones de la API de Windows para su uso directo desde Harbour.

### `CopyFile(cArchivoExistente, cNuevoArchivo, lFallarSiExiste)`

*   **Propósito:** Envuelve la función `CopyFileA` de la API de Windows. Copia un archivo.
*   **Parámetros:**
    *   `cArchivoExistente` (LPSTR): Ruta del archivo a copiar.
    *   `cNuevoArchivo` (LPSTR): Ruta del archivo de destino.
    *   `lFallarSiExiste` (BOOL): Si es `.T.`, la función fallará si el archivo de destino ya existe. Si es `.F.`, lo sobrescribirá.
*   **Retorno:** `BOOL` - `.T.` si la operación tuvo éxito, `.F.` en caso contrario.

---

### `OutputDebugString(cCadena)`

*   **Propósito:** Envuelve la función `OutputDebugStringA`. Envía una cadena de texto al depurador. Si la aplicación no está siendo depurada, la función no hace nada. Es muy útil para trazas de depuración sin usar cuadros de mensaje.
*   **Parámetros:**
    *   `cCadena` (LPSTR): El texto a enviar.
*   **Retorno:** `VOID`.

---

### `TrackMouseEvent(hWnd, nFlags)`

*   **Propósito:** Envuelve la función `_TrackMouseEvent`. Permite que una ventana reciba un mensaje (`WM_MOUSELEAVE`) cuando el cursor del ratón sale de su área de cliente.
*   **Parámetros:**
    *   `hWnd` (NUMERIC): El handle de la ventana a monitorizar.
    *   `nFlags` (NUMERIC): Flags que especifican el comportamiento. El más común es `TME_LEAVE`.
*   **Retorno:** `BOOL`.
