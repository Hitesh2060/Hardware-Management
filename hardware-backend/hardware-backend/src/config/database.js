import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Increase connection pool settings for Neon
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    // @ts-ignore - Pool configuration
    __internal: {
      engine: {
        connectionTimeout: 30000, // 30 seconds
        pool: {
          max: 10, // Increase pool size
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 30000,
        },
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

export default prisma;