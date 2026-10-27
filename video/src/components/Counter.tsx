import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, TYPE, fontFamily } from "../brand";
import { textMotion, type Motion } from "../motion";
import { Phrase } from "./Text";

/**
 * Le nombre seul, puis « au fost deja adoptate. » quand il est posé.
 * Registre expressif. Le nombre monte de 0 à N sur `countFor` secondes, de
 * plus en plus lentement : la valeur suit 1 − (1 − u)^2,5, arrondie à
 * l'entier inférieur — les premiers chiffres défilent, les derniers se
 * posent un à un, et N tombe exactement à la fin. Chiffres à chasse fixe :
 * la largeur ne bouge pas.
 */
export const Counter: React.FC<{
  value: number;
  inAt: number;
  countFor: number;
  line2At: number;
  outBy: number;
  m: Motion;
  m2: Motion;
}> = ({ value, inAt, countFor, line2At, outBy, m, m2 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = interpolate(frame, [inAt * fps, (inAt + countFor) * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shown = Math.min(value, Math.floor(value * (1 - (1 - u) ** 2.5) + 1e-9));
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily,
          fontSize: TYPE.counterNumber.size,
          fontWeight: TYPE.counterNumber.weight,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          color: COLORS.ink,
          ...textMotion(frame, fps, m, inAt, outBy),
        }}
      >
        {shown}
      </div>
      <div style={{ height: 14 }} />
      <Phrase lines={[value === 1 ? "a fost deja adoptat." : "au fost deja adoptate."]} inAt={line2At} outBy={outBy} m={m2} align="center" size={TYPE.counterLine.size} />
    </div>
  );
};
