"use client"

import { useEffect, useRef, useMemo } from "react"
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  useMap,
  Popup,
} from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type {
  DataPoint,
  ClusterSummary,
  HeatmapCell,
} from "@/lib/api"

// Colour palette for clusters
const CLUSTER_COLORS = [
  "#2dd4bf", // teal-400
  "#38bdf8", // sky-400
  "#a78bfa", // violet-400
  "#fb923c", // orange-400
  "#f472b6", // pink-400
  "#4ade80", // green-400
  "#facc15", // yellow-400
  "#818cf8", // indigo-400
  "#f87171", // red-400
  "#34d399", // emerald-400
]

function getClusterColor(id: number): string {
  if (id === -1) return "#475569" // noise → slate-500
  return CLUSTER_COLORS[id % CLUSTER_COLORS.length]
}

function getDensityColor(intensity: number): string {
  // Interpolate: green → yellow → red
  if (intensity < 0.33) {
    return `rgba(74, 222, 128, ${0.15 + intensity * 1.5})`
  }
  if (intensity < 0.66) {
    return `rgba(250, 204, 21, ${0.2 + intensity * 0.8})`
  }
  return `rgba(248, 113, 113, ${0.3 + intensity * 0.7})`
}

interface MapViewProps {
  points: DataPoint[]
  clusters: ClusterSummary[]
  heatmapCells: HeatmapCell[]
  activeLayer: "points" | "clusters" | "heatmap"
  center: [number, number]
  zoom: number
}

/** Keeps the map centred when external state changes. */
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    map.flyTo(center, zoom, { duration: 1.2 })
  }, [center, zoom, map])

  return null
}

export default function MapView({
  points,
  clusters,
  heatmapCells,
  activeLayer,
  center,
  zoom,
}: MapViewProps) {
  // Limit rendered points to avoid lag
  const visiblePoints = useMemo(() => {
    if (points.length <= 2000) return points
    const step = Math.ceil(points.length / 2000)
    return points.filter((_, i) => i % step === 0)
  }, [points])

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapUpdater center={center} zoom={zoom} />

      {/* Raw point layer */}
      {activeLayer === "points" &&
        visiblePoints.map((p, i) => (
          <CircleMarker
            key={`pt-${i}`}
            center={[p.latitude, p.longitude]}
            radius={4}
            pathOptions={{
              fillColor: "#2dd4bf",
              fillOpacity: 0.7,
              color: "#2dd4bf",
              weight: 1,
              opacity: 0.9,
            }}
          >
            <Popup>
              <div className="font-sans text-sm">
                <p className="font-medium">
                  {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                </p>
                {p.timestamp && (
                  <p className="text-xs opacity-70">{p.timestamp}</p>
                )}
                {p.value != null && (
                  <p className="text-xs opacity-70">Value: {p.value}</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}

      {/* Cluster layer */}
      {activeLayer === "clusters" && (
        <>
          {visiblePoints.map((p, i) => (
            <CircleMarker
              key={`cl-pt-${i}`}
              center={[p.latitude, p.longitude]}
              radius={3.5}
              pathOptions={{
                fillColor: getClusterColor(p.cluster ?? -1),
                fillOpacity: 0.65,
                color: getClusterColor(p.cluster ?? -1),
                weight: 1,
                opacity: 0.85,
              }}
            />
          ))}
          {clusters.map((c) => (
            <Circle
              key={`cl-ring-${c.id}`}
              center={[c.centroid.latitude, c.centroid.longitude]}
              radius={Math.max(c.radius, 100)}
              pathOptions={{
                color: getClusterColor(c.id),
                weight: 2,
                opacity: 0.5,
                fillColor: getClusterColor(c.id),
                fillOpacity: 0.08,
                dashArray: "6 4",
              }}
            >
              <Popup>
                <div className="font-sans text-sm">
                  <p className="font-semibold">Cluster {c.id + 1}</p>
                  <p className="text-xs">{c.point_count} points</p>
                  <p className="text-xs">
                    Radius: {c.radius.toFixed(0)}m
                  </p>
                </div>
              </Popup>
            </Circle>
          ))}
        </>
      )}

      {/* Heatmap layer */}
      {activeLayer === "heatmap" &&
        heatmapCells.map((cell, i) => (
          <CircleMarker
            key={`hm-${i}`}
            center={[cell.latitude, cell.longitude]}
            radius={Math.max(8, cell.intensity * 22)}
            pathOptions={{
              fillColor: getDensityColor(cell.intensity),
              fillOpacity: 0.6 + cell.intensity * 0.35,
              color: "transparent",
              weight: 0,
            }}
          />
        ))}
    </MapContainer>
  )
}
