"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AgeGroup,
  AnimalSize,
  Sex,
} from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Select } from "@/components/ui/field";
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
import { STR } from "@/lib/strings";

const BOOL_FIELDS: { key: keyof PublicFilters & string; label: string }[] = [
  { key: "sterilizat", label: STR.filters.sterilized },
  { key: "vaccinat", label: STR.filters.vaccinated },
  { key: "cip", label: STR.filters.microchipped },
  { key: "copii", label: STR.filters.goodWithKids },
  { key: "caini", label: STR.filters.goodWithDogs },
  { key: "pisici", label: STR.filters.goodWithCats },
];

/**
 * Champs de filtre partagés par les deux coquilles (sheet mobile, colonne
 * desktop). Édite un brouillon local ; « Appliquer » pousse la nouvelle URL
 * (les filtres vivent dans les searchParams) en repartant à la première
 * page, « Réinitialiser » conserve l'onglet type. Le brouillon se resynchronise
 * au montage : le sheet monte à chaque ouverture, la colonne desktop est
 * remontée par la page via key={filterKey}.
 *
 * `idScope` préfixe les ids des champs : les deux coquilles coexistent dans
 * le DOM (masquées par breakpoint), leurs labels ne doivent pas se croiser.
 */
function FilterPanel({
  filters,
  idScope,
  sheet = false,
  onNavigate,
}: {
  filters: PublicFilters;
  idScope: string;
  /** Coquille sheet : corps scrollable + pied collé, « Appliquer » en primary. */
  sheet?: boolean;
  /** Appelé juste avant router.push — le sheet mobile s'y ferme. */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<PublicFilters>(filters);
  const activeCount = countActiveFilters(filters);

  function navigate(next: PublicFilters) {
    onNavigate?.();
    const qs = serializeFilters(next);
    router.push(qs ? `/animale?${qs}` : "/animale");
  }

  function apply() {
    navigate(draft);
  }

  function reset() {
    // Ne réinitialise que les filtres du panneau : l'onglet type reste.
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

  const fields = (
    <div className="space-y-4">
      <Select
        label={STR.filters.county}
        id={`${idScope}-judet`}
        value={draft.judet ?? ""}
        onChange={(e) =>
          setDraft({
            ...draft,
            judet: (e.target.value || undefined) as CountyCode | undefined,
          })
        }
      >
        <option value="">{STR.filters.countyAll}</option>
        {COUNTIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select
        label={STR.filters.age}
        id={`${idScope}-varsta`}
        value={draft.varsta ?? ""}
        onChange={(e) =>
          setDraft({
            ...draft,
            varsta: (e.target.value || undefined) as AgeGroup | undefined,
          })
        }
      >
        <option value="">{STR.filters.any}</option>
        {AGE_GROUP_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      <Select
        label={STR.filters.sex}
        id={`${idScope}-sex`}
        value={draft.sex ?? ""}
        onChange={(e) =>
          setDraft({
            ...draft,
            sex: (e.target.value || undefined) as Sex | undefined,
          })
        }
      >
        <option value="">{STR.filters.any}</option>
        {SEX_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      <Select
        label={STR.filters.size}
        id={`${idScope}-marime`}
        value={draft.marime ?? ""}
        onChange={(e) =>
          setDraft({
            ...draft,
            marime: (e.target.value || undefined) as AnimalSize | undefined,
          })
        }
      >
        <option value="">{STR.filters.any}</option>
        {SIZE_OPTIONS.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      <fieldset>
        <legend className="sr-only">{STR.filters.otherCriteria}</legend>
        <div className="flex flex-wrap gap-2">
          {BOOL_FIELDS.map(({ key, label }) => (
            <Chip
              key={key}
              selected={Boolean(draft[key])}
              onClick={() => setDraft({ ...draft, [key]: !draft[key] })}
            >
              {label}
            </Chip>
          ))}
        </div>
      </fieldset>
    </div>
  );

  if (sheet) {
    return (
      <>
        <div className="flex-1 overflow-y-auto px-4 py-4">{fields}</div>
        {/* Pied collé en bas, toujours visible sans scroller. Seul primary
            de l'écran : il n'existe que sheet ouvert. */}
        <div className="flex gap-3 border-t border-warm-border p-3">
          {activeCount > 0 && (
            <Button variant="outline" onClick={reset} className="flex-1">
              {STR.filters.reset}
            </Button>
          )}
          <Button variant="primary" onClick={apply} className="flex-1">
            {STR.filters.apply}
          </Button>
        </div>
      </>
    );
  }

  // Colonne toujours visible : aucun bouton plein sur la page au repos
  // (La Règle du Bouton Unique).
  return (
    <>
      {fields}
      <div className="mt-4 flex flex-col gap-2">
        <Button variant="outline" onClick={apply}>
          {STR.filters.apply}
        </Button>
        {activeCount > 0 && (
          <Button variant="ghost" onClick={reset}>
            {STR.filters.reset}
          </Button>
        )}
      </div>
    </>
  );
}

/**
 * Coquille mobile : bouton « Filtrer » (avec pastille encre du nombre de
 * filtres actifs) + bottom sheet. Le sheet est la seule surface détachée du
 * papier : scrim teinté encre et ombre chaude — l'exception prévue par
 * La Règle du Plat.
 */
export function FilterSheet({ filters }: { filters: PublicFilters }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
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

  // Dialogue modal au clavier : focus posé sur « Fermer » à l'ouverture,
  // Échap ferme, Tab reste dans le sheet (aria-modal masque le fond aux
  // lecteurs d'écran — le focus ne doit pas s'y échapper non plus), et le
  // déclencheur récupère le focus à la fermeture.
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    closeRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      const dialog = dialogRef.current;
      if (e.key !== "Tab" || !dialog) return;
      const focusables = dialog.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea",
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <Button
        ref={triggerRef}
        variant="outline"
        onClick={() => setOpen(true)}
        aria-expanded={open}
      >
        {STR.filters.open}
        {activeCount > 0 && (
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-pill bg-warm-ink px-1 text-sm font-semibold text-white">
            {activeCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="fixed inset-0 z-10">
          {/* Scrim cliquable pour fermer — pointeur uniquement : le clavier
              a Échap et le bouton X, un arrêt de tabulation ici serait du
              bruit. aria-modal masque déjà ce fond aux lecteurs d'écran. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-warm-ink/40"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={STR.filters.title}
            className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-[20px] border-t border-warm-border bg-card-ivory text-warm-ink shadow-[0_-8px_30px_color-mix(in_oklab,var(--color-warm-ink)_20%,transparent)]"
          >
            <div className="flex items-center justify-between border-b border-warm-border px-4 py-2">
              <h2 className="text-lg font-semibold text-warm-ink">
                {STR.filters.title}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={STR.filters.close}
                className="flex h-11 w-11 items-center justify-center text-2xl text-warm-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warm-ink"
              >
                ×
              </button>
            </div>
            {/* Monté à l'ouverture : le brouillon repart des filtres de l'URL. */}
            <FilterPanel
              sheet
              filters={filters}
              idScope="sheet"
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Coquille desktop : les mêmes champs en colonne latérale toujours visible,
 * dans une Card posée à plat. La page la monte avec key={filterKey} pour
 * resynchroniser le brouillon quand l'URL change.
 */
export function FilterAside({ filters }: { filters: PublicFilters }) {
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <Card className="p-4">
        <h2 className="mb-4 text-lg font-semibold text-warm-ink">
          {STR.filters.title}
        </h2>
        <FilterPanel filters={filters} idScope="aside" />
      </Card>
    </aside>
  );
}
