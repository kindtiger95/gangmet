import { prisma } from '@/lib/prisma';
import { DayType, ScheduleStatus, ScheduleType } from '@prisma/client';

export function monthRange(year: number, month: number) {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return {
    gte: `${y}-${m}-01 00:00`,
    lt: `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}-01 00:00`,
  };
}

export interface CreateScheduleInput {
  employeeId: number;
  workplaceId: number;
  type: ScheduleType;
  fromDatetime: string;
  toDatetime: string;
  dayType: DayType;
  note?: string | null;
}

export const scheduleRepo = {
  findByMonth: (params: {
    workplaceId?: number;
    employeeId?: number;
    year: number;
    month: number;
    status?: ScheduleStatus;
  }) =>
    prisma.schedule.findMany({
      where: {
        ...(params.workplaceId !== undefined ? { workplaceId: params.workplaceId } : {}),
        ...(params.employeeId !== undefined ? { employeeId: params.employeeId } : {}),
        ...(params.status ? { status: params.status } : {}),
        fromDatetime: monthRange(params.year, params.month),
      },
      orderBy: [{ fromDatetime: 'asc' }, { employeeId: 'asc' }],
    }),

  findById: (id: number) =>
    prisma.schedule.findUnique({ where: { id } }),

  create: (data: CreateScheduleInput) =>
    prisma.schedule.create({ data }),

  update: (id: number, data: Partial<Pick<CreateScheduleInput, 'type' | 'fromDatetime' | 'toDatetime' | 'dayType' | 'note'>>) =>
    prisma.schedule.update({ where: { id }, data }),

  delete: (id: number) =>
    prisma.schedule.delete({ where: { id } }),
};
