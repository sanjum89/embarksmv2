import { useState, useRef } from "react";
import { Paintbrush, Upload, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAccount } from "@/contexts/AccountContext";
import { supabase } from "@/integrations/supabase/client";
import { COLOR_PRESETS, deriveFromCustomColors, resolvePresetKey, resolvePresetKeyByColors } from "@/hooks/useBrandColors";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BrandingPanelProps {
  trigger: React.ReactNode;
}

interface BrandingPanelContentProps {
  embedded?: boolean;
}

function LogoUploadSlot({
  label,
  hint,
  currentUrl,
  uploading,
  onUpload,
  onClear,
}: {
  label: string;
  hint: string;
  currentUrl?: string | null;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        {currentUrl ? (
          <div className="relative h-10 w-10 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
            <img src={currentUrl} alt={label} className="h-full w-full object-contain" />
            <button
              onClick={onClear}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ) : (
          <div className="h-10 w-10 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
            <Upload className="h-4 w-4" />
          </div>
        )}
        <div>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-7 text-xs">
            {uploading ? "Uploading…" : "Upload"}
          </Button>
          <p className="text-[0.65rem] text-muted-foreground mt-0.5">{hint}</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
      </div>
    </div>
  );
}

export function BrandingPanel({ trigger }: BrandingPanelProps) {
  const { activeAccount, updateAccount } = useAccount();
  const [open, setOpen] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSuperLight, setUploadingSuperLight] = useState(false);
  const [customPrimary, setCustomPrimary] = useState("#1a3a5c");
  const [customAccent, setCustomAccent] = useState("#e8a020");

  if (!activeAccount) return null;

  const accountName = (activeAccount.name ?? "").trim().toLowerCase();
  const isRathbonesFamily = accountName === "rathbones" || accountName === "pinnacle capital";
  let currentPreset: string | null = isRathbonesFamily ? "rathbones-calm" : null;
  try {
    if (activeAccount.accent_color) {
      const config = JSON.parse(activeAccount.accent_color);
      currentPreset =
        resolvePresetKey(config.preset) ||
        resolvePresetKeyByColors(config.primary, config.accent, config.sidebar) ||
        currentPreset;
    }
  } catch {}

  const rathbonesPresets = Object.entries(COLOR_PRESETS).filter(([, p]) => p.family === "rathbones");
  const genericPresets = Object.entries(COLOR_PRESETS).filter(([, p]) => p.family !== "rathbones");

  const renderPresetButton = ([key, preset]: [string, typeof COLOR_PRESETS[string]]) => (
    <button
      key={key}
      onClick={() => handlePresetSelect(key)}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all",
        currentPreset === key ? "border-ring bg-muted shadow-sm" : "border-transparent hover:bg-muted/50"
      )}
    >
      <div className="flex gap-0.5">
        <div className="h-6 w-6 rounded-l-md" style={{ backgroundColor: preset.swatch[0] }} />
        <div className="h-6 w-6 rounded-r-md" style={{ backgroundColor: preset.swatch[1] }} />
      </div>
      <span className="text-[0.65rem] font-medium text-muted-foreground leading-tight text-center">{preset.label}</span>
      {currentPreset === key && <Check className="h-3 w-3 text-primary" />}
    </button>
  );

  const handlePresetSelect = async (presetKey: string) => {
    const preset = COLOR_PRESETS[presetKey];
    if (!preset) return;
    const config = JSON.stringify({ preset: presetKey, primary: preset.primary, accent: preset.accent, sidebar: preset.sidebar });
    try {
      await updateAccount(activeAccount.id, { accent_color: config });
      toast.success(`Applied "${preset.label}" theme`);
    } catch { toast.error("Failed to save color scheme"); }
  };

  const handleResetToDefault = async () => {
    try {
      await updateAccount(activeAccount.id, { accent_color: null });
      toast.success("Reset to default colors");
    } catch { toast.error("Failed to reset colors"); }
  };

  const handleCustomApply = async () => {
    const config = deriveFromCustomColors(customPrimary, customAccent);
    try {
      await updateAccount(activeAccount.id, { accent_color: JSON.stringify(config) });
      toast.success("Applied custom color scheme");
    } catch { toast.error("Failed to save custom colors"); }
  };

  const uploadLogo = async (file: File, variant: "main" | "superlight") => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    const setUploading = variant === "main" ? setUploadingMain : setUploadingSuperLight;
    setUploading(true);
    try {
      // Delete any existing files for this variant first
      const suffix = variant === "superlight" ? "-superlight" : "";
      const prefix = `${activeAccount.id}/logo${suffix}`;
      const { data: existingFiles } = await supabase.storage.from("logos").list(activeAccount.id);
      if (existingFiles) {
        const toDelete = existingFiles
          .filter((f) => f.name.startsWith(`logo${suffix}.`))
          .map((f) => `${activeAccount.id}/${f.name}`);
        if (toDelete.length > 0) {
          await supabase.storage.from("logos").remove(toDelete);
        }
      }

      const ext = file.name.split(".").pop();
      const path = `${prefix}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      // Append cache-buster to avoid stale cached URLs
      const freshUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const field = variant === "main" ? "logo" : "logo_superlight";
      await updateAccount(activeAccount.id, { [field]: freshUrl });
      toast.success(variant === "main" ? "Logo updated" : "Super Light logo updated");
    } catch (err: any) { toast.error(err.message || "Failed to upload logo"); }
    finally { setUploading(false); }
  };

  const inner = (
    <>
      {/* Logo Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Account Logos</Label>
        <p className="text-xs text-muted-foreground">
          Upload separate logos for different theme modes.
        </p>
        <LogoUploadSlot
          label="Light & Dark Mode Logo"
          hint="Used on coloured / dark sidebars"
          currentUrl={activeAccount.logo}
          uploading={uploadingMain}
          onUpload={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0], "main")}
          onClear={async () => { try { await updateAccount(activeAccount.id, { logo: null }); toast.success("Logo cleared"); } catch { toast.error("Failed to clear logo"); } }}
        />
        <LogoUploadSlot
          label="Super Light Mode Logo"
          hint="Used on white sidebar backgrounds"
          currentUrl={(activeAccount as any).logo_superlight}
          uploading={uploadingSuperLight}
          onUpload={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0], "superlight")}
          onClear={async () => { try { await updateAccount(activeAccount.id, { logo_superlight: null }); toast.success("Super Light logo cleared"); } catch { toast.error("Failed to clear logo"); } }}
        />
      </div>

      <Separator />

      {/* Preset Color Schemes */}
      <div className="space-y-4">
        {isRathbonesFamily && rathbonesPresets.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{activeAccount.name} theme</Label>
            <div className="grid grid-cols-1 gap-2">
              {rathbonesPresets.map(renderPresetButton)}
            </div>
          </div>
        )}
        {genericPresets.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Other palettes</Label>
            <div className="grid grid-cols-3 gap-2">
              {genericPresets.map(renderPresetButton)}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Custom Colors */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Custom Client Colors</Label>
        <p className="text-xs text-muted-foreground">Enter your client's brand colors and we'll generate a full theme.</p>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Primary</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="h-8 w-8 rounded border border-input cursor-pointer" />
              <Input value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="h-8 text-xs font-mono" placeholder="#1a3a5c" />
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Accent</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={customAccent} onChange={(e) => setCustomAccent(e.target.value)} className="h-8 w-8 rounded border border-input cursor-pointer" />
              <Input value={customAccent} onChange={(e) => setCustomAccent(e.target.value)} className="h-8 text-xs font-mono" placeholder="#e8a020" />
            </div>
          </div>
        </div>
        <Button onClick={handleCustomApply} size="sm" className="w-full">Apply Custom Colors</Button>
      </div>

      <Separator />

      <Button variant="outline" size="sm" className="w-full" onClick={handleResetToDefault} disabled={!activeAccount.accent_color}>
        Reset to Default
      </Button>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            Branding
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">{inner}</div>
      </DialogContent>
    </Dialog>
  );
}

export function BrandingPanelContent(_: BrandingPanelContentProps = {}) {
  return (
    <BrandingInner />
  );
}

function BrandingInner() {
  const { activeAccount, updateAccount } = useAccount();
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSuperLight, setUploadingSuperLight] = useState(false);
  const [customPrimary, setCustomPrimary] = useState("#1a3a5c");
  const [customAccent, setCustomAccent] = useState("#e8a020");

  if (!activeAccount) return null;

  const accountName = (activeAccount.name ?? "").trim().toLowerCase();
  const isRathbonesFamily = accountName === "rathbones" || accountName === "pinnacle capital";
  let currentPreset: string | null = isRathbonesFamily ? "rathbones-calm" : null;
  try {
    if (activeAccount.accent_color) {
      const config = JSON.parse(activeAccount.accent_color);
      currentPreset =
        resolvePresetKey(config.preset) ||
        resolvePresetKeyByColors(config.primary, config.accent, config.sidebar) ||
        currentPreset;
    }
  } catch {}

  const rathbonesPresets = Object.entries(COLOR_PRESETS).filter(([, p]) => p.family === "rathbones");
  const genericPresets = Object.entries(COLOR_PRESETS).filter(([, p]) => p.family !== "rathbones");

  const handlePresetSelect = async (presetKey: string) => {
    const preset = COLOR_PRESETS[presetKey];
    if (!preset) return;
    const config = JSON.stringify({ preset: presetKey, primary: preset.primary, accent: preset.accent, sidebar: preset.sidebar });
    try {
      await updateAccount(activeAccount.id, { accent_color: config });
      toast.success(`Applied "${preset.label}" theme`);
    } catch { toast.error("Failed to save color scheme"); }
  };

  const handleResetToDefault = async () => {
    try {
      await updateAccount(activeAccount.id, { accent_color: null });
      toast.success("Reset to default colors");
    } catch { toast.error("Failed to reset colors"); }
  };

  const handleCustomApply = async () => {
    const config = deriveFromCustomColors(customPrimary, customAccent);
    try {
      await updateAccount(activeAccount.id, { accent_color: JSON.stringify(config) });
      toast.success("Applied custom color scheme");
    } catch { toast.error("Failed to save custom colors"); }
  };

  const uploadLogo = async (file: File, variant: "main" | "superlight") => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    const setUploading = variant === "main" ? setUploadingMain : setUploadingSuperLight;
    setUploading(true);
    try {
      const suffix = variant === "superlight" ? "-superlight" : "";
      const prefix = `${activeAccount.id}/logo${suffix}`;
      const { data: existingFiles } = await supabase.storage.from("logos").list(activeAccount.id);
      if (existingFiles) {
        const toDelete = existingFiles
          .filter((f) => f.name.startsWith(`logo${suffix}.`))
          .map((f) => `${activeAccount.id}/${f.name}`);
        if (toDelete.length > 0) {
          await supabase.storage.from("logos").remove(toDelete);
        }
      }
      const ext = file.name.split(".").pop();
      const path = `${prefix}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
      const freshUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const field = variant === "main" ? "logo" : "logo_superlight";
      await updateAccount(activeAccount.id, { [field]: freshUrl });
      toast.success(variant === "main" ? "Logo updated" : "Super Light logo updated");
    } catch (err: any) { toast.error(err.message || "Failed to upload logo"); }
    finally { setUploading(false); }
  };

  const renderPresetButton = ([key, preset]: [string, typeof COLOR_PRESETS[string]]) => (
    <button
      key={key}
      onClick={() => handlePresetSelect(key)}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all",
        currentPreset === key ? "border-ring bg-muted shadow-sm" : "border-transparent hover:bg-muted/50"
      )}
    >
      <div className="flex gap-0.5">
        <div className="h-6 w-6 rounded-l-md" style={{ backgroundColor: preset.swatch[0] }} />
        <div className="h-6 w-6 rounded-r-md" style={{ backgroundColor: preset.swatch[1] }} />
      </div>
      <span className="text-[0.65rem] font-medium text-muted-foreground leading-tight text-center">{preset.label}</span>
      {currentPreset === key && <Check className="h-3 w-3 text-primary" />}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Account Logos</Label>
        <p className="text-xs text-muted-foreground">Upload separate logos for different theme modes.</p>
        <LogoUploadSlot
          label="Light & Dark Mode Logo"
          hint="Used on coloured / dark sidebars"
          currentUrl={activeAccount.logo}
          uploading={uploadingMain}
          onUpload={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0], "main")}
          onClear={async () => { try { await updateAccount(activeAccount.id, { logo: null }); toast.success("Logo cleared"); } catch { toast.error("Failed to clear logo"); } }}
        />
        <LogoUploadSlot
          label="Super Light Mode Logo"
          hint="Used on white sidebar backgrounds"
          currentUrl={(activeAccount as any).logo_superlight}
          uploading={uploadingSuperLight}
          onUpload={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0], "superlight")}
          onClear={async () => { try { await updateAccount(activeAccount.id, { logo_superlight: null }); toast.success("Super Light logo cleared"); } catch { toast.error("Failed to clear logo"); } }}
        />
      </div>

      <Separator />

      <div className="space-y-4">
        {isRathbonesFamily && rathbonesPresets.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{activeAccount.name} theme</Label>
            <div className="grid grid-cols-1 gap-2">{rathbonesPresets.map(renderPresetButton)}</div>
          </div>
        )}
        {genericPresets.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Other palettes</Label>
            <div className="grid grid-cols-3 gap-2">{genericPresets.map(renderPresetButton)}</div>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Custom Client Colors</Label>
        <p className="text-xs text-muted-foreground">Enter your client's brand colors and we'll generate a full theme.</p>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Primary</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="h-8 w-8 rounded border border-input cursor-pointer" />
              <Input value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="h-8 text-xs font-mono" placeholder="#1a3a5c" />
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Accent</Label>
            <div className="flex gap-2 items-center">
              <input type="color" value={customAccent} onChange={(e) => setCustomAccent(e.target.value)} className="h-8 w-8 rounded border border-input cursor-pointer" />
              <Input value={customAccent} onChange={(e) => setCustomAccent(e.target.value)} className="h-8 text-xs font-mono" placeholder="#e8a020" />
            </div>
          </div>
        </div>
        <Button onClick={handleCustomApply} size="sm" className="w-full">Apply Custom Colors</Button>
      </div>

      <Separator />

      <Button variant="outline" size="sm" className="w-full" onClick={handleResetToDefault} disabled={!activeAccount.accent_color}>
        Reset to Default
      </Button>
    </div>
  );
}