import { NodexCard } from "@/components/nodex-card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import type { Group, Nodex } from "@/lib/types";

type NodexGridProps = {
  nodexs: Nodex[];
  groups: Group[];
  onOpen: (id: string) => void;
  loading: boolean;
  empty: React.ReactNode;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
};

const columns = "columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4";

export function NodexGrid({ nodexs, groups, onOpen, loading, empty, hasMore, loadingMore, onLoadMore }: NodexGridProps) {
  if (loading) {
    return (
      <div className="mt-16 flex justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (nodexs.length === 0) return <div className="mt-16 grid justify-items-center gap-4 text-center">{empty}</div>;

  return (
    <>
      <div className={columns}>
        {nodexs.map((nodex, index) => (
          <NodexCard key={nodex.id} nodex={nodex} groups={groups} index={index} onOpen={onOpen} />
        ))}
      </div>
      {hasMore && (
        <Button variant="outline" className="mx-auto" onClick={onLoadMore} disabled={loadingMore}>
          {loadingMore && <Spinner />}
          Cargar más
        </Button>
      )}
    </>
  );
}
