import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { STR } from "@/lib/strings";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: STR.auth.register.metaTitle,
  // Rien à chercher ici. Pas bloqué dans robots.txt : Google doit pouvoir
  // lire ce noindex.
  robots: { index: false },
};

// Server Component mince autour du formulaire client : il porte les
// métadonnées (title), qu'un composant client ne peut pas exporter.
export default function InregistrarePage() {
  return (
    <>
      <SiteHeader />
      <RegisterForm />
      <SiteFooter />
    </>
  );
}
