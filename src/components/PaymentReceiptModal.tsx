import React from 'react';
import { X, Printer, School, CheckCircle2, AlertCircle, Download, FileText } from 'lucide-react';
import { PaymentRecord, Student, SchoolSettings } from '../types/student';
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from '../utils/formatters';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentRecord | null;
  student: Student | null;
  schoolSettings?: SchoolSettings;
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

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
  student,
  schoolSettings,
}) => {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const terbilangStr = `${terbilang(payment.amount).trim()} Rupiah`;
  const isLunas = payment.status === 'Lunas';
  const hasRemaining = payment.remainingBalance > 0;

  const currentSchoolName = schoolSettings?.schoolName || 'SMK / SMA MANDIRI PRESTASI';
  const currentAddress = schoolSettings?.address || 'Jl. Pendidikan Nasional No. 123 • Telp. (022) 7102345';
  const currentFooterNote = schoolSettings?.receiptFooterNote || '* Simpanlah bukti pembayaran elektronik ini sebagai tanda bukti pembayaran SPP yang sah. Dicetak dari Sistem Informasi SPP Sekolah.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Header (Hidden when printing/PDF) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold">Bukti Kuitansi Pembayaran SPP Resmi</h3>
              <p className="text-[10px] text-slate-400">Nomor Transaksi: {payment.receiptNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              title="Cetak langsung atau simpan sebagai PDF melalui dialog printer browser"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Unduh PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTAINER */}
        <div className="p-8 sm:p-10 bg-white text-slate-800" id="receipt-printable">
          {/* School Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-5">
            <div className="flex items-center space-x-3.5">
              <div className="w-13 h-13 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
                <School className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-base font-black uppercase tracking-tight text-slate-900">
                  {currentSchoolName}
                </h1>
                <p className="text-[11px] text-slate-600">
                  {currentAddress}
                </p>
                <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
                  KASIR ADMINISTRASI PEMBAYARAN SPP BULANAN
                </p>
              </div>
            </div>

            <div className="text-right">
              <div
                className={`inline-block px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider border ${
                  isLunas
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                    : 'bg-amber-100 text-amber-800 border-amber-400'
                }`}
              >
                {isLunas ? 'LUNAS' : 'SEBAGIAN / CICILAN'}
              </div>
              <p className="text-[11px] font-mono text-slate-700 font-bold mt-1.5">
                {payment.receiptNumber}
              </p>
              <p className="text-[10px] text-slate-400">
                Waktu: {formatDateTimeIndo(payment.createdAt)}
              </p>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center mb-5">
            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-900 underline underline-offset-4">
              BUKTI TRANSAKSI PEMBAYARAN SPP
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Tahun Ajaran: {payment.academicYear} • Periode SPP: Bulan {payment.month} {payment.year}
            </p>
          </div>

          {/* Student Identitas Table */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 mb-5">
            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-28 text-slate-500">Nama Siswa</span>
                <span className="font-bold text-slate-900">: {payment.studentName}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500">Nomor Induk (NIS)</span>
                <span className="font-mono font-bold text-slate-800">: {payment.studentNis}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500">Kelas / Rombel</span>
                <span className="font-semibold text-emerald-800">: {payment.gradeClass}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-28 text-slate-500">Tahun Ajaran</span>
                <span className="font-medium text-slate-800">: {payment.academicYear}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500">Tanggal Transaksi</span>
                <span className="font-medium text-slate-800">: {formatDateIndo(payment.paymentDate)}</span>
              </div>
              <div className="flex">
                <span className="w-28 text-slate-500">Metode Bayar</span>
                <span className="font-medium text-slate-800">
                  : {payment.paymentMethod} {payment.bankName ? `(${payment.bankName.split('(')[0]})` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-5 text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3">Uraian Tagihan</th>
                  <th className="py-2.5 px-3 text-right">Tarif SPP</th>
                  <th className="py-2.5 px-3 text-right">Dibayar Saat Ini</th>
                  <th className="py-2.5 px-3 text-right">Sisa Tagihan Bulan Ini</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">
                      SPP Bulan {payment.month} {payment.year}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {payment.notes || (isLunas ? 'Pembayaran Lunas SPP Bulanan' : 'Pembayaran Cicilan SPP')}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-right font-medium">
                    {formatRupiah(payment.monthlySppNominal)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-700">
                    {formatRupiah(payment.amount)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold">
                    {hasRemaining ? (
                      <span className="text-amber-700">{formatRupiah(payment.remainingBalance)}</span>
                    ) : (
                      <span className="text-emerald-700">Rp 0 (Lunas)</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cash Tendered & Change if available */}
          {payment.paymentMethod === 'Tunai' && payment.cashTendered && (
            <div className="flex justify-end space-x-6 text-xs text-slate-600 mb-4 px-2">
              <div>
                <span>Uang Tunai Diserahkan:</span>{' '}
                <strong className="text-slate-900">{formatRupiah(payment.cashTendered)}</strong>
              </div>
              <div>
                <span>Uang Kembalian:</span>{' '}
                <strong className="text-emerald-700 font-bold">{formatRupiah(payment.changeAmount || 0)}</strong>
              </div>
            </div>
          )}

          {/* Amount Box */}
          <div className="border-2 border-dashed border-emerald-600 bg-emerald-50/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                  Total Dana Diterima:
                </span>
                <span className="text-2xl font-black text-emerald-900 font-mono">
                  {formatRupiah(payment.amount)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block">Status Akhir Tagihan:</span>
                <span
                  className={`font-bold text-xs flex items-center justify-end space-x-1 ${
                    isLunas ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {isLunas ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 inline" />
                      <span>Tagihan Bulan Ini Lunas Penuh</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 inline" />
                      <span>Masih Tersisa {formatRupiah(payment.remainingBalance)}</span>
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-emerald-200 text-xs italic text-slate-700">
              Terbilang: <span className="font-semibold text-slate-900">"{terbilangStr}"</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 text-xs text-center mt-6 pt-3">
            <div>
              <p className="text-slate-500">Penyetor / Siswa / Wali Murid,</p>
              <div className="h-16" />
              <p className="font-bold text-slate-900 underline underline-offset-4">
                ({student?.parentName || payment.studentName})
              </p>
            </div>

            <div>
              <p className="text-slate-500">
                Bandung, {formatDateIndo(payment.paymentDate)}
              </p>
              <p className="text-slate-500">Petugas Kasir Tata Usaha,</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-[10px] text-slate-400 font-mono italic">
                  [ Tanda Tangan & Cap Kasir ]
                </span>
              </div>
              <p className="font-bold text-slate-900 underline underline-offset-4">
                ({payment.recordedBy})
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-slate-200 text-[9px] text-slate-400 text-center">
            {currentFooterNote}
          </div>
        </div>
      </div>
    </div>
  );
};
