
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
}

// Helper function to validate gender
function validateGender(gender: any): gender is 'L' | 'P' {
  return gender === 'L' || gender === 'P';
}

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

          setProfile(newProfile);
        } else {
          setError('Profil tidak ditemukan. Hubungi admin untuk bantuan.');
          setIsLoading(false);
          return;
        }
      } else {
        setProfile(profileData);
      }

      // 3. If role is 'siswa' and has student_id, get student details
      const currentProfile = profileData || profile;
      if (currentProfile?.role === 'siswa') {
        if (currentProfile.student_id) {
          const { data: studentDetails, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('id', currentProfile.student_id)
            .single();

          if (studentError) {
            console.error('Student data error:', studentError);
            setError('Data siswa tidak ditemukan. Hubungi admin untuk menautkan akun Anda.');
            setIsLoading(false);
            return;
          }

          // Validate gender before setting state
          if (!validateGender(studentDetails.gender)) {
            console.error('Invalid gender value:', studentDetails.gender);
            setError('Data siswa tidak valid. Hubungi admin untuk memperbaiki data.');
            setIsLoading(false);
            return;
          }

          setStudentData(studentDetails as StudentData);
        } else {
          // Try to auto-link based on email
          const { data: autoLinkResult } = await supabase.rpc('link_profile_to_student', {
            profile_id: currentUser.id,
            student_identifier: currentUser.email
          });

          if (autoLinkResult) {
            // Refetch profile after auto-linking
            const { data: updatedProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single();

            if (updatedProfile?.student_id) {
              const { data: studentDetails } = await supabase
                .from('students')
                .select('*')
                .eq('id', updatedProfile.student_id)
                .single();

              if (studentDetails && validateGender(studentDetails.gender)) {
                setProfile(updatedProfile);
                setStudentData(studentDetails as StudentData);
              }
            }
          } else {
            setError('Akun Anda belum terhubung dengan data siswa. Hubungi admin untuk menautkan akun.');
            setIsLoading(false);
            return;
          }
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
