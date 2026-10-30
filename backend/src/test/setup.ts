import { ipKeyGenerator } from "express-rate-limit";
import { beforeEach } from "vitest";

const LOCAL_IPS = ["::ffff:127.0.0.1", "127.0.0.1", "::1"].map((ip) => ipKeyGenerator(ip));

beforeEach(async () => {
  const [{ authLimiter }, { demoLimiter }, { refreshLimiter }] = await Promise.all([
    import("../modules/auth/auth.routes.js"),
    import("../modules/demo/demo.routes.js"),
    import("../modules/links/links.routes.js"),
  ]);
  for (const limiter of [authLimiter, demoLimiter, refreshLimiter]) {
    for (const key of LOCAL_IPS) await limiter.resetKey(key);
  }
});
