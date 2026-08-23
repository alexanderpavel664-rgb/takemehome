// URL publique canonique — les métadonnées Open Graph exigent des URL
// absolues et Next 16 n'a plus de metadataBase implicite. À surcharger via
// NEXT_PUBLIC_SITE_URL quand takemehome.ro sera acheté.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://takemehome-hazel.vercel.app";

// L'adresse de contact du site — la même partout : documents juridiques
// (lib/legal.ts), compte suspendu, annonce masquée. Une seule source : le
// jour où elle change, elle change d'un coup, y compris dans les messages
// qui disent « scrie la … » à quelqu'un qui ne peut plus rien faire d'autre.
// C'est aussi l'adresse RGPD (art. 13) de l'opérateur, Kotech Engineering
// (voir OPERATOR dans lib/legal.ts) : elle doit rester lue par quelqu'un
// qui peut répondre à une demande d'accès ou d'effacement sous un mois.
export const CONTACT_EMAIL = "contact@kotech.ai";
