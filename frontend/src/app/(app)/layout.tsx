"use client";

import { useState } from "react";
import { SettingsDialog } from "@/components/settings-dialog";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { useMe } from "@/lib/queries/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const offline = me.error instanceof ApiError && me.error.status !== 401 ? me.error : null;

  return (
    <>
      <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
      <main className="flex flex-1 flex-col px-3 pt-3 pb-24 md:pr-6 md:pb-6 md:pl-20">
        {offline && (
          <div className="mx-auto mb-3 flex w-full max-w-2xl items-center justify-between gap-3 rounded-2xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {offline.message}
            <Button size="sm" variant="outline" onClick={() => me.refetch()}>
              Reintentar
            </Button>
          </div>
        )}
        {children}
      </main>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
