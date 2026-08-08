"use client"

import * as React from "react"
import { LayoutGridIcon, ListIcon } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type ViewMode = "grid" | "table"

const VIEW_MODE_STORAGE_KEY = "spellscraper.viewMode"

export function useViewMode(defaultMode: ViewMode = "grid") {
  const [viewMode, setViewModeState] = React.useState<ViewMode>(defaultMode)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY)
      if (stored === "grid" || stored === "table") {
        setViewModeState(stored)
      }
    } catch {
      // ignore storage errors
    }
    setReady(true)
  }, [])

  const setViewMode = React.useCallback((mode: ViewMode) => {
    setViewModeState(mode)
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
    } catch {
      // ignore storage errors
    }
  }, [])

  return { viewMode, setViewMode, ready }
}

type ViewModeToggleProps = {
  value: ViewMode
  onValueChange: (value: ViewMode) => void
}

export function ViewModeToggle({ value, onValueChange }: ViewModeToggleProps) {
  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      spacing={0}
      value={[value]}
      onValueChange={(next) => {
        const mode = next[0] as ViewMode | undefined
        if (mode === "grid" || mode === "table") {
          onValueChange(mode)
        }
      }}
      aria-label="Result layout"
    >
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <LayoutGridIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="table" aria-label="Table view">
        <ListIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
