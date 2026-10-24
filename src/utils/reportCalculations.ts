import {
  Student,
  PaymentRecord,
  StudentArrearSummary,
  StudentArrearStatus,
  ClassSummary,
  DailyCashSummary,
  MonthlyCashSummary,
} from '../types/student';
import { computeStudentSppOverview } from '../services/paymentService';
import { SPP_MONTHS } from './formatters';

export function computeStudentArrearItem(
  student: Student,
  allPayments: PaymentRecord[]
): StudentArrearSummary {
  const studentPayments = allPayments.filter((p) => p.studentId === student.id);
  const overview = computeStudentSppOverview(student, studentPayments);

  const unpaidMonths = overview.months
    .filter((m) => !m.isPaid)
    .map((m) => m.monthName);

  let status: StudentArrearStatus = 'belum_bayar';
  if (overview.totalArrears === 0 && overview.totalPaid > 0) {
    status = 'lunas';
  } else if (overview.totalPaid > 0 && overview.totalArrears > 0) {
    status = overview.monthsPartialCount > 0 ? 'sebagian' : 'menunggak';
  } else {
    status = 'belum_bayar';
  }

  return {
    student,
    totalRequired: overview.totalRequired,
    totalPaid: overview.totalPaid,
    totalArrears: overview.totalArrears,
    monthsPaidCount: overview.monthsPaidCount,
    monthsPartialCount: overview.monthsPartialCount,
    monthsUnpaidCount: overview.monthsUnpaidCount,
    unpaidMonths,
    status,
    overview,
  };
}

export function computeAllStudentArrears(
  students: Student[],
  allPayments: PaymentRecord[],
  academicYearFilter = 'Semua'
): StudentArrearSummary[] {
  const targetStudents = students.filter(
    (s) => academicYearFilter === 'Semua' || s.academicYear === academicYearFilter
  );

  return targetStudents.map((student) => computeStudentArrearItem(student, allPayments));
}

export function computeClassSummaries(
  students: Student[],
  allPayments: PaymentRecord[],
  academicYearFilter = 'Semua'
): ClassSummary[] {
  const targetStudents = students.filter(
    (s) => academicYearFilter === 'Semua' || s.academicYear === academicYearFilter
  );

  const classMap = new Map<string, Student[]>();
  targetStudents.forEach((s) => {
    const list = classMap.get(s.gradeClass) || [];
    list.push(s);
    classMap.set(s.gradeClass, list);
  });

  const summaries: ClassSummary[] = [];

  classMap.forEach((classStudents, gradeClass) => {
    let totalObligation = 0;
    let totalCollected = 0;
    let totalArrears = 0;
    let fullyPaidCount = 0;
    let partialCount = 0;
    let arrearCount = 0;
    const activeCount = classStudents.filter((s) => s.status === 'aktif').length;

    classStudents.forEach((s) => {
      const arrearItem = computeStudentArrearItem(s, allPayments);
      totalObligation += arrearItem.totalRequired;
      totalCollected += arrearItem.totalPaid;
      totalArrears += arrearItem.totalArrears;

      if (arrearItem.status === 'lunas') {
        fullyPaidCount++;
      } else if (arrearItem.status === 'sebagian') {
        partialCount++;
        arrearCount++;
      } else {
        arrearCount++;
      }
    });

    const percentCollected = totalObligation > 0 ? Math.round((totalCollected / totalObligation) * 100) : 0;

    summaries.push({
      gradeClass,
      totalStudents: classStudents.length,
      activeStudents: activeCount,
      totalObligation,
      totalCollected,
      totalArrears,
      percentCollected,
      fullyPaidCount,
      partialCount,
      arrearCount,
    });
  });

  // Sort by class name alphabetically
  summaries.sort((a, b) => a.gradeClass.localeCompare(b.gradeClass, 'id'));
  return summaries;
}

export function computeDailyCashFlow(payments: PaymentRecord[]): DailyCashSummary[] {
  const map = new Map<string, PaymentRecord[]>();

  payments.forEach((p) => {
    const dateKey = p.paymentDate || p.createdAt.split('T')[0];
    const list = map.get(dateKey) || [];
    list.push(p);
    map.set(dateKey, list);
  });

  const list: DailyCashSummary[] = [];

  map.forEach((records, date) => {
    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
    const byMethod: Record<string, number> = {};

    records.forEach((r) => {
      const m = r.paymentMethod || 'Tunai';
      byMethod[m] = (byMethod[m] || 0) + r.amount;
    });

    list.push({
      date,
      totalTransactions: records.length,
      totalAmount,
      byMethod,
      payments: records,
    });
  });

  // Sort newest date first
  list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return list;
}

export function computeMonthlyCashFlow(
  payments: PaymentRecord[],
  academicYearFilter = 'Semua'
): MonthlyCashSummary[] {
  const filtered = payments.filter(
    (p) => academicYearFilter === 'Semua' || p.academicYear === academicYearFilter
  );

  const map = new Map<string, { totalAmount: number; count: number; monthName: string; year: number }>();

  filtered.forEach((p) => {
    const key = `${p.month} ${p.year}`;
    const cur = map.get(key) || { totalAmount: 0, count: 0, monthName: p.month, year: p.year };
    cur.totalAmount += p.amount;
    cur.count += 1;
    map.set(key, cur);
  });

  const result: MonthlyCashSummary[] = [];
  map.forEach((val, key) => {
    result.push({
      monthYearKey: key,
      monthName: val.monthName,
      year: val.year,
      totalAmount: val.totalAmount,
      totalTransactions: val.count,
    });
  });

  // Sort by SPP months order
  result.sort((a, b) => {
    const idxA = SPP_MONTHS.indexOf(a.monthName as any);
    const idxB = SPP_MONTHS.indexOf(b.monthName as any);
    if (a.year !== b.year) return a.year - b.year;
    return idxA - idxB;
  });

  return result;
}
