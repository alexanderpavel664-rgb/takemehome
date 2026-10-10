import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { PRIVACY } from "@/lib/legal";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: PRIVACY.metaTitle,
  description: PRIVACY.metaDescription,
  alternates: { canonical: `${SITE_URL}/confidentialitate` },
};

export default function ConfidentialitatePage() {
  return <LegalDocument content={PRIVACY} />;
}
