// URL publique canonique — les métadonnées Open Graph exigent des URL
// absolues et Next 16 n'a plus de metadataBase implicite. À surcharger via
// NEXT_PUBLIC_SITE_URL quand takemehome.ro sera acheté.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://takemehome-hazel.vercel.app";
