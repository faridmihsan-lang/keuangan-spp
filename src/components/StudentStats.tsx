import React from 'react';
import { Users, UserCheck, UserX, Wallet, TrendingUp } from 'lucide-react';
import { Student } from '../types/student';
import { formatRupiah } from '../utils/formatters';

interface StudentStatsProps {
  students: Student[];
}

export const StudentStats: React.FC<StudentStatsProps> = ({ students }) => {
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === 'aktif').length;
  const inactiveStudents = totalStudents - activeStudents;
  const activePercentage = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;

  // Monthly expected SPP collection from active students
  const monthlyPotential = students
    .filter((s) => s.status === 'aktif')
    .reduce((sum, s) => sum + (Number(s.monthlySppNominal) || 0), 0);

  // Average SPP per active student
  const avgSpp = activeStudents > 0 ? Math.round(monthlyPotential / activeStudents) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Students */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Siswa Terdaftar
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{totalStudents}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center text-xs text-slate-500">
          <span className="font-medium text-slate-700">Modul Master Siswa</span>
          <span className="mx-1.5">•</span>
          <span>Seluruh Rombel</span>
        </div>
      </div>

      {/* Active Students */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Siswa Aktif
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeStudents}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
            {activePercentage}% dari total
          </span>
          <span className="text-slate-400">Wajib SPP Aktif</span>
        </div>
      </div>

      {/* Inactive Students */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Siswa Tidak Aktif
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{inactiveStudents}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center text-xs text-slate-500">
          <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md">
            Lulus / Pindah / Cuti
          </span>
        </div>
      </div>

      {/* Monthly Potential SPP */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl p-4 text-white shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
              Potensi SPP / Bulan
            </p>
            <p className="text-2xl font-bold mt-1 text-white">{formatRupiah(monthlyPotential)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/15 text-white flex items-center justify-center backdrop-blur-xs">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-emerald-100">
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Rerata: {formatRupiah(avgSpp)}/bln</span>
          </div>
          <span className="text-[11px] bg-black/20 px-2 py-0.5 rounded">Target Kas TU</span>
        </div>
      </div>
    </div>
  );
};
