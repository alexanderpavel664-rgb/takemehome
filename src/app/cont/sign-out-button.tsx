"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onSignOut() {
    setPending(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
    setPending(false);
  }

  return (
    // Ghost : la déconnexion est une sortie discrète en bas de page — la
    // bordure terracotta de l'outline lui donnerait un poids qu'elle n'a pas.
    <Button variant="ghost" onClick={onSignOut} disabled={pending}>
      {pending ? "Déconnexion…" : "Se déconnecter"}
    </Button>
  );
}
