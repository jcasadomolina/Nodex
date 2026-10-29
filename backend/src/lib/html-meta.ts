const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeEntities(text: string) {
  return text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const value = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isNaN(value) ? match : String.fromCodePoint(value);
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

function clean(value: string | undefined, max: number) {
  const text = value && decodeEntities(value).replace(/\s+/g, " ").trim();
  return text ? text.slice(0, max) : null;
}

function readAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  for (const [, name, quoted, single, bare] of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attributes[name!.toLowerCase()] = quoted ?? single ?? bare ?? "";
  }
  return attributes;
}

export function parsePreview(html: string, pageUrl: string) {
  const headEnd = html.search(/<\/head>/i);
  const head = headEnd === -1 ? html.slice(0, 200_000) : html.slice(0, headEnd);

  const meta: Record<string, string> = {};
  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    const { property, name, content } = readAttributes(tag);
    const key = (property ?? name)?.toLowerCase();
    if (key && content && !(key in meta)) meta[key] = content;
  }
  const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];

  let imageUrl: string | null = null;
  const image = meta["og:image"] ?? meta["twitter:image"];
  if (image) {
    const resolved = new URL(decodeEntities(image), pageUrl);
    if (resolved.protocol === "https:" || resolved.protocol === "http:") imageUrl = resolved.href;
  }

  return {
    title: clean(meta["og:title"] ?? meta["twitter:title"] ?? titleTag, 300),
    description: clean(meta["og:description"] ?? meta["twitter:description"] ?? meta["description"], 1000),
    imageUrl,
    siteName: clean(meta["og:site_name"], 100) ?? new URL(pageUrl).hostname.replace(/^www\./, ""),
  };
}

const WORDS_PER_MINUTE = 200;
const MIN_ARTICLE_WORDS = 100;
const NOISE_TAGS = new Set(["script", "style", "noscript", "nav", "header", "footer", "aside", "svg"]);

function tagAt(lower: string, index: number) {
  return /^<(\/?)([a-z][a-z0-9-]*)/.exec(lower.slice(index, index + 20));
}

function stripNoise(html: string) {
  const lower = html.toLowerCase();
  const parts: string[] = [];
  let from = 0;
  let index = lower.indexOf("<");
  while (index !== -1) {
    const tag = tagAt(lower, index);
    if (tag && !tag[1] && NOISE_TAGS.has(tag[2]!)) {
      parts.push(html.slice(from, index), " ");
      const close = lower.indexOf(`</${tag[2]}`, index);
      if (close === -1) return parts.join("");
      from = close + tag[2]!.length + 2;
    }
    index = lower.indexOf("<", Math.max(index + 1, from));
  }
  parts.push(html.slice(from));
  return parts.join("");
}

function outer(html: string, lower: string, name: string) {
  const open = lower.indexOf(`<${name}`);
  if (open === -1 || /[a-z0-9-]/.test(lower[open + name.length + 1] ?? "")) return null;
  const close = lower.lastIndexOf(`</${name}`);
  return html.slice(open, close > open ? close : undefined);
}

function paragraphs(html: string) {
  const lower = html.toLowerCase();
  const texts: string[] = [];
  let close = lower.indexOf("</p");
  let index = lower.indexOf("<p");
  while (index !== -1) {
    const next = lower.indexOf("<p", index + 2);
    const tag = tagAt(lower, index);
    if (tag?.[2] === "p") {
      if (close !== -1 && close < index) close = lower.indexOf("</p", index);
      const end = [next, close].filter((i) => i !== -1).reduce((a, b) => Math.min(a, b), html.length);
      const gt = lower.slice(index, index + 500).indexOf(">");
      texts.push(html.slice(gt === -1 ? index + 2 : index + gt + 1, end));
    }
    index = next;
  }
  return texts.join(" ");
}

export function readingMinutes(html: string) {
  const cleaned = stripNoise(html);
  const lower = cleaned.toLowerCase();
  const container = outer(cleaned, lower, "article") ?? outer(cleaned, lower, "main") ?? outer(cleaned, lower, "body") ?? cleaned;
  const text = decodeEntities(paragraphs(container).replace(/<[^<>]*>?/g, " "));
  const count = text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
  return count < MIN_ARTICLE_WORDS ? null : Math.max(1, Math.round(count / WORDS_PER_MINUTE));
}
