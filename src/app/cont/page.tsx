import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, TYPE_LABELS } from "@/lib/animal-labels";
import { relativeTimeFr } from "@/lib/relative-time";
import { AnimalPhoto, PhotoFallback } from "@/components/ui/animal-photo";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { setAnimalStatus } from "./animal/actions";
import { DeleteAnimalButton } from "./animal/delete-animal-button";
import { SignOutButton } from "./sign-out-button";

// La vraie vérification de session se fait ici, dans chaque page protégée :
// le proxy ne fait qu'un contrôle optimiste sur la présence du cookie.
export default async function ContPage({ searchParams }: PageProps<"/cont">) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  // Confirmation posée en query par les server actions (création/édition) :
  // toute autre valeur est simplement ignorée.
  const { confirmation } = await searchParams;
  const confirmationMessage =
    confirmation === "creation"
      ? "L’animal a été publié."
      : confirmation === "modification"
        ? "Les modifications ont été enregistrées."
        : null;

  // Isolation : uniquement les animaux du compte connecté.
  const animals = await prisma.animal.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { photos: { orderBy: { position: "asc" }, take: 1 } },
  });

  return (
    <main className="px-4 py-4 md:px-6 lg:px-8">
      {confirmationMessage && (
        <p
          role="status"
          className="mb-4 max-w-[66ch] rounded-md border border-warm-border bg-card-ivory px-4 py-3 text-sm text-warm-ink"
        >
          {confirmationMessage}
        </p>
      )}
      <h1 className="text-2xl font-semibold text-warm-ink">Mon compte</h1>
      {/* Bloc de texte : contraint à 66ch (WCAG 1.4.8), la grille en dessous
          occupe elle toute la largeur. */}
      <div className="mt-3 max-w-[66ch] space-y-1 text-base text-warm-ink">
        <p>
          <span className="text-warm-gray">Nom :</span> {session.user.name}
        </p>
        <p>
          <span className="text-warm-gray">Email :</span> {session.user.email}
        </p>
      </div>
      <div className="mt-2">
        <ButtonLink variant="ghost" href="/cont/profil">
          Modifier mon profil
        </ButtonLink>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-warm-ink">Mes animaux</h2>
        {/* Le seul bouton plein de l'écran (La Règle du Bouton Unique). */}
        <ButtonLink variant="primary" href="/cont/animal/nou">
          Ajouter un animal
        </ButtonLink>
      </div>
      {animals.length === 0 ? (
        // Sans action : le primary « Ajouter un animal » est déjà juste au-dessus.
        <EmptyState
          title="Aucun animal pour l’instant"
          description="Ajoutez votre premier animal avec « Ajouter un animal » ci-dessus : sa fiche apparaîtra ici et sur le site public."
        />
      ) : (
        <ul className="mt-4 space-y-4 gap-4 md:grid md:grid-cols-2 md:space-y-0 xl:grid-cols-3">
          {animals.map((animal) => (
            // La cellule est le conteneur : la carte bascule selon SA largeur,
            // pas celle de l'écran (une cellule de grille md est plus étroite
            // qu'une colonne unique sm).
            <li key={animal.id} className="@container">
              <Card className="flex h-full flex-col gap-3 p-3 @sm:flex-row">
                {/* Cellule étroite (< @sm) : photo en haut, pleine largeur
                    en 4:3 ; cellule large : 160×120 à gauche ; recadrage
                    centré (fill + object-cover) ; sans photo : aplat crème
                    + nom (PhotoFallback), jamais d'image de remplacement
                    (DESIGN.md). */}
                <span className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md border border-warm-border @sm:aspect-auto @sm:h-30 @sm:w-40">
                  {animal.photos[0] ? (
                    <AnimalPhoto
                      src={animal.photos[0].url}
                      name={animal.name}
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    />
                  ) : (
                    <PhotoFallback name={animal.name} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-warm-ink">
                      {animal.name}
                    </span>
                    <span className="text-sm text-warm-gray">
                      {TYPE_LABELS[animal.type]}
                    </span>
                    {animal.status === "ADOPTED" ? (
                      <Badge>Adopté</Badge>
                    ) : (
                      <span className="inline-flex items-center rounded-pill border border-warm-border bg-card-ivory px-3 py-1 text-[13px] text-warm-ink">
                        {STATUS_LABELS[animal.status]}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-warm-gray">
                    Mis à jour {relativeTimeFr(animal.updatedAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {/* La publiante voit son annonce comme un adoptant. */}
                    <ButtonLink variant="ghost" href={`/animal/${animal.id}`}>
                      Voir l’annonce publique
                    </ButtonLink>
                    <ButtonLink
                      variant="ghost"
                      href={`/cont/animal/${animal.id}/editare`}
                    >
                      Modifier
                    </ButtonLink>
                    <form action={setAnimalStatus}>
                      <input type="hidden" name="id" value={animal.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={
                          animal.status === "AVAILABLE" ? "ADOPTED" : "AVAILABLE"
                        }
                      />
                      <Button variant="ghost" type="submit">
                        {animal.status === "AVAILABLE"
                          ? "Marquer comme adopté"
                          : "Marquer comme disponible"}
                      </Button>
                    </form>
                    <DeleteAnimalButton id={animal.id} name={animal.name} />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-10">
        <SignOutButton />
      </div>
    </main>
  );
}
