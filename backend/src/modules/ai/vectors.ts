export function toVector(values: number[]) {
  return `[${values.join(",")}]`;
}

export function nodexText(nodex: { title: string; content: string | null; url: string | null }) {
  const parts = [nodex.title, nodex.content?.slice(0, 2000)];
  if (nodex.url) {
    const { hostname, pathname, searchParams } = new URL(nodex.url);
    const words = [pathname, ...searchParams.values()].join(" ").replace(/[/_.=+-]+/g, " ");
    parts.push(hostname.replace(/^www\./, ""), words);
  }
  return parts.filter(Boolean).join(". ");
}
