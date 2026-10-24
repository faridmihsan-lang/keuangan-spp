import React from 'react';
import { X, Printer, School, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { StudentArrearSummary } from '../types/student';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface ArrearsLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  arrearItem: StudentArrearSummary | null;
}

// Terbilang helper
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

export const ArrearsLetterModal: React.FC<ArrearsLetterModalProps> = ({
  isOpen,
  onClose,
  arrearItem,
}) => {
  if (!isOpen || !arrearItem) return null;

  const { student, overview, totalArrears, unpaidMonths } = arrearItem;
  const todayStr = formatDateIndo(new Date().toISOString());
  const terbilangStr = `${terbilang(totalArrears).trim()} Rupiah`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Header (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold">Surat Tagihan & Pemberitahuan Tunggakan SPP</h3>
              <p className="text-[10px] text-slate-400">NIS: {student.nis} • {student.fullName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              title="Cetak surat atau unduh dalam format PDF"
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

        {/* PRINTABLE LETTER AREA */}
        <div className="p-8 sm:p-10 bg-white text-slate-800 text-xs sm:text-sm leading-relaxed" id="arrears-letter-print">
          {/* Official Letterhead */}
          <div className="flex items-center space-x-4 border-b-2 border-slate-900 pb-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
              <School className="w-9 h-9" />
            </div>
            <div className="flex-1">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 leading-tight">
                SMK / SMA MANDIRI PRESTASI
              </h1>
              <p className="text-[11px] text-slate-600">
                Jl. Pendidikan Nasional No. 123, Kota Bandung • Telp. (022) 7102345
              </p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                BAGIAN KEUANGAN DAN TATA USAHA SEKOLAH
              </p>
            </div>
          </div>

          {/* Letter Meta */}
          <div className="flex justify-between items-start text-xs mb-5">
            <div className="space-y-1">
              <p>
                <span className="font-semibold text-slate-600 inline-block w-20">Nomor</span>: 421.3/TU-SPP/{new Date().getFullYear()}/
                {student.nis.slice(-4)}
              </p>
              <p>
                <span className="font-semibold text-slate-600 inline-block w-20">Lampiran</span>: 1 (Satu) Lembar Rincian Tagihan
              </p>
              <p>
                <span className="font-semibold text-slate-600 inline-block w-20">Perihal</span>:{' '}
                <strong className="text-slate-900 uppercase">Pemberitahuan Tunggakan Iuran SPP</strong>
              </p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <p>Bandung, {todayStr}</p>
            </div>
          </div>

          {/* Recipient */}
          <div className="mb-5 text-xs">
            <p>Kepada Yth.</p>
            <p className="font-bold text-slate-900">Bapak/Ibu Orang Tua / Wali Murid dari:</p>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1 space-y-0.5">
              <p>
                Nama Siswa: <strong className="text-slate-900">{student.fullName}</strong>
              </p>
              <p className="font-mono text-[11px]">
                NIS / NISN: {student.nis} / {student.nisn || '-'}
              </p>
              <p>
                Kelas: <strong className="text-slate-800">{student.gradeClass}</strong>
              </p>
            </div>
            <p className="mt-1">Di Tempat</p>
          </div>

          {/* Letter Body */}
          <div className="space-y-3 text-xs text-slate-700">
            <p>Dengan hormat,</p>
            <p className="text-justify">
              Sehubungan dengan pelaksanaan administrasi keuangan sekolah Tahun Ajaran{' '}
              <strong>{student.academicYear}</strong>, berdasarkan catatan pembukuan kas Tata Usaha kami sampaikan
              bahwa siswa yang bersangkutan masih memiliki kewajiban pembayaran SPP bulanan yang belum terselesaikan
              dengan rincian sebagai berikut:
            </p>

            {/* Overdue Months Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden my-3">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="py-2 px-3 w-8 text-center">No</th>
                    <th className="py-2 px-3">Bulan Tagihan</th>
                    <th className="py-2 px-3 text-right">Tarif SPP</th>
                    <th className="py-2 px-3 text-right">Sudah Dibayar</th>
                    <th className="py-2 px-3 text-right">Sisa Tunggakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {overview.months
                    .filter((m) => !m.isPaid)
                    .map((m, idx) => (
                      <tr key={m.monthName} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          SPP Bulan {m.monthName} {m.calendarYear}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">{formatRupiah(m.requiredAmount)}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-700">
                          {formatRupiah(m.paidAmount)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                          {formatRupiah(m.remainingAmount)}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t border-slate-200">
                    <td colSpan={4} className="py-2.5 px-3 text-right uppercase">
                      Total Sisa Tunggakan:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-rose-700 font-black">
                      {formatRupiah(totalArrears)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Terbilang box */}
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-xs italic text-rose-900">
              Terbilang: <strong>"{terbilangStr}"</strong>
            </div>

            <p className="text-justify mt-3">
              Mengingat pentingnya kelancaran kegiatan belajar mengajar dan operasional sekolah, kami memohon
              kerjasama Bapak/Ibu untuk dapat segera menyelesaikan kewajiban pembayaran tersebut melalui kasir Tata
              Usaha sekolah atau melalui transfer ke rekening resmi sekolah (Bank BSI No. 7118726086 atau Bank BCA No. 1970539839 a.n. Bendahara
              SMK Mandiri Prestasi).
            </p>

            <p>Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 text-xs text-center mt-8 pt-4">
            <div>
              <p className="text-slate-500">Mengetahui,</p>
              <p className="text-slate-500">Kepala Sekolah,</p>
              <div className="h-16" />
              <p className="font-bold text-slate-900 underline underline-offset-4">
                Drs. H. Mulyadi, M.M.Pd.
              </p>
              <p className="text-[10px] text-slate-500 font-mono">NIP. 19740512 199903 1 004</p>
            </div>

            <div>
              <p className="text-slate-500">Bendahara / Petugas TU,</p>
              <div className="h-16 flex items-center justify-center">
                <span className="text-[10px] text-slate-400 font-mono italic">[ Tanda Tangan & Cap TU ]</span>
              </div>
              <p className="font-bold text-slate-900 underline underline-offset-4">
                Ibu Rahmawati, S.E.
              </p>
              <p className="text-[10px] text-slate-500">Staf Bendahara SPP</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
