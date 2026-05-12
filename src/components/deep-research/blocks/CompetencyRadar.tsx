import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface Series {
  name: string;
  values: number[];
  tone?: "primary" | "accent" | "muted";
}

const TONE_COLOR: Record<NonNullable<Series["tone"]>, string> = {
  primary: "hsl(var(--primary))",
  accent: "hsl(var(--accent-foreground))",
  muted: "hsl(var(--muted-foreground))",
};

export function CompetencyRadar({
  subjects,
  series,
  height = 320,
}: {
  subjects: string[];
  series: Series[];
  height?: number;
}) {
  const data = subjects.map((subject, i) => {
    const row: Record<string, string | number> = { subject };
    series.forEach((s) => {
      row[s.name] = s.values[i] ?? 0;
    });
    return row;
  });

  return (
    <div className="rounded-xl border border-border/60 bg-card p-3" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s) => {
            const color = TONE_COLOR[s.tone ?? "primary"];
            return (
              <Radar
                key={s.name}
                name={s.name}
                dataKey={s.name}
                stroke={color}
                fill={color}
                fillOpacity={s.tone === "muted" ? 0.05 : 0.25}
                strokeWidth={s.tone === "muted" ? 1 : 2}
              />
            );
          })}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
