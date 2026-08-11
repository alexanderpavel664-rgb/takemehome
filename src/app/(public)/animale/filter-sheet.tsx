"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AgeGroup,
  AnimalSize,
  Sex,
} from "@/generated/prisma/client";
import {
  countActiveFilters,
  serializeFilters,
  type PublicFilters,
} from "@/lib/animal-filters";
import {
  AGE_GROUP_OPTIONS,
  SEX_OPTIONS,
  SIZE_OPTIONS,
} from "@/lib/animal-labels";
import { COUNTIES } from "@/lib/counties";
import type { CountyCode } from "@/lib/counties";

const BOOL_FIELDS: { key: keyof PublicFilters & string; label: string }[] = [
  { key: "sterilizat", label: "Stérilisé" },
  { key: "vaccinat", label: "Vacciné" },
  { key: "cip", label: "Pucé" },
  { key: "copii", label: "S'entend avec les enfants" },
  { key: "caini", label: "S'entend avec les chiens" },
  { key: "pisici", label: "S'entend avec les chats" },
];

/**
 * Bouton « Filtrează » (avec badge du nombre de filtres actifs) + bottom
 * sheet. Le sheet édite un brouillon local ; « Aplică » pousse la nouvelle
 * URL (les filtres vivent dans les searchParams), en conservant l'onglet
 * type et en repartant à la première page.
 */
export function FilterSheet({ filters }: { filters: PublicFilters }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PublicFilters>(filters);
  const activeCount = countActiveFilters(filters);

  // Bloque le défilement de la liste tant que le sheet est ouvert.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function openSheet() {
    setDraft(filters);
    setOpen(true);
  }

  function navigate(next: PublicFilters) {
    setOpen(false);
    const qs = serializeFilters(next);
    router.push(qs ? `/animale?${qs}` : "/animale");
  }

  function apply() {
    navigate(draft);
  }

  function reset() {
    // Ne réinitialise que les filtres du sheet : l'onglet type reste.
    navigate({
      tip: filters.tip,
      sterilizat: false,
      vaccinat: false,
      cip: false,
      copii: false,
      caini: false,
      pisici: false,
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-expanded={open}
        className={
          activeCount > 0
            ? "min-h-11 border-2 border-current px-4 py-2 font-bold"
            : "min-h-11 border px-4 py-2"
        }
      >
        Filtrează
        {activeCount > 0 && (
          <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-black px-1 text-sm font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-10">
          {/* Fond cliquable pour fermer, en plus du bouton X. */}
          <button
            type="button"
            aria-label="Fermer les filtres"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/50"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtres"
            className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col border-t bg-white text-black"
          >
            <div className="flex items-center justify-between border-b px-4 py-2">
              <h2 className="font-bold">Filtres</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="flex h-11 w-11 items-center justify-center text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              <label className="block py-2">
                Județ
                <select
                  value={draft.judet ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      judet: (e.target.value || undefined) as
                        | CountyCode
                        | undefined,
                    })
                  }
                  className="mt-1 block min-h-11 w-full border px-2"
                >
                  <option value="">Tous</option>
                  {COUNTIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block py-2">
                Âge
                <select
                  value={draft.varsta ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      varsta: (e.target.value || undefined) as
                        | AgeGroup
                        | undefined,
                    })
                  }
                  className="mt-1 block min-h-11 w-full border px-2"
                >
                  <option value="">Tous</option>
                  {AGE_GROUP_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block py-2">
                Sexe
                <select
                  value={draft.sex ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sex: (e.target.value || undefined) as Sex | undefined,
                    })
                  }
                  className="mt-1 block min-h-11 w-full border px-2"
                >
                  <option value="">Tous</option>
                  {SEX_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block py-2">
                Taille
                <select
                  value={draft.marime ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      marime: (e.target.value || undefined) as
                        | AnimalSize
                        | undefined,
                    })
                  }
                  className="mt-1 block min-h-11 w-full border px-2"
                >
                  <option value="">Toutes</option>
                  {SIZE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="mt-2">
                <legend className="sr-only">Autres critères</legend>
                {BOOL_FIELDS.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex min-h-11 items-center gap-3 py-1"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(draft[key])}
                      onChange={(e) =>
                        setDraft({ ...draft, [key]: e.target.checked })
                      }
                      className="h-5 w-5"
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
            </div>

            {/* Pied collé en bas, toujours visible sans scroller. */}
            <div className="flex gap-3 border-t p-3">
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="min-h-11 flex-1 border px-4 py-2"
                >
                  Resetează
                </button>
              )}
              <button
                type="button"
                onClick={apply}
                className="min-h-11 flex-1 border-2 border-current px-4 py-2 font-bold"
              >
                Aplică
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
