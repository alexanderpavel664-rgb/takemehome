import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal-document";
import { TERMS } from "@/lib/legal";

export const metadata: Metadata = {
  title: TERMS.metaTitle,
  description: TERMS.metaDescription,
};

export default function TermeniPage() {
  return <LegalDocument content={TERMS} />;
}
