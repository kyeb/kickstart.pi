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
- **Haiku** — even cheaper and much faster. Good for exploration, search, formatting, simple rewrites.
- **Your current model** — only when the subtask needs deep reasoning.

Smaller models are significantly faster than your main model — a haiku sub-agent can explore a codebase and report back while you continue working.

List available models with `pi --list-models`.

## Notes

- Sub-agents inherit your API key from the shell environment. Make sure your key is configured via `pi /login` or set in your shell profile.
- Each sub-agent gets its own context — it won't see your conversation history.
- Use `tmux capture-pane -t <session> -p -S -` to capture the full scrollback, not just the visible pane.
