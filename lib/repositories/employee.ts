import { prisma } from '@/lib/prisma';
import { Position, PayType } from '@prisma/client';

export interface CreateEmployeeInput {
  workplaceId: number;
  name: string;
  phone?: string | null;
  position: Position;
  payType: PayType;
  hourlyRate?: number | null;
  requiredHours?: number | null;
  monthlySalary?: number | null;
  bankName?: string | null;
  accountNumber?: string | null;
  hireDate?: string | null;
}

export interface UpdateEmployeeInput {
  name?: string;
  phone?: string | null;
  position?: Position;
  payType?: PayType;
  hourlyRate?: number | null;
  requiredHours?: number | null;
  monthlySalary?: number | null;
  bankName?: string | null;
  accountNumber?: string | null;
  hireDate?: string | null;
  isActive?: boolean;
}

export const employeeRepo = {
  findAll: (params?: { workplaceId?: number; active?: boolean }) =>
    prisma.employee.findMany({
      where: {
        ...(params?.workplaceId !== undefined ? { workplaceId: params.workplaceId } : {}),
        ...(params?.active !== undefined ? { isActive: params.active } : {}),
      },
      orderBy: { id: 'asc' },
    }),

  findById: (id: number) =>
    prisma.employee.findUnique({ where: { id } }),

  create: (data: CreateEmployeeInput) =>
    prisma.employee.create({ data }),

  update: (id: number, data: UpdateEmployeeInput) =>
    prisma.employee.update({ where: { id }, data }),
};
