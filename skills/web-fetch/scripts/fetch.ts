#!/usr/bin/env bun

const MAX_RAW_CHARS = 10000;

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--discover")) {
    const idx = args.indexOf("--discover") + 1;
    if (idx >= args.length) {
      console.error("Error: --discover requires a domain argument");
      process.exit(1);
    }
    await discover(args[idx]);
    return;
  }

  const raw = args.includes("--raw");
  const url = args.find((a) => !a.startsWith("--"));

  if (!url) {
    console.error("Error: URL argument is required");
    process.exit(1);
  }

  if (raw) {
    const html = await fetchText(url);
    console.log(html.substring(0, MAX_RAW_CHARS));
    return;
  }

  await fetchMarkdown(url);
}

async function fetchMarkdown(url: string) {
  // 1. Content negotiation: Accept: text/markdown
  try {
    const res = await fetch(url, {
      headers: { Accept: "text/markdown" },
      redirect: "follow",
    });
    if (
      res.ok &&
      res.headers.get("content-type")?.includes("text/markdown")
    ) {
      console.log(await res.text());
      return;
    }
  } catch {}

  // 2. Try {url}.md
  try {
    const mdUrl = url.replace(/\/$/, "") + ".md";
    const res = await fetch(mdUrl, { redirect: "follow" });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("text/html")) {
        console.log(await res.text());
        return;
      }
    }
  } catch {}

  // 3. Defuddle via bunx (auto-resolves its own deps)
  try {
    const proc = Bun.spawn(["bunx", "defuddle", "parse", url, "--markdown"], {
      stdout: "pipe",
      stderr: "ignore",
    });
    const output = await new Response(proc.stdout).text();
    const code = await proc.exited;
    if (code === 0 && output.trim()) {
      console.log(output);
      return;
    }
  } catch {}

  // 4. Pandoc (if available)
  try {
    const html = await fetchText(url);
    const proc = Bun.spawn(["pandoc", "-f", "html", "-t", "markdown"], {
      stdin: new Blob([html]),
      stdout: "pipe",
      stderr: "ignore",
    });
    const output = await new Response(proc.stdout).text();
    const code = await proc.exited;
    if (code === 0 && output.trim()) {
      console.log(output);
      return;
    }
  } catch {}

  // 5. Raw HTML fallback
  const html = await fetchText(url);
  console.log(html.substring(0, MAX_RAW_CHARS));
}

async function discover(domain: string) {
  try {
    const res = await fetch(`https://${domain}/llms.txt`, {
      redirect: "follow",
    });
    if (res.ok) {
      console.log(await res.text());
      return;
    }
  } catch {}

  try {
    const res = await fetch(`https://${domain}/sitemap.xml`, {
      redirect: "follow",
    });
    if (res.ok) {
      console.log(await res.text());
      return;
    }
  } catch {}

  console.error(`Could not find llms.txt or sitemap.xml for ${domain}`);
  process.exit(1);
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    console.error(`HTTP ${res.status} fetching ${url}`);
    process.exit(1);
  }
  return res.text();
}

main();
