import { Suspense } from "react";
import { Board } from "@/components/board";

async function OpenNodex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Board openId={id} />;
}

export default function NodexPage({ params }: PageProps<"/nodexs/[id]">) {
  return (
    <Suspense fallback={<Board />}>
      <OpenNodex params={params} />
    </Suspense>
  );
}
