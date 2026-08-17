import type { ComponentProps, ReactNode } from "react";

/**
 * Champs de formulaire : fond ivoire, hairline, rayon 20 px, texte 16 px
 * (jamais moins — le zoom automatique d'iOS se déclenche sous 16 px).
 * Focus et erreur : bordure encre « épaissie » — le second pixel vient d'un
 * ring (box-shadow) pour ne pas décaler la mise en page. L'erreur s'écrit en
 * toutes lettres sous le champ (encre 600, 14 px) : la palette n'a pas de
 * rouge et la couleur seule ne porte jamais l'erreur.
 */

type FieldOwnProps = {
  label: string;
  /** Message d'erreur en toutes lettres — une phrase, pas un code. */
  error?: string;
};

const fieldBase =
  "block w-full rounded-md border bg-card-ivory px-4 text-base text-warm-ink " +
  "placeholder:text-warm-gray outline-none transition-[border-color,box-shadow]";

function fieldState(invalid: boolean) {
  return invalid
    ? "border-warm-ink ring-1 ring-warm-ink"
    : "border-warm-border focus:border-warm-ink focus:ring-1 focus:ring-warm-ink";
}

// L'id dérive du name quand il n'est pas fourni : le label et le message
// d'erreur restent reliés au champ même depuis un Server Component
// (pas de useId hors client).
function fieldId(id: string | undefined, name: string | undefined) {
  return id ?? (name ? `camp-${name}` : undefined);
}

function Field({
  id,
  label,
  error,
  children,
}: FieldOwnProps & { id: string | undefined; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm text-warm-ink">
        {label}
      </label>
      {children}
      {error && (
        <p
          id={id ? `${id}-error` : undefined}
          className="mt-1 text-sm font-semibold text-warm-ink"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function a11yProps(id: string | undefined, error: string | undefined) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error && id ? `${id}-error` : undefined,
  };
}

export function Input({
  label,
  error,
  id,
  name,
  className = "",
  ...props
}: ComponentProps<"input"> & FieldOwnProps) {
  const inputId = fieldId(id, name);
  return (
    <Field id={inputId} label={label} error={error}>
      <input
        id={inputId}
        name={name}
        {...a11yProps(inputId, error)}
        className={`h-12 ${fieldBase} ${fieldState(Boolean(error))} ${className}`}
        {...props}
      />
    </Field>
  );
}

export function Select({
  label,
  error,
  id,
  name,
  className = "",
  children,
  ...props
}: ComponentProps<"select"> & FieldOwnProps) {
  const inputId = fieldId(id, name);
  return (
    <Field id={inputId} label={label} error={error}>
      <span className="relative block">
        <select
          id={inputId}
          name={name}
          {...a11yProps(inputId, error)}
          className={`h-12 appearance-none pr-10 ${fieldBase} ${fieldState(Boolean(error))} ${className}`}
          {...props}
        >
          {children}
        </select>
        {/* Chevron en encre chaude — les icônes ne sont jamais terracotta. */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-warm-ink"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </Field>
  );
}

/**
 * Case à cocher avec sa phrase d'explication — pour les décisions, pas pour
 * les attributs. Les traits d'un animal se cochent en ChipCheckbox (des
 * pilules qu'on balaie du regard) ; ici on demande à quelqu'un de consentir,
 * et il doit d'abord lire. D'où la forme : une vraie case carrée, le libellé
 * à côté, et le détail dessous en gris chaud.
 *
 * JAMAIS de defaultChecked à true sur un consentement : une case pré-cochée
 * ne vaut pas consentement (CJUE Planet49 C-673/17 ; Orange România C-61/19,
 * qui met la preuve du comportement actif à la charge de l'opérateur). Le
 * composant ne force rien — c'est l'appelant qui doit tenir cette règle.
 *
 * Pattern peer, comme ChipCheckbox : l'input reste dans le flux en sr-only,
 * le <span> voisin porte le rendu. La zone cliquable est tout le bloc.
 */
export function Checkbox({
  label,
  description,
  className = "",
  ...props
}: ComponentProps<"input"> & { label: string; description?: ReactNode }) {
  return (
    <label className={`flex cursor-pointer gap-3 ${className}`}>
      <input {...props} type="checkbox" className="peer sr-only" />
      {/* mt-0.5 : la case s'aligne sur la hauteur d'x de la première ligne
          du libellé, pas sur le haut de la boîte de texte. Le rayon de 6 px
          est une exception assumée au token de 20 px : à 24 px de côté,
          20 px de rayon dessinerait un galet, plus une case. */}
      <span
        aria-hidden
        className={
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[6px] border " +
          "border-warm-border bg-card-ivory text-white transition-colors " +
          "peer-checked:border-warm-ink peer-checked:bg-warm-ink " +
          // Le variant vise le <svg> DEPUIS le span : peer-checked ne
          // s'applique qu'aux frères de l'input, or la coche est un neveu.
          "peer-checked:[&>svg]:opacity-100 " +
          "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-warm-ink"
        }
      >
        {/* La coche n'apparaît qu'une fois cochée : opacity, jamais display —
            un changement de display ferait sauter la case d'un pixel. */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 opacity-0"
        >
          <path d="m5 13 4 4L19 7" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block text-base text-warm-ink">{label}</span>
        {description && (
          <span className="mt-1 block max-w-[60ch] text-sm text-warm-gray">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export function Textarea({
  label,
  error,
  id,
  name,
  rows = 4,
  className = "",
  ...props
}: ComponentProps<"textarea"> & FieldOwnProps) {
  const inputId = fieldId(id, name);
  return (
    <Field id={inputId} label={label} error={error}>
      <textarea
        id={inputId}
        name={name}
        rows={rows}
        {...a11yProps(inputId, error)}
        className={`py-3 ${fieldBase} ${fieldState(Boolean(error))} ${className}`}
        {...props}
      />
    </Field>
  );
}
