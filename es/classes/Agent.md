# Clase Agent — Agente Autónomo de IA

Un agente autónomo de IA para codificación en [Harbour](https://harbour.github.io/) / [FiveWin](https://www.fivetechsoft.com/).
Implementa el mismo motor agente que impulsa Agents Web (`fivetechsoft.github.io/Agents`):
chat SSE con streaming, llamada a herramientas real y múltiples agentes ejecutándose en paralelo.

## Descripción General

La clase Agent envuelve la API de DeepSeek en un bucle: observar → decidir → actuar.
Dispone de un sistema de archivos virtual (el disco local), 15 herramientas integradas y la capacidad
de crear sus propias herramientas en tiempo de ejecución. Las habilidades inyectan instrucciones
reutilizables en el prompt del sistema.

```harbour
oAgent := Agent():New( cApiKey )
oAgent:Run( "Crea una app TODO en PHP+SQLite con 3 sub-agentes" )
? oAgent:UsageReport()
```

## Arquitectura

```
 ┌───────────────────────────────────┐
 │           Bucle Run()             │
 │  Step() → LLM → tool_calls? → act │
 │    ↑                         ↓    │
 │    └── resultado ←───────────┘    │
 ├───────────────────────────────────┤
 │  Herramientas integradas (15)     │
 │  Herramientas de usuario (dinámicas) │
 │  Habilidades (prompt del sistema) │
 ├───────────────────────────────────┤
│  DispatchAgents() → hilos         │
│  GeneratePlan() → ExecutePlan()   │
│  Distill() → patrones → habilidades │
│  Dream() → consolidación de memoria │
│  SaveState() / LoadState()        │
└───────────────────────────────────┘
```

## Métodos

### Bucle Principal

| Método | Descripción |
|--------|-------------|
| `New( cKey, [cModel] )` | Inicializa el agente con la clave API. Por defecto usa `deepseek-v4-pro`. Carga el estado guardado. |
| `Run( cPrompt )` | Bucle principal. Máx. 14 pasos. Soporta callbacks `bInterrupt` y `bInject`. Retorna el último mensaje del asistente. |
| `Step()` | Envía mensajes a DeepSeek con streaming SSE. Analiza los fragmentos de respuesta, actualiza métricas de tokens. |
| `SendToLLM( aMsgs )` | POST HTTP directo a `api.deepseek.com/chat/completions`. |

### Herramientas Integradas

| Herramienta | Método |
|-------------|--------|
| `list_files` | `Tool_ListFiles( [cDir] )` |
| `read_file` | `Tool_ReadFile( cPath )` |
| `edit_file` | `Tool_EditFile( cPath, cOldStr, cNewStr )` — reemplazo preciso de texto |
| `write_file` | `Tool_WriteFile( cPath, cContent )` — solicita permiso |
| `delete_file` | `Tool_DeleteFile( cPath )` — solicita permiso |
| `shell` | `Tool_Shell( cCmd )` |
| `python` | `Tool_Python( cCode )` — escribe .py temporal, ejecuta, limpia |
| `sql` | `Tool_Sql( cDb, cQuery )` |
| `web_search` | `Tool_WebSearch( cQuery )` |
| `web_fetch` | `Tool_WebFetch( cUrl )` |

### Búsqueda

| Método | Descripción |
|--------|-------------|
| `Tool_Glob( cPattern, [cDir] )` | Busca archivos por patrón (*.prg, **/*.c). Devuelve rutas. |
| `Tool_Grep( cPattern, [cDir] )` | Busca contenido en archivos fuente. Devuelve archivo:línea:contenido. Max 50 resultados. |

### Git

| Método | Descripción |
|--------|-------------|
| `Tool_GitStatus()` | Estado del working tree git. |
| `Tool_GitDiff()` | Cambios sin confirmar. Truncado a 30KB. |
| `Tool_GitLog( [nCount] )` | Historial de commits recientes (default 10). |
| `Tool_GitCommit( cMessage )` | Preparar y confirmar todos los cambios. |
| `Tool_GitPush()` | Subir commits al remoto. |

### Herramientas Dinámicas

| Método | Descripción |
|--------|-------------|
| `RegisterTool( cName, cDesc, cScript, [cType] )` | Registra un script como herramienta invocable. Auto-detects python/shell. |
| `UnregisterTool( cName )` | Elimina la herramienta del registro. El script permanece en disco. |
| `ListUserTools()` | Retorna la lista de herramientas de usuario registradas. |
| `ExecUserTool( cName, hArgs )` | Ejecuta una herramienta registrada por el usuario. |

### Habilidades (Skills)

| Método | Descripción |
|--------|-------------|
| `CreateSkill( cName, cContent, [cDir] )` | Escribe un archivo de habilidad en `skills/<name>.md`. |
| `ToggleSkill( cName, lOn )` | Activa/desactiva sin eliminar el archivo. |
| `ActiveSkillsPrompt()` | Retorna cadena de prompt con todas las habilidades activas. |
| `ListSkills( [cDir] )` | Carga habilidades desde el directorio en disco. |

Habilidades integradas: `reviewer`, `summarizer`, `refactor`, `documenter`, `tester`.

### Multi-Agente

| Método | Descripción |
|--------|-------------|
| `DispatchAgents( aTasks, cContract )` | Lanza hasta 4 sub-agentes en paralelo mediante `hb_threadStart()`. Retorna resultados combinados. |
| `SubAgentRun( cTask, cContract )` | Sub-agente individual (sin dispatch, sin ask_user, máx. 5 pasos). |

### Planificación

| Método | Descripción |
|--------|-------------|
| `GeneratePlan( cGoal )` | Solicita al LLM generar un plan de 3-6 pasos en JSON. |
| `ExecutePlan()` | Ejecuta el plan paso a paso, marcando cada uno como completado. |

### Distill

| Método | Descripción |
|--------|-------------|
| `Distill( [nMinRepeat] )` | Analiza el historial de llamadas a herramientas en busca de patrones n-grama repetidos (2-5 pasos). Patrones con 3+ repeticiones se convierten en habilidades; 5+ repeticiones con 3+ pasos se convierten en comandos registrados (.bat). Retorna JSON con los flujos de trabajo descubiertos. |
| `RecordToolCall( cName, hArgs, cResult )` | Registra una invocación de herramienta en el historial (llamado automáticamente por `ExecTool`). |
| `ExtractPatterns()` | Encuentra todas las subsecuencias n-grama en el historial de herramientas, retorna ordenadas por puntuación. |
| `ScorePattern( hPat )` | Clasifica un patrón por frecuencia (log), longitud y antigüedad. |
| `DistillToSkill( hPattern )` | Crea un archivo `.md` de habilidad enumerando los pasos de la secuencia de herramientas. |
| `DistillToCommand( hPattern )` | Genera un script `.bat` en `agent_state/distilled/` y lo registra como herramienta de usuario. |

### Dream (Consolidación de Memoria)

| Método | Descripción |
|--------|-------------|
| `Dream()` | Consolida la memoria del proyecto en 5 fases: leer archivos de memoria, comprimir trayectoria, construir resumen, persistir, informar. Retorna JSON con contadores. |
| `ReadMemoryDir( cDir )` | Escanea directorio en busca de archivos `.json` (fusionados como hashes) y `.md` (almacenados como notas). |
| `ConsolidateTrajectory()` | Comprime `aMessages` + `aToolHistory` en entradas estructuradas (máx. 100). |
| `BuildMemoryDigest()` | Sintetiza reglas (de habilidades), decisiones (de flujos destilados) y patrones (del historial de herramientas). |
| `SaveMemoryDigest()` / `LoadMemoryDigest()` | Persiste/restaura `digest.json` en/de `agent_state/memory/`. |
| `MemoryPrompt()` | Genera una sección de prompt a partir del resumen consolidado para incluir en el prompt del sistema. |

### Persistencia

| Método | Descripción |
|--------|-------------|
| `SaveState( cDir )` | Guarda herramientas de usuario y habilidades activas en `user_tools.json`. |
| `LoadState( cDir )` | Restaura desde disco al iniciar. También carga habilidades del directorio `skills/`. |

### Checkpoints

Guardar/restaurar estado completo del agente para reanudación de tareas. Ficheros `.json` en `.agents/`.

| Método | Descripción |
|--------|-------------|
| `SaveCheckpoint( [cLabel] )` | Guarda mensajes, plan, contexto compartido, objetivo e historial de tools en `.agents/cp_N.json`. |
| `LoadCheckpoint( [nId] )` | Restaura estado desde checkpoint. `nId=0` carga el último. |
| `ListCheckpoints()` | Lista todos los checkpoints disponibles con id, label, paso, nº mensajes, nº tools. |
| `DeleteCheckpoint( nId )` | Elimina checkpoint de memoria y disco. |
| `AutoCheckpoint()` | Se ejecuta internamente cada `nCheckpointInterval` mensajes durante `Run()`. Desactivado si el intervalo es 0. |
| `LoadCheckpoints()` | Carga todos los `cp_*.json` de `.agents/` al iniciar (llamado automáticamente por `New()`). |

Tools para el LLM: `save_checkpoint`, `list_checkpoints`, `load_checkpoint`, `delete_checkpoint`.

Campos del checkpoint: `id`, `step`, `label`, `ts`, `messages`, `plan`, `shared`, `goal`, `toolHistory`, `toolCount`, `model`, `maxSteps`.

### Tareas

Tracking persistente de tareas entre llamadas a `Run()`. Ciclo de vida: open → in_progress → done/blocked.

| Método | Descripción |
|--------|-------------|
| `TaskCreate( cSummary )` | Crear nueva tarea. Devuelve ID auto-incremental. |
| `TaskList()` | Listar tareas con iconos: `[ ]` abierta, `[>]` en progreso, `[!]` bloqueada, `[x]` completada. |
| `TaskDone( nId )` | Marcar tarea como completada. |
| `TaskBlock( nId, cReason )` | Bloquear tarea con razón. |
| `TaskStart( nId )` | Marcar tarea como en progreso. |

Tools para el LLM: `task_create`, `task_list`, `task_done`, `task_block`, `task_start`.

### Actores (Sub-Agentes Persistentes)

Sub-agentes de larga vida que sobreviven más allá de una llamada a `Run()`. Comparten `aSharedContext` con el padre.

| Método | Descripción |
|--------|-------------|
| `ActorSpawn( cPrompt )` | Lanzar agente en background en un hilo. Devuelve ID. |
| `ActorWait( [nId] )`` | Bloquear hasta que termine. Sin ID = esperar todos. |
| `ActorSend( nId, cMsg )` | Inyectar mensaje en actor activo via `bInject`. |
| `ActorList()` | Listar actores con estado y último resultado. |
| `ActorCancel( nId )` | Cancelar actor activo via `Abort()`. |

Tools para el LLM: `spawn_actor`, `wait_actor`, `send_actor`, `list_actors`, `cancel_actor`.

### Utilidades

| Método | Descripción |
|--------|-------------|
| `AddMessage( cRole, cContent )` | Añade al array de conversación. Auto-comprime al llegar a 200 mensajes. |
| `UsageReport()` | Imprime contadores de tokens y costo estimado. |
| `Abort()` | Detiene el bucle del agente. |

## Miembros DATA

| DATA | Tipo | Descripción |
|------|------|-------------|
| `aMessages` | Array | Conversación completa `{role, content}` |
| `aBuiltinTools` | Hash | `name → codeblock` para todas las herramientas (integradas + usuario) |
| `aUserTools` | Hash | `name → {desc, script, type}` para herramientas creadas por el usuario |
| `aSkills` | Hash | `name → content` para todas las habilidades conocidas |
| `aSkillsOn` | Array | Nombres de las habilidades actualmente activas |
| `cGoal` | String | Objetivo actual |
| `aPlan` | Array | Pasos `{title, state}` |
| `aToolHistory` | Array | Historial de llamadas a herramientas `[{name, args, result, ts}]` |
| `aDistilled` | Array | Flujos de trabajo descubiertos `[{name, type, pattern, content}]` |
| `aMemoryDigest` | Hash | Memoria consolidada `{rules, decisions, patterns, trajectory, notes, timestamp}` |
| `cMemoryDir` | String | Directorio base para archivos de memoria (`agent_state/memory/`) |
| `cModel` | String | ID del modelo (por defecto: `deepseek-v4-pro`) |
| `nMaxSteps` | Numeric | Máx. de iteraciones por Run() (por defecto: 14) |
| `nTokensIn/Out/Cache` | Numeric | Contadores de tokens para seguimiento de costos |

## Ejemplo

```harbour
PROCEDURE Main()
   LOCAL oAgent, cResult

   oAgent := Agent():New( "sk-xxxx" )

   // Registrar una herramienta personalizada
   oAgent:RegisterTool( "contar", ;
      "Cuenta líneas, palabras y caracteres de un archivo", ;
      "contar.py" )

   // Crear y activar una habilidad
   oAgent:CreateSkill( "prueba", ;
      "Responde siempre en español." + CRLF + ;
      "Verifica el disco antes de escribir código." + CRLF + ;
      "Escribe tests automáticamente." )
   oAgent:ToggleSkill( "prueba", .T. )

   // Ejecutar el agente
   cResult := oAgent:Run( "Crea un script Python que analice el disco" )

   ? "Resultado:", cResult
   oAgent:UsageReport()

RETURN
```

## Notas

- **Requiere Harbour MT VM**: `DispatchAgents()` usa `hb_threadStart()` / `hb_threadJoin()`.
  Enlaza contra `libhbvmmt` (VM multi-hilo), no `libhbvm` (mono-hilo).
- **Clave API**: se establece en la construcción o mediante la variable de entorno `DEEPSEEK_API_KEY`.
- **Streaming**: `Step()` usa streaming SSE con `stream_options.include_usage` para
  métricas de tokens en tiempo real. La respuesta se analiza desde los fragmentos de datos SSE.
- **Interrupción/Inyección**: pasa codeblocks `interrupt` e `inject` en `hOpts` a `New()`.
  `interrupt` retorna `.T.` para abortar el bucle; `inject` retorna una cadena para inyectar
  como mensaje de usuario entre pasos.
- **Contrato**: el parámetro `cContract` en `DispatchAgents()` se antepone a cada
  prompt de sub-agente. Sin él, los sub-agentes divergen en la nomenclatura. Proporciónalo siempre.
