import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Plus, Trash2, ChevronRight, ChevronDown, Layers, Loader2, UserPlus, Briefcase, GraduationCap, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PageBody from "@/components/layout/PageBody";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useAccount } from "@/contexts/AccountContext";
import { useWorkforceGroups, type WorkforceGroup, type WorkforceGroupKind, type WorkforceGroupLinkType } from "@/contexts/WorkforceGroupContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const KIND_OPTIONS: { value: WorkforceGroupKind; label: string }[] = [
  { value: "office", label: "Office" },
  { value: "function", label: "Function" },
  { value: "team", label: "Desk / Team" },
  { value: "initiative", label: "Initiative" },
  { value: "custom", label: "Custom" },
];

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || `g-${Date.now()}`;
}

export default function AdminWorkforceGroups() {
  const { user } = useUser();
  const { activeAccountId, normalizedAccount } = useAccount();
  const wg = useWorkforceGroups();

  if (user.role !== "admin") return <Navigate to="/" replace />;
  if (!wg.enabled) return <Navigate to="/settings?section=features" replace />;

  const [selectedId, setSelectedId] = useState<string | null>(wg.groups[0]?.id ?? null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(wg.groups.map((g) => g.id)));
  const [busy, setBusy] = useState(false);

  const selected = wg.groups.find((g) => g.id === selectedId) ?? null;

  const childrenOf = (pid: string | null) =>
    wg.groups.filter((g) => g.parent_id === pid).sort((a, b) => a.sort_order - b.sort_order);

  const addGroup = async (parentId: string | null) => {
    if (!activeAccountId) return;
    setBusy(true);
    const name = "New group";
    const { data, error } = await supabase.from("workforce_groups").insert({
      account_id: activeAccountId,
      parent_id: parentId,
      name,
      slug: `g-${Date.now()}`,
      kind: parentId ? "team" : "office",
      sort_order: childrenOf(parentId).length,
    } as any).select().single();
    setBusy(false);
    if (error) { toast({ title: "Couldn't add group", description: error.message, variant: "destructive" }); return; }
    await wg.refresh();
    if (data) {
      setSelectedId((data as any).id);
      if (parentId) setExpanded((s) => new Set(s).add(parentId));
    }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm("Delete this group and all subgroups?")) return;
    setBusy(true);
    const { error } = await supabase.from("workforce_groups").delete().eq("id", id);
    setBusy(false);
    if (error) { toast({ title: "Couldn't delete", description: error.message, variant: "destructive" }); return; }
    if (selectedId === id) setSelectedId(null);
    await wg.refresh();
  };

  const updateGroup = async (id: string, patch: Partial<WorkforceGroup>) => {
    const { error } = await supabase.from("workforce_groups").update(patch as any).eq("id", id);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    await wg.refresh();
  };

  const renderTree = (parent: string | null, depth: number): React.ReactNode => {
    const items = childrenOf(parent);
    return items.map((g) => {
      const kids = childrenOf(g.id);
      const isExpanded = expanded.has(g.id);
      const isSelected = g.id === selectedId;
      return (
        <div key={g.id}>
          <div
            className={cn(
              "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm",
              isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
            )}
            style={{ paddingLeft: 6 + depth * 14 }}
            onClick={() => setSelectedId(g.id)}
          >
            {kids.length > 0 ? (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded((s) => { const n = new Set(s); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n; }); }}
                className="p-0.5 hover:bg-background rounded"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            ) : <span className="w-4" />}
            <span className="truncate flex-1">{g.name}</span>
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground opacity-0 group-hover:opacity-100">{g.kind}</span>
          </div>
          {isExpanded && kids.length > 0 && renderTree(g.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <PageHeader
        title="Workforce Groups"
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Workforce Groups" }]}
        subtitle="Slice the platform by Office → Function → Desk/Team → Initiative."
      />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          {/* Tree */}
          <Card className="border-border/60">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Tree</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => addGroup(null)} disabled={busy}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Root
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-280px)] pr-2">
                {wg.groups.length === 0 ? (
                  <div className="text-xs text-muted-foreground p-4 text-center">
                    No groups yet. Add your first root group.
                  </div>
                ) : renderTree(null, 0)}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="border-border/60">
            <CardContent className="p-4">
              {!selected ? (
                <div className="text-sm text-muted-foreground p-6 text-center">Select a group on the left.</div>
              ) : (
                <GroupEditor
                  group={selected}
                  onUpdate={(patch) => updateGroup(selected.id, patch)}
                  onAddChild={() => addGroup(selected.id)}
                  onDelete={() => deleteGroup(selected.id)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </div>
  );
}

function GroupEditor({ group, onUpdate, onAddChild, onDelete }: {
  group: WorkforceGroup;
  onUpdate: (patch: Partial<WorkforceGroup>) => Promise<void>;
  onAddChild: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const { normalizedAccount } = useAccount();
  const wg = useWorkforceGroups();
  const employees = useMemo(() => Object.values(normalizedAccount?.employeesById ?? {}), [normalizedAccount]);

  const members = wg.members.filter((m) => m.group_id === group.id);
  const memberSet = new Set(members.map((m) => m.employee_id));
  const links = wg.links.filter((l) => l.group_id === group.id);

  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [kind, setKind] = useState<WorkforceGroupKind>(group.kind);
  const [empQuery, setEmpQuery] = useState("");

  // Keep local state in sync when switching groups
  useMemoSync(group.id, () => { setName(group.name); setDescription(group.description ?? ""); setKind(group.kind); });

  const filteredEmps = empQuery
    ? employees.filter((e) => (e.name || "").toLowerCase().includes(empQuery.toLowerCase()))
    : employees.slice(0, 50);

  const toggleMember = async (employeeId: string) => {
    if (!normalizedAccount) return;
    if (memberSet.has(employeeId)) {
      await supabase.from("workforce_group_members").delete().eq("group_id", group.id).eq("employee_id", employeeId);
    } else {
      await supabase.from("workforce_group_members").insert({ account_id: normalizedAccount.id, group_id: group.id, employee_id: employeeId } as any);
    }
    await wg.refresh();
  };

  const addLink = async (entity_type: WorkforceGroupLinkType, entity_id: string, label?: string) => {
    if (!normalizedAccount || !entity_id) return;
    const { error } = await supabase.from("workforce_group_links").insert({
      account_id: normalizedAccount.id, group_id: group.id, entity_type, entity_id, metadata: label ? { label } : {},
    } as any);
    if (error) toast({ title: "Couldn't add link", description: error.message, variant: "destructive" });
    await wg.refresh();
  };

  const removeLink = async (id: string) => {
    await supabase.from("workforce_group_links").delete().eq("id", id);
    await wg.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name !== group.name && onUpdate({ name })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Kind</Label>
              <Select value={kind} onValueChange={(v: WorkforceGroupKind) => { setKind(v); onUpdate({ kind: v }); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Badge variant="outline" className="text-[10px]">{members.length} members · {links.length} links</Badge>
            </div>
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} onBlur={() => description !== (group.description ?? "") && onUpdate({ description } as any)} rows={2} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button size="sm" variant="outline" onClick={onAddChild}><Plus className="h-3.5 w-3.5 mr-1" /> Subgroup</Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="people">
        <TabsList>
          <TabsTrigger value="people"><UserPlus className="h-3 w-3 mr-1" /> People</TabsTrigger>
          <TabsTrigger value="roles"><Briefcase className="h-3 w-3 mr-1" /> Roles</TabsTrigger>
          <TabsTrigger value="cohorts"><GraduationCap className="h-3 w-3 mr-1" /> Cohorts</TabsTrigger>
          <TabsTrigger value="rules"><ShieldCheck className="h-3 w-3 mr-1" /> Compliance</TabsTrigger>
          <TabsTrigger value="reqs">Requisitions</TabsTrigger>
        </TabsList>

        <TabsContent value="people" className="space-y-2">
          <Input placeholder="Search employees…" value={empQuery} onChange={(e) => setEmpQuery(e.target.value)} />
          <ScrollArea className="h-64 border rounded-md">
            <div className="p-2 space-y-1">
              {filteredEmps.map((e) => {
                const checked = memberSet.has(e.id);
                return (
                  <button
                    key={e.id}
                    onClick={() => toggleMember(e.id)}
                    className={cn("w-full flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-muted text-left",
                      checked && "bg-primary/10")}
                  >
                    <span className="truncate"><span className="font-medium">{e.name}</span> <span className="text-muted-foreground text-xs">· {e.title}</span></span>
                    {checked && <Badge variant="outline" className="text-[10px]">Member</Badge>}
                  </button>
                );
              })}
              {filteredEmps.length === 0 && <p className="text-xs text-muted-foreground p-3">No matches.</p>}
            </div>
          </ScrollArea>
        </TabsContent>

        <LinkTab entityType="role" group={group} links={links} onAdd={(id, label) => addLink("role", id, label)} onRemove={removeLink} placeholder="Role ID or label (e.g. investment_manager)" />
        <LinkTab entityType="cohort" group={group} links={links} onAdd={(id, label) => addLink("cohort", id, label)} onRemove={removeLink} placeholder="Cohort title or ID" />
        <LinkTab entityType="compliance_rule" group={group} links={links} onAdd={(id, label) => addLink("compliance_rule", id, label)} onRemove={removeLink} placeholder="Rule code (e.g. SMCR-CR1, CONSUMER-DUTY-2026)" />
        <LinkTab entityType="requisition" group={group} links={links} onAdd={(id, label) => addLink("requisition", id, label)} onRemove={removeLink} placeholder="Requisition reference" />
      </Tabs>
    </div>
  );
}

function LinkTab({ entityType, links, onAdd, onRemove, placeholder }: {
  entityType: WorkforceGroupLinkType;
  group: WorkforceGroup;
  links: ReturnType<typeof useWorkforceGroups>["links"];
  onAdd: (id: string, label?: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  placeholder: string;
}) {
  const [val, setVal] = useState("");
  const [label, setLabel] = useState("");
  const tabValue = entityType === "compliance_rule" ? "rules" : entityType === "requisition" ? "reqs" : entityType === "role" ? "roles" : "cohorts";
  const items = links.filter((l) => l.entity_type === entityType);
  return (
    <TabsContent value={tabValue} className="space-y-2">
      <div className="flex gap-2">
        <Input placeholder={placeholder} value={val} onChange={(e) => setVal(e.target.value)} className="flex-1" />
        <Input placeholder="Display label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} className="flex-1" />
        <Button size="sm" onClick={async () => { if (!val.trim()) return; await onAdd(val.trim(), label.trim() || undefined); setVal(""); setLabel(""); }}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>
      <div className="space-y-1">
        {items.length === 0 && <p className="text-xs text-muted-foreground">No links yet.</p>}
        {items.map((l) => (
          <div key={l.id} className="flex items-center justify-between border rounded px-2 py-1.5 text-sm">
            <span className="truncate">
              <span className="font-medium">{(l.metadata as any)?.label || l.entity_id}</span>
              {(l.metadata as any)?.label && <span className="text-muted-foreground text-xs ml-2">{l.entity_id}</span>}
            </span>
            <Button size="sm" variant="ghost" onClick={() => onRemove(l.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>
    </TabsContent>
  );
}

// Small helper: re-sync local form state when group id changes
import { useEffect } from "react";
function useMemoSync(key: string, fn: () => void) {
  useEffect(() => { fn(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [key]);
}
