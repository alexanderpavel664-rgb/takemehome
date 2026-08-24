"use client";

import { startTransition, useActionState, useState } from "react";
import { STR } from "@/lib/strings";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { resetPassword, type ResetPasswordState } from "./actions";

/**
 * Nouveau mot de passe + répétition, mêmes règles qu'à l'inscription
 * (8 caractères au moins, revalidés par l'action et par better-auth).
 *
 * Le submit est intercepté (preventDefault + startTransition) : React 19
 * réinitialise un formulaire soumis par `action` dès que l'action rend,
 * même une erreur — « parolele nu coincid » s'afficherait au-dessus de
 * champs vidés. L'attribut action reste pour le no-JS.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<
    ResetPasswordState,
    FormData
  >(resetPassword, null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const passwordError =
    state && "fieldError" in state && state.fieldError === "password"
      ? state.message
      : undefined;
  const confirmError =
    state && "fieldError" in state && state.fieldError === "confirm"
      ? state.message
      : undefined;
  const formError = state && "formError" in state ? state : null;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form action={formAction} onSubmit={onSubmit} className="mt-4 space-y-4">
      <p className="max-w-[60ch] text-base text-warm-gray">
        {STR.auth.resetPassword.intro}
      </p>
      <input type="hidden" name="token" value={token} />
      <Input
        label={STR.auth.resetPassword.newPassword}
        name="password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        error={passwordError}
      />
      <Input
        label={STR.auth.resetPassword.confirmPassword}
        name="confirm"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={8}
        error={confirmError}
      />
      {formError && (
        <p role="alert" className="text-sm font-semibold text-warm-ink">
          {formError.formError}
        </p>
      )}
      {formError?.changed ? (
        // Mot de passe changé, connexion automatique ratée : le seul
        // bouton utile mène à /login.
        <ButtonLink variant="primary" href="/login" className="w-full">
          {STR.auth.resetPassword.goToLogin}
        </ButtonLink>
      ) : (
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={pending}
        >
          {pending
            ? STR.auth.resetPassword.submitPending
            : STR.auth.resetPassword.submit}
        </Button>
      )}
    </form>
  );
}
