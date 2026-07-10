# Clase `TWindow` (Compact Edition)

**Archivo Fuente:** [source/ceclasses/window.prg](..\source\ceclasses\window.prg)

## 1. Propósito y Alcance

Esta es la implementación de la clase `TWindow` para la plataforma **Windows CE / PocketPC**. Actúa como la clase base fundamental para todos los objetos visuales (ventanas, diálogos, controles) en este entorno de "Edición Compacta".

Al igual que su contraparte de escritorio, su propósito es encapsular un "handle" de ventana de Windows (`hWnd`) y proporcionar una interfaz orientada a objetos para manipularlo. Sin embargo, esta versión está significativamente simplificada para adaptarse a las limitaciones y características de los sistemas operativos embebidos.

## 2. Arquitectura y Diferencias Clave

La arquitectura es similar a la versión de escritorio: `TWindow` es la base de la que heredan `TControl`, `TDialog`, etc. La diferencia fundamental no está en la jerarquía, sino en la **implementación y las funcionalidades omitidas**.

### Principales Diferencias con la Versión de Escritorio

*   **API Gráfica Simplificada:** Carece de toda la integración con GDI+. Métodos como `DrawImage`, `SayHollow`, `PieChart` y otros de dibujo avanzado no existen.
*   **Gestión de Ventanas Reducida:** Se han eliminado muchas características de gestión de ventanas de escritorio. No hay soporte para estilos de borde complejos, sombras (`Shadow()`), ventanas de herramientas (`ToolWindow()`), etc.
*   **Manejo de Menús Específico de CE:** La gestión de menús es diferente. Utiliza una función específica `CESetMenu()` en lugar del `SetMenu()` estándar, reflejando las diferencias en la API de menús de Windows CE.
*   **Eventos y Mensajes Limitados:** El método `HandleEvent` es más corto y procesa un subconjunto de los mensajes de Windows que maneja la versión de escritorio.
*   **Constructor Simplificado:** El método `New()` tiene muchos menos parámetros, omitiendo opciones como `lSysMenu`, `lMin`, `lMax`, `cBorder`, que no son tan relevantes o no existen en las interfaces de Windows CE.
*   **No hay Soporte para Arrastrar y Soltar (Drag & Drop):** La funcionalidad para `bDropFiles` está ausente.

En resumen, esta clase está optimizada para ser más ligera y funcionar en un entorno con recursos limitados.

## 3. Propiedades Clave

Las propiedades son un subconjunto de la clase `TWindow` de escritorio. Las más importantes son:

| Propiedad   | Tipo      | Descripción                                                                                             |
|-------------|-----------|---------------------------------------------------------------------------------------------------------|
| `hWnd`      | `NUMERIC` | El handle a la ventana de Windows. Es la propiedad más fundamental.                                     |
| `nTop`, `nLeft`, `nBottom`, `nRight` | `NUMERIC` | Las coordenadas de la ventana.                                                                          |
| `cCaption`  | `CHARACTER`| El título de la ventana.                                                                                |
| `oWnd`      | `OBJECT`  | Referencia a la ventana padre (`owner`).                                                                |
| `aControls` | `ARRAY`   | Un array que contiene los objetos de control (`TControl`) definidos dentro de esta ventana.             |
| `bLClicked`, `bKeyDown`, etc. | `CODEBLOCK` | Bloques de código para manejar los eventos de ratón y teclado.                                          |

## 4. Métodos Clave

| Método                  | Descripción                                                                                                                            |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `New(...)`              | **(CONSTRUCTOR)** Crea la instancia de la ventana. Es mucho más simple que la versión de escritorio.                                     |
| `Activate(...)`         | Muestra la ventana e inicia el bucle de mensajes de la aplicación si es la ventana principal.                                          |
| `Create(cClsName)`      | Envuelve la función `CreateWindow` de la API de Windows para crear el elemento visual.                                                 |
| `HandleEvent(...)`      | El despachador de mensajes de Windows para la ventana. Redirige mensajes como `WM_PAINT`, `WM_LBUTTONDOWN`, etc., a los métodos correspondientes. |
| `End()`                 | Inicia el proceso para cerrar y destruir la ventana.                                                                                   |
| `Say(...)`              | Dibuja texto simple en la ventana.                                                                                                     |
| `SetMenu(oMenu)`        | Asocia un menú a la ventana, utilizando la función `CESetMenu()` específica de la plataforma.                                          |
	
## 5. Ejemplo de Uso

El uso es conceptualmente idéntico al de la versión de escritorio, pero con menos opciones disponibles.

```harbour
#include "FiveWin.ch"

// Este código se ejecutaría en un entorno Windows CE / PocketPC

FUNCTION Main()
   LOCAL oWnd, oBtn

   // La definición de la ventana es más simple
   DEFINE WINDOW oWnd TITLE "Ventana en CE"

   // Los controles se añaden de la misma forma
   @ 20, 20 BUTTON oBtn PROMPT "OK" OF oWnd ACTION oWnd:End()

   // La activación inicia el bucle de mensajes
   ACTIVATE WINDOW oWnd

RETURN NIL
```
