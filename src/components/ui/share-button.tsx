"use client";

import { useEffect, useRef, useState } from "react";
import { STR } from "@/lib/strings";
import { Button, type ButtonVariant } from "./button";
import { copyToClipboard } from "./copy-button";

/**
 * « Distribuie » : le levier de croissance du site — les sauveteurs
 * partagent leurs propres animaux, chacun à son réseau. Sur téléphone,
 * l'API Web Share ouvre le menu natif (Facebook, WhatsApp, Messenger,
 * SMS…) avec le nom, une phrase et l'URL de la fiche. Sans l'API (Firefox
 * de bureau, vieux WebView), le lien est copié dans le presse-papiers et
 * le bouton le dit deux secondes : « Link copiat ».
 *
 * Jamais plein : « Sună » reste LE bouton plein de la fiche (La Règle du
 * Bouton Unique) — outline par défaut, ghost là où il faut encore plus de
 * retenue. Le rendu serveur et le premier rendu client sont identiques
 * (le choix API / presse-papiers se fait au clic), donc pas d'écart
 * d'hydratation.
 */
export function ShareButton({
  title,
  text,
  url,
  variant = "outline",
  className = "",
}: {
  /** Le nom de l'animal, ou ce qui en tient lieu. */
  title: string;
  /** « Fulga caută o familie ». */
  text: string;
  /** L'URL publique absolue de la fiche. */
  url: string;
  variant?: ButtonVariant;
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

  async function onShare() {
    const data = { title, text, url };
    // canShare est facultatif dans l'API : quand il existe, il dit si CES
    // données passent ; sinon on tente, et l'échec retombe sur la copie.
    if (
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" || navigator.canShare(data))
    ) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        // Menu refermé sans choisir : ce n'est pas un échec, et surtout pas
        // une raison de copier un lien que personne n'a demandé.
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        // Tout autre refus (données rejetées, pas de geste utilisateur…)
        // passe par le presse-papiers.
      }
    }
    try {
      await copyToClipboard(url);
      show("copied");
    } catch {
      show("failed");
    }
  }

  const label =
    state === "copied"
      ? STR.animal.linkCopied
      : state === "failed"
        ? STR.animal.shareFailed
        : STR.animal.share;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        onClick={onShare}
        className={className}
      >
        {state === "idle" && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="size-5"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="m16 6-4-4-4 4" />
            <path d="M12 2v13" />
          </svg>
        )}
        {label}
      </Button>
      {/* Le retour « Link copiat » est aussi annoncé aux lecteurs d'écran. */}
      <span role="status" className="sr-only">
        {state === "idle" ? "" : label}
      </span>
    </>
  );
}
