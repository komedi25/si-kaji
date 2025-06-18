
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, Search, Plus } from 'lucide-react';
import { AddStudentDialog } from './AddStudentDialog';
import { Major, Class } from '@/types/student';

interface Student {
  id: string;
  nis: string;
  full_name: string;
  gender: string;
  class?: string;
  status: string;
}

export const StudentDataManager = () => {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  useEffect(() => {
    fetchStudents();
    if (hasRole('admin')) {
      fetchMajorsAndClasses();
    }
  }, [hasRole]);

  const fetchMajorsAndClasses = async () => {
    try {
      // Fetch majors
      const { data: majorsData, error: majorsError } = await supabase
        .from('majors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (majorsError) throw majorsError;

      // Fetch classes with major info
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          major:majors(*)
        `)
        .eq('is_active', true)
        .order('name');

      if (classesError) throw classesError;

      setMajors(majorsData || []);
      setClasses(classesData || []);
    } catch (error) {
      console.error('Error fetching majors and classes:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data jurusan dan kelas",
        variant: "destructive"
      });
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, nis, full_name, gender, status')
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data siswa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    setShowAddDialog(true);
  };

  const handleAddSuccess = () => {
    fetchStudents();
    setShowAddDialog(false);
    toast({
      title: "Berhasil",
      description: "Data siswa berhasil ditambahkan"
    });
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nis.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <span className="font-medium">Data Siswa ({filteredStudents.length})</span>
        </div>
        
        {hasRole('admin') && (
          <Button onClick={handleAddStudent}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Siswa
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari siswa berdasarkan nama atau NIS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{student.full_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-gray-600">
                <div>NIS: {student.nis}</div>
                <div>Jenis Kelamin: {student.gender}</div>
                <div>Status: {student.status}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Tidak ada data siswa yang ditemukan</p>
          </CardContent>
        </Card>
      )}

      {/* Add Student Dialog */}
      {showAddDialog && (
        <AddStudentDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={handleAddSuccess}
          majors={majors}
          classes={classes}
        />
      )}
    </div>
  );
};
