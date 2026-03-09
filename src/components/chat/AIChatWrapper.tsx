import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { MessageSquare, X } from "lucide-react";
import { AIChatPanel, AIChatPanelHandle } from "./AIChatPanel";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface AIChatWrapperProps {
  contextLabel?: string;
  suggestedActions?: { label: string }[];
}

export interface AIChatWrapperHandle {
  sendMessage: (prompt: string, mockResponse: string, actions?: { label: string }[]) => void;
  clearMessages: () => void;
}

export const AIChatWrapper = forwardRef<AIChatWrapperHandle, AIChatWrapperProps>(
  function AIChatWrapper({ contextLabel, suggestedActions }, ref) {
    const { styleTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const chatRef = useRef<AIChatPanelHandle>(null);

    useImperativeHandle(ref, () => ({
      sendMessage: (prompt, mockResponse, actions) => {
        chatRef.current?.sendMessage(prompt, mockResponse, actions);
        if (styleTheme === "traditional") setOpen(true);
      },
      clearMessages: () => chatRef.current?.clearMessages(),
    }));

    if (styleTheme === "traditional") {
      return (
        <>
          {/* Floating chat button */}
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              "fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200",
              open
                ? "bg-muted text-muted-foreground hover:bg-muted/80"
                : "bg-primary text-primary-foreground hover:opacity-90"
            )}
          >
            {open ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
          </button>

          {/* Floating chat panel */}
          {open && (
            <div className="fixed bottom-20 right-6 z-50 w-[360px] h-[520px] rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
              <AIChatPanel ref={chatRef} contextLabel={contextLabel} suggestedActions={suggestedActions} />
            </div>
          )}
        </>
      );
    }

    // New UI: full sidebar panel
    return (
      <div className="w-[400px] shrink-0 border-l border-border h-screen sticky top-0">
        <AIChatPanel ref={chatRef} contextLabel={contextLabel} suggestedActions={suggestedActions} />
      </div>
    );
  }
);
