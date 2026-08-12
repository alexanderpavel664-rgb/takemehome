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
