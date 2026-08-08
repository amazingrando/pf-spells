import { Suspense } from "react"
import type { Metadata } from "next"

import { SpellbookDetail } from "@/components/spellbook-detail"
import { Skeleton } from "@/components/ui/skeleton"
import { collectMeta, toClassOptions, type Spell } from "@/lib/spells"
import spellsData from "@/data/spells.json"

export const metadata: Metadata = {
  title: "Spellbook",
  description: "View a local spellbook collection.",
}

type SpellbookPageProps = {
  params: Promise<{ id: string }>
}

function SpellbookDetailFallback() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  )
}

export default async function SpellbookPage({ params }: SpellbookPageProps) {
  const { id } = await params
  const spells = spellsData as Spell[]
  const classOptions = toClassOptions(collectMeta(spells).classes)

  return (
    <main>
      <Suspense fallback={<SpellbookDetailFallback />}>
        <SpellbookDetail
          bookId={id}
          spells={spells}
          classOptions={classOptions}
        />
      </Suspense>
    </main>
  )
}
