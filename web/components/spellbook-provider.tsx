"use client"

import * as React from "react"

import {
  createSpellbook,
  downloadSpellbookJson,
  getSpellbookShareHref,
  readSpellbooksFromStorage,
  spellbookFromSharePayload,
  writeSpellbooksToStorage,
  type Spellbook,
  type SpellbookInput,
  type SpellbookSharePayload,
} from "@/lib/spellbooks"
import { encodeSharePayload } from "@/lib/spellbook-share"

type SpellbookContextValue = {
  books: Spellbook[]
  ready: boolean
  createBook: (input: SpellbookInput) => Spellbook
  updateBook: (
    id: string,
    patch: Partial<Pick<Spellbook, "name" | "classId" | "notes" | "spellIds">>
  ) => Spellbook | null
  deleteBook: (id: string) => void
  getBook: (id: string) => Spellbook | undefined
  addSpellToBook: (bookId: string, spellId: string) => Spellbook | null
  removeSpellFromBook: (bookId: string, spellId: string) => Spellbook | null
  importSharePayload: (payload: SpellbookSharePayload) => Spellbook
  getShareUrl: (book: Spellbook) => string
  exportBookJson: (book: Spellbook) => void
}

const SpellbookContext = React.createContext<SpellbookContextValue | null>(null)

function sortBooks(books: Spellbook[]) {
  return [...books].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

function commit(next: Spellbook[]) {
  const sorted = sortBooks(next)
  writeSpellbooksToStorage(sorted)
  return sorted
}

export function SpellbookProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = React.useState<Spellbook[]>([])
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setBooks(sortBooks(readSpellbooksFromStorage()))
    setReady(true)
  }, [])

  const createBook = React.useCallback((input: SpellbookInput) => {
    const book = createSpellbook(input)
    setBooks((current) => commit([book, ...current]))
    return book
  }, [])

  const updateBook = React.useCallback(
    (
      id: string,
      patch: Partial<Pick<Spellbook, "name" | "classId" | "notes" | "spellIds">>
    ) => {
      let updated: Spellbook | null = null
      setBooks((current) => {
        const next = current.map((book) => {
          if (book.id !== id) return book
          updated = {
            ...book,
            ...patch,
            name:
              patch.name !== undefined
                ? patch.name.trim() || book.name
                : book.name,
            notes:
              patch.notes !== undefined ? patch.notes.trim() : book.notes,
            spellIds: patch.spellIds
              ? [...new Set(patch.spellIds)]
              : book.spellIds,
            updatedAt: new Date().toISOString(),
          }
          return updated
        })
        return updated ? commit(next) : current
      })
      return updated
    },
    []
  )

  const deleteBook = React.useCallback((id: string) => {
    setBooks((current) => commit(current.filter((book) => book.id !== id)))
  }, [])

  const getBook = React.useCallback(
    (id: string) => books.find((book) => book.id === id),
    [books]
  )

  const addSpellToBook = React.useCallback(
    (bookId: string, spellId: string) => {
      let result: Spellbook | null = null
      setBooks((current) => {
        const book = current.find((item) => item.id === bookId)
        if (!book) return current
        if (book.spellIds.includes(spellId)) {
          result = book
          return current
        }
        result = {
          ...book,
          spellIds: [...book.spellIds, spellId],
          updatedAt: new Date().toISOString(),
        }
        return commit(
          current.map((item) => (item.id === bookId ? result! : item))
        )
      })
      return result
    },
    []
  )

  const removeSpellFromBook = React.useCallback(
    (bookId: string, spellId: string) => {
      let result: Spellbook | null = null
      setBooks((current) => {
        const book = current.find((item) => item.id === bookId)
        if (!book) return current
        result = {
          ...book,
          spellIds: book.spellIds.filter((id) => id !== spellId),
          updatedAt: new Date().toISOString(),
        }
        return commit(
          current.map((item) => (item.id === bookId ? result! : item))
        )
      })
      return result
    },
    []
  )

  const importSharePayload = React.useCallback(
    (payload: SpellbookSharePayload) => {
      const book = spellbookFromSharePayload(payload)
      setBooks((current) => commit([book, ...current]))
      return book
    },
    []
  )

  const getShareUrl = React.useCallback((book: Spellbook) => {
    const path = getSpellbookShareHref(book, encodeSharePayload)
    if (typeof window === "undefined") return path
    return new URL(path, window.location.origin).toString()
  }, [])

  const exportBookJson = React.useCallback((book: Spellbook) => {
    downloadSpellbookJson(book)
  }, [])

  const value = React.useMemo(
    () => ({
      books,
      ready,
      createBook,
      updateBook,
      deleteBook,
      getBook,
      addSpellToBook,
      removeSpellFromBook,
      importSharePayload,
      getShareUrl,
      exportBookJson,
    }),
    [
      books,
      ready,
      createBook,
      updateBook,
      deleteBook,
      getBook,
      addSpellToBook,
      removeSpellFromBook,
      importSharePayload,
      getShareUrl,
      exportBookJson,
    ]
  )

  return (
    <SpellbookContext.Provider value={value}>
      {children}
    </SpellbookContext.Provider>
  )
}

export function useSpellbooks() {
  const context = React.useContext(SpellbookContext)
  if (!context) {
    throw new Error("useSpellbooks must be used within SpellbookProvider")
  }
  return context
}

export function useSpellbook(id: string) {
  const { getBook, ready, ...rest } = useSpellbooks()
  return {
    book: getBook(id),
    ready,
    ...rest,
  }
}
