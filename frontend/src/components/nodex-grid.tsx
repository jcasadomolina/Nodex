import { NodexCard } from "@/components/nodex-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Group, Nodex } from "@/lib/types";

const SKELETON_HEIGHTS = ["h-28", "h-44", "h-32", "h-52", "h-24", "h-40", "h-36", "h-48"];

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
      <div className={columns} aria-busy="true">
        {SKELETON_HEIGHTS.map((height) => (
          <Skeleton key={height} className={`mb-4 w-full break-inside-avoid rounded-2xl ${height}`} />
        ))}
      </div>
    );
  }

  if (nodexs.length === 0) return <div className="mt-16 grid justify-items-center gap-4 text-center">{empty}</div>;

  return (
    <>
      <div className={columns}>
        {nodexs.map((nodex) => (
          <NodexCard key={nodex.id} nodex={nodex} groups={groups} onOpen={onOpen} />
        ))}
      </div>
      {hasMore && (
        <Button variant="outline" className="mx-auto" onClick={onLoadMore} disabled={loadingMore}>
          Cargar más
        </Button>
      )}
    </>
  );
}
