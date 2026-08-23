"use client";

import { useActionState } from "react";
import { STR } from "@/lib/strings";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/field";
import { TermsLabel } from "@/components/terms-label";
import { SignOutButton } from "@/app/cont/sign-out-button";
import { acceptTerms } from "./actions";

export function AcceptTermsForm() {
  const [state, formAction, pending] = useActionState(acceptTerms, null);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {/* Jamais pré-cochée — voir profile-form.tsx pour la règle et ses
          sources. Pas de required non plus : le message vient du serveur,
          en toutes lettres, et vaut aussi pour un POST direct. */}
      <Checkbox name="accept" label={<TermsLabel />} error={state?.formError} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending
            ? STR.auth.acceptTerms.submitPending
            : STR.auth.acceptTerms.submit}
        </Button>
        {/* La sortie, pour qui refuse : on ne retient personne devant une
            case à cocher. */}
        <SignOutButton />
      </div>
    </form>
  );
}
