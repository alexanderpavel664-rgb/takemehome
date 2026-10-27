import React from "react";
import { AbsoluteFill } from "remotion";
import { SAFE, VIDEO } from "../brand";

const zone: React.CSSProperties = {
  position: "absolute",
  backgroundColor: "rgba(220, 30, 60, 0.28)",
  outline: "3px solid rgba(220, 30, 60, 0.9)",
  outlineOffset: -3,
};

/** Vérification seulement : les zones où rien d'important ne doit aller. */
export const SafeZones: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ ...zone, left: 0, right: 0, top: 0, height: SAFE.top }} />
    <div style={{ ...zone, left: 0, right: 0, bottom: 0, height: SAFE.bottom }} />
    <div style={{ ...zone, left: 0, width: SAFE.side, top: SAFE.top, bottom: SAFE.bottom }} />
    <div style={{ ...zone, right: 0, width: SAFE.side, top: SAFE.top, height: SAFE.rightColumn.fromY - SAFE.top }} />
    <div
      style={{
        ...zone,
        right: 0,
        width: SAFE.rightColumn.width,
        top: SAFE.rightColumn.fromY,
        height: VIDEO.height - SAFE.bottom - SAFE.rightColumn.fromY,
      }}
    />
  </AbsoluteFill>
);
