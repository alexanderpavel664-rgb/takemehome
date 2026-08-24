import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { STR } from "@/lib/strings";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: STR.auth.forgotPassword.metaTitle,
};

// Server Component mince autour du formulaire client (métadonnées), comme
// /login et /inregistrare.
export default function ParolaUitataPage() {
  return (
    <>
      <SiteHeader />
      <ForgotPasswordForm />
      <SiteFooter />
    </>
  );
}
