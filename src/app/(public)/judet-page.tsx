import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CARD_SELECT, cardData } from "@/lib/animal-card-data";
import { countyFromSlug, judetPath, judetSlug, type SeoType } from "@/lib/judete";
import { judetCombos } from "@/lib/judete-data";
import { SITE_OG_IMAGE } from "@/lib/og-default";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { STR } from "@/lib/strings";
import { CardGrid } from "./card-grid";
import { JudetLinks } from "./judet-links";

/**
 * Pages par județ (SEO) : /caini-de-adoptat/<județ> et /pisici-de-adoptie/
 * <județ>. Les deux routes ne font qu'appeler ce module avec leur type.
 *
 * Statiques avec révalidation (ISR) — indexables et servies depuis le CDN :
 * chaque route exporte `dynamic = "force-static"` et `revalidate = 600`. Les
 * combinaisons qui ont au moins un animal sont prérendues au build
 * (generateStaticParams) ; une combinaison qui en gagne un ensuite est rendue
 * à sa première visite, puis mise en cache. Une combinaison vide répond 404 —
 * une page sans animal nuirait au référencement —, et cette réponse est elle
 * aussi révalidée : la page apparaît dans les dix minutes qui suivent la
 * première annonce.
 *
 * force-static rend headers() vide pendant le rendu : l'en-tête public y dit
 * toujours « Intră în cont » (layout de (public)).
 */

// Au-delà, le lien « Toate animalele din … » prend le relais : une page
// statique ne pagine pas (pas de searchParams).
const JUDET_MAX = 120;

// Une requête pour generateMetadata + la page (React déduplique).
const getJudet = cache(async (type: SeoType, slug: string) => {
  const county = countyFromSlug(slug);
  if (!county) {
    return null;
  }
  const animals = await prisma.animal.findMany({
    where: { status: "AVAILABLE", hidden: false, type, county: county.code },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: JUDET_MAX,
    select: CARD_SELECT,
  });
  if (animals.length === 0) {
    return null;
  }
  // Des animaux, pas des annonces : une fratrie de 5 en compte 5.
  const total = animals.reduce((sum, animal) => sum + animal.count, 0);
  return { county, animals, total };
});

export async function judetStaticParams(type: SeoType) {
  const combos = await judetCombos();
  return combos
    .filter((combo) => combo.type === type)
    .map((combo) => ({ judet: judetSlug(combo.county) }));
}

export async function judetMetadata(
  type: SeoType,
  slug: string,
): Promise<Metadata> {
  const data = await getJudet(type, slug);
  if (!data) {
    return { title: STR.notFound.title };
  }
  const place = data.county.name;
  const title = STR.judet.title[type](place);
  const description = STR.judet.description[type](data.total, place);
  const url = `${SITE_URL}${judetPath(type, data.county.code)}`;
  return {
    title: `${title} – ${STR.site.name}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: STR.site.name,
      // Un openGraph déclaré ici remplace celui du segment : sans image
      // explicite, le partage n'en aurait aucune.
      images: [SITE_OG_IMAGE],
    },
  };
}

export async function JudetPage({ type, slug }: { type: SeoType; slug: string }) {
  const data = await getJudet(type, slug);
  if (!data) {
    notFound();
  }
  const combos = await judetCombos();
  const place = data.county.name;
  // Une seule lecture de l'horloge pour toute la grille. La page est mise en
  // cache dix minutes : « acum 3 zile » reste juste à dix minutes près.
  const now = new Date();

  return (
    <main className="px-4 py-4 md:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-warm-ink">
        {STR.judet.title[type](place)}
      </h1>
      <p className="mt-1 mb-4 max-w-[66ch] text-base text-warm-gray">
        {STR.judet.description[type](data.total, place)}
      </p>
      <CardGrid cards={data.animals.map((animal) => cardData(animal, now))} />
      <p className="mt-6">
        <Link
          href={`/animale?judet=${data.county.code}`}
          className="inline-flex min-h-11 items-center text-warm-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
        >
          {STR.judet.seeAllCounty(place)}
        </Link>
      </p>
      <JudetLinks
        combos={combos}
        current={judetPath(type, data.county.code)}
      />
    </main>
  );
}
