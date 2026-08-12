"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export default function InregistrarePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    if (error) {
      setError(authErrorMessage(error.code));
      setPending(false);
      return;
    }
    router.push("/cont");
  }

  async function onGoogle() {
    setError(null);
    // signIn.social ne lance jamais d'exception : l'échec arrive dans { error }.
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/cont",
      errorCallbackURL: "/login?error=google",
    });
    if (error) {
      setError("La connexion avec Google a échoué. Réessaie.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-sm p-4 pt-10">
      <h1 className="text-2xl font-semibold text-warm-ink">
        Créer un compte refuge
      </h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input
          label="Nom du refuge"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Mot de passe (8 caractères minimum)"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        {/* Erreur globale par nature (compte existant, échec Google) :
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
          {pending ? "Création en cours…" : "Créer le compte"}
        </Button>
      </form>
      {/* Google, séparé du formulaire email par une hairline douce. */}
      <div className="mt-6 border-t border-warm-border pt-6">
        <Button className="w-full" onClick={onGoogle}>
          Se connecter avec Google
        </Button>
      </div>
      <p className="mt-4 text-sm text-warm-gray">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="py-2 text-warm-ink underline underline-offset-4"
        >
          Se connecter
        </Link>
      </p>
    </main>
  );
}
