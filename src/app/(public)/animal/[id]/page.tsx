import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { animalMetaLine } from "@/lib/animal-display";
import { countyName } from "@/lib/counties";
import { prisma } from "@/lib/prisma";
import { relativeTimeFr } from "@/lib/relative-time";
import { SITE_URL } from "@/lib/site";
import { AnimalPhoto, PhotoPlaceholder } from "../../animal-image";

// Sans API de requête, une route à segment dynamique serait rendue puis
// mise en cache : statut « adopté », photos et coordonnées resteraient
// périmés. On force le rendu à chaque requête.
export const dynamic = "force-dynamic";

// Une seule requête pour generateMetadata + la page (React déduplique).
const getAnimal = cache(async (id: string) =>
  prisma.animal.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { position: "asc" }, take: 1 },
      user: { select: { name: true, phone: true, publicEmail: true } },
    },
  }),
);

// Partage Facebook : og:title, og:description, og:image, og:type, og:url.
// Les URL sont absolues (photos Vercel Blob + SITE_URL), donc pas besoin
// de metadataBase.
export async function generateMetadata(
  props: PageProps<"/animal/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const animal = await getAnimal(id);
  if (!animal) {
    return { title: "Animal introuvable – TakeMeHome" };
  }

  const place = animal.city?.trim() || countyName(animal.county);
  const title = `${animal.name} – ${place}`;
  const description =
    animal.description?.replace(/\s+/g, " ").trim().slice(0, 160) ||
    `${animal.name} attend une famille. ${animalMetaLine(animal)}.`;
  const photo = animal.photos[0];

  return {
    title: `${title} – TakeMeHome`,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${SITE_URL}/animal/${animal.id}`,
      siteName: "TakeMeHome",
      ...(photo && {
        images: [{ url: photo.url, alt: `Photo de ${animal.name}` }],
      }),
    },
  };
}

export default async function AnimalPage(props: PageProps<"/animal/[id]">) {
  const { id } = await props.params;
  const animal = await getAnimal(id);
  if (!animal) {
    notFound();
  }

  const adopted = animal.status === "ADOPTED";
  const phone = animal.user.phone?.trim();
  const email = animal.user.publicEmail?.trim();
  const hasContactBar = !adopted && Boolean(phone || email);
  const photo = animal.photos[0];

  const health = [
    animal.sterilized && "Stérilisé",
    animal.vaccinated && "Vacciné",
    animal.microchipped && "Pucé",
  ].filter(Boolean) as string[];
  const goodWith = [
    animal.goodWithKids && "les enfants",
    animal.goodWithDogs && "les chiens",
    animal.goodWithCats && "les chats",
  ].filter(Boolean) as string[];

  return (
    // pb-28 : réserve la place de la barre de contact fixée en bas.
    <main className={`mx-auto max-w-3xl p-4 ${hasContactBar ? "pb-28" : ""}`}>
      <div className="relative aspect-[4/3] overflow-hidden border">
        {photo ? (
          <AnimalPhoto
            src={photo.url}
            name={animal.name}
            sizes="(min-width: 768px) 736px, 100vw"
            preload
          />
        ) : (
          <PhotoPlaceholder name={animal.name} />
        )}
      </div>

      <h1 className="mt-3 flex flex-wrap items-center gap-3 text-2xl font-bold">
        {animal.name}
        {adopted && (
          <span className="rounded-full border-2 px-3 py-1 text-sm">
            Adoptat
          </span>
        )}
      </h1>
      <p className="mt-1">{animalMetaLine(animal)}</p>
      <p className="text-gray-600">
        {[animal.city?.trim(), countyName(animal.county)]
          .filter(Boolean)
          .join(", ")}
      </p>

      {adopted && (
        <p className="mt-4">
          Cet animal a déjà trouvé sa famille.{" "}
          <Link href="/animale" className="underline">
            Voir les animaux à adopter
          </Link>
        </p>
      )}

      {animal.description && (
        <section className="mt-6">
          <h2 className="font-bold">Description</h2>
          <p className="mt-1 whitespace-pre-line">{animal.description}</p>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-bold">Santé</h2>
        {/* false en base = non renseigné : on n'affiche que les certitudes. */}
        <p className="mt-1">
          {health.length > 0 ? health.join(" · ") : "Non renseigné"}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-bold">S-a înțeles bine cu</h2>
        <p className="mt-1">
          {goodWith.length > 0 ? goodWith.join(" · ") : "Non renseigné"}
        </p>
      </section>

      <section className="mt-6 text-sm text-gray-600">
        <p>Refuge : {animal.user.name}</p>
        <p>Mise à jour {relativeTimeFr(animal.updatedAt)}</p>
      </section>

      {hasContactBar && (
        // Barre d'appel fixée en bas : atteignable au pouce, cibles ≥ 44px.
        <div className="fixed inset-x-0 bottom-0 border-t bg-white p-3 text-black">
          <div className="mx-auto flex max-w-3xl gap-3">
            {phone && (
              <a
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                className="flex min-h-12 flex-1 items-center justify-center border-2 border-current px-4 font-bold"
              >
                Sună
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex min-h-12 flex-1 items-center justify-center border px-4"
              >
                Trimite email
              </a>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
