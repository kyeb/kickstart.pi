---
name: web-fetch
description: "Fetch a web page and return its content as clean markdown. Use when you need to read documentation, articles, or any web content. Supports site discovery via --discover."
---

Fetch a URL and get markdown back:

```bash
bun run skills/web-fetch/fetch.ts https://docs.example.com/api
```

Get raw HTML instead (truncated to 10k chars):

```bash
bun run skills/web-fetch/fetch.ts --raw https://example.com
```

Discover a site's structure (tries /llms.txt, falls back to /sitemap.xml):

```bash
bun run skills/web-fetch/fetch.ts --discover example.com
```
