import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { STR } from "@/lib/strings";
import { getSession } from "@/lib/viewer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { AcceptTermsForm } from "./accept-terms-form";

export const metadata: Metadata = {
  title: STR.auth.acceptTerms.metaTitle,
};

/**
 * La porte des comptes sans acceptation enregistrée. Le layout de /cont y
 * renvoie tant que termsAcceptedAt est NULL ; l'action renvoie vers /cont
 * une fois la case cochée. Hors de /cont, donc hors du matcher du proxy :
 * la session est vérifiée ici même.
 */
export default async function AcceptaTermeniiPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.user.termsAcceptedAt) {
    redirect("/cont");
  }

  return (
    <>
      <SiteHeader />
      <main className="px-4 pt-10 pb-10 md:px-6 md:pt-16 lg:px-8">
        <Card className="mx-auto w-full max-w-md p-6">
          <h1 className="text-2xl font-semibold text-warm-ink">
            {STR.auth.acceptTerms.title}
          </h1>
          <p className="mt-2 max-w-[60ch] text-base text-warm-gray">
            {STR.auth.acceptTerms.intro}
          </p>
          <AcceptTermsForm />
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
