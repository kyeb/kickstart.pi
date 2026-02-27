---
name: subagent
description: Use when a task is parallelizable, would consume many tokens (large file reads, codebase exploration, summarization), or involves grunt work that doesn't need your full reasoning ability. Spawn a sub-agent instead of doing it yourself.
---

## When to spawn

- **Parallel work** — multiple independent tasks (e.g. fix 3 bugs at once)
- **Token-heavy tasks** — exploring a codebase, reading large files, summarizing long output
- **Large content** — grepping through logs or files that would get cut off by context size limits

## How

```bash
tmux new-session -d -s NAME && \
  tmux send-keys -t NAME 'pi' Enter && sleep 1 && \
  tmux send-keys -t NAME 'PROMPT. When you are done, run: tmux wait-for -S NAME-done' Enter

tmux capture-pane -t NAME -p -S -
tmux kill-session -t NAME
tmux wait-for NAME-done
```

- The `sleep 1` is required — pi needs ~1s to boot its TUI.
- The "When you are done, run: tmux wait-for -S NAME-done" must be part of the prompt.
- Usually you don't need `wait-for` — keep working and check back with `capture-pane`.

## Important

- **Do NOT pipe or redirect pi's output** (no `| tee`, no `> file`). It breaks the TUI and makes `capture-pane` return blank.
- For simple one-shot tasks where you don't need to monitor progress, `pi -p "PROMPT"` is fine. Use the interactive approach above when you need visibility into intermediate steps.
- Each sub-agent starts with a fresh context. Give it everything it needs.

## Model selection

Default to your current model. Consider a smaller model when the task is purely token-heavy with low reasoning needs — reading many files, searching, counting, grepping logs. Launch with `pi --model claude-sonnet-4-6` or `pi --model claude-haiku-4-5` instead of `pi`.
