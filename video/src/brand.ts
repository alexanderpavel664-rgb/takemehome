import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import { Easing } from "remotion";

/**
 * Les valeurs du site, relevées dans son code et pas de mémoire :
 * src/app/globals.css (@theme), DESIGN.md, components/ui/animal-card.tsx,
 * components/ui/badge.tsx, app/(public)/animal/[id]/page.tsx,
 * components/logo.tsx. Le site est dessiné pour un téléphone d'environ
 * 390 px de large ; la vidéo en fait 1080 : les rayons et marges internes
 * sont multipliés par SCALE. Les tailles de texte, elles, ne descendent
 * jamais sous 56 px.
 */
export const SCALE = 1080 / 390;

// Plus Jakarta Sans, 400 et 600 seulement, comme le site (La Règle de la
// Police Unique). latin-ext : ă, â, î, ș, ț.
export const { fontFamily } = loadFont("normal", {
  weights: ["400", "600"],
  subsets: ["latin", "latin-ext"],
});

/** globals.css, au code hexadécimal près. */
export const COLORS = {
  terracotta: "#C4552F",
  /** forest-adopted : la pastille « Adoptat », rien d'autre. */
  green: "#2F6B4F",
  /** cream-ground : le papier, fond de toutes les pages. */
  cream: "#F7F3EA",
  /** card-ivory. */
  ivory: "#FFFDF8",
  /** warm-ink : texte principal. */
  ink: "#2B2622",
  /** warm-gray : texte secondaire (ville, județ). */
  gray: "#6B625A",
  white: "#FFFFFF",
} as const;

export const VIDEO = { width: 1080, height: 1920, fps: 30 } as const;

/**
 * Zones où rien d'important ne va : interface des trois réseaux (en-tête,
 * légende et boutons en bas, colonne d'actions à droite).
 */
export const SAFE = {
  top: 270,
  bottom: 670,
  side: 120,
  rightColumn: { fromY: 840, width: 300 },
} as const;

/** --radius-md : 20 px sur le site → 55 px dans la vidéo. */
export const RADIUS = Math.round(20 * SCALE);

/** Marge interne d'un aplat : celle de la carte (p-3, 12 px) à l'échelle, plus d'air à gauche et à droite. */
export const PLATE_PADDING = `${Math.round(12 * SCALE)}px ${Math.round(16 * SCALE)}px`;

/**
 * Typographie. Approche naturelle (0) partout, comme le site : DESIGN.md
 * l'écrit « sans exception ni resserrement », et aucune classe tracking-
 * n'existe dans son code.
 */
export const TYPE = {
  /** Grandes phrases : le Display du site (nom sur la fiche), 600, interligne 1,05. */
  phrase: { size: 76, weight: 600, lineHeight: 1.05 },
  counterNumber: { size: 176, weight: 600 },
  counterLine: { size: 56, weight: 600, lineHeight: 1.05 },
  /** Nom d'animal : 600, comme sur la carte (19 px/1,2) et la fiche. */
  name: { size: 64, weight: 600, lineHeight: 1.2 },
  /** Ville : 400, gris chaud, comme les métadonnées de la carte et la ligne « ville, județ » de la fiche. */
  detail: { size: 56, weight: 400, lineHeight: 1.4 },
  /**
   * Pastille « Adoptat » (Badge) : 13 px/1,2, 600, blanc sur vert, px-3
   * py-1 — les marges internes gardent leur rapport à la taille du texte.
   */
  pill: { size: 56, weight: 600, lineHeight: 1.2, padX: 56 * (12 / 13), padY: 56 * (4 / 13) },
  min: 56,
} as const;

// ——— Mouvement : deux registres, comme le système de mouvement d'IBM ————
// Courbes sans dépassement ni rebond (coordonnées dans [0, 1]). Les sorties
// sont plus rapides que les entrées et accélèrent vers la sortie. Chaque
// occurrence varie légèrement (motion.ts), sans sortir de ces bornes.
export type Register = {
  in: (t: number) => number;
  out: (t: number) => number;
  /** Bornes des durées d'entrée et de sortie, en secondes. */
  inDur: readonly [number, number];
  outDur: readonly [number, number];
  /** Déplacement vertical nominal, en px. */
  amplitude: number;
};

/** Productif : prénoms, villes, pastille — rapide et discret. */
export const PRODUCTIVE: Register = {
  in: Easing.bezier(0, 0, 0.38, 0.9),
  out: Easing.bezier(0.2, 0, 1, 0.9),
  inDur: [0.25, 0.35],
  outDur: [0.16, 0.22],
  amplitude: 12,
};

/** Expressif : les quatre phrases et le compteur — plus ample. */
export const EXPRESSIVE: Register = {
  in: Easing.bezier(0, 0, 0.3, 1),
  out: Easing.bezier(0.4, 0.14, 1, 1),
  inDur: [0.5, 0.7],
  outDur: [0.3, 0.42],
  amplitude: 28,
};

/** Cascade entre les lignes d'une phrase, en secondes. */
export const CASCADE = [0.06, 0.08] as const;

/** Entrée d'une photo (fondu enchaîné), en secondes. */
export const PHOTO_FADE = 0.5;
