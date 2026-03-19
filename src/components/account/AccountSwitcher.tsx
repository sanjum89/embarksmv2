import { useState } from "react";
import { Building2, Plus, Trash2, Check, ChevronDown } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AddAccountDialog } from "./AddAccountDialog";

interface AccountSwitcherProps {
  expanded: boolean;
}

export function AccountSwitcher({ expanded }: AccountSwitcherProps) {
  const { accounts, activeAccount, switchAccount, deleteAccount, loading } = useAccount();
  const [addOpen, setAddOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const currentAccount = activeAccount ?? accounts[0] ?? null;

  // While loading, show a static placeholder
  if (loading && !currentAccount) {
    return (
      <div className={cn("flex items-center gap-2 rounded-lg w-full", expanded ? "px-3 py-2" : "justify-center p-2")}>
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 shrink-0">
          <Building2 className="h-3.5 w-3.5 text-primary" />
        </div>
        {expanded && <span className="text-sm text-muted-foreground truncate flex-1 text-left">Loading…</span>}
      </div>
    );
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 rounded-lg transition-colors hover:bg-muted/50 w-full",
              expanded ? "px-3 py-2" : "justify-center p-2"
            )}
          >
            {currentAccount?.logo ? (
              <img src={currentAccount.logo} alt={currentAccount.name} className="h-6 w-6 rounded object-contain shrink-0" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 shrink-0">
                <Building2 className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            {expanded && (
              <>
                <span className="text-sm font-medium truncate flex-1 text-left text-foreground">
                  {currentAccount?.name ?? "Accounts"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent side={expanded ? "bottom" : "right"} align="start" sideOffset={8} className="w-64 p-2">
          <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Accounts</p>
          {accounts.map((acct) => {
            const isActive = acct.id === activeAccount?.id;
            return (
              <div key={acct.id} className="flex items-center gap-1">
                <button
                  onClick={() => { switchAccount(acct.id); setPopoverOpen(false); }}
                  className={cn(
                    "flex items-center gap-2.5 flex-1 rounded-md px-2 py-2 text-sm transition-colors text-left",
                    isActive ? "bg-accent/10 font-medium" : "hover:bg-secondary"
                  )}
                >
                  {acct.logo ? (
                    <img src={acct.logo} alt={acct.name} className="h-5 w-5 rounded object-contain shrink-0" />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 shrink-0">
                      <Building2 className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <span className="truncate flex-1">{acct.name}</span>
                  {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>
                {!acct.is_default && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await deleteAccount(acct.id);
                    }}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={() => { setAddOpen(true); setPopoverOpen(false); }}
            className="flex items-center gap-2.5 w-full rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors mt-1 border-t border-border pt-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Account</span>
          </button>
        </PopoverContent>
      </Popover>

      <AddAccountDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
