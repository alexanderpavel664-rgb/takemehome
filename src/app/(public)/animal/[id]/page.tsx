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
import { Card } from "@/components/ui/card";

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

/**
 * Les deux liens de contact — « Appeler », LE seul bouton plein de l'écran,
 * et « Envoyer un email » — construits une seule fois (tel:/mailto/icône)
 * pour la barre fixe mobile ET la carte de la colonne droite desktop.
 */
function ContactActions({
  phone,
  email,
  className = "",
}: {
  phone?: string;
  email?: string;
  className?: string;
}) {
  return (
    <div className={`flex gap-3 ${className}`}>
      {phone && (
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
          Appeler
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className={buttonClasses("outline", "flex-1")}
        >
          Envoyer un email
        </a>
      )}
    </div>
  );
}

/**
 * Section Description — rendue deux fois car sa place change : dans la pile
 * mobile entre le lieu et Santé (position actuelle), sous la photo dans la
 * colonne gauche à partir de lg. La copie inactive est en display:none,
 * donc muette pour les lecteurs d'écran.
 */
function DescriptionSection({
  text,
  className = "",
  textClassName = "",
}: {
  text: string;
  className?: string;
  textClassName?: string;
}) {
  return (
    <section className={`mt-6 ${className}`}>
      <h2 className="text-lg font-semibold text-warm-ink">Description</h2>
      <p
        className={`mt-1 text-base whitespace-pre-line text-warm-ink ${textClassName}`.trim()}
      >
        {text}
      </p>
    </section>
  );
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
  const hasContact = !adopted && Boolean(phone || email);
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
    // pb-28 : réserve la place de la barre de contact fixée en bas — elle
    // n'existe que sous lg, à partir de lg la carte de la colonne droite
    // prend le relais (pb-8 suffit alors).
    <main
      className={`mx-auto max-w-3xl px-4 pt-4 md:px-6 lg:max-w-6xl lg:px-8 lg:pb-8 ${hasContact ? "pb-28" : "pb-4"}`}
    >
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

      {/* Empilée sur mobile ; deux colonnes à partir de lg (DESIGN.md) :
          photo + description à gauche, identité + contact à droite. */}
      <div className="mt-2 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-8">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-warm-border">
            {photo ? (
              <AnimalPhoto
                src={photo.url}
                name={animal.name}
                sizes="(min-width: 1152px) 640px, (min-width: 1024px) 60vw, (min-width: 768px) 720px, 100vw"
                preload
              />
            ) : (
              <PhotoFallback name={animal.name} />
            )}
          </div>

          {animal.description && (
            <DescriptionSection
              text={animal.description}
              className="hidden lg:block"
              textClassName="max-w-[66ch]"
            />
          )}
        </div>

        {/* Colonne droite sticky : la carte de contact reste visible pendant
            le défilement d'une longue description. */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <h1 className="mt-3 flex flex-wrap items-center gap-3 text-[32px]/[1.05] font-semibold text-warm-ink lg:mt-0">
            {animal.name}
            {adopted && <Badge>Adopté</Badge>}
          </h1>
          <p className="mt-1 text-base text-warm-ink">
            {animalMetaLine(animal)}
          </p>
          <p className="text-base text-warm-gray">
            {[animal.city?.trim(), countyName(animal.county)]
              .filter(Boolean)
              .join(", ")}
          </p>

          {adopted && (
            // Fiche adoptée : ce bloc prend la place de la carte de contact.
            <div className="mt-4">
              <p className="text-base text-warm-ink">
                Cet animal a déjà trouvé sa famille.
              </p>
              <ButtonLink href="/animale" variant="outline" className="mt-3">
                Voir les animaux à adopter
              </ButtonLink>
            </div>
          )}

          {hasContact && (
            // Desktop : les mêmes actions dans une carte statique, visibles
            // sans défiler — posées sur l'ivoire opaque, jamais sur la photo
            // (La Règle du Chien Fauve).
            <Card className="mt-4 hidden p-4 lg:block">
              <ContactActions phone={phone} email={email} className="flex-col" />
            </Card>
          )}

          {animal.description && (
            <DescriptionSection
              text={animal.description}
              className="lg:hidden"
            />
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
              S&rsquo;entend bien avec
            </h2>
            <p
              className={`mt-1 text-base ${goodWith.length > 0 ? "text-warm-ink" : "text-warm-gray"}`}
            >
              {goodWith.length > 0 ? goodWith.join(" · ") : "Non renseigné"}
            </p>
          </section>

          <section className="mt-6 text-sm text-warm-gray">
            <p>Publié par {animal.user.name}</p>
            <p>Mise à jour {relativeTimeFr(animal.updatedAt)}</p>
          </section>
        </div>
      </div>

      {hasContact && (
        // Barre d'appel fixée en bas (< lg) : atteignable au pouce, cibles
        // ≥ 44px. Fond crème OPAQUE + hairline haute : le bouton d'appel
        // repose sur le papier, jamais sur la photo (La Règle du Chien
        // Fauve). À partir de lg, la carte de la colonne droite la remplace.
        <div className="fixed inset-x-0 bottom-0 border-t border-warm-border bg-cream-ground p-3 lg:hidden">
          <ContactActions
            phone={phone}
            email={email}
            className="mx-auto max-w-3xl"
          />
        </div>
      )}
    </main>
  );
}
