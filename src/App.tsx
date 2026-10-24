/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { StudentStats } from './components/StudentStats';
import { StudentFilter } from './components/StudentFilter';
import { StudentTable } from './components/StudentTable';
import { StudentFormModal } from './components/StudentFormModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { PaymentReceiptModal } from './components/PaymentReceiptModal';
import { ModulesOverviewModal } from './components/ModulesOverviewModal';
import { PaymentForm } from './components/PaymentForm';
import { PaymentHistoryTable } from './components/PaymentHistoryTable';
import { ArrearsReportView } from './components/ArrearsReportView';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { Student, PaymentRecord, SchoolSettings, UserRole } from './types/student';
import {
  subscribeStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  seedSampleStudentsIfEmpty,
} from './services/studentService';
import {
  subscribeAllPayments,
  deletePayment,
} from './services/paymentService';
import {
  subscribeSchoolSettings,
  DEFAULT_SCHOOL_SETTINGS,
  addActivityLog,
} from './services/settingsService';
import { exportStudentsToExcel } from './utils/excelUtils';
import { DEFAULT_CLASSES, DEFAULT_ACADEMIC_YEARS } from './utils/formatters';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  History,
  PlusCircle,
  Users,
  FileBarChart,
  LayoutDashboard,
  Settings,
} from 'lucide-react';

export default function App() {
  // Navigation Module: 'dashboard' | 'students' | 'payments' | 'reports' | 'settings'
  const [activeModule, setActiveModule] = useState<'dashboard' | 'students' | 'payments' | 'reports' | 'settings'>('dashboard');
  const [paymentSubTab, setPaymentSubTab] = useState<'form' | 'history'>('form');

  // RBAC User Role
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');

  // Master Data & Cloud Settings
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(DEFAULT_SCHOOL_SETTINGS);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Student Filters & Search (Modul 1)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('Semua');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');

  // Modul 2 Preselected Student
  const [preSelectedStudent, setPreSelectedStudent] = useState<Student | null>(null);

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRelationsModalOpen, setIsRelationsModalOpen] = useState(false);
  const [printReceiptData, setPrintReceiptData] = useState<{
    payment: PaymentRecord;
    student: Student | null;
  } | null>(null);

  // Real-time Firestore subscription for School Settings
  useEffect(() => {
    const unsubscribe = subscribeSchoolSettings((s) => {
      setSchoolSettings(s);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription for Students
  useEffect(() => {
    setIsLoadingStudents(true);
    const unsubscribe = subscribeStudents(
      (list) => {
        setStudents(list);
        setIsLoadingStudents(false);
      },
      (err) => {
        console.error('Students subscription error:', err);
        setIsLoadingStudents(false);
        showToast('error', 'Gagal memuat data siswa dari Firestore.');
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription for All Payments (Modul 2)
  useEffect(() => {
    setIsLoadingPayments(true);
    const unsubscribe = subscribeAllPayments(
      (records) => {
        setPayments(records);
        setIsLoadingPayments(false);
      },
      (err) => {
        console.error('Payments subscription error:', err);
        setIsLoadingPayments(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Auto-seed initial students if empty on initial boot
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isLoadingStudents && students.length === 0) {
      timer = setTimeout(async () => {
        try {
          await seedSampleStudentsIfEmpty();
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [isLoadingStudents, students.length]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Distinct Classes & Academic Years from data
  const classList = useMemo(() => {
    const set = new Set([...DEFAULT_CLASSES, ...students.map((s) => s.gradeClass).filter(Boolean)]);
    return Array.from(set).sort();
  }, [students]);

  const academicYearList = useMemo(() => {
    const set = new Set([...DEFAULT_ACADEMIC_YEARS, ...students.map((s) => s.academicYear).filter(Boolean)]);
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [students]);

  // Filtered Students (Modul 1)
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNis = s.nis.toLowerCase().includes(q);
        const matchNisn = (s.nisn || '').toLowerCase().includes(q);
        const matchName = s.fullName.toLowerCase().includes(q);
        const matchClass = s.gradeClass.toLowerCase().includes(q);
        if (!matchNis && !matchNisn && !matchName && !matchClass) {
          return false;
        }
      }

      if (selectedClass !== 'Semua' && s.gradeClass !== selectedClass) {
        return false;
      }

      if (selectedAcademicYear !== 'Semua' && s.academicYear !== selectedAcademicYear) {
        return false;
      }

      if (selectedStatus !== 'Semua' && s.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [students, searchQuery, selectedClass, selectedAcademicYear, selectedStatus]);

  // Handlers for Modul 1
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingStudent) {
      await updateStudent(editingStudent.id, data);
      showToast('success', `Data siswa ${data.fullName} berhasil diperbarui.`);
      if (detailStudent && detailStudent.id === editingStudent.id) {
        setDetailStudent({ ...editingStudent, ...data });
      }
      await addActivityLog({
        action: 'Ubah Data Siswa',
        module: 'Siswa',
        details: `Memperbarui profil siswa: ${data.fullName} (NIS: ${data.nis}, Kelas: ${data.gradeClass})`,
        userName: currentRole === 'admin' ? 'Administrator' : 'Petugas Keuangan',
        userRole: currentRole,
      });
    } else {
      await addStudent(data);
      showToast('success', `Siswa baru ${data.fullName} (NIS: ${data.nis}) berhasil ditambahkan.`);
      await addActivityLog({
        action: 'Tambah Siswa Baru',
        module: 'Siswa',
        details: `Mendaftarkan siswa baru: ${data.fullName} (NIS: ${data.nis}, Kelas: ${data.gradeClass})`,
        userName: currentRole === 'admin' ? 'Administrator' : 'Petugas Keuangan',
        userRole: currentRole,
      });
    }
  };

  const handleConfirmDelete = async (id: string) => {
    const s = students.find((item) => item.id === id);
    await deleteStudent(id);
    showToast('success', 'Data siswa berhasil dihapus dari database.');
    if (detailStudent && detailStudent.id === id) {
      setDetailStudent(null);
    }
    await addActivityLog({
      action: 'Hapus Siswa',
      module: 'Siswa',
      details: `Menghapus data siswa: ${s?.fullName || id} (NIS: ${s?.nis || '-'})`,
      userName: currentRole === 'admin' ? 'Administrator' : 'Petugas Keuangan',
      userRole: currentRole,
    });
  };

  const handleExportExcel = () => {
    const toExport = filteredStudents.length > 0 ? filteredStudents : students;
    if (toExport.length === 0) {
      showToast('error', 'Tidak ada data siswa untuk diekspor.');
      return;
    }
    const filename = `Data_Siswa_SPP_${selectedClass !== 'Semua' ? selectedClass.replace(/\s+/g, '_') + '_' : ''}${new Date().toISOString().split('T')[0]}.xlsx`;
    exportStudentsToExcel(toExport, filename);
    showToast('success', `Berhasil mengekspor ${toExport.length} data siswa ke Excel.`);
  };

  const handleManualSeed = async () => {
    setIsSeeding(true);
    try {
      const seeded = await seedSampleStudentsIfEmpty();
      if (seeded) {
        showToast('success', 'Berhasil memuat data siswa contoh SMK.');
        await addActivityLog({
          action: 'Inisialisasi Data Siswa',
          module: 'Siswa',
          details: 'Memuat data siswa percontohan SMK ke database cloud.',
          userName: 'Administrator',
          userRole: currentRole,
        });
      } else {
        showToast('error', 'Database sudah memiliki data siswa.');
      }
    } catch (err: any) {
      showToast('error', 'Gagal memuat data contoh: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  // Cross-module Navigation: Jump to Modul 2 with a specific student
  const handlePayStudentInModule2 = (student: Student) => {
    setPreSelectedStudent(student);
    setActiveModule('payments');
    setPaymentSubTab('form');
  };

  // Handlers for Modul 2
  const handlePaymentSuccess = async (payment: PaymentRecord, student: Student, printDirectly: boolean) => {
    showToast(
      'success',
      `Transaksi ${payment.receiptNumber} (${payment.studentName} - Bulan ${payment.month}) berhasil disimpan secara permanen!`
    );

    await addActivityLog({
      action: 'Setor Pembayaran SPP',
      module: 'Pembayaran',
      details: `Kuitansi ${payment.receiptNumber}: ${payment.studentName} (${payment.gradeClass}), Bulan ${payment.month}, Nominal Rp ${payment.amount.toLocaleString('id-ID')}`,
      userName: payment.recordedBy || 'Petugas Kasir',
      userRole: currentRole,
    });

    if (printDirectly) {
      setPrintReceiptData({ payment, student });
    }
  };

  const handleDeletePaymentTransaction = async (paymentId: string) => {
    try {
      const p = payments.find((item) => item.id === paymentId);
      await deletePayment(paymentId);
      showToast('success', 'Transaksi pembayaran berhasil dibatalkan dan dihapus.');
      await addActivityLog({
        action: 'Batalkan Pembayaran',
        module: 'Pembayaran',
        details: `Membatalkan kuitansi ${p?.receiptNumber || paymentId} (${p?.studentName}, Bulan ${p?.month})`,
        userName: currentRole === 'admin' ? 'Administrator' : 'Petugas Kasir',
        userRole: currentRole,
      });
    } catch (err: any) {
      showToast('error', 'Gagal membatalkan transaksi: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-70 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2.5 text-xs sm:text-sm font-semibold border ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-rose-600 text-white border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeModule={activeModule}
        onSelectModule={(mod) => {
          setActiveModule(mod);
          if (mod === 'payments' && !preSelectedStudent && students.length > 0) {
            setPreSelectedStudent(students[0]);
          }
        }}
        onOpenRelationsModal={() => setIsRelationsModalOpen(true)}
        activeAcademicYear={selectedAcademicYear}
        onSelectAcademicYear={(yr) => setSelectedAcademicYear(yr)}
        academicYears={academicYearList}
        totalStudents={students.length}
        totalPayments={payments.length}
        schoolName={schoolSettings.schoolName}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* ================= MODUL 4: DASHBOARD EKSEKUTIF ================= */}
        {activeModule === 'dashboard' && (
          <DashboardView
            students={students}
            payments={payments}
            activeAcademicYear={selectedAcademicYear}
            currentBillingMonth={schoolSettings.currentBillingMonth || 'Oktober'}
            onSelectAcademicYear={setSelectedAcademicYear}
            onPayStudent={handlePayStudentInModule2}
            onOpenAddStudent={handleOpenAdd}
            onGoToReports={() => setActiveModule('reports')}
            onGoToSettings={() => setActiveModule('settings')}
            onPrintReceipt={(p, s) => setPrintReceiptData({ payment: p, student: s })}
            userRole={currentRole}
          />
        )}

        {/* ================= MODUL 1: PENDATAAN SISWA ================= */}
        {activeModule === 'students' && (
          <div>
            {/* Title Banner */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Modul 1
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Pendataan & Master Siswa SPP
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Kelola identitas pokok siswa, nominal kewajiban SPP bulanan, dan histori kuitansi pembayaran dengan sinkronisasi database cloud permanen.
                </p>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-auto text-xs">
                <button
                  onClick={() => setActiveModule('payments')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Buka Modul 2 Kasir &rarr;</span>
                </button>
              </div>
            </div>

            {/* Statistical KPI Cards */}
            <StudentStats students={students} />

            {/* Filter & Actions Bar */}
            <StudentFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedClass={selectedClass}
              onClassChange={setSelectedClass}
              selectedAcademicYear={selectedAcademicYear}
              onAcademicYearChange={setSelectedAcademicYear}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              classList={classList}
              academicYearList={academicYearList}
              onOpenAddModal={handleOpenAdd}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onExportExcel={handleExportExcel}
              onSeedData={handleManualSeed}
              totalFiltered={filteredStudents.length}
              totalAll={students.length}
              isSeeding={isSeeding}
            />

            {/* Student Table */}
            {isLoadingStudents ? (
              <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-xs">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
                <p className="text-sm font-semibold text-slate-800">Menghubungkan ke Database Firestore...</p>
                <p className="text-xs text-slate-400 mt-1">Memuat daftar master siswa sekolah</p>
              </div>
            ) : (
              <StudentTable
                students={filteredStudents}
                onViewDetail={(student) => setDetailStudent(student)}
                onEditStudent={handleOpenEdit}
                onDeleteStudent={(student) => setDeletingStudent(student)}
                onOpenAddModal={handleOpenAdd}
                onPayStudent={handlePayStudentInModule2}
              />
            )}
          </div>
        )}

        {/* ================= MODUL 2: TRANSAKSI PEMBAYARAN SPP ================= */}
        {activeModule === 'payments' && (
          <div>
            {/* Title & Sub-tabs Banner */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Modul 2
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Transaksi Pembayaran SPP Bulanan
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Pencatatan setoran SPP lunas dan cicilan dengan validasi anti-duplikasi, kalkulasi sisa tagihan, dan cetak bukti kuitansi PDF.
                </p>
              </div>

              {/* Sub-tab navigation */}
              <div className="flex items-center space-x-2 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-bold">
                <button
                  onClick={() => setPaymentSubTab('form')}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition ${
                    paymentSubTab === 'form'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Kasir & Bayar SPP</span>
                </button>

                <button
                  onClick={() => setPaymentSubTab('history')}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition ${
                    paymentSubTab === 'history'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Riwayat & Buku Kas ({payments.length})</span>
                </button>
              </div>
            </div>

            {/* View Sub-tab 1: Payment Form */}
            {paymentSubTab === 'form' && (
              <PaymentForm
                students={students}
                allPayments={payments}
                preSelectedStudent={preSelectedStudent}
                onPaymentSuccess={handlePaymentSuccess}
                onSwitchToStudentModule={(student) => {
                  setActiveModule('students');
                  if (student) setDetailStudent(student);
                }}
              />
            )}

            {/* View Sub-tab 2: Payment History Table */}
            {paymentSubTab === 'history' && (
              <PaymentHistoryTable
                payments={payments}
                students={students}
                onPrintReceipt={(payment, student) => {
                  setPrintReceiptData({ payment, student });
                }}
                onDeletePayment={handleDeletePaymentTransaction}
                onOpenNewTransaction={(student) => {
                  if (student) setPreSelectedStudent(student);
                  setPaymentSubTab('form');
                }}
              />
            )}
          </div>
        )}

        {/* ================= MODUL 3: TUNGGAKAN DAN LAPORAN SPP ================= */}
        {activeModule === 'reports' && (
          <ArrearsReportView
            students={students}
            payments={payments}
            activeAcademicYear={selectedAcademicYear}
            onPayStudentInModule2={handlePayStudentInModule2}
            onPrintPaymentReceipt={(payment, student) => {
              setPrintReceiptData({ payment, student });
            }}
          />
        )}

        {/* ================= MODUL 4: PENGATURAN & BACKUP ================= */}
        {activeModule === 'settings' && (
          <SettingsView
            settings={schoolSettings}
            students={students}
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {schoolSettings.schoolName} • SIM SPP Terpadu (Modul 1: Siswa, Modul 2: Pembayaran, Modul 3: Tunggakan, Modul 4: Dashboard & Pengaturan)</p>
          <div className="flex items-center space-x-3 text-[11px]">
            <button
              onClick={() => setIsRelationsModalOpen(true)}
              className="text-emerald-700 hover:underline font-semibold"
            >
              Peta Relasi 4 Modul
            </button>
            <span>•</span>
            <span className="text-slate-400">Database: Google Cloud Firestore (Permanen)</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Add / Edit Student Modal */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingStudent(null);
        }}
        onSubmit={handleFormSubmit}
        editingStudent={editingStudent}
        classList={classList}
      />

      {/* 2. Student Detail & 12-Month SPP Ledger Modal */}
      <StudentDetailModal
        isOpen={!!detailStudent}
        onClose={() => setDetailStudent(null)}
        student={detailStudent}
        onOpenReceiptPrint={(payment, student) => {
          setPrintReceiptData({ payment, student });
        }}
        onOpenPaymentModule={(student) => {
          handlePayStudentInModule2(student);
        }}
      />

      {/* 3. Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingStudents={students}
        onImportSuccess={() => {
          showToast('success', 'Data siswa dari berkas Excel berhasil diimpor!');
        }}
      />

      {/* 4. Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        student={deletingStudent}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* 5. Official Receipt Print / PDF Modal */}
      <PaymentReceiptModal
        isOpen={!!printReceiptData}
        onClose={() => setPrintReceiptData(null)}
        payment={printReceiptData?.payment || null}
        student={printReceiptData?.student || null}
        schoolSettings={schoolSettings}
      />

      {/* 6. Modules Overview & Relational Architecture Modal */}
      <ModulesOverviewModal
        isOpen={isRelationsModalOpen}
        onClose={() => setIsRelationsModalOpen(false)}
      />
    </div>
  );
}
