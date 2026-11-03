"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { isDesktopApp } from "@/lib/platform";

async function currentSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

async function subscribe() {
  if ((await Notification.requestPermission()) !== "granted") {
    throw new Error("Has bloqueado las notificaciones. Actívalas en los ajustes del navegador");
  }
  const { publicKey } = await api<{ publicKey: string }>("/push/public-key");
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey });
  await api("/push/subscriptions", { method: "POST", body: subscription.toJSON() });
}

async function unsubscribe() {
  const subscription = await currentSubscription();
  if (!subscription) return;
  await api("/push/subscriptions", { method: "DELETE", body: { endpoint: subscription.endpoint } });
  await subscription.unsubscribe();
}

export function PushButton() {
  const [supported] = useState(() => typeof window !== "undefined" && "PushManager" in window && "serviceWorker" in navigator);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [desktop] = useState(isDesktopApp);

  useEffect(() => {
    if (supported && !desktop) currentSubscription().then((subscription) => setEnabled(Boolean(subscription)));
  }, [supported, desktop]);

  if (desktop) {
    return <p className="text-sm text-muted-foreground">Los avisos al escritorio no están disponibles en la app. Úsalos desde el navegador o el móvil.</p>;
  }

  if (!supported) {
    return <p className="text-sm text-muted-foreground">Para recibir avisos en el móvil, instala Nodex en la pantalla de inicio.</p>;
  }

  async function toggle() {
    setPending(true);
    try {
      await (enabled ? unsubscribe() : subscribe());
      setEnabled(!enabled);
      toast.success(enabled ? "Avisos desactivados en este dispositivo" : "Avisos activados en este dispositivo");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" aria-pressed={Boolean(enabled)} onClick={toggle} disabled={pending || enabled === null}>
      {pending ? <Spinner /> : enabled ? <BellOff /> : <Bell />}
      {enabled ? "Desactivar avisos" : "Activar avisos"}
    </Button>
  );
}
