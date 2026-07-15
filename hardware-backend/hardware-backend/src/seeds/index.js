import 'dotenv/config';
import { seedAdmin } from './adminSeeder.js';
import { seedCategories } from './categorySeeder.js';
import { seedProducts } from './productSeeder.js';
import { seedSuppliers } from './supplierSeeder.js';
import { seedCustomers } from './customerSeeder.js';

async function main() {
  console.log('🌱 Seeding database...\n');

  try {
    console.log('1. Admin/roles/permissions');
    await seedAdmin();

    console.log('\n2. Categories & units');
    await seedCategories();

    console.log('\n3. Suppliers');
    await seedSuppliers();

    console.log('\n4. Customers');
    await seedCustomers();

    console.log('\n5. Sample products');
    await seedProducts();

    console.log('\n✅ Seed complete.');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

main();