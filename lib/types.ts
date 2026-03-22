// Re-export Prisma types for convenience
export type {
  Workplace,
  Employee,
  Schedule,
  SettlementReport,
  Payroll,
  SystemSetting,
  Position,
  PayType,
  ScheduleType,
  DayType,
  ScheduleStatus,
  PayrollStatus,
} from '@prisma/client';

// Custom calculation result (not in DB)
export type { PayrollCalcResult } from './payroll-calculator';
