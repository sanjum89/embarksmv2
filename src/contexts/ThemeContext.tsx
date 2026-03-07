import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";
export type StyleTheme = "new" | "traditional";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  styleTheme: StyleTheme;
  setStyleTheme: (t: StyleTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  styleTheme: "new",
  setStyleTheme: () => {},
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

  const [styleTheme, setStyleTheme] = useState<StyleTheme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("styleTheme") as StyleTheme) || "new";
    }
    return "new";
  });

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

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, styleTheme, setStyleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
