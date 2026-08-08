"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLinkIcon } from "lucide-react"

import { AddToSpellbookButton } from "@/components/add-to-spellbook-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatClassName,
  formatSchool,
  getSpellHref,
  getSpellLevel,
  parseComponentCodes,
  type ClassOption,
  type Spell,
} from "@/lib/spells"

type SpellTableProps = {
  spells: Spell[]
  classId: string | null
  classOptions: ClassOption[]
  onRemoveSpell?: (spell: Spell) => void
}

function formatComponentCodes(components: string | null) {
  const codes = [...parseComponentCodes(components)]
  if (codes.length === 0) return "—"
  const order = ["V", "S", "M", "F", "DF"] as const
  return order.filter((code) => codes.includes(code)).join(", ")
}

export function SpellTable({
  spells,
  classId,
  classOptions,
  onRemoveSpell,
}: SpellTableProps) {
  const pathname = usePathname()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>School</TableHead>
          <TableHead>Level</TableHead>
          <TableHead className="hidden md:table-cell">Casting Time</TableHead>
          <TableHead className="hidden lg:table-cell">Range</TableHead>
          <TableHead className="hidden lg:table-cell">Components</TableHead>
          <TableHead className="hidden xl:table-cell">SR</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {spells.map((spell) => {
          const level = getSpellLevel(spell, classId)
          const spellHref = getSpellHref(spell.id, pathname)
          return (
            <TableRow key={spell.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col gap-1">
                  <Link
                    href={spellHref}
                    scroll={false}
                    className="underline-offset-4 hover:underline"
                  >
                    {spell.name}
                  </Link>
                  {spell.short_description ? (
                    <span className="max-w-xs text-xs font-normal text-muted-foreground line-clamp-2">
                      {spell.short_description}
                    </span>
                  ) : null}
                  {spell.mythic ? (
                    <Badge className="w-fit" variant="secondary">
                      Mythic
                    </Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span>{formatSchool(spell.school)}</span>
                  {(spell.subschool || spell.descriptor) && (
                    <span className="text-xs text-muted-foreground">
                      {[spell.subschool, spell.descriptor]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {level !== null ? (
                  <span>
                    {classId ? `${formatClassName(classId)} ` : ""}
                    {level}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {spell.casting_time ?? "—"}
              </TableCell>
              <TableCell className="hidden max-w-40 truncate lg:table-cell">
                {spell.range ?? "—"}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {formatComponentCodes(spell.components)}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {spell.spell_resistance ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={spellHref} scroll={false} />}
                    nativeButton={false}
                  >
                    Details
                  </Button>
                  <AddToSpellbookButton
                    spellId={spell.id}
                    spellName={spell.name}
                    classOptions={classOptions}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    render={
                      <a href={spell.url} target="_blank" rel="noreferrer" />
                    }
                    nativeButton={false}
                  >
                    AoN
                    <ExternalLinkIcon data-icon="inline-end" />
                  </Button>
                  {onRemoveSpell ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveSpell(spell)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
