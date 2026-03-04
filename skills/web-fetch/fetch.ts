#!/usr/bin/env bun
import { defuddle } from "defuddle/node";
import { JSDOM } from "jsdom";
import { $ } from "bun";

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--discover")) {
    const domainIndex = args.indexOf("--discover") + 1;
    if (domainIndex >= args.length) {
      console.error("Error: --discover flag requires a domain argument.");
      process.exit(1);
    }
    const domain = args[domainIndex];
    await discover(domain);
    return;
  }

  const raw = args.includes("--raw");
  const url = args.find(arg => !arg.startsWith("--"));

  if (!url) {
    console.error("Error: URL argument is required.");
    process.exit(1);
  }

  if (raw) {
    const html = await fetchHtml(url);
    console.log(html.substring(0, 10000));
    return;
  }

  await fetchMarkdown(url);
}

async function fetchMarkdown(url: string) {
  try {
    // 1. Accept: text/markdown
    const mdResponse = await fetch(url, { headers: { "Accept": "text/markdown" } });
    if (mdResponse.ok && mdResponse.headers.get("content-type")?.includes("text/markdown")) {
      console.log(await mdResponse.text());
      return;
    }

    // 2. {url}.md
    const mdUrl = url.endsWith("/") ? `${url.slice(0, -1)}.md` : `${url}.md`;
    const mdUrlResponse = await fetch(mdUrl);
    if (mdUrlResponse.ok) {
      console.log(await mdUrlResponse.text());
      return;
    }
    
    const html = await fetchHtml(url);
    if (!html) {
        console.error(`Failed to fetch HTML from ${url}`);
        process.exit(1);
    }

    // 3. defuddle
    try {
      const dom = new JSDOM(html);
      const result = await defuddle(dom.window.document, { markdown: true });
      if (result?.content) {
        console.log(result.content);
        return;
      }
    } catch (e) {
      // Defuddle failed, continue to next step
    }

    // 4. pandoc
    try {
      await $`which pandoc`.quiet();
      const { stdout } = await $`echo ${html} | pandoc -f html -t markdown`.quiet();
      console.log(stdout.toString());
      return;
    } catch (e) {
      // pandoc not found or failed, continue
    }

    // 5. raw HTML
    console.log(html.substring(0, 10000));

  } catch (error) {
    if (error instanceof Error) {
        console.error(`Error fetching ${url}: ${error.message}`);
    } else {
        console.error(`An unknown error occurred while fetching ${url}`);
    }
    process.exit(1);
  }
}

async function discover(domain: string) {
  try {
    // Try llms.txt first
    const llmsUrl = `https://${domain}/llms.txt`;
    const llmsResponse = await fetch(llmsUrl);
    if (llmsResponse.ok) {
      console.log(await llmsResponse.text());
      return;
    }

    // Fallback to sitemap.xml
    const sitemapUrl = `https://${domain}/sitemap.xml`;
    const sitemapResponse = await fetch(sitemapUrl);
    if (sitemapResponse.ok) {
      console.log(await sitemapResponse.text());
      return;
    }
    
    console.error(`Could not find llms.txt or sitemap.xml for ${domain}`);
    process.exit(1)

  } catch (error) {
     if (error instanceof Error) {
        console.error(`Error during discovery for ${domain}: ${error.message}`);
    } else {
        console.error(`An unknown error occurred during discovery for ${domain}`);
    }
    process.exit(1);
  }
}

async function fetchHtml(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        if(error instanceof Error) {
            console.error(`Failed to fetch HTML from ${url}: ${error.message}`);
        } else {
            console.error(`An unknown error occurred while fetching HTML from ${url}`);
        }
        process.exit(1);
    }
}


main();
