
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Edit, Trash2, Search, Filter, Download, Upload } from 'lucide-react';
import { Student, StudentWithClass, Major, Class, AcademicYear } from '@/types/student';
import { useToast } from '@/hooks/use-toast';
import { AddStudentDialog } from '@/components/student/AddStudentDialog';
import { EditStudentDialog } from '@/components/student/EditStudentDialog';
import { StudentFilters } from '@/components/student/StudentFilters';

export default function StudentManagement() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMajor, setSelectedMajor] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithClass | null>(null);

  const canManageStudents = hasRole('admin_sistem') || hasRole('admin_kesiswaan');
  const canViewStudents = canManageStudents || hasRole('wali_kelas') || hasRole('guru_bk') || 
                          hasRole('waka_kesiswaan') || hasRole('kepala_sekolah');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Fetch students with their current enrollment and class
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          student_enrollments!inner (
            id,
            class_id,
            academic_year_id,
            enrollment_date,
            status,
            created_at,
            updated_at,
            classes (
              id,
              name,
              grade,
              major_id,
              academic_year_id,
              homeroom_teacher_id,
              max_students,
              is_active,
              created_at,
              updated_at,
              majors (
                id,
                code,
                name,
                description,
                is_active,
                created_at,
                updated_at
              )
            ),
            academic_years (
              id,
              name,
              year_start,
              year_end,
              is_active,
              created_at,
              updated_at
            )
          )
        `)
        .eq('student_enrollments.academic_years.is_active', true)
        .order('full_name');

      if (studentsError) throw studentsError;

      // Transform the data
      const transformedStudents: StudentWithClass[] = studentsData.map(student => ({
        ...student,
        current_enrollment: student.student_enrollments[0],
        current_class: student.student_enrollments[0]?.classes
      }));

      setStudents(transformedStudents);
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

  const fetchMajors = async () => {
    try {
      const { data, error } = await supabase
        .from('majors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMajors(data || []);
    } catch (error) {
      console.error('Error fetching majors:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          majors (
            id,
            code,
            name
          ),
          academic_years (
            id,
            name,
            is_active
          )
        `)
        .eq('is_active', true)
        .eq('academic_years.is_active', true)
        .order('grade')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('year_start', { ascending: false });

      if (error) throw error;
      setAcademicYears(data || []);
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  useEffect(() => {
    if (canViewStudents) {
      fetchStudents();
      fetchMajors();
      fetchClasses();
      fetchAcademicYears();
    }
  }, [canViewStudents]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.nis.includes(searchTerm) ||
                         (student.nisn && student.nisn.includes(searchTerm));
    
    const matchesMajor = !selectedMajor || student.current_class?.major?.id === selectedMajor;
    const matchesClass = !selectedClass || student.current_class?.id === selectedClass;
    const matchesStatus = !selectedStatus || student.status === selectedStatus;
    const matchesGrade = !selectedGrade || student.current_class?.grade?.toString() === selectedGrade;

    return matchesSearch && matchesMajor && matchesClass && matchesStatus && matchesGrade;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      graduated: 'secondary',
      transferred: 'outline',
      dropped: 'destructive'
    } as const;

    const labels = {
      active: 'Aktif',
      graduated: 'Lulus',
      transferred: 'Pindah',
      dropped: 'Keluar'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (!canViewStudents) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertDescription>
            Anda tidak memiliki akses ke halaman ini. Hanya admin kesiswaan, wali kelas, guru BK, dan kepala sekolah yang dapat mengakses data siswa.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Siswa</h1>
          <p className="text-gray-600">Kelola data siswa dan informasi akademik</p>
        </div>
        <div className="flex gap-2">
          {canManageStudents && (
            <>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Siswa
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <StudentFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedMajor={selectedMajor}
        setSelectedMajor={setSelectedMajor}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedGrade={selectedGrade}
        setSelectedGrade={setSelectedGrade}
        majors={majors}
        classes={classes}
      />

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
          <CardDescription>
            Total: {filteredStudents.length} siswa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Jurusan</TableHead>
                    <TableHead>JK</TableHead>
                    <TableHead>Status</TableHead>
                    {canManageStudents && <TableHead>Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.nis}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>{student.current_class?.name || '-'}</TableCell>
                      <TableCell>{student.current_class?.major?.code || '-'}</TableCell>
                      <TableCell>{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      {canManageStudents && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingStudent(student)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {filteredStudents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={canManageStudents ? 7 : 6} className="text-center py-8 text-gray-500">
                        Tidak ada data siswa yang ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Dialog */}
      {showAddDialog && (
        <AddStudentDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={() => {
            fetchStudents();
            setShowAddDialog(false);
          }}
          majors={majors}
          classes={classes}
        />
      )}

      {/* Edit Student Dialog */}
      {editingStudent && (
        <EditStudentDialog
          open={!!editingStudent}
          onOpenChange={(open) => !open && setEditingStudent(null)}
          student={editingStudent}
          onSuccess={() => {
            fetchStudents();
            setEditingStudent(null);
          }}
          majors={majors}
          classes={classes}
        />
      )}
    </div>
  );
}
