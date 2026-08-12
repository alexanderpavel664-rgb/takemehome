import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, TYPE_LABELS } from "@/lib/animal-labels";
import { relativeTimeFr } from "@/lib/relative-time";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { setAnimalStatus } from "./animal/actions";
import { DeleteAnimalButton } from "./animal/delete-animal-button";
import { SignOutButton } from "./sign-out-button";

// La vraie vérification de session se fait ici, dans chaque page protégée :
// le proxy ne fait qu'un contrôle optimiste sur la présence du cookie.
export default async function ContPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  // Isolation : uniquement les animaux du refuge connecté.
  const animals = await prisma.animal.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { photos: { orderBy: { position: "asc" }, take: 1 } },
  });

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold text-warm-ink">Mon compte</h1>
      <div className="mt-3 space-y-1 text-base text-warm-ink">
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
          title="Aucun animal pour l’instant."
          description="Ajoute ton premier animal avec « Ajouter un animal » ci-dessus : sa fiche apparaîtra ici et sur le site public."
        />
      ) : (
        <ul className="mt-4 space-y-4">
          {animals.map((animal) => (
            <li key={animal.id}>
              <Card className="flex flex-col gap-3 p-3 sm:flex-row">
                {/* Format fixe 160×120, recadrage centré (object-cover) ;
                    sans photo : aplat crème + nom en 600, jamais d'image de
                    remplacement (DESIGN.md). */}
                {animal.photos[0] ? (
                  <Image
                    src={animal.photos[0].url}
                    alt={`Photo de ${animal.name}`}
                    width={160}
                    height={120}
                    className="aspect-[4/3] w-full shrink-0 rounded-md border border-warm-border object-cover sm:aspect-auto sm:h-30 sm:w-40"
                  />
                ) : (
                  <span className="flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-md border border-warm-border bg-cream-ground px-2 text-center font-semibold break-words text-warm-ink sm:aspect-auto sm:h-30 sm:w-40">
                    {animal.name}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-warm-ink">
                      {animal.name}
                    </span>
                    <span className="text-sm text-warm-gray">
                      {TYPE_LABELS[animal.type]}
                    </span>
                    {animal.status === "ADOPTED" ? (
                      <Badge>Adoptat</Badge>
                    ) : (
                      <span className="inline-flex items-center rounded-pill border border-warm-border bg-card-ivory px-3 py-1 text-[13px] text-warm-ink">
                        {STATUS_LABELS[animal.status]}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-warm-gray">
                    mis à jour {relativeTimeFr(animal.updatedAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
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
