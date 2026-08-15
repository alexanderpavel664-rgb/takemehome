import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { STR } from "@/lib/strings";
import { getViewer } from "@/lib/viewer";
import { Card } from "@/components/ui/card";
import { updateAnimal } from "../../actions";
import { AnimalForm } from "../../animal-form";

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
  const animal = await prisma.animal.findFirst({
    where: { id, userId: viewer.id },
    // Le formulaire consomme presque tous les scalaires (valeurs
    // initiales) ; des photos, seule l'URL de la première sert.
    include: {
      photos: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  });
  if (!animal) {
    notFound();
  }

  return (
    // w-full : enfant du body en flex-col, mx-auto seul annulerait
    // l'étirement — la page se tasserait sur la largeur de ses champs.
    <main className="mx-auto w-full max-w-2xl px-4 py-4 md:px-6">
      <h1 className="text-2xl font-semibold text-warm-ink">
        {STR.animalForm.editTitle(animal.name)}
      </h1>
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
