
import { supabase } from '@/integrations/supabase/client';

// Utility untuk seed data demo yang realistis
export const seedDemoData = async () => {
  try {
    console.log('Starting data seeding...');

    // Insert sample students dengan data realistis SMKN 1 Kendal
    const sampleStudents = [
      {
        nis: '2024001001',
        nisn: '1234567890',
        full_name: 'Ahmad Rizki Pratama',
        gender: 'male',
        birth_place: 'Kendal',
        birth_date: '2007-03-15',
        address: 'Jl. Pemuda No. 123, Kendal',
        phone: '081234567890',
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
        religion: 'Islam',
        status: 'active',
        parent_name: 'Santoso',
        parent_phone: '081234567895',
        parent_address: 'Jl. Diponegoro No. 789, Kendal'
      }
    ];

    // Insert students
    const { data: insertedStudents, error: studentsError } = await supabase
      .from('students')
      .upsert(sampleStudents, { onConflict: 'nis', ignoreDuplicates: true })
      .select();

    if (studentsError) {
      console.error('Error inserting students:', studentsError);
      return;
    }

    console.log('Students inserted:', insertedStudents?.length);

    // Get class and violation/achievement type IDs
    const { data: classes } = await supabase.from('classes').select('id').limit(3);
    const { data: violationTypes } = await supabase.from('violation_types').select('id').limit(3);
    const { data: achievementTypes } = await supabase.from('achievement_types').select('id').limit(3);

    if (!classes || !violationTypes || !achievementTypes || !insertedStudents) {
      console.log('Required data not available for seeding');
      return;
    }

    // Create student enrollments
    const enrollments = insertedStudents.slice(0, 3).map((student, index) => ({
      student_id: student.id,
      class_id: classes[index % classes.length].id,
      enrollment_date: '2024-07-15',
      status: 'active'
    }));

    const { error: enrollmentError } = await supabase
      .from('student_enrollments')
      .upsert(enrollments, { onConflict: 'student_id,class_id', ignoreDuplicates: true });

    if (enrollmentError) {
      console.error('Error creating enrollments:', enrollmentError);
    }

    // Create sample violations
    const violations = [
      {
        student_id: insertedStudents[0].id,
        violation_type_id: violationTypes[0].id,
        violation_date: '2024-11-01',
        description: 'Terlambat masuk kelas pagi',
        point_deduction: 5
      },
      {
        student_id: insertedStudents[1].id,
        violation_type_id: violationTypes[1].id,
        violation_date: '2024-11-02',
        description: 'Tidak menggunakan seragam lengkap',
        point_deduction: 10
      }
    ];

    const { error: violationsError } = await supabase
      .from('student_violations')
      .upsert(violations, { ignoreDuplicates: true });

    if (violationsError) {
      console.error('Error creating violations:', violationsError);
    }

    // Create sample achievements
    const achievements = [
      {
        student_id: insertedStudents[2].id,
        achievement_type_id: achievementTypes[0].id,
        achievement_date: '2024-10-15',
        description: 'Juara 1 Lomba Programming tingkat sekolah',
        point_reward: 30,
        status: 'verified'
      }
    ];

    const { error: achievementsError } = await supabase
      .from('student_achievements')
      .upsert(achievements, { ignoreDuplicates: true });

    if (achievementsError) {
      console.error('Error creating achievements:', achievementsError);
    }

    console.log('Demo data seeding completed successfully!');
    return true;

  } catch (error) {
    console.error('Error seeding demo data:', error);
    return false;
  }
};

// Function to check if demo data exists
export const checkDemoDataExists = async () => {
  const { data: students } = await supabase
    .from('students')
    .select('id')
    .limit(1);
  
  return students && students.length > 0;
};
