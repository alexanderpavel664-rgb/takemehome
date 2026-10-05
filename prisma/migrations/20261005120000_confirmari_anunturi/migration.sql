-- Confirmation des annonces (octobre 2026). Une annonce ne reste disponible
-- que tant que quelqu'un le confirme : email au publiant après 21 jours sans
-- mise à jour, relance 14 jours plus tard, puis statut UNCONFIRMED 14 jours
-- après la relance (lib/confirmations.ts).
--
-- Changements purement additifs. Le code déployé avant cette migration
-- continue de fonctionner : il ne lit pas les nouvelles colonnes, et aucune
-- ligne ne reçoit le statut UNCONFIRMED tant que la tâche planifiée n'est
-- pas activée (CONFIRMARI_ACTIVE), donc jamais avant le déploiement du code
-- qui sait le lire.
--
-- ADD VALUE dans une transaction : admis depuis PostgreSQL 12, à condition
-- de ne pas utiliser la nouvelle valeur dans la même transaction — ce que
-- cette migration ne fait pas.

-- CreateEnum
CREATE TYPE "AdoptionSource" AS ENUM ('TAKEMEHOME', 'ELSEWHERE', 'UNKNOWN');

-- AlterEnum
ALTER TYPE "AnimalStatus" ADD VALUE 'UNCONFIRMED';

-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "adoptionSource" "AdoptionSource",
ADD COLUMN     "confirmReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "confirmRequestedAt" TIMESTAMP(3),
ADD COLUMN     "confirmSentAt" TIMESTAMP(3);
