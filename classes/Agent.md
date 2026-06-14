# Agent — Autonomous AI Agent Class

An autonomous AI coding agent for [Harbour](https://harbour.github.io/) / [FiveWin](https://www.fivetechsoft.com/).
Implements the same agentic engine that powers Agents Web (`fivetechsoft.github.io/Agents`):
streaming chat (coming soon), real tool-calling, and multiple agents running in parallel.

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
 │  Built-in tools (15)              │
 │  User tools (dynamic)             │
 │  Skills (system prompt)           │
 ├───────────────────────────────────┤
 │  DispatchAgents() → threads       │
 │  GeneratePlan() → ExecutePlan()   │
 │  SaveState() / LoadState()        │
 └───────────────────────────────────┘
```

## Methods

### Core Loop

| Method | Description |
|--------|-------------|
| `New( cKey, [cModel] )` | Init agent with API key. Defaults to `deepseek-v4-pro`. Loads saved state. |
| `Run( cPrompt )` | Main loop. Max 14 steps. Returns last assistant message. |
| `Step()` | Sends messages to DeepSeek, returns response. Updates token metrics. |
| `SendToLLM( aMsgs )` | Raw HTTP POST to `api.deepseek.com/chat/completions`. |

### Built-in Tools

| Tool | Method |
|------|--------|
| `list_files` | `Tool_ListFiles( [cDir] )` |
| `read_file` | `Tool_ReadFile( cPath )` |
| `write_file` | `Tool_WriteFile( cPath, cContent )` — asks permission |
| `delete_file` | `Tool_DeleteFile( cPath )` — asks permission |
| `shell` | `Tool_Shell( cCmd )` |
| `python` | `Tool_Python( cCode )` — writes temp .py, executes, cleans up |
| `sql` | `Tool_Sql( cDb, cQuery )` |
| `web_search` | `Tool_WebSearch( cQuery )` |
| `web_fetch` | `Tool_WebFetch( cUrl )` |

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

### Persistence

| Method | Description |
|--------|-------------|
| `SaveState( cDir )` | Save user tools and active skills to `user_tools.json`. |
| `LoadState( cDir )` | Restore from disk on startup. Also loads skills from `skills/` dir. |

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
- **API Key**: set at construction or via environment variable `DEEPSEEK_KEY`.
- **Streaming**: `Step()` currently fetches the full response. Token-by-token streaming
  via SSE is planned.
- **Contract**: the `cContract` parameter in `DispatchAgents()` is prepended to every
  sub-agent prompt. Without it, sub-agents diverge on naming. Always provide one.
