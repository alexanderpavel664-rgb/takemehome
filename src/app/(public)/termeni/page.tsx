import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { TERMS } from "@/lib/legal";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: TERMS.metaTitle,
  description: TERMS.metaDescription,
  alternates: { canonical: `${SITE_URL}/termeni` },
};

export default function TermeniPage() {
  return <LegalDocument content={TERMS} />;
}
