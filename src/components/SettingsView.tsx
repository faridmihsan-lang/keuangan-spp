import React, { useState, useEffect } from 'react';
import {
  School,
  Calendar,
  DollarSign,
  Users,
  ShieldCheck,
  Receipt,
  History,
  Database,
  Save,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  Info,
  Lock,
  Building2,
  Mail,
  Phone,
  Globe,
  UserCheck,
} from 'lucide-react';
import { SchoolSettings, ActivityLog, UserRole, Student } from '../types/student';
import {
  updateSchoolSettings,
  subscribeActivityLogs,
  generateFullDatabaseBackup,
  restoreDatabaseFromJson,
  applyGradeRatesToStudents,
} from '../services/settingsService';
import { formatRupiah, SPP_MONTHS, DEFAULT_ACADEMIC_YEARS } from '../utils/formatters';

interface SettingsViewProps {
  settings: SchoolSettings;
  students: Student[];
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onShowToast: (type: 'success' | 'error', text: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  students,
  currentRole,
  onRoleChange,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<
    'identity' | 'academic' | 'rates' | 'rbac' | 'receipt' | 'logs' | 'backup'
  >('identity');

  // Form states initialized with settings
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [npsn, setNpsn] = useState(settings.npsn);
  const [educationLevel, setEducationLevel] = useState(settings.educationLevel);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [website, setWebsite] = useState(settings.website);
  const [principalName, setPrincipalName] = useState(settings.principalName);
  const [principalNip, setPrincipalNip] = useState(settings.principalNip);
  const [treasurerName, setTreasurerName] = useState(settings.treasurerName);
  const [treasurerNip, setTreasurerNip] = useState(settings.treasurerNip);

  const [activeAcademicYear, setActiveAcademicYear] = useState(settings.activeAcademicYear);
  const [dueDay, setDueDay] = useState(settings.dueDay || 10);
  const [currentBillingMonth, setCurrentBillingMonth] = useState(settings.currentBillingMonth || 'Oktober');

  const [rateX, setRateX] = useState(settings.gradeRates?.X || 250000);
  const [rateXI, setRateXI] = useState(settings.gradeRates?.XI || 250000);
  const [rateXII, setRateXII] = useState(settings.gradeRates?.XII || 275000);

  const [receiptPrefix, setReceiptPrefix] = useState(settings.receiptPrefix || 'SPP');
  const [receiptFooterNote, setReceiptFooterNote] = useState(settings.receiptFooterNote || '');

  // Subscriptions & Async states
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingRates, setIsApplyingRates] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFileInput, setRestoreFileInput] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<{
    studentsCount: number;
    paymentsCount: number;
    payload: any;
  } | null>(null);

  // Sync state if settings prop changes
  useEffect(() => {
    setSchoolName(settings.schoolName);
    setNpsn(settings.npsn);
    setEducationLevel(settings.educationLevel);
    setAddress(settings.address);
    setPhone(settings.phone);
    setEmail(settings.email);
    setWebsite(settings.website);
    setPrincipalName(settings.principalName);
    setPrincipalNip(settings.principalNip);
    setTreasurerName(settings.treasurerName);
    setTreasurerNip(settings.treasurerNip);
    setActiveAcademicYear(settings.activeAcademicYear);
    setDueDay(settings.dueDay || 10);
    setCurrentBillingMonth(settings.currentBillingMonth || 'Oktober');
    setRateX(settings.gradeRates?.X || 250000);
    setRateXI(settings.gradeRates?.XI || 250000);
    setRateXII(settings.gradeRates?.XII || 275000);
    setReceiptPrefix(settings.receiptPrefix || 'SPP');
    setReceiptFooterNote(settings.receiptFooterNote || '');
  }, [settings]);

  // Subscribe to real-time activity logs
  useEffect(() => {
    const unsub = subscribeActivityLogs(
      (logs) => setActivityLogs(logs),
      (err) => console.error(err)
    );
    return () => unsub();
  }, []);

  const isAdmin = currentRole === 'admin';

  // Save general settings
  const handleSaveSettings = async () => {
    if (!isAdmin) {
      onShowToast('error', 'Hanya pengguna dengan peran Administrator yang berwenang mengubah pengaturan.');
      return;
    }

    setIsSaving(true);
    try {
      await updateSchoolSettings(
        {
          schoolName,
          npsn,
          educationLevel,
          address,
          phone,
          email,
          website,
          principalName,
          principalNip,
          treasurerName,
          treasurerNip,
          activeAcademicYear,
          dueDay: Number(dueDay) || 10,
          currentBillingMonth,
          receiptPrefix: receiptPrefix.trim().toUpperCase(),
          receiptFooterNote,
          gradeRates: {
            X: Number(rateX) || 0,
            XI: Number(rateXI) || 0,
            XII: Number(rateXII) || 0,
          },
        },
        { name: 'Administrator TU', role: currentRole }
      );
      onShowToast('success', 'Pengaturan sistem SPP berhasil disimpan dan disinkronkan ke database cloud.');
    } catch (err: any) {
      onShowToast('error', 'Gagal menyimpan pengaturan: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Bulk apply default rates to students
  const handleApplyRates = async () => {
    if (!isAdmin) {
      onShowToast('error', 'Hanya Administrator yang dapat menyinkronkan tarif SPP siswa.');
      return;
    }

    const confirm = window.confirm(
      `Apakah Anda yakin ingin memperbarui tarif SPP seluruh siswa sesuai tingkat kelas (Kelas X: ${formatRupiah(rateX)}, Kelas XI: ${formatRupiah(rateXI)}, Kelas XII: ${formatRupiah(rateXII)})?`
    );
    if (!confirm) return;

    setIsApplyingRates(true);
    try {
      const updatedCount = await applyGradeRatesToStudents(
        { X: Number(rateX), XI: Number(rateXI), XII: Number(rateXII) },
        { name: 'Administrator TU', role: currentRole }
      );
      onShowToast('success', `Berhasil menyinkronkan tarif SPP baru ke ${updatedCount} siswa.`);
    } catch (err: any) {
      onShowToast('error', 'Gagal menerapkan tarif massal: ' + err.message);
    } finally {
      setIsApplyingRates(false);
    }
  };

  // Full JSON database backup
  const handleDownloadBackup = async () => {
    setIsBackingUp(true);
    try {
      const jsonString = await generateFullDatabaseBackup();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_SPP_${schoolName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onShowToast('success', 'Berkas cadangan JSON berhasil diunduh ke komputer Anda.');
    } catch (err: any) {
      onShowToast('error', 'Gagal mencadangkan data: ' + err.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Handle JSON restore file read
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFileInput(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.students || !parsed.payments) {
          throw new Error('Format berkas cadangan tidak sesuai.');
        }
        setRestorePreview({
          studentsCount: Array.isArray(parsed.students) ? parsed.students.length : 0,
          paymentsCount: Array.isArray(parsed.payments) ? parsed.payments.length : 0,
          payload: parsed,
        });
      } catch (err: any) {
        onShowToast('error', 'Gagal membaca berkas JSON: ' + err.message);
        setRestorePreview(null);
      }
    };
    reader.readAsText(file);
  };

  // Execute restore
  const handleExecuteRestore = async () => {
    if (!isAdmin) {
      onShowToast('error', 'Hanya Administrator yang memiliki wewenang untuk memulihkan database.');
      return;
    }
    if (!restorePreview) return;

    const confirm = window.confirm(
      `PERINGATAN: Pemulihan akan memasukkan ${restorePreview.studentsCount} data siswa dan ${restorePreview.paymentsCount} transaksi pembayaran ke database Firestore. Lanjutkan?`
    );
    if (!confirm) return;

    setIsRestoring(true);
    try {
      const result = await restoreDatabaseFromJson(restorePreview.payload, {
        name: 'Administrator TU',
        role: currentRole,
      });
      onShowToast(
        'success',
        `Database berhasil dipulihkan! (${result.studentsRestored} siswa, ${result.paymentsRestored} kuitansi).`
      );
      setRestorePreview(null);
      setRestoreFileInput(null);
    } catch (err: any) {
      onShowToast('error', 'Gagal memulihkan database: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Role Switcher Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
              Modul 4: Pengaturan & Konfigurasi
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Pengaturan Sistem & Hak Akses SPP
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Konfigurasi profil sekolah, tarif SPP per tingkat kelas, format penomoran kuitansi, akun petugas, dan pemulihan data.
          </p>
        </div>

        {/* Current Active Role Switcher */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Peran Aktif Saat Ini:</p>
              <p className="text-xs font-extrabold text-slate-800">
                {currentRole === 'admin'
                  ? 'Administrator Sistem / IT'
                  : currentRole === 'petugas'
                  ? 'Petugas Keuangan / Kasir'
                  : 'Kepala Sekolah / Eksekutif'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            <span className="text-slate-400 text-[11px] hidden sm:inline">Ganti Peran:</span>
            <select
              value={currentRole}
              onChange={(e) => {
                const newRole = e.target.value as UserRole;
                onRoleChange(newRole);
                onShowToast(
                  'success',
                  `Beralih ke peran: ${
                    newRole === 'admin'
                      ? 'Administrator (Akses Penuh)'
                      : newRole === 'petugas'
                      ? 'Petugas Keuangan (Kasir & Laporan)'
                      : 'Kepala Sekolah (Lihat Saja)'
                  }`
                );
              }}
              className="bg-white border border-slate-300 text-slate-800 rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="admin">Administrator</option>
              <option value="petugas">Petugas Keuangan</option>
              <option value="kepala_sekolah">Kepala Sekolah</option>
            </select>
          </div>
        </div>
      </div>

      {/* Role Restriction Banner if not Admin */}
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 flex items-start space-x-3">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Mode Pembacaan Terbatas (Hak Akses {currentRole.toUpperCase()}):</span> Anda sedang menggunakan profil selain Administrator. Beberapa pengaturan hanya dapat diubah oleh Administrator Sistem untuk menjaga integritas data keuangan sekolah.
          </div>
        </div>
      )}

      {/* Main Settings Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
        <button
          onClick={() => setActiveTab('identity')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition ${
            activeTab === 'identity'
              ? 'bg-white border-t-2 border-emerald-600 text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <School className="w-3.5 h-3.5" />
          <span>Identitas Sekolah</span>
        </button>

        <button
          onClick={() => setActiveTab('academic')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition ${
            activeTab === 'academic'
              ? 'bg-white border-t-2 border-emerald-600 text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Tahun Ajaran & Tempo</span>
        </button>

        <button
          onClick={() => setActiveTab('rates')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition ${
            activeTab === 'rates'
              ? 'bg-white border-t-2 border-emerald-600 text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Tarif SPP per Tingkat</span>
        </button>

        <button
          onClick={() => setActiveTab('receipt')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition ${
            activeTab === 'receipt'
              ? 'bg-white border-t-2 border-emerald-600 text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Format Kuitansi</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition ${
            activeTab === 'rbac'
              ? 'bg-white border-t-2 border-emerald-600 text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Akun & Hak Akses (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition ${
            activeTab === 'logs'
              ? 'bg-white border-t-2 border-emerald-600 text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Log Aktivitas ({activityLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl transition ${
            activeTab === 'backup'
              ? 'bg-white border-t-2 border-emerald-600 text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Cadangkan & Pulihkan</span>
        </button>
      </div>

      {/* Tab 1: Identitas Sekolah */}
      {activeTab === 'identity' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Identitas Sekolah & Kop Resmi</h3>
              <p className="text-xs text-slate-500">
                Informasi ini otomatis tercantum pada bukti kuitansi PDF dan surat penagihan tunggakan.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Identitas'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Resmi Sekolah</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Pokok Sekolah Nasional (NPSN)</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={npsn}
                onChange={(e) => setNpsn(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jenjang Pendidikan</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap Sekolah</label>
              <textarea
                rows={2}
                disabled={!isAdmin}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Tata Usaha</label>
              <input
                type="email"
                disabled={!isAdmin}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website Sekolah</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Pejabat Penandatangan */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Pejabat Penandatangan Dokumen Resmi
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800">Kepala Sekolah</span>
                <div>
                  <label className="block text-[11px] text-slate-600">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={principalName}
                    onChange={(e) => setPrincipalName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600">NIP</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={principalNip}
                    onChange={(e) => setPrincipalNip(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800">Bendahara / Kasir Tata Usaha</span>
                <div>
                  <label className="block text-[11px] text-slate-600">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={treasurerName}
                    onChange={(e) => setTreasurerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600">NIP / NIK</label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={treasurerNip}
                    onChange={(e) => setTreasurerNip(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tahun Ajaran & Jatuh Tempo */}
      {activeTab === 'academic' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tahun Ajaran & Periode Jatuh Tempo</h3>
              <p className="text-xs text-slate-500">
                Pengaturan periode operasional tahun pelajaran dan batas tanggal pembayaran bulanan.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Periode</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tahun Ajaran Aktif</label>
              <select
                disabled={!isAdmin}
                value={activeAcademicYear}
                onChange={(e) => setActiveAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800 disabled:bg-slate-50"
              >
                {Array.from(new Set([...DEFAULT_ACADEMIC_YEARS, activeAcademicYear].filter(Boolean))).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Jatuh Tempo Bulanan</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="31"
                  disabled={!isAdmin}
                  value={dueDay}
                  onChange={(e) => setDueDay(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold disabled:bg-slate-50"
                />
                <span className="text-slate-500 font-medium">setiap bulan</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Standar sekolah: Tanggal 10 setiap bulan</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bulan Tagihan Berjalan</label>
              <select
                disabled={!isAdmin}
                value={currentBillingMonth}
                onChange={(e) => setCurrentBillingMonth(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800 disabled:bg-slate-50"
              >
                {SPP_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Tarif SPP per Tingkat Kelas */}
      {activeTab === 'rates' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pengaturan Tarif SPP per Tingkat Kelas</h3>
              <p className="text-xs text-slate-500">
                Tentukan standar nominal SPP bulanan untuk Kelas X, XI, dan XII serta sinkronkan ke master siswa secara massal.
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Tarif</span>
                </button>
                <button
                  onClick={handleApplyRates}
                  disabled={isApplyingRates}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50"
                  title="Update nominal siswa di database sesuai tarif ini"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isApplyingRates ? 'animate-spin' : ''}`} />
                  <span>{isApplyingRates ? 'Menyinkronkan...' : 'Terapkan Massal ke Siswa'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-extrabold text-sm text-slate-900 block mb-1">Tingkat Kelas X</span>
              <p className="text-slate-500 mb-3 text-[11px]">Siswa baru tahun pertama</p>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  step="5000"
                  disabled={!isAdmin}
                  value={rateX}
                  onChange={(e) => setRateX(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                />
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-2">{formatRupiah(rateX)} / bulan</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-extrabold text-sm text-slate-900 block mb-1">Tingkat Kelas XI</span>
              <p className="text-slate-500 mb-3 text-[11px]">Siswa tingkat menengah</p>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  step="5000"
                  disabled={!isAdmin}
                  value={rateXI}
                  onChange={(e) => setRateXI(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                />
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-2">{formatRupiah(rateXI)} / bulan</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-extrabold text-sm text-slate-900 block mb-1">Tingkat Kelas XII</span>
              <p className="text-slate-500 mb-3 text-[11px]">Siswa tingkat akhir & kelulusan</p>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  step="5000"
                  disabled={!isAdmin}
                  value={rateXII}
                  onChange={(e) => setRateXII(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                />
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-2">{formatRupiah(rateXII)} / bulan</p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Keterangan Penyesuaian Tarif Individual Siswa:</p>
              <p className="text-[11px] mt-0.5 text-emerald-800">
                Setiap siswa tetap dapat memiliki nominal khusus (misal beasiswa prestasi atau afirmasi) yang dapat diatur tersendiri melalui tombol Edit pada <strong>Modul 1: Pendataan Siswa</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Format Kuitansi */}
      {activeTab === 'receipt' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Format Kuitansi & Nomor Bukti Pembayaran</h3>
              <p className="text-xs text-slate-500">
                Pengaturan penomoran otomatis dan catatan kaki bukti transaksi pembayaran SPP.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Format</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prefix / Awalan Nomor Kuitansi</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={receiptPrefix}
                onChange={(e) => setReceiptPrefix(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Contoh hasil nomor bukti: <strong className="font-mono text-emerald-700">{receiptPrefix}-202410-0012</strong>
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pencetakan Bukti</label>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                <span className="font-bold text-slate-800 block mb-0.5">Format PDF Standar Resmi</span>
                <span>Ukuran Kertas A4 / Thermal 80mm siap unduh atau langsung cetak via browser.</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Catatan Kaki (Footer Note Kuitansi)</label>
              <textarea
                rows={3}
                disabled={!isAdmin}
                value={receiptFooterNote}
                onChange={(e) => setReceiptFooterNote(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
                placeholder="Pesan ucapan terima kasih atau peringatan penyimpanan bukti kuitansi..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Akun & Hak Akses (RBAC) */}
      {activeTab === 'rbac' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Pengaturan Akun Petugas & Hak Akses Peran (RBAC)</h3>
            <p className="text-xs text-slate-500">
              Pengelolaan kewenangan akses data dan transaksi keuangan berdasarkan peran pengguna.
            </p>
          </div>

          {/* Matrix Hak Akses */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-white font-bold">
                <tr>
                  <th className="p-3">Fitur & Modul Sistem</th>
                  <th className="p-3 text-center">Administrator</th>
                  <th className="p-3 text-center">Petugas Keuangan / Kasir</th>
                  <th className="p-3 text-center">Kepala Sekolah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr>
                  <td className="p-3 font-semibold">Modul 1: Pendataan Siswa (Lihat & Cari)</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="p-3 font-semibold">Modul 1: Tambah / Edit / Hapus Siswa & Impor Excel</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                  <td className="p-3 text-center text-amber-600 font-medium">✓ Tambah & Edit</td>
                  <td className="p-3 text-center text-rose-500 font-medium">✕ Hanya Baca</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Modul 2: Transaksi Pembayaran Kasir & Cetak Bukti</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Penuh (Kasir Utama)</td>
                  <td className="p-3 text-center text-rose-500 font-medium">✕ Hanya Baca</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="p-3 font-semibold">Modul 3: Rekap Tunggakan, Kas Masuk & Surat SPP</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Penuh (Laporan)</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Modul 4: Dashboard Eksekutif Finansial</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="p-3 font-semibold">Modul 4: Pengaturan Sekolah, Tarif SPP & Backup</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">✓ Penuh</td>
                  <td className="p-3 text-center text-rose-500 font-medium">✕ Dibatasi</td>
                  <td className="p-3 text-center text-rose-500 font-medium">✕ Dibatasi</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* User List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Daftar Petugas Terdaftar
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(settings.users || []).map((user) => (
                <div
                  key={user.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{user.name}</span>
                    <span className="text-[11px] text-slate-500 block">{user.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{user.email}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'petugas'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Audit Log Aktivitas */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Riwayat Log Aktivitas Pengguna (Audit Trail)</h3>
              <p className="text-xs text-slate-500">
                Pencatatan otomatis seluruh transaksi, pengubahan data siswa, dan konfigurasi sistem di cloud.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-bold">
              {activityLogs.length} Aktivitas Tercatat
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {activityLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Belum ada aktivitas baru yang tercatat pada log sistem.
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-600 font-semibold">
                        Modul: {log.module}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{log.details}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                      <span>Oleh: <strong>{log.userName}</strong> ({log.userRole})</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Cadangkan & Pulihkan (Backup & Restore) */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">Pencadangan & Pemulihan Data (Backup & Restore)</h3>
            <p className="text-xs text-slate-500">
              Amankan seluruh database sekolah Anda dengan mengunduh berkas arsip JSON terenkripsi dan pulihkan kapan saja.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Download Backup */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-3">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Cadangkan Database Lengkap</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Mengekspor seluruh koleksi data siswa ({students.length} siswa), seluruh riwayat transaksi pembayaran SPP, dan konfigurasi profil sekolah ke dalam berkas format JSON.
                </p>
              </div>

              <button
                onClick={handleDownloadBackup}
                disabled={isBackingUp}
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isBackingUp ? 'Memproses Cadangan...' : 'Unduh Cadangan Database (.json)'}</span>
              </button>
            </div>

            {/* Box 2: Restore from JSON */}
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Pulihkan Data dari Berkas Cadangan</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Unggah berkas JSON cadangan resmi yang pernah diekspor sebelumnya untuk memulihkan master siswa dan transaksi.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  accept=".json"
                  disabled={!isAdmin}
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50"
                />

                {restorePreview && (
                  <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg text-xs space-y-1">
                    <p className="font-bold text-blue-900">Pratinjau Berkas Cadangan:</p>
                    <p className="text-slate-600">• {restorePreview.studentsCount} data siswa</p>
                    <p className="text-slate-600">• {restorePreview.paymentsCount} transaksi pembayaran</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleExecuteRestore}
                disabled={!isAdmin || !restorePreview || isRestoring}
                className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isRestoring ? 'Memulihkan Data...' : 'Mulai Pemulihan Database'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
