import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, fontFamily } from "../brand";
import { textMotion, type Motion } from "../motion";

/**
 * Le lockup du site, construit exactement comme src/components/logo.tsx :
 * la patte de public/paw.svg (copiée telle quelle dans video/public) à
 * gauche du mot « takemehome », qui reste du texte — Plus Jakarta Sans 600,
 * encre chaude, espacement naturel. Géométrie reprise de là-bas, en em :
 * patte 0,595 em de haut, écart 0,227 em, translate-y 0,015 em, patte et
 * mot alignés sur la ligne de base (items-baseline).
 */
export const Logo: React.FC<{ inAt: number; outBy?: number; size: number; m: Motion }> = ({ inAt, outBy, size, m }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        fontFamily,
        fontSize: size,
        fontWeight: 600,
        color: COLORS.ink,
        ...textMotion(frame, fps, m, inAt, outBy),
      }}
    >
      <Img src={staticFile("paw.svg")} style={{ height: "0.595em", width: "auto", marginRight: "0.227em", translate: "0 0.015em" }} />
      takemehome
    </div>
  );
};
