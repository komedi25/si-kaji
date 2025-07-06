
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

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const createProfile = async (userId: string, email: string): Promise<UserProfile> => {
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

    return {
      id: data.id,
      role: data.role,
      student_id: data.student_id,
      teacher_id: data.teacher_id,
      full_name: data.full_name,
      avatar_url: data.avatar_url,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  };

  const findStudentByEmail = async (email: string) => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    return data;
  };

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

  const linkProfileToStudent = async (profileId: string, studentId: string) => {
    await supabase
      .from('profiles')
      .update({ student_id: studentId })
      .eq('id', profileId);
  };

  const convertToStudentData = (rawData: any): StudentData => {
    return {
      id: rawData.id || '',
      user_id: rawData.user_id || null,
      nis: rawData.nis || '',
      nisn: rawData.nisn || null,
      full_name: rawData.full_name || '',
      gender: rawData.gender === 'P' ? 'P' : 'L',
      birth_place: rawData.birth_place || null,
      birth_date: rawData.birth_date || null,
      religion: rawData.religion || null,
      address: rawData.address || null,
      phone: rawData.phone || null,
      parent_name: rawData.parent_name || null,
      parent_phone: rawData.parent_phone || null,
      parent_address: rawData.parent_address || null,
      admission_date: rawData.admission_date || '',
      graduation_date: rawData.graduation_date || null,
      status: rawData.status || 'active',
      photo_url: rawData.photo_url || null,
      created_at: rawData.created_at || '',
      updated_at: rawData.updated_at || '',
      email: rawData.email || null
    };
  };

  const handleStudentData = async (currentUser: User, currentProfile: UserProfile) => {
    try {
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
        const cleanStudentData = convertToStudentData(studentDetails);
        setStudentData(cleanStudentData);
      } else {
        console.warn('Could not create or find student data');
      }
    } catch (error) {
      console.error('Error handling student data:', error);
    }
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
            currentProfile = await createProfile(currentUser.id, currentUser.email || '');
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
        currentProfile = {
          id: profileData.id,
          role: profileData.role,
          student_id: profileData.student_id,
          teacher_id: profileData.teacher_id,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          created_at: profileData.created_at,
          updated_at: profileData.updated_at
        };
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

  const refetch = async () => {
    await fetchData();
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
