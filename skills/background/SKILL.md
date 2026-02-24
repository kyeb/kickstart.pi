---
name: background
description: "Use when a command takes more than ~1 minute, needs to persist (servers, watchers), or when running it in the background lets you continue making progress on other work in parallel. Examples: dev servers, long builds, background subagents. Do not use for short one-shot commands (typecheck, lint, quick tests) — just run those directly."
---

**Always use tmux.** Do not use `&` or `nohup`; they won't persist across tool calls.

Start: `tmux new-session -d -s mybuild 'npm test; tmux wait-for -S mybuild-done'`
Wait: `tmux wait-for mybuild-done`
Capture: `tmux capture-pane -t mybuild -p -S -`
Kill: `tmux kill-session -t mybuild`

Tips:
- `tmux wait-for -S` signals, `tmux wait-for` (no flag) blocks — use them as a pair
- Set `remain-on-exit on` if you need to capture output after the command exits
- `-S -` on `capture-pane` gets full scrollback, not just the visible pane
