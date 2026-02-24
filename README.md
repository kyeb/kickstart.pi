# kickstart.pi

An opinionated [pi](https://pi.dev) setup that gets you up and running fast.

- **claude-md-loader** — loads [CLAUDE.md files](https://docs.anthropic.com/en/docs/claude-code/memory) the same way Claude Code does: user-level, parent directory traversal, `.claude/rules/`, `@path` imports, and subdirectory lazy-loading
- **background** — teaches pi to use tmux for long-running commands, servers, and parallel tasks instead of timing out
- **subagent** — teaches pi to spawn sub-agents (`pi -p "task"`) for parallel work, token-heavy exploration, and grunt work using cheaper/faster models

## Install

```bash
npm install -g @mariozechner/pi-coding-agent
pi install git:github.com/kyeb/kickstart.pi
```
