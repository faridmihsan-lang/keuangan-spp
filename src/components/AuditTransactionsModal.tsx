import React from 'react';
import { X, Receipt, Printer, Calendar, Wallet } from 'lucide-react';
import { PaymentRecord, Student } from '../types/student';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface AuditTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  payments: PaymentRecord[];
  onPrintReceipt: (payment: PaymentRecord) => void;
}

export const AuditTransactionsModal: React.FC<AuditTransactionsModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  payments,
  onPrintReceipt,
}) => {
  if (!isOpen) return null;

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">{title}</h2>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-blue-700 font-bold uppercase">
                Total Kas Sah Diterima (Dasar Perhitungan)
              </span>
              <p className="text-lg font-black text-blue-950 font-mono mt-0.5">
                {formatRupiah(totalAmount)}
              </p>
            </div>
            <div className="text-right text-[11px] text-blue-800">
              <span className="font-bold">{payments.length}</span> transaksi kuitansi tercatat di Firestore
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              Belum ada transaksi pembayaran yang tercatat pada entitas ini.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase">
                    <th className="py-2.5 px-3">No. Transaksi</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Siswa / Rombel</th>
                    <th className="py-2.5 px-3">Bulan SPP</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {p.receiptNumber}
                      </td>
                      <td className="py-2.5 px-3">{formatDateIndo(p.paymentDate)}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900">{p.studentName}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          NIS: {p.studentNis} • {p.gradeClass}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold">{p.month} {p.year}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700 font-mono">
                        {formatRupiah(p.amount)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onPrintReceipt(p)}
                          className="p-1 rounded text-emerald-700 hover:bg-emerald-50 transition"
                          title="Cetak Bukti Pembayaran"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
