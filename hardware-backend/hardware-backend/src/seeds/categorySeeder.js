import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  'Cement & Concrete', 'Steel & Rebar', 'Pipes & Fittings', 'Paint & Chemicals',
  'Hand Tools', 'Power Tools', 'Electrical', 'Sanitary & Bathroom Fittings',
  'Fasteners (Nails, Screws, Bolts)', 'Timber & Plywood', 'Adhesives & Sealants', 'Safety Equipment',
];

const UNITS = [
  ['Piece', 'pc'], ['Box', 'box'], ['Kilogram', 'kg'], ['Meter', 'm'], ['Litre', 'l'], ['Bag', 'bag'], ['Roll', 'roll'], ['Set', 'set'],
];

export async function seedCategories() {
  try {
    await prisma.$connect();
    
    console.log('  → Seeding categories...');
    for (const name of CATEGORIES) {
      await prisma.category.upsert({ 
        where: { name }, 
        update: {}, 
        create: { name } 
      });
    }

    console.log('  → Seeding units...');
    for (const [name, shortCode] of UNITS) {
      await prisma.unit.upsert({ 
        where: { name }, 
        update: {}, 
        create: { name, shortCode } 
      });
    }
    
    console.log('  ✅ Categories and units seeded');
  } catch (error) {
    console.error('Error in category seeding:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}