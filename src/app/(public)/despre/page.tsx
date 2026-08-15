import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { STR } from "@/lib/strings";

export const metadata: Metadata = {
  title: STR.despre.metaTitle,
  description: STR.despre.metaDescription,
};

/**
 * Page « Despre » minimale : elle existe d'abord pour que le pied de page
 * ne mène nulle part vers une impasse. Contenu strictement factuel, repris
 * de PRODUCT.md — ni témoignage, ni chiffre, ni promesse (rien à fabriquer).
 */
export default function DesprePage() {
  return (
    <main className="mx-auto max-w-3xl p-4 md:px-6 lg:px-8">
      <h1 className="mb-4 text-2xl font-semibold text-warm-ink">
        {STR.despre.title}
      </h1>
      {/* Mesure typographique : 45–75 caractères par ligne (WCAG 1.4.8). */}
      <div className="max-w-[66ch] space-y-4 text-base text-warm-ink">
        <p>{STR.despre.p1}</p>
        <p>{STR.despre.p2}</p>
        <p>
          {STR.despre.p3BeforeLink}
          <Link
            href="/inregistrare"
            className="text-warm-ink underline underline-offset-4"
          >
            {STR.despre.p3Link}
          </Link>
          {STR.despre.p3AfterLink}
        </p>
      </div>
      <ButtonLink variant="outline" href="/animale" className="mt-6">
        {STR.despre.seeAnimals}
      </ButtonLink>
    </main>
  );
}
