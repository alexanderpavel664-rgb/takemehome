"use client";

import type { ReactNode } from "react";

/**
 * Formulaire à confirmation — la suspension d'un compte masque toutes ses
 * annonces et la réactivation ne les ramène pas : dans les faits, c'est un
 * geste qu'on ne défait pas d'un clic. Il mérite la même question que la
 * suppression d'une annonce (voir DeleteAnimalButton).
 */
export function ConfirmForm({
  action,
  confirm,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  confirm: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
