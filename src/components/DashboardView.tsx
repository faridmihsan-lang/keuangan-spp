import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Receipt,
  CreditCard,
  UserPlus,
  FileText,
  Settings as SettingsIcon,
  Printer,
  Calendar,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  Layers,
  Percent,
} from 'lucide-react';
import { Student, PaymentRecord } from '../types/student';
import {
  computeDashboardMetrics,
  computeMonthlyIncomeTrend,
  computeGradeLevelComparison,
  getTopDebtors,
} from '../utils/dashboardCalculations';
import { formatRupiah, SPP_MONTHS } from '../utils/formatters';

interface DashboardViewProps {
  students: Student[];
  payments: PaymentRecord[];
  activeAcademicYear: string;
  currentBillingMonth: string;
  onSelectAcademicYear: (year: string) => void;
  onPayStudent: (student: Student) => void;
  onOpenAddStudent: () => void;
  onGoToReports: () => void;
  onGoToSettings: () => void;
  onPrintReceipt: (payment: PaymentRecord, student: Student | null) => void;
  userRole: 'admin' | 'petugas' | 'kepala_sekolah';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  payments,
  activeAcademicYear,
  currentBillingMonth,
  onPayStudent,
  onOpenAddStudent,
  onGoToReports,
  onGoToSettings,
  onPrintReceipt,
  userRole,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(currentBillingMonth || 'Oktober');

  // Compute live real-time metrics (strictly based on Firestore data)
  const metrics = computeDashboardMetrics(students, payments, activeAcademicYear, selectedMonth);
  const monthlyTrend = computeMonthlyIncomeTrend(students, payments, activeAcademicYear, selectedMonth);
  const gradeComparison = computeGradeLevelComparison(students, payments, activeAcademicYear);
  const topDebtors = getTopDebtors(students, payments, activeAcademicYear, 5);

  // Maximum monthly collected for visual scaling
  const maxCollectedInTrend = Math.max(...monthlyTrend.map((t) => t.totalCollected), 100000);

  // Latest 6 transactions
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.createdAt || b.paymentDate).getTime() - new Date(a.createdAt || a.paymentDate).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg border border-slate-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Modul 4: Dashboard Eksekutif
            </span>
            <span className="text-xs text-slate-300 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>T.A: <strong>{activeAcademicYear}</strong></span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Ringkasan & Analisis Finansial SPP
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Semua metrik dan grafik diperbarui secara real-time langsung dari database cloud Firestore. Tanpa angka statis atau simulasi tiruan.
          </p>
        </div>

        {/* Quick Month Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700/80 text-xs">
          <span className="text-slate-300 font-medium px-2">Bulan Tagihan:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 text-emerald-400 font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {SPP_MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <button
            onClick={onGoToSettings}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
            title="Buka Pengaturan Sistem"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pengaturan</span>
          </button>
        </div>
      </div>

      {/* 6 Key Real-Time KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Siswa Aktif */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Siswa Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{metrics.totalActiveStudents}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {metrics.totalInactiveStudents > 0 ? `${metrics.totalInactiveStudents} siswa non-aktif` : '100% siswa terdaftar aktif'}
            </p>
          </div>
        </div>

        {/* Card 2: Lunas Bulan Ini */}
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Lunas ({selectedMonth})</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{metrics.paidThisMonthCount}</div>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
              {metrics.totalActiveStudents > 0
                ? `${Math.round((metrics.paidThisMonthCount / metrics.totalActiveStudents) * 100)}% dari siswa aktif`
                : '0%'}
            </p>
          </div>
        </div>

        {/* Card 3: Belum Lunas Bulan Ini */}
        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-xs flex flex-col justify-between hover:border-rose-200 transition">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Belum Lunas ({selectedMonth})</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600">
              {metrics.unpaidThisMonthCount + metrics.partialThisMonthCount}
            </div>
            <p className="text-[11px] text-rose-700 font-medium mt-0.5">
              {metrics.partialThisMonthCount > 0 ? `${metrics.partialThisMonthCount} cicil, ${metrics.unpaidThisMonthCount} belum bayar` : 'Perlu ditagih'}
            </p>
          </div>
        </div>

        {/* Card 4: Tagihan Bulan Berjalan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Tagihan {selectedMonth}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 truncate" title={formatRupiah(metrics.totalMonthlyObligation)}>
              {formatRupiah(metrics.totalMonthlyObligation)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Target 1 bulan ({selectedMonth})
            </p>
          </div>
        </div>

        {/* Card 5: Kas Masuk Diterima */}
        <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-xs flex flex-col justify-between hover:border-teal-200 transition">
          <div className="flex items-center justify-between text-teal-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Kas Masuk</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-teal-700 truncate" title={formatRupiah(metrics.totalCollectedYearly)}>
              {formatRupiah(metrics.totalCollectedYearly)}
            </div>
            <p className="text-[11px] text-teal-800 font-semibold mt-0.5">
              {metrics.collectionRate}% tercapai dari total T.A
            </p>
          </div>
        </div>

        {/* Card 6: Sisa Tunggakan */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between hover:border-amber-300 transition">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Sisa Tunggakan</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg font-black text-amber-700 truncate" title={formatRupiah(metrics.totalRemainingArrears)}>
              {formatRupiah(metrics.totalRemainingArrears)}
            </div>
            <p className="text-[11px] text-amber-800 font-medium mt-0.5">
              Saldo piutang sekolah
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
          <span className="px-2 py-1 bg-slate-100 rounded text-slate-600">Pintasan Cepat:</span>
          <span className="text-slate-500 font-normal hidden sm:inline">Navigasi langsung antar modul terpadu</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {userRole !== 'kepala_sekolah' && (
            <button
              onClick={() => {
                if (students.length > 0) onPayStudent(students[0]);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Input Bayar SPP (Modul 2)</span>
            </button>
          )}

          {userRole === 'admin' && (
            <button
              onClick={onOpenAddStudent}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Siswa (Modul 1)</span>
            </button>
          )}

          <button
            onClick={onGoToReports}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg transition"
          >
            <FileText className="w-3.5 h-3.5 text-amber-700" />
            <span>Rekap Tunggakan (Modul 3)</span>
          </button>

          <button
            onClick={onGoToSettings}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg transition"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>Pengaturan & Backup</span>
          </button>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik 1: Pemasukan SPP Bulanan (12 Bulan) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Grafik Pemasukan Kas SPP Bulanan (12 Bulan T.A)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Realisasi setoran kas masuk per bulan berdasarkan tanggal bayar yang sah.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="flex items-center space-x-1 text-slate-600">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                  <span>Bulan Berjalan ({selectedMonth})</span>
                </span>
                <span className="flex items-center space-x-1 text-slate-500">
                  <span className="w-3 h-3 rounded bg-slate-300 inline-block"></span>
                  <span>Bulan Lain</span>
                </span>
              </div>
            </div>

            {/* Interactive Bar Chart Visualization */}
            <div className="pt-6 pb-2">
              <div className="h-56 flex items-end justify-between gap-1 sm:gap-2 px-1 border-b border-slate-200">
                {monthlyTrend.map((item) => {
                  const heightPercent = maxCollectedInTrend > 0
                    ? Math.max(8, Math.round((item.totalCollected / maxCollectedInTrend) * 100))
                    : 8;

                  return (
                    <div
                      key={item.monthName}
                      className="flex-1 flex flex-col items-center group relative cursor-pointer"
                      onClick={() => setSelectedMonth(item.monthName)}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none z-20 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-lg text-center whitespace-nowrap">
                        <p className="font-bold">{item.monthName} {item.calendarYear}</p>
                        <p className="text-emerald-400 font-semibold">{formatRupiah(item.totalCollected)}</p>
                        <p className="text-slate-300">{item.transactionCount} transaksi</p>
                      </div>

                      {/* Bar Value on Top (compact) */}
                      {item.totalCollected > 0 && (
                        <span className="text-[9px] font-bold text-slate-600 mb-1 hidden sm:block">
                          {(item.totalCollected / 1000).toLocaleString('id-ID')}k
                        </span>
                      )}

                      {/* Bar Fill */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          item.isCurrentMonth
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-sm shadow-emerald-500/30'
                            : item.totalCollected > 0
                            ? 'bg-gradient-to-t from-slate-400 to-slate-300 group-hover:from-emerald-400 group-hover:to-teal-300'
                            : 'bg-slate-100 group-hover:bg-slate-200'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Month X-axis Labels */}
              <div className="flex justify-between gap-1 sm:gap-2 px-1 pt-2 text-[10px] sm:text-xs font-semibold text-slate-600">
                {monthlyTrend.map((item) => (
                  <button
                    key={item.monthName}
                    onClick={() => setSelectedMonth(item.monthName)}
                    className={`flex-1 text-center truncate py-0.5 rounded transition ${
                      item.isCurrentMonth
                        ? 'text-emerald-700 font-extrabold bg-emerald-50'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {item.monthName.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Pemasukan {selectedMonth}: <strong className="text-emerald-700 font-bold">{formatRupiah(metrics.totalCollectedThisMonth)}</strong>
            </span>
            <button
              onClick={onGoToReports}
              className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline inline-flex items-center space-x-1"
            >
              <span>Buka Rekap Bulanan &rarr;</span>
            </button>
          </div>
        </div>

        {/* Grafik 2: Perbandingan Tagihan vs Realisasi per Tingkat Kelas */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Percent className="w-4 h-4 text-teal-600" />
                <span>Ketercapaian per Tingkat Kelas</span>
              </h3>
              <p className="text-xs text-slate-500">
                Rasio realisasi pembayaran dibanding total kewajiban 1 tahun.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {gradeComparison.map((grade) => (
                <div key={grade.name} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-bold text-slate-800">{grade.name}</span>
                    <span className="font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {grade.percentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden my-2">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        grade.percentage >= 75
                          ? 'bg-emerald-500'
                          : grade.percentage >= 40
                          ? 'bg-teal-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${grade.percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Masuk: <strong>{formatRupiah(grade.totalCollected)}</strong></span>
                    <span>Target: {formatRupiah(grade.totalObligation)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Rata-rata Sekolah: <strong className="text-slate-800 font-bold">{metrics.collectionRate}%</strong></span>
            <button
              onClick={onGoToReports}
              className="text-teal-700 hover:text-teal-800 font-bold hover:underline"
            >
              Lihat Detail per Kelas
            </button>
          </div>
        </div>
      </div>

      {/* Dual Bottom Grid: Transaksi Terbaru & Siswa Tunggakan Terbesar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Daftar Transaksi Terbaru */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Daftar Transaksi Kasir Terbaru</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Pencatatan pembayaran kasir secara langsung
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
              {payments.length} Kuitansi
            </span>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentPayments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada transaksi pembayaran yang tercatat di database.
              </div>
            ) : (
              recentPayments.map((p) => {
                const matchedStudent = students.find((s) => s.id === p.studentId) || null;
                return (
                  <div
                    key={p.id}
                    className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 truncate">{p.studentName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                          {p.gradeClass}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-slate-600">{p.receiptNumber}</span>
                        <span>•</span>
                        <span>Bulan: <strong>{p.month}</strong></span>
                        <span>•</span>
                        <span className="text-slate-400">{p.paymentDate}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-black text-emerald-700">{formatRupiah(p.amount)}</div>
                      <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                        <span className="text-[10px] px-1.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.paymentMethod}
                        </span>
                        <button
                          onClick={() => onPrintReceipt(p, matchedStudent)}
                          className="p-1 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded transition"
                          title="Cetak Bukti PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kolom Kanan: Daftar Siswa dengan Tunggakan Terbesar / Terlama */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Siswa dengan Tunggakan Terbesar & Terlama</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Prioritas penagihan administrasi sekolah
              </p>
            </div>
            <button
              onClick={onGoToReports}
              className="text-xs text-rose-700 hover:text-rose-800 font-bold hover:underline"
            >
              Lihat Semua &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {topDebtors.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada siswa yang menunggak! Seluruh tagihan telah lunas.
              </div>
            ) : (
              topDebtors.map((item, idx) => (
                <div
                  key={item.student.id}
                  className="p-3.5 hover:bg-rose-50/30 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-black text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 truncate">{item.student.fullName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                          {item.student.gradeClass}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1.5">
                        <span className="font-mono text-slate-600">NIS: {item.student.nis}</span>
                        <span>•</span>
                        <span className="text-rose-600 font-semibold">
                          {item.monthsUnpaidCount} bulan belum lunas
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center space-x-2">
                    <div>
                      <div className="font-black text-rose-700">{formatRupiah(item.totalArrears)}</div>
                      <div className="text-[10px] text-slate-400">Total Tunggakan</div>
                    </div>

                    {userRole !== 'kepala_sekolah' && (
                      <button
                        onClick={() => onPayStudent(item.student)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition"
                        title="Bayar SPP Sekarang di Modul 2"
                      >
                        Bayar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
