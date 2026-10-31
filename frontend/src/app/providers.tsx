"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ApiError } from "@/lib/api";

const AUTH_PAGES = ["/login", "/registro"];

function createQueryClient() {
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (count, error) => !(error instanceof ApiError && error.status > 0 && error.status < 500) && count < 2,
      },
    },
  });

  let leaving = false;

  function handleError(error: Error) {
    if (leaving || !(error instanceof ApiError) || error.status !== 401) return;
    if (AUTH_PAGES.includes(window.location.pathname)) return;

    leaving = true;
    client.clear();
    fetch("/api/auth/logout", { method: "POST" }).finally(() => window.location.replace("/login?expired=1"));
  }

  return client;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    navigator.serviceWorker?.register("/sw.js");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster richColors position="bottom-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
