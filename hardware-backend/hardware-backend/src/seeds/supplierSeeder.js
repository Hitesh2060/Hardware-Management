import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUPPLIERS = [
  { name: 'Shree Cement Pvt Ltd', phone: '9801234567', email: 'info@shreecement.com', address: 'Kathmandu, Nepal' },
  { name: 'Jal Shakti Pipes & Fittings', phone: '9812345678', email: 'sales@jalshakti.com', address: 'Biratnagar, Nepal' },
  { name: 'Nepal Steel Industries', phone: '9823456789', email: 'info@nepalsteel.com', address: 'Hetauda, Nepal' },
  { name: 'Everest Hardware Distributors', phone: '9834567890', email: 'info@everesthardware.com', address: 'Pokhara, Nepal' },
  { name: 'Himalayan Paints & Chemicals', phone: '9845678901', email: 'sales@himalayanpaints.com', address: 'Bhaktapur, Nepal' },
  { name: 'Gorkha Power Tools', phone: '9856789012', email: 'info@gorkhatools.com', address: 'Lalitpur, Nepal' },
];

export async function seedSuppliers() {
  console.log('  → Seeding suppliers...');
  
  for (const supplierData of SUPPLIERS) {
    // Check if supplier already exists by name
    const existing = await prisma.supplier.findFirst({
      where: { name: supplierData.name }
    });
    
    if (!existing) {
      await prisma.supplier.create({
        data: supplierData,
      });
    }
  }
  
  console.log(`  ✅ ${SUPPLIERS.length} suppliers seeded`);
}