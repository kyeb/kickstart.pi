import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve, relative } from "node:path";
import { homedir } from "node:os";

const INSTRUCTION_FILES = ["CLAUDE.md", "CLAUDE.local.md"];

function safeRead(path: string): string {
  try { return readFileSync(path, "utf-8").trim(); } catch { return ""; }
}

function resolveImports(text: string, baseDir: string, seen: Set<string>): string {
  // Strip code blocks and inline code before matching @imports
  const held: string[] = [];
  const stripped = text
    .replace(/```[\s\S]*?```/g, (m) => `\0${held.push(m) - 1}\0`)
    .replace(/`[^`]+`/g, (m) => `\0${held.push(m) - 1}\0`);

  const resolved = stripped.replace(/(?:^|(?<=\s))@((?:~\/)?[\w./-]+)/gm, (full, p) => {
    const abs = resolve(baseDir, p.replace(/^~\//, homedir() + "/"));
    if (seen.has(abs) || !existsSync(abs)) return full;
    seen.add(abs);
    const content = safeRead(abs);
    return content ? resolveImports(content, dirname(abs), seen) : full;
  });

  return resolved.replace(/\0(\d+)\0/g, (_, i) => held[+i]);
}

function loadFile(absPath: string, seen = new Set<string>()): string {
  if (seen.has(absPath) || !existsSync(absPath)) return "";
  seen.add(absPath);
  const content = safeRead(absPath);
  if (!content) return "";
  return resolveImports(content, dirname(absPath), seen);
}

function loadDir(dir: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const name of INSTRUCTION_FILES) {
    const abs = join(dir, name);
    const content = loadFile(abs);
    if (content) result.set(abs, content);
  }
  const claudeMd = join(dir, ".claude", "CLAUDE.md");
  if (existsSync(claudeMd)) {
    const content = loadFile(claudeMd);
    if (content) result.set(claudeMd, content);
  }
  const rulesDir = join(dir, ".claude", "rules");
  if (existsSync(rulesDir)) {
    for (const f of readdirSync(rulesDir).filter((f) => f.endsWith(".md"))) {
      const abs = join(rulesDir, f);
      const content = loadFile(abs);
      if (content) result.set(abs, content);
    }
  }
  return result;
}

function walkUp(cwd: string): string[] {
  const dirs: string[] = [];
  let dir = cwd;
  while (true) {
    dirs.unshift(dir);
    const parent = dirname(dir);
    if (parent === dir || parent === "/") break;
    dir = parent;
  }
  return dirs;
}

export default function (pi: ExtensionAPI) {
  const home = homedir();
  const lazyLoaded = new Set<string>();

  pi.on("session_start", async () => {
    lazyLoaded.clear();
  });

  pi.on("before_agent_start", async (event, ctx) => {
    const parts: string[] = [];
    const add = (abs: string, content: string) => {
      const label = abs.startsWith(home + "/")
        ? "~" + abs.slice(home.length)
        : relative(ctx.cwd, abs);
      parts.push(`## ${label}\n\n${content}`);
    };

    // User-level: ~/.claude/CLAUDE.md and ~/.claude/rules/
    const userDir = join(home, ".claude");
    const userMd = join(userDir, "CLAUDE.md");
    const userContent = loadFile(userMd);
    if (userContent) add(userMd, userContent);
    const userRules = join(userDir, "rules");
    if (existsSync(userRules)) {
      for (const f of readdirSync(userRules).filter((f) => f.endsWith(".md"))) {
        const abs = join(userRules, f);
        const content = loadFile(abs);
        if (content) add(abs, content);
      }
    }

    // Walk ancestors down to cwd
    for (const dir of walkUp(ctx.cwd)) {
      for (const [abs, content] of loadDir(dir)) add(abs, content);
    }

    // Subdirectory files lazy-loaded this session
    for (const abs of lazyLoaded) {
      const content = loadFile(abs);
      if (content) add(abs, content);
    }

    if (parts.length === 0) return;
    return { systemPrompt: event.systemPrompt + "\n\n" + parts.join("\n\n") };
  });

  pi.on("tool_result", async (event, ctx) => {
    if (event.toolName !== "read") return;
    const readPath: string | undefined = (event as any).input?.path;
    if (!readPath) return;

    const readDir = dirname(resolve(ctx.cwd, readPath));
    if (!readDir.startsWith(ctx.cwd + "/")) return;

    const newBlocks: string[] = [];
    for (const [abs, content] of loadDir(readDir)) {
      if (lazyLoaded.has(abs)) continue;
      lazyLoaded.add(abs);
      const rel = relative(ctx.cwd, abs);
      newBlocks.push(`[claude-md-loader] ${rel}\n\n${content}`);
    }

    if (newBlocks.length === 0) return;
    return {
      content: [
        { type: "text" as const, text: newBlocks.join("\n\n") },
        ...event.content,
      ],
    };
  });
}
