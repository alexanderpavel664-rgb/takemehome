"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { STR } from "@/lib/strings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";

/**
 * « Ai uitat parola? » — un champ, un bouton, et UNE phrase de confirmation,
 * la même que l'adresse ait un compte ou non. better-auth répond 200 dans
 * les deux cas (et simule le coût d'un jeton pour l'inconnu, contre la
 * mesure du temps de réponse) ; côté écran, rien ne distingue les deux.
 *
 * Passe par /api/auth (authClient) et non par une action serveur : c'est
 * sur ce chemin que le WAF compte password-reset:<ip> (route.ts) ET que la
 * limite better-auth du chemin s'applique. Une action serveur appelant
 * auth.api passerait à côté de la seconde.
 *
 * Seuls le 429 (limite) et une panne s'affichent comme erreurs : ni l'un
 * ni l'autre ne dit quoi que ce soit sur l'adresse.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await authClient.requestPasswordReset({
      email: email.trim(),
      // Là où le lien de l'email atterrit, avec ?token= ou ?error=.
      redirectTo: "/parola-noua",
    });
    setPending(false);
    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    setSent(true);
  }

  return (
    <main className="px-4 pt-10 pb-10 md:px-6 md:pt-16 lg:px-8">
      <Card className="mx-auto w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold text-warm-ink">
          {STR.auth.forgotPassword.title}
        </h1>
        {sent ? (
          // Le formulaire disparaît : la phrase est la fin du parcours ici,
          // la suite se passe dans la boîte mail. Le champ n'a plus rien à
          // faire — et un second envoi tombe de toute façon sur la limite.
          <p role="status" className="mt-4 max-w-[60ch] text-base text-warm-ink">
            {STR.auth.forgotPassword.sent}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <p className="max-w-[60ch] text-base text-warm-gray">
              {STR.auth.forgotPassword.intro}
            </p>
            <Input
              label={STR.auth.forgotPassword.email}
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && (
              <p role="alert" className="text-sm font-semibold text-warm-ink">
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={pending}
            >
              {pending
                ? STR.auth.forgotPassword.submitPending
                : STR.auth.forgotPassword.submit}
            </Button>
          </form>
        )}
        <p className="mt-4 text-sm text-warm-gray">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center text-warm-ink underline underline-offset-4"
          >
            {STR.auth.forgotPassword.backToLogin}
          </Link>
        </p>
      </Card>
    </main>
  );
}
