"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-xl font-semibold">Algo ha salido mal</h1>
      <Button onClick={reset}>Reintentar</Button>
    </main>
  );
}
