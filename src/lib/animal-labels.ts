import type {
  AgeGroup,
  AnimalSize,
  AnimalStatus,
  AnimalType,
  ReportReason,
  ReportStatus,
  Sex,
} from "@/generated/prisma/client";
import { STR } from "@/lib/strings";

// Les libellés eux-mêmes vivent dans strings.ts (le fichier unique de toutes
// les chaînes) ; ce module ne fait qu'exposer les Records typés et les paires
// [valeur, libellé] prêtes pour les <option>.

export const TYPE_LABELS: Record<AnimalType, string> = STR.enums.type;

export const SEX_LABELS: Record<Sex, string> = STR.enums.sex;

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = STR.enums.ageGroup;

export const SIZE_LABELS: Record<AnimalSize, string> = STR.enums.size;

export const STATUS_LABELS: Record<AnimalStatus, string> = STR.enums.status;

export const REPORT_REASON_LABELS: Record<ReportReason, string> =
  STR.enums.reportReason;

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> =
  STR.enums.reportStatus;

export const TYPE_OPTIONS = Object.entries(TYPE_LABELS) as [
  AnimalType,
  string,
][];
export const SEX_OPTIONS = Object.entries(SEX_LABELS) as [Sex, string][];

/**
 * Les sexes qu'on peut filtrer : Mascul et Femelă. « Mixt » n'est pas un
 * filtre — c'est une fratrie mélangée, qui contient des mâles ET des
 * femelles : elle sort avec l'un comme avec l'autre (publicWhere).
 */
export type FilterSex = Exclude<Sex, "MIXED">;
export const FILTER_SEX_LABELS: Record<FilterSex, string> = {
  MALE: SEX_LABELS.MALE,
  FEMALE: SEX_LABELS.FEMALE,
};
export const FILTER_SEX_OPTIONS = Object.entries(FILTER_SEX_LABELS) as [
  FilterSex,
  string,
][];
export const AGE_GROUP_OPTIONS = Object.entries(AGE_GROUP_LABELS) as [
  AgeGroup,
  string,
][];
export const SIZE_OPTIONS = Object.entries(SIZE_LABELS) as [
  AnimalSize,
  string,
][];
/**
 * Les statuts que le publiant choisit lui-même. UNCONFIRMED n'en fait pas
 * partie : seule la tâche de confirmation le pose (lib/confirmations.ts),
 * et le publiant en sort en repassant à AVAILABLE.
 */
export type PublisherStatus = Exclude<AnimalStatus, "UNCONFIRMED">;
export const PUBLISHER_STATUS = {
  AVAILABLE: "AVAILABLE",
  ADOPTED: "ADOPTED",
} as const satisfies Record<PublisherStatus, PublisherStatus>;
export const STATUS_OPTIONS = Object.values(PUBLISHER_STATUS).map(
  (status) => [status, STATUS_LABELS[status]],
) as [PublisherStatus, string][];
export const REPORT_REASON_OPTIONS = Object.entries(REPORT_REASON_LABELS) as [
  ReportReason,
  string,
][];
