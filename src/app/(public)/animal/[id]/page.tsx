import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { animalMetaLine } from "@/lib/animal-display";
import { countyName } from "@/lib/counties";
import { prisma } from "@/lib/prisma";
import { relativeTimeFr } from "@/lib/relative-time";
import { SITE_URL } from "@/lib/site";
import { AnimalPhoto, PhotoFallback } from "@/components/ui/animal-photo";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonClasses } from "@/components/ui/button";

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
      {/* Entrée principale depuis Facebook : chemin évident vers la liste,
          en encre — jamais terracotta (La Règle Terracotta). */}
      <p>
        <Link
          href="/animale"
          className="inline-flex min-h-11 items-center text-warm-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
        >
          ← Tous les animaux
        </Link>
      </p>

      <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-md border border-warm-border">
        {photo ? (
          <AnimalPhoto
            src={photo.url}
            name={animal.name}
            sizes="(min-width: 768px) 736px, 100vw"
            preload
          />
        ) : (
          <PhotoFallback name={animal.name} />
        )}
      </div>

      <h1 className="mt-3 flex flex-wrap items-center gap-3 text-[32px]/[1.05] font-semibold text-warm-ink">
        {animal.name}
        {adopted && <Badge>Adoptat</Badge>}
      </h1>
      <p className="mt-1 text-base text-warm-ink">{animalMetaLine(animal)}</p>
      <p className="text-base text-warm-gray">
        {[animal.city?.trim(), countyName(animal.county)]
          .filter(Boolean)
          .join(", ")}
      </p>

      {adopted && (
        <div className="mt-4">
          <p className="text-base text-warm-ink">
            Cet animal a déjà trouvé sa famille.
          </p>
          <ButtonLink href="/animale" variant="outline" className="mt-3">
            Voir les animaux à adopter
          </ButtonLink>
        </div>
      )}

      {animal.description && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-warm-ink">Description</h2>
          <p className="mt-1 text-base whitespace-pre-line text-warm-ink">
            {animal.description}
          </p>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-warm-ink">Santé</h2>
        {/* false en base = non renseigné : on n'affiche que les certitudes. */}
        <p
          className={`mt-1 text-base ${health.length > 0 ? "text-warm-ink" : "text-warm-gray"}`}
        >
          {health.length > 0 ? health.join(" · ") : "Non renseigné"}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold text-warm-ink">
          S-a înțeles bine cu
        </h2>
        <p
          className={`mt-1 text-base ${goodWith.length > 0 ? "text-warm-ink" : "text-warm-gray"}`}
        >
          {goodWith.length > 0 ? goodWith.join(" · ") : "Non renseigné"}
        </p>
      </section>

      <section className="mt-6 text-sm text-warm-gray">
        <p>Refuge : {animal.user.name}</p>
        <p>Mise à jour {relativeTimeFr(animal.updatedAt)}</p>
      </section>

      {hasContactBar && (
        // Barre d'appel fixée en bas : atteignable au pouce, cibles ≥ 44px.
        // Fond crème OPAQUE + hairline haute : le bouton d'appel repose sur
        // le papier, jamais sur la photo (La Règle du Chien Fauve).
        <div className="fixed inset-x-0 bottom-0 border-t border-warm-border bg-cream-ground p-3">
          <div className="mx-auto flex max-w-3xl gap-3">
            {phone && (
              // « Sună » : LE seul bouton plein de l'écran.
              <a
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                className={buttonClasses("primary", "flex-1")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="size-5"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Sună
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className={buttonClasses("outline", "flex-1")}
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
