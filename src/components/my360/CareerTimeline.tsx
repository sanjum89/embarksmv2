import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const careerEntries = [
  {
    year: 2026,
    label: "Jan-Mar",
    current: true,
    company: null,
    role: null,
    details: null,
  },
  {
    year: 2025,
    label: null,
    current: false,
    company: "Beta Corp",
    role: "Senior Manager",
    details: "Remote · Full-Time · 2025",
  },
  {
    year: 2025,
    label: null,
    current: false,
    company: "Alpha Solutions",
    role: "Project Lead",
    details: "San Francisco, CA · 2023–2024",
  },
  {
    year: 2024,
    label: null,
    current: false,
    company: null,
    role: null,
    details: null,
  },
  {
    year: 2022,
    label: null,
    current: false,
    company: "Gamma Tech",
    role: "Business Analyst",
    details: "New York, NY · 2018–2021",
  },
  {
    year: 2021,
    label: null,
    current: false,
    company: null,
    role: null,
    details: null,
  },
  {
    year: 2011,
    label: null,
    current: false,
    company: "First Company Inc.",
    role: "Junior Developer",
    details: "Chicago, IL · 2011–2014",
  },
];

const reflections = [
  { date: "Apr 08, 2024", project: "Project X", status: "Approved" as const },
  { date: "Mar 15, 2024", project: "AI Task Force", status: "Pending" as const },
];

export function CareerTimeline() {
  const [roleFilter, setRoleFilter] = useState("all");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card border border-border p-5 shadow-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-display text-lg font-semibold text-foreground">Career Timeline</h4>
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
          >
            <option value="all">All roles</option>
          </select>
          <button className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity">
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Left: Timeline */}
        <div className="relative pl-16">
          {/* Gradient line */}
          <div className="absolute left-[3.25rem] top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-accent via-success to-success/40" />

          <div className="space-y-6">
            {careerEntries.map((entry, i) => (
              <div key={i} className="relative flex items-start gap-4">
                {/* Year label */}
                <span className="absolute -left-16 top-0.5 text-sm font-medium text-muted-foreground w-12 text-right">
                  {entry.year}
                </span>

                {/* Dot */}
                <div className={cn(
                  "absolute -left-1 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-card z-10",
                  entry.current ? "bg-accent" : "bg-card border-border ring-2 ring-border"
                )} />

                {/* Content */}
                <div className="ml-4 min-h-[2rem]">
                  {entry.current && entry.label && (
                    <span className="inline-flex items-center rounded-md bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                      {entry.year} {entry.label}
                    </span>
                  )}
                  {entry.company && (
                    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
                      <p className="font-display text-sm font-bold text-foreground">{entry.company}</p>
                      <p className="text-sm text-foreground">{entry.role}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Sidebar cards */}
        <div className="space-y-4">
          {/* Current period */}
          <div className="rounded-xl border border-border p-4">
            <p className="font-display text-base font-semibold text-foreground">Jan–Mar 2026</p>
            <p className="text-sm text-muted-foreground mt-1">No data captured</p>
            <button className="mt-3 w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 transition-opacity">
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
                      r.status === "Approved" ? "text-success" : "text-accent"
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
                <span className="h-3 w-3 rounded-full bg-success" />
                <span className="text-sm text-foreground">Validated signals</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-accent" />
                <span className="text-sm text-foreground">Missing data</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground">Company</label>
                <select className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                  <option>Select company</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Role Type</label>
                <select className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                  <option>Select role type</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
