
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

// Helper function to safely convert any database row to StudentData
const convertToStudentData = (row: Record<string, any>): StudentData => {
  return {
    id: row.id || '',
    user_id: row.user_id || null,
    nis: row.nis || '',
    nisn: row.nisn || null,
    full_name: row.full_name || '',
    gender: (row.gender === 'L' || row.gender === 'P') ? row.gender : 'L',
    birth_place: row.birth_place || null,
    birth_date: row.birth_date || null,
    religion: row.religion || null,
    address: row.address || null,
    phone: row.phone || null,
    parent_name: row.parent_name || null,
    parent_phone: row.parent_phone || null,
    parent_address: row.parent_address || null,
    admission_date: row.admission_date || '',
    graduation_date: row.graduation_date || null,
    status: (['active', 'graduated', 'transferred', 'dropped'].includes(row.status)) 
      ? row.status 
      : 'active',
    photo_url: row.photo_url || null,
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
    email: row.email || null
  };
};

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

    const { data, error } = await supabase
      .from('profiles')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const findOrCreateStudentRecord = async (userId: string, userEmail: string): Promise<StudentData> => {
    try {
      console.log('Finding/creating student record for:', userId, userEmail);
      
      // 1. Check for existing student linked to this user
      const { data: existingStudent, error: findError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding student:', findError);
        throw findError;
      }

      if (existingStudent) {
        console.log('Found existing linked student:', existingStudent);
        return convertToStudentData(existingStudent);
      }

      // 2. Look for student by email (unlinked)
      const { data: studentByEmail, error: emailError } = await supabase
        .from('students')
        .select('*')
        .eq('email', userEmail)
        .is('user_id', null)
        .maybeSingle();

      if (emailError && emailError.code !== 'PGRST116') {
        console.error('Error finding student by email:', emailError);
      }

      if (studentByEmail) {
        console.log('Found student by email, linking:', studentByEmail);
        
        // Link student to user
        const { error: linkError } = await supabase
          .from('students')
          .update({ user_id: userId })
          .eq('id', studentByEmail.id);

        if (linkError) {
          console.error('Error linking student:', linkError);
          throw linkError;
        }

        console.log('Successfully linked student to user');
        const linkedStudent = { ...studentByEmail, user_id: userId };
        return convertToStudentData(linkedStudent);
      }

      // 3. Create new student record
      console.log('Creating new student record for:', userEmail);
      const newStudentData = {
        user_id: userId,
        full_name: userEmail.split('@')[0] || 'Siswa Baru',
        nis: `AUTO${Date.now()}`,
        email: userEmail,
        gender: 'L',
        status: 'active',
        admission_date: new Date().toISOString().split('T')[0]
      };

      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert(newStudentData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating new student:', createError);
        throw createError;
      }

      console.log('Created new student:', newStudent);
      return convertToStudentData(newStudent);

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

      // Fetch or create profile
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      let currentProfile: UserProfile;

      if (profileError?.code === 'PGRST116') {
        // Profile doesn't exist, create new one
        currentProfile = await createProfile(currentUser.id, currentUser.email || '');
      } else if (profileError) {
        setError('Error fetching profile');
        setIsLoading(false);
        return;
      } else {
        currentProfile = profileData;
      }

      setProfile(currentProfile);

      // If role is siswa, ensure student data is available
      if (currentProfile.role === 'siswa' && currentUser.email) {
        try {
          const studentRecord = await findOrCreateStudentRecord(currentUser.id, currentUser.email);
          setStudentData(studentRecord);
          
          // Update profile with student_id if not set
          if (!currentProfile.student_id) {
            await supabase
              .from('profiles')
              .update({ student_id: studentRecord.id })
              .eq('id', currentUser.id);
          }
        } catch (studentError) {
          console.error('Error handling student data:', studentError);
          setError('Error linking student data: ' + (studentError as Error).message);
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
