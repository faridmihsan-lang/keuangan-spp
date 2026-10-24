import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Printer,
  Search,
  Wallet,
  Calendar,
  Users,
  GraduationCap,
  CreditCard,
  Eye,
  FileText,
  TrendingUp,
  X,
  ArrowUpDown,
  Building,
  HelpCircle,
} from 'lucide-react';
import {
  Student,
  PaymentRecord,
  StudentArrearSummary,
  StudentArrearStatus,
  ClassSummary,
} from '../types/student';
import {
  formatRupiah,
  formatDateIndo,
  DEFAULT_CLASSES,
  SPP_MONTHS,
} from '../utils/formatters';
import {
  computeAllStudentArrears,
  computeClassSummaries,
  computeDailyCashFlow,
  computeMonthlyCashFlow,
} from '../utils/reportCalculations';
import { ArrearsLetterModal } from './ArrearsLetterModal';
import { AuditTransactionsModal } from './AuditTransactionsModal';
import * as XLSX from 'xlsx';

interface ArrearsReportViewProps {
  students: Student[];
  payments: PaymentRecord[];
  activeAcademicYear: string;
  onPayStudentInModule2: (student: Student) => void;
  onPrintPaymentReceipt: (payment: PaymentRecord, student: Student | null) => void;
}

export const ArrearsReportView: React.FC<ArrearsReportViewProps> = ({
  students,
  payments,
  activeAcademicYear,
  onPayStudentInModule2,
  onPrintPaymentReceipt,
}) => {
  // Sub-tabs in Modul 3: 'students' | 'classes' | 'cashflow' | 'matrix'
  const [subTab, setSubTab] = useState<'students' | 'classes' | 'cashflow' | 'matrix'>('students');

  // Filters for Student Arrears Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState<'Semua' | StudentArrearStatus>('Semua');

  // Sorting for Student Arrears
  const [sortField, setSortField] = useState<'totalArrears' | 'fullName' | 'gradeClass'>('totalArrears');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [letterArrearItem, setLetterArrearItem] = useState<StudentArrearSummary | null>(null);
  const [auditModalData, setAuditModalData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    payments: PaymentRecord[];
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    payments: [],
  });

  // Calculate student arrears using latest Firestore data
  const studentArrearsList: StudentArrearSummary[] = useMemo(() => {
    return computeAllStudentArrears(students, payments, activeAcademicYear);
  }, [students, payments, activeAcademicYear]);

  // Calculate class summaries
  const classSummaries: ClassSummary[] = useMemo(() => {
    return computeClassSummaries(students, payments, activeAcademicYear);
  }, [students, payments, activeAcademicYear]);

  // Calculate daily cash flow
  const dailyCashList = useMemo(() => {
    return computeDailyCashFlow(payments);
  }, [payments]);

  // Calculate monthly cash flow
  const monthlyCashList = useMemo(() => {
    return computeMonthlyCashFlow(payments, activeAcademicYear);
  }, [payments, activeAcademicYear]);

  // Overall KPI metrics
  const totalTargetObligation = useMemo(() => {
    return studentArrearsList.reduce((sum, s) => sum + s.totalRequired, 0);
  }, [studentArrearsList]);

  const totalActualCashCollected = useMemo(() => {
    return studentArrearsList.reduce((sum, s) => sum + s.totalPaid, 0);
  }, [studentArrearsList]);

  const totalRemainingArrears = useMemo(() => {
    return studentArrearsList.reduce((sum, s) => sum + s.totalArrears, 0);
  }, [studentArrearsList]);

  const overallCollectionRatio = totalTargetObligation > 0
    ? Math.round((totalActualCashCollected / totalTargetObligation) * 100)
    : 0;

  const countFullyPaid = useMemo(
    () => studentArrearsList.filter((s) => s.status === 'lunas').length,
    [studentArrearsList]
  );
  const countPartial = useMemo(
    () => studentArrearsList.filter((s) => s.status === 'sebagian').length,
    [studentArrearsList]
  );
  const countArrears = useMemo(
    () => studentArrearsList.filter((s) => s.status === 'menunggak' || s.status === 'belum_bayar').length,
    [studentArrearsList]
  );

  // Distinct classes list for filter
  const distinctClasses = useMemo(() => {
    const set = new Set([...DEFAULT_CLASSES, ...students.map((s) => s.gradeClass).filter(Boolean)]);
    return Array.from(set).sort();
  }, [students]);

  // Filtered student arrears
  const filteredStudentArrears = useMemo(() => {
    return studentArrearsList.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNis = item.student.nis.toLowerCase().includes(q);
        const matchName = item.student.fullName.toLowerCase().includes(q);
        const matchClass = item.student.gradeClass.toLowerCase().includes(q);
        if (!matchNis && !matchName && !matchClass) {
          return false;
        }
      }

      // Class
      if (selectedClass !== 'Semua' && item.student.gradeClass !== selectedClass) {
        return false;
      }

      // Status
      if (selectedStatus !== 'Semua' && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [studentArrearsList, searchQuery, selectedClass, selectedStatus]);

  // Sorted student arrears
  const sortedStudentArrears = useMemo(() => {
    return [...filteredStudentArrears].sort((a, b) => {
      if (sortField === 'totalArrears') {
        return sortOrder === 'asc' ? a.totalArrears - b.totalArrears : b.totalArrears - a.totalArrears;
      } else if (sortField === 'fullName') {
        const cmp = a.student.fullName.localeCompare(b.student.fullName, 'id');
        return sortOrder === 'asc' ? cmp : -cmp;
      } else {
        const cmp = a.student.gradeClass.localeCompare(b.student.gradeClass, 'id');
        return sortOrder === 'asc' ? cmp : -cmp;
      }
    });
  }, [filteredStudentArrears, sortField, sortOrder]);

  const handleSort = (field: 'totalArrears' | 'fullName' | 'gradeClass') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // EXPORT 1: Export Student Arrears to Excel
  const handleExportStudentArrears = () => {
    if (sortedStudentArrears.length === 0) return;

    const rows = sortedStudentArrears.map((item, idx) => ({
      No: idx + 1,
      NIS: item.student.nis,
      'Nama Siswa': item.student.fullName,
      Kelas: item.student.gradeClass,
      'Tarif SPP/Bulan (Rp)': item.student.monthlySppNominal,
      'Total Kewajiban 1 Thn (Rp)': item.totalRequired,
      'Total Terbayar (Rp)': item.totalPaid,
      'Sisa Tunggakan (Rp)': item.totalArrears,
      'Jml Bulan Menunggak': item.monthsUnpaidCount,
      'Bulan Belum Lunas': item.unpaidMonths.join(', '),
      Status: item.status.toUpperCase(),
      'Nama Orang Tua / Wali': item.student.parentName,
      'Nomor HP / WA': item.student.phone,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Tunggakan Siswa');
    XLSX.writeFile(wb, `Rekap_Tunggakan_SPP_Siswa_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // EXPORT 2: Export Class Summaries to Excel
  const handleExportClassSummaries = () => {
    if (classSummaries.length === 0) return;

    const rows = classSummaries.map((c, idx) => ({
      No: idx + 1,
      Kelas: c.gradeClass,
      'Total Siswa': c.totalStudents,
      'Siswa Aktif': c.activeStudents,
      'Target Kewajiban SPP (Rp)': c.totalObligation,
      'Kas Sah Masuk (Rp)': c.totalCollected,
      'Sisa Tunggakan Kelas (Rp)': c.totalArrears,
      'Persentase Capaian (%)': `${c.percentCollected}%`,
      'Jml Siswa Lunas': c.fullyPaidCount,
      'Jml Siswa Cicil': c.partialCount,
      'Jml Siswa Menunggak': c.arrearCount,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekapitulasi Per Kelas');
    XLSX.writeFile(wb, `Rekapitulasi_SPP_Per_Kelas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // EXPORT 3: Export Cashflow to Excel
  const handleExportCashflow = () => {
    if (dailyCashList.length === 0) return;

    const rows = dailyCashList.map((d, idx) => ({
      No: idx + 1,
      Tanggal: d.date,
      'Jumlah Transaksi': d.totalTransactions,
      'Total Kas Masuk (Rp)': d.totalAmount,
      'Metode Tunai (Rp)': d.byMethod['Tunai'] || 0,
      'Metode Transfer Bank (Rp)': d.byMethod['Transfer Bank'] || 0,
      'Metode QRIS (Rp)': d.byMethod['QRIS'] || 0,
      'Tabungan Siswa (Rp)': d.byMethod['Tabungan Siswa'] || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pemasukan Kas Harian');
    XLSX.writeFile(wb, `Laporan_Pemasukan_Kas_SPP_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Module 3 Title Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Modul 3
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Tunggakan & Laporan Keuangan SPP
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekapitulasi sisa tagihan siswa, laporan penerimaan kas harian/bulanan, dan cetak surat pemberitahuan tunggakan resmi.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSubTab('students')}
            className={`px-3 py-2 rounded-lg transition whitespace-nowrap ${
              subTab === 'students'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rekap Siswa & Tunggakan
          </button>
          <button
            onClick={() => setSubTab('classes')}
            className={`px-3 py-2 rounded-lg transition whitespace-nowrap ${
              subTab === 'classes'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rekapitulasi Per Kelas
          </button>
          <button
            onClick={() => setSubTab('cashflow')}
            className={`px-3 py-2 rounded-lg transition whitespace-nowrap ${
              subTab === 'cashflow'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laporan Arus Kas
          </button>
          <button
            onClick={() => setSubTab('matrix')}
            className={`px-3 py-2 rounded-lg transition whitespace-nowrap ${
              subTab === 'matrix'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Matriks 12 Bulan
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Target SPP */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Target Kewajiban SPP
              </p>
              <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                {formatRupiah(totalTargetObligation)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Target 1 Tahun ({students.length} Siswa Terdaftar)
          </p>
        </div>

        {/* Kas Sah Masuk */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">
                Total Kas Sah Diterima
              </p>
              <p className="text-xl font-black mt-1 font-mono">
                {formatRupiah(totalActualCashCollected)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center backdrop-blur-xs">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-emerald-100 mt-2">
            <span>Capaian: {overallCollectionRatio}%</span>
            <span className="font-semibold bg-black/20 px-1.5 py-0.5 rounded">Realisasi Kas</span>
          </div>
        </div>

        {/* Sisa Tunggakan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                Total Sisa Tunggakan SPP
              </p>
              <p className="text-xl font-black text-rose-600 mt-1 font-mono">
                {formatRupiah(totalRemainingArrears)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-rose-700 mt-2 font-medium">
            {countArrears} siswa tercatat belum lunas penuh
          </p>
        </div>

        {/* Status Siswa Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Status Kelulusan Iuran
            </p>
            <div className="grid grid-cols-3 gap-1 mt-2 text-center text-xs">
              <div className="bg-emerald-50 text-emerald-800 p-1 rounded-lg border border-emerald-200">
                <span className="text-[9px] uppercase block font-semibold">Lunas</span>
                <span className="font-bold text-sm">{countFullyPaid}</span>
              </div>
              <div className="bg-amber-50 text-amber-800 p-1 rounded-lg border border-amber-200">
                <span className="text-[9px] uppercase block font-semibold">Cicil</span>
                <span className="font-bold text-sm">{countPartial}</span>
              </div>
              <div className="bg-rose-50 text-rose-800 p-1 rounded-lg border border-rose-200">
                <span className="text-[9px] uppercase block font-semibold">Nunggak</span>
                <span className="font-bold text-sm">{countArrears}</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Indikator: Hijau (Lunas) • Kuning (Cicilan) • Merah (Tunggakan)
          </p>
        </div>
      </div>

      {/* ================= SUB-TAB 1: REKAP TUNGGAKAN SISWA ================= */}
      {subTab === 'students' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan NIS, Nama Siswa, atau Kelas..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportStudentArrears}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition"
                  title="Ekspor rekapitulasi tunggakan siswa ke Excel"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ekspor Excel</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition"
                  title="Cetak rekapitulasi tunggakan SPP ke printer / PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>Cetak / PDF</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 font-semibold flex items-center space-x-1">
                  <Filter className="w-3 h-3 text-slate-400" />
                  <span>Filter:</span>
                </span>

                {/* Filter Kelas */}
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="Semua">Semua Kelas</option>
                  {distinctClasses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Filter Status */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="lunas">Lunas Penuh (Hijau)</option>
                  <option value="sebagian">Pembayaran Sebagian / Cicil (Kuning)</option>
                  <option value="menunggak">Menunggak (Merah)</option>
                  <option value="belum_bayar">Belum Pernah Bayar (Merah)</option>
                </select>

                {(searchQuery || selectedClass !== 'Semua' || selectedStatus !== 'Semua') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedClass('Semua');
                      setSelectedStatus('Semua');
                    }}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold underline underline-offset-2 ml-1"
                  >
                    Reset Filter
                  </button>
                )}
              </div>

              <div className="text-slate-500 text-[11px]">
                Menampilkan <strong className="text-slate-800">{sortedStudentArrears.length}</strong> siswa
              </div>
            </div>
          </div>

          {/* Student Arrears Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 text-center w-8">No</th>
                    <th className="py-3 px-3">NIS & Siswa</th>
                    <th
                      onClick={() => handleSort('gradeClass')}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition select-none"
                    >
                      <div className="flex items-center space-x-1">
                        <span>Kelas</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right">Tarif / Bln</th>
                    <th className="py-3 px-3 text-right">Total Bayar</th>
                    <th
                      onClick={() => handleSort('totalArrears')}
                      className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition select-none"
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Sisa Tunggakan</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Bulan Menunggak</th>
                    <th className="py-3 px-3 text-center w-36">Aksi Laporan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {sortedStudentArrears.map((item, idx) => {
                    const { student, totalPaid, totalArrears, status, unpaidMonths, monthsUnpaidCount } = item;
                    const isLunas = status === 'lunas';
                    const isPartial = status === 'sebagian';

                    // Color indicators according to prompt requirement:
                    // Hijau untuk lunas, kuning untuk pembayaran sebagian, dan merah untuk belum membayar atau menunggak
                    const badgeClass = isLunas
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : isPartial
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300';

                    const dotClass = isLunas
                      ? 'bg-emerald-500'
                      : isPartial
                      ? 'bg-amber-500'
                      : 'bg-rose-500';

                    return (
                      <tr key={student.id} className="hover:bg-slate-50 transition group">
                        <td className="py-3 px-3 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>

                        {/* Student Name & NIS */}
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900 group-hover:text-amber-800">
                            {student.fullName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            NIS: {student.nis}
                          </p>
                        </td>

                        {/* Class */}
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {student.gradeClass}
                          </span>
                        </td>

                        {/* Monthly Tariff */}
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatRupiah(student.monthlySppNominal)}
                        </td>

                        {/* Actual Cash Paid */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                          {formatRupiah(totalPaid)}
                        </td>

                        {/* Remaining Arrears */}
                        <td className="py-3 px-3 text-right font-mono font-black">
                          {totalArrears > 0 ? (
                            <span className="text-rose-600">{formatRupiah(totalArrears)}</span>
                          ) : (
                            <span className="text-emerald-700">Rp 0 (Lunas)</span>
                          )}
                        </td>

                        {/* Status Pill with Strict Color Indication */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1 ${dotClass}`} />
                            {isLunas
                              ? 'Lunas'
                              : isPartial
                              ? 'Sebagian'
                              : status === 'belum_bayar'
                              ? 'Belum Bayar'
                              : 'Menunggak'}
                          </span>
                          <span className="block text-[9px] text-slate-400 mt-0.5">
                            {monthsUnpaidCount === 0 ? 'Semua Bulan Lunas' : `${monthsUnpaidCount} Bulan Belum Lunas`}
                          </span>
                        </td>

                        {/* Overdue Months Badges */}
                        <td className="py-3 px-3 max-w-xs">
                          {isLunas ? (
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>12 Bulan Tuntas</span>
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {unpaidMonths.slice(0, 4).map((m) => (
                                <span
                                  key={m}
                                  className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[9px] font-semibold"
                                >
                                  {m}
                                </span>
                              ))}
                              {unpaidMonths.length > 4 && (
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px]">
                                  +{unpaidMonths.length - 4} bln
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            {/* Surat Tagihan PDF */}
                            {totalArrears > 0 && (
                              <button
                                onClick={() => setLetterArrearItem(item)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition"
                                title="Cetak Surat Tagihan Tunggakan SPP Resmi (PDF)"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* View Audit Transactions */}
                            <button
                              onClick={() => {
                                const matchingP = payments.filter((p) => p.studentId === student.id);
                                setAuditModalData({
                                  isOpen: true,
                                  title: `Audit Transaksi Pembayaran: ${student.fullName}`,
                                  subtitle: `NIS: ${student.nis} • Kelas: ${student.gradeClass} • Tahun Ajaran: ${student.academicYear}`,
                                  payments: matchingP,
                                });
                              }}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition"
                              title="Lihat Detail Transaksi Kuitansi Asli (Dasar Perhitungan)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Pay in Module 2 */}
                            {totalArrears > 0 && (
                              <button
                                onClick={() => onPayStudentInModule2(student)}
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition"
                                title="Buka Pembayaran SPP di Kasir Modul 2"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: REKAPITULASI PER KELAS ================= */}
      {subTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Rekapitulasi Penerimaan & Tunggakan SPP per Rombel Kelas
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Statistik ketercapaian target SPP dan sisa tunggakan untuk masing-masing kelas.
              </p>
            </div>
            <button
              onClick={handleExportClassSummaries}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor Excel Kelas</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 text-center w-8">No</th>
                    <th className="py-3 px-3">Kelas & Rombel</th>
                    <th className="py-3 px-3 text-center">Jml Siswa</th>
                    <th className="py-3 px-3 text-right">Target SPP 1 Thn</th>
                    <th className="py-3 px-3 text-right">Realisasi Kas</th>
                    <th className="py-3 px-3 text-right">Sisa Tunggakan</th>
                    <th className="py-3 px-3 text-center w-36">Capaian (%)</th>
                    <th className="py-3 px-3 text-center">Status Siswa</th>
                    <th className="py-3 px-3 text-center w-20">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {classSummaries.map((c, idx) => (
                    <tr key={c.gradeClass} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {c.gradeClass}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-slate-800">{c.totalStudents}</span>
                        <span className="text-[10px] text-slate-400 block">({c.activeStudents} Aktif)</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium">
                        {formatRupiah(c.totalObligation)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatRupiah(c.totalCollected)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                        {formatRupiah(c.totalArrears)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-bold">
                          <span className={c.percentCollected >= 75 ? 'text-emerald-700' : 'text-amber-700'}>
                            {c.percentCollected}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              c.percentCollected >= 75
                                ? 'bg-emerald-600'
                                : c.percentCollected >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, c.percentCollected)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1 text-[10px]">
                          <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold" title="Lunas">
                            {c.fullyPaidCount} L
                          </span>
                          <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold" title="Cicilan">
                            {c.partialCount} C
                          </span>
                          <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold" title="Menunggak">
                            {c.arrearCount} N
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            const classPayments = payments.filter((p) => p.gradeClass === c.gradeClass);
                            setAuditModalData({
                              isOpen: true,
                              title: `Audit Transaksi Kelas: ${c.gradeClass}`,
                              subtitle: `Total ${classPayments.length} transaksi penerimaan kas kelas ${c.gradeClass}`,
                              payments: classPayments,
                            });
                          }}
                          className="p-1 rounded text-blue-600 hover:bg-blue-50 transition"
                          title="Lihat Seluruh Transaksi Kelas Ini"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 3: LAPORAN ARUS KAS HARIAN & BULANAN ================= */}
      {subTab === 'cashflow' && (
        <div className="space-y-6">
          {/* Daily Cash Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Laporan Penerimaan Kas Harian</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekapitulasi setoran SPP riil yang diterima kasir per tanggal transaksi.
                </p>
              </div>
              <button
                onClick={handleExportCashflow}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Ekspor Kas Harian (Excel)</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase">
                    <th className="py-2.5 px-3">Tanggal Penerimaan</th>
                    <th className="py-2.5 px-3 text-center">Jml Transaksi</th>
                    <th className="py-2.5 px-3 text-right">Total Kas Diterima</th>
                    <th className="py-2.5 px-3">Rincian Metode Pembayaran</th>
                    <th className="py-2.5 px-3 text-center w-20">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {dailyCashList.map((d) => (
                    <tr key={d.date} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {formatDateIndo(d.date)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {d.totalTransactions} kuitansi
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 text-sm">
                        {formatRupiah(d.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          {Object.entries(d.byMethod).map(([m, amt]) => (
                            <span key={m} className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                              {m}: <strong className="text-slate-800">{formatRupiah(amt)}</strong>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            setAuditModalData({
                              isOpen: true,
                              title: `Audit Kas Tanggal: ${formatDateIndo(d.date)}`,
                              subtitle: `Total penerimaan ${formatRupiah(d.totalAmount)} dari ${d.totalTransactions} transaksi`,
                              payments: d.payments,
                            });
                          }}
                          className="p-1 rounded text-blue-600 hover:bg-blue-50 transition"
                          title="Lihat Daftar Transaksi Tanggal Ini"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Monthly Cash Flow Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Rekapitulasi Penerimaan Kas per Bulan SPP</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total realisasi penerimaan iuran yang masuk untuk setiap bulan kalender pendidikan.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {SPP_MONTHS.map((monthName) => {
                const match = monthlyCashList.find(
                  (m) => m.monthName.toLowerCase() === monthName.toLowerCase()
                );
                const amount = match ? match.totalAmount : 0;
                const count = match ? match.totalTransactions : 0;

                return (
                  <div
                    key={monthName}
                    className={`p-3 rounded-xl border flex flex-col justify-between ${
                      amount > 0 ? 'bg-emerald-50/60 border-emerald-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800">{monthName}</span>
                    <div className="mt-2">
                      <span className="text-[10px] text-slate-400 block">Kas Masuk:</span>
                      <span className="text-xs font-black font-mono text-emerald-800 block">
                        {formatRupiah(amount)}
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">
                        {count} Transaksi
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 4: MATRIKS KELAS x 12 BULAN ================= */}
      {subTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Matriks Ketercapaian Iuran SPP 12 Bulan (Kelas x Bulan)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gambaran menyeluruh penerimaan iuran SPP setiap rombel kelas di sepanjang kalender tahun ajaran.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase">
                  <th className="py-2.5 px-3 sticky left-0 bg-slate-100 z-10">Rombel Kelas</th>
                  {SPP_MONTHS.map((m) => (
                    <th key={m} className="py-2.5 px-2 text-center whitespace-nowrap">
                      {m.slice(0, 3)}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-right">Total Terkumpul</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {classSummaries.map((c) => {
                  const classPayments = payments.filter((p) => p.gradeClass === c.gradeClass);

                  return (
                    <tr key={c.gradeClass} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900 sticky left-0 bg-white">
                        {c.gradeClass}
                      </td>
                      {SPP_MONTHS.map((monthName) => {
                        const monthTotal = classPayments
                          .filter((p) => p.month.toLowerCase() === monthName.toLowerCase())
                          .reduce((sum, p) => sum + p.amount, 0);

                        return (
                          <td key={monthName} className="py-2.5 px-2 text-center font-mono text-[10px]">
                            {monthTotal > 0 ? (
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                                {formatRupiah(monthTotal).replace('Rp', '').trim()}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800">
                        {formatRupiah(c.totalCollected)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Official SPP Arrears Notice Letter for Student */}
      <ArrearsLetterModal
        isOpen={!!letterArrearItem}
        onClose={() => setLetterArrearItem(null)}
        arrearItem={letterArrearItem}
      />

      {/* MODAL 2: Audit Transactions Drill-Down */}
      <AuditTransactionsModal
        isOpen={auditModalData.isOpen}
        onClose={() => setAuditModalData((prev) => ({ ...prev, isOpen: false }))}
        title={auditModalData.title}
        subtitle={auditModalData.subtitle}
        payments={auditModalData.payments}
        onPrintReceipt={(p) => {
          const matchingS = students.find((s) => s.id === p.studentId) || null;
          onPrintPaymentReceipt(p, matchingS);
        }}
      />
    </div>
  );
};
