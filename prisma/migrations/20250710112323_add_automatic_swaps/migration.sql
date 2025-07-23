/*
  Warnings:

  - You are about to drop the column `city` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `clientIP` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `depositAddress` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `exchangeRate` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `feeAmount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `fromAmount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `fromCurrency` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `isHighRisk` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `isMonitoring` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `receivingAddress` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `riskLevel` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `toAmount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `toCurrency` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `amount` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `depositIntentId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Made the column `txHash` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
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
    "status" TEXT NOT NULL,
    "confirmedAmount" REAL,
    "targetCurrency" TEXT,
    "targetNetwork" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_DepositIntent" ("address", "createdAt", "currency", "id", "memo", "network", "status", "updatedAt", "userId") SELECT "address", "createdAt", "currency", "id", "memo", "network", "status", "updatedAt", "userId" FROM "DepositIntent";
DROP TABLE "DepositIntent";
ALTER TABLE "new_DepositIntent" RENAME TO "DepositIntent";
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "txHash" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "depositIntentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_depositIntentId_fkey" FOREIGN KEY ("depositIntentId") REFERENCES "DepositIntent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("createdAt", "id", "status", "txHash", "updatedAt") SELECT "createdAt", "id", "status", "txHash", "updatedAt" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "Transaction"("txHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
