export type MythicVersion = {
  name: string
  source: string | null
  description_text: string
}

export type Spell = {
  id: string
  name: string
  url: string
  school: string | null
  subschool: string | null
  descriptor: string | null
  level: string | null
  casting_time: string | null
  components: string | null
  range: string | null
  area: string | null
  target: string | null
  effect: string | null
  duration: string | null
  saving_throw: string | null
  spell_resistance: string | null
  source: string | null
  description: string
  mythic: boolean
  mythic_version: MythicVersion | null
  flags: string[]
  classes: Record<string, number>
}

export type SpellResistanceFilter = "any" | "yes" | "no"

export type RangeCategory =
  | "personal"
  | "touch"
  | "close"
  | "medium"
  | "long"
  | "unlimited"
  | "see text"
  | "other"

export type ComponentCode = "V" | "S" | "M" | "F" | "DF"

export type SpellFilters = {
  query: string
  schools: string[]
  subschools: string[]
  descriptors: string[]
  classId: string | null
  level: string | null
  mythicOnly: boolean
  spellResistance: SpellResistanceFilter
  ranges: RangeCategory[]
  components: ComponentCode[]
}

export const RANGE_OPTIONS: { value: RangeCategory; label: string }[] = [
  { value: "personal", label: "Personal" },
  { value: "touch", label: "Touch" },
  { value: "close", label: "Close" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
  { value: "unlimited", label: "Unlimited" },
  { value: "see text", label: "See text" },
  { value: "other", label: "Other / special" },
]

export const COMPONENT_OPTIONS: {
  value: ComponentCode
  label: string
  description: string
}[] = [
  { value: "V", label: "V", description: "Verbal" },
  { value: "S", label: "S", description: "Somatic" },
  { value: "M", label: "M", description: "Material" },
  { value: "F", label: "F", description: "Focus" },
  { value: "DF", label: "DF", description: "Divine Focus" },
]

const CLASS_LABELS: Record<string, string> = {
  redmantisassassin: "Red Mantis Assassin",
  summoner_unchained: "Summoner (Unchained)",
  sahirafiyun: "Sahir-Afiyun",
  antipaladin: "Antipaladin",
}

export function formatClassName(classId: string) {
  if (CLASS_LABELS[classId]) return CLASS_LABELS[classId]
  return classId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function formatSchool(school: string | null) {
  if (!school) return "Unknown"
  return school.charAt(0).toUpperCase() + school.slice(1)
}

export function formatTagLabel(tag: string) {
  return tag
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(tag.includes("-") ? "-" : " ")
}

/** Split compound subschool / descriptor strings into individual tags. */
export function parseTagList(value: string | null): string[] {
  if (!value) return []

  const tags = new Set<string>()
  const chunks = value
    .toLowerCase()
    .split(",")
    .flatMap((part) => part.split(/\bor\b/))

  for (const chunk of chunks) {
    let tag = chunk.trim().replace(/\s+/g, " ")
    if (!tag || tag === "see text" || tag.startsWith("see text")) continue
    if (tag === "mindaffecting") tag = "mind-affecting"
    if (tag === "variable") continue
    tags.add(tag)
  }

  return [...tags]
}

function matchesAnyTag(value: string | null, selected: string[]) {
  if (selected.length === 0) return true
  const tags = parseTagList(value)
  return selected.some((tag) => tags.includes(tag))
}

export function formatRangeCategory(range: RangeCategory) {
  return RANGE_OPTIONS.find((option) => option.value === range)?.label ?? range
}

export function getSpellLevel(
  spell: Spell,
  classId: string | null
): number | null {
  if (classId) {
    return spell.classes[classId] ?? null
  }

  const levels = Object.values(spell.classes)
  if (levels.length === 0) return null
  return Math.min(...levels)
}

export function normalizeRange(range: string | null): RangeCategory | null {
  if (!range) return null

  const base = range.trim().toLowerCase().split(/[;,]/)[0]?.trim() ?? ""
  if (!base) return null

  if (base.startsWith("personal") || base === "you") return "personal"
  if (base.includes("touch")) return "touch"
  if (
    base.startsWith("close") ||
    base.includes("25 ft") ||
    base.includes("25ft")
  ) {
    return "close"
  }
  if (
    base.startsWith("medium") ||
    base.includes("100 ft") ||
    base.includes("100ft")
  ) {
    return "medium"
  }
  if (
    base.startsWith("long") ||
    base.includes("400 ft") ||
    base.includes("400ft")
  ) {
    return "long"
  }
  if (base.includes("unlimited")) return "unlimited"
  if (base.includes("see text") || base.includes("see description")) {
    return "see text"
  }

  return "other"
}

export function parseComponentCodes(components: string | null): Set<ComponentCode> {
  const found = new Set<ComponentCode>()
  if (!components) return found

  for (const match of components.matchAll(/\b(DF|AF|V|S|M|F)\b/g)) {
    const code = match[1]
    if (code === "AF") continue
    found.add(code as ComponentCode)
  }

  return found
}

function matchesSpellResistance(
  spellResistance: string | null,
  filter: SpellResistanceFilter
) {
  if (filter === "any") return true

  const value = (spellResistance ?? "").trim().toLowerCase()
  if (filter === "yes") return value.startsWith("yes")
  return value.startsWith("no")
}

export function filterSpells(spells: Spell[], filters: SpellFilters): Spell[] {
  const query = filters.query.trim().toLowerCase()

  return spells.filter((spell) => {
    if (filters.mythicOnly && !spell.mythic) return false

    if (
      !matchesSpellResistance(spell.spell_resistance, filters.spellResistance)
    ) {
      return false
    }

    if (filters.schools.length > 0) {
      if (!spell.school || !filters.schools.includes(spell.school)) return false
    }

    if (!matchesAnyTag(spell.subschool, filters.subschools)) return false
    if (!matchesAnyTag(spell.descriptor, filters.descriptors)) return false

    if (filters.classId) {
      if (!(filters.classId in spell.classes)) return false
    }

    if (filters.level !== null && filters.level !== "") {
      const level = Number(filters.level)
      if (filters.classId) {
        if (spell.classes[filters.classId] !== level) return false
      } else if (!Object.values(spell.classes).includes(level)) {
        return false
      }
    }

    if (filters.ranges.length > 0) {
      const range = normalizeRange(spell.range)
      if (!range || !filters.ranges.includes(range)) return false
    }

    if (filters.components.length > 0) {
      const codes = parseComponentCodes(spell.components)
      if (
        codes.size !== filters.components.length ||
        !filters.components.every((code) => codes.has(code))
      ) {
        return false
      }
    }

    if (query) {
      const haystack = [
        spell.name,
        spell.school,
        spell.subschool,
        spell.descriptor,
        spell.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }

    return true
  })
}

export function collectMeta(spells: Spell[]) {
  const schools = new Set<string>()
  const classes = new Set<string>()

  for (const spell of spells) {
    if (spell.school) schools.add(spell.school)
    for (const classId of Object.keys(spell.classes)) {
      classes.add(classId)
    }
  }

  const tags = collectTagsForSchools(spells, [])

  return {
    schools: [...schools].sort(),
    subschools: tags.subschools,
    descriptors: tags.descriptors,
    classes: [...classes].sort((a, b) =>
      formatClassName(a).localeCompare(formatClassName(b))
    ),
  }
}

/** Subschools / descriptors present on spells in the selected school(s). */
export function collectTagsForSchools(spells: Spell[], schools: string[]) {
  const subschools = new Set<string>()
  const descriptors = new Set<string>()
  const schoolFilter = schools.length > 0 ? new Set(schools) : null

  for (const spell of spells) {
    if (schoolFilter && (!spell.school || !schoolFilter.has(spell.school))) {
      continue
    }
    for (const tag of parseTagList(spell.subschool)) {
      subschools.add(tag)
    }
    for (const tag of parseTagList(spell.descriptor)) {
      descriptors.add(tag)
    }
  }

  const byLabel = (a: string, b: string) =>
    formatTagLabel(a).localeCompare(formatTagLabel(b))

  return {
    subschools: [...subschools].sort(byLabel),
    descriptors: [...descriptors].sort(byLabel),
  }
}

export type ClassOption = {
  label: string
  value: string
}

export function toClassOptions(classIds: string[]): ClassOption[] {
  return classIds.map((classId) => ({
    label: formatClassName(classId),
    value: classId,
  }))
}

export function findSpellById(spells: Spell[], id: string | null) {
  if (!id) return null
  return spells.find((spell) => spell.id === id) ?? null
}

export function getSpellHref(spellId: string, pathname = "/") {
  const params = new URLSearchParams()
  params.set("spell", spellId)
  const path = pathname || "/"
  return `${path}?${params.toString()}`
}
