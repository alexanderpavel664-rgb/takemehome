import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { animalDisplayName } from "@/lib/animal-display";
import { countySlug } from "@/lib/judete";
import { kitAnimal } from "@/lib/kit-data";
import { kitText } from "@/lib/share-kit";
import { SITE_URL } from "@/lib/site";
import { STR } from "@/lib/strings";
import { getViewer } from "@/lib/viewer";
import { ButtonLink } from "@/components/ui/button";
import { KitPanel } from "./kit-panel";

export const metadata: Metadata = { title: STR.kit.metaTitle };

/**
 * Le kit de partage : de quoi poster un animal dans le groupe d'adoption de sa
 * ville en une minute. Le texte d'abord, l'image ensuite : sur téléphone,
 * Facebook ignore le texte transmis avec une image partagée.
 */
export default async function KitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) {
    redirect("/login");
  }
  const { id } = await params;
  const animal = await kitAnimal(viewer, id);
  if (!animal) {
    notFound();
  }
  const name = animalDisplayName(animal);

  return (
    // w-full : même raison que /cont/animal/nou.
    <main className="mx-auto w-full max-w-2xl px-4 py-4 md:px-6">
      <h1 className="text-2xl font-semibold text-warm-ink">
        {STR.kit.title(name)}
      </h1>
      <p className="mt-1 max-w-[66ch] text-base text-warm-ink">
        {STR.kit.intro}
      </p>
      <KitPanel
        id={animal.id}
        name={name}
        fileName={`takemehome-${countySlug(name) || "animal"}`}
        photos={animal.photos.map((photo) => photo.url)}
        initialText={kitText(animal, `${SITE_URL}/animal/${animal.id}`)}
        editHref={`/cont/animal/${animal.id}/editare`}
      />
      <ButtonLink variant="ghost" href="/cont" className="mt-4">
        {STR.kit.back}
      </ButtonLink>
    </main>
  );
}
