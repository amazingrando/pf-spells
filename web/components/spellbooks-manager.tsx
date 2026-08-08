"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookMarkedIcon,
  CopyIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  ShareIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"

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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatClassName, type ClassOption } from "@/lib/spells"
import {
  isSpellbookSharePayload,
  type Spellbook,
} from "@/lib/spellbooks"

type SpellbooksManagerProps = {
  classOptions: ClassOption[]
}

export function SpellbooksManager({ classOptions }: SpellbooksManagerProps) {
  const {
    books,
    ready,
    createBook,
    updateBook,
    deleteBook,
    getShareUrl,
    exportBookJson,
    importSharePayload,
  } = useSpellbooks()

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Spellbook | null>(null)
  const [deleting, setDeleting] = React.useState<Spellbook | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { viewMode, setViewMode } = useViewMode()

  async function copyShareLink(book: Spellbook) {
    const url = getShareUrl(book)
    await navigator.clipboard.writeText(url)
    toast.success("Share link copied")
  }

  function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as unknown
        if (!isSpellbookSharePayload(parsed)) {
          toast.error("That file is not a valid spellbook export")
          return
        }
        const book = importSharePayload(parsed)
        toast.success(`Imported “${book.name}”`)
      } catch {
        toast.error("Could not read that JSON file")
      }
    }
    reader.readAsText(file)
  }

  if (!ready) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Spellbooks</h1>
          <p className="max-w-2xl text-muted-foreground">
            Build local collections of spells for your characters. They stay in
            this browser and can be shared with a link or JSON file.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ViewModeToggle value={viewMode} onValueChange={setViewMode} />
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={handleImportFile}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon data-icon="inline-start" />
            Import JSON
          </Button>
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            New spellbook
          </Button>
        </div>
      </div>

      {books.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookMarkedIcon />
            </EmptyMedia>
            <EmptyTitle>No spellbooks yet</EmptyTitle>
            <EmptyDescription>
              Create a book for a character, then add spells from the browser.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <PlusIcon data-icon="inline-start" />
              Create spellbook
            </Button>
          </EmptyContent>
        </Empty>
      ) : viewMode === "table" ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Spells</TableHead>
              <TableHead className="hidden md:table-cell">Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.map((book) => (
              <TableRow key={book.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/spellbooks/${book.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {book.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {book.classId ? (
                    formatClassName(book.classId)
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{book.spellIds.length}</TableCell>
                <TableCell className="hidden max-w-xs truncate md:table-cell">
                  {book.notes || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <Button
                      size="sm"
                      render={<Link href={`/spellbooks/${book.id}`} />}
                      nativeButton={false}
                    >
                      Open
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="outline" size="sm" />}
                      >
                        <MoreHorizontalIcon data-icon="inline-start" />
                        More
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-44">
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => setEditing(book)}>
                            <PencilIcon />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyShareLink(book)}>
                            <ShareIcon />
                            Copy share link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => exportBookJson(book)}
                          >
                            <DownloadIcon />
                            Export JSON
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleting(book)}
                          >
                            <Trash2Icon />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {books.map((book) => (
            <Card key={book.id} size="sm" className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    <Link
                      href={`/spellbooks/${book.id}`}
                      className="rounded-sm underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      {book.name}
                    </Link>
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-sm" />}
                    >
                      <MoreHorizontalIcon />
                      <span className="sr-only">Spellbook actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-44">
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => setEditing(book)}>
                          <PencilIcon />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyShareLink(book)}>
                          <ShareIcon />
                          Copy share link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportBookJson(book)}>
                          <DownloadIcon />
                          Export JSON
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleting(book)}
                        >
                          <Trash2Icon />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">
                    {book.spellIds.length}{" "}
                    {book.spellIds.length === 1 ? "spell" : "spells"}
                  </Badge>
                  {book.classId ? (
                    <Badge variant="outline">
                      {formatClassName(book.classId)}
                    </Badge>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {book.notes ? (
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {book.notes}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No notes</p>
                )}
              </CardContent>
              <CardFooter className="mt-auto flex shrink-0 gap-2">
                <Button
                  size="sm"
                  render={<Link href={`/spellbooks/${book.id}`} />}
                  nativeButton={false}
                >
                  Open
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyShareLink(book)}
                >
                  <CopyIcon data-icon="inline-start" />
                  Share
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <SpellbookFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        classOptions={classOptions}
        title="New spellbook"
        description="Create a local collection of spells for a character."
        submitLabel="Create"
        onSubmit={(values) => {
          const book = createBook(values)
          toast.success(`Created “${book.name}”`)
        }}
      />

      <SpellbookFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
        classOptions={classOptions}
        initial={editing}
        title="Edit spellbook"
        description="Update the name, class, or notes for this book."
        submitLabel="Save"
        onSubmit={(values) => {
          if (!editing) return
          updateBook(editing.id, values)
          toast.success("Spellbook updated")
          setEditing(null)
        }}
      />

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete spellbook?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes “{deleting?.name}” from this browser. Share
              links you already copied will still work for importing a copy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!deleting) return
                deleteBook(deleting.id)
                toast.success(`Deleted “${deleting.name}”`)
                setDeleting(null)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
