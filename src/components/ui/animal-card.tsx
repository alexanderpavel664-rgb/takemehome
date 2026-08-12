import Link from "next/link";
import type { ComponentProps } from "react";
import { Badge } from "./badge";
import { AnimalPhoto, PhotoFallback } from "./animal-photo";

// Largeurs réelles d'une carte : grille 2 colonnes sur mobile, 3 puis 4
// colonnes dans un conteneur max-w-5xl (1024px) sur desktop.
const DEFAULT_SIZES = "(min-width: 1024px) 246px, (min-width: 640px) 33vw, 50vw";

export type AnimalCardProps = {
  href: ComponentProps<typeof Link>["href"];
  name: string;
  /** Ligne « tip · sex · vârstă » — Label gris chaud sous le nom. */
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
      className="block rounded-md border border-warm-border bg-card-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
    >
      <span className="relative block aspect-[4/3] overflow-hidden rounded-t-[19px]">
        {photoUrl ? (
          <AnimalPhoto src={photoUrl} name={name} sizes={sizes} eager={eager} />
        ) : (
          <PhotoFallback name={name} />
        )}
        {adopted && (
          // Seule la pastille « Adoptat » a le droit de recouvrir une photo.
          <Badge className="absolute top-2 left-2">Adoptat</Badge>
        )}
      </span>
      <span className="block p-3">
        <span className="block text-[19px]/[1.2] font-semibold text-warm-ink">
          {name}
        </span>
        {meta && (
          <span className="mt-1 block text-[13px]/[1.4] text-warm-gray">
            {meta}
          </span>
        )}
        {county && (
          <span className="block text-[13px]/[1.4] text-warm-gray">
            {county}
          </span>
        )}
      </span>
    </Link>
  );
}
