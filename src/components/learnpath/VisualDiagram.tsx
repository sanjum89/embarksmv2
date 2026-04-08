import { cn } from "@/lib/utils";
import { ArrowDown, ChevronRight } from "lucide-react";

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

function NodeBox({ node, depth = 0 }: { node: DiagramNode; depth?: number }) {
  const colors = [
    "bg-primary/10 border-primary/30 text-primary",
    "bg-accent/10 border-accent/30 text-accent-foreground",
    "bg-secondary border-secondary text-secondary-foreground",
  ];
  const colorClass = colors[Math.min(depth, colors.length - 1)];

  if (!node.children || node.children.length === 0) {
    return (
      <div className={cn("rounded-lg border px-4 py-3 text-sm font-medium", colorClass)}>
        <p className="font-semibold text-sm">{node.title}</p>
        {node.description && (
          <p className="text-xs mt-1 opacity-80 font-normal">{node.description}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0">
      <div className={cn("rounded-lg border px-5 py-3 text-sm font-semibold z-10", colorClass)}>
        {node.title}
        {node.description && (
          <p className="text-xs mt-1 opacity-80 font-normal">{node.description}</p>
        )}
      </div>
      {/* connector line down */}
      <div className="w-px h-4 bg-border" />
      {/* horizontal rail */}
      {node.children.length > 1 && (
        <div className="flex items-start w-full justify-center">
          <div className="flex items-start relative">
            {/* horizontal line spanning children */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border"
              style={{
                width: `${Math.max(0, (node.children.length - 1)) * 100}%`,
                minWidth: node.children.length > 1 ? "100%" : 0,
              }}
            />
          </div>
        </div>
      )}
      <div className={cn(
        "grid gap-3 w-full",
        node.children.length === 2 && "grid-cols-2",
        node.children.length === 3 && "grid-cols-3",
        node.children.length >= 4 && "grid-cols-2 md:grid-cols-4",
        node.children.length === 1 && "grid-cols-1 max-w-xs mx-auto",
      )}>
        {node.children.map((child, i) => (
          <div key={i} className="flex flex-col items-center gap-0">
            <div className="w-px h-3 bg-border" />
            <NodeBox node={child} depth={depth + 1} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function VisualDiagram({ title, nodes, className }: Props) {
  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="font-semibold text-foreground text-base">{title}</h4>
      <div className="space-y-6">
        {nodes.map((node, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5">
            <NodeBox node={node} depth={0} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* Utility: parse markdown transcript into diagram nodes */
export function parseTranscriptToDiagram(transcript: string): DiagramNode[] {
  const lines = transcript.split("\n");
  const roots: DiagramNode[] = [];
  let currentH2: DiagramNode | null = null;
  let currentH3: DiagramNode | null = null;

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);
    const bulletMatch = line.match(/^\*\s+\*?\*?(.+?)\*?\*?\s*[-–:]?\s*(.*)$/);

    if (h2Match) {
      currentH2 = { title: h2Match[1].replace(/\*\*/g, ""), children: [] };
      roots.push(currentH2);
      currentH3 = null;
    } else if (h3Match && currentH2) {
      currentH3 = { title: h3Match[1].replace(/\*\*/g, ""), children: [] };
      currentH2.children!.push(currentH3);
    } else if (bulletMatch) {
      const target = currentH3 ?? currentH2;
      if (target) {
        const title = bulletMatch[1].replace(/\*\*/g, "").trim();
        const desc = bulletMatch[2]?.replace(/\*\*/g, "").trim();
        target.children = target.children ?? [];
        target.children.push({ title, description: desc || undefined });
      }
    }
  }

  // If no headings parsed, create a single node from first paragraph
  if (roots.length === 0) {
    const firstPara = transcript.split("\n\n").find(p => p.trim() && !p.startsWith("#"));
    roots.push({ title: "Overview", description: firstPara?.slice(0, 200) });
  }

  return roots;
}
