import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Save,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Student, Gender, StudentStatus } from '../types/student';
import {
  DEFAULT_CLASSES,
  DEFAULT_ACADEMIC_YEARS,
  formatRupiah,
} from '../utils/formatters';
import { checkNisExists } from '../services/studentService';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editingStudent?: Student | null;
  classList: string[];
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingStudent,
  classList,
}) => {
  const isEditing = !!editingStudent;

  // Form State
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<Gender>('L');
  const [gradeClass, setGradeClass] = useState(DEFAULT_CLASSES[0]);
  const [customClass, setCustomClass] = useState('');
  const [isCustomClass, setIsCustomClass] = useState(false);
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [monthlySppNominal, setMonthlySppNominal] = useState<number>(350000);
  const [address, setAddress] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<StudentStatus>('aktif');
  const [notes, setNotes] = useState('');

  // Validation & UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nisChecking, setNisChecking] = useState(false);
  const [nisAvailable, setNisAvailable] = useState<boolean | null>(null);

  // Sync state when editing or opening
  useEffect(() => {
    if (editingStudent) {
      setNis(editingStudent.nis);
      setNisn(editingStudent.nisn || '');
      setFullName(editingStudent.fullName);
      setGender(editingStudent.gender);
      if (classList.includes(editingStudent.gradeClass)) {
        setGradeClass(editingStudent.gradeClass);
        setIsCustomClass(false);
      } else {
        setIsCustomClass(true);
        setCustomClass(editingStudent.gradeClass);
      }
      setAcademicYear(editingStudent.academicYear);
      setMonthlySppNominal(editingStudent.monthlySppNominal);
      setAddress(editingStudent.address || '');
      setParentName(editingStudent.parentName || '');
      setPhone(editingStudent.phone || '');
      setStatus(editingStudent.status);
      setNotes(editingStudent.notes || '');
      setNisAvailable(true);
    } else {
      // Reset defaults
      setNis('');
      setNisn('');
      setFullName('');
      setGender('L');
      setGradeClass(DEFAULT_CLASSES[0]);
      setIsCustomClass(false);
      setCustomClass('');
      setAcademicYear(DEFAULT_ACADEMIC_YEARS[0] || '2026/2027');
      setMonthlySppNominal(350000);
      setAddress('');
      setParentName('');
      setPhone('');
      setStatus('aktif');
      setNotes('');
      setNisAvailable(null);
    }
    setErrors({});
  }, [editingStudent, isOpen]);

  // Real-time NIS availability check (debounced)
  useEffect(() => {
    if (!nis.trim()) {
      setNisAvailable(null);
      return;
    }

    // If editing and same NIS as current student, it's valid
    if (editingStudent && editingStudent.nis === nis.trim()) {
      setNisAvailable(true);
      return;
    }

    const timer = setTimeout(async () => {
      setNisChecking(true);
      try {
        const exists = await checkNisExists(nis.trim(), editingStudent?.id);
        setNisAvailable(!exists);
      } catch (err) {
        console.error(err);
      } finally {
        setNisChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [nis, editingStudent]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nis.trim()) {
      newErrors.nis = 'Nomor Induk Siswa (NIS) wajib diisi';
    } else if (nisAvailable === false) {
      newErrors.nis = 'NIS ini sudah digunakan oleh siswa lain';
    }

    if (nisn.trim() && !/^\d{10}$/.test(nisn.trim())) {
      newErrors.nisn = 'NISN standar nasional harus terdiri dari 10 digit angka';
    }

    if (!fullName.trim()) {
      newErrors.fullName = 'Nama lengkap siswa wajib diisi';
    }

    const finalClass = isCustomClass ? customClass.trim() : gradeClass;
    if (!finalClass) {
      newErrors.gradeClass = 'Kelas wajib dipilih atau diisi';
    }

    if (!monthlySppNominal || monthlySppNominal <= 0) {
      newErrors.monthlySppNominal = 'Nominal SPP bulanan harus lebih besar dari 0';
    }

    if (!parentName.trim()) {
      newErrors.parentName = 'Nama orang tua / wali murid wajib diisi';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Nomor HP / WhatsApp wajib diisi untuk konfirmasi pembayaran SPP';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const finalClass = isCustomClass ? customClass.trim() : gradeClass;
      await onSubmit({
        nis: nis.trim(),
        nisn: nisn.trim(),
        fullName: fullName.trim(),
        gender,
        gradeClass: finalClass,
        academicYear,
        monthlySppNominal: Number(monthlySppNominal),
        address: address.trim(),
        parentName: parentName.trim(),
        phone: phone.trim(),
        status,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        submit: err.message || 'Terjadi kesalahan saat menyimpan data siswa.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              {isEditing ? <Save className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isEditing ? 'Perbarui Data Siswa' : 'Pendaftaran Siswa Baru'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? `Mengedit data: ${editingStudent.fullName} (${editingStudent.nis})`
                  : 'Lengkapi identitas siswa dan kewajiban SPP bulanan'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
            {errors.submit && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}

            {/* Section 1: Identitas Pokok */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>1. Data Identitas & Nomor Induk</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NIS */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      NIS (Nomor Induk Siswa) <span className="text-rose-500">*</span>
                    </label>
                    {nisChecking ? (
                      <span className="text-[10px] text-slate-400">Memeriksa keunikan...</span>
                    ) : nisAvailable === true ? (
                      <span className="text-[10px] text-emerald-600 flex items-center space-x-0.5">
                        <CheckCircle className="w-3 h-3" />
                        <span>NIS Unik (Tersedia)</span>
                      </span>
                    ) : nisAvailable === false ? (
                      <span className="text-[10px] text-rose-600 flex items-center space-x-0.5">
                        <AlertCircle className="w-3 h-3" />
                        <span>NIS Duplikat!</span>
                      </span>
                    ) : null}
                  </div>
                  <input
                    type="text"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="Contoh: 20241001"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm font-mono ${
                      errors.nis || nisAvailable === false
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {errors.nis && <p className="text-[10px] text-rose-600 mt-1">{errors.nis}</p>}
                </div>

                {/* NISN */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NISN (Nomor Induk Siswa Nasional)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="10 Digit angka nasional"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm font-mono ${
                      errors.nisn
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {errors.nisn && <p className="text-[10px] text-rose-600 mt-1">{errors.nisn}</p>}
                </div>

                {/* Nama Lengkap */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Siswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama lengkap sesuai ijazah atau akta kelahiran"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                      errors.fullName
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-[10px] text-rose-600 mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('L')}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                        gender === 'L'
                          ? 'bg-blue-50 border-blue-400 text-blue-700 ring-2 ring-blue-500/20'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>Laki-laki (L)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('P')}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                        gender === 'P'
                          ? 'bg-rose-50 border-rose-400 text-rose-700 ring-2 ring-rose-500/20'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>Perempuan (P)</span>
                    </button>
                  </div>
                </div>

                {/* Status Keaktifan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Siswa <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('aktif')}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                        status === 'aktif'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-2 ring-emerald-500/20'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Aktif</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('tidak_aktif')}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                        status === 'tidak_aktif'
                          ? 'bg-amber-50 border-amber-400 text-amber-700 ring-2 ring-amber-500/20'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Tidak Aktif</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Akademik & Kelas */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>2. Penempatan Kelas & Tahun Ajaran</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Kelas */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Kelas <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomClass(!isCustomClass)}
                      className="text-[10px] text-emerald-600 hover:underline"
                    >
                      {isCustomClass ? 'Pilih dari daftar' : '+ Kelas Baru'}
                    </button>
                  </div>
                  {isCustomClass ? (
                    <input
                      type="text"
                      value={customClass}
                      onChange={(e) => setCustomClass(e.target.value)}
                      placeholder="Contoh: X-A atau X-1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  ) : (
                    <select
                      value={gradeClass}
                      onChange={(e) => setGradeClass(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      {Array.from(new Set([...DEFAULT_CLASSES, ...classList])).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.gradeClass && (
                    <p className="text-[10px] text-rose-600 mt-1">{errors.gradeClass}</p>
                  )}
                </div>

                {/* Tahun Ajaran */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Ajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {Array.from(new Set([...DEFAULT_ACADEMIC_YEARS, academicYear].filter(Boolean))).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Nominal SPP Bulanan */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4">
              <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>3. Kewajiban SPP Bulanan Siswa</span>
                <span className="text-emerald-700 text-xs font-bold font-mono">
                  {formatRupiah(monthlySppNominal)} / bulan
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nominal SPP per Bulan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={monthlySppNominal || ''}
                    onChange={(e) => setMonthlySppNominal(Number(e.target.value) || 0)}
                    placeholder="Contoh: 350000"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {errors.monthlySppNominal && (
                    <p className="text-[10px] text-rose-600 mt-1">{errors.monthlySppNominal}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Pilihan Cepat Nominal Sekolah:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[250000, 300000, 350000, 400000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setMonthlySppNominal(amt)}
                        className={`px-2 py-1 rounded text-xs font-medium transition ${
                          monthlySppNominal === amt
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {formatRupiah(amt)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Kontak & Wali */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span>4. Data Kontak & Orang Tua / Wali</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Orang Tua / Wali */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Orang Tua / Wali <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Nama ayah, ibu, atau wali murid"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                      errors.parentName
                        ? 'border-rose-400 bg-rose-50/50'
                        : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {errors.parentName && (
                    <p className="text-[10px] text-rose-600 mt-1">{errors.parentName}</p>
                  )}
                </div>

                {/* Nomor HP / WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor HP / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
                      errors.phone
                        ? 'border-rose-400 bg-rose-50/50'
                        : 'border-slate-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                    }`}
                  />
                  {errors.phone && <p className="text-[10px] text-rose-600 mt-1">{errors.phone}</p>}
                </div>

                {/* Alamat Lengkap */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Lengkap Tempat Tinggal
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Jalan, No Rumah, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Catatan Tambahan */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Khusus (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Penerima KIP, Beasiswa Prestasi, Anak Guru, dll"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || nisAvailable === false}
              className="inline-flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Simpan Perubahan' : 'Daftarkan Siswa'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
