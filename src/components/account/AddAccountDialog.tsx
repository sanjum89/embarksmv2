import { useState, useCallback, useMemo } from "react";
import { Upload, FileJson, AlertCircle, ImageIcon, X, AlertTriangle, Shield, ShieldCheck, ChevronRight, Check, Circle, Users, Info } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { parseAccountJSON } from "@/lib/accountParser";
import type { AccountUser } from "@/types/account-v2";
import type { UserRole } from "@/types/learning";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EmployeeRow {
  id: string;
  name: string;
  email: string;
  title?: string;
  hasDirectReports: boolean;
  directReportCount: number;
  reportsToName?: string;
  preSelected: boolean;
  inferredRole: UserRole;
  avatarUrl?: string;
}

interface SectionStatus {
  key: string;
  label: string;
  category: "required" | "learning" | "admin" | "other";
  detected: boolean;
  count?: number;
  note?: string;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Step = "upload" | "review" | "profiles" | "initial";

function computeSectionStatuses(json: any): SectionStatus[] {
  const employees = json.employees || [];
  const users = json.users || [];
  const hasEmployeeSkills = employees.some((e: any) => e.skills?.length > 0 || e.roleSkillsCurrent?.length > 0);

  const arr = (key: string) => Array.isArray(json[key]) ? json[key] : [];
  const has = (key: string) => {
    const v = json[key];
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === "object") return Object.keys(v).length > 0;
    return !!v;
  };

  const sections: SectionStatus[] = [
    // Required
    { key: "name", label: "Account name", category: "required", detected: !!(json.account?.name || json.name) },
    { key: "employees", label: "Employees", category: "required", detected: employees.length > 0, count: employees.length },
    // Learning
    { key: "skillTargets", label: "Skill Targets", category: "learning", detected: has("skillTargets"), count: arr("skillTargets").length, note: !has("skillTargets") ? "Empty — no demo data will be injected" : undefined },
    { key: "learningModules", label: "Learning Modules", category: "learning", detected: has("learningModules"), count: arr("learningModules").length, note: !has("learningModules") ? "Empty — no demo data will be injected" : undefined },
    { key: "assessments", label: "Assessments", category: "learning", detected: has("assessments"), count: arr("assessments").length, note: !has("assessments") ? "Empty — no demo data will be injected" : undefined },
    { key: "rolePlays", label: "Role Plays", category: "learning", detected: has("rolePlays"), count: arr("rolePlays").length, note: !has("rolePlays") ? "Empty — no demo data will be injected" : undefined },
    // Admin/Team
    { key: "companyProfile", label: "Company Profile", category: "admin", detected: has("companyProfile") },
    { key: "siteProfile", label: "Site Profile", category: "admin", detected: has("siteProfile") },
    { key: "reflections", label: "Reflections", category: "admin", detected: has("reflections"), count: arr("reflections").length },
    { key: "workSignals", label: "Work Signals", category: "admin", detected: has("workSignals"), count: arr("workSignals").length },
    { key: "showcaseCases", label: "Showcase Cases", category: "admin", detected: has("showcaseCases"), count: arr("showcaseCases").length },
    { key: "explainability", label: "Explainability", category: "admin", detected: has("explainability"), count: arr("explainability").length },
    { key: "org", label: "Org Overview", category: "admin", detected: has("org") },
    { key: "signals", label: "Signals", category: "admin", detected: has("signals"), count: arr("signals").length },
    { key: "architectureSources", label: "Architecture Sources", category: "admin", detected: has("architectureSources"), count: arr("architectureSources").length },
    // Other
    { key: "hierarchy", label: "Hierarchy", category: "other", detected: employees.some((e: any) => e.reportsTo) },
    { key: "profileData", label: "Profile Data", category: "other", detected: has("profileData"), note: !has("profileData") && hasEmployeeSkills ? "Will be generated from employee data" : !has("profileData") ? "Not provided" : undefined },
    { key: "projects", label: "Projects", category: "other", detected: has("projects"), count: arr("projects").length },
    { key: "rolesCatalog", label: "Roles Catalog", category: "other", detected: has("rolesCatalog") || has("roles"), count: (arr("rolesCatalog").length || arr("roles").length) },
    { key: "prompts", label: "Prompts", category: "other", detected: has("prompts") },
  ];
  return sections;
}

const CATEGORY_LABELS: Record<string, string> = {
  required: "Required",
  learning: "Learning Content",
  admin: "Admin / Team Data",
  other: "Other",
};

function SectionStatusBadge({ s }: { s: SectionStatus }) {
  if (s.detected) {
    return (
      <Badge variant="outline" className="text-[0.65rem] px-1.5 py-0 border-green-500/30 text-green-700 dark:text-green-400 bg-green-500/10 gap-1">
        <Check className="h-3 w-3" />
        {s.count !== undefined ? s.count : "Yes"}
      </Badge>
    );
  }
  if (s.category === "required") {
    return (
      <Badge variant="destructive" className="text-[0.65rem] px-1.5 py-0 gap-1">
        <AlertCircle className="h-3 w-3" /> Missing
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[0.65rem] px-1.5 py-0 border-yellow-500/30 text-yellow-700 dark:text-yellow-400 bg-yellow-500/10">
      Not provided
    </Badge>
  );
}

export function AddAccountDialog({ open, onOpenChange }: AddAccountDialogProps) {
  const { addAccount } = useAccount();
  const { setInitialSignedInUsers, switchUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [pendingJson, setPendingJson] = useState<any>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("upload");

  const [employeeRows, setEmployeeRows] = useState<EmployeeRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [roleMap, setRoleMap] = useState<Record<string, UserRole>>({});
  const [accountName, setAccountName] = useState("");
  const [userCount, setUserCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [sectionStatuses, setSectionStatuses] = useState<SectionStatus[]>([]);
  const [initialPersonaId, setInitialPersonaId] = useState<string>("");
  const [schemaVersion, setSchemaVersion] = useState<string | undefined>();

  const reset = () => {
    setFileName(null);
    setLogoDataUrl(null);
    setLogoFileName(null);
    setPendingJson(null);
    setParseWarnings([]);
    setStep("upload");
    setEmployeeRows([]);
    setSelectedIds(new Set());
    setRoleMap({});
    setAccountName("");
    setUserCount(0);
    setEmployeeCount(0);
    setError(null);
    setSectionStatuses([]);
    setInitialPersonaId("");
    setSchemaVersion(undefined);
  };

  const handleLogoFile = useCallback(async (file: File) => {
    const validTypes = ["image/png", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setError("Logo must be a PNG or SVG file.");
      return;
    }
    try {
      const dataUrl = await readFileAsDataURL(file);
      setLogoDataUrl(dataUrl);
      setLogoFileName(file.name);
      setError(null);
    } catch {
      setError("Failed to read logo file.");
    }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setParseWarnings([]);
    setFileName(file.name);
    setLoading(true);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const name = json.account?.name || json.name;
      if (!name || typeof name !== "string") {
        throw new Error("JSON must include a 'name' field (string) at top level or under 'account'.");
      }

      const { errors, warnings } = parseAccountJSON(json, "preview");
      if (errors.length > 0) {
        throw new Error(errors.join(" "));
      }
      setParseWarnings(warnings);
      setAccountName(name);
      setSchemaVersion(json.schemaVersion || json.version || json.account?.version);

      // Compute section statuses
      setSectionStatuses(computeSectionStatuses(json));

      const employees: any[] = json.employees || [];
      const users: any[] = json.users || [];
      const userIdSet = new Set(users.map((u: any) => u.id));

      // Build reportsTo lookup
      const reportees: Record<string, string[]> = {};
      const employeeById: Record<string, any> = {};
      for (const e of employees) {
        employeeById[e.id] = e;
        if (e.reportsTo) {
          if (!reportees[e.reportsTo]) reportees[e.reportsTo] = [];
          reportees[e.reportsTo].push(e.id);
        }
      }

      const rows: EmployeeRow[] = employees.map((e: any) => {
        const directReports = reportees[e.id] || [];
        const hasDirectReports = directReports.length > 0;
        const matchingUser = users.find((u: any) => u.id === e.id || u.linkedEmployeeId === e.id || u.employeeId === e.id);
        const inferredRole: UserRole = matchingUser?.role || (hasDirectReports ? "manager" : "learner");
        const reportsToName = e.reportsTo && employeeById[e.reportsTo] ? employeeById[e.reportsTo].name : undefined;
        return {
          id: e.id,
          name: e.name,
          email: e.email || "",
          title: e.title,
          hasDirectReports,
          directReportCount: directReports.length,
          reportsToName,
          preSelected: !!matchingUser || userIdSet.has(e.id),
          inferredRole,
          avatarUrl: e.avatarUrl,
        };
      });

      for (const u of users) {
        if (!rows.some((r) => r.id === u.id)) {
          rows.push({
            id: u.id,
            name: u.name,
            email: u.email || "",
            title: u.title,
            hasDirectReports: false,
            directReportCount: 0,
            reportsToName: undefined,
            preSelected: true,
            inferredRole: u.role || "learner",
            avatarUrl: u.avatarUrl,
          });
        }
      }

      setEmployeeRows(rows);
      setUserCount(users.length);
      setEmployeeCount(employees.length);
      setSelectedIds(new Set());

      const initialRoles: Record<string, UserRole> = {};
      for (const r of rows) {
        initialRoles[r.id] = r.inferredRole;
      }
      setRoleMap(initialRoles);

      setPendingJson(json);
    } catch (e: any) {
      setError(e.message || "Failed to parse JSON file.");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleEmployee = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setEmployeeRole = (id: string, role: UserRole) => {
    setRoleMap((prev) => ({ ...prev, [id]: role }));
  };

  const selectedRows = useMemo(
    () => employeeRows.filter((r) => selectedIds.has(r.id)),
    [employeeRows, selectedIds]
  );

  // Auto-select initial persona when entering step 4
  const enterInitialStep = useCallback(() => {
    setStep("initial");
    setError(null);
    if (selectedRows.length === 0) return;
    // Prefer admin, then manager, then first
    const adminRow = selectedRows.find((r) => roleMap[r.id] === "admin");
    const managerRow = selectedRows.find((r) => roleMap[r.id] === "manager");
    const pick = adminRow || managerRow || selectedRows[0];
    setInitialPersonaId(pick.id);
  }, [selectedRows, roleMap]);

  const hasRequiredErrors = sectionStatuses.some((s) => s.category === "required" && !s.detected);

  const handleCreate = useCallback(async () => {
    if (!pendingJson || !initialPersonaId) return;
    setLoading(true);
    setError(null);

    try {
      const selectedUsers: AccountUser[] = [];
      for (const row of employeeRows) {
        if (!selectedIds.has(row.id)) continue;
        const role = roleMap[row.id] || row.inferredRole;
        selectedUsers.push({
          id: row.id,
          name: row.name,
          email: row.email,
          role,
          avatarUrl: row.avatarUrl,
          title: row.title,
          canManage: role === "manager" || role === "admin",
          linkedEmployeeId: row.id,
        });
      }

      const payload = { ...pendingJson };
      if (logoDataUrl) {
        payload.logo = logoDataUrl;
      }

      const newAccountId = await addAccount(accountName, payload, selectedUsers);

      const userIds = selectedUsers.map((u) => u.id);
      setInitialSignedInUsers(newAccountId, userIds);

      // Switch to chosen initial persona
      setTimeout(() => switchUser(initialPersonaId), 100);

      toast({
        title: "Account added",
        description: `"${accountName}" created with ${selectedUsers.length} profile${selectedUsers.length !== 1 ? "s" : ""}.`,
      });
      onOpenChange(false);
      reset();
    } catch (e: any) {
      setError(e.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }, [pendingJson, employeeRows, selectedIds, roleMap, logoDataUrl, accountName, addAccount, setInitialSignedInUsers, switchUser, initialPersonaId, onOpenChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleLogoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleLogoFile(file);
  }, [handleLogoFile]);

  // --- STEP RENDERERS ---

  const renderUploadStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Add Account</DialogTitle>
        <DialogDescription>
          Upload a JSON file to create a new customer account. Optionally add a logo (PNG or SVG).
        </DialogDescription>
      </DialogHeader>

      {/* Logo upload */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">Logo (optional)</p>
        {logoDataUrl ? (
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <div
              className="h-10 w-10 rounded shrink-0 flex items-center justify-center"
              style={{
                backgroundImage: "linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)",
                backgroundSize: "8px 8px",
                backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
              }}
            >
              <img src={logoDataUrl} alt="Logo preview" className="h-10 w-10 object-contain" />
            </div>
            <span className="text-sm text-foreground truncate flex-1">{logoFileName}</span>
            <button
              onClick={() => { setLogoDataUrl(null); setLogoFileName(null); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onDrop={handleLogoDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
          >
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Drop PNG/SVG or</span>
            <label>
              <input
                type="file"
                accept=".png,.svg,image/png,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoFile(file);
                }}
              />
              <Button variant="outline" size="sm" asChild>
                <span>Browse</span>
              </Button>
            </label>
          </div>
        )}
      </div>

      {/* JSON upload */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
      >
        {fileName ? (
          <FileJson className="h-10 w-10 text-primary" />
        ) : (
          <Upload className="h-10 w-10 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium text-foreground">
            {fileName ?? "Drop JSON file here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">.json files only</p>
        </div>
        <label>
          <input
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Button variant="outline" size="sm" asChild disabled={loading}>
            <span>{loading ? "Processing…" : "Browse Files"}</span>
          </Button>
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {pendingJson && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border p-3 space-y-1">
            <p className="text-sm font-medium text-foreground">{accountName}</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{employeeCount} employee{employeeCount !== 1 ? "s" : ""}</span>
              <span>{userCount} user{userCount !== 1 ? "s" : ""} defined</span>
            </div>
          </div>
          <Button onClick={() => { setStep("review"); setError(null); }} className="w-full gap-2">
            Review Dataset <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );

  const renderReviewStep = () => {
    const grouped: Record<string, SectionStatus[]> = {};
    for (const s of sectionStatuses) {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    }
    const categoryOrder = ["required", "learning", "admin", "other"];

    return (
      <>
        <DialogHeader>
          <DialogTitle>Dataset Review</DialogTitle>
          <DialogDescription>
            Review the detected sections before choosing sign-in profiles.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border p-3 space-y-1">
          <p className="text-sm font-medium text-foreground">{accountName}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            {schemaVersion && <span>v{schemaVersion}</span>}
            <span>{employeeCount} employee{employeeCount !== 1 ? "s" : ""}</span>
            <span>{userCount} persona{userCount !== 1 ? "s" : ""} defined</span>
          </div>
        </div>

        <ScrollArea className="max-h-[320px] -mx-1 px-1">
          <div className="space-y-4">
            {categoryOrder.map((cat) => {
              const items = grouped[cat];
              if (!items?.length) return null;
              return (
                <div key={cat} className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {CATEGORY_LABELS[cat]}
                  </p>
                  <div className="space-y-1">
                    {items.map((s) => (
                      <div key={s.key} className="flex items-center justify-between gap-2 py-1 px-2 rounded-md bg-muted/30">
                        <span className="text-sm text-foreground">{s.label}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <SectionStatusBadge s={s} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Notes for missing items in this category */}
                  {items.filter((s) => !s.detected && s.note).map((s) => (
                    <div key={s.key + "-note"} className="flex items-start gap-1.5 pl-2">
                      <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-[0.7rem] text-muted-foreground">{s.label}: {s.note}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {parseWarnings.length > 0 && (
          <details className="rounded-md bg-yellow-500/5 border border-yellow-500/20 p-3 text-sm text-muted-foreground">
            <summary className="flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs font-medium text-foreground">{parseWarnings.length} parser warning{parseWarnings.length > 1 ? "s" : ""}</span>
              <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground transition-transform [[open]>&]:rotate-90" />
            </summary>
            <ul className="mt-2 space-y-0.5 text-xs pl-6 list-disc">
              {parseWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </details>
        )}

        {hasRequiredErrors && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>Required sections are missing. Fix the JSON and re-upload.</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
            Back
          </Button>
          <Button
            onClick={() => { setStep("profiles"); setError(null); }}
            disabled={hasRequiredErrors}
            className="flex-1 gap-2"
          >
            Choose Profiles <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </>
    );
  };

  const renderProfilesStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Choose sign-in profiles</DialogTitle>
        <DialogDescription>
          Select which people become available in the profile switcher for "{accountName}".
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="max-h-[340px] -mx-1 px-1">
        <div className="space-y-1">
          {employeeRows.map((row) => {
            const checked = selectedIds.has(row.id);
            const currentRole = roleMap[row.id] || row.inferredRole;
            return (
              <div
                key={row.id}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  checked ? "border-primary/30 bg-primary/5" : "border-border opacity-60"
                }`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleEmployee(row.id)}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground truncate">{row.name}</span>
                    {row.inferredRole !== currentRole && (
                      <span className="text-[0.65rem] text-muted-foreground">(was {row.inferredRole})</span>
                    )}
                  </div>
                  {row.title && (
                    <p className="text-xs text-muted-foreground truncate">{row.title}</p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-0 mt-0.5">
                    {row.reportsToName && (
                      <p className="text-[0.7rem] text-muted-foreground">Reports to {row.reportsToName}</p>
                    )}
                    {row.hasDirectReports && (
                      <p className="text-[0.7rem] text-muted-foreground">{row.directReportCount} direct report{row.directReportCount !== 1 ? "s" : ""}</p>
                    )}
                  </div>
                </div>
                {checked && (
                  <Select value={currentRole} onValueChange={(v) => setEmployeeRole(row.id, v as UserRole)}>
                    <SelectTrigger className="w-[110px] h-8 text-xs shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Admin</span>
                      </SelectItem>
                      <SelectItem value="manager">
                        <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Manager</span>
                      </SelectItem>
                      <SelectItem value="learner">
                        <span className="flex items-center gap-1.5"><Users className="h-3 w-3" /> Learner</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep("review")} className="flex-1">
          Back
        </Button>
        <Button
          onClick={enterInitialStep}
          disabled={selectedIds.size === 0}
          className="flex-1 gap-2"
        >
          Choose Initial Profile <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {selectedIds.size === 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Select at least one profile to continue.
        </p>
      )}
    </>
  );

  const renderInitialStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Choose initial profile</DialogTitle>
        <DialogDescription>
          Pick which profile to sign in as when the account is created.
        </DialogDescription>
      </DialogHeader>

      <RadioGroup value={initialPersonaId} onValueChange={setInitialPersonaId} className="space-y-1">
        {selectedRows.map((row) => {
          const currentRole = roleMap[row.id] || row.inferredRole;
          const isSelected = initialPersonaId === row.id;
          return (
            <label
              key={row.id}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                isSelected ? "border-primary/40 bg-primary/5" : "border-border"
              }`}
            >
              <RadioGroupItem value={row.id} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground truncate">{row.name}</span>
                  {currentRole === "admin" && <ShieldCheck className="h-3.5 w-3.5 text-primary fill-primary/20 shrink-0" />}
                  {currentRole === "manager" && <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                </div>
                {row.title && <p className="text-xs text-muted-foreground truncate">{row.title}</p>}
              </div>
              <Badge variant="outline" className="text-[0.65rem] capitalize shrink-0">{currentRole}</Badge>
            </label>
          );
        })}
      </RadioGroup>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep("profiles")} className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleCreate}
          disabled={loading || !initialPersonaId}
          className="flex-1"
        >
          {loading ? "Creating…" : `Create "${accountName}"`}
        </Button>
      </div>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (!v) reset();
    }}>
      <DialogContent className="max-w-md">
        {step === "upload" && renderUploadStep()}
        {step === "review" && renderReviewStep()}
        {step === "profiles" && renderProfilesStep()}
        {step === "initial" && renderInitialStep()}
      </DialogContent>
    </Dialog>
  );
}
