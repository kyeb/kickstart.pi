---
name: subagent
description: Use when a task is parallelizable, would consume many tokens (large file reads, codebase exploration, summarization), or involves grunt work that doesn't need your full reasoning ability. Spawn a sub-agent instead of doing it yourself.
---

# Sub-agents

You can spawn yourself as a sub-agent with `pi -p "task"`.

## When to spawn

- **Parallel work** — multiple independent tasks (e.g. fix 3 bugs at once)
- **Token-heavy tasks** — exploring a codebase, reading large files, summarizing long output
- **Grunt work** — search-and-replace, formatting, boilerplate generation

## How

For quick tasks:
```bash
pi -p "summarize src/utils.ts" --model sonnet
```

For longer tasks, use the background skill:
```bash
tmux new-session -d -s task1 'pi -p "refactor the auth module" --model sonnet'
sleep 30 && tmux capture-pane -t task1 -p
```

## Model selection

- **Sonnet** — default for sub-agents. Handles most coding, summarization, and exploration.
- **Haiku** — even cheaper. Good for pure grunt work: search, formatting, simple rewrites.
- **Your current model** — only when the subtask needs deep reasoning.

List available models with `pi --list-models`.
