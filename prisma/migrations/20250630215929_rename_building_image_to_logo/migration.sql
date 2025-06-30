/*
  Warnings:

  - You are about to drop the column `buildingImage` on the `Church` table. All the data in the column will be lost.
  - You are about to drop the column `buildingImage` on the `ChurchApplication` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Church" DROP COLUMN "buildingImage",
ADD COLUMN     "logo" TEXT;

-- AlterTable
ALTER TABLE "ChurchApplication" DROP COLUMN "buildingImage",
ADD COLUMN     "logo" TEXT;
