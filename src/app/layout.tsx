import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
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
  title: "TakeMeHome — animale din România care își caută o familie",
  description:
    "Anunțuri de adopție pentru animale salvate în România: fișe clare, filtre utile și contact direct cu persoana care le are în grijă.",
  manifest: "/manifest.webmanifest",
  // Lancement iOS en plein écran, barre d'état sur le papier crème. Le titre
  // est celui qui s'écrit sous l'icône de l'écran d'accueil.
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TakeMeHome",
  },
  // `icons` n'est volontairement pas déclaré ici : icon.png, apple-icon.png
  // et favicon.ico sont pris par la convention de fichiers, qui reste la voie
  // recommandée — les déclarer en double risquerait de les écraser.
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
