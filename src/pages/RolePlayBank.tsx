import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, Bot, Plus, Trash2, UserPlus, Pencil, Check, Mic, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { mockSkillTargets as defaultSkillTargets, mockNewHires as defaultNewHires } from "@/data/mock";
import { useAccount } from "@/contexts/AccountContext";
import { useRolePlays } from "@/contexts/RolePlayContext";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";
import { useModeEyebrow } from "@/components/layout/useModeEyebrow";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

type DifficultyFilter = "all" | "beginner" | "intermediate" | "advanced";

const difficultyColors = {
  beginner: "bg-success/15 text-success border border-success/20",
  intermediate: "bg-amber-500/15 text-amber-700 border border-amber-500/25 dark:text-amber-300",
  advanced: "bg-destructive/15 text-destructive border border-destructive/20",
};

export default function RolePlayBank() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"assigned" | "all">("assigned");
  const { toast } = useToast();
  const { rolePlays, updateRolePlay } = useRolePlays();
  const { user } = useUser();
  const { normalizedAccount, activeAccount } = useAccount();
  const isManager = user.role === "manager";
  const eyebrow = useModeEyebrow();

  const mockNewHires = Array.isArray(normalizedAccount?.newHires) ? normalizedAccount.newHires
    : Array.isArray(activeAccount?.data?.newHires) ? activeAccount.data.newHires
    : defaultNewHires;
  const mockSkillTargets = Array.isArray(normalizedAccount?.skillTargets) ? normalizedAccount.skillTargets
    : Array.isArray(activeAccount?.data?.skillTargets) ? activeAccount.data.skillTargets
    : defaultSkillTargets;

  // Manager-specific state
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newScenario, setNewScenario] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("intermediate");

  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editScenario, setEditScenario] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("intermediate");
  const [editPersona, setEditPersona] = useState("");
  const [editContext, setEditContext] = useState("");

  // Assignment tracking (local state)
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});

  // Derive tags from role plays filtered by tab, search, and difficulty (but NOT by selectedTag)
  const allTags = useMemo(() => {
    const preTagFiltered = rolePlays.filter((rp) => {
      if (activeTab === "assigned" && !rp.assignedTo?.includes(user.id)) return false;
      if (difficulty !== "all" && rp.difficulty !== difficulty) return false;
      if (search && !rp.title.toLowerCase().includes(search.toLowerCase()) && !rp.scenario.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    const tags = new Set<string>();
    preTagFiltered.forEach((rp) => (rp.tags || []).forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [rolePlays, activeTab, difficulty, search, user.id]);

  // Auto-clear selectedTag if it's no longer available
  useEffect(() => {
    if (selectedTag && !allTags.includes(selectedTag)) {
      setSelectedTag(null);
    }
  }, [allTags, selectedTag]);

  // Priority IDs for sorting the 5 original RPs to top
  const priorityIds = ["RAT-RP-101", "RAT-RP-102", "RAT-RP-103", "RAT-RP-104", "RAT-RP-105"];

  const filtered = useMemo(() => {
    const results = rolePlays.filter((rp) => {
      if (activeTab === "assigned" && !rp.assignedTo?.includes(user.id)) return false;
      if (difficulty !== "all" && rp.difficulty !== difficulty) return false;
      if (selectedTag && !(rp.tags || []).includes(selectedTag)) return false;
      if (search && !rp.title.toLowerCase().includes(search.toLowerCase()) && !rp.scenario.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    // Sort: priority IDs first (in order), then assigned, then rest
    return results.sort((a, b) => {
      const aPri = priorityIds.indexOf(a.id);
      const bPri = priorityIds.indexOf(b.id);
      if (aPri !== -1 && bPri !== -1) return aPri - bPri;
      if (aPri !== -1) return -1;
      if (bPri !== -1) return 1;
      const aAssigned = a.assignedTo?.includes(user.id) ? 1 : 0;
      const bAssigned = b.assignedTo?.includes(user.id) ? 1 : 0;
      return bAssigned - aAssigned;
    });
  }, [search, difficulty, selectedTag, rolePlays, activeTab, user.id]);

  const handleAddToSkillTarget = (rpTitle: string, stTitle: string) => {
    toast({
      title: "Added to Skill Target",
      description: `"${rpTitle}" added to "${stTitle}"`,
    });
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    // For now this is a toast-only action since role plays are mock data
    toast({ title: "Role Play Created", description: `"${newTitle}" has been added.` });
    setNewTitle("");
    setNewScenario("");
    setCreateOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    toast({ title: "Role Play Deleted", description: `"${title}" has been removed.` });
  };

  const handleAssign = (rpId: string, employeeId: string, employeeName: string) => {
    setAssignments((prev) => {
      const current = prev[rpId] || [];
      const isAssigned = current.includes(employeeId);
      return {
        ...prev,
        [rpId]: isAssigned ? current.filter((id) => id !== employeeId) : [...current, employeeId],
      };
    });
    const isAssigned = (assignments[rpId] || []).includes(employeeId);
    toast({
      title: isAssigned ? "Unassigned" : "Assigned",
      description: `Role play ${isAssigned ? "removed from" : "assigned to"} ${employeeName}`,
    });
  };

  const openEdit = (rp: typeof rolePlays[0]) => {
    setEditTitle(rp.title);
    setEditScenario(rp.scenario);
    setEditDifficulty(rp.difficulty);
    setEditPersona(rp.aiCloneConfig?.persona || "");
    setEditContext(rp.aiCloneConfig?.context || "");
    setEditOpen(rp.id);
  };

  const handleSaveEdit = () => {
    if (!editOpen || !editTitle.trim()) return;
    updateRolePlay(editOpen, {
      title: editTitle,
      scenario: editScenario,
      difficulty: editDifficulty as "beginner" | "intermediate" | "advanced",
      aiCloneConfig: { persona: editPersona, context: editContext },
    });
    toast({ title: "Role Play Updated", description: `"${editTitle}" has been saved.` });
    setEditOpen(null);
  };

  return (
    <div className="flex-1 overflow-y-auto" data-tour="role-play-bank">
      <PageHeader
        eyebrow={eyebrow}
        title={isManager ? "Manage Role Plays" : "Role Play Bank"}
        subtitle={
          isManager
            ? "Create, edit, and assign role play scenarios to your team members."
            : "Practise client conversations with AI personas to sharpen your skills."
        }
        actions={
          isManager && (
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
            )
        }
      />
      <div className="mx-auto max-w-7xl px-6 py-6">

        {/* Tab bar */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setActiveTab("assigned")}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                activeTab === "assigned"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Assigned to Me
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                activeTab === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Role Plays
            </button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scenarios..."
              className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
            {(["all", "beginner", "intermediate", "advanced"] as DifficultyFilter[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all",
                  difficulty === d
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {d === "all" ? "All Levels" : d}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                selectedTag === tag
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AnimatePresence>
            {filtered.map((rp, i) => {
              const rpAssignments = assignments[rp.id] || [];
              return (
                <motion.div
                  key={rp.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  className="group relative rounded-xl bg-card border border-border p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 min-w-0"
                >
                  <Link
                    to={`/role-play-bank/${rp.id}`}
                    className="block min-w-0"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 shrink-0">
                        <MessageSquare className="h-4.5 w-4.5 text-accent" />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {activeTab === "all" && rp.assignedTo?.includes(user.id) && (
                          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary whitespace-nowrap">
                            Assigned to you
                          </span>
                        )}
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize whitespace-nowrap", difficultyColors[rp.difficulty])}>
                          {rp.difficulty}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-display text-sm font-semibold text-foreground mb-1.5 group-hover:text-accent transition-colors break-words">
                      {rp.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-3 mb-3 break-words">{rp.scenario}</p>
                    <div className="flex items-center gap-2">
                      <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">
                        {rp.aiCloneConfig?.persona || "AI Persona"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(rp.tags || []).map((tag) => (
                        <span key={tag} className="rounded-md bg-secondary px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>

                  {/* Manager: assigned avatars */}
                  {isManager && rpAssignments.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                      <span className="text-[0.65rem] text-muted-foreground">Assigned:</span>
                      <div className="flex -space-x-1.5">
                        {rpAssignments.map((id) => {
                          const hire = mockNewHires.find((h) => h.user.id === id);
                          return hire ? (
                            <div
                              key={id}
                              className="h-5 w-5 rounded-full bg-primary text-[0.55rem] font-bold text-primary-foreground flex items-center justify-center border-2 border-card"
                              title={hire.user.name}
                            >
                              {hire.user.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                          ) : null;
                        })}
                      </div>
                      <span className="text-[0.65rem] text-muted-foreground">({rpAssignments.length})</span>
                    </div>
                  )}

                  {/* Action buttons overlay */}
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Add to Skill Target (learner) */}
                    {!isManager && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                            title="Add to Skill Target"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="end">
                          <p className="text-xs font-medium text-foreground mb-2 px-2">Add to Skill Target</p>
                          {mockSkillTargets.map((st) => (
                            <button
                              key={st.id}
                              onClick={() => handleAddToSkillTarget(rp.title, st.title)}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-accent/10 transition-colors text-left"
                            >
                              <span className="truncate">{st.title}</span>
                            </button>
                          ))}
                        </PopoverContent>
                      </Popover>
                    )}

                    {/* Manager actions */}
                    {isManager && (
                      <>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(rp); }}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-muted-foreground hover:text-accent hover:bg-accent/10 transition-all"
                          title="Edit role play"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <Dialog open={assignOpen === rp.id} onOpenChange={(open) => setAssignOpen(open ? rp.id : null)}>
                          <DialogTrigger asChild>
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                              title="Assign to employee"
                            >
                              <UserPlus className="h-3.5 w-3.5" />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle className="text-base">Assign "{rp.title}"</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-1 pt-2">
                              {mockNewHires.map((hire) => {
                                const isAssigned = rpAssignments.includes(hire.user.id);
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
                                      <p className="text-[0.65rem] text-muted-foreground">{hire.title}</p>
                                    </div>
                                    {isAssigned && <Check className="h-4 w-4 text-primary shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(rp.id, rp.title); }}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          title="Delete role play"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            No role plays match your filters.
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editOpen} onOpenChange={(open) => !open && setEditOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Role Play</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Title</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Scenario</label>
              <textarea
                value={editScenario}
                onChange={(e) => setEditScenario(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Difficulty</label>
              <div className="flex gap-2">
                {["beginner", "intermediate", "advanced"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setEditDifficulty(d)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-all border",
                      editDifficulty === d
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">AI Persona</label>
              <Input value={editPersona} onChange={(e) => setEditPersona(e.target.value)} placeholder="e.g. Frustrated customer" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Context</label>
              <textarea
                value={editContext}
                onChange={(e) => setEditContext(e.target.value)}
                placeholder="Additional context for the AI persona..."
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px] resize-none"
              />
            </div>
            <Button onClick={handleSaveEdit} disabled={!editTitle.trim()} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
