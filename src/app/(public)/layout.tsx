import type { ReactNode } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { getSessionCookie } from "better-auth/cookies";
import { SiteHeader } from "@/components/site-header";
import { FooterLink, SiteFooter } from "@/components/site-footer";
import { STR } from "@/lib/strings";

/**
 * Coquille des pages publiques : l'en-tête commun (logo → /animale) avec
 * l'accès au compte à droite, et le pied de page discret vers les pages
 * secondaires. 99 % des visiteurs sont des adoptants qui ne créeront jamais
 * de compte : l'accès au compte est un lien gris chaud, jamais un bouton —
 * le bouton plein est réservé à l'appel (La Règle du Bouton Unique).
 */
export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Même contrôle optimiste que le proxy : la simple présence du cookie de
  // session, sans appel en base — il ne s'agit que du libellé du lien, la
  // vraie vérification reste dans les pages /cont. Un cookie périmé mène à
  // « Mon compte », qui redirige vers /login : rien ne fuit.
  const connected = Boolean(getSessionCookie(await headers()));

  return (
    <>
      <SiteHeader>
        <Link
          href={connected ? "/cont" : "/login"}
          className="flex min-h-11 items-center rounded-md px-2 text-sm text-warm-gray focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
        >
          {connected ? STR.header.myAccount : STR.header.signIn}
        </Link>
      </SiteHeader>
      {children}
      {/* Les deux liens propres aux pages publiques passent avant les liens
          juridiques, que SiteFooter ajoute partout. */}
      <SiteFooter>
        <FooterLink href="/adoptati">{STR.footer.adopted}</FooterLink>
        <FooterLink href="/despre">{STR.footer.about}</FooterLink>
      </SiteFooter>
    </>
  );
}
