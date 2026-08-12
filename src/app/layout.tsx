import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
