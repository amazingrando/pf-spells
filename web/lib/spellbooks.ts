export type Spellbook = {
  id: string
  name: string
  classId: string | null
  notes: string
  spellIds: string[]
  createdAt: string
  updatedAt: string
}

export type SpellbookSharePayload = {
  v: 1
  name: string
  classId: string | null
  notes: string
  spellIds: string[]
}

export type SpellbookInput = {
  name: string
  classId?: string | null
  notes?: string
  spellIds?: string[]
}

export const SPELLBOOKS_STORAGE_KEY = "spellscraper.spellbooks"

export function createSpellbookId() {
  return crypto.randomUUID()
}

export function createSpellbook(input: SpellbookInput): Spellbook {
  const now = new Date().toISOString()
  return {
    id: createSpellbookId(),
    name: input.name.trim() || "Untitled spellbook",
    classId: input.classId ?? null,
    notes: input.notes?.trim() ?? "",
    spellIds: [...new Set(input.spellIds ?? [])],
    createdAt: now,
    updatedAt: now,
  }
}

export function toSharePayload(book: Spellbook): SpellbookSharePayload {
  return {
    v: 1,
    name: book.name,
    classId: book.classId,
    notes: book.notes,
    spellIds: [...book.spellIds],
  }
}

export function spellbookFromSharePayload(
  payload: SpellbookSharePayload
): Spellbook {
  return createSpellbook({
    name: payload.name,
    classId: payload.classId,
    notes: payload.notes,
    spellIds: payload.spellIds,
  })
}

export function isSpellbookSharePayload(
  value: unknown
): value is SpellbookSharePayload {
  if (!value || typeof value !== "object") return false
  const payload = value as Record<string, unknown>
  return (
    payload.v === 1 &&
    typeof payload.name === "string" &&
    (payload.classId === null || typeof payload.classId === "string") &&
    typeof payload.notes === "string" &&
    Array.isArray(payload.spellIds) &&
    payload.spellIds.every((id) => typeof id === "string")
  )
}

export function isSpellbook(value: unknown): value is Spellbook {
  if (!value || typeof value !== "object") return false
  const book = value as Record<string, unknown>
  return (
    typeof book.id === "string" &&
    typeof book.name === "string" &&
    (book.classId === null || typeof book.classId === "string") &&
    typeof book.notes === "string" &&
    Array.isArray(book.spellIds) &&
    book.spellIds.every((id) => typeof id === "string") &&
    typeof book.createdAt === "string" &&
    typeof book.updatedAt === "string"
  )
}

export function readSpellbooksFromStorage(): Spellbook[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(SPELLBOOKS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isSpellbook)
  } catch {
    return []
  }
}

export function writeSpellbooksToStorage(books: Spellbook[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(SPELLBOOKS_STORAGE_KEY, JSON.stringify(books))
}

export function getSpellbookShareHref(book: Spellbook, encode: (payload: SpellbookSharePayload) => string) {
  const params = new URLSearchParams()
  params.set("book", encode(toSharePayload(book)))
  return `/?${params.toString()}`
}

export function downloadSpellbookJson(book: Spellbook) {
  const payload = toSharePayload(book)
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  const safeName = book.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  anchor.href = url
  anchor.download = `${safeName || "spellbook"}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
