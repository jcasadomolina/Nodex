"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/spinner";
import { useCreateNodex } from "@/lib/queries/nodexs";

function findSharedUrl(...texts: (string | null)[]) {
  for (const text of texts) {
    const match = text?.match(/https?:\/\/\S+/);
    if (match) return match[0];
  }
  return null;
}

function SaveShared() {
  const params = useSearchParams();
  const router = useRouter();
  const createNodex = useCreateNodex();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const url = findSharedUrl(params.get("url"), params.get("text"));
    if (!url) {
      toast.error("Con Nodex solo se pueden compartir enlaces");
      router.replace("/");
      return;
    }

    const title = (params.get("title")?.trim() || url).slice(0, 200);
    createNodex.mutate(
      { type: "link", url, title, content: null, priority: null, tags: [], groupIds: [], source: "share" },
      {
        onSuccess: ({ nodex }) => {
          toast.success("Enlace guardado");
          router.replace(`/nodexs/${nodex.id}`);
        },
        onError: (error) => {
          toast.error(error.message);
          router.replace("/");
        },
      },
    );
  }, [params, router, createNodex]);

  return null;
}

export default function SharePage() {
  return (
    <>
      <Spinner className="mx-auto my-12 size-8 text-primary" />
      <Suspense>
        <SaveShared />
      </Suspense>
    </>
  );
}
