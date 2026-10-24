import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { PaymentRecord, Student, StudentSppOverview, MonthSppSummary, PaymentStatus } from '../types/student';
import { SPP_MONTHS } from '../utils/formatters';

const COLLECTION_NAME = 'payments';

export const DEFAULT_OFFICERS = [
  'TU',
  'Staf Bendahara',
  'Admin Keuangan',
];

export const PAYMENT_METHODS = [
  'Tunai',
  'Transfer Bank',
  'QRIS',
  'Tabungan Siswa',
] as const;

export const BANK_OPTIONS = [
  'Bank BSI (Rek. 7118726086)',
  'Bank BCA (Rek. 1970539839)',
];

// Subscribe to all payments for global transaction history
export function subscribeAllPayments(
  onSuccess: (payments: PaymentRecord[]) => void,
  onError?: (error: Error) => void
) {
  const ref = collection(db, COLLECTION_NAME);
  return onSnapshot(
    ref,
    (snapshot) => {
      const records: PaymentRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          studentId: data.studentId || '',
          studentNis: data.studentNis || '',
          studentName: data.studentName || '',
          gradeClass: data.gradeClass || '',
          academicYear: data.academicYear || '',
          month: data.month || '',
          year: Number(data.year) || new Date().getFullYear(),
          amount: Number(data.amount) || 0,
          monthlySppNominal: Number(data.monthlySppNominal) || Number(data.amount) || 0,
          remainingBalance: Number(data.remainingBalance) ?? 0,
          paymentDate: data.paymentDate || '',
          paymentMethod: data.paymentMethod || 'Tunai',
          bankName: data.bankName || '',
          receiptNumber: data.receiptNumber || '',
          status: data.status || 'Lunas',
          notes: data.notes || '',
          recordedBy: data.recordedBy || 'Petugas Tata Usaha',
          cashTendered: data.cashTendered ? Number(data.cashTendered) : undefined,
          changeAmount: data.changeAmount ? Number(data.changeAmount) : undefined,
          createdAt: data.createdAt || new Date().toISOString(),
        } as PaymentRecord;
      });

      // Sort by paymentDate descending, then createdAt descending
      records.sort((a, b) => {
        const dateCmp = new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
        if (dateCmp !== 0) return dateCmp;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      onSuccess(records);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      } catch (e: any) {
        if (onError) onError(e);
      }
    }
  );
}

// Subscribe to payments for a single student
export function subscribeStudentPayments(
  studentId: string,
  onSuccess: (payments: PaymentRecord[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, COLLECTION_NAME), where('studentId', '==', studentId));
  return onSnapshot(
    q,
    (snapshot) => {
      const records: PaymentRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          studentId: data.studentId,
          studentNis: data.studentNis,
          studentName: data.studentName,
          gradeClass: data.gradeClass,
          academicYear: data.academicYear,
          month: data.month,
          year: Number(data.year),
          amount: Number(data.amount),
          monthlySppNominal: Number(data.monthlySppNominal) || Number(data.amount) || 0,
          remainingBalance: Number(data.remainingBalance) ?? 0,
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod || 'Tunai',
          bankName: data.bankName || '',
          receiptNumber: data.receiptNumber,
          status: data.status || 'Lunas',
          notes: data.notes || '',
          recordedBy: data.recordedBy || 'Petugas Tata Usaha',
          cashTendered: data.cashTendered ? Number(data.cashTendered) : undefined,
          changeAmount: data.changeAmount ? Number(data.changeAmount) : undefined,
          createdAt: data.createdAt || new Date().toISOString(),
        } as PaymentRecord;
      });

      records.sort((a, b) => {
        const dateCmp = new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
        if (dateCmp !== 0) return dateCmp;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      onSuccess(records);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      } catch (e: any) {
        if (onError) onError(e);
      }
    }
  );
}

// Generate unique transaction number: PREFIX-YYYYMMDD-XXXX (e.g. SPP-20241022-8391)
export function generateTransactionNumber(dateStr?: string, prefix = 'SPP'): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const cleanPrefix = (prefix || 'SPP').trim().toUpperCase();
  return `${cleanPrefix}-${yyyy}${mm}${dd}-${rand}`;
}

export const generateReceiptNumber = generateTransactionNumber;

export async function addPayment(
  payment: Omit<PaymentRecord, 'id' | 'createdAt'>
): Promise<string> {
  const now = new Date().toISOString();
  try {
    const payload: Record<string, any> = {
      studentId: payment.studentId || '',
      studentNis: payment.studentNis || '',
      studentName: payment.studentName || '',
      gradeClass: payment.gradeClass || '',
      academicYear: payment.academicYear || '',
      month: payment.month || '',
      year: Number(payment.year) || new Date().getFullYear(),
      amount: Number(payment.amount) || 0,
      monthlySppNominal: Number(payment.monthlySppNominal) || 0,
      remainingBalance: Number(payment.remainingBalance) || 0,
      paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: payment.paymentMethod || 'Tunai',
      bankName: payment.bankName || null,
      receiptNumber: payment.receiptNumber || '',
      status: payment.status || 'Lunas',
      notes: payment.notes || '',
      recordedBy: payment.recordedBy || 'Petugas Tata Usaha',
      cashTendered: payment.cashTendered !== undefined && payment.cashTendered !== null ? Number(payment.cashTendered) : null,
      changeAmount: payment.changeAmount !== undefined && payment.changeAmount !== null ? Number(payment.changeAmount) : null,
      createdAt: now,
    };

    // Strict defense: remove any undefined key if any slipped through
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        payload[key] = null;
      }
    });

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, COLLECTION_NAME);
  }
}

export async function deletePayment(id: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Compute comprehensive 12-month SPP status with installment support
export function computeStudentSppOverview(
  student: Student,
  payments: PaymentRecord[]
): StudentSppOverview {
  const parts = student.academicYear.split('/');
  const startYear = parseInt(parts[0], 10) || new Date().getFullYear();
  const endYear = parts[1] ? parseInt(parts[1], 10) : startYear + 1;

  const monthsSummary: MonthSppSummary[] = SPP_MONTHS.map((monthName, index) => {
    const calendarYear = index < 6 ? startYear : endYear;
    
    // Find all payment records for this specific month & academic year
    const matchingRecords = payments.filter(
      (p) =>
        p.month.toLowerCase() === monthName.toLowerCase() &&
        (p.academicYear === student.academicYear || p.year === calendarYear)
    );

    const paidAmount = matchingRecords.reduce((sum, p) => sum + p.amount, 0);
    const requiredAmount = student.monthlySppNominal;
    const remainingAmount = Math.max(0, requiredAmount - paidAmount);
    const isPaid = remainingAmount <= 0 && paidAmount > 0;
    const isPartial = paidAmount > 0 && remainingAmount > 0;

    return {
      monthName,
      order: index + 1,
      calendarYear,
      academicYear: student.academicYear,
      requiredAmount,
      paidAmount,
      remainingAmount,
      isPaid,
      isPartial,
      paymentRecord: matchingRecords[0], // latest record
      paymentRecords: matchingRecords,
    };
  });

  const totalRequired = student.monthlySppNominal * 12;
  const totalPaid = monthsSummary.reduce((acc, m) => acc + m.paidAmount, 0);
  const monthsPaidCount = monthsSummary.filter((m) => m.isPaid).length;
  const monthsPartialCount = monthsSummary.filter((m) => m.isPartial).length;
  const monthsUnpaidCount = 12 - monthsPaidCount;
  const totalArrears = Math.max(0, totalRequired - totalPaid);

  return {
    totalRequired,
    totalPaid,
    totalArrears,
    monthsPaidCount,
    monthsPartialCount,
    monthsUnpaidCount,
    months: monthsSummary,
  };
}

export async function seedSamplePaymentsForStudent(student: Student): Promise<void> {
  const q = query(collection(db, COLLECTION_NAME), where('studentId', '==', student.id));
  const snap = await getDocs(q);
  if (!snap.empty) return; // already has payments

  const parts = student.academicYear.split('/');
  const startYear = parseInt(parts[0], 10) || 2024;

  const sampleMonths = [
    { month: 'Juli', date: `${startYear}-07-10`, method: 'Tunai' as const, amount: student.monthlySppNominal, status: 'Lunas' as const, remaining: 0 },
    { month: 'Agustus', date: `${startYear}-08-12`, method: 'Transfer Bank' as const, bank: 'Bank BCA (Rek. 1970539839)', amount: student.monthlySppNominal, status: 'Lunas' as const, remaining: 0 },
    { month: 'September', date: `${startYear}-09-08`, method: 'QRIS' as const, amount: Math.round(student.monthlySppNominal / 2), status: 'Sebagian' as const, remaining: Math.round(student.monthlySppNominal / 2) },
  ];

  for (let i = 0; i < sampleMonths.length; i++) {
    const item = sampleMonths[i];
    await addPayment({
      studentId: student.id,
      studentNis: student.nis,
      studentName: student.fullName,
      gradeClass: student.gradeClass,
      academicYear: student.academicYear,
      month: item.month,
      year: startYear,
      amount: item.amount,
      monthlySppNominal: student.monthlySppNominal,
      remainingBalance: item.remaining,
      paymentDate: item.date,
      paymentMethod: item.method,
      bankName: (item as any).bank || undefined,
      receiptNumber: `TRX-${startYear}0${i + 7}-${student.nis.slice(-3)}1`,
      status: item.status,
      notes: item.status === 'Lunas' ? `Pembayaran SPP ${item.month} (Lunas)` : `Cicilan 1 SPP ${item.month}`,
      recordedBy: 'TU',
    });
  }
}
