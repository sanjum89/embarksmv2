import { motion } from "framer-motion";
import { BarChart3, Target, Inbox, TrendingUp, Maximize2 } from "lucide-react";
import type { RichBlock } from "./RichContentBlock";

const BLOCK_META: Record<string, { icon: React.FC<any>; label: string }> = {
  skills_chart: { icon: BarChart3, label: "Skills Chart" },
  skill_targets_table: { icon: Target, label: "Skill Targets" },
  inbox_cards: { icon: Inbox, label: "Inbox Summary" },
  progress_summary: { icon: TrendingUp, label: "Progress Overview" },
};

export function CollapsedBlockCard({ block, onExpand }: { block: RichBlock; onExpand: () => void }) {
  const meta = BLOCK_META[block.type] || { icon: BarChart3, label: "Data" };
  const Icon = meta.icon;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onExpand}
      className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-[0.7rem] font-medium text-foreground hover:bg-primary/10 hover:border-primary/40 transition-all my-1"
    >
      <Icon className="h-3.5 w-3.5 text-primary" />
      {meta.label}
      <Maximize2 className="h-3 w-3 text-muted-foreground" />
    </motion.button>
  );
}
