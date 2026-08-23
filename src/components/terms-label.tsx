import Link from "next/link";
import { STR } from "@/lib/strings";

const linkClasses =
  "underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink";

/**
 * Le libellé de la case d'acceptation des conditions — sur /inregistrare et
 * sur /accepta-termenii, le même mot pour mot : c'est ce texte qu'on
 * pourra produire le jour où il faudra prouver ce qui a été accepté.
 *
 * Les deux liens mènent aux documents qu'ils nomment, dans un autre onglet :
 * on ne perd pas un formulaire à moitié rempli pour aller lire. Un lien
 * dans un <label> ne coche pas la case au clic — le navigateur réserve
 * l'activation du label aux clics hors contenu interactif.
 */
export function TermsLabel() {
  return (
    <>
      {STR.auth.register.termsBefore}
      <Link
        href="/termeni"
        target="_blank"
        rel="noopener"
        className={linkClasses}
      >
        {STR.auth.register.termsLink}
      </Link>
      {STR.auth.register.termsAnd}
      <Link
        href="/confidentialitate"
        target="_blank"
        rel="noopener"
        className={linkClasses}
      >
        {STR.auth.register.privacyLink}
      </Link>
      {STR.auth.register.termsAfter}
    </>
  );
}
