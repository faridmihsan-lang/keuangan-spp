import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Printer,
  Trash2,
  Calendar,
  Wallet,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  X,
  AlertCircle,
} from 'lucide-react';
import { PaymentRecord, Student } from '../types/student';
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from '../utils/formatters';
import * as XLSX from 'xlsx';

interface PaymentHistoryTableProps {
  payments: PaymentRecord[];
  students: Student[];
  onPrintReceipt: (payment: PaymentRecord, student: Student | null) => void;
  onDeletePayment: (paymentId: string) => Promise<void>;
  onOpenNewTransaction: (student?: Student) => void;
}

export const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({
  payments,
  students,
  onPrintReceipt,
  onDeletePayment,
  onOpenNewTransaction,
}) => {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'month'>('all');
  const [methodFilter, setMethodFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [classFilter, setClassFilter] = useState('Semua');

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<'paymentDate' | 'amount' | 'studentName'>('paymentDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Distinct Classes from payments & students
  const availableClasses = useMemo(() => {
    const set = new Set([...payments.map((p) => p.gradeClass), ...students.map((s) => s.gradeClass)].filter(Boolean));
    return Array.from(set).sort();
  }, [payments, students]);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's stats
  const todayPayments = useMemo(() => {
    return payments.filter((p) => p.paymentDate === todayStr);
  }, [payments, todayStr]);

  const todayTotalCash = useMemo(() => {
    return todayPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [todayPayments]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return payments.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTrx = p.receiptNumber.toLowerCase().includes(q);
        const matchNis = p.studentNis.toLowerCase().includes(q);
        const matchName = p.studentName.toLowerCase().includes(q);
        const matchOfficer = p.recordedBy.toLowerCase().includes(q);
        const matchClass = p.gradeClass.toLowerCase().includes(q);
        if (!matchTrx && !matchNis && !matchName && !matchOfficer && !matchClass) {
          return false;
        }
      }

      // Date Filter
      if (dateFilter === 'today' && p.paymentDate !== todayStr) {
        return false;
      }
      if (dateFilter === '7days') {
        const pDate = new Date(p.paymentDate);
        if (pDate < sevenDaysAgo) return false;
      }
      if (dateFilter === 'month') {
        const pDate = new Date(p.paymentDate);
        if (pDate.getFullYear() !== currentYear || pDate.getMonth() !== currentMonth) {
          return false;
        }
      }

      // Method Filter
      if (methodFilter !== 'Semua' && p.paymentMethod !== methodFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter !== 'Semua' && p.status !== statusFilter) {
        return false;
      }

      // Class Filter
      if (classFilter !== 'Semua' && p.gradeClass !== classFilter) {
        return false;
      }

      return true;
    });
  }, [payments, searchQuery, dateFilter, methodFilter, statusFilter, classFilter, todayStr]);

  // Total cash for current filtered view
  const filteredTotalCash = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  // Sorted payments
  const sortedPayments = useMemo(() => {
    return [...filteredPayments].sort((a, b) => {
      if (sortField === 'amount') {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      } else if (sortField === 'studentName') {
        const cmp = a.studentName.localeCompare(b.studentName, 'id');
        return sortOrder === 'asc' ? cmp : -cmp;
      } else {
        const dateCmp = new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
        return sortOrder === 'asc' ? -dateCmp : dateCmp;
      }
    });
  }, [filteredPayments, sortField, sortOrder]);

  const handleSort = (field: 'paymentDate' | 'amount' | 'studentName') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Pagination
  const totalPages = Math.ceil(sortedPayments.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedPayments = sortedPayments.slice(startIndex, startIndex + itemsPerPage);

  // Export transactions to Excel
  const handleExportTransactions = () => {
    if (sortedPayments.length === 0) return;

    const data = sortedPayments.map((p, idx) => ({
      No: idx + 1,
      'No. Transaksi': p.receiptNumber,
      'Tanggal Bayar': p.paymentDate,
      NIS: p.studentNis,
      'Nama Siswa': p.studentName,
      Kelas: p.gradeClass,
      'Tahun Ajaran': p.academicYear,
      'Bulan SPP': `${p.month} ${p.year}`,
      'Nominal Bayar (Rp)': p.amount,
      'Sisa Tagihan (Rp)': p.remainingBalance,
      Status: p.status,
      'Metode Bayar': p.paymentMethod,
      'Bank / Detail': p.bankName || '',
      'Petugas Kasir': p.recordedBy,
      Catatan: p.notes || '',
      'Waktu Catat': p.createdAt,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Pembayaran');
    XLSX.writeFile(wb, `Laporan_Transaksi_SPP_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setMethodFilter('Semua');
    setStatusFilter('Semua');
    setClassFilter('Semua');
  };

  const isFiltered =
    searchQuery.trim() !== '' ||
    dateFilter !== 'all' ||
    methodFilter !== 'Semua' ||
    statusFilter !== 'Semua' ||
    classFilter !== 'Semua';

  return (
    <div className="space-y-5">
      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Kas Hari Ini */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">
                Kas Masuk Hari Ini
              </p>
              <p className="text-xl sm:text-2xl font-black mt-1">{formatRupiah(todayTotalCash)}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-[11px] text-emerald-100 mt-2 font-medium">
            {todayPayments.length} transaksi penerimaan kas hari ini
          </p>
        </div>

        {/* Akumulasi Terfilter */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Penerimaan (Terfilter)
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono">
                {formatRupiah(filteredTotalCash)}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Dari {filteredPayments.length} kuitansi pembayaran SPP
          </p>
        </div>

        {/* Total Keseluruhan Transaksi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Buku Besar Kasir SPP
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {payments.length} <span className="text-xs font-normal text-slate-500">Kuitansi</span>
              </p>
            </div>
            <button
              onClick={() => onOpenNewTransaction()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              + Transaksi Baru
            </button>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Database Firestore Aktif</span>
            <span className="font-semibold text-emerald-700">Tersinkronisasi</span>
          </div>
        </div>
      </div>

      {/* Filters & Actions Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. Transaksi, NIS, Nama Siswa, atau Petugas Kasir..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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

          {/* Export Excel Button */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportTransactions}
              disabled={sortedPayments.length === 0}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 disabled:opacity-40 transition"
              title="Ekspor seluruh riwayat transaksi ke berkas Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Ekspor Excel</span>
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

            {/* Date Preset */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini Saja</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="month">Bulan Ini</option>
            </select>

            {/* Class Filter */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
            >
              <option value="Semua">Semua Kelas</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
            >
              <option value="Semua">Semua Metode</option>
              <option value="Tunai">Tunai</option>
              <option value="Transfer Bank">Transfer Bank</option>
              <option value="QRIS">QRIS</option>
              <option value="Tabungan Siswa">Tabungan Siswa</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Lunas">Lunas</option>
              <option value="Sebagian">Sebagian (Cicilan)</option>
            </select>

            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold underline underline-offset-2 ml-1"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="text-slate-500 text-[11px]">
            Menampilkan <strong className="text-slate-800">{sortedPayments.length}</strong> transaksi
          </div>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {sortedPayments.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Tidak Ada Transaksi Ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ada riwayat pembayaran yang cocok dengan filter yang dipilih, atau belum ada transaksi yang dicatat.
            </p>
            <button
              onClick={() => onOpenNewTransaction()}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              + Catat Pembayaran Baru
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 text-center w-10">No</th>
                  <th className="py-3 px-3">No. Transaksi</th>
                  <th
                    onClick={() => handleSort('paymentDate')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tanggal</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('studentName')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition select-none"
                  >
                    <div className="flex items-center space-x-1">
                      <span>Siswa & Kelas</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Bulan SPP</th>
                  <th
                    onClick={() => handleSort('amount')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition select-none"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Nominal Bayar</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Sisa Tagihan</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Metode</th>
                  <th className="py-3 px-3">Petugas Kasir</th>
                  <th className="py-3 px-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedPayments.map((p, idx) => {
                  const matchingStudent = students.find((s) => s.id === p.studentId) || null;
                  const rowNumber = startIndex + idx + 1;
                  const isLunas = p.status === 'Lunas';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3 px-3 text-center text-slate-400 font-medium">
                        {rowNumber}
                      </td>

                      {/* Transaction Number */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {p.receiptNumber}
                      </td>

                      {/* Payment Date */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {formatDateIndo(p.paymentDate)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.createdAt ? new Date(p.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </div>
                      </td>

                      {/* Student & Class */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition">
                          {p.studentName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1.5 mt-0.5">
                          <span>NIS: {p.studentNis}</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-800">{p.gradeClass}</span>
                        </div>
                      </td>

                      {/* Month SPP */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800">
                          {p.month} {p.year}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          T.A {p.academicYear}
                        </span>
                      </td>

                      {/* Amount Paid */}
                      <td className="py-3 px-3 text-right font-extrabold text-emerald-700 font-mono">
                        {formatRupiah(p.amount)}
                      </td>

                      {/* Remaining Balance */}
                      <td className="py-3 px-3 text-right font-mono">
                        {p.remainingBalance > 0 ? (
                          <span className="text-amber-700 font-semibold">
                            {formatRupiah(p.remainingBalance)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">Rp 0 (Lunas)</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isLunas
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {isLunas ? 'Lunas' : 'Cicilan'}
                        </span>
                      </td>

                      {/* Method */}
                      <td className="py-3 px-3">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700 block w-max">
                          {p.paymentMethod}
                        </span>
                        {p.bankName && (
                          <span className="text-[9px] text-slate-400 truncate block max-w-[110px]">
                            {p.bankName.split('(')[0]}
                          </span>
                        )}
                      </td>

                      {/* Officer */}
                      <td className="py-3 px-3 text-[11px] text-slate-600 truncate max-w-[120px]">
                        {p.recordedBy}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Print / Download PDF */}
                          <button
                            onClick={() => onPrintReceipt(p, matchingStudent)}
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 transition"
                            title="Cetak Bukti Kuitansi / Unduh PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete / Void */}
                          <button
                            onClick={async () => {
                              if (
                                confirm(
                                  `Apakah Anda yakin ingin membatalkan transaksi ${p.receiptNumber} untuk siswa ${p.studentName}?`
                                )
                              ) {
                                await onDeletePayment(p.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                            title="Batalkan / Void Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {sortedPayments.length > 0 && (
          <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span>Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-800"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>
                {startIndex + 1} - {Math.min(startIndex + itemsPerPage, sortedPayments.length)} dari{' '}
                {sortedPayments.length} transaksi
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded border border-slate-300 bg-white text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 font-semibold">
                Halaman {validCurrentPage} dari {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded border border-slate-300 bg-white text-slate-600 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
