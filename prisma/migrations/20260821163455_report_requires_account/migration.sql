-- Le signalement exige désormais un compte : la colonne ip disparaît,
-- remplacée par userId (NOT NULL, cascade avec le compte).
--
-- Les signalements déjà en base ont été déposés sans compte : rien ne permet
-- de les rattacher à un userId, et garder leur IP serait précisément ce que
-- cette migration retire. On les supprime avant d'ajouter la colonne, sinon
-- ADD COLUMN … NOT NULL échouerait sur une table non vide. (Au moment de
-- l'écriture, la table de production est vide : 0 ligne.)
DELETE FROM "Report";

-- DropIndex
DROP INDEX "Report_animalId_ip_idx";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "ip",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Report_animalId_userId_idx" ON "Report"("animalId", "userId");

-- CreateIndex
CREATE INDEX "Report_userId_idx" ON "Report"("userId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
