import path from 'path';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), 'gangmet.db')}`,
  },
});
