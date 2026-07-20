"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { CHART } from "@/lib/chart-colors";

const tooltipStyle = {
  borderRadius: 14,
  background: "var(--color-surface)",
  border: "1px solid var(--color-chart-grid)",
  boxShadow: "0 8px 24px rgba(11,11,18,0.08)",
  color: "var(--color-ink)",
  fontSize: 13,
  padding: "8px 12px",
};

const axisTick = { fill: CHART.textSecondary, fontSize: 12 };

export function AccuracyBySubjectChart({ data }: { data: { name: string; accuracy: number }[] }) {
  if (data.length === 0) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={CHART.grid} />
        <XAxis dataKey="name" tick={axisTick} axisLine={{ stroke: CHART.grid }} tickLine={false} />
        <YAxis
          domain={[0, 100]}
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [`${value}%`, "Точность"]}
          cursor={{ fill: "var(--color-chart-grid)" }}
        />
        <Bar dataKey="accuracy" fill={CHART.blue} radius={[8, 8, 0, 0]} maxBarSize={56} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopErrorTopicsChart({ data }: { data: { name: string; count: number }[] }) {
  if (data.length === 0) return <EmptyState label="Ошибок пока нет — так держать!" />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 46)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} stroke={CHART.grid} />
        <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={180}
          tick={{ ...axisTick, fontSize: 12.5 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [value, "Ошибок"]}
          cursor={{ fill: "var(--color-chart-grid)" }}
        />
        <Bar dataKey="count" fill={CHART.status.critical} radius={[0, 8, 8, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ActivityChart({ data }: { data: { label: string; attempts: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.blue} stopOpacity={0.25} />
            <stop offset="100%" stopColor={CHART.blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={CHART.grid} />
        <XAxis
          dataKey="label"
          tick={axisTick}
          axisLine={{ stroke: CHART.grid }}
          tickLine={false}
          interval={1}
        />
        <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, "Заданий"]} />
        <Area
          type="monotone"
          dataKey="attempts"
          stroke={CHART.blue}
          strokeWidth={2}
          fill="url(#activityFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AccuracyDonut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <EmptyState />;
  const colors = [CHART.status.good, CHART.status.critical];

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            startAngle={90}
            endAngle={-270}
            innerRadius={62}
            outerRadius={88}
            paddingAngle={3}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={28}
            formatter={(value) => <span style={{ color: CHART.textSecondary, fontSize: 12.5 }}>{value}</span>}
          />
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 top-[76px] text-center">
        <div className="font-display text-2xl font-extrabold">
          {total > 0 ? Math.round((data[0].value / total) * 100) : 0}%
        </div>
        <div className="text-xs text-(--color-ink-soft)">точность</div>
      </div>
    </div>
  );
}

function EmptyState({ label = "Пока нет данных — реши пару заданий" }: { label?: string }) {
  return (
    <div className="flex h-[180px] items-center justify-center text-sm text-(--color-ink-soft)">
      {label}
    </div>
  );
}
