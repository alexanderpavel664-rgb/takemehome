"use client";

import { useActionState } from "react";
import { STR } from "@/lib/strings";
import { signalAdopted, type AdoptionSignalState } from "./actions";

/**
 * « A fost deja adoptat? » en bas de fiche, à côté de « Semnalează » et
 * aussi discret : un bouton de formulaire habillé en lien, jamais un lien
 * (un robot qui suit les liens enverrait des demandes pour toutes les
 * fiches). Après l'envoi, la phrase de remerciement prend sa place.
 */
export function AdoptionSignal({ animalId }: { animalId: string }) {
  const [state, formAction, pending] = useActionState<
    AdoptionSignalState,
    FormData
  >(signalAdopted, null);

  if (state?.sent) {
    return (
      <p role="status" className="flex min-h-11 items-center text-sm text-warm-ink">
        {STR.adoptionSignal.sent}
      </p>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="animalId" value={animalId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center text-sm text-warm-gray underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink disabled:opacity-50"
      >
        {pending ? STR.adoptionSignal.pending : STR.adoptionSignal.button}
      </button>
      {state?.formError && (
        <p role="alert" className="text-sm font-semibold text-warm-ink">
          {state.formError}
        </p>
      )}
    </form>
  );
}
