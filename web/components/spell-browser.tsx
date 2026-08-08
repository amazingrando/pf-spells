"use client"

import * as React from "react"
import { BookOpenIcon, SearchIcon, XIcon } from "lucide-react"

import { SpellCard } from "@/components/spell-card"
import { SpellDetailDialog } from "@/components/spell-detail-dialog"
import { SpellTable } from "@/components/spell-table"
import { ViewModeToggle, useViewMode } from "@/components/view-mode-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useSpellDetailParam } from "@/hooks/use-spell-detail-param"
import {
  COMPONENT_OPTIONS,
  collectMeta,
  collectTagsForSchools,
  filterSpells,
  formatClassName,
  formatRangeCategory,
  formatSchool,
  formatTagLabel,
  RANGE_OPTIONS,
  toClassOptions,
  type ClassOption,
  type ComponentCode,
  type RangeCategory,
  type Spell,
  type SpellFilters,
  type SpellResistanceFilter,
} from "@/lib/spells"

const PAGE_SIZE = 48
const LEVELS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const

const initialFilters: SpellFilters = {
  query: "",
  schools: [],
  subschools: [],
  descriptors: [],
  classId: null,
  level: null,
  mythicOnly: false,
  spellResistance: "any",
  ranges: [],
  components: [],
}

const toSelectItems = (values: string[], formatLabel = formatTagLabel) =>
  values.map((value) => ({
    label: formatLabel(value),
    value,
  }))

const schoolSelectItems = (schools: string[]) =>
  toSelectItems(schools, formatSchool)

const rangeSelectItems = RANGE_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}))

type SpellBrowserProps = {
  spells: Spell[]
}

export function SpellBrowser({ spells }: SpellBrowserProps) {
  const { selectedSpell, handleDialogOpenChange } = useSpellDetailParam(spells)

  const [filters, setFilters] = React.useState<SpellFilters>(initialFilters)
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)
  const deferredQuery = React.useDeferredValue(filters.query)
  const { viewMode, setViewMode } = useViewMode()

  const meta = React.useMemo(() => collectMeta(spells), [spells])
  const classOptions = React.useMemo(
    () => toClassOptions(meta.classes),
    [meta.classes]
  )
  const schoolItems = React.useMemo(
    () => schoolSelectItems(meta.schools),
    [meta.schools]
  )
  const availableTags = React.useMemo(
    () => collectTagsForSchools(spells, filters.schools),
    [spells, filters.schools]
  )
  const subschoolItems = React.useMemo(
    () => toSelectItems(availableTags.subschools),
    [availableTags.subschools]
  )
  const descriptorItems = React.useMemo(
    () => toSelectItems(availableTags.descriptors),
    [availableTags.descriptors]
  )

  const selectedClass = React.useMemo(
    () =>
      classOptions.find((option) => option.value === filters.classId) ?? null,
    [classOptions, filters.classId]
  )

  const deferredFilters = React.useMemo(
    () => ({ ...filters, query: deferredQuery }),
    [filters, deferredQuery]
  )

  const filtered = React.useMemo(
    () => filterSpells(spells, deferredFilters),
    [spells, deferredFilters]
  )

  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [deferredFilters])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  const isStale = deferredQuery !== filters.query
  const hasActiveFilters =
    Boolean(filters.query.trim()) ||
    filters.schools.length > 0 ||
    filters.subschools.length > 0 ||
    filters.descriptors.length > 0 ||
    Boolean(filters.classId) ||
    filters.level !== null ||
    filters.mythicOnly ||
    filters.spellResistance !== "any" ||
    filters.ranges.length > 0 ||
    filters.components.length > 0

  function updateFilters(patch: Partial<SpellFilters>) {
    setFilters((current) => ({ ...current, ...patch }))
  }

  function clearFilters() {
    setFilters(initialFilters)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Spell browser</h1>
        <p className="max-w-2xl text-muted-foreground">
          Search and filter {spells.length.toLocaleString()} Pathfinder spells by
          school, class, level, range, components, and more.
        </p>
      </header>

      <form
        className="flex flex-col gap-6 rounded-xl border bg-card/40 p-4 sm:p-5"
        onSubmit={(event) => event.preventDefault()}
        aria-label="Spell filters"
      >
        <FieldSet>
          <FieldLegend className="sr-only">Filters</FieldLegend>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="spell-search">Search</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  id="spell-search"
                  name="q"
                  value={filters.query}
                  onChange={(event) =>
                    updateFilters({ query: event.target.value })
                  }
                  placeholder="Name, school, descriptor, description…"
                  autoComplete="off"
                  enterKeyHint="search"
                />
                {filters.query ? (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      aria-label="Clear search"
                      size="icon-xs"
                      onClick={() => updateFilters({ query: "" })}
                    >
                      <XIcon />
                    </InputGroupButton>
                  </InputGroupAddon>
                ) : null}
              </InputGroup>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Schools</FieldLabel>
                <Select
                  items={schoolItems}
                  multiple
                  value={filters.schools}
                  onValueChange={(value) => {
                    const schools = value as string[]
                    const tags = collectTagsForSchools(spells, schools)
                    const allowedSubschools = new Set(tags.subschools)
                    const allowedDescriptors = new Set(tags.descriptors)
                    updateFilters({
                      schools,
                      subschools: filters.subschools.filter((tag) =>
                        allowedSubschools.has(tag)
                      ),
                      descriptors: filters.descriptors.filter((tag) =>
                        allowedDescriptors.has(tag)
                      ),
                    })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string[]) =>
                        value.length === 0
                          ? "All schools"
                          : value.length === 1
                            ? formatSchool(value[0])
                            : `${value.length} schools`
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {schoolItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Choose one or more schools.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="class-search">Class</FieldLabel>
                <Combobox
                  items={classOptions}
                  value={selectedClass}
                  onValueChange={(value) =>
                    updateFilters({
                      classId: (value as ClassOption | null)?.value ?? null,
                    })
                  }
                  itemToStringValue={(item) => item.label}
                >
                  <ComboboxInput
                    id="class-search"
                    placeholder="Search classes…"
                    showClear
                    className="w-full"
                  />
                  <ComboboxContent className="w-(--anchor-width)">
                    <ComboboxEmpty>No classes found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item.value} value={item}>
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Subschools</FieldLabel>
                <Select
                  items={subschoolItems}
                  multiple
                  value={filters.subschools}
                  onValueChange={(value) =>
                    updateFilters({ subschools: value as string[] })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string[]) =>
                        value.length === 0
                          ? "All subschools"
                          : value.length === 1
                            ? formatTagLabel(value[0])
                            : `${value.length} subschools`
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {subschoolItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Options update based on selected schools.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Descriptors</FieldLabel>
                <Select
                  items={descriptorItems}
                  multiple
                  value={filters.descriptors}
                  onValueChange={(value) =>
                    updateFilters({ descriptors: value as string[] })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: string[]) =>
                        value.length === 0
                          ? "All descriptors"
                          : value.length === 1
                            ? formatTagLabel(value[0])
                            : `${value.length} descriptors`
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {descriptorItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Options update based on selected schools.
                </FieldDescription>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Range</FieldLabel>
                <Select
                  items={rangeSelectItems}
                  multiple
                  value={filters.ranges}
                  onValueChange={(value) =>
                    updateFilters({ ranges: value as RangeCategory[] })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: RangeCategory[]) =>
                        value.length === 0
                          ? "All ranges"
                          : value.length === 1
                            ? formatRangeCategory(value[0])
                            : `${value.length} ranges`
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {rangeSelectItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Personal, touch, close, medium, long, and related groups.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Spell resistance</FieldLabel>
                <ToggleGroup
                  variant="outline"
                  size="sm"
                  spacing={1}
                  value={[filters.spellResistance]}
                  onValueChange={(value) => {
                    const next = (value[0] ?? "any") as SpellResistanceFilter
                    updateFilters({ spellResistance: next })
                  }}
                  className="flex flex-wrap"
                >
                  <ToggleGroupItem value="any" aria-label="Any spell resistance">
                    Any
                  </ToggleGroupItem>
                  <ToggleGroupItem value="yes" aria-label="Spell resistance yes">
                    Yes
                  </ToggleGroupItem>
                  <ToggleGroupItem value="no" aria-label="Spell resistance no">
                    No
                  </ToggleGroupItem>
                </ToggleGroup>
              </Field>
            </div>

            <Field>
              <FieldLabel>Spell level</FieldLabel>
              <ToggleGroup
                variant="outline"
                size="sm"
                spacing={1}
                value={filters.level ? [filters.level] : []}
                onValueChange={(value) =>
                  updateFilters({ level: value[0] ?? null })
                }
                className="flex flex-wrap"
              >
                {LEVELS.map((level) => (
                  <ToggleGroupItem
                    key={level}
                    value={level}
                    aria-label={`Level ${level}`}
                  >
                    {level}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>

            <Field>
              <FieldLabel>Components</FieldLabel>
              <ToggleGroup
                multiple
                variant="outline"
                size="sm"
                spacing={1}
                value={filters.components}
                onValueChange={(value) =>
                  updateFilters({ components: value as ComponentCode[] })
                }
                className="flex flex-wrap"
              >
                {COMPONENT_OPTIONS.map((component) => (
                  <ToggleGroupItem
                    key={component.value}
                    value={component.value}
                    aria-label={component.description}
                    title={component.description}
                  >
                    {component.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FieldDescription>
                Exact match only — spells with precisely these components (V, S,
                M, F, DF).
              </FieldDescription>
            </Field>

            <Field orientation="horizontal" className="w-auto items-center">
              <Checkbox
                id="mythic-only"
                checked={filters.mythicOnly}
                onCheckedChange={(checked) =>
                  updateFilters({ mythicOnly: checked === true })
                }
              />
              <FieldLabel htmlFor="mythic-only" className="font-normal">
                Mythic spells only
              </FieldLabel>
            </Field>
          </FieldGroup>
        </FieldSet>

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span aria-live="polite" className={isStale ? "opacity-60" : ""}>
              Showing{" "}
              <span className="font-medium text-foreground">
                {visible.length.toLocaleString()}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {filtered.length.toLocaleString()}
              </span>{" "}
              spells
            </span>
            {filters.schools.map((school) => (
              <Badge key={school} variant="secondary">
                {formatSchool(school)}
              </Badge>
            ))}
            {filters.subschools.map((subschool) => (
              <Badge key={`sub-${subschool}`} variant="secondary">
                {formatTagLabel(subschool)}
              </Badge>
            ))}
            {filters.descriptors.map((descriptor) => (
              <Badge key={`desc-${descriptor}`} variant="secondary">
                {formatTagLabel(descriptor)}
              </Badge>
            ))}
            {filters.classId ? (
              <Badge variant="secondary">
                {formatClassName(filters.classId)}
              </Badge>
            ) : null}
            {filters.level !== null ? (
              <Badge variant="secondary">Level {filters.level}</Badge>
            ) : null}
            {filters.ranges.map((range) => (
              <Badge key={range} variant="secondary">
                {formatRangeCategory(range)}
              </Badge>
            ))}
            {filters.components.map((component) => (
              <Badge key={component} variant="secondary">
                {component}
              </Badge>
            ))}
            {filters.spellResistance !== "any" ? (
              <Badge variant="secondary">
                SR {filters.spellResistance === "yes" ? "Yes" : "No"}
              </Badge>
            ) : null}
            {filters.mythicOnly ? (
              <Badge variant="secondary">Mythic</Badge>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ViewModeToggle value={viewMode} onValueChange={setViewMode} />
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <XIcon data-icon="inline-start" />
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>
      </form>

      {filtered.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpenIcon />
            </EmptyMedia>
            <EmptyTitle>No spells match</EmptyTitle>
            <EmptyDescription>
              Try a broader search, or clear one of the active filters.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-6">
          {viewMode === "table" ? (
            <SpellTable
              spells={visible}
              classId={filters.classId}
              classOptions={classOptions}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((spell) => (
                <SpellCard
                  key={spell.id}
                  spell={spell}
                  classId={filters.classId}
                  classOptions={classOptions}
                />
              ))}
            </div>
          )}
          {hasMore ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Show more ({(filtered.length - visibleCount).toLocaleString()}{" "}
                remaining)
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <SpellDetailDialog
        spell={selectedSpell}
        open={Boolean(selectedSpell)}
        onOpenChange={handleDialogOpenChange}
        classOptions={classOptions}
      />
    </div>
  )
}
