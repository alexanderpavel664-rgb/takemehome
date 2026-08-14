import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Squelette de la fiche, au gabarit EXACT de `page.tsx` — mêmes gouttières,
 * mêmes marges, même grille deux colonnes à partir de lg : le contenu réel
 * remplace le squelette sans déplacer un seul bloc (CLS ≈ 0).
 *
 * Règle de correspondance : chaque barre reprend la hauteur de la boîte de
 * ligne qu'elle remplace (corps 16/24 → h-6, petit texte 14/20 → h-5, titre
 * de section 18/28 → h-7, nom en Display 32/1,05 → 33,6 px). Quand deux
 * lignes se suivent sans marge dans la vraie page, les barres sont plus
 * courtes que la ligne et l'écart absorbe la différence — la somme reste
 * juste au pixel, sans fondre les lignes en un pavé.
 *
 * Deux hypothèses, prises sur le cas le plus fréquent puisque le squelette
 * ne connaît pas encore l'animal : une description de 3 lignes, et des
 * coordonnées présentes (donc `pb-28` + la barre d'appel fixe sous lg).
 *
 * `w-full` est le seul écart de classe avec `page.tsx`, et il est obligatoire :
 * `<main>` est un enfant du `body` en `flex flex-col`, et `mx-auto` y annule
 * l'étirement — la largeur retombe alors sur le contenu intrinsèque. La vraie
 * page ne le voit pas (son texte déborde toujours), un squelette de blocs à
 * largeur fixe se serait tassé à ~192 px.
 *
 * Sa présence permet aussi le préchargement partiel des liens de la grille
 * vers les fiches : la navigation est immédiate.
 */
export default function AnimalLoading() {
  return (
    <main
      aria-hidden
      className="mx-auto w-full max-w-3xl px-4 pt-4 pb-28 md:px-6 lg:max-w-6xl lg:px-8 lg:pb-8"
    >
      {/* Lien « ← Tous les animaux » : texte dans une zone min-h-11 (44 px). */}
      <div className="flex min-h-11 items-center">
        <Skeleton className="h-5 w-40" />
      </div>

      <div className="mt-2 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8">
        <div>
          {/* Photo 4:3, mêmes coins et même hairline que le conteneur réel. */}
          <Skeleton className="aspect-[4/3] border border-warm-border" />

          {/* Description : sous la photo à partir de lg (colonne gauche). */}
          <DescriptionSkeleton className="hidden lg:block" />
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          {/* Nom en Display : 32 px × 1,05 = 33,6 px. */}
          <Skeleton className="mt-3 h-[33.6px] w-1/2 lg:mt-0" />

          {/* Métadonnées puis lieu : deux lignes de 24 px qui se touchent
              (48 px) — barres de 20 px, l'écart de 8 px complète le compte. */}
          <div className="mt-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
          </div>

          {/* Carte de contact desktop : deux boutons de 48 px, gap-3. */}
          <Card className="mt-4 hidden p-4 lg:block">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          </Card>

          {/* Description : dans la pile mobile, avant Santé. */}
          <DescriptionSkeleton className="lg:hidden" />

          {/* Santé, puis « S'entend bien avec » : titre 28 px + une ligne. */}
          <section className="mt-6">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="mt-1 h-6 w-2/3" />
          </section>
          <section className="mt-6">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="mt-1 h-6 w-1/2" />
          </section>

          {/* Publié par / Mise à jour : deux lignes de 20 px collées (40 px). */}
          <div className="mt-6 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>

      {/* Barre d'appel fixée en bas (< lg) : hauteur du contenu 48 px, p-3 et
          hairline haute comprises, comme la vraie barre. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-warm-border bg-cream-ground p-3 lg:hidden">
        <div className="mx-auto flex max-w-3xl gap-3">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
        </div>
      </div>
    </main>
  );
}

/**
 * Bloc Description — rendu deux fois comme dans la vraie page (colonne
 * gauche à partir de lg, pile mobile en dessous), la copie inactive en
 * display:none. Trois lignes de 24 px : barres de 20 px séparées de 6 px,
 * 72 px au total.
 */
function DescriptionSkeleton({ className }: { className: string }) {
  return (
    <section className={`mt-6 ${className}`}>
      <Skeleton className="h-7 w-36" />
      <div className="mt-1 space-y-1.5">
        <Skeleton className="h-5" />
        <Skeleton className="h-5" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    </section>
  );
}
