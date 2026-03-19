import { useState, useCallback } from "react";
import { Upload, FileJson, AlertCircle } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
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

export function AddAccountDialog({ open, onOpenChange }: AddAccountDialogProps) {
  const { addAccount } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

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

      await addAccount(json.name, json);

      toast({
        title: "Account added",
        description: `"${json.name}" has been created and is now active.`,
      });

      onOpenChange(false);
      setFileName(null);
    } catch (e: any) {
      setError(e.message || "Failed to parse JSON file.");
    } finally {
      setLoading(false);
    }
  }, [addAccount, onOpenChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
          <DialogDescription>
            Upload a JSON file to create a new customer account. The file should include a name, employees, and optionally skill targets, role plays, and branding.
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
