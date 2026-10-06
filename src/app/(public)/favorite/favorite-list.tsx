"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CardData } from "@/lib/animal-card-data";
import {
  fetchFavorites,
  readFavoriteIds,
  removeFavorites,
  useFavoriteIds,
} from "@/lib/favorites";
import { STR } from "@/lib/strings";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CardGrid } from "../card-grid";
import { SkeletonGrid } from "../skeleton-grid";

type Result =
  | { status: "error" }
  | { status: "ready"; cards: CardData[]; removed: number };

// Vrai dès que le composant tourne dans le navigateur (après hydratation) :
// avant, le localStorage n'est pas lisible et la liste n'est pas connue.
const noop = () => () => {};
function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/**
 * La liste des favoris, lue dans le localStorage puis complétée par le
 * serveur (/api/favorite) — c'est lui qui sait ce que chaque annonce est
 * devenue :
 * - adoptée : elle reste, rangée sous « Și-au găsit familia », avec sa
 *   pastille ; le cœur sert à la retirer ;
 * - inactive (faute de confirmation) : elle reste, après les disponibles,
 *   avec la pastille « Nu mai e activ » — le titre de sa fiche, en court ; le
 *   cœur sert à la retirer, et réactivée elle redevient disponible ;
 * - supprimée ou masquée : elle sort des favoris, et la page le dit — sinon
 *   on cherche l'animal qu'on avait gardé.
 *
 * La liste affichée est celle du chargement : décocher un cœur ici ne fait
 * pas disparaître la carte (un geste malheureux se rattrape d'un second
 * clic), elle n'y sera plus à la prochaine visite.
 */
export function FavoriteList() {
  const ids = useFavoriteIds();
  const hydrated = useHydrated();
  // null = pas encore de réponse du serveur pour cette tentative.
  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // La liste lue au moment de la requête, pas à chaque changement : un
    // cœur décoché ici ne relance rien (voir plus haut).
    const snapshot = readFavoriteIds();
    if (!hydrated || snapshot.length === 0) return;
    const controller = new AbortController();
    fetchFavorites(snapshot, controller.signal)
      .then((data) => {
        removeFavorites(data.missing);
        setResult({ status: "ready", cards: data.animals, removed: data.missing.length });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResult({ status: "error" });
      });
    return () => controller.abort();
  }, [hydrated, attempt]);

  if (!hydrated || (result === null && ids.length > 0)) {
    return <SkeletonGrid count={Math.min(Math.max(ids.length, 2), 8)} />;
  }

  if (result?.status === "error") {
    return (
      <EmptyState
        title={STR.favorite.loadFailed}
        action={
          <Button
            variant="outline"
            onClick={() => {
              setResult(null);
              setAttempt((n) => n + 1);
            }}
          >
            {STR.error.retry}
          </Button>
        }
      />
    );
  }

  // Aucun favori dans ce navigateur : pas de requête, l'état vide.
  if (result === null) {
    return <EmptyFavorites />;
  }

  // Les disponibles d'abord, puis les inactives : elles peuvent revenir.
  const current = [
    ...result.cards.filter((card) => !card.adopted && !card.inactive),
    ...result.cards.filter((card) => card.inactive),
  ];
  const adopted = result.cards.filter((card) => card.adopted);

  return (
    <>
      {result.removed > 0 && (
        <p role="status" className="mb-4 max-w-[66ch] text-base text-warm-ink">
          {STR.favorite.removed(result.removed)}
        </p>
      )}
      {result.cards.length === 0 ? (
        <EmptyFavorites />
      ) : (
        <>
          {current.length > 0 && <CardGrid cards={current} keepHeart />}
          {adopted.length > 0 && (
            <section className={current.length > 0 ? "mt-10" : ""}>
              <h2 className="mb-4 text-xl font-semibold text-warm-ink">
                {STR.adoptati.title}
              </h2>
              <CardGrid cards={adopted} eagerCount={0} keepHeart />
            </section>
          )}
        </>
      )}
    </>
  );
}

function EmptyFavorites() {
  return (
    <EmptyState
      title={STR.favorite.emptyTitle}
      description={STR.favorite.emptyDescription}
      action={
        <ButtonLink variant="outline" href="/animale">
          {STR.animal.seeAvailable}
        </ButtonLink>
      }
    />
  );
}
