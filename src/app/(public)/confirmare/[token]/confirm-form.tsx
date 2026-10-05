"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ConfirmAction } from "@/lib/confirmation-token";
import { STR } from "@/lib/strings";
import { Button } from "@/components/ui/button";
import {
  submitConfirmation,
  type ConfirmState,
  type ConfirmStep,
} from "./actions";

const SOURCES = [
  ["TAKEMEHOME", STR.confirmari.page.sourceYes],
  ["ELSEWHERE", STR.confirmari.page.sourceNo],
  ["UNKNOWN", STR.confirmari.page.sourceUnknown],
] as const;

/**
 * Le contenu de la carte /confirmare, étape par étape : la question et UN
 * bouton (l'action du lien), puis le merci — et, après « A fost adoptat »,
 * la question facultative sur l'origine de l'adoption.
 *
 * Le lien vers l'autre action est là pour qui s'est trompé de bouton dans
 * l'email : en encre, jamais un second bouton (La Règle du Bouton Unique).
 */
export function ConfirmForm({
  token,
  action,
  plural,
  initialStep,
  currentNote,
  groupHint,
  alternateHref,
  listingHref,
}: {
  token: string;
  action: ConfirmAction;
  plural: boolean;
  initialStep: ConfirmStep;
  /** Le statut actuel quand il diffère de celui qu'on confirme. */
  currentNote: string | null;
  groupHint: boolean;
  alternateHref: string;
  /** null quand la fiche n'est pas publique (masquée par la modération). */
  listingHref: string | null;
}) {
  const s = STR.confirmari.page;
  const [state, formAction, pending] = useActionState<ConfirmState, FormData>(
    submitConfirmation,
    { step: initialStep },
  );

  const error = state.formError && (
    <p role="alert" className="mt-4 text-sm font-semibold text-warm-ink">
      {state.formError}
    </p>
  );
  const linkClass =
    "inline-flex min-h-11 items-center text-base text-warm-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink";
  const seeListing = listingHref && (
    <p className="mt-4">
      <Link href={listingHref} className={linkClass}>
        {s.seeListing}
      </Link>
    </p>
  );

  if (state.step === "available-done") {
    return (
      <div role="status">
        <h1 className="text-2xl font-semibold text-warm-ink">
          {s.availableDoneTitle}
        </h1>
        <p className="mt-2 text-base text-warm-ink">{s.availableDone}</p>
        {state.stillHidden && (
          <p className="mt-2 text-base text-warm-ink">{s.stillHidden}</p>
        )}
        {!state.stillHidden && seeListing}
      </div>
    );
  }

  if (state.step === "source" || state.step === "source-done") {
    return (
      <div role="status">
        <h1 className="text-2xl font-semibold text-warm-ink">
          {s.adoptedDoneTitle}
        </h1>
        {state.step === "source-done" ? (
          <p className="mt-2 text-base text-warm-ink">{s.sourceDone}</p>
        ) : (
          <form action={formAction} className="mt-4">
            <input type="hidden" name="token" value={token} />
            <input type="hidden" name="intent" value="source" />
            <p className="text-lg font-semibold text-warm-ink">
              {s.sourceQuestion(plural)}
            </p>
            <p className="mt-1 text-sm text-warm-gray">{s.sourceHint}</p>
            {/* Trois réponses de même poids : aucune n'est la « bonne ». */}
            <div className="mt-4 flex flex-wrap gap-3">
              {SOURCES.map(([value, label]) => (
                <Button
                  key={value}
                  type="submit"
                  name="source"
                  value={value}
                  variant="outline"
                  disabled={pending}
                >
                  {label}
                </Button>
              ))}
            </div>
            {error}
          </form>
        )}
        {seeListing}
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="intent" value="confirm" />
      <h1 className="text-2xl font-semibold text-warm-ink">
        {action === "available"
          ? s.availableQuestion(plural)
          : s.adoptedQuestion(plural)}
      </h1>
      {currentNote && (
        <p className="mt-2 text-base text-warm-ink">{currentNote}</p>
      )}
      {groupHint && (
        <p className="mt-2 text-base text-warm-gray">{s.groupHint}</p>
      )}
      <Button type="submit" variant="primary" disabled={pending} className="mt-6">
        {pending
          ? s.pending
          : action === "available"
            ? s.confirmAvailable(plural)
            : s.confirmAdopted(plural)}
      </Button>
      {error}
      <p className="mt-4">
        <Link href={alternateHref} className={linkClass}>
          {action === "available"
            ? s.switchToAdopted(plural)
            : s.switchToAvailable(plural)}
        </Link>
      </p>
    </form>
  );
}
