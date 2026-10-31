export const NEW_GROUP_SIMILARITY = 0.55;
export const MIN_NEW_GROUP_SIZE = 3;
export const MAX_NEW_GROUP_SIZE = 20;
export const KEYWORD_BONUS = 0.3;
export const MIN_PAIR_SIMILARITY = NEW_GROUP_SIMILARITY - KEYWORD_BONUS;
const DEFAULT_NAME = "Grupo sugerido";

const STOPWORDS = new Set(
  (
    "las los del una uno unos unas para por con sin sobre entre como pero que mas muy este esta estos estas ese esa eso " +
    "the and for with from that this your you are was how what why when into about his her its our their not"
  ).split(" "),
);

export type Pair = { a: string; b: string; similarity: number };

type NodexWords = { title: string; tags: string[] };

export function clusterByNeighbors(ids: string[], pairs: Pair[]) {
  const neighbors = new Map(ids.map((id) => [id, [] as { id: string; similarity: number }[]]));
  for (const { a, b, similarity } of pairs) {
    neighbors.get(a)?.push({ id: b, similarity });
    neighbors.get(b)?.push({ id: a, similarity });
  }

  const free = new Set(ids);
  const clusters: string[][] = [];
  while (true) {
    let center: string | null = null;
    let most = -1;
    for (const id of free) {
      const count = neighbors.get(id)!.filter((n) => free.has(n.id)).length;
      if (count > most) [center, most] = [id, count];
    }
    if (center === null) break;

    const closest = neighbors
      .get(center)!
      .filter((n) => free.has(n.id))
      .sort((x, y) => y.similarity - x.similarity);
    const members = [center, ...closest.slice(0, MAX_NEW_GROUP_SIZE - 1).map((n) => n.id)];
    if (members.length < MIN_NEW_GROUP_SIZE) break;
    clusters.push(members);
    for (const id of members) free.delete(id);
  }
  return clusters;
}

const normalize = (word: string) => word.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

function titleWords(title: string) {
  return title
    .split(/[^\p{L}\p{N}]+/u)
    .map((raw) => ({ raw, key: normalize(raw) }))
    .filter(({ key }) => key.length >= 3 && !STOPWORDS.has(key));
}

export function boostPairs(nodexs: Map<string, NodexWords>, pairs: Pair[]) {
  const words = new Map(
    [...nodexs].map(([id, n]) => [id, new Set([...titleWords(n.title).map((w) => w.key), ...n.tags.map(normalize)])]),
  );
  return pairs
    .map((pair) => {
      const shared = [...(words.get(pair.a) ?? [])].some((w) => words.get(pair.b)?.has(w));
      return { ...pair, similarity: pair.similarity + (shared ? KEYWORD_BONUS : 0) };
    })
    .filter((pair) => pair.similarity >= NEW_GROUP_SIMILARITY);
}

function ranked(counts: Map<string, number>, min: number) {
  return [...counts].filter(([, count]) => count >= min).sort((x, y) => y[1] - x[1]).map(([key]) => key);
}

export function suggestName(nodexs: NodexWords[], taken: Set<string>) {
  const tagCounts = new Map<string, number>();
  const tagForms = new Map<string, Map<string, number>>();
  for (const tag of nodexs.flatMap((n) => n.tags)) {
    const key = normalize(tag);
    tagCounts.set(key, (tagCounts.get(key) ?? 0) + 1);
    const variants = tagForms.get(key) ?? new Map<string, number>();
    variants.set(tag, (variants.get(tag) ?? 0) + 1);
    tagForms.set(key, variants);
  }

  const wordCounts = new Map<string, number>();
  const forms = new Map<string, Map<string, number>>();
  for (const { title } of nodexs) {
    const words = new Set<string>();
    for (const { raw, key } of titleWords(title)) {
      words.add(key);
      const variants = forms.get(key) ?? new Map<string, number>();
      variants.set(raw.toLowerCase(), (variants.get(raw.toLowerCase()) ?? 0) + 1);
      forms.set(key, variants);
    }
    for (const key of words) wordCounts.set(key, (wordCounts.get(key) ?? 0) + 1);
  }

  const candidates = [
    ...ranked(tagCounts, Math.ceil(nodexs.length / 2)).map((key) => ranked(tagForms.get(key)!, 1)[0]!),
    ...ranked(wordCounts, Math.max(2, Math.ceil(nodexs.length / 3)))
      .filter((key) => !/^\d+$/.test(key))
      .map((key) => ranked(forms.get(key)!, 1)[0]!),
  ].map(capitalize);

  const name = candidates.find((candidate) => !taken.has(candidate.toLowerCase()));
  if (name) return name;
  for (let n = 1; ; n++) {
    const fallback = n === 1 ? DEFAULT_NAME : `${DEFAULT_NAME} ${n}`;
    if (!taken.has(fallback.toLowerCase())) return fallback;
  }
}
