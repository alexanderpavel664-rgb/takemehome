import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { contactStatus } from "@/lib/contact-status";
import { prisma } from "@/lib/prisma";
import { STR } from "@/lib/strings";
import { getViewer } from "@/lib/viewer";
import { Card } from "@/components/ui/card";
import { createAnimal } from "../actions";
import { AnimalForm } from "../animal-form";
import { ContactWarning } from "../../contact-warning";

export const metadata: Metadata = {
  title: STR.animalForm.newMetaTitle,
};

export default async function NouAnimalPage() {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/login");
  }
  // Compte suspendu : plutôt qu'un formulaire qui refusera à la
  // soumission, le renvoi vers /cont — c'est là que l'explication vit.
  if (viewer.suspended) {
    redirect("/cont");
  }

  // Le contact se relit en base, pas dans la session : la session est
  // rafraîchie par le client après la sauvegarde du profil, mais la base est
  // la seule source que la fiche publique consulte — et c'est ce qu'elle
  // affichera qu'on annonce ici.
  const account = await prisma.user.findUnique({
    where: { id: viewer.id },
    select: { phone: true, publicEmail: true, contactConsent: true },
  });
  const contact = contactStatus(account ?? {});

  return (
    // w-full : enfant du body en flex-col, mx-auto seul annulerait
    // l'étirement — la page se tasserait sur la largeur de ses champs.
    <main className="mx-auto w-full max-w-2xl px-4 py-4 md:px-6">
      <h1 className="text-2xl font-semibold text-warm-ink">
        {STR.animalForm.newTitle}
      </h1>
      {/* Profil incomplet : l'avertissement AVANT le formulaire, avec le
          lien vers le profil. Prévenir, pas bloquer : la publication reste
          possible, quitte à compléter après. */}
      <ContactWarning status={contact} className="mt-4" />
      {/* Le formulaire est posé sur l'ivoire : un contenant, pas des champs
          qui flottent sur le papier. Le retour vers /cont passe par le
          bouton « Renunță » du formulaire. */}
      <Card className="mt-4 p-4">
        <AnimalForm
          action={createAnimal}
          userId={viewer.id}
          submitLabel={STR.animalForm.newSubmit}
        />
      </Card>
    </main>
  );
}
