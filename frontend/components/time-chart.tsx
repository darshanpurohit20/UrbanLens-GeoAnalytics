"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { TimeEntry } from "@/lib/api"

interface TimeChartProps {
  data: TimeEntry[]
}

export default function TimeChart({ data }: TimeChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="20%">
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10, fill: "oklch(0.62 0.01 260)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}h`}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "oklch(0.17 0.008 260)",
              border: "1px solid oklch(0.28 0.01 260)",
              borderRadius: "8px",
              color: "oklch(0.96 0.005 260)",
              fontSize: "12px",
            }}
            formatter={(value: number) => [value, "Count"]}
            labelFormatter={(label) => `${label}:00`}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {data.map((entry, idx) => {
              const ratio = entry.count / maxCount
              // Teal intensity based on value
              const opacity = 0.3 + ratio * 0.7
              return (
                <Cell
                  key={`cell-${idx}`}
                  fill={`oklch(0.72 0.19 180 / ${opacity})`}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
