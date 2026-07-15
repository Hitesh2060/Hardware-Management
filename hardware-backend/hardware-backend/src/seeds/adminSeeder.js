import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Every permission code referenced anywhere by requirePermission() across
// the routes/*.js files MUST be listed here, or that route becomes
// unreachable for every role (including ADMIN) until reseeded.
const PERMISSIONS = [
  ['product.view', 'product'], ['product.create', 'product'], ['product.update', 'product'], ['product.delete', 'product'],
  ['purchase.view', 'purchase'], ['purchase.create', 'purchase'], ['purchase.cancel', 'purchase'],
  ['sale.view', 'sale'], ['sale.create', 'sale'], ['sale.void', 'sale'],
  ['supplier.view', 'supplier'], ['supplier.create', 'supplier'], ['supplier.update', 'supplier'], ['supplier.delete', 'supplier'],
  ['customer.view', 'customer'], ['customer.create', 'customer'], ['customer.update', 'customer'], ['customer.delete', 'customer'],
  ['stock.adjust', 'stock'],
  ['payment.view', 'payment'], ['payment.create', 'payment'],
  ['dashboard.view', 'dashboard'],
  ['user.create', 'user'], ['user.view', 'user'], ['user.update', 'user'],
  ['report.view', 'report'], ['report.export', 'report'],
];

const ROLE_PERMISSION_MAP = {
  ADMIN: '*', // gets every permission
  CASHIER: ['sale.view', 'sale.create', 'product.view', 'customer.view', 'customer.create', 'payment.view', 'payment.create', 'dashboard.view'],
  STOCK_KEEPER: ['product.view', 'product.create', 'product.update', 'purchase.view', 'purchase.create', 'supplier.view', 'supplier.create', 'stock.adjust', 'dashboard.view'],
};

export async function seedAdmin() {
  console.log('  → Seeding permissions...');
  const permissions = await Promise.all(
    PERMISSIONS.map(([code, module]) =>
      prisma.permission.upsert({ where: { code }, update: {}, create: { code, module } })
    )
  );
  const permissionByCode = Object.fromEntries(permissions.map((p) => [p.code, p]));

  console.log('  → Seeding roles...');
  const roles = {};
  for (const roleName of Object.keys(ROLE_PERMISSION_MAP)) {
    roles[roleName] = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  console.log('  → Assigning role permissions...');
  for (const [roleName, codes] of Object.entries(ROLE_PERMISSION_MAP)) {
    const grantedCodes = codes === '*' ? Object.keys(permissionByCode) : codes;
    for (const code of grantedCodes) {
      const permission = permissionByCode[code];
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles[roleName].id, permissionId: permission.id } },
        update: {},
        create: { roleId: roles[roleName].id, permissionId: permission.id },
      });
    }
  }

  console.log('  → Seeding default admin user...');
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@123';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: 'admin@hardwareims.local' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@hardwareims.local',
      passwordHash,
      roleId: roles.ADMIN.id,
      isActive: true,
      isEmailVerified: true,
    },
  });

  console.log(`  ✅ Admin login -> admin@hardwareims.local / ${adminPassword}`);
}
