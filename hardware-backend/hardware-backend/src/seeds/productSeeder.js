import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_PRODUCTS = [
  { sku: 'CEM-OPC-50KG', name: 'OPC Cement 50kg Bag', category: 'Cement & Concrete', unit: 'Bag', costPrice: 780, sellingPrice: 950, reorderLevel: 20, openingStock: 100 },
  { sku: 'STL-REBAR-12MM', name: 'Steel Rebar 12mm (per meter)', category: 'Steel & Rebar', unit: 'Meter', costPrice: 145, sellingPrice: 175, reorderLevel: 200, openingStock: 500 },
  { sku: 'PVC-PIPE-1IN', name: 'PVC Pipe 1 inch', category: 'Pipes & Fittings', unit: 'Piece', costPrice: 220, sellingPrice: 280, reorderLevel: 15, openingStock: 60 },
  { sku: 'PAINT-EMU-4L', name: 'Emulsion Paint 4L', category: 'Paint & Chemicals', unit: 'Piece', costPrice: 1450, sellingPrice: 1850, reorderLevel: 5, openingStock: 25 },
  { sku: 'HAMMER-CLAW-16OZ', name: 'Claw Hammer 16oz', category: 'Hand Tools', unit: 'Piece', costPrice: 380, sellingPrice: 550, reorderLevel: 8, openingStock: 20 },
  { sku: 'SCREW-WOOD-1IN-BOX', name: 'Wood Screws 1 inch (box of 100)', category: 'Fasteners (Nails, Screws, Bolts)', unit: 'Box', costPrice: 210, sellingPrice: 280, reorderLevel: 10, openingStock: 40 },
];

export async function seedProducts() {
  console.log('  → Seeding sample products (with opening stock)...');

  // Need a system user to attribute the opening-stock movement to.
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@hardwareims.local' } });
  if (!adminUser) {
    console.warn('  ⚠️  Skipping product seed — run seedAdmin() first (no admin user found).');
    return;
  }

  for (const p of SAMPLE_PRODUCTS) {
    const category = await prisma.category.findUnique({ where: { name: p.category } });
    const unit = await prisma.unit.findUnique({ where: { name: p.unit } });
    if (!category || !unit) {
      console.warn(`  ⚠️  Skipping "${p.name}" — category/unit not found. Run seedCategories() first.`);
      continue;
    }

    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (existing) continue;

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: p.sku,
          name: p.name,
          categoryId: category.id,
          unitId: unit.id,
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
          reorderLevel: p.reorderLevel,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: 'OPENING',
          quantity: p.openingStock,
          balanceAfter: p.openingStock,
          referenceType: 'Opening',
          referenceId: product.id,
          createdById: adminUser.id,
          note: 'Seed data opening stock',
        },
      });
    });
  }
}
