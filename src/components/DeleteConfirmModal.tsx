import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { Student } from '../types/student';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onConfirmDelete: (id: string) => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  student,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !student) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete(student.id);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghapus data siswa: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-700/60 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-base font-bold">Konfirmasi Hapus Siswa</h3>
          </div>
          <button onClick={onClose} className="text-rose-200 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs sm:text-sm">
          <p className="text-slate-700">
            Apakah Anda yakin ingin menghapus data siswa berikut secara permanen dari sistem?
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <p className="font-bold text-slate-900 text-sm">{student.fullName}</p>
            <p className="text-xs text-slate-500 font-mono">
              NIS: {student.nis} • Kelas: {student.gradeClass}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs">
            <strong>Peringatan Relasi Data:</strong> Menghapus siswa ini juga akan membersihkan
            seluruh catatan kuitansi dan riwayat pembayaran SPP yang terhubung dengan NIS siswa ini.
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Hapus Permanen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
