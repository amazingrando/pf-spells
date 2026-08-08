"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookMarkedIcon, LibraryIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Browse", icon: LibraryIcon },
  { href: "/spellbooks", label: "Spellbooks", icon: BookMarkedIcon },
] as const

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="font-medium tracking-tight">
          Spellscraper
        </Link>
        <nav className="flex items-center gap-1" aria-label="Primary">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href)
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
