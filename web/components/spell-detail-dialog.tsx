"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  formatClassName,
  formatSchool,
  getSpellHref,
  type ClassOption,
  type Spell,
} from "@/lib/spells"
import { AddToSpellbookButton } from "@/components/add-to-spellbook-button"

type SpellDetailDialogProps = {
  spell: Spell | null
  open: boolean
  onOpenChange: (open: boolean) => void
  classOptions: ClassOption[]
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  if (!value) return null

  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <dt className="font-medium text-foreground">{label}</dt>
      <dd className="text-muted-foreground">{value}</dd>
    </div>
  )
}

export function SpellDetailDialog({
  spell,
  open,
  onOpenChange,
  classOptions,
}: SpellDetailDialogProps) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    setCopied(false)
  }, [spell?.id])

  async function copyLink() {
    if (!spell) return
    const url = new URL(
      getSpellHref(spell.id, window.location.pathname),
      window.location.origin
    )
    await navigator.clipboard.writeText(url.toString())
    setCopied(true)
  }

  const classEntries = spell
    ? Object.entries(spell.classes).sort((a, b) =>
        formatClassName(a[0]).localeCompare(formatClassName(b[0]))
      )
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,52rem)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {spell ? (
          <>
            <DialogHeader className="border-b p-4 pr-12 text-left">
              <DialogTitle className="text-xl leading-snug">
                {spell.name}
              </DialogTitle>
              <DialogDescription>
                Full spell details
                {spell.school ? ` · ${formatSchool(spell.school)}` : ""}
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary">{formatSchool(spell.school)}</Badge>
                {spell.mythic ? <Badge>Mythic</Badge> : null}
                {spell.subschool ? (
                  <Badge variant="outline">{spell.subschool}</Badge>
                ) : null}
                {spell.descriptor ? (
                  <Badge variant="outline">{spell.descriptor}</Badge>
                ) : null}
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col gap-4">
                <dl className="flex flex-col gap-3 text-sm">
                  <DetailRow label="Level" value={spell.level} />
                  <DetailRow label="Casting Time" value={spell.casting_time} />
                  <DetailRow label="Components" value={spell.components} />
                  <DetailRow label="Range" value={spell.range} />
                  <DetailRow label="Area" value={spell.area} />
                  <DetailRow label="Target" value={spell.target} />
                  <DetailRow label="Effect" value={spell.effect} />
                  <DetailRow label="Duration" value={spell.duration} />
                  <DetailRow label="Saving Throw" value={spell.saving_throw} />
                  <DetailRow
                    label="Spell Resistance"
                    value={spell.spell_resistance}
                  />
                  <DetailRow label="Source" value={spell.source} />
                </dl>

                {classEntries.length > 0 ? (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-medium">Class levels</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {classEntries.map(([id, level]) => (
                          <Badge
                            key={id}
                            variant="outline"
                            className="font-normal"
                          >
                            {formatClassName(id)} {level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}

                {spell.flags.length > 0 ? (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-medium">Flags</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {spell.flags.map((flag) => (
                          <Badge
                            key={flag}
                            variant="secondary"
                            className="font-normal"
                          >
                            {flag.replaceAll("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null}

                {spell.short_description ? (
                  <>
                    <Separator />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {spell.short_description}
                    </p>
                  </>
                ) : null}

                {spell.description ? (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-medium">Description</h3>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {spell.description}
                      </p>
                    </div>
                  </>
                ) : null}

                {spell.mythic_version ? (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-medium">
                        {spell.mythic_version.name || "Mythic version"}
                      </h3>
                      {spell.mythic_version.source ? (
                        <p className="text-xs text-muted-foreground">
                          {spell.mythic_version.source}
                        </p>
                      ) : null}
                      {spell.mythic_version.description_text ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                          {spell.mythic_version.description_text}
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyLink}
                >
                  {copied ? (
                    <CheckIcon data-icon="inline-start" />
                  ) : (
                    <CopyIcon data-icon="inline-start" />
                  )}
                  {copied ? "Copied" : "Copy link"}
                </Button>
                <AddToSpellbookButton
                  spellId={spell.id}
                  spellName={spell.name}
                  classOptions={classOptions}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <DialogClose render={<Button variant="ghost" size="sm" />}>
                  Close
                </DialogClose>
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a href={spell.url} target="_blank" rel="noreferrer" />
                  }
                  nativeButton={false}
                >
                  Open on AoN
                  <ExternalLinkIcon data-icon="inline-end" />
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
