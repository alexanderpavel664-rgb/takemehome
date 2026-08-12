import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";

/**
 * Coquille des pages publiques. La fiche /animal/[id] étant la page
 * d'entrée principale (liens Facebook), ce header garantit partout un
 * chemin évident vers la liste : logo et lien « Tous les animaux ».
 * Encre chaude sur crème, hairline en bas — pas de soulignement permanent,
 * pas de terracotta sur la nav (La Règle Terracotta).
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-warm-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2">
          <Link
            href="/animale"
            className="flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
          >
            <Logo variant="lockup" />
          </Link>
          <nav className="flex items-center gap-2 text-sm text-warm-ink">
            <Link
              href="/animale"
              className="flex min-h-11 items-center rounded-md px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
            >
              Tous les animaux
            </Link>
            <Link
              href="/adoptati"
              className="flex min-h-11 items-center rounded-md px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
            >
              Adoptés
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </>
  );
}
