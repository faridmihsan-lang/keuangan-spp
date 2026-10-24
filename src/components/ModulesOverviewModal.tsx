import React from 'react';
import {
  X,
  Layers,
  Database,
  ArrowRight,
  CheckCircle2,
  FileText,
  CreditCard,
  AlertOctagon,
  Users,
  ShieldCheck,
} from 'lucide-react';

interface ModulesOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModulesOverviewModal: React.FC<ModulesOverviewModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Arsitektur & Peta Relasi Modul SPP</h2>
              <p className="text-xs text-slate-400">
                Keterhubungan Data Master Siswa dengan Seluruh Modul Keuangan Sekolah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-xs sm:text-sm text-slate-700 max-h-[75vh] overflow-y-auto">
          {/* Architecture Intro */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900 text-xs">
                Relasi Database Permanen Terverifikasi
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                Modul 1 (Pendataan Siswa) berperan sebagai <strong>Master Source of Truth</strong>.
                Setiap dokumen siswa menyimpan kunci relasional (ID, NIS, Kelas, Tahun Ajaran, Nominal SPP)
                yang terhubung langsung ke koleksi transaksi dan siap dikonsumsi oleh modul pembayaran, tunggakan, dan pelaporan.
              </p>
            </div>
          </div>

          {/* Module Diagram Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Modul 1 */}
            <div className="bg-slate-50 border-2 border-emerald-500 rounded-xl p-4 relative shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Modul 1 (Aktif Saat Ini)
                </span>
                <span className="text-[11px] font-mono text-slate-500">Koleksi: students</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Pendataan Siswa (Master Siswa)</span>
              </h4>
              <p className="text-[11px] text-slate-600 mt-1">
                Menyimpan identitas lengkap siswa, NIS unik, kelas, jurusan, tahun ajaran, status keaktifan,
                dan nominal SPP bulanan yang menjadi acuan tarif pembayaran.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                Primary Key: <span className="text-emerald-700 font-bold">id</span>, <span className="text-emerald-700 font-bold">nis (Unik)</span>
              </div>
            </div>

            {/* Modul 2 */}
            <div className="bg-slate-50 border-2 border-blue-500 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Modul 2 (Aktif & Terhubung)
                </span>
                <span className="text-[11px] font-mono text-slate-500">Koleksi: payments</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Transaksi Pembayaran SPP</span>
              </h4>
              <p className="text-[11px] text-slate-600 mt-1">
                Mencatat kuitansi setoran SPP siswa per bulan. Mengambil relasi langsung dari ID dan NIS siswa,
                menghitung kewajiban berdasarkan nominal SPP bulanan siswa yang terdaftar.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                Foreign Key: <span className="text-blue-700 font-bold">studentId</span>, <span className="text-blue-700 font-bold">studentNis</span>
              </div>
            </div>

            {/* Modul 3 */}
            <div className="bg-slate-50 border-2 border-amber-500 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Modul 3 (Aktif & Terhubung)
                </span>
                <span className="text-[11px] font-mono text-slate-500">Agregasi Relasional</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <AlertOctagon className="w-4 h-4 text-amber-600" />
                <span>Rekapitulasi Tunggakan & Laporan</span>
              </h4>
              <p className="text-[11px] text-slate-600 mt-1">
                Menghitung selisih kewajiban (12 bulan x nominal SPP) dikurangi riwayat pembayaran sah siswa.
                Menyajikan laporan penerimaan kas harian, bulanan, rekap per kelas, dan cetak surat tagihan siswa.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                Logika: <span className="text-amber-700 font-bold">Total Kewajiban - Total Pembayaran Sah</span>
              </div>
            </div>

            {/* Modul 4 */}
            <div className="bg-slate-50 border-2 border-indigo-500 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                  Modul 4 (Aktif & Terhubung)
                </span>
                <span className="text-[11px] font-mono text-slate-500">settings & activity_logs</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Dashboard Eksekutif & Pengaturan Sistem</span>
              </h4>
              <p className="text-[11px] text-slate-600 mt-1">
                Visualisasi KPI real-time (siswa lunas, kas masuk, tunggakan), grafik tren bulanan, leaderboard penunggak,
                pengaturan profil sekolah, tarif SPP per tingkat, RBAC petugas, audit log, dan backup & restore database JSON.
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                Fitur: <span className="text-indigo-700 font-bold">KPI Real-time, RBAC, Audit Log, JSON Backup/Restore</span>
              </div>
            </div>
          </div>

          {/* Database Schema Summary Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Struktur Relasi Antar Tabel / Koleksi Firestore
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Entitas / Koleksi</th>
                    <th className="py-2.5 px-3">Kunci Utama</th>
                    <th className="py-2.5 px-3">Kunci Relasi (Foreign)</th>
                    <th className="py-2.5 px-3">Tujuan Penggunaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-emerald-800 font-mono">students</td>
                    <td className="py-2.5 px-3 font-mono">id, nis (Unique)</td>
                    <td className="py-2.5 px-3 font-mono">-</td>
                    <td className="py-2.5 px-3">Data induk siswa, kelas, tarif SPP bulanan</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-blue-800 font-mono">payments</td>
                    <td className="py-2.5 px-3 font-mono">id, receiptNumber</td>
                    <td className="py-2.5 px-3 font-mono">studentId, studentNis</td>
                    <td className="py-2.5 px-3">Buku kas transaksi kuitansi pembayaran SPP per bulan</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-indigo-800 font-mono">settings</td>
                    <td className="py-2.5 px-3 font-mono">general</td>
                    <td className="py-2.5 px-3 font-mono">-</td>
                    <td className="py-2.5 px-3">Konfigurasi profil sekolah, tarif default tingkat, RBAC, dan kuitansi</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 font-mono">activity_logs</td>
                    <td className="py-2.5 px-3 font-mono">id</td>
                    <td className="py-2.5 px-3 font-mono">-</td>
                    <td className="py-2.5 px-3">Audit trail aktivitas pengguna dan rekaman operasional cloud</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
