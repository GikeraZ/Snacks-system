-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "deliveryPersonId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "locationType" TEXT NOT NULL,
    "locationDetails" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "assignedAt" DATETIME,
    "pickedAt" DATETIME,
    "deliveredAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_deliveries" ("assignedAt", "createdAt", "customerName", "customerPhone", "deliveredAt", "deliveryPersonId", "id", "locationDetails", "locationType", "notes", "orderId", "pickedAt", "status", "updatedAt") SELECT "assignedAt", "createdAt", "customerName", "customerPhone", "deliveredAt", "deliveryPersonId", "id", "locationDetails", "locationType", "notes", "orderId", "pickedAt", "status", "updatedAt" FROM "deliveries";
DROP TABLE "deliveries";
ALTER TABLE "new_deliveries" RENAME TO "deliveries";
CREATE UNIQUE INDEX "deliveries_orderId_key" ON "deliveries"("orderId");
CREATE TABLE "new_expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "receiptUrl" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_expenses" ("amount", "category", "createdAt", "date", "description", "id", "receiptUrl", "updatedAt", "userId") SELECT "amount", "category", "createdAt", "date", "description", "id", "receiptUrl", "updatedAt", "userId" FROM "expenses";
DROP TABLE "expenses";
ALTER TABLE "new_expenses" RENAME TO "expenses";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
