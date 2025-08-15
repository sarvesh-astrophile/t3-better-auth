-- CreateTable
CREATE TABLE "twoFactor" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "secret" TEXT NOT NULL,
    "digits" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "algorithm" TEXT NOT NULL,
    "backups" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
