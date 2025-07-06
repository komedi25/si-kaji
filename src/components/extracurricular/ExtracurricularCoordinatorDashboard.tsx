
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, UserPlus, UserMinus, Search, Filter,
  Activity, Calendar, MapPin, Clock
} from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  nis: string;
  class_name?: string;
  grade?: number;
}

interface ExtracurricularWithEnrollments {
  id: string;
  name: string;
  description?: string;
  max_participants?: number;
  schedule_day?: string;
  schedule_time?: string;
  location?: string;
  current_participants: number;
  enrollments: Array<{
    id: string;
    enrollment_date: string;
    status: string;
    student: Student;
  }>;
}

interface AvailableStudent extends Student {
  current_extracurriculars: string[];
}

export const ExtracurricularCoordinatorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [extracurriculars, setExtracurriculars] = useState<ExtracurricularWithEnrollments[]>([]);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [selectedExtracurricular, setSelectedExtracurricular] = useState<string>('');
  const [searchStudent, setSearchStudent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExtracurriculars();
    fetchAvailableStudents();
  }, []);

  const fetchExtracurriculars = async () => {
    try {
      const { data: extracurricularData, error } = await supabase
        .from('extracurriculars')
        .select(`
          id,
          name,
          description,
          max_participants,
          schedule_day,
          schedule_time,
          location,
          extracurricular_enrollments!inner (
            id,
            enrollment_date,
            status,
            students!inner (
              id,
              full_name,
              nis
            )
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      const processedData: ExtracurricularWithEnrollments[] = (extracurricularData || []).map(item => {
        const activeEnrollments = item.extracurricular_enrollments?.filter(e => e.status === 'active') || [];
        
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          max_participants: item.max_participants,
          schedule_day: item.schedule_day,
          schedule_time: item.schedule_time,
          location: item.location,
          current_participants: activeEnrollments.length,
          enrollments: activeEnrollments.map(enrollment => ({
            id: enrollment.id,
            enrollment_date: enrollment.enrollment_date,
            status: enrollment.status,
            student: {
              id: enrollment.students.id,
              full_name: enrollment.students.full_name,
              nis: enrollment.students.nis
            }
          }))
        };
      });

      setExtracurriculars(processedData);
    } catch (error) {
      console.error('Error fetching extracurriculars:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data ekstrakurikuler',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const { data: studentsData, error } = await supabase
        .from('students')
        .select(`
          id,
          full_name,
          nis,
          student_enrollments!inner (
            classes!inner (
              name,
              grade
            )
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      // Get current extracurricular enrollments for each student
      const studentsWithExtracurriculars: AvailableStudent[] = [];

      for (const student of studentsData || []) {
        const { data: enrollments } = await supabase
          .from('extracurricular_enrollments')
          .select(`
            extracurriculars!inner (
              name
            )
          `)
          .eq('student_id', student.id)
          .eq('status', 'active');

        const currentExtracurriculars = enrollments?.map(e => e.extracurriculars.name) || [];
        const classInfo = student.student_enrollments?.[0]?.classes;

        studentsWithExtracurriculars.push({
          id: student.id,
          full_name: student.full_name,
          nis: student.nis,
          class_name: classInfo?.name,
          grade: classInfo?.grade,
          current_extracurriculars: currentExtracurriculars
        });
      }

      setAvailableStudents(studentsWithExtracurriculars);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleAddStudent = async (studentId: string, extracurricularId: string) => {
    try {
      const { error } = await supabase
        .from('extracurricular_enrollments')
        .insert({
          student_id: studentId,
          extracurricular_id: extracurricularId,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Siswa berhasil ditambahkan ke ekstrakurikuler'
      });

      fetchExtracurriculars();
      fetchAvailableStudents();
    } catch (error: any) {
      console.error('Error adding student:', error);
      if (error.code === '23505') {
        toast({
          title: 'Error',
          description: 'Siswa sudah terdaftar di ekstrakurikuler ini',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Gagal menambahkan siswa',
          variant: 'destructive'
        });
      }
    }
  };

  const handleRemoveStudent = async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from('extracurricular_enrollments')
        .update({ status: 'inactive' })
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Siswa berhasil dikeluarkan dari ekstrakurikuler'
      });

      fetchExtracurriculars();
      fetchAvailableStudents();
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengeluarkan siswa',
        variant: 'destructive'
      });
    }
  };

  const filteredStudents = availableStudents.filter(student =>
    student.full_name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    student.nis.includes(searchStudent)
  );

  const getEligibleStudents = (extracurricularId: string) => {
    const selectedExtra = extracurriculars.find(e => e.id === extracurricularId);
    if (!selectedExtra) return [];

    const enrolledStudentIds = selectedExtra.enrollments.map(e => e.student.id);
    
    return filteredStudents.filter(student => 
      !enrolledStudentIds.includes(student.id) &&
      (selectedExtra.max_participants ? 
        selectedExtra.current_participants < selectedExtra.max_participants : 
        true)
    );
  };

  if (loading) {
    return <div>Memuat data ekstrakurikuler...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Dashboard Koordinator Ekstrakurikuler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Kelola keanggotaan siswa di berbagai ekstrakurikuler sekolah.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="manage" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">Kelola Keanggotaan</TabsTrigger>
          <TabsTrigger value="overview">Overview Ekstrakurikuler</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Extracurricular List with Members */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Ekstrakurikuler & Anggota</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {extracurriculars.map((extracurricular) => (
                  <div key={extracurricular.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{extracurricular.name}</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {extracurricular.schedule_day && extracurricular.schedule_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {extracurricular.schedule_day}, {extracurricular.schedule_time}
                            </div>
                          )}
                          {extracurricular.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {extracurricular.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {extracurricular.current_participants}
                        {extracurricular.max_participants && `/${extracurricular.max_participants}`} siswa
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Anggota:</div>
                      {extracurricular.enrollments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada anggota</p>
                      ) : (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {extracurricular.enrollments.map((enrollment) => (
                            <div key={enrollment.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">{enrollment.student.full_name}</span>
                                <span className="text-muted-foreground ml-2">({enrollment.student.nis})</span>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <UserMinus className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Keluarkan Siswa</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin mengeluarkan {enrollment.student.full_name} dari {extracurricular.name}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemoveStudent(enrollment.id)}>
                                      Keluarkan
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            disabled={extracurricular.max_participants ? 
                              extracurricular.current_participants >= extracurricular.max_participants : 
                              false}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Tambah Siswa
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Tambah Siswa ke {extracurricular.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="relative">
                              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Cari siswa berdasarkan nama atau NIS..."
                                value={searchStudent}
                                onChange={(e) => setSearchStudent(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            
                            <div className="max-h-96 overflow-y-auto space-y-2">
                              {getEligibleStudents(extracurricular.id).map((student) => (
                                <div key={student.id} className="flex justify-between items-center p-3 border rounded">
                                  <div>
                                    <div className="font-medium">{student.full_name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      NIS: {student.nis}
                                      {student.class_name && ` • Kelas: ${student.grade} ${student.class_name}`}
                                    </div>
                                    {student.current_extracurriculars.length > 0 && (
                                      <div className="text-xs text-muted-foreground">
                                        Ekstrakurikuler: {student.current_extracurriculars.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                  <Button 
                                    size="sm"
                                    onClick={() => handleAddStudent(student.id, extracurricular.id)}
                                  >
                                    Tambah
                                  </Button>
                                </div>
                              ))}
                              
                              {getEligibleStudents(extracurricular.id).length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                  {searchStudent ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Semua siswa sudah terdaftar atau ekstrakurikuler sudah penuh'}
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistik Cepat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">{extracurriculars.length}</div>
                    <div className="text-sm text-muted-foreground">Total Ekstrakurikuler</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {extracurriculars.reduce((sum, e) => sum + e.current_participants, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Peserta</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">{availableStudents.length}</div>
                    <div className="text-sm text-muted-foreground">Total Siswa Aktif</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">
                      {availableStudents.filter(s => s.current_extracurriculars.length === 0).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Belum Ada Ekstrakurikuler</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extracurriculars.map((extracurricular) => (
              <Card key={extracurricular.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    {extracurricular.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {extracurricular.description && (
                    <p className="text-sm text-muted-foreground mb-3">{extracurricular.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    {extracurricular.schedule_day && extracurricular.schedule_time && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{extracurricular.schedule_day}, {extracurricular.schedule_time}</span>
                      </div>
                    )}
                    
                    {extracurricular.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{extracurricular.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {extracurricular.current_participants}
                        {extracurricular.max_participants && ` / ${extracurricular.max_participants}`}
                        {' peserta'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Kapasitas:</span>
                      <Badge variant={
                        extracurricular.max_participants && 
                        extracurricular.current_participants >= extracurricular.max_participants 
                          ? 'destructive' : 'default'
                      }>
                        {extracurricular.max_participants ? 
                          `${Math.round((extracurricular.current_participants / extracurricular.max_participants) * 100)}%` :
                          'Unlimited'
                        }
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
