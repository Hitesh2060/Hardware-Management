import asyncHandler from '../utils/asyncHandler.js';

/**
 * PLACEHOLDER MODULE.
 * RawMaterial / Production only make sense if this shop also *manufactures*
 * something (e.g. mixing paint, cutting keys/glass, assembling kits) rather
 * than purely reselling stocked products. Nothing in the 14-step spec or the
 * Prisma schema defines a RawMaterial or BillOfMaterials model, so there's
 * no real data to serve here yet.
 *
 * If you do have a production/assembly workflow, tell me what it looks like
 * and I'll add:
 *   - RawMaterial model (its own stock, tracked through the same StockMovement
 *     ledger as Product)
 *   - BillOfMaterials (which raw materials + quantities produce one Product)
 *   - A "Production Run" flow that consumes raw-material stock and adds
 *     finished-product stock via applyStockAdjustment-style ledger entries
 *
 * Until then this route responds honestly instead of returning fake data.
 */
export const notImplemented = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    statusCode: 501,
    message:
      'Raw materials / production are not part of the current schema (retail resale only). ' +
      'Extend prisma/schema.prisma with a RawMaterial + BillOfMaterials model to enable this module.',
  });
});
