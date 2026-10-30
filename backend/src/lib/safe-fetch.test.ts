import { expect, test } from "vitest";
import { BlockedUrlError, safeFetch } from "./safe-fetch.js";

test.each(["http://127.0.0.1", "http://10.0.0.1", "http://192.168.1.1", "http://169.254.169.254", "http://[::1]"])(
  "bloquea la dirección interna %s",
  async (url) => {
    await expect(safeFetch(url)).rejects.toBeInstanceOf(BlockedUrlError);
  },
);

test("bloquea protocolos que no son web", async () => {
  await expect(safeFetch("file:///etc/passwd")).rejects.toBeInstanceOf(BlockedUrlError);
});
