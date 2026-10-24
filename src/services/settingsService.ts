import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SchoolSettings, ActivityLog, AppUser, Student, PaymentRecord } from '../types/student';

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'SMK Negeri 1 Pembangunan',
  npsn: '20108392',
  educationLevel: 'Sekolah Menengah Kejuruan (SMK)',
  address: 'Jl. Pendidikan No. 45, Kebayoran Baru, Kota Jakarta Selatan, DKI Jakarta 12150',
  phone: '(021) 7890-1234 / 0812-3456-7890',
  email: 'tatausaha@smkn1pembangunan.sch.id',
  website: 'https://smkn1pembangunan.sch.id',
  principalName: 'Drs. H. Mulyadi, M.M.',
  principalNip: '19680514 199303 1 004',
  treasurerName: 'Siti Rahmawati, S.E.',
  treasurerNip: '19820719 200604 2 011',
  activeAcademicYear: '2024/2025',
  dueDay: 10,
  currentBillingMonth: 'Oktober',
  receiptPrefix: 'SPP',
  receiptFooterNote: 'Bukti pembayaran sah tercetak otomatis dari Sistem Informasi SPP Sekolah. Harap disimpan dengan baik.',
  gradeRates: {
    X: 250000,
    XI: 250000,
    XII: 275000,
  },
  users: [
    {
      id: 'usr_admin_01',
      name: 'Ahmad Fauzi, S.Kom',
      email: 'admin.fauzi@smkn1pembangunan.sch.id',
      role: 'admin',
      title: 'Administrator SIM & IT',
      phone: '0812-9876-5432',
      status: 'aktif',
    },
    {
      id: 'usr_kasir_02',
      name: 'Siti Rahmawati, S.E.',
      email: 'bendahara.siti@smkn1pembangunan.sch.id',
      role: 'petugas',
      title: 'Bendahara / Kasir Tata Usaha',
      phone: '0813-1122-3344',
      status: 'aktif',
    },
    {
      id: 'usr_kepsek_03',
      name: 'Drs. H. Mulyadi, M.M.',
      email: 'kepsek.mulyadi@smkn1pembangunan.sch.id',
      role: 'kepala_sekolah',
      title: 'Kepala Sekolah',
      phone: '0811-5566-7788',
      status: 'aktif',
    },
  ],
};

const SETTINGS_DOC_ID = 'general';

/**
 * Fetch or initialize school settings in Firestore
 */
export async function getSchoolSettings(): Promise<SchoolSettings> {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as SchoolSettings;
    }
    // Initialize default if not present
    await setDoc(docRef, {
      ...DEFAULT_SCHOOL_SETTINGS,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Sistem Inisialisasi',
    });
    return { id: SETTINGS_DOC_ID, ...DEFAULT_SCHOOL_SETTINGS };
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, `settings/${SETTINGS_DOC_ID}`);
  }
}

/**
 * Real-time listener for school settings
 */
export function subscribeSchoolSettings(
  callback: (settings: SchoolSettings) => void,
  onError?: (err: any) => void
) {
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as SchoolSettings);
      } else {
        // Auto initialize
        getSchoolSettings().then(callback).catch(onError);
      }
    },
    (err) => {
      console.error('Subscription settings error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Update school settings and record audit log
 */
export async function updateSchoolSettings(
  data: Partial<SchoolSettings>,
  actorUser?: { name: string; role: any }
): Promise<void> {
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const payload: Record<string, any> = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: actorUser?.name || 'Administrator',
    };

    // Clean undefined fields to avoid Firestore error
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) {
        payload[key] = null;
      }
    });

    await setDoc(docRef, payload, { merge: true });

    // Log this action
    await addActivityLog({
      action: 'Pembaruan Pengaturan',
      module: 'Pengaturan',
      details: 'Pengaturan identitas sekolah, tarif SPP, atau format sistem telah diperbarui.',
      userName: actorUser?.name || 'Administrator',
      userRole: actorUser?.role || 'admin',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `settings/${SETTINGS_DOC_ID}`);
  }
}

/**
 * Record user activity log in Firestore
 */
export async function addActivityLog(log: {
  action: string;
  module: 'Siswa' | 'Pembayaran' | 'Tunggakan & Laporan' | 'Pengaturan' | 'Sistem';
  details: string;
  userName: string;
  userRole: any;
}): Promise<void> {
  try {
    const colRef = collection(db, 'activity_logs');
    await addDoc(colRef, {
      ...log,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Gagal mencatat log aktivitas:', err);
  }
}

/**
 * Subscribe to recent activity logs (up to 50 latest)
 */
export function subscribeActivityLogs(
  callback: (logs: ActivityLog[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, 'activity_logs');
  const q = query(colRef, orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as ActivityLog[];
      callback(logs);
    },
    (err) => {
      console.error('Activity logs subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Backup entire database (Students, Payments, Settings, Activity Logs) to a JSON string
 */
export async function generateFullDatabaseBackup(): Promise<string> {
  try {
    // 1. Settings
    const settingsSnap = await getDoc(doc(db, 'settings', SETTINGS_DOC_ID));
    const settings = settingsSnap.exists() ? settingsSnap.data() : DEFAULT_SCHOOL_SETTINGS;

    // 2. Students
    const studentsSnap = await getDocs(collection(db, 'students'));
    const students = studentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // 3. Payments
    const paymentsSnap = await getDocs(collection(db, 'payments'));
    const payments = paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const backupPayload = {
      exportMeta: {
        application: 'SIM SPP Sekolah Terpadu',
        backupVersion: '1.0.0',
        exportedAt: new Date().toISOString(),
        totalStudents: students.length,
        totalPayments: payments.length,
      },
      settings,
      students,
      payments,
    };

    return JSON.stringify(backupPayload, null, 2);
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, 'backup');
  }
}

/**
 * Restore database from uploaded JSON payload
 */
export async function restoreDatabaseFromJson(
  jsonData: any,
  actorUser?: { name: string; role: any }
): Promise<{ studentsRestored: number; paymentsRestored: number }> {
  try {
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Format berkas JSON cadangan tidak valid.');
    }

    const { students = [], payments = [], settings } = jsonData;

    // 1. Restore settings if provided
    if (settings) {
      const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
      await setDoc(docRef, {
        ...settings,
        updatedAt: new Date().toISOString(),
        updatedBy: `Restore oleh ${actorUser?.name || 'Administrator'}`,
      }, { merge: true });
    }

    // 2. Restore Students in batch
    let studentsRestored = 0;
    if (Array.isArray(students) && students.length > 0) {
      const batch = writeBatch(db);
      for (const s of students) {
        if (!s.id || !s.nis || !s.fullName) continue;
        const ref = doc(db, 'students', s.id);
        const sPayload = { ...s };
        Object.keys(sPayload).forEach((k) => {
          if (sPayload[k] === undefined) sPayload[k] = null;
        });
        batch.set(ref, sPayload, { merge: true });
        studentsRestored++;
      }
      await batch.commit();
    }

    // 3. Restore Payments in batch
    let paymentsRestored = 0;
    if (Array.isArray(payments) && payments.length > 0) {
      const batch = writeBatch(db);
      for (const p of payments) {
        if (!p.id || !p.studentId || !p.receiptNumber) continue;
        const ref = doc(db, 'payments', p.id);
        const pPayload = { ...p };
        Object.keys(pPayload).forEach((k) => {
          if (pPayload[k] === undefined) pPayload[k] = null;
        });
        batch.set(ref, pPayload, { merge: true });
        paymentsRestored++;
      }
      await batch.commit();
    }

    // 4. Log the restore activity
    await addActivityLog({
      action: 'Pemulihan Database (Restore)',
      module: 'Sistem',
      details: `Database berhasil dipulihkan: ${studentsRestored} siswa, ${paymentsRestored} transaksi pembayaran.`,
      userName: actorUser?.name || 'Administrator',
      userRole: actorUser?.role || 'admin',
    });

    return { studentsRestored, paymentsRestored };
  } catch (error) {
    return handleFirestoreError(error, OperationType.WRITE, 'restore');
  }
}

/**
 * Bulk sync default grade rates to existing students
 */
export async function applyGradeRatesToStudents(
  gradeRates: { X: number; XI: number; XII: number; [key: string]: number },
  actorUser?: { name: string; role: any }
): Promise<number> {
  try {
    const studentsSnap = await getDocs(collection(db, 'students'));
    const batch = writeBatch(db);
    let count = 0;

    for (const d of studentsSnap.docs) {
      const data = d.data() as Student;
      const gradeClass = (data.gradeClass || '').toUpperCase();
      let newNominal: number | null = null;

      if (gradeClass.startsWith('X-') || gradeClass.startsWith('X ') || gradeClass === 'X') {
        newNominal = gradeRates.X;
      } else if (gradeClass.startsWith('XI-') || gradeClass.startsWith('XI ') || gradeClass === 'XI') {
        newNominal = gradeRates.XI;
      } else if (gradeClass.startsWith('XII-') || gradeClass.startsWith('XII ') || gradeClass === 'XII') {
        newNominal = gradeRates.XII;
      }

      if (newNominal !== null && newNominal !== data.monthlySppNominal) {
        batch.update(doc(db, 'students', d.id), {
          monthlySppNominal: newNominal,
          updatedAt: new Date().toISOString(),
        });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
      await addActivityLog({
        action: 'Sinkronisasi Tarif SPP Massal',
        module: 'Pengaturan',
        details: `Berhasil menyinkronkan tarif SPP baru ke ${count} data siswa berdasarkan tingkat kelas.`,
        userName: actorUser?.name || 'Administrator',
        userRole: actorUser?.role || 'admin',
      });
    }

    return count;
  } catch (error) {
    return handleFirestoreError(error, OperationType.UPDATE, 'students-bulk-rate');
  }
}
