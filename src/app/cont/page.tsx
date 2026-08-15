import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, TYPE_LABELS } from "@/lib/animal-labels";
import { countyName } from "@/lib/counties";
import { relativeTimeRo } from "@/lib/relative-time";
import { STR } from "@/lib/strings";
import { AnimalPhoto, PhotoFallback } from "@/components/ui/animal-photo";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { setAnimalStatus } from "./animal/actions";
import { DeleteAnimalButton } from "./animal/delete-animal-button";
import { InstallBanner } from "./install-banner";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: STR.cont.metaTitle,
};

/**
 * L'écran hebdomadaire des publiantes. Deux contenants et une sortie :
 * la carte Profil (ce que les fiches publiques montrent d'elles), la section
 * Mes animaux (leur travail), la déconnexion en bas de page, derrière une
 * hairline. Largeur de lecture centrée : une page de compte se lit, elle
 * ne s'étale pas.
 */
export default async function ContPage({ searchParams }: PageProps<"/cont">) {
  // La vraie vérification de session se fait ici, dans chaque page protégée :
  // le proxy ne fait qu'un contrôle optimiste sur la présence du cookie.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  const { user } = session;

  // Confirmation posée en query par les server actions (création/édition) :
  // toute autre valeur est simplement ignorée.
  const { confirmation } = await searchParams;
  const confirmationMessage =
    confirmation === "creation"
      ? STR.cont.confirmationCreated
      : confirmation === "modification"
        ? STR.cont.confirmationUpdated
        : null;

  // Isolation : uniquement les animaux du compte connecté.
  const animals = await prisma.animal.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { photos: { orderBy: { position: "asc" }, take: 1 } },
  });

  const phone = user.phone?.trim();
  const publicEmail = user.publicEmail?.trim();
  // Le piège silencieux : sans téléphone NI email public, la fiche publique
  // n'affiche aucun bouton de contact — l'animal est injoignable. Un seul
  // des deux suffit à rendre les annonces joignables.
  const unreachable = !phone && !publicEmail;

  // Ce que la carte Profil énumère : exactement ce qui habille les fiches
  // publiques — le nom (« Publié par… ») et les coordonnées de contact.
  const profileRows: { label: string; value?: string }[] = [
    { label: STR.cont.profileName, value: user.name },
    { label: STR.cont.profileAccountEmail, value: user.email },
    { label: STR.cont.profilePhone, value: phone },
    { label: STR.cont.profilePublicEmail, value: publicEmail },
    {
      label: STR.cont.profileCounty,
      value: user.county ? countyName(user.county) : undefined,
    },
  ];

  return (
    // w-full : enfant du body en flex-col, mx-auto seul annulerait
    // l'étirement et la page se tasserait sur son contenu.
    <main className="mx-auto w-full max-w-3xl px-4 py-4 md:px-6">
      {confirmationMessage && (
        <p
          role="status"
          className="mb-4 rounded-md border border-warm-border bg-card-ivory px-4 py-3 text-sm text-warm-ink"
        >
          {confirmationMessage}
        </p>
      )}
      <h1 className="text-2xl font-semibold text-warm-ink">
        {STR.cont.title}
      </h1>

      {/* ——— Profil : ce que les adoptantes voient sur les fiches. ——— */}
      <Card className="mt-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-warm-ink">
            {STR.cont.profileTitle}
          </h2>
          <ButtonLink variant="outline" href="/cont/profil">
            {STR.cont.edit}
          </ButtonLink>
        </div>
        <dl className="mt-3 space-y-1 text-base">
          {profileRows.map(({ label, value }) => (
            <div key={label} className="flex flex-wrap gap-x-2">
              <dt className="text-warm-gray">{label} :</dt>
              <dd className={value ? "text-warm-ink" : "text-warm-gray"}>
                {value || STR.cont.notFilled}
              </dd>
            </div>
          ))}
        </dl>
        {unreachable && (
          // Avertissement, pas erreur de champ, mais le même langage :
          // bordure encre épaissie + message en toutes lettres, jamais la
          // couleur seule (la palette n'a pas de rouge, et n'en veut pas).
          // Le chemin de sortie est le bouton « Modifier » juste au-dessus.
          <p
            role="status"
            className="mt-4 rounded-md border-[1.5px] border-warm-ink bg-cream-ground px-4 py-3 text-sm font-semibold text-warm-ink"
          >
            {STR.cont.unreachableWarning}
          </p>
        )}
      </Card>

      <InstallBanner />

      {/* ——— Mes animaux : le titre et l'action forment l'en-tête. ——— */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-warm-ink">
            {STR.cont.myAnimals}
          </h2>
          {/* Le seul bouton plein de l'écran (La Règle du Bouton Unique). */}
          <ButtonLink variant="primary" href="/cont/animal/nou">
            {STR.cont.addAnimal}
          </ButtonLink>
        </div>
        {animals.length === 0 ? (
          // L'état vide vit dans le contenant des animaux, pas sur le fond.
          // Sans action : le primary « Ajouter un animal » est juste au-dessus.
          <Card className="mt-4">
            <EmptyState
              title={STR.cont.emptyTitle}
              description={STR.cont.emptyDescription}
            />
          </Card>
        ) : (
          <ul className="mt-4 space-y-4">
            {animals.map((animal) => (
              // La cellule est le conteneur : à la largeur de lecture la carte
              // passe en rangée (photo 160×120 à gauche) dès que la place le
              // permet, et s'empile sur mobile — selon SA largeur (@container),
              // pas celle de l'écran.
              <li key={animal.id} className="@container">
                <Card className="flex flex-col gap-3 p-3 @sm:flex-row">
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
                        sizes="(min-width: 768px) 720px, 100vw"
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
                        <Badge>{STR.animal.adoptedBadge}</Badge>
                      ) : (
                        <span className="inline-flex items-center rounded-pill border border-warm-border bg-card-ivory px-3 py-1 text-[13px] text-warm-ink">
                          {STATUS_LABELS[animal.status]}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-warm-gray">
                      {STR.cont.updated(relativeTimeRo(animal.updatedAt))}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {/* La publiante voit son annonce comme un adoptant. */}
                      <ButtonLink variant="ghost" href={`/animal/${animal.id}`}>
                        {STR.cont.seePublicListing}
                      </ButtonLink>
                      <ButtonLink
                        variant="ghost"
                        href={`/cont/animal/${animal.id}/editare`}
                      >
                        {STR.cont.edit}
                      </ButtonLink>
                      <form action={setAnimalStatus}>
                        <input type="hidden" name="id" value={animal.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={
                            animal.status === "AVAILABLE"
                              ? "ADOPTED"
                              : "AVAILABLE"
                          }
                        />
                        <Button variant="ghost" type="submit">
                          {animal.status === "AVAILABLE"
                            ? STR.cont.markAdopted
                            : STR.cont.markAvailable}
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
      </section>

      {/* ——— Déconnexion : une sortie, pas une action — derrière la
          hairline, en bas de page. ——— */}
      <div className="mt-10 border-t border-warm-border pt-4">
        <SignOutButton />
      </div>
    </main>
  );
}
