import webpush from "web-push";
import { env } from "../config/env.js";

export const pushEnabled = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);

if (pushEnabled) {
  webpush.setVapidDetails(env.VAPID_SUBJECT!, env.VAPID_PUBLIC_KEY!, env.VAPID_PRIVATE_KEY!);
}

type Subscription = { endpoint: string; p256dh: string; auth: string };

export async function sendPush({ endpoint, p256dh, auth }: Subscription, payload: object) {
  try {
    await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, JSON.stringify(payload), { TTL: 60 * 60 });
    return "sent";
  } catch (err) {
    if (err instanceof webpush.WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
      return "expired";
    }
    throw err;
  }
}
