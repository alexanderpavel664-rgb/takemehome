"use client";

import { useActionState } from "react";
import { REPORT_REASON_OPTIONS } from "@/lib/animal-labels";
import { STR } from "@/lib/strings";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/field";
import { createReport, type ReportFormState } from "./actions";

/**
 * Formulaire court : un motif, un champ libre facultatif, un bouton. Rien
 * d'autre — celui qui signale rend service, on ne lui fait pas remplir un
 * dossier. Aucun champ d'identité : le signalement se fait sans compte.
 *
 * Le titre vit DANS la carte, comme sur /login et /inregistrare : la carte
 * est le bloc entier, et la confirmation la remplace d'un coup — titre
 * compris, sinon « Semnalezi anunțul… » resterait à l'écran après l'envoi.
 */
export function ReportForm({
  animalId,
  animalName,
  animalHref,
}: {
  animalId: string;
  animalName: string;
  animalHref: string;
}) {
  const [state, formAction, pending] = useActionState<
    ReportFormState,
    FormData
  >(createReport, null);

  if (state?.sent) {
    return (
      <Card className="mx-auto w-full max-w-lg p-6" role="status">
        <h1 className="text-2xl font-semibold text-warm-ink">
          {STR.report.sentTitle}
        </h1>
        <p className="mt-2 text-base text-warm-ink">
          {STR.report.sentDescription}
        </p>
        {/* Aucun état ne laisse sans chemin (La Règle de la Sortie). */}
        <ButtonLink variant="outline" href={animalHref} className="mt-6">
          {STR.report.back}
        </ButtonLink>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-lg p-6">
      <h1 className="text-2xl font-semibold text-warm-ink">
        {STR.report.title(animalName)}
      </h1>
      <p className="mt-2 text-base text-warm-gray">{STR.report.intro}</p>
      <form action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="animalId" value={animalId} />
        <Select
          label={STR.report.reason}
          id="reason"
          name="reason"
          defaultValue=""
          required
          error={state?.fieldErrors?.reason}
        >
          <option value="" disabled>
            {STR.report.reasonPlaceholder}
          </option>
          {REPORT_REASON_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Textarea
          label={STR.report.message}
          id="message"
          name="message"
          rows={4}
          maxLength={1000}
          placeholder={STR.report.messagePlaceholder}
          error={state?.fieldErrors?.message}
        />
        {state?.formError && (
          <p role="alert" className="text-sm font-semibold text-warm-ink">
            {state.formError}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? STR.report.submitPending : STR.report.submit}
          </Button>
          <ButtonLink variant="ghost" href={animalHref}>
            {STR.report.back}
          </ButtonLink>
        </div>
      </form>
    </Card>
  );
}
