# Funciones de Internacionalización (i18n)

**Archivo Fuente:** [source/function/strings.prg](..\source\function\strings.prg)

## 1. Propósito y Alcance

El archivo `strings.prg` no contiene funciones de manipulación de cadenas de propósito general, sino que implementa un completo **sistema de internacionalización (i18n) y localización (l10n)** para el framework.

El propósito de este sistema es permitir que las aplicaciones desarrolladas con el framework puedan ser traducidas a múltiples idiomas de una manera sencilla y centralizada. La mayoría de los textos visibles para el usuario en los componentes estándar del framework (menús, mensajes de error, botones de diálogo) utilizan este mecanismo.

Las funcionalidades clave incluyen:

*   **Traducción de Cadenas:** Proporciona una función central para obtener la traducción de una cadena de texto al idioma activo.
*   **Gestión de Idiomas:** Permite establecer y consultar el idioma actual de la aplicación.
*   **Almacenamiento Centralizado:** Mantiene un repositorio en memoria de todas las cadenas y sus traducciones.
*   **Extensibilidad:** Permite añadir nuevas cadenas y nuevos idiomas en tiempo de ejecución.
*   **Persistencia:** Las cadenas de traducción se pueden cargar y guardar desde/hacia archivos `.ini`.

## 2. Arquitectura y Conceptos Clave

El sistema se basa en un array estático (`aStrings`) que actúa como un diccionario de traducciones. Cada elemento de este array es otro array que representa una cadena en todos los idiomas soportados, donde el inglés siempre es la clave de búsqueda.

### Estructura del Diccionario `aStrings`

```
// aStrings := { String1, String2, ..., StringN }
// StringX  := { English, Spanish, French, Portuguese, German, Italian }

aStrings := { ;
   { "Attention", "Atención", "Attention", "Atenção", "Achtung", "Attenzione" }, ;
   { "Ok",        "Aceptar",  "OK",       "Confirmar", "Ok",      "Ok" }, ;
   // ... más cadenas
}
```

El flujo de trabajo es simple: el código de la aplicación siempre se escribe usando los textos en inglés. La función `FWString()` se encarga de buscar y devolver la traducción correcta en tiempo de ejecución.

## 3. Funciones Clave

| Función                 | Parámetros                | Descripción                                                                                                                            |
|-------------------------|---------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `FWString(cString)`     | `cString` (Inglés)        | **La función más importante.** Recibe una cadena en inglés, la busca en el diccionario y devuelve la traducción correspondiente al idioma activo. Si no encuentra una traducción, devuelve la cadena original. |
| `FWSetLanguage(nLang)`  | `nLang` (Numérico)        | Establece el idioma activo para la aplicación. El número corresponde a la posición en el array de traducción (1:EN, 2:ES, 3:FR, etc.). |
| `FWLanguageID()`        | `()`                      | Devuelve el código numérico del idioma actualmente activo. Si no se ha establecido, intenta detectarlo a partir del sistema operativo.     |
| `FWAddString(aString)`  | `aString` (Array)         | Añade una nueva cadena de traducción al diccionario en tiempo de ejecución.                                                            |
| `FWSetString(n, a)`     | `nLang`, `aString`        | Modifica o añade una traducción para un idioma específico (`nLang`) de una cadena ya existente o nueva.                                |
| `FWLoadStrings(cFile)`  | `cFile` (Ruta al .ini)    | Carga definiciones de cadenas desde un archivo `.ini`, permitiendo la personalización externa de las traducciones.                   |
| `FWMissingStrings()`    | `()`                      | Devuelve un array con todas las cadenas que se solicitaron con `FWString()` pero que no tenían una entrada en el diccionario. Es muy útil para identificar qué textos faltan por traducir. |

## 4. Patrones de Uso y Ejemplos

### Ejemplo 1: Usar `FWString` para mostrar un mensaje

En lugar de escribir el texto directamente, se envuelve con `FWString()`.

```harbour
// MAL: El texto está "hardcodeado" en español.
MsgInfo("¡Atención!")

// BIEN: El texto se escribirá en el idioma del usuario.
// El código fuente usa inglés como clave.
MsgInfo(FWString("Attention"))
```

### Ejemplo 2: Cambiar el idioma de la aplicación al inicio

Normalmente, en el `Main()` de la aplicación, se establecería el idioma deseado.

```harbour
#include "FiveWin.ch"

FUNCTION Main()
   // Establecer el idioma a Español
   FWSetLanguage(2)

   // A partir de aquí, todas las llamadas a FWString() devolverán textos en español.
   MsgInfo(FWString("Attention")) // Mostrará "Atención"

   // Cambiar a italiano
   FWSetLanguage(6)
   MsgInfo(FWString("Attention")) // Mostrará "Attenzione"

RETURN NIL
```

### Ejemplo 3: Añadir una nueva cadena de traducción

Si tu aplicación necesita sus propias cadenas, puedes añadirlas al diccionario.

```harbour
#include "FiveWin.ch"

FUNCTION Main()
   LOCAL aMiCadena

   // Definir la nueva cadena con sus traducciones
   // { English, Spanish, French, Portuguese, German, Italian }
   aMiCadena := {"My App Title", "El Título de Mi App", "Le Titre de Mon App", ...}

   // Añadirla al diccionario global
   FWAddString(aMiCadena)

   // Ahora ya se puede usar en cualquier parte
   DEFINE WINDOW oWnd TITLE FWString("My App Title")
   // ...
   ACTIVATE WINDOW oWnd

RETURN NIL
```
