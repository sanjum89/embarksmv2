import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { User } from "@/types/learning";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableUsers: User[];
  signedInUserIds: string[];
  onLogin: (userId: string) => void;
}

export function LoginDialog({ open, onOpenChange, availableUsers, signedInUserIds, onLogin }: LoginDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");

  // Users not yet signed in
  const unsignedUsers = availableUsers.filter((u) => !signedInUserIds.includes(u.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedUserId) {
      setError("Please select a user");
      return;
    }
    onLogin(selectedUserId);
    setSelectedUserId("");
    setError("");
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedUserId("");
      setError("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Switch user</DialogTitle>
          <DialogDescription>Select a persona to add to this session.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="login-user">User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="login-user">
                <SelectValue placeholder="Select a user…" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[9999]">
                {unsignedUsers.length === 0 ? (
                  <SelectItem value="__none" disabled>All users are signed in</SelectItem>
                ) : (
                  unsignedUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}{u.title ? ` — ${u.title}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={unsignedUsers.length === 0}>
            Switch
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
