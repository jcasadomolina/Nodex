import { expect, test } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { createDemoUser } from "./demo.service.js";
import { purgeDemos } from "./demo.worker.js";

async function sessionFor(userId: string) {
  const sid = `test-${userId}`;
  await prisma.$executeRaw`INSERT INTO sessions (sid, sess, expire) VALUES (${sid}, ${JSON.stringify({ userId })}::json, now() + interval '1 day')`;
  return sid;
}

const sessionExists = async (sid: string) =>
  (await prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int AS count FROM sessions WHERE sid = ${sid}`)[0]!.count === 1;

test("borra las demos caducadas con sus datos y su sesión, y no toca las convertidas", async () => {
  const expired = await createDemoUser();
  const converted = await createDemoUser();
  const active = await createDemoUser();
  await prisma.user.update({ where: { id: expired.userId }, data: { demoExpiresAt: new Date(Date.now() - 1000) } });
  await prisma.user.update({ where: { id: converted.userId }, data: { demoExpiresAt: null, email: `convertida-${converted.userId}@ejemplo.com` } });
  const expiredSid = await sessionFor(expired.userId);
  const convertedSid = await sessionFor(converted.userId);

  expect(await purgeDemos()).toBeGreaterThanOrEqual(1);

  expect(await prisma.user.count({ where: { id: expired.userId } })).toBe(0);
  expect(await prisma.nodex.count({ where: { userId: expired.userId } })).toBe(0);
  expect(await sessionExists(expiredSid)).toBe(false);
  expect(await prisma.nodex.count({ where: { userId: converted.userId } })).toBe(26);
  expect(await sessionExists(convertedSid)).toBe(true);
  expect(await prisma.user.count({ where: { id: active.userId } })).toBe(1);
});
