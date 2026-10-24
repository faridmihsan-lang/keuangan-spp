import React from 'react';
import { X, Printer, School, CheckCircle2 } from 'lucide-react';
import { PaymentRecord, Student } from '../types/student';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentRecord | null;
  student: Student | null;
}

// Terbilang Rupiah Helper
function terbilang(n: number): string {
  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  if (n < 12) return bilangan[n];
  if (n < 20) return terbilang(n - 10) + ' Belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh ' + terbilang(n % 10);
  if (n < 200) return 'Seratus ' + terbilang(n - 100);
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus ' + terbilang(n % 100);
  if (n < 2000) return 'Seribu ' + terbilang(n - 1000);
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu ' + terbilang(n % 1000);
  if (n < 1000000000)
    return terbilang(Math.floor(n / 1000000)) + ' Juta ' + terbilang(n % 1000000);
  return String(n);
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  payment,
  student,
}) => {
  if (!isOpen || !payment || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const terbilangStr = `${terbilang(payment.amount).trim()} Rupiah`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6">
        {/* Controls bar (Hidden during print) */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold">Bukti Kuitansi Pembayaran SPP</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kuitansi</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-8 sm:p-10 bg-white text-slate-800" id="receipt-print-area">
          {/* School Letterhead */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                <School className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-base font-extrabold uppercase tracking-tight text-slate-900">
                  SMK / SMA MANDIRI PRESTASI
                </h1>
                <p className="text-[11px] text-slate-600">
                  Jl. Pendidikan Nasional No. 123, Bandung • Telp. (022) 7102345
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  UNIT TATA USAHA & BENDAHARA ADMINISTRASI KEUANGAN SEKOLAH
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase border border-emerald-300">
                LUNAS
              </span>
              <p className="text-[11px] font-mono text-slate-600 mt-1">
                No: <strong>{payment.receiptNumber}</strong>
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider underline underline-offset-4 text-slate-900">
              TANDA TERIMA / KUITANSI PEMBAYARAN SPP
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Tahun Ajaran: {payment.academicYear || student.academicYear}
            </p>
          </div>

          {/* Meta Details Table */}
          <div className="space-y-2 text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500">Telah Diterima Dari</span>
              <span className="col-span-2 font-bold text-slate-900">: {payment.studentName}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500">Nomor Induk Siswa (NIS)</span>
              <span className="col-span-2 font-mono font-semibold text-slate-800">: {payment.studentNis}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500">Kelas</span>
              <span className="col-span-2 font-medium text-slate-800">
                : {payment.gradeClass}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500">Uraian Pembayaran</span>
              <span className="col-span-2 font-bold text-emerald-800">
                : Iuran SPP Bulan {payment.month} {payment.year}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500">Metode Pembayaran</span>
              <span className="col-span-2 font-medium text-slate-800">: {payment.paymentMethod}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-slate-500">Tanggal Bayar</span>
              <span className="col-span-2 font-medium text-slate-800">
                : {formatDateIndo(payment.paymentDate)}
              </span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="border-2 border-dashed border-emerald-600 bg-emerald-50/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                  Jumlah Pembayaran:
                </span>
                <span className="text-2xl font-black text-emerald-900 font-mono">
                  {formatRupiah(payment.amount)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 italic block">Status Pembayaran:</span>
                <span className="font-bold text-emerald-700 text-xs flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 inline" />
                  <span>Lunas Diverifikasi</span>
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-emerald-200 text-xs italic text-slate-700">
              Terbilang: <span className="font-semibold text-slate-900">"{terbilangStr}"</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 text-xs text-center mt-8 pt-4">
            <div>
              <p className="text-slate-500">Penyetor / Wali Murid,</p>
              <div className="h-16" />
              <p className="font-bold text-slate-900 underline underline-offset-4">
                ({student.parentName || student.fullName})
              </p>
            </div>

            <div>
              <p className="text-slate-500">
                Bandung, {formatDateIndo(payment.paymentDate)}
              </p>
              <p className="text-slate-500">Petugas Kasir Tata Usaha,</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-[10px] text-slate-400 font-mono italic">[ Tanda Tangan & Cap TU ]</span>
              </div>
              <p className="font-bold text-slate-900 underline underline-offset-4">
                ({payment.recordedBy})
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 text-[9px] text-slate-400 text-center">
            * Kuitansi ini merupakan bukti pembayaran SPP yang sah yang dicetak secara elektronik oleh Sistem Informasi SPP Sekolah.
          </div>
        </div>
      </div>
    </div>
  );
};
