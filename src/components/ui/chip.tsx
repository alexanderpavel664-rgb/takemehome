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

/**
 * Chip-case à cocher pour les formulaires : même pilule que Chip, mais avec
 * la sémantique d'une checkbox native (name, valeur « on » dans FormData —
 * indispensable côté server action). Pattern peer : l'input reste dans le
 * flux en sr-only avec la classe `peer`, et le <span> voisin porte tout le
 * rendu via peer-checked / peer-focus-visible.
 */
export function ChipCheckbox({
  label,
  className = "",
  ...props
}: ComponentProps<"input"> & { label: string }) {
  return (
    <label className={`inline-flex cursor-pointer ${className}`}>
      <input {...props} type="checkbox" className="peer sr-only" />
      <span
        className={
          "inline-flex min-h-11 items-center justify-center rounded-pill border px-4 " +
          "text-sm transition-colors " +
          "border-warm-border bg-card-ivory text-warm-ink " +
          "peer-checked:border-warm-ink peer-checked:bg-warm-ink peer-checked:text-white " +
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-warm-ink"
        }
      >
        {label}
      </span>
    </label>
  );
}
