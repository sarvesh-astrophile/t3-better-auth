/*
  Warnings:

  - You are about to drop the column `backups` on the `twoFactor` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_twoFactor" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "secret" TEXT NOT NULL,
    "digits" INTEGER,
    "period" INTEGER,
    "algorithm" TEXT,
    "backupCodes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_twoFactor" ("algorithm", "createdAt", "digits", "period", "secret", "userId") SELECT "algorithm", "createdAt", "digits", "period", "secret", "userId" FROM "twoFactor";
DROP TABLE "twoFactor";
ALTER TABLE "new_twoFactor" RENAME TO "twoFactor";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
