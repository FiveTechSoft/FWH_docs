# Class Agent — Autonomous AI Agent

An autonomous AI coding agent for [Harbour](https://harbour.github.io/) / [FiveWin](https://www.fivetechsoft.com/).
Implements the same agentic engine that powers Agents Web (`fivetechsoft.github.io/Agents`):
streaming SSE chat, real tool-calling, and multiple agents running in parallel.

## Overview

The Agent class wraps the DeepSeek API in a loop: observe → decide → act.
It has a virtual filesystem (the local disk), 15 built-in tools, and the ability
to create its own tools at runtime. Skills inject reusable instructions into the
system prompt.

```harbour
oAgent := Agent():New( cApiKey )
oAgent:Run( "Crea una app TODO en PHP+SQLite con 3 sub-agentes" )
? oAgent:UsageReport()
```

## Architecture

```
 ┌───────────────────────────────────┐
 │           Run() loop              │
 │  Step() → LLM → tool_calls? → act │
 │    ↑                         ↓    │
 │    └── result ←──────────────┘    │
 ├───────────────────────────────────┤
 │  Built-in tools (29)              │
 │  User tools (dynamic)             │
 │  Skills (system prompt)           │
 ├───────────────────────────────────┤
│  Edit / Glob / Grep               │
│  Git status/diff/log/commit/push  │
│  Tasks create/list/done/block     │
│  Actors spawn/wait/send/cancel   │
│  Checkpoints save/load/list       │
│  DispatchAgents → threads        │
│  GeneratePlan → ExecutePlan      │
│  Distill → patterns → skills     │
│  Dream → memory consolidation    │
│  SaveState / LoadState           │
└───────────────────────────────────┘
```

## Methods

### Core Loop

| Method | Description |
|--------|-------------|
| `New( cKey, [cModel] )` | Init agent with API key. Defaults to `deepseek-v4-pro`. Loads saved state. |
| `Run( cPrompt )` | Main loop. Max 14 steps. Supports `bInterrupt` and `bInject` callbacks. Returns last assistant message. |
| `Step()` | Sends messages to DeepSeek with streaming SSE. Parses response chunks, updates token metrics. |
| `SendToLLM( aMsgs )` | Raw HTTP POST to `api.deepseek.com/chat/completions`. |

### Built-in Tools

| Tool | Method |
|------|--------|
| `list_files` | `Tool_ListFiles( [cDir] )` |
| `read_file` | `Tool_ReadFile( cPath )` |
| `edit_file` | `Tool_EditFile( cPath, cOldStr, cNewStr )` — precise text replacement |
| `write_file` | `Tool_WriteFile( cPath, cContent )` — asks permission |
| `delete_file` | `Tool_DeleteFile( cPath )` — asks permission |
| `shell` | `Tool_Shell( cCmd )` |
| `python` | `Tool_Python( cCode )` — writes temp .py, executes, cleans up |
| `sql` | `Tool_Sql( cDb, cQuery )` |
| `web_search` | `Tool_WebSearch( cQuery )` |
| `web_fetch` | `Tool_WebFetch( cUrl )` |

### Search

| Method | Description |
|--------|-------------|
| `Tool_Glob( cPattern, [cDir] )` | Find files matching pattern (e.g. `*.prg`, `**/*.c`). Returns file paths. |
| `Tool_Grep( cPattern, [cDir] )` | Search file contents across source files. Returns `file:line:content`. Max 50 results. |

### Git

| Method | Description |
|--------|-------------|
| `Tool_GitStatus()` | Show git working tree status (short format). |
| `Tool_GitDiff()` | Show unstaged changes. Truncated at 30KB. |
| `Tool_GitLog( [nCount] )` | Show recent commits (default 10). |
| `Tool_GitCommit( cMessage )` | Stage all changes and commit. |
| `Tool_GitPush()` | Push to remote. |

### Dynamic Tools

| Method | Description |
|--------|-------------|
| `RegisterTool( cName, cDesc, cScript, [cType] )` | Register a script as callable tool. Auto-detects python/shell. |
| `UnregisterTool( cName )` | Remove tool from registry. Script stays on disk. |
| `ListUserTools()` | Returns list of registered user tools. |
| `ExecUserTool( cName, hArgs )` | Execute a user-registered tool. |

### Skills

| Method | Description |
|--------|-------------|
| `CreateSkill( cName, cContent, [cDir] )` | Write skill file to `skills/<name>.md`. |
| `ToggleSkill( cName, lOn )` | Activate/deactivate without deleting file. |
| `ActiveSkillsPrompt()` | Returns prompt string with all active skills. |
| `ListSkills( [cDir] )` | Load skills from disk directory. |

Built-in skills: `reviewer`, `summarizer`, `refactor`, `documenter`, `tester`.

### Multi-Agent

| Method | Description |
|--------|-------------|
| `DispatchAgents( aTasks, cContract )` | Launch up to 4 sub-agents in parallel via `hb_threadStart()`. Returns combined results. |
| `SubAgentRun( cTask, cContract )` | Individual sub-agent (no dispatch, no ask_user, max 5 steps). |

### Planning

| Method | Description |
|--------|-------------|
| `GeneratePlan( cGoal )` | Ask LLM to generate 3-6 step plan in JSON. |
| `ExecutePlan()` | Run plan step by step, marking each done. |

### Distill

| Method | Description |
|--------|-------------|
| `Distill( [nMinRepeat] )` | Analyze tool call history for repeated n-gram patterns (2-5 steps). Patterns with 3+ repeats become skills; 5+ repeats with 3+ steps become registered commands (.bat). Returns JSON with discovered workflows. |
| `RecordToolCall( cName, hArgs, cResult )` | Record a tool invocation into history (called automatically by `ExecTool`). |
| `ExtractPatterns()` | Find all n-gram subsequences in tool call history, return sorted by score. |
| `ScorePattern( hPat )` | Rank a pattern by frequency (log), length, and recency. |
| `DistillToSkill( hPattern )` | Create a `.md` skill file listing the tool sequence steps. |
| `DistillToCommand( hPattern )` | Generate a `.bat` script in `agent_state/distilled/` and register it as a user tool. |

### Dream (Memory Consolidation)

| Method | Description |
|--------|-------------|
| `Dream()` | Consolidate project memory in 5 phases: read memory files, compress trajectory, build digest, persist, report. Returns JSON with counts. |
| `ReadMemoryDir( cDir )` | Scan directory for `.json` (merged as hashes) and `.md` (stored as notes) files. |
| `ConsolidateTrajectory()` | Compress `aMessages` + `aToolHistory` into structured entries (max 100). |
| `BuildMemoryDigest()` | Synthesize rules (from skills), decisions (from distilled workflows), and patterns (from tool history). |
| `SaveMemoryDigest()` / `LoadMemoryDigest()` | Persist/restore `digest.json` to/from `agent_state/memory/`. |
| `MemoryPrompt()` | Generate a prompt section from the consolidated digest for inclusion in the system prompt. |

### Persistence

| Method | Description |
|--------|-------------|
| `SaveState( cDir )` | Save user tools and active skills to `user_tools.json`. |
| `LoadState( cDir )` | Restore from disk on startup. Also loads skills from `skills/` dir. |

### Checkpoints

Save/restore full agent state for task resumption. Files stored as `.json` in `.agents/`.

| Method | Description |
|--------|-------------|
| `SaveCheckpoint( [cLabel] )` | Save messages, plan, shared context, goal, tool history to `.agents/cp_N.json`. Returns description string. |
| `LoadCheckpoint( [nId] )` | Restore state from checkpoint. `nId=0` or NIL loads the latest. |
| `ListCheckpoints()` | List all available checkpoints with id, label, step, messages count, tool count. |
| `DeleteCheckpoint( nId )` | Remove checkpoint from memory and disk. |
| `AutoCheckpoint()` | Called internally every `nCheckpointInterval` messages during `Run()`. Disabled if interval is 0. |
| `LoadCheckpoints()` | Load all `cp_*.json` from `.agents/` on startup (called automatically by `New()`). |

LLM tools: `save_checkpoint`, `list_checkpoints`, `load_checkpoint`, `delete_checkpoint`.

Checkpoint fields: `id`, `step`, `label`, `ts`, `messages`, `plan`, `shared`, `goal`, `toolHistory`, `toolCount`, `model`, `maxSteps`.

### Tasks

Persistent task tracking across `Run()` calls. Tasks have lifecycle: open → in_progress → done/blocked.

| Method | Description |
|--------|-------------|
| `TaskCreate( cSummary )` | Create a new task. Returns description with auto-incremented ID. |
| `TaskList()` | List all tasks with status icons: `[ ]` open, `[>]` in_progress, `[!]` blocked, `[x]` done. |
| `TaskDone( nId )` | Mark task as completed. |
| `TaskBlock( nId, cReason )` | Block task with reason. |
| `TaskStart( nId )` | Mark task as in-progress. |

LLM tools: `task_create`, `task_list`, `task_done`, `task_block`, `task_start`.

### Actors (Persistent Sub-Agents)

Long-lived background agents that survive beyond a single `Run()` call. They share `aSharedContext` with the parent.

| Method | Description |
|--------|-------------|
| `ActorSpawn( cPrompt )` | Launch background agent in a thread. Returns actor ID. |
| `ActorWait( [nId] )` | Block until actor finishes. No ID = wait for all. |
| `ActorSend( nId, cMsg )` | Inject a message into a running actor via `bInject`. |
| `ActorList()` | List all actors with status and last result. |
| `ActorCancel( nId )` | Cancel a running actor via `Abort()`. |

LLM tools: `spawn_actor`, `wait_actor`, `send_actor`, `list_actors`, `cancel_actor`.

### Utilities

| Method | Description |
|--------|-------------|
| `AddMessage( cRole, cContent )` | Append to conversation array. Auto-compacts at 200 msgs. |
| `UsageReport()` | Print token counts and estimated cost. |
| `Abort()` | Stop the agent loop. |

## DATA Members

| DATA | Type | Description |
|------|------|-------------|
| `aMessages` | Array | Full conversation `{role, content}` |
| `aBuiltinTools` | Hash | `name → codeblock` for all tools (built-in + user) |
| `aUserTools` | Hash | `name → {desc, script, type}` for user-created tools |
| `aSkills` | Hash | `name → content` for all known skills |
| `aSkillsOn` | Array | Names of currently active skills |
| `cGoal` | String | Current objective |
| `aPlan` | Array | Steps `{title, state}` |
| `aToolHistory` | Array | Tool call history `[{name, args, result, ts}]` |
| `aDistilled` | Array | Discovered workflows `[{name, type, pattern, content}]` |
| `aMemoryDigest` | Hash | Consolidated memory `{rules, decisions, patterns, trajectory, notes, timestamp}` |
| `cMemoryDir` | String | Base directory for memory files (`agent_state/memory/`) |
| `aCheckpoints` | Array | Checkpoints in memory `[{id, step, label, ts, messages, plan, shared, goal, toolHistory}]` |
| `cCheckpointDir` | String | Directory for checkpoint files (`.agents/`) |
| `nCheckpointInterval` | Numeric | Auto-checkpoint every N messages (default: 3, 0 = disabled) |
| `nCheckpointId` | Numeric | Auto-incrementing checkpoint counter |
| `aTasks` | Array | Persistent tasks `[{id, summary, status, created, updated, notes}]` |
| `aActors` | Array | Persistent sub-agents `[{id, prompt, status, result, agent, thread, created}]` |
| `cModel` | String | Model ID (default: `deepseek-v4-pro`) |
| `nMaxSteps` | Numeric | Max iterations per Run() (default: 14) |
| `nTokensIn/Out/Cache` | Numeric | Token counters for cost tracking |

## Example

```harbour
PROCEDURE Main()
   LOCAL oAgent, cResult

   oAgent := Agent():New( "sk-xxxx" )

   // Register a custom tool
   oAgent:RegisterTool( "contar", ;
      "Cuenta líneas, palabras y caracteres de un archivo", ;
      "contar.py" )

   // Create and activate a skill
   oAgent:CreateSkill( "prueba", ;
      "Responde siempre en español." + CRLF + ;
      "Verifica el disco antes de escribir código." + CRLF + ;
      "Escribe tests automáticamente." )
   oAgent:ToggleSkill( "prueba", .T. )

   // Run the agent
   cResult := oAgent:Run( "Crea un script Python que analice el disco" )

   ? "Resultado:", cResult
   oAgent:UsageReport()

RETURN
```

## Notes

- **Harbour MT VM required**: `DispatchAgents()` uses `hb_threadStart()` / `hb_threadJoin()`.
  Link against `libhbvmmt` (multi-thread VM), not `libhbvm` (single-thread).
- **API Key**: set at construction or via environment variable `DEEPSEEK_API_KEY`.
- **Streaming**: `Step()` uses SSE streaming with `stream_options.include_usage` for
  real-time token metrics. Response is parsed from SSE data chunks.
- **Interrupt/Inject**: pass `interrupt` and `inject` codeblocks in `hOpts` to `New()`.
  `interrupt` returns `.T.` to abort the loop; `inject` returns a string to inject
  as a user message between steps.
- **Contract**: the `cContract` parameter in `DispatchAgents()` is prepended to every
  sub-agent prompt. Without it, sub-agents diverge on naming. Always provide one.
