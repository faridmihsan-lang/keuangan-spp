export type Gender = 'L' | 'P';
export type StudentStatus = 'aktif' | 'tidak_aktif';

export interface Student {
  id: string;
  nis: string;                 // Nomor Induk Siswa (unik sekolah)
  nisn: string;                // Nomor Induk Siswa Nasional (10 digit)
  fullName: string;            // Nama lengkap
  gender: Gender;              // 'L' | 'P'
  gradeClass: string;          // Contoh: 'X-A', 'XI-B', 'XII-A'
  major?: string;              // Opsional / dihilangkan
  academicYear: string;        // Tahun Ajaran: '2024/2025'
  monthlySppNominal: number;   // Nominal SPP bulanan dalam IDR
  address: string;             // Alamat tempat tinggal
  parentName: string;          // Nama orang tua / wali
  phone: string;               // Nomor HP / WhatsApp
  status: StudentStatus;       // 'aktif' | 'tidak_aktif'
  notes?: string;              // Catatan tambahan (misal beasiswa)
  createdAt: string;           // ISO timestamp
  updatedAt: string;           // ISO timestamp
}

export type PaymentMethod = 'Tunai' | 'Transfer Bank' | 'QRIS' | 'Tabungan Siswa';
export type PaymentStatus = 'Lunas' | 'Sebagian' | 'Menunggu';

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentNis: string;
  studentName: string;
  gradeClass: string;
  academicYear: string;
  month: string;               // Contoh: 'Juli', 'Agustus', ..., 'Juni'
  year: number;                // Tahun kalender, misal 2024
  amount: number;              // Jumlah dibayar pada transaksi ini
  monthlySppNominal: number;   // Tarif standar SPP bulan bersangkutan
  remainingBalance: number;    // Sisa tagihan bulan ini setelah pembayaran ini (0 jika lunas)
  paymentDate: string;         // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  bankName?: string;           // Bank tujuan transfer jika transfer bank
  receiptNumber: string;       // No bukti kuitansi (contoh: TRX-202410-0012)
  status: PaymentStatus;       // 'Lunas' atau 'Sebagian'
  notes?: string;
  recordedBy: string;          // Petugas/Kasir TU pencatat transaksi
  cashTendered?: number;       // Uang tunai diserahkan (jika tunai)
  changeAmount?: number;       // Uang kembalian (jika tunai)
  createdAt: string;
}

export interface MonthSppSummary {
  monthName: string;           // Juli, Agustus, ..., Juni
  order: number;
  calendarYear: number;
  academicYear: string;
  requiredAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isPaid: boolean;
  isPartial: boolean;
  paymentRecord?: PaymentRecord; // Transaksi terakhir
  paymentRecords: PaymentRecord[]; // Seluruh riwayat transaksi bulan ini
}

export interface StudentSppOverview {
  totalRequired: number;
  totalPaid: number;
  totalArrears: number;        // Total Tunggakan
  monthsPaidCount: number;
  monthsPartialCount: number;
  monthsUnpaidCount: number;
  months: MonthSppSummary[];
}

export interface ImportPreviewItem {
  isValid: boolean;
  errors: string[];
  data: Partial<Student>;
}

export type StudentArrearStatus = 'lunas' | 'sebagian' | 'menunggak' | 'belum_bayar';

export interface StudentArrearSummary {
  student: Student;
  totalRequired: number;
  totalPaid: number;
  totalArrears: number;
  monthsPaidCount: number;
  monthsPartialCount: number;
  monthsUnpaidCount: number;
  unpaidMonths: string[];       // Daftar nama bulan yang belum lunas
  status: StudentArrearStatus;
  overview: StudentSppOverview;
}

export interface ClassSummary {
  gradeClass: string;
  totalStudents: number;
  activeStudents: number;
  totalObligation: number;      // Total kewajiban SPP 1 tahun
  totalCollected: number;       // Total kas yang sah diterima
  totalArrears: number;         // Total sisa tunggakan
  percentCollected: number;     // % Ketercapaian
  fullyPaidCount: number;       // Siswa lunas
  partialCount: number;         // Siswa cicil
  arrearCount: number;          // Siswa menunggak
}

export interface DailyCashSummary {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  byMethod: Record<string, number>;
  payments: PaymentRecord[];
}

export interface MonthlyCashSummary {
  monthYearKey: string;
  monthName: string;
  year: number;
  totalAmount: number;
  totalTransactions: number;
}

export type UserRole = 'admin' | 'petugas' | 'kepala_sekolah';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  phone?: string;
  status: 'aktif' | 'nonaktif';
}

export interface SchoolSettings {
  id?: string;
  schoolName: string;
  npsn: string;
  educationLevel: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  principalName: string;
  principalNip: string;
  treasurerName: string;
  treasurerNip: string;
  activeAcademicYear: string;
  dueDay: number;
  currentBillingMonth: string;
  receiptPrefix: string;
  receiptFooterNote: string;
  gradeRates: {
    X: number;
    XI: number;
    XII: number;
    [grade: string]: number;
  };
  users: AppUser[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  module: 'Siswa' | 'Pembayaran' | 'Tunggakan & Laporan' | 'Pengaturan' | 'Sistem';
  details: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
}

export interface DashboardMetrics {
  totalActiveStudents: number;
  totalInactiveStudents: number;
  currentMonthName: string;
  activeAcademicYear: string;
  paidThisMonthCount: number;
  unpaidThisMonthCount: number;
  partialThisMonthCount: number;
  totalMonthlyObligation: number;
  totalYearlyObligation: number;
  totalCollectedYearly: number;
  totalCollectedThisMonth: number;
  totalRemainingArrears: number;
  collectionRate: number;
}

