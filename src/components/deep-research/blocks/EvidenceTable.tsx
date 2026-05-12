import { cn } from "@/lib/utils";
import type { RagStatus } from "@/lib/deepResearch/envelope";

const TONE: Record<RagStatus, string> = {
  green: "text-emerald-700 dark:text-emerald-300",
  amber: "text-amber-700 dark:text-amber-300",
  red: "text-rose-700 dark:text-rose-300",
};

interface Props {
  columns: string[];
  rows: (string | { text: string; tone?: RagStatus })[][];
}

export function EvidenceTable({ columns, rows }: Props) {
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/40">
          <tr>
            {columns.map((c) => (
              <th key={c} className="text-left px-3 py-2 font-medium text-muted-foreground">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border/40">
              {row.map((cell, j) => {
                if (typeof cell === "string") {
                  return (
                    <td key={j} className="px-3 py-2">
                      {cell}
                    </td>
                  );
                }
                return (
                  <td key={j} className={cn("px-3 py-2 font-medium", cell.tone && TONE[cell.tone])}>
                    {cell.text}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
