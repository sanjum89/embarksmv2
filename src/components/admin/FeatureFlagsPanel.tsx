import { useState } from "react";
import { Loader2, Layers, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useWorkforceGroups } from "@/contexts/WorkforceGroupContext";
import { toast } from "@/hooks/use-toast";

export default function FeatureFlagsPanel() {
  const { enabled, toggleEnabled } = useWorkforceGroups();
  const [saving, setSaving] = useState(false);

  const handleToggle = async (next: boolean) => {
    setSaving(true);
    try {
      await toggleEnabled(next);
      toast({ title: next ? "Workforce Groups enabled" : "Workforce Groups disabled" });
    } catch (e: any) {
      toast({ title: "Couldn't update flag", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Features</CardTitle>
        <CardDescription>Opt-in to beta capabilities for this account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="rounded-md bg-primary/10 p-2 mt-0.5">
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm font-medium">Workforce Groups (Beta)</Label>
              <div className="flex items-center gap-2">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                <Switch checked={enabled} disabled={saving} onCheckedChange={handleToggle} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              Slice the platform by Office → Function → Desk/Team → Initiative. Adds a global group selector,
              a management page, and a Group Readiness section in the Action Centre. When OFF the current
              experience is shown for all users.
            </p>
            {enabled && (
              <>
                <Separator className="my-3" />
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/workforce-groups">
                    Manage workforce groups
                    <ExternalLink className="h-3 w-3 ml-1.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
