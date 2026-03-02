import { createContext, useContext, useState, ReactNode } from "react";

interface SidebarContextType {
  expanded: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({ expanded: false, toggle: () => {} });

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <SidebarContext.Provider value={{ expanded, toggle: () => setExpanded((e) => !e) }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebarState = () => useContext(SidebarContext);
