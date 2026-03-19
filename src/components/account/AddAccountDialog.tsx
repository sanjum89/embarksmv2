import { useState, useCallback } from "react";
import { Upload, FileJson, AlertCircle, ImageIcon, X, AlertTriangle } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { parseAccountJSON } from "@/lib/accountParser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AddAccountDialog({ open, onOpenChange }: AddAccountDialogProps) {
  const { addAccount } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [pendingJson, setPendingJson] = useState<any>(null);

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
    setFileName(file.name);
    setLoading(true);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!json.name || typeof json.name !== "string") {
        throw new Error("JSON must include a 'name' field (string).");
      }

      setPendingJson(json);
    } catch (e: any) {
      setError(e.message || "Failed to parse JSON file.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!pendingJson) return;
    setLoading(true);
    setError(null);
    try {
      const payload = { ...pendingJson };
      if (logoDataUrl) {
        payload.logo = logoDataUrl;
      }
      await addAccount(payload.name, payload);
      toast({
        title: "Account added",
        description: `"${payload.name}" has been created and is now active.`,
      });
      onOpenChange(false);
      setFileName(null);
      setLogoDataUrl(null);
      setLogoFileName(null);
      setPendingJson(null);
    } catch (e: any) {
      setError(e.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }, [pendingJson, logoDataUrl, addAccount, onOpenChange]);

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
      if (!v) { setFileName(null); setLogoDataUrl(null); setLogoFileName(null); setPendingJson(null); setError(null); }
    }}>
      <DialogContent className="max-w-md">
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

        {pendingJson && (
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Creating…" : `Create "${pendingJson.name}"`}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
