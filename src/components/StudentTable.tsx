import React, { useState } from 'react';
import {
  Eye,
  Edit2,
  Trash2,
  Phone,
  ArrowUpDown,
  User,
  GraduationCap,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Receipt,
  CreditCard,
} from 'lucide-react';
import { Student } from '../types/student';
import { formatRupiah } from '../utils/formatters';

interface StudentTableProps {
  students: Student[];
  onViewDetail: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onOpenAddModal: () => void;
  onPayStudent?: (student: Student) => void;
}

type SortField = 'fullName' | 'nis' | 'gradeClass' | 'monthlySppNominal';

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  onViewDetail,
  onEditStudent,
  onDeleteStudent,
  onOpenAddModal,
  onPayStudent,
}) => {
  const [sortField, setSortField] = useState<SortField>('gradeClass');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Sorting
  const sortedStudents = [...students].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (typeof aVal === 'string') {
      const cmp = aVal.localeCompare(bVal, 'id');
      return sortOrder === 'asc' ? cmp : -cmp;
    } else {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Pagination
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedStudents = sortedStudents.slice(startIndex, startIndex + itemsPerPage);

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          Tidak Ada Data Siswa Ditemukan
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
          Tidak ada siswa yang cocok dengan kriteria pencarian dan filter saat ini, atau data masih kosong.
        </p>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
        >
          <span>Tambah Siswa Pertama</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4 w-12 text-center">No</th>
              <th
                onClick={() => handleSort('nis')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>NIS & NISN</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('fullName')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>Nama Siswa</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('gradeClass')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>Kelas</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4">Tahun Ajaran</th>
              <th
                onClick={() => handleSort('monthlySppNominal')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition select-none"
              >
                <div className="flex items-center space-x-1">
                  <span>SPP Bulanan</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4">Kontak / Wali</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-center w-36">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedStudents.map((student, idx) => {
              const rowNumber = startIndex + idx + 1;
              const isMale = student.gender === 'L';
              const cleanPhone = student.phone.replace(/[^0-9]/g, '');
              const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}` : null;

              return (
                <tr
                  key={student.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {/* Number */}
                  <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                    {rowNumber}
                  </td>

                  {/* NIS & NISN */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 font-mono">
                      {student.nis}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      NISN: {student.nisn || '-'}
                    </div>
                  </td>

                  {/* Full Name & Gender */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isMale
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {student.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 group-hover:text-emerald-700 transition">
                          {student.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <span
                            className={`px-1 rounded text-[9px] font-semibold ${
                              isMale
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {isMale ? 'Laki-laki' : 'Perempuan'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Grade Class */}
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-800 border border-slate-200 text-xs">
                      <GraduationCap className="w-3 h-3 mr-1 text-slate-500" />
                      {student.gradeClass}
                    </div>
                  </td>

                  {/* Academic Year */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center text-slate-600 font-medium">
                      <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                      {student.academicYear}
                    </div>
                  </td>

                  {/* Monthly SPP */}
                  <td className="py-3.5 px-4 font-semibold text-emerald-700">
                    {formatRupiah(student.monthlySppNominal)}
                    <span className="text-[10px] text-slate-400 font-normal block">/bulan</span>
                  </td>

                  {/* Parent & Phone */}
                  <td className="py-3.5 px-4">
                    <div className="text-slate-800 font-medium truncate max-w-[140px]">
                      {student.parentName || '-'}
                    </div>
                    {student.phone ? (
                      waLink ? (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-[10px] text-emerald-600 hover:text-emerald-700 hover:underline mt-0.5"
                          title="Hubungi via WhatsApp"
                        >
                          <Phone className="w-2.5 h-2.5 mr-1" />
                          {student.phone}
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">{student.phone}</span>
                      )
                    ) : (
                      <span className="text-[10px] text-slate-400">-</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        student.status === 'aktif'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1 ${
                          student.status === 'aktif' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      {student.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {/* Pay SPP in Module 2 */}
                      {onPayStudent && (
                        <button
                          onClick={() => onPayStudent(student)}
                          className="p-1.5 rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-900 transition"
                          title="Bayar SPP Siswa Ini di Modul 2"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}

                      {/* View Detail & SPP */}
                      <button
                        onClick={() => onViewDetail(student)}
                        className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                        title="Lihat Detail Siswa & Riwayat SPP"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEditStudent(student)}
                        className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition"
                        title="Edit Data Siswa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteStudent(student)}
                        className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                        title="Hapus Data Siswa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <span>Tampilkan per halaman:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-slate-300 rounded px-2 py-1 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-slate-400">|</span>
          <span>
            {startIndex + 1} - {Math.min(startIndex + itemsPerPage, sortedStudents.length)} dari{' '}
            {sortedStudents.length} siswa
          </span>
        </div>

        {/* Page Nav */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={validCurrentPage === 1}
            className="p-1.5 rounded border border-slate-300 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              // show first, last, and window around current
              return p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 1;
            })
            .map((p, index, array) => {
              const prev = array[index - 1];
              const showEllipsis = prev && p - prev > 1;

              return (
                <React.Fragment key={p}>
                  {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                  <button
                    onClick={() => setCurrentPage(p)}
                    className={`min-w-[28px] h-7 px-2 rounded font-medium text-xs transition ${
                      validCurrentPage === p
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage === totalPages}
            className="p-1.5 rounded border border-slate-300 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
