import { Suspense } from "react"
import type { Metadata } from "next"

import { SpellBrowser } from "@/components/spell-browser"
import { Skeleton } from "@/components/ui/skeleton"
import type { Spell } from "@/lib/spells"
import spellsData from "@/data/spells.json"

export const metadata: Metadata = {
  title: "Spell browser",
  description:
    "Filter and browse Pathfinder spells by school, class, level, and search.",
}

function SpellBrowserFallback() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function Page() {
  const spells = spellsData as Spell[]

  return (
    <main>
      <Suspense fallback={<SpellBrowserFallback />}>
        <SpellBrowser spells={spells} />
      </Suspense>
    </main>
  )
}
