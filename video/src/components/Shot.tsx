import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, fontFamily, TYPE } from "../brand";
import { hash01, progress } from "../motion";

export type ShotSource = { kind: "block"; shade: string; label: string } | { kind: "image"; file: string; seed: string };

/** Fondu des photos : doux, sans dépassement. */
const FADE = Easing.bezier(0.4, 0, 0.2, 1);

/**
 * Un zoom lent d'environ 6 % sur chaque photo (5,5 à 6,5 % selon la photo),
 * centré, sur une courbe douce : rien d'autre ne bouge — ni dérive ni
 * secousse. Fonction du temps local `tau` (s), sur une durée de référence
 * `span`.
 */
function zoom(seed: string, tau: number, span: number) {
  const push = 0.055 + 0.01 * random(`${seed}:push`);
  return 1 + push * Easing.bezier(0.3, 0, 0.6, 1)(Math.min(1, Math.max(0, tau / span)));
}

/**
 * Un plan plein écran. Temps locaux à la Sequence qui le porte : fondu
 * d'entrée sur `fadeIn` secondes, puis le zoom, évalué au temps local plus
 * `tauOffset`, sur une durée de référence `span`.
 */
export const Shot: React.FC<{ source: ShotSource; fadeIn: number; span: number; tauOffset?: number }> = ({
  source,
  fadeIn,
  span,
  tauOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = fadeIn > 0 ? progress(frame, fps, 0, fadeIn, FADE) : 1;
  if (source.kind === "block") {
    const scale = interpolate(frame, [0, span * fps], [1, 1.03], { extrapolateLeft: "clamp", extrapolateRight: "extend" });
    return (
      <AbsoluteFill style={{ opacity }}>
        <AbsoluteFill style={{ scale }}>
          <MockupBlock shade={source.shade} label={source.label} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ opacity, overflow: "hidden" }}>
      <Img
        src={staticFile(source.file)}
        style={{ position: "absolute", width: 1080, height: 1920, left: 0, top: 0, scale: zoom(source.seed, frame / fps + tauOffset, span) }}
      />
      <Grain seed={source.seed} />
    </AbsoluteFill>
  );
};

/**
 * Un grain très léger, sur les photos seulement : les aplats crème et les
 * textes gardent les couleurs du site au code près. Six textures, une par
 * image tirée au hasard, décalée au hasard : jamais deux images pareilles.
 */
const Grain: React.FC<{ seed: string }> = ({ seed }) => {
  const frame = useCurrentFrame();
  const k = Math.floor(random(`${seed}:grain:${frame}`) * 6);
  // Textures de 810 × 1440, affichées au double : un grain de 2 px, décalé au hasard.
  const dx = Math.round(hash01(`${seed}:${frame}:x`) * 540);
  const dy = Math.round(hash01(`${seed}:${frame}:y`) * 960);
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity: 0.1, overflow: "hidden" }}>
      <Img src={staticFile(`grain/g${k}.png`)} style={{ position: "absolute", width: 1620, height: 2880, left: -dx, top: -dy }} />
    </AbsoluteFill>
  );
};

/** Maquette : un bloc gris à la place de la photo, annoté dans la zone basse. */
const MockupBlock: React.FC<{ shade: string; label: string }> = ({ shade, label }) => (
  <AbsoluteFill style={{ backgroundColor: shade }}>
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        top: 1420,
        fontFamily,
        fontSize: TYPE.min,
        color: COLORS.cream,
        opacity: 0.85,
        textAlign: "center",
      }}
    >
      {label}
    </div>
  </AbsoluteFill>
);

/** Un aplat crème plein écran, en fondu (respiration, fin). */
export const CreamLayer: React.FC<{ fadeIn: number }> = ({ fadeIn }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return <AbsoluteFill style={{ backgroundColor: COLORS.cream, opacity: progress(frame, fps, 0, fadeIn, FADE) }} />;
};
