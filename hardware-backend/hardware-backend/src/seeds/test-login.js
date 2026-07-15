 "import 'dotenv/config"
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const email = 'admin@hardwareims.local';
    const password = 'ChangeMe@123';
    
    console.log('🔍 Looking for user:', email);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      passwordHash: user.passwordHash ? 'exists' : 'missing'
    });
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log('🔑 Password valid:', isValid);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();