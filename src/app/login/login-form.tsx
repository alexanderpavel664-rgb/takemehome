"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

export function LoginForm({ oauthError }: { oauthError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    oauthError ? "La connexion avec Google a échoué. Réessaie." : null,
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
      setError(authErrorMessage(error.code));
      setPending(false);
      return;
    }
    router.push("/cont");
  }

  async function onGoogle() {
    setError(null);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/cont",
      errorCallbackURL: "/login?error=google",
    });
  }

  return (
    <main>
      <h1>Connexion</h1>
      <form onSubmit={onSubmit}>
        <p>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </p>
        <p>
          <label htmlFor="password">Mot de passe</label>
          <br />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </p>
        {error && <p role="alert">{error}</p>}
        <p>
          <button type="submit" disabled={pending}>
            {pending ? "Connexion en cours…" : "Se connecter"}
          </button>
        </p>
      </form>
      <p>
        <button type="button" onClick={onGoogle}>
          Se connecter avec Google
        </button>
      </p>
      <p>
        Pas encore de compte ? <Link href="/inregistrare">Créer un compte</Link>
      </p>
    </main>
  );
}
