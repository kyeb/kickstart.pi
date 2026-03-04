---
name: web-fetch
description: "Fetch a web page and return its content as clean markdown. Use whenever you need to read any web content — documentation, articles, APIs, READMEs, blog posts. Always returns content to stdout; falls back gracefully through multiple extraction methods. Use --discover to explore a site's structure before fetching specific pages."
---

Fetch a URL and get markdown back:

```bash
bun run skills/web-fetch/scripts/fetch.ts https://docs.example.com/api
```

Get raw HTML instead (truncated to 10k chars):

```bash
bun run skills/web-fetch/scripts/fetch.ts --raw https://example.com
```

Explore a site's structure (use before fetching when you don't know the exact URL):

```bash
bun run skills/web-fetch/scripts/fetch.ts --discover example.com
```

Output goes to stdout, errors to stderr. On success (HTTP 200), always returns content — worst case is truncated raw HTML. On hard failure (network error, non-200 HTTP status), exits with code 1 and prints the error to stderr.
