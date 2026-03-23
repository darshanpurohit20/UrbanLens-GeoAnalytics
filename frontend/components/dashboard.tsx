"use client"

import { useState, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import useSWR from "swr"
import Header from "./header"
import StatCards from "./stat-cards"
import SidebarPanel from "./sidebar-panel"
import type {
  DataPoint,
  ClusterSummary,
  HeatmapCell,
  InsightsResponse,
  ClusterParams,
  FilterState,
  Hotspot,
} from "@/lib/api"
import {
  loadSampleData,
  fetchClusters,
  fetchHeatmap,
  fetchInsights,
} from "@/lib/api"

// Dynamically import the map to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
})

const DEFAULT_CENTER: [number, number] = [40.7580, -73.9855] // NYC
const DEFAULT_ZOOM = 12

export default function Dashboard() {
  // State
  const [dataLoaded, setDataLoaded] = useState(false)
  const [points, setPoints] = useState<DataPoint[]>([])
  const [clusters, setClusters] = useState<ClusterSummary[]>([])
  const [clusteredPoints, setClusteredPoints] = useState<DataPoint[]>([])
  const [heatmapCells, setHeatmapCells] = useState<HeatmapCell[]>([])
  const [insights, setInsights] = useState<InsightsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeLayer, setActiveLayer] = useState<"points" | "clusters" | "heatmap">("points")
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER)
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM)
  const [clusterParams, setClusterParams] = useState<ClusterParams>({
    algorithm: "dbscan",
    eps: 0.005,
    min_samples: 5,
    n_clusters: 5,
  })
  const [filters] = useState<FilterState>({})

  // Load sample data & fetch analytics in one shot
  const handleLoadSample = useCallback(async () => {
    setLoading(true)
    try {
      const data = await loadSampleData()
      setPoints(data.points)
      setDataLoaded(true)

      // Fetch all analytics in parallel
      const [clusterRes, heatmapRes, insightsRes] = await Promise.all([
        fetchClusters(clusterParams, filters),
        fetchHeatmap(filters),
        fetchInsights(filters),
      ])

      setClusters(clusterRes.clusters)
      setClusteredPoints(clusterRes.points)
      setHeatmapCells(heatmapRes.cells)
      setInsights(insightsRes)

      // Centre map on data bounds
      if (insightsRes.bounds) {
        const b = insightsRes.bounds
        setMapCenter([
          (b.min_lat + b.max_lat) / 2,
          (b.min_lng + b.max_lng) / 2,
        ])
      }
    } catch (err) {
      console.error("Failed to load data:", err)
    } finally {
      setLoading(false)
    }
  }, [clusterParams, filters])

  // Re-run clustering when params change (only if data is loaded)
  const handleClusterParamsChange = useCallback(
    async (params: ClusterParams) => {
      setClusterParams(params)
      if (!dataLoaded) return

      setLoading(true)
      try {
        const clusterRes = await fetchClusters(params, filters)
        setClusters(clusterRes.clusters)
        setClusteredPoints(clusterRes.points)
        // Refresh insights too
        const insightsRes = await fetchInsights(filters)
        setInsights(insightsRes)
      } catch (err) {
        console.error("Failed to update clusters:", err)
      } finally {
        setLoading(false)
      }
    },
    [dataLoaded, filters]
  )

  // Handle layer change – fetch relevant data
  const handleLayerChange = useCallback(
    async (layer: "points" | "clusters" | "heatmap") => {
      setActiveLayer(layer)
      if (!dataLoaded) return

      if (layer === "clusters" && clusteredPoints.length === 0) {
        setLoading(true)
        try {
          const res = await fetchClusters(clusterParams, filters)
          setClusters(res.clusters)
          setClusteredPoints(res.points)
        } finally {
          setLoading(false)
        }
      }
      if (layer === "heatmap" && heatmapCells.length === 0) {
        setLoading(true)
        try {
          const res = await fetchHeatmap(filters)
          setHeatmapCells(res.cells)
        } finally {
          setLoading(false)
        }
      }
    },
    [dataLoaded, clusteredPoints.length, heatmapCells.length, clusterParams, filters]
  )

  // Navigate to a hotspot on click
  const handleHotspotClick = useCallback((h: Hotspot) => {
    setMapCenter([h.latitude, h.longitude])
    setMapZoom(15)
  }, [])

  // Pick the right point set depending on the active layer
  const displayPoints = useMemo(() => {
    if (activeLayer === "clusters") return clusteredPoints
    return points
  }, [activeLayer, points, clusteredPoints])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Full-screen map */}
      <MapView
        points={displayPoints}
        clusters={clusters}
        heatmapCells={heatmapCells}
        activeLayer={activeLayer}
        center={mapCenter}
        zoom={mapZoom}
      />

      {/* Header overlay */}
      <Header
        dataLoaded={dataLoaded}
        pointCount={points.length}
        onLoadSample={handleLoadSample}
      />

      {/* Floating stat cards (bottom-left) */}
      {dataLoaded && (
        <div className="absolute bottom-6 left-6 z-[1000] w-auto max-w-[calc(100vw-400px)]">
          <StatCards insights={insights} loading={loading} />
        </div>
      )}

      {/* Sidebar */}
      <SidebarPanel
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        insights={insights}
        loading={loading}
        activeLayer={activeLayer}
        onLayerChange={handleLayerChange}
        clusterParams={clusterParams}
        onClusterParamsChange={handleClusterParamsChange}
        onHotspotClick={handleHotspotClick}
      />
    </div>
  )
}
