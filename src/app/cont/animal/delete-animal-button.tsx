"use client";

import { deleteAnimal } from "./actions";
import { STR } from "@/lib/strings";
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
        if (!window.confirm(STR.cont.deleteConfirm(name))) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button variant="ghost" type="submit">
        {STR.cont.delete}
      </Button>
    </form>
  );
}
