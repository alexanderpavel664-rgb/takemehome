import type { CardData } from "@/lib/animal-card-data";
import { AnimalCard } from "@/components/ui/animal-card";

/**
 * Mise en page des grilles publiques : 2 colonnes sur mobile, puis auto-fill
 * dès md — des cartes d'au moins 260px quelle que soit la largeur disponible
 * (avec ou sans colonne de filtres), sans variante lg:/xl: à maintenir par
 * page.
 *
 * Module sans base de données : la page des favoris, rendue dans le
 * navigateur, l'importe aussi.
 */
export const GRID_CLASSES =
  "grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:gap-4";

/**
 * Les cartes d'une grille, données déjà prêtes (cardData). Les 4 premières
 * photos (au-dessus de la ligne de flottaison) chargent en eager, les autres
 * en lazy (défaut de next/image).
 */
export function CardGrid({
  cards,
  eagerCount = 4,
}: {
  cards: CardData[];
  /** 0 quand la grille est sous la ligne de flottaison (accueil). */
  eagerCount?: number;
}) {
  return (
    <ul className={GRID_CLASSES}>
      {cards.map((card, i) => (
        <li key={card.id}>
          <AnimalCard {...card} eager={i < eagerCount} />
        </li>
      ))}
    </ul>
  );
}
