"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/chip";

/** Démo interactive des chips — sélection multiple, comme les futurs filtres. */
export function ChipDemo({ options }: { options: string[] }) {
  const [selected, setSelected] = useState<string[]>(options.slice(0, 1));
  const toggle = (option: string) =>
    setSelected((current) =>
      current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option],
    );
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Chip
          key={option}
          selected={selected.includes(option)}
          onClick={() => toggle(option)}
        >
          {option}
        </Chip>
      ))}
    </div>
  );
}
