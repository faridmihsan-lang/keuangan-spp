import React from 'react';
import {
  School,
  Database,
  Layers,
  CheckCircle2,
  UserCheck,
  CreditCard,
  Users,
  FileBarChart,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { UserRole } from '../types/student';

interface NavbarProps {
  activeModule: 'dashboard' | 'students' | 'payments' | 'reports' | 'settings';
  onSelectModule: (module: 'dashboard' | 'students' | 'payments' | 'reports' | 'settings') => void;
  onOpenRelationsModal: () => void;
  activeAcademicYear: string;
  onSelectAcademicYear: (year: string) => void;
  academicYears: string[];
  totalStudents: number;
  totalPayments: number;
  schoolName?: string;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onSelectModule,
  onOpenRelationsModal,
  activeAcademicYear,
  onSelectAcademicYear,
  academicYears,
  totalStudents,
  totalPayments,
  schoolName = 'SIM SPP Sekolah',
  currentRole,
  onRoleChange,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold shrink-0">
              <School className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight truncate max-w-[200px] sm:max-w-xs md:max-w-none">
                  {schoolName}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {activeModule === 'dashboard'
                    ? 'Modul 4: Dashboard'
                    : activeModule === 'students'
                    ? 'Modul 1: Pendataan Siswa'
                    : activeModule === 'payments'
                    ? 'Modul 2: Transaksi Pembayaran'
                    : activeModule === 'reports'
                    ? 'Modul 3: Tunggakan & Laporan'
                    : 'Modul 4: Pengaturan'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Sistem Informasi Manajemen SPP Bulanan Terpadu & Multi-Peran
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Academic Year Quick Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/70 text-xs">
              <span className="text-slate-400 hidden md:inline">T.A:</span>
              <select
                value={activeAcademicYear}
                onChange={(e) => onSelectAcademicYear(e.target.value)}
                className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Semua" className="bg-slate-900 text-white">Semua T.A</option>
                {academicYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-slate-900 text-white">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher in Header */}
            <div className="flex items-center space-x-1 bg-slate-800/90 border border-slate-700 px-2 py-1 rounded-lg text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
                title="Ganti Peran Pengguna Aktif (RBAC)"
              >
                <option value="admin" className="bg-slate-900 text-white">Admin</option>
                <option value="petugas" className="bg-slate-900 text-white">Kasir</option>
                <option value="kepala_sekolah" className="bg-slate-900 text-white">Kepsek</option>
              </select>
            </div>

            {/* Architecture Relations Button */}
            <button
              onClick={onOpenRelationsModal}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition"
              title="Lihat peta relasi 4 modul SPP"
            >
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden lg:inline">Relasi 4 Modul</span>
            </button>

            {/* Cloud Status */}
            <div className="flex items-center space-x-1.5 text-xs bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-1.5 rounded-lg text-emerald-300">
              <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden xl:inline">Firestore Permanen</span>
            </div>
          </div>
        </div>

        {/* Sub-nav modules visual bar */}
        <div className="flex items-center space-x-2 py-2 border-t border-slate-800/80 overflow-x-auto text-xs no-scrollbar">
          {/* Modul 4: Dashboard Button */}
          <button
            onClick={() => onSelectModule('dashboard')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold shrink-0 transition ${
              activeModule === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard Eksekutif</span>
          </button>

          {/* Modul 1 Button */}
          <button
            onClick={() => onSelectModule('students')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold shrink-0 transition ${
              activeModule === 'students'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Modul 1: Siswa</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                activeModule === 'students' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {totalStudents}
            </span>
          </button>

          {/* Modul 2 Button */}
          <button
            onClick={() => onSelectModule('payments')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold shrink-0 transition ${
              activeModule === 'payments'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Modul 2: Pembayaran</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                activeModule === 'payments' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-700 text-slate-300'
              }`}
            >
              {totalPayments}
            </span>
          </button>

          {/* Modul 3 Button */}
          <button
            onClick={() => onSelectModule('reports')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold shrink-0 transition ${
              activeModule === 'reports'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <FileBarChart className="w-3.5 h-3.5" />
            <span>Modul 3: Tunggakan & Laporan</span>
          </button>

          {/* Modul 4: Pengaturan Button */}
          <button
            onClick={() => onSelectModule('settings')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold shrink-0 transition ${
              activeModule === 'settings'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Modul 4: Pengaturan & Backup</span>
          </button>
        </div>
      </div>
    </header>
  );
};
