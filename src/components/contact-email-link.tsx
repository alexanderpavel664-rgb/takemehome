import { CONTACT_EMAIL } from "@/lib/site";

/**
 * L'adresse de contact, en lien mailto: ET en toutes lettres : sur un
 * ordinateur sans client mail, le lien ne fait rien, mais l'adresse se lit
 * et se copie (select-all : un clic la sélectionne entière). En encre, jamais
 * terracotta (La Règle Terracotta) — c'est un lien, pas une action.
 */
export function ContactEmailLink({ className = "" }: { className?: string }) {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className={`select-all text-warm-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink ${className}`.trim()}
    >
      {CONTACT_EMAIL}
    </a>
  );
}
