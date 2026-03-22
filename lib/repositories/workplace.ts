import { prisma } from '@/lib/prisma';

export const workplaceRepo = {
  findAll: (active?: boolean) =>
    prisma.workplace.findMany({
      where: active !== undefined ? { isActive: active } : undefined,
      orderBy: { id: 'asc' },
    }),

  findById: (id: number) =>
    prisma.workplace.findUnique({ where: { id } }),

  create: (name: string) =>
    prisma.workplace.create({ data: { name } }),

  update: (id: number, data: { name?: string; isActive?: boolean }) =>
    prisma.workplace.update({ where: { id }, data }),
};
