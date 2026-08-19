import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { STR } from "@/lib/strings";

/**
 * Carte de partage par défaut — celle que voient Facebook et WhatsApp quand on
 * partage le site plutôt qu'un animal précis. Le dessin est ici, les routes
 * qui l'exposent sont les fichiers `opengraph-image.tsx` qui l'importent.
 *
 * Il y en a DEUX, et ce n'est pas une redondance :
 *   app/opengraph-image.tsx          -> /login, /inregistrare, /cont, /admin
 *   app/(public)/opengraph-image.tsx -> /, /despre, /adoptati, /animale,
 *                                       /confidentialitate, /termeni
 * Celui de (public) est indispensable : la page d'accueil déclare son propre
 * `openGraph`, et dans mergeMetadata un openGraph de configuration REMPLACE
 * celui dont on hérite — l'image de la racine était donc perdue sur l'accueil,
 * précisément la page qu'on partage. Une image de fichier n'est réappliquée
 * que dans le segment où elle se trouve, et seulement si ce niveau ne déclare
 * pas déjà `openGraph.images`. Vérifié route par route.
 *
 * Cette dernière règle est aussi ce qui protège les fiches /animal/[id] :
 * elles déclarent `openGraph.images` avec la photo de l'animal, donc la carte
 * ne s'y substitue jamais. C'est la photo qui fait cliquer.
 *
 * Le dessin est le lockup du site, aux mêmes proportions mesurées que
 * components/logo.tsx (patte = 0,595 em, écart = 0,227 em, patte descendue de
 * 0,015 em sous la ligne de base). Rien d'autre : pas de dégradé, pas de
 * décor, pas de photo.
 */

export const OG_ALT = `${STR.site.name} – ${STR.home.tagline}`;
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

/** Corps du mot ; toute la géométrie du lockup en découle, comme sur le site. */
const WORD = 112;
/** Ratio natif de la patte (1681,6969 × 1728,9692) — elle est un peu haute. */
const PAW_RATIO = 1681.6969 / 1728.9692;
const PAW_HEIGHT = WORD * 0.595;
/**
 * Satori n'aligne pas les images sur la ligne de base du texte comme le fait
 * un navigateur : il pose le bas de l'image sur la ligne des jambages. Il faut
 * donc la remonter de la profondeur de descente de la police — 222/1000 em,
 * lu dans les tables hhea et OS/2 de PlusJakartaSans-SemiBold — pour retrouver
 * l'alignement de components/logo.tsx. Mesuré sur le PNG rendu : sans cette
 * correction la patte tombe 24 px trop bas à WORD = 112.
 */
const PAW_BASELINE_FIX = (0.015 - 0.222) * WORD;

// Lus une seule fois au chargement du module : l'image est prérendue au build,
// ces fichiers ne sont donc jamais touchés à la requête. `next/og` (Satori) ne
// sait pas lire de woff2 — d'où des TTF dans le dépôt plutôt que la police de
// next/font, qui n'est de toute façon pas héritée ici.
const [regular, semiBold, paw] = await Promise.all([
  readFile(join(process.cwd(), "assets/fonts/PlusJakartaSans-Regular.ttf")),
  readFile(join(process.cwd(), "assets/fonts/PlusJakartaSans-SemiBold.ttf")),
  readFile(join(process.cwd(), "public/paw.svg"), "base64"),
]);

export function renderOgCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F3EA",
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        {/* Le lockup : patte à gauche du mot, posés sur la même ligne de base. */}
        <div style={{ display: "flex", alignItems: "baseline" }}>
          {/* Satori ne connaît que <img> : next/image n'existe pas dans une
              ImageResponse, et il n'y a de toute façon ni LCP ni bande
              passante à optimiser dans un PNG rendu au build. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/svg+xml;base64,${paw}`}
            width={Math.round(PAW_HEIGHT * PAW_RATIO)}
            height={Math.round(PAW_HEIGHT)}
            style={{
              marginRight: Math.round(WORD * 0.227),
              // Correction de la ligne de base, plus les 0,015 em dont la patte
              // est descendue sur le site : sa masse porte plus bas que son
              // centre géométrique, elle paraît ainsi centrée sur le mot.
              transform: `translateY(${PAW_BASELINE_FIX.toFixed(1)}px)`,
            }}
            alt=""
          />
          <div
            style={{
              fontSize: WORD,
              fontWeight: 600,
              color: "#2B2622",
            }}
          >
            {STR.site.name.toLowerCase()}
          </div>
        </div>

        {/* La phrase d'accroche de l'accueil, jamais recopiée : elle vient de
            strings.ts, donc la carte suit le site quand elle change. */}
        <div
          style={{
            marginTop: 52,
            maxWidth: 820,
            fontSize: 40,
            lineHeight: 1.4,
            color: "#6B625A",
            textAlign: "center",
          }}
        >
          {STR.home.tagline}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Plus Jakarta Sans", data: regular, weight: 400, style: "normal" },
        { name: "Plus Jakarta Sans", data: semiBold, weight: 600, style: "normal" },
      ],
    },
  );
}
