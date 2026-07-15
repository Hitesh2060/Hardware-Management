import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CUSTOMERS = [
  { name: 'Ram Shrestha', phone: '9801111111', email: 'ram@email.com', address: 'Kathmandu, Nepal' },
  { name: 'Sita Thapa', phone: '9802222222', email: 'sita@email.com', address: 'Pokhara, Nepal' },
  { name: 'Hari Gurung', phone: '9803333333', email: 'hari@email.com', address: 'Lalitpur, Nepal' },
  { name: 'Gita Adhikari', phone: '9804444444', email: 'gita@email.com', address: 'Biratnagar, Nepal' },
  { name: 'Krishna Poudel', phone: '9805555555', email: 'krishna@email.com', address: 'Bhaktapur, Nepal' },
  { name: 'Maya Rana', phone: '9806666666', email: 'maya@email.com', address: 'Butwal, Nepal' },
];

export async function seedCustomers() {
  console.log('  → Seeding customers...');
  
  for (const customerData of CUSTOMERS) {
    const existing = await prisma.customer.findFirst({
      where: { name: customerData.name }
    });
    
    if (!existing) {
      await prisma.customer.create({
        data: customerData,
      });
    }
  }
  
  console.log(`  ✅ ${CUSTOMERS.length} customers seeded`);
}