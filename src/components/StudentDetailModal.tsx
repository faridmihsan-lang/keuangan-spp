import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  PlusCircle,
  Phone,
  MapPin,
  User,
  GraduationCap,
  Sparkles,
  Receipt,
  Trash2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Student, PaymentRecord, MonthSppSummary, PaymentMethod, PaymentStatus } from '../types/student';
import {
  formatRupiah,
  formatDateIndo,
  formatDateTimeIndo,
  SPP_MONTHS,
} from '../utils/formatters';
import {
  subscribeStudentPayments,
  addPayment,
  deletePayment,
  computeStudentSppOverview,
  generateReceiptNumber,
  seedSamplePaymentsForStudent,
} from '../services/paymentService';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onOpenReceiptPrint: (payment: PaymentRecord, student: Student) => void;
  onOpenPaymentModule?: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  onOpenReceiptPrint,
  onOpenPaymentModule,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'history' | 'profile'>('matrix');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Pay Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payMonth, setPayMonth] = useState('Juli');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Tunai');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [isSeedingPayments, setIsSeedingPayments] = useState(false);

  useEffect(() => {
    if (!student || !isOpen) return;

    setIsLoading(true);
    setPayAmount(student.monthlySppNominal);

    const unsubscribe = subscribeStudentPayments(
      student.id,
      (records) => {
        setPayments(records);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching student payments:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const sppOverview = computeStudentSppOverview(student, payments);
  const cleanPhone = student.phone.replace(/[^0-9]/g, '');
  const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}` : null;

  // Open quick pay for a specific month
  const handleQuickPayForMonth = (monthName: string) => {
    setPayMonth(monthName);
    setPayAmount(student.monthlySppNominal);
    setPayNotes(`Pembayaran SPP Bulan ${monthName}`);
    setIsPayModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || payAmount <= 0) return;

    setIsSubmittingPay(true);
    try {
      const receiptNo = generateReceiptNumber(student.academicYear);
      const today = new Date().toISOString().split('T')[0];
      const parts = student.academicYear.split('/');
      const startYear = parseInt(parts[0], 10) || new Date().getFullYear();
      const monthIdx = SPP_MONTHS.indexOf(payMonth as any);
      const calendarYear = monthIdx < 6 ? startYear : startYear + 1;

      const amt = Number(payAmount);
      const remaining = Math.max(0, student.monthlySppNominal - amt);
      const finalStatus: PaymentStatus = remaining === 0 && amt > 0 ? 'Lunas' : 'Sebagian';

      await addPayment({
        studentId: student.id,
        studentNis: student.nis,
        studentName: student.fullName,
        gradeClass: student.gradeClass,
        academicYear: student.academicYear,
        month: payMonth,
        year: calendarYear,
        amount: amt,
        monthlySppNominal: student.monthlySppNominal,
        remainingBalance: remaining,
        paymentDate: today,
        paymentMethod: payMethod,
        receiptNumber: receiptNo,
        status: finalStatus,
        notes: payNotes.trim(),
        recordedBy: 'Petugas Tata Usaha',
      });

      setIsPayModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal mencatat pembayaran SPP. Silakan coba kembali.');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (confirm('Apakah Anda yakin ingin membatalkan/menghapus catatan transaksi pembayaran ini?')) {
      try {
        await deletePayment(paymentId);
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus transaksi.');
      }
    }
  };

  const handleSeedPayments = async () => {
    setIsSeedingPayments(true);
    try {
      await seedSamplePaymentsForStudent(student);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeedingPayments(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Profile Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 sm:p-6 shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
            <GraduationCap className="w-56 h-56" />
          </div>

          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-4">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-bold border-2 ${
                  student.gender === 'L'
                    ? 'bg-blue-600/30 border-blue-400 text-blue-200'
                    : 'bg-rose-600/30 border-rose-400 text-rose-200'
                }`}
              >
                {student.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                    {student.fullName}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      student.status === 'aktif'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {student.status === 'aktif' ? 'Siswa Aktif' : 'Tidak Aktif'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-300">
                  <span className="font-mono bg-black/20 px-2 py-0.5 rounded">
                    NIS: <strong className="text-emerald-300">{student.nis}</strong>
                  </span>
                  <span>NISN: {student.nisn || '-'}</span>
                  <span>•</span>
                  <span className="font-semibold text-white">{student.gradeClass}</span>
                  <span>•</span>
                  <span>{student.academicYear}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-5 pt-4 border-t border-slate-700/60 text-xs">
            <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">SPP Bulanan</span>
              <p className="text-sm sm:text-base font-bold text-white mt-0.5">
                {formatRupiah(student.monthlySppNominal)}
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold">Total Terbayar</span>
              <p className="text-sm sm:text-base font-bold text-emerald-300 mt-0.5">
                {formatRupiah(sppOverview.totalPaid)}
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
              <span className="text-[10px] text-rose-400 uppercase font-semibold">Total Tunggakan</span>
              <p className="text-sm sm:text-base font-bold text-rose-300 mt-0.5">
                {formatRupiah(sppOverview.totalArrears)}
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
              <span className="text-[10px] text-blue-400 uppercase font-semibold">Progres SPP</span>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-sm sm:text-base font-bold text-white">
                  {sppOverview.monthsPaidCount} / 12 bln
                </p>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  {Math.round((sppOverview.monthsPaidCount / 12) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Action Bar */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'matrix'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matriks SPP 12 Bulan
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'history'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Riwayat Kuitansi ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'profile'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Identitas Lengkap
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {payments.length === 0 && (
              <button
                onClick={handleSeedPayments}
                disabled={isSeedingPayments}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSeedingPayments ? 'Memproses...' : 'Simulasi Pembayaran (3 Bln)'}</span>
              </button>
            )}

            {onOpenPaymentModule && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPaymentModule(student);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                title="Buka siswa ini di Modul 2 Kasir Pembayaran SPP"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                <span>Buka di Kasir Modul 2</span>
              </button>
            )}

            <button
              onClick={() => {
                // Default to next unpaid month
                const firstUnpaid = sppOverview.months.find((m) => !m.isPaid);
                handleQuickPayForMonth(firstUnpaid ? firstUnpaid.monthName : 'Juli');
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Bayar Cepat</span>
            </button>
          </div>
        </div>

        {/* Tab Contents (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: 12-Month Matrix */}
          {activeTab === 'matrix' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                    Status Kewajiban SPP per Bulan — Tahun Ajaran {student.academicYear}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Kalender akademik sekolah berjalan dari bulan Juli s/d Juni tahun berikutnya.
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Lunas ({sppOverview.monthsPaidCount})</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-slate-600">Tunggakan ({sppOverview.monthsUnpaidCount})</span>
                  </span>
                </div>
              </div>

              {/* 12 Months Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {sppOverview.months.map((m) => {
                  return (
                    <div
                      key={m.monthName}
                      className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                        m.isPaid
                          ? 'bg-emerald-50/70 border-emerald-300/80 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            {m.order}. {m.monthName} {m.calendarYear}
                          </span>
                          {m.isPaid ? (
                            <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 mr-0.5" />
                              Lunas
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">
                              <AlertCircle className="w-3 h-3 mr-0.5" />
                              Belum Bayar
                            </span>
                          )}
                        </div>

                        <div className="mt-2 text-xs">
                          <p className="text-slate-500 text-[10px]">Nominal SPP:</p>
                          <p className="font-semibold text-slate-800">
                            {formatRupiah(m.requiredAmount)}
                          </p>
                        </div>

                        {m.isPaid && m.paymentRecord && (
                          <div className="mt-2 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-800 space-y-0.5">
                            <p>
                              Tgl: <span className="font-medium">{formatDateIndo(m.paymentRecord.paymentDate)}</span>
                            </p>
                            <p className="font-mono truncate">
                              No: {m.paymentRecord.receiptNumber}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100">
                        {m.isPaid && m.paymentRecord ? (
                          <button
                            onClick={() => onOpenReceiptPrint(m.paymentRecord!, student)}
                            className="w-full py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium flex items-center justify-center space-x-1 transition"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Cetak Bukti</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleQuickPayForMonth(m.monthName)}
                            className="w-full py-1 px-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 rounded text-[11px] font-medium flex items-center justify-center space-x-1 transition"
                          >
                            <PlusCircle className="w-3 h-3 text-emerald-600" />
                            <span>Bayar Bulan Ini</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Payment Receipt History */}
          {activeTab === 'history' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                    Buku Kas Pembayaran SPP — {student.fullName}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Seluruh catatan transaksi kuitansi pembayaran SPP yang tersimpan di sistem.
                  </p>
                </div>
              </div>

              {payments.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-8 text-center border border-dashed border-slate-300">
                  <Receipt className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Belum Ada Transaksi Pembayaran</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                    Siswa ini belum memiliki catatan riwayat pembayaran SPP yang tercatat di database.
                  </p>
                  <button
                    onClick={() => handleQuickPayForMonth('Juli')}
                    className="mt-4 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Catat Pembayaran Pertama
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                        <th className="py-2.5 px-3">No. Kuitansi</th>
                        <th className="py-2.5 px-3">Bulan SPP</th>
                        <th className="py-2.5 px-3">Tanggal Bayar</th>
                        <th className="py-2.5 px-3">Nominal (Rp)</th>
                        <th className="py-2.5 px-3">Metode</th>
                        <th className="py-2.5 px-3">Petugas TU</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                            {p.receiptNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-800">
                            {p.month} {p.year}
                          </td>
                          <td className="py-2.5 px-3">{formatDateIndo(p.paymentDate)}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {formatRupiah(p.amount)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                              {p.paymentMethod}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">{p.recordedBy}</td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => onOpenReceiptPrint(p, student)}
                                className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                                title="Cetak Kuitansi"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePayment(p.id)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                title="Batalkan Transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Full Student Identity */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Identity Details Card */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Identitas Lengkap Siswa</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Nomor Induk Siswa (NIS)</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{student.nis}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">NISN Nasional</span>
                    <span className="font-mono font-semibold text-slate-800">{student.nisn || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Nama Lengkap</span>
                    <span className="font-semibold text-slate-900">{student.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Jenis Kelamin</span>
                    <span className="font-medium text-slate-800">
                      {student.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Kelas & Rombel</span>
                    <span className="font-bold text-emerald-800">{student.gradeClass}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Tahun Ajaran Masuk</span>
                    <span className="font-medium text-slate-800">{student.academicYear}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Nominal SPP Bulanan</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {formatRupiah(student.monthlySppNominal)} / bulan
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Status Keaktifan</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        student.status === 'aktif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {student.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parents & Contact Card */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Data Kontak Orang Tua / Wali</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Nama Orang Tua / Wali</span>
                    <span className="font-semibold text-slate-900">{student.parentName || '-'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Nomor HP / WhatsApp</span>
                    {student.phone ? (
                      waLink ? (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1.5 text-emerald-700 hover:text-emerald-800 font-semibold hover:underline mt-0.5"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{student.phone}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded">
                            Buka WhatsApp
                          </span>
                        </a>
                      ) : (
                        <span className="text-slate-800 font-mono">{student.phone}</span>
                      )
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase">Alamat Lengkap</span>
                    <div className="flex items-start space-x-1.5 mt-0.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{student.address || 'Alamat belum dilengkapi'}</span>
                    </div>
                  </div>

                  {student.notes && (
                    <div className="sm:col-span-2 bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-900">
                      <span className="text-[10px] font-bold uppercase text-amber-700 block">
                        Catatan Khusus Siswa
                      </span>
                      <span>{student.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* System Metadata */}
              <div className="text-[10px] text-slate-400 flex items-center justify-between px-2">
                <span>Terdaftar sejak: {formatDateTimeIndo(student.createdAt)}</span>
                <span>Pembaruan terakhir: {formatDateTimeIndo(student.updatedAt)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Koneksi Database: <span className="font-semibold text-emerald-700">Firestore (Permanen)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
          >
            Tutup Detail
          </button>
        </div>
      </div>

      {/* QUICK PAYMENT RECORD MODAL */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Catat Pembayaran SPP</h3>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-4 text-xs">
              <div>
                <p className="text-slate-500">Siswa:</p>
                <p className="font-bold text-slate-900 text-sm">{student.fullName}</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  NIS: {student.nis} • Kelas: {student.gradeClass}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bulan yang Dibayar <span className="text-rose-500">*</span>
                </label>
                <select
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {SPP_MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nominal Pembayaran (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1000}
                  step={5000}
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Nominal standar SPP: {formatRupiah(student.monthlySppNominal)}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Metode Pembayaran <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Tunai', 'Transfer Bank', 'QRIS'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayMethod(method)}
                      className={`py-1.5 px-2 rounded-lg border text-center font-medium transition ${
                        payMethod === method
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold ring-1 ring-emerald-500'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Kuitansi
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Contoh: Lunas via Kasir TU"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs disabled:opacity-50"
                >
                  {isSubmittingPay ? 'Menyimpan...' : 'Simpan Pembayaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
