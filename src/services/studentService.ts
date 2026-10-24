import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Student } from '../types/student';

const COLLECTION_NAME = 'students';

export function subscribeStudents(
  onSuccess: (students: Student[]) => void,
  onError?: (error: Error) => void
) {
  const studentsRef = collection(db, COLLECTION_NAME);
  return onSnapshot(
    studentsRef,
    (snapshot) => {
      const list: Student[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          nis: data.nis || '',
          nisn: data.nisn || '',
          fullName: data.fullName || '',
          gender: data.gender || 'L',
          gradeClass: data.gradeClass || '',
          major: data.major || undefined,
          academicYear: data.academicYear || '2024/2025',
          monthlySppNominal: Number(data.monthlySppNominal) || 0,
          address: data.address || '',
          parentName: data.parentName || '',
          phone: data.phone || '',
          status: data.status || 'aktif',
          notes: data.notes || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        } as Student;
      });

      // Sort by gradeClass then fullName
      list.sort((a, b) => {
        if (a.gradeClass === b.gradeClass) {
          return a.fullName.localeCompare(b.fullName, 'id');
        }
        return a.gradeClass.localeCompare(b.gradeClass, 'id');
      });

      onSuccess(list);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      } catch (e: any) {
        if (onError) onError(e);
      }
    }
  );
}

export async function checkNisExists(nis: string, excludeId?: string): Promise<boolean> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('nis', '==', nis.trim()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;
    if (!excludeId) return true;
    return snapshot.docs.some((docSnap) => docSnap.id !== excludeId);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
  }
}

export async function addStudent(student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const isDuplicate = await checkNisExists(student.nis);
  if (isDuplicate) {
    throw new Error(`NIS "${student.nis}" sudah terdaftar pada siswa lain. Gunakan NIS yang unik.`);
  }

  const now = new Date().toISOString();
  try {
    const payload: Record<string, any> = {
      nis: student.nis.trim(),
      nisn: (student.nisn || '').trim(),
      fullName: student.fullName.trim(),
      gender: student.gender || 'L',
      gradeClass: student.gradeClass.trim(),
      academicYear: student.academicYear || '2024/2025',
      monthlySppNominal: Number(student.monthlySppNominal) || 0,
      address: (student.address || '').trim(),
      parentName: (student.parentName || '').trim(),
      phone: (student.phone || '').trim(),
      status: student.status || 'aktif',
      notes: (student.notes || '').trim(),
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), payload);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, COLLECTION_NAME);
  }
}

export async function updateStudent(
  id: string,
  student: Partial<Omit<Student, 'id' | 'createdAt'>>
): Promise<void> {
  if (student.nis) {
    const isDuplicate = await checkNisExists(student.nis, id);
    if (isDuplicate) {
      throw new Error(`NIS "${student.nis}" sudah digunakan oleh siswa lain.`);
    }
  }

  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const cleanUpdate: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };
    if (student.nis !== undefined) cleanUpdate.nis = student.nis.trim();
    if (student.nisn !== undefined) cleanUpdate.nisn = (student.nisn || '').trim();
    if (student.fullName !== undefined) cleanUpdate.fullName = student.fullName.trim();
    if (student.gender !== undefined) cleanUpdate.gender = student.gender;
    if (student.gradeClass !== undefined) cleanUpdate.gradeClass = student.gradeClass.trim();
    if (student.academicYear !== undefined) cleanUpdate.academicYear = student.academicYear;
    if (student.monthlySppNominal !== undefined) cleanUpdate.monthlySppNominal = Number(student.monthlySppNominal);
    if (student.address !== undefined) cleanUpdate.address = (student.address || '').trim();
    if (student.parentName !== undefined) cleanUpdate.parentName = (student.parentName || '').trim();
    if (student.phone !== undefined) cleanUpdate.phone = (student.phone || '').trim();
    if (student.status !== undefined) cleanUpdate.status = student.status;
    if (student.notes !== undefined) cleanUpdate.notes = (student.notes || '').trim();

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, cleanUpdate);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteStudent(id: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);

    // Also delete or cascade associated payments for cleanliness
    const paymentsQ = query(collection(db, 'payments'), where('studentId', '==', id));
    const paymentSnaps = await getDocs(paymentsQ);
    if (!paymentSnaps.empty) {
      const batch = writeBatch(db);
      paymentSnaps.forEach((pDoc) => {
        batch.delete(pDoc.ref);
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function bulkAddStudents(
  students: Array<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{ added: number; failed: number; skippedNis: string[] }> {
  let added = 0;
  let failed = 0;
  const skippedNis: string[] = [];

  for (const s of students) {
    try {
      const exists = await checkNisExists(s.nis);
      if (exists) {
        failed++;
        skippedNis.push(s.nis);
        continue;
      }
      await addStudent(s);
      added++;
    } catch {
      failed++;
      skippedNis.push(s.nis);
    }
  }

  return { added, failed, skippedNis };
}

export const INITIAL_STUDENTS_SEED: Array<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    nis: '20241001',
    nisn: '0081234501',
    fullName: 'Muhammad Rizky Pratama',
    gender: 'L',
    gradeClass: 'X-A',
    academicYear: '2024/2025',
    monthlySppNominal: 350000,
    address: 'Jl. Merdeka No. 42, RT 02/04, Coblong, Kota Bandung',
    parentName: 'H. Bambang Irawan',
    phone: '081234567801',
    status: 'aktif',
    notes: 'Ketua Kelas X-A',
  },
  {
    nis: '20241002',
    nisn: '0081234502',
    fullName: 'Annisa Putri Cahyani',
    gender: 'P',
    gradeClass: 'X-A',
    academicYear: '2024/2025',
    monthlySppNominal: 350000,
    address: 'Jl. Sukajadi No. 115, Sukasari, Kota Bandung',
    parentName: 'Drs. Agus Suryana',
    phone: '081234567802',
    status: 'aktif',
    notes: 'Anggota OSIS',
  },
  {
    nis: '20241003',
    nisn: '0081234503',
    fullName: 'Fajar Nugraha',
    gender: 'L',
    gradeClass: 'X-B',
    academicYear: '2024/2025',
    monthlySppNominal: 300000,
    address: 'Komplek Permata Buah Batu Blok D3 No. 12',
    parentName: 'Rudi Hartono',
    phone: '081234567803',
    status: 'aktif',
    notes: '',
  },
  {
    nis: '20241004',
    nisn: '0081234504',
    fullName: 'Dewi Lestari Kusuma',
    gender: 'P',
    gradeClass: 'X-C',
    academicYear: '2024/2025',
    monthlySppNominal: 300000,
    address: 'Jl. Cihampelas No. 88B, Bandung',
    parentName: 'Sri Wahyuni, S.E.',
    phone: '081234567804',
    status: 'aktif',
    notes: 'Penerima KIP (Kartu Indonesia Pintar)',
  },
  {
    nis: '20231015',
    nisn: '0071234515',
    fullName: 'Bagas Aditya Putra',
    gender: 'L',
    gradeClass: 'XI-A',
    academicYear: '2023/2024',
    monthlySppNominal: 350000,
    address: 'Jl. Riau No. 50, Bandung Wetan',
    parentName: 'Hendrawan',
    phone: '081234567805',
    status: 'aktif',
    notes: '',
  },
  {
    nis: '20231022',
    nisn: '0071234522',
    fullName: 'Nabila Syakieb Maharani',
    gender: 'P',
    gradeClass: 'XI-B',
    academicYear: '2023/2024',
    monthlySppNominal: 300000,
    address: 'Jl. Buah Batu Raya No. 201, Bandung',
    parentName: 'Dedi Mulyadi',
    phone: '081234567806',
    status: 'aktif',
    notes: '',
  },
  {
    nis: '20221008',
    nisn: '0061234508',
    fullName: 'Kevin Sanjaya Wijaya',
    gender: 'L',
    gradeClass: 'XII-A',
    academicYear: '2022/2023',
    monthlySppNominal: 320000,
    address: 'Jl. Dago Asri No. 17, Coblong, Bandung',
    parentName: 'Hendra Wijaya',
    phone: '081234567807',
    status: 'aktif',
    notes: 'Persiapan Ujian Akhir Sekolah',
  },
  {
    nis: '20221030',
    nisn: '0061234530',
    fullName: 'Tiara Andini Putri',
    gender: 'P',
    gradeClass: 'XII-B',
    academicYear: '2022/2023',
    monthlySppNominal: 320000,
    address: 'Jl. Cibaduyut Lama No. 94, Bojongloa Kidul',
    parentName: 'H. Anwar Sadat',
    phone: '081234567808',
    status: 'tidak_aktif',
    notes: 'Pindah domisili mengikuti dinas orang tua per semester genap',
  },
];

export async function seedSampleStudentsIfEmpty(): Promise<boolean> {
  try {
    const studentsRef = collection(db, COLLECTION_NAME);
    const snap = await getDocs(studentsRef);
    if (!snap.empty) {
      return false; // Already has data
    }

    for (const student of INITIAL_STUDENTS_SEED) {
      await addStudent(student);
    }
    return true;
  } catch (err) {
    console.error('Error seeding sample students:', err);
    return false;
  }
}
