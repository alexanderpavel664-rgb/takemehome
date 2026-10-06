import Link from "next/link";
import type { ComponentProps } from "react";
import { STR } from "@/lib/strings";
import { Badge, DeadlineBadge, InkBadge, Pill } from "./badge";
import { AnimalPhoto, PhotoFallback } from "./animal-photo";
import { FavoriteButton } from "./favorite-button";

// Largeurs réelles d'une carte : grille 2 colonnes sur mobile ; dès md,
// l'auto-fill minmax(260px,1fr) donne des cartes de 260 à ~405px selon la
// largeur disponible (pire cas : 2 colonnes juste avant le passage à 3).
// 410px couvre ce pire cas — léger surdimensionnement acceptable, jamais
// de sous-dimensionnement.
const DEFAULT_SIZES = "(min-width: 768px) 410px, 50vw";

export type AnimalCardProps = {
  href: ComponentProps<typeof Link>["href"];
  /**
   * L'id de l'annonce : le cœur des favoris. Sans lui, pas de cœur — et
   * seulement sur un animal disponible : les favoris servent à retrouver
   * un animal qu'on pourrait adopter.
   */
  id?: string;
  /** Le nom, ou ce qui en tient lieu (animalDisplayName). */
  name: string;
  /** Ligne « type · sexe · âge » — Label gris chaud sous le nom. */
  meta?: string;
  /** Nom du județ, seconde ligne de métadonnées. */
  county?: string;
  /** « acum 3 zile » — l'âge de la dernière mise à jour, et sa date ISO. */
  updated?: { label: string; iso: string };
  photoUrl?: string | null;
  adopted?: boolean;
  /** Inactive faute de confirmation — /favorite seulement. */
  inactive?: boolean;
  /**
   * /favorite seulement : le cœur reste sur une carte adoptée ou inactive,
   * c'est là qu'on la retire de ses favoris.
   */
  keepHeart?: boolean;
  /** « 3 pui » — la pastille discrète des fratries (groupLabel). */
  group?: string | null;
  /** « Până la 15 sept. » — la pastille terracotta des derniers jours (deadlineLabel). */
  deadline?: string | null;
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
 * Toute la carte est cliquable, mais le lien ne porte que le nom : son
 * ::after s'étend sur la carte entière (lien « étiré »). Le cœur des favoris
 * est un bouton, et un bouton ne peut pas vivre dans un lien — il est posé
 * au-dessus du ::after (relative z-10), à droite du nom. Le lecteur d'écran
 * entend « Fulga, lien » au lieu de toute la carte lue d'une traite.
 *
 * La racine est un @container : l'intérieur s'adapte à la largeur de SA
 * cellule (qui varie selon la présence de la colonne de filtres), pas à
 * celle de l'écran. Cellule large (@sm, 24rem) : padding et métadonnées
 * respirent ; le nom reste à 19 px/600 (échelle DESIGN.md).
 *
 * Les pastilles d'échéance, d'annonce inactive et de fratrie vivent dans la
 * zone de texte, sous les métadonnées, comme le cœur : seule « Adoptat » a
 * le droit de recouvrir la photo.
 */
export function AnimalCard({
  href,
  id,
  name,
  meta,
  county,
  updated,
  photoUrl,
  adopted = false,
  inactive = false,
  keepHeart = false,
  group,
  deadline,
  sizes = DEFAULT_SIZES,
  eager = false,
}: AnimalCardProps) {
  return (
    <div className="@container relative rounded-md border border-warm-border bg-card-ivory">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-[19px]">
        {photoUrl ? (
          <AnimalPhoto src={photoUrl} name={name} sizes={sizes} eager={eager} />
        ) : (
          <PhotoFallback name={name} />
        )}
        {adopted && (
          // Seule la pastille « Adoptat » a le droit de recouvrir une photo.
          <Badge className="absolute top-2 left-2">
            {STR.animal.adoptedBadge}
          </Badge>
        )}
      </div>
      <div className="p-3 @sm:p-4">
        <div className="flex items-start gap-1">
          <Link
            href={href}
            className="min-w-0 flex-1 text-[19px]/[1.2] font-semibold break-words text-warm-ink after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-warm-ink"
          >
            {name}
          </Link>
          {id && ((!adopted && !inactive) || keepHeart) && (
            // 44 px de cible pour une ligne de 23 px : les marges négatives
            // gardent la hauteur de la ligne du nom (et celle du squelette).
            <FavoriteButton
              id={id}
              name={name}
              className="relative z-10 -my-[10.5px] -mr-2"
            />
          )}
        </div>
        {meta && (
          <p className="mt-1 text-[13px]/[1.4] text-warm-gray @sm:text-sm">
            {meta}
          </p>
        )}
        {county && (
          <p className="text-[13px]/[1.4] text-warm-gray @sm:text-sm">
            {county}
          </p>
        )}
        {updated && (
          // L'âge de l'annonce : discret, en gris chaud, la même formule que
          // le « Actualizat … » de la fiche (relativeTimeRo).
          <p className="text-[13px]/[1.4] text-warm-gray @sm:text-sm">
            <time dateTime={updated.iso}>{updated.label}</time>
          </p>
        )}
        {(deadline || inactive || group) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {deadline && <DeadlineBadge>{deadline}</DeadlineBadge>}
            {inactive && (
              // Le titre de la fiche inactive, en court (strings.ts).
              <InkBadge>{STR.animal.unconfirmedBadge}</InkBadge>
            )}
            {group && <Pill>{group}</Pill>}
          </div>
        )}
      </div>
    </div>
  );
}
