"use client"

import { Activity, Layers, MapPin, Zap } from "lucide-react"
import type { InsightsResponse } from "@/lib/api"

interface StatCardsProps {
  insights: InsightsResponse | null
  loading: boolean
}

export default function StatCards({ insights, loading }: StatCardsProps) {
  const stats = [
    {
      label: "Total Points",
      value: insights?.total_points?.toLocaleString() ?? "--",
      icon: MapPin,
      accent: "text-primary",
      bgAccent: "bg-primary/10",
    },
    {
      label: "Clusters",
      value: insights?.clusters?.toString() ?? "--",
      icon: Layers,
      accent: "text-chart-2",
      bgAccent: "bg-chart-2/10",
    },
    {
      label: "Avg Density",
      value: insights?.avg_density?.toFixed(1) ?? "--",
      icon: Activity,
      accent: "text-chart-3",
      bgAccent: "bg-chart-3/10",
    },
    {
      label: "Hotspots",
      value: insights?.hotspots?.length?.toString() ?? "--",
      icon: Zap,
      accent: "text-chart-5",
      bgAccent: "bg-chart-5/10",
    },
  ]

  return (
    <div className="flex gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex-1 rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 p-3 flex items-center gap-3 transition-all hover:border-border"
        >
          <div className={`rounded-md p-2 ${s.bgAccent}`}>
            <s.icon className={`h-4 w-4 ${s.accent}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-lg font-semibold font-mono ${loading ? "animate-pulse" : ""}`}>
              {loading ? "--" : s.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
