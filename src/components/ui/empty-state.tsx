import type { ReactNode } from "react";

/**
 * Écran vide : le papier assume le silence. Titre encre (Title 600),
 * explication gris chaud, sans carte fantôme ni illustration. Aucun état ne
 * laisse l'utilisateur sans chemin (La Règle de la Sortie) — mais au plus
 * une action, et en outline (La Règle du Bouton Unique tient aussi ici).
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  /** Au plus une action : un `<Button variant="outline">` ou `<ButtonLink variant="outline">`. */
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <h2 className="text-xl font-semibold text-warm-ink">{title}</h2>
      {description && (
        <p className="max-w-[66ch] text-base text-warm-gray">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
