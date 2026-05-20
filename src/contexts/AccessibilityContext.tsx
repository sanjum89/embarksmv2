import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type FontScale = "compact" | "default" | "large" | "xlarge";

const SCALE_PX: Record<FontScale, number> = {
  compact: 15,
  default: 17,
  large: 19,
  xlarge: 21,
};

const SCALE_ORDER: FontScale[] = ["compact", "default", "large", "xlarge"];

export interface A11ySettings {
  fontScale: FontScale;
  relaxedSpacing: boolean;
  wideLetters: boolean;
  dyslexiaFriendly: boolean;
  underlineLinks: boolean;
  reduceMotion: boolean;
}

const DEFAULTS: A11ySettings = {
  fontScale: "large",
  relaxedSpacing: false,
  wideLetters: false,
  dyslexiaFriendly: false,
  underlineLinks: false,
  reduceMotion: false,
};

const STORAGE_KEY = "a11y-settings";
const DYSLEXIC_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap";
const DYSLEXIC_LINK_ID = "a11y-dyslexic-font";

function loadSettings(): A11ySettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

interface AccessibilityContextType extends A11ySettings {
  setFontScale: (s: FontScale) => void;
  setRelaxedSpacing: (v: boolean) => void;
  setWideLetters: (v: boolean) => void;
  setDyslexiaFriendly: (v: boolean) => void;
  setUnderlineLinks: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  reset: () => void;
  cycleScale: (direction: 1 | -1) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  ...DEFAULTS,
  setFontScale: () => {},
  setRelaxedSpacing: () => {},
  setWideLetters: () => {},
  setDyslexiaFriendly: () => {},
  setUnderlineLinks: () => {},
  setReduceMotion: () => {},
  reset: () => {},
  cycleScale: () => {},
});

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(loadSettings);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Apply root font-size + classes
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${SCALE_PX[settings.fontScale]}px`;
    root.classList.toggle("a11y-relaxed", settings.relaxedSpacing);
    root.classList.toggle("a11y-wide", settings.wideLetters);
    root.classList.toggle("a11y-dyslexic", settings.dyslexiaFriendly);
    root.classList.toggle("a11y-underline", settings.underlineLinks);
    root.classList.toggle("no-motion", settings.reduceMotion);
  }, [settings]);

  // Lazily load dyslexia-friendly font when needed
  useEffect(() => {
    if (!settings.dyslexiaFriendly) return;
    if (document.getElementById(DYSLEXIC_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = DYSLEXIC_LINK_ID;
    link.rel = "stylesheet";
    link.href = DYSLEXIC_FONT_HREF;
    document.head.appendChild(link);
  }, [settings.dyslexiaFriendly]);

  const cycleScale = useCallback((direction: 1 | -1) => {
    setSettings((s) => {
      const idx = SCALE_ORDER.indexOf(s.fontScale);
      const next = Math.min(SCALE_ORDER.length - 1, Math.max(0, idx + direction));
      return { ...s, fontScale: SCALE_ORDER[next] };
    });
  }, []);

  // Keyboard shortcuts: Ctrl/Cmd +/- (only when not editing text)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        cycleScale(1);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        cycleScale(-1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cycleScale]);

  const value: AccessibilityContextType = {
    ...settings,
    setFontScale: (fontScale) => setSettings((s) => ({ ...s, fontScale })),
    setRelaxedSpacing: (relaxedSpacing) => setSettings((s) => ({ ...s, relaxedSpacing })),
    setWideLetters: (wideLetters) => setSettings((s) => ({ ...s, wideLetters })),
    setDyslexiaFriendly: (dyslexiaFriendly) => setSettings((s) => ({ ...s, dyslexiaFriendly })),
    setUnderlineLinks: (underlineLinks) => setSettings((s) => ({ ...s, underlineLinks })),
    setReduceMotion: (reduceMotion) => setSettings((s) => ({ ...s, reduceMotion })),
    reset: () => setSettings(DEFAULTS),
    cycleScale,
  };

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export const useAccessibility = () => useContext(AccessibilityContext);
