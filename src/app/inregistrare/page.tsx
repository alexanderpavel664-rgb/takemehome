import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { STR } from "@/lib/strings";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: STR.auth.register.metaTitle,
};

// Server Component mince autour du formulaire client : il porte les
// métadonnées (title), qu'un composant client ne peut pas exporter.
export default function InregistrarePage() {
  return (
    <>
      <SiteHeader />
      <RegisterForm />
    </>
  );
}
