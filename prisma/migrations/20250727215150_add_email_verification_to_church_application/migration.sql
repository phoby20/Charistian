/*
  Warnings:

  - A unique constraint covering the columns `[emailVerificationToken]` on the table `ChurchApplication` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ChurchApplication" ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "ChurchApplication_emailVerificationToken_key" ON "ChurchApplication"("emailVerificationToken");
