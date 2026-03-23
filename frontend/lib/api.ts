export interface DataPoint {
  latitude: number
  longitude: number
  timestamp?: string
  value?: number
  cluster?: number
}

export interface ClusterSummary {
  id: number
  centroid: { latitude: number; longitude: number }
  point_count: number
  radius: number
}

export interface ClusterResponse {
  clusters: ClusterSummary[]
  points: DataPoint[]
  total_points: number
  noise_points: number
}

export interface HeatmapCell {
  latitude: number
  longitude: number
  intensity: number
  count: number
}

export interface Hotspot {
  latitude: number
  longitude: number
  intensity: number
  count: number
  level: "high" | "medium" | "low"
}

export interface TimeEntry {
  hour: number
  count: number
}

export interface InsightsResponse {
  total_points: number
  clusters: number
  avg_density: number
  hotspots: Hotspot[]
  bounds: {
    min_lat: number
    max_lat: number
    min_lng: number
    max_lng: number
  } | null
  time_distribution: TimeEntry[]
  noise_points: number
}

export interface FilterState {
  min_lat?: number
  max_lat?: number
  min_lng?: number
  max_lng?: number
  density_threshold?: number
  time_start?: string
  time_end?: string
}

export interface ClusterParams {
  algorithm: "dbscan" | "kmeans"
  eps: number
  min_samples: number
  n_clusters: number
}

export async function loadSampleData(): Promise<{ count: number; points: DataPoint[] }> {
  const res = await fetch("/api/sample-data")
  if (!res.ok) throw new Error("Failed to load sample data")
  return res.json()
}

export async function fetchClusters(
  params: ClusterParams,
  filters: FilterState
): Promise<ClusterResponse> {
  const res = await fetch("/api/clusters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, ...filters }),
  })
  if (!res.ok) throw new Error("Failed to fetch clusters")
  return res.json()
}

export async function fetchHeatmap(
  filters: FilterState
): Promise<{ cells: HeatmapCell[]; total_points: number }> {
  const res = await fetch("/api/heatmap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
  })
  if (!res.ok) throw new Error("Failed to fetch heatmap")
  return res.json()
}

export async function fetchInsights(filters: FilterState): Promise<InsightsResponse> {
  const res = await fetch("/api/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
  })
  if (!res.ok) throw new Error("Failed to fetch insights")
  return res.json()
}
