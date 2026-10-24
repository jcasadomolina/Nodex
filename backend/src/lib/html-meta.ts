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
