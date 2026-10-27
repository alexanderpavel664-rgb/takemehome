import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, PLATE_PADDING, RADIUS, TYPE, fontFamily } from "../brand";
import { progress, textMotion, type Motion } from "../motion";

type Timing = {
  /** Secondes, temps de la composition. */
  inAt: number;
  /** Instant où le texte doit avoir disparu. */
  outBy?: number;
  /** Déjà à l'écran à `inAt`, sans entrée (la première image). */
  present?: boolean;
  /** L'occurrence : registre, durées et amplitude propres (motion.ts). */
  m: Motion;
};

/**
 * L'aplat crème sous un texte posé sur une photo : la couleur du papier
 * du site, son rayon à l'échelle (55 px), aucune ombre. Il apparaît et
 * disparaît en fondu, au rythme de son texte, sans bouger : seul le texte
 * porte le mouvement.
 */
export const Plate: React.FC<Timing & { style?: React.CSSProperties; children: React.ReactNode }> = ({
  inAt,
  outBy,
  present,
  m,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const i = present ? 1 : progress(frame, fps, inAt, m.inDur, m.r.in);
  const o = outBy === undefined ? 0 : progress(frame, fps, outBy - m.outDur, m.outDur, m.r.out);
  return (
    <div style={{ position: "absolute", ...style }}>
      <div style={{ position: "absolute", inset: 0, backgroundColor: COLORS.cream, borderRadius: RADIUS, opacity: i * (1 - o) }} />
      <div style={{ position: "relative", padding: PLATE_PADDING }}>{children}</div>
    </div>
  );
};

/**
 * Une grande phrase. Coupures de ligne fixées à la main ; chaque ligne
 * peut avoir son propre instant d'entrée (`lineIn`), sinon les lignes
 * entrent en cascade. Les sorties sont groupées : toutes finies à `outBy`.
 */
export const Phrase: React.FC<
  Timing & { lines: readonly string[]; lineIn?: readonly number[]; align?: "left" | "center"; size?: number }
> = ({ lines, lineIn, inAt, outBy, present, m, align = "left", size = TYPE.phrase.size }) => (
  <div style={{ textAlign: align }}>
    {lines.map((line, i) => (
      <Line key={line} text={line} inAt={lineIn?.[i] ?? inAt + i * m.cascade} outBy={outBy} present={present} m={m} size={size} />
    ))}
  </div>
);

const Line: React.FC<Timing & { text: string; size: number }> = ({ text, inAt, outBy, present, m, size }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        fontFamily,
        fontSize: size,
        fontWeight: TYPE.phrase.weight,
        lineHeight: TYPE.phrase.lineHeight,
        color: COLORS.ink,
        whiteSpace: "nowrap",
        ...textMotion(frame, fps, m, inAt, outBy, present),
      }}
    >
      {text}
    </div>
  );
};

/** Nom d'animal : 600, encre, comme sur les cartes et la fiche. */
export const AnimalName: React.FC<Timing & { text: string }> = ({ text, inAt, outBy, m }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        fontFamily,
        fontSize: TYPE.name.size,
        fontWeight: TYPE.name.weight,
        lineHeight: TYPE.name.lineHeight,
        color: COLORS.ink,
        whiteSpace: "nowrap",
        ...textMotion(frame, fps, m, inAt, outBy),
      }}
    >
      {text}
    </div>
  );
};

/** Texte secondaire (ville, adresse du site) : 400 ; gris chaud comme sur le site, sauf `color`. */
export const Detail: React.FC<Timing & { text: string; color?: string; style?: React.CSSProperties }> = ({
  text,
  inAt,
  outBy,
  m,
  color = COLORS.gray,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        fontFamily,
        fontSize: TYPE.detail.size,
        fontWeight: TYPE.detail.weight,
        lineHeight: TYPE.detail.lineHeight,
        color,
        whiteSpace: "nowrap",
        ...style,
        ...textMotion(frame, fps, m, inAt, outBy),
      }}
    >
      {text}
    </div>
  );
};

/** La pastille « Adoptat », comme le Badge du site : vert forêt, 600, texte blanc, pilule. */
export const Pill: React.FC<Timing> = ({ inAt, outBy, m }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily,
        fontSize: TYPE.pill.size,
        fontWeight: TYPE.pill.weight,
        lineHeight: TYPE.pill.lineHeight,
        color: COLORS.white,
        backgroundColor: COLORS.green,
        borderRadius: 9999,
        padding: `${TYPE.pill.padY}px ${TYPE.pill.padX}px`,
        ...textMotion(frame, fps, m, inAt, outBy),
      }}
    >
      Adoptat
    </div>
  );
};
