-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DepositIntent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "memo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_DepositIntent" ("address", "createdAt", "currency", "id", "memo", "network", "status", "updatedAt", "userId") SELECT "address", "createdAt", "currency", "id", "memo", "network", "status", "updatedAt", "userId" FROM "DepositIntent";
DROP TABLE "DepositIntent";
ALTER TABLE "new_DepositIntent" RENAME TO "DepositIntent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
