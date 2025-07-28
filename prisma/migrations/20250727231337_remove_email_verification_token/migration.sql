/*
  Warnings:

  - You are about to drop the column `emailVerificationToken` on the `ChurchApplication` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ChurchApplication_emailVerificationToken_key";

-- AlterTable
ALTER TABLE "ChurchApplication" DROP COLUMN "emailVerificationToken";
