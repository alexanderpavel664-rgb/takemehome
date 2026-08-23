"use client";

import { useEffect, useRef, useState } from "react";
import { STR } from "@/lib/strings";

/**
 * « Copiază » à côté d'une donnée à emporter (numéro de téléphone, adresse
 * email) : sur un ordinateur, un lien tel: ne fait rien d'utile — la
 * personne veut le numéro dans son presse-papiers pour l'écrire dans
 * WhatsApp ou le composer sur son téléphone.
 *
 * Bouton texte en encre, jamais terracotta (La Règle Terracotta), avec une
 * cible tactile ≥ 44 px. Le retour « Copiat » s'affiche deux secondes, et
 * une zone live le dit aux lecteurs d'écran. Le texte copié reste de toute
 * façon sélectionnable à côté du bouton : si le presse-papiers est refusé
 * (contexte non sécurisé, permission), le bouton le dit sans rien casser.
 */
export function CopyButton({
  value,
  ariaLabel,
  className = "",
}: {
  value: string;
  /** « Copiază numărul de telefon » : le bouton seul ne dit pas quoi. */
  ariaLabel: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  function show(next: "copied" | "failed") {
    setState(next);
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => setState("idle"), 2000);
  }

  async function onCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        legacyCopy(value);
      }
      show("copied");
    } catch {
      show("failed");
    }
  }

  const label =
    state === "copied"
      ? STR.animal.copied
      : state === "failed"
        ? STR.animal.copyFailed
        : STR.animal.copy;

  return (
    <>
      <button
        type="button"
        onClick={onCopy}
        aria-label={state === "idle" ? ariaLabel : undefined}
        className={`inline-flex min-h-11 items-center rounded-md px-2 text-sm text-warm-ink underline underline-offset-4 hover:bg-warm-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink ${className}`.trim()}
      >
        {label}
      </button>
      <span role="status" className="sr-only">
        {state === "idle" ? "" : label}
      </span>
    </>
  );
}

// Navigateurs sans API Clipboard (contexte non sécurisé, anciens WebView) :
// un textarea hors écran, sélection, execCommand — déprécié mais encore
// partout. Lève si ça échoue, l'appelant affiche « Nu s-a putut copia ».
function legacyCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    if (!document.execCommand("copy")) {
      throw new Error("copy refused");
    }
  } finally {
    textarea.remove();
  }
}
