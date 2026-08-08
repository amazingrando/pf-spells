import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Suspense } from "react"

import "./globals.css"
import { SiteHeader } from "@/components/site-header"
import { SpellbookImportDialog } from "@/components/spellbook-import-dialog"
import { SpellbookProvider } from "@/components/spellbook-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Spellscraper",
    template: "%s · Spellscraper",
  },
  description: "Browse and filter Pathfinder spells from Archives of Nethys.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <ThemeProvider>
          <SpellbookProvider>
            <div className="flex min-h-svh flex-col">
              <SiteHeader />
              <div className="flex-1">{children}</div>
            </div>
            <Suspense fallback={null}>
              <SpellbookImportDialog />
            </Suspense>
            <Toaster />
          </SpellbookProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
