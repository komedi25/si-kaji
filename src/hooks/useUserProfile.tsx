
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  role: string;
  student_id: string | null;
  teacher_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentData {
  id: string;
  user_id: string | null;
  nis: string;
  nisn: string | null;
  full_name: string;
  gender: 'L' | 'P';
  birth_place: string | null;
  birth_date: string | null;
  religion: string | null;
  address: string | null;
  phone: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_address: string | null;
  admission_date: string;
  graduation_date: string | null;
  status: 'active' | 'graduated' | 'transferred' | 'dropped';
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  email?: string | null;
}

// Helper function to create student data
const createStudentData = (rawStudent: any): StudentData => {
  return {
    id: rawStudent.id,
    user_id: rawStudent.user_id,
    nis: rawStudent.nis,
    nisn: rawStudent.nisn,
    full_name: rawStudent.full_name,
    gender: rawStudent.gender === 'P' ? 'P' : 'L',
    birth_place: rawStudent.birth_place,
    birth_date: rawStudent.birth_date,
    religion: rawStudent.religion,
    address: rawStudent.address,
    phone: rawStudent.phone,
    parent_name: rawStudent.parent_name,
    parent_phone: rawStudent.parent_phone,
    parent_address: rawStudent.parent_address,
    admission_date: rawStudent.admission_date,
    graduation_date: rawStudent.graduation_date,
    status: rawStudent.status,
    photo_url: rawStudent.photo_url,
    created_at: rawStudent.created_at,
    updated_at: rawStudent.updated_at,
    email: rawStudent.email
  };
};

// Helper function to create profile
const createProfile = async (userId: string, email: string) => {
  const profileData = {
    id: userId,
    role: 'siswa',
    full_name: email || 'Unknown User',
    student_id: null,
    teacher_id: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Helper function to find student by email
const findStudentByEmail = async (email: string) => {
  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  
  return data;
};

// Helper function to create new student
const createNewStudent = async (userId: string, fullName: string, email: string) => {
  const studentData = {
    user_id: userId,
    full_name: fullName || 'Siswa Baru',
    nis: `AUTO${Date.now()}`,
    gender: 'L' as const,
    status: 'active' as const,
    admission_date: new Date().toISOString().split('T')[0],
    email: email
  };

  const { data, error } = await supabase
    .from('students')
    .insert(studentData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Helper function to link profile to student
const linkProfileToStudent = async (profileId: string, studentId: string) => {
  await supabase
    .from('profiles')
    .update({ student_id: studentId })
    .eq('id', profileId);
};

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    await fetchData();
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
        setIsLoading(false);
        return;
      }

      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);

      // 2. Get profile data from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      let currentProfile: UserProfile;

      if (profileError) {
        console.error('Profile error:', profileError);
        
        // If profile doesn't exist, try to create one
        if (profileError.code === 'PGRST116') {
          try {
            const newProfile = await createProfile(currentUser.id, currentUser.email || '');
            currentProfile = newProfile as UserProfile;
          } catch (createError) {
            setError('Gagal membuat profil. Hubungi admin untuk bantuan.');
            setIsLoading(false);
            return;
          }
        } else {
          setError('Profil tidak ditemukan. Hubungi admin untuk bantuan.');
          setIsLoading(false);
          return;
        }
      } else {
        currentProfile = profileData as UserProfile;
      }

      setProfile(currentProfile);

      // 3. If role is 'siswa', get or create student data
      if (currentProfile.role === 'siswa') {
        await handleStudentData(currentUser, currentProfile);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  const handleStudentData = async (currentUser: User, currentProfile: UserProfile) => {
    let studentDetails = null;

    // Try to get existing student data if linked
    if (currentProfile.student_id) {
      const { data: existingStudent } = await supabase
        .from('students')
        .select('*')
        .eq('id', currentProfile.student_id)
        .maybeSingle();

      if (existingStudent) {
        studentDetails = existingStudent;
      }
    }

    // If no student data found, try to find by email or create new one
    if (!studentDetails && currentUser.email) {
      // Try to find student by email
      const studentByEmail = await findStudentByEmail(currentUser.email);

      if (studentByEmail) {
        // Link existing student to profile
        await linkProfileToStudent(currentUser.id, studentByEmail.id);
        studentDetails = studentByEmail;
      } else {
        // Create new student record
        try {
          const newStudent = await createNewStudent(
            currentUser.id,
            currentProfile.full_name || currentUser.email || '',
            currentUser.email
          );
          
          // Link new student to profile
          await linkProfileToStudent(currentUser.id, newStudent.id);
          studentDetails = newStudent;
        } catch (createStudentError) {
          console.error('Error creating student:', createStudentError);
        }
      }
    }

    if (studentDetails) {
      const cleanStudentData = createStudentData(studentDetails);
      setStudentData(cleanStudentData);
    } else {
      console.warn('Could not create or find student data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { 
    user, 
    profile, 
    studentData, 
    isLoading, 
    error,
    refetch
  };
}
