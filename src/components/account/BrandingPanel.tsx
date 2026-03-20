import { useState, useRef } from "react";
import { Paintbrush, Upload, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAccount } from "@/contexts/AccountContext";
import { supabase } from "@/integrations/supabase/client";
import { COLOR_PRESETS, deriveFromCustomColors } from "@/hooks/useBrandColors";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BrandingPanelProps {
  trigger: React.ReactNode;
}

export function BrandingPanel({ trigger }: BrandingPanelProps) {
  const { activeAccount, updateAccount } = useAccount();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [customPrimary, setCustomPrimary] = useState("#1a3a5c");
  const [customAccent, setCustomAccent] = useState("#e8a020");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!activeAccount) return null;

  // Parse current preset
  let currentPreset = "navy-amber";
  try {
    if (activeAccount.accent_color) {
      const config = JSON.parse(activeAccount.accent_color);
      currentPreset = config.preset || "navy-amber";
    }
  } catch {}

  const handlePresetSelect = async (presetKey: string) => {
    const preset = COLOR_PRESETS[presetKey];
    if (!preset) return;
    const config = JSON.stringify({
      preset: presetKey,
      primary: preset.primary,
      accent: preset.accent,
      sidebar: preset.sidebar,
    });
    try {
      await updateAccount(activeAccount.id, { accent_color: config });
      toast.success(`Applied "${preset.label}" theme`);
    } catch (err) {
      toast.error("Failed to save color scheme");
    }
  };

  const handleResetToDefault = async () => {
    try {
      await updateAccount(activeAccount.id, { accent_color: null });
      toast.success("Reset to default colors");
    } catch {
      toast.error("Failed to reset colors");
    }
  };

  const handleCustomApply = async () => {
    const config = deriveFromCustomColors(customPrimary, customAccent);
    try {
      await updateAccount(activeAccount.id, {
        accent_color: JSON.stringify(config),
      });
      toast.success("Applied custom color scheme");
    } catch (err) {
      toast.error("Failed to save custom colors");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${activeAccount.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("logos")
        .getPublicUrl(path);

      await updateAccount(activeAccount.id, { logo: urlData.publicUrl });
      toast.success("Logo updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleClearLogo = async () => {
    try {
      await updateAccount(activeAccount.id, { logo: null });
      toast.success("Logo cleared");
    } catch {
      toast.error("Failed to clear logo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            Branding
          </DialogTitle>
        </DialogHeader>

        {/* Logo Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Account Logo</Label>
          <div className="flex items-center gap-3">
            {activeAccount.logo ? (
              <div className="relative h-12 w-12 rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                <img src={activeAccount.logo} alt="Logo" className="h-full w-full object-contain" />
                <button
                  onClick={handleClearLogo}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="h-12 w-12 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground">
                <Upload className="h-5 w-5" />
              </div>
            )}
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Upload Logo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">PNG or SVG recommended</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
        </div>

        <Separator />

        {/* Preset Color Schemes */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Color Scheme</Label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(COLOR_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handlePresetSelect(key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all",
                  currentPreset === key
                    ? "border-ring bg-muted shadow-sm"
                    : "border-transparent hover:bg-muted/50"
                )}
              >
                <div className="flex gap-0.5">
                  <div
                    className="h-6 w-6 rounded-l-md"
                    style={{ backgroundColor: preset.swatch[0] }}
                  />
                  <div
                    className="h-6 w-6 rounded-r-md"
                    style={{ backgroundColor: preset.swatch[1] }}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">
                  {preset.label}
                </span>
                {currentPreset === key && (
                  <Check className="h-3 w-3 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Colors */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Custom Client Colors</Label>
          <p className="text-xs text-muted-foreground">
            Enter your client's brand colors and we'll generate a full theme.
          </p>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Primary</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="h-8 w-8 rounded border border-input cursor-pointer"
                />
                <Input
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="#1a3a5c"
                />
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Accent</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={customAccent}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="h-8 w-8 rounded border border-input cursor-pointer"
                />
                <Input
                  value={customAccent}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="#e8a020"
                />
              </div>
            </div>
          </div>
          <Button onClick={handleCustomApply} size="sm" className="w-full">
            Apply Custom Colors
          </Button>
        </div>

        <Separator />

        {/* Reset */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleResetToDefault}
          disabled={!activeAccount.accent_color}
        >
          Reset to Default
        </Button>
      </DialogContent>
    </Dialog>
  );
}
