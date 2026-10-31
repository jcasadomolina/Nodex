import { Suspense } from "react";
import { Spinner } from "@/components/spinner";
import { NodexView } from "@/components/nodex-view";

async function OpenNodex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NodexView key={id} id={id} />;
}

export default function NodexPage({ params }: PageProps<"/nodexs/[id]">) {
  return (
    <Suspense fallback={<Spinner className="mx-auto my-12 size-8 text-primary" />}>
      <OpenNodex params={params} />
    </Suspense>
  );
}
