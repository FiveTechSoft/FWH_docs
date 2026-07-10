# Clase `TXBrowse`

**Archivo Fuente:** [source/classes/xbrowse.prg](..\..\..\source\classes\xbrowse.prg)

## 1. Propósito y Alcance

`TXBrowse` es un control de visualización de datos en formato tabular (cuadrícula o grilla) extremadamente potente y configurable. Es uno de los componentes más complejos y centrales del framework, diseñado para presentar y manipular grandes conjuntos de datos de diversas fuentes.

Sus capacidades principales incluyen:

*   **Virtualización de Datos:** Está diseñado para manejar millones de registros sin consumir memoria, ya que solo renderiza las filas y columnas visibles.
*   **Abstracción de Fuente de Datos:** Puede conectarse a prácticamente cualquier fuente de datos (tablas DBF, arrays en memoria, recordsets ADO, consultas SQL) a través de un conjunto de bloques de código de navegación.
*   **Columnas Configurables:** Las columnas son objetos (`TXBrwColumn`) que se pueden personalizar extensamente (formato, colores, edición, etc.).
*   **Edición en Celda:** Permite la edición directa de los datos en la grilla.
*   **Alta Personalización Visual:** Ofrece un control granular sobre casi todos los aspectos visuales: colores, líneas, cabeceras, pies de página, etc.
*   **Funcionalidades Avanzadas:** Soporta ordenamiento por columna, búsqueda incremental, selección múltiple, exportación de datos (Excel, CSV, etc.) y mucho más.

## 2. Arquitectura y Conceptos Clave

`TXBrowse` hereda de `TControl`, pero su complejidad reside en su arquitectura interna, que se basa en tres pilares:

1.  **El Navegador (`TXBrowse`):** Es el objeto principal que gestiona la ventana, las barras de scroll, los eventos de teclado y ratón, y orquesta el pintado general.
2.  **Las Columnas (`TXBrwColumn`):** La propiedad `aCols` contiene un array de objetos columna. Cada columna define qué dato mostrar y cómo mostrarlo. La documentación de `TXBrwColumn` es esencial para entender `TXBrowse`.
3.  **La Fuente de Datos (Abstracción):** `TXBrowse` no conoce los detalles de la fuente de datos. Se comunica con ella a través de un conjunto de bloques de código (`bGoTop`, `bGoBottom`, `bSkip`, `bKeyCount`, `bBookMark`). Métodos como `SetRDD()` o `SetArray()` simplemente configuran estos bloques de código con la lógica apropiada para cada tipo de fuente.

### Diagrama Conceptual

```mermaid
graph TD;
    subgraph "Fuente de Datos"
        direction LR
        DBF;
        Array;
        ADO;
    end

    subgraph "TXBrowse"
        direction LR
        A[Navegador<br>(TXBrowse)] -- contiene --> B(Columnas<br>[TXBrwColumn]);
    end

    DBF -- "configura" --> C{Bloques de Navegación<br>bGoTop, bSkip, ...};
    Array -- "configura" --> C;
    ADO -- "configura" --> C;

    C -- "es usado por" --> A;

    style A fill:#f9f,stroke:#333,stroke-width:2px;
```

## 3. Propiedades y Bloques de Código Clave

Debido a la gran cantidad de propiedades, esta sección se centra en las más importantes para la configuración inicial.

### Propiedades de Configuración

| Propiedad         | Tipo      | Descripción                                                                                             |
|-------------------|-----------|---------------------------------------------------------------------------------------------------------|
| `aCols`           | `ARRAY`   | Array de objetos `TXBrwColumn` que definen las columnas de la grilla.                                   |
| `nFreeze`         | `NUMERIC` | Número de columnas a la izquierda que permanecerán fijas (congeladas) durante el scroll horizontal.     |
| `lRecordSelector` | `LOGICAL` | Si es `.T.`, muestra una columna a la izquierda para indicar la fila actual.                            |
| `nMarqueeStyle`   | `NUMERIC` | Define el estilo de la celda/fila seleccionada (punteado, sólido, fila resaltada, etc.). Ver `xbrowse.ch`. |
| `lFastEdit`       | `LOGICAL` | Si es `.T.`, permite entrar en modo de edición simplemente escribiendo en una celda editable.             |
| `lMultiSelect`    | `LOGICAL` | Habilita la selección de múltiples filas.                                                               |

### Bloques de Navegación (Data Source)

| Bloque      | Parámetros        | Descripción                                                                                             |
|-------------|-------------------|---------------------------------------------------------------------------------------------------------|
| `bGoTop`    | `()`              | Debe posicionar la fuente de datos en el primer registro.                                                 |
| `bGoBottom` | `()`              | Debe posicionar la fuente de datos en el último registro.                                                 |
| `bSkip`     | `(nToSkip)`       | Debe mover el puntero `nToSkip` registros (positivo o negativo). Devuelve el número de registros realmente movidos. |
| `bKeyCount` | `()`              | Debe devolver el número total de registros en la fuente de datos.                                         |
| `bBookMark` | `(uValue)`        | Si `uValue` es `NIL`, devuelve un identificador único de la fila actual. Si no, va a la fila identificada por `uValue`. |
| `bEof`      | `()`              | Devuelve `.T.` si el puntero está después del último registro.                                           |
| `bBof`      | `()`              | Devuelve `.T.` si el puntero está antes del primer registro.                                              |

## 4. Métodos Clave

| Método                  | Descripción                                                                                                                            |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `New(oWnd)`             | **(CONSTRUCTOR)** Crea una instancia de `TXBrowse` asociada a una ventana padre.                                                         |
| `AddColumn(...)`        | Añade y configura una nueva columna (`TXBrwColumn`) a la grilla. Es un método más amigable que crear el objeto `TXBrwColumn` manualmente. |
| `SetRDD()`              | Configura automáticamente los bloques de navegación para trabajar con el área de trabajo DBF actual.                                   |
| `SetArray(aData)`       | Configura los bloques de navegación para trabajar con un array de datos en memoria.                                                    |
| `SetAdo(oRs)`           | Configura los bloques de navegación para trabajar con un RecordSet de ADO.                                                             |
| `CreateFromCode()`      | Crea el control visual en la ventana padre después de haberlo configurado.                                                             |
| `Adjust()`              | Calcula las dimensiones de cabeceras, pies y filas. Se llama automáticamente, pero a veces es necesario invocarlo manualmente.         |
| `Refresh()`             | Redibuja completamente el contenido de la grilla.                                                                                      |
| `SelectedCol()`         | Devuelve el objeto `TXBrwColumn` de la columna actualmente seleccionada.                                                               |

## 5. Patrones de Uso y Ejemplos

### Ejemplo 1: Browse simple para una tabla DBF

```harbour
#include "FiveWin.ch"
#include "XBrowse.ch"

FUNCTION Main()
   LOCAL oWnd, oBrw

   USE Customer VIA "DBFCDX" // Abrir una tabla de ejemplo

   DEFINE WINDOW oWnd TITLE "TXBrowse con DBF"

   // 1. Crear el objeto TXBrowse
   oBrw := TXBrowse():New( oWnd )
   oBrw:nTop    := 10
   oBrw:nLeft   := 10
   oBrw:nRight  := oWnd:nWidth - 10
   oBrw:nBottom := oWnd:nHeight - 10

   // 2. Configurar la fuente de datos (automático para el alias actual)
   oBrw:SetRDD()

   // 3. Añadir columnas
   oBrw:AddColumn( "ID",    FieldBlock("CUST_ID"),  "99999", , , "R" )
   oBrw:AddColumn( "Nombre",  FieldBlock("FIRSTNAME"), "@!", , , , , .T. ) // Editable
   oBrw:AddColumn( "Apellido", FieldBlock("LASTNAME"), "@!" )

   // 4. Crear el control visual
   oBrw:CreateFromCode()

   ACTIVATE WINDOW oWnd

   CLOSE Customer
RETURN NIL
```

### Ejemplo 2: Browse para un Array en memoria

```harbour
#include "FiveWin.ch"
#include "XBrowse.ch"

FUNCTION Main()
   LOCAL oWnd, oBrw
   LOCAL aData := { { "Juan", "Pérez", 30 }, { "Ana", "García", 25 }, { "Luis", "Martínez", 42 } }

   DEFINE WINDOW oWnd TITLE "TXBrowse con Array"

   // 1. Crear el objeto TXBrowse
   oBrw := TXBrowse():New( oWnd )
   oBrw:nTop := 10, oBrw:nLeft := 10, oBrw:nRight := 400, oBrw:nBottom := 300

   // 2. Configurar la fuente de datos
   oBrw:SetArray( aData )

   // 3. Añadir columnas, usando bloques de código para acceder a los elementos del array
   oBrw:AddColumn( "Nombre",   { || aData[oBrw:nArrayAt][1] } )
   oBrw:AddColumn( "Apellido", { || aData[oBrw:nArrayAt][2] } )
   oBrw:AddColumn( "Edad",     { || aData[oBrw:nArrayAt][3] }, "999", , , "R" )

   // 4. Crear el control visual
   oBrw:CreateFromCode()

   ACTIVATE WINDOW oWnd

RETURN NIL
```
