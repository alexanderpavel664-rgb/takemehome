"use client";

import { deleteAnimal } from "./actions";
import { Button } from "@/components/ui/button";

export function DeleteAnimalButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={deleteAnimal}
      onSubmit={(e) => {
        if (!window.confirm(`Supprimer ${name} ? Cette action est définitive.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button variant="ghost" type="submit">
        Supprimer
      </Button>
    </form>
  );
}
