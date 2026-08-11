"use client";

import Link, { useLinkStatus } from "next/link";

function Label() {
  const { pending } = useLinkStatus();
  return <>{pending ? "Chargement…" : "Vezi mai multe"}</>;
}

/**
 * Pagination par paquets portée par l'URL (?n=) : le serveur rend toute la
 * liste jusqu'à n, donc un retour arrière (ou un rechargement) retrouve le
 * même contenu et la même position. `replace` évite d'empiler une entrée
 * d'historique par clic, `scroll={false}` reste en place (la grille visible
 * n'est pas re-suspendue : seuls les searchParams changent), et le prefetch
 * est coupé car la cible grossit à chaque clic.
 */
export function LoadMore({ href }: { href: string }) {
  return (
    <p className="my-6 text-center">
      <Link
        href={href}
        replace
        scroll={false}
        prefetch={false}
        className="inline-block min-h-11 border-2 px-6 py-3 font-bold"
      >
        <Label />
      </Link>
    </p>
  );
}
