"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { STR } from "@/lib/strings";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";

export function LoginForm({ oauthError }: { oauthError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    oauthError ? STR.auth.login.googleFailed : null,
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });
    if (error) {
      setError(authErrorMessage(error));
      setPending(false);
      return;
    }
    router.push("/cont");
  }

  async function onGoogle() {
    setError(null);
    // signIn.social ne lance jamais d'exception : l'échec arrive dans { error }.
    // Un compte Google inconnu = première inscription : direction le profil,
    // dont le contact s'affiche sur les fiches — il doit être rempli d'emblée.
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/cont",
      newUserCallbackURL: "/cont/profil",
      errorCallbackURL: "/login?error=google",
    });
    if (error) {
      setError(STR.auth.login.googleFailed);
    }
  }

  return (
    // Carte ivoire centrée sur le papier crème, avec de l'air au-dessus —
    // le formulaire ne s'étire jamais sur toute la largeur.
    <main className="px-4 pt-10 pb-10 md:px-6 md:pt-16 lg:px-8">
      <Card className="mx-auto w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold text-warm-ink">
          {STR.auth.login.title}
        </h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label={STR.auth.login.email}
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label={STR.auth.login.password}
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {/* Erreur globale par nature (mauvais identifiants, échec Google) :
              en toutes lettres sous les champs — la palette n'a pas de rouge. */}
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
            {pending ? STR.auth.login.submitPending : STR.auth.login.submit}
          </Button>
        </form>
        {/* Google, séparé du formulaire email par une hairline douce. */}
        <div className="mt-6 border-t border-warm-border pt-6">
          <Button className="w-full" onClick={onGoogle}>
            {STR.auth.login.google}
          </Button>
        </div>
        <p className="mt-4 text-sm text-warm-gray">
          {STR.auth.login.noAccount}{" "}
          <Link
            href="/inregistrare"
            className="inline-flex min-h-11 items-center text-warm-ink underline underline-offset-4"
          >
            {STR.auth.login.createAccount}
          </Link>
        </p>
      </Card>
    </main>
  );
}
