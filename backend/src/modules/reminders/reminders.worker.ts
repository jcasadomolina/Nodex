import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { pushEnabled, sendPush } from "../../lib/push.js";

const INTERVAL_MS = 60_000;

type DueReminder = { nodex_id: string; user_id: string; title: string; deleted: boolean };

export async function sendDueReminders() {
  const due = await prisma.$queryRaw<DueReminder[]>`
    UPDATE reminders r
    SET sent_at = now()
    FROM nodexs n
    WHERE n.id = r.nodex_id
      AND r.nodex_id IN (
        SELECT nodex_id FROM reminders
        WHERE sent_at IS NULL
          AND remind_at <= now()
          AND remind_at > now() - interval '1 day'
        ORDER BY remind_at
        LIMIT 100
        FOR UPDATE SKIP LOCKED
      )
    RETURNING r.nodex_id, r.user_id, n.title, (n.deleted_at IS NOT NULL) AS deleted
  `;

  let sent = 0;
  for (const reminder of due.filter((r) => !r.deleted)) {
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId: reminder.user_id } });
    const payload = {
      title: "Recordatorio de Nodex",
      body: reminder.title,
      url: `${env.APP_URL}/nodexs/${reminder.nodex_id}`,
    };

    for (const subscription of subscriptions) {
      try {
        const result = await sendPush(subscription, payload);
        if (result === "expired") {
          await prisma.pushSubscription.delete({ where: { id: subscription.id } });
        } else {
          sent++;
        }
      } catch (err) {
        console.error(`Error al enviar el recordatorio ${reminder.nodex_id}:`, err);
      }
    }
  }
  return { due: due.length, sent };
}

let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    await sendDueReminders();
  } catch (err) {
    console.error("Error al procesar los recordatorios:", err);
  } finally {
    running = false;
  }
}

export function startReminderWorker() {
  if (!pushEnabled) {
    console.log("Push sin configurar: los recordatorios solo se verán dentro de la app");
    return;
  }
  setInterval(tick, INTERVAL_MS).unref();
  void tick();
}
