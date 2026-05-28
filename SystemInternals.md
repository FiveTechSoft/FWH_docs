# Funciones Internas del Sistema

**Archivo Fuente:** [source/internal/system.prg](..\source\internal\system.prg)

## 1. Propósito y Alcance

El archivo `system.prg` contiene funciones de bajo nivel que son fundamentales para el funcionamiento interno del framework. Estas funciones no suelen ser parte de la API pública para el desarrollo de aplicaciones, pero son cruciales para la gestión del flujo de ejecución y la responsividad de la interfaz.

## 2. Funciones

### `SysWait(nLong)`

*   **Propósito:** Realiza una pausa en la ejecución durante un período de tiempo determinado sin congelar la aplicación.
*   **Implementación:** Es un bucle de "espera activa" (busy wait). Compara continuamente el tiempo actual con el tiempo final, pero a diferencia de una pausa bloqueante, llama a `SysRefresh()` en cada iteración. La función `SysRefresh()` (definida en otra parte) se encarga de procesar los mensajes pendientes de Windows, lo que permite que la interfaz de usuario (UI) permanezca activa y responda a eventos del usuario durante la espera.
*   **Parámetros:**
    *   `nLong` (NUMERIC, Opcional): El número de segundos que se debe esperar. Acepta decimales. Por defecto es `0.1` segundos.
*   **Retorno:** `.T.` (Lógico) - Siempre devuelve verdadero al finalizar.

**Ejemplo de uso:**

```harbour
// Realizar una operación larga
StartLongOperation()

// Esperar medio segundo para asegurar que la UI se actualice
// o para dar tiempo a que un proceso en segundo plano comience.
SysWait(0.5)

// Continuar con el resto del código
MsgInfo("Pausa finalizada")
```

**Advertencia:** Aunque mantiene la UI activa, esta función consume ciclos de CPU de forma intensiva. Para pausas largas, es preferible utilizar un objeto `TTimer` si la lógica de la aplicación lo permite, ya que es más eficiente en el uso de recursos del sistema.
