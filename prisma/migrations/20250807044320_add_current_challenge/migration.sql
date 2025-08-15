/*
  Warnings:

  - You are about to drop the `twoFactor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `authenticator` table. All the data in the column will be lost.
  - You are about to drop the column `publicKey` on the `authenticator` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `authenticator` table. All the data in the column will be lost.
  - You are about to alter the column `counter` on the `authenticator` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - Added the required column `credentialPublicKey` to the `authenticator` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `authenticator` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN "currentChallenge" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "twoFactor";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_authenticator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "credentialID" TEXT NOT NULL,
    "credentialPublicKey" BLOB NOT NULL,
    "counter" BIGINT NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_authenticator" ("counter", "credentialBackedUp", "credentialDeviceType", "credentialID", "id", "transports", "userId") SELECT "counter", "credentialBackedUp", "credentialDeviceType", "credentialID", "id", "transports", "userId" FROM "authenticator";
DROP TABLE "authenticator";
ALTER TABLE "new_authenticator" RENAME TO "authenticator";
CREATE UNIQUE INDEX "authenticator_credentialID_key" ON "authenticator"("credentialID");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
