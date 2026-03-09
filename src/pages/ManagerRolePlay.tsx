import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, UserPlus, Search, Bot, Mic, X, Check } from "lucide-react";
import { mockRolePlayBank, mockNewHires } from "@/data/mock";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RolePlayItem {
  id: string;
  title: string;
  scenario: string;
  difficulty: string;
  tags: string[];
  assignedTo: string[];
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-success/10 text-success",
  intermediate: "bg-warning/10 text-warning",
  advanced: "bg-destructive/10 text-destructive",
};

export default function ManagerRolePlay() {
  const { toast } = useToast();
  const [rolePlays, setRolePlays] = useState<RolePlayItem[]>(
    mockRolePlayBank.map((rp) => ({
      id: rp.id,
      title: rp.title,
      scenario: rp.scenario,
      difficulty: rp.difficulty,
      tags: rp.tags,
      assignedTo: [],
    }))
  );
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newScenario, setNewScenario] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("intermediate");

  const filtered = useMemo(() => {
    if (!search) return rolePlays;
    const lower = search.toLowerCase();
    return rolePlays.filter(
      (rp) => rp.title.toLowerCase().includes(lower) || rp.scenario.toLowerCase().includes(lower)
    );
  }, [search, rolePlays]);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const newRP: RolePlayItem = {
      id: `rp-custom-${Date.now()}`,
      title: newTitle,
      scenario: newScenario || "Custom scenario",
      difficulty: newDifficulty,
      tags: ["custom"],
      assignedTo: [],
    };
    setRolePlays((prev) => [newRP, ...prev]);
    setNewTitle("");
    setNewScenario("");
    setCreateOpen(false);
    toast({ title: "Role Play Created", description: `"${newTitle}" has been added.` });
  };

  const handleDelete = (id: string, title: string) => {
    setRolePlays((prev) => prev.filter((rp) => rp.id !== id));
    toast({ title: "Role Play Deleted", description: `"${title}" has been removed.` });
  };

  const handleAssign = (rpId: string, employeeId: string, employeeName: string) => {
    setRolePlays((prev) =>
      prev.map((rp) =>
        rp.id === rpId
          ? {
              ...rp,
              assignedTo: rp.assignedTo.includes(employeeId)
                ? rp.assignedTo.filter((id) => id !== employeeId)
                : [...rp.assignedTo, employeeId],
            }
          : rp
      )
    );
    const rp = rolePlays.find((r) => r.id === rpId);
    const isAssigned = rp?.assignedTo.includes(employeeId);
    toast({
      title: isAssigned ? "Unassigned" : "Assigned",
      description: `"${rp?.title}" ${isAssigned ? "removed from" : "assigned to"} ${employeeName}`,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-6 max-w-4xl mx-auto w-full flex-1">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground">Manage Role Plays</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create, delete, and assign role play scenarios to your team members.
              </p>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Role Play
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Role Play</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Title</label>
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Handling Escalated Complaints"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Scenario</label>
                    <textarea
                      value={newScenario}
                      onChange={(e) => setNewScenario(e.target.value)}
                      placeholder="Describe the role play scenario..."
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Difficulty</label>
                    <div className="flex gap-2">
                      {["beginner", "intermediate", "advanced"].map((d) => (
                        <button
                          key={d}
                          onClick={() => setNewDifficulty(d)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-all border",
                            newDifficulty === d
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/30"
                          )}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleCreate} disabled={!newTitle.trim()} className="w-full">
                    Create Role Play
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search role plays..."
            className="pl-9"
          />
        </div>

        {/* List */}
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((rp, i) => (
              <motion.div
                key={rp.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Mic className="h-4 w-4 text-primary shrink-0" />
                      <h4 className="text-sm font-semibold text-foreground truncate">{rp.title}</h4>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize shrink-0", difficultyColors[rp.difficulty])}>
                        {rp.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 ml-6">{rp.scenario}</p>
                    {rp.assignedTo.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 ml-6">
                        <span className="text-[10px] text-muted-foreground">Assigned to:</span>
                        <div className="flex -space-x-1.5">
                          {rp.assignedTo.map((id) => {
                            const hire = mockNewHires.find((h) => h.user.id === id);
                            return hire ? (
                              <div
                                key={id}
                                className="h-5 w-5 rounded-full bg-primary text-[8px] font-bold text-primary-foreground flex items-center justify-center border-2 border-card"
                                title={hire.user.name}
                              >
                                {hire.user.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                            ) : null;
                          })}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          ({rp.assignedTo.length})
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Assign button */}
                    <Dialog open={assignOpen === rp.id} onOpenChange={(open) => setAssignOpen(open ? rp.id : null)}>
                      <DialogTrigger asChild>
                        <button
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Assign to employee"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle className="text-base">Assign "{rp.title}"</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-1 pt-2">
                          {mockNewHires.map((hire) => {
                            const isAssigned = rp.assignedTo.includes(hire.user.id);
                            return (
                              <button
                                key={hire.user.id}
                                onClick={() => handleAssign(rp.id, hire.user.id, hire.user.name)}
                                className={cn(
                                  "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-colors text-left",
                                  isAssigned ? "bg-primary/10" : "hover:bg-secondary"
                                )}
                              >
                                <div className="h-8 w-8 rounded-full bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center shrink-0">
                                  {hire.user.name.split(" ").map((n) => n[0]).join("")}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground">{hire.user.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{hire.title}</p>
                                </div>
                                {isAssigned && <Check className="h-4 w-4 text-primary shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </DialogContent>
                    </Dialog>
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(rp.id, rp.title)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete role play"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            No role plays found.
          </div>
        )}
      </div>
    </div>
  );
}
