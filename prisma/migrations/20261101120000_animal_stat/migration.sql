-- CreateTable
CREATE TABLE "AnimalStat" (
    "animalId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AnimalStat_pkey" PRIMARY KEY ("animalId","day")
);

-- AddForeignKey
ALTER TABLE "AnimalStat" ADD CONSTRAINT "AnimalStat_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
