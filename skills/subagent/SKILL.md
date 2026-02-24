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

```bash
pi -p "summarize src/utils.ts"
```

For longer tasks, use `/skill:background` to avoid timeouts.

## Context

Each sub-agent starts with a new, empty context. Give it all the information it needs to complete the task — file paths, specific instructions, expected output format — but don't over-explain things the model already knows.

## Model selection

Default to your current model. Consider a smaller model when the task is purely token-heavy with low reasoning needs — reading many files, searching, counting, grepping logs.

```bash
pi -p "read all files in src/ and list every export" --model haiku        # anthropic
pi -p "read all files in src/ and list every export" --model codex-mini   # openai
```

List available models with `pi --list-models`.
