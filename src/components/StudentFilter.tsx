import React from 'react';
import {
  Search,
  X,
  Filter,
  UserPlus,
  FileSpreadsheet,
  Download,
  Sparkles,
} from 'lucide-react';

interface StudentFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedClass: string;
  onClassChange: (gradeClass: string) => void;
  selectedAcademicYear: string;
  onAcademicYearChange: (year: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  classList: string[];
  academicYearList: string[];
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onExportExcel: () => void;
  onSeedData: () => void;
  totalFiltered: number;
  totalAll: number;
  isSeeding?: boolean;
}

export const StudentFilter: React.FC<StudentFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedClass,
  onClassChange,
  selectedAcademicYear,
  onAcademicYearChange,
  selectedStatus,
  onStatusChange,
  classList,
  academicYearList,
  onOpenAddModal,
  onOpenImportModal,
  onExportExcel,
  onSeedData,
  totalFiltered,
  totalAll,
  isSeeding = false,
}) => {
  const isFiltered =
    searchQuery.trim() !== '' ||
    selectedClass !== 'Semua' ||
    selectedAcademicYear !== 'Semua' ||
    selectedStatus !== 'Semua';

  const handleReset = () => {
    onSearchChange('');
    onClassChange('Semua');
    onAcademicYearChange('Semua');
    onStatusChange('Semua');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari berdasarkan NIS, Nama Lengkap, atau Kelas..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action Buttons: Add Student, Import Excel, Export Excel */}
        <div className="flex flex-wrap items-center gap-2">
          {totalAll === 0 && (
            <button
              onClick={onSeedData}
              disabled={isSeeding}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition"
              title="Isi data siswa contoh untuk pengujian"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isSeeding ? 'Memuat...' : 'Isi Data Contoh'}</span>
            </button>
          )}

          <button
            onClick={onOpenImportModal}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition"
            title="Impor data siswa dari file Excel (.xlsx / .csv)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Impor Excel</span>
          </button>

          <button
            onClick={onExportExcel}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition"
            title="Ekspor seluruh data siswa aktif/terfilter ke file Excel"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Data:</span>
          </div>

          {/* Filter Kelas */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <span className="text-slate-500">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Kelas</option>
              {classList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tahun Ajaran */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <span className="text-slate-500">Tahun Ajaran:</span>
            <select
              value={selectedAcademicYear}
              onChange={(e) => onAcademicYearChange(e.target.value)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Tahun</option>
              {academicYearList.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <span className="text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="tidak_aktif">Tidak Aktif</option>
            </select>
          </div>

          {isFiltered && (
            <button
              onClick={handleReset}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline underline-offset-2 ml-1"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Counter Results */}
        <div className="text-slate-500 text-xs">
          Menampilkan <span className="font-semibold text-slate-800">{totalFiltered}</span> dari{' '}
          <span className="font-semibold text-slate-800">{totalAll}</span> siswa
        </div>
      </div>
    </div>
  );
};
