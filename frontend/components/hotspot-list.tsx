"use client"

import { cn } from "@/lib/utils"
import type { Hotspot } from "@/lib/api"

interface HotspotListProps {
  hotspots: Hotspot[]
  onClick: (h: Hotspot) => void
}

const levelConfig = {
  high: {
    label: "High",
    dotClass: "bg-danger",
    textClass: "text-danger",
  },
  medium: {
    label: "Medium",
    dotClass: "bg-warning",
    textClass: "text-warning",
  },
  low: {
    label: "Low",
    dotClass: "bg-success",
    textClass: "text-success",
  },
}

export default function HotspotList({ hotspots, onClick }: HotspotListProps) {
  return (
    <div className="flex flex-col gap-2">
      {hotspots.map((h, i) => {
        const cfg = levelConfig[h.level]
        return (
          <button
            key={i}
            onClick={() => onClick(h)}
            className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5 text-left transition-all hover:border-border hover:bg-secondary/40"
          >
            <div className={cn("h-2.5 w-2.5 rounded-full", cfg.dotClass)} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground">
                {h.count} points
              </p>
            </div>
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                cfg.textClass,
                h.level === "high"
                  ? "bg-danger/10"
                  : h.level === "medium"
                    ? "bg-warning/10"
                    : "bg-success/10"
              )}
            >
              {cfg.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
