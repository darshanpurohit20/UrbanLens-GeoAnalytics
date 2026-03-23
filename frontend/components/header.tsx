"use client"

import { Globe, Upload } from "lucide-react"

interface HeaderProps {
  dataLoaded: boolean
  pointCount: number
  onLoadSample: () => void
}

export default function Header({
  dataLoaded,
  pointCount,
  onLoadSample,
}: HeaderProps) {
  return (
    <header className="absolute top-0 left-0 z-[1000] flex items-center gap-4 p-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border/50 px-4 py-2.5">
        <div className="flex items-center justify-center rounded-md bg-primary/15 p-1.5">
          <Globe className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground leading-tight">
            UrbanLens
          </h1>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Geospatial Analytics
          </p>
        </div>
      </div>

      {/* Status / actions */}
      {!dataLoaded ? (
        <button
          onClick={onLoadSample}
          className="flex items-center gap-2 rounded-lg bg-primary/90 hover:bg-primary text-primary-foreground px-4 py-2.5 text-xs font-medium transition-colors"
        >
          <Upload className="h-3.5 w-3.5" />
          Load Sample Data
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-card/90 backdrop-blur-sm border border-border/50 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground">
            <span className="font-mono font-medium text-foreground">
              {pointCount.toLocaleString()}
            </span>{" "}
            data points loaded
          </span>
        </div>
      )}
    </header>
  )
}
