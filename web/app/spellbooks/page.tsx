import type { Metadata } from "next"

import { SpellbooksManager } from "@/components/spellbooks-manager"
import { collectMeta, toClassOptions, type Spell } from "@/lib/spells"
import spellsData from "@/data/spells.json"

export const metadata: Metadata = {
  title: "Spellbooks",
  description: "Create and manage local spell collections for your characters.",
}

export default function SpellbooksPage() {
  const spells = spellsData as Spell[]
  const classOptions = toClassOptions(collectMeta(spells).classes)

  return (
    <main>
      <SpellbooksManager classOptions={classOptions} />
    </main>
  )
}
