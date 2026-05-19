import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";
export type StyleTheme = "new" | "traditional";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  styleTheme: StyleTheme;
  setStyleTheme: (t: StyleTheme) => void;
  superLight: boolean;
  setSuperLight: (v: boolean) => void;
  showLegacyModules: boolean;
  setShowLegacyModules: (v: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  styleTheme: "new",
  setStyleTheme: () => {},
  superLight: true,
  setSuperLight: () => {},
  showLegacyModules: false,
  setShowLegacyModules: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored) return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  const [styleTheme, setStyleThemeRaw] = useState<StyleTheme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("styleTheme") as StyleTheme) || "traditional";
    }
    return "traditional";
  });

  const [superLight, setSuperLightRaw] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("superLight");
      if (stored !== null) return stored === "true";
      return true; // default true for new UI
    }
    return true;
  });

  const setStyleTheme = (t: StyleTheme) => {
    setStyleThemeRaw(t);
    if (t === "new") {
      setSuperLightRaw(true);
    }
  };

  const setSuperLight = (v: boolean) => setSuperLightRaw(v);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("traditional", styleTheme === "traditional");
    localStorage.setItem("styleTheme", styleTheme);
  }, [styleTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("super-light", superLight && styleTheme === "new");
    localStorage.setItem("superLight", String(superLight));
  }, [superLight, styleTheme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, styleTheme, setStyleTheme, superLight, setSuperLight }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
