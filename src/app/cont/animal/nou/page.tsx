import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { STR } from "@/lib/strings";
import { Card } from "@/components/ui/card";
import { createAnimal } from "../actions";
import { AnimalForm } from "../animal-form";

export const metadata: Metadata = {
  title: STR.animalForm.newMetaTitle,
};

export default async function NouAnimalPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  return (
    // w-full : enfant du body en flex-col, mx-auto seul annulerait
    // l'étirement — la page se tasserait sur la largeur de ses champs.
    <main className="mx-auto w-full max-w-2xl px-4 py-4 md:px-6">
      <h1 className="text-2xl font-semibold text-warm-ink">
        {STR.animalForm.newTitle}
      </h1>
      {/* Le formulaire est posé sur l'ivoire : un contenant, pas des champs
          qui flottent sur le papier. Le retour vers /cont passe par le
          bouton « Renunță » du formulaire. */}
      <Card className="mt-4 p-4">
        <AnimalForm
          action={createAnimal}
          userId={session.user.id}
          submitLabel={STR.animalForm.newSubmit}
        />
      </Card>
    </main>
  );
}
