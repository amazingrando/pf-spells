"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ClassOption } from "@/lib/spells"
import type { Spellbook } from "@/lib/spellbooks"

export type SpellbookFormValues = {
  name: string
  classId: string | null
  notes: string
}

type SpellbookFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  classOptions: ClassOption[]
  initial?: Spellbook | null
  title: string
  description: string
  submitLabel: string
  onSubmit: (values: SpellbookFormValues) => void
}

export function SpellbookFormDialog({
  open,
  onOpenChange,
  classOptions,
  initial,
  title,
  description,
  submitLabel,
  onSubmit,
}: SpellbookFormDialogProps) {
  const [name, setName] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [classId, setClassId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setName(initial?.name ?? "")
    setNotes(initial?.notes ?? "")
    setClassId(initial?.classId ?? null)
  }, [open, initial])

  const selectedClass =
    classOptions.find((option) => option.value === classId) ?? null

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubmit({
      name: name.trim() || "Untitled spellbook",
      classId,
      notes: notes.trim(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="spellbook-name">Name</FieldLabel>
              <Input
                id="spellbook-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Kael — Sorcerer"
                autoComplete="off"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="spellbook-class">Class (optional)</FieldLabel>
              <Combobox
                items={classOptions}
                value={selectedClass}
                onValueChange={(value) =>
                  setClassId((value as ClassOption | null)?.value ?? null)
                }
                itemToStringValue={(item) => item.label}
              >
                <ComboboxInput
                  id="spellbook-class"
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

            <Field>
              <FieldLabel htmlFor="spellbook-notes">Notes</FieldLabel>
              <Textarea
                id="spellbook-notes"
                name="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Known spells, bloodline notes, etc."
                rows={3}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
