
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { StudentFilters } from '@/components/student/StudentFilters';
import { AddStudentDialog } from '@/components/student/AddStudentDialog';
import { EditStudentDialog } from '@/components/student/EditStudentDialog';
import { ExcelImport } from '@/components/student/ExcelImport';
import { ExcelExport } from '@/components/student/ExcelExport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Upload, Download, Search, Filter } from 'lucide-react';
import { Student, Class, Major, StudentWithClass } from '@/types/student';

interface LocalStudentWithClass extends Student {
  current_class: {
    id: string;
    name: string;
    grade: number;
    major?: {
      name: string;
    };
  } | null;
}

interface LocalMajor extends Major {
  // Already compatible with Major type
}

interface LocalClass {
  id: string;
  name: string;
  grade: number;
  major_id?: string;
  academic_year_id?: string;
  homeroom_teacher_id?: string;
  max_students?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  major?: {
    name: string;
  };
}

export default function StudentManagement() {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<LocalStudentWithClass | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    class: 'all',
    status: 'all'
  });

  // Fetch majors and classes for dialog props
  const { data: majors } = useQuery({
    queryKey: ['majors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('majors')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as LocalMajor[] || [];
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          major:majors(name)
        `)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as LocalClass[] || [];
    },
  });

  const { data: students, isLoading, refetch } = useQuery({
    queryKey: ['students', filters],
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select(`
          *,
          current_enrollment:student_enrollments!inner(
            classes!inner(
              id,
              name,
              grade,
              major:majors(name)
            )
          )
        `)
        .order('full_name');

      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,nis.ilike.%${filters.search}%`);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(student => ({
        ...student,
        current_class: student.current_enrollment?.[0]?.classes || null
      })) as LocalStudentWithClass[];
    },
    enabled: !!user,
  });

  const handleEditStudent = (student: LocalStudentWithClass) => {
    setSelectedStudent(student);
    setShowEditDialog(true);
  };

  const handleImportComplete = () => {
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Aktif', variant: 'default' as const },
      graduated: { label: 'Lulus', variant: 'secondary' as const },
      dropped_out: { label: 'Drop Out', variant: 'destructive' as const },
      transferred: { label: 'Pindah', variant: 'outline' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Convert LocalStudentWithClass to StudentWithClass for the ExcelExport component
  const convertedStudents: StudentWithClass[] = students?.map(student => ({
    ...student,
    current_class: student.current_class ? {
      ...student.current_class,
      major_id: '', // Add required properties
      academic_year_id: '',
      homeroom_teacher_id: '',
      max_students: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      major: student.current_class.major ? {
        id: '',
        code: '',
        name: student.current_class.major.name,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } : undefined
    } as Class : undefined
  })) || [];

  // Convert LocalClass to Class for the dialog components
  const convertedClasses: Class[] = classes?.map(cls => ({
    ...cls,
    major: cls.major ? {
      id: '',
      code: '',
      name: cls.major.name,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } : undefined
  })) || [];

  // Convert selectedStudent to StudentWithClass for EditStudentDialog
  const convertedSelectedStudent: StudentWithClass | null = selectedStudent ? {
    ...selectedStudent,
    current_class: selectedStudent.current_class ? {
      ...selectedStudent.current_class,
      major_id: '',
      academic_year_id: '',
      homeroom_teacher_id: '',
      max_students: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      major: selectedStudent.current_class.major ? {
        id: '',
        code: '',
        name: selectedStudent.current_class.major.name,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } : undefined
    } as Class : undefined
  } : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Siswa</h1>
            <p className="text-muted-foreground">
              Kelola data siswa, pendaftaran, dan informasi akademik
            </p>
          </div>
        </div>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Daftar Siswa</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <StudentFilters filters={filters} onFiltersChange={setFilters} />
              <div className="flex gap-2">
                <ExcelExport 
                  students={convertedStudents} 
                  filename="data-siswa-smkn1kendal" 
                />
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Siswa
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-100 rounded"></div>
                        <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : students?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada siswa ditemukan</h3>
                  <p className="text-gray-500 text-center mb-4">
                    Tidak ada siswa yang sesuai dengan filter yang diterapkan.
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Siswa Pertama
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students?.map((student) => (
                  <Card key={student.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{student.full_name}</CardTitle>
                          <CardDescription className="text-sm">
                            NIS: {student.nis} • NISN: {student.nisn || '-'}
                          </CardDescription>
                        </div>
                        {getStatusBadge(student.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Kelas:</span>{' '}
                          {student.current_class?.name || 'Belum ada kelas'}
                        </div>
                        <div>
                          <span className="font-medium">Jurusan:</span>{' '}
                          {student.current_class?.major?.name || '-'}
                        </div>
                        <div>
                          <span className="font-medium">Jenis Kelamin:</span>{' '}
                          {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </div>
                        {student.phone && (
                          <div>
                            <span className="font-medium">HP:</span> {student.phone}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditStudent(student)}
                        >
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Data Siswa
                </CardTitle>
                <CardDescription>
                  Import data siswa dari file CSV. Pastikan format sesuai dengan template yang disediakan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExcelImport onImportComplete={handleImportComplete} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AddStudentDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog}
          majors={majors || []}
          classes={convertedClasses}
          onSuccess={() => {
            setShowAddDialog(false);
            refetch();
          }}
        />

        {convertedSelectedStudent && (
          <EditStudentDialog 
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            student={convertedSelectedStudent}
            majors={majors || []}
            classes={convertedClasses}
            onSuccess={() => {
              setShowEditDialog(false);
              setSelectedStudent(null);
              refetch();
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
