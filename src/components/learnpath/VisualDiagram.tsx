import { cn } from "@/lib/utils";

export interface DiagramNode {
  title: string;
  children?: DiagramNode[];
  description?: string;
}

interface Props {
  title: string;
  nodes: DiagramNode[];
  className?: string;
}

/** A single section card — shows title + bullet children as a compact list */
function SectionCard({ node, accent }: { node: DiagramNode; accent: number }) {
  const accents = [
    "border-l-primary bg-primary/5",
    "border-l-accent bg-accent/5",
    "border-l-secondary bg-secondary/30",
    "border-l-destructive/50 bg-destructive/5",
  ];
  const cls = accents[accent % accents.length];

  return (
    <div className={cn("rounded-lg border border-border border-l-4 p-4 space-y-2", cls)}>
      <h5 className="font-semibold text-foreground text-sm">{node.title}</h5>
      {node.description && (
        <p className="text-xs text-muted-foreground leading-relaxed">{node.description}</p>
      )}
      {node.children && node.children.length > 0 && (
        <ul className="space-y-1.5 mt-2">
          {node.children.map((child, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="text-primary mt-0.5 shrink-0">●</span>
              <span>
                <span className="font-medium text-foreground">{child.title}</span>
                {child.description && (
                  <span className="ml-1 opacity-80">— {child.description}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function VisualDiagram({ title, nodes, className }: Props) {
  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="font-semibold text-foreground text-base">{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {nodes.map((node, i) => (
          <SectionCard key={i} node={node} accent={i} />
        ))}
      </div>
    </div>
  );
}

/* Curated flow-chart definitions for known module content */
import type { FlowChartData } from "./FlowDiagram";

const curatedFlowCharts: Record<string, FlowChartData[]> = {
  heritage: [
    {
      title: "Company Foundation",
      root: "Rathbones (est. 1742)",
      children: ["Integrity", "Empowerment", "Independent Thinking", "Client-Centricity"],
      bottom: "280-Year Legacy",
    },
  ],
  investment: [
    {
      title: "Investment Philosophy",
      root: "CLIENT OUTCOMES",
      children: ["Research Driven", "Risk Managed", "Long-Term Focus"],
      bottom: "Sustainable Value Creation",
    },
  ],
};

/** Extract flow charts from transcript — uses curated maps or simple heuristics */
export function extractFlowCharts(transcript: string): FlowChartData[] {
  const lower = transcript.toLowerCase();
  for (const [key, charts] of Object.entries(curatedFlowCharts)) {
    if (lower.includes(key)) return charts;
  }
  // Heuristic: look for "built on" or enumerated values patterns
  const builtOnMatch = transcript.match(/(?:built on|founded on|based on)\s+(.+?)(?:\.|$)/i);
  if (builtOnMatch) {
    const parts = builtOnMatch[1].split(/,\s*|\s+and\s+/).map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return [{ root: "Core Foundation", children: parts.slice(0, 5) }];
    }
  }
  return [];
}

/* Utility: parse markdown transcript into diagram nodes — max 2 levels */
export function parseTranscriptToDiagram(transcript: string): DiagramNode[] {
  const lines = transcript.split("\n");
  const roots: DiagramNode[] = [];
  let currentH2: DiagramNode | null = null;

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);
    const bulletMatch = line.match(/^\*\s+\*?\*?(.+?)\*?\*?\s*[-–:]?\s*(.*)$/);

    if (h2Match) {
      currentH2 = { title: h2Match[1].replace(/\*\*/g, ""), children: [] };
      roots.push(currentH2);
    } else if (h3Match && currentH2) {
      // H3 becomes a child of H2
      currentH2.children = currentH2.children ?? [];
      currentH2.children.push({ title: h3Match[1].replace(/\*\*/g, "") });
    } else if (bulletMatch && currentH2) {
      // Bullets become children of the current H2 (rolled up)
      const title = bulletMatch[1].replace(/\*\*/g, "").trim();
      const desc = bulletMatch[2]?.replace(/\*\*/g, "").trim();
      currentH2.children = currentH2.children ?? [];
      currentH2.children.push({ title, description: desc || undefined });
    }
  }

  if (roots.length === 0) {
    const firstPara = transcript.split("\n\n").find(p => p.trim() && !p.startsWith("#"));
    roots.push({ title: "Overview", description: firstPara?.slice(0, 200) });
  }

  return roots;
}
