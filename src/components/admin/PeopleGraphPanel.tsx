import { useState, useMemo } from "react";
import type { NormalizedAccount } from "@/types/account-v2";
import { getPeopleGraphRows } from "@/lib/accountSelectors";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import EmployeeDetailPanel from "./EmployeeDetailPanel";

interface Props {
  account: NormalizedAccount;
}

type SortKey = "name" | "role" | "level" | "tenure" | "grade";
type SortDir = "asc" | "desc";

export default function PeopleGraphPanel({ account }: Props) {
  const rows = getPeopleGraphRows(account);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = rows;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) => r.name.toLowerCase().includes(q) || r.role?.toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      const aVal = String(a[sortKey] ?? "");
      const bVal = String(b[sortKey] ?? "");
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return result;
  }, [rows, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        No people data available. Upload an account with employee records to populate this view.
      </div>
    );
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employees..." className="pl-9" />
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                {([["name", "Name"], ["role", "Role"], ["level", "Level"], ["tenure", "Tenure"], ["grade", "Grade"]] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    className="text-left px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground select-none"
                  >
                    <span className="inline-flex items-center gap-1">{label}<SortIcon col={key} /></span>
                  </th>
                ))}
                <th className="text-left px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <>
                  <tr
                    key={row.employeeId}
                    onClick={() => setExpandedId(expandedId === row.employeeId ? null : row.employeeId)}
                    className={cn(
                      "border-t border-border hover:bg-muted/30 transition-colors cursor-pointer",
                      expandedId === row.employeeId && "bg-muted/20"
                    )}
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground">{row.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.role || "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.level || "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.tenure != null ? row.tenure : "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.grade || "—"}</td>
                    <td className="px-4 py-2.5">
                      {row.flags?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {row.flags.map((f, i) => (
                            <span key={i} className="rounded-full bg-warning/10 text-warning text-[10px] font-medium px-2 py-0.5">
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                  {expandedId === row.employeeId && (
                    <tr key={`${row.employeeId}-detail`}>
                      <td colSpan={6} className="p-0">
                        <AnimatePresence>
                          <EmployeeDetailPanel
                            row={row}
                            account={account}
                            onClose={() => setExpandedId(null)}
                          />
                        </AnimatePresence>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2">{filtered.length} of {rows.length} employees</p>
    </div>
  );
}
