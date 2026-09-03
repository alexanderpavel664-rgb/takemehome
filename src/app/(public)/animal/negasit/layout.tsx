import type { Metadata } from "next";
import type { ReactNode } from "react";
import { STR } from "@/lib/strings";

// Le titre du 404 d'une fiche (« Animalul nu a fost găsit – TakeMeHome »).
// Il vit dans un layout et non dans page.tsx : quand la page lance
// notFound(), ses propres métadonnées ne sont pas lues, celles du layout
// qui l'enveloppe le sont — avec le not-found.tsx de ce même segment.
export const metadata: Metadata = {
  title: STR.animal.notFoundMetaTitle,
};

export default function AnimalNegasitLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
