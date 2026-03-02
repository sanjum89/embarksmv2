import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Palette ─────────────────────────────────────── */
const GREEN  = { hex: "#22C55E", ring: "rgba(34,197,94,0.55)", glow: "rgba(34,197,94,0.24)", bloom: "rgba(34,197,94,0.09)" };
const YELLOW = { hex: "#EAB308", ring: "rgba(234,179,8,0.55)", glow: "rgba(234,179,8,0.24)", bloom: "rgba(234,179,8,0.09)" };
const ORANGE = { hex: "#F97316", ring: "rgba(249,115,22,0.55)", glow: "rgba(249,115,22,0.24)", bloom: "rgba(249,115,22,0.09)" };

/* ── Data ────────────────────────────────────────── */
interface CareerEntry {
  year: number;
  month?: string;
  validated: boolean;
  company?: string;
  role?: string;
  details?: string;
}

const careerEntries: CareerEntry[] = [
  { year: 2026, month: "Mar", validated: false },
  { year: 2026, month: "Feb", validated: false },
  { year: 2026, month: "Jan", validated: false },
  { year: 2025, validated: true, company: "Beta Corp", role: "Senior Manager", details: "Remote · Full-Time · 2025" },
  { year: 2025, validated: true, company: "Alpha Solutions", role: "Project Lead", details: "San Francisco, CA · 2023–2024" },
  { year: 2024, validated: true, company: "Gamma Tech", role: "Business Analyst", details: "New York, NY · 2018–2021" },
  { year: 2022, validated: true, company: "First Company Inc.", role: "Junior Developer", details: "Chicago, IL · 2011–2014" },
  { year: 2011, validated: true },
];

const reflections = [
  { date: "Jan 22, 2026", project: "WFAI Platform", status: "Pending" as const },
  { date: "Dec 15, 2025", project: "Project X", status: "Approved" as const },
];

/* ── Component ───────────────────────────────────── */
export function CareerTimeline() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [tooltip, setTooltip] = useState<number | null>(null);

  const palette = (entry: CareerEntry) => {
    if (entry.validated) return GREEN;
    if (entry.month === "Mar") return ORANGE;
    return YELLOW; // Jan & Feb 2026
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card border border-border p-6 shadow-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h4 className="font-display text-[28px] font-bold text-foreground leading-tight">Career Timeline</h4>
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
          >
            <option value="all">All roles</option>
          </select>
          <button className="rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: ORANGE.hex }}>
            Add reflection
          </button>
          <button className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="h-4 w-4" />
          </button>
          <button className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ─── Left: Timeline (8 cols) ─── */}
        <div className="lg:col-span-8 relative pl-20">

          {/* Rail layers */}
          {careerEntries.map((entry, i) => {
            const c = palette(entry);
            const segH = `calc(${100 / careerEntries.length}%)`;
            const segTop = `calc(${(i / careerEntries.length) * 100}%)`;
            return (
              <div key={`rail-${i}`}>
                {/* Bloom layer */}
                <div
                  className="absolute left-[3.75rem] w-[22px] rounded-full -translate-x-1/2 timeline-bloom"
                  style={{
                    top: segTop, height: segH,
                    background: c.hex,
                    opacity: 0.09,
                    filter: "blur(10px)",
                  }}
                />
                {/* Glow layer */}
                <div
                  className="absolute left-[3.75rem] w-[12px] rounded-full -translate-x-1/2 timeline-glow"
                  style={{
                    top: segTop, height: segH,
                    background: c.hex,
                    opacity: 0.24,
                    filter: "blur(5px)",
                  }}
                />
                {/* Core line */}
                <div
                  className="absolute left-[3.75rem] w-[4px] -translate-x-1/2"
                  style={{
                    top: segTop, height: segH,
                    background: c.hex,
                  }}
                />
              </div>
            );
          })}

          {/* Entries */}
          <div className="space-y-10">
            {careerEntries.map((entry, i) => {
              const c = palette(entry);
              const isSelected = entry.year === 2026 && entry.month === "Mar";
              return (
                <div key={i} className="relative flex items-start gap-5">
                  {/* Year / month label */}
                  <span className="absolute -left-20 top-0.5 text-sm font-medium text-muted-foreground w-14 text-right">
                    {entry.month ?? entry.year}
                  </span>
                  {entry.month && (
                    <span className="absolute -left-20 top-5 text-[11px] text-muted-foreground/60 w-14 text-right">
                      {entry.year}
                    </span>
                  )}

                  {/* Dot — white center + colored ring */}
                  <div
                    className={cn(
                      "absolute -left-[5px] top-1 z-10 h-4 w-4 rounded-full border-[2.5px] bg-white transition-shadow duration-300",
                      isSelected && "timeline-active-dot"
                    )}
                    style={{
                      borderColor: c.hex,
                      boxShadow: `0 0 0 0 transparent`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 8px 3px ${c.ring}`;
                      if (!entry.validated) setTooltip(i);
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0 0 transparent`;
                      setTooltip(null);
                    }}
                  />

                  {/* Content */}
                  <div className="ml-6 min-h-[2rem] relative">
                    {/* Selected chip */}
                    {isSelected && (
                      <span
                        className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
                        style={{ background: ORANGE.hex }}
                      >
                        {entry.year} {entry.month}
                      </span>
                    )}

                    {/* Career card */}
                    {entry.company && (
                      <div className="rounded-2xl border bg-white p-4 shadow-card"
                        style={{ borderColor: "#E6E8EE" }}>
                        <p className="font-display text-lg font-bold text-foreground">{entry.company}</p>
                        <p className="text-base font-medium text-foreground mt-0.5">{entry.role}</p>
                        <p className="text-sm text-[#667085] mt-1">{entry.details}</p>
                      </div>
                    )}

                    {/* Missing data tooltip */}
                    <AnimatePresence>
                      {tooltip === i && !entry.validated && !isSelected && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="absolute left-0 top-6 z-50 rounded-xl border border-border bg-card p-4 shadow-card-hover min-w-[240px]"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-display text-sm font-bold text-foreground">No data captured</p>
                            <button onClick={() => setTooltip(null)} className="text-muted-foreground hover:text-foreground">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            We didn't receive any work signals for this period.
                          </p>
                          <button
                            className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                            style={{ background: ORANGE.hex }}
                          >
                            Add reflection
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Right: Sidebar (4 cols) ─── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Current period */}
          <div className="rounded-xl border border-border p-4">
            <p className="font-display text-base font-semibold text-foreground">Feb–Mar 2026</p>
            <p className="text-sm text-muted-foreground mt-1">No data captured</p>
            <button
              className="mt-3 w-full rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              style={{ background: ORANGE.hex }}
            >
              Add reflection
            </button>
            <button className="mt-2 w-full text-sm text-info underline">How data is captured</button>
          </div>

          {/* Recent Reflections */}
          <div className="rounded-xl border border-border p-4">
            <h5 className="font-display text-base font-semibold text-foreground mb-3">Recent Reflections</h5>
            <div className="space-y-3">
              {reflections.map((r, i) => (
                <div key={i} className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-foreground">{r.date}</p>
                    <p className="text-xs text-muted-foreground">{r.project}</p>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-sm font-medium",
                      r.status === "Approved" ? "text-success" : "text-[#F97316]"
                    )}>
                      {r.status}
                    </span>
                    <p className="text-xs text-info underline cursor-pointer">View all</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-xl border border-border p-4">
            <h5 className="font-display text-base font-semibold text-foreground mb-3">Filters</h5>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: GREEN.hex }} />
                <span className="text-sm text-foreground">Validated signals</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: ORANGE.hex }} />
                <span className="text-sm text-foreground">Missing data</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground">Company</label>
                <select className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                  <option>Select company</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Role Type</label>
                <select className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                  <option>Select role type</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breathing glow animations — CSS-only for performance */}
      <style>{`
        @keyframes timeline-breathe-glow {
          0%, 100% { opacity: 0.18; filter: blur(5px); }
          50% { opacity: 0.30; filter: blur(7px); }
        }
        @keyframes timeline-breathe-bloom {
          0%, 100% { opacity: 0.06; filter: blur(10px); }
          50% { opacity: 0.12; filter: blur(14px); }
        }
        @keyframes active-dot-breathe {
          0%, 100% { box-shadow: 0 0 6px 2px rgba(249,115,22,0.3); }
          50% { box-shadow: 0 0 10px 4px rgba(249,115,22,0.45); }
        }
        .timeline-glow {
          animation: timeline-breathe-glow 2.6s ease-in-out infinite alternate;
        }
        .timeline-bloom {
          animation: timeline-breathe-bloom 2.6s ease-in-out infinite alternate;
        }
        .timeline-active-dot {
          animation: active-dot-breathe 2.6s ease-in-out infinite alternate;
        }
      `}</style>
    </motion.div>
  );
}
