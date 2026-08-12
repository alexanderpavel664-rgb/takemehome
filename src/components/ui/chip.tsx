import type { ComponentProps } from "react";

/**
 * Pilule de filtre : fond ivoire, hairline, libellé encre en 400.
 * Sélectionnée : fond encre chaude, texte blanc — la terracotta est
 * interdite ici (La Règle Terracotta). La bordure reste présente dans les
 * deux états pour que la sélection ne décale rien.
 */
export function Chip({
  selected = false,
  type = "button",
  className = "",
  ...props
}: ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={
        "inline-flex min-h-11 items-center justify-center rounded-pill border px-4 " +
        "text-sm transition-colors " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink " +
        (selected
          ? "border-warm-ink bg-warm-ink text-white"
          : "border-warm-border bg-card-ivory text-warm-ink") +
        ` ${className}`
      }
      {...props}
    />
  );
}
