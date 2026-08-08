import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string"

import {
  isSpellbookSharePayload,
  type SpellbookSharePayload,
} from "@/lib/spellbooks"

export function encodeSharePayload(payload: SpellbookSharePayload): string {
  return compressToEncodedURIComponent(JSON.stringify(payload))
}

export function decodeSharePayload(
  encoded: string
): SpellbookSharePayload | null {
  try {
    const json = decompressFromEncodedURIComponent(encoded)
    if (!json) return null
    const parsed = JSON.parse(json) as unknown
    return isSpellbookSharePayload(parsed) ? parsed : null
  } catch {
    return null
  }
}
