/*
  Warnings:

  - You are about to drop the column `position` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "phone" TEXT,
    "kakaoId" TEXT,
    "lineId" TEXT,
    "address" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "gender" TEXT NOT NULL,
    "profileImage" TEXT,
    "role" TEXT NOT NULL DEFAULT 'GENERAL',
    "churchId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'APPROVED',
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("address", "birthDate", "churchId", "city", "country", "createdAt", "email", "gender", "id", "kakaoId", "lineId", "name", "password", "phone", "profileImage", "region", "rejectionReason", "role", "state", "updatedAt") SELECT "address", "birthDate", "churchId", "city", "country", "createdAt", "email", "gender", "id", "kakaoId", "lineId", "name", "password", "phone", "profileImage", "region", "rejectionReason", "role", "state", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
