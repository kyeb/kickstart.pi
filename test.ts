import { test } from "node:test";
import assert from "node:assert";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, chmodSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import mod from "./extensions/claude-md-loader.ts";

const mockApi = () => {
  const h: Record<string, Function> = {};
  return {
    on: (e: string, fn: Function) => { h[e] = fn; },
    fire: (e: string, ...a: any[]) => h[e]?.(...a),
  };
};

const scaffold = () => {
  const root = mkdtempSync(join(tmpdir(), "cl-test-"));
  const home = join(root, "_home");
  mkdirSync(join(home, ".claude"), { recursive: true });
  const origHome = process.env.HOME;
  process.env.HOME = home;
  const write = (rel: string, content: string) => {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  };
  const cleanup = () => {
    process.env.HOME = origHome;
    rmSync(root, { recursive: true });
  };
  return { root, home, write, cleanup };
};

const ctx = (cwd: string) => ({ cwd, sessionManager: { getEntries: () => [] } });
const prompt = (sp = "") => ({ systemPrompt: sp });
const readEvt = (path: string) => ({ toolName: "read", input: { path }, content: [] });

test("walks up from cwd, loads all CLAUDE.md variants", async (t) => {
  const { root, write, cleanup } = scaffold();
  t.after(cleanup);
  write("parent/CLAUDE.md", "parent rule");
  write("parent/project/CLAUDE.md", "project rule");
  write("parent/project/CLAUDE.local.md", "local rule");
  write("parent/project/.claude/CLAUDE.md", "dotclaude rule");
  write("parent/project/.claude/rules/lint.md", "lint rule");

  const api = mockApi();
  mod(api as any);
  await api.fire("session_start");
  const { systemPrompt: sp } = await api.fire("before_agent_start", prompt(), ctx(join(root, "parent", "project")));

  assert.ok(sp.includes("parent rule"), "walks up to parent");
  assert.ok(sp.includes("project rule"), "CLAUDE.md");
  assert.ok(sp.includes("local rule"), "CLAUDE.local.md");
  assert.ok(sp.includes("dotclaude rule"), ".claude/CLAUDE.md");
  assert.ok(sp.includes("lint rule"), ".claude/rules/*.md");
});

test("loads user-level ~/.claude/CLAUDE.md", async (t) => {
  const { root, home, write, cleanup } = scaffold();
  t.after(cleanup);
  writeFileSync(join(home, ".claude", "CLAUDE.md"), "user rule");
  write("project/CLAUDE.md", "project rule");

  const api = mockApi();
  mod(api as any);
  await api.fire("session_start");
  const { systemPrompt: sp } = await api.fire("before_agent_start", prompt(), ctx(join(root, "project")));

  assert.ok(sp.includes("user rule"), "loads ~/.claude/CLAUDE.md");
  assert.ok(sp.includes("project rule"), "also loads project CLAUDE.md");
});

test("re-injects on every turn", async (t) => {
  const { root, write, cleanup } = scaffold();
  t.after(cleanup);
  write("project/CLAUDE.md", "project rule");
  const cwd = join(root, "project");

  const api = mockApi();
  mod(api as any);
  await api.fire("session_start");
  const c = ctx(cwd);
  const r1 = await api.fire("before_agent_start", prompt(), c);
  const r2 = await api.fire("before_agent_start", prompt(), c);

  assert.ok(r1.systemPrompt.includes("project rule"), "turn 1");
  assert.ok(r2.systemPrompt.includes("project rule"), "turn 2");
});

test("lazy-loads subdirectory CLAUDE.md on file read", async (t) => {
  const { root, write, cleanup } = scaffold();
  t.after(cleanup);
  write("project/src/feature/CLAUDE.md", "feature rule");
  const cwd = join(root, "project");

  const api = mockApi();
  mod(api as any);
  await api.fire("session_start");

  const r1 = await api.fire("tool_result", readEvt(resolve(cwd, "src/feature/comp.ts")), { cwd });
  assert.ok(r1.content[0].text.includes("feature rule"), "lazy-loads on read");

  const r2 = await api.fire("tool_result", readEvt(resolve(cwd, "src/feature/other.ts")), { cwd });
  assert.equal(r2, undefined, "no double injection");
});

test("resolves @path imports", async (t) => {
  const { root, write, cleanup } = scaffold();
  t.after(cleanup);
  write("project/shared.md", "shared content");
  write("project/CLAUDE.md", "main. See @shared.md for more.");

  const api = mockApi();
  mod(api as any);
  await api.fire("session_start");
  const { systemPrompt: sp } = await api.fire("before_agent_start", prompt(), ctx(join(root, "project")));

  assert.ok(sp.includes("shared content"), "resolves @path");
  assert.ok(!sp.includes("@shared.md"), "replaces reference");
});

test("does not resolve @path inside code blocks or inline code", async (t) => {
  const { root, write, cleanup } = scaffold();
  t.after(cleanup);
  write("project/secret.md", "SHOULD NOT APPEAR");
  write("project/CLAUDE.md", [
    "rule one",
    "```",
    "@secret.md",
    "```",
    "also `@secret.md` here",
  ].join("\n"));

  const api = mockApi();
  mod(api as any);
  await api.fire("session_start");
  const { systemPrompt: sp } = await api.fire("before_agent_start", prompt(), ctx(join(root, "project")));

  assert.ok(!sp.includes("SHOULD NOT APPEAR"), "@path in code not resolved");
  assert.ok(sp.includes("@secret.md"), "raw @path preserved in code");
});

test("handles circular @path imports", async (t) => {
  const { root, write, cleanup } = scaffold();
  t.after(cleanup);
  write("project/a.md", "from a. @b.md");
  write("project/b.md", "from b. @a.md");
  write("project/CLAUDE.md", "root. @a.md");

  const api = mockApi();
  mod(api as any);
  await api.fire("session_start");
  const { systemPrompt: sp } = await api.fire("before_agent_start", prompt(), ctx(join(root, "project")));

  assert.ok(sp.includes("from a"), "loads a");
  assert.ok(sp.includes("from b"), "loads b");
  assert.ok(!sp.includes("SHOULD NOT APPEAR"), "no infinite loop");
});

test("skips empty CLAUDE.md", async (t) => {
  const { root, write, cleanup } = scaffold();
  t.after(cleanup);
  write("project/CLAUDE.md", "");
  write("project/CLAUDE.local.md", "  \n  ");

  const api = mockApi();
  mod(api as any);
  await api.fire("session_start");
  const result = await api.fire("before_agent_start", prompt(), ctx(join(root, "project")));

  assert.equal(result, undefined, "no injection for empty files");
});

test("survives unreadable files", async (t) => {
  const { root, write, cleanup } = scaffold();
  t.after(cleanup);
  write("project/CLAUDE.md", "good rule");
  write("project/CLAUDE.local.md", "secret");
  chmodSync(join(root, "project", "CLAUDE.local.md"), 0o000);

  const api = mockApi();
  mod(api as any);
  await api.fire("session_start");
  const { systemPrompt: sp } = await api.fire("before_agent_start", prompt(), ctx(join(root, "project")));

  assert.ok(sp.includes("good rule"), "readable file loads");
  assert.ok(!sp.includes("secret"), "unreadable file skipped");

  // Restore permissions so cleanup can delete it
  chmodSync(join(root, "project", "CLAUDE.local.md"), 0o644);
});
