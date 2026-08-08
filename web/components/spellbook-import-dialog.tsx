"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { BookMarkedIcon } from "lucide-react"
import { toast } from "sonner"

import { useSpellbooks } from "@/components/spellbook-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { decodeSharePayload } from "@/lib/spellbook-share"
import { formatClassName } from "@/lib/spells"
import type { SpellbookSharePayload } from "@/lib/spellbooks"

export function SpellbookImportDialog() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { ready, importSharePayload } = useSpellbooks()

  const [payload, setPayload] = React.useState<SpellbookSharePayload | null>(
    null
  )
  const [invalid, setInvalid] = React.useState(false)

  const encoded = searchParams.get("book")

  React.useEffect(() => {
    if (!ready) return
    if (!encoded) {
      setPayload(null)
      setInvalid(false)
      return
    }
    const decoded = decodeSharePayload(encoded)
    if (decoded) {
      setPayload(decoded)
      setInvalid(false)
    } else {
      setPayload(null)
      setInvalid(true)
    }
  }, [encoded, ready])

  function clearBookParam() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("book")
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setPayload(null)
      setInvalid(false)
      clearBookParam()
    }
  }

  function handleImport() {
    if (!payload) return
    const book = importSharePayload(payload)
    toast.success(`Imported “${book.name}”`)
    setPayload(null)
    clearBookParam()
    router.push(`/spellbooks/${book.id}`)
  }

  const open = Boolean(payload) || invalid

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {invalid ? (
          <>
            <DialogHeader>
              <DialogTitle>Invalid share link</DialogTitle>
              <DialogDescription>
                This spellbook link could not be read. Ask the sender to copy
                the link again or share a JSON export instead.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : payload ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookMarkedIcon className="size-5" />
                Import spellbook?
              </DialogTitle>
              <DialogDescription>
                Save a local copy of “{payload.name}” in this browser. Your
                existing spellbooks are not changed.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>
                {payload.spellIds.length}{" "}
                {payload.spellIds.length === 1 ? "spell" : "spells"}
                {payload.classId
                  ? ` · ${formatClassName(payload.classId)}`
                  : ""}
              </p>
              {payload.notes ? (
                <p className="line-clamp-4">{payload.notes}</p>
              ) : null}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Not now
              </Button>
              <Button type="button" onClick={handleImport}>
                Import
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
