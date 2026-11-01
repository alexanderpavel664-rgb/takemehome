import type { AgeGroup, AnimalType, Sex } from "@/generated/prisma/client";
import { animalSubject, type AnimalIdentity } from "@/lib/animal-display";
import { countyName } from "@/lib/counties";
import { STR } from "@/lib/strings";

/**
 * Le kit de partage : ce que le publiant poste lui-même dans le groupe
 * d'adoption de sa ville. Module pur, lu aussi par le navigateur ; l'image
 * vit dans lib/kit-image.tsx, réservé au serveur.
 */

export const KIT_FORMATS = ["4x5", "9x16"] as const;
export type KitFormat = (typeof KIT_FORMATS)[number];

// En dessous, la description ne raconte pas grand-chose : la phrase d'ouverture
// la précède (ou la remplace si elle est vide).
const SHORT_DESCRIPTION = 40;

type KitAnimal = AnimalIdentity & {
  sex: Sex | null;
  ageGroup: AgeGroup | null;
  city: string | null;
  county: string;
  description: string | null;
};

/**
 * « acest cățel », accordé au type, à l'âge, au sexe et au nombre. Les mots
 * sont ceux du site (cățel, câine, pui, pisică, animal), plus les deux qui lui
 * manquent pour accorder le sexe : cățelușă et motan. Âge ou sexe inconnu : le
 * mot le plus général du type.
 */
export function kitSubject(animal: {
  type: AnimalType;
  count: number;
  sex: Sex | null;
  ageGroup: AgeGroup | null;
}): string {
  const { type, count, sex, ageGroup } = animal;
  const baby = ageGroup === "BABY";
  const words = STR.kit.subject;
  if (count > 1) {
    return baby ? words.babies : words.many[type];
  }
  if (baby) {
    return words.baby;
  }
  if (type === "DOG") {
    if (sex === "FEMALE") {
      return words.femaleDog;
    }
    return ageGroup === "ADULT" || ageGroup === "SENIOR"
      ? words.adultDog
      : words.dog;
  }
  if (type === "CAT") {
    return sex === "MALE" ? words.maleCat : words.cat;
  }
  return words.animal;
}

/**
 * Le texte à copier : l'histoire d'abord, l'appel au partage, le lien à la fin.
 * Aucune liste de caractéristiques. Une description courte ou vide reçoit une
 * phrase d'ouverture : le texte reste modifiable avant d'être copié.
 */
export function kitText(animal: KitAnimal, url: string): string {
  const description = animal.description?.replace(/\r\n/g, "\n").trim() ?? "";
  const county = countyName(animal.county);
  const opening = STR.kit.opening(
    animalSubject(animal),
    animal.city?.trim() || county,
  );
  const story =
    description.length >= SHORT_DESCRIPTION
      ? description
      : [opening, description].filter(Boolean).join("\n\n");
  return [story, STR.kit.call(county, kitSubject(animal)), url].join("\n\n");
}
