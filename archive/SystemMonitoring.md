# Funciones de Monitorización del Sistema

**Archivo Fuente:** [source/function/monitor.c](..\source\function\monitor.c)

## 1. Propósito y Alcance

El archivo `monitor.c` expone funciones de bajo nivel escritas en C al entorno de Harbour. Estas funciones parecen estar relacionadas con la monitorización de eventos del sistema, específicamente cambios en la resolución de la pantalla.

La implementación exacta reside en funciones externas (`StartResMonitor` y `EndResMonitor`), por lo que este archivo actúa como un simple puente para hacerlas accesibles desde el código Harbour.

## 2. Funciones

### `STARTMONIT()`

*   **Propósito:** Inicia un proceso o hilo de monitorización que vigila los cambios en la resolución de la pantalla del sistema.
*   **Implementación:** Llama a la función externa `StartResMonitor()`.
*   **Uso:** Se debe llamar a esta función al inicio de una aplicación si se desea que la interfaz gráfica se adapte dinámicamente a los cambios de resolución.
*   **Parámetros:** Ninguno.
*   **Retorno:** `NIL`.

**Ejemplo de uso conceptual:**

```harbour
FUNCTION Main()
   // Iniciar el monitor de resolución al arrancar la aplicación
   STARTMONIT()

   // ... resto del código de la aplicación ...

   // Finalizar el monitor antes de salir
   ENDMONITOR()
RETURN NIL
```

---

### `ENDMONITOR()`

*   **Propósito:** Detiene el proceso o hilo de monitorización de la resolución de pantalla iniciado por `STARTMONIT()`.
*   **Implementación:** Llama a la función externa `EndResMonitor()`.
*   **Uso:** Se debe llamar a esta función al cerrar la aplicación para liberar los recursos del sistema utilizados por el monitor.
*   **Parámetros:** Ninguno.
*   **Retorno:** `NIL`.
