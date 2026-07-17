-- CreateEnum
CREATE TYPE "CustomerLedgerTransactionType" AS ENUM ('SALE', 'PAYMENT', 'RETURN', 'ADJUSTMENT', 'OPENING_BALANCE');

-- CreateEnum
CREATE TYPE "SupplierLedgerTransactionType" AS ENUM ('PURCHASE', 'PAYMENT', 'RETURN', 'ADJUSTMENT', 'OPENING_BALANCE');

-- CreateTable
CREATE TABLE "customer_ledgers" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "transactionType" "CustomerLedgerTransactionType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "saleId" TEXT,
    "paymentId" TEXT,
    "returnId" TEXT,
    "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "referenceNo" TEXT NOT NULL,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_ledgers" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "transactionType" "SupplierLedgerTransactionType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "purchaseId" TEXT,
    "paymentId" TEXT,
    "returnId" TEXT,
    "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "referenceNo" TEXT NOT NULL,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_ledgers_customerId_date_idx" ON "customer_ledgers"("customerId", "date");

-- CreateIndex
CREATE INDEX "customer_ledgers_date_idx" ON "customer_ledgers"("date");

-- CreateIndex
CREATE UNIQUE INDEX "customer_ledgers_customerId_referenceNo_transactionType_key" ON "customer_ledgers"("customerId", "referenceNo", "transactionType");

-- CreateIndex
CREATE INDEX "supplier_ledgers_supplierId_date_idx" ON "supplier_ledgers"("supplierId", "date");

-- CreateIndex
CREATE INDEX "supplier_ledgers_date_idx" ON "supplier_ledgers"("date");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_ledgers_supplierId_referenceNo_transactionType_key" ON "supplier_ledgers"("supplierId", "referenceNo", "transactionType");

-- AddForeignKey
ALTER TABLE "customer_ledgers" ADD CONSTRAINT "customer_ledgers_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_ledgers" ADD CONSTRAINT "customer_ledgers_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_ledgers" ADD CONSTRAINT "customer_ledgers_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_ledgers" ADD CONSTRAINT "supplier_ledgers_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_ledgers" ADD CONSTRAINT "supplier_ledgers_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_ledgers" ADD CONSTRAINT "supplier_ledgers_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
