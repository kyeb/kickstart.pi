---
name: subagent
description: Use when a task is parallelizable, would consume many tokens (large file reads, codebase exploration, summarization), or involves grunt work that doesn't need your full reasoning ability. Spawn a sub-agent instead of doing it yourself.
---

# Sub-agents

You can spawn yourself as a sub-agent with `pi -p "task"`.

## When to spawn

- **Parallel work** — multiple independent tasks (e.g. fix 3 bugs at once)
- **Token-heavy tasks** — exploring a codebase, reading large files, summarizing long output
- **Large content** — grepping through logs or files that would get cut off by context size limits

## How

For quick tasks:
```bash
pi -p "summarize src/utils.ts"
```

For longer tasks, use the background skill:
```bash
tmux new-session -d -s task1 'pi -p "refactor the auth module"'
sleep 30 && tmux capture-pane -t task1 -p
```

## Model selection

Default to your current model. Consider a smaller model when the task is purely token-heavy with low reasoning needs — reading many files, searching, counting, grepping logs.

```bash
pi -p "read all files in src/ and list every export" --model haiku        # anthropic
pi -p "read all files in src/ and list every export" --model codex-mini   # openai
```

List available models with `pi --list-models`.

## Notes

- Sub-agents inherit your API key from the shell environment. Make sure your key is configured via `pi /login` or set in your shell profile.
- Each sub-agent gets its own context — it won't see your conversation history.
- Use `tmux capture-pane -t <session> -p -S -` to capture the full scrollback, not just the visible pane.
