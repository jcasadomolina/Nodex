import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { processNodex, proposeNewGroups } from "../ai/ai.service.js";
import { refreshPreviewInBackground } from "../links/links.service.js";
import { priorityToNumber } from "../nodexs/nodexs.schemas.js";
import { DEMO_GROUPS, DEMO_NODEXS } from "./demo.data.js";

export const DEMO_HOURS = 24;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export async function createDemoUser(now = new Date()) {
  const at = (ms: number) => new Date(now.getTime() + ms);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: "Invitado",
        email: `demo-${randomUUID()}@demo.nodex.invalid`,
        demoExpiresAt: at(DEMO_HOURS * HOUR),
      },
      select: { id: true },
    });

    const groups = await tx.group.createManyAndReturn({
      data: DEMO_GROUPS.map((group) => ({ ...group, userId: user.id })),
      select: { id: true, name: true },
    });
    const groupId = new Map(groups.map((group) => [group.name, group.id]));

    const userId = user.id;
    const nodexs = DEMO_NODEXS.map((demo) => ({ ...demo, id: randomUUID() }));

    await tx.nodex.createMany({
      data: nodexs.map((demo) => {
        const createdAt = demo.ageDays ? at(-demo.ageDays * DAY) : now;
        return {
          id: demo.id,
          userId,
          type: demo.url ? "link" : "note",
          title: demo.title,
          content: demo.content ?? null,
          url: demo.url ?? null,
          priority: demo.priority ? priorityToNumber(demo.priority) : null,
          createdAt,
          lastOpenedAt: demo.ageDays ? createdAt : null,
          readLaterAt: demo.readLater ? now : null,
        };
      }),
    });
    await tx.groupNodex.createMany({
      data: nodexs.flatMap((demo) => demo.groups.map((name) => ({ groupId: groupId.get(name)!, nodexId: demo.id, userId }))),
    });
    await tx.nodexTag.createMany({
      data: nodexs.flatMap((demo) => (demo.tags ?? []).map((name) => ({ nodexId: demo.id, userId, name }))),
    });
    await tx.task.createMany({
      data: nodexs.flatMap(({ id, task }, position) =>
        task
          ? [
              {
                nodexId: id,
                userId,
                status: task.status,
                dueAt: task.dueInDays === undefined ? null : at(task.dueInDays * DAY),
                position,
                completedAt: task.status === "done" ? now : null,
              },
            ]
          : [],
      ),
    });
    await tx.reminder.createMany({
      data: nodexs.flatMap(({ id, remindInHours }) =>
        remindInHours === undefined ? [] : [{ nodexId: id, userId, remindAt: at(remindInHours * HOUR) }],
      ),
    });

    const grouped = nodexs.filter((demo) => demo.groups.length).map((demo) => demo.id);
    const orphans = nodexs.filter((demo) => !demo.groups.length).map((demo) => demo.id);
    const linkIds = nodexs.filter((demo) => demo.url).map((demo) => demo.id);

    return { userId, nodexIds: [...grouped, ...orphans], linkIds };
  });
}

export async function prepareDemoAi(userId: string, nodexIds: string[], linkIds: string[]) {
  for (const nodexId of nodexIds) {
    try {
      await processNodex(userId, nodexId);
    } catch (err) {
      console.error(`Error de IA en la demo con el Nodex ${nodexId}:`, err);
    }
  }
  await proposeNewGroups(userId).catch((err) => console.error("Error de IA al proponer grupos en la demo:", err));
  linkIds.forEach(refreshPreviewInBackground);
}
