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
    <Button variant="outline" onClick={onSignOut} disabled={pending}>
      {pending ? "Déconnexion…" : "Se déconnecter"}
    </Button>
  );
}
