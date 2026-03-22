import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';

const adapter = new PrismaLibSql({ url: `file:${path.join(process.cwd(), 'gangmet.db')}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.systemSetting.upsert({
    where: { key: 'default_hourly_rate' },
    update: {},
    create: { key: 'default_hourly_rate', value: '10030' },
  });
  console.log('Seed complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
