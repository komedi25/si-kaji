
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
    const now = new Date().toISOString();
    
    const insertData = {
      id: userId,
      role: 'siswa',
      full_name: email || 'Unknown User',
      student_id: null,
      teacher_id: null,
      avatar_url: null,
      created_at: now,
      updated_at: now
    };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const result: UserProfile = {
        id: data.id,
        role: data.role,
        student_id: data.student_id,
        teacher_id: data.teacher_id,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return result;
    } catch (err) {
      console.error('Error creating profile:', err);
      throw err;
    }
  };

  const findStudentByUserId = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error finding student by user_id:', error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Exception in findStudentByUserId:', err);
      return null;
    }
  };

  const findStudentByEmail = async (email: string) => {
    try {
      // Try to find student by matching email patterns in NIS or full_name
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .or(`nis.ilike.%${email.split('@')[0]}%,full_name.ilike.%${email.split('@')[0]}%`)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) {
        console.error('Error finding student by email pattern:', error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Exception in findStudentByEmail:', err);
      return null;
    }
  };

  const createStudentRecord = async (userId: string, fullName: string, email: string) => {
    const studentInsertData = {
      user_id: userId,
      full_name: fullName || 'Siswa Baru',
      nis: `${Date.now()}`,
      gender: 'L' as const,
      status: 'active' as const,
      admission_date: new Date().toISOString().split('T')[0]
    };

    try {
      const { data, error } = await supabase
        .from('students')
        .insert(studentInsertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error creating student:', err);
      throw err;
    }
  };

  const linkProfileToStudent = async (profileId: string, studentId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ student_id: studentId })
        .eq('id', profileId);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error linking profile to student:', err);
      throw err;
    }
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

      // 1. Try to get existing student data if already linked
      if (currentProfile.student_id) {
        try {
          const { data: existingStudent } = await supabase
            .from('students')
            .select('*')
            .eq('id', currentProfile.student_id)
            .single();

          if (existingStudent) {
            studentDetails = existingStudent;
          }
        } catch (err) {
          console.error('Error fetching existing student:', err);
        }
      }

      // 2. If no student data found, try various methods to find or create
      if (!studentDetails) {
        // Try to find by user_id first
        studentDetails = await findStudentByUserId(currentUser.id);

        // If not found by user_id, try by email pattern
        if (!studentDetails && currentUser.email) {
          studentDetails = await findStudentByEmail(currentUser.email);
        }

        // If still not found, create new student record
        if (!studentDetails) {
          try {
            studentDetails = await createStudentRecord(
              currentUser.id,
              currentProfile.full_name || currentUser.email || '',
              currentUser.email || ''
            );
            console.log('Created new student record:', studentDetails);
          } catch (createStudentError) {
            console.error('Error creating student:', createStudentError);
          }
        }

        // Link the found/created student to profile
        if (studentDetails) {
          await linkProfileToStudent(currentUser.id, studentDetails.id);
        }
      }

      if (studentDetails) {
        const cleanStudentData = convertToStudentData(studentDetails);
        setStudentData(cleanStudentData);
        setError(null);
      } else {
        setError('Tidak dapat menemukan atau membuat data siswa');
      }
    } catch (error) {
      console.error('Error handling student data:', error);
      setError('Terjadi kesalahan saat memproses data siswa');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
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

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      let currentProfile: UserProfile;

      if (profileError) {
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

      // Always try to handle student data for users with siswa role
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
