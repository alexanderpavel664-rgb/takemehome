import type { AgeGroup, AnimalType, Sex } from "@/generated/prisma/client";
import {
  AGE_GROUP_LABELS,
  SEX_LABELS,
  TYPE_LABELS,
} from "@/lib/animal-labels";

/**
 * « Chien · Mâle · 3 ans » — la ligne des cartes et de la fiche.
 * Les champs non renseignés sont omis ; l'âge libre (ageText) prime sur
 * la tranche d'âge.
 */
export function animalMetaLine(animal: {
  type: AnimalType;
  sex: Sex | null;
  ageGroup: AgeGroup | null;
  ageText: string | null;
}): string {
  const age =
    animal.ageText?.trim() ||
    (animal.ageGroup ? AGE_GROUP_LABELS[animal.ageGroup] : null);
  return [
    TYPE_LABELS[animal.type],
    animal.sex ? SEX_LABELS[animal.sex] : null,
    age,
  ]
    .filter(Boolean)
    .join(" · ");
}
