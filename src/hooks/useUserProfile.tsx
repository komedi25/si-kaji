
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

      if (profileError) {
        console.error('Profile error:', profileError);
        
        // If profile doesn't exist, try to create one
        if (profileError.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: currentUser.id,
              role: 'siswa',
              full_name: currentUser.email || 'Unknown User'
            })
            .select()
            .single();

          if (createError) {
            setError('Gagal membuat profil. Hubungi admin untuk bantuan.');
            setIsLoading(false);
            return;
          }

          setProfile(newProfile as UserProfile);
        } else {
          setError('Profil tidak ditemukan. Hubungi admin untuk bantuan.');
          setIsLoading(false);
          return;
        }
      } else {
        setProfile(profileData as UserProfile);
      }

      // 3. If role is 'siswa', get or create student data
      const currentProfile = profileData || profile;
      if (currentProfile?.role === 'siswa') {
        let studentDetails = null;

        if (currentProfile.student_id) {
          // Get existing student data
          const { data: existingStudent, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('id', currentProfile.student_id)
            .single();

          if (!studentError && existingStudent) {
            studentDetails = existingStudent;
          }
        }

        // If no student data found, try to find by email or create new one
        if (!studentDetails) {
          // Try to find student by email
          const { data: studentByEmail } = await supabase
            .from('students')
            .select('*')
            .eq('email', currentUser.email)
            .maybeSingle();

          if (studentByEmail) {
            // Link existing student to profile
            await supabase
              .from('profiles')
              .update({ student_id: studentByEmail.id })
              .eq('id', currentUser.id);

            studentDetails = studentByEmail;
          } else {
            // Create new student record
            const { data: newStudent, error: createStudentError } = await supabase
              .from('students')
              .insert({
                user_id: currentUser.id,
                full_name: currentProfile.full_name || currentUser.email || 'Siswa Baru',
                nis: `AUTO${Date.now()}`, // Generate temporary NIS
                gender: 'L', // Default gender, can be updated later
                status: 'active',
                admission_date: new Date().toISOString().split('T')[0],
                email: currentUser.email
              })
              .select()
              .single();

            if (!createStudentError && newStudent) {
              // Link new student to profile
              await supabase
                .from('profiles')
                .update({ student_id: newStudent.id })
                .eq('id', currentUser.id);

              studentDetails = newStudent;
            }
          }
        }

        if (studentDetails) {
          const cleanStudentData = createStudentData(studentDetails);
          setStudentData(cleanStudentData);
        } else {
          console.warn('Could not create or find student data');
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
      setIsLoading(false);
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
