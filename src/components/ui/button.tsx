import Link from "next/link";
import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "outline" | "ghost";

// Libellé 600 / ≥ 19 px sur toutes les variantes : c'est une exigence de
// contraste, pas un choix de style — blanc/terracotta mesure 4,49:1 et
// terracotta/crème ≈ 4:1, deux rapports qui ne tiennent le AA qu'en
// « texte large » (3:1). Si un libellé déçoit sur écran réel, monter la
// taille, jamais la graisse (DESIGN.md).
// Le focus est en encre chaude : la terracotta n'a pas le droit de le
// porter (La Règle Terracotta).
const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-6 " +
  "text-[19px]/[1.2] font-semibold transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink " +
  "disabled:pointer-events-none disabled:opacity-50";

// L'assombrissement au survol mélange la terracotta à l'encre plutôt que
// d'appliquer un filtre au bouton entier : le libellé blanc reste pur.
const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-terracotta text-white " +
    "hover:bg-[color-mix(in_oklab,var(--color-terracotta)_92%,var(--color-warm-ink))] " +
    "active:bg-[color-mix(in_oklab,var(--color-terracotta)_84%,var(--color-warm-ink))]",
  outline:
    "border-[1.5px] border-terracotta text-terracotta " +
    "hover:bg-terracotta/10 active:bg-terracotta/15",
  ghost: "text-warm-ink hover:bg-warm-ink/5 active:bg-warm-ink/10",
};

/** Classes d'un bouton — pour les rares éléments qui ne peuvent pas être `<Button>`/`<ButtonLink>`. */
export function buttonClasses(variant: ButtonVariant, className = "") {
  return `${base} ${variants[variant]} ${className}`.trim();
}

type ButtonOwnProps = {
  /**
   * `primary` : un seul par écran (La Règle du Bouton Unique). Toutes les
   * autres actions en `outline` (défaut) ou `ghost`.
   */
  variant?: ButtonVariant;
};

export function Button({
  variant = "outline",
  type = "button",
  className = "",
  ...props
}: ComponentProps<"button"> & ButtonOwnProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}

/**
 * Lien habillé en bouton — le bouton d'appel `tel:` de la fiche, les chemins
 * de sortie (404 → /animale)…
 */
export function ButtonLink({
  variant = "outline",
  className = "",
  ...props
}: ComponentProps<typeof Link> & ButtonOwnProps) {
  return <Link className={buttonClasses(variant, className)} {...props} />;
}
