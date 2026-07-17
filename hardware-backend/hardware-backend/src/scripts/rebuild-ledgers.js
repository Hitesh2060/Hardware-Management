import prisma from '../config/database.js';
import { rebuildCustomerLedger, rebuildSupplierLedger } from '../services/ledgerService.js';

async function rebuildAll() {
  console.log('🔄 Rebuilding all customer ledgers...\n');
  
  const customers = await prisma.customer.findMany();
  if (customers.length === 0) {
    console.log('ℹ️  No customers found.');
  } else {
    for (const customer of customers) {
      try {
        const result = await rebuildCustomerLedger(customer.id);
        console.log(`✅ ${customer.name}: ${result.totalEntries} entries`);
      } catch (error) {
        console.error(`❌ ${customer.name}:`, error.message);
      }
    }
  }

  console.log('\n🔄 Rebuilding all supplier ledgers...\n');
  
  const suppliers = await prisma.supplier.findMany();
  if (suppliers.length === 0) {
    console.log('ℹ️  No suppliers found.');
  } else {
    for (const supplier of suppliers) {
      try {
        const result = await rebuildSupplierLedger(supplier.id);
        console.log(`✅ ${supplier.name}: ${result.totalEntries} entries`);
      } catch (error) {
        console.error(`❌ ${supplier.name}:`, error.message);
      }
    }
  }

  console.log('\n✅ All ledgers rebuilt!');
  await prisma.$disconnect();
}

rebuildAll();