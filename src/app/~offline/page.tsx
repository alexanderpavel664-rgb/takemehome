import type { Metadata } from "next";
import { STR } from "@/lib/strings";

export const metadata: Metadata = {
  title: STR.offline.metaTitle,
};

/**
 * Écran servi par le service worker quand une navigation échoue faute de
 * réseau. Aucun lien vers une autre page : hors ligne, elles échoueraient
 * toutes pareil — la seule sortie honnête est de revenir quand ça capte
 * (La Règle de la Sortie). Rendu dans le layout racine, sans en-tête public,
 * comme la 404. Préchargé au moment de l'installation du worker.
 */
export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-warm-ink">
        {STR.offline.title}
      </h1>
      <p className="max-w-md text-base text-warm-gray">
        {STR.offline.description}
      </p>
    </main>
  );
}
