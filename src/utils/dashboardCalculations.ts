import { Student, PaymentRecord, DashboardMetrics } from '../types/student';
import { computeAllStudentArrears } from './reportCalculations';
import { SPP_MONTHS } from './formatters';

export interface MonthlyTrendItem {
  monthName: string;
  order: number;
  calendarYear: number;
  totalCollected: number;
  transactionCount: number;
  targetObligation: number;
  isCurrentMonth: boolean;
}

export interface ClassComparisonItem {
  name: string;
  totalStudents: number;
  activeStudents: number;
  totalObligation: number;
  totalCollected: number;
  totalArrears: number;
  percentage: number;
}

/**
 * Compute key dashboard metrics derived from live Firestore students and payments
 */
export function computeDashboardMetrics(
  students: Student[],
  payments: PaymentRecord[],
  activeAcademicYear: string = 'Semua',
  currentMonthName: string = 'Oktober'
): DashboardMetrics {
  const filteredStudents = students.filter(
    (s) => activeAcademicYear === 'Semua' || s.academicYear === activeAcademicYear
  );
  const filteredPayments = payments.filter(
    (p) => activeAcademicYear === 'Semua' || p.academicYear === activeAcademicYear
  );

  const activeStudents = filteredStudents.filter((s) => s.status === 'aktif');
  const inactiveStudents = filteredStudents.filter((s) => s.status === 'tidak_aktif');

  // Arrears summaries for all students
  const arrearSummaries = computeAllStudentArrears(filteredStudents, filteredPayments, activeAcademicYear);
  const activeArrears = arrearSummaries.filter((a) => a.student.status === 'aktif');

  // Current Month status
  let paidThisMonthCount = 0;
  let partialThisMonthCount = 0;
  let unpaidThisMonthCount = 0;

  activeArrears.forEach((item) => {
    const monthData = item.overview.months.find((m) => m.monthName.toLowerCase() === currentMonthName.toLowerCase());
    if (monthData) {
      if (monthData.isPaid) {
        paidThisMonthCount++;
      } else if (monthData.isPartial) {
        partialThisMonthCount++;
      } else {
        unpaidThisMonthCount++;
      }
    } else {
      unpaidThisMonthCount++;
    }
  });

  // Financial totals: strictly sum valid database fields
  const totalMonthlyObligation = activeStudents.reduce((sum, s) => sum + (s.monthlySppNominal || 0), 0);
  const totalYearlyObligation = activeStudents.reduce((sum, s) => sum + (s.monthlySppNominal || 0) * 12, 0);

  const totalCollectedYearly = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalCollectedThisMonth = filteredPayments
    .filter((p) => (p.month || '').toLowerCase() === currentMonthName.toLowerCase())
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const totalRemainingArrears = Math.max(0, totalYearlyObligation - totalCollectedYearly);
  const collectionRate = totalYearlyObligation > 0
    ? Math.min(100, Math.round((totalCollectedYearly / totalYearlyObligation) * 100))
    : 0;

  return {
    totalActiveStudents: activeStudents.length,
    totalInactiveStudents: inactiveStudents.length,
    currentMonthName,
    activeAcademicYear,
    paidThisMonthCount,
    unpaidThisMonthCount,
    partialThisMonthCount,
    totalMonthlyObligation,
    totalYearlyObligation,
    totalCollectedYearly,
    totalCollectedThisMonth,
    totalRemainingArrears,
    collectionRate,
  };
}

/**
 * Compute monthly income trend for 12 SPP academic months (Juli - Juni)
 */
export function computeMonthlyIncomeTrend(
  students: Student[],
  payments: PaymentRecord[],
  academicYear: string = '2024/2025',
  currentMonthName: string = 'Oktober'
): MonthlyTrendItem[] {
  const activeStudents = students.filter(
    (s) => s.status === 'aktif' && (academicYear === 'Semua' || s.academicYear === academicYear)
  );
  const monthlyNominalSum = activeStudents.reduce((sum, s) => sum + (s.monthlySppNominal || 0), 0);

  const relevantPayments = payments.filter(
    (p) => academicYear === 'Semua' || p.academicYear === academicYear
  );

  const yearParts = (academicYear && academicYear !== 'Semua' ? academicYear : '2026/2027').split('/');
  const startYr = parseInt(yearParts[0], 10) || new Date().getFullYear();
  const endYr = yearParts[1] ? parseInt(yearParts[1], 10) : startYr + 1;

  return SPP_MONTHS.map((monthName, index) => {
    const order = index + 1;
    const monthPayments = relevantPayments.filter(
      (p) => (p.month || '').toLowerCase() === monthName.toLowerCase()
    );
    const totalCollected = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      monthName,
      order,
      calendarYear: order <= 6 ? startYr : endYr,
      totalCollected,
      transactionCount: monthPayments.length,
      targetObligation: monthlyNominalSum,
      isCurrentMonth: monthName.toLowerCase() === currentMonthName.toLowerCase(),
    };
  });
}

/**
 * Compute comparison between obligation vs actual collection grouped by grade level (Kelas X, XI, XII)
 */
export function computeGradeLevelComparison(
  students: Student[],
  payments: PaymentRecord[],
  academicYear: string = 'Semua'
): ClassComparisonItem[] {
  const filteredStudents = students.filter(
    (s) => academicYear === 'Semua' || s.academicYear === academicYear
  );
  const filteredPayments = payments.filter(
    (p) => academicYear === 'Semua' || p.academicYear === academicYear
  );

  const gradeGroups: { [key: string]: { students: Student[]; payments: PaymentRecord[] } } = {
    'Kelas X': { students: [], payments: [] },
    'Kelas XI': { students: [], payments: [] },
    'Kelas XII': { students: [], payments: [] },
  };

  filteredStudents.forEach((s) => {
    const cl = (s.gradeClass || '').toUpperCase();
    if (cl.startsWith('X-') || cl.startsWith('X ') || cl === 'X') {
      gradeGroups['Kelas X'].students.push(s);
    } else if (cl.startsWith('XI-') || cl.startsWith('XI ') || cl === 'XI') {
      gradeGroups['Kelas XI'].students.push(s);
    } else if (cl.startsWith('XII-') || cl.startsWith('XII ') || cl === 'XII') {
      gradeGroups['Kelas XII'].students.push(s);
    }
  });

  filteredPayments.forEach((p) => {
    const cl = (p.gradeClass || '').toUpperCase();
    if (cl.startsWith('X-') || cl.startsWith('X ') || cl === 'X') {
      gradeGroups['Kelas X'].payments.push(p);
    } else if (cl.startsWith('XI-') || cl.startsWith('XI ') || cl === 'XI') {
      gradeGroups['Kelas XI'].payments.push(p);
    } else if (cl.startsWith('XII-') || cl.startsWith('XII ') || cl === 'XII') {
      gradeGroups['Kelas XII'].payments.push(p);
    }
  });

  return Object.entries(gradeGroups).map(([name, data]) => {
    const active = data.students.filter((s) => s.status === 'aktif');
    const totalObligation = active.reduce((sum, s) => sum + (s.monthlySppNominal || 0) * 12, 0);
    const totalCollected = data.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalArrears = Math.max(0, totalObligation - totalCollected);
    const percentage = totalObligation > 0 ? Math.min(100, Math.round((totalCollected / totalObligation) * 100)) : 0;

    return {
      name,
      totalStudents: data.students.length,
      activeStudents: active.length,
      totalObligation,
      totalCollected,
      totalArrears,
      percentage,
    };
  });
}

/**
 * Get top debtors (students with highest arrears or longest unpaid months)
 */
export function getTopDebtors(
  students: Student[],
  payments: PaymentRecord[],
  academicYear: string = 'Semua',
  limitCount = 6
) {
  const arrears = computeAllStudentArrears(students, payments, academicYear)
    .filter((a) => a.student.status === 'aktif' && a.totalArrears > 0);

  // Sort by highest arrears first, then by unpaid months count
  arrears.sort((a, b) => {
    if (b.totalArrears !== a.totalArrears) {
      return b.totalArrears - a.totalArrears;
    }
    return b.monthsUnpaidCount - a.monthsUnpaidCount;
  });

  return arrears.slice(0, limitCount);
}
