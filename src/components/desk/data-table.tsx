import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface Col<R> {
  key: string;
  header: string;
  cell: (r: R) => ReactNode;
  sort?: (r: R) => number | string;
  align?: "right";
}

/** Compact sortable, paginated table. */
export function DataTable<R>({ rows, cols, rowKey, pageSize = 15, onRowClick }: {
  rows: R[];
  cols: Col<R>[];
  rowKey: (r: R) => string;
  pageSize?: number;
  onRowClick?: (r: R) => void;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);
  const sorted = useMemo(() => {
    const c = cols.find((x) => x.key === sort?.key);
    if (!c?.sort || !sort) return rows;
    return [...rows].sort((a, b) => (c.sort!(a) > c.sort!(b) ? 1 : -1) * sort.dir);
  }, [rows, cols, sort]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const view = sorted.slice(page * pageSize, page * pageSize + pageSize);
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              {cols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => c.sort && setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === 1 ? -1 : 1 }))}
                  className={cn("label-caps whitespace-nowrap px-3 py-2 text-left", c.align === "right" && "text-right", c.sort && "cursor-pointer select-none hover:text-foreground")}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {c.header}
                    {sort?.key === c.key && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <tr key={rowKey(r)} onClick={() => onRowClick?.(r)} className={cn("border-b border-border/50 hover:bg-muted/50", onRowClick && "cursor-pointer")}>
                {cols.map((c) => (
                  <td key={c.key} className={cn("whitespace-nowrap px-3 py-1.5", c.align === "right" && "num text-right")}>{c.cell(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 px-3 py-2 text-[11px] text-muted-foreground">
          <span className="num">{page + 1}/{pages}</span>
          <Button size="icon" variant="ghost" className="h-6 w-6" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-3 w-3" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="h-3 w-3" /></Button>
        </div>
      )}
    </div>
  );
}
