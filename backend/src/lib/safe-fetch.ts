import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";

const MAX_BYTES = 1024 * 1024;
const TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 3;

export class BlockedUrlError extends Error {}

const blockList = new net.BlockList();
const privateRanges: [string, number, "ipv4" | "ipv6"][] = [
  ["0.0.0.0", 8, "ipv4"],
  ["10.0.0.0", 8, "ipv4"],
  ["100.64.0.0", 10, "ipv4"],
  ["127.0.0.0", 8, "ipv4"],
  ["169.254.0.0", 16, "ipv4"],
  ["172.16.0.0", 12, "ipv4"],
  ["192.0.0.0", 24, "ipv4"],
  ["192.168.0.0", 16, "ipv4"],
  ["198.18.0.0", 15, "ipv4"],
  ["224.0.0.0", 4, "ipv4"],
  ["240.0.0.0", 4, "ipv4"],
  ["::", 128, "ipv6"],
  ["::1", 128, "ipv6"],
  ["64:ff9b::", 96, "ipv6"],
  ["fc00::", 7, "ipv6"],
  ["fe80::", 10, "ipv6"],
  ["ff00::", 8, "ipv6"],
];
for (const [address, prefix, type] of privateRanges) {
  blockList.addSubnet(address, prefix, type);
}

function isBlocked(address: string) {
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return blockList.check(mapped[1]!, "ipv4");
  return blockList.check(address, net.isIPv6(address) ? "ipv6" : "ipv4");
}

function safeLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void,
) {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "");
    if (addresses.length === 0 || addresses.some((a) => isBlocked(a.address))) {
      return callback(new BlockedUrlError(`Dirección no permitida: ${hostname}`), "");
    }
    if (options.all) return callback(null, addresses);
    callback(null, addresses[0]!.address, addresses[0]!.family);
  });
}

function decode(body: Buffer, contentType: string) {
  const charset = contentType.match(/charset=([\w-]+)/i)?.[1] ?? "utf-8";
  try {
    return new TextDecoder(charset).decode(body);
  } catch {
    return new TextDecoder("utf-8").decode(body);
  }
}

type Response = { status: number; contentType: string; location?: string; body: string | null };

function requestOnce(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BlockedUrlError(`Protocolo no permitido: ${url.protocol}`);
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) && isBlocked(host)) {
    throw new BlockedUrlError(`Dirección no permitida: ${host}`);
  }

  return new Promise<Response>((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const req = client.get(
      url,
      {
        lookup: safeLookup as net.LookupFunction,
        timeout: TIMEOUT_MS,
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; NodexBot/1.0)",
          accept: "text/html,application/xhtml+xml",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const contentType = res.headers["content-type"] ?? "";

        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          return resolve({ status, contentType, location: res.headers.location, body: null });
        }
        if (!contentType.includes("html")) {
          res.destroy();
          return resolve({ status, contentType, body: null });
        }

        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
          size += chunk.length;
          if (size >= MAX_BYTES) res.destroy();
        });
        res.on("close", () => resolve({ status, contentType, body: decode(Buffer.concat(chunks), contentType) }));
      },
    );
    req.on("timeout", () => req.destroy(new Error("Tiempo de espera agotado")));
    req.on("error", reject);
  });
}

export async function safeFetch(url: string) {
  let current = new URL(url);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    const res = await requestOnce(current);
    if (!res.location) return { ...res, finalUrl: current.href };
    current = new URL(res.location, current);
  }
  throw new Error("Demasiadas redirecciones");
}
