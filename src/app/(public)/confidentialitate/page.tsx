import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { PRIVACY } from "@/lib/legal";

export const metadata: Metadata = {
  title: PRIVACY.metaTitle,
  description: PRIVACY.metaDescription,
};

export default function ConfidentialitatePage() {
  return <LegalDocument content={PRIVACY} />;
}
