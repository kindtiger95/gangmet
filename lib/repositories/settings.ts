import { prisma } from '@/lib/prisma';

export const settingsRepo = {
  getAll: () => prisma.systemSetting.findMany(),

  get: (key: string) => prisma.systemSetting.findUnique({ where: { key } }),

  set: (key: string, value: string) =>
    prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    }),

  getDefaultHourlyRate: async (): Promise<number> => {
    const setting = await prisma.systemSetting.findUnique({ where: { key: 'default_hourly_rate' } });
    if (!setting) {
      await prisma.systemSetting.create({ data: { key: 'default_hourly_rate', value: '10030' } });
      return 10030;
    }
    return parseFloat(setting.value);
  },
};
