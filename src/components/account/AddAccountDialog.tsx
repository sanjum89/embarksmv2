import { useState, useCallback } from "react";
import { Upload, FileJson, AlertCircle, ImageIcon, X, AlertTriangle, Shield, ShieldCheck, ChevronRight } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { parseAccountJSON } from "@/lib/accountParser";
import type { AccountUser, AccountEmployee } from "@/types/account-v2";
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
  preSelected: boolean;
  inferredRole: UserRole;
  avatarUrl?: string;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type Step = "upload" | "profiles";

export function AddAccountDialog({ open, onOpenChange }: AddAccountDialogProps) {
  const { addAccount } = useAccount();
  const { setInitialSignedInUsers } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [pendingJson, setPendingJson] = useState<any>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("upload");

  // Profile selection state
  const [employeeRows, setEmployeeRows] = useState<EmployeeRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [roleMap, setRoleMap] = useState<Record<string, UserRole>>({});
  const [accountName, setAccountName] = useState("");
  const [userCount, setUserCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);

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

      // Build employee rows for profile selection
      const employees: any[] = json.employees || [];
      const users: any[] = json.users || [];
      const userIdSet = new Set(users.map((u: any) => u.id));

      // Build reportsTo lookup for manager detection
      const reportees: Record<string, string[]> = {};
      for (const e of employees) {
        if (e.reportsTo) {
          if (!reportees[e.reportsTo]) reportees[e.reportsTo] = [];
          reportees[e.reportsTo].push(e.id);
        }
      }

      const rows: EmployeeRow[] = employees.map((e: any) => {
        const hasDirectReports = (reportees[e.id]?.length || 0) > 0;
        const matchingUser = users.find((u: any) => u.id === e.id || u.linkedEmployeeId === e.id || u.employeeId === e.id);
        const inferredRole: UserRole = matchingUser?.role || (hasDirectReports ? "manager" : "learner");
        return {
          id: e.id,
          name: e.name,
          email: e.email || "",
          title: e.title,
          hasDirectReports,
          preSelected: !!matchingUser || userIdSet.has(e.id),
          inferredRole,
          avatarUrl: e.avatarUrl,
        };
      });

      // Also add users that aren't in employees list
      for (const u of users) {
        if (!rows.some((r) => r.id === u.id)) {
          rows.push({
            id: u.id,
            name: u.name,
            email: u.email || "",
            title: u.title,
            hasDirectReports: false,
            preSelected: true,
            inferredRole: u.role || "learner",
            avatarUrl: u.avatarUrl,
          });
        }
      }

      setEmployeeRows(rows);
      setUserCount(users.length);
      setEmployeeCount(employees.length);

      // Pre-select users defined in JSON
      const preSelected = new Set(rows.filter((r) => r.preSelected).map((r) => r.id));
      setSelectedIds(preSelected);

      // Set initial roles
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

  const handleNextStep = () => {
    setStep("profiles");
    setError(null);
  };

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

  const handleCreate = useCallback(async () => {
    if (!pendingJson) return;
    setLoading(true);
    setError(null);

    try {
      // Build selected users array
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

      // Seed signed-in users for the new account
      const userIds = selectedUsers.map((u) => u.id);
      setInitialSignedInUsers(newAccountId, userIds);

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
  }, [pendingJson, employeeRows, selectedIds, roleMap, logoDataUrl, accountName, addAccount, setInitialSignedInUsers, onOpenChange]);

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

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (!v) reset();
    }}>
      <DialogContent className="max-w-md">
        {step === "upload" ? (
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
                <p className="text-xs text-muted-foreground mt-1">
                  .json files only
                </p>
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

            {parseWarnings.length > 0 && (
              <details className="rounded-md bg-warning/10 border border-warning/20 p-3 text-sm text-muted-foreground">
                <summary className="flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-xs">Optional sections missing (defaults applied)</p>
                    <p className="text-xs">{parseWarnings.length} section{parseWarnings.length > 1 ? "s" : ""} not provided</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform [[open]>&]:rotate-90" />
                </summary>
                <ul className="mt-2 space-y-0.5 text-xs pl-6 list-disc">
                  {parseWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </details>
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
                <Button onClick={handleNextStep} className="w-full gap-2">
                  Choose Sign-in Profiles <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
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
                          {checked && currentRole === "admin" && (
                            <ShieldCheck className="h-4 w-4 text-primary fill-primary/20 shrink-0" />
                          )}
                          {checked && currentRole === "manager" && (
                            <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        {row.title && (
                          <p className="text-xs text-muted-foreground truncate">{row.title}</p>
                        )}
                      </div>
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
              <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={loading || selectedIds.size === 0}
                className="flex-1"
              >
                {loading ? "Creating…" : `Create "${accountName}"`}
              </Button>
            </div>

            {selectedIds.size === 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Select at least one profile to continue.
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
