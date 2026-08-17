import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import { STR } from "@/lib/strings";
import "./globals.css";

// Une seule famille variable, un seul import (La Règle de la Police Unique) :
// les graisses 400 et 600 sortent de l'axe wght du même fichier, jamais d'un
// second import. latin-ext est requis pour ș/ț à virgule souscrite.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-jakarta",
  fallback: ["system-ui"],
});

export const metadata: Metadata = {
  title: STR.meta.rootTitle,
  description: STR.meta.rootDescription,
  manifest: "/manifest.webmanifest",
  // Lancement iOS en plein écran, barre d'état sur le papier crème. Le titre
  // est celui qui s'écrit sous l'icône de l'écran d'accueil.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: STR.site.name,
  },
  // `icons` reste volontairement absent, et ce n'est PAS un oubli : dans
  // Next 16.3, la fusion des icônes de fichiers est imbriquée dans un
  // `if (!resolvedMetadata.icons)` (resolve-metadata.js). Déclarer ne
  // serait-ce qu'une icône ici fait donc disparaître icon.png ET le
  // <link rel="apple-touch-icon"> d'apple-icon.png — c'est-à-dire l'icône de
  // l'écran d'accueil iOS. Vérifié : avec un bloc `icons`, le <head> ne sort
  // plus que favicon.ico ; sans lui, les trois balises sont là.
  //
  // La convention de fichiers suffit et se maintient toute seule :
  //   favicon.ico    -> <link rel="icon" sizes="48x48" type="image/x-icon">
  //   icon.png       -> <link rel="icon" sizes="512x512">
  //   apple-icon.png -> <link rel="apple-touch-icon" sizes="180x180">
  // Elle ajoute en prime un hachage de contenu dans l'URL : quand le fichier
  // change, l'URL change, et les navigateurs vont rechercher l'icône.
};

// Couleur de la barre système : le même crème que le papier, jamais de blanc
// ni de sombre. Pas de mode sombre en V1, donc une seule valeur.
export const viewport: Viewport = {
  themeColor: "#F7F3EA",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Enregistre /serwist/sw.js (périmètre : la racine). Désactivé en
            développement : un worker qui survit aux recompilations donnerait
            de faux résultats en local. */}
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV === "development"}
        >
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
