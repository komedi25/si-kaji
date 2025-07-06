
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

// Database row type (what we get from Supabase)
interface StudentDatabaseRow {
  id: string;
  user_id: string | null;
  nis: string;
  nisn: string | null;
  full_name: string;
  gender: string;
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
  status: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
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
      return data;
    } catch (err) {
      console.error('Error creating profile:', err);
      throw err;
    }
  };

  const convertDatabaseRowToStudentData = (row: StudentDatabaseRow): StudentData => {
    return {
      ...row,
      gender: (row.gender === 'L' || row.gender === 'P') ? row.gender : 'L', // Default to 'L' if invalid
      status: (row.status === 'active' || row.status === 'graduated' || row.status === 'transferred' || row.status === 'dropped') 
        ? row.status as 'active' | 'graduated' | 'transferred' | 'dropped'
        : 'active' // Default to 'active' if invalid
    };
  };

  const findStudentByUserId = async (userId: string): Promise<StudentData | null> => {
    try {
      console.log('Finding student by user_id:', userId);
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error finding student by user_id:', error);
        throw error;
      }

      if (data) {
        console.log('Found student by user_id:', data);
        return convertDatabaseRowToStudentData(data);
      }

      return null;
    } catch (error) {
      console.error('Error in findStudentByUserId:', error);
      throw error;
    }
  };

  const findOrCreateStudentRecord = async (userId: string, userEmail: string, profileId: string) => {
    try {
      // 1. Cari student yang sudah ada berdasarkan user_id
      let existingStudent = await findStudentByUserId(userId);
      if (existingStudent) {
        console.log('Found existing student by user_id:', existingStudent);
        return existingStudent;
      }

      // 2. Jika belum ada, cari berdasarkan email pattern di NIS
      const emailPrefix = userEmail.split('@')[0];
      const { data: studentByNis, error: nisError } = await supabase
        .from('students')
        .select('*')
        .ilike('nis', `%${emailPrefix}%`)
        .is('user_id', null)
        .eq('status', 'active')
        .maybeSingle();

      if (nisError && nisError.code !== 'PGRST116') {
        console.error('Error finding student by NIS:', nisError);
      }

      if (studentByNis) {
        console.log('Found student by NIS pattern, linking...', studentByNis);
        
        // Link student ke user
        const { error: updateError } = await supabase
          .from('students')
          .update({ user_id: userId })
          .eq('id', studentByNis.id);

        if (updateError) {
          console.error('Error linking student to user:', updateError);
          throw updateError;
        }

        // Update profile dengan student_id
        await supabase
          .from('profiles')
          .update({ student_id: studentByNis.id })
          .eq('id', profileId);

        return convertDatabaseRowToStudentData({ ...studentByNis, user_id: userId });
      }

      // 3. Buat student record baru sebagai fallback
      console.log('Creating new student record for:', userEmail);
      const newStudentData = {
        user_id: userId,
        full_name: userEmail.split('@')[0] || 'Siswa Baru',
        nis: `SIS${Date.now()}`,
        gender: 'L',
        status: 'active',
        admission_date: new Date().toISOString().split('T')[0]
      };

      const { data: newStudent, error } = await supabase
        .from('students')
        .insert(newStudentData)
        .select()
        .single();

      if (error) throw error;

      // Update profile dengan student_id baru
      await supabase
        .from('profiles')
        .update({ student_id: newStudent.id })
        .eq('id', profileId);

      console.log('Created new student:', newStudent);
      return convertDatabaseRowToStudentData(newStudent);

    } catch (error) {
      console.error('Error in findOrCreateStudentRecord:', error);
      throw error;
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

      // Fetch atau create profile
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      let currentProfile: UserProfile;

      if (profileError?.code === 'PGRST116') {
        // Profile tidak ada, buat baru
        currentProfile = await createProfile(currentUser.id, currentUser.email || '');
      } else if (profileError) {
        setError('Error fetching profile');
        setIsLoading(false);
        return;
      } else {
        currentProfile = profileData;
      }

      setProfile(currentProfile);

      // Jika role adalah siswa, pastikan data siswa tersedia
      if (currentProfile.role === 'siswa' && currentUser.email) {
        try {
          const studentRecord = await findOrCreateStudentRecord(
            currentUser.id, 
            currentUser.email, 
            currentUser.id
          );
          setStudentData(studentRecord);
        } catch (studentError) {
          console.error('Error handling student data:', studentError);
          setError('Error linking student data');
        }
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
