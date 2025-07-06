
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, Clock, MapPin, User, Plus, Search, Filter,
  CheckCircle, XCircle, Eye
} from 'lucide-react';

interface ExtracurricularWithDetails {
  id: string;
  name: string;
  description?: string;
  schedule_day?: string;
  schedule_time?: string;
  location?: string;
  max_participants?: number;
  current_participants: number;
  coach_name?: string;
  enrollments: Array<{
    id: string;
    student_name: string;
    student_nis: string;
    student_class?: string;
    enrollment_date: string;
    status: string;
  }>;
}

interface EnrollmentRequest {
  id: string;
  student_id: string;
  student_name: string;
  student_nis: string;
  student_class?: string;
  extracurricular_name: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export const EnhancedExtracurricularEnrollment = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [extracurriculars, setExtracurriculars] = useState<ExtracurricularWithDetails[]>([]);
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [students, setStudents] = useState<Array<{id: string; full_name: string; nis: string; class_name?: string}>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExtracurriculars();
    if (hasRole('koordinator_ekstrakurikuler') || hasRole('admin')) {
      fetchEnrollmentRequests();
      fetchStudents();
    }
  }, [hasRole]);

  const fetchExtracurriculars = async () => {
    try {
      const { data, error } = await supabase
        .from('extracurriculars')
        .select(`
          id,
          name,
          description,
          schedule_day,
          schedule_time,
          location,
          max_participants,
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

      const processedData: ExtracurricularWithDetails[] = (data || []).map(item => {
        const activeEnrollments = item.extracurricular_enrollments?.filter(e => e.status === 'active') || [];
        
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          schedule_day: item.schedule_day,
          schedule_time: item.schedule_time,
          location: item.location,
          max_participants: item.max_participants,
          current_participants: activeEnrollments.length,
          enrollments: activeEnrollments.map(enrollment => ({
            id: enrollment.id,
            student_name: enrollment.students.full_name,
            student_nis: enrollment.students.nis,
            enrollment_date: enrollment.enrollment_date,
            status: enrollment.status
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

  const fetchEnrollmentRequests = async () => {
    try {
      // This would fetch pending enrollment requests
      // For now, we'll use sample data
      const sampleRequests: EnrollmentRequest[] = [
        {
          id: '1',
          student_id: 'std1',
          student_name: 'Ahmad Rizki',
          student_nis: '12345',
          student_class: 'XI RPL 1',
          extracurricular_name: 'Pramuka',
          requested_at: new Date().toISOString(),
          status: 'pending'
        }
      ];
      
      setEnrollmentRequests(sampleRequests);
    } catch (error) {
      console.error('Error fetching enrollment requests:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
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

      const processedStudents = (data || []).map(student => ({
        id: student.id,
        full_name: student.full_name,
        nis: student.nis,
        class_name: student.student_enrollments?.[0]?.classes ? 
          `${student.student_enrollments[0].classes.grade} ${student.student_enrollments[0].classes.name}` : 
          undefined
      }));

      setStudents(processedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleManualEnrollment = async (extracurricularId: string) => {
    if (!selectedStudent) {
      toast({
        title: "Error",
        description: "Pilih siswa terlebih dahulu",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('extracurricular_enrollments')
        .insert({
          student_id: selectedStudent,
          extracurricular_id: extracurricularId,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: "Berhasil",
        description: "Siswa berhasil didaftarkan ke ekstrakurikuler"
      });

      setSelectedStudent('');
      fetchExtracurriculars();
    } catch (error: any) {
      console.error('Error enrolling student:', error);
      if (error.code === '23505') {
        toast({
          title: "Error",
          description: "Siswa sudah terdaftar di ekstrakurikuler ini",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Gagal mendaftarkan siswa",
          variant: "destructive"
        });
      }
    }
  };

  const handleApproveRequest = async (requestId: string, approved: boolean) => {
    try {
      // Update request status
      setEnrollmentRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: approved ? 'approved' : 'rejected' }
            : req
        )
      );

      toast({
        title: approved ? "Disetujui" : "Ditolak",
        description: `Permohonan pendaftaran ${approved ? 'disetujui' : 'ditolak'}`
      });

      if (approved) {
        fetchExtracurriculars();
      }
    } catch (error) {
      console.error('Error handling request:', error);
      toast({
        title: "Error",
        description: "Gagal memproses permohonan",
        variant: "destructive"
      });
    }
  };

  const filteredExtracurriculars = extracurriculars.filter(extra =>
    extra.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    extra.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = enrollmentRequests.filter(req =>
    filterStatus === 'all' || req.status === filterStatus
  );

  if (loading) {
    return <div>Memuat data ekstrakurikuler...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manajemen Pendaftaran Ekstrakurikuler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {hasRole('koordinator_ekstrakurikuler') || hasRole('admin') 
              ? 'Kelola pendaftaran siswa ke ekstrakurikuler dan proses permohonan pendaftaran'
              : 'Daftarkan siswa ke ekstrakurikuler yang tersedia'
            }
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="extracurriculars" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="extracurriculars">Ekstrakurikuler</TabsTrigger>
          {(hasRole('koordinator_ekstrakurikuler') || hasRole('admin')) && (
            <>
              <TabsTrigger value="requests">Permohonan Pendaftaran</TabsTrigger>
              <TabsTrigger value="bulk-manage">Kelola Massal</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="extracurriculars" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari ekstrakurikuler..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExtracurriculars.map((extra) => (
              <Card key={extra.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{extra.name}</span>
                    <Badge variant={
                      extra.max_participants && extra.current_participants >= extra.max_participants 
                        ? 'destructive' : 'default'
                    }>
                      {extra.current_participants}
                      {extra.max_participants && `/${extra.max_participants}`}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {extra.description && (
                    <p className="text-sm text-muted-foreground">{extra.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    {extra.schedule_day && extra.schedule_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{extra.schedule_day}, {extra.schedule_time}</span>
                      </div>
                    )}
                    
                    {extra.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{extra.location}</span>
                      </div>
                    )}

                    {extra.coach_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{extra.coach_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {(hasRole('koordinator_ekstrakurikuler') || hasRole('admin')) && (
                      <div className="space-y-2">
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih siswa untuk didaftarkan" />
                          </SelectTrigger>
                          <SelectContent>
                            {students
                              .filter(student => !extra.enrollments.some(e => e.student_nis === student.nis))
                              .map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.full_name} ({student.nis})
                                  {student.class_name && ` - ${student.class_name}`}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          onClick={() => handleManualEnrollment(extra.id)}
                          disabled={!selectedStudent || (extra.max_participants ? extra.current_participants >= extra.max_participants : false)}
                          className="w-full"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Daftarkan Siswa
                        </Button>
                      </div>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Anggota ({extra.current_participants})
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Anggota {extra.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {extra.enrollments.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">
                              Belum ada anggota terdaftar
                            </p>
                          ) : (
                            extra.enrollments.map((enrollment, index) => (
                              <div key={enrollment.id} className="flex justify-between items-center p-2 border rounded">
                                <div>
                                  <div className="font-medium">{enrollment.student_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    NIS: {enrollment.student_nis}
                                    {enrollment.student_class && ` • ${enrollment.student_class}`}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(enrollment.enrollment_date).toLocaleDateString('id-ID')}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {(hasRole('koordinator_ekstrakurikuler') || hasRole('admin')) && (
          <TabsContent value="requests" className="space-y-4">
            <div className="flex gap-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Permohonan Pendaftaran</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {filterStatus === 'all' ? 'Belum ada permohonan pendaftaran' : `Tidak ada permohonan dengan status ${filterStatus}`}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="font-medium">{request.student_name}</div>
                            <div className="text-sm text-muted-foreground">
                              NIS: {request.student_nis}
                              {request.student_class && ` • Kelas: ${request.student_class}`}
                            </div>
                            <div className="text-sm">
                              Mengajukan ke: <span className="font-medium">{request.extracurricular_name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Diajukan: {new Date(request.requested_at).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              request.status === 'pending' ? 'secondary' :
                              request.status === 'approved' ? 'default' : 'destructive'
                            }>
                              {request.status === 'pending' ? 'Menunggu' :
                               request.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                            </Badge>
                            
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleApproveRequest(request.id, true)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Setujui
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleApproveRequest(request.id, false)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Tolak
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
