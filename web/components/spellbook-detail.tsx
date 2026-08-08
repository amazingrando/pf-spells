"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  BookOpenIcon,
  DownloadIcon,
  PencilIcon,
  ShareIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { SpellCard } from "@/components/spell-card"
import { SpellDetailDialog } from "@/components/spell-detail-dialog"
import { SpellTable } from "@/components/spell-table"
import { SpellbookFormDialog } from "@/components/spellbook-form-dialog"
import { useSpellbooks } from "@/components/spellbook-provider"
import { ViewModeToggle, useViewMode } from "@/components/view-mode-toggle"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useSpellDetailParam } from "@/hooks/use-spell-detail-param"
import { formatClassName, getSpellLevel, type ClassOption, type Spell } from "@/lib/spells"

type SpellbookDetailProps = {
  bookId: string
  spells: Spell[]
  classOptions: ClassOption[]
}

export function SpellbookDetail({
  bookId,
  spells,
  classOptions,
}: SpellbookDetailProps) {
  const router = useRouter()
  const {
    ready,
    getBook,
    updateBook,
    deleteBook,
    removeSpellFromBook,
    getShareUrl,
    exportBookJson,
  } = useSpellbooks()

  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const { viewMode, setViewMode } = useViewMode()
  const { selectedSpell, handleDialogOpenChange } = useSpellDetailParam(spells)

  const book = getBook(bookId)
  const spellById = React.useMemo(() => {
    const map = new Map<string, Spell>()
    for (const spell of spells) map.set(spell.id, spell)
    return map
  }, [spells])

  const bookSpells = React.useMemo(() => {
    if (!book) return []
    return book.spellIds
      .map((id) => spellById.get(id))
      .filter((spell): spell is Spell => Boolean(spell))
      .sort((a, b) => {
        if (book.classId) {
          const levelA = getSpellLevel(a, book.classId)
          const levelB = getSpellLevel(b, book.classId)
          const rankA = levelA ?? -1
          const rankB = levelB ?? -1
          if (rankA !== rankB) return rankB - rankA
        }
        return a.name.localeCompare(b.name)
      })
  }, [book, spellById])

  const missingCount = book
    ? book.spellIds.length - bookSpells.length
    : 0

  async function copyShareLink() {
    if (!book) return
    await navigator.clipboard.writeText(getShareUrl(book))
    toast.success("Share link copied")
  }

  if (!ready) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpenIcon />
            </EmptyMedia>
            <EmptyTitle>Spellbook not found</EmptyTitle>
            <EmptyDescription>
              This book is not saved in this browser. It may have been deleted
              or never imported here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/spellbooks" />} nativeButton={false}>
              Back to spellbooks
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          render={<Link href="/spellbooks" />}
          nativeButton={false}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          All spellbooks
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {book.name}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary">
                {book.spellIds.length}{" "}
                {book.spellIds.length === 1 ? "spell" : "spells"}
              </Badge>
              {book.classId ? (
                <Badge variant="outline">
                  {formatClassName(book.classId)}
                </Badge>
              ) : null}
            </div>
            {book.notes ? (
              <p className="max-w-2xl text-muted-foreground">{book.notes}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <ViewModeToggle value={viewMode} onValueChange={setViewMode} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <PencilIcon data-icon="inline-start" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyShareLink}
            >
              <ShareIcon data-icon="inline-start" />
              Share
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => exportBookJson(book)}
            >
              <DownloadIcon data-icon="inline-start" />
              Export
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {bookSpells.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpenIcon />
            </EmptyMedia>
            <EmptyTitle>No spells in this book</EmptyTitle>
            <EmptyDescription>
              Browse the spell list and use “Add to spellbook” to fill it in.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/" />} nativeButton={false}>
              Browse spells
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {missingCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {missingCount} spell
              {missingCount === 1 ? "" : "s"} in this book could not be matched
              to the local dataset.
            </p>
          ) : null}
          {viewMode === "table" ? (
            <SpellTable
              spells={bookSpells}
              classId={book.classId}
              classOptions={classOptions}
              onRemoveSpell={(spell) => {
                removeSpellFromBook(book.id, spell.id)
                toast.success(`Removed ${spell.name}`)
              }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {bookSpells.map((spell) => (
                <SpellCard
                  key={spell.id}
                  spell={spell}
                  classId={book.classId}
                  classOptions={classOptions}
                  onRemove={() => {
                    removeSpellFromBook(book.id, spell.id)
                    toast.success(`Removed ${spell.name}`)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <SpellbookFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        classOptions={classOptions}
        initial={book}
        title="Edit spellbook"
        description="Update the name, class, or notes for this book."
        submitLabel="Save"
        onSubmit={(values) => {
          updateBook(book.id, values)
          toast.success("Spellbook updated")
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete spellbook?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes “{book.name}” from this browser.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                deleteBook(book.id)
                toast.success(`Deleted “${book.name}”`)
                router.push("/spellbooks")
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SpellDetailDialog
        spell={selectedSpell}
        open={Boolean(selectedSpell)}
        onOpenChange={handleDialogOpenChange}
        classOptions={classOptions}
      />
    </div>
  )
}
