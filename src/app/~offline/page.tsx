import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hors ligne – TakeMeHome",
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
        Pas de connexion
      </h1>
      <p className="max-w-md text-base text-warm-gray">
        Les annonces changent tout le temps : elles ne sont pas gardées hors
        ligne, pour ne jamais vous montrer un animal déjà adopté. Revenez dès
        que le réseau est là.
      </p>
    </main>
  );
}
