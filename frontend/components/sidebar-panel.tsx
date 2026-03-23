"use client"

import {
  Layers,
  Settings2,
  BarChart3,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Flame,
  Grid3X3,
  CircleDot,
} from "lucide-react"
import type {
  InsightsResponse,
  ClusterParams,
  Hotspot,
  TimeEntry,
} from "@/lib/api"
import { cn } from "@/lib/utils"
import TimeChart from "./time-chart"
import HotspotList from "./hotspot-list"

interface SidebarPanelProps {
  isOpen: boolean
  onToggle: () => void
  insights: InsightsResponse | null
  loading: boolean
  activeLayer: "points" | "clusters" | "heatmap"
  onLayerChange: (layer: "points" | "clusters" | "heatmap") => void
  clusterParams: ClusterParams
  onClusterParamsChange: (params: ClusterParams) => void
  onHotspotClick: (h: Hotspot) => void
}

export default function SidebarPanel({
  isOpen,
  onToggle,
  insights,
  loading,
  activeLayer,
  onLayerChange,
  clusterParams,
  onClusterParamsChange,
  onHotspotClick,
}: SidebarPanelProps) {
  const layers: { id: "points" | "clusters" | "heatmap"; label: string; icon: typeof Layers }[] = [
    { id: "points", label: "Raw Points", icon: CircleDot },
    { id: "clusters", label: "Clusters", icon: Grid3X3 },
    { id: "heatmap", label: "Heatmap", icon: Flame },
  ]

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute top-4 right-4 z-[1000] rounded-lg bg-card/90 backdrop-blur-sm border border-border/50 p-2 hover:bg-secondary transition-colors"
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isOpen ? (
          <ChevronRight className="h-4 w-4 text-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-foreground" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "absolute top-0 right-0 z-[999] h-full w-[360px] bg-card/95 backdrop-blur-md border-l border-border/50 transition-transform duration-300 overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-5 flex flex-col gap-6">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Controls & Insights
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Configure layers, clustering, and view analytics
            </p>
          </div>

          {/* Layer toggle */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Map Layers
            </h3>
            <div className="flex gap-2">
              {layers.map((l) => (
                <button
                  key={l.id}
                  onClick={() => onLayerChange(l.id)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-all",
                    activeLayer === l.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 bg-secondary/30 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </button>
              ))}
            </div>
          </section>

          {/* Cluster settings (only when clusters layer active) */}
          {activeLayer === "clusters" && (
            <section className="rounded-lg border border-border/50 bg-secondary/20 p-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5" />
                Cluster Settings
              </h3>

              <div className="flex flex-col gap-3">
                {/* Algorithm select */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Algorithm
                  </label>
                  <div className="flex gap-2">
                    {(["dbscan", "kmeans"] as const).map((alg) => (
                      <button
                        key={alg}
                        onClick={() =>
                          onClusterParamsChange({ ...clusterParams, algorithm: alg })
                        }
                        className={cn(
                          "flex-1 rounded-md border py-1.5 text-xs font-medium transition-all",
                          clusterParams.algorithm === alg
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {alg.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {clusterParams.algorithm === "dbscan" ? (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Epsilon (neighbourhood radius)
                      </label>
                      <input
                        type="range"
                        min={0.001}
                        max={0.02}
                        step={0.001}
                        value={clusterParams.eps}
                        onChange={(e) =>
                          onClusterParamsChange({
                            ...clusterParams,
                            eps: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-primary"
                      />
                      <span className="text-xs font-mono text-muted-foreground">
                        {clusterParams.eps.toFixed(3)}
                      </span>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        Min samples
                      </label>
                      <input
                        type="range"
                        min={2}
                        max={20}
                        step={1}
                        value={clusterParams.min_samples}
                        onChange={(e) =>
                          onClusterParamsChange({
                            ...clusterParams,
                            min_samples: parseInt(e.target.value),
                          })
                        }
                        className="w-full accent-primary"
                      />
                      <span className="text-xs font-mono text-muted-foreground">
                        {clusterParams.min_samples}
                      </span>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Number of clusters
                    </label>
                    <input
                      type="range"
                      min={2}
                      max={15}
                      step={1}
                      value={clusterParams.n_clusters}
                      onChange={(e) =>
                        onClusterParamsChange({
                          ...clusterParams,
                          n_clusters: parseInt(e.target.value),
                        })
                      }
                      className="w-full accent-primary"
                    />
                    <span className="text-xs font-mono text-muted-foreground">
                      {clusterParams.n_clusters}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Insights summary */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              Analytics Summary
            </h3>
            {loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 rounded-md bg-secondary/50 animate-pulse"
                  />
                ))}
              </div>
            ) : insights ? (
              <div className="flex flex-col gap-2">
                <SummaryRow label="Total Data Points" value={insights.total_points.toLocaleString()} />
                <SummaryRow label="Detected Clusters" value={insights.clusters.toString()} />
                <SummaryRow label="Average Density" value={insights.avg_density.toFixed(1)} />
                <SummaryRow label="Noise Points" value={insights.noise_points.toLocaleString()} />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No data loaded</p>
            )}
          </section>

          {/* Activity chart */}
          {insights && insights.time_distribution.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Activity by Hour
              </h3>
              <TimeChart data={insights.time_distribution} />
            </section>
          )}

          {/* Hotspots */}
          {insights && insights.hotspots.length > 0 && (
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Top Hotspots
              </h3>
              <HotspotList hotspots={insights.hotspots} onClick={onHotspotClick} />
            </section>
          )}
        </div>
      </div>
    </>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold font-mono text-foreground">{value}</span>
    </div>
  )
}
