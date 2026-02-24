# Background processes

For anything you're worried about timing out, or that needs to run in the background — builds, test suites, servers, watchers, parallel tasks — **always use tmux**. Do not use `&` or `nohup`; they won't persist across tool calls.

1. Start: `tmux new-session -d -s mybuild 'npm run build'`
2. Check: `sleep 10 && tmux capture-pane -t mybuild -p`
3. Kill: `tmux kill-session -t mybuild`
