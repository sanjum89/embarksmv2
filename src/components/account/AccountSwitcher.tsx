import { useState } from "react";
import { Building2, Plus, Trash2, Check, ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AddAccountDialog } from "./AddAccountDialog";
import cornerstoneLogo from "@/assets/cornerstone-logo.svg";

interface AccountSwitcherProps {
  expanded: boolean;
  onToggleSidebar: () => void;
  variant?: "traditional" | "new";
}

export function AccountSwitcher({ expanded, onToggleSidebar, variant = "new" }: AccountSwitcherProps) {
  const { accounts, activeAccount, switchAccount, deleteAccount } = useAccount();
  const { styleTheme, superLight } = useTheme();
  const [addOpen, setAddOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [brandHovered, setBrandHovered] = useState(false);

  if (!activeAccount) return null;

  // Pick the right logo based on theme mode
  const isSuperLightActive = styleTheme === "new" && superLight;
  const superLightLogo = (activeAccount as any).logo_superlight;
  const accountLogo = isSuperLightActive && superLightLogo
    ? superLightLogo
    : activeAccount.logo || cornerstoneLogo;

  const isTraditional = variant === "traditional";

  return (
    <>
      <div className={cn("flex items-center w-full", expanded ? "justify-between" : "justify-center")}>
        {expanded ? (
          <>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-2 rounded-lg transition-colors hover:bg-muted/50 flex-1 min-w-0 px-1 py-1.5"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0">
                    <img src={accountLogo} alt={activeAccount.name} className="h-6 w-6 object-contain" style={{ background: 'transparent' }} />
                  </div>
                  <span className="font-display font-bold text-sm truncate flex-1 text-left text-foreground">
                    {activeAccount.name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="start" sideOffset={8} className="w-64 p-2">
                <p className="text-xs font-medium text-muted-foreground px-2 pb-2">Accounts</p>
                {accounts.map((acct) => {
                  const isActive = acct.id === activeAccount.id;
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
            <button
              onClick={onToggleSidebar}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-colors",
                isTraditional
                  ? "text-muted-foreground hover:bg-muted"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
              )}
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div
            className="relative flex h-9 w-9 items-center justify-center cursor-pointer"
            onMouseEnter={() => setBrandHovered(true)}
            onMouseLeave={() => setBrandHovered(false)}
            onClick={onToggleSidebar}
          >
            {brandHovered ? (
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                isTraditional ? "bg-muted" : "bg-sidebar-accent"
              )}>
                <PanelLeftOpen className="h-4.5 w-4.5 text-foreground" />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg">
                <img src={accountLogo} alt={activeAccount.name} className="h-6 w-6 object-contain" style={{ background: 'transparent' }} />
              </div>
            )}
          </div>
        )}
      </div>

      <AddAccountDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}