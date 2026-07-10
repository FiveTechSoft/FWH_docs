# Utilidades de Base de Datos (DBF)

**Archivo Fuente:** [source/function/dbtools.prg](..\source\function\dbtools.prg)

## 1. Propósito y Alcance

El archivo `dbtools.prg` proporciona un conjunto de funciones de utilidad de alto nivel para interactuar con el sistema de base de datos RDD (Record-Driven Data), que es la forma estándar en que xBase/Harbour maneja las tablas DBF.

Estas funciones simplifican tareas comunes como la gestión de áreas de trabajo (alias), la manipulación de registros y la obtención de información sobre índices.

## 2. Funciones

### `aGetWorkAreas()`

*   **Propósito:** Devuelve un array con los alias de todas las áreas de trabajo que están actualmente en uso.
*   **Parámetros:** Ninguno.
*   **Retorno:** `ARRAY` - Un array de cadenas, donde cada cadena es un alias.

**Ejemplo:**

```harbour
USE Customer
USE Orders IN 0

// aAreas contendrá: { "CUSTOMER", "ORDERS" }
aAreas := aGetWorkAreas()

MsgInfo( "Áreas en uso: " + FW_ArrayAsList(aAreas) )
```

---

### `cGetNewAlias(cAlias)`

*   **Propósito:** Genera un nombre de alias único. Si el `cAlias` proporcionado no está en uso, lo devuelve. Si está en uso, le añade un sufijo numérico incremental (e.g., "CUSTOMER001", "CUSTOMER002") hasta encontrar uno que esté libre.
*   **Parámetros:**
    *   `cAlias` (CHARACTER): El nombre de alias base que se desea utilizar.
*   **Retorno:** `CHARACTER` - Un nombre de alias garantizado que no está en uso.

**Ejemplo:**

```harbour
USE Customer

// Esto devolverá "CUSTOMER001" porque "CUSTOMER" ya está en uso.
cNuevoAlias := cGetNewAlias("CUSTOMER")

USE Customer AGAIN ALIAS (cNuevoAlias)
```

---

### `cGetNewAliasName(cAlias)`

*   **Propósito:** Limpia una cadena de texto para que sea un nombre de alias válido, eliminando cualquier carácter que no sea alfanumérico o un guion bajo (`_`).
*   **Parámetros:**
    *   `cAlias` (CHARACTER): La cadena a limpiar.
*   **Retorno:** `CHARACTER` - La cadena limpia, apta para ser usada como alias.

**Ejemplo:**

```harbour
// cAliasValido contendrá "MiTabla_1"
cAliasValido := cGetNewAliasName("Mi-Tabla 1")
```

---

### `GetOrdNames()`

*   **Propósito:** Devuelve un array con los nombres (TAGs) de todos los índices disponibles en el área de trabajo actual.
*   **Parámetros:** Ninguno.
*   **Retorno:** `ARRAY` - Un array de cadenas, donde cada cadena es un nombre de índice.

**Ejemplo:**

```harbour
// Suponiendo que Customer.ntx tiene índices para "LASTNAME" y "CUST_ID"
USE Customer INDEX Customer

// aIndices contendrá: { "Lastname", "Cust_id" }
aIndices := GetOrdNames()
```

---

### `DupRecord()`

*   **Propósito:** Duplica el registro actual. Crea un nuevo registro en blanco (`APPEND BLANK`) y copia en él los valores de todos los campos del registro actual.
*   **Parámetros:** Ninguno.
*   **Retorno:** `NIL`.
*   **Notas:** Intenta bloquear el registro (`RLock()`) antes de escribir los datos para asegurar la integridad en entornos multiusuario.

**Ejemplo:**

```harbour
USE Customer

GoTo(10) // Ir al registro 10

DupRecord() // Se creará un nuevo registro al final de la tabla con los mismos datos que el registro 10.
```
