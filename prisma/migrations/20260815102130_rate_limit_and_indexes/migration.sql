-- DropIndex
DROP INDEX "Animal_purpose_idx";

-- DropIndex
DROP INDEX "Animal_status_idx";

-- DropIndex
DROP INDEX "AnimalPhoto_animalId_idx";

-- CreateTable
CREATE TABLE "rateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rateLimit_key_key" ON "rateLimit"("key");

-- CreateIndex
CREATE INDEX "Animal_status_updatedAt_id_idx" ON "Animal"("status", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "AnimalPhoto_animalId_position_idx" ON "AnimalPhoto"("animalId", "position");
