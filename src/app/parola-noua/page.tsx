import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { STR } from "@/lib/strings";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: STR.auth.resetPassword.metaTitle,
  // Rien à chercher ici. Pas bloqué dans robots.txt : Google doit pouvoir
  // lire ce noindex.
  robots: { index: false },
};

/**
 * Atterrissage du lien de l'email, après le détour par
 * /api/auth/reset-password/<jeton> qui renvoie ici avec ?token= (valide)
 * ou ?error=INVALID_TOKEN (inconnu ou expiré).
 *
 * Le jeton est revérifié ici, même quand better-auth vient de le juger
 * bon : la page peut être rechargée après usage (le jeton est consommé à
 * la pose du mot de passe) ou rouverte depuis l'historique une heure plus
 * tard. Dans ces cas-là, le formulaire ne s'affiche pas — on ne fait pas
 * taper deux fois un mot de passe pour annoncer ensuite que le lien est
 * mort. Une lecture indexée (identifier), sans écriture.
 */
export default async function ParolaNouaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token } = await searchParams;
  const valid = token ? await isResetTokenValid(token) : false;

  return (
    <>
      <SiteHeader />
      <main className="px-4 pt-10 pb-10 md:px-6 md:pt-16 lg:px-8">
        <Card className="mx-auto w-full max-w-md p-6">
          {valid && token ? (
            <>
              <h1 className="text-2xl font-semibold text-warm-ink">
                {STR.auth.resetPassword.title}
              </h1>
              <ResetPasswordForm token={token} />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-warm-ink">
                {STR.auth.resetPassword.invalidTitle}
              </h1>
              <p className="mt-4 max-w-[60ch] text-base text-warm-ink">
                {STR.auth.resetPassword.invalidDescription}
              </p>
              {/* Le seul geste utile : redemander. Bouton plein, comme
                  le « Vezi animalele » de la 404. */}
              <ButtonLink
                variant="primary"
                href="/parola-uitata"
                className="mt-6 w-full"
              >
                {STR.auth.resetPassword.requestAgain}
              </ButtonLink>
            </>
          )}
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}

async function isResetTokenValid(token: string): Promise<boolean> {
  const verification = await prisma.verification.findFirst({
    where: { identifier: `reset-password:${token}` },
    select: { expiresAt: true },
  });
  return Boolean(verification && verification.expiresAt > new Date());
}
