import asyncHandler from '../utils/asyncHandler.js';

/** PLACEHOLDER MODULE. See rawMaterialController.js — same reasoning applies. */
export const notImplemented = asyncHandler(async (req, res) => {
  res.status(501).json({
    success: false,
    statusCode: 501,
    message:
      'Production runs are not part of the current schema (retail resale only). ' +
      'Extend the schema with RawMaterial + BillOfMaterials + ProductionRun models to enable this module.',
  });
});
