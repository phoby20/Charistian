/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `Creation` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `Creation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Creation" DROP COLUMN "fileUrl",
DROP COLUMN "key";
