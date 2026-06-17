# Classe Agent — Agente Autônomo de IA

Um agente autônomo de IA para codificação em [Harbour](https://harbour.github.io/) / [FiveWin](https://www.fivetechsoft.com/).
Implementa o mesmo motor agente que alimenta o Agents Web (`fivetechsoft.github.io/Agents`):
chat SSE com streaming, chamada de ferramentas real e múltiplos agentes executando em paralelo.

## Visão Geral

A classe Agent encapsula a API do DeepSeek em um loop: observar → decidir → agir.
Possui um sistema de arquivos virtual (o disco local), 15 ferramentas integradas e a capacidade
de criar suas próprias ferramentas em tempo de execução. As habilidades injetam instruções
reutilizáveis no prompt do sistema.

```harbour
oAgent := Agent():New( cApiKey )
oAgent:Run( "Crie um app TODO em PHP+SQLite com 3 sub-agentes" )
? oAgent:UsageReport()
```

## Arquitetura

```
 ┌───────────────────────────────────┐
 │           Loop Run()              │
 │  Step() → LLM → tool_calls? → agir │
 │    ↑                         ↓    │
 │    └── resultado ←───────────┘    │
 ├───────────────────────────────────┤
 │  Ferramentas integradas (15)      │
 │  Ferramentas do usuário (dinâmicas) │
 │  Habilidades (prompt do sistema)  │
 ├───────────────────────────────────┤
│  DispatchAgents() → threads       │
│  GeneratePlan() → ExecutePlan()   │
│  Distill() → padrões → habilidades │
│  Dream() → consolidação de memória │
│  SaveState() / LoadState()        │
└───────────────────────────────────┘
```

## Métodos

### Loop Principal

| Método | Descrição |
|--------|-----------|
| `New( cKey, [cModel] )` | Inicializa o agente com a chave API. Padrão: `deepseek-v4-pro`. Carrega o estado salvo. |
| `Run( cPrompt )` | Loop principal. Máx. 14 passos. Suporta callbacks `bInterrupt` e `bInject`. Retorna a última mensagem do assistente. |
| `Step()` | Envia mensagens para o DeepSeek com streaming SSE. Analisa os fragmentos de resposta, atualiza métricas de tokens. |
| `SendToLLM( aMsgs )` | POST HTTP direto para `api.deepseek.com/chat/completions`. |

### Ferramentas Integradas

| Ferramenta | Método |
|------------|--------|
| `list_files` | `Tool_ListFiles( [cDir] )` |
| `read_file` | `Tool_ReadFile( cPath )` |
| `edit_file` | `Tool_EditFile( cPath, cOldStr, cNewStr )` — substituição precisa de texto |
| `write_file` | `Tool_WriteFile( cPath, cContent )` — solicita permissão |
| `delete_file` | `Tool_DeleteFile( cPath )` — solicita permissão |
| `shell` | `Tool_Shell( cCmd )` |
| `python` | `Tool_Python( cCode )` — escreve .py temporário, executa, limpa |
| `sql` | `Tool_Sql( cDb, cQuery )` |
| `web_search` | `Tool_WebSearch( cQuery )` |
| `web_fetch` | `Tool_WebFetch( cUrl )` |

### Busca

| Método | Descrição |
|--------|-----------|
| `Tool_Glob( cPattern, [cDir] )` | Busca arquivos por padrão (*.prg, **/*.c). Retorna caminhos. |
| `Tool_Grep( cPattern, [cDir] )` | Busca conteúdo em arquivos fonte. Retorna arquivo:linha:conteúdo. Max 50 resultados. |

### Git

| Método | Descrição |
|--------|-----------|
| `Tool_GitStatus()` | Estado do working tree git. |
| `Tool_GitDiff()` | Alterações não commitadas. Truncado a 30KB. |
| `Tool_GitLog( [nCount] )` | Histórico de commits recentes (default 10). |
| `Tool_GitCommit( cMessage )` | Preparar e confirmar todas as alterações. |
| `Tool_GitPush()` | Enviar commits ao remoto. |

### Ferramentas Dinâmicas

| Método | Descrição |
|--------|-----------|
| `RegisterTool( cName, cDesc, cScript, [cType] )` | Registra um script como ferramenta invocável. Auto-detecta python/shell. |
| `UnregisterTool( cName )` | Remove a ferramenta do registro. O script permanece no disco. |
| `ListUserTools()` | Retorna a lista de ferramentas de usuário registradas. |
| `ExecUserTool( cName, hArgs )` | Executa uma ferramenta registrada pelo usuário. |

### Habilidades (Skills)

| Método | Descrição |
|--------|-----------|
| `CreateSkill( cName, cContent, [cDir] )` | Escreve um arquivo de habilidade em `skills/<name>.md`. |
| `ToggleSkill( cName, lOn )` | Ativa/desativa sem excluir o arquivo. |
| `ActiveSkillsPrompt()` | Retorna string de prompt com todas as habilidades ativas. |
| `ListSkills( [cDir] )` | Carrega habilidades do diretório em disco. |

Habilidades integradas: `reviewer`, `summarizer`, `refactor`, `documenter`, `tester`.

### Multi-Agente

| Método | Descrição |
|--------|-----------|
| `DispatchAgents( aTasks, cContract )` | Lança até 4 sub-agentes em paralelo via `hb_threadStart()`. Retorna resultados combinados. |
| `SubAgentRun( cTask, cContract )` | Sub-agente individual (sem dispatch, sem ask_user, máx. 5 passos). |

### Planejamento

| Método | Descrição |
|--------|-----------|
| `GeneratePlan( cGoal )` | Solicita ao LLM gerar um plano de 3-6 passos em JSON. |
| `ExecutePlan()` | Executa o plano passo a passo, marcando cada um como concluído. |

### Distill

| Método | Descrição |
|--------|-----------|
| `Distill( [nMinRepeat] )` | Analisa o histórico de chamadas de ferramentas em busca de padrões n-grama repetidos (2-5 passos). Padrões com 3+ repetições tornam-se habilidades; 5+ repetições com 3+ passos tornam-se comandos registrados (.bat). Retorna JSON com os fluxos de trabalho descobertos. |
| `RecordToolCall( cName, hArgs, cResult )` | Registra uma invocação de ferramenta no histórico (chamado automaticamente por `ExecTool`). |
| `ExtractPatterns()` | Encontra todas as subsequências n-grama no histórico de ferramentas, retorna ordenadas por pontuação. |
| `ScorePattern( hPat )` | Classifica um padrão por frequência (log), comprimento e recência. |
| `DistillToSkill( hPattern )` | Cria um arquivo `.md` de habilidade listando os passos da sequência de ferramentas. |
| `DistillToCommand( hPattern )` | Gera um script `.bat` em `agent_state/distilled/` e o registra como ferramenta de usuário. |

### Dream (Consolidação de Memória)

| Método | Descrição |
|--------|-----------|
| `Dream()` | Consolida a memória do projeto em 5 fases: ler arquivos de memória, comprimir trajetória, construir resumo, persistir, relatar. Retorna JSON com contadores. |
| `ReadMemoryDir( cDir )` | Varre o diretório em busca de arquivos `.json` (mesclados como hashes) e `.md` (armazenados como notas). |
| `ConsolidateTrajectory()` | Comprime `aMessages` + `aToolHistory` em entradas estruturadas (máx. 100). |
| `BuildMemoryDigest()` | Sintetiza regras (de habilidades), decisões (de fluxos destilados) e padrões (do histórico de ferramentas). |
| `SaveMemoryDigest()` / `LoadMemoryDigest()` | Persiste/restaura `digest.json` em/de `agent_state/memory/`. |
| `MemoryPrompt()` | Gera uma seção de prompt a partir do resumo consolidado para inclusão no prompt do sistema. |

### Persistência

| Método | Descrição |
|--------|-----------|
| `SaveState( cDir )` | Salva ferramentas de usuário e habilidades ativas em `user_tools.json`. |
| `LoadState( cDir )` | Restaura do disco ao iniciar. Também carrega habilidades do diretório `skills/`. |

### Checkpoints

Salvar/restaurar estado completo do agente para retomada de tarefas. Arquivos `.json` em `.agents/`.

| Método | Descrição |
|--------|-----------|
| `SaveCheckpoint( [cLabel] )` | Salva mensagens, plano, contexto compartilhado, objetivo e histórico de tools em `.agents/cp_N.json`. |
| `LoadCheckpoint( [nId] )` | Restaura estado a partir de checkpoint. `nId=0` carrega o último. |
| `ListCheckpoints()` | Lista todos os checkpoints disponíveis com id, label, passo, nº mensagens, nº tools. |
| `DeleteCheckpoint( nId )` | Remove checkpoint da memória e do disco. |
| `AutoCheckpoint()` | Executado internamente a cada `nCheckpointInterval` mensagens durante `Run()`. Desativado se o intervalo for 0. |
| `LoadCheckpoints()` | Carrega todos os `cp_*.json` de `.agents/` ao iniciar (chamado automaticamente por `New()`). |

Tools para o LLM: `save_checkpoint`, `list_checkpoints`, `load_checkpoint`, `delete_checkpoint`.

Campos do checkpoint: `id`, `step`, `label`, `ts`, `messages`, `plan`, `shared`, `goal`, `toolHistory`, `toolCount`, `model`, `maxSteps`.

### Tarefas

Tracking persistente de tarefas entre chamadas a `Run()`. Ciclo de vida: open → in_progress → done/blocked.

| Método | Descrição |
|--------|-----------|
| `TaskCreate( cSummary )` | Criar nova tarefa. Retorna ID auto-incremental. |
| `TaskList()` | Listar tarefas com ícones: `[ ]` aberta, `[>]` em progresso, `[!]` bloqueada, `[x]` concluída. |
| `TaskDone( nId )` | Marcar tarefa como concluída. |
| `TaskBlock( nId, cReason )` | Bloquear tarefa com motivo. |
| `TaskStart( nId )` | Marcar tarefa como em progresso. |

Tools para o LLM: `task_create`, `task_list`, `task_done`, `task_block`, `task_start`.

### Atores (Sub-Agentes Persistentes)

Sub-agentes de longa vida que sobrevivem além de uma chamada a `Run()`. Compartilham `aSharedContext` com o pai.

| Método | Descrição |
|--------|-----------|
| `ActorSpawn( cPrompt )` | Lançar agente em background em uma thread. Retorna ID. |
| `ActorWait( [nId] )` | Bloquear até terminar. Sem ID = esperar todos. |
| `ActorSend( nId, cMsg )` | Injetar mensagem em ator ativo via `bInject`. |
| `ActorList()` | Listar atores com estado e último resultado. |
| `ActorCancel( nId )` | Cancelar ator ativo via `Abort()`. |

Tools para o LLM: `spawn_actor`, `wait_actor`, `send_actor`, `list_actors`, `cancel_actor`.

### Utilitários

| Método | Descrição |
|--------|-----------|
| `AddMessage( cRole, cContent )` | Anexa ao array de conversação. Auto-comprime ao atingir 200 mensagens. |
| `UsageReport()` | Imprime contadores de tokens e custo estimado. |
| `Abort()` | Interrompe o loop do agente. |

## Membros DATA

| DATA | Tipo | Descrição |
|------|------|-----------|
| `aMessages` | Array | Conversa completa `{role, content}` |
| `aBuiltinTools` | Hash | `name → codeblock` para todas as ferramentas (integradas + usuário) |
| `aUserTools` | Hash | `name → {desc, script, type}` para ferramentas criadas pelo usuário |
| `aSkills` | Hash | `name → content` para todas as habilidades conhecidas |
| `aSkillsOn` | Array | Nomes das habilidades atualmente ativas |
| `cGoal` | String | Objetivo atual |
| `aPlan` | Array | Passos `{title, state}` |
| `aToolHistory` | Array | Histórico de chamadas de ferramentas `[{name, args, result, ts}]` |
| `aDistilled` | Array | Fluxos de trabalho descobertos `[{name, type, pattern, content}]` |
| `aMemoryDigest` | Hash | Memória consolidada `{rules, decisions, patterns, trajectory, notes, timestamp}` |
| `cMemoryDir` | String | Diretório base para arquivos de memória (`agent_state/memory/`) |
| `cModel` | String | ID do modelo (padrão: `deepseek-v4-pro`) |
| `nMaxSteps` | Numeric | Máx. de iterações por Run() (padrão: 14) |
| `nTokensIn/Out/Cache` | Numeric | Contadores de tokens para acompanhamento de custos |

## Exemplo

```harbour
PROCEDURE Main()
   LOCAL oAgent, cResult

   oAgent := Agent():New( "sk-xxxx" )

   // Registrar uma ferramenta personalizada
   oAgent:RegisterTool( "contar", ;
      "Conta linhas, palavras e caracteres de um arquivo", ;
      "contar.py" )

   // Criar e ativar uma habilidade
   oAgent:CreateSkill( "teste", ;
      "Responda sempre em português." + CRLF + ;
      "Verifique o disco antes de escrever código." + CRLF + ;
      "Escreva testes automaticamente." )
   oAgent:ToggleSkill( "teste", .T. )

   // Executar o agente
   cResult := oAgent:Run( "Crie um script Python que analise o disco" )

   ? "Resultado:", cResult
   oAgent:UsageReport()

RETURN
```

## Notas

- **Requer Harbour MT VM**: `DispatchAgents()` usa `hb_threadStart()` / `hb_threadJoin()`.
  Vincule contra `libhbvmmt` (VM multi-thread), não `libhbvm` (single-thread).
- **Chave API**: definida na construção ou via variável de ambiente `DEEPSEEK_API_KEY`.
- **Streaming**: `Step()` usa streaming SSE com `stream_options.include_usage` para
  métricas de tokens em tempo real. A resposta é analisada a partir dos fragmentos de dados SSE.
- **Interrupção/Injeção**: passe codeblocks `interrupt` e `inject` em `hOpts` para `New()`.
  `interrupt` retorna `.T.` para abortar o loop; `inject` retorna uma string para injetar
  como mensagem de usuário entre os passos.
- **Contrato**: o parâmetro `cContract` em `DispatchAgents()` é prefixado a cada
  prompt de sub-agente. Sem ele, os sub-agentes divergem na nomenclatura. Sempre forneça um.
