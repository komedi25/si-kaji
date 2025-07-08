import { supabase } from '@/integrations/supabase/client';

// Comprehensive data seeder untuk demo realistis SMKN 1 Kendal
export const seedDemoData = async () => {
  try {
    console.log('Starting comprehensive data seeding...');

    // 1. Seed Master Data First
    await seedMasterData();
    
    // 2. Seed Users & Students
    await seedStudentsAndUsers();
    
    // 3. Seed Academic Data
    await seedAcademicData();
    
    // 4. Seed Activities & Cases
    await seedActivitiesAndCases();
    
    console.log('✅ Comprehensive demo data seeding completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    return false;
  }
};

// Seed master data (academic years, classes, violation types, etc.)
const seedMasterData = async () => {
  console.log('📚 Seeding master data...');
  
  // Academic Year
  const { data: academicYear } = await supabase
    .from('academic_years')
    .upsert({
      name: '2024/2025',
      year_start: 2024,
      year_end: 2025,
      is_active: true
    }, { onConflict: 'name', ignoreDuplicates: true })
    .select()
    .single();

  // Majors
  const majors = [
    { code: 'TKJ', name: 'Teknik Komputer dan Jaringan', description: 'Jurusan yang mempelajari teknologi komputer dan jaringan' },
    { code: 'RPL', name: 'Rekayasa Perangkat Lunak', description: 'Jurusan yang mempelajari pengembangan software' },
    { code: 'MM', name: 'Multimedia', description: 'Jurusan yang mempelajari desain grafis dan multimedia' }
  ];

  const { data: insertedMajors } = await supabase
    .from('majors')
    .upsert(majors, { onConflict: 'code', ignoreDuplicates: true })
    .select();

  // Classes
  const classes = [
    { name: 'X TKJ 1', grade: 10, major_id: insertedMajors?.[0]?.id, academic_year_id: academicYear?.id },
    { name: 'X RPL 1', grade: 10, major_id: insertedMajors?.[1]?.id, academic_year_id: academicYear?.id },
    { name: 'XI TKJ 1', grade: 11, major_id: insertedMajors?.[0]?.id, academic_year_id: academicYear?.id },
    { name: 'XI RPL 1', grade: 11, major_id: insertedMajors?.[1]?.id, academic_year_id: academicYear?.id },
    { name: 'XII MM 1', grade: 12, major_id: insertedMajors?.[2]?.id, academic_year_id: academicYear?.id }
  ];

  await supabase
    .from('classes')
    .upsert(classes, { onConflict: 'name', ignoreDuplicates: true });

  // Violation Types
  const violationTypes = [
    { name: 'Terlambat Masuk Sekolah', category: 'ringan', point_deduction: 5, description: 'Siswa terlambat masuk kelas' },
    { name: 'Tidak Memakai Seragam Lengkap', category: 'ringan', point_deduction: 10, description: 'Atribut seragam tidak lengkap' },
    { name: 'Bolos Tanpa Keterangan', category: 'sedang', point_deduction: 25, description: 'Tidak masuk sekolah tanpa izin' },
    { name: 'Merokok di Lingkungan Sekolah', category: 'berat', point_deduction: 50, description: 'Merokok di area sekolah' },
    { name: 'Berkelahi', category: 'berat', point_deduction: 75, description: 'Terlibat perkelahian dengan siswa lain' }
  ];

  await supabase
    .from('violation_types')
    .upsert(violationTypes, { onConflict: 'name', ignoreDuplicates: true });

  // Achievement Types
  const achievementTypes = [
    { name: 'Juara 1 Lomba Akademik Tingkat Sekolah', category: 'akademik', level: 'sekolah', point_reward: 20 },
    { name: 'Juara 1 Lomba Olahraga Tingkat Kota', category: 'olahraga', level: 'kota', point_reward: 40 },
    { name: 'Juara 1 Lomba Seni Tingkat Provinsi', category: 'seni', level: 'provinsi', point_reward: 60 },
    { name: 'Siswa Teladan Bulan Ini', category: 'karakter', level: 'sekolah', point_reward: 15 },
    { name: 'Volunteer Kegiatan Sosial', category: 'sosial', level: 'sekolah', point_reward: 10 }
  ];

  await supabase
    .from('achievement_types')
    .upsert(achievementTypes, { onConflict: 'name', ignoreDuplicates: true });

  // Extracurriculars
  const extracurriculars = [
    { name: 'Pramuka', description: 'Kegiatan kepanduan', category: 'wajib', max_participants: 50 },
    { name: 'Futsal', description: 'Olahraga futsal', category: 'olahraga', max_participants: 20 },
    { name: 'Robotika', description: 'Klub robotika dan programming', category: 'akademik', max_participants: 15 },
    { name: 'Band Sekolah', description: 'Grup musik sekolah', category: 'seni', max_participants: 10 },
    { name: 'English Club', description: 'Klub bahasa Inggris', category: 'akademik', max_participants: 25 }
  ];

  await supabase
    .from('extracurriculars')
    .upsert(extracurriculars, { onConflict: 'name', ignoreDuplicates: true });

  console.log('✅ Master data seeded successfully');
};

// Seed students and user accounts
const seedStudentsAndUsers = async () => {
  console.log('👥 Seeding students and users...');
  
  const students = [
    {
      nis: '2024001001',
      nisn: '1234567890',
      full_name: 'Ahmad Rizki Pratama',
      gender: 'male',
      birth_place: 'Kendal',
      birth_date: '2007-03-15',
      address: 'Jl. Pemuda No. 123, Kendal',
      phone: '081234567890',
      email: 'ahmad.rizki@smkn1kendal.sch.id',
      religion: 'Islam',
      status: 'active',
      parent_name: 'Budi Pratama',
      parent_phone: '081234567891',
      parent_address: 'Jl. Pemuda No. 123, Kendal'
    },
    {
      nis: '2024001002',
      nisn: '1234567891',
      full_name: 'Siti Nurhaliza',
      gender: 'female',
      birth_place: 'Kendal',
      birth_date: '2007-05-20',
      address: 'Jl. Sudirman No. 456, Kendal',
      phone: '081234567892',
      email: 'siti.nurhaliza@smkn1kendal.sch.id',
      religion: 'Islam',
      status: 'active',
      parent_name: 'Surono',
      parent_phone: '081234567893',
      parent_address: 'Jl. Sudirman No. 456, Kendal'
    },
    {
      nis: '2024001003',
      nisn: '1234567892',
      full_name: 'Budi Santoso',
      gender: 'male',
      birth_place: 'Semarang',
      birth_date: '2007-08-10',
      address: 'Jl. Diponegoro No. 789, Kendal',
      phone: '081234567894',
      email: 'budi.santoso@smkn1kendal.sch.id',
      religion: 'Islam',
      status: 'active',
      parent_name: 'Santoso',
      parent_phone: '081234567895',
      parent_address: 'Jl. Diponegoro No. 789, Kendal'
    },
    {
      nis: '2024001004',
      nisn: '1234567893',
      full_name: 'Dewi Kusuma Wardani',
      gender: 'female',
      birth_place: 'Kendal',
      birth_date: '2007-12-03',
      address: 'Jl. Gatot Subroto No. 321, Kendal',
      phone: '081234567896',
      email: 'dewi.kusuma@smkn1kendal.sch.id',
      religion: 'Islam',
      status: 'active',
      parent_name: 'Wardani',
      parent_phone: '081234567897',
      parent_address: 'Jl. Gatot Subroto No. 321, Kendal'
    },
    {
      nis: '2024001005',
      nisn: '1234567894',
      full_name: 'Fajar Ramadhan',
      gender: 'male',
      birth_place: 'Batang',
      birth_date: '2007-07-17',
      address: 'Jl. Ahmad Yani No. 654, Kendal',
      phone: '081234567898',
      email: 'fajar.ramadhan@smkn1kendal.sch.id',
      religion: 'Islam',
      status: 'active',
      parent_name: 'Ramadhan',
      parent_phone: '081234567899',
      parent_address: 'Jl. Ahmad Yani No. 654, Kendal'
    }
  ];

  // Insert students
  const { data: insertedStudents } = await supabase
    .from('students')
    .upsert(students, { onConflict: 'nis', ignoreDuplicates: true })
    .select();

  console.log('✅ Students seeded successfully');
  return insertedStudents;
};

// Seed academic data (enrollments, violations, achievements)
const seedAcademicData = async () => {
  console.log('📖 Seeding academic data...');
  
  const { data: students } = await supabase.from('students').select('id').limit(5);
  const { data: classes } = await supabase.from('classes').select('id').limit(3);
  const { data: violationTypes } = await supabase.from('violation_types').select('id').limit(3);
  const { data: achievementTypes } = await supabase.from('achievement_types').select('id').limit(3);

  if (!students || !classes || !violationTypes || !achievementTypes) {
    console.log('Required data not available for academic seeding');
    return;
  }

  // Create student enrollments
  const enrollments = students.slice(0, 3).map((student, index) => ({
    student_id: student.id,
    class_id: classes[index % classes.length].id,
    enrollment_date: '2024-07-15',
    status: 'active'
  }));

  await supabase
    .from('student_enrollments')
    .upsert(enrollments, { onConflict: 'student_id,class_id', ignoreDuplicates: true });

  // Create sample violations
  const violations = [
    {
      student_id: students[0].id,
      violation_type_id: violationTypes[0].id,
      violation_date: '2024-11-01',
      description: 'Terlambat masuk kelas pagi',
      point_deduction: 5
    },
    {
      student_id: students[1].id,
      violation_type_id: violationTypes[1].id,
      violation_date: '2024-11-02',
      description: 'Tidak menggunakan seragam lengkap',
      point_deduction: 10
    }
  ];

  await supabase
    .from('student_violations')
    .upsert(violations, { ignoreDuplicates: true });

  // Create sample achievements
  const achievements = [
    {
      student_id: students[2].id,
      achievement_type_id: achievementTypes[0].id,
      achievement_date: '2024-10-15',
      description: 'Juara 1 Lomba Programming tingkat sekolah',
      point_reward: 30,
      status: 'verified'
    }
  ];

  await supabase
    .from('student_achievements')
    .upsert(achievements, { ignoreDuplicates: true });

  console.log('✅ Academic data seeded successfully');
};

// Seed activities and cases
const seedActivitiesAndCases = async () => {
  console.log('🏃 Seeding activities and cases...');
  
  const { data: students } = await supabase.from('students').select('id').limit(3);
  
  if (!students) return;

  // Create sample cases
  const cases = [
    {
      case_number: 'CASE/2024/0001',
      title: 'Laporan Perundungan di Kelas X TKJ 1',
      category: 'bullying' as any,
      priority: 'high' as any,
      description: 'Ada siswa yang mengalami perundungan verbal dari teman sekelasnya',
      reported_student_id: students[0].id,
      incident_date: '2024-11-10',
      incident_location: 'Ruang Kelas X TKJ 1',
      reporter_name: 'Anonim',
      is_anonymous: true
    }
  ];

  await supabase
    .from('student_cases')
    .upsert(cases, { ignoreDuplicates: true });

  // Create sample permits
  const permits = [
    {
      student_id: students[1].id,
      permit_type: 'sakit',
      reason: 'Demam dan flu',
      start_date: '2024-11-12',
      end_date: '2024-11-13',
      status: 'approved'
    }
  ];

  await supabase
    .from('student_permits')
    .upsert(permits, { ignoreDuplicates: true });

  console.log('✅ Activities and cases seeded successfully');
};

// Function to check if demo data exists
export const checkDemoDataExists = async () => {
  const { data: students } = await supabase
    .from('students')
    .select('id')
    .limit(1);
  
  return students && students.length > 0;
};

// Create error boundary component
export const createErrorBoundaryHandler = () => {
  return {
    componentDidCatch: (error: Error, errorInfo: any) => {
      console.error('Error boundary caught:', error, errorInfo);
      // Log to Supabase if needed
      supabase.rpc('log_error', {
        p_user_id: 'system',
        p_error_type: 'component_error',
        p_error_message: error.message,
        p_error_stack: error.stack,
        p_page_url: window.location.href
      });
    }
  };
};