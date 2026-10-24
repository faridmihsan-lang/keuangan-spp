import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { ImportPreviewItem, Student } from '../types/student';
import { parseExcelStudentFile, downloadStudentTemplate } from '../utils/excelUtils';
import { bulkAddStudents } from '../services/studentService';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingStudents: Student[];
  onImportSuccess: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingStudents,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewItems, setPreviewItems] = useState<ImportPreviewItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    added: number;
    failed: number;
    skippedNis: string[];
  } | null>(null);

  if (!isOpen) return null;

  const existingNisSet = new Set(existingStudents.map((s) => s.nis.trim()));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setImportResult(null);

    try {
      const parsed = await parseExcelStudentFile(file, existingNisSet);
      setPreviewItems(parsed);
    } catch (err: any) {
      console.error(err);
      alert('Gagal membaca file Excel. Pastikan format file sesuai template standar.');
      setSelectedFile(null);
      setPreviewItems([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsParsing(true);
    setImportResult(null);

    try {
      const parsed = await parseExcelStudentFile(file, existingNisSet);
      setPreviewItems(parsed);
    } catch (err: any) {
      console.error(err);
      alert('Gagal membaca file Excel.');
      setSelectedFile(null);
      setPreviewItems([]);
    } finally {
      setIsParsing(false);
    }
  };

  const validItems = previewItems.filter((item) => item.isValid);
  const invalidItems = previewItems.filter((item) => !item.isValid);

  const handleExecuteImport = async () => {
    if (validItems.length === 0) return;

    setIsImporting(true);
    try {
      const toAdd = validItems.map((item) => {
        const d = item.data;
        return {
          nis: (d.nis || '').trim(),
          nisn: (d.nisn || '').trim(),
          fullName: (d.fullName || '').trim(),
          gender: d.gender || 'L',
          gradeClass: (d.gradeClass || 'X-A').trim(),
          academicYear: (d.academicYear || '2024/2025').trim(),
          monthlySppNominal: Number(d.monthlySppNominal) || 300000,
          address: (d.address || '').trim(),
          parentName: (d.parentName || '').trim(),
          phone: (d.phone || '').trim(),
          status: d.status || 'aktif',
          notes: (d.notes || '').trim(),
        } as Omit<Student, 'id' | 'createdAt' | 'updatedAt'>;
      });

      const res = await bulkAddStudents(toAdd);
      setImportResult(res);
      onImportSuccess();
    } catch (err: any) {
      console.error(err);
      alert('Terjadi kesalahan saat mengimpor data ke database: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewItems([]);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Impor Data Siswa dari Excel</h2>
              <p className="text-xs text-slate-400">
                Unggah data siswa secara massal menggunakan file .xlsx atau .csv
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Template Download Notification */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900 text-xs">
                  Format Berkas Standar Impor Siswa SPP
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Gunakan template resmi agar header kolom (NIS, Nama, Kelas, SPP, No HP, dll) terbaca akurat.
                </p>
              </div>
            </div>
            <button
              onClick={downloadStudentTemplate}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shrink-0 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template (.xlsx)</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          {!selectedFile ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-emerald-50/30 transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-slate-200 group-hover:bg-emerald-100 group-hover:text-emerald-700 text-slate-500 mx-auto flex items-center justify-center transition">
                <Upload className="w-6 h-6" />
              </div>
              <p className="mt-3 font-semibold text-slate-800 text-sm">
                Klik untuk memilih file atau seret file ke sini
              </p>
              <p className="text-slate-500 text-[11px] mt-1">
                Format yang didukung: Microsoft Excel (.xlsx, .xls) atau CSV (.csv)
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  XLS
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-xs">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {previewItems.length} baris terbaca
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Ganti File
              </button>
            </div>
          )}

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="py-6 text-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
              <p>Menganalisis baris data & memvalidasi duplikasi NIS...</p>
            </div>
          )}

          {/* Validation Result Summary & Table */}
          {previewItems.length > 0 && !isParsing && (
            <div>
              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Baris</span>
                  <p className="text-base font-bold text-slate-800">{previewItems.length}</p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-semibold uppercase">Siap Diimpor</span>
                  <p className="text-base font-bold text-emerald-700">{validItems.length}</p>
                </div>
                <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <span className="text-[10px] text-rose-700 font-semibold uppercase">Baris Bermasalah</span>
                  <p className="text-base font-bold text-rose-700">{invalidItems.length}</p>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2 px-3 w-12 text-center">Status</th>
                      <th className="py-2 px-3">NIS</th>
                      <th className="py-2 px-3">Nama Lengkap</th>
                      <th className="py-2 px-3">Kelas</th>
                      <th className="py-2 px-3">Keterangan / Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {previewItems.map((item, idx) => (
                      <tr
                        key={idx}
                        className={item.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50 hover:bg-rose-50'}
                      >
                        <td className="py-2 px-3 text-center">
                          {item.isValid ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 inline" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 inline" />
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-medium">{item.data.nis || '-'}</td>
                        <td className="py-2 px-3 font-medium">{item.data.fullName || '-'}</td>
                        <td className="py-2 px-3">{item.data.gradeClass || '-'}</td>
                        <td className="py-2 px-3">
                          {item.isValid ? (
                            <span className="text-emerald-700 text-[11px]">Valid</span>
                          ) : (
                            <span className="text-rose-700 text-[11px] font-medium">
                              {item.errors.join(', ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Result Notification */}
          {importResult && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-xs space-y-1">
              <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Impor Data Siswa Berhasil Disimpan!</span>
              </div>
              <p className="text-emerald-700">
                Berhasil menambahkan <strong>{importResult.added}</strong> siswa ke database Firestore.
              </p>
              {importResult.failed > 0 && (
                <p className="text-amber-800">
                  {importResult.failed} siswa dilewati karena NIS sudah terdaftar sebelumnya (
                  {importResult.skippedNis.join(', ')}).
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
          >
            {importResult ? 'Selesai' : 'Batal'}
          </button>

          {previewItems.length > 0 && !importResult && (
            <button
              onClick={handleExecuteImport}
              disabled={isImporting || validItems.length === 0}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Firestore...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Impor {validItems.length} Siswa Valid</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
