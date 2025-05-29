/*
  Warnings:

  - Added the required column `city` to the `ChurchApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region` to the `ChurchApplication` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChurchApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "churchName" TEXT NOT NULL,
    "superAdminEmail" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPosition" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactGender" TEXT NOT NULL,
    "contactBirthDate" DATETIME NOT NULL,
    "contactImage" TEXT,
    "churchPhone" TEXT NOT NULL,
    "buildingImage" TEXT,
    "plan" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ChurchApplication" ("address", "buildingImage", "churchName", "churchPhone", "contactBirthDate", "contactGender", "contactImage", "contactName", "contactPhone", "contactPosition", "country", "createdAt", "id", "password", "plan", "rejectionReason", "state", "superAdminEmail", "updatedAt") SELECT "address", "buildingImage", "churchName", "churchPhone", "contactBirthDate", "contactGender", "contactImage", "contactName", "contactPhone", "contactPosition", "country", "createdAt", "id", "password", "plan", "rejectionReason", "state", "superAdminEmail", "updatedAt" FROM "ChurchApplication";
DROP TABLE "ChurchApplication";
ALTER TABLE "new_ChurchApplication" RENAME TO "ChurchApplication";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
