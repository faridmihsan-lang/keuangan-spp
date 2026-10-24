import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  User,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Wallet,
  Building,
  QrCode,
  PiggyBank,
  ArrowRight,
  ShieldAlert,
  Printer,
  ChevronDown,
  X,
} from 'lucide-react';
import { Student, PaymentRecord, PaymentMethod, PaymentStatus, MonthSppSummary } from '../types/student';
import {
  formatRupiah,
  formatDateIndo,
  SPP_MONTHS,
} from '../utils/formatters';
import {
  generateTransactionNumber,
  addPayment,
  computeStudentSppOverview,
  DEFAULT_OFFICERS,
  PAYMENT_METHODS,
  BANK_OPTIONS,
} from '../services/paymentService';

interface PaymentFormProps {
  students: Student[];
  allPayments: PaymentRecord[];
  preSelectedStudent?: Student | null;
  onPaymentSuccess: (payment: PaymentRecord, student: Student, printDirectly: boolean) => void;
  onSwitchToStudentModule: (student?: Student) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  students,
  allPayments,
  preSelectedStudent,
  onPaymentSuccess,
  onSwitchToStudentModule,
}) => {
  // Student Picker State
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sync preselected student
  useEffect(() => {
    if (preSelectedStudent) {
      setSelectedStudent(preSelectedStudent);
      setStudentSearch(`${preSelectedStudent.fullName} (${preSelectedStudent.nis})`);
    } else if (students.length > 0 && !selectedStudent) {
      // Pick first active student by default if available
      const firstActive = students.find((s) => s.status === 'aktif') || students[0];
      setSelectedStudent(firstActive);
      setStudentSearch(`${firstActive.fullName} (${firstActive.nis})`);
    }
  }, [preSelectedStudent, students]);

  // Transaction Form State
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>('Juli');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [bankName, setBankName] = useState(BANK_OPTIONS[0]);
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [recordedBy, setRecordedBy] = useState(DEFAULT_OFFICERS[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Regenerate transaction number on mount or date change
  useEffect(() => {
    setReceiptNumber(generateTransactionNumber(paymentDate));
  }, [paymentDate]);

  // Filtered students for picker
  const filteredStudentsForPicker = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 10);
    const q = studentSearch.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.nis.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q)) ||
        s.fullName.toLowerCase().includes(q) ||
        s.gradeClass.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [students, studentSearch]);

  // Calculate selected student's payments and overview
  const studentPayments = useMemo(() => {
    if (!selectedStudent) return [];
    return allPayments.filter((p) => p.studentId === selectedStudent.id);
  }, [selectedStudent, allPayments]);

  const sppOverview = useMemo(() => {
    if (!selectedStudent) return null;
    return computeStudentSppOverview(selectedStudent, studentPayments);
  }, [selectedStudent, studentPayments]);

  // Selected Month's billing status details
  const selectedMonthSummary: MonthSppSummary | null = useMemo(() => {
    if (!sppOverview) return null;
    return sppOverview.months.find((m) => m.monthName.toLowerCase() === selectedMonth.toLowerCase()) || null;
  }, [sppOverview, selectedMonth]);

  // When selected student or selected month changes, update default pay amount & notes
  useEffect(() => {
    if (!selectedStudent || !selectedMonthSummary) return;

    setSelectedYear(selectedMonthSummary.calendarYear);

    // If month is not paid, default to remaining amount
    if (!selectedMonthSummary.isPaid) {
      setPayAmount(selectedMonthSummary.remainingAmount);
      setCashTendered(selectedMonthSummary.remainingAmount);
      setNotes(
        selectedMonthSummary.isPartial
          ? `Pelunasan Sisa Cicilan SPP Bulan ${selectedMonth}`
          : `Pembayaran SPP Bulan ${selectedMonth}`
      );
    } else {
      setPayAmount(0);
      setNotes(`Pembayaran SPP Bulan ${selectedMonth}`);
    }
    setValidationError(null);
  }, [selectedStudent, selectedMonth, selectedMonthSummary]);

  // Auto pick next unpaid month when student changes
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentSearch(`${student.fullName} (${student.nis})`);
    setIsDropdownOpen(false);

    // Compute next unpaid month for this student
    const studentP = allPayments.filter((p) => p.studentId === student.id);
    const ov = computeStudentSppOverview(student, studentP);
    const firstUnpaid = ov.months.find((m) => !m.isPaid);
    if (firstUnpaid) {
      setSelectedMonth(firstUnpaid.monthName);
    }
  };

  // Calculations
  const monthlySppTariff = selectedStudent?.monthlySppNominal || 0;
  const alreadyPaidForMonth = selectedMonthSummary ? selectedMonthSummary.paidAmount : 0;
  const remainingForMonth = selectedMonthSummary ? selectedMonthSummary.remainingAmount : 0;
  const isMonthAlreadyPaid = selectedMonthSummary ? selectedMonthSummary.isPaid : false;

  // Sisa tagihan setelah transaksi ini
  const remainingAfterThisPayment = Math.max(0, remainingForMonth - payAmount);
  const statusThisPayment: PaymentStatus = remainingAfterThisPayment === 0 && payAmount > 0 ? 'Lunas' : 'Sebagian';

  // Uang kembalian jika pembayaran tunai
  const changeAmount = paymentMethod === 'Tunai' && cashTendered > payAmount ? cashTendered - payAmount : 0;

  // Quick amount buttons
  const handleQuickAmount = (amount: number) => {
    setPayAmount(amount);
    if (paymentMethod === 'Tunai' && cashTendered < amount) {
      setCashTendered(amount);
    }
  };

  // Submission handler
  const handleSubmitPayment = async (printDirectly: boolean) => {
    if (!selectedStudent) {
      setValidationError('Silakan pilih siswa terlebih dahulu.');
      return;
    }

    if (isMonthAlreadyPaid) {
      setValidationError(
        `Bulan ${selectedMonth} ${selectedYear} sudah LUNAS! Pembayaran ganda untuk bulan yang sama tidak diizinkan.`
      );
      return;
    }

    if (!payAmount || payAmount <= 0) {
      setValidationError('Nominal pembayaran harus lebih besar dari Rp 0.');
      return;
    }

    if (payAmount > remainingForMonth) {
      setValidationError(
        `Nominal bayar (${formatRupiah(payAmount)}) melebihi sisa tagihan bulan ini (${formatRupiah(
          remainingForMonth
        )}). Gunakan nominal maksimal ${formatRupiah(remainingForMonth)}.`
      );
      return;
    }

    if (paymentMethod === 'Tunai' && cashTendered < payAmount) {
      setValidationError(
        `Uang tunai diserahkan (${formatRupiah(cashTendered)}) kurang dari nominal pembayaran (${formatRupiah(
          payAmount
        )}).`
      );
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    try {
      const paymentPayload: Omit<PaymentRecord, 'id' | 'createdAt'> = {
        studentId: selectedStudent.id,
        studentNis: selectedStudent.nis,
        studentName: selectedStudent.fullName,
        gradeClass: selectedStudent.gradeClass,
        academicYear: selectedStudent.academicYear,
        month: selectedMonth,
        year: selectedYear,
        amount: Number(payAmount),
        monthlySppNominal: Number(monthlySppTariff),
        remainingBalance: Number(remainingAfterThisPayment),
        paymentDate,
        paymentMethod,
        ...(paymentMethod === 'Transfer Bank' && bankName ? { bankName } : {}),
        receiptNumber: receiptNumber.trim() || generateTransactionNumber(paymentDate),
        status: statusThisPayment,
        notes: notes.trim(),
        recordedBy,
        ...(paymentMethod === 'Tunai' && cashTendered ? { cashTendered, changeAmount } : {}),
      };

      const docId = await addPayment(paymentPayload);
      const createdPayment: PaymentRecord = {
        ...paymentPayload,
        id: docId,
        createdAt: new Date().toISOString(),
      };

      // Notify parent to show success & optionally launch print modal
      onPaymentSuccess(createdPayment, selectedStudent, printDirectly);

      // Refresh transaction number for next transaction
      setReceiptNumber(generateTransactionNumber(paymentDate));

      // Re-evaluate next month
      setTimeout(() => {
        const updatedPayments = [...studentPayments, createdPayment];
        const newOverview = computeStudentSppOverview(selectedStudent, updatedPayments);
        const nextUnpaid = newOverview.months.find((m) => !m.isPaid);
        if (nextUnpaid) {
          setSelectedMonth(nextUnpaid.monthName);
        }
      }, 300);
    } catch (err: any) {
      console.error(err);
      setValidationError(err.message || 'Terjadi kesalahan saat menyimpan transaksi ke Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Student Selector & Billing Matrix (5 Cols) */}
      <div className="lg:col-span-5 space-y-5">
        {/* Student Search & Selector Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>1. Pilih Siswa Pembayar</span>
            </label>
            <span className="text-[10px] text-slate-400">Cari NIS / Nama</span>
          </div>

          {/* Autocomplete Search Input */}
          <div className="relative">
            <div className="relative">
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Ketik NIS, Nama Siswa, atau Kelas..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setStudentSearch('');
                    setSelectedStudent(null);
                  }}
                  className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Options */}
            {isDropdownOpen && filteredStudentsForPicker.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 max-h-64 overflow-y-auto z-40 divide-y divide-slate-100">
                {filteredStudentsForPicker.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStudent(s)}
                    className="w-full p-2.5 text-left hover:bg-slate-50 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          s.gender === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {s.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                          {s.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          NIS: {s.nis} • Kelas: {s.gradeClass}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-emerald-700">
                        {formatRupiah(s.monthlySppNominal)}
                      </span>
                      <span className="block text-[9px] text-slate-400">/bln</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Student Profile Card Display */}
          {selectedStudent ? (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                    {selectedStudent.fullName}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-slate-700">
                      NIS: {selectedStudent.nis}
                    </span>
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {selectedStudent.gradeClass}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSwitchToStudentModule(selectedStudent)}
                  className="text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold hover:underline shrink-0"
                  title="Buka data lengkap siswa di Modul 1"
                >
                  Lihat Profil Siswa &rarr;
                </button>
              </div>

              {/* Status Tagihan Summary Banner */}
              {sppOverview && (
                <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Ringkasan Tagihan Tahun Ajaran {selectedStudent.academicYear}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Tarif / Bulan</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">
                        {formatRupiah(selectedStudent.monthlySppNominal)}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-emerald-600 block">Total Terbayar</span>
                      <span className="text-xs font-bold text-emerald-700 font-mono">
                        {formatRupiah(sppOverview.totalPaid)}
                      </span>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-rose-600 block">Total Tunggakan</span>
                      <span className="text-xs font-bold text-rose-700 font-mono">
                        {formatRupiah(sppOverview.totalArrears)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span>Progres Pelunasan</span>
                      <span className="font-bold text-emerald-700">
                        {sppOverview.monthsPaidCount} dari 12 Bulan Lunas (
                        {Math.round((sppOverview.monthsPaidCount / 12) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${(sppOverview.monthsPaidCount / 12) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
              Pilih siswa terlebih dahulu untuk menampilkan data tagihan dan riwayat SPP.
            </div>
          )}
        </div>

        {/* 12-Month Matrix Quick Selector Card */}
        {selectedStudent && sppOverview && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>2. Pilih Bulan yang Akan Dibayar</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik pada bulan untuk memuat tagihan. Bulan hijau telah lunas penuh.
                </p>
              </div>
            </div>

            {/* Grid 12 Months */}
            <div className="grid grid-cols-3 gap-2">
              {sppOverview.months.map((m) => {
                const isSelected = selectedMonth.toLowerCase() === m.monthName.toLowerCase();

                return (
                  <button
                    key={m.monthName}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(m.monthName);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{m.monthName}</span>
                      {m.isPaid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : m.isPartial ? (
                        <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>

                    <div className="mt-2 text-[10px]">
                      {m.isPaid ? (
                        <span className="inline-block px-1.5 py-0.5 rounded font-bold text-emerald-700 bg-emerald-100">
                          Lunas
                        </span>
                      ) : m.isPartial ? (
                        <div>
                          <span className="inline-block px-1 py-0.2 rounded font-bold text-amber-700 bg-amber-100">
                            Sisa: {formatRupiah(m.remainingAmount)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-medium">
                          {formatRupiah(m.requiredAmount)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Lunas Penuh</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Ada Cicilan</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span>Belum Bayar</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Transaction Details & Payment Form (7 Cols) */}
      <div className="lg:col-span-7">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>Formulir Transaksi Kasir SPP</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Proses pembayaran lunas atau cicilan dengan kalkulasi otomatis dan anti-duplikasi
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">No. Transaksi</span>
              <div className="flex items-center space-x-1 font-mono font-bold text-xs text-slate-800">
                <span>{receiptNumber}</span>
                <button
                  type="button"
                  onClick={() => setReceiptNumber(generateTransactionNumber(paymentDate))}
                  className="p-1 hover:text-emerald-600"
                  title="Generate nomor transaksi baru"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-start space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Warning if Month Already Paid (Anti-Duplicate Check) */}
          {isMonthAlreadyPaid && (
            <div className="mb-5 bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-start space-x-3 text-xs">
              <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">
                  Bulan {selectedMonth} {selectedYear} Telah Lunas Terbayar!
                </p>
                <p className="text-[11px] text-emerald-800 mt-1">
                  Tagihan untuk bulan ini sudah lunas penuh (Total terbayar:{' '}
                  <strong>{formatRupiah(alreadyPaidForMonth)}</strong>). Sistem mencegah pencatatan
                  pembayaran ganda untuk menjaga akurasi pembukuan kas.
                </p>
                <p className="text-[11px] text-emerald-700 mt-1 italic">
                  Silakan pilih bulan lain yang masih memiliki tagihan atau tunggakan.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-5 text-xs sm:text-sm">
            {/* Row 1: Tanggal Bayar & Periode Bulan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Pembayaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Periode SPP <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {SPP_MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Tagihan Info Card (Tarif, Sudah Bayar, Sisa Tagihan) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Tarif SPP Bulan Ini
                  </span>
                  <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">
                    {formatRupiah(monthlySppTariff)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Telah Dibayar
                  </span>
                  <span className="text-sm font-bold text-emerald-700 font-mono mt-0.5 block">
                    {formatRupiah(alreadyPaidForMonth)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Sisa Tagihan Bulan Ini
                  </span>
                  <span
                    className={`text-sm font-extrabold font-mono mt-0.5 block ${
                      remainingForMonth > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {formatRupiah(remainingForMonth)}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 3: Input Nominal Pembayaran & Pilihan Cepat */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Nominal yang Dibayarkan (Rp) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-bold text-emerald-800 font-mono">
                  {formatRupiah(payAmount)}
                </span>
              </div>

              <input
                type="number"
                min={0}
                max={remainingForMonth}
                step={5000}
                disabled={isMonthAlreadyPaid}
                value={payAmount || ''}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  setPayAmount(val);
                  if (paymentMethod === 'Tunai' && cashTendered < val) {
                    setCashTendered(val);
                  }
                }}
                placeholder="Masukkan nominal setoran..."
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-extrabold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />

              {/* Quick Amount Buttons */}
              {!isMonthAlreadyPaid && remainingForMonth > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-500 mr-1">Pilihan Cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(remainingForMonth)}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 transition"
                  >
                    Bayar Lunas Penuh ({formatRupiah(remainingForMonth)})
                  </button>

                  {remainingForMonth >= 100000 && (
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(Math.round(remainingForMonth / 2))}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-300 transition"
                    >
                      Cicil 50% ({formatRupiah(Math.round(remainingForMonth / 2))})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleQuickAmount(100000)}
                    disabled={remainingForMonth < 100000}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-300 transition disabled:opacity-40"
                  >
                    Rp 100.000
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAmount(200000)}
                    disabled={remainingForMonth < 200000}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-300 transition disabled:opacity-40"
                  >
                    Rp 200.000
                  </button>
                </div>
              )}

              {/* Kalkulasi Status Otomatis */}
              {!isMonthAlreadyPaid && payAmount > 0 && (
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Status Transaksi
                    </span>
                    <span
                      className={`inline-flex items-center space-x-1 font-bold ${
                        statusThisPayment === 'Lunas' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {statusThisPayment === 'Lunas' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>LUNAS (Bulan ini tertutup penuh)</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>SEBAGIAN / CICILAN</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                      Sisa Tagihan Setelah Ini
                    </span>
                    <span
                      className={`font-bold font-mono ${
                        remainingAfterThisPayment === 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {formatRupiah(remainingAfterThisPayment)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Metode Pembayaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const isChosen = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      disabled={isMonthAlreadyPaid}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                        isChosen
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {method === 'Tunai' && <Wallet className="w-3.5 h-3.5" />}
                      {method === 'Transfer Bank' && <Building className="w-3.5 h-3.5" />}
                      {method === 'QRIS' && <QrCode className="w-3.5 h-3.5" />}
                      {method === 'Tabungan Siswa' && <PiggyBank className="w-3.5 h-3.5" />}
                      <span>{method}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-form Metode Tunai (Cash Tendered & Change) */}
              {paymentMethod === 'Tunai' && (
                <div className="mt-3 p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Uang Tunai Diterima dari Siswa/Wali:
                      </label>
                      <input
                        type="number"
                        min={payAmount}
                        step={10000}
                        disabled={isMonthAlreadyPaid}
                        value={cashTendered || ''}
                        onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="sm:text-right bg-white px-3 py-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Uang Kembalian
                      </span>
                      <span className="text-sm font-extrabold text-emerald-700 font-mono">
                        {formatRupiah(changeAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    <span className="text-slate-500 self-center">Uang Pas:</span>
                    <button
                      type="button"
                      onClick={() => setCashTendered(payAmount)}
                      className="px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 font-mono"
                    >
                      Uang Pas ({formatRupiah(payAmount)})
                    </button>
                    {[100000, 200000, 300000, 400000, 500000].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCashTendered(c)}
                        className="px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-slate-100 font-mono"
                      >
                        {formatRupiah(c)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-form Transfer Bank */}
              {paymentMethod === 'Transfer Bank' && (
                <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <label className="block text-[11px] font-bold text-blue-900">
                    Pilih Rekening Tujuan Transfer Sekolah:
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {BANK_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sub-form QRIS */}
              {paymentMethod === 'QRIS' && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-3 text-xs text-slate-600">
                  <QrCode className="w-8 h-8 text-slate-700 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800">QRIS Dinamis Kasir TU Sekolah</p>
                    <p className="text-[11px] text-slate-500">
                      Tunjukkan kode QR pada layar atau cetak struk agar orang tua/siswa memindai dengan mobile banking / e-wallet.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Row 5: Petugas Kasir & Catatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Petugas Penerima <span className="text-rose-500">*</span>
                </label>
                <select
                  value={recordedBy}
                  onChange={(e) => setRecordedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {DEFAULT_OFFICERS.map((off) => (
                    <option key={off} value={off}>
                      {off}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Kuitansi / Pembayaran
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan transaksi..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isSubmitting || isMonthAlreadyPaid || payAmount <= 0}
              onClick={() => handleSubmitPayment(false)}
              className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Simpan Transaksi Saja
            </button>

            <button
              type="button"
              disabled={isSubmitting || isMonthAlreadyPaid || payAmount <= 0}
              onClick={() => handleSubmitPayment(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Simpan & Cetak Bukti (PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
