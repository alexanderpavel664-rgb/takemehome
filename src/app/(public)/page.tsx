import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { animalMetaLine } from "@/lib/animal-display";
import { countyName } from "@/lib/counties";
import { SITE_URL } from "@/lib/site";
import { STR } from "@/lib/strings";
import { Logo } from "@/components/logo";
import { AnimalCard } from "@/components/ui/animal-card";
import { ButtonLink } from "@/components/ui/button";
import { GRID_CLASSES } from "./animal-grid";
import { SkeletonGrid } from "./skeleton-grid";

/** La phrase qui dit ce que c'est — descriptive, pas un slogan. */
const TAGLINE = STR.home.tagline;

export const metadata: Metadata = {
  title: STR.home.metaTitle,
  description: `${TAGLINE} ${STR.home.metaDescriptionSuffix}`,
  openGraph: {
    title: STR.site.name,
    description: TAGLINE,
    type: "website",
    url: SITE_URL,
    siteName: STR.site.name,
  },
};

// Les fiches récentes sont la preuve que la plateforme vit : jamais de
// pré-rendu statique figé au build.
export const dynamic = "force-dynamic";

const RECENT_COUNT = 6;

const STEPS = STR.home.steps;

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8">
      {/* C'est quoi : le logo, une phrase, deux chemins — le tout tient sans
          défiler sur mobile. Le seul bouton plein va vers /animale, le
          parcours de 95 % des visiteurs (La Règle du Bouton Unique). */}
      <section className="pt-10 pb-8 text-center md:pt-16 md:pb-12">
        {/* Taille Display (32 px) — la plus grande marche de l'échelle
            DESIGN.md ; le logo du héros ne s'en invente pas une. */}
        <h1>
          <Logo size="text-[32px]" />
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-warm-ink md:text-lg">
          {TAGLINE}
        </p>
        <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <ButtonLink href="/animale" variant="primary">
            {STR.home.adoptCta}
          </ButtonLink>
          <ButtonLink href="/inregistrare" variant="outline">
            {STR.home.giveCta}
          </ButtonLink>
        </div>
      </section>

      {/* Comment ça marche : trois étapes, une ligne chacune — jamais de
          paragraphe. En ligne dès md : cherches → trouves → appelles. */}
      <section className="pb-10 text-center md:pb-14">
        <h2 className="text-xl font-semibold text-warm-ink">
          {STR.home.howItWorks}
        </h2>
        <ol className="mt-3 flex flex-col items-center gap-2 md:flex-row md:justify-center md:gap-8">
          {STEPS.map((step, i) => (
            <li key={step} className="text-base text-warm-ink">
              <span className="font-semibold">{i + 1}.</span> {step}
            </li>
          ))}
        </ol>
      </section>

      <Suspense
        fallback={
          <RecentSection>
            <SkeletonGrid count={RECENT_COUNT} />
          </RecentSection>
        }
      >
        <RecentAnimals />
      </Suspense>
    </main>
  );
}

/**
 * Coquille commune aux squelettes et au contenu réel — même titre, même
 * grille, même lien de sortie : le flux remplace les cartes sans saut.
 */
function RecentSection({ children }: { children: ReactNode }) {
  return (
    <section className="pb-12 md:pb-16">
      <h2 className="mb-4 text-xl font-semibold text-warm-ink">
        {STR.home.theyWait}
      </h2>
      {children}
      <p className="mt-4 text-center">
        <Link
          href="/animale"
          className="inline-flex min-h-11 items-center text-warm-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
        >
          {STR.home.seeAll}
        </Link>
      </p>
    </section>
  );
}

/**
 * La preuve : de vraies fiches récentes — elles convainquent mieux que
 * n'importe quel texte. Base vide : la section disparaît entièrement, la
 * page reste cohérente sans elle (les squelettes du fallback s'effacent
 * alors — cas rare et bref).
 */
async function RecentAnimals() {
  const animals = await prisma.animal.findMany({
    where: { status: "AVAILABLE" },
    // Même tri stable que la grille publique : updatedAt décroissant,
    // id en départage des ex æquo.
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: RECENT_COUNT,
    include: { photos: { orderBy: { position: "asc" }, take: 1 } },
  });

  if (animals.length === 0) {
    return null;
  }

  return (
    <RecentSection>
      <ul className={GRID_CLASSES}>
        {animals.map((animal) => (
          <li key={animal.id}>
            <AnimalCard
              href={`/animal/${animal.id}`}
              name={animal.name}
              meta={animalMetaLine(animal)}
              county={countyName(animal.county)}
              photoUrl={animal.photos[0]?.url}
            />
          </li>
        ))}
      </ul>
    </RecentSection>
  );
}
