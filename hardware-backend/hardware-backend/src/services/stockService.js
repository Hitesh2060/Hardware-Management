import ApiError from '../utils/ApiError.js';

/**
 * =============================================================================
 * STOCK ENGINE
 * -----------------------------------------------------------------------------
 * RULE #1: Product.quantityOnHand does not exist as a column. It is ALWAYS
 * derived by summing signed StockMovement.quantity rows for that product.
 * This gives us a full, tamper-evident, replayable audit trail (same
 * approach SAP/Oracle use internally) instead of a mutable counter that can
 * drift out of sync with reality.
 *
 * RULE #2: Every function here MUST be called with `tx` — the Prisma
 * transaction client from the caller (e.g. salesOrderService.js wraps "create
 * sale + reduce stock + record payment" in one prisma.$transaction). Never
 * call these with the bare `prisma` client for a mutation, or a crash
 * mid-way could leave stock and the source document out of sync.
 *
 * Sign convention:
 *   IN  movements -> positive quantity (Purchase, CustomerReturn, AdjustmentIn,
 *                    TransferIn, Opening, CancellationReversal of a sale)
 *   OUT movements -> negative quantity (Sale, SupplierReturn, Damage,
 *                    AdjustmentOut, TransferOut, CancellationReversal of a purchase)
 * =============================================================================
 */

/** Returns current on-hand quantity for a product (fast path via aggregate). */
export async function getCurrentStock(tx, productId) {
  const result = await tx.stockMovement.aggregate({
    where: { productId },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

/**
 * Records one stock movement and stamps it with the running balance.
 * This is the ONLY function in the codebase that should ever write to
 * StockMovement — every module (purchase, sale, return, damage, adjustment)
 * calls this instead of touching the table directly.
 */
// Find this function in your stockService.js and update it
async function recordMovement(tx, { 
  productId, 
  type, 
  quantitySigned, 
  unitCost, 
  totalValue,
  reference, 
  createdById, 
  note 
}) {
  const currentBalance = await getCurrentStock(tx, productId);
  const balanceAfter = Number(currentBalance) + Number(quantitySigned);

  // If unitCost or totalValue not provided, calculate from product
  let finalUnitCost = unitCost;
  let finalTotalValue = totalValue;
  
  if (!finalUnitCost) {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { costPrice: true },
    });
    finalUnitCost = product ? Number(product.costPrice) : 0;
    finalTotalValue = quantitySigned * finalUnitCost;
  }

  return tx.stockMovement.create({
    data: {
      productId,
      type,
      quantity: quantitySigned,
      balanceAfter,
      unitCost: finalUnitCost,
      totalValue: finalTotalValue,
      referenceType: reference.type,
      referenceId: reference.id,
      purchaseId: reference.type === 'Purchase' ? reference.id : undefined,
      saleId: reference.type === 'Sale' ? reference.id : undefined,
      returnId: reference.type === 'Return' ? reference.id : undefined,
      damageItemId: reference.type === 'Damage' ? reference.id : undefined,
      stockAdjustmentId: reference.type === 'StockAdjustment' ? reference.id : undefined,
      note,
      createdById,
    },
  });
}

/**
 * PURCHASE -> stock IN.
 * Example: purchase 50 units of "Cement 50kg" -> +50 movement.
 * Called once per PurchaseItem inside purchaseOrderService.js's transaction.
 */
export async function applyPurchaseStock(tx, { productId, quantity, purchaseId, createdById }) {
  return recordMovement(tx, {
    productId,
    type: 'PURCHASE',
    quantitySigned: quantity, // positive
    reference: { type: 'Purchase', id: purchaseId },
    createdById,
  });
}

/**
 * SALE -> stock OUT. Validates sufficient stock first (no negative stock
 * unless explicitly allowed by business rule — see allowNegativeStock).
 * Example: sell 5 units -> -5 movement. Selling 10 when only 3 in stock throws.
 */
export async function applySaleStock(
  tx,
  { productId, quantity, saleId, createdById, allowNegativeStock = false }
) {
  const current = await getCurrentStock(tx, productId);
  if (!allowNegativeStock && Number(current) < Number(quantity)) {
    throw ApiError.badRequest(
      `Insufficient stock for product ${productId}. Available: ${current}, requested: ${quantity}`
    );
  }
  return recordMovement(tx, {
    productId,
    type: 'SALE',
    quantitySigned: -Math.abs(Number(quantity)),
    reference: { type: 'Sale', id: saleId },
    createdById,
  });
}

/**
 * CUSTOMER RETURN -> stock IN (goods physically come back to the shop).
 * Example: customer returns 2 of the 5 units sold -> +2 movement.
 */
export async function applyCustomerReturnStock(tx, { productId, quantity, returnId, createdById }) {
  return recordMovement(tx, {
    productId,
    type: 'CUSTOMER_RETURN',
    quantitySigned: Math.abs(Number(quantity)),
    reference: { type: 'Return', id: returnId },
    createdById,
  });
}

/**
 * SUPPLIER RETURN -> stock OUT (we send defective/excess goods back).
 * Example: return 3 damaged units to supplier -> -3 movement.
 */
export async function applySupplierReturnStock(tx, { productId, quantity, returnId, createdById }) {
  const current = await getCurrentStock(tx, productId);
  if (Number(current) < Number(quantity)) {
    throw ApiError.badRequest(`Cannot return ${quantity} units — only ${current} in stock`);
  }
  return recordMovement(tx, {
    productId,
    type: 'SUPPLIER_RETURN',
    quantitySigned: -Math.abs(Number(quantity)),
    reference: { type: 'Return', id: returnId },
    createdById,
  });
}

/**
 * DAMAGE -> stock OUT. Example: 1 bag of cement torn/wet in the warehouse
 * -> -1 movement, plus a DamageItem record capturing the cost loss for the
 * "Damage/Loss" report.
 */
export async function applyDamageStock(tx, { productId, quantity, damageItemId, createdById }) {
  const current = await getCurrentStock(tx, productId);
  if (Number(current) < Number(quantity)) {
    throw ApiError.badRequest(`Cannot mark ${quantity} units damaged — only ${current} in stock`);
  }
  return recordMovement(tx, {
    productId,
    type: 'DAMAGE',
    quantitySigned: -Math.abs(Number(quantity)),
    reference: { type: 'Damage', id: damageItemId },
    createdById,
  });
}

/**
 * MANUAL ADJUSTMENT -> stock IN or OUT, always requires a reason (enforced
 * at the schema/validation level in stockAdjustmentValidation.js). Used for physical
 * stock-count corrections. Example: annual stock count finds 2 extra units
 * -> ADJUSTMENT_IN +2. Finds 1 missing unit -> ADJUSTMENT_OUT -1.
 */
export async function applyStockAdjustment(tx, { productId, type, quantity, stockAdjustmentId, createdById }) {
  const signed = type === 'INCREASE' ? Math.abs(Number(quantity)) : -Math.abs(Number(quantity));

  if (type === 'DECREASE') {
    const current = await getCurrentStock(tx, productId);
    if (Number(current) < Number(quantity)) {
      throw ApiError.badRequest(`Cannot decrease ${quantity} units — only ${current} in stock`);
    }
  }

  return recordMovement(tx, {
    productId,
    type: type === 'INCREASE' ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
    quantitySigned: signed,
    reference: { type: 'StockAdjustment', id: stockAdjustmentId },
    createdById,
  });
}

/**
 * OPENING STOCK -> stock IN, one-time, when a product is first added to the
 * system with existing physical inventory. Example: new product added to
 * the system, shop already has 20 units on the shelf -> +20 OPENING movement.
 */
export async function applyOpeningStock(tx, { productId, quantity, createdById, note }) {
  return recordMovement(tx, {
    productId,
    type: 'OPENING',
    quantitySigned: Math.abs(Number(quantity)),
    reference: { type: 'Opening', id: productId },
    createdById,
    note: note || 'Opening stock on product creation',
  });
}

/**
 * TRANSFER (single-branch v1 stub for future Multi-Branch module).
 * TRANSFER_OUT at the source, TRANSFER_IN at the destination — always as a
 * pair inside one transaction so total system-wide stock is unchanged.
 */
export async function applyTransfer(tx, { productId, quantity, fromRefId, toRefId, createdById }) {
  const current = await getCurrentStock(tx, productId);
  if (Number(current) < Number(quantity)) {
    throw ApiError.badRequest(`Cannot transfer ${quantity} units — only ${current} in stock`);
  }
  const out = await recordMovement(tx, {
    productId,
    type: 'TRANSFER_OUT',
    quantitySigned: -Math.abs(Number(quantity)),
    reference: { type: 'Transfer', id: fromRefId },
    createdById,
  });
  const inMove = await recordMovement(tx, {
    productId,
    type: 'TRANSFER_IN',
    quantitySigned: Math.abs(Number(quantity)),
    reference: { type: 'Transfer', id: toRefId },
    createdById,
  });
  return { out, in: inMove };
}

/**
 * CANCELLATION -> exact reversal of a Sale or Purchase's stock effect.
 * Example: a completed sale of 5 units is cancelled -> +5 reversal movement
 * (mirrors the original -5 SALE movement). We never delete/edit the
 * original movement row (immutable ledger) — we append a reversal instead,
 * so history always shows what actually happened and when.
 */
export async function applyCancellationReversal(tx, { productId, quantity, originalType, referenceId, createdById }) {
  // If the original was an OUT movement (Sale), the reversal is IN, and vice versa.
  const outboundTypes = ['SALE', 'SUPPLIER_RETURN', 'DAMAGE', 'ADJUSTMENT_OUT', 'TRANSFER_OUT'];
  const isReversingOutbound = outboundTypes.includes(originalType);
  const signed = isReversingOutbound ? Math.abs(Number(quantity)) : -Math.abs(Number(quantity));

  return recordMovement(tx, {
    productId,
    type: 'CANCELLATION_REVERSAL',
    quantitySigned: signed,
    reference: { type: 'Cancellation', id: referenceId },
    createdById,
    note: `Reversal of ${originalType} for reference ${referenceId}`,
  });
}

/** Stock ledger for a product — powers the "Stock Card" / audit view. */
export async function getStockLedger(tx, productId, { from, to } = {}) {
  return tx.stockMovement.findMany({
    where: {
      productId,
      createdAt: { gte: from, lte: to },
    },
    orderBy: { createdAt: 'asc' },
  });
}
