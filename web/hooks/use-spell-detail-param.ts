"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { findSpellById, type Spell } from "@/lib/spells"

export function useSpellDetailParam(spells: Spell[]) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedSpellId = searchParams.get("spell")

  const selectedSpell = React.useMemo(
    () => findSpellById(spells, selectedSpellId),
    [spells, selectedSpellId]
  )

  function setSpellParam(spellId: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (spellId) {
      params.set("spell", spellId)
    } else {
      params.delete("spell")
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      setSpellParam(null)
    }
  }

  return {
    selectedSpell,
    handleDialogOpenChange,
  }
}
