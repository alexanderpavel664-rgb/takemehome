"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/client-report";
import { STR } from "@/lib/strings";

/**
 * Dernier filet : le layout racine lui-même a échoué. Ce fichier remplace le
 * document entier, donc il fournit ses propres <html> et <body>.
 *
 * Tout est en styles en ligne, volontairement. Next.js n'injecte NI les
 * styles globaux NI la police next/font dans cet écran (le layout racine,
 * qui les porte, est justement ce qui vient de tomber) : une classe Tailwind
 * n'aurait aucun effet et l'écran sortirait en blanc pur Times New Roman.
 * Les valeurs ci-dessous ne sont pas des nombres inventés : ce sont les
 * classes du 404 (not-found.tsx), résolues à la main faute de feuille de
 * style. text-2xl → 24 px, text-base → 16 px, text-sm → 14 px (le pas
 * « Label » de DESIGN.md), et les couleurs sont les tokens gelés. Les deux
 * écrans doivent rester identiques : s'ils changent là-bas, les changer ici.
 *
 * La Règle de la Sortie s'applique quand même : explication, essai, et un
 * chemin vers /animale.
 */

const PAPER = "#F7F3EA";
const INK = "#2B2622";
const GRAY = "#6B625A";
const TERRACOTTA = "#C4552F";

// Mêmes proportions que <Button> : 48 px de haut, 19 px/600, rayon 20 px.
const buttonBase: React.CSSProperties = {
  display: "inline-flex",
  minHeight: "48px",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 24px",
  borderRadius: "20px",
  fontSize: "19px",
  lineHeight: 1.2,
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
};

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Sans digest, le plantage est né dans le navigateur : personne d'autre
    // ne le verra passer.
    if (!error.digest) {
      reportClientError("render_crashed", error);
    }
  }, [error]);

  return (
    <html lang="ro">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "64px 24px",
          textAlign: "center",
          backgroundColor: PAPER,
          color: INK,
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        {/* metadata n'existe pas dans un composant client : c'est le
            composant <title> de React qui pose le titre de l'onglet. */}
        <title>{`${STR.error.title} – ${STR.site.name}`}</title>

        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
          {STR.error.title}
        </h1>
        <p style={{ margin: 0, maxWidth: "28rem", fontSize: "16px", color: GRAY }}>
          {STR.error.description}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "12px",
            marginTop: "16px",
          }}
        >
          <button
            type="button"
            onClick={() => retry()}
            style={{
              ...buttonBase,
              border: "none",
              backgroundColor: TERRACOTTA,
              color: "#FFFFFF",
            }}
          >
            {STR.error.retry}
          </button>
          {/* Une ancre nue, pas next/link : le routeur client fait partie de
              ce qui vient de tomber. Un chargement de page complet repart
              d'un document sain. */}
          <a
            href="/animale"
            style={{
              ...buttonBase,
              border: `1.5px solid ${TERRACOTTA}`,
              color: TERRACOTTA,
            }}
          >
            {STR.error.toAnimals}
          </a>
        </div>

        {error.digest && (
          <p style={{ marginTop: "24px", fontSize: "14px", color: GRAY }}>
            {STR.error.code(error.digest)}
          </p>
        )}
      </body>
    </html>
  );
}
