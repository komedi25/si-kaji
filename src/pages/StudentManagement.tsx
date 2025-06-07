
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AddStudentDialog } from '@/components/student/AddStudentDialog';
import { EditStudentDialog } from '@/components/student/EditStudentDialog';
import { StudentFilters } from '@/components/student/StudentFilters';
import { ExcelImport } from '@/components/student/ExcelImport';
import { ExcelExport } from '@/components/student/ExcelExport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Search, Edit, Upload, Download, Filter } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StudentWithClass, Major, Class } from '@/types/student';

export default function StudentManagement() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithClass | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          current_enrollment:student_enrollments!inner(
            classes!inner(
              id,
              name,
              grade,
              major:majors(
                id,
                name,
                code
              )
            )
          )
        `)
        .eq('student_enrollments.status', 'active');

      if (error) throw error;

      // Transform the data to match StudentWithClass interface
      const transformedData: StudentWithClass[] = (data || []).map(student => ({
        ...student,
        current_class: student.current_enrollment?.[0]?.classes || null
      }));

      setStudents(transformedData);
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

  const fetchMajorsAndClasses = async () => {
    try {
      const [majorsResult, classesResult] = await Promise.all([
        supabase.from('majors').select('*').eq('is_active', true),
        supabase.from('classes').select(`
          *,
          major:majors(id, name, code)
        `).eq('is_active', true)
      ]);

      if (majorsResult.error) throw majorsResult.error;
      if (classesResult.error) throw classesResult.error;

      setMajors(majorsResult.data || []);
      setClasses(classesResult.data || []);
    } catch (error) {
      console.error('Error fetching majors and classes:', error);
    }
  };

  useEffect(() => {
    if (hasRole('admin_kesiswaan') || hasRole('wali_kelas') || hasRole('guru_bk')) {
      fetchStudents();
      fetchMajorsAndClasses();
    }
  }, [hasRole]);

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nis?.includes(searchTerm) ||
      student.nisn?.includes(searchTerm);
    
    const matchesMajor = selectedMajor === '' || student.current_class?.major?.id === selectedMajor;
    const matchesClass = selectedClass === '' || student.current_class?.id === selectedClass;
    const matchesStatus = selectedStatus === '' || student.status === selectedStatus;
    const matchesGrade = selectedGrade === '' || student.current_class?.grade?.toString() === selectedGrade;

    return matchesSearch && matchesMajor && matchesClass && matchesStatus && matchesGrade;
  });

  const handleEditStudent = (student: StudentWithClass) => {
    setSelectedStudent(student);
    setShowEditDialog(true);
  };

  if (!hasRole('admin_kesiswaan') && !hasRole('wali_kelas') && !hasRole('guru_bk')) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md">
            <AlertDescription>
              Anda tidak memiliki akses ke halaman ini.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Siswa</h1>
            <p className="text-gray-600">Kelola data dan informasi siswa</p>
          </div>
          <div className="flex gap-2">
            <ExcelImport onImportComplete={fetchStudents} />
            <ExcelExport students={students} />
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Siswa
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Siswa Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {students.filter(s => s.status === 'active').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Siswa Lulus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {students.filter(s => s.status === 'graduated').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Siswa Pindah</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {students.filter(s => s.status === 'transferred').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama, NIS, atau NISN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
            
            {showFilters && (
              <div className="mt-4">
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Siswa</CardTitle>
            <CardDescription>
              Data lengkap siswa yang terdaftar di sekolah
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
                      <TableHead>Siswa</TableHead>
                      <TableHead>NIS</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={student.photo_url || ''} />
                              <AvatarFallback>
                                {student.full_name?.charAt(0).toUpperCase() || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{student.full_name}</div>
                              <div className="text-sm text-gray-500">{student.nisn}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{student.nis}</TableCell>
                        <TableCell>
                          {student.current_class ? (
                            <div>
                              <div className="font-medium">{student.current_class.name}</div>
                              <div className="text-sm text-gray-500">
                                {student.current_class.major?.name}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Belum ada kelas</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              student.status === 'active' ? 'default' :
                              student.status === 'graduated' ? 'secondary' :
                              student.status === 'transferred' ? 'outline' :
                              student.status === 'dropped' ? 'destructive' :
                              'destructive'
                            }
                          >
                            {student.status === 'active' ? 'Aktif' :
                             student.status === 'graduated' ? 'Lulus' :
                             student.status === 'transferred' ? 'Pindah' :
                             student.status === 'dropped' ? 'DO' :
                             'Tidak Aktif'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <AddStudentDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={fetchStudents}
          majors={majors}
          classes={classes}
        />

        {selectedStudent && (
          <EditStudentDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            student={selectedStudent}
            onSuccess={fetchStudents}
            majors={majors}
            classes={classes}
          />
        )}
      </div>
    </AppLayout>
  );
}
