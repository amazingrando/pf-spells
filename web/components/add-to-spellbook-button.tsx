"use client"

import * as React from "react"
import { BookMarkedIcon, CheckIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { SpellbookFormDialog } from "@/components/spellbook-form-dialog"
import { useSpellbooks } from "@/components/spellbook-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ClassOption } from "@/lib/spells"

type AddToSpellbookButtonProps = {
  spellId: string
  spellName: string
  classOptions: ClassOption[]
  size?: "default" | "sm"
  variant?: "default" | "outline" | "ghost" | "secondary"
}

export function AddToSpellbookButton({
  spellId,
  spellName,
  classOptions,
  size = "sm",
  variant = "outline",
}: AddToSpellbookButtonProps) {
  const { books, ready, createBook, addSpellToBook } = useSpellbooks()
  const [createOpen, setCreateOpen] = React.useState(false)

  function addToBook(bookId: string, bookName: string) {
    const book = books.find((item) => item.id === bookId)
    if (!book) {
      toast.error("Spellbook not found")
      return
    }
    if (book.spellIds.includes(spellId)) {
      toast.message(`${spellName} is already in “${bookName}”`)
      return
    }
    addSpellToBook(bookId, spellId)
    toast.success(`Added ${spellName} to “${bookName}”`)
  }

  if (!ready) {
    return (
      <Button type="button" size={size} variant={variant} disabled>
        <BookMarkedIcon data-icon="inline-start" />
        Add to spellbook
      </Button>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button size={size} variant={variant} />}>
          <BookMarkedIcon data-icon="inline-start" />
          Add to spellbook
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Spellbooks</DropdownMenuLabel>
            {books.length === 0 ? (
              <DropdownMenuItem disabled>No spellbooks yet</DropdownMenuItem>
            ) : (
              books.map((book) => {
                const included = book.spellIds.includes(spellId)
                return (
                  <DropdownMenuItem
                    key={book.id}
                    disabled={included}
                    onClick={() => {
                      if (included) return
                      addToBook(book.id, book.name)
                    }}
                  >
                    {included ? <CheckIcon /> : <PlusIcon />}
                    <span className="truncate">{book.name}</span>
                  </DropdownMenuItem>
                )
              })
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setCreateOpen(true)}>
              <PlusIcon />
              New spellbook…
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <SpellbookFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        classOptions={classOptions}
        title="New spellbook"
        description={`Create a book and add ${spellName} to it.`}
        submitLabel="Create & add"
        onSubmit={(values) => {
          const book = createBook({
            ...values,
            spellIds: [spellId],
          })
          toast.success(`Created “${book.name}” with ${spellName}`)
        }}
      />
    </>
  )
}
