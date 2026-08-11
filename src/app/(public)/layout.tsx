import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Coquille des pages publiques. La fiche /animal/[id] étant la page
 * d'entrée principale (liens Facebook), ce header garantit partout un
 * chemin évident vers la liste : logo et lien « Tous les animaux ».
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <Link
          href="/animale"
          className="py-1 text-xl font-extrabold lowercase tracking-tight"
        >
          takemehome
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/animale" className="py-2 underline">
            Tous les animaux
          </Link>
          <Link href="/adoptati" className="py-2 underline">
            Adoptés
          </Link>
        </nav>
      </header>
      {children}
    </>
  );
}
