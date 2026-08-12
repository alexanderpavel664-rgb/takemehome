import Link from "next/link";
import type { ComponentProps } from "react";
import { Badge } from "./badge";
import { AnimalPhoto, PhotoFallback } from "./animal-photo";

// Largeurs réelles d'une carte : grille 2 colonnes sur mobile ; dès md,
// l'auto-fill minmax(260px,1fr) donne des cartes de 260 à ~405px selon la
// largeur disponible (pire cas : 2 colonnes juste avant le passage à 3).
// 410px couvre ce pire cas — léger surdimensionnement acceptable, jamais
// de sous-dimensionnement.
const DEFAULT_SIZES = "(min-width: 768px) 410px, 50vw";

export type AnimalCardProps = {
  href: ComponentProps<typeof Link>["href"];
  name: string;
  /** Ligne « type · sexe · âge » — Label gris chaud sous le nom. */
  meta?: string;
  /** Nom du județ, seconde ligne de métadonnées. */
  county?: string;
  photoUrl?: string | null;
  adopted?: boolean;
  sizes?: string;
  /** Premières cartes de la grille : chargement immédiat. */
  eager?: boolean;
};

/**
 * Carte de la grille : photo 4:3 en recadrage centré, nom 600/19 px,
 * métadonnées en Label gris chaud. Les coins hauts de la photo sont à 19 px —
 * 1 px de moins que la carte, sinon un liseré d'ivoire apparaît entre la
 * photo et la bordure.
 *
 * La racine est un @container : l'intérieur s'adapte à la largeur de SA
 * cellule (qui varie selon la présence de la colonne de filtres), pas à
 * celle de l'écran. Cellule large (@sm, 24rem) : padding et métadonnées
 * respirent ; le nom reste à 19 px/600 (échelle DESIGN.md).
 */
export function AnimalCard({
  href,
  name,
  meta,
  county,
  photoUrl,
  adopted = false,
  sizes = DEFAULT_SIZES,
  eager = false,
}: AnimalCardProps) {
  return (
    <Link
      href={href}
      className="@container block rounded-md border border-warm-border bg-card-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
    >
      <span className="relative block aspect-[4/3] overflow-hidden rounded-t-[19px]">
        {photoUrl ? (
          <AnimalPhoto src={photoUrl} name={name} sizes={sizes} eager={eager} />
        ) : (
          <PhotoFallback name={name} />
        )}
        {adopted && (
          // Seule la pastille « Adopté » a le droit de recouvrir une photo.
          <Badge className="absolute top-2 left-2">Adopté</Badge>
        )}
      </span>
      <span className="block p-3 @sm:p-4">
        <span className="block text-[19px]/[1.2] font-semibold text-warm-ink">
          {name}
        </span>
        {meta && (
          <span className="mt-1 block text-[13px]/[1.4] text-warm-gray @sm:text-sm">
            {meta}
          </span>
        )}
        {county && (
          <span className="block text-[13px]/[1.4] text-warm-gray @sm:text-sm">
            {county}
          </span>
        )}
      </span>
    </Link>
  );
}
