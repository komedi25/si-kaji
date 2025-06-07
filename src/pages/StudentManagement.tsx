
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
import { Student } from '@/types/student';

export default function StudentManagement() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          current_class:classes(
            id,
            name,
            major:majors(
              id,
              name
            )
          )
        `)
        .eq('role', 'siswa');

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

  useEffect(() => {
    if (hasRole('admin_kesiswaan') || hasRole('wali_kelas') || hasRole('guru_bk')) {
      fetchStudents();
    }
  }, [hasRole]);

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nis?.includes(searchTerm) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditStudent = (student: Student) => {
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
                    placeholder="Cari nama, NIS, atau email..."
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
                <StudentFilters onFiltersChange={() => {}} />
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
                              <div className="text-sm text-gray-500">{student.email}</div>
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
                              'destructive'
                            }
                          >
                            {student.status === 'active' ? 'Aktif' :
                             student.status === 'graduated' ? 'Lulus' :
                             student.status === 'transferred' ? 'Pindah' :
                             student.status === 'dropped_out' ? 'DO' :
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
          onStudentAdded={fetchStudents}
        />

        {selectedStudent && (
          <EditStudentDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            student={selectedStudent}
            onStudentUpdated={fetchStudents}
          />
        )}
      </div>
    </AppLayout>
  );
}
