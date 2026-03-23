"""
UrbanLens - Geospatial Analytics Backend
FastAPI service for processing urban mobility data with spatial clustering,
hotspot detection, and heatmap generation.
"""

import fastapi
import fastapi.middleware.cors
import json
import math
import random
from typing import Optional
from pydantic import BaseModel

import numpy as np
from sklearn.cluster import DBSCAN, KMeans

app = fastapi.FastAPI(title="UrbanLens API", version="1.0.0")

app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory data store (replaced by a DB in production)
# ---------------------------------------------------------------------------
data_store: dict = {
    "points": [],
    "has_data": False,
}


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class DataPoint(BaseModel):
    latitude: float
    longitude: float
    timestamp: Optional[str] = None
    value: Optional[float] = None


class UploadPayload(BaseModel):
    points: list[DataPoint]


class ClusterParams(BaseModel):
    algorithm: str = "dbscan"  # "dbscan" or "kmeans"
    eps: float = 0.005  # DBSCAN neighbourhood radius (in degrees ~500m)
    min_samples: int = 5  # DBSCAN minimum samples
    n_clusters: int = 5  # K-Means cluster count


class FilterParams(BaseModel):
    min_lat: Optional[float] = None
    max_lat: Optional[float] = None
    min_lng: Optional[float] = None
    max_lng: Optional[float] = None
    density_threshold: Optional[float] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None


# ---------------------------------------------------------------------------
# Sample data generator – realistic urban mobility data for multiple cities
# ---------------------------------------------------------------------------
def _generate_sample_data() -> list[dict]:
    """
    Generate ~800 synthetic urban mobility points clustered around
    several hotspots in a metropolitan area (modeled loosely on NYC).
    """
    random.seed(42)
    np.random.seed(42)

    # Define hotspot centres (lat, lng, num_points, spread)
    hotspots = [
        # Manhattan – Times Square area
        (40.7580, -73.9855, 120, 0.006),
        # Manhattan – Financial District
        (40.7074, -74.0113, 80, 0.004),
        # Brooklyn – Downtown
        (40.6892, -73.9857, 70, 0.005),
        # Midtown East
        (40.7527, -73.9718, 90, 0.005),
        # Upper West Side
        (40.7831, -73.9712, 60, 0.004),
        # East Village
        (40.7265, -73.9815, 55, 0.003),
        # Williamsburg
        (40.7081, -73.9571, 50, 0.004),
        # Harlem
        (40.8116, -73.9465, 45, 0.005),
        # Chelsea
        (40.7465, -73.9971, 50, 0.003),
        # SoHo
        (40.7233, -73.9985, 40, 0.003),
        # Long Island City
        (40.7425, -73.9232, 45, 0.005),
        # Jersey City waterfront
        (40.7178, -74.0346, 35, 0.004),
        # Central Park area
        (40.7829, -73.9654, 60, 0.008),
    ]

    hours = list(range(6, 23))
    points: list[dict] = []

    for center_lat, center_lng, n, spread in hotspots:
        lats = np.random.normal(center_lat, spread, n)
        lngs = np.random.normal(center_lng, spread, n)
        for i in range(n):
            hour = random.choice(hours)
            minute = random.randint(0, 59)
            # Simulate higher values during rush hours
            base_value = random.uniform(1, 10)
            if hour in (8, 9, 17, 18):
                base_value *= 2.5
            elif hour in (12, 13):
                base_value *= 1.5

            points.append({
                "latitude": round(float(lats[i]), 6),
                "longitude": round(float(lngs[i]), 6),
                "timestamp": f"2026-03-{random.randint(1, 23):02d}T{hour:02d}:{minute:02d}:00",
                "value": round(base_value, 2),
            })

    return points


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _filter_points(points: list[dict], f: FilterParams) -> list[dict]:
    """Apply spatial and temporal filters to the point list."""
    result = points
    if f.min_lat is not None:
        result = [p for p in result if p["latitude"] >= f.min_lat]
    if f.max_lat is not None:
        result = [p for p in result if p["latitude"] <= f.max_lat]
    if f.min_lng is not None:
        result = [p for p in result if p["longitude"] >= f.min_lng]
    if f.max_lng is not None:
        result = [p for p in result if p["longitude"] <= f.max_lng]
    if f.time_start is not None:
        result = [p for p in result if (p.get("timestamp") or "") >= f.time_start]
    if f.time_end is not None:
        result = [p for p in result if (p.get("timestamp") or "") <= f.time_end]
    return result


def _run_clustering(coords: np.ndarray, params: ClusterParams) -> np.ndarray:
    """
    Run spatial clustering on a 2D coordinate array.
    DBSCAN groups nearby points by density; K-Means partitions into k groups.
    """
    if len(coords) == 0:
        return np.array([])

    if params.algorithm == "kmeans":
        n_clusters = min(params.n_clusters, len(coords))
        model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        return model.fit_predict(coords)

    # Default: DBSCAN – density-based spatial clustering
    model = DBSCAN(eps=params.eps, min_samples=params.min_samples)
    return model.fit_predict(coords)


def _compute_density_grid(points: list[dict], grid_size: int = 50) -> list[dict]:
    """
    Build a density grid for heatmap rendering.
    Divides the bounding box into a grid and counts points per cell.
    """
    if not points:
        return []

    lats = [p["latitude"] for p in points]
    lngs = [p["longitude"] for p in points]

    min_lat, max_lat = min(lats), max(lats)
    min_lng, max_lng = min(lngs), max(lngs)

    lat_range = max_lat - min_lat or 0.01
    lng_range = max_lng - min_lng or 0.01

    grid: dict[tuple[int, int], int] = {}
    for p in points:
        r = min(int((p["latitude"] - min_lat) / lat_range * grid_size), grid_size - 1)
        c = min(int((p["longitude"] - min_lng) / lng_range * grid_size), grid_size - 1)
        grid[(r, c)] = grid.get((r, c), 0) + 1

    max_count = max(grid.values()) if grid else 1
    cells = []
    for (r, c), count in grid.items():
        cells.append({
            "latitude": round(min_lat + (r + 0.5) * lat_range / grid_size, 6),
            "longitude": round(min_lng + (c + 0.5) * lng_range / grid_size, 6),
            "intensity": round(count / max_count, 4),
            "count": count,
        })
    return cells


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/sample-data")
async def get_sample_data():
    """Return the built-in sample dataset."""
    points = _generate_sample_data()
    data_store["points"] = points
    data_store["has_data"] = True
    return {"count": len(points), "points": points}


@app.post("/upload-data")
async def upload_data(payload: UploadPayload):
    """Accept a list of lat/lng data points."""
    points = [p.model_dump() for p in payload.points]
    data_store["points"] = points
    data_store["has_data"] = True
    return {"status": "ok", "count": len(points)}


@app.post("/clusters")
async def compute_clusters(
    params: ClusterParams = ClusterParams(),
    filters: FilterParams = FilterParams(),
):
    """
    Compute spatial clusters using DBSCAN or K-Means.
    Returns cluster labels, centroids, and per-cluster stats.
    """
    points = data_store["points"]
    if not points:
        return {"clusters": [], "labels": [], "points": []}

    filtered = _filter_points(points, filters)
    if not filtered:
        return {"clusters": [], "labels": [], "points": []}

    coords = np.array([[p["latitude"], p["longitude"]] for p in filtered])
    labels = _run_clustering(coords, params)

    # Build cluster summaries
    unique_labels = set(labels)
    cluster_summaries = []
    for label in sorted(unique_labels):
        if label == -1:
            continue  # noise points in DBSCAN
        mask = labels == label
        cluster_coords = coords[mask]
        centroid_lat = float(np.mean(cluster_coords[:, 0]))
        centroid_lng = float(np.mean(cluster_coords[:, 1]))
        cluster_summaries.append({
            "id": int(label),
            "centroid": {"latitude": round(centroid_lat, 6), "longitude": round(centroid_lng, 6)},
            "point_count": int(np.sum(mask)),
            "radius": round(float(np.max(np.sqrt(
                (cluster_coords[:, 0] - centroid_lat) ** 2 +
                (cluster_coords[:, 1] - centroid_lng) ** 2
            ))) * 111_000, 1),  # convert degrees to metres
        })

    # Attach label to each point
    labelled_points = []
    for i, p in enumerate(filtered):
        labelled_points.append({**p, "cluster": int(labels[i])})

    return {
        "clusters": cluster_summaries,
        "points": labelled_points,
        "total_points": len(filtered),
        "noise_points": int(np.sum(labels == -1)),
    }


@app.post("/heatmap")
async def heatmap(filters: FilterParams = FilterParams()):
    """Generate a density grid suitable for heatmap rendering."""
    points = data_store["points"]
    filtered = _filter_points(points, filters)
    cells = _compute_density_grid(filtered)
    return {"cells": cells, "total_points": len(filtered)}


@app.post("/insights")
async def insights(filters: FilterParams = FilterParams()):
    """Return summary analytics for the current dataset."""
    points = data_store["points"]
    filtered = _filter_points(points, filters)

    if not filtered:
        return {
            "total_points": 0,
            "clusters": 0,
            "avg_density": 0,
            "hotspots": [],
            "bounds": None,
            "time_distribution": [],
        }

    # Quick DBSCAN for cluster count
    coords = np.array([[p["latitude"], p["longitude"]] for p in filtered])
    labels = DBSCAN(eps=0.005, min_samples=5).fit_predict(coords)
    n_clusters = len(set(labels) - {-1})

    # Density grid
    cells = _compute_density_grid(filtered, grid_size=30)
    avg_density = round(np.mean([c["count"] for c in cells]), 2) if cells else 0

    # Top hotspots (highest density cells)
    top_cells = sorted(cells, key=lambda c: c["count"], reverse=True)[:5]
    hotspots = [{
        "latitude": c["latitude"],
        "longitude": c["longitude"],
        "intensity": c["intensity"],
        "count": c["count"],
        "level": "high" if c["intensity"] > 0.6 else ("medium" if c["intensity"] > 0.3 else "low"),
    } for c in top_cells]

    # Bounds
    lats = [p["latitude"] for p in filtered]
    lngs = [p["longitude"] for p in filtered]
    bounds = {
        "min_lat": round(min(lats), 6),
        "max_lat": round(max(lats), 6),
        "min_lng": round(min(lngs), 6),
        "max_lng": round(max(lngs), 6),
    }

    # Time distribution (hour histogram)
    hour_counts: dict[int, int] = {}
    for p in filtered:
        ts = p.get("timestamp")
        if ts and "T" in ts:
            try:
                hour = int(ts.split("T")[1][:2])
                hour_counts[hour] = hour_counts.get(hour, 0) + 1
            except (ValueError, IndexError):
                pass
    time_dist = [{"hour": h, "count": c} for h, c in sorted(hour_counts.items())]

    return {
        "total_points": len(filtered),
        "clusters": n_clusters,
        "avg_density": avg_density,
        "hotspots": hotspots,
        "bounds": bounds,
        "time_distribution": time_dist,
        "noise_points": int(np.sum(labels == -1)),
    }
