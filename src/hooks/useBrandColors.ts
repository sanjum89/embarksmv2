import { useEffect } from "react";
import { useAccount } from "@/contexts/AccountContext";
import { useTheme } from "@/contexts/ThemeContext";

interface BrandColorConfig {
  preset?: string;
  primary?: string;
  accent?: string;
  sidebar?: string;
  ring?: string;
  sidebarForeground?: string;
  sidebarBorder?: string;
  sidebarPrimary?: string;
}

// Default HSL values from index.css :root
const DEFAULTS_LIGHT: Record<string, string> = {
  "--primary": "222 60% 22%",
  "--primary-foreground": "45 100% 96%",
  "--accent": "38 92% 50%",
  "--accent-foreground": "222 60% 12%",
  "--ring": "222 60% 22%",
  "--sidebar-background": "222 60% 16%",
  "--sidebar-foreground": "220 20% 85%",
  "--sidebar-primary": "38 92% 50%",
  "--sidebar-primary-foreground": "222 60% 12%",
  "--sidebar-accent": "222 40% 24%",
  "--sidebar-accent-foreground": "220 20% 92%",
  "--sidebar-border": "222 40% 22%",
  "--sidebar-ring": "38 92% 50%",
  "--sidebar-muted": "222 30% 32%",
};

export const COLOR_PRESETS: Record<string, { label: string; primary: string; accent: string; sidebar: string; swatch: [string, string] }> = {
  "navy-amber": {
    label: "Navy & Amber",
    primary: "222 60% 22%",
    accent: "38 92% 50%",
    sidebar: "222 60% 16%",
    swatch: ["hsl(222, 60%, 22%)", "hsl(38, 92%, 50%)"],
  },
  "teal-coral": {
    label: "Teal & Coral",
    primary: "180 45% 25%",
    accent: "12 80% 55%",
    sidebar: "180 35% 14%",
    swatch: ["hsl(180, 45%, 25%)", "hsl(12, 80%, 55%)"],
  },
  "purple-gold": {
    label: "Purple & Gold",
    primary: "270 50% 35%",
    accent: "42 90% 50%",
    sidebar: "270 40% 18%",
    swatch: ["hsl(270, 50%, 35%)", "hsl(42, 90%, 50%)"],
  },
  "forest-amber": {
    label: "Forest & Amber",
    primary: "150 40% 25%",
    accent: "38 85% 48%",
    sidebar: "150 35% 14%",
    swatch: ["hsl(150, 40%, 25%)", "hsl(38, 85%, 48%)"],
  },
  "slate-blue": {
    label: "Slate & Blue",
    primary: "215 25% 30%",
    accent: "210 80% 52%",
    sidebar: "215 20% 16%",
    swatch: ["hsl(215, 25%, 30%)", "hsl(210, 80%, 52%)"],
  },
  "charcoal-red": {
    label: "Charcoal & Red",
    primary: "0 0% 20%",
    accent: "0 72% 51%",
    sidebar: "0 0% 12%",
    swatch: ["hsl(0, 0%, 20%)", "hsl(0, 72%, 51%)"],
  },
  "rathbones": {
    label: "Rathbones",
    primary: "230 75% 20%",
    accent: "22 75% 81%",
    sidebar: "230 75% 14%",
    swatch: ["hsl(230, 75%, 20%)", "hsl(22, 75%, 81%)"],
  },
};

function deriveThemeVars(primary: string, accent: string, sidebar: string): Record<string, string> {
  // Parse primary HSL to derive foregrounds
  const [pH] = primary.split(" ").map((v) => parseFloat(v));
  const [aH] = accent.split(" ").map((v) => parseFloat(v));

  // Parse accent lightness to determine if sidebar-primary-foreground should be light or dark
  const accentParts = accent.split(" ").map((v) => parseFloat(v));
  const accentLightness = accentParts[2] ?? 50;
  const sidebarPrimaryFg = accentLightness < 50 ? "0 0% 100%" : `${pH} 60% 12%`;

  return {
    "--primary": primary,
    "--primary-foreground": "45 100% 96%",
    "--accent": accent,
    "--accent-foreground": `${pH} 60% 12%`,
    "--ring": primary,
    "--warning": accent,
    "--warning-foreground": `${pH} 60% 12%`,
    "--sidebar-background": sidebar,
    "--sidebar-foreground": `${pH} 20% 85%`,
    "--sidebar-primary": accent,
    "--sidebar-primary-foreground": sidebarPrimaryFg,
    "--sidebar-accent": `${pH} 40% 24%`,
    "--sidebar-accent-foreground": `${pH} 20% 92%`,
    "--sidebar-border": `${pH} 40% 22%`,
    "--sidebar-ring": accent,
    "--sidebar-muted": `${pH} 30% 32%`,
  };
}

export function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function deriveFromCustomColors(primaryHex: string, accentHex: string): BrandColorConfig {
  const primary = hexToHsl(primaryHex);
  const accent = hexToHsl(accentHex);
  const [pH] = primary.split(" ").map((v) => parseFloat(v));
  const sidebar = `${pH} 60% 16%`;
  return { preset: "custom", primary, accent, sidebar };
}

const SIDEBAR_VARS = [
  "--sidebar-background",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-accent",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
  "--sidebar-muted",
];

const NON_SIDEBAR_VARS = [
  "--primary",
  "--primary-foreground",
  "--accent",
  "--accent-foreground",
  "--ring",
];

export function useBrandColors() {
  const { activeAccount } = useAccount();
  const { superLight, theme, styleTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;

    if (!activeAccount?.accent_color) {
      // Restore defaults — remove all inline overrides
      Object.keys(DEFAULTS_LIGHT).forEach((prop) => {
        root.style.removeProperty(prop);
      });
      return;
    }

    try {
      const config: BrandColorConfig = JSON.parse(activeAccount.accent_color);
      const { primary, accent, sidebar } = config;
      if (!primary || !accent || !sidebar) return;

      const vars = deriveThemeVars(primary, accent, sidebar);

      // Always apply non-sidebar vars
      Object.entries(vars).forEach(([prop, val]) => {
        if (NON_SIDEBAR_VARS.includes(prop)) {
          root.style.setProperty(prop, val);
        }
      });

      // Only apply sidebar vars when NOT in super-light mode (inline styles override CSS classes)
      // Exception: always apply sidebar-primary so active nav icons reflect the brand
      const isSuperLight = superLight && styleTheme !== "traditional" && theme !== "dark";
      Object.entries(vars).forEach(([prop, val]) => {
        if (SIDEBAR_VARS.includes(prop)) {
          if (isSuperLight) {
            // In super-light, apply only the primary icon color + derive a light-friendly accent
            if (prop === "--sidebar-primary") {
              root.style.setProperty(prop, primary);
            } else if (prop === "--sidebar-primary-foreground") {
              // Contrast against primary (used as sidebar-primary in super-light)
              const pParts = primary.split(" ").map((v) => parseFloat(v));
              const pLightness = pParts[2] ?? 50;
              root.style.setProperty(prop, pLightness < 50 ? "0 0% 100%" : `${pParts[0]} 60% 12%`);
            } else if (prop === "--sidebar-accent") {
              // Derive a light-bg-friendly active highlight from the brand primary
              const [pH] = primary.split(" ").map((v) => parseFloat(v));
              root.style.setProperty(prop, `${pH} 40% 95%`);
            } else if (prop === "--sidebar-accent-foreground") {
              const [pH] = primary.split(" ").map((v) => parseFloat(v));
              root.style.setProperty(prop, `${pH} 60% 20%`);
            } else {
              root.style.removeProperty(prop);
            }
          } else {
            root.style.setProperty(prop, val);
          }
        }
      });
    } catch {
      // Not valid JSON, ignore
    }

    return () => {
      Object.keys(DEFAULTS_LIGHT).forEach((prop) => {
        root.style.removeProperty(prop);
      });
    };
  }, [activeAccount?.accent_color, activeAccount?.id, superLight, theme, styleTheme]);
}
