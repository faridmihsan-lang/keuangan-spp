import * as XLSX from 'xlsx';
import { Student, ImportPreviewItem, Gender, StudentStatus } from '../types/student';

export function exportStudentsToExcel(students: Student[], filename = 'Data_Siswa_SPP.xlsx') {
  const data = students.map((s, index) => ({
    'No': index + 1,
    'NIS': s.nis,
    'NISN': s.nisn || '',
    'Nama Lengkap': s.fullName,
    'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
    'Kelas': s.gradeClass,
    'Tahun Ajaran': s.academicYear,
    'Nominal SPP (Rp)': s.monthlySppNominal,
    'Status Siswa': s.status === 'aktif' ? 'Aktif' : 'Tidak Aktif',
    'Nama Orang Tua / Wali': s.parentName || '',
    'Nomor HP / WhatsApp': s.phone || '',
    'Alamat Lengkap': s.address || '',
    'Catatan': s.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 14 }, // NIS
    { wch: 16 }, // NISN
    { wch: 28 }, // Nama
    { wch: 14 }, // JK
    { wch: 14 }, // Kelas
    { wch: 14 }, // Thn Ajaran
    { wch: 18 }, // SPP
    { wch: 14 }, // Status
    { wch: 24 }, // Wali
    { wch: 18 }, // No HP
    { wch: 35 }, // Alamat
    { wch: 20 }, // Catatan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');
  XLSX.writeFile(workbook, filename);
}

export function downloadStudentTemplate() {
  const sampleData = [
    {
      'NIS': '20241001',
      'NISN': '0081234567',
      'Nama Lengkap': 'Ahmad Fauzi Pratama',
      'Jenis Kelamin': 'L',
      'Kelas': 'X-A',
      'Tahun Ajaran': '2024/2025',
      'Nominal SPP': 350000,
      'Status': 'Aktif',
      'Nama Orang Tua / Wali': 'Bambang Supriyadi',
      'No HP': '081234567890',
      'Alamat': 'Jl. Merdeka No. 45, RT 02/05, Bandung',
      'Catatan': 'Penerima KIP (Kartu Indonesia Pintar)',
    },
    {
      'NIS': '20241002',
      'NISN': '0089876543',
      'Nama Lengkap': 'Siti Nur Aisyah',
      'Jenis Kelamin': 'P',
      'Kelas': 'X-A',
      'Tahun Ajaran': '2024/2025',
      'Nominal SPP': 350000,
      'Status': 'Aktif',
      'Nama Orang Tua / Wali': 'H. Muhammad Yusuf',
      'No HP': '085712345678',
      'Alamat': 'Jl. Melati No. 12, Sukajadi, Bandung',
      'Catatan': '',
    },
    {
      'NIS': '20241003',
      'NISN': '0085432198',
      'Nama Lengkap': 'Dimas Anggara',
      'Jenis Kelamin': 'L',
      'Kelas': 'X-B',
      'Tahun Ajaran': '2024/2025',
      'Nominal SPP': 300000,
      'Status': 'Aktif',
      'Nama Orang Tua / Wali': 'Surya Darmawan',
      'No HP': '082199887766',
      'Alamat': 'Komplek Permata Indah Blok C3 No. 8',
      'Catatan': '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 24 },
    { wch: 18 },
    { wch: 35 },
    { wch: 25 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa');
  XLSX.writeFile(workbook, 'Template_Import_Siswa_SPP.xlsx');
}

export async function parseExcelStudentFile(
  file: File,
  existingNisList: Set<string>
): Promise<ImportPreviewItem[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const seenInFileNis = new Set<string>();
  const previewItems: ImportPreviewItem[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const errors: string[] = [];

    // Helper to find value from possible key synonyms
    const findVal = (...keys: string[]) => {
      for (const k of keys) {
        for (const rowKey of Object.keys(row)) {
          if (rowKey.trim().toLowerCase() === k.trim().toLowerCase()) {
            return String(row[rowKey]).trim();
          }
        }
      }
      return '';
    };

    const nis = findVal('nis', 'nomor induk siswa', 'no induk');
    const nisn = findVal('nisn', 'nomor induk siswa nasional');
    const fullName = findVal('nama lengkap', 'nama', 'nama siswa');
    const genderRaw = findVal('jenis kelamin', 'jk', 'gender');
    const gradeClass = findVal('kelas', 'tingkat', 'rombel');
    const academicYear = findVal('tahun ajaran', 'tahun ajaran pendaftaran', 'thn ajaran');
    const sppRaw = findVal('nominal spp', 'spp bulanan', 'nominal spp (rp)', 'spp');
    const statusRaw = findVal('status', 'status siswa', 'keaktifan');
    const parentName = findVal('nama orang tua / wali', 'orang tua', 'wali', 'nama wali', 'nama orang tua');
    const phone = findVal('nomor hp / whatsapp', 'no hp', 'nomor hp', 'telepon', 'whatsapp', 'kontak');
    const address = findVal('alamat lengkap', 'alamat');
    const notes = findVal('catatan', 'keterangan');

    // Validation
    if (!nis) {
      errors.push('NIS wajib diisi');
    } else {
      if (seenInFileNis.has(nis)) {
        errors.push(`NIS '${nis}' duplikat di dalam file Excel ini`);
      } else {
        seenInFileNis.add(nis);
      }
      if (existingNisList.has(nis)) {
        errors.push(`NIS '${nis}' sudah terdaftar pada sistem`);
      }
    }

    if (!fullName) {
      errors.push('Nama lengkap wajib diisi');
    }

    if (!gradeClass) {
      errors.push('Kelas wajib diisi');
    }

    // Gender normalize
    let gender: Gender = 'L';
    const gLower = genderRaw.toLowerCase();
    if (gLower.startsWith('p') || gLower.includes('perempuan') || gLower.includes('wanita')) {
      gender = 'P';
    } else if (gLower.startsWith('l') || gLower.includes('laki') || gLower.includes('pria')) {
      gender = 'L';
    } else if (genderRaw) {
      errors.push("Jenis kelamin harus 'L' atau 'P'");
    }

    // Parse SPP nominal
    let sppNominal = 0;
    if (sppRaw) {
      const cleanNum = sppRaw.replace(/[^0-9]/g, '');
      sppNominal = parseInt(cleanNum, 10) || 0;
    }
    if (sppNominal <= 0) {
      sppNominal = 300000; // default nominal jika kosong
    }

    // Parse status
    let status: StudentStatus = 'aktif';
    const sLower = statusRaw.toLowerCase();
    if (sLower.includes('tidak') || sLower.includes('non') || sLower.includes('keluar') || sLower.includes('lulus')) {
      status = 'tidak_aktif';
    }

    const itemData: Partial<Student> = {
      nis,
      nisn: nisn || '',
      fullName,
      gender,
      gradeClass: gradeClass || 'X-A',
      academicYear: academicYear || '2024/2025',
      monthlySppNominal: sppNominal,
      status,
      parentName,
      phone,
      address,
      notes,
    };

    previewItems.push({
      isValid: errors.length === 0,
      errors,
      data: itemData,
    });
  }

  return previewItems;
}
