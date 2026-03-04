# Web Fetch Skill

This skill provides a tool for fetching web pages and converting them to clean markdown. It can also be used for site discovery.

## Usage

The primary tool is `fetch.ts`, a Bun script that takes a URL and outputs markdown.

### Fetching a page as markdown

```bash
bun run skills/web-fetch/fetch.ts <url>
```

Example:
```bash
bun run skills/web-fetch/fetch.ts https://docs.example.com/api
```

### Fetching raw HTML

To get the raw, unprocessed HTML of a page (truncated to 10000 characters), use the `--raw` flag.

```bash
bun run skills/web-fetch/fetch.ts --raw <url>
```

Example:
```bash
bun run skills/web-fetch/fetch.ts --raw https://example.com
```

### Discovering site info

To find a site's `llms.txt` or `sitemap.xml`, use the `--discover` flag with a domain.

```bash
bun run skills/web-fetch/fetch.ts --discover <domain>
```

Example:
```bash
bun run skills/web-fetch/fetch.ts --discover example.com
```
