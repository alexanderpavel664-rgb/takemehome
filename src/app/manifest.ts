import type { MetadataRoute } from "next";

/**
 * Manifeste de l'application installée, servi sur /manifest.webmanifest.
 *
 * `start_url` pointe sur /animale, pas sur / : l'application lancée depuis
 * l'écran d'accueil ouvre le vrai produit — la liste des animaux — et non la
 * page de présentation.
 *
 * Les deux couleurs sont le crème du papier (#F7F3EA) : la barre système au
 * lancement et l'écran de démarrage Android sont du même papier que le site,
 * jamais du blanc ni du sombre (DESIGN.md — le monde est le papier crème).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TakeMeHome",
    short_name: "TakeMeHome",
    description:
      "Anunțuri de adopție pentru animale salvate în România: fișe clare, filtre utile și contact direct cu persoana care le are în grijă.",
    lang: "ro",
    dir: "ltr",
    start_url: "/animale",
    // Le périmètre reste la racine : depuis /animale, l'application peut
    // ouvrir une fiche ou l'espace compte sans repasser par le navigateur.
    scope: "/",
    display: "standalone",
    background_color: "#F7F3EA",
    theme_color: "#F7F3EA",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Maskable : la patte n'occupe que 50 % du carré, elle survit donc au
      // recadrage en cercle, en goutte ou en squircle selon le lanceur.
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
