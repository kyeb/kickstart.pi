---
name: background
description: Use when running long-running commands, background processes, or parallel tasks. Use when any command might time out — builds, test suites, servers, linters, watchers. Also use when you need to run something while continuing other work.
---

# Background processes

**Always use tmux.** Do not use `&` or `nohup`; they won't persist across tool calls.

Start: `tmux new-session -d -s mybuild 'npm test; tmux wait-for -S mybuild-done'`
Wait: `tmux wait-for mybuild-done`
Capture: `tmux capture-pane -t mybuild -p -S -`
Kill: `tmux kill-session -t mybuild`

Tips:
- `tmux wait-for -S` signals, `tmux wait-for` (no flag) blocks — use them as a pair
- Set `remain-on-exit on` if you need to capture output after the command exits
- `-S -` on `capture-pane` gets full scrollback, not just the visible pane
