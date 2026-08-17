"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { reportClientError } from "@/lib/client-report";
import { STR } from "@/lib/strings";

/**
 * Écran d'erreur de toutes les pages — rendu à l'intérieur du layout racine,
 * donc l'en-tête et le pied restent en place. Il est dessiné dans le même
 * monde que le 404 : ni trace d'appel, ni requête SQL, ni chemin de fichier.
 *
 * La Règle de la Sortie : une explication en toutes lettres, un essai
 * possible, et le chemin vers /animale. Le digest est la seule chose
 * technique affichée, et c'est une empreinte opaque : elle ne divulgue rien
 * et permet de retrouver la ligne de log correspondante.
 *
 * `retry` et non `reset` : la prop a changé de nom, `retry` refait le rendu
 * ET refait les requêtes de données, ce qui est le comportement attendu ici.
 */
export default function ErrorScreen({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Une erreur née côté serveur porte un digest et a déjà été signalée par
    // onRequestError : la resignaler ferait doublon. Sans digest, elle vient
    // du navigateur et n'a laissé aucune trace ailleurs.
    if (!error.digest) {
      reportClientError("render_crashed", error);
    }
  }, [error]);

  return (
    <>
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-warm-ink">{STR.error.title}</h1>
      <p className="max-w-md text-base text-warm-gray">{STR.error.description}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" onClick={() => retry()}>
          {STR.error.retry}
        </Button>
        <ButtonLink variant="outline" href="/animale">
          {STR.error.toAnimals}
        </ButtonLink>
      </div>
      {error.digest && (
        <p className="mt-6 text-sm text-warm-gray">{STR.error.code(error.digest)}</p>
      )}
    </main>
    <SiteFooter />
    </>
  );
}
