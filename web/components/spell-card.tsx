"use client"

import { ExternalLinkIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { AddToSpellbookButton } from "@/components/add-to-spellbook-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  formatClassName,
  formatSchool,
  getSpellHref,
  getSpellLevel,
  type ClassOption,
  type Spell,
} from "@/lib/spells"

type SpellCardProps = {
  spell: Spell
  classId: string | null
  classOptions: ClassOption[]
  onRemove?: () => void
}

export function SpellCard({
  spell,
  classId,
  classOptions,
  onRemove,
}: SpellCardProps) {
  const pathname = usePathname()
  const level = getSpellLevel(spell, classId)
  const classEntries = Object.entries(spell.classes).sort((a, b) =>
    formatClassName(a[0]).localeCompare(formatClassName(b[0]))
  )
  const spellHref = getSpellHref(spell.id, pathname)

  return (
    <Card
      size="sm"
      className="h-full [content-visibility:auto] [contain-intrinsic-size:auto_280px]"
    >
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">
            <Link
              href={spellHref}
              scroll={false}
              className="rounded-sm underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {spell.name}
            </Link>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{formatSchool(spell.school)}</Badge>
            {level !== null ? (
              <Badge variant="outline">
                {classId ? `${formatClassName(classId)} ` : ""}Lvl {level}
              </Badge>
            ) : null}
            {spell.mythic ? <Badge>Mythic</Badge> : null}
          </div>
        </div>
        {(spell.subschool || spell.descriptor) && (
          <CardDescription>
            {[spell.subschool, spell.descriptor].filter(Boolean).join(" · ")}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
          {spell.casting_time ? (
            <div>
              <dt className="font-medium text-foreground">Casting Time</dt>
              <dd>{spell.casting_time}</dd>
            </div>
          ) : null}
          {spell.range ? (
            <div>
              <dt className="font-medium text-foreground">Range</dt>
              <dd>{spell.range}</dd>
            </div>
          ) : null}
          {spell.components ? (
            <div>
              <dt className="font-medium text-foreground">Components</dt>
              <dd>{spell.components}</dd>
            </div>
          ) : null}
          {spell.duration ? (
            <div>
              <dt className="font-medium text-foreground">Duration</dt>
              <dd>{spell.duration}</dd>
            </div>
          ) : null}
          {spell.saving_throw ? (
            <div>
              <dt className="font-medium text-foreground">Saving Throw</dt>
              <dd>{spell.saving_throw}</dd>
            </div>
          ) : null}
          {spell.spell_resistance ? (
            <div>
              <dt className="font-medium text-foreground">Spell Resistance</dt>
              <dd>{spell.spell_resistance}</dd>
            </div>
          ) : null}
        </dl>
        {spell.description ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {spell.description}
          </p>
        ) : null}
        {classEntries.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {classEntries.map(([id, lvl]) => (
              <Badge key={id} variant="outline" className="font-normal">
                {formatClassName(id)} {lvl}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="mt-auto flex shrink-0 flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          render={<Link href={spellHref} scroll={false} />}
          nativeButton={false}
        >
          View details
        </Button>
        <AddToSpellbookButton
          spellId={spell.id}
          spellName={spell.name}
          classOptions={classOptions}
        />
        <Button
          variant="ghost"
          size="sm"
          render={<a href={spell.url} target="_blank" rel="noreferrer" />}
          nativeButton={false}
        >
          AoN
          <ExternalLinkIcon data-icon="inline-end" />
        </Button>
        {onRemove ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}
