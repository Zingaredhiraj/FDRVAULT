import { PrismaClient } from '@prisma/client';
import { seedTenRecords } from '../src/services/seed.service';

const prisma = new PrismaClient();

async function main() {
  await seedTenRecords(prisma);
  console.log('✅ Seed completed successfully.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
