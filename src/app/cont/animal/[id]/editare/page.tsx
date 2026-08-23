import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { contactStatus } from "@/lib/contact-status";
import { prisma } from "@/lib/prisma";
import { STR } from "@/lib/strings";
import { getViewer } from "@/lib/viewer";
import { Card } from "@/components/ui/card";
import { updateAnimal } from "../../actions";
import { AnimalForm } from "../../animal-form";
import { ContactWarning } from "../../../contact-warning";

export const metadata: Metadata = {
  title: STR.animalForm.editMetaTitle,
};

export default async function EditareAnimalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/login");
  }
  // Compte suspendu : plutôt qu'un formulaire qui refusera à la
  // soumission, le renvoi vers /cont — c'est là que l'explication vit.
  if (viewer.suspended) {
    redirect("/cont");
  }

  const { id } = await params;

  // Isolation : findFirst({ id, userId }) — l'animal d'un autre refuge est
  // indistinguable d'un animal inexistant → 404, jamais 403 (un 403
  // confirmerait que l'animal existe). Un ADMIN n'a pas de passe-droit ici :
  // la modération masque une annonce, elle ne la réécrit pas.
  //
  // Le contact se relit en base, en parallèle, comme sur /cont/animal/nou :
  // la base est la seule source que la fiche publique consulte, et c'est
  // ce qu'elle affichera qu'on annonce ici.
  const [animal, account] = await Promise.all([
    prisma.animal.findFirst({
      where: { id, userId: viewer.id },
      // Le formulaire consomme presque tous les scalaires (valeurs
      // initiales) ; des photos, seule l'URL de la première sert.
      include: {
        photos: {
          orderBy: { position: "asc" },
          take: 1,
          select: { url: true },
        },
      },
    }),
    prisma.user.findUnique({
      where: { id: viewer.id },
      select: { phone: true, publicEmail: true, contactConsent: true },
    }),
  ]);
  if (!animal) {
    notFound();
  }
  const contact = contactStatus(account ?? {});

  return (
    // w-full : enfant du body en flex-col, mx-auto seul annulerait
    // l'étirement — la page se tasserait sur la largeur de ses champs.
    <main className="mx-auto w-full max-w-2xl px-4 py-4 md:px-6">
      <h1 className="text-2xl font-semibold text-warm-ink">
        {STR.animalForm.editTitle(animal.name)}
      </h1>
      {/* Profil incomplet : le même avertissement qu'à la création, AVANT le
          formulaire — c'est ici aussi qu'on fait la chose qui va échouer.
          La sauvegarde reste possible. */}
      <ContactWarning status={contact} className="mt-4" />
      {/* Le formulaire est posé sur l'ivoire : un contenant, pas des champs
          qui flottent sur le papier. */}
      <Card className="mt-4 p-4">
        <AnimalForm
          action={updateAnimal}
          animalId={animal.id}
          userId={viewer.id}
          initialPhotoUrl={animal.photos[0]?.url}
          submitLabel={STR.animalForm.editSubmit}
          initial={{
            name: animal.name,
            type: animal.type,
            sex: animal.sex ?? "",
            ageGroup: animal.ageGroup ?? "",
            ageText: animal.ageText ?? "",
            size: animal.size ?? "",
            county: animal.county,
            city: animal.city ?? "",
            description: animal.description ?? "",
            sterilized: animal.sterilized,
            vaccinated: animal.vaccinated,
            microchipped: animal.microchipped,
            goodWithKids: animal.goodWithKids,
            goodWithDogs: animal.goodWithDogs,
            goodWithCats: animal.goodWithCats,
            status: animal.status,
          }}
        />
      </Card>
    </main>
  );
}
