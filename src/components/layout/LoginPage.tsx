import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAccount } from "@/contexts/AccountContext";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LogIn } from "lucide-react";
import cornerstoneLogo from "@/assets/cornerstone-logo.svg";

const PASSWORD = "workforceai";

export function LoginPage() {
  const { accounts, activeAccountId, switchAccount, loading: accountsLoading } = useAccount();
  const { availableUsers, loginUser } = useUser();

  const [selectedAccountId, setSelectedAccountId] = useState(activeAccountId ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleAccountChange = (id: string) => {
    setSelectedAccountId(id);
    switchAccount(id);
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedAccountId) {
      setError("Please select an account");
      return;
    }
    if (password !== PASSWORD) {
      setError("Incorrect password");
      return;
    }
    // Find the admin user, fall back to first user
    const adminUser = availableUsers.find((u) => u.role === "admin") || availableUsers[0];
    if (!adminUser) {
      setError("No users available for this account.");
      return;
    }
    const success = loginUser(adminUser.id);
    if (!success) {
      setError("Login failed. Please try again.");
    }
  };

  if (accountsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-md mx-4">
        <div className="bg-card rounded-2xl shadow-xl border border-border p-8 space-y-6">
          {/* Logo & header */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <img src={cornerstoneLogo} alt="Logo" className="w-7 h-7 brightness-0 invert" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground font-heading">Welcome back</h1>
              <p className="text-sm text-muted-foreground mt-1">Sign in to continue to your workspace</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account selector */}
            <div className="space-y-2">
              <Label htmlFor="login-account">Account</Label>
              <Select value={selectedAccountId} onValueChange={handleAccountChange}>
                <SelectTrigger id="login-account">
                  <SelectValue placeholder="Select an account…" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[9999]">
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter password"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Hint: password is <span className="font-mono text-foreground/70">workforceai</span>
          </p>
        </div>
      </div>
    </div>
  );
}
