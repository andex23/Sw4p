-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "fromAmount" REAL NOT NULL,
    "toAmount" REAL NOT NULL,
    "feeAmount" REAL NOT NULL DEFAULT 0,
    "depositAddress" TEXT NOT NULL,
    "receivingAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "exchangeRate" REAL NOT NULL,
    "txHash" TEXT,
    "completedAt" DATETIME,
    "clientIP" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "riskLevel" TEXT,
    "isHighRisk" BOOLEAN NOT NULL DEFAULT false,
    "isMonitoring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transactionId_key" ON "Transaction"("transactionId");
