import { useTheme } from "@/contexts/ThemeContext";
import { useMemo } from "react";

export function useChartColors() {
  const { theme } = useTheme();
  
  return useMemo(() => {
    const isDark = theme === "dark";
    return {
      grid: isDark ? "hsl(222, 30%, 18%)" : "hsl(220, 16%, 90%)",
      tickFill: isDark ? "hsl(220, 10%, 55%)" : "hsl(220, 10%, 46%)",
      tooltipBg: isDark ? "hsl(222, 40%, 10%)" : "hsl(0, 0%, 100%)",
      tooltipBorder: isDark ? "hsl(222, 30%, 18%)" : "hsl(220, 16%, 90%)",
      accent: "hsl(38, 92%, 50%)",
      info: "hsl(210, 80%, 52%)",
      success: "hsl(152, 60%, 40%)",
      destructive: "hsl(0, 72%, 51%)",
      radarTargetStroke: isDark ? "hsl(220, 16%, 55%)" : "hsl(220, 16%, 70%)",
      radarTargetFill: isDark ? "hsl(220, 16%, 50%)" : "hsl(220, 16%, 80%)",
      radarCurrentStroke: isDark ? "hsl(220, 16%, 45%)" : "hsl(220, 16%, 55%)",
      radarCurrentFill: isDark ? "hsl(220, 16%, 40%)" : "hsl(220, 16%, 65%)",
    };
  }, [theme]);
}
